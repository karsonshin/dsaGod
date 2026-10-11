/* Offer Ready: Algorithm catalog (#/algorithms, #/algorithms/<id>).
   Every algorithm and data-structure entry in the answer bank (data/qa), grouped by category, with search. Opening a card shows the
   tested implementation in the language you picked (Python first), why it works, its cost, links into the lessons, a visualizer when
   one exists, and a button that asks the tutor. Cards build their body when opened, so a thousand entries stay fast. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  // Entries written for the catalog carry `cat`; the older answer-bank files get a category from their id prefix and title.
  function catOf(e) {
    if (e.cat) return e.cat;
    var t = (e.title + ' ' + (e.tags || '')).toLowerCase(), p = e.id.split('-')[0];
    if (p === 'gr') {
      if (/dijkstra|bellman|floyd|shortest|0-1|a\*|cheapest|network delay|minimum effort/.test(t)) return 'Graphs: shortest paths';
      if (/kruskal|prim|spanning|union|scc|strongly|kosaraju|tarjan|bridge|articulation|bipartite|cycle|topolog|euler|course schedule/.test(t)) return 'Graphs: spanning trees and connectivity';
      if (/tree|lca|bst|traversal|diameter|serialize|level|zigzag|subtree|path sum|flatten|morris|depth|ancestor/.test(t)) return 'Graphs: trees';
      if (/bfs|dfs|flood|island|word ladder|connected|clone|all paths|implicit|search/.test(t)) return 'Graphs: search';
      return 'Graphs: other';
    }
    if (p === 'al') return /binary search|sort|quickselect|merge two|partition|dutch/.test(t) ? 'Searching and sorting' : 'Array and string techniques';
    if (p === 'dp') {
      if (/kmp|z-function|rolling hash|rabin|manacher|boyer|suffix|palindrom.*substring/.test(t)) return 'Strings: matching';
      if (/backtrack|permutation|subset|combination|queens|sudoku|greedy|jump|gas station|task schedul|huffman|word search|parenthes|letter/.test(t)) return 'Backtracking and greedy';
      if (/gcd|sieve|prime|modul|power|exponent|nCr|factorial|bit|xor|reverse integer|base conversion|fibonacci matrix/.test(t)) return 'Number theory';
      return 'Dynamic programming';
    }
    if (p === 'ds') return 'Data structures: core';
    return '';
  }
  var CATALOG_PREFIX = { gr: 1, al: 1, dp: 1, ds: 1 };
  function entries() {
    return (OR.qa || []).filter(function (e) { return e.cat || (CATALOG_PREFIX[e.id.split('-')[0]] && e.code && e.code.py); }).map(function (e) { e._cat = catOf(e); return e; });
  }
  // A visualizer that shows the algorithm in motion, when the app has one.
  var VIZ = [[/^a\*|a-star|a star/i, 'astar'], [/dijkstra/i, 'dijkstra'], [/\bbfs\b|breadth|\bdfs\b|depth-first|flood fill|number of islands/i, 'grid-search'], [/topological/i, 'topo-sort'],
    [/union-find|disjoint set/i, 'union-find'], [/\bkmp\b/i, 'kmp'], [/\btrie\b/i, 'trie'], [/segment tree/i, 'segment-tree'], [/fenwick|binary indexed/i, 'fenwick'], [/sieve/i, 'sieve'],
    [/kruskal|prim|minimum spanning/i, 'mst'], [/tarjan|strongly connected|kosaraju/i, 'tarjan'], [/longest increasing/i, 'lis'], [/knapsack/i, 'dp-knapsack'], [/edit distance|longest common subsequence/i, 'dp-strings'],
    [/sliding window/i, 'sliding-window'], [/binary search\b/i, 'binary-search'], [/\bheap\b/i, 'heap'], [/lru cache/i, 'lru'], [/monotonic/i, 'monotonic-stack'], [/prefix sum/i, 'prefix-sum'], [/kadane|maximum subarray/i, 'kadane'],
    [/merge intervals|interval/i, 'intervals'], [/merge sort|quick sort|quicksort|sorting algorithms/i, 'sorting-race'], [/kruskal/i, 'mst']];
  function vizFor(e) { if (e.viz && OR.viz[e.viz]) return e.viz; for (var i = 0; i < VIZ.length; i++) if (VIZ[i][0].test(e.title) && OR.viz[VIZ[i][1]]) return VIZ[i][1]; return null; }

  var cleanups = [];
  function bodyHTML(e) {
    var see = OR.qaEngine.links(e), v = vizFor(e);
    return '<div class="prose">' + OR.md(e.a) + '</div>' +
      (e.code ? OR.codeBlock(e.code, { title: e.title }) : '') +
      (e.more ? '<div class="prose al-more">' + OR.md(e.more) + '</div>' : '') +
      (e.cx ? '<p class="al-cx"><strong>Cost:</strong> ' + OR.inline(e.cx) + '</p>' : '') +
      (v ? '<div class="al-viz"><h4 class="sub-title">See it run</h4><div class="al-viz-host" data-viz="' + esc(v) + '"></div></div>' : '') +
      '<div class="btn-row al-actions"><button class="btn btn-sm" type="button" data-al="ask" data-id="' + esc(e.id) + '">' + OR.icon('ai', 'icon-sm') + 'Ask the tutor about this</button>' +
      '<a class="btn btn-sm btn-ghost" href="#/algorithms/' + esc(e.id) + '">Link to this</a></div>' +
      (see.length ? '<p class="al-see">' + see.map(function (s) { return '<a class="chip" href="' + esc(s.href) + '">' + esc(s.title) + '</a>'; }).join(' ') + '</p>' : '');
  }
  function cardHTML(e, open) {
    return '<details class="al-card" id="al-' + esc(e.id) + '" data-id="' + esc(e.id) + '"' + (open ? ' open' : '') + '><summary><span class="al-title">' + esc(e.title) + '</span>' +
      (e.cx ? '<span class="al-cxs faint">' + esc(String(e.cx).replace(/\*\*/g, '').slice(0, 70)) + '</span>' : '') + '</summary><div class="al-body"></div></details>';
  }

  OR.views.algorithms = {
    title: function () { return 'Algorithm catalog'; },
    render: function (main, ctx) {
      var all = entries(), byId = {}; all.forEach(function (e) { byId[e.id] = e; });
      var cats = {}; all.forEach(function (e) { cats[e._cat] = (cats[e._cat] || 0) + 1; });
      var catList = Object.keys(cats).sort();
      var state = { q: ctx.query.q || '', cat: ctx.query.cat || '', open: ctx.params.id || '' };
      main.innerHTML = '<div class="page al"><div class="page-head"><div><h1 class="page-title display">Algorithm catalog</h1>' +
        '<p class="page-lede">' + all.length + ' algorithms and data structures, each with a tested implementation, why it works, what it costs, and where to learn more. Open one, or ask the tutor.</p></div></div>' +
        '<div class="al-controls"><label class="al-search"><span class="sr-only">Search algorithms</span>' + OR.icon('search', 'icon-sm') + '<input class="input" type="search" id="al-q" placeholder="Search: a*, dijkstra, convex hull, max flow…" value="' + esc(state.q) + '"></label>' +
        '<div class="al-cats" role="group" aria-label="Category"></div></div><p class="muted" id="al-count" aria-live="polite"></p><div id="al-list"></div></div>';
      var list = OR.$('#al-list', main), catsEl = OR.$('.al-cats', main), qEl = OR.$('#al-q', main), countEl = OR.$('#al-count', main);

      function matches(e) {
        if (state.cat && e._cat !== state.cat) return false;
        if (!state.q) return true;
        var q = state.q.toLowerCase().split(/\s+/).filter(Boolean), hay = (e.title + ' ' + (e.tags || '') + ' ' + (e.q || []).join(' ')).toLowerCase();
        return q.every(function (w) { return hay.indexOf(w) >= 0; });
      }
      function paintCats() {
        catsEl.innerHTML = ['<button class="chip" type="button" data-cat="" aria-pressed="' + (!state.cat) + '">All (' + all.length + ')</button>'].concat(catList.map(function (c) {
          return '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="' + (state.cat === c) + '">' + esc(c) + ' (' + cats[c] + ')</button>';
        })).join('');
      }
      function paint() {
        var shown = all.filter(matches), by = {};
        shown.forEach(function (e) { (by[e._cat] = by[e._cat] || []).push(e); });
        countEl.textContent = shown.length + (shown.length === 1 ? ' result' : ' results');
        list.innerHTML = Object.keys(by).sort().map(function (c) {
          return '<section class="al-group"><h2 class="section-title">' + esc(c) + '</h2>' + by[c].sort(function (a, b) { return a.title < b.title ? -1 : 1; }).map(function (e) { return cardHTML(e, e.id === state.open); }).join('') + '</section>';
        }).join('') || '<p class="empty">Nothing matches. Try another word, or ask the tutor.</p>';
        OR.$$('.al-card[open]', list).forEach(fill);
      }
      function fill(card) {
        var body = OR.$('.al-body', card); if (body.firstChild) return;
        var e = byId[card.dataset.id]; if (!e) return;
        body.innerHTML = bodyHTML(e);
        var host = OR.$('.al-viz-host', body);
        if (host) { try { var v = OR.viz[host.dataset.viz].mount(host, { topic: '', mark: function () {} }); if (v && v.destroy) cleanups.push(v.destroy); } catch (err) { console.error(err); host.innerHTML = '<p class="muted">The visualizer hit an error.</p>'; } }
      }
      list.addEventListener('toggle', function (ev) { if (ev.target.classList.contains('al-card') && ev.target.open) fill(ev.target); }, true);
      list.addEventListener('click', function (ev) { var b = ev.target.closest('[data-al="ask"]'); if (b) { var e = byId[b.dataset.id]; if (e) OR.assistant.ask(e.q[0]); } });
      catsEl.addEventListener('click', function (ev) { var b = ev.target.closest('[data-cat]'); if (!b) return; state.cat = b.dataset.cat; paintCats(); paint(); });
      qEl.addEventListener('input', OR.debounce(function () { state.q = qEl.value.trim(); paint(); }, 120));
      paintCats(); paint();
      if (state.open) { var el = OR.$('#al-' + state.open, list); if (el) { el.open = true; fill(el); setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 30); } }
      return function () { cleanups.splice(0).forEach(function (f) { try { f(); } catch (e2) { /* already gone */ } }); };
    }
  };

  OR.addSearch(function () {
    return entries().slice(0, 1500).map(function (e) { return { group: 'Algorithms', title: e.title, sub: e._cat, icon: 'code', href: '#/algorithms/' + e.id, keywords: (e.tags || '') + ' ' + (e.q || []).slice(0, 3).join(' ') }; });
  });
})();
