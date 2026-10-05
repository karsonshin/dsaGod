/* Offer Ready: Shortest paths. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in.
   JavaScript has no built-in heap, so HEAP (a compact comparator heap, same as heaps.js) is pasted into the JS snippets that need one. */
(function () {
  var OR = (window.OR = window.OR || {});
  var HEAP = `class Heap {                         // min-heap by default; pass less = (a, b) => a > b for a max-heap
  constructor(less = (a, b) => a < b) { this.a = []; this.less = less; }
  get size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {                    // sift up
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]]; i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (2 * i + 1 < a.length) {   // sift down
        let c = 2 * i + 1;
        if (c + 1 < a.length && this.less(a[c + 1], a[c])) c++;
        if (!this.less(a[c], a[i])) break;
        [a[c], a[i]] = [a[i], a[c]]; i = c;
      }
    }
    return top;
  }
}
`;
  (OR.topics = OR.topics || []).push({
    id: 'shortest-paths',

    hook: 'Maps, flight search, network routing and “cheapest way to get there” all reduce to one question: what is the lowest-cost route from here to there when every road has its own price? Breadth-first search answers it only when every edge costs the same. The moment edges have different weights you need **Dijkstra**, and the interview twists (a limit on the number of stops, negative prices, all pairs at once, a grid of costs, “the smallest worst step”) are each a one-line change to it or a sibling algorithm. It is a medium-frequency topic that is very predictable once you have the template, and NeetCode 150 puts three of its problems in the Advanced Graphs section.',

    cues: [
      'You want the **cheapest, fastest or shortest route** and the edges have **different, non-negative weights** (distance, time, price, effort).',
      'The question says **“at most k stops/edges”**, or lets you use a limited number of free passes: the hop count joins the state. That’s Bellman-Ford rounds or Dijkstra on `(node, hops)`.',
      'A grid where each cell has a cost or a height, and you want the best way from one corner to the other: **Dijkstra on a grid**.',
      'You minimise the **worst single step** (largest height jump, rising water level, narrowest bridge) rather than the sum: the **minimax** variation of Dijkstra.',
      'Every edge costs exactly **0 or 1**: a deque beats a heap (**0-1 BFS**). Every edge costs the same: plain BFS.',
      'The graph is small (about 400 nodes) and you need **every pair** of distances, or “which city has the fewest neighbours within a limit”: **Floyd-Warshall**.',
      'The trap: **negative weights**. Dijkstra’s core claim, “the smallest unfinished distance is final”, is false once a later edge can subtract cost. Use Bellman-Ford there.'
    ],

    intuition: [
      'Imagine lighting a fuse at the start city. Fire races along every road at the same speed, so a road that costs 9 takes nine seconds to burn. The first moment the flame reaches a city, that is the shortest distance to it, because every other route would have arrived later. You never need to look at that city’s distance again.',
      'That is **Dijkstra’s algorithm**. Concretely:',
      '1. Keep a table `dist` of the best known distance to every node: **0** for the start and **∞** for everything else.\n2. Keep a **priority queue** of `(distance, node)` pairs, smallest first, holding the places the fire could reach next. It starts with `(0, start)`.\n3. **Pop** the smallest pair. Nothing else in the queue is closer, and all weights are non-negative, so no other route can reach this node more cheaply: its distance is **final**.\n4. **Relax** each outgoing edge `u → v` of weight `w`: if `dist[u] + w < dist[v]`, you found a better route to `v`. Record it and push the new pair.\n5. Repeat until the queue is empty (or until you pop the node you wanted).',
      'The heap can’t change a value that is already inside it, so you leave the old, worse entry there and let it come out later. When it does, its distance is bigger than `dist[node]`, so you recognise it as **stale** and skip it. That one `if d > dist[u]: continue` line is the whole price of not having a decrease-key operation. The priority queue is the [heap](#/topic/heaps) you already know.',
      '**Why negative edges break it.** The proof of step 3 says: any other route to this node first travels through some node still in the queue, which is at least as far away, and then only adds non-negative cost. A negative edge lets that last step *subtract* cost, so a route through a “farther” node can win later, and a node you already finished turns out to have been reached too expensively. (A version that skips settled nodes returns wrong answers. The lazy version above recovers a correct answer but can take exponential time, and a **negative cycle** never ends. Try the last two presets in the visualizer.) **Bellman-Ford** handles negative edges by not trusting any order: it relaxes every edge, V − 1 times.',
      'A quick map of the family. **BFS**: all edges equal, O(V + E). **0-1 BFS**: edges cost 0 or 1, O(V + E) with a deque. **Dijkstra**: non-negative weights, O((V + E) log V). **Bellman-Ford**: negative edges, or a limit on the number of edges, O(V·E). **Floyd-Warshall**: all pairs on a small graph, O(V³). **A\\***: Dijkstra plus a guess of the remaining distance to steer toward one target.'
    ].join('\n\n'),

    viz: 'dijkstra',

    template: {
      title: 'Dijkstra with a heap: pop the smallest, skip stale entries, relax the edges',
      note: 'This is the version to memorise. The **visualizer above lights these exact lines**: `init` sets up the table and queue, `pop` takes the cheapest `(distance, node)`, `stale` throws away an entry that a better route has already beaten, `relax` asks whether going through `u` is shorter, and `update` records the improvement and pushes it. The roads here run both ways, so each edge is stored twice; for a one-way graph add it once. Unreachable nodes come back as `-1`. Every other problem on this page is this loop with a different cost rule, a different state, or a different container.',
      code: {
        py: `def dijkstra(n, edges, src):
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))                  #> Adjacency list of (neighbor, weight). These roads run both ways, so each is stored twice
        graph[v].append((u, w))
    dist = [inf] * n                             #> Best known distance to every node: infinity until a route is found
    dist[src] = 0                                #@init > 1. Start: the source is 0 away from itself
    heap = [(0, src)]                            #> The queue holds (distance, node) pairs, smallest first
    while heap:
        d, u = heapq.heappop(heap)               #@pop > 2. Pop the cheapest entry: with no negative edges, d is now the final distance to u
        if d > dist[u]:                          #@stale > 3. A better route to u was found after this entry was pushed: skip the stale copy
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:                  #@relax > 4. Relax the edge: is the route through u shorter than the best one known to v?
                dist[v] = d + w                  #@update > 5. Yes: record it and push the new pair (no decrease-key, so the old one goes stale)
                heapq.heappush(heap, (d + w, v)) #@update
    return [-1 if x == inf else x for x in dist]`,
        js: HEAP + `
function dijkstra(n, edges, src) {
  const graph = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    graph[u].push([v, w]);                     //> Adjacency list of [neighbor, weight]. These roads run both ways, so each is stored twice
    graph[v].push([u, w]);
  }
  const dist = new Array(n).fill(Infinity);    //> Best known distance to every node: infinity until a route is found
  dist[src] = 0;                               //@init > 1. Start: the source is 0 away from itself
  const heap = new Heap((a, b) => a[0] < b[0]);//> The queue holds [distance, node] pairs, smallest first
  heap.push([0, src]);
  while (heap.size) {
    const [d, u] = heap.pop();                 //@pop > 2. Pop the cheapest entry: with no negative edges, d is now the final distance to u
    if (d > dist[u]) continue;                 //@stale > 3. A better route to u was found after this entry was pushed: skip the stale copy
    for (const [v, w] of graph[u]) {
      if (d + w < dist[v]) {                   //@relax > 4. Relax the edge: is the route through u shorter than the best one known to v?
        dist[v] = d + w;                       //@update > 5. Yes: record it and push the new pair (no decrease-key, so the old one goes stale)
        heap.push([d + w, v]);                 //@update
      }
    }
  }
  return dist.map((x) => (x === Infinity ? -1 : x));
}`,
        java: `class Solution {
    public int[] dijkstra(int n, int[][] edges, int src) {
        List<List<int[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) {
            graph.get(e[0]).add(new int[]{e[1], e[2]});         //> Adjacency list of {neighbor, weight}. These roads run both ways, so each is stored twice
            graph.get(e[1]).add(new int[]{e[0], e[2]});
        }
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);                    //> Best known distance to every node: "infinity" until a route is found
        dist[src] = 0;                                           //@init > 1. Start: the source is 0 away from itself
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));   //> The queue holds {distance, node} pairs, smallest first
        heap.offer(new int[]{0, src});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();                             //@pop > 2. Pop the cheapest entry: with no negative edges, d is now the final distance to u
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;                           //@stale > 3. A better route to u was found after this entry was pushed: skip the stale copy
            for (int[] nb : graph.get(u)) {
                int v = nb[0], nd = d + nb[1];
                if (nd < dist[v]) {                              //@relax > 4. Relax the edge: is the route through u shorter than the best one known to v?
                    dist[v] = nd;                                //@update > 5. Yes: record it and push the new pair (no decrease-key, so the old one goes stale)
                    heap.offer(new int[]{nd, v});                //@update
                }
            }
        }
        for (int i = 0; i < n; i++) if (dist[i] == Integer.MAX_VALUE) dist[i] = -1;
        return dist;
    }
}`,
        cpp: `class Solution {
public:
    vector<int> dijkstra(int n, vector<vector<int>>& edges, int src) {
        vector<vector<pair<int, int>>> graph(n);
        for (auto& e : edges) {
            graph[e[0]].push_back({e[1], e[2]});                 //> Adjacency list of {neighbor, weight}. These roads run both ways, so each is stored twice
            graph[e[1]].push_back({e[0], e[2]});
        }
        vector<int> dist(n, INT_MAX);                            //> Best known distance to every node: "infinity" until a route is found
        dist[src] = 0;                                           //@init > 1. Start: the source is 0 away from itself
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;   //> A min-heap of {distance, node}: greater<> flips C++'s default max-heap
        heap.push({0, src});
        while (!heap.empty()) {
            auto [d, u] = heap.top();                            //@pop > 2. Pop the cheapest entry: with no negative edges, d is now the final distance to u
            heap.pop();
            if (d > dist[u]) continue;                           //@stale > 3. A better route to u was found after this entry was pushed: skip the stale copy
            for (auto [v, w] : graph[u]) {
                if (d + w < dist[v]) {                           //@relax > 4. Relax the edge: is the route through u shorter than the best one known to v?
                    dist[v] = d + w;                             //@update > 5. Yes: record it and push the new pair (no decrease-key, so the old one goes stale)
                    heap.push({d + w, v});                       //@update
                }
            }
        }
        for (int& x : dist) if (x == INT_MAX) x = -1;
        return dist;
    }
};`
      },
      tests: { fn: 'dijkstra', sig: { args: ['int', 'int[][]', 'int'] }, cases: [
        { args: [6, [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [2, 5, 2], [3, 4, 6], [4, 5, 9]], 0], out: [0, 7, 9, 20, 20, 11] },
        { args: [1, [], 0], out: [0] },
        { args: [4, [[0, 1, 3]], 0], out: [0, 3, -1, -1] },
        { args: [3, [[0, 1, 4], [0, 2, 1], [2, 1, 2]], 0], out: [0, 3, 1] },
        { args: [3, [[0, 1, 0], [1, 2, 0]], 1], out: [0, 0, 0] },
        { args: [6, [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [2, 5, 2], [3, 4, 6], [4, 5, 9]], 4], out: [20, 21, 11, 6, 0, 9] }] }
    },

    complexity: {
      time: 'Dijkstra O((V + E) log V) · Bellman-Ford O(V·E) · Floyd-Warshall O(V³) · 0-1 BFS O(V + E)',
      space: 'O(V + E) for the graph, O(V) for the table, up to O(E) in the queue',
      why: 'With a binary heap and lazy deletion, every **edge relaxation that succeeds pushes at most one entry**, so the queue holds at most E entries over the whole run. Each push and pop costs O(log E), which is O(log V) because E ≤ V². The loop pops each entry once and scans each adjacency list only for entries that are not stale, so each edge is scanned once: O(E log V) overall, usually written O((V + E) log V). Bellman-Ford sweeps all E edges up to V − 1 times. Floyd-Warshall has three nested loops of length V. 0-1 BFS touches each edge a constant number of times because the deque never needs to sort.',
      trap: 'Three things trip people up. (1) **Dijkstra is not “BFS with a heap” for free**: put a visited check at *push* time instead of at *pop* time and you return wrong distances. Mark a node final when it is **popped**. (2) A dense graph (E near V²) is better served by the simple array version, O(V²), or by Floyd-Warshall if V is tiny. (3) With a hop limit, the state is `(node, hops used)`, so a plain `dist[node]` table is not enough: a pricier route with fewer hops can matter later.'
    },

    variations: [
      {
        name: 'Recover the path, not just the distance',
        body: 'Most questions ask for a distance, but some want the route itself. Keep a `parent` array next to `dist`: every time you improve `dist[v]` through `u`, set `parent[v] = u`. When the queue is empty, start at the destination and follow `parent` links back to the source, then reverse. The parent of a node is only written when its distance improves, so the final chain is the shortest route (ties return one of them). The visualizer’s last frame does exactly this.',
        code: {
          py: `def shortest_path(n, edges, src, dst):
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [inf] * n
    dist[src] = 0
    parent = [-1] * n
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                parent[v] = u                     #> Remember who gave v its best distance
                heapq.heappush(heap, (d + w, v))
    if dist[dst] == inf:
        return []
    path = [dst]
    while path[-1] != src:
        path.append(parent[path[-1]])             #> Walk the parent links back to the source
    return path[::-1]                             #> ...then flip the list`,
          js: HEAP + `
function shortestPath(n, edges, src, dst) {
  const graph = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) { graph[u].push([v, w]); graph[v].push([u, w]); }
  const dist = new Array(n).fill(Infinity), parent = new Array(n).fill(-1);
  dist[src] = 0;
  const heap = new Heap((a, b) => a[0] < b[0]);
  heap.push([0, src]);
  while (heap.size) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;
    for (const [v, w] of graph[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        parent[v] = u;                            //> Remember who gave v its best distance
        heap.push([d + w, v]);
      }
    }
  }
  if (dist[dst] === Infinity) return [];
  const path = [dst];
  while (path[path.length - 1] !== src) path.push(parent[path[path.length - 1]]);   //> Walk the parent links back to the source
  return path.reverse();                          //> ...then flip the list
}`,
          java: `class Solution {
    public List<Integer> shortestPath(int n, int[][] edges, int src, int dst) {
        List<List<int[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) {
            graph.get(e[0]).add(new int[]{e[1], e[2]});
            graph.get(e[1]).add(new int[]{e[0], e[2]});
        }
        int[] dist = new int[n], parent = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(parent, -1);
        dist[src] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[]{0, src});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;
            for (int[] nb : graph.get(u)) {
                int v = nb[0], nd = d + nb[1];
                if (nd < dist[v]) {
                    dist[v] = nd;
                    parent[v] = u;                            //> Remember who gave v its best distance
                    heap.offer(new int[]{nd, v});
                }
            }
        }
        List<Integer> path = new ArrayList<>();
        if (dist[dst] == Integer.MAX_VALUE) return path;
        for (int v = dst; v != -1; v = parent[v]) path.add(v);   //> Walk the parent links back to the source
        Collections.reverse(path);                            //> ...then flip the list
        return path;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> shortestPath(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<pair<int, int>>> graph(n);
        for (auto& e : edges) {
            graph[e[0]].push_back({e[1], e[2]});
            graph[e[1]].push_back({e[0], e[2]});
        }
        vector<int> dist(n, INT_MAX), parent(n, -1);
        dist[src] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;
        heap.push({0, src});
        while (!heap.empty()) {
            auto [d, u] = heap.top();
            heap.pop();
            if (d > dist[u]) continue;
            for (auto [v, w] : graph[u]) {
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    parent[v] = u;                            //> Remember who gave v its best distance
                    heap.push({d + w, v});
                }
            }
        }
        vector<int> path;
        if (dist[dst] == INT_MAX) return path;
        for (int v = dst; v != -1; v = parent[v]) path.push_back(v);   //> Walk the parent links back to the source
        reverse(path.begin(), path.end());                    //> ...then flip the list
        return path;
    }
};`
        },
        tests: { fn: { py: 'shortest_path', default: 'shortestPath' }, sig: { args: ['int', 'int[][]', 'int', 'int'] }, cases: [
          { args: [6, [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [2, 5, 2], [3, 4, 6], [4, 5, 9]], 0, 4], out: [0, 2, 5, 4] },
          { args: [3, [[0, 1, 1], [1, 2, 1], [0, 2, 5]], 0, 2], out: [0, 1, 2] },
          { args: [2, [[0, 1, 1]], 0, 0], out: [0] },
          { args: [3, [[0, 1, 1]], 0, 2], out: [] }] }
      },
      {
        name: 'Bellman-Ford, and the “at most k edges” limit',
        body: 'Bellman-Ford drops the priority queue and the “finalised” idea entirely. **Round r** relaxes every edge once, using the distances from the end of round r − 1. After round r, `dist[v]` is the cheapest cost using **at most r edges**. A shortest path never repeats a node, so it has at most V − 1 edges: V − 1 rounds are enough, and if a V-th round still improves something, a **negative cycle** is reachable. That “after r rounds, at most r edges” meaning is also why it solves hop-limited problems: run exactly k rounds. The detail that matters is the copy: read the **old** row (`dist`) and write a **new** one (`nxt`), otherwise one round can chain several edges and the limit leaks. Without a limit you may update in place and stop early when a round changes nothing. Costs `1000000000` stand in for “unreachable” here, and the guard `dist[u] != INF` stops an infinite value from absorbing a negative edge.',
        code: {
          py: `def bellman_ford(n, edges, src, k):
    INF = 10**9
    dist = [INF] * n
    dist[src] = 0
    for _ in range(k):                            #> One round = one more edge allowed, so k rounds find paths of at most k edges
        nxt = dist[:]                             #> Read last round's row, write a new one: otherwise a round could use several edges
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < nxt[v]:
                nxt[v] = dist[u] + w
        dist = nxt
    return dist`,
          js: `function bellmanFord(n, edges, src, k) {
  const INF = 1e9;
  let dist = new Array(n).fill(INF);
  dist[src] = 0;
  for (let round = 0; round < k; round++) {      //> One round = one more edge allowed, so k rounds find paths of at most k edges
    const nxt = dist.slice();                    //> Read last round's row, write a new one: otherwise a round could use several edges
    for (const [u, v, w] of edges) {
      if (dist[u] !== INF && dist[u] + w < nxt[v]) nxt[v] = dist[u] + w;
    }
    dist = nxt;
  }
  return dist;
}`,
          java: `class Solution {
    public int[] bellmanFord(int n, int[][] edges, int src, int k) {
        final int INF = 1000000000;
        int[] dist = new int[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        for (int round = 0; round < k; round++) {   //> One round = one more edge allowed, so k rounds find paths of at most k edges
            int[] nxt = dist.clone();               //> Read last round's row, write a new one: otherwise a round could use several edges
            for (int[] e : edges)
                if (dist[e[0]] != INF && dist[e[0]] + e[2] < nxt[e[1]]) nxt[e[1]] = dist[e[0]] + e[2];
            dist = nxt;
        }
        return dist;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> bellmanFord(int n, vector<vector<int>>& edges, int src, int k) {
        const int INF = 1000000000;
        vector<int> dist(n, INF);
        dist[src] = 0;
        for (int round = 0; round < k; round++) {   //> One round = one more edge allowed, so k rounds find paths of at most k edges
            vector<int> nxt = dist;                 //> Read last round's row, write a new one: otherwise a round could use several edges
            for (auto& e : edges)
                if (dist[e[0]] != INF && dist[e[0]] + e[2] < nxt[e[1]]) nxt[e[1]] = dist[e[0]] + e[2];
            dist = nxt;
        }
        return dist;
    }
};`
        },
        tests: { fn: { py: 'bellman_ford', default: 'bellmanFord' }, sig: { args: ['int', 'int[][]', 'int', 'int'] }, cases: [
          { args: [4, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1]], 0, 1], out: [0, 4, 1, 1000000000] },
          { args: [4, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1]], 0, 2], out: [0, 3, 1, 5] },
          { args: [4, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1]], 0, 3], out: [0, 3, 1, 4] },
          { args: [3, [[0, 1, 5], [0, 2, 2], [2, 1, -4]], 0, 1], out: [0, 5, 2] },
          { args: [3, [[0, 1, 5], [0, 2, 2], [2, 1, -4]], 0, 2], out: [0, -2, 2] },
          { args: [3, [], 0, 0], out: [0, 1000000000, 1000000000] }] }
      },
      {
        name: 'Floyd-Warshall: every pair at once',
        body: 'When you need the distance between **every** pair and the graph is small (V up to about 400), a matrix beats V runs of Dijkstra in code length. Let `d[i][j]` be the best known distance from i to j. Then for each possible **middle stop** `k`, ask for every pair whether going `i → k → j` beats the current best. After the loop over `k` has allowed middle stops 0..k, `d[i][j]` is the best route using only those as intermediates. **The `k` loop must be the outermost one**; putting it inside is the classic bug. Parallel edges: keep the cheaper. It handles negative edges, and a negative cycle shows up as `d[i][i] < 0`. It is the right tool for “which city can reach the fewest others within a limit” (the extra problem below).',
        code: {
          py: `def floyd_warshall(n, edges):
    INF = 10**9
    d = [[INF] * n for _ in range(n)]
    for i in range(n):
        d[i][i] = 0
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)                 #> Keep the cheaper of any parallel edges
    for k in range(n):                            #> The middle stop. This loop must be the OUTERMOST one
        for i in range(n):
            if d[i][k] == INF:
                continue
            for j in range(n):
                if d[k][j] != INF and d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]   #> Going i to k to j beats the best known route
    return d`,
          js: `function floydWarshall(n, edges) {
  const INF = 1e9;
  const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)));
  for (const [u, v, w] of edges) d[u][v] = Math.min(d[u][v], w);   //> Keep the cheaper of any parallel edges
  for (let k = 0; k < n; k++) {                  //> The middle stop. This loop must be the OUTERMOST one
    for (let i = 0; i < n; i++) {
      if (d[i][k] === INF) continue;
      for (let j = 0; j < n; j++) {
        if (d[k][j] !== INF && d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];   //> Going i to k to j beats the best known route
      }
    }
  }
  return d;
}`,
          java: `class Solution {
    public int[][] floydWarshall(int n, int[][] edges) {
        final int INF = 1000000000;
        int[][] d = new int[n][n];
        for (int i = 0; i < n; i++) { Arrays.fill(d[i], INF); d[i][i] = 0; }
        for (int[] e : edges) d[e[0]][e[1]] = Math.min(d[e[0]][e[1]], e[2]);   //> Keep the cheaper of any parallel edges
        for (int k = 0; k < n; k++) {             //> The middle stop. This loop must be the OUTERMOST one
            for (int i = 0; i < n; i++) {
                if (d[i][k] == INF) continue;
                for (int j = 0; j < n; j++) {
                    if (d[k][j] != INF && d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];   //> Going i to k to j beats the best known route
                }
            }
        }
        return d;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> floydWarshall(int n, vector<vector<int>>& edges) {
        const int INF = 1000000000;
        vector<vector<int>> d(n, vector<int>(n, INF));
        for (int i = 0; i < n; i++) d[i][i] = 0;
        for (auto& e : edges) d[e[0]][e[1]] = min(d[e[0]][e[1]], e[2]);   //> Keep the cheaper of any parallel edges
        for (int k = 0; k < n; k++) {             //> The middle stop. This loop must be the OUTERMOST one
            for (int i = 0; i < n; i++) {
                if (d[i][k] == INF) continue;
                for (int j = 0; j < n; j++) {
                    if (d[k][j] != INF && d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];   //> Going i to k to j beats the best known route
                }
            }
        }
        return d;
    }
};`
        },
        tests: { fn: { py: 'floyd_warshall', default: 'floydWarshall' }, sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [4, [[0, 1, 5], [1, 2, 3], [2, 3, 1], [0, 3, 10]]], out: [[0, 5, 8, 9], [1000000000, 0, 3, 4], [1000000000, 1000000000, 0, 1], [1000000000, 1000000000, 1000000000, 0]] },
          { args: [1, []], out: [[0]] },
          { args: [3, [[0, 1, 2], [1, 2, -1]]], out: [[0, 2, 1], [1000000000, 0, -1], [1000000000, 1000000000, 0]] },
          { args: [3, [[0, 1, 1], [0, 1, 4], [2, 0, 7]]], out: [[0, 1, 1000000000], [1000000000, 0, 1000000000], [7, 8, 0]] }] }
      },
      {
        name: '0-1 BFS: edges that cost 0 or 1',
        body: 'If every edge costs **0 or 1** (a free move and a paid one, “flip this switch” and “walk along”), a heap is overkill. Use a **deque**: a free edge puts the neighbour at the **front** (it is exactly as close as the node you are on, so it belongs with the current distance), and a cost-1 edge puts it at the **back**. The deque then stays sorted by distance, with at most two distinct values inside it, which is the invariant a heap maintains with more work. Result: O(V + E). The same idea works for any “few distinct small weights” problem. Many grid problems (“minimum obstacles to remove”, “minimum cost to change arrows to reach the end”) are this with cells as nodes.',
        code: {
          py: `def zero_one_bfs(n, edges, src):
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
    dist = [inf] * n
    dist[src] = 0
    dq = deque([src])
    while dq:
        u = dq.popleft()
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                if w == 0:
                    dq.appendleft(v)              #> A free edge: v is as close as u, so it goes at the FRONT
                else:
                    dq.append(v)                  #> A cost-1 edge: the back, behind everything at the current distance
    return [-1 if x == inf else x for x in dist]`,
          js: `function zeroOneBfs(n, edges, src) {
  const graph = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) graph[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const dq = [src];                               // an array: unshift is O(n), so for big inputs write a ring buffer
  while (dq.length) {
    const u = dq.shift();
    for (const [v, w] of graph[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (w === 0) dq.unshift(v);               //> A free edge: v is as close as u, so it goes at the FRONT
        else dq.push(v);                          //> A cost-1 edge: the back, behind everything at the current distance
      }
    }
  }
  return dist.map((x) => (x === Infinity ? -1 : x));
}`,
          java: `class Solution {
    public int[] zeroOneBfs(int n, int[][] edges, int src) {
        List<List<int[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) graph.get(e[0]).add(new int[]{e[1], e[2]});
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        Deque<Integer> dq = new ArrayDeque<>();
        dq.offer(src);
        while (!dq.isEmpty()) {
            int u = dq.pollFirst();
            for (int[] nb : graph.get(u)) {
                int v = nb[0], w = nb[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (w == 0) dq.addFirst(v);   //> A free edge: v is as close as u, so it goes at the FRONT
                    else dq.addLast(v);           //> A cost-1 edge: the back, behind everything at the current distance
                }
            }
        }
        for (int i = 0; i < n; i++) if (dist[i] == Integer.MAX_VALUE) dist[i] = -1;
        return dist;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> zeroOneBfs(int n, vector<vector<int>>& edges, int src) {
        vector<vector<pair<int, int>>> graph(n);
        for (auto& e : edges) graph[e[0]].push_back({e[1], e[2]});
        vector<int> dist(n, INT_MAX);
        dist[src] = 0;
        deque<int> dq{src};
        while (!dq.empty()) {
            int u = dq.front();
            dq.pop_front();
            for (auto [v, w] : graph[u]) {
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (w == 0) dq.push_front(v);   //> A free edge: v is as close as u, so it goes at the FRONT
                    else dq.push_back(v);           //> A cost-1 edge: the back, behind everything at the current distance
                }
            }
        }
        for (int& x : dist) if (x == INT_MAX) x = -1;
        return dist;
    }
};`
        },
        tests: { fn: { py: 'zero_one_bfs', default: 'zeroOneBfs' }, sig: { args: ['int', 'int[][]', 'int'] }, cases: [
          { args: [5, [[0, 1, 0], [1, 2, 1], [0, 2, 1], [2, 3, 0], [3, 4, 1]], 0], out: [0, 0, 1, 1, 2] },
          { args: [1, [], 0], out: [0] },
          { args: [4, [[0, 1, 1], [2, 3, 0]], 0], out: [0, 1, -1, -1] },
          { args: [4, [[0, 1, 1], [1, 2, 1], [0, 2, 0], [2, 3, 1]], 0], out: [0, 1, 0, 1] }] }
      },
      {
        name: 'Minimax: minimise the worst edge, not the sum',
        body: 'Some questions don’t add the edges up. The cost of a route is its **largest** edge (the steepest climb, the highest water level, the thinnest bridge), and you want the route whose largest edge is smallest. The proof of Dijkstra only needs the route cost to be **non-decreasing as the route grows**, and `max` satisfies that as well as `+` does. So change one line: instead of `d + w`, use `max(d, w)`. Everything else (heap, stale check, relax) is the same. The alternative is to **binary-search the answer** and test each guess with BFS or [union-find](#/topic/union-find) (can I get from start to end using only edges ≤ guess?), which is O(E log W) and worth naming. For the “widest path” (maximise the smallest edge) use a max-heap and `min`.',
        code: {
          py: `def min_bottleneck(n, edges, src, dst):
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))
    best = [inf] * n
    best[src] = 0
    heap = [(0, src)]
    while heap:
        b, u = heapq.heappop(heap)
        if b > best[u]:
            continue
        if u == dst:
            return b                              #> The first time dst is popped, its cost is final: stop early
        for v, w in graph[u]:
            nb = max(b, w)                        #> The only change from Dijkstra: a route costs its biggest edge, not the sum
            if nb < best[v]:
                best[v] = nb
                heapq.heappush(heap, (nb, v))
    return -1`,
          js: HEAP + `
function minBottleneck(n, edges, src, dst) {
  const graph = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) { graph[u].push([v, w]); graph[v].push([u, w]); }
  const best = new Array(n).fill(Infinity);
  best[src] = 0;
  const heap = new Heap((a, b) => a[0] < b[0]);
  heap.push([0, src]);
  while (heap.size) {
    const [b, u] = heap.pop();
    if (b > best[u]) continue;
    if (u === dst) return b;                      //> The first time dst is popped, its cost is final: stop early
    for (const [v, w] of graph[u]) {
      const nb = Math.max(b, w);                  //> The only change from Dijkstra: a route costs its biggest edge, not the sum
      if (nb < best[v]) { best[v] = nb; heap.push([nb, v]); }
    }
  }
  return -1;
}`,
          java: `class Solution {
    public int minBottleneck(int n, int[][] edges, int src, int dst) {
        List<List<int[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) {
            graph.get(e[0]).add(new int[]{e[1], e[2]});
            graph.get(e[1]).add(new int[]{e[0], e[2]});
        }
        int[] best = new int[n];
        Arrays.fill(best, Integer.MAX_VALUE);
        best[src] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[]{0, src});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int b = top[0], u = top[1];
            if (b > best[u]) continue;
            if (u == dst) return b;               //> The first time dst is popped, its cost is final: stop early
            for (int[] nb : graph.get(u)) {
                int cost = Math.max(b, nb[1]);    //> The only change from Dijkstra: a route costs its biggest edge, not the sum
                if (cost < best[nb[0]]) { best[nb[0]] = cost; heap.offer(new int[]{cost, nb[0]}); }
            }
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int minBottleneck(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<pair<int, int>>> graph(n);
        for (auto& e : edges) {
            graph[e[0]].push_back({e[1], e[2]});
            graph[e[1]].push_back({e[0], e[2]});
        }
        vector<int> best(n, INT_MAX);
        best[src] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;
        heap.push({0, src});
        while (!heap.empty()) {
            auto [b, u] = heap.top();
            heap.pop();
            if (b > best[u]) continue;
            if (u == dst) return b;               //> The first time dst is popped, its cost is final: stop early
            for (auto [v, w] : graph[u]) {
                int cost = max(b, w);             //> The only change from Dijkstra: a route costs its biggest edge, not the sum
                if (cost < best[v]) { best[v] = cost; heap.push({cost, v}); }
            }
        }
        return -1;
    }
};`
        },
        tests: { fn: { py: 'min_bottleneck', default: 'minBottleneck' }, sig: { args: ['int', 'int[][]', 'int', 'int'] }, cases: [
          { args: [4, [[0, 1, 5], [1, 3, 2], [0, 2, 3], [2, 3, 4]], 0, 3], out: 4 },
          { args: [3, [[0, 1, 2]], 0, 2], out: -1 },
          { args: [2, [], 1, 1], out: 0 },
          { args: [5, [[0, 1, 9], [1, 2, 1], [2, 3, 1], [3, 4, 1], [0, 4, 6]], 0, 4], out: 6 },
          { args: [3, [[0, 1, 1], [1, 2, 8], [0, 2, 3]], 0, 2], out: 3 }] }
      },
      {
        name: 'Dijkstra on a grid',
        body: 'A grid is a graph you never build. Each cell is a node, its four neighbours are the edges, and the cost of a step is whatever the problem says (the value of the cell you step into, a height difference, 0 or 1 for an obstacle). The heap holds `(cost, row, col)`. Bounds-check before you read a neighbour, and remember the four-direction list `(1, 0), (-1, 0), (0, 1), (0, -1)`. Here the cost of a route is the sum of the cell values it enters, including the start. If every step costs 1 use plain BFS; if steps cost 0 or 1 use 0-1 BFS.',
        code: {
          py: `def grid_cost(grid):
    R, C = len(grid), len(grid[0])
    dist = [[inf] * C for _ in range(R)]
    dist[0][0] = grid[0][0]
    heap = [(grid[0][0], 0, 0)]                   #> Heap entries are (cost so far, row, col): the cell is the node
    while heap:
        d, r, c = heapq.heappop(heap)
        if (r, c) == (R - 1, C - 1):
            return d
        if d > dist[r][c]:
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and d + grid[nr][nc] < dist[nr][nc]:   #> Stay inside the grid, then relax as usual
                dist[nr][nc] = d + grid[nr][nc]
                heapq.heappush(heap, (dist[nr][nc], nr, nc))
    return -1`,
          js: HEAP + `
function gridCost(grid) {
  const R = grid.length, C = grid[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(Infinity));
  dist[0][0] = grid[0][0];
  const heap = new Heap((a, b) => a[0] < b[0]);
  heap.push([grid[0][0], 0, 0]);                  //> Heap entries are [cost so far, row, col]: the cell is the node
  while (heap.size) {
    const [d, r, c] = heap.pop();
    if (r === R - 1 && c === C - 1) return d;
    if (d > dist[r][c]) continue;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && d + grid[nr][nc] < dist[nr][nc]) {   //> Stay inside the grid, then relax as usual
        dist[nr][nc] = d + grid[nr][nc];
        heap.push([dist[nr][nc], nr, nc]);
      }
    }
  }
  return -1;
}`,
          java: `class Solution {
    public int gridCost(int[][] grid) {
        int R = grid.length, C = grid[0].length;
        int[][] dist = new int[R][C];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = grid[0][0];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[]{grid[0][0], 0, 0});          //> Heap entries are {cost so far, row, col}: the cell is the node
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], r = top[1], c = top[2];
            if (r == R - 1 && c == C - 1) return d;
            if (d > dist[r][c]) continue;
            for (int[] dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;   //> Stay inside the grid, then relax as usual
                if (d + grid[nr][nc] < dist[nr][nc]) {
                    dist[nr][nc] = d + grid[nr][nc];
                    heap.offer(new int[]{dist[nr][nc], nr, nc});
                }
            }
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int gridCost(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size();
        vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
        dist[0][0] = grid[0][0];
        priority_queue<array<int, 3>, vector<array<int, 3>>, greater<>> heap;
        heap.push({grid[0][0], 0, 0});                    //> Heap entries are {cost so far, row, col}: the cell is the node
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!heap.empty()) {
            auto [d, r, c] = heap.top();
            heap.pop();
            if (r == R - 1 && c == C - 1) return d;
            if (d > dist[r][c]) continue;
            for (auto& dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;   //> Stay inside the grid, then relax as usual
                if (d + grid[nr][nc] < dist[nr][nc]) {
                    dist[nr][nc] = d + grid[nr][nc];
                    heap.push({dist[nr][nc], nr, nc});
                }
            }
        }
        return -1;
    }
};`
        },
        tests: { fn: { py: 'grid_cost', default: 'gridCost' }, sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], out: 7 },
          { args: [[[5]]], out: 5 },
          { args: [[[1, 9, 9], [1, 1, 9], [9, 1, 1]]], out: 5 },
          { args: [[[2, 1], [1, 2]]], out: 5 },
          { args: [[[1, 1, 1, 1], [9, 9, 9, 1], [1, 1, 1, 1]]], out: 6 }] }
      },
      {
        name: 'Which algorithm? A decision table',
        body: 'Ask three questions in order. **1. What do the edges cost?** All equal: BFS. Only 0 and 1: 0-1 BFS. Different but non-negative: Dijkstra. Some negative: Bellman-Ford (Dijkstra is wrong here). **2. Is there a limit on the number of edges or stops?** Then the hop count is part of the answer: Bellman-Ford with k + 1 rounds, or Dijkstra on `(node, hops)` states. **3. How many sources?** One source: the above. Every pair on a graph of a few hundred nodes: Floyd-Warshall. A cost that is a max instead of a sum: Dijkstra with `max`. A single target on a big map where you can estimate the remaining distance: A\\* (Dijkstra with `distance so far + estimate` as the priority, valid when the estimate never overshoots). In an interview, saying the weights’ properties out loud before choosing is most of the answer.'
      }
    ],

    worked: [
      {
        lc: 743,
        restate: 'A network has n nodes labelled 1 to n, and directed links given as `[from, to, travel time]`. A signal starts at node k. Return the time until **every** node has received it, or -1 if some node can never be reached.',
        examples: '- Links `[[1,2,5],[1,3,2],[3,2,1],[2,4,3]]`, n = 4, k = 1 → 6 (node 4 is reached last: 1 → 3 → 2 → 4 = 2 + 1 + 3).\n- Links `[[1,2,1]]`, n = 2, k = 2 → -1 (nothing leaves node 2).\n- Edge cases: n = 1 (answer 0); a cheaper two-hop route beating a direct link; unreachable nodes.',
        brute: 'Try every route from k by DFS and remember the cheapest per node: exponential on a graph with many branching paths. A level-by-level BFS counts hops, not time, so it gives wrong answers as soon as the weights differ.',
        insight: 'It’s single-source shortest paths with non-negative weights. The time for everyone to hear is the **largest** of the shortest distances from k, and -1 if any distance is still infinite. So run Dijkstra from k and take the max over all nodes. Labels start at 1, so allocate n + 1 slots and ignore index 0.',
        code: {
          py: `class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        graph = [[] for _ in range(n + 1)]
        for u, v, w in times:
            graph[u].append((v, w))                 # directed: stored once
        dist = [inf] * (n + 1)
        dist[k] = 0
        heap = [(0, k)]
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue                            # stale entry
            for v, w in graph[u]:
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(heap, (d + w, v))
        worst = max(dist[1:])                       # the last node to hear the signal
        return -1 if worst == inf else worst`,
          js: HEAP + `
function networkDelayTime(times, n, k) {
  const graph = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) graph[u].push([v, w]);   // directed: stored once
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = new Heap((a, b) => a[0] < b[0]);
  heap.push([0, k]);
  while (heap.size) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;                    // stale entry
    for (const [v, w] of graph[u]) {
      if (d + w < dist[v]) { dist[v] = d + w; heap.push([d + w, v]); }
    }
  }
  const worst = Math.max(...dist.slice(1));       // the last node to hear the signal
  return worst === Infinity ? -1 : worst;
}`,
          java: `class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> graph = new ArrayList<>();
        for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
        for (int[] t : times) graph.get(t[0]).add(new int[]{t[1], t[2]});   // directed: stored once
        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[]{0, k});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;                        // stale entry
            for (int[] nb : graph.get(u)) {
                if (d + nb[1] < dist[nb[0]]) {
                    dist[nb[0]] = d + nb[1];
                    heap.offer(new int[]{dist[nb[0]], nb[0]});
                }
            }
        }
        int worst = 0;
        for (int i = 1; i <= n; i++) worst = Math.max(worst, dist[i]);   // the last node to hear the signal
        return worst == Integer.MAX_VALUE ? -1 : worst;
    }
}`,
          cpp: `class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int, int>>> graph(n + 1);
        for (auto& t : times) graph[t[0]].push_back({t[1], t[2]});   // directed: stored once
        vector<int> dist(n + 1, INT_MAX);
        dist[k] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;
        heap.push({0, k});
        while (!heap.empty()) {
            auto [d, u] = heap.top();
            heap.pop();
            if (d > dist[u]) continue;                           // stale entry
            for (auto [v, w] : graph[u]) {
                if (d + w < dist[v]) { dist[v] = d + w; heap.push({dist[v], v}); }
            }
        }
        int worst = 0;
        for (int i = 1; i <= n; i++) worst = max(worst, dist[i]);   // the last node to hear the signal
        return worst == INT_MAX ? -1 : worst;
    }
};`
        },
        complexity: 'O((V + E) log V) time (heap with lazy deletion), O(V + E) space.',
        say: '“All travel times are non-negative and I want the latest arrival over every node from one source, so it’s single-source shortest paths and Dijkstra fits. I build a directed adjacency list, keep a heap of (time, node), and skip entries whose time is worse than the best I already have. When the heap is empty, each distance is final. The answer is the largest distance, or -1 if any is still infinity. That’s O(E log V).”',
        followups: [
          { q: 'Why not BFS?', a: 'BFS finds the fewest hops, and the cheapest route can have more hops than another. With unequal weights the first time BFS reaches a node is not the cheapest time, so its distances are wrong.' },
          { q: 'What if one link could have a negative time?', a: 'Dijkstra’s “smallest is final” claim fails. Use Bellman-Ford: V − 1 rounds relaxing every edge, O(V·E). A negative cycle reachable from k means no shortest time exists.' },
          { q: 'Could you stop early?', a: 'Not for this question, which needs every node. If you wanted one target you could return as soon as it is popped, because its distance is final then.' },
          { q: 'The graph is very dense. Anything better?', a: 'Use the array version of Dijkstra: scan for the smallest unfinished node in O(V) instead of using a heap. That is O(V²), which beats O(E log V) when E is near V².' }
        ]
      },
      {
        lc: 787,
        restate: 'There are n cities and one-way flights `[from, to, price]`. Find the cheapest trip from `src` to `dst` that makes **at most k stops** in between (so at most k + 1 flights). Return -1 if there is no such trip.',
        examples: '- Flights `[[0,1,100],[1,2,100],[0,2,500]]`, src 0, dst 2, k = 1 → 200. With k = 0 → 500 (only the direct flight is allowed).\n- Flights `[[0,1,2],[1,2,3],[0,2,9],[2,3,1]]`, src 0, dst 3, k = 1 → 10 (0 → 2 → 3).\n- Edge cases: no route at all; the cheapest route uses too many stops; k = 0.',
        brute: 'DFS over every route with at most k + 1 flights: exponential. Plain Dijkstra on the cities is fast but **wrong**: it keeps only the cheapest price per city, and the cheapest way to reach a city might use too many stops, while a pricier way with fewer stops is the one you need next.',
        insight: 'The cost to reach a city depends on **how many flights you have used**, so the state is not just the city. Bellman-Ford’s rounds are exactly that: after round r, `dist[v]` is the cheapest price using **at most r flights**. Run k + 1 rounds, and in each round read last round’s prices and write into a copy, so one round can add only one flight. The answer is `dist[dst]` after the last round.',
        code: {
          py: `class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        dist = [inf] * n
        dist[src] = 0
        for _ in range(k + 1):                      # k stops = k + 1 flights = k + 1 rounds
            nxt = dist[:]                           # write to a copy so a round adds exactly one flight
            for u, v, w in flights:
                if dist[u] + w < nxt[v]:
                    nxt[v] = dist[u] + w
            dist = nxt
        return -1 if dist[dst] == inf else dist[dst]`,
          js: `function findCheapestPrice(n, flights, src, dst, k) {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let round = 0; round <= k; round++) {      // k stops = k + 1 flights = k + 1 rounds
    const nxt = dist.slice();                     // write to a copy so a round adds exactly one flight
    for (const [u, v, w] of flights) {
      if (dist[u] + w < nxt[v]) nxt[v] = dist[u] + w;
    }
    dist = nxt;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}`,
          java: `class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        final int INF = 1000000000;
        int[] dist = new int[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        for (int round = 0; round <= k; round++) {          // k stops = k + 1 flights = k + 1 rounds
            int[] nxt = dist.clone();                       // write to a copy so a round adds exactly one flight
            for (int[] f : flights)
                if (dist[f[0]] != INF && dist[f[0]] + f[2] < nxt[f[1]]) nxt[f[1]] = dist[f[0]] + f[2];
            dist = nxt;
        }
        return dist[dst] == INF ? -1 : dist[dst];
    }
}`,
          cpp: `class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        const int INF = 1000000000;
        vector<int> dist(n, INF);
        dist[src] = 0;
        for (int round = 0; round <= k; round++) {          // k stops = k + 1 flights = k + 1 rounds
            vector<int> nxt = dist;                         // write to a copy so a round adds exactly one flight
            for (auto& f : flights)
                if (dist[f[0]] != INF && dist[f[0]] + f[2] < nxt[f[1]]) nxt[f[1]] = dist[f[0]] + f[2];
            dist = nxt;
        }
        return dist[dst] == INF ? -1 : dist[dst];
    }
};`
        },
        complexity: 'O(k · E) time and O(V) space. A Dijkstra on `(city, flights used)` states is O(k · E · log) and uses O(k · V) space, so Bellman-Ford’s rounds are both shorter and lighter here.',
        say: '“The price to reach a city depends on how many flights I’ve used, so a single distance per city isn’t enough and plain Dijkstra can discard the route I need. Bellman-Ford’s rounds track exactly that: after round r, dist is the cheapest price using at most r flights. With k stops I run k + 1 rounds, each reading the previous row and writing into a copy so a round only adds one flight. O(k·E) time, O(V) space.”',
        followups: [
          { q: 'What goes wrong if you update `dist` in place?', a: 'A round can then chain several flights, because a value you just lowered is read again in the same round. The stops limit leaks, and you can return a price that needs more than k stops.' },
          { q: 'How would you do it with Dijkstra?', a: 'Make the state `(city, stops used)` and the heap key the price. Skip a state if you have already reached that city with fewer or equal stops and a lower price. It works but needs a `best[city]` of stops, and it is more code than the rounds.' },
          { q: 'Can you stop the rounds early?', a: 'Yes: if a round changes nothing, later rounds will not either, so break. The “at most k” guarantee still holds because nothing more can improve.' },
          { q: 'What if prices could be negative?', a: 'Bellman-Ford with a fixed number of rounds still works as is, since it never assumed an order. Dijkstra would not.' }
        ]
      },
      {
        lc: 778,
        restate: 'An n × n grid holds each of the values 0 to n² − 1 exactly once. Value t is the time at which that cell becomes passable (the water rises to height t). You start at the top-left cell at time 0, can move to a neighbouring cell (up, down, left or right) only when time is at least its value, and can wait. Return the earliest time at which you can stand on the bottom-right cell.',
        examples: '- `[[0,2],[1,3]]` → 3 (the end cell is 3 itself).\n- `[[0,1,2],[5,4,3],[6,7,8]]` → 8 (the end is 8).\n- `[[0,8,7],[1,2,3],[6,5,4]]` → 4 (go down the left column, then across the bottom row: the tallest cell on that route is 4).\n- Edge cases: a 1 × 1 grid (answer 0); the start cell is not zero.',
        brute: 'Simulate time one unit at a time: at each t flood-fill from the start through cells ≤ t until the corner is reached. Correct, but O(n² · n²) in the worst case.',
        insight: 'Waiting is free, so the time you arrive is decided by the **tallest cell on your route**. The goal is the route whose tallest cell is smallest: a **minimax path**, and not a sum. Dijkstra works with the cost update `max(cost so far, cell value)` instead of `+`, because it never makes a route cheaper as it grows. Pop the cell with the smallest tallest-so-far, and when you pop the bottom-right cell that value is the answer.',
        code: {
          py: `class Solution:
    def swimInWater(self, grid: List[List[int]]) -> int:
        n = len(grid)
        best = [[inf] * n for _ in range(n)]       # smallest "tallest cell on the route" to reach each cell
        best[0][0] = grid[0][0]
        heap = [(grid[0][0], 0, 0)]
        while heap:
            t, r, c = heapq.heappop(heap)
            if (r, c) == (n - 1, n - 1):
                return t                           # popped means final
            if t > best[r][c]:
                continue
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n:
                    nt = max(t, grid[nr][nc])      # cost = the tallest cell so far, not a sum
                    if nt < best[nr][nc]:
                        best[nr][nc] = nt
                        heapq.heappush(heap, (nt, nr, nc))
        return -1`,
          js: HEAP + `
function swimInWater(grid) {
  const n = grid.length;
  const best = Array.from({ length: n }, () => new Array(n).fill(Infinity));   // smallest "tallest cell on the route" to reach each cell
  best[0][0] = grid[0][0];
  const heap = new Heap((a, b) => a[0] < b[0]);
  heap.push([grid[0][0], 0, 0]);
  while (heap.size) {
    const [t, r, c] = heap.pop();
    if (r === n - 1 && c === n - 1) return t;     // popped means final
    if (t > best[r][c]) continue;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
      const nt = Math.max(t, grid[nr][nc]);       // cost = the tallest cell so far, not a sum
      if (nt < best[nr][nc]) { best[nr][nc] = nt; heap.push([nt, nr, nc]); }
    }
  }
  return -1;
}`,
          java: `class Solution {
    public int swimInWater(int[][] grid) {
        int n = grid.length;
        int[][] best = new int[n][n];                      // smallest "tallest cell on the route" to reach each cell
        for (int[] row : best) Arrays.fill(row, Integer.MAX_VALUE);
        best[0][0] = grid[0][0];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[]{grid[0][0], 0, 0});
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int t = top[0], r = top[1], c = top[2];
            if (r == n - 1 && c == n - 1) return t;        // popped means final
            if (t > best[r][c]) continue;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                int nt = Math.max(t, grid[nr][nc]);        // cost = the tallest cell so far, not a sum
                if (nt < best[nr][nc]) { best[nr][nc] = nt; heap.offer(new int[]{nt, nr, nc}); }
            }
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int swimInWater(vector<vector<int>>& grid) {
        int n = grid.size();
        vector<vector<int>> best(n, vector<int>(n, INT_MAX));   // smallest "tallest cell on the route" to reach each cell
        best[0][0] = grid[0][0];
        priority_queue<array<int, 3>, vector<array<int, 3>>, greater<>> heap;
        heap.push({grid[0][0], 0, 0});
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!heap.empty()) {
            auto [t, r, c] = heap.top();
            heap.pop();
            if (r == n - 1 && c == n - 1) return t;        // popped means final
            if (t > best[r][c]) continue;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                int nt = max(t, grid[nr][nc]);             // cost = the tallest cell so far, not a sum
                if (nt < best[nr][nc]) { best[nr][nc] = nt; heap.push({nt, nr, nc}); }
            }
        }
        return -1;
    }
};`
        },
        complexity: 'O(n² log n) time (n² cells, each pushed a constant number of times, O(log n²) per heap operation), O(n²) space. Binary search on the answer with a BFS check is O(n² log n) too.',
        say: '“Waiting is free, so the time I arrive is just the tallest cell on my route. I want the route that minimises that: a minimax path. Dijkstra only needs the cost to be non-decreasing as the route grows, and max is, so I run it with `max(t, cell)` instead of `t + cell`. When I pop the bottom-right cell, its value is final and is the answer. O(n² log n). The alternative is binary-searching the time and checking reachability with a flood fill.”',
        followups: [
          { q: 'Why does swapping `+` for `max` keep Dijkstra correct?', a: 'The proof needs that extending a route never makes it cheaper. `max(t, x) ≥ t` always holds, so the smallest unfinished cost is still final when popped.' },
          { q: 'Could you binary search instead?', a: 'Yes. For a guess T, flood-fill from the start through cells ≤ T and see if the corner is reached. That is monotone in T, so binary search finds the smallest T in O(n² log n).' },
          { q: 'What about union-find?', a: 'Sort cells by value, open them one at a time and union each with its already open neighbours. The first moment the start and end cells are in the same set is the answer.' },
          { q: 'Why is the grid guaranteed to hold distinct values?', a: 'It is not needed by the algorithm. It makes “time equals the cell’s value” unambiguous and lets the union-find version process cells in a strict order.' }
        ]
      },
      {
        lc: 1514,
        restate: 'An undirected graph has n nodes, and each edge carries a probability that a message crossing it succeeds. A route succeeds only if **every** edge on it succeeds. Given a start and an end node, return the largest success probability over all routes, or 0 if the end can’t be reached.',
        examples: '- Edges `0-1` (0.5), `1-2` (0.5), `0-2` (0.2), from 0 to 2 → 0.25 (the two-hop route, 0.5 × 0.5, beats the direct 0.2).\n- Same graph with the direct edge at 0.3 → 0.3.\n- Edge cases: end unreachable (0); start equals end (1); a long chain of 0.9’s losing to one direct 0.5 edge.',
        brute: 'Try every route with DFS and multiply along it: exponential. Taking the route with the fewest edges (BFS) is wrong, because two safe edges can beat one risky one.',
        insight: 'It is Dijkstra with the roles flipped: the route value is a **product** of numbers in [0, 1], which can only stay the same or shrink as the route grows, and you want the **largest**. That monotone property is all Dijkstra’s proof needs, so use a **max**-heap on the probability and relax with `p * q`. When the end is popped, its probability is final. (Taking −log of each probability turns the product into a sum of non-negative weights, which is why this is “really” shortest paths.)',
        code: {
          py: `class Solution:
    def maxProbability(self, n: int, edges: List[List[int]], succProb: List[float], start: int, end: int) -> float:
        graph = [[] for _ in range(n)]
        for (a, b), p in zip(edges, succProb):
            graph[a].append((b, p))
            graph[b].append((a, p))
        best = [0.0] * n
        best[start] = 1.0
        heap = [(-1.0, start)]                   # max-heap by negating the probability
        while heap:
            neg, u = heapq.heappop(heap)
            p = -neg
            if u == end:
                return p
            if p < best[u]:
                continue                         # stale entry
            for v, q in graph[u]:
                if p * q > best[v]:
                    best[v] = p * q
                    heapq.heappush(heap, (-best[v], v))
        return 0.0`,
          js: HEAP + `
function maxProbability(n, edges, succProb, start, end) {
  const graph = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => { graph[a].push([b, succProb[i]]); graph[b].push([a, succProb[i]]); });
  const best = new Array(n).fill(0);
  best[start] = 1;
  const heap = new Heap((a, b) => a[0] > b[0]);   // max-heap by probability
  heap.push([1, start]);
  while (heap.size) {
    const [p, u] = heap.pop();
    if (u === end) return p;
    if (p < best[u]) continue;                    // stale entry
    for (const [v, q] of graph[u]) {
      if (p * q > best[v]) { best[v] = p * q; heap.push([best[v], v]); }
    }
  }
  return 0;
}`,
          java: `class Solution {
    public double maxProbability(int n, int[][] edges, double[] succProb, int start, int end) {
        List<List<double[]>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int i = 0; i < edges.length; i++) {
            graph.get(edges[i][0]).add(new double[]{edges[i][1], succProb[i]});
            graph.get(edges[i][1]).add(new double[]{edges[i][0], succProb[i]});
        }
        double[] best = new double[n];
        best[start] = 1.0;
        PriorityQueue<double[]> heap = new PriorityQueue<>((a, b) -> Double.compare(b[0], a[0]));   // max-heap by probability
        heap.offer(new double[]{1.0, start});
        while (!heap.isEmpty()) {
            double[] top = heap.poll();
            double p = top[0];
            int u = (int) top[1];
            if (u == end) return p;
            if (p < best[u]) continue;                         // stale entry
            for (double[] nb : graph.get(u)) {
                int v = (int) nb[0];
                if (p * nb[1] > best[v]) { best[v] = p * nb[1]; heap.offer(new double[]{best[v], v}); }
            }
        }
        return 0.0;
    }
}`,
          cpp: `class Solution {
public:
    double maxProbability(int n, vector<vector<int>>& edges, vector<double>& succProb, int start, int end) {
        vector<vector<pair<int, double>>> graph(n);
        for (int i = 0; i < (int)edges.size(); i++) {
            graph[edges[i][0]].push_back({edges[i][1], succProb[i]});
            graph[edges[i][1]].push_back({edges[i][0], succProb[i]});
        }
        vector<double> best(n, 0.0);
        best[start] = 1.0;
        priority_queue<pair<double, int>> heap;                // C++ default: a max-heap, which is what we want here
        heap.push({1.0, start});
        while (!heap.empty()) {
            auto [p, u] = heap.top();
            heap.pop();
            if (u == end) return p;
            if (p < best[u]) continue;                         // stale entry
            for (auto [v, q] : graph[u]) {
                if (p * q > best[v]) { best[v] = p * q; heap.push({best[v], v}); }
            }
        }
        return 0.0;
    }
};`
        },
        complexity: 'O((V + E) log V) time, O(V + E) space.',
        say: '“A route’s success is the product of its edge probabilities. Every factor is at most 1, so extending a route never raises its value, and that’s the property Dijkstra needs. I want the maximum, so I use a max-heap keyed on probability, relax with p times the edge probability, and skip stale entries. When the end node is popped its value is final; if the heap empties first the answer is 0. O((V+E) log V).”',
        followups: [
          { q: 'Why not just take logs?', a: 'You can: `−log p` is non-negative, and the largest product becomes the smallest sum, so ordinary Dijkstra applies. Working with the products directly avoids floating-point log error, and it is the same algorithm.' },
          { q: 'What if a probability could be above 1?', a: 'The monotone property breaks (a longer route could gain value), so Dijkstra is no longer valid. You would need something like Bellman-Ford, and a cycle with product above 1 would make the answer unbounded.' },
          { q: 'Do you need the stale check?', a: 'It saves work on duplicate entries. Without it the answer is still right, but a node can be expanded more than once.' },
          { q: 'Why does this have to be a max-heap?', a: 'You always want to expand the most promising unfinished node, the one with the highest probability. In Python that means negating the value, because `heapq` is min-only.' }
        ]
      }
    ],

    practice: [
      { lc: 743,
        hints: ['The time for everyone to hear is the largest of the shortest times from k.', 'Edges are directed and have different non-negative times, so BFS is out. Use a heap of (time, node) and skip entries that are worse than what you already have.', 'After the heap empties, take the maximum over nodes 1..n. If any node is still infinite, return -1.'],
        starter: { py: 'class Solution:\n    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:\n        ', js: 'function networkDelayTime(times, n, k) {\n  \n}' },
        tests: { fn: 'networkDelayTime', sig: { args: ['int[][]', 'int', 'int'] }, cases: [
          { args: [[[1, 2, 5], [1, 3, 2], [3, 2, 1], [2, 4, 3]], 4, 1], out: 6 }, { args: [[[1, 2, 1]], 2, 1], out: 1 }, { args: [[[1, 2, 1]], 2, 2], out: -1 },
          { args: [[[2, 1, 3], [2, 3, 1], [3, 4, 4]], 4, 2], out: 5 }, { args: [[[1, 2, 4], [2, 3, 4], [1, 3, 9]], 3, 1], out: 8 }, { args: [[[1, 1, 0]], 1, 1], out: 0 }, { args: [[[1, 2, 2], [3, 2, 1]], 3, 1], out: -1 }] } },

      { lc: 787,
        hints: ['A cheap route to a city that uses too many stops is useless, so one price per city is not enough information.', 'Use Bellman-Ford’s rounds: after round r, dist[v] is the cheapest price using at most r flights.', 'Run k + 1 rounds. In each round read the old row and write into a copy, so a round can only add one flight.'],
        starter: { py: 'class Solution:\n    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:\n        ', js: 'function findCheapestPrice(n, flights, src, dst, k) {\n  \n}' },
        tests: { fn: 'findCheapestPrice', sig: { args: ['int', 'int[][]', 'int', 'int', 'int'] }, cases: [
          { args: [4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1], out: 700 }, { args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1], out: 200 },
          { args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0], out: 500 }, { args: [5, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [0, 4, 10]], 0, 4, 2], out: 10 },
          { args: [5, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [0, 4, 10]], 0, 4, 3], out: 4 }, { args: [3, [[1, 2, 5]], 0, 2, 2], out: -1 }, { args: [4, [[0, 1, 2], [1, 2, 3], [0, 2, 9], [2, 3, 1]], 0, 3, 1], out: 10 }] } },

      { lc: 778,
        hints: ['Waiting is free, so the time you arrive is decided by the tallest cell on your route.', 'You want the route whose tallest cell is smallest: Dijkstra where a route costs max, not a sum.', 'Heap of (tallest so far, row, col); relax each neighbour with max(t, grid[nr][nc]). The value of the bottom-right cell when popped is the answer.'],
        starter: { py: 'class Solution:\n    def swimInWater(self, grid: List[List[int]]) -> int:\n        ', js: 'function swimInWater(grid) {\n  \n}' },
        tests: { fn: 'swimInWater', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 2], [1, 3]]], out: 3 }, { args: [[[0, 1, 2], [5, 4, 3], [6, 7, 8]]], out: 8 }, { args: [[[0]]], out: 0 }, { args: [[[0, 8, 7], [1, 2, 3], [6, 5, 4]]], out: 4 },
          { args: [[[3, 2], [0, 1]]], out: 3 }, { args: [[[0, 1, 2, 3], [12, 13, 14, 4], [11, 15, 5, 6], [10, 9, 8, 7]]], out: 7 }] } },

      { lc: 2290,
        hints: ['Moving into an empty cell costs 0 and into an obstacle costs 1 (you remove it).', 'Every edge costs 0 or 1, so a deque beats a heap: put free moves at the front and paid moves at the back.', 'Track dist per cell. Relax a neighbour when dist[cell] + grid[neighbour] is smaller, and return the distance of the bottom-right cell.'],
        solution: { explain: 'This is **0-1 BFS** on the grid. Entering a cell costs its value (0 for empty, 1 for an obstacle). A free move goes to the **front** of the deque and a paid move to the **back**, so the deque stays sorted by distance without a heap. O(R·C) time and space.', code: {
          py: `class Solution:
    def minimumObstacles(self, grid: List[List[int]]) -> int:
        R, C = len(grid), len(grid[0])
        dist = [[inf] * C for _ in range(R)]
        dist[0][0] = 0
        dq = deque([(0, 0)])
        while dq:
            r, c = dq.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < R and 0 <= nc < C and dist[r][c] + grid[nr][nc] < dist[nr][nc]:
                    dist[nr][nc] = dist[r][c] + grid[nr][nc]
                    if grid[nr][nc] == 0:
                        dq.appendleft((nr, nc))   # free move: front
                    else:
                        dq.append((nr, nc))       # removing an obstacle costs 1: back
        return dist[R - 1][C - 1]`,
          js: `function minimumObstacles(grid) {
  const R = grid.length, C = grid[0].length;
  const dist = Array.from({ length: R }, () => new Array(C).fill(Infinity));
  dist[0][0] = 0;
  const dq = [[0, 0]];                            // array as a deque: unshift is O(n), fine at this size
  while (dq.length) {
    const [r, c] = dq.shift();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      if (dist[r][c] + grid[nr][nc] < dist[nr][nc]) {
        dist[nr][nc] = dist[r][c] + grid[nr][nc];
        if (grid[nr][nc] === 0) dq.unshift([nr, nc]);   // free move: front
        else dq.push([nr, nc]);                         // removing an obstacle costs 1: back
      }
    }
  }
  return dist[R - 1][C - 1];
}` } },
        starter: { py: 'class Solution:\n    def minimumObstacles(self, grid: List[List[int]]) -> int:\n        ', js: 'function minimumObstacles(grid) {\n  \n}' },
        tests: { fn: 'minimumObstacles', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 1, 1], [1, 1, 0], [1, 1, 0]]], out: 2 }, { args: [[[0, 1, 0, 0], [0, 1, 0, 1], [0, 0, 0, 0]]], out: 0 }, { args: [[[0]]], out: 0 },
          { args: [[[0, 1], [1, 0]]], out: 1 }, { args: [[[0, 1, 1, 0], [1, 1, 0, 1], [0, 1, 1, 0]]], out: 3 }, { args: [[[0, 0, 0], [1, 1, 1], [0, 0, 0]]], out: 1 }, { args: [[[0, 1, 1, 1, 0]]], out: 3 }] } },

      { lc: 1514,
        hints: ['Probabilities multiply along a route, and you want the largest product.', 'Every factor is at most 1, so a longer route never gains probability: the “monotone, never improves as it grows” property Dijkstra needs holds, with a max-heap instead of a min-heap.', 'Keep best[v], the highest probability found for v. Pop the largest, and relax with p * q. In Python push the negated probability.'],
        starter: { py: 'class Solution:\n    def maxProbability(self, n: int, edges: List[List[int]], succProb: List[float], start: int, end: int) -> float:\n        ', js: 'function maxProbability(n, edges, succProb, start, end) {\n  \n}' },
        tests: { fn: 'maxProbability', compare: 'float', sig: { args: ['int', 'int[][]', 'float[]', 'int', 'int'] }, cases: [
          { args: [3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.2], 0, 2], out: 0.25 }, { args: [3, [[0, 1]], [0.5], 0, 2], out: 0 }, { args: [3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.3], 0, 2], out: 0.3 },
          { args: [4, [[0, 1], [1, 2], [2, 3], [0, 3]], [0.9, 0.9, 0.9, 0.5], 0, 3], out: 0.729 }, { args: [2, [[0, 1]], [1.0], 1, 0], out: 1 }] } },

      { lc: 1334,
        hints: ['You need the distance between every pair of cities, and n is small.', 'Floyd-Warshall: d[i][j] starts at the direct edge (or infinity), then for each middle stop k try d[i][k] + d[k][j]. The k loop is the outermost one.', 'Count, for each city, how many others are within the threshold. Pick the fewest, and break ties toward the larger index (use <= when comparing).'],
        solution: { explain: 'Run **Floyd-Warshall** to get every pair’s shortest distance (the graph is undirected, so set both `d[u][v]` and `d[v][u]`). Then for each city count the other cities with distance ≤ the threshold and keep the city with the smallest count, preferring the larger index on ties by using `<=`. O(n³) time, O(n²) space. n is small here, so this is simpler than n runs of Dijkstra (which would be O(n·E log n)).', code: {
          py: `class Solution:
    def findTheCity(self, n: int, edges: List[List[int]], distanceThreshold: int) -> int:
        d = [[inf] * n for _ in range(n)]
        for i in range(n):
            d[i][i] = 0
        for u, v, w in edges:
            d[u][v] = d[v][u] = min(d[u][v], w)
        for k in range(n):                       # the middle stop: outermost loop
            for i in range(n):
                for j in range(n):
                    if d[i][k] + d[k][j] < d[i][j]:
                        d[i][j] = d[i][k] + d[k][j]
        best, city = n + 1, -1
        for i in range(n):
            reach = sum(1 for j in range(n) if j != i and d[i][j] <= distanceThreshold)
            if reach <= best:                    # <= so a tie goes to the larger index
                best, city = reach, i
        return city`,
          js: `function findTheCity(n, edges, distanceThreshold) {
  const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [u, v, w] of edges) d[u][v] = d[v][u] = Math.min(d[u][v], w);
  for (let k = 0; k < n; k++) {                  // the middle stop: outermost loop
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
      }
    }
  }
  let best = n + 1, city = -1;
  for (let i = 0; i < n; i++) {
    let reach = 0;
    for (let j = 0; j < n; j++) if (j !== i && d[i][j] <= distanceThreshold) reach++;
    if (reach <= best) { best = reach; city = i; }   // <= so a tie goes to the larger index
  }
  return city;
}` } },
        starter: { py: 'class Solution:\n    def findTheCity(self, n: int, edges: List[List[int]], distanceThreshold: int) -> int:\n        ', js: 'function findTheCity(n, edges, distanceThreshold) {\n  \n}' },
        tests: { fn: 'findTheCity', sig: { args: ['int', 'int[][]', 'int'] }, cases: [
          { args: [4, [[0, 1, 3], [1, 2, 1], [1, 3, 4], [2, 3, 1]], 4], out: 3 }, { args: [5, [[0, 1, 2], [0, 4, 8], [1, 2, 3], [1, 4, 2], [2, 3, 1], [3, 4, 1]], 2], out: 0 },
          { args: [3, [[0, 1, 5]], 4], out: 2 }, { args: [2, [[0, 1, 1]], 1], out: 1 }, { args: [4, [[0, 1, 10], [1, 2, 10], [2, 3, 10]], 10], out: 3 }, { args: [6, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1]], 2], out: 5 }] } }
    ],

    mistakes: [
      '**Marking a node visited when you push it.** The first route found to a node is not necessarily the cheapest. Finalise a node when it is **popped** (or compare against `dist` and skip stale entries), never when it is first seen. Marking at push time turns Dijkstra into a BFS that returns wrong distances on weighted graphs.',
      '**Using Dijkstra with negative edges.** The “smallest in the heap is final” claim is false: a later negative edge can beat it. A version that skips finished nodes returns wrong answers silently, and a negative cycle never terminates. If a weight can be negative, reach for Bellman-Ford.',
      '**Using BFS when the weights differ.** BFS minimises the number of edges, not their total. Use BFS only when every edge costs the same, and 0-1 BFS (a deque) when costs are 0 or 1.',
      '**Dropping the stale check.** `if d > dist[u]: continue` is not optional for speed: without it you re-scan the adjacency list of a node once for every old entry, and the cost can blow up to O(V·E). The answer stays right, which makes it easy to miss.',
      '**Updating the row in place under a stops limit.** With “at most k stops” you must read last round’s distances and write into a copy. In-place updates let a round chain several edges, so the limit silently stops meaning anything.',
      '**Using plain Dijkstra on a hop-limited problem.** One `dist` per node discards a pricier route that uses fewer stops, which may be the only one that still fits the limit. Either run Bellman-Ford for k + 1 rounds, or put the stops into the state.',
      '**Floyd-Warshall with the loops in the wrong order.** The middle stop `k` must be the **outermost** loop. Putting `i` or `j` outside it gives wrong answers on some inputs and passes the small ones. Also guard `INF + INF` and `INF + negative`: use a sentinel such as 10⁹ and skip the update when either side is infinite.',
      '**Language gotchas.** *Python:* a heap of `(dist, node)` tuples is fine, but `(dist, node_object)` raises `TypeError` on ties when the objects can’t be compared; use an integer id. *JavaScript:* no built-in heap, and sorting the array on every push makes Dijkstra O(V² log V); array `shift`/`unshift` are O(n) in 0-1 BFS. *Java:* `Integer.MAX_VALUE + w` overflows to a negative number, so check `dist[u] != INF` or use `long`; compare with `Integer.compare`, not subtraction. *C++:* `priority_queue` is a **max**-heap, so use `greater<>`, and `INT_MAX + w` overflows the same way.'
    ],

    quiz: [
      { kind: 'concept', q: 'Why does Dijkstra’s algorithm fail when some edges have negative weights?',
        choices: ['A node’s distance may still shrink after it is popped, because a later edge can subtract cost, so “smallest in the queue is final” stops being true', 'The heap cannot store negative numbers', 'It becomes slower than Bellman-Ford but stays correct', 'Negative edges make the graph disconnected'], answer: 0,
        explain: 'Dijkstra finalises the smallest unfinished node because every other route to it passes through a farther node and then only adds non-negative cost. A negative edge breaks the “only adds” part, so a popped node can later be improved.' },
      { kind: 'complexity', q: 'What is the time complexity of Dijkstra with a binary heap on a graph with V nodes and E edges?',
        choices: ['O((V + E) log V)', 'O(V · E)', 'O(V³)', 'O(V + E)'], answer: 0,
        explain: 'Each successful relaxation pushes one heap entry, so there are at most E pushes and pops, each O(log V). V · E is Bellman-Ford, V³ is Floyd-Warshall, and V + E is plain BFS (or 0-1 BFS).' },
      { kind: 'pattern', q: 'Every road in a city map takes a different, positive number of minutes. You want the fastest route from one stop to every other stop. Which approach fits?',
        choices: ['Dijkstra with a min-heap', 'Plain BFS', 'Floyd-Warshall, always', 'Topological sort'], answer: 0,
        explain: 'Positive, unequal weights and a single source are exactly Dijkstra’s case. BFS counts hops, not minutes. Floyd-Warshall works but is O(V³), far too slow for a big map. Topological sort needs a DAG and finds an order, not distances in general.' },
      { kind: 'pattern', q: 'You need the cheapest trip using **at most k stops** in a graph of one-way priced flights. What makes plain Dijkstra on the cities unreliable here?',
        choices: ['The cheapest way to reach a city may use too many stops, so keeping one price per city can throw away the route you need', 'Dijkstra cannot handle directed graphs', 'Flight prices are integers', 'Dijkstra only finds paths to one city'], answer: 0,
        explain: 'The state is (city, stops used), not just the city. Bellman-Ford’s rounds track “at most r edges” directly. Dijkstra can work if the stops are part of the state, but a single `dist[city]` loses information.' },
      { kind: 'concept', q: 'In Bellman-Ford with an edge limit, why do you copy the distance array at the start of each round?',
        choices: ['So each round reads last round’s values only, and cannot chain several edges in one round', 'To free memory', 'To keep the original input array unchanged', 'Because the algorithm needs two passes over every edge'], answer: 0,
        explain: 'After round r, `dist[v]` should mean “the cheapest cost using at most r edges”. If you update in place, a value lowered earlier in the same round is read again, and one round can use several edges.' },
      { kind: 'bug', q: 'This code is meant to be Dijkstra but sometimes returns a distance that is too large. What is wrong?',
        code: `def dijkstra(graph, src, n):
    dist = [inf] * n
    seen = set([src])
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        for v, w in graph[u]:
            if v not in seen:
                seen.add(v)
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist`,
        choices: ['It marks a node as seen when it is first discovered, but the first route found is not necessarily the cheapest. It should compare `d + w < dist[v]` instead', 'The heap should be a max-heap', '`dist` should start at 0 for every node', 'It should use a queue, not a heap'], answer: 0,
        explain: 'Marking at push time locks in the first route found, like BFS does. With weights, a longer-looking route can be cheaper. The fix is the relaxation test `if d + w < dist[v]`, updating and pushing only on improvement.' },
      { kind: 'concept', q: 'Why is a deque enough (no heap needed) when every edge costs 0 or 1?',
        choices: ['A free edge puts the neighbour at the front and a cost-1 edge at the back, so the deque stays sorted by distance', 'Because 0 and 1 are both smaller than any heap key', 'Because the graph is always a tree', 'Because Dijkstra is not needed for non-negative weights'], answer: 0,
        explain: 'Entries in the deque differ by at most 1 in distance. Pushing a 0-cost neighbour at the front and a 1-cost neighbour at the back preserves sorted order, which is the only thing the heap provided. The result is O(V + E).' },
      { kind: 'pattern', q: 'The cost of a route is the **largest edge** on it, and you want the smallest possible cost. What changes in Dijkstra?',
        choices: ['The relax step uses `max(cost so far, edge)` instead of `cost so far + edge`', 'Nothing: it is exactly the same', 'You must switch to Bellman-Ford', 'You must use a max-heap'], answer: 0,
        explain: 'Dijkstra only needs the route cost to never decrease as the route is extended, and `max` satisfies that as well as `+`. The heap stays a min-heap and the stale check stays.' },
      { kind: 'complexity', q: 'Floyd-Warshall on n nodes takes…',
        choices: ['O(n³) time and O(n²) space', 'O(n²) time and O(n) space', 'O(n · E) time and O(n) space', 'O(n log n) time and O(n) space'], answer: 0,
        explain: 'Three nested loops of length n, each doing O(1) work, over an n × n matrix. It’s fine for n up to a few hundred and for “all pairs” questions, and hopeless for a map with 10⁵ nodes.' },
      { kind: 'concept', q: 'Which statements are true? Pick every one that applies.',
        choices: ['In the heap version, an entry can come out of the queue stale and must be skipped', 'Dijkstra needs a decrease-key operation, so a plain heap cannot be used', 'Bellman-Ford can detect a negative cycle', 'BFS gives shortest paths on any weighted graph'], answer: [0, 2],
        explain: 'Lazy deletion replaces decrease-key: push a new entry and skip the old one when it surfaces. Bellman-Ford can find a reachable negative cycle: an improvement in the V-th round. BFS only counts edges, so it is correct only when all weights are equal.' }
    ],

    flashcards: [
      { id: 'dij-loop', front: 'Dijkstra with a heap: the loop in one breath?', back: 'Heap of `(dist, node)`, start `(0, src)`. Pop the smallest; if `d > dist[u]` skip it (stale). For each edge, if `d + w < dist[v]`, set it and push. When the heap is empty, `dist` is final.' },
      { id: 'dij-negative', front: 'Why does Dijkstra fail with negative edges?', back: 'A node is declared final when popped because other routes to it can only add non-negative cost. A negative edge lets a later route subtract, so a popped node can still improve. Use Bellman-Ford.' },
      { id: 'dij-stale', front: 'What is a “stale” heap entry and why skip it?', back: 'An old `(d, u)` pair left in the heap after a better route to `u` was found (the heap has no decrease-key). When it pops, `d > dist[u]`, so skip it: it would only repeat work.' },
      { id: 'dij-cost', front: 'Dijkstra’s time and space with a binary heap?', back: 'O((V + E) log V) time (at most E pushes, each O(log V)), O(V + E) space. Array version: O(V²), better on dense graphs.' },
      { id: 'dij-visited', front: 'When is a node “final” in Dijkstra: when pushed or when popped?', back: 'When **popped** (non-stale). Marking at push time is the classic bug: the first route found is not necessarily the cheapest.' },
      { id: 'bf-rounds', front: 'Bellman-Ford: what does round r guarantee?', back: 'After round r, `dist[v]` is the cheapest cost using **at most r edges**. V − 1 rounds cover every simple path; a change in round V means a reachable negative cycle. O(V·E).' },
      { id: 'bf-khop', front: 'Cheapest route with “at most k stops”: algorithm and the detail that matters?', back: 'Bellman-Ford for k + 1 rounds, reading last round’s row and writing to a copy so one round adds exactly one edge. O(k·E).' },
      { id: 'fw-loop', front: 'Floyd-Warshall in one line, and the loop-order rule?', back: '`d[i][j] = min(d[i][j], d[i][k] + d[k][j])` for all i, j, with **k outermost**. O(n³) time, O(n²) space. Negative cycle: `d[i][i] < 0`.' },
      { id: 'bfs-01', front: '0-1 BFS: how does the deque work?', back: 'Cost-0 edge: push the neighbour to the **front**. Cost-1 edge: push to the **back**. The deque stays sorted by distance, so no heap is needed. O(V + E).' },
      { id: 'minimax', front: 'Minimise the largest edge on a route: what changes in Dijkstra?', back: 'Relax with `max(cost so far, w)` instead of `cost so far + w`. It stays valid because the cost never decreases as the route grows. Binary search plus BFS or union-find also works.' },
      { id: 'which-sp', front: 'Which shortest-path tool for: equal weights, 0/1 weights, positive weights, negative weights, all pairs?', back: 'BFS · 0-1 BFS (deque) · Dijkstra (heap) · Bellman-Ford · Floyd-Warshall (small n).' },
      { id: 'path-parent', front: 'How do you return the route, not just its length?', back: 'Store `parent[v] = u` whenever `dist[v]` improves. At the end, walk from the destination through `parent` back to the source and reverse.' }
    ],

    deeper: [
      { title: 'Dijkstra’s algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/graph/dijkstra.html', time: 'about 20 min', note: 'A careful write-up with the correctness proof, the array and heap versions, and when each is faster.' },
      { title: 'Bellman-Ford algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/graph/bellman_ford.html', time: 'about 15 min', note: 'Negative cycles, detecting and extracting them, and the k-edge-limit trick used in the flights problem.' },
      { title: 'Floyd-Warshall algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/graph/all-pair-shortest-path-floyd-warshall.html', time: 'about 15 min', note: 'The all-pairs matrix, why the loop order matters, and path reconstruction.' },
      { title: '0-1 BFS (cp-algorithms)', url: 'https://cp-algorithms.com/graph/01_bfs.html', time: 'about 10 min', note: 'The deque trick, and Dijkstra with small integer weights.' },
      { title: 'Single-source shortest paths (VisuAlgo)', url: 'https://visualgo.net/en/sssp', time: 'about 15 min', note: 'An animated Dijkstra and Bellman-Ford on graphs you can draw. A good second visualizer once the one on this page feels easy.' },
      { title: 'NeetCode roadmap: Advanced Graphs', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where Dijkstra, Bellman-Ford and minimum-spanning-tree questions sit in the NeetCode 150. Some course pages may ask you to sign in.' }
    ],

    detective: [
      { id: 'fare-hunt', decoys: ['graphs', 'heaps', 'mst'],
        statement: 'A transit app stores the fare for each direct hop between two stations. Fares differ from hop to hop, none is ever negative, and a traveller can ride in either direction. A commuter enters the station near home and wants the lowest total fare to every other station on the network, which has over a hundred thousand stations. The answer must come back instantly.',
        why: 'One start, many destinations, unequal non-negative costs, and a map far too big to try all routes. Counting hops would give the wrong answer because the cheapest route is not the shortest. Repeatedly finalising the closest unfinished station with a priority queue is Dijkstra. A spanning tree would connect everything cheaply, which is a different question.' },
      { id: 'steepest-step', decoys: ['binary-search', 'graphs', 'union-find'],
        statement: 'A hiking club maps a valley as a grid of squares, each marked with its altitude. A group will walk from the north-west hut to the south-east hut, stepping to a side-adjacent square each time. Nobody cares how far they walk; what matters is that the single biggest climb or drop between two neighbouring squares along the way is as gentle as possible. Plan the route whose steepest step is smallest.',
        why: 'The cost of a route is its worst single step, not a total, and the squares form a grid of nodes. Priority-queue search still works when the route cost is the maximum along it, because it never shrinks as the route grows. Guessing a gentleness limit and testing reachability would also work, which is why the decoys are plausible.' },
      { id: 'stopover-cap', decoys: ['graphs', 'dp-1d', 'heaps'],
        statement: 'A courier company has one-way depot-to-depot lanes, each with a fixed price. A client wants a parcel delivered from the origin depot to a target depot, but contract rules allow it to be handled by at most a few intermediate depots. Find the lowest total price that obeys the cap, or report that no legal route exists. Sometimes a very cheap route exists but uses too many depots.',
        why: 'The cheapest route is not the answer if it breaks the cap: the number of edges used is part of the question. Relaxing every lane once per allowed edge, so that after round r you know the best price using at most r lanes, handles the cap directly. A plain distance per depot would throw away the pricier but shorter route that is needed.' }
    ]
  });
})();
