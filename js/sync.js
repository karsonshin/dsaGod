/* Offer Ready: cloud sync through a private GitHub repository you own.
   Progress is one JSON file (offer-ready/state.json) and stored documents are another (offer-ready/docs.json), written with the
   GitHub Contents API using a fine-grained token that you paste on each device. The token lives only in that browser
   (localStorage, never in a backup). Every device that connects to the same repo sees the same history: each change is
   pushed a few seconds later, and each device pulls on open, on return to the tab, and once a minute. If two devices changed
   things at once, the states are merged (see merge()) instead of one overwriting the other. */
(function () {
  'use strict';
  var OR = window.OR, KEY = 'offer-ready:sync', API = 'https://api.github.com', STATE = 'offer-ready/state.json', DOCS = 'offer-ready/docs.json';
  var busy = false, queued = false, pushTimer = null, applying = false, status = { text: '', error: '', at: 0 };

  /* ---------- Local settings (this browser only) ---------- */
  function cfg() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function setCfg(patch) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(cfg(), patch))); } catch (e) { /* storage blocked */ } }
  function connected() { var c = cfg(); return !!(c.repo && c.token); }

  /* ---------- Small helpers ---------- */
  function toB64(text) { var b = new TextEncoder().encode(text), bin = '', n = 0x8000; for (var i = 0; i < b.length; i += n) bin += String.fromCharCode.apply(null, b.subarray(i, i + n)); return btoa(bin); }
  function fromB64(s) { var bin = atob(s.replace(/\s/g, '')), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function device() { var c = cfg(); if (c.device) return c.device; var d = Math.random().toString(36).slice(2, 8); setCfg({ device: d }); return d; }
  function announce() { OR.emit('sync', status); }

  /* ---------- GitHub Contents API ---------- */
  async function gh(method, path, body, accept, etag) {
    var c = cfg(), headers = { Authorization: 'Bearer ' + c.token, Accept: accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (body) headers['Content-Type'] = 'application/json';
    if (etag) headers['If-None-Match'] = etag;
    var res;
    try { res = await fetch(API + '/repos/' + c.repo + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }); }
    catch (e) { throw new Error('Offline, or GitHub could not be reached.'); }
    if (res.status === 401) throw new Error('GitHub rejected the token. Make a new one and reconnect.');
    if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') throw new Error('GitHub rate limit reached. It will retry later.');
    return res;
  }
  // Resolves { sha, text, etag } or null when the file does not exist yet, or { unchanged: true } on a 304.
  async function getFile(path, etag) {
    var res = await gh('GET', '/contents/' + path, null, null, etag);
    if (res.status === 304) return { unchanged: true };
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('GitHub answered ' + res.status + ' reading ' + path + '.');
    var j = await res.json(), text;
    if (j.content && j.encoding === 'base64') text = fromB64(j.content);
    else { var raw = await gh('GET', '/contents/' + path, null, 'application/vnd.github.raw+json'); if (!raw.ok) throw new Error('GitHub answered ' + raw.status + ' reading ' + path + '.'); text = await raw.text(); }
    return { sha: j.sha, text: text, etag: res.headers.get('etag') };
  }
  // Returns the new sha. Throws { conflict: true } when the file changed since `sha`.
  async function putFile(path, text, sha) {
    var res = await gh('PUT', '/contents/' + path, { message: 'sync from ' + device() + ' ' + new Date().toISOString(), content: toB64(text), sha: sha || undefined });
    if (res.status === 409 || res.status === 422) { var e = new Error('conflict'); e.conflict = true; throw e; }
    if (res.status === 404) throw new Error('The token cannot write to that repository. Give it Contents: Read and write.');
    if (!res.ok) throw new Error('GitHub answered ' + res.status + ' writing ' + path + '.');
    return (await res.json()).content.sha;
  }

  /* ---------- Merge two states (a, b); `pa` says a is the side that changed more recently ---------- */
  function newer(x, y, field) { return (x && x[field] || 0) >= (y && y[field] || 0); }
  function union(la, lb, keyOf) { var seen = {}, out = []; la.concat(lb).forEach(function (it) { var k = keyOf(it); if (!seen[k]) { seen[k] = 1; out.push(it); } }); return out; }
  function sig(it) { return it && it.id != null ? 'id:' + it.id : JSON.stringify(it); }
  function deepMerge(a, b, pa) {
    if (isObj(a) && isObj(b)) { var o = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { o[k] = k in a ? (k in b ? deepMerge(a[k], b[k], pa) : a[k]) : b[k]; }); return o; }
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if (Array.isArray(a) && Array.isArray(b)) return union(pa ? a : b, pa ? b : a, sig);
    return pa ? a : b;
  }
  function pickBy(a, b, better) { // per-key record choice for dictionaries of records
    var out = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { out[k] = !(k in b) ? a[k] : !(k in a) ? b[k] : better(a[k], b[k]) ? a[k] : b[k]; }); return out;
  }
  function merge(a, b, pa) {
    var o = {};
    Object.keys(a).forEach(function (k) { o[k] = a[k]; });
    Object.keys(b).forEach(function (k) { if (!(k in o)) o[k] = b[k]; });
    o.settings = Object.assign({}, pa ? b.settings : a.settings, pa ? a.settings : b.settings, { onboarded: !!(a.settings.onboarded || b.settings.onboarded) });
    o.plan = (pa ? a.plan : b.plan) || a.plan || b.plan;
    o.activity = {}; Object.keys(a.activity).concat(Object.keys(b.activity)).forEach(function (d) { o.activity[d] = deepMerge(a.activity[d] || {}, b.activity[d] || {}, pa); });
    o.problems = pickBy(a.problems, b.problems, function (x, y) { return newer(x, y, 'updated'); });
    o.topics = deepMerge(a.topics, b.topics, pa);
    o.cards = pickBy(a.cards, b.cards, function (x, y) { return (x.seen || 0) > (y.seen || 0) || ((x.seen || 0) === (y.seen || 0) && String(x.last || '') >= String(y.last || '')); });
    o.detective = {
      byPattern: pickBy(a.detective.byPattern, b.detective.byPattern, function (x, y) { return (x.total || 0) >= (y.total || 0); }),
      cases: pickBy(a.detective.cases || {}, b.detective.cases || {}, function (x, y) { return String(x.last || '') >= String(y.last || ''); }),
      log: union(a.detective.log, b.detective.log, function (e) { return e.key + '|' + e.date + '|' + e.pick; }).sort(function (x, y) { return String(x.date) < String(y.date) ? -1 : 1; }).slice(-300)
    };
    o.quizzes = pickBy(a.quizzes, b.quizzes, function (x, y) { return Object.keys(x.checked || {}).length >= Object.keys(y.checked || {}).length; });
    ['mocks', 'stories', 'pipeline', 'companies', 'coverLetters'].forEach(function (k) { o[k] = union(pa ? a[k] : b[k], pa ? b[k] : a[k], sig); });
    o.storyLinks = deepMerge(a.storyLinks, b.storyLinks, pa);
    o.resume = deepMerge(a.resume, b.resume, pa);
    o.resources = deepMerge(a.resources, b.resources, pa);
    o.drafts = deepMerge(a.drafts, b.drafts, pa);
    o.place = newer(a.place, b.place, 'at') ? a.place : b.place;
    o.scroll = pickBy(a.scroll, b.scroll, function (x, y) { return newer(x, y, 'at'); });
    o.history = union(a.history.concat(b.history).sort(function (x, y) { return (y.at || 0) - (x.at || 0); }), [], function (h) { return h.hash; }).slice(0, 15);
    return o;
  }
  function isBlank(s) { return !s.settings.onboarded && !Object.keys(s.activity).length && !Object.keys(s.problems).length; }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /* ---------- Documents (IndexedDB) ---------- */
  function wrapDocs() {
    ['put', 'remove', 'clear'].forEach(function (name) {
      var orig = OR.docs[name]; if (!orig) return;
      OR.docs[name] = function () { var r = orig.apply(OR.docs, arguments); if (!applying) { setCfg({ docsDirty: true }); schedule(); } return r; };
    });
  }
  async function docsToPayload() {
    var recs = await OR.docs.list(), out = [];
    for (var i = 0; i < recs.length; i++) { var r = recs[i], meta = {}; Object.keys(r).forEach(function (k) { if (k !== 'blob') meta[k] = r[k]; }); meta.data = r.blob ? await OR.dataURL.fromBlob(r.blob) : null; out.push(meta); }
    return out;
  }
  async function syncDocs(c) {
    var remote = await getFile(DOCS, c.docsEtag), local = await OR.docs.list(), have = {};
    local.forEach(function (d) { have[d.id] = 1; });
    var changedRemote = remote && !remote.unchanged && remote.sha !== c.docsSha, missingRemote = [];
    if (changedRemote) {
      var rd = (JSON.parse(remote.text).docs || []);
      applying = true;
      try { for (var i = 0; i < rd.length; i++) { var d = Object.assign({}, rd[i]); if (have[d.id]) continue; d.blob = d.data ? OR.dataURL.toBlob(d.data) : null; delete d.data; await OR.docs.put(d); have[d.id] = 1; } }
      finally { applying = false; }
      setCfg({ docsSha: remote.sha, docsEtag: remote.etag });
      c = cfg();
    }
    var remoteIds = {}; if (remote && !remote.unchanged) (JSON.parse(remote.text).docs || []).forEach(function (d) { remoteIds[d.id] = 1; });
    var all = await OR.docs.list();
    var needPush = c.docsDirty || (!remote && all.length) || (remote && !remote.unchanged && all.some(function (d) { return !remoteIds[d.id]; }));
    if (needPush) {
      var sha = remote && !remote.unchanged ? remote.sha : c.docsSha;
      var newSha = await putFile(DOCS, JSON.stringify({ v: 1, docs: await docsToPayload() }), sha);
      setCfg({ docsSha: newSha, docsEtag: null, docsDirty: false });
    } else if (c.docsDirty) setCfg({ docsDirty: false });
  }

  /* ---------- The sync pass ---------- */
  async function pass() {
    var c = cfg(), local = OR.store.get(), remote = await getFile(STATE, c.etag), pushState = false, sha = c.sha;
    if (remote && !remote.unchanged) {
      var parsed = OR.store.parseBackup(remote.text), rstate = parsed.state, rsaved = JSON.parse(remote.text).savedAt || 0;
      if (remote.sha !== c.sha) {
        if (isBlank(local)) { applying = true; OR.store.replaceState(rstate); applying = false; setCfg({ dirty: false }); }
        else {
          var merged = merge(local, rstate, (c.changedAt || 0) >= rsaved);
          if (!same(merged, local)) { applying = true; OR.store.replaceState(OR.store.parseBackup(JSON.stringify({ app: 'offer-ready', data: merged })).state); applying = false; }
          pushState = !same(merged, rstate);
        }
      } else pushState = !!c.dirty;
      sha = remote.sha; setCfg({ etag: remote.etag });
    } else if (remote && remote.unchanged) pushState = !!c.dirty;
    else pushState = true; // nothing in the repo yet: this device seeds it
    if (pushState) {
      var body = JSON.stringify({ app: 'offer-ready', version: OR.store.get().version, v: 1, savedAt: Date.now(), device: device(), data: OR.store.get() });
      sha = await putFile(STATE, body, sha);
      setCfg({ etag: null, dirty: false });
    }
    setCfg({ sha: sha });
    await syncDocs(cfg());
  }

  async function sync(reason) {
    if (!connected()) return;
    if (busy) { queued = true; return; }
    busy = true; clearTimeout(pushTimer);
    status.error = '';
    try {
      OR.store.flush();
      for (var tries = 0; tries < 3; tries++) {
        try { await pass(); break; }
        catch (e) { if (e.conflict && tries < 2) { setCfg({ etag: null, sha: null }); continue; } throw e; }
      }
      status.at = Date.now(); setCfg({ lastSync: status.at });
    } catch (e) { status.error = e.message || 'Sync failed.'; }
    busy = false; announce();
    if (queued) { queued = false; schedule(); }
  }
  function schedule() { clearTimeout(pushTimer); pushTimer = setTimeout(function () { sync('change'); }, 12000); }

  OR.sync = {
    connected: connected,
    status: function () { var c = cfg(); return { connected: connected(), repo: c.repo || '', at: status.at || c.lastSync || 0, error: status.error, busy: busy }; },
    connect: async function (repo, token) {
      repo = String(repo || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Write the repository as owner/name, for example karsonshin/offer-ready-data.');
      if (!token) throw new Error('Paste the token.');
      var prev = cfg(); setCfg({ repo: repo, token: token.trim(), sha: null, etag: null, docsSha: null, docsEtag: null, dirty: true });
      var res = await gh('GET', '', null);
      if (res.status === 404) { setCfg({ repo: prev.repo || '', token: prev.token || '' }); throw new Error('That repository was not found, or the token cannot see it. Check the name and that the token is limited to it.'); }
      if (!res.ok) { setCfg({ repo: prev.repo || '', token: prev.token || '' }); throw new Error('GitHub answered ' + res.status + '.'); }
      var info = await res.json();
      if (info.permissions && info.permissions.push === false) { setCfg({ repo: prev.repo || '', token: prev.token || '' }); throw new Error('The token can read but not write. Give it Contents: Read and write.'); }
      await sync('connect'); announce();
      if (status.error) throw new Error(status.error);
    },
    disconnect: function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } status = { text: '', error: '', at: 0 }; announce(); },
    now: function () { return sync('manual'); }
  };

  wrapDocs();
  OR.on('state', function () { if (applying || !connected()) return; setCfg({ dirty: true, changedAt: Date.now() }); schedule(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (cfg().dirty || cfg().docsDirty) sync('hide'); } else sync('show'); });
  setInterval(function () { if (!document.hidden) sync('poll'); }, 60000);
  setTimeout(function () { sync('open'); }, 1500);
})();
