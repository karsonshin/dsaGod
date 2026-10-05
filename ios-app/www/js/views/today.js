/* Offer Ready: Today (Home).
   Persuade hero (start tonight), tonight's three items, the Season Chart, resume + logbook. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  var KIND_ICON = { cards: 'cards', review: 'review', lesson: 'topics', practice: 'problems', mock: 'mock', sd: 'system', behavioral: 'behavioral', apply: 'columns' };

  // Shared health banners (storage, unreadable data, backup reminder). Also used by Settings.
  OR.healthBanners = function (withBackupNudge) {
    var h = OR.store.health(), st = OR.store.get(), out = '';
    if (!h.ok) out += '<div class="banner" data-tone="danger" role="alert">' + OR.icon('warning') + '<div><strong>Progress can’t be saved in this window.</strong> ' + esc(h.lastError) + ' Export a backup before you close it.</div><button class="btn btn-sm" data-act="export">Export now</button></div>';
    else if (h.full) out += '<div class="banner" data-tone="danger" role="alert">' + OR.icon('warning') + '<div><strong>Browser storage is full.</strong> Recent changes may not be saved. Export a backup, then delete old documents in the Resume studio to free space.</div><button class="btn btn-sm" data-act="export">Export now</button></div>';
    if (h.corruptKey) out += '<div class="banner" data-tone="warn" role="alert">' + OR.icon('warning') + '<div><strong>Saved progress couldn’t be read, so Offer Ready started fresh.</strong> The unreadable copy was kept. Download it before you dismiss this.</div><button class="btn btn-sm" data-act="download-unreadable">Download copy</button><button class="btn btn-sm btn-ghost" data-act="dismiss-unreadable">Dismiss</button></div>';
    if (withBackupNudge && h.ok) {
      var days = Object.keys(st.activity).length, last = st.settings.lastExport;
      var since = last ? Math.floor((Date.now() - last) / 86400000) : null;
      if (days >= 5 && (since == null || since >= 14)) out += '<div class="banner">' + OR.icon('download') + '<div>' + (since == null ? 'You haven’t backed up your progress yet.' : 'Your last backup was ' + since + ' days ago.') + ' A backup is one JSON file you can import on any device.</div><button class="btn btn-sm" data-act="export">Back up now</button></div>';
    }
    return out;
  };
  OR.actions.export = function () { OR.store.exportFile(); };
  OR.actions['download-unreadable'] = function () { OR.store.downloadUnreadable(); };
  OR.actions['dismiss-unreadable'] = function () { OR.store.dismissUnreadable(); OR.rerender(); };

  function headline(items, week) {
    var lesson = items.filter(function (i) { return i.kind === 'lesson'; })[0];
    var s = OR.store.get().session || {};
    if (s.running) return 'Session running. Keep going.';
    if (lesson) return 'Tonight: ' + lesson.title.replace(/^(Learn|Continue): /, '') + '.';
    if (week && week.phase === 5) return 'Interview mode. Sharpen, don’t cram.';
    return 'Tonight: keep the streak alive.';
  }

  function streakLine(sk) {
    if (sk.days === 0) return sk.best > 0 ? 'Your best streak is ' + OR.plural(sk.best, 'day') + '. Start a new one tonight.' : 'Your streak starts tonight.';
    return (sk.today ? 'Streak: ' : 'Streak on the line: ') + OR.plural(sk.days, 'day') + (sk.today ? '' : '. Study tonight to keep it') + '.';
  }

  function itemHTML(it, i) {
    var meta = [];
    if (it.diff) meta.push('<span class="diff diff-' + it.diff + '">' + it.diff + '</span>');
    if (it.sub) meta.push('<span>' + esc(it.sub) + '</span>');
    return '<li><a class="task" href="' + esc(it.href) + '" data-key="' + esc(it.kind + (it.num || it.topic || '')) + '"' + (it.intent ? ' data-intent="' + it.intent + '"' : '') + (it.done ? ' data-done="true"' : '') + '>' +
      '<span class="task-n">0' + (i + 1) + '</span><span><span class="task-title">' + esc(it.title) + '</span><span class="task-meta">' + meta.join('') + '</span></span>' +
      '<span class="task-min">' + (it.done ? OR.icon('check', 'icon-sm') : it.minutes + ' min') + '</span></a></li>';
  }

  function resumeHTML(st) {
    var p = st.place;
    var hist = (st.history || []).filter(function (h) { return !p || h.hash !== p.hash; }).slice(0, 4);
    if (!p) return '<section class="resume" aria-labelledby="resume-h"><h2 id="resume-h">Pick up where you left off</h2>' +
      '<p class="resume-sub">Nothing to resume yet. Open a lesson, problem or guide and your place is saved here automatically, down to the scroll position.</p></section>';
    return '<section class="resume" aria-labelledby="resume-h"><h2 id="resume-h">Pick up where you left off</h2>' +
      '<p class="resume-where">' + esc(p.title) + '</p>' +
      '<p class="resume-sub">' + (p.section ? esc(p.section) + ' · ' : '') + Math.round((p.frac || 0) * 100) + '% through · ' + OR.ago(p.at) + '</p>' +
      '<div class="resume-bar" aria-hidden="true"><span style="width:' + Math.max(2, Math.round((p.frac || 0) * 100)) + '%"></span></div>' +
      '<div><button class="btn btn-primary" data-act="resume-place" data-hash="' + esc(p.hash) + '">' + OR.icon('history', 'icon-sm') + 'Resume</button></div>' +
      (hist.length ? '<ul class="recent" aria-label="Recently visited">' + hist.map(function (h) {
        return '<li><a href="' + esc(h.hash) + '" data-intent="restore"><span>' + esc(h.title) + (h.section ? ' · ' + esc(h.section) : '') + '</span><time>' + OR.ago(h.at) + '</time></a></li>';
      }).join('') + '</ul>' : '') + '</section>';
  }

  function logbookHTML(st, week) {
    var sk = OR.plan.streak();
    var mins = week ? OR.plan.minutesBetween(week.start, week.end) : 0;
    var byDiff = { Easy: 0, Medium: 0, Hard: 0 }, solved = 0;
    Object.keys(st.problems).forEach(function (n) {
      var r = st.problems[n];
      if (r.status === 'solved' || r.status === 'clean') { solved++; var p = OR.plan.problemByNum(n); if (p) byDiff[p.difficulty]++; }
    });
    var cards = OR.plan.dueCardCount(), reviews = OR.store.reviewDue().length;
    return '<dl class="logbook" aria-label="Logbook">' +
      '<div><dt>Streak</dt><dd><span class="v">' + sk.days + '</span><span class="u">' + (sk.days === 1 ? 'day' : 'days') + ' · best ' + sk.best + '</span></dd></div>' +
      '<div><dt>This week</dt><dd><span class="v">' + OR.fmtHours(mins) + '</span><span class="u">of ' + (week ? week.hours : 0) + ' h planned</span></dd></div>' +
      '<div><dt>Problems solved</dt><dd><span class="v">' + solved + '</span><span class="split-diff"><span class="diff diff-Easy">' + byDiff.Easy + '</span><span class="diff diff-Medium">' + byDiff.Medium + '</span><span class="diff diff-Hard">' + byDiff.Hard + '</span></span></dd></div>' +
      '<div><dt>Due for review</dt><dd><span class="v">' + (cards.due + reviews) + '</span><span class="u">' + OR.plural(cards.due, 'card') + ', ' + OR.plural(reviews, 'problem') + '</span></dd></div>' +
      '</dl>';
  }

  OR.actions['start-tonight'] = function () {
    var s = OR.store.get().session || {};
    if (!s.running) OR.sessionStart();
    var first = OR.plan.todayItems().filter(function (i) { return !i.done; })[0];
    if (first) OR.go(first.href, first.intent);
  };
  OR.actions.rebalance = function () {
    OR.plan.rebalance();
    OR.toast('Remaining weeks rebalanced from this week on.', { tone: 'ok' });
    OR.rerender();
  };

  OR.views.today = {
    title: function () { return 'Today'; },
    render: function (main) {
      var plan = OR.plan.ensure();
      var st = OR.store.get();
      if (!plan) { main.innerHTML = '<div class="page empty"><h1 class="empty-title display">No plan yet</h1><a class="btn btn-primary" href="#/onboarding">Build my plan</a></div>'; return; }
      var wk = OR.plan.weekIndex(), week = OR.plan.week(wk), phase = OR.plan.phase(week.phase);
      var items = OR.plan.todayItems();
      var total = items.reduce(function (t, i) { return t + (i.done ? 0 : i.minutes); }, 0);
      var pace = OR.plan.pace(), sk = OR.plan.streak(), days = OR.plan.daysLeft();
      var s = st.session || {};
      var startLabel = s.running ? 'Continue tonight’s work' : s.accumulated ? 'Resume session' : 'Start session';

      main.innerHTML = '<div class="page today">' + OR.healthBanners(true) +
        '<section class="hero" aria-labelledby="hero-title"><div class="hero-main">' +
          '<h1 id="hero-title" class="hero-title display">' + esc(headline(items, week)) + '</h1>' +
          '<p class="countdown"><span class="bib">' + days + '</span><span class="countdown-words">' + (days === 1 ? 'day' : 'days') + ' to <strong>offer day</strong>, ' + OR.fmtDate(st.settings.targetDate, { month: 'long', day: 'numeric', year: 'numeric' }) + '</span></p>' +
          '<p class="hero-sub">Week ' + wk + ' of ' + plan.weeks.length + ', ' + esc(phase.name.toLowerCase()) + ' phase. ' + esc(streakLine(sk)) + '</p>' +
          '<div class="hero-actions"><button class="btn btn-primary btn-lg" data-act="start-tonight">' + OR.icon(s.running ? 'arrow-right' : 'play', 'icon-sm') + startLabel + '</button>' +
          '<a class="btn btn-ghost" href="#/plan">This week’s plan</a></div>' +
        '</div>' +
        '<section class="tonight" aria-labelledby="tonight-title"><div class="tonight-head"><h2 id="tonight-title">Tonight’s three</h2><span class="tonight-total">' + (total ? 'about ' + total + ' min' : 'all done') + '</span></div>' +
          '<ol>' + items.map(itemHTML).join('') + '</ol></section>' +
        '</section>' +
        '<section class="season" aria-labelledby="season-title"><div class="season-head"><h2 id="season-title">Season</h2>' +
          '<div class="season-legend"><span><i class="lg-plan"></i>Planned hours</span><span><i class="lg-log"></i>Logged</span><span><i class="lg-now"></i>This week</span><span><i class="lg-pace-plan"></i> <i class="lg-pace"></i>Topics finished: planned (dashed) and actual (solid)</span><span class="season-hint">Click a week, or use ← →, to preview it</span></div>' +
          '<span class="pace" data-state="' + pace.state + '">' + esc(pace.label) + (pace.state === 'behind' ? ' · <button class="btn btn-sm" data-act="rebalance" title="Re-spread unfinished topics over the remaining weeks">Rebalance</button>' : '') + '</span></div>' +
          '<div id="season-host"></div></section>' +
        '<div class="today-lower">' + resumeHTML(st) + logbookHTML(st, week) + '</div>' +
        '</div>';

      var chart = OR.seasonChart(OR.$('#season-host'), { onPick: function (n) { OR.go('#/plan?week=' + n); } });
      var off = OR.on('session', function () { OR.rerender(); });
      return function () { chart.destroy(); off(); };
    }
  };
})();
