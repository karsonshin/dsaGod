/* Offer Ready: sieve visualizer. Two modes over the same player:
   the Sieve of Eratosthenes on a number grid (primes below n, n up to 60), and Euclid's gcd on two numbers.
   Marks (sieve): init / bound / prime / cross / count. Marks (gcd): gloop / gstep / gdone.
   Frames are snapshots built by the pure frames(); paint() builds the DOM once per input and then only changes classes. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_N = 60, MAX_V = 9999;
  var SIEVE_STEPS = {
    start: { label: 'Start' }, init: { label: 'Assume all prime', tone: 'accent' }, bound: { label: 'p * p < n ?', tone: 'accent' },
    prime: { label: 'Is p still standing?', tone: 'accent' }, cross: { label: 'Cross out a multiple', tone: 'hard' },
    count: { label: 'Count survivors', tone: 'ok' }, done: { label: 'Done' }
  };
  var GCD_STEPS = {
    start: { label: 'Start' }, gloop: { label: 'Is b zero?', tone: 'accent' }, gstep: { label: 'a, b = b, a % b', tone: 'ok' },
    gdone: { label: 'b is 0: answer is a', tone: 'hard' }, done: { label: 'Done' }
  };

  function clampInt(v, lo, hi, dflt) { v = parseInt(v, 10); return isNaN(v) ? dflt : Math.max(lo, Math.min(hi, v)); }

  function sieveFrames(n) {
    var out = [], st = [], i, p, m, crossed = 0, sig = 'sieve|' + n;
    for (i = 0; i < n; i++) st.push(0);                        // 0 candidate, 1 crossed out, 2 confirmed prime
    function snap(step, note, x) {
      out.push(Object.assign({ mode: 'sieve', sig: sig, n: n, step: step, note: note, st: st.slice(), p: 0, cur: -1, crossed: crossed }, x));
    }
    if (n < 3) { snap('start', 'There are no primes below ' + n + '. Try a limit from 3 to ' + MAX_N + '.'); return out; }
    snap('start', 'Count the primes below ' + n + '. The grid shows 2 to ' + (n - 1) + ' (0 and 1 are never prime, so the code starts them off as not prime).');
    snap('init', 'Assume every number from 2 up is prime. The sieve will cross out the ones that are not.');
    for (p = 2; p * p < n; p++) {
      snap('bound', 'p = ' + p + ' and p * p = ' + (p * p) + (' < ' + n + ', so we keep going.'), { p: p });
      if (st[p] === 1) { snap('prime', p + ' was crossed out by a smaller prime, so it is not prime and has no multiples worth crossing. Skip it.', { p: p, cur: p }); continue; }
      st[p] = 2;
      snap('prime', p + ' is still standing, so it is prime. Cross out its multiples, starting at ' + p + ' * ' + p + ' = ' + (p * p) + (p > 2 ? ' (smaller multiples such as ' + (2 * p) + ' were already crossed by smaller primes).' : '.'), { p: p, cur: p });
      for (m = p * p; m < n; m += p) {
        var was = st[m] === 1;
        if (!was) crossed++;
        st[m] = 1;
        snap('cross', 'Cross out ' + m + ' = ' + p + ' * ' + (m / p) + (was ? ' (it was already crossed; a number can have several prime factors).' : '.'), { p: p, cur: m });
      }
    }
    var primes = [];
    for (i = 2; i < n; i++) if (st[i] !== 1) { st[i] = 2; primes.push(i); }
    snap('count', 'p * p is no longer below ' + n + ', so every number still standing is prime: ' + primes.length + ' primes, ' + primes.join(', ') + '.', { p: p });
    snap('done', primes.length + ' primes below ' + n + '. Each number is crossed only by primes up to its square root: about n log log n work in total.', { p: p });
    return out;
  }

  function gcdFrames(a0, b0) {
    var out = [], a = a0, b = b0, rows = [], sig = 'gcd|' + a0 + '|' + b0;
    function snap(step, note, x) { out.push(Object.assign({ mode: 'gcd', sig: sig, step: step, note: note, a: a, b: b, a0: a0, b0: b0, rows: rows.slice(), cur: rows.length - 1 }, x)); }
    snap('start', 'Find gcd(' + a0 + ', ' + b0 + ') and lcm(' + a0 + ', ' + b0 + '). Euclid: the gcd of a and b equals the gcd of b and the remainder a % b, and the numbers shrink fast.');
    while (true) {
      snap('gloop', b === 0 ? 'b is 0, so the loop stops.' : 'b = ' + b + ' is not 0, so take another step.');
      if (b === 0) break;
      var q = Math.floor(a / b), r = a % b;
      rows.push({ a: a, b: b, q: q, r: r });
      var na = b, nb = r;
      a = na; b = nb;
      snap('gstep', rows[rows.length - 1].a + ' = ' + q + ' * ' + na + ' + ' + r + '. The remainder is ' + r + ', so a becomes ' + a + ' and b becomes ' + b + '.');
    }
    var l = a0 / a * b0;
    snap('gdone', 'b is 0, so the answer is a = ' + a + '. gcd(' + a0 + ', ' + b0 + ') = ' + a + '.');
    snap('done', 'gcd = ' + a + ' after ' + rows.length + ' step' + (rows.length === 1 ? '' : 's') + '. lcm = ' + a0 + ' / ' + a + ' * ' + b0 + ' = ' + l + ' (divide first, then multiply, to avoid overflow).');
    return out;
  }

  function frames(arg1, arg2, mode) { return mode === 'gcd' ? gcdFrames(arg1, arg2) : sieveFrames(arg1); }

  function kv(label, val) { return '<div><dt>' + label + '</dt><dd><b class="num">' + val + '</b></dd></div>'; }

  function build(stage, f) {
    var html = '';
    if (f.mode === 'sieve') {
      for (var i = 2; i < f.n; i++) html += '<span class="sv-cell"><b>' + i + '</b></span>';
      stage.innerHTML = '<div class="sv" role="img"><div class="sv-grid">' + html + '</div><dl class="va-read"></dl></div>';
      stage._sv = { sig: f.sig, cells: [].slice.call(stage.querySelectorAll('.sv-cell')), read: stage.querySelector('.va-read') };
    } else {
      stage.innerHTML = '<div class="sv" role="img"><div class="sv-pair"><span class="sv-num" data-k="a"></span><span class="sv-num" data-k="b"></span></div>' +
        '<ol class="sv-rows"></ol><dl class="va-read"></dl></div>';
      stage._sv = { sig: f.sig, pa: stage.querySelector('[data-k="a"]'), pb: stage.querySelector('[data-k="b"]'), rows: stage.querySelector('.sv-rows'), read: stage.querySelector('.va-read') };
    }
  }

  function paint(stage, f) {
    if (!stage._sv || stage._sv.sig !== f.sig || !stage.isConnected) build(stage, f);
    var v = stage._sv;
    if (f.mode === 'sieve') {
      v.cells.forEach(function (el, k) {
        var num = k + 2, s = f.st[num], c = 'sv-cell';
        if (s === 1) c += ' x'; else if (s === 2) c += ' p';
        if (num === f.p && f.step !== 'count' && f.step !== 'done') c += ' pp';
        if (num === f.cur && f.step === 'cross') c += ' cur';
        el.className = c;
      });
      var left = 0; for (var i = 2; i < f.n; i++) if (f.st[i] !== 1) left++;
      v.read.innerHTML = kv('p', f.p || '-') + kv('crossed out', f.crossed) + kv('still standing', left);
      v.root = stage.firstChild;
      v.root.setAttribute('aria-label', 'Sieve of Eratosthenes below ' + f.n + '. ' + f.note);
    } else {
      v.pa.innerHTML = '<small>a</small>' + f.a; v.pb.innerHTML = '<small>b</small>' + f.b;
      v.pb.className = 'sv-num' + (f.b === 0 ? ' zero' : ''); v.pa.className = 'sv-num' + (f.step === 'gdone' || f.step === 'done' ? ' ans' : '');
      v.rows.innerHTML = f.rows.map(function (r, k) {
        return '<li class="sv-row' + (k === f.cur ? ' cur' : '') + '"><span class="num">' + r.a + ' = ' + r.q + ' * ' + r.b + ' + <b>' + r.r + '</b></span></li>';
      }).join('');
      v.read.innerHTML = kv('steps', f.rows.length) + kv('a', f.a) + kv('b', f.b);
      stage.firstChild.setAttribute('aria-label', 'Euclid gcd of ' + f.a0 + ' and ' + f.b0 + '. ' + f.note);
    }
  }

  OR.viz.sieve = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate>' +
        '<div class="sv-fields">' +
          '<label class="sv-f sv-fs"><span class="field-label">Limit n (primes below n, 3 to ' + MAX_N + ')</span><input class="input mono" id="sv-n" inputmode="numeric" autocomplete="off" value="50"></label>' +
          '<label class="sv-f sv-fg" hidden><span class="field-label">a (1 to ' + MAX_V + ')</span><input class="input mono" id="sv-a" inputmode="numeric" autocomplete="off" value="252"></label>' +
          '<label class="sv-f sv-fg" hidden><span class="field-label">b (1 to ' + MAX_V + ')</span><input class="input mono" id="sv-b" inputmode="numeric" autocomplete="off" value="105"></label>' +
          '<button class="btn" type="submit">Run it</button></div>' +
        '<div class="sv-toggles"><label class="sv-sw"><input type="checkbox" id="sv-gcd"> Euclid’s gcd steps instead of the sieve</label></div>' +
        '<p class="va-presets"><span class="faint">Try</span> <button class="chip" type="button" data-p="s30">limit 30</button><button class="chip" type="button" data-p="s60">limit 60</button>' +
        '<button class="chip" type="button" data-p="g1">gcd 252, 105</button><button class="chip" type="button" data-p="g2">gcd 89, 55 (slowest)</button>' +
        '<span class="faint">At limit 50 watch 5 start at 25, not 10. Flip the switch for the gcd.</span></p></form><div class="va-player"></div>';
      var $ = function (s) { return OR.$(s, host); }, slot = $('.va-player');

      function sync() {
        var g = $('#sv-gcd').checked;
        [].forEach.call(host.querySelectorAll('.sv-fg'), function (e) { e.hidden = !g; });
        $('.sv-fs').hidden = g;
      }
      function run() {
        sync();
        var g = $('#sv-gcd').checked, n = clampInt($('#sv-n').value, 3, MAX_N, 50), a = clampInt($('#sv-a').value, 1, MAX_V, 252), b = clampInt($('#sv-b').value, 1, MAX_V, 105);
        $('#sv-n').value = n; $('#sv-a').value = a; $('#sv-b').value = b;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: g ? gcdFrames(a, b) : sieveFrames(n), steps: g ? GCD_STEPS : SIEVE_STEPS,
          label: g ? 'Euclid gcd of ' + a + ' and ' + b : 'Sieve of Eratosthenes below ' + n,
          paint: function (stg, f) { paint(stg, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      $('form').addEventListener('submit', function (e) { e.preventDefault(); run(); });
      $('#sv-gcd').addEventListener('change', run);
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var k = b.dataset.p, gcd = k[0] === 'g';
        $('#sv-gcd').checked = gcd;
        if (k === 's30') $('#sv-n').value = 30; if (k === 's60') $('#sv-n').value = 60;
        if (k === 'g1') { $('#sv-a').value = 252; $('#sv-b').value = 105; }
        if (k === 'g2') { $('#sv-a').value = 89; $('#sv-b').value = 55; }
        run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
