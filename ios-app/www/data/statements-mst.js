/* Offer Ready: problem statements for the minimum spanning tree topic.
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* mst (1584 is in statements-3.js) */
  S(1489, 'A connected, undirected, weighted graph has `n` nodes and edges identified by their position in the input list. Among all of its minimum spanning trees, return two lists of edge indices: the edges that appear in **every** minimum spanning tree, and the edges that appear in **some but not all** of them.',
    '- `n = 4`, a 4-cycle with every weight `1` → `[[], [0, 1, 2, 3]]`\n- `n = 2`, one edge of weight `5` → `[[0], []]`',
    'Compute the MST weight with Kruskal. For each edge, rebuild with it **banned**: if the total rises or the graph disconnects, it is critical. Otherwise rebuild with it **forced in first**: if the total equals the base weight, it is pseudo-critical. Sort edge indices once and reuse the order. **O(E² α(V)) for the small limits involved.**');
  S(1579, 'Alice and Bob walk a graph of `n` nodes (numbered from 1). Each undirected edge has a type: `1` can be used by Alice only, `2` by Bob only, `3` by both. Remove as many edges as possible so that **both** Alice and Bob can still reach every node from every node, and return how many you removed, or `-1` if that is impossible even with every edge kept.',
    '- `n = 4`, edges `[3,1,2] [3,2,3] [1,1,3] [1,2,4] [1,1,2] [2,3,4]` → `2`\n- `n = 4`, edges `[3,2,3] [1,1,2] [2,3,4]` → `-1`',
    'Use two union-finds, one per person. Process the shared edges first (they serve both people at once), counting each one that merges two groups as needed; then process Alice-only and Bob-only edges in their own union-find. If either person still has more than one group, return `-1`; otherwise the answer is `total edges - edges used`. **O(m α(n)).**');
  S(1631, 'A grid holds a height in every cell. Starting at the top-left cell you move one step at a time up, down, left or right to reach the bottom-right cell. The effort of a route is the **largest absolute height difference between two consecutive cells on it**. Return the smallest effort over all routes.',
    '- `[[1,2,2],[3,8,2],[5,3,5]]` → `2`\n- `[[7]]` → `0`',
    'A bottleneck path, which always lies on the minimum spanning tree. Treat each pair of neighbouring cells as an edge weighted by its height difference, sort the edges, and union them with union-find until the two corners share a group: that edge’s weight is the answer. (Dijkstra with `max` instead of `+` also works.) **O(RC log RC).**');
})();
