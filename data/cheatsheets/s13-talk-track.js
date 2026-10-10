/* Cheat sheet 13: what to say in each phase of a 45-minute coding interview. */
(function () {
  var OR = (window.OR = window.OR || {});
  OR.cheatsheets.push({
    n: 13, id: 'talk-track', title: 'Say it out loud: the interview talk-track',
    blurb: 'Phrases to say in each phase of a 45-minute coding interview, a bank of clarifying questions, how to ask for hints, and what interviewers score.',
    keywords: 'interview communication phrases clarifying questions narrate hint stuck complexity follow-up rubric talk',
    render: function (h) {
      var q = function (s) { return '"' + s + '"'; };
      return h.cols(
        h.sec('Phases and phrases', h.T(['Phase (min)', 'Say'], [
          ['Restate (0-3)', q('So I am given X and must return Y. Is that right?') + ' ' + q('Let me check an example.')],
          ['Examples (3-6)', q('Take [2,7,11], target 9: answer is [0,1]. Now an edge case: empty input. What should happen?')],
          ['Brute force (6-9)', q('The simple way is to try every pair. That is O(n²) time, O(1) space. It works but the bottleneck is the repeated search.')],
          ['Optimize (9-13)', q('The bottleneck is looking up a partner. If I store seen values in a hash map, that lookup is O(1).') + ' ' + q('This looks like a sliding window because the range is contiguous.')],
          ['Agree (13-15)', q('I will go with the hash map: O(n) time, O(n) space. Does that sound good before I code?')],
          ['Code (15-30)', q('First the loop, then the update. I am using a dict for counts. This line handles the empty case.') + ' Narrate decisions, not every keystroke.'],
          ['Test (30-38)', q('Let me trace [3,3], target 6. i=0: need 3, not seen, store. i=1: need 3, found. Returns [0,1].') + ' Then empty, one element, duplicates.'],
          ['Complexity (38-41)', q('Time is O(n): one pass with O(1) average lookups. Space is O(n) for the map. Worst case hashing is O(n) per lookup but that is rare.')],
          ['Follow-ups (41-45)', q('If the array is sorted, two pointers gets O(1) space.') + ' ' + q('If it does not fit in memory, I would ... ')]
        ], { cls: 'cs-tt1', label: 'Phases and phrases' })) +
        h.sec('Twelve clarifying questions', h.T(['Input', 'Ask'], [
          ['Array', q('Can it be empty? Sorted? Duplicates? Negative numbers? Size range?')],
          ['String', q('ASCII or Unicode? Case sensitive? Spaces and punctuation?')],
          ['Number', q('Integer or float? Can it overflow? Is zero valid?')],
          ['Tree / list', q('Binary search tree or plain? Can nodes repeat? Can it be null?')],
          ['Graph', q('Directed? Weighted? Connected? Cycles or self-loops?')],
          ['Output', q('One answer or all of them? If several are valid, any? Return a copy or modify in place?')],
          ['Scale', q('How large can n be? Is memory limited? Called once or many times?')]
        ], { cls: 'cs-tt2', label: 'Clarifying questions' })),
        h.sec('Hints, stuck, bugs', h.T(['Moment', 'Say'], [
          ['Ask for a hint', q('I am considering A and B but unsure how to get past the O(n²) step. Could you point me toward what to focus on?') + ' Show your thinking first.'],
          ['Stuck', q('Let me go back to a small example and see what repeats.') + ' ' + q('What is the information I recompute? Can I store it?')],
          ['Found a bug', q('I see an issue here: this index is off by one when n is 1. Let me fix it and re-run my example.')],
          ['Wrong turn', q('This path is O(n²) in the worst case, so I will step back. The better idea is... ') + ' Keep the parts that still apply.'],
          ['Do not', 'Go silent for more than about 30 seconds, argue with a hint, or claim "done" without running an example.']
        ], { cls: 'cs-tt3', label: 'Hints, stuck and bugs' })) +
        h.sec('What interviewers score (rubric)', h.T(['Area', 'They look for'], [
          ['Problem solving', 'Clarifies, finds brute force, then improves with a reason'],
          ['Coding', 'Clean, correct, readable names, working code'],
          ['Verification', 'Tests aloud, edge cases, finds own bugs'],
          ['Communication', 'Thinks aloud, takes hints well, states trade-offs']
        ], { cls: 'cs-tt4', label: 'Interview rubric' }) + '<p class="cs-foot">Rubrics vary by company. This is the common shape, not a standard.</p>') +
        h.sec('Closing questions to ask', h.list([
          q('What does a typical week look like for this team?'),
          q('What makes someone successful here in the first six months?'),
          q('What is the hardest technical problem the team is facing?'),
          q('How does the team handle code review and on-call?')
        ]))
      );
    }
  });
})();
