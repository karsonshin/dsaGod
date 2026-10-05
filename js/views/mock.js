/* Offer Ready: Mock interview room (#/mock). A 45-minute timed session with five phases, a problem picked from
   your weakest topic (or any medium), and a self-scoring rubric. The running session lives in drafts['mock:run']
   so a reload keeps the clock; finished sessions go to store.mocks (date, lc, scores, total out of 20). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, KEY = 'mock:run';
  var PHASES = [
    { id: 'clarify', name: 'Clarify', min: 5, say: 'Restate the problem. Ask about input size, duplicates, empty input, and what to return. Write two examples.' },
    { id: 'approach', name: 'Approach', min: 7, say: 'Start with brute force and its cost, then improve. Name the pattern. Get a nod from the interviewer before coding.' },
    { id: 'code', name: 'Code', min: 20, say: 'Write it cleanly, narrating as you go. Use clear names. No silent stretches longer than a minute.' },
    { id: 'test', name: 'Test', min: 8, say: 'Trace a small example by hand, then edge cases: empty, one element, duplicates, extremes. Fix what breaks.' },
    { id: 'wrap', name: 'Wrap up', min: 5, say: 'State time and space complexity. Say what you would change with more time. Ask one real question.' }
  ];
  var TOTAL = PHASES.reduce(function (a, p) { return a + p.min; }, 0);
  var RUBRIC = [
    ['clarify', 'Clarifying', 'Asked about constraints and edge cases before solving'],
    ['approach', 'Approach', 'Brute force first, then a justified improvement'],
    ['code', 'Code', 'Correct, readable, finished in time'],
    ['test', 'Testing', 'Traced an example and caught your own bugs'],
    ['talk', 'Communication', 'Narrated thinking; no long silences']
  ];

  function run() { var r = OR.store.get().drafts[KEY]; return r && r.lc ? r : null; }
  function setRun(r) { OR.store.update(function (s) { if (r) s.drafts[KEY] = r; else delete s.drafts[KEY]; }); }
  function prob(lc) { return OR.problems.filter(function (p) { return p.lc === lc; })[0]; }
  function solved(lc) { return OR.isSolved(OR.store.problem(lc).status); }

  // Weakest topic that still has an unsolved medium; falls back to any unsolved medium, then any problem.
  function pick(avoid) {
    var meds = OR.problems.filter(function (p) { return p.difficulty === 'Medium' && !p.premium && p.lc !== avoid; });
    var open = meds.filter(function (p) { return !solved(p.lc); });
    var pool = open.length ? open : meds.length ? meds : OR.problems;
    var best = null;
    pool.forEach(function (p) {
      var m = OR.topicMeta(p.topic) ? OR.plan.mastery(p.topic).score : 1;
      // Only topics you've started: a mock on something never taught is a lesson, not a mock.
      if (m > 0 && (!best || m < best.m)) best = { p: p, m: m };
    });
    return (best && best.p) || pool[Math.floor(Math.random() * pool.length)];
  }

  // Five phases as one proportional bar: the race card's splits.
  function splitHTML() {
    return '<ol class="mk-split" id="mk-steps">' + PHASES.map(function (x) {
      return '<li data-p="' + x.id + '" style="flex:' + x.min + '"><span>' + x.name + '</span><span class="num faint">' + x.min + '</span></li>';
    }).join('') + '</ol>';
  }
  function phaseAt(sec) { var t = 0; for (var i = 0; i < PHASES.length; i++) { t += PHASES[i].min * 60; if (sec < t) return i; } return PHASES.length - 1; }

  function trendHTML(list) {
    if (!list.length) return '<p class="muted">No mocks yet. Your scores will chart here, so a rising line is the point.</p>';
    var rows = list.slice(-8).reverse().map(function (m) {
      return '<li><span class="faint num">' + OR.fmtDate(m.date, { month: 'short', day: 'numeric' }) + '</span><a href="#/problem/' + m.lc + '">' + esc(m.title) + '</a>' +
        '<span class="mk-bar"><span style="width:' + Math.round(m.total / 20 * 100) + '%"></span></span><span class="num">' + m.total + '/20</span></li>';
    }).join('');
    var avg = Math.round(list.reduce(function (a, m) { return a + m.total; }, 0) / list.length * 10) / 10;
    return '<p class="muted">' + OR.plural(list.length, 'mock') + ', average ' + avg + ' / 20.</p><ul class="mk-trend">' + rows + '</ul>';
  }

  OR.views.mock = {
    title: function () { return 'Mock interview'; },
    render: function (main) {
      var tick = null;
      function stop() { clearInterval(tick); }

      function setup(p) {
        stop();
        var done = OR.store.get().mocks;
        main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Mock interview</h1>' +
          '<p class="page-lede">' + TOTAL + ' minutes, five phases, one problem, no hints. Say everything out loud, then score yourself honestly.</p></div></div>' +
          '<section class="mk-race" aria-label="Your problem"><span class="bib" aria-hidden="true">' + p.lc + '</span><div class="mk-race-main"><h2 class="mk-race-title">' + esc(p.title) + ' <span class="diff diff-' + p.difficulty + '">' + p.difficulty + '</span></h2>' +
          '<p class="muted">From ' + esc((OR.topicMeta(p.topic) || {}).title || p.topic) + ', one of your less-practiced topics. The statement stays hidden until you start.</p></div>' +
          '<div class="mk-race-clock num" aria-label="' + TOTAL + ' minutes">' + TOTAL + ':00</div></section>' +
          splitHTML() +
          '<div class="btn-row"><button class="btn btn-primary btn-lg" data-act="start">' + OR.icon('play', 'icon-sm') + 'Start mock</button><button class="btn btn-ghost" data-act="another">Pick another</button></div>' +
          '<section class="section"><h2 class="section-title">What each phase is for</h2><dl class="mk-phases">' + PHASES.map(function (x) { return '<div><dt>' + x.name + ' <span class="faint num">' + x.min + ' min</span></dt><dd class="muted">' + esc(x.say) + '</dd></div>'; }).join('') + '</dl></section>' +
          '<section class="section"><h2 class="section-title">Your trend</h2>' + trendHTML(done) + '</section></div>';
        OR.$('[data-act="start"]', main).onclick = function () { setRun({ lc: p.lc, start: Date.now() }); running(); };
        OR.$('[data-act="another"]', main).onclick = function () { setup(pick(p.lc)); };
      }

      function running() {
        var r = run(), p = r && prob(r.lc); if (!p) { setup(pick()); return; }
        var st = OR.statements && OR.statements[p.lc];
        main.innerHTML = '<div class="page mk-live"><div class="mk-top"><div class="mk-top-id"><span class="bib" aria-hidden="true">' + p.lc + '</span><h1 class="page-title display">' + esc(p.title) + '</h1></div>' +
          '<div class="mk-clock num" role="timer" aria-label="Time left" id="mk-clock"></div></div>' +
          splitHTML() +
          '<section class="section"><h2 class="section-title" id="mk-now"></h2><p id="mk-say"></p></section>' +
          '<section class="section"><h2 class="section-title">The question</h2><div class="prose">' + (st ? OR.md(st.q + '\n\n' + st.ex) : '<p>Open it on <a href="https://leetcode.com/problems/' + esc(p.slug) + '/" target="_blank" rel="noopener">LeetCode</a>.</p>') + '</div>' +
          '<p class="muted">Code in the <a href="#/playground" target="_blank" rel="noopener">Playground</a> or on LeetCode in another tab. The clock keeps running here.</p></section>' +
          '<div class="btn-row"><button class="btn" data-act="end">Finish and score</button><button class="btn btn-ghost" data-act="abort">Abandon</button></div></div>';
        function paint() {
          var sec = Math.floor((Date.now() - r.start) / 1000), left = TOTAL * 60 - sec, i = phaseAt(Math.max(0, sec));
          OR.$('#mk-clock', main).textContent = (left < 0 ? '+' : '') + OR.fmtClock(Math.abs(left) * 1000);
          OR.$('#mk-clock', main).classList.toggle('is-over', left < 0);
          OR.$$('#mk-steps li', main).forEach(function (li, k) { li.classList.toggle('is-now', k === i); li.classList.toggle('is-past', k < i); });
          OR.$('#mk-now', main).textContent = PHASES[i].name + ' (' + PHASES[i].min + ' min)';
          OR.$('#mk-say', main).textContent = PHASES[i].say;
        }
        paint(); tick = setInterval(paint, 1000);
        OR.$('[data-act="end"]', main).onclick = function () { stop(); score(r, p); };
        OR.$('[data-act="abort"]', main).onclick = function () {
          OR.confirm({ title: 'Abandon this mock?', body: 'Nothing is saved.', ok: 'Abandon' }).then(function (y) { if (y) { stop(); setRun(null); setup(pick()); } });
        };
      }

      function score(r, p) {
        var mins = Math.round((Date.now() - r.start) / 60000);
        main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Score it</h1><p class="page-lede">' + esc(p.title) + ', ' + mins + ' min. Score what an interviewer would have seen, not what you meant. 0 missed, 4 strong.</p></div></div>' +
          '<form id="mk-form" class="mk-form">' + RUBRIC.map(function (c) {
            return '<fieldset><legend>' + c[1] + '</legend><p class="muted">' + c[2] + '</p><div class="mk-pick" role="radiogroup">' +
              [0, 1, 2, 3, 4].map(function (n) { return '<label><input type="radio" name="' + c[0] + '" value="' + n + '"' + (n === 2 ? ' checked' : '') + '><span>' + n + '</span></label>'; }).join('') + '</div></fieldset>';
          }).join('') +
          '<label class="mk-note">What to fix next time<textarea name="note" rows="3" class="input"></textarea></label>' +
          '<div class="btn-row"><button class="btn btn-primary" type="submit">Save mock</button></div></form></div>';
        OR.$('#mk-form', main).onsubmit = function (e) {
          e.preventDefault();
          var f = new FormData(e.target), sc = {}, total = 0;
          RUBRIC.forEach(function (c) { sc[c[0]] = +f.get(c[0]); total += sc[c[0]]; });
          OR.store.update(function (s) { s.mocks.push({ date: OR.today(), lc: p.lc, title: p.title, minutes: mins, scores: sc, total: total, note: String(f.get('note') || '') }); });
          OR.store.logMinutes(null, mins);
          setRun(null);
          OR.toast('Mock saved: ' + total + ' / 20.', { tone: 'ok' });
          setup(pick());
        };
      }

      if (run()) running(); else setup(pick());
      return stop;
    }
  };
})();
