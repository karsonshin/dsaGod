/* Cheat sheet 5: DP pattern catalog. Problem numbers link into the bank. */
(function () {
  var OR = (window.OR = window.OR || {});
  OR.cheatsheets.push({
    n: 5, id: 'dp-catalog', title: 'DP pattern catalog',
    blurb: 'Each DP family on one row: the state, the transition, the fill order, how to shrink the space, and bank problems to practice on.',
    keywords: 'dynamic programming dp knapsack lis lcs edit distance interval bitmask tree grid state transition',
    render: function (h) {
      return h.T(
        ['Family', 'State', 'Transition', 'Fill order', 'Space trick', 'Practice'],
        [
          ['[[dp-1d|1-D linear]]', '`dp[i]` = best answer for the first `i` items (or ending at `i`)', '`dp[i] = f(dp[i-1], dp[i-2], …)`; “take or skip” item `i`', 'i ascending', 'Keep the last 1 or 2 values in variables: O(1)', '{{70}} {{198}} {{213}} {{91}} {{139}} {{279}}'],
          ['State machine (stocks)', '`dp[i][s]` for a small state `s`: holding, sold, resting', 'Each state moves to allowed states; take the best', 'i ascending; all states together', 'Keep one variable per state', '{{309}} {{122}}'],
          ['[[dp-2d|Grid]]', '`dp[r][c]` = best or count for reaching cell `(r, c)`', '`dp[r][c] = grid + min(up, left)`, or `up + left` for counting paths', 'Row by row, left to right', 'One row: `dp[c] += dp[c-1]`', '{{62}} {{63}} {{64}} {{221}} {{329}}'],
          ['[[knapsack|0/1 knapsack]]', '`dp[w]` = best using the items so far with capacity `w`', '`dp[w] = max(dp[w], dp[w - wt] + val)`', 'Items outer; capacity **descending** (each item used once)', '1-D array of size W+1', '{{416}} {{494}} {{474}} {{1049}}'],
          ['[[knapsack|Unbounded, coins]]', '`dp[a]` = fewest coins (or ways) for amount `a`', '`dp[a] = min(dp[a], dp[a - c] + 1)`', 'Capacity **ascending** (reuse allowed). Coins outer counts combinations; amount outer counts orderings', '1-D array already', '{{322}} {{518}} {{377}}'],
          ['[[string-dp|Two strings]]', '`dp[i][j]` = answer for prefixes `a[:i]`, `b[:j]`', 'Equal chars: `dp[i-1][j-1] + 1` (LCS) or carry diagonal; else `max` of up and left, or `1 + min(ins, del, rep)` (edit distance)', 'i then j ascending; row 0 and column 0 are the base cases', 'Two rows, or one row plus a saved diagonal', '{{1143}} {{72}} {{97}} {{115}} {{583}} {{10}} {{44}}'],
          ['[[string-dp|Palindromes]] (one string)', '`dp[i][j]` = `s[i..j]` is a palindrome (or its best length)', '`s[i] == s[j]` and `dp[i+1][j-1]`. Or expand around each center in O(n²) time, O(1) space', 'i descending, j ascending (or by length)', 'Center expansion needs none', '{{5}} {{647}} {{516}}'],
          ['[[lis|Longest increasing subsequence]]', '`dp[i]` = longest ending at `i`', '`dp[i] = 1 + max(dp[j])` over `j < i` with `a[j] < a[i]`: O(n²). Faster: `tails` array + `bisect_left`: O(n log n)', 'i ascending', '`tails` holds one value per length. Strict increase uses `bisect_left`, non-strict uses `bisect_right`', '{{300}} {{354}} {{673}} {{646}}'],
          ['[[interval-dp|Interval]]', '`dp[i][j]` = best for the subrange `i..j`', '`dp[i][j] = best over k in [i, j]` of `dp[i][k] + dp[k+1][j] + cost`; in “last one to pop” problems `k` is the last element removed', 'By increasing **length**, so shorter ranges exist first', 'Usually none: O(n²) states, O(n³) time', '{{312}} {{1547}} {{1039}} {{375}}'],
          ['[[tree-dp|Tree]]', 'A small tuple returned from each subtree, e.g. `(take, skip)`', 'Combine the children’s tuples into the parent’s', 'Post-order DFS', 'O(height) recursion stack, no table', '{{337}} {{124}} {{968}} {{1372}}'],
          ['[[bitmask-dp|Bitmask]]', '`dp[mask]` or `dp[mask][last]`: mask = set of used items (n ≤ 20)', '`dp[mask | 1<<j] = best(dp[mask] + cost(last, j))` for each `j` not in `mask`', 'mask ascending (supersets are bigger numbers)', 'Drop `last` when cost does not depend on it', '{{698}} {{847}} {{526}} {{464}}']
        ], { cls: 'cs-dptable', label: 'DP families' }) +
        '<div class="cs-cols">' +
        h.sec('The five-step routine', h.list([
          '**State:** what few numbers fully describe a subproblem? Name them in a sentence.',
          '**Transition:** how does a state follow from smaller ones? Check every option.',
          '**Base cases:** the smallest states you can answer by hand.',
          '**Order:** top-down memo (`lru_cache` or a map) or bottom-up so dependencies come first.',
          '**Answer and space:** which cell is the answer, and which old rows can you drop?'
        ])) +
        h.sec('Traps', h.list([
          'Knapsack loop direction: descending = each item once, ascending = unlimited. Swapping it silently changes the problem.',
          'Python recursion depth defaults to about 1000. Raise it with `sys.setrecursionlimit` or go bottom-up.',
          'Memoizing on mutable state (a list) fails; convert to a tuple or an index.',
          'Grids: fill row 0 and column 0 explicitly, or pad the table with a border.',
          'Greedy often beats DP when a sorted order proves the choice. Digit DP is not covered in this app.'
        ])) +
        '</div>';
    }
  });
})();
