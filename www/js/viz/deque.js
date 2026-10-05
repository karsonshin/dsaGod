/* Offer Ready: circular-buffer queue visualizer (queues lesson).
   Input: a capacity and a list of operations. A word enqueues, "-" dequeues. Frames are snapshots; frame steps match
   the template's #@full/#@enqueue/#@empty/#@dequeue/#@advance marks. head = oldest item, tail = next free slot. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var KMIN = 2, KMAX = 8, MAXOPS = 24;
  var PRESETS = [
    { k: 4, ops: 'a b c d e - - f g', label: 'Fills up, then wraps' },
    { k: 3, ops: 'x - - y z - w', label: 'Empty queue, wrap' },
    { k: 5, ops: 'p q r s t u', label: 'Full and refused' }
  ];
  var STEPS = {
    start: { label: 'Start' }, enqueue: { label: 'Enqueue', tone: 'accent' }, full: { label: 'Full', tone: 'hard' },
    dequeue: { label: 'Read head', tone: 'ok' }, advance: { label: 'Advance head', tone: 'ok' }, empty: { label: 'Empty', tone: 'hard' }, end: { label: 'Result' }
  };
  function q(t) { return '“' + t + '”'; }

  function frames(opsText, k) {
    var toks = opsText.split(/\s+/).filter(Boolean).slice(0, MAXOPS).map(function (t) { return t === '-' ? t : t.slice(0, 3); });
    var out = [], buf = [], head = 0, size = 0, i = -1, n, j;
    for (j = 0; j < k; j++) buf.push(null);
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, i: i, toks: toks, k: k, buf: buf.slice(), head: head, size: size, tail: (head + size) % k }, x));
    }
    snap('start', 'A fixed array of ' + k + ' slots. head = 0 is the oldest item, tail = 0 is the next free slot. Nothing is stored yet.');
    for (i = 0; i < toks.length; i++) {
      if (toks[i] !== '-') {
        if (size === k) { snap('full', 'Enqueue ' + q(toks[i]) + ': size = ' + k + ' = capacity, so there is no free slot. Refuse it.', { hit: head }); continue; }
        var t = (head + size) % k;
        buf[t] = toks[i]; size++;
        snap('enqueue', 'Enqueue ' + q(toks[i]) + ' at tail = (head + size) % ' + k + ' = ' + t + (t < head ? ': the index wrapped past the end.' : '.') + ' Size is now ' + size + '.', { hit: t });
      } else if (size === 0) {
        snap('empty', 'Dequeue: size = 0, so nothing to serve.');
      } else {
        snap('dequeue', 'Dequeue reads the oldest item, ' + q(buf[head]) + ', from slot head = ' + head + '.', { hit: head, served: buf[head] });
        n = head; head = (head + 1) % k; size--;
        snap('advance', 'head moves to (' + n + ' + 1) % ' + k + ' = ' + head + (head < n ? ', wrapping to the start' : '') + '. Slot ' + n + ' is not erased, just ignored until it is reused.', { hit: n, gone: n });
      }
    }
    i = toks.length - 1;
    var items = [];
    for (j = 0; j < size; j++) items.push(buf[(head + j) % k]);
    snap('end', items.length ? 'Waiting, oldest first: ' + items.join(', ') + '.' : 'The queue ends empty.', { final: true });
    return out;
  }

  function cell(c, cls, sub) { return '<span class="va-cell' + (cls ? ' ' + cls : '') + '"><b>' + esc(c) + '</b>' + (sub === undefined ? '' : '<small>' + sub + '</small>') + '</span>'; }

  function stageHTML(f) {
    var cells = '', k = f.k, j;
    for (j = 0; j < k; j++) cells += cell('', '', j);
    return '<div class="va" style="--n:' + k + '"><div class="va-row dq-ops" aria-hidden="true"></div>' +
      '<div class="va-row dq-ring" aria-hidden="true">' + cells + '</div>' +
      '<div class="va-ptrs" aria-hidden="true"><span class="va-ptr" data-p="h">head</span><span class="va-ptr" data-p="r">tail</span></div>' +
      '<dl class="va-read"><div><dt>order</dt><dd class="dq-order"></dd></div><div><dt>head</dt><dd class="dq-head"></dd></div>' +
      '<div><dt>size</dt><dd class="dq-size"></dd></div><div><dt>tail</dt><dd class="dq-tail"></dd></div></dl></div>';
  }

  function paint(stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(f);
    var k = f.k, occ = {}, j, order = [];
    for (j = 0; j < f.size; j++) { occ[(f.head + j) % k] = 1; order.push(f.buf[(f.head + j) % k]); }
    OR.$('.dq-ops', stage).innerHTML = f.toks.map(function (t, i) {
      return cell(t === '-' ? 'out' : t, i === f.i && f.step !== 'start' && !f.final ? 'cur' : i < f.i || f.final ? 'gone' : '', i);
    }).join('');
    OR.$$('.dq-ring .va-cell', stage).forEach(function (el, i) {
      var v = f.buf[i], cls = occ[i] ? 'in' : v !== null ? 'gone' : '';
      if (f.step === 'dequeue' && i === f.hit) cls = 'ok';
      if (f.step === 'full' && i === f.hit) cls = 'dup';
      if (f.step === 'enqueue' && i === f.hit) cls += ' cur';
      el.className = 'va-cell' + (cls ? ' ' + cls : '');
      el.firstChild.textContent = v === null ? '' : v;
    });
    OR.$$('.va-ptr', stage).forEach(function (p) { p.style.setProperty('--i', p.dataset.p === 'h' ? f.head : f.tail); });
    OR.$('.dq-order', stage).innerHTML = order.length ? '<span class="mono">' + esc(order.join(' ')) + '</span>' : '<span class="faint">empty</span>';
    OR.$('.dq-head', stage).innerHTML = '<b class="num">' + f.head + '</b>';
    OR.$('.dq-size', stage).innerHTML = '<b class="num">' + f.size + '</b> <span class="faint">of ' + k + '</span>';
    OR.$('.dq-tail', stage).innerHTML = '<b class="num">' + f.tail + '</b>';
  }

  OR.viz.deque = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = (ctx && ctx.mark) || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="dq-in">Operations: a word enqueues, “-” dequeues</label>' +
        '<div class="va-input-row"><input class="input mono" id="dq-in" maxlength="60" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0].ops) + '">' +
        '<input class="input mono dq-k" id="dq-k" type="number" min="' + KMIN + '" max="' + KMAX + '" value="' + PRESETS[0].k + '" aria-label="Capacity (' + KMIN + ' to ' + KMAX + ')">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) {
          return '<button class="chip" type="button" data-p="' + i + '">' + esc(p.label) + '</button>';
        }).join('') + '<span class="faint">Capacity is the number box (' + KMIN + ' to ' + KMAX + ').</span></p></form><div class="va-player"></div>';
      var input = OR.$('#dq-in', host), kin = OR.$('#dq-k', host), slot = OR.$('.va-player', host);

      function run() {
        var k = Math.min(KMAX, Math.max(KMIN, parseInt(kin.value, 10) || KMIN)), ops = input.value.trim();
        kin.value = k;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(ops, k), steps: STEPS, label: 'Ring queue of ' + k + ' slots on ' + q(ops),
          paint: function (stage, f) { paint(stage, f); mark(f.step === 'start' || f.step === 'end' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; input.value = p.ops; kin.value = p.k; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
