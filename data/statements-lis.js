/* Offer Ready: problem statements for the LIS topic extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. (Problem 300 already lives in statements-4.js.) */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(354, 'Each envelope has a width and a height. One envelope fits inside another only if both its width and its height are strictly smaller, and envelopes cannot be rotated. Return the largest number of envelopes that can be nested one inside the next.',
    '- `[[5,4],[6,4],[6,7],[2,3]]` → `3`\n- `[[1,1],[1,1],[1,1]]` → `1`',
    'Sort by width ascending and, for equal widths, by height **descending** (so two equal-width envelopes can never both be picked). Then find the longest strictly increasing subsequence of the heights with the tails array and binary search. **O(n log n) time, O(n) space.**');
  S(673, 'Given a list of integers, return how many strictly increasing subsequences have the maximum possible length. Subsequences at different positions are different even if their values match.',
    '- `[1,3,5,4,7]` → `2`\n- `[2,2,2,2,2]` → `5`',
    'Extend the O(n²) DP: `length[i]` is the longest increasing subsequence ending at `i`, and `count[i]` is how many achieve it. A longer way resets `count[i] = count[j]`; a tie adds `count[i] += count[j]`. Sum `count` over indices whose length is the maximum. **O(n²) time, O(n) space.**');
  S(646, 'You are given pairs `[left, right]` with `left < right`. A pair may follow another when its `left` is strictly greater than the previous pair’s `right`. Pairs may be chosen in any order and some may be skipped. Return the length of the longest chain.',
    '- `[[1,2],[2,3],[3,4]]` → `2`\n- `[[1,2],[7,8],[4,5]]` → `3`',
    'Sort by right endpoint, then greedily take a pair whenever its left is past the last chosen right (earliest finish leaves the most room). **O(n log n) time.**');
})();
