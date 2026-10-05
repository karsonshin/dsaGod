/* Offer Ready: heap visualizer (a min-heap drawn as a tree and as an array).
   Inserts every value with sift-up, then extracts the minimum repeatedly with sift-down: the lesson template's heap_sorted.
   Each frame is a snapshot, so stepping back just paints an earlier frame. Frame steps match the template's
   #@append/#@up/#@swapup/#@root/#@move/#@child/#@down/#@swapdown marks. Styles: css/viz/heap.css (.hp-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 10, PRESETS = ['5 3 8 1 9 2', '9 8 7 6 5 4', '4 4 1 1', '2 1 3'];
  var STEPS = {
    start: { label: 'Start' }, append: { label: 'Insert at end', tone: 'accent' }, up: { label: 'Compare parent' }, swapup: { label: 'Swap up', tone: 'hard' },
    root: { label: 'Take the root', tone: 'accent' }, move: { label: 'Last to root' }, child: { label: 'Pick smaller child' },
    down: { label: 'Compare child' }, swapdown: { label: 'Swap down', tone: 'hard' }, done: { label: 'Done', tone: 'ok' }
  };

  function frames(vals) {
    var h = [], out = [], F = [];
    function snap(step, note, x) { F.push(Object.assign({ step: step, note: note, a: h.slice(), out: out.slice() }, x)); }
    snap('start', 'An empty min-heap, stored in an array. Every value goes in at the end and climbs; then we pull the minimum off the root again and again.');
    vals.forEach(function (x) {
      var i, p;
      h.push(x); i = h.length - 1;
      snap('append', 'Insert ' + x + ': put it in the first free slot, index ' + i + '.' + (i ? '' : ' It is the root, so nothing to climb.'), { i: i });
      while (i > 0) {
        p = (i - 1) >> 1;
        if (h[p] > h[i]) {
          snap('up', 'Parent ' + h[p] + ' (index ' + p + ') is bigger than ' + h[i] + ': out of order.', { i: i, j: p, bad: 1 });
          var t = h[p]; h[p] = h[i]; h[i] = t;
          snap('swapup', 'Swap: ' + h[p] + ' moves up to index ' + p + '.', { i: p, j: i });
          i = p;
        } else {
          snap('up', 'Parent ' + h[p] + ' is not bigger than ' + h[i] + ': it stays. The heap property holds again.', { i: i, j: p, ok: 1 });
          break;
        }
      }
    });
    while (h.length) {
      var v = h[0], last = h.pop(), i = 0, c;
      out.push(v);
      snap('root', 'The smallest value is always the root: ' + v + '. Take it out.', { i: 0, taken: 1 });
      if (!h.length) break;
      h[0] = last;
      snap('move', 'Move the last value, ' + last + ', up to the root. The array has no gap, but ' + last + ' may be too big for the top.', { i: 0 });
      while (2 * i + 1 < h.length) {
        c = 2 * i + 1;
        if (c + 1 < h.length && h[c + 1] < h[c]) c++;
        snap('child', 'Children of index ' + i + ': ' + h[2 * i + 1] + (2 * i + 2 < h.length ? ' and ' + h[2 * i + 2] : '') + '. The smaller is ' + h[c] + ' (index ' + c + ').', { i: i, j: c });
        if (h[c] >= h[i]) {
          snap('down', h[c] + ' is not smaller than ' + h[i] + ': it stays. The heap property holds again.', { i: i, j: c, ok: 1 });
          break;
        }
        snap('down', h[c] + ' is smaller than ' + h[i] + ': out of order.', { i: i, j: c, bad: 1 });
        var u = h[c]; h[c] = h[i]; h[i] = u;
        snap('swapdown', 'Swap: ' + h[i] + ' moves up to index ' + i + ', and ' + h[c] + ' sinks to index ' + c + '.', { i: c, j: i });
        i = c;
      }
      if (2 * i + 1 >= h.length && F[F.length - 1].step !== 'down') snap('down', 'Index ' + i + ' has no children left: it has settled.', { i: i, ok: 1 });
    }
    snap('done', vals.length ? 'Done. The values came off the root in sorted order: ' + out.join(', ') + '. Each insert and extract walks one root-to-leaf path, so O(log n) each.' : 'No values: nothing to insert or extract.', { final: 1 });
    return F;
  }

  var ROW = 52, NODE = 34;
  function pos(i) { var lv = Math.floor(Math.log2(i + 1)), k = i + 1 - (1 << lv); return { x: (k + 0.5) / (1 << lv) * 100, y: lv * ROW }; }

  function stageHTML(n) {
    var levels = Math.floor(Math.log2(Math.max(n, 1))) + 1, i, html = '<div class="va hp"><div class="hp-tree" style="height:' + (levels * ROW - (ROW - NODE)) + 'px">' +
      '<svg class="hp-edges" aria-hidden="true">';
    for (i = 1; i < n; i++) {
      var a = pos(i), b = pos((i - 1) >> 1);
      html += '<line data-e="' + i + '" x1="' + a.x + '%" y1="' + (a.y + NODE / 2) + '" x2="' + b.x + '%" y2="' + (b.y + NODE / 2) + '"/>';
    }
    html += '</svg>';
    for (i = 0; i < n; i++) { var p = pos(i); html += '<span class="hp-n" data-n="' + i + '" style="left:' + p.x + '%;top:' + p.y + 'px"></span>'; }
    html += '</div><div class="va-row hp-arr" aria-hidden="true">';
    for (i = 0; i < n; i++) html += '<span class="va-cell" data-c="' + i + '"><b></b><small>' + i + '</small></span>';
    return html + '</div><dl class="va-read"><div><dt>Heap size</dt><dd class="hp-size"></dd></div><div><dt>Out</dt><dd class="hp-out"></dd></div></dl></div>';
  }

  function paint(n, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(n);
    function cls(k) {
      if (k >= f.a.length) return '';
      if (k === f.i) return f.ok ? ' ok cur' : f.bad ? ' dup cur' : ' in cur';
      if (k === f.j) return f.ok ? ' ok' : f.bad ? ' dup' : ' in';
      return '';
    }
    OR.$$('.hp-n', stage).forEach(function (el) {
      var k = +el.dataset.n, live = k < f.a.length;
      el.className = 'hp-n' + (live ? '' : ' off') + cls(k);
      el.textContent = live ? f.a[k] : '';
    });
    OR.$$('.hp-edges line', stage).forEach(function (el) {
      var k = +el.dataset.e;
      el.setAttribute('class', k < f.a.length ? '' : 'off');
    });
    OR.$$('.va-cell', stage).forEach(function (el) {
      var k = +el.dataset.c, live = k < f.a.length;
      el.className = 'va-cell' + (live ? cls(k) : ' gone');
      OR.$('b', el).textContent = live ? f.a[k] : '';
    });
    OR.$('.hp-size', stage).innerHTML = '<b class="num">' + f.a.length + '</b>';
    OR.$('.hp-out', stage).innerHTML = f.out.length ? f.out.map(function (v, k) {
      return '<span class="va-kv' + (k === f.out.length - 1 && f.taken ? ' cv-take' : '') + '">' + v + '</span>';
    }).join('') : '<span class="faint">nothing yet</span>';
  }

  function parse(text) {
    return String(text).split(/[\s,]+/).filter(Boolean).map(Number).filter(function (x) { return isFinite(x) && x === Math.floor(x); })
      .map(function (x) { return Math.max(-99, Math.min(99, x)); }).slice(0, MAX);
  }

  OR.viz.heap = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="hp-in">Your numbers (up to ' + MAX + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="hp-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p.replace(/ /g, ', ') + '</button>'; }).join('') +
        '<span class="faint">Separate numbers with spaces or commas. Watch how few swaps one insert needs.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#hp-in', host), slot = OR.$('.va-player', host);

      function run(text) {
        var vals = parse(text);
        if (!vals.length) vals = parse(PRESETS[0]);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(vals), steps: STEPS, label: 'Min-heap on ' + vals.join(', '),
          paint: function (stage, f) { paint(vals.length, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]'); if (!b) return;
        input.value = b.dataset.s; run(b.dataset.s);
      });
      run(PRESETS[0]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
