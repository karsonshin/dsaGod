/* Offer Ready: problem statements for the knapsack topic's extra practice problems.
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(474, 'You have a list of binary strings (made only of `0` and `1`), and two budgets: at most `m` zeros and at most `n` ones in total. Pick as many of the strings as you can without exceeding either budget, and return how many you picked.',
    '- strings `"10", "0001", "111001", "1", "0"`, `m = 5`, `n = 3` → `4` (`"10", "0001", "1", "0"`)\n- strings `"10", "0", "1"`, `m = 1`, `n = 1` → `2`',
    'A 0/1 knapsack with two capacities. `dp[i][j]` is the most strings using at most `i` zeros and `j` ones. For each string with `z` zeros and `o` ones, update `dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1)` with both loops going **downward**. **O(len · m · n) time, O(m · n) space.**');
  S(1049, 'You have a pile of stones with positive whole-number weights. Repeatedly pick any two stones and smash them: if they weigh the same both vanish, otherwise the lighter vanishes and the heavier loses the lighter’s weight. Return the smallest possible weight of the last remaining stone (0 if none remain).',
    '- stones `2, 7, 4, 1, 8, 1` → `1`\n- stones `31, 26, 33, 21, 40` → `5`',
    'Any smashing order amounts to splitting the stones into two groups and ending with the difference of their sums. Find the largest subset sum `s <= total / 2` using a 0/1 boolean table, then return `total - 2 * s`. **O(n · total) time, O(total) space.**');
  S(377, 'Given a list of distinct positive integers and a target, count the ordered sequences of those integers (an integer may repeat) that add up to the target. Different orderings count as different sequences.',
    '- numbers `1, 2, 3`, target `4` → `7`\n- numbers `9`, target `3` → `0`',
    'Let `dp[a]` be the number of sequences summing to `a`, `dp[0] = 1`. Any sequence ends with some number `x`, so `dp[a] = sum of dp[a - x]` over `x <= a`. The **amount is the outer loop** (any number may come last, so order matters). **O(target · n) time, O(target) space.**');
})();
