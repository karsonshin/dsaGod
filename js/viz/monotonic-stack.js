/* Offer Ready: monotonic-stack visualizer (the lesson's template: next greater value for every position).
   Each frame is a snapshot, so stepping back repaints an earlier frame. Frame steps match the template's
   #@read/#@check/#@pop/#@push/#@end marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 12, PRESETS = ['2 1 2 4 3', '73 74 75 71 69 72 76 73', '5 4 3 2 1', '1 2 3 4 5', '3 3 3'];
  var STEPS = {
    start: { label: 'Start' }, read: { label: 'Read' }, check: { label: 'Compare top' }, pop: { label: 'Pop, answer', tone: 'ok' },
    push: { label: 'Push', tone: 'accent' }, end: { label: 'Leftovers' }
  };

  function parse(text) {
    return String(text).split(/[\s,]+/).filter(Boolean).map(function (t) { return Math.max(0, Math.min(99, parseInt(t, 10))); })
      .filter(function (n) { return isFinite(n); }).slice(0, MAX);
  }

  function frames(nums) {
    var out = [], st = [], res = nums.map(function () { return null; }), i = -1;
    function snap(step, note, x) { out.push(Object.assign({ step: step, note: note, i: i, stack: st.slice(), res: res.slice() }, x)); }
    snap('start', nums.length ? 'The stack is empty and every answer is unknown (?). Walk left to right.' : 'An empty list has no answers.', nums.length ? {} : { final: true });
    for (i = 0; i < nums.length; i++) {
      var x = nums[i];
      snap('read', 'i = ' + i + ': read ' + x + '. Let it resolve everything on the stack that it beats.');
      for (;;) {
        if (!st.length) { snap('check', 'The stack is empty, so there is nothing for ' + x + ' to beat.', { stop: true }); break; }
        var t = st[st.length - 1];
        if (nums[t] < x) {
          snap('check', 'Top is index ' + t + ' (' + nums[t] + '). ' + nums[t] + ' < ' + x + ', so ' + x + ' is its next greater.', { top: t });
          res[t] = x; st.pop();
          snap('pop', 'Pop index ' + t + ': its answer is ' + x + '. The stack stays in non-increasing order.', { fresh: t });
        } else {
          snap('check', 'Top is index ' + t + ' (' + nums[t] + '). ' + nums[t] + ' is not less than ' + x + ', so stop popping.', { top: t, stop: true });
          break;
        }
      }
      st.push(i);
      snap('push', 'Push index ' + i + ' (' + x + '). It now waits for something bigger.');
    }
    if (nums.length) {
      i = nums.length - 1;
      var left = st.slice();
      left.forEach(function (k) { res[k] = -1; });
      snap('end', left.length ? 'Indices ' + left.join(', ') + ' never met a bigger value, so their answer is -1. Each index was pushed once and popped at most once: O(n).' :
        'Done. Each index was pushed once and popped at most once: O(n).', { final: true });
    }
    return out;
  }

  function cell(c, cls, sub) { return '<span class="va-cell' + (cls ? ' ' + cls : '') + '"><b>' + esc(c) + '</b>' + (sub === undefined ? '' : '<small>' + sub + '</small>') + '</span>'; }

  function stageHTML(nums) {
    return '<div class="va" style="--n:' + nums.length + '">' +
      '<div class="ms-line"><span class="ms-lab">nums</span><div class="va-row ms-in" aria-hidden="true"></div></div>' +
      '<div class="ms-line"><span class="ms-lab">stack<br><small>bottom to top</small></span><div class="va-row ms-st" aria-label="stack of indices"></div></div>' +
      '<div class="ms-line"><span class="ms-lab">answer</span><div class="va-row ms-out" aria-hidden="true"></div></div>' +
      '<dl class="va-read"><div><dt>stack</dt><dd class="ms-list"></dd></div></dl></div>';
  }

  function paint(nums, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(nums);
    var onStack = {}; f.stack.forEach(function (k) { onStack[k] = 1; });
    OR.$('.ms-in', stage).innerHTML = nums.map(function (v, k) {
      var cls = f.res[k] !== null ? 'ok' : onStack[k] ? 'in' : '';
      return cell(v, cls + (!f.final && k === f.i ? ' cur' : ''), k);
    }).join('');
    OR.$('.ms-st', stage).innerHTML = f.stack.length ? f.stack.map(function (k, n) {
      var isTop = n === f.stack.length - 1;
      return cell(nums[k], 'in' + (isTop && f.top === k ? (f.stop ? ' dup' : ' cur') : ''), k);
    }).join('') : '<span class="ms-empty">empty</span>';
    OR.$('.ms-out', stage).innerHTML = nums.map(function (v, k) {
      return f.res[k] === null ? cell('?', 'gone') : cell(f.res[k], 'ok' + (k === f.fresh ? ' cur' : ''));
    }).join('');
    OR.$('.ms-list', stage).innerHTML = f.stack.length ? '<span class="mono">' + esc(f.stack.map(function (k) { return nums[k]; }).join(' ≥ ')) + '</span>' : '<span class="faint">empty</span>';
  }

  OR.viz['monotonic-stack'] = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = (ctx && ctx.mark) || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="ms-in">Your numbers (up to ' + MAX + ', 0 to 99)</label>' +
        '<div class="va-input-row"><input class="input mono" id="ms-in" maxlength="48" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p + '</button>'; }).join('') +
        '<span class="faint">Ties stay on the stack, because the rule is strictly less.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#ms-in', host), slot = OR.$('.va-player', host);

      function run(text) {
        var nums = parse(text);
        input.value = nums.join(' ');
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(nums), steps: STEPS, label: 'Monotonic stack on ' + nums.join(', '),
          paint: function (stage, f) { paint(nums, stage, f); mark(f.step === 'start' ? null : f.step); }
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
