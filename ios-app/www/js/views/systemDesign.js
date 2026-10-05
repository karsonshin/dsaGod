/* Offer Ready: System design module.
   Routes: #/system-design (index), #/system-design/fundamentals/:page, #/system-design/framework,
   #/system-design/calculator, #/system-design/:case[/:section], and low-level-design problems under the same
   #/system-design/:id[/:section] shape. Content is data (data/sd/*.js, schema in README.md and data/sd/schema.md):
     OR.sd.fundamentals.push({...})   concept lessons        OR.sd.cases.push({...})  case studies
     OR.sd.lld.push({...})            LLD problems           OR.sd.framework = {...}  OR.sd.numbers = [...]
   A case file that is missing simply doesn't appear. Reading progress is stored in the topic store under
   topics['sd:<id>'] (fundamentals: 'sd:f:<id>'), the same { sections: { key: date } } shape the topic lessons use. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, SD = (OR.sd = OR.sd || {}), BASE = '#/system-design';
  ['cases', 'lld', 'fundamentals', 'numbers'].forEach(function (k) { SD[k] = SD[k] || []; });

  var CASE_SECS = [['requirements', 'Requirements'], ['estimates', 'Estimates'], ['api', 'API'], ['data', 'Data model'], ['design', 'High-level design'],
    ['deep-dives', 'Deep dives'], ['tradeoffs', 'Bottlenecks and trade-offs'], ['mistakes', 'Common mistakes'], ['pushes', 'What interviewers push on'], ['practice', 'Quiz and cards']];
  var LLD_SECS = [['requirements', 'Requirements'], ['classes', 'Class diagram'], ['decisions', 'Key design decisions'], ['code', 'Code'], ['extensions', 'Extension questions'], ['practice', 'Quiz and cards']];

  /* ---------- Cards: every page's flashcards join the global deck, including files that load later ---------- */
  var seen = {};
  function regCards(prefix, item) {
    (item.flashcards || []).forEach(function (c, i) {
      var id = 'sd:' + prefix + item.id + ':' + (c.id || i);
      if (seen[id]) return; seen[id] = 1;
      OR.flashcards.push({ id: id, deck: 'system-design', front: c.front, back: c.back });
    });
  }
  function watch(arr, prefix) {
    arr.forEach(function (x) { regCards(prefix, x); });
    var push = arr.push;
    arr.push = function () { var r = push.apply(arr, arguments); for (var i = 0; i < arguments.length; i++) regCards(prefix, arguments[i]); return r; };
  }
  watch(SD.fundamentals, 'f:'); watch(SD.cases, ''); watch(SD.lld, '');

  /* ---------- Lookup and progress ---------- */
  function find(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  function secsOf(item, kind) {
    var d = item;
    if (kind === 'lld') return LLD_SECS.filter(function (s) {
      var k = s[0];
      return k === 'requirements' ? d.requirements : k === 'classes' ? d.classDiagram : k === 'decisions' ? (d.decisions || []).length : k === 'code' ? (d.code || []).length :
        k === 'extensions' ? (d.extensions || []).length : (d.quiz || []).length || (d.flashcards || []).length;
    });
    return CASE_SECS.filter(function (s) {
      var k = s[0];
      return k === 'requirements' ? d.requirements : k === 'estimates' ? d.estimates : k === 'api' ? (d.api || []).length : k === 'data' ? d.data : k === 'design' ? d.design :
        k === 'deep-dives' ? (d.deepDives || []).length : k === 'tradeoffs' ? (d.bottlenecks || []).length : k === 'mistakes' ? (d.mistakes || []).length :
        k === 'pushes' ? (d.pushes || []).length : (d.quiz || []).length || (d.flashcards || []).length;
    });
  }
  function fundSecKeys(f) { return (f.sections || []).map(function (s, i) { return s.id || 's' + i; }).concat((f.quiz || []).length ? ['quiz'] : []); }
  function recOf(key) { return OR.store.get().topics[key] || {}; }
  function readOf(key) { return recOf(key).sections || {}; }
  function markRead(key, sec) {
    if (readOf(key)[sec]) return false;
    OR.store.update(function (s) { var r = s.topics[key] = s.topics[key] || {}; r.sections = r.sections || {}; r.sections[sec] = OR.today(); });
    return true;
  }
  function progress(item, kind) {
    var key = kind === 'fund' ? 'sd:f:' + item.id : 'sd:' + item.id, keys = kind === 'fund' ? fundSecKeys(item) : secsOf(item, kind).map(function (s) { return s[0]; });
    var read = readOf(key), n = keys.filter(function (k) { return read[k]; }).length, q = recOf(key).quiz;
    return { key: key, keys: keys, read: n, total: keys.length, quiz: q && q.best != null ? Math.round(q.best * 100) : null };
  }
  function statusHTML(p) {
    if (!p.read) return '<span class="faint">Not started</span>';
    return '<span class="sd-prog' + (p.read === p.total ? ' is-done' : '') + '">' + (p.read === p.total ? OR.icon('check', 'icon-sm') : '') + p.read + ' of ' + p.total + ' read</span>' + (p.quiz != null ? '<span class="faint num"> · quiz ' + p.quiz + '%</span>' : '');
  }
  function firstUnread(item, kind) {
    var p = progress(item, kind), read = readOf(p.key);
    for (var i = 0; i < p.keys.length; i++) if (!read[p.keys[i]]) return p.keys[i];
    return p.keys[0];
  }
  function ul(items, cls) { return items && items.length ? '<ul class="' + (cls || 'sd-ul') + '">' + items.map(function (t) { return '<li>' + OR.inline(t) + '</li>'; }).join('') + '</ul>' : ''; }
  function fence(lang, text) { return '```' + (lang || '') + '\n' + text + '\n```'; }

  // Fundamentals in display order: grouped by first appearance of each group, so numbering matches the index.
  function fundOrder() {
    var groups = [];
    SD.fundamentals.forEach(function (f) { var g = f.group || 'Concepts'; if (groups.indexOf(g) < 0) groups.push(g); });
    var out = [];
    groups.forEach(function (g) { SD.fundamentals.forEach(function (f) { if ((f.group || 'Concepts') === g) out.push(f); }); });
    return out;
  }

  /* ---------- Index ---------- */
  function row(n, href, title, blurb, right, extra) {
    return '<li class="sd-row"><span class="bib-tag sd-n">' + (typeof n === 'number' ? String(n).padStart(2, '0') : esc(n)) + '</span>' +
      '<div class="sd-row-main"><a class="sd-row-title" href="' + href + '">' + esc(title) + '</a>' + (extra || '') + '<p>' + OR.inline(blurb || '') + '</p></div><div class="sd-row-side">' + right + '</div></li>';
  }
  function diffChip(d) { return d ? '<span class="diff diff-' + esc(d) + '">' + esc(d) + '</span>' : ''; }

  function indexView(main) {
    var F = fundOrder(), groups = [], pages = 0, done = 0;
    F.forEach(function (f) { if (groups.indexOf(f.group || 'Concepts') < 0) groups.push(f.group || 'Concepts'); var p = progress(f, 'fund'); pages++; if (p.read === p.total && p.total) done++; });
    var n = 0;
    var fund = groups.map(function (g) {
      return '<h3 class="sd-group">' + esc(g) + '</h3><ol class="sd-list">' + F.filter(function (f) { return (f.group || 'Concepts') === g; }).map(function (f) {
        n++; return row(n, BASE + '/fundamentals/' + f.id, f.title, f.hook, statusHTML(progress(f, 'fund')));
      }).join('') + '</ol>';
    }).join('');
    function itemRows(arr, kind) {
      return '<ol class="sd-list">' + arr.map(function (c, i) {
        var p = progress(c, kind), sec = p.read ? firstUnread(c, kind) : '';
        return row(i + 1, BASE + '/' + c.id + (sec && p.read < p.total ? '/' + sec : ''), c.title, c.short, '<span>' + diffChip(c.difficulty) + (c.time ? ' <span class="faint num">' + esc(c.time) + '</span>' : '') + '</span>' + statusHTML(p));
      }).join('') + '</ol>';
    }
    var est = SD.estimate;
    main.innerHTML = '<div class="page sd"><div class="page-head"><div><h1 class="page-title display">System design</h1>' +
      '<p class="page-lede">Learn the building blocks, then a fixed way to run a 45-minute round, then practise on full case studies. Every diagram is clickable: each box says why it is there, what it costs and what breaks first.</p></div>' +
      '<div class="btn-row"><a class="btn" href="' + BASE + '/framework">' + OR.icon('clock', 'icon-sm') + 'The 45-minute framework</a><a class="btn" href="' + BASE + '/calculator">' + OR.icon('target', 'icon-sm') + 'Estimation calculator</a></div></div>' +
      (F.length ? '<section class="sd-sec" aria-labelledby="sd-h-fund"><div class="sd-sec-head"><h2 class="sd-h" id="sd-h-fund">Fundamentals</h2><p class="faint num">' + done + ' of ' + pages + ' read</p></div>' +
        '<p class="sd-sec-lede">The vocabulary every design answer is built from. Each page has a diagram, a short quiz and flashcards.</p>' + fund + '</section>' : '') +
      '<section class="sd-sec" aria-labelledby="sd-h-tools"><div class="sd-sec-head"><h2 class="sd-h" id="sd-h-tools">Method and numbers</h2></div><ol class="sd-list">' +
        row('45', BASE + '/framework', 'Interview framework', 'Requirements, estimates, API, data model, high-level design, deep dives, trade-offs, with time boxes and what to say out loud.', '<span class="faint">One page</span>') +
        row('Σ', BASE + '/calculator', 'Estimation calculator', 'QPS, storage, bandwidth, cache size and server count from a handful of inputs, with the formula shown for each line, plus the numbers every engineer should know.', '<span class="faint">Live inputs</span>') +
      '</ol></section>' +
      (SD.cases.length ? '<section class="sd-sec" aria-labelledby="sd-h-cases"><div class="sd-sec-head"><h2 class="sd-h" id="sd-h-cases">Case studies</h2></div>' +
        '<p class="sd-sec-lede">Full walk-throughs: requirements to bottlenecks, with a diagram you can trace a request through.</p>' + itemRows(SD.cases, 'case') + '</section>' : '') +
      (SD.lld.length ? '<section class="sd-sec" aria-labelledby="sd-h-lld"><div class="sd-sec-head"><h2 class="sd-h" id="sd-h-lld">Low-level design</h2></div>' +
        '<p class="sd-sec-lede">Object-oriented design problems: classes, relationships, the decisions behind them, and code.</p>' + itemRows(SD.lld, 'lld') + '</section>' : '') +
      '</div>';
    void est;
  }

  /* ---------- Shared page pieces ---------- */
  function mountDiagram(host, spec, cleanups) {
    try { var d = (spec.classes ? OR.classDiagram : OR.diagram)(host, spec); if (d && d.destroy) cleanups.push(d.destroy); }
    catch (e) { console.error(e); host.innerHTML = '<p class="muted">The diagram hit an error: ' + esc(e.message) + '</p>'; }
  }
  function head(bib, title, hook, meta) {
    return '<header class="tp-head"><span class="bib-tag tp-bib">' + esc(bib) + '</span><div class="tp-headline"><h1 class="page-title display">' + esc(title) + '</h1>' +
      '<p class="tp-hook">' + OR.inline(hook || '') + '</p></div>' + (meta ? '<dl class="tp-meta">' + meta + '</dl>' : '') + '</header>';
  }
  function metaItem(k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; }
  function crumbs(label) { return '<nav class="sd-crumbs" aria-label="Breadcrumb"><a href="' + BASE + '">System design</a><span aria-hidden="true">/</span><span>' + esc(label) + '</span></nav>'; }
  function scrollTo(el) { if (el) el.scrollIntoView({ block: 'start', behavior: OR.reducedMotion() ? 'auto' : 'smooth' }); }
  function quizAndCards(root, key, item, prefix) {
    var q = OR.$('.sd-quiz', root);
    if (q && (item.quiz || []).length) OR.quiz(q, { key: key, questions: item.quiz, topic: key });
  }
  function cardsHTML(item) {
    var cards = item.flashcards || [];
    if (!cards.length) return '';
    return '<p class="muted">' + OR.plural(cards.length, 'card') + ' from this page join your spaced-repetition deck.</p><div class="tp-cards">' +
      cards.map(function (c) { return '<details class="tp-card"><summary>' + OR.inline(c.front) + '</summary><div class="prose">' + OR.md(c.back) + '</div></details>'; }).join('') +
      '</div><a class="btn" href="#/flashcards/system-design">' + OR.icon('cards', 'icon-sm') + 'Study the system design deck</a>';
  }
  function pager(prev, next) {
    return '<nav class="sd-pager" aria-label="Next and previous">' + (prev ? '<a href="' + prev[0] + '">' + OR.icon('chevron-left', 'icon-sm') + '<span><small>Previous</small>' + esc(prev[1]) + '</span></a>' : '<span></span>') +
      (next ? '<a class="is-next" href="' + next[0] + '"><span><small>Next</small>' + esc(next[1]) + '</span>' + OR.icon('chevron-right', 'icon-sm') + '</a>' : '<span></span>') + '</nav>';
  }
  // Light up the section near the top of the viewport, label the resume point, and count it as read.
  function trackScroll(root, key, titleOf, pageTitle, cleanups) {
    if (!('IntersectionObserver' in window)) return;
    var read = readOf(key);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var sec = en.target.dataset.sec;
        OR.$$('.tp-toc a', root).forEach(function (a) { if (a.dataset.sec === sec) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        OR.setPlace({ title: pageTitle, section: titleOf(sec) });
        if (markRead(key, sec)) { read[sec] = 1; var a = OR.$('.tp-toc a[data-sec="' + sec + '"]', root); if (a) a.dataset.read = 'true'; }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    OR.$$('[data-track]', root).forEach(function (s) { io.observe(s); });
    cleanups.push(function () { io.disconnect(); });
  }

  /* ---------- Fundamentals page ---------- */
  function fundView(main, f) {
    var key = 'sd:f:' + f.id, read = readOf(key), cleanups = [], F = fundOrder(), idx = F.indexOf(f);
    var secs = (f.sections || []).map(function (s, i) { return { key: s.id || 's' + i, s: s }; });
    var toc = secs.map(function (x) { return [x.key, x.s.title]; });
    if ((f.takeaways || []).length) toc.push(['takeaways', 'Takeaways']);
    if ((f.quiz || []).length) toc.push(['quiz', 'Quiz']);
    if ((f.flashcards || []).length) toc.push(['cards', 'Flashcards']);
    var label = function (k) { for (var i = 0; i < toc.length; i++) if (toc[i][0] === k) return toc[i][1]; return k; };
    var body = secs.map(function (x, i) {
      var s = x.s;
      return '<section class="tp-sec" id="sd-s-' + x.key + '" data-sec="' + x.key + '" data-track aria-labelledby="sd-h-' + x.key + '"><h2 class="tp-h" id="sd-h-' + x.key + '">' + esc(s.title) + '</h2>' +
        (s.md ? '<div class="prose">' + OR.md(s.md) + '</div>' : '') +
        (s.diagram ? '<figure class="sd-fig"><div class="sd-dg" data-dg="' + i + '"></div>' + (s.caption ? '<figcaption>' + OR.inline(s.caption) + '</figcaption>' : '') + '</figure>' : '') +
        (s.viz ? '<figure class="sd-fig"><div class="sd-viz" data-viz="' + esc(s.viz) + '"></div>' + (s.caption && !s.diagram ? '<figcaption>' + OR.inline(s.caption) + '</figcaption>' : '') + '</figure>' : '') + '</section>';
    }).join('') +
      ((f.takeaways || []).length ? '<section class="tp-sec" id="sd-s-takeaways" data-sec="takeaways"><h2 class="tp-h">Takeaways</h2>' + ul(f.takeaways, 'sd-take') + '</section>' : '') +
      ((f.quiz || []).length ? '<section class="tp-sec" id="sd-s-quiz" data-sec="quiz" data-track><h2 class="tp-h">Quiz</h2><div class="sd-quiz"></div></section>' : '') +
      ((f.flashcards || []).length ? '<section class="tp-sec" id="sd-s-cards" data-sec="cards"><h2 class="tp-h">Flashcards</h2>' + cardsHTML(f) + '</section>' : '');
    var prev = F[idx - 1], next = F[idx + 1];
    main.innerHTML = '<div class="page tp sd">' + crumbs('Fundamentals') + head(String(idx + 1).padStart(2, '0'), f.title, f.hook,
      metaItem('Group', esc(f.group || 'Concepts')) + metaItem('Reading', secs.length + ' parts, ' + (f.quiz || []).length + ' quiz questions') + metaItem('Progress', statusHTML(progress(f, 'fund')))) +
      '<div class="tp-layout"><nav class="tp-toc" aria-label="On this page"><ol>' + toc.map(function (t) {
        return '<li><a href="' + BASE + '/fundamentals/' + f.id + '" data-sec="' + t[0] + '"' + (read[t[0]] ? ' data-read="true"' : '') + '>' + esc(t[1]) + '</a></li>';
      }).join('') + '</ol></nav><div class="tp-body">' + body +
      pager(prev && [BASE + '/fundamentals/' + prev.id, prev.title], next && [BASE + '/fundamentals/' + next.id, next.title]) + '</div></div></div>';
    var root = main.firstChild;
    secs.forEach(function (x, i) { if (x.s.diagram) mountDiagram(OR.$('.sd-dg[data-dg="' + i + '"]', root), x.s.diagram, cleanups); });
    OR.$$('.sd-viz', root).forEach(function (h) {
      var v = SD.viz && SD.viz[h.dataset.viz];
      if (!v) { h.innerHTML = '<p class="muted">This visualizer is missing.</p>'; return; }
      try { var m = v.mount(h); if (m && m.destroy) cleanups.push(m.destroy); } catch (e) { console.error(e); h.innerHTML = '<p class="muted">The visualizer hit an error: ' + esc(e.message) + '</p>'; }
    });
    quizAndCards(root, key, f);
    root.addEventListener('click', function (e) {
      var a = e.target.closest('.tp-toc a'); if (!a) return;
      e.preventDefault(); scrollTo(OR.$('#sd-s-' + a.dataset.sec, root));
    });
    trackScroll(root, key, label, f.title, cleanups);
    return function () { cleanups.forEach(function (c) { c(); }); };
  }

  /* ---------- Interview framework ---------- */
  function frameworkView(main) {
    var F = SD.framework;
    if (!F) { main.innerHTML = '<div class="page empty"><h1 class="empty-title display">Framework not loaded</h1><a class="btn" href="' + BASE + '">System design</a></div>'; return; }
    var total = F.steps.reduce(function (s, x) { return s + x.minutes; }, 0), at = 0;
    main.innerHTML = '<div class="page sd sd-frame">' + crumbs('Interview framework') + head('45', 'The 45-minute framework', F.intro,
      metaItem('Round length', '<span class="num">' + total + ' min</span>') + metaItem('Steps', F.steps.length)) +
      '<ol class="sd-bar" aria-label="Time boxes">' + F.steps.map(function (s, i) {
        return '<li style="flex:' + s.minutes + '"><a href="' + BASE + '/framework" data-step="' + s.id + '"><span class="sd-bar-n">' + (i + 1) + '</span><span class="sd-bar-name">' + esc(s.name) + '</span><span class="sd-bar-min num">' + s.minutes + ' min</span></a></li>';
      }).join('') + '</ol>' +
      '<div class="sd-steps">' + F.steps.map(function (s, i) {
        var from = at; at += s.minutes;
        return '<section class="sd-step" id="sd-step-' + s.id + '" aria-labelledby="sd-sh-' + s.id + '"><div class="sd-step-head"><span class="bib-tag">' + (i + 1) + '</span><h2 id="sd-sh-' + s.id + '" class="sd-h">' + esc(s.name) + '</h2>' +
          '<span class="chip num">' + s.minutes + ' min</span><span class="faint num">minute ' + from + ' to ' + at + '</span></div>' +
          '<p class="sd-goal">' + OR.inline(s.goal) + '</p><div class="sd-cols3">' +
          '<div><h3 class="sub-title">Do</h3>' + ul(s.do) + '</div>' +
          '<div><h3 class="sub-title">Say out loud</h3>' + (s.say || []).map(function (q) { return '<blockquote class="sd-say">' + OR.inline(q) + '</blockquote>'; }).join('') + '</div>' +
          '<div><h3 class="sub-title">Avoid</h3>' + ul(s.avoid) + '</div></div></section>';
      }).join('') + '</div>' + (F.closing ? '<div class="prose sd-closing">' + OR.md(F.closing) + '</div>' : '') +
      '<p><a class="btn" href="' + BASE + '/calculator">' + OR.icon('target', 'icon-sm') + 'Practise the estimates step</a></p></div>';
    var root = main.firstChild;
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-step]'); if (!a) return;
      e.preventDefault(); scrollTo(OR.$('#sd-step-' + a.dataset.step, root));
    });
    OR.setPlace({ title: 'Interview framework', section: '' });
  }

  /* ---------- Estimation calculator ---------- */
  function toInput(n) {
    var U = [[1e12, 't'], [1e9, 'b'], [1e6, 'M'], [1e3, 'k']];
    for (var i = 0; i < U.length; i++) if (n >= U[i][0] && Math.round(n / U[i][0] * 10) / 10 * U[i][0] === n) return String(Math.round(n / U[i][0] * 10) / 10) + U[i][1];
    return String(n);
  }
  function calcTable(rows) {
    var group = '';
    return '<div class="table-wrap"><table class="table sd-calc"><thead><tr><th>Quantity</th><th>Formula</th><th class="r">Result</th></tr></thead><tbody>' + rows.map(function (r) {
      var g = r.group !== group ? '<tr class="sd-calc-group"><th colspan="3">' + esc(r.group) + '</th></tr>' : ''; group = r.group;
      return g + '<tr><td>' + esc(r.label) + '</td><td class="mono sd-formula">' + esc(r.formula) + '</td><td class="r num"><strong>' + esc(r.text) + '</strong></td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  var PRESETS = [
    { name: 'Chat messenger', v: { dau: 50e6, writesPerUser: 40, readsPerUser: 200, peakFactor: 3, bytesPerWrite: 200, bytesPerRead: 200, years: 5, replication: 3 } },
    { name: 'Photo sharing', v: { dau: 30e6, writesPerUser: 0.3, readsPerUser: 50, peakFactor: 2, bytesPerWrite: 2e6, bytesPerRead: 3e5, years: 5, replication: 3 } },
    { name: 'Internal dashboard', v: { dau: 5e3, writesPerUser: 2, readsPerUser: 100, peakFactor: 4, bytesPerWrite: 500, bytesPerRead: 5e3, years: 3, replication: 2, serverQps: 500 } }
  ];
  function numbersHTML() {
    if (!SD.numbers.length) return '';
    return '<section class="sd-sec" aria-labelledby="sd-h-nums"><div class="sd-sec-head"><h2 class="sd-h" id="sd-h-nums">Numbers every engineer should know</h2></div>' +
      '<p class="sd-sec-lede">Orders of magnitude for back-of-envelope work. Hardware changes, so rows marked <span class="sd-approx">approx.</span> are rounded rules of thumb to reason with, not specifications.</p>' +
      SD.numbers.map(function (g) {
        return '<h3 class="sd-group">' + esc(g.group) + '</h3>' + (g.note ? '<p class="faint sd-nnote">' + OR.inline(g.note) + '</p>' : '') +
          '<div class="table-wrap"><table class="table sd-nums"><thead><tr><th>' + esc(g.col || 'Operation') + '</th><th>Value</th><th>Note</th></tr></thead><tbody>' + g.rows.map(function (r) {
            return '<tr><td>' + OR.inline(r.name) + '</td><td class="num mono">' + (r.approx ? '<span class="sd-approx" title="Approximate">≈</span> ' : '') + esc(r.value) + '</td><td class="muted">' + OR.inline(r.note || '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }).join('') + '</section>';
  }
  function calcView(main, ctx) {
    var E = SD.estimate, vals = {}, presets = PRESETS.slice();
    SD.cases.forEach(function (c) { if (c.estimates && c.estimates.inputs) presets.unshift({ name: c.title, v: c.estimates.inputs }); });
    E.FIELDS.forEach(function (f) { vals[f.id] = ctx.query[f.id] != null ? ctx.query[f.id] : toInput(f.def); });
    main.innerHTML = '<div class="page sd sd-calcpage">' + crumbs('Estimation calculator') +
      '<div class="page-head"><div><h1 class="page-title display">Estimation calculator</h1><p class="page-lede">Change any input and every line recomputes, formula included. Type 10M, 2.5k or 1e6. Units are decimal (1 KB is 1,000 bytes) and a day is 86,400 seconds, because interview math rounds to powers of ten.</p></div></div>' +
      '<div class="sd-calc-grid"><form class="sd-form" aria-label="Estimation inputs" onsubmit="return false"><label class="field"><span class="field-label">Start from</span><select class="select" id="sd-preset"><option value="">Defaults</option>' +
        presets.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + '</option>'; }).join('') + '</select></label>' +
        E.FIELDS.map(function (f) {
          return '<label class="field"><span class="field-label">' + esc(f.label) + ' <span class="faint">(' + esc(f.unit) + ')</span></span><input class="input num" data-f="' + f.id + '" inputmode="decimal" autocomplete="off" spellcheck="false" value="' + esc(vals[f.id]) + '" aria-describedby="sd-hint-' + f.id + '"><span class="field-hint" id="sd-hint-' + f.id + '">' + esc(f.hint) + '</span></label>';
        }).join('') + '<button class="btn btn-ghost" type="button" id="sd-reset">' + OR.icon('reset', 'icon-sm') + 'Reset inputs</button></form>' +
      '<div class="sd-calc-out" aria-live="polite"></div></div>' + numbersHTML() + '</div>';
    var root = main.firstChild, out = OR.$('.sd-calc-out', root);
    function recalc() {
      var ok = true;
      OR.$$('[data-f]', root).forEach(function (inp) {
        var bad = !isFinite(E.parse(inp.value)) || E.parse(inp.value) < 0; inp.setAttribute('aria-invalid', String(bad)); if (bad) ok = false;
        vals[inp.dataset.f] = inp.value;
      });
      out.innerHTML = (ok ? '' : '<p class="banner" data-tone="warn">' + OR.icon('warning') + '<span>One input is not a number, so its default is used for now.</span></p>') + calcTable(E.compute(vals)) +
        '<p class="faint sd-calc-note">Cache size assumes every read in a day touches distinct data, so it is an upper bound; real traffic repeats keys. Server count ignores the database and cache tiers.</p>';
      var q = {}; E.FIELDS.forEach(function (f) { if (String(vals[f.id]) !== toInput(f.def)) q[f.id] = vals[f.id]; });
      OR.setQuery(q);
    }
    function setAll(v) { E.FIELDS.forEach(function (f) { OR.$('[data-f="' + f.id + '"]', root).value = toInput(v && v[f.id] != null ? v[f.id] : f.def); }); recalc(); }
    root.addEventListener('input', function (e) { if (e.target.dataset.f) recalc(); });
    OR.$('#sd-preset', root).addEventListener('change', function (e) { setAll(e.target.value === '' ? null : presets[+e.target.value].v); });
    OR.$('#sd-reset', root).addEventListener('click', function () { OR.$('#sd-preset', root).value = ''; setAll(null); });
    recalc();
    OR.setPlace({ title: 'Estimation calculator', section: '' });
  }

  /* ---------- Case study and LLD sections ---------- */
  function colsHTML(defs) {
    var live = defs.filter(function (d) { return d[1] && d[1].length; });
    return '<div class="sd-cols' + live.length + '">' + live.map(function (d) { return '<div><h3 class="sub-title">' + esc(d[0]) + '</h3>' + ul(d[1]) + '</div>'; }).join('') + '</div>';
  }
  function requirementsHTML(r) {
    r = r || {};
    return colsHTML([['Functional', r.functional], ['Non-functional', r.nonFunctional], ['Assumptions', r.assumptions], ['Out of scope', r.outOfScope]]) +
      ((r.clarify || []).length ? '<h3 class="sub-title">Questions to ask first</h3><dl class="followups sd-clarify">' + r.clarify.map(function (c) { return '<dt>' + OR.inline(c.q) + '</dt><dd>' + OR.md(c.a) + '</dd>'; }).join('') + '</dl>' : '');
  }
  function estimatesHTML(e) {
    var E = SD.estimate, rows = E.compute(e.inputs || {}), set = e.inputs || {}, q = Object.keys(set).map(function (k) { return k + '=' + encodeURIComponent(set[k]); }).join('&');
    var fields = E.FIELDS.filter(function (f) { return set[f.id] != null; });
    return (e.intro ? '<div class="prose">' + OR.md(e.intro) + '</div>' : '') +
      '<h3 class="sub-title">Assumptions</h3><div class="table-wrap"><table class="table sd-assume"><tbody>' + fields.map(function (f) {
        return '<tr><td>' + esc(f.label) + '</td><td class="r num"><strong>' + esc(E.format(E.parse(set[f.id]), f.unit === 'bytes' ? 'bytes' : 'count')) + '</strong> <span class="faint">' + esc(f.unit === 'bytes' ? '' : f.unit) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' + ul(e.assumptions) +
      '<h3 class="sub-title">The math</h3>' + calcTable(rows) +
      ((e.extra || []).length ? '<h3 class="sub-title">Case-specific numbers</h3><div class="table-wrap"><table class="table sd-calc"><thead><tr><th>Quantity</th><th>Working</th><th class="r">Result</th></tr></thead><tbody>' + e.extra.map(function (x) {
        return '<tr><td>' + esc(x.label) + '</td><td class="mono sd-formula">' + esc(x.formula) + '</td><td class="r num"><strong>' + esc(x.result) + '</strong></td></tr>';
      }).join('') + '</tbody></table></div>' : '') +
      ((e.notes || []).length ? '<h3 class="sub-title">What these numbers tell you</h3>' + ul(e.notes) : '') +
      '<p><a class="btn" href="' + BASE + '/calculator?' + q + '">' + OR.icon('target', 'icon-sm') + 'Open these inputs in the calculator</a></p>';
  }
  function apiHTML(c) {
    return c.api.map(function (a) {
      return '<article class="sd-api"><h3 class="sd-api-line"><span class="sd-method m-' + esc(a.method) + '">' + esc(a.method) + '</span><code>' + esc(a.path) + '</code></h3>' +
        '<p>' + OR.inline(a.desc || '') + '</p><div class="sd-api-io">' +
        (a.request ? '<div><h4>Request</h4>' + OR.md(fence('json', a.request)) + '</div>' : '') + (a.response ? '<div><h4>Response</h4>' + OR.md(fence('json', a.response)) + '</div>' : '') + '</div>' +
        (a.notes ? ul(Array.isArray(a.notes) ? a.notes : [a.notes]) : '') + '</article>';
    }).join('') + (c.apiNotes && c.apiNotes.length ? '<h3 class="sub-title">Design notes</h3>' + ul(c.apiNotes) : '');
  }
  function dataHTML(d) {
    return (d.intro ? '<div class="prose">' + OR.md(d.intro) + '</div>' : '') +
      (d.entities || []).map(function (en) {
        return '<h3 class="sub-title">' + esc(en.name) + '</h3>' + (en.purpose ? '<p class="muted">' + OR.inline(en.purpose) + '</p>' : '') +
          '<div class="table-wrap"><table class="table"><thead><tr><th>Field</th><th>Type</th><th>Note</th></tr></thead><tbody>' + en.fields.map(function (f) {
            return '<tr><td><code>' + esc(f[0]) + '</code></td><td class="mono">' + esc(f[1]) + '</td><td class="muted">' + OR.inline(f[2] || '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }).join('') +
      ((d.storage || []).length ? '<h3 class="sd-h2">Storage options</h3>' + d.storage.map(function (s) {
        return '<div class="sd-opt"><h3 class="sub-title">' + esc(s.title) + (s.verdict ? ' <span class="chip chip-accent">' + esc(s.verdict) + '</span>' : '') + '</h3><div class="prose">' + OR.md(s.body) + '</div></div>';
      }).join('') : '') +
      ((d.decisions || []).length ? '<h3 class="sd-h2">Decisions</h3>' + d.decisions.map(function (x) {
        return '<div class="sd-opt"><h3 class="sub-title">' + esc(x.title) + '</h3>' + (x.question ? '<div class="prose">' + OR.md(x.question) + '</div>' : '') +
          '<div class="table-wrap"><table class="table sd-decide"><thead><tr><th>Option</th><th>For</th><th>Against</th></tr></thead><tbody>' + x.options.map(function (o) {
            return '<tr><td><strong>' + OR.inline(o.name) + '</strong></td><td>' + OR.inline(o.pros || '') + '</td><td>' + OR.inline(o.cons || '') + '</td></tr>';
          }).join('') + '</tbody></table></div>' + (x.pick ? '<div class="prose sd-pick"><p><strong>Pick.</strong> ' + OR.inline(x.pick) + '</p></div>' : '') + '</div>';
      }).join('') : '');
  }
  function designHTML(d) {
    return (d.intro ? '<div class="prose">' + OR.md(d.intro) + '</div>' : '') + '<figure class="sd-fig sd-fig-wide"><div class="sd-dg"></div></figure>' +
      ((d.walkthrough || []).length ? '<h3 class="sub-title">Walk through it</h3><ol class="sd-walk prose">' + d.walkthrough.map(function (w) { return '<li>' + OR.inline(w) + '</li>'; }).join('') + '</ol>' : '') +
      (d.notes && d.notes.length ? ul(d.notes) : '');
  }
  function deepHTML(list) {
    return list.map(function (d, i) {
      return '<details class="worked"' + (i === 0 ? ' open' : '') + '><summary><span class="worked-n num">' + (i + 1) + '</span><span class="worked-title">' + esc(d.title) + '</span></summary><div class="worked-body prose">' +
        '<h4>The question</h4>' + OR.md(d.question) + '<h4>A strong answer</h4>' + OR.md(d.answer) +
        ((d.followups || []).length ? '<h4>Follow-ups they might ask</h4><dl class="followups">' + d.followups.map(function (f) { return '<dt>' + OR.inline(f.q) + '</dt><dd>' + OR.md(f.a) + '</dd>'; }).join('') + '</dl>' : '') + '</div></details>';
    }).join('');
  }
  function bottlenecksHTML(list) {
    return list.map(function (b) {
      return '<article class="sd-bn"><h3 class="sub-title">' + esc(b.title) + '</h3><div class="sd-cols2"><div><h4 class="sd-mini">What breaks</h4><div class="prose">' + OR.md(b.problem) + '</div></div><div><h4 class="sd-mini">What you do about it</h4><div class="prose">' + OR.md(b.mitigation) + '</div></div></div></article>';
    }).join('');
  }
  function pushesHTML(list) {
    return '<dl class="sd-push">' + list.map(function (p) {
      return '<div><dt>' + OR.inline(p.q) + '</dt><dd>' + (p.why ? '<p><span class="sd-lab">Why they ask</span> ' + OR.inline(p.why) + '</p>' : '') + (p.good ? '<p><span class="sd-lab">A strong answer covers</span> ' + OR.inline(p.good) + '</p>' : '') + '</dd></div>';
    }).join('') + '</dl>';
  }
  function practiceHTML(c) {
    return ((c.quiz || []).length ? '<h3 class="sub-title">Quiz</h3><div class="sd-quiz"></div>' : '') + ((c.flashcards || []).length ? '<h3 class="sub-title">Flashcards</h3>' + cardsHTML(c) : '');
  }
  function lldCodeHTML(list) {
    return list.map(function (x) { return '<div class="sd-code"><h3 class="sub-title">' + esc(x.title) + '</h3>' + (x.note ? '<div class="prose">' + OR.md(x.note) + '</div>' : '') + OR.codeBlock(x.code, { title: x.title }) + '</div>'; }).join('');
  }
  function decisionsHTML(list) {
    return list.map(function (x) {
      return '<article class="sd-opt"><h3 class="sub-title">' + esc(x.title) + (x.pattern ? ' <span class="chip">' + esc(x.pattern) + '</span>' : '') + '</h3><div class="prose">' + OR.md(x.body) + '</div>' + (x.tradeoffs && x.tradeoffs.length ? '<h4 class="sd-mini">Trade-offs</h4>' + ul(x.tradeoffs) : '') + '</article>';
    }).join('');
  }
  function extensionsHTML(list) {
    return '<dl class="followups sd-clarify">' + list.map(function (x) { return '<dt>' + OR.inline(x.q) + '</dt><dd>' + OR.md(x.a) + '</dd>'; }).join('') + '</dl>';
  }
  function sectionHTML(c, kind, k) {
    if (k === 'requirements') return requirementsHTML(c.requirements);
    if (k === 'estimates') return estimatesHTML(c.estimates);
    if (k === 'api') return apiHTML(c);
    if (k === 'data') return dataHTML(c.data);
    if (k === 'design') return designHTML(c.design);
    if (k === 'deep-dives') return deepHTML(c.deepDives);
    if (k === 'tradeoffs') return bottlenecksHTML(c.bottlenecks);
    if (k === 'mistakes') return '<ul class="tp-mistakes prose">' + c.mistakes.map(function (m) { return '<li>' + OR.inline(m) + '</li>'; }).join('') + '</ul>';
    if (k === 'pushes') return pushesHTML(c.pushes);
    if (k === 'classes') return (c.classDiagram.intro ? '<div class="prose">' + OR.md(c.classDiagram.intro) + '</div>' : '') + '<figure class="sd-fig sd-fig-wide"><div class="sd-dg"></div></figure>';
    if (k === 'decisions') return decisionsHTML(c.decisions);
    if (k === 'code') return lldCodeHTML(c.code);
    if (k === 'extensions') return extensionsHTML(c.extensions);
    return practiceHTML(c);
  }

  function itemView(main, c, kind, section) {
    var secs = secsOf(c, kind), key = 'sd:' + c.id, cleanups = [];
    if (!secs.length) { main.innerHTML = '<div class="page empty"><h1 class="empty-title display">' + esc(c.title) + ' has no content yet</h1><a class="btn" href="' + BASE + '">System design</a></div>'; return; }
    var cur = secs.filter(function (s) { return s[0] === section; })[0] || secs[0], ci = secs.indexOf(cur);
    markRead(key, cur[0]);
    var read = readOf(key), p = progress(c, kind), list = kind === 'lld' ? SD.lld : SD.cases;
    var href = function (s) { return BASE + '/' + c.id + '/' + s[0]; };
    main.innerHTML = '<div class="page tp sd sd-item">' + crumbs(kind === 'lld' ? 'Low-level design' : 'Case study') +
      head(String(list.indexOf(c) + 1).padStart(2, '0'), c.title, c.prompt || c.short,
        (c.difficulty ? metaItem('Difficulty', diffChip(c.difficulty)) : '') + (c.time ? metaItem('Time', '<span class="num">' + esc(c.time) + '</span>') : '') +
        ((c.tags || []).length ? metaItem('Topics', (c.tags || []).map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join(' ')) : '') +
        metaItem('Progress', '<span class="mbar" data-level="' + (p.read === p.total ? 'mastered' : 'practicing') + '"><span style="width:' + Math.round(100 * p.read / p.total) + '%"></span></span> <span class="num">' + p.read + ' of ' + p.total + '</span>')) +
      '<div class="tp-layout"><nav class="tp-toc" aria-label="Sections"><ol>' + secs.map(function (s) {
        return '<li><a href="' + href(s) + '" data-sec="' + s[0] + '"' + (s === cur ? ' aria-current="true"' : '') + (read[s[0]] ? ' data-read="true"' : '') + '>' + esc(s[1]) + '</a></li>';
      }).join('') + '</ol></nav><div class="tp-body sd-body"><section class="tp-sec" id="sd-sec" aria-labelledby="sd-sec-h"><h2 class="tp-h" id="sd-sec-h">' + esc(cur[1]) + '</h2>' + sectionHTML(c, kind, cur[0]) + '</section>' +
      pager(secs[ci - 1] && [href(secs[ci - 1]), secs[ci - 1][1]], secs[ci + 1] && [href(secs[ci + 1]), secs[ci + 1][1]]) + '</div></div></div>';
    var root = main.firstChild;
    var dg = OR.$('.sd-dg', root);
    if (dg) mountDiagram(dg, cur[0] === 'design' ? c.design.diagram : c.classDiagram, cleanups);
    quizAndCards(root, key, c);
    OR.setPlace({ title: c.title, section: cur[1] });
    return function () { cleanups.forEach(function (f) { f(); }); };
  }

  /* ---------- Router and search ---------- */
  function resolve(ctx) {
    var id = ctx.params.id, sec = ctx.params.section;
    if (!id) return { kind: 'index' };
    if (id === 'fundamentals') { var f = find(SD.fundamentals, sec); return f ? { kind: 'fund', item: f } : sec ? { kind: 'missing' } : { kind: 'index' }; }
    if (id === 'framework') return { kind: 'framework' };
    if (id === 'calculator') return { kind: 'calculator' };
    var c = find(SD.cases, id); if (c) return { kind: 'case', item: c };
    var l = find(SD.lld, id); if (l) return { kind: 'lld', item: l };
    return { kind: 'missing' };
  }
  OR.views.systemDesign = {
    title: function (ctx) {
      var r = resolve(ctx);
      return r.kind === 'index' ? 'System design' : r.kind === 'framework' ? 'Interview framework' : r.kind === 'calculator' ? 'Estimation calculator' : r.item ? r.item.title : 'System design';
    },
    render: function (main, ctx) {
      var r = resolve(ctx);
      if (r.kind === 'index') { indexView(main); return; }
      if (r.kind === 'fund') return fundView(main, r.item);
      if (r.kind === 'framework') { frameworkView(main); return; }
      if (r.kind === 'calculator') { calcView(main, ctx); return; }
      if (r.kind === 'case' || r.kind === 'lld') return itemView(main, r.item, r.kind, ctx.params.section);
      main.innerHTML = '<div class="page empty"><h1 class="empty-title display">No system design page called “' + esc(ctx.params.section || ctx.params.id) + '”</h1><a class="btn btn-primary" href="' + BASE + '">All system design</a></div>';
    }
  };
  OR.addSearch(function () {
    var out = [
      { group: 'System design', title: 'System design framework: the 45-minute interview', sub: 'Time boxes and what to say', icon: 'system', href: BASE + '/framework', keywords: 'requirements estimates api data model deep dive trade-offs steps' },
      { group: 'System design', title: 'Estimation calculator', sub: 'QPS, storage, bandwidth, cache, servers', icon: 'system', href: BASE + '/calculator', keywords: 'back of envelope capacity qps dau storage bandwidth latency numbers every engineer should know' }
    ];
    SD.fundamentals.forEach(function (f) { out.push({ group: 'System design', title: f.title, sub: 'Fundamentals · ' + (f.group || ''), icon: 'system', href: BASE + '/fundamentals/' + f.id, keywords: (f.keywords || '') + ' ' + (f.hook || '') }); });
    SD.cases.forEach(function (c) { out.push({ group: 'System design', title: c.title, sub: 'Case study · ' + (c.difficulty || ''), icon: 'system', href: BASE + '/' + c.id, keywords: (c.tags || []).join(' ') + ' ' + (c.short || '') }); });
    SD.lld.forEach(function (c) { out.push({ group: 'System design', title: c.title, sub: 'Low-level design · ' + (c.difficulty || ''), icon: 'system', href: BASE + '/' + c.id, keywords: (c.tags || []).join(' ') + ' class diagram ' + (c.short || '') }); });
    return out;
  });
})();
