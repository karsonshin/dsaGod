/* Offer Ready: problem statements for the topological sort additions (310, 802, 1136).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(310, 'A tree has `n` nodes labelled `0` to `n - 1`, given as undirected edges. Any node can be chosen as the root. Return every node that, used as the root, makes the tree as short as possible (height = edges on the longest downward path).',
    '- `4`, `[[1,0],[1,2],[1,3]]` → `[1]`\n- `6`, `[[3,0],[3,1],[3,2],[3,4],[5,4]]` → `[3,4]`',
    'The best roots are the centre of the tree. Peel off all leaves (degree 1) layer by layer, like Kahn’s algorithm, until at most two nodes remain. **O(n) time.**');
  S(802, 'A directed graph has nodes `0` to `n - 1`, with `graph[i]` listing the nodes `i` points to. A node is safe if every path starting there reaches a node with no outgoing edges. Return all safe nodes in increasing order.',
    '- `[[1,2],[2,3],[5],[0],[5],[],[]]` → `[2,4,5,6]`\n- `[[1],[0]]` → `[]`',
    'Reverse the edges and run Kahn’s algorithm on out-degrees: a node becomes safe when all its targets are safe. Nodes that never get there are on or lead into a cycle. **O(V + E) time.**');
  S(1136, 'There are `n` courses numbered `1` to `n`. A relation `[a, b]` means course `a` must be finished in an earlier semester than course `b`. You may take any number of courses per semester. Return the fewest semesters needed to finish everything, or `-1` if the relations contradict each other.',
    '- `3`, `[[1,3],[2,3]]` → `2`\n- `3`, `[[1,2],[2,3],[3,1]]` → `-1`',
    'Run Kahn’s algorithm one layer at a time. Each layer is one semester, and the layer count is the longest dependency chain. Fewer courses taken than `n` means a cycle. **O(V + E) time.**');
})();
