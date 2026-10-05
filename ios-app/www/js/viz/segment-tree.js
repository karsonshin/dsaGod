/* Offer Ready: segment tree visualizer (a tree of range sums over up to 8 numbers).
   Builds the tree, then runs the typed operations (`update i v`, `query l r`) the way the lesson template does.
   Each frame is a snapshot, so stepping back just paints an earlier frame. Frame steps match the template's
   #@leaf/#@pull/#@udown/#@uleaf/#@upull/#@prune/#@cover/#@split marks. Styles: css/viz/segment-tree.css (.seg-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 8, MAXOPS = 6;
  var PRESETS = [
    { a: '5 3 8 6 2 7 4 1', o: 'query 2 5; update 3 1; query 0 4' },
    { a: '2 1 5 3 4 6 7 9', o: 'query 0 7; query 1 6' },
    { a: '4 4 4 4 4', o: 'query 1 3; update 2 9; query 1 3' },
    { a: '9 2 6', o: 'update 1 5; query 0 2' }
  ];
  var MARKED = { leaf: 1, pull: 1, udown: 1, uleaf: 1, upull: 1, prune: 1, cover: 1, split: 1 };
  var STEPS = {
    start: { label: 'Start' }, leaf: { label: 'Build leaf' }, pull: { label: 'Build parent' }, ask: { label: 'Next operation' },
    udown: { label: 'Descend', tone: 'accent' }, uleaf: { label: 'Set leaf', tone: 'hard' }, upull: { label: 'Recompute', tone: 'hard' },
    prune: { label: 'Pruned' }, cover: { label: 'Covered', tone: 'ok' }, split: { label: 'Partial', tone: 'accent' },
    ans: { label: 'Answer', tone: 'ok' }, done: { label: 'Done', tone: 'ok' }
  };

  function frames(vals, ops) {
    var n = vals.length, a = vals.slice(), T = {}, S = {}, F = [], res = [], parts = [], opText = '';
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, a: a.slice(), t: Object.assign({}, T), s: Object.assign({}, S), res: res.slice(), parts: parts.slice(), op: opText }, x));
    }
    function span(lo, hi) { return lo === hi ? '[' + lo + ']' : '[' + lo + '..' + hi + ']'; }

    function build(id, lo, hi) {
      if (lo === hi) { T[id] = a[lo]; snap('leaf', 'Leaf ' + span(lo, hi) + ' holds the array value ' + a[lo] + '.', { cur: id }); return; }
      var m = (lo + hi) >> 1;
      build(2 * id, lo, m); build(2 * id + 1, m + 1, hi);
      T[id] = T[2 * id] + T[2 * id + 1];
      snap('pull', 'Node ' + span(lo, hi) + ' = ' + T[2 * id] + ' + ' + T[2 * id + 1] + ' = ' + T[id] + ': the sum of its two halves.', { cur: id });
    }
    function upd(id, lo, hi, i, v) {
      S[id] = 'path';
      if (lo === hi) { a[i] = v; T[id] = v; snap('uleaf', 'Reached leaf ' + span(lo, hi) + ': overwrite it with ' + v + '.', { cur: id, idx: i }); return; }
      var m = (lo + hi) >> 1, left = i <= m;
      snap('udown', 'Node ' + span(lo, hi) + ': index ' + i + ' lies in the ' + (left ? 'left ' + span(lo, m) : 'right ' + span(m + 1, hi)) + ' half, so only that child is visited.', { cur: id, idx: i });
      if (left) upd(2 * id, lo, m, i, v); else upd(2 * id + 1, m + 1, hi, i, v);
      T[id] = T[2 * id] + T[2 * id + 1];
      snap('upull', 'On the way back up, recompute ' + span(lo, hi) + ' = ' + T[2 * id] + ' + ' + T[2 * id + 1] + ' = ' + T[id] + '.', { cur: id, idx: i });
    }
    function qry(id, lo, hi, l, r) {
      var rng = [l, r];
      if (r < lo || hi < l) { S[id] = 'prune'; snap('prune', 'Node ' + span(lo, hi) + ' is outside ' + span(l, r) + ': it adds nothing (return 0). Pruned.', { cur: id, rng: rng }); return 0; }
      if (l <= lo && hi <= r) {
        S[id] = 'cover'; parts.push(T[id]);
        snap('cover', 'Node ' + span(lo, hi) + ' is fully inside ' + span(l, r) + ': take its stored sum ' + T[id] + ' and stop. No need to look deeper.', { cur: id, rng: rng });
        return T[id];
      }
      S[id] = 'part';
      snap('split', 'Node ' + span(lo, hi) + ' overlaps ' + span(l, r) + ' only partly: ask both halves and add the answers.', { cur: id, rng: rng });
      var m = (lo + hi) >> 1, x = qry(2 * id, lo, m, l, r), y = qry(2 * id + 1, m + 1, hi, l, r);
      return x + y;
    }
    function count(k) { return Object.keys(S).filter(function (id) { return S[id] === k; }).length; }

    snap('start', n ? 'A segment tree stores the sum of every block in a halving split of the array. First we build it from the leaves up.' : 'No numbers: nothing to build.');
    if (n) build(1, 0, n - 1);
    ops.forEach(function (op) {
      S = {}; parts = [];
      if (op.k === 'u') {
        opText = 'update ' + op.a + ' ' + op.b;
        snap('ask', 'Operation: set position ' + op.a + ' to ' + op.b + ' (it was ' + a[op.a] + '). Follow one path from the root to that leaf.', { idx: op.a });
        upd(1, 0, n - 1, op.a, op.b);
        snap('ans', 'Update done. Only the ' + count('path') + ' nodes on one root-to-leaf path were touched, so O(log n).', { idx: op.a });
      } else {
        opText = 'query ' + op.a + ' ' + op.b;
        snap('ask', 'Operation: the sum of positions ' + op.a + ' to ' + op.b + '. Start at the root and sort every node into outside, inside or partly overlapping.', { rng: [op.a, op.b] });
        var total = qry(1, 0, n - 1, op.a, op.b);
        res.push(total);
        snap('ans', 'Answer: ' + (parts.length > 1 ? parts.join(' + ') + ' = ' : '') + total + '. Visited ' + Object.keys(S).length + ' nodes: ' + count('cover') + ' covered, ' + count('part') + ' partial, ' + count('prune') + ' pruned.', { rng: [op.a, op.b] });
      }
    });
    snap('done', ops.length ? 'Done. Every update and query walked only a few nodes per level, so each cost O(log n), never O(n).' : 'No operations typed: the tree is built. Add `query` or `update` operations to see them run.');
    F[F.length - 1].s = {}; F[F.length - 1].parts = [];
    return F;
  }

  var ROW = 60, NODE = 34;
  function depthOf(n) { return n > 1 ? Math.ceil(Math.log2(n)) : 0; }
  function shape(n) {
    var out = [];
    (function go(id, lo, hi, d) {
      out.push({ id: id, lo: lo, hi: hi, d: d });
      if (lo < hi) { var m = (lo + hi) >> 1; go(2 * id, lo, m, d + 1); go(2 * id + 1, m + 1, hi, d + 1); }
    })(1, 0, n - 1, 0);
    return out;
  }
  function px(nd, n) { return ((nd.lo + nd.hi + 1) / 2) / n * 100; }

  function stageHTML(n) {
    var nodes = shape(n), by = {}, html;
    nodes.forEach(function (nd) { by[nd.id] = nd; });
    html = '<div class="va"><div class="seg-tree" style="height:' + (depthOf(n) * ROW + NODE) + 'px"><svg class="seg-edges" aria-hidden="true">';
    nodes.forEach(function (nd) {
      if (nd.id === 1) return;
      var p = by[nd.id >> 1];
      html += '<line data-e="' + nd.id + '" x1="' + px(nd, n) + '%" y1="' + (nd.d * ROW + NODE / 2) + '" x2="' + px(p, n) + '%" y2="' + (p.d * ROW + NODE / 2) + '"/>';
    });
    html += '</svg>';
    nodes.forEach(function (nd) {
      html += '<span class="seg-n" data-n="' + nd.id + '" style="left:' + px(nd, n) + '%;top:' + (nd.d * ROW) + 'px"><b></b>' +
        (nd.lo < nd.hi ? '<i>' + nd.lo + '..' + nd.hi + '</i>' : '') + '</span>';
    });
    html += '</div><div class="va-row seg-arr" aria-hidden="true">';
    for (var i = 0; i < n; i++) html += '<span class="va-cell" data-c="' + i + '"><b></b><small>' + i + '</small></span>';
    html += '</div><dl class="va-read"><div><dt>Operation</dt><dd class="seg-op"></dd></div><div><dt>Counted</dt><dd class="seg-cnt"></dd></div><div><dt>Answers</dt><dd class="seg-res"></dd></div></dl>' +
      '<ul class="seg-key" aria-label="Key"><li><span class="seg-sw cov"></span>Covered: stored sum used</li><li><span class="seg-sw part"></span>Partial: ask both halves</li>' +
      '<li><span class="seg-sw prn"></span>Pruned: outside the range</li><li><span class="seg-sw path"></span>On the update path</li></ul></div>';
    return html;
  }

  function paint(n, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(n);
    OR.$$('.seg-n', stage).forEach(function (el) {
      var id = +el.dataset.n, built = f.t[id] !== undefined;
      el.className = 'seg-n' + (built ? '' : ' off') + (f.s[id] ? ' ' + f.s[id] : '') + (f.cur === id ? ' cur' : '');
      OR.$('b', el).textContent = built ? f.t[id] : '';
    });
    OR.$$('.seg-edges line', stage).forEach(function (el) {
      var id = +el.dataset.e;
      el.setAttribute('class', f.s[id] ? 'on ' + f.s[id] : f.t[id] === undefined ? 'off' : '');
    });
    OR.$$('.va-cell', stage).forEach(function (el) {
      var k = +el.dataset.c, inRange = f.rng && k >= f.rng[0] && k <= f.rng[1];
      el.className = 'va-cell' + (inRange ? ' in' : '') + (f.idx === k ? ' in cur' : '');
      OR.$('b', el).textContent = f.a[k];
    });
    OR.$('.seg-op', stage).innerHTML = f.op ? '<code>' + esc(f.op) + '</code>' : '<span class="faint">none yet</span>';
    OR.$('.seg-cnt', stage).innerHTML = f.parts.length ? f.parts.map(function (v) { return '<span class="va-kv">' + v + '</span>'; }).join('<span class="faint"> + </span>') : '<span class="faint">nothing yet</span>';
    OR.$('.seg-res', stage).innerHTML = f.res.length ? f.res.map(function (v, k) {
      return '<span class="va-kv' + (k === f.res.length - 1 && f.step === 'ans' ? ' cv-take' : '') + '">' + v + '</span>';
    }).join('') : '<span class="faint">none yet</span>';
  }

  function parse(text) {
    return String(text).split(/[\s,]+/).filter(Boolean).map(Number).filter(function (x) { return isFinite(x) && x === Math.floor(x); })
      .map(function (x) { return Math.max(-99, Math.min(99, x)); }).slice(0, MAX);
  }
  function parseOps(text, n) {
    var out = [], clampI = function (x) { return Math.max(0, Math.min(n - 1, x)); };
    String(text).split(/[;\n]+/).forEach(function (s) {
      var m;
      s = s.trim().toLowerCase();
      if (!s || out.length >= MAXOPS || !n) return;
      if ((m = /^(?:update|set|u)\s+(-?\d+)\s+(-?\d+)$/.exec(s))) out.push({ k: 'u', a: clampI(+m[1]), b: Math.max(-99, Math.min(99, +m[2])) });
      else if ((m = /^(?:query|sum|q)\s+(-?\d+)\s+(-?\d+)$/.exec(s))) { var l = clampI(+m[1]), r = clampI(+m[2]); out.push({ k: 'q', a: Math.min(l, r), b: Math.max(l, r) }); }
    });
    return out;
  }

  OR.viz['segment-tree'] = {
    frames: frames, parseOps: parseOps, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="seg-in">Your numbers (up to ' + MAX + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="seg-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0].a + '"></div>' +
        '<label class="field-label" for="seg-ops">Operations, separated by semicolons (up to ' + MAXOPS + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="seg-ops" spellcheck="false" autocomplete="off" value="' + PRESETS[0].o + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, k) { return '<button class="chip" type="button" data-p="' + k + '">' + esc(p.a.replace(/ /g, ', ')) + '</button>'; }).join('') +
        '<span class="faint">Use <code>query l r</code> (both ends included) and <code>update i v</code>. A wide query still visits only a few nodes.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#seg-in', host), opsIn = OR.$('#seg-ops', host), slot = OR.$('.va-player', host);

      function run() {
        var vals = parse(input.value), ops;
        if (!vals.length) { vals = parse(PRESETS[0].a); input.value = PRESETS[0].a; }
        ops = parseOps(opsIn.value, vals.length);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(vals, ops), steps: STEPS, label: 'Segment tree on ' + vals.join(', '),
          paint: function (stage, f) { paint(vals.length, stage, f); mark(MARKED[f.step] ? f.step : null); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; input.value = p.a; opsIn.value = p.o; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
