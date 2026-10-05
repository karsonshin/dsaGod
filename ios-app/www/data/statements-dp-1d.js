/* Offer Ready: problem statements for the extra 1-D DP practice problems (122, 343, 279).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(122, 'You get a list of daily prices for one stock. Each day you may buy, sell, or do nothing, holding at most one share at a time, and you may trade as often as you like (selling and buying again on the same day is allowed). Return the largest total profit.',
    '- prices `[7,1,5,3,6,4]` → `7` (buy at 1, sell at 5, buy at 3, sell at 6)\n- prices `[1,2,3,4,5]` → `4`\n- prices `[7,6,4,3,1]` → `0`',
    'Two states per day, holding or not holding, collapse to one fact: every day-to-day **rise** can be collected separately, and falls never need to be paid. Sum `max(0, prices[i] - prices[i-1])`. **O(n) time, O(1) space.**');
  S(343, 'Split a whole number `n` (at least 2) into two or more positive whole numbers that add up to `n`. Return the largest product the parts can have.',
    '- `n = 2` → `1` (1 + 1)\n- `n = 10` → `36` (3 + 3 + 4)',
    'DP view: `dp[i]` is the best product for `i`, trying a first part `j` that is either left whole or split further. The pattern behind it: break into as many **3s** as possible; a leftover 1 turns one 3 into a 4 (2 × 2), a leftover 2 stays as a 2. **O(log n) time with fast power, or O(n) with a loop; O(1) space.**');
  S(279, 'Given a positive whole number `n`, return the smallest number of perfect squares (1, 4, 9, 16, ...) that add up to `n`. A square can be used more than once.',
    '- `n = 12` → `3` (4 + 4 + 4)\n- `n = 13` → `2` (4 + 9)',
    'DP view: `dp[i] = 1 + min(dp[i - k*k])` over every square `k*k <= i`, giving O(n·√n). The answer is never above 4 (Lagrange), and number theory decides it exactly: 1 if `n` is a square, 4 if (after removing factors of 4) `n % 8 == 7`, 2 if `n` is a sum of two squares, otherwise 3. **O(√n) time, O(1) space.**');
})();
