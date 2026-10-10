/* Offer Ready: state.
   localStorage wrapper (guarded, with an in-memory fallback), export/import, resume tracking,
   activity log, flashcard SRS (SM-2 style), problem review queue, and an IndexedDB document store. */
(function () {
  'use strict';
  var OR = window.OR;
  var KEY = 'offer-ready:v1';
  var VERSION = 1;
  var STATUSES = ['todo', 'attempted', 'solved', 'clean', 'review'];
  var REVIEW_STEPS = [1, 3, 7, 14, 30]; // days between cold re-solves

  var mem = null;
  var health = { ok: true, full: false, corruptKey: null, lastError: '' };
  var saveTimer = null;

  function defaults() {
    return {
      app: 'offer-ready',
      version: VERSION,
      createdAt: Date.now(),
      settings: {
        onboarded: false, lang: 'py', theme: 'system', motion: 'system',
        level: 'ds-half', targetDate: '2027-05-01', weeklyHours: 12,
        startDate: OR.today(), restDay: 0, newCardsPerDay: 20
      },
      plan: null,
      activity: {},
      session: {},
      problems: {},
      topics: {},
      cards: {},
      detective: { byPattern: {}, log: [] },
      quizzes: {},
      mocks: [],
      stories: [],
      storyLinks: {},
      pipeline: [],
      companies: [],
      resume: {},
      coverLetters: [],
      resources: {},
      drafts: {},
      place: null,
      scroll: {},
      history: []
    };
  }

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  // Coerce any parsed object into a valid state. Unknown keys are dropped and wrong types fall back to defaults.
  function sanitize(data) {
    if (!isObj(data)) throw new Error('Backup data is not an object.');
    var d = defaults(), out = {};
    Object.keys(d).forEach(function (k) {
      var def = d[k], v = data[k];
      if (v === undefined) { out[k] = def; return; }
      if (Array.isArray(def)) out[k] = Array.isArray(v) ? v.filter(function (x) { return x !== null && typeof x === 'object'; }) : def;
      else if (isObj(def) || def === null) out[k] = (isObj(v) || (def === null && v === null)) ? v : def;
      else out[k] = typeof v === typeof def ? v : def;
    });
    // Settings: known keys only, typed.
    var s = {}, ds = d.settings, ins = isObj(data.settings) ? data.settings : {};
    Object.keys(ds).forEach(function (k) { s[k] = (ins[k] !== undefined && typeof ins[k] === typeof ds[k]) ? ins[k] : ds[k]; });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.targetDate)) s.targetDate = ds.targetDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.startDate)) s.startDate = ds.startDate;
    if (['py', 'js', 'java', 'cpp'].indexOf(s.lang) < 0) s.lang = 'py';
    if (['system', 'light', 'dark'].indexOf(s.theme) < 0) s.theme = 'system';
    if (['system', 'reduce', 'full'].indexOf(s.motion) < 0) s.motion = 'system';
    s.weeklyHours = OR.clamp(Math.round(s.weeklyHours) || 12, 2, 60);
    out.settings = s;
    // Problem records must carry a known status.
    Object.keys(out.problems).forEach(function (n) {
      var p = out.problems[n];
      if (!isObj(p) || STATUSES.indexOf(p.status) < 0) delete out.problems[n];
    });
    if (!isObj(out.detective.byPattern)) out.detective = d.detective;
    out.app = 'offer-ready';
    out.version = VERSION;
    return out;
  }

  // SM-2 style schedule. Returns a new card record; the input is not modified.
  function nextCard(prev, g, today) {
    var c = Object.assign({ ease: 2.5, interval: 0, reps: 0, lapses: 0 }, prev || {});
    if (g <= 1) {
      c.lapses += 1; c.reps = 0; c.interval = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.due = today;
    } else {
      if (c.reps === 0) c.interval = g === 4 ? 4 : 1;
      else if (c.reps === 1) c.interval = g === 4 ? 6 : g === 3 ? 3 : 2;
      else c.interval = Math.max(c.interval + 1, Math.round(c.interval * (g === 2 ? 1.2 : g === 4 ? c.ease * 1.3 : c.ease)));
      if (g === 2) c.ease = Math.max(1.3, c.ease - 0.15);
      if (g === 4) c.ease = Math.min(3, c.ease + 0.15);
      c.reps += 1;
      c.due = OR.addDays(today, c.interval);
    }
    c.last = today; c.lastGrade = g; c.seen = (c.seen || 0) + 1;
    return c;
  }

  function isQuota(e) { return e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || /quota/i.test(e.message || '')); }

  function trimForSpace() {
    var keys = Object.keys(mem.scroll).sort(function (a, b) { return (mem.scroll[b].at || 0) - (mem.scroll[a].at || 0); });
    keys.slice(60).forEach(function (k) { delete mem.scroll[k]; });
    mem.history = mem.history.slice(0, 15);
    mem.detective.log = (mem.detective.log || []).slice(-300);
  }

  function persist() {
    clearTimeout(saveTimer); saveTimer = null;
    if (!health.ok) return false;
    var json = JSON.stringify(mem);
    try { localStorage.setItem(KEY, json); health.full = false; return true; }
    catch (e) {
      if (isQuota(e)) {
        trimForSpace();
        try { localStorage.setItem(KEY, JSON.stringify(mem)); health.full = false; return true; }
        catch (e2) { health.full = true; health.lastError = 'Browser storage is full.'; OR.emit('storage'); return false; }
      }
      health.ok = false; health.lastError = (e && e.message) || 'Storage unavailable';
      OR.emit('storage');
      return false;
    }
  }
  function schedule() { if (!saveTimer) saveTimer = setTimeout(persist, 250); }

  var store = (OR.store = {
    KEY: KEY,
    VERSION: VERSION,
    STATUSES: STATUSES,
    REVIEW_STEPS: REVIEW_STEPS,
    defaults: defaults,
    sanitize: sanitize,

    init: function () {
      var raw = null;
      try { raw = localStorage.getItem(KEY); }
      catch (e) { health.ok = false; health.lastError = 'Storage is blocked in this browser window.'; }
      if (raw) {
        try { mem = sanitize(JSON.parse(raw)); }
        catch (e) {
          // Keep the unreadable copy so nothing is silently destroyed.
          mem = defaults();
          health.corruptKey = KEY + ':unreadable-' + Date.now();
          try { localStorage.setItem(health.corruptKey, raw); } catch (_) { health.corruptKey = null; }
        }
      } else mem = defaults();
      return mem;
    },
    health: function () { return health; },
    get: function () { return mem; },
    update: function (fn) { fn(mem); schedule(); OR.emit('state'); },
    flush: function () { if (saveTimer) persist(); },

    /* ----- Resume + scroll memory ----- */
    setPlace: function (p) {
      var prev = mem.place;
      p.at = Date.now();
      mem.place = p;
      if (!prev || prev.hash !== p.hash || !mem.history.length || mem.history[0].hash !== p.hash) {
        mem.history = [{ hash: p.hash, title: p.title, section: p.section || '', at: p.at }]
          .concat(mem.history.filter(function (h) { return h.hash !== p.hash; })).slice(0, 15);
      } else {
        mem.history[0].title = p.title; mem.history[0].section = p.section || ''; mem.history[0].at = p.at;
      }
      schedule();
    },
    setScroll: function (hash, y, frac) { mem.scroll[hash] = { y: Math.round(y), frac: Math.round(frac * 1000) / 1000, at: Date.now() }; schedule(); },
    getScroll: function (hash) { return mem.scroll[hash] || null; },

    /* ----- Activity log ----- */
    day: function (date) {
      date = date || OR.today();
      var a = mem.activity[date];
      if (!a) a = mem.activity[date] = { min: 0, solved: 0, cards: 0, quiz: 0, lessons: 0 };
      return a;
    },
    logMinutes: function (date, minutes) { store.day(date).min += Math.max(0, Math.round(minutes)); schedule(); OR.emit('state'); },
    // Pattern Detective: a pick is scored against the pattern that was right.
    detectiveAnswer: function (key, topic, pick) {
      var d = mem.detective, b = d.byPattern[topic] = d.byPattern[topic] || { right: 0, total: 0 }, ok = pick === topic;
      b.total += 1; if (ok) b.right += 1;
      d.log.push({ key: key, topic: topic, pick: pick, ok: ok, date: OR.today() });
      // Spaced repetition per case: a miss comes back today, a hit comes back after 1, 3, 7, 14, then 30 days.
      var cs = d.cases = d.cases || {}, c = cs[key] = cs[key] || { stage: 0, right: 0, wrong: 0 };
      if (ok) { c.right += 1; c.due = OR.addDays(OR.today(), [1, 3, 7, 14, 30][Math.min(c.stage, 4)]); c.stage += 1; }
      else { c.wrong += 1; c.stage = 0; c.due = OR.today(); }
      c.last = OR.today();
      if (d.log.length > 300) d.log = d.log.slice(-300);
      schedule(); OR.emit('state');
      return ok;
    },
    logActivity: function (field, n, date) { var d = store.day(date); d[field] = (d[field] || 0) + (n || 1); schedule(); },

    /* ----- Problems + review queue ----- */
    problem: function (num) { return mem.problems[num] || { status: 'todo' }; },
    setProblem: function (num, patch) {
      var p = mem.problems[num] || { status: 'todo', notes: '', minutes: 0, hints: 0, attempts: [] };
      var wasSolved = p.status === 'solved' || p.status === 'clean';
      Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
      p.updated = Date.now();
      var nowSolved = p.status === 'solved' || p.status === 'clean';
      if (nowSolved && !wasSolved) {
        p.solvedAt = p.solvedAt || OR.today();
        // A clean solve (no hints, no solution) skips the 1-day step; anything that needed help starts there.
        var first = p.status === 'clean' && !p.hints && !p.sawSolution ? 1 : 0;
        if (!p.review) p.review = { stage: first, due: OR.addDays(OR.today(), REVIEW_STEPS[first]), log: [] };
        store.logActivity('solved', 1);
      }
      if (p.status === 'review' && !p.review) p.review = { stage: 0, due: OR.today(), log: [] };
      mem.problems[num] = p;
      schedule(); OR.emit('state');
      return p;
    },
    // Record a cold re-solve from the review queue. ok=false when hints or the solution were needed.
    reviewProblem: function (num, ok) {
      var p = mem.problems[num]; if (!p) return null;
      var r = p.review || (p.review = { stage: 0, due: OR.today(), log: [] });
      r.log = (r.log || []).concat([{ date: OR.today(), ok: !!ok }]).slice(-20);
      if (ok) {
        r.stage += 1;
        if (r.stage >= REVIEW_STEPS.length) { r.done = true; r.due = null; }
        else r.due = OR.addDays(OR.today(), REVIEW_STEPS[r.stage]);
      } else { r.stage = 0; r.done = false; r.due = OR.addDays(OR.today(), REVIEW_STEPS[0]); }
      if (p.status === 'review' && ok) p.status = 'solved';
      schedule(); OR.emit('state');
      return r;
    },
    reviewDue: function (date) {
      date = date || OR.today();
      return Object.keys(mem.problems).filter(function (n) {
        var r = mem.problems[n].review;
        return r && !r.done && r.due && r.due <= date;
      }).map(Number);
    },

    /* ----- Flashcards (SM-2 style). grade: 1 again, 2 hard, 3 good, 4 easy ----- */
    card: function (id) { return mem.cards[id] || null; },
    gradeCard: function (id, g) {
      var isNew = !mem.cards[id], c = nextCard(mem.cards[id], g, OR.today());
      mem.cards[id] = c;
      store.logActivity('cards', 1);
      if (isNew) store.logActivity('newCards', 1); // counts against settings.newCardsPerDay
      schedule(); OR.emit('state');
      return c;
    },
    // Days until the card would come back after grade g, without changing it.
    previewCard: function (id, g) { return nextCard(mem.cards[id], g, OR.today()).interval; },
    // Due = reviewed before and due today or earlier. New cards are counted separately.
    cardIsDue: function (id, date) { var c = mem.cards[id]; return !!(c && c.due && c.due <= (date || OR.today())); },
    cardIsNew: function (id) { return !mem.cards[id]; },
    // 0..1 retention for a set of card ids: mature (interval >= 7 days) counts fully, learning counts half.
    retention: function (ids) {
      if (!ids.length) return 0;
      var s = 0;
      ids.forEach(function (id) { var c = mem.cards[id]; if (!c) return; if (c.interval >= 7) s += 1; else if (c.reps >= 1 && c.lastGrade >= 3) s += 0.5; });
      return s / ids.length;
    },

    /* ----- Export / import / reset ----- */
    exportPayload: async function (includeDocs) {
      store.flush();
      var payload = { app: 'offer-ready', version: VERSION, exportedAt: new Date().toISOString(), data: JSON.parse(JSON.stringify(mem)), docs: [] };
      if (includeDocs !== false) {
        try {
          var recs = await OR.docs.list();
          for (var i = 0; i < recs.length; i++) {
            var r = recs[i], meta = {};
            Object.keys(r).forEach(function (k) { if (k !== 'blob') meta[k] = r[k]; });
            meta.data = r.blob ? await blobToDataURL(r.blob) : null;
            payload.docs.push(meta);
          }
        } catch (e) { payload.docsError = 'Documents could not be read: ' + e.message; }
      }
      return payload;
    },
    exportFile: async function () {
      try {
        var payload = await store.exportPayload(true);
        download(JSON.stringify(payload), 'offer-ready-backup-' + OR.today() + '.json', 'application/json');
        mem.settings.lastExport = Date.now(); schedule();
        OR.toast('Backup downloaded' + (payload.docs.length ? ' with ' + OR.plural(payload.docs.length, 'document') : '') + '.', { tone: 'ok' });
      } catch (e) { OR.toast('Export failed: ' + e.message, { tone: 'error' }); }
    },
    // Parse and validate without touching current state.
    parseBackup: function (text) {
      var obj;
      try { obj = JSON.parse(text); } catch (e) { throw new Error('This file isn’t valid JSON, so it can’t be an Offer Ready backup.'); }
      if (!isObj(obj) || obj.app !== 'offer-ready' || !isObj(obj.data)) throw new Error('This file isn’t an Offer Ready backup (it has no Offer Ready data inside).');
      if (typeof obj.version === 'number' && obj.version > VERSION) throw new Error('This backup comes from a newer version of Offer Ready. Update the app files, then import again.');
      var state = sanitize(obj.data);
      var docs = Array.isArray(obj.docs) ? obj.docs.filter(function (d) { return isObj(d) && typeof d.id === 'string'; }) : [];
      return { state: state, docs: docs, exportedAt: obj.exportedAt || '', summary: store.summarize(state, docs.length) };
    },
    summarize: function (s, nDocs) {
      var solved = Object.keys(s.problems).filter(function (n) { return s.problems[n].status === 'solved' || s.problems[n].status === 'clean'; }).length;
      var minutes = Object.keys(s.activity).reduce(function (t, d) { return t + ((s.activity[d] && s.activity[d].min) || 0); }, 0);
      return { solved: solved, cards: Object.keys(s.cards).length, minutes: minutes, stories: s.stories.length, applications: s.pipeline.length, docs: nDocs || 0 };
    },
    applyBackup: async function (parsed) {
      mem = parsed.state;
      persist();
      if (parsed.docs) {
        try {
          await OR.docs.clear();
          for (var i = 0; i < parsed.docs.length; i++) {
            var d = Object.assign({}, parsed.docs[i]);
            d.blob = d.data ? dataURLToBlob(d.data) : null;
            delete d.data;
            await OR.docs.put(d);
          }
        } catch (e) { OR.toast('Progress restored, but documents could not be saved: ' + e.message, { tone: 'error' }); }
      }
      OR.emit('state'); OR.emit('restored');
    },
    // Swap in a merged state without the "restored" jump to Today (used by cloud sync).
    replaceState: function (state) { mem = state; persist(); OR.emit('state'); },
    reset: async function (alsoDocs) {
      var keepTheme = mem.settings.theme;
      mem = defaults();
      mem.settings.theme = keepTheme;
      persist();
      if (alsoDocs) { try { await OR.docs.clear(); } catch (e) { /* storage may be unavailable */ } }
      OR.emit('state'); OR.emit('restored');
    },
    downloadUnreadable: function () {
      if (!health.corruptKey) return;
      try { download(localStorage.getItem(health.corruptKey) || '', 'offer-ready-unreadable-' + OR.today() + '.json', 'application/json'); } catch (e) { /* nothing to recover */ }
    },
    dismissUnreadable: function () { try { localStorage.removeItem(health.corruptKey); } catch (e) { /* ignore */ } health.corruptKey = null; }
  });

  /* ----- File helpers ----- */
  function download(text, name, type) {
    var blob = text instanceof Blob ? text : new Blob([text], { type: type || 'application/octet-stream' });
    // iPhone apps (WKWebView) ignore <a download>; the share sheet is how a file reaches Files, iCloud Drive or AirDrop.
    if (/iPhone|iPad/.test(navigator.userAgent) && navigator.canShare) {
      var file = new File([blob], name, { type: blob.type });
      if (navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(function () { /* cancelled */ }); return; }
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  OR.download = download;
  OR.dataURL = { toBlob: function (u) { return dataURLToBlob(u); }, fromBlob: function (b) { return blobToDataURL(b); } };
  function blobToDataURL(blob) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { rej(fr.error); }; fr.readAsDataURL(blob); });
  }
  function dataURLToBlob(url) {
    var m = String(url).match(/^data:([^;,]*)(;base64)?,(.*)$/);
    if (!m) return null;
    var bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: m[1] || 'application/octet-stream' });
  }
  OR.blobToDataURL = blobToDataURL;
  OR.readFileText = function (file) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { rej(fr.error); }; fr.readAsText(file); });
  };

  /* ----- IndexedDB document store (resume PDFs, cover letters) ----- */
  OR.docs = (function () {
    var dbp = null;
    function db() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        if (!window.indexedDB) { rej(new Error('This browser has no IndexedDB, so files can’t be stored.')); return; }
        var req;
        try { req = indexedDB.open('offer-ready', 1); } catch (e) { rej(e); return; }
        req.onupgradeneeded = function () { if (!req.result.objectStoreNames.contains('docs')) req.result.createObjectStore('docs', { keyPath: 'id' }); };
        req.onsuccess = function () { res(req.result); };
        req.onerror = function () { rej(req.error || new Error('Could not open the document store.')); };
        req.onblocked = function () { rej(new Error('The document store is open in another tab.')); };
      });
      dbp.catch(function () { dbp = null; });
      return dbp;
    }
    function run(mode, fn) {
      return db().then(function (d) {
        return new Promise(function (res, rej) {
          var t = d.transaction('docs', mode), req = fn(t.objectStore('docs'));
          t.oncomplete = function () { res(req ? req.result : undefined); };
          t.onerror = function () { rej(t.error); };
          t.onabort = function () { rej(t.error || new Error('Storage transaction aborted (the disk may be full).')); };
        });
      });
    }
    return {
      put: function (rec) { return run('readwrite', function (s) { return s.put(rec); }); },
      get: function (id) { return run('readonly', function (s) { return s.get(id); }); },
      list: function () { return run('readonly', function (s) { return s.getAll(); }); },
      remove: function (id) { return run('readwrite', function (s) { return s.delete(id); }); },
      clear: function () { return run('readwrite', function (s) { return s.clear(); }); }
    };
  })();
})();
