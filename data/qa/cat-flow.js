(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  OR.qa.push.apply(OR.qa, [
 {
  "id": "cf-ford-fulkerson",
  "title": "Ford-Fulkerson maximum flow (DFS augmenting paths)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is the ford fulkerson algorithm",
   "explain ford fulkerson",
   "how does ford fulkerson work",
   "ford fulkerson in python",
   "implement max flow with dfs",
   "ford fulkerson code",
   "ford fulkerson vs edmonds karp",
   "when to use ford fulkerson"
  ],
  "tags": "ford fulkerson fulkerson max flow maximum flow augmenting path residual graph dfs network flow",
  "a": "Ford-Fulkerson computes the maximum s-t flow by repeatedly finding any path with spare capacity in the residual graph (here with DFS) and pushing the bottleneck amount along it. Stop when no path exists. It is simple, but with a bad path choice or large capacities it can be slow.",
  "code": {
   "py": "def ford_fulkerson(n, edges, s, t):\n    \"\"\"edges: (u, v, capacity). Returns the max flow value from s to t.\"\"\"\n    if s == t:\n        raise ValueError(\"source and sink must differ\")\n    cap = [[0] * n for _ in range(n)]\n    for u, v, w in edges:\n        cap[u][v] += w                      # parallel edges add up\n\n    def dfs(u, pushed, seen):\n        if u == t:\n            return pushed\n        seen[u] = True\n        for v in range(n):\n            if not seen[v] and cap[u][v] > 0:\n                got = dfs(v, min(pushed, cap[u][v]), seen)\n                if got:\n                    cap[u][v] -= got        # use up forward capacity\n                    cap[v][u] += got        # create the residual (undo) edge\n                    return got\n        return 0\n\n    flow = 0\n    while True:\n        got = dfs(s, float(\"inf\"), [False] * n)\n        if not got:\n            return flow\n        flow += got\n\nprint(ford_fulkerson(4, [(0, 1, 3), (0, 2, 2), (1, 2, 1), (1, 3, 2), (2, 3, 3)], 0, 3))  # 5"
  },
  "more": "- Invariant: the residual graph always encodes every legal change to the flow; a path in it is an improvement, and no path means a cut of equal value exists (max-flow min-cut).\n- The reverse residual edge lets a later path undo an earlier bad choice.\n- Trap: with integer capacities it can need up to F augmentations (F = flow value), e.g. when paths keep zig-zagging across a thin middle edge, and with irrational capacities it may never terminate.\n- Fix: choose shortest paths (Edmonds-Karp) or use Dinic.",
  "cx": "Time O(E * F) for integer capacities, F = the max flow value (each augmentation is a graph search costing O(E)); this matrix version costs O(V^2) per search. Space O(V^2) here, O(V + E) with adjacency lists.",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs",
   "#/cheatsheets/big-o-algorithms"
  ],
  "check": "import itertools, random\ndef brute_maxflow(n, edges, s, t):\n    best = None\n    others = [v for v in range(n) if v not in (s, t)]\n    for r in range(len(others) + 1):\n        for sub in itertools.combinations(others, r):\n            S = set(sub) | {s}\n            c = sum(w for u, v, w in edges if u in S and v not in S)\n            best = c if best is None else min(best, c)\n    return best\ndef rand_net(rng, n, m, mx=6):\n    return [(rng.randrange(n), rng.randrange(n), rng.randint(1, mx)) for _ in range(m)]\ndef flow_check(fn):\n    rng = random.Random(1)\n    for _ in range(300):\n        n = rng.randint(2, 6)\n        edges = rand_net(rng, n, rng.randint(0, 12))\n        assert fn(n, edges, 0, n - 1) == brute_maxflow(n, edges, 0, n - 1), (n, edges)\n    assert fn(2, [(0, 1, 5)], 0, 1) == 5\n    assert fn(3, [(0, 1, 5)], 0, 2) == 0\n    assert fn(4, [(0, 1, 1), (0, 2, 1), (1, 2, 1), (1, 3, 1), (2, 3, 1)], 0, 3) == 2\nflow_check(ford_fulkerson)"
 },
 {
  "id": "cf-edmonds-karp",
  "title": "Edmonds-Karp maximum flow",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is edmonds karp",
   "explain the edmonds karp algorithm",
   "how does edmonds karp work",
   "edmonds karp in python",
   "implement edmonds karp",
   "edmonds karp code",
   "edmonds karp vs ford fulkerson",
   "bfs max flow algorithm"
  ],
  "tags": "edmonds karp max flow maximum flow bfs shortest augmenting path residual network flow",
  "a": "Edmonds-Karp is Ford-Fulkerson where each augmenting path is found by BFS, so it is always a path with the fewest edges. That choice gives a hard bound of O(V E^2) regardless of capacity values, so it is the safe simple max-flow to code in an interview.",
  "code": {
   "py": "from collections import deque\n\ndef edmonds_karp(n, edges, s, t):\n    \"\"\"edges: (u, v, capacity). Returns the max flow value from s to t.\"\"\"\n    if s == t:\n        raise ValueError(\"source and sink must differ\")\n    cap = [[0] * n for _ in range(n)]\n    for u, v, w in edges:\n        cap[u][v] += w\n    flow = 0\n    while True:\n        parent = [-1] * n\n        parent[s] = s\n        q = deque([s])\n        while q and parent[t] == -1:                 # BFS in the residual graph\n            u = q.popleft()\n            for v in range(n):\n                if parent[v] == -1 and cap[u][v] > 0:\n                    parent[v] = u\n                    q.append(v)\n        if parent[t] == -1:\n            return flow\n        b, v = float(\"inf\"), t                       # bottleneck on the path\n        while v != s:\n            b = min(b, cap[parent[v]][v])\n            v = parent[v]\n        v = t\n        while v != s:\n            u = parent[v]\n            cap[u][v] -= b\n            cap[v][u] += b\n            v = u\n        flow += b\n\nprint(edmonds_karp(4, [(0, 1, 3), (0, 2, 2), (1, 2, 1), (1, 3, 2), (2, 3, 3)], 0, 3))  # 5"
  },
  "more": "- Key fact: the BFS distance from s to any vertex never decreases across augmentations, and every augmentation saturates at least one critical edge, so there are at most O(VE) augmentations.\n- Each BFS costs O(E) with adjacency lists, hence O(V E^2).\n- Use the adjacency-list form (see Dinic) when V is large; the matrix form is fine for V up to a few hundred.\n- Faster alternative: Dinic, O(V^2 E).",
  "cx": "Time O(V E^2) with adjacency lists; this adjacency-matrix version pays O(V^2) per BFS, so O(V^3 E). Space O(V + E) with lists, O(V^2) for the matrix.",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs",
   "#/cheatsheets/big-o-algorithms"
  ],
  "check": "import itertools, random\ndef brute_maxflow(n, edges, s, t):\n    best = None\n    others = [v for v in range(n) if v not in (s, t)]\n    for r in range(len(others) + 1):\n        for sub in itertools.combinations(others, r):\n            S = set(sub) | {s}\n            c = sum(w for u, v, w in edges if u in S and v not in S)\n            best = c if best is None else min(best, c)\n    return best\ndef rand_net(rng, n, m, mx=6):\n    return [(rng.randrange(n), rng.randrange(n), rng.randint(1, mx)) for _ in range(m)]\ndef flow_check(fn):\n    rng = random.Random(1)\n    for _ in range(300):\n        n = rng.randint(2, 6)\n        edges = rand_net(rng, n, rng.randint(0, 12))\n        assert fn(n, edges, 0, n - 1) == brute_maxflow(n, edges, 0, n - 1), (n, edges)\n    assert fn(2, [(0, 1, 5)], 0, 1) == 5\n    assert fn(3, [(0, 1, 5)], 0, 2) == 0\n    assert fn(4, [(0, 1, 1), (0, 2, 1), (1, 2, 1), (1, 3, 1), (2, 3, 1)], 0, 3) == 2\nflow_check(edmonds_karp)"
 },
 {
  "id": "cf-dinic",
  "title": "Dinic's maximum flow",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is dinic algorithm",
   "explain dinic's algorithm",
   "how does dinic work",
   "dinic in python",
   "implement dinic max flow",
   "dinic algorithm code",
   "dinic vs edmonds karp",
   "level graph blocking flow"
  ],
  "tags": "dinic dinitz max flow level graph blocking flow bfs dfs current arc pointer network flow",
  "a": "Dinic's algorithm repeats two steps: a BFS builds a level graph (distance from s), then a DFS pushes a blocking flow along edges that go exactly one level deeper, using a pointer per vertex so no dead edge is retried. After each phase the s-t distance strictly grows, so there are at most V phases.",
  "code": {
   "py": "from collections import deque\n\nclass Dinic:\n    def __init__(self, n):\n        self.n = n\n        self.g = [[] for _ in range(n)]      # g[u] = indices of edges leaving u\n        self.to, self.cap = [], []\n\n    def add_edge(self, u, v, c):\n        self.g[u].append(len(self.to)); self.to.append(v); self.cap.append(c)\n        self.g[v].append(len(self.to)); self.to.append(u); self.cap.append(0)   # reverse edge is index ^ 1\n\n    def _bfs(self, s, t):\n        self.level = [-1] * self.n\n        self.level[s] = 0\n        q = deque([s])\n        while q:\n            u = q.popleft()\n            for i in self.g[u]:\n                v = self.to[i]\n                if self.cap[i] > 0 and self.level[v] < 0:\n                    self.level[v] = self.level[u] + 1\n                    q.append(v)\n        return self.level[t] >= 0\n\n    def _dfs(self, u, t, f):\n        if u == t:\n            return f\n        while self.it[u] < len(self.g[u]):\n            i = self.g[u][self.it[u]]\n            v = self.to[i]\n            if self.cap[i] > 0 and self.level[v] == self.level[u] + 1:\n                d = self._dfs(v, t, min(f, self.cap[i]))\n                if d > 0:\n                    self.cap[i] -= d\n                    self.cap[i ^ 1] += d\n                    return d\n            self.it[u] += 1                  # this edge is useless for the rest of the phase\n        return 0\n\n    def max_flow(self, s, t):\n        flow = 0\n        while self._bfs(s, t):\n            self.it = [0] * self.n\n            while True:\n                f = self._dfs(s, t, float(\"inf\"))\n                if not f:\n                    break\n                flow += f\n        return flow\n\nd = Dinic(4)\nfor u, v, c in [(0, 1, 3), (0, 2, 2), (1, 2, 1), (1, 3, 2), (2, 3, 3)]:\n    d.add_edge(u, v, c)\nprint(d.max_flow(0, 3))  # 5"
  },
  "more": "- Why it works: edges only go from level k to k+1, so every path found is a shortest path, and once the DFS pointers are exhausted the level graph has a blocking flow, which makes dist(s, t) increase.\n- The `it` pointer is the \"current arc\" trick; without it the bound degrades.\n- Recursion depth can reach V; raise the recursion limit or write the DFS iteratively for big graphs.\n- Unit-capacity bipartite graphs: O(E sqrt(V)), the same as Hopcroft-Karp.",
  "cx": "Time O(V^2 E) in general; O(E sqrt(V)) for unit-capacity bipartite matching networks. Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs",
   "#/cheatsheets/big-o-algorithms"
  ],
  "check": "import itertools, random\ndef brute_maxflow(n, edges, s, t):\n    best = None\n    others = [v for v in range(n) if v not in (s, t)]\n    for r in range(len(others) + 1):\n        for sub in itertools.combinations(others, r):\n            S = set(sub) | {s}\n            c = sum(w for u, v, w in edges if u in S and v not in S)\n            best = c if best is None else min(best, c)\n    return best\ndef rand_net(rng, n, m, mx=6):\n    return [(rng.randrange(n), rng.randrange(n), rng.randint(1, mx)) for _ in range(m)]\ndef flow_check(fn):\n    rng = random.Random(1)\n    for _ in range(300):\n        n = rng.randint(2, 6)\n        edges = rand_net(rng, n, rng.randint(0, 12))\n        assert fn(n, edges, 0, n - 1) == brute_maxflow(n, edges, 0, n - 1), (n, edges)\n    assert fn(2, [(0, 1, 5)], 0, 1) == 5\n    assert fn(3, [(0, 1, 5)], 0, 2) == 0\n    assert fn(4, [(0, 1, 1), (0, 2, 1), (1, 2, 1), (1, 3, 1), (2, 3, 1)], 0, 3) == 2\n\ndef dinic(n, edges, s, t):\n    d = Dinic(n)\n    for u, v, w in edges:\n        d.add_edge(u, v, w)\n    return d.max_flow(s, t)\nflow_check(dinic)"
 },
 {
  "id": "cf-push-relabel",
  "title": "Push-relabel maximum flow (overview with working code)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is push relabel algorithm",
   "explain push relabel max flow",
   "how does push relabel work",
   "push relabel in python",
   "implement push relabel",
   "push relabel code",
   "push relabel vs dinic",
   "preflow push algorithm"
  ],
  "tags": "push relabel preflow push goldberg tarjan height label excess max flow fifo network flow",
  "a": "Push-relabel never builds whole augmenting paths. It keeps a preflow (vertices may hold excess), gives every vertex a height, pushes excess to a lower neighbour along residual edges, and raises (relabels) a vertex when it is stuck. When no vertex except s and t has excess, the preflow is a max flow.",
  "code": {
   "py": "from collections import deque\n\ndef push_relabel(n, edges, s, t):\n    \"\"\"FIFO push-relabel on a capacity matrix. Returns the max flow value.\"\"\"\n    if s == t:\n        raise ValueError(\"source and sink must differ\")\n    cap = [[0] * n for _ in range(n)]\n    for u, v, w in edges:\n        cap[u][v] += w\n    f = [[0] * n for _ in range(n)]          # f[u][v] = -f[v][u]\n    h, ex = [0] * n, [0] * n\n    h[s] = n                                  # the source sits above every other vertex\n    inq = [False] * n\n    q = deque()\n    for v in range(n):                        # saturate every edge out of s\n        if v != s and cap[s][v] > 0:\n            f[s][v], f[v][s] = cap[s][v], -cap[s][v]\n            ex[v] += cap[s][v]; ex[s] -= cap[s][v]\n            if v != t and not inq[v]:\n                inq[v] = True; q.append(v)\n    while q:\n        u = q.popleft(); inq[u] = False\n        while ex[u] > 0:\n            for v in range(n):\n                res = cap[u][v] - f[u][v]\n                if res > 0 and h[u] == h[v] + 1:          # push downhill\n                    d = min(ex[u], res)\n                    f[u][v] += d; f[v][u] -= d\n                    ex[u] -= d; ex[v] += d\n                    if v not in (s, t) and not inq[v]:\n                        inq[v] = True; q.append(v)\n                    if ex[u] == 0:\n                        break\n            if ex[u] > 0:                                  # stuck: relabel\n                h[u] = 1 + min(h[v] for v in range(n) if v != u and cap[u][v] - f[u][v] > 0)\n    return ex[t]\n\nprint(push_relabel(4, [(0, 1, 3), (0, 2, 2), (1, 2, 1), (1, 3, 2), (2, 3, 3)], 0, 3))  # 5"
  },
  "more": "- Invariant: h[u] <= h[v] + 1 for every residual edge u->v, with h[s] = n and h[t] = 0. That makes a residual s-t path impossible once no vertex has excess.\n- Excess that cannot reach t is eventually pushed back toward s, because heights can climb above n.\n- Real implementations add the gap and global-relabel heuristics, which matter more than the asymptotics.\n- The value is ex[t]; this is an overview-level toy on a matrix, not a tuned solver.",
  "cx": "Generic O(V^2 E); FIFO selection O(V^3); highest-label O(V^2 sqrt(E)). This matrix version scans O(V) per push attempt. Space O(V^2).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_maxflow(n, edges, s, t):\n    best = None\n    others = [v for v in range(n) if v not in (s, t)]\n    for r in range(len(others) + 1):\n        for sub in itertools.combinations(others, r):\n            S = set(sub) | {s}\n            c = sum(w for u, v, w in edges if u in S and v not in S)\n            best = c if best is None else min(best, c)\n    return best\ndef rand_net(rng, n, m, mx=6):\n    return [(rng.randrange(n), rng.randrange(n), rng.randint(1, mx)) for _ in range(m)]\ndef flow_check(fn):\n    rng = random.Random(1)\n    for _ in range(300):\n        n = rng.randint(2, 6)\n        edges = rand_net(rng, n, rng.randint(0, 12))\n        assert fn(n, edges, 0, n - 1) == brute_maxflow(n, edges, 0, n - 1), (n, edges)\n    assert fn(2, [(0, 1, 5)], 0, 1) == 5\n    assert fn(3, [(0, 1, 5)], 0, 2) == 0\n    assert fn(4, [(0, 1, 1), (0, 2, 1), (1, 2, 1), (1, 3, 1), (2, 3, 1)], 0, 3) == 2\nflow_check(push_relabel)"
 },
 {
  "id": "cf-min-cut",
  "title": "Minimum s-t cut from a max flow (max-flow min-cut theorem)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is the max flow min cut theorem",
   "how to find the minimum cut",
   "min cut from max flow",
   "extract min cut edges python",
   "minimum cut algorithm",
   "which edges are in the min cut",
   "min cut code",
   "cheapest edges to disconnect s from t"
  ],
  "tags": "min cut minimum cut max flow min cut theorem residual reachable edges cut set s t cut",
  "a": "The cheapest set of edges whose removal disconnects t from s has total capacity equal to the max flow. To list it: run max flow, BFS from s in the residual graph, and take every original edge that goes from a reachable vertex to an unreachable one.",
  "code": {
   "py": "from collections import deque\n\ndef min_cut(n, edges, s, t):\n    \"\"\"Returns (value, source_side_set, cut_edges). edges: (u, v, capacity), directed.\"\"\"\n    cap = [[0] * n for _ in range(n)]\n    for u, v, w in edges:\n        cap[u][v] += w\n    flow = 0\n    while True:                                   # Edmonds-Karp\n        parent = [-1] * n\n        parent[s] = s\n        q = deque([s])\n        while q and parent[t] == -1:\n            u = q.popleft()\n            for v in range(n):\n                if parent[v] == -1 and cap[u][v] > 0:\n                    parent[v] = u\n                    q.append(v)\n        if parent[t] == -1:\n            break\n        b, v = float(\"inf\"), t\n        while v != s:\n            b = min(b, cap[parent[v]][v]); v = parent[v]\n        v = t\n        while v != s:\n            u = parent[v]; cap[u][v] -= b; cap[v][u] += b; v = u\n        flow += b\n    side = {s}                                    # reachable from s in the final residual graph\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v in range(n):\n            if v not in side and cap[u][v] > 0:\n                side.add(v); q.append(v)\n    cut = [(u, v, w) for u, v, w in edges if u in side and v not in side]\n    return flow, side, cut\n\nprint(min_cut(4, [(0, 1, 3), (0, 2, 2), (1, 2, 1), (1, 3, 2), (2, 3, 3)], 0, 3))\n# (5, {0}, [(0, 1, 3), (0, 2, 2)])"
  },
  "more": "- Theorem: max flow value = min cut capacity. Any flow is at most any cut, and the residual-reachable set gives a cut that every max flow saturates exactly.\n- Only edges leaving the source side count; edges going back into it carry no capacity toward t.\n- The cut found has the smallest source side; BFS backward from t gives the largest. There can be many min cuts.\n- Uses: image segmentation, project selection, \"how many links must fail\".",
  "cx": "Time of the max flow used (here O(V^3 E) with the matrix BFS) plus O(V^2) for the final BFS and O(E) to list the cut. Space O(V^2).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_maxflow(n, edges, s, t):\n    best = None\n    others = [v for v in range(n) if v not in (s, t)]\n    for r in range(len(others) + 1):\n        for sub in itertools.combinations(others, r):\n            S = set(sub) | {s}\n            c = sum(w for u, v, w in edges if u in S and v not in S)\n            best = c if best is None else min(best, c)\n    return best\ndef rand_net(rng, n, m, mx=6):\n    return [(rng.randrange(n), rng.randrange(n), rng.randint(1, mx)) for _ in range(m)]\ndef flow_check(fn):\n    rng = random.Random(1)\n    for _ in range(300):\n        n = rng.randint(2, 6)\n        edges = rand_net(rng, n, rng.randint(0, 12))\n        assert fn(n, edges, 0, n - 1) == brute_maxflow(n, edges, 0, n - 1), (n, edges)\n    assert fn(2, [(0, 1, 5)], 0, 1) == 5\n    assert fn(3, [(0, 1, 5)], 0, 2) == 0\n    assert fn(4, [(0, 1, 1), (0, 2, 1), (1, 2, 1), (1, 3, 1), (2, 3, 1)], 0, 3) == 2\n\nrng = random.Random(7)\nfor _ in range(300):\n    n = rng.randint(2, 6)\n    edges = rand_net(rng, n, rng.randint(0, 12))\n    val, side, cut = min_cut(n, edges, 0, n - 1)\n    assert val == brute_maxflow(n, edges, 0, n - 1)\n    assert 0 in side and n - 1 not in side\n    assert sum(w for _, _, w in cut) == val          # cut capacity equals the flow\nassert min_cut(3, [(0, 1, 4)], 0, 2)[0] == 0"
 },
 {
  "id": "cf-capacity-scaling",
  "title": "Capacity scaling max flow",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is capacity scaling",
   "capacity scaling max flow idea",
   "scaling algorithm for max flow",
   "capacity scaling in python",
   "implement capacity scaling",
   "capacity scaling vs ford fulkerson",
   "only augment with large capacity paths",
   "delta scaling flow"
  ],
  "tags": "capacity scaling delta scaling max flow large capacities augmenting path bottleneck ford fulkerson improvement",
  "a": "Capacity scaling is Ford-Fulkerson with a threshold delta. Start with delta = the largest power of two not above the max capacity; augment only through edges with residual >= delta until stuck, then halve delta. Big pushes happen first, so the number of augmentations depends on log(capacity), not on the flow value.",
  "code": {
   "py": "from collections import deque\n\ndef capacity_scaling(n, edges, s, t):\n    if s == t:\n        raise ValueError(\"source and sink must differ\")\n    cap = [[0] * n for _ in range(n)]\n    for u, v, w in edges:\n        cap[u][v] += w\n    top = max((w for _, _, w in edges), default=0)\n    if top == 0:\n        return 0\n    delta = 1\n    while delta * 2 <= top:\n        delta *= 2\n    flow = 0\n    while delta >= 1:\n        while True:\n            parent = [-1] * n\n            parent[s] = s\n            q = deque([s])\n            while q and parent[t] == -1:\n                u = q.popleft()\n                for v in range(n):\n                    if parent[v] == -1 and cap[u][v] >= delta:   # only fat edges\n                        parent[v] = u\n                        q.append(v)\n            if parent[t] == -1:\n                break\n            b, v = float(\"inf\"), t\n            while v != s:\n                b = min(b, cap[parent[v]][v]); v = parent[v]\n            v = t\n            while v != s:\n                u = parent[v]; cap[u][v] -= b; cap[v][u] += b; v = u\n            flow += b\n        delta //= 2                                              # last round is delta = 1: plain max flow\n    return flow\n\nprint(capacity_scaling(3, [(0, 1, 1000000), (1, 2, 1000000), (0, 2, 1)], 0, 2))  # 1000001"
  },
  "more": "- Correctness: the final delta = 1 round is an ordinary augmenting-path search, so it only stops at a true max flow.\n- Speed: after a round with threshold delta the remaining flow is at most about 2 * delta * E, so each round does O(E) augmentations.\n- Integer capacities only (delta halves down to 1).\n- Dinic is usually faster in practice; scaling helps when capacities are huge and you want a simple bound.",
  "cx": "O(E^2 log U) with adjacency lists, U = the largest capacity (O(E log U) augmentations, each O(E)); this matrix BFS costs O(V^2) per search instead. Space O(V^2).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_maxflow(n, edges, s, t):\n    best = None\n    others = [v for v in range(n) if v not in (s, t)]\n    for r in range(len(others) + 1):\n        for sub in itertools.combinations(others, r):\n            S = set(sub) | {s}\n            c = sum(w for u, v, w in edges if u in S and v not in S)\n            best = c if best is None else min(best, c)\n    return best\ndef rand_net(rng, n, m, mx=6):\n    return [(rng.randrange(n), rng.randrange(n), rng.randint(1, mx)) for _ in range(m)]\ndef flow_check(fn):\n    rng = random.Random(1)\n    for _ in range(300):\n        n = rng.randint(2, 6)\n        edges = rand_net(rng, n, rng.randint(0, 12))\n        assert fn(n, edges, 0, n - 1) == brute_maxflow(n, edges, 0, n - 1), (n, edges)\n    assert fn(2, [(0, 1, 5)], 0, 1) == 5\n    assert fn(3, [(0, 1, 5)], 0, 2) == 0\n    assert fn(4, [(0, 1, 1), (0, 2, 1), (1, 2, 1), (1, 3, 1), (2, 3, 1)], 0, 3) == 2\nflow_check(capacity_scaling)\nassert capacity_scaling(3, [(0, 1, 10**9), (1, 2, 10**9)], 0, 2) == 10**9"
 },
 {
  "id": "cf-flow-lower-bounds",
  "title": "Flow with lower bounds (feasible flow / circulation)",
  "cat": "Graphs: flow and matching",
  "q": [
   "flow with lower bounds",
   "max flow with minimum edge capacity",
   "feasible circulation with demands",
   "how to handle lower bounds in network flow",
   "flow lower bound python",
   "edges that must carry at least some flow",
   "circulation with lower bounds reduction",
   "does a feasible flow exist with lower bounds"
  ],
  "tags": "lower bounds flow demands circulation feasible flow super source super sink reduction minimum flow edge",
  "a": "To find a flow where each edge must carry between lo and hi: replace capacity by hi - lo, record that the head gains lo units and the tail loses lo units, add a super source for vertices with surplus and a super sink for deficits, add an infinite t->s edge, and run max flow. Feasible exactly when every super-source edge saturates.",
  "code": {
   "py": "from collections import deque\n\ndef _maxflow(N, arcs, S, T):\n    \"\"\"arcs: (u, v, cap). Returns (total, flow_on_each_arc).\"\"\"\n    g = [[] for _ in range(N)]\n    to, cap = [], []\n    for u, v, c in arcs:\n        g[u].append(len(to)); to.append(v); cap.append(c)\n        g[v].append(len(to)); to.append(u); cap.append(0)\n    total = 0\n    while True:\n        prev = [-1] * N\n        prev[S] = -2\n        q = deque([S])\n        while q and prev[T] == -1:\n            u = q.popleft()\n            for i in g[u]:\n                if cap[i] > 0 and prev[to[i]] == -1:\n                    prev[to[i]] = i\n                    q.append(to[i])\n        if prev[T] == -1:\n            break\n        b, v = float(\"inf\"), T\n        while v != S:\n            i = prev[v]; b = min(b, cap[i]); v = to[i ^ 1]\n        v = T\n        while v != S:\n            i = prev[v]; cap[i] -= b; cap[i ^ 1] += b; v = to[i ^ 1]\n        total += b\n    return total, [cap[2 * k + 1] for k in range(len(arcs))]\n\ndef feasible_flow(n, edges, s, t):\n    \"\"\"edges: (u, v, lo, hi). Returns per-edge flows of some feasible s->t flow, or None.\"\"\"\n    INF = 10 ** 9\n    SS, TT = n, n + 1\n    arcs, bal = [], [0] * n\n    for u, v, lo, hi in edges:\n        arcs.append((u, v, hi - lo))\n        bal[v] += lo; bal[u] -= lo\n    arcs.append((t, s, INF))                 # lets any flow value return to s\n    need = 0\n    for x in range(n):\n        if bal[x] > 0:\n            arcs.append((SS, x, bal[x])); need += bal[x]\n        elif bal[x] < 0:\n            arcs.append((x, TT, -bal[x]))\n    total, fl = _maxflow(n + 2, arcs, SS, TT)\n    if total != need:\n        return None\n    return [lo + fl[k] for k, (u, v, lo, hi) in enumerate(edges)]\n\n# s=0 -> 1 -> t=2 ; edge 0->1 must carry >= 2 but edge 1->2 holds at most 1: infeasible\nprint(feasible_flow(3, [(0, 1, 2, 5), (1, 2, 0, 1)], 0, 2))   # None\nprint(feasible_flow(3, [(0, 1, 1, 5), (1, 2, 1, 3)], 0, 2))   # [1, 1]"
  },
  "more": "- Reduction idea: force the lower bound onto the edge (lo units always flow), then repair the conservation errors this causes with a super source and sink.\n- This answers feasibility. For the largest feasible s-t flow, start from the feasible flow, drop the t->s edge and keep augmenting s->t in the residual graph; for the smallest, augment t->s instead.\n- All bounds must be integers for integral flows.\n- The same trick solves \"circulation with demands\" and many scheduling problems.",
  "cx": "One max flow on V + 2 vertices and E + V edges, so the cost of whichever max-flow algorithm you use (Dinic: O(V^2 E)). Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_feasible(n, edges, s, t):\n    for fl in itertools.product(*[range(lo, hi + 1) for _, _, lo, hi in edges]):\n        net = [0] * n\n        for (u, v, lo, hi), x in zip(edges, fl):\n            net[u] += x; net[v] -= x\n        if all(net[v] == 0 for v in range(n) if v not in (s, t)) and net[s] >= 0:\n            return True\n    return False\nrng = random.Random(3)\nfor _ in range(400):\n    n = rng.randint(2, 5)\n    edges = []\n    for _ in range(rng.randint(1, 5)):\n        lo = rng.randint(0, 2)\n        edges.append((rng.randrange(n), rng.randrange(n), lo, lo + rng.randint(0, 2)))\n    got = feasible_flow(n, edges, 0, n - 1)\n    assert (got is not None) == brute_feasible(n, edges, 0, n - 1), (n, edges)\n    if got is not None:\n        net = [0] * n\n        for (u, v, lo, hi), x in zip(edges, got):\n            assert lo <= x <= hi\n            net[u] += x; net[v] -= x\n        assert all(net[v] == 0 for v in range(n) if v not in (0, n - 1))\nassert feasible_flow(3, [(0, 1, 2, 5), (1, 2, 0, 1)], 0, 2) is None"
 },
 {
  "id": "cf-min-cost-max-flow",
  "title": "Min-cost max-flow (successive shortest paths with SPFA)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is min cost max flow",
   "explain min cost flow",
   "min cost max flow in python",
   "implement min cost max flow spfa",
   "successive shortest path algorithm",
   "min cost flow code",
   "min cost flow vs max flow",
   "assignment problem with flow"
  ],
  "tags": "min cost max flow mcmf mincostflow successive shortest paths spfa bellman ford cost flow transportation assignment",
  "a": "Min-cost max-flow pushes the maximum flow while minimising the sum of cost * flow over edges. Repeatedly find the cheapest s-t path in the residual graph (reverse edges cost the negative, so use SPFA/Bellman-Ford) and augment along it. Every augmentation keeps the flow cost-optimal for its value.",
  "code": {
   "py": "from collections import deque\n\nclass MCMF:\n    def __init__(self, n):\n        self.n = n\n        self.g = [[] for _ in range(n)]\n        self.to, self.cap, self.cost = [], [], []\n\n    def add_edge(self, u, v, cap, cost):\n        self.g[u].append(len(self.to)); self.to.append(v); self.cap.append(cap); self.cost.append(cost)\n        self.g[v].append(len(self.to)); self.to.append(u); self.cap.append(0); self.cost.append(-cost)\n\n    def run(self, s, t):\n        \"\"\"Returns (max_flow, min_cost). Assumes no negative-cost cycle initially.\"\"\"\n        INF = float(\"inf\")\n        flow = cost = 0\n        while True:\n            dist = [INF] * self.n\n            dist[s] = 0\n            inq = [False] * self.n\n            prev = [-1] * self.n\n            q = deque([s])\n            while q:                                   # SPFA = queue-based Bellman-Ford\n                u = q.popleft(); inq[u] = False\n                for i in self.g[u]:\n                    v = self.to[i]\n                    if self.cap[i] > 0 and dist[u] + self.cost[i] < dist[v]:\n                        dist[v] = dist[u] + self.cost[i]\n                        prev[v] = i\n                        if not inq[v]:\n                            inq[v] = True; q.append(v)\n            if dist[t] == INF:\n                return flow, cost\n            b, v = INF, t\n            while v != s:\n                i = prev[v]; b = min(b, self.cap[i]); v = self.to[i ^ 1]\n            v = t\n            while v != s:\n                i = prev[v]; self.cap[i] -= b; self.cap[i ^ 1] += b; v = self.to[i ^ 1]\n            flow += b\n            cost += b * dist[t]\n\nm = MCMF(4)\nfor u, v, c, w in [(0, 1, 2, 1), (0, 2, 1, 4), (1, 2, 1, 1), (1, 3, 1, 5), (2, 3, 2, 1)]:\n    m.add_edge(u, v, c, w)\nprint(m.run(0, 3))  # (3, 14)"
  },
  "more": "- Invariant: the current flow is a min-cost flow for its value; the cheapest residual path is the cheapest way to add one more unit, because the residual graph has no negative cycle.\n- Input costs may be negative as long as there is no negative cycle.\n- With non-negative costs, Dijkstra with potentials is faster than SPFA.\n- Stopping early gives the min-cost flow of a chosen value.\n- Assignment, transportation and k-edge-disjoint cheapest paths all reduce to it.",
  "cx": "Time O(F * V * E) worst case with SPFA (F = total flow value; SPFA is O(VE) worst, usually much faster); O(F * E log V) with Dijkstra and potentials. Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/topic/shortest-paths",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute(n, edges, s, t):\n    best = (-1, 0)\n    for fl in itertools.product(*[range(c + 1) for _, _, c, _ in edges]):\n        net = [0] * n\n        for (u, v, c, w), x in zip(edges, fl):\n            net[u] += x; net[v] -= x\n        if any(net[v] for v in range(n) if v not in (s, t)):\n            continue\n        val, cost = net[s], sum(x * w for (_, _, _, w), x in zip(edges, fl))\n        if val > best[0] or (val == best[0] and cost < best[1]):\n            best = (val, cost)\n    return best\nrng = random.Random(5)\nfor _ in range(300):\n    n = 4\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 2), rng.randint(0, 5)) for _ in range(rng.randint(1, 5))]\n    edges = [x for x in edges if x[0] != x[1]]\n    m = MCMF(n)\n    for u, v, c, w in edges:\n        m.add_edge(u, v, c, w)\n    assert m.run(0, 3) == brute(n, edges, 0, 3), edges\nm = MCMF(2)\nassert m.run(0, 1) == (0, 0)"
 },
 {
  "id": "cf-bipartite-matching-kuhn",
  "title": "Bipartite matching (Kuhn's augmenting path algorithm)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is bipartite matching",
   "explain kuhn's algorithm",
   "how to find maximum bipartite matching",
   "bipartite matching in python",
   "implement kuhn algorithm",
   "maximum matching code dfs augmenting path",
   "kuhn vs hopcroft karp",
   "assign jobs to workers maximum matching"
  ],
  "tags": "bipartite matching kuhn augmenting path maximum matching dfs alternating path job assignment hungarian matching",
  "a": "Maximum bipartite matching pairs left vertices with right vertices along edges so no vertex is used twice. Kuhn tries each left vertex in turn: DFS for a free right neighbour, or for a neighbour whose current partner can be re-routed elsewhere (an augmenting path). Each success grows the matching by one.",
  "code": {
   "py": "def max_bipartite_matching(n_left, n_right, adj):\n    \"\"\"adj[u] = right vertices adjacent to left vertex u. Returns (size, match_right).\"\"\"\n    match_r = [-1] * n_right\n\n    def try_augment(u, seen):\n        for v in adj[u]:\n            if not seen[v]:\n                seen[v] = True\n                if match_r[v] == -1 or try_augment(match_r[v], seen):\n                    match_r[v] = u            # take v, pushing its old partner elsewhere\n                    return True\n        return False\n\n    size = sum(try_augment(u, [False] * n_right) for u in range(n_left))\n    return size, match_r\n\nprint(max_bipartite_matching(3, 3, [[0, 1], [0], [1, 2]]))  # (3, [1, 0, 2])"
  },
  "more": "- Berge: a matching is maximum exactly when no augmenting path exists (a path alternating non-matching/matching edges between two free vertices).\n- A left vertex that fails now can never succeed later, so one pass over the left side is enough.\n- Use a fresh `seen` array per start vertex.\n- Recursion depth up to the matching size; for big inputs use Hopcroft-Karp or Dinic.\n- Greedy matching is not enough: it can be stuck at half the optimum.",
  "cx": "Time O(V * E) (V = left size, E = edges); a greedy initial matching speeds up practice a lot. Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_matching(nl, nr, adj):\n    def go(u, used):\n        if u == nl:\n            return 0\n        best = go(u + 1, used)\n        for v in adj[u]:\n            if not (used >> v) & 1:\n                best = max(best, 1 + go(u + 1, used | 1 << v))\n        return best\n    return go(0, 0)\ndef rand_bip(rng):\n    nl, nr = rng.randint(1, 6), rng.randint(1, 6)\n    adj = [sorted({rng.randrange(nr) for _ in range(rng.randint(0, 3))}) for _ in range(nl)]\n    return nl, nr, adj\n\nrng = random.Random(2)\nfor _ in range(500):\n    nl, nr, adj = rand_bip(rng)\n    size, mr = max_bipartite_matching(nl, nr, adj)\n    assert size == brute_matching(nl, nr, adj)\n    assert size == sum(1 for x in mr if x != -1)\n    assert all(mr[v] == -1 or v in adj[mr[v]] for v in range(nr))\nassert max_bipartite_matching(0, 0, []) == (0, [])\nassert max_bipartite_matching(2, 1, [[0], [0]])[0] == 1"
 },
 {
  "id": "cf-hopcroft-karp",
  "title": "Hopcroft-Karp maximum bipartite matching",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is hopcroft karp",
   "explain the hopcroft karp algorithm",
   "how does hopcroft karp work",
   "hopcroft karp in python",
   "implement hopcroft karp",
   "hopcroft karp code",
   "hopcroft karp vs kuhn",
   "fast bipartite matching"
  ],
  "tags": "hopcroft karp bipartite matching maximum matching bfs layers dfs shortest augmenting paths sqrt v",
  "a": "Hopcroft-Karp speeds up Kuhn by augmenting many paths per round. A BFS from all free left vertices layers the graph, then DFS finds a set of vertex-disjoint shortest augmenting paths along those layers and flips them all. Only O(sqrt(V)) rounds are needed.",
  "code": {
   "py": "from collections import deque\n\ndef hopcroft_karp(n_left, n_right, adj):\n    \"\"\"Returns (size, match_left, match_right).\"\"\"\n    mu, mv = [-1] * n_left, [-1] * n_right\n    dist = []\n\n    def bfs():\n        nonlocal dist\n        dist = [-1] * n_left\n        q = deque(u for u in range(n_left) if mu[u] == -1)\n        for u in q:\n            dist[u] = 0\n        found = False\n        while q:\n            u = q.popleft()\n            for v in adj[u]:\n                w = mv[v]\n                if w == -1:\n                    found = True                       # a free right vertex ends a path\n                elif dist[w] == -1:\n                    dist[w] = dist[u] + 1\n                    q.append(w)\n        return found\n\n    def dfs(u):\n        for v in adj[u]:\n            w = mv[v]\n            if w == -1 or (dist[w] == dist[u] + 1 and dfs(w)):\n                mu[u], mv[v] = v, u\n                return True\n        dist[u] = -1                                   # dead end this round\n        return False\n\n    size = 0\n    while bfs():\n        for u in range(n_left):\n            if mu[u] == -1 and dfs(u):\n                size += 1\n    return size, mu, mv\n\nprint(hopcroft_karp(3, 3, [[0, 1], [0], [1, 2]])[0])  # 3"
  },
  "more": "- Each round finds a maximal set of vertex-disjoint shortest augmenting paths; after about sqrt(V) rounds the shortest augmenting path is long, so few paths remain.\n- Free right vertices can be accepted at any layer here, which stays correct and keeps the code short.\n- Marking `dist[u] = -1` on failure stops repeated work inside a round.\n- Use Kuhn for small inputs (less code), Hopcroft-Karp or Dinic when V is in the tens of thousands.",
  "cx": "Time O(E sqrt(V)), V = number of vertices. Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_matching(nl, nr, adj):\n    def go(u, used):\n        if u == nl:\n            return 0\n        best = go(u + 1, used)\n        for v in adj[u]:\n            if not (used >> v) & 1:\n                best = max(best, 1 + go(u + 1, used | 1 << v))\n        return best\n    return go(0, 0)\ndef rand_bip(rng):\n    nl, nr = rng.randint(1, 6), rng.randint(1, 6)\n    adj = [sorted({rng.randrange(nr) for _ in range(rng.randint(0, 3))}) for _ in range(nl)]\n    return nl, nr, adj\n\nrng = random.Random(4)\nfor _ in range(500):\n    nl, nr, adj = rand_bip(rng)\n    size, mu, mv = hopcroft_karp(nl, nr, adj)\n    assert size == brute_matching(nl, nr, adj)\n    assert all(mu[u] == -1 or (mu[u] in adj[u] and mv[mu[u]] == u) for u in range(nl))\nassert hopcroft_karp(1, 1, [[]])[0] == 0\nbig = [[i, (i + 1) % 200] for i in range(200)]\nassert hopcroft_karp(200, 200, big)[0] == 200"
 },
 {
  "id": "cf-konig-vertex-cover",
  "title": "Konig's theorem: min vertex cover and max independent set in a bipartite graph",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is konig's theorem",
   "minimum vertex cover in bipartite graph",
   "maximum independent set in bipartite graph",
   "how to find vertex cover from matching",
   "konig theorem python",
   "bipartite min vertex cover code",
   "independent set from maximum matching",
   "minimum vertex cover equals maximum matching"
  ],
  "tags": "konig theorem minimum vertex cover maximum independent set bipartite matching alternating paths gallai",
  "a": "In a bipartite graph, the size of a minimum vertex cover equals the size of a maximum matching. To build the cover: find a max matching, walk alternating paths from free left vertices, then take the unvisited left vertices plus the visited right vertices. The remaining vertices form a maximum independent set.",
  "code": {
   "py": "def konig(n_left, n_right, adj):\n    \"\"\"Returns (matching_size, cover_left, cover_right, indep_left, indep_right).\"\"\"\n    match_r = [-1] * n_right\n\n    def augment(u, seen):\n        for v in adj[u]:\n            if not seen[v]:\n                seen[v] = True\n                if match_r[v] == -1 or augment(match_r[v], seen):\n                    match_r[v] = u\n                    return True\n        return False\n\n    size = sum(augment(u, [False] * n_right) for u in range(n_left))\n    match_l = [-1] * n_left\n    for v, u in enumerate(match_r):\n        if u != -1:\n            match_l[u] = v\n    # alternating reachability from free left vertices: left->right on any edge, right->left on matching edge\n    zl, zr = [False] * n_left, [False] * n_right\n    stack = [u for u in range(n_left) if match_l[u] == -1]\n    for u in stack:\n        zl[u] = True\n    while stack:\n        u = stack.pop()\n        for v in adj[u]:\n            if not zr[v]:\n                zr[v] = True\n                w = match_r[v]                 # v must be matched, otherwise the matching was not maximum\n                if w != -1 and not zl[w]:\n                    zl[w] = True\n                    stack.append(w)\n    cover_l = [u for u in range(n_left) if not zl[u]]\n    cover_r = [v for v in range(n_right) if zr[v]]\n    indep_l = [u for u in range(n_left) if zl[u]]\n    indep_r = [v for v in range(n_right) if not zr[v]]\n    return size, cover_l, cover_r, indep_l, indep_r\n\nprint(konig(3, 3, [[0, 1], [0], [1, 2]]))  # (3, [0, 1, 2], [], [], [0, 1, 2])"
  },
  "more": "- Why it works: every edge is covered because no edge can leave the visited region from a visited left vertex to an unvisited right vertex, and unvisited left vertices are in the cover.\n- Each matching edge contributes exactly one cover vertex, so the sizes match.\n- Independent set = all vertices minus the cover, so max independent set = V - max matching.\n- Only true for bipartite graphs; general graphs make vertex cover NP-hard.",
  "cx": "Time of the matching (here O(V * E)) plus O(V + E) for the alternating search. Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\nrng = random.Random(8)\nfor _ in range(400):\n    nl, nr = rng.randint(1, 5), rng.randint(1, 5)\n    adj = [sorted({rng.randrange(nr) for _ in range(rng.randint(0, 3))}) for _ in range(nl)]\n    size, cl, cr, il, ir = konig(nl, nr, adj)\n    assert len(cl) + len(cr) == size                                   # cover size equals matching size\n    assert all(u in cl or v in cr for u in range(nl) for v in adj[u])   # it covers every edge\n    assert all(v not in adj[u] for u in il for v in ir)                 # independent set has no edge\n    assert len(il) + len(ir) == nl + nr - size\n    best = min(len(S) for k in range(nl + nr + 1) for S in itertools.combinations(range(nl + nr), k)\n               if all(u in S or nl + v in S for u in range(nl) for v in adj[u]))\n    assert best == size\nassert konig(2, 2, [[], []])[0] == 0"
 },
 {
  "id": "cf-hungarian",
  "title": "Hungarian algorithm (assignment problem)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is the hungarian algorithm",
   "explain the hungarian algorithm",
   "how does the hungarian method work",
   "hungarian algorithm in python",
   "implement hungarian algorithm",
   "assignment problem min cost code",
   "hungarian vs min cost flow",
   "assign workers to tasks with minimum total cost"
  ],
  "tags": "hungarian algorithm kuhn munkres assignment problem min cost perfect matching potentials cost matrix",
  "a": "The Hungarian algorithm solves the assignment problem: given an n x m cost matrix (n <= m), give every row a distinct column with minimum total cost. It keeps dual potentials on rows and columns and adds one row at a time along a cheapest alternating path. This version runs in O(n^2 m).",
  "code": {
   "py": "def hungarian(cost):\n    \"\"\"cost: n x m matrix with n <= m. Returns (min_total, assignment) where assignment[i] = column of row i.\"\"\"\n    n, m = len(cost), len(cost[0])\n    assert n <= m\n    INF = float(\"inf\")\n    u, v = [0] * (n + 1), [0] * (m + 1)          # potentials (1-indexed)\n    p, way = [0] * (m + 1), [0] * (m + 1)        # p[j] = row currently assigned to column j\n    for i in range(1, n + 1):\n        p[0] = i\n        j0 = 0\n        minv = [INF] * (m + 1)\n        used = [False] * (m + 1)\n        while True:                              # grow an alternating tree until a free column is hit\n            used[j0] = True\n            i0, delta, j1 = p[j0], INF, 0\n            for j in range(1, m + 1):\n                if not used[j]:\n                    cur = cost[i0 - 1][j - 1] - u[i0] - v[j]\n                    if cur < minv[j]:\n                        minv[j], way[j] = cur, j0\n                    if minv[j] < delta:\n                        delta, j1 = minv[j], j\n            for j in range(m + 1):\n                if used[j]:\n                    u[p[j]] += delta\n                    v[j] -= delta\n                else:\n                    minv[j] -= delta\n            j0 = j1\n            if p[j0] == 0:\n                break\n        while j0:                                # flip the alternating path\n            j1 = way[j0]\n            p[j0] = p[j1]\n            j0 = j1\n    assign = [0] * n\n    for j in range(1, m + 1):\n        if p[j]:\n            assign[p[j] - 1] = j - 1\n    return sum(cost[i][assign[i]] for i in range(n)), assign\n\nprint(hungarian([[4, 1, 3], [2, 0, 5], [3, 2, 2]]))  # (5, [1, 0, 2])"
  },
  "more": "- Invariant: u[i] + v[j] <= cost[i][j] for all pairs, with equality on matched pairs; then the matching is optimal by LP duality.\n- Handles negative costs. For maximisation negate the costs.\n- Rectangular case (rows <= columns) works directly; pad with zero rows/columns if you need a square matrix.\n- Alternative: min-cost max-flow (slower to code, handles sparse graphs and extra constraints).",
  "cx": "Time O(n^2 m) (O(n^3) for a square matrix), space O(n + m) beyond the matrix.",
  "see": [
   "#/topic/advanced-graphs",
   "#/topic/greedy",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\nrng = random.Random(6)\nfor _ in range(300):\n    n = rng.randint(1, 5); m = rng.randint(n, 6)\n    cost = [[rng.randint(-5, 20) for _ in range(m)] for _ in range(n)]\n    total, asg = hungarian(cost)\n    best = min(sum(cost[i][c[i]] for i in range(n)) for c in itertools.permutations(range(m), n))\n    assert total == best, (cost, total, best)\n    assert len(set(asg)) == n and total == sum(cost[i][asg[i]] for i in range(n))\nassert hungarian([[7]]) == (7, [0])"
 },
 {
  "id": "cf-gale-shapley",
  "title": "Stable marriage (Gale-Shapley)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is the gale shapley algorithm",
   "explain stable marriage problem",
   "how does gale shapley work",
   "stable matching in python",
   "implement gale shapley",
   "stable marriage code",
   "stable matching vs maximum matching",
   "deferred acceptance algorithm"
  ],
  "tags": "gale shapley stable marriage stable matching deferred acceptance proposals preferences blocking pair residents hospitals",
  "a": "Gale-Shapley finds a stable matching between two equal-sized groups where everyone ranks the other side. Each free proposer asks their next favourite; the receiver keeps the best offer so far and rejects the other. It always ends with everyone paired and no blocking pair.",
  "code": {
   "py": "from collections import deque\n\ndef stable_marriage(men_pref, women_pref):\n    \"\"\"Preference lists are best-first. Returns wife[m] for every man (man-optimal stable matching).\"\"\"\n    n = len(men_pref)\n    rank = [[0] * n for _ in range(n)]            # rank[w][m] = how much woman w likes man m (lower is better)\n    for w in range(n):\n        for r, m in enumerate(women_pref[w]):\n            rank[w][m] = r\n    nxt = [0] * n                                 # next woman each man will propose to\n    husband = [-1] * n\n    free = deque(range(n))\n    while free:\n        m = free.popleft()\n        w = men_pref[m][nxt[m]]\n        nxt[m] += 1\n        if husband[w] == -1:\n            husband[w] = m\n        elif rank[w][m] < rank[w][husband[w]]:    # she prefers the newcomer\n            free.append(husband[w])\n            husband[w] = m\n        else:\n            free.append(m)\n    wife = [-1] * n\n    for w, m in enumerate(husband):\n        wife[m] = w\n    return wife\n\nprint(stable_marriage([[0, 1], [0, 1]], [[1, 0], [1, 0]]))  # [1, 0]"
  },
  "more": "- Stability: a man who proposes only moves down his list while a woman only moves up hers, so if m prefers w to his wife, w was already matched to someone she likes better.\n- Terminates after at most n^2 proposals; everyone ends matched when both sides have n members with full lists.\n- The proposing side gets its best possible stable partner, the receiving side its worst; swap roles to favour the other group.\n- Used for hospital-resident matching.",
  "cx": "Time O(n^2) proposals in the worst case (n per side). Space O(n^2) for the rank table.",
  "see": [
   "#/topic/greedy",
   "#/topic/advanced-graphs"
  ],
  "check": "import itertools, random\ndef blocking(wife, mp, wp):\n    n = len(wife)\n    husband = [0] * n\n    for m, w in enumerate(wife):\n        husband[w] = m\n    for m in range(n):\n        for w in mp[m]:\n            if w == wife[m]:\n                break                      # m prefers only the women listed before his wife\n            if wp[w].index(m) < wp[w].index(husband[w]):\n                return True\n    return False\nrng = random.Random(9)\nfor _ in range(300):\n    n = rng.randint(1, 5)\n    mp = [rng.sample(range(n), n) for _ in range(n)]\n    wp = [rng.sample(range(n), n) for _ in range(n)]\n    wife = stable_marriage(mp, wp)\n    assert sorted(wife) == list(range(n)) and not blocking(wife, mp, wp)\n    for other in itertools.permutations(range(n)):       # man-optimal: no stable matching is better for any man\n        if not blocking(list(other), mp, wp):\n            assert all(mp[m].index(wife[m]) <= mp[m].index(other[m]) for m in range(n))\nassert stable_marriage([[0]], [[0]]) == [0]"
 },
 {
  "id": "cf-edmonds-blossom",
  "title": "Edmonds' blossom algorithm (maximum matching in general graphs)",
  "cat": "Graphs: flow and matching",
  "q": [
   "what is edmonds blossom algorithm",
   "explain the blossom algorithm",
   "maximum matching in a general graph",
   "blossom algorithm in python",
   "implement blossom matching",
   "blossom algorithm code",
   "odd cycle contraction matching",
   "blossom vs hopcroft karp"
  ],
  "tags": "edmonds blossom algorithm general graph matching maximum matching odd cycle contraction augmenting path non bipartite",
  "a": "Kuhn and Hopcroft-Karp only work on bipartite graphs because an odd cycle breaks their alternating search. Edmonds noticed that such an odd cycle (a blossom) can be contracted to one vertex and the search continued. This compact BFS version finds a maximum matching in any graph in O(V^3). It is intricate; learn the idea first.",
  "code": {
   "py": "from collections import deque\n\ndef max_matching(n, adj):\n    \"\"\"General graph maximum matching. adj[u] = neighbours. Returns (size, match) with match[u] = partner or -1.\"\"\"\n    match = [-1] * n\n    p = [-1] * n\n    base = list(range(n))\n\n    def lca(a, b):\n        seen = [False] * n\n        while True:\n            a = base[a]\n            seen[a] = True\n            if match[a] == -1:\n                break\n            a = p[match[a]]\n        while True:\n            b = base[b]\n            if seen[b]:\n                return b\n            b = p[match[b]]\n\n    def mark_path(v, b, child, blossom):\n        while base[v] != b:\n            blossom[base[v]] = blossom[base[match[v]]] = True\n            p[v] = child\n            child = match[v]\n            v = p[match[v]]\n\n    def find_path(root):\n        nonlocal p, base\n        used = [False] * n\n        p = [-1] * n\n        base = list(range(n))\n        used[root] = True\n        q = deque([root])\n        while q:\n            v = q.popleft()\n            for to in adj[v]:\n                if base[v] == base[to] or match[v] == to:\n                    continue\n                if to == root or (match[to] != -1 and p[match[to]] != -1):    # odd cycle: contract the blossom\n                    cur = lca(v, to)\n                    blossom = [False] * n\n                    mark_path(v, cur, to, blossom)\n                    mark_path(to, cur, v, blossom)\n                    for i in range(n):\n                        if blossom[base[i]]:\n                            base[i] = cur\n                            if not used[i]:\n                                used[i] = True\n                                q.append(i)\n                elif p[to] == -1:\n                    p[to] = v\n                    if match[to] == -1:\n                        return to                                              # free vertex: augmenting path found\n                    used[match[to]] = True\n                    q.append(match[to])\n        return -1\n\n    for i in range(n):\n        if match[i] == -1:\n            v = find_path(i)\n            while v != -1:                                                     # flip the path back to the root\n                pv = p[v]\n                ppv = match[pv]\n                match[v], match[pv] = pv, v\n                v = ppv\n    return sum(1 for x in match if x != -1) // 2, match\n\n# a triangle plus a pendant edge: 4 vertices, perfect matching exists (0-1, 2-3)\nprint(max_matching(4, [[1, 2], [0, 2], [0, 1, 3], [2]])[0])  # 2"
  },
  "more": "- A blossom is an odd cycle in which alternate edges are matched; contracting it keeps augmenting paths intact, and a path in the contracted graph expands back to one in the original.\n- `base[]` tracks which blossom each vertex belongs to; `p[]` stores the alternating tree.\n- Mistakes: forgetting to reset `p` and `base` for each root, or running bipartite code on a graph with odd cycles (silently non-maximum).\n- Weighted general matching needs the much harder weighted blossom algorithm; use a library.",
  "cx": "Time O(V^3) for this implementation (V roots times an O(V^2) search); O(E sqrt(V)) is possible with Micali-Vazirani. Space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute(n, adj):\n    def go(mask):\n        free = [i for i in range(n) if not (mask >> i) & 1]\n        if not free:\n            return 0\n        u = free[0]\n        best = go(mask | 1 << u)                    # leave u unmatched\n        for v in adj[u]:\n            if not (mask >> v) & 1:\n                best = max(best, 1 + go(mask | 1 << u | 1 << v))\n        return best\n    return go(0)\nrng = random.Random(11)\nfor _ in range(600):\n    n = rng.randint(1, 9)\n    adj = [set() for _ in range(n)]\n    for _ in range(rng.randint(0, 14)):\n        a, b = rng.randrange(n), rng.randrange(n)\n        if a != b:\n            adj[a].add(b); adj[b].add(a)\n    adj = [sorted(s) for s in adj]\n    size, match = max_matching(n, adj)\n    assert size == brute(n, adj), (n, adj)\n    assert all(match[u] == -1 or (match[match[u]] == u and match[u] in adj[u]) for u in range(n))\nfive = [[1, 4], [0, 2], [1, 3], [2, 4], [3, 0]]      # odd cycle C5\nassert max_matching(5, five)[0] == 2"
 },
 {
  "id": "cf-stoer-wagner",
  "title": "Stoer-Wagner global minimum cut",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what is the stoer wagner algorithm",
   "global minimum cut of an undirected graph",
   "explain stoer wagner",
   "stoer wagner in python",
   "implement stoer wagner min cut",
   "stoer wagner code",
   "stoer wagner vs max flow min cut",
   "min cut without choosing source and sink"
  ],
  "tags": "stoer wagner global min cut minimum cut undirected weighted graph maximum adjacency ordering contraction",
  "a": "Stoer-Wagner finds the cheapest way to split an undirected weighted graph into two parts, with no source or sink given. Each phase builds a maximum-adjacency ordering; the last vertex t alone is a candidate cut (its weighted degree to the rest), then t is merged into the vertex before it. The best candidate over all phases is the min cut.",
  "code": {
   "py": "def stoer_wagner(n, edges):\n    \"\"\"edges: (u, v, weight), undirected. Returns (cut_weight, one_side_vertices).\"\"\"\n    if n < 2:\n        raise ValueError(\"need at least two vertices\")\n    w = [[0] * n for _ in range(n)]\n    for u, v, c in edges:\n        if u != v:\n            w[u][v] += c\n            w[v][u] += c\n    groups = [[i] for i in range(n)]            # original vertices merged into each super-vertex\n    active = list(range(n))\n    best, best_side = float(\"inf\"), []\n    while len(active) > 1:\n        start = active[0]\n        score = {v: w[start][v] for v in active[1:]}   # connection weight to the growing set\n        s = t = start\n        while score:                                   # maximum adjacency ordering\n            s = t\n            t = max(score, key=score.get)\n            cut_of_phase = score.pop(t)\n            for v in score:\n                score[v] += w[t][v]\n        if cut_of_phase < best:                        # t alone vs everything else\n            best, best_side = cut_of_phase, list(groups[t])\n        groups[s] += groups[t]                         # merge t into s\n        for v in active:\n            if v != s and v != t:\n                w[s][v] += w[t][v]\n                w[v][s] = w[s][v]\n        active.remove(t)\n    return best, sorted(best_side)\n\nprint(stoer_wagner(4, [(0, 1, 3), (1, 2, 1), (2, 3, 3), (3, 0, 1)]))  # (2, [2, 3])"
  },
  "more": "- Key lemma: in each phase the cut separating the last-added vertex t from the rest is a minimum s-t cut for the last two vertices s, t. So either that cut is the global answer, or s and t are on the same side in some optimum and may be merged.\n- Weights must be non-negative.\n- A disconnected graph gives 0.\n- For a small n the O(V^3) matrix form is enough; a heap version gives O(VE + V^2 log V).\n- Alternative for fixed s, t: max flow.",
  "cx": "Time O(V^3) with the matrix and linear max-selection used here; O(V E + V^2 log V) with a heap. Space O(V^2).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute_global_cut(n, edges):\n    best = None\n    for mask in range(1, 1 << (n - 1)):          # vertex n-1 always on the other side\n        c = sum(w for u, v, w in edges if ((mask >> u) & 1) != ((mask >> v) & 1))\n        best = c if best is None else min(best, c)\n    return best\ndef rand_graph(rng, n, m, mx=5):\n    return [(a, b, rng.randint(1, mx)) for a, b in ((rng.randrange(n), rng.randrange(n)) for _ in range(m)) if a != b]\n\nrng = random.Random(12)\nfor _ in range(400):\n    n = rng.randint(2, 7)\n    edges = rand_graph(rng, n, rng.randint(0, 14))\n    val, side = stoer_wagner(n, edges)\n    assert val == brute_global_cut(n, edges), (n, edges)\n    S = set(side)\n    assert 0 < len(S) < n\n    assert sum(c for u, v, c in edges if (u in S) != (v in S)) == val\nassert stoer_wagner(2, [(0, 1, 7)]) == (7, [0]) or stoer_wagner(2, [(0, 1, 7)]) == (7, [1])\nassert stoer_wagner(3, [(0, 1, 2)])[0] == 0"
 },
 {
  "id": "cf-karger-min-cut",
  "title": "Karger's randomized minimum cut",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what is karger's algorithm",
   "randomized min cut algorithm",
   "karger min cut explained",
   "karger algorithm in python",
   "implement karger min cut",
   "karger contraction code",
   "karger vs stoer wagner",
   "edge contraction random min cut"
  ],
  "tags": "karger min cut randomized contraction monte carlo global min cut union find repeated trials karger stein",
  "a": "Karger's algorithm contracts randomly chosen edges until two super-vertices remain; the edges between them form a cut. One trial finds a given min cut with probability at least 2 / (n(n-1)), so repeat about n^2 ln n times and keep the smallest cut found. Monte Carlo: it is only correct with high probability.",
  "code": {
   "py": "import random, math\n\ndef karger_min_cut(n, edges, trials=None, seed=0):\n    \"\"\"edges: (u, v) pairs of an undirected multigraph. Returns the smallest cut size seen.\"\"\"\n    rng = random.Random(seed)\n    if trials is None:\n        trials = max(1, int(n * n * math.log(n + 1)))\n    best = float(\"inf\")\n    for _ in range(trials):\n        parent = list(range(n))\n\n        def find(x):\n            while parent[x] != x:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n\n        comps = n\n        order = edges[:]\n        rng.shuffle(order)                        # a random edge order = random contraction order\n        for u, v in order:\n            if comps == 2:\n                break\n            ru, rv = find(u), find(v)\n            if ru != rv:\n                parent[ru] = rv                   # contract the edge\n                comps -= 1\n        cut = sum(1 for u, v in edges if find(u) != find(v))\n        best = min(best, cut)\n    return best\n\n# two triangles joined by a single bridge edge: min cut is 1\nprint(karger_min_cut(6, [(0, 1), (1, 2), (0, 2), (3, 4), (4, 5), (3, 5), (2, 3)]))  # 1"
  },
  "more": "- The chance a random contraction ever hits an edge of a fixed min cut is small because that cut has few edges compared with the total.\n- Shuffling the edges and contracting in order is equivalent to picking uniform random edges for unweighted multigraphs.\n- Failure probability after n^2 ln n trials is at most about 1/n.\n- A guarantee is only probabilistic; use Stoer-Wagner when you need certainty. Karger-Stein improves the success rate per unit of work.",
  "cx": "One trial costs O(E) after shuffling (almost linear with union-find). About n^2 ln n trials give failure probability <= 1/n, so O(n^2 E log n) total. Space O(V + E).",
  "see": [
   "#/topic/union-find",
   "#/topic/advanced-graphs"
  ],
  "check": "import itertools, random\ndef brute_global_cut(n, edges):\n    best = None\n    for mask in range(1, 1 << (n - 1)):          # vertex n-1 always on the other side\n        c = sum(w for u, v, w in edges if ((mask >> u) & 1) != ((mask >> v) & 1))\n        best = c if best is None else min(best, c)\n    return best\ndef rand_graph(rng, n, m, mx=5):\n    return [(a, b, rng.randint(1, mx)) for a, b in ((rng.randrange(n), rng.randrange(n)) for _ in range(m)) if a != b]\n\nrng = random.Random(13)\nfor _ in range(60):\n    n = rng.randint(2, 7)\n    edges = [(a, b) for a, b, _ in rand_graph(rng, n, rng.randint(1, 14))]\n    expect = brute_global_cut(n, [(a, b, 1) for a, b in edges])\n    got = karger_min_cut(n, edges, trials=400, seed=rng.randrange(10**6))\n    assert got >= expect\n    assert got == expect, (n, edges, got, expect)\nassert karger_min_cut(2, [(0, 1)] * 3, trials=5) == 3"
 },
 {
  "id": "cf-graph-connectivity",
  "title": "Edge connectivity and vertex connectivity",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what is vertex connectivity",
   "how to compute edge connectivity of a graph",
   "k connected graph algorithm",
   "edge connectivity vs vertex connectivity",
   "vertex connectivity with max flow python",
   "minimum vertices to disconnect a graph",
   "menger theorem",
   "how many edge disjoint paths between two vertices"
  ],
  "tags": "edge connectivity vertex connectivity menger theorem k connected disjoint paths node splitting max flow",
  "a": "Edge connectivity is the minimum number of edges whose removal disconnects the graph: the smallest unit-capacity max flow from vertex 0 to every other vertex. Vertex connectivity is the minimum number of vertices to remove: split every vertex into in and out with capacity 1 and take the smallest flow over non-adjacent pairs. Menger: both equal the maximum number of disjoint paths.",
  "code": {
   "py": "from collections import deque\n\ndef _maxflow(n, cap, s, t):\n    flow = 0\n    while True:\n        parent = [-1] * n\n        parent[s] = s\n        q = deque([s])\n        while q and parent[t] == -1:\n            u = q.popleft()\n            for v in range(n):\n                if parent[v] == -1 and cap[u][v] > 0:\n                    parent[v] = u\n                    q.append(v)\n        if parent[t] == -1:\n            return flow\n        b, v = float(\"inf\"), t\n        while v != s:\n            b = min(b, cap[parent[v]][v]); v = parent[v]\n        v = t\n        while v != s:\n            u = parent[v]; cap[u][v] -= b; cap[v][u] += b; v = u\n        flow += b\n\ndef edge_connectivity(n, edges):\n    \"\"\"Simple undirected graph. 0 if disconnected.\"\"\"\n    best = float(\"inf\")\n    for t in range(1, n):\n        cap = [[0] * n for _ in range(n)]\n        for u, v in edges:\n            cap[u][v] = cap[v][u] = 1\n        best = min(best, _maxflow(n, cap, 0, t))\n    return best\n\ndef vertex_connectivity(n, edges):\n    \"\"\"Simple undirected graph. n-1 for a complete graph.\"\"\"\n    adj = [[False] * n for _ in range(n)]\n    for u, v in edges:\n        adj[u][v] = adj[v][u] = True\n    best = n - 1\n    for s in range(n):\n        for t in range(s + 1, n):\n            if adj[s][t]:\n                continue\n            cap = [[0] * (2 * n) for _ in range(2 * n)]      # vertex x -> in = x, out = x + n\n            for x in range(n):\n                cap[x][x + n] = 1 if x not in (s, t) else n\n            for u in range(n):\n                for v in range(n):\n                    if adj[u][v]:\n                        cap[u + n][v] = n\n            best = min(best, _maxflow(2 * n, cap, s + n, t))\n    return best\n\nsquare = [(0, 1), (1, 2), (2, 3), (3, 0)]\nprint(edge_connectivity(4, square), vertex_connectivity(4, square))  # 2 2"
  },
  "more": "- Menger: the min number of edges (vertices) separating s from t equals the max number of edge-disjoint (internally vertex-disjoint) s-t paths.\n- Edge connectivity: some optimal cut separates vertex 0 from some t, so trying every t is enough.\n- Vertex connectivity: only non-adjacent pairs matter (adjacent vertices cannot be separated by removing other vertices); a complete graph has n - 1.\n- Always at most the minimum degree. Stoer-Wagner computes edge connectivity faster.",
  "cx": "Edge connectivity: V max flows, each at most O(V E) augmentations... with this matrix BFS about O(V^4 * deg_min) in practice. Vertex connectivity: O(V^2) flows on 2V vertices, so use only for small graphs. Space O(V^2).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef connected(n, edges, removed=()):\n    alive = [v for v in range(n) if v not in removed]\n    if not alive:\n        return True\n    adj = {v: [] for v in alive}\n    for u, v in edges:\n        if u in adj and v in adj:\n            adj[u].append(v); adj[v].append(u)\n    seen, st = {alive[0]}, [alive[0]]\n    while st:\n        for y in adj[st.pop()]:\n            if y not in seen:\n                seen.add(y); st.append(y)\n    return len(seen) == len(alive)\ndef brute_edge(n, edges):\n    for k in range(len(edges) + 1):\n        for rem in itertools.combinations(range(len(edges)), k):\n            if not connected(n, [e for i, e in enumerate(edges) if i not in rem]):\n                return k\ndef brute_vertex(n, edges):\n    for k in range(n - 1):\n        for rem in itertools.combinations(range(n), k):\n            if n - k >= 2 and not connected(n, edges, rem):\n                return k\n    return n - 1\nrng = random.Random(14)\nfor _ in range(250):\n    n = rng.randint(3, 6)\n    edges = sorted({tuple(sorted((rng.randrange(n), rng.randrange(n)))) for _ in range(rng.randint(0, 12))})\n    edges = [e for e in edges if e[0] != e[1]]\n    assert edge_connectivity(n, edges) == brute_edge(n, edges), (n, edges)\n    assert vertex_connectivity(n, edges) == brute_vertex(n, edges), (n, edges)\nk4 = list(itertools.combinations(range(4), 2))\nassert edge_connectivity(4, k4) == 3 and vertex_connectivity(4, k4) == 3"
 },
 {
  "id": "cf-boruvka",
  "title": "Boruvka's minimum spanning tree",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what is boruvka's algorithm",
   "explain boruvka's mst",
   "boruvka algorithm in python",
   "implement boruvka",
   "boruvka mst code",
   "boruvka vs kruskal vs prim",
   "cheapest edge per component mst",
   "parallel minimum spanning tree algorithm"
  ],
  "tags": "boruvka sollin minimum spanning tree mst components cheapest outgoing edge union find parallel",
  "a": "Boruvka's algorithm builds an MST in rounds: every component picks its cheapest outgoing edge, and all picked edges are added at once, merging components. The number of components at least halves each round, so there are at most log2(V) rounds. It parallelises well. Break ties consistently (weight, then index) or cycles can appear.",
  "code": {
   "py": "def boruvka(n, edges):\n    \"\"\"edges: (u, v, w). Returns (total_weight, chosen_edge_indices) of a minimum spanning forest.\"\"\"\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    total, chosen, comps = 0, [], n\n    while comps > 1:\n        best = [None] * n                                  # cheapest outgoing edge per component root\n        for i, (u, v, w) in enumerate(edges):\n            ru, rv = find(u), find(v)\n            if ru == rv:\n                continue\n            for r in (ru, rv):\n                if best[r] is None or (w, i) < (edges[best[r]][2], best[r]):\n                    best[r] = i\n        picked = {i for i in best if i is not None}\n        if not picked:\n            break                                          # graph is disconnected: we have a forest\n        for i in picked:\n            u, v, w = edges[i]\n            ru, rv = find(u), find(v)\n            if ru != rv:                                   # re-check: an earlier pick may have merged them\n                parent[ru] = rv\n                total += w\n                chosen.append(i)\n                comps -= 1\n    return total, sorted(chosen)\n\nprint(boruvka(4, [(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 4), (0, 2, 5)]))  # (6, [0, 1, 2])"
  },
  "more": "- Cut property: the cheapest edge leaving any component belongs to some MST; with a strict total order on edges it belongs to the unique MST.\n- Tie-breaking by (weight, index) makes the order strict, which prevents cycles among simultaneous picks; the re-check before union is an extra safety net.\n- Disconnected graphs return a spanning forest.\n- Use Kruskal/Prim for ordinary code; reach for Boruvka for parallel/distributed settings or as a building block in faster MST algorithms.",
  "cx": "Time O(E log V) (at most log2 V rounds, each O(E alpha(V))). Space O(V + E).",
  "see": [
   "#/topic/mst",
   "#/topic/union-find",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\ndef kruskal(n, edges):\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]; x = parent[x]\n        return x\n    tot = 0\n    for u, v, w in sorted(edges, key=lambda e: e[2]):\n        a, b = find(u), find(v)\n        if a != b:\n            parent[a] = b; tot += w\n    return tot\nrng = random.Random(15)\nfor _ in range(500):\n    n = rng.randint(1, 9)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 4)) for _ in range(rng.randint(0, 20))]   # many ties\n    tot, ch = boruvka(n, edges)\n    assert tot == kruskal(n, edges), (n, edges)\n    assert tot == sum(edges[i][2] for i in ch)\nassert boruvka(1, []) == (0, [])\nassert boruvka(3, [(0, 1, 2)]) == (2, [0])"
 },
 {
  "id": "cf-prim-dense-fibonacci",
  "title": "Prim's MST for dense graphs (O(V^2)) and the Fibonacci heap bound",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "prim algorithm adjacency matrix",
   "prim without heap",
   "prim o(v^2) implementation",
   "prim fibonacci heap complexity",
   "dense graph minimum spanning tree",
   "prim in python dense graph",
   "prim with array vs heap",
   "fastest prim implementation"
  ],
  "tags": "prim dense graph adjacency matrix o v^2 fibonacci heap decrease key minimum spanning tree array",
  "a": "On a dense graph, skip the heap: keep dist[v] = cheapest edge connecting v to the tree and each step pick the unvisited vertex with the smallest dist by a linear scan. That is O(V^2), better than the heap version when E is near V^2. With a Fibonacci heap the bound becomes O(E + V log V), but binary heaps are faster in practice.",
  "code": {
   "py": "def prim_dense(n, w):\n    \"\"\"w: n x n matrix, w[u][v] = edge weight or None if absent. Returns (total, parent) or None if disconnected.\"\"\"\n    INF = float(\"inf\")\n    dist = [INF] * n\n    parent = [-1] * n\n    used = [False] * n\n    dist[0] = 0\n    total = 0\n    for _ in range(n):\n        v = -1\n        for x in range(n):                           # linear scan replaces the priority queue\n            if not used[x] and (v == -1 or dist[x] < dist[v]):\n                v = x\n        if dist[v] == INF:\n            return None\n        used[v] = True\n        total += dist[v]\n        for to in range(n):\n            if not used[to] and w[v][to] is not None and w[v][to] < dist[to]:\n                dist[to], parent[to] = w[v][to], v\n    return total, parent\n\nM = [[None, 2, 3], [2, None, 1], [3, 1, None]]\nprint(prim_dense(3, M))  # (3, [-1, 0, 1])"
  },
  "more": "- Same invariant as heap Prim: the tree plus the cheapest crossing edge is always inside some MST.\n- Pick the version by density: dense (E ~ V^2) use the O(V^2) scan; sparse use heapq with lazy entries, O(E log V).\n- Fibonacci heaps give O(E + V log V) amortised via O(1) decrease-key, but their large constants rarely pay off; mention the bound, use a binary heap.\n- Zero-weight edges are fine; the start vertex is arbitrary.",
  "cx": "O(V^2) with the array scan; O(E log V) with a binary heap; O(E + V log V) with a Fibonacci heap. Space O(V) beyond the graph.",
  "see": [
   "#/topic/mst",
   "#/cheatsheets/graphs",
   "#/cheatsheets/big-o-algorithms"
  ],
  "check": "import random\ndef kruskal(n, w):\n    es = sorted((w[u][v], u, v) for u in range(n) for v in range(u + 1, n) if w[u][v] is not None)\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]; x = parent[x]\n        return x\n    tot, cnt = 0, 0\n    for c, u, v in es:\n        a, b = find(u), find(v)\n        if a != b:\n            parent[a] = b; tot += c; cnt += 1\n    return tot if cnt == n - 1 else None\nrng = random.Random(16)\nfor _ in range(400):\n    n = rng.randint(1, 8)\n    w = [[None] * n for _ in range(n)]\n    for u in range(n):\n        for v in range(u + 1, n):\n            if rng.random() < 0.5:\n                w[u][v] = w[v][u] = rng.randint(0, 9)\n    got = prim_dense(n, w)\n    exp = kruskal(n, w)\n    assert (got[0] if got else None) == exp, (n, w)\n    if got:\n        assert sum(1 for p in got[1] if p == -1) == 1\nassert prim_dense(2, [[None, None], [None, None]]) is None"
 },
 {
  "id": "cf-second-best-mst",
  "title": "Second-best minimum spanning tree",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "how to find the second best mst",
   "second minimum spanning tree",
   "second best spanning tree algorithm",
   "second mst in python",
   "implement second best minimum spanning tree",
   "second mst code kruskal",
   "next smallest spanning tree",
   "replace one edge in the mst"
  ],
  "tags": "second best mst second minimum spanning tree kruskal edge swap path maximum edge replacement",
  "a": "Build an MST with Kruskal. The second-best tree differs from it by one swap: for each non-tree edge (u, v, w), add it and remove the heaviest edge on the tree path between u and v, giving cost mst - max_on_path + w. The smallest such cost is the second-best weight (it can equal the MST weight when ties exist).",
  "code": {
   "py": "def second_best_mst(n, edges):\n    \"\"\"edges: (u, v, w). Returns (mst_weight, second_best_weight) or None if no spanning tree / no alternative.\"\"\"\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    order = sorted(range(len(edges)), key=lambda i: edges[i][2])\n    in_tree, total = set(), 0\n    adj = [[] for _ in range(n)]\n    for i in order:\n        u, v, w = edges[i]\n        a, b = find(u), find(v)\n        if a != b:\n            parent[a] = b\n            in_tree.add(i)\n            total += w\n            adj[u].append((v, w))\n            adj[v].append((u, w))\n    if len(in_tree) != n - 1:\n        return None\n\n    def max_on_path(src, dst):                       # heaviest edge on the tree path, by iterative DFS\n        stack = [(src, -1, 0)]\n        while stack:\n            x, par, best = stack.pop()\n            if x == dst:\n                return best\n            for y, w in adj[x]:\n                if y != par:\n                    stack.append((y, x, max(best, w)))\n\n    second = None\n    for i, (u, v, w) in enumerate(edges):\n        if i in in_tree or u == v:\n            continue\n        cand = total - max_on_path(u, v) + w\n        if second is None or cand < second:\n            second = cand\n    return None if second is None else (total, second)\n\nprint(second_best_mst(4, [(0, 1, 1), (1, 2, 2), (2, 3, 3), (0, 3, 4), (0, 2, 5)]))  # (6, 7)"
  },
  "more": "- Any spanning tree other than the MST can be turned into the MST by edge swaps, so the best runner-up is exactly one swap away.\n- Equal-weight alternatives count: the answer can equal the MST weight. If you need a strictly larger weight, also track the second-heaviest distinct edge on each path.\n- Trap: removing the wrong edge (not the path maximum) leaves a worse tree.\n- Faster: preprocess max-on-path with binary lifting for O(E log V).",
  "cx": "Time O(E log E) for Kruskal plus O(V) per non-tree edge, so O(V E) here; O(E log V) with binary lifting. Space O(V + E).",
  "see": [
   "#/topic/mst",
   "#/topic/union-find",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute(n, edges):\n    ws = []\n    for combo in itertools.combinations(range(len(edges)), n - 1):\n        parent = list(range(n))\n        def find(x):\n            while parent[x] != x:\n                x = parent[x]\n            return x\n        ok = True\n        for i in combo:\n            a, b = find(edges[i][0]), find(edges[i][1])\n            if a == b:\n                ok = False; break\n            parent[a] = b\n        if ok:\n            ws.append(sum(edges[i][2] for i in combo))\n    ws.sort()\n    return (ws[0], ws[1]) if len(ws) >= 2 else None\nrng = random.Random(17)\nfor _ in range(500):\n    n = rng.randint(2, 6)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 5)) for _ in range(rng.randint(1, 9))]\n    assert second_best_mst(n, edges) == brute(n, edges), (n, edges)\nassert second_best_mst(3, [(0, 1, 1), (1, 2, 1)]) is None"
 },
 {
  "id": "cf-chu-liu-edmonds",
  "title": "Chu-Liu/Edmonds minimum arborescence",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what is the chu liu edmonds algorithm",
   "minimum spanning arborescence",
   "directed minimum spanning tree",
   "chu liu edmonds in python",
   "implement directed mst",
   "minimum arborescence code",
   "directed mst vs undirected mst",
   "edmonds branching algorithm"
  ],
  "tags": "chu liu edmonds minimum arborescence directed minimum spanning tree branching rooted tree cycle contraction directed mst",
  "a": "A minimum arborescence is a cheapest set of directed edges forming a tree where every vertex is reachable from a given root. Chu-Liu/Edmonds: every non-root vertex takes its cheapest incoming edge; if that makes a cycle, contract it (reducing edge weights by the picked edge) and repeat. Kruskal does not work on directed graphs.",
  "code": {
   "py": "def min_arborescence(n, edges, root):\n    \"\"\"edges: (u, v, w) directed u->v. Returns the minimum cost of a spanning arborescence rooted at root, or None.\"\"\"\n    INF = float(\"inf\")\n    cost = 0\n    while True:\n        inw = [INF] * n                          # cheapest incoming edge weight per vertex\n        pre = [0] * n\n        for u, v, w in edges:\n            if u != v and w < inw[v]:\n                inw[v], pre[v] = w, u\n        for v in range(n):\n            if v != root and inw[v] == INF:\n                return None                      # some vertex cannot be reached\n        inw[root] = 0\n        ids = [-1] * n\n        mark = [-1] * n\n        cnt = 0\n        for i in range(n):\n            cost += inw[i]\n            v = i\n            while mark[v] != i and ids[v] == -1 and v != root:\n                mark[v] = i\n                v = pre[v]\n            if v != root and ids[v] == -1:       # found a cycle: give all its members one id\n                u = pre[v]\n                while u != v:\n                    ids[u] = cnt\n                    u = pre[u]\n                ids[v] = cnt\n                cnt += 1\n        if cnt == 0:\n            return cost                          # no cycles: the picked edges are the answer\n        for i in range(n):\n            if ids[i] == -1:\n                ids[i] = cnt\n                cnt += 1\n        edges = [(ids[u], ids[v], w - inw[v]) for u, v, w in edges if ids[u] != ids[v]]\n        n, root = cnt, ids[root]\n\nprint(min_arborescence(4, [(0, 1, 5), (1, 2, 1), (2, 1, 1), (0, 2, 10), (2, 3, 2)], 0))  # 8"
  },
  "more": "- Each non-root vertex needs exactly one parent, so picking its cheapest in-edge is a lower bound; subtracting that weight from all edges entering the vertex lets cycles be solved as a single super-vertex.\n- On expansion, one edge of each contracted cycle is dropped; the cost bookkeeping above already accounts for it.\n- The root is fixed, unlike the undirected MST.\n- This is the simple O(VE) version; Tarjan/Gabow-style heaps give O(E + V log V).",
  "cx": "Time O(V E) (each contraction round is O(E) and removes at least one vertex). Space O(V + E).",
  "see": [
   "#/topic/mst",
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute(n, edges, root):\n    incoming = [[(u, w) for u, v, w in edges if v == x and u != x] for x in range(n)]\n    others = [x for x in range(n) if x != root]\n    if any(not incoming[x] for x in others):\n        return None\n    best = None\n    for pick in itertools.product(*[incoming[x] for x in others]):\n        par = {x: p[0] for x, p in zip(others, pick)}\n        ok = True\n        for x in others:\n            cur, steps = x, 0\n            while cur != root and steps <= n:\n                cur = par[cur]; steps += 1\n            if cur != root:\n                ok = False; break\n        if ok:\n            c = sum(p[1] for p in pick)\n            best = c if best is None else min(best, c)\n    return best\nrng = random.Random(18)\nfor _ in range(600):\n    n = rng.randint(1, 6)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 9)) for _ in range(rng.randint(0, 12))]\n    assert min_arborescence(n, edges, 0) == brute(n, edges, 0), (n, edges)\nassert min_arborescence(1, [], 0) == 0\nassert min_arborescence(2, [(1, 0, 3)], 0) is None"
 },
 {
  "id": "cf-steiner-tree",
  "title": "Steiner tree (Dreyfus-Wagner DP for few terminals)",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what is the steiner tree problem",
   "minimum steiner tree algorithm",
   "steiner tree dp bitmask",
   "steiner tree in python",
   "implement steiner tree",
   "dreyfus wagner algorithm",
   "steiner tree vs minimum spanning tree",
   "connect required nodes with minimum cost"
  ],
  "tags": "steiner tree dreyfus wagner terminals bitmask dp minimum cost connect subset np hard shortest paths",
  "a": "The Steiner tree is the cheapest tree that connects a given set of terminal vertices, and it may use extra non-terminal vertices that an MST of the terminals cannot. It is NP-hard, but a bitmask DP over terminals solves it in O(3^k V + 2^k V^2) with k terminals: dp[mask][v] = cheapest tree joining the terminals in mask and vertex v.",
  "code": {
   "py": "def steiner_tree(n, edges, terminals):\n    \"\"\"edges: (u, v, w) undirected, w >= 0. Returns the minimum Steiner tree weight, or None if disconnected.\"\"\"\n    INF = float(\"inf\")\n    dist = [[INF] * n for _ in range(n)]\n    for i in range(n):\n        dist[i][i] = 0\n    for u, v, w in edges:\n        dist[u][v] = min(dist[u][v], w)\n        dist[v][u] = min(dist[v][u], w)\n    for k in range(n):                                 # Floyd-Warshall: all-pairs shortest paths\n        for i in range(n):\n            for j in range(n):\n                if dist[i][k] + dist[k][j] < dist[i][j]:\n                    dist[i][j] = dist[i][k] + dist[k][j]\n    k = len(terminals)\n    full = (1 << k) - 1\n    dp = [[INF] * n for _ in range(1 << k)]\n    for i, t in enumerate(terminals):\n        dp[1 << i][t] = 0\n    for mask in range(1, full + 1):\n        for v in range(n):                             # merge two trees meeting at v\n            sub = (mask - 1) & mask\n            while sub:\n                dp[mask][v] = min(dp[mask][v], dp[sub][v] + dp[mask ^ sub][v])\n                sub = (sub - 1) & mask\n        old = dp[mask][:]\n        for v in range(n):                             # extend the tree along a shortest path to v\n            dp[mask][v] = min(old[u] + dist[u][v] for u in range(n))\n    best = min(dp[full])\n    return None if best == INF else best\n\n# star with centre 3: connecting 0, 1, 2 through vertex 3 costs 3; direct edges cost 4 each\nprint(steiner_tree(4, [(0, 3, 1), (1, 3, 1), (2, 3, 1), (0, 1, 4), (1, 2, 4)], [0, 1, 2]))  # 3"
  },
  "more": "- Optimal Steiner trees have a branching structure: either the terminal set splits at some vertex (the subset-merge step) or the tree is just a path (the shortest-path extension step).\n- If all vertices are terminals this is just an MST; with few terminals, extra vertices can lower the cost.\n- Exponential in the number of terminals only; fine for k up to about 10 to 15.\n- A cheap 2-approximation: MST of the metric closure on the terminals.",
  "cx": "Time O(3^k V + 2^k V^2 + V^3) with k terminals (the V^3 is Floyd-Warshall; the shortest-path relaxation step could use Dijkstra instead). Space O(2^k V + V^2).",
  "see": [
   "#/topic/bitmask-dp",
   "#/topic/mst",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef mst_induced(vs, edges):\n    vs = sorted(vs)\n    parent = {v: v for v in vs}\n    def find(x):\n        while parent[x] != x:\n            x = parent[x]\n        return x\n    tot, cnt = 0, 0\n    for u, v, w in sorted(edges, key=lambda e: e[2]):\n        if u in parent and v in parent:\n            a, b = find(u), find(v)\n            if a != b:\n                parent[a] = b; tot += w; cnt += 1\n    return tot if cnt == len(vs) - 1 else None\ndef brute(n, edges, terms):\n    best = None\n    others = [v for v in range(n) if v not in terms]\n    for r in range(len(others) + 1):\n        for extra in itertools.combinations(others, r):\n            c = mst_induced(set(terms) | set(extra), edges)\n            if c is not None and (best is None or c < best):\n                best = c\n    return best\nrng = random.Random(19)\nfor _ in range(300):\n    n = rng.randint(2, 7)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(0, 6)) for _ in range(rng.randint(0, 14))]\n    edges = [e for e in edges if e[0] != e[1]]\n    terms = rng.sample(range(n), rng.randint(1, min(4, n)))\n    assert steiner_tree(n, edges, terms) == brute(n, edges, terms), (n, edges, terms)\nassert steiner_tree(3, [(0, 1, 1)], [0, 2]) is None\nassert steiner_tree(3, [(0, 1, 1)], [0]) == 0"
 },
 {
  "id": "cf-two-sat",
  "title": "2-SAT solved with strongly connected components",
  "cat": "Graphs: other",
  "q": [
   "what is 2 sat",
   "how to solve 2 sat",
   "2 sat with scc",
   "2 sat in python",
   "implement 2 sat",
   "2sat code implication graph",
   "2 sat vs 3 sat",
   "satisfiability of clauses with two literals"
  ],
  "tags": "2 sat 2sat satisfiability implication graph scc strongly connected components boolean clauses kosaraju",
  "a": "Each clause (a or b) becomes two implications: not a -> b and not b -> a. Build that implication graph over 2n literals and find SCCs. If a variable and its negation share an SCC the formula is unsatisfiable; otherwise set x true when its SCC comes later in topological order than not-x. It runs in linear time.",
  "code": {
   "py": "def two_sat(n, clauses):\n    \"\"\"Variables 1..n; a clause (a, b) means (a or b) with literals +x or -x.\n    Returns a list of n booleans, or None if unsatisfiable.\"\"\"\n    def node(lit):\n        return 2 * (lit - 1) if lit > 0 else 2 * (-lit - 1) + 1       # x -> 2(x-1), not x -> 2(x-1)+1\n\n    N = 2 * n\n    g = [[] for _ in range(N)]\n    rg = [[] for _ in range(N)]\n    for a, b in clauses:\n        for x, y in ((node(a) ^ 1, node(b)), (node(b) ^ 1, node(a))):  # not a -> b, not b -> a\n            g[x].append(y)\n            rg[y].append(x)\n    seen, order = [False] * N, []\n    for s in range(N):                                                  # Kosaraju pass 1 (iterative DFS)\n        if seen[s]:\n            continue\n        seen[s] = True\n        stack = [(s, 0)]\n        while stack:\n            u, i = stack.pop()\n            if i < len(g[u]):\n                stack.append((u, i + 1))\n                v = g[u][i]\n                if not seen[v]:\n                    seen[v] = True\n                    stack.append((v, 0))\n            else:\n                order.append(u)\n    comp, c = [-1] * N, 0\n    for s in reversed(order):                                           # pass 2 on the reversed graph\n        if comp[s] != -1:\n            continue\n        comp[s] = c\n        stack = [s]\n        while stack:\n            u = stack.pop()\n            for v in rg[u]:\n                if comp[v] == -1:\n                    comp[v] = c\n                    stack.append(v)\n        c += 1                                                          # components come out in topological order\n    result = []\n    for x in range(n):\n        if comp[2 * x] == comp[2 * x + 1]:\n            return None\n        result.append(comp[2 * x] > comp[2 * x + 1])                    # pick the literal later in topological order\n    return result\n\nprint(two_sat(2, [(1, 2), (-1, 2), (1, -2)]))   # [True, True]\nprint(two_sat(1, [(1, 1), (-1, -1)]))           # None"
  },
  "more": "- Why it works: the graph is skew-symmetric (a->b implies not b -> not a), so the SCC order is consistent; choosing the later literal never forces a contradiction.\n- A unit clause (a) is written as (a, a).\n- Trap: the literal numbering must make `node ^ 1` the negation.\n- 3-SAT is NP-complete, so this trick does not extend; typical uses are exclusive-choice constraints, \"each item picks one of two options\".",
  "cx": "Time O(n + m) for n variables and m clauses (graph has 2n nodes and 2m edges). Space O(n + m).",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef holds(assign, clauses):\n    val = lambda l: assign[abs(l) - 1] == (l > 0)\n    return all(val(a) or val(b) for a, b in clauses)\nrng = random.Random(20)\nfor _ in range(1000):\n    n = rng.randint(1, 5)\n    clauses = [(rng.choice([-1, 1]) * rng.randint(1, n), rng.choice([-1, 1]) * rng.randint(1, n)) for _ in range(rng.randint(0, 9))]\n    got = two_sat(n, clauses)\n    sat = any(holds(a, clauses) for a in itertools.product([False, True], repeat=n))\n    assert (got is not None) == sat, (n, clauses)\n    if got is not None:\n        assert holds(got, clauses)\nassert two_sat(2, []) is not None"
 },
 {
  "id": "cf-biconnected-block-cut-tree",
  "title": "Biconnected components, articulation points and the block-cut tree",
  "cat": "Graphs: spanning trees and connectivity",
  "q": [
   "what are biconnected components",
   "how to find biconnected components",
   "block cut tree",
   "biconnected components in python",
   "implement block cut tree",
   "articulation points and blocks code",
   "which vertices must every path between a and b pass through",
   "bcc tarjan edge stack"
  ],
  "tags": "biconnected components bcc blocks articulation points cut vertices block cut tree tarjan edge stack 2 connected",
  "a": "A biconnected component (block) is a maximal subgraph with no cut vertex. Run a DFS with low-link values and an edge stack: whenever a child v of u has low[v] >= disc[u], pop edges down to (u, v) as one block and mark u as an articulation point. Joining each vertex to its blocks gives a tree (the block-cut tree) that answers which vertices separate a from b.",
  "code": {
   "py": "import sys\n\ndef biconnected(n, edges):\n    \"\"\"Returns (cut_vertices, blocks) where each block is a sorted list of vertices. Multi-edges allowed.\"\"\"\n    sys.setrecursionlimit(10000)\n    adj = [[] for _ in range(n)]\n    for i, (u, v) in enumerate(edges):\n        adj[u].append((v, i))\n        adj[v].append((u, i))\n    disc, low = [-1] * n, [0] * n\n    timer = [0]\n    stack, blocks, cuts = [], [], set()\n\n    def dfs(u, parent_edge):\n        disc[u] = low[u] = timer[0]\n        timer[0] += 1\n        children = 0\n        for v, i in adj[u]:\n            if i == parent_edge:\n                continue\n            if disc[v] == -1:\n                children += 1\n                stack.append(i)\n                dfs(v, i)\n                low[u] = min(low[u], low[v])\n                if low[v] >= disc[u]:                  # u separates v's subtree: pop a block\n                    if parent_edge != -1 or children > 1:\n                        cuts.add(u)\n                    block = set()\n                    while True:\n                        j = stack.pop()\n                        block.update(edges[j])\n                        if j == i:\n                            break\n                    blocks.append(sorted(block))\n            elif disc[v] < disc[u]:                    # back edge\n                stack.append(i)\n                low[u] = min(low[u], disc[v])\n\n    for s in range(n):\n        if disc[s] == -1:\n            dfs(s, -1)\n    return sorted(cuts), sorted(blocks)\n\ndef separating_vertices(n, edges, a, b):\n    \"\"\"Vertices (other than a, b) whose removal disconnects a from b, via the block-cut tree. Graph must be connected.\"\"\"\n    _, blocks = biconnected(n, edges)\n    tree = [[] for _ in range(n + len(blocks))]        # vertices 0..n-1, then one node per block\n    for k, blk in enumerate(blocks):\n        for v in blk:\n            tree[v].append(n + k)\n            tree[n + k].append(v)\n    prev, stack = {a: None}, [a]\n    while stack:\n        x = stack.pop()\n        for y in tree[x]:\n            if y not in prev:\n                prev[y] = x\n                stack.append(y)\n    path, x = [], b\n    while x is not None:\n        path.append(x)\n        x = prev[x]\n    return sorted(v for v in path if v < n and v not in (a, b))\n\nE = [(0, 1), (1, 2), (2, 0), (1, 3), (3, 4), (4, 5), (5, 3)]\nprint(biconnected(6, E))              # ([1, 3], [[0, 1, 2], [1, 3], [3, 4, 5]])\nprint(separating_vertices(6, E, 0, 5))  # [1, 3]"
  },
  "more": "- low[v] >= disc[u] means v's subtree cannot reach above u without going through u, so u is an articulation point and the edges on the stack form one block.\n- The root is a cut vertex only when it has two or more DFS children.\n- Every edge is in exactly one block; a bridge is a block with a single edge.\n- Blocks share only cut vertices. The tree of vertices and blocks lets you answer \"must every route pass through x?\" by reading the path.\n- Skip the parent by edge id, not by vertex, to handle parallel edges.",
  "cx": "Time O(V + E), space O(V + E). Recursive DFS: depth up to V, so raise the recursion limit or iterate for large graphs.",
  "see": [
   "#/topic/advanced-graphs",
   "#/problem/1192",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\ndef comps(n, edges, removed=None):\n    adj = {v: [] for v in range(n) if v != removed}\n    for u, v in edges:\n        if u in adj and v in adj:\n            adj[u].append(v); adj[v].append(u)\n    seen, c = set(), 0\n    for s in adj:\n        if s not in seen:\n            c += 1\n            seen.add(s); st = [s]\n            while st:\n                for y in adj[st.pop()]:\n                    if y not in seen:\n                        seen.add(y); st.append(y)\n    return c\ndef reach(n, edges, a, b, removed):\n    adj = {v: [] for v in range(n) if v != removed}\n    for u, v in edges:\n        if u in adj and v in adj:\n            adj[u].append(v); adj[v].append(u)\n    seen, st = {a}, [a]\n    while st:\n        for y in adj[st.pop()]:\n            if y not in seen:\n                seen.add(y); st.append(y)\n    return b in seen\nrng = random.Random(21)\nfor _ in range(400):\n    n = rng.randint(2, 8)\n    edges = [(rng.randrange(i), i) for i in range(1, n)]               # random tree keeps it connected\n    edges += [(rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 5))]\n    edges = [e for e in edges if e[0] != e[1]]\n    cuts, blocks = biconnected(n, edges)\n    base = comps(n, edges)\n    assert cuts == [v for v in range(n) if comps(n, edges, v) > base], (n, edges)\n    assert sum(len(b) - 1 for b in blocks) == n - base                   # block-cut forest identity\n    for v in range(n):\n        assert (sum(v in b for b in blocks) >= 2) == (v in cuts)\n    a, b = rng.sample(range(n), 2)\n    exp = [v for v in range(n) if v not in (a, b) and not reach(n, edges, a, b, v)]\n    assert separating_vertices(n, edges, a, b) == exp, (n, edges, a, b)\nassert biconnected(1, []) == ([], [])\nassert biconnected(3, [(0, 1), (1, 2)]) == ([1], [[0, 1], [1, 2]])"
 },
 {
  "id": "cf-dominator-tree",
  "title": "Dominator tree (flow graphs)",
  "cat": "Graphs: other",
  "q": [
   "what is a dominator tree",
   "what does it mean for a node to dominate another",
   "how to compute dominators",
   "dominator tree in python",
   "immediate dominator algorithm",
   "implement dominators",
   "dominators vs articulation points",
   "cooper harvey kennedy dominators"
  ],
  "tags": "dominator tree dominators immediate dominator idom flow graph control flow graph compiler dataflow lengauer tarjan",
  "a": "In a directed graph with a root, vertex d dominates v if every path from the root to v passes through d. The immediate dominator (idom) is the closest strict dominator, and the idoms form a tree. The simple method iterates dom(v) = {v} plus the intersection of dom(p) over all predecessors p until nothing changes.",
  "code": {
   "py": "from collections import deque\n\ndef dominators(n, edges, root):\n    \"\"\"Returns (dom, idom): dom[v] = set of dominators of v (reachable vertices only), idom[v] = immediate dominator (root: None).\"\"\"\n    succ = [[] for _ in range(n)]\n    pred = [[] for _ in range(n)]\n    for u, v in edges:\n        succ[u].append(v)\n        pred[v].append(u)\n    order, seen, q = [], {root}, deque([root])         # BFS order of reachable vertices\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in succ[u]:\n            if v not in seen:\n                seen.add(v)\n                q.append(v)\n    dom = {v: set(order) for v in order}               # start by assuming everything dominates everything\n    dom[root] = {root}\n    changed = True\n    while changed:\n        changed = False\n        for v in order[1:]:\n            new = set.intersection(*(dom[p] for p in pred[v] if p in seen)) | {v}\n            if new != dom[v]:\n                dom[v] = new\n                changed = True\n    idom = {root: None}\n    for v in order[1:]:\n        idom[v] = max(dom[v] - {v}, key=lambda d: len(dom[d]))   # the strict dominator with the most dominators itself\n    return dom, idom\n\n#   0 -> 1 -> 3,  0 -> 2 -> 3 : only 0 dominates 3\ndom, idom = dominators(4, [(0, 1), (0, 2), (1, 3), (2, 3)], 0)\nprint(idom)  # {0: None, 1: 0, 2: 0, 3: 0}"
  },
  "more": "- Dominators are the \"must-pass\" vertices of a flow graph; they power SSA construction and loop detection in compilers.\n- Every strict dominator of v also dominates idom(v), which is why picking the one with the largest dominator set finds idom.\n- Unreachable vertices have no dominators (dropped here).\n- The set iteration is simple but O(V^2) per round in the worst case; Cooper-Harvey-Kennedy and Lengauer-Tarjan are the practical versions.",
  "cx": "Set-based iteration: O(V^2 * E) worst case, usually a few rounds with BFS order. Lengauer-Tarjan: O(E log V) (or near-linear). Space O(V^2) for the sets.",
  "see": [
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\ndef reachable(n, edges, root, banned=None):\n    if root == banned:\n        return set()\n    succ = [[] for _ in range(n)]\n    for u, v in edges:\n        succ[u].append(v)\n    seen, st = {root}, [root]\n    while st:\n        for y in succ[st.pop()]:\n            if y != banned and y not in seen:\n                seen.add(y); st.append(y)\n    return seen\nrng = random.Random(22)\nfor _ in range(500):\n    n = rng.randint(1, 8)\n    edges = [(rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 14))]\n    dom, idom = dominators(n, edges, 0)\n    base = reachable(n, edges, 0)\n    assert set(dom) == base\n    for v in base:\n        brute = {d for d in base if d == v or v not in reachable(n, edges, 0, banned=d)}\n        assert dom[v] == brute, (n, edges, v)\n        if v != 0:\n            assert idom[v] in dom[v] and idom[v] != v\n            assert dom[v] == dom[idom[v]] | {v}                  # the idoms form a tree\nd, i = dominators(1, [], 0)\nassert d == {0: {0}} and i == {0: None}"
 },
 {
  "id": "cf-lex-smallest-topological-order",
  "title": "Lexicographically smallest topological order",
  "cat": "Graphs: other",
  "q": [
   "lexicographically smallest topological sort",
   "topological sort with min heap",
   "smallest topological order python",
   "topological order with tie breaking",
   "implement lexicographic topological sort",
   "lexicographically smallest topological ordering code",
   "kahn with priority queue",
   "smallest label for vertex 1 topological labeling"
  ],
  "tags": "lexicographically smallest topological sort priority queue heap kahn tie breaking dag ordering labels",
  "a": "Run Kahn's algorithm but keep the ready vertices (in-degree 0) in a min-heap instead of a plain queue, so you always emit the smallest available vertex. That yields the lexicographically smallest topological order. For \"give vertex 1 the smallest label\" style problems, reverse the edges, always take the largest ready vertex, and assign labels from n down to 1.",
  "code": {
   "py": "import heapq\n\ndef lex_smallest_toposort(n, edges):\n    \"\"\"Returns the lexicographically smallest topological order, or None if there is a cycle.\"\"\"\n    adj = [[] for _ in range(n)]\n    indeg = [0] * n\n    for u, v in edges:\n        adj[u].append(v)\n        indeg[v] += 1\n    heap = [v for v in range(n) if indeg[v] == 0]\n    heapq.heapify(heap)\n    order = []\n    while heap:\n        u = heapq.heappop(heap)                  # smallest ready vertex\n        order.append(u)\n        for v in adj[u]:\n            indeg[v] -= 1\n            if indeg[v] == 0:\n                heapq.heappush(heap, v)\n    return order if len(order) == n else None\n\ndef min_label_assignment(n, edges):\n    \"\"\"Labels 1..n with label[u] < label[v] for every edge u->v, such that label[0], label[1], ... is lexicographically smallest.\"\"\"\n    radj = [[] for _ in range(n)]\n    outdeg = [0] * n\n    for u, v in edges:\n        radj[v].append(u)\n        outdeg[u] += 1\n    heap = [-v for v in range(n) if outdeg[v] == 0]      # max-heap via negation\n    heapq.heapify(heap)\n    label, cur = [0] * n, n\n    while heap:\n        v = -heapq.heappop(heap)\n        label[v] = cur\n        cur -= 1\n        for u in radj[v]:\n            outdeg[u] -= 1\n            if outdeg[u] == 0:\n                heapq.heappush(heap, -u)\n    return label if cur == 0 else None\n\nprint(lex_smallest_toposort(4, [(3, 0), (1, 2)]))   # [1, 2, 3, 0]"
  },
  "more": "- A plain heap-based Kahn is correct because any ready vertex can go next; choosing the smallest each time is the greedy lexicographic choice and never blocks later vertices.\n- Trap: \"smallest label to vertex 1, then vertex 2...\" is a different goal. Greedy forward order does not solve it; the reversed, largest-first method does.\n- Cycle detection comes for free: fewer than n outputs means a cycle.\n- Same pattern for course order with ties (LeetCode 210 style).",
  "cx": "Time O((V + E) log V), space O(V + E).",
  "see": [
   "#/topic/topo-sort",
   "#/problem/210",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\nrng = random.Random(23)\nfor _ in range(500):\n    n = rng.randint(1, 6)\n    edges = [(rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 8))]\n    valid = [p for p in itertools.permutations(range(n)) if all(p.index(u) < p.index(v) for u, v in edges)]\n    got = lex_smallest_toposort(n, edges)\n    assert (got is None) == (not valid), (n, edges)\n    if valid:\n        assert tuple(got) == min(valid)\n        lab = min_label_assignment(n, edges)\n        labelings = [l for l in itertools.permutations(range(1, n + 1)) if all(l[u] < l[v] for u, v in edges)]\n        assert tuple(lab) == min(labelings), (n, edges)\nassert lex_smallest_toposort(2, [(0, 1), (1, 0)]) is None"
 },
 {
  "id": "cf-count-paths-dag",
  "title": "Count paths in a DAG",
  "cat": "Graphs: other",
  "q": [
   "how to count paths in a dag",
   "number of paths from s to t in a directed acyclic graph",
   "count paths dag dynamic programming",
   "count paths in dag python",
   "implement path counting on a dag",
   "dag path count modulo",
   "number of ways to reach a node dag",
   "count all paths topological order dp"
  ],
  "tags": "count paths dag directed acyclic graph dp topological order number of ways modulo path counting memoization",
  "a": "In a DAG, number of paths from s to v = the sum of paths from s to each predecessor of v. Process vertices in topological order (Kahn), starting with ways[s] = 1, and add ways[u] to ways[v] for every edge u->v. It runs in linear time and works with a modulus; with a cycle the count may be infinite, so detect and reject it.",
  "code": {
   "py": "from collections import deque\n\ndef count_paths(n, edges, s, t, mod=None):\n    \"\"\"Number of distinct s->t paths in a DAG (parallel edges count separately).\"\"\"\n    adj = [[] for _ in range(n)]\n    indeg = [0] * n\n    for u, v in edges:\n        adj[u].append(v)\n        indeg[v] += 1\n    q = deque(v for v in range(n) if indeg[v] == 0)\n    ways = [0] * n\n    ways[s] = 1\n    seen = 0\n    while q:\n        u = q.popleft()\n        seen += 1\n        for v in adj[u]:\n            ways[v] += ways[u]\n            if mod:\n                ways[v] %= mod\n            indeg[v] -= 1\n            if indeg[v] == 0:\n                q.append(v)\n    if seen != n:\n        raise ValueError(\"graph has a cycle\")\n    return ways[t]\n\n# diamond 0 -> {1, 2} -> 3 has two paths\nprint(count_paths(4, [(0, 1), (0, 2), (1, 3), (2, 3)], 0, 3))  # 2"
  },
  "more": "- Each path to v ends with some last edge u->v, and every path to u extends uniquely, so the sum over predecessors counts each path exactly once.\n- Initialise only the source with 1; counting from a vertex that is not reachable stays 0.\n- Take the modulus at every addition when counts blow up (Python ints are exact but slow when huge).\n- Counting paths with exactly k edges needs an extra dimension: ways[k][v].",
  "cx": "Time O(V + E), space O(V + E). Brute-force enumeration is exponential.",
  "see": [
   "#/topic/topo-sort",
   "#/topic/dp-2d",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\ndef brute(n, edges, s, t):\n    adj = [[] for _ in range(n)]\n    for u, v in edges:\n        adj[u].append(v)\n    def go(u):\n        return 1 if u == t else sum(go(v) for v in adj[u])\n    return go(s)\nrng = random.Random(24)\nfor _ in range(500):\n    n = rng.randint(1, 7)\n    edges = [(a, b) for a, b in ((rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 14))) if a < b]   # a < b makes it a DAG\n    s, t = rng.randrange(n), rng.randrange(n)\n    assert count_paths(n, edges, s, t) == brute(n, edges, s, t), (n, edges, s, t)\nassert count_paths(3, [(0, 1), (1, 2), (0, 2)], 0, 2) == 2\nassert count_paths(1, [], 0, 0) == 1\ntry:\n    count_paths(2, [(0, 1), (1, 0)], 0, 1)\n    assert False\nexcept ValueError:\n    pass\nbig = [(i, i + 1) for i in range(60)] + [(i, i + 2) for i in range(59)]\nassert count_paths(61, big, 0, 60, mod=10**9 + 7) == count_paths(61, big, 0, 60) % (10**9 + 7)"
 },
 {
  "id": "cf-kirchhoff-spanning-trees",
  "title": "Counting spanning trees (Kirchhoff's matrix-tree theorem)",
  "cat": "Graphs: other",
  "q": [
   "how many spanning trees does a graph have",
   "kirchhoff's matrix tree theorem",
   "count spanning trees with determinant",
   "count spanning trees python",
   "implement matrix tree theorem",
   "laplacian matrix determinant spanning trees",
   "cayley formula k n",
   "number of spanning trees of a multigraph"
  ],
  "tags": "kirchhoff matrix tree theorem laplacian determinant count spanning trees fractions cayley formula gaussian elimination",
  "a": "Build the Laplacian L (degree on the diagonal, minus the number of edges between u and v off the diagonal). Delete any one row and the same column; the determinant of the remaining (n-1) x (n-1) matrix is the number of spanning trees. Use exact Fraction arithmetic in Gaussian elimination to avoid float error.",
  "code": {
   "py": "from fractions import Fraction\n\ndef count_spanning_trees(n, edges):\n    \"\"\"Undirected multigraph edges (u, v). Self-loops are ignored. Returns an int.\"\"\"\n    if n == 1:\n        return 1\n    L = [[Fraction(0)] * n for _ in range(n)]\n    for u, v in edges:\n        if u != v:\n            L[u][u] += 1\n            L[v][v] += 1\n            L[u][v] -= 1\n            L[v][u] -= 1\n    M = [row[:-1] for row in L[:-1]]               # drop the last row and column\n    m = n - 1\n    det = Fraction(1)\n    for c in range(m):\n        piv = next((r for r in range(c, m) if M[r][c] != 0), None)\n        if piv is None:\n            return 0                                # singular: the graph is disconnected\n        if piv != c:\n            M[c], M[piv] = M[piv], M[c]\n            det = -det\n        det *= M[c][c]\n        for r in range(c + 1, m):\n            f = M[r][c] / M[c][c]\n            if f:\n                for k in range(c, m):\n                    M[r][k] -= f * M[c][k]\n    return int(det)\n\nK4 = [(a, b) for a in range(4) for b in range(a + 1, 4)]\nprint(count_spanning_trees(4, K4))  # 16"
  },
  "more": "- Parallel edges multiply the count (each choice is a different tree); self-loops never appear in a tree.\n- Result is 0 for a disconnected graph (the minor is singular).\n- With Fractions the determinant is exact; with a modulus, do elimination in a prime field instead.\n- Weighted version: use weights in the Laplacian to sum the product of edge weights over all trees.\n- Brute-force enumeration is exponential; this is O(n^3).",
  "cx": "Time O(n^3) field operations (with Fractions the numbers grow, so real cost is higher; use a modular determinant for large n). Space O(n^2).",
  "see": [
   "#/topic/math",
   "#/topic/mst",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef brute(n, edges):\n    cnt = 0\n    for combo in itertools.combinations(range(len(edges)), n - 1):\n        parent = list(range(n))\n        def find(x):\n            while parent[x] != x:\n                x = parent[x]\n            return x\n        ok = True\n        for i in combo:\n            a, b = find(edges[i][0]), find(edges[i][1])\n            if a == b:\n                ok = False; break\n            parent[a] = b\n        cnt += ok\n    return cnt\nrng = random.Random(25)\nfor _ in range(400):\n    n = rng.randint(1, 6)\n    edges = [(rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 9))]\n    assert count_spanning_trees(n, edges) == brute(n, [e for e in edges if e[0] != e[1]]), (n, edges)\nfor k in range(2, 7):                                      # Cayley: n^(n-2)\n    assert count_spanning_trees(k, [(a, b) for a in range(k) for b in range(a + 1, k)]) == k ** (k - 2)\nassert count_spanning_trees(5, [(i, (i + 1) % 5) for i in range(5)]) == 5"
 },
 {
  "id": "cf-chinese-postman",
  "title": "Chinese postman problem (route inspection)",
  "cat": "Graphs: other",
  "q": [
   "what is the chinese postman problem",
   "route inspection problem",
   "shortest route that covers every edge",
   "chinese postman in python",
   "implement chinese postman",
   "chinese postman algorithm odd degree vertices",
   "chinese postman vs euler circuit",
   "minimum walk traversing all edges"
  ],
  "tags": "chinese postman route inspection euler circuit odd degree vertices minimum weight perfect matching bitmask dp shortest path",
  "a": "The Chinese postman problem asks for the shortest closed walk that uses every edge at least once. If every vertex has even degree, it is just the sum of edge weights (an Euler circuit). Otherwise pair up the odd-degree vertices with minimum total shortest-path distance (bitmask DP) and add that cost: those paths are the edges walked twice.",
  "code": {
   "py": "def chinese_postman(n, edges):\n    \"\"\"edges: (u, v, w), undirected, graph connected (on its edges). Returns the minimum closed-walk length.\"\"\"\n    INF = float(\"inf\")\n    dist = [[INF] * n for _ in range(n)]\n    for i in range(n):\n        dist[i][i] = 0\n    deg = [0] * n\n    total = 0\n    for u, v, w in edges:\n        total += w\n        deg[u] += 1\n        deg[v] += 1\n        dist[u][v] = min(dist[u][v], w)\n        dist[v][u] = min(dist[v][u], w)\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                if dist[i][k] + dist[k][j] < dist[i][j]:\n                    dist[i][j] = dist[i][k] + dist[k][j]\n    odd = [v for v in range(n) if deg[v] % 2]\n    m = len(odd)\n    best = [INF] * (1 << m)                           # best[mask] = cheapest way to pair up the odd vertices in mask\n    best[0] = 0\n    for mask in range(1 << m):\n        if best[mask] == INF:\n            continue\n        i = 0\n        while i < m and (mask >> i) & 1:              # lowest unpaired odd vertex\n            i += 1\n        if i == m:\n            continue\n        for j in range(i + 1, m):\n            if not (mask >> j) & 1:\n                nm = mask | (1 << i) | (1 << j)\n                best[nm] = min(best[nm], best[mask] + dist[odd[i]][odd[j]])\n    return total + best[(1 << m) - 1]\n\nK4 = [(a, b, 1) for a in range(4) for b in range(a + 1, 4)]\nprint(chinese_postman(4, K4))  # 8: six edges plus two repeated ones"
  },
  "more": "- A closed walk uses each edge as many times as it is traversed, and a graph whose degrees are all even has an Euler circuit; duplicating edges to fix odd degrees at least cost is the whole problem.\n- Duplicates should follow shortest paths between paired odd vertices (hence Floyd-Warshall).\n- Number of odd-degree vertices is always even.\n- The bitmask matching is exponential in odd vertices; for larger inputs use weighted blossom matching.\n- Directed version is a min-cost flow problem.",
  "cx": "Time O(V^3 + 2^k k) where k = number of odd-degree vertices (k <= V); space O(V^2 + 2^k).",
  "see": [
   "#/topic/bitmask-dp",
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef connected_edges(n, edges):\n    verts = {v for e in edges for v in e[:2]}\n    if not verts:\n        return True\n    parent = {v: v for v in verts}\n    def find(x):\n        while parent[x] != x:\n            x = parent[x]\n        return x\n    for u, v, w in edges:\n        parent[find(u)] = find(v)\n    return len({find(v) for v in verts}) == 1\ndef brute(n, edges):\n    best = float(\"inf\")\n    for dup in itertools.product([0, 1], repeat=len(edges)):      # duplicating an edge more than once never helps\n        deg = [0] * n\n        cost = 0\n        for (u, v, w), d in zip(edges, dup):\n            deg[u] += 1 + d; deg[v] += 1 + d\n            cost += w * (1 + d)\n        if all(x % 2 == 0 for x in deg):\n            best = min(best, cost)\n    return best\nrng = random.Random(26)\ndone = 0\nwhile done < 300:\n    n = rng.randint(2, 6)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 6)) for _ in range(rng.randint(1, 8))]\n    edges = [e for e in edges if e[0] != e[1]]\n    if not edges or not connected_edges(n, edges):\n        continue\n    done += 1\n    assert chinese_postman(n, edges) == brute(n, edges), (n, edges)\nassert chinese_postman(3, [(0, 1, 2), (1, 2, 3), (2, 0, 4)]) == 9          # already Eulerian\nassert chinese_postman(3, [(0, 1, 5), (1, 2, 5)]) == 20                    # path: walk it twice"
 },
 {
  "id": "cf-hamiltonian-path-cycle",
  "title": "Hamiltonian path and cycle (backtracking and bitmask DP)",
  "cat": "Graphs: other",
  "q": [
   "what is a hamiltonian path",
   "how to find a hamiltonian cycle",
   "hamiltonian path backtracking python",
   "hamiltonian cycle bitmask dp",
   "implement hamiltonian path",
   "hamiltonian path vs eulerian path",
   "visit every vertex exactly once",
   "check if a graph has a hamiltonian cycle"
  ],
  "tags": "hamiltonian path hamiltonian cycle backtracking bitmask dp visit every vertex once np complete permutations",
  "a": "A Hamiltonian path visits every vertex exactly once (a cycle also returns to the start). It is NP-complete, so there is no known polynomial algorithm. Backtracking finds a path and works for roughly n <= 15-20; the bitmask DP reachable[mask] = set of possible end vertices decides existence in O(2^n n^2) and handles n around 20-22.",
  "code": {
   "py": "def hamiltonian_path(n, adj):\n    \"\"\"Backtracking. adj[u] = iterable of neighbours. Returns a list of vertices or None.\"\"\"\n    path = []\n    used = [False] * n\n\n    def go(u):\n        path.append(u)\n        used[u] = True\n        if len(path) == n:\n            return True\n        for v in adj[u]:\n            if not used[v] and go(v):\n                return True\n        path.pop()\n        used[u] = False\n        return False\n\n    for s in range(n):\n        if go(s):\n            return path\n    return None\n\ndef has_hamiltonian_path(n, adj):\n    \"\"\"Bitmask DP: end[mask] = bitmask of vertices that can end a path visiting exactly the vertices in mask.\"\"\"\n    end = [0] * (1 << n)\n    for v in range(n):\n        end[1 << v] = 1 << v\n    for mask in range(1, 1 << n):\n        e = end[mask]\n        if not e:\n            continue\n        for u in range(n):\n            if (e >> u) & 1:\n                for v in adj[u]:\n                    if not (mask >> v) & 1:\n                        end[mask | (1 << v)] |= 1 << v\n    return end[(1 << n) - 1] != 0\n\ndef has_hamiltonian_cycle(n, adj):\n    \"\"\"Fix vertex 0 as the start. Needs n >= 3.\"\"\"\n    end = [0] * (1 << n)\n    end[1] = 1\n    for mask in range(1, 1 << n, 2):                  # only masks containing vertex 0\n        e = end[mask]\n        for u in range(n):\n            if (e >> u) & 1:\n                for v in adj[u]:\n                    if not (mask >> v) & 1:\n                        end[mask | (1 << v)] |= 1 << v\n    return any((end[(1 << n) - 1] >> u) & 1 and 0 in adj[u] for u in range(1, n))\n\nsquare_with_diag = [[1, 3, 2], [0, 2], [1, 3, 0], [2, 0]]\nprint(hamiltonian_path(4, square_with_diag))        # [0, 1, 2, 3]\nprint(has_hamiltonian_cycle(4, square_with_diag))   # True"
  },
  "more": "- Euler paths (every edge once) are easy; Hamiltonian paths (every vertex once) are NP-complete. Do not mix them up.\n- The DP merges all orderings of the same vertex set: only the set and the last vertex matter.\n- Backtracking speed-ups: try low-degree vertices first, prune when an unvisited vertex becomes unreachable.\n- Dirac/Ore degree conditions guarantee a cycle but are sufficient, not necessary.\n- For optimisation (shortest tour) see the Held-Karp entry.",
  "cx": "Backtracking: O(n!) worst case. Bitmask DP: O(2^n * n^2) time with adjacency lists O(2^n * (n + E)), space O(2^n) (as bitmasks).",
  "see": [
   "#/topic/bitmask-dp",
   "#/topic/backtracking",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\nrng = random.Random(27)\nfor _ in range(500):\n    n = rng.randint(3, 7)\n    adjset = [set() for _ in range(n)]\n    for _ in range(rng.randint(0, 14)):\n        a, b = rng.randrange(n), rng.randrange(n)\n        if a != b:\n            adjset[a].add(b); adjset[b].add(a)\n    adj = [sorted(s) for s in adjset]\n    path_exists = any(all(p[i + 1] in adjset[p[i]] for i in range(n - 1)) for p in itertools.permutations(range(n)))\n    cycle_exists = any(all(p[(i + 1) % n] in adjset[p[i]] for i in range(n)) for p in itertools.permutations(range(n)))\n    got = hamiltonian_path(n, adj)\n    assert (got is not None) == path_exists\n    if got:\n        assert sorted(got) == list(range(n)) and all(got[i + 1] in adjset[got[i]] for i in range(n - 1))\n    assert has_hamiltonian_path(n, adj) == path_exists\n    assert has_hamiltonian_cycle(n, adj) == cycle_exists, (n, adj)\nassert hamiltonian_path(1, [[]]) == [0]"
 },
 {
  "id": "cf-tsp-nearest-neighbour",
  "title": "Travelling salesman: nearest neighbour heuristic",
  "cat": "Optimization and heuristics",
  "q": [
   "nearest neighbour heuristic tsp",
   "travelling salesman greedy algorithm",
   "tsp nearest neighbor python",
   "implement nearest neighbour tour",
   "quick approximate tsp tour",
   "nearest neighbor algorithm tsp code",
   "nearest neighbour vs 2 opt",
   "how good is nearest neighbor for tsp"
  ],
  "tags": "tsp traveling salesman nearest neighbour nearest neighbor greedy heuristic tour approximation",
  "a": "Nearest neighbour builds a tour greedily: start anywhere and always go to the closest unvisited city, then return home. It is O(n^2) and simple, but only a heuristic: tours are typically 20-25 percent longer than optimal on random inputs and can be much worse on adversarial ones. Use it as a starting tour for 2-opt.",
  "code": {
   "py": "def nearest_neighbour_tour(d, start=0):\n    \"\"\"d: n x n distance matrix. Returns a tour (list of vertices, return to start implied).\"\"\"\n    n = len(d)\n    tour = [start]\n    left = set(range(n)) - {start}\n    while left:\n        last = tour[-1]\n        nxt = min(left, key=lambda v: d[last][v])      # greedy choice\n        tour.append(nxt)\n        left.remove(nxt)\n    return tour\n\npts = [(0, 0), (1, 0), (2, 0), (0, 1)]\nd = [[((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 for b in pts] for a in pts]\nprint(nearest_neighbour_tour(d))  # [0, 1, 2, 3]"
  },
  "more": "- Guarantee: only O(log n) times the optimum in the metric case; there are inputs where it is that bad.\n- Result depends on the start city; running it from every start and keeping the best costs O(n^3).\n- Typical pipeline: nearest neighbour for a quick tour, then 2-opt/Or-opt to polish it.\n- Never claim it is optimal; for exact answers use Held-Karp (n <= ~20).",
  "cx": "Time O(n^2), space O(n) beyond the distance matrix.",
  "see": [
   "#/topic/greedy",
   "#/topic/bitmask-dp"
  ],
  "check": "import itertools, math, random\ndef dist_matrix(pts):\n    return [[math.dist(a, b) for b in pts] for a in pts]\ndef tour_len(tour, d):\n    return sum(d[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))\ndef brute_opt(d):\n    n = len(d)\n    return min(tour_len((0,) + p, d) for p in itertools.permutations(range(1, n)))\ndef rand_pts(rng, n):\n    return [(rng.random() * 100, rng.random() * 100) for _ in range(n)]\n\nrng = random.Random(28)\nfor _ in range(100):\n    n = rng.randint(2, 8)\n    d = dist_matrix(rand_pts(rng, n))\n    t = nearest_neighbour_tour(d, start=rng.randrange(n))\n    assert sorted(t) == list(range(n))\n    assert tour_len(t, d) >= brute_opt(d) - 1e-9          # never better than optimal\nassert nearest_neighbour_tour([[0]]) == [0]\nline = dist_matrix([(0, 0), (1, 0), (2, 0), (3, 0)])\nassert tour_len(nearest_neighbour_tour(line), line) == 6   # optimal on a line"
 },
 {
  "id": "cf-tsp-2-opt",
  "title": "Travelling salesman: 2-opt local search",
  "cat": "Optimization and heuristics",
  "q": [
   "what is 2 opt",
   "2 opt algorithm tsp",
   "improve a tsp tour",
   "2 opt in python",
   "implement 2 opt",
   "2 opt code swap edges",
   "2 opt vs nearest neighbour",
   "remove crossing edges tsp"
  ],
  "tags": "2 opt two opt tsp local search improvement edge swap uncrossing tour reversal heuristic",
  "a": "2-opt improves a tour by taking two edges (a,b) and (c,d), and replacing them with (a,c) and (b,d) by reversing the segment between them, whenever this shortens the tour. Repeat until no swap helps. The result is a local optimum with no crossing edges (in the plane), usually within a few percent to 5-10 percent of optimal.",
  "code": {
   "py": "def two_opt(tour, d):\n    \"\"\"Improve a closed tour in place using distance matrix d. Returns the tour. tour[0] stays fixed.\"\"\"\n    n = len(tour)\n    improved = True\n    while improved:\n        improved = False\n        for i in range(1, n - 1):\n            for j in range(i + 1, n):\n                a, b = tour[i - 1], tour[i]\n                c, e = tour[j], tour[(j + 1) % n]\n                # replace edges (a,b) and (c,e) by (a,c) and (b,e)\n                if d[a][c] + d[b][e] < d[a][b] + d[c][e] - 1e-12:\n                    tour[i:j + 1] = reversed(tour[i:j + 1])\n                    improved = True\n    return tour\n\npts = [(0, 0), (1, 1), (1, 0), (0, 1)]                  # visiting order 0,1,2,3 crosses itself\nd = [[((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 for b in pts] for a in pts]\nprint(two_opt([0, 1, 2, 3], d))  # [0, 2, 1, 3]"
  },
  "more": "- Each accepted move strictly shortens the tour, so the loop terminates; the answer is a local optimum, not the global one.\n- Reversal is the whole trick: the tour stays one cycle, just with a segment run backwards.\n- With a symmetric distance matrix this is exact; for asymmetric costs reversal changes costs and the delta formula is wrong.\n- Stronger: Or-opt, 3-opt, Lin-Kernighan; or random restarts.",
  "cx": "One pass is O(n^2) pairs; the number of passes is not polynomially bounded in the worst case but is small in practice. Space O(1) beyond the tour.",
  "see": [
   "#/topic/greedy",
   "#/topic/bitmask-dp"
  ],
  "check": "import itertools, math, random\ndef dist_matrix(pts):\n    return [[math.dist(a, b) for b in pts] for a in pts]\ndef tour_len(tour, d):\n    return sum(d[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))\ndef brute_opt(d):\n    n = len(d)\n    return min(tour_len((0,) + p, d) for p in itertools.permutations(range(1, n)))\ndef rand_pts(rng, n):\n    return [(rng.random() * 100, rng.random() * 100) for _ in range(n)]\n\nrng = random.Random(29)\nfor _ in range(100):\n    n = rng.randint(4, 8)\n    d = dist_matrix(rand_pts(rng, n))\n    start = list(range(n)); rng.shuffle(start)\n    start.remove(0); start = [0] + start\n    before = tour_len(start, d)\n    t = two_opt(start[:], d)\n    assert sorted(t) == list(range(n)) and t[0] == 0\n    assert brute_opt(d) - 1e-9 <= tour_len(t, d) <= before + 1e-9\n    for i in range(1, n - 1):                            # no improving 2-opt move remains\n        for j in range(i + 1, n):\n            a, b, c, e = t[i - 1], t[i], t[j], t[(j + 1) % n]\n            assert d[a][c] + d[b][e] >= d[a][b] + d[c][e] - 1e-9\nassert two_opt([0], [[0]]) == [0]"
 },
 {
  "id": "cf-held-karp",
  "title": "Held-Karp exact travelling salesman (bitmask DP)",
  "cat": "Optimization and heuristics",
  "q": [
   "what is the held karp algorithm",
   "exact solution to the travelling salesman problem",
   "tsp bitmask dp",
   "held karp in python",
   "implement tsp dynamic programming",
   "held karp code",
   "tsp dp vs brute force",
   "shortest tour visiting all cities exactly"
  ],
  "tags": "held karp tsp travelling salesman bitmask dp exact dynamic programming 2^n n^2 shortest hamiltonian cycle",
  "a": "Held-Karp computes the exact shortest tour: dp[mask][j] = cheapest path that starts at city 0, visits exactly the cities in mask, and ends at j. Extend by one city at a time, then close the loop back to 0. It beats brute-force n! with O(2^n n^2) time, which is practical up to n around 20.",
  "code": {
   "py": "def held_karp(d):\n    \"\"\"d: n x n distance matrix. Returns (shortest_tour_length, tour) with the tour starting at city 0.\"\"\"\n    n = len(d)\n    if n == 1:\n        return 0, [0]\n    INF = float(\"inf\")\n    size = 1 << (n - 1)                                # subsets of cities 1..n-1 (bit i-1 = city i)\n    dp = [[INF] * n for _ in range(size)]\n    par = [[-1] * n for _ in range(size)]\n    for j in range(1, n):\n        dp[1 << (j - 1)][j] = d[0][j]\n    for mask in range(1, size):\n        for j in range(1, n):\n            if not (mask >> (j - 1)) & 1 or dp[mask][j] == INF:\n                continue\n            for k in range(1, n):\n                if (mask >> (k - 1)) & 1:\n                    continue\n                nm = mask | (1 << (k - 1))\n                cand = dp[mask][j] + d[j][k]\n                if cand < dp[nm][k]:\n                    dp[nm][k], par[nm][k] = cand, j\n    full = size - 1\n    best, last = min((dp[full][j] + d[j][0], j) for j in range(1, n))\n    tour, mask = [], full\n    while last != -1:                                  # walk the parents backwards\n        tour.append(last)\n        prev = par[mask][last]\n        mask ^= 1 << (last - 1)\n        last = prev\n    return best, [0] + tour[::-1]\n\nd = [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]\nprint(held_karp(d))  # (80, [0, 2, 3, 1])"
  },
  "more": "- The state (visited set, last city) is enough because the future cost does not depend on the order in which the set was visited.\n- Fixing city 0 as the start removes the n rotations of every tour.\n- Memory 2^n * n floats is the limit: n = 20 needs about 20 million cells.\n- Works for asymmetric distances; for a path (no return) skip the closing edge.\n- Beyond n ~ 22 use heuristics (2-opt, Lin-Kernighan) or branch and bound.",
  "cx": "Time O(2^n * n^2), space O(2^n * n).",
  "see": [
   "#/topic/bitmask-dp",
   "#/cheatsheets/dp-catalog"
  ],
  "check": "import itertools, math, random\ndef dist_matrix(pts):\n    return [[math.dist(a, b) for b in pts] for a in pts]\ndef tour_len(tour, d):\n    return sum(d[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))\ndef brute_opt(d):\n    n = len(d)\n    return min(tour_len((0,) + p, d) for p in itertools.permutations(range(1, n)))\ndef rand_pts(rng, n):\n    return [(rng.random() * 100, rng.random() * 100) for _ in range(n)]\n\nrng = random.Random(30)\nfor _ in range(60):\n    n = rng.randint(2, 8)\n    d = dist_matrix(rand_pts(rng, n))\n    best, tour = held_karp(d)\n    assert abs(best - brute_opt(d)) < 1e-9\n    assert sorted(tour) == list(range(n)) and tour[0] == 0\n    assert abs(tour_len(tour, d) - best) < 1e-9\nasym = [[0, 1, 9], [9, 0, 1], [1, 9, 0]]                   # works for asymmetric costs too\nassert held_karp(asym)[0] == 3\nassert held_karp([[0]]) == (0, [0])"
 },
 {
  "id": "cf-christofides",
  "title": "Christofides algorithm (1.5-approximation for metric TSP)",
  "cat": "Optimization and heuristics",
  "q": [
   "what is the christofides algorithm",
   "christofides tsp approximation",
   "explain christofides",
   "christofides in python",
   "implement christofides",
   "christofides algorithm code",
   "christofides vs 2 approximation mst doubling",
   "metric tsp 1.5 approximation"
  ],
  "tags": "christofides serdyukov tsp approximation mst odd degree matching euler circuit shortcut metric triangle inequality 1.5",
  "a": "For a metric TSP (distances obey the triangle inequality), Christofides builds a tour at most 1.5 times optimal: take an MST, add a minimum-weight perfect matching on the odd-degree vertices so all degrees are even, walk an Euler circuit, and shortcut repeated cities. This toy version finds the matching by bitmask DP, so it is only for small n.",
  "code": {
   "py": "import math\nfrom functools import lru_cache\n\ndef christofides(d):\n    \"\"\"d: symmetric metric distance matrix. Returns a tour (list of cities). Toy: matching is exponential in odd vertices.\"\"\"\n    n = len(d)\n    if n < 3:\n        return list(range(n))\n    # 1. minimum spanning tree (Prim)\n    in_t, dist, par = [False] * n, [math.inf] * n, [-1] * n\n    dist[0] = 0\n    mst = []\n    for _ in range(n):\n        v = min((x for x in range(n) if not in_t[x]), key=lambda x: dist[x])\n        in_t[v] = True\n        if par[v] != -1:\n            mst.append((par[v], v))\n        for x in range(n):\n            if not in_t[x] and d[v][x] < dist[x]:\n                dist[x], par[x] = d[v][x], v\n    # 2. minimum perfect matching on odd-degree vertices (bitmask DP)\n    deg = [0] * n\n    for u, v in mst:\n        deg[u] += 1\n        deg[v] += 1\n    odd = [v for v in range(n) if deg[v] % 2]\n    m = len(odd)\n\n    @lru_cache(maxsize=None)\n    def best(mask):                                    # returns (cost, pairs) for the odd vertices still in mask\n        if mask == 0:\n            return 0.0, ()\n        i = (mask & -mask).bit_length() - 1\n        res = (math.inf, ())\n        for j in range(i + 1, m):\n            if (mask >> j) & 1:\n                c, p = best(mask & ~(1 << i) & ~(1 << j))\n                c += d[odd[i]][odd[j]]\n                if c < res[0]:\n                    res = (c, p + ((odd[i], odd[j]),))\n        return res\n\n    pairs = best((1 << m) - 1)[1]\n    # 3. Euler circuit of MST + matching (Hierholzer)\n    adj = [[] for _ in range(n)]\n    edges = mst + list(pairs)\n    for idx, (u, v) in enumerate(edges):\n        adj[u].append((v, idx))\n        adj[v].append((u, idx))\n    used = [False] * len(edges)\n    stack, circuit = [0], []\n    while stack:\n        v = stack[-1]\n        while adj[v] and used[adj[v][-1][1]]:\n            adj[v].pop()\n        if adj[v]:\n            w, idx = adj[v].pop()\n            used[idx] = True\n            stack.append(w)\n        else:\n            circuit.append(stack.pop())\n    # 4. shortcut repeated vertices\n    seen, tour = set(), []\n    for v in circuit:\n        if v not in seen:\n            seen.add(v)\n            tour.append(v)\n    return tour\n\npts = [(0, 0), (4, 0), (4, 3), (0, 3), (2, 1)]\nd = [[math.dist(a, b) for b in pts] for a in pts]\nprint(christofides(d))  # a valid tour visiting all 5 cities"
  },
  "more": "- Why 1.5: the MST weighs at most OPT, and the matching on the odd vertices weighs at most OPT / 2 (shortcutting the optimal tour gives two matchings, take the lighter). Shortcutting cannot add length because of the triangle inequality.\n- Only valid for metric inputs; for general TSP no constant approximation exists unless P = NP.\n- The matching must be a true minimum-weight perfect matching (blossom algorithm in real code, bitmask DP here).\n- Simpler 2-approximation: double the MST and shortcut.",
  "cx": "Time O(n^2) for the MST plus O(2^k k) for the toy matching, k <= n odd vertices (O(n^3) with a real blossom matching). Space O(n^2 + 2^k).",
  "see": [
   "#/topic/mst",
   "#/topic/bitmask-dp"
  ],
  "check": "import itertools, math, random\ndef dist_matrix(pts):\n    return [[math.dist(a, b) for b in pts] for a in pts]\ndef tour_len(tour, d):\n    return sum(d[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))\ndef brute_opt(d):\n    n = len(d)\n    return min(tour_len((0,) + p, d) for p in itertools.permutations(range(1, n)))\ndef rand_pts(rng, n):\n    return [(rng.random() * 100, rng.random() * 100) for _ in range(n)]\n\nrng = random.Random(31)\nfor _ in range(80):\n    n = rng.randint(3, 8)\n    d = dist_matrix(rand_pts(rng, n))\n    t = christofides(d)\n    assert sorted(t) == list(range(n))\n    assert tour_len(t, d) <= 1.5 * brute_opt(d) + 1e-9, (n, t)\nassert christofides(dist_matrix([(0, 0), (1, 1)])) == [0, 1]"
 },
 {
  "id": "cf-scc-condensation-topological-order",
  "title": "Condensation DAG: topological order of strongly connected components",
  "cat": "Graphs: other",
  "q": [
   "how to topologically sort a graph with cycles",
   "condensation graph of scc",
   "topological order of strongly connected components",
   "condense scc into dag python",
   "implement scc condensation",
   "component graph dag code",
   "collapse cycles into a dag",
   "toposort with cycles"
  ],
  "tags": "condensation dag scc component graph topological sort strongly connected components collapse cycles kosaraju",
  "a": "Contract each strongly connected component to one node and the result is always a DAG: the condensation. Kosaraju gives components already numbered in topological order, because the second pass discovers them from sources toward sinks. Use it to sort a cyclic graph, count reachable components, or find source and sink SCCs.",
  "code": {
   "py": "def condensation(n, edges):\n    \"\"\"Returns (comp, comp_count, dag_edges). Component ids are in topological order: every cross edge goes from a lower to a higher id.\"\"\"\n    g = [[] for _ in range(n)]\n    rg = [[] for _ in range(n)]\n    for u, v in edges:\n        g[u].append(v)\n        rg[v].append(u)\n    seen, order = [False] * n, []\n    for s in range(n):                                   # pass 1: finishing order on the original graph\n        if seen[s]:\n            continue\n        seen[s] = True\n        stack = [(s, 0)]\n        while stack:\n            u, i = stack.pop()\n            if i < len(g[u]):\n                stack.append((u, i + 1))\n                v = g[u][i]\n                if not seen[v]:\n                    seen[v] = True\n                    stack.append((v, 0))\n            else:\n                order.append(u)\n    comp, c = [-1] * n, 0\n    for s in reversed(order):                            # pass 2: sweep the reversed graph\n        if comp[s] != -1:\n            continue\n        comp[s] = c\n        stack = [s]\n        while stack:\n            u = stack.pop()\n            for v in rg[u]:\n                if comp[v] == -1:\n                    comp[v] = c\n                    stack.append(v)\n        c += 1\n    dag = sorted({(comp[u], comp[v]) for u, v in edges if comp[u] != comp[v]})\n    return comp, c, dag\n\n# 0 <-> 1 form one component, 2 <-> 3 another; 1 -> 2 links them\nprint(condensation(4, [(0, 1), (1, 0), (1, 2), (2, 3), (3, 2)]))  # ([0, 0, 1, 1], 2, [(0, 1)])"
  },
  "more": "- Every cycle lies inside one SCC, so contracting SCCs removes all cycles.\n- Kosaraju processes components in topological order of the condensation; Tarjan's algorithm emits them in reverse topological order.\n- Typical uses: 2-SAT, \"minimum edges to make the graph strongly connected\" (count sources and sinks of the condensation), reachability counting by DP over the DAG.\n- Duplicate cross edges are removed here with a set; keep multiplicities if you need path counts.",
  "cx": "Time O(V + E), space O(V + E).",
  "see": [
   "#/topic/advanced-graphs",
   "#/topic/topo-sort",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\nrng = random.Random(32)\nfor _ in range(500):\n    n = rng.randint(1, 8)\n    edges = [(rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 14))]\n    reach = [[i == j for j in range(n)] for i in range(n)]\n    for u, v in edges:\n        reach[u][v] = True\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                reach[i][j] = reach[i][j] or (reach[i][k] and reach[k][j])\n    comp, cnt, dag = condensation(n, edges)\n    for i in range(n):\n        for j in range(n):\n            assert (comp[i] == comp[j]) == (reach[i][j] and reach[j][i])\n    assert all(a < b for a, b in dag)                    # ids are a topological order of the condensation\n    assert set(comp) == set(range(cnt))\nassert condensation(3, [(0, 1), (1, 2)])[1] == 3"
 },
 {
  "id": "cf-transitive-reduction-dag",
  "title": "Transitive reduction of a DAG",
  "cat": "Graphs: other",
  "q": [
   "what is a transitive reduction",
   "transitive reduction of a dag",
   "remove redundant edges from a dag",
   "transitive reduction in python",
   "implement transitive reduction",
   "minimal graph with same reachability",
   "transitive closure vs transitive reduction",
   "hasse diagram from dag"
  ],
  "tags": "transitive reduction dag redundant edges reachability bitset hasse diagram minimal equivalent graph transitive closure",
  "a": "The transitive reduction of a DAG is the unique smallest edge set with the same reachability: delete edge u->v whenever another path from u to v exists. Process vertices in reverse topological order with reachability bitsets; for each u, look at its out-neighbours in topological order and keep an edge only when the target is not already reachable through an earlier neighbour.",
  "code": {
   "py": "from collections import deque\n\ndef transitive_reduction(n, edges):\n    \"\"\"DAG edges (u, v). Returns the sorted list of edges that survive.\"\"\"\n    adj = [set() for _ in range(n)]\n    indeg = [0] * n\n    for u, v in edges:\n        if v not in adj[u]:\n            adj[u].add(v)\n            indeg[v] += 1\n    q = deque(v for v in range(n) if indeg[v] == 0)\n    topo = []\n    deg = indeg[:]\n    while q:\n        u = q.popleft()\n        topo.append(u)\n        for v in adj[u]:\n            deg[v] -= 1\n            if deg[v] == 0:\n                q.append(v)\n    if len(topo) != n:\n        raise ValueError(\"graph has a cycle\")\n    pos = {v: i for i, v in enumerate(topo)}\n    reach = [0] * n                                       # reach[u] = bitmask of vertices reachable from u (excluding u)\n    kept = []\n    for u in reversed(topo):\n        for v in sorted(adj[u], key=pos.get):             # nearest (earliest in topo order) neighbours first\n            if not (reach[u] >> v) & 1:                   # v not yet reachable through an earlier neighbour\n                kept.append((u, v))\n                reach[u] |= reach[v] | (1 << v)\n    return sorted(kept)\n\n# 0->1->2 and the shortcut 0->2: the shortcut is redundant\nprint(transitive_reduction(3, [(0, 1), (1, 2), (0, 2)]))  # [(0, 1), (1, 2)]"
  },
  "more": "- For a DAG the transitive reduction is unique and is a subgraph of the original; for graphs with cycles it is not unique (condense SCCs first).\n- Edge u->v is redundant exactly when some other out-neighbour of u already reaches v.\n- Checking neighbours in topological order is what makes the greedy test sufficient.\n- Python ints as bitsets keep the union cheap; for huge graphs use a bitset library.",
  "cx": "Time O(V + E log E + E * V / w) with word size w for the bitset unions (O(V * E) worst case in plain terms). Space O(V^2 / w) bits.",
  "see": [
   "#/topic/topo-sort",
   "#/topic/advanced-graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\ndef reachable_without(n, edges, skip, a, b):\n    adj = [[] for _ in range(n)]\n    for i, (u, v) in enumerate(edges):\n        if i != skip:\n            adj[u].append(v)\n    seen, st = {a}, [a]\n    while st:\n        for y in adj[st.pop()]:\n            if y not in seen:\n                seen.add(y); st.append(y)\n    return b in seen\ndef closure(n, edges):\n    r = [[i == j for j in range(n)] for i in range(n)]\n    for u, v in edges:\n        r[u][v] = True\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                r[i][j] = r[i][j] or (r[i][k] and r[k][j])\n    return r\nrng = random.Random(33)\nfor _ in range(500):\n    n = rng.randint(1, 8)\n    edges = sorted({(a, b) for a, b in ((rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 16))) if a < b})\n    perm = list(range(n)); rng.shuffle(perm)                 # relabel so ids are not already topologically sorted\n    edges = [(perm[a], perm[b]) for a, b in edges]\n    got = transitive_reduction(n, edges)\n    exp = sorted(e for i, e in enumerate(edges) if not reachable_without(n, edges, i, e[0], e[1]))\n    assert got == exp, (n, edges)\n    assert closure(n, got) == closure(n, edges)              # same reachability\nassert transitive_reduction(3, [(0, 1), (1, 2), (0, 2)]) == [(0, 1), (1, 2)]"
 },
 {
  "id": "cf-min-feedback-arc-set",
  "title": "Minimum feedback arc set (exact DP for small graphs)",
  "cat": "Optimization and heuristics",
  "q": [
   "what is the minimum feedback arc set",
   "minimum number of edges to remove to make a dag",
   "feedback arc set algorithm",
   "feedback arc set bitmask dp python",
   "implement minimum feedback arc set",
   "feedback arc set code",
   "feedback arc set vs feedback vertex set",
   "best ordering with fewest backward edges"
  ],
  "tags": "feedback arc set minimum fas remove edges acyclic ordering bitmask dp np hard linear ordering tournament ranking",
  "a": "A feedback arc set is a set of edges whose removal leaves a DAG; finding the smallest is NP-hard. Equivalent view: order the vertices to minimise the weight of edges pointing backward. For n up to about 20, bitmask DP does it exactly: dp[mask] = min backward weight when the vertices in mask are placed first.",
  "code": {
   "py": "def min_feedback_arc_set(n, edges):\n    \"\"\"edges: (u, v, w) directed. Returns (min_removed_weight, vertex_order). Exact; practical for n <= ~20.\"\"\"\n    w = [[0] * n for _ in range(n)]\n    for u, v, c in edges:\n        if u != v:\n            w[u][v] += c\n    INF = float(\"inf\")\n    dp = [INF] * (1 << n)\n    choice = [-1] * (1 << n)\n    dp[0] = 0\n    for mask in range(1 << n):\n        if dp[mask] == INF:\n            continue\n        for v in range(n):\n            if (mask >> v) & 1:\n                continue\n            # place v right after the vertices in mask: edges v -> u with u already placed point backward\n            back = sum(w[v][u] for u in range(n) if (mask >> u) & 1)\n            nm = mask | (1 << v)\n            if dp[mask] + back < dp[nm]:\n                dp[nm], choice[nm] = dp[mask] + back, v\n    order, mask = [], (1 << n) - 1\n    while mask:\n        v = choice[mask]\n        order.append(v)\n        mask ^= 1 << v\n    return dp[(1 << n) - 1], order[::-1]\n\n# a 3-cycle needs one edge removed\nprint(min_feedback_arc_set(3, [(0, 1, 1), (1, 2, 1), (2, 0, 1)])[0])  # 1"
  },
  "more": "- Removing the backward edges of any ordering leaves a DAG, and every acyclic remainder has a topological order, so the two formulations are equal.\n- Only the set of placed vertices matters for the cost of the next vertex, which is why the DP over subsets works.\n- Heuristics for big graphs: Eades-Lin-Smyth greedy, or sort by out-degree minus in-degree.\n- Applications: ranking from pairwise comparisons, breaking dependency cycles.\n- Cheaper cousin: feedback vertex set.",
  "cx": "Time O(2^n * n^2) (O(2^n * n) with an incremental sum), space O(2^n).",
  "see": [
   "#/topic/bitmask-dp",
   "#/topic/topo-sort",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef back_weight(order, edges):\n    pos = {v: i for i, v in enumerate(order)}\n    return sum(c for u, v, c in edges if u != v and pos[u] > pos[v])\nrng = random.Random(34)\nfor _ in range(300):\n    n = rng.randint(1, 6)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 4)) for _ in range(rng.randint(0, 10))]\n    val, order = min_feedback_arc_set(n, edges)\n    assert sorted(order) == list(range(n))\n    assert val == back_weight(order, edges)\n    assert val == min(back_weight(p, edges) for p in itertools.permutations(range(n))), (n, edges)\nassert min_feedback_arc_set(3, [(0, 1, 5), (1, 2, 5)])[0] == 0\nassert min_feedback_arc_set(2, [(0, 1, 3), (1, 0, 2)])[0] == 2"
 },
 {
  "id": "cf-graph-colouring-greedy-dsatur",
  "title": "Graph colouring: greedy and DSATUR",
  "cat": "Optimization and heuristics",
  "q": [
   "how to colour a graph",
   "greedy graph coloring algorithm",
   "what is dsatur",
   "graph coloring in python",
   "implement dsatur",
   "dsatur algorithm code",
   "dsatur vs greedy coloring",
   "minimum number of colors heuristic"
  ],
  "tags": "graph coloring colouring greedy dsatur saturation degree welsh powell heuristic chromatic number register allocation",
  "a": "Greedy colouring visits vertices in some order and gives each the smallest colour not used by its neighbours; it never needs more than max-degree + 1 colours but depends heavily on the order. DSATUR picks the next vertex with the most distinct neighbour colours (ties: highest degree), which is exact on bipartite graphs and usually near-optimal. Optimal colouring is NP-hard.",
  "code": {
   "py": "def greedy_colouring(n, adj, order=None):\n    \"\"\"adj[u] = neighbours. Returns colour[u] in 0..k-1.\"\"\"\n    colour = [-1] * n\n    for u in (order if order is not None else range(n)):\n        taken = {colour[v] for v in adj[u] if colour[v] != -1}\n        c = 0\n        while c in taken:\n            c += 1\n        colour[u] = c\n    return colour\n\ndef dsatur(n, adj):\n    colour = [-1] * n\n    sat = [set() for _ in range(n)]                    # colours already used around each vertex\n    for _ in range(n):\n        u = max((x for x in range(n) if colour[x] == -1), key=lambda x: (len(sat[x]), len(adj[x])))\n        c = 0\n        while c in sat[u]:\n            c += 1\n        colour[u] = c\n        for v in adj[u]:\n            sat[v].add(c)\n    return colour\n\n# crown graph: a_i adjacent to b_j for i != j; the order a0,b0,a1,b1,... fools greedy\nk = 4\nadj = [set() for _ in range(2 * k)]\nfor i in range(k):\n    for j in range(k):\n        if i != j:\n            adj[i].add(k + j); adj[k + j].add(i)\nbad_order = [x for i in range(k) for x in (i, k + i)]\nprint(max(greedy_colouring(2 * k, adj, bad_order)) + 1, max(dsatur(2 * k, adj)) + 1)  # 4 2"
  },
  "more": "- Greedy bound: a vertex has at most deg neighbours, so a free colour among 0..deg always exists.\n- Order matters: the crown graph above is 2-colourable but a bad order forces k colours. Largest-degree-first (Welsh-Powell) is a cheap improvement.\n- DSATUR is a heuristic for general graphs; for the exact minimum use backtracking (see chromatic number).\n- Applications: register allocation, timetabling, interval-like conflict problems.",
  "cx": "Greedy: O(V + E) time. DSATUR: O(V^2 + E) with this simple selection, O((V + E) log V) with a heap. Space O(V + E).",
  "see": [
   "#/topic/greedy",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\ndef proper(adj, col):\n    return all(col[u] != col[v] for u in range(len(adj)) for v in adj[u])\nrng = random.Random(35)\nfor _ in range(300):\n    n = rng.randint(1, 9)\n    adj = rand_graph(rng, n, rng.random())\n    g, d = greedy_colouring(n, adj), dsatur(n, adj)\n    assert proper(adj, g) and proper(adj, d)\n    maxdeg = max((len(a) for a in adj), default=0)\n    assert max(g) + 1 <= maxdeg + 1 and max(d) + 1 <= maxdeg + 1\nfor _ in range(100):                                      # DSATUR is exact on bipartite graphs\n    a, b = rng.randint(1, 5), rng.randint(1, 5)\n    adj = [set() for _ in range(a + b)]\n    for i in range(a):\n        for j in range(b):\n            if rng.random() < 0.6:\n                adj[i].add(a + j); adj[a + j].add(i)\n    col = dsatur(a + b, adj)\n    assert proper(adj, col) and max(col) + 1 <= 2\nk = 4\nadj = [set() for _ in range(2 * k)]\nfor i in range(k):\n    for j in range(k):\n        if i != j:\n            adj[i].add(k + j); adj[k + j].add(i)\norder = [x for i in range(k) for x in (i, k + i)]\nassert max(greedy_colouring(2 * k, adj, order)) + 1 == 4 and max(dsatur(2 * k, adj)) + 1 == 2"
 },
 {
  "id": "cf-chromatic-number",
  "title": "Chromatic number by backtracking",
  "cat": "Optimization and heuristics",
  "q": [
   "how to find the chromatic number",
   "minimum colors to colour a graph exactly",
   "k colourability backtracking",
   "chromatic number in python",
   "implement graph coloring backtracking",
   "m coloring problem",
   "is a graph 3 colorable",
   "chromatic number brute force"
  ],
  "tags": "chromatic number k colorability m coloring problem backtracking exact graph coloring np complete",
  "a": "The chromatic number is the fewest colours needed so adjacent vertices differ. Test k = 1, 2, 3, ... with backtracking: colour vertices one by one, trying only colours not used by already-coloured neighbours, and allow a new colour only as the next unused one (symmetry breaking). It is NP-hard, so this is for small graphs.",
  "code": {
   "py": "def can_colour(n, adj, k):\n    \"\"\"Is there a proper colouring with at most k colours?\"\"\"\n    order = sorted(range(n), key=lambda u: -len(adj[u]))       # hardest vertices first\n    colour = [-1] * n\n\n    def go(i, used):\n        if i == n:\n            return True\n        u = order[i]\n        banned = {colour[v] for v in adj[u]}\n        for c in range(min(used + 1, k)):                       # at most one brand-new colour: kills symmetry\n            if c not in banned:\n                colour[u] = c\n                if go(i + 1, max(used, c + 1)):\n                    return True\n                colour[u] = -1\n        return False\n\n    return go(0, 0)\n\ndef chromatic_number(n, adj):\n    if n == 0:\n        return 0\n    k = 1\n    while not can_colour(n, adj, k):\n        k += 1\n    return k\n\ncycle5 = [{1, 4}, {0, 2}, {1, 3}, {2, 4}, {3, 0}]\nprint(chromatic_number(5, cycle5))  # 3"
  },
  "more": "- Lower bounds: chi >= clique size; chi >= 2 if any edge exists; odd cycles need 3.\n- Upper bounds: chi <= max degree + 1 (Brooks: <= max degree except for complete graphs and odd cycles).\n- Symmetry breaking (never open colour c+1 before c) cuts the search a lot.\n- k = 2 is a bipartite test in linear time; k >= 3 is NP-complete. For large graphs use DSATUR for an upper bound or a SAT/ILP solver.",
  "cx": "Worst case O(k^n) time (exponential); space O(n).",
  "see": [
   "#/topic/backtracking",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\ndef brute(n, adj):\n    for k in range(1, n + 1):\n        for col in itertools.product(range(k), repeat=n):\n            if all(col[u] != col[v] for u in range(n) for v in adj[u]):\n                return k\n    return 0\nrng = random.Random(36)\nfor _ in range(300):\n    n = rng.randint(1, 6)\n    adj = rand_graph(rng, n, rng.random())\n    assert chromatic_number(n, adj) == brute(n, adj), (n, adj)\nk5 = [set(range(5)) - {i} for i in range(5)]\nassert chromatic_number(5, k5) == 5\nassert chromatic_number(0, []) == 0\nassert chromatic_number(4, [{1}, {0, 2}, {1, 3}, {2}]) == 2"
 },
 {
  "id": "cf-bron-kerbosch",
  "title": "Bron-Kerbosch maximal cliques (with pivoting)",
  "cat": "Graphs: other",
  "q": [
   "what is the bron kerbosch algorithm",
   "find all maximal cliques",
   "maximum clique in a graph",
   "bron kerbosch in python",
   "implement bron kerbosch with pivot",
   "clique finding code",
   "bron kerbosch pivot vs no pivot",
   "largest group of mutually connected vertices"
  ],
  "tags": "bron kerbosch clique maximal cliques maximum clique pivot degeneracy np hard social network",
  "a": "A clique is a set of vertices that are all pairwise adjacent. Bron-Kerbosch lists every maximal clique recursively with three sets: R (current clique), P (candidates that can still extend it), X (already handled). Choosing a pivot vertex and only branching on P minus its neighbours prunes most of the recursion. The biggest clique is the largest output.",
  "code": {
   "py": "def maximal_cliques(n, adj):\n    \"\"\"adj[u] = set of neighbours. Returns a list of maximal cliques (each a sorted list).\"\"\"\n    out = []\n\n    def expand(R, P, X):\n        if not P and not X:\n            out.append(sorted(R))                              # nothing can extend R and nothing was skipped: maximal\n            return\n        pivot = max(P | X, key=lambda u: len(adj[u] & P))      # pivot covering most candidates\n        for v in list(P - adj[pivot]):                          # skip neighbours of the pivot\n            expand(R | {v}, P & adj[v], X & adj[v])\n            P = P - {v}\n            X = X | {v}\n\n    expand(set(), set(range(n)), set())\n    return out\n\n# triangle 0-1-2 plus pendant vertex 3 attached to 2\nprint(sorted(maximal_cliques(4, [{1, 2}, {0, 2}, {0, 1, 3}, {2}])))  # [[0, 1, 2], [2, 3]]"
  },
  "more": "- X blocks duplicates: a candidate in X would have produced the same clique earlier, so reaching an empty P with a non-empty X means R is not maximal.\n- Pivoting: any maximal clique contains the pivot or one of its non-neighbours, so you only branch on P minus N(pivot).\n- Worst case output is exponential (up to 3^(n/3) maximal cliques), so no algorithm can be polynomial.\n- Max clique = max independent set in the complement graph.",
  "cx": "Worst case O(3^(n/3)) time, matching the maximum number of maximal cliques; much faster on sparse graphs (O(d n 3^(d/3)) with a degeneracy ordering, d = degeneracy). Space O(n) recursion plus output.",
  "see": [
   "#/topic/backtracking",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\ndef brute(n, adj):\n    cl = [set(c) for k in range(1, n + 1) for c in itertools.combinations(range(n), k)\n          if all(b in adj[a] for a, b in itertools.combinations(c, 2))]\n    return sorted(sorted(c) for c in cl if not any(c < d for d in cl))\nrng = random.Random(37)\nfor _ in range(300):\n    n = rng.randint(1, 8)\n    adj = rand_graph(rng, n, rng.random())\n    assert sorted(maximal_cliques(n, adj)) == brute(n, adj), (n, adj)\nk6 = [set(range(6)) - {i} for i in range(6)]\nassert maximal_cliques(6, k6) == [[0, 1, 2, 3, 4, 5]]\nassert maximal_cliques(3, [set(), set(), set()]) == [[0], [1], [2]]"
 },
 {
  "id": "cf-max-independent-set-small",
  "title": "Maximum independent set for small graphs (branching)",
  "cat": "Graphs: other",
  "q": [
   "what is a maximum independent set",
   "find the largest independent set",
   "independent set in python",
   "implement maximum independent set",
   "max independent set bitmask recursion",
   "independent set vs clique vs vertex cover",
   "largest set of non adjacent vertices",
   "maximum independent set exact algorithm"
  ],
  "tags": "maximum independent set mis exact branching bitmask vertex cover complement clique np hard small graph",
  "a": "An independent set has no two adjacent vertices; finding the largest is NP-hard. A simple exact method branches on a vertex v of highest degree: either take v (delete v and all its neighbours) or skip v (delete v); degree 0 or 1 vertices are always safe to take. With bitmasks it handles about 40 vertices comfortably.",
  "code": {
   "py": "def max_independent_set(n, adj):\n    \"\"\"adj[u] = iterable of neighbours. Returns the size of a maximum independent set (use bitmasks).\"\"\"\n    nb = [0] * n\n    for u in range(n):\n        for v in adj[u]:\n            nb[u] |= 1 << v\n\n    def solve(mask):\n        if mask == 0:\n            return 0\n        best_v, best_d = -1, -1\n        m = mask\n        while m:                                      # pick the vertex with the most neighbours still alive\n            low = m & -m\n            v = low.bit_length() - 1\n            m ^= low\n            d = bin(nb[v] & mask).count(\"1\")\n            if d <= 1:\n                return 1 + solve(mask & ~(nb[v] | (1 << v)))   # a vertex of degree <= 1 is always safe to take\n            if d > best_d:\n                best_v, best_d = v, d\n        v = best_v\n        take = 1 + solve(mask & ~(nb[v] | (1 << v)))\n        skip = solve(mask & ~(1 << v))\n        return max(take, skip)\n\n    return solve((1 << n) - 1)\n\n# 5-cycle: at most 2 mutually non-adjacent vertices\nprint(max_independent_set(5, [[1, 4], [0, 2], [1, 3], [2, 4], [3, 0]]))  # 2"
  },
  "more": "- Relations: MIS = n - minimum vertex cover; MIS(G) = maximum clique of the complement; on bipartite graphs it equals n - maximum matching (Konig).\n- Degree <= 1 reduction is safe: swapping an optimal solution to include such a vertex never makes it smaller.\n- Branching on high-degree vertices removes many vertices at once and keeps the tree small (worst case about 1.38^n or better with more rules).\n- Trees and forests: use a linear tree DP instead.",
  "cx": "Exponential: roughly O(1.38^n) worst case for this branching rule set (at most O(2^n)); polynomial on forests and bipartite graphs via other methods. Space O(n) recursion.",
  "see": [
   "#/topic/bitmask-dp",
   "#/topic/backtracking",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\ndef brute(n, adj):\n    best = 0\n    for mask in range(1 << n):\n        vs = [i for i in range(n) if (mask >> i) & 1]\n        if all(b not in adj[a] for a, b in itertools.combinations(vs, 2)):\n            best = max(best, len(vs))\n    return best\nrng = random.Random(38)\nfor _ in range(400):\n    n = rng.randint(1, 10)\n    adj = rand_graph(rng, n, rng.random())\n    assert max_independent_set(n, adj) == brute(n, adj), (n, adj)\nassert max_independent_set(0, []) == 0\nassert max_independent_set(4, [set()] * 4) == 4\nk4 = [set(range(4)) - {i} for i in range(4)]\nassert max_independent_set(4, k4) == 1"
 },
 {
  "id": "cf-graph-isomorphism",
  "title": "Graph isomorphism (backtracking with degree pruning)",
  "cat": "Graphs: other",
  "q": [
   "what is graph isomorphism",
   "how to check if two graphs are isomorphic",
   "graph isomorphism algorithm",
   "graph isomorphism in python",
   "implement isomorphism check",
   "are two graphs the same up to relabeling",
   "degree sequence graph isomorphism",
   "canonical form of a graph"
  ],
  "tags": "graph isomorphism isomorphic degree sequence backtracking mapping canonical form relabeling vf2 invariant",
  "a": "Two graphs are isomorphic if some relabelling of vertices makes their edge sets identical. First reject cheaply with invariants (vertex count, edge count, sorted degree sequence), then search for a vertex mapping by backtracking, only matching vertices with equal degree and keeping adjacency consistent with the vertices already mapped. No polynomial algorithm is known for the general case.",
  "code": {
   "py": "def is_isomorphic(n1, adj1, n2, adj2):\n    \"\"\"adj as lists of neighbour sets. Returns True if the graphs are isomorphic.\"\"\"\n    if n1 != n2:\n        return False\n    n = n1\n    d1, d2 = [len(a) for a in adj1], [len(a) for a in adj2]\n    if sorted(d1) != sorted(d2):                         # degree sequence invariant\n        return False\n    order = sorted(range(n), key=lambda u: -d1[u])      # map high-degree vertices first\n    mapping, used = {}, [False] * n\n\n    def go(i):\n        if i == n:\n            return True\n        u = order[i]\n        for v in range(n):\n            if used[v] or d2[v] != d1[u]:\n                continue\n            # adjacency to every already-mapped vertex must agree in both directions\n            if all((w in adj1[u]) == (mapping[w] in adj2[v]) for w in mapping):\n                mapping[u] = v\n                used[v] = True\n                if go(i + 1):\n                    return True\n                del mapping[u]\n                used[v] = False\n        return False\n\n    return go(0)\n\npath = [{1}, {0, 2}, {1}]\nrelabelled = [{2}, {2}, {0, 1}]\nprint(is_isomorphic(3, path, 3, relabelled))  # True"
  },
  "more": "- Invariants that must match: vertex count, edge count, sorted degree sequence, number of triangles, per-vertex neighbour degrees. Equal invariants do not prove isomorphism (C6 vs two triangles share degrees).\n- Checking adjacency against all already-mapped vertices keeps the search consistent; mapping a connected order (BFS) prunes even earlier.\n- Practical tools: VF2, nauty/bliss for canonical labelling. Trees are solved in linear time with canonical strings.\n- Complexity status: not known to be in P or NP-complete (quasi-polynomial time by Babai).",
  "cx": "Worst case O(n!) with this backtracking (strongly pruned in practice); invariant checks cost O(n log n + E). Space O(n).",
  "see": [
   "#/topic/backtracking",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\ndef brute(n, a, b):\n    return any(all((v in a[u]) == (p[v] in b[p[u]]) for u in range(n) for v in range(n) if u != v)\n               for p in itertools.permutations(range(n)))\nrng = random.Random(39)\nfor _ in range(400):\n    n = rng.randint(1, 6)\n    a = rand_graph(rng, n, rng.random())\n    if rng.random() < 0.5:                                 # a true relabelling\n        p = list(range(n)); rng.shuffle(p)\n        b = [set() for _ in range(n)]\n        for u in range(n):\n            for v in a[u]:\n                b[p[u]].add(p[v])\n    else:\n        b = rand_graph(rng, n, rng.random())\n    assert is_isomorphic(n, a, n, b) == brute(n, a, b), (n, a, b)\nc6 = [{(i - 1) % 6, (i + 1) % 6} for i in range(6)]\ntwo_c3 = [{1, 2}, {0, 2}, {0, 1}, {4, 5}, {3, 5}, {3, 4}]\nassert not is_isomorphic(6, c6, 6, two_c3)                  # same degrees, different graphs"
 },
 {
  "id": "cf-weisfeiler-leman",
  "title": "Weisfeiler-Leman (1-WL) colour refinement",
  "cat": "Graphs: other",
  "q": [
   "what is the weisfeiler leman test",
   "weisfeiler lehman graph hash",
   "1-wl colour refinement",
   "weisfeiler leman in python",
   "implement color refinement",
   "graph canonical hashing",
   "wl test vs graph isomorphism",
   "wl graph kernel"
  ],
  "tags": "weisfeiler leman weisfeiler lehman 1-wl color refinement graph hash canonical hashing gnn isomorphism test",
  "a": "Colour refinement gives each vertex a colour, then repeatedly replaces it with a hash of (own colour, sorted multiset of neighbour colours). If the final colour multisets of two graphs differ, they are definitely not isomorphic; if they match the graphs may still differ (regular graphs always fool it). It is a fast filter and hashing step.",
  "code": {
   "py": "import hashlib\n\ndef wl_hash(n, adj, rounds=None):\n    \"\"\"1-dimensional Weisfeiler-Leman. adj[u] = neighbours. Returns a hashable fingerprint of the whole graph.\"\"\"\n    colour = [\"0\"] * n\n    for _ in range(rounds if rounds is not None else n):\n        new = []\n        for u in range(n):\n            sig = colour[u] + \"|\" + \",\".join(sorted(colour[v] for v in adj[u]))\n            new.append(hashlib.sha256(sig.encode()).hexdigest()[:16])\n        colour = new\n    return tuple(sorted(colour))                        # multiset of vertex colours\n\npath = [{1}, {0, 2, 3}, {1}, {1}]                       # star K1,3\nchain = [{1}, {0, 2}, {1, 3}, {2}]                      # path P4\nprint(wl_hash(4, path) == wl_hash(4, chain))            # False: the degree profiles already differ"
  },
  "more": "- Soundness: isomorphic graphs always produce equal fingerprints, because relabelling permutes vertices but not the multisets being hashed.\n- Incompleteness: same fingerprint does not prove isomorphism; all d-regular graphs with the same n look the same.\n- Use a stable hash (sha256), not Python's per-run hash(), when comparing fingerprints across runs.\n- Stronger: k-WL for k >= 2, or follow with an exact backtracking check. Graph neural networks are bounded by 1-WL in distinguishing power.",
  "cx": "Each round O(V + E log deg); at most V rounds (it stabilises sooner), so O(V (V + E log V)) here. Space O(V).",
  "see": [
   "#/topic/hashing-internals",
   "#/topic/graphs",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\nrng = random.Random(40)\nfor _ in range(200):\n    n = rng.randint(1, 7)\n    a = rand_graph(rng, n, rng.random())\n    p = list(range(n)); rng.shuffle(p)\n    b = [set() for _ in range(n)]\n    for u in range(n):\n        for v in a[u]:\n            b[p[u]].add(p[v])\n    assert wl_hash(n, a) == wl_hash(n, b)               # isomorphic graphs always get the same fingerprint\nstar = [{1, 2, 3}, {0}, {0}, {0}]\nchain = [{1}, {0, 2}, {1, 3}, {2}]\nassert wl_hash(4, star) != wl_hash(4, chain)\nc6 = [{(i - 1) % 6, (i + 1) % 6} for i in range(6)]\ntwo_c3 = [{1, 2}, {0, 2}, {0, 1}, {4, 5}, {3, 5}, {3, 4}]\nassert wl_hash(6, c6) == wl_hash(6, two_c3)             # known failure: regular graphs look identical to 1-WL"
 },
 {
  "id": "cf-pagerank",
  "title": "PageRank (power iteration)",
  "cat": "Graphs: other",
  "q": [
   "what is pagerank",
   "explain the pagerank algorithm",
   "how does pagerank work",
   "pagerank in python",
   "implement pagerank power iteration",
   "pagerank code damping factor",
   "pagerank vs hits",
   "how to compute pagerank with dangling nodes"
  ],
  "tags": "pagerank power iteration damping factor random surfer dangling nodes stationary distribution link analysis google",
  "a": "PageRank scores a node by the chance a random surfer is on it: with probability d (usually 0.85) follow a random out-link, otherwise jump to a random node. Start from the uniform distribution and repeat r = (1-d)/n + d * (sum of share from in-links + dangling mass / n) until the change is tiny. Scores sum to 1.",
  "code": {
   "py": "def pagerank(n, edges, d=0.85, tol=1e-12, max_iter=1000):\n    \"\"\"edges: (u, v) directed links. Returns a list of scores summing to 1.\"\"\"\n    out = [[] for _ in range(n)]\n    for u, v in edges:\n        out[u].append(v)\n    r = [1.0 / n] * n\n    for _ in range(max_iter):\n        new = [(1 - d) / n] * n                        # teleport\n        dangling = sum(r[u] for u in range(n) if not out[u])   # pages with no out-links spread evenly\n        for u in range(n):\n            if out[u]:\n                share = d * r[u] / len(out[u])\n                for v in out[u]:\n                    new[v] += share\n        for v in range(n):\n            new[v] += d * dangling / n\n        diff = sum(abs(a - b) for a, b in zip(new, r))\n        r = new\n        if diff < tol:\n            break\n    return r\n\nprint([round(x, 3) for x in pagerank(3, [(0, 1), (1, 2), (2, 0)])])  # [0.333, 0.333, 0.333]"
  },
  "more": "- Convergence: the damped Markov chain is ergodic, so power iteration converges geometrically at rate d.\n- Dangling nodes (no out-links) must redistribute their mass; ignoring them leaks probability and the sum drops below 1.\n- Duplicate links count multiple times here; dedupe edges if you want a simple graph.\n- Large graphs use sparse matrices; personalised PageRank replaces the uniform teleport with a chosen start distribution.",
  "cx": "Time O(k (V + E)) for k iterations (k ~ log(1/tol) / log(1/d)); space O(V + E).",
  "see": [
   "#/topic/graphs",
   "#/topic/math",
   "#/cheatsheets/graphs"
  ],
  "check": "import random\nrng = random.Random(41)\nfor _ in range(100):\n    n = rng.randint(1, 8)\n    edges = [(rng.randrange(n), rng.randrange(n)) for _ in range(rng.randint(0, 16))]\n    d = 0.85\n    r = pagerank(n, edges, d)\n    assert abs(sum(r) - 1) < 1e-9 and all(x > 0 for x in r)\n    out = [[v for u2, v in edges if u2 == u] for u in range(n)]\n    dang = sum(r[u] for u in range(n) if not out[u])\n    for v in range(n):                                  # fixed point: r = teleport + d * (in-link shares + dangling/n)\n        rhs = (1 - d) / n + d * (sum(r[u] / len(out[u]) for u in range(n) for w in out[u] if w == v) + dang / n)\n        assert abs(rhs - r[v]) < 1e-9\nstar = pagerank(4, [(1, 0), (2, 0), (3, 0)])\nassert star[0] == max(star) and star[1] == star[2] == star[3]\nassert all(abs(x - 1 / 3) < 1e-9 for x in pagerank(3, [(0, 1), (1, 2), (2, 0)]))"
 },
 {
  "id": "cf-hits",
  "title": "HITS: hubs and authorities",
  "cat": "Graphs: other",
  "q": [
   "what is hits algorithm",
   "hubs and authorities explained",
   "how does hits work",
   "hits algorithm in python",
   "implement hits",
   "hits code hub authority scores",
   "hits vs pagerank",
   "kleinberg link analysis"
  ],
  "tags": "hits hubs authorities kleinberg link analysis hub score authority score power iteration eigenvector",
  "a": "HITS gives each node two scores: authority (pointed to by good hubs) and hub (points to good authorities). Iterate: authority[v] = sum of hub[u] over links u->v, then hub[u] = sum of authority[v] over links u->v, and normalise each time. The scores converge to the dominant eigenvectors of A^T A and A A^T.",
  "code": {
   "py": "import math\n\ndef hits(n, edges, iters=200):\n    \"\"\"edges: (u, v) directed. Returns (hub, authority), each L2-normalised.\"\"\"\n    hub = [1.0] * n\n    auth = [1.0] * n\n    for _ in range(iters):\n        auth = [0.0] * n\n        for u, v in edges:\n            auth[v] += hub[u]                     # good hubs vote for what they point to\n        s = math.sqrt(sum(x * x for x in auth)) or 1.0\n        auth = [x / s for x in auth]\n        hub = [0.0] * n\n        for u, v in edges:\n            hub[u] += auth[v]                     # good authorities reward the pages that point at them\n        s = math.sqrt(sum(x * x for x in hub)) or 1.0\n        hub = [x / s for x in hub]\n    return hub, auth\n\nhub, auth = hits(4, [(0, 2), (1, 2), (1, 3), (0, 3), (3, 2)])\nprint([round(x, 2) for x in auth])  # node 2 has the highest authority"
  },
  "more": "- The two updates are the power method on A^T A (authorities) and A A^T (hubs), so the limit is the principal eigenvector; normalisation stops growth.\n- Unlike PageRank, HITS has no teleport, is query-dependent in its original use (run on a small subgraph), and can be unstable when the top eigenvalue is not unique.\n- Disconnected or edge-free graphs give zero scores.\n- Choose PageRank for a global importance score, HITS for separate \"good directory\" and \"good source\" scores.",
  "cx": "Time O(k * E) for k iterations, space O(V + E).",
  "see": [
   "#/topic/graphs",
   "#/topic/math"
  ],
  "check": "import math\nedges = [(0, 2), (1, 2), (1, 3), (0, 3), (3, 2)]\nhub, auth = hits(4, edges)\nassert max(range(4), key=lambda i: auth[i]) == 2\nassert max(range(4), key=lambda i: hub[i]) in (0, 1)\nassert abs(sum(x * x for x in hub) - 1) < 1e-9 and abs(sum(x * x for x in auth) - 1) < 1e-9\nh, a = hits(4, edges, 500)\nta = [sum(h[u] for u, v in edges if v == i) for i in range(4)]       # A^T h\nth = [sum(a[v] for u, v in edges if u == i) for i in range(4)]       # A a\nsa, sh = math.sqrt(sum(x * x for x in ta)), math.sqrt(sum(x * x for x in th))\nassert all(abs(x / sa - y) < 1e-9 for x, y in zip(ta, a))             # fixed point of the iteration\nassert all(abs(x / sh - y) < 1e-9 for x, y in zip(th, h))\nassert hits(3, [])[1] == [0.0, 0.0, 0.0]"
 },
 {
  "id": "cf-betweenness-centrality-brandes",
  "title": "Betweenness centrality (Brandes' algorithm)",
  "cat": "Graphs: other",
  "q": [
   "what is betweenness centrality",
   "brandes' algorithm",
   "how to compute betweenness centrality",
   "betweenness centrality in python",
   "implement brandes algorithm",
   "betweenness centrality code",
   "betweenness vs closeness centrality",
   "which node lies on the most shortest paths"
  ],
  "tags": "betweenness centrality brandes shortest paths dependency accumulation bfs graph centrality bridge nodes",
  "a": "Betweenness of v is the sum, over vertex pairs (s, t), of the fraction of shortest s-t paths that pass through v. Brandes runs one BFS from each source counting shortest paths (sigma), then walks the BFS order backwards accumulating each vertex's dependency delta; summing over sources gives all scores in O(VE) instead of O(V^3).",
  "code": {
   "py": "from collections import deque\n\ndef betweenness(n, adj, directed=False):\n    \"\"\"Unweighted betweenness centrality. adj[u] = neighbours. Undirected scores count each pair once.\"\"\"\n    bc = [0.0] * n\n    for s in range(n):\n        dist = [-1] * n\n        sigma = [0] * n                               # number of shortest s->v paths\n        preds = [[] for _ in range(n)]\n        dist[s], sigma[s] = 0, 1\n        order, q = [], deque([s])\n        while q:\n            u = q.popleft()\n            order.append(u)\n            for v in adj[u]:\n                if dist[v] < 0:\n                    dist[v] = dist[u] + 1\n                    q.append(v)\n                if dist[v] == dist[u] + 1:\n                    sigma[v] += sigma[u]\n                    preds[v].append(u)\n        delta = [0.0] * n\n        for w in reversed(order):                     # farthest vertices first\n            for u in preds[w]:\n                delta[u] += sigma[u] / sigma[w] * (1 + delta[w])\n            if w != s:\n                bc[w] += delta[w]\n    return bc if directed else [x / 2 for x in bc]\n\npath5 = [[1], [0, 2], [1, 3], [2, 4], [3]]\nprint(betweenness(5, path5))  # [0.0, 3.0, 4.0, 3.0, 0.0]"
  },
  "more": "- dependency recurrence: delta[u] += sigma[u] / sigma[w] * (1 + delta[w]) for each predecessor u of w.\n- Undirected graphs count every pair twice (once per direction), hence the final halving.\n- Weighted graphs replace BFS with Dijkstra, same accumulation.\n- Normalisation by (n-1)(n-2)/2 gives scores in [0, 1] for undirected graphs.\n- High betweenness = bottleneck or bridge-like nodes; closeness and degree measure different things.",
  "cx": "Time O(V E) for unweighted graphs (O(V E + V^2 log V) weighted), space O(V + E). The naive all-pairs method is O(V^3).",
  "see": [
   "#/topic/graphs",
   "#/topic/shortest-paths",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\ndef brute(n, adj):\n    INF = 10 ** 9\n    d = [[0 if i == j else (1 if j in adj[i] else INF) for j in range(n)] for i in range(n)]\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                d[i][j] = min(d[i][j], d[i][k] + d[k][j])\n    sig = [[0] * n for _ in range(n)]\n    for s in range(n):                                 # path counts by dynamic programming on distance layers\n        sig[s][s] = 1\n        for v in sorted(range(n), key=lambda x: d[s][x]):\n            if v != s and d[s][v] < INF:\n                sig[s][v] = sum(sig[s][u] for u in adj[v] if d[s][u] + 1 == d[s][v])\n    bc = [0.0] * n\n    for s in range(n):\n        for t in range(s + 1, n):\n            if d[s][t] >= INF:\n                continue\n            for v in range(n):\n                if v not in (s, t) and d[s][v] + d[v][t] == d[s][t]:\n                    bc[v] += sig[s][v] * sig[v][t] / sig[s][t]\n    return bc\nrng = random.Random(43)\nfor _ in range(200):\n    n = rng.randint(1, 8)\n    adj = [sorted(a) for a in rand_graph(rng, n, rng.random())]\n    got, exp = betweenness(n, adj), brute(n, adj)\n    assert all(abs(x - y) < 1e-9 for x, y in zip(got, exp)), (n, adj, got, exp)\nassert betweenness(5, [[1], [0, 2], [1, 3], [2, 4], [3]]) == [0.0, 3.0, 4.0, 3.0, 0.0]\nassert betweenness(3, [[1, 2], [0, 2], [0, 1]]) == [0.0, 0.0, 0.0]"
 },
 {
  "id": "cf-closeness-centrality",
  "title": "Closeness centrality",
  "cat": "Graphs: other",
  "q": [
   "what is closeness centrality",
   "how to compute closeness centrality",
   "closeness centrality explained",
   "closeness centrality in python",
   "implement closeness centrality",
   "closeness centrality code bfs",
   "closeness vs betweenness",
   "closeness centrality disconnected graph"
  ],
  "tags": "closeness centrality bfs average distance harmonic centrality wasserman faust graph centrality shortest path sum",
  "a": "Closeness of v measures how near v is to everyone else: (number of reachable other vertices) / (sum of shortest distances to them). Run one BFS per vertex. For a disconnected graph, multiply by (reachable / (n-1)) so isolated parts are not rewarded (the Wasserman-Faust correction). Higher means more central.",
  "code": {
   "py": "from collections import deque\n\ndef closeness(n, adj):\n    \"\"\"Unweighted closeness with the Wasserman-Faust correction for disconnected graphs.\"\"\"\n    result = []\n    for s in range(n):\n        dist = {s: 0}\n        q = deque([s])\n        while q:\n            u = q.popleft()\n            for v in adj[u]:\n                if v not in dist:\n                    dist[v] = dist[u] + 1\n                    q.append(v)\n        reach = len(dist) - 1                            # other vertices reachable from s\n        total = sum(dist.values())\n        if total == 0 or n <= 1:\n            result.append(0.0)\n        else:\n            result.append((reach / total) * (reach / (n - 1)))\n    return result\n\nprint(closeness(5, [[1], [0, 2], [1, 3], [2, 4], [3]]))  # middle vertex 4/6 = 0.667 is highest"
  },
  "more": "- Raw closeness would be infinite or misleading on disconnected graphs; the correction scales by the fraction of the graph that is reachable.\n- Harmonic centrality (sum of 1/distance) handles unreachable vertices naturally with no special case.\n- Weighted graphs: use Dijkstra instead of BFS.\n- Closeness says \"close to everything on average\"; betweenness says \"lies between others\". They can disagree sharply.",
  "cx": "Time O(V (V + E)) for unweighted graphs, space O(V). Weighted: O(V E log V).",
  "see": [
   "#/topic/graphs",
   "#/topic/shortest-paths",
   "#/cheatsheets/graphs"
  ],
  "check": "import itertools, random\ndef rand_graph(rng, n, p=0.5):\n    adj = [set() for _ in range(n)]\n    for a in range(n):\n        for b in range(a + 1, n):\n            if rng.random() < p:\n                adj[a].add(b); adj[b].add(a)\n    return adj\n\nrng = random.Random(44)\nfor _ in range(200):\n    n = rng.randint(1, 8)\n    adj = [sorted(a) for a in rand_graph(rng, n, rng.random())]\n    INF = 10 ** 9\n    d = [[0 if i == j else (1 if j in adj[i] else INF) for j in range(n)] for i in range(n)]\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                d[i][j] = min(d[i][j], d[i][k] + d[k][j])\n    got = closeness(n, adj)\n    for s in range(n):\n        ds = [d[s][t] for t in range(n) if t != s and d[s][t] < INF]\n        exp = (len(ds) / sum(ds)) * (len(ds) / (n - 1)) if ds else 0.0\n        assert abs(got[s] - exp) < 1e-12\np5 = closeness(5, [[1], [0, 2], [1, 3], [2, 4], [3]])\nassert abs(p5[2] - 4 / 6) < 1e-12 and abs(p5[0] - 4 / 10) < 1e-12 and p5[2] == max(p5)\nassert closeness(1, [[]]) == [0.0]"
 },
 {
  "id": "cf-label-propagation",
  "title": "Label propagation community detection",
  "cat": "Graphs: other",
  "q": [
   "what is label propagation",
   "community detection algorithm",
   "label propagation in python",
   "implement label propagation communities",
   "label propagation code",
   "label propagation vs louvain",
   "fast community detection in a graph",
   "find clusters in a network"
  ],
  "tags": "label propagation community detection clustering graph communities raghavan asynchronous majority vote near linear time",
  "a": "Label propagation gives every vertex its own label, then repeatedly visits vertices in random order and sets each to the label most common among its neighbours (keep the current one on ties). Densely connected groups converge to a shared label; stop when every vertex already has a most-common label. It is near-linear time but non-deterministic.",
  "code": {
   "py": "import random\nfrom collections import Counter\n\ndef label_propagation(n, adj, seed=0, max_rounds=100):\n    \"\"\"adj[u] = neighbours. Returns a label per vertex (labels are vertex ids of the group).\"\"\"\n    rng = random.Random(seed)\n    label = list(range(n))\n    nodes = list(range(n))\n    for _ in range(max_rounds):\n        rng.shuffle(nodes)                              # random order avoids oscillation\n        changed = False\n        for u in nodes:\n            if not adj[u]:\n                continue\n            cnt = Counter(label[v] for v in adj[u])\n            top = max(cnt.values())\n            if cnt[label[u]] == top:\n                continue                                # already one of the most common labels: keep it\n            label[u] = rng.choice([l for l, c in cnt.items() if c == top])\n            changed = True\n        if not changed:\n            break\n    return label\n\n# two triangles joined by one edge\nadj = [{1, 2}, {0, 2}, {0, 1, 3}, {2, 4, 5}, {3, 5}, {3, 4}]\nlabels = label_propagation(6, adj, seed=3)\nprint(len(set(labels)))  # usually 2 communities (may be 1 on an unlucky run)"
  },
  "more": "- Why it converges to communities: a label spreads fastest inside dense regions and can only cross sparse links when it wins the local vote.\n- Results vary with the order and tie-breaks; run several seeds and take consensus, or use Louvain for a deterministic quality score (modularity).\n- Synchronous updates can oscillate on bipartite-like structure, so update asynchronously in random order.\n- Isolated vertices stay alone.",
  "cx": "Each round O(V + E) (counting neighbour labels); usually a handful of rounds, not guaranteed polynomial. Space O(V + E).",
  "see": [
   "#/topic/graphs",
   "#/topic/union-find"
  ],
  "check": "import random\nfrom collections import Counter\nfor seed in range(40):\n    adj = [{1, 2}, {0, 2}, {0, 1}, {4, 5}, {3, 5}, {3, 4}]        # two disjoint triangles\n    lab = label_propagation(6, adj, seed=seed)\n    assert lab[0] == lab[1] == lab[2] and lab[3] == lab[4] == lab[5] and lab[0] != lab[3]\nrng = random.Random(45)\nfor _ in range(100):\n    n = rng.randint(1, 10)\n    adj = [set() for _ in range(n)]\n    for _ in range(rng.randint(0, 20)):\n        a, b = rng.randrange(n), rng.randrange(n)\n        if a != b:\n            adj[a].add(b); adj[b].add(a)\n    lab = label_propagation(n, adj, seed=rng.randrange(10**6), max_rounds=1000)\n    for u in range(n):                                              # converged: every label is a most-common neighbour label\n        if adj[u]:\n            cnt = Counter(lab[v] for v in adj[u])\n            assert cnt[lab[u]] == max(cnt.values())\nassert label_propagation(3, [set(), set(), set()]) == [0, 1, 2]"
 },
 {
  "id": "cf-louvain-modularity",
  "title": "Louvain community detection (local-moving phase and modularity)",
  "cat": "Graphs: other",
  "q": [
   "what is the louvain algorithm",
   "explain louvain community detection",
   "what is modularity in graphs",
   "louvain in python",
   "implement modularity optimization",
   "louvain method code",
   "louvain vs label propagation",
   "maximise modularity greedily"
  ],
  "tags": "louvain modularity community detection greedy local moving aggregation clustering blondel network communities",
  "a": "Modularity Q scores a partition: the fraction of edges inside communities minus what a random graph with the same degrees would give. Louvain greedily maximises Q in two repeated phases: (1) move each vertex to the neighbouring community with the best gain until nothing improves, (2) merge communities into super-vertices and repeat. This entry implements phase 1 and Q; aggregation is the same loop on the merged graph.",
  "code": {
   "py": "from collections import defaultdict\n\ndef modularity(n, edges, comm):\n    \"\"\"edges: (u, v, w) undirected. comm[u] = community id.\"\"\"\n    m2 = 2 * sum(w for _, _, w in edges)               # 2m\n    if m2 == 0:\n        return 0.0\n    deg = [0.0] * n\n    inside = defaultdict(float)\n    for u, v, w in edges:\n        deg[u] += w\n        deg[v] += w\n        if comm[u] == comm[v]:\n            inside[comm[u]] += 2 * w\n    tot = defaultdict(float)\n    for u in range(n):\n        tot[comm[u]] += deg[u]\n    return sum(inside[c] / m2 - (tot[c] / m2) ** 2 for c in tot)\n\ndef louvain_phase1(n, edges):\n    \"\"\"Local moving phase. Returns (community_list, modularity).\"\"\"\n    adj = [defaultdict(float) for _ in range(n)]\n    deg = [0.0] * n\n    for u, v, w in edges:\n        if u != v:\n            adj[u][v] += w\n            adj[v][u] += w\n        deg[u] += w\n        deg[v] += w\n    m2 = sum(deg)                                       # 2m\n    comm = list(range(n))\n    tot = deg[:]                                         # total degree of each community\n    moved = True\n    while moved and m2 > 0:\n        moved = False\n        for u in range(n):\n            old = comm[u]\n            links = defaultdict(float)                   # weight from u to each neighbouring community\n            for v, w in adj[u].items():\n                links[comm[v]] += w\n            tot[old] -= deg[u]                           # take u out of its community\n            best, best_gain = old, links[old] - tot[old] * deg[u] / m2\n            for c, k in links.items():\n                gain = k - tot[c] * deg[u] / m2          # modularity gain of joining c (up to a constant)\n                if gain > best_gain + 1e-12:\n                    best, best_gain = c, gain\n            tot[best] += deg[u]\n            if best != old:\n                comm[u] = best\n                moved = True\n    return comm, modularity(n, edges, comm)\n\nedges = [(0, 1, 1), (1, 2, 1), (0, 2, 1), (3, 4, 1), (4, 5, 1), (3, 5, 1), (2, 3, 1)]\ncomm, q = louvain_phase1(6, edges)\nprint(len(set(comm)), round(q, 3))  # 2 communities, Q = 0.357"
  },
  "more": "- Moving u from its community into C changes Q by (k_u,in(C) - tot(C) * k_u / 2m) / m, up to terms constant across candidates; the loop only compares these.\n- The result depends on vertex order and is a local optimum, not the global maximum of Q (which is NP-hard).\n- Modularity has a resolution limit: very small communities can be merged.\n- Full Louvain: after phase 1 build a graph whose nodes are communities (edge weights summed, self-loops keep inside weight) and repeat.",
  "cx": "Phase 1 passes cost O(E) each, few passes in practice; the full multi-level algorithm is close to O(E log V) empirically with no worst-case guarantee. Space O(V + E).",
  "see": [
   "#/topic/graphs",
   "#/topic/union-find"
  ],
  "check": "import random\ndef q_brute(n, edges, comm):\n    A = [[0.0] * n for _ in range(n)]\n    for u, v, w in edges:\n        A[u][v] += w\n        A[v][u] += w\n    k = [sum(r) for r in A]\n    m2 = sum(k)\n    if m2 == 0:\n        return 0.0\n    return sum(A[i][j] - k[i] * k[j] / m2 for i in range(n) for j in range(n) if comm[i] == comm[j]) / m2\nrng = random.Random(46)\nfor _ in range(200):\n    n = rng.randint(1, 9)\n    edges = [(rng.randrange(n), rng.randrange(n), rng.randint(1, 3)) for _ in range(rng.randint(0, 16))]\n    comm = [rng.randrange(3) for _ in range(n)]\n    assert abs(modularity(n, edges, comm) - q_brute(n, edges, comm)) < 1e-9\n    c, q = louvain_phase1(n, edges)\n    assert abs(q - q_brute(n, edges, c)) < 1e-9\n    assert q >= q_brute(n, edges, list(range(n))) - 1e-9           # never worse than all-singletons\ntri = [(0, 1, 1), (1, 2, 1), (0, 2, 1), (3, 4, 1), (4, 5, 1), (3, 5, 1), (2, 3, 1)]\nc, q = louvain_phase1(6, tri)\nassert c[0] == c[1] == c[2] and c[3] == c[4] == c[5] and c[0] != c[3]\nassert abs(q - 5 / 14) < 1e-9"
 },
 {
  "id": "cf-random-walk-graph",
  "title": "Random walks on graphs: stationary distribution and hitting times",
  "cat": "Graphs: other",
  "q": [
   "what is a random walk on a graph",
   "stationary distribution of a random walk on a graph",
   "expected hitting time in a graph",
   "random walk graph python",
   "simulate a random walk on a graph",
   "hitting time linear equations",
   "random walk degree proportional stationary",
   "how long does a random walk take to reach a vertex"
  ],
  "tags": "random walk graph markov chain stationary distribution hitting time degree 2m cover time transition matrix expected steps",
  "a": "A random walk moves from a vertex to a uniformly random neighbour each step. On a connected, non-bipartite undirected graph the long-run probability of being at v is degree(v) / 2m. Expected hitting times to a target t solve linear equations h(v) = 1 + average of h(neighbour), with h(t) = 0.",
  "code": {
   "py": "import random\nfrom fractions import Fraction\n\ndef stationary(n, adj):\n    \"\"\"Stationary distribution of the simple random walk on a connected undirected graph: deg / 2m.\"\"\"\n    total = sum(len(a) for a in adj)\n    return [Fraction(len(a), total) for a in adj]\n\ndef simulate(adj, start, steps, seed=0):\n    rng = random.Random(seed)\n    counts = [0] * len(adj)\n    v = start\n    for _ in range(steps):\n        v = rng.choice(adj[v])\n        counts[v] += 1\n    return [c / steps for c in counts]\n\ndef hitting_times(n, adj, target):\n    \"\"\"Exact expected steps to reach target from each vertex (Gaussian elimination with Fractions).\"\"\"\n    idx = [v for v in range(n) if v != target]\n    pos = {v: i for i, v in enumerate(idx)}\n    m = len(idx)\n    A = [[Fraction(0)] * (m + 1) for _ in range(m)]       # h(v) - avg_{w~v} h(w) = 1, with h(target) = 0\n    for v in idx:\n        r = pos[v]\n        A[r][r] += 1\n        A[r][m] = Fraction(1)\n        for w in adj[v]:\n            if w != target:\n                A[r][pos[w]] -= Fraction(1, len(adj[v]))\n    for c in range(m):\n        p = next(r for r in range(c, m) if A[r][c] != 0)\n        A[c], A[p] = A[p], A[c]\n        A[c] = [x / A[c][c] for x in A[c]]\n        for r in range(m):\n            if r != c and A[r][c] != 0:\n                f = A[r][c]\n                A[r] = [x - f * y for x, y in zip(A[r], A[c])]\n    h = [Fraction(0)] * n\n    for v in idx:\n        h[v] = A[pos[v]][m]\n    return h\n\npath = [[1], [0, 2], [1]]                                  # path 0 - 1 - 2\nprint(stationary(3, path))          # [Fraction(1, 4), Fraction(1, 2), Fraction(1, 4)]\nprint(hitting_times(3, path, 2))    # [Fraction(4, 1), Fraction(3, 1), Fraction(0, 1)]"
  },
  "more": "- Detailed balance: pi(u) / deg(u) is the same for every vertex in an undirected graph, which gives pi(v) = deg(v) / 2m directly.\n- Bipartite graphs have periodic walks: the distribution does not converge (use a lazy walk that stays put with probability 1/2).\n- Expected return time to v is 2m / deg(v).\n- Hitting time to a vertex is not symmetric; commute times are.\n- PageRank is a random walk with teleportation for directed graphs.",
  "cx": "Stationary distribution: O(V + E). Exact hitting times: O(V^3) Gaussian elimination (with Fraction growth). Simulation: O(steps). Space O(V^2) for the system.",
  "see": [
   "#/topic/graphs",
   "#/topic/math"
  ],
  "check": "tri_tail = [[1, 2], [0, 2], [0, 1, 3], [2]]               # triangle with a pendant vertex\npi = stationary(4, tri_tail)\nassert sum(pi) == 1 and pi == [Fraction(2, 8), Fraction(2, 8), Fraction(3, 8), Fraction(1, 8)]\n# stationary distribution is a fixed point: pi[v] = sum over neighbours u of pi[u] / deg(u)\nfor v in range(4):\n    assert pi[v] == sum(pi[u] / len(tri_tail[u]) for u in tri_tail[v])\nsim = simulate(tri_tail, 0, 200000, seed=1)\nassert all(abs(float(a) - b) < 0.01 for a, b in zip(pi, sim))\nh = hitting_times(3, [[1], [0, 2], [1]], 2)\nassert h == [4, 3, 0]\nh2 = hitting_times(4, tri_tail, 3)\nfor v in range(3):                                          # first-step analysis equations hold\n    assert h2[v] == 1 + sum(h2[w] for w in tri_tail[v]) / len(tri_tail[v])\nassert h2[3] == 0"
 }
]);
})();
