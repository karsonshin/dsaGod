/* Offer Ready: prefix-sum visualizer (subarray sum equals k, the lesson's template).
   Each frame is a snapshot, so stepping back is just painting an earlier frame. Frame steps match the
   template's #@add/#@look/#@store marks. A "hit" frame is a look-up that found matches (same template line). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXN = 8, MAXV = 99;
  var PRESETS = [
    { a: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 }, { a: [1, -1, 0], k: 0 }, { a: [1, 1, 1], k: 2 }
  ];
  var STEPS = {
    start: { label: 'Start' }, add: { label: 'Add to running' }, look: { label: 'Look up' },
    hit: { label: 'Match found', tone: 'ok' }, store: { label: 'Store prefix' }, done: { label: 'Done' }
  };

  function frames(nums, k) {
    var out = [], P = [0], seen = { 0: 1 }, order = [0], running = 0, count = 0;
    nums.forEach(function (x) { P.push(P[P.length - 1] + x); });
    function snap(step, note, i, x) {
      out.push(Object.assign({ step: step, note: note, i: i, run: running, count: count,
        seen: order.map(function (v) { return [v, seen[v]]; }) }, x));
    }
    snap('start', 'Prefix sums are the running totals. The map starts as {0: 1}: the empty prefix, sum 0, seen once. Looking for subarrays that sum to k = ' + k + '.', -1);
    nums.forEach(function (x, i) {
      running += x;
      snap('add', 'i = ' + i + ': add ' + x + '. The running prefix sum is now ' + running + ' (that is P[' + (i + 1) + ']).', i);
      var need = running - k, hit = seen[need] || 0, js = [];
      for (var j = 0; j <= i; j++) if (P[j] === need) js.push(j);
      count += hit;
      snap(hit ? 'hit' : 'look', hit
        ? 'Look up running − k = ' + running + ' − ' + k + ' = ' + need + '. It was seen ' + hit + (hit > 1 ? ' times' : ' time') + ', so ' + hit + ' subarray' + (hit > 1 ? 's end' : ' ends') + ' at index ' + i + ' with sum ' + k + '. count = ' + count + '.'
        : 'Look up running − k = ' + running + ' − ' + k + ' = ' + need + '. No earlier prefix has that value, so nothing ends here. count stays ' + count + '.',
        i, { need: need, hits: js });
      if (!(running in seen)) { seen[running] = 0; order.push(running); }
      seen[running]++;
      snap('store', 'Store the prefix ' + running + ': it has now been seen ' + seen[running] + (seen[running] > 1 ? ' times' : ' time') + '. Look up before you store, so a prefix never matches itself.', i, { stored: running });
    });
    snap('done', nums.length ? 'Done in one pass: ' + count + ' subarray' + (count === 1 ? '' : 's') + ' sum' + (count === 1 ? 's' : '') + ' to ' + k + '. One look-up per element, so O(n), and the sign of the numbers never mattered.'
      : 'An empty array has no subarrays: the answer is 0.', nums.length - 1, { final: true, stored: null });
    return out;
  }

  function stageHTML(nums) {
    var cells = nums.map(function (x, i) { return '<span class="va-cell"><b>' + x + '</b><small>' + i + '</small></span>'; }).join('');
    var pc = [0].concat(nums).map(function (x, j) { return '<span class="va-cell"><b></b><small>P' + j + '</small></span>'; }).join('');
    return '<div class="va ps" style="--n:' + (nums.length + 1) + '"><div class="ps-lbl faint">nums</div><div class="va-row ps-nums" aria-hidden="true">' + cells + '</div>' +
      '<div class="ps-lbl faint">prefix sums, P[0] = 0</div><div class="va-row ps-pre" aria-hidden="true">' + pc + '</div>' +
      '<dl class="va-read"><div><dt>running</dt><dd class="ps-run"></dd></div><div><dt>look for</dt><dd class="ps-need"></dd></div><div><dt>count</dt><dd class="ps-count"></dd></div></dl>' +
      '<dl class="va-read"><div><dt>seen</dt><dd class="ps-seen"></dd></div></dl></div>';
  }

  function paint(nums, P, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(nums);
    var hits = f.hits || [], inRange = {}, hasHits = (f.step === 'hit');
    if (hasHits) hits.forEach(function (j) { for (var t = j; t <= f.i; t++) inRange[t] = 1; });
    OR.$$('.ps-nums .va-cell', stage).forEach(function (el, i) {
      el.className = 'va-cell' + (inRange[i] ? ' ok' : '') + (i === f.i && !f.final ? ' cur' : '');
    });
    OR.$$('.ps-pre .va-cell', stage).forEach(function (el, j) {
      var known = j <= f.i + 1;   // P[j] exists once the running sum has reached j elements
      el.className = 'va-cell' + (known ? '' : ' gone') + (hasHits && hits.indexOf(j) >= 0 ? ' ok' : '') + (!f.final && j === f.i + 1 ? ' cur' : '');
      OR.$('b', el).textContent = known ? P[j] : '?';
    });
    OR.$('.ps-run', stage).innerHTML = '<b class="num">' + f.run + '</b>';
    OR.$('.ps-need', stage).innerHTML = f.need === undefined || f.step === 'add' ? '<span class="faint">—</span>'
      : '<span class="mono">' + f.run + ' − ' + (f.run - f.need) + ' = </span><b class="num">' + f.need + '</b>';
    OR.$('.ps-count', stage).innerHTML = '<b class="num">' + f.count + '</b>';
    OR.$('.ps-seen', stage).innerHTML = f.seen.map(function (e) {
      var lit = hasHits && e[0] === f.need || (f.step === 'store' && e[0] === f.stored);
      return '<span class="va-kv' + (lit ? ' ps-lit' : '') + '">' + e[0] + ' <b>' + e[1] + '</b></span>';
    }).join('');
  }

  function parse(text) {
    var a = text.split(/[\s,]+/).filter(Boolean).map(Number);
    if (a.some(function (x) { return !isFinite(x) || x !== Math.round(x); })) return null;
    return a.slice(0, MAXN).map(function (x) { return Math.max(-MAXV, Math.min(MAXV, x)); });
  }

  OR.viz['prefix-sum'] = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="ps-in">Your numbers (up to ' + MAXN + ', negatives welcome) and k</label>' +
        '<div class="va-input-row"><input class="input mono" id="ps-in" spellcheck="false" autocomplete="off" aria-label="Numbers" value="' + PRESETS[0].a.join(' ') + '">' +
        '<input class="input mono ps-k" id="ps-k" spellcheck="false" autocomplete="off" aria-label="k" value="' + PRESETS[0].k + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + esc(p.a.join(', ')) + ' (k = ' + p.k + ')</button>'; }).join('') +
        '<span class="faint">With k = 0, the {0: 1} seed is what counts subarrays that start at index 0.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#ps-in', host), kIn = OR.$('#ps-k', host), slot = OR.$('.va-player', host);

      function run(a, k) {
        if (player) player.destroy();
        slot.innerHTML = '';
        var P = [0]; a.forEach(function (x) { P.push(P[P.length - 1] + x); });
        player = OR.player(slot, {
          frames: frames(a, k), steps: STEPS, label: 'Prefix sums and a hash map on ' + a.join(', ') + ' with k = ' + k,
          paint: function (stage, f) { paint(a, P, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step === 'hit' ? 'look' : f.step); }
        });
      }
      function go() {
        var a = parse(input.value), k = Number(kIn.value.trim());
        if (!a || kIn.value.trim() === '' || !isFinite(k) || k !== Math.round(k)) { slot.innerHTML = '<p class="muted">Use whole numbers separated by spaces or commas, and a whole number for k.</p>'; return; }
        input.value = a.join(' '); run(a, k);
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); go(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; input.value = p.a.join(' '); kIn.value = p.k; run(p.a, p.k);
      });
      run(PRESETS[0].a, PRESETS[0].k);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
