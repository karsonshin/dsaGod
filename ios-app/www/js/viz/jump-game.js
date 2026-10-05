/* Offer Ready: jump-game visualizer (farthest reach, with range ends for Jump Game II).
   Marks: scan / stuck / reach / jump / done, matching the lesson template. Each frame is a snapshot,
   so stepping back repaints an earlier one. frames(nums, ii) is the pure builder; paint/mount only draw it. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 14, PRESETS = ['2 3 1 1 4', '3 2 1 0 4', '1 1 1 1 1', '4 1 1 3 1 1 1', '0'];
  var STEPS = {
    start: { label: 'Start' }, scan: { label: 'Visit index i', tone: 'accent' }, stuck: { label: 'Stuck', tone: 'hard' },
    reach: { label: 'Update farthest', tone: 'accent' }, jump: { label: 'Range ends: jump', tone: 'ok' }, done: { label: 'Done' }
  };

  function parse(text) {
    return (String(text).match(/\d+/g) || []).slice(0, MAX).map(function (t) { return Math.min(9, parseInt(t, 10)); });
  }

  // ii = false: Jump Game (can we reach the last index?). ii = true: Jump Game II (fewest jumps, range ends).
  function frames(a, ii) {
    var out = [], n = a.length, far = 0, end = 0, jumps = 0, i = -1;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, n: n, i: i, far: far, end: end, jumps: jumps, ii: ii }, x));
    }
    if (!n) { snap('done', 'Type at least one digit, like 2 3 1 1 4.', { final: true, ok: false }); return out; }
    snap('start', ii ? 'far = 0 (the farthest index any visited cell can reach), end = 0 (the last index the current jump covers), jumps = 0.'
      : 'far = 0: before scanning, only index 0 is known to be reachable.');
    var dead = false;
    for (i = 0; i < n - 1; i++) {
      snap('scan', 'Visit index ' + i + ' (value ' + a[i] + ').');
      if (i > far) {
        snap('stuck', 'Index ' + i + ' is beyond far = ' + far + ': nothing before it can reach here, so the last index is unreachable.', { bad: true });
        dead = true; break;
      }
      var old = far;
      far = Math.max(far, i + a[i]);
      snap('reach', 'i + nums[i] = ' + i + ' + ' + a[i] + ' = ' + (i + a[i]) + '. ' + (far > old ? 'far grows from ' + old + ' to ' + far + '.' : 'far stays ' + far + '.'));
      if (ii && i === end) {
        jumps++; end = far;
        snap('jump', 'i reached the end of the current jump range. Take one more jump (jumps = ' + jumps + ') and its range now ends at the farthest seen, end = ' + end + '.');
      }
    }
    var ok = !dead && far >= n - 1;
    if (!dead) i = n - 1;
    snap('done', ok ? (ii ? 'Last index reached with ' + jumps + ' jump' + (jumps === 1 ? '' : 's') + '. Each cell was visited once: O(n) time, O(1) space.'
      : 'far = ' + far + ' covers the last index (' + (n - 1) + '), so yes. One pass, O(n) time, O(1) space.')
      : 'Cannot reach index ' + (n - 1) + (dead ? '.' : ': far only got to ' + far + '.') + (ii ? ' Answer: -1.' : ' Answer: false.'),
      { final: true, ok: ok, bad: !ok });
    return out;
  }

  function paint(stage, f, ii) {
    var cells = '', tags = '', k;
    for (k = 0; k < f.n; k++) {
      var inRange = k <= f.far, cur = f.i === k && !f.final;
      var cls = 'va-cell' + (f.final ? (f.ok && k <= f.far ? ' ok' : (k === f.i && f.bad ? ' dup' : '')) : (cur && f.bad ? ' dup' : inRange ? ' in' : '')) +
        (cur && !f.bad ? ' cur' : '') + (ii && !f.final && k === f.end ? ' best' : '');
      cells += '<span class="' + cls + '"><b>' + esc(f.nums[k]) + '</b><small>' + k + '</small></span>';
      tags += '<span class="jg-tag"><span class="i' + (cur ? ' on' : '') + '">i</span><span class="f' + (k === f.far ? ' on' : '') + '">far</span>' +
        '<span class="e' + (ii && k === f.end && !f.final ? ' on' : '') + '">end</span></span>';
    }
    stage.innerHTML = '<div class="va jg"><p class="jg-lab faint">jump lengths (shaded: reachable so far, outline: current i' + (ii ? ', underline: end of the current jump range' : '') + ')</p>' +
      '<div class="jg-wrap"><div class="va-row" aria-hidden="true">' + cells + '</div><div class="jg-tags" aria-hidden="true">' + tags + '</div></div>' +
      '<dl class="va-read"><div><dt>i</dt><dd><b class="num">' + (f.i < 0 ? '-' : f.i) + '</b></dd></div>' +
      '<div><dt>farthest</dt><dd><b class="num">' + f.far + '</b></dd></div>' +
      (ii ? '<div><dt>range end</dt><dd><b class="num">' + f.end + '</b></dd></div><div><dt>jumps</dt><dd><b class="num">' + f.jumps + '</b></dd></div>' : '') +
      (f.final ? '<div><dt>' + (ii ? 'answer' : 'can reach last?') + '</dt><dd><b class="num jg-verdict ' + (f.ok ? 'ok' : 'bad') + '">' +
        (ii ? (f.ok ? f.jumps : -1) : (f.ok ? 'true' : 'false')) + '</b></dd></div>' : '') + '</dl></div>';
  }

  OR.viz['jump-game'] = {
    frames: frames, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="jg-in">Jump lengths (up to ' + MAX + ' digits 0 to 9)</label>' +
        '<div class="va-input-row"><input class="input mono" id="jg-in" spellcheck="false" autocomplete="off" aria-label="Jump lengths, such as 2 3 1 1 4" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<div class="jg-toggles"><label class="jg-sw"><input type="checkbox" id="jg-ii"> Jump Game II: count jumps with range ends</label></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, k) { return '<button class="chip" type="button" data-k="' + k + '">' + esc(p) + '</button>'; }).join('') +
        '<span class="faint">3 2 1 0 4 is the trap: every path dies on the 0.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#jg-in', host), ii = OR.$('#jg-ii', host), slot = OR.$('.va-player', host);

      function run() {
        var nums = parse(input.value), fr = frames(nums, ii.checked), mode = ii.checked;
        fr.forEach(function (f) { f.nums = nums; });
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: fr, steps: STEPS, label: (mode ? 'Jump Game II: ' : 'Jump Game: ') + nums.join(' '),
          paint: function (stg, f) { paint(stg, f, mode); mark(f.step === 'start' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      ii.addEventListener('change', run);
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-k]'); if (!b) return;
        input.value = PRESETS[b.dataset.k]; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
