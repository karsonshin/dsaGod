(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  OR.qa.push(
{
  id: "cp-astar-grid", cat: "Graphs: search", title: "A* search on a grid (Manhattan heuristic)",
  q: ["a star search python", "implement a* on a grid", "how does a* algorithm work", "a* pathfinding code", "a* vs dijkstra", "what is an admissible heuristic", "a star algorithm explained", "when to use a* search"],
  tags: "astar a-star a star heuristic search pathfinding grid manhattan admissible consistent open list closed list f g h tie-breaking",
  a: "A* expands the node with the smallest f = g + h, where g is the cost so far and h is a heuristic estimate to the goal. With an admissible (never overestimating) heuristic it returns a shortest path, usually expanding far fewer nodes than Dijkstra. Use it when you have one goal and a good distance estimate.",
  code: { py: `import heapq

def astar_grid(grid, start, goal):
    """grid: list of strings, '#' is a wall. 4-direction moves, cost 1. Returns the path or None."""
    R, C = len(grid), len(grid[0])
    h = lambda p: abs(p[0] - goal[0]) + abs(p[1] - goal[1])   # Manhattan: admissible and consistent here
    g = {start: 0}
    parent = {start: None}
    pq = [(h(start), 0, start)]            # (f, -g, cell): on equal f prefer the deeper node
    done = set()
    while pq:
        _, _, u = heapq.heappop(pq)
        if u in done:
            continue
        if u == goal:
            path = []
            while u is not None:
                path.append(u)
                u = parent[u]
            return path[::-1]
        done.add(u)
        r, c = u
        for v in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= v[0] < R and 0 <= v[1] < C and grid[v[0]][v[1]] != '#':
                ng = g[u] + 1
                if ng < g.get(v, 10**9):
                    g[v] = ng
                    parent[v] = u
                    heapq.heappush(pq, (ng + h(v), -ng, v))
    return None

maze = ["....#", ".##.#", "....."]
print(astar_grid(maze, (0, 0), (2, 4)))   # [(0,0),(0,1),(0,2),(0,3),(1,3),(2,3),(2,4)]`,
  },
  check: `import random
from collections import deque
def bfs_len(grid, s, t):
    R, C = len(grid), len(grid[0]); d = {s: 0}; q = deque([s])
    while q:
        r, c = q.popleft()
        if (r, c) == t: return d[t]
        for v in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0 <= v[0] < R and 0 <= v[1] < C and grid[v[0]][v[1]] != '#' and v not in d:
                d[v] = d[(r, c)] + 1; q.append(v)
    return None
random.seed(5)
for _ in range(300):
    R, C = random.randint(1, 8), random.randint(1, 8)
    grid = [''.join('#' if random.random() < 0.3 else '.' for _ in range(C)) for _ in range(R)]
    s = (random.randrange(R), random.randrange(C)); t = (random.randrange(R), random.randrange(C))
    grid = [list(x) for x in grid]; grid[s[0]][s[1]] = '.'; grid[t[0]][t[1]] = '.'; grid = [''.join(x) for x in grid]
    p = astar_grid(grid, s, t); b = bfs_len(grid, s, t)
    if b is None: assert p is None
    else:
        assert len(p) - 1 == b and p[0] == s and p[-1] == t
        assert all(abs(p[i][0]-p[i+1][0]) + abs(p[i][1]-p[i+1][1]) == 1 for i in range(len(p)-1))
assert astar_grid(["..", ".."], (0, 0), (0, 0)) == [(0, 0)]
assert astar_grid([".#."], (0, 0), (0, 2)) is None`,
  more: "- Admissible: h never exceeds the true remaining cost. Consistent: h(u) <= w(u,v) + h(v); then each node is expanded once and the first pop of the goal is optimal.\n- With h = 0 it is exactly Dijkstra. A larger (still admissible) h means fewer expansions.\n- Tie-breaking on equal f: prefer larger g (smaller h) so the search dives toward the goal instead of fanning out.\n- Trap: an overestimating h (for example Manhattan when diagonal moves are allowed) can return a non-shortest path.\n- Closest alternative: BFS for unit costs without a goal estimate, Dijkstra for all-targets.",
  cx: "Time O(E log V) worst case (same as Dijkstra), typically far fewer expansions with a good h; space O(V) for g, parent and the queue",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs", "#/cheatsheets/graphs", "#/problem/1091"]
},
{
  id: "cp-astar-weighted-graph", cat: "Graphs: search", title: "A* on a weighted graph with coordinates",
  q: ["a star on a weighted graph", "a* shortest path with euclidean heuristic", "a* road network python", "a* with node coordinates", "implement a* for a graph", "a* code adjacency list", "a* euclidean distance heuristic", "a* admissible heuristic for road maps"],
  tags: "astar a-star euclidean heuristic coordinates road map weighted graph geometric lower bound admissible",
  a: "Run Dijkstra but order the heap by g + h, where h(v) is the straight-line distance from v to the goal. It stays optimal as long as every edge weight is at least the straight-line distance of its endpoints, because then h never overestimates.",
  code: { py: `import heapq, math

def astar(adj, pos, s, t):
    """adj: {u: [(v, w)]}, pos: {u: (x, y)}. Requires w >= euclidean(u, v). Returns (cost, path) or (inf, None)."""
    h = lambda u: math.dist(pos[u], pos[t])
    g = {s: 0.0}
    parent = {s: None}
    pq = [(h(s), s)]
    done = set()
    while pq:
        _, u = heapq.heappop(pq)
        if u in done:
            continue
        if u == t:
            path = []
            while u is not None:
                path.append(u)
                u = parent[u]
            return g[t], path[::-1]
        done.add(u)
        for v, w in adj.get(u, []):
            if g[u] + w < g.get(v, math.inf):
                g[v] = g[u] + w
                parent[v] = u
                heapq.heappush(pq, (g[v] + h(v), v))
    return math.inf, None

pos = {0: (0, 0), 1: (3, 0), 2: (3, 4), 3: (6, 4)}
adj = {0: [(1, 3), (2, 6)], 1: [(2, 4), (3, 7)], 2: [(3, 3)]}
print(astar(adj, pos, 0, 3))   # (9.0, [0, 2, 3])`,
  },
  check: `import random, heapq, math
def dijk(adj, s):
    d = {s: 0.0}; pq = [(0.0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for v, w in adj.get(u, []):
            if x + w < d.get(v, math.inf):
                d[v] = x + w; heapq.heappush(pq, (d[v], v))
    return d
random.seed(2)
for _ in range(200):
    n = random.randint(2, 12)
    pos = {i: (random.uniform(0, 10), random.uniform(0, 10)) for i in range(n)}
    adj = {i: [] for i in range(n)}
    for _ in range(random.randint(1, 3 * n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b: adj[a].append((b, math.dist(pos[a], pos[b]) * random.uniform(1, 2)))
    s, t = random.randrange(n), random.randrange(n)
    c, p = astar(adj, pos, s, t); d = dijk(adj, s).get(t, math.inf)
    assert math.isclose(c, d) or (c == d == math.inf)
    if p: assert p[0] == s and p[-1] == t
assert astar({0: []}, {0: (0, 0), 1: (1, 1)}, 0, 1)[1] is None`,
  more: "- Edge weights must be >= straight-line distance between endpoints (a road is never shorter than the crow-flies distance). Violate this and the answer can be wrong.\n- With a consistent h, a closed set is safe: each node is finalized on first pop.\n- Use the same units for g and h; mixing minutes with kilometres makes h inadmissible or useless.\n- Closest alternative: plain Dijkstra when there is no coordinate/lower-bound information; ALT landmarks when you can precompute distances.",
  cx: "Time O(E log V) worst case, usually much less than Dijkstra; space O(V)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs", "#/cheatsheets/graphs"]
},
{
  id: "cp-weighted-astar", cat: "Graphs: search", title: "Weighted A* (bounded suboptimal search)",
  q: ["weighted a star", "weighted a* python", "faster a* with suboptimal path", "a* with inflated heuristic", "epsilon admissible search", "trade path quality for speed a*", "what does the weight do in weighted a*", "greedy vs weighted a*"],
  tags: "weighted a-star astar suboptimal bounded epsilon inflate heuristic anytime speed",
  a: "Weighted A* orders nodes by f = g + w*h with w >= 1. It expands fewer nodes than A* and the path it returns costs at most w times the optimum (for a consistent h). w = 1 is plain A*; a huge w behaves like greedy best-first.",
  code: { py: `import heapq

def weighted_astar(grid, start, goal, w=1.5):
    """Grid of '.'/'#', 4-moves, unit cost, Manhattan h. Returns (path or None, expansions)."""
    R, C = len(grid), len(grid[0])
    h = lambda p: abs(p[0] - goal[0]) + abs(p[1] - goal[1])
    g = {start: 0}
    parent = {start: None}
    pq = [(w * h(start), start)]
    done = set()
    while pq:
        _, u = heapq.heappop(pq)
        if u in done:
            continue
        if u == goal:
            path = []
            while u is not None:
                path.append(u)
                u = parent[u]
            return path[::-1], len(done)
        done.add(u)
        r, c = u
        for v in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= v[0] < R and 0 <= v[1] < C and grid[v[0]][v[1]] != '#' and g[u] + 1 < g.get(v, 10**9):
                g[v] = g[u] + 1
                parent[v] = u
                heapq.heappush(pq, (g[v] + w * h(v), v))
    return None, len(done)

grid = ["...........", "..#######..", "...........", "..........."]
for w in (1, 3):
    p, n = weighted_astar(grid, (0, 0), (3, 10), w)
    print(w, len(p) - 1, n)   # 1 13 36 then 3 13 13: same length here, far fewer expansions with w=3`,
  },
  check: `import random
from collections import deque
def bfs_len(grid, s, t):
    R, C = len(grid), len(grid[0]); d = {s: 0}; q = deque([s])
    while q:
        r, c = q.popleft()
        for v in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0 <= v[0] < R and 0 <= v[1] < C and grid[v[0]][v[1]] != '#' and v not in d:
                d[v] = d[(r, c)] + 1; q.append(v)
    return d.get(t)
random.seed(9)
for _ in range(300):
    R, C = random.randint(2, 9), random.randint(2, 9)
    grid = [[('#' if random.random() < 0.25 else '.') for _ in range(C)] for _ in range(R)]
    grid[0][0] = '.'; grid[R-1][C-1] = '.'; grid = [''.join(x) for x in grid]
    opt = bfs_len(grid, (0, 0), (R-1, C-1))
    for w in (1, 1.5, 3):
        p, _ = weighted_astar(grid, (0, 0), (R-1, C-1), w)
        if opt is None: assert p is None
        else:
            assert len(p) - 1 <= w * opt + 1e-9 and len(p) - 1 >= opt
            if w == 1: assert len(p) - 1 == opt`,
  more: "- Guarantee: cost(path) <= w * optimal when h is consistent (and admissible).\n- Bigger w means fewer expansions and a possibly longer path; pick w from how much extra length you can tolerate (w = 1.2 allows 20 percent).\n- Not for correctness-critical optimal routing; use plain A* there.\n- Anytime variants (ARA*) start with large w and shrink it as time allows.",
  cx: "Time O(E log V) worst case, practically much faster than A* for w > 1; space O(V)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs"]
},
{
  id: "cp-bidirectional-bfs", cat: "Graphs: search", title: "Bidirectional BFS",
  q: ["bidirectional bfs", "bidirectional search python", "meet in the middle shortest path", "bfs from both ends", "speed up bfs shortest path", "bidirectional bfs word ladder", "how does bidirectional search work", "when to use bidirectional bfs"],
  tags: "bidirectional bfs two ended search meet in the middle word ladder frontier shortest path unweighted",
  a: "Search from the start and from the goal at the same time, always expanding the smaller frontier by one full level, and stop when the two searches touch. For branching factor b and distance d it explores about 2*b^(d/2) nodes instead of b^d.",
  code: { py: `def bidirectional_bfs(adj, s, t):
    """Unweighted undirected graph {u: [v, ...]}. Returns the number of edges on a shortest path, or -1."""
    if s == t:
        return 0
    dist = [{s: 0}, {t: 0}]
    frontier = [[s], [t]]
    while frontier[0] and frontier[1]:
        side = 0 if len(frontier[0]) <= len(frontier[1]) else 1
        other = 1 - side
        best = None
        nxt = []
        for u in frontier[side]:
            for v in adj.get(u, []):
                if v in dist[other]:
                    cand = dist[side][u] + 1 + dist[other][v]
                    best = cand if best is None else min(best, cand)
                if v not in dist[side]:
                    dist[side][v] = dist[side][u] + 1
                    nxt.append(v)
        if best is not None:       # finish the whole level before answering
            return best
        frontier[side] = nxt
    return -1

g = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2, 4], 4: [3]}
print(bidirectional_bfs(g, 0, 4))   # 3`,
  },
  check: `import random
from collections import deque
def bfs(adj, s, t):
    d = {s: 0}; q = deque([s])
    while q:
        u = q.popleft()
        for v in adj.get(u, []):
            if v not in d: d[v] = d[u] + 1; q.append(v)
    return d.get(t, -1)
random.seed(1)
for _ in range(500):
    n = random.randint(1, 14); adj = {i: [] for i in range(n)}
    for _ in range(random.randint(0, 2 * n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b and b not in adj[a]: adj[a].append(b); adj[b].append(a)
    s, t = random.randrange(n), random.randrange(n)
    assert bidirectional_bfs(adj, s, t) == bfs(adj, s, t)
assert bidirectional_bfs({0: [], 1: []}, 0, 1) == -1
assert bidirectional_bfs({0: []}, 0, 0) == 0`,
  more: "- Expand whole levels and take the minimum over all meeting edges; stopping at the first touch can be off by one.\n- Requires being able to walk edges backwards (undirected, or keep a reverse adjacency for the goal side).\n- Needs a known goal; if you do not know the target state, it does not apply.\n- Helps most when branching is large (word ladder, puzzle states). On a path-like graph it gains little.\n- Weighted version: bidirectional Dijkstra.",
  cx: "Time about O(b^(d/2)) per side versus O(b^d) for one-sided BFS (worst case O(V+E)); space O(V)",
  see: ["#/topic/graphs", "#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-bidirectional-dijkstra", cat: "Graphs: shortest paths", title: "Bidirectional Dijkstra",
  q: ["bidirectional dijkstra", "dijkstra from both ends", "bidirectional dijkstra stopping condition", "faster dijkstra single pair", "bidirectional dijkstra python", "when to stop bidirectional dijkstra", "two sided shortest path search", "bidirectional dijkstra vs dijkstra"],
  tags: "bidirectional dijkstra two sided forward backward search reverse graph stopping criterion mu single pair",
  a: "Run Dijkstra forward from s on the graph and backward from t on the reversed graph. Track mu, the best s-t length seen when a relaxed edge reaches the other side. Stop when the two top heap keys sum to at least mu; mu is then the answer.",
  code: { py: `import heapq
INF = float('inf')

def bidirectional_dijkstra(adj, radj, s, t):
    """adj / radj: {u: [(v, w)]} forward and reversed graph, w >= 0. Returns distance or INF."""
    if s == t:
        return 0
    dist = [{s: 0}, {t: 0}]
    done = [set(), set()]
    pq = [[(0, s)], [(0, t)]]
    graph = [adj, radj]
    mu = INF
    while pq[0] and pq[1]:
        if pq[0][0][0] + pq[1][0][0] >= mu:
            break
        side = 0 if pq[0][0][0] <= pq[1][0][0] else 1
        d, u = heapq.heappop(pq[side])
        if u in done[side]:
            continue
        done[side].add(u)
        for v, w in graph[side].get(u, []):
            nd = d + w
            if nd < dist[side].get(v, INF):
                dist[side][v] = nd
                heapq.heappush(pq[side], (nd, v))
            if v in dist[1 - side]:
                mu = min(mu, nd + dist[1 - side][v])
    return mu

adj = {0: [(1, 2), (2, 5)], 1: [(2, 1), (3, 7)], 2: [(3, 2)]}
radj = {}
for u in adj:
    for v, w in adj[u]:
        radj.setdefault(v, []).append((u, w))
print(bidirectional_dijkstra(adj, radj, 0, 3))   # 5`,
  },
  check: `import random, heapq
def dijk(adj, s, t):
    d = {s: 0}; pq = [(0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for v, w in adj.get(u, []):
            if x + w < d.get(v, INF): d[v] = x + w; heapq.heappush(pq, (x + w, v))
    return d.get(t, INF)
random.seed(4)
for _ in range(500):
    n = random.randint(1, 12); adj = {}; radj = {}
    for _ in range(random.randint(0, 3 * n)):
        a, b, w = random.randrange(n), random.randrange(n), random.randint(0, 9)
        adj.setdefault(a, []).append((b, w)); radj.setdefault(b, []).append((a, w))
    s, t = random.randrange(n), random.randrange(n)
    assert bidirectional_dijkstra(adj, radj, s, t) == dijk(adj, s, t)
assert bidirectional_dijkstra({}, {}, 0, 1) == INF`,
  more: "- Do NOT stop when the searches first meet: the first meeting edge is not necessarily on a shortest path. The criterion topF + topB >= mu is what guarantees optimality.\n- Needs non-negative weights and a reverse adjacency for directed graphs.\n- Typical speedup is about 2x on road networks; the big wins come from adding A* potentials or contraction hierarchies.\n- Alternative: plain Dijkstra with early exit at t.",
  cx: "Time O((V+E) log V) worst case, usually visits about half the nodes of one-sided Dijkstra; space O(V)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs"]
},
{
  id: "cp-ida-star", cat: "Game and AI search", title: "IDA* (iterative deepening A*)",
  q: ["ida star", "ida* algorithm python", "iterative deepening a star", "solve 8 puzzle with ida*", "memory efficient a*", "ida* vs a*", "explain ida* search", "ida* implementation"],
  tags: "ida-star idastar iterative deepening a star 8 puzzle sliding puzzle f bound threshold memory heuristic",
  a: "IDA* runs a depth-first search that prunes any node whose f = g + h exceeds a bound. If the goal is not found, the bound is raised to the smallest f that was pruned, and the search repeats. It finds optimal solutions with an admissible h using only O(depth) memory.",
  code: { py: `INF = float('inf')
GOAL = (1, 2, 3, 4, 5, 6, 7, 8, 0)

def ida_star(start, goal=GOAL):
    """8-puzzle (tuple of 9, 0 = blank). Returns the list of states to the goal. Start must be solvable."""
    where = {v: i for i, v in enumerate(goal)}
    def h(s):   # sum of Manhattan distances of tiles
        return sum(abs(i // 3 - where[v] // 3) + abs(i % 3 - where[v] % 3) for i, v in enumerate(s) if v)
    path = [start]
    def dfs(g, bound):
        s = path[-1]
        f = g + h(s)
        if f > bound:
            return f
        if s == goal:
            return True
        smallest = INF
        z = s.index(0)
        r, c = divmod(z, 3)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < 3 and 0 <= nc < 3:
                t = list(s)
                j = nr * 3 + nc
                t[z], t[j] = t[j], t[z]
                t = tuple(t)
                if len(path) > 1 and t == path[-2]:
                    continue                      # do not undo the last move
                path.append(t)
                res = dfs(g + 1, bound)
                if res is True:
                    return True
                path.pop()
                smallest = min(smallest, res)
        return smallest
    bound = h(start)
    while True:
        res = dfs(0, bound)
        if res is True:
            return path
        bound = res

print(len(ida_star((1, 2, 3, 4, 0, 6, 7, 5, 8))) - 1)   # 2 moves`,
  },
  check: `import random
from collections import deque
random.seed(3)
def nbrs(s):
    z = s.index(0); r, c = divmod(z, 3)
    for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < 3 and 0 <= nc < 3:
            t = list(s); j = nr * 3 + nc; t[z], t[j] = t[j], t[z]; yield tuple(t)
dist = {GOAL: 0}; q = deque([GOAL])
while q:
    u = q.popleft()
    if dist[u] >= 12: continue
    for v in nbrs(u):
        if v not in dist: dist[v] = dist[u] + 1; q.append(v)
for _ in range(6):
    s = GOAL
    for _ in range(random.randint(0, 14)): s = random.choice(list(nbrs(s)))
    p = ida_star(s)
    assert p[0] == s and p[-1] == GOAL
    assert all(b in set(nbrs(a)) for a, b in zip(p, p[1:]))
    if s in dist: assert len(p) - 1 == dist[s]
assert ida_star(GOAL) == [GOAL]`,
  more: "- Each iteration is a bounded DFS; the next bound is the minimum f that exceeded the current one, so no cheaper solution is skipped.\n- Memory is O(solution depth) versus A* storing every generated node, which is why it is used for puzzles and large state spaces.\n- Cost: nodes are re-expanded each iteration and there is no duplicate detection beyond undoing the last move, so it can be slower than A* when the graph has many cycles.\n- Check solvability first (inversion parity for the 8-puzzle) or it loops forever.",
  cx: "Time O(b^d) worst case (heuristic prunes a lot in practice), with repeated work of a constant factor; space O(d) where d is the solution depth",
  see: ["#/topic/backtracking", "#/topic/advanced-graphs"]
},
{
  id: "cp-iddfs", cat: "Graphs: search", title: "Iterative deepening DFS (IDDFS)",
  q: ["iterative deepening dfs", "iddfs python", "depth limited search", "dfs that finds shortest path", "iterative deepening vs bfs", "how does iterative deepening work", "iddfs code", "when to use iterative deepening"],
  tags: "iddfs id-dfs iterative deepening depth first depth limited search dls memory shortest path unweighted",
  a: "Run depth-limited DFS with limit 0, 1, 2, ... until the goal is found. It returns a shortest (fewest edges) path like BFS but only needs O(depth) memory, at the price of re-visiting upper levels. Use it on huge or implicit state spaces where the BFS queue would not fit.",
  code: { py: `def iddfs(adj, s, t, max_depth=50):
    """Returns a path with the fewest edges from s to t, or None. adj: {u: [v, ...]}."""
    def dls(u, limit, path):
        if u == t:
            return list(path)
        if limit == 0:
            return None
        for v in adj.get(u, []):
            if v not in path:                 # avoid cycles on the current path only
                path.append(v)
                found = dls(v, limit - 1, path)
                path.pop()
                if found:
                    return found
        return None
    for limit in range(max_depth + 1):
        res = dls(s, limit, [s])
        if res:
            return res
    return None

g = {'A': ['B', 'C'], 'B': ['D'], 'C': ['D', 'E'], 'D': ['F'], 'E': ['F'], 'F': []}
print(iddfs(g, 'A', 'F'))   # ['A', 'B', 'D', 'F']`,
  },
  check: `import random
from collections import deque
def bfs(adj, s, t):
    d = {s: 0}; q = deque([s])
    while q:
        u = q.popleft()
        for v in adj.get(u, []):
            if v not in d: d[v] = d[u] + 1; q.append(v)
    return d.get(t)
random.seed(8)
for _ in range(300):
    n = random.randint(1, 9); adj = {i: [] for i in range(n)}
    for _ in range(random.randint(0, 2 * n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b: adj[a].append(b)
    s, t = random.randrange(n), random.randrange(n)
    p = iddfs(adj, s, t, max_depth=n)
    b = bfs(adj, s, t)
    if b is None: assert p is None
    else:
        assert len(p) - 1 == b and p[0] == s and p[-1] == t
        assert all(y in adj[x] for x, y in zip(p, p[1:]))`,
  more: "- Completeness and optimality (unit edge costs) of BFS with the memory of DFS.\n- The overhead is small: in a tree with branching b the last level dominates, so the repeated shallow levels cost only a factor of about b/(b-1).\n- Guard against cycles with the current path; with a global visited set the depth-limited search can wrongly prune shorter routes.\n- On a dense graph with many cycles it can be exponentially slower than BFS. Use it only when BFS memory is the problem.",
  cx: "Time O(b^d) (b = branching factor, d = solution depth; worst case exponential in V on cyclic graphs); space O(d)",
  see: ["#/topic/graphs", "#/topic/recursion", "#/cheatsheets/graphs"]
},
{
  id: "cp-uniform-cost-search", cat: "Graphs: search", title: "Uniform-cost search",
  q: ["uniform cost search", "ucs algorithm python", "uniform cost search vs dijkstra", "uniform cost search implementation", "cheapest path to a goal state", "ucs for implicit graphs", "what is uniform cost search", "uniform cost search code"],
  tags: "ucs uniform cost search dijkstra goal test state space priority queue lowest cost first implicit graph",
  a: "Uniform-cost search is Dijkstra for a single goal on an implicit state space: pop the cheapest frontier state, and test for the goal when a state is popped (not when it is generated). It is optimal for non-negative step costs and works when the graph is generated lazily by a neighbors function.",
  code: { py: `import heapq
from itertools import count

def uniform_cost_search(start, is_goal, neighbors):
    """neighbors(state) -> iterable of (next_state, step_cost >= 0). Returns (cost, path) or None."""
    tie = count()
    pq = [(0, next(tie), start)]
    best = {start: 0}
    parent = {start: None}
    done = set()
    while pq:
        cost, _, s = heapq.heappop(pq)
        if s in done:
            continue
        if is_goal(s):                      # goal test on POP, not on push
            path = []
            while s is not None:
                path.append(s)
                s = parent[s]
            return cost, path[::-1]
        done.add(s)
        for nxt, w in neighbors(s):
            nc = cost + w
            if nc < best.get(nxt, float('inf')):
                best[nxt] = nc
                parent[nxt] = s
                heapq.heappush(pq, (nc, next(tie), nxt))
    return None

# cheapest way to turn 1 into 10 with +1 (cost 2) and *2 (cost 3)
print(uniform_cost_search(1, lambda x: x == 10, lambda x: [(x + 1, 2), (x * 2, 3)] if x < 20 else []))
# (10, [1, 2, 4, 5, 10])`,
  },
  check: `import itertools
def brute(start, goal, nbrs, limit=12):
    best = None
    for k in range(limit + 1):
        for ops in itertools.product(range(2), repeat=k):
            x, c = start, 0
            for o in ops:
                (x, w) = nbrs(x)[o]; c += w
                if x > 20: break
            else:
                if x == goal and (best is None or c < best): best = c
    return best
nb = lambda x: [(x + 1, 2), (x * 2, 3)]
for goal in range(1, 18):
    r = uniform_cost_search(1, lambda x: x == goal, lambda x: nb(x) if x < 20 else [])
    assert r[0] == brute(1, goal, nb)
    assert r[1][0] == 1 and r[1][-1] == goal
assert uniform_cost_search(5, lambda x: x == 3, lambda x: nb(x) if x < 20 else []) is None
assert uniform_cost_search(7, lambda x: x == 7, lambda x: []) == (0, [7])`,
  more: "- Equivalent to Dijkstra stopped at the goal; the state space does not have to be a stored graph.\n- Testing for the goal when generating a state can return a non-optimal path; test on pop.\n- Costs must be >= 0. With all costs equal it behaves like BFS.\n- The tie counter stops Python from comparing states when costs are equal (states may not be orderable).\n- With a distance estimate use A* instead.",
  cx: "Time O((V+E) log V) in the explored part of the graph, space O(V) for the frontier and visited states",
  see: ["#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-greedy-best-first", cat: "Graphs: search", title: "Greedy best-first search",
  q: ["greedy best first search", "best first search python", "greedy search vs a star", "greedy best first search implementation", "is greedy best first search optimal", "heuristic only search", "best first search pathfinding", "when to use greedy best first search"],
  tags: "greedy best first search heuristic only h priority queue not optimal pathfinding fast",
  a: "Greedy best-first search always expands the node with the smallest heuristic h (estimated distance to the goal) and ignores the cost so far. It is fast and often finds a path with few expansions, but the path is not guaranteed to be shortest. Use it when speed matters more than optimality.",
  code: { py: `import heapq

def greedy_best_first(grid, start, goal):
    """Grid of '.'/'#', 4-moves. Returns a path (not necessarily shortest) or None."""
    R, C = len(grid), len(grid[0])
    h = lambda p: abs(p[0] - goal[0]) + abs(p[1] - goal[1])
    parent = {start: None}
    pq = [(h(start), start)]
    while pq:
        _, u = heapq.heappop(pq)
        if u == goal:
            path = []
            while u is not None:
                path.append(u)
                u = parent[u]
            return path[::-1]
        r, c = u
        for v in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= v[0] < R and 0 <= v[1] < C and grid[v[0]][v[1]] != '#' and v not in parent:
                parent[v] = u
                heapq.heappush(pq, (h(v), v))
    return None

grid = ["....", ".##.", "...."]
print(len(greedy_best_first(grid, (0, 0), (2, 3))) - 1)   # 5`,
  },
  check: `import random
from collections import deque
def bfs_len(grid, s, t):
    R, C = len(grid), len(grid[0]); d = {s: 0}; q = deque([s])
    while q:
        r, c = q.popleft()
        for v in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
            if 0 <= v[0] < R and 0 <= v[1] < C and grid[v[0]][v[1]] != '#' and v not in d:
                d[v] = d[(r, c)] + 1; q.append(v)
    return d.get(t)
random.seed(6); longer = 0
for _ in range(400):
    R, C = random.randint(2, 9), random.randint(2, 9)
    grid = [[('#' if random.random() < 0.3 else '.') for _ in range(C)] for _ in range(R)]
    grid[0][0] = '.'; grid[R-1][C-1] = '.'; grid = [''.join(x) for x in grid]
    p = greedy_best_first(grid, (0, 0), (R-1, C-1)); b = bfs_len(grid, (0, 0), (R-1, C-1))
    if b is None: assert p is None
    else:
        assert p[0] == (0, 0) and p[-1] == (R-1, C-1) and len(p) - 1 >= b
        assert all(abs(x[0]-y[0]) + abs(x[1]-y[1]) == 1 and grid[y[0]][y[1]] == '.' for x, y in zip(p, p[1:]))
        longer += len(p) - 1 > b
assert longer > 0   # greedy is sometimes strictly longer than the shortest path`,
  more: "- Complete on finite graphs with a visited set, but NOT optimal: it can walk around an obstacle the long way because the first move looked closer.\n- A* adds g to the key and is optimal with an admissible h; greedy is A* with the g term dropped.\n- Good for games or UIs where any reasonable path is fine; poor when you need the shortest route.\n- Dead-end shaped obstacles (U-shapes) are its classic failure.",
  cx: "Time O(E log V) worst case, often much faster in practice; space O(V)",
  see: ["#/topic/advanced-graphs", "#/topic/shortest-paths"]
},
{
  id: "cp-beam-search-graph", cat: "Game and AI search", title: "Beam search on a graph",
  q: ["beam search", "beam search python", "beam search on a graph", "what is beam width", "beam search vs bfs", "beam search algorithm explained", "limited width breadth first search", "beam search implementation"],
  tags: "beam search beam width pruned bfs heuristic incomplete level by level best k states decoding",
  a: "Beam search is BFS that keeps only the best B nodes of each level, ranked by a heuristic. It bounds memory to B nodes per level and often reaches the goal fast, but it is incomplete and not optimal: a good node pruned early is gone for good. B = 1 is greedy hill climbing; B = infinity is BFS.",
  code: { py: `def beam_search(adj, h, s, t, width):
    """adj: {u: [v...]}, h(u): heuristic (lower is better). Returns a path or None."""
    parent = {s: None}
    layer = [s]
    while layer:
        if t in layer:
            path, u = [], t
            while u is not None:
                path.append(u)
                u = parent[u]
            return path[::-1]
        cand = []
        for u in layer:
            for v in adj.get(u, []):
                if v not in parent:
                    parent[v] = u
                    cand.append(v)
        layer = sorted(cand, key=h)[:width]    # keep only the best 'width' nodes
    return None

adj = {'s': ['a', 'b'], 'a': ['x'], 'b': ['c'], 'c': ['t'], 'x': []}
h = {'s': 5, 'a': 1, 'b': 4, 'c': 2, 'x': 3, 't': 0}.get
print(beam_search(adj, h, 's', 't', 1), beam_search(adj, h, 's', 't', 2))
# None ['s', 'b', 'c', 't']`,
  },
  check: `import random
from collections import deque
def bfs(adj, s, t):
    d = {s: 0}; q = deque([s])
    while q:
        u = q.popleft()
        for v in adj.get(u, []):
            if v not in d: d[v] = d[u] + 1; q.append(v)
    return d.get(t)
assert beam_search(adj, h, 's', 't', 1) is None
assert beam_search(adj, h, 's', 't', 2) == ['s', 'b', 'c', 't']
random.seed(12)
for _ in range(300):
    n = random.randint(1, 12); g = {i: [] for i in range(n)}
    for _ in range(random.randint(0, 2 * n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b: g[a].append(b)
    s, t = random.randrange(n), random.randrange(n)
    hh = lambda u: random.random()
    full = beam_search(g, hh, s, t, 10**9)
    b = bfs(g, s, t)
    if b is None: assert full is None
    else: assert len(full) - 1 == b
    p = beam_search(g, hh, s, t, 2)
    if p: assert p[0] == s and p[-1] == t and all(y in g[x] for x, y in zip(p, p[1:]))`,
  more: "- Incomplete: if every path to the goal goes through a pruned node, it reports failure even though a path exists.\n- Quality depends entirely on the heuristic; with a random one it is just random pruning.\n- Memory O(B) per level instead of the whole frontier, which is why it is used for decoding in language models and for huge state spaces.\n- Need guarantees? Use A* or IDA*.",
  cx: "Time O(depth * B * deg * log(B*deg)) with B = beam width and deg = branching; space O(B*deg) per level (plus parents)",
  see: ["#/topic/advanced-graphs", "#/topic/graphs"]
},
{
  id: "cp-dijkstra-path", cat: "Graphs: shortest paths", title: "Dijkstra with path reconstruction",
  q: ["dijkstra print the path", "dijkstra shortest path not just distance", "how to get the actual path from dijkstra", "dijkstra parent array python", "reconstruct shortest path dijkstra", "dijkstra return path and distance", "dijkstra path reconstruction code", "track predecessor in dijkstra"],
  tags: "dijkstra path reconstruction parent predecessor prev array backtrack shortest route heapq",
  a: "Store a parent for every node whenever its distance improves, then walk from the target back to the source through parents and reverse the list. Dijkstra gives the distance; the parent pointers form the shortest-path tree that holds the route.",
  code: { py: `import heapq

def dijkstra_path(adj, s, t):
    """adj: {u: [(v, w)]}, w >= 0. Returns (distance, [s, ..., t]) or (inf, [])."""
    INF = float('inf')
    dist = {s: 0}
    parent = {s: None}
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue                      # stale entry
        if u == t:
            break
        for v, w in adj.get(u, []):
            nd = d + w
            if nd < dist.get(v, INF):
                dist[v] = nd
                parent[v] = u
                heapq.heappush(pq, (nd, v))
    if t not in dist:
        return INF, []
    path = []
    while t is not None:
        path.append(t)
        t = parent[t]
    return dist[path[0]], path[::-1]

adj = {'A': [('B', 4), ('C', 1)], 'C': [('B', 2), ('D', 7)], 'B': [('D', 1)]}
print(dijkstra_path(adj, 'A', 'D'))   # (4, ['A', 'C', 'B', 'D'])`,
  },
  check: `import random
INF = float('inf')
def bf(n, edges, s):
    d = [INF] * n; d[s] = 0
    for _ in range(n):
        for u, v, w in edges:
            if d[u] + w < d[v]: d[v] = d[u] + w
    return d
random.seed(7)
for _ in range(400):
    n = random.randint(1, 10); edges = []; adj = {}
    for _ in range(random.randint(0, 3 * n)):
        a, b, w = random.randrange(n), random.randrange(n), random.randint(0, 9)
        edges.append((a, b, w)); adj.setdefault(a, []).append((b, w))
    s, t = random.randrange(n), random.randrange(n)
    dist, path = dijkstra_path(adj, s, t)
    assert dist == bf(n, edges, s)[t]
    if dist < INF:
        assert path[0] == s and path[-1] == t
        assert sum(min(w for (x, y, w) in edges if x == a and y == b) for a, b in zip(path, path[1:])) == dist
    else: assert path == []`,
  more: "- Set parent only when the distance strictly improves; the last update wins and is the shortest-path-tree edge.\n- Stopping at t is safe: its distance and ancestors are final when t is popped.\n- Unreachable target: check that it has a distance before walking parents, or you loop on a missing key.\n- Several shortest paths may exist; this returns one of them. To count them, see the path-counting entry.\n- Negative edges break Dijkstra; use Bellman-Ford.",
  cx: "Time O((V+E) log V), space O(V)",
  see: ["#/topic/shortest-paths", "#/problem/743", "#/cheatsheets/graphs"]
},
{
  id: "cp-dijkstra-dense", cat: "Graphs: shortest paths", title: "Dijkstra O(V^2) with an array (dense graphs)",
  q: ["dijkstra without heap", "dijkstra adjacency matrix", "dijkstra o(v^2)", "dijkstra array implementation", "dijkstra for dense graph", "simple dijkstra n squared", "dijkstra on complete graph", "dijkstra with matrix python"],
  tags: "dijkstra dense graph adjacency matrix array v squared no heap linear scan minimum",
  a: "Keep dist[] and a visited[] flag; repeat V times: pick the unvisited vertex with the smallest dist by a linear scan, mark it, and relax its row of the matrix. It runs in O(V^2) and beats the heap version when the graph is dense (E near V^2).",
  code: { py: `INF = float('inf')

def dijkstra_dense(W, s):
    """W[u][v] = weight of edge u->v, or INF when there is none. Weights >= 0. Returns dist list."""
    n = len(W)
    dist = [INF] * n
    dist[s] = 0
    seen = [False] * n
    for _ in range(n):
        u = -1
        for i in range(n):
            if not seen[i] and (u == -1 or dist[i] < dist[u]):
                u = i
        if dist[u] == INF:
            break                      # the rest is unreachable
        seen[u] = True
        for v in range(n):
            if dist[u] + W[u][v] < dist[v]:
                dist[v] = dist[u] + W[u][v]
    return dist

W = [[0, 4, 1, INF], [INF, 0, INF, 1], [INF, 2, 0, 7], [INF, INF, INF, 0]]
print(dijkstra_dense(W, 0))   # [0, 3, 1, 4]`,
  },
  check: `import random, heapq
random.seed(11)
def heap_d(W, s):
    n = len(W); d = [INF] * n; d[s] = 0; pq = [(0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for v in range(n):
            if x + W[u][v] < d[v]: d[v] = x + W[u][v]; heapq.heappush(pq, (d[v], v))
    return d
for _ in range(300):
    n = random.randint(1, 9)
    W = [[0 if i == j else (random.randint(0, 9) if random.random() < 0.4 else INF) for j in range(n)] for i in range(n)]
    s = random.randrange(n)
    assert dijkstra_dense(W, s) == heap_d(W, s)
assert dijkstra_dense([[0]], 0) == [0]`,
  more: "- Choose it when E is about V^2 (matrix input, complete graphs): the heap version would cost O(V^2 log V) there.\n- On sparse graphs it wastes time scanning; use the heap version.\n- Setting dist[u] + INF is safe in Python because INF is a float; in C++ use a large sentinel and guard the addition against overflow.\n- Still needs non-negative weights.",
  cx: "Time O(V^2), space O(V) plus the matrix O(V^2)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs"]
},
{
  id: "cp-dial-algorithm", cat: "Graphs: shortest paths", title: "Dial's algorithm (bucket queue Dijkstra)",
  q: ["dial's algorithm", "dials algorithm python", "dijkstra with buckets", "bucket queue shortest path", "shortest path with small integer weights", "dijkstra without priority queue", "circular bucket dijkstra", "faster dijkstra for small edge weights"],
  tags: "dial algorithm bucket queue dijkstra integer weights circular buckets radix small weights",
  a: "Dial's algorithm is Dijkstra with a bucket queue: because edge weights are integers in 0..C, tentative distances live in a window of C+1 values, so a circular array of C+1 buckets replaces the heap. Scan distance d = 0, 1, 2, ... and process bucket d % (C+1).",
  code: { py: `def dial(n, adj, s, C):
    """adj[u] = [(v, w)] with integer 0 <= w <= C. Returns dist (inf if unreachable)."""
    INF = float('inf')
    dist = [INF] * n
    dist[s] = 0
    buckets = [[] for _ in range(C + 1)]
    buckets[0].append(s)
    pending = 1                      # entries still stored in buckets
    d = 0
    while pending:
        b = buckets[d % (C + 1)]
        while b:
            u = b.pop()
            pending -= 1
            if dist[u] != d:
                continue             # stale entry
            for v, w in adj[u]:
                nd = d + w
                if nd < dist[v]:
                    dist[v] = nd
                    buckets[nd % (C + 1)].append(v)
                    pending += 1
        d += 1
    return dist

adj = [[(1, 2), (2, 5)], [(2, 1), (3, 6)], [(3, 2)], []]
print(dial(4, adj, 0, 6))   # [0, 2, 3, 5]`,
  },
  check: `import random, heapq
random.seed(13)
for _ in range(400):
    n = random.randint(1, 12); C = random.randint(0, 6); adj = [[] for _ in range(n)]
    for _ in range(random.randint(0, 3 * n)):
        adj[random.randrange(n)].append((random.randrange(n), random.randint(0, C)))
    s = random.randrange(n)
    d = [float('inf')] * n; d[s] = 0; pq = [(0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for v, w in adj[u]:
            if x + w < d[v]: d[v] = x + w; heapq.heappush(pq, (x + w, v))
    assert dial(n, adj, s, C) == d
assert dial(1, [[]], 0, 0) == [0]`,
  more: "- Invariant: while processing distance d, every live entry has a distance in [d, d+C], so no two live entries collide in the same circular bucket.\n- Zero-weight edges push into the bucket being scanned; the inner while loop handles that.\n- Best when C is small (grids with weights 1-9, hop costs). The scan over empty buckets costs up to V*C steps, so huge C is a bad fit.\n- Alternatives: 0-1 BFS for C = 1, a radix heap for larger C.",
  cx: "Time O(E + V*C), space O(V + C)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs"]
},
{
  id: "cp-multi-source-dijkstra", cat: "Graphs: shortest paths", title: "Multi-source Dijkstra",
  q: ["multi source dijkstra", "dijkstra from multiple starting nodes", "nearest source for every node", "distance to the closest of several sources", "multi source shortest path weighted", "dijkstra with many sources python", "voronoi regions on a graph", "nearest hospital for every city"],
  tags: "multi source dijkstra multiple sources nearest facility closest source label super source weighted",
  a: "Push every source into the heap with distance 0 before starting, then run ordinary Dijkstra. Each node ends with its distance to the nearest source in one pass, and carrying a source label along gives the nearest source itself.",
  code: { py: `import heapq

def multi_source_dijkstra(adj, sources):
    """adj: {u: [(v, w)]}. Returns (dist, owner): distance to and identity of the nearest source."""
    dist = {s: 0 for s in sources}
    owner = {s: s for s in sources}
    pq = [(0, s) for s in sources]
    heapq.heapify(pq)
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj.get(u, []):
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                owner[v] = owner[u]
                heapq.heappush(pq, (nd, v))
    return dist, owner

adj = {0: [(1, 4)], 1: [(2, 1)], 3: [(2, 2)], 2: [(4, 3)]}
print(multi_source_dijkstra(adj, [0, 3]))
# ({0: 0, 3: 0, 1: 4, 2: 2, 4: 5}, {0: 0, 3: 3, 1: 0, 2: 3, 4: 3})`,
  },
  check: `import random, heapq
INF = float('inf')
def single(adj, s):
    d = {s: 0}; pq = [(0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for v, w in adj.get(u, []):
            if x + w < d.get(v, INF): d[v] = x + w; heapq.heappush(pq, (x + w, v))
    return d
random.seed(21)
for _ in range(300):
    n = random.randint(1, 10); adj = {}
    for _ in range(random.randint(0, 3 * n)):
        adj.setdefault(random.randrange(n), []).append((random.randrange(n), random.randint(0, 9)))
    src = random.sample(range(n), random.randint(1, min(3, n)))
    dist, owner = multi_source_dijkstra(adj, src)
    per = {s: single(adj, s) for s in src}
    for v in range(n):
        best = min(per[s].get(v, INF) for s in src)
        assert dist.get(v, INF) == best
        if best < INF: assert per[owner[v]].get(v, INF) == best`,
  more: "- Equivalent to adding a super-source with 0-weight edges to every real source.\n- Do not run Dijkstra once per source and take the minimum: that costs k times more.\n- On unweighted graphs use multi-source BFS (rotting oranges, walls and gates).\n- Ties in the owner label are arbitrary; if you need a deterministic owner, compare (dist, source id).",
  cx: "Time O((V+E) log V) regardless of the number of sources; space O(V)",
  see: ["#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-yen-k-shortest-paths", cat: "Graphs: shortest paths", title: "Yen's k shortest simple paths",
  q: ["yen's algorithm", "k shortest paths", "kth shortest path python", "yens k shortest loopless paths", "find the second and third best route", "k shortest simple paths implementation", "yen algorithm code", "k shortest paths vs dijkstra"],
  tags: "yen yens k shortest paths loopless simple paths spur root deviation candidates alternative routes",
  a: "Yen's algorithm finds the k cheapest loopless s-t paths. Start from the shortest path; for each prefix (root) of the latest accepted path, block the edges that previous paths used after that root and the root's earlier nodes, run Dijkstra from the spur node, and add root + spur to a candidate heap. Pop the best candidate each round.",
  code: { py: `import heapq

def dijkstra(adj, s, t, banned_nodes, banned_edges):
    dist, parent, pq = {s: 0}, {s: None}, [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == t:
            path = []
            while u is not None:
                path.append(u)
                u = parent[u]
            return d, path[::-1]
        for v, w in adj.get(u, {}).items():
            if v in banned_nodes or (u, v) in banned_edges:
                continue
            if d + w < dist.get(v, float('inf')):
                dist[v] = d + w
                parent[v] = u
                heapq.heappush(pq, (d + w, v))
    return None

def yen(adj, s, t, K):
    """adj: {u: {v: w}}, w >= 0. Returns up to K (cost, path) pairs, cheapest first."""
    first = dijkstra(adj, s, t, set(), set())
    if first is None:
        return []
    A, B, seen = [first], [], {tuple(first[1])}
    while len(A) < K:
        prev = A[-1][1]
        for i in range(len(prev) - 1):
            spur, root = prev[i], prev[:i + 1]
            banned_edges = {(p[i], p[i + 1]) for _, p in A if len(p) > i + 1 and p[:i + 1] == root}
            res = dijkstra(adj, spur, t, set(root[:-1]), banned_edges)
            if res:
                total = root[:-1] + res[1]
                if tuple(total) not in seen:
                    seen.add(tuple(total))
                    root_cost = sum(adj[a][b] for a, b in zip(root, root[1:]))
                    heapq.heappush(B, (root_cost + res[0], total))
        if not B:
            break
        A.append(heapq.heappop(B))
    return A

g = {'C': {'D': 3, 'E': 2}, 'D': {'F': 4}, 'E': {'D': 1, 'F': 2, 'G': 3}, 'F': {'G': 2, 'H': 1}, 'G': {'H': 2}}
print(yen(g, 'C', 'H', 3))   # [(5, ['C','E','F','H']), (7, ['C','E','G','H']), (8, ['C','D','F','H'])]`,
  },
  check: `import random
random.seed(17)
def all_paths(adj, s, t):
    out = []
    def go(u, path, cost):
        if u == t: out.append(cost); return
        for v, w in adj.get(u, {}).items():
            if v not in path: go(v, path | {v}, cost + w)
    go(s, {s}, 0)
    return sorted(out)
for _ in range(300):
    n = random.randint(2, 7); adj = {}
    for _ in range(random.randint(1, 3 * n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b: adj.setdefault(a, {})[b] = random.randint(1, 6)
    s, t = 0, n - 1
    K = random.randint(1, 5)
    res = yen(adj, s, t, K)
    want = all_paths(adj, s, t)[:K]
    assert [c for c, _ in res] == want
    for c, p in res:
        assert len(set(p)) == len(p) and p[0] == s and p[-1] == t
        assert sum(adj[a][b] for a, b in zip(p, p[1:])) == c
assert yen({0: {1: 1}}, 0, 1, 3) == [(1, [0, 1])]`,
  more: "- Loopless: root nodes before the spur are banned in the spur search, so a path never revisits a node.\n- Banning the next edge of every accepted path that shares the same root prevents regenerating an old path; the seen set removes duplicates reached from different roots.\n- Not the same as the k shortest WALKS, which may repeat nodes (that is a simple Dijkstra with a pop counter).\n- Requires non-negative weights.\n- Cost grows quickly with K; each round runs up to |path| Dijkstras.",
  cx: "Time O(K * V * E log V): up to V spur searches per accepted path, each a heap Dijkstra; space O(K*V)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs"]
},
{
  id: "cp-second-shortest-path", cat: "Graphs: shortest paths", title: "Second shortest path (strictly longer than the shortest)",
  q: ["second shortest path", "second shortest path dijkstra", "second best route in a graph", "second minimum time to reach destination", "second shortest walk strictly greater", "dijkstra keep two distances per node", "second shortest path python", "find 2nd shortest path length"],
  tags: "second shortest path second best dijkstra two distances per node d1 d2 strictly greater walk",
  a: "Keep two values per node: d1 (shortest distance) and d2 (shortest distance strictly greater than d1). Run Dijkstra where each relaxation can improve either value, pushing both kinds of updates. The answer is d2[target]. This counts walks, so an edge may be reused.",
  code: { py: `import heapq
INF = float('inf')

def second_shortest(n, adj, s, t):
    """adj[u] = [(v, w)], w > 0. Returns the shortest walk length strictly greater than the shortest, or INF."""
    d1 = [INF] * n
    d2 = [INF] * n
    d1[s] = 0
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > d2[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < d1[v]:
                d1[v], nd = nd, d1[v]          # new best; the old best becomes a second-best candidate
                heapq.heappush(pq, (d1[v], v))
            if d1[v] < nd < d2[v]:
                d2[v] = nd
                heapq.heappush(pq, (nd, v))
    return d2[t]

adj = [[(1, 1), (2, 4)], [(2, 1), (3, 6)], [(3, 1)], []]
print(second_shortest(4, adj, 0, 3))   # shortest is 3 (0-1-2-3); next is 5 (0-2-3)`,
  },
  check: `import random
random.seed(31)
def oracle(n, adj, s, t, B=70):
    reach = [set() for _ in range(B + 1)]; reach[0].add(s)
    for c in range(B + 1):
        for u in reach[c]:
            for v, w in adj[u]:
                if c + w <= B: reach[c + w].add(v)
    costs = [c for c in range(B + 1) if t in reach[c]]
    return costs
for _ in range(400):
    n = random.randint(2, 6); adj = [[] for _ in range(n)]
    for _ in range(random.randint(1, 3 * n)):
        a, b = random.randrange(n), random.randrange(n)
        adj[a].append((b, random.randint(1, 4)))
    s, t = 0, n - 1
    costs = oracle(n, adj, s, t)
    got = second_shortest(n, adj, s, t)
    want = costs[1] if len(costs) > 1 else INF
    assert got == want, (got, want)
assert second_shortest(2, [[(1, 3)], []], 0, 1) == INF`,
  more: "- Invariant: d1[v] < d2[v], and the heap holds candidate values for either slot; skip entries larger than d2[u], since they cannot improve anything.\n- This is the walk version. For the second shortest SIMPLE path use Yen's algorithm with K = 2.\n- On an undirected graph the second shortest walk can just bounce along an edge (d1 + 2*w for the lightest edge near the route).\n- Requires positive weights for the strictness argument; with zero-weight cycles the second value may not exist.",
  cx: "Time O((V+E) log V) (each node's value is improved at most twice), space O(V + E)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs"]
},
{
  id: "cp-dijkstra-state-space", cat: "Graphs: shortest paths", title: "Dijkstra on a state space (node, stops or fuel)",
  q: ["dijkstra with extra state", "cheapest flights within k stops", "dijkstra node and number of stops", "shortest path with at most k edges dijkstra", "dijkstra with fuel", "dijkstra on (node, state) pairs", "state expanded graph shortest path", "layered graph dijkstra"],
  tags: "dijkstra state space expanded graph node stops fuel layered cheapest flights k stops 787 constraint",
  a: "When a constraint (stops used, fuel left, keys held) changes what you can do next, make the state a pair (node, constraint value) and run Dijkstra over those states. Each pair is a vertex; cost order guarantees the first time you pop the destination in any state it is the cheapest valid answer.",
  code: { py: `import heapq

def cheapest_with_stops(n, flights, src, dst, k):
    """flights: [(u, v, price)]. Cheapest price from src to dst using at most k intermediate stops, else -1."""
    adj = [[] for _ in range(n)]
    for u, v, p in flights:
        adj[u].append((v, p))
    best = {(src, 0): 0}                  # (city, edges used) -> cheapest price
    pq = [(0, src, 0)]
    while pq:
        cost, u, used = heapq.heappop(pq)
        if u == dst:
            return cost
        if used > k or best.get((u, used), float('inf')) < cost:
            continue                      # no edges left, or stale
        for v, p in adj[u]:
            nc = cost + p
            if nc < best.get((v, used + 1), float('inf')):
                best[(v, used + 1)] = nc
                heapq.heappush(pq, (nc, v, used + 1))
    return -1

f = [(0, 1, 100), (1, 2, 100), (0, 2, 500)]
print(cheapest_with_stops(3, f, 0, 2, 1), cheapest_with_stops(3, f, 0, 2, 0))   # 200 500`,
  },
  check: `import random
random.seed(41)
def bf(n, flights, s, t, k):
    INF = float('inf'); d = [INF] * n; d[s] = 0
    for _ in range(k + 1):
        nd = d[:]
        for u, v, p in flights:
            if d[u] + p < nd[v]: nd[v] = d[u] + p
        d = nd
    return -1 if d[t] == INF else d[t]
for _ in range(500):
    n = random.randint(2, 7)
    fl = [(random.randrange(n), random.randrange(n), random.randint(1, 9)) for _ in range(random.randint(0, 3 * n))]
    s, t, k = random.randrange(n), random.randrange(n), random.randint(0, 4)
    assert cheapest_with_stops(n, fl, s, t, k) == bf(n, fl, s, t, k)
assert cheapest_with_stops(2, [], 0, 1, 3) == -1`,
  more: "- Number of vertices becomes V*(K+1); edges E*(K+1). Choose the constraint dimension so it stays small.\n- Plain Dijkstra on nodes alone is wrong here: a cheaper arrival with more stops can be worse than a pricier arrival with fewer stops, so one dist per node is not enough.\n- Same idea for fuel (node, litres), time windows (node, time) or keys (node, bitmask).\n- Alternative for the k-stops case: Bellman-Ford limited to k+1 rounds.",
  cx: "Time O(K*E log(K*V)) for K layers, space O(K*V)",
  see: ["#/topic/shortest-paths", "#/problem/787", "#/cheatsheets/graphs"]
},
{
  id: "cp-negative-cycle-extraction", cat: "Graphs: shortest paths", title: "Bellman-Ford with negative cycle extraction",
  q: ["find negative cycle", "bellman ford detect negative cycle and print it", "extract negative cycle from bellman ford", "negative cycle python", "how to find a negative weight cycle", "detect arbitrage cycle", "negative cycle detection code", "bellman ford negative cycle path"],
  tags: "bellman ford negative cycle extraction detect print arbitrage parent walk back n times negative weight cycle",
  a: "Run Bellman-Ford from a virtual source (all distances start at 0) for n rounds. If round n still relaxes some vertex x, a negative cycle exists. Step back along parents n times to land inside the cycle, then follow parents until you return to that vertex to read the cycle.",
  code: { py: `def find_negative_cycle(n, edges):
    """edges: [(u, v, w)]. Returns a list of vertices forming a negative cycle (in edge order), or None."""
    dist = [0] * n               # all-zero start = virtual source joined to every vertex
    parent = [-1] * n
    x = -1
    for _ in range(n):
        x = -1
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                x = v
        if x == -1:
            return None          # a full round without change: no negative cycle
    for _ in range(n):           # x may only be reachable from the cycle; walk back into it
        x = parent[x]
    cycle = [x]
    v = parent[x]
    while v != x:
        cycle.append(v)
        v = parent[v]
    return cycle[::-1]

edges = [(0, 1, 1), (1, 2, -3), (2, 0, 1), (2, 3, 4)]
print(find_negative_cycle(4, edges))   # [0, 1, 2]  (cost 1 - 3 + 1 = -1)`,
  },
  check: `import random
random.seed(5)
INF = float('inf')
for _ in range(600):
    n = random.randint(1, 7)
    edges = [(random.randrange(n), random.randrange(n), random.randint(-4, 6)) for _ in range(random.randint(0, 3 * n))]
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]: d[i][j] = d[i][k] + d[k][j]
    has = any(d[i][i] < 0 for i in range(n))
    cyc = find_negative_cycle(n, edges)
    assert (cyc is not None) == has
    if cyc:
        w = {}
        for u, v, c in edges: w[(u, v)] = min(w.get((u, v), INF), c)
        total = sum(w[(cyc[i], cyc[(i + 1) % len(cyc)])] for i in range(len(cyc)))
        assert total < 0 and len(set(cyc)) == len(cyc)
assert find_negative_cycle(1, [(0, 0, -1)]) == [0]`,
  more: "- Starting every distance at 0 finds a negative cycle anywhere in the graph, not just ones reachable from one source.\n- Why walk back n times: the last relaxed vertex might hang off the cycle by a tail; n parent steps always end inside the cycle.\n- Currency arbitrage: use w = -log(rate); a negative cycle means a profitable loop.\n- Detection only needs the n-th round check; the extraction adds O(n).",
  cx: "Time O(V*E), space O(V)",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs", "#/cheatsheets/graphs"]
},
{
  id: "cp-spfa", cat: "Graphs: shortest paths", title: "SPFA (queue-based Bellman-Ford)",
  q: ["spfa algorithm", "shortest path faster algorithm", "spfa python", "queue based bellman ford", "spfa negative cycle detection", "spfa vs bellman ford", "spfa vs dijkstra", "spfa implementation"],
  tags: "spfa shortest path faster algorithm queue bellman ford in queue negative edges negative cycle count",
  a: "SPFA is Bellman-Ford that only re-examines vertices whose distance just dropped: keep a FIFO queue and an in-queue flag, relax edges out of the popped vertex, and enqueue any improved neighbor. It handles negative edges and is usually fast, but its worst case is still O(V*E).",
  code: { py: `from collections import deque

def spfa(n, adj, s):
    """adj[u] = [(v, w)], negative w allowed. Returns dist, or None if a negative cycle is reachable from s."""
    INF = float('inf')
    dist = [INF] * n
    edges_used = [0] * n          # number of edges on the current best path to v
    in_queue = [False] * n
    dist[s] = 0
    q = deque([s])
    in_queue[s] = True
    while q:
        u = q.popleft()
        in_queue[u] = False
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                edges_used[v] = edges_used[u] + 1
                if edges_used[v] >= n:
                    return None   # a shortest path cannot have n edges: negative cycle
                if not in_queue[v]:
                    q.append(v)
                    in_queue[v] = True
    return dist

adj = [[(1, 4), (2, 5)], [(2, -3)], [(3, 2)], []]
print(spfa(4, adj, 0))   # [0, 4, 1, 3]`,
  },
  check: `import random
random.seed(8)
INF = float('inf')
def bf(n, adj, s):
    d = [INF] * n; d[s] = 0
    for _ in range(n):
        for u in range(n):
            for v, w in adj[u]:
                if d[u] < INF and d[u] + w < d[v]: d[v] = d[u] + w
    for u in range(n):
        for v, w in adj[u]:
            if d[u] < INF and d[u] + w < d[v]: return None
    return d
for _ in range(600):
    n = random.randint(1, 8); adj = [[] for _ in range(n)]
    for _ in range(random.randint(0, 3 * n)):
        adj[random.randrange(n)].append((random.randrange(n), random.randint(-3, 7)))
    s = random.randrange(n)
    assert spfa(n, adj, s) == bf(n, adj, s)
assert spfa(1, [[]], 0) == [0]`,
  more: "- Same fixpoint as Bellman-Ford; the queue just skips edges that cannot improve anything.\n- Typical cost is close to O(E) on random graphs, but adversarial inputs (and some grids) force O(V*E). In contests, prefer Dijkstra when weights are non-negative.\n- The edges_used counter is the standard negative-cycle test; counting how often a vertex is enqueued works too.\n- Alternative for dense all-pairs work: Johnson's algorithm.",
  cx: "Time O(V*E) worst case, often about O(E) in practice; space O(V)",
  see: ["#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-johnson-algorithm", cat: "Graphs: shortest paths", title: "Johnson's all-pairs shortest paths",
  q: ["johnson's algorithm", "johnson algorithm all pairs shortest path", "johnsons algorithm python", "all pairs shortest path sparse graph negative edges", "reweighting edges with potentials", "johnson vs floyd warshall", "bellman ford then dijkstra for all pairs", "johnson's algorithm code"],
  tags: "johnson algorithm all pairs shortest paths reweighting potentials bellman ford dijkstra sparse negative edges",
  a: "Johnson's algorithm solves all-pairs shortest paths on a sparse graph with negative edges (but no negative cycle). Bellman-Ford from a virtual source yields potentials h; reweight each edge to w + h[u] - h[v] >= 0, run Dijkstra from every vertex, then subtract the potentials back.",
  code: { py: `import heapq
INF = float('inf')

def johnson(n, edges):
    """edges: [(u, v, w)]. Returns an n x n distance matrix, or None if there is a negative cycle."""
    h = [0] * n                       # Bellman-Ford from a virtual source with 0-weight edges to all
    for i in range(n + 1):
        changed = False
        for u, v, w in edges:
            if h[u] + w < h[v]:
                h[v] = h[u] + w
                changed = True
        if not changed:
            break
        if i == n:
            return None               # still changing after n rounds
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w + h[u] - h[v]))   # reweighted edge is >= 0
    D = []
    for s in range(n):
        d = [INF] * n
        d[s] = 0
        pq = [(0, s)]
        while pq:
            x, u = heapq.heappop(pq)
            if x > d[u]:
                continue
            for v, w in adj[u]:
                if x + w < d[v]:
                    d[v] = x + w
                    heapq.heappush(pq, (d[v], v))
        D.append([d[v] - h[s] + h[v] if d[v] < INF else INF for v in range(n)])
    return D

print(johnson(3, [(0, 1, 4), (1, 2, -2), (0, 2, 5)])[0])   # [0, 4, 2]`,
  },
  check: `import random
random.seed(14)
for _ in range(400):
    n = random.randint(1, 7)
    edges = [(random.randrange(n), random.randrange(n), random.randint(-2, 8)) for _ in range(random.randint(0, 3 * n))]
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges: d[u][v] = min(d[u][v], w)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]: d[i][j] = d[i][k] + d[k][j]
    neg = any(d[i][i] < 0 for i in range(n))
    D = johnson(n, edges)
    if neg: assert D is None
    else: assert D == d`,
  more: "- Reweighting preserves shortest paths because every s-t path changes by the same constant h[s] - h[t].\n- Beats Floyd-Warshall on sparse graphs: O(VE log V) versus O(V^3). On dense graphs Floyd-Warshall is simpler and just as fast.\n- If all weights are already non-negative, skip Bellman-Ford and run Dijkstra from each vertex.\n- Forgetting to undo the potentials is the common bug: d(u,v) = d'(u,v) - h[u] + h[v].",
  cx: "Time O(V*E log V) with a binary heap (plus O(V*E) for Bellman-Ford), space O(V^2) for the output",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs", "#/cheatsheets/graphs"]
},
{
  id: "cp-floyd-warshall-path", cat: "Graphs: shortest paths", title: "Floyd-Warshall with path reconstruction",
  q: ["floyd warshall print path", "floyd warshall path reconstruction", "floyd warshall next matrix", "all pairs shortest path with actual routes", "reconstruct path floyd warshall python", "floyd warshall return path between two nodes", "floyd warshall predecessor matrix", "floyd warshall code with paths"],
  tags: "floyd warshall path reconstruction next matrix successor all pairs shortest paths route",
  a: "Along with dist[i][j] keep nxt[i][j], the first vertex after i on a shortest i-j path. Initialise nxt[u][v] = v for each edge; when going through k improves i-j, set nxt[i][j] = nxt[i][k]. To print a path, start at i and keep jumping to nxt[cur][j] until you reach j.",
  code: { py: `INF = float('inf')

def floyd_warshall(n, edges):
    """Returns (dist, path) where path(u, v) gives a shortest vertex list or None. No negative cycles."""
    dist = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    nxt = [[None] * n for _ in range(n)]
    for u, v, w in edges:
        if w < dist[u][v]:
            dist[u][v] = w
            nxt[u][v] = v
    for k in range(n):
        for i in range(n):
            if dist[i][k] == INF:
                continue
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    nxt[i][j] = nxt[i][k]
    def path(u, v):
        if u == v:
            return [u]
        if nxt[u][v] is None:
            return None
        p = [u]
        while u != v:
            u = nxt[u][v]
            p.append(u)
        return p
    return dist, path

dist, path = floyd_warshall(4, [(0, 1, 3), (1, 2, -1), (0, 2, 5), (2, 3, 2)])
print(dist[0][3], path(0, 3))   # 4 [0, 1, 2, 3]`,
  },
  check: `import random
random.seed(19)
for _ in range(400):
    n = random.randint(1, 7)
    edges = [(random.randrange(n), random.randrange(n), random.randint(1, 9)) for _ in range(random.randint(0, 3 * n))]
    dist, path = floyd_warshall(n, edges)
    w = {}
    for u, v, c in edges:
        if u != v: w[(u, v)] = min(w.get((u, v), INF), c)
    for i in range(n):
        for j in range(n):
            p = path(i, j)
            if dist[i][j] == INF: assert p is None
            else:
                assert p[0] == i and p[-1] == j
                assert sum(w[(a, b)] for a, b in zip(p, p[1:])) == dist[i][j]
d, p = floyd_warshall(3, [(0, 1, 2), (1, 2, -1)])
assert p(0, 2) == [0, 1, 2] and d[0][2] == 1`,
  more: "- nxt[i][j] = nxt[i][k] works because the first step toward j via k is the first step toward k.\n- Negative edges are fine; a negative cycle (dist[i][i] < 0) makes paths meaningless, so check the diagonal first.\n- Storing the full path in each cell costs O(V^3) memory; the next matrix keeps O(V^2).\n- The i-loop skip for INF is a cheap speedup, not needed for correctness.",
  cx: "Time O(V^3), space O(V^2); one path costs O(V) to print",
  see: ["#/topic/shortest-paths", "#/topic/advanced-graphs", "#/problem/1334", "#/cheatsheets/graphs"]
},
{
  id: "cp-transitive-closure", cat: "Graphs: other", title: "Transitive closure (Warshall's algorithm)",
  q: ["transitive closure", "warshall algorithm", "reachability matrix python", "can u reach v for all pairs", "transitive closure with bitsets", "warshall's algorithm code", "all pairs reachability", "transitive closure of a directed graph"],
  tags: "transitive closure warshall reachability matrix all pairs bitset boolean floyd reach",
  a: "Warshall's algorithm computes which vertices can reach which. For each intermediate k, if i reaches k then i reaches everything k reaches. Storing each row as a Python int bitmask turns the inner loop into one OR, giving O(V^2) big-int operations.",
  code: { py: `def transitive_closure(n, edges):
    """Returns reach, where bit j of reach[i] is 1 iff there is a path i -> j (every vertex reaches itself)."""
    reach = [1 << i for i in range(n)]
    for u, v in edges:
        reach[u] |= 1 << v
    for k in range(n):
        rk = reach[k]
        for i in range(n):
            if reach[i] >> k & 1:
                reach[i] |= rk
    return reach

r = transitive_closure(4, [(0, 1), (1, 2), (3, 0)])
print([bin(x) for x in r])   # 0 reaches {0,1,2}; 3 reaches {0,1,2,3}`,
  },
  check: `import random
random.seed(23)
for _ in range(400):
    n = random.randint(1, 9)
    edges = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 2 * n))]
    adj = {i: [] for i in range(n)}
    for u, v in edges: adj[u].append(v)
    r = transitive_closure(n, edges)
    for s in range(n):
        seen = {s}; st = [s]
        while st:
            u = st.pop()
            for v in adj[u]:
                if v not in seen: seen.add(v); st.append(v)
        assert r[s] == sum(1 << v for v in seen)
assert transitive_closure(1, []) == [1]`,
  more: "- Same triple loop as Floyd-Warshall with (min, +) replaced by (OR, AND); k must be the OUTER loop.\n- On a DAG, process vertices in reverse topological order and OR the children's masks instead: O(V*E/64).\n- For one query use BFS/DFS; the closure pays off only for many pairs.\n- Strongly connected components can first be condensed to shrink the problem.",
  cx: "Time O(V^3) boolean steps (about O(V^3 / w) with word-sized bitsets), space O(V^2) bits",
  see: ["#/topic/graphs", "#/topic/advanced-graphs", "#/cheatsheets/graphs"]
},
{
  id: "cp-dag-shortest-path", cat: "Graphs: shortest paths", title: "Shortest path in a DAG",
  q: ["shortest path in a dag", "shortest path in directed acyclic graph", "dag shortest path topological order", "shortest path with negative weights in a dag", "dag single source shortest path python", "relax edges in topological order", "dag shortest path vs dijkstra", "how to find shortest path in dag in linear time"],
  tags: "dag shortest path topological order relax negative edges linear time directed acyclic single source",
  a: "In a directed acyclic graph, process vertices in topological order and relax each vertex's outgoing edges once. Every path arrives in order, so each distance is final when its vertex is reached. It takes O(V+E), allows negative weights, and needs no heap.",
  code: { py: `from collections import deque

def dag_shortest(n, edges, s):
    """edges: [(u, v, w)] forming a DAG (negative w allowed). Returns dist list (inf if unreachable)."""
    INF = float('inf')
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v, w in edges:
        adj[u].append((v, w))
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v, _ in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if len(order) != n:
        raise ValueError("graph has a cycle")
    dist = [INF] * n
    dist[s] = 0
    for u in order:
        if dist[u] < INF:
            for v, w in adj[u]:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
    return dist

print(dag_shortest(5, [(0, 1, 3), (0, 2, 6), (1, 2, -2), (2, 3, 1), (1, 3, 5)], 0))   # [0, 3, 1, 2, inf]`,
  },
  check: `import random
random.seed(3)
INF = float('inf')
for _ in range(400):
    n = random.randint(1, 9); perm = list(range(n)); random.shuffle(perm)
    edges = [(perm[a], perm[b], random.randint(-5, 9)) for a in range(n) for b in range(a + 1, n) if random.random() < 0.4]
    s = random.randrange(n)
    d = [INF] * n; d[s] = 0
    for _ in range(n):
        for u, v, w in edges:
            if d[u] + w < d[v]: d[v] = d[u] + w
    assert dag_shortest(n, edges, s) == d
try:
    dag_shortest(2, [(0, 1, 1), (1, 0, 1)], 0); assert False
except ValueError: pass`,
  more: "- Correct because a topological order guarantees all edges into v are relaxed before v is processed.\n- Handles negative weights without Bellman-Ford; with cycles it fails, so verify acyclicity (the order length check above).\n- Replace min with max to get longest paths (see the critical path entry).\n- Dijkstra would also work for non-negative weights but costs an extra log factor.",
  cx: "Time O(V + E), space O(V + E)",
  see: ["#/topic/topo-sort", "#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-dag-longest-path", cat: "Graphs: other", title: "Longest path in a DAG and critical path method",
  q: ["longest path in a dag", "critical path method", "critical path python", "project scheduling longest path", "earliest start time of tasks with dependencies", "longest path in directed acyclic graph", "minimum time to finish all courses with prerequisites", "critical path algorithm code"],
  tags: "longest path dag critical path method cpm scheduling earliest start finish time dependencies topological order project",
  a: "Longest path is NP-hard in general but easy on a DAG: in topological order, each task starts when its slowest prerequisite finishes (start = max over predecessors of finish). The largest finish time is the project length, and following the argmax predecessors back gives the critical path.",
  code: { py: `from collections import deque

def critical_path(duration, deps):
    """duration[i] = time of task i; deps = [(a, b)] meaning a must finish before b starts.
    Returns (total_time, critical_path_as_task_list)."""
    n = len(duration)
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in deps:
        adj[a].append(b)
        indeg[b] += 1
    start = [0] * n
    prev = [-1] * n
    q = deque(i for i in range(n) if indeg[i] == 0)
    done = 0
    while q:
        u = q.popleft()
        done += 1
        finish = start[u] + duration[u]
        for v in adj[u]:
            if finish > start[v]:
                start[v] = finish
                prev[v] = u
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if done != n:
        raise ValueError("cycle in dependencies")
    end = max(range(n), key=lambda i: start[i] + duration[i])
    total = start[end] + duration[end]
    path = []
    while end != -1:
        path.append(end)
        end = prev[end]
    return total, path[::-1]

print(critical_path([3, 2, 4, 1], [(0, 1), (0, 2), (1, 3), (2, 3)]))   # (8, [0, 2, 3])`,
  },
  check: `import random
random.seed(4)
for _ in range(400):
    n = random.randint(1, 8); dur = [random.randint(1, 9) for _ in range(n)]
    perm = list(range(n)); random.shuffle(perm)
    deps = [(perm[a], perm[b]) for a in range(n) for b in range(a + 1, n) if random.random() < 0.35]
    adj = {i: [] for i in range(n)}
    for a, b in deps: adj[a].append(b)
    best = 0
    def go(u, acc):
        global best
        acc += dur[u]; best = max(best, acc)
        for v in adj[u]: go(v, acc)
    for i in range(n): go(i, 0)
    total, path = critical_path(dur, deps)
    assert total == best
    assert sum(dur[i] for i in path) == total
    assert all(b in adj[a] for a, b in zip(path, path[1:]))
try:
    critical_path([1, 1], [(0, 1), (1, 0)]); assert False
except ValueError: pass`,
  more: "- The same DP as DAG shortest path with max instead of min; O(V+E).\n- Delaying a task off the critical path (positive slack) does not delay the project; delaying one on it does.\n- A cycle in the dependencies means the schedule is impossible; the done != n check catches it.\n- On a general graph longest simple path is NP-hard; do not reuse this there.",
  cx: "Time O(V + E), space O(V + E)",
  see: ["#/topic/topo-sort", "#/topic/tree-dp", "#/cheatsheets/graphs"]
},
{
  id: "cp-widest-path", cat: "Graphs: shortest paths", title: "Widest path / minimum bottleneck path",
  q: ["widest path problem", "maximum bottleneck path", "maximum capacity path dijkstra", "path with the largest minimum edge", "bottleneck shortest path python", "maximin path", "path that maximizes the smallest edge weight", "widest path vs shortest path"],
  tags: "widest path maximum capacity bottleneck maximin minimax path dijkstra variant minimum spanning tree max heap",
  a: "The widest path maximizes the smallest edge on the path (think bandwidth). Run Dijkstra with a max-heap, where a path's value is the minimum edge so far: relax with min(width[u], w) and keep the larger result. Equivalent: take the s-t path in a maximum spanning tree.",
  code: { py: `import heapq

def widest_path(adj, s, t):
    """adj: {u: [(v, capacity)]}. Returns the largest possible bottleneck on an s-t path (0 if none)."""
    best = {s: float('inf')}
    pq = [(-float('inf'), s)]
    while pq:
        negw, u = heapq.heappop(pq)
        w = -negw
        if w < best.get(u, 0):
            continue
        if u == t:
            return w
        for v, c in adj.get(u, []):
            nw = min(w, c)
            if nw > best.get(v, 0):
                best[v] = nw
                heapq.heappush(pq, (-nw, v))
    return 0

adj = {'A': [('B', 5), ('C', 9)], 'B': [('D', 8)], 'C': [('D', 3)]}
print(widest_path(adj, 'A', 'D'))   # 5  (A-B-D, min(5, 8))`,
  },
  check: `import random
random.seed(6)
for _ in range(400):
    n = random.randint(1, 8); adj = {}; M = [[0] * n for _ in range(n)]
    for _ in range(random.randint(0, 3 * n)):
        a, b, c = random.randrange(n), random.randrange(n), random.randint(1, 9)
        adj.setdefault(a, []).append((b, c)); M[a][b] = max(M[a][b], c)
    for i in range(n): M[i][i] = float('inf')
    for k in range(n):
        for i in range(n):
            for j in range(n):
                M[i][j] = max(M[i][j], min(M[i][k], M[k][j]))
    s, t = random.randrange(n), random.randrange(n)
    assert widest_path(adj, s, t) == M[s][t]`,
  more: "- Works because min(width, edge) never increases along a path, the same monotonicity Dijkstra needs from sums.\n- Alternative: binary search on the threshold and test connectivity using only edges >= threshold.\n- The widest path between two nodes lies on the maximum spanning tree (Kruskal with edges sorted descending), good for many queries.\n- Do not confuse with the shortest path: the widest route may be longer in hops.",
  cx: "Time O((V+E) log V), space O(V)",
  see: ["#/topic/shortest-paths", "#/topic/mst", "#/topic/binary-search"]
},
{
  id: "cp-shortest-path-k-edges", cat: "Graphs: shortest paths", title: "Shortest path using exactly k edges (min-plus matrix power)",
  q: ["shortest path with exactly k edges", "min plus matrix multiplication", "shortest walk with k edges", "shortest path at most k edges dp", "tropical matrix power shortest path", "k edge shortest path python", "matrix exponentiation shortest path", "walk of length k minimum cost"],
  tags: "shortest path exactly k edges min plus tropical matrix power exponentiation walk length k dp at most k edges",
  a: "Let W be the weight matrix. The min-plus product (A*B)[i][j] = min over m of A[i][m] + B[m][j] composes walks, so W^k holds the cheapest walk of exactly k edges for every pair. Square repeatedly for O(V^3 log k); put 0 on the diagonal to allow at most k edges.",
  code: { py: `INF = float('inf')

def min_plus(A, B):
    n = len(A)
    C = [[INF] * n for _ in range(n)]
    for i in range(n):
        for m in range(n):
            if A[i][m] < INF:
                for j in range(n):
                    if A[i][m] + B[m][j] < C[i][j]:
                        C[i][j] = A[i][m] + B[m][j]
    return C

def shortest_k_edges(W, k):
    """W[i][j] = edge weight or INF. Returns M with M[i][j] = cheapest walk with EXACTLY k edges."""
    n = len(W)
    result = [[0 if i == j else INF for j in range(n)] for i in range(n)]   # identity for min-plus
    base = [row[:] for row in W]
    while k:
        if k & 1:
            result = min_plus(result, base)
        base = min_plus(base, base)
        k >>= 1
    return result

W = [[INF, 1, 5], [INF, INF, 1], [INF, INF, INF]]
print(shortest_k_edges(W, 1)[0][2], shortest_k_edges(W, 2)[0][2])   # 5 2`,
  },
  check: `import random
random.seed(9)
for _ in range(200):
    n = random.randint(1, 6)
    W = [[random.randint(1, 9) if random.random() < 0.5 else INF for _ in range(n)] for _ in range(n)]
    k = random.randint(0, 7)
    D = [[0 if i == j else INF for j in range(n)] for i in range(n)]   # exactly 0 edges
    for _ in range(k):
        D = [[min(D[i][m] + W[m][j] for m in range(n)) for j in range(n)] for i in range(n)]
    assert shortest_k_edges(W, k) == D
    W0 = [[0 if i == j else W[i][j] for j in range(n)] for i in range(n)]   # diagonal 0 => at most k edges
    D2 = shortest_k_edges(W0, k)
    for i in range(n):
        for j in range(n):
            assert D2[i][j] == min(shortest_k_edges(W, e)[i][j] for e in range(k + 1))`,
  more: "- Min-plus is associative and the identity has 0 on the diagonal and INF elsewhere, so fast exponentiation works.\n- When k is small, the simple DP dist_{e+1}[v] = min over edges (u,v) of dist_e[u] + w costs O(k*E) and is faster.\n- Counting walks of length k uses the same trick with ordinary (+, *) matrix multiplication.\n- Limited-edge shortest path from one source is also Bellman-Ford stopped after k rounds.",
  cx: "Time O(V^3 log k), space O(V^2)",
  see: ["#/topic/shortest-paths", "#/topic/matrix", "#/topic/math"]
},
{
  id: "cp-count-shortest-paths", cat: "Graphs: shortest paths", title: "Counting shortest paths",
  q: ["count shortest paths", "number of shortest paths dijkstra", "count ways to reach destination in shortest time", "number of shortest paths in a weighted graph", "count shortest paths bfs unweighted", "count the number of shortest routes modulo", "dijkstra with path counts", "number of ways to arrive at destination"],
  tags: "count shortest paths number ways dijkstra ways array modulo 1976 path counting equal distance",
  a: "Run Dijkstra and keep ways[v], the number of shortest paths to v. When a strictly better distance is found, copy ways[v] = ways[u]; when an equal distance is found, add ways[v] += ways[u]. This needs strictly positive weights so every predecessor is finalized first.",
  code: { py: `import heapq

def count_shortest_paths(n, adj, s, MOD=10**9 + 7):
    """adj[u] = [(v, w)], w > 0. Returns (dist, ways) where ways[v] = number of shortest s-v paths mod MOD."""
    INF = float('inf')
    dist = [INF] * n
    ways = [0] * n
    dist[s], ways[s] = 0, 1
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                ways[v] = ways[u]
                heapq.heappush(pq, (nd, v))
            elif nd == dist[v]:
                ways[v] = (ways[v] + ways[u]) % MOD
    return dist, ways

adj = [[(1, 1), (2, 1)], [(3, 1)], [(3, 1)], []]
print(count_shortest_paths(4, adj, 0))   # ([0, 1, 1, 2], [1, 1, 1, 2])`,
  },
  check: `import random
random.seed(10)
for _ in range(400):
    n = random.randint(1, 7); adj = [[] for _ in range(n)]
    for _ in range(random.randint(0, 3 * n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b: adj[a].append((b, random.randint(1, 3)))
    s = random.randrange(n)
    costs = {}
    def go(u, seen, c):
        costs.setdefault(u, []).append(c)
        for v, w in adj[u]:
            if v not in seen: go(v, seen | {v}, c + w)
    go(s, {s}, 0)
    dist, ways = count_shortest_paths(n, adj, s)
    for v in range(n):
        if v in costs:
            m = min(costs[v])
            assert dist[v] == m and ways[v] == costs[v].count(m)
        else: assert dist[v] == float('inf') and ways[v] == 0`,
  more: "- With zero-weight edges the order of processing equal distances breaks the argument; the count can also be infinite if a zero cycle exists.\n- Unweighted graph: BFS with the same two update rules, O(V+E).\n- Take the modulus on every addition; counts grow exponentially.\n- Pattern generalizes: counting optimal solutions in a DP uses the same copy-on-better, add-on-equal rule.",
  cx: "Time O((V+E) log V), space O(V)",
  see: ["#/topic/shortest-paths", "#/topic/dp-2d", "#/cheatsheets/graphs"]
},
{
  id: "cp-dijkstra-negative-edges", cat: "Graphs: shortest paths", title: "Why Dijkstra fails with negative edges (demonstration)",
  q: ["why doesn't dijkstra work with negative edges", "dijkstra negative weights counterexample", "dijkstra negative edge wrong answer", "can dijkstra handle negative weights", "dijkstra vs bellman ford negative", "negative edge breaks dijkstra", "dijkstra negative cycle", "what to use instead of dijkstra for negative weights"],
  tags: "dijkstra negative weights fails counterexample finalized bellman ford wrong greedy invariant",
  a: "Dijkstra finalizes a vertex the moment it is popped, assuming no later path can be shorter. A negative edge breaks that: a path discovered later can beat a finalized distance. Example: the code below reports 1 for vertex A but the true distance is -3. Use Bellman-Ford (or Johnson's) instead.",
  code: { py: `import heapq

def dijkstra_finalizing(n, edges, s):
    """Textbook Dijkstra: each vertex is finalized once, when popped."""
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    INF = float('inf')
    dist = [INF] * n
    dist[s] = 0
    done = [False] * n
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if done[u]:
            continue
        done[u] = True
        for v, w in adj[u]:
            if not done[v] and d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(pq, (dist[v], v))
    return dist

def bellman_ford(n, edges, s):
    dist = [float('inf')] * n
    dist[s] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    return dist

edges = [(0, 1, 1), (0, 2, 2), (2, 1, -5)]    # 0 -> A(1): direct 1, or via B(2): 2 + (-5) = -3
print(dijkstra_finalizing(3, edges, 0), bellman_ford(3, edges, 0))   # [0, 1, 2] [0, -3, 2]`,
  },
  check: `assert dijkstra_finalizing(3, edges, 0)[1] == 1
assert bellman_ford(3, edges, 0)[1] == -3
pos = [(0, 1, 4), (0, 2, 1), (2, 1, 2)]
assert dijkstra_finalizing(3, pos, 0) == bellman_ford(3, pos, 0) == [0, 3, 1]`,
  more: "- Dijkstra's invariant: any path to an unfinalized vertex is at least as long as the current minimum, which is only true if edges cannot reduce a path's length.\n- Re-adding finalized vertices (a lazy variant without the done flag) can recover correctness but can take exponential time.\n- Do NOT fix it by adding a constant to every edge: paths with more edges are penalized more, so the shortest path changes.\n- Use Bellman-Ford, SPFA, or Johnson's algorithm for all pairs.",
  cx: "Dijkstra O((V+E) log V) but incorrect here; Bellman-Ford O(V*E) is correct",
  see: ["#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-grid-bfs-8-directions", cat: "Graphs: search", title: "Grid BFS with 8 directions (diagonal moves)",
  q: ["bfs on grid with diagonals", "shortest path in binary matrix 8 directions", "8 directional bfs", "bfs king moves grid", "grid bfs diagonal movement python", "bfs 8 neighbors", "diagonal corner cutting grid pathfinding", "shortest clear path in a binary matrix"],
  tags: "grid bfs 8 directions diagonal chebyshev king moves binary matrix corner cutting shortest clear path",
  a: "Use the same BFS as the 4-direction version but loop over eight (dr, dc) offsets; each move still costs 1 so BFS stays optimal. Decide up front whether a diagonal step may squeeze between two diagonal walls (corner cutting) and forbid it if not. If diagonals cost sqrt(2), use Dijkstra or A* with the octile heuristic.",
  code: { py: `from collections import deque

DIRS8 = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0)]

def bfs8(grid, start, goal, cut_corners=True):
    """grid: list of strings with '#' walls. Returns the number of moves, or -1."""
    R, C = len(grid), len(grid[0])
    free = lambda r, c: 0 <= r < R and 0 <= c < C and grid[r][c] != '#'
    if not free(*start) or not free(*goal):
        return -1
    dist = {start: 0}
    q = deque([start])
    while q:
        r, c = q.popleft()
        if (r, c) == goal:
            return dist[(r, c)]
        for dr, dc in DIRS8:
            nr, nc = r + dr, c + dc
            if not free(nr, nc) or (nr, nc) in dist:
                continue
            if not cut_corners and dr and dc and not (free(r + dr, c) and free(r, c + dc)):
                continue                       # diagonal blocked by a wall beside it
            dist[(nr, nc)] = dist[(r, c)] + 1
            q.append((nr, nc))
    return -1

print(bfs8(["..#", "#.#", "#.."], (0, 0), (2, 2)), bfs8([".#", "#."], (0, 0), (1, 1)), bfs8([".#", "#."], (0, 0), (1, 1), False))
# 2 1 -1`,
  },
  check: `import random
random.seed(15)
for _ in range(300):
    R, C = random.randint(1, 7), random.randint(1, 7)
    empty = ['.' * C] * R
    a, b = (random.randrange(R), random.randrange(C)), (random.randrange(R), random.randrange(C))
    assert bfs8(empty, a, b) == max(abs(a[0] - b[0]), abs(a[1] - b[1]))
    grid = [''.join('#' if random.random() < 0.3 else '.' for _ in range(C)) for _ in range(R)]
    for cut in (True, False):
        # oracle: Bellman-Ford style relaxation over the move rules
        INF = 10**9; d = [[INF] * C for _ in range(R)]
        ok = lambda r, c: 0 <= r < R and 0 <= c < C and grid[r][c] != '#'
        if ok(*a): d[a[0]][a[1]] = 0
        for _ in range(R * C):
            for r in range(R):
                for c in range(C):
                    if d[r][c] < INF:
                        for dr in (-1, 0, 1):
                            for dc in (-1, 0, 1):
                                nr, nc = r + dr, c + dc
                                if (dr or dc) and ok(nr, nc) and (cut or not (dr and dc) or (ok(r + dr, c) and ok(r, c + dc))):
                                    d[nr][nc] = min(d[nr][nc], d[r][c] + 1)
        want = d[b[0]][b[1]] if ok(*b) and d[b[0]][b[1]] < INF else -1
        assert bfs8(grid, a, b, cut) == want`,
  more: "- Chebyshev distance max(|dr|, |dc|) is the exact answer on an empty grid and a valid admissible heuristic for A* with unit-cost diagonals.\n- Corner cutting policies: allow (cut_corners=True), forbid when either orthogonal neighbor is a wall, or forbid only when both are walls. Check what the problem statement says.\n- Weighted diagonals (sqrt 2) make plain BFS wrong; use Dijkstra with octile distance.\n- Mark visited when enqueuing, not when dequeuing.",
  cx: "Time O(R*C*8) = O(R*C), space O(R*C)",
  see: ["#/topic/matrix", "#/topic/graphs", "#/problem/1091"]
},
{
  id: "cp-grid-dijkstra-terrain", cat: "Graphs: shortest paths", title: "Dijkstra on a grid with terrain costs",
  q: ["dijkstra on a grid", "grid with different cell costs shortest path", "minimum cost path in a grid dijkstra", "weighted terrain pathfinding", "min path sum with moves in four directions", "dijkstra matrix python", "cheapest path through a weighted grid", "grid shortest path with weights"],
  tags: "dijkstra grid terrain cost weighted cells minimum cost path matrix four directions heap",
  a: "Treat each cell as a vertex whose cost is paid when you enter it, and run Dijkstra with a heap of (cost, row, col). Unlike the right/down-only DP, this handles moves in all four directions because Dijkstra settles cells in cost order, so no ordering of rows or columns is needed.",
  code: { py: `import heapq

def min_cost_grid(cost, start, goal):
    """cost[r][c] >= 0 is paid on entering the cell (the start cell is free). 4 directions."""
    R, C = len(cost), len(cost[0])
    INF = float('inf')
    dist = [[INF] * C for _ in range(R)]
    dist[start[0]][start[1]] = 0
    pq = [(0, start[0], start[1])]
    while pq:
        d, r, c = heapq.heappop(pq)
        if d > dist[r][c]:
            continue
        if (r, c) == goal:
            return d
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C and d + cost[nr][nc] < dist[nr][nc]:
                dist[nr][nc] = d + cost[nr][nc]
                heapq.heappush(pq, (dist[nr][nc], nr, nc))
    return INF

terrain = [[1, 9, 1], [1, 9, 1], [1, 1, 1]]
print(min_cost_grid(terrain, (0, 0), (0, 2)))   # 6: down, down, right, right, up, up (the 9s are avoided)`,
  },
  check: `import random
random.seed(16)
for _ in range(300):
    R, C = random.randint(1, 6), random.randint(1, 6)
    cost = [[random.randint(0, 9) for _ in range(C)] for _ in range(R)]
    a, b = (random.randrange(R), random.randrange(C)), (random.randrange(R), random.randrange(C))
    d = [[float('inf')] * C for _ in range(R)]; d[a[0]][a[1]] = 0
    changed = True
    while changed:
        changed = False
        for r in range(R):
            for c in range(C):
                for nr, nc in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
                    if 0 <= nr < R and 0 <= nc < C and d[r][c] + cost[nr][nc] < d[nr][nc]:
                        d[nr][nc] = d[r][c] + cost[nr][nc]; changed = True
    assert min_cost_grid(cost, a, b) == d[b[0]][b[1]]
assert min_cost_grid([[5]], (0, 0), (0, 0)) == 0`,
  more: "- Decide whether the start cell's cost counts; the code above does not charge it (add cost[start] to the answer if it should).\n- Edge-based costs (cost to move between cells) just change the relaxation line.\n- Right/down-only grids need only DP (min path sum); use Dijkstra when moving up or left is allowed.\n- For weights 1..9 on a huge grid consider Dial's buckets; with a goal and a good heuristic use A*.",
  cx: "Time O(R*C log(R*C)), space O(R*C)",
  see: ["#/topic/shortest-paths", "#/topic/matrix", "#/problem/1631", "#/problem/778"]
},
{
  id: "cp-jump-point-search", cat: "Graphs: search", title: "Jump point search (overview with the jump primitive)",
  q: ["jump point search", "jps pathfinding", "jump point search explained", "speed up a star on uniform grids", "jump point search python", "forced neighbors pathfinding", "jps vs a star", "symmetry breaking grid pathfinding"],
  tags: "jump point search jps forced neighbor pruning symmetry grid pathfinding a star speedup jump",
  a: "This is an overview, not a full JPS. Jump point search speeds up A* on uniform-cost grids by not queuing every cell: from a node it scans in a straight line until it hits the goal or a cell with a forced neighbor (an open cell beside a wall that only this line can reach). Those cells are the successors. The code is the straight-line jump primitive.",
  code: { py: `def jump_straight(grid, r, c, dr, dc, goal):
    """Scan from (r, c) in a straight direction (dr, dc) one of the four axes.
    Returns the next jump point (goal or a cell with a forced neighbor), or None if a wall comes first."""
    R, C = len(grid), len(grid[0])
    free = lambda a, b: 0 <= a < R and 0 <= b < C and grid[a][b] != '#'
    while True:
        r, c = r + dr, c + dc
        if not free(r, c):
            return None
        if (r, c) == goal:
            return (r, c)
        if dr == 0:      # moving horizontally: look for a wall above/below with open space diagonally ahead
            if (not free(r - 1, c) and free(r - 1, c + dc)) or (not free(r + 1, c) and free(r + 1, c + dc)):
                return (r, c)
        else:            # moving vertically
            if (not free(r, c - 1) and free(r + dr, c - 1)) or (not free(r, c + 1) and free(r + dr, c + 1)):
                return (r, c)

g = ["......",
     "..#...",
     "......"]
print(jump_straight(g, 0, 0, 0, 1, (2, 5)), jump_straight(g, 1, 0, 0, 1, (2, 5)))   # (0, 2) None`,
  },
  check: `g = ["......", "..#...", "......"]
assert jump_straight(g, 0, 0, 0, 1, (2, 5)) == (0, 2)      # wall below (1,2) with open (1,3) beyond
assert jump_straight(g, 2, 0, 0, 1, (2, 5)) == (2, 2)      # wall above (1,2) with open (1,3) beyond
assert jump_straight(g, 1, 0, 0, 1, (2, 5)) is None        # runs into the wall at (1,2)
assert jump_straight(g, 0, 0, 0, 1, (0, 1)) == (0, 1)      # goal reached first
assert jump_straight(g, 0, 3, 0, 1, (2, 5)) is None        # open corridor to the edge, no forced neighbors
assert jump_straight(g, 0, 4, 1, 0, (2, 5)) is None`,
  more: "- Real JPS also jumps diagonally: at each diagonal step it runs the two straight jumps and keeps the diagonal cell if either finds a jump point. Then it runs A* over only those jump points.\n- It needs uniform edge costs (and a fixed corner-cutting rule); with varied terrain costs the pruning is unsafe.\n- The path it returns is optimal in the same sense as grid A*; only the number of expanded nodes shrinks, often by a large factor in open maps.\n- Preprocessing variants (JPS+) precompute jump distances for even more speed.",
  cx: "Worst case equals A* on the grid, O(R*C log(R*C)); on open grids it typically expands far fewer nodes. Each straight jump scan is O(length).",
  see: ["#/topic/advanced-graphs", "#/topic/matrix"]
},
{
  id: "cp-dstar-lite", cat: "Graphs: search", title: "D* Lite / LPA* (incremental replanning, overview with a working core)",
  q: ["d star lite", "d* lite algorithm", "replan path when map changes", "lpa star incremental search", "dynamic pathfinding with changing obstacles", "incremental shortest path update when an edge cost changes", "d* lite explained", "robot replanning shortest path"],
  tags: "d-star lite dstar lpa star incremental replanning dynamic obstacles rhs g value repair robot navigation",
  a: "This is an overview with a working core. D* Lite keeps, for every node, g (current distance to goal) and rhs (one-step lookahead). When an edge cost changes it only repairs nodes where g and rhs disagree, instead of re-searching everything. Below is that repair loop without the A* heuristic and the moving-robot bookkeeping.",
  code: { py: `import heapq
INF = float('inf')

class IncrementalDistances:
    """Distance-to-goal for all nodes of an undirected graph, repaired incrementally after cost changes."""
    def __init__(self, n, edges, goal):
        self.goal = goal
        self.cost = {}
        self.nb = [[] for _ in range(n)]
        for u, v, w in edges:
            self.cost[(u, v)] = self.cost[(v, u)] = w
            self.nb[u].append(v)
            self.nb[v].append(u)
        self.g = [INF] * n
        self.rhs = [INF] * n
        self.rhs[goal] = 0
        self.pq = []
        self._push(goal)
        self.repair()

    def _push(self, u):
        if self.g[u] != self.rhs[u]:
            heapq.heappush(self.pq, (min(self.g[u], self.rhs[u]), u))

    def _update(self, u):
        if u != self.goal:
            self.rhs[u] = min((self.cost[(u, v)] + self.g[v] for v in self.nb[u]), default=INF)
        self._push(u)

    def repair(self):
        while self.pq:
            key, u = heapq.heappop(self.pq)
            if key != min(self.g[u], self.rhs[u]) or self.g[u] == self.rhs[u]:
                continue                         # stale or already consistent
            if self.g[u] > self.rhs[u]:          # overconsistent: lower g to rhs
                self.g[u] = self.rhs[u]
            else:                                # underconsistent: reset and recompute
                self.g[u] = INF
                self._update(u)
            for v in self.nb[u]:
                self._update(v)

    def set_cost(self, u, v, w):                 # w = INF blocks the edge
        self.cost[(u, v)] = self.cost[(v, u)] = w
        self._update(u)
        self._update(v)
        self.repair()

net = IncrementalDistances(4, [(0, 1, 1), (1, 3, 1), (0, 2, 2), (2, 3, 2)], goal=3)
print(net.g[0]); net.set_cost(1, 3, INF); print(net.g[0])   # 2 then 4`,
  },
  check: `import random
random.seed(18)
def dij(n, cost, goal):
    d = [INF] * n; d[goal] = 0; pq = [(0, goal)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for (a, b), w in cost.items():
            if a == u and x + w < d[b]: d[b] = x + w; heapq.heappush(pq, (d[b], b))
    return d
for _ in range(150):
    n = random.randint(2, 8)
    edges = list({(min(a, b), max(a, b)): random.randint(1, 6) for a, b in [(random.randrange(n), random.randrange(n)) for _ in range(2 * n)] if a != b}.items())
    edges = [(a, b, w) for (a, b), w in edges]
    if not edges: continue
    goal = random.randrange(n)
    net = IncrementalDistances(n, edges, goal)
    assert net.g == dij(n, net.cost, goal)
    for _ in range(8):
        a, b, _w = random.choice(edges)
        net.set_cost(a, b, random.choice([INF, 1, 3, 9]))
        assert net.g == dij(n, net.cost, goal)`,
  more: "- Full D* Lite adds an A* heuristic toward the robot's current position and a key offset km so the queue stays valid while the robot moves; this snippet is the LPA*-style core only.\n- Invariant: g[u] = rhs[u] for all nodes means distances are correct. Increases (blocked edges) make nodes underconsistent and are handled by resetting g to INF.\n- Use it when many small changes arrive between queries (robots, games). For a one-off change, just rerun Dijkstra or A*.\n- Costs must be non-negative.",
  cx: "Initial repair like Dijkstra O((V+E) log V); each cost change costs time proportional to the affected nodes, worst case O((V+E) log V)",
  see: ["#/topic/advanced-graphs", "#/topic/shortest-paths"]
},
{
  id: "cp-contraction-hierarchies", cat: "Graphs: shortest paths", title: "Contraction hierarchies (overview with a toy implementation)",
  q: ["contraction hierarchies", "how do road routing engines work", "contraction hierarchies python", "speed up shortest path queries with preprocessing", "node contraction shortcut witness search", "ch routing explained", "fast shortest path on road networks", "shortcuts in a graph for faster dijkstra"],
  tags: "contraction hierarchies ch routing road network shortcuts witness search node order upward search preprocessing",
  a: "This is an overview with a small working toy. Contraction hierarchies order the nodes by importance, contract them one by one, and add a shortcut u-w (weight = w(u,v)+w(v,w)) whenever removing v would otherwise lengthen the u-w distance. A query then runs two upward-only Dijkstras from s and t and takes the best meeting node.",
  code: { py: `import heapq
INF = float('inf')

def build_ch(adj, order):
    """adj: {u: {v: w}} undirected, positive weights. order: contraction order (any permutation).
    Returns up: {u: {v: w}} holding edges from u to nodes contracted later (including shortcuts)."""
    g = {u: dict(nb) for u, nb in adj.items()}
    up = {u: {} for u in adj}
    def witness(a, b, skip, limit):          # shortest a-b distance avoiding 'skip', searched up to 'limit'
        dist, pq = {a: 0}, [(0, a)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            if u == b:
                return d
            for v, w in g[u].items():
                if v != skip and d + w <= limit and d + w < dist.get(v, INF):
                    dist[v] = d + w
                    heapq.heappush(pq, (d + w, v))
        return INF
    for v in order:
        nbrs = list(g[v].items())
        for i, (a, wa) in enumerate(nbrs):
            for b, wb in nbrs[i + 1:]:
                if witness(a, b, v, wa + wb) > wa + wb:      # no equally short detour: add a shortcut
                    g[a][b] = g[b][a] = min(wa + wb, g[a].get(b, INF))
        for u, w in nbrs:
            up[v][u] = w
            del g[u][v]
        del g[v]
    return up

def ch_query(up, s, t):
    def upward(src):
        dist, pq = {src: 0}, [(0, src)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            for v, w in up[u].items():
                if d + w < dist.get(v, INF):
                    dist[v] = d + w
                    heapq.heappush(pq, (d + w, v))
        return dist
    ds, dt = upward(s), upward(t)
    return min((ds[v] + dt[v] for v in ds if v in dt), default=INF)

adj = {0: {1: 1}, 1: {0: 1, 2: 1}, 2: {1: 1, 3: 1}, 3: {2: 1}}
up = build_ch(adj, [1, 2, 0, 3])
print(ch_query(up, 0, 3))   # 3`,
  },
  check: `import random
random.seed(20)
def dij(adj, s):
    d = {s: 0}; pq = [(0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]: continue
        for v, w in adj[u].items():
            if x + w < d.get(v, INF): d[v] = x + w; heapq.heappush(pq, (x + w, v))
    return d
for _ in range(200):
    n = random.randint(2, 9); adj = {i: {} for i in range(n)}
    for _ in range(random.randint(1, 3 * n)):
        a, b, w = random.randrange(n), random.randrange(n), random.randint(1, 9)
        if a != b: adj[a][b] = adj[b][a] = w
    order = list(range(n)); random.shuffle(order)
    up = build_ch(adj, order)
    for _ in range(6):
        s, t = random.randrange(n), random.randrange(n)
        assert ch_query(up, s, t) == dij(adj, s).get(t, INF)`,
  more: "- Correct for any contraction order; the order only decides how many shortcuts appear and how fast queries are. Real systems pick it with heuristics (edge difference, contracted-neighbor count).\n- The witness search is what keeps the shortcut count small; this toy runs it with a distance limit but no hop limit.\n- Queries only climb the hierarchy, so they touch very few nodes: milliseconds on continent-sized road graphs.\n- Weights that change (live traffic) force re-preprocessing; consider ALT or customizable variants then.",
  cx: "Preprocessing is graph and order dependent (this toy: up to O(V * deg^2) witness searches); a query is two upward Dijkstras, typically a tiny fraction of V; space O(V + E + shortcuts)",
  see: ["#/topic/advanced-graphs", "#/topic/shortest-paths"]
},
{
  id: "cp-alt-landmarks", cat: "Graphs: shortest paths", title: "ALT (A* with landmarks and triangle inequality)",
  q: ["alt algorithm shortest path", "a star landmarks triangle inequality", "landmark heuristic for a star", "alt a* landmarks python", "precompute distances to speed up shortest path", "a* heuristic from landmarks", "landmark based routing", "how to choose landmarks"],
  tags: "alt a-star landmarks triangle inequality heuristic precomputed distances farthest first road network routing",
  a: "ALT precomputes shortest distances from a few landmark nodes. For any node v and target t, the triangle inequality gives the lower bound h(v) = max over landmarks L of |d(L,t) - d(L,v)|. That bound is admissible and consistent, so A* with it stays optimal on any undirected graph with positive weights, even without coordinates.",
  code: { py: `import heapq
INF = float('inf')

def all_dist(adj, s):
    d, pq = {s: 0}, [(0, s)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > d[u]:
            continue
        for v, w in adj[u]:
            if x + w < d.get(v, INF):
                d[v] = x + w
                heapq.heappush(pq, (x + w, v))
    return d

def pick_landmarks(adj, k):
    """Farthest-first selection. Assumes a connected undirected graph."""
    first = max(all_dist(adj, next(iter(adj))).items(), key=lambda kv: kv[1])[0]
    marks, dists = [first], [all_dist(adj, first)]
    while len(marks) < k:
        far = max(adj, key=lambda v: min(d[v] for d in dists))
        marks.append(far)
        dists.append(all_dist(adj, far))
    return dists

def alt_astar(adj, lm, s, t):
    """lm: list of landmark distance dicts. Returns (distance, nodes_expanded)."""
    h = lambda v: max((abs(d[t] - d[v]) for d in lm if t in d and v in d), default=0)
    g, pq, done = {s: 0}, [(h(s), s)], set()
    while pq:
        _, u = heapq.heappop(pq)
        if u in done:
            continue
        if u == t:
            return g[t], len(done)
        done.add(u)
        for v, w in adj[u]:
            if g[u] + w < g.get(v, INF):
                g[v] = g[u] + w
                heapq.heappush(pq, (g[v] + h(v), v))
    return INF, len(done)

adj = {0: [(1, 2)], 1: [(0, 2), (2, 2)], 2: [(1, 2), (3, 2)], 3: [(2, 2)]}
print(alt_astar(adj, pick_landmarks(adj, 2), 0, 3))   # (6, 3)`,
  },
  check: `import random
random.seed(22)
for _ in range(150):
    n = random.randint(2, 14); adj = {i: [] for i in range(n)}
    for i in range(1, n):                       # random tree keeps it connected
        j = random.randrange(i); w = random.randint(1, 9)
        adj[i].append((j, w)); adj[j].append((i, w))
    for _ in range(n):
        a, b = random.randrange(n), random.randrange(n)
        if a != b:
            w = random.randint(1, 9); adj[a].append((b, w)); adj[b].append((a, w))
    lm = pick_landmarks(adj, random.randint(1, 3))
    for _ in range(6):
        s, t = random.randrange(n), random.randrange(n)
        assert alt_astar(adj, lm, s, t)[0] == all_dist(adj, s)[t]
assert alt_astar({0: []}, pick_landmarks({0: []}, 1), 0, 0) == (0, 0)`,
  more: "- Bound: d(s,t) >= |d(L,t) - d(L,s)| for every landmark L (triangle inequality), and the max over landmarks is still a lower bound.\n- Needs undirected graphs, or both forward and backward distances per landmark in the directed case.\n- Good landmarks sit on the periphery, spread out (farthest-first); 8-16 usually suffice on road maps.\n- Memory cost is k distance tables; unlike contraction hierarchies it tolerates weight changes cheaply if tables are refreshed.",
  cx: "Preprocessing O(k (V+E) log V); each query is A* with an O(k) heuristic, worst case O(E log V) but usually far fewer expansions; space O(k V)",
  see: ["#/topic/advanced-graphs", "#/topic/shortest-paths"]
},
{
  id: "cp-lca-binary-lifting", cat: "Graphs: trees", title: "Lowest common ancestor with binary lifting",
  q: ["lowest common ancestor", "lca binary lifting", "lca python", "how to find lca of two nodes in a tree", "binary lifting lca implementation", "lca of a tree in o(log n)", "least common ancestor algorithm", "lca with ancestor table"],
  tags: "lca lowest common ancestor binary lifting jump pointers ancestor table sparse doubling tree depth 236",
  a: "Precompute up[j][v], the 2^j-th ancestor of v. To get the LCA of u and v, first lift the deeper node to the same depth using the bits of the depth difference, then, if they differ, jump both upward by decreasing powers of two whenever the ancestors differ; the parent of the result is the LCA.",
  code: { py: `class LCA:
    def __init__(self, adj, root=0):
        n = len(adj)
        self.LOG = max(1, n.bit_length())
        self.depth = [0] * n
        up0 = [root] * n                       # the root is its own parent, so jumps stay inside the tree
        order, seen = [root], {root}
        for u in order:                        # BFS: parents come before children
            for v in adj[u]:
                if v not in seen:
                    seen.add(v)
                    self.depth[v] = self.depth[u] + 1
                    up0[v] = u
                    order.append(v)
        self.up = [up0]
        for j in range(1, self.LOG):
            prev = self.up[-1]
            self.up.append([prev[prev[v]] for v in range(n)])

    def query(self, u, v):
        if self.depth[u] < self.depth[v]:
            u, v = v, u
        diff = self.depth[u] - self.depth[v]
        for j in range(self.LOG):
            if diff >> j & 1:
                u = self.up[j][u]
        if u == v:
            return u
        for j in range(self.LOG - 1, -1, -1):
            if self.up[j][u] != self.up[j][v]:
                u, v = self.up[j][u], self.up[j][v]
        return self.up[0][u]

adj = [[1, 2], [0, 3, 4], [0], [1], [1]]
t = LCA(adj)
print(t.query(3, 4), t.query(3, 2), t.query(1, 3))   # 1 0 1`,
  },
  check: `import random
random.seed(1)
for _ in range(200):
    n = random.randint(1, 30); par = [-1] + [random.randrange(i) for i in range(1, n)]
    adj = [[] for _ in range(n)]
    for i in range(1, n): adj[i].append(par[i]); adj[par[i]].append(i)
    t = LCA(adj)
    def anc(v):
        r = [v]
        while par[v] != -1: v = par[v]; r.append(v)
        return r
    for _ in range(20):
        u, v = random.randrange(n), random.randrange(n)
        au = set(anc(u)); want = next(x for x in anc(v) if x in au)
        assert t.query(u, v) == want
assert LCA([[]]).query(0, 0) == 0`,
  more: "- Invariant: after the depth is equalized, u and v have the same ancestor at every level above the LCA and different ancestors below it, so jumping while the 2^j ancestors differ lands just under the LCA.\n- Making the root its own parent avoids bounds checks.\n- Memory O(n log n); for O(1) queries use an Euler tour with a sparse table.\n- Same table answers k-th ancestor and path-length queries (depth[u]+depth[v]-2*depth[lca]).",
  cx: "Preprocess O(n log n) time and space; each query O(log n)",
  see: ["#/topic/trees", "#/topic/advanced-graphs", "#/problem/236"]
},
{
  id: "cp-lca-euler-sparse-table", cat: "Graphs: trees", title: "LCA with Euler tour and sparse table (O(1) queries)",
  q: ["lca o(1) query", "lca euler tour sparse table", "lca range minimum query", "fast lca many queries", "euler tour lca python", "reduce lca to rmq", "lca with sparse table", "constant time lowest common ancestor"],
  tags: "lca euler tour sparse table rmq range minimum query o1 depth first occurrence lowest common ancestor",
  a: "Write down the vertices of an Euler tour (record a node every time DFS enters it or returns to it). The LCA of u and v is the shallowest vertex between their first occurrences in that list, a range minimum query by depth. A sparse table answers it in O(1) after O(n log n) preprocessing.",
  code: { py: `class LCAEuler:
    def __init__(self, adj, root=0):
        n = len(adj)
        self.first = [0] * n
        depth = [0] * n
        euler = [(0, root)]                              # (depth, vertex)
        stack = [(root, -1, iter(adj[root]))]
        while stack:
            u, p, it = stack[-1]
            for v in it:
                if v != p:
                    depth[v] = depth[u] + 1
                    self.first[v] = len(euler)
                    euler.append((depth[v], v))
                    stack.append((v, u, iter(adj[v])))
                    break
            else:                                         # children exhausted: go back to the parent
                stack.pop()
                if stack:
                    pu = stack[-1][0]
                    euler.append((depth[pu], pu))
        self.sp = [euler]
        j = 1
        while (1 << j) <= len(euler):
            prev = self.sp[-1]
            half = 1 << (j - 1)
            self.sp.append([min(prev[i], prev[i + half]) for i in range(len(euler) - (1 << j) + 1)])
            j += 1

    def query(self, u, v):
        l, r = sorted((self.first[u], self.first[v]))
        k = (r - l + 1).bit_length() - 1
        return min(self.sp[k][l], self.sp[k][r - (1 << k) + 1])[1]

adj = [[1, 2], [0, 3, 4], [0], [1], [1]]
print(LCAEuler(adj).query(3, 4), LCAEuler(adj).query(3, 2))   # 1 0`,
  },
  check: `import random
random.seed(2)
for _ in range(200):
    n = random.randint(1, 30); par = [-1] + [random.randrange(i) for i in range(1, n)]
    adj = [[] for _ in range(n)]
    for i in range(1, n): adj[i].append(par[i]); adj[par[i]].append(i)
    t = LCAEuler(adj)
    def anc(v):
        r = [v]
        while par[v] != -1: v = par[v]; r.append(v)
        return r
    for _ in range(20):
        u, v = random.randrange(n), random.randrange(n)
        au = set(anc(u)); want = next(x for x in anc(v) if x in au)
        assert t.query(u, v) == want
assert LCAEuler([[]]).query(0, 0) == 0`,
  more: "- The Euler tour has 2n-1 entries; between first[u] and first[v] every visited node is a descendant of the LCA, and the LCA itself appears, so the minimum depth is the LCA.\n- Tuples (depth, vertex) let min() return the vertex directly.\n- Use it when queries vastly outnumber nodes; binary lifting is simpler and uses half the memory.\n- Iterative DFS avoids Python's recursion limit on deep trees.",
  cx: "Preprocess O(n log n) time and space; each query O(1)",
  see: ["#/topic/trees", "#/topic/segment-tree", "#/topic/advanced-graphs"]
},
{
  id: "cp-tree-diameter", cat: "Graphs: trees", title: "Tree diameter (two-pass search)",
  q: ["diameter of a tree", "tree diameter two bfs", "longest path in a tree", "tree diameter python", "diameter of a weighted tree", "how to find the farthest two nodes in a tree", "longest path between any two nodes in an undirected tree", "tree diameter dfs twice"],
  tags: "tree diameter longest path two bfs two dfs farthest node endpoints weighted non-negative 543 1245",
  a: "Pick any node, find the farthest node a from it, then find the farthest node b from a. The distance a-b is the diameter, and a, b are its endpoints. This works for trees with non-negative edge weights; with negative weights use the DP over subtrees instead.",
  code: { py: `def tree_diameter(adj):
    """adj: {u: [(v, w)]} for an undirected tree with w >= 0. Returns (length, a, b, path)."""
    def farthest(src):
        dist, parent = {src: 0}, {src: None}
        stack = [src]
        while stack:
            u = stack.pop()
            for v, w in adj[u]:
                if v not in dist:
                    dist[v] = dist[u] + w
                    parent[v] = u
                    stack.append(v)
        far = max(dist, key=dist.get)
        return far, dist[far], parent
    a, _, _ = farthest(next(iter(adj)))
    b, length, parent = farthest(a)
    path = []
    while b is not None:
        path.append(b)
        b = parent[b]
    return length, a, path[0], path[::-1]

adj = {0: [(1, 2), (2, 3)], 1: [(0, 2), (3, 4)], 2: [(0, 3)], 3: [(1, 4), (4, 1)], 4: [(3, 1)]}
print(tree_diameter(adj))   # (10, 4, 2, [4, 3, 1, 0, 2])`,
  },
  check: `import random
random.seed(3)
for _ in range(200):
    n = random.randint(1, 12); adj = {i: [] for i in range(n)}
    for i in range(1, n):
        p, w = random.randrange(i), random.randint(0, 9); adj[i].append((p, w)); adj[p].append((i, w))
    best = 0
    for s in range(n):
        d = {s: 0}; st = [s]
        while st:
            u = st.pop()
            for v, w in adj[u]:
                if v not in d: d[v] = d[u] + w; st.append(v)
        best = max(best, max(d.values()))
    length, a, b, path = tree_diameter(adj)
    assert length == best and path[0] == a and path[-1] == b
    w = {(u, v): c for u in adj for v, c in adj[u]}
    assert sum(w[(x, y)] for x, y in zip(path, path[1:])) == length`,
  more: "- Why it works: for any start node, the farthest node is an endpoint of some diameter.\n- Fails with negative edge weights and on general graphs with cycles.\n- Alternative single pass: DP returning the best downward depth for each node while updating the answer with the two deepest child chains (needed when you want the diameter inside a rooted recursion, like LeetCode 543).\n- All diameters share the same center point(s).",
  cx: "Time O(n), space O(n)",
  see: ["#/topic/trees", "#/topic/tree-dp", "#/problem/543"]
},
{
  id: "cp-tree-rerooting", cat: "Graphs: trees", title: "Tree rerooting DP (sum of distances to all nodes)",
  q: ["rerooting dp", "sum of distances in tree", "reroot tree dp python", "answer for every root of a tree", "tree dp for all roots", "sum of distances to every other node", "rerooting technique explained", "compute f(root) for every node as root"],
  tags: "rerooting reroot tree dp sum of distances in tree all roots two pass down up 834 subtree size",
  a: "Rerooting computes a tree quantity for every node as the root in O(n) total. Pass 1 (bottom-up) gets the answer for root 0 and subtree sizes. Pass 2 (top-down) derives each child's answer from its parent's: moving the root from p to child c brings size[c] nodes one step closer and sends n - size[c] nodes one step farther.",
  code: { py: `def sum_of_distances(adj):
    """adj: list of neighbor lists of a tree. Returns res[v] = sum of distances from v to all nodes."""
    n = len(adj)
    parent = [-1] * n
    order = [0]
    for u in order:                       # iterative preorder over the rooted tree
        for v in adj[u]:
            if v != parent[u]:
                parent[v] = u
                order.append(v)
    size = [1] * n
    down = [0] * n                        # sum of distances from u to nodes in its own subtree
    for u in reversed(order):
        p = parent[u]
        if p != -1:
            size[p] += size[u]
            down[p] += down[u] + size[u]
    res = [0] * n
    res[0] = down[0]
    for u in order[1:]:                   # parent's answer is ready before the child's
        res[u] = res[parent[u]] - size[u] + (n - size[u])
    return res

print(sum_of_distances([[1, 2], [0], [0, 3], [2]]))   # [4, 6, 4, 6]`,
  },
  check: `import random
from collections import deque
random.seed(4)
for _ in range(200):
    n = random.randint(1, 20); adj = [[] for _ in range(n)]
    for i in range(1, n):
        p = random.randrange(i); adj[i].append(p); adj[p].append(i)
    want = []
    for s in range(n):
        d = [-1] * n; d[s] = 0; q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if d[v] < 0: d[v] = d[u] + 1; q.append(v)
        want.append(sum(d))
    assert sum_of_distances(adj) == want
assert sum_of_distances([[]]) == [0]`,
  more: "- Recipe: (1) compute the answer for one root and gather per-subtree info; (2) write a formula to move the root across one edge; (3) apply it top-down.\n- For non-invertible combinations (max, min, gcd) you cannot subtract; keep prefix/suffix aggregates over a node's children instead.\n- Pitfall: recursion depth on path-like trees; iterate over a BFS/preorder list like above.\n- Naive alternative: n separate DFS runs, O(n^2).",
  cx: "Time O(n), space O(n)",
  see: ["#/topic/tree-dp", "#/topic/trees", "#/cheatsheets/dp-catalog"]
},
{
  id: "cp-heavy-light-decomposition", cat: "Graphs: trees", title: "Heavy-light decomposition (path queries)",
  q: ["heavy light decomposition", "hld python", "path query on a tree", "max on path between two nodes in a tree", "hld with segment tree", "heavy light decomposition explained", "tree path update and query", "how to do path queries with hld"],
  tags: "heavy light decomposition hld chains head position segment tree path query path maximum tree flattening",
  a: "HLD splits a rooted tree into chains by linking each node to its largest-subtree (heavy) child, so any root-to-node path crosses only O(log n) chains. Number nodes so each chain is contiguous, put values into a segment tree, and answer a u-v path query by climbing chain by chain. Below is a working path-maximum with point update.",
  code: { py: `class HLD:
    def __init__(self, adj, val, root=0):
        n = len(adj)
        self.n, self.val = n, val
        self.parent, self.depth = [-1] * n, [0] * n
        order = [root]
        for u in order:
            for v in adj[u]:
                if v != self.parent[u]:
                    self.parent[v], self.depth[v] = u, self.depth[u] + 1
                    order.append(v)
        size = [1] * n
        for u in reversed(order):
            if self.parent[u] != -1:
                size[self.parent[u]] += size[u]
        heavy = [-1] * n
        for u in order:
            best = 0
            for v in adj[u]:
                if v != self.parent[u] and size[v] > best:
                    best, heavy[u] = size[v], v
        self.head, self.pos = [0] * n, [0] * n
        cur = 0
        for u in order:                        # each chain starts at a node that is not its parent's heavy child
            if self.parent[u] == -1 or heavy[self.parent[u]] != u:
                v = u
                while v != -1:
                    self.head[v], self.pos[v] = u, cur
                    cur += 1
                    v = heavy[v]
        self.NEG = float('-inf')
        self.t = [self.NEG] * (2 * n)          # iterative segment tree (max)
        for v in range(n):
            self.t[n + self.pos[v]] = val[v]
        for i in range(n - 1, 0, -1):
            self.t[i] = max(self.t[2 * i], self.t[2 * i + 1])

    def _range_max(self, l, r):                # inclusive positions
        res = self.NEG
        l += self.n
        r += self.n + 1
        while l < r:
            if l & 1:
                res = max(res, self.t[l]); l += 1
            if r & 1:
                r -= 1; res = max(res, self.t[r])
            l >>= 1; r >>= 1
        return res

    def update(self, v, x):
        i = self.n + self.pos[v]
        self.t[i] = x
        i >>= 1
        while i:
            self.t[i] = max(self.t[2 * i], self.t[2 * i + 1])
            i >>= 1

    def path_max(self, u, v):
        res = self.NEG
        while self.head[u] != self.head[v]:
            if self.depth[self.head[u]] < self.depth[self.head[v]]:
                u, v = v, u
            res = max(res, self._range_max(self.pos[self.head[u]], self.pos[u]))
            u = self.parent[self.head[u]]
        if self.depth[u] > self.depth[v]:
            u, v = v, u
        return max(res, self._range_max(self.pos[u], self.pos[v]))

adj = [[1, 2], [0, 3, 4], [0], [1], [1]]
h = HLD(adj, [5, 1, 7, 2, 9])
print(h.path_max(3, 2), h.path_max(3, 4)); h.update(1, 20); print(h.path_max(3, 4))   # 7 9 20`,
  },
  check: `import random
random.seed(5)
for _ in range(200):
    n = random.randint(1, 25); par = [-1] + [random.randrange(i) for i in range(1, n)]
    adj = [[] for _ in range(n)]
    for i in range(1, n): adj[i].append(par[i]); adj[par[i]].append(i)
    val = [random.randint(-9, 99) for _ in range(n)]
    h = HLD(adj, val)
    def anc(v):
        r = [v]
        while par[v] != -1: v = par[v]; r.append(v)
        return r
    def naive(u, v):
        au, av = anc(u), anc(v); s = set(au)
        l = next(x for x in av if x in s)
        nodes = au[:au.index(l) + 1] + av[:av.index(l)]
        return max(val[x] for x in nodes)
    for _ in range(15):
        if random.random() < 0.3:
            x, y = random.randrange(n), random.randint(-9, 99); val[x] = y; h.update(x, y)
        u, v = random.randrange(n), random.randrange(n)
        assert h.path_max(u, v) == naive(u, v)`,
  more: "- Light edge means the child's subtree is at most half of the parent's, so a path crosses at most log2(n) light edges and therefore O(log n) chains.\n- Positions along a chain are consecutive; add a DFS order that visits the heavy child first if you also need subtree-range queries.\n- Edge-weighted queries: store each edge's weight on its deeper endpoint and skip the LCA node in the last range.\n- Replace max with sums, xor etc. by changing the segment tree; use a lazy tree for path updates.\n- Simpler alternatives when offline: Euler tour plus Fenwick for subtree queries.",
  cx: "Build O(n); a path query or point update O(log^2 n) (O(log n) chains times O(log n) per segment-tree query); space O(n)",
  see: ["#/topic/segment-tree", "#/topic/trees", "#/topic/advanced-graphs"]
},
{
  id: "cp-centroid-decomposition", cat: "Graphs: trees", title: "Centroid decomposition (overview with decomposition code)",
  q: ["centroid decomposition", "centroid of a tree", "centroid decomposition python", "find the centroid of a tree", "divide and conquer on trees", "centroid tree", "tree path queries with centroid decomposition", "centroid decomposition explained"],
  tags: "centroid decomposition centroid tree divide and conquer on trees balanced log n depth path counting distance queries",
  a: "This is an overview with the decomposition itself. A centroid is a node whose removal leaves components of at most half the size. Repeatedly find the centroid, make it the root of its component, remove it, and recurse into the pieces. The resulting centroid tree has depth O(log n), and any tree path u-v passes through the centroid-tree LCA of u and v.",
  code: { py: `def centroid_decomposition(adj):
    """adj: list of neighbor lists of a tree. Returns cpar, the parent array of the centroid tree (-1 for its root)."""
    n = len(adj)
    removed = [False] * n
    cpar = [-1] * n

    def find_centroid(start):
        order, par = [start], {start: -1}
        for u in order:                               # gather the current component
            for v in adj[u]:
                if v != par[u] and not removed[v]:
                    par[v] = u
                    order.append(v)
        size = {u: 1 for u in order}
        for u in reversed(order):
            if par[u] != -1:
                size[par[u]] += size[u]
        total = len(order)
        for u in order:
            biggest = total - size[u]                 # the part above u
            for v in adj[u]:
                if v != par[u] and not removed[v]:
                    biggest = max(biggest, size[v])
            if biggest <= total // 2:
                return u

    work = [(0, -1)]
    while work:
        start, p = work.pop()
        c = find_centroid(start)
        cpar[c] = p
        removed[c] = True
        for v in adj[c]:
            if not removed[v]:
                work.append((v, c))
    return cpar

adj = [[1], [0, 2], [1, 3], [2, 4], [3]]       # a path of 5 nodes
print(centroid_decomposition(adj))   # [1, 2, -1, 2, 3]`,
  },
  check: `import random
random.seed(6)
for _ in range(200):
    n = random.randint(1, 14); par = [-1] + [random.randrange(i) for i in range(1, n)]
    adj = [[] for _ in range(n)]
    for i in range(1, n): adj[i].append(par[i]); adj[par[i]].append(i)
    cp = centroid_decomposition(adj)
    assert cp.count(-1) == 1
    def chain(v):
        r = [v]
        while cp[v] != -1: v = cp[v]; r.append(v)
        return r
    assert max(len(chain(v)) for v in range(n)) <= n.bit_length() + 1
    def tree_path(u, v):
        prev = {u: None}; st = [u]
        while st:
            x = st.pop()
            for y in adj[x]:
                if y not in prev: prev[y] = x; st.append(y)
        p = []
        while v is not None: p.append(v); v = prev[v]
        return set(p)
    for u in range(n):
        for v in range(n):
            cu = chain(u); cv = set(chain(v))
            l = next(x for x in cu if x in cv)
            assert l in tree_path(u, v)
assert centroid_decomposition([[]]) == [-1]`,
  more: "- Each removal at least halves the component, so the centroid tree has height at most log2(n)+1.\n- Typical use: for every centroid, process the paths from it into each part (count paths with a property, nearest marked node, distance sums), then combine results across children while avoiding double counting within the same child.\n- Per-node distance to each centroid ancestor can be stored (log n values per node) for fast distance or nearest-marked queries.\n- Do not confuse with the center of a tree (diameter midpoint).",
  cx: "Build O(n log n) time (each level touches every node once) and O(n) space; centroid tree depth O(log n)",
  see: ["#/topic/trees", "#/topic/advanced-graphs"]
},
{
  id: "cp-euler-tour-subtree", cat: "Graphs: trees", title: "Euler tour technique (subtree ranges)",
  q: ["euler tour technique", "tin tout subtree range", "flatten a tree into an array", "subtree sum query euler tour", "is node an ancestor of another tin tout", "euler tour tree flattening python", "dfs order subtree is a contiguous range", "subtree queries with fenwick tree"],
  tags: "euler tour technique tin tout entry exit time flatten tree subtree range ancestor check dfs order fenwick",
  a: "Run one DFS and record each node's entry time tin and the time tout after its whole subtree. The subtree of v is exactly the contiguous range [tin[v], tout[v]) of the DFS order, so subtree sums become range sums, and u is an ancestor of v iff tin[u] <= tin[v] < tout[u].",
  code: { py: `def euler_ranges(adj, root=0):
    """Returns tin, tout, order. Subtree of v = order[tin[v]:tout[v]]."""
    n = len(adj)
    tin, tout, order = [0] * n, [0] * n, []
    stack = [(root, -1, iter(adj[root]))]
    tin[root] = 0
    order.append(root)
    while stack:
        u, p, it = stack[-1]
        for v in it:
            if v != p:
                tin[v] = len(order)
                order.append(v)
                stack.append((v, u, iter(adj[v])))
                break
        else:
            tout[u] = len(order)
            stack.pop()
    return tin, tout, order

def is_ancestor(tin, tout, u, v):
    return tin[u] <= tin[v] < tout[u]

adj = [[1, 2], [0, 3, 4], [0], [1], [1]]
val = [1, 2, 3, 4, 5]
tin, tout, order = euler_ranges(adj)
prefix = [0]
for v in order:
    prefix.append(prefix[-1] + val[v])
subtree_sum = lambda v: prefix[tout[v]] - prefix[tin[v]]
print(subtree_sum(1), subtree_sum(0), is_ancestor(tin, tout, 1, 4))   # 11 15 True`,
  },
  check: `import random
random.seed(7)
for _ in range(200):
    n = random.randint(1, 25); par = [-1] + [random.randrange(i) for i in range(1, n)]
    adj = [[] for _ in range(n)]
    for i in range(1, n): adj[i].append(par[i]); adj[par[i]].append(i)
    tin, tout, order = euler_ranges(adj)
    assert sorted(order) == list(range(n))
    def anc(v):
        r = [v]
        while par[v] != -1: v = par[v]; r.append(v)
        return r
    sub = {v: {u for u in range(n) if v in anc(u)} for v in range(n)}
    for v in range(n):
        assert set(order[tin[v]:tout[v]]) == sub[v]
        for u in range(n):
            assert is_ancestor(tin, tout, v, u) == (u in sub[v])`,
  more: "- Use a Fenwick tree over tin positions for point updates plus subtree-sum queries (update value at tin[v], query the range).\n- Path-to-root sums under point updates: add at tin[v] and subtract at tout[v] in a Fenwick, then a prefix sum at tin[u] gives the root-to-u sum.\n- Iterative DFS avoids recursion limits; tout here is exclusive.\n- The same order lets you check ancestor relations and compute LCA with a sparse table.",
  cx: "Time O(n) to build, O(1) ancestor check; with a Fenwick tree subtree queries and updates are O(log n); space O(n)",
  see: ["#/topic/trees", "#/topic/fenwick", "#/topic/segment-tree"]
},
{
  id: "cp-tree-isomorphism-ahu", cat: "Graphs: trees", title: "Tree isomorphism (AHU canonical form)",
  q: ["tree isomorphism", "are two trees isomorphic", "ahu algorithm", "canonical form of a tree", "tree isomorphism python", "compare two unlabeled trees", "rooted tree isomorphism", "isomorphic trees check"],
  tags: "tree isomorphism ahu canonical form rooted unrooted center encoding parentheses string compare trees",
  a: "Encode a rooted tree as a canonical string: a node is '(' + the sorted canonical strings of its children + ')'. Two rooted trees are isomorphic iff the strings match. For unrooted trees, root at the one or two centers (found by peeling leaves) and compare the smallest encoding.",
  code: { py: `def canon_rooted(adj, root):
    n = len(adj)
    parent, order = {root: -1}, [root]
    for u in order:
        for v in adj[u]:
            if v != parent[u]:
                parent[v] = u
                order.append(v)
    code = {}
    for u in reversed(order):                      # children are encoded before parents
        kids = sorted(code.pop(v) for v in adj[u] if v != parent[u])
        code[u] = '(' + ''.join(kids) + ')'
    return code[root]

def centers(adj):
    n = len(adj)
    deg = [len(a) for a in adj]
    leaves = [i for i in range(n) if deg[i] <= 1]
    left = n
    while left > 2:
        left -= len(leaves)
        nxt = []
        for u in leaves:
            for v in adj[u]:
                deg[v] -= 1
                if deg[v] == 1:
                    nxt.append(v)
        leaves = nxt
    return leaves

def canon_unrooted(adj):
    return min(canon_rooted(adj, c) for c in centers(adj))

def isomorphic(adj1, adj2):
    return len(adj1) == len(adj2) and canon_unrooted(adj1) == canon_unrooted(adj2)

path = [[1], [0, 2], [1, 3], [2]]
star = [[1, 2, 3], [0], [0], [0]]
print(isomorphic(path, [[2], [2], [0, 1, 3], [2]]), isomorphic(path, star))   # False
print(isomorphic(path, [[1], [0, 3], [3], [1, 2]]))   # True`,
  },
  check: `import random, itertools
random.seed(8)
def rand_tree(n):
    adj = [[] for _ in range(n)]
    for i in range(1, n):
        p = random.randrange(i); adj[i].append(p); adj[p].append(i)
    return adj
def brute(a, b):
    n = len(a)
    ea = {frozenset((u, v)) for u in range(n) for v in a[u]}
    eb = {frozenset((u, v)) for u in range(n) for v in b[u]}
    return any({frozenset(p[x] for x in e) for e in ea} == eb for p in itertools.permutations(range(n)))
def relabel(adj):
    n = len(adj); p = list(range(n)); random.shuffle(p)
    new = [[] for _ in range(n)]
    for u in range(n):
        for v in adj[u]: new[p[u]].append(p[v])
    return new
for _ in range(150):
    n = random.randint(1, 6); a = rand_tree(n)
    b = relabel(a) if random.random() < 0.5 else rand_tree(n)
    assert isomorphic(a, b) == brute(a, b)
assert isomorphic([[]], [[]]) and isomorphic([[1], [0]], [[1], [0]])`,
  more: "- Sorting children makes the encoding independent of input order; the string length is 2n.\n- Unrooted trees can have two centers; trying both and taking the minimum gives one canonical string.\n- Hashing subtrees to integer ids (map sorted tuples of child ids to new ids) gives the same answer in O(n log n) without long strings.\n- Not for general graph isomorphism, which has no known polynomial algorithm.",
  cx: "Time O(n log n) with sorting (string building can add up to O(n^2) character copying in the worst case; use integer ids to avoid it); space O(n)",
  see: ["#/topic/trees", "#/topic/tree-dp", "#/topic/advanced-graphs"]
},
{
  id: "cp-kth-ancestor", cat: "Graphs: trees", title: "k-th ancestor with binary lifting",
  q: ["kth ancestor of a tree node", "binary lifting k-th ancestor", "kth ancestor python", "jump k levels up in a tree", "tree ancestor leetcode 1483", "binary lifting explained", "find the ancestor k steps above a node", "binary lifting table"],
  tags: "kth ancestor binary lifting jump pointers doubling up table parent tree ancestor 1483 treeancestor",
  a: "Store up[j][v], the 2^j-th ancestor of v (-1 when it does not exist). To jump k levels, write k in binary and apply the jump for each set bit, returning -1 if you ever fall off the root. Each query takes O(log n) after O(n log n) preprocessing.",
  code: { py: `class KthAncestor:
    def __init__(self, parent):
        """parent[v] is the parent of v, or -1 for the root. Nodes may come in any order."""
        n = len(parent)
        self.LOG = max(1, n.bit_length())
        self.up = [list(parent)]
        for j in range(1, self.LOG):
            prev = self.up[-1]
            self.up.append([-1 if prev[v] == -1 else prev[prev[v]] for v in range(n)])

    def kth(self, v, k):
        if k >> self.LOG:                      # more than 2^LOG - 1 levels: deeper than any possible node
            return -1
        for j in range(self.LOG):
            if k >> j & 1:
                v = self.up[j][v]
                if v == -1:
                    return -1
        return v

t = KthAncestor([-1, 0, 0, 1, 1, 2])
print(t.kth(3, 1), t.kth(3, 2), t.kth(3, 3), t.kth(5, 0))   # 1 0 -1 5`,
  },
  check: `import random
random.seed(9)
for _ in range(200):
    n = random.randint(1, 40); par = [-1] + [random.randrange(i) for i in range(1, n)]
    t = KthAncestor(par)
    for _ in range(30):
        v, k = random.randrange(n), random.randint(0, n + 3)
        x = v
        for _ in range(k):
            if x == -1: break
            x = par[x]
        assert t.kth(v, k) == x
assert KthAncestor([-1]).kth(0, 1) == -1`,
  more: "- Level j is built from level j-1 only, so the parent array can list nodes in any order (unlike a DFS-order build).\n- Reaching the root and going further must return -1, not the root; this differs from the LCA table where the root is its own parent.\n- Linear-memory alternatives: ladder decomposition (O(1) query), or an offline DFS stack answering k-th ancestor as stack[depth-k].\n- The same table gives LCA queries.",
  cx: "Preprocess O(n log n) time and space; query O(log n)",
  see: ["#/topic/trees", "#/topic/bits", "#/topic/advanced-graphs"]
},
{
  id: "cp-prufer-sequence", cat: "Graphs: trees", title: "Prufer sequence (encode and decode labeled trees)",
  q: ["prufer sequence", "prufer code", "encode a tree as a sequence", "decode prufer sequence python", "cayley formula number of labeled trees", "prufer sequence to tree", "tree to prufer code", "count labeled trees n^(n-2)"],
  tags: "prufer sequence code cayley formula labeled trees encode decode n^(n-2) leaves bijection",
  a: "A Prufer sequence of length n-2 encodes a labeled tree on n vertices one-to-one. Encode: repeat n-2 times, remove the smallest leaf and write down its neighbor. Decode: the smallest label that does not appear in the remaining sequence is the next leaf; connect it to the next sequence entry. This bijection proves there are n^(n-2) labeled trees.",
  code: { py: `import heapq

def prufer_encode(n, edges):
    """Vertices 0..n-1, n >= 2. Returns the Prufer sequence (length n-2)."""
    adj = [set() for _ in range(n)]
    for u, v in edges:
        adj[u].add(v)
        adj[v].add(u)
    leaves = [i for i in range(n) if len(adj[i]) == 1]
    heapq.heapify(leaves)
    seq = []
    for _ in range(n - 2):
        leaf = heapq.heappop(leaves)
        (p,) = adj[leaf]
        seq.append(p)
        adj[p].discard(leaf)
        if len(adj[p]) == 1:
            heapq.heappush(leaves, p)
    return seq

def prufer_decode(seq):
    n = len(seq) + 2
    deg = [1] * n
    for x in seq:
        deg[x] += 1
    leaves = [i for i in range(n) if deg[i] == 1]
    heapq.heapify(leaves)
    edges = []
    for x in seq:
        leaf = heapq.heappop(leaves)
        edges.append((leaf, x))
        deg[x] -= 1
        if deg[x] == 1:
            heapq.heappush(leaves, x)
    edges.append((heapq.heappop(leaves), heapq.heappop(leaves)))
    return edges

edges = [(0, 3), (1, 3), (2, 3), (3, 4)]
seq = prufer_encode(5, edges)
print(seq, prufer_decode(seq))   # [3, 3, 3] [(0, 3), (1, 3), (2, 3), (3, 4)]`,
  },
  check: `import random, itertools
random.seed(10)
norm = lambda es: sorted(tuple(sorted(e)) for e in es)
for _ in range(300):
    n = random.randint(2, 12)
    edges = [(random.randrange(i), i) for i in range(1, n)]
    seq = prufer_encode(n, edges)
    assert len(seq) == n - 2
    assert norm(prufer_decode(seq)) == norm(edges)
seen = set()
for seq in itertools.product(range(5), repeat=3):
    es = prufer_decode(list(seq))
    assert len(es) == 4
    seen.add(tuple(norm(es)))
assert len(seen) == 5 ** 3`,
  more: "- Every label appears in the sequence exactly (degree - 1) times, so degrees can be read straight off the sequence.\n- Counting: a degree sequence d_1..d_n corresponds to (n-2)! / prod (d_i - 1)! labeled trees.\n- Use cases: generating uniform random labeled trees (pick a random sequence), compact tree storage.\n- This simple version uses a heap, O(n log n); a moving-pointer version is O(n).",
  cx: "Time O(n log n) with a heap (O(n) with the pointer technique), space O(n)",
  see: ["#/topic/trees", "#/topic/math", "#/topic/heaps"]
},
{
  id: "cp-tree-mis-vertex-cover", cat: "Graphs: trees", title: "Maximum independent set and minimum vertex cover on a tree",
  q: ["maximum independent set in a tree", "minimum vertex cover tree dp", "tree dp take or skip node", "largest set of non adjacent nodes in a tree", "vertex cover on a tree python", "house robber on a tree", "independent set tree dp", "min vertex cover of a tree greedy"],
  tags: "maximum independent set minimum vertex cover tree dp take skip gallai house robber 337 non adjacent nodes",
  a: "On a tree both problems are easy DP: for each node keep take[u] (best with u in the set) and skip[u] (best without). take[u] = 1 + sum of skip over children; skip[u] = sum of max(take, skip) over children. The answer is max(take[root], skip[root]), and a minimum vertex cover is the complement of a maximum independent set, size n - MIS.",
  code: { py: `def tree_mis_and_vertex_cover(adj, root=0):
    """adj: list of neighbor lists of a tree. Returns (mis_size, vc_size, mis_nodes, vc_nodes)."""
    n = len(adj)
    parent, order = [-1] * n, [root]
    for u in order:
        for v in adj[u]:
            if v != parent[u]:
                parent[v] = u
                order.append(v)
    take, skip = [1] * n, [0] * n
    for u in reversed(order):
        p = parent[u]
        if p != -1:
            take[p] += skip[u]
            skip[p] += max(take[u], skip[u])
    in_set = [False] * n                       # reconstruct top-down
    in_set[root] = take[root] >= skip[root]
    for u in order[1:]:
        if in_set[parent[u]]:
            in_set[u] = False
        else:
            in_set[u] = take[u] >= skip[u]
    mis = [u for u in range(n) if in_set[u]]
    vc = [u for u in range(n) if not in_set[u]]
    return len(mis), len(vc), mis, vc

adj = [[1, 2], [0, 3, 4], [0], [1], [1]]
print(tree_mis_and_vertex_cover(adj))   # (3, 2, [0, 3, 4], [1, 2])`,
  },
  check: `import random, itertools
random.seed(11)
for _ in range(200):
    n = random.randint(1, 11); edges = [(random.randrange(i), i) for i in range(1, n)]
    adj = [[] for _ in range(n)]
    for u, v in edges: adj[u].append(v); adj[v].append(u)
    best = 0
    for mask in range(1 << n):
        if all(not (mask >> u & 1 and mask >> v & 1) for u, v in edges):
            best = max(best, bin(mask).count('1'))
    m, c, mis, vc = tree_mis_and_vertex_cover(adj)
    assert m == best and c == n - best and m + c == n
    assert all(not (u in mis and v in mis) for u, v in edges)
    assert all(u in vc or v in vc for u, v in edges)`,
  more: "- For any graph, a set is independent iff its complement is a vertex cover, so min VC = n - max IS; on trees (and bipartite graphs) both are polynomial, on general graphs NP-hard.\n- Greedy alternative for the vertex cover on trees: repeatedly take the parent of a leaf.\n- Weighted version: replace the +1 with the node weight.\n- Process nodes children-before-parents with an explicit order to avoid deep recursion.",
  cx: "Time O(n), space O(n)",
  see: ["#/topic/tree-dp", "#/topic/trees", "#/problem/337"]
},
{
  id: "cp-graph-diameter-radius", cat: "Graphs: other", title: "Graph diameter, radius, center and periphery",
  q: ["graph diameter", "graph radius and center", "eccentricity of a vertex", "diameter of an unweighted graph python", "find the center of a graph", "longest shortest path in a graph", "graph periphery", "radius vs diameter of a graph"],
  tags: "graph diameter radius center periphery eccentricity bfs from every vertex longest shortest path",
  a: "The eccentricity of a vertex is its largest shortest-path distance to any other vertex. The diameter is the maximum eccentricity, the radius the minimum, the center is the set of vertices with eccentricity equal to the radius, and the periphery those equal to the diameter. For an unweighted connected graph, run BFS from every vertex.",
  code: { py: `from collections import deque

def graph_metrics(adj):
    """adj: list of neighbor lists of a connected undirected graph.
    Returns (diameter, radius, center, periphery)."""
    n = len(adj)
    ecc = []
    for s in range(n):
        dist = [-1] * n
        dist[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if dist[v] < 0:
                    dist[v] = dist[u] + 1
                    q.append(v)
        if -1 in dist:
            raise ValueError("graph is not connected")
        ecc.append(max(dist))
    diameter, radius = max(ecc), min(ecc)
    return (diameter, radius,
            [v for v in range(n) if ecc[v] == radius],
            [v for v in range(n) if ecc[v] == diameter])

path5 = [[1], [0, 2], [1, 3], [2, 4], [3]]
print(graph_metrics(path5))   # (4, 2, [2], [0, 4])`,
  },
  check: `import random
random.seed(12)
for _ in range(200):
    n = random.randint(1, 9); adj = [set() for _ in range(n)]
    for i in range(1, n):
        p = random.randrange(i); adj[i].add(p); adj[p].add(i)
    for _ in range(random.randint(0, n)):
        a, b = random.randrange(n), random.randrange(n)
        if a != b: adj[a].add(b); adj[b].add(a)
    adj = [sorted(x) for x in adj]
    INF = 99; d = [[0 if i == j else (1 if j in adj[i] else INF) for j in range(n)] for i in range(n)]
    for k in range(n):
        for i in range(n):
            for j in range(n): d[i][j] = min(d[i][j], d[i][k] + d[k][j])
    ecc = [max(r) for r in d]
    diam, rad, cen, per = graph_metrics(adj)
    assert diam == max(ecc) and rad == min(ecc)
    assert cen == [v for v in range(n) if ecc[v] == rad] and per == [v for v in range(n) if ecc[v] == diam]
    assert rad <= diam <= 2 * rad
try:
    graph_metrics([[], []]); assert False
except ValueError: pass`,
  more: "- Always radius <= diameter <= 2*radius.\n- Weighted graphs: run Dijkstra from each vertex, or Floyd-Warshall for dense graphs.\n- Disconnected graphs have infinite diameter; handle it explicitly.\n- On trees the diameter takes only two BFS passes and the center is the middle of the diameter path.\n- For huge graphs, double-sweep BFS gives a good lower bound on the diameter quickly (exact in trees).",
  cx: "Time O(V*(V+E)) unweighted, O(V * E log V) weighted with Dijkstra, O(V^3) with Floyd-Warshall; space O(V)",
  see: ["#/topic/graphs", "#/topic/shortest-paths", "#/cheatsheets/graphs"]
},
{
  id: "cp-cycle-basis", cat: "Graphs: other", title: "Cycle basis (fundamental cycles from a spanning tree)",
  q: ["cycle basis of a graph", "fundamental cycles", "fundamental cycle basis python", "cyclomatic number", "how many independent cycles does a graph have", "cycle space of a graph", "find independent cycles using spanning tree", "e minus v plus c"],
  tags: "cycle basis fundamental cycles cyclomatic number circuit rank spanning tree cycle space gf2 independent cycles",
  a: "Every undirected graph has E - V + C independent cycles (C = connected components), the cyclomatic number. A fundamental cycle basis gets them from a spanning forest: each non-tree edge, plus the tree path between its endpoints, forms one cycle. Any cycle in the graph is an XOR (symmetric difference) of these basis cycles.",
  code: { py: `from collections import deque

def fundamental_cycle_basis(n, edges):
    """edges: [(u, v)] (parallel edges and self loops allowed). Returns a list of cycles, each a list of edge indices."""
    adj = [[] for _ in range(n)]
    for i, (u, v) in enumerate(edges):
        adj[u].append((v, i))
        adj[v].append((u, i))
    depth, pnode, pedge = [-1] * n, [-1] * n, [-1] * n
    tree = set()
    for r in range(n):
        if depth[r] >= 0:
            continue
        depth[r] = 0
        q = deque([r])
        while q:
            u = q.popleft()
            for v, i in adj[u]:
                if depth[v] < 0:
                    depth[v], pnode[v], pedge[v] = depth[u] + 1, u, i
                    tree.add(i)
                    q.append(v)
    cycles = []
    for i, (u, v) in enumerate(edges):
        if i in tree:
            continue
        cyc = [i]
        while u != v:                          # climb the deeper endpoint until the paths meet
            if depth[u] >= depth[v]:
                cyc.append(pedge[u]); u = pnode[u]
            else:
                cyc.append(pedge[v]); v = pnode[v]
        cycles.append(cyc)
    return cycles

square_with_diagonal = [(0, 1), (1, 2), (2, 3), (3, 0), (0, 2)]
print(fundamental_cycle_basis(4, square_with_diagonal))   # 2 cycles: E - V + C = 5 - 4 + 1`,
  },
  check: `import random
random.seed(13)
for _ in range(300):
    n = random.randint(1, 8)
    edges = [(random.randrange(n), random.randrange(n)) for _ in range(random.randint(0, 2 * n))]
    par = list(range(n))
    def find(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for u, v in edges: par[find(u)] = find(v)
    comps = len({find(x) for x in range(n)})
    cycles = fundamental_cycle_basis(n, edges)
    assert len(cycles) == len(edges) - n + comps
    rows = []
    for cyc in cycles:
        assert len(set(cyc)) == len(cyc)
        deg = [0] * n
        for i in cyc:
            deg[edges[i][0]] += 1; deg[edges[i][1]] += 1
        assert all(d % 2 == 0 for d in deg)
        rows.append(sum(1 << i for i in cyc))
    basis = []                                  # GF(2) rank = number of independent rows
    for r in rows:
        for b in basis: r = min(r, r ^ b)
        if r: basis.append(r)
    assert len(basis) == len(cycles)`,
  more: "- The number of basis cycles is fixed (E - V + C); the particular basis depends on the spanning tree. A minimum-weight basis needs more work (Horton's algorithm).\n- Applications: electrical circuit analysis (Kirchhoff loops), checking whether a graph is a forest (E - V + C = 0), and XOR-based problems like finding the maximum xor path.\n- Cycles are edge sets mod 2; their XOR of two cycles is again an even-degree edge set, not necessarily a single simple cycle.\n- Not the same as listing all simple cycles, which can be exponential.",
  cx: "Time O(V + E) to build the tree plus O(V) per non-tree edge, so O(E * V) worst case in total output size; space O(V + E)",
  see: ["#/topic/graphs", "#/topic/union-find", "#/cheatsheets/graphs"]
},
  );
})();
