(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['dp-2d'] = {
    primer: {
      kind: 'technique',
      what: `2-D dynamic programming is DP where a position needs **two numbers** to describe, so the table is a grid: \`dp[i][j]\` answers the question for row i, column j. Think of a hiker on a field of squares asking "what is the best way to arrive on *this* square?" and writing the answer in it.`,
      does: `It solves count, best-value and yes/no questions on grids (paths, cheapest routes, squares), on two sequences (a row index per item, a column per budget or position), and on "mode" problems such as stocks with cooldown. Each cell costs O(1), so the whole table is O(rows x columns).`,
      impl: `Build a list of lists with a comprehension, \`[[0] * C for _ in range(R)]\` (never \`[[0] * C] * R\`, which aliases one row). Fill in an order where the cells you read (above, left) are done: row by row. Because a row reads only the row above, you can often keep a single list and update it in place. Memoized DFS (\`@cache\`) handles grids with no safe fill order.`,
      possibilities: `Unique paths with or without obstacles, minimum-cost route, biggest square of 1s, falling paths and triangles, the longest increasing path in a matrix, stock trading with cooldown or fees, and (next lessons) string DP, knapsack and interval DP.`
    },

    think: [
      {
        q: `A 3 by 3 grid, a robot at the top-left moves only right or down. Fill the number of ways to reach every square before reading on. What do you get in the bottom-right?`,
        a: `The first row and first column are all 1 (one way in). Every other square is above plus left. Row 1: 1, 2, 3. Row 2: 1, 3, 6. So the corner holds 6. The aha: you never walk paths, you only add two neighbours. This is Pascal's triangle rotated, which is why the closed form is a binomial coefficient, C(4, 2) = 6.`
      },
      {
        q: `A 2 by 3 grid has a wall in the middle of the top row, \`[[0, 1, 0], [0, 0, 0]]\`. How many paths reach the bottom-right? What is the count of the top-right square, and why?`,
        a: `The top-right square has 0 paths: the only way to reach it is from the left, and the left square is a wall. So the bottom row gets 1, 1, 1 (each reaches only from the left or the single path above), and the answer is 1: go down first, then right twice. A wall is just a cell with count 0, and zero propagates automatically to squares that depend only on it.`
      },
      {
        q: `In a minimum-cost grid, a blocked cell is stored as 0 instead of infinity. What goes wrong?`,
        a: `A minimum looks for the smallest source, and 0 is the smallest number around, so every neighbour of the wall would prefer to arrive "through" it for free, creating paths that do not exist. Rule: pick the neutral value for the operation. For counting, a wall is 0 (adds nothing). For minimising, a wall is infinity (never chosen). For maximising, it is minus infinity.`
      },
      {
        q: `Counting paths with one rolling list, you run \`row[j] += row[j - 1]\`. At that moment, what are the two numbers being added?`,
        a: `\`row[j]\` has not been overwritten yet, so it still holds the **previous row's** value for column j, which is the square above. \`row[j-1]\` was just overwritten in this row, so it is the square to the left. Their sum is the new count for this square. Left to right order matters: if you looped right to left, \`row[j-1]\` would still be from the row above, which is wrong.`
      },
      {
        q: `Largest square of 1s. For \`[[1,1,1],[1,1,1],[1,1,0]]\`, fill the table where each cell is the side of the biggest square ending there as its bottom-right corner. What is the final answer?`,
        a: `Row 0: 1, 1, 1. Row 1: 1, then 1 + min(1, 1, 1) = 2, then 2. Row 2: 1, then 1 + min(2, 1, 1) = 2, then 0 because the cell is 0. The largest value is 2, so the area is 4. The min of three neighbours is the rule because the three smaller squares (above, left, diagonal) each need to exist for a bigger square to fit, so the weakest one limits growth.`
      },
      {
        q: `You may step to any of the four neighbours, but only to a strictly bigger number. Why is a memoized search safe here, and what breaks if equal numbers are allowed?`,
        a: `Every move strictly increases the value, so you can never return to a cell you have already visited on the same path: there are no cycles, and the longest path starting at a cell depends only on cells with bigger values. One cached number per cell is therefore always correct. If equal values were allowed you could bounce between two equal neighbours forever, the dependency graph has cycles, and the cache can be filled in the wrong order or never finish.`
      }
    ],

    breakdown: [
      {
        title: `1. Why a grid: two numbers describe the position`,
        body: `A robot walks from the top-left to the bottom-right and may only step right or down. How many routes? To know where the robot is, one number is not enough: you need a row and a column, \`(i, j)\`. So the subproblem has two parameters and the table is a grid. Ask the DP question about one square: "how many ways to arrive here?" Every arrival came from the square above or the square to the left, and nowhere else. So the answer for this square is built from exactly two smaller answers. Same trick as stairs, with one more dimension.`
      },
      {
        title: `2. Define the state in words`,
        body: `Write the sentence first: "\`dp[i][j]\` is the number of ways to arrive at row i, column j" (or "the cheapest cost to arrive at (i, j)", or "the side of the largest square whose bottom-right corner is (i, j)"). Note exactly what is included: does the cost include this square's own price? Is the answer the corner, or the best cell anywhere? Answering these in the sentence settles dozens of small bugs. The table has R rows and C columns, so there are R times C states.`
      },
      {
        title: `3. The recurrence: pull from the sources`,
        body: `Counting: the ways to arrive here are the ways to arrive above plus the ways to arrive on the left, \`dp[i][j] = dp[i-1][j] + dp[i][j-1]\`. Cheapest cost: take the better source and pay for this square, \`dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])\`. Largest square: \`1 + min(up, left, diagonal)\` when the square is a 1. The skeleton never changes; only the sources and the combine (sum, min, max) do. Write the arrows from earlier cells into this one before coding.`
      },
      {
        title: `4. Base cases: the first row, the first column, the start`,
        body: `The start has 1 way (or its own cost). The first row can only be reached from the left, and the first column only from above, because the missing neighbour is off the grid. The easy way: treat the missing neighbour as "not allowed", which is 0 for counting and infinity for minimising. Careful in Python: \`dp[i-1][j]\` with i = 0 reads \`dp[-1][j]\`, the **last row**, and gives a wrong answer without an error. Guard with \`if i\` and \`if j\`, or pad the table with an extra row and column.`
      },
      {
        title: `5. Fill a small table by hand`,
        body: `Cheapest path on the grid \`[[1,3,1],[1,5,1],[4,2,1]]\`, paying every square you stand on. Row by row, each cell is its own cost plus the smaller of "above" and "left".

| | col 0 | col 1 | col 2 |
|---|---|---|---|
| row 0 | 1 | 1 + 3 = 4 | 4 + 1 = 5 |
| row 1 | 1 + 1 = 2 | 5 + min(4, 2) = 7 | 1 + min(5, 7) = 6 |
| row 2 | 2 + 4 = 6 | 2 + min(7, 6) = 8 | 1 + min(6, 8) = 7 |

The corner is 7: the route 1, 3, 1, 1, 1 (right, right, down, down). To print the route, walk back from the corner stepping to the smaller of above and left.`
      },
      {
        title: `6. The fill order and why walls are not special`,
        body: `Row by row, left to right works because every source (above, left) is filled before the cell. With a wall, store the neutral value: 0 ways when counting, infinity when minimising, so no route uses it and the same formula keeps working. A wall in the first row zeroes everything to its right in that row, because those squares can only be reached from the left. If a grid allows moves in all four directions, no row order is safe and cells depend on each other in loops: that is BFS or Dijkstra, not DP, unless a rule (like strictly increasing values) removes the loops.`
      },
      {
        title: `7. Optimise space: keep one row`,
        body: `Row i reads only row i-1 and the cell just written to its left. So one list is enough. Before you overwrite \`row[j]\` it still holds the value from above, and \`row[j-1]\` already holds this row's value (the left). For counting paths, start with \`row = [1] * C\` and for each further row do \`row[j] += row[j-1]\` for j from 1: that is the whole algorithm. Memory drops from R times C to C. The cost: you lose the old rows, so you cannot walk back to print the route. For maximal square you also save the old diagonal in a variable before overwriting it.`,
        code: { py: `def unique_paths(m, n):
    row = [1] * n                      # first row: one way to each square
    for _ in range(1, m):
        for j in range(1, n):
            row[j] += row[j - 1]       # old row[j] = above, row[j-1] = left
    return row[-1]` }
      },
      {
        title: `8. Other shapes, cost, and how to spot it`,
        body: `The grid index does not have to be space. In stock-with-cooldown the second index is a **mode** (holding, just sold, resting) and the table is days by 3. In a falling-path problem each cell reads three cells in the row above. In the longest-increasing-path problem the moves are four-way, so you use memoized DFS. Cost is always states times work per state: O(m times n) for grids, O(n) for the three-mode stock problem. Spot it by: a grid with restricted moves, "count the paths", "cheapest route", "largest square", or a second dimension such as a mode or a budget.`
      }
    ],

    drills: [
      {
        title: `Paths with a diagonal shortcut`,
        q: `A robot starts at the top-left of an m by n grid and wants the bottom-right. In one move it may go right, down, or diagonally down-right. Count the distinct move sequences.\n\nExample: m = 2, n = 2 returns \`3\` (right-down, down-right, diagonal). m = 3, n = 3 returns \`13\`.`,
        hint: `Same table as counting right/down paths, but each square now has three sources.`,
        how: `I restate it: count walks from the top-left to the bottom-right when I may step right, down or diagonally. Brute force recurses on all three moves and repeats squares, roughly 3 to the power of the grid size. The observation is the same as the plain grid: any walk to a square arrives from the square above, the square to the left, or the square diagonally above-left, and those three last moves are different, so their counts add without overlap. State: dp[i][j] is the number of walks that arrive at (i, j). Base: the first row and column have one walk each, since they can only be entered from one side (a diagonal step would need a square above and to the left that does not exist). So I fill both with 1 and loop from (1, 1). Trace 3 by 3: row 0 is 1 1 1; row 1 is 1, 1+1+1 = 3, 3+1+1 = 5; row 2 is 1, 1+3+1 = 5, 5+5+3 = 13. The corner is 13, matching the example. Edge cases: a single row or column returns 1; a 1 by 1 grid is 1 (no move needed). Cost: O(m times n) time and space, and a rolling row with a saved diagonal cuts space to O(n).`,
        code: { py: `def diag_paths(m, n):
    dp = [[1] * n for _ in range(m)]
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1] + dp[i - 1][j - 1]
    return dp[m - 1][n - 1]` },
        explain: `Every walk to (i, j) ends with exactly one of three moves, so the count is the sum of the three predecessor counts. The first row and column are 1 because only one kind of last move is possible there. O(m times n) time, O(m times n) space.`,
        check: `assert diag_paths(1, 1) == 1
assert diag_paths(2, 2) == 3
assert diag_paths(3, 3) == 13
assert diag_paths(1, 7) == 1
assert diag_paths(4, 1) == 1
assert diag_paths(3, 4) == 25
def brute(i, j):
    if i == 0 or j == 0: return 1
    return brute(i - 1, j) + brute(i, j - 1) + brute(i - 1, j - 1)
for m in range(1, 7):
    for n in range(1, 7):
        assert diag_paths(m, n) == brute(m - 1, n - 1)`
      },
      {
        title: `Most coins on a route with blocked squares`,
        q: `A grid holds non-negative coin counts, and \`-1\` marks a blocked square. Starting at the top-left, you move only right or down and collect the coins on every square you stand on (including the first and last). Return the most coins you can collect on a route to the bottom-right, or \`-1\` if no route exists.\n\nExample: \`[[1, 2, -1], [3, -1, 4], [1, 5, 6]]\` returns \`16\` (1, 3, 1, 5, 6).`,
        hint: `Maximising, so an unreachable square must be minus infinity, not 0.`,
        how: `I restate it: best-value route on a grid with walls. Brute force enumerates every right/down route and checks walls, exponential. The state is dp[i][j], the most coins collected by a route that ends on (i, j), including its own coins. The last move came from above or from the left, so dp[i][j] = coins[i][j] + max(dp[i-1][j], dp[i][j-1]). The trap is the walls and the edges. If I stored 0 for an unreachable square, a max would use it as a real source and count routes that do not exist (a square next to a wall would look reachable with 0 coins). So unreachable means minus infinity, a value no max ever prefers, and a cell stays minus infinity when both of its sources are minus infinity. The start is its own coins, unless it is blocked, in which case everything stays unreachable and the answer is -1. Trace the example: row 0: 1, 3, wall. Row 1: 1 + 3 = 4 for column 0; column 1 is a wall; column 2 can come from above (wall, so -inf) or left (wall, -inf), so it is unreachable. Row 2: column 0 is 4 + 1 = 5; column 1 is 5 + 5 = 10; column 2 is 6 + max(-inf, 10) = 16. Cost: O(m times n) time, O(m times n) space.`,
        code: { py: `def max_collect(grid):
    R, C = len(grid), len(grid[0])
    NEG = float('-inf')
    dp = [[NEG] * C for _ in range(R)]
    for i in range(R):
        for j in range(C):
            if grid[i][j] == -1:
                continue                         # blocked: stays unreachable
            if i == 0 and j == 0:
                dp[i][j] = grid[i][j]
                continue
            best = max(dp[i - 1][j] if i else NEG, dp[i][j - 1] if j else NEG)
            if best > NEG:
                dp[i][j] = best + grid[i][j]
    return dp[R - 1][C - 1] if dp[R - 1][C - 1] > NEG else -1` },
        explain: `Each reachable square takes the better of its two reachable sources and adds its coins; minus infinity guarantees a max never uses an unreachable source. Every square is computed once: O(m times n) time and space.`,
        check: `assert max_collect([[1, 2, -1], [3, -1, 4], [1, 5, 6]]) == 16
assert max_collect([[5]]) == 5
assert max_collect([[-1]]) == -1
assert max_collect([[0, -1], [-1, 0]]) == -1
assert max_collect([[1, 2, 3]]) == 6
assert max_collect([[1], [-1], [3]]) == -1
import random
def brute(g, i=0, j=0):
    if g[i][j] == -1: return None
    if i == len(g) - 1 and j == len(g[0]) - 1: return g[i][j]
    opts = []
    if i + 1 < len(g): opts.append(brute(g, i + 1, j))
    if j + 1 < len(g[0]): opts.append(brute(g, i, j + 1))
    opts = [o for o in opts if o is not None]
    return g[i][j] + max(opts) if opts else None
for _ in range(300):
    R, C = random.randint(1, 4), random.randint(1, 4)
    g = [[random.choice([-1, 0, 1, 2, 5]) for _ in range(C)] for _ in range(R)]
    b = brute(g)
    assert max_collect(g) == (b if b is not None else -1)`
      },
      {
        title: `Falling path of least cost`,
        q: `You get a square or rectangular grid of costs. Start on any square in the top row. Each move goes to the row below, into the same column or one column to the left or right (never off the grid). Return the smallest total cost of a path from the top row to the bottom row.\n\nExample: \`[[2, 1, 3], [6, 5, 4], [7, 8, 9]]\` returns \`13\` (1, then 4, then 8; or 1, 5, 7).`,
        hint: `dp of a cell reads up to three cells in the row above. Mind the edges (column 0 has no upper-left, the last column has no upper-right).`,
        how: `I restate it: cheapest top-to-bottom route where each step moves down by one row and shifts at most one column. Brute force explores three branches per row, 3 to the power of the number of rows, with repeated squares. The state is dp[r][c], the cheapest cost of a path that ends on (r, c), including its own cost. The last move came from one of up to three squares in the row above: (r-1, c-1), (r-1, c) or (r-1, c+1). So dp[r][c] = cost[r][c] + min of those that exist. Base: row 0 is just its own costs, since a path may start anywhere in the top row. The answer is the minimum of the last row, not a corner, because the path may end anywhere on the bottom. Each row reads only the row above, so I keep a single list for the previous row and build a new one. Careful with the edges: I slice the previous row from max(0, c-1) to c+2, which automatically drops the missing neighbours. Trace the example: row 0 = [2, 1, 3]; row 1 = [6+1, 5+1, 4+1] = [7, 6, 5]; row 2 = [7+6, 8+5, 9+5] = [13, 13, 14]. The minimum is 13. Edge cases: a single row returns its smallest cost; a single column forces a straight line. Cost: O(rows times columns) time, O(columns) space.`,
        code: { py: `def min_falling(grid):
    row = grid[0][:]
    for r in grid[1:]:
        row = [x + min(row[max(0, c - 1):c + 2]) for c, x in enumerate(r)]
    return min(row)` },
        explain: `Row 0 holds the cost of starting there. Each later cell adds its cost to the cheapest reachable cell above (up to three, clipped at the edges), and the answer is the best cell of the last row. One pass over every cell with constant work: O(rows times columns) time, O(columns) space.`,
        check: `assert min_falling([[2, 1, 3], [6, 5, 4], [7, 8, 9]]) == 13
assert min_falling([[5]]) == 5
assert min_falling([[3, 1, 2]]) == 1
assert min_falling([[1], [2], [3]]) == 6
assert min_falling([[1, 100], [100, 1]]) == 2
import random
def brute(g, r, c):
    if r == len(g) - 1: return g[r][c]
    return g[r][c] + min(brute(g, r + 1, c2) for c2 in (c - 1, c, c + 1) if 0 <= c2 < len(g[0]))
for _ in range(300):
    R, C = random.randint(1, 5), random.randint(1, 5)
    g = [[random.randint(-3, 9) for _ in range(C)] for _ in range(R)]
    assert min_falling(g) == min(brute(g, 0, c) for c in range(C))`
      },
      {
        title: `Cheapest route with one free square`,
        q: `A grid holds non-negative costs. You move only right or down from the top-left to the bottom-right, paying the cost of every square you stand on. You may choose **at most one** square on your route to be free (cost 0). Return the cheapest total.\n\nExample: \`[[1, 3, 1], [1, 5, 1], [4, 2, 1]]\` returns \`4\` (route 1, 3, 1, 1, 1 with the 3 made free).`,
        hint: `One number per square is not enough: you also need to know whether the free pass has been used. Keep two grids, or a third dimension of size 2.`,
        how: `I restate it: a normal cheapest-path problem plus one coupon that makes one square free. If I just ran the normal DP and subtracted the largest square on the best route, it would be wrong, because the route that is cheapest without the coupon may not be cheapest with it. Brute force tries every route and every free square, which is far too slow. The new idea: add the coupon to the state. Let a[i][j] be the cheapest cost to arrive at (i, j) with the coupon unused, and b[i][j] the cheapest cost with the coupon already used. The unused table is the ordinary one: a[i][j] = cost + min(a above, a left). For the used table, either I used the coupon earlier, so b[i][j] = cost + min(b above, b left), or I use it right here on this square, so b[i][j] = min(a above, a left) with nothing added. I take the smaller. Base: a[0][0] = cost[0][0], and b[0][0] = 0 (the start itself can be free). Missing neighbours are infinity. The answer is min(a, b) at the corner, which is b because costs are non-negative. Trace the example: the route along the top then down has a = 1, 4, 5, 6, 7, and with the 3 free b = 1, 1, 2, 3, 4. Cost: O(m times n) time and space, twice the plain table.`,
        code: { py: `def min_path_one_free(grid):
    R, C = len(grid), len(grid[0])
    INF = float('inf')
    a = [[INF] * C for _ in range(R)]      # coupon unused
    b = [[INF] * C for _ in range(R)]      # coupon used
    for i in range(R):
        for j in range(C):
            v = grid[i][j]
            if i == 0 and j == 0:
                a[i][j], b[i][j] = v, 0
                continue
            ua = min(a[i - 1][j] if i else INF, a[i][j - 1] if j else INF)
            ub = min(b[i - 1][j] if i else INF, b[i][j - 1] if j else INF)
            a[i][j] = ua + v
            b[i][j] = min(ub + v, ua)       # used earlier, or used on this square
    return min(a[R - 1][C - 1], b[R - 1][C - 1])` },
        explain: `The extra dimension records whether the coupon is spent, so the decision "use it here" is just a move from the unused table into the used table at no cost. Both tables are filled once: O(m times n) time, O(m times n) space.`,
        check: `assert min_path_one_free([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) == 4
assert min_path_one_free([[7]]) == 0
assert min_path_one_free([[1, 2, 3]]) == 3
assert min_path_one_free([[0, 0], [0, 0]]) == 0
assert min_path_one_free([[5, 1], [1, 5]]) == 6
import random
def all_routes(g, i=0, j=0, acc=()):
    acc = acc + (g[i][j],)
    if i == len(g) - 1 and j == len(g[0]) - 1:
        yield acc
        return
    if i + 1 < len(g): yield from all_routes(g, i + 1, j, acc)
    if j + 1 < len(g[0]): yield from all_routes(g, i, j + 1, acc)
for _ in range(200):
    R, C = random.randint(1, 4), random.randint(1, 4)
    g = [[random.randint(0, 9) for _ in range(C)] for _ in range(R)]
    best = min(sum(r) - max(r) for r in all_routes(g))
    assert min_path_one_free(g) == best`
      }
    ],

    how: {
      62: `I restate it: a robot on an m by n grid moves only down or right; count the routes from the top-left to the bottom-right. Brute force recurses, paths(i, j) = paths(i-1, j) + paths(i, j-1), which is right but makes about 2 to the power of (m+n) calls, because the same squares are reached by many routes. The observation is that every route into a square ends with a step down or a step right, so the number of routes to a square is the sum of the counts above and to the left. State: dp[i][j] is the number of routes to (i, j). Base: every square in the first row or column has one route, since the missing neighbour contributes nothing. Trace 3 by 3: row 0 is 1 1 1, row 1 is 1 2 3, row 2 is 1 3 6, so the answer is 6. Each row reads only the previous row, so one list suffices: start with all 1s, and for each further row do row[j] += row[j-1], where the old row[j] is "from above" and row[j-1] is "from the left". That is my stored solution. Edge cases: m = 1 or n = 1 returns 1; 1 by 1 returns 1. I would also mention the closed form C(m+n-2, m-1), choosing which of the moves are downs, as a follow-up. Cost: O(m times n) time, O(n) space.`,
      64: `I restate it: a grid of non-negative costs, move only down or right, pay for every square you stand on including the first and last, minimise the total. Brute force tries every route, O(2 to the power of (m+n)). The key observation: the cheapest way into a square came from the square above or the square to the left, so I only need the cheaper of those two answers plus this square's cost. State: dp[i][j] is the cheapest cost to arrive at (i, j), including its own cost. Base: dp[0][0] is its own cost, the first row can only come from the left, and the first column only from above. Trace [[1,3,1],[1,5,1],[4,2,1]]: row 0 is 1, 4, 5; row 1 is 2, 7, 6; row 2 is 6, 8, 7. The answer is 7. A row only reads the row above, so one list works: row[j] = min(row[j], row[j-1]) + grid[i][j], where row[j] before the update is the square above. That is my stored solution, with special cases for the first row and column. If the interviewer wants the route itself I keep the whole table and walk back from the corner towards the smaller neighbour. Edge cases: a single square, a single row or column. Cost: O(m times n) time, O(n) space. Negative costs still work with only right and down moves, because there are no cycles.`,
      309: `I restate it: daily stock prices, I can buy and sell repeatedly holding at most one share, but after selling I must skip the next day before buying. Maximise the profit. Brute force tries buy, sell or wait on each day, exponential. The difficulty is that the rule for tomorrow depends on what I did today, so one number per day is not enough. I describe where I could be at the end of each day with three states. Hold: I own a share. Sold: I sold today, so tomorrow is a forced rest. Rest: I own nothing and can buy tomorrow. Transitions follow the arrows. Hold comes from holding yesterday or from buying today out of the rest state: hold = max(hold, rest - price). Sold comes from selling what I held: sold = hold + price. Rest comes from resting yesterday or from the cooldown ending after a sale yesterday: rest = max(rest, previous sold). The order of updates matters, because rest needs yesterday's sold, so I save it first. Start hold at minus infinity (you cannot hold before buying), the others at 0. Trace [1, 2, 3, 0, 2]: after the last day sold is 3 and rest is 2, so the answer is max(sold, rest) = 3 (buy 1, sell 2, rest, buy 0, sell 2). Edge cases: one price gives 0; falling prices give 0. Cost: O(n) time, O(1) space.`,
      329: `I restate it: a grid of integers; I may start anywhere and step up, down, left or right, but each step must land on a strictly bigger value. Find the length of the longest such path. Brute force starts a depth-first search from every square and tries every increasing move, and the same suffixes are re-explored from many starts, exponential in the worst case. The observation: because values strictly increase, I can never revisit a square on one path, so there are no cycles. The longest path starting at a square depends only on the squares around it with bigger values, and it does not depend on how I got there. So define f(r, c) as the length of the longest increasing path that starts at (r, c): it is 1 plus the best f of any strictly bigger neighbour, or just 1 if there is none. I cache f per square (0 means not computed yet, since every real answer is at least 1), call the search from every square, and keep the maximum. Each square is solved once and looks at four neighbours. Trace [[9,9,4],[6,6,8],[2,1,1]]: f of the 9s is 1, f of the 8 is 2 (8 then 9), f of the 6 below the 9 is 2, f of the 2 is 3, f of the 1 next to it is 4. The answer is 4. Edge cases: all-equal values give 1; a single row. Cost: O(m times n) time and space, and the recursion depth can reach m times n on a snake-shaped grid, so I would mention a layer-peeling alternative if depth matters.`,
      63: `I restate it: the same count of down/right routes, but some squares are blocked and cannot be stood on. Brute force enumerates every route and rejects those that touch an obstacle, exponential. The only change from the open grid is the blocked square. A route cannot pass through it, so its count is 0, and every other square is still the count above plus the count on the left. State: dp[i][j] is the number of routes to (i, j), with 0 for blocked squares. Base: the start has 1 route, unless it is blocked, which makes the whole answer 0. The subtle part is the first row and column. If a wall sits in the first row, every square to its right in that row has 0 routes, because they can only be entered from the left. So I must not pre-fill the first row with 1s; the formula gives the right zeros by itself. With one list, I seed row[0] = 1 before the first row, then for each square either set row[j] = 0 (blocked) or add the left neighbour with row[j] += row[j-1] when j > 0. The old row[j] stays as the "from above" value automatically. Trace [[0,0,0],[0,1,0],[0,0,0]]: the answer is 2 (around either side of the wall). Edge cases: blocked start or end returns 0; a single square that is free returns 1. Cost: O(m times n) time, O(n) space.`,
      221: `I restate it: a grid of '0' and '1' characters; find the largest square made entirely of 1s and return its area. Brute force tries every top-left corner and every size and checks the square, about O(m times n times min(m,n) squared). The observation: look at a square by its bottom-right corner. If that cell is 1, the biggest square ending there is limited by three smaller squares, the one ending just above, the one ending just to the left, and the one ending diagonally up-left. A larger square needs all three to exist, so the side is 1 plus the smallest of them. State: dp[i][j] is the side of the largest all-1 square whose bottom-right corner is (i, j), and 0 when the cell is '0'. Base: with a padded row and column of zeros, a first-row or first-column 1 gives side 1. The answer is the maximum cell anywhere, squared, since the best square can end anywhere, not just in the corner. Trace [[1,1],[1,1]]: row 0 is 1 1, row 1 is 1 then 1 + min(1,1,1) = 2, so the best side is 2 and the area is 4. For O(n) space I keep one padded row and save the old diagonal in a variable before overwriting it, as in my stored solution. Edge cases: all zeros returns 0; a single '1' returns 1. Cost: O(m times n) time.`
    }
  };
})();
