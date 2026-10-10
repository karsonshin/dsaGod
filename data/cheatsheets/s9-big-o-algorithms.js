/* Cheat sheet 9: Big-O for every algorithm. Companion to s1-bigo.js (data structures). */
(function () {
  var OR = (window.OR = window.OR || {});
  var HEAD = ['Algorithm', 'Time (avg / worst)', 'Extra space', 'When to use / the trap'];
  OR.cheatsheets.push({
    n: 9, id: 'big-o-algorithms', pages: 2, title: 'Big-O for every algorithm we cover',
    blurb: 'Time and extra space for each algorithm and technique in the curriculum, grouped by topic, with the trap that goes with each.',
    keywords: 'complexity time space algorithm sorting dp graph dijkstra bellman floyd kruskal prim kmp sieve segment fenwick backtracking',
    render: function (h) {
      function t(title, rows, cls) { return h.sec(title, h.T(HEAD, rows, { cls: 'cs-alg ' + (cls || ''), label: title })); }
      var est = h.sec('How to estimate from the input size', h.cols(
        h.T(['n up to', 'Aim for'], [
          ['10', 'O(n!)'], ['20', 'O(2ⁿ)'], ['500', 'O(n³)'], ['5,000', 'O(n²)'], ['10⁵ to 10⁶', 'O(n log n) or O(n)'], ['10⁹ and up', 'O(log n) or O(1)']
        ], { cls: 'cs-thumb', label: 'Input size to complexity' }),
        h.list([
          'Growth, slowest to fastest: **1 < log n < √n < n < n log n < n² < n³ < 2ⁿ < n! < nⁿ**.',
          'Rough budget: 10⁸ simple steps per second in C++ or Java, about 10⁷ in Python. A guide, not a guarantee.',
          'Constraints name the intended answer: n ≤ 20 means bitmask or subsets; n ≤ 10⁵ means sort, heap, binary search or one pass.',
          'Data structures are on the other Big-O sheet and in [[big-o|the Big-O lesson]]; this sheet is the algorithms.'
        ])), 'cs-estimate');

      return est +
        t('Arrays: [[arrays-hashing]], [[two-pointers]], [[sliding-window]], [[prefix-sums]], [[kadane]]', [
          ['Hash map lookup (two sum, count, group)', 'O(n); each lookup avg O(1), worst O(n)', 'O(n)', 'Memory for speed. Hashing a string costs O(L). Group anagrams: O(n·k log k) sorted keys.'],
          ['Two pointers (sorted)', 'O(n); +O(n log n) to sort', 'O(1)', 'Needs sorted data or a monotone rule. 3Sum: sort, fix one, sweep two = O(n²).'],
          ['Sliding window', 'O(n): each item enters and leaves once', 'O(1) to O(alphabet)', 'Inner `while` shrink is still O(n) total. Negatives break it; use prefix sums.'],
          ['Prefix sums (1-D, 2-D), difference array', 'build O(n) or O(R·C); query O(1); range add O(1)', 'O(n) or O(R·C)', 'Static data. Subarray sum = k: prefix + hash map, O(n). Interleaved reads cost O(n) rebuilds.'],
          ['Kadane (max subarray)', 'O(n)', 'O(1)', 'All-negative input: start from `nums[0]`, not 0.']
        ]) +
        t('Stacks and monotonic structures: [[stacks]], [[monotonic]], [[queues]]', [
          ['Stack matching (brackets, evaluate)', 'O(n)', 'O(n)', 'Each item pushed and popped once. Check empty before popping.'],
          ['Monotonic stack (next greater, histogram)', 'O(n); amortized O(1) per item', 'O(n)', '`while` inside `for` is not O(n²): pops never exceed pushes.'],
          ['Monotonic deque (window max)', 'O(n)', 'O(k)', 'Drop the front when its index leaves the window. A lazy-deletion heap is O(n log n).']
        ]) +
        t('Searching, sorting, recursion: [[binary-search]], [[sorting]], [[recursion]]', [
          ['Binary search (bounds, rotated, on the answer)', 'O(log n); on the answer O(log range × check); rotated with duplicates O(n) worst', 'O(1)', 'Needs a monotone yes/no. Off-by-one: `lo <= hi` vs `lo < hi`, `mid` vs `mid + 1`. Median of two sorted arrays: O(log min(m, n)).'],
          ['Bubble / insertion / selection sort', 'O(n²); bubble and insertion best O(n)', 'O(1)', 'Bubble, insertion stable; selection not. Insertion is best on tiny or nearly sorted data.'],
          ['Merge sort', 'O(n log n) always', 'O(n)', 'Stable. Good for linked lists and counting inversions.'],
          ['Quick sort', 'avg O(n log n) / worst O(n²)', 'O(log n) avg stack', 'Not stable. Sorted input + bad pivot = worst case; randomize the pivot.'],
          ['Heap sort', 'O(n log n) always', 'O(1)', 'In place, not stable.'],
          ['Counting / radix / bucket sort', 'counting O(n+k); radix O(d(n+b)); bucket avg O(n+k), worst O(n²)', 'O(n+k)', 'Beat n log n only on small integer ranges. Counting and radix are stable.'],
          ['Python `sort` / `sorted` (Timsort)', 'O(n log n); O(n) if sorted', 'O(n)', 'Stable. `sorted` copies; `.sort()` is in place.'],
          ['Quickselect (k-th element)', 'avg O(n) / worst O(n²)', 'O(1)', 'A size-k heap gives a guaranteed O(n log k).'],
          ['Recursion: fib naive / memo; T(n) = 2T(n/2) + n', 'O(2ⁿ) / O(n); O(n log n)', 'O(depth)', 'Overlapping subproblems: memoize. Python recursion limit is about 1000.']
        ]) +
        t('Backtracking: [[backtracking]]', [
          ['Subsets / permutations', 'O(n·2ⁿ) / O(n·n!)', 'O(n)', 'Output size is the bound; permutations only for n up to about 10. Duplicates: sort, skip equal siblings.'],
          ['Combinations, combination sum, N-Queens', 'O(k·C(n, k)); sum exponential; N-Queens about O(n!)', 'O(n)', 'Prune early (sort, `break` past the target). N-Queens: sets for column and diagonals make checks O(1).'],
          ['Word search (grid DFS)', 'O(R·C·3^L)', 'O(L)', 'Mark visited in place, restore it. A trie prunes many words (Word Search II).']
        ]) +
        t('Greedy and intervals: [[greedy]], [[intervals]]', [
          ['Sort-then-scan greedy; merge / insert intervals', 'O(n log n); insert into sorted O(n)', 'O(1) to O(n)', 'Sort by **end** to maximize count, by **start** to merge. Needs an exchange argument. Decide if `[1,2]` and `[2,3]` merge.'],
          ['Jump game, gas station, one-pass stock', 'O(n)', 'O(1)', 'Track farthest reach or the running tank; no sort.'],
          ['Meeting rooms II; Huffman; task scheduler', 'O(n log n); scheduler O(n)', 'O(n)', 'Heap or sweep over sorted starts and ends. Fractional knapsack is greedy; 0/1 is not.']
        ]) +
        t('Hashing, lists, trees, tries, heaps: [[hashing-internals]], [[linked-lists]], [[trees]], [[tries]], [[heaps]]', [
          ['Rolling hash (Rabin-Karp)', 'avg O(n+m) / worst O(n·m)', 'O(1)', 'Worst case is collisions; verify every hash match.'],
          ['Reverse list, middle, cycle (Floyd), merge', 'O(n); merge two O(m+n); sort list O(n log n)', 'O(1)', 'Dummy head removes empty/head special cases. Floyd needs no visited set.'],
          ['Tree DFS / BFS, serialize, diameter', 'O(n)', 'DFS O(h); BFS O(width)', 'h = log n balanced, n skewed. Diameter: compute with height in one pass.'],
          ['BST search / insert / delete; LCA', 'avg O(log n) / worst O(n); LCA O(h) (general tree O(n))', 'O(h)', 'Sorted insertions give a chain. Validate with bounds, not parent vs child.'],
          ['Trie insert / search / prefix', 'O(L)', 'O(chars × alphabet)', 'Cost depends on the word length, not the word count.'],
          ['Heap push / pop / peek / heapify', 'O(log n) / O(log n) / O(1) / **O(n)**', 'O(n)', 'Heapify beats n pushes. `heapq` is a min-heap; negate for max.'],
          ['Top-k (size-k heap); merge k lists; two-heap median', 'O(n log k); O(N log k); add O(log n), median O(1)', 'O(k); O(k); O(n)', 'Min-heap of the k largest. Merge heap holds one head per list. Rebalance two heaps to within 1.']
        ]) +
        t('Graphs: [[graphs]], [[topo-sort]], [[union-find]], [[shortest-paths]], [[mst]], [[advanced-graphs]]', [
          ['BFS / DFS; cycle, bipartite, components', 'O(V+E); grid O(R·C)', 'O(V)', 'Matrix: O(V²). Mark visited on enqueue. BFS = shortest path only if unweighted.'],
          ['Topological sort (Kahn / DFS)', 'O(V+E) both', 'O(V)', 'Fewer than V nodes out means a cycle.'],
          ['Union-find (find, union)', 'amortized O(α(n)) ≈ O(1)', 'O(n)', 'Needs path compression **and** union by size. Cannot split.'],
          ['Dijkstra: heap / array scan; 0-1 BFS', 'heap O((V+E) log V); array O(V²); 0-1 BFS O(V+E)', 'O(V)', 'Non-negative weights only. Array wins when dense. Skip stale heap entries.'],
          ['Bellman-Ford', 'O(V·E)', 'O(V)', 'Negative edges OK; a V-th round that relaxes = negative cycle. "At most k edges": k rounds.'],
          ['Floyd-Warshall', 'O(V³)', 'O(V²)', 'All pairs, V up to a few hundred. Loop **k outermost**.'],
          ['Kruskal / Prim (heap, array)', 'Kruskal O(E log E); Prim heap O(E log V), array O(V²)', 'O(V)', 'Kruskal: sort edges + union-find. Prim: grow one tree; array version if dense.'],
          ['Tarjan (bridges, articulation, SCC); Kosaraju', 'O(V+E)', 'O(V) (Kosaraju O(V+E))', 'One DFS with low-link values; DFS root is special. Kosaraju: DFS, reverse edges, DFS.'],
          ['Euler path (Hierholzer)', 'O(E); sorted edges O(E log E)', 'O(E)', 'Check degrees first. Itinerary: smallest-first heap, post-order, reverse.']
        ]) +
        t('Dynamic programming: [[dp-1d]], [[dp-2d]], [[knapsack]], [[string-dp]], [[lis]], [[interval-dp]], [[tree-dp]], [[bitmask-dp]]', [
          ['1-D DP (climb, rob); coin change; word break', 'O(n); O(amount × coins); word break O(n²) (slicing: up to O(n³))', 'O(n); O(amount)', 'Rolling variables cut O(n) to O(1). Coin change is pseudo-polynomial (value, not digits).'],
          ['Grid paths / min path sum', 'O(R·C)', 'O(C) rolling', 'Each row depends only on the row above.'],
          ['0/1 knapsack, subset sum', 'O(n·W)', 'O(W)', '1-D array: capacity **downward** (0/1), **upward** (unbounded). Pseudo-polynomial.'],
          ['LCS, edit distance', 'O(m·n)', 'O(m·n) / O(min) rolling', 'Rolling loses the path; keep the table to print it.'],
          ['Longest palindromic substring', 'expand O(n²); Manacher O(n)', 'O(1) / O(n)', 'Expand around centers beats the O(n²)-space table.'],
          ['LIS: DP / tails + binary search', 'O(n²) / O(n log n)', 'O(n)', '`tails` length is the answer; the array is not a real subsequence.'],
          ['Interval DP; tree DP', 'O(n³); O(n)', 'O(n²); O(h)', 'Interval: by length, start, split. Tree: return a small tuple per node.'],
          ['Bitmask DP (TSP, assignment)', 'O(2ⁿ·n); TSP O(2ⁿ·n²)', 'O(2ⁿ·n)', 'n up to about 20. Iterate masks in increasing order.']
        ]) +
        t('Bits, math, advanced structures, strings: [[bits]], [[math]], [[segment-tree]], [[fenwick]], [[string-algos]], [[design-ds]]', [
          ['Bit tricks (xor, `n & (n-1)`, lowbit); subsets by mask', 'O(1) per op; popcount loop O(set bits); all subsets O(n·2ⁿ)', 'O(1)', 'XOR cancels pairs. Python ints are unbounded: mask negatives.'],
          ['Sieve; GCD; fast power; nCr tables', 'O(n log log n); O(log min(a, b)); O(log e); precompute O(n), query O(1)', 'O(n) / O(1)', 'Sieve marks from p². `pow(a, e, mod)` is built in. Fermat inverse needs a prime modulus. Trial division: O(√n) per number.'],
          ['Segment tree', 'build O(n); query / update O(log n); lazy range update O(log n)', 'O(n) (2n to 4n)', 'Any associative merge. Lazy tags are where bugs live.'],
          ['Fenwick tree', 'build O(n); query / update O(log n)', 'O(n)', '1-indexed; invertible operation only (sum, xor). Inversions: O(n log n).'],
          ['KMP / Z-function', 'O(n+m) (naive O(n·m))', 'O(m) / O(n+m)', 'The text pointer never moves back.'],
          ['LRU / LFU, O(1) random set, hit counter', 'O(1) per op (random set: average)', 'O(capacity)', 'Hash map + doubly linked list; Python `OrderedDict` does LRU.']
        ]);
    }
  });
})();
