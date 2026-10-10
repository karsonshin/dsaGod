/* Offer Ready: extra lesson material for graphs (primer, think, breakdown, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  var J = function (a) { return a.join('\n'); };
  OR.extras['graphs'] = {
    primer: {
      kind: 'structure',
      what: 'A **graph** is a set of **nodes** (also called vertices) joined by **edges**, like a map where towns are dots and roads are lines. Edges can be **undirected** (a friendship, works both ways) or **directed** (a one-way street), and can carry a **weight** such as a distance or a price.',
      does: 'Adding an edge is O(1). Listing the neighbours of a node costs only the number of its edges with an adjacency list, but O(V) with a matrix; asking "is there an edge u to v?" is O(1) with a matrix. Walking the whole graph (BFS or DFS) costs O(V + E), where V is the number of nodes and E the number of edges.',
      impl: 'Default to an **adjacency list**: a list of lists (or a dict of lists) where `adj[u]` holds the neighbours of u, as `(neighbour, weight)` pairs if weighted. An **adjacency matrix** is a V by V table: V squared memory, only worth it for small dense graphs. Walk with a `deque` for BFS, a list or recursion for DFS, and a `seen` set so loops cannot trap you. A grid needs no building: its neighbours are four offsets.',
      possibilities: 'Counting islands and regions, fewest steps through a maze or a word ladder (BFS), spreading processes such as rotting fruit (multi-source BFS), cycle detection, splitting people into two teams (bipartite check), copying linked structures, and the base layer under dependency ordering, shortest paths and union-find.'
    },

    think: [
      {
        q: 'Graph: 0 is linked to 1 and 2, 1 is linked to 3, 2 is linked to 3 (all one-way, in that order of neighbours). Predict the visit order of BFS from 0 and of recursive DFS from 0.',
        a: 'BFS visits **0, 1, 2, 3**: it finishes the ring of nodes one step away (1 and 2) before going two steps away (3). Recursive DFS visits **0, 1, 3, 2**: from 0 it dives into 1, then straight on to 3, and only when 3 is stuck does it back up and try 2. Same nodes, different order. The aha: the only difference is which waiting node you take next, the oldest (queue) or the newest (stack).'
      },
      {
        q: 'What breaks if you forget the visited set on an undirected graph with just two nodes and one edge, 0 - 1?',
        a: 'The search never ends. From 0 you go to 1, from 1 the edge leads back to 0, then to 1 again, and so on forever. An undirected edge is a loop of length two all by itself, so even the tiniest graph needs a visited set. The cost is not just wasted time, it is an infinite run (or a stack overflow if you recurse).'
      },
      {
        q: 'Both BFS and DFS reach the goal in a maze. Why can you trust the BFS path to be shortest but not the DFS one?',
        a: 'BFS explores in rings: everything 1 step away, then everything 2 steps away. So the first time it touches a node, no shorter route can exist, otherwise the node would have appeared in an earlier ring. DFS follows one route to the bottom first, so it may reach the goal by a long detour before it ever tries the short way. The aha: BFS order **is** distance order when every step costs the same.'
      },
      {
        q: 'In BFS, a node can be reached from two different nodes that are both already in the queue. Why does it matter whether you mark it seen when you add it or when you take it?',
        a: 'If you mark on take, the node is added once by each of those two nodes, so it sits in the queue twice and its neighbours get scanned twice. Marking on add means the second discoverer sees "already seen" and skips it. On a big grid, marking on take can multiply the queue size badly. Remember: **mark when you add** for BFS.'
      },
      {
        q: 'You need the distance from every cell of a grid to its nearest fire station, and there are 50 stations. Run one BFS per station, or something smarter?',
        a: 'Smarter: put **all 50 stations in the queue at distance 0** and run a single BFS. The rings spread from every station at the same pace, so the first time a cell is reached, it is reached by its nearest station. One pass costs O(rows × cols) instead of 50 times that. The aha: many sources are just a bigger starting ring.'
      },
      {
        q: 'You are handed a list of 1,000 friendships among 500 people and asked "are Ana and Ben friends?" many times. Adjacency list or matrix?',
        a: 'Either works for 500 people (a matrix is 250,000 cells), but the useful point is what each is good at. A list is the default: small memory and fast neighbour loops for BFS. If the question is only "is there a direct edge", a matrix answers in O(1), and so does a list of **sets** (`adj[u]` as a set). Pick the structure for the operation you repeat the most.'
      }
    ],

    breakdown: [
      {
        title: '1. Raw idea: things and the links between them',
        body: J([
          'Forget code for a second. A graph is dots (nodes) and lines (edges). We will use one tiny graph for the whole lesson: five people, **0 to 4**, with friendships',
          '`0-1, 0-2, 1-3, 2-3, 3-4`.',
          'Picture 0 at the top, 1 and 2 below it, both linked to 3, and 4 hanging off 3. Friendship is mutual, so the edges are **undirected**. A direct friend is a **neighbour**. Questions we will answer: who can reach whom, how many steps apart are two people, and how many separate friend groups exist. How to spot it in an interview: the statement talks about pairs of things that are "linked", "next to", "connected" or "depend on".'
        ])
      },
      {
        title: '2. Store it: the adjacency list',
        body: J([
          'The computer cannot see the picture, so we keep, for each node, the list of its neighbours. For our graph:',
          '```',
          'adj[0] = [1, 2]',
          'adj[1] = [0, 3]',
          'adj[2] = [0, 3]',
          'adj[3] = [1, 2, 4]',
          'adj[4] = [3]',
          '```',
          'Each undirected edge is stored **twice** (0 in the list of 1 and 1 in the list of 0). For a **directed** edge you add it once. Create all n lists up front so an isolated node still has an empty one. Duplicate edges just appear twice, which is harmless for searching. A self-loop `u-u` lists a node as its own neighbour, which the visited set ignores. Space is O(V + E).'
        ]),
        code: { py: `def build_adj(n, edges):
    adj = [[] for _ in range(n)]      # one list per node, even lonely ones
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)              # undirected: both directions
    return adj` }
      },
      {
        title: '3. Walk it with BFS: a queue and a seen set',
        body: J([
          'State we track: a **queue** of nodes found but not yet explored, and a **seen** set. Loop: take the oldest node, look at each neighbour, and if unseen, mark it and queue it. Start from 0:',
          '```',
          'start          queue [0]        seen {0}',
          'take 0: add 1,2  queue [1, 2]     seen {0,1,2}',
          'take 1: 0 seen, add 3  queue [2, 3]  seen {0,1,2,3}',
          'take 2: 0,3 seen       queue [3]',
          'take 3: 1,2 seen, add 4  queue [4]   seen {0,1,2,3,4}',
          'take 4: 3 seen         queue []  done',
          '```',
          'Visit order **0, 1, 2, 3, 4**. Every node enters the queue once and every edge is looked at a constant number of times, so the cost is O(V + E). Mark on **add**, not on take.'
        ]),
        code: { py: `from collections import deque

def bfs_order(adj, start):
    seen, order = {start}, []
    queue = deque([start])
    while queue:
        u = queue.popleft()           # oldest waiting node
        order.append(u)
        for v in adj[u]:
            if v not in seen:
                seen.add(v)           # mark when ADDED
                queue.append(v)
    return order` }
      },
      {
        title: '4. The twin: DFS takes the newest waiting node',
        body: J([
          'Keep everything the same, but take the **newest** waiting node (a stack, or recursion). Same graph from 0, neighbours in list order:',
          '```',
          'visit 0 -> go to 1 (first neighbour)',
          'visit 1 -> go to 3 (0 is seen)',
          'visit 3 -> 1 seen, go to 2',
          'visit 2 -> 0 and 3 seen, stuck, back up to 3',
          'at 3 -> next neighbour 4, visit 4, stuck',
          '```',
          'Order **0, 1, 3, 2, 4**. It dives deep before it backs up. That is the right tool when you need the **current path** (cycle checks) or just "is there any route". It costs O(V + E) as well, but recursion depth can reach V, so on a huge grid use an explicit stack.'
        ])
      },
      {
        title: '5. Distances and routes: BFS rings plus a parent record',
        body: J([
          'Because BFS goes ring by ring, store a `dist` array, filled the moment a node is added: `dist[v] = dist[u] + 1`. On our graph from 0:',
          '```',
          'node   0  1  2  3  4',
          'dist   0  1  1  2  3',
          'parent -  0  0  1  3',
          '```',
          'Node 3 was first found by 1, so its parent is 1. To rebuild the route to 4, follow parents backwards: 4, 3, 1, 0, then reverse to get 0, 1, 3, 4. Three edges, and no route can be shorter because BFS reached 4 in ring 3. Unreachable nodes keep `dist = -1`. This is "fewest steps" when every edge costs the same; with different costs you need Dijkstra.'
        ])
      },
      {
        title: '6. Disconnected graphs: one walk per unvisited node',
        body: J([
          'Add node 5 (alone) and 6, 7 joined by an edge. Now there are **3 groups** (called connected components): {0,1,2,3,4}, {5}, {6,7}. One walk from 0 only ever sees its own group. So loop over **every** node; whenever the node is unseen, you have found a new group: count it and walk its whole group to mark it.',
          '```',
          'node 0 unseen -> count 1, walk marks 0..4',
          'nodes 1-4 seen, skip',
          'node 5 unseen -> count 2, walk marks 5',
          'node 6 unseen -> count 3, walk marks 6,7',
          'node 7 seen, skip',
          '```',
          'Total work is still O(V + E): each node is walked once. Bipartite checks, cycle checks and island counts all need this outer loop.'
        ])
      },
      {
        title: '7. A grid is a graph you never build',
        body: J([
          'In a grid, a cell `(r, c)` is a node and its edges go to `(r+1,c)`, `(r-1,c)`, `(r,c+1)`, `(r,c-1)`. Walls are not nodes. Every candidate neighbour passes three tests **in this order**: inside the grid, not a wall, not seen.',
          '```',
          '. . #        BFS from (0,0)',
          '. # .        ring 0: (0,0)',
          '. . .        ring 1: (0,1) (1,0)',
          '             ring 2: (2,0)   [(0,2) is a wall]',
          '             ring 3: (2,1)   ring 4: (2,2)   ring 5: (1,2)',
          '```',
          'Bounds first, so you never index off the edge (Python negative indices wrap silently!). With R rows and C columns each cell has at most four neighbours, so the cost is O(R × C). Spot it in an interview: a 2D board where you move up, down, left, right.'
        ])
      },
      {
        title: '8. Variations that reuse the same loop',
        body: J([
          '- **Many sources:** queue all of them at distance 0 first (multi-source BFS). Rotting oranges, walls and gates.',
          '- **Cycle in an undirected graph:** a visited neighbour that is not your parent means a second route.',
          '- **Cycle in a directed graph:** three states, new / on the current path / finished; only a neighbour on the current path is a cycle.',
          '- **Two teams (bipartite):** give neighbours opposite colours; two touching nodes with the same colour means an odd cycle.',
          '- **Copy a graph:** a dict from original node to its copy doubles as the seen set.',
          'Edge cases to say out loud: empty graph, one node, self-loops, duplicate edges, disconnected pieces, and whether it is allowed to modify the input.'
        ])
      }
    ],

    drills: [
      {
        title: 'Sizes of the friend groups',
        q: J([
          'There are `n` people numbered `0` to `n - 1` and a list of mutual friendships (pairs). A **friend group** is a set of people who are all connected through chains of friends. Return the sizes of all the groups, largest first.',
          '',
          'Example: `n = 6`, `edges = [[0,1],[1,2],[3,4]]` returns `[3, 2, 1]` (people 0,1,2 together; 3,4 together; 5 alone).'
        ]),
        hint: 'You are counting connected components, but also counting how many nodes each walk touches.',
        how: J([
          'I restate it: split the people into groups of mutual reachability and report the size of each. A brute-force idea is to compare every pair of people and merge their group labels, rewriting the labels each time. That is a lot of repeated work. The unlock is that this is exactly the connected components pattern: if I start a walk from a person nobody has reached yet, the walk touches precisely that person group, so the number of nodes the walk visits is the size.',
          '',
          'So the structure is an adjacency list, a seen array and an outer loop over every person. I use a stack here but a queue works too. On the example: adjacency is 0:[1], 1:[0,2], 2:[1], 3:[4], 4:[3], 5:[]. Person 0 is unseen, so I walk and visit 0, 1, 2: size 3. Persons 1 and 2 are seen, skip. Person 3 is unseen: walk visits 3, 4: size 2. Person 5 is unseen: size 1. Sorted descending gives [3, 2, 1].',
          '',
          'Edge cases: no people (n = 0) returns an empty list; no edges gives n groups of size 1; duplicate edges or self-loops are harmless because the seen array stops me from counting anyone twice. Cost: each person is walked once and each edge looked at a constant number of times, O(n + m), plus the sort of the sizes, O(g log g) for g groups.'
        ]),
        code: { py: `def component_sizes(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen = [False] * n
    sizes = []
    for s in range(n):
        if seen[s]:
            continue
        seen[s] = True
        stack, size = [s], 0
        while stack:
            u = stack.pop()
            size += 1
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    stack.append(v)
        sizes.append(size)
    return sorted(sizes, reverse=True)` },
        explain: 'The outer loop starts exactly one walk per group, and a walk marks every person it reaches, so each person is counted in exactly one group. Time O(n + m + g log g), space O(n + m).',
        check: J([
          'assert component_sizes(6, [[0, 1], [1, 2], [3, 4]]) == [3, 2, 1]',
          'assert component_sizes(0, []) == []',
          'assert component_sizes(3, []) == [1, 1, 1]',
          'assert component_sizes(4, [[0, 1], [1, 0], [2, 2]]) == [2, 1, 1]',
          'assert component_sizes(3, [[0, 1], [1, 2], [2, 0]]) == [3]',
          'assert component_sizes(7, [[0, 1], [2, 3], [3, 4], [4, 2], [5, 6]]) == [3, 2, 2]'
        ])
      },
      {
        title: 'Steps to the nearest exit',
        q: J([
          'A floor plan is a list of equal-length strings: `#` is a wall, `.` is an open cell and `E` is an exit. You can move up, down, left or right through open cells. Return a grid of numbers: `0` for each exit, the fewest steps to the nearest exit for each open cell, and `-1` for walls and for open cells that cannot reach any exit.',
          '',
          'Example: `["E..", ".#.", "..#"]` returns `[[0,1,2],[1,-1,3],[2,3,-1]]`.'
        ]),
        hint: 'Do not run a search from every open cell. Start from the exits instead, all at once.',
        how: J([
          'I restate it: for every open cell I want the distance to the closest exit. The brute force runs a BFS from each open cell until it hits an exit. With R × C cells that is up to (R × C) squared work, far too slow on a big floor. The bottleneck is repeating nearly identical searches.',
          '',
          'The observation: flip the direction. Distance from a cell to its nearest exit equals the distance from the exit set to the cell. If I put **all exits in the queue at distance 0** and run one BFS, the rings spread from every exit at the same speed, so the first ring that reaches a cell comes from the nearest exit. That is multi-source BFS.',
          '',
          'State: a `dist` grid starting at -1 (which doubles as the visited mark), and a queue. Trace the example: exit (0,0) gets 0. Take it: (0,1) and (1,0) become 1. Take (0,1): (0,2) becomes 2 ((1,1) is a wall). Take (1,0): (2,0) becomes 2. Take (0,2): (1,2) becomes 3. Take (2,0): (2,1) becomes 3. Everything else is a wall and stays -1.',
          '',
          'Edge cases: no exits means every cell stays -1; an open region walled off from all exits stays -1; an exit blocked in by walls is just a 0. Cost: every cell enters the queue at most once, O(R × C) time and space.'
        ]),
        code: { py: `from collections import deque

def nearest_exit(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    dist = [[-1] * cols for _ in range(rows)]
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 'E':
                dist[r][c] = 0
                queue.append((r, c))
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == '.' and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist` },
        explain: 'BFS pops cells in non-decreasing distance order, so the first time a cell is written, its value is the distance to the nearest exit. Each cell is enqueued once: O(R × C) time and space.',
        check: J([
          "assert nearest_exit(['E..', '.#.', '..#']) == [[0, 1, 2], [1, -1, 3], [2, 3, -1]]",
          "assert nearest_exit(['E#.']) == [[0, -1, -1]]",
          "assert nearest_exit(['..']) == [[-1, -1]]",
          "assert nearest_exit(['E...E']) == [[0, 1, 2, 1, 0]]",
          "assert nearest_exit(['E']) == [[0]]",
          "assert nearest_exit(['#.#', '.E.']) == [[-1, 1, -1], [1, 0, 1]]"
        ])
      },
      {
        title: 'Meet in the fewest rounds',
        q: J([
          'Two friends stand at nodes `a` and `b` of an undirected graph of `n` towns. Each round, each friend may walk along one road or stay where they are. Return the fewest rounds until both stand in the same town, or `-1` if they can never meet.',
          '',
          'Example: a path `0-1-2-3-4` (`n = 5`, edges `[[0,1],[1,2],[2,3],[3,4]]`), `a = 0`, `b = 4` returns `2` (both walk to town 2).'
        ]),
        hint: 'Compute how far each friend is from every town. A meeting town costs the slower of the two.',
        how: J([
          'I restate it: choose a meeting town v. Friend A needs dist(a, v) rounds, friend B needs dist(b, v) rounds, they walk at the same time and may wait, so the meeting takes max of those two. I want the best v. Brute force would enumerate pairs of walks; that explodes. The key observation is that the walks are independent once v is fixed, so I only need the shortest distance from a and from b to every town.',
          '',
          'Edges cost the same, so BFS from a gives da[v] and BFS from b gives db[v]. Then the answer is the minimum over towns reachable from both of max(da[v], db[v]). Trace on the path with a = 0, b = 4: da = [0,1,2,3,4], db = [4,3,2,1,0]. The maxes are 4,3,2,3,4, minimum 2 at town 2.',
          '',
          'Check a = 0, b = 3 on the same path: da = [0,1,2,3,4], db = [3,2,1,0,1]; maxes 3,2,2,3,4, answer 2. Waiting is allowed, which is why one friend finishing early does not matter.',
          '',
          'Edge cases: a equals b gives 0 (town a has da = db = 0); different components give -1 because no town is reachable from both; a town unreachable from one of them is skipped. Cost: two BFS runs, O(n + m).'
        ]),
        code: { py: `from collections import deque

def meeting_rounds(n, edges, a, b):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    def bfs(s):
        dist = [-1] * n
        dist[s] = 0
        queue = deque([s])
        while queue:
            u = queue.popleft()
            for v in adj[u]:
                if dist[v] == -1:
                    dist[v] = dist[u] + 1
                    queue.append(v)
        return dist

    da, db = bfs(a), bfs(b)
    best = -1
    for v in range(n):
        if da[v] != -1 and db[v] != -1:
            m = max(da[v], db[v])
            if best == -1 or m < best:
                best = m
    return best` },
        explain: 'Once the meeting town is fixed, each friend independently needs their shortest distance, and the meeting time is the larger one. Minimising over all towns is exhaustive and the two BFS runs give exact distances. O(n + m).',
        check: J([
          'path = [[0, 1], [1, 2], [2, 3], [3, 4]]',
          'assert meeting_rounds(5, path, 0, 4) == 2',
          'assert meeting_rounds(5, path, 0, 3) == 2',
          'assert meeting_rounds(5, path, 2, 2) == 0',
          'assert meeting_rounds(4, [[0, 1], [2, 3]], 0, 3) == -1',
          'assert meeting_rounds(2, [[0, 1]], 0, 1) == 1',
          'assert meeting_rounds(1, [], 0, 0) == 0'
        ])
      },
      {
        title: 'Shortest loop',
        q: J([
          'An undirected graph on `n` nodes has no repeated edges and no self-loops. Return the length (number of edges) of its **shortest cycle**, or `-1` if it has none.',
          '',
          'Example: a square with one diagonal, `n = 4`, `edges = [[0,1],[1,2],[2,3],[3,0],[0,2]]` returns `3` (the triangle 0-1-2).'
        ]),
        hint: 'BFS from one node finds shortest distances. What does an edge that is not part of the BFS tree tell you?',
        how: J([
          'I restate it: find the girth of the graph, the length of its smallest loop. Brute force would list every cycle, which can be exponentially many. I want something polynomial.',
          '',
          'Cycle detection in an undirected graph already says: a visited neighbour that is not my parent means a second route. BFS also gives shortest distances. Combine them. Run a BFS from a start node s. When I am at u and see a neighbour v that is already visited and is not u parent, the edge (u, v) is not a tree edge, and the two tree paths from s plus this edge form a closed walk of length dist[u] + dist[v] + 1. That closed walk contains a cycle of at most that length, so it never undercounts, and if s lies on a shortest cycle the formula is exact for that cycle.',
          '',
          'So I do this BFS from **every** node and keep the minimum. Trace on the diagonal square from s = 0: dist 0:0, 1:1, 3:1, 2:1. At node 1, neighbour 2 is visited and not its parent: 1 + 1 + 1 = 3. The answer is 3.',
          '',
          'Edge cases: a tree or a forest never triggers the branch, so I return -1; disconnected pieces are handled because each BFS covers only its piece; the problem forbids duplicate edges, otherwise a doubled edge would need separate handling. Cost: n BFS runs, O(n × (n + m)).'
        ]),
        code: { py: `from collections import deque

def shortest_cycle(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    best = float('inf')
    for s in range(n):
        dist = [-1] * n
        parent = [-1] * n
        dist[s] = 0
        queue = deque([s])
        while queue:
            u = queue.popleft()
            for v in adj[u]:
                if dist[v] == -1:
                    dist[v] = dist[u] + 1
                    parent[v] = u
                    queue.append(v)
                elif v != parent[u]:
                    best = min(best, dist[u] + dist[v] + 1)
    return -1 if best == float('inf') else best` },
        explain: 'Every non-tree edge seen from any start gives a closed walk that contains a cycle no longer than it, so the minimum is never too small; starting from a node on a shortest cycle makes the value exact, so the minimum over all starts is the girth. Time O(n × (n + m)), space O(n + m).',
        check: J([
          'assert shortest_cycle(4, [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]]) == 3',
          'assert shortest_cycle(4, [[0, 1], [1, 2], [2, 3], [3, 0]]) == 4',
          'assert shortest_cycle(4, [[0, 1], [1, 2], [2, 3]]) == -1',
          'assert shortest_cycle(1, []) == -1',
          'assert shortest_cycle(7, [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 4]]) == 3',
          'assert shortest_cycle(5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]) == 5',
          'assert shortest_cycle(2, [[0, 1]]) == -1'
        ])
      }
    ],

    how: {
      200: J([
        'I restate it first: land cells that touch up, down, left or right form one island, and I count the islands. A first idea is, for each land cell, to search the grid for the known island it touches and merge them. That re-scans the grid over and over and is messy. The bottleneck is remembering which land I have already counted.',
        '',
        'The key observation: an island is a connected component, so the first time my scan meets land I have not seen, I have found a new island. After counting it I must visit its entire body so it is never counted again. A BFS flood does that: queue the cell, and for each land neighbour, mark it and queue it. To skip a separate visited set I sink each visited cell by writing "0" into the grid, and I say out loud that this modifies the input.',
        '',
        'Trace on [["1","1","0"],["0","0","0"],["0","0","1"]]: the scan reaches (0,0), count becomes 1, the flood sinks (0,0) and (0,1). The scan continues, finds (2,2), count becomes 2, flood sinks it. Answer 2.',
        '',
        'Edge cases: all water gives 0, a single row or column works with the same bounds checks, diagonal touches do not join islands. Each cell is scanned once and flooded at most once, so O(rows × cols) time.'
      ]),
      133: J([
        'I restate it: given one node of a connected undirected graph, return a deep copy, meaning new node objects with the same shape. The naive recursion "copy this node, then copy each neighbour" never ends, because neighbours point back at each other.',
        '',
        'The bottleneck is knowing whether I have already made a copy of a given original. The key observation: I need a dictionary from original node to its copy. It plays two roles at once, it is the visited set, and it lets me find the copy to wire up when an edge leads to a node I already handled.',
        '',
        'Plan with BFS: create the copy of the start and put it in the dict, queue the start. Take a node u. For each neighbour v of u: if v is not in the dict, create its copy, store it, and queue v. Then append copy[v] to copy[u].neighbors. Trace on the square 1-2-3-4-1: copy of 1 exists; taking 1 creates copies of 2 and 4 and wires them; taking 2 creates 3 and wires 1 and 3; taking 4 reuses 3 and 1; taking 3 reuses everything. Each edge gets wired once from each end.',
        '',
        'Edge cases: a null input returns null; a single node with no neighbours returns a lone copy; a self-loop works because the node is already in the dict. Cost: each node and edge is processed once, O(V + E) time and space.'
      ]),
      695: J([
        'I restate it: find the largest island, measured by number of land cells. Brute force: for each land cell, search for its island and count it. Done carelessly that counts the same island once per cell of it, which wastes a lot of work.',
        '',
        'The key observation is that this is Number of Islands with a size instead of a count. If I count each cell as I visit it and make sure I never visit it again, then the total counted from one starting land cell is exactly the area of its island.',
        '',
        'So I write area(r, c): if the cell is off the grid or is not land, return 0; otherwise sink it (set to 0) so it cannot be counted twice, and return 1 plus the areas of its four neighbours. Then try every cell as a start and keep the maximum. Trace on [[1,1,0],[0,1,0],[1,0,1]]: area(0,0) sinks (0,0), then goes right to (0,1), sinks it, goes down to (1,1), sinks it: total 3. The lone cells (2,0) and (2,2) each give 1. Maximum 3.',
        '',
        'Edge cases: all water returns 0, which is why I use max with a default of 0; a one-cell grid works. A caveat I mention: recursion is as deep as the biggest island, so on a huge island I would switch to a stack or BFS. Cost: every cell is sunk once, so O(rows × cols) time.'
      ]),
      417: J([
        'I restate it: heights in a grid, water flows from a cell to a neighbour of equal or lower height. Return the cells whose water can reach both the Pacific (top and left edges) and the Atlantic (bottom and right edges). Brute force: from every cell, search downhill to see whether it reaches each ocean. That is up to (rows × cols) searches of (rows × cols) each.',
        '',
        'The bottleneck is repeating the same downhill exploration from every start. The key observation: reverse the question. A cell can reach the Pacific exactly when you can walk **uphill** (to equal or higher neighbours) from some Pacific-edge cell to it. So start from all Pacific-edge cells at once and flood uphill; whatever I reach can drain to the Pacific. Do the same from the Atlantic edges. The answer is the intersection of the two reached sets.',
        '',
        'Trace on [[1,2],[2,1]]: the Pacific starts are the top row and left column, which is all of (0,0),(0,1),(1,0). From them uphill adds nothing new, because (1,1) has height 1, lower than its neighbours. The Atlantic starts are the bottom row and right column: (1,0),(1,1),(0,1). Intersection is (0,1) and (1,0).',
        '',
        'Edge cases: a single cell is in both sets; a flat grid returns everything. Cost: two floods over the grid, O(rows × cols) time and space.'
      ]),
      130: J([
        'I restate it: a board of X and O. Every group of O cells that is completely surrounded by X (not touching the border) must be flipped to X. Brute force: for each O group, flood it and check whether it touches the border, then flip or not. That works, but I would have to remember the cells of each group before deciding.',
        '',
        'The key observation: decide the opposite way round. An O is safe exactly when it is connected, through other O cells, to a border O. So find the safe ones first. Start a flood from every O on the border and mark everything reached with a temporary letter S. After that, every O left over is surrounded, so it becomes X, and every S goes back to O.',
        '',
        'Trace on a board with X O X / X O X / X X X: the border O at (0,1) is safe; the flood marks (0,1) and (1,1) as S. The final sweep turns S back to O and leaves no other O. Result unchanged. On a board with a single interior O, nothing on the border is O, nothing is marked, and the sweep turns it into X.',
        '',
        'Edge cases: a board with no O at all, a board of only O (all are on borders or connected to them), tiny boards with no interior. Three passes, each O(rows × cols); the queue holds at most one frontier. Remember the function edits the board in place.'
      ]),
      994: J([
        'I restate it: oranges are fresh, rotten or absent. Each minute every fresh orange touching a rotten one rots. Return the minutes until none are fresh, or -1 if some never rot. The simulation idea, rescan the grid each minute, rescans cells over and over and also needs care so one minute does not chain.',
        '',
        'The key observation: the rot spreads from all rotten oranges at the same pace, one ring per minute. That is a multi-source BFS: put every initial rotten orange in the queue and count the fresh ones. Process the queue one ring at a time, freezing its length at the start of each ring; each ring costs a minute. When an orange rots I decrement the fresh counter and queue it.',
        '',
        'Trace on [[2,1,1],[1,1,0],[0,1,1]]: rotten at (0,0), fresh = 6. Minute 1: (0,1),(1,0) rot, fresh 4. Minute 2: (0,2),(1,1) rot, fresh 2. Minute 3: (2,1) rots, fresh 1. Minute 4: (2,2) rots, fresh 0. Answer 4.',
        '',
        'The loop condition includes the fresh counter so I do not add an extra minute when the last ring rots nothing. At the end, any fresh left means it was cut off, so return -1. Edge cases: no fresh oranges returns 0 even with no rotten ones; fresh but no rotten returns -1. Cost: O(rows × cols).'
      ]),
      286: J([
        'I restate it: a grid of rooms where 0 is a gate, -1 is a wall and a very large number means an empty room. Fill each empty room with its distance to the nearest gate, leaving unreachable rooms as they are. Brute force: BFS from every room until it meets a gate, which repeats almost the same work for every room.',
        '',
        'The bottleneck is that many searches overlap. The key observation: distance to the nearest gate equals distance from the gate set. So start one BFS with **all gates** queued at distance 0, a multi-source BFS. The ring that first touches a room comes from its nearest gate.',
        '',
        'The nice trick is that the big "infinity" value doubles as the visited mark. A neighbour is processed only if it still holds infinity; I write distance + 1 into it (which marks it) and queue it. Walls are -1 and gates are 0, so neither matches infinity and they are skipped. Trace on [0, INF, INF]: gate at index 0 is queued; take it, index 1 becomes 1; take index 1, index 2 becomes 2. Result [0, 1, 2].',
        '',
        'Edge cases: no gates leaves everything untouched; a room walled off from gates stays at infinity, which is what the problem wants; a room between two gates gets the smaller distance because the nearer ring arrives first. Cost: each room is queued once, O(rows × cols).'
      ]),
      127: J([
        'I restate it: change one letter at a time, each intermediate word must be in the list, and I want the number of words in the shortest sequence from begin to end, or 0 if none. Brute force: try every sequence of words, which is exponential.',
        '',
        'The key observation: this is a graph in disguise. Words are nodes, and two words are neighbours when they differ in exactly one letter. Shortest path with every edge costing one is BFS. I do not need to build the whole graph: to find the neighbours of a word, change each of its letters to each of the 26 letters and keep results that are in the word set and unseen.',
        '',
        'State: a queue of words, a seen set (taken from the word set), and a count of rings starting at 1 because the answer counts words. Trace on hit to cog with [hot,dot,dog,lot,log,cog]: ring 1 is hit; ring 2 is hot; ring 3 is dot, lot; ring 4 is dog, log; ring 5 reaches cog. Answer 5.',
        '',
        'Edge cases: if the end word is not in the list return 0 immediately; begin equal to end is not possible by the statement, but the begin word itself need not be in the list. Cost: each word is processed once and generates length × 26 candidates, each costing about length to build, so O(N × L² × 26) time.'
      ]),
      785: J([
        'I restate it: can I split all nodes into two groups so every edge joins one node from each group? Brute force would try all 2 to the n assignments. Too many.',
        '',
        'The key observation: once I put one node in group 0, all its neighbours are forced into group 1, their neighbours are forced into group 0, and so on. There is no real choice inside a connected piece, so I can simply colour as I walk. If I ever meet a neighbour that already has the same colour as the current node, the forced assignment fails, and the answer is false. The deeper fact is that this fails exactly when the graph has an odd cycle.',
        '',
        'Structure: a colour array with -1 for uncoloured, and a walk (BFS or DFS, the stored solution uses a stack). The graph may have several pieces, so I start a fresh walk from every uncoloured node. Trace on the triangle [[1,2],[0,2],[0,1]]: colour 0 gets 0, then 1 and 2 get 1; later 1 sees neighbour 2 with the same colour 1, so return false. On the square [[1,3],[0,2],[1,3],[0,2]] colours alternate 0,1,0,1 and all is well.',
        '',
        'Edge cases: a single isolated node is fine, disconnected pieces are each checked. Cost: O(V + E).'
      ]),
      1091: J([
        'I restate it: from the top-left to the bottom-right of a grid of 0 and 1, moving through zero cells in any of eight directions, find the length of the shortest path counted in cells, or -1. Brute force: explore all paths with backtracking, which is exponential.',
        '',
        'The key observation: each step costs the same, so this is a shortest path with equal edges, which is BFS. The only twist from the usual grid is eight neighbours instead of four. Since the answer counts cells, not moves, I start the count at 1.',
        '',
        'First check the endpoints: if the start or the end is blocked, return -1 at once. Then queue the start, mark it seen, and process the queue ring by ring, freezing its length. When I take the target cell I return the current ring count; after finishing a ring without success I add 1. I mark cells seen when I add them. Trace on [[0,1],[1,0]]: ring 1 is (0,0); its diagonal neighbour (1,1) is open and joins ring 2; taking it gives answer 2.',
        '',
        'Edge cases: a 1 by 1 grid with 0 returns 1; a blocked end returns -1; no route returns -1 when the queue empties. Cost: each cell enters once and checks 8 neighbours, O(n²) for an n by n grid.'
      ]),
      463: J([
        'I restate it: one island of land cells in a grid, return the length of its outer edge, counting every unit side that faces water or the border. A search-based idea, walk the island and count exposed sides, works but is more machinery than needed.',
        '',
        'The key observation is local. Every land cell contributes four sides. Whenever two land cells share a side, that side is hidden from both, which removes 2 from the total. So the perimeter is 4 × (number of land cells) minus 2 × (number of touching pairs). No traversal needed, and no need to even know the cells form one island.',
        '',
        'To count each touching pair once, only look at the neighbour below and the neighbour to the right of every land cell. Trace on [[1,1]]: two land cells, one touching pair (the right neighbour of the first). 4 × 2 - 2 × 1 = 6. Check by drawing: a 1 by 2 rectangle has perimeter 6. On a plus shape of 5 cells there are 4 touching pairs: 20 - 8 = 12, matching the picture.',
        '',
        'Edge cases: a single cell gives 4; a grid with water only is not given by the statement, but the formula would give 0. Cost: one pass over the grid, O(rows × cols) time and O(1) extra space.'
      ])
    }
  };
})();
