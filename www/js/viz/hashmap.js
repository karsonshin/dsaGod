/* Offer Ready: hash-map visualizer (Two Sum, complement search). The lesson template's marks are
   visit / need / look / found / store. Each frame is a snapshot, so stepping back repaints an earlier one.
   Reusable: frames(nums, target) is the pure builder; paint/mount only draw it. */
(function () {
  'use strict';
  var OR = window.OR;
  var MAX = 12, PRESETS = [['2, 7, 11, 15', 9], ['3, 2, 4', 6], ['3, 3', 6], ['1, 5, 8, 3', 20]];
  var STEPS = {
    start: { label: 'Start' }, visit: { label: 'Take next', tone: 'accent' }, need: { label: 'Compute need' },
    look: { label: 'Look up' }, found: { label: 'Pair found', tone: 'ok' }, store: { label: 'Store' }, done: { label: 'Done' }
  };

  function parse(text) {
    return String(text).split(/[\s,]+/).filter(Boolean).slice(0, MAX).map(function (t) { return Math.round(Number(t)); })
      .filter(isFinite).map(function (n) { return Math.max(-99, Math.min(99, n)); });
  }

  function frames(nums, target) {
    var out = [], map = [], cur = -1, need = null, hit = -1, pair = null;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, i: cur, need: need, hit: hit, pair: pair, target: target,
        map: map.map(function (e) { return e.slice(); }) }, x));
    }
    snap('start', nums.length ? 'The map is empty. Walk the array once; for each number, ask the map before you add to it.' : 'Add at least one number to run it.');
    for (var i = 0; i < nums.length; i++) {
      var x = nums[i]; cur = i; need = null; hit = -1;
      snap('visit', 'i = ' + i + ': take ' + x + '.');
      need = target - x;
      snap('need', 'need = ' + target + ' - ' + x + ' = ' + need + '. That is the partner that would complete the pair.');
      var at = -1;
      map.forEach(function (e) { if (e[0] === need) at = e[1]; });
      hit = at;
      if (at >= 0) {
        snap('look', 'Is ' + need + ' in the map? Yes, it was stored at index ' + at + '.');
        pair = [at, i];
        snap('found', 'Return [' + at + ', ' + i + ']: ' + nums[at] + ' + ' + x + ' = ' + target + '.');
        snap('done', 'Done after ' + (i + 1) + ' of ' + nums.length + ' numbers. Every number was looked at once, with one O(1) lookup each: O(n).', { final: true });
        return out;
      }
      snap('look', 'Is ' + need + ' in the map? No, nothing seen so far pairs with ' + x + '.');
      var old = -1;
      map.forEach(function (e, k) { if (e[0] === x) old = k; });
      if (old >= 0) map[old][1] = i; else map.push([x, i]);
      hit = -1;
      snap('store', 'Store ' + x + ' → ' + i + (old >= 0 ? ' (replacing the older index for ' + x + ')' : '') + ', so a later number can find it.');
    }
    cur = -1; need = null;
    snap('done', nums.length ? 'Reached the end: no two numbers add up to ' + target + '. The answer is empty.' : 'Nothing to search.', { final: true });
    return out;
  }

  function stageHTML(nums) {
    var cells = nums.map(function (n, i) { return '<span class="va-cell"><b>' + n + '</b><small>' + i + '</small></span>'; }).join('');
    return '<div class="va" style="--n:' + nums.length + '"><div class="va-row" aria-hidden="true">' + cells + '</div>' +
      '<div class="va-ptrs" aria-hidden="true"><span class="va-ptr" data-p="l">partner</span><span class="va-ptr" data-p="r">i</span></div>' +
      '<dl class="va-read"><div><dt>target</dt><dd class="hm-target"></dd></div><div><dt>need</dt><dd class="hm-need"></dd></div>' +
      '<div><dt>seen</dt><dd class="hm-map"></dd></div></dl></div>';
  }

  function paint(nums, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(nums);
    var stored = f.map.map(function (e) { return e[1]; });
    OR.$$('.va-cell', stage).forEach(function (el, i) {
      var inPair = f.pair && (i === f.pair[0] || i === f.pair[1]);
      el.className = 'va-cell' + (inPair ? ' ok' : stored.indexOf(i) >= 0 ? ' in' : '') + (i === f.i && !f.final ? ' cur' : '');
    });
    OR.$$('.va-ptr', stage).forEach(function (p) {
      var at = p.dataset.p === 'l' ? (f.pair ? f.pair[0] : f.hit) : f.i;
      p.style.setProperty('--i', Math.max(at, 0));
      p.classList.toggle('off', at < 0 || (p.dataset.p === 'r' && !!f.final && !f.pair));
    });
    OR.$('.hm-target', stage).innerHTML = '<b class="num">' + f.target + '</b>';
    OR.$('.hm-need', stage).innerHTML = f.need === null ? '<span class="faint">—</span>' : '<b class="num">' + f.need + '</b>';
    OR.$('.hm-map', stage).innerHTML = f.map.length ? f.map.map(function (e) {
      var hot = e[0] === f.need && f.hit >= 0 && (f.step === 'look' || f.step === 'found' || f.step === 'done');
      return '<span class="va-kv"' + (hot ? ' style="background:var(--ok-soft);border-color:var(--ok);color:var(--ok)"' : '') + '>' + e[0] + ' → <b>' + e[1] + '</b></span>';
    }).join('') : '<span class="faint">{}</span>';
  }

  OR.viz['hashmap'] = {
    frames: frames, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="hm-in">Numbers (up to ' + MAX + ', each from -99 to 99) and a target</label>' +
        '<div class="va-input-row"><input class="input mono" id="hm-in" spellcheck="false" autocomplete="off" aria-label="Numbers, separated by commas" value="' + PRESETS[0][0] + '">' +
        '<input class="input mono" id="hm-tg" inputmode="numeric" spellcheck="false" autocomplete="off" aria-label="Target" style="flex:0 0 5rem" value="' + PRESETS[0][1] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, k) { return '<button class="chip" type="button" data-k="' + k + '">' + p[0] + ' &rarr; ' + p[1] + '</button>'; }).join('') +
        '<span class="faint">“3, 2, 4” with target 6 catches anyone who stores before they look.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#hm-in', host), tg = OR.$('#hm-tg', host), slot = OR.$('.va-player', host);

      function run() {
        var nums = parse(input.value), target = Math.max(-999, Math.min(999, Math.round(Number(tg.value)) || 0));
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(nums, target), steps: STEPS, label: 'Two Sum on [' + nums.join(', ') + '], target ' + target,
          paint: function (stage, f) { paint(nums, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-k]'); if (!b) return;
        input.value = PRESETS[b.dataset.k][0]; tg.value = PRESETS[b.dataset.k][1]; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
