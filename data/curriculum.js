/* Offer Ready: curriculum manifest.
   The canonical topic order, phase, effort and prerequisite graph. Full lesson content for each
   topic lives in data/topics/<id>.js; this file is what the plan, roadmap and search read. */
(function () {
  var OR = (window.OR = window.OR || {});

  // Five phases, scaled from the 10-week default shape to the owner's real timeline.
  OR.phases = [
    { id: 1, name: 'Foundations', short: 'Language fluency, Big-O and the array patterns', share: 0.2 },
    { id: 2, name: 'Core structures', short: 'Binary search, lists, trees, tries and heaps', share: 0.2 },
    { id: 3, name: 'Search & graphs', short: 'Backtracking, graphs, and system design begins', share: 0.2 },
    { id: 4, name: 'DP & greedy', short: 'Every DP family, greedy, intervals, bits and math', share: 0.2 },
    { id: 5, name: 'Interview mode', short: 'Timed sets, mocks, behavioral stories and offers', share: 0.2 }
  ];

  OR.topicGroups = [
    { id: 'foundations', name: 'Foundations' },
    { id: 'core', name: 'Core patterns' },
    { id: 'design', name: 'Data-structure design' },
    { id: 'advanced', name: 'Competitive / bonus', note: 'Lower interview ROI. Learn these after the core is solid.' }
  ];

  // hours: base study + core practice time for a "half comfortable with data structures" learner.
  // roi: how often the topic decides real interviews (high / medium / low).
  OR.curriculum = [
    { id: 'language', get title() { try { return OR.langName(OR.lang()) + ' for DSA'; } catch (e) { return 'Your language for DSA'; } }, group: 'foundations', phase: 1, hours: 3, roi: 'high', prereqs: [], viz: 'containers',
      blurb: 'The built-ins that turn a 40-line solution into 10: hash maps, deques, heaps, sorting and the gotchas of each language.' },
    { id: 'big-o', title: 'Big-O and complexity', group: 'foundations', phase: 1, hours: 3, roi: 'high', prereqs: [], viz: 'growth',
      blurb: 'Count the work, not the seconds. Read the constraints and know which complexity the interviewer expects.' },
    { id: 'arrays-hashing', title: 'Arrays and hashing', group: 'core', phase: 1, hours: 5, roi: 'high', prereqs: ['big-o', 'language'], viz: 'hashmap',
      blurb: 'Trade memory for time: remember what you have seen so each element is touched once.' },
    { id: 'two-pointers', title: 'Two pointers', group: 'core', phase: 1, hours: 4, roi: 'high', prereqs: ['arrays-hashing'], viz: 'two-pointers',
      blurb: 'Two indices that move with a rule, usually toward each other on sorted data, replace a nested loop.' },
    { id: 'sliding-window', title: 'Sliding window', group: 'core', phase: 1, hours: 5, roi: 'high', prereqs: ['two-pointers'], viz: 'sliding-window',
      blurb: 'A contiguous range that grows on the right and shrinks on the left, so every element enters and leaves once.' },
    { id: 'prefix-sums', title: 'Prefix sums and difference arrays', group: 'core', phase: 1, hours: 3, roi: 'medium', prereqs: ['arrays-hashing'], viz: 'prefix-sum',
      blurb: 'Precompute running totals so any range sum costs one subtraction; record changes at the edges of a range.' },
    { id: 'kadane', title: 'Kadane’s algorithm', group: 'core', phase: 1, hours: 2, roi: 'medium', prereqs: ['prefix-sums'], viz: 'kadane',
      blurb: 'The best subarray ending here either extends the previous best or starts fresh.' },
    { id: 'stacks', title: 'Stacks', group: 'core', phase: 1, hours: 3, roi: 'high', prereqs: ['arrays-hashing'], viz: 'stack-queue',
      blurb: 'Last in, first out: matching brackets, undo history, expression evaluation and simulated recursion.' },
    { id: 'monotonic', title: 'Monotonic stack and queue', group: 'core', phase: 2, hours: 4, roi: 'medium', prereqs: ['stacks', 'sliding-window'], viz: 'monotonic-stack',
      blurb: 'Keep a stack sorted by popping whatever the new element beats, and next-greater questions become O(n).' },
    { id: 'queues', title: 'Queues and deques', group: 'core', phase: 2, hours: 2, roi: 'medium', prereqs: ['stacks'], viz: 'deque',
      blurb: 'First in, first out for processing in arrival order; deques add cheap pushes and pops at both ends.' },
    { id: 'binary-search', title: 'Binary search', group: 'core', phase: 2, hours: 5, roi: 'high', prereqs: ['arrays-hashing'], viz: 'binary-search',
      blurb: 'Halve the search space with every comparison, on arrays and on any monotonic yes/no question.' },
    { id: 'linked-lists', title: 'Linked lists', group: 'core', phase: 2, hours: 5, roi: 'high', prereqs: ['two-pointers'], viz: 'linked-list',
      blurb: 'Pointer surgery done safely: dummy heads, in-place reversal and fast/slow runners.' },
    { id: 'recursion', title: 'Recursion', group: 'core', phase: 2, hours: 3, roi: 'high', prereqs: ['big-o'], viz: 'recursion-tree',
      blurb: 'Trust the smaller call: define the base case, shrink the problem and combine the answers.' },
    { id: 'sorting', title: 'Sorting', group: 'core', phase: 2, hours: 4, roi: 'medium', prereqs: ['recursion', 'arrays-hashing'], viz: 'sorting-race',
      blurb: 'Merge, quick, heap, counting and bucket sort: how each works, what each costs, and when you write one.' },
    { id: 'hashing-internals', title: 'Hashing internals', group: 'core', phase: 2, hours: 2, roi: 'low', prereqs: ['arrays-hashing'], viz: 'hashing',
      blurb: 'What really happens inside a hash map: hash functions, collisions, load factor and rolling hashes.' },
    { id: 'heaps', title: 'Heaps and priority queues', group: 'core', phase: 2, hours: 4, roi: 'high', prereqs: ['sorting'], viz: 'heap',
      blurb: 'Always know the smallest (or largest) item cheaply: top-K, two heaps for medians, K-way merges.' },
    { id: 'trees', title: 'Trees', group: 'core', phase: 2, hours: 8, roi: 'high', prereqs: ['recursion', 'queues'], viz: 'tree-traversal',
      blurb: 'DFS orders, level-order BFS, BST invariants, lowest common ancestors and serialization.' },
    { id: 'tries', title: 'Tries', group: 'core', phase: 2, hours: 3, roi: 'medium', prereqs: ['trees'], viz: 'trie',
      blurb: 'A tree of characters where every path is a prefix: autocomplete, word search and prefix counts.' },
    { id: 'matrix', title: 'Matrix problems', group: 'core', phase: 2, hours: 3, roi: 'medium', prereqs: ['arrays-hashing'], viz: 'matrix',
      blurb: 'Rotate, spiral and set-zeroes: index arithmetic on grids done in place.' },
    { id: 'backtracking', title: 'Backtracking', group: 'core', phase: 3, hours: 6, roi: 'high', prereqs: ['recursion'], viz: 'backtracking-tree',
      blurb: 'Choose, explore, un-choose: enumerate subsets, permutations and boards while pruning dead branches early.' },
    { id: 'graphs', title: 'Graphs', group: 'core', phase: 3, hours: 8, roi: 'high', prereqs: ['trees', 'queues'], viz: 'grid-search',
      blurb: 'BFS and DFS on adjacency lists and grids, plus cycle detection, connected components and bipartite checks.' },
    { id: 'topo-sort', title: 'Topological sort', group: 'core', phase: 3, hours: 3, roi: 'high', prereqs: ['graphs'], viz: 'topo-sort',
      blurb: 'Order tasks so every dependency comes first, with Kahn’s in-degree queue or DFS finish times.' },
    { id: 'union-find', title: 'Union-Find (DSU)', group: 'core', phase: 3, hours: 3, roi: 'medium', prereqs: ['graphs'], viz: 'union-find',
      blurb: 'Track merging groups in nearly O(1) per operation with path compression and union by rank.' },
    { id: 'shortest-paths', title: 'Shortest paths', group: 'core', phase: 3, hours: 5, roi: 'medium', prereqs: ['graphs', 'heaps'], viz: 'dijkstra',
      blurb: 'Dijkstra, Bellman-Ford, Floyd-Warshall and 0-1 BFS, and which one the constraints call for.' },
    { id: 'mst', title: 'Minimum spanning tree', group: 'core', phase: 3, hours: 3, roi: 'low', prereqs: ['union-find', 'heaps'], viz: 'mst',
      blurb: 'Connect every node at least total cost: Kruskal sorts edges, Prim grows from a node.' },
    { id: 'greedy', title: 'Greedy', group: 'core', phase: 4, hours: 5, roi: 'high', prereqs: ['sorting', 'heaps'], viz: 'jump-game',
      blurb: 'Take the locally best choice when an exchange argument proves it is never worse, and know when it fails.' },
    { id: 'intervals', title: 'Intervals', group: 'core', phase: 4, hours: 4, roi: 'high', prereqs: ['sorting'], viz: 'intervals',
      blurb: 'Sort by start (or end), then merge, insert, count overlaps or sweep through events.' },
    { id: 'dp-1d', title: '1-D dynamic programming', group: 'core', phase: 4, hours: 6, roi: 'high', prereqs: ['recursion'], viz: 'dp-1d',
      blurb: 'Name the state, write the recurrence, fill the table: climbing stairs to coin change.' },
    { id: 'dp-2d', title: '2-D and grid DP', group: 'core', phase: 4, hours: 5, roi: 'high', prereqs: ['dp-1d'], viz: 'dp-grid',
      blurb: 'Two indices of state: paths through grids, and comparing two sequences cell by cell.' },
    { id: 'knapsack', title: 'Knapsack family', group: 'core', phase: 4, hours: 5, roi: 'medium', prereqs: ['dp-1d'], viz: 'dp-knapsack',
      blurb: '0/1, unbounded and subset-sum: pick items under a capacity, and the loop order that makes each one work.' },
    { id: 'string-dp', title: 'String DP', group: 'core', phase: 4, hours: 5, roi: 'medium', prereqs: ['dp-2d'], viz: 'dp-strings',
      blurb: 'LCS, edit distance and palindromes: dp over prefixes of one or two strings.' },
    { id: 'lis', title: 'Longest increasing subsequence', group: 'core', phase: 4, hours: 3, roi: 'medium', prereqs: ['dp-1d', 'binary-search'], viz: 'lis',
      blurb: 'The O(n²) DP, then the O(n log n) tails array that binary search makes possible.' },
    { id: 'interval-dp', title: 'Interval DP', group: 'core', phase: 4, hours: 4, roi: 'low', prereqs: ['dp-2d'], viz: 'dp-interval',
      blurb: 'Solve every subrange by length: burst balloons, matrix chains, palindromic partitions.' },
    { id: 'tree-dp', title: 'DP on trees', group: 'core', phase: 4, hours: 3, roi: 'medium', prereqs: ['trees', 'dp-1d'], viz: 'tree-dp',
      blurb: 'Return a small tuple from each subtree and combine children into the parent’s answer.' },
    { id: 'bits', title: 'Bit manipulation', group: 'core', phase: 4, hours: 3, roi: 'medium', prereqs: ['big-o'], viz: 'bits',
      blurb: 'XOR cancels, AND masks, shifts multiply: the tricks behind single number, counting bits and subsets.' },
    { id: 'bitmask-dp', title: 'Bitmask DP', group: 'core', phase: 4, hours: 4, roi: 'low', prereqs: ['dp-2d', 'bits'], viz: 'bitmask',
      blurb: 'When n ≤ 20, a bitmask can be the state: visited sets, assignments, travelling salesman.' },
    { id: 'math', title: 'Math and number theory', group: 'core', phase: 4, hours: 4, roi: 'medium', prereqs: ['big-o'], viz: 'sieve',
      blurb: 'GCD and LCM, primes with a sieve, modular arithmetic and inverses, fast exponentiation and counting.' },
    { id: 'design-ds', title: 'Design questions', group: 'design', phase: 5, hours: 6, roi: 'high', prereqs: ['linked-lists', 'heaps', 'hashing-internals'], viz: 'lru',
      blurb: 'LRU and LFU caches, rate limiters, hit counters, O(1) random sets: combine structures behind an API.' },
    { id: 'segment-tree', title: 'Segment trees', group: 'advanced', phase: 5, hours: 5, roi: 'low', prereqs: ['trees', 'prefix-sums'], viz: 'segment-tree',
      blurb: 'Range queries with point and range updates in O(log n), with lazy propagation.' },
    { id: 'fenwick', title: 'Fenwick trees', group: 'advanced', phase: 5, hours: 3, roi: 'low', prereqs: ['prefix-sums', 'bits'], viz: 'fenwick',
      blurb: 'Prefix sums that survive updates, in a dozen lines, powered by the lowest set bit.' },
    { id: 'string-algos', title: 'String algorithms', group: 'advanced', phase: 5, hours: 4, roi: 'low', prereqs: ['hashing-internals', 'sliding-window'], viz: 'kmp',
      blurb: 'KMP’s failure function and the Z-function: pattern matching in linear time.' },
    { id: 'advanced-graphs', title: 'Advanced graphs', group: 'advanced', phase: 5, hours: 4, roi: 'low', prereqs: ['graphs', 'topo-sort'], viz: 'tarjan',
      blurb: 'Bridges, articulation points and strongly connected components with low-link values.' },
    { id: 'cp-starter', title: 'Competitive programming starter', group: 'advanced', phase: 5, hours: 2, roi: 'low', prereqs: ['big-o', 'language'], viz: 'growth',
      blurb: 'Fast I/O, a C++ template, how Codeforces ratings work, and the CSES and AtCoder DP path.' }
  ];

  OR.topicMeta = function (id) {
    for (var i = 0; i < OR.curriculum.length; i++) if (OR.curriculum[i].id === id) return OR.curriculum[i];
    return null;
  };
})();
