/* Offer Ready: problem browser (#/problems) and the shared problem helpers.
   Filters live in the query string, so reload and back keep them. Rows re-render in place. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  /* ---------- Shared helpers ---------- */
  OR.STATUS = [
    ['todo', 'To do'], ['attempted', 'Attempted'], ['solved', 'Solved'], ['clean', 'Solved, no hints'], ['review', 'Needs review']
  ];
  OR.statusLabel = function (s) { for (var i = 0; i < OR.STATUS.length; i++) if (OR.STATUS[i][0] === s) return OR.STATUS[i][1]; return 'To do'; };
  OR.statusMark = function (s) { return '<span class="st" data-st="' + (s || 'todo') + '">' + OR.statusLabel(s) + '</span>'; };
  OR.isSolved = function (s) { return s === 'solved' || s === 'clean'; };
  OR.lcUrl = function (p) { return 'https://leetcode.com/problems/' + p.slug + '/'; };
  OR.problem = function (n) { return OR.plan.problemByNum(n); };
  // Hints, solution, tests and starter code for a problem, from whichever topic file covers it.
  OR.problemExtras = function (lc) {
    var x = {};
    OR.topics.forEach(function (t) {
      (t.practice || []).concat(t.worked || []).forEach(function (e) {
        if (+e.lc !== +lc) return;
        ['hints', 'solution', 'tests', 'starter', 'note'].forEach(function (k) { if (e[k] && !x[k]) x[k] = e[k]; });
        if (!x.solution && e.code) x.solution = { code: e.code, explain: e.insight || '' };
        if (!x.topic) x.topic = t.id;
      });
    });
    return x;
  };

  var DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };
  function topicOrder() { var o = {}; OR.curriculum.forEach(function (t, i) { o[t.id] = i; }); return o; }
  var STATUS_FILTERS = [['', 'Any status'], ['open', 'Not solved'], ['solved', 'Solved'], ['clean', 'Solved, no hints'], ['attempted', 'Attempted'], ['review', 'Needs review']];
  var SORTS = [['order', 'Study order'], ['number', 'Number'], ['difficulty', 'Difficulty'], ['status', 'Status']];
  var LISTS = [['', 'All'], ['blind75', 'Blind 75'], ['nc150', 'NeetCode 150']];
  var DIFFS = [['', 'All'], ['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']];

  function matches(p, f, st) {
    var s = (st.problems[p.lc] || {}).status || 'todo';
    if (f.diff && p.difficulty !== f.diff) return false;
    if (f.topic && p.topic !== f.topic) return false;
    if (f.pattern && p.pattern !== f.pattern) return false;
    if (f.list && p.lists.indexOf(f.list) < 0) return false;
    if (f.status === 'open' && OR.isSolved(s)) return false;
    if (f.status === 'solved' && !OR.isSolved(s)) return false;
    if (f.status && f.status !== 'open' && f.status !== 'solved' && s !== f.status) return false;
    if (f.q) {
      var hay = (p.lc + ' ' + p.title + ' ' + p.pattern + ' ' + ((OR.topicMeta(p.topic) || {}).title || '')).toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; })) return false;
    }
    return true;
  }
  function rowHTML(p, st) {
    var s = (st.problems[p.lc] || {}).status || 'todo', meta = OR.topicMeta(p.topic) || {};
    return '<tr data-lc="' + p.lc + '"><td class="pb-n"><span class="bib-tag">' + p.lc + '</span></td>' +
      '<td class="pb-title"><a href="#/problem/' + p.lc + '">' + esc(p.title) + '</a>' +
        (p.premium ? '<span class="chip pb-prem" title="LeetCode Premium">' + OR.icon('lock', 'icon-sm') + 'Premium</span>' : '') +
        (p.lists.indexOf('blind75') >= 0 ? '<span class="chip pb-b75" title="In the Blind 75">B75</span>' : '') + '</td>' +
      '<td><span class="diff diff-' + p.difficulty + '">' + p.difficulty + '</span></td>' +
      '<td class="pb-topic"><a href="#/topic/' + p.topic + '">' + esc(meta.title || p.topic) + '</a></td>' +
      '<td class="pb-pattern">' + esc(p.pattern) + '</td>' +
      '<td class="pb-status"><select class="select select-sm" data-status-for="' + p.lc + '" aria-label="Status of ' + p.lc + '. ' + esc(p.title) + '">' +
        OR.STATUS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === s ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td></tr>';
  }
  function options(list, cur) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === (cur || '') ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function seg(name, list, cur, label) {
    return '<div class="seg" role="radiogroup" aria-label="' + label + '">' + list.map(function (o) {
      var on = o[0] === (cur || '');
      return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-f="' + name + '" data-v="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function tally(st) {
    var by = { Easy: [0, 0], Medium: [0, 0], Hard: [0, 0] };
    OR.problems.forEach(function (p) { by[p.difficulty][1]++; if (OR.isSolved((st.problems[p.lc] || {}).status)) by[p.difficulty][0]++; });
    return by;
  }

  OR.views.problems = {
    title: function () { return 'Problems'; },
    render: function (main, ctx) {
      var f = { q: ctx.query.q || '', topic: ctx.query.topic || '', pattern: ctx.query.pattern || '', diff: ctx.query.diff || '', status: ctx.query.status || '', list: ctx.query.list || '', sort: ctx.query.sort || 'order' };
      var topics = OR.curriculum.filter(function (t) { return OR.problems.some(function (p) { return p.topic === t.id; }); });
      var patterns = Array.from(new Set(OR.problems.map(function (p) { return p.pattern; }))).sort();
      var st = OR.store.get(), by = tally(st);
      var phone = window.matchMedia('(max-width: 760px)').matches, nActive = ['topic', 'pattern', 'diff', 'status', 'list'].filter(function (k) { return f[k]; }).length;
      main.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><h1 class="page-title display">Problems</h1><p class="page-lede">' + OR.problems.length + ' problems: all of NeetCode 150, which contains the Blind 75, plus extra problems that round out each topic’s practice set. Solve on LeetCode, then log it here.</p></div>' +
          '<dl class="pb-tally">' + ['Easy', 'Medium', 'Hard'].map(function (d) { return '<div><dt><span class="diff diff-' + d + '">' + d + '</span></dt><dd class="num" data-tally="' + d + '">' + by[d][0] + '<span class="faint">/' + by[d][1] + '</span></dd></div>'; }).join('') + '</dl></div>' +
        '<form class="pb-filters" role="search" onsubmit="return false">' +
          '<label class="pb-search"><span class="sr-only">Search problems</span>' + OR.icon('search', 'icon-sm') + '<input class="input" type="search" name="q" placeholder="Search by number, title or pattern" value="' + esc(f.q) + '" autocomplete="off"></label>' +
          (phone ? '<details class="pb-more"' + (nActive ? ' open' : '') + '><summary>Filters' + (nActive ? ' <span class="pb-badge">' + nActive + '</span>' : '') + '</summary><div class="pb-more-body">' : '<div class="pb-more-body">') +
          '<label><span class="sr-only">Topic</span><select class="select" name="topic"><option value="">All topics</option>' + topics.map(function (t) { return '<option value="' + t.id + '"' + (t.id === f.topic ? ' selected' : '') + '>' + esc(t.title) + '</option>'; }).join('') + '</select></label>' +
          '<label><span class="sr-only">Pattern</span><select class="select" name="pattern"><option value="">All patterns</option>' + patterns.map(function (p) { return '<option' + (p === f.pattern ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></label>' +
          '<label><span class="sr-only">Status</span><select class="select" name="status">' + options(STATUS_FILTERS, f.status) + '</select></label>' +
          '<label><span class="sr-only">Sort by</span><select class="select" name="sort">' + options(SORTS.map(function (s) { return [s[0], 'Sort: ' + s[1]]; }), f.sort) + '</select></label>' +
          seg('diff', DIFFS, f.diff, 'Difficulty') + seg('list', LISTS, f.list, 'List') + (phone ? '</div></details>' : '</div>') +
        '</form>' +
        '<div class="pb-count row-between"><p aria-live="polite" id="pb-count"></p><button class="btn btn-sm btn-ghost" type="button" id="pb-clear">Clear filters</button></div>' +
        '<div class="table-wrap"><table class="table pb-table"><thead><tr><th>#</th><th>Problem</th><th>Difficulty</th><th class="pb-topic">Topic</th><th class="pb-pattern">Pattern</th><th>Status</th></tr></thead><tbody id="pb-rows"></tbody></table></div>' +
        '<p class="empty" id="pb-empty" hidden>No problems match these filters. <button class="btn btn-sm" type="button" data-clear>Clear filters</button></p></div>';

      var form = OR.$('.pb-filters', main), tbody = OR.$('#pb-rows'), order = topicOrder();
      function apply() {
        var st = OR.store.get(), rank = function (p) { return OR.STATUS.map(function (x) { return x[0]; }).indexOf((st.problems[p.lc] || {}).status || 'todo'); };
        var rows = OR.problems.filter(function (p) { return matches(p, f, st); });
        rows.sort(function (a, b) {
          if (f.sort === 'number') return a.lc - b.lc;
          if (f.sort === 'difficulty') return DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.lc - b.lc;
          if (f.sort === 'status') return rank(a) - rank(b) || a.lc - b.lc;
          return order[a.topic] - order[b.topic] || DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.lc - b.lc;
        });
        tbody.innerHTML = rows.map(function (p) { return rowHTML(p, st); }).join('');
        var solved = rows.filter(function (p) { return OR.isSolved((st.problems[p.lc] || {}).status); }).length;
        OR.$('#pb-count').textContent = rows.length === OR.problems.length ? 'Showing all ' + rows.length + ', ' + solved + ' solved.' : 'Showing ' + rows.length + ' of ' + OR.problems.length + ', ' + solved + ' solved.';
        OR.$('#pb-empty').hidden = rows.length > 0;
        OR.$('#pb-clear').hidden = !Object.keys(f).some(function (k) { return k !== 'sort' && f[k]; });
        OR.setQuery(f.sort === 'order' ? Object.assign({}, f, { sort: '' }) : f);
      }
      var applySoon = OR.debounce(apply, 120);
      form.addEventListener('input', function (e) { if (e.target.name) { f[e.target.name] = e.target.value; e.target.name === 'q' ? applySoon() : apply(); } });
      form.addEventListener('click', function (e) {
        var b = e.target.closest('[data-f]'); if (!b) return;
        f[b.dataset.f] = b.dataset.v;
        OR.$$('[data-f="' + b.dataset.f + '"]', form).forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
        apply();
      });
      function clear() { OR.go('#/problems', 'top'); }
      OR.$('#pb-clear').addEventListener('click', clear);
      OR.$('#pb-empty [data-clear]').addEventListener('click', clear);
      tbody.addEventListener('change', function (e) {
        var sel = e.target.closest('[data-status-for]'); if (!sel) return;
        var lc = +sel.dataset.statusFor, p = OR.problem(lc);
        OR.store.setProblem(lc, { status: sel.value });
        OR.announce(p.lc + '. ' + p.title + ' marked ' + OR.statusLabel(sel.value) + '.');
        var by = tally(OR.store.get());
        OR.$$('[data-tally]', main).forEach(function (d) { d.innerHTML = by[d.dataset.tally][0] + '<span class="faint">/' + by[d.dataset.tally][1] + '</span>'; });
      });
      apply();
    }
  };

  OR.addSearch(function () {
    return OR.problems.map(function (p) {
      return { group: 'Problems', title: p.lc + '. ' + p.title, sub: p.difficulty + ' · ' + ((OR.topicMeta(p.topic) || {}).title || ''), icon: 'problems', href: '#/problem/' + p.lc, keywords: p.slug.replace(/-/g, ' ') + ' ' + p.pattern };
    });
  });
})();
