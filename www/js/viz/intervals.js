/* Offer Ready: intervals visualizer. Two modes over the same bars on a number line:
   merge (sort by start, grow the current merged range) and the meeting-rooms sweep line (start/end events, room count).
   Marks (merge): sort / open / overlap / extend / push. Marks (sweep): events / esort / sweep / rooms / peak.
   Frames are snapshots built by the pure frames(ivs, mode); paint() builds the DOM once per input and then only
   changes CSS variables, so bars slide and stretch with transform (never width or left). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_IV = 10, MAX_T = 40;
  var PRESETS = ['1-3 2-6 8-10 15-18', '1-4 4-5', '1-10 2-3 4-5 6-7', '0-30 5-10 15-20 8-14', '9-12 1-5 4-8 11-14'];
  var MERGE_STEPS = {
    start: { label: 'Start' }, sort: { label: 'Sort by start', tone: 'accent' }, open: { label: 'Open first range', tone: 'accent' },
    overlap: { label: 'Overlap test', tone: 'accent' }, extend: { label: 'Extend the end', tone: 'ok' }, push: { label: 'Gap: new range', tone: 'hard' }, done: { label: 'Done' }
  };
  var SWEEP_STEPS = {
    start: { label: 'Start' }, events: { label: 'Make events', tone: 'accent' }, esort: { label: 'Sort events', tone: 'accent' },
    sweep: { label: 'Next event', tone: 'accent' }, rooms: { label: 'Rooms change', tone: 'ok' }, peak: { label: 'New peak', tone: 'hard' }, done: { label: 'Done' }
  };

  function parse(text) {
    var ivs = [], re = /(\d+)\s*[-,]\s*(\d+)/g, m;
    while ((m = re.exec(String(text))) && ivs.length < MAX_IV) {
      var a = +m[1], b = +m[2];
      if (a > b) { var t = a; a = b; b = t; }
      if (b <= MAX_T) ivs.push([a, b]);
    }
    return ivs;
  }
  var nm = function (iv) { return '[' + iv[0] + ', ' + iv[1] + ']'; };

  function mergeFrames(ivs) {
    var n = ivs.length, out = [], rank = ivs.map(function (_, i) { return i; }), merged = [], done = [];
    var sig = 'merge|' + JSON.stringify(ivs);
    function snap(step, note, x) {
      out.push(Object.assign({ mode: 'merge', sig: sig, step: step, note: note, ivs: ivs, rank: rank.slice(),
        merged: merged.map(function (m) { return m.slice(); }), done: done.slice(), cur: -1, fresh: -1 }, x));
    }
    snap('start', n ? n + ' intervals, in the order they arrived. Merging only works on neighbours, so the first job is to put them next to each other.' : 'Type some intervals like 1-3 2-6 8-10 and press Run it.');
    if (!n) return out;
    var order = ivs.map(function (_, i) { return i; }).sort(function (a, b) { return ivs[a][0] - ivs[b][0] || a - b; });
    order.forEach(function (idx, p) { rank[idx] = p; });
    snap('sort', 'Sort by start. Now any interval that overlaps the current range must be the very next one: nothing later can start before it.');
    var first = order[0];
    merged = [ivs[first].slice()]; done = [first];
    snap('open', 'Open the answer with the first interval, ' + nm(ivs[first]) + '. This is the current merged range.', { cur: first, fresh: 0 });
    for (var p = 1; p < n; p++) {
      var idx = order[p], s = ivs[idx][0], e = ivs[idx][1], last = merged[merged.length - 1], hit = s <= last[1];
      snap('overlap', 'Does ' + nm(ivs[idx]) + ' overlap ' + nm(last) + '? Its start ' + s + (hit ? ' <= ' : ' > ') + 'the range end ' + last[1] + ', so ' + (hit ? 'yes: they touch or overlap.' : 'no: there is a gap.'), { cur: idx });
      done.push(idx);
      if (hit) {
        var old = last[1], ne = Math.max(old, e);
        last[1] = ne;
        snap('extend', ne === old ? nm(ivs[idx]) + ' ends inside the range, so max(' + old + ', ' + e + ') keeps the end at ' + ne + '. Nothing grows.' : 'Stretch the end: max(' + old + ', ' + e + ') = ' + ne + '. The range is now ' + nm(last) + '.', { cur: idx, fresh: merged.length - 1 });
      } else {
        merged.push([s, e]);
        snap('push', 'Gap, so the old range is finished. Start a new range ' + nm([s, e]) + '.', { cur: idx, fresh: merged.length - 1 });
      }
    }
    snap('done', merged.length + ' merged range' + (merged.length === 1 ? '' : 's') + ': ' + merged.map(nm).join(' ') + '. One pass after the sort: O(n log n) overall.');
    return out;
  }

  function sweepFrames(ivs) {
    var n = ivs.length, out = [], evs = [], shown = [], evi = -1, t = null, rooms = 0, best = 0, live = [];
    var sig = 'sweep|' + JSON.stringify(ivs);
    function snap(step, note, x) {
      out.push(Object.assign({ mode: 'sweep', sig: sig, step: step, note: note, ivs: ivs, rank: ivs.map(function (_, i) { return i; }),
        evs: shown.map(function (e) { return e.slice(); }), evi: evi, t: t, rooms: rooms, best: best, live: live.slice() }, x));
    }
    snap('start', n ? n + ' meetings. The question is how many are running at the busiest moment. That equals the rooms you need.' : 'Type some meetings like 1-3 2-6 8-10 and press Run it.');
    if (!n) return out;
    ivs.forEach(function (iv, i) { evs.push([iv[0], 1, i]); evs.push([iv[1], -1, i]); });
    shown = evs;
    snap('events', 'Split each meeting into two events: a start (+1 room) and an end (-1 room). ' + evs.length + ' events.');
    shown = evs = evs.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
    snap('esort', 'Sort the events by time. When an end and a start share a time, the end goes first, so a meeting ending at 5 frees its room for one starting at 5.');
    evs.forEach(function (ev, k) {
      evi = k; t = ev[0];
      snap('sweep', 'The sweep line reaches time ' + ev[0] + ': a meeting ' + (ev[1] > 0 ? 'starts (+1)' : 'ends (-1)') + '. Rooms in use right now: ' + rooms + '.');
      rooms += ev[1];
      if (ev[1] > 0) live.push(ev[2]); else live.splice(live.indexOf(ev[2]), 1);
      snap('rooms', 'rooms ' + (ev[1] > 0 ? '+= 1' : '-= 1') + ' gives ' + rooms + '.');
      if (rooms > best) { best = rooms; snap('peak', 'A new busiest moment: ' + best + ' room' + (best === 1 ? '' : 's') + ' at once. best = ' + best + '.'); }
    });
    evi = -1;
    snap('done', 'The busiest moment had ' + best + ' meeting' + (best === 1 ? '' : 's') + ' at once, so ' + best + ' room' + (best === 1 ? ' is' : 's are') + ' needed. The sort is the cost: O(n log n).');
    return out;
  }

  function frames(ivs, mode) { return mode === 'sweep' ? sweepFrames(ivs) : mergeFrames(ivs); }

  function bounds(ivs) { var hi = 1; ivs.forEach(function (iv) { hi = Math.max(hi, iv[1]); }); return hi; }
  function place(el, s, e, hi) {
    el.style.setProperty('--x', (s / hi * 100).toFixed(3));
    el.style.setProperty('--w', (Math.max(e - s, 0.35) / hi).toFixed(4));
  }

  function build(stage, f) {
    var ivs = f.ivs, hi = bounds(ivs), step = hi <= 12 ? 1 : hi <= 24 ? 2 : 5, i, ticks = '', grid = '', rows = '';
    for (i = 0; i <= hi; i += step) {
      ticks += '<span class="iv-tick" style="left:' + (i / hi * 100) + '%">' + i + '</span>';
      grid += '<i class="iv-gl" style="left:' + (i / hi * 100) + '%"></i>';
    }
    ivs.forEach(function (iv, k) {
      rows += '<div class="iv-row" data-k="' + k + '"><span class="iv-lab">' + iv[0] + '-' + iv[1] + '</span><div class="iv-track"><i class="iv-bar"></i></div></div>';
    });
    var lane = '';
    if (f.mode === 'merge') {
      lane = '<div class="iv-lane"><span class="iv-lab">merged</span><div class="iv-track">' +
        ivs.map(function () { return '<i class="iv-bar iv-slot"></i>'; }).join('') + '</div></div>';
    }
    stage.innerHTML = '<div class="iv iv-' + f.mode + '" style="--n:' + ivs.length + '" role="img">' + lane +
      '<div class="iv-axis"><span class="iv-lab"></span><div class="iv-track">' + ticks + '</div></div>' +
      '<div class="iv-rows"><div class="iv-gridwrap">' + grid + '</div>' + rows +
      (f.mode === 'sweep' ? '<div class="iv-sweepwrap"><i class="iv-sweep"></i></div>' : '') + '</div>' +
      (f.mode === 'sweep' ? '<div class="iv-events" aria-hidden="true"></div>' : '') +
      '<dl class="va-read"></dl></div>';
    var root = stage.firstChild, q = function (s) { return root.querySelector(s); };
    stage._iv = { sig: f.sig, hi: hi, root: root, rows: [].slice.call(root.querySelectorAll('.iv-row')),
      slots: [].slice.call(root.querySelectorAll('.iv-slot')), sweep: q('.iv-sweep'), ev: q('.iv-events'), read: q('.va-read') };
    stage._iv.rows.forEach(function (r, k) {
      place(r.querySelector('.iv-bar'), ivs[k][0], ivs[k][1], hi);
      r.style.setProperty('--r', k);   // start un-sorted; the first paint may already move it
    });
  }

  function kv(label, val, bad) { return '<div><dt>' + label + '</dt><dd><b class="num"' + (bad ? ' style="color:var(--hard)"' : '') + '>' + val + '</b></dd></div>'; }

  function paint(stage, f) {
    if (!stage._iv || stage._iv.sig !== f.sig || !stage._iv.root.isConnected) build(stage, f);
    var v = stage._iv, hi = v.hi;
    v.rows.forEach(function (r, k) {
      r.style.setProperty('--r', f.rank[k]);
      var c = 'iv-row';
      if (f.mode === 'merge') c += (f.cur === k ? ' cur' : f.done.indexOf(k) >= 0 ? ' done' : '');
      else c += (f.live.indexOf(k) >= 0 ? ' on' : '') + (f.evi >= 0 && f.evs[f.evi][2] === k ? ' cur' : '');
      r.className = c;
    });
    if (f.mode === 'merge') {
      v.slots.forEach(function (el, k) {
        var m = f.merged[k];
        if (m) place(el, m[0], m[1], hi); else el.style.setProperty('--w', 0);
        el.className = 'iv-bar iv-slot' + (m ? ' show' : '') + (m && f.fresh === k ? ' fresh' : '');
      });
      var lastM = f.merged[f.merged.length - 1];
      v.read.innerHTML = kv('ranges so far', f.merged.length) + kv('current end', lastM ? lastM[1] : '-') + kv('seen', f.done.length + '/' + f.ivs.length);
    } else {
      if (f.t == null) v.sweep.style.opacity = 0;
      else { v.sweep.style.opacity = 1; v.sweep.style.setProperty('--x', (f.t / hi * 100).toFixed(3)); }
      v.ev.innerHTML = f.evs.map(function (e, k) {
        return '<span class="va-kv iv-ev' + (e[1] < 0 ? ' end' : '') + (k === f.evi ? ' cur' : '') + '">' + e[0] + (e[1] > 0 ? ' +1' : ' -1') + '</span>';
      }).join('');
      v.read.innerHTML = kv('time', f.t == null ? '-' : f.t) + kv('rooms now', f.rooms) + kv('best so far', f.best, f.step === 'peak');
    }
    v.root.setAttribute('aria-label', (f.mode === 'merge' ? 'Merging intervals' : 'Sweep line over meetings') + ': ' + f.ivs.map(nm).join(' ') + '. ' + f.note);
  }

  OR.viz.intervals = {
    frames: frames, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="iv-in">Intervals (up to ' + MAX_IV + ', written start-end, values 0 to ' + MAX_T + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="iv-in" spellcheck="false" autocomplete="off" aria-label="Intervals, such as 1-3 2-6 8-10" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<div class="iv-toggles"><label class="iv-sw"><input type="checkbox" id="iv-sweep"> Meeting-rooms sweep line instead of merge</label></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, k) { return '<button class="chip" type="button" data-k="' + k + '">' + esc(p) + '</button>'; }).join('') +
        '<span class="faint">The second one touches at 4 and still merges. Flip the switch on the fourth to see three rooms at once.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#iv-in', host), sw = OR.$('#iv-sweep', host), slot = OR.$('.va-player', host);

      function run() {
        var ivs = parse(input.value), mode = sw.checked ? 'sweep' : 'merge';
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(ivs, mode), steps: mode === 'sweep' ? SWEEP_STEPS : MERGE_STEPS,
          label: (mode === 'sweep' ? 'Sweep line: ' : 'Merge intervals: ') + ivs.map(function (iv) { return iv[0] + '-' + iv[1]; }).join(' '),
          paint: function (stg, f) { paint(stg, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      sw.addEventListener('change', run);
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-k]'); if (!b) return;
        input.value = PRESETS[b.dataset.k]; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
