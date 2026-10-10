/* Offer Ready: Topological sort lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it is written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'topo-sort',

    hook: 'Whenever a problem says “A has to happen before B”, you are holding a directed graph, and the question is whether the pile of rules can be lined up in a single row. That is topological sort. It is the engine behind build systems, course schedules, spreadsheet recalculation and package installers, so interviewers reach for it as the “graph problem that is not a search”. It also doubles as the cleanest cycle detector there is: if the order comes up short, the rules contradict each other. Learn one short loop (Kahn’s algorithm) and its depth-first twin, and a whole family of problems collapses into the same twenty lines.',

    cues: [
      'Tasks with **prerequisites**: “you must finish X before Y”, build steps, install order, course plans.',
      'You are asked for **any valid order**, or **whether an order exists at all** (that second question is cycle detection).',
      'The rules are given as **pairs** `[a, b]`, and you must decide which way the arrow points before you do anything else.',
      'You must infer a hidden order from **examples**: a sorted list in an unknown alphabet, ranked results, “who beats whom” records.',
      'The answer is the **longest chain** of dependencies: the minimum number of rounds or semesters when independent items run in parallel.',
      'You must repeatedly remove **things nothing depends on** (leaves, sinks, safe states) until nothing is left or you get stuck.'
    ],

    intuition: [
      'Picture getting dressed. Socks go on before shoes, trousers before the belt, and underwear before the trousers. Draw an arrow from each thing to whatever has to come after it. You now have a **directed graph**. A **topological order** is a way to list every item so that **every arrow points forward**: nothing appears before something it waits for.',
      'A valid order exists exactly when the graph has **no cycle**. “Shoes before socks, socks before shoes” can never be satisfied. A graph with no cycle is a **DAG**, a directed acyclic graph.',
      'The key number is a node’s **in-degree**: how many arrows point **into** it, i.e. how many things it is still waiting for. A node with in-degree 0 waits for nothing, so it is safe to put **first**. Do that, then pretend it is gone: every arrow leaving it is now satisfied, so each target’s in-degree drops by one. Some targets reach 0 and are now free. Repeat. This is **Kahn’s algorithm**, and the visualizer above runs it: a queue of free nodes, an in-degree count per node, and the order being built.',
      'If the queue runs dry **before** every node has been emitted, the leftover nodes all still wait for something that is itself leftover: they wait on each other. That is a cycle. So one loop gives you both the order and the cycle test: **emitted fewer than n nodes means there is a cycle**.',
      'The second way is **depth-first search**. Colour each node white (not seen), gray (on the path you are walking right now) or black (finished). If you ever step onto a **gray** node you have walked in a circle: a cycle. Otherwise, write each node down when it **finishes**; every node finishes after everything it points to, so the finish list read **backwards** is a valid order. Same answer, same cost, different feel: Kahn is iterative and reads like a schedule, the DFS is short and recursive.',
      'Two things to hold on to. First, a DAG usually has **many** valid orders; one is almost always enough, and when you need a specific one (the smallest) you swap the queue for a heap. Second, the **direction of the arrow** is the only real decision: for a prerequisite pair `[course, needs]` the arrow goes `needs → course`. Get that backwards and the whole solution is mirrored.'
    ].join('\n\n'),

    viz: 'topo-sort',

    template: {
      title: 'Kahn’s algorithm: peel off nodes with in-degree 0',
      note: 'Build the adjacency list and the in-degree counts, queue every node that waits for nothing, then repeatedly emit one and release whatever it was holding up. The function returns the order **so far**; if it is shorter than `n` there is a cycle, which is why the lesson’s problems all end with a length check. Ties are broken by queue order, so the answer is one of possibly many valid orders. Swap the queue for a min-heap when the smallest valid order is required.',
      code: {
        py: `def topo_order(n, edges):
    graph = [[] for _ in range(n)]                  #@build > 1. Edges a to b: a must come first
    indeg = [0] * n                                 #@build
    for a, b in edges:                              #@build
        graph[a].append(b)                          #@build
        indeg[b] += 1                               #@build > in-degree = how many things b still waits for
    queue = deque(i for i in range(n) if indeg[i] == 0)   #@seed > 2. Nodes that wait for nothing can go first
    order = []
    while queue:
        node = queue.popleft()                      #@take > 3. Emit one free node
        order.append(node)                          #@take
        for nxt in graph[node]:
            indeg[nxt] -= 1                         #@relax > 4. Its edge is satisfied: the target waits for one less
            if indeg[nxt] == 0:                     #@release > 5. Nothing left to wait for: it is free
                queue.append(nxt)                   #@release
    return order                                    #@done > 6. Shorter than n means a cycle left some nodes stuck`,
        js: `function topoOrder(n, edges) {
  const graph = Array.from({ length: n }, () => []);   //@build > 1. Edges a to b: a must come first
  const indeg = new Array(n).fill(0);               //@build
  for (const [a, b] of edges) {                     //@build
    graph[a].push(b);                               //@build
    indeg[b]++;                                     //@build > in-degree = how many things b still waits for
  }
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);   //@seed > 2. Nodes that wait for nothing can go first
  const order = [];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];                       //@take > 3. Emit one free node
    order.push(node);                               //@take
    for (const nxt of graph[node]) {
      indeg[nxt]--;                                 //@relax > 4. Its edge is satisfied: the target waits for one less
      if (indeg[nxt] === 0) {                       //@release > 5. Nothing left to wait for: it is free
        queue.push(nxt);                            //@release
      }
    }
  }
  return order;                                     //@done > 6. Shorter than n means a cycle left some nodes stuck
}`,
        java: `class Solution {
    public List<Integer> topoOrder(int n, int[][] edges) {
        List<List<Integer>> graph = new ArrayList<>();      //@build > 1. Edges a to b: a must come first
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());   //@build
        int[] indeg = new int[n];                           //@build
        for (int[] e : edges) {                             //@build
            graph.get(e[0]).add(e[1]);                      //@build
            indeg[e[1]]++;                                  //@build > in-degree = how many things b still waits for
        }
        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.offer(i);   //@seed > 2. Nodes that wait for nothing can go first
        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int node = queue.poll();                        //@take > 3. Emit one free node
            order.add(node);                                //@take
            for (int nxt : graph.get(node)) {
                indeg[nxt]--;                               //@relax > 4. Its edge is satisfied: the target waits for one less
                if (indeg[nxt] == 0) {                      //@release > 5. Nothing left to wait for: it is free
                    queue.offer(nxt);                       //@release
                }
            }
        }
        return order;                                       //@done > 6. Shorter than n means a cycle left some nodes stuck
    }
}`,
        cpp: `class Solution {
public:
    vector<int> topoOrder(int n, vector<vector<int>>& edges) {
        vector<vector<int>> graph(n);                       //@build > 1. Edges a to b: a must come first
        vector<int> indeg(n, 0);                            //@build
        for (auto& e : edges) {                             //@build
            graph[e[0]].push_back(e[1]);                    //@build
            indeg[e[1]]++;                                  //@build > in-degree = how many things b still waits for
        }
        queue<int> q;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);   //@seed > 2. Nodes that wait for nothing can go first
        vector<int> order;
        while (!q.empty()) {
            int node = q.front(); q.pop();                  //@take > 3. Emit one free node
            order.push_back(node);                          //@take
            for (int nxt : graph[node]) {
                indeg[nxt]--;                               //@relax > 4. Its edge is satisfied: the target waits for one less
                if (indeg[nxt] == 0) {                      //@release > 5. Nothing left to wait for: it is free
                    q.push(nxt);                            //@release
                }
            }
        }
        return order;                                       //@done > 6. Shorter than n means a cycle left some nodes stuck
    }
};`
      },
      tests: { fn: { py: 'topo_order', default: 'topoOrder' }, sig: { args: ['int', 'int[][]'] }, cases: [
        { args: [6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]], out: [4, 5, 2, 0, 3, 1] },
        { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], out: [0, 1, 2, 3] },
        { args: [4, [[0, 1], [1, 2], [2, 1], [2, 3]]], out: [0] },
        { args: [3, []], out: [0, 1, 2] },
        { args: [3, [[0, 1], [1, 2], [2, 0]]], out: [] },
        { args: [5, [[3, 4], [1, 3], [0, 1]]], out: [0, 2, 1, 3, 4] }] }
    },

    complexity: {
      time: 'O(V + E)',
      space: 'O(V + E)',
      why: 'Building the graph and the in-degrees touches every edge once. In the main loop every node is emitted at most once, and each edge is looked at exactly once, when its source is emitted. So the total work is proportional to nodes plus edges. The adjacency list costs O(V + E) memory, and the queue and in-degree array add O(V). DFS has the same bounds, plus O(V) of recursion depth on a long chain.',
      trap: 'Forgetting the length check. Kahn’s loop **never fails loudly** on a cycle: it just stops early and hands back a short list. If you return `order` without comparing its length to `n` (or counting emitted nodes), a cyclic input silently gives a wrong “valid” answer. The second trap is the edge direction: for `[course, needs]` the arrow is `needs → course`, and the in-degree belongs to `course`.'
    },

    variations: [
      {
        name: 'DFS with three colours (and cycle detection)',
        body: 'Give every node a colour: **0 white** (not visited), **1 gray** (on the path being walked right now), **2 black** (finished). Visit a node by painting it gray, visiting each target, then painting it black and appending it to a list. If you reach a **gray** node, you have found a way back onto your own path: a cycle, so stop and report it. If you reach a black node, skip it: it is already done. The finish list is in **reverse** topological order, because a node finishes only after everything it points to. Reverse it. Cost O(V + E). Plain “visited / not visited” is not enough: a node already visited might be finished (fine) or on the current path (a cycle), and only the third colour tells them apart.',
        code: {
          py: `def dfs_order(n, edges):
    graph = [[] for _ in range(n)]
    for a, b in edges:
        graph[a].append(b)
    color = [0] * n                      # 0 new, 1 on the current path, 2 finished
    post = []

    def visit(u):
        color[u] = 1
        for v in graph[u]:
            if color[v] == 1:
                return False             #> A gray node is on our own path: a cycle
            if color[v] == 0 and not visit(v):
                return False
        color[u] = 2
        post.append(u)                   #> Finished: everything it points to is already in post
        return True

    for u in range(n):
        if color[u] == 0 and not visit(u):
            return []
    return post[::-1]                    #> Reverse finish order is a valid topological order`,
          js: `function dfsOrder(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) graph[a].push(b);
  const color = new Array(n).fill(0);    // 0 new, 1 on the current path, 2 finished
  const post = [];
  function visit(u) {
    color[u] = 1;
    for (const v of graph[u]) {
      if (color[v] === 1) return false;  //> A gray node is on our own path: a cycle
      if (color[v] === 0 && !visit(v)) return false;
    }
    color[u] = 2;
    post.push(u);                        //> Finished: everything it points to is already in post
    return true;
  }
  for (let u = 0; u < n; u++) if (color[u] === 0 && !visit(u)) return [];
  return post.reverse();                 //> Reverse finish order is a valid topological order
}`
        },
        tests: { fn: { py: 'dfs_order', default: 'dfsOrder' }, cases: [
          { args: [6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]], out: [5, 4, 2, 3, 1, 0] },
          { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], out: [0, 2, 1, 3] },
          { args: [4, [[0, 1], [1, 2], [2, 1], [2, 3]]], out: [] },
          { args: [3, []], out: [2, 1, 0] },
          { args: [3, [[0, 1], [1, 2], [2, 0]]], out: [] },
          { args: [5, [[3, 4], [1, 3], [0, 1]]], out: [2, 0, 1, 3, 4] },
          { args: [2, [[1, 1]]], out: [] }] }
      },
      {
        name: 'One order, or every order',
        body: 'Kahn’s loop returns **one** valid order: whenever the queue holds more than one free node, you are free to pick any, and each pick is a different valid order. The number of free nodes at a moment tells you how many choices you have. To list **all** orders, turn the loop into backtracking: at each step try every node whose in-degree is 0, emit it, lower its targets’ in-degrees, recurse, then undo. That is exponential (a graph with no edges has n! orders), so it only appears with tiny inputs; if the question only asks “how many”, think subset dynamic programming instead. For the **smallest** order (alphabetical, lowest label first), keep the free nodes in a min-heap instead of a queue: emit the smallest each time.',
        code: {
          py: `def all_orders(n, edges):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    used, cur, out = [False] * n, [], []

    def go():
        if len(cur) == n:
            out.append(cur[:])
            return
        for u in range(n):
            if not used[u] and indeg[u] == 0:    #> Every free node is a different choice
                used[u] = True
                cur.append(u)
                for v in graph[u]:
                    indeg[v] -= 1
                go()
                for v in graph[u]:               #> Undo, then try the next free node
                    indeg[v] += 1
                cur.pop()
                used[u] = False
    go()
    return out`,
          js: `function allOrders(n, edges) {
  const graph = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
  for (const [a, b] of edges) { graph[a].push(b); indeg[b]++; }
  const used = new Array(n).fill(false), cur = [], out = [];
  function go() {
    if (cur.length === n) { out.push(cur.slice()); return; }
    for (let u = 0; u < n; u++) {
      if (!used[u] && indeg[u] === 0) {          //> Every free node is a different choice
        used[u] = true;
        cur.push(u);
        for (const v of graph[u]) indeg[v]--;
        go();
        for (const v of graph[u]) indeg[v]++;    //> Undo, then try the next free node
        cur.pop();
        used[u] = false;
      }
    }
  }
  go();
  return out;
}`
        },
        tests: { fn: { py: 'all_orders', default: 'allOrders' }, cases: [
          { args: [3, [[0, 2], [1, 2]]], out: [[0, 1, 2], [1, 0, 2]] },
          { args: [3, []], out: [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]] },
          { args: [3, [[0, 1], [1, 2], [2, 0]]], out: [] },
          { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], out: [[0, 1, 2, 3], [0, 2, 1, 3]] },
          { args: [1, []], out: [[0]] }] }
      },
      {
        name: 'Longest path in a DAG: the number of rounds',
        body: 'When independent tasks run **in parallel**, the fastest finish is set by the **longest chain** of dependencies. Carry a number along Kahn’s loop: `dist[v]` is the longest chain that ends at `v`. When you release an edge `u → v`, set `dist[v] = max(dist[v], dist[u] + 1)`. Because a node is only emitted after **all** its prerequisites, `dist[u]` is final by then. This works only on a DAG, which is why shortest-path tricks like Dijkstra are not needed here: one pass in topological order does it in O(V + E). With unit costs it is the same as counting “rounds”: process the queue one layer at a time and count the layers (the 1136 practice problem). With task durations, add the duration instead of 1. Detect the cycle the same way: if fewer than n nodes were emitted, return −1.',
        code: {
          py: `def longest_path(n, edges):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    dist = [0] * n                           # longest chain (in edges) ending at each node
    queue = deque(i for i in range(n) if indeg[i] == 0)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        for v in graph[u]:
            dist[v] = max(dist[v], dist[u] + 1)   #> dist[u] is final: u waited for all its prerequisites
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return max(dist) if seen == n else -1    #> A short order means a cycle: no longest path`,
          js: `function longestPath(n, edges) {
  const graph = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
  for (const [a, b] of edges) { graph[a].push(b); indeg[b]++; }
  const dist = new Array(n).fill(0);         // longest chain (in edges) ending at each node
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  let seen = 0;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    seen++;
    for (const v of graph[u]) {
      dist[v] = Math.max(dist[v], dist[u] + 1);   //> dist[u] is final: u waited for all its prerequisites
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return seen === n ? Math.max(...dist) : -1;     //> A short order means a cycle: no longest path
}`
        },
        tests: { fn: { py: 'longest_path', default: 'longestPath' }, cases: [
          { args: [6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]], out: 3 },
          { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], out: 2 },
          { args: [4, [[0, 1], [1, 2], [2, 1], [2, 3]]], out: -1 },
          { args: [3, []], out: 0 },
          { args: [5, [[3, 4], [1, 3], [0, 1]]], out: 3 },
          { args: [1, []], out: 0 }] }
      },
      {
        name: 'Edges that are not given: reading them from examples',
        body: 'Often the graph is hidden in the input. The classic case is a list of words sorted by a **made-up alphabet**: compare each **adjacent** pair, find the **first position where they differ**, and that gives one edge (the letter in the earlier word comes before the letter in the later word). Stop at that first difference: later letters say nothing. Two traps: if one word is a **longer word followed by its own prefix** (`"abc"` then `"ab"`) the input is contradictory; and every letter that appears must become a node, even one with no edges, so the output includes it. Collect edges from adjacent pairs only, since the sort order already implies the rest. The code below extracts the edges (as two-letter strings, first-seen order, no repeats) or returns `None` for an impossible prefix; the full solution is the worked problem (269).',
        code: {
          py: `def letter_edges(words):
    edges, seen = [], set()
    for w1, w2 in zip(words, words[1:]):
        for a, b in zip(w1, w2):
            if a != b:
                if a + b not in seen:
                    seen.add(a + b)
                    edges.append(a + b)       #> First difference only: later letters tell us nothing
                break
        else:
            if len(w1) > len(w2):
                return None                   #> A longer word before its own prefix: impossible
    return edges`,
          js: `function letterEdges(words) {
  const edges = [], seen = new Set();
  for (let i = 0; i + 1 < words.length; i++) {
    const w1 = words[i], w2 = words[i + 1];
    let k = 0;
    while (k < w1.length && k < w2.length && w1[k] === w2[k]) k++;
    if (k === Math.min(w1.length, w2.length)) {
      if (w1.length > w2.length) return null;   //> A longer word before its own prefix: impossible
      continue;
    }
    const e = w1[k] + w2[k];                    //> First difference only: later letters tell us nothing
    if (!seen.has(e)) { seen.add(e); edges.push(e); }
  }
  return edges;
}`
        },
        tests: { fn: { py: 'letter_edges', default: 'letterEdges' }, cases: [
          { args: [['wrt', 'wrf', 'er', 'ett', 'rftt']], out: ['tf', 'we', 'rt', 'er'] },
          { args: [['abc', 'ab']], out: null },
          { args: [['ab', 'ab']], out: [] },
          { args: [['a', 'b', 'a']], out: ['ab', 'ba'] },
          { args: [['z', 'z']], out: [] }] }
      },
      {
        name: 'Kahn or DFS: which to type',
        body: '- **Kahn (BFS)** when you want the **order built front to back**, when you need “rounds” or levels (process the queue a layer at a time), or when recursion depth could be huge. Cycle detection is a length check.\n- **DFS with colours** when you already have a recursive helper, when you only need to **detect** a cycle, or when you want the reverse finish order. Cycle detection is meeting a gray node. Deep chains can overflow the call stack in Python (default limit about 1000) and JavaScript.\n- Both are O(V + E). Neither handles weights; for “cheapest” paths see [Shortest paths](#/topic/shortest-paths). Cycle detection in an **undirected** graph is a different job, done with union-find or a parent check: see [Union-Find](#/topic/union-find) and [Graphs](#/topic/graphs).'
      }
    ],

    worked: [
      {
        lc: 207,
        restate: 'There are `numCourses` courses numbered `0` to `numCourses - 1`. Each pair `[a, b]` in `prerequisites` means you must take course `b` before course `a`. Return whether it is possible to take every course.',
        examples: '- `2`, `[[1, 0]]` → `true`: take 0, then 1.\n- `2`, `[[1, 0], [0, 1]]` → `false`: each waits for the other.\n- Edge cases: no prerequisites at all → `true`; a course that is its own prerequisite (`[[0, 0]]`) → `false`; courses that appear in no pair still count and are free.',
        brute: 'Try every ordering of the courses and test each against the rules: n! orders. Or, for each course, walk its chain of prerequisites looking for itself: it works, but re-walks shared chains again and again, O(V · (V + E)).',
        insight: 'This is exactly “does a valid order exist”, i.e. “is there a cycle”. Draw an arrow `b → a` for each pair `[a, b]`, count in-degrees, and run Kahn’s loop. Count the courses that get **emitted**; if all `numCourses` come out, no cycle blocked anything, so the answer is `true`. A course in a cycle never reaches in-degree 0, so it is never emitted and the count falls short. You do not need the order itself, only the count.',
        code: {
          py: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        graph = [[] for _ in range(numCourses)]
        indeg = [0] * numCourses
        for course, need in prerequisites:
            graph[need].append(course)       # need must come first: arrow need -> course
            indeg[course] += 1
        queue = deque(i for i in range(numCourses) if indeg[i] == 0)
        taken = 0
        while queue:
            node = queue.popleft()
            taken += 1
            for nxt in graph[node]:
                indeg[nxt] -= 1
                if indeg[nxt] == 0:
                    queue.append(nxt)
        return taken == numCourses           # all emitted: no cycle`,
          js: `function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, need] of prerequisites) {
    graph[need].push(course);                // need must come first: arrow need -> course
    indeg[course]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let taken = 0;
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    taken++;
    for (const nxt of graph[node]) {
      if (--indeg[nxt] === 0) queue.push(nxt);
    }
  }
  return taken === numCourses;               // all emitted: no cycle
}`,
          java: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) {
            graph.get(p[1]).add(p[0]);       // need must come first: arrow need -> course
            indeg[p[0]]++;
        }
        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.offer(i);
        int taken = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            taken++;
            for (int nxt : graph.get(node)) {
                if (--indeg[nxt] == 0) queue.offer(nxt);
            }
        }
        return taken == numCourses;          // all emitted: no cycle
    }
}`,
          cpp: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            graph[p[1]].push_back(p[0]);     // need must come first: arrow need -> course
            indeg[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int taken = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            taken++;
            for (int nxt : graph[node]) {
                if (--indeg[nxt] == 0) q.push(nxt);
            }
        }
        return taken == numCourses;          // all emitted: no cycle
    }
};`
        },
        complexity: 'O(V + E) time: every node is emitted at most once and every edge is released once. O(V + E) space for the adjacency list, in-degrees and queue. Here V is `numCourses` and E is the number of pairs.',
        say: '“Each pair says one course must come before another, so I treat it as a directed edge from the prerequisite to the course. A schedule exists exactly when the graph has no cycle. I count in-degrees, queue every course that has none, and repeatedly take one off, lowering the in-degree of the courses it unlocks. If I take off all of them, there was no cycle. If some are left, they all wait on each other. It is O(V + E).”',
        followups: [
          { q: 'How would you detect the cycle with DFS instead?', a: 'Three colours. Mark a node gray while you are exploring below it and black when finished. Reaching a gray node means a back edge, so a cycle. See the DFS variation above.' },
          { q: 'Why does the number of emitted nodes prove there is no cycle?', a: 'Every node on a cycle waits for another node on that cycle, so none of them can ever reach in-degree 0 first. If all n were emitted, no node was stuck, so no cycle exists.' },
          { q: 'What if you also had to return the order (210)?', a: 'Record each node as you emit it and return the list when its length is `numCourses`, otherwise an empty list. That is the next problem.' },
          { q: 'What changes if the pairs may repeat?', a: 'Nothing, as long as the in-degree counts each copy and the loop lowers it once per copy. A duplicate edge is added to the list twice, so it is released twice.' }
        ]
      },
      {
        lc: 210,
        restate: 'Same setup as the previous problem: `numCourses` courses and pairs `[a, b]` meaning `b` must be taken before `a`. Return **an ordering** in which you can take all the courses. Any valid one is accepted. If it is impossible, return an empty list.',
        examples: '- `2`, `[[1, 0]]` → `[0, 1]`.\n- `4`, `[[1, 0], [2, 0], [3, 1], [3, 2]]` → `[0, 1, 2, 3]` or `[0, 2, 1, 3]`: both are fine, since 1 and 2 are independent.\n- Edge cases: `1`, `[]` → `[0]`; a cycle → `[]`, not a partial order.',
        brute: 'Generate permutations and keep the first that satisfies every pair: n! work. Or repeatedly scan the whole course list for a course whose prerequisites are all done: O(V²) over the scans, with no clean way to notice a cycle.',
        insight: 'The order in which Kahn’s loop **emits** nodes is already a topological order, so record it. Return it when its length equals `numCourses`, and an empty list otherwise. The only new code over the previous problem is the list. Be careful to return `[]` for a cycle rather than the partial list you collected: a short list is not a valid answer.',
        code: {
          py: `class Solution:
    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        graph = [[] for _ in range(numCourses)]
        indeg = [0] * numCourses
        for course, need in prerequisites:
            graph[need].append(course)
            indeg[course] += 1
        queue = deque(i for i in range(numCourses) if indeg[i] == 0)
        order = []
        while queue:
            node = queue.popleft()
            order.append(node)               # emitted order is a valid schedule
            for nxt in graph[node]:
                indeg[nxt] -= 1
                if indeg[nxt] == 0:
                    queue.append(nxt)
        return order if len(order) == numCourses else []   # a short list means a cycle`,
          js: `function findOrder(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, need] of prerequisites) {
    graph[need].push(course);
    indeg[course]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  const order = [];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    order.push(node);                        // emitted order is a valid schedule
    for (const nxt of graph[node]) {
      if (--indeg[nxt] === 0) queue.push(nxt);
    }
  }
  return order.length === numCourses ? order : [];   // a short list means a cycle
}`,
          java: `class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) {
            graph.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }
        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.offer(i);
        int[] order = new int[numCourses];
        int count = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            order[count++] = node;           // emitted order is a valid schedule
            for (int nxt : graph.get(node)) {
                if (--indeg[nxt] == 0) queue.offer(nxt);
            }
        }
        return count == numCourses ? order : new int[0];   // a short list means a cycle
    }
}`,
          cpp: `class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            graph[p[1]].push_back(p[0]);
            indeg[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        vector<int> order;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            order.push_back(node);           // emitted order is a valid schedule
            for (int nxt : graph[node]) {
                if (--indeg[nxt] == 0) q.push(nxt);
            }
        }
        if ((int)order.size() != numCourses) return {};   // a short list means a cycle
        return order;
    }
};`
        },
        complexity: 'O(V + E) time and O(V + E) space, as in the previous problem. The output list adds O(V).',
        say: '“I build the graph from prerequisite to course, count in-degrees, and run Kahn’s algorithm. Whatever order I emit nodes in is a valid course order, since a node is only emitted once everything it waits for has been emitted. If I end with fewer than numCourses nodes, there is a cycle, so I return an empty list. O(V + E).”',
        followups: [
          { q: 'The order is not unique. How would you return the lexicographically smallest one?', a: 'Replace the queue with a min-heap of the free nodes and pop the smallest each time. The cost becomes O(V log V + E).' },
          { q: 'How many valid orders can there be?', a: 'Anywhere from one (a single chain) to n! (no edges). Counting them in general needs subset dynamic programming, since the choices interact.' },
          { q: 'Could you do it with DFS?', a: 'Yes: finish order reversed. Detect a cycle with a gray colour, return an empty list on one, and reverse the finish list otherwise.' },
          { q: 'What if you were asked which courses can be taken in the first round?', a: 'The nodes with in-degree 0 before the loop starts. Processing the queue layer by layer gives “round 1, round 2, …”.' }
        ]
      },
      {
        lc: 269,
        restate: 'You are given a list of words that are **sorted according to the rules of an unknown alphabet** (of at most 26 letters). Work out a valid ordering of the letters that appear, and return it as a string. If the list is contradictory or impossible, return an empty string. If several orders are valid, any is accepted.',
        examples: '- `["wrt", "wrf", "er", "ett", "rftt"]` → `"wertf"`: from `wrt` / `wrf` we learn t before f, from `wrf` / `er` w before e, from `er` / `ett` r before t, from `ett` / `rftt` e before r.\n- `["z", "x", "z"]` → `""`: z before x and x before z.\n- `["abc", "ab"]` → `""`: a longer word cannot come before its own prefix.\n- Edge cases: one word → its letters in any order that fits (each letter appears); a letter with no edge still has to appear in the answer.',
        brute: 'Try every permutation of the letters (up to 26!) and check the list is sorted under it. Hopeless beyond a handful of letters.',
        insight: 'The sorted list is just a pile of precedence facts: for each **adjacent** pair of words, the **first differing letter** says which letter comes first. That is a directed graph over letters, so topologically sort it. Three details win or lose this problem. One: **every letter that appears** is a node, even if it has no edge. Two: stop at the first difference (later letters carry no information). Three: if the second word is a **proper prefix of the first**, return `""` at once. Finish with the usual length check: if fewer letters come out than exist, the facts contradict each other.',
        code: {
          py: `class Solution:
    def alienOrder(self, words: List[str]) -> str:
        graph = {c: set() for w in words for c in w}      # every letter is a node
        for w1, w2 in zip(words, words[1:]):
            for a, b in zip(w1, w2):
                if a != b:
                    graph[a].add(b)                       # first difference: a comes before b
                    break
            else:
                if len(w1) > len(w2):
                    return ""                             # longer word before its own prefix
        indeg = {c: 0 for c in graph}
        for a in graph:
            for b in graph[a]:
                indeg[b] += 1
        queue = deque(c for c in graph if indeg[c] == 0)
        out = []
        while queue:
            c = queue.popleft()
            out.append(c)
            for b in graph[c]:
                indeg[b] -= 1
                if indeg[b] == 0:
                    queue.append(b)
        return "".join(out) if len(out) == len(graph) else ""   # short means a contradiction`,
          js: `function alienOrder(words) {
  const graph = new Map();
  for (const w of words) for (const c of w) if (!graph.has(c)) graph.set(c, new Set());   // every letter is a node
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) k++;
    if (k === Math.min(a.length, b.length)) {
      if (a.length > b.length) return "";                  // longer word before its own prefix
    } else {
      graph.get(a[k]).add(b[k]);                           // first difference: a[k] comes before b[k]
    }
  }
  const indeg = new Map();
  for (const c of graph.keys()) indeg.set(c, 0);
  for (const outs of graph.values()) for (const c of outs) indeg.set(c, indeg.get(c) + 1);
  const queue = [];
  for (const c of graph.keys()) if (indeg.get(c) === 0) queue.push(c);
  let out = "";
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head];
    out += c;
    for (const nxt of graph.get(c)) {
      indeg.set(nxt, indeg.get(nxt) - 1);
      if (indeg.get(nxt) === 0) queue.push(nxt);
    }
  }
  return out.length === graph.size ? out : "";             // short means a contradiction
}`,
          java: `class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> graph = new LinkedHashMap<>();
        for (String w : words) for (char c : w.toCharArray()) graph.putIfAbsent(c, new LinkedHashSet<>());   // every letter is a node
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int k = 0, m = Math.min(a.length(), b.length());
            while (k < m && a.charAt(k) == b.charAt(k)) k++;
            if (k == m) {
                if (a.length() > b.length()) return "";    // longer word before its own prefix
            } else {
                graph.get(a.charAt(k)).add(b.charAt(k));   // first difference: a comes before b
            }
        }
        Map<Character, Integer> indeg = new HashMap<>();
        for (char c : graph.keySet()) indeg.put(c, 0);
        for (Set<Character> outs : graph.values()) for (char c : outs) indeg.merge(c, 1, Integer::sum);
        Deque<Character> queue = new ArrayDeque<>();
        for (char c : graph.keySet()) if (indeg.get(c) == 0) queue.offer(c);
        StringBuilder out = new StringBuilder();
        while (!queue.isEmpty()) {
            char c = queue.poll();
            out.append(c);
            for (char nxt : graph.get(c)) {
                if (indeg.merge(nxt, -1, Integer::sum) == 0) queue.offer(nxt);
            }
        }
        return out.length() == graph.size() ? out.toString() : "";   // short means a contradiction
    }
}`,
          cpp: `class Solution {
public:
    string alienOrder(vector<string>& words) {
        map<char, set<char>> graph;
        for (auto& w : words) for (char c : w) graph[c];             // every letter is a node
        for (size_t i = 0; i + 1 < words.size(); i++) {
            const string &a = words[i], &b = words[i + 1];
            size_t k = 0, m = min(a.size(), b.size());
            while (k < m && a[k] == b[k]) k++;
            if (k == m) {
                if (a.size() > b.size()) return "";                  // longer word before its own prefix
            } else {
                graph[a[k]].insert(b[k]);                            // first difference: a[k] comes before b[k]
            }
        }
        map<char, int> indeg;
        for (auto& kv : graph) {
            indeg[kv.first] += 0;
            for (char c : kv.second) indeg[c]++;
        }
        queue<char> q;
        for (auto& kv : indeg) if (kv.second == 0) q.push(kv.first);
        string out;
        while (!q.empty()) {
            char c = q.front(); q.pop();
            out += c;
            for (char nxt : graph[c]) if (--indeg[nxt] == 0) q.push(nxt);
        }
        return out.size() == graph.size() ? out : "";                // short means a contradiction
    }
};`
        },
        complexity: 'O(C + L) time, where L is the total number of characters in all words (one comparison pass) and C is the alphabet size (at most 26 nodes, at most a few hundred edges). Space is O(1) in the alphabet size, since the graph is bounded by 26 letters.',
        say: '“The sorted word list only tells me about letters at the first position where neighbouring words differ, so I compare each adjacent pair and add an edge from the earlier word’s letter to the later one’s. Every letter that appears is a node. If a longer word comes right before its own prefix, I return an empty string. Then I topologically sort the letters with Kahn’s algorithm; if I can’t emit all of them there’s a cycle, so again an empty string.”',
        followups: [
          { q: 'Why only compare adjacent words?', a: 'Sortedness is transitive. If every adjacent pair is in order, the whole list is, so the other pairs add no new facts, only repeats.' },
          { q: 'Why stop at the first differing letter?', a: 'Beyond it the two words are already ordered, so later letters are unconstrained. Using them would invent false rules.' },
          { q: 'What if the answer must be unique, or you must say whether it is?', a: 'It is unique exactly when the queue never holds more than one free letter at a time (a Hamiltonian path in the DAG). Check `len(queue) == 1` at every step.' },
          { q: 'Why is the empty-prefix case separate?', a: 'No letter differs, so the loop adds no edge and nothing would flag it. It is a contradiction by length alone, so it needs its own check.' }
        ]
      },
      {
        lc: 310,
        restate: 'You are given a tree with `n` nodes labelled `0` to `n - 1`, as a list of undirected edges. You may pick any node as the root. The height of the rooted tree is the number of edges on its longest root-to-leaf path. Return **all** the roots that give the smallest possible height, in any order.',
        examples: '- `4`, `[[1, 0], [1, 2], [1, 3]]` → `[1]`: a star; rooting at the centre has height 1.\n- `6`, `[[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]]` → `[3, 4]`.\n- Edge cases: `1`, `[]` → `[0]`; `2`, `[[0, 1]]` → `[0, 1]`; a path of 5 nodes → just the middle node. The answer has **one or two** nodes, never more.',
        brute: 'Root the tree at every node, measure the height with a DFS or BFS, and keep the minimum: O(n²). Too slow for 20,000 nodes.',
        insight: 'The best roots are the **centre** of the tree. Find it by peeling: the leaves are the farthest-out nodes, so remove all leaves together, then the new leaves, and so on, like peeling an onion. When one or two nodes remain, they are the centre. This is Kahn’s algorithm run on an **undirected** tree, where the role of “in-degree 0” is played by **degree 1**. Process the leaves in layers (all current leaves at once) and stop as soon as at most two nodes remain. Special-case `n == 1`, where the lone node has degree 0 and is never a “leaf”.',
        code: {
          py: `class Solution:
    def findMinHeightTrees(self, n: int, edges: List[List[int]]) -> List[int]:
        if n == 1:
            return [0]
        adj = [[] for _ in range(n)]
        deg = [0] * n
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
            deg[a] += 1
            deg[b] += 1
        leaves = [i for i in range(n) if deg[i] == 1]
        remaining = n
        while remaining > 2:
            remaining -= len(leaves)             # peel the whole layer of leaves
            nxt = []
            for leaf in leaves:
                deg[leaf] = 0
                for nb in adj[leaf]:
                    deg[nb] -= 1
                    if deg[nb] == 1:             # nb has become a leaf
                        nxt.append(nb)
            leaves = nxt
        return leaves                            # the one or two centre nodes`,
          js: `function findMinHeightTrees(n, edges) {
  if (n === 1) return [0];
  const adj = Array.from({ length: n }, () => []), deg = new Array(n).fill(0);
  for (const [a, b] of edges) {
    adj[a].push(b); adj[b].push(a);
    deg[a]++; deg[b]++;
  }
  let leaves = [];
  for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);
  let remaining = n;
  while (remaining > 2) {
    remaining -= leaves.length;                  // peel the whole layer of leaves
    const nxt = [];
    for (const leaf of leaves) {
      deg[leaf] = 0;
      for (const nb of adj[leaf]) {
        if (--deg[nb] === 1) nxt.push(nb);       // nb has become a leaf
      }
    }
    leaves = nxt;
  }
  return leaves;                                 // the one or two centre nodes
}`,
          java: `class Solution {
    public List<Integer> findMinHeightTrees(int n, int[][] edges) {
        if (n == 1) return new ArrayList<>(List.of(0));
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] deg = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
            deg[e[0]]++;
            deg[e[1]]++;
        }
        List<Integer> leaves = new ArrayList<>();
        for (int i = 0; i < n; i++) if (deg[i] == 1) leaves.add(i);
        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size();          // peel the whole layer of leaves
            List<Integer> next = new ArrayList<>();
            for (int leaf : leaves) {
                deg[leaf] = 0;
                for (int nb : adj.get(leaf)) {
                    if (--deg[nb] == 1) next.add(nb);   // nb has become a leaf
                }
            }
            leaves = next;
        }
        return leaves;                           // the one or two centre nodes
    }
}`,
          cpp: `class Solution {
public:
    vector<int> findMinHeightTrees(int n, vector<vector<int>>& edges) {
        if (n == 1) return {0};
        vector<vector<int>> adj(n);
        vector<int> deg(n, 0);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
            deg[e[0]]++;
            deg[e[1]]++;
        }
        vector<int> leaves;
        for (int i = 0; i < n; i++) if (deg[i] == 1) leaves.push_back(i);
        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size();          // peel the whole layer of leaves
            vector<int> next;
            for (int leaf : leaves) {
                deg[leaf] = 0;
                for (int nb : adj[leaf]) {
                    if (--deg[nb] == 1) next.push_back(nb);   // nb has become a leaf
                }
            }
            leaves = next;
        }
        return leaves;                           // the one or two centre nodes
    }
};`
        },
        complexity: 'O(n) time: each node is removed once and each edge looked at twice (once per end). O(n) space for the adjacency lists and degree counts.',
        say: '“The roots with the smallest height are the centre of the tree. I find it by peeling leaves layer by layer, like Kahn’s algorithm with degree 1 in place of in-degree 0. Each round I remove every current leaf, lower its neighbour’s degree, and whichever neighbours become leaves form the next layer. I stop when two or fewer nodes remain: those are the centres. A single node is a special case. It’s O(n).”',
        followups: [
          { q: 'Why can there be at most two answers?', a: 'A tree’s centre is the middle of its longest path. A path with an odd number of nodes has one middle, an even number has two. No other node can minimise the height.' },
          { q: 'Why peel all leaves of a layer at once?', a: 'Removing them together keeps the “distance from the outside” even. Removing leaves one by one, in any order, could shave one branch down before another and pick the wrong centre.' },
          { q: 'Could you find the centre without peeling?', a: 'Yes: run BFS from any node to find the farthest node A, BFS again from A to the farthest B, then take the middle of the A-to-B path. Peeling is shorter to code.' },
          { q: 'How does this relate to topological sort?', a: 'It is the same mechanism: a queue (or layer list) of nodes with the smallest remaining “dependency count”, released as their neighbours’ counts fall. The graph is undirected here, so degree 1 plays the role of in-degree 0.' }
        ]
      }
    ],

    practice: [
      { lc: 207,
        hints: ['Turn each pair `[a, b]` into an arrow `b → a`. The question is whether the arrows have a cycle.', 'Count how many arrows point into each course. A course with 0 can be taken now; taking it satisfies the arrows leaving it.', 'Keep a queue of free courses and count how many you take. If the count equals `numCourses`, return `true`.'],
        starter: { py: 'class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        ', js: 'function canFinish(numCourses, prerequisites) {\n  \n}' },
        tests: { fn: 'canFinish', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [2, [[1, 0]]], out: true }, { args: [2, [[1, 0], [0, 1]]], out: false }, { args: [1, []], out: true }, { args: [3, [[0, 0]]], out: false },
          { args: [4, [[1, 0], [2, 1], [3, 2], [1, 3]]], out: false }, { args: [5, [[1, 4], [2, 4], [3, 1], [3, 2]]], out: true }] } },

      { lc: 210,
        hints: ['It is the same graph as the previous problem, but now you must report the order itself.', 'Each time you take a free course off the queue, append it to a result list.', 'If the list ends shorter than `numCourses`, there was a cycle: return an empty list, not the partial one.'],
        starter: { py: 'class Solution:\n    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:\n        ', js: 'function findOrder(numCourses, prerequisites) {\n  \n}' },
        tests: { fn: 'findOrder', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [2, [[1, 0]]], out: [[0, 1]], any: true },
          { args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], out: [[0, 1, 2, 3], [0, 2, 1, 3]], any: true },
          { args: [1, []], out: [[0]], any: true },
          { args: [2, [[0, 1], [1, 0]]], out: [[]], any: true },
          { args: [2, []], out: [[0, 1], [1, 0]], any: true },
          { args: [3, [[1, 0], [1, 2], [0, 1]]], out: [[]], any: true }] } },

      { lc: 269,
        hints: ['Compare each pair of **neighbouring** words and find the first position where they differ. That gives one rule: the first word’s letter comes earlier.', 'Make every letter that appears a node (even ones with no rule). Add edges from the rules and count in-degrees.', 'Run Kahn’s algorithm over the letters. Return `""` if a longer word is followed by its own prefix, or if fewer letters come out than exist.'],
        starter: { py: 'class Solution:\n    def alienOrder(self, words: List[str]) -> str:\n        ', js: 'function alienOrder(words) {\n  \n}' },
        tests: { fn: 'alienOrder', sig: { args: ['str[]'] }, cases: [
          { args: [['wrt', 'wrf', 'er', 'ett', 'rftt']], out: ['wertf'], any: true },
          { args: [['z', 'x']], out: ['zx'], any: true },
          { args: [['z', 'x', 'z']], out: [''], any: true },
          { args: [['abc', 'ab']], out: [''], any: true },
          { args: [['a']], out: ['a'], any: true },
          { args: [['ab', 'ac']], out: ['abc', 'bac', 'bca'], any: true },
          { args: [['za', 'zb', 'ca', 'cb']], out: ['abzc', 'azbc', 'azcb', 'zabc', 'zacb', 'zcab'], any: true }] } },

      { lc: 310,
        hints: ['The best roots sit in the middle of the tree. Think of peeling the outside off, layer by layer.', 'A leaf has degree 1. Remove all current leaves together, lower their neighbours’ degrees, and the neighbours that drop to degree 1 are the next leaves.', 'Stop when two or fewer nodes remain: those are the answer. Handle `n == 1` separately.'],
        starter: { py: 'class Solution:\n    def findMinHeightTrees(self, n: int, edges: List[List[int]]) -> List[int]:\n        ', js: 'function findMinHeightTrees(n, edges) {\n  \n}' },
        tests: { fn: 'findMinHeightTrees', compare: 'unordered', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [4, [[1, 0], [1, 2], [1, 3]]], out: [1] }, { args: [6, [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]]], out: [3, 4] }, { args: [1, []], out: [0] },
          { args: [2, [[0, 1]]], out: [0, 1] }, { args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], out: [2] }] } },

      { lc: 802,
        hints: ['A node is safe if every path out of it ends at a node with no outgoing edges. A node on a cycle, or leading into one, is not safe.', 'Flip every edge. Now the nodes with no outgoing edges (original out-degree 0) are the ones with “nothing to wait for”: they are safe.', 'Run Kahn’s algorithm on the reversed graph, counting **out-degrees**. Every node it reaches is safe. Return them sorted.'],
        solution: { explain: 'Reverse the edges and run Kahn’s algorithm using out-degree as the count. A node is safe when all of its targets are safe, i.e. when its out-degree reaches 0. O(V + E).', code: {
          py: `class Solution:
    def eventualSafeNodes(self, graph: List[List[int]]) -> List[int]:
        n = len(graph)
        rev = [[] for _ in range(n)]
        outdeg = [len(g) for g in graph]
        for u in range(n):
            for v in graph[u]:
                rev[v].append(u)             # flipped: v points back at u
        queue = deque(i for i in range(n) if outdeg[i] == 0)
        safe = []
        while queue:
            v = queue.popleft()
            safe.append(v)
            for u in rev[v]:
                outdeg[u] -= 1               # one more of u's targets is safe
                if outdeg[u] == 0:
                    queue.append(u)
        return sorted(safe)`,
          js: `function eventualSafeNodes(graph) {
  const n = graph.length, rev = Array.from({ length: n }, () => []);
  const outdeg = graph.map(g => g.length);
  for (let u = 0; u < n; u++) for (const v of graph[u]) rev[v].push(u);   // flipped: v points back at u
  const queue = [];
  for (let i = 0; i < n; i++) if (outdeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    for (const u of rev[queue[head]]) {
      if (--outdeg[u] === 0) queue.push(u);   // all of u's targets are safe
    }
  }
  return queue.sort((a, b) => a - b);
}` } },
        starter: { py: 'class Solution:\n    def eventualSafeNodes(self, graph: List[List[int]]) -> List[int]:\n        ', js: 'function eventualSafeNodes(graph) {\n  \n}' },
        tests: { fn: 'eventualSafeNodes', cases: [
          { args: [[[1, 2], [2, 3], [5], [0], [5], [], []]], out: [2, 4, 5, 6] }, { args: [[[1, 2, 3, 4], [1, 2], [3, 4], [0, 4], []]], out: [4] },
          { args: [[[]]], out: [0] }, { args: [[[1], [0]]], out: [] }, { args: [[[1], [2], []]], out: [0, 1, 2] }] } },

      { lc: 1136,
        hints: ['Each relation `[a, b]` is an arrow `a → b` (a before b), with courses numbered from 1. Everything that is free can be taken in the same semester.', 'Run Kahn’s algorithm one **layer** at a time: all courses currently in the queue form one semester.', 'Count the layers. If fewer than `n` courses were taken in total, there is a cycle, so return -1.'],
        solution: { explain: 'Kahn’s algorithm by layers. Each round empties the current queue, which is one semester (all those courses are independent), and releases the next set. Answer is the number of rounds, or -1 if a cycle left courses untaken. O(V + E).', code: {
          py: `class Solution:
    def minimumSemesters(self, n: int, relations: List[List[int]]) -> int:
        graph = [[] for _ in range(n + 1)]
        indeg = [0] * (n + 1)
        for a, b in relations:
            graph[a].append(b)
            indeg[b] += 1
        queue = deque(i for i in range(1, n + 1) if indeg[i] == 0)
        semesters = taken = 0
        while queue:
            semesters += 1
            for _ in range(len(queue)):          # everything free right now: one semester
                node = queue.popleft()
                taken += 1
                for nxt in graph[node]:
                    indeg[nxt] -= 1
                    if indeg[nxt] == 0:
                        queue.append(nxt)
        return semesters if taken == n else -1`,
          js: `function minimumSemesters(n, relations) {
  const graph = Array.from({ length: n + 1 }, () => []), indeg = new Array(n + 1).fill(0);
  for (const [a, b] of relations) { graph[a].push(b); indeg[b]++; }
  let queue = [], semesters = 0, taken = 0;
  for (let i = 1; i <= n; i++) if (indeg[i] === 0) queue.push(i);
  while (queue.length) {
    semesters++;                                 // everything free right now: one semester
    const next = [];
    for (const node of queue) {
      taken++;
      for (const nxt of graph[node]) if (--indeg[nxt] === 0) next.push(nxt);
    }
    queue = next;
  }
  return taken === n ? semesters : -1;
}` } },
        starter: { py: 'class Solution:\n    def minimumSemesters(self, n: int, relations: List[List[int]]) -> int:\n        ', js: 'function minimumSemesters(n, relations) {\n  \n}' },
        tests: { fn: 'minimumSemesters', cases: [
          { args: [3, [[1, 3], [2, 3]]], out: 2 }, { args: [3, [[1, 2], [2, 3], [3, 1]]], out: -1 }, { args: [4, [[2, 1], [3, 1], [1, 4]]], out: 3 },
          { args: [1, []], out: 1 }, { args: [3, []], out: 1 }] } }
    ],

    mistakes: [
      '**Returning the order without checking its length.** Kahn’s loop does not throw on a cycle; it just stops early. Always compare the number of emitted nodes with `n` (or return an empty result when it is short).',
      '**Pointing the edge the wrong way.** For a prerequisite pair `[course, needs]` the arrow is `needs → course`, and `course` gets the in-degree. Reversing it gives a mirrored order (and a wrong answer for any order-returning problem). Say the direction out loud before coding.',
      '**Forgetting isolated nodes.** A course in no pair, or a letter with no rule, still has to be in the answer. Create the nodes from `range(n)` or from every letter seen, not from the edge list alone.',
      '**Plain visited flags in the DFS version.** With only “seen or not” you cannot tell a finished node from one on your current path, so you either miss cycles or report false ones. Use three colours, or a `visiting` set alongside a `done` set.',
      '**Dropping the prefix case in the alien-dictionary style.** When a longer word is followed by its own prefix, the first-difference loop finds no difference and adds nothing, so the input looks valid. Check the lengths when there is no differing letter.',
      '**Treating an undirected graph as directed (or the reverse).** Kahn’s algorithm on directed edges needs in-degrees. Peeling leaves in a tree uses degree 1 and edges stored both ways; the stop condition is “at most two nodes left”, not an empty queue. Mixing the two makes the loop never start, or never stop.',
      '**Duplicate edges double-counting in-degree.** If the input can repeat a pair and you store neighbours in a **set** but count in-degrees per input pair, the counts disagree and a node never reaches 0. Count and store the same way (both per copy, or both deduplicated).',
      '**Language gotchas.** *Python:* a recursive DFS on a 100,000-node chain hits the recursion limit; prefer Kahn there. *JavaScript:* `queue.shift()` in a hot loop is O(n); use a head index. *Java:* `queue.poll()` on an `ArrayDeque<Integer>` returns `null` when empty, and unboxing it into an `int` throws. *C++:* `queue::pop()` returns void, so read `front()` first.'
    ],

    quiz: [
      { kind: 'concept', q: 'Which statement is true about a directed graph and topological orders?',
        choices: ['A valid order exists exactly when the graph has no directed cycle', 'A valid order always exists if the graph is connected', 'There is always exactly one valid order', 'A valid order exists only if every node has in-degree 0 or 1'], answer: 0,
        explain: 'Every node on a directed cycle waits for another node on it, so no order can place all of them. With no cycle, some node has in-degree 0, and repeating that argument builds an order. Several orders usually exist; connectivity is irrelevant.' },
      { kind: 'concept', q: 'In Kahn’s algorithm, what does the queue hold at any moment?',
        choices: ['Nodes whose remaining in-degree is 0 and which have not been emitted yet', 'Nodes that have already been emitted, in order', 'Nodes on the current DFS path', 'The nodes with the largest in-degree'], answer: 0,
        explain: 'The queue is the set of nodes that wait for nothing any more. Emitted nodes go to the result list, not back in the queue.' },
      { kind: 'bug', q: 'This function is meant to return a valid course order or an empty list if impossible. What is wrong?',
        code: `def find_order(n, pairs):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for course, need in pairs:
        graph[need].append(course)
        indeg[course] += 1
    queue = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    return order`,
        choices: ['It never checks that `len(order) == n`, so a cycle returns a short list as if it were valid', 'The edge direction is reversed', 'It should use a stack instead of a queue', 'It forgets to count in-degrees'], answer: 0,
        explain: 'Edge direction and in-degrees are right. A cycle leaves nodes stuck, and the loop just ends with a short list. Add `return order if len(order) == n else []`. A stack would give another valid order, not a fix.' },
      { kind: 'pattern', q: 'Words sorted by a hidden alphabet are given, and you must recover letter order. For adjacent words `"cab"` and `"cat"`, what do you learn?',
        choices: ['`b` comes before `t`: the first differing letters give one rule', '`c` comes before `a`', '`cab` and `cat` share a prefix, so they give no rule', 'Both `b` before `t` and `a` before `t`'], answer: 0,
        explain: 'Compare position by position until the first difference: `c = c`, `a = a`, then `b` vs `t`. Only that pair gives a rule. Letters after it say nothing, and equal letters give nothing.' },
      { kind: 'complexity', q: 'A graph has V nodes and E edges. What is the time cost of Kahn’s algorithm with an adjacency list?',
        choices: ['O(V + E)', 'O(V · E)', 'O(V²) in all cases', 'O(E log V)'], answer: 0,
        explain: 'Each node is emitted once and each edge is released once. Building the graph and in-degrees is also O(V + E). A heap-based version (smallest order) would add a log factor.' },
      { kind: 'pattern', q: 'Which tasks are naturally solved with topological sort? Pick every one that applies.',
        choices: ['The minimum number of rounds to finish tasks when independent ones run together', 'Deciding if a build system has a circular dependency', 'Finding the cheapest path in a graph with positive edge weights', 'Producing a valid install order for packages with dependencies'], answer: [0, 1, 3],
        explain: 'Rounds (longest chain), cycle detection and dependency ordering are all topological. Cheapest weighted paths use Dijkstra (a heap), unless the graph is a DAG, where a topological pass can do it too, but that is a different cue.' },
      { kind: 'concept', q: 'In the DFS version, why do you need a third colour instead of just visited / not visited?',
        choices: ['To tell a node still on the current path (a cycle) from a node already finished (fine)', 'To make the DFS run in O(V + E) instead of O(V²)', 'To avoid visiting nodes with in-degree 0', 'It is only needed for undirected graphs'], answer: 0,
        explain: 'Reaching a visited node can mean two different things. If it is on the current path you have walked in a circle; if it is finished you have simply found a shared descendant. Only the colour (gray versus black) separates them.' },
      { kind: 'complexity', q: 'A task graph has independent tasks running in parallel, one time unit each. How do you get the minimum total time?',
        choices: ['The length of the longest dependency chain, found by carrying `dist[v] = max(dist[v], dist[u] + 1)` along Kahn’s loop', 'The number of nodes divided by the number of free nodes', 'The number of edges', 'The in-degree of the last node emitted'], answer: 0,
        explain: 'Parallel tasks finish together, so only the longest chain of “must wait for” links matters. Because a node is processed after all its prerequisites, its `dist` is final when its turn comes.' }
    ],

    flashcards: [
      { id: 'topo-def', front: 'What is a topological order, and when does one exist?', back: 'A list of all nodes in which every directed edge `a → b` has `a` before `b`. It exists exactly when the graph is a DAG (has no directed cycle).' },
      { id: 'indegree', front: 'What is in-degree and why does Kahn’s algorithm use it?', back: 'The number of edges pointing **into** a node: how many things it still waits for. In-degree 0 means it can go now. Emitting a node lowers its targets’ in-degrees by 1.' },
      { id: 'kahn-steps', front: 'Kahn’s algorithm in five lines.', back: '1. Build the graph and in-degrees. 2. Queue every node with in-degree 0. 3. Pop one, emit it. 4. For each target, in-degree −1. 5. If it hits 0, queue it. Repeat until the queue is empty.' },
      { id: 'kahn-cycle', front: 'How does Kahn’s algorithm detect a cycle?', back: 'If fewer than n nodes were emitted, the rest still have in-degree above 0 because they wait on each other (or on a cycle). A short order means a cycle.' },
      { id: 'edge-dir', front: 'Prerequisite pair `[course, needs]`: which way is the edge?', back: '`needs → course`. The in-degree is counted on `course`. Reversing it mirrors the order.' },
      { id: 'dfs-colors', front: 'DFS cycle detection: the three colours.', back: 'White = not visited, gray = on the current path, black = finished. Reaching a gray node is a back edge, so a cycle. Reverse finish order is a topological order.' },
      { id: 'dfs-reverse-post', front: 'Why is reverse DFS finish order a valid topological order?', back: 'A node finishes only after everything it points to has finished. So in the finish list every target comes before its source; reverse it and every source comes first.' },
      { id: 'longest-dag', front: 'Longest path in a DAG: how?', back: 'Process nodes in topological order and relax each edge: `dist[v] = max(dist[v], dist[u] + 1)` (or + the task’s duration). O(V + E). It is the number of rounds when independent tasks run in parallel.' },
      { id: 'many-orders', front: 'One order, smallest order, all orders?', back: 'Kahn gives one. Use a min-heap instead of a queue for the lexicographically smallest. Listing all orders is backtracking over the free nodes: exponential, tiny inputs only.' },
      { id: 'alien-edges', front: 'Alien dictionary: how do you get edges from the word list?', back: 'Compare adjacent words; the first position where they differ gives `a → b`. Stop there. Add every letter as a node. If a longer word precedes its own prefix, return an empty answer.' },
      { id: 'leaf-peel', front: 'Minimum height trees: why peel leaves?', back: 'The best roots are the centre of the tree. Remove all leaves (degree 1) layer by layer, like Kahn with degree 1; when at most two nodes remain, they are the answer.' },
      { id: 'safe-states', front: 'Eventual safe nodes: which trick?', back: 'Reverse the edges and run Kahn using out-degree. A node is safe when all its targets are safe, i.e. its out-degree reaches 0. Nodes on or leading into a cycle never get there.' }
    ],

    deeper: [
      { title: 'Topological sort problems (LeetCode tag)', url: 'https://leetcode.com/tag/topological-sort/', time: 'reference', note: 'LeetCode’s list of problems tagged topological sort. Start with the course-schedule pair and the alien dictionary, then the parallel-courses family for the longest-path variant.' },
      { title: 'Topological Sorting (cp-algorithms)', url: 'https://cp-algorithms.com/graph/topological-sort.html', time: '15 min', note: 'A compact write-up of the DFS version and why reverse finish order works, with code.' },
      { title: 'Topological sorting (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Topological_sorting', time: '15 min', note: 'Both algorithms (Kahn’s and DFS), uniqueness of the order, and applications such as build systems and instruction scheduling.' },
      { title: 'Graph algorithms (William Fiset, YouTube)', url: 'https://www.youtube.com/@WilliamFiset-videos', time: 'about 20 min per video', note: 'Fiset’s graph theory playlist has topological sort animated step by step, with the DAG longest-path trick.' }
    ],

    detective: [
      { id: 'film-schedule', decoys: ['graphs', 'backtracking', 'intervals'],
        statement: 'A film crew has a list of scenes to shoot. Some scenes cannot be shot until others are in the can: the rooftop chase needs the costume fitting done, the finale needs both the chase and the dinner scene. The producer hands you the list of “this scene must come before that one” notes and asks for one shooting order that respects every note, or a clear statement that the notes contradict each other.',
        why: 'The answer is a single line-up of items in which every “must come first” note points forward, or proof that none exists. Count how many notes still hold each scene back, shoot the free ones, release what they were blocking, and if you run out of free scenes while some remain, the notes form a loop.' },
      { id: 'spreadsheet-refresh', decoys: ['graphs', 'recursion', 'design-ds'],
        statement: 'A shared budgeting sheet has cells whose values are formulas using other cells: the total uses the three subtotals, each subtotal uses a few line items, and so on. When a single input changes, the sheet must recalculate every affected cell, and it must never compute a cell before the cells it reads are ready. You are given, for each cell, the cells it reads, and you need an order in which to recalculate them all. If two cells read each other in a circle, the sheet should flag an error instead.',
        why: 'Each cell must be handled after everything it reads, and a circle of cells reading each other is the failure case. That is “list items so each comes after what it depends on”, with cycle detection built in: process cells that depend on nothing pending, and an incomplete result means a circular reference.' },
      { id: 'museum-codes', decoys: ['graphs', 'tries', 'sorting'],
        statement: 'An old museum archive shelves its boxes by a symbol code, in an ordering of symbols nobody remembers. All you have is a printed list of sample codes, already in correct shelf order, made of lowercase letters. From that list alone you must reconstruct one ordering of the symbols that would put the samples in the order shown, or say it cannot be done because the list contradicts itself.',
        why: 'You never get the ordering directly; each pair of neighbouring samples quietly yields one “this symbol before that one” fact at the first position where they differ. Collect those facts as arrows between symbols and line the symbols up so every arrow points forward. Failing to line them all up means the list contradicts itself.' }
    ]
  });
})();
