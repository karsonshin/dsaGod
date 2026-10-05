/* Offer Ready: problem statements for interval DP. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. (312 lives in statements-4.js.) */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(1039, 'A convex polygon has a number on each corner, listed in order around the edge. Split it into triangles with non-crossing diagonals. Each triangle scores the product of its three corner numbers. Return the smallest possible total score over all ways to split it.',
    '- `[1,2,3]` → `6`\n- `[3,7,4,5]` → `144`\n- `[1,3,1,4,1,5]` → `13`',
    'Interval DP. The edge from corner `l` to corner `r` lies in exactly one triangle, with some third corner `k`: `dp[l][r] = min(dp[l][k] + dp[k][r] + v[l]*v[k]*v[r])`. Fill by increasing `r - l`. **O(n³) time, O(n²) space.**');
  S(1130, 'You are given the values of the leaves of a binary tree, read left to right (the tree itself is yours to choose, and each internal node has exactly two children). An internal node\'s value is the product of the largest leaf in its left subtree and the largest leaf in its right subtree. Return the smallest possible sum of all internal node values.',
    '- `[6,2,4]` → `32`\n- `[4,11]` → `44`',
    'The range DP (split at `k`, cost `max(l..k) * max(k+1..r)`) is O(n³). The optimal answer is a **decreasing monotonic stack**: when a new value is at least the top, pop the top and pay `top * min(next on stack, new value)`; finally pay the leftover pairs. **O(n) time and space.**');
  S(375, 'I pick a secret whole number from 1 to `n`. You guess; a wrong guess of `k` costs `k` coins and I tell you whether the secret is higher or lower. A right guess is free. Return the smallest budget that guarantees you can always find the number.',
    '- `n = 1` → `0`\n- `n = 4` → `4`\n- `n = 10` → `16`',
    'Interval DP, min of max: `dp[l][r] = min over k of k + max(dp[l][k-1], dp[k+1][r])`, with empty and single-number ranges at 0. Fill by increasing range length. **O(n³) time, O(n²) space.**');
  S(1547, 'A wooden stick of length `n` must be cut at every position listed in `cuts`. A cut costs the current length of the piece you are cutting, and you may do the cuts in any order. Return the minimum total cost.',
    '- `n = 7, cuts = [1,3,4,5]` → `16`\n- `n = 9, cuts = [5,6,1,4,2]` → `22`',
    'Sort the cuts and add `0` and `n`. `dp[l][r] = (pos[r] - pos[l]) + min over k of dp[l][k] + dp[k][r]` for `k` strictly between. **O(m³) time and O(m²) space for m cuts.**');
})();
