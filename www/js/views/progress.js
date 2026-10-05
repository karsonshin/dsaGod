/* Offer Ready: Progress, the training log.
   Recent places (resume), study calendar, hours by week, problems, topic mastery, flashcards, manual log. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  function heatLevel(min) { return !min ? 0 : min < 30 ? 1 : min < 60 ? 2 : min < 120 ? 3 : 4; }

  function calendarHTML(st) {
    var today = OR.today(), plan = st.plan;
    var start = plan ? plan.start : OR.addDays(today, -7 * 12);
    var end = plan ? plan.target : OR.addDays(today, 7 * 4);
    var firstAct = Object.keys(st.activity).sort()[0];
    if (firstAct && firstAct < start) start = firstAct;
    if (start < OR.addDays(today, -7 * 40)) start = OR.addDays(today, -7 * 40);
    var shift = (OR.parseDate(start).getDay() + 6) % 7; // align columns to Mondays
    start = OR.addDays(start, -shift);
    var weeks = Math.ceil((OR.daysBetween(start, end) + 1) / 7);
    var cells = '', months = '', lastMonth = -1, totalMin = 0, studyDays = 0;
    for (var w = 0; w < weeks; w++) {
      var colStart = OR.addDays(start, w * 7), m = OR.parseDate(colStart).getMonth();
      if (m !== lastMonth) { months += '<span style="grid-column:' + (w + 1) + '">' + OR.parseDate(colStart).toLocaleDateString(undefined, { month: 'short' }) + '</span>'; lastMonth = m; }
      for (var d = 0; d < 7; d++) {
        var date = OR.addDays(colStart, d), pos = 'grid-column:' + (w + 1) + ';grid-row:' + (d + 1);
        if (date > end) continue;
        if (date > today) {
          cells += '<span class="heat-cell is-future' + (date === end ? ' is-target' : '') + '" style="' + pos + '"' + (date === end ? ' title="Offer day: ' + esc(OR.fmtDate(date)) + '"' : '') + '></span>';
          continue;
        }
        var a = st.activity[date] || {}, min = a.min || 0;
        if (min || a.solved || a.cards) studyDays++;
        totalMin += min;
        var label = OR.fmtDate(date, { weekday: 'short', month: 'short', day: 'numeric' }) + ': ' + (min ? OR.fmtMin(min) : 'no time logged') + (a.solved ? ', ' + OR.plural(a.solved, 'problem') + ' solved' : '') + (a.cards ? ', ' + OR.plural(a.cards, 'card') : '');
        cells += '<span class="heat-cell h' + heatLevel(min) + (date === today ? ' is-today' : '') + '" style="' + pos + '" title="' + esc(label) + '"></span>';
      }
    }
    return '<div class="heat-wrap"><div class="heat-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>' +
      '<div class="heat-scroll"><div class="heat-months" aria-hidden="true" style="grid-template-columns:repeat(' + weeks + ',14px)">' + months + '</div>' +
      '<div class="heat" role="img" aria-label="Study calendar from ' + esc(OR.fmtDate(start)) + ' to offer day: ' + OR.plural(studyDays, 'study day') + ' and ' + OR.fmtMin(totalMin) + ' logged so far." style="grid-template-columns:repeat(' + weeks + ',14px)">' + cells + '</div></div></div>' +
      '<div class="heat-legend" aria-hidden="true">Less <span class="heat-cell h0"></span><span class="heat-cell h1"></span><span class="heat-cell h2"></span><span class="heat-cell h3"></span><span class="heat-cell h4"></span> More <span class="heat-cell is-future"></span> Ahead <span class="heat-cell is-future is-target"></span> Offer day</div>';
  }

  function problemsHTML(st) {
    var rows = [['clean', 'Solved without hints'], ['solved', 'Solved with help'], ['attempted', 'Attempted'], ['review', 'Marked for review']];
    var grid = {}; rows.forEach(function (r) { grid[r[0]] = { Easy: 0, Medium: 0, Hard: 0 }; });
    var recent = [];
    Object.keys(st.problems).forEach(function (n) {
      var r = st.problems[n], p = OR.plan.problemByNum(n);
      if (grid[r.status] && p) grid[r.status][p.difficulty]++;
      if ((r.status === 'solved' || r.status === 'clean') && p) recent.push({ p: p, r: r });
    });
    recent.sort(function (a, b) { return (b.r.updated || 0) - (a.r.updated || 0); });
    var any = Object.keys(st.problems).length;
    if (!any) return '<div class="empty"><p class="empty-title">No problems logged yet.</p><p>Open any problem, solve it on LeetCode, then set its status. Solves, time taken and hint use all show up here.</p><a class="btn" href="#/problems">Browse problems</a></div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Status</th><th><span class="diff diff-Easy">Easy</span></th><th><span class="diff diff-Medium">Medium</span></th><th><span class="diff diff-Hard">Hard</span></th><th>Total</th></tr></thead><tbody>' +
      rows.map(function (r) { var g = grid[r[0]]; return '<tr><td>' + r[1] + '</td><td>' + g.Easy + '</td><td>' + g.Medium + '</td><td>' + g.Hard + '</td><td><strong>' + (g.Easy + g.Medium + g.Hard) + '</strong></td></tr>'; }).join('') +
      '</tbody></table></div>' +
      (recent.length ? '<h3 class="sub-title">Recent solves</h3><ul class="plain-list">' + recent.slice(0, 8).map(function (x) {
        return '<li><a href="#/problem/' + x.p.lc + '"><span class="bib-tag">' + x.p.lc + '</span> ' + esc(x.p.title) + '</a><span class="diff diff-' + x.p.difficulty + '">' + x.p.difficulty + '</span><span class="faint num">' + (x.r.minutes ? x.r.minutes + ' min' : '') + '</span></li>';
      }).join('') + '</ul>' : '');
  }

  function topicsHTML() {
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Topic</th><th>Mastery</th><th>Practice</th><th>Quiz</th><th>Recall</th></tr></thead><tbody>' +
      OR.curriculum.map(function (t) {
        var m = OR.plan.mastery(t.id), lv = OR.plan.masteryLevel(m.score);
        return '<tr><td><a href="#/topic/' + t.id + '">' + esc(t.title) + '</a></td>' +
          '<td><span class="mbar" data-level="' + lv.id + '"><span style="width:' + Math.round(m.score * 100) + '%"></span></span> <span class="faint">' + lv.label + '</span></td>' +
          '<td class="num">' + (m.total ? m.solved + '/' + m.total : '–') + '</td><td class="num">' + (m.quiz ? Math.round(m.quiz * 100) + '%' : '–') + '</td><td class="num">' + (m.retention ? Math.round(m.retention * 100) + '%' : '–') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function cardsHTML(st) {
    var ids = OR.plan.allCardIds(), seen = 0, mature = 0, due = 0, today = OR.today();
    ids.forEach(function (id) { var c = st.cards[id]; if (!c) return; seen++; if (c.interval >= 7) mature++; if (c.due && c.due <= today) due++; });
    if (!seen) return '<p class="muted">No flashcards reviewed yet. Cards from each topic join your deck as you study.</p>';
    return '<dl class="logbook"><div><dt>Cards seen</dt><dd><span class="v">' + seen + '</span><span class="u">of ' + ids.length + '</span></dd></div>' +
      '<div><dt>Long-term (7+ day interval)</dt><dd><span class="v">' + mature + '</span><span class="u">' + Math.round(100 * mature / Math.max(1, seen)) + '% of seen</span></dd></div>' +
      '<div><dt>Due now</dt><dd><span class="v">' + due + '</span><span class="u"><a href="#/flashcards">Review</a></span></dd></div>' +
      '<div><dt>Retention</dt><dd><span class="v">' + Math.round(OR.store.retention(ids.filter(function (id) { return st.cards[id]; })) * 100) + '%</span><span class="u">of seen cards</span></dd></div></dl>';
  }

  function historyHTML(st) {
    if (!st.history.length) return '<p class="muted">Pages you open show up here, and each link takes you back to the exact spot you left.</p>';
    return '<ul class="plain-list">' + st.history.map(function (h) {
      return '<li><a href="' + esc(h.hash) + '" data-intent="restore">' + OR.icon('history', 'icon-sm') + ' ' + esc(h.title) + (h.section ? ' <span class="faint">· ' + esc(h.section) + '</span>' : '') + '</a><time class="faint">' + OR.ago(h.at) + '</time></li>';
    }).join('') + '</ul>';
  }

  OR.views.progress = {
    title: function () { return 'Progress'; },
    render: function (main) {
      OR.plan.ensure();
      var st = OR.store.get();
      main.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><h1 class="page-title display">Progress</h1><p class="page-lede">Your training log: every session, solve, card and lesson, and a link back to wherever you left off.</p></div>' +
        '<button class="btn" data-act="log-time">' + OR.icon('plus', 'icon-sm') + 'Log time manually</button></div>' +
        '<div class="grid-2">' +
          '<section aria-labelledby="pg-hist"><h2 class="section-title" id="pg-hist">Where you’ve been</h2>' + historyHTML(st) + '</section>' +
          '<section aria-labelledby="pg-cal"><h2 class="section-title" id="pg-cal">Study calendar</h2>' + calendarHTML(st) + '</section>' +
        '</div>' +
        '<section class="section" aria-labelledby="pg-hours"><h2 class="section-title" id="pg-hours">Hours by week</h2><div id="pg-season"></div></section>' +
        '<section class="section" aria-labelledby="pg-prob"><h2 class="section-title" id="pg-prob">Problems</h2>' + problemsHTML(st) + '</section>' +
        '<section class="section" aria-labelledby="pg-topics"><h2 class="section-title" id="pg-topics">Topic mastery</h2><p class="muted section-note">Mastery blends practice solved (40%), best quiz score (30%) and flashcard recall (30%).</p>' + topicsHTML() + '</section>' +
        '<section class="section" aria-labelledby="pg-cards"><h2 class="section-title" id="pg-cards">Flashcards</h2>' + cardsHTML(st) + '</section>' +
        '</div>';
      var chart = OR.seasonChart(OR.$('#pg-season'), { compact: true, onPick: function (n) { OR.go('#/plan?week=' + n); } });
      return function () { chart.destroy(); };
    }
  };

  OR.actions['log-time'] = async function () {
    var html = '<div class="stack-4" style="margin-top:12px"><div class="field"><label class="field-label" for="lt-date">Date</label><input class="input" type="date" id="lt-date" value="' + OR.today() + '" max="' + OR.today() + '"></div>' +
      '<div class="field"><label class="field-label" for="lt-min">Minutes studied</label><input class="input" type="number" id="lt-min" min="1" max="720" value="30" autofocus></div></div>';
    var v = await OR.dialog({ title: 'Log study time', html: html, buttons: [{ label: 'Cancel', value: 'cancel' }, { label: 'Log time', value: 'ok', primary: true }] });
    if (v !== 'ok') return;
    var date = OR.$('#lt-date').value, min = Math.round(+OR.$('#lt-min').value);
    if (!date || !(min > 0) || min > 720) { OR.toast('Enter a date and between 1 and 720 minutes.', { tone: 'error' }); return; }
    OR.store.logMinutes(date, min);
    OR.toast('Logged ' + OR.fmtMin(min) + ' on ' + OR.fmtDate(date) + '.', { tone: 'ok' });
    OR.rerender();
  };
})();
