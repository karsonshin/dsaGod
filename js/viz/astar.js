/* Offer Ready: A* visualizer. A*, Dijkstra and greedy best-first search on a grid you edit, with a Manhattan-distance heuristic.
   The point of the page: A* returns the same shortest path as Dijkstra but looks at far fewer cells, because the heuristic pulls
   the search toward the goal. Greedy best-first looks at even fewer but can return a longer path.
   Click or use the arrow keys plus Enter/Space to draw walls and move the start (S) and end (E); every edit re-runs.
   Open cells show f = g + h (cost so far plus the guess to the goal); expanded cells show the order they were expanded.
   Frames are snapshots, so stepping back means painting an earlier frame. */
(function () {
  'use strict';
  var OR = window.OR, ROWS = 7, COLS = 9, N = ROWS * COLS;
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  var PRESETS = [
    { label: 'Open field', rows: ['.........', '.........', '.........', '.S.....E.', '.........', '.........', '.........'] },
    { label: 'Wall with a gap', rows: ['.........', '....#....', '....#....', '.S..#..E.', '....#....', '....#....', '.........'] },
    { label: 'A dead-end pocket', rows: ['.........', '..#####..', '..#...#..', '.S#.E.#..', '..#.#.#..', '.........', '.........'] },
    { label: 'Greedy gets lured', rows: ['.........', '.#####...', '.#...#...', '.#.S.#.E.', '.#...#...', '.##.##...', '.........'] }
  ];
  var ALGOS = { astar: 'A* (f = g + h)', dijkstra: 'Dijkstra (f = g)', greedy: 'Greedy best-first (f = h)' };
  var STEPS = {
    init: { label: 'Start' }, take: { label: 'Expand best', tone: 'accent' }, push: { label: 'Update neighbours', tone: 'ok' },
    goal: { label: 'Reached the end', tone: 'ok' }, path: { label: 'Trace the path', tone: 'ok' }, none: { label: 'No route', tone: 'hard' }
  };

  function nm(i) { return '(' + (Math.floor(i / COLS) + 1) + ',' + ((i % COLS) + 1) + ')'; }
  function pl(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function man(a, b) { return Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS)) + Math.abs((a % COLS) - (b % COLS)); }

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

  // Plain BFS length: the ground truth for the shortest route (all steps cost 1), or -1.
  function bfsLen(g) {
    var dist = {}, q = [g.start], h = 0; dist[g.start] = 0;
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

  // algo: 'astar' | 'dijkstra' | 'greedy'. Returns frames; the last frame carries result { steps, expanded }.
  function frames(g, algo) {
    var gs = {}, prev = {}, open = [], closed = [], out = [], expanded = 0, i;
    for (i = 0; i < N; i++) closed.push(0);
    function h(j) { return algo === 'dijkstra' ? 0 : man(j, g.end); }
    function f(j) { return algo === 'greedy' ? h(j) : gs[j] + h(j); }
    // Smallest f first; on a tie prefer the one closer to the goal (smaller h), then the lower index.
    function best() {
      var bi = 0;
      for (var k = 1; k < open.length; k++) {
        var a = open[k], b = open[bi];
        if (f(a) < f(b) || (f(a) === f(b) && (h(a) < h(b) || (h(a) === h(b) && a < b)))) bi = k;
      }
      return bi;
    }
    function sorted() { return open.slice().sort(function (a, b) { return f(a) - f(b) || h(a) - h(b) || a - b; }); }
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, closed: closed.slice(), open: sorted(), gs: Object.assign({}, gs), algo: algo, wall: g.wall, start: g.start, end: g.end, cur: -1, added: [], path: [], expanded: expanded }, x));
    }
    gs[g.start] = 0; prev[g.start] = -1; open.push(g.start);
    snap('init', 'Start with ' + nm(g.start) + ' as the only open cell. g is the cost so far, h the Manhattan distance to the end' + (algo === 'dijkstra' ? ' (Dijkstra ignores it: h = 0)' : '') + ', and f = ' + (algo === 'greedy' ? 'h' : 'g + h') + ' decides who goes next. Coordinates are (row, column) from 1.');
    while (open.length) {
      var bi = best(), cur = open.splice(bi, 1)[0], r = Math.floor(cur / COLS), c = cur % COLS;
      closed[cur] = ++expanded;
      snap('take', 'Take the open cell with the smallest f: ' + nm(cur) + ' (g = ' + gs[cur] + ', h = ' + h(cur) + ', f = ' + f(cur) + '). It is expanded ' + (expanded === 1 ? '1st' : expanded + 'th') + '.', { cur: cur });
      if (cur === g.end) {
        snap('goal', 'The end ' + nm(cur) + ' was taken, so stop. Follow the prev links back to the start.', { cur: cur });
        var path = [], k = cur;
        while (k !== -1) { path.push(k); k = prev[k]; }
        path.reverse();
        var steps = path.length - 1, best0 = bfsLen(g);
        snap('path', 'Path of ' + pl(steps, 'step') + ', found after expanding ' + pl(expanded, 'cell') + '. ' + (steps === best0 ? 'That is a shortest path.' : 'A shortest path has ' + pl(best0, 'step') + ': greedy best-first ignores the cost so far, so it can settle for a longer route.'), { cur: cur, path: path, result: { steps: steps, expanded: expanded } });
        return out;
      }
      var added = [];
      DIRS.forEach(function (d) {
        var nr = r + d[0], nc = c + d[1], j = nr * COLS + nc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || g.wall[j] || closed[j]) return;
        var ng = gs[cur] + 1;
        if (gs[j] === undefined) { gs[j] = ng; prev[j] = cur; open.push(j); added.push(j); }
        else if (ng < gs[j]) { gs[j] = ng; prev[j] = cur; if (open.indexOf(j) < 0) open.push(j); added.push(j); }
      });
      snap('push', added.length ? 'New or cheaper route found for ' + added.map(nm).join(' ') + ': each gets g = ' + (gs[cur] + 1) + ' and goes on the open list with its f.' : 'Nothing new from ' + nm(cur) + ': every neighbour is a wall, off the grid or already expanded.', { cur: cur, added: added });
    }
    snap('none', 'The open list is empty and the end was never taken: there is no route. ' + pl(expanded, 'cell') + ' could be reached from the start.', { result: { steps: -1, expanded: expanded } });
    return out;
  }

  function stageHTML(g) {
    var h = '<div class="gs" style="--cols:' + COLS + '"><div class="gs-grid" role="grid" aria-label="Search grid, ' + ROWS + ' rows by ' + COLS + ' columns">', r, c;
    for (r = 0; r < ROWS; r++) {
      h += '<div class="gs-row" role="row">';
      for (c = 0; c < COLS; c++) h += '<div class="gs-cell" role="gridcell" data-i="' + (r * COLS + c) + '" tabindex="-1"></div>';
      h += '</div>';
    }
    return h + '</div><dl class="va-read"><div><dt>open list (best first)</dt><dd class="as-open"></dd></div>' +
      '<div><dt>expanded</dt><dd class="as-exp"></dd></div><div><dt>path</dt><dd class="as-len"></dd></div></dl>' +
      '<p class="gs-key faint"><span class="gs-sw fr"></span> open (number = f) <span class="gs-sw vis"></span> expanded (number = order) <span class="gs-sw path"></span> path <span class="gs-sw wall"></span> wall</p></div>';
  }

  function paint(stage, f, fi) {
    var onPath = {}, added = {}, isOpen = {};
    f.path.forEach(function (j) { onPath[j] = 1; });
    f.added.forEach(function (j) { added[j] = 1; });
    f.open.forEach(function (j) { isOpen[j] = 1; });
    function hh(j) { return f.algo === 'dijkstra' ? 0 : man(j, f.end); }
    function ff(j) { return f.algo === 'greedy' ? hh(j) : f.gs[j] + hh(j); }
    OR.$$('.gs-cell', stage).forEach(function (el, i) {
      var cls = 'gs-cell', txt = '', state;
      if (f.wall[i]) { cls += ' wall'; state = 'wall'; }
      else {
        if (onPath[i]) cls += ' path';
        else if (isOpen[i]) cls += ' fr' + (added[i] ? ' new' : '');
        else if (f.closed[i]) cls += ' vis';
        if (i === f.start) { cls += ' mk'; txt = 'S'; state = 'start'; }
        else if (i === f.end) { cls += ' mk'; txt = 'E'; state = 'end'; }
        else if (isOpen[i]) { txt = ff(i); state = 'open, f ' + ff(i); }
        else if (f.closed[i]) { txt = f.closed[i]; state = 'expanded ' + f.closed[i]; }
        else state = 'unseen';
        if (onPath[i]) state += ', on the path';
      }
      if (i === f.cur) cls += ' cur';
      el.className = cls; el.textContent = txt;
      el.setAttribute('aria-label', 'Row ' + (Math.floor(i / COLS) + 1) + ', column ' + ((i % COLS) + 1) + ': ' + state);
      el.tabIndex = i === fi ? 0 : -1;
    });
    OR.$('.as-open', stage).innerHTML = f.open.length ? f.open.slice(0, 8).map(function (j) { return '<span class="va-kv">' + nm(j) + ' f' + ff(j) + '</span>'; }).join('') + (f.open.length > 8 ? '<span class="faint">+' + (f.open.length - 8) + '</span>' : '') : '<span class="faint">empty</span>';
    OR.$('.as-exp', stage).innerHTML = '<b class="num">' + f.expanded + '</b> <span class="faint">cells</span>';
    OR.$('.as-len', stage).innerHTML = f.path.length ? '<b class="num">' + (f.path.length - 1) + '</b> <span class="faint">steps</span>' : '<span class="faint">none yet</span>';
  }

  OR.viz.astar = {
    frames: frames, fromRows: fromRows, bfsLen: bfsLen, // exposed for tools/check_engine.py and the self-check
    mount: function (host, ctx) {
      var mark = (ctx && ctx.mark) || function () {}, player = null, g = fromRows(PRESETS[2].rows), algo = 'astar', tool = 'wall', fi = g.start, stageEl = null;
      host.innerHTML = '<div class="gs-top">' +
        '<div class="gs-group"><span class="field-label" id="as-a">Search</span><div class="seg" role="radiogroup" aria-labelledby="as-a">' +
          Object.keys(ALGOS).map(function (k, i) { return '<label><input type="radio" name="as-algo" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + ALGOS[k] + '</span></label>'; }).join('') + '</div></div>' +
        '<div class="gs-group"><span class="field-label" id="as-t">Clicking a cell sets</span><div class="seg" role="radiogroup" aria-labelledby="as-t">' +
          '<label><input type="radio" name="as-tool" value="wall" checked><span>Wall</span></label><label><input type="radio" name="as-tool" value="start"><span>Start</span></label><label><input type="radio" name="as-tool" value="end"><span>End</span></label></div></div></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + OR.esc(p.label) + '</button>'; }).join('') + '<button class="chip" type="button" data-clear>Clear walls</button></p>' +
        '<p class="as-compare faint" aria-live="polite"></p>' +
        '<p class="faint gs-help">Click a cell, or move with the arrow keys and press Enter or Space. Any edit restarts the run. Switch between the three searches to compare how many cells each one expands.</p>' +
        '<div class="va-player"></div>';
      var slot = OR.$('.va-player', host);
      function cellEl(i) { return OR.$('.gs-cell[data-i="' + i + '"]', slot); }
      function compare() {
        var res = {};
        Object.keys(ALGOS).forEach(function (k) { var fr = frames(g, k); res[k] = fr[fr.length - 1].result || { steps: -1, expanded: 0 }; });
        OR.$('.as-compare', host).innerHTML = Object.keys(ALGOS).map(function (k) { return '<span' + (k === algo ? ' class="as-on"' : '') + '>' + ALGOS[k].split(' (')[0] + ': <b class="num">' + res[k].expanded + '</b> expanded, ' + (res[k].steps < 0 ? 'no route' : res[k].steps + ' steps') + '</span>'; }).join(' · ');
      }
      function run(refocus) {
        if (player) player.destroy();
        slot.innerHTML = ''; compare();
        player = OR.player(slot, {
          frames: frames(g, algo), steps: STEPS, label: ALGOS[algo] + ' on a ' + ROWS + ' by ' + COLS + ' grid',
          paint: function (stage, f) { if (!stage.firstChild) { stage.innerHTML = stageHTML(g); stageEl = stage; } paint(stage, f, fi); mark(f.step); }
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
        if (e.target.name === 'as-algo') { algo = e.target.value; run(); } else if (e.target.name === 'as-tool') tool = e.target.value;
      });
      host.addEventListener('keydown', function (e) {
        var c = e.target.closest('.gs-cell'); if (!c) return;
        var i = +c.dataset.i, r = Math.floor(i / COLS), col = i % COLS, k = e.key, nx = -1;
        if (k === 'ArrowUp' && r > 0) nx = i - COLS; else if (k === 'ArrowDown' && r < ROWS - 1) nx = i + COLS;
        else if (k === 'ArrowLeft' && col > 0) nx = i - 1; else if (k === 'ArrowRight' && col < COLS - 1) nx = i + 1;
        else if (k === 'Home') nx = r * COLS; else if (k === 'End') nx = r * COLS + COLS - 1;
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); apply(i); return; }
        else if (k.indexOf('Arrow') !== 0) return;
        e.preventDefault(); e.stopPropagation();
        if (nx >= 0) { fi = nx; OR.$$('.gs-cell', stageEl).forEach(function (el) { el.tabIndex = +el.dataset.i === nx ? 0 : -1; }); cellEl(nx).focus(); }
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
