/* Offer Ready: grid search visualizer (graphs lesson): BFS (queue) or DFS (stack) on a grid you edit.
   Click or use the arrow keys plus Enter/Space to draw walls and to move the start (S) and end (E). Every edit re-runs.
   Frames are snapshots, so stepping back is painting an earlier frame. Frame steps match the template's
   #@init/#@take/#@push/#@goal/#@path/#@none marks. Neighbours are tried up, right, down, left. */
(function () {
  'use strict';
  var OR = window.OR, ROWS = 7, COLS = 9, N = ROWS * COLS;
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  var PRESETS = [
    { label: 'Open field', rows: ['.........', '.........', '.........', '.S.....E.', '.........', '.........', '.........'] },
    { label: 'Wall with a gap', rows: ['.........', '....#....', '....#....', '.S..#..E.', '....#....', '....#....', '.........'] },
    { label: 'No way through', rows: ['....#....', '....#....', '.S..#..E.', '....#....', '....#....', '....#....', '....#....'] },
    { label: 'DFS takes the long way', rows: ['.........', '.........', '.##.###..', '.S.......', '.##.###.E', '.........', '.........'] }
  ];
  var STEPS = {
    init: { label: 'Start' }, take: { label: 'Take next', tone: 'accent' }, push: { label: 'Add neighbours', tone: 'ok' },
    goal: { label: 'Reached the end', tone: 'ok' }, path: { label: 'Trace the path', tone: 'ok' }, none: { label: 'No route', tone: 'hard' }
  };

  function nm(i) { return '(' + (Math.floor(i / COLS) + 1) + ',' + ((i % COLS) + 1) + ')'; }
  function ord(k) { var s = ['th', 'st', 'nd', 'rd'], v = k % 100; return k + (s[(v - 20) % 10] || s[v] || s[0]); }
  function pl(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  function fromRows(rows) {
    var g = { wall: [], start: 0, end: 0 };
    rows.forEach(function (row, r) {
      for (var c = 0; c < COLS; c++) {
        var ch = row.charAt(c), i = r * COLS + c;
        g.wall[i] = ch === '#';
        if (ch === 'S') g.start = i;
        if (ch === 'E') g.end = i;
      }
    });
    return g;
  }

  // Shortest route length in steps, or -1 (used only to compare with what DFS found).
  function bfsLen(g) {
    var dist = {}, q = [g.start], h = 0;
    dist[g.start] = 0;
    while (h < q.length) {
      var cur = q[h++], r = Math.floor(cur / COLS), c = cur % COLS;
      if (cur === g.end) return dist[cur];
      DIRS.forEach(function (d) {
        var nr = r + d[0], nc = c + d[1], j = nr * COLS + nc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || g.wall[j] || dist[j] !== undefined) return;
        dist[j] = dist[cur] + 1; q.push(j);
      });
    }
    return -1;
  }

  // g = { wall[], start, end }; algo = 'bfs' | 'dfs'.
  function frames(g, algo) {
    var bfs = algo === 'bfs', front = [g.start], head = 0, prev = {}, order = [], visited = 0, out = [], i;
    for (i = 0; i < N; i++) order.push(0);
    prev[g.start] = -1;
    function line() { return front.slice(head); }
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, order: order.slice(), front: line(), bfs: bfs, wall: g.wall, start: g.start, end: g.end, cur: -1, added: [], path: [] }, x));
    }
    snap('init', 'Put the start ' + nm(g.start) + ' in the ' + (bfs ? 'queue' : 'stack') + ' and mark it seen (prev[start] = none). Coordinates are (row, column), counted from 1.');
    while (front.length > head) {
      var cur = bfs ? front[head++] : front.pop(), r = Math.floor(cur / COLS), c = cur % COLS;
      order[cur] = ++visited;
      snap('take', (bfs ? 'Take the oldest cell in the queue: ' : 'Take the newest cell on the stack: ') + nm(cur) + '. It is visited ' + ord(visited) + '.', { cur: cur });
      if (cur === g.end) {
        snap('goal', 'The end ' + nm(cur) + ' has been taken, so stop searching. Now follow prev links back to the start.', { cur: cur });
        var path = [], k = cur;
        while (k !== -1) { path.push(k); k = prev[k]; }
        path.reverse();
        var steps = path.length - 1, best = bfsLen(g);
        snap('path', 'Path of ' + pl(steps, 'step') + ' (' + pl(visited, 'cell') + ' visited). ' + (bfs
          ? 'BFS reaches every cell by a shortest route the first time it sees it, so this is the shortest.'
          : (steps === best ? 'DFS found a route; here it happens to be a shortest one.' : 'DFS finds a route, not the shortest one: a shortest route is ' + pl(best, 'step') + '.')), { cur: cur, path: path });
        return out;
      }
      var added = [], wall = 0, off = 0, seen = 0;
      DIRS.forEach(function (d) {
        var nr = r + d[0], nc = c + d[1], j = nr * COLS + nc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) off++;
        else if (g.wall[j]) wall++;
        else if (prev[j] !== undefined) seen++;
        else { prev[j] = cur; front.push(j); added.push(j); }
      });
      snap('push', added.length
        ? 'Look up, right, down, left. New: ' + added.map(nm).join(' ') + '. Mark ' + (added.length === 1 ? 'it' : 'them') + ' seen right now and ' + (bfs ? 'add to the back of the queue' : 'push onto the stack') + '. Skipped ' + (wall + off + seen) + ' (' + wall + ' wall, ' + off + ' off the grid, ' + seen + ' already seen).'
        : 'Nothing new from ' + nm(cur) + ': every neighbour is a wall (' + wall + '), off the grid (' + off + ') or already seen (' + seen + ').', { cur: cur, added: added });
    }
    snap('none', 'The ' + (bfs ? 'queue' : 'stack') + ' is empty and the end was never taken: there is no route. ' + pl(visited, 'cell') + ' could be reached from the start.');
    return out;
  }

  function stageHTML(g) {
    var h = '<div class="gs" style="--cols:' + COLS + '"><div class="gs-grid" role="grid" aria-label="Search grid, ' + ROWS + ' rows by ' + COLS + ' columns">', r, c;
    for (r = 0; r < ROWS; r++) {
      h += '<div class="gs-row" role="row">';
      for (c = 0; c < COLS; c++) h += '<div class="gs-cell" role="gridcell" data-i="' + (r * COLS + c) + '" tabindex="-1"></div>';
      h += '</div>';
    }
    return h + '</div><dl class="va-read"><div><dt class="gs-line-name"></dt><dd class="gs-line"></dd></div>' +
      '<div><dt>visited</dt><dd class="gs-vis"></dd></div><div><dt>path</dt><dd class="gs-len"></dd></div></dl>' +
      '<p class="gs-key faint"><span class="gs-sw fr"></span> in the frontier (number = place in line, 1 is next) <span class="gs-sw vis"></span> visited (number = order) <span class="gs-sw path"></span> path <span class="gs-sw wall"></span> wall</p></div>';
  }

  function paint(stage, f, fi) {
    var inLine = {}, k = f.front.length, onPath = {}, added = {};
    f.front.forEach(function (j, idx) { inLine[j] = f.bfs ? idx + 1 : k - idx; });
    f.path.forEach(function (j) { onPath[j] = 1; });
    f.added.forEach(function (j) { added[j] = 1; });
    OR.$$('.gs-cell', stage).forEach(function (el, i) {
      var cls = 'gs-cell', txt = '', state;
      if (f.wall[i]) { cls += ' wall'; state = 'wall'; }
      else {
        if (onPath[i]) cls += ' path';
        else if (inLine[i]) cls += ' fr' + (added[i] ? ' new' : '');
        else if (f.order[i]) cls += ' vis';
        if (i === f.start) { cls += ' mk'; txt = 'S'; state = 'start'; }
        else if (i === f.end) { cls += ' mk'; txt = 'E'; state = 'end'; }
        else if (inLine[i]) { txt = inLine[i]; state = 'in the ' + (f.bfs ? 'queue' : 'stack') + ', place ' + inLine[i]; }
        else if (f.order[i]) { txt = f.order[i]; state = 'visited ' + ord(f.order[i]); }
        else state = 'open';
        if (onPath[i]) state += ', on the path';
      }
      if (i === f.cur) cls += ' cur';
      el.className = cls;
      el.textContent = txt;
      el.setAttribute('aria-label', 'Row ' + (Math.floor(i / COLS) + 1) + ', column ' + ((i % COLS) + 1) + ': ' + state);
      el.tabIndex = i === fi ? 0 : -1;
    });
    OR.$('.gs-line-name', stage).textContent = f.bfs ? 'queue (front first)' : 'stack (top last)';
    OR.$('.gs-line', stage).innerHTML = f.front.length ? f.front.slice(0, 12).map(function (j) { return '<span class="va-kv">' + nm(j) + '</span>'; }).join('') + (f.front.length > 12 ? '<span class="faint">+' + (f.front.length - 12) + ' more</span>' : '') : '<span class="faint">empty</span>';
    OR.$('.gs-vis', stage).innerHTML = '<b class="num">' + f.order.filter(Boolean).length + '</b> <span class="faint">cells</span>';
    OR.$('.gs-len', stage).innerHTML = f.path.length ? '<b class="num">' + (f.path.length - 1) + '</b> <span class="faint">steps</span>' : '<span class="faint">none yet</span>';
  }

  OR.viz['grid-search'] = {
    frames: frames, // exposed for tools/check_engine.py
    fromRows: fromRows,
    mount: function (host, ctx) {
      var mark = (ctx && ctx.mark) || function () {}, player = null, g = fromRows(PRESETS[1].rows), algo = 'bfs', tool = 'wall', fi = g.start, stageEl = null;
      host.innerHTML = '<div class="gs-top">' +
        '<div class="gs-group"><span class="field-label" id="gs-a">Search</span><div class="seg" role="radiogroup" aria-labelledby="gs-a">' +
          '<label><input type="radio" name="gs-algo" value="bfs" checked><span>BFS (queue)</span></label><label><input type="radio" name="gs-algo" value="dfs"><span>DFS (stack)</span></label></div></div>' +
        '<div class="gs-group"><span class="field-label" id="gs-t">Clicking a cell sets</span><div class="seg" role="radiogroup" aria-labelledby="gs-t">' +
          '<label><input type="radio" name="gs-tool" value="wall" checked><span>Wall</span></label><label><input type="radio" name="gs-tool" value="start"><span>Start</span></label><label><input type="radio" name="gs-tool" value="end"><span>End</span></label></div></div></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + OR.esc(p.label) + '</button>'; }).join('') +
        '<button class="chip" type="button" data-clear>Clear walls</button></p>' +
        '<p class="faint gs-help">Click a cell, or move with the arrow keys and press Enter or Space. Any edit restarts the run. Space and the arrow keys step the player when it has focus.</p>' +
        '<div class="va-player"></div>';
      var slot = OR.$('.va-player', host);

      function cellEl(i) { return OR.$('.gs-cell[data-i="' + i + '"]', slot); }
      function run(refocus) {
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(g, algo), steps: STEPS, label: (algo === 'bfs' ? 'Breadth-first' : 'Depth-first') + ' search on a ' + ROWS + ' by ' + COLS + ' grid',
          paint: function (stage, f) {
            if (!stage.firstChild) { stage.innerHTML = stageHTML(g); stageEl = stage; }
            paint(stage, f, fi); mark(f.step);
          }
        });
        if (refocus) { var el = cellEl(fi); if (el) el.focus(); }
      }
      function apply(i) {
        fi = i;
        if (tool === 'wall') { if (i === g.start || i === g.end) return; g.wall[i] = !g.wall[i]; }
        else if (tool === 'start') { if (i === g.end) return; g.start = i; g.wall[i] = false; }
        else { if (i === g.start) return; g.end = i; g.wall[i] = false; }
        run(true);
      }
      host.addEventListener('click', function (e) {
        var c = e.target.closest('.gs-cell'), b = e.target.closest('[data-p],[data-clear]');
        if (c) apply(+c.dataset.i);
        else if (b && b.hasAttribute('data-clear')) { g.wall = g.wall.map(function () { return false; }); run(); }
        else if (b) { g = fromRows(PRESETS[+b.dataset.p].rows); fi = g.start; run(); }
      });
      host.addEventListener('change', function (e) {
        if (e.target.name === 'gs-algo') { algo = e.target.value; run(); } else if (e.target.name === 'gs-tool') tool = e.target.value;
      });
      host.addEventListener('keydown', function (e) {
        var c = e.target.closest('.gs-cell'); if (!c) return;
        var i = +c.dataset.i, r = Math.floor(i / COLS), col = i % COLS, k = e.key, nx = -1;
        if (k === 'ArrowUp' && r > 0) nx = i - COLS;
        else if (k === 'ArrowDown' && r < ROWS - 1) nx = i + COLS;
        else if (k === 'ArrowLeft' && col > 0) nx = i - 1;
        else if (k === 'ArrowRight' && col < COLS - 1) nx = i + 1;
        else if (k === 'Home') nx = r * COLS;
        else if (k === 'End') nx = r * COLS + COLS - 1;
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); apply(i); return; }
        else if (k.indexOf('Arrow') !== 0) return;
        e.preventDefault(); e.stopPropagation(); // the player would otherwise step on arrows and play on Space
        if (nx >= 0) { fi = nx; OR.$$('.gs-cell', stageEl).forEach(function (el) { el.tabIndex = +el.dataset.i === nx ? 0 : -1; }); cellEl(nx).focus(); }
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
