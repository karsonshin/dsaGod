/* Offer Ready: bitmask DP visualizer (minimum-cost assignment, the lesson's template).
   dp[mask] = cheapest way to give the first popcount(mask) workers the jobs in mask. Masks are visited in increasing
   order, each one tries to add one more job, and at the end the parent links give the best assignment back.
   Each frame is a snapshot of the run. Frame steps match the template's #@mask/#@pick/#@relax/#@done marks. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_N = 5, MAX_C = 99, INF = 1e9;
  var PRESETS = [['1 2 9; 1 9 9; 9 9 1', 'greedy trap'], ['9 2 7 8; 6 4 3 7; 5 8 1 8; 7 6 9 4', 'four workers'], ['7 3 8 6 5; 4 9 2 7 6; 8 5 6 3 9; 3 7 4 8 2; 6 2 9 5 4', 'five workers']];
  var STEPS = {
    start: { label: 'Start' }, mask: { label: 'Next mask', tone: 'accent' }, pick: { label: 'Add one job' },
    relax: { label: 'Keep the cheaper', tone: 'ok' }, trace: { label: 'Trace back' }, done: { label: 'Done' }
  };

  function parse(text) {
    var rows = String(text).split(/[;\n]/).map(function (r) {
      return (r.match(/\d+/g) || []).map(function (x) { return Math.min(MAX_C, +x); });
    }).filter(function (r) { return r.length; });
    var n = Math.min(MAX_N, rows.length, Math.min.apply(null, rows.map(function (r) { return r.length; })));
    if (!rows.length || n < 1) return null;
    return rows.slice(0, n).map(function (r) { return r.slice(0, n); });
  }
  function pop(m) { var c = 0; while (m) { c += m & 1; m >>= 1; } return c; }
  function bin(m, n) { var s = m.toString(2); while (s.length < n) s = '0' + s; return s; }

  function brute(cost) { // cheapest over all permutations, to check the DP
    var n = cost.length, best = INF;
    (function go(w, used, sum) {
      if (w === n) { best = Math.min(best, sum); return; }
      for (var j = 0; j < n; j++) if (!(used >> j & 1)) go(w + 1, used | 1 << j, sum + cost[w][j]);
    })(0, 0, 0);
    return best;
  }
  function greedy(cost) {
    var n = cost.length, used = 0, sum = 0;
    for (var w = 0; w < n; w++) {
      var bj = -1;
      for (var j = 0; j < n; j++) if (!(used >> j & 1) && (bj < 0 || cost[w][j] < cost[w][bj])) bj = j;
      used |= 1 << bj; sum += cost[w][bj];
    }
    return sum;
  }

  function frames(cost) {
    var n = cost.length, full = (1 << n) - 1, dp = [], par = [], out = [], m, j;
    var cur = -1, tgt = -1, job = -1, w = -1, used = 0, path = [], asg = [];
    for (m = 0; m <= full; m++) { dp.push(INF); par.push(-1); }
    dp[0] = 0;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, cur: cur, tgt: tgt, job: job, w: w, used: used, dp: dp.slice(), path: path.slice(), asg: asg.slice() }, x));
    }
    snap('start', 'dp[mask] is the cheapest cost of giving jobs to the first popcount(mask) workers, using exactly the jobs whose bits are set. Only dp[0] = 0 is known: nobody has a job yet.');
    for (m = 0; m < full; m++) {
      cur = m; tgt = -1; job = -1; w = pop(m); used = m;
      snap('mask', 'Mask ' + bin(m, n) + ': jobs ' + (m ? '{' + jobsOf(m, n).join(', ') + '}' : 'none') + ' are taken, so worker ' + w + ' picks next. dp[' + bin(m, n) + '] = ' + dp[m] + ' is final: every smaller mask has been visited.', { math: 'dp[' + bin(m, n) + '] = ' + dp[m] });
      for (j = 0; j < n; j++) {
        if (m >> j & 1) continue;
        var nm = m | 1 << j, cand = dp[m] + cost[w][j];
        tgt = nm; job = j;
        snap('pick', 'Give worker ' + w + ' job ' + j + ' (cost ' + cost[w][j] + '). That sets bit ' + j + ' and lands on ' + bin(nm, n) + ' with candidate ' + dp[m] + ' + ' + cost[w][j] + ' = ' + cand + ' against the current ' + (dp[nm] >= INF ? 'unset value' : dp[nm]) + '.',
          { math: 'min(' + (dp[nm] >= INF ? '∞' : dp[nm]) + ', ' + dp[m] + ' + ' + cost[w][j] + ')' });
        if (cand < dp[nm]) {
          dp[nm] = cand; par[nm] = j;
          snap('relax', 'Better: dp[' + bin(nm, n) + '] = ' + cand + ', and we remember that its last job was ' + j + '.', { math: 'dp[' + bin(nm, n) + '] = ' + cand });
        } else {
          snap('relax', 'No gain: dp[' + bin(nm, n) + '] stays ' + dp[nm] + ', another route is at least as cheap.', { math: 'dp[' + bin(nm, n) + '] = ' + dp[nm] });
        }
      }
    }
    m = full; cur = full; tgt = -1; job = -1; w = n - 1; used = full; path = [full];
    snap('trace', 'dp[' + bin(full, n) + '] = ' + dp[full] + ' is the answer: all jobs given out. To see who got what, follow each remembered last job backwards.', { math: 'answer = dp[' + bin(full, n) + '] = ' + dp[full] });
    while (m) {
      var jj = par[m], prev = m ^ 1 << jj, ww = pop(prev);
      asg[ww] = jj; cur = m; tgt = prev; job = jj; w = ww; used = prev; path.push(prev);
      snap('trace', 'dp[' + bin(m, n) + '] came from adding job ' + jj + ' to ' + bin(prev, n) + ', so worker ' + ww + ' gets job ' + jj + ' (cost ' + cost[ww][jj] + ').', { math: dp[m] + ' - ' + cost[ww][jj] + ' = ' + dp[prev] });
      m = prev;
    }
    cur = -1; tgt = -1; job = -1; w = -1; used = 0;
    var g = greedy(cost);
    snap('done', 'Cheapest total ' + dp[full] + '. ' + (g === dp[full] ? 'Cheapest-job-per-worker greedy also gets ' + g + ' here; try the greedy trap preset.' : 'Greedy (each worker takes their cheapest free job) would pay ' + g + ': trying all 2^' + n + ' masks beats it.'),
      { final: true, math: 'answer = ' + dp[full] });
    return out;
  }
  function jobsOf(m, n) { var a = []; for (var j = 0; j < n; j++) if (m >> j & 1) a.push(j); return a; }

  function stageHTML(cost) {
    var n = cost.length, i, j, head = '<tr><th scope="col"><span class="bm-corner">worker \\ job</span></th>', body = '', tiles = '';
    for (j = 0; j < n; j++) head += '<th scope="col" data-j="' + j + '">' + j + '</th>';
    for (i = 0; i < n; i++) {
      body += '<tr data-w="' + i + '"><th scope="row">' + i + '</th>';
      for (j = 0; j < n; j++) body += '<td data-j="' + j + '">' + cost[i][j] + '</td>';
      body += '</tr>';
    }
    for (var m = 0; m < 1 << n; m++) {
      var bits = '';
      for (j = n - 1; j >= 0; j--) bits += '<i>' + (m >> j & 1) + '</i>';
      tiles += '<div class="bm-tile"><span class="bm-bits" aria-label="mask ' + bin(m, n) + '">' + bits + '</span><b></b></div>';
    }
    return '<div class="bm"><table class="bm-cost"><caption class="faint">Cost of giving worker (row) the job (column)</caption><thead>' + head + '</tr></thead><tbody>' + body + '</tbody></table>' +
      '<div class="bm-grid" role="img" aria-label="dp value for every mask, in increasing mask order">' + tiles + '</div>' +
      '<p class="bm-math mono" aria-live="off"></p>' +
      '<dl class="va-read"><div><dt>dp[full]</dt><dd class="bm-best"></dd></div><div><dt>assignment</dt><dd class="bm-asg mono"></dd></div></dl></div>';
  }

  function paint(cost, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(cost);
    var n = cost.length, tr = f.step === 'trace' || f.step === 'done';
    OR.$$('.bm-tile', stage).forEach(function (el, m) {
      var onPath = f.path.indexOf(m) >= 0 && tr;
      el.className = 'bm-tile' + (f.dp[m] < INF ? ' fill' : '') + (m === f.cur ? ' cur' : '') + (m === f.tgt ? ' tgt' : '') + (onPath ? ' best' : '');
      OR.$('b', el).textContent = f.dp[m] < INF ? f.dp[m] : '∞';
      OR.$$('i', el).forEach(function (b, k) { b.className = m === f.tgt && f.job >= 0 && n - 1 - k === f.job && !tr ? 'new' : ''; });
    });
    OR.$$('.bm-cost tbody tr', stage).forEach(function (row, i) {
      var active = f.w === i && f.step !== 'start' && f.step !== 'done';
      row.className = active ? 'row' : '';
      OR.$$('td', row).forEach(function (td, j) {
        td.className = (f.used >> j & 1 ? 'used' : '') + (active && f.job === j ? ' cur' : '') + (f.asg[i] === j && (f.step === 'trace' || f.step === 'done') ? ' best' : '');
      });
    });
    OR.$$('.bm-cost th[data-j]', stage).forEach(function (th) { th.className = f.used >> +th.dataset.j & 1 ? 'used' : ''; });
    OR.$('.bm-math', stage).textContent = f.math || '';
    OR.$('.bm-best', stage).innerHTML = '<b class="num">' + (f.dp[(1 << n) - 1] < INF ? f.dp[(1 << n) - 1] : '∞') + '</b>';
    OR.$('.bm-asg', stage).textContent = f.asg.length && tr ? f.asg.map(function (j, i) { return i in f.asg ? i + '→' + j : ''; }).filter(Boolean).join('  ') : '—';
  }

  OR.viz.bitmask = {
    frames: frames, brute: brute, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><div class="bm-fields"><div><label class="field-label" for="bm-in">Cost matrix, rows split by “;” (up to ' + MAX_N + ' × ' + MAX_N + ')</label>' +
        '<input class="input mono" id="bm-in" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0][0]) + '"></div><button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) { return '<button class="chip" type="button" data-p="' + i + '">' + esc(p[1]) + '</button>'; }).join('') +
        '<span class="faint">The greedy trap pays 11 with cheapest-first, but 4 is possible.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#bm-in', host), slot = OR.$('.va-player', host);
      function run() {
        var cost = parse(input.value) || parse(PRESETS[0][0]);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(cost), steps: STEPS, label: 'Bitmask DP, ' + cost.length + ' workers and jobs',
          paint: function (stage, f) { paint(cost, stage, f); mark(f.step === 'start' ? null : f.step === 'trace' || f.step === 'done' ? 'done' : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var p = e.target.closest('[data-p]');
        if (p) { input.value = PRESETS[+p.dataset.p][0]; run(); }
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
