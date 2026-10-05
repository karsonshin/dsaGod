/* Offer Ready: knapsack visualizer (1-D max-value DP, the lesson's template), with a 0/1 vs unbounded toggle.
   Each frame is a snapshot of the run, so stepping back is just painting an earlier frame. Frame steps match the
   template's #@item/#@loop/#@cell marks, which light up in sync. The only difference between the modes is the
   direction of the capacity loop, and the "uses" line under each cell shows what that direction does. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_ITEMS = 5, MAX_CAP = 12, MAX_W = 9, MAX_V = 99;
  var PRESETS = [['3:5', 9, 'one heavy item'], ['1:1 3:4 4:5', 7, 'three items'], ['2:3 5:9 4:5', 10, 'two sizes']];
  var STEPS = {
    start: { label: 'Start' }, item: { label: 'Next item' }, loop: { label: 'Visit capacity', tone: 'accent' },
    cell: { label: 'Take or skip', tone: 'ok' }, done: { label: 'Done' }
  };

  function parse(text) {
    var out = [], re = /(\d+)\s*[:,x]\s*(\d+)/g, m;
    while ((m = re.exec(String(text))) && out.length < MAX_ITEMS) {
      var w = Math.min(MAX_W, Math.max(1, +m[1])), v = Math.min(MAX_V, +m[2]);
      out.push({ w: w, v: v });
    }
    return out;
  }

  function solve(items, cap, up) {
    var dp = []; for (var i = 0; i <= cap; i++) dp.push(0);
    items.forEach(function (t) {
      if (up) for (var c = t.w; c <= cap; c++) dp[c] = Math.max(dp[c], dp[c - t.w] + t.v);
      else for (var d = cap; d >= t.w; d--) dp[d] = Math.max(dp[d], dp[d - t.w] + t.v);
    });
    return dp[cap];
  }

  function frames(items, cap, up) {
    var out = [], dp = [], uses = [], took = [], it = -1, c = -1, src = -1, i;
    for (i = 0; i <= cap; i++) { dp.push(0); uses.push(0); }
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, it: it, c: c, src: src, dp: dp.slice(), uses: uses.slice(), took: took.slice() }, x));
    }
    snap('start', 'dp[c] is the best value that fits in capacity c. With no items yet, every capacity holds value 0.');
    for (it = 0; it < items.length; it++) {
      var w = items[it].w, v = items[it].v;
      uses = uses.map(function () { return 0; }); took = []; c = -1; src = -1;
      snap('item', 'Item ' + (it + 1) + ': weight ' + w + ', value ' + v + '. ' + (w > cap ? 'It is heavier than the whole capacity, so nothing changes.'
        : 'Visit capacities ' + (up ? w + ' up to ' + cap + ' (upward: this item can be reused)' : cap + ' down to ' + w + ' (downward: this item is used at most once)') + '.'));
      for (var k = 0; k <= cap - w; k++) {
        c = up ? w + k : cap - k; src = c - w;
        var a = dp[c], b = dp[src] + v;
        snap('loop', 'Capacity ' + c + ': skip keeps dp[' + c + '] = ' + a + '. Take adds the item (' + v + ') to dp[' + src + '] = ' + (b - v) + ', giving ' + b + '.', { math: 'max(' + a + ', ' + (b - v) + ' + ' + v + ') = max(' + a + ', ' + b + ')' });
        if (b > a) {
          dp[c] = b; uses[c] = uses[src] + 1; took[c] = true;
          snap('cell', 'Take wins: dp[' + c + '] = ' + b + '. ' + (uses[c] > 1
            ? 'But dp[' + src + '] was already updated for this item, so it holds ' + uses[src] + ' copy(ies) of it already. This cell reuses the item ' + uses[c] + ' times.'
            : (up ? 'dp[' + src + '] has no copy of this item yet.' : 'dp[' + src + '] is still the row from before this item (it is lower, so not visited yet), so this is the first use.')), { math: 'dp[' + c + '] = ' + b });
        } else {
          snap('cell', 'Skip wins (or ties): dp[' + c + '] stays ' + a + '.', { math: 'dp[' + c + '] = ' + a });
        }
      }
    }
    it = -1; c = -1; src = -1; took = [];
    var other = solve(items, cap, !up);
    snap('done', 'Best value in capacity ' + cap + ': ' + dp[cap] + '. ' + (other === dp[cap] ? 'The other direction gives the same answer on this input; try the one heavy item preset.'
      : 'The ' + (up ? '0/1 (downward)' : 'unbounded (upward)') + ' loop would give ' + other + ': the direction decides whether an item may be reused.'), { final: true, math: 'answer = dp[' + cap + '] = ' + dp[cap] });
    return out;
  }

  function stageHTML(items, cap) {
    var n = cap + 1, idx = '', cells = '', i;
    for (i = 0; i < n; i++) { idx += '<div class="dpk-idx">' + i + '</div>'; cells += '<div class="dpk-cell"><div class="dpk-box"><b></b><small></small></div></div>'; }
    return '<div class="dpk" style="--n:' + n + '"><div class="dpk-items" aria-hidden="true">' + items.map(function (t, j) {
      return '<span class="dpk-item" data-i="' + j + '"><span>w ' + t.w + '</span><span>v ' + t.v + '</span></span>';
    }).join('') + '</div><div><div class="dpk-grid dpk-idxrow" aria-hidden="true">' + idx + '</div><div class="dpk-grid dpk-cells">' + cells + '</div>' +
      '<div class="dpk-arrow off" aria-hidden="true"><svg viewBox="0 0 ' + n + ' 1" preserveAspectRatio="none"><path d=""/></svg><span class="dpk-head"></span></div></div>' +
      '<p class="dpk-math mono" aria-live="off"></p><dl class="va-read"><div><dt>capacity</dt><dd>' + cap + '</dd></div><div><dt>dp[' + cap + ']</dt><dd class="dpk-best"></dd></div></dl></div>';
  }

  function paint(items, cap, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(items, cap);
    var n = cap + 1;
    OR.$$('.dpk-item', stage).forEach(function (el, j) { el.className = 'dpk-item' + (j === f.it ? ' on' : j < f.it || f.final ? ' past' : ''); });
    OR.$$('.dpk-box', stage).forEach(function (el, i) {
      el.className = 'dpk-box' + (f.took[i] ? (f.uses[i] > 1 ? ' twice' : ' upd') : '') + (i === f.src ? ' src' : '') + (i === f.c ? ' cur' : '');
      OR.$('b', el).textContent = f.dp[i];
      OR.$('small', el).textContent = f.uses[i] > 1 ? 'x' + f.uses[i] : f.took[i] ? 'x1' : '';
    });
    var ar = OR.$('.dpk-arrow', stage), on = f.c >= 0 && f.src >= 0 && f.step !== 'item' && !f.final;
    ar.classList.toggle('off', !on);
    if (on) {
      var s = f.src + 0.5, d = f.c + 0.5;
      OR.$('path', ar).setAttribute('d', 'M ' + s + ' 0 C ' + s + ' 1.3 ' + d + ' 1.3 ' + d + ' 0');
      OR.$('.dpk-head', ar).style.left = (d / n * 100) + '%';
    }
    OR.$('.dpk-math', stage).textContent = f.math && (f.step === 'loop' || f.step === 'cell' || f.final) ? f.math : '';
    OR.$('.dpk-best', stage).innerHTML = '<b class="num">' + f.dp[cap] + '</b>';
  }

  OR.viz['dp-knapsack'] = {
    frames: frames, solve: solve, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, up = false;
      host.innerHTML = '<form class="va-input" novalidate><div class="dpk-fields"><div class="dpk-f-items"><label class="field-label" for="dpk-in">Items as weight:value (up to ' + MAX_ITEMS + ')</label>' +
        '<input class="input mono" id="dpk-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0][0] + '"></div>' +
        '<div class="dpk-f-cap"><label class="field-label" for="dpk-cap">Capacity</label><input class="input mono" id="dpk-cap" inputmode="numeric" maxlength="2" value="' + PRESETS[0][1] + '"></div>' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="dpk-modes" role="group" aria-label="Item reuse"><span class="faint">Each item</span> <button class="chip" type="button" data-up="0" aria-pressed="true">once (0/1): capacity loop goes down</button>' +
        '<button class="chip" type="button" data-up="1" aria-pressed="false">unlimited: capacity loop goes up</button></p>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + esc(p[0]) + ' cap ' + p[1] + '</button>'; }).join('') +
        '<span class="faint">“3:5”, 9 shows the difference most clearly: 5 versus 15.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#dpk-in', host), capIn = OR.$('#dpk-cap', host), slot = OR.$('.va-player', host);

      function run() {
        var items = parse(input.value), cap = Math.min(MAX_CAP, Math.max(1, parseInt(capIn.value, 10) || 1));
        if (!items.length) items = parse(PRESETS[0][0]);
        capIn.value = cap;
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(items, cap, up), steps: STEPS, label: 'Knapsack DP, ' + (up ? 'unbounded' : '0/1') + ', capacity ' + cap,
          paint: function (stage, f) { paint(items, cap, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var m = e.target.closest('[data-up]'), p = e.target.closest('[data-p]');
        if (m) {
          up = m.dataset.up === '1';
          OR.$$('[data-up]', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b === m)); });
          run();
        } else if (p) { input.value = PRESETS[+p.dataset.p][0]; capIn.value = PRESETS[+p.dataset.p][1]; run(); }
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
