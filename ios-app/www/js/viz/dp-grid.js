/* Offer Ready: grid DP visualizer. Two modes on a grid you edit (numbers are step costs, x is a wall):
   "Min path sum" (each cell = own cost + cheaper of the two cells it can come from) and
   "Unique paths" (each cell = paths from above + paths from the left). Cells fill row by row, each with a
   "pull" frame (the two source cells, arrows pointing in) and a "fill" frame, then the answer is traced back
   from the corner through the recorded arrows. Frame steps match the template's
   #@init/#@wall/#@start/#@pull/#@fill/#@answer marks. Frames are snapshots, so stepping back repaints. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, MAX = 6, WALL = -1;
  var STEPS = {
    init: { label: 'Empty table' }, wall: { label: 'Wall', tone: 'hard' }, start: { label: 'Start cell', tone: 'ok' },
    pull: { label: 'Look up and left', tone: 'accent' }, fill: { label: 'Write the cell', tone: 'accent' },
    trace: { label: 'Trace back', tone: 'ok' }, done: { label: 'Done' }
  };
  var PRESETS = {
    min: ['1 3 1; 1 5 1; 4 2 1', '1 2 5; 3 2 1', '2 1 3 9; 4 x 1 2; 7 5 1 1', '1 x 1; x x 1; 1 1 1'],
    paths: ['0 0 0; 0 0 0; 0 0 0', '0 0 0; 0 x 0; 0 0 0', '0 0 0 0; 0 x 0 0; 0 0 0 x; x 0 0 0', '0 x; x 0']
  };
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function blank(R, C, v) { return Array.from({ length: R }, function () { return Array(C).fill(v); }); }

  /* g = { R, C, cost[][] } with WALL (-1) marking a wall. mode = 'min' | 'paths'. */
  function frames(g, mode) {
    var R = g.R, C = g.C, min = mode === 'min', out = [];
    var dp = blank(R, C, null), from = blank(R, C, ''), cls = blank(R, C, ''), trail = blank(R, C, false);
    function show(r, c) {
      if (g.cost[r][c] === WALL) return '✕';
      if (dp[r][c] === null) return '';
      return dp[r][c] === Infinity ? '∞' : String(dp[r][c]);
    }
    function sub(r, c) {
      if (g.cost[r][c] === WALL) return '';
      if (dp[r][c] === null) return min ? '+' + g.cost[r][c] : '';
      return min ? from[r][c] + '+' + g.cost[r][c] : from[r][c];
    }
    function snap(step, note, cur, extra, read) {
      var c = cls.map(function (row, r) { return row.map(function (v, k) {
        var s = g.cost[r][k] === WALL ? 'gone dpg-wall' : trail[r][k] ? 'ok' : dp[r][k] === null ? '' : dp[r][k] === Infinity ? 'gone' : 'in';
        return s + ' ' + v + (cur && cur[0] === r && cur[1] === k ? ' cur' : '') + ((extra && extra[r + ',' + k]) || '');
      }); });
      out.push({ step: step, note: note, R: R, C: C, c: c, read: read || '',
        v: dp.map(function (row, r) { return row.map(function (_, k) { return show(r, k); }); }),
        s: dp.map(function (row, r) { return row.map(function (_, k) { return sub(r, k); }); }) });
    }
    function nm(r, c) { return '(' + r + ', ' + c + ')'; }
    function val(r, c) { return r < 0 || c < 0 || g.cost[r][c] === WALL || dp[r][c] === null ? (min ? Infinity : 0) : dp[r][c]; }
    function txt(x) { return x === Infinity ? '∞' : String(x); }

    snap('init', R ? (min ? 'An empty table the same shape as the grid. Each cell will hold the cheapest cost to arrive there. The small number is the cell’s own step cost; a cross is a wall.' :
      'An empty table. Each cell will hold the number of different paths that arrive there, moving only right or down. A cross is a wall.') : 'An empty grid.', null, null, kv('moves', 'right or down'));
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var wall = g.cost[r][c] === WALL, up = val(r - 1, c), left = val(r, c - 1), here = nm(r, c);
      if (wall) {
        dp[r][c] = min ? Infinity : 0; cls[r][c] = '';
        snap('wall', 'Cell ' + here + ' is a wall. Nobody can stand on it, so it is ' + (min ? 'unreachable (infinity)' : 'worth 0 paths') + ' and passes nothing on.', [r, c], null, kv('cell', here));
        dp[r][c] = min ? Infinity : 0;
        continue;
      }
      if (!r && !c) {
        dp[r][c] = min ? g.cost[r][c] : 1; from[r][c] = '';
        snap('start', min ? 'The start cell has no cell to come from: its cost is just its own, ' + g.cost[r][c] + '.' : 'The start cell is the one way to be at the start: 1.', [r, c], null, kv('cell', here) + kv('value', String(dp[r][c])));
        continue;
      }
      var ex = {};
      if (r) ex[(r - 1) + ',' + c] = ' dpg-src dpg-d' + (min ? (up <= left ? ' dpg-pick' : '') : '');
      if (c) ex[r + ',' + (c - 1)] = ' dpg-src dpg-r' + (min ? (left < up ? ' dpg-pick' : '') : '');
      var rd = kv('cell', here) + kv('above', r ? txt(up) : 'edge') + kv('left', c ? txt(left) : 'edge');
      var best = min ? Math.min(up, left) : up + left;
      var note = min
        ? (best === Infinity ? 'Cell ' + here + ' can only be reached from cells that are walls or unreachable, so it is unreachable too.'
          : 'Cell ' + here + ' is entered from above (' + (r ? txt(up) : 'no cell') + ') or from the left (' + (c ? txt(left) : 'no cell') + '). The cheaper arrival is ' + best + (up === left && r && c ? ' (a tie, either works).' : '.'))
        : 'Cell ' + here + ' is reached from above (' + (r ? up : 0) + ' paths) or from the left (' + (c ? left : 0) + ' paths). Every path to either one extends to this cell, so add: ' + best + '.';
      snap('pull', note, [r, c], ex, rd + kv(min ? 'best' : 'sum', txt(best)));
      if (min) {
        dp[r][c] = best === Infinity ? Infinity : best + g.cost[r][c];
        from[r][c] = best === Infinity ? '' : up <= left ? '↑' : '←';
      } else {
        dp[r][c] = best;
        from[r][c] = (up > 0 ? '↑' : '') + (left > 0 ? '←' : '');
      }
      snap('fill', min ? (best === Infinity ? 'Cell ' + here + ' stays unreachable.' : 'Write ' + best + ' + own cost ' + g.cost[r][c] + ' = ' + dp[r][c] + '. The arrow remembers where we came from.')
        : 'Write ' + best + '. The arrows show which neighbours contributed.', [r, c], null, rd + kv('value', txt(dp[r][c])));
    }
    // Trace back from the corner. Min: follow the stored arrow. Paths: prefer the cell above, if any path goes through it.
    var er = R - 1, ec = C - 1, goal = R ? dp[er][ec] : 0;
    if (!R) { snap('done', 'Nothing to fill.', null, null, ''); return out; }
    if (g.cost[er][ec] === WALL || (min ? goal === Infinity : goal === 0)) {
      snap('done', 'The end is not reachable, so there is no path (the answer is ' + (min ? '-1' : '0') + ').', [er, ec], null, kv('answer', min ? '-1' : '0'));
      return out;
    }
    var cr = er, cc = ec, steps = [];
    for (;;) {
      trail[cr][cc] = true; steps.push(nm(cr, cc));
      snap('trace', cr === er && cc === ec ? 'The answer is in the last cell: ' + goal + (min ? ' is the cheapest cost' : ' paths') + '. Walk back to see ' + (min ? 'the route that achieves it' : 'one of them') + ': from each cell, step to the one it came from.' :
        'Came from ' + nm(cr, cc) + '.', [cr, cc], null, kv('answer', String(goal)) + kv('path', '<span class="mono">' + steps.slice().reverse().join(' → ') + '</span>'));
      if (!cr && !cc) break;
      var up2 = val(cr - 1, cc), left2 = val(cr, cc - 1);
      var goUp = cr && (min ? up2 <= left2 : up2 > 0);
      if (goUp) cr--; else cc--;
    }
    snap('done', min ? 'Cheapest cost ' + goal + ', and the highlighted route pays it. Each of the ' + R * C + ' cells was computed once, so O(m·n).'
      : goal + ' distinct paths; the highlighted one is just one of them. Each cell was computed once, so O(m·n).', null, null, kv('answer', String(goal)));
    return out;
  }

  function parse(text) {
    var rows = text.split(/[;\n]+/).map(function (r) {
      return r.split(/[\s,]+/).filter(Boolean).map(function (t) {
        if (/^[x#]$/i.test(t)) return WALL;
        var n = Number(t); return isFinite(n) && n === Math.round(n) ? Math.min(Math.max(n, 0), 99) : null;
      }).filter(function (x) { return x !== null; });
    }).filter(function (r) { return r.length; }).slice(0, MAX);
    if (!rows.length) return { R: 0, C: 0, cost: [] };
    var w = Math.min(rows[0].length, MAX);
    return { R: rows.length, C: w, cost: rows.map(function (r) { r = r.slice(0, w); while (r.length < w) r.push(0); return r; }) };
  }

  function paint(stage, f) {
    var grid = OR.$('.dpg-grid', stage);
    if (!grid || +grid.dataset.r !== f.R || +grid.dataset.c !== f.C) {
      var cells = '', i;
      for (i = 0; i < f.R * f.C; i++) cells += '<span class="va-cell"><b></b><small></small></span>';
      stage.innerHTML = '<div class="va"><div class="dpg-grid" style="--c:' + f.C + '" data-r="' + f.R + '" data-c="' + f.C + '" aria-hidden="true">' + cells + '</div><dl class="va-read"></dl></div>';
      grid = OR.$('.dpg-grid', stage);
    }
    OR.$$('.va-cell', grid).forEach(function (el, i) {
      var r = Math.floor(i / f.C), k = i % f.C;
      el.className = 'va-cell ' + f.c[r][k];
      el.firstChild.textContent = f.v[r][k];
      el.lastChild.textContent = f.s[r][k];
    });
    OR.$('.va-read', stage).innerHTML = f.read;
  }

  OR.viz['dp-grid'] = {
    frames: frames, parse: parse, // exposed for checks
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'min';
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="dpg-in">Your grid (rows split by ; numbers are step costs, x is a wall, up to ' + MAX + ' × ' + MAX + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="dpg-in" spellcheck="false" autocomplete="off">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Mode</span> <button class="chip" type="button" data-mode="min">Min path sum</button> <button class="chip" type="button" data-mode="paths">Unique paths</button></p>' +
        '<p class="va-presets dpg-presets"></p></form><div class="va-player"></div>';
      var input = OR.$('#dpg-in', host), slot = OR.$('.va-player', host), presets = OR.$('.dpg-presets', host);
      var MARK = { init: 'init', wall: 'wall', start: 'start', pull: 'pull', fill: 'fill', done: 'answer' };

      function run() {
        var g = parse(input.value);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(g, mode), steps: STEPS,
          label: (mode === 'min' ? 'Min path sum on a ' : 'Unique paths on a ') + g.R + ' × ' + g.C + ' grid',
          paint: function (stage, f) { paint(stage, f); mark(MARK[f.step] || null); }
        });
      }
      function setMode(m, text) {
        mode = m;
        OR.$$('[data-mode]', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); });
        presets.innerHTML = '<span class="faint">Try</span> ' + PRESETS[m].map(function (p, i) {
          return '<button class="chip" type="button" data-pre="' + i + '">' + esc(p) + '</button>';
        }).join('') + '<span class="faint">' + (m === 'min' ? 'Costs are charged for entering a cell. The template lights the same lines in both modes: swap min for + to count.' : 'Costs are ignored here; only walls matter.') + '</span>';
        input.value = text || PRESETS[m][0];
        run();
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mode],[data-pre]'); if (!b || !host.contains(b)) return;
        if (b.dataset.mode) setMode(b.dataset.mode); else setMode(mode, PRESETS[mode][+b.dataset.pre]);
      });
      setMode('min');
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
