/* Offer Ready: Dijkstra visualizer (weighted graph, priority queue, distance table, relaxations, path rebuild).
   Runs the lesson template's dijkstra(): pop the smallest (d, node), skip it if stale, relax each edge, push improvements.
   Edge list syntax: A-B:4 is a two-way road, A>B:4 is one-way. Each frame is a snapshot, so stepping back repaints an earlier one.
   Frame steps match the template's #@init/#@pop/#@stale/#@relax/#@update marks. Styles: css/viz/dijkstra.css (.dj-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXN = 8, MAXE = 16, LIMIT = 40; // LIMIT pops: negative cycles never finish, so stop and say so
  var PRESETS = [
    ['A-B:7 A-C:9 A-F:14 B-C:10 B-D:15 C-D:11 C-F:2 D-E:6 E-F:9', 'A', 'E'],
    ['A-B:4 A-C:1 C-B:2 B-D:1 C-D:5', 'A', 'D'],
    ['A>B:2 B>C:3 D>C:1', 'A', 'C'],
    ['A>B:1 A>C:2 B>D:2 C>B:-5', 'A', 'D'],
    ['A>B:1 B>C:-3 C>B:1', 'A', 'C']
  ];
  var STEPS = {
    init: { label: 'Start' }, pop: { label: 'Pop the smallest', tone: 'accent' }, stale: { label: 'Skip stale entry', tone: 'hard' },
    relax: { label: 'Try an edge' }, update: { label: 'Better route found', tone: 'ok' }, done: { label: 'Done', tone: 'ok' }
  };

  function parse(text) {
    var names = [], edges = [], skipped = [];
    function id(s) { var k = names.indexOf(s); if (k < 0) { if (names.length >= MAXN) return -1; names.push(s); k = names.length - 1; } return k; }
    String(text).split(/[\s,;]+/).filter(Boolean).forEach(function (tok) {
      var m = /^([A-Za-z0-9]{1,3})(-|>)([A-Za-z0-9]{1,3}):(-?\d{1,2})$/.exec(tok), a, b;
      if (!m || edges.length >= MAXE || m[1] === m[3]) { skipped.push(tok); return; }
      var had = names.length; a = id(m[1]); b = id(m[3]);
      if (a < 0 || b < 0) { names.length = had; skipped.push(tok); return; }
      edges.push({ a: a, b: b, w: +m[4], dir: m[2] === '>' });
    });
    return { names: names, edges: edges, skipped: skipped };
  }

  function cmp(x, y) { return x[0] - y[0] || x[1] - y[1]; }

  function frames(g, src, dst) {
    var n = g.names.length, adj = [], dist = [], par = [], pe = [], settled = [], heap = [], F = [], pops = 0, i;
    for (i = 0; i < n; i++) { adj.push([]); dist.push(null); par.push(-1); pe.push(-1); settled.push(false); }
    g.edges.forEach(function (e, k) {
      adj[e.a].push({ to: e.b, w: e.w, e: k });
      if (!e.dir) adj[e.b].push({ to: e.a, w: e.w, e: k });
    });
    function nm(k) { return g.names[k]; }
    function show(d) { return d === null ? '∞' : d; }
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, dist: dist.slice(), pe: pe.slice(), par: par.slice(), settled: settled.slice(), heap: heap.slice().sort(cmp) }, x));
    }
    dist[src] = 0; heap.push([0, src]);
    snap('init', 'Distance to ' + nm(src) + ' is 0. Every other node is unknown, ∞. The queue holds one entry: (0, ' + nm(src) + ').', { cur: src });
    while (heap.length) {
      if (++pops > LIMIT) {
        snap('done', 'Stopped after ' + LIMIT + ' pops. The queue never empties: a negative cycle keeps making distances smaller forever. Dijkstra needs non-negative weights; use Bellman-Ford to detect this.', { cap: 1, final: 1 });
        return F;
      }
      heap.sort(cmp);
      var top = heap.shift(), d = top[0], u = top[1];
      snap('pop', 'Pop (' + d + ', ' + nm(u) + '): the cheapest entry in the queue.', { cur: u, popped: top });
      if (d > dist[u]) {
        snap('stale', nm(u) + ' already has a better distance, ' + dist[u] + ', than this entry\'s ' + d + '. Skip it.', { cur: u, bad: 1 });
        continue;
      }
      settled[u] = true;
      adj[u].forEach(function (a) {
        var v = a.to, nd = d + a.w, win = dist[v] === null || nd < dist[v];
        snap('relax', nd + ' = ' + d + ' + ' + a.w + ' via ' + nm(u) + ' to ' + nm(v) + (win ? ' beats ' + show(dist[v]) + '.' : ' does not beat ' + dist[v] + '. No gain.'), { cur: u, v: v, e: a.e, win: win ? 1 : 0, lose: win ? 0 : 1 });
        if (win) {
          dist[v] = nd; par[v] = u; pe[v] = a.e; settled[v] = false; heap.push([nd, v]);
          snap('update', 'dist[' + nm(v) + '] = ' + nd + ', and (' + nd + ', ' + nm(v) + ') joins the queue. Its old entry, if any, stays and will be stale.', { cur: u, v: v, e: a.e, win: 1 });
        }
      });
    }
    var path = [], k, note = 'The queue is empty, so every reachable distance is final.';
    if (dst !== undefined && dst >= 0) {
      if (dist[dst] === null) note += ' ' + nm(dst) + ' is unreachable from ' + nm(src) + '.';
      else {
        for (k = dst; k !== -1; k = par[k]) path.unshift(k);
        note += ' Path rebuilt by following each node\'s parent from ' + nm(dst) + ' back to ' + nm(src) + ': ' + path.map(nm).join(' → ') + ', cost ' + dist[dst] + '.';
      }
    }
    snap('done', note, { final: 1, path: path });
    return F;
  }

  var W = 320, H = 230, R = 17;
  function layout(n) { // an ellipse, first node at the top
    var out = [], i, a;
    if (n === 1) return [{ x: W / 2, y: H / 2 }];
    if (n === 2) return [{ x: 70, y: H / 2 }, { x: W - 70, y: H / 2 }];
    for (i = 0; i < n; i++) { a = -Math.PI / 2 + 2 * Math.PI * i / n; out.push({ x: W / 2 + 120 * Math.cos(a), y: H / 2 + 88 * Math.sin(a) }); }
    return out;
  }
  function r1(x) { return Math.round(x * 10) / 10; }

  function stageHTML(g) {
    var pos = layout(g.names.length), html = '<div class="va dj"><svg class="dj-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Weighted graph">';
    g.edges.forEach(function (e, k) {
      var p = pos[e.a], q = pos[e.b], dx = q.x - p.x, dy = q.y - p.y, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len,
        x1 = p.x + ux * R, y1 = p.y + uy * R, x2 = q.x - ux * R, y2 = q.y - uy * R, mx = p.x + dx * 0.36 - uy * 11, my = p.y + dy * 0.36 + ux * 11; // label nearer the first node, so crossing edges don't share a midpoint
      html += '<g class="dj-e" data-e="' + k + '"><line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '"/>';
      if (e.dir) html += '<polygon points="' + r1(x2) + ',' + r1(y2) + ' ' + r1(x2 - ux * 10 - uy * 5) + ',' + r1(y2 - uy * 10 + ux * 5) + ' ' + r1(x2 - ux * 10 + uy * 5) + ',' + r1(y2 - uy * 10 - ux * 5) + '"/>';
      html += '<text class="dj-w" x="' + r1(mx) + '" y="' + r1(my) + '">' + e.w + '</text></g>';
    });
    g.names.forEach(function (s, k) {
      html += '<g class="dj-n" data-n="' + k + '"><circle cx="' + r1(pos[k].x) + '" cy="' + r1(pos[k].y) + '" r="' + R + '"/><text x="' + r1(pos[k].x) + '" y="' + r1(pos[k].y) + '">' + esc(s) + '</text></g>';
    });
    html += '</svg><div class="va-row dj-tbl" aria-hidden="true">';
    g.names.forEach(function (s, k) { html += '<span class="va-cell" data-c="' + k + '"><b></b><small>' + esc(s) + '</small></span>'; });
    return html + '</div><dl class="va-read"><div><dt>Queue</dt><dd class="dj-q"></dd></div><div><dt>Popped</dt><dd class="dj-p"></dd></div></dl>' +
      '<dl class="va-read"><div><dt>Path</dt><dd class="dj-path"></dd></div></dl></div>';
  }

  function paint(g, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(g);
    var onPath = {}, inPath = {};
    (f.path || []).forEach(function (k, i, a) { inPath[k] = 1; if (i) onPath[f.pe[k]] = 1; });
    OR.$$('.dj-e', stage).forEach(function (el) {
      var k = +el.dataset.e, c = 'dj-e';
      if (f.path && f.path.length && onPath[k]) c += ' path';
      else if (k === f.e && f.v !== undefined) c += f.win ? ' win' : ' look';
      else if (f.pe.indexOf(k) >= 0) c += ' tree';
      el.setAttribute('class', c);
    });
    function cls(k, cell) {
      var c = '';
      if (f.path && f.path.length && inPath[k]) return ' ok';
      if (k === f.cur && f.cur !== undefined) c = f.bad ? ' dup cur' : ' in cur';
      else if (k === f.v) c = ' in';
      else if (f.settled[k]) c = ' ok';
      if (cell && k === f.v && f.step === 'update') c += ' best';
      return c;
    }
    OR.$$('.dj-n', stage).forEach(function (el) { el.setAttribute('class', 'dj-n' + cls(+el.dataset.n)); });
    OR.$$('.va-cell', stage).forEach(function (el) {
      var k = +el.dataset.c;
      el.className = 'va-cell' + cls(k, 1) + (f.dist[k] === null ? ' gone' : '');
      OR.$('b', el).textContent = f.dist[k] === null ? '∞' : f.dist[k];
    });
    OR.$('.dj-q', stage).innerHTML = f.heap.length ? f.heap.map(function (h) {
      var stale = h[0] > f.dist[h[1]];
      return '<span class="va-kv' + (stale ? ' bad' : '') + '" title="' + (stale ? 'stale' : '') + '">' + h[0] + ',' + esc(g.names[h[1]]) + '</span>';
    }).join('') : '<span class="faint">empty</span>';
    OR.$('.dj-p', stage).innerHTML = f.popped ? '<span class="va-kv cv-take">' + f.popped[0] + ',' + esc(g.names[f.popped[1]]) + '</span>' : '<span class="faint">none</span>';
    OR.$('.dj-path', stage).innerHTML = f.path && f.path.length ? f.path.map(function (k) { return '<span class="va-kv cv-take">' + esc(g.names[k]) + '</span>'; }).join('→') + ' <b class="num">' + f.dist[f.path[f.path.length - 1]] + '</b>' : '<span class="faint">found when the queue is empty</span>';
  }

  OR.viz.dijkstra = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="dj-in">Your roads: <code>A-B:4</code> two-way, <code>A&gt;B:4</code> one-way (up to ' + MAXN + ' places, ' + MAXE + ' roads)</label>' +
        '<div class="va-input-row"><input class="input mono" id="dj-in" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0][0]) + '"><button class="btn" type="submit">Run it</button></div>' +
        '<div class="dj-ends"><label for="dj-from">From</label><input class="input mono" id="dj-from" spellcheck="false" autocomplete="off" value="' + PRESETS[0][1] + '"><label for="dj-to">To</label><input class="input mono" id="dj-to" spellcheck="false" autocomplete="off" value="' + PRESETS[0][2] + '"></div>' +
        '<p class="dj-msg" role="status"></p>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + ['Classic', 'Stale entries', 'One-way, unreachable', 'Negative edge', 'Negative cycle'].map(function (t, k) { return '<button class="chip" type="button" data-s="' + k + '">' + t + '</button>'; }).join('') +
        '<span class="faint">Negative weights break Dijkstra: the last two presets show how.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#dj-in', host), from = OR.$('#dj-from', host), to = OR.$('#dj-to', host), msg = OR.$('.dj-msg', host), slot = OR.$('.va-player', host);

      function find(g, s, fallback) { var k = g.names.indexOf(s.trim()); return k < 0 ? fallback : k; }
      function run() {
        var g = parse(input.value);
        if (!g.edges.length) { g = parse(PRESETS[0][0]); msg.textContent = 'No valid roads found, so the classic graph is shown. Write each as A-B:4.'; }
        else msg.textContent = g.skipped.length ? 'Skipped: ' + g.skipped.join(' ') : '';
        var src = find(g, from.value, 0), dst = find(g, to.value, g.names.length - 1);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(g, src, dst), steps: STEPS, label: 'Dijkstra from ' + g.names[src] + ' to ' + g.names[dst],
          paint: function (stage, f) { paint(g, stage, f); mark(f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]'); if (!b) return;
        var p = PRESETS[+b.dataset.s]; input.value = p[0]; from.value = p[1]; to.value = p[2]; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
