/* Offer Ready: Graphs lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in
   (Clone Graph needs linked Node objects the tool cannot build, so its py/js run through a small adapter and its
   Java and C++ were compiled by hand). */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'graphs',

    hook: 'A graph is just things and the links between them: people and friendships, rooms and doors, web pages and hyperlinks, cells of a grid and the cells beside them. Interviewers love graphs because the statement rarely says the word. “Count the islands”, “how long until everything rots”, “can these courses all be finished” and “turn this word into that one” are all graph questions in costume, and the fix is always the same two walks, breadth-first and depth-first. Learn to see the graph under the story and a quarter of the hard-looking problems collapse into a short loop.',

    cues: [
      'Items are connected **in pairs**: friends, roads, links, dependencies, “is next to”, “can turn into”.',
      'A **grid** of cells where you move up, down, left and right, count regions, or spread something outward.',
      'You must find the **fewest steps** between two things, or the number of rounds until something has spread everywhere: breadth-first search.',
      'You need to know whether something is **reachable**, how many **separate groups** there are, or which cells belong together: a walk from each unvisited item.',
      'The rules sound like a **loop** can break things (circular dependencies, “is there a cycle”), or like items must split into **two sides** with no conflict inside a side.',
      'You must make a **copy** of a linked structure that points back on itself, so a naive copy would run forever.'
    ],

    intuition: [
      'A **graph** is a set of **nodes** (also called vertices) and **edges**, the links between pairs of nodes. An edge can be **undirected** (a friendship: both ways) or **directed** (a one-way street, “A must come before B”), and it can carry a **weight** such as a distance. Two words you will use all the time: a node’s **neighbours** are the nodes one edge away, and a **path** is a chain of edges from one node to another. A tree is just a graph with no loops where everything is connected.',
      'To write code you must store the graph. The **adjacency list** keeps, for every node, the list of its neighbours: `adj[u]` is everything one step from `u`. It uses space proportional to the number of nodes **V** plus edges **E**, and walking a node’s neighbours costs only their count. The **adjacency matrix** is a V by V table where cell `[u][v]` says whether the edge exists. It answers “is there an edge between u and v?” in O(1), but it always costs V² space and visiting all neighbours of a node costs O(V). Use the list by default; reach for the matrix only for small, dense graphs or when you need constant-time edge lookups. Many problems hand you an **edge list** (a list of pairs): build an adjacency list from it first.',
      'Most problems come down to **walking** the graph: start somewhere and visit what you can reach, never visiting a node twice. The only thing you need is a **visited** set, because without it a loop sends you around forever. There are two walks, and the only difference is which waiting node you pick next. **Breadth-first search (BFS)** keeps the waiting nodes in a **queue** and takes the oldest, so it explores in rings: everything one step away, then everything two steps away. That makes the first time BFS reaches a node a **shortest** route when every edge counts the same. **Depth-first search (DFS)** keeps them on a **stack** (or uses recursion, which is a stack in disguise) and takes the newest, so it dives down one route until it is stuck, then backs up. DFS is the natural tool for “is there any route”, for exploring a whole region, and for anything that needs to know when a node is **finished**.',
      'The visualizer above runs both on a grid you draw. A **grid is a graph** you never have to build: each cell is a node and its up-down-left-right neighbours are its edges, found with four small offsets. Cells that are walls simply are not nodes. Watch the two lines in the template: the frontier (queue or stack) and `prev`, the record of how each cell was first reached. `prev` is the visited set **and** lets you rebuild the path by walking backwards from the end.',
      'Once the two walks are in your hands, the classic questions are small twists. **Connected components**: start a walk from every node not yet visited and count how many walks you needed. **Multi-source BFS**: put **every** source in the queue at the start, and the rings spread outward from all of them at once, so each cell gets its distance to the **nearest** source in one pass. **Cycle detection**: in an undirected graph, meeting an already-visited node that is not the one you just came from means a loop; in a directed graph you need a third state (“on the current path”), because meeting a finished node is harmless but meeting one on the path is a loop. **Bipartite check**: colour nodes with two colours so every edge joins different colours; a conflict means an odd loop. **Clone a graph**: keep a map from each original node to its copy, which doubles as the visited set.'
    ].join('\n\n'),

    viz: 'grid-search',

    template: {
      title: 'Search a grid: the frontier and prev (BFS shown; one word turns it into DFS)',
      note: 'The whole template is a frontier, a `prev` map and a loop. **BFS** takes the oldest waiting cell (`popleft`); change it to `.pop()` (take the newest) and the same code is **DFS**, which finds *a* route but not necessarily a shortest one. Mark a cell **seen when you add it**, not when you take it, or a cell reachable two ways is queued twice. `prev[cell]` is the cell that first reached it, so it is both the visited set and the way back: follow it from the end to the start and reverse. For a bare reachability or counting question you can drop `prev` and keep a plain visited set (or write the mark into the grid itself). A visited check, a bounds check and a wall check are the three tests every grid neighbour must pass. Runs in O(rows × cols) time and space.',
      code: {
        py: `def shortest_path(grid, start, end):
    start, end = tuple(start), tuple(end)       #> Tuples can be dictionary keys; lists cannot
    rows, cols = len(grid), len(grid[0])
    frontier = deque([start])                   #@init > 1. The frontier: cells found but not yet explored (a queue for BFS)
    prev = {start: None}                        #@init > 2. prev is the visited set AND remembers who found each cell
    while frontier:
        r, c = frontier.popleft()               #@take > 3. Take the oldest cell. Use .pop() here and this becomes DFS
        if (r, c) == end:                       #@goal > 4. Reached the end: stop and read the route off prev
            path, cell = [], end                #@path
            while cell is not None:             #@path
                path.append(cell)               #@path
                cell = prev[cell]               #@path
            return path[::-1]                   #@path > Walked backwards, so reverse it
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):   #@push > 5. Look at the four neighbours
            nr, nc = r + dr, c + dc             #@push
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in prev:   #@push > Inside the grid, open, and never seen
                prev[(nr, nc)] = (r, c)         #@push > Mark seen when you ADD it, not when you take it
                frontier.append((nr, nc))       #@push
    return []                                   #@none > 6. The frontier ran dry: there is no route`,
        js: `function shortestPath(grid, start, end) {
  const rows = grid.length, cols = grid[0].length;
  const key = (r, c) => r * cols + c;           //> One number per cell, so a Map can hold it
  const prev = new Map([[key(start[0], start[1]), null]]);   //@init > 2. prev is the visited set AND remembers who found each cell
  const frontier = [start];                     //@init > 1. The frontier: cells found but not yet explored
  let head = 0;                                 // JS has no built-in queue: an array plus a head index
  while (head < frontier.length) {
    const [r, c] = frontier[head++];            //@take > 3. Take the oldest cell. Use frontier.pop() here and this becomes DFS
    if (r === end[0] && c === end[1]) {         //@goal > 4. Reached the end: stop and read the route off prev
      const path = [];                          //@path
      for (let k = key(r, c); k !== null; k = prev.get(k)) path.push([Math.floor(k / cols), k % cols]);   //@path
      return path.reverse();                    //@path > Walked backwards, so reverse it
    }
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {   //@push > 5. Look at the four neighbours
      const nr = r + dr, nc = c + dc;           //@push
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0 && !prev.has(key(nr, nc))) {   //@push > Inside the grid, open, and never seen
        prev.set(key(nr, nc), key(r, c));       //@push > Mark seen when you ADD it, not when you take it
        frontier.push([nr, nc]);                //@push
      }
    }
  }
  return [];                                    //@none > 6. The frontier ran dry: there is no route
}`,
        java: `class Solution {
    public List<int[]> shortestPath(int[][] grid, int[] start, int[] end) {
        int rows = grid.length, cols = grid[0].length;
        int[] prev = new int[rows * cols];      //> One number per cell: r * cols + c
        Arrays.fill(prev, -2);                  //@init > 2. -2 means never seen, -1 means this is the start
        Deque<int[]> frontier = new ArrayDeque<>();   //@init > 1. The frontier: cells found but not yet explored
        frontier.offer(start);                  //@init
        prev[start[0] * cols + start[1]] = -1;  //@init
        int[][] dirs = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
        while (!frontier.isEmpty()) {
            int[] cur = frontier.poll();        //@take > 3. Take the oldest cell. Use pollLast() here and this becomes DFS
            int r = cur[0], c = cur[1];
            if (r == end[0] && c == end[1]) {   //@goal > 4. Reached the end: stop and read the route off prev
                LinkedList<int[]> path = new LinkedList<>();   //@path
                for (int k = r * cols + c; k != -1; k = prev[k]) path.addFirst(new int[]{k / cols, k % cols});   //@path > addFirst reverses as we go
                return path;                    //@path
            }
            for (int[] d : dirs) {              //@push > 5. Look at the four neighbours
                int nr = r + d[0], nc = c + d[1];   //@push
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 0 && prev[nr * cols + nc] == -2) {   //@push > Inside the grid, open, and never seen
                    prev[nr * cols + nc] = r * cols + c;   //@push > Mark seen when you ADD it, not when you take it
                    frontier.offer(new int[]{nr, nc});     //@push
                }
            }
        }
        return new ArrayList<>();               //@none > 6. The frontier ran dry: there is no route
    }
}`,
        cpp: `class Solution {
public:
    vector<vector<int>> shortestPath(vector<vector<int>>& grid, vector<int>& start, vector<int>& end) {
        int rows = grid.size(), cols = grid[0].size();
        int s = start[0] * cols + start[1], e = end[0] * cols + end[1];   //> One number per cell: r * cols + c
        vector<int> prev(rows * cols, -2);      //@init > 2. -2 means never seen, -1 means this is the start
        queue<int> frontier;                    //@init > 1. The frontier: cells found but not yet explored
        frontier.push(s);                       //@init
        prev[s] = -1;                           //@init
        int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
        while (!frontier.empty()) {
            int cur = frontier.front(); frontier.pop();   //@take > 3. Take the oldest cell. A std::stack here makes it DFS
            if (cur == e) {                     //@goal > 4. Reached the end: stop and read the route off prev
                vector<vector<int>> path;       //@path
                for (int k = e; k != -1; k = prev[k]) path.push_back({k / cols, k % cols});   //@path
                reverse(path.begin(), path.end());   //@path > Walked backwards, so reverse it
                return path;                    //@path
            }
            int r = cur / cols, c = cur % cols;
            for (int d = 0; d < 4; d++) {       //@push > 5. Look at the four neighbours
                int nr = r + dr[d], nc = c + dc[d];   //@push
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 0 && prev[nr * cols + nc] == -2) {   //@push > Inside the grid, open, and never seen
                    prev[nr * cols + nc] = cur; //@push > Mark seen when you ADD it, not when you take it
                    frontier.push(nr * cols + nc);   //@push
                }
            }
        }
        return {};                              //@none > 6. The frontier ran dry: there is no route
    }
};`
      },
      tests: { fn: { py: 'shortest_path', default: 'shortestPath' }, sig: { args: ['int[][]', 'int[]', 'int[]'] }, cases: [
        { args: [[[0, 0, 0], [1, 1, 0], [0, 0, 0]], [0, 0], [2, 0]], out: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]] },
        { args: [[[0]], [0, 0], [0, 0]], out: [[0, 0]] },
        { args: [[[0, 1, 0]], [0, 0], [0, 2]], out: [] },
        { args: [[[0, 0, 0, 0]], [0, 0], [0, 3]], out: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        { args: [[[0, 1, 0, 0], [0, 1, 0, 1], [0, 0, 0, 1]], [0, 0], [0, 3]], out: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3]] }] }
    },

    complexity: {
      time: 'O(V + E); on a grid, O(rows × cols)',
      space: 'O(V)',
      why: 'Each node enters the frontier once (the visited mark guarantees it) and leaves once. When a node is taken you look at each of its edges once, so the total edge work over the whole search is the sum of all degrees, which is E (2E for undirected edges, same order). Add the two and you get V + E. On a grid every cell has at most four neighbours, so E is at most 4 × V and the cost is simply O(rows × cols). The frontier plus the visited record is at most V items. Recursive DFS also uses the call stack, which can be as deep as V.',
      trap: 'Three traps. First, with an **adjacency matrix** you pay O(V) per node just to find its neighbours, so a full search is O(V²), not O(V + E). Second, forgetting the visited set does not just waste time: on a graph with a loop (every undirected edge is one, going back and forth) the search never ends. Third, **recursive DFS on a big grid** can overflow the call stack long before it runs out of time: a 1000 by 1000 grid of land is a million-deep recursion. Use an explicit stack or BFS when the grid can be large.'
    },

    variations: [
      {
        name: 'Building the graph: edge list to adjacency list',
        body: 'Most problems give you the edges as pairs. Build an adjacency list first: one empty list per node, then for every pair `[a, b]` add `b` to `a`’s list, and also `a` to `b`’s list if the edge is **undirected**. For a **directed** edge only the first append happens. A node with no edges still needs its own empty list, which is why you create all V lists up front rather than on demand. An **adjacency matrix** is the same information as a V by V grid: `matrix[a][b] = 1` (and `matrix[b][a] = 1` if undirected). The list costs O(V + E) space and lets you loop over only the real neighbours; the matrix costs O(V²) but tells you in O(1) whether one specific edge exists. Weighted edges store `(neighbour, weight)` pairs in the list. When the nodes are named by strings, or are not numbered from 0, use a dictionary of lists instead of a list of lists.',
        code: {
          py: `def build_adj(n, edges, directed=False):
    adj = [[] for _ in range(n)]            #> One list per node, even for nodes with no edges
    for a, b in edges:
        adj[a].append(b)
        if not directed:
            adj[b].append(a)                #> Undirected: the edge goes both ways
    return adj`,
          js: `function buildAdj(n, edges, directed = false) {
  const adj = Array.from({ length: n }, () => []);   //> One list per node, even for nodes with no edges
  for (const [a, b] of edges) {
    adj[a].push(b);
    if (!directed) adj[b].push(a);                   //> Undirected: the edge goes both ways
  }
  return adj;
}`
        },
        tests: { fn: { py: 'build_adj', default: 'buildAdj' }, cases: [
          { args: [4, [[0, 1], [1, 2], [2, 3]], false], out: [[1], [0, 2], [1, 3], [2]] },
          { args: [4, [[0, 1], [1, 2], [2, 3]], true], out: [[1], [2], [3], []] },
          { args: [3, [], false], out: [[], [], []] },
          { args: [3, [[0, 1], [0, 2], [1, 2]], false], out: [[1, 2], [0, 2], [0, 1]] }] }
      },
      {
        name: 'DFS, recursive',
        body: 'Depth-first search is the shorter code: visit a node, and for each unvisited neighbour, recurse. Mark the node **before** you recurse into its neighbours so a loop cannot bring you back to it. The order you visit nodes in (a **preorder**) is the order the calls start. Recursion is a stack in disguise: the call stack holds the route from the start to where you are now, which is also why DFS is the right tool for anything about the current route (cycle checks, “am I back on my own path”). The cost is O(V + E) time and up to O(V) stack depth, so for big inputs use the iterative form below.',
        code: {
          py: `def dfs_order(adj, start):
    seen, order = {start}, []
    def visit(u):
        order.append(u)                     #> Preorder: record the node as we arrive
        for v in adj[u]:
            if v not in seen:
                seen.add(v)                 #> Mark before recursing, so a loop cannot return here
                visit(v)
    visit(start)
    return order`,
          js: `function dfsOrder(adj, start) {
  const seen = new Set([start]), order = [];
  function visit(u) {
    order.push(u);                          //> Preorder: record the node as we arrive
    for (const v of adj[u]) {
      if (!seen.has(v)) {
        seen.add(v);                        //> Mark before recursing, so a loop cannot return here
        visit(v);
      }
    }
  }
  visit(start);
  return order;
}`
        },
        tests: { fn: { py: 'dfs_order', default: 'dfsOrder' }, cases: [
          { args: [[[1, 2], [2, 3], [], []], 0], out: [0, 1, 2, 3] },
          { args: [[[1], [2], [0]], 0], out: [0, 1, 2] },
          { args: [[[]], 0], out: [0] },
          { args: [[[1, 2], [3], [3], []], 0], out: [0, 1, 3, 2] },
          { args: [[[1], [0], [3], [2]], 0], out: [0, 1] }] }
      },
      {
        name: 'DFS, iterative with a stack',
        body: 'Swap the call stack for your own list and you cannot overflow it. Push the start; repeatedly pop a node, skip it if it was already visited, otherwise visit it and push its neighbours. Here the visited mark goes on **when you pop**, which reproduces the recursive order exactly (push the neighbours reversed so the first neighbour is popped first). Marking on **push** instead, as the grid template does, is perfectly fine for “is it reachable” and “how many cells”, but it can visit nodes in a different order than recursion and builds a different spanning tree, so do not use it when the exact DFS order or tree matters. Note the difference from BFS, where marking on push is the rule.',
        code: {
          py: `def dfs_order_iter(adj, start):
    seen, order, stack = set(), [], [start]
    while stack:
        u = stack.pop()
        if u in seen:
            continue                        #> It may have been pushed twice: skip the repeat
        seen.add(u)                         #> Mark on POP here, to match recursive order
        order.append(u)
        for v in reversed(adj[u]):          #> Reversed, so the first neighbour is popped first
            if v not in seen:
                stack.append(v)
    return order`,
          js: `function dfsOrderIter(adj, start) {
  const seen = new Set(), order = [], stack = [start];
  while (stack.length) {
    const u = stack.pop();
    if (seen.has(u)) continue;              //> It may have been pushed twice: skip the repeat
    seen.add(u);                            //> Mark on POP here, to match recursive order
    order.push(u);
    for (let i = adj[u].length - 1; i >= 0; i--) {   //> Reversed, so the first neighbour is popped first
      if (!seen.has(adj[u][i])) stack.push(adj[u][i]);
    }
  }
  return order;
}`
        },
        tests: { fn: { py: 'dfs_order_iter', default: 'dfsOrderIter' }, cases: [
          { args: [[[1, 2], [2, 3], [], []], 0], out: [0, 1, 2, 3] },
          { args: [[[1], [2], [0]], 0], out: [0, 1, 2] },
          { args: [[[]], 0], out: [0] },
          { args: [[[1, 2], [3], [3], []], 0], out: [0, 1, 3, 2] },
          { args: [[[1], [0], [3], [2]], 0], out: [0, 1] }] }
      },
      {
        name: 'BFS or DFS: which one to reach for',
        body: '- **Fewest steps** between two nodes when every edge counts the same, or **how many rounds** something takes to spread: **BFS**. Its rings are exactly distances.\n- **Does a route exist**, **count regions**, **flood a region**, **mark everything reachable**: either works. DFS is a few lines shorter recursively; BFS never overflows the stack.\n- **Cycle checks, finishing order, anything about the current route** (directed cycles, topological order, backtracking): **DFS**, because the stack holds the route.\n- **Edges with different costs**: neither. BFS counts edges, not cost; you want Dijkstra, a BFS that takes the cheapest waiting node from a heap (see [Shortest paths](#/topic/shortest-paths)).\n- Both cost O(V + E). Pick on what the question asks, not on speed.'
      },
      {
        name: 'Grids as graphs',
        body: 'You never build the graph for a grid: a cell `(r, c)` is a node, and its neighbours are `(r±1, c)` and `(r, c±1)`. Keep the four moves in a small list, `((1, 0), (-1, 0), (0, 1), (0, -1))`, and run every candidate through the same three checks: **inside the grid**, **not a wall**, **not seen**. Check the bounds first, so you never index off the edge. Some problems allow the eight surrounding cells (add the diagonals), or knight moves, or wrap-around; only the move list changes. To save the visited set, you may **write the mark into the grid** (turn land into water as you visit it), which is fine when the problem lets you change the input and you do not need it afterwards. Say so out loud, because a careful interviewer will ask. Count rows and columns carefully: `grid[r][c]` has `r` as the row, up to `len(grid)`, and `c` as the column, up to `len(grid[0])`.'
      },
      {
        name: 'Multi-source BFS: start from every source at once',
        body: 'When many things spread at the same pace (every rotten orange, every gate, every fire), do not run one BFS per source. Put **all** sources in the queue at distance 0 before the loop starts. The rings then grow from every source together, and the first time a cell is reached is by its **nearest** source. The cost is one search, O(rows × cols), instead of one per source. Worked below: Rotting Oranges (994), where each ring is one minute. The same code answers “distance from every cell to the nearest 1”.',
        code: {
          py: `def distance_to_nearest_one(grid):
    rows, cols = len(grid), len(grid[0])
    dist = [[-1] * cols for _ in range(rows)]       #> -1 means not reached yet
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                dist[r][c] = 0
                queue.append((r, c))                #> Seed the queue with EVERY source at distance 0
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist`,
          js: `function distanceToNearestOne(grid) {
  const rows = grid.length, cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1));   //> -1 means not reached yet
  const queue = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        dist[r][c] = 0;
        queue.push([r, c]);                         //> Seed the queue with EVERY source at distance 0
      }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}`
        },
        tests: { fn: { py: 'distance_to_nearest_one', default: 'distanceToNearestOne' }, cases: [
          { args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], out: [[2, 1, 2], [1, 0, 1], [2, 1, 2]] },
          { args: [[[1, 0, 0, 1]]], out: [[0, 1, 1, 0]] },
          { args: [[[0, 0]]], out: [[-1, -1]] },
          { args: [[[1]]], out: [[0]] }] }
      },
      {
        name: 'Connected components: one walk per unvisited node',
        body: 'A **connected component** is a group of nodes that can all reach each other. To count them, loop over every node; each time you meet one that is **not yet visited**, you have found a new component, so add one and walk (BFS or DFS) to mark everything in it. The outer loop is what makes this work on a disconnected graph: a single walk only ever sees one piece. The total is O(V + E), because every node and edge is touched by exactly one walk. “Number of islands” is this, with grid cells as nodes. If you also need the **size** of each component, count nodes inside the walk. (Union-Find answers the same question for edges that arrive one at a time; see [Union-Find](#/topic/union-find).)',
        code: {
          py: `def count_components(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen, count = [False] * n, 0
    for s in range(n):
        if seen[s]:
            continue
        count += 1                          #> A node nobody has reached yet: a brand-new component
        seen[s] = True
        queue = deque([s])
        while queue:                        #> Walk the whole component so none of it is counted again
            u = queue.popleft()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    queue.append(v)
    return count`,
          js: `function countComponents(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Array(n).fill(false);
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    count++;                                //> A node nobody has reached yet: a brand-new component
    seen[s] = true;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {   //> Walk the whole component so none of it is counted again
      for (const v of adj[queue[head]]) {
        if (!seen[v]) { seen[v] = true; queue.push(v); }
      }
    }
  }
  return count;
}`
        },
        tests: { fn: { py: 'count_components', default: 'countComponents' }, cases: [
          { args: [5, [[0, 1], [1, 2], [3, 4]]], out: 2 }, { args: [4, []], out: 4 }, { args: [1, []], out: 1 },
          { args: [3, [[0, 1], [1, 2], [2, 0]]], out: 1 }, { args: [0, []], out: 0 }] }
      },
      {
        name: 'Cycle detection in an undirected graph',
        body: 'In an undirected graph, every edge can be walked both ways, so the edge you just came along always leads back to a visited node. That does **not** mean a loop. The rule: while walking, remember each node’s **parent** (where you came from). If a neighbour is already visited and is **not** your parent, you reached it by a second route, so there is a cycle. Check every component, since a loop may hide in a piece you did not start from. (Equivalent facts: a connected undirected graph with V nodes and exactly V − 1 edges is a tree, and any component with at least as many edges as nodes has a cycle.) This version assumes no repeated edges between the same pair.',
        code: {
          py: `def has_cycle_undirected(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen = [False] * n
    for s in range(n):
        if seen[s]:
            continue
        seen[s] = True
        stack = [(s, -1)]                   #> Each entry is (node, the node we came from)
        while stack:
            u, parent = stack.pop()
            for v in adj[u]:
                if v == parent:
                    continue                #> The edge we just used is not a cycle
                if seen[v]:
                    return True             #> Seen by another route: a loop
                seen[v] = True
                stack.append((v, u))
    return False`,
          js: `function hasCycleUndirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Array(n).fill(false);
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const stack = [[s, -1]];                //> Each entry is [node, the node we came from]
    while (stack.length) {
      const [u, parent] = stack.pop();
      for (const v of adj[u]) {
        if (v === parent) continue;         //> The edge we just used is not a cycle
        if (seen[v]) return true;           //> Seen by another route: a loop
        seen[v] = true;
        stack.push([v, u]);
      }
    }
  }
  return false;
}`
        },
        tests: { fn: { py: 'has_cycle_undirected', default: 'hasCycleUndirected' }, cases: [
          { args: [3, [[0, 1], [1, 2], [2, 0]]], out: true }, { args: [4, [[0, 1], [1, 2], [2, 3]]], out: false },
          { args: [4, [[0, 1], [2, 3]]], out: false }, { args: [5, [[0, 1], [2, 3], [3, 4], [4, 2]]], out: true },
          { args: [1, []], out: false }, { args: [2, [[0, 1]]], out: false }] }
      },
      {
        name: 'Cycle detection in a directed graph: three states',
        body: 'In a directed graph, “seen before” is not enough: two different routes can reach the same node without any loop (a diamond), so meeting a visited node proves nothing. What proves a cycle is meeting a node that is **on the route you are currently walking**. Keep three states per node: **0** never seen, **1** on the current DFS path, **2** finished (all its routes explored, no cycle found through it). Going from a node to a neighbour in state 1 is a back edge, so there is a cycle; a neighbour in state 2 is fine, because everything beyond it was already cleared. Set the node to 1 on the way in and 2 on the way out. This is exactly the check behind “can all these courses be finished” (see [Topological sort](#/topic/topo-sort)).',
        code: {
          py: `def has_cycle_directed(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)                    #> Directed: one way only
    state = [0] * n                         #> 0 new, 1 on the current path, 2 finished
    def visit(u):
        state[u] = 1                        #> Enter: u is on the path
        for v in adj[u]:
            if state[v] == 1:
                return True                 #> Back to a node still on the path: a cycle
            if state[v] == 0 and visit(v):
                return True
        state[u] = 2                        #> Leave: everything reachable from u is cleared
        return False
    return any(state[s] == 0 and visit(s) for s in range(n))`,
          js: `function hasCycleDirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) adj[a].push(b);        //> Directed: one way only
  const state = new Array(n).fill(0);                //> 0 new, 1 on the current path, 2 finished
  function visit(u) {
    state[u] = 1;                                    //> Enter: u is on the path
    for (const v of adj[u]) {
      if (state[v] === 1) return true;               //> Back to a node still on the path: a cycle
      if (state[v] === 0 && visit(v)) return true;
    }
    state[u] = 2;                                    //> Leave: everything reachable from u is cleared
    return false;
  }
  for (let s = 0; s < n; s++) if (state[s] === 0 && visit(s)) return true;
  return false;
}`
        },
        tests: { fn: { py: 'has_cycle_directed', default: 'hasCycleDirected' }, cases: [
          { args: [2, [[0, 1], [1, 0]]], out: true }, { args: [3, [[0, 1], [1, 2], [0, 2]]], out: false },
          { args: [1, [[0, 0]]], out: true }, { args: [4, [[0, 1], [2, 3]]], out: false },
          { args: [4, [[0, 1], [1, 2], [2, 3], [3, 1]]], out: true }, { args: [3, []], out: false },
          { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], out: false }] }
      },
      {
        name: 'Bipartite check: two-colour the graph',
        body: 'A graph is **bipartite** if its nodes can be split into two groups with every edge going **between** the groups, never inside one. Try to colour it: give the start colour 0; every neighbour must get the opposite colour; if you ever find a neighbour that already has **your** colour, no valid split exists. This works with BFS or DFS. The theory behind it: a graph is bipartite exactly when it has **no cycle of odd length** (a triangle is the smallest failure; a square is fine). Start a walk from every uncoloured node, because the graph may be in pieces and each piece is checked on its own. Time O(V + E).',
        code: {
          py: `def two_colorable(adj):
    color = [-1] * len(adj)                 #> -1 = not coloured yet
    for s in range(len(adj)):
        if color[s] != -1:
            continue
        color[s] = 0
        queue = deque([s])
        while queue:
            u = queue.popleft()
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u] #> A neighbour takes the other colour
                    queue.append(v)
                elif color[v] == color[u]:
                    return False            #> Same colour on both ends of an edge: an odd cycle
    return True`,
          js: `function twoColorable(adj) {
  const color = new Array(adj.length).fill(-1);      //> -1 = not coloured yet
  for (let s = 0; s < adj.length; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];                   //> A neighbour takes the other colour
          queue.push(v);
        } else if (color[v] === color[u]) {
          return false;                              //> Same colour on both ends of an edge: an odd cycle
        }
      }
    }
  }
  return true;
}`
        },
        tests: { fn: { py: 'two_colorable', default: 'twoColorable' }, cases: [
          { args: [[[1, 3], [0, 2], [1, 3], [0, 2]]], out: true }, { args: [[[1, 2], [0, 2], [0, 1]]], out: false },
          { args: [[[1], [0]]], out: true }, { args: [[[]]], out: true },
          { args: [[[1], [0], [3, 4], [2, 4], [2, 3]]], out: false }, { args: [[[], [2], [1, 3], [2, 4], [3]]], out: true }] }
      }
    ],

    worked: [
      {
        lc: 200,
        restate: 'A grid of `"1"` (land) and `"0"` (water) is given. Count the islands, where an island is a group of land cells joined **up, down, left or right** (a diagonal touch does not join them).',
        examples: '- A grid with two separate land patches → `2`.\n- Land at the four corners and the middle of a 3 by 3 grid → `5`: diagonal neighbours are different islands.\n- Edge cases: all water → `0`; one land cell → `1`; a single row.',
        brute: 'For each land cell, search the whole grid to find which already-known island it touches, and merge the islands. It works but is slow and fiddly: it re-scans the grid for every land cell.',
        insight: 'This is **counting connected components** with the grid as the graph. Scan the grid cell by cell. The first time you meet a land cell you have found a new island: add one, then **flood** outward from that cell (BFS or DFS) and mark every land cell you reach so it can never start another count. The marking trick that saves a visited set is to turn each visited land cell into water as you go, since the problem lets you change the grid. Every cell is flooded once and scanned once.',
        code: {
          py: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        rows, cols = len(grid), len(grid[0])
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != '1':
                    continue
                count += 1                       # unvisited land: a new island
                grid[r][c] = '0'                 # sink it so it is not found again
                queue = deque([(r, c)])
                while queue:                     # flood the rest of the island
                    x, y = queue.popleft()
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == '1':
                            grid[nx][ny] = '0'
                            queue.append((nx, ny))
        return count`,
          js: `function numIslands(grid) {
  const rows = grid.length, cols = grid[0].length;
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '1') continue;
      count++;                                   // unvisited land: a new island
      grid[r][c] = '0';                          // sink it so it is not found again
      const queue = [[r, c]];
      for (let head = 0; head < queue.length; head++) {   // flood the rest of the island
        const [x, y] = queue[head];
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] === '1') {
            grid[nx][ny] = '0';
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  return count;
}`,
          java: `class Solution {
    public int numIslands(char[][] grid) {
        int rows = grid.length, cols = grid[0].length, count = 0;
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1') continue;
                count++;                         // unvisited land: a new island
                grid[r][c] = '0';                // sink it so it is not found again
                Deque<int[]> queue = new ArrayDeque<>();
                queue.offer(new int[]{r, c});
                while (!queue.isEmpty()) {       // flood the rest of the island
                    int[] cell = queue.poll();
                    for (int d = 0; d < 4; d++) {
                        int nr = cell[0] + dr[d], nc = cell[1] + dc[d];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == '1') {
                            grid[nr][nc] = '0';
                            queue.offer(new int[]{nr, nc});
                        }
                    }
                }
            }
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), count = 0;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1') continue;
                count++;                         // unvisited land: a new island
                grid[r][c] = '0';                // sink it so it is not found again
                queue<pair<int, int>> q;
                q.push({r, c});
                while (!q.empty()) {             // flood the rest of the island
                    auto [x, y] = q.front();
                    q.pop();
                    for (int d = 0; d < 4; d++) {
                        int nr = x + dr[d], nc = y + dc[d];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == '1') {
                            grid[nr][nc] = '0';
                            q.push({nr, nc});
                        }
                    }
                }
            }
        }
        return count;
    }
};`
        },
        complexity: 'O(rows × cols) time: the scan visits each cell once, and the floods together visit each land cell once. O(min(rows, cols)) extra space for the BFS frontier of a grid-shaped island (up to O(rows × cols) in the worst case); no visited set, because the grid itself is the mark.',
        say: '“Islands are connected components of land cells, so I scan the grid and every time I hit land I haven’t seen, I count one and flood the whole island so it can’t be counted again. I flood with BFS and mark by turning land into water, which saves a visited set, assuming I may modify the input; if not, I’d use a seen set. Each cell is scanned once and flooded at most once, so it’s O(rows × cols).”',
        followups: [
          { q: 'What if you must not modify the grid?', a: 'Keep a separate `seen` boolean grid or a set of coordinates, and mark a cell there when you add it to the queue. Same complexity, O(rows × cols) extra space.' },
          { q: 'Would recursive DFS be fine?', a: 'On a small grid, yes, and it is shorter. On a large grid, one big island makes the recursion as deep as the island is large and Python or the JVM overflow. Use the queue, or an explicit stack.' },
          { q: 'What if the land cells arrive one at a time and you must report the count after each?', a: 'Re-scanning is too slow. Use Union-Find: each new land cell starts as its own island and merges with land neighbours, decrementing the count per successful merge.' },
          { q: 'How would diagonals count as connected?', a: 'Add the four diagonal offsets to the move list. Nothing else changes.' }
        ]
      },
      {
        lc: 994,
        restate: 'A grid of cells holds `0` (empty), `1` (a fresh orange) and `2` (a rotten orange). Every minute, each fresh orange that touches (up, down, left, right) a rotten one becomes rotten. Return the number of minutes until no fresh orange is left, or `-1` if some fresh orange can never rot.',
        examples: '- Rotten at two opposite corners of a 3 by 3 grid with fresh oranges between → `2`.\n- A fresh orange walled off by empty cells → `-1`.\n- Edge cases: no fresh oranges at all → `0` (even with no rotten ones); only fresh oranges and no rotten one → `-1`.',
        brute: 'Simulate minute by minute: scan the whole grid, rot every fresh orange next to a rotten one (carefully, using a copy so one minute does not chain), and repeat until nothing changes. That rescans the grid once per minute, up to O(rows × cols) times.',
        insight: 'The spread starts from **many sources at once**, one ring per minute: that is a **multi-source BFS**. Put **every** rotten orange in the queue first, and count how many fresh ones there are. Then process the queue **a ring at a time** (freeze `len(queue)`), and each ring that rots at least one orange costs one minute. Decrement the fresh count as oranges rot. When the queue is empty, any fresh orange left was unreachable.',
        code: {
          py: `class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        queue, fresh = deque(), 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append((r, c))         # every source goes in before we start
                elif grid[r][c] == 1:
                    fresh += 1
        minutes = 0
        while queue and fresh:
            minutes += 1                         # one full ring = one minute
            for _ in range(len(queue)):
                x, y = queue.popleft()
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 1:
                        grid[nx][ny] = 2
                        fresh -= 1
                        queue.append((nx, ny))
        return -1 if fresh else minutes`,
          js: `function orangesRotting(grid) {
  const rows = grid.length, cols = grid[0].length;
  const queue = [];
  let fresh = 0, head = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);  // every source goes in before we start
      else if (grid[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  while (head < queue.length && fresh > 0) {
    minutes++;                                   // one full ring = one minute
    const end = queue.length;
    while (head < end) {
      const [x, y] = queue[head++];
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] === 1) {
          grid[nx][ny] = 2;
          fresh--;
          queue.push([nx, ny]);
        }
      }
    }
  }
  return fresh > 0 ? -1 : minutes;
}`,
          java: `class Solution {
    public int orangesRotting(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, fresh = 0;
        Deque<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) queue.offer(new int[]{r, c});   // every source goes in before we start
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        int minutes = 0;
        while (!queue.isEmpty() && fresh > 0) {
            minutes++;                           // one full ring = one minute
            for (int n = queue.size(); n > 0; n--) {
                int[] cell = queue.poll();
                for (int d = 0; d < 4; d++) {
                    int nr = cell[0] + dr[d], nc = cell[1] + dc[d];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        fresh--;
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
        }
        return fresh > 0 ? -1 : minutes;
    }
}`,
          cpp: `class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), fresh = 0;
        queue<pair<int, int>> q;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.push({r, c});   // every source goes in before we start
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        int minutes = 0;
        while (!q.empty() && fresh > 0) {
            minutes++;                           // one full ring = one minute
            for (int n = q.size(); n > 0; n--) {
                auto [x, y] = q.front();
                q.pop();
                for (int d = 0; d < 4; d++) {
                    int nr = x + dr[d], nc = y + dc[d];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        fresh--;
                        q.push({nr, nc});
                    }
                }
            }
        }
        return fresh > 0 ? -1 : minutes;
    }
};`
        },
        complexity: 'O(rows × cols) time and space: each cell is enqueued at most once, and the initial scan reads each cell once.',
        say: '“The rot spreads from every rotten orange at the same pace, so it is a multi-source BFS: I enqueue all rotten oranges first and count the fresh ones. Then I process the queue ring by ring, freezing the queue size at the start of each ring, and each ring that rots something is one minute. I decrement the fresh count as oranges turn. If any fresh orange remains when the queue empties, I return −1. It’s O(rows × cols).”',
        followups: [
          { q: 'Why `while queue and fresh` rather than just `while queue`?', a: 'Without the `fresh` test, the last ring of rotten oranges is still in the queue and the loop runs one more time, adding a minute that rots nothing. Stopping when no fresh orange remains avoids the off-by-one.' },
          { q: 'Could you store the minute on each queue entry instead of ring-counting?', a: 'Yes: enqueue `(r, c, minute)` and track the largest minute seen. Same cost; ring counting avoids storing it.' },
          { q: 'What if different oranges rot at different speeds?', a: 'Then rings are no longer minutes and a plain queue is wrong. You would take the earliest-finishing orange from a heap, which is Dijkstra.' },
          { q: 'How is this related to “distance to the nearest gate” (286)?', a: 'It is the same algorithm: sources are the gates, walls block, and instead of counting rings you write the distance into each cell as you reach it.' }
        ]
      },
      {
        lc: 133,
        restate: 'You get one node of a connected, undirected graph. Each node has a value and a list of its neighbours. Build a **deep copy** of the whole graph (all new node objects, wired up the same way) and return the copy of the node you were given.',
        examples: '- A square of four nodes, each joined to the two beside it → a new square with the same values and links, no node shared with the original.\n- A single node with no neighbours → a single new node.\n- Edge cases: no node at all (`null`) → `null`; a graph where nodes point back at each other, so the copy must not loop forever.',
        brute: 'Copy a node, then recursively copy each neighbour. This never stops on a graph with a loop (every undirected edge is one): node A copies B, B copies A, A copies B again. Even if it stopped, A and B could be copied several times, leaving duplicate nodes.',
        insight: 'Keep a **map from each original node to its copy**. It does two jobs at once: it is the **visited set** (if a node is in the map, it has a copy already), and it lets you **find the copy** when you need to wire a link to a node you copied earlier. Walk the original graph with BFS. For each node taken from the queue, for each neighbour: if the neighbour has no copy yet, create one and queue it; then add the neighbour’s copy to the current node’s copy’s neighbour list. Creating the copy when you first see a node, and wiring after, makes the order of discovery irrelevant.',
        code: {
          py: `class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

class Solution:
    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:
        if not node:
            return None
        copy = {node: Node(node.val)}            # original -> its copy; also the visited set
        queue = deque([node])
        while queue:
            cur = queue.popleft()
            for nb in cur.neighbors:
                if nb not in copy:
                    copy[nb] = Node(nb.val)      # first time we see nb: make its copy
                    queue.append(nb)
                copy[cur].neighbors.append(copy[nb])   # wire the copies, new or old
        return copy[node]

def clone_adj(adj):   # test adapter, not part of the answer: adjacency list in, the copy's adjacency list out
    nodes = [Node(i + 1) for i in range(len(adj))]
    for i, nb in enumerate(adj):
        nodes[i].neighbors = [nodes[j - 1] for j in nb]
    clone = Solution().cloneGraph(nodes[0] if nodes else None)
    if clone is None:
        return []
    out, seen, stack = [None] * len(adj), {clone}, [clone]
    while stack:
        n = stack.pop()
        if any(n is o for o in nodes):
            return -1                            # the copy reused an original node
        out[n.val - 1] = [x.val for x in n.neighbors]
        for x in n.neighbors:
            if x not in seen:
                seen.add(x)
                stack.append(x)
    return out`,
          js: `class Node {
  constructor(val = 0, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function cloneGraph(node) {
  if (!node) return null;
  const copy = new Map([[node, new Node(node.val)]]);   // original -> its copy; also the visited set
  const queue = [node];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    for (const nb of cur.neighbors) {
      if (!copy.has(nb)) {
        copy.set(nb, new Node(nb.val));          // first time we see nb: make its copy
        queue.push(nb);
      }
      copy.get(cur).neighbors.push(copy.get(nb));   // wire the copies, new or old
    }
  }
  return copy.get(node);
}

function cloneAdj(adj) {   // test adapter, not part of the answer: adjacency list in, the copy's adjacency list out
  const nodes = adj.map((_, i) => new Node(i + 1));
  adj.forEach((nb, i) => { nodes[i].neighbors = nb.map(j => nodes[j - 1]); });
  const clone = cloneGraph(nodes.length ? nodes[0] : null);
  if (!clone) return [];
  const out = new Array(adj.length).fill(null), seen = new Set([clone]), stack = [clone];
  while (stack.length) {
    const n = stack.pop();
    if (nodes.includes(n)) return -1;            // the copy reused an original node
    out[n.val - 1] = n.neighbors.map(x => x.val);
    for (const x of n.neighbors) if (!seen.has(x)) { seen.add(x); stack.push(x); }
  }
  return out;
}`,
          java: `class Node {
    public int val;
    public List<Node> neighbors = new ArrayList<>();
    public Node(int val) { this.val = val; }
}

class Solution {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Map<Node, Node> copy = new HashMap<>();  // original -> its copy; also the visited set
        copy.put(node, new Node(node.val));
        Queue<Node> queue = new ArrayDeque<>();
        queue.offer(node);
        while (!queue.isEmpty()) {
            Node cur = queue.poll();
            for (Node nb : cur.neighbors) {
                if (!copy.containsKey(nb)) {
                    copy.put(nb, new Node(nb.val));   // first time we see nb: make its copy
                    queue.offer(nb);
                }
                copy.get(cur).neighbors.add(copy.get(nb));   // wire the copies, new or old
            }
        }
        return copy.get(node);
    }
}`,
          cpp: `class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node(int v) : val(v) {}
};

class Solution {
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        unordered_map<Node*, Node*> copy;        // original -> its copy; also the visited set
        copy[node] = new Node(node->val);
        queue<Node*> q;
        q.push(node);
        while (!q.empty()) {
            Node* cur = q.front();
            q.pop();
            for (Node* nb : cur->neighbors) {
                if (!copy.count(nb)) {
                    copy[nb] = new Node(nb->val);     // first time we see nb: make its copy
                    q.push(nb);
                }
                copy[cur]->neighbors.push_back(copy[nb]);   // wire the copies, new or old
            }
        }
        return copy[node];
    }
};`
        },
        complexity: 'O(V + E) time: every node is created once and every edge is wired once. O(V) space for the map and the queue (plus the copy itself).',
        say: '“A plain recursive copy loops forever on a cycle, so I need to remember what I have already copied. I keep a hash map from each original node to its copy; it is the visited set and also how I find a copy to link to. I BFS over the original: for every neighbour without a copy I create one and queue it, then I append that neighbour’s copy to the current node’s copy. Each node and edge is handled once, O(V + E).”',
        followups: [
          { q: 'Does it matter if you use DFS instead of BFS?', a: 'No. Any walk that creates a copy on first sight and wires every edge works. DFS recursion is a few lines shorter; BFS avoids deep recursion.' },
          { q: 'Why create the copy when you first see the node, before processing it?', a: 'Because a later node may point back to it. If the copy exists in the map the moment the node is discovered, any edge to it can be wired immediately, in either order.' },
          { q: 'What if the graph is not connected?', a: 'You are handed a single node, so you can only copy what is reachable from it. To copy a whole disconnected graph you would loop over all nodes and clone from each uncopied one, sharing the same map.' },
          { q: 'Where else does the original-to-copy map trick appear?', a: 'Copy List with Random Pointer (138) uses exactly this idea on a linked list whose extra pointers can point anywhere.' }
        ]
      },
      {
        lc: 127,
        restate: 'You turn one word into another by changing **one letter at a time**, and every word you pass through must be in a given dictionary. Return the number of words in the **shortest** such sequence, counting both the first and the last word, or `0` if no sequence exists.',
        examples: '- cat → cot → dot → dog with dictionary `[cot, cog, dot, dog]` → `4`.\n- The end word is not in the dictionary → `0`.\n- No chain of one-letter changes links the two words → `0`.\n- Edge cases: a one-letter word (every other one-letter word is a neighbour); the begin word may or may not be in the dictionary.',
        brute: 'Try every sequence of dictionary words (backtracking) and keep the shortest. Exponential: the number of orderings explodes, and most of them wander in circles.',
        insight: 'Picture a graph where each **word is a node** and two words are joined if they differ in exactly one letter. “Shortest sequence” is then the fewest steps between two nodes in an unweighted graph: **BFS**. You never build the graph. To find a word’s neighbours, change each letter position to each of the 26 letters and keep the results that are in the dictionary (a hash set) and not yet seen. Count BFS rings: the begin word is length 1, each ring adds one. Mark words seen when you queue them.',
        code: {
          py: `class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        words = set(wordList)
        if endWord not in words:
            return 0
        queue, seen, length = deque([beginWord]), {beginWord}, 1
        while queue:
            for _ in range(len(queue)):          # one ring = one more word in the sequence
                word = queue.popleft()
                if word == endWord:
                    return length
                for i in range(len(word)):
                    for ch in 'abcdefghijklmnopqrstuvwxyz':
                        nxt = word[:i] + ch + word[i + 1:]
                        if nxt in words and nxt not in seen:
                            seen.add(nxt)
                            queue.append(nxt)
            length += 1
        return 0`,
          js: `function ladderLength(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  const queue = [beginWord], seen = new Set([beginWord]);
  let length = 1, head = 0;
  while (head < queue.length) {
    for (let n = queue.length - head; n > 0; n--) {   // one ring = one more word in the sequence
      const word = queue[head++];
      if (word === endWord) return length;
      for (let i = 0; i < word.length; i++) {
        for (let k = 0; k < 26; k++) {
          const nxt = word.slice(0, i) + String.fromCharCode(97 + k) + word.slice(i + 1);
          if (words.has(nxt) && !seen.has(nxt)) {
            seen.add(nxt);
            queue.push(nxt);
          }
        }
      }
    }
    length++;
  }
  return 0;
}`,
          java: `class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> words = new HashSet<>(wordList);
        if (!words.contains(endWord)) return 0;
        Queue<String> queue = new ArrayDeque<>();
        Set<String> seen = new HashSet<>();
        queue.offer(beginWord);
        seen.add(beginWord);
        int length = 1;
        while (!queue.isEmpty()) {
            for (int n = queue.size(); n > 0; n--) {   // one ring = one more word in the sequence
                String word = queue.poll();
                if (word.equals(endWord)) return length;
                char[] cs = word.toCharArray();
                for (int i = 0; i < cs.length; i++) {
                    char old = cs[i];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        cs[i] = ch;
                        String nxt = new String(cs);
                        if (words.contains(nxt) && seen.add(nxt)) queue.offer(nxt);
                    }
                    cs[i] = old;
                }
            }
            length++;
        }
        return 0;
    }
}`,
          cpp: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end()), seen{beginWord};
        if (!words.count(endWord)) return 0;
        queue<string> q;
        q.push(beginWord);
        int length = 1;
        while (!q.empty()) {
            for (int n = q.size(); n > 0; n--) {       // one ring = one more word in the sequence
                string word = q.front();
                q.pop();
                if (word == endWord) return length;
                for (size_t i = 0; i < word.size(); i++) {
                    char old = word[i];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        word[i] = ch;
                        if (words.count(word) && seen.insert(word).second) q.push(word);
                    }
                    word[i] = old;
                }
            }
            length++;
        }
        return 0;
    }
};`
        },
        complexity: 'Let N be the number of words and L their length. Each word is dequeued once and generates 26 × L candidates, each costing O(L) to build and hash: O(N × L² × 26), which is O(N × L²). Space is O(N × L) for the set, seen set and queue.',
        say: '“Think of words as nodes, with an edge between words that differ in one letter. The shortest sequence is then the shortest path in an unweighted graph, so BFS. I don’t build the graph: for each word I try changing every position to each of 26 letters and keep the ones in the dictionary that I haven’t seen. I count rings, starting at 1 for the begin word, and return the count when I dequeue the end word, or 0 if the queue empties. If the end word isn’t in the dictionary I return 0 immediately.”',
        followups: [
          { q: 'How do you speed it up when the dictionary is huge but the words are short?', a: 'Search from both ends at once (bidirectional BFS) and stop when the two frontiers meet. Expanding the smaller frontier each time cuts the explored area dramatically.' },
          { q: 'What is the alternative to trying all 26 letters?', a: 'Pre-bucket words by pattern: `h*t` groups hot, hit, hat. Words in the same bucket are neighbours. Building buckets costs O(N × L²) once and removes the 26 factor, at the price of more memory.' },
          { q: 'Why not just remove words from the dictionary when you queue them?', a: 'You can, and it saves the separate `seen` set. It changes the input, so say so. The `seen` set is the safer default.' },
          { q: 'What if you also had to return the sequence itself, or all shortest sequences?', a: 'Keep `prev` for one sequence (as in the grid template). For all of them, record every parent that first reaches a word at the same ring, then backtrack from the end.' }
        ]
      }
    ],

    practice: [
      { lc: 200,
        hints: ['Count groups of connected land. Each time you find land you have not seen, that is a new island.', 'When you find new land, add one to the count and **flood** outward from it (BFS or DFS), marking each land cell you reach, so it is never counted again.', 'To mark cells without a separate set, turn each visited land cell into water. Only up, down, left and right count as neighbours.'],
        starter: { py: 'class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        ', js: 'function numIslands(grid) {\n  \n}' },
        tests: { fn: 'numIslands', sig: { args: ['char[][]'] }, cases: [
          { args: [[['1', '1', '1', '1', '0'], ['1', '1', '0', '1', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '0', '0', '0']]], out: 1 },
          { args: [[['1', '1', '0', '0', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '1', '0', '0'], ['0', '0', '0', '1', '1']]], out: 3 },
          { args: [[['0']]], out: 0 }, { args: [[['1']]], out: 1 },
          { args: [[['1', '0', '1'], ['0', '1', '0'], ['1', '0', '1']]], out: 5 },
          { args: [[['1', '0', '1', '1']]], out: 2 }] } },

      { lc: 133,
        hints: ['Copying node by node and recursing into neighbours never ends if the graph has a loop. You must remember which nodes you have already copied.', 'Keep a dictionary from each original node to its copy. If a neighbour is in it, reuse that copy; if not, create the copy and queue the neighbour.', 'For each node you take, append the copy of each neighbour to the copy of that node’s neighbour list. The tests call a provided `clone_adj` (or `cloneAdj`) adapter that builds the nodes, runs your `cloneGraph`, and reads the copy back: leave it as it is.'],
        starter: {
          py: 'class Node:\n    def __init__(self, val=0, neighbors=None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\nclass Solution:\n    def cloneGraph(self, node: Optional[\'Node\']) -> Optional[\'Node\']:\n        \n\ndef clone_adj(adj):   # test adapter: leave as is\n    nodes = [Node(i + 1) for i in range(len(adj))]\n    for i, nb in enumerate(adj):\n        nodes[i].neighbors = [nodes[j - 1] for j in nb]\n    clone = Solution().cloneGraph(nodes[0] if nodes else None)\n    if clone is None:\n        return []\n    out, seen, stack = [None] * len(adj), {clone}, [clone]\n    while stack:\n        n = stack.pop()\n        if any(n is o for o in nodes):\n            return -1\n        out[n.val - 1] = [x.val for x in n.neighbors]\n        for x in n.neighbors:\n            if x not in seen:\n                seen.add(x)\n                stack.append(x)\n    return out',
          js: 'class Node {\n  constructor(val = 0, neighbors = []) {\n    this.val = val;\n    this.neighbors = neighbors;\n  }\n}\n\nfunction cloneGraph(node) {\n  \n}\n\nfunction cloneAdj(adj) {   // test adapter: leave as is\n  const nodes = adj.map((_, i) => new Node(i + 1));\n  adj.forEach((nb, i) => { nodes[i].neighbors = nb.map(j => nodes[j - 1]); });\n  const clone = cloneGraph(nodes.length ? nodes[0] : null);\n  if (!clone) return [];\n  const out = new Array(adj.length).fill(null), seen = new Set([clone]), stack = [clone];\n  while (stack.length) {\n    const n = stack.pop();\n    if (nodes.includes(n)) return -1;\n    out[n.val - 1] = n.neighbors.map(x => x.val);\n    for (const x of n.neighbors) if (!seen.has(x)) { seen.add(x); stack.push(x); }\n  }\n  return out;\n}' },
        tests: { fn: { py: 'clone_adj', default: 'cloneAdj' }, cases: [
          { args: [[[2, 4], [1, 3], [2, 4], [1, 3]]], out: [[2, 4], [1, 3], [2, 4], [1, 3]] },
          { args: [[[]]], out: [[]] }, { args: [[]], out: [] },
          { args: [[[2], [1]]], out: [[2], [1]] },
          { args: [[[2, 3], [1, 3], [1, 2]]], out: [[2, 3], [1, 3], [1, 2]] }] } },

      { lc: 695,
        hints: ['It is Number of Islands with a size instead of a count: flood each island and report its area.', 'Write a function that, given a land cell, returns the number of land cells connected to it: 1 for itself plus whatever its four neighbours return. Turn each cell to water as you count it.', 'Try every cell as a starting point and keep the largest total. Water, cells off the grid and already-counted cells all return 0.'],
        solution: { explain: 'DFS from every land cell, returning 1 plus the areas of its neighbours, and sinking each cell as it is counted so it cannot be counted twice. The recursion is as deep as the biggest island, fine for the sizes here; for a large grid, use an explicit stack or BFS. O(rows × cols).', code: {
          py: `class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        def area(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != 1:
                return 0
            grid[r][c] = 0                       # sink it: never counted twice
            return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1)
        return max((area(r, c) for r in range(rows) for c in range(cols)), default=0)`,
          js: `function maxAreaOfIsland(grid) {
  const rows = grid.length, cols = grid[0].length;
  function area(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== 1) return 0;
    grid[r][c] = 0;                              // sink it: never counted twice
    return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1);
  }
  let best = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) best = Math.max(best, area(r, c));
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:\n        ', js: 'function maxAreaOfIsland(grid) {\n  \n}' },
        tests: { fn: 'maxAreaOfIsland', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 1, 0], [0, 1, 0], [1, 0, 1]]], out: 3 }, { args: [[[0, 0]]], out: 0 }, { args: [[[1]]], out: 1 },
          { args: [[[1, 1, 1, 1]]], out: 4 }, { args: [[[1, 0, 1], [1, 0, 1], [1, 1, 1]]], out: 7 },
          { args: [[[1, 0, 1, 1], [0, 0, 1, 0], [1, 1, 0, 1]]], out: 3 }] } },

      { lc: 417,
        hints: ['Asking “which cells can flow to the ocean” from every cell is slow. Flip it: start at the ocean and climb **up**.', 'Run a search from every cell on the Pacific edges, moving to a neighbour only if it is **at least as high** as the current cell. That finds every cell that can reach the Pacific. Do the same from the Atlantic edges.', 'The answer is the cells found by both searches. Two searches over the grid is O(rows × cols).'],
        solution: { explain: 'Reverse the flow. Water runs downhill, so from each ocean’s border cells walk **uphill** (to a neighbour that is the same height or higher) with BFS; this finds every cell that can reach that ocean. The answer is the intersection of the two reachable sets. O(rows × cols) time and space, instead of searching from every cell.', code: {
          py: `class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        rows, cols = len(heights), len(heights[0])
        def reach(starts):
            seen = set(starts)
            queue = deque(starts)
            while queue:
                r, c = queue.popleft()
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and heights[nr][nc] >= heights[r][c]:
                        seen.add((nr, nc))       # uphill or level: water could flow back down to here
                        queue.append((nr, nc))
            return seen
        pacific = reach([(0, c) for c in range(cols)] + [(r, 0) for r in range(rows)])
        atlantic = reach([(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows)])
        return [[r, c] for r, c in pacific & atlantic]`,
          js: `function pacificAtlantic(heights) {
  const rows = heights.length, cols = heights[0].length;
  function reach(starts) {
    const seen = new Set(starts.map(([r, c]) => r * cols + c)), queue = starts.slice();
    for (let head = 0; head < queue.length; head++) {
      const [r, c] = queue[head];
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen.has(nr * cols + nc) && heights[nr][nc] >= heights[r][c]) {
          seen.add(nr * cols + nc);              // uphill or level: water could flow back down to here
          queue.push([nr, nc]);
        }
      }
    }
    return seen;
  }
  const pac = [], atl = [];
  for (let c = 0; c < cols; c++) { pac.push([0, c]); atl.push([rows - 1, c]); }
  for (let r = 0; r < rows; r++) { pac.push([r, 0]); atl.push([r, cols - 1]); }
  const p = reach(pac), a = reach(atl), out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (p.has(r * cols + c) && a.has(r * cols + c)) out.push([r, c]);
  return out;
}` } },
        starter: { py: 'class Solution:\n    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:\n        ', js: 'function pacificAtlantic(heights) {\n  \n}' },
        tests: { fn: 'pacificAtlantic', compare: 'unordered', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1]]], out: [[0, 0]] }, { args: [[[1, 2], [2, 1]]], out: [[0, 1], [1, 0]] },
          { args: [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]], out: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
          { args: [[[3, 2, 1]]], out: [[0, 0], [0, 1], [0, 2]] }, { args: [[[1], [2], [3]]], out: [[0, 0], [1, 0], [2, 0]] },
          { args: [[[1, 2, 3], [8, 9, 4], [7, 6, 5]]], out: [[0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] }] } },

      { lc: 130,
        hints: ['A region of `O` survives only if it touches the border. Which direction is easier: finding the regions to flip, or the ones to keep?', 'Start from every `O` on the border and flood inward, marking each reached `O` with a temporary letter such as `S` (safe).', 'Then sweep the board: any `S` goes back to `O`, and any remaining `O` (never reached from the border) becomes `X`. The board is changed in place.'],
        solution: { explain: 'Capture means “not connected to the border”, so find the **survivors** instead: flood from every border `O`, marking reached cells `S`. A final sweep turns `S` back to `O` and every other `O` to `X`. Three passes, O(rows × cols).', code: {
          py: `class Solution:
    def solve(self, board: List[List[str]]) -> None:
        rows, cols = len(board), len(board[0])
        queue = deque()
        for r in range(rows):
            for c in range(cols):
                if (r in (0, rows - 1) or c in (0, cols - 1)) and board[r][c] == 'O':
                    board[r][c] = 'S'            # safe: connected to the border
                    queue.append((r, c))
        while queue:
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] == 'O':
                    board[nr][nc] = 'S'
                    queue.append((nr, nc))
        for r in range(rows):
            for c in range(cols):
                board[r][c] = 'O' if board[r][c] == 'S' else 'X'`,
          js: `function solve(board) {
  const rows = board.length, cols = board[0].length, queue = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r === 0 || r === rows - 1 || c === 0 || c === cols - 1) && board[r][c] === 'O') {
        board[r][c] = 'S';                       // safe: connected to the border
        queue.push([r, c]);
      }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === 'O') {
        board[nr][nc] = 'S';
        queue.push([nr, nc]);
      }
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) board[r][c] = board[r][c] === 'S' ? 'O' : 'X';
}` } },
        starter: { py: 'class Solution:\n    def solve(self, board: List[List[str]]) -> None:\n        ', js: 'function solve(board) {\n  \n}' },
        tests: { fn: 'solve', inPlace: 0, sig: { args: ['char[][]'] }, cases: [
          { args: [[['O', 'O', 'O'], ['O', 'X', 'O'], ['O', 'O', 'O']]], out: [['O', 'O', 'O'], ['O', 'X', 'O'], ['O', 'O', 'O']] },
          { args: [[['X', 'O', 'X'], ['X', 'O', 'X'], ['X', 'X', 'X']]], out: [['X', 'O', 'X'], ['X', 'O', 'X'], ['X', 'X', 'X']] },
          { args: [[['X', 'X', 'X'], ['X', 'O', 'X'], ['X', 'X', 'X']]], out: [['X', 'X', 'X'], ['X', 'X', 'X'], ['X', 'X', 'X']] },
          { args: [[['X', 'O', 'X', 'X'], ['X', 'X', 'O', 'X'], ['X', 'O', 'X', 'X']]], out: [['X', 'O', 'X', 'X'], ['X', 'X', 'X', 'X'], ['X', 'O', 'X', 'X']] },
          { args: [[['O']]], out: [['O']] }] } },

      { lc: 994,
        hints: ['The rot spreads from all rotten oranges at once, one step per minute. One search per rotten orange would be slow and hard to combine.', 'Put **every** rotten orange in one queue at the start and count the fresh ones. Process the queue a ring at a time: each ring is one minute.', 'Decrement the fresh count each time an orange rots. When the queue is empty (or no fresh ones remain), the answer is the minutes taken, or `-1` if any fresh orange is left.'],
        starter: { py: 'class Solution:\n    def orangesRotting(self, grid: List[List[int]]) -> int:\n        ', js: 'function orangesRotting(grid) {\n  \n}' },
        tests: { fn: 'orangesRotting', sig: { args: ['int[][]'] }, cases: [
          { args: [[[2, 1, 0], [1, 1, 1], [0, 1, 2]]], out: 2 }, { args: [[[2, 0, 1]]], out: -1 }, { args: [[[0, 2]]], out: 0 },
          { args: [[[0]]], out: 0 }, { args: [[[1]]], out: -1 }, { args: [[[2, 1, 1, 2]]], out: 1 },
          { args: [[[2, 1, 1, 1, 2]]], out: 2 }, { args: [[[1, 2, 1, 1, 1]]], out: 3 }] } },

      { lc: 286,
        hints: ['Computing the distance from every room to every gate is too slow. Flip it: spread outward from the gates.', 'This is a multi-source BFS: queue **all** gates (value 0) first. Rooms get filled in ring order, so the first time a room is reached is its nearest gate.', 'When you take a cell, give each unfilled room neighbour (the “infinity” value) the current distance plus 1 and queue it. Walls never get filled, and rooms that no ring reaches keep their original value. Modify the grid in place.'],
        solution: { explain: 'Multi-source BFS from all the gates at once. A room still holding the big “infinity” value has not been reached, so writing `distance + 1` into it both records the answer and acts as the visited mark. Rooms nobody reaches stay unchanged. O(rows × cols).', code: {
          py: `class Solution:
    def wallsAndGates(self, rooms: List[List[int]]) -> None:
        INF = 2147483647
        rows, cols = len(rooms), len(rooms[0])
        queue = deque((r, c) for r in range(rows) for c in range(cols) if rooms[r][c] == 0)   # every gate
        while queue:
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] == INF:
                    rooms[nr][nc] = rooms[r][c] + 1      # also the visited mark
                    queue.append((nr, nc))`,
          js: `function wallsAndGates(rooms) {
  const INF = 2147483647, rows = rooms.length, cols = rooms[0].length, queue = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (rooms[r][c] === 0) queue.push([r, c]);   // every gate
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && rooms[nr][nc] === INF) {
        rooms[nr][nc] = rooms[r][c] + 1;         // also the visited mark
        queue.push([nr, nc]);
      }
    }
  }
}` } },
        starter: { py: 'class Solution:\n    def wallsAndGates(self, rooms: List[List[int]]) -> None:\n        ', js: 'function wallsAndGates(rooms) {\n  \n}' },
        tests: { fn: 'wallsAndGates', inPlace: 0, sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 2147483647, 2147483647]]], out: [[0, 1, 2]] },
          { args: [[[2147483647, -1, 0], [2147483647, -1, 2147483647], [2147483647, 2147483647, 2147483647]]], out: [[6, -1, 0], [5, -1, 1], [4, 3, 2]] },
          { args: [[[0, 2147483647, 0]]], out: [[0, 1, 0]] }, { args: [[[2147483647]]], out: [[2147483647]] },
          { args: [[[2147483647, -1, 0]]], out: [[2147483647, -1, 0]] }, { args: [[[0, 2147483647, 2147483647, 2147483647, 0]]], out: [[0, 1, 2, 1, 0]] }] } },

      { lc: 127,
        hints: ['Treat each word as a node, with an edge between words that differ by exactly one letter. You want the shortest path.', 'Shortest path with equal edges is BFS. Put the begin word in a queue and count rings; the begin word itself is length 1.', 'To find neighbours without building the graph, change each letter of a word to each of 26 letters and keep results that are in the dictionary (use a set) and not yet seen. Return 0 at once if the end word is not in the dictionary.'],
        starter: { py: 'class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        ', js: 'function ladderLength(beginWord, endWord, wordList) {\n  \n}' },
        tests: { fn: 'ladderLength', sig: { args: ['str', 'str', 'list<str>'] }, cases: [
          { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']], out: 5 },
          { args: ['cat', 'dog', ['cot', 'cog', 'dot', 'dog']], out: 4 },
          { args: ['aa', 'cc', ['ab', 'cb', 'cc']], out: 4 },
          { args: ['aa', 'bb', ['ab']], out: 0 },
          { args: ['a', 'c', ['a', 'b', 'c']], out: 2 },
          { args: ['hot', 'dog', ['hot', 'dog']], out: 0 },
          { args: ['lead', 'gold', ['load', 'goad', 'gold']], out: 4 }] } },

      { lc: 785,
        hints: ['Splitting nodes into two groups so that every edge crosses between them is the same as giving each node one of two colours, with no edge joining two nodes of the same colour.', 'Colour a start node 0. Every neighbour must get 1, every neighbour of those must get 0, and so on, using BFS or DFS.', 'If you meet a neighbour that already has the same colour as the current node, return `false`. The graph can be in pieces, so start a walk from every node that is still uncoloured.'],
        solution: { explain: 'Two-colour with a DFS stack, starting a fresh walk from every uncoloured node. A neighbour that already has the current node’s colour closes an odd cycle, which is exactly when no valid split exists. O(V + E).', code: {
          py: `class Solution:
    def isBipartite(self, graph: List[List[int]]) -> bool:
        color = [-1] * len(graph)
        for s in range(len(graph)):
            if color[s] != -1:
                continue
            color[s] = 0
            stack = [s]
            while stack:
                u = stack.pop()
                for v in graph[u]:
                    if color[v] == -1:
                        color[v] = 1 - color[u]  # opposite side
                        stack.append(v)
                    elif color[v] == color[u]:
                        return False             # both ends on the same side: an odd cycle
        return True`,
          js: `function isBipartite(graph) {
  const color = new Array(graph.length).fill(-1);
  for (let s = 0; s < graph.length; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const stack = [s];
    while (stack.length) {
      const u = stack.pop();
      for (const v of graph[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];               // opposite side
          stack.push(v);
        } else if (color[v] === color[u]) {
          return false;                          // both ends on the same side: an odd cycle
        }
      }
    }
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isBipartite(self, graph: List[List[int]]) -> bool:\n        ', js: 'function isBipartite(graph) {\n  \n}' },
        tests: { fn: 'isBipartite', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [0, 2], [1, 3], [0, 2]]], out: true }, { args: [[[1, 2], [0, 2], [0, 1]]], out: false },
          { args: [[[1], [0]]], out: true }, { args: [[[]]], out: true },
          { args: [[[1], [0], [3, 4], [2, 4], [2, 3]]], out: false }, { args: [[[], [2], [1, 3], [2, 4], [3]]], out: true }] } },

      { lc: 1091,
        hints: ['Fewest moves on a grid where every move costs the same is a breadth-first search. The twist here is that you may also move diagonally.', 'Return `-1` right away if the start or end cell is blocked. Otherwise BFS from the top-left, trying all eight neighbours, and mark a cell seen when you queue it.', 'Count rings, starting at 1 because the answer counts cells, not moves. Return the count when you take the bottom-right cell; if the queue empties first, return `-1`.'],
        solution: { explain: 'Plain BFS with eight move directions. Check the endpoints first, mark cells when queued, and count rings starting from 1 (the answer counts cells, not steps). O(n²) for an n by n grid.', code: {
          py: `class Solution:
    def shortestPathBinaryMatrix(self, grid: List[List[int]]) -> int:
        n = len(grid)
        if grid[0][0] or grid[n - 1][n - 1]:
            return -1
        queue, seen, cells = deque([(0, 0)]), {(0, 0)}, 1
        while queue:
            for _ in range(len(queue)):          # one ring = one more cell on the path
                r, c = queue.popleft()
                if (r, c) == (n - 1, n - 1):
                    return cells
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and (nr, nc) not in seen:
                            seen.add((nr, nc))
                            queue.append((nr, nc))
            cells += 1
        return -1`,
          js: `function shortestPathBinaryMatrix(grid) {
  const n = grid.length;
  if (grid[0][0] || grid[n - 1][n - 1]) return -1;
  const queue = [[0, 0]], seen = new Set([0]);
  let cells = 1, head = 0;
  while (head < queue.length) {
    for (let k = queue.length - head; k > 0; k--) {   // one ring = one more cell on the path
      const [r, c] = queue[head++];
      if (r === n - 1 && c === n - 1) return cells;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0 && !seen.has(nr * n + nc)) {
            seen.add(nr * n + nc);
            queue.push([nr, nc]);
          }
        }
      }
    }
    cells++;
  }
  return -1;
}` } },
        starter: { py: 'class Solution:\n    def shortestPathBinaryMatrix(self, grid: List[List[int]]) -> int:\n        ', js: 'function shortestPathBinaryMatrix(grid) {\n  \n}' },
        tests: { fn: 'shortestPathBinaryMatrix', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 1], [1, 0]]], out: 2 }, { args: [[[0]]], out: 1 }, { args: [[[1, 0], [0, 0]]], out: -1 },
          { args: [[[0, 0, 0], [1, 1, 0], [1, 1, 0]]], out: 4 }, { args: [[[0, 1, 0], [1, 1, 0], [1, 1, 0]]], out: -1 },
          { args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], out: 4 }, { args: [[[0, 0], [0, 1]]], out: -1 }] } },

      { lc: 463,
        hints: ['You do not need a search. The perimeter is made of unit sides that face water or the edge of the grid.', 'Every land cell starts with 4 sides. Each time two land cells touch, they hide one side on each cell, so 2 sides disappear from the total.', 'Loop over the cells; for every land cell add 4, and subtract 2 for each land neighbour **below** and **to the right** (only those two, so each touching pair is counted once).'],
        solution: { explain: 'No search: 4 sides per land cell, minus 2 for every pair of touching land cells. Count each pair once by looking only right and down. O(rows × cols).', code: {
          py: `class Solution:
    def islandPerimeter(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        land = touching = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 1:
                    land += 1
                    if r + 1 < rows and grid[r + 1][c] == 1:
                        touching += 1            # a shared side, seen once from the upper cell
                    if c + 1 < cols and grid[r][c + 1] == 1:
                        touching += 1            # a shared side, seen once from the left cell
        return 4 * land - 2 * touching`,
          js: `function islandPerimeter(grid) {
  const rows = grid.length, cols = grid[0].length;
  let land = 0, touching = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        land++;
        if (r + 1 < rows && grid[r + 1][c] === 1) touching++;   // a shared side, seen once from the upper cell
        if (c + 1 < cols && grid[r][c + 1] === 1) touching++;   // a shared side, seen once from the left cell
      }
    }
  }
  return 4 * land - 2 * touching;
}` } },
        starter: { py: 'class Solution:\n    def islandPerimeter(self, grid: List[List[int]]) -> int:\n        ', js: 'function islandPerimeter(grid) {\n  \n}' },
        tests: { fn: 'islandPerimeter', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1]]], out: 4 }, { args: [[[1, 1]]], out: 6 }, { args: [[[0, 1, 0], [1, 1, 1], [0, 1, 0]]], out: 12 },
          { args: [[[1, 1], [1, 1]]], out: 8 }, { args: [[[1, 0]]], out: 4 }, { args: [[[1, 1, 1]]], out: 8 },
          { args: [[[0, 1, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]]], out: 16 }] } }
    ],

    mistakes: [
      '**Marking a node visited when you take it instead of when you add it (BFS).** A node reachable by two routes is queued twice, the work doubles, and on a grid the queue can explode. Mark on **add**. (Iterative DFS that wants true recursive order is the one exception: it marks on pop, and skips repeats.)',
      '**No visited set at all.** Fine on a tree, an infinite loop on any graph with a cycle, and every undirected edge is one. Decide how you mark nodes before you write the loop, not after the first timeout.',
      '**Treating a directed cycle like an undirected one.** In a directed graph, reaching an already-visited node is not a cycle (two routes can meet). Only reaching a node **on the current path** is. Use three states: new, on the path, finished. In an undirected graph, ignore the edge back to your parent, or every edge looks like a cycle.',
      '**Row and column mixed up, or off-grid indexing.** `grid[r][c]` has `r` up to `len(grid)` and `c` up to `len(grid[0])`. Test the bounds **before** reading the cell, in that order, so you never index out of range (and watch Python’s negative indices, which silently wrap instead of failing).',
      '**Starting only one walk on a disconnected graph.** Bipartite checks, cycle detection and component counts must loop over **every** node and start a walk from each unvisited one. A single walk from node 0 only sees node 0’s component.',
      '**Recursive DFS on a big grid.** A 300 by 300 island is a recursion 90,000 deep: Python stops at about a thousand by default, and Java and C++ run out of stack. Use an explicit stack or BFS when the input can be large.',
      '**Using BFS for weighted shortest paths.** BFS minimizes the number of edges, not the total cost. With different edge costs the first arrival is not the cheapest; you need Dijkstra (a heap), or a deque for 0/1 weights.',
      '**Counting rings off by one.** For “minutes” or “steps”, decide whether the start counts: freeze the queue size per ring, add one per ring that **did work**, and test the edge cases (nothing to do, start equals end). The `while queue and fresh` trick in Rotting Oranges is exactly this.',
      '**Language gotchas.** *Python:* lists are not hashable, so use tuples for visited sets of coordinates; `deque.popleft()` is O(1) but `list.pop(0)` is O(n). *JavaScript:* `[r, c]` arrays compare by reference, so a `Set` of them never matches; encode as `r * cols + c` or a string. *Java:* `int[]` has no useful `equals`/`hashCode`; same encoding trick; `queue.poll()` returns `null` on empty. *C++:* `vector<bool>` and nested vectors are fine for visited, but `grid[r][c]` with a negative index is undefined behaviour, so check bounds first.'
    ],

    quiz: [
      { kind: 'concept', q: 'A graph has 5,000 nodes but only about 8,000 edges. Which storage is the better default for searching it?',
        choices: ['An adjacency list', 'An adjacency matrix', 'A 2D grid of booleans', 'A sorted array of node ids'], answer: 0,
        explain: 'A list stores only real edges, O(V + E) space, and loops only over actual neighbours. A matrix would use 25 million cells for 8,000 edges and make finding neighbours cost O(V) each.' },
      { kind: 'complexity', q: 'You run BFS on a graph with V nodes and E edges, stored as adjacency lists. What is the time?',
        choices: ['O(V + E)', 'O(V²)', 'O(E²)', 'O(V log V)'], answer: 0,
        explain: 'Each node is enqueued and dequeued once, and each node’s edge list is scanned once when it is dequeued, for V + E in total. O(V²) is the cost with an adjacency matrix.' },
      { kind: 'pattern', q: 'Which of these are most naturally solved with a **multi-source** BFS? Pick every one that applies.',
        choices: ['For every cell of a grid, the distance to the nearest fire station', 'The number of minutes until rot has spread from several rotten fruit to all the others', 'Whether any route exists between two named cities', 'The distance from each room to its nearest exit, where there are several exits'], answer: [0, 1, 3],
        explain: 'When many sources spread at the same pace and you want the nearest one, queue **all** sources first. A single route between two named places has one source, so plain BFS or DFS does it.' },
      { kind: 'bug', q: 'This BFS on an adjacency list sometimes puts the same node in the queue more than once. What is wrong?',
        code: `seen = set()
queue = deque([start])
while queue:
    u = queue.popleft()
    if u in seen:
        continue
    seen.add(u)
    for v in adj[u]:
        queue.append(v)`,
        choices: ['It marks nodes as seen when it takes them; it should mark when it adds them', 'It should use a stack instead of a queue', 'It should check `v in seen` before the loop', 'It forgot to add `start` to `seen` first'], answer: 0,
        explain: 'Every neighbour is queued, including ones already waiting, and only the later `continue` hides the repeats. Marking at the moment you append (`if v not in seen: seen.add(v); queue.append(v)`) keeps each node in the queue at most once. The result is still correct here, but the queue and the running time can blow up.' },
      { kind: 'concept', q: 'You run DFS on an **undirected** graph to look for a cycle. You step from `u` to a visited neighbour `v`. When does that prove a cycle?',
        choices: ['When `v` is not the node you just came from', 'Always', 'Only when `v` was visited before `u`', 'Only when the graph has more than V edges'], answer: 0,
        explain: 'Every undirected edge can be walked back to where you came from, so the edge to your parent is not a loop. Reaching any other visited node means a second route to it, which closes a cycle.' },
      { kind: 'concept', q: 'Why does cycle detection on a **directed** graph need a third state (on the current path) rather than just visited or not?',
        choices: ['Two different routes can lead to the same node without any cycle, so “already visited” is not proof', 'Directed graphs cannot be searched with DFS', 'The recursion would otherwise use too much memory', 'A visited set cannot be used on directed edges'], answer: 0,
        explain: 'In a diamond (A to B, A to C, B to D, C to D) the node D is reached twice and there is no loop. Only an edge back to a node that is still **on the current path** is a cycle. Finished nodes are cleared and can be ignored.' },
      { kind: 'concept', q: 'A graph is bipartite exactly when…',
        choices: ['It has no cycle of odd length', 'It has no cycles at all', 'It is connected', 'It has an even number of nodes'], answer: 0,
        explain: 'Two-colouring forces colours to alternate along every path, so an odd cycle (like a triangle) forces two touching nodes onto the same colour. Even cycles, such as a square, colour fine, and trees are always bipartite.' },
      { kind: 'complexity', q: 'You BFS a grid with R rows and C columns, moving in four directions with a visited set. The time is…',
        choices: ['O(R × C)', 'O(R + C)', 'O((R × C)²)', 'O(R × C × 4ⁿ)'], answer: 0,
        explain: 'Each of the R × C cells enters the queue at most once, and each takes four constant-time neighbour checks. The 4 is a constant, so the total is O(R × C).' },
      { kind: 'concept', q: 'You are asked for the fewest moves to get from one cell of a maze to another, with every move costing the same. Which is the right tool, and why?',
        choices: ['BFS, because it visits cells in order of distance so the first arrival is the shortest', 'DFS, because it finishes a route before trying another', 'DFS, because it uses less memory than BFS', 'Either; both are guaranteed to find a shortest route'], answer: 0,
        explain: 'BFS explores in rings of equal distance. DFS dives down one route and may reach the target by a long detour first; it finds a route, not necessarily a shortest one (try it in the visualizer).' }
    ],

    flashcards: [
      { id: 'adj-list-vs-matrix', front: 'Adjacency list or matrix: costs and when to use each?', back: 'List: O(V + E) space, neighbours in O(degree). Matrix: O(V²) space, “is there an edge u–v?” in O(1), neighbours in O(V). Default to the list; matrix for small dense graphs or O(1) edge tests.' },
      { id: 'bfs-core', front: 'BFS in four lines, and what it is good for.', back: 'Queue the start and mark it seen. Take the oldest; for each unseen neighbour, mark it and queue it. Repeat. It explores in rings, so the first arrival at a node is by a fewest-edges route (unweighted).' },
      { id: 'dfs-core', front: 'DFS: what is the stack, and when do you pick it over BFS?', back: 'DFS takes the newest waiting node (recursion or an explicit stack) and dives before backing up. Use it for reachability, regions, cycle checks and “finished” order. It does not give shortest paths.' },
      { id: 'graph-cost', front: 'Time and space for BFS or DFS on a graph?', back: 'O(V + E) time with adjacency lists; O(V) extra space (visited plus frontier or recursion). On an R by C grid, O(R × C).' },
      { id: 'grid-graph', front: 'How do you treat a grid as a graph?', back: 'Cells are nodes; neighbours are the four offsets (±1, 0) and (0, ±1). For each candidate check: in bounds (first), not a wall, not seen. Diagonals just add four offsets.' },
      { id: 'mark-on-add', front: 'BFS: mark visited on add or on take?', back: 'On **add** (when you queue it). Marking on take lets one node enter the queue several times. Iterative DFS that must match recursive order marks on pop and skips repeats.' },
      { id: 'multi-source', front: 'Multi-source BFS: the trick and when to use it.', back: 'Queue **every** source at distance 0 before the loop. Rings spread from all sources at once, so each cell gets the distance to its nearest source in one pass. Rotting oranges, walls and gates, 01 matrix.' },
      { id: 'components', front: 'Counting connected components.', back: 'Loop over every node; when you meet an unvisited one, add one to the count and walk its whole component marking it visited. Number of islands is this with grid cells. O(V + E).' },
      { id: 'cycle-undirected', front: 'Cycle in an undirected graph: the rule.', back: 'While walking, remember each node’s parent. A visited neighbour that is **not** the parent means a second route to it: a cycle. Run it from every unvisited node.' },
      { id: 'cycle-directed', front: 'Cycle in a directed graph: the rule.', back: 'DFS with three states: 0 new, 1 on the current path, 2 finished. An edge to a state-1 node is a cycle; a state-2 node is safe. Visited alone is not enough (a diamond has none).' },
      { id: 'bipartite', front: 'Bipartite check: method and the fact behind it.', back: 'Two-colour with BFS or DFS: neighbours get the opposite colour; the same colour on both ends of an edge means no. Bipartite exactly when there is no odd cycle. Start from every uncoloured node.' },
      { id: 'clone-graph', front: 'Clone a graph: how do you avoid looping forever?', back: 'Keep a dictionary from each original node to its copy: it is the visited set and how you find a copy to wire. Create a node’s copy on first sight, then append copies of its neighbours. O(V + E).' },
      { id: 'recursion-depth', front: 'When is recursive DFS on a grid a bad idea?', back: 'When one region can be huge: recursion depth equals region size (about 1000 in Python by default). Use an explicit stack or BFS for grids of 100 by 100 or more.' }
    ],

    deeper: [
      { title: 'Graph problems (LeetCode tag)', url: 'https://leetcode.com/tag/graph/', time: 'reference', note: 'LeetCode’s list of problems tagged graph. Start with the Easy and Medium ones that say grid or islands, then move to the ones with dependencies.' },
      { title: 'Breadth-first search problems (LeetCode tag)', url: 'https://leetcode.com/tag/breadth-first-search/', time: 'reference', note: 'Shortest-step and spreading problems. Filter to Medium and do each with ring-by-ring counting.' },
      { title: 'Depth-first search problems (LeetCode tag)', url: 'https://leetcode.com/tag/depth-first-search/', time: 'reference', note: 'Regions, reachability and cycle checks. Try each once recursively and once with an explicit stack.' },
      { title: 'Breadth-first search (CP-Algorithms)', url: 'https://cp-algorithms.com/graph/breadth-first-search.html', time: '15 min', note: 'A concise reference on BFS, restoring the path with parents, and the 0-1 BFS variant.' },
      { title: 'Depth-first search (CP-Algorithms)', url: 'https://cp-algorithms.com/graph/depth-first-search.html', time: '15 min', note: 'The DFS reference: entry and exit times, and the colouring that underlies directed cycle detection.' },
      { title: 'DFS and BFS animations (VisuAlgo)', url: 'https://visualgo.net/en/dfsbfs', time: '15 min', note: 'Step through both walks on small graphs you can edit; good for building the picture of the frontier.' }
    ],

    detective: [
      { id: 'rival-rooms',
        decoys: ['union-find', 'backtracking', 'trees'],
        statement: 'A school is setting up two debate rooms for the weekend. Some pairs of students are known rivals and must not end up in the same room. You are given the list of rival pairs for all the students, and you may have to handle groups of students who have no connection to each other at all. Can the students be sent to the two rooms so that no pair of rivals shares one? Answer yes or no.',
        why: 'Students and rival pairs are things and **links**, and the question is whether they can be split into **two sides with no conflict inside a side**. Give each student a room as you walk outward from them: every rival gets the other room, and meeting a rival already in your room is the “no”. Start from every student not yet placed, since the groups can be separate.' },
      { id: 'forest-patches',
        decoys: ['recursion', 'matrix', 'union-find'],
        statement: 'A survey photo of a nature reserve is split into square tiles, each marked either woodland or open ground. A patch of woodland is any set of woodland tiles where you can walk from any tile to any other by stepping only north, south, east or west onto other woodland tiles. Counting by diagonals does not make two tiles one patch. How many separate patches of woodland are there?',
        why: 'The tiles are the things and “next to” is the link. The question is how many **separate connected groups** exist. Scan the tiles; each woodland tile you have not yet visited starts a new patch, and a walk outward marks everything it can reach so it is never counted twice.' },
      { id: 'code-lock-hops',
        decoys: ['backtracking', 'queues', 'dp-1d'],
        statement: 'A strongbox opens with a four-digit code. You know the starting code on the dial and the target code that opens it, and there is a short list of codes the box locks up on, which you must never display. Each turn, you can turn exactly one digit of the dial up or down by one (9 wraps to 0 and 0 to 9). What is the fewest turns that gets the dial from the start to the target without ever showing a locked code? If the target is unreachable, say so.',
        why: 'Every possible dial setting is a node and one turn of one digit is a link, though nobody gave you the picture. You want the **fewest steps** between two nodes when every step costs the same, avoiding some forbidden nodes: explore settings in rings of equal distance, never revisiting one, and the first time the target appears is the answer.' }
    ]
  });
})();
