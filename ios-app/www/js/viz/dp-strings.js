/* Offer Ready: two-string DP visualizer. Two modes over the same table:
   "LCS" (step names match the template's #@init/#@match/#@skip/#@trace marks) and
   "Edit distance" (its code is in the lesson's Variations, so no template line lights).
   Each frame is a snapshot of the whole table, so stepping back is just painting an earlier frame. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, MAX = 8, ARROW = { d: '↖', u: '↑', l: '←' };
  var STEPS = {
    lcs: { init: { label: 'Fill the edges' }, match: { label: 'Letters match: diagonal + 1', tone: 'accent' }, skip: { label: 'Differ: best of up or left', tone: 'hard' },
      trace: { label: 'Walk back', tone: 'ok' }, done: { label: 'Done', tone: 'ok' } },
    edit: { init: { label: 'Fill the edges' }, match: { label: 'Letters match: copy diagonal', tone: 'accent' }, edit: { label: 'Differ: 1 + cheapest edit', tone: 'hard' },
      trace: { label: 'Walk back', tone: 'ok' }, done: { label: 'Done', tone: 'ok' } }
  };
  var PRESETS = {
    lcs: [['abcde', 'ace'], ['abcbdab', 'bdcaba'], ['abc', 'abc'], ['abc', 'def']],
    edit: [['horse', 'ros'], ['intent', 'exec'], ['abc', 'abc'], ['', 'abc']]
  };
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function grid(R, C, v) { return Array.from({ length: R + 1 }, function () { return Array(C + 1).fill(v); }); }
  function q(s) { return '"' + s + '"'; }

  /* mode: 'lcs' or 'edit'. Fills dp row by row, then walks back from the bottom-right corner. */
  function frames(a, b, mode) {
    var R = a.length, C = b.length, lcs = mode === 'lcs', out = [];
    var dp = grid(R, C, null), arrow = grid(R, C, ''), cls = grid(R, C, ''), i, j;
    function snap(step, note, cur, src, read) {
      var c = cls.map(function (row, r) { return row.map(function (k, s) {
        var x = k + (cur && cur[0] === r && cur[1] === s ? ' cur' : '');
        if (src && src.some(function (p) { return p[0] === r && p[1] === s; })) x += ' src';
        return x;
      }); });
      out.push({ step: step, note: note, R: R, C: C, a: a, b: b, v: dp.map(function (r) { return r.slice(); }), ar: arrow.map(function (r) { return r.slice(); }), c: c, read: read || '' });
    }
    for (i = 0; i <= R; i++) { dp[i][0] = lcs ? 0 : i; if (i) arrow[i][0] = 'u'; }
    for (j = 0; j <= C; j++) { dp[0][j] = lcs ? 0 : j; if (j) arrow[0][j] = 'l'; }
    snap('init', lcs ? 'Row 0 and column 0 are the empty prefix: it shares nothing with anything, so every edge cell is 0.'
      : 'Turning a prefix into the empty string costs one delete per letter, and building one from nothing costs one insert per letter. That fills the edges.', null, null, kv('table', '<span class="mono">' + (R + 1) + ' × ' + (C + 1) + '</span>'));
    for (i = 1; i <= R; i++) for (j = 1; j <= C; j++) {
      var same = a[i - 1] === b[j - 1], at = 'dp[' + i + '][' + j + ']', rule;
      if (lcs) {
        if (same) {
          dp[i][j] = dp[i - 1][j - 1] + 1; arrow[i][j] = 'd'; cls[i][j] = 'in'; rule = at + ' = dp[' + (i - 1) + '][' + (j - 1) + '] + 1 = ' + dp[i][j];
          snap('match', q(a[i - 1]) + ' = ' + q(b[j - 1]) + ': extend the best answer for both shorter prefixes by one letter. ' + rule + '.', [i, j], [[i - 1, j - 1]], kv('rule', '<span class="mono">' + esc(rule) + '</span>'));
        } else {
          var up = dp[i - 1][j], left = dp[i][j - 1];
          dp[i][j] = Math.max(up, left); arrow[i][j] = up >= left ? 'u' : 'l'; cls[i][j] = 'dup';
          rule = at + ' = max(' + up + ', ' + left + ') = ' + dp[i][j];
          snap('skip', q(a[i - 1]) + ' ≠ ' + q(b[j - 1]) + ': one of them is not used, so take the better of "drop a letter of the first" (up) and "drop a letter of the second" (left). ' + rule + '.', [i, j], [[i - 1, j], [i, j - 1]], kv('rule', '<span class="mono">' + esc(rule) + '</span>'));
        }
      } else if (same) {
        dp[i][j] = dp[i - 1][j - 1]; arrow[i][j] = 'd'; cls[i][j] = 'in'; rule = at + ' = dp[' + (i - 1) + '][' + (j - 1) + '] = ' + dp[i][j];
        snap('match', q(a[i - 1]) + ' = ' + q(b[j - 1]) + ': nothing to fix, so copy the diagonal. ' + rule + '.', [i, j], [[i - 1, j - 1]], kv('rule', '<span class="mono">' + esc(rule) + '</span>'));
      } else {
        var dg = dp[i - 1][j - 1], u2 = dp[i - 1][j], l2 = dp[i][j - 1], m = Math.min(dg, u2, l2);
        dp[i][j] = 1 + m; arrow[i][j] = m === dg ? 'd' : m === u2 ? 'u' : 'l'; cls[i][j] = 'dup';
        rule = at + ' = 1 + min(' + dg + ', ' + u2 + ', ' + l2 + ') = ' + dp[i][j];
        snap('edit', q(a[i - 1]) + ' ≠ ' + q(b[j - 1]) + ': pay one edit. Diagonal is replace, up is delete, left is insert; take the cheapest. ' + rule + '.', [i, j], [[i - 1, j - 1], [i - 1, j], [i, j - 1]], kv('rule', '<span class="mono">' + esc(rule) + '</span>'));
      }
    }
    /* Trace back from the corner: the arrow says which neighbour each cell came from. */
    var path = [], picked = [], ops = [];
    i = R; j = C;
    cls[i][j] += ' ok'; path.push([i, j]);
    snap('trace', 'The answer is ' + dp[R][C] + ', in the bottom-right corner. To see which letters give it, walk back from there, following each cell’s arrow.', [i, j], null,
      kv(lcs ? 'subsequence' : 'edits', '<span class="mono">–</span>'));
    while (i > 0 || j > 0) {
      var note, ni = i, nj = j, same2 = i > 0 && j > 0 && a[i - 1] === b[j - 1];
      if (lcs) {
        if (same2) { picked.unshift(a[i - 1]); ni--; nj--; note = 'Letters match at ' + q(a[i - 1]) + ': keep it, and move diagonally.'; }
        else if (i === 0) { nj--; note = 'Top edge: stop using the second string.'; }
        else if (j === 0) { ni--; note = 'Left edge: stop using the first string.'; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) { ni--; note = 'No match here: the value came from above, so skip ' + q(a[i - 1]) + '.'; }
        else { nj--; note = 'No match here: the value came from the left, so skip ' + q(b[j - 1]) + '.'; }
      } else if (same2 && dp[i][j] === dp[i - 1][j - 1]) { ni--; nj--; note = q(a[i - 1]) + ' already matches: keep it, no cost.'; }
      else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { ni--; nj--; ops.unshift('replace ' + q(a[i - 1]) + ' with ' + q(b[j - 1])); note = 'Diagonal: replace ' + q(a[i - 1]) + ' with ' + q(b[j - 1]) + '.'; }
      else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { ni--; ops.unshift('delete ' + q(a[i - 1])); note = 'Up: delete ' + q(a[i - 1]) + '.'; }
      else { nj--; ops.unshift('insert ' + q(b[j - 1])); note = 'Left: insert ' + q(b[j - 1]) + '.'; }
      i = ni; j = nj; cls[i][j] += ' ok'; path.push([i, j]);
      snap('trace', note, [i, j], null, kv(lcs ? 'subsequence' : 'edits', '<span class="mono">' + esc(lcs ? (picked.join('') || '–') : (ops.join(', ') || '–')) + '</span>'));
    }
    snap('done', lcs ? (picked.length ? 'The longest common subsequence is ' + q(picked.join('')) + ', length ' + dp[R][C] + '. The table has (m+1)(n+1) cells with O(1) work each, so O(m·n) time.' : 'The strings share no letter, so the answer is 0. O(m·n) time.')
      : 'Minimum edits: ' + dp[R][C] + (ops.length ? ' (' + ops.join(', ') + ')' : ', no edits needed') + '. O(m·n) time.', null, null,
      kv(lcs ? 'subsequence' : 'edits', '<span class="mono">' + esc(lcs ? (picked.join('') || '–') : (ops.join(', ') || 'none')) + '</span>'));
    return out;
  }

  function clean(s) { return Array.from(String(s).replace(/\s+/g, '')).slice(0, MAX).join(''); }

  function paint(stage, f) {
    var g = OR.$('.dps-grid', stage);
    if (!g || +g.dataset.r !== f.R || +g.dataset.c !== f.C || g.dataset.a !== f.a + '|' + f.b) {
      var cells = '', r, k;
      for (r = 0; r <= f.R + 1; r++) for (k = 0; k <= f.C + 1; k++) {
        var head = r === 0 ? (k === 0 ? '' : k === 1 ? 'ε' : f.b[k - 2]) : k === 0 ? (r === 1 ? 'ε' : f.a[r - 2]) : null;
        cells += head === null ? '<span class="va-cell dps-cell"><b></b><small></small></span>' : '<span class="dps-head">' + esc(head) + '</span>';
      }
      stage.innerHTML = '<div class="va dps"><div class="dps-grid" style="--c:' + (f.C + 2) + '" data-r="' + f.R + '" data-c="' + f.C + '" data-a="' + esc(f.a + '|' + f.b) + '" aria-hidden="true">' + cells + '</div><dl class="va-read"></dl></div>';
      g = OR.$('.dps-grid', stage);
    }
    OR.$$('.dps-cell', g).forEach(function (el, n) {
      var r = Math.floor(n / (f.C + 1)), k = n % (f.C + 1), v = f.v[r][k];
      el.className = 'va-cell dps-cell ' + (v === null ? 'gone' : f.c[r][k]);
      el.firstChild.textContent = v === null ? '' : v;
      el.lastChild.textContent = v === null ? '' : ARROW[f.ar[r][k]] || '';
    });
    OR.$('.va-read', stage).innerHTML = f.read;
  }

  OR.viz['dp-strings'] = {
    frames: frames, // exposed for checks
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'lcs';
      host.innerHTML = '<form class="va-input" novalidate><div class="dps-in"><div><label class="field-label" for="dps-a">First string (up to ' + MAX + ')</label><input class="input mono" id="dps-a" maxlength="' + MAX + '" spellcheck="false" autocomplete="off"></div>' +
        '<div><label class="field-label" for="dps-b">Second string</label><input class="input mono" id="dps-b" maxlength="' + MAX + '" spellcheck="false" autocomplete="off"></div>' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Table</span> <button class="chip" type="button" data-mode="lcs">Common subsequence</button> <button class="chip" type="button" data-mode="edit">Edit distance</button></p>' +
        '<p class="va-presets dps-presets"></p></form><div class="va-player"></div>';
      var ia = OR.$('#dps-a', host), ib = OR.$('#dps-b', host), slot = OR.$('.va-player', host), presets = OR.$('.dps-presets', host);

      function run() {
        var a = clean(ia.value), b = clean(ib.value);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(a, b, mode), steps: STEPS[mode],
          label: (mode === 'lcs' ? 'Common subsequence of "' : 'Edit distance from "') + a + '" to "' + b + '"',
          paint: function (stage, f) { paint(stage, f); mark(mode === 'lcs' && f.step !== 'done' ? f.step : null); }
        });
      }
      function setMode(m, pair) {
        mode = m;
        OR.$$('[data-mode]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.mode === m)); });
        presets.innerHTML = '<span class="faint">Try</span> ' + PRESETS[m].map(function (p, i) {
          return '<button class="chip" type="button" data-pre="' + i + '">' + esc(p[0] || 'ε') + ' / ' + esc(p[1] || 'ε') + '</button>';
        }).join('') + (m === 'lcs' ? '<span class="faint">Arrows point at the cell each value came from.</span>' : '<span class="faint">Up is delete, left is insert, diagonal is replace or keep. Code: Variations.</span>');
        pair = pair || [ia.value || PRESETS[m][0][0], ib.value || PRESETS[m][0][1]];
        ia.value = pair[0]; ib.value = pair[1];
        run();
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var x = e.target.closest('[data-mode],[data-pre]'); if (!x || !host.contains(x)) return;
        if (x.dataset.mode) setMode(x.dataset.mode, PRESETS[x.dataset.mode][0]); else setMode(mode, PRESETS[mode][+x.dataset.pre]);
      });
      setMode('lcs', PRESETS.lcs[0]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
