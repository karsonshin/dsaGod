/* Offer Ready: sliding-window visualizer (longest substring without a repeat, the lesson's template).
   Each frame is a snapshot of the run, so stepping back is just painting an earlier frame. Frame steps
   match the template's #@expand/#@check/#@shrink/#@record marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 16, PRESETS = ['abcabcbb', 'pwwkew', 'dvdf', 'bbbbb'];
  var STEPS = {
    start: { label: 'Start' }, expand: { label: 'Grow right', tone: 'accent' }, check: { label: 'Rule broke', tone: 'hard' },
    shrink: { label: 'Shrink left' }, record: { label: 'Record', tone: 'ok' }, done: { label: 'Done' }
  };
  function show(c) { return c === ' ' ? '␣' : c; }
  function q(t) { return '“' + t + '”'; }

  function frames(s) {
    var out = [], counts = {}, order = [], left = 0, right = -1, best = 0, bl = 0, br = -1;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, l: left, r: right, best: best, bl: bl, br: br,
        counts: order.filter(function (c) { return counts[c]; }).map(function (c) { return [c, counts[c]]; }) }, x));
    }
    snap('start', 'The window is empty: left = 0, best = 0. Walk right across the string.');
    for (right = 0; right < s.length; right++) {
      var ch = s[right];
      if (!(ch in counts)) { counts[ch] = 0; order.push(ch); }
      counts[ch]++;
      snap('expand', 'right = ' + right + ': take ' + q(show(ch)) + ' in. counts[' + q(show(ch)) + '] = ' + counts[ch] + '.');
      if (counts[ch] > 1) {
        snap('check', q(show(ch)) + ' is in the window twice, so the rule broke. Shrink until it appears once.', { dup: [s.indexOf(ch, left), right] });
        while (counts[ch] > 1) {
          var gone = s[left]; counts[gone]--; left++;
          snap('shrink', 'Drop ' + q(show(gone)) + ' from the left: left = ' + left + '.' + (counts[ch] > 1 ? '' : ' The rule holds again.'), { gone: left - 1 });
        }
      }
      var len = right - left + 1, win = q(s.slice(left, right + 1).split('').map(show).join(''));
      if (len > best) { best = len; bl = left; br = right; snap('record', win + ' is valid, length ' + len + '. New best.'); }
      else snap('record', win + ' is valid, length ' + len + '. best stays ' + best + '.');
    }
    right = s.length - 1;
    snap('done', s.length ? 'Done in one pass. The longest window without a repeat is ' + q(s.slice(bl, br + 1).split('').map(show).join('')) + ', length ' + best + '. Each index entered once and left at most once: O(n).'
      : 'An empty string has no window: the answer is 0.', { final: true });
    return out;
  }

  function stageHTML(s) {
    var cells = s.split('').map(function (c, i) {
      return '<span class="va-cell"><b>' + esc(show(c)) + '</b><small>' + i + '</small></span>';
    }).join('');
    return '<div class="va" style="--n:' + s.length + '"><div class="va-row" aria-hidden="true">' + cells + '</div>' +
      '<div class="va-ptrs" aria-hidden="true"><span class="va-ptr" data-p="l">left</span><span class="va-ptr" data-p="r">right</span></div>' +
      '<dl class="va-read"><div><dt>Window</dt><dd class="sw-win"></dd></div><div><dt>counts</dt><dd class="sw-counts"></dd></div><div><dt>best</dt><dd class="sw-best"></dd></div></dl></div>';
  }

  function paint(s, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(s);
    OR.$$('.va-cell', stage).forEach(function (el, i) {
      var inWin = f.final ? i >= f.bl && i <= f.br : i >= f.l && i <= f.r;
      el.className = 'va-cell' + (inWin ? (f.final ? ' ok' : ' in') : '') + (f.dup && f.dup.indexOf(i) >= 0 ? ' dup' : '') +
        (!f.final && i === f.r ? ' cur' : '') + (i === f.gone ? ' gone' : '') + (i >= f.bl && i <= f.br ? ' best' : '');
    });
    OR.$$('.va-ptr', stage).forEach(function (p) {
      var at = p.dataset.p === 'l' ? f.l : f.r;
      p.style.setProperty('--i', Math.max(at, 0));
      p.classList.toggle('off', at < 0 || at >= s.length || !!f.final);
    });
    OR.$('.sw-win', stage).innerHTML = f.r < f.l ? '<span class="faint">empty</span>'
      : '<span class="mono">[' + f.l + ', ' + f.r + ']</span> ' + esc(q(s.slice(f.l, f.r + 1).split('').map(show).join(''))) + ' <span class="faint">length ' + (f.r - f.l + 1) + '</span>';
    OR.$('.sw-counts', stage).innerHTML = f.counts.length ? f.counts.map(function (e) {
      return '<span class="va-kv' + (e[1] > 1 ? ' bad' : '') + '">' + esc(show(e[0])) + ' <b>' + e[1] + '</b></span>';
    }).join('') : '<span class="faint">{}</span>';
    OR.$('.sw-best', stage).innerHTML = '<b class="num">' + f.best + '</b>' + (f.br >= 0 ? ' <span class="faint mono">[' + f.bl + ', ' + f.br + ']</span>' : '');
  }

  OR.viz['sliding-window'] = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="sw-in">Your string</label>' +
        '<div class="va-input-row"><input class="input mono" id="sw-in" maxlength="' + MAX + '" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p + '</button>'; }).join('') +
        '<span class="faint">' + q('dvdf') + ' catches anyone who jumps left instead of shrinking.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#sw-in', host), slot = OR.$('.va-player', host);

      function run(s) {
        s = s.slice(0, MAX);
        if (player) player.destroy();
        slot.innerHTML = '';
        var F = frames(s);
        player = OR.player(slot, {
          frames: F, steps: STEPS, label: 'Sliding window on ' + q(s),
          paint: function (stage, f) { paint(s, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
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
