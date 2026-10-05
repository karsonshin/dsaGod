/* Offer Ready: LRU cache visualizer (design-ds lesson).
   Input: capacity (1 to 4) and an operation list such as "put 1 1, put 2 2, get 1, put 3 3".
   Shows the hash map (key -> node) and the doubly linked list in recency order: the front (next to HEAD) is the most recent,
   the node next to TAIL is the one evicted. A touched node is lifted out, then dropped in at the front.
   Frames are snapshots; frame steps match the template marks lookup/miss/update/add/unlink/front/hit/over/evict.
   Styles: css/viz/lru.css (.lru-*; readouts reuse .va-* from app.css). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXCAP = 4, MAXOPS = 12, MAXKEYS = 8;
  var PRESETS = [
    { c: 2, o: 'put 1 1, put 2 2, get 1, put 3 3, get 2, put 4 4, get 1, get 3, get 4', label: 'Classic: get saves a key' },
    { c: 2, o: 'put 1 1, put 2 2, put 1 9, put 3 3, get 2, get 1', label: 'An update counts as a use' },
    { c: 3, o: 'put 1 1, put 2 2, put 3 3, get 1, get 2, put 4 4, put 5 5, get 3', label: 'Capacity 3' }
  ];
  var STEPS = {
    start: { label: 'Start' }, lookup: { label: 'Look in the map' }, miss: { label: 'Not cached', tone: 'hard' }, update: { label: 'Update value' },
    add: { label: 'Make a node', tone: 'accent' }, unlink: { label: 'Unlink' }, front: { label: 'Insert at front', tone: 'accent' },
    hit: { label: 'Return value', tone: 'ok' }, over: { label: 'Over capacity?' }, evict: { label: 'Evict the tail side', tone: 'hard' }, done: { label: 'Result' }
  };
  function k(x) { return 'key ' + x; }

  function parseOps(t) {
    var out = [], seen = {}, n = 0;
    String(t).toLowerCase().split(/[,;\n]+/).forEach(function (s) {
      var m = s.trim().split(/\s+/), nums, op;
      if (out.length >= MAXOPS || (m[0] !== 'put' && m[0] !== 'get')) return;
      nums = m.slice(1).map(Number).filter(function (x) { return isFinite(x) && x >= 0 && x < 100 && x === Math.floor(x); });
      op = m[0];
      if (nums.length < (op === 'put' ? 2 : 1)) return;
      if (!seen[nums[0]]) { if (n >= MAXKEYS) return; seen[nums[0]] = 1; n++; }
      out.push(op === 'put' ? { op: op, key: nums[0], val: nums[1] } : { op: op, key: nums[0] });
    });
    return out;
  }
  function label(o) { return o.op + ' ' + o.key + (o.op === 'put' ? ' ' + o.val : ''); }

  function frames(cap, ops) {
    var order = [], vals = {}, held = null, heldAt = 0, res = [], F = [], oi = -1, mapKeys = [];
    var labels = ops.map(label);
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, cap: cap, ops: labels, oi: oi, order: order.slice(), held: held, heldAt: heldAt,
        vals: Object.assign({}, vals), map: mapKeys.slice(), res: res.slice(), cur: null }, x));
    }
    function inMap(key) { return mapKeys.indexOf(key) >= 0; }
    function lift(key) { heldAt = order.indexOf(key) + 1; held = key; order.splice(order.indexOf(key), 1); }
    function drop(key) { held = null; order.unshift(key); }

    snap('start', 'An empty cache of capacity ' + cap + '. The map finds a node in O(1); the list remembers who was used last. Run ' + (ops.length ? ops.length + ' operation' + (ops.length > 1 ? 's' : '') : 'no operations') + '.');
    ops.forEach(function (o, n) {
      var key = o.key, label0 = label(o);
      oi = n;
      if (o.op === 'get') {
        snap('lookup', label0 + ': is ' + k(key) + ' in the map?', { cur: key });
        if (!inMap(key)) {
          res.push({ t: 'get ' + key, v: -1, ok: false });
          snap('miss', k(key) + ' is not cached: return -1. A miss does not change the order.', { cur: key });
          return;
        }
        snap('lookup', 'Yes: the map hands over its node (' + vals[key] + ') without scanning the list.', { cur: key, good: 1 });
        lift(key);
        snap('unlink', 'Unlink the node: its neighbours point at each other. The sentinels mean we never test for “first” or “last”.', { cur: key });
        drop(key);
        snap('front', 'Insert it right after HEAD: it is now the most recently used.', { cur: key, good: 1 });
        res.push({ t: 'get ' + key, v: vals[key], ok: true });
        snap('hit', 'Return ' + vals[key] + '. The whole operation was a handful of pointer changes: O(1).', { cur: key, good: 1 });
        return;
      }
      snap('lookup', label0 + ': is ' + k(key) + ' already in the map?', { cur: key });
      if (inMap(key)) {
        vals[key] = o.val;
        snap('update', 'Yes: overwrite the stored value with ' + o.val + '. Writing counts as a use.', { cur: key, good: 1 });
        lift(key);
        snap('unlink', 'Unlink the node from its current place.', { cur: key });
        drop(key);
        snap('front', 'Reinsert it after HEAD: most recently used.', { cur: key, good: 1 });
      } else {
        vals[key] = o.val; mapKeys.push(key); held = key; heldAt = 1;
        snap('add', 'No: make a new node (' + o.val + ') and record it in the map.', { cur: key });
        drop(key);
        snap('front', 'Insert the new node right after HEAD.', { cur: key, good: 1 });
      }
      if (order.length > cap) {
        var lru = order[order.length - 1];
        snap('over', 'The map now holds ' + order.length + ' keys, one more than the capacity ' + cap + ': evict.', { cur: key, bad: 1 });
        snap('evict', 'The node just before TAIL is the least recently used: ' + k(lru) + '. Unlink it and delete it from the map too, or the map would leak.', { cur: key, evicting: lru });
        order.pop(); delete vals[lru]; mapKeys.splice(mapKeys.indexOf(lru), 1);
        snap('evict', k(lru) + ' is gone from both the list and the map.', { cur: key, gone: lru });
      } else {
        snap('over', 'The cache holds ' + order.length + ' of ' + cap + ': nothing to evict.', { cur: key });
      }
    });
    oi = ops.length; held = null;
    snap('done', 'Final order, most recent first: ' + (order.length ? order.join(', ') : 'empty') + '. Every get and put cost a fixed number of steps, never a scan.', { final: 1 });
    return F;
  }

  function allKeys(F) {
    var seen = {}, out = [];
    F.forEach(function (f) { f.map.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); });
    return out;
  }

  function stageHTML(f, keys) {
    var h = '<div class="va lru"><div class="lru-ops" aria-hidden="true"></div>' +
      '<div class="lru-list" style="--n:' + (f.cap + 3) + '"><div class="lru-rail"></div>' +
      '<div class="lru-n sent" data-k="H"><div class="lru-box"><b>HEAD</b></div></div>' +
      '<div class="lru-n sent" data-k="T"><div class="lru-box"><b>TAIL</b></div></div>';
    keys.forEach(function (x) { h += '<div class="lru-n off" data-k="' + x + '"><div class="lru-box"><b>' + x + '</b><i></i></div></div>'; });
    return h + '</div><div class="lru-cap"><span>most recent</span><span>evicted next</span></div>' +
      '<dl class="va-read"><div><dt>doing</dt><dd class="lru-doing"></dd></div><div><dt>map</dt><dd class="lru-map"></dd></div>' +
      '<div><dt>answers</dt><dd class="lru-res"></dd></div></dl></div>';
  }

  function place(el, s, y) { el.style.transform = 'translate(' + (s * 100) + '%,' + y + 'px)'; }

  function paint(stage, f, keys) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(f, keys);
    var n = f.order.length, slot = {};
    f.order.forEach(function (x, j) { slot[x] = j + 1; });
    place(OR.$('[data-k="H"]', stage), 0, 0);
    place(OR.$('[data-k="T"]', stage), n + 1, 0);
    OR.$$('.lru-n', stage).forEach(function (el) {
      var key = el.dataset.k, c = 'lru-n', num;
      if (key === 'H' || key === 'T') return;
      num = +key;
      if (slot[num]) {
        place(el, slot[num], 0);
        if (num === f.cur) c += f.bad ? ' dup' : f.good ? ' ok' : ' cur';
        if (f.evicting === num) c += ' dup cur';
      } else if (f.held === num) {
        place(el, f.heldAt, -58); c += ' in cur';
      } else {
        place(el, num === f.gone ? n + 1 : 0, 58); c += ' off';
      }
      el.className = c;
      OR.$('i', el).textContent = f.vals[num] !== undefined ? f.vals[num] : '';
    });
    OR.$('.lru-ops', stage).innerHTML = f.ops.map(function (t, j) {
      return '<span class="lru-op' + (j === f.oi && !f.final ? ' cur' : j < f.oi ? ' gone' : '') + '">' + esc(t) + '</span>';
    }).join('');
    OR.$('.lru-doing', stage).innerHTML = '<span class="mono">' + esc(f.final ? 'finished' : f.oi >= 0 && f.ops[f.oi] ? f.ops[f.oi] : 'nothing yet') + '</span>';
    OR.$('.lru-map', stage).innerHTML = f.map.length ? f.map.map(function (x) {
      return '<span class="va-kv">' + x + ' → node ' + esc(f.vals[x]) + '</span>';
    }).join('') : '<span class="faint">empty</span>';
    OR.$('.lru-res', stage).innerHTML = f.res.length ? f.res.map(function (r) {
      return '<span class="va-kv' + (r.ok ? ' cv-take' : ' bad') + '">' + esc(r.t) + ' → ' + r.v + '</span>';
    }).join('') : '<span class="faint">none yet</span>';
  }

  OR.viz.lru = {
    frames: frames, parseOps: parseOps, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = (ctx && ctx.mark) || function () {};
      host.innerHTML = '<form class="va-input" novalidate>' +
        '<label class="field-label" for="lru-c">Capacity (1 to ' + MAXCAP + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="lru-c" type="number" min="1" max="' + MAXCAP + '" value="' + PRESETS[0].c + '" style="max-width:6rem"></div>' +
        '<label class="field-label" for="lru-o">Operations, separated by commas: “put key value” or “get key” (up to ' + MAXOPS + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="lru-o" maxlength="140" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0].o) + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, j) {
          return '<button class="chip" type="button" data-p="' + j + '">' + esc(p.label) + '</button>';
        }).join('') + '</p></form><div class="va-player"></div>';
      var cin = OR.$('#lru-c', host), oin = OR.$('#lru-o', host), slot = OR.$('.va-player', host);

      function run() {
        var cap = Math.max(1, Math.min(MAXCAP, Math.floor(+cin.value) || 1)), ops = parseOps(oin.value), F, keys;
        cin.value = cap;
        F = frames(cap, ops); keys = allKeys(F);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: F, steps: STEPS, label: 'LRU cache, capacity ' + cap,
          paint: function (stage, f) { paint(stage, f, keys); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; cin.value = p.c; oin.value = p.o; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
