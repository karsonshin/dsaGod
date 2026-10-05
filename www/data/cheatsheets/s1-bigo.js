/* Cheat sheet 1: Big-O for every data structure. Cells use the OR.csh markup (see js/views/cheatsheets.js). */
(function () {
  var OR = (window.OR = window.OR || {});
  OR.cheatsheets.push({
    n: 1, id: 'big-o', title: 'Big-O for every data structure',
    blurb: 'Average and worst case for each operation on the structures you meet in interviews, with the trap that goes with each.',
    keywords: 'complexity time space array hash heap bst trie union find fenwick graph',
    render: function (h) {
      return h.sec('Operations (n items; avg / worst where they differ)', h.T(
        ['Structure', 'Access / index', 'Search', 'Insert', 'Delete', 'Space', 'The trap'],
        [
          ['Array (dynamic)', 'O(1)', 'O(n); O(log n) if sorted', 'end O(1) amortized, O(n) worst; middle O(n)', 'end O(1); middle or front O(n)', 'O(n)', '`insert(0, x)`, `pop(0)` and `shift()` are O(n). Slicing copies. Appending is amortized: one resize costs O(n).'],
          ['Singly linked list', 'O(n)', 'O(n)', 'head O(1); after a node you hold O(1)', 'O(1) if you hold the previous node; else O(n) to find it', 'O(n)', 'No random access. Doubly linked lets you delete a node you hold in O(1). Finding the middle is O(n).'],
          ['Hash map / set', '–', 'avg O(1) / worst O(n)', 'avg O(1) amortized / worst O(n)', 'avg O(1) / worst O(n)', 'O(n)', 'Worst case is all keys colliding (Java 8+ treeifies a bucket to O(log n) for comparable keys). Hashing a string key costs O(L). Python list keys are unhashable; use tuples.'],
          ['Stack (array backed)', 'top O(1)', 'O(n)', 'push O(1)', 'pop O(1)', 'O(n)', 'Only the top is cheap. Recursion is a stack: depth h costs O(h) space.'],
          ['Queue (linked or ring buffer)', 'front O(1)', 'O(n)', 'enqueue O(1)', 'dequeue O(1)', 'O(n)', 'A Python list or JS array used as a queue makes dequeue O(n). Use `deque` / an index pointer / `ArrayDeque`.'],
          ['Deque', 'ends O(1)', 'O(n)', 'both ends O(1)', 'both ends O(1)', 'O(n)', 'Python `deque` is O(n) in the middle; C++ `std::deque` indexes in O(1); Java `ArrayDeque` has no index access.'],
          ['Binary heap', 'min or max O(1)', 'O(n)', 'O(log n)', 'pop top O(log n); arbitrary O(n) to find', 'O(n)', 'Building a heap from n items is **O(n)**, not n log n. No decrease-key in `heapq` / `PriorityQueue`: push a duplicate and skip stale entries.'],
          ['Binary search tree (unbalanced)', '–', 'avg O(log n) / worst O(n)', 'avg O(log n) / worst O(n)', 'avg O(log n) / worst O(n)', 'O(n)', 'Sorted input turns it into a linked list (height n). Recursion on it can overflow the stack.'],
          ['Balanced BST (AVL, red-black)', '–', 'O(log n)', 'O(log n)', 'O(log n)', 'O(n)', 'Also gives floor, ceiling, rank and range in O(log n). Java `TreeMap`, C++ `std::map` / `set`. Python and JS have none built in; `bisect.insort` on a list is O(n).'],
          ['Trie', '–', 'O(L) for a key of length L', 'O(L)', 'O(L)', 'O(total chars) worst', 'Cost depends on key length, not on n. A 26-pointer array per node is fast but memory hungry; use a map for big alphabets.'],
          ['Union-Find (path compression + union by size)', '–', 'find: amortized O(α(n)) ≈ O(1)', 'union: amortized O(α(n))', 'not supported', 'O(n)', 'Drop either optimization and the worst case degrades (one of the two: O(log n); neither: O(n)). It can merge but never split.'],
          ['Segment tree', 'point O(log n)', 'range query O(log n)', 'build O(n); update O(log n); range update with lazy O(log n)', 'n/a', 'O(n) (array of 2n to 4n)', 'Works for any associative merge (sum, min, max, gcd). Lazy propagation is where bugs live.'],
          ['Fenwick tree (BIT)', 'prefix O(log n)', 'range = two prefixes, O(log n)', 'build O(n); point update O(log n)', 'n/a', 'O(n)', '1-indexed. Needs an invertible operation (sum, xor), so no range min or max. Range update needs the difference trick.']
        ], { cls: 'cs-bigo', label: 'Big-O by data structure' })) +
        '<div class="cs-cols">' +
        h.sec('Graph representations (V vertices, E edges)', h.T(
          ['Representation', 'Space', 'Edge u-v?', 'Neighbors of u', 'Full traversal'],
          [
            ['Adjacency list', 'O(V+E)', 'O(deg u); O(1) with a hash set per node', 'O(deg u)', 'O(V+E)'],
            ['Adjacency matrix', 'O(V²)', 'O(1)', 'O(V)', 'O(V²)'],
            ['Edge list', 'O(E)', 'O(E)', 'O(E)', 'O(VE)'],
            ['Grid as implicit graph', 'O(R·C)', 'O(1)', '4 or 8 neighbors', 'O(R·C)']
          ], { cls: 'cs-graph', label: 'Graph representations' }) +
          h.list(['Default to an adjacency list. Use the matrix when the graph is dense or V is small (Floyd-Warshall). Use the edge list for Kruskal and Bellman-Ford.', 'BFS and DFS are O(V+E) on a list but O(V²) on a matrix.'])) +
        h.sec('Rules of thumb', h.T(
          ['n up to', 'Aim for'],
          [['10 to 11', 'O(n!) (permutations)'], ['20 to 25', 'O(2ⁿ) (subsets, bitmask)'], ['about 500', 'O(n³)'], ['about 5,000', 'O(n²)'], ['10⁵ to 10⁶', 'O(n log n) or O(n)'], ['10⁸ and up', 'O(log n) or O(1)']],
          { cls: 'cs-thumb', label: 'Input size to complexity' }) +
          h.list(['About 10⁸ simple operations fit in one second in C++ or Java; Python and JS manage roughly 10⁷. Treat these as guides, not guarantees.', 'Sorting any comparison-based way is Ω(n log n).'])) +
        '</div>' +
        h.sec('Habits that keep the answer honest', h.list([
          '**Amortized** means averaged over a sequence of operations, with no randomness: dynamic-array append is O(1) amortized even though one append can cost O(n).',
          '**Average vs worst** is about inputs and hashing, **amortized** is about sequences. Name which one you mean.',
          '**Space** counts extra memory: recursion stack O(depth), a copied substring O(k), and the output only if you are asked to count it. See [[big-o|the Big-O lesson]].',
          'Drop constants and lower terms, but keep two variables when two things grow: a grid is O(R·C), a graph is O(V+E), a string match is O(n+m).',
          'Log base never matters in Big-O. Python `in` on a list is O(n), on a set or dict it is O(1) average.'
        ]), 'cs-habits');
    }
  });
})();
