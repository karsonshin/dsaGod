/* Offer Ready: interval-DP visualizer (burst balloons, dp[l][r] filled by increasing length).
   Frames are precomputed snapshots of the table, so stepping back just paints an earlier frame.
   Frame steps match the template's #@pick/#@try/#@best marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR;
  var MAX = 7, MAXV = 9, PRESETS = [[3, 1, 5, 8], [1, 5], [2, 4, 3, 1, 5, 2, 6], [9, 1, 9]];
  var STEPS = {
    start: { label: 'Start' }, pick: { label: 'Interval', tone: 'accent' }, try: { label: 'Try last', tone: 'accent' },
    best: { label: 'New best', tone: 'ok' }, done: { label: 'Done' }
  };

  // Real run of the template over the padded array, snapshotting after each step.
  function build(nums) {
    var a = [1].concat(nums, [1]), n = a.length, dp = [], frames = [], split = [], i, j;
    for (i = 0; i < n; i++) { dp.push([]); split.push([]); for (j = 0; j < n; j++) { dp[i].push(0); split[i].push(-1); } }
    function snap(step, note, l, r, k, calc) {
      frames.push({ step: step, note: note, l: l, r: r, k: k, calc: calc || null,
        dp: dp.map(function (row) { return row.slice(); }), sp: split.map(function (row) { return row.slice(); }) });
    }
    snap('start', 'Padded with a 1 on each side: ' + a.join(', ') + '. dp[l][r] is the best coins from bursting every balloon strictly between l and r. Empty gaps are 0, so we start with intervals of width 2.', -1, -1, -1);
    var len, l, r, k;
    for (len = 2; len < n; len++) {
      for (l = 0; l + len < n; l++) {
        r = l + len;
        snap('pick', 'Width ' + len + ': interval (' + l + ', ' + r + ') holds ' + (len - 1) + ' balloon' + (len === 2 ? '' : 's') + ' (positions ' + (l + 1) + (len > 2 ? ' to ' + (r - 1) : '') + '). Which one bursts LAST?', l, r, -1);
        for (k = l + 1; k < r; k++) {
          var left = dp[l][k], right = dp[k][r], mult = a[l] * a[k] * a[r], gain = left + right + mult;
          var calc = { left: left, right: right, mult: mult, gain: gain };
          snap('try', 'If balloon ' + k + ' (value ' + a[k] + ') goes last, its neighbors are the walls ' + l + ' and ' + r + ': ' + a[l] + '·' + a[k] + '·' + a[r] + ' = ' + mult + '. Add dp[' + l + '][' + k + '] = ' + left + ' and dp[' + k + '][' + r + '] = ' + right + ' for ' + gain + '.', l, r, k, calc);
          if (split[l][r] < 0 || gain > dp[l][r]) {
            var first = split[l][r] < 0; dp[l][r] = gain; split[l][r] = k;
            snap('best', gain + (first ? ' is the first option, so' : ' beats the old best, so') + ' dp[' + l + '][' + r + '] = ' + gain + ' and the split point is k = ' + k + '.', l, r, k, calc);
          }
        }
      }
    }
    snap('done', nums.length ? 'dp[0][' + (n - 1) + '] = ' + dp[0][n - 1] + ' is the most coins for bursting all ' + nums.length + ' balloons. The small number in each cell is the split k that produced it.' : 'Nothing to burst: 0 coins.', -1, -1, -1);
    return { frames: frames, a: a, n: n, result: dp[0][n - 1] };
  }

  function stageHTML(R) {
    var n = R.n, i, j, h = '<div class="dpi"><div class="dpi-arr" aria-label="Padded balloon values">';
    for (i = 0; i < n; i++) h += '<span class="dpi-a' + (i === 0 || i === n - 1 ? ' wall' : '') + '"><b>' + R.a[i] + '</b><small>' + i + '</small></span>';
    h += '</div><div class="dpi-tbl" style="--n:' + n + '" role="img" aria-label="Table dp, row l, column r. Each step is described below the picture."><span class="dpi-h"></span>';
    for (j = 0; j < n; j++) h += '<span class="dpi-h">' + j + '</span>';
    for (i = 0; i < n; i++) {
      h += '<span class="dpi-h">' + i + '</span>';
      for (j = 0; j < n; j++) h += j <= i ? '<span class="dpi-c void"></span>' : '<span class="dpi-c" data-l="' + i + '" data-r="' + j + '"></span>';
    }
    return h + '</div><p class="dpi-calc" aria-live="off"></p></div>';
  }

  function paint(R, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(R);
    var n = R.n;
    OR.$$('.dpi-a', stage).forEach(function (el, i) {
      var on = f.l >= 0 && (i === f.l || i === f.r);
      el.className = 'dpi-a' + (i === 0 || i === n - 1 ? ' wall' : '') + (on ? ' wallcur' : '') + (i === f.k ? ' last' : '') + (f.l >= 0 && i > f.l && i < f.r && i !== f.k ? ' in' : '');
    });
    OR.$$('.dpi-c[data-l]', stage).forEach(function (el) {
      var l = +el.dataset.l, r = +el.dataset.r, v = f.dp[l][r], s = f.sp[l][r], c = 'dpi-c';
      if (r - l < 2) c += ' base';
      else if (l === f.l && r === f.r) c += f.step === 'best' ? ' ok cur' : ' cur';
      else if (f.k >= 0 && f.step === 'try' && ((l === f.l && r === f.k) || (l === f.k && r === f.r))) c += ' src';
      var w = r - l, cw = f.r - f.l, shown = f.step === 'done' || (f.l >= 0 && (w < cw || (w === cw && l < f.l))) || (w === cw && l === f.l && s >= 0);
      if (w > 1 && !shown && !(l === f.l && r === f.r)) c += ' todo';
      el.className = c;
      el.innerHTML = w < 2 ? '<b>0</b>' : shown ? '<b>' + v + '</b>' + (s >= 0 ? '<small>k' + s + '</small>' : '') : '';
    });
    var p = OR.$('.dpi-calc', stage);
    p.innerHTML = f.calc ? 'dp[' + f.l + '][' + f.k + '] + dp[' + f.k + '][' + f.r + '] + ' + R.a[f.l] + '·' + R.a[f.k] + '·' + R.a[f.r] +
      ' = <b class="num">' + f.calc.left + '</b> + <b class="num">' + f.calc.right + '</b> + <b class="num">' + f.calc.mult + '</b> = <b class="num">' + f.calc.gain + '</b>' : '&nbsp;';
  }

  function parse(txt) {
    var m = String(txt).match(/-?\d+/g) || [];
    return m.slice(0, MAX).map(function (x) { return Math.max(0, Math.min(MAXV, parseInt(x, 10))); });
  }

  OR.viz['dp-interval'] = {
    build: build, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="dpi-in">Balloon values (up to ' + MAX + ' numbers, 0 to ' + MAXV + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="dpi-in" type="text" inputmode="numeric" autocomplete="off" value="' + PRESETS[0].join(' ') + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-i="' + i + '">' + p.join(' ') + '</button>'; }).join('') +
        '<span class="faint">Watch the split k: the balloon chosen to burst last.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#dpi-in', host), slot = OR.$('.va-player', host);
      function run() {
        var nums = parse(input.value); input.value = nums.join(' ');
        if (player) player.destroy();
        slot.innerHTML = '';
        var R = build(nums);
        player = OR.player(slot, {
          frames: R.frames, steps: STEPS, label: 'Interval table for ' + (nums.join(', ') || 'no balloons'),
          paint: function (stage, f) { paint(R, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-i]'); if (!b) return;
        input.value = PRESETS[+b.dataset.i].join(' '); run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
