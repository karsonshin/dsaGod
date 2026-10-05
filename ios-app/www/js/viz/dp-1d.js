/* Offer Ready: 1-D DP visualizer (climbing stairs, house robber, decode ways; bottom-up or top-down with a memo).
   Each frame is a snapshot of the table, so stepping back is just painting an earlier frame. Frame steps match the
   template's #@base/#@next/#@one/#@two/#@fill/#@answer marks (decode ways), which light up in sync. In top-down
   mode, 'call' and 'hit' have no line in the bottom-up template, so no line is lit for them. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXN = 12, CELL = 38, GAP = 6, PITCH = CELL + GAP, PAD = 3, ARROW_H = 56;
  var UP = {
    start: { label: 'Start' }, base: { label: 'Base case', tone: 'hard' }, next: { label: 'Next cell' },
    one: { label: 'Pull one', tone: 'accent' }, two: { label: 'Pull two', tone: 'accent' }, fill: { label: 'Write cell', tone: 'ok' }, done: { label: 'Done' }
  };
  var DOWN = {
    start: { label: 'Start' }, call: { label: 'Call' }, hit: { label: 'Memo hit', tone: 'ok' }, base: { label: 'Base case', tone: 'hard' },
    one: { label: 'Pull one', tone: 'accent' }, two: { label: 'Pull two', tone: 'accent' }, fill: { label: 'Write cell', tone: 'ok' }, done: { label: 'Done' }
  };

  function ident(v) { return v; }
  var KINDS = {
    stairs: {
      name: 'Climbing stairs', label: 'Number of steps (0 to ' + MAXN + ')', presets: ['5', '8', '3', '12'], hint: 'dp[i] counts the ways to reach step i.',
      rec: 'dp[i] = dp[i-1] + dp[i-2]', base: 1, combine: 'sum', items: null,
      parse: function (t) { var n = parseInt(t, 10); return isNaN(n) ? 5 : Math.max(0, Math.min(MAXN, n)); },
      show: String, size: ident,
      baseNote: 'One way to stand at the bottom: do nothing. dp[0] = 1. Every other cell is built from cells to its left.',
      pulls: function (n, i) {
        return [
          { from: i - 1, nm: 'dp[' + (i - 1) + ']', calc: ident, text: function (v) { return 'Last move was one step, so it started on step ' + (i - 1) + '. Every way to reach step ' + (i - 1) + ' extends: dp[' + (i - 1) + '] = ' + v + '.'; } },
          i >= 2 ? { from: i - 2, nm: 'dp[' + (i - 2) + ']', calc: ident, text: function (v) { return 'Last move was a two-step jump from step ' + (i - 2) + ': dp[' + (i - 2) + '] = ' + v + ' more ways.'; } }
            : { from: null, nm: '', calc: function () { return null; }, text: function () { return 'Step 1 has nothing two below it, so a 2-step jump cannot land here.'; } }
        ];
      },
      next: function (i) { return 'Solve dp[' + i + '], the number of ways to reach step ' + i + '. Every cell it needs is already filled.'; },
      done: function (a, dp, n) { return 'There are ' + dp[n] + ' ways to climb ' + n + ' step' + (n === 1 ? '' : 's') + '. One pass, two lookups per cell: O(n) time. Only the last two cells were ever read, so O(1) space is enough.'; }
    },
    robber: {
      name: 'House robber', label: 'Money per house (up to ' + MAXN + ', separated by commas)', presets: ['2,7,9,3,1', '1,2,3,1', '2,1,1,2', '6,1,1,6,1'], hint: '[2,1,1,2] punishes the greedy habit of taking the biggest house.',
      rec: 'dp[i] = max(dp[i-1], dp[i-2] + a[i])', base: 0, combine: 'max',
      items: { cap: 'money in each house', fmt: function (a, j) { return String(a[j]); } },
      parse: function (t) {
        var a = String(t).split(/[\s,]+/).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); }).map(function (x) { return Math.max(0, Math.min(99, x)); }).slice(0, MAXN);
        return a.length ? a : [2, 7, 9, 3, 1];
      },
      show: function (a) { return a.join(','); }, size: function (a) { return a.length; },
      baseNote: 'No houses, no money: dp[0] = 0. dp[i] means the best total using only the first i houses.',
      pulls: function (a, i) {
        var m = a[i - 1];
        return [
          { from: i - 1, nm: 'dp[' + (i - 1) + ']', calc: ident, text: function (v) { return 'Skip house ' + i + ': keep the best of the first ' + (i - 1) + ' houses, dp[' + (i - 1) + '] = ' + v + '.'; } },
          i >= 2 ? { from: i - 2, nm: 'dp[' + (i - 2) + '] + ' + m, calc: function (v) { return v + m; }, text: function (v, c) { return 'Rob house ' + i + ' (' + m + '): its neighbour is off limits, so add it to dp[' + (i - 2) + '] = ' + v + '. Total ' + c + '.'; } }
            : { from: null, nm: String(m), calc: function () { return m; }, text: function () { return 'Rob house 1 (' + m + '): nothing came before it, so the total is ' + m + '.'; } }
        ];
      },
      next: function (i, a) { return 'Solve dp[' + i + ']: the best total from the first ' + i + ' house' + (i === 1 ? '' : 's') + '. House ' + i + ' holds ' + a[i - 1] + ': skip it or rob it.'; },
      done: function (a, dp, n, picks) {
        var hs = picks.slice().reverse().map(function (j) { return j + 1; });
        return 'Best total ' + dp[n] + (hs.length ? ', by robbing house' + (hs.length > 1 ? 's ' : ' ') + hs.join(', ') + ' (found by walking back: if dp[i] differs from dp[i-1], house i was taken).' : '. Nothing to rob.') + ' O(n) time.';
      }
    },
    decode: {
      name: 'Decode ways', label: 'Digits (up to ' + MAXN + ')', presets: ['226', '12', '2101', '100'], hint: 'A 0 cannot stand alone, and “100” has no valid reading at all.',
      rec: 'dp[i] = (s[i] ≠ 0 ? dp[i-1] : 0) + (10 ≤ s[i-1..i] ≤ 26 ? dp[i-2] : 0)', base: 1, combine: 'sum',
      items: { cap: 'digits of the message', fmt: function (s, j) { return s[j]; } },
      parse: function (t) { var s = String(t).replace(/\D/g, '').slice(0, MAXN); return s || '226'; },
      show: ident, size: function (s) { return s.length; },
      baseNote: 'The empty prefix has one reading: the empty message. dp[0] = 1. dp[i] means the ways to read the first i digits.',
      pulls: function (s, i) {
        var d = s[i - 1], two = i >= 2 ? Number(s.slice(i - 2, i)) : 0;
        return [
          d !== '0' ? { from: i - 1, nm: 'dp[' + (i - 1) + ']', calc: ident, text: function (v) { return '“' + d + '” alone is a letter, so every reading of the first ' + (i - 1) + ' digits extends: dp[' + (i - 1) + '] = ' + v + '.'; } }
            : { from: null, nm: '', calc: function () { return null; }, text: function () { return '“0” alone is not a letter, so this door is closed.'; } },
          i >= 2 && two >= 10 && two <= 26 ? { from: i - 2, nm: 'dp[' + (i - 2) + ']', calc: ident, text: function (v) { return '“' + s.slice(i - 2, i) + '” is between 10 and 26, a valid letter: add dp[' + (i - 2) + '] = ' + v + '.'; } }
            : { from: null, nm: '', calc: function () { return null; }, text: function () { return i < 2 ? 'There is no digit before it, so no two-digit letter.' : '“' + s.slice(i - 2, i) + '” is not between 10 and 26, so this door is closed.'; } }
        ];
      },
      next: function (i, s) { return 'Solve dp[' + i + ']: ways to read the first ' + i + ' digit' + (i === 1 ? '' : 's') + '. The last digit is “' + s[i - 1] + '”: read it alone, or with the one before it.'; },
      done: function (s, dp, n) { return dp[n] ? dp[n] + ' way' + (dp[n] === 1 ? '' : 's') + ' to read “' + s + '”. One pass, two lookups per cell: O(n) time.' : '“' + s + '” cannot be read at all: every path hits a dead end, so the answer is 0.'; }
    }
  };
  // Which items (houses or digits) to tint while pull `stage` (0 = next/fill, 1 = one, 2 = two) is shown.
  function itemCls(kind, i, stage) {
    var m = {};
    if (kind === 'robber') m[i - 1] = stage === 1 ? 'gone' : stage === 2 ? 'in' : 'cur';
    if (kind === 'decode') { m[i - 1] = stage === 0 ? 'cur' : 'in'; if (stage === 2) m[i - 2] = 'in'; }
    return m;
  }

  function eqText(K, i, ps, vals, v) {
    var terms = [], shown = [];
    ps.forEach(function (p, k) { if (p.nm) { terms.push(p.nm); shown.push(vals[k] == null ? '?' : vals[k]); } });
    if (!terms.length) return 'dp[' + i + '] = 0   (no move allowed)';
    var tail = v == null ? '' : ' = ' + v;
    return K.combine === 'max' ? 'dp[' + i + '] = max(' + terms.join(', ') + ') = max(' + shown.join(', ') + ')' + tail
      : 'dp[' + i + '] = ' + terms.join(' + ') + ' = ' + shown.join(' + ') + tail;
  }

  function build(kind, arg, down) {
    var K = KINDS[kind], n = K.size(arg), frames = [], dp = [], stack = [], calls = 0, hits = 0, i;
    for (i = 0; i <= n; i++) dp.push(null);
    function snap(step, note, o) {
      frames.push(Object.assign({ step: step, note: note, dp: dp.slice(), cur: -1, arrows: [], src: [], ic: {}, eq: '', stack: stack.slice(), calls: calls, hits: hits }, o));
    }
    function pull(i, ps, vals, k, arrows) {
      var p = ps[k], v = p.from == null ? undefined : dp[p.from];
      vals[k] = p.calc(v);
      var live = p.from != null && vals[k] != null;
      if (live) arrows.push({ from: p.from, to: i, k: k, cls: 'try' });
      snap(k === 0 ? 'one' : 'two', p.text(v, vals[k]), { cur: i, arrows: arrows.slice(), src: live ? [p.from] : [], ic: itemCls(kind, i, k + 1), eq: eqText(K, i, ps, vals) });
    }
    function fill(i, ps, vals, arrows) {
      var v = 0, win = [], k;
      if (K.combine === 'sum') vals.forEach(function (x, j) { if (x != null) { v += x; win.push(j); } });
      else { v = -1; vals.forEach(function (x, j) { if (x != null && x > v) { v = x; win = [j]; } }); }
      dp[i] = v;
      var note = 'dp[' + i + '] = ' + v + '.';
      if (K.combine === 'max') note = 'Keep the better choice: dp[' + i + '] = ' + v + (win[0] === 0 ? ' (skip house ' + i + (vals[1] === vals[0] ? ', a tie goes to skipping' : '') + ')' : ' (rob house ' + i + ', ' + (vals[1] - vals[0]) + ' better than skipping)') + '.';
      else if (v === 0 && kind === 'decode') note += ' A zero is a dead end: no valid way to read this prefix, and any later cell that leans on it inherits nothing.';
      else note += ' Added up the allowed pulls and wrote the cell.';
      snap('fill', note, { cur: i, arrows: arrows.map(function (a) { return Object.assign({}, a, { cls: win.indexOf(a.k) >= 0 ? 'win' : 'lose' }); }), ic: itemCls(kind, i, 0), eq: eqText(K, i, ps, vals, v) });
    }
    function td(i) {
      stack.push(i); calls++;
      if (dp[i] != null) {
        hits++;
        snap('hit', 'dp[' + i + '] is already in the table: return ' + dp[i] + ' at once. Everything under it in the call tree never runs.', { cur: i, src: [i] });
        stack.pop(); return;
      }
      snap('call', i === n ? 'Start from the question: ask for dp[' + i + '].' : 'Asked for dp[' + i + '], and it is not in the table yet.', { cur: i });
      if (i === 0) { dp[0] = K.base; snap('base', K.baseNote, { cur: 0 }); stack.pop(); return; }
      var ps = K.pulls(arg, i), vals = [null, null], arrows = [];
      [0, 1].forEach(function (k) { if (ps[k].from != null) td(ps[k].from); pull(i, ps, vals, k, arrows); });
      fill(i, ps, vals, arrows);
      stack.pop();
    }

    snap('start', down ? 'Top-down: start from the answer, dp[' + n + '], and recurse. The table fills in the order the calls finish.' : 'The table is empty. Fill it left to right, so every cell you read is already done.');
    if (down) td(n);
    else {
      dp[0] = K.base; snap('base', K.baseNote, { cur: 0 });
      for (i = 1; i <= n; i++) {
        var ps = K.pulls(arg, i), vals = [null, null], arrows = [];
        snap('next', K.next(i, arg), { cur: i, ic: itemCls(kind, i, 0), eq: eqText(K, i, ps, vals) });
        pull(i, ps, vals, 0, arrows); pull(i, ps, vals, 1, arrows); fill(i, ps, vals, arrows);
      }
    }
    var picks = [], ic = {};
    if (kind === 'robber') {
      for (i = n; i >= 1;) { if (dp[i] === dp[i - 1]) i--; else { picks.push(i - 1); ic[i - 1] = 'ok'; i -= 2; } }
    }
    stack.length = 0;
    snap('done', K.done(arg, dp, n, picks) + (down ? ' The call tree made ' + calls + ' call' + (calls === 1 ? '' : 's') + ' and ' + hits + ' memo hit' + (hits === 1 ? '' : 's') + '.' : ''), { cur: n, ic: ic, final: true });
    return frames;
  }

  function stageHTML(K, arg, n, down) {
    var w = (n + 1) * PITCH - GAP + PAD * 2, i, items = '', cells = '';
    for (i = 0; i <= n; i++) cells += '<span class="va-cell"><b></b><small>' + i + '</small></span>';
    if (K.items) {
      items = '<span class="dp-cap">' + esc(K.items.cap) + '</span><div class="va-row dp-items" aria-hidden="true"><span class="va-cell dp-item dp-spacer"></span>';
      for (i = 0; i < n; i++) items += '<span class="va-cell dp-item"><b>' + esc(K.items.fmt(arg, i)) + '</b><small>' + (i + 1) + '</small></span>';
      items += '</div>';
    }
    var defs = ['try', 'win', 'lose'].map(function (c) {
      return '<marker id="dp-ah-' + c + '" class="dp-ah ' + c + '" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10z"/></marker>';
    }).join('');
    return '<div class="dp"><div class="dp-scroll"><div class="va dp-grid" style="width:' + w + 'px">' + items +
      '<span class="dp-cap">dp table: ' + (down ? 'filled as the calls return' : 'filled left to right') + '</span><div class="va-row dp-row" aria-hidden="true">' + cells + '</div>' +
      '<svg class="dp-arrows" width="' + w + '" height="' + ARROW_H + '" aria-hidden="true"><defs>' + defs + '</defs><g></g></svg></div></div>' +
      '<dl class="va-read dp-read"><div><dt>Recurrence</dt><dd class="dp-rec mono"></dd></div></dl>' +
      '<dl class="va-read dp-read"><div><dt>This cell</dt><dd class="dp-eq mono"></dd></div>' +
      (down ? '<div><dt>stack</dt><dd class="dp-stack mono"></dd></div><div><dt>calls</dt><dd class="dp-calls"></dd></div><div><dt>hits</dt><dd class="dp-hits"></dd></div>' : '') + '</dl></div>';
  }

  function arrowPath(a) {
    var d = a.to - a.from, xs = PAD + a.from * PITCH + CELL / 2 + (d === 1 ? 5 : 0), xt = PAD + a.to * PITCH + CELL / 2 + (d === 1 ? -6 : 6);
    var depth = 14 + d * 12;
    return '<path class="dp-arrow ' + a.cls + '" marker-end="url(#dp-ah-' + a.cls + ')" d="M' + xs + ' 2Q' + ((xs + xt) / 2) + ' ' + (2 + 2 * depth) + ' ' + xt + ' 5"/>';
  }

  function paint(kind, arg, down, stage, f) {
    var K = KINDS[kind], n = K.size(arg);
    if (!stage.firstChild) stage.innerHTML = stageHTML(K, arg, n, down);
    var cells = OR.$$('.dp-row .va-cell', stage);
    cells.forEach(function (el, i) {
      var v = f.dp[i], open = v == null && f.stack.indexOf(i) >= 0, c = 'va-cell';
      if (f.src.indexOf(i) >= 0) c += ' in';
      if (i === f.cur && (f.step === 'fill' || f.step === 'base' || f.final)) c += kind === 'decode' && v === 0 && !f.final ? ' dup' : ' ok';
      else if (kind === 'decode' && v === 0 && f.cur !== i) c += ' dup';
      if (i === f.cur && !f.final) c += ' cur';
      if (open) c += ' gone';
      el.className = c;
      OR.$('b', el).textContent = v == null ? (open ? '…' : '') : v;
    });
    OR.$$('.dp-items .dp-item', stage).forEach(function (el, j) {
      if (j === 0) return;
      el.className = 'va-cell dp-item' + (f.ic[j - 1] ? ' ' + f.ic[j - 1] : '');
    });
    var g = OR.$('.dp-arrows g', stage);
    if (g) g.innerHTML = f.arrows.map(arrowPath).join('');
    OR.$('.dp-rec', stage).textContent = K.rec;
    OR.$('.dp-eq', stage).innerHTML = f.eq ? esc(f.eq) : '<span class="faint">none yet</span>';
    if (down) {
      OR.$('.dp-stack', stage).innerHTML = f.stack.length ? esc(f.stack.map(function (x) { return 'dp[' + x + ']'; }).join(' › ')) : '<span class="faint">empty</span>';
      OR.$('.dp-calls', stage).innerHTML = '<b class="num">' + f.calls + '</b>';
      OR.$('.dp-hits', stage).innerHTML = '<b class="num">' + f.hits + '</b>';
    }
    var sc = OR.$('.dp-scroll', stage);
    if (sc && f.cur >= 0 && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = Math.max(0, PAD + f.cur * PITCH + CELL / 2 - sc.clientWidth / 2);
  }

  OR.viz['dp-1d'] = {
    build: build, kinds: KINDS, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, kind = 'stairs', down = false;
      host.innerHTML = '<form class="va-input" novalidate>' +
        '<p class="va-presets"><span class="faint">Problem</span> ' + Object.keys(KINDS).map(function (k) { return '<button class="chip" type="button" data-k="' + k + '" aria-pressed="' + (k === kind) + '">' + KINDS[k].name + '</button>'; }).join('') + '</p>' +
        '<p class="va-presets"><span class="faint">Method</span> <button class="chip" type="button" data-m="0" aria-pressed="true">Bottom-up</button><button class="chip" type="button" data-m="1" aria-pressed="false">Top-down (memo)</button></p>' +
        '<label class="field-label" for="dp-in"></label>' +
        '<div class="va-input-row"><input class="input mono" id="dp-in" spellcheck="false" autocomplete="off"><button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> <span class="dp-presets"></span><span class="faint dp-hint"></span></p></form><div class="va-player"></div>';
      var input = OR.$('#dp-in', host), slot = OR.$('.va-player', host);

      function setKind(k) {
        kind = k;
        var K = KINDS[k];
        OR.$('.field-label', host).textContent = K.label;
        OR.$('.dp-presets', host).innerHTML = K.presets.map(function (p) { return '<button class="chip" type="button" data-s="' + esc(p) + '">' + esc(p) + '</button>'; }).join('');
        OR.$('.dp-hint', host).textContent = K.hint;
        OR.$$('[data-k]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.k === k)); });
      }
      function run(text) {
        var K = KINDS[kind], arg = K.parse(text);
        input.value = K.show(arg);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: build(kind, arg, down), steps: down ? DOWN : UP, label: K.name + ' on ' + K.show(arg) + (down ? ', top-down with a memo' : ', bottom-up'),
          paint: function (stg, f) { paint(kind, arg, down, stg, f); mark(down && (f.step === 'call' || f.step === 'hit') || f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s],[data-k],[data-m]'); if (!b) return;
        if (b.dataset.k) { setKind(b.dataset.k); run(KINDS[kind].presets[0]); }
        else if (b.dataset.m) { down = b.dataset.m === '1'; OR.$$('[data-m]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); run(input.value); }
        else run(b.dataset.s);
      });
      setKind(kind);
      run(KINDS[kind].presets[0]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
