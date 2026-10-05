/* Offer Ready: Kadane visualizer (maximum subarray, the lesson's template).
   Each frame is a snapshot of the run, so stepping back is just painting an earlier frame. Frame steps
   match the template's #@check/#@extend/#@restart/#@record marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 12, PRESETS = ['-2 1 -3 4 -1 2 1 -5 4', '-3 -1 -2', '5 -9 6 4 -1 3', '2 -1 2 -1 2'];
  var STEPS = {
    start: { label: 'Start' }, check: { label: 'Is the run worth keeping?' }, extend: { label: 'Extend', tone: 'accent' },
    restart: { label: 'Restart', tone: 'hard' }, record: { label: 'Record', tone: 'ok' }, done: { label: 'Done' }
  };

  function parse(text) {
    var out = (String(text).match(/-?\d+/g) || []).slice(0, MAX).map(function (t) { return Math.max(-99, Math.min(99, parseInt(t, 10))); });
    return out;
  }
  function range(a, l, r) { return '[' + l + ', ' + r + '] = ' + a.slice(l, r + 1).join(' + ').replace(/\+ -/g, '- '); }

  function frames(a) {
    var out = [], cur = 0, best = 0, s = 0, bl = 0, br = 0, i = 0, ends = [], bests = [], kinds = [];
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, i: i, s: s, cur: cur, best: best, bl: bl, br: br,
        ends: ends.slice(), bests: bests.slice(), kinds: kinds.slice() }, x));
    }
    if (!a.length) { snap('done', 'Type at least one whole number to run the algorithm.', { final: true, i: -1 }); return out; }
    cur = best = a[0]; ends.push(cur); bests.push(best); kinds.push('r');
    snap('start', 'The first element is the only subarray ending at index 0, so cur = best = ' + a[0] + '.');
    for (i = 1; i < a.length; i++) {
      var x = a[i], prev = cur;
      snap('check', 'Index ' + i + ', x = ' + x + '. The best run ending at ' + (i - 1) + ' has sum ' + prev + '. ' +
        (prev > 0 ? 'It’s positive, so it helps: extend it.' : 'It isn’t positive, so it can only drag x down: restart at x.'), { cur: prev });
      if (prev > 0) {
        cur = prev + x; kinds.push('e'); ends.push(cur);
        snap('extend', 'cur = ' + prev + ' + ' + x + ' = ' + cur + '. The run now starts at index ' + s + '.');
      } else {
        cur = x; s = i; kinds.push('r'); ends.push(cur);
        snap('restart', 'cur = ' + x + ' (the old run is dropped). The run now starts at index ' + i + '.');
      }
      var gain = cur > best;
      if (gain) { best = cur; bl = s; br = i; }
      bests.push(best);
      snap('record', gain ? 'cur = ' + cur + ' beats the old best. best = ' + best + ', the subarray ' + range(a, bl, br) + '.'
        : 'cur = ' + cur + ' doesn’t beat best = ' + best + '. best stays.');
    }
    i = a.length - 1;
    snap('done', 'Done in one pass. The maximum subarray sum is ' + best + ', from ' + range(a, bl, br) + '.' +
      (a.every(function (v) { return v < 0; }) ? ' Every number is negative, so the best subarray is the single largest element.' : '') +
      ' O(n) time, O(1) space.', { final: true });
    return out;
  }

  function lab(t) { return '<p class="faint mono" style="margin:0;font-size:var(--text-2xs)">' + t + '</p>'; }

  function stageHTML(a) {
    function row(f) { return '<div class="va-row" aria-hidden="true">' + a.map(function (v, k) { return f(v, k); }).join('') + '</div>'; }
    return '<div class="va" style="--n:' + a.length + '">' + lab('nums') +
      row(function (v, k) { return '<span class="va-cell kd-num"><b>' + esc(v) + '</b><small>' + k + '</small></span>'; }) +
      '<div class="va-ptrs" aria-hidden="true"><span class="va-ptr" data-p="l">start</span><span class="va-ptr" data-p="r">i</span></div>' +
      lab('cur: best sum of a run ending here') + row(function () { return '<span class="va-cell kd-end"><b></b></span>'; }) +
      lab('best: largest cur so far') + row(function () { return '<span class="va-cell kd-best"><b></b></span>'; }) +
      '<dl class="va-read"><div><dt>cur</dt><dd class="kd-cur"></dd></div><div><dt>best</dt><dd class="kd-bsum"></dd></div></dl></div>';
  }

  function paint(a, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(a);
    var ended = f.ends.length; // the index under test isn't in ends until its extend/restart step
    OR.$$('.kd-num', stage).forEach(function (el, k) {
      var inRun = !f.final && k >= f.s && k <= f.i;
      var inBest = f.final ? k >= f.bl && k <= f.br : false;
      el.className = 'va-cell kd-num' + (f.final ? (inBest ? ' ok' : '') : (inRun ? ' in' : '')) + (!f.final && k === f.i ? ' cur' : '') +
        (k >= f.bl && k <= f.br && f.bests.length ? ' best' : '');
    });
    OR.$$('.kd-end', stage).forEach(function (el, k) {
      var has = k < ended;
      el.firstChild.textContent = has ? f.ends[k] : '';
      el.className = 'va-cell kd-end' + (has ? (f.kinds[k] === 'e' ? ' in' : ' dup') : '');
    });
    OR.$$('.kd-best', stage).forEach(function (el, k) {
      var has = k < f.bests.length;
      el.firstChild.textContent = has ? f.bests[k] : '';
      el.className = 'va-cell kd-best' + (has ? (k === 0 || f.bests[k] > f.bests[k - 1] ? ' ok' : '') : '');
    });
    OR.$$('.va-ptr', stage).forEach(function (p) {
      var at = p.dataset.p === 'l' ? f.s : f.i;
      p.style.setProperty('--i', Math.max(at, 0));
      p.classList.toggle('off', at < 0 || at >= a.length || !!f.final);
    });
    OR.$('.kd-cur', stage).innerHTML = '<b class="num">' + f.cur + '</b> <span class="faint mono">run ' + (f.s <= f.i ? '[' + f.s + ', ' + f.i + ']' : '') + '</span>';
    OR.$('.kd-bsum', stage).innerHTML = '<b class="num">' + f.best + '</b> <span class="faint mono">[' + f.bl + ', ' + f.br + ']</span>';
  }

  OR.viz['kadane'] = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="kd-in">Your numbers (up to ' + MAX + ', separated by spaces or commas)</label>' +
        '<div class="va-input-row"><input class="input mono" id="kd-in" maxlength="60" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p + '</button>'; }).join('') +
        '<span class="faint">The all-negative one catches anyone who starts best at 0.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#kd-in', host), slot = OR.$('.va-player', host);

      function run(text) {
        var a = parse(text);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(a), steps: STEPS, label: 'Kadane on ' + a.join(', '),
          paint: function (stage, f) { paint(a, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
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
