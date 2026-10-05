/* Offer Ready: Behavioral studio (#/behavioral, #/behavioral/:tab).
   Tabs: method (STAR(L)), stories (story bank + coverage grid), questions (bank + Amazon LPs + story links),
   practice (2-minute timer + self-check rubric), ask (questions for your interviewer).
   Persists in store keys `stories`, `storyLinks`, and drafts['behavioral:log'] (practice log). Content: data/behavioral.js. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, B = OR.behavioral;
  var TABS = [['method', 'Method'], ['stories', 'Story bank'], ['questions', 'Questions'], ['practice', 'Practice'], ['ask', 'Ask them']];
  var RUBRIC = [
    ['structure', 'Structure', 'Situation, task, action, result in order, with no wandering.'],
    ['specific', 'Specificity', 'Real details: names of systems, steps, decisions, not generalities.'],
    ['ownership', 'Ownership', 'I said “I” for my actions and was clear about my part.'],
    ['result', 'Result with numbers', 'A concrete outcome, quantified where honest.'],
    ['learning', 'Learning', 'Said what I do differently now.'],
    ['length', 'Length', 'Finished in about 2 minutes or less.']
  ];
  var LOG = 'behavioral:log', LIMIT = 120;

  function comp(id) { for (var i = 0; i < B.competencies.length; i++) if (B.competencies[i].id === id) return B.competencies[i]; return null; }
  function compName(id) { var c = comp(id); return c ? c.name : id; }
  function stories() { return OR.store.get().stories; }
  function storyById(id) { var a = stories(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function sTitle(s) { return (s.title || '').trim() || 'Untitled story'; }
  function compsOf(s) { return Array.isArray(s.comps) ? s.comps : []; }
  function linksFor(qid) {
    var l = OR.store.get().storyLinks[qid]; if (!Array.isArray(l)) return [];
    return l.filter(function (id) { return !!storyById(id); });
  }
  function log() { var l = OR.store.get().drafts[LOG]; return Array.isArray(l) ? l : []; }
  function ensureIds() {
    if (stories().some(function (s) { return !s.id; })) OR.store.update(function (m) { m.stories.forEach(function (s) { if (!s.id) s.id = OR.uid(); }); });
  }
  // Keyword suggestion from the story's own words. Only a hint; the owner confirms with the checkboxes.
  function suggest(s) {
    var t = [s.title, s.situation, s.task, s.action, s.result, s.learning, s.metrics, s.tags].join(' ').toLowerCase();
    return B.competencies.filter(function (c) { return c.kw.some(function (k) { return t.indexOf(k) >= 0; }); }).map(function (c) { return c.id; });
  }
  function filled(s) { return ['situation', 'task', 'action', 'result', 'learning'].filter(function (k) { return (s[k] || '').trim(); }).length; }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }

  function tabsHTML(cur) {
    return '<nav class="bh-tabs" aria-label="Behavioral sections">' + TABS.map(function (t) {
      return '<a href="#/behavioral/' + t[0] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
    }).join('') + '</nav>';
  }

  /* ---------- Method ---------- */
  function methodTab(host) {
    var pick = 0;
    host.innerHTML =
      '<section class="bh-sec" aria-labelledby="bh-star"><h2 id="bh-star" class="section-title">STAR(L) in five parts</h2>' +
      '<p class="muted bh-lede">A structure that keeps you specific. The “share” is roughly how much of a two-minute answer each part deserves.</p>' +
      '<ol class="bh-star">' + B.star.map(function (p) {
        return '<li><span class="bh-star-k" aria-hidden="true">' + p.k + '</span><div><h3>' + p.name + ' <span class="faint num">about ' + p.share + '</span></h3><p>' + esc(p.body) + '</p></div></li>';
      }).join('') + '</ol></section>' +
      '<section class="bh-sec" aria-labelledby="bh-ex"><h2 id="bh-ex" class="section-title">Weak and strong, side by side</h2>' +
      '<div class="seg bh-seg" role="group" aria-label="Competency example">' + B.examples.map(function (e, i) {
        return '<button type="button" data-ex="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(compName(e.comp)) + '</button>';
      }).join('') + '</div><div id="bh-ex-body"></div></section>' +
      '<section class="bh-sec" aria-labelledby="bh-tips"><h2 id="bh-tips" class="section-title">Delivery</h2>' +
      '<ul class="bh-tips">' + B.tips.map(function (t) { return '<li><h3>' + esc(t.h) + '</h3><p>' + esc(t.b) + '</p></li>'; }).join('') + '</ul>' +
      '<div class="btn-row"><a class="btn btn-primary" href="#/behavioral/stories">Build your story bank</a><a class="btn" href="#/behavioral/practice">Practice an answer</a></div></section>';
    function paintEx() {
      var e = B.examples[pick];
      OR.$('#bh-ex-body', host).innerHTML = '<p class="bh-q">“' + esc(e.q) + '”</p><div class="bh-pair">' +
        '<article class="bh-ans bh-weak"><h3>' + OR.icon('x', 'icon-sm') + 'Weak</h3><p>' + esc(e.weak) + '</p></article>' +
        '<article class="bh-ans bh-strong"><h3>' + OR.icon('check', 'icon-sm') + 'Strong</h3><p>' + esc(e.strong) + '</p></article></div>' +
        '<p class="bh-why"><strong>Why it works.</strong> ' + esc(e.why) + '</p>';
    }
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ex]'); if (!b) return;
      pick = +b.dataset.ex;
      OR.$$('[data-ex]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      paintEx();
    });
    paintEx();
  }

  /* ---------- Story bank ---------- */
  function storiesTab(host) {
    ensureIds();
    var sel = stories().length ? stories()[0].id : null, saveT = null, pending = null;
    host.innerHTML =
      '<p class="muted bh-lede">Write eight to ten stories once, in your own words. Tick which competencies each one covers; the grid shows what is still uncovered. Everything saves as you type.</p>' +
      '<section class="bh-sec" aria-labelledby="bh-cov"><h2 id="bh-cov" class="section-title">Coverage <span class="faint num" id="bh-count"></span></h2><div id="bh-grid"></div></section>' +
      '<div class="bh-studio"><section aria-labelledby="bh-list-h"><div class="bh-row"><h2 id="bh-list-h" class="section-title">Stories</h2><button class="btn btn-primary btn-sm" type="button" id="bh-add">' + OR.icon('plus', 'icon-sm') + 'Add story</button></div><ul class="bh-list" id="bh-list"></ul></section>' +
      '<section aria-label="Story editor" id="bh-editor"></section></div>';

    function gridHTML() {
      var all = stories();
      return '<div class="bh-grid">' + B.competencies.map(function (c) {
        var hit = all.filter(function (s) { return compsOf(s).indexOf(c.id) >= 0; });
        return '<div class="bh-cell' + (hit.length ? '' : ' is-gap') + '"><h3>' + esc(c.name) + '</h3>' +
          (hit.length ? '<p class="bh-cell-n num">' + OR.plural(hit.length, 'story', 'stories') + '</p><p class="bh-cell-s">' + hit.map(function (s) { return esc(sTitle(s)); }).join(' · ') + '</p>'
            : '<p class="bh-cell-n">Gap</p><p class="bh-cell-s">No story yet</p>') + '</div>';
      }).join('') + '</div>';
    }
    function paintGrid() {
      var all = stories(), gaps = B.competencies.filter(function (c) { return !all.some(function (s) { return compsOf(s).indexOf(c.id) >= 0; }); }).length;
      OR.$('#bh-grid', host).innerHTML = gridHTML();
      OR.$('#bh-count', host).textContent = all.length + ' ' + (all.length === 1 ? 'story' : 'stories') + ', ' + (gaps ? OR.plural(gaps, 'gap') : 'no gaps');
    }
    function paintList() {
      var all = stories();
      OR.$('#bh-list', host).innerHTML = all.length ? all.map(function (s) {
        return '<li><button type="button" class="bh-item" data-pick="' + esc(s.id) + '" aria-current="' + (s.id === sel) + '"><strong>' + esc(sTitle(s)) + '</strong>' +
          '<span class="faint num">' + filled(s) + '/5 parts · ' + OR.plural(compsOf(s).length, 'competency', 'competencies') + '</span></button></li>';
      }).join('') : '<li class="faint">No stories yet.</li>';
    }
    function field(label, key, s, rows, hint) {
      var id = 'bh-f-' + key;
      return '<div class="field"><label class="field-label" for="' + id + '">' + label + '</label>' + (hint ? '<span class="field-hint" id="' + id + '-h">' + hint + '</span>' : '') +
        (rows ? '<textarea class="textarea" id="' + id + '" data-key="' + key + '" rows="' + rows + '"' + (hint ? ' aria-describedby="' + id + '-h"' : '') + '>' + esc(s[key] || '') + '</textarea>'
          : '<input class="input" id="' + id + '" data-key="' + key + '" type="text" value="' + esc(s[key] || '') + '"' + (hint ? ' aria-describedby="' + id + '-h"' : '') + '>') + '</div>';
    }
    function paintEditor(focus) {
      var s = sel && storyById(sel), ed = OR.$('#bh-editor', host);
      if (!s) {
        ed.innerHTML = '<div class="empty"><h2 class="empty-title">Start with one story</h2><p>Pick something you were proud of, a mistake you learned from, or a hard conversation. Add it, then fill in the five parts. Rough is fine; you can polish later.</p><button class="btn btn-primary" type="button" data-add>' + OR.icon('plus', 'icon-sm') + 'Add your first story</button></div>';
        return;
      }
      ed.innerHTML = '<div class="bh-edit" data-id="' + esc(s.id) + '">' + field('Title', 'title', s, 0, 'A short label you will recognize, like “Cache migration”.') +
        '<div class="bh-two">' + field('Situation', 'situation', s, 3, 'Where, when, what was at stake.') + field('Task', 'task', s, 3, 'What was yours to do.') + '</div>' +
        field('Action', 'action', s, 6, 'What you did, step by step, and why. Say “I”.') +
        '<div class="bh-two">' + field('Result', 'result', s, 3, 'What changed. Use numbers where you honestly can.') + field('Learning', 'learning', s, 3, 'What you do differently now.') + '</div>' +
        '<div class="bh-two">' + field('Numbers and metrics', 'metrics', s, 0, 'Before and after, scale, time saved.') + field('Tags', 'tags', s, 0, 'Comma separated: payments, migration, team of 5.') + '</div>' +
        '<fieldset class="bh-comps"><legend class="field-label">Competencies this story covers</legend><div id="bh-checks"></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-sm" data-accept>Accept suggestions</button></div></fieldset>' +
        '<div class="bh-row"><span class="faint" id="bh-saved" role="status">Saved automatically.</span>' +
        '<button type="button" class="btn btn-danger btn-sm" data-del>' + OR.icon('trash', 'icon-sm') + 'Delete story</button></div></div>';
      paintChecks();
      if (focus) OR.$('#bh-f-title', host).focus({ preventScroll: true });
    }
    function paintChecks() {
      var s = storyById(sel); if (!s) return;
      var sug = suggest(s), box = OR.$('#bh-checks', host);
      box.innerHTML = B.competencies.map(function (c) {
        var on = compsOf(s).indexOf(c.id) >= 0, hint = sug.indexOf(c.id) >= 0 && !on;
        return '<label class="bh-check' + (hint ? ' is-sug' : '') + '"><input type="checkbox" data-comp="' + c.id + '"' + (on ? ' checked' : '') + '><span>' + esc(c.name) + (hint ? ' <em>suggested</em>' : '') + '</span></label>';
      }).join('');
      var acc = OR.$('[data-accept]', host); if (acc) acc.disabled = !sug.some(function (id) { return compsOf(s).indexOf(id) < 0; });
    }
    function mutate(fn, id) {
      id = id || sel;
      OR.store.update(function (m) { var s = m.stories.filter(function (x) { return x.id === id; })[0]; if (s) { fn(s); s.updated = Date.now(); } });
      var sv = OR.$('#bh-saved', host); if (sv) sv.textContent = 'Saved.';
    }
    function flushPending() {
      clearTimeout(saveT); saveT = null;
      if (!pending) return;
      var f = pending; pending = null; mutate(function (s) { Object.keys(f.v).forEach(function (k) { s[k] = f.v[k]; }); }, f.id);
      if (OR.$('#bh-grid', host)) { paintChecks(); paintList(); paintGrid(); }
    }
    function add() {
      var id = OR.uid();
      OR.store.update(function (m) { m.stories.push({ id: id, title: '', situation: '', task: '', action: '', result: '', learning: '', metrics: '', tags: '', comps: [], created: Date.now(), updated: Date.now() }); });
      sel = id; paintList(); paintGrid(); paintEditor(true);
    }
    host.addEventListener('click', function (ev) {
      var t = ev.target;
      flushPending();
      if (t.closest('#bh-add') || t.closest('[data-add]')) { add(); return; }
      var p = t.closest('[data-pick]');
      if (p) { sel = p.dataset.pick; paintList(); paintEditor(false); var ed = OR.$('#bh-editor', host); if (matchMedia('(max-width: 899px)').matches) ed.scrollIntoView({ block: 'start', behavior: OR.reducedMotion() ? 'auto' : 'smooth' }); return; }
      if (t.closest('[data-accept]')) {
        var s = storyById(sel); if (!s) return;
        var more = suggest(s); mutate(function (x) { x.comps = compsOf(x).concat(more.filter(function (id) { return compsOf(x).indexOf(id) < 0; })); });
        paintChecks(); paintGrid(); paintList(); OR.announce('Suggestions accepted.'); return;
      }
      if (t.closest('[data-del]')) {
        var d = storyById(sel); if (!d) return;
        OR.confirm({ title: 'Delete “' + sTitle(d) + '”?', body: 'This removes the story and any question links that point to it.', ok: 'Delete story', danger: true }).then(function (ok) {
          if (!ok) return;
          var gone = sel;
          OR.store.update(function (m) {
            m.stories = m.stories.filter(function (x) { return x.id !== gone; });
            Object.keys(m.storyLinks).forEach(function (q) { if (Array.isArray(m.storyLinks[q])) { m.storyLinks[q] = m.storyLinks[q].filter(function (id) { return id !== gone; }); if (!m.storyLinks[q].length) delete m.storyLinks[q]; } });
          });
          sel = stories().length ? stories()[0].id : null;
          paintList(); paintGrid(); paintEditor(false); OR.toast('Story deleted.', { tone: 'ok' });
        });
      }
    });
    host.addEventListener('input', function (ev) {
      var k = ev.target.dataset && ev.target.dataset.key; if (!k) return;
      var v = ev.target.value, id = sel; clearTimeout(saveT);
      var sv = OR.$('#bh-saved', host); if (sv) sv.textContent = 'Saving…';
      if (!pending || pending.id !== id) { flushPending(); pending = { id: id, v: {} }; }
      pending.v[k] = v;
      saveT = setTimeout(flushPending, 350);
    });
    host.addEventListener('change', function (ev) {
      var c = ev.target.dataset && ev.target.dataset.comp; if (!c) return;
      var on = ev.target.checked;
      mutate(function (s) { var a = compsOf(s).filter(function (x) { return x !== c; }); if (on) a.push(c); s.comps = a; });
      paintGrid(); paintList(); paintChecks();
      var again = OR.$('[data-comp="' + c + '"]', host); if (again) again.focus({ preventScroll: true });
    });
    paintGrid(); paintList(); paintEditor(false);
    return function () { flushPending(); OR.store.flush(); };
  }

  /* ---------- Questions + Amazon LPs ---------- */
  function badge(qid) { var n = linksFor(qid).length; return n ? OR.plural(n, 'story', 'stories') + ' linked' : 'No story'; }
  function pickerHTML(qid) {
    var all = stories(), on = linksFor(qid);
    if (!all.length) return '<p class="faint">You have no stories yet. <a href="#/behavioral/stories">Write one in the story bank</a>, then link it here.</p>';
    return '<fieldset class="bh-link"><legend class="field-label">Link a story</legend>' + all.map(function (s) {
      return '<label class="bh-check"><input type="checkbox" data-link="' + esc(qid) + '" value="' + esc(s.id) + '"' + (on.indexOf(s.id) >= 0 ? ' checked' : '') + '><span>' + esc(sTitle(s)) + '</span></label>';
    }).join('') + '</fieldset>';
  }
  function qItem(q, body) {
    return '<details class="bh-q-item" id="q-' + esc(q.id) + '"><summary><span class="bh-q-text">' + esc(q.q) + '</span><span class="chip bh-badge' + (linksFor(q.id).length ? ' chip-accent' : '') + '" data-badge="' + esc(q.id) + '">' + badge(q.id) + '</span></summary>' +
      '<div class="bh-q-body">' + body + pickerHTML(q.id) + '</div></details>';
  }
  function questionsTab(host, ctx) {
    var cf = '', text = '';
    var cs = B.competencies.filter(function (c) { return B.questions.some(function (q) { return q.comp === c.id; }); });
    host.innerHTML =
      '<p class="muted bh-lede">' + B.questions.length + ' common questions grouped by competency, plus the ' + B.alp.length + ' Amazon Leadership Principles. Open one to see what the interviewer is really after, then link the stories you would use.</p>' +
      '<div class="bh-filters"><label class="field"><span class="field-label">Competency</span><select class="select" id="bh-cf"><option value="">All</option>' + cs.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="field-label">Search</span><input class="input" id="bh-qs" type="search" placeholder="Search questions" autocomplete="off"></label>' +
      '<label class="bh-check bh-only"><input type="checkbox" id="bh-unl"><span>Only questions without a story</span></label></div>' +
      '<div id="bh-qlist" aria-live="polite"></div>' +
      '<section class="bh-sec" id="bh-alp" aria-labelledby="bh-alp-h"><h2 id="bh-alp-h" class="section-title">Amazon Leadership Principles</h2>' +
      '<p class="muted bh-lede">Amazon’s sixteen principles, paraphrased. Even outside Amazon, these are a good checklist of what large companies reward. Each has two typical questions.</p>' +
      B.alp.map(function (p, i) {
        return '<div class="bh-alp" id="alp-' + p.id + '"><h3><span class="faint num">' + (i + 1) + '</span> ' + esc(p.name) + '</h3><p class="muted">' + esc(p.gist) + '</p>' +
          p.questions.map(function (q) { return qItem(q, ''); }).join('') + '</div>';
      }).join('') + '</section>';
    var unl = false;
    function paintList() {
      var list = B.questions.filter(function (q) {
        return (!cf || q.comp === cf) && (!text || q.q.toLowerCase().indexOf(text) >= 0 || q.tests.toLowerCase().indexOf(text) >= 0) && (!unl || !linksFor(q.id).length);
      });
      var out = '';
      cs.forEach(function (c) {
        var rows = list.filter(function (q) { return q.comp === c.id; }); if (!rows.length) return;
        out += '<section class="bh-group"><h2 class="bh-group-h">' + esc(c.name) + ' <span class="faint num">' + rows.length + '</span></h2>' + rows.map(function (q) {
          return qItem(q, '<dl class="bh-dl"><div><dt>What they are really testing</dt><dd>' + esc(q.tests) + '</dd></div><div><dt>A good answer outline</dt><dd>' + esc(q.outline) + '</dd></div></dl>');
        }).join('') + '</section>';
      });
      OR.$('#bh-qlist', host).innerHTML = out || '<div class="empty"><h2 class="empty-title">No questions match</h2><p>Clear the search or the filters to see the full bank.</p></div>';
    }
    host.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === 'bh-cf') { cf = t.value; paintList(); return; }
      if (t.id === 'bh-unl') { unl = t.checked; paintList(); return; }
      var qid = t.dataset && t.dataset.link; if (!qid) return;
      var on = t.checked, sid = t.value;
      OR.store.update(function (m) {
        var a = (Array.isArray(m.storyLinks[qid]) ? m.storyLinks[qid] : []).filter(function (x) { return x !== sid; });
        if (on) a.push(sid);
        if (a.length) m.storyLinks[qid] = a; else delete m.storyLinks[qid];
      });
      var b = OR.$('[data-badge="' + qid + '"]', host); if (b) { b.textContent = badge(qid); b.classList.toggle('chip-accent', !!linksFor(qid).length); }
      OR.announce(badge(qid) + '.');
    });
    host.addEventListener('input', function (ev) { if (ev.target.id === 'bh-qs') { text = ev.target.value.trim().toLowerCase(); paintList(); } });
    paintList();
    // Deep links from the palette: ?q=text prefills the search; ?alp=id jumps to a principle.
    if (ctx.query.q) { OR.$('#bh-qs', host).value = ctx.query.q; text = ctx.query.q.toLowerCase(); paintList(); var only = OR.$$('.bh-q-item', OR.$('#bh-qlist', host)); if (only.length === 1) only[0].open = true; }
    if (ctx.query.alp) { var el = OR.$('#alp-' + ctx.query.alp, host); if (el) { var d = OR.$('details', el); if (d) d.open = true; el.scrollIntoView({ block: 'start' }); } }
  }

  /* ---------- Practice ---------- */
  function trendHTML() {
    var l = log().slice(-12);
    if (!l.length) return '<p class="faint">No sessions yet. Your self-check scores will appear here as a trend.</p>';
    var avg = l.reduce(function (t, e) { return t + e.score; }, 0) / l.length;
    return '<div class="bh-trend" role="img" aria-label="Last ' + l.length + ' practice scores out of 6: ' + l.map(function (e) { return e.score; }).join(', ') + '">' + l.map(function (e) {
      return '<span class="bh-bar" style="--h:' + Math.round(e.score / 6 * 100) + '%" title="' + e.score + ' of 6 on ' + esc(e.date) + '"><i class="num">' + e.score + '</i></span>';
    }).join('') + '</div><p class="faint num">Average of the last ' + l.length + ': ' + (Math.round(avg * 10) / 10) + ' of 6. ' + OR.plural(log().length, 'session') + ' in total.</p>';
  }
  function pickQuestion(cf, avoid) {
    var done = {}; log().forEach(function (e) { done[e.qid] = (done[e.qid] || 0) + 1; });
    var pool = B.questions.filter(function (q) { return (!cf || q.comp === cf) && q.id !== avoid; });
    if (!pool.length) pool = B.questions.filter(function (q) { return !cf || q.comp === cf; });
    // Unlinked and never-practiced questions come up more often.
    var w = pool.map(function (q) { return 1 + (linksFor(q.id).length ? 0 : 2) + (done[q.id] ? 0 : 2); });
    var r = Math.random() * w.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function practiceTab(host) {
    var cf = '', q = null, phase = 'ready', t0 = 0, elapsed = 0, iv = null, said30 = false, said0 = false;
    var LIM = 120;
    host.innerHTML =
      '<p class="muted bh-lede">Pick a question, answer out loud for up to two minutes, then score yourself honestly on the six checks. Questions you have not linked a story to, or have not practiced, come up more often.</p>' +
      '<div class="bh-practice"><div id="bh-stage" class="bh-stage"></div>' +
      '<aside class="bh-side"><label class="field"><span class="field-label">Competency</span><select class="select" id="bh-pf"><option value="">Any</option>' + B.competencies.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
      '<h2 class="bh-side-h">Trend</h2><div id="bh-trend"></div></aside></div>';
    var stage = OR.$('#bh-stage', host);
    function stop() { if (iv) { clearInterval(iv); iv = null; } }
    function tick() {
      elapsed = (Date.now() - t0) / 1000;
      var left = LIM - elapsed, el = OR.$('#bh-time', host); if (!el) return;
      el.textContent = left >= 0 ? mmss(Math.ceil(left)) : '+' + mmss(-left);
      el.dataset.over = String(left < 0);
      var bar = OR.$('#bh-prog', host); if (bar) bar.style.width = Math.min(100, elapsed / LIM * 100) + '%';
      if (left <= 30 && !said30) { said30 = true; OR.announce('Thirty seconds left.'); }
      if (left <= 0 && !said0) { said0 = true; OR.announce('Two minutes. Wrap up.'); }
    }
    function paint(focus) {
      var linked = q ? linksFor(q.id).map(storyById).filter(Boolean) : [];
      if (phase === 'ready') {
        stage.innerHTML = '<p class="bh-chip-row"><span class="chip">' + esc(compName(q.comp)) + '</span><span class="chip' + (linked.length ? ' chip-accent' : '') + '">' + badge(q.id) + '</span></p>' +
          '<h2 class="bh-prompt" id="bh-prompt" tabindex="-1">' + esc(q.q) + '</h2>' +
          (linked.length ? '<p class="muted">Your linked story: ' + linked.map(function (s) { return '<strong>' + esc(sTitle(s)) + '</strong>'; }).join(', ') + '.</p>' : '<p class="muted">No linked story yet. Pick one from your bank in your head, or <a href="#/behavioral/questions">link one</a>.</p>') +
          '<div class="btn-row"><button class="btn btn-primary btn-lg" type="button" data-start>' + OR.icon('play', 'icon-sm') + 'Start 2:00 timer</button><button class="btn" type="button" data-skip>Different question</button></div>' +
          '<details class="bh-hint"><summary>What they are testing</summary><p>' + esc(q.tests) + '</p><p class="muted">' + esc(q.outline) + '</p></details>';
      } else if (phase === 'run') {
        stage.innerHTML = '<p class="bh-chip-row"><span class="chip">' + esc(compName(q.comp)) + '</span></p><h2 class="bh-prompt" id="bh-prompt" tabindex="-1">' + esc(q.q) + '</h2>' +
          '<p class="bh-time num" id="bh-time" data-over="false" role="timer" aria-label="Time left">2:00</p><div class="bh-progress" aria-hidden="true"><div id="bh-prog"></div></div>' +
          '<div class="btn-row"><button class="btn btn-primary btn-lg" type="button" data-done>' + OR.icon('check', 'icon-sm') + 'I am done</button><button class="btn" type="button" data-cancel>Cancel</button></div>';
      } else {
        stage.innerHTML = '<p class="bh-chip-row"><span class="chip">' + esc(compName(q.comp)) + '</span><span class="chip num">Answered in ' + mmss(elapsed) + '</span></p><h2 class="bh-prompt" id="bh-prompt" tabindex="-1">Self-check</h2>' +
          '<p class="muted">“' + esc(q.q) + '” Tick what you really did, not what you meant to.</p>' +
          '<fieldset class="bh-rubric"><legend class="sr-only">Self-check rubric</legend>' + RUBRIC.map(function (r) {
            var preset = r[0] === 'length' ? elapsed <= LIM + 15 : false;
            return '<label class="bh-check"><input type="checkbox" data-rub="' + r[0] + '"' + (preset ? ' checked' : '') + '><span><strong>' + r[1] + '</strong><br><span class="muted">' + r[2] + '</span></span></label>';
          }).join('') + '</fieldset><p class="bh-score num" id="bh-score" role="status"></p>' +
          '<div class="btn-row"><button class="btn btn-primary" type="button" data-save>Save score</button><button class="btn" type="button" data-discard>Discard</button></div>';
        score();
      }
      OR.$('#bh-trend', host).innerHTML = trendHTML();
      if (focus) { var f = OR.$('#bh-prompt', host); if (f) f.focus({ preventScroll: true }); }
    }
    function score() {
      var n = OR.$$('[data-rub]:checked', host).length, el = OR.$('#bh-score', host);
      if (el) el.textContent = 'Score: ' + n + ' of ' + RUBRIC.length;
      return n;
    }
    function next(avoid) { q = pickQuestion(cf, avoid); phase = 'ready'; paint(true); }
    stage.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t.closest('[data-start]')) { phase = 'run'; t0 = Date.now(); elapsed = 0; said30 = said0 = false; paint(false); tick(); stop(); iv = setInterval(tick, 250); var d = OR.$('[data-done]', host); if (d) d.focus({ preventScroll: true }); }
      else if (t.closest('[data-skip]')) next(q.id);
      else if (t.closest('[data-cancel]')) { stop(); phase = 'ready'; paint(true); }
      else if (t.closest('[data-done]')) { stop(); tick(); phase = 'rate'; paint(true); }
      else if (t.closest('[data-discard]')) next(q.id);
      else if (t.closest('[data-save]')) {
        var checks = RUBRIC.map(function (r) { var c = OR.$('[data-rub="' + r[0] + '"]', host); return c && c.checked ? 1 : 0; }), sc = score(), qq = q;
        OR.store.update(function (m) {
          var l = Array.isArray(m.drafts[LOG]) ? m.drafts[LOG] : [];
          l.push({ at: Date.now(), date: OR.today(), qid: qq.id, comp: qq.comp, score: sc, secs: Math.round(elapsed), checks: checks });
          m.drafts[LOG] = l.slice(-LIMIT);
        });
        OR.toast('Saved ' + sc + ' of ' + RUBRIC.length + '.', { tone: 'ok' });
        next(qq.id);
      }
    });
    stage.addEventListener('change', function (ev) { if (ev.target.dataset && ev.target.dataset.rub) score(); });
    OR.$('#bh-pf', host).addEventListener('change', function (ev) { cf = ev.target.value; if (phase !== 'run') next(q && q.id); });
    q = pickQuestion('', null); paint(false);
    return stop;
  }

  /* ---------- Questions to ask ---------- */
  function askTab(host) {
    var cur = B.ask[0].id;
    host.innerHTML = '<p class="muted bh-lede">Asking good questions is part of the interview. Match them to who you are talking to, and listen for the red flags as much as the answers.</p>' +
      '<div class="seg bh-seg" role="group" aria-label="Interviewer type">' + B.ask.map(function (a) {
        return '<button type="button" data-ask="' + a.id + '" aria-pressed="' + (a.id === cur) + '">' + esc(a.name) + '</button>';
      }).join('') + '</div><div id="bh-ask"></div>';
    function paint() {
      var a = B.ask.filter(function (x) { return x.id === cur; })[0];
      OR.$('#bh-ask', host).innerHTML = '<p class="bh-note">' + esc(a.note) + '</p><ol class="bh-asks">' + a.items.map(function (it) {
        return '<li><h3>' + esc(it.q) + '</h3><dl class="bh-dl"><div><dt class="bh-good">What a good answer sounds like</dt><dd>' + esc(it.good) + '</dd></div><div><dt class="bh-red">Red flags</dt><dd>' + esc(it.red) + '</dd></div></dl></li>';
      }).join('') + '</ol>';
    }
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ask]'); if (!b) return;
      cur = b.dataset.ask; OR.$$('[data-ask]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); paint();
    });
    paint();
  }

  /* ---------- View ---------- */
  var BUILD = { method: methodTab, stories: storiesTab, questions: questionsTab, practice: practiceTab, ask: askTab };
  var TITLES = { method: 'Method', stories: 'Story bank', questions: 'Questions', practice: 'Practice', ask: 'Ask them' };
  OR.views.behavioral = {
    title: function (ctx) { return 'Behavioral: ' + (TITLES[ctx.params.tab] || 'Method'); },
    scrollsItself: function (ctx) { return !!ctx.query.alp; },
    render: function (main, ctx) {
      var tab = BUILD[ctx.params.tab] ? ctx.params.tab : 'method';
      main.innerHTML = '<div class="page bh"><div class="page-head"><div><h1 class="page-title display">Behavioral studio</h1>' +
        '<p class="page-lede">Stories first, then questions, then reps out loud.</p></div></div>' + tabsHTML(tab) + '<div id="bh-body" class="bh-body"></div></div>';
      return BUILD[tab](OR.$('#bh-body', main), ctx) || null;
    }
  };

  OR.addSearch(function () {
    var out = B.questions.map(function (q) { return { group: 'Behavioral', title: q.q, sub: compName(q.comp) + ' question', icon: 'behavioral', href: '#/behavioral/questions?q=' + encodeURIComponent(q.q.slice(0, 40)), keywords: q.tests + ' behavioral interview' }; });
    B.alp.forEach(function (p) { out.push({ group: 'Behavioral', title: p.name, sub: 'Amazon Leadership Principle', icon: 'behavioral', href: '#/behavioral/questions?alp=' + p.id, keywords: 'amazon leadership principle ' + p.gist }); });
    TABS.forEach(function (t) { out.push({ group: 'Behavioral', title: 'Behavioral: ' + t[1], sub: 'Behavioral studio', icon: 'behavioral', href: '#/behavioral/' + t[0], keywords: 'star story stories interview' }); });
    return out;
  });
})();

