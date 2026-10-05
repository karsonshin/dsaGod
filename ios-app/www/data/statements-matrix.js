/* Offer Ready: problem statements for the matrix topic extras (289, 59, 867, 566, 498).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(289, 'A grid of cells is alive (1) or dead (0). Step it forward one generation at once: a live cell with two or three live neighbours (of its eight surrounding cells) stays alive, a dead cell with exactly three live neighbours comes alive, and every other cell is dead next generation. Every cell must be decided from the **old** grid, and you should update the grid in place.',
    '- `[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]` → `[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]`\n- `[[1,1],[1,0]]` → `[[1,1],[1,1]]`',
    'Write the **next** state into the second bit of each cell while the first bit still holds the old state. Count neighbours with `cell & 1`, set `cell |= 2` when the cell lives on, then shift every cell right by one. **O(m·n) time, O(1) extra space.**');
  S(59, 'Given n, build an n × n grid holding the numbers 1 to n² in clockwise spiral order: start at the top-left corner, go right, then down, then left, then up, then inward.',
    '- n = 3 → `[[1,2,3],[8,9,4],[7,6,5]]`\n- n = 1 → `[[1]]`',
    'Keep four boundaries (top, bottom, left, right) and a counter. Fill the top row, the right column, the bottom row and the left column, pulling each boundary in after its side is done, and guard the last two sides so a single leftover row or column is not filled twice. **O(n²) time.**');
  S(867, 'Return the transpose of a grid: the grid you get by swapping rows and columns, so the cell at row i, column j moves to row j, column i. The grid need not be square.',
    '- `[[1,2,3],[4,5,6]]` → `[[1,4],[2,5],[3,6]]`\n- `[[1,2],[3,4]]` → `[[1,3],[2,4]]`',
    'An m × n input gives an n × m output, so a square grid can be swapped in place but a rectangular one needs a new grid: `out[c][r] = grid[r][c]`. **O(m·n) time and space.**');
  S(566, 'Reshape a grid into r rows and c columns, reading the old cells row by row and refilling the new shape row by row. If the new shape cannot hold exactly the same number of cells, return the original grid unchanged.',
    '- `[[1,2],[3,4]]`, r = 1, c = 4 → `[[1,2,3,4]]`\n- `[[1,2],[3,4]]`, r = 2, c = 4 → unchanged (4 cells cannot fill 8)',
    'Check `rows * cols == r * c`. Then walk a flat index `k` from 0: the old cell is `grid[k // cols][k % cols]` and the new cell is `out[k // c][k % c]`. **O(m·n) time.**');
  S(498, 'Return every cell of a rectangular grid in diagonal order. Start at the top-left corner, sweep each anti-diagonal (the cells whose row plus column are equal), and alternate the direction of the sweep: up and to the right first, then down and to the left, and so on.',
    '- `[[1,2,3],[4,5,6],[7,8,9]]` → `[1,2,4,7,5,3,6,8,9]`\n- `[[1,2],[3,4]]` → `[1,2,3,4]`',
    'Every cell on one anti-diagonal shares the same `r + c`, so loop `s` from 0 to `rows + cols - 2`, collect the cells of that diagonal, and reverse the ones with even `s`. Watch the row range: `max(0, s - (cols - 1))` to `min(s, rows - 1)`. **O(m·n) time.**');
})();
