/* Offer Ready: Tarjan low-link visualizer (bridges and articulation points on an undirected graph).
   Input: an edge list such as "0-1 1-2 2-0 1-3" (nodes 0 to 7, up to 14 edges; repeated pairs are parallel cables).
   Each frame is a snapshot of the DFS (discovery time and low-link per node, edge kinds, bridges, cut points), so stepping
   back repaints an earlier one. Steps match the lesson template's marks: visit / skip / back / tree / lift / bridge / cut.
   Styles: css/viz/tarjan.css (.tj-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var NMAX = 8, EMAX = 14;
  var PRESETS = [
    { s: '0-1 1-2 2-0 1-3', label: 'triangle with a tail' },
    { s: '0-1 1-2 2-0 2-3 3-4 4-5 5-3', label: 'two triangles, one link' },
    { s: '0-1 1-2 2-3 3-4', label: 'chain: all bridges' },
    { s: '0-1 1-2 2-3 3-0', label: 'ring: nothing breaks' },
    { s: '0-1 0-1 1-2', label: 'doubled cable' }
  ];
  var STEPS = {
    start: { label: 'Start' }, visit: { label: 'Visit: stamp disc and low', tone: 'accent' }, skip: { label: 'Skip arrival edge' },
    back: { label: 'Back edge', tone: 'accent' }, tree: { label: 'Tree edge: go down', tone: 'accent' }, lift: { label: 'Lift child low', tone: 'ok' },
    bridge: { label: 'Bridge found', tone: 'hard' }, cut: { label: 'Articulation point', tone: 'hard' }, done: { label: 'Done' }
  };

  // "0-1 1-2" -> { n, edges: [[a, b], ...] }, or { err }. Self-loops are dropped.
  function parse(text) {
    var edges = [], re = /(\d+)\s*-\s*(\d+)/g, m, max = 0, bad = false, rest = String(text).replace(re, ' ').replace(/[\s,;]+/g, '');
    if (rest) bad = true;
    while ((m = re.exec(String(text)))) {
      var a = +m[1], b = +m[2];
      if (a >= NMAX || b >= NMAX) return { err: 'Nodes run from 0 to ' + (NMAX - 1) + '. “' + m[0] + '” does not fit.' };
      if (a === b) continue;
      if (edges.length >= EMAX) return { err: 'Up to ' + EMAX + ' edges, please.' };
      edges.push([a, b]); max = Math.max(max, a, b);
    }
    if (!edges.length) return { err: 'Type at least one edge between two different nodes, like 0-1.' };
    return { n: max + 1, edges: edges, ok: !bad };
  }

  function frames(n, edges) {
    var out = [], disc = [], low = [], ns = [], es = [], cut = [], bridges = [], adj = [], path = [], timer = 0, cur = -1, ce = -1, i;
    for (i = 0; i < n; i++) { disc.push(-1); low.push(-1); ns.push(''); cut.push(false); adj.push([]); }
    edges.forEach(function (e, k) { es.push(''); adj[e[0]].push([e[1], k]); adj[e[1]].push([e[0], k]); });
    function nm(k) { return edges[k][0] + '-' + edges[k][1]; }
    function snap(step, note) {
      out.push({ step: step, note: note, n: n, edges: edges, disc: disc.slice(), low: low.slice(), ns: ns.slice(), es: es.slice(),
        cut: cut.slice(), bridges: bridges.slice(), cur: cur, ce: ce, path: path.slice() });
    }
    function dfs(u, pe) {
      disc[u] = low[u] = timer++; ns[u] = 'open'; path.push(u); cur = u; ce = -1;
      snap('visit', 'Visit ' + u + (pe === -1 ? ' (a root of the DFS)' : '') + '. Stamp disc[' + u + '] = low[' + u + '] = ' + disc[u] + '. disc is the order of first visit; low will fall if the subtree can climb back to an earlier node.');
      var kids = 0;
      adj[u].forEach(function (a) {
        var v = a[0], k = a[1];
        cur = u; ce = k;
        if (k === pe) { snap('skip', 'Edge ' + nm(k) + ' is the one we arrived by, so it says nothing new. Skip it by its id (a second cable between the same nodes would still count).'); return; }
        if (disc[v] !== -1) {
          if (es[k] === '') es[k] = 'back';
          var was = low[u]; low[u] = Math.min(low[u], disc[v]);
          snap('back', 'Edge ' + u + '-' + v + ': ' + v + ' was already visited (disc ' + disc[v] + '), so this is a back edge. low[' + u + '] = min(' + was + ', ' + disc[v] + ') = ' + low[u] + (low[u] === was ? '. No change.' : '. u can reach back to an earlier time.'));
        } else {
          kids++; es[k] = 'tree';
          snap('tree', 'Edge ' + u + '-' + v + ': ' + v + ' is unvisited, so this is a tree edge. Recurse into ' + v + '.');
          dfs(v, k);
          cur = u; ce = k;
          var before = low[u]; low[u] = Math.min(low[u], low[v]);
          var isBr = low[v] > disc[u], isCut = pe !== -1 && low[v] >= disc[u];
          snap('lift', 'Back at ' + u + ' from ' + v + '. low[' + u + '] = min(' + before + ', low[' + v + '] = ' + low[v] + ') = ' + low[u] + '. Bridge test low[' + v + '] > disc[' + u + ']: ' + low[v] + ' > ' + disc[u] + ' is ' + (isBr ? 'true' : 'false') + '.' +
            (pe !== -1 ? ' Cut test low[' + v + '] >= disc[' + u + '] is ' + (isCut ? 'true' : 'false') + '.' : ' ' + u + ' is the root, so it is judged by its child count instead.'));
          if (isBr) { es[k] = 'bridge'; bridges.push(k); snap('bridge', 'Nothing in ' + v + '’s subtree reaches ' + u + ' or above (low ' + low[v] + ' > disc ' + disc[u] + '), so edge ' + u + '-' + v + ' is the only link: a bridge. Remove it and the graph splits.'); }
          if (isCut && !cut[u]) { cut[u] = true; snap('cut', 'low[' + v + '] = ' + low[v] + ' >= disc[' + u + '] = ' + disc[u] + ': the subtree of ' + v + ' cannot get above ' + u + ' without passing through it. Removing node ' + u + ' cuts that subtree off, so ' + u + ' is an articulation point.'); }
        }
      });
      if (pe === -1 && kids > 1 && !cut[u]) { cut[u] = true; cur = u; ce = -1; snap('cut', 'The root ' + u + ' has ' + kids + ' DFS children. They could not reach each other except through ' + u + ', so removing it splits them: an articulation point. (A root with one child is never one.)'); }
      ns[u] = 'done'; path.pop();
    }
    snap('start', n + ' nodes, ' + edges.length + ' edges. The DFS will stamp every node with a discovery time (disc) and a low-link (low), then read bridges and articulation points from them.');
    for (i = 0; i < n; i++) if (disc[i] === -1 && adj[i].length) dfs(i, -1);
    cur = -1; ce = -1; path = [];
    var cl = [], br = bridges.map(nm);
    cut.forEach(function (c, v) { if (c) cl.push(v); });
    snap('done', 'DFS finished. Bridges: ' + (br.length ? br.join(', ') : 'none') + '. Articulation points: ' + (cl.length ? cl.join(', ') : 'none') + '.' +
      (bridges.length === 0 && cl.length === 0 ? ' Every node and edge has a way around: the graph is robust to any single failure.' : ''));
    return out;
  }

  var W = 320, H = 250, CX = W / 2, CY = H / 2 + 2, RX = 104, RY = 78;
  function ang(i, n) { return -Math.PI / 2 + 2 * Math.PI * i / n; }
  function npos(i, n) { var t = ang(i, n); return { x: CX + RX * Math.cos(t), y: CY + RY * Math.sin(t) }; }
  function r1(x) { return Math.round(x * 10) / 10; }

  function stageHTML(g) {
    var n = g.n, cnt = {}, seen = {}, html = '<div class="va tj"><svg class="tj-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Undirected graph, ' + n + ' nodes and ' + g.edges.length + ' edges"><g>';
    g.edges.forEach(function (e) { var key = Math.min(e[0], e[1]) + '|' + Math.max(e[0], e[1]); cnt[key] = (cnt[key] || 0) + 1; });
    g.edges.forEach(function (e, k) {
      var key = Math.min(e[0], e[1]) + '|' + Math.max(e[0], e[1]), idx = seen[key] = (seen[key] === undefined ? 0 : seen[key] + 1);
      var a = npos(e[0], n), b = npos(e[1], n), d;
      if (cnt[key] > 1) {
        var off = (idx - (cnt[key] - 1) / 2) * 30, dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        d = 'M' + r1(a.x) + ' ' + r1(a.y) + ' Q' + r1((a.x + b.x) / 2 - dy / len * off) + ' ' + r1((a.y + b.y) / 2 + dx / len * off) + ' ' + r1(b.x) + ' ' + r1(b.y);
      } else d = 'M' + r1(a.x) + ' ' + r1(a.y) + ' L' + r1(b.x) + ' ' + r1(b.y);
      html += '<path class="tj-e" data-e="' + k + '" d="' + d + '"/>';
    });
    html += '</g><g>';
    for (var i = 0; i < n; i++) {
      var p = npos(i, n), t = ang(i, n);
      html += '<g class="tj-n" data-n="' + i + '" transform="translate(' + r1(p.x) + ' ' + r1(p.y) + ')"><circle r="15"/><text class="tj-id" text-anchor="middle" dominant-baseline="central">' + i + '</text>' +
        '<text class="tj-dl" x="' + r1(Math.cos(t) * 30) + '" y="' + r1(Math.sin(t) * 26) + '" text-anchor="middle" dominant-baseline="central"></text></g>';
    }
    return html + '</g></svg>' +
      '<dl class="va-read"><div><dt>disc / low</dt><dd class="tj-tab"></dd></div></dl>' +
      '<dl class="va-read"><div><dt>DFS path</dt><dd class="tj-path"></dd></div></dl>' +
      '<dl class="va-read"><div><dt>Bridges</dt><dd class="tj-br"></dd></div><div><dt>Articulation points</dt><dd class="tj-ap"></dd></div></dl></div>';
  }

  function paint(g, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(g);
    OR.$$('.tj-e', stage).forEach(function (el) {
      var k = +el.dataset.e;
      el.setAttribute('class', 'tj-e' + (f.es[k] ? ' ' + f.es[k] : '') + (k === f.ce ? ' cur' : ''));
    });
    OR.$$('.tj-n', stage).forEach(function (el) {
      var i = +el.dataset.n, c = 'tj-n' + (f.ns[i] ? ' ' + f.ns[i] : '') + (f.cut[i] ? ' cut' : '') + (i === f.cur ? ' cur' : '');
      el.setAttribute('class', c);
      OR.$('.tj-dl', el).textContent = f.disc[i] < 0 ? '' : f.disc[i] + '/' + f.low[i];
    });
    OR.$('.tj-tab', stage).innerHTML = f.disc.map(function (d, i) {
      return '<span class="va-kv tj-chip' + (i === f.cur ? ' cur' : '') + (f.cut[i] ? ' cut' : '') + '">' + i + ' <b>' + (d < 0 ? '–' : d + '/' + f.low[i]) + '</b></span>';
    }).join('');
    OR.$('.tj-path', stage).innerHTML = f.path.length ? f.path.map(function (v) { return '<span class="va-kv tj-chip' + (v === f.cur ? ' cur' : '') + '">' + v + '</span>'; }).join('<span class="faint">→</span>') : '<span class="faint">empty</span>';
    OR.$('.tj-br', stage).innerHTML = f.bridges.length ? f.bridges.map(function (k) { return '<span class="va-kv bad">' + f.edges[k][0] + '-' + f.edges[k][1] + '</span>'; }).join('') : '<span class="faint">none yet</span>';
    var aps = []; f.cut.forEach(function (c, v) { if (c) aps.push(v); });
    OR.$('.tj-ap', stage).innerHTML = aps.length ? aps.map(function (v) { return '<span class="va-kv bad">' + v + '</span>'; }).join('') : '<span class="faint">none yet</span>';
  }

  OR.viz.tarjan = {
    frames: function (text) { var g = parse(text); return g.err ? [] : frames(g.n, g.edges); }, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="tj-in">Your graph: edges as 0-1 (up to ' + EMAX + ' edges, nodes 0 to ' + (NMAX - 1) + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="tj-in" spellcheck="false" autocomplete="off" aria-label="Edges, such as 0-1 1-2 2-0 1-3" value="' + PRESETS[0].s + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-k="' + i + '">' + esc(p.label) + '</button>'; }).join('') +
        '<span class="faint tj-err" role="status"></span></p></form><div class="va-player"></div>';
      var input = OR.$('#tj-in', host), slot = OR.$('.va-player', host), err = OR.$('.tj-err', host);

      function run(text) {
        var g = parse(text);
        if (g.err) { err.textContent = g.err; if (player) return; g = parse(PRESETS[0].s); }
        else err.textContent = g.ok ? '' : 'Some text was ignored: write each edge as two numbers joined by a dash.';
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(g.n, g.edges), steps: STEPS, label: 'Low-link DFS on ' + g.edges.length + ' edges',
          paint: function (stage, f) { paint(g, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-k]'); if (!b) return;
        input.value = PRESETS[b.dataset.k].s; run(input.value);
      });
      run(input.value);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
