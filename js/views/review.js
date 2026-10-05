/* Offer Ready: review queue (#/review).
   Solved problems come back for cold re-solves after 1, 3, 7, 14 and 30 days. "Needed help" resets
   a problem to the first step; five clean re-solves graduate it. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  function rowHTML(lc, due) {
    var p = OR.problem(lc), r = OR.store.problem(lc), rv = r.review || {}, last = (rv.log || []).slice(-1)[0];
    if (!p) return '';
    return '<li class="rv-row"><span class="bib-tag">' + lc + '</span><div class="rv-main"><a href="#/problem/' + lc + '">' + esc(p.title) + '</a>' +
      '<p class="rv-meta"><span class="diff diff-' + p.difficulty + '">' + p.difficulty + '</span><span>Step ' + (rv.stage + 1) + ' of ' + OR.store.REVIEW_STEPS.length + '</span>' +
      (last ? '<span>Last time: ' + (last.ok ? 'solved cold' : 'needed help') + ', ' + OR.fmtDate(last.date, { month: 'short', day: 'numeric' }) + '</span>' : '<span>First review</span>') + '</p></div>' +
      (due ? '<div class="rv-actions"><button class="btn btn-sm btn-primary" type="button" data-rv="ok" data-lc="' + lc + '">' + OR.icon('check', 'icon-sm') + 'Solved it cold</button>' +
        '<button class="btn btn-sm" type="button" data-rv="help" data-lc="' + lc + '">Needed help</button></div>'
        : '<span class="rv-when num">' + OR.fmtDate(rv.due, { weekday: 'short', month: 'short', day: 'numeric' }) + '</span>') + '</li>';
  }

  OR.views.review = {
    title: function () { return 'Review queue'; },
    render: function (main) {
      var st = OR.store.get(), today = OR.today(), due = OR.store.reviewDue(today);
      var all = Object.keys(st.problems).filter(function (n) { return st.problems[n].review; });
      var upcoming = all.filter(function (n) { var r = st.problems[n].review; return !r.done && r.due > today; })
        .sort(function (a, b) { return st.problems[a].review.due < st.problems[b].review.due ? -1 : 1; });
      var graduated = all.filter(function (n) { return st.problems[n].review.done; }).length;

      main.innerHTML = '<div class="page page-narrow">' +
        '<div class="page-head"><div><h1 class="page-title display">Review queue</h1><p class="page-lede">Re-solve each problem from a blank editor, without notes or hints. Solved it cold: it moves up a step (1, 3, 7, 14, then 30 days). Needed help: it starts over at 1 day.</p></div></div>' +
        (due.length
          ? '<section aria-labelledby="rv-due"><h2 id="rv-due" class="section-title">Due now <span class="faint num">' + due.length + '</span></h2><ol class="rv-list">' + due.map(function (n) { return rowHTML(n, true); }).join('') + '</ol></section>'
          : '<div class="empty"><h2 class="empty-title">Nothing due today</h2><p>' + (all.length ? 'Your next re-solve is ' + (upcoming.length ? 'on ' + OR.fmtDate(st.problems[upcoming[0]].review.due, { weekday: 'long', month: 'short', day: 'numeric' }) : 'not scheduled') + '.' : 'Mark a problem solved and it comes back here for a cold re-solve.') + '</p>' + (all.length ? '' : '<a class="btn" href="#/problems">Browse problems</a>') + '</div>') +
        (upcoming.length ? '<section class="section" aria-labelledby="rv-next"><h2 id="rv-next" class="section-title">Coming up</h2><ol class="rv-list">' + upcoming.slice(0, 30).map(function (n) { return rowHTML(n, false); }).join('') + '</ol>' +
          (upcoming.length > 30 ? '<p class="faint">And ' + (upcoming.length - 30) + ' more later.</p>' : '') + '</section>' : '') +
        (graduated ? '<p class="section faint">' + OR.plural(graduated, 'problem') + ' graduated after five clean re-solves.</p>' : '') +
        '</div>';

      main.firstChild.addEventListener('click', function (e) { // the page root, not #main, which outlives this view
        var b = e.target.closest('[data-rv]'); if (!b) return;
        var lc = +b.dataset.lc, ok = b.dataset.rv === 'ok', r = OR.store.reviewProblem(lc, ok), p = OR.problem(lc);
        OR.toast(p.lc + '. ' + p.title + (r.done ? ' graduated. It won’t come back.' : ' comes back on ' + OR.fmtDate(r.due, { weekday: 'short', month: 'short', day: 'numeric' }) + '.'), { tone: 'ok' });
        OR.rerender();
        var next = OR.$('[data-rv="ok"]', main); if (next) next.focus({ preventScroll: true });
      });
    }
  };
})();
