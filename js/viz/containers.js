/* Offer Ready: containers visualizer (the lesson's template: count in a hash map, sort with a comparator, take k).
   Each frame is a snapshot. Steps match the template's #@count/#@sort/#@take marks. A cost readout compares the
   sort the template uses with a size-k heap and a bucket pass for the same input. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 14, PRESETS = [['1 1 1 2 2 3', 2], ['4 4 5 5 6', 2], ['7 3 7 3 9 9 7', 3], ['5 5 5 5', 1]];
  var STEPS = {
    start: { label: 'Start' }, count: { label: 'Count', tone: 'accent' }, sort: { label: 'Order', tone: 'hard' },
    take: { label: 'Take k', tone: 'ok' }, done: { label: 'Done' }
  };
  function lg(x) { return x > 1 ? Math.log(x) / Math.LN2 : 0; }
  function parse(text) {
    return String(text).split(/[\s,]+/).filter(function (t) { return /^-?\d{1,3}$/.test(t); }).slice(0, MAX).map(Number);
  }

  function frames(nums, k) {
    var out = [], counts = {}, order = [];
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, i: -1, k: k,
        counts: order.map(function (v) { return [v, counts[v]]; }) }, x));
    }
    snap('start', nums.length ? 'Input read. The hash map is empty. Next: count each value.' : 'Type some whole numbers, then press Run it.');
    nums.forEach(function (x, i) {
      if (!(x in counts)) { counts[x] = 0; order.push(x); }
      counts[x]++;
      snap('count', 'Read ' + x + ': counts[' + x + '] is now ' + counts[x] + '. One hash-map update, O(1) on average.', { i: i, hit: x });
    });
    var m = order.length, kk = Math.max(1, Math.min(k, m)), sorted = order.slice().sort(function (a, b) { return counts[b] - counts[a] || a - b; });
    if (!m) { snap('done', 'No numbers, so the answer is an empty list.', { final: true, sorted: [], taken: [] }); return out; }
    var cost = { n: nums.length, m: m, sort: Math.ceil(m * lg(m)), heap: Math.ceil(m * lg(kk)), bucket: nums.length + m };
    snap('sort', 'Order the ' + m + ' distinct values with the comparator: higher count first, ties by smaller value. About m·log₂m = ' + cost.sort + ' comparisons.', { sorted: sorted, cost: cost });
    snap('take', 'Take the first ' + kk + ': [' + sorted.slice(0, kk).join(', ') + '].' + (k > m ? ' (k is larger than the number of distinct values, so you get them all.)' : ''), { sorted: sorted, taken: sorted.slice(0, kk), cost: cost });
    snap('done', 'Done. Counting was ' + nums.length + ' map updates. A size-' + kk + ' heap would need about m·log₂k = ' + cost.heap + ' steps instead of ' + cost.sort + ' comparisons, and a bucket pass about n + m = ' + cost.bucket + '.', { sorted: sorted, taken: sorted.slice(0, kk), cost: cost, final: true });
    return out;
  }

  function stageHTML(n) {
    var cells = '';
    for (var i = 0; i < n; i++) cells += '<span class="va-cell"><b></b><small>' + i + '</small></span>';
    return '<div class="va cv" style="--n:' + n + '"><div class="va-row" aria-hidden="true">' + cells + '</div>' +
      '<dl class="va-read cv-read"><div><dt>hash map</dt><dd class="cv-map"></dd></div><div><dt>ordered</dt><dd class="cv-ord"></dd></div>' +
      '<div><dt>answer</dt><dd class="cv-ans"></dd></div><div><dt>cost</dt><dd class="cv-cost"></dd></div></dl></div>';
  }
  function kvs(list, cls, taken) {
    return list.length ? list.map(function (e) {
      return '<span class="va-kv' + (taken && taken.indexOf(e[0]) >= 0 ? ' cv-take' : '') + (cls && cls === e[0] ? ' cv-hit' : '') + '">' + esc(e[0]) + ' <b>×' + e[1] + '</b></span>';
    }).join('') : '<span class="faint">empty</span>';
  }

  function paint(nums, stage, f) {
    if (!stage.firstChild) {
      stage.innerHTML = stageHTML(nums.length);
      OR.$$('.va-cell b', stage).forEach(function (b, i) { b.textContent = nums[i]; });
    }
    OR.$$('.va-cell', stage).forEach(function (el, i) {
      el.className = 'va-cell' + (f.i >= 0 && i <= f.i ? ' in' : '') + (f.i === i ? ' cur' : '') + (f.final || f.step === 'sort' || f.step === 'take' ? ' in' : '');
    });
    var counts = {}; f.counts.forEach(function (e) { counts[e[0]] = e[1]; });
    OR.$('.cv-map', stage).innerHTML = kvs(f.counts, f.hit, null);
    OR.$('.cv-ord', stage).innerHTML = f.sorted ? kvs(f.sorted.map(function (v) { return [v, counts[v]]; }), null, f.taken) : '<span class="faint">not yet</span>';
    OR.$('.cv-ans', stage).innerHTML = f.taken ? '<b class="num">[' + esc(f.taken.join(', ')) + ']</b>' : '<span class="faint">not yet</span>';
    OR.$('.cv-cost', stage).innerHTML = f.cost
      ? '<span class="va-kv">sort <b>~' + f.cost.sort + '</b></span><span class="va-kv">heap(k) <b>~' + Math.min(f.cost.heap, 9999) + '</b></span><span class="va-kv">buckets <b>~' + f.cost.bucket + '</b></span>'
      : '<span class="faint mono">' + (f.step === 'start' ? 'n = ' + nums.length : f.counts.length + ' distinct so far') + '</span>';
  }

  OR.viz['containers'] = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="cv-in">Your numbers (up to ' + MAX + ', whole, space-separated)</label>' +
        '<div class="va-input-row"><input class="input mono" id="cv-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0][0] + '" aria-describedby="cv-k">' +
        '<input class="input mono" id="cv-k" type="number" min="1" max="' + MAX + '" value="' + PRESETS[0][1] + '" style="max-width:5rem" aria-label="k">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + esc(p[0]) + ' (k=' + p[1] + ')</button>'; }).join('') +
        '<span class="faint">The second preset has a tie: 4 and 5 both appear twice, so the smaller value wins.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#cv-in', host), kin = OR.$('#cv-k', host), slot = OR.$('.va-player', host);

      function run(text, k) {
        var nums = parse(text); k = Math.max(1, Math.min(MAX, parseInt(k, 10) || 1));
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(nums, k), steps: STEPS, label: 'Container operations on ' + nums.join(', '),
          paint: function (stage, f) { paint(nums, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value, kin.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; input.value = p[0]; kin.value = p[1]; run(p[0], p[1]);
      });
      run(PRESETS[0][0], PRESETS[0][1]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
