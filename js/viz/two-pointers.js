/* Offer Ready: two-pointers visualizer. Two modes:
   "Pair sum" (opposite ends on a sorted array; step names match the template's #@compare/#@found/#@moveL/#@moveR marks) and
   "Dedupe" (read/write pointers; its code is in the lesson's Variations, so no template line lights).
   Each frame is a snapshot, so stepping back is just painting an earlier frame. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, MAX = 12;
  var STEPS = {
    pair: { start: { label: 'Start' }, compare: { label: 'Compare ends', tone: 'accent' }, moveL: { label: 'Move left in' }, moveR: { label: 'Move right in' }, found: { label: 'Found', tone: 'ok' }, done: { label: 'Done' } },
    dedupe: { start: { label: 'Start' }, read: { label: 'Read', tone: 'accent' }, skip: { label: 'Duplicate', tone: 'hard' }, write: { label: 'Write', tone: 'ok' }, done: { label: 'Done' } }
  };
  var PRESETS = {
    pair: [{ a: [1, 2, 4, 7, 11, 15], t: 15 }, { a: [2, 3, 5, 8], t: 4 }, { a: [-4, -1, 0, 3, 10], t: 6 }],
    dedupe: [{ a: [1, 1, 2, 2, 2, 3, 4, 4] }, { a: [5, 5, 5, 5] }, { a: [1, 2, 3] }]
  };
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

  function pairFrames(a, t) {
    var out = [], l = 0, r = a.length - 1, n = a.length;
    function snap(step, note, x) {
      x = x || {};
      var c = a.map(function (_, i) {
        var s = (i < l || i > r) ? 'gone' : 'in';
        if (x.found && (i === l || i === r)) return 'ok cur';
        return s + (!x.final && (i === l || i === r) ? ' cur' : '');
      });
      out.push(Object.assign({ step: step, note: note, a: a, c: c, l: l, r: r, hide: false,
        read: kv('target', '<b class="num">' + t + '</b>') + kv('sum', x.sum === undefined ? '<span class="faint">none yet</span>' : '<b class="num">' + x.sum + '</b>') +
          kv('alive', '<span class="mono">[' + l + ', ' + r + ']</span>') }, x));
    }
    snap('start', 'Sorted array, target ' + t + '. One pointer at each end: left = 0, right = ' + (n - 1) + '.');
    while (l < r) {
      var s = a[l] + a[r], rel = s === t ? 'equals' : s < t ? 'is below' : 'is above';
      snap('compare', a[l] + ' + ' + a[r] + ' = ' + s + ', which ' + rel + ' the target ' + t + '.', { sum: s });
      if (s === t) { snap('found', 'Found it: positions ' + l + ' and ' + r + ' (' + a[l] + ' + ' + a[r] + ' = ' + t + '). Every step discarded an element, so at most n steps.', { sum: s, found: true, final: true }); return out; }
      if (s < t) { l++; snap('moveL', 'Too small. ' + a[l - 1] + ' is too small even with the largest remaining partner, so left moves in to ' + l + '.', { sum: s, gone: l - 1 }); }
      else { r--; snap('moveR', 'Too big. ' + a[r + 1] + ' is too big even with the smallest remaining partner, so right moves in to ' + r + '.', { sum: s, gone: r + 1 }); }
    }
    snap('done', n < 2 ? 'Fewer than two elements: no pair.' : 'The pointers met with no match. Every pair was ruled out without being tried: no pair adds to ' + t + '.', { final: true });
    return out;
  }

  function dedupeFrames(src) {
    var a = src.slice(), n = a.length, w = Math.min(1, n), out = [];
    function snap(step, note, r, x) {
      var c = a.map(function (_, i) { return (i < w ? 'ok' : '') + (r === i ? ' cur' : '') + (x && x.dup === i ? ' dup' : ''); });
      out.push(Object.assign({ step: step, note: note, a: a.slice(), c: c, l: w, r: r === undefined ? -1 : r, hide: step === 'done',
        read: kv('kept', '<span class="mono">[' + a.slice(0, w).join(', ') + ']</span>') + kv('length', '<b class="num">' + w + '</b>') }, x));
    }
    snap('start', n ? 'Sorted array. The first element is always kept, so write = 1. The read pointer will scan the rest.' : 'An empty array keeps nothing: length 0.', 0);
    for (var r = 1; r < n; r++) {
      snap('read', 'read = ' + r + ': compare ' + a[r] + ' with the last kept value, ' + a[w - 1] + '.', r);
      if (a[r] === a[w - 1]) snap('skip', a[r] + ' repeats the last kept value, so skip it. write stays ' + w + '.', r, { dup: r });
      else { a[w] = a[r]; w++; snap('write', a[r] + ' is new: copy it to slot ' + (w - 1) + ' and write moves to ' + w + '.', r); }
    }
    snap('done', 'Done in one pass. The first ' + w + ' slots hold the distinct values; whatever follows doesn’t matter. O(n) time, O(1) space.', undefined, { final: true });
    return out;
  }

  function stageHTML(n, labels) {
    var cells = '';
    for (var i = 0; i < n; i++) cells += '<span class="va-cell"><b></b><small>' + i + '</small></span>';
    return '<div class="va" style="--n:' + n + '"><div class="va-row" aria-hidden="true">' + cells + '</div>' +
      '<div class="va-ptrs" aria-hidden="true"><span class="va-ptr" data-p="l">' + labels[0] + '</span><span class="va-ptr" data-p="r">' + labels[1] + '</span></div>' +
      '<dl class="va-read"></dl></div>';
  }

  function paint(labels, stage, f) {
    var n = f.a.length;
    if (!stage.firstChild) stage.innerHTML = stageHTML(n, labels);
    OR.$$('.va-cell', stage).forEach(function (el, i) {
      el.className = 'va-cell ' + f.c[i] + (i === f.gone ? ' gone' : '');
      el.firstChild.textContent = f.a[i];
    });
    OR.$$('.va-ptr', stage).forEach(function (p) {
      var at = p.dataset.p === 'l' ? f.l : f.r;
      p.style.setProperty('--i', Math.max(Math.min(at, n - 1), 0));
      p.classList.toggle('off', at < 0 || at >= n || f.hide);
    });
    OR.$('.va-read', stage).innerHTML = f.read;
  }

  function parse(text) {
    return text.split(/[\s,]+/).filter(Boolean).map(Number).filter(function (x) { return isFinite(x) && x === Math.round(x); })
      .slice(0, MAX).sort(function (x, y) { return x - y; });
  }

  OR.viz['two-pointers'] = {
    frames: { pair: pairFrames, dedupe: dedupeFrames }, // exposed for checks
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'pair';
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="tp-in">Your numbers (up to ' + MAX + ', sorted for you)</label>' +
        '<div class="va-input-row"><input class="input mono" id="tp-in" spellcheck="false" autocomplete="off">' +
        '<input class="input mono" id="tp-t" inputmode="numeric" aria-label="Target" size="4" style="max-width:5rem">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets tp-modes"><span class="faint">Mode</span> <button class="chip" type="button" data-mode="pair">Pair sum</button> <button class="chip" type="button" data-mode="dedupe">Dedupe</button></p>' +
        '<p class="va-presets tp-presets"></p></form><div class="va-player"></div>';
      var input = OR.$('#tp-in', host), tgt = OR.$('#tp-t', host), slot = OR.$('.va-player', host), presets = OR.$('.tp-presets', host);

      function run() {
        var a = parse(input.value), t = parseInt(tgt.value, 10);
        if (isNaN(t)) t = 0;
        if (player) player.destroy();
        slot.innerHTML = '';
        var pair = mode === 'pair', F = pair ? pairFrames(a, t) : dedupeFrames(a), labels = pair ? ['left', 'right'] : ['write', 'read'];
        player = OR.player(slot, {
          frames: F, steps: STEPS[mode], label: (pair ? 'Pair sum on [' : 'Dedupe on [') + a.join(', ') + ']',
          paint: function (stage, f) { paint(labels, stage, f); mark(pair && f.step !== 'start' && f.step !== 'done' ? f.step : null); }
        });
      }
      function setMode(m, p) {
        mode = m;
        OR.$$('[data-mode]', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); });
        tgt.hidden = m !== 'pair';
        presets.innerHTML = '<span class="faint">Try</span> ' + PRESETS[m].map(function (p, i) {
          return '<button class="chip" type="button" data-pre="' + i + '">' + esc(p.a.join(' ')) + (m === 'pair' ? ' → ' + p.t : '') + '</button>';
        }).join('') + (m === 'pair' ? '<span class="faint">The array must be sorted for the pointer rule to be safe.</span>' : '<span class="faint">Read/write pointers: the code is under Variations.</span>');
        p = p || PRESETS[m][0];
        input.value = p.a.join(' '); tgt.value = p.t === undefined ? '' : p.t;
        run();
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mode],[data-pre]'); if (!b || !host.contains(b)) return;
        if (b.dataset.mode) setMode(b.dataset.mode); else setMode(mode, PRESETS[mode][+b.dataset.pre]);
      });
      setMode('pair');
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
