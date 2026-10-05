/* Offer Ready: sorting-race visualizer. Five sorts run on the same digits, one tick per comparison or element move.
   Each sort is traced once into snapshots (so stepping back is just painting an earlier frame). The template beside
   the visualizer is merge sort: its compare/take/rest lines light up while the merge lane is running. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 12, K = 10; // up to 12 digits, each 0 to 9, so counting sort's range is 10
  var PRESETS = [['Shuffled', '729403861592'], ['Sorted', '011234567889'], ['Reversed', '988765432110'],
    ['Few kinds', '313231321221'], ['Nearly sorted', '012435678998']];
  var STEPS = {
    start: { label: 'Start' }, compare: { label: 'Merge compares', tone: 'accent' }, take: { label: 'Merge takes' },
    rest: { label: 'Merge copies the rest' }, tick: { label: 'Tick' }, finish: { label: 'A sort finishes', tone: 'ok' }, done: { label: 'Race over' }
  };
  var LANES = [
    { id: 'insertion', name: 'Insertion', cost: 'O(n²), O(n) if nearly sorted' },
    { id: 'merge', name: 'Merge', cost: 'O(n log n) always' },
    { id: 'quick', name: 'Quick (last-item pivot)', cost: 'O(n log n) typical, O(n²) worst' },
    { id: 'heap', name: 'Heap', cost: 'O(n log n) always' },
    { id: 'counting', name: 'Counting', cost: 'O(n + k), digits only' }
  ];

  // A trace is a list of ops. ops[0] is the starting state; every later op is one tick.
  function tracer(a0) {
    var a = a0.slice(), ops = [], cmp = 0, mv = 0, fixed = [];
    function snap(kind, text, hi, mark, arr) {
      if (kind === 'cmp') cmp++; else if (kind === 'move') mv++;
      ops.push({ a: (arr || a).slice(), kind: kind, text: text, hi: hi || [], mark: mark || null, cmp: cmp, mv: mv, ok: fixed.slice() });
    }
    snap('start', 'waiting');
    return { a: a, ops: ops, snap: snap, fixed: fixed };
  }
  function finish(t) { // mark every cell sorted on the last op, without adding a tick
    var last = t.ops[t.ops.length - 1];
    last.ok = last.a.map(function (_, i) { return i; });
    last.final = true;
    return t.ops;
  }

  function insertion(a0) {
    var t = tracer(a0), a = t.a, i, j, key;
    for (i = 1; i < a.length; i++) {
      key = a[i]; j = i - 1;
      while (j >= 0) {
        t.snap('cmp', 'is ' + a[j] + ' > ' + key + '?', [j]);
        if (a[j] > key) { a[j + 1] = a[j]; t.snap('move', 'shift ' + a[j] + ' right', [j + 1]); j--; } else break;
      }
      if (j + 1 !== i) { a[j + 1] = key; t.snap('move', 'drop ' + key + ' into place', [j + 1]); }
    }
    return finish(t);
  }

  function merge(a0) {
    var t = tracer(a0), a = t.a;
    (function sort(lo, hi) { // sorts a[lo..hi]
      if (lo >= hi) return;
      var mid = (lo + hi) >> 1, L, R, i = 0, j = 0, k = lo;
      sort(lo, mid); sort(mid + 1, hi);
      L = a.slice(lo, mid + 1); R = a.slice(mid + 1, hi + 1);
      while (i < L.length && j < R.length) {
        t.snap('cmp', 'is ' + L[i] + ' ≤ ' + R[j] + '?', [k], 'compare');
        if (L[i] <= R[j]) a[k] = L[i++]; else a[k] = R[j++];
        t.snap('move', 'take ' + a[k], [k], 'take'); k++;
      }
      while (i < L.length) { a[k] = L[i++]; t.snap('move', 'copy leftover ' + a[k], [k], 'rest'); k++; }
      while (j < R.length) { a[k] = R[j++]; t.snap('move', 'copy leftover ' + a[k], [k], 'rest'); k++; }
    })(0, a.length - 1);
    return finish(t);
  }

  function quick(a0) {
    var t = tracer(a0), a = t.a;
    function swap(i, j, text) { var x = a[i]; a[i] = a[j]; a[j] = x; t.snap('move', text, [i, j]); }
    (function sort(lo, hi) {
      if (lo > hi) return;
      if (lo === hi) { t.fixed.push(lo); return; }
      var p = a[hi], i = lo - 1, j;
      for (j = lo; j < hi; j++) {
        t.snap('cmp', 'is ' + a[j] + ' ≤ pivot ' + p + '?', [j, hi]);
        if (a[j] <= p) { i++; if (i !== j) swap(i, j, 'swap ' + a[i] + ' and ' + a[j]); }
      }
      if (i + 1 !== hi) swap(i + 1, hi, 'pivot ' + p + ' to its final place');
      t.fixed.push(i + 1);
      sort(lo, i); sort(i + 2, hi);
    })(0, a.length - 1);
    return finish(t);
  }

  function heap(a0) {
    var t = tracer(a0), a = t.a, n = a.length;
    function swap(i, j, text) { var x = a[i]; a[i] = a[j]; a[j] = x; t.snap('move', text, [i, j]); }
    function down(i, size) {
      for (;;) {
        var l = 2 * i + 1, r = l + 1, big = i;
        if (l >= size) return;
        if (r < size) { t.snap('cmp', 'bigger child: ' + a[l] + ' or ' + a[r] + '?', [l, r]); big = a[r] > a[l] ? r : l; } else big = l;
        t.snap('cmp', 'is child ' + a[big] + ' > parent ' + a[i] + '?', [i, big]);
        if (a[big] <= a[i]) return;
        swap(i, big, 'sift ' + a[big] + ' up'); i = big;
      }
    }
    var i;
    for (i = (n >> 1) - 1; i >= 0; i--) down(i, n);
    for (i = n - 1; i > 0; i--) {
      if (a[0] !== a[i]) swap(0, i, 'max ' + a[0] + ' to the back'); else t.snap('move', 'swap max ' + a[0] + ' with an equal value at the back', [0, i]);
      t.fixed.push(i);
      down(0, i);
    }
    if (n) t.fixed.push(0);
    return finish(t);
  }

  function counting(a0) {
    var t = tracer(a0), a = t.a, n = a.length, count = [], out = [], i, v;
    for (i = 0; i < K; i++) count.push(0);
    for (i = 0; i < n; i++) { v = a[i]; count[v]++; t.snap('move', 'count[' + v + '] is now ' + count[v], [i]); }
    for (i = 1; i < K; i++) { count[i] += count[i - 1]; t.snap('move', 'prefix: count[' + i + '] = ' + count[i] + ' items are ≤ ' + i, []); }
    for (i = 0; i < n; i++) out.push(null);
    for (i = n - 1; i >= 0; i--) { // walking backwards keeps equal digits in their original order
      v = a[i]; count[v]--; out[count[v]] = v;
      t.snap('move', 'place ' + v + ' at slot ' + count[v], [count[v]], null, out);
    }
    var last = t.ops[t.ops.length - 1]; last.a = out.slice(); // the output array is the answer
    return finish(t);
  }

  var SORTS = { insertion: insertion, merge: merge, quick: quick, heap: heap, counting: counting };

  function frames(a) {
    var traces = LANES.map(function (l) { return SORTS[l.id](a); });
    var T = Math.max.apply(null, traces.map(function (o) { return o.length - 1; })), out = [], i;
    var order = traces.map(function (o, k) { return { k: k, t: o.length - 1 }; }).sort(function (x, y) { return x.t - y.t; });
    var place = {}; // lane index -> 1-based place; ties share a place
    order.forEach(function (o, r) { place[o.k] = r > 0 && order[r - 1].t === o.t ? place[order[r - 1].k] : r + 1; });
    for (i = 0; i <= T; i++) {
      var finishing = [], m = traces[1], mop = m[Math.min(i, m.length - 1)];
      traces.forEach(function (o, k) { if (i > 0 && o.length - 1 === i) finishing.push(LANES[k].name.split(' ')[0]); });
      var running = i > 0 && i <= m.length - 1, step = i === 0 ? 'start' : i === T ? 'done' : finishing.length ? 'finish' : running ? mop.mark : 'tick';
      var note;
      if (i === 0) note = 'Same ' + a.length + ' digits in every lane. One tick is one comparison or one element move, so the lane that finishes in the fewest ticks did the least work.';
      else if (i === T) note = summary(traces);
      else if (finishing.length) note = finishing.join(' and ') + ' sort' + (finishing.length > 1 ? 's' : '') + ' finished at tick ' + i + '. The other lanes are still working.';
      else note = 'Tick ' + i + ' of ' + T + '.';
      out.push({ step: step, note: note, i: i, mark: running ? mop.mark : null, final: i === T,
        lanes: traces.map(function (o, k) { var op = o[Math.min(i, o.length - 1)]; return { op: op, done: i >= o.length - 1 && !!op.final, place: place[k], ticks: o.length - 1 }; }) });
    }
    return out;
  }
  function summary(traces) {
    var ticks = traces.map(function (o, k) { return { n: LANES[k].name.split(' ')[0], t: o.length - 1 }; });
    var best = Math.min.apply(null, ticks.map(function (x) { return x.t; })), worst = Math.max.apply(null, ticks.map(function (x) { return x.t; }));
    var b = ticks.filter(function (x) { return x.t === best; }).map(function (x) { return x.n; }), w = ticks.filter(function (x) { return x.t === worst; }).map(function (x) { return x.n; });
    return 'Fewest ticks: ' + b.join(' and ') + ' (' + best + '). Most: ' + w.join(' and ') + ' (' + worst + '). Try another preset: the order changes with the input.';
  }

  function stageHTML(n) {
    var cells = '';
    for (var i = 0; i < n; i++) cells += '<span class="sr-cell"><b></b></span>';
    return '<div class="sr">' + LANES.map(function (l) {
      return '<div class="sr-lane"><div class="sr-head"><b class="sr-name">' + esc(l.name) + '</b><span class="faint sr-cost">' + esc(l.cost) + '</span>' +
        '<span class="sr-stat mono"></span></div><div class="sr-cells" aria-hidden="true">' + cells + '</div><p class="sr-op faint mono"></p></div>';
    }).join('') + '</div>';
  }

  function paint(n, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(n);
    OR.$$('.sr-lane', stage).forEach(function (lane, k) {
      var L = f.lanes[k], op = L.op, ok = {}, cells = OR.$$('.sr-cell', lane);
      op.ok.forEach(function (x) { ok[x] = 1; });
      cells.forEach(function (el, i) {
        var v = op.a[i];
        el.className = 'sr-cell' + (v === null || v === undefined ? ' empty' : '') + (ok[i] ? ' ok' : '') + (!L.done && op.hi.indexOf(i) >= 0 ? (op.kind === 'cmp' ? ' cmp' : ' mv') : '');
        el.firstChild.textContent = v === null || v === undefined ? '·' : v;
      });
      lane.classList.toggle('done', L.done);
      OR.$('.sr-stat', lane).innerHTML = (L.done ? '<span class="sr-place">' + ordinal(L.place) + '</span> ' : '') +
        '<b class="num">' + (op.cmp + op.mv) + '</b> ticks <span class="faint">' + op.cmp + ' cmp · ' + op.mv + ' mv</span>';
      OR.$('.sr-op', lane).textContent = L.done ? 'sorted' : op.kind === 'start' ? '' : op.text;
    });
  }
  function ordinal(p) { return p + (p === 1 ? 'st' : p === 2 ? 'nd' : p === 3 ? 'rd' : 'th'); }

  function parse(s) { return (String(s).match(/[0-9]/g) || []).slice(0, MAX).map(Number); }

  OR.viz['sorting-race'] = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    sorts: SORTS,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="sr-in">Your digits (0 to 9, up to ' + MAX + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="sr-in" maxlength="' + (MAX * 2) + '" spellcheck="false" autocomplete="off" inputmode="numeric" value="' + PRESETS[0][1] + '">' +
        '<button class="btn" type="submit">Race them</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p[1] + '">' + p[0] + '</button>'; }).join('') +
        '<span class="faint">On sorted input insertion sort barely works, while quick sort with a last-item pivot makes about n²/2 comparisons. At 12 items that only ties merge sort; the gap opens as n grows.</span></p></form>' +
        '<div class="va-player"></div><p class="faint sr-follow">The highlighted template line follows the merge lane.</p>';
      var input = OR.$('#sr-in', host), slot = OR.$('.va-player', host);

      function run(text) {
        var a = parse(text);
        if (player) player.destroy();
        slot.innerHTML = '';
        if (!a.length) { slot.innerHTML = '<p class="faint">Type some digits from 0 to 9, or pick a preset.</p>'; mark(null); return; }
        input.value = a.join('');
        player = OR.player(slot, {
          frames: frames(a), steps: STEPS, label: 'Sorting race on ' + a.join(', '),
          paint: function (stage, f) { paint(a.length, stage, f); mark(f.mark); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]'); if (!b) return;
        input.value = b.dataset.s; run(b.dataset.s);
      });
      run(PRESETS[0][1]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
