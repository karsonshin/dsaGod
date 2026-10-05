/* Offer Ready: problem statements for the graphs lesson's extra bank problems. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(785, 'An undirected graph is given as adjacency lists: `graph[i]` lists the nodes joined to node `i`. It may be disconnected. Decide whether the nodes can be split into two groups so that every edge joins one node from each group (none stays inside a group).',
    '- `[[1,3],[0,2],[1,3],[0,2]]` → `true` (a square: alternate the groups around it)\n- `[[1,2],[0,2],[0,1]]` → `false` (a triangle has an odd loop)\n- Edge cases: a node with no edges, and several separate pieces.',
    'Two-colour the graph. From every node you have not coloured yet, run BFS or DFS, giving each neighbour the opposite colour of the node you came from. If you meet a neighbour that already has **your own** colour, the graph has an odd loop and the answer is `false`. Start a search from every uncoloured node, since the graph may be in pieces. **O(V + E).**');
  S(1091, 'A square grid holds `0` (open) and `1` (blocked). You start at the top-left cell and want to reach the bottom-right cell, moving to any of the **eight** surrounding cells that is open. Return the number of cells on the shortest route (including both ends), or `-1` if there is none.',
    '- `[[0,1],[1,0]]` → `2` (one diagonal move)\n- `[[0,0,0],[1,1,0],[1,1,0]]` → `4`\n- `[[1,0],[0,0]]` → `-1` (the start itself is blocked)\n- Edge cases: a 1 by 1 grid that is open → `1`; a blocked start or end.',
    'Fewest moves on an unweighted grid is breadth-first search. Check the start and end are open first, then BFS with eight directions, marking a cell seen when you add it to the queue. Count by rings: the number of rings taken, plus one, is the cell count. **O(n²) for an n by n grid.**');
  S(463, 'A grid holds `1` (land) and `0` (water). The land forms a single island with no lakes inside. Return the length of the island’s outer edge, counting each unit side of a land cell that touches water or the grid’s border.',
    '- `[[1]]` → `4`\n- `[[1,1]]` → `6`\n- `[[0,1,0],[1,1,1],[0,1,0]]` → `12`\n- Edge cases: a single row or column; the island touching the border.',
    'No search is needed. Every land cell contributes 4 sides, and every pair of land cells that touch (checking only right and down so none is counted twice) hides 2 of them. So the answer is `4 * land - 2 * touching pairs`. Equivalently, count each side that faces water or the border. **O(rows × cols).**');
})();
