/* Offer Ready: problem statements for the advanced-graphs extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(1192, 'There are `n` servers numbered `0` to `n - 1`, joined by two-way cables, and every server can reach every other one. A cable is critical if removing just that cable leaves at least one pair of servers unable to reach each other. Return every critical cable, in any order.',
    '- `n = 4`, cables `[[0,1],[1,2],[2,0],[1,3]]` → `[[1,3]]`\n- `n = 2`, cables `[[0,1]]` → `[[0,1]]`',
    'A critical cable is a bridge. Run one DFS that stamps each node with a discovery time and a low-link (the earliest time reachable from its subtree using one back edge). The tree edge from `u` to child `v` is a bridge when `low[v] > disc[u]`. Skip the arrival edge by its id, and use an explicit stack for long chains. **O(V + E) time and space.**');
  S(2097, 'You get a list of pairs `[start, end]`. Arrange all of the pairs in a single line so that the end of each pair equals the start of the next, using every pair exactly once. Return any valid arrangement; one is guaranteed to exist.',
    '- `[[5,1],[4,5],[11,9],[9,4]]` → `[[11,9],[9,4],[4,5],[5,1]]`\n- `[[1,2],[1,3],[2,1]]` → `[[1,2],[2,1],[1,3]]`',
    'Make each number a node and each pair a directed edge: the arrangement is an Eulerian path. Start at the node with `out - in = 1`, or at any pair\'s start if all degrees balance. Run Hierholzer\'s stack (take an unused edge from the top; pop a node into the answer when it has none left), reverse, and read consecutive nodes as pairs. **O(P) time and space.**');
})();
