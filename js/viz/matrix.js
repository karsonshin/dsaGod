/* Offer Ready: matrix visualizer. Two modes:
   "Spiral" (four shrinking boundaries; step names match the template's #@top/#@right/#@bottom/#@left/#@shrink/#@guard marks) and
   "Rotate" (transpose, then reverse each row; its code is in the lesson's Variations, so no template line lights).
   Each frame is a snapshot, so stepping back is just painting an earlier frame. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, MAX = 6;
  var STEPS = {
    spiral: { start: { label: 'Start' }, top: { label: 'Top row', tone: 'accent' }, right: { label: 'Right column', tone: 'accent' }, bottom: { label: 'Bottom row', tone: 'accent' },
      left: { label: 'Left column', tone: 'accent' }, shrink: { label: 'Pull boundary in' }, guard: { label: 'Guard stops a repeat', tone: 'hard' }, done: { label: 'Done', tone: 'ok' } },
    rotate: { start: { label: 'Start' }, transpose: { label: 'Swap across diagonal', tone: 'accent' }, reverse: { label: 'Reverse a row', tone: 'ok' }, done: { label: 'Done' } }
  };
  var PRESETS = {
    spiral: ['1 2 3; 4 5 6; 7 8 9', '1 2 3 4; 5 6 7 8; 9 10 11 12', '1 2 3 4; 5 6 7 8', '1; 2; 3; 4'],
    rotate: ['1 2 3; 4 5 6; 7 8 9', '1 2 3 4; 5 6 7 8; 9 10 11 12; 13 14 15 16']
  };
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function blank(R, C, v) { return Array.from({ length: R }, function () { return Array(C).fill(v); }); }
  function copy(g) { return g.map(function (r) { return r.slice(); }); }

  /* Spiral: walk the four sides of the unvisited rectangle, pulling one boundary in after each side. */
  function spiralFrames(m) {
    var R = m.length, C = R ? m[0].length : 0, out = [], res = [];
    var top = 0, bottom = R - 1, left = 0, right = C - 1, seen = blank(R, C, 0);
    function snap(step, note, cur) {
      var c = m.map(function (row, r) { return row.map(function (_, k) {
        var live = r >= top && r <= bottom && k >= left && k <= right;
        return (seen[r][k] ? 'ok' : live ? 'in' : 'gone') + (cur && cur[0] === r && cur[1] === k ? ' cur' : '');
      }); });
      var s = m.map(function (row, r) { return row.map(function (_, k) { return seen[r][k] ? String(seen[r][k]) : ''; }); });
      out.push({ step: step, note: note, g: m, c: c, s: s, R: R, C: C,
        read: kv('bounds', '<span class="mono">top ' + top + ' · bottom ' + bottom + ' · left ' + left + ' · right ' + right + '</span>') +
          kv('output', '<span class="mono">[' + res.join(', ') + ']</span>') });
    }
    function take(step, r, k, note) { res.push(m[r][k]); seen[r][k] = res.length; snap(step, note, [r, k]); }
    snap('start', R ? 'The whole grid is unvisited. Four boundaries (top, bottom, left, right) mark the rectangle still to walk.' : 'An empty grid has nothing to walk.');
    while (top <= bottom && left <= right) {
      for (var c = left; c <= right; c++) take('top', top, c, 'Top row, left to right: take matrix[' + top + '][' + c + '] = ' + m[top][c] + '.');
      top++; snap('shrink', 'The top row is used up, so top becomes ' + top + '.');
      for (var r = top; r <= bottom; r++) take('right', r, right, 'Right column, going down: take matrix[' + r + '][' + right + '] = ' + m[r][right] + '.');
      right--; snap('shrink', 'The right column is used up, so right becomes ' + right + '.');
      if (top <= bottom) {
        for (c = right; c >= left; c--) take('bottom', bottom, c, 'Bottom row, right to left: take matrix[' + bottom + '][' + c + '] = ' + m[bottom][c] + '.');
        bottom--; snap('shrink', 'The bottom row is used up, so bottom becomes ' + bottom + '.');
      } else snap('guard', 'top passed bottom: no rows are left. Without this check the walk would go back along the row it just did.');
      if (left <= right) {
        for (r = bottom; r >= top; r--) take('left', r, left, 'Left column, going up: take matrix[' + r + '][' + left + '] = ' + m[r][left] + '.');
        left++; snap('shrink', 'The left column is used up, so left becomes ' + left + '.');
      } else snap('guard', 'left passed right: no columns are left. Without this check the walk would go back along the column it just did.');
    }
    snap('done', R ? 'Every cell taken exactly once: ' + res.length + ' of ' + R * C + '. Each cell is touched once, so O(m·n) time.' : 'Nothing to walk.');
    return out;
  }

  /* Rotate 90 degrees clockwise: transpose (swap across the main diagonal), then reverse each row. */
  function rotateFrames(src) {
    var n = src.length, g = copy(src), out = [], state = blank(n, n, 'in');
    function snap(step, note, a, b, extra) {
      var c = state.map(function (row, r) { return row.map(function (s, k) { return s + ((a && a[0] === r && a[1] === k) || (b && b[0] === r && b[1] === k) ? ' cur' : ''); }); });
      var s = g.map(function (row, r) { return row.map(function (_, k) { return r + ',' + k; }); });
      out.push({ step: step, note: note, g: copy(g), c: c, s: s, R: n, C: n, read: extra || '' });
    }
    function swap(i, j, k, l) { var t = g[i][j]; g[i][j] = g[k][l]; g[k][l] = t; }
    snap('start', n ? 'A square grid. Rotating 90 degrees clockwise is two easy moves: transpose, then reverse every row.' : 'An empty grid.', null, null, kv('phase', 'start'));
    var i, j;
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      var a = g[i][j], b = g[j][i]; swap(i, j, j, i); state[i][j] = state[j][i] = 'ok';
      snap('transpose', 'Swap matrix[' + i + '][' + j + '] (' + a + ') with matrix[' + j + '][' + i + '] (' + b + '). Only cells above the diagonal start a swap, so each pair swaps once.', [i, j], [j, i], kv('phase', 'transpose'));
    }
    for (i = 0; i < n; i++) state[i][i] = 'ok';
    if (n) snap('transpose', 'Transpose done: rows and columns have traded places. A transpose alone is a reflection, not a rotation.', null, null, kv('phase', 'transpose'));
    state = blank(n, n, 'in');
    for (i = 0; i < n; i++) {
      for (j = 0; j < Math.floor(n / 2); j++) swap(i, j, i, n - 1 - j);
      for (j = 0; j < n; j++) state[i][j] = 'ok';
      snap('reverse', 'Reverse row ' + i + ': swap its ends, then the next pair in, until the middle.', [i, 0], [i, n - 1], kv('phase', 'reverse'));
    }
    snap('done', n ? 'Rotated 90 degrees clockwise, in place, with O(1) extra space. The old first column, read bottom to top, is now the first row.' : 'Nothing to rotate.', null, null, kv('phase', 'done'));
    return out;
  }

  function parse(text) {
    var rows = text.split(/[;\n]+/).map(function (r) {
      return r.split(/[\s,]+/).filter(Boolean).map(Number).filter(function (x) { return isFinite(x) && x === Math.round(x); });
    }).filter(function (r) { return r.length; }).slice(0, MAX);
    if (!rows.length) return [];
    var w = Math.min(rows[0].length, MAX);
    return rows.map(function (r) { r = r.slice(0, w); while (r.length < w) r.push(0); return r; });
  }
  function square(m) { var n = Math.min(m.length, m.length ? m[0].length : 0); return m.slice(0, n).map(function (r) { return r.slice(0, n); }); }

  function paint(stage, f) {
    var grid = OR.$('.mx-grid', stage);
    if (!grid || +grid.dataset.r !== f.R || +grid.dataset.c !== f.C) {
      var cells = '', i;
      for (i = 0; i < f.R * f.C; i++) cells += '<span class="va-cell"><b></b><small></small></span>';
      stage.innerHTML = '<div class="va"><div class="mx-grid" style="--c:' + f.C + '" data-r="' + f.R + '" data-c="' + f.C + '" aria-hidden="true">' + cells + '</div><dl class="va-read"></dl></div>';
      grid = OR.$('.mx-grid', stage);
    }
    OR.$$('.va-cell', grid).forEach(function (el, i) {
      var r = Math.floor(i / f.C), k = i % f.C;
      el.className = 'va-cell ' + f.c[r][k];
      el.firstChild.textContent = f.g[r][k];
      el.lastChild.textContent = f.s[r][k];
    });
    OR.$('.va-read', stage).innerHTML = f.read;
  }

  OR.viz.matrix = {
    frames: { spiral: spiralFrames, rotate: rotateFrames }, // exposed for checks
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'spiral';
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="mx-in">Your grid (rows split by ; , up to ' + MAX + ' × ' + MAX + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="mx-in" spellcheck="false" autocomplete="off">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Mode</span> <button class="chip" type="button" data-mode="spiral">Spiral</button> <button class="chip" type="button" data-mode="rotate">Rotate 90°</button></p>' +
        '<p class="va-presets mx-presets"></p></form><div class="va-player"></div>';
      var input = OR.$('#mx-in', host), slot = OR.$('.va-player', host), presets = OR.$('.mx-presets', host);

      function run() {
        var m = parse(input.value), spiral = mode === 'spiral';
        if (!spiral) m = square(m);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: spiral ? spiralFrames(m) : rotateFrames(m), steps: STEPS[mode],
          label: (spiral ? 'Spiral on a ' : 'Rotate a ') + m.length + ' × ' + (m.length ? m[0].length : 0) + ' grid',
          paint: function (stage, f) { paint(stage, f); mark(spiral && f.step !== 'start' && f.step !== 'done' ? f.step : null); }
        });
      }
      function setMode(m, text) {
        mode = m;
        OR.$$('[data-mode]', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); });
        presets.innerHTML = '<span class="faint">Try</span> ' + PRESETS[m].map(function (p, i) {
          return '<button class="chip" type="button" data-pre="' + i + '">' + esc(p) + '</button>';
        }).join('') + (m === 'spiral' ? '<span class="faint">A single row or column is the trap case for the guards.</span>' : '<span class="faint">Rotation needs a square grid; extra rows or columns are cut off. Code: Variations.</span>');
        input.value = text || PRESETS[m][0];
        run();
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mode],[data-pre]'); if (!b || !host.contains(b)) return;
        if (b.dataset.mode) setMode(b.dataset.mode); else setMode(mode, PRESETS[mode][+b.dataset.pre]);
      });
      setMode('spiral');
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
