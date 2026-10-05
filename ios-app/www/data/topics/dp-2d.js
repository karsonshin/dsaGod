/* Offer Ready: 2-D and grid DP lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});

  /* Shared test cases (outputs checked by the verifier, not hand-trusted). */
  var G_MIN = [
    { args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], out: 7 }, { args: [[[1, 2, 3], [4, 5, 6]]], out: 12 }, { args: [[[5]]], out: 5 }, { args: [[[0, 0], [0, 0]]], out: 0 },
    { args: [[[1, 2], [1, 1]]], out: 3 }, { args: [[[1, 2, 3]]], out: 6 }, { args: [[[1], [2], [3]]], out: 6 }, { args: [[[9, 1, 4, 8], [6, 2, 1, 7], [3, 3, 3, 3]]], out: 19 }];
  var G_WALLS = [
    { args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], out: 2 }, { args: [[[0, 1], [0, 0]]], out: 1 }, { args: [[[1, 0]]], out: 0 }, { args: [[[0]]], out: 1 }, { args: [[[0, 0], [1, 1]]], out: 0 },
    { args: [[[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0]]], out: 3 }, { args: [[[0, 0], [0, 1]]], out: 0 }, { args: [[[0, 0, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 0, 0]]], out: 3 }];
  var G_SQ = [
    { args: [[['1', '0', '1', '0', '0'], ['1', '0', '1', '1', '1'], ['1', '1', '1', '1', '1'], ['1', '0', '0', '1', '0']]], out: 4 }, { args: [[['0', '1'], ['1', '0']]], out: 1 }, { args: [[['0']]], out: 0 },
    { args: [[['1', '1'], ['1', '1']]], out: 4 }, { args: [[['1']]], out: 1 }, { args: [[['1', '1', '1'], ['1', '1', '1'], ['1', '1', '1']]], out: 9 }, { args: [[['1', '0', '1', '1'], ['1', '1', '1', '1'], ['0', '1', '1', '1']]], out: 4 }];

  (OR.topics = OR.topics || []).push({
    id: 'dp-2d',

    hook: 'When a dynamic programming question needs **two numbers** to describe where you are, the table becomes a grid. Grid paths are the cleanest place to learn the whole routine: name the state, write the rule for one cell from its neighbours, fill in a safe order, read the answer from the corner. Unique Paths, Longest Increasing Path in a Matrix and Best Time to Buy and Sell Stock with Cooldown are all on the NeetCode 150, and Unique Paths is on the Blind 75. The same shape later carries string DP, knapsack and interval DP, so this is the lesson that pays for the next four.',

    cues: [
      'You move through a **grid** and are only allowed some moves (right and down), and the question asks **how many ways** or the **cheapest / best** way to the far corner.',
      'The best answer at a cell depends only on the answers at a **couple of neighbouring cells**: the one above and the one to the left.',
      'Brute force would branch at every step and repeat the same sub-walks, so the recursion tree has **overlapping** pieces (the same cell is reached by many routes).',
      'Each day (or step) you are in one of a **few labelled states** (holding something, cooling down, free), and today’s states come from yesterday’s. That is a table with a handful of columns.',
      'A walk over a matrix where you may move in **all four directions** but only to a strictly bigger (or smaller) value: the move rule makes the cell graph **acyclic**, so a memoized search works.',
      'The trap: if moves can go **back** (all four directions, no ordering rule) and you want a shortest path, that is BFS or Dijkstra, not DP. DP needs an order in which every cell’s inputs are finished before the cell is.'
    ],

    intuition: [
      'Think of a hiker crossing a field laid out in squares who can only step east or south. Ask about any one square: “what is the best way to *arrive here*?”. Every arrival came from the square just north or the square just west, so the answer for this square is built from exactly those two answers. Solve the squares in an order where both are already known (row by row, left to right) and you never solve the same question twice.',
      'Every DP problem in this lesson is the same five decisions:',
      '1. **State.** What do you need to know to answer the question for a position? Here it is the pair `(i, j)`: a row and a column. `dp[i][j]` is the answer *for arriving at* `(i, j)` (count of ways, or cheapest cost).\n2. **Transition.** How does `dp[i][j]` come from smaller states? For counting, **add** the sources: `dp[i-1][j] + dp[i][j-1]`. For cheapest cost, take the **better** source and add the cell’s own price: `min(dp[i-1][j], dp[i][j-1]) + cost[i][j]`.\n3. **Base cases.** The start cell is `1` way (or its own cost). The first row and first column have only one source, so they are the same rule with the missing neighbour treated as “not allowed” (zero ways, or infinite cost).\n4. **Order.** Fill so inputs come first. Row by row works whenever you only look up or left.\n5. **Answer.** Usually the far corner, but sometimes the best cell anywhere (the biggest square, the longest chain).',
      '**Obstacles** fit with no extra idea: a blocked cell contributes nothing. Its count is 0 (or its cost is infinity), so nobody gets through it, and the same formula keeps working next to it.',
      '**Space.** Row `i` only looks at row `i - 1` and itself, so you can keep **one row** and overwrite it as you go. The cell still holding the old value is “from above”, and the cell just written to its left is “from the left”. You get O(columns) memory. The catch: you can no longer trace the route back, so keep the whole table if you must print the path.',
      '**State machines.** Sometimes the second index is not a column but a **mode**. In the stock cooldown question each day you are *holding* a share, *just sold* (so tomorrow is a forced rest), or *resting* with nothing in hand. Each state’s best profit comes from yesterday’s states by a fixed rule, so the table is “days × 3”, and it collapses to three variables.',
      '**Memoized DFS on a grid.** When the moves go in every direction, there is no row order to fill by. But if you may only step to a strictly larger value, you can never loop, and the answer at a cell depends only on its larger neighbours. Ask recursively “what is the longest chain starting here?”, and store each answer the first time it is computed. Every cell is solved once, so it is O(m·n), not exponential.',
      '**Squares.** For the biggest all-ones square ending at a cell as its bottom-right corner, the side is `1 + min(up, left, diagonal)`: the three neighbours’ squares limit each other, and the smallest one decides how far the square can grow.',
      'Before you code any of these, write the state in words (“cheapest cost to arrive at row i, column j”) and test the rule on a 2 × 2 grid by hand. A wrong transition shows up there.'
    ].join('\n\n'),

    viz: 'dp-grid',

    template: {
      title: 'Cheapest path through a grid: fill a table cell by cell',
      note: 'The template is the min-cost version with walls (`-1`). To **count** paths instead, keep the same shape and change three things: the start becomes `1`, the pull becomes `dp[i-1][j] + dp[i][j-1]` (a missing neighbour is `0`), and a wall is `0`. Everything else (the loop order, the corner as the answer) is identical, and the visualizer lights the same lines in both modes. To also recover the route, walk back from the corner and step to whichever source was cheaper (Variations).',
      code: {
        py: `def minCostPath(grid):
    R, C = len(grid), len(grid[0])
    INF = 10**9
    dp = [[INF] * C for _ in range(R)]                                  #@init > dp[i][j]: cheapest cost to arrive at (i, j). INF means not reachable
    for i in range(R):
        for j in range(C):
            if grid[i][j] == -1:                                        #@wall > A wall can't be entered, so it stays INF
                continue
            if i == 0 and j == 0:
                best = 0                                                #@start > Nothing to pay to get to the start
            else:
                best = min(dp[i - 1][j] if i else INF, dp[i][j - 1] if j else INF)   #@pull > Cheaper of the two cells we could have come from
            dp[i][j] = best + grid[i][j] if best < INF else INF         #@fill > Pay for this cell on top of the cheaper arrival
    return dp[R - 1][C - 1] if dp[R - 1][C - 1] < INF else -1           #@answer > The corner holds the answer; INF means no route`,
        js: `function minCostPath(grid) {
  const R = grid.length, C = grid[0].length, INF = 1e9;
  const dp = Array.from({ length: R }, () => new Array(C).fill(INF));   //@init > dp[i][j]: cheapest cost to arrive at (i, j). INF means not reachable
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      if (grid[i][j] === -1) continue;                                  //@wall > A wall can't be entered, so it stays INF
      let best;
      if (i === 0 && j === 0) best = 0;                                 //@start > Nothing to pay to get to the start
      else best = Math.min(i ? dp[i - 1][j] : INF, j ? dp[i][j - 1] : INF);   //@pull > Cheaper of the two cells we could have come from
      dp[i][j] = best < INF ? best + grid[i][j] : INF;                  //@fill > Pay for this cell on top of the cheaper arrival
    }
  }
  return dp[R - 1][C - 1] < INF ? dp[R - 1][C - 1] : -1;                //@answer > The corner holds the answer; INF means no route
}`,
        java: `class Solution {
    public int minCostPath(int[][] grid) {
        int R = grid.length, C = grid[0].length, INF = 1_000_000_000;
        int[][] dp = new int[R][C];
        for (int[] row : dp) for (int j = 0; j < C; j++) row[j] = INF;      //@init > dp[i][j]: cheapest cost to arrive at (i, j). INF means not reachable
        for (int i = 0; i < R; i++) {
            for (int j = 0; j < C; j++) {
                if (grid[i][j] == -1) continue;                             //@wall > A wall can't be entered, so it stays INF
                int best;
                if (i == 0 && j == 0) best = 0;                             //@start > Nothing to pay to get to the start
                else best = Math.min(i > 0 ? dp[i - 1][j] : INF, j > 0 ? dp[i][j - 1] : INF);   //@pull > Cheaper of the two cells we could have come from
                dp[i][j] = best < INF ? best + grid[i][j] : INF;            //@fill > Pay for this cell on top of the cheaper arrival
            }
        }
        return dp[R - 1][C - 1] < INF ? dp[R - 1][C - 1] : -1;              //@answer > The corner holds the answer; INF means no route
    }
}`,
        cpp: `class Solution {
public:
    int minCostPath(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size(), INF = 1000000000;
        vector<vector<int>> dp(R, vector<int>(C, INF));                     //@init > dp[i][j]: cheapest cost to arrive at (i, j). INF means not reachable
        for (int i = 0; i < R; i++) {
            for (int j = 0; j < C; j++) {
                if (grid[i][j] == -1) continue;                             //@wall > A wall can't be entered, so it stays INF
                int best;
                if (i == 0 && j == 0) best = 0;                             //@start > Nothing to pay to get to the start
                else best = min(i > 0 ? dp[i - 1][j] : INF, j > 0 ? dp[i][j - 1] : INF);   //@pull > Cheaper of the two cells we could have come from
                dp[i][j] = best < INF ? best + grid[i][j] : INF;            //@fill > Pay for this cell on top of the cheaper arrival
            }
        }
        return dp[R - 1][C - 1] < INF ? dp[R - 1][C - 1] : -1;              //@answer > The corner holds the answer; INF means no route
    }
};`
      },
      tests: { fn: 'minCostPath', sig: { args: ['int[][]'] }, cases: [
        { args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], out: 7 }, { args: [[[1, 2, 3], [4, 5, 6]]], out: 12 }, { args: [[[5]]], out: 5 }, { args: [[[1, -1], [-1, 1]]], out: -1 },
        { args: [[[1, 1, -1], [-1, 1, 1], [1, 1, 1]]], out: 5 }, { args: [[[-1, 1], [1, 1]]], out: -1 }, { args: [[[0, 0, 0]]], out: 0 }, { args: [[[2, 1, 3, 9], [4, -1, 1, 2], [7, 5, 1, 1]]], out: 9 },
        { args: [[[1], [2], [-1]]], out: -1 }] }
    },

    complexity: {
      time: 'O(m·n)',
      space: 'O(m·n), or O(n) with a rolling row',
      why: 'The table has one cell per state `(i, j)`, and each cell is computed once from a constant number of neighbours (two for paths, three for maximal square, up to four for the memoized matrix search). So the time is the number of cells times a constant: O(m·n). The full table costs O(m·n) memory. Since a row reads only the row above, one row of length n is enough when you need just the corner’s value, which gives O(n) space (O(min(m, n)) if you roll along the shorter side). Stock cooldown has a table of days × 3 states, which shrinks to three variables: O(n) time, O(1) space.',
      trap: 'Do not say “O(2^(m+n))” for the DP just because the brute force is exponential, and do not forget that the **memo makes the search linear**: a memoized DFS over `m·n` cells with 4 neighbours each is O(m·n), but only if every cell is stored the first time. If you forget the memo (or memoize only on some paths), it quietly goes exponential. Also remember the recursion **depth** can reach m·n in a snake-shaped grid, so say that out loud (O(m·n) stack space for the memoized search).'
    },

    variations: [
      {
        name: 'Counting paths with walls: add the two sources',
        body: 'Counting is the same table with a different combine rule. A cell’s count is the number of paths to the cell above **plus** the number to the cell on its left, because every path to the cell ends with a step down or a step right. A wall has count `0`, which is exactly “no path goes through here”. Watch the first row and column: if a wall appears in the first row, every cell **after** it in that row has 0 paths (nothing can pass the wall), and the same for the first column. The code below treats `1` as a wall, the way the common question does.',
        code: {
          py: `def count_paths(grid):
    R, C = len(grid), len(grid[0])
    dp = [[0] * C for _ in range(R)]
    for i in range(R):
        for j in range(C):
            if grid[i][j] == 1:
                continue                                   #> Wall: 0 paths arrive here
            if i == 0 and j == 0:
                dp[i][j] = 1                               #> One way to be at the start
            else:
                dp[i][j] = (dp[i - 1][j] if i else 0) + (dp[i][j - 1] if j else 0)   #> Paths from above + paths from the left
    return dp[R - 1][C - 1]`,
          js: `function countPaths(grid) {
  const R = grid.length, C = grid[0].length;
  const dp = Array.from({ length: R }, () => new Array(C).fill(0));
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      if (grid[i][j] === 1) continue;                      //> Wall: 0 paths arrive here
      if (i === 0 && j === 0) dp[i][j] = 1;                //> One way to be at the start
      else dp[i][j] = (i ? dp[i - 1][j] : 0) + (j ? dp[i][j - 1] : 0);   //> Paths from above + paths from the left
    }
  }
  return dp[R - 1][C - 1];
}`
        },
        tests: { fn: { py: 'count_paths', default: 'countPaths' }, cases: G_WALLS }
      },
      {
        name: 'Rolling row: one row instead of the whole table',
        body: 'Row `i` reads only row `i - 1` and the cell just left of it in the same row. So keep **one** list. Before you overwrite `row[j]`, it still holds the value from the row above (“from above”); `row[j-1]` has already been overwritten with this row’s value (“from the left”). So `row[j] += row[j-1]` is the whole transition for counting. A wall resets `row[j]` to 0. Seed `row[0] = 1` so the very first cell sees one way in. The price: you no longer have the full table, so you cannot walk back to print a route.',
        code: {
          py: `def paths_with_walls(grid):
    C = len(grid[0])
    row = [0] * C
    row[0] = 1                                             #> Stands for "one way into the start cell"
    for line in grid:
        for j in range(C):
            if line[j] == 1:
                row[j] = 0                                 #> Wall: nothing passes through
            elif j:
                row[j] += row[j - 1]                       #> old row[j] is "from above", row[j-1] is "from the left"
    return row[C - 1]`,
          js: `function pathsWithWalls(grid) {
  const C = grid[0].length, row = new Array(C).fill(0);
  row[0] = 1;                                              //> Stands for "one way into the start cell"
  for (const line of grid) {
    for (let j = 0; j < C; j++) {
      if (line[j] === 1) row[j] = 0;                       //> Wall: nothing passes through
      else if (j) row[j] += row[j - 1];                    //> old row[j] is "from above", row[j-1] is "from the left"
    }
  }
  return row[C - 1];
}`
        },
        tests: { fn: { py: 'paths_with_walls', default: 'pathsWithWalls' }, cases: G_WALLS }
      },
      {
        name: 'Recover the route: walk back from the corner',
        body: 'The table tells you the **cost**, not the **route**. To get the route, keep the full table and walk back from the last cell: at each cell step to the neighbour (above or left) with the smaller table value, since that is the one the cell was built from. Prepend each cell, and reverse at the end. Ties mean several routes are equally cheap; any is correct. This is why you cannot throw away rows if the question asks for the path itself.',
        code: {
          py: `def min_path_route(grid):
    R, C = len(grid), len(grid[0])
    INF = float('inf')
    dp = [row[:] for row in grid]
    for i in range(R):
        for j in range(C):
            if i or j:
                dp[i][j] += min(dp[i - 1][j] if i else INF, dp[i][j - 1] if j else INF)
    i, j = R - 1, C - 1
    route = [[i, j]]
    while i or j:
        if i and (not j or dp[i - 1][j] <= dp[i][j - 1]):   #> Step back to the cheaper source
            i -= 1
        else:
            j -= 1
        route.append([i, j])
    return route[::-1]`,
          js: `function minPathRoute(grid) {
  const R = grid.length, C = grid[0].length;
  const dp = grid.map((row) => row.slice());
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      if (i || j) dp[i][j] += Math.min(i ? dp[i - 1][j] : Infinity, j ? dp[i][j - 1] : Infinity);
    }
  }
  let i = R - 1, j = C - 1;
  const route = [[i, j]];
  while (i || j) {
    if (i && (!j || dp[i - 1][j] <= dp[i][j - 1])) i--;     //> Step back to the cheaper source
    else j--;
    route.push([i, j]);
  }
  return route.reverse();
}`
        },
        tests: { fn: { py: 'min_path_route', default: 'minPathRoute' }, cases: [
          { args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], out: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] }, { args: [[[1, 2], [1, 1]]], out: [[0, 0], [1, 0], [1, 1]] },
          { args: [[[4]]], out: [[0, 0]] }, { args: [[[1, 2, 3]]], out: [[0, 0], [0, 1], [0, 2]] }] }
      },
      {
        name: 'Biggest square of 1s: smallest of three neighbours, plus one',
        body: 'Let `dp[i][j]` be the side of the largest all-ones square whose **bottom-right corner** is `(i, j)`. If the cell is `0`, it is `0`. Otherwise the square can extend only as far as the **smallest** of the squares ending just above, just left, and diagonally up-left, because each of the three has to hold a piece of the bigger square: `dp[i][j] = 1 + min(up, left, diagonal)`. The answer is the **maximum cell anywhere** (not the corner), squared for the area. Rows and columns outside the grid count as 0, so the first row and column become 1 or 0.',
        code: {
          py: `def largest_square(m):
    R, C = len(m), len(m[0])
    dp = [[0] * C for _ in range(R)]
    best = 0
    for i in range(R):
        for j in range(C):
            if m[i][j] == '1':
                if i == 0 or j == 0:
                    dp[i][j] = 1                           #> On the top or left edge a square can only be 1x1
                else:
                    dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])   #> The weakest neighbour limits the growth
                best = max(best, dp[i][j])
    return best * best`,
          js: `function largestSquare(m) {
  const R = m.length, C = m[0].length;
  const dp = Array.from({ length: R }, () => new Array(C).fill(0));
  let best = 0;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      if (m[i][j] === '1') {
        if (i === 0 || j === 0) dp[i][j] = 1;              //> On the top or left edge a square can only be 1x1
        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);   //> The weakest neighbour limits the growth
        best = Math.max(best, dp[i][j]);
      }
    }
  }
  return best * best;
}`
        },
        tests: { fn: { py: 'largest_square', default: 'largestSquare' }, cases: G_SQ }
      },
      {
        name: 'State machines: the second index is a mode, not a column',
        body: 'When a question has phases (“holding” or “not holding”, “just sold”, “resting”), make one DP value **per phase per day** and write each phase’s update from the previous day’s phases. Draw the arrows first: *rest → rest* (stay out), *rest → hold* (buy), *hold → hold* (keep), *hold → sold* (sell), *sold → rest* (the forced cooldown day). The arrows **are** the transitions: each state’s value is the best over the arrows pointing in. The usual traps are updating one state before another reads its old value (copy what you need first) and forgetting to start `hold` at minus infinity, because you can’t hold a share before buying. Variants (a fee per trade, at most k trades) add a column or change an arrow.'
      },
      {
        name: 'Memoized DFS when no row order is safe',
        body: 'If moves go in all four directions, rows and columns give no safe fill order. Look for a **rule that makes the move graph acyclic** (only to strictly larger values, only to the unvisited side, ...). With it, define `f(cell)` as the best answer starting from that cell, recurse into the allowed neighbours, and cache the result per cell. Each cell is solved once, so the cost is O(m·n) with the recursion stack as extra space. A non-recursive alternative is to **peel layers**: repeatedly remove the cells with no outgoing allowed move (a topological order), counting how many rounds it takes. It avoids deep recursion and runs in the same O(m·n). Without the acyclic rule (you may walk back onto cells), there is no sub-problem order, and it is a graph problem.'
      },
      {
        name: 'Other move sets: three cells above, or a triangle',
        body: 'If you can arrive from straight above, above-left or above-right (a falling path, a triangle of numbers), the cell’s value comes from up to three cells in the **previous row**, so it is still row by row with a one-row buffer. Take care at the edges (a column 0 cell has no upper-left source) and, if you update in place with a single row, read the old values before overwriting them. If you can move **down and right or diagonally**, add the diagonal source to the formula. The skeleton (state `(i, j)`, sources, base, order, corner or best cell) never changes.'
      },
      {
        name: 'Open grids: the closed form',
        body: 'With no walls, every path from top-left to bottom-right is a sequence of `m - 1` downs and `n - 1` rights in some order, so the count is the number of ways to choose where the downs go: `C(m + n - 2, m - 1)`. Compute it with a loop that multiplies and divides step by step (`res = res * (n - 1 + k) // k` for `k` from 1 to `m - 1`, keeping it exact) to avoid huge factorials. Mention this after the DP, as the follow-up; it does not survive obstacles or costs, which is why DP is the real tool.'
      }
    ],

    worked: [
      {
        lc: 62,
        restate: 'A robot stands in the top-left corner of a grid with m rows and n columns. Each move takes it one square down or one square right. Count how many different sequences of moves bring it to the bottom-right corner.',
        examples: '- `m = 3, n = 7` → `28`.\n- `m = 3, n = 2` → `3` (right-down-down, down-right-down, down-down-right).\n- A single row or single column has exactly `1` path.\n- Edge cases: `m = 1` or `n = 1`; a 1 × 1 grid (the robot is already there, 1 path).',
        brute: 'Recurse: `paths(i, j) = paths(i-1, j) + paths(i, j-1)` with 1 at the border. That is correct, but it recomputes the same squares over and over, giving roughly 2^(m+n) calls. Memoizing it is the DP below.',
        insight: 'Any path to a square ends by arriving from the square above or the square to its left, so its count is the sum of those two counts. Every square in the first row or first column has only one way in, so its count is 1. Fill row by row and the corner is the answer. And because a row only needs the previous row, one array is enough: before overwriting `row[j]` it holds “from above”, and `row[j-1]` is “from the left”, so `row[j] += row[j-1]`.',
        code: {
          py: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        row = [1] * n                          # the first row: one way to each square
        for _ in range(1, m):
            for j in range(1, n):
                row[j] += row[j - 1]           # from above (old row[j]) + from the left
        return row[-1]`,
          js: `function uniquePaths(m, n) {
  const row = new Array(n).fill(1);            // the first row: one way to each square
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) row[j] += row[j - 1];   // from above (old row[j]) + from the left
  }
  return row[n - 1];
}`,
          java: `class Solution {
    public int uniquePaths(int m, int n) {
        int[] row = new int[n];
        for (int j = 0; j < n; j++) row[j] = 1;        // the first row: one way to each square
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) row[j] += row[j - 1];   // from above + from the left
        }
        return row[n - 1];
    }
}`,
          cpp: `class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<int> row(n, 1);                         // the first row: one way to each square
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) row[j] += row[j - 1];   // from above + from the left
        }
        return row[n - 1];
    }
};`
        },
        complexity: 'O(m·n) time: one addition per square. O(n) space with the rolling row (O(m·n) if you keep the whole table).',
        say: '“The number of paths to a square is the number to the square above plus the number to the left, since every path ends with a down or a right step. The first row and column are all ones. I fill row by row, and because each row only reads the previous one, I keep a single row and update it in place. That is O(m·n) time and O(n) space. There’s also a closed form, C(m+n-2, m-1), choosing where the downs go, but the DP is what generalises to obstacles.”',
        followups: [
          { q: 'How does it change with obstacles?', a: 'A blocked square’s count is 0, and every other square uses the same sum. Take care with the first row and column: a blocker there zeroes everything after it. With a rolling row, set `row[j] = 0` at a blocked square.' },
          { q: 'Can you do it in O(1) space?', a: 'Yes, for the open grid: the answer is `C(m + n - 2, m - 1)`, computed with a loop of exact multiply-and-divide steps in O(min(m, n)) time. With obstacles you need the O(n) row.' },
          { q: 'Why does `row[j] += row[j-1]` work in one array?', a: 'At the moment you reach `j`, `row[j]` still holds the previous row’s value (the square above) and `row[j-1]` already holds this row’s value (the square to the left). Their sum is the new `row[j]`.' }
        ]
      },
      {
        lc: 64,
        restate: 'You get a grid of non-negative costs. Starting at the top-left, you may step only down or right, paying the cost of every square you stand on (including the first and last). Return the smallest total you can pay to reach the bottom-right square.',
        examples: '- `[[1,3,1],[1,5,1],[4,2,1]]` → `7` (1 → 3 → 1 → 1 → 1).\n- `[[1,2,3],[4,5,6]]` → `12` (1 → 2 → 3 → 6).\n- A single square returns its own cost; a single row or column returns the sum of everything.\n- Edge cases: zero costs, 1 × n and m × 1 grids.',
        brute: 'Try every path (recursion that branches down and right): O(2^(m+n)) because the same squares are reached by many routes. The DP stores the best cost per square so each is computed once.',
        insight: 'Define `dp[i][j]` as the cheapest cost to arrive at `(i, j)`. The last step into it came from above or from the left, so the cheapest arrival is the smaller of those two answers, plus this square’s own cost. The first row can only come from the left and the first column only from above. A row reads only the row above, so one row of memory is enough: `row[j]` before the update is “from above”, `row[j-1]` is “from the left”. (Keep the whole table instead if you also need the route.)',
        code: {
          py: `class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        R, C = len(grid), len(grid[0])
        row = [0] * C
        for i in range(R):
            for j in range(C):
                if i == 0 and j == 0:
                    row[j] = grid[0][0]
                elif i == 0:
                    row[j] = row[j - 1] + grid[i][j]          # first row: only from the left
                elif j == 0:
                    row[j] += grid[i][j]                      # first column: only from above
                else:
                    row[j] = min(row[j], row[j - 1]) + grid[i][j]   # cheaper of above / left
        return row[-1]`,
          js: `function minPathSum(grid) {
  const R = grid.length, C = grid[0].length, row = new Array(C).fill(0);
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      if (i === 0 && j === 0) row[j] = grid[0][0];
      else if (i === 0) row[j] = row[j - 1] + grid[i][j];          // first row: only from the left
      else if (j === 0) row[j] += grid[i][j];                      // first column: only from above
      else row[j] = Math.min(row[j], row[j - 1]) + grid[i][j];     // cheaper of above / left
    }
  }
  return row[C - 1];
}`,
          java: `class Solution {
    public int minPathSum(int[][] grid) {
        int R = grid.length, C = grid[0].length;
        int[] row = new int[C];
        for (int i = 0; i < R; i++) {
            for (int j = 0; j < C; j++) {
                if (i == 0 && j == 0) row[j] = grid[0][0];
                else if (i == 0) row[j] = row[j - 1] + grid[i][j];          // first row: only from the left
                else if (j == 0) row[j] += grid[i][j];                      // first column: only from above
                else row[j] = Math.min(row[j], row[j - 1]) + grid[i][j];    // cheaper of above / left
            }
        }
        return row[C - 1];
    }
}`,
          cpp: `class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size();
        vector<int> row(C, 0);
        for (int i = 0; i < R; i++) {
            for (int j = 0; j < C; j++) {
                if (i == 0 && j == 0) row[j] = grid[0][0];
                else if (i == 0) row[j] = row[j - 1] + grid[i][j];          // first row: only from the left
                else if (j == 0) row[j] += grid[i][j];                      // first column: only from above
                else row[j] = min(row[j], row[j - 1]) + grid[i][j];         // cheaper of above / left
            }
        }
        return row[C - 1];
    }
};`
        },
        complexity: 'O(m·n) time: every square is computed once from two neighbours. O(n) extra space with the rolling row; O(m·n) if you keep the full table to rebuild the route.',
        say: '“The cheapest way to reach a square is its own cost plus the cheaper of the arrival from above and the arrival from the left. The first row and column have a single source. I fill row by row, and since each row only reads the one above, I keep one array. That’s O(m·n) time and O(n) space. If you also want the route, I’d keep the full table and walk back from the corner, stepping to the cheaper source.”',
        followups: [
          { q: 'How would you return the actual path?', a: 'Keep the whole table. From the corner, step to whichever of above/left has the smaller table value until you reach the start, then reverse the list. It costs O(m·n) space.' },
          { q: 'What if costs can be negative?', a: 'The same DP still works, because you can only move right and down, so there are no cycles to exploit. (It would not work if you could move in four directions: then it is a shortest-path problem and negative cycles matter.)' },
          { q: 'What if you could also move up and left?', a: 'Then rows no longer give a fill order and cells can depend on each other in loops. It becomes a shortest-path problem: Dijkstra for non-negative costs.' }
        ]
      },
      {
        lc: 309,
        restate: 'You see a list of stock prices, one per day. You may buy and sell as often as you like, holding at most one share at a time. After you sell, you must skip the **next** day before you can buy again. Return the largest total profit.',
        examples: '- `[1,2,3,0,2]` → `3` (buy at 1, sell at 2, rest, buy at 0, sell at 2).\n- `[1]` → `0` (nothing to sell into).\n- `[2,1]` → `0` (falling prices: never trade).\n- `[1,2,4]` → `3` (buy at 1, sell at 4: one trade beats two with a cooldown).\n- Edge cases: a single day; always-falling prices.',
        brute: 'Try every buy, sell or skip choice on every day: O(2^n) or worse. The same “day and state” situations repeat, so the table has only 3 entries per day.',
        insight: 'Describe where you can be at the **end of each day** with three states: `hold` (you own a share), `sold` (you sold today, so tomorrow is forced rest), `rest` (you own nothing and may buy tomorrow). Each state’s best profit comes from yesterday’s states: `hold = max(hold, rest − price)` (keep holding, or buy from a free state); `sold = hold + price` (sell what you held); `rest = max(rest, sold_yesterday)` (stay free, or finish the cooldown). Compute them in an order that reads the old values, and the answer is the better of `sold` and `rest` after the last day. Only yesterday matters, so three variables replace the table.',
        code: {
          py: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        hold, sold, rest = -10**9, 0, 0          # can't hold before buying
        for p in prices:
            prev_sold = sold                      # yesterday's sold, needed for rest
            sold = hold + p                       # sell what we held
            hold = max(hold, rest - p)            # keep holding, or buy from a free state
            rest = max(rest, prev_sold)           # stay free, or cooldown ends
        return max(sold, rest)`,
          js: `function maxProfit(prices) {
  let hold = -1e9, sold = 0, rest = 0;           // can't hold before buying
  for (const p of prices) {
    const prevSold = sold;                        // yesterday's sold, needed for rest
    sold = hold + p;                              // sell what we held
    hold = Math.max(hold, rest - p);              // keep holding, or buy from a free state
    rest = Math.max(rest, prevSold);              // stay free, or cooldown ends
  }
  return Math.max(sold, rest);
}`,
          java: `class Solution {
    public int maxProfit(int[] prices) {
        int hold = -1_000_000_000, sold = 0, rest = 0;   // can't hold before buying
        for (int p : prices) {
            int prevSold = sold;                          // yesterday's sold, needed for rest
            sold = hold + p;                              // sell what we held
            hold = Math.max(hold, rest - p);              // keep holding, or buy from a free state
            rest = Math.max(rest, prevSold);              // stay free, or cooldown ends
        }
        return Math.max(sold, rest);
    }
}`,
          cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int hold = -1000000000, sold = 0, rest = 0;      // can't hold before buying
        for (int p : prices) {
            int prevSold = sold;                          // yesterday's sold, needed for rest
            sold = hold + p;                              // sell what we held
            hold = max(hold, rest - p);                   // keep holding, or buy from a free state
            rest = max(rest, prevSold);                   // stay free, or cooldown ends
        }
        return max(sold, rest);
    }
};`
        },
        complexity: 'O(n) time: three constant-time updates per day. O(1) space: only yesterday’s three values are kept.',
        say: '“I’ll treat each day as one of three states: holding a share, just sold (forced rest tomorrow), or resting with nothing. Holding comes from holding yesterday or buying out of a rest state; sold comes from holding yesterday plus today’s price; rest comes from resting yesterday or from having sold yesterday. I update them in that order, saving yesterday’s sold first. The answer is max(sold, rest) at the end: O(n) time, O(1) space.”',
        followups: [
          { q: 'Why save `prev_sold` before updating?', a: '`rest` needs yesterday’s `sold`, but `sold` is overwritten with today’s value first. Copy the old value (or compute `rest` first) so each state reads yesterday’s numbers, not today’s.' },
          { q: 'How would a flat fee per trade change it?', a: 'Subtract the fee at the sell (or the buy). The cooldown state disappears, so you only need `hold` and `free`: `free = max(free, hold + p − fee)`, `hold = max(hold, free − p)`.' },
          { q: 'Why is the answer `max(sold, rest)` and not `hold`?', a: 'Ending the last day holding a share means it was bought and never sold, which is never better than not buying it. Only the two states without a share can be optimal.' }
        ]
      },
      {
        lc: 329,
        restate: 'You get a grid of integers. A path may start anywhere and may move to a neighbouring square up, down, left or right (no diagonals, no leaving the grid), but each step must land on a **strictly larger** value than the square it left. Return the number of squares on the longest such path.',
        examples: '- `[[9,9,4],[6,6,8],[2,1,1]]` → `4` (1 → 2 → 6 → 9).\n- `[[3,4,5],[3,2,6],[2,2,1]]` → `4` (3 → 4 → 5 → 6).\n- `[[7,7],[7,7]]` → `1` (no square has a larger neighbour).\n- Edge cases: one square, a single row, a grid of equal values.',
        brute: 'Start a DFS from every square and follow every increasing move. Without remembering results, the same suffix of a chain is explored from many starts, which can be exponential. Because the values keep rising, there is never a loop, so remembering each square’s answer is safe.',
        insight: 'Let `f(r, c)` be the length of the longest increasing path that **starts** at that square. Its value is `1 + max f(neighbour)` over the neighbours holding a strictly larger value (or 1 if there are none). Since every step goes strictly up, no square can depend on itself, so recursion always ends, and the answer for a square never changes: cache it the first time it is computed. Run the search from every square and keep the maximum. Each of the m·n squares is solved once and looks at 4 neighbours, so the cost is O(m·n).',
        code: {
          py: `class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        R, C = len(matrix), len(matrix[0])
        memo = [[0] * C for _ in range(R)]       # 0 = not computed yet

        def dfs(r, c):
            if memo[r][c]:
                return memo[r][c]
            best = 1
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < R and 0 <= nc < C and matrix[nr][nc] > matrix[r][c]:
                    best = max(best, 1 + dfs(nr, nc))     # only climb to a bigger value
            memo[r][c] = best
            return best

        return max(dfs(r, c) for r in range(R) for c in range(C))`,
          js: `function longestIncreasingPath(matrix) {
  const R = matrix.length, C = matrix[0].length;
  const memo = Array.from({ length: R }, () => new Array(C).fill(0));   // 0 = not computed yet
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function dfs(r, c) {
    if (memo[r][c]) return memo[r][c];
    let best = 1;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + dfs(nr, nc));          // only climb to a bigger value
      }
    }
    return (memo[r][c] = best);
  }
  let ans = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) ans = Math.max(ans, dfs(r, c));
  return ans;
}`,
          java: `class Solution {
    private int R, C;
    private int[][] a, memo;
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int longestIncreasingPath(int[][] matrix) {
        a = matrix; R = a.length; C = a[0].length;
        memo = new int[R][C];                                   // 0 = not computed yet
        int ans = 0;
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) ans = Math.max(ans, dfs(r, c));
        return ans;
    }

    private int dfs(int r, int c) {
        if (memo[r][c] != 0) return memo[r][c];
        int best = 1;
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && a[nr][nc] > a[r][c]) {
                best = Math.max(best, 1 + dfs(nr, nc));         // only climb to a bigger value
            }
        }
        return memo[r][c] = best;
    }
}`,
          cpp: `class Solution {
    int R, C;
    vector<vector<int>> a, memo;
    int dfs(int r, int c) {
        if (memo[r][c]) return memo[r][c];
        int best = 1;
        const int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && a[nr][nc] > a[r][c]) {
                best = max(best, 1 + dfs(nr, nc));              // only climb to a bigger value
            }
        }
        return memo[r][c] = best;
    }
public:
    int longestIncreasingPath(vector<vector<int>>& matrix) {
        a = matrix; R = a.size(); C = a[0].size();
        memo.assign(R, vector<int>(C, 0));                      // 0 = not computed yet
        int ans = 0;
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) ans = max(ans, dfs(r, c));
        return ans;
    }
};`
        },
        complexity: 'O(m·n) time: each square is computed once (the memo catches every repeat) and checks 4 neighbours. O(m·n) space for the memo, plus up to O(m·n) recursion depth in the worst case (a long snake of increasing values).',
        say: '“From any square, the longest increasing path starting there is one plus the best of its strictly larger neighbours. Because we only ever move to bigger values there are no cycles, so I can cache that number per square the first time I compute it. I run the DFS from every square and take the maximum. Each square is solved once with four neighbour checks, so it’s O(m·n) time and space. The recursion can go deep on a long snake, so if depth worries you I’d switch to peeling layers with in-degrees, which is the same complexity without recursion.”',
        followups: [
          { q: 'Why is memoization safe here, when it would not be for a general grid walk?', a: 'Every move goes to a strictly larger value, so a square can never be reached again from itself. The answer for a square depends only on larger squares, and it does not depend on how you got there, so one cached number is always right.' },
          { q: 'How would you avoid deep recursion?', a: 'Treat “can step to a bigger neighbour” as directed edges and run a topological peel: count each square’s smaller neighbours, repeatedly remove the squares with none, and count the rounds. The number of rounds is the longest path length. Same O(m·n).' },
          { q: 'What changes if equal values are allowed to step onto each other?', a: 'Then there can be cycles (two equal neighbours stepping back and forth), the memo is no longer safe, and it becomes a harder longest-path problem. The strict inequality is what makes the question tractable.' }
        ]
      }
    ],

    practice: [
      { lc: 62,
        hints: ['Any path to a square ends with a step down or a step right.', 'So the number of paths to a square is the number of paths to the square above plus the number to its left. The whole first row and first column are 1.', 'Row `i` reads only row `i - 1`: keep one array, start it as all 1s, and do `row[j] += row[j - 1]` for each further row.'],
        starter: { py: 'class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        ', js: 'function uniquePaths(m, n) {\n  \n}' },
        tests: { fn: 'uniquePaths', sig: { args: ['int', 'int'] }, cases: [
          { args: [3, 7], out: 28 }, { args: [3, 2], out: 3 }, { args: [1, 1], out: 1 }, { args: [1, 5], out: 1 }, { args: [7, 3], out: 28 }, { args: [10, 10], out: 48620 }, { args: [2, 2], out: 2 }] } },

      { lc: 64,
        hints: ['Ask: what is the cheapest way to arrive at one square? It arrived from above or from the left.', 'So `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`. The first row and column have just one source.', 'You only need the previous row, so reuse one array: `row[j] = min(row[j], row[j-1]) + grid[i][j]`.'],
        starter: { py: 'class Solution:\n    def minPathSum(self, grid: List[List[int]]) -> int:\n        ', js: 'function minPathSum(grid) {\n  \n}' },
        tests: { fn: 'minPathSum', sig: { args: ['int[][]'] }, cases: G_MIN } },

      { lc: 309,
        hints: ['Each day you are in one of three situations: holding a share, just sold one, or free (no share, allowed to buy).', 'Holding comes from holding yesterday or buying from free. Sold comes from holding yesterday plus today’s price. Free comes from free yesterday or from having sold yesterday.', 'Update with three variables, saving yesterday’s `sold` before overwriting it. Start `hold` very negative, and return `max(sold, rest)`.'],
        starter: { py: 'class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ', js: 'function maxProfit(prices) {\n  \n}' },
        tests: { fn: 'maxProfit', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3, 0, 2]], out: 3 }, { args: [[1]], out: 0 }, { args: [[2, 1]], out: 0 }, { args: [[1, 2, 4]], out: 3 }, { args: [[6, 1, 3, 2, 4, 7]], out: 6 }, { args: [[1, 2, 3, 4, 5]], out: 4 },
          { args: [[5, 4, 3, 2, 1]], out: 0 }, { args: [[2, 1, 4, 5, 2, 9, 7]], out: 10 }] } },

      { lc: 329,
        hints: ['Define `f(r, c)` as the longest increasing path that starts at that square.', 'It is `1` plus the best `f` of any neighbour with a strictly larger value. Moving only to larger values means there are no cycles.', 'Cache `f` per square so each is computed once, call it from every square, and return the largest result.'],
        starter: { py: 'class Solution:\n    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:\n        ', js: 'function longestIncreasingPath(matrix) {\n  \n}' },
        tests: { fn: 'longestIncreasingPath', sig: { args: ['int[][]'] }, cases: [
          { args: [[[9, 9, 4], [6, 6, 8], [2, 1, 1]]], out: 4 }, { args: [[[3, 4, 5], [3, 2, 6], [2, 2, 1]]], out: 4 }, { args: [[[1]]], out: 1 }, { args: [[[1, 2]]], out: 2 },
          { args: [[[5, 4, 3]]], out: 3 }, { args: [[[7, 7], [7, 7]]], out: 1 }, { args: [[[1, 2, 3], [6, 5, 4], [7, 8, 9]]], out: 9 }] } },

      { lc: 63,
        hints: ['It is the same count as the open grid, except a blocked square can’t be stood on.', 'A blocked square has 0 paths. Every other square is the paths from above plus the paths from the left (0 if that neighbour is off the grid).', 'With one rolling row: start `row[0] = 1`, and for each square set `row[j] = 0` if blocked, else `row[j] += row[j-1]` (skip the add when `j == 0`).'],
        solution: { explain: 'One row of counts. A blocked square resets its count to 0; otherwise the count is the old value (from above) plus the left neighbour. Seeding `row[0] = 1` makes the start cell see one way in, and a blocked start or end naturally gives 0. O(m·n) time, O(n) space.', code: {
          py: `class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid: List[List[int]]) -> int:
        C = len(obstacleGrid[0])
        row = [0] * C
        row[0] = 1
        for line in obstacleGrid:
            for j in range(C):
                if line[j] == 1:
                    row[j] = 0
                elif j:
                    row[j] += row[j - 1]
        return row[-1]`,
          js: `function uniquePathsWithObstacles(obstacleGrid) {
  const C = obstacleGrid[0].length, row = new Array(C).fill(0);
  row[0] = 1;
  for (const line of obstacleGrid) {
    for (let j = 0; j < C; j++) {
      if (line[j] === 1) row[j] = 0;
      else if (j) row[j] += row[j - 1];
    }
  }
  return row[C - 1];
}` } },
        starter: { py: 'class Solution:\n    def uniquePathsWithObstacles(self, obstacleGrid: List[List[int]]) -> int:\n        ', js: 'function uniquePathsWithObstacles(obstacleGrid) {\n  \n}' },
        tests: { fn: 'uniquePathsWithObstacles', sig: { args: ['int[][]'] }, cases: G_WALLS } },

      { lc: 221,
        hints: ['Let `dp[i][j]` be the side of the biggest all-ones square whose bottom-right corner is `(i, j)`. A `0` cell gives 0.', 'For a `1` cell, the square can grow only as far as the smallest of the squares ending above, to the left and diagonally up-left: `1 + min(up, left, diagonal)`.', 'Track the largest value seen anywhere and return its square. A single row of memory works if you save the old diagonal value before overwriting it.'],
        solution: { explain: 'Side of the best square ending at each cell is `1 + min(up, left, diagonal)` for a `1`, else `0`; the answer is the largest side squared. One padded row of length C+1 holds “up” and “left”, and a saved `prev` holds the diagonal. O(m·n) time, O(n) space.', code: {
          py: `class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        C = len(matrix[0])
        dp = [0] * (C + 1)
        best = 0
        for row in matrix:
            prev = 0                               # diagonal: the old dp[c-1]
            for c in range(1, C + 1):
                keep = dp[c]                       # this will be the next diagonal
                if row[c - 1] == '1':
                    dp[c] = 1 + min(dp[c], dp[c - 1], prev)
                    best = max(best, dp[c])
                else:
                    dp[c] = 0
                prev = keep
        return best * best`,
          js: `function maximalSquare(matrix) {
  const C = matrix[0].length, dp = new Array(C + 1).fill(0);
  let best = 0;
  for (const row of matrix) {
    let prev = 0;                                  // diagonal: the old dp[c-1]
    for (let c = 1; c <= C; c++) {
      const keep = dp[c];                          // this will be the next diagonal
      if (row[c - 1] === '1') {
        dp[c] = 1 + Math.min(dp[c], dp[c - 1], prev);
        best = Math.max(best, dp[c]);
      } else dp[c] = 0;
      prev = keep;
    }
  }
  return best * best;
}` } },
        starter: { py: 'class Solution:\n    def maximalSquare(self, matrix: List[List[str]]) -> int:\n        ', js: 'function maximalSquare(matrix) {\n  \n}' },
        tests: { fn: 'maximalSquare', sig: { args: ['char[][]'] }, cases: G_SQ } }
    ],

    mistakes: [
      '**Writing the transition before saying what the state means.** “`dp[i][j]` is the cheapest cost to arrive at `(i, j)`” settles dozens of small questions (does it include this cell’s cost? is it the corner or the best anywhere?). Say it in one sentence first.',
      '**Off-by-one at the first row and column.** Looking up `dp[i-1][j]` when `i == 0` is out of range in Java and C++ and, in Python, silently reads the **last** row (`-1`). Treat the missing neighbour as “not allowed” (0 ways, or infinite cost), or pad the table with an extra row and column.',
      '**Using 0 as “blocked” when you take a minimum.** For min-cost, a wall or unreachable cell must be **infinity**, otherwise `min` happily routes through it for free. For counting, 0 is right. Pick the neutral value per operation.',
      '**Forgetting that a wall in the first row or column kills everything after it.** With obstacles, `dp[0][j]` is 1 only until the first wall. Setting the whole first row to 1 up front is wrong.',
      '**Overwriting a rolling row too early.** In a one-row version, `row[j]` is “from above” only *until* you assign it. For maximal square you also need the old `row[j-1]`: save it in a variable before it is overwritten. When something reads a value and then changes it, copy first.',
      '**Stock states updated in the wrong order.** `sold = hold + p` must use yesterday’s `hold`, and `rest` must use yesterday’s `sold`. If you update `hold` first, or lose the old `sold`, you mix days and get an answer that looks plausible but is wrong. Copy what you still need.',
      '**Starting `hold` at 0.** Holding a share you never bought is not possible, so it starts at minus infinity (a big negative number). Starting at 0 lets the code “sell” something for free.',
      '**A memoized search that forgets to store, or uses 0 as both “unknown” and “answer”.** In the longest-path search, every real answer is at least 1, so 0 can mean “not computed”. If an answer could be 0, use `None` / `-1` as the marker.',
      '**Reading the answer from the corner when it is the best cell anywhere.** Maximal square and longest-path questions take the **maximum** over all cells. Corner answers belong to path questions only.',
      '**Language gotchas.** *Python:* `[[0] * n] * m` aliases one row `m` times; build with `[[0] * n for _ in range(m)]`. Deep recursion (a snake-shaped matrix) can hit the default limit of about 1000 frames; raise it with `sys.setrecursionlimit` or use the layer-peeling version. *JavaScript:* `new Array(m).fill(new Array(n))` has the same aliasing bug; use `Array.from`. *Java:* a big sentinel like `Integer.MAX_VALUE` overflows when you add a cost to it; use about 10^9. *C++:* `vector<vector<int>>(m, vector<int>(n))` is zero-filled, but `INT_MAX + x` is undefined behaviour, so use a smaller INF.'
    ],

    quiz: [
      { kind: 'complexity', q: 'Counting the paths in an m × n grid with the DP table, what are the time and space?',
        choices: ['O(m·n) time, O(m·n) space, reducible to O(n)', 'O(2^(m+n)) time, O(1) space', 'O(m + n) time, O(m·n) space', 'O(m·n) time, O(1) space for any grid with walls'], answer: 0,
        explain: 'One cell per state, constant work each. A row reads only the row above, so one row of length n is enough for the count. (With walls and a requirement to print the route you keep the table.)' },
      { kind: 'concept', q: 'In the cheapest-path DP, a wall or unreachable cell should hold which value?',
        choices: ['A very large number (infinity)', '0', '-1 and then added like any other cost', 'The cost of its left neighbour'], answer: 0,
        explain: 'You take a minimum, so a neutral “never choose me” value must be larger than any real cost. Zero would look like a free route, and a negative number would look even better. For counting paths, 0 is right instead.' },
      { kind: 'concept', q: 'Which states do you need to track each day in the stock-with-cooldown question?',
        choices: ['Holding a share, just sold, and resting with no share', 'Only the lowest price so far', 'Only whether today is a cooldown', 'One state per previous buy price'], answer: 0,
        explain: 'Holding, just-sold (which forces tomorrow to be a rest) and free-to-buy fully capture what yesterday means for today. The rules link them: buy from free, sell from holding, cooldown from sold to free.' },
      { kind: 'concept', q: 'A rolling-row DP for counting paths does `row[j] += row[j - 1]`. What are the two values being added?',
        choices: ['The old `row[j]` (the cell above) and the new `row[j-1]` (the cell to the left)', 'Both from the row above', 'Both from the current row', 'The cell above and the cell diagonally up-left'], answer: 0,
        explain: 'Before the update, `row[j]` still holds the previous row’s value, so it is “from above”. `row[j-1]` was just written for the current row, so it is “from the left”.' },
      { kind: 'pattern', q: 'Which signals point to a memoized DFS over a grid, rather than filling a table row by row? Pick every one that applies.',
        choices: ['Moves go in all four directions', 'A rule (such as strictly increasing values) makes loops impossible', 'The answer for a cell depends on its neighbours’ answers', 'Moves are only right and down'], answer: [0, 1, 2],
        explain: 'Four-way moves give no row order, so a recursion with a cache is used. The acyclic rule makes the cache valid, and “cell depends on neighbours” is what DP means. If moves are only right and down, a plain table works.' },
      { kind: 'pattern', q: 'You may move up, down, left or right through a grid of costs, and want the cheapest route from one corner to the other. Which is the right tool?',
        choices: ['A shortest-path search such as Dijkstra', 'The row-by-row DP table', 'A memoized DFS with no ordering rule', 'Sorting the costs'], answer: 0,
        explain: 'With moves in all directions, cells can depend on each other in loops, so there is no fill order for a table. Non-negative costs call for Dijkstra (see Shortest Paths).' },
      { kind: 'bug', q: 'This min-path-sum code returns a wrong answer on `[[1,3],[1,5]]`. What is the bug?',
        code: `dp = [[0] * C for _ in range(R)]
for i in range(R):
    for j in range(C):
        dp[i][j] = grid[i][j] + min(dp[i - 1][j], dp[i][j - 1])
return dp[R - 1][C - 1]`,
        choices: ['The first row and column look up out-of-range neighbours (negative indexes in Python), and the start has no base case', 'It should add instead of taking min', 'The loops should run backwards', 'The table should be initialised with 1s'], answer: 0,
        explain: 'At `i == 0` the code reads `dp[-1][j]` (the last row, still 0 at that time) and at `j == 0` it reads `dp[i][-1]`. The start must be `grid[0][0]`, and edge cells must have a single source.' },
      { kind: 'bug', q: 'Maximal square: this loop reads `dp[i-1][j-1]` after the row has already been overwritten. Which version of the idea is broken?',
        code: `row = [0] * (C + 1)
for line in matrix:
    for c in range(1, C + 1):
        if line[c - 1] == '1':
            row[c] = 1 + min(row[c], row[c - 1], row[c - 1])
        else:
            row[c] = 0`,
        choices: ['The diagonal value is never saved: the third argument should be the old `row[c-1]` from before this row’s update', 'It should use `max` instead of `min`', 'The row needs C + 2 entries', 'It should reset `row` for each line'], answer: 0,
        explain: 'In a single-row DP, `row[c-1]` already holds the current row’s value, so the diagonal (previous row, column c-1) is gone. Save it in a `prev` variable before overwriting, as the practice solution does.' },
      { kind: 'concept', q: 'Why is the memoized search for the longest increasing path through a matrix guaranteed to finish and to be correct with a single cached number per cell?',
        choices: ['Each move goes to a strictly larger value, so the cell graph has no cycles and a cell’s answer never depends on how you arrived', 'Because Python caches recursion automatically', 'Because the grid is small', 'Because it checks only right and down'], answer: 0,
        explain: 'Strictly increasing values make loops impossible, so the recursion bottoms out, and the best path *starting* at a cell depends only on larger cells, never on the route used to reach it.' }
    ],

    flashcards: [
      { id: 'dp-recipe', front: 'What are the five decisions in every DP solution?', back: 'State (what do I need to know?), transition (how does a state come from smaller ones?), base cases, fill order, and where the answer lives (corner, or best cell).' },
      { id: 'grid-state', front: 'In grid DP, what does `dp[i][j]` usually mean?', back: 'The answer **for arriving at** cell `(i, j)` (ways, or cheapest cost), computed from the cells you can step in from: above and left.' },
      { id: 'paths-rule', front: 'Unique paths: what is the transition and the base?', back: '`dp[i][j] = dp[i-1][j] + dp[i][j-1]`. First row and column are 1 (one source). With a wall, that cell is 0.' },
      { id: 'mincost-rule', front: 'Minimum path sum: what is the transition?', back: '`dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`. First row can only come from the left, first column only from above.' },
      { id: 'neutral-value', front: 'What value does a wall or off-grid neighbour hold, for counting versus for a minimum?', back: 'Counting: **0** (adds nothing). Minimum: **infinity** (never chosen). Using the wrong one is a classic bug.' },
      { id: 'rolling-row', front: 'How does a one-row DP work for grid paths?', back: 'Before you overwrite `row[j]`, it holds “from above”; `row[j-1]` already holds “from the left”. So `row[j] += row[j-1]` (count) or `row[j] = min(row[j], row[j-1]) + cost` (cheapest). O(n) space, but you lose the route.' },
      { id: 'route-trace', front: 'How do you recover the actual path, not just the cost?', back: 'Keep the full table. From the corner, step to the neighbour (above or left) with the smaller table value until you reach the start, then reverse.' },
      { id: 'open-grid-formula', front: 'Closed form for paths in an open m × n grid (right/down only)?', back: '`C(m + n - 2, m - 1)`: choose which of the `m + n - 2` moves are downs. It does not handle walls or costs.' },
      { id: 'stock-states', front: 'Stock with cooldown: the three states and their updates?', back: '`hold = max(hold, rest - p)`, `sold = hold + p`, `rest = max(rest, sold_prev)`. Start `hold` at minus infinity. Answer `max(sold, rest)`.' },
      { id: 'memo-grid-dfs', front: 'When can you memoize a DFS on a grid with four-way moves?', back: 'When a rule (like strictly larger values) makes the moves acyclic. Then `f(cell)` depends only on allowed neighbours, never on the route, so cache it. Total O(m·n).' },
      { id: 'layer-peel', front: 'How can you avoid deep recursion in the longest increasing path?', back: 'Topological peel: count each cell’s smaller neighbours, repeatedly remove cells with none, and count rounds. Rounds = longest path. Same O(m·n).' },
      { id: 'square-rule', front: 'Largest all-ones square: transition and answer?', back: '`dp[i][j] = 1 + min(up, left, diagonal)` if the cell is 1, else 0. Answer is the **maximum** dp value squared (best cell anywhere, not the corner).' }
    ],

    deeper: [
      { title: 'Dynamic Programming (Jeff Erickson, Algorithms)', url: 'https://jeffe.cs.illinois.edu/teaching/algorithms/book/03-dynprog.pdf', time: 'about 45 min', note: 'A clear chapter on thinking recursively first and then turning it into a table; the same state-and-transition habit this lesson drills.' },
      { title: 'MIT 6.006: Dynamic Programming lectures', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', time: 'about 80 min', note: 'Free lecture videos and notes. The DP lectures use the SRTBOT recipe (subproblems, relations, topological order, base, original problem, time), a more formal version of the five decisions above.' },
      { title: 'Dynamic Programming (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/dynamic-programming/', time: 'reference', note: 'A large, indexed collection of classic DP problems including grid paths and the stock-trading family.' },
      { title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Shows where 2-D DP sits among the NeetCode 150 and the suggested order. Some pages may ask you to sign in.' }
    ],

    detective: [
      { id: 'rover-battery', decoys: ['dp-1d', 'greedy', 'shortest-paths'],
        statement: 'A survey rover lands in the north-west corner of a rectangular plateau divided into plots. Crossing a plot drains a known amount of battery (the landing plot included). The rover’s steering is jammed so that, at each step, it can only roll one plot east or one plot south. It must reach the supply depot in the south-east corner. What is the least total battery it can spend, and how would you work it out without trying every route?',
        why: 'A **grid** where moves are limited to **two directions**, and you want the **cheapest** total. Every plot is entered from the plot north of it or west of it, so its best cost is its own drain plus the smaller of those two answers. No plot depends on later ones, so a table filled row by row solves every plot once: O(rows × cols). Looks like shortest paths, but with only east and south moves there are no loops, so no priority queue is needed. A greedy “take the cheaper neighbour” fails because a cheap plot can lead into expensive ones.' },
      { id: 'fruit-stall-closed', decoys: ['greedy', 'dp-1d', 'sliding-window'],
        statement: 'A market trader knows the price of mangoes on each of the next N days. Each day she can buy one crate (if her stall holds none), sell the crate she holds, or do nothing, but never carry more than one crate. The market rules close her stall for the whole day after any sale, so she can’t buy that next day. Starting with no crate, what is the largest total profit she can make, and how little memory can you do it in?',
        why: 'Each day she is in one of a **few labelled situations**: holding a crate, having just sold (so tomorrow is forced closed), or free with nothing. The best profit in each situation tomorrow comes only from the three situations today by fixed rules, so you keep three numbers and update them day by day: O(N) time and O(1) space. A greedy “sell at every peak” misses the forced closed day. The trap is updating one situation before another has read its old value.' },
      { id: 'ridge-hike', decoys: ['graphs', 'backtracking', 'dp-1d'],
        statement: 'A hiker has an elevation map divided into square cells, each with a whole-number height. From any cell she may step to the cell directly north, south, east or west, but only if it is strictly **higher** than where she stands. She may begin on any cell she likes and stop whenever. What is the greatest number of cells she can visit in a single walk? Think about how to avoid re-exploring the same slopes from different starting cells.',
        why: 'Moves go in **all four directions**, but the **strictly higher** rule means a walk can never return to a cell, so the map has no loops. The longest walk that starts at a cell is one plus the best among its higher neighbours, and that number is the same however you got there. Store it per cell the first time, and every cell is solved once: O(rows × cols). Without the stored answers the same slopes are re-walked from many starts. It is not a shortest-path or a flood-fill problem: you are maximising a chain length, over an acyclic cell graph.' }
    ]
  });
})();
