/* Cheat sheet 12: an evidence-based study protocol. */
(function () {
  var OR = (window.OR = window.OR || {});
  function ol(h, a) { return '<ol class="cs-steps">' + a.map(function (x) { return '<li>' + h.m(x) + '</li>'; }).join('') + '</ol>'; }
  OR.cheatsheets.push({
    n: 12, id: 'study-playbook', title: 'Learn fast, remember longer',
    blurb: 'A practical study protocol for months of daily practice: recall, spacing, interleaving, the stuck rule, an error log, a daily and weekly rhythm, and how to know a topic is learned.',
    keywords: 'study learning spaced repetition active recall interleaving error log feynman schedule sleep mock rejection habits',
    render: function (h) {
      return h.cols(
        h.sec('Methods with solid evidence', h.T(['Method', 'How to do it here'], [
          ['Active recall', 'Close the lesson and write the template or explain the idea from memory before looking. Retrieval beats rereading and highlighting. It feels harder, and that difficulty is the point.'],
          ['Spaced repetition', 'Reviews spread over days beat one cram. **Flashcards** use due dates: do what is due. The **Review queue** brings solved problems back at 1, 3, 7, 14 and 30 days. **Pattern Detective** schedules cases the same way. Those exact intervals are a sensible rule of thumb, not a law.'],
          ['Interleaving', 'After the first pass on a pattern, mix patterns in one session so you must choose the technique, which is the real interview skill. Block practice feels smoother but transfers worse. Use Pattern Detective and the **Mock room** for this.'],
          ['Explain aloud (Feynman)', 'Teach the idea to an imaginary beginner in two minutes, no jargon. Where you stall is the gap. Do it for every pattern you finish.'],
          ['Write from memory', 'Rewrite the [[sliding-window|window]], [[binary-search|binary search]], BFS and DP skeletons on blank paper weekly. Compare, fix, repeat.']
        ], { cls: 'cs-sp1', label: 'Study methods' })) +
        h.sec('The stuck rule', ol(h, [
          'Struggle for 20 to 25 minutes. Use the hints ladder one rung at a time, smallest hint first.',
          'Still stuck: read the approach (not the code first), close it, then write the solution yourself.',
          'Solve it cold the next day. If it fails, it goes back on the Review queue sooner.'
        ]) + '<p class="cs-foot">Twenty-five minutes is a rule of thumb. Longer feels productive but mostly burns time. Shorter skips the useful struggle.</p>') +
        h.sec('Error log (2 minutes per miss)', h.list([
          'One line each: the problem, what failed, **which cue you missed** ("sorted input means two pointers"), the fix.',
          'Reread the log every weekend. Repeated entries show your real weak pattern; make a flashcard for each.'
        ])) +
        h.sec('When a topic is truly learned', ol(h, [
          'You solve a new, unseen problem in the pattern cold, within the time budget.',
          'You explain it in two minutes, including the complexity and one trap.',
          'You write the template without looking.'
        ]) + '<p class="cs-foot">Recognizing the solution when you read it is not the same as producing it.</p>'),
        h.sec('A daily session (about 75 to 90 min)', h.T(['Min', 'Do', 'Where'], [
          ['5', 'Flashcards that are due', 'Flashcards'],
          ['40', 'One new lesson, with the practice problems', 'Today, Roadmap'],
          ['20', 'Solve cold, then check; hints only after the stuck rule', 'Plan, Review queue'],
          ['10', 'Error log, then tomorrow\'s first card', 'Review queue'],
          ['5', 'Close the day: list what you would write from memory', '']
        ], { cls: 'cs-sp2', label: 'Daily session' }) + '<p class="cs-foot">Short and daily beats long and weekly. On a busy day, keep the flashcards and the review, and drop the new lesson.</p>') +
        h.sec('A weekly rhythm', h.T(['Day', 'Focus'], [
          ['Mon to Thu', 'New lessons plus daily reviews; interleave one older pattern each day'],
          ['Fri', 'Review day: clear the Review queue, redo two logged misses cold'],
          ['Sat', 'Mock room: one timed problem, talk aloud, then score yourself'],
          ['Sun', 'Rest, or only flashcards. Skim the error log. Check the Roadmap for next week']
        ], { cls: 'cs-sp3', label: 'Weekly rhythm' })) +
        h.sec('Sleep, breaks, energy', h.list([
          'Sleep helps memory consolidation. Study hard material earlier in the day and do not trade sleep for extra hours.',
          'Take 5 minutes away from the screen every 45 to 60 minutes. Walk, no phone.',
          'Stop when quality drops. One focused hour beats three tired ones.'
        ])) +
        h.sec('After a rejection', ol(h, [
          'Within 24 hours, write what happened: questions, where you stalled, what you did well. Facts, not verdicts.',
          'Add each miss to the error log and the Review queue. Note communication gaps too.',
          'Take one day off, then resume the normal rhythm. Variance is large: one result says little about your ability. Book a mock within a week.'
        ]))
      );
    }
  });
})();
