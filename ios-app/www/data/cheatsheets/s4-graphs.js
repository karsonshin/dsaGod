/* Cheat sheet 4: graph algorithm chooser as a decision tree.
   Question node: { q, kids: [[branch label, node], ...] }. Leaf: { alg, cx, note, topic, ex: [lc] }. */
(function () {
  var OR = (window.OR = window.OR || {});

  var SP = 'shortest-paths';
  var TREE = [
    ['Shortest path', { q: 'Are the edges weighted?', kids: [
      ['No (every step costs 1)', { alg: 'BFS', cx: 'O(V+E)', note: 'Fewest edges. On a grid, V = rows × cols.', topic: 'graphs', ex: [127, 994] }],
      ['Yes', { q: 'Need every pair of vertices?', kids: [
        ['Yes', { alg: 'Floyd-Warshall', cx: 'O(V³)', note: 'Fine for V up to a few hundred. Handles negative edges, not negative cycles.', topic: SP, ex: [1334] }],
        ['No, from one source', { q: 'Any negative edge?', kids: [
          ['Yes', { q: 'Is it a DAG?', kids: [
            ['Yes', { alg: 'Relax in topological order', cx: 'O(V+E)', note: 'One pass, negative edges are fine.', topic: 'topo-sort' }],
            ['No', { alg: 'Bellman-Ford', cx: 'O(V·E)', note: 'Detects a negative cycle. “At most k edges” is k rounds.', topic: SP, ex: [787] }]
          ] }],
          ['No', { q: 'Weights only 0 and 1?', kids: [
            ['Yes', { alg: '0-1 BFS (deque)', cx: 'O(V+E)', note: 'Push 0-edges to the front, 1-edges to the back.', topic: SP, ex: [2290] }],
            ['No', { alg: 'Dijkstra (min-heap)', cx: 'O((V+E) log V)', note: 'Never with a negative edge. Skip stale heap entries.', topic: SP, ex: [743, 778] }]
          ] }]
        ] }]
      ] }]
    ] }],
    ['Order with prerequisites', { alg: 'Topological sort (Kahn or DFS)', cx: 'O(V+E)', note: 'Directed acyclic graphs only. If fewer than V vertices come out, there is a cycle.', topic: 'topo-sort', ex: [207, 210, 269] }],
    ['Connected groups', { q: 'Do edges arrive over time, or do you ask “same group?” many times?', kids: [
      ['Yes', { alg: 'Union-Find', cx: 'amortized ≈ O(α(n)) per op', note: 'Path compression + union by size.', topic: 'union-find', ex: [684, 721, 547] }],
      ['No, graph is fixed', { alg: 'BFS or DFS flood fill', cx: 'O(V+E)', note: 'Count components, label regions, grids included.', topic: 'graphs', ex: [200, 695] }]
    ] }],
    ['Cycle detection', { q: 'Is the graph directed?', kids: [
      ['Yes', { alg: 'DFS with 3 colors, or Kahn', cx: 'O(V+E)', note: 'A gray neighbor means a back edge. Or: fewer than V vertices sorted.', topic: 'topo-sort', ex: [207] }],
      ['No', { alg: 'Union-Find, or DFS that skips the parent', cx: 'O(V+E)', note: 'An edge whose ends are already in one set closes a cycle.', topic: 'union-find', ex: [684, 261] }]
    ] }],
    ['Connect everything cheaply (MST)', { q: 'Edges easy to sort as a list (sparse)?', kids: [
      ['Yes', { alg: 'Kruskal', cx: 'O(E log E)', note: 'Sort edges, add if Union-Find says they join two groups.', topic: 'mst', ex: [1584] }],
      ['No, dense or adjacency form', { alg: 'Prim (min-heap)', cx: 'O(E log V)', note: 'Grow from one node. Array version is O(V²) for dense graphs.', topic: 'mst', ex: [1584] }]
    ] }],
    ['Two-coloring, odd cycles', { alg: 'BFS or DFS coloring (bipartite check)', cx: 'O(V+E)', note: 'Two adjacent vertices with the same color mean no.', topic: 'graphs', ex: [785] }],
    ['Bridges, SCCs, Euler paths', { q: 'What is asked?', kids: [
      ['Edge whose removal disconnects', { alg: 'Tarjan low-link (bridges)', cx: 'O(V+E)', note: 'Articulation points use the same low-link values.', topic: 'advanced-graphs', ex: [1192] }],
      ['Mutually reachable groups (directed)', { alg: 'Tarjan or Kosaraju (SCC)', cx: 'O(V+E)', note: 'Condense to a DAG, then topological order.', topic: 'advanced-graphs' }],
      ['Use every edge exactly once', { alg: 'Hierholzer (Euler path)', cx: 'O(E)', note: 'Check degree counts first.', topic: 'advanced-graphs', ex: [332] }]
    ] }]
  ];

  function node(n, h) {
    if (n.alg) {
      return '<div class="gt-leaf"><div class="gt-alg"><b>' + h.m(n.alg) + '</b><span class="gt-cx">' + h.m(n.cx) + '</span></div><p>' + h.m(n.note) + ' ' +
        'Lesson: ' + h.topicLink(n.topic) + (n.ex ? ' · e.g. ' + n.ex.map(h.probLink).join(' ') : '') + '</p></div>';
    }
    return '<div class="gt-q">' + h.m(n.q) + '</div><ul class="gt-kids">' + n.kids.map(function (k) {
      return '<li><span class="gt-b">' + h.m(k[0]) + '</span><div class="gt-n">' + node(k[1], h) + '</div></li>';
    }).join('') + '</ul>';
  }

  OR.cheatsheets.push({
    n: 4, id: 'graph-chooser', title: 'Graph algorithm chooser',
    blurb: 'Start from what the problem asks, answer the questions, and land on the algorithm, its cost and its lesson.',
    keywords: 'graph decision tree dijkstra bellman ford bfs dfs topological mst kruskal prim union find shortest path cycle',
    render: function (h) {
      return '<p class="cs-ask"><b>What does the problem ask for?</b> Pick the branch, then follow the questions down. V = vertices, E = edges.</p>' +
        '<ol class="gt-top">' + TREE.map(function (b) {
          return '<li class="gt-card"><h3>' + h.m(b[0]) + '</h3>' + '<div class="gt-n">' + node(b[1], h) + '</div>' + '</li>';
        }).join('') + '</ol>' +
        '<p class="cs-foot">Negative edges rule out Dijkstra. A negative cycle makes “shortest” undefined; Bellman-Ford reports it. Sizes: V ≤ about 400 allows O(V³); E log V is the usual target at 10⁵.</p>';
    }
  });
})();
