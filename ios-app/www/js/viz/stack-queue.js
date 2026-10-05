/* Offer Ready: stack-queue visualizer. Default (the stacks lesson): bracket matching with a stack.
   mount(host, { mode: 'queue' }) shows a queue instead: words are enqueued, "-" dequeues. Frames are snapshots;
   frame steps match the template's #@read/#@push/#@check/#@match/#@fail/#@end marks. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 16, PRESETS = ['([]{})', '({[)]}', '((())', '())('];
  var STEPS = {
    start: { label: 'Start' }, read: { label: 'Read' }, push: { label: 'Push', tone: 'accent' }, check: { label: 'Check top' },
    match: { label: 'Match, pop', tone: 'ok' }, fail: { label: 'Mismatch', tone: 'hard' }, end: { label: 'Result' }
  };
  var QSTEPS = {
    start: { label: 'Start' }, enqueue: { label: 'Enqueue', tone: 'accent' }, dequeue: { label: 'Dequeue', tone: 'ok' },
    empty: { label: 'Empty', tone: 'hard' }, end: { label: 'Result' }
  };
  var PAIR = { ')': '(', ']': '[', '}': '{' };
  function q(t) { return '“' + t + '”'; }

  function frames(s) {
    var out = [], st = [], done = [], i = -1;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, i: i, stack: st.slice(), done: done.slice() }, x));
    }
    snap('start', s.length ? 'The stack is empty. Read the string one character at a time.' : 'An empty string has nothing to match: it is valid.');
    for (i = 0; i < s.length; i++) {
      var ch = s[i];
      snap('read', 'i = ' + i + ': read ' + q(ch) + '.');
      if (!PAIR[ch]) {
        st.push(i);
        snap('push', q(ch) + ' is an opener. Push it and wait for its closer.', { top: st.length - 1 });
        continue;
      }
      var top = st.length ? s[st[st.length - 1]] : null;
      snap('check', top ? q(ch) + ' needs ' + q(PAIR[ch]) + ' on top. The top is ' + q(top) + '.' : q(ch) + ' needs ' + q(PAIR[ch]) + ' on top, but the stack is empty.', { want: PAIR[ch] });
      if (top !== PAIR[ch]) {
        snap('fail', top ? q(top) + ' is not ' + q(PAIR[ch]) + '. The string is invalid: return false now.' : 'Nothing is waiting for this closer. The string is invalid: return false now.',
          { bad: i, result: false, final: true });
        return out;
      }
      var j = st.pop(); done.push(j, i);
      snap('match', q(s[j]) + ' at ' + j + ' and ' + q(ch) + ' at ' + i + ' pair up. Pop.');
    }
    i = s.length - 1;
    var ok = st.length === 0;
    snap('end', ok ? 'The string ended with an empty stack: every opener found its closer. Valid.' :
      'The string ended but ' + st.length + ' opener' + (st.length > 1 ? 's are' : ' is') + ' still waiting. Invalid.', { result: ok, final: true });
    return out;
  }

  // Queue mode: tokens are words to enqueue, "-" dequeues from the front.
  function qframes(s) {
    var toks = s.split(/\s+/).filter(Boolean), out = [], items = [], i = -1;
    function snap(step, note, x) { out.push(Object.assign({ step: step, note: note, i: i, items: items.slice(), toks: toks }, x)); }
    snap('start', 'The queue is empty. Enqueue joins the back; "-" serves the front.');
    for (i = 0; i < toks.length; i++) {
      if (toks[i] !== '-') { items.push(toks[i]); snap('enqueue', 'Enqueue ' + q(toks[i]) + ' at the back.', { fresh: items.length - 1 }); }
      else if (!items.length) snap('empty', 'Dequeue on an empty queue: nothing to serve.');
      else { var f = items.shift(); snap('dequeue', 'Dequeue serves ' + q(f) + ', the oldest item. First in, first out.', { served: f }); }
    }
    i = toks.length - 1;
    snap('end', items.length ? 'Still waiting, front to back: ' + items.join(', ') + '.' : 'The queue is empty.', { final: true });
    return out;
  }

  function cell(c, cls, sub) { return '<span class="va-cell' + (cls ? ' ' + cls : '') + '"><b>' + esc(c) + '</b>' + (sub === undefined ? '' : '<small>' + sub + '</small>') + '</span>'; }

  function stageHTML(s, queue) {
    var inRow = queue ? '' : '<div class="va-row" aria-hidden="true">' + s.split('').map(function (c, i) { return cell(c, '', i); }).join('') + '</div>';
    if (queue) inRow = '<div class="va-row sq-in" aria-hidden="true"></div>';
    return '<div class="va" style="--n:' + s.length + '">' + inRow + '<div class="sq-wrap"><span class="sq-end">' + (queue ? 'front' : 'bottom') +
      '</span><div class="va-row sq-row' + (queue ? ' q' : '') + '" aria-label="' + (queue ? 'queue' : 'stack') + '"></div><span class="sq-end">' + (queue ? 'back' : 'top') + '</span></div>' +
      '<dl class="va-read"><div><dt>' + (queue ? 'queue' : 'stack') + '</dt><dd class="sq-list"></dd></div>' + (queue ? '' : '<div><dt>result</dt><dd class="sq-res"></dd></div>') + '</dl></div>';
  }

  function paint(s, stage, f, queue) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(s, queue);
    var row = OR.$('.sq-row', stage), list = OR.$('.sq-list', stage);
    if (queue) {
      OR.$('.sq-in', stage).innerHTML = f.toks.map(function (t, i) { return cell(t, i < f.i || (i === f.i && f.step !== 'start') ? (i === f.i ? 'cur' : 'gone') : '', i); }).join('');
      row.innerHTML = f.items.length ? f.items.map(function (t, k) { return cell(t, k === f.fresh ? 'in cur' : 'in'); }).join('') : '<span class="sq-empty">empty</span>';
      list.innerHTML = f.items.length ? esc(f.items.join(', ')) : '<span class="faint">empty</span>';
      return;
    }
    var matched = {}; f.done.forEach(function (k) { matched[k] = 1; });
    var onStack = {}; f.stack.forEach(function (k) { onStack[k] = 1; });
    OR.$$('.sq-in .va-cell, .va > .va-row .va-cell', stage).forEach(function (el, i) {
      el.className = 'va-cell' + (matched[i] ? ' ok' : onStack[i] ? ' in' : '') + (f.bad === i ? ' dup' : '') + (!f.final && i === f.i ? ' cur' : '');
    });
    var hot = f.step === 'match' ? 'ok' : f.step === 'fail' ? 'dup' : '';
    row.innerHTML = f.stack.length ? f.stack.map(function (k, n) {
      var isTop = n === f.stack.length - 1;
      return cell(s[k], 'in' + (isTop && f.step === 'push' ? ' cur' : '') + (isTop && f.step === 'check' ? ' cur' : '') + (isTop && hot ? ' ' + hot : ''), k);
    }).join('') : '<span class="sq-empty">empty</span>';
    list.innerHTML = f.stack.length ? '<span class="mono">' + esc(f.stack.map(function (k) { return s[k]; }).join(' ')) + '</span>' : '<span class="faint">empty</span>';
    OR.$('.sq-res', stage).innerHTML = f.result === undefined ? '<span class="faint">not yet</span>' :
      '<b class="num" style="color:var(' + (f.result ? '--ok' : '--hard') + ')">' + (f.result ? 'valid' : 'invalid') + '</b>';
  }

  OR.viz['stack-queue'] = {
    frames: frames, qframes: qframes, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var queue = ctx && ctx.mode === 'queue', player = null, mark = (ctx && ctx.mark) || function () {};
      var presets = queue ? ['a b c - d - -', 'x - y z - -', 'p q r s'] : PRESETS;
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="sq-in">' + (queue ? 'Words to enqueue, “-” to dequeue' : 'Brackets to check') + '</label>' +
        '<div class="va-input-row"><input class="input mono" id="sq-in" maxlength="' + (queue ? 40 : MAX) + '" spellcheck="false" autocomplete="off" value="' + esc(presets[0]) + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + presets.map(function (p) { return '<button class="chip" type="button" data-s="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') +
        (queue ? '' : '<span class="faint">' + q('({[)]}') + ' has every bracket but the wrong order.</span>') + '</p></form><div class="va-player"></div>';
      var input = OR.$('#sq-in', host), slot = OR.$('.va-player', host);

      function run(s) {
        s = queue ? s.slice(0, 40) : s.replace(/[^()\[\]{}]/g, '').slice(0, MAX);
        if (!queue) input.value = s;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: queue ? qframes(s) : frames(s), steps: queue ? QSTEPS : STEPS, label: (queue ? 'Queue on ' : 'Bracket matching on ') + q(s),
          paint: function (stage, f) { paint(s, stage, f, queue); mark(f.step === 'start' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]'); if (!b) return;
        input.value = b.dataset.s; run(b.dataset.s);
      });
      run(presets[0]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
