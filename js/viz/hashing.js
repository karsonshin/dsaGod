/* Offer Ready: hash-table internals visualizer (separate chaining with doubling resize).
   The lesson template's marks are hash / scan / append / load / resize / rehash. Each frame is a snapshot,
   so stepping back repaints an earlier one. frames(keys, size) is the pure builder; paint/mount only draw it. */
(function () {
  'use strict';
  var OR = window.OR;
  var MAX_KEYS = 12, MIN_SIZE = 2, MAX_SIZE = 8, LIMIT = 0.75;
  var PRESETS = [['5, 13, 21, 29', 4], ['7, 12, 3, 19, 8, 21, 4', 4], ['10, 20, 30, 40, 50', 5], ['9, 17, 9, 25', 8]];
  var STEPS = {
    start: { label: 'Start' }, hash: { label: 'Hash', tone: 'accent' }, scan: { label: 'Scan chain', tone: 'accent' },
    append: { label: 'Append', tone: 'ok' }, load: { label: 'Load check' }, resize: { label: 'Grow', tone: 'hard' },
    rehash: { label: 'Rehash all', tone: 'hard' }, done: { label: 'Done' }
  };

  function parse(text) {
    return String(text).split(/[\s,]+/).filter(Boolean).slice(0, MAX_KEYS).map(function (t) { return Math.round(Number(t)); })
      .filter(isFinite).map(function (n) { return Math.max(0, Math.min(999, n)); });
  }
  function parseSize(v) { return Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(Number(v)) || 4)); }

  function make(n) { var a = []; for (var i = 0; i < n; i++) a.push([]); return a; }

  function frames(keys, size0) {
    var out = [], buckets = make(size0), count = 0, key = null, idx = -1, grows = 0;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, key: key, idx: idx, size: buckets.length, count: count,
        buckets: buckets.map(function (c) { return c.slice(); }) }, x));
    }
    snap('start', keys.length ? 'An empty table with ' + size0 + ' buckets. Each key goes to bucket key % size; keys that share a bucket form a chain.' : 'Add at least one key to run it.');
    keys.forEach(function (k) {
      key = k; idx = k % buckets.length;
      snap('hash', 'key ' + k + ': ' + k + ' % ' + buckets.length + ' = ' + idx + '. Bucket ' + idx + ' is where ' + k + ' must live, and where any lookup for it will go.');
      var chain = buckets[idx];
      if (chain.indexOf(k) >= 0) {
        snap('scan', 'Scan bucket ' + idx + ' [' + chain.join(', ') + ']: ' + k + ' is already there. A set keeps one copy, so nothing is added.', { hit: true });
        return;
      }
      snap('scan', chain.length ? 'Collision: bucket ' + idx + ' already holds [' + chain.join(', ') + ']. ' + k + ' is not in it, so it will join the chain. A lookup now has to walk ' + (chain.length + 1) + ' entries.' : 'Bucket ' + idx + ' is empty, so no collision.', { collide: chain.length > 0 });
      chain.push(k); count++;
      snap('append', 'Append ' + k + ' to bucket ' + idx + '. The table now holds ' + count + ' key' + (count === 1 ? '' : 's') + '.', { fresh: true });
      var over = count > LIMIT * buckets.length;
      snap('load', 'Load factor = ' + count + ' / ' + buckets.length + ' = ' + (count / buckets.length).toFixed(2) + (over ? ', above ' + LIMIT + '. Chains are getting long.' : ', within ' + LIMIT + '. Keep going.'), { over: over });
      if (over) {
        var old = buckets, ns = old.length * 2;
        snap('resize', 'Allocate ' + ns + ' empty buckets. The old size no longer fits, because ' + 'a key’s bucket is key % size, and the size just changed.', { grow: ns });
        buckets = make(ns); grows++; idx = -1;
        old.forEach(function (c) { c.forEach(function (x) { buckets[x % ns].push(x); }); });
        snap('rehash', 'Rehash every key into the new table: each one is recomputed as key % ' + ns + '. That cost ' + count + ' moves, but it is paid only when the size doubles, so it averages O(1) per insert.', { moved: true });
      }
    });
    key = null; idx = -1;
    var longest = buckets.reduce(function (m, c) { return Math.max(m, c.length); }, 0);
    snap('done', keys.length ? count + ' key' + (count === 1 ? '' : 's') + ' in ' + buckets.length + ' buckets after ' + grows + ' resize' + (grows === 1 ? '' : 's') + '. Longest chain: ' + longest + '.' + (longest >= 4 ? ' A chain this long means lookups are scanning, not jumping: the keys share a factor with the size, or the hash is weak.' : ' Short chains keep every lookup near O(1).') : 'Nothing to insert.', { final: true });
    return out;
  }

  function paint(stage, f) {
    var rows = f.buckets.map(function (chain, i) {
      var on = i === f.idx && (f.step === 'hash' || f.step === 'scan' || f.step === 'append' || f.step === 'load');
      var chips = chain.map(function (x, j) {
        var cls = 'va-kv';
        if (f.moved) cls += ' hv-moved';
        else if (f.step === 'scan' && on && f.hit && x === f.key) cls += ' hv-hit';
        else if (f.step === 'scan' && on && f.collide) cls += ' bad';
        else if (f.fresh && on && j === chain.length - 1) cls += ' hv-new';
        return '<span class="' + cls + '">' + x + '</span>';
      }).join('');
      return '<div class="hv-row' + (on ? ' cur' : '') + '"><span class="hv-i">' + i + '</span><span class="hv-chain">' + (chips || '<span class="faint">empty</span>') + '</span></div>';
    }).join('');
    var load = f.count + ' / ' + f.size + ' = ' + (f.count / f.size).toFixed(2);
    stage.innerHTML = '<div class="va"><div class="hv" aria-hidden="true">' + rows + '</div>' +
      (f.grow ? '<p class="hv-ghost">Allocating a new array of ' + f.grow + ' empty buckets&hellip;</p>' : '') +
      '<dl class="va-read"><div><dt>key</dt><dd>' + (f.key === null ? '<span class="faint">—</span>' : '<b class="num">' + f.key + '</b>') + '</dd></div>' +
      '<div><dt>key % size</dt><dd>' + (f.key === null ? '<span class="faint">—</span>' : '<b class="num">' + f.key + ' % ' + f.size + ' = ' + (f.key % f.size) + '</b>') + '</dd></div>' +
      '<div><dt>load</dt><dd><b class="num"' + (f.over ? ' style="color:var(--hard)"' : '') + '>' + load + '</b><span class="faint">limit ' + LIMIT + '</span></dd></div></dl></div>';
  }

  OR.viz['hashing'] = {
    frames: frames, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="hs-in">Keys (up to ' + MAX_KEYS + ', each 0 to 999) and the starting number of buckets (' + MIN_SIZE + ' to ' + MAX_SIZE + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="hs-in" spellcheck="false" autocomplete="off" aria-label="Keys, separated by commas" value="' + PRESETS[0][0] + '">' +
        '<input class="input mono" id="hs-sz" inputmode="numeric" spellcheck="false" autocomplete="off" aria-label="Starting bucket count" style="flex:0 0 5rem" value="' + PRESETS[0][1] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, k) { return '<button class="chip" type="button" data-k="' + k + '">' + p[0] + ' &middot; ' + p[1] + ' buckets</button>'; }).join('') +
        '<span class="faint">“10, 20, 30, 40, 50” with 5 buckets shows a bad fit: doubling to 10 does not spread them.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#hs-in', host), sz = OR.$('#hs-sz', host), slot = OR.$('.va-player', host);

      function run() {
        var keys = parse(input.value), size = parseSize(sz.value);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(keys, size), steps: STEPS, label: 'Hash table with chaining: insert [' + keys.join(', ') + '] into ' + size + ' buckets',
          paint: function (stage, f) { paint(stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-k]'); if (!b) return;
        input.value = PRESETS[b.dataset.k][0]; sz.value = PRESETS[b.dataset.k][1]; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
