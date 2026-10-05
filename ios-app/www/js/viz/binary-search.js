/* Offer Ready: binary-search visualizer (lower bound: the first index whose value is >= target).
   Each frame is a snapshot, so stepping back is just painting an earlier frame. Frame steps match the
   template's #@loop/#@mid/#@test/#@right/#@left/#@done marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 16, LIM = 999;
  var PRESETS = [
    { name: 'found', a: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], t: 23 },
    { name: 'duplicates', a: [1, 3, 3, 3, 3, 7, 9], t: 3 },
    { name: 'missing', a: [2, 4, 6, 8, 10, 12], t: 7 },
    { name: 'past the end', a: [1, 2, 3], t: 9 }
  ];
  var STEPS = {
    start: { label: 'Start' }, loop: { label: 'Check space' }, mid: { label: 'Probe mid', tone: 'accent' },
    test: { label: 'Compare' }, right: { label: 'Go right' }, left: { label: 'Go left' }, done: { label: 'Done', tone: 'ok' }
  };

  function parseArray(text) {
    var nums = (String(text).match(/-?\d+/g) || []).slice(0, MAX).map(function (x) { return Math.max(-LIM, Math.min(LIM, parseInt(x, 10))); });
    return nums.sort(function (x, y) { return x - y; });
  }

  function frames(a, t) {
    var out = [], n = a.length, lo = 0, hi = n, probes = 0;
    function snap(step, note, x) { out.push(Object.assign({ step: step, note: note, l: lo, h: hi, m: -1 }, x)); }
    snap('start', 'Find the first element that is at least ' + t + ' in ' + n + ' sorted value' + (n === 1 ? '' : 's') + '. The answer is somewhere in [0, ' + n + ']; ' + n + ' would mean “no element qualifies”. So lo = 0, hi = ' + n + '.');
    while (lo < hi) {
      snap('loop', 'lo (' + lo + ') < hi (' + hi + '): ' + (hi - lo) + ' candidate position' + (hi - lo === 1 ? ' is' : 's are') + ' left, so keep going.');
      var mid = lo + Math.floor((hi - lo) / 2); probes++;
      snap('mid', 'mid = ' + lo + ' + (' + hi + ' − ' + lo + ') // 2 = ' + mid + '. Look at a[' + mid + '] = ' + a[mid] + '.', { m: mid });
      var small = a[mid] < t;
      snap('test', 'Is a[' + mid + '] = ' + a[mid] + ' < ' + t + '? ' + (small ? 'Yes: too small.' : 'No: big enough.'), { m: mid });
      if (small) {
        lo = mid + 1;
        snap('right', 'Index ' + mid + ' and everything left of it is too small (the array is sorted). lo = mid + 1 = ' + lo + '.', { m: mid });
      } else {
        hi = mid;
        snap('left', 'a[' + mid + '] could be the answer, so keep it. Everything right of it is at least as big, so nothing more to learn there. hi = mid = ' + hi + '.', { m: mid });
      }
    }
    snap('loop', 'lo == hi == ' + lo + ': no candidates are left, so the loop ends.');
    var note = lo < n && a[lo] === t ? 'a[' + lo + '] = ' + t + ', the target, and it is the first one (earlier slots are all smaller).'
      : lo < n ? 'a[' + lo + '] = ' + a[lo] + ' is bigger than ' + t + ', so ' + t + ' is not in the array. ' + lo + ' is where it would be inserted.'
      : 'Every value is smaller than ' + t + ', so the answer is n = ' + n + ': ' + t + ' would go at the very end.';
    snap('done', 'Lower bound = ' + lo + '. ' + note + ' ' + probes + ' probe' + (probes === 1 ? '' : 's') + ' for ' + n + ' values: O(log n).', { final: true });
    return out;
  }

  function stageHTML(a) {
    var cells = a.map(function (v, i) { return '<span class="va-cell"><b>' + esc(String(v)) + '</b><small>' + i + '</small></span>'; }).join('') +
      '<span class="va-cell"><b>end</b><small>' + a.length + '</small></span>';
    return '<div class="va"><div class="va-row" aria-hidden="true">' + cells + '</div>' +
      '<div class="va-ptrs" style="height:66px" aria-hidden="true"><span class="va-ptr" data-p="l">lo</span><span class="va-ptr" data-p="m" style="top:44px">mid</span><span class="va-ptr" data-p="r">hi</span></div>' +
      '<dl class="va-read"><div><dt>lo</dt><dd class="bs-lo"></dd></div><div><dt>mid</dt><dd class="bs-mid"></dd></div><div><dt>hi</dt><dd class="bs-hi"></dd></div><div><dt>candidates</dt><dd class="bs-left"></dd></div></dl></div>';
  }

  function paint(a, stage, f) {
    var n = a.length;
    if (!stage.firstChild) stage.innerHTML = stageHTML(a);
    OR.$$('.va-cell', stage).forEach(function (el, i) {
      var inside = i >= f.l && i < f.h, hit = f.final && i === f.l;
      el.className = 'va-cell' + (hit ? ' ok' : f.final || !inside ? ' gone' : ' in') + (i === f.m ? ' cur' : '');
    });
    OR.$$('.va-ptr', stage).forEach(function (p) {
      var at = p.dataset.p === 'l' ? f.l : p.dataset.p === 'm' ? f.m : f.h;
      p.style.setProperty('--i', Math.max(at, 0));
      p.classList.toggle('off', at < 0 || (p.dataset.p === 'm' && f.final));
    });
    OR.$('.bs-lo', stage).innerHTML = '<b class="num">' + f.l + '</b>';
    OR.$('.bs-mid', stage).innerHTML = f.m >= 0 && !f.final ? '<b class="num">' + f.m + '</b> <span class="faint mono">a[' + f.m + '] = ' + a[f.m] + '</span>' : '<span class="faint">none</span>';
    OR.$('.bs-hi', stage).innerHTML = '<b class="num">' + f.h + '</b>' + (f.h === n ? ' <span class="faint">(end)</span>' : '');
    OR.$('.bs-left', stage).innerHTML = '<b class="num">' + (f.h - f.l) + '</b>';
  }

  OR.viz['binary-search'] = {
    frames: frames, parseArray: parseArray, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="bs-arr">Your numbers and a target (we sort the numbers for you)</label>' +
        '<div class="va-input-row"><input class="input mono" id="bs-arr" maxlength="90" spellcheck="false" autocomplete="off" aria-label="Numbers, separated by commas">' +
        '<input class="input mono" id="bs-t" maxlength="5" inputmode="numeric" spellcheck="false" autocomplete="off" aria-label="Target" placeholder="target" style="flex:none;width:5.5rem">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-pre="' + i + '">' + p.name + '</button>'; }).join('') +
        '<span class="faint">“duplicates” shows why a lower bound lands on the first copy.</span></p></form><div class="va-player"></div>';
      var arr = OR.$('#bs-arr', host), tgt = OR.$('#bs-t', host), slot = OR.$('.va-player', host);

      function run(a, t) {
        if (player) player.destroy();
        slot.innerHTML = '';
        arr.value = a.join(', '); tgt.value = String(t);
        player = OR.player(slot, {
          frames: frames(a, t), steps: STEPS, label: 'Binary search for ' + t + ' in ' + (a.length ? a.join(', ') : 'an empty array'),
          paint: function (stage, f) { paint(a, stage, f); mark(f.step === 'start' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) {
        e.preventDefault();
        var t = parseInt(tgt.value, 10);
        run(parseArray(arr.value), isNaN(t) ? 0 : Math.max(-LIM, Math.min(LIM, t)));
      });
      host.addEventListener('click', function (e) {
        var b = e.target.closest("[data-pre]"); if (!b) return;
        var p = PRESETS[+b.dataset.pre]; run(p.a.slice(), p.t);
      });
      run(PRESETS[0].a.slice(), PRESETS[0].t);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
