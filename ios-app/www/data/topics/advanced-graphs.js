/* Offer Ready: Advanced graphs (Eulerian paths, bridges and articulation points, strongly connected components,
   bipartite coloring, modeling). Schema: README.md, "Adding content".
   Every runnable snippet is checked by tools/verify_content.py in each language it is written in.
   Exceptions: Reconstruct Itinerary (332) has string-list arguments the verifier has no Java/C++ type for, so its
   Java and C++ solutions were compiled and run by hand; the Kosaraju variation is py and js only. */
(function () {
  var OR = (window.OR = window.OR || {});

  (OR.topics = OR.topics || []).push({
    id: 'advanced-graphs',

    hook: 'Plain BFS and DFS answer “can I get there?” These tools answer sharper questions: which single road, if closed, splits the network? Which junction is the one everything depends on? Can one walk cross every street exactly once? Which accounts follow each other in a closed loop? Each is a short idea on top of DFS (a clock, a stack, or a degree count), they sit at the hard end of interview sets (Reconstruct Itinerary, Critical Connections, Valid Arrangement of Pairs), and a candidate who names the right tool in the first minute stands out. They are rare, so this is a late topic: learn it after graphs and topological sort.',

    cues: [
      'You must walk **every edge exactly once** (every street, every ticket, every domino): an **Eulerian path or circuit**, decided by **degree counts**, built by Hierholzer’s algorithm.',
      'The question asks which **single link, if removed, disconnects** the network (a **bridge**, also called a critical connection), or which **single node** (an **articulation point**, or cut vertex).',
      'In a **directed** graph, you must group nodes that **can all reach each other** (strongly connected components), often to shrink the graph into a DAG of groups and then process it in topological order.',
      'You must decide whether nodes can be split into **two sides with every edge crossing** (a bipartite graph, “two teams”, “no odd cycle”): color with BFS.',
      'Items must be re-labeled as nodes before any algorithm applies: pairs of words, domino-like pieces, states of a puzzle. The skill is **modeling**: what is a node, what is an edge, and is the graph directed?',
      'The trap: if the question only asks for reachability, a distance, or a merge order, you do not need any of this. Use BFS, Dijkstra or [union-find](#/topic/union-find), and see [graphs](#/topic/graphs).'
    ],

    intuition: [
      'Start with the **Eulerian question**, because it has the cleanest rule. You are a street sweeper who must drive down every street exactly once. At each junction you arrive on one street and leave on another, so the streets at every junction pair up into “in” and “out”. That works out only if every junction has an **even** number of streets. The two exceptions are where you start and where you end, which may have an odd number. So for an undirected graph: all degrees even gives a closed loop (a **circuit**), exactly two odd degrees gives an open **path** between those two, and anything else is impossible. In a directed graph, in-degree must equal out-degree everywhere, except a start with one extra out and an end with one extra in. The graph must also be connected over the edges that exist. **Hierholzer’s algorithm** builds the route: walk edges until you are stuck (you can only be stuck at the end point), then back up and splice in the side loops you skipped. In code that is a DFS that appends a node to the answer **when it has no unused edges left**, and then reverses the answer.',
      'Now the **low-link idea**, for bridges and cut points. Run a DFS on an undirected graph and stamp each node with a **discovery time** `disc` (the order of first visit). The edges the DFS walks to unvisited nodes form a tree; every other edge is a **back edge** that connects a node to one of its ancestors. For each node keep `low[u]`: the earliest discovery time you can reach from u’s subtree using tree edges downward and **at most one** back edge. Think of each subtree as a hanging basket tied to its parent by one rope (the tree edge). The back edges are extra ropes tying the basket higher up. If **no** rope from inside child v’s subtree reaches u or above, the single tree edge u-v is all that holds the basket: cut it and the basket falls off. That is the **bridge test**: `low[v] > disc[u]`.',
      'The **articulation test** is a hair weaker. Removing node u (not an edge) also kills the tree edge, so it is enough that no back edge from v’s subtree reaches **strictly above** u, and reaching u itself does not help: `low[v] >= disc[u]` for a non-root u. The **root** is a special case: it has no “above”, so it is a cut point exactly when it has **two or more DFS children** (they could not reach each other any other way).',
      '**Strongly connected components** are the directed version of “connected piece”. Two nodes are in the same SCC when each can reach the other. Tarjan’s algorithm reuses the same clock and low-link, plus a **stack of nodes that are still open**: when `low[u] == disc[u]`, nothing in u’s subtree climbs above u, so u is the head of a component, and everything above u on the stack is exactly that component. Pop it. **Kosaraju’s** version is easier to remember and slower to type: DFS once to record finishing order, reverse every edge, then DFS again in reverse finishing order. Each tree of the second pass is one component.',
      'The last tool is a one-line one. A graph is **bipartite** (two-colorable) exactly when it has no cycle of odd length. BFS from any node, give neighbors the opposite color, and if an edge ever joins two nodes of the same color, you have found an odd cycle. Remember to start a fresh search from every unvisited node, since the graph may be in pieces.'
    ].join('\n\n'),

    viz: 'tarjan',

    template: {
      title: 'Tarjan low-link: bridges and articulation points (undirected DFS)',
      note: 'One DFS finds **both** answers. `disc[u]` is the visit time and `low[u]` the earliest time reachable from u’s subtree with one back edge. Every edge carries an **id** so the DFS skips only the exact edge it arrived by: skipping by parent node would wrongly call two parallel edges a bridge. After a child returns, **lift** its low into the parent. If `low[v] > disc[u]` the tree edge u-v is a **bridge**; if `low[v] >= disc[u]` and u is not the root, u is an **articulation point**; the root is one when it has more than one DFS child. The function returns the bridges as `[u, v]` rows followed by one `[c]` row per cut vertex (rows are told apart by length). This version is recursive for clarity: for graphs with 10⁵ nodes use an explicit stack, as the Critical Connections solution below does.',
      code: {
        py: `def lowlink(n, edges):
    adj = [[] for _ in range(n)]
    for i, (a, b) in enumerate(edges):
        adj[a].append((b, i))                        #> Keep the edge id with each neighbor
        adj[b].append((a, i))
    disc = [-1] * n                                  #> -1 means not visited yet
    low = [0] * n
    timer = 0
    bridges, cuts = [], set()

    def dfs(u, parent_edge):
        nonlocal timer
        disc[u] = low[u] = timer                     #@visit > Stamp the visit time; low starts at the same value
        timer += 1
        kids = 0
        for v, i in adj[u]:
            if i == parent_edge:                     #@skip > Skip only the edge we arrived by (parallel edges still count)
                continue
            if disc[v] != -1:                        #@back > Back edge: u can reach v's earlier time directly
                low[u] = min(low[u], disc[v])
            else:
                kids += 1
                dfs(v, i)                            #@tree > Tree edge: go down into the unvisited neighbor
                low[u] = min(low[u], low[v])         #@lift > Pull the child's reach up into u
                if low[v] > disc[u]:                 #@bridge > Nothing in v's subtree reaches u or above: u-v is a bridge
                    bridges.append([min(u, v), max(u, v)])
                if parent_edge != -1 and low[v] >= disc[u]:   #@cut > Nothing reaches above u: removing u cuts v's subtree off
                    cuts.add(u)
        if parent_edge == -1 and kids > 1:           #@cut > The root is a cut point when it has two or more DFS children
            cuts.add(u)

    for s in range(n):
        if disc[s] == -1:
            dfs(s, -1)
    return bridges + [[c] for c in sorted(cuts)]`,
        js: `function lowlink(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => {
    adj[a].push([b, i]);                             //> Keep the edge id with each neighbor
    adj[b].push([a, i]);
  });
  const disc = new Array(n).fill(-1);                //> -1 means not visited yet
  const low = new Array(n).fill(0);
  let timer = 0;
  const bridges = [], cuts = new Set();

  function dfs(u, parentEdge) {
    disc[u] = low[u] = timer++;                      //@visit > Stamp the visit time; low starts at the same value
    let kids = 0;
    for (const [v, i] of adj[u]) {
      if (i === parentEdge) continue;                //@skip > Skip only the edge we arrived by (parallel edges still count)
      if (disc[v] !== -1) {                          //@back > Back edge: u can reach v's earlier time directly
        low[u] = Math.min(low[u], disc[v]);
      } else {
        kids++;
        dfs(v, i);                                   //@tree > Tree edge: go down into the unvisited neighbor
        low[u] = Math.min(low[u], low[v]);           //@lift > Pull the child's reach up into u
        if (low[v] > disc[u])                        //@bridge > Nothing in v's subtree reaches u or above: u-v is a bridge
          bridges.push([Math.min(u, v), Math.max(u, v)]);
        if (parentEdge !== -1 && low[v] >= disc[u])  //@cut > Nothing reaches above u: removing u cuts v's subtree off
          cuts.add(u);
      }
    }
    if (parentEdge === -1 && kids > 1) cuts.add(u);  //@cut > The root is a cut point when it has two or more DFS children
  }

  for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s, -1);
  return [...bridges, ...[...cuts].sort((x, y) => x - y).map((c) => [c])];
}`,
        java: `class Solution {
    List<List<int[]>> adj;
    int[] disc, low;
    boolean[] cut;
    int timer;
    List<List<Integer>> bridges;

    void dfs(int u, int parentEdge) {
        disc[u] = low[u] = timer++;                              //@visit > Stamp the visit time; low starts at the same value
        int kids = 0;
        for (int[] e : adj.get(u)) {
            int v = e[0], id = e[1];
            if (id == parentEdge) continue;                      //@skip > Skip only the edge we arrived by (parallel edges still count)
            if (disc[v] != -1) {                                 //@back > Back edge: u can reach v's earlier time directly
                low[u] = Math.min(low[u], disc[v]);
            } else {
                kids++;
                dfs(v, id);                                      //@tree > Tree edge: go down into the unvisited neighbor
                low[u] = Math.min(low[u], low[v]);               //@lift > Pull the child's reach up into u
                if (low[v] > disc[u])                            //@bridge > Nothing in v's subtree reaches u or above: u-v is a bridge
                    bridges.add(List.of(Math.min(u, v), Math.max(u, v)));
                if (parentEdge != -1 && low[v] >= disc[u])       //@cut > Nothing reaches above u: removing u cuts v's subtree off
                    cut[u] = true;
            }
        }
        if (parentEdge == -1 && kids > 1) cut[u] = true;         //@cut > The root is a cut point when it has two or more DFS children
    }

    public List<List<Integer>> lowlink(int n, int[][] edges) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < edges.length; i++) {
            adj.get(edges[i][0]).add(new int[]{edges[i][1], i}); //> Keep the edge id with each neighbor
            adj.get(edges[i][1]).add(new int[]{edges[i][0], i});
        }
        disc = new int[n];
        Arrays.fill(disc, -1);                                   //> -1 means not visited yet
        low = new int[n];
        cut = new boolean[n];
        timer = 0;
        bridges = new ArrayList<>();
        for (int s = 0; s < n; s++) if (disc[s] == -1) dfs(s, -1);
        List<List<Integer>> res = new ArrayList<>(bridges);
        for (int v = 0; v < n; v++) if (cut[v]) res.add(List.of(v));
        return res;
    }
}`,
        cpp: `class Solution {
    vector<vector<pair<int, int>>> adj;
    vector<int> disc, low;
    vector<bool> cut;
    int timer;
    vector<vector<int>> bridges;

    void dfs(int u, int parentEdge) {
        disc[u] = low[u] = timer++;                              //@visit > Stamp the visit time; low starts at the same value
        int kids = 0;
        for (auto [v, id] : adj[u]) {
            if (id == parentEdge) continue;                      //@skip > Skip only the edge we arrived by (parallel edges still count)
            if (disc[v] != -1) {                                 //@back > Back edge: u can reach v's earlier time directly
                low[u] = min(low[u], disc[v]);
            } else {
                kids++;
                dfs(v, id);                                      //@tree > Tree edge: go down into the unvisited neighbor
                low[u] = min(low[u], low[v]);                    //@lift > Pull the child's reach up into u
                if (low[v] > disc[u])                            //@bridge > Nothing in v's subtree reaches u or above: u-v is a bridge
                    bridges.push_back({min(u, v), max(u, v)});
                if (parentEdge != -1 && low[v] >= disc[u])       //@cut > Nothing reaches above u: removing u cuts v's subtree off
                    cut[u] = true;
            }
        }
        if (parentEdge == -1 && kids > 1) cut[u] = true;         //@cut > The root is a cut point when it has two or more DFS children
    }

public:
    vector<vector<int>> lowlink(int n, vector<vector<int>> edges) {
        adj.assign(n, {});
        for (int i = 0; i < (int)edges.size(); i++) {
            adj[edges[i][0]].push_back({edges[i][1], i});        //> Keep the edge id with each neighbor
            adj[edges[i][1]].push_back({edges[i][0], i});
        }
        disc.assign(n, -1);                                      //> -1 means not visited yet
        low.assign(n, 0);
        cut.assign(n, false);
        timer = 0;
        bridges.clear();
        for (int s = 0; s < n; s++) if (disc[s] == -1) dfs(s, -1);
        vector<vector<int>> res = bridges;
        for (int v = 0; v < n; v++) if (cut[v]) res.push_back({v});
        return res;
    }
};`
      },
      tests: { fn: 'lowlink', sig: { args: ['int', 'int[][]'] }, compare: 'deep', cases: [
        { args: [4, [[0, 1], [1, 2], [2, 0], [1, 3]]], out: [[1, 3], [1]] },
        { args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], out: [[0, 1], [1, 2], [2, 3], [3, 4], [1], [2], [3]] },
        { args: [6, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3]]], out: [[2, 3], [2], [3]] },
        { args: [4, [[0, 1], [1, 2], [2, 3], [3, 0]]], out: [] },
        { args: [4, [[0, 1], [0, 2], [0, 3]]], out: [[0, 1], [0, 2], [0, 3], [0]] },
        { args: [5, [[0, 1], [0, 1], [1, 2], [3, 4]]], out: [[1, 2], [3, 4], [1]] },
        { args: [1, []], out: [] },
        { args: [6, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 1], [4, 5]]], out: [[4, 5], [1], [4]] }] }
    },

    complexity: {
      time: 'O(V + E): every node is visited once and every edge looked at twice',
      space: 'O(V + E) for the adjacency lists, plus O(V) for disc, low and the recursion (or explicit stack)',
      why: 'Each of the three algorithms is one DFS. Tarjan low-link touches each adjacency entry once (two per undirected edge) and does constant work per entry: a comparison and a min. Hierholzer uses each edge exactly once because an edge is removed from its list when it is taken. SCC (Tarjan or Kosaraju) is two linear passes at worst. Bipartite coloring is a BFS. If edges are kept in a heap or sorted, as in Reconstruct Itinerary for the smallest-name rule, add a log: O(E log E).',
      trap: 'Recursion depth. A path-like graph with 10⁵ nodes makes the DFS 10⁵ calls deep: Python stops near 1000 by default and Java around 10⁴ frames. For big inputs write the DFS with an explicit stack and a per-node “next neighbor” index, or run in a thread with a bigger stack. Also, the answer must be **lists of edges or nodes**, not counts: sort or normalize `[u, v]` with `u < v` if the checker compares them.'
    },

    variations: [
      {
        name: 'Eulerian path and circuit: degree conditions and Hierholzer',
        body: '**Check the degrees first, then build.** Undirected: every degree even means a **circuit** (start anywhere that has an edge); exactly two odd degrees means a **path** that must start at one odd node and end at the other; any other count means none exists. Directed: every node has `out == in` for a circuit; for a path, exactly one node has `out - in = 1` (the start) and one has `in - out = 1` (the end). Besides degrees, all edges must lie in **one** connected piece, and the easiest way to check that is at the end: if the route you built has fewer than `edges + 1` nodes, some edges were unreachable, so there is no valid route. **Hierholzer:** keep a stack that starts with the start node. While the top node still has an unused edge, take one and push its other end; when the top has none, pop it **onto the answer**. The answer comes out backwards, so reverse it. Popping on dead ends is what splices side loops into the route in the right place. Taking the **smallest** neighbor each time (a sorted list popped from the back, or a min-heap) gives the lexicographically smallest route, which is the Reconstruct Itinerary rule. This version is directed, with nodes 0 to n − 1; it returns the node sequence, or an empty list when no route exists.',
        code: {
          py: `def eulerPath(n, edges):
    adj = [[] for _ in range(n)]
    diff = [0] * n                                   # out-degree minus in-degree
    for a, b in edges:
        adj[a].append(b)
        diff[a] += 1
        diff[b] -= 1
    for lst in adj:
        lst.sort(reverse=True)                       # pop() now returns the smallest neighbor
    if any(abs(d) > 1 for d in diff) or diff.count(1) > 1 or diff.count(-1) > 1:
        return []                                    # degrees rule out any route
    start = diff.index(1) if 1 in diff else next((v for v in range(n) if adj[v]), -1)
    if start == -1:
        return []                                    # no edges at all
    stack, path = [start], []
    while stack:
        v = stack[-1]
        if adj[v]:
            stack.append(adj[v].pop())               # take an unused edge
        else:
            path.append(stack.pop())                 # dead end: this node is next in the route, from the back
    path.reverse()
    return path if len(path) == len(edges) + 1 else []   # fewer nodes: some edges were unreachable`,
          js: `function eulerPath(n, edges) {
  const adj = Array.from({ length: n }, () => []), diff = new Array(n).fill(0);   // diff = out minus in
  for (const [a, b] of edges) { adj[a].push(b); diff[a]++; diff[b]--; }
  adj.forEach((l) => l.sort((x, y) => y - x));       // pop() now returns the smallest neighbor
  let start = -1, plus = 0, minus = 0;
  for (let v = 0; v < n; v++) {
    if (Math.abs(diff[v]) > 1) return [];            // degrees rule out any route
    if (diff[v] === 1) { plus++; start = v; }
    if (diff[v] === -1) minus++;
  }
  if (plus > 1 || minus > 1) return [];
  if (start === -1) start = adj.findIndex((l) => l.length);
  if (start === -1) return [];                       // no edges at all
  const stack = [start], path = [];
  while (stack.length) {
    const v = stack[stack.length - 1];
    if (adj[v].length) stack.push(adj[v].pop());     // take an unused edge
    else path.push(stack.pop());                     // dead end: this node is next in the route, from the back
  }
  path.reverse();
  return path.length === edges.length + 1 ? path : [];   // fewer nodes: some edges were unreachable
}`,
          java: `class Solution {
    public List<Integer> eulerPath(int n, int[][] edges) {
        List<PriorityQueue<Integer>> adj = new ArrayList<>();
        int[] diff = new int[n];                                 // out-degree minus in-degree
        for (int i = 0; i < n; i++) adj.add(new PriorityQueue<>());   // a min-heap gives the smallest neighbor
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); diff[e[0]]++; diff[e[1]]--; }
        int start = -1, plus = 0, minus = 0;
        for (int v = 0; v < n; v++) {
            if (Math.abs(diff[v]) > 1) return new ArrayList<>();      // degrees rule out any route
            if (diff[v] == 1) { plus++; start = v; }
            if (diff[v] == -1) minus++;
        }
        if (plus > 1 || minus > 1) return new ArrayList<>();
        for (int v = 0; v < n && start == -1; v++) if (!adj.get(v).isEmpty()) start = v;
        if (start == -1) return new ArrayList<>();               // no edges at all
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        LinkedList<Integer> path = new LinkedList<>();
        while (!stack.isEmpty()) {
            int v = stack.peek();
            if (adj.get(v).isEmpty()) path.addFirst(stack.pop());     // dead end: next in the route, built from the back
            else stack.push(adj.get(v).poll());                  // take an unused edge
        }
        return path.size() == edges.length + 1 ? path : new ArrayList<>();   // fewer nodes: some edges were unreachable
    }
}`,
          cpp: `class Solution {
public:
    vector<int> eulerPath(int n, vector<vector<int>> edges) {
        vector<priority_queue<int, vector<int>, greater<int>>> adj(n);   // a min-heap gives the smallest neighbor
        vector<int> diff(n, 0);                                  // out-degree minus in-degree
        for (auto& e : edges) { adj[e[0]].push(e[1]); diff[e[0]]++; diff[e[1]]--; }
        int start = -1, plus = 0, minus = 0;
        for (int v = 0; v < n; v++) {
            if (abs(diff[v]) > 1) return {};                     // degrees rule out any route
            if (diff[v] == 1) { plus++; start = v; }
            if (diff[v] == -1) minus++;
        }
        if (plus > 1 || minus > 1) return {};
        for (int v = 0; v < n && start == -1; v++) if (!adj[v].empty()) start = v;
        if (start == -1) return {};                              // no edges at all
        vector<int> stack{start}, path;
        while (!stack.empty()) {
            int v = stack.back();
            if (adj[v].empty()) { path.push_back(v); stack.pop_back(); }   // dead end: next in the route, from the back
            else { int w = adj[v].top(); adj[v].pop(); stack.push_back(w); }   // take an unused edge
        }
        reverse(path.begin(), path.end());
        return path.size() == edges.size() + 1 ? path : vector<int>{};   // fewer nodes: some edges were unreachable
    }
};`
        },
        tests: { fn: 'eulerPath', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [4, [[0, 1], [1, 2], [2, 0], [0, 3]]], out: [0, 1, 2, 0, 3] },
          { args: [3, [[0, 1], [1, 2], [2, 0]]], out: [0, 1, 2, 0] },
          { args: [3, [[0, 1], [0, 2]]], out: [] },
          { args: [5, [[1, 2], [2, 1], [1, 3], [3, 4], [4, 1]]], out: [1, 2, 1, 3, 4, 1] },
          { args: [4, [[0, 1], [2, 3]]], out: [] },
          { args: [4, [[0, 1], [1, 0], [2, 3], [3, 2]]], out: [] },
          { args: [1, []], out: [] }] }
      },
      {
        name: 'Strongly connected components: Tarjan',
        body: 'Same clock and low-link as the bridge template, with two changes for a **directed** graph. There is no parent-edge skip, and a node only counts as a back edge target if it is **still on the stack** (an edge into a finished component must not pull low down, since that component is closed off). Keep a stack of nodes that have been visited but not yet assigned a component. When `low[u] == disc[u]`, u is the head of a component: pop the stack down to u and that set of nodes is one SCC. A useful fact: Tarjan emits components in **reverse topological order** of the component graph (sinks first), which is why it often replaces a separate topological sort. Returns the list of components.',
        code: {
          py: `def scc(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
    disc = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    stack, comps = [], []
    timer = 0

    def dfs(u):
        nonlocal timer
        disc[u] = low[u] = timer
        timer += 1
        stack.append(u)
        on_stack[u] = True
        for v in adj[u]:
            if disc[v] == -1:
                dfs(v)
                low[u] = min(low[u], low[v])
            elif on_stack[v]:                        # only an open node may pull low down
                low[u] = min(low[u], disc[v])
        if low[u] == disc[u]:                        # u is the head of a component: pop it off
            comp = []
            while True:
                w = stack.pop()
                on_stack[w] = False
                comp.append(w)
                if w == u:
                    break
            comps.append(comp)

    for s in range(n):
        if disc[s] == -1:
            dfs(s)
    return comps`,
          js: `function scc(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) adj[a].push(b);
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0), onStack = new Array(n).fill(false);
  const stack = [], comps = [];
  let timer = 0;
  function dfs(u) {
    disc[u] = low[u] = timer++;
    stack.push(u);
    onStack[u] = true;
    for (const v of adj[u]) {
      if (disc[v] === -1) { dfs(v); low[u] = Math.min(low[u], low[v]); }
      else if (onStack[v]) low[u] = Math.min(low[u], disc[v]);   // only an open node may pull low down
    }
    if (low[u] === disc[u]) {                        // u is the head of a component: pop it off
      const comp = [];
      let w;
      do { w = stack.pop(); onStack[w] = false; comp.push(w); } while (w !== u);
      comps.push(comp);
    }
  }
  for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s);
  return comps;
}`,
          java: `class Solution {
    List<List<Integer>> adj, comps;
    int[] disc, low;
    boolean[] onStack;
    Deque<Integer> stack;
    int timer;

    void dfs(int u) {
        disc[u] = low[u] = timer++;
        stack.push(u);
        onStack[u] = true;
        for (int v : adj.get(u)) {
            if (disc[v] == -1) { dfs(v); low[u] = Math.min(low[u], low[v]); }
            else if (onStack[v]) low[u] = Math.min(low[u], disc[v]);   // only an open node may pull low down
        }
        if (low[u] == disc[u]) {                                 // u is the head of a component: pop it off
            List<Integer> comp = new ArrayList<>();
            int w;
            do { w = stack.pop(); onStack[w] = false; comp.add(w); } while (w != u);
            comps.add(comp);
        }
    }

    public List<List<Integer>> scc(int n, int[][] edges) {
        adj = new ArrayList<>();
        comps = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]);
        disc = new int[n];
        Arrays.fill(disc, -1);
        low = new int[n];
        onStack = new boolean[n];
        stack = new ArrayDeque<>();
        timer = 0;
        for (int s = 0; s < n; s++) if (disc[s] == -1) dfs(s);
        return comps;
    }
}`,
          cpp: `class Solution {
    vector<vector<int>> adj, comps;
    vector<int> disc, low, stk;
    vector<bool> onStack;
    int timer;

    void dfs(int u) {
        disc[u] = low[u] = timer++;
        stk.push_back(u);
        onStack[u] = true;
        for (int v : adj[u]) {
            if (disc[v] == -1) { dfs(v); low[u] = min(low[u], low[v]); }
            else if (onStack[v]) low[u] = min(low[u], disc[v]);   // only an open node may pull low down
        }
        if (low[u] == disc[u]) {                                 // u is the head of a component: pop it off
            vector<int> comp;
            int w;
            do { w = stk.back(); stk.pop_back(); onStack[w] = false; comp.push_back(w); } while (w != u);
            comps.push_back(comp);
        }
    }

public:
    vector<vector<int>> scc(int n, vector<vector<int>> edges) {
        adj.assign(n, {});
        comps.clear();
        for (auto& e : edges) adj[e[0]].push_back(e[1]);
        disc.assign(n, -1);
        low.assign(n, 0);
        onStack.assign(n, false);
        stk.clear();
        timer = 0;
        for (int s = 0; s < n; s++) if (disc[s] == -1) dfs(s);
        return comps;
    }
};`
        },
        tests: { fn: 'scc', sig: { args: ['int', 'int[][]'] }, compare: 'deep', cases: [
          { args: [5, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]]], out: [[0, 1, 2], [3], [4]] },
          { args: [4, [[0, 1], [1, 2], [2, 3]]], out: [[0], [1], [2], [3]] },
          { args: [3, [[0, 1], [1, 2], [2, 0]]], out: [[0, 1, 2]] },
          { args: [6, [[0, 1], [1, 0], [2, 3], [3, 2], [1, 2], [4, 5]]], out: [[0, 1], [2, 3], [4], [5]] },
          { args: [1, []], out: [[0]] },
          { args: [7, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [5, 6]]], out: [[0, 1, 2], [3, 4, 5], [6]] }] }
      },
      {
        name: 'Strongly connected components: Kosaraju (two passes)',
        body: 'Easier to remember, a little more code. **Pass 1:** DFS the whole graph and record each node in **finishing order** (append after all its neighbors are done). **Pass 2:** build the **reversed** graph (every edge flipped) and DFS it, starting from nodes in **reverse finishing order**. Each DFS tree you grow in pass 2 is exactly one SCC. Why it works: the node that finishes last in pass 1 sits in a source component of the component graph; in the reversed graph you cannot leave that component, so the search stays inside it. Tarjan does the same work in one pass and no reversed graph; Kosaraju is the one to write when you do not trust yourself with low-link under pressure.',
        code: {
          py: `def kosaraju(n, edges):
    g = [[] for _ in range(n)]
    rg = [[] for _ in range(n)]                      # the reversed graph
    for a, b in edges:
        g[a].append(b)
        rg[b].append(a)
    seen, order = [False] * n, []

    def first(u):
        seen[u] = True
        for v in g[u]:
            if not seen[v]:
                first(v)
        order.append(u)                              # finishing order

    for s in range(n):
        if not seen[s]:
            first(s)
    comps, comp_of = [], [-1] * n

    def second(u, c):
        comp_of[u] = c
        comps[c].append(u)
        for v in rg[u]:
            if comp_of[v] == -1:
                second(v, c)

    for s in reversed(order):                        # last to finish first
        if comp_of[s] == -1:
            comps.append([])
            second(s, len(comps) - 1)
    return comps`,
          js: `function kosaraju(n, edges) {
  const g = Array.from({ length: n }, () => []), rg = Array.from({ length: n }, () => []);   // rg: the reversed graph
  for (const [a, b] of edges) { g[a].push(b); rg[b].push(a); }
  const seen = new Array(n).fill(false), order = [];
  function first(u) {
    seen[u] = true;
    for (const v of g[u]) if (!seen[v]) first(v);
    order.push(u);                                   // finishing order
  }
  for (let s = 0; s < n; s++) if (!seen[s]) first(s);
  const comps = [], compOf = new Array(n).fill(-1);
  function second(u, c) {
    compOf[u] = c;
    comps[c].push(u);
    for (const v of rg[u]) if (compOf[v] === -1) second(v, c);
  }
  for (const s of [...order].reverse()) {            // last to finish first
    if (compOf[s] === -1) { comps.push([]); second(s, comps.length - 1); }
  }
  return comps;
}`
        },
        tests: { fn: 'kosaraju', compare: 'deep', cases: [
          { args: [5, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]]], out: [[0, 1, 2], [3], [4]] },
          { args: [4, [[0, 1], [1, 2], [2, 3]]], out: [[0], [1], [2], [3]] },
          { args: [6, [[0, 1], [1, 0], [2, 3], [3, 2], [1, 2], [4, 5]]], out: [[0, 1], [2, 3], [4], [5]] },
          { args: [7, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [5, 6]]], out: [[0, 1, 2], [3, 4, 5], [6]] }] }
      },
      {
        name: 'Bipartite check: BFS two-coloring',
        body: 'A graph is bipartite when its nodes split into two groups with **every edge between the groups**, which is the same as having **no odd cycle**. Color the start node 0, give every neighbor the opposite color, and keep going. If you meet an already-colored neighbor with the **same** color as the current node, that edge closes an odd cycle: not bipartite. Run it from **every** uncolored node, since the graph may be several pieces; one odd cycle anywhere fails the whole thing. The input here is an adjacency list (`graph[u]` lists the neighbors of u). DFS with the same rule works too. Union-find can do it with a “node and its opposite” trick. Uses: “split people into two teams that avoid each other” (Possible Bipartition), “can this be 2-colored”, and detecting odd cycles.',
        code: {
          py: `def isBipartite(graph):
    color = [-1] * len(graph)                        # -1 uncolored, 0 or 1 colored
    for s in range(len(graph)):
        if color[s] != -1:
            continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in graph[u]:
                if color[v] == -1:
                    color[v] = color[u] ^ 1          # the opposite side
                    q.append(v)
                elif color[v] == color[u]:           # same side on both ends of an edge: odd cycle
                    return False
    return True`,
          js: `function isBipartite(graph) {
  const color = new Array(graph.length).fill(-1);    // -1 uncolored, 0 or 1 colored
  for (let s = 0; s < graph.length; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const q = [s];
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      for (const v of graph[u]) {
        if (color[v] === -1) { color[v] = color[u] ^ 1; q.push(v); }   // the opposite side
        else if (color[v] === color[u]) return false;                   // same side on both ends of an edge: odd cycle
      }
    }
  }
  return true;
}`,
          java: `class Solution {
    public boolean isBipartite(int[][] graph) {
        int[] color = new int[graph.length];
        Arrays.fill(color, -1);                          // -1 uncolored, 0 or 1 colored
        for (int s = 0; s < graph.length; s++) {
            if (color[s] != -1) continue;
            color[s] = 0;
            Deque<Integer> q = new ArrayDeque<>();
            q.add(s);
            while (!q.isEmpty()) {
                int u = q.poll();
                for (int v : graph[u]) {
                    if (color[v] == -1) { color[v] = color[u] ^ 1; q.add(v); }   // the opposite side
                    else if (color[v] == color[u]) return false;                  // same side on both ends of an edge: odd cycle
                }
            }
        }
        return true;
    }
}`,
          cpp: `class Solution {
public:
    bool isBipartite(vector<vector<int>> graph) {
        vector<int> color(graph.size(), -1);             // -1 uncolored, 0 or 1 colored
        for (int s = 0; s < (int)graph.size(); s++) {
            if (color[s] != -1) continue;
            color[s] = 0;
            queue<int> q;
            q.push(s);
            while (!q.empty()) {
                int u = q.front(); q.pop();
                for (int v : graph[u]) {
                    if (color[v] == -1) { color[v] = color[u] ^ 1; q.push(v); }   // the opposite side
                    else if (color[v] == color[u]) return false;                   // same side on both ends of an edge: odd cycle
                }
            }
        }
        return true;
    }
};`
        },
        tests: { fn: 'isBipartite', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]]], out: false },
          { args: [[[1, 3], [0, 2], [1, 3], [0, 2]]], out: true },
          { args: [[[1], [0], []]], out: true },
          { args: [[[1, 2], [0, 2], [0, 1]]], out: false },
          { args: [[[1], [0], [3, 4], [2, 4], [2, 3]]], out: false }] }
      },
      {
        name: 'Graph modeling: what is a node, what is an edge',
        body: 'Most hard graph problems are hard only until you pick the model. Ask four questions. **What are the nodes?** Often not the things named in the input: in Valid Arrangement the nodes are the **numbers**, and each pair is an **edge**, which turns “chain the pairs” into “walk every edge”. **Is an edge directed?** A chain with an order (this piece must be followed by that) is directed; mutual relations are not. **Do I need to visit every node or every edge?** Every node once is a Hamiltonian path (NP-hard, use bitmask DP for tiny n); every **edge** once is Eulerian and easy. That distinction is the single most useful one in this topic. **What is the state?** For puzzles (word ladder, lock combinations) a node is a whole configuration, and an edge is one legal move; then BFS finds the fewest moves. Two more habits: draw the graph for the smallest example before coding, and count the sizes (V up to 10⁵ means O(V + E) and an explicit stack, V up to 20 hints at bitmasks).'
      },
      {
        name: 'Choosing: BFS, DFS, Dijkstra, union-find, or something here',
        body: '| The question | Reach for |\n|---|---|\n| Fewest steps, every move costs the same | BFS ([graphs](#/topic/graphs)) |\n| Cheapest path, weights are non-negative | Dijkstra ([shortest paths](#/topic/shortest-paths)) |\n| Weights can be negative | Bellman-Ford |\n| Do these two nodes connect, with edges arriving over time | Union-find ([union-find](#/topic/union-find)) |\n| Order tasks by prerequisites, or detect a directed cycle | Topological sort ([topological sort](#/topic/topo-sort)) |\n| Cheapest way to connect everything | Kruskal or Prim ([minimum spanning tree](#/topic/mst)) |\n| Which one link or node, if removed, disconnects the graph | Tarjan low-link (this topic) |\n| Which directed nodes are mutually reachable | SCC: Tarjan or Kosaraju (this topic) |\n| Use every **edge** exactly once | Eulerian path: degrees, then Hierholzer (this topic) |\n| Two sides, no edge inside a side | BFS two-coloring (this topic) |\n| Explore all configurations, count or list them | DFS with backtracking |\n\nA quick rule for ties: if the data **arrives as a stream** and you only ever merge, union-find; if the graph is fixed and you need **a path or its length**, a search; if you need to know what **breaks** when something is **removed**, low-link. Say the answer out loud with the reason (“removal question, so bridges”) before you code.'
      }
    ],

    worked: [
      {
        lc: 332,
        restate: 'You have a pile of one-way plane tickets, each a pair (from, to) of airport codes. Plan one trip that starts at `JFK` and uses every ticket exactly once, listing the airports in order. A valid trip is guaranteed to exist. When more than one trip works, return the one that is smallest in dictionary order, comparing airport by airport.',
        examples: '- `[["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]` → `["JFK","MUC","LHR","SFO","SJC"]`: the tickets form a single chain.\n- `[["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]` → `["JFK","ATL","JFK","SFO","ATL","SFO"]`: going to ATL first is smaller, and it still leaves a way to use SFO and the rest.\n- Edge cases: a ticket loop back to the start; several tickets between the same two airports (they are separate tickets); the smallest-looking first move can be a **dead end** that strands remaining tickets.',
        brute: 'Backtracking: from JFK, try each unused ticket in dictionary order, recurse, and undo if you get stuck. The first complete trip you find is the smallest. It is correct but can take exponential time, because a bad early choice is only discovered many tickets later and the search re-explores the same suffixes.',
        insight: 'Airports are nodes and tickets are **directed edges**, and using every ticket exactly once is an **Eulerian path** starting at JFK. A guaranteed valid trip means the degree conditions already hold, so we only need to build the route. **Hierholzer:** walk greedily, always taking the smallest unused destination; when you reach an airport with **no unused tickets left**, that airport is the *last* stop of whatever is still unresolved, so put it into the answer **now** and step back. Dead ends get emitted first and the final answer is the reverse of the emission order. This avoids the trap of plain greedy: a plain walk commits to its order and can strand tickets, but here the back-up step repairs the order, so no choice has to be undone.',
        code: {
          py: `class Solution:
    def findItinerary(self, tickets: List[List[str]]) -> List[str]:
        adj = defaultdict(list)
        for a, b in sorted(tickets, reverse=True):   # descending, so pop() gives the smallest
            adj[a].append(b)
        stack, route = ["JFK"], []
        while stack:
            u = stack[-1]
            if adj[u]:
                stack.append(adj[u].pop())           # take the smallest unused ticket
            else:
                route.append(stack.pop())            # dead end: this airport is the last of what remains
        return route[::-1]`,
          js: `function findItinerary(tickets) {
  const adj = new Map();
  for (const [a, b] of tickets) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  }
  for (const l of adj.values()) l.sort().reverse();  // descending, so pop() gives the smallest
  const stack = ['JFK'], route = [];
  while (stack.length) {
    const u = stack[stack.length - 1], next = adj.get(u);
    if (next && next.length) stack.push(next.pop()); // take the smallest unused ticket
    else route.push(stack.pop());                    // dead end: this airport is the last of what remains
  }
  return route.reverse();
}`,
          java: `class Solution {
    public List<String> findItinerary(List<List<String>> tickets) {
        Map<String, PriorityQueue<String>> adj = new HashMap<>();   // a min-heap per airport
        for (List<String> t : tickets) adj.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
        Deque<String> stack = new ArrayDeque<>();
        stack.push("JFK");
        LinkedList<String> route = new LinkedList<>();
        while (!stack.isEmpty()) {
            String u = stack.peek();
            PriorityQueue<String> next = adj.get(u);
            if (next != null && !next.isEmpty()) stack.push(next.poll());   // take the smallest unused ticket
            else route.addFirst(stack.pop());                    // dead end: this airport is the last of what remains
        }
        return route;
    }
}`,
          cpp: `class Solution {
public:
    vector<string> findItinerary(vector<vector<string>>& tickets) {
        unordered_map<string, priority_queue<string, vector<string>, greater<string>>> adj;   // min-heap per airport
        for (auto& t : tickets) adj[t[0]].push(t[1]);
        vector<string> stk{"JFK"}, route;
        while (!stk.empty()) {
            string u = stk.back();
            auto& next = adj[u];
            if (!next.empty()) { string v = next.top(); next.pop(); stk.push_back(v); }   // take the smallest unused ticket
            else { route.push_back(u); stk.pop_back(); }         // dead end: this airport is the last of what remains
        }
        reverse(route.begin(), route.end());
        return route;
    }
};`
        },
        complexity: 'O(E log E) time: each ticket is pushed and popped once, and the sorted order (heap, or one sort) costs the log. O(E) space for the adjacency lists, the stack and the route.',
        say: '“Airports are nodes and tickets are directed edges, so using every ticket once is an Eulerian path from JFK. I run Hierholzer: keep a stack, take the smallest unused ticket from the airport on top, and when the top airport has no tickets left I pop it into the answer. Dead ends come out first, so I reverse at the end. Taking the smallest ticket first, plus the pop-on-dead-end rule, gives the lexicographically smallest route in O(E log E).”',
        followups: [
          { q: 'Why does a plain greedy walk, always taking the smallest ticket, fail on its own?', a: 'It can walk into an airport with no outgoing tickets while other tickets are still unused, leaving them stranded. Hierholzer fixes that by recording the dead end as the end of the route and returning to splice the unused loop in before it.' },
          { q: 'How would you check that a valid trip exists?', a: 'Check degrees (out minus in is 0 everywhere, except +1 at the start and -1 at the end, or all 0 for a loop) and that every ticket is reachable from the start. The cheap check after building: the route should hold tickets + 1 airports.' }
        ]
      },

      {
        lc: 1192,
        restate: 'A network has n servers numbered 0 to n − 1 and a list of two-way cables between them; every server can reach every other. A cable is **critical** if unplugging only that cable would leave some pair of servers unable to reach each other. Return all critical cables, in any order.',
        examples: '- `n = 4`, cables `[[0,1],[1,2],[2,0],[1,3]]` → `[[1,3]]`: servers 0, 1, 2 form a loop, so any one of those cables can fail; the cable to server 3 is its only link.\n- `n = 2`, cables `[[0,1]]` → `[[0,1]]`.\n- `n = 4`, a ring `0-1-2-3-0` → `[]`: in a loop, every cable has a way around.\n- Edge cases: a long chain (every cable is critical); a graph with no loops at all (a tree); the answer lists each cable once.',
        brute: 'For each cable, remove it and run a BFS to see whether everything is still reachable. That is O(E) per cable and O(E · (V + E)) in total, far too slow when there are 10⁵ servers and 10⁵ or more cables.',
        insight: 'A cable is critical exactly when it is a **bridge**, and bridges drop out of a single DFS. Stamp each server with its discovery time `disc`, and track `low[u]`, the earliest time reachable from u’s subtree using downward tree edges and one back edge. After finishing a child v of u, pull v’s low up into u. The tree edge u-v is critical when `low[v] > disc[u]`: nothing inside v’s subtree reaches u or higher, so that cable is the only rope. Skip the cable you arrived by (by its **id**, so a doubled cable still counts as a way around), and use an explicit stack because the graph can be a 10⁵-long chain.',
        code: {
          py: `class Solution:
    def criticalConnections(self, n: int, connections: List[List[int]]) -> List[List[int]]:
        adj = [[] for _ in range(n)]
        for i, (a, b) in enumerate(connections):
            adj[a].append((b, i))
            adj[b].append((a, i))
        disc, low = [-1] * n, [0] * n
        nxt = [0] * n                                # next neighbor index to try, per node
        pe = [-1] * n                                # id of the edge each node was reached by
        res, timer = [], 0
        for s in range(n):
            if disc[s] != -1:
                continue
            disc[s] = low[s] = timer
            timer += 1
            stack = [s]
            while stack:
                u = stack[-1]
                if nxt[u] < len(adj[u]):
                    v, i = adj[u][nxt[u]]
                    nxt[u] += 1
                    if i == pe[u]:
                        continue                     # do not walk back along the arrival edge
                    if disc[v] == -1:                # tree edge: go down
                        pe[v] = i
                        disc[v] = low[v] = timer
                        timer += 1
                        stack.append(v)
                    else:                            # back edge
                        low[u] = min(low[u], disc[v])
                else:                                # u is finished: report to its parent
                    stack.pop()
                    if stack:
                        p = stack[-1]
                        low[p] = min(low[p], low[u])
                        if low[u] > disc[p]:         # nothing in u's subtree reaches p or above
                            res.append([p, u])
        return res`,
          js: `function criticalConnections(n, connections) {
  const adj = Array.from({ length: n }, () => []);
  connections.forEach(([a, b], i) => { adj[a].push([b, i]); adj[b].push([a, i]); });
  const disc = new Array(n).fill(-1), low = new Array(n).fill(0);
  const nxt = new Array(n).fill(0);                  // next neighbor index to try, per node
  const pe = new Array(n).fill(-1);                  // id of the edge each node was reached by
  const res = [];
  let timer = 0;
  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    disc[s] = low[s] = timer++;
    const stack = [s];
    while (stack.length) {
      const u = stack[stack.length - 1];
      if (nxt[u] < adj[u].length) {
        const [v, i] = adj[u][nxt[u]++];
        if (i === pe[u]) continue;                   // do not walk back along the arrival edge
        if (disc[v] === -1) {                        // tree edge: go down
          pe[v] = i;
          disc[v] = low[v] = timer++;
          stack.push(v);
        } else low[u] = Math.min(low[u], disc[v]);   // back edge
      } else {                                       // u is finished: report to its parent
        stack.pop();
        if (stack.length) {
          const p = stack[stack.length - 1];
          low[p] = Math.min(low[p], low[u]);
          if (low[u] > disc[p]) res.push([p, u]);    // nothing in u's subtree reaches p or above
        }
      }
    }
  }
  return res;
}`,
          java: `class Solution {
    public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < connections.size(); i++) {
            int a = connections.get(i).get(0), b = connections.get(i).get(1);
            adj.get(a).add(new int[]{b, i});
            adj.get(b).add(new int[]{a, i});
        }
        int[] disc = new int[n], low = new int[n], nxt = new int[n], pe = new int[n];   // nxt: next neighbor index; pe: arrival edge id
        Arrays.fill(disc, -1);
        List<List<Integer>> res = new ArrayList<>();
        int timer = 0;
        for (int s = 0; s < n; s++) {
            if (disc[s] != -1) continue;
            disc[s] = low[s] = timer++;
            pe[s] = -1;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(s);
            while (!stack.isEmpty()) {
                int u = stack.peek();
                if (nxt[u] < adj.get(u).size()) {
                    int[] e = adj.get(u).get(nxt[u]++);
                    int v = e[0], id = e[1];
                    if (id == pe[u]) continue;                   // do not walk back along the arrival edge
                    if (disc[v] == -1) {                         // tree edge: go down
                        pe[v] = id;
                        disc[v] = low[v] = timer++;
                        stack.push(v);
                    } else low[u] = Math.min(low[u], disc[v]);   // back edge
                } else {                                         // u is finished: report to its parent
                    stack.pop();
                    if (!stack.isEmpty()) {
                        int p = stack.peek();
                        low[p] = Math.min(low[p], low[u]);
                        if (low[u] > disc[p]) res.add(List.of(p, u));   // nothing in u's subtree reaches p or above
                    }
                }
            }
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {
        vector<vector<pair<int, int>>> adj(n);
        for (int i = 0; i < (int)connections.size(); i++) {
            adj[connections[i][0]].push_back({connections[i][1], i});
            adj[connections[i][1]].push_back({connections[i][0], i});
        }
        vector<int> disc(n, -1), low(n, 0), nxt(n, 0), pe(n, -1);   // nxt: next neighbor index; pe: arrival edge id
        vector<vector<int>> res;
        int timer = 0;
        for (int s = 0; s < n; s++) {
            if (disc[s] != -1) continue;
            disc[s] = low[s] = timer++;
            vector<int> stk{s};
            while (!stk.empty()) {
                int u = stk.back();
                if (nxt[u] < (int)adj[u].size()) {
                    auto [v, id] = adj[u][nxt[u]++];
                    if (id == pe[u]) continue;                   // do not walk back along the arrival edge
                    if (disc[v] == -1) {                         // tree edge: go down
                        pe[v] = id;
                        disc[v] = low[v] = timer++;
                        stk.push_back(v);
                    } else low[u] = min(low[u], disc[v]);        // back edge
                } else {                                         // u is finished: report to its parent
                    stk.pop_back();
                    if (!stk.empty()) {
                        int p = stk.back();
                        low[p] = min(low[p], low[u]);
                        if (low[u] > disc[p]) res.push_back({p, u});   // nothing in u's subtree reaches p or above
                    }
                }
            }
        }
        return res;
    }
};`
        },
        complexity: 'O(V + E) time and space: each adjacency entry is looked at once, and the explicit stack holds at most V nodes.',
        say: '“A cable is critical exactly when it is a bridge, so I run one DFS that stamps each server with its discovery time and keeps a low-link: the earliest time reachable from its subtree through one back edge. When a child finishes, I pull its low into the parent, and if the child’s low is strictly greater than the parent’s discovery time, the tree edge between them is a bridge. I skip the arrival edge by id so duplicate cables count as a detour, and I use an explicit stack to survive a 10⁵-long chain. It is linear.”',
        followups: [
          { q: 'Why `>` for bridges but `>=` for articulation points?', a: 'A bridge is an edge: if the child’s subtree reaches u itself (low equals disc[u]) that is still a second connection through the node u, so the edge is not critical. An articulation point is the node: reaching u does not help once u is deleted, so equal counts as cut.' },
          { q: 'What changes if the graph can have parallel cables?', a: 'Nothing, provided you skip the arrival edge by its id and not by the parent node. Skipping by parent node would treat a doubled cable as a bridge.' }
        ]
      },

      {
        lc: 2097,
        restate: 'You get a list of pairs `[start, end]`. Arrange **all** of them in one line so that each pair’s end equals the next pair’s start, using every pair exactly once. Return any valid arrangement; the input is guaranteed to allow one.',
        examples: '- `[[5,1],[4,5],[11,9],[9,4]]` → `[[11,9],[9,4],[4,5],[5,1]]`: the only way to chain them.\n- `[[1,3],[3,2],[2,1]]` → any rotation of the loop, such as `[[1,3],[3,2],[2,1]]` or `[[3,2],[2,1],[1,3]]`.\n- `[[1,2],[1,3],[2,1]]` → `[[1,2],[2,1],[1,3]]`: starting with `[1,3]` would strand the others.\n- Edge cases: a single pair; a loop where every start is possible; pairs that share endpoints many times (several pairs from the same number).',
        brute: 'Try each pair as the first one and backtrack, trying every unused pair whose start matches the current end. A wrong start or a wrong early turn costs a whole subtree of work, so the worst case is exponential in the number of pairs.',
        insight: 'Treat each **number as a node** and each pair as a **directed edge** from its start to its end. Arranging the pairs in a chain is walking every edge once: an **Eulerian path**, and the input guarantees one exists. The start must be the node with `out - in = 1` (if there is none, the walk is a loop and any node with an edge will do; the first pair’s start is fine). Then run the same Hierholzer stack: push the start, take an unused edge from the top node, and pop a node into the answer when it has no edges left. Reverse the node sequence and read consecutive nodes as pairs.',
        code: {
          py: `class Solution:
    def validArrangement(self, pairs: List[List[int]]) -> List[List[int]]:
        adj, diff = defaultdict(list), defaultdict(int)
        for a, b in pairs:
            adj[a].append(b)
            diff[a] += 1                             # out-degree minus in-degree
            diff[b] -= 1
        start = pairs[0][0]
        for a, _ in pairs:
            if diff[a] == 1:                         # the only node with one extra way out
                start = a
                break
        stack, path = [start], []
        while stack:
            v = stack[-1]
            if adj[v]:
                stack.append(adj[v].pop())           # take an unused pair
            else:
                path.append(stack.pop())             # dead end: next in the route, from the back
        path.reverse()
        return [[path[i], path[i + 1]] for i in range(len(path) - 1)]`,
          js: `function validArrangement(pairs) {
  const adj = new Map(), diff = new Map();
  const add = (m, k, d) => m.set(k, (m.get(k) || 0) + d);
  for (const [a, b] of pairs) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
    add(diff, a, 1);                                 // out-degree minus in-degree
    add(diff, b, -1);
  }
  let start = pairs[0][0];
  for (const [a] of pairs) if (diff.get(a) === 1) { start = a; break; }   // the only node with one extra way out
  const stack = [start], path = [];
  while (stack.length) {
    const v = stack[stack.length - 1], out = adj.get(v);
    if (out && out.length) stack.push(out.pop());    // take an unused pair
    else path.push(stack.pop());                     // dead end: next in the route, from the back
  }
  path.reverse();
  return path.slice(1).map((v, i) => [path[i], v]);
}`,
          java: `class Solution {
    public int[][] validArrangement(int[][] pairs) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        Map<Integer, Integer> diff = new HashMap<>();
        for (int[] p : pairs) {
            adj.computeIfAbsent(p[0], k -> new ArrayList<>()).add(p[1]);
            diff.merge(p[0], 1, Integer::sum);       // out-degree minus in-degree
            diff.merge(p[1], -1, Integer::sum);
        }
        int start = pairs[0][0];
        for (int[] p : pairs) if (diff.get(p[0]) == 1) { start = p[0]; break; }   // the only node with one extra way out
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        LinkedList<Integer> path = new LinkedList<>();
        while (!stack.isEmpty()) {
            int v = stack.peek();
            List<Integer> out = adj.get(v);
            if (out != null && !out.isEmpty()) stack.push(out.remove(out.size() - 1));   // take an unused pair
            else path.addFirst(stack.pop());         // dead end: next in the route, built from the back
        }
        int[] seq = path.stream().mapToInt(x -> x).toArray();
        int[][] res = new int[pairs.length][];
        for (int i = 0; i < pairs.length; i++) res[i] = new int[]{seq[i], seq[i + 1]};
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> validArrangement(vector<vector<int>>& pairs) {
        unordered_map<int, vector<int>> adj;
        unordered_map<int, int> diff;
        for (auto& p : pairs) {
            adj[p[0]].push_back(p[1]);
            diff[p[0]]++;                            // out-degree minus in-degree
            diff[p[1]]--;
        }
        int start = pairs[0][0];
        for (auto& p : pairs) if (diff[p[0]] == 1) { start = p[0]; break; }   // the only node with one extra way out
        vector<int> stk{start}, path;
        while (!stk.empty()) {
            int v = stk.back();
            auto& out = adj[v];
            if (!out.empty()) { int w = out.back(); out.pop_back(); stk.push_back(w); }   // take an unused pair
            else { path.push_back(v); stk.pop_back(); }   // dead end: next in the route, from the back
        }
        reverse(path.begin(), path.end());
        vector<vector<int>> res;
        for (size_t i = 0; i + 1 < path.size(); i++) res.push_back({path[i], path[i + 1]});
        return res;
    }
};`
        },
        complexity: 'O(P) time and space for P pairs (hash-map operations are constant on average): each pair is taken once and each node pushed and popped once per use.',
        say: '“I make each number a node and each pair a directed edge, so chaining the pairs is an Eulerian path. The start is the node whose out-degree is one more than its in-degree, or any node if every degree balances. Then it is Hierholzer: a stack, take an unused edge from the top, and pop a node to the answer when it has none left. Reverse the node list and pair up neighbors. No search is needed, it is linear in the number of pairs.”',
        followups: [
          { q: 'Why is a start with out minus in equal to 1 forced?', a: 'A route leaves its start once more than it enters it, and enters its end once more than it leaves. If a node has one extra outgoing edge, the route cannot start anywhere else.' },
          { q: 'What if the input might have no valid arrangement?', a: 'Check the degree conditions up front, and after building compare the route length with pairs + 1. A shorter route means some pairs were in a separate piece.' }
        ]
      }
    ],

    practice: [
      { lc: 332,
        hints: ['Airports are nodes and tickets are one-way edges. Which classic walk uses every edge exactly once?', 'Walking greedily to the smallest next airport can strand tickets at a dead end. What if you recorded a dead-end airport in the answer and stepped back?', 'Keep a stack from JFK, take the smallest unused ticket from the top airport, and pop an airport into the route when it has none left; reverse the route at the end.'],
        starter: { py: 'class Solution:\n    def findItinerary(self, tickets: List[List[str]]) -> List[str]:\n        ', js: 'function findItinerary(tickets) {\n  \n}' },
        tests: { fn: 'findItinerary', cases: [
          { args: [[['MUC', 'LHR'], ['JFK', 'MUC'], ['SFO', 'SJC'], ['LHR', 'SFO']]], out: ['JFK', 'MUC', 'LHR', 'SFO', 'SJC'] },
          { args: [[['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']]], out: ['JFK', 'ATL', 'JFK', 'SFO', 'ATL', 'SFO'] },
          { args: [[['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']]], out: ['JFK', 'NRT', 'JFK', 'KUL'] },
          { args: [[['JFK', 'AAA'], ['AAA', 'JFK']]], out: ['JFK', 'AAA', 'JFK'] }] } },

      { lc: 1192,
        hints: ['A cable is critical when removing it splits the network. In a DFS tree, which edges can that happen to?', 'Give each server a discovery time and a low value: the earliest discovery time its subtree can reach with one back edge. When does a tree edge u-v have nothing bypassing it?', 'After finishing child v of u, set `low[u] = min(low[u], low[v])`, and report u-v when `low[v] > disc[u]`. Skip the arrival edge by id, and use an explicit stack for long chains.'],
        starter: { py: 'class Solution:\n    def criticalConnections(self, n: int, connections: List[List[int]]) -> List[List[int]]:\n        ', js: 'function criticalConnections(n, connections) {\n  \n}' },
        tests: { fn: 'criticalConnections', sig: { args: ['int', 'list<list<int>>'] }, compare: 'deep', cases: [
          { args: [4, [[0, 1], [1, 2], [2, 0], [1, 3]]], out: [[1, 3]] },
          { args: [2, [[0, 1]]], out: [[0, 1]] },
          { args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], out: [[0, 1], [1, 2], [2, 3], [3, 4]] },
          { args: [6, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3]]], out: [[2, 3]] },
          { args: [4, [[0, 1], [1, 2], [2, 3], [3, 0]]], out: [] },
          { args: [5, [[0, 1], [0, 1], [1, 2], [2, 3], [3, 4], [4, 2]]], out: [[1, 2]] }] } },

      { lc: 2097,
        hints: ['Chaining pairs end to start, using each once, is a walk over edges. What are the nodes and what are the edges?', 'Count out-degree minus in-degree for every number. Which number must be the start of the chain, if any?', 'Run the Hierholzer stack from that start (any first pair’s start if all degrees balance), pop a node into the route when it has no unused pair, reverse, and read consecutive nodes as pairs.'],
        starter: { py: 'class Solution:\n    def validArrangement(self, pairs: List[List[int]]) -> List[List[int]]:\n        ', js: 'function validArrangement(pairs) {\n  \n}' },
        tests: { fn: 'validArrangement', sig: { args: ['int[][]'] }, cases: [
          { args: [[[5, 1], [4, 5], [11, 9], [9, 4]]], out: [[11, 9], [9, 4], [4, 5], [5, 1]] },
          { args: [[[1, 3], [3, 2], [2, 1]]], any: true, out: [[[1, 3], [3, 2], [2, 1]], [[3, 2], [2, 1], [1, 3]], [[2, 1], [1, 3], [3, 2]]] },
          { args: [[[1, 2], [1, 3], [2, 1]]], out: [[1, 2], [2, 1], [1, 3]] },
          { args: [[[7, 8]]], out: [[7, 8]] },
          { args: [[[1, 2], [2, 3], [3, 1], [1, 4]]], out: [[1, 2], [2, 3], [3, 1], [1, 4]] },
          { args: [[[0, 1], [1, 0], [0, 2], [2, 0]]], any: true, out: [[[0, 1], [1, 0], [0, 2], [2, 0]], [[1, 0], [0, 2], [2, 0], [0, 1]], [[0, 2], [2, 0], [0, 1], [1, 0]], [[2, 0], [0, 1], [1, 0], [0, 2]]] }] } }
    ],

    mistakes: [
      '**Skipping the parent by node instead of by edge id.** In an undirected DFS, `if v == parent: continue` is fine for simple graphs but turns a doubled edge into a false bridge. Carry an edge id and skip only that one.',
      '**Using `>=` for bridges or `>` for articulation points.** Bridge (an edge): `low[v] > disc[u]`. Articulation point (a node): `low[v] >= disc[u]`, because reaching u itself does not help once u is deleted. Mixing them up is the most common wrong answer.',
      '**Forgetting the root special case.** The root has no “above”, so `low[v] >= disc[root]` is always true and would report every root as a cut point. A root is one only when it has two or more DFS children.',
      '**Updating low from a finished node in a directed graph.** For SCCs, an edge to a node already assigned to a component must not lower `low[u]`. Only nodes still on the stack count, which is why the stack and the `on_stack` flag exist.',
      '**Using the undirected rule on a directed graph, or the reverse.** Bridges and cut points belong to undirected graphs; SCCs belong to directed ones. Say which one the problem is before writing anything.',
      '**Running the DFS from only one node.** Graphs may be in pieces. Loop over every node and start a search from each unvisited one (for Tarjan, for bipartite coloring, and for Euler checks that need every edge reachable).',
      '**Skipping the degree check, or the final length check, for Euler.** Degrees tell you whether a route can exist; the route length (`edges + 1` nodes) tells you the edges are all in one piece. Do both unless the problem guarantees a route.',
      '**Emitting the Hierholzer route without reversing it.** Nodes are appended when they are stuck, so the route comes out backwards. Reverse once at the end, or build it from the back with a deque.',
      '**Treating the smallest-first rule as a plain greedy walk.** Choosing the smallest next airport and never backing up strands tickets. The pop-on-dead-end step is what makes smallest-first correct.',
      '**Deep recursion.** A 10⁵-node chain overflows Python and Java stacks. Use an explicit stack with a “next neighbor” index for large inputs.',
      '**Confusing Eulerian with Hamiltonian.** Every **edge** once is easy (degrees plus Hierholzer). Every **node** once is NP-hard. Check which one the problem asks for before picking a tool.',
      '**Coloring only the first component for bipartite checks.** An odd cycle in a second component still makes the graph non-bipartite.'
    ],

    quiz: [
      { kind: 'concept', q: 'An undirected connected graph has exactly two vertices of odd degree. What can you conclude?',
        choices: ['It has an Eulerian path (not a circuit), starting at one odd vertex and ending at the other', 'It has an Eulerian circuit', 'It has no Eulerian path', 'It must be a tree'], answer: 0,
        explain: 'Every vertex that is passed through uses edges in pairs (in and out), so only the start and end of a route may have odd degree. Exactly two odd vertices give a path between them; all even gives a circuit; any other count means neither exists.' },
      { kind: 'concept', q: 'In a directed graph, which degree condition allows an Eulerian path that is not a circuit?',
        choices: ['One vertex has out − in = 1, one has in − out = 1, and all others have in = out', 'Every vertex has out = in', 'Two vertices have out − in = 1', 'Every vertex has out > in'], answer: 0,
        explain: 'The start leaves once more than it is entered; the end is entered once more than it is left. When every vertex balances, any route that uses all edges comes back to its start, so it is a circuit.' },
      { kind: 'concept', q: 'In Hierholzer’s algorithm, when is a node added to the answer?',
        choices: ['When it has no unused edges left, and the answer is reversed at the end', 'When it is first visited', 'When its smallest edge is taken', 'After every edge is used'], answer: 0,
        explain: 'Walk edges until you are stuck. The node where you get stuck is the end of whatever is still being resolved, so it goes into the answer first. Backing up and extending from earlier nodes splices in the side loops, and reversing gives the route from start to finish.' },
      { kind: 'concept', q: 'In an undirected DFS, a tree edge u-v (u the parent) is a bridge exactly when:',
        choices: ['low[v] > disc[u]', 'low[v] >= disc[u]', 'low[v] < disc[u]', 'disc[v] > disc[u]'], answer: 0,
        explain: 'low[v] is the earliest discovery time v’s subtree can reach. If it is still greater than disc[u], nothing in v’s subtree can get to u or above without this edge, so the edge is a bridge. `disc[v] > disc[u]` is true for every tree edge.' },
      { kind: 'concept', q: 'For a non-root vertex u with DFS child v, u is an articulation point when:',
        choices: ['low[v] >= disc[u] for some child v', 'low[v] > disc[u] for every child v', 'u has exactly one child', 'low[u] == disc[u]'], answer: 0,
        explain: 'If v’s subtree cannot reach anything strictly above u (it may reach u itself), deleting u cuts that subtree off. The comparison is `>=` because u is gone, so reaching it does not help. The root is the exception: it is a cut point only with two or more DFS children.' },
      { kind: 'bug', q: 'This bridge finder reports a bridge for two parallel cables between the same pair of servers. What is the bug?',
        code: `def dfs(u, parent):
    disc[u] = low[u] = timer; timer += 1
    for v in adj[u]:
        if v == parent: continue
        ...`,
        lang: 'py',
        choices: ['It skips by parent node, so the second parallel cable is also skipped; it should skip only the edge it came by (by id)', 'It forgets to set low[u]', 'It should not update the timer', 'It should iterate over adj[v]'], answer: 0,
        explain: 'Skipping every edge back to the parent erases the second cable, which is a perfectly good detour. Store an id with each edge and skip only the one the DFS arrived by.' },
      { kind: 'concept', q: 'In Tarjan’s SCC algorithm, an edge u → v goes to a node v that was already placed in a finished component. What should the algorithm do?',
        choices: ['Ignore it: it must not lower low[u]', 'Set low[u] = min(low[u], disc[v])', 'Merge the two components', 'Restart the DFS from v'], answer: 0,
        explain: 'A finished component is closed: nothing in it can reach back into the open nodes, so an edge into it says nothing about u’s own cycle. Only nodes still on the stack may lower low[u].' },
      { kind: 'complexity', q: 'What is the running time of Tarjan’s algorithm for strongly connected components on a graph with V nodes and E edges?',
        choices: ['O(V + E)', 'O(V · E)', 'O(V²) always', 'O(E log V)'], answer: 0,
        explain: 'One DFS looks at each node once and each edge once, doing constant work per edge, and each node is pushed and popped once on the stack. Kosaraju is also O(V + E) with two passes.' },
      { kind: 'pattern', q: 'Which problem is best solved with bridges (Tarjan low-link)?',
        choices: ['Which single road, if closed, would split the road network into two parts', 'The cheapest way to connect every town', 'The fewest stops between two stations', 'An order for tasks with prerequisites'], answer: 0,
        explain: 'A road whose closure disconnects the network is a bridge. The cheapest connection is a minimum spanning tree, fewest stops is BFS, and a prerequisite order is a topological sort.' },
      { kind: 'concept', q: 'When is an undirected graph bipartite?',
        choices: ['When it has no cycle of odd length', 'When it has no cycle at all', 'When every node has even degree', 'When it is connected'], answer: 0,
        explain: 'Two-colorability fails exactly when an odd cycle forces two adjacent nodes to share a color. Even cycles are fine, and so are graphs with plenty of cycles, as long as each one is even. Degrees and connectivity do not matter.' },
      { kind: 'concept', q: 'Which statements are true? Pick every one that applies.',
        choices: ['Visiting every edge once is easy (Eulerian), visiting every node once is hard (Hamiltonian)', 'A graph that is a single cycle has no bridges', 'A non-root vertex with two or more DFS children is always an articulation point', 'Tarjan’s SCC emits components in reverse topological order of the component graph'], answer: [0, 1, 3],
        explain: 'Eulerian paths follow from degrees, Hamiltonian paths are NP-hard. Every edge of a cycle has a way around, so none is a bridge. The third is false: a non-root vertex is a cut point only when some child subtree cannot reach above it, which depends on back edges, not on the number of children (that count only decides the root). Tarjan finishes sink components first.' }
    ],

    flashcards: [
      { id: 'ag-euler-undirected', front: 'Undirected graph: when does an Eulerian circuit or path exist?', back: 'All edges in one connected piece, and the number of odd-degree vertices is **0** (circuit, start anywhere) or **2** (path from one odd vertex to the other). Any other count: none.' },
      { id: 'ag-euler-directed', front: 'Directed graph: the degree rule for an Eulerian path or circuit?', back: 'Circuit: `out == in` at every vertex. Path: one vertex with `out - in = 1` (start), one with `in - out = 1` (end), the rest balanced. Plus all edges in one connected piece.' },
      { id: 'ag-hierholzer', front: 'How does Hierholzer’s algorithm build the route?', back: 'Stack starts with the start node. While the top has an unused edge, take one and push its other end. If it has none, pop it **into the answer**. Reverse the answer at the end.' },
      { id: 'ag-itinerary', front: 'Why does Reconstruct Itinerary use a min-heap per airport?', back: 'Always taking the smallest unused ticket, with Hierholzer’s pop-on-dead-end rule, produces the lexicographically smallest valid route in O(E log E).' },
      { id: 'ag-disc-low', front: 'What are `disc[u]` and `low[u]`?', back: '`disc[u]` is u’s DFS visit time. `low[u]` is the earliest visit time reachable from u’s subtree using tree edges downward and at most one back edge.' },
      { id: 'ag-bridge-rule', front: 'The bridge test, for tree edge u-v (u parent)?', back: '`low[v] > disc[u]`: nothing in v’s subtree reaches u or above, so this one edge is the only connection.' },
      { id: 'ag-cut-rule', front: 'The articulation point test?', back: 'Non-root u: some child v has `low[v] >= disc[u]` (reaching u itself does not help once u is removed). Root: two or more DFS children.' },
      { id: 'ag-parent-edge', front: 'Why skip the arrival edge by id instead of by parent node?', back: 'Two parallel edges between the same pair are a real detour. Skipping by node would ignore the second one and call the edge a bridge.' },
      { id: 'ag-scc-tarjan', front: 'How does Tarjan’s SCC algorithm find a component?', back: 'DFS with `disc`, `low` and a stack of open nodes. When `low[u] == disc[u]`, u heads a component: pop the stack down to u. Only nodes still on the stack may lower `low`.' },
      { id: 'ag-scc-kosaraju', front: 'How does Kosaraju’s SCC algorithm work?', back: 'DFS the graph and record finishing order. Reverse all edges. DFS the reversed graph in decreasing finishing order; each DFS tree is one SCC. O(V + E).' },
      { id: 'ag-bipartite', front: 'How do you test if a graph is bipartite?', back: 'BFS or DFS two-coloring from every unvisited node: neighbors get the opposite color; an edge between equal colors means an odd cycle, so not bipartite.' },
      { id: 'ag-model', front: 'Eulerian vs Hamiltonian: which is easy?', back: 'Eulerian (every **edge** once): degree conditions plus Hierholzer, linear time. Hamiltonian (every **node** once) is NP-hard: use bitmask DP for tiny n.' },
      { id: 'ag-choose', front: 'Which tool for: fewest steps, cheapest path, streaming connectivity, removal impact?', back: 'BFS for unit-cost fewest steps; Dijkstra for non-negative weights; union-find for edges arriving over time; low-link (bridges and cut points) for what breaks when something is removed.' }
    ],

    deeper: [
      { title: 'Finding bridges in an undirected graph (cp-algorithms)', url: 'https://cp-algorithms.com/graph/bridge-searching.html', time: 'about 20 min', note: 'The low-link algorithm with the proof idea, in C++, plus the offline online-bridges variant.' },
      { title: 'Finding articulation points (cp-algorithms)', url: 'https://cp-algorithms.com/graph/cutpoints.html', time: 'about 15 min', note: 'The same DFS with the cut-vertex condition and the root special case.' },
      { title: 'Finding the Eulerian path (cp-algorithms)', url: 'https://cp-algorithms.com/graph/euler_path.html', time: 'about 20 min', note: 'Degree conditions for directed and undirected graphs, and the stack-based construction.' },
      { title: 'Strongly connected components and the condensation graph (cp-algorithms)', url: 'https://cp-algorithms.com/graph/strongly-connected-components.html', time: 'about 25 min', note: 'Kosaraju’s algorithm with the proof, and how to contract components into a DAG.' },
      { title: 'Tarjan’s strongly connected components algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm', time: 'about 15 min', note: 'Pseudocode and the reasoning behind the stack, with the complexity bound.' },
      { title: 'NeetCode: Advanced Graphs', url: 'https://neetcode.io/roadmap', time: 'about 20 min', note: 'Roadmap entry with the interview-level problems for this topic, including Reconstruct Itinerary.' }
    ],

    detective: [
      { id: 'street-sweeper-night', decoys: ['graphs', 'backtracking', 'shortest-paths'],
        statement: 'A small town has a list of one-way streets, each joining two junctions that are numbered. A night worker must paint a line down the middle of every street, driving each street exactly once, without lifting the brush from the town’s map: when one street ends, the next must begin at the junction where she now stands. The foreman wants to know first whether any such plan exists, and if it does, the full order of junctions for a plan that starts at the depot. Trying every ordering of streets takes too long once there are a few dozen.',
        why: 'The phrase “every street exactly once” is about **edges**, not junctions, so this is an Eulerian walk. Existence is decided by counting in-streets and out-streets at each junction (balanced, except possibly a start with one extra way out and an end with one extra way in), and the route comes out of one stack-based pass instead of a search of all orderings.' },
      { id: 'single-point-ferries', decoys: ['union-find', 'graphs', 'mst'],
        statement: 'An island chain runs ferry lines between harbors, and every harbor can currently be reached from every other harbor by some sequence of ferries. The council wants a short list of the single ferry lines that, if cancelled alone for a season, would leave at least two harbors with no sequence of ferries between them, and a second list of the harbors that, if closed alone, would do the same to the rest. There are tens of thousands of harbors, so closing each line in turn and re-checking is far too slow.',
        why: 'The questions are about what **breaks when one link or one node is removed** in an undirected graph. One depth-first pass with a visit clock and an “earliest reachable time from my subtree” value answers every link and every node at once, which is the bridge and articulation-point test.' },
      { id: 'follow-circles', decoys: ['union-find', 'topo-sort', 'graphs'],
        statement: 'A social app records, for each member, the members they follow. Following is not mutual. The product team wants to find every “circle”: a largest possible group in which each member can reach every other member by hopping along follows (possibly through several people). They also want to know, once the circles are found, which circle follows which, so that the circles themselves can be ordered with no loops among them. The follow list holds millions of entries, so checking every pair of members is out of the question.',
        why: 'Groups where everyone can reach everyone **along directed edges** are strongly connected components. A single depth-first pass that stamps visit times and keeps a stack of still-open members closes off one circle at a time, and the circles come out as a loop-free ordering, which is the directed-graph grouping, not plain connectivity.' }
    ]
  });
})();
