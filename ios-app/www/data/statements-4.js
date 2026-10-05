/* Offer Ready: problem statements, part 4 (dynamic programming, kadane, greedy).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* dp-1d */
  S(70, 'You climb a staircase of n steps, taking 1 or 2 steps at a time. Count the distinct ways to reach the top.',
    '- `n = 2` → `2`\n- `n = 3` → `3`',
    '`ways[i] = ways[i-1] + ways[i-2]`, which is Fibonacci. Keep only the last two values. **O(n) time, O(1) space.**');
  S(746, 'Each stair has a cost to step on it. You may start on stair 0 or 1 and climb 1 or 2 at a time; the top is just past the last stair. Return the minimum total cost to reach the top.',
    '- `[10,15,20]` → `15`\n- `[1,100,1,1,1,100,1,1,100,1]` → `6`',
    '`best[i] = cost[i] + min(best[i-1], best[i-2])`; the answer is the min of the last two. Two rolling variables. **O(n) time, O(1) space.**');
  S(198, 'Houses in a row hold money; robbing two adjacent houses triggers an alarm. Return the most you can take.',
    '- `[1,2,3,1]` → `4`\n- `[2,7,9,3,1]` → `12`',
    '`dp[i] = max(dp[i-1], dp[i-2] + nums[i])`: skip the house or rob it. Roll two variables. **O(n) time, O(1) space.**');
  S(213, 'Same as House Robber, but the houses form a circle, so the first and last are adjacent.',
    '- `[2,3,2]` → `3`\n- `[1,2,3,1]` → `4`',
    'Either the first or the last house is unused, so take the max of House Robber on `nums[:-1]` and on `nums[1:]` (handle one house separately). **O(n) time, O(1) space.**');
  S(91, 'Letters map to numbers (A=1 … Z=26). Given a digit string, count how many ways it can be decoded back to letters.',
    '- `"12"` → `2` (`AB` or `L`)\n- `"226"` → `3`\n- `"06"` → `0`',
    '`dp[i]` = ways for the first i digits: add `dp[i-1]` if the last digit is 1–9, and `dp[i-2]` if the last two digits form 10–26. Roll two variables. **O(n) time, O(1) space.**');
  S(139, 'Decide whether a string can be split into a sequence of words from a dictionary (words may be reused).',
    '- `"leetcode"`, `["leet","code"]` → `true`\n- `"catsandog"`, `["cats","dog","sand","and","cat"]` → `false`',
    '`dp[i]` is true if some `j < i` has `dp[j]` true and `s[j:i]` in the set. Limit j to the maximum word length. **O(n·L) time** for the longest word length L.');

  /* string-dp */
  S(5, 'Return the longest palindromic substring of a string.',
    '- `"babad"` → `"bab"` (or `"aba"`)\n- `"cbbd"` → `"bb"`',
    'Expand around each of the 2n−1 centers, tracking the longest. Manacher’s algorithm gets O(n), but the center expansion at **O(n²) time, O(1) space** is the usual interview answer.');
  S(647, 'Count the substrings of a string that are palindromes (equal substrings at different positions count separately).',
    '- `"abc"` → `3`\n- `"aaa"` → `6`',
    'Expand around each center and count every successful expansion. **O(n²) time, O(1) space.**');
  S(1143, 'Return the length of the longest subsequence common to two strings (characters in order, not necessarily adjacent).',
    '- `"abcde"`, `"ace"` → `3`\n- `"abc"`, `"def"` → `0`',
    '`dp[i][j]`: if the characters match, `1 + dp[i-1][j-1]`, else `max(dp[i-1][j], dp[i][j-1])`. Keep one row. **O(m·n) time, O(min(m,n)) space.**');
  S(97, 'Decide whether a string `s3` is formed by interleaving `s1` and `s2`: both are split into pieces that alternate, with each string’s order preserved.',
    '- `"aabcc"`, `"dbbca"`, `"aadbbcbcac"` → `true`; with `"aadbbbaccc"` → `false`',
    '`dp[i][j]` = whether the first i of s1 and j of s2 form the first i+j of s3: true if `dp[i-1][j]` and `s1[i-1] == s3[i+j-1]`, or `dp[i][j-1]` and `s2[j-1] == s3[i+j-1]`. Reject if lengths mismatch. **O(m·n) time, O(n) space.**');
  S(115, 'Count the distinct subsequences of `s` that equal the string `t`.',
    '- `"rabbbit"`, `"rabbit"` → `3`\n- `"babgbag"`, `"bag"` → `5`',
    '`dp[j]` = ways to form the first j chars of t. For each char of s, iterate j downward: if `s[i] == t[j-1]`, `dp[j] += dp[j-1]`. **O(m·n) time, O(n) space.**');
  S(72, 'Return the minimum number of single-character insert, delete or replace operations to turn one string into another.',
    '- `"horse"`, `"ros"` → `3`\n- `"intention"`, `"execution"` → `5`',
    '`dp[i][j]` = edit distance of the prefixes: equal chars copy `dp[i-1][j-1]`, else `1 + min(insert, delete, replace)`. Rolling row. **O(m·n) time, O(n) space.**');
  S(10, 'Implement pattern matching where `.` matches any single character and `*` means zero or more of the preceding element. The pattern must match the whole string.',
    '- `"aa"`, `"a"` → `false`\n- `"aa"`, `"a*"` → `true`\n- `"ab"`, `".*"` → `true`',
    '`dp[i][j]` for the first i chars of s and j of p. For `*`: either drop `x*` (`dp[i][j-2]`) or, if the previous pattern char matches `s[i-1]`, consume one char (`dp[i-1][j]`). **O(m·n) time.**');

  /* knapsack */
  S(322, 'Given coin denominations and an amount, return the fewest coins that make the amount exactly, or -1 if impossible. Coins can be reused.',
    '- `[1,2,5]`, `11` → `3`\n- `[2]`, `3` → `-1`',
    '`dp[a] = 1 + min(dp[a - c])` over coins c. Start with `dp[0] = 0`, others infinity. **O(amount · coins) time, O(amount) space.**');
  S(416, 'Decide whether a list of positive integers can be split into two subsets with equal sums.',
    '- `[1,5,11,5]` → `true`\n- `[1,2,3,5]` → `false`',
    'If the total is odd, return false. Otherwise it’s a subset-sum for target `total / 2` with a 1D boolean array iterated downward (or a bitset). **O(n·target) time, O(target) space.**');
  S(518, 'Count the combinations (order doesn’t matter) of coins that make up an amount; coins can be reused.',
    '- `5`, `[1,2,5]` → `4`',
    'Loop coins in the outer loop and amounts in the inner loop: `dp[a] += dp[a - c]`, with `dp[0] = 1`. Coins outside makes it combinations rather than permutations. **O(amount · coins) time, O(amount) space.**');
  S(494, 'Place `+` or `-` in front of every number in a list so the total equals a target, and count how many sign assignments work.',
    '- `[1,1,1,1,1]`, `3` → `5`',
    'With P the sum of the `+` group, `P = (total + target) / 2`; reduce to counting subsets with that sum (return 0 if parity or range is wrong). 1D DP iterated downward. **O(n·P) time, O(P) space.**');

  /* kadane */
  S(152, 'Return the largest product of any contiguous, non-empty stretch of a list of integers.',
    '- `[2,3,-2,4]` → `6`\n- `[-2,0,-1]` → `0`',
    'Track both the max and min product ending at each position (a negative can flip a min into a max). Update with `max(x, x*max, x*min)` and likewise for the min. **O(n) time, O(1) space.**');
  S(53, 'Return the largest sum of any contiguous, non-empty stretch of a list.',
    '- `[-2,1,-3,4,-1,2,1,-5,4]` → `6`\n- `[5,4,-1,7,8]` → `23`',
    'Kadane: `cur = max(x, cur + x)`, `best = max(best, cur)`. **O(n) time, O(1) space.**');
  S(1800, 'Return the largest sum of a contiguous stretch of a list whose values are strictly increasing.',
    '- `[10,20,30,5,10,50]` → `65`',
    'Single pass: if the value is greater than the previous, add to the running sum, otherwise restart from it; track the max. **O(n) time, O(1) space.**');
  S(1749, 'Return the maximum absolute value of the sum of any contiguous stretch (possibly empty) of a list.',
    '- `[1,-3,2,3,-4]` → `5`\n- `[2,-5,1,-4,3,-2]` → `8`',
    'Run Kadane for the maximum sum and for the minimum sum; the answer is `max(maxSum, -minSum)`. Or `max prefix − min prefix`. **O(n) time, O(1) space.**');
  S(2606, 'Each lowercase letter has a cost (given by a table for some letters, otherwise its alphabet position 1–26). Return the maximum cost of any substring, where the empty substring costs 0.',
    '- `"adaa"`, chars `"d"`, vals `[-1000]` → `2`',
    'Map each letter to its cost and run Kadane with a floor of 0. **O(n) time, O(1) space.**');
  S(918, 'The list is circular, so a stretch may wrap around the end. Return the maximum non-empty stretch sum.',
    '- `[1,-2,3,-2]` → `3`\n- `[5,-3,5]` → `10`\n- `[-3,-2,-3]` → `-2`',
    'The best is either a normal Kadane result or `total − minSubarray` (the wrapping case). If all values are negative, the wrapping result is empty, so use the plain Kadane answer. **O(n) time, O(1) space.**');
  S(1567, 'Return the length of the longest contiguous stretch of a list whose product is positive.',
    '- `[1,-2,-3,4]` → `4`\n- `[0,1,-2,-3,-4]` → `3`',
    'Track the longest stretch ending here with a positive product and with a negative product. A zero resets both; a negative value swaps them (with +1 on the new negative). **O(n) time, O(1) space.**');
  S(978, 'Return the length of the longest contiguous stretch in which the comparison signs between neighbors strictly alternate (up, down, up… or down, up, down…).',
    '- `[9,4,2,10,7,8,8,1,9]` → `5`',
    'Keep `up` and `down` lengths ending at each position: a rise sets `up = down + 1` and `down = 1`, a fall mirrors it, equal resets both to 1. **O(n) time, O(1) space.**');
  S(1014, 'Each spot has a value. A pair `i < j` scores `values[i] + values[j] + i - j`. Return the best score.',
    '- `[8,1,5,2,6]` → `11`',
    'Rewrite as `(values[i] + i) + (values[j] - j)`. Sweep j while maintaining the best `values[i] + i` seen so far. **O(n) time, O(1) space.**');
  S(1186, 'Return the maximum sum of a non-empty contiguous stretch where you may delete at most one element from it.',
    '- `[1,-2,0,3]` → `4`\n- `[1,-2,-2,3]` → `3`',
    'Keep two Kadane states: `noDel` (ending here) and `oneDel` (a deletion used). `oneDel = max(oneDel + x, noDel_prev)`. Answer is the max of both over time. **O(n) time, O(1) space.**');
  S(1191, 'Repeat a list k times to form a long list; return the maximum sum of a contiguous stretch (empty allowed), modulo 1,000,000,007.',
    '- `[1,2]`, `k = 3` → `9`\n- `[1,-2,1]`, `k = 5` → `2`',
    'Compute Kadane on one copy and on two copies; if `k = 1` use one copy. For `k ≥ 2`, if the list total is positive add `(k − 2) × total` to the two-copy answer. **O(n) time.**');
  S(2321, 'You may swap one same-position contiguous stretch between two lists of equal length. Return the highest score, the larger of the two lists’ sums after the swap.',
    '- `[60,60,60]`, `[10,90,10]` → `210`',
    'The gain from swapping is the best subarray of `nums2 − nums1` (added to sum1) and of `nums1 − nums2` (added to sum2). Run Kadane on both difference lists. **O(n) time.**');
  S(2272, 'The variance of a string is the largest difference between the counts of any two characters in it. Return the largest variance of any substring.',
    '- `"aababbb"` → `3`',
    'For each ordered pair of letters (a, b), run a Kadane where `a` is +1 and `b` is −1, requiring at least one b in the stretch (track a flag). Take the max across pairs. **O(26²·n) time.**');

  /* lis */
  S(300, 'Return the length of the longest strictly increasing subsequence of a list.',
    '- `[10,9,2,5,3,7,101,18]` → `4`\n- `[0,1,0,3,2,3]` → `4`',
    'Patience sorting: keep `tails`, where `tails[k]` is the smallest tail of an increasing subsequence of length k+1. For each value, binary-search the first tail ≥ it and replace (or append). **O(n log n) time, O(n) space.**');

  /* dp-2d */
  S(62, 'A robot starts at the top-left of an m×n grid and may only move right or down. Count the paths to the bottom-right.',
    '- `m = 3`, `n = 7` → `28`\n- `m = 3`, `n = 2` → `3`',
    '`dp[j] += dp[j-1]` row by row, or the closed form `C(m+n-2, m-1)`. **O(m·n) time, O(n) space** for the DP; the combinatorial formula is O(min(m, n)).');
  S(309, 'Given daily stock prices, you can buy and sell any number of times, but must wait one day after selling before buying again, and hold at most one share. Return the maximum profit.',
    '- `[1,2,3,0,2]` → `3`',
    'State machine per day: `hold`, `sold`, `rest`. `hold = max(hold, rest − p)`, `sold = hold_prev + p`, `rest = max(rest, sold_prev)`. Answer `max(sold, rest)`. **O(n) time, O(1) space.**');
  S(329, 'In a grid of integers, find the length of the longest strictly increasing path moving up, down, left or right.',
    '- `[[9,9,4],[6,6,8],[2,1,1]]` → `4`',
    'DFS with memoization: `longest(cell) = 1 + max(longest(neighbor))` over strictly larger neighbors. Each cell is computed once. **O(m·n) time and space.**');

  /* interval-dp */
  S(312, 'You have balloons with values. Bursting balloon i earns `nums[i-1] * nums[i] * nums[i+1]` (treat out-of-range neighbors as 1). Return the maximum coins from bursting all.',
    '- `[3,1,5,8]` → `167`',
    'Interval DP over which balloon is burst *last* in `(l, r)`: `dp[l][r] = max(dp[l][k] + dp[k][r] + a[l]*a[k]*a[r])`, with 1s padding both ends. **O(n³) time, O(n²) space.**');

  /* greedy */
  S(55, 'Each entry is the maximum jump length from that position. Starting at index 0, decide whether you can reach the last index.',
    '- `[2,3,1,1,4]` → `true`\n- `[3,2,1,0,4]` → `false`',
    'Track the farthest reachable index; if the current index exceeds it, fail. Update with `i + nums[i]`. **O(n) time, O(1) space.**');
  S(45, 'Same jump setup, and the last index is reachable. Return the minimum number of jumps to reach it.',
    '- `[2,3,1,1,4]` → `2`',
    'BFS in disguise: keep the end of the current jump range and the farthest reach; on hitting the range end, increment jumps and extend the range. **O(n) time, O(1) space.**');
  S(134, 'Gas stations form a circle; station i gives `gas[i]` and the leg to the next costs `cost[i]`. Return the station index from which you can complete the loop clockwise with an empty tank, or -1 (the answer is unique when it exists).',
    '- `gas = [1,2,3,4,5]`, `cost = [3,4,5,1,2]` → `3`',
    'If total gas < total cost, return -1. Otherwise scan, and whenever the running tank goes negative, reset the start to the next station. **O(n) time, O(1) space.**');
  S(846, 'Split cards into groups of `groupSize` consecutive values. Decide whether that’s possible.',
    '- `[1,2,3,6,2,3,4,7,8]`, `3` → `true`\n- `[1,2,3,4,5]`, `4` → `false`',
    'If length isn’t divisible, fail. Count values; process the smallest remaining value `v` and consume `v … v+size−1`, each needing a positive count. **O(n log n) time** with a sorted map or heap.');
  S(1899, 'Given triplets and a target triplet, you can merge two triplets by taking element-wise maximums. Decide whether you can obtain the target through merges.',
    '- `[[2,5,3],[1,8,4],[1,7,5]]`, target `[2,7,5]` → `true`',
    'Ignore any triplet with a value exceeding the target in some position; among the rest, check each target coordinate is matched exactly by some triplet. **O(n) time, O(1) space.**');
  S(763, 'Partition a string into as many pieces as possible so that each letter appears in at most one piece. Return the piece sizes.',
    '- `"ababcbacadefegdehijhklij"` → `[9,7,8]`',
    'Record each letter’s last index. Sweep, extending the current piece’s end to the max last index seen; when the index reaches that end, close the piece. **O(n) time, O(1) space.**');
  S(678, 'A string of `(`, `)` and `*` is valid if parentheses balance and each `*` may act as `(`, `)` or empty. Decide validity.',
    '- `"()"` → `true`\n- `"(*)"` → `true`\n- `"(*))"` → `true`',
    'Track a range `[lo, hi]` of possible open counts: `(` increments both, `)` decrements both, `*` does `lo−1, hi+1`. Clamp `lo` at 0; fail if `hi < 0`. Valid if `lo == 0` at the end. **O(n) time, O(1) space.**');
})();
