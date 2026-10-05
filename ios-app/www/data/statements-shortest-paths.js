/* Offer Ready: problem statements for the shortest-paths extras (original wording, not LeetCode's text).
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(1514, 'A network has `n` nodes and undirected links. Each link has a chance (between 0 and 1) that a message sent across it gets through, and a message survives a route only if it survives every link on it. Given a start node and an end node, return the highest probability that a message gets from start to end, or `0` if there is no route.',
    '- links `0-1` (0.5), `1-2` (0.5), `0-2` (0.2), start 0, end 2 → `0.25`\n- the same links with `0-2` at 0.3 → `0.3`\n- end node not connected → `0`',
    'It is Dijkstra with a **max-heap**: the route value is a product of numbers at most 1, so extending a route never improves it and the best unfinished node is final when popped. Relax with `p * q`. **O((V + E) log V).**');
  S(1334, 'There are `n` cities joined by two-way roads, each with a length. For each city, count the other cities you can reach by some route of total length at most `limit`. Return the city with the **fewest** such cities; if several tie, return the one with the **largest** number.',
    '- 4 cities, roads `0-1` (3), `1-2` (1), `1-3` (4), `2-3` (1), limit 4 → `3`\n- 3 cities, one road `0-1` (5), limit 4 → `2` (nobody reaches anyone; all counts are 0, so the largest index wins)',
    'Compute every pair’s shortest distance with **Floyd-Warshall** (the middle-stop loop outermost), then count, per city, the others within the limit. Use `<=` while scanning so ties go to the larger index. **O(n³) time, O(n²) space.**');
  S(2290, 'A grid has empty cells (0) and obstacles (1). You start in the top-left cell and want to reach the bottom-right cell, moving one step up, down, left or right. You may remove any obstacle you walk into. Return the smallest number of obstacles you must remove. The start and end cells are empty.',
    '- `[[0,1,1],[1,1,0],[1,1,0]]` → `2`\n- `[[0,0,0],[1,1,1],[0,0,0]]` → `1`\n- `[[0]]` → `0`',
    'Treat each cell as a node where entering costs its value (0 or 1). With only 0-and-1 costs, run **0-1 BFS**: a free move goes to the front of a deque, a paid move to the back. **O(R·C).**');
})();
