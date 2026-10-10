/* Offer Ready: problem detail (#/problem/:num).
   Status, a problem timer (adds to the time logged for the problem), the hint ladder (the pattern,
   then written hints, then the solution), notes that autosave, and an editor that runs the tests. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  function ladder(p, x) {
    var meta = OR.topicMeta(p.topic) || {};
    return [{ label: 'The pattern', body: '**' + p.pattern + '**, from ' + '[' + (meta.title || p.topic) + '](#/topic/' + p.topic + ').' }]
      .concat((x.hints || []).map(function (h, i) { return { label: 'Hint ' + (i + 1), body: h }; }));
  }
  // The step-by-step reasoning that led to the solution (data/extras/<topic>.js, `how`).
  function howHTML(x) { return x && x.how ? '<div class="prose pd-how"><h3 class="sub-title">How I got there</h3>' + OR.md(x.how) + '</div>' : ''; }
  /* Original wording (never LeetCode's text): the task, worked examples, and the approach behind the solution. */
  function questionHTML(st) {
    if (!st) return '<p class="muted">No statement written here yet. Open the problem on LeetCode for the full text.</p>';
    return '<div class="prose">' + OR.md(st.q) + (st.ex ? '<h3 class="sub-title">Examples</h3>' + OR.md(st.ex) : '') + '</div>' +
      '<p class="faint">Restated in our own words. LeetCode’s page has the exact constraints and the judge.</p>';
  }
  function recordHTML(lc) {
    var r = OR.store.problem(lc), bits = [];
    bits.push(['Time logged', r.minutes ? OR.fmtMin(r.minutes) : 'none yet']);
    bits.push(['Hints opened', String(r.hints || 0) + (r.sawSolution ? ', plus the solution' : '')]);
    if (r.solvedAt) bits.push(['First solved', OR.fmtDate(r.solvedAt)]);
    var rv = r.review;
    if (rv) bits.push(['Review', rv.done ? 'Graduated after 5 cold re-solves' : 'Step ' + (rv.stage + 1) + ' of ' + OR.store.REVIEW_STEPS.length + ', due ' + (rv.due <= OR.today() ? 'now' : OR.fmtDate(rv.due, { month: 'short', day: 'numeric' }))]);
    return '<dl class="pd-record">' + bits.map(function (b) { return '<div><dt>' + b[0] + '</dt><dd>' + esc(b[1]) + '</dd></div>'; }).join('') + '</dl>';
  }

  OR.views.problem = {
    title: function (ctx) { var p = OR.problem(ctx.params.num); return p ? p.lc + '. ' + p.title : 'Problem'; },
    render: function (main, ctx) {
      var p = OR.problem(ctx.params.num);
      if (!p) {
        main.innerHTML = '<div class="page empty"><h1 class="empty-title display">Problem ' + esc(ctx.params.num) + ' isn’t in the bank</h1><p>The bank holds NeetCode 150 plus anchor problems. Search for it by name, or browse the list.</p><a class="btn btn-primary" href="#/problems">Browse problems</a></div>';
        return;
      }
      var st = (OR.statements || {})[p.lc], x = OR.problemExtras(p.lc), steps = ladder(p, x), meta = OR.topicMeta(p.topic) || {}, lc = p.lc;
      var same = OR.problems.filter(function (q) { return q.topic === p.topic && q.lc !== lc; }).slice(0, 8);

      main.innerHTML = '<div class="page pd">' +
        '<header class="pd-head"><span class="bib-tag pd-bib">' + lc + '</span><div><h1 class="page-title display">' + esc(p.title) + '</h1>' +
          '<p class="pd-meta"><span class="diff diff-' + p.difficulty + '">' + p.difficulty + '</span><a href="#/topic/' + p.topic + '">' + esc(meta.title || p.topic) + '</a>' +
          (p.lists.indexOf('blind75') >= 0 ? '<span class="chip">Blind 75</span>' : '') + (p.lists.indexOf('nc150') >= 0 ? '<span class="chip">NeetCode 150</span>' : '') +
          (p.premium ? '<span class="chip">' + OR.icon('lock', 'icon-sm') + 'LeetCode Premium</span>' : '') + '</p></div>' +
          '<a class="btn btn-primary" href="' + OR.lcUrl(p) + '" target="_blank" rel="noopener noreferrer">Open on LeetCode' + OR.icon('external', 'icon-sm') + '</a></header>' +
        '<div class="pd-bar">' +
          '<div class="seg pd-status" role="radiogroup" aria-label="Status">' + OR.STATUS.map(function (s) {
            return '<button type="button" role="radio" data-status="' + s[0] + '">' + s[1] + '</button>';
          }).join('') + '</div>' +
          '<div class="pd-timer" role="group" aria-label="Problem timer"><span class="pd-clock num" role="timer" aria-live="off">00:00</span><button class="btn btn-sm" type="button" data-t="toggle"></button></div></div>' +
        '<div class="pd-grid"><div class="pd-main">' +
          '<section class="pd-sec" aria-labelledby="pd-q"><h2 id="pd-q" class="section-title">The question</h2>' + questionHTML(st) + '</section>' +
          '<section class="pd-sec" aria-labelledby="pd-hints"><h2 id="pd-hints" class="section-title">Hint ladder</h2><p class="muted">Try for 15 to 20 minutes before each rung. Each hint you open is logged, and a problem solved with help comes back for its first cold re-solve after 1 day instead of 3.</p><ol class="ladder" id="ladder"></ol></section>' +
          '<section class="pd-sec" aria-labelledby="pd-sol"><h2 id="pd-sol" class="section-title">Solution</h2><div id="pd-solution"></div></section>' +
          '<section class="pd-sec" aria-labelledby="pd-notes"><h2 id="pd-notes" class="section-title">Notes</h2>' +
            '<label class="field"><span class="field-hint">The trick, the bug that cost you time, what to say next time. Saved as you type.</span><textarea class="textarea" id="pd-note-text" rows="5"></textarea></label><p class="faint pd-saved" id="pd-saved" aria-live="polite"></p></section>' +
        '</div><aside class="pd-side">' +
          '<section aria-labelledby="pd-rec"><h2 id="pd-rec" class="sub-title">Your record</h2><div id="pd-record"></div></section>' +
          (same.length ? '<section aria-labelledby="pd-same"><h2 id="pd-same" class="sub-title">Same topic</h2><ul class="plain-list">' + same.map(function (q) {
            return '<li><a href="#/problem/' + q.lc + '"><span class="num faint">' + q.lc + '</span>' + esc(q.title) + '</a><span class="diff diff-' + q.difficulty + '">' + q.difficulty + '</span></li>';
          }).join('') + '</ul></section>' : '') +
        '</aside></div>' +
        '<section class="pd-sec pd-editor" aria-labelledby="pd-ed"><h2 id="pd-ed" class="section-title">Solve it here</h2>' +
          '<p class="muted">' + (x.tests ? 'Write your solution, then run it against ' + OR.plural(x.tests.cases.length, 'test case') + '.' : 'No test cases for this problem yet, so Run executes your code and shows what it prints. LeetCode remains the judge.') + '</p>' +
          '<div id="pd-panel"></div></section></div>';

      /* Status */
      function paintStatus() {
        var s = OR.store.problem(lc).status || 'todo';
        OR.$$('[data-status]', main).forEach(function (b) { var on = b.dataset.status === s; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
        OR.$('#pd-record').innerHTML = recordHTML(lc);
      }
      OR.$('.pd-status', main).addEventListener('click', function (e) {
        var b = e.target.closest('[data-status]'); if (!b) return;
        var r = OR.store.problem(lc), s = b.dataset.status;
        OR.store.setProblem(lc, { status: s });
        paintStatus();
        var rv = OR.store.problem(lc).review;
        if (OR.isSolved(s) && !OR.isSolved(r.status) && rv && rv.due) OR.toast('Logged. It comes back for a cold re-solve on ' + OR.fmtDate(rv.due, { weekday: 'short', month: 'short', day: 'numeric' }) + '.', { tone: 'ok' });
      });

      /* Timer */
      var startedAt = 0, tick = null, clock = OR.$('.pd-clock', main), tBtn = OR.$('[data-t="toggle"]', main);
      function base() { return (OR.store.problem(lc).minutes || 0) * 60000; }
      function paintTimer() {
        clock.textContent = OR.fmtClock(base() + (startedAt ? Date.now() - startedAt : 0));
        tBtn.innerHTML = OR.icon(startedAt ? 'pause' : 'play', 'icon-sm') + (startedAt ? 'Pause' : (base() ? 'Resume' : 'Start') + ' timer');
      }
      function commit() {
        if (!startedAt) return;
        var add = (Date.now() - startedAt) / 60000; startedAt = 0; clearInterval(tick);
        var r = OR.store.problem(lc);
        OR.store.setProblem(lc, { minutes: Math.round(((r.minutes || 0) + add) * 100) / 100, status: r.status === 'todo' ? 'attempted' : r.status });
        paintStatus();
      }
      tBtn.addEventListener('click', function () {
        if (startedAt) commit();
        else { startedAt = Date.now(); tick = setInterval(paintTimer, 1000); }
        paintTimer();
      });

      /* Hint ladder + solution */
      function paintLadder() {
        var r = OR.store.problem(lc), open = r.hints || 0;
        OR.$('#ladder').innerHTML = steps.map(function (s, i) {
          if (i < open) return '<li class="rung" data-open="true"><p class="rung-label">' + s.label + '</p><div class="prose rung-body">' + OR.md(s.body) + '</div></li>';
          if (i === open) return '<li class="rung"><button class="btn btn-sm" type="button" data-hint>' + OR.icon('bulb', 'icon-sm') + 'Show ' + s.label.toLowerCase() + '</button><span class="faint">' + (i + 1) + ' of ' + steps.length + '</span></li>';
          return '<li class="rung" data-locked="true"><p class="rung-label">' + s.label + '</p></li>';
        }).join('') + (x.hints ? '' : '<li class="rung"><p class="faint">No written hints for this problem yet; the pattern is the strongest one.</p></li>');
        var sol = OR.$('#pd-solution');
        if (!x.solution && st && st.a && !r.sawSolution) sol.innerHTML = '<p class="muted">Hidden until you ask. Opening it counts as a hint.</p><button class="btn" type="button" data-solution>' + OR.icon('lock', 'icon-sm') + 'Show the approach</button>';
        else if (!x.solution && st && st.a) sol.innerHTML = '<div class="prose">' + OR.md(st.a) + '</div>' + howHTML(x) + '<p class="faint">Approach only. Code for this problem is yours to write below.</p>';
        else if (!x.solution) sol.innerHTML = '<p class="muted">No written solution here yet. LeetCode’s Editorial and Solutions tabs have several; read one only after a real attempt.</p>';
        else if (!r.sawSolution) sol.innerHTML = '<p class="muted">Hidden until you ask. Opening it counts as a hint.</p><button class="btn" type="button" data-solution>' + OR.icon('lock', 'icon-sm') + 'Show the solution</button>';
        else sol.innerHTML = (x.solution.explain ? '<div class="prose">' + OR.md(x.solution.explain) + '</div>' : '') + OR.codeBlock(x.solution.code, { title: p.title }) +
          howHTML(x);
      }
      main.firstChild.addEventListener('click', function (e) { // the page root, not #main, which outlives this view
        if (e.target.closest('[data-hint]')) {
          var r = OR.store.problem(lc);
          OR.store.setProblem(lc, { hints: (r.hints || 0) + 1, status: r.status === 'todo' ? 'attempted' : r.status });
          paintLadder(); paintStatus();
          var opened = OR.$$('#ladder .rung[data-open]').pop(); if (opened) { opened.setAttribute('tabindex', '-1'); opened.focus(); }
        } else if (e.target.closest('[data-solution]')) {
          var r2 = OR.store.problem(lc);
          OR.store.setProblem(lc, { sawSolution: true, status: r2.status === 'todo' ? 'attempted' : r2.status });
          paintLadder(); paintStatus();
        }
      });

      /* Notes */
      var note = OR.$('#pd-note-text'), saved = OR.$('#pd-saved');
      note.value = OR.store.problem(lc).notes || '';
      var saveNote = OR.debounce(function () { OR.store.setProblem(lc, { notes: note.value }); saved.textContent = 'Saved.'; }, 500);
      note.addEventListener('input', function () { saved.textContent = ''; saveNote(); });

      OR.codePanel(OR.$('#pd-panel'), { key: 'problem:' + lc, starter: x.starter, tests: x.tests, onResult: function (r) {
        if (!x.tests || !r.cases || !r.cases.length) return;
        var rec = OR.store.problem(lc);
        if (r.cases.every(function (c) { return c.pass; }) && !OR.isSolved(rec.status)) {
          OR.toast('All tests pass. Mark it solved once LeetCode accepts it too.', { tone: 'ok', action: { label: 'Mark solved', run: function () { OR.store.setProblem(lc, { status: rec.hints || rec.sawSolution ? 'solved' : 'clean' }); paintStatus(); } } });
        }
      } });

      paintStatus(); paintTimer(); paintLadder();
      OR.setPlace({ title: lc + '. ' + p.title, section: 'Problem' });
      var onHide = function () { commit(); };
      addEventListener('pagehide', onHide);
      return function () { commit(); removeEventListener('pagehide', onHide); };
    }
  };
})();
