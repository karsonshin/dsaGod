/* Offer Ready: bit manipulation visualizer. 8-bit numbers you can edit (decimal, 0b binary, or click and key the bits).
   Three modes: operators and tricks (AND, OR, XOR, NOT, shifts, n&(n-1), n&-n), Kernighan popcount, and XOR single number.
   Each frame is a snapshot, so stepping back just paints an earlier frame. Popcount and XOR frames carry a `mark` that matches the
   template's #@loop/#@clear/#@count and #@xloop/#@fold lines, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MINUS = '−';
  var STEPS = {
    start: { label: 'Start' }, bit: { label: 'One column', tone: 'accent' }, shift: { label: 'Shift', tone: 'ok' },
    sub: { label: 'Subtract 1', tone: 'accent' }, flip: { label: 'Flip all bits', tone: 'accent' }, plus: { label: 'Add 1', tone: 'accent' },
    and: { label: 'AND', tone: 'ok' }, loop: { label: 'Any bit left?', tone: 'accent' }, clear: { label: 'Clear lowest bit', tone: 'hard' },
    count: { label: 'Count it', tone: 'ok' }, xloop: { label: 'Next number', tone: 'accent' }, fold: { label: 'XOR it in', tone: 'ok' }, done: { label: 'Done' }
  };
  var OPS = [
    ['and', 'A & B', 2], ['or', 'A | B', 2], ['xor', 'A ^ B', 2], ['not', '~A', 1], ['shl', 'A << 1', 1], ['sar', 'A >> 1', 1], ['shr', 'A >>> 1', 1],
    ['dec', 'n & (n-1)', 1], ['low', 'n & -n', 1]
  ];
  var MODES = [['ops', 'Operators and tricks'], ['pop', 'Kernighan popcount'], ['xor', 'XOR single number']];
  var PRESETS = {
    ops: [['A = 13, B = 11', 13, 11], ['A = 80, B = 0', 80, 0], ['A = 0b10110000', 176, 0], ['A = −8', 248, 0]],
    pop: [['180 = 10110100', 180, 0], ['255', 255, 0], ['128', 128, 0], ['0', 0, 0]],
    xor: [['4 1 2 1 2'], ['7 3 5 4 5 3 4'], ['9 9 200']]
  };
  var RULES = {
    and: 'AND keeps a 1 only where both numbers have a 1. Use it to test a bit or to clear bits (mask with 0 where you want them gone).',
    or: 'OR gives a 1 where either number has a 1. Use it to set bits.',
    xor: 'XOR gives a 1 where the bits differ. Use it to toggle bits, and note that x ^ x = 0.',
    not: 'NOT flips every bit. In two’s complement, ~x equals −x − 1.'
  };

  function u8(x) { return x & 255; }
  function sgn(x) { return x > 127 ? x - 256 : x; }
  function val(x) { return x > 127 ? x + ' = ' + MINUS + (256 - x) + ' signed' : String(x); }
  function bin(x) { return ('00000000' + x.toString(2)).slice(-8); }
  function low(x) { return x & -x; }
  function bitsOf(m, cls) { var o = {}; for (var i = 0; i < 8; i++) if (m >> i & 1) o[i] = cls; return o; }
  function row(cap, v, o) { return Object.assign({ cap: cap, v: v }, o || {}); }
  function withCol(rows, i) { return rows.map(function (r) { return Object.assign({}, r, { col: i }); }); }

  function opsFrames(op, a, b) {
    var out = [];
    function snap(step, note, rows, x) { out.push(Object.assign({ step: step, note: note, rows: rows }, x)); }
    var A = row('A', a), B = row('B', b), i, m;
    if (op === 'and' || op === 'or' || op === 'xor') {
      var f = op === 'and' ? function (x, y) { return x & y; } : op === 'or' ? function (x, y) { return x | y; } : function (x, y) { return x ^ y; };
      var sym = { and: '&', or: '|', xor: '^' }[op], r = u8(f(a, b));
      snap('start', RULES[op] + ' Walking the columns from bit 0 up.', [A, B, row('A ' + sym + ' B', 0, { known: 0, tone: 'out' })]);
      for (i = 0; i < 8; i++) {
        m = (2 << i) - 1;
        snap('bit', 'Bit ' + i + ': ' + (a >> i & 1) + ' ' + sym + ' ' + (b >> i & 1) + ' = ' + (r >> i & 1) + '.',
          withCol([A, B, row('A ' + sym + ' B', r & m, { known: m, tone: 'out' })], i));
      }
      snap('done', 'A ' + sym + ' B = ' + val(r) + '. ' + (op === 'xor' ? 'The 1s mark exactly where A and B differ.' : op === 'and' ? 'Every 1 in the result is a 1 in both inputs.' : 'Every 1 in either input survives.'),
        [A, B, row('A ' + sym + ' B', r, { tone: 'out' })], { final: true });
      return out;
    }
    if (op === 'not') {
      var n = u8(~a);
      snap('start', RULES.not + ' Walking the columns from bit 0 up.', [A, row('~A', 0, { known: 0, tone: 'out' })]);
      for (i = 0; i < 8; i++) {
        m = (2 << i) - 1;
        snap('bit', 'Bit ' + i + ': ~' + (a >> i & 1) + ' = ' + (n >> i & 1) + '.', withCol([A, row('~A', n & m, { known: m, tone: 'out', hl: bitsOf(m, 'chg') })], i));
      }
      snap('done', '~A = ' + val(n) + '. Every bit flipped, so as signed numbers ' + sgn(a) + ' became ' + sgn(n) + ' (that is −A − 1).',
        [A, row('~A', n, { tone: 'out', hl: bitsOf(255, 'chg') })], { final: true });
      return out;
    }
    if (op === 'shl' || op === 'sar' || op === 'shr') {
      var res = op === 'shl' ? u8(a << 1) : op === 'sar' ? u8(sgn(a) >> 1) : a >> 1;
      var gone = op === 'shl' ? 128 : 1, came = op === 'shl' ? 1 : 128;
      var what = op === 'shl' ? 'A << 1' : op === 'sar' ? 'A >> 1' : 'A >>> 1';
      snap('start', op === 'shl' ? '<< 1 slides every bit one place left.' : op === 'sar' ? '>> 1 slides every bit right and copies the sign bit into the gap, so negatives stay negative.' : '>>> 1 slides every bit right and always fills the gap with 0 (an unsigned shift).', [A]);
      snap('shift', (op === 'shl' ? 'The top bit (' + (a >> 7 & 1) + ') falls off the end and a 0 enters at bit 0.' : 'The lowest bit (' + (a & 1) + ') falls off the end and ' + (op === 'sar' ? 'a copy of the sign bit (' + (a >> 7 & 1) + ')' : 'a 0') + ' enters at bit 7.'),
        [row('A', a, { hl: bitsOf(gone, 'chg') }), row(what, res, { tone: 'out', hl: bitsOf(came, 'chg') })]);
      snap('done', what + ' = ' + val(res) + '. ' + (op === 'shl' ? 'Shifting left by k multiplies by 2^k, until bits fall off the top' + (sgn(res) !== sgn(a) * 2 ? ' (this one overflowed 8 bits)' : '') + '.' : 'Shifting right by k divides by 2^k, rounding ' + (op === 'sar' ? 'toward minus infinity.' : 'down.')),
        [A, row(what, res, { tone: 'out' })], { final: true });
      return out;
    }
    if (op === 'dec') {
      var d = u8(a - 1), r2 = a & d;
      snap('start', 'n & (n-1) erases the lowest set bit. Subtracting 1 flips that bit to 0 and every 0 below it to 1.', [row('n', a)]);
      snap('sub', a ? 'n − 1 = ' + d + '. The bits from the lowest set bit down all flipped.' : 'n is 0, so n − 1 wraps to all ones (255 here, −1 as signed). AND with 0 is still 0.', [row('n', a), row('n − 1', d, { hl: a ? bitsOf(d ^ a, 'chg') : bitsOf(255, 'chg') })]);
      snap('and', 'n & (n−1): above the flipped zone both numbers agree, inside it they are opposites, so the lowest set bit becomes 0 and nothing else changes.',
        [row('n', a), row('n − 1', d), row('n & (n−1)', r2, { tone: 'out', hl: bitsOf(a ^ r2, 'chg') })], { mark: 'clear' });
      snap('done', 'Result ' + val(r2) + (a ? ': one set bit fewer than ' + a + '.' : '.') + (a && !r2 ? ' It is 0, so n was a power of two (exactly one set bit).' : ''),
        [row('n', a), row('n − 1', d), row('n & (n−1)', r2, { tone: 'out' })], { final: true });
      return out;
    }
    var nn = u8(~a), neg = u8(-a), lb = a & neg;
    snap('start', 'n & -n keeps only the lowest set bit. In two’s complement, −n is ~n + 1.', [row('n', a)]);
    snap('flip', '~n flips every bit.', [row('n', a), row('~n', nn, { hl: bitsOf(255, 'chg') })]);
    snap('plus', a ? 'Adding 1 carries through the run of 1s at the bottom of ~n and stops at the first 0, which lines up with the lowest set bit of n. So −n = ' + sgn(neg) + '.' : 'n is 0, so ~n is all ones and adding 1 carries out of the top: −0 = 0.',
      [row('n', a), row('~n', nn), row('−n', neg, { hl: bitsOf(neg ^ nn, 'chg') })]);
    snap('and', 'n & −n: below the lowest set bit both are 0, at it both are 1, above it they are opposites. Only that one bit survives.',
      [row('n', a), row('−n', neg), row('n & −n', lb, { tone: 'out', hl: bitsOf(lb, 'chg') })]);
    snap('done', a ? 'Lowest set bit of ' + a + ' is ' + lb + ' (bit ' + (31 - Math.clz32(lb)) + ').' : 'n has no set bit, so the result is 0.',
      [row('n', a), row('−n', neg), row('n & −n', lb, { tone: 'out' })], { final: true });
    return out;
  }

  function popFrames(a) {
    var out = [], n = a, count = 0;
    function snap(step, note, rows, x) { out.push(Object.assign({ step: step, note: note, rows: rows, tail: 'count = ' + count, mark: step === 'start' || step === 'done' ? null : step }, x)); }
    snap('start', 'Count the 1 bits of ' + a + ' (' + bin(a) + '). Instead of testing all 8 positions, erase the lowest set bit each round: the loop runs once per set bit.', [row('n', n)]);
    for (;;) {
      if (!n) { snap('loop', 'n is 0, so no set bits remain. The loop ends.', [row('n', n)]); break; }
      snap('loop', 'n = ' + n + ' is not 0, so at least one set bit remains.', [row('n', n)]);
      var d = u8(n - 1), nx = n & d;
      snap('clear', 'n − 1 flips the lowest set bit and the zeros below it, so n & (n−1) erases exactly that one bit.',
        [row('n', n, { hl: bitsOf(low(n), 'chg') }), row('n − 1', d, { hl: bitsOf(d ^ n, 'chg') }), row('n & (n−1)', nx, { tone: 'out', hl: bitsOf(low(n), 'chg') })]);
      n = nx; count++;
      snap('count', 'One bit erased, one counted: count = ' + count + '.', [row('n', n)]);
    }
    snap('done', 'Popcount of ' + a + ' is ' + count + ', after ' + count + ' round' + (count === 1 ? '' : 's') + ' (one per set bit, never more than 8 here).', [row('n', 0)], { final: true });
    return out;
  }

  function parseList(text) { return (String(text).match(/\d+/g) || []).slice(0, 7).map(function (t) { return Math.min(255, parseInt(t, 10)); }); }

  function xorFrames(nums) {
    var out = [], x = 0, i;
    function snap(step, note, rows, xx) { out.push(Object.assign({ step: step, note: note, rows: rows, tail: 'x = ' + x, mark: step === 'start' || step === 'done' ? null : step }, xx)); }
    if (!nums.length) { snap('done', 'Type at least one whole number (0 to 255) to run it.', [row('x', 0)], { final: true }); return out; }
    snap('start', 'x starts at 0. XOR every number in: a ^ a = 0 and x ^ 0 = x, and XOR is order-free, so every pair cancels itself.', [row('x', 0)]);
    for (i = 0; i < nums.length; i++) {
      var v = nums[i], nx = x ^ v;
      snap('xloop', 'Next number: ' + v + ' (' + bin(v) + ').', [row('x', x), row('v', v, { hl: bitsOf(v, 'chg') })]);
      var old = x; x = nx;
      snap('fold', 'x = ' + old + ' ^ ' + v + ' = ' + x + '. Each 1 in v flips that bit of x.', [row('x (before)', old), row('v', v), row('x ^ v', x, { tone: 'out', hl: bitsOf(old ^ x, 'chg') })]);
    }
    var seen = {}, odd = [];
    nums.forEach(function (v) { seen[v] = (seen[v] || 0) + 1; });
    Object.keys(seen).forEach(function (k) { if (seen[k] % 2) odd.push(k); });
    snap('done', 'x = ' + x + '. ' + (odd.length === 1 ? 'Every value appeared twice except ' + odd[0] + ', so that is the single number.' : 'This list does not have exactly one unpaired value, so x is just the XOR of everything. Try 4 1 2 1 2.'), [row('x', x, { tone: 'out' })], { final: true });
    return out;
  }

  function framesFor(s) {
    return s.mode === 'ops' ? opsFrames(s.op, s.a, s.b) : s.mode === 'pop' ? popFrames(s.a) : xorFrames(parseList(s.list));
  }

  function rowHTML(r) {
    var cells = '', i;
    for (i = 7; i >= 0; i--) {
      var known = r.known == null || (r.known >> i & 1), on = known && (r.v >> i & 1);
      var cls = 'bit-c' + (on ? (r.tone === 'out' ? ' out' : ' on') : '') + (known ? '' : ' gone') + (r.hl && r.hl[i] ? ' ' + r.hl[i] : '') + (r.col === i ? ' cur' : '');
      cells += '<span class="' + cls + '">' + (known ? (on ? 1 : 0) : '·') + '</span>';
    }
    return '<div class="bit-row"><p class="bit-cap"><b>' + esc(r.cap) + '</b>' + (r.known == null || r.known === 255 ? '<span>' + esc(val(r.v)) + '</span>' : '') + '</p><div class="bit-cells" aria-hidden="true">' + cells + '</div></div>';
  }

  function paint(stage, f) {
    var pos = '', i;
    for (i = 7; i >= 0; i--) pos += '<span>' + i + '</span>';
    stage.innerHTML = '<div class="bit"><div class="bit-pos" aria-hidden="true">' + pos + '</div>' + f.rows.map(rowHTML).join('') +
      (f.tail ? '<p class="bit-cap"><b>' + esc(f.tail) + '</b></p>' : '') +
      '<p class="bit-key"><span><i class="k1"></i>1 bit</span><span><i class="k2"></i>just changed</span><span><i class="k3"></i>result</span></p></div>';
  }

  function parseNum(t) {
    var m = /^\s*0b([01]{1,8})\s*$/i.exec(t);
    if (m) return parseInt(m[1], 2);
    if (!/^\s*-?\d+\s*$/.test(t)) return null;
    var n = parseInt(t, 10);
    return n >= -128 && n <= 255 ? u8(n) : null;
  }

  OR.viz['bits'] = {
    frames: framesFor, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var mark = ctx.mark || function () {}, player = null;
      var s = { mode: 'ops', op: 'and', a: 13, b: 11, list: '4 1 2 1 2' };
      function chip(k, label, group, on) { return '<button class="chip" type="button" data-' + group + '="' + k + '" aria-pressed="' + on + '">' + esc(label) + '</button>'; }
      function operandHTML(k, label) {
        var t = '', p = '', i;
        for (i = 7; i >= 0; i--) { t += '<button type="button" class="bit-t" data-k="' + k + '" data-i="' + i + '" aria-pressed="false"></button>'; p += '<span>' + i + '</span>'; }
        return '<div class="bit-op" data-n="' + k + '"><div class="bit-op-head"><label class="field-label" for="bit-in-' + k + '">' + label + '</label>' +
          '<input class="input mono" id="bit-in-' + k + '" maxlength="12" spellcheck="false" autocomplete="off" inputmode="text" aria-describedby="bit-sub-' + k + '"></div>' +
          '<div class="bit-toggles" role="group" aria-label="Bits of ' + label + ', most significant first">' + t + '</div><div class="bit-pos" aria-hidden="true">' + p + '</div>' +
          '<span class="bit-op-sub" id="bit-sub-' + k + '"></span></div>';
      }
      host.innerHTML = '<div class="bit-ctl"><div class="bit-chips" role="group" aria-label="Mode">' +
        MODES.map(function (m) { return chip(m[0], m[1], 'mode', m[0] === s.mode); }).join('') + '</div>' +
        '<div class="bit-ops" role="group" aria-label="Operation">' + OPS.map(function (o) { return chip(o[0], o[1], 'op', o[0] === s.op); }).join('') + '</div>' +
        '<div class="bit-nums">' + operandHTML('a', 'A') + operandHTML('b', 'B') + '</div>' +
        '<div class="bit-list" hidden><label class="field-label" for="bit-list">Numbers, 0 to 255 (up to 7, every value twice except one)</label>' +
        '<input class="input mono" id="bit-list" maxlength="40" spellcheck="false" autocomplete="off" value="' + esc(s.list) + '"></div>' +
        '<p class="va-presets"></p><p class="faint" style="margin:0;font-size:var(--text-xs)">Click a bit, or focus one and press 0 or 1. Arrow keys move between bits. 8 bits shown; bit 7 is the sign bit when numbers are signed.</p></div><div class="va-player"></div>';
      var slot = OR.$('.va-player', host), ops = OR.$('.bit-ops', host), list = OR.$('.bit-list', host), pre = OR.$('.va-presets', host);

      function run() {
        var fr = framesFor(s), used = {};
        fr.forEach(function (f) { used[f.step] = 1; });
        var steps = {};
        Object.keys(STEPS).forEach(function (k) { if (used[k]) steps[k] = STEPS[k]; });
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: fr, steps: steps, label: 'Bit manipulation: ' + (s.mode === 'ops' ? OPS.filter(function (o) { return o[0] === s.op; })[0][1] : MODES.filter(function (m) { return m[0] === s.mode; })[0][1]),
          paint: function (stage, f) { paint(stage, f); mark(f.mark || null); }
        });
      }
      function sync() {
        var two = s.mode === 'ops' && OPS.filter(function (o) { return o[0] === s.op; })[0][2] === 2;
        OR.$$('[data-mode]', host).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === s.mode); });
        OR.$$('[data-op]', host).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.op === s.op); });
        ops.hidden = s.mode !== 'ops';
        list.hidden = s.mode !== 'xor';
        OR.$('[data-n="a"]', host).hidden = s.mode === 'xor';
        OR.$('[data-n="b"]', host).hidden = !two;
        OR.$('[data-n="a"] .field-label', host).textContent = s.mode === 'ops' && s.op !== 'and' && s.op !== 'or' && s.op !== 'xor' ? (s.op === 'dec' || s.op === 'low' ? 'n' : 'A') : s.mode === 'pop' ? 'n' : 'A';
        ['a', 'b'].forEach(function (k) {
          var v = s[k], box = OR.$('[data-n="' + k + '"]', host);
          OR.$$('.bit-t', box).forEach(function (b) { var on = v >> +b.dataset.i & 1; b.setAttribute('aria-pressed', !!on); b.textContent = on; b.setAttribute('aria-label', 'Bit ' + b.dataset.i + ' of ' + (k === 'a' ? 'A' : 'B') + ' is ' + on); });
          var inp = OR.$('input', box);
          if (document.activeElement !== inp) inp.value = String(v);
          OR.$('.bit-op-sub', box).textContent = bin(v) + (v > 127 ? '  signed ' + sgn(v) : '');
        });
        var pr = PRESETS[s.mode];
        pre.innerHTML = '<span class="faint">Try</span> ' + pr.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + esc(p[0]) + '</button>'; }).join('');
      }
      function all() { sync(); run(); }

      host.addEventListener('click', function (e) {
        var t = e.target.closest('button'); if (!t || !host.contains(t)) return;
        if (t.dataset.mode) { s.mode = t.dataset.mode; all(); }
        else if (t.dataset.op) { s.op = t.dataset.op; all(); }
        else if (t.dataset.p) {
          var p = PRESETS[s.mode][+t.dataset.p];
          if (s.mode === 'xor') { s.list = p[0]; OR.$('#bit-list', host).value = p[0]; } else { s.a = p[1]; s.b = p[2]; }
          all();
        } else if (t.classList.contains('bit-t')) { s[t.dataset.k] ^= 1 << +t.dataset.i; all(); }
      });
      host.addEventListener('keydown', function (e) {
        var t = e.target; if (!t.classList || !t.classList.contains('bit-t')) return;
        var sibs = OR.$$('.bit-t', t.parentNode), at = sibs.indexOf(t), to = -1;
        if (e.key === 'ArrowLeft') to = Math.max(0, at - 1); else if (e.key === 'ArrowRight') to = Math.min(7, at + 1);
        else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = 7;
        else if (e.key === '0' || e.key === '1') {
          var m = 1 << +t.dataset.i; s[t.dataset.k] = e.key === '1' ? s[t.dataset.k] | m : s[t.dataset.k] & ~m & 255;
          all(); sibs[Math.min(7, at + 1)].focus(); e.preventDefault(); return;
        }
        if (to >= 0) { sibs[to].focus(); e.preventDefault(); }
      });
      host.addEventListener('input', function (e) {
        var t = e.target;
        if (t.id === 'bit-list') { s.list = t.value; run(); return; }
        var k = t.closest('[data-n]') && t.closest('[data-n]').dataset.n; if (!k) return;
        var n = parseNum(t.value);
        t.setAttribute('aria-invalid', n == null);
        if (n != null) { s[k] = n; sync(); run(); }
      });
      host.addEventListener('focusout', function (e) {
        if (e.target.matches && e.target.matches('.bit-op input')) { e.target.setAttribute('aria-invalid', 'false'); sync(); }
      });
      all();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
