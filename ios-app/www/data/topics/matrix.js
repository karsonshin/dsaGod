/* Offer Ready: Matrix problems lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'matrix',

    hook: 'A grid is just an array of arrays, so these questions test whether you can keep indices straight under pressure. The ideas are small (swap across a diagonal, shrink four boundaries, borrow the first row as scratch space) but one off-by-one ruins the answer. Rotate Image, Spiral Matrix and Set Matrix Zeroes are all on the NeetCode 150 and the Blind 75, and they are the grid warm-ups interviewers reach for.',

    cues: [
      'The input is a **2D grid** and the question is about **rotating, reflecting, transposing or reshaping** it.',
      'You must visit every cell in an unusual **order**: a spiral, a zig-zag along diagonals, layer by layer from the outside in.',
      'The question says **in place** or O(1) extra space on a grid, so you can’t make a copy to read from.',
      'Cells must change **together** from the old state (a simulation step), so updating one cell must not disturb what its neighbours read.',
      'Cells that share a **diagonal** matter: that is `i - j` constant for one direction and `i + j` constant for the other.',
      'The trap: grid problems about **connected regions** (islands, flood fill, shortest path) are graph searches, not this lesson. This one is about index arithmetic and traversal order.'
    ],

    intuition: [
      'Picture a tiled floor. Every tile has an address, a row and a column, and nearly every matrix question is “which address do I read, which do I write, and in what order?”. Rotation is a question about where each tile ends up. A spiral is a question about the order you walk the tiles. Set Zeroes is a question about where you can leave yourself notes without a notepad.',
      'Four tools cover almost everything:',
      '1. **Index arithmetic.** In an `m × n` grid, rows run `0..m-1` and columns `0..n-1`. A flat position `k` is row `k // n`, column `k % n`. Cells with the same `i - j` lie on one top-left to bottom-right diagonal; the same `i + j` means one anti-diagonal.\n2. **Transpose and reflect.** Swapping `matrix[i][j]` with `matrix[j][i]` flips the grid over its main diagonal. Reversing each row mirrors it left to right. A rotation is a transpose followed by a reflection, so you never have to derive the four-way index formula under pressure.\n3. **Boundaries that shrink.** For a spiral, keep `top`, `bottom`, `left`, `right`. Walk one side, pull that boundary in, and move to the next side. Whatever is outside the boundaries is finished.\n4. **Markers.** If you must change cells based on what other cells held, store the answer in the same cell by encoding two states in it (a bit, a sentinel), or borrow the first row and column as flags.',
      'A direction array `[(0, 1), (1, 0), (0, -1), (-1, 0)]` (right, down, left, up) replaces a lot of copy-pasted loops: turn by moving to the next entry, and check bounds in one place.',
      'The skill is **proof by small cases**. Before you submit, run a 1 × 1, a 1 × n, an n × 1 and a 2 × 2 grid through your code by hand. Most matrix bugs live in those.'
    ].join('\n\n'),

    viz: 'matrix',

    template: {
      title: 'Spiral traversal with four shrinking boundaries',
      note: 'To reuse it, keep the four boundaries and change what you do at each cell: **read** it (traversal), **write** a counter into it (filling a spiral grid), or **swap** it (layer rotation). The two `if` guards are the part people forget: after the top row and right column, a single leftover row or column must not be walked a second time.',
      code: {
        py: `def spiral(matrix):
    if not matrix or not matrix[0]:
        return []
    res = []
    top, bottom = 0, len(matrix) - 1            #> Four boundaries: the rectangle still unvisited
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:      #> Stop when the rectangle is empty
        for c in range(left, right + 1):
            res.append(matrix[top][c])          #@top > 1. Top row, left to right
        top += 1                                #@shrink > That side is done: pull its boundary in
        for r in range(top, bottom + 1):
            res.append(matrix[r][right])        #@right > 2. Right column, going down
        right -= 1                              #@shrink
        if top <= bottom:                       #@guard > A single leftover row must not be walked back
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])   #@bottom > 3. Bottom row, right to left
            bottom -= 1                         #@shrink
        if left <= right:                       #@guard > Likewise for a single leftover column
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])     #@left > 4. Left column, going up
            left += 1                           #@shrink
    return res`,
        js: `function spiral(matrix) {
  if (!matrix.length || !matrix[0].length) return [];
  const res = [];
  let top = 0, bottom = matrix.length - 1;      //> Four boundaries: the rectangle still unvisited
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {      //> Stop when the rectangle is empty
    for (let c = left; c <= right; c++) {
      res.push(matrix[top][c]);                 //@top > 1. Top row, left to right
    }
    top++;                                      //@shrink > That side is done: pull its boundary in
    for (let r = top; r <= bottom; r++) {
      res.push(matrix[r][right]);               //@right > 2. Right column, going down
    }
    right--;                                    //@shrink
    if (top <= bottom) {                        //@guard > A single leftover row must not be walked back
      for (let c = right; c >= left; c--) {
        res.push(matrix[bottom][c]);            //@bottom > 3. Bottom row, right to left
      }
      bottom--;                                 //@shrink
    }
    if (left <= right) {                        //@guard > Likewise for a single leftover column
      for (let r = bottom; r >= top; r--) {
        res.push(matrix[r][left]);              //@left > 4. Left column, going up
      }
      left++;                                   //@shrink
    }
  }
  return res;
}`,
        java: `class Solution {
    public List<Integer> spiral(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        if (matrix.length == 0 || matrix[0].length == 0) return res;
        int top = 0, bottom = matrix.length - 1;         //> Four boundaries: the rectangle still unvisited
        int left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {         //> Stop when the rectangle is empty
            for (int c = left; c <= right; c++) {
                res.add(matrix[top][c]);                 //@top > 1. Top row, left to right
            }
            top++;                                       //@shrink > That side is done: pull its boundary in
            for (int r = top; r <= bottom; r++) {
                res.add(matrix[r][right]);               //@right > 2. Right column, going down
            }
            right--;                                     //@shrink
            if (top <= bottom) {                         //@guard > A single leftover row must not be walked back
                for (int c = right; c >= left; c--) {
                    res.add(matrix[bottom][c]);          //@bottom > 3. Bottom row, right to left
                }
                bottom--;                                //@shrink
            }
            if (left <= right) {                         //@guard > Likewise for a single leftover column
                for (int r = bottom; r >= top; r--) {
                    res.add(matrix[r][left]);            //@left > 4. Left column, going up
                }
                left++;                                  //@shrink
            }
        }
        return res;
    }
}`,
        cpp: `class Solution {
public:
    vector<int> spiral(vector<vector<int>>& matrix) {
        vector<int> res;
        if (matrix.empty() || matrix[0].empty()) return res;
        int top = 0, bottom = (int)matrix.size() - 1;    //> Four boundaries: the rectangle still unvisited
        int left = 0, right = (int)matrix[0].size() - 1;
        while (top <= bottom && left <= right) {         //> Stop when the rectangle is empty
            for (int c = left; c <= right; c++) {
                res.push_back(matrix[top][c]);           //@top > 1. Top row, left to right
            }
            top++;                                       //@shrink > That side is done: pull its boundary in
            for (int r = top; r <= bottom; r++) {
                res.push_back(matrix[r][right]);         //@right > 2. Right column, going down
            }
            right--;                                     //@shrink
            if (top <= bottom) {                         //@guard > A single leftover row must not be walked back
                for (int c = right; c >= left; c--) {
                    res.push_back(matrix[bottom][c]);    //@bottom > 3. Bottom row, right to left
                }
                bottom--;                                //@shrink
            }
            if (left <= right) {                         //@guard > Likewise for a single leftover column
                for (int r = bottom; r >= top; r--) {
                    res.push_back(matrix[r][left]);      //@left > 4. Left column, going up
                }
                left++;                                  //@shrink
            }
        }
        return res;
    }
};`
      },
      tests: { fn: 'spiral', sig: { args: ['int[][]'] }, cases: [
        { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [1, 2, 3, 6, 9, 8, 7, 4, 5] }, { args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], out: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
        { args: [[[1, 2, 3]]], out: [1, 2, 3] }, { args: [[[1], [2], [3]]], out: [1, 2, 3] }, { args: [[[7]]], out: [7] }, { args: [[[1, 2], [3, 4]]], out: [1, 2, 4, 3] },
        { args: [[[1, 2, 3], [4, 5, 6]]], out: [1, 2, 3, 6, 5, 4] }] }
    },

    complexity: {
      time: 'O(m·n)',
      space: 'O(1)',
      why: 'Every cell is visited a constant number of times: a traversal touches each cell once, a transpose-and-reverse touches each about twice, and a marker pass makes two sweeps. So time is proportional to the number of cells, m·n (O(n²) for a square grid). The extra space is a handful of integers, so O(1), not counting the output list of a traversal.',
      trap: 'For a square grid of side n, say “O(n²) time, because there are n² cells” and don’t call it quadratic in the *input size* without explaining; the input already has n² numbers. Don’t forget the output: a spiral traversal returns O(m·n) values, so the “O(1) space” claim means *auxiliary* space. If you copy the grid to read from (the easy rotation), say it is O(m·n) space and offer the in-place version as the follow-up.'
    },

    variations: [
      {
        name: 'Rotate 90 degrees: transpose, then reverse each row',
        body: 'For a clockwise quarter turn of a **square** grid, swap `matrix[i][j]` with `matrix[j][i]` for every cell above the diagonal (`j > i`), then reverse each row. The first row of the result is the old first column read bottom to top, which is exactly what the two steps produce. For counterclockwise, reverse each row first and then transpose, or transpose and then reverse the **order of the rows**. A half turn is just reversing each row and then reversing the order of the rows. Start the inner loop at `i + 1`: swapping *every* pair swaps each twice and gives you the grid back unchanged.',
        code: {
          py: `def rotate90(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]   #> Transpose: flip across the main diagonal
    for row in matrix:
        row.reverse()                                                  #> Then mirror each row`,
          js: `function rotate90(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];   //> Transpose: flip across the main diagonal
    }
  }
  for (const row of matrix) row.reverse();                           //> Then mirror each row
}`
        },
        tests: { fn: { py: 'rotate90', default: 'rotate90' }, inPlace: 0, cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] }, { args: [[[1, 2], [3, 4]]], out: [[3, 1], [4, 2]] }, { args: [[[5]]], out: [[5]] }] }
      },
      {
        name: 'Rotate layer by layer: a four-way swap',
        body: 'Think of the grid as nested square rings. For each ring, move four cells at once around a cycle: top goes to right, right to bottom, bottom to left, left to top. You do the cycle for every position along the ring except its last cell (that one is the next side’s first). It uses one temporary and does the same work as transpose-and-reverse. Interviewers sometimes ask for it because the index arithmetic (`last - offset`) is easy to botch, so know both.',
        code: {
          py: `def rotate_layers(m):
    n = len(m)
    for layer in range(n // 2):
        first, last = layer, n - 1 - layer
        for i in range(first, last):
            off = i - first
            top = m[first][i]
            m[first][i] = m[last - off][first]            #> left goes to top
            m[last - off][first] = m[last][last - off]    #> bottom goes to left
            m[last][last - off] = m[i][last]              #> right goes to bottom
            m[i][last] = top                              #> saved top goes to right`,
          js: `function rotateLayers(m) {
  const n = m.length;
  for (let layer = 0; layer < Math.floor(n / 2); layer++) {
    const first = layer, last = n - 1 - layer;
    for (let i = first; i < last; i++) {
      const off = i - first, top = m[first][i];
      m[first][i] = m[last - off][first];            //> left goes to top
      m[last - off][first] = m[last][last - off];    //> bottom goes to left
      m[last][last - off] = m[i][last];              //> right goes to bottom
      m[i][last] = top;                              //> saved top goes to right
    }
  }
}`
        },
        tests: { fn: { py: 'rotate_layers', default: 'rotateLayers' }, inPlace: 0, cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] }, { args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]], out: [[13, 9, 5, 1], [14, 10, 6, 2], [15, 11, 7, 3], [16, 12, 8, 4]] }, { args: [[[1]]], out: [[1]] }] }
      },
      {
        name: 'Direction arrays: the spiral without four loops',
        body: 'Instead of four boundaries, keep a position, a direction index, and a `seen` grid. Step forward; if the next cell is outside the grid or already seen, turn right (`d = (d + 1) % 4`) and step again. Fewer special cases, and it generalizes to other walks (snake patterns, flood order), at the cost of O(m·n) extra space for `seen`. The same `dirs` list is how you visit the four neighbours of a cell: `for dr, dc in dirs`.',
        code: {
          py: `def spiral_dirs(matrix):
    R, C = len(matrix), len(matrix[0])
    dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]       #> right, down, left, up
    seen = [[False] * C for _ in range(R)]
    r = c = d = 0
    res = []
    for _ in range(R * C):
        res.append(matrix[r][c])
        seen[r][c] = True
        nr, nc = r + dirs[d][0], c + dirs[d][1]
        if not (0 <= nr < R and 0 <= nc < C) or seen[nr][nc]:
            d = (d + 1) % 4                         #> Blocked: turn right
            nr, nc = r + dirs[d][0], c + dirs[d][1]
        r, c = nr, nc
    return res`,
          js: `function spiralDirs(matrix) {
  const R = matrix.length, C = matrix[0].length;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];   //> right, down, left, up
  const seen = Array.from({ length: R }, () => new Array(C).fill(false));
  let r = 0, c = 0, d = 0;
  const res = [];
  for (let k = 0; k < R * C; k++) {
    res.push(matrix[r][c]);
    seen[r][c] = true;
    let nr = r + dirs[d][0], nc = c + dirs[d][1];
    if (nr < 0 || nr >= R || nc < 0 || nc >= C || seen[nr][nc]) {
      d = (d + 1) % 4;                               //> Blocked: turn right
      nr = r + dirs[d][0]; nc = c + dirs[d][1];
    }
    r = nr; c = nc;
  }
  return res;
}`
        },
        tests: { fn: { py: 'spiral_dirs', default: 'spiralDirs' }, cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [1, 2, 3, 6, 9, 8, 7, 4, 5] }, { args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], out: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
          { args: [[[1, 2, 3]]], out: [1, 2, 3] }, { args: [[[1], [2], [3]]], out: [1, 2, 3] }] }
      },
      {
        name: 'Diagonals: group cells by i - j or i + j',
        body: 'Two cells are on the same **anti-diagonal** (top-right to bottom-left) when `i + j` is equal, and on the same **main-direction diagonal** when `i - j` is equal. That turns “walk the diagonals” into “bucket by a key”. The code below lists the anti-diagonals in order; reverse every other bucket and you have the zig-zag order. Checking that every top-left to bottom-right diagonal holds one repeated value is just “is `matrix[i][j] == matrix[i-1][j-1]` for all cells?”, with no buckets needed. On a square grid, the main diagonal is `i == j` and the anti-diagonal is `i + j == n - 1`; when n is odd the two cross in the middle cell, so a sum of both diagonals must not count it twice.',
        code: {
          py: `def anti_diagonals(m):
    out = [[] for _ in range(len(m) + len(m[0]) - 1)]   #> One bucket per value of i + j
    for i in range(len(m)):
        for j in range(len(m[0])):
            out[i + j].append(m[i][j])
    return out`,
          js: `function antiDiagonals(m) {
  const out = Array.from({ length: m.length + m[0].length - 1 }, () => []);   //> One bucket per value of i + j
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < m[0].length; j++) out[i + j].push(m[i][j]);
  }
  return out;
}`
        },
        tests: { fn: { py: 'anti_diagonals', default: 'antiDiagonals' }, cases: [
          { args: [[[1, 2, 3], [4, 5, 6]]], out: [[1], [2, 4], [3, 5], [6]] }, { args: [[[1, 2], [3, 4]]], out: [[1], [2, 3], [4]] }, { args: [[[9]]], out: [[9]] }] }
      },
      {
        name: 'Updating in place: encode two states in one cell',
        body: 'When every cell must change based on the *old* values of its neighbours (Game of Life), writing the new value immediately corrupts the reads that follow. Instead keep the old state in bit 0 and write the new state into bit 1. While reading neighbours, use `cell & 1`. At the end, shift every cell right by one. The same idea works with sentinel values (for example, `2` for “was alive, now dead”). Set Matrix Zeroes uses the same spirit: the first row and column double as flags for “this column or row must be zeroed”, and two booleans remember whether the first row and column themselves held a zero.'
      },
      {
        name: 'Sorted grids: staircase search from a corner',
        body: 'If every row and every column is sorted, start at the top-right corner: if the cell is too big, move left; if too small, move down. Each step discards a row or a column, so a search is O(m + n) with no extra space. If the whole grid reads as one sorted list (each row starts after the previous row ends), a [binary search](#/topic/binary-search) over the flat index `k → (k // n, k % n)` is O(log(m·n)).'
      }
    ],

    worked: [
      {
        lc: 48,
        restate: 'You get a square grid of numbers. Turn it a quarter turn clockwise, **in place**: the same grid must hold the rotated values afterwards, and you may not allocate a second grid.',
        examples: '- `[[1,2,3],[4,5,6],[7,8,9]]` → `[[7,4,1],[8,5,2],[9,6,3]]`.\n- `[[1,2],[3,4]]` → `[[3,1],[4,2]]`.\n- A 1 × 1 grid stays as it is.\n- Edge cases: n = 1 and n = 2; negative or repeated values don’t matter, since only positions move.',
        brute: 'Build a second grid where `new[j][n-1-i] = old[i][j]`, then copy it back. O(n²) time and O(n²) space, which the question rules out.',
        insight: 'A rotation is a transpose plus a reflection. Swap each cell with its mirror across the main diagonal, which turns rows into columns, and then reverse every row. Check by example: the first column `1, 4, 7` should become the first row read backwards, `7, 4, 1`: transposing puts it in the first row as `1, 4, 7`, and reversing finishes it. Start the inner loop at `i + 1` so every pair is swapped once.',
        code: {
          py: `class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]   # transpose
        for row in matrix:
            row.reverse()                                                  # mirror each row`,
          js: `function rotate(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];   // transpose
    }
  }
  for (const row of matrix) row.reverse();                           // mirror each row
}`,
          java: `class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int t = matrix[i][j];                 // transpose
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = t;
            }
        }
        for (int[] row : matrix) {
            for (int a = 0, b = n - 1; a < b; a++, b--) {   // mirror each row
                int t = row[a];
                row[a] = row[b];
                row[b] = t;
            }
        }
    }
}`,
          cpp: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                swap(matrix[i][j], matrix[j][i]);     // transpose
            }
        }
        for (auto& row : matrix) reverse(row.begin(), row.end());   // mirror each row
    }
};`
        },
        complexity: 'O(n²) time: each cell is touched a constant number of times (once in the transpose, once in the reverse). O(1) extra space.',
        say: '“A quarter turn clockwise is a transpose followed by reversing each row. I’ll swap across the main diagonal, starting the inner index at i + 1 so each pair swaps once, then reverse every row. That is O(n²) time and O(1) space. If you want the layer-by-layer four-way swap I can write that too, but it does the same work with trickier indices.”',
        followups: [
          { q: 'How would you rotate counterclockwise?', a: 'Transpose and then reverse the **order of the rows** (swap row `i` with row `n-1-i`), or reverse each row first and then transpose. Check with the 2 × 2 example: `[[1,2],[3,4]]` should give `[[2,4],[1,3]]`.' },
          { q: 'What if the grid isn’t square?', a: 'You can’t do it in place with the same shape, because an m × n grid becomes n × m. Allocate the new grid: `out[j][m-1-i] = grid[i][j]`, O(m·n) space.' },
          { q: 'Why does swapping every pair (not just j > i) fail?', a: 'Each pair is swapped twice, once from each side, so the second swap undoes the first and the grid comes back unchanged. Limiting to `j > i` visits each pair once.' }
        ]
      },
      {
        lc: 54,
        restate: 'You get a grid with m rows and n columns of numbers. Return all of its cells in spiral order: start at the top-left, go right across the top row, down the right column, left along the bottom row, up the left column, and then keep spiralling inward until every cell has been listed once.',
        examples: '- `[[1,2,3],[4,5,6],[7,8,9]]` → `[1,2,3,6,9,8,7,4,5]`.\n- `[[1,2,3,4],[5,6,7,8],[9,10,11,12]]` → `[1,2,3,4,8,12,11,10,9,5,6,7]`.\n- `[[1,2,3]]` (one row) → `[1,2,3]`; `[[1],[2],[3]]` (one column) → `[1,2,3]`.\n- Edge cases: a single row or column, and an odd side where the spiral ends on one middle cell.',
        brute: 'Mark cells as seen and walk with a direction that turns whenever the next step is blocked. That is also O(m·n) time, with O(m·n) extra space for the seen grid. It is a perfectly good answer; the boundary version just avoids the extra grid.',
        insight: 'Keep the unvisited rectangle as four boundaries. Walk its top row, then pull `top` down by one; walk the right column and pull `right` in; and so on. After each side, the rectangle gets thinner. The catch: after the first two sides the rectangle may be empty or a single line, so guard the bottom row with `top <= bottom` and the left column with `left <= right`. Without those guards a one-row grid lists its row twice.',
        code: {
          py: `class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        res = []
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for c in range(left, right + 1):
                res.append(matrix[top][c])
            top += 1
            for r in range(top, bottom + 1):
                res.append(matrix[r][right])
            right -= 1
            if top <= bottom:                      # one row left? don't walk it back
                for c in range(right, left - 1, -1):
                    res.append(matrix[bottom][c])
                bottom -= 1
            if left <= right:                      # one column left? don't walk it back
                for r in range(bottom, top - 1, -1):
                    res.append(matrix[r][left])
                left += 1
        return res`,
          js: `function spiralOrder(matrix) {
  const res = [];
  let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) res.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) res.push(matrix[r][right]);
    right--;
    if (top <= bottom) {                           // one row left? don't walk it back
      for (let c = right; c >= left; c--) res.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {                           // one column left? don't walk it back
      for (let r = bottom; r >= top; r--) res.push(matrix[r][left]);
      left++;
    }
  }
  return res;
}`,
          java: `class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.add(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.add(matrix[r][right]);
            right--;
            if (top <= bottom) {                   // one row left? don't walk it back
                for (int c = right; c >= left; c--) res.add(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {                   // one column left? don't walk it back
                for (int r = bottom; r >= top; r--) res.add(matrix[r][left]);
                left++;
            }
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> res;
        int top = 0, bottom = (int)matrix.size() - 1, left = 0, right = (int)matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.push_back(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.push_back(matrix[r][right]);
            right--;
            if (top <= bottom) {                   // one row left? don't walk it back
                for (int c = right; c >= left; c--) res.push_back(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {                   // one column left? don't walk it back
                for (int r = bottom; r >= top; r--) res.push_back(matrix[r][left]);
                left++;
            }
        }
        return res;
    }
};`
        },
        complexity: 'O(m·n) time: every cell is appended once. O(1) auxiliary space (the output list holds the m·n values).',
        say: '“I’ll keep four boundaries for the rectangle I haven’t visited. Walk the top row and move top down, walk the right column and move right in, then the bottom row and the left column, each guarded so a leftover single row or column isn’t walked twice. Every cell is taken once, so it’s O(m·n) time and O(1) extra space besides the output. I’d test a single row and a single column first, since those break the guards.”',
        followups: [
          { q: 'Why are the two `if` guards needed?', a: 'After walking the top row and right column, the rectangle can be empty vertically (`top > bottom`) or horizontally (`left > right`). Without a guard, a one-row grid walks its row left to right and then again right to left; a one-column grid repeats in the same way.' },
          { q: 'How would you generate an n × n spiral instead of reading one?', a: 'Same boundaries, but write an increasing counter into each cell instead of reading it. That is Spiral Matrix II (59).' },
          { q: 'Can you avoid the boundary bookkeeping?', a: 'Yes: a direction array and a seen grid, turning right whenever the next cell is out of range or seen. It uses O(m·n) extra space but has no side-specific code.' }
        ]
      },
      {
        lc: 73,
        restate: 'You get a grid of integers. Wherever a cell holds a zero, every cell in its entire row and its entire column must become zero. Do it in place. A zero that you *create* while doing this must not cause more rows and columns to be zeroed.',
        examples: '- `[[1,1,1],[1,0,1],[1,1,1]]` → `[[1,0,1],[0,0,0],[1,0,1]]`.\n- `[[0,1,2,0],[3,4,5,2],[1,3,1,5]]` → `[[0,0,0,0],[0,4,5,0],[0,3,1,0]]`.\n- Edge cases: a zero in the first row or first column; a grid with only one row or one column; no zeroes at all.',
        brute: 'Copy the grid, scan the copy for zeroes, and zero rows and columns in the original: O(m·n) time and O(m·n) space. Recording just the *set of rows* and *set of columns* that need zeroing brings it to O(m + n) space, which is a good first answer.',
        insight: 'The grid’s own first row and first column can be your two lists of flags. Mark `matrix[r][0] = 0` when row r has a zero and `matrix[0][c] = 0` when column c has one. The wrinkle is that the first row and column hold flags **and** may hold zeroes of their own, so record those two facts in two booleans before you start overwriting. Then: scan the inner cells and set flags; zero each inner cell whose row flag or column flag is zero; finally zero the first row and first column if their booleans say so. The order matters: zero the first row and column **last**, or you destroy the flags.',
        code: {
          py: `class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> None:
        rows, cols = len(matrix), len(matrix[0])
        first_row = any(matrix[0][c] == 0 for c in range(cols))
        first_col = any(matrix[r][0] == 0 for r in range(rows))
        for r in range(1, rows):
            for c in range(1, cols):
                if matrix[r][c] == 0:
                    matrix[r][0] = 0          # flag the row
                    matrix[0][c] = 0          # flag the column
        for r in range(1, rows):
            for c in range(1, cols):
                if matrix[r][0] == 0 or matrix[0][c] == 0:
                    matrix[r][c] = 0
        if first_row:
            for c in range(cols):
                matrix[0][c] = 0
        if first_col:
            for r in range(rows):
                matrix[r][0] = 0`,
          js: `function setZeroes(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  const firstRow = matrix[0].some((x) => x === 0);
  const firstCol = matrix.some((row) => row[0] === 0);
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;          // flag the row
        matrix[0][c] = 0;          // flag the column
      }
    }
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
    }
  }
  if (firstRow) for (let c = 0; c < cols; c++) matrix[0][c] = 0;
  if (firstCol) for (let r = 0; r < rows; r++) matrix[r][0] = 0;
}`,
          java: `class Solution {
    public void setZeroes(int[][] matrix) {
        int rows = matrix.length, cols = matrix[0].length;
        boolean firstRow = false, firstCol = false;
        for (int c = 0; c < cols; c++) if (matrix[0][c] == 0) firstRow = true;
        for (int r = 0; r < rows; r++) if (matrix[r][0] == 0) firstCol = true;
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0;          // flag the row
                    matrix[0][c] = 0;          // flag the column
                }
            }
        }
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;
            }
        }
        if (firstRow) for (int c = 0; c < cols; c++) matrix[0][c] = 0;
        if (firstCol) for (int r = 0; r < rows; r++) matrix[r][0] = 0;
    }
}`,
          cpp: `class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int rows = matrix.size(), cols = matrix[0].size();
        bool firstRow = false, firstCol = false;
        for (int c = 0; c < cols; c++) if (matrix[0][c] == 0) firstRow = true;
        for (int r = 0; r < rows; r++) if (matrix[r][0] == 0) firstCol = true;
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0;          // flag the row
                    matrix[0][c] = 0;          // flag the column
                }
            }
        }
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;
            }
        }
        if (firstRow) for (int c = 0; c < cols; c++) matrix[0][c] = 0;
        if (firstCol) for (int r = 0; r < rows; r++) matrix[r][0] = 0;
    }
};`
        },
        complexity: 'O(m·n) time: a constant number of sweeps over the grid. O(1) extra space: two booleans, with the first row and column serving as the row and column flags.',
        say: '“The easy version stores which rows and columns have a zero, O(m + n) extra space. To get O(1) I reuse the first row and first column as those flags, after saving in two booleans whether they themselves contained a zero. I set flags from the inner cells, zero inner cells by their flags, and only then zero the first row and column. Zeroing them earlier would wipe the flags.”',
        followups: [
          { q: 'Why must the first row and column be handled last?', a: 'They hold the flags. If you zeroed the first row first, every column flag would read “zero” and the whole grid would be wiped.' },
          { q: 'What sentinel trick would avoid the two booleans?', a: 'If the values have a range you can step outside of (say, a marker no cell can hold), you can mark cells that *will* become zero without making them zero yet, then convert all markers at the end. That is an assumption about the data, so say it out loud.' },
          { q: 'What is the O(m + n) version?', a: 'Two boolean arrays: `zero_row[r]` and `zero_col[c]`. One pass sets them, a second pass zeroes any cell whose row or column is flagged. Easier to get right; offer it first if short on time.' }
        ]
      },
      {
        lc: 289,
        restate: 'You get a grid where each cell is alive (1) or dead (0). Compute the next generation. A live cell with two or three live neighbours (of its up to eight surrounding cells) survives. A dead cell with exactly three live neighbours comes to life. Every other cell is dead in the next generation. All cells change at the same moment, based on the old grid. Update the grid in place.',
        examples: '- `[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]` → `[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]`.\n- `[[1,1],[1,0]]` → `[[1,1],[1,1]]`.\n- A lone live cell dies (no neighbours): `[[1]]` → `[[0]]`.\n- Edge cases: cells on the edges and corners have fewer neighbours; one-row grids.',
        brute: 'Copy the grid, read neighbours from the copy, write results into the original: O(m·n) time and O(m·n) space. Correct, simple, and a fine first answer.',
        insight: 'The trouble with updating in place is that a cell’s new value would be read by its neighbours as if it were old. Give every cell **two bits**: bit 0 holds the old state and stays untouched while we scan, bit 1 receives the new state. Count neighbours with `cell & 1`, which ignores bit 1. When the whole grid has been decided, shift every cell right by one so bit 1 becomes the state. Bounds checks keep the eight-neighbour loop safe at the edges.',
        code: {
          py: `class Solution:
    def gameOfLife(self, board: List[List[int]]) -> None:
        R, C = len(board), len(board[0])
        for r in range(R):
            for c in range(C):
                live = 0
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        nr, nc = r + dr, c + dc
                        if (dr or dc) and 0 <= nr < R and 0 <= nc < C:
                            live += board[nr][nc] & 1      # old state only
                if live == 3 or (board[r][c] & 1 and live == 2):
                    board[r][c] |= 2                       # new state goes in bit 1
        for r in range(R):
            for c in range(C):
                board[r][c] >>= 1`,
          js: `function gameOfLife(board) {
  const R = board.length, C = board[0].length;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      let live = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if ((dr || dc) && nr >= 0 && nr < R && nc >= 0 && nc < C) live += board[nr][nc] & 1;   // old state only
        }
      }
      if (live === 3 || ((board[r][c] & 1) && live === 2)) board[r][c] |= 2;   // new state goes in bit 1
    }
  }
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) board[r][c] >>= 1;
}`,
          java: `class Solution {
    public void gameOfLife(int[][] board) {
        int R = board.length, C = board[0].length;
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                int live = 0;
                for (int dr = -1; dr <= 1; dr++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        int nr = r + dr, nc = c + dc;
                        if ((dr != 0 || dc != 0) && nr >= 0 && nr < R && nc >= 0 && nc < C) live += board[nr][nc] & 1;   // old state only
                    }
                }
                if (live == 3 || ((board[r][c] & 1) == 1 && live == 2)) board[r][c] |= 2;   // new state goes in bit 1
            }
        }
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) board[r][c] >>= 1;
    }
}`,
          cpp: `class Solution {
public:
    void gameOfLife(vector<vector<int>>& board) {
        int R = board.size(), C = board[0].size();
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                int live = 0;
                for (int dr = -1; dr <= 1; dr++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        int nr = r + dr, nc = c + dc;
                        if ((dr != 0 || dc != 0) && nr >= 0 && nr < R && nc >= 0 && nc < C) live += board[nr][nc] & 1;   // old state only
                    }
                }
                if (live == 3 || ((board[r][c] & 1) && live == 2)) board[r][c] |= 2;   // new state goes in bit 1
            }
        }
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) board[r][c] >>= 1;
    }
};`
        },
        complexity: 'O(m·n) time: 8 neighbour reads per cell plus one shift pass. O(1) extra space, since the new state rides along in bit 1 of each cell.',
        say: '“I can’t write new values straight into the grid because neighbours would read them as old. So I treat each cell as two bits: bit 0 is the old state, bit 1 the new one. I count neighbours with `& 1`, set bit 1 for cells that live on, and finally shift everything right once. That’s O(m·n) time and O(1) space. If memory weren’t a concern I’d copy the grid, which is simpler to get right.”',
        followups: [
          { q: 'What if the board were infinite?', a: 'A grid can’t represent it. Keep only the **live cells** in a set, count neighbours with a hash map from cell to count, and apply the rules to cells that have at least one live neighbour or are themselves alive. Cost scales with the live population, not the area.' },
          { q: 'Why `& 1` when counting?', a: 'A neighbour you already processed may hold `2` or `3` now: bit 1 is its new state. Masking with 1 reads only the old state, which is what the rules need.' },
          { q: 'Could a sentinel value replace the bits?', a: 'Yes: store `2` for “was alive, will be dead” and `3` for “was dead, will be alive”, and count a neighbour as alive when its value is `1` or `2`. Same idea, different encoding.' }
        ]
      }
    ],

    practice: [
      { lc: 48,
        hints: ['A quarter turn clockwise sends the first column, read bottom to top, to the first row.', 'You can build it from two simple moves: flip the grid over its main diagonal, then mirror each row.', 'Swap `matrix[i][j]` with `matrix[j][i]` only for `j > i`, so each pair swaps once. Then reverse every row.'],
        starter: { py: 'class Solution:\n    def rotate(self, matrix: List[List[int]]) -> None:\n        ', js: 'function rotate(matrix) {\n  \n}' },
        tests: { fn: 'rotate', inPlace: 0, sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] }, { args: [[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], out: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]] },
          { args: [[[1]]], out: [[1]] }, { args: [[[1, 2], [3, 4]]], out: [[3, 1], [4, 2]] }] } },

      { lc: 54,
        hints: ['Think of the cells you haven’t visited as a rectangle bounded by top, bottom, left and right.', 'Walk the top row, then pull `top` in; walk the right column, then pull `right` in; and so on around.', 'After the first two sides, the rectangle may have collapsed to a line. Guard the bottom row with `top <= bottom` and the left column with `left <= right`.'],
        starter: { py: 'class Solution:\n    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:\n        ', js: 'function spiralOrder(matrix) {\n  \n}' },
        tests: { fn: 'spiralOrder', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [1, 2, 3, 6, 9, 8, 7, 4, 5] }, { args: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], out: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
          { args: [[[1, 2, 3]]], out: [1, 2, 3] }, { args: [[[1], [2], [3]]], out: [1, 2, 3] }, { args: [[[1, 2], [3, 4]]], out: [1, 2, 4, 3] }, { args: [[[1, 2, 3], [4, 5, 6]]], out: [1, 2, 3, 6, 5, 4] }] } },

      { lc: 73,
        hints: ['Storing which rows and which columns contain a zero is easy but costs O(m + n) extra space. Where else could those flags live?', 'Use the first row and first column as the flags, and remember in two booleans whether they held a zero themselves.', 'Set the flags from the inner cells, zero inner cells by their flags, and zero the first row and column last, or you erase the flags.'],
        starter: { py: 'class Solution:\n    def setZeroes(self, matrix: List[List[int]]) -> None:\n        ', js: 'function setZeroes(matrix) {\n  \n}' },
        tests: { fn: 'setZeroes', inPlace: 0, sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], out: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] }, { args: [[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]], out: [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]] },
          { args: [[[1]]], out: [[1]] }, { args: [[[0]]], out: [[0]] }, { args: [[[1, 0]]], out: [[0, 0]] }, { args: [[[1], [0]]], out: [[0], [0]] },
          { args: [[[1, 2], [3, 4]]], out: [[1, 2], [3, 4]] }, { args: [[[0, 1], [1, 1]]], out: [[0, 0], [0, 1]] }] } },

      { lc: 289,
        hints: ['Updating a cell right away would make its neighbours read a new value as if it were old.', 'Give each cell two bits: bit 0 is the old state, bit 1 will hold the new state.', 'Count neighbours with `cell & 1`, set `cell |= 2` when it should be alive next, and shift every cell right by one at the end.'],
        starter: { py: 'class Solution:\n    def gameOfLife(self, board: List[List[int]]) -> None:\n        ', js: 'function gameOfLife(board) {\n  \n}' },
        tests: { fn: 'gameOfLife', inPlace: 0, sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 1, 0], [0, 0, 1], [1, 1, 1], [0, 0, 0]]], out: [[0, 0, 0], [1, 0, 1], [0, 1, 1], [0, 1, 0]] }, { args: [[[1, 1], [1, 0]]], out: [[1, 1], [1, 1]] },
          { args: [[[1]]], out: [[0]] }, { args: [[[0]]], out: [[0]] }, { args: [[[0, 1, 0], [0, 1, 0], [0, 1, 0]]], out: [[0, 0, 0], [1, 1, 1], [0, 0, 0]] }, { args: [[[1, 1, 1, 1]]], out: [[0, 1, 1, 0]] }] } },

      { lc: 59,
        hints: ['It is the spiral walk again, but you write numbers instead of reading them.', 'Keep four boundaries and a counter that starts at 1. Fill the top row, then the right column, then the bottom row, then the left column.', 'Pull each boundary in after its side is filled, and guard the bottom row and left column the way a spiral read does.'],
        solution: { explain: 'The same four-boundary walk as a spiral read, writing an increasing counter. O(n²) time, O(1) extra space besides the grid.', code: {
          py: `class Solution:
    def generateMatrix(self, n: int) -> List[List[int]]:
        m = [[0] * n for _ in range(n)]
        top, bottom, left, right = 0, n - 1, 0, n - 1
        k = 1
        while top <= bottom and left <= right:
            for c in range(left, right + 1):
                m[top][c] = k
                k += 1
            top += 1
            for r in range(top, bottom + 1):
                m[r][right] = k
                k += 1
            right -= 1
            if top <= bottom:
                for c in range(right, left - 1, -1):
                    m[bottom][c] = k
                    k += 1
                bottom -= 1
            if left <= right:
                for r in range(bottom, top - 1, -1):
                    m[r][left] = k
                    k += 1
                left += 1
        return m`,
          js: `function generateMatrix(n) {
  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  let top = 0, bottom = n - 1, left = 0, right = n - 1, k = 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) m[top][c] = k++;
    top++;
    for (let r = top; r <= bottom; r++) m[r][right] = k++;
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) m[bottom][c] = k++;
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) m[r][left] = k++;
      left++;
    }
  }
  return m;
}` } },
        starter: { py: 'class Solution:\n    def generateMatrix(self, n: int) -> List[List[int]]:\n        ', js: 'function generateMatrix(n) {\n  \n}' },
        tests: { fn: 'generateMatrix', cases: [
          { args: [3], out: [[1, 2, 3], [8, 9, 4], [7, 6, 5]] }, { args: [1], out: [[1]] }, { args: [2], out: [[1, 2], [4, 3]] }, { args: [4], out: [[1, 2, 3, 4], [12, 13, 14, 5], [11, 16, 15, 6], [10, 9, 8, 7]] }] } },

      { lc: 867,
        hints: ['Swapping rows and columns turns an m × n grid into an n × m grid.', 'So you can’t do it in place unless the grid is square. Allocate the result with the swapped shape.', 'The cell at row r, column c goes to row c, column r.'],
        solution: { explain: 'Build the new n × m grid with `out[c][r] = grid[r][c]`. O(m·n) time and space; in place only works for square grids.', code: {
          py: `class Solution:
    def transpose(self, matrix: List[List[int]]) -> List[List[int]]:
        R, C = len(matrix), len(matrix[0])
        return [[matrix[r][c] for r in range(R)] for c in range(C)]`,
          js: `function transpose(matrix) {
  const R = matrix.length, C = matrix[0].length;
  const out = Array.from({ length: C }, () => new Array(R));
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) out[c][r] = matrix[r][c];
  return out;
}` } },
        starter: { py: 'class Solution:\n    def transpose(self, matrix: List[List[int]]) -> List[List[int]]:\n        ', js: 'function transpose(matrix) {\n  \n}' },
        tests: { fn: 'transpose', cases: [
          { args: [[[1, 2, 3], [4, 5, 6]]], out: [[1, 4], [2, 5], [3, 6]] }, { args: [[[1, 2], [3, 4]]], out: [[1, 3], [2, 4]] }, { args: [[[7]]], out: [[7]] }, { args: [[[1], [2], [3]]], out: [[1, 2, 3]] }] } },

      { lc: 566,
        hints: ['If the old and new shapes hold a different number of cells, there is nothing to do.', 'Think of the cells as one flat list read row by row. Position `k` in that list has a row and a column in each shape.', 'In a grid with `w` columns, `k` is at row `k // w` and column `k % w`. Read with the old width, write with the new one.'],
        solution: { explain: 'Check that the cell counts match, then copy through a flat index `k`: read `old[k // C][k % C]`, write `new[k // c][k % c]`. O(m·n) time and space.', code: {
          py: `class Solution:
    def matrixReshape(self, mat: List[List[int]], r: int, c: int) -> List[List[int]]:
        R, C = len(mat), len(mat[0])
        if R * C != r * c:
            return mat
        out = [[0] * c for _ in range(r)]
        for k in range(R * C):
            out[k // c][k % c] = mat[k // C][k % C]
        return out`,
          js: `function matrixReshape(mat, r, c) {
  const R = mat.length, C = mat[0].length;
  if (R * C !== r * c) return mat;
  const out = Array.from({ length: r }, () => new Array(c).fill(0));
  for (let k = 0; k < R * C; k++) out[Math.floor(k / c)][k % c] = mat[Math.floor(k / C)][k % C];
  return out;
}` } },
        starter: { py: 'class Solution:\n    def matrixReshape(self, mat: List[List[int]], r: int, c: int) -> List[List[int]]:\n        ', js: 'function matrixReshape(mat, r, c) {\n  \n}' },
        tests: { fn: 'matrixReshape', cases: [
          { args: [[[1, 2], [3, 4]], 1, 4], out: [[1, 2, 3, 4]] }, { args: [[[1, 2], [3, 4]], 2, 4], out: [[1, 2], [3, 4]] }, { args: [[[1, 2, 3, 4]], 2, 2], out: [[1, 2], [3, 4]] }, { args: [[[1, 2], [3, 4]], 4, 1], out: [[1], [2], [3], [4]] }] } },

      { lc: 498,
        hints: ['Cells on one diagonal that runs from bottom-left up to top-right all share the same `row + column`.', 'Loop over that sum `s` from 0 to `rows + cols - 2`, and collect the cells of each diagonal.', 'Go through each diagonal with the row increasing, and reverse it when `s` is even. The row range is `max(0, s - (cols - 1))` to `min(s, rows - 1)`.'],
        solution: { explain: 'Each anti-diagonal is the set of cells with `r + c = s`. Walk the rows in its valid range and read column `s - r`, reversing the even-numbered diagonals. O(m·n) time.', code: {
          py: `class Solution:
    def findDiagonalOrder(self, mat: List[List[int]]) -> List[int]:
        R, C = len(mat), len(mat[0])
        res = []
        for s in range(R + C - 1):
            rows = list(range(max(0, s - (C - 1)), min(s, R - 1) + 1))
            if s % 2 == 0:
                rows.reverse()
            for r in rows:
                res.append(mat[r][s - r])
        return res`,
          js: `function findDiagonalOrder(mat) {
  const R = mat.length, C = mat[0].length, res = [];
  for (let s = 0; s < R + C - 1; s++) {
    const rows = [];
    for (let r = Math.max(0, s - (C - 1)); r <= Math.min(s, R - 1); r++) rows.push(r);
    if (s % 2 === 0) rows.reverse();
    for (const r of rows) res.push(mat[r][s - r]);
  }
  return res;
}` } },
        starter: { py: 'class Solution:\n    def findDiagonalOrder(self, mat: List[List[int]]) -> List[int]:\n        ', js: 'function findDiagonalOrder(mat) {\n  \n}' },
        tests: { fn: 'findDiagonalOrder', cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], out: [1, 2, 4, 7, 5, 3, 6, 8, 9] }, { args: [[[1, 2], [3, 4]]], out: [1, 2, 3, 4] }, { args: [[[1]]], out: [1] },
          { args: [[[1, 2, 3], [4, 5, 6]]], out: [1, 2, 4, 5, 3, 6] }, { args: [[[1, 2, 3, 4]]], out: [1, 2, 3, 4] }, { args: [[[1], [2]]], out: [1, 2] }] } }
    ],

    mistakes: [
      '**Mixing up row and column order.** `matrix[r][c]` is row first. A grid with `m` rows and `n` columns has `len(matrix) == m` and `len(matrix[0]) == n`. Write the loop variables as `r` and `c`, not `i` and `j`, until you trust yourself; swapped indices on a non-square grid crash or silently misread.',
      '**Transposing every pair.** Looping `j` over the whole row swaps each pair twice and undoes the transpose. Start the inner loop at `i + 1`.',
      '**Missing the single row or column guard in a spiral.** Without `if top <= bottom` and `if left <= right`, a 1 × n or n × 1 grid is walked twice. Test those two shapes before anything else.',
      '**Zeroing as you go in Set Matrix Zeroes.** A zero you just made looks like an original zero, and the whole grid fills with zeroes. Mark first, change second, and handle the first row and column **last**.',
      '**Forgetting the first row and column hold flags *and* data.** Save whether they contained a zero in two booleans before you reuse them as markers.',
      '**Updating a simulation cell by cell.** Game of Life reads old neighbours. If you write new values straight in, later cells see a mix of old and new. Use a copy, or encode old and new in separate bits.',
      '**Bounds checks that go out of range in one direction only.** Check both ends: `0 <= nr < R and 0 <= nc < C`. In Python a negative index doesn’t crash, it silently wraps to the other side of the grid, so a missing `>= 0` check gives wrong answers, not an error.',
      '**Language gotchas.** *Python:* `[[0] * n] * m` makes `m` references to the **same** row, so `grid[0][0] = 1` changes every row; build with `[[0] * n for _ in range(m)]`. *JavaScript:* `new Array(m).fill(new Array(n).fill(0))` has the same aliasing bug, so use `Array.from({ length: m }, () => new Array(n).fill(0))`. *Java:* `int[][]` rows can have different lengths, and `matrix[0].length` crashes on an empty array, so check `matrix.length` first. *C++:* `matrix.size()` is unsigned, so `int bottom = matrix.size() - 1` on an empty grid wraps; cast to `int` and check for empty first.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of rotating an n × n grid in place with transpose-then-reverse?',
        choices: ['O(n²)', 'O(n)', 'O(n³)', 'O(n log n)'], answer: 0,
        explain: 'There are n² cells. The transpose touches each once and the row reversal touches each once more, so the work is a constant times n², with O(1) extra space.' },
      { kind: 'concept', q: 'You transpose a square grid by swapping `matrix[i][j]` with `matrix[j][i]` for **every** i and j (the inner loop starts at 0). What happens?',
        choices: ['Each pair is swapped twice, so the grid is unchanged', 'It transposes correctly, just slower', 'It rotates the grid 180 degrees', 'It raises an index error'], answer: 0,
        explain: 'The pair (i, j) is swapped once when you reach (i, j) and again at (j, i), and the second swap undoes the first. Start the inner loop at `i + 1`.' },
      { kind: 'concept', q: 'In a spiral traversal, why is `if top <= bottom` needed before walking the bottom row?',
        choices: ['After the top row and right column, no rows may be left, and the walk would repeat the same row backwards', 'To make the loop terminate', 'Because Python slices need it', 'To skip rows that contain zeros'], answer: 0,
        explain: 'On a grid with one row, after the top row `top` moves past `bottom`. Without the guard, the code walks that same row again from right to left. The left-column guard does the same for a single column.' },
      { kind: 'pattern', q: 'Which of these is a matrix-index problem rather than a graph search?',
        choices: ['Return the cells of a grid in spiral order', 'Count the groups of connected land cells in a grid', 'Find the shortest path out of a maze grid', 'Fill a region of equal colours starting from one cell'], answer: 0,
        explain: 'A spiral is pure index arithmetic: boundaries and a traversal order. Connected groups, shortest path and flood fill all need DFS or BFS over neighbours.' },
      { kind: 'pattern', q: 'Which signals point to the in-place marker technique? Pick every one that applies.',
        choices: ['Cells must change based on the old values of other cells', 'The question allows only O(1) extra space on a grid', 'You must return a new grid of a different shape', 'The first row and column could serve as scratch space'], answer: [0, 1, 3],
        explain: 'Dependent updates and tight space call for markers or bit encodings, and borrowing the first row and column is the classic trick. A different-shaped result needs a new grid anyway.' },
      { kind: 'bug', q: 'This Set Matrix Zeroes zeroes the entire grid on `[[1,0],[1,1]]`. Which line is the cause?',
        code: `for r in range(len(m)):
    for c in range(len(m[0])):
        if m[r][c] == 0:
            for k in range(len(m[0])): m[r][k] = 0
            for k in range(len(m)): m[k][c] = 0`,
        choices: ['It zeroes cells immediately, and the new zeroes are mistaken for original ones later in the scan', 'The loop should run from the bottom row', 'It should check `m[r][c] == 1`', 'The inner loops should use `range(len(m))` for both'], answer: 0,
        explain: 'Zeroes created during the scan are indistinguishable from real zeroes, so they spread. Record what to zero first (flags or sets), and apply it in a second pass.' },
      { kind: 'concept', q: 'In Game of Life with the two-bit trick, why count a neighbour with `board[nr][nc] & 1`?',
        choices: ['Bit 0 is the old state; a neighbour already processed may have bit 1 set to its new state', 'It converts the value to a boolean for Python', 'It skips cells on the edge', 'It adds one to the count'], answer: 0,
        explain: 'Once a neighbour has been decided, its value is 2 or 3. Masking with 1 keeps only the old state, which is what the rules depend on.' },
      { kind: 'concept', q: 'Two cells in a grid are on the same top-right to bottom-left diagonal. What do they share?',
        choices: ['The sum `row + column`', 'The difference `row - column`', 'The same row', 'The same column parity'], answer: 0,
        explain: 'Moving down one row and left one column keeps `row + column` constant. The difference `row - column` is constant along the other kind of diagonal, top-left to bottom-right.' },
      { kind: 'bug', q: 'This builds a 3 × 3 grid of zeroes in Python, but setting `grid[0][0] = 1` changes the first cell of **every** row. Why?',
        code: `grid = [[0] * 3] * 3
grid[0][0] = 1`,
        choices: ['The outer multiplication repeats a reference to one row list', 'Python lists are always shared', '`[0] * 3` creates a tuple', 'Assignment copies a whole column'], answer: 0,
        explain: '`[row] * 3` makes three references to the same inner list. Build rows separately: `[[0] * 3 for _ in range(3)]`.' }
    ],

    flashcards: [
      { id: 'indexing', front: 'In an m × n grid, how do you get the row and column of flat position k?', back: 'Row `k // n`, column `k % n`, where n is the number of columns. Going back: `k = row * n + col`.' },
      { id: 'rotate-steps', front: 'How do you rotate a square grid 90 degrees clockwise in place?', back: 'Transpose it (swap `matrix[i][j]` with `matrix[j][i]` for `j > i`), then reverse every row. Counterclockwise: transpose, then reverse the order of the rows.' },
      { id: 'transpose-loop', front: 'Why does the transpose inner loop start at `i + 1`?', back: 'Each pair is swapped once. Looping over every `j` swaps each pair twice, which undoes the transpose.' },
      { id: 'spiral-bounds', front: 'Spiral traversal: what state do you keep, and what order do you walk?', back: 'Four boundaries: top, bottom, left, right. Walk top row (left to right), right column (down), bottom row (right to left), left column (up), pulling the matching boundary in after each side.' },
      { id: 'spiral-guards', front: 'Spiral traversal: why guard the bottom row and left column?', back: 'After the first two sides the rectangle can be a single row or column. Without `top <= bottom` and `left <= right`, that line would be walked a second time.' },
      { id: 'zeroes-flags', front: 'Set Matrix Zeroes in O(1) space: where do the flags live?', back: 'In the first row (column flags) and first column (row flags). Two booleans remember whether the first row and column themselves had a zero. Zero them last.' },
      { id: 'zeroes-order', front: 'Set Matrix Zeroes: what is the order of the passes?', back: 'Save the first row/column booleans, set flags from the inner cells, zero inner cells by flags, then zero the first row and column if their booleans say so.' },
      { id: 'diagonals', front: 'Which key groups cells on one diagonal?', back: '`i - j` is constant along top-left to bottom-right diagonals. `i + j` is constant along top-right to bottom-left anti-diagonals. On a square grid, the main diagonal is `i == j` and the anti-diagonal is `i + j == n - 1`.' },
      { id: 'dirs', front: 'What is a direction array, and how do you turn right with it?', back: '`[(0,1),(1,0),(0,-1),(-1,0)]` is right, down, left, up. Keep an index `d`; turning right is `d = (d + 1) % 4`. Neighbours are `for dr, dc in dirs`.' },
      { id: 'life-bits', front: 'Game of Life in place: how do you keep old and new state apart?', back: 'Bit 0 holds the old state and bit 1 the new one. Count neighbours with `& 1`, set `|= 2` for next-alive cells, then shift every cell right by one.' },
      { id: 'alias-bug', front: 'Python: why is `[[0] * n] * m` a bug?', back: 'It creates `m` references to the same row, so changing one cell changes that column in every row. Use `[[0] * n for _ in range(m)]`.' },
      { id: 'small-cases', front: 'Which grids do you test by hand before submitting a matrix solution?', back: '1 × 1, 1 × n, n × 1 and 2 × 2, plus one with a zero or repeat on the edge. Most matrix bugs are index bugs that only show on those shapes.' }
    ],

    deeper: [
      { title: 'Matrix (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/matrix/', time: 'about 20 min', note: 'The DSA-Kit style overview: matrix basics, traversals and a long list of classic problems with worked code.' },
      { title: 'Conway’s Game of Life (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life', time: 'about 10 min', note: 'The rules, common patterns (blinker, glider) and the infinite-board view. Good fuel for the follow-up question about a board with no edges.' },
      { title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'The NeetCode 150 laid out by pattern; the Math & Geometry row holds Rotate Image, Spiral Matrix and Set Matrix Zeroes. Some pages may ask you to sign in.' },
      { title: 'LeetCode Patterns (Sean Prashad)', url: 'https://seanprashad.com/leetcode-patterns/', time: 'reference', note: 'A filterable problem list. Filter by matrix or array to find more grid problems after this lesson.' }
    ],

    detective: [
      { id: 'mosaic-turn', decoys: ['arrays-hashing', 'two-pointers', 'sorting'],
        statement: 'A tile artist lays out a square mosaic of N × N coloured tiles on a workbench with barely any spare room. A customer wants the picture turned a quarter turn to the right, so what was along the left edge ends up along the top. There is space for a handful of loose tiles in the artist’s apron, but not for a second board. Describe how the tiles move, and what that costs in time and extra space.',
        why: 'A **grid** that must be turned **in place** with only a few spare cells. A quarter turn is a diagonal flip followed by a mirror of every row, so each tile moves a constant number of times: O(N²) time and O(1) extra space. It looks like in-place array work, but the pairs to swap come from a tile’s row and column, not from two ends of a list.' },
      { id: 'garden-walk', decoys: ['arrays-hashing', 'sliding-window', 'binary-search'],
        statement: 'A gardener waters a rectangular garden of plots, each labelled with a crop code. She starts at the north-west corner and walks east along the edge. Whenever the next step would leave the garden or land on a plot she has already watered, she turns clockwise and keeps going, ending at the middle. Write down the crop codes in the order she waters them, using only a few counters of memory beyond the answer.',
        why: 'A **grid** visited in a fixed circuit order that tightens inward. Track the unvisited rectangle with four edges: walk one edge, pull it in, then the next. Watch the leftover single row or column on a thin garden. That is the shrinking-boundary traversal, O(rows × cols) time. It isn’t a search: the visiting order is fully known in advance.' },
      { id: 'dead-lamps', decoys: ['arrays-hashing', 'prefix-sums', 'kadane'],
        statement: 'A control room has a wall panel arranged as rows and columns of lamps. Some lamps are dark. The safety rule says: if any lamp is dark, every lamp in that same row and in that same column must be switched off as well. The panel’s controller has memory for a few flags only: there is no room for lists the size of the rows or columns. Switch off lamps following the rule, in the panel itself, without letting newly switched-off lamps trigger more switching.',
        why: 'The key phrases are **grid**, a rule across a whole **row and column**, **a few flags only**, and the warning about lamps you just switched off. The scratch space has to be the panel itself: the first row and column can record which rows and columns need switching, with two flags for those lines’ own state, and the changes happen in a second pass. That is in-place marking, O(rows × cols) time and O(1) space.' }
    ]
  });
})();
