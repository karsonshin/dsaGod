/* Offer Ready: Fenwick tree visualizer (the lesson's template: build, `update i v`, `prefix i`).
   Positions are 1-indexed. Each frame is a snapshot (array a, tree t), so stepping back repaints an earlier one.
   Frame steps match the template marks: build, upadd, upjump, downadd, downjump. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXN = 12, MAXV = 99, MAXOPS = 6;
  var PRESETS = [
    { a: [5, 3, 7, 1, 4, 2, 8, 6], ops: 'prefix 7, update 3 5, prefix 6' },
    { a: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], ops: 'update 1 10, prefix 12' },
    { a: [4, -1, 3, 6, 2], ops: 'prefix 5, prefix 4, update 4 -6' }
  ];
  var STEPS = {
    start: { label: 'Start' }, build: { label: 'Build the tree' },
    upadd: { label: 'Add to node', tone: 'accent' }, upjump: { label: 'Jump up (+ lowbit)', tone: 'accent' },
    downadd: { label: 'Take node', tone: 'ok' }, downjump: { label: 'Jump down (− lowbit)', tone: 'ok' },
    done: { label: 'Done' }
  };

  function low(i) { return i & -i; }
  function bin(i, w) { var s = i.toString(2); while (s.length < w) s = '0' + s; return s; }

  function frames(nums, ops) {
    var n = nums.length, w = n.toString(2).length, out = [];
    var a = [0].concat(nums), t = [], answers = [];
    for (var z = 0; z <= n; z++) t.push(0);
    var built = false;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, a: a.slice(), t: t.slice(), built: built, op: '', cur: 0, path: [], total: null, cov: [], kind: '' }, x));
    }
    snap('start', 'The array has ' + n + ' values, positions 1 to ' + n + '. A Fenwick tree stores, at position i, the sum of the lowbit(i) values that end at i. The bars you will see are those ranges.', {});
    // O(n) build: each node pushes its finished total up to its parent, i + lowbit(i)
    for (var i = 1; i <= n; i++) { t[i] += nums[i - 1]; var j = i + low(i); if (j <= n) t[j] += t[i]; }
    built = true;
    snap('build', 'Built in O(n): every node adds its finished total into its parent, i + lowbit(i), instead of running n separate updates. A bar over positions l..i holds their sum.', {});
    ops.forEach(function (o, k) {
      var label = o.kind === 'u' ? 'update ' + o.i + ' ' + o.v : 'prefix ' + o.i, p = o.i, path = [];
      if (o.kind === 'u') {
        a[o.i] += o.v;
        while (p <= n) {
          path.push(p);
          t[p] += o.v;
          snap('upadd', 'Node ' + p + ' covers positions ' + (p - low(p) + 1) + '..' + p + ', which include position ' + o.i + '. Add ' + o.v + ': tree[' + p + '] = ' + t[p] + '.',
            { op: label, cur: p, path: path.slice(), kind: 'u', opIdx: k });
          var q = p + low(p);
          snap('upjump', 'Jump up: ' + p + ' = ' + bin(p, w) + ', lowbit = ' + low(p) + ', so ' + p + ' + ' + low(p) + ' = ' + q + (q > n ? ', past the end (' + n + '). Stop: no wider range contains position ' + o.i + '.' : '. That bar is the next range that contains position ' + o.i + '.'),
            { op: label, cur: p, to: q, path: path.slice(), kind: 'u', opIdx: k });
          p = q;
        }
      } else {
        var total = 0, cov = [];
        if (p <= 0) { snap('downjump', 'An empty prefix is 0.', { op: label, total: 0, kind: 'p', opIdx: k }); }
        while (p > 0) {
          path.push(p); total += t[p];
          for (var c = p - low(p) + 1; c <= p; c++) cov.push(c);
          snap('downadd', 'Node ' + p + ' covers positions ' + (p - low(p) + 1) + '..' + p + '. Take tree[' + p + '] = ' + t[p] + '. Total so far: ' + total + '.',
            { op: label, cur: p, path: path.slice(), total: total, cov: cov.slice(), kind: 'p', opIdx: k });
          var r = p - low(p);
          snap('downjump', 'Jump down: ' + p + ' = ' + bin(p, w) + ', lowbit = ' + low(p) + ', so ' + p + ' − ' + low(p) + ' = ' + r + (r === 0 ? '. Nothing is left to the left: the prefix is ' + total + '.' : '. Positions 1..' + r + ' are still uncovered.'),
            { op: label, cur: p, to: r, path: path.slice(), total: total, cov: cov.slice(), kind: 'p', opIdx: k });
          p = r;
        }
        answers.push(total);
      }
    });
    snap('done', ops.length ? 'Each operation touched at most ' + w + ' nodes (the bits of i), so O(log n). ' + (answers.length ? 'Prefix answers: ' + answers.join(', ') + '.' : '') : 'Tree built. Add an operation to watch the jumps.', { op: '', final: true, answers: answers });
    out.answers = answers;
    return out;
  }

  function stageHTML(n) {
    var L = 0; while ((1 << (L + 1)) <= n) L++;
    var bars = '', cells = '';
    for (var i = 1; i <= n; i++) {
      var lb = low(i), lv = Math.log2(lb);
      bars += '<span class="fw-bar" data-i="' + i + '" style="grid-column:' + (i - lb + 1) + ' / ' + (i + 1) + ';grid-row:' + (L - lv + 1) + '"><b></b><small>T' + i + '</small></span>';
      cells += '<span class="fw-cell" data-i="' + i + '"><b></b><small>' + i + '</small></span>';
    }
    return '<div class="fw" style="--n:' + n + '"><div class="fw-lbl faint">tree: bar T<i>i</i> = sum of the positions it spans</div>' +
      '<div class="fw-bars" style="grid-template-rows:repeat(' + (L + 1) + ',var(--bar-h))" aria-hidden="true">' + bars + '</div>' +
      '<div class="fw-arr" aria-hidden="true">' + cells + '</div><div class="fw-lbl faint">array, positions 1 to ' + n + '</div>' +
      '<dl class="va-read"><div><dt>operation</dt><dd class="fw-op"></dd></div><div><dt>node</dt><dd class="fw-node"></dd></div><div><dt>total</dt><dd class="fw-total"></dd></div></dl></div>';
  }

  function paint(n, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(n);
    var w = n.toString(2).length, inPath = {}, cov = {}, upd = f.kind === 'u';
    f.path.forEach(function (p) { inPath[p] = 1; });
    f.cov.forEach(function (c) { cov[c] = 1; });
    OR.$$('.fw-bar', stage).forEach(function (el) {
      var i = +el.dataset.i;
      el.className = 'fw-bar' + (f.built ? '' : ' gone') + (inPath[i] ? (upd ? ' hit' : ' ok') : '') + (i === f.cur && !f.final ? ' cur' : '');
      OR.$('b', el).textContent = f.built ? f.t[i] : '?';
    });
    OR.$$('.fw-cell', stage).forEach(function (el) {
      var i = +el.dataset.i;
      el.className = 'fw-cell' + (cov[i] ? ' ok' : '') + (upd && f.path.length && f.op && i === +f.op.split(' ')[1] ? ' hit' : '');
      OR.$('b', el).textContent = f.a[i];
    });
    OR.$('.fw-op', stage).innerHTML = f.op ? '<b class="mono">' + esc(f.op) + '</b>' : '<span class="faint">—</span>';
    OR.$('.fw-node', stage).innerHTML = f.cur && !f.final ? '<span class="mono">' + f.cur + ' = ' + bin(f.cur, w) + ', lowbit ' + low(f.cur) + (f.to !== undefined ? ' → ' + f.to : '') + '</span>' : '<span class="faint">—</span>';
    OR.$('.fw-total', stage).innerHTML = f.kind === 'p' && f.total !== null ? '<b class="num">' + f.total + '</b>' : '<span class="faint">—</span>';
  }

  function parse(text) {
    var a = text.split(/[\s,]+/).filter(Boolean).map(Number);
    if (!a.length || a.some(function (x) { return !isFinite(x) || x !== Math.round(x); })) return null;
    return a.slice(0, MAXN).map(function (x) { return Math.max(-MAXV, Math.min(MAXV, x)); });
  }
  function parseOps(text, n) {
    var out = [], parts = text.split(/[,;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    for (var k = 0; k < parts.length && out.length < MAXOPS; k++) {
      var m = /^(update|u|prefix|p|query|q)\s+(-?\d+)(?:\s+(-?\d+))?$/i.exec(parts[k]);
      if (!m) return { err: 'Couldn’t read “' + parts[k] + '”. Write operations like: update 3 5, prefix 7.' };
      var kind = m[1][0].toLowerCase() === 'u' ? 'u' : 'p', i = +m[2];
      if (i < 1 || i > n) return { err: 'Position ' + i + ' is out of range: use 1 to ' + n + '.' };
      if (kind === 'u') { if (m[3] === undefined) return { err: '“update” needs a position and an amount: update 3 5.' }; out.push({ kind: 'u', i: i, v: Math.max(-MAXV, Math.min(MAXV, +m[3])) }); }
      else out.push({ kind: 'p', i: i });
    }
    return { ops: out };
  }

  OR.viz.fenwick = {
    frames: frames, // exposed for tools/check_engine.py
    parse: parse, parseOps: parseOps,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="fw-in">Your numbers (up to ' + MAXN + ') and operations</label>' +
        '<div class="va-input-row fw-in-row"><input class="input mono" id="fw-in" spellcheck="false" autocomplete="off" aria-label="Numbers" value="' + PRESETS[0].a.join(' ') + '">' +
        '<input class="input mono" id="fw-ops" spellcheck="false" autocomplete="off" aria-label="Operations" value="' + PRESETS[0].ops + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + esc(p.ops) + '</button>'; }).join('') +
        '<span class="faint"><b>update i v</b> adds v at position i. <b>prefix i</b> sums positions 1 to i. Up to ' + MAXOPS + ' operations. Try prefix 7 and prefix 8: 7 = 111 takes three nodes, 8 = 1000 takes one.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#fw-in', host), opIn = OR.$('#fw-ops', host), slot = OR.$('.va-player', host);

      function run(a, ops) {
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(a, ops), steps: STEPS, label: 'Fenwick tree on ' + a.join(', ') + ': ' + ops.map(function (o) { return o.kind === 'u' ? 'update ' + o.i + ' ' + o.v : 'prefix ' + o.i; }).join(', '),
          paint: function (stage, f) { paint(a.length, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      function go() {
        var a = parse(input.value);
        if (!a) { slot.innerHTML = '<p class="muted">Use whole numbers separated by spaces or commas.</p>'; return; }
        var r = parseOps(opIn.value, a.length);
        if (r.err) { slot.innerHTML = '<p class="muted">' + esc(r.err) + '</p>'; return; }
        input.value = a.join(' '); run(a, r.ops);
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); go(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; input.value = p.a.join(' '); opIn.value = p.ops; go();
      });
      go();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
