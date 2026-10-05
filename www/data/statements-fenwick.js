/* Offer Ready: problem statements, Fenwick trees. Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(493, 'Given a list of integers, count the pairs of positions `i < j` where the earlier value is **more than double** the later one: `nums[i] > 2 * nums[j]`.',
    '- `[1,3,2,3,1]` → `2`: the pairs (3, 1) at positions 1 and 4, and (3, 1) at positions 3 and 4\n- `[2,4,3,5,1]` → `3`',
    'Sweep left to right. Before inserting `nums[j]`, ask how many earlier values are greater than `2 * nums[j]`, using a Fenwick tree over compressed values of both the numbers and their doubles. Or count during a merge sort with two pointers. Use 64-bit arithmetic for the doubling. **O(n log n) time.**');
  S(327, 'Given a list of integers and two bounds `lo <= hi`, count the contiguous, non-empty stretches whose total lies in the closed range `[lo, hi]`.',
    '- `[-2,5,-1]`, lo = `-2`, hi = `2` → `3`: the stretches `[-2]`, `[-2,5,-1]` and `[-1]`',
    'Work with prefix sums. A stretch ending at `j` counts when some earlier prefix `p` satisfies `prefix[j] - hi <= p <= prefix[j] - lo`. Compress all prefix values, keep a Fenwick tree of how many earlier prefixes sit at each rank, and answer with the difference of two prefix counts (found by binary search). Use 64-bit sums. **O(n log n) time.**');
})();
