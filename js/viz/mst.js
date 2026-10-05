/* Offer Ready: minimum spanning tree visualizer (Kruskal, with a toggle to Prim).
   The input is an edge list such as "A-B:4 A-C:1". Kruskal sorts the edges and asks union-find about each one:
   accept (different groups) or skip (same group, it would close a cycle). Prim grows one tree and keeps a heap of edges
   leaving it. Every frame is a snapshot, so stepping back repaints an earlier one. Steps match the lesson template's
   #@sort/#@edge/#@skip/#@take marks (Prim reuses edge/skip/take). Styles: css/viz/mst.css (.ms-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXN = 8, MAXE = 14;
  var PRESETS = ['A-B:4 A-C:1 B-C:2 B-D:5 C-D:8 C-E:10 D-E:2', 'A-B:2 B-C:2 A-C:3', 'A-B:1 B-C:3 A-C:2 D-E:5', 'A-B:1 B-C:1 A-C:1 C-D:1'];
  var STEPS = {
    start: { label: 'Start' }, sort: { label: 'Sort edges', tone: 'accent' }, edge: { label: 'Consider edge', tone: 'accent' },
    skip: { label: 'Skip', tone: 'hard' }, take: { label: 'Take edge', tone: 'ok' }, done: { label: 'Done', tone: 'ok' }
  };

  // "A-B:4 A-C:1" -> { names, E: [{a, b, w}] }. Self-loops are dropped; a repeated pair keeps its lighter edge.
  function parse(text) {
    var names = [], E = [], seen = {}, ok = true;
    String(text).split(/[\s,;]+/).filter(Boolean).forEach(function (tok) {
      var m = /^([A-Za-z0-9]{1,3})-([A-Za-z0-9]{1,3}):(\d{1,2})$/.exec(tok);
      if (!m) { ok = false; return; }
      var a = m[1], b = m[2], w = +m[3];
      if (a === b) return;
      var key = a < b ? a + '|' + b : b + '|' + a;
      if (key in seen) { if (w < E[seen[key]].w) E[seen[key]].w = w; return; }
      [a, b].forEach(function (x) { if (names.indexOf(x) < 0) names.push(x); });
      if (names.length > MAXN || E.length >= MAXE) { ok = false; return; }
      seen[key] = E.length; E.push({ a: names.indexOf(a), b: names.indexOf(b), w: w });
    });
    return E.length ? { names: names.slice(0, MAXN), E: E.filter(function (e) { return e.a < MAXN && e.b < MAXN; }), ok: ok } : null;
  }

  function find(p, x) { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }

  function build(g, mode) { return mode === 'prim' ? prim(g) : kruskal(g); }
  function nm(g, i) { return g.names[i]; }
  function eName(g, k) { var e = g.E[k]; return nm(g, e.a) + '-' + nm(g, e.b) + ' (' + e.w + ')'; }

  function kruskal(g) {
    var n = g.names.length, p = [], st = [], total = 0, used = 0, F = [], order = [];
    g.E.forEach(function (e, k) { order.push(k); st.push(''); });
    for (var i = 0; i < n; i++) p.push(i);
    order.sort(function (x, y) { return g.E[x].w - g.E[y].w || x - y; });
    function groups() {
      var m = {}, out = [];
      for (var v = 0; v < n; v++) { var r = find(p, v); (m[r] = m[r] || []).push(v); }
      Object.keys(m).forEach(function (r) { out.push(m[r]); });
      return out;
    }
    function gtxt(r) { return '{' + groups().filter(function (x) { return x.indexOf(r) >= 0; })[0].map(function (v) { return nm(g, v); }).join(', ') + '}'; }
    function snap(step, note, x) {
      var gr = groups();
      F.push(Object.assign({ step: step, note: note, mode: 'kruskal', st: st.slice(), total: total, list: order.slice(), groups: gr,
        tree: g.names.map(function (_, v) { return gr.filter(function (x) { return x.indexOf(v) >= 0; })[0].length > 1; }) }, x));
    }
    snap('start', n + ' nodes, ' + g.E.length + ' edges. Union-find starts with every node in its own group, so the forest has ' + n + ' trees and no edges yet.', { list: [] });
    snap('sort', 'Sort every edge by weight, cheapest first: ' + order.map(function (k) { return eName(g, k); }).join(', ') + '. Ties keep input order.');
    order.forEach(function (k) {
      var e = g.E[k], ra = find(p, e.a), rb = find(p, e.b), A = nm(g, e.a), B = nm(g, e.b);
      st[k] = 'cur';
      snap('edge', 'Edge ' + eName(g, k) + '. Look up the two groups: ' + A + ' is in ' + gtxt(e.a) + ', ' + B + ' is in ' + gtxt(e.b) + '.', { cur: k, ends: [e.a, e.b] });
      if (ra === rb) {
        st[k] = 'skip';
        snap('skip', 'Same group: ' + A + ' and ' + B + ' are already connected by cheaper edges, so this one would close a cycle. The cycle property says its weight is the heaviest on that cycle: skip it.', { cur: k, ends: [e.a, e.b] });
      } else {
        var before = gtxt(e.a) + ' and ' + gtxt(e.b);
        p[ra] = rb; used++; total += e.w; st[k] = 'ok';
        snap('take', 'Different groups (' + before + '). Every edge cheaper than this one has been decided, so it is the cheapest edge leaving ' + gtxt(e.a) + ': the cut property says keep it. Merge the groups. Total is now ' + total + '.', { cur: k, ends: [e.a, e.b] });
      }
    });
    var gr = groups().length;
    snap('done', gr === 1 ? 'Done. A spanning tree of ' + used + ' edges (' + n + ' nodes minus 1), total weight ' + total + '.' :
      'Done. The graph is not connected: ' + gr + ' groups remain, so this is a minimum spanning forest of ' + used + ' edges, total ' + total + '. Components = n - edges kept = ' + gr + '.', { list: order.slice(), final: 1 });
    return F;
  }

  function prim(g) {
    var n = g.names.length, inT = [], st = [], heap = [], total = 0, used = 0, F = [];
    g.E.forEach(function () { st.push(''); });
    for (var i = 0; i < n; i++) inT.push(false);
    function push(u) {
      g.E.forEach(function (e, k) {
        var v = e.a === u ? e.b : e.b === u ? e.a : -1;
        if (v >= 0 && !inT[v]) { heap.push({ k: k, to: v }); st[k] = 'cand'; }
      });
      heap.sort(function (x, y) { return g.E[x.k].w - g.E[y.k].w || x.k - y.k; });
    }
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, mode: 'prim', st: st.slice(), total: total, list: heap.map(function (h) { return h.k; }),
        tree: inT.slice(), groups: [] }, x));
    }
    inT[0] = true; push(0);
    snap('start', 'Prim grows one tree. Start at ' + nm(g, 0) + ': the tree is {' + nm(g, 0) + '}. Put every edge leaving it into a min-heap, cheapest on top.');
    while (heap.length) {
      var top = heap[0], k = top.k, e = g.E[k], from = e.a === top.to ? e.b : e.a;
      st[k] = 'cur';
      snap('edge', 'Pop the cheapest heap entry: ' + eName(g, k) + ', leading to ' + nm(g, top.to) + '.', { cur: k, ends: [from, top.to] });
      heap.shift();
      if (inT[top.to]) {
        st[k] = 'skip';
        snap('skip', nm(g, top.to) + ' joined the tree earlier through a cheaper edge, so this entry is stale. Discard it: keeping it would make a cycle.', { cur: k, ends: [from, top.to] });
      } else {
        inT[top.to] = true; used++; total += e.w; st[k] = 'ok'; push(top.to);
        snap('take', 'The tree reaches ' + nm(g, top.to) + ' for ' + e.w + ', the cheapest edge crossing the cut between tree and non-tree nodes: the cut property says keep it. Push ' + nm(g, top.to) + '’s new edges. Total is now ' + total + '.', { cur: k, ends: [from, top.to] });
      }
    }
    var left = inT.filter(function (x) { return !x; }).length;
    snap('done', left ? 'The heap is empty but ' + left + ' node(s) were never reached: they sit in another component. Prim only spans the component it started in; restart from an unreached node, or use Kruskal, which handles every component at once. Total ' + total + '.' :
      'Done. The tree spans all ' + n + ' nodes with ' + used + ' edges, total weight ' + total + '. Same total as Kruskal; the tree can differ only when weights tie.', { final: 1 });
    return F;
  }

  var W = 320, H = 232, CX = W / 2, CY = H / 2, RX = 118, RY = 84;
  function npos(i, n) { var t = -Math.PI / 2 + 2 * Math.PI * i / n; return { x: CX + RX * Math.cos(t), y: CY + RY * Math.sin(t) }; }
  function r1(x) { return Math.round(x * 10) / 10; }

  function stageHTML(g) {
    var n = g.names.length, html = '<div class="va ms"><svg class="ms-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Weighted graph"><g class="ms-edges">';
    g.E.forEach(function (e, k) {
      var a = npos(e.a, n), b = npos(e.b, n), t = 0.42;
      html += '<g class="ms-e" data-e="' + k + '"><line x1="' + r1(a.x) + '" y1="' + r1(a.y) + '" x2="' + r1(b.x) + '" y2="' + r1(b.y) + '"/>' +
        '<text x="' + r1(a.x + (b.x - a.x) * t) + '" y="' + r1(a.y + (b.y - a.y) * t) + '" text-anchor="middle" dominant-baseline="central">' + e.w + '</text></g>';
    });
    html += '</g><g class="ms-nodes">';
    g.names.forEach(function (s, i) {
      var p = npos(i, n);
      html += '<g class="ms-n" data-n="' + i + '" transform="translate(' + r1(p.x) + ' ' + r1(p.y) + ')"><circle r="15"/><text text-anchor="middle" dominant-baseline="central">' + esc(s) + '</text></g>';
    });
    return html + '</g></svg><dl class="va-read"><div><dt class="ms-l1"></dt><dd class="ms-v1"></dd></div></dl>' +
      '<dl class="va-read"><div><dt class="ms-l2"></dt><dd class="ms-v2"></dd></div><div><dt>Total</dt><dd class="ms-total"></dd></div></dl></div>';
  }

  function paint(g, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(g);
    OR.$$('.ms-e', stage).forEach(function (el) { el.setAttribute('class', 'ms-e' + (f.st[+el.dataset.e] ? ' ' + f.st[+el.dataset.e] : '')); });
    OR.$$('.ms-n', stage).forEach(function (el) {
      var i = +el.dataset.n, on = f.ends && f.ends.indexOf(i) >= 0;
      el.setAttribute('class', 'ms-n' + (f.tree[i] ? ' tree' : '') + (on ? ' cur' : ''));
    });
    var pr = f.mode === 'prim';
    OR.$('.ms-l1', stage).textContent = pr ? 'Tree' : 'Groups';
    OR.$('.ms-v1', stage).innerHTML = pr ? f.tree.map(function (t, i) { return t ? '<span class="va-kv cv-take">' + esc(g.names[i]) + '</span>' : ''; }).join('') :
      f.groups.map(function (gr) { return '<span class="va-kv' + (gr.length > 1 ? ' cv-take' : '') + '">' + esc(gr.map(function (v) { return g.names[v]; }).join(' ')) + '</span>'; }).join('');
    OR.$('.ms-l2', stage).textContent = pr ? 'Heap, cheapest first' : 'Sorted edges';
    OR.$('.ms-v2', stage).innerHTML = f.list.length ? f.list.map(function (k) {
      var s = f.st[k], e = g.E[k];
      return '<span class="va-kv ms-chip' + (s ? ' ' + s : '') + '">' + esc(g.names[e.a] + '-' + g.names[e.b]) + ' <b>' + e.w + '</b></span>';
    }).join('') : '<span class="faint">' + (pr ? 'empty' : 'not sorted yet') + '</span>';
    OR.$('.ms-total', stage).innerHTML = '<b class="num">' + f.total + '</b>';
  }

  OR.viz.mst = {
    frames: function (text, mode) { var g = parse(text); return g ? build(g, mode || 'kruskal') : []; }, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mode = 'kruskal', mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="ms-in">Your graph: edges as A-B:4 (up to ' + MAXE + ' edges, ' + MAXN + ' nodes, weights 0 to 99)</label>' +
        '<div class="va-input-row"><input class="input mono" id="ms-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) {
          return '<button class="chip" type="button" data-s="' + p + '">' + ['classic', 'not shortest paths', 'two components', 'all ties'][i] + '</button>'; }).join('') +
        '<span class="faint ms-err" role="status"></span></p>' +
        '<div class="ms-mode"><div class="seg" role="radiogroup" aria-label="Algorithm">' +
        '<button type="button" role="radio" aria-checked="true" tabindex="0" data-m="kruskal">Kruskal</button>' +
        '<button type="button" role="radio" aria-checked="false" tabindex="-1" data-m="prim">Prim</button></div>' +
        '<span class="faint">Prim reuses the template’s consider, skip and take lines, with a heap in place of a sorted list.</span></div></form><div class="va-player"></div>';
      var input = OR.$('#ms-in', host), slot = OR.$('.va-player', host), err = OR.$('.ms-err', host), last = PRESETS[0];

      function run(text) {
        var g = parse(text);
        if (!g) { err.textContent = 'Use edges like A-B:4, separated by spaces.'; if (!player) { g = parse(PRESETS[0]); } else return; } else err.textContent = g.ok ? '' : 'Some tokens were ignored (bad form, or more than ' + MAXN + ' nodes or ' + MAXE + ' edges).';
        last = text;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: build(g, mode), steps: STEPS, label: (mode === 'prim' ? 'Prim' : 'Kruskal') + ' on ' + g.E.length + ' edges',
          paint: function (stage, f) { paint(g, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var s = e.target.closest('[data-s]'), m = e.target.closest('[data-m]');
        if (s) { input.value = s.dataset.s; run(s.dataset.s); }
        if (m && m.dataset.m !== mode) {
          mode = m.dataset.m;
          OR.$$('[data-m]', host).forEach(function (b) { var on = b.dataset.m === mode; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
          run(parse(input.value) ? input.value : last);
        }
      });
      run(PRESETS[0]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
