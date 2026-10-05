/* Offer Ready: CS fundamentals refresher (#/cs, #/cs/:id).
   Tracks come from data/cs/*.js (OR.cs: lesson sections, mini-quiz, flashcards). Two special pages:
   #/cs/sql is the SQL practice set (OR.csSql: no database, the reference solution and the exact expected
   table are data; you self-check), and #/cs/quick is the searchable quick-hit list (OR.csQuick).
   Track flashcards are registered into OR.flashcards as deck "cs". */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var SPECIAL = [
    { id: 'sql', title: 'SQL practice', blurb: 'Joins, grouping, window functions, self joins and NULL traps, with hidden reference solutions and exact expected results.', icon: 'code' },
    { id: 'quick', title: 'Quick hits', blurb: 'Rapid question and answer pairs across every track. Searchable; tap a question to reveal the answer.', icon: 'bolt' }
  ];

  function tracks() { return (OR.cs || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }); }
  function track(id) { return tracks().filter(function (t) { return t.id === id; })[0]; }
  function sqlCount() { return OR.csSql ? OR.csSql.exercises.length : 0; }
  function quick() { return OR.csQuick || []; }

  // Flashcards join the global deck (deck id "cs").
  tracks().forEach(function (t) {
    (t.cards || []).forEach(function (c) { OR.flashcards.push({ id: 'cs:' + t.id + ':' + c.id, deck: 'cs', front: c.front, back: c.back }); });
  });

  function td(v) { return v === null ? '<td class="csf-null">NULL</td>' : '<td>' + esc(v) + '</td>'; }
  function grid(cols, rows, cap) {
    return '<div class="table-wrap"><table class="table csf-grid"><caption class="sr-only">' + esc(cap) + '</caption><thead><tr>' + cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + (rows.length ? rows.map(function (r) { return '<tr>' + r.map(td).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + cols.length + '" class="csf-null">No rows</td></tr>') + '</tbody></table></div>';
  }

  /* ---------- Index ---------- */
  function renderIndex(main) {
    var cards = tracks().map(function (t, i) {
      return '<a class="csf-card" href="#/cs/' + t.id + '"><span class="bib-tag">' + String(i + 1).padStart(2, '0') + '</span><span class="csf-card-body"><strong class="csf-card-title">' + esc(t.title) + '</strong>' +
        '<span class="csf-card-blurb">' + esc(t.blurb) + '</span><span class="csf-card-meta">' + t.sections.length + ' sections, ' + (t.quiz || []).length + ' quiz questions, ' + (t.cards || []).length + ' cards, about ' + t.minutes + ' min</span></span></a>';
    }).concat(SPECIAL.map(function (s, i) {
      var n = s.id === 'sql' ? sqlCount() + ' exercises' : quick().length + ' questions';
      return '<a class="csf-card csf-card-alt" href="#/cs/' + s.id + '"><span class="bib-tag">' + String(tracks().length + i + 1).padStart(2, '0') + '</span><span class="csf-card-body"><strong class="csf-card-title">' + esc(s.title) + '</strong>' +
        '<span class="csf-card-blurb">' + esc(s.blurb) + '</span><span class="csf-card-meta">' + n + '</span></span></a>';
    }));
    var nCards = tracks().reduce(function (n, t) { return n + (t.cards || []).length; }, 0);
    main.innerHTML = '<div class="page csf"><div class="page-head"><div><h1 class="page-title display">CS fundamentals</h1><p class="page-lede">The operating systems, concurrency, networking and database basics that screening rounds probe. Each track is a short lesson, a mini-quiz and flashcards.</p></div>' +
      '<a class="btn" href="#/flashcards/cs">' + OR.icon('cards', 'icon-sm') + 'Study the ' + nCards + ' CS cards</a></div>' +
      '<div class="csf-grid-cards">' + cards.join('') + '</div></div>';
  }

  /* ---------- A lesson track ---------- */
  function codeHTML(sec) {
    return (sec.code || []).map(function (c) { return OR.codeBlock(c.code, { title: c.title }); }).join('');
  }
  function renderTrack(main, t) {
    var secs = t.sections, n = tracks().indexOf(t) + 1;
    var toc = secs.map(function (s) { return '<li><a href="#/cs/' + t.id + '" data-sec="' + s.id + '">' + esc(s.title) + '</a></li>'; }).join('') +
      '<li><a href="#/cs/' + t.id + '" data-sec="quiz">Mini-quiz</a></li><li><a href="#/cs/' + t.id + '" data-sec="cards">Flashcards</a></li>';
    main.innerHTML = '<div class="page csf tp">' +
      '<header class="tp-head"><span class="bib-tag tp-bib">' + String(n).padStart(2, '0') + '</span><div class="tp-headline"><h1 class="page-title display">' + esc(t.title) + '</h1><p class="tp-hook">' + OR.inline(t.blurb) + '</p></div>' +
      '<dl class="tp-meta"><div><dt>Track</dt><dd><a href="#/cs">CS fundamentals</a></dd></div><div><dt>Reading time</dt><dd class="num">about ' + t.minutes + ' min</dd></div></dl></header>' +
      '<div class="tp-layout"><nav class="tp-toc" aria-label="On this page"><ol>' + toc + '</ol></nav><div class="tp-body">' +
      secs.map(function (s) {
        return '<section class="tp-sec" id="csf-' + s.id + '" aria-labelledby="csf-h-' + s.id + '"><h2 class="tp-h" id="csf-h-' + s.id + '">' + esc(s.title) + '</h2><div class="prose">' + OR.md(s.body) + '</div>' + codeHTML(s) + '</section>';
      }).join('') +
      '<section class="tp-sec" id="csf-quiz" aria-labelledby="csf-h-quiz"><h2 class="tp-h" id="csf-h-quiz">Mini-quiz</h2><div class="tp-quiz"></div></section>' +
      '<section class="tp-sec" id="csf-cards" aria-labelledby="csf-h-cards"><h2 class="tp-h" id="csf-h-cards">Flashcards</h2><p class="muted">' + OR.plural((t.cards || []).length, 'card') + ' join your spaced-repetition deck under “CS fundamentals”.</p><div class="tp-cards">' +
      (t.cards || []).map(function (c) { return '<details class="tp-card"><summary>' + OR.inline(c.front) + '</summary><div class="prose">' + OR.md(c.back) + '</div></details>'; }).join('') +
      '</div><a class="btn" href="#/flashcards/cs">' + OR.icon('cards', 'icon-sm') + 'Study the CS deck</a>' +
      (t.related ? ' <a class="btn" href="' + esc(t.related.href) + '">' + esc(t.related.label) + '</a>' : '') + '</section>' +
      '</div></div></div>';
    var root = main.firstChild;
    OR.quiz(OR.$('.tp-quiz', root), { key: 'cs:' + t.id, questions: t.quiz });
    root.addEventListener('click', function (e) {
      var a = e.target.closest('.tp-toc a'); if (!a) return;
      e.preventDefault();
      var el = OR.$('#csf-' + a.dataset.sec, root);
      if (el) { el.scrollIntoView({ block: 'start', behavior: OR.reducedMotion() ? 'auto' : 'smooth' }); }
    });
  }

  /* ---------- SQL practice ---------- */
  var MARKS = { right: 'Got it', wrong: 'Missed it' };
  function draftKey(id) { return 'cs-sql:' + id; }
  function draft(id) { return OR.store.get().drafts[draftKey(id)] || {}; }
  function saveDraft(id, patch) {
    OR.store.update(function (s) { s.drafts[draftKey(id)] = Object.assign({}, s.drafts[draftKey(id)] || {}, patch, { at: Date.now() }); });
  }
  function tablesHTML(e) {
    return '<div class="csf-tables">' + e.tables.map(function (name) {
      var t = OR.csSql.tables[name];
      return '<details class="csf-table"><summary><code>' + esc(name) + '</code><span class="faint">' + t.rows.length + ' rows</span></summary><pre class="md-code"><code>' + esc(t.ddl) + ';</code></pre>' + grid(t.cols, t.rows, name + ' sample data') + '</details>';
    }).join('') + '</div>';
  }
  function exHTML(e, i) {
    var d = draft(e.id);
    return '<article class="csf-ex" id="ex-' + esc(e.id) + '" data-id="' + esc(e.id) + '"' + (d.mark ? ' data-mark="' + d.mark + '"' : '') + ' aria-labelledby="exh-' + esc(e.id) + '">' +
      '<header class="csf-ex-head"><span class="bib-tag">' + String(i + 1).padStart(2, '0') + '</span><h2 class="csf-ex-title" id="exh-' + esc(e.id) + '">' + esc(e.title) + '</h2><span class="chip">' + esc(e.level) + '</span><span class="csf-ex-state" data-state>' + (d.mark ? OR.icon(d.mark === 'right' ? 'check' : 'x', 'icon-sm') + MARKS[d.mark] : '') + '</span></header>' +
      '<div class="prose"><p>' + OR.inline(e.q) + '</p></div>' + tablesHTML(e) +
      '<label class="field-label" for="q-' + esc(e.id) + '">Your query</label>' +
      '<textarea class="textarea csf-query" id="q-' + esc(e.id) + '" rows="5" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="SELECT ...">' + esc(d.text || '') + '</textarea>' +
      '<div class="csf-expected"><h3 class="sub-title">Expected result</h3>' + grid(e.expected.cols, e.expected.rows, 'Expected result') +
      '<p class="faint">Match the rows and their order. Column names and the exact way you get there may differ.</p></div>' +
      '<div class="btn-row"><button class="btn" type="button" data-cs="reveal" aria-expanded="false" aria-controls="sol-' + esc(e.id) + '">' + OR.icon('eye', 'icon-sm') + 'Show reference solution</button></div>' +
      '<div class="csf-solution" id="sol-' + esc(e.id) + '" hidden><pre class="md-code"><code>' + esc(e.solution) + '</code></pre><div class="prose"><p>' + OR.inline(e.note) + '</p></div>' +
      '<div class="csf-judge" role="group" aria-label="How did your query compare?"><span>How did yours compare?</span>' +
      '<button class="btn btn-sm" type="button" data-cs="right">' + OR.icon('check', 'icon-sm') + 'Got it</button><button class="btn btn-sm" type="button" data-cs="wrong">' + OR.icon('x', 'icon-sm') + 'Missed it</button></div></div></article>';
  }
  function renderSql(main) {
    var ex = (OR.csSql || { exercises: [] }).exercises;
    function tally() {
      var r = 0, w = 0; ex.forEach(function (e) { var m = draft(e.id).mark; if (m === 'right') r++; else if (m === 'wrong') w++; });
      return r + ' got it, ' + w + ' missed, ' + (ex.length - r - w) + ' not marked yet.';
    }
    main.innerHTML = '<div class="page csf"><div class="page-head"><div><h1 class="page-title display">SQL practice</h1><p class="page-lede">There is no database here. Read the tables, write your query in the box (use your own editor or an online SQL sandbox to try it), then reveal the reference solution, compare your query and its result with the expected table, and mark yourself.</p></div>' +
      '<p class="csf-tally num" id="csf-tally" aria-live="polite">' + tally() + '</p></div>' +
      '<p class="banner">' + OR.icon('info') + '<span>Queries use standard SQL and were checked in SQLite 3.42; window functions need SQLite 3.25 or newer, PostgreSQL, MySQL 8 or SQL Server. Date functions differ by dialect, and the notes say where.</span></p>' +
      '<div class="csf-exs">' + ex.map(exHTML).join('') + '</div></div>';
    var root = main.firstChild;
    function mark(art, m) {
      saveDraft(art.dataset.id, { mark: m });
      art.dataset.mark = m;
      OR.$('[data-state]', art).innerHTML = OR.icon(m === 'right' ? 'check' : 'x', 'icon-sm') + MARKS[m];
      OR.$('#csf-tally', root).textContent = tally();
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cs]'); if (!b) return;
      var art = b.closest('.csf-ex'), sol = OR.$('.csf-solution', art);
      if (b.dataset.cs === 'reveal') {
        var open = sol.hidden; sol.hidden = !open; b.setAttribute('aria-expanded', open);
        b.lastChild.textContent = open ? 'Hide reference solution' : 'Show reference solution';
      } else mark(art, b.dataset.cs);
    });
    var save = OR.debounce(function (id, text) { saveDraft(id, { text: text }); }, 500);
    root.addEventListener('input', function (e) { if (e.target.classList.contains('csf-query')) save(e.target.closest('.csf-ex').dataset.id, e.target.value); });
  }

  /* ---------- Quick hits ---------- */
  var QTAG = { os: 'Operating systems', cc: 'Concurrency', net: 'Networking', db: 'Databases', gen: 'General' };
  function renderQuick(main) {
    var all = quick(), tag = '', term = '';
    main.innerHTML = '<div class="page csf"><div class="page-head"><div><h1 class="page-title display">Quick hits</h1><p class="page-lede">' + all.length + ' rapid questions. Say the answer out loud first, then open it.</p></div></div>' +
      '<div class="csf-quick-tools"><label class="csf-search"><span class="field-label">Search</span><input class="input" type="search" id="csf-q" placeholder="Search questions and answers" autocomplete="off"></label>' +
      '<div class="seg" role="group" aria-label="Filter by track"><button type="button" aria-pressed="true" data-tag="">All</button>' + Object.keys(QTAG).map(function (k) { return '<button type="button" aria-pressed="false" data-tag="' + k + '">' + QTAG[k] + '</button>'; }).join('') + '</div></div>' +
      '<p class="muted" id="csf-q-count" aria-live="polite"></p><div class="csf-quick" id="csf-q-list"></div></div>';
    var list = OR.$('#csf-q-list', main), count = OR.$('#csf-q-count', main);
    function paint() {
      var words = term.toLowerCase().split(/\s+/).filter(Boolean);
      var hit = all.filter(function (r) {
        if (tag && r.t !== tag) return false;
        var hay = (r.q + ' ' + r.a).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) >= 0; });
      });
      count.textContent = hit.length === all.length ? '' : OR.plural(hit.length, 'match', 'matches') + ' of ' + all.length + '.';
      list.innerHTML = hit.length ? hit.map(function (r) {
        return '<details class="tp-card csf-qa"><summary>' + OR.inline(r.q) + '<span class="chip">' + esc(QTAG[r.t] || r.t) + '</span></summary><div class="prose">' + OR.md(r.a) + '</div></details>';
      }).join('') : '<p class="muted">Nothing matches. Try fewer or different words.</p>';
    }
    OR.$('#csf-q', main).addEventListener('input', function (e) { term = e.target.value; paint(); });
    OR.$('.seg', main).addEventListener('click', function (e) {
      var b = e.target.closest('[data-tag]'); if (!b) return;
      tag = b.dataset.tag;
      OR.$$('.seg button', main).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      paint();
    });
    paint();
  }

  /* ---------- View ---------- */
  OR.views.cs = {
    title: function (ctx) {
      var id = ctx.params.id, t = track(id), s = SPECIAL.filter(function (x) { return x.id === id; })[0];
      return t ? t.title : s ? s.title : 'CS fundamentals';
    },
    render: function (main, ctx) {
      var id = ctx.params.id;
      if (!id) return renderIndex(main);
      if (id === 'sql') return renderSql(main);
      if (id === 'quick') return renderQuick(main);
      var t = track(id);
      if (!t) { main.innerHTML = '<div class="page empty"><h1 class="empty-title display">No CS track called “' + esc(id) + '”</h1><a class="btn btn-primary" href="#/cs">All CS tracks</a></div>'; return; }
      renderTrack(main, t);
    }
  };

  // Command palette: tracks, sections, SQL exercises and quick hits.
  OR.addSearch(function () {
    var out = [{ group: 'CS fundamentals', title: 'CS fundamentals', sub: 'All tracks', icon: 'cpu', href: '#/cs' }];
    tracks().forEach(function (t) {
      out.push({ group: 'CS fundamentals', title: t.title, sub: 'Track', icon: 'cpu', href: '#/cs/' + t.id, keywords: t.blurb });
      t.sections.forEach(function (s) { out.push({ group: 'CS fundamentals', title: s.title, sub: t.title, icon: 'cpu', href: '#/cs/' + t.id }); });
    });
    ((OR.csSql || {}).exercises || []).forEach(function (e) { out.push({ group: 'SQL practice', title: e.title, sub: e.level, icon: 'code', href: '#/cs/sql', keywords: 'sql query ' + e.q }); });
    quick().forEach(function (r) { out.push({ group: 'Quick hits', title: String(r.q).replace(/[`*_]/g, '').slice(0, 90), sub: QTAG[r.t], icon: 'cpu', href: '#/cs/quick', keywords: r.a }); });
    return out;
  });
})();
