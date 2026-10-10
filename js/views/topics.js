/* Offer Ready: Topics index (#/topics), the owner's pick "Season lanes" (2026-10-02).
   One lane per phase in plan order, with each phase's week range; a row fills as its mastery grows. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  OR.views.topics = {
    title: function () { return 'Topics'; },
    render: function (main) {
      var plan = OR.plan.ensure(), weeks = {}, lanes = {};
      if (plan) plan.weeks.forEach(function (w) { var r = weeks[w.phase] = weeks[w.phase] || { a: w.n, b: w.n }; r.b = w.n; });
      OR.curriculum.forEach(function (t, k) { (lanes[t.phase] = lanes[t.phase] || []).push({ t: t, n: k + 1 }); });

      main.innerHTML = '<div class="page"><div class="page-head"><div><h1 class="page-title display">Topics</h1>' +
        '<p class="page-lede">All ' + OR.curriculum.length + ' topics in the order your plan teaches them, one lane per phase. A row fills as you learn, practice and master it.</p></div>' +
        '<p class="lane-legend"><span><i data-level="learning"></i>Learning</span><span><i data-level="practicing"></i>Practicing</span><span><i data-level="mastered"></i>Mastered</span></p></div>' +
        '<div class="lanes">' + Object.keys(lanes).map(function (ph) {
          var r = weeks[ph];
          return '<section class="lane" aria-labelledby="lane-' + ph + '"><header class="lane-head"><h2 id="lane-' + ph + '">' + esc(OR.plan.phase(+ph).name) + '</h2>' +
            (r ? '<span class="faint num">W' + r.a + (r.b > r.a ? '–' + r.b : '') + '</span>' : '') + '</header><ol>' +
            lanes[ph].map(function (x) {
              var score = OR.plan.mastery(x.t.id).score, lv = OR.plan.masteryLevel(score);
              return '<li><a href="#/topic/' + x.t.id + '" data-level="' + lv.id + '"><span class="lane-n">' + String(x.n).padStart(2, '0') + '</span>' +
                '<span>' + esc(x.t.title) + (lv.id === 'new' ? '' : '<span class="sr-only">, ' + lv.label.toLowerCase() + '</span>') + '</span>' +
                '<span class="lane-fill" style="width:' + Math.round(score * 100) + '%"></span></a></li>';
            }).join('') + '</ol></section>';
        }).join('') + '</div></div>';
    }
  };
})();
