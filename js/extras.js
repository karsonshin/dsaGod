/* Offer Ready: folds data/extras/<id>.js into the lesson for the same topic.
   OR.extras[id] = { primer, breakdown, think, drills, how: { <leetcode number>: 'how the solution was found' } }.
   Kept in separate files so a lesson can gain material without rewriting its 60 to 100 KB file. */
(function () {
  'use strict';
  var OR = window.OR;
  Object.keys(OR.extras || {}).forEach(function (id) {
    var x = OR.extras[id], t = OR.topics.filter(function (e) { return e.id === id; })[0];
    if (!t || !x) return;
    ['primer', 'breakdown', 'think', 'drills'].forEach(function (k) { if (x[k]) t[k] = x[k]; });
    Object.keys(x.how || {}).forEach(function (lc) {
      (t.practice || []).forEach(function (p) { if (String(p.lc) === String(lc)) p.how = x.how[lc]; });
    });
  });
})();
