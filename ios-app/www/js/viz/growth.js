/* Offer Ready: growth-curve visualizer (Big-O lesson; reused by the competitive programming starter).
   Pick n, then step through the six common complexity classes. Every frame is a snapshot, so stepping back
   just repaints. Frame steps match the template's #@const/#@log/#@linear/#@nlogn/#@quad/#@exp marks.
   Step counts follow the template exactly: log = floor(log2 n), n log n = n * floor(log2 n). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_N = 1000000, PRESETS = [10, 50, 1000, 100000, 1000000], BUDGET = 8; // 10^8 simple steps: the usual one-second rule of thumb
  var CLASSES = [
    { k: 'const', big: 'O(1)', tone: 'ok', name: 'Constant' },
    { k: 'log', big: 'O(log n)', tone: 'ok', name: 'Logarithmic' },
    { k: 'linear', big: 'O(n)', tone: 'ok', name: 'Linear' },
    { k: 'nlogn', big: 'O(n log n)', tone: 'accent', name: 'Linearithmic' },
    { k: 'quad', big: 'O(n²)', tone: 'hard', name: 'Quadratic' },
    { k: 'exp', big: 'O(2ⁿ)', tone: 'hard', name: 'Exponential' }
  ];
  var STEPS = { start: { label: 'Start' }, done: { label: 'Compare' } };
  CLASSES.forEach(function (c) { STEPS[c.k] = { label: c.big, tone: c.tone }; });
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

  // log10 of the step count at n, matching the template (floor(log2 n) rounds). -Infinity means zero steps.
  function lg(k, n) {
    var l = Math.floor(Math.log2(n));
    switch (k) {
      case 'const': return 0;
      case 'log': return Math.log10(l);
      case 'linear': return Math.log10(n);
      case 'nlogn': return Math.log10(n) + Math.log10(l);
      case 'quad': return 2 * Math.log10(n);
      default: return n * Math.LOG10E * Math.LN2; // 2^n
    }
  }
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  // 1,234 below a million; 1.2 × 10⁹ above. Takes log10 so 2^1000 is still printable.
  function fmt(l) {
    if (l === -Infinity) return '0';
    if (l < 6) return Math.round(Math.pow(10, l)).toLocaleString('en-US');
    var e = Math.floor(l), m = Math.pow(10, l - e);
    if (m >= 9.95) { m = 1; e++; }
    return m.toFixed(1) + ' × 10^' + e;
  }
  function svgPow(t) { return '10<tspan dy="-4" font-size="8">' + t + '</tspan>'; }
  function fits(l) { return l <= BUDGET + 1e-9; }

  function frames(n) {
    var L = {}, out = [];
    CLASSES.forEach(function (c) { L[c.k] = lg(c.k, n); });
    var steps = Math.floor(Math.log2(n));
    function snap(step, note, extra) { out.push(Object.assign({ step: step, note: note, n: n, lg: L }, extra)); }
    var at = function (k) { return fmt(L[k]); };
    snap('start', 'Six curves, one question: how many steps does each take when the input has n = ' + n.toLocaleString('en-US') + ' items? The dashed line is 10⁸ steps, about what one second buys in a compiled language. Step through, or pick a class.');
    snap('const', 'The work doesn’t depend on n. Reading arr[i] or one hash-map entry costs the same for 10 items or 10 million. Steps at this n: 1.', { sel: 'const' });
    snap('log', 'Every step throws away a fraction of what’s left, usually half. Binary search is the classic. Halving ' + n.toLocaleString('en-US') + ' down to 1 takes ' + steps + ' step' + (steps === 1 ? '' : 's') + '.', { sel: 'log' });
    snap('linear', 'Look at each item once. A scan, a sum, building a hash map. Steps at this n: ' + at('linear') + '.', { sel: 'linear' });
    snap('nlogn', 'n items that each cost about log n, or log n levels of n work. Sorting and heap-based top-k live here. Steps: ' + at('nlogn') + ', only ' + steps + ' times the linear scan.', { sel: 'nlogn' });
    snap('quad', 'A loop inside a loop over the same n, so every pair gets visited. Steps: ' + at('quad') + (fits(L.quad) ? ', still inside the budget.' : ', past the 10⁸ line: too slow.'), { sel: 'quad' });
    snap('exp', 'Every extra item doubles the work, as when you try every subset. Steps: ' + at('exp') + (n <= 26 ? '.' : '. Nothing finishes: even n = 30 is already about 10⁹.'), { sel: 'exp' });
    var ok = CLASSES.filter(function (c) { return fits(L[c.k]); }).map(function (c) { return c.big; });
    snap('done', 'At n = ' + n.toLocaleString('en-US') + ', ' + (ok.length ? ok.join(', ') + ' fit' + (ok.length === 1 ? 's' : '') + ' the 10⁸ budget' : 'nothing fits the 10⁸ budget') + '. Read the input limit first, then pick the slowest class that still fits. Try 100,000: n log n passes and n² does not.', { final: true });
    return out;
  }

  var uid = 0, cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    var s = document.createElement('style');
    s.textContent =
      '.gr{display:grid;gap:var(--s-4)}' +
      '.gr-svg{width:100%;height:auto;display:block;overflow:visible}' +
      '.gr-grid{stroke:var(--line);stroke-width:1}' +
      '.gr-axis{stroke:var(--line-strong);stroke-width:1}' +
      '.gr-tick{fill:var(--ink-3);font:500 10px var(--font-mono)}' +
      '.gr-budget{stroke:var(--hard);stroke-width:1.25;stroke-dasharray:5 4}' +
      '.gr-budget-t{fill:var(--hard);font:600 10px var(--font-mono)}' +
      '.gr-curve{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-linejoin:round;opacity:.55;transition:stroke var(--dur-2) var(--ease-out),stroke-width var(--dur-2) var(--ease-out),opacity var(--dur-2) var(--ease-out)}' +
      '.gr-curve.ok{stroke:var(--ok)}.gr-curve.accent{stroke:var(--accent)}.gr-curve.hard{stroke:var(--hard)}' +
      '.gr-curve.on{stroke-width:3.5;opacity:1}.gr-curve.mute{stroke:var(--ink-3)}' +
      '.gr-dot{stroke:var(--surface);stroke-width:2}.gr-dot.ok{fill:var(--ok)}.gr-dot.accent{fill:var(--accent)}.gr-dot.hard{fill:var(--hard)}' +
      '.gr-lab{font:700 11px var(--font-mono);fill:var(--ink)}' +
      '.gr-rows{list-style:none;margin:0;padding:0;display:grid;gap:2px}' +
      '.gr-row{display:grid;grid-template-columns:1.2rem 7.5rem minmax(0,1fr) auto;align-items:center;gap:var(--s-3);width:100%;padding:var(--s-2) var(--s-3);border:1px solid transparent;border-radius:var(--r-2);background:none;color:var(--ink);text-align:left;font:inherit;font-size:var(--text-sm);cursor:pointer;min-height:40px}' +
      '.gr-row:hover{background:var(--surface-2)}' +
      '.gr-row[aria-current="true"]{background:var(--accent-soft);border-color:var(--accent-line)}' +
      '.gr-sw{width:12px;height:12px;border-radius:3px;background:var(--ink-3)}' +
      '.gr-sw.ok{background:var(--ok)}.gr-sw.accent{background:var(--accent)}.gr-sw.hard{background:var(--hard)}' +
      '.gr-big{font:600 var(--text-sm)/1.2 var(--font-mono);font-stretch:var(--stretch-mono)}' +
      '.gr-ops{font:var(--text-xs)/1.2 var(--font-mono);font-stretch:var(--stretch-mono);color:var(--ink-2);font-variant-numeric:tabular-nums}' +
      '.gr-verdict{font:600 var(--text-2xs)/1 var(--font-mono);font-stretch:var(--stretch-mono);padding:3px 6px;border-radius:var(--r-1);white-space:nowrap}' +
      '.gr-verdict.fit{background:var(--ok-soft);color:var(--ok)}.gr-verdict.slow{background:var(--hard-soft);color:var(--hard)}' +
      '@media (max-width:760px){.gr-row{grid-template-columns:1rem minmax(0,1fr) auto;row-gap:2px}.gr-row .gr-name{display:none}.gr-ops{grid-column:2 / 3;grid-row:2}.gr-verdict{grid-row:1 / 3;grid-column:3}}' +
      '@media (prefers-reduced-motion:reduce){.gr-curve{transition:none}}';
    document.head.appendChild(s);
  }

  var W = 600, H = 270, PL = 46, PR = 520, PT = 14, PB = 232;

  function stageHTML(n) {
    var id = ++uid, X = Math.max(n, 2), ymax = Math.max(9, 3 * Math.ceil(Math.max(2 * Math.log10(n), 1) / 3));
    function px(x) { return PL + (x - 1) / (X - 1) * (PR - PL); }
    function py(l) { return PT + (1 - Math.min(Math.max(l, 0), ymax + 1) / ymax) * (PB - PT); }
    var grid = '', ticks = '';
    for (var t = 0; t <= ymax; t += 3) {
      grid += '<line class="gr-grid" x1="' + PL + '" x2="' + PR + '" y1="' + py(t).toFixed(1) + '" y2="' + py(t).toFixed(1) + '"/>';
      ticks += '<text class="gr-tick" x="' + (PL - 6) + '" y="' + (py(t) + 3).toFixed(1) + '" text-anchor="end">' + svgPow(t) + '</text>';
    }
    var curves = CLASSES.map(function (c) {
      var d = '';
      for (var i = 0; i <= 80; i++) {
        var x = 1 + (X - 1) * i / 80, l = Math.floor(Math.log2(x)), v;
        // smooth versions of the template's step counts, so the curves don't stair-step
        var lx = Math.log2(x);
        v = c.k === 'const' ? 0 : c.k === 'log' ? Math.log10(Math.max(lx, 1)) : c.k === 'linear' ? Math.log10(x)
          : c.k === 'nlogn' ? Math.log10(x) + Math.log10(Math.max(lx, 1)) : c.k === 'quad' ? 2 * Math.log10(x) : x * Math.LOG10E * Math.LN2;
        d += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(v).toFixed(1);
      }
      return '<path class="gr-curve" data-k="' + c.k + '" d="' + d + '"/>';
    }).join('');
    var by = py(BUDGET).toFixed(1);
    var svg = '<svg class="gr-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Steps against input size for six complexity classes, vertical axis logarithmic. The dashed line marks 10 to the 8th steps.">' +
      '<defs><clipPath id="gr-clip-' + id + '"><rect x="' + PL + '" y="' + PT + '" width="' + (PR - PL + 2) + '" height="' + (PB - PT) + '"/></clipPath></defs>' +
      grid + '<line class="gr-axis" x1="' + PL + '" x2="' + PR + '" y1="' + PB + '" y2="' + PB + '"/>' + ticks +
      '<text class="gr-tick" x="' + PL + '" y="' + (PB + 16) + '">n = 1</text><text class="gr-tick" x="' + PR + '" y="' + (PB + 16) + '" text-anchor="end">n = ' + n.toLocaleString('en-US') + '</text>' +
      '<text class="gr-tick" x="' + PL + '" y="' + (PT - 3) + '">steps (log scale)</text>' +
      '<g clip-path="url(#gr-clip-' + id + ')">' + curves + '</g>' +
      '<line class="gr-budget" x1="' + PL + '" x2="' + PR + '" y1="' + by + '" y2="' + by + '"/>' +
      '<text class="gr-budget-t" x="' + (PL + 6) + '" y="' + (Number(by) - 5) + '">' + svgPow(8) + ' steps: about one second</text>' +
      '<circle class="gr-dot" r="6" cx="' + PR + '" cy="0" style="display:none"/>' +
      '<text class="gr-lab" x="' + (PR + 10) + '" y="0" style="display:none"></text></svg>';
    var rows = '<ul class="gr-rows">' + CLASSES.map(function (c) {
      return '<li><button class="gr-row" type="button" data-k="' + c.k + '" aria-current="false"><i class="gr-sw"></i><span class="gr-big">' + esc(c.big) + '</span><span class="gr-ops"></span><span class="gr-verdict"></span></button></li>';
    }).join('') + '</ul>';
    return '<div class="gr" data-ymax="' + ymax + '">' + svg + rows + '</div>';
  }

  function paint(n, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(n);
    var ymax = +OR.$('.gr', stage).dataset.ymax, byK = {};
    CLASSES.forEach(function (c) { byK[c.k] = c; });
    OR.$$('.gr-curve', stage).forEach(function (p) {
      var c = byK[p.dataset.k], on = f.sel === c.k, toned = f.final || on;
      p.setAttribute('class', 'gr-curve ' + (toned ? c.tone : 'mute') + (on ? ' on' : ''));
    });
    OR.$$('.gr-row', stage).forEach(function (b) {
      var c = byK[b.dataset.k], l = f.lg[c.k], on = f.sel === c.k;
      b.setAttribute('aria-current', String(on));
      OR.$('.gr-sw', b).className = 'gr-sw' + (f.step === 'start' ? '' : ' ' + c.tone);
      OR.$('.gr-ops', b).textContent = fmt(l) + (c.k === 'const' ? ' step' : ' steps') + ' at n = ' + n.toLocaleString('en-US');
      var v = OR.$('.gr-verdict', b);
      v.className = 'gr-verdict ' + (fits(l) ? 'fit' : 'slow');
      v.textContent = fits(l) ? 'fits' : 'too slow';
    });
    var dot = OR.$('.gr-dot', stage), lab = OR.$('.gr-lab', stage);
    if (f.sel) {
      var c = byK[f.sel], y = PT + (1 - Math.min(Math.max(f.lg[f.sel], 0), ymax + 1) / ymax) * (PB - PT);
      dot.setAttribute('cy', y.toFixed(1)); dot.setAttribute('class', 'gr-dot ' + c.tone); dot.style.display = '';
      lab.setAttribute('y', (Math.max(y, PT + 8) + 4).toFixed(1)); lab.textContent = c.big; lab.style.display = '';
    } else { dot.style.display = 'none'; lab.style.display = 'none'; }
  }

  function clampN(v) { v = Math.round(+v); return isFinite(v) ? Math.min(Math.max(v, 1), MAX_N) : 1000; }

  OR.viz['growth'] = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      css();
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="gr-in">Input size n (1 to 1,000,000)</label>' +
        '<div class="va-input-row"><input class="input mono" id="gr-in" inputmode="numeric" autocomplete="off" value="1000">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-n="' + p + '">' + p.toLocaleString('en-US') + '</button>'; }).join('') +
        '<span class="faint">100,000 is where O(n log n) still fits and O(n²) doesn’t.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#gr-in', host), slot = OR.$('.va-player', host), cur = 1000;

      function run(v, at) {
        cur = clampN(v); input.value = cur;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(cur), steps: STEPS, label: 'Growth curves at n = ' + cur,
          paint: function (stage, f) { paint(cur, stage, f); mark(f.sel || null); }
        });
        if (at) player.seek(at);
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-n]');
        if (b) { run(b.dataset.n); return; }
        var r = e.target.closest('.gr-row'); // the rows double as a picker: jump to that class
        if (r && player) { player.pause(); player.seek(1 + CLASSES.map(function (c) { return c.k; }).indexOf(r.dataset.k)); }
      });
      run(cur);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
