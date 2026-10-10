/* Offer Ready: problem statements for the extra 2-D / grid DP bank problems.
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* dp-2d */
  S(64, 'A grid holds a non-negative cost in every square. Starting at the top-left square, you may only move one square down or one square right, paying the cost of each square you stand on (the first and last included). Return the smallest total cost of a route to the bottom-right square.',
    '- `[[1,3,1],[1,5,1],[4,2,1]]` → `7`\n- `[[1,2,3],[4,5,6]]` → `12`\n- `[[5]]` → `5`',
    '`dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`, where the first row only has the left source and the first column only the upper one. One rolling row is enough. **O(m·n) time, O(n) space.**');
  S(63, 'A robot starts at the top-left of a grid and can move one square down or right per step. Some squares are blocked (marked 1; free squares are 0) and the robot can never enter them. Count the different routes to the bottom-right square, or 0 if there are none.',
    '- `[[0,0,0],[0,1,0],[0,0,0]]` → `2`\n- `[[0,1],[0,0]]` → `1`\n- `[[1,0]]` → `0` (the start is blocked)',
    'Same sum as the open grid, but a blocked square has 0 routes: `dp[i][j] = 0` if blocked, else `dp[i-1][j] + dp[i][j-1]`. A wall in the first row or column zeroes everything after it. One rolling row works. **O(m·n) time, O(n) space.**');
  S(221, 'You get a grid of characters, each `"0"` or `"1"`. Find the largest square made only of `"1"` cells and return its **area** (side times side).',
    '- `[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]` → `4`\n- `[["0","1"],["1","0"]]` → `1`\n- `[["0"]]` → `0`',
    '`dp[i][j]` is the side of the biggest all-ones square whose bottom-right corner is that cell: `1 + min(up, left, up-left)` for a `"1"`, else `0`. The answer is the **largest value anywhere**, squared. A single row plus one saved diagonal value does it. **O(m·n) time, O(n) space.**');
})();
