/* Offer Ready: Minimum spanning tree. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in.
   JavaScript has no built-in heap, so HEAP (a compact comparator heap, same as heaps.js) is pasted into the Prim snippet. */
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
  var CLASSIC = [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2]];
  (OR.topics = OR.topics || []).push({
    id: 'mst',

    hook: 'A minimum spanning tree answers one question: *what is the cheapest way to wire everything together so that nothing is cut off?* Cable between offices, roads between towns, pipes between pumps: you must connect all the nodes, and every link has a price. The answer is always a tree (any extra link only adds cost and a loop), and it is found by a greedy rule that is provably safe: take the cheapest link that joins two things that aren’t yet joined. It is a small topic and a **low-frequency** one, but it is a favourite for showing you can pair union-find with sorting or a heap. When it shows up, it is usually one clean problem (Min Cost to Connect All Points) or a Hard that asks which edges are essential.',

    cues: [
      'You must **connect all nodes** of an undirected weighted graph (or every point, city, server) and the goal is the **minimum total cost** of the links.',
      'The answer asks for the **total weight**, or *which* links to build, and nobody cares about the distance between any particular pair, only that everything is connected.',
      'The input is **points on a plane** with a cost per pair (Manhattan or Euclidean distance): the graph is complete and you build edges yourself.',
      'The question asks how many **spare** links there are, or the minimum number of **extra** links needed, in a network: that is components plus a spanning forest.',
      'The question is about a **bottleneck**: the path whose largest edge is as small as possible. That path always lies on the minimum spanning tree.',
      'The trap: **shortest path is not the same thing.** If the question mentions a source and a destination and asks for the cheapest *route*, you want Dijkstra. If it asks to join *everything* at least total cost, you want a spanning tree.'
    ],

    intuition: [
      'Picture a village with no phone lines, and a list of quotes: each quote is a cable between two houses with a price. You want every house on the network at the smallest total price. Two rules do all the work.',
      '**The cut property: the cheapest link across any divide is safe.** Split the houses into two non-empty groups any way you like. Some cable must cross that divide, and the cheapest crossing cable belongs to *some* cheapest network: if a cheapest network skipped it, adding it would form a loop through a more expensive crossing cable, and swapping that one out would not cost more. (With ties there can be several cheapest networks; this rule always finds one.)',
      '**The cycle property: the heaviest link on any loop is never needed.** If a set of links already connects some houses in a ring, the most expensive link of that ring can be dropped without disconnecting anyone, so a cheapest network leaves it out. (Again, ties may allow a choice.)',
      'Those two rules give two algorithms. **Kruskal** looks at all links from cheapest to dearest and keeps a link unless its two ends are already connected (a loop would form). “Are these two already connected?” is exactly what **union-find** answers in nearly O(1), and the visualizer above shows that decision as accept or skip. **Prim** grows a single tree outward from any starting house: the cut is “tree versus everything else”, so the cheapest link leaving the tree is safe; keep a **min-heap** of the links leaving the tree and repeatedly take the cheapest that reaches a new house.',
      'A spanning tree on n nodes has exactly **n − 1** edges. If the graph is not connected there is no spanning tree, but Kruskal still works: it produces a **minimum spanning forest**, one tree per component, and the number of components is `n − (edges kept)`. That gives you the “count the components” and “how many extra links do I need” answers for free.',
      'Finally, keep MST and shortest paths apart. A shortest-path tree from a source minimises each node’s distance **to that source**; an MST minimises the **total** weight. They disagree often. With edges A-B 2, B-C 2, A-C 3, the MST is A-B and B-C (total 4), but the shortest route from A to C is the direct edge of weight 3. The “not shortest paths” preset in the visualizer is exactly this.'
    ].join('\n\n'),

    viz: 'mst',

    template: {
      title: 'Kruskal: sort the edges, union-find decides',
      note: 'The **visualizer above lights these exact lines**. Sort once. For each edge, ask union-find whether its ends are already in the same group: if so, taking it would close a cycle, so skip it; if not, it is the cheapest edge leaving that group, so take it and merge the groups. The function returns `[total weight, groups left]`: one group means a spanning tree, more means a **forest**, and `groups` is the component count. Switch the visualizer to **Prim** and the same three lines (consider, skip, take) apply, with a min-heap of crossing edges instead of a sorted list; Prim’s code is in the variations below.',
      code: {
        py: `def kruskal(n, edges):                         #> edges are [u, v, w]; nodes are 0 .. n-1
    parent = list(range(n))                    #> Union-find: every node starts in its own group
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]      #> Path halving keeps the trees nearly flat
            x = parent[x]
        return x
    edges = sorted(edges, key=lambda e: e[2])  #@sort > 1. Sort the edges by weight, cheapest first
    total, groups = 0, n
    for u, v, w in edges:                      #@edge > 2. Consider each edge in order
        ru, rv = find(u), find(v)              #@edge > Which groups are the two ends in?
        if ru == rv:
            continue                           #@skip > 3. Same group: this edge would close a cycle, so skip it
        parent[ru] = rv                        #@take > 4. Different groups: it is the cheapest edge leaving this group, so keep it and merge
        total += w                             #@take
        groups -= 1
    return [total, groups]                     #> groups == 1: a spanning tree. More than 1: a forest, one tree per component`,
        js: `function kruskal(n, edges) {                    // edges are [u, v, w]; nodes are 0 .. n-1
  const parent = Array.from({ length: n }, (_, i) => i);  //> Union-find: every node starts in its own group
  const find = x => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];          //> Path halving keeps the trees nearly flat
      x = parent[x];
    }
    return x;
  };
  edges = [...edges].sort((a, b) => a[2] - b[2]);  //@sort > 1. Sort the edges by weight, cheapest first
  let total = 0, groups = n;
  for (const [u, v, w] of edges) {            //@edge > 2. Consider each edge in order
    const ru = find(u), rv = find(v);         //@edge > Which groups are the two ends in?
    if (ru === rv) continue;                  //@skip > 3. Same group: this edge would close a cycle, so skip it
    parent[ru] = rv;                          //@take > 4. Different groups: it is the cheapest edge leaving this group, so keep it and merge
    total += w;                               //@take
    groups--;
  }
  return [total, groups];                     //> groups === 1: a spanning tree. More than 1: a forest, one tree per component
}`,
        java: `class Solution {
    private int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];                   //> Path halving keeps the trees nearly flat
            x = parent[x];
        }
        return x;
    }

    public int[] kruskal(int n, int[][] edges) {             //> edges are {u, v, w}; nodes are 0 .. n-1
        int[] parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;           //> Union-find: every node starts in its own group
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, (a, b) -> a[2] - b[2]);          //@sort > 1. Sort the edges by weight, cheapest first
        int total = 0, groups = n;
        for (int[] e : sorted) {                             //@edge > 2. Consider each edge in order
            int ru = find(parent, e[0]), rv = find(parent, e[1]);  //@edge > Which groups are the two ends in?
            if (ru == rv) continue;                          //@skip > 3. Same group: this edge would close a cycle, so skip it
            parent[ru] = rv;                                 //@take > 4. Different groups: it is the cheapest edge leaving this group, so keep it and merge
            total += e[2];                                   //@take
            groups--;
        }
        return new int[]{total, groups};                     //> groups == 1: a spanning tree. More than 1: a forest, one tree per component
    }
}`,
        cpp: `class Solution {
    int find(vector<int>& parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];                   //> Path halving keeps the trees nearly flat
            x = parent[x];
        }
        return x;
    }
public:
    vector<int> kruskal(int n, vector<vector<int>>& edges) { //> edges are {u, v, w}; nodes are 0 .. n-1
        vector<int> parent(n);
        iota(parent.begin(), parent.end(), 0);               //> Union-find: every node starts in its own group
        sort(edges.begin(), edges.end(),
             [](const vector<int>& a, const vector<int>& b) { return a[2] < b[2]; });  //@sort > 1. Sort the edges by weight, cheapest first
        int total = 0, groups = n;
        for (auto& e : edges) {                              //@edge > 2. Consider each edge in order
            int ru = find(parent, e[0]), rv = find(parent, e[1]);  //@edge > Which groups are the two ends in?
            if (ru == rv) continue;                          //@skip > 3. Same group: this edge would close a cycle, so skip it
            parent[ru] = rv;                                 //@take > 4. Different groups: it is the cheapest edge leaving this group, so keep it and merge
            total += e[2];                                   //@take
            groups--;
        }
        return {total, groups};                              //> groups == 1: a spanning tree. More than 1: a forest, one tree per component
    }
};`
      },
      tests: { fn: 'kruskal', sig: { args: ['int', 'int[][]'] }, cases: [
        { args: [5, CLASSIC], out: [10, 1] },
        { args: [4, [[0, 1, 1], [1, 2, 2], [0, 2, 3]]], out: [3, 2] },
        { args: [4, [[0, 1, 1], [2, 3, 5]]], out: [6, 2] },
        { args: [1, []], out: [0, 1] },
        { args: [3, [[0, 1, 2], [1, 2, 2], [0, 2, 3]]], out: [4, 1] }] }
    },

    complexity: {
      time: 'Kruskal O(E log E) · Prim (heap) O(E log V) · Prim (array, dense) O(V²)',
      space: 'O(V + E)',
      why: 'Kruskal is dominated by sorting the E edges: O(E log E), which equals O(E log V) because E is at most V². The union-find work is E calls to `find` at nearly constant amortised cost (inverse Ackermann, under 5 for any real input). Prim with a binary heap pushes each edge at most twice and pops each at most once, so it is O(E log V). On a **dense** graph (E near V², such as points on a plane where every pair is an edge) the array version of Prim, which scans for the nearest outside node instead of using a heap, is O(V²) and beats both: it never builds or sorts the edge list.',
      trap: 'Three things trip people up. (1) For **points on a plane**, E = n(n − 1) / 2, so building and sorting every edge is O(n² log n) and uses O(n²) memory; the O(n²) array Prim is the better answer at n up to 1000. (2) “Kruskal is O(E log E)” and “O(E log V)” are the same bound, so don’t argue it; just be ready to say why. (3) The MST is **not unique** when weights tie. The *total* is unique, but if the answer asks for the edges (or their indices), expect a tie-breaking rule or a question about *which* edges every MST must contain.'
    },

    variations: [
      {
        name: 'Prim with a heap',
        body: 'Same answer, different growth. Start from any node, keep a **min-heap** of `(weight, node)` entries for edges leaving the tree, and repeatedly pop the cheapest. If that node is already in the tree the entry is stale (a cheaper edge reached it first), so skip it; otherwise take it and push the new node’s edges. This is the “lazy” form, and it is exactly the consider, skip and take lines you saw the visualizer light in Prim mode. Choose Prim when the graph is dense or given as an adjacency list, and Kruskal when you have an edge list. Prim returns -1 here if the heap empties before every node is reached (the graph is disconnected).',
        code: {
          py: `def prim(n, edges):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((w, v))
        adj[v].append((w, u))
    seen, heap, total = set(), [(0, 0)], 0   #> Start at node 0 with a free entry
    while heap and len(seen) < n:
        w, u = heapq.heappop(heap)           #> Cheapest edge leaving the tree
        if u in seen:
            continue                         #> Stale: a cheaper edge already brought u in
        seen.add(u)
        total += w
        for nw, v in adj[u]:
            if v not in seen:
                heapq.heappush(heap, (nw, v))
    return total if len(seen) == n else -1   #> -1 when some node was never reached`,
          js: HEAP + `
function prim(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) { adj[u].push([w, v]); adj[v].push([w, u]); }
  const seen = new Array(n).fill(false), heap = new Heap((a, b) => a[0] < b[0]);
  heap.push([0, 0]);                          //> Start at node 0 with a free entry
  let total = 0, count = 0;
  while (heap.size && count < n) {
    const [w, u] = heap.pop();                //> Cheapest edge leaving the tree
    if (seen[u]) continue;                    //> Stale: a cheaper edge already brought u in
    seen[u] = true; total += w; count++;
    for (const [nw, v] of adj[u]) if (!seen[v]) heap.push([nw, v]);
  }
  return count === n ? total : -1;            //> -1 when some node was never reached
}`,
          java: `class Solution {
    public int prim(int n, int[][] edges) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) { adj[e[0]].add(new int[]{e[2], e[1]}); adj[e[1]].add(new int[]{e[2], e[0]}); }
        boolean[] seen = new boolean[n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.add(new int[]{0, 0});                           //> Start at node 0 with a free entry
        int total = 0, count = 0;
        while (!heap.isEmpty() && count < n) {
            int[] top = heap.poll();                         //> Cheapest edge leaving the tree
            if (seen[top[1]]) continue;                      //> Stale: a cheaper edge already brought it in
            seen[top[1]] = true; total += top[0]; count++;
            for (int[] nx : adj[top[1]]) if (!seen[nx[1]]) heap.add(nx);
        }
        return count == n ? total : -1;                      //> -1 when some node was never reached
    }
}`,
          cpp: `class Solution {
public:
    int prim(int n, vector<vector<int>>& edges) {
        vector<vector<pair<int, int>>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back({e[2], e[1]}); adj[e[1]].push_back({e[2], e[0]}); }
        vector<bool> seen(n, false);
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;
        heap.push({0, 0});                                   //> Start at node 0 with a free entry
        int total = 0, count = 0;
        while (!heap.empty() && count < n) {
            auto [w, u] = heap.top(); heap.pop();            //> Cheapest edge leaving the tree
            if (seen[u]) continue;                           //> Stale: a cheaper edge already brought u in
            seen[u] = true; total += w; count++;
            for (auto [nw, v] : adj[u]) if (!seen[v]) heap.push({nw, v});
        }
        return count == n ? total : -1;                      //> -1 when some node was never reached
    }
};`
        },
        tests: { fn: 'prim', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [5, CLASSIC], out: 10 }, { args: [4, [[0, 1, 1], [2, 3, 5]]], out: -1 }, { args: [3, [[0, 1, 2], [1, 2, 2], [0, 2, 3]]], out: 4 },
          { args: [1, []], out: 0 }, { args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]]], out: 3 }] }
      },
      {
        name: 'Second-best tree and critical edges',
        body: 'The standard follow-up: “what if one link is withdrawn?” **Remove each MST edge in turn and rebuild.** The cheapest tree that avoids a particular MST edge is the best alternative that differs from the MST in that edge, so the minimum over all of them is the **second-best** spanning tree (it can tie the best). The same loop answers “which edges are **critical**”: an edge is critical if every MST contains it, which you can detect because skipping it makes the total larger or disconnects the graph. An edge that appears in *some* MST but not all is **pseudo-critical**: force it in first and the total doesn’t change. That is the whole of the Hard problem 1489 below. Cost: V rebuilds of an O(E α) pass, so O(V · E α) after one sort, fine for the small limits those problems use. (A faster method finds the heaviest edge on each tree path with binary lifting, but you won’t be asked for it.)',
        code: {
          py: `def second_best(n, edges):
    order = sorted(range(len(edges)), key=lambda i: edges[i][2])   # edge indices, cheapest first
    def build(skip):                                  # MST total with one edge banned, plus the edges used
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        total, used = 0, []
        for i in order:
            if i == skip:
                continue
            u, v, w = edges[i]
            ru, rv = find(u), find(v)
            if ru != rv:
                parent[ru] = rv
                total += w
                used.append(i)
        return (total, used) if len(used) == n - 1 else (None, used)
    best, used = build(-1)
    if best is None:
        return -1                                     # not connected: no spanning tree at all
    alt = [build(i)[0] for i in used]                 # ban each MST edge, rebuild
    alt = [a for a in alt if a is not None]
    return min(alt) if alt else -1                    # -1 when the tree is forced (every edge is critical)`,
          js: `function secondBest(n, edges) {
  const order = edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2]);   // edge indices, cheapest first
  const build = skip => {                              // MST total with one edge banned, plus the edges used
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    let total = 0; const used = [];
    for (const i of order) {
      if (i === skip) continue;
      const [u, v, w] = edges[i], ru = find(u), rv = find(v);
      if (ru !== rv) { parent[ru] = rv; total += w; used.push(i); }
    }
    return used.length === n - 1 ? { total, used } : { total: null, used };
  };
  const base = build(-1);
  if (base.total === null) return -1;                  // not connected: no spanning tree at all
  let best = null;
  for (const i of base.used) {                         // ban each MST edge, rebuild
    const t = build(i).total;
    if (t !== null && (best === null || t < best)) best = t;
  }
  return best === null ? -1 : best;                    // -1 when the tree is forced (every edge is critical)
}`,
          java: `class Solution {
    private int[] parent;
    private List<Integer> used;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    // MST total with edge \`skip\` banned (-1 bans none), or -1 if the rest cannot connect everything. Fills \`used\`.
    private int build(int n, int[][] edges, Integer[] order, int skip) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        used = new ArrayList<>();
        int total = 0;
        for (int i : order) {
            if (i == skip) continue;
            int ru = find(edges[i][0]), rv = find(edges[i][1]);
            if (ru != rv) { parent[ru] = rv; total += edges[i][2]; used.add(i); }
        }
        return used.size() == n - 1 ? total : -1;
    }

    public int secondBest(int n, int[][] edges) {
        Integer[] order = new Integer[edges.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> edges[a][2] - edges[b][2]);   // edge indices, cheapest first
        if (build(n, edges, order, -1) < 0) return -1;             // not connected
        List<Integer> mst = new ArrayList<>(used);
        int best = -1;
        for (int skip : mst) {                                     // ban each MST edge, rebuild
            int t = build(n, edges, order, skip);
            if (t >= 0 && (best < 0 || t < best)) best = t;
        }
        return best;                                               // -1 when the tree is forced
    }
}`,
          cpp: `class Solution {
    vector<int> parent, used;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    // MST total with edge \`skip\` banned (-1 bans none), or -1 if the rest cannot connect everything. Fills \`used\`.
    int build(int n, vector<vector<int>>& edges, vector<int>& order, int skip) {
        parent.assign(n, 0);
        iota(parent.begin(), parent.end(), 0);
        used.clear();
        int total = 0;
        for (int i : order) {
            if (i == skip) continue;
            int ru = find(edges[i][0]), rv = find(edges[i][1]);
            if (ru != rv) { parent[ru] = rv; total += edges[i][2]; used.push_back(i); }
        }
        return (int)used.size() == n - 1 ? total : -1;
    }
public:
    int secondBest(int n, vector<vector<int>>& edges) {
        vector<int> order(edges.size());
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return edges[a][2] < edges[b][2]; });  // edge indices, cheapest first
        if (build(n, edges, order, -1) < 0) return -1;             // not connected
        vector<int> mst = used;
        int best = -1;
        for (int skip : mst) {                                     // ban each MST edge, rebuild
            int t = build(n, edges, order, skip);
            if (t >= 0 && (best < 0 || t < best)) best = t;
        }
        return best;                                               // -1 when the tree is forced
    }
};`
        },
        tests: { fn: { py: 'second_best', default: 'secondBest' }, sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]]], out: 2 },
          { args: [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4], [0, 2, 3]]], out: 7 },
          { args: [3, [[0, 1, 5], [1, 2, 6]]], out: -1 },
          { args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]]], out: 3 },
          { args: [5, CLASSIC], out: 12 }] }
      },
      {
        name: 'MST versus shortest paths',
        body: 'They answer different questions, and the quickest way to choose is to read the goal. **Shortest path (Dijkstra)**: one source, minimise the *distance from the source to each node*; the result is a tree of routes, and its total weight is whatever it is. **MST**: no source, minimise the *sum of the edge weights* that connect everything. Same graph, different trees: with A-B 2, B-C 2, A-C 3, the shortest path from A to C is the edge of weight 3, but the MST skips that edge (total 4 against 5). One shared idea, though: Prim’s algorithm and Dijkstra’s differ in a single line, the heap key. Prim keys on the **edge weight** into the tree; Dijkstra keys on the **total distance** from the source. If you can write one, you can write the other. Two more differences: Dijkstra needs non-negative weights; MST algorithms work with negative weights too, because only the *ordering* of edges matters, and MST works only on undirected graphs (the directed version needs Edmonds’ algorithm, which is not an interview topic).'
      },
      {
        name: 'Components, forests and clustering',
        body: 'Kruskal on a disconnected graph is not an error: it keeps going and ends with a **forest**, one tree per component. The `groups` it returns is the **component count**, and a connected graph has `n − 1` tree edges, so a graph that has `E` edges has `E − (n − groups)` **redundant** ones that you could use to bridge components elsewhere. That is the whole of “how many cables do I need to move to connect the network” (1319: the answer is `groups − 1` if you own at least `n − 1` cables, otherwise it’s impossible). A related idea is **clustering**: stop Kruskal early, when `groups` has dropped to `k`, and you have the k groups whose closest pair of *different* groups is as far apart as possible (the “maximum spacing” split). And a **bottleneck path** (minimise the largest edge on the way from S to T) is just “run Kruskal until S and T are in the same group; the edge that connected them is the answer”, which is how the minimum-effort grid problem (1631) is solved without Dijkstra.'
      }
    ],

    worked: [
      {
        lc: 1584,
        restate: 'You are given the coordinates of n points on a plane. You may link any two points, and a link costs the **Manhattan distance** between them (|x₁ − x₂| + |y₁ − y₂|). Connect all the points so there is exactly one simple path between every pair, at the smallest total cost, and return that cost.',
        examples: '- `[[0,0],[2,2],[3,10],[5,2],[7,0]]` → 20.\n- `[[3,12],[-2,5],[-4,1]]` → 18.\n- Edge cases: a single point (cost 0); two points at the same place (a link of cost 0); coordinates as large as a million (the sum still fits in a 32-bit int for n up to 1000, but a long is safer if you extend the limits).',
        brute: 'Try every way of choosing n − 1 links out of the n(n − 1)/2 possible ones and test whether each choice connects everything: exponential, far too slow even for n = 10.',
        insight: '“Connect everything at least total cost, exactly one path between each pair” is a **minimum spanning tree** of the complete graph. Either algorithm works, but the graph is **dense** (every pair is an edge), so Kruskal needs O(n²) edges, which must be built and sorted: O(n² log n) time and O(n²) memory. Prim in its array form needs neither: keep for every point the cheapest known link to the tree (`dist`), repeatedly pull in the nearest outside point, and update the others’ `dist` with their distance to the newly added point. That is O(n²) time and O(n) memory, with no heap and no edge list.',
        code: {
          py: `class Solution:
    def minCostConnectPoints(self, points: List[List[int]]) -> int:
        n = len(points)
        dist = [float('inf')] * n         # cheapest known link from the tree to each point
        dist[0] = 0                       # start the tree at point 0
        used = [False] * n
        total = 0
        for _ in range(n):
            u = -1
            for i in range(n):            # the nearest point not yet in the tree
                if not used[i] and (u == -1 or dist[i] < dist[u]):
                    u = i
            used[u] = True
            total += dist[u]
            for v in range(n):            # the new point may offer cheaper links to the rest
                if not used[v]:
                    d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])
                    if d < dist[v]:
                        dist[v] = d
        return total`,
          js: `function minCostConnectPoints(points) {
  const n = points.length;
  const dist = new Array(n).fill(Infinity);   // cheapest known link from the tree to each point
  dist[0] = 0;                                // start the tree at point 0
  const used = new Array(n).fill(false);
  let total = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {             // the nearest point not yet in the tree
      if (!used[i] && (u === -1 || dist[i] < dist[u])) u = i;
    }
    used[u] = true;
    total += dist[u];
    for (let v = 0; v < n; v++) {             // the new point may offer cheaper links to the rest
      if (used[v]) continue;
      const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
      if (d < dist[v]) dist[v] = d;
    }
  }
  return total;
}`,
          java: `class Solution {
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        int[] dist = new int[n];                             // cheapest known link from the tree to each point
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[0] = 0;                                         // start the tree at point 0
        boolean[] used = new boolean[n];
        int total = 0;
        for (int step = 0; step < n; step++) {
            int u = -1;
            for (int i = 0; i < n; i++) {                    // the nearest point not yet in the tree
                if (!used[i] && (u == -1 || dist[i] < dist[u])) u = i;
            }
            used[u] = true;
            total += dist[u];
            for (int v = 0; v < n; v++) {                    // the new point may offer cheaper links to the rest
                if (used[v]) continue;
                int d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
                if (d < dist[v]) dist[v] = d;
            }
        }
        return total;
    }
}`,
          cpp: `class Solution {
public:
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size();
        vector<int> dist(n, INT_MAX);                        // cheapest known link from the tree to each point
        dist[0] = 0;                                         // start the tree at point 0
        vector<bool> used(n, false);
        int total = 0;
        for (int step = 0; step < n; step++) {
            int u = -1;
            for (int i = 0; i < n; i++) {                    // the nearest point not yet in the tree
                if (!used[i] && (u == -1 || dist[i] < dist[u])) u = i;
            }
            used[u] = true;
            total += dist[u];
            for (int v = 0; v < n; v++) {                    // the new point may offer cheaper links to the rest
                if (used[v]) continue;
                int d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1]);
                if (d < dist[v]) dist[v] = d;
            }
        }
        return total;
    }
};`
        },
        complexity: 'O(n²) time (n rounds, each scanning n points twice) and O(n) space. Kruskal over the full edge list would be O(n² log n) time and O(n²) space.',
        say: '“Connecting every point at the least total cost with no redundant link is a minimum spanning tree. The graph is complete, so I’ll avoid building n² edges: Prim’s algorithm with an array. I keep the cheapest known link from the tree to each outside point, pull in the nearest one, and relax the rest against it. That’s O(n²) time and O(n) space. Kruskal also works, but it needs the sorted edge list.”',
        followups: [
          { q: 'Why not Kruskal here?', a: 'It works, and it is the better pick when the edges are given. Here you would generate all n(n − 1)/2 pairs and sort them: O(n² log n) and O(n²) memory. Array Prim is O(n²) with O(n) memory.' },
          { q: 'What if the distance were Euclidean?', a: 'Same algorithm with a different distance function (use squared distance for comparisons, then take square roots only when adding to the total). For huge n you would use the fact that the Euclidean MST is a subgraph of the Delaunay triangulation: O(n log n).' },
          { q: 'How would you return the actual links, not just the cost?', a: 'Store `link[v]`, the tree point that gave `dist[v]` its current value, whenever you lower `dist[v]`. When point u is added, `(link[u], u)` is a tree edge.' },
          { q: 'What if some pairs were forbidden?', a: 'The graph is no longer complete, so it may not be connected. Use the heap version of Prim (or Kruskal) over the allowed edges, and if fewer than n − 1 edges get taken, report that connecting everything is impossible.' }
        ]
      },
      {
        lc: 1489,
        restate: 'You get a connected, undirected, weighted graph on n nodes with a list of edges; each edge is identified by its **index** in the list. Among all minimum spanning trees, report two lists of edge indices: the **critical** edges (present in *every* minimum spanning tree) and the **pseudo-critical** edges (present in *some* but not all). Order inside the lists doesn’t matter.',
        examples: '- `n = 4`, a 4-cycle where every edge weighs 1 → no critical edges, all four pseudo-critical (any three of the four form an MST).\n- A triangle of 1, 1, 1 plus a bridge of weight 5 to a fourth node → the bridge is critical; the three triangle edges are pseudo-critical.\n- Edge cases: a graph that is already a tree (every edge is critical); parallel-looking edges with equal weights; n = 2.',
        brute: 'Enumerate every set of n − 1 edges, keep the spanning trees, find the minimum total, and intersect and union the minimum ones. Correct, but exponential in the number of edges.',
        insight: 'Compute the MST weight `base` once with Kruskal. Then test each edge on its own, two questions each. **Critical?** Build the MST with that edge **banned**: if the total rises above `base`, or the graph falls apart, no cheapest tree can avoid it, so it is critical. **Pseudo-critical?** (only if not critical) Build the MST with that edge **forced in first**: if the total still equals `base`, some cheapest tree uses it. If it is neither critical nor pseudo-critical, every cheapest tree avoids it: it is the heaviest edge on a cycle. Each test is a Kruskal pass over the pre-sorted edge order with a fresh union-find.',
        code: {
          py: `class Solution:
    def findCriticalAndPseudoCriticalEdges(self, n: int, edges: List[List[int]]) -> List[List[int]]:
        order = sorted(range(len(edges)), key=lambda i: edges[i][2])   # edge indices, cheapest first

        def build(skip, force):              # MST total with one edge banned and/or one forced; inf if not spanning
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x
            total = used = 0
            if force != -1:
                u, v, w = edges[force]
                parent[find(u)] = find(v)
                total += w
                used += 1
            for i in order:
                if i == skip:
                    continue
                u, v, w = edges[i]
                ru, rv = find(u), find(v)
                if ru != rv:
                    parent[ru] = rv
                    total += w
                    used += 1
            return total if used == n - 1 else float("inf")

        base = build(-1, -1)
        critical, pseudo = [], []
        for i in range(len(edges)):
            if build(i, -1) > base:          # without it the cost rises: every MST needs it
                critical.append(i)
            elif build(-1, i) == base:       # forcing it in costs nothing extra: some MST uses it
                pseudo.append(i)
        return [critical, pseudo]`,
          js: `function findCriticalAndPseudoCriticalEdges(n, edges) {
  const order = edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2]);   // edge indices, cheapest first
  const build = (skip, force) => {       // MST total with one edge banned and/or one forced; Infinity if not spanning
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    let total = 0, used = 0;
    if (force !== -1) {
      const [u, v, w] = edges[force];
      parent[find(u)] = find(v);
      total += w; used++;
    }
    for (const i of order) {
      if (i === skip) continue;
      const [u, v, w] = edges[i], ru = find(u), rv = find(v);
      if (ru !== rv) { parent[ru] = rv; total += w; used++; }
    }
    return used === n - 1 ? total : Infinity;
  };
  const base = build(-1, -1), critical = [], pseudo = [];
  for (let i = 0; i < edges.length; i++) {
    if (build(i, -1) > base) critical.push(i);          // without it the cost rises: every MST needs it
    else if (build(-1, i) === base) pseudo.push(i);     // forcing it in costs nothing extra: some MST uses it
  }
  return [critical, pseudo];
}`,
          java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    // MST total with one edge banned and/or one forced; MAX_VALUE if the edges used do not span the graph
    private int build(int n, int[][] edges, Integer[] order, int skip, int force) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int total = 0, used = 0;
        if (force >= 0) {
            parent[find(edges[force][0])] = find(edges[force][1]);
            total += edges[force][2];
            used++;
        }
        for (int i : order) {
            if (i == skip) continue;
            int ru = find(edges[i][0]), rv = find(edges[i][1]);
            if (ru != rv) { parent[ru] = rv; total += edges[i][2]; used++; }
        }
        return used == n - 1 ? total : Integer.MAX_VALUE;
    }

    public List<List<Integer>> findCriticalAndPseudoCriticalEdges(int n, int[][] edges) {
        Integer[] order = new Integer[edges.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> edges[a][2] - edges[b][2]);   // edge indices, cheapest first
        int base = build(n, edges, order, -1, -1);
        List<Integer> critical = new ArrayList<>(), pseudo = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) {
            if (build(n, edges, order, i, -1) > base) critical.add(i);          // without it the cost rises
            else if (build(n, edges, order, -1, i) == base) pseudo.add(i);      // forced in, no extra cost
        }
        return List.of(critical, pseudo);
    }
}`,
          cpp: `class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    // MST total with one edge banned and/or one forced; INT_MAX if the edges used do not span the graph
    int build(int n, vector<vector<int>>& edges, vector<int>& order, int skip, int force) {
        parent.assign(n, 0);
        iota(parent.begin(), parent.end(), 0);
        int total = 0, used = 0;
        if (force >= 0) {
            int ru = find(edges[force][0]), rv = find(edges[force][1]);
            parent[ru] = rv;
            total += edges[force][2];
            used++;
        }
        for (int i : order) {
            if (i == skip) continue;
            int ru = find(edges[i][0]), rv = find(edges[i][1]);
            if (ru != rv) { parent[ru] = rv; total += edges[i][2]; used++; }
        }
        return used == n - 1 ? total : INT_MAX;
    }
public:
    vector<vector<int>> findCriticalAndPseudoCriticalEdges(int n, vector<vector<int>>& edges) {
        vector<int> order(edges.size());
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return edges[a][2] < edges[b][2]; });   // edge indices, cheapest first
        int base = build(n, edges, order, -1, -1);
        vector<int> critical, pseudo;
        for (int i = 0; i < (int)edges.size(); i++) {
            if (build(n, edges, order, i, -1) > base) critical.push_back(i);        // without it the cost rises
            else if (build(n, edges, order, -1, i) == base) pseudo.push_back(i);    // forced in, no extra cost
        }
        return {critical, pseudo};
    }
};`
        },
        complexity: 'One sort, then up to 2E Kruskal passes over E edges each: O(E log E + E² α(V)). Space O(V + E). With the limits this problem uses (about 100 edges) that is tiny; a bridge-finding approach handles the critical edges faster, but it is not needed here.',
        say: '“I compute the MST weight once. Then for each edge I ask two questions with Kruskal on the pre-sorted order. Ban the edge: if the total rises or the graph disconnects, it is critical. Otherwise force it in first: if the total is unchanged, it is pseudo-critical; if not, no cheapest tree uses it. Each check is O(E α), so O(E²) overall, fine for the limits.”',
        followups: [
          { q: 'Why does forcing an edge in first make sense for the pseudo-critical test?', a: 'If some MST uses the edge, then starting Kruskal from that edge and completing the tree optimally still reaches the minimum weight. If forcing it raises the total, every tree containing it is heavier than the best, so no MST uses it.' },
          { q: 'Why test critical before pseudo-critical?', a: 'A critical edge also passes the forced-in test (every MST contains it), so you would mislabel it as pseudo-critical. Checking the ban test first, and using `elif`, keeps the lists disjoint.' },
          { q: 'Could you find the critical edges faster?', a: 'Yes: in the graph of edges that can belong to an MST (grouped by weight), critical edges are the **bridges**. Run Kruskal by weight classes and apply a bridge-finding DFS inside each class. It is O(E log E) but much harder to write under pressure.' },
          { q: 'What changes if the graph can be disconnected?', a: '`build` would return infinity even for the base case, so every comparison is meaningless. Handle components separately or define the question on the spanning forest: an edge is critical if banning it increases the forest weight or the number of components.' }
        ]
      }
    ],

    practice: [
      { lc: 1584,
        hints: ['Every point must be connected to every other, with no redundant link and the least total cost: a minimum spanning tree over the complete graph.', 'You could build all n(n − 1) / 2 edges and run Kruskal, but you can avoid the edge list with the array form of Prim: for each point keep the cheapest known link to the tree.', 'Pull in the nearest outside point n times, adding its link cost to the total, and after each pull lower the other points’ distances using the new point.'],
        starter: { py: 'class Solution:\n    def minCostConnectPoints(self, points: List[List[int]]) -> int:\n        pass', js: 'function minCostConnectPoints(points) {\n  \n}' },
        tests: { fn: 'minCostConnectPoints', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]], out: 20 }, { args: [[[3, 12], [-2, 5], [-4, 1]]], out: 18 }, { args: [[[0, 0]]], out: 0 },
          { args: [[[0, 0], [1, 1]]], out: 2 }, { args: [[[0, 0], [0, 0], [5, 5]]], out: 10 }, { args: [[[-1000000, -1000000], [1000000, 1000000]]], out: 4000000 },
          { args: [[[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 3]]], out: 7 }] } },

      { lc: 1489,
        hints: ['Find the MST weight first. Then judge each edge by how the MST weight changes when you ban it and when you force it.', 'Banned edge makes the total larger (or the graph disconnected): the edge is critical. Otherwise, if forcing it in first still gives the base total, it is pseudo-critical.', 'Sort edge indices by weight once and run Kruskal with a fresh union-find for each test, with an optional `skip` edge and an optional `force` edge applied before the loop.'],
        starter: { py: 'class Solution:\n    def findCriticalAndPseudoCriticalEdges(self, n: int, edges: List[List[int]]) -> List[List[int]]:\n        pass', js: 'function findCriticalAndPseudoCriticalEdges(n, edges) {\n  \n}' },
        tests: { fn: 'findCriticalAndPseudoCriticalEdges', sig: { args: ['int', 'int[][]'] }, compare: 'deep', cases: [
          { args: [5, [[0, 1, 1], [1, 2, 1], [2, 3, 2], [0, 3, 2], [0, 4, 3], [3, 4, 3], [1, 4, 6]]], out: [[0, 1], [2, 3, 4, 5]] },
          { args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1]]], out: [[], [0, 1, 2, 3]] },
          { args: [4, [[0, 1, 1], [1, 2, 1], [0, 2, 1], [2, 3, 5]]], out: [[3], [0, 1, 2]] },
          { args: [2, [[0, 1, 5]]], out: [[0], []] },
          { args: [6, [[0, 1, 1], [1, 2, 1], [0, 2, 1], [2, 3, 2], [3, 4, 2], [2, 4, 2], [4, 5, 9]]], out: [[6], [0, 1, 2, 3, 4, 5]] }] } },

      { lc: 1579,
        hints: ['There are two travellers with different cables: type 3 works for both, type 1 only for Alice, type 2 only for Bob. Each needs their own spanning tree of the nodes.', 'Shared cables are worth the most, so take them first: a shared edge that merges groups helps both people at once. Then fill in the gaps with each person’s own cables.', 'Keep two union-finds. Process type 3 first (join in both), then type 1 in Alice’s, then type 2 in Bob’s, counting each cable that merged two groups as “used”. If either person ends with more than one group, return -1; else the answer is total cables minus used.'],
        starter: { py: 'class Solution:\n    def maxNumEdgesToRemove(self, n: int, edges: List[List[int]]) -> int:\n        pass', js: 'function maxNumEdgesToRemove(n, edges) {\n  \n}' },
        solution: { explain: 'Two union-finds, one per person, over nodes 1 to n. Shared cables (type 3) go first because one such cable can serve both people; a shared cable counts as used if it merged two groups for Alice (it merges the same groups for Bob). Then each person’s own cables fill the remaining gaps. A cable that never merged anything is redundant and can be removed. If either person still has more than one group, the graph can’t be fully traversed: -1. Otherwise the answer is `len(edges) - used`. O(m α(n)) time, O(n) space.', code: {
          py: `class Solution:
    def maxNumEdgesToRemove(self, n: int, edges: List[List[int]]) -> int:
        def make():
            return list(range(n + 1))
        def find(p, x):
            while p[x] != x:
                p[x] = p[p[x]]
                x = p[x]
            return x
        def join(p, a, b):
            ra, rb = find(p, a), find(p, b)
            if ra == rb:
                return False
            p[ra] = rb
            return True
        alice, bob = make(), make()
        a = b = n                           # groups left for Alice and for Bob
        used = 0
        for t, u, v in edges:               # shared cables first: they serve both people
            if t == 3:
                if join(alice, u, v):
                    join(bob, u, v)
                    a -= 1
                    b -= 1
                    used += 1
        for t, u, v in edges:               # then each person's own cables
            if t == 1 and join(alice, u, v):
                a -= 1
                used += 1
            elif t == 2 and join(bob, u, v):
                b -= 1
                used += 1
        return len(edges) - used if a == 1 and b == 1 else -1`,
          js: `function maxNumEdgesToRemove(n, edges) {
  const make = () => Array.from({ length: n + 1 }, (_, i) => i);
  const find = (p, x) => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
  const join = (p, a, b) => {
    const ra = find(p, a), rb = find(p, b);
    if (ra === rb) return false;
    p[ra] = rb;
    return true;
  };
  const alice = make(), bob = make();
  let a = n, b = n, used = 0;               // groups left for Alice and for Bob
  for (const [t, u, v] of edges) {          // shared cables first: they serve both people
    if (t === 3 && join(alice, u, v)) { join(bob, u, v); a--; b--; used++; }
  }
  for (const [t, u, v] of edges) {          // then each person's own cables
    if (t === 1 && join(alice, u, v)) { a--; used++; }
    else if (t === 2 && join(bob, u, v)) { b--; used++; }
  }
  return a === 1 && b === 1 ? edges.length - used : -1;
}`,
          java: `class Solution {
    private int find(int[] p, int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
    private boolean join(int[] p, int a, int b) {
        int ra = find(p, a), rb = find(p, b);
        if (ra == rb) return false;
        p[ra] = rb;
        return true;
    }

    public int maxNumEdgesToRemove(int n, int[][] edges) {
        int[] alice = new int[n + 1], bob = new int[n + 1];
        for (int i = 0; i <= n; i++) { alice[i] = i; bob[i] = i; }
        int a = n, b = n, used = 0;                          // groups left for Alice and for Bob
        for (int[] e : edges) {                              // shared cables first: they serve both people
            if (e[0] == 3 && join(alice, e[1], e[2])) { join(bob, e[1], e[2]); a--; b--; used++; }
        }
        for (int[] e : edges) {                              // then each person's own cables
            if (e[0] == 1 && join(alice, e[1], e[2])) { a--; used++; }
            else if (e[0] == 2 && join(bob, e[1], e[2])) { b--; used++; }
        }
        return a == 1 && b == 1 ? edges.length - used : -1;
    }
}`,
          cpp: `class Solution {
    int find(vector<int>& p, int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }
    bool join(vector<int>& p, int a, int b) {
        int ra = find(p, a), rb = find(p, b);
        if (ra == rb) return false;
        p[ra] = rb;
        return true;
    }
public:
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        vector<int> alice(n + 1), bob(n + 1);
        iota(alice.begin(), alice.end(), 0);
        iota(bob.begin(), bob.end(), 0);
        int a = n, b = n, used = 0;                          // groups left for Alice and for Bob
        for (auto& e : edges) {                              // shared cables first: they serve both people
            if (e[0] == 3 && join(alice, e[1], e[2])) { join(bob, e[1], e[2]); a--; b--; used++; }
        }
        for (auto& e : edges) {                              // then each person's own cables
            if (e[0] == 1 && join(alice, e[1], e[2])) { a--; used++; }
            else if (e[0] == 2 && join(bob, e[1], e[2])) { b--; used++; }
        }
        return a == 1 && b == 1 ? (int)edges.size() - used : -1;
    }
};`
        } },
        tests: { fn: 'maxNumEdgesToRemove', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [4, [[3, 1, 2], [3, 2, 3], [1, 1, 3], [1, 2, 4], [1, 1, 2], [2, 3, 4]]], out: 2 }, { args: [4, [[3, 1, 2], [3, 2, 3], [1, 1, 4], [2, 1, 4]]], out: 0 },
          { args: [4, [[3, 2, 3], [1, 1, 2], [2, 3, 4]]], out: -1 }, { args: [2, [[3, 1, 2]]], out: 0 },
          { args: [3, [[1, 1, 2], [2, 2, 3], [3, 1, 3], [3, 1, 2]]], out: 2 }, { args: [3, [[3, 1, 2], [3, 1, 2], [3, 2, 3], [3, 1, 3]]], out: 2 }] } },

      { lc: 1631,
        hints: ['A route’s cost is its largest single step, not the sum. You want the route whose biggest height difference is as small as possible.', 'Treat each pair of neighbouring cells as an edge weighted by the height difference. The best route’s cost is the weight at which the top-left and bottom-right corners first become connected.', 'Sort the edges by weight, union their cells one by one, and stop as soon as the two corners share a group: that edge’s weight is the answer. A single cell costs 0.'],
        starter: { py: 'class Solution:\n    def minimumEffortPath(self, heights: List[List[int]]) -> int:\n        pass', js: 'function minimumEffortPath(heights) {\n  \n}' },
        solution: { explain: 'A bottleneck path problem, solved with Kruskal’s idea. Every adjacent pair of cells is an edge weighted by its height difference. Process edges from lightest to heaviest, merging cells with union-find; the first time the start and the finish are in the same group, the edge just added is the largest on the best route, and every route needs a step at least that big. O(RC log RC) for the sort (R·C cells, about 2RC edges). Dijkstra with a max-instead-of-sum relaxation gives the same answer in the same time.', code: {
          py: `class Solution:
    def minimumEffortPath(self, heights: List[List[int]]) -> int:
        R, C = len(heights), len(heights[0])
        if R * C == 1:
            return 0
        edges = []                            # (height difference, cell, neighbouring cell)
        for r in range(R):
            for c in range(C):
                if r + 1 < R:
                    edges.append((abs(heights[r][c] - heights[r + 1][c]), r * C + c, (r + 1) * C + c))
                if c + 1 < C:
                    edges.append((abs(heights[r][c] - heights[r][c + 1]), r * C + c, r * C + c + 1))
        edges.sort()
        parent = list(range(R * C))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for d, a, b in edges:                 # lightest first
            parent[find(a)] = find(b)
            if find(0) == find(R * C - 1):    # corners connected: d is the biggest step on the best route
                return d
        return 0`,
          js: `function minimumEffortPath(heights) {
  const R = heights.length, C = heights[0].length;
  if (R * C === 1) return 0;
  const edges = [];                           // [height difference, cell, neighbouring cell]
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (r + 1 < R) edges.push([Math.abs(heights[r][c] - heights[r + 1][c]), r * C + c, (r + 1) * C + c]);
      if (c + 1 < C) edges.push([Math.abs(heights[r][c] - heights[r][c + 1]), r * C + c, r * C + c + 1]);
    }
  }
  edges.sort((x, y) => x[0] - y[0]);
  const parent = Array.from({ length: R * C }, (_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (const [d, a, b] of edges) {            // lightest first
    parent[find(a)] = find(b);
    if (find(0) === find(R * C - 1)) return d;   // corners connected: d is the biggest step on the best route
  }
  return 0;
}`,
          java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int minimumEffortPath(int[][] heights) {
        int R = heights.length, C = heights[0].length;
        if (R * C == 1) return 0;
        List<int[]> edges = new ArrayList<>();               // {height difference, cell, neighbouring cell}
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (r + 1 < R) edges.add(new int[]{Math.abs(heights[r][c] - heights[r + 1][c]), r * C + c, (r + 1) * C + c});
                if (c + 1 < C) edges.add(new int[]{Math.abs(heights[r][c] - heights[r][c + 1]), r * C + c, r * C + c + 1});
            }
        }
        edges.sort((x, y) -> x[0] - y[0]);
        parent = new int[R * C];
        for (int i = 0; i < parent.length; i++) parent[i] = i;
        for (int[] e : edges) {                              // lightest first
            parent[find(e[1])] = find(e[2]);
            if (find(0) == find(R * C - 1)) return e[0];     // corners connected: e[0] is the biggest step on the best route
        }
        return 0;
    }
}`,
          cpp: `class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
public:
    int minimumEffortPath(vector<vector<int>>& heights) {
        int R = heights.size(), C = heights[0].size();
        if (R * C == 1) return 0;
        vector<array<int, 3>> edges;                         // {height difference, cell, neighbouring cell}
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (r + 1 < R) edges.push_back({abs(heights[r][c] - heights[r + 1][c]), r * C + c, (r + 1) * C + c});
                if (c + 1 < C) edges.push_back({abs(heights[r][c] - heights[r][c + 1]), r * C + c, r * C + c + 1});
            }
        }
        sort(edges.begin(), edges.end());
        parent.resize(R * C);
        iota(parent.begin(), parent.end(), 0);
        for (auto& e : edges) {                              // lightest first
            parent[find(e[1])] = find(e[2]);
            if (find(0) == find(R * C - 1)) return e[0];     // corners connected: e[0] is the biggest step on the best route
        }
        return 0;
    }
};`
        } },
        tests: { fn: 'minimumEffortPath', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2, 2], [3, 8, 2], [5, 3, 5]]], out: 2 }, { args: [[[1, 2, 3], [3, 8, 4], [5, 3, 5]]], out: 1 },
          { args: [[[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]]], out: 0 },
          { args: [[[7]]], out: 0 }, { args: [[[1, 10], [10, 1]]], out: 9 }, { args: [[[1, 10, 6, 7, 9, 10, 4, 9]]], out: 9 }] } }
    ],

    mistakes: [
      '**Using Dijkstra when the question wants a spanning tree, or the other way round.** “Connect everything at least total cost” is MST. “Cheapest route from S to T” is shortest path. If the problem never mentions a source or a destination, and every node must end up linked, it is MST.',
      '**Forgetting that a spanning tree has exactly n − 1 edges, and not checking connectivity.** If Kruskal keeps fewer than n − 1 edges, the graph is disconnected and there is no spanning tree (only a forest). Return -1 or the component count, don’t return the partial total as if it were the answer.',
      '**Sorting the edges every time you re-run Kruskal.** In the critical-edge and second-best problems you rebuild the tree many times. Sort the **indices** once and reuse the order. Also keep the original index with each edge, because the answer asks for it.',
      '**Union-find without finding the roots first.** `parent[u] = v` links the *nodes*, not their groups, and silently breaks the structure. Always `find` both ends, compare the roots, and link **root to root**. An unbalanced chain is also a quiet O(n) per find: add path halving (or union by size).',
      '**Building all the edges for a dense graph, then running out of memory.** For points on a plane, n = 1000 means about 500 000 edges and a sort; the O(n²) array Prim has no edge list at all. Use it whenever the graph is complete and implicit.',
      '**Stale heap entries in Prim.** The lazy version pushes an edge for every new neighbour, so the same node can be in the heap several times. When you pop one, check whether the node is already in the tree and skip it. Forgetting this adds the same node twice and double-counts its cost.',
      '**Assuming the MST is unique.** The total weight is unique, but the edges are not when weights tie. Don’t write tests that expect one specific edge list unless the problem fixes a tie-break, and when asked which edges are **critical**, remember that equal-weight edges on a cycle are interchangeable (pseudo-critical).',
      '**Treating a directed graph as undirected.** MST (Kruskal and Prim) is defined for undirected graphs. If the edges have a direction, the right tool is a different problem (minimum-cost arborescence), which is not interview material; re-read the statement before you reach for union-find.'
    ],

    quiz: [
      { kind: 'concept', q: 'A connected, undirected graph has 9 nodes. How many edges does any spanning tree of it have?',
        choices: ['8', '9', '10', 'It depends on the edge weights'], answer: 0,
        explain: 'A tree on n nodes has exactly n − 1 edges: fewer cannot connect everything, and one more creates a cycle. The weights change *which* edges, never *how many*.' },
      { kind: 'concept', q: 'Which statement is the **cut property**?',
        choices: ['For any split of the nodes into two groups, the cheapest edge crossing the split belongs to some minimum spanning tree', 'The cheapest edge in the whole graph is the only edge every MST must contain', 'Every minimum spanning tree contains the cheapest edge leaving every single node', 'Any edge in a cycle can be removed without changing the total'], answer: 0,
        explain: 'That is the rule behind both algorithms: Kruskal applies it to the group an edge’s endpoint belongs to, and Prim to “tree versus everything else”. The other options are wrong: the cheapest edge leaving a node is safe only for that node’s cut, and it is the *heaviest* edge on a cycle that is never needed.' },
      { kind: 'pattern', q: 'Which question is best solved with a minimum spanning tree?',
        choices: ['Link every city by roads at the smallest total length, so any city can reach any other', 'Find the fewest-toll route from the airport to the hotel', 'Count how many islands are in a grid of land and water', 'Order the courses so every prerequisite comes first'], answer: 0,
        explain: 'Connect everything at least total cost is the spanning-tree signal. The toll route is a shortest path (Dijkstra), the island count is a flood fill or union-find component count, and the course order is a topological sort.' },
      { kind: 'complexity', q: 'Kruskal’s algorithm on a graph with V nodes and E edges, using union-find with path compression, takes…',
        choices: ['O(E log E) time, dominated by sorting the edges', 'O(V²) time always', 'O(E) time, because union-find is O(1) per step', 'O(V log E) time'], answer: 0,
        explain: 'Sorting E edges costs O(E log E). The E union-find operations cost almost O(1) each (inverse Ackermann), so they are lower-order. Since E ≤ V², O(E log E) is the same as O(E log V).' },
      { kind: 'complexity', q: 'You are given n = 2000 points on a plane and must connect them at least total Manhattan distance. Which approach has the best time and memory?',
        choices: ['Prim with an array: O(n²) time and O(n) memory', 'Kruskal over all pairs: O(n² log n) time and O(n²) memory', 'Dijkstra from every point: O(n³ log n)', 'Enumerate all spanning trees'], answer: 0,
        explain: 'The graph is complete (about 2 million pairs here), so building and sorting every edge is wasteful. The array form of Prim scans for the nearest outside point, so it needs no edge list at all.' },
      { kind: 'bug', q: 'This Kruskal loop returns a total that is too low and sometimes marks the graph as connected when it is not. What’s wrong?',
        code: `parent = list(range(n))
def find(x):
    while parent[x] != x:
        x = parent[x]
    return x
total = 0
for u, v, w in sorted(edges, key=lambda e: e[2]):
    if find(u) != find(v):
        parent[u] = v
        total += w`,
        choices: ['It links the nodes `u` and `v` instead of their group roots, so earlier merges are cut loose', 'It should sort in descending order', '`find` must use recursion', 'It should skip the `total += w` line'], answer: 0,
        explain: 'To merge two groups you link one **root** to the other: `parent[find(u)] = find(v)`. Setting `parent[u] = v` re-parents just the node `u`, abandoning the group `u` led (if `u` was a root) or detaching `u` from its group, so later `find` calls report the wrong groups.' },
      { kind: 'concept', q: 'A graph has edges A-B 2, B-C 2 and A-C 3. Which edge sets are the minimum spanning tree and the shortest-path tree from A?',
        choices: ['MST: A-B and B-C. Shortest paths from A: A-B and A-C', 'Both are A-B and B-C', 'MST: A-B and A-C. Shortest paths from A: A-B and B-C', 'Both are A-B and A-C'], answer: 0,
        explain: 'The MST minimises the **total**: A-B + B-C is 4, whereas A-B + A-C is 5. The shortest route from A to C is the direct 3, not 2 + 2 = 4, so the shortest-path tree uses A-C. Different goals, different trees.' },
      { kind: 'concept', q: 'Kruskal’s algorithm finishes on a graph of 10 nodes having kept 6 edges. What does that tell you?',
        choices: ['The graph has 4 connected components, and the kept edges form a spanning forest', 'The graph is connected', 'The graph has 6 connected components', 'There must be a negative cycle'], answer: 0,
        explain: 'Each kept edge merges two groups, so components = n − kept = 10 − 6 = 4. A spanning tree would need 9 edges. This is also how the “count components” and “how many extra cables” questions are answered.' },
      { kind: 'concept', q: 'Which of these are true? Pick every one that applies.',
        choices: ['If all edge weights are distinct, the MST is unique', 'MST algorithms still work when some edge weights are negative', 'The MST always contains the shortest path between any two nodes', 'The heaviest edge on any cycle is never needed in some MST'], answer: [0, 1, 3],
        explain: 'Distinct weights remove ties, so the MST is unique. Kruskal and Prim only compare weights, so negatives are fine (Dijkstra is the one that breaks). The cycle property says the heaviest edge of a cycle can be dropped. But the MST does *not* contain shortest paths: the A-C example above shows it.' }
    ],

    flashcards: [
      { id: 'tree-edges', front: 'A connected graph has n nodes. How many edges does a spanning tree have, and what if you keep fewer?', back: 'Exactly **n − 1**. Fewer edges leaves the graph disconnected (a forest with `n − edges` components); more creates a cycle.' },
      { id: 'cut-property', front: 'State the cut property.', back: 'For any split of the nodes into two non-empty groups, the **cheapest edge crossing the split** belongs to some MST. It is why both Kruskal and Prim are correct.' },
      { id: 'cycle-property', front: 'State the cycle property.', back: 'The **heaviest edge on any cycle** is not needed: some MST leaves it out. Kruskal’s skip step applies it: an edge whose ends are already connected closes a cycle of cheaper edges.' },
      { id: 'kruskal-steps', front: 'Kruskal in three lines.', back: 'Sort edges by weight. For each edge, if `find(u) != find(v)`, take it and union the groups; else skip it. Stop after n − 1 edges. O(E log E).' },
      { id: 'prim-steps', front: 'Prim in three lines.', back: 'Start at any node. Keep a min-heap of edges leaving the tree. Pop the cheapest; skip it if its far end is already in the tree, else take it and push that node’s edges. O(E log V).' },
      { id: 'kruskal-vs-prim', front: 'When do you choose Kruskal and when Prim?', back: 'Kruskal when you have a plain **edge list** (or the graph is sparse). Prim when the graph is **dense** or implicit (points on a plane): the array version is O(V²) with no edge list.' },
      { id: 'mst-vs-sp', front: 'MST versus a shortest-path tree: what is the difference?', back: 'MST minimises the **total weight** that connects everything. A shortest-path tree minimises each node’s **distance from one source**. Prim and Dijkstra differ in one line: the heap key is the edge weight versus the path distance.' },
      { id: 'forest-components', front: 'Kruskal ends having kept k edges on n nodes. How many components?', back: '**n − k**. One component means a spanning tree; more means a spanning forest. Minimum extra links to join the graph: n − k − 1.' },
      { id: 'dense-prim', front: 'n points on a plane, connect at least total cost: which algorithm and why?', back: 'Array Prim: **O(n²)** time, **O(n)** memory. Kruskal would build and sort n² / 2 edges (O(n² log n) time, O(n²) memory).' },
      { id: 'critical-edge', front: 'How do you decide whether an edge is critical or pseudo-critical?', back: '**Critical**: the MST total rises (or disconnects) when you ban it. **Pseudo-critical** (and not critical): forcing it in first still gives the base total. Neither: it is the heaviest edge on some cycle.' },
      { id: 'bottleneck', front: 'Minimise the largest edge on a path from S to T. What is the trick?', back: 'Run Kruskal until S and T are in the same group: the edge that joined them is the answer. The best bottleneck path always lies on the MST.' },
      { id: 'mst-unique', front: 'Is the MST unique?', back: 'Its **total weight** is. The edge set is unique only if all weights are distinct; ties allow several equal-cost trees, so don’t depend on which one you got.' }
    ],

    deeper: [
      { title: 'Minimum Spanning Tree: Kruskal’s algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/graph/mst_kruskal.html', time: 'about 15 min', note: 'A careful write-up of Kruskal with union-find, plus a proof of correctness and the Manhattan-distance and “second best MST” extensions.' },
      { title: 'Minimum Spanning Tree: Prim’s algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/graph/mst_prim.html', time: 'about 10 min', note: 'The dense O(V²) array form and the heap form side by side, so you can see why the array form wins on complete graphs.' },
      { title: 'Minimum Spanning Trees (Algorithms, 4th edition, Princeton)', url: 'https://algs4.cs.princeton.edu/43mst/', time: 'about 30 min', note: 'The textbook treatment of the cut and cycle properties, with eager and lazy Prim and the complexity table.' },
      { title: 'Minimum Spanning Tree (VisuAlgo)', url: 'https://visualgo.net/en/mst', time: 'about 15 min', note: 'An animated Kruskal and Prim on a graph you can edit: a good second visualizer once the one on this page feels easy.' },
      { title: 'NeetCode roadmap: Advanced Graphs', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where Min Cost to Connect All Points sits in the NeetCode 150, with the order they suggest. Some course pages may ask you to sign in.' }
    ],

    detective: [
      { id: 'island-bridges', decoys: ['shortest-paths', 'union-find', 'graphs'],
        statement: 'A regional council wants all eleven villages in a river valley joined by road, so that someone in any village can reach any other, even if the trip goes through several stops. Surveyors have priced every stretch of road that could be built between two villages, and traffic can use a stretch in either direction. The council cannot afford to build them all. It must pick which stretches to build so the bill is as low as possible, while leaving no village cut off from the others. What does the council have to compute?',
        why: 'Every village must end up connected, the roads are two-way, each has a price, and the goal is the lowest **total** bill. Nobody asked about the best route between two particular villages, so it is not a shortest-path question. Taking the cheapest stretch that joins two not-yet-connected clusters of villages, over and over, is a minimum spanning tree, and “are these two villages already linked?” is the union-find check.' },
      { id: 'withdrawn-quote', decoys: ['union-find', 'shortest-paths', 'advanced-graphs'],
        statement: 'A firm has quotes for cabling between the floors of its new tower, and it already knows the cheapest way to wire every floor together. The contractor warns that any single quote might be withdrawn at the last minute. The facilities manager wants a short list: the quotes the plan simply cannot do without, because without them either some floor is cut off or the whole price goes up; and a second list of quotes that appear in some cheapest plan but could be swapped for an equally priced alternative. How would you work out both lists?',
        why: 'The base plan is a cheapest way to link every floor, a minimum spanning tree. “Cut off or the price goes up when it is removed” is the critical-edge test (ban the edge and rebuild), and “can appear in a cheapest plan, but is replaceable” is the pseudo-critical test (force it in and see if the total holds). Recomputing with one quote banned or forced is Kruskal rerun with a skip or force edge. Plain connectivity (union-find alone) can’t tell you about prices.' },
      { id: 'sensor-groups', decoys: ['union-find', 'sorting', 'greedy'],
        statement: 'A researcher has forty sensors in a field, and she knows the distance between every pair. She wants to split them into exactly five groups. Once split, she will look at every pair of sensors that sit in different groups and note the closest such pair. She wants that closest cross-group distance to be as large as possible. Sensors in the same group may be far apart; what matters is that the groups are well separated from each other. How should she form the groups?',
        why: 'Keep merging the two closest sensors that sit in different groups, in order of distance, and stop when five groups remain. That is Kruskal’s algorithm halted early: the greedy order of edges with union-find on the groups, and the distance of the next edge it would have taken is the best achievable cross-group gap (it is the (k − 1)-th largest MST edge). Sorting and union-find are involved, but the cut property is what proves the grouping is optimal.' }
    ]
  });
})();
