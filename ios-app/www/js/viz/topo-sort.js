/* Offer Ready: topological sort visualizer (Kahn's algorithm, the lesson's template).
   Input: an edge list such as "0>1 0>2 1>3" (a>b means a must come before b). Frames are snapshots;
   frame steps match the template's #@build/#@seed/#@take/#@relax/#@release/#@done marks. The "cycle"
   step (an order that comes up short) lights the #@done line. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var NMAX = 8, EMAX = 16, R = 17, STEP_X = 72, STEP_Y = 50, PAD = 28;
  var PRESETS = [
    { edges: '5>2 5>0 4>0 4>1 2>3 3>1', label: 'Six tasks' },
    { edges: '0>1 0>2 1>3 2>3', label: 'Diamond (two valid orders)' },
    { edges: '0>1 1>2 2>1 2>3', label: 'Cycle: order comes up short' }
  ];
  var STEPS = {
    start: { label: 'Start' }, build: { label: 'Count in-degrees', tone: 'accent' }, seed: { label: 'Seed the queue', tone: 'accent' },
    take: { label: 'Emit a node', tone: 'ok' }, relax: { label: 'Remove an edge', tone: 'accent' }, release: { label: 'Node unlocked', tone: 'ok' },
    done: { label: 'Result' }, cycle: { label: 'Cycle found', tone: 'hard' }
  };

  function parse(text) {
    var toks = text.replace(/\s*>\s*/g, '>').split(/[\s,;]+/).filter(Boolean), edges = [], max = 0, i, m;
    for (i = 0; i < toks.length; i++) {
      m = /^(\d{1,2})>(\d{1,2})$/.exec(toks[i]);
      if (!m || +m[1] >= NMAX || +m[2] >= NMAX) return { err: 'Use pairs like 0>1, with nodes 0 to ' + (NMAX - 1) + '. “' + toks[i].slice(0, 12) + '” does not fit.' };
      edges.push([+m[1], +m[2]]); max = Math.max(max, +m[1], +m[2]);
    }
    if (edges.length > EMAX) return { err: 'Up to ' + EMAX + ' edges, please.' };
    if (!edges.length) return { err: 'Type at least one edge, like 0>1.' };
    return { n: max + 1, edges: edges };
  }

  function frames(n, edges) {
    var out = [], indeg = [], queue = [], order = [], j, cur = -1, ei = -1, stuck = [];
    for (j = 0; j < n; j++) indeg.push(0);
    function snap(step, note) {
      out.push({ step: step, note: note, n: n, edges: edges, indeg: indeg.slice(), queue: queue.slice(), order: order.slice(), cur: cur, ei: ei, stuck: stuck.slice() });
    }
    snap('start', n + ' nodes and ' + edges.length + ' edges. An edge a>b means a must come before b. Goal: list every node so that all edges point forward.');
    edges.forEach(function (e) { indeg[e[1]]++; });
    snap('build', 'Build each node’s in-degree: how many edges point into it, i.e. how many things it still waits for.');
    for (j = 0; j < n; j++) if (indeg[j] === 0) queue.push(j);
    snap('seed', queue.length ? 'Nodes with in-degree 0 wait for nothing, so they go in the queue: ' + queue.join(', ') + '.' : 'No node has in-degree 0: every node waits for another one, so nothing can start. That already means a cycle.');
    while (queue.length) {
      cur = queue.shift(); order.push(cur); ei = -1;
      snap('take', 'Take ' + cur + ' from the front and emit it. The order is now ' + order.join(' ') + '.');
      edges.forEach(function (e, k) {
        if (e[0] !== cur) return;
        ei = k; indeg[e[1]]--;
        snap('relax', 'Edge ' + cur + '>' + e[1] + ' is satisfied: remove it. in-degree of ' + e[1] + ' drops to ' + indeg[e[1]] + '.');
        if (indeg[e[1]] === 0) { queue.push(e[1]); snap('release', e[1] + ' now waits for nothing: add it to the back of the queue.'); }
      });
      ei = -1;
    }
    cur = -1;
    if (order.length === n) { snap('done', 'All ' + n + ' nodes came out: ' + order.join(' ') + '. A valid order. Ties are broken by queue order, so other valid orders may exist.'); return out; }
    for (j = 0; j < n; j++) if (order.indexOf(j) < 0) stuck.push(j);
    snap('cycle', 'Only ' + order.length + ' of ' + n + ' nodes came out. ' + stuck.join(', ') + ' still ' + (stuck.length > 1 ? 'have' : 'has') + ' in-degree above 0: they wait on each other (or behind a cycle). A short order means there is a cycle, so no valid order exists.');
    return out;
  }

  function layout(n, edges) {
    var L = [], k, it, ranks, cols = {}, pos = [], maxPer = 1, nl;
    for (k = 0; k < n; k++) L.push(0);
    for (it = 0; it < n; it++) edges.forEach(function (e) { if (e[0] !== e[1] && L[e[0]] + 1 > L[e[1]]) L[e[1]] = Math.min(L[e[0]] + 1, n - 1); });
    ranks = L.filter(function (v, i) { return L.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    for (k = 0; k < n; k++) { var c = ranks.indexOf(L[k]); (cols[c] = cols[c] || []).push(k); maxPer = Math.max(maxPer, cols[c].length); }
    nl = ranks.length;
    var H = maxPer * STEP_Y + PAD * 2, W = (nl - 1) * STEP_X + R * 2 + 24;
    Object.keys(cols).forEach(function (c) {
      cols[c].forEach(function (v, i) { pos[v] = { x: 12 + R + c * STEP_X, y: H / 2 + (i - (cols[c].length - 1) / 2) * STEP_Y }; });
    });
    return { pos: pos, W: W, H: H };
  }

  function unit(dx, dy) { var l = Math.sqrt(dx * dx + dy * dy) || 1; return [dx / l, dy / l]; }
  function edgeSVG(e, k, pos) {
    var a = pos[e[0]], b = pos[e[1]], d, tip, dir, px, py, p;
    function f(v) { return Math.round(v * 10) / 10; }
    if (e[0] === e[1]) {
      tip = [a.x + 8, a.y - R + 1]; dir = [-0.4, 0.92];
      d = 'M' + f(a.x - 8) + ',' + f(a.y - R + 1) + ' C' + f(a.x - 18) + ',' + f(a.y - R - 24) + ' ' + f(a.x + 18) + ',' + f(a.y - R - 24) + ' ' + f(tip[0]) + ',' + f(tip[1]);
    } else {
      var u = unit(b.x - a.x, b.y - a.y), c = { x: (a.x + b.x) / 2 - u[1] * 11, y: (a.y + b.y) / 2 + u[0] * 11 }, s = unit(c.x - a.x, c.y - a.y), t = unit(c.x - b.x, c.y - b.y);
      tip = [b.x + t[0] * (R + 2), b.y + t[1] * (R + 2)]; dir = unit(tip[0] - c.x, tip[1] - c.y);
      d = 'M' + f(a.x + s[0] * R) + ',' + f(a.y + s[1] * R) + ' Q' + f(c.x) + ',' + f(c.y) + ' ' + f(tip[0]) + ',' + f(tip[1]);
    }
    px = -dir[1]; py = dir[0];
    p = f(tip[0]) + ',' + f(tip[1]) + ' ' + f(tip[0] - dir[0] * 9 + px * 4.5) + ',' + f(tip[1] - dir[1] * 9 + py * 4.5) + ' ' + f(tip[0] - dir[0] * 9 - px * 4.5) + ',' + f(tip[1] - dir[1] * 9 - py * 4.5);
    return '<g class="ts-e" data-i="' + k + '"><path d="' + d + '"/><polygon points="' + p + '"/></g>';
  }

  function cell(b, cls, sub) { return '<span class="va-cell' + (cls ? ' ' + cls : '') + '"><b>' + b + '</b>' + (sub === undefined ? '' : '<small>' + sub + '</small>') + '</span>'; }

  function stageHTML(f) {
    var g = layout(f.n, f.edges), k, svg = '';
    f.edges.forEach(function (e, i) { svg += edgeSVG(e, i, g.pos); });
    for (k = 0; k < f.n; k++) {
      svg += '<g class="ts-n" data-n="' + k + '"><circle cx="' + g.pos[k].x + '" cy="' + g.pos[k].y + '" r="' + R + '"/><text x="' + g.pos[k].x + '" y="' + (g.pos[k].y + 5) + '" text-anchor="middle">' + k + '</text>' +
        '<text class="ts-d" x="' + (g.pos[k].x + R - 1) + '" y="' + (g.pos[k].y - R + 4) + '" text-anchor="start"></text></g>';
    }
    return '<div class="va ts"><svg class="ts-svg" viewBox="0 0 ' + g.W + ' ' + g.H + '" style="max-width:' + Math.round(g.W * 1.5) + 'px" role="img" aria-label="The graph. A small number beside each node is its remaining in-degree.">' + svg + '</svg>' +
      '<div class="ts-rows"><div class="ts-row"><span class="ts-lab">in-degree</span><span class="ts-indeg"></span></div>' +
      '<div class="ts-row"><span class="ts-lab">queue</span><span class="ts-queue"></span></div>' +
      '<div class="ts-row"><span class="ts-lab">order</span><span class="ts-order"></span></div></div></div>';
  }

  function paint(stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(f);
    var k, st = {};
    f.queue.forEach(function (v) { st[v] = 'in'; });
    f.order.forEach(function (v) { st[v] = 'gone'; });
    f.stuck.forEach(function (v) { st[v] = 'stuck'; });
    if (f.step === 'take') st[f.cur] = 'cur';
    OR.$$('.ts-n', stage).forEach(function (el) {
      var v = +el.dataset.n, cls = st[v] || '';
      if (f.cur === v && f.step !== 'take' && f.cur >= 0) cls = 'gone cur';
      el.setAttribute('class', 'ts-n' + (cls ? ' ' + cls : ''));
      el.lastChild.textContent = f.step === 'start' || f.indeg[v] < 0 ? '' : f.indeg[v];
    });
    OR.$$('.ts-e', stage).forEach(function (el, i) {
      var e = f.edges[i], cls = f.ei === i ? 'cur' : f.order.indexOf(e[0]) >= 0 && (e[0] !== f.cur || i < f.ei) ? 'used' : '';
      el.setAttribute('class', 'ts-e' + (cls ? ' ' + cls : ''));
    });
    OR.$('.ts-indeg', stage).innerHTML = f.step === 'start' ? '<span class="faint">not counted yet</span>' : f.indeg.map(function (d, v) {
      var cls = st[v] === 'gone' ? 'gone' : d === 0 ? 'ok' : st[v] === 'stuck' ? 'dup' : '';
      return cell(d, cls, v);
    }).join('');
    OR.$('.ts-queue', stage).innerHTML = f.queue.length ? f.queue.map(function (v, i) { return cell(v, i === 0 ? 'in' : 'in'); }).join('') : '<span class="faint">empty</span>';
    OR.$('.ts-order', stage).innerHTML = f.order.length ? f.order.map(function (v) { return cell(v, f.step === 'cycle' ? '' : 'ok'); }).join('') : '<span class="faint">nothing yet</span>';
    if (f.step === 'cycle') OR.$('.ts-order', stage).innerHTML += '<span class="ts-short">' + f.order.length + ' of ' + f.n + '</span>';
  }

  OR.viz['topo-sort'] = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = (ctx && ctx.mark) || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="ts-in">Edges: a>b means a comes before b (nodes 0 to ' + (NMAX - 1) + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="ts-in" maxlength="80" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0].edges) + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="ts-err" role="alert" hidden></p>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) {
          return '<button class="chip" type="button" data-p="' + i + '">' + esc(p.label) + '</button>';
        }).join('') + '</p></form><div class="va-player"></div>';
      var input = OR.$('#ts-in', host), slot = OR.$('.va-player', host), err = OR.$('.ts-err', host);

      function run() {
        var p = parse(input.value);
        err.hidden = !p.err; err.textContent = p.err || '';
        if (p.err) return;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(p.n, p.edges), steps: STEPS, label: 'Kahn’s algorithm on ' + input.value.trim(),
          paint: function (stage, f) { paint(stage, f); mark(f.step === 'start' ? null : f.step === 'cycle' ? 'done' : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        input.value = PRESETS[+b.dataset.p].edges; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
