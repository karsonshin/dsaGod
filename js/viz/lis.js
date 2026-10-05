/* Offer Ready: LIS visualizer. Default view animates the patience-sorting tails array with a binary-search
   placement for each value (append or replace); a toggle shows the O(n^2) dp row instead.
   Each frame is a snapshot, so stepping back is just painting an earlier frame. Tails steps match the template's
   #@next/#@range/#@probe/#@right/#@left/#@append/#@replace/#@done marks. The dp view lights only #@next and #@done
   (the template is the tails version; the dp code is in "Variations"). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 12, LIM = 999;
  var PRESETS = [
    { name: 'classic', a: [10, 9, 2, 5, 3, 7, 101, 18] },
    { name: 'tails ≠ answer', a: [3, 8, 1] },
    { name: 'repeats', a: [7, 7, 7, 2, 2, 9] },
    { name: 'sorted', a: [1, 2, 3, 4, 5, 6] },
    { name: 'falling', a: [9, 7, 5, 3, 1] }
  ];
  var STEPS_T = {
    start: { label: 'Start' }, next: { label: 'Next value', tone: 'accent' }, range: { label: 'Set range' }, probe: { label: 'Probe mid', tone: 'accent' },
    right: { label: 'Go right' }, left: { label: 'Go left' }, append: { label: 'Append', tone: 'ok' }, replace: { label: 'Replace', tone: 'hard' }, done: { label: 'Done', tone: 'ok' }
  };
  var STEPS_D = {
    start: { label: 'Start' }, next: { label: 'Next index', tone: 'accent' }, dpcmp: { label: 'Compare with j' }, dpset: { label: 'Set dp[i]', tone: 'accent' }, done: { label: 'Done', tone: 'ok' }
  };

  function parseArray(text) {
    return (String(text).match(/-?\d+/g) || []).slice(0, MAX).map(function (x) { return Math.max(-LIM, Math.min(LIM, parseInt(x, 10))); });
  }

  function frames(a) {
    var out = [], t = [], n = a.length;
    function snap(step, note, x) { out.push(Object.assign({ step: step, note: note, i: -1, t: t.slice(), lo: -1, hi: -1, m: -1, ev: -1, kind: '' }, x)); }
    snap('start', n ? 'Build the tails array. tails[k] will hold the smallest last value of an increasing subsequence of length k + 1. It starts empty.' : 'Type some numbers and press Run it.');
    for (var i = 0; i < n; i++) {
      var x = a[i], lo = 0, hi = t.length;
      snap('next', 'Next value x = ' + x + '. Where does it belong in tails? Find the first tail that is at least ' + x + '.', { i: i });
      snap('range', 'tails has ' + hi + ' entr' + (hi === 1 ? 'y' : 'ies') + ', so the insertion point is somewhere in [0, ' + hi + ']. lo = 0, hi = ' + hi + '.', { i: i, lo: lo, hi: hi });
      while (lo < hi) {
        var mid = lo + Math.floor((hi - lo) / 2);
        snap('probe', 'mid = ' + mid + '. tails[' + mid + '] = ' + t[mid] + '. Is it smaller than ' + x + '? ' + (t[mid] < x ? 'Yes.' : 'No.'), { i: i, lo: lo, hi: hi, m: mid });
        if (t[mid] < x) {
          lo = mid + 1;
          snap('right', tails_(t[mid], x) + ' x can extend that subsequence, so the spot is further right. lo = mid + 1 = ' + lo + '.', { i: i, lo: lo, hi: hi, m: mid });
        } else {
          hi = mid;
          snap('left', t[mid] + ' is at least ' + x + ', so it could be the spot. Keep it. hi = mid = ' + hi + '.', { i: i, lo: lo, hi: hi, m: mid });
        }
      }
      if (lo === t.length) {
        t.push(x);
        snap('append', 'Insertion point ' + lo + ' is past the end: x = ' + x + ' beats every tail, so the longest increasing subsequence grows to ' + t.length + '.', { i: i, lo: lo, hi: lo, ev: lo, kind: 'new' });
      } else {
        var old = t[lo]; t[lo] = x;
        snap('replace', 'Insertion point ' + lo + ': replace tails[' + lo + '] = ' + old + ' with ' + x + '. Same length (' + (lo + 1) + '), but a smaller ending is never worse.', { i: i, lo: lo, hi: lo, ev: lo, kind: 'swap' });
      }
    }
    snap('done', n ? 'LIS length = len(tails) = ' + t.length + '. Note that tails need not be a real subsequence: only its length is guaranteed.' : 'Nothing to search: length 0.', { final: true });
    return out;
  }
  function tails_(tv, x) { return tv + ' < ' + x + ':'; }

  function framesDp(a) {
    var out = [], n = a.length, dp = [];
    function snap(step, note, x) { out.push(Object.assign({ step: step, note: note, i: -1, j: -1, dp: dp.slice() }, x)); }
    snap('start', n ? 'dp[i] = the longest increasing subsequence that ends exactly at index i. Every dp starts at 1.' : 'Type some numbers and press Run it.');
    for (var i = 0; i < n; i++) {
      dp[i] = 1;
      snap('next', 'Index ' + i + ', value ' + a[i] + '. Best so far for subsequences ending here: 1 (just itself).', { i: i });
      for (var j = 0; j < i; j++) {
        var ok = a[j] < a[i], up = ok && dp[j] + 1 > dp[i];
        if (up) dp[i] = dp[j] + 1;
        snap('dpcmp', 'j = ' + j + ': ' + a[j] + (ok ? ' < ' : ' ≥ ') + a[i] + (ok ? '. a[i] can extend a subsequence of length dp[j] = ' + dp[j] + (up ? ', so dp[i] becomes ' + dp[i] + '.' : ', which is no better than dp[i] = ' + dp[i] + '.') : '. Not smaller, so no extension.'), { i: i, j: j });
      }
      snap('dpset', 'dp[' + i + '] = ' + dp[i] + (i ? ' after comparing with all ' + i + ' earlier value' + (i === 1 ? '' : 's') + '.' : '.'), { i: i });
    }
    snap('done', n ? 'The answer is max(dp) = ' + Math.max.apply(null, dp) + ' (the best can end at any index). That took ' + (n * (n - 1) / 2) + ' comparisons: O(n²).' : 'Nothing to search: length 0.', { final: true });
    return out;
  }

  function cells(n, cls) { var s = ''; for (var k = 0; k < n; k++) s += '<span class="va-cell"><b></b><small>' + (cls === 'len' ? k + 1 : k) + '</small></span>'; return s; }
  function stageHTML(a, mode) {
    var n = a.length;
    return '<div class="va"><p class="lis-sec" style="margin-top:0">Input (read left to right)</p>' +
      '<div class="lis-row lis-in-row" aria-hidden="true">' + a.map(function (v, k) { return '<span class="va-cell"><b>' + esc(String(v)) + '</b><small>' + k + '</small></span>'; }).join('') + '</div>' +
      '<p class="lis-sec">' + (mode === 'dp' ? 'dp[i]: longest increasing subsequence ending at i' : 'tails (slot shows the subsequence length it stands for)') + '</p>' +
      '<div class="lis-row lis-out-row" aria-hidden="true">' + cells(n, mode === 'dp' ? 'idx' : 'len') + '</div>' +
      '<dl class="va-read lis-read">' + (mode === 'dp'
        ? '<div><dt>i</dt><dd class="lis-r1"></dd></div><div><dt>j</dt><dd class="lis-r2"></dd></div><div><dt>best so far</dt><dd class="lis-r3"></dd></div>'
        : '<div><dt>x</dt><dd class="lis-r1"></dd></div><div><dt>lo / mid / hi</dt><dd class="lis-r2"></dd></div><div><dt>length now</dt><dd class="lis-r3"></dd></div>') + '</dl></div>';
  }

  function paintT(a, stage, f) {
    var inC = OR.$$('.lis-in-row .va-cell', stage), outC = OR.$$('.lis-out-row .va-cell', stage), searching = f.lo >= 0 && /range|probe|right|left/.test(f.step);
    inC.forEach(function (el, k) { el.className = 'va-cell' + (f.final ? '' : k === f.i ? ' lis-in cur' : k > f.i ? ' lis-out' : ''); });
    outC.forEach(function (el, k) {
      var has = k < f.t.length;
      el.firstChild.textContent = has ? f.t[k] : '';
      el.className = 'va-cell' + (!has ? ' lis-empty' : f.final ? ' lis-max' : k === f.ev ? (f.kind === 'new' ? ' lis-new' : ' lis-swap') : searching && k >= f.lo && k < f.hi ? ' lis-in' : '') + (k === f.m && searching ? ' cur' : '');
      if (k === f.lo && f.hi === f.lo && searching) el.classList.add('lis-lo');
    });
    var x = f.i >= 0 && !f.final ? a[f.i] : null;
    OR.$('.lis-r1', stage).innerHTML = x === null ? '<span class="faint">none</span>' : '<b class="num">' + x + '</b>';
    OR.$('.lis-r2', stage).innerHTML = f.lo < 0 || f.final ? '<span class="faint">none</span>' : '<b class="num">' + f.lo + '</b> / ' + (f.m >= 0 ? '<b class="num">' + f.m + '</b>' : '<span class="faint">-</span>') + ' / <b class="num">' + f.hi + '</b>';
    OR.$('.lis-r3', stage).innerHTML = '<b class="num">' + f.t.length + '</b>';
  }

  function paintD(a, stage, f) {
    var inC = OR.$$('.lis-in-row .va-cell', stage), outC = OR.$$('.lis-out-row .va-cell', stage), best = f.dp.length ? Math.max.apply(null, f.dp) : 0;
    inC.forEach(function (el, k) { el.className = 'va-cell' + (f.final ? '' : k === f.i ? ' lis-in cur' : k === f.j ? ' lis-swap' : k > f.i ? ' lis-out' : ''); });
    outC.forEach(function (el, k) {
      var has = k < f.dp.length;
      el.firstChild.textContent = has ? f.dp[k] : '';
      el.className = 'va-cell' + (!has ? ' lis-empty' : f.final && f.dp[k] === best ? ' lis-max' : k === f.i && f.step !== 'start' ? ' lis-in cur' : '');
    });
    OR.$('.lis-r1', stage).innerHTML = f.i >= 0 && !f.final ? '<b class="num">' + f.i + '</b> <span class="faint mono">a[' + f.i + '] = ' + a[f.i] + '</span>' : '<span class="faint">none</span>';
    OR.$('.lis-r2', stage).innerHTML = f.j >= 0 && !f.final ? '<b class="num">' + f.j + '</b> <span class="faint mono">a[' + f.j + '] = ' + a[f.j] + '</span>' : '<span class="faint">none</span>';
    OR.$('.lis-r3', stage).innerHTML = '<b class="num">' + best + '</b>';
  }

  OR.viz.lis = {
    frames: frames, framesDp: framesDp, parseArray: parseArray, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'tails', cur = PRESETS[0].a.slice();
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="lis-arr">Your numbers (up to ' + MAX + ', any order)</label>' +
        '<div class="va-input-row"><input class="input mono" id="lis-arr" maxlength="70" spellcheck="false" autocomplete="off" aria-label="Numbers, separated by commas">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-pre="' + i + '">' + esc(p.name) + '</button>'; }).join('') +
        '<span class="faint">“tails ≠ answer” ends with [1, 8], which is not in input order.</span></p></form>' +
        '<p class="va-presets lis-modes"><span class="faint">View</span> <button class="chip" type="button" data-mode="tails" aria-pressed="true">tails + binary search</button>' +
        '<button class="chip" type="button" data-mode="dp" aria-pressed="false">O(n²) dp row</button>' +
        '<span class="faint lis-dpnote lis-hide">The template is the tails version, so only “Next” and “Done” light a line here. The dp code is under Variations.</span></p>' +
        '<div class="va-player"></div>';
      var arr = OR.$('#lis-arr', host), slot = OR.$('.va-player', host);

      function run(a) {
        cur = a;
        if (player) player.destroy();
        slot.innerHTML = '';
        arr.value = a.join(', ');
        var dp = mode === 'dp';
        OR.$$('[data-mode]', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
        OR.$('.lis-dpnote', host).classList.toggle('lis-hide', !dp);
        player = OR.player(slot, {
          frames: dp ? framesDp(a) : frames(a), steps: dp ? STEPS_D : STEPS_T, label: (dp ? 'DP row' : 'Tails array') + ' for ' + (a.length ? a.join(', ') : 'an empty list'),
          paint: function (stage, f) {
            if (!stage.firstChild) stage.innerHTML = stageHTML(a, mode);
            (dp ? paintD : paintT)(a, stage, f);
            mark(f.step === 'next' || f.step === 'done' ? f.step : dp || f.step === 'start' ? null : f.step);
          }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(parseArray(arr.value)); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pre]'), m = e.target.closest('[data-mode]');
        if (b) run(PRESETS[+b.dataset.pre].a.slice());
        else if (m && m.dataset.mode !== mode) { mode = m.dataset.mode; run(cur); }
      });
      run(cur);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
