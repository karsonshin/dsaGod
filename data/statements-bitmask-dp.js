/* Offer Ready: problem statements for the bitmask DP topic's practice problems.
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(698, 'You are given a list of positive integers and a number `k`. Decide whether every number can be placed into exactly one of `k` groups so that all `k` groups have the same total.',
    '- `[4, 3, 2, 3, 5, 2, 1]`, `k = 4` → `true` (groups `[5]`, `[1, 4]`, `[2, 3]`, `[2, 3]`)\n- `[1, 2, 3, 4]`, `k = 3` → `false`',
    'If the total is not divisible by `k`, stop. Otherwise the target per group is `total / k`. Let `dp[mask]` be the fill of the group currently being built after placing the numbers in `mask` (taken modulo the target), or `-1` if that set cannot be arranged. Adding a number is allowed when the fill stays within the target. **O(2^n · n) time, O(2^n) space.**');
  S(847, 'An undirected connected graph has `n` nodes labelled `0..n-1`, given as adjacency lists. You may start at any node, may finish anywhere, and may reuse nodes and edges. Return the length of the shortest walk that visits every node at least once.',
    '- `[[1,2,3],[0],[0],[0]]` → `4` (for instance 1 → 0 → 2 → 0 → 3)\n- `[[1],[0,2,4],[1,3,4],[2],[1,2]]` → `4`',
    'A position alone is not enough; you also need which nodes you have seen. Run a **multi-source BFS** over states `(node, mask)`, starting from every `(i, 1 << i)` at distance 0. The first state whose mask is full gives the answer. **O(2^n · n) states, each with its edges, O(2^n · n) space.**');
  S(526, 'Place the numbers `1..n` into positions `1..n`, each number once. A placement is *good* when, for every position `i`, the number there is divisible by `i` or `i` is divisible by that number. Count the good placements.',
    '- `n = 2` → `2` (`[1, 2]` and `[2, 1]`)\n- `n = 1` → `1`\n- `n = 3` → `3`',
    'Fill positions from 1 to `n`. The only thing that matters about what is already placed is *which numbers are used*, so `dp[mask]` counts the ways to fill the first `popcount(mask)` positions with exactly that set. Add a number `j` to position `p = popcount(mask) + 1` when it divides or is divided by `p`. **O(2^n · n) time.**');
  S(464, 'Two players take turns picking an integer from `1..m`, and a number may be picked only once in the whole game. A running total starts at 0 and each pick is added to it. The player whose pick makes the total reach at least `target` wins. Assuming both play perfectly and the first player moves first, return whether the first player can force a win.',
    '- `m = 10`, `target = 11` → `false` (whatever the first player picks, the second can finish)\n- `m = 10`, `target = 0` → `true`\n- `m = 10`, `target = 1` → `true`',
    'If `m` itself already reaches the target, the first player wins by picking it. If even the sum `1 + 2 + ... + m` cannot reach the target, nobody can win, so the answer is `false`. Otherwise the total is determined by the used set, so memoize **win or lose for the player to move** on the mask of used numbers: a state is winning if some pick wins immediately or leaves the opponent in a losing state. **O(2^m · m) time.**');
})();
