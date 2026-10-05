/* Offer Ready: Plan view, not-found, and placeholders for surfaces still being built.
   Each placeholder disappears when its real view file registers the same name. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  /* ---------- Plan (week by week) ---------- */
  OR.views.plan = OR.views.plan || {
    title: function () { return 'Plan'; },
    render: function (main, ctx) {
      var plan = OR.plan.ensure(); if (!plan) return;
      var cur = OR.plan.weekIndex(), focus = +ctx.query.week || cur, pace = OR.plan.pace();
      var weeks = plan.weeks.map(function (w) {
        var t = w.tracks || {}, mins = OR.plan.minutesBetween(w.start, w.end);
        var topics = w.topics.map(function (x) {
          var m = OR.topicMeta(x.id), done = OR.plan.topicDone(x.id);
          return '<li><a href="#/topic/' + x.id + '">' + (done ? OR.icon('check', 'icon-sm') : '') + esc(m ? m.title : x.id) + '</a> <span class="faint num">' + x.hours + ' h</span></li>';
        }).join('');
        var tracks = [];
        if (t.practice) tracks.push(t.practice + ' practice problems');
        if (t.systemDesign) tracks.push('System design: ' + t.systemDesign);
        if (t.behavioral) tracks.push('Behavioral: ' + t.behavioral);
        if (t.cs) tracks.push('CS fundamentals: ' + t.cs);
        if (t.mocks) tracks.push(OR.plural(t.mocks, 'mock interview'));
        if (t.applications) tracks.push('Applications: ' + t.applications);
        return '<article class="wk-row' + (w.n === cur ? ' is-now' : '') + (w.n === focus ? ' is-focus' : '') + '" id="week-' + w.n + '">' +
          '<div class="wk-n"><span class="bib">' + w.n + '</span><span class="faint">' + OR.fmtDate(w.start, { month: 'short', day: 'numeric' }) + '</span></div>' +
          '<div><h2 class="wk-phase">' + esc(OR.plan.phase(w.phase).name) + (w.n === cur ? ' <span class="chip chip-accent">This week</span>' : '') + '</h2>' +
          (topics ? '<ul class="wk-topics">' + topics + '</ul>' : '<p class="muted">Mixed timed practice and interview prep.</p>') +
          '<p class="wk-tracks">' + esc(tracks.join(' · ')) + '</p></div>' +
          '<div class="wk-hours num">' + (w.n <= cur ? OR.fmtHours(mins) + ' / ' : '') + w.hours + ' h</div></article>';
      }).join('');
      main.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><h1 class="page-title display">Plan</h1><p class="page-lede">' + plan.weeks.length + ' weeks from ' + OR.fmtDate(plan.start) + ' to offer day, ' + OR.fmtDate(plan.target) + '. ' +
        esc(pace.label) + '.</p></div><div class="btn-row"><button class="btn" data-act="rebalance" title="Re-spread unfinished topics over the remaining weeks">' + OR.icon('reset', 'icon-sm') + 'Re-plan remaining weeks</button><a class="btn btn-ghost" href="#/settings">Change timeline</a></div></div>' +
        '<div id="plan-season" class="section-tight"></div>' +
        (plan.trimmed && plan.trimmed.length ? '<div class="banner">' + OR.icon('info') + '<div>To fit your hours, these topics are optional: ' + esc(plan.trimmed.map(function (id) { return (OR.topicMeta(id) || {}).title || id; }).join(', ')) + '. <a href="#/settings">Add weekly hours</a> to schedule them.</div></div>' : '') +
        '<div class="wk-list">' + weeks + '</div></div>';
      var chart = OR.seasonChart(OR.$('#plan-season'), { selected: focus, detail: false, onPick: function (n) { var el = OR.$('#week-' + n); if (el) el.scrollIntoView({ behavior: OR.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); } });
      if (ctx.query.week) setTimeout(function () { var el = OR.$('#week-' + focus); if (el) el.scrollIntoView({ block: 'start' }); }, 30);
      return function () { chart.destroy(); };
    },
    scrollsItself: function (ctx) { return !!ctx.query.week; }
  };

  /* ---------- Not found ---------- */
  OR.views.notFound = {
    title: function () { return 'Not found'; },
    render: function (main, ctx) {
      main.innerHTML = '<div class="page empty"><h1 class="empty-title display">Nothing lives at ' + esc(ctx.path) + '</h1><p>The link may be from an older version, or mistyped.</p><div class="btn-row"><a class="btn btn-primary" href="#/">Back to Today</a><button class="btn" data-act="palette">Search instead</button></div></div>';
    }
  };

  /* ---------- Placeholders for surfaces in later build phases ---------- */
  var LATER = {
    roadmap: ['Roadmap', 6, 'An interactive dependency graph of every topic, colored by mastery, plus the recommended order.'],
    detective: ['Pattern Detective', 3, 'Read a problem statement, name the pattern, and track your accuracy per pattern.'],
    viz: ['Visualizers', 3, 'Every algorithm visualizer in one place, from the sorting race to Dijkstra.'],
    cheatsheets: ['Cheat sheets', 5, 'Printable one-page sheets: Big-O, sorting, patterns, graph chooser, DP catalog, and the night before.'],
    mock: ['Mock interview', 6, 'A 45-minute timed room with phase prompts and a self-scoring rubric that tracks your trend.'],
    systemDesign: ['System design', 5, 'Fundamentals, the interview framework, an estimation calculator and 13 interactive case studies.'],
    behavioral: ['Behavioral', 5, 'STAR(L), a story bank with competency coverage, 50+ questions and timed practice.'],
    cs: ['CS fundamentals', 5, 'Operating systems, concurrency, networking and databases for screening rounds.'],
    career: ['Career & offers', 5, 'Job-search strategy, the interview process, compensation and negotiation scripts.'],
    resume: ['Resume studio', 5, 'A resume guide and builder, plus PDF and cover-letter storage per company with URL autofill.'],
    pipeline: ['Pipeline', 5, 'A kanban of every application from wishlist to offer, with contacts and next actions.'],
    resources: ['Resources', 5, 'Every DSA-Kit link, searchable, tagged and checkable.'],
    wellbeing: ['Wellbeing', 5, 'Session-length guidance, rest days and what to do after a rejection.'],
    selftest: ['Self-test', 8, 'Runs every JavaScript solution against its test cases and reports pass or fail.']
  };
  Object.keys(LATER).forEach(function (k) {
    if (OR.views[k]) return;
    var d = LATER[k];
    OR.views[k] = {
      title: function () { return d[0]; },
      render: function (main) {
        main.innerHTML = '<div class="page empty"><h1 class="empty-title display">' + esc(d[0]) + '</h1><p>' + esc(d[2]) + '</p>' +
          '<p class="faint">This part of Offer Ready arrives in build phase ' + d[1] + '.</p><a class="btn" href="#/">Back to Today</a></div>';
      }
    };
  });
})();
