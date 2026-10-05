/* Cheat sheet 7: the night before the interview. */
(function () {
  var OR = (window.OR = window.OR || {});
  function checks(h, items) { return '<ul class="cs-check">' + items.map(function (x) { return '<li><label><input type="checkbox"><span>' + h.m(x) + '</span></label></li>'; }).join('') + '</ul>'; }
  OR.cheatsheets.push({
    n: 7, id: 'night-before', title: 'The night before the interview',
    blurb: 'A checklist for logistics, five patterns to skim, the first five minutes, phrases for complexity, rest, and what interviewers score.',
    keywords: 'interview checklist night before logistics sleep rubric first five minutes complexity phrases',
    render: function (h) {
      return '<div class="cs-cols cs-cols-2">' +
        '<div>' +
        h.sec('Logistics', checks(h, [
          'Time, time zone, interviewer names, link or address confirmed in writing.',
          'Camera, microphone, headphones, internet and charger tested. Phone on silent.',
          'Ask the recruiter which language, editor or shared-pad tool is used. Open it once and run hello world.',
          'Quiet room, water, pen and paper for sketching examples.',
          'On site: ID, route, arrive 15 minutes early. Remote: join 5 minutes early.',
          'Resume in front of you, plus two or three stories you can tell in two minutes.'
        ])) +
        h.sec('Skim these five patterns (about 10 minutes each, no new topics)', checks(h, [
          '[[arrays-hashing|Hash map]]: seen-before and frequency counting.',
          '[[sliding-window|Sliding window]] and [[two-pointers|two pointers]]: contiguous ranges, sorted pairs.',
          '[[graphs|BFS and DFS]]: grids, shortest steps, components.',
          '[[binary-search|Binary search]], including on the answer.',
          '[[dp-1d|Dynamic programming]]: state, transition, base case.'
        ]) + '<p class="cs-foot">Pick your own five from the Progress page if these are not your weakest. Patterns and skeletons are on sheet 3.</p>') +
        h.sec('Sleep, food, mind', checks(h, [
          'Stop learning new material a few hours before bed. Light review only.',
          'Aim for a normal full night. Set two alarms. Prepare clothes and bag.',
          'Eat a normal meal and your usual caffeine. Do not try new things tonight.',
          'Morning: water, a short walk, one easy problem as a warm-up, then stop.',
          'If you feel nervous, that is normal. Slow breathing and writing your plan down both help.'
        ])) +
        '</div><div>' +
        h.sec('The first five minutes', '<ol class="cs-steps">' + [
          '**Repeat** the problem in your own words.',
          '**Ask** about inputs: size, empty, duplicates, negatives, sorted, return format, in place or a copy.',
          '**Walk** one example by hand, then one edge case.',
          '**State** the brute force and its cost, in one sentence.',
          '**Propose** the better idea, say its complexity, and get a nod before you code.',
          '**Then** code while narrating. Name variables well.'
        ].map(function (x) { return '<li>' + h.m(x) + '</li>'; }).join('') + '</ol>') +
        h.sec('Say complexity like this', h.list([
          '“O(n) time: each element is pushed and popped at most once.”',
          '“O(n log n), dominated by the sort. O(n) extra space for the map.”',
          '“Amortized O(1) per append; one resize costs O(n).”',
          '“O(V+E): every vertex and edge is visited once.”',
          '“Worst case O(n²) when the pivot is bad; average O(n log n).”',
          '“O(1) extra space; recursion adds O(h) stack, h is the tree height.”'
        ])) +
        h.sec('If you get stuck', h.list([
          'Say what you know and what blocks you. Silence scores worse than a wrong idea.',
          'Shrink the input: solve n = 2 and n = 3 by hand and look for the repeated step.',
          'Go back to the brute force and find what it recomputes.',
          'Ask for a hint. One hint rarely sinks a good interview.'
        ])) +
        h.sec('What interviewers usually score', h.T(
          ['Area', 'They look for'],
          [
            ['Problem solving', 'Clarifying questions, a brute force, then an improvement with reasons'],
            ['Coding', 'Correct, readable, idiomatic code written without long pauses'],
            ['Verification', 'You trace an example and edge cases and find your own bugs'],
            ['Communication', 'You think aloud, take hints well, and are easy to work with']
          ], { cls: 'cs-rubric', label: 'Interview scoring areas' }) + '<p class="cs-foot">Exact rubrics vary by company; these four are the common core.</p>') +
        '</div></div>' +
        h.sec('Last five minutes of the interview', h.list(['Test with the given example, then empty, one element, duplicates and the largest size.', 'Say the final time and space complexity.', 'Ask one real question about the team. Thank them.']));
    }
  });
})();
