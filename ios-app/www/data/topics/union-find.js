/* Offer Ready: Union-Find (disjoint set union). Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it is written in.
   Exceptions: the DSU design-class template is checked in py and js only (the Java and C++ versions were
   compiled and run by hand), and Accounts Merge has no Java/C++ signature type, so those two were run by hand. */
(function () {
  var OR = (window.OR = window.OR || {});

  (OR.topics = OR.topics || []).push({
    id: 'union-find',

    hook: 'Whenever a question says “are these two things connected?” while connections keep arriving, a graph search is the wrong tool: it re-walks the whole graph for every question. Union-find answers each question in effectively constant time and counts the groups for free. It shows up as redundant-edge, provinces, accounts-merge and equation-consistency questions, it is the engine inside Kruskal’s minimum spanning tree, and it is a short, memorable piece of code that interviewers like because the optimizations are easy to explain and easy to get subtly wrong.',

    cues: [
      'Items keep being **merged into groups**, and you are asked whether two items are in the same group, or how many groups there are.',
      'Edges **arrive one at a time** and you must report the first one that closes a **cycle** in an undirected graph (a “redundant connection”).',
      'You must check whether a graph is **one connected piece with no loop** (a valid tree), or count its **connected components**.',
      'Items are linked by a shared property (the same email, the same row or column, an equal-to claim) and you must **group by that link**, including indirect links: A shares with B, B shares with C.',
      'A graph is built from **“equal” and “not equal” facts**, and you must say whether they can all hold together.',
      'You are building a **minimum spanning tree** (Kruskal) and need “do these two endpoints already belong to the same piece?” for every edge, in sorted order.',
      'The trap: if the question needs a **path**, a shortest distance, a direction, or **deleting** an edge, union-find cannot help. It only ever merges. Use BFS/DFS for paths and distances, and see [graphs](#/topic/graphs).'
    ],

    intuition: [
      'Think of a school that sorts students into clubs. Each club has exactly one **captain**. To ask “are Ana and Ben in the same club?” you do not compare their member lists. You ask each of them “who is your captain?” and compare the two answers. To merge two clubs, one captain simply says “I now report to you”. That is the whole structure: a **forest** where every node points at a parent, and the root of each tree is that group’s captain.',
      'The two operations are **find(x)**, which follows parent pointers up to the root, and **union(a, b)**, which finds both roots and, if they differ, hangs one root under the other. Stored as an array, `parent[i]` is the parent of node i, and a node whose parent is itself is a root. Everything starts as n separate one-node trees.',
      'Done naively, a tree can grow into a long chain (always hanging the older root under the newer one), and then find walks O(n) pointers. Two small fixes make it nearly free:',
      '1. **Path compression.** While climbing to the root, re-point every node you passed straight at the root. The next find from any of them is a single hop. The tree flattens as a side effect of being used.\n2. **Union by size (or rank).** When merging, hang the **smaller** tree under the larger one. A node’s depth only grows when its tree is the smaller one, which doubles the size of the tree it lands in, so depth can double at most log₂ n times.',
      'Use both and the cost per operation is O(α(n)), where α is the inverse Ackermann function: it never exceeds 4 for any input that fits in the universe. Treat it as constant. Use only one and you still get O(log n), which is already fine for interviews. The visualizer lets you switch each optimization off and watch the tallest tree grow.',
      'One more idea carries half the problems: **a union that finds both ends already in the same group is information**. In an undirected graph it means the edge you are adding closes a cycle. Count the successful unions and you also know the number of components: it starts at n and drops by one per successful union.'
    ].join('\n\n'),

    viz: 'union-find',

    template: {
      title: 'DSU: find with compression, union by size, component count',
      note: 'The skeleton for every problem here. **find** climbs to the root, then walks the same path again and points every node at the root (**compression**). **union** finds both roots; if they match, the two items were already connected (this is the cycle signal) and it returns false; otherwise the **smaller** tree is hung under the larger (**union by size**) and `count` drops by one. `find` is written with loops rather than recursion so a chain of 100,000 nodes cannot overflow the stack. Nodes are 0 to n−1; for 1-indexed input allocate n + 1.',
      code: {
        py: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))                 #> Every node starts as its own root
        self.size = [1] * n                          #> Size of the tree under each root
        self.count = n                               #> Number of components

    def find(self, x):
        root = x
        while self.parent[root] != root:             #@climb > 1. Climb to the root
            root = self.parent[root]
        while self.parent[x] != root:                #@compress > 2. Compress: point every node on the path at the root
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)          #@find > Find both roots
        if ra == rb:                                 #@same > Same root: already connected (an edge here closes a cycle)
            return False
        if self.size[ra] < self.size[rb]:            #@link > 3. Union by size: the smaller tree goes under the larger
            ra, rb = rb, ra
        self.parent[rb] = ra                         #@merge > 4. Link the roots and update the bookkeeping
        self.size[ra] += self.size[rb]               #@merge
        self.count -= 1                              #@merge
        return True`,
        js: `class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);   //> Every node starts as its own root
    this.size = new Array(n).fill(1);                       //> Size of the tree under each root
    this.count = n;                                         //> Number of components
  }

  find(x) {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];   //@climb > 1. Climb to the root
    while (this.parent[x] !== root) {                              //@compress > 2. Compress: point every node on the path at the root
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  union(a, b) {
    let ra = this.find(a), rb = this.find(b);        //@find > Find both roots
    if (ra === rb) return false;                     //@same > Same root: already connected (an edge here closes a cycle)
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];   //@link > 3. Union by size: the smaller tree goes under the larger
    this.parent[rb] = ra;                            //@merge > 4. Link the roots and update the bookkeeping
    this.size[ra] += this.size[rb];                  //@merge
    this.count--;                                    //@merge
    return true;
  }
}`,
        java: `class DSU {
    int[] parent, size;
    int count;

    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;                                       //> Number of components
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }   //> Every node is its own root, tree size 1
    }

    int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];   //@climb > 1. Climb to the root
        while (parent[x] != root) {                         //@compress > 2. Compress: point every node on the path at the root
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);                     //@find > Find both roots
        if (ra == rb) return false;                         //@same > Same root: already connected (an edge here closes a cycle)
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }   //@link > 3. Union by size: the smaller tree goes under the larger
        parent[rb] = ra;                                    //@merge > 4. Link the roots and update the bookkeeping
        size[ra] += size[rb];                               //@merge
        count--;                                            //@merge
        return true;
    }
}`,
        cpp: `class DSU {
public:
    vector<int> parent, size;
    int count;

    DSU(int n) : parent(n), size(n, 1), count(n) {           //> Size of each tree starts at 1; count = components
        iota(parent.begin(), parent.end(), 0);               //> Every node starts as its own root
    }

    int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];    //@climb > 1. Climb to the root
        while (parent[x] != root) {                          //@compress > 2. Compress: point every node on the path at the root
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    }

    bool unite(int a, int b) {                               // "union" is a C++ keyword
        int ra = find(a), rb = find(b);                      //@find > Find both roots
        if (ra == rb) return false;                          //@same > Same root: already connected (an edge here closes a cycle)
        if (size[ra] < size[rb]) swap(ra, rb);               //@link > 3. Union by size: the smaller tree goes under the larger
        parent[rb] = ra;                                     //@merge > 4. Link the roots and update the bookkeeping
        size[ra] += size[rb];                                //@merge
        count--;                                             //@merge
        return true;
    }
};`
      },
      tests: { design: true, fn: 'DSU', cases: [
        { ops: ['DSU', 'union', 'union', 'union', 'union', 'find', 'find', 'union', 'union', 'find'], args: [[6], [0, 1], [2, 3], [1, 3], [0, 2], [3], [4], [4, 5], [5, 0], [5]], out: [null, true, true, true, false, 0, 4, true, true, 0] },
        { ops: ['DSU', 'union', 'union', 'find', 'find', 'union', 'find'], args: [[3], [0, 1], [1, 2], [2], [0], [2, 0], [1]], out: [null, true, true, 0, 0, false, 0] }] }
    },

    complexity: {
      time: 'O(α(n)) amortized per operation, effectively O(1); O(n + m·α(n)) for m operations',
      space: 'O(n)',
      why: 'Union by size alone keeps every tree at depth O(log n), because a node only goes one level deeper when its tree is the smaller of two merged trees, which at least doubles the size of its tree. So a find is O(log n) even without compression. Path compression alone gives O(log n) amortized. Together the amortized cost per operation is O(α(n)), where α, the inverse Ackermann function, is at most 4 for every n you will ever meet. The arrays take O(n) space.',
      trap: 'Say “near-constant, α(n)”, not “O(1)”, and know why both pieces matter. A recursive find with compression can overflow the stack on a 10⁵-node chain in Python and Java, which is why the template loops. Also remember compression changes the parent array but never the set of groups, so if you need depth or the original structure you cannot read it back. And size or rank is only accurate for **roots**: never read `size[x]` for a non-root.'
    },

    variations: [
      {
        name: 'Size vs rank, loop vs recursion, halving',
        body: '**Union by rank** keeps a number that is an upper bound on a tree’s height and attaches the lower rank under the higher (bump the rank only on a tie). **Union by size** attaches the smaller node count under the larger and has a bonus: `size[root]` is also the size of that component, which many problems ask for. Both give the same bound; size is usually the better default. For `find`, you have three shapes: **two-pass compression** (the template), **path halving** (`parent[x] = parent[parent[x]]; x = parent[x]` in one loop, which is shorter and nearly as good) and **recursive** `parent[x] = find(parent[x])`, the shortest of all but at risk of stack overflow on deep chains. In an interview, path halving without any union rule is acceptable and takes four lines; mention that adding union by size makes it α(n).'
      },
      {
        name: 'Kruskal’s minimum spanning tree',
        body: 'Sort the edges by weight and consider them cheapest first. Take an edge if its endpoints are in **different** components (`union` returns true), skip it otherwise: taking it would close a cycle, and a spanning tree has none. Stop after n − 1 edges. If fewer were taken, the graph is not connected. The sort dominates, so it is O(m log m); the DSU part is almost free. This is also the proof that DSU’s “same root?” answer is exactly the “would this edge make a cycle?” test. Prim’s algorithm gets the same tree with a heap; see [minimum spanning tree](#/topic/mst).',
        code: {
          py: `def kruskal(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]     # path halving
            x = parent[x]
        return x
    total = used = 0
    for u, v, w in sorted(edges, key=lambda e: e[2]):   # cheapest edge first
        ru, rv = find(u), find(v)
        if ru != rv:                          # different components: safe to take
            parent[ru] = rv
            total += w
            used += 1
    return total if used == n - 1 else -1     # -1: the graph is not connected`,
          js: `function kruskal(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];     // path halving
      x = parent[x];
    }
    return x;
  };
  let total = 0, used = 0;
  for (const [u, v, w] of [...edges].sort((a, b) => a[2] - b[2])) {   // cheapest edge first
    const ru = find(u), rv = find(v);
    if (ru !== rv) {                     // different components: safe to take
      parent[ru] = rv;
      total += w;
      used++;
    }
  }
  return used === n - 1 ? total : -1;    // -1: the graph is not connected
}`,
          java: `class Solution {
    int[] parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    }
    int kruskal(int n, int[][] edges) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, (p, q) -> Integer.compare(p[2], q[2]));   // cheapest edge first
        int total = 0, used = 0;
        for (int[] e : sorted) {
            int ru = find(e[0]), rv = find(e[1]);
            if (ru != rv) {                  // different components: safe to take
                parent[ru] = rv;
                total += e[2];
                used++;
            }
        }
        return used == n - 1 ? total : -1;   // -1: the graph is not connected
    }
}`,
          cpp: `class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    }
public:
    int kruskal(int n, vector<vector<int>> edges) {
        parent.resize(n);
        iota(parent.begin(), parent.end(), 0);
        sort(edges.begin(), edges.end(), [](auto& p, auto& q) { return p[2] < q[2]; });   // cheapest edge first
        int total = 0, used = 0;
        for (auto& e : edges) {
            int ru = find(e[0]), rv = find(e[1]);
            if (ru != rv) {                  // different components: safe to take
                parent[ru] = rv;
                total += e[2];
                used++;
            }
        }
        return used == n - 1 ? total : -1;   // -1: the graph is not connected
    }
};`
        },
        tests: { fn: 'kruskal', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [4, [[0, 1, 1], [1, 2, 2], [0, 2, 3], [2, 3, 4]]], out: 7 }, { args: [3, [[0, 1, 5]]], out: -1 }, { args: [1, []], out: 0 },
          { args: [5, [[0, 1, 2], [1, 2, 3], [2, 3, 1], [3, 4, 9], [0, 4, 4], [1, 3, 6]]], out: 10 }, { args: [2, [[0, 1, 7], [0, 1, 3]]], out: 3 }] }
      },
      {
        name: 'Weighted DSU: store a relation to the root',
        body: 'Sometimes a group is not just “same or different” but “how far apart”: a ratio (`a / b = 2`), a difference, or a parity (are these two on the same side?). Store, per node, a value **relative to its parent**, and keep it correct as the parent changes. During compression, multiply (or add) the values along the path so each node ends up holding its value relative to the **root**. Union of `a / b = k` hangs root `ra` under `rb` with `w[ra] = k · w[b] / w[a]`. A query on two nodes with the same root is `w[a] / w[b]`; with different roots the answer is unknown. The same idea with `xor` gives bipartite checks and “opposite side” problems. Mind that the weights must be updated **before** the parent pointer is changed.',
        code: {
          py: `def ratios(n, facts, queries):
    parent = list(range(n))
    w = [1.0] * n                          # w[x] = value[x] / value[parent[x]]
    def find(x):
        if parent[x] != x:
            p = parent[x]
            parent[x] = find(p)            # p now points at the root, w[p] is p / root
            w[x] *= w[p]                   # x / root = (x / p) * (p / root)
        return parent[x]
    for a, b, k in facts:                  # a / b = k
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            w[ra] = k * w[b] / w[a]        # ra / rb
    out = []
    for a, b in queries:
        out.append(w[a] / w[b] if find(a) == find(b) else -1)
    return out`,
          js: `function ratios(n, facts, queries) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const w = new Array(n).fill(1);          // w[x] = value[x] / value[parent[x]]
  const find = (x) => {
    if (parent[x] !== x) {
      const p = parent[x];
      parent[x] = find(p);                 // p now points at the root, w[p] is p / root
      w[x] *= w[p];                        // x / root = (x / p) * (p / root)
    }
    return parent[x];
  };
  for (const [a, b, k] of facts) {         // a / b = k
    const ra = find(a), rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
      w[ra] = k * w[b] / w[a];             // ra / rb
    }
  }
  return queries.map(([a, b]) => (find(a) === find(b) ? w[a] / w[b] : -1));
}`
        },
        tests: { fn: 'ratios', compare: 'float', cases: [
          { args: [3, [[0, 1, 2], [1, 2, 3]], [[0, 2], [2, 0], [0, 0], [0, 1]]], out: [6, 0.16666666666666666, 1, 2] },
          { args: [4, [[0, 1, 2]], [[0, 3], [1, 0]]], out: [-1, 0.5] },
          { args: [4, [[0, 1, 2], [2, 3, 5], [1, 2, 4]], [[0, 3], [3, 1]]], out: [40, 0.05] }] }
      },
      {
        name: 'Offline queries and “earliest time” questions',
        body: 'DSU can only merge, so any question that involves **time** is solved by arranging events so that merging is all that happens. “At what moment does everyone become connected?”: sort the friendships by time and union them until `count == 1`. “Who is connected when only roads cheaper than w are open?” (queries with limits): sort queries and edges by the limit together and union edges up to each query’s limit before answering it. And when a problem **deletes** edges, run time backwards: start from the final graph, add the deleted edges in reverse, and record the answers in reverse. This offline trick is the standard way around “DSU cannot split”.'
      },
      {
        name: 'Grids, strings and hashed keys',
        body: 'DSU works on anything you can number. For a grid, flatten a cell to `r * cols + c` and union with the right and down neighbours (a number-of-islands answer is the final `count` minus the water cells). For letters, the 26 lowercase letters are nodes 0 to 25. For emails, names or any string keys, either map each distinct key to an index first (a hash map), or give each **record** an index and union two records when they share a key, which is how Accounts Merge is solved. Adding a **component size** array also answers “how big is the largest group?” with a running maximum.'
      },
      {
        name: 'When not to use DSU',
        body: 'It tells you whether two nodes are connected, never **how**. If you need the path, the shortest distance, the order of visits or a topological order, use BFS, DFS or Dijkstra. It cannot handle **directed** connectivity (A reaches B does not mean B reaches A), where you want strongly connected components instead. And a graph that is given **once** and never changes is often simpler with a single DFS to label components; DSU pays off when edges arrive over time or when the grouping rule is the problem.'
      }
    ],

    worked: [
      {
        lc: 684,
        restate: 'A tree with n nodes (numbered 1 to n) had one extra edge added, so the result has exactly one cycle. You get the n edges in the order they were added. Return the edge that can be removed to make it a tree again; if several work, return the one that appears **last** in the input.',
        examples: '- `[[1,2],[1,3],[2,3]]` → `[2,3]`: 1-2 and 1-3 connect all three nodes, so 2-3 is the extra one.\n- `[[1,2],[2,3],[3,4],[1,4],[1,5]]` → `[1,4]`: 1-2-3-4 is already one chain when 1-4 arrives.\n- Edge cases: the cycle can run through the first edges; the extra edge is never a bridge, so removing it keeps every node connected.',
        brute: 'For each edge from the last backwards, remove it and run a DFS to see whether the rest is connected and acyclic. That is O(n) per edge and O(n²) overall, fine for the limits but it is the “re-walk everything” pattern that the cues warn about.',
        insight: 'Add the edges **one at a time** to a union-find. An edge whose two ends already share a root would connect two nodes that are already connected, which is exactly what closes a cycle. Because there is only one cycle in the whole input, the first edge that fails to merge is the one the answer needs, and it is also the last edge of that cycle in input order. Return it immediately.',
        code: {
          py: `class Solution:
    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:
        parent = list(range(len(edges) + 1))      # nodes are 1..n
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]     # path halving
                x = parent[x]
            return x
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:                          # already connected: this edge closes the cycle
                return [a, b]
            parent[ra] = rb
        return []`,
          js: `function findRedundantConnection(edges) {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);   // nodes are 1..n
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];          // path halving
      x = parent[x];
    }
    return x;
  };
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return [a, b];             // already connected: this edge closes the cycle
    parent[ra] = rb;
  }
  return [];
}`,
          java: `class Solution {
    int[] parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    }
    public int[] findRedundantConnection(int[][] edges) {
        parent = new int[edges.length + 1];                       // nodes are 1..n
        for (int i = 0; i < parent.length; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return e;                               // already connected: this edge closes the cycle
            parent[ra] = rb;
        }
        return new int[0];
    }
}`,
          cpp: `class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    }
public:
    vector<int> findRedundantConnection(vector<vector<int>>& edges) {
        parent.resize(edges.size() + 1);                          // nodes are 1..n
        iota(parent.begin(), parent.end(), 0);
        for (auto& e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return e;                               // already connected: this edge closes the cycle
            parent[ra] = rb;
        }
        return {};
    }
};`
        },
        complexity: 'O(n · α(n)) time, one find pair per edge; O(n) space. Path halving alone makes it O(n log n) in the worst case, which is still fast.',
        say: '“I add the edges in order to a union-find. For each edge I find both roots. If they are equal, the two nodes were already connected, so this edge closes a cycle, and since the graph has exactly one extra edge, it is the answer. Otherwise I merge the two trees. That is one near-constant find pair per edge, so O(n α(n)) total.”',
        followups: [
          { q: 'What if the graph were directed (the “rooted tree plus one edge” variant)?', a: 'Union-find on its own is not enough, because a node can end up with two parents, which an undirected cycle check misses. First find a node with two incoming edges and treat both as candidates; then use union-find to check whether a cycle remains after dropping one of them.' },
          { q: 'Why path halving instead of full compression, and no union by size?', a: 'Halving is one loop and already keeps the cost at O(log n) amortized, which is plenty here. Adding union by size would bring it to O(α(n)); mention it, and add it if asked.' }
        ]
      },

      {
        lc: 547,
        restate: 'There are n cities. You get an n × n matrix where `isConnected[i][j]` is 1 if cities i and j are directly linked, and 0 if not (a city is linked to itself). Linked groups of cities, directly or through others, are called provinces. Return how many provinces there are.',
        examples: '- `[[1,1,0],[1,1,0],[0,0,1]]` → `2`: cities 0 and 1 are a province, city 2 is alone.\n- `[[1,0,0],[0,1,0],[0,0,1]]` → `3`.\n- Edge cases: a single city; every city linked to every other (`1`); a chain where 0 links to 1 and 1 to 2, but 0 does not link to 2 directly (still one province, because links are transitive).',
        brute: 'DFS or BFS from every unvisited city, marking everything reachable, counting how many searches you start. It is correct and O(n²) for the matrix, the same as the best you can do since you must read the matrix. Union-find is an equally good, and often shorter, answer.',
        insight: 'Start with `count = n` provinces, one per city. Go over the pairs above the diagonal; whenever `isConnected[i][j]` is 1 and the two cities have **different** roots, merge them and subtract one from the count. The answer is what is left. Merging is the only thing that can reduce the number of groups, and each successful merge reduces it by exactly one.',
        code: {
          py: `class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        count = n                                  # start with n separate provinces
        for i in range(n):
            for j in range(i + 1, n):              # the matrix is symmetric: only look above the diagonal
                if isConnected[i][j]:
                    ri, rj = find(i), find(j)
                    if ri != rj:
                        parent[ri] = rj
                        count -= 1                 # two provinces became one
        return count`,
          js: `function findCircleNum(isConnected) {
  const n = isConnected.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  let count = n;                                   // start with n separate provinces
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {              // the matrix is symmetric: only look above the diagonal
      if (isConnected[i][j]) {
        const ri = find(i), rj = find(j);
        if (ri !== rj) {
          parent[ri] = rj;
          count--;                                 // two provinces became one
        }
      }
    }
  }
  return count;
}`,
          java: `class Solution {
    int[] parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int count = n;                                 // start with n separate provinces
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {          // the matrix is symmetric: only look above the diagonal
                if (isConnected[i][j] == 1) {
                    int ri = find(i), rj = find(j);
                    if (ri != rj) {
                        parent[ri] = rj;
                        count--;                       // two provinces became one
                    }
                }
            }
        }
        return count;
    }
}`,
          cpp: `class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
public:
    int findCircleNum(vector<vector<int>>& isConnected) {
        int n = isConnected.size();
        parent.resize(n);
        iota(parent.begin(), parent.end(), 0);
        int count = n;                                 // start with n separate provinces
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {          // the matrix is symmetric: only look above the diagonal
                if (isConnected[i][j]) {
                    int ri = find(i), rj = find(j);
                    if (ri != rj) {
                        parent[ri] = rj;
                        count--;                       // two provinces became one
                    }
                }
            }
        }
        return count;
    }
};`
        },
        complexity: 'O(n² · α(n)) time: the matrix has n² cells, and each 1 costs two near-constant finds. O(n) extra space.',
        say: '“Each city starts as its own group, so the count starts at n. I scan the pairs above the diagonal and, for every link between two cities in different groups, I union them and decrement the count. Every successful union merges exactly two groups, so what is left is the number of provinces. It is O(n²) for reading the matrix, and DFS would be the same, but union-find needs no recursion and no visited array.”',
        followups: [
          { q: 'The links arrive as a stream of pairs instead of a matrix. What changes?', a: 'Nothing about the algorithm: call union on each pair as it arrives and read `count` whenever asked. That is the situation union-find is built for, and a DFS would have to start over after every new pair.' },
          { q: 'How would you report the size of the biggest province?', a: 'Keep a `size` array on the roots, as in the template, and track the maximum after each successful merge.' }
        ]
      },

      {
        lc: 721,
        restate: 'Each account is a list: the owner’s name first, then one or more email addresses. Two accounts belong to the same person if they share **any** email (names alone prove nothing, since different people can share a name). Merge accounts of the same person into one list: the name first, then all their distinct emails in sorted order. The merged accounts may be returned in any order.',
        examples: '- `[["John","a@x","b@x"],["John","a@x","c@x"],["Mary","m@x"],["John","j@x"]]` → `[["John","a@x","b@x","c@x"],["Mary","m@x"],["John","j@x"]]`. The first two Johns share `a@x`. The last John shares nothing.\n- Chains count: A shares with B and B shares with C, so A, B and C merge even though A and C share nothing.\n- Edge cases: the same email repeated inside one account; two different people with the same name and no shared email.',
        brute: 'Compare every pair of accounts for a shared email, merge, and repeat until nothing changes. That is O(n²) set intersections per pass and several passes, and getting the transitive merges right is the fiddly part.',
        insight: 'The things being grouped are **accounts**, so give each account an index and make each account a DSU node. Walk the emails with a hash map `email → first account that had it`. If an email was seen before, **union** the current account with that one: the shared email is the link. After this pass, accounts with the same root are the same person. Collect each email under its owner’s root, sort each group, and put the name in front. The name of any account in the group works, since they all agree.',
        code: {
          py: `class Solution:
    def accountsMerge(self, accounts: List[List[str]]) -> List[List[str]]:
        parent = list(range(len(accounts)))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        owner = {}                                  # email -> first account index that listed it
        for i, acc in enumerate(accounts):
            for email in acc[1:]:
                if email in owner:
                    parent[find(i)] = find(owner[email])   # shared email: same person
                else:
                    owner[email] = i
        groups = defaultdict(list)
        for email, i in owner.items():
            groups[find(i)].append(email)
        return [[accounts[r][0]] + sorted(emails) for r, emails in groups.items()]`,
          js: `function accountsMerge(accounts) {
  const parent = Array.from({ length: accounts.length }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const owner = new Map();                          // email -> first account index that listed it
  accounts.forEach((acc, i) => {
    for (const email of acc.slice(1)) {
      if (owner.has(email)) parent[find(i)] = find(owner.get(email));   // shared email: same person
      else owner.set(email, i);
    }
  });
  const groups = new Map();
  for (const [email, i] of owner) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(email);
  }
  return [...groups].map(([r, emails]) => [accounts[r][0], ...emails.sort()]);
}`,
          java: `class Solution {
    int[] parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public List<List<String>> accountsMerge(List<List<String>> accounts) {
        int n = accounts.size();
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        Map<String, Integer> owner = new HashMap<>();           // email -> first account index that listed it
        for (int i = 0; i < n; i++) {
            List<String> acc = accounts.get(i);
            for (int j = 1; j < acc.size(); j++) {
                String email = acc.get(j);
                if (owner.containsKey(email)) parent[find(i)] = find(owner.get(email));   // shared email: same person
                else owner.put(email, i);
            }
        }
        Map<Integer, TreeSet<String>> groups = new HashMap<>();
        for (Map.Entry<String, Integer> en : owner.entrySet())
            groups.computeIfAbsent(find(en.getValue()), k -> new TreeSet<>()).add(en.getKey());
        List<List<String>> res = new ArrayList<>();
        for (Map.Entry<Integer, TreeSet<String>> g : groups.entrySet()) {
            List<String> row = new ArrayList<>();
            row.add(accounts.get(g.getKey()).get(0));
            row.addAll(g.getValue());                           // a TreeSet is already sorted
            res.add(row);
        }
        return res;
    }
}`,
          cpp: `class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
public:
    vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {
        int n = accounts.size();
        parent.resize(n);
        iota(parent.begin(), parent.end(), 0);
        unordered_map<string, int> owner;                       // email -> first account index that listed it
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < (int)accounts[i].size(); j++) {
                auto it = owner.find(accounts[i][j]);
                if (it != owner.end()) parent[find(i)] = find(it->second);   // shared email: same person
                else owner[accounts[i][j]] = i;
            }
        }
        map<int, set<string>> groups;
        for (auto& [email, i] : owner) groups[find(i)].insert(email);
        vector<vector<string>> res;
        for (auto& [r, emails] : groups) {
            vector<string> row{accounts[r][0]};
            row.insert(row.end(), emails.begin(), emails.end()); // a set is already sorted
            res.push_back(row);
        }
        return res;
    }
};`
        },
        complexity: 'O(E · α(n) + E log E) time for E total emails: one near-constant union per email, then sorting the emails. O(E) space for the map and the groups.',
        say: '“The people to group are the accounts, so I make each account a node. I keep a map from email to the first account that listed it. When I see an email again, I union the current account with that one, since a shared email means the same person. After that, accounts with the same root are one person. I collect every email under its root, sort it, and prefix the name. Union-find handles the chains, like A shares with B and B shares with C, without any repeated passes.”',
        followups: [
          { q: 'Why not use the email itself as the DSU node?', a: 'You can, by mapping each email to an index, but then you must also remember the name of each group. Using accounts as nodes is smaller (fewer nodes) and the owner’s name sits right there at the root.' },
          { q: 'Could a DFS do it?', a: 'Yes: build a graph linking each account to each email and search it. It is the same complexity and needs an adjacency structure; union-find needs only the one hash map.' }
        ]
      },

      {
        lc: 990,
        restate: 'You get claims about lowercase letters, each written as four characters: `x==y` (the two letters name the same number) or `x!=y` (they name different numbers). Return true if numbers can be assigned to the letters so that every claim holds.',
        examples: '- `["a==b","b!=a"]` → `false`: the two claims directly contradict.\n- `["a==b","b==c","a==c"]` → `true`.\n- `["a==b","b!=c","c==a"]` → `false`: a equals b, c equals a, so c equals b, but the second claim says they differ.\n- Edge cases: `a!=a` is impossible; a letter with no `==` claim is free to take a number of its own.',
        brute: 'Try assigning numbers 0 to 25 to the 26 letters and check every claim. That is 26²⁶ assignments, hopeless. A smarter brute force propagates equalities by repeatedly relabeling until nothing changes, which works but is a clumsy union-find.',
        insight: 'Equality is **transitive and symmetric**, which is exactly what a group is. So handle the claims in two passes. Pass one: for every `==` claim, union the two letters. Afterwards each group is a set of letters that must all be equal. Pass two: for every `!=` claim, check the roots. If the two letters share a root, they are forced to be equal and the claim contradicts that, so return false. If no `!=` claim is violated, assigning one distinct number to each group satisfies everything. The order matters: **all** the unions must happen before any `!=` is checked.',
        code: {
          py: `class Solution:
    def equationsPossible(self, equations: List[str]) -> bool:
        parent = list(range(26))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for e in equations:                         # pass 1: every equal claim joins two letters
            if e[1] == '=':
                parent[find(ord(e[0]) - 97)] = find(ord(e[3]) - 97)
        for e in equations:                         # pass 2: no not-equal claim may join a group
            if e[1] == '!' and find(ord(e[0]) - 97) == find(ord(e[3]) - 97):
                return False
        return True`,
          js: `function equationsPossible(equations) {
  const parent = Array.from({ length: 26 }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const id = (ch) => ch.charCodeAt(0) - 97;
  for (const e of equations) {                      // pass 1: every equal claim joins two letters
    if (e[1] === '=') parent[find(id(e[0]))] = find(id(e[3]));
  }
  for (const e of equations) {                      // pass 2: no not-equal claim may join a group
    if (e[1] === '!' && find(id(e[0])) === find(id(e[3]))) return false;
  }
  return true;
}`,
          java: `class Solution {
    int[] parent = new int[26];
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public boolean equationsPossible(String[] equations) {
        for (int i = 0; i < 26; i++) parent[i] = i;
        for (String e : equations) {                // pass 1: every equal claim joins two letters
            if (e.charAt(1) == '=') parent[find(e.charAt(0) - 'a')] = find(e.charAt(3) - 'a');
        }
        for (String e : equations) {                // pass 2: no not-equal claim may join a group
            if (e.charAt(1) == '!' && find(e.charAt(0) - 'a') == find(e.charAt(3) - 'a')) return false;
        }
        return true;
    }
}`,
          cpp: `class Solution {
    int parent[26];
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
public:
    bool equationsPossible(vector<string>& equations) {
        for (int i = 0; i < 26; i++) parent[i] = i;
        for (auto& e : equations) {                 // pass 1: every equal claim joins two letters
            if (e[1] == '=') parent[find(e[0] - 'a')] = find(e[3] - 'a');
        }
        for (auto& e : equations) {                 // pass 2: no not-equal claim may join a group
            if (e[1] == '!' && find(e[0] - 'a') == find(e[3] - 'a')) return false;
        }
        return true;
    }
};`
        },
        complexity: 'O(m · α(26)), effectively O(m), for m claims: two passes, each claim costing two finds over a 26-node structure. O(1) extra space.',
        say: '“Equal claims are transitive, so I treat each letter as a node and union the two letters of every equal claim. Only after all of those are done do I look at the not-equal claims: if the two letters have the same root, they are forced to be equal, so the claims conflict and I return false. If none conflicts, giving each group its own number satisfies everything. It is two passes over the claims with a tiny union-find.”',
        followups: [
          { q: 'What goes wrong if you process the claims in input order, checking each `!=` as it appears?', a: 'A later `==` can still merge two letters you already declared different, so you would accept inputs like `a!=b` followed by `a==b`. All equalities must be applied first.' },
          { q: 'What if the claims were “x < y” instead?', a: 'Then it is no longer a grouping question. A direction means a directed graph, and consistency becomes “is there a cycle?”, which is topological sorting, not union-find.' }
        ]
      }
    ],

    practice: [
      { lc: 684,
        hints: ['Add the edges one at a time and think of the nodes as groups that merge.', 'What does it mean for the next edge if both of its ends are already in the same group?', 'Union the ends of each edge. The first edge whose ends share a root is the one to return.'],
        starter: { py: 'class Solution:\n    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:\n        ', js: 'function findRedundantConnection(edges) {\n  \n}' },
        tests: { fn: 'findRedundantConnection', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2], [1, 3], [2, 3]]], out: [2, 3] }, { args: [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], out: [1, 4] },
          { args: [[[1, 2], [2, 3], [3, 1]]], out: [3, 1] }, { args: [[[3, 4], [1, 2], [2, 4], [3, 5], [2, 5]]], out: [2, 5] }] } },

      { lc: 323,
        hints: ['Every node starts as its own component, so the count starts at n.', 'Each edge either joins two different components (the count falls by one) or does nothing.', 'Return the count after processing every edge. A successful union is the only thing that lowers it.'],
        solution: { explain: 'Union every edge and count the successful unions. O((n + m) α(n)) time, O(n) space.', code: {
          py: `class Solution:
    def countComponents(self, n: int, edges: List[List[int]]) -> int:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        count = n
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
                count -= 1
        return count`,
          js: `function countComponents(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  let count = n;
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
      count--;
    }
  }
  return count;
}` } },
        starter: { py: 'class Solution:\n    def countComponents(self, n: int, edges: List[List[int]]) -> int:\n        ', js: 'function countComponents(n, edges) {\n  \n}' },
        tests: { fn: 'countComponents', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [5, [[0, 1], [1, 2], [3, 4]]], out: 2 }, { args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], out: 1 },
          { args: [4, []], out: 4 }, { args: [1, []], out: 1 }, { args: [4, [[0, 1], [1, 0], [2, 3], [3, 2]]], out: 2 }] } },

      { lc: 261,
        hints: ['A tree on n nodes has exactly n - 1 edges, no more and no fewer. What do you do with that count first?', 'If the count is right, a loop or a disconnected piece is the only thing left to rule out. Which of them does a failed union reveal?', 'Return false if any union fails (a cycle) or the edge count is not n - 1; with n - 1 edges and no cycle, the graph must be connected.'],
        solution: { explain: 'A graph is a tree if it has n - 1 edges and no cycle (and then it is automatically connected). Check the count, then union each edge and fail on a repeat. O(n α(n)).', code: {
          py: `class Solution:
    def validTree(self, n: int, edges: List[List[int]]) -> bool:
        if len(edges) != n - 1:
            return False
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:
                return False          # a cycle
            parent[ra] = rb
        return True`,
          js: `function validTree(n, edges) {
  if (edges.length !== n - 1) return false;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;      // a cycle
    parent[ra] = rb;
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def validTree(self, n: int, edges: List[List[int]]) -> bool:\n        ', js: 'function validTree(n, edges) {\n  \n}' },
        tests: { fn: 'validTree', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], out: true }, { args: [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], out: false },
          { args: [4, [[0, 1], [2, 3]]], out: false }, { args: [1, []], out: true }, { args: [3, [[0, 1], [1, 2], [2, 0]]], out: false }] } },

      { lc: 547,
        hints: ['Cities are nodes and a 1 in the matrix is an edge. The count you want is the number of groups.', 'Start with n groups. Each link between two cities that are in different groups merges them.', 'Only look above the diagonal, union the cities, and subtract one from the count on every successful union.'],
        starter: { py: 'class Solution:\n    def findCircleNum(self, isConnected: List[List[int]]) -> int:\n        ', js: 'function findCircleNum(isConnected) {\n  \n}' },
        tests: { fn: 'findCircleNum', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 1, 0], [1, 1, 0], [0, 0, 1]]], out: 2 }, { args: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]], out: 3 }, { args: [[[1]]], out: 1 },
          { args: [[[1, 1, 0, 0], [1, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 1]]], out: 2 }, { args: [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]], out: 1 }] } },

      { lc: 721,
        hints: ['Treat each account as a node. Which fact makes two accounts the same person?', 'Remember, in a map, the first account that listed each email. When you meet an email that is already in the map, what should you do with the two accounts?', 'After all the unions, group the emails by the root of their account, sort each group and put the name in front.'],
        starter: { py: 'class Solution:\n    def accountsMerge(self, accounts: List[List[str]]) -> List[List[str]]:\n        ', js: 'function accountsMerge(accounts) {\n  \n}' },
        tests: { fn: 'accountsMerge', compare: 'deep', cases: [
          { args: [[['John', 'a@x', 'b@x'], ['John', 'a@x', 'c@x'], ['Mary', 'm@x'], ['John', 'j@x']]], out: [['John', 'a@x', 'b@x', 'c@x'], ['Mary', 'm@x'], ['John', 'j@x']] },
          { args: [[['A', 'x', 'y'], ['A', 'z'], ['A', 'y', 'z']]], out: [['A', 'x', 'y', 'z']] },
          { args: [[['Q', 'e1', 'e1']]], out: [['Q', 'e1']] },
          { args: [[['Sam', 's1'], ['Sam', 's2'], ['Sam', 's3', 's1'], ['Sam', 's4', 's2']]], out: [['Sam', 's1', 's3'], ['Sam', 's2', 's4']] }] } },

      { lc: 990,
        hints: ['Equal claims chain together: a == b and b == c force a == c. What structure keeps groups of letters that must be equal?', 'Do the two kinds of claim in a different order. Which one builds the groups, and which one only checks them?', 'Union the letters of every `==` first. Then any `!=` whose two letters share a root is a contradiction.'],
        starter: { py: 'class Solution:\n    def equationsPossible(self, equations: List[str]) -> bool:\n        ', js: 'function equationsPossible(equations) {\n  \n}' },
        tests: { fn: 'equationsPossible', sig: { args: ['str[]'] }, cases: [
          { args: [['a==b', 'b!=a']], out: false }, { args: [['b==a', 'a==b']], out: true }, { args: [['a==b', 'b==c', 'a==c']], out: true },
          { args: [['a==b', 'b!=c', 'c==a']], out: false }, { args: [['a!=a']], out: false }, { args: [['c==c', 'b==d', 'x!=z']], out: true }] } },

      { lc: 1319,
        hints: ['How many cables do you need, at the very least, to join n computers into one network?', 'If you have enough cables, every move can join two separate groups. How many joins do you need, in terms of the number of groups?', 'Return -1 when there are fewer than n - 1 cables. Otherwise count the components with union-find and return that count minus 1.'],
        solution: { explain: 'Joining n computers takes n - 1 cables. If there are fewer, it is impossible. Otherwise spare cables always exist for each join, so the answer is components - 1. O((n + m) α(n)).', code: {
          py: `class Solution:
    def makeConnected(self, n: int, connections: List[List[int]]) -> int:
        if len(connections) < n - 1:
            return -1
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        count = n
        for a, b in connections:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
                count -= 1
        return count - 1`,
          js: `function makeConnected(n, connections) {
  if (connections.length < n - 1) return -1;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  let count = n;
  for (const [a, b] of connections) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
      count--;
    }
  }
  return count - 1;
}` } },
        starter: { py: 'class Solution:\n    def makeConnected(self, n: int, connections: List[List[int]]) -> int:\n        ', js: 'function makeConnected(n, connections) {\n  \n}' },
        tests: { fn: 'makeConnected', sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [4, [[0, 1], [0, 2], [1, 2]]], out: 1 }, { args: [6, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3]]], out: 2 },
          { args: [6, [[0, 1], [0, 2], [0, 3], [1, 2]]], out: -1 }, { args: [5, [[0, 1], [0, 2], [3, 4], [2, 3]]], out: 0 }, { args: [1, []], out: 0 }] } },

      { lc: 1202,
        hints: ['If position 0 can swap with 3, and 3 with 5, which positions can end up holding which letters?', 'Positions linked by swaps, directly or through others, form a group whose letters can be arranged in any order. Which structure finds those groups?', 'Union the pairs. For each group, sort its letters and write them back into its positions in increasing position order.'],
        solution: { explain: 'Linked positions can permute their letters freely, so each group should hold its letters in sorted order across its sorted positions. O(n log n).', code: {
          py: `class Solution:
    def smallestStringWithSwaps(self, s: str, pairs: List[List[int]]) -> str:
        parent = list(range(len(s)))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for a, b in pairs:
            parent[find(a)] = find(b)
        groups = defaultdict(list)
        for i in range(len(s)):
            groups[find(i)].append(i)            # positions come out in increasing order
        res = list(s)
        for idx in groups.values():
            for i, ch in zip(idx, sorted(s[i] for i in idx)):
                res[i] = ch
        return ''.join(res)`,
          js: `function smallestStringWithSwaps(s, pairs) {
  const parent = Array.from({ length: s.length }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [a, b] of pairs) parent[find(a)] = find(b);
  const groups = new Map();
  for (let i = 0; i < s.length; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);                       // positions come out in increasing order
  }
  const res = s.split('');
  for (const idx of groups.values()) {
    const letters = idx.map((i) => s[i]).sort();
    idx.forEach((i, k) => { res[i] = letters[k]; });
  }
  return res.join('');
}` } },
        starter: { py: 'class Solution:\n    def smallestStringWithSwaps(self, s: str, pairs: List[List[int]]) -> str:\n        ', js: 'function smallestStringWithSwaps(s, pairs) {\n  \n}' },
        tests: { fn: 'smallestStringWithSwaps', sig: { args: ['str', 'int[][]'] }, cases: [
          { args: ['dcab', [[0, 3], [1, 2]]], out: 'bacd' }, { args: ['dcab', [[0, 3], [1, 2], [0, 2]]], out: 'abcd' }, { args: ['cba', [[0, 1], [1, 2]]], out: 'abc' },
          { args: ['abc', []], out: 'abc' }, { args: ['zyx', [[0, 2]]], out: 'xyz' }] } }
    ],

    mistakes: [
      '**Comparing the nodes instead of the roots.** `parent[a] == parent[b]` is not “same group”: two nodes in one tree can have different parents. Always compare `find(a)` with `find(b)`.',
      '**Linking a node instead of its root.** Writing `parent[a] = b` when a is deep inside a tree detaches a from its group and leaves the rest of the group unmerged. Link **roots**: `parent[find(a)] = find(b)`.',
      '**Using `size` or `rank` of a non-root.** Those values are only maintained for roots. After a node stops being a root, its size is stale; read `size[find(x)]`.',
      '**Stack overflow in a recursive `find`.** Without union by size a chain can be 10⁵ long, and Python’s default recursion limit is about 1000. Loop, or add union by size so the depth stays logarithmic.',
      '**Forgetting that a failed union is information.** In cycle-detection problems the `False` returned when both ends share a root is the answer. Throwing the return value away is the most common way to miss it.',
      '**Off-by-one for 1-indexed nodes.** If nodes are 1 to n, allocate n + 1 entries, or subtract one on the way in. A `parent` array of size n makes node n crash or wrap.',
      '**Counting components wrongly.** The count must drop **only** when a union succeeds. Decrementing for every edge counts redundant edges too and returns a number that is too small.',
      '**Checking `!=` claims before all `==` claims are merged.** In equality-class problems every merge has to happen first; otherwise a later equal claim can silently contradict one you already accepted.',
      '**Using DSU where you need a path, or need to delete.** It only merges. For distances, paths or removals, use a graph search, or reverse time so that deletions become additions.',
      '**Two-pass compression written wrongly.** Reassigning `x = parent[x]` before saving the old parent loses the rest of the path. Save `next = parent[x]` first, or use path halving.',
      '**Weighted DSU: changing the parent before updating the weight.** The relation to the old parent is needed to compute the relation to the new one, so update the weight first, then the pointer.'
    ],

    quiz: [
      { kind: 'concept', q: 'In a union-find structure stored as a `parent` array, how do you recognize a root?',
        choices: ['Its parent is itself: `parent[x] == x`', 'Its parent is -1', 'It has the smallest index in its group', 'It was the first node ever unioned'], answer: 0,
        explain: 'Every node starts as its own parent, which makes it the root of a one-node tree. Unions then re-point roots at other roots. Some implementations store a negative size at a root instead, but the idea is the same.' },
      { kind: 'concept', q: 'What does path compression do?',
        choices: ['Points every node on the path it just climbed directly at the root, so later finds are shorter', 'Merges the smaller tree into the larger one', 'Deletes the nodes it passes through', 'Sorts the parent array'], answer: 0,
        explain: 'Path compression is applied during find. It never changes which nodes are grouped together, only how short the paths to the root are. Hanging the smaller tree under the larger is union by size.' },
      { kind: 'concept', q: 'Why does union by size keep trees shallow?',
        choices: ['A node goes one level deeper only when its tree is the smaller one, which at least doubles the size of the tree it joins, so depth is at most log₂ n', 'It makes every tree a single level', 'It removes duplicate nodes', 'It sorts nodes by depth'], answer: 0,
        explain: 'Each time a node’s depth grows, the tree it ends up in is at least twice as large as its old tree. A tree of n nodes can double at most log₂ n times, so no node is deeper than log₂ n.' },
      { kind: 'complexity', q: 'What is the amortized cost of a find or union with both path compression and union by rank or size?',
        choices: ['O(α(n)), the inverse Ackermann function, effectively constant', 'O(n)', 'O(log n) in the worst case, always', 'O(n log n)'], answer: 0,
        explain: 'Together the two optimizations give O(α(n)) per operation. α(n) is below 5 for any n that could fit in memory. Either optimization alone gives O(log n) amortized.' },
      { kind: 'bug', q: 'This union is supposed to merge the groups of `a` and `b`, but later queries show groups that should have merged are still separate. What is the bug?',
        code: `def union(a, b):
    if parent[a] != parent[b]:
        parent[a] = b`,
        lang: 'py',
        choices: ['It links a and b themselves instead of their roots, and compares parents instead of roots', 'It should set parent[b] = a', 'It needs a recursion', 'It should sort a and b first'], answer: 0,
        explain: 'If a is not a root, setting `parent[a] = b` pulls a out of its tree and leaves its old group unmerged. Compare `find(a)` with `find(b)` and link `parent[find(a)] = find(b)`.' },
      { kind: 'concept', q: 'You add undirected edges to a union-find one by one. What does it mean when `union(u, v)` finds the same root for u and v?',
        choices: ['u and v are already connected, so this edge closes a cycle', 'The edge is the heaviest one', 'The graph is disconnected', 'u and v are the same node'], answer: 0,
        explain: 'If the two ends already share a root, a path between them already exists, so a new edge between them forms a loop. That is the whole idea behind Redundant Connection, Graph Valid Tree and Kruskal’s algorithm.' },
      { kind: 'pattern', q: 'Which problem is the best fit for union-find?',
        choices: ['Edges arrive in a stream and after each one you must say whether two nodes are connected', 'Find the shortest path between two nodes in an unweighted graph', 'Order tasks so every task follows its prerequisites', 'Find the longest increasing subsequence'], answer: 0,
        explain: 'Incremental connectivity is what union-find does best. A shortest path wants BFS, a prerequisite order wants a topological sort, and the increasing subsequence is dynamic programming or binary search.' },
      { kind: 'concept', q: 'A graph has n nodes and you start with `count = n`. When should `count` be decremented?',
        choices: ['Only when a union merges two different roots', 'On every edge', 'On every find', 'Only when an edge closes a cycle'], answer: 0,
        explain: 'Each successful merge joins two groups into one, lowering the group count by exactly one. An edge whose ends already share a root changes nothing.' },
      { kind: 'concept', q: 'In Kruskal’s algorithm, why does a DSU give the right test for “would this edge create a cycle”?',
        choices: ['The edge makes a cycle exactly when its ends are already in the same component', 'It sorts the edges by weight', 'It stores the weights in the parent array', 'It finds the shortest path between the ends'], answer: 0,
        explain: 'Kruskal takes edges cheapest first and keeps one only if its ends lie in different components. The DSU answers “same component?” in near-constant time, and merging the components after taking an edge keeps it up to date.' },
      { kind: 'concept', q: 'Which statements about union-find are true? Pick every one that applies.',
        choices: ['It can merge groups but cannot split one', 'It can tell you whether two nodes are connected, but not the path between them', 'It can count connected components in an undirected graph', 'It handles directed reachability correctly'], answer: [0, 1, 2],
        explain: 'Union-find only merges, and only records membership. It is for undirected connectivity: directed reachability needs other tools, and path questions need a graph search. Deletions are handled offline, by processing time in reverse.' }
    ],

    flashcards: [
      { id: 'uf-roles', front: 'What do `find` and `union` do in a DSU?', back: '`find(x)` follows parent pointers to the root, the group’s representative. `union(a, b)` finds both roots and, if they differ, hangs one under the other. A root has `parent[x] == x`.' },
      { id: 'uf-compress', front: 'What is path compression?', back: 'During `find`, re-point every node on the path straight at the root, so the next find from any of them is one hop. It changes pointers, never group membership.' },
      { id: 'uf-by-size', front: 'What is union by size (or rank) and why use it?', back: 'Hang the smaller tree under the larger root. A node only goes deeper when its tree is the smaller one, doubling its tree, so depth stays at most log₂ n.' },
      { id: 'uf-alpha', front: 'What is the cost with both optimizations?', back: 'O(α(n)) amortized per operation, α the inverse Ackermann function, below 5 for any real n. Say “near-constant”. Either optimization alone gives O(log n).' },
      { id: 'uf-cycle', front: 'How does DSU detect a cycle in an undirected graph?', back: 'Add edges one by one. If both ends already have the same root, they are already connected, so this edge closes a cycle. `union` returns false in that case.' },
      { id: 'uf-count', front: 'How do you count components with a DSU?', back: 'Start with `count = n`. Decrement only when a union merges two different roots. What remains is the number of components.' },
      { id: 'uf-tree', front: 'How do you check a graph is a valid tree?', back: 'It needs exactly n - 1 edges and no cycle (then it is connected). Check the edge count, union every edge, and fail on any edge whose ends share a root.' },
      { id: 'uf-kruskal', front: 'How does Kruskal use a DSU?', back: 'Sort edges by weight; take an edge if its ends have different roots (and union them), skip it otherwise. Stop at n - 1 edges. Fewer means the graph is disconnected.' },
      { id: 'uf-root-compare', front: 'Which comparison says two nodes are in the same group?', back: '`find(a) == find(b)`. Never compare parents directly: nodes of one tree can have different parents.' },
      { id: 'uf-loop-find', front: 'Why write `find` as a loop in an interview?', back: 'A recursive find can overflow the stack on a deep chain (Python and Java). A loop with path halving or two passes has no such limit.' },
      { id: 'uf-no-split', front: 'What can a DSU not do?', back: 'Split a group (delete an edge), give a path or a distance, or handle directed reachability. For deletions, process time in reverse so they become additions.' },
      { id: 'uf-equal-first', front: 'Equality claims with “!=” claims: what order?', back: 'Union every `==` first, then check every `!=`: a not-equal pair sharing a root is a contradiction. Mixing the order can accept inconsistent claims.' }
    ],

    deeper: [
      { title: 'Disjoint Set Union (cp-algorithms)', url: 'https://cp-algorithms.com/data_structures/disjoint_set_union.html', time: 'about 30 min', note: 'The standard reference: compression, union by size and rank, the amortized proof sketch, and applications such as weighted DSU, offline connectivity and Kruskal.' },
      { title: 'Disjoint-set data structure (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Disjoint-set_data_structure', time: 'about 20 min', note: 'Definitions, the three find variants (compression, splitting, halving), and the bound with the inverse Ackermann function.' },
      { title: 'Union-Find (Princeton algorithms course notes)', url: 'https://algs4.cs.princeton.edu/15uf/', time: 'about 25 min', note: 'A slower, gentler build-up: quick-find, quick-union, weighting and compression, with the running-time table for each step.' },
      { title: 'NeetCode: Union Find', url: 'https://neetcode.io/courses/advanced-algorithms/1', time: 'about 20 min', note: 'A short video walkthrough of the structure and the redundant-connection problem, good as a first pass before coding it yourself.' }
    ],

    detective: [
      { id: 'festival-crowds', decoys: ['graphs', 'trees', 'hashing-internals'],
        statement: 'A festival app lets two guests link their wristbands when they meet. Guests are numbered from 0, and meetings are fed to the app live, one pair at a time, thousands per minute. The organizers want a live counter of how many separate friend crowds are in the park (two guests are in the same crowd if a chain of meetings connects them), and a button that, for any two guests, instantly says whether they are in the same crowd. Re-scanning every guest after each new meeting is far too slow.',
        why: 'The facts only ever **merge** groups, they arrive as a stream, and the questions are “same group?” and “how many groups?”. That is incremental connectivity: a forest of parent pointers answers each in near-constant time, and a counter that drops on every successful merge gives the number of crowds.' },
      { id: 'cable-first-loop', decoys: ['graphs', 'mst', 'topo-sort'],
        statement: 'A lab is wiring sensors together, one cable at a time, in the order the technician installs them. A sensor network must never contain a loop, because a loop makes the signals echo. The foreman wants a checker that watches the cables as they are installed and shouts the moment a cable is added between two sensors that are already linked, directly or through other sensors, so the technician can undo it. A new check must not re-trace the whole network each time.',
        why: 'A cable between two already-connected sensors is exactly an edge whose ends share a group, which closes a loop. Spotting it as the cables arrive, without re-walking the network, is the failed union in a structure that remembers each sensor’s group.' },
      { id: 'rune-ledger', decoys: ['graphs', 'backtracking', 'topo-sort'],
        statement: 'An archivist has a ledger of claims about twenty-six rune symbols. Some lines say two symbols carry the same value, others say two symbols carry different values. She wants to know whether any assignment of values could make every line true. Reading the “same” lines first and checking the “different” lines afterwards feels right to her, but she cannot explain what to keep track of between the two readings, and trying all assignments is impossible.',
        why: 'Equal-value claims are transitive, so they carve the symbols into groups that must share a value; that bookkeeping is a structure that merges and tests membership. A “different” claim between two symbols of one group is then a direct contradiction. Merging first and checking second is the whole algorithm.' }
    ]
  });
})();
