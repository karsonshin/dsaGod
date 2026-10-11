(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  var L = function () { return Array.prototype.join.call(arguments, '\n'); };
  var BO = ['#/cheatsheets/big-o'];
  OR.qa.push(
    // ---------- (1) Complexity ----------
    {
      id: 'cx-big-o-meaning', title: 'What Big-O, Big-Omega and Big-Theta mean',
      q: ['what is big o notation', 'big o vs big theta vs big omega', 'what does O(n) mean', 'explain asymptotic notation', 'difference between big o and theta'],
      tags: 'big-o big-omega big-theta asymptotic upper bound lower bound tight bound notation',
      a: "Big-O is an upper bound on growth, Big-Omega is a lower bound, and Big-Theta is both at once (a tight bound). They describe how a cost grows with input size n, ignoring constants and small terms.",
      more: "- `3n + 10` is O(n), Omega(n) and Theta(n); it is also O(n^2) (true but loose).\n- In interviews people say \"O(n)\" and usually mean the tight bound.\n- Big-O is about growth, not speed: an O(n) code with a huge constant can lose to O(n log n) on small n.\n- The bound type is separate from the case: you can state a worst-case Theta or a best-case Omega.",
      see: ['#/topic/big-o', '#/cheatsheets/big-o']
    },
    {
      id: 'cx-time-loops', title: 'How to compute time complexity of loops',
      q: ['how to calculate time complexity', 'time complexity of nested loops', 'how do i find the big o of my code', 'time complexity of a for loop', 'loop that halves i each time complexity'],
      tags: 'time complexity loops nested loop count iterations log n analysis',
      a: "Count how many times the innermost statement runs as a function of n. One loop over n is O(n); nested loops multiply (n * n = O(n^2)); sequential loops add (keep the biggest); a loop whose variable doubles or halves is O(log n).",
      code: { py: L('def f(n):', '    c = 0', '    for i in range(n):          # n times', '        for j in range(n):      # n times each -> n*n', '            c += 1', '    i = 1', '    while i < n:                # log2(n) times', '        i *= 2', '        c += 1', '    return c', '', 'print(f(8))  # 64 + 3 = 67'), },
      check: 'assert f(8) == 67\nassert f(1) == 1',
      more: "- Inner loop `for j in range(i)` runs 0+1+...+(n-1) = n(n-1)/2 times: still O(n^2).\n- Inner loop that depends on a halving variable gives n + n/2 + n/4 ... = O(n).\n- Drop constants and lower terms: `n^2 + n + 5` is O(n^2).\n- Don't forget hidden costs: slicing, `in` on a list, string concatenation.",
      cx: 'nested n x n: O(n^2); doubling loop: O(log n)', see: ['#/topic/big-o', '#/cheatsheets/big-o']
    },
    {
      id: 'cx-time-recursion', title: 'Time complexity of a recursive function',
      q: ['how to find time complexity of recursion', 'recurrence relation', 'solve recurrence T(n)', 'time complexity of recursive fibonacci', 'recursion tree method'],
      tags: 'recursion recurrence relation recursion tree time complexity branching factor depth',
      a: "Write the recurrence (work per call plus calls made), then count the recursion tree: roughly (calls per level) x (work per call) summed over the levels. Number of calls is about branching^depth, so two calls that each shrink n by 1 give O(2^n).",
      more: "- `T(n) = T(n-1) + O(1)` is O(n) (linear chain).\n- `T(n) = 2T(n-1) + O(1)` is O(2^n) (naive Fibonacci is about O(1.6^n)).\n- `T(n) = T(n/2) + O(1)` is O(log n) (binary search).\n- `T(n) = 2T(n/2) + O(n)` is O(n log n) (merge sort).\n- With memoization, count distinct states times work per state.",
      see: ['#/topic/recursion', '#/topic/big-o']
    },
    {
      id: 'cx-master-theorem', title: 'Master theorem basics',
      q: ['what is the master theorem', 'master theorem examples', 'solve T(n) = 2T(n/2) + n', 'divide and conquer recurrence formula', 'master method cases'],
      tags: 'master theorem recurrence divide conquer T(n) aT(n/b) log base cases',
      a: "For `T(n) = a*T(n/b) + O(n^d)`, compare d with log_b(a). If d < log_b(a) the answer is O(n^(log_b a)); if equal it is O(n^d log n); if d > log_b(a) it is O(n^d).",
      more: "- Merge sort: a=2, b=2, d=1, log_2(2)=1 equal -> O(n log n).\n- Binary search: a=1, b=2, d=0, log_2(1)=0 equal -> O(log n).\n- Karatsuba-style a=3, b=2, d=1: log_2(3)=1.58 > 1 -> O(n^1.58).\n- Idea: leaves dominate, every level equal, or the root dominates.\n- It needs equal-size subproblems; for uneven splits draw the recursion tree.",
      cx: 'T(n)=aT(n/b)+n^d', see: ['#/topic/recursion', '#/topic/sorting']
    },
    {
      id: 'cx-amortized-append', title: 'Why list append is amortized O(1)',
      q: ['why is list append O(1)', 'amortized analysis dynamic array', 'amortized time of append', 'how does python list grow', 'dynamic array resizing cost'],
      tags: 'amortized append dynamic array resize doubling capacity list vector arraylist growth',
      a: "A dynamic array occasionally copies everything into a bigger array, but if capacity grows geometrically (e.g. doubles), the copies total less than 2n over n appends, so each append costs O(1) on average. One single append can still cost O(n).",
      code: { py: L('class Dyn:', '    def __init__(self):', '        self.cap, self.n, self.copies = 1, 0, 0', '        self.a = [None]', '    def append(self, x):', '        if self.n == self.cap:', '            self.cap *= 2', '            b = [None] * self.cap', '            for i in range(self.n):', '                b[i] = self.a[i]; self.copies += 1', '            self.a = b', '        self.a[self.n] = x; self.n += 1', '', 'd = Dyn()', 'for i in range(1000): d.append(i)', 'print(d.copies)  # 1023 < 2*1000'), },
      check: 'assert d.copies < 2 * d.n\nassert d.a[999] == 999',
      more: "- Resize cost 1+2+4+...+n/2 < n, so total < 3n work for n appends.\n- Amortized means averaged over a sequence of operations, with no probability involved.\n- Growing by a fixed amount (+10) would be O(n^2) total.\n- Same logic: Java ArrayList, C++ vector, JS arrays.",
      cx: 'amortized O(1) per append; worst single append O(n)', see: ['#/topic/big-o', '#/topic/arrays-hashing']
    },
    {
      id: 'cx-amortized-hash', title: 'Hash table resizing and amortized cost',
      q: ['is dict insert really O(1)', 'hash map resize cost', 'rehashing amortized', 'why hash table insert amortized constant', 'when does a hash table resize'],
      tags: 'hash table dict resize rehash load factor amortized insert average case',
      a: "A hash table insert is O(1) on average and amortized: when the load factor passes a threshold the table doubles and every key is rehashed (O(n)), but doubling makes that rare enough to spread to O(1) per insert. Worst case (all keys collide) is O(n).",
      more: "- Two separate claims: *average* O(1) relies on a good hash function; *amortized* O(1) comes from geometric resizing.\n- A single insert that triggers a resize is slow, which matters for latency-sensitive code.\n- Python dicts keep ordering by insertion and resize in a similar spirit.",
      see: ['#/topic/hashing-internals', '#/topic/arrays-hashing']
    },
    {
      id: 'cx-space-complexity', title: 'Space complexity and the recursion stack',
      q: ['what is space complexity', 'does recursion use extra space', 'auxiliary space vs total space', 'space complexity of recursive dfs', 'recursion stack space'],
      tags: 'space complexity memory auxiliary recursion stack call stack depth extra space',
      a: "Space complexity is the extra memory an algorithm needs as n grows. Count data structures you build plus the call stack: a recursion that goes d frames deep uses O(d) stack space even if it allocates nothing else.",
      more: "- Input storage is usually not counted (auxiliary space only), but say which you mean.\n- Recursive DFS on a tree: O(height) stack; a skewed tree is O(n), a balanced one O(log n).\n- Merge sort: O(n) buffer plus O(log n) stack.\n- Iterative loops with a few variables: O(1).\n- Python's default recursion limit is about 1000 frames.",
      see: ['#/topic/recursion', '#/topic/big-o']
    },
    {
      id: 'cx-best-avg-worst', title: 'Best, average and worst case',
      q: ['best case vs worst case vs average case', 'what is worst case complexity', 'why do we use worst case', 'average case time complexity meaning', 'quicksort worst case why'],
      tags: 'best case worst case average case expected input distribution complexity quicksort',
      a: "Worst case is the most work any input of size n can force; best case is the least; average case is the expected work over an assumed input distribution. Interviews default to worst case unless you say otherwise, because it is a guarantee.",
      more: "- Linear search: best O(1), worst O(n).\n- Quicksort with a bad pivot: worst O(n^2), average O(n log n) with random pivots.\n- Hash lookup: average O(1), worst O(n).\n- Don't confuse the case with the notation: Big-O can bound any case.",
      see: ['#/topic/big-o', '#/topic/sorting']
    },
    {
      id: 'cx-growth-ranked', title: 'Common growth rates ranked',
      q: ['big o complexity order from fastest to slowest', 'rank time complexities', 'is n log n better than n squared', 'O(1) O(log n) O(n) order', 'complexity classes list'],
      tags: 'growth rates ranking complexity order constant logarithmic linear linearithmic quadratic exponential factorial',
      a: "From best to worst: O(1) < O(log n) < O(sqrt n) < O(n) < O(n log n) < O(n^2) < O(n^3) < O(2^n) < O(n!). Polynomial rates are practical; exponential and factorial only work for tiny n.",
      more: "- O(log n): binary search, balanced-tree ops, heap push/pop.\n- O(n log n): efficient comparison sorts.\n- O(n^2): pairs, simple DP tables.\n- O(2^n): subsets. O(n!): permutations.\n- At n = 20, 2^n is about a million; at n = 50 it is hopeless.",
      cx: 'O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n) < O(n!)', see: BO
    },
    {
      id: 'cx-input-size-guide', title: 'Input size to target complexity',
      q: ['what complexity do i need for n = 10^5', 'constraints to complexity', 'is n squared ok for n = 1000', 'how to guess algorithm from constraints', 'n up to 10^6 what complexity'],
      tags: 'constraints input size n limit time limit 10^8 operations per second estimate complexity target',
      a: "Rule of thumb: a typical judge does about 10^7 to 10^8 simple operations per second in compiled languages and fewer in Python. n <= 20 allows O(2^n); n <= 500 allows O(n^3); n <= 5,000 allows O(n^2); n <= 10^5 to 10^6 needs O(n log n) or O(n); n >= 10^9 needs O(log n) or math.",
      more: "- This is a rule of thumb, not a law: constants and language matter (Python is roughly 10-50x slower than C++).\n- n <= 10 hints permutations (n!).\n- n <= 40 can mean meet-in-the-middle.\n- Aim a level below the limit if Python.",
      cx: 'n<=20: 2^n | n<=500: n^3 | n<=5000: n^2 | n<=1e6: n log n', see: BO
    },
    {
      id: 'cx-python-op-costs', title: 'Time cost of common Python operations',
      q: ['python list operations time complexity', 'is x in list O(n)', 'python dict get complexity', 'cost of list insert at front', 'python string concatenation complexity', 'time complexity of len and slicing'],
      tags: 'python complexity list dict set deque in pop insert slice append sort cost operations',
      a: "List: append/pop() O(1) amortized, index O(1), `in` O(n), insert/pop(0)/del at front O(n), slice O(k), sort O(n log n). Dict/set: get, set, `in`, delete O(1) average. deque: append/popleft O(1). `len` is O(1).",
      code: { py: L('from collections import deque', 'import timeit', 'xs = list(range(20000)); s = set(xs); dq = deque(xs)', 'dq.popleft()          # O(1)', 'xs.pop(0)             # O(n)', 'print(19999 in s)     # O(1) avg', 'print(19999 in xs)    # O(n)'), },
      check: 'assert 19999 in s and 19999 in xs\nassert len(dq) == 19999',
      more: "- `s += \"x\"` in a loop can be O(n^2) overall; collect pieces and `\"\".join(parts)`.\n- `list(a) + list(b)` copies both.\n- `heapq.heappush/heappop` O(log n); `heapify` O(n).\n- `min/max/sum` over a list is O(n).",
      see: ['#/cheatsheets/python', '#/cheatsheets/big-o-algorithms']
    },
    {
      id: 'cx-sort-lower-bound', title: 'Why comparison sorting needs n log n',
      q: ['why is sorting n log n', 'lower bound for comparison sort', 'can we sort faster than n log n', 'decision tree sorting proof', 'sorting lower bound'],
      tags: 'sorting lower bound comparison sort decision tree n log n counting sort radix',
      a: "Any sort that only compares elements must distinguish n! orderings, and each comparison gives at most 2 outcomes, so it needs at least log2(n!) comparisons, which is Theta(n log n). Non-comparison sorts (counting, radix) beat it by using the values themselves.",
      more: "- Picture a binary decision tree with n! leaves; its height is at least log2(n!) ~ n log n.\n- Counting sort is O(n + k) for integer keys in range k.\n- Radix sort is O(d * (n + b)).\n- The bound holds for worst case; for average case it also holds.",
      see: ['#/topic/sorting']
    },

    // ---------- (2) Definitions ----------
    {
      id: 'cx-stable-sort', title: 'What is a stable sort',
      q: ['what is a stable sort', 'stable vs unstable sorting', 'is python sort stable', 'why does sort stability matter', 'which sorting algorithms are stable'],
      tags: 'stable sort stability equal keys order preserved merge sort insertion sort quicksort heapsort',
      a: "A stable sort keeps equal elements in their original relative order. Python's `sorted` and `list.sort` are stable; merge sort, insertion sort and counting sort are stable, quicksort and heapsort usually are not.",
      code: { py: L('people = [("bo", 30), ("al", 25), ("cy", 30), ("di", 25)]', 'by_age = sorted(people, key=lambda p: p[1])', 'print(by_age)  # al before di, bo before cy'), },
      check: "assert by_age == [('al',25),('di',25),('bo',30),('cy',30)]\nassert sorted([], key=len) == []",
      more: "- Useful for multi-key sorts: sort by the secondary key first, then by the primary key.\n- Only matters when elements can be equal under the key but still distinguishable.",
      see: ['#/topic/sorting']
    },
    {
      id: 'cx-in-place', title: 'What does in-place mean',
      q: ['what is an in-place algorithm', 'in place vs out of place', 'in-place sorting meaning', 'what does O(1) extra space mean', 'is reversing a list in place'],
      tags: 'in-place algorithm extra space constant space modify input swap reverse',
      a: "An in-place algorithm transforms its input using only O(1) extra memory (a few variables), overwriting the input instead of building a copy. Reversing with two swapping pointers is in place; `nums[::-1]` is not because it builds a new list.",
      code: { py: L('def reverse_in_place(a):', '    i, j = 0, len(a) - 1', '    while i < j:', '        a[i], a[j] = a[j], a[i]', '        i += 1; j -= 1', '', 'x = [1, 2, 3, 4]', 'reverse_in_place(x)', 'print(x)  # [4, 3, 2, 1]'), },
      check: 'assert x == [4,3,2,1]\ny=[]; reverse_in_place(y); assert y == []',
      more: "- Quicksort and heapsort are \"in place\" (quicksort still uses O(log n) stack on average).\n- Strictness varies; say what you count.\n- The trade-off: in place mutates the caller's data.",
      see: ['#/topic/two-pointers']
    },
    {
      id: 'cx-amortized-def', title: 'What does amortized mean',
      q: ['what is amortized time', 'amortized vs average case', 'define amortized analysis', 'amortized O(1) meaning', 'amortized complexity explained simply'],
      tags: 'amortized analysis average over sequence operations cost spread potential',
      a: "Amortized cost is the total cost of a sequence of n operations divided by n, guaranteed in the worst case. A few operations may be expensive, but they pay for themselves across many cheap ones. It is not a probability-based average.",
      more: "- Example: appending to a dynamic array, a stack with multipop, union-find with path compression.\n- Average case averages over random inputs; amortized averages over operations on any input.\n- Consequence: one operation can still be slow.",
      see: ['#/topic/big-o']
    },
    {
      id: 'cx-memoization', title: 'What is memoization',
      q: ['what is memoization', 'memoization example python', 'how does lru_cache work', 'cache recursive results', 'top-down dynamic programming'],
      tags: 'memoization memo cache top-down dp lru_cache functools recursion overlapping subproblems',
      a: "Memoization stores the result of a function for each distinct input so repeated calls return the cached value instead of recomputing. Add it to a pure recursive function to turn exponential time into time proportional to the number of distinct states.",
      code: { py: L('from functools import lru_cache', '', '@lru_cache(maxsize=None)', 'def fib(n):', '    return n if n < 2 else fib(n - 1) + fib(n - 2)', '', 'print(fib(50))  # 12586269025'), },
      check: 'assert fib(50) == 12586269025\nassert fib(0) == 0 and fib(1) == 1',
      more: "- Arguments must be hashable.\n- The function must be pure (same inputs, same output).\n- Deep recursion can still hit Python's recursion limit.",
      see: ['#/topic/recursion', '#/topic/dp-1d']
    },
    {
      id: 'cx-tabulation', title: 'What is tabulation (bottom-up DP)',
      q: ['what is tabulation', 'bottom up dynamic programming', 'dp table iterative', 'tabulation example', 'convert recursion to bottom-up'],
      tags: 'tabulation bottom-up dp table iterative fill order base case',
      a: "Tabulation solves a DP problem iteratively: fill a table from the base cases upward so each state's dependencies are already computed. It avoids recursion and makes it easy to keep only the last few rows.",
      code: { py: L('def fib(n):', '    if n < 2: return n', '    prev, cur = 0, 1', '    for _ in range(n - 1):', '        prev, cur = cur, prev + cur', '    return cur', '', 'print(fib(50))  # 12586269025'), },
      check: 'assert fib(50) == 12586269025\nassert fib(0) == 0 and fib(2) == 1',
      more: "- Steps: define the state, base cases, recurrence, and fill order.\n- Fill order must respect dependencies.\n- Space can usually shrink to one or two rows (as above, O(1)).",
      see: ['#/topic/dp-1d', '#/cheatsheets/dp-catalog']
    },
    {
      id: 'cx-tail-recursion', title: 'What is tail recursion',
      q: ['what is tail recursion', 'tail call optimization', 'does python optimize tail recursion', 'tail recursive vs recursive', 'convert recursion to loop'],
      tags: 'tail recursion tail call optimization TCO stack overflow loop accumulator recursion limit',
      a: "A recursive call is a tail call when it is the last thing the function does (nothing left to do after it returns). Languages with tail-call optimization reuse the stack frame; Python and Java do not, so rewrite deep tail recursion as a loop.",
      code: { py: L('def total_rec(n, acc=0):      # tail form, still O(n) stack in Python', '    return acc if n == 0 else total_rec(n - 1, acc + n)', '', 'def total_loop(n):', '    acc = 0', '    while n:', '        acc += n; n -= 1', '    return acc', '', 'print(total_loop(100000))  # 5000050000'), },
      check: 'assert total_loop(100000) == 5000050000\nassert total_rec(10) == 55',
      more: "- Tail form passes the running result in an accumulator parameter.\n- In Python depth over about 1000 raises RecursionError.",
      see: ['#/topic/recursion']
    },
    {
      id: 'cx-hash-collision', title: 'What is a hash collision',
      q: ['what is a hash collision', 'how are collisions handled in hash table', 'chaining vs open addressing', 'two keys same hash', 'collision resolution'],
      tags: 'hash collision chaining open addressing linear probing bucket hash function',
      a: "A collision is when two different keys hash to the same bucket. Tables resolve it by chaining (each bucket holds a list of entries) or open addressing (probe other slots, e.g. linear probing). Good hashing and resizing keep chains short.",
      more: "- Collisions are unavoidable (pigeonhole), only rarer with a good hash.\n- With chaining, lookup walks the chain: O(chain length).\n- Open addressing needs a low load factor; deletes need tombstones.\n- Python dicts use open addressing.",
      see: ['#/topic/hashing-internals']
    },
    {
      id: 'cx-load-factor', title: 'What is load factor',
      q: ['what is load factor in hash table', 'load factor meaning', 'when does hashmap resize', 'java hashmap load factor 0.75', 'why keep load factor low'],
      tags: 'load factor hash table resize threshold entries buckets rehash 0.75',
      a: "Load factor = number of entries / number of buckets. When it crosses a threshold (Java's HashMap default is 0.75) the table grows and rehashes, keeping chains short and lookups near O(1).",
      more: "- Lower threshold: fewer collisions, more memory.\n- Higher threshold: less memory, slower lookups.\n- Open addressing requires load factor below 1; chaining can exceed 1.",
      see: ['#/topic/hashing-internals']
    },
    {
      id: 'cx-perfect-hash', title: 'What is a perfect hash',
      q: ['what is perfect hashing', 'perfect hash function', 'minimal perfect hash', 'hash with no collisions', 'static hash table without collisions'],
      tags: 'perfect hash function no collisions static set minimal perfect keys known in advance',
      a: "A perfect hash function maps a fixed, known set of keys to distinct slots with zero collisions, so lookups are O(1) in the worst case. It only works when the key set is known up front (keyword tables, compilers).",
      more: "- A minimal perfect hash also uses exactly n slots for n keys.\n- Built offline; adding a key means rebuilding.\n- General-purpose hash tables accept collisions instead.",
      see: ['#/topic/hashing-internals']
    },
    {
      id: 'cx-balanced-tree', title: 'What is a balanced tree',
      q: ['what is a balanced binary tree', 'balanced vs unbalanced tree', 'why balance a bst', 'avl vs red black tree', 'height balanced tree leetcode'],
      tags: 'balanced tree height AVL red-black self-balancing log n skewed height difference',
      a: "A balanced tree keeps its height O(log n), commonly by making the two subtree heights of every node differ by at most 1. Self-balancing trees (AVL, red-black) rotate on insert/delete so search, insert and delete stay O(log n).",
      more: "- An unbalanced BST built from sorted input degenerates into a linked list with O(n) operations.\n- LeetCode 110 uses the height-difference definition.\n- You rarely implement AVL in interviews; know why it exists.",
      see: ['#/topic/trees']
    },
    {
      id: 'cx-full-complete-perfect', title: 'Full vs complete vs perfect binary tree',
      q: ['full vs complete binary tree', 'perfect binary tree definition', 'complete binary tree meaning', 'types of binary trees', 'is a heap a complete tree'],
      tags: 'full complete perfect binary tree definition heap array levels nodes',
      a: "Full: every node has 0 or 2 children. Complete: every level is filled except possibly the last, which fills left to right. Perfect: all internal nodes have 2 children and all leaves share one depth (2^(h+1)-1 nodes).",
      more: "- Heaps are complete trees, which lets them live in an array: children of i at 2i+1 and 2i+2.\n- A perfect tree is both full and complete.\n- Complete does not imply full, and full does not imply complete.",
      see: ['#/topic/trees', '#/topic/heaps']
    },
    {
      id: 'cx-dag', title: 'What is a DAG',
      q: ['what is a dag', 'directed acyclic graph', 'how to check if graph is a dag', 'dag examples', 'why are dags important'],
      tags: 'DAG directed acyclic graph cycle dependency topological order course schedule',
      a: "A DAG is a directed graph with no cycles. It models dependencies (build order, course prerequisites), and only DAGs have a topological order. To test if a graph is a DAG, run topological sort (Kahn) or DFS cycle detection.",
      more: "- Every DAG has at least one source (no incoming edge) and one sink.\n- Shortest/longest paths in a DAG take O(V + E) by processing in topological order.\n- DP over states is secretly a DAG.",
      see: ['#/topic/topo-sort', '#/topic/graphs']
    },
    {
      id: 'cx-topological-order', title: 'What is a topological order',
      q: ['what is topological sort', 'topological ordering meaning', 'topological order of a graph', 'is topological order unique', 'when can you topologically sort'],
      tags: 'topological order sort kahn indegree dependency ordering DAG',
      a: "A topological order lists all vertices of a directed graph so every edge u -> v has u before v. It exists only for DAGs, is usually not unique, and can be computed in O(V + E) with Kahn's algorithm or reversed DFS finish times.",
      code: { py: L('from collections import deque', 'def topo(n, edges):', '    adj = [[] for _ in range(n)]; indeg = [0] * n', '    for u, v in edges:', '        adj[u].append(v); indeg[v] += 1', '    q = deque(i for i in range(n) if indeg[i] == 0)', '    out = []', '    while q:', '        u = q.popleft(); out.append(u)', '        for v in adj[u]:', '            indeg[v] -= 1', '            if indeg[v] == 0: q.append(v)', '    return out if len(out) == n else []  # [] means a cycle', '', 'print(topo(4, [(0, 1), (0, 2), (1, 3), (2, 3)]))'), },
      check: 'assert topo(4, [(0,1),(0,2),(1,3),(2,3)])[0] == 0\nassert topo(2, [(0,1),(1,0)]) == []',
      cx: 'O(V + E)', see: ['#/topic/topo-sort']
    },
    {
      id: 'cx-heapify', title: 'What is heapify',
      q: ['what is heapify', 'heapify time complexity', 'why is build heap O(n)', 'heapq.heapify', 'sift down vs sift up'],
      tags: 'heapify build heap sift down sift up O(n) heapq min heap array',
      a: "Heapify rearranges an arbitrary array into a heap in place by sifting each non-leaf node down, starting from the last parent. Building a heap this way costs O(n), not O(n log n), because most nodes sit near the bottom and sift only a short distance.",
      code: { py: L('import heapq', 'a = [5, 3, 8, 1, 9, 2]', 'heapq.heapify(a)        # O(n), in place', 'print(a[0])            # 1, the minimum', 'print(heapq.heappop(a))  # 1'), },
      check: 'assert [heapq.heappop(a) for _ in range(len(a))] == [2,3,5,8,9]\nb=[]; heapq.heapify(b); assert b == []',
      more: "- heappush/heappop are O(log n).\n- n separate pushes cost O(n log n); heapify beats that.",
      see: ['#/topic/heaps']
    },
    {
      id: 'cx-invariant', title: 'What is an invariant',
      q: ['what is a loop invariant', 'invariant meaning in algorithms', 'how to use invariants', 'binary search invariant', 'what stays true in a loop'],
      tags: 'invariant loop invariant correctness proof binary search window condition always true',
      a: "An invariant is a condition that is true before and after every iteration (or every operation). State it to write correct loops and prove correctness: initialize so it holds, each step preserves it, and at exit it implies the answer.",
      more: "- Binary search invariant: if the target exists, it is inside `[lo, hi]`.\n- Sliding window: the window contains no duplicates.\n- Quicksort partition: everything left of the boundary is <= pivot.\n- When a loop has an off-by-one bug, write the invariant out loud.",
      see: ['#/topic/binary-search']
    },
    {
      id: 'cx-divide-conquer', title: 'What is divide and conquer',
      q: ['what is divide and conquer', 'divide and conquer examples', 'divide and conquer vs dynamic programming', 'merge sort divide and conquer steps', 'when to use divide and conquer'],
      tags: 'divide and conquer split solve combine merge sort quicksort binary search recursion independent subproblems',
      a: "Divide and conquer splits a problem into smaller independent subproblems, solves each recursively, and combines the results. Merge sort, quicksort, binary search and closest-pair all follow it. Unlike DP, its subproblems don't overlap.",
      more: "- Cost is described by a recurrence like T(n) = 2T(n/2) + O(n).\n- If subproblems repeat, cache them: that is DP.\n- The combine step often determines the complexity.",
      see: ['#/topic/recursion', '#/topic/sorting']
    },
    {
      id: 'cx-greedy-property', title: 'What is the greedy choice property',
      q: ['what is the greedy choice property', 'when does greedy work', 'how to prove greedy correct', 'greedy exchange argument', 'greedy vs optimal'],
      tags: 'greedy choice property exchange argument optimal substructure local optimum proof',
      a: "A problem has the greedy choice property when a locally best choice can be extended to a globally optimal solution without revisiting it. It is usually proven with an exchange argument: swap any optimal solution's first choice for the greedy one without making it worse.",
      more: "- Works: interval scheduling by earliest end, Huffman coding, Dijkstra, Kruskal.\n- Fails: coin change with coins {1,3,4} for 6 (greedy 4+1+1, optimal 3+3).\n- Needs optimal substructure too.",
      see: ['#/topic/greedy']
    },
    {
      id: 'cx-optimal-substructure', title: 'What is optimal substructure',
      q: ['what is optimal substructure', 'optimal substructure example', 'dp requirements', 'optimal substructure vs overlapping subproblems', 'when is a problem dp'],
      tags: 'optimal substructure dynamic programming subproblem optimal solution built from optimal sub-solutions',
      a: "Optimal substructure means an optimal solution to the whole problem contains optimal solutions to its subproblems. It is required for DP and greedy. Shortest paths have it (a shortest path's sub-paths are shortest); longest simple path does not.",
      more: "- Test: can you write the answer for state s in terms of answers for smaller states?\n- DP also needs overlapping subproblems to be worth caching.",
      see: ['#/topic/dp-1d', '#/cheatsheets/dp-catalog']
    },
    {
      id: 'cx-overlapping-subproblems', title: 'What are overlapping subproblems',
      q: ['what are overlapping subproblems', 'why does fibonacci have overlapping subproblems', 'overlapping subproblems example', 'how to spot dp problem', 'recursion repeats same calls'],
      tags: 'overlapping subproblems repeated calls recursion tree memoization dp fibonacci',
      a: "Subproblems overlap when the recursion solves the same input many times (naive `fib(n)` recomputes `fib(n-2)` in both branches). That repetition is why caching with memoization or tabulation turns exponential time into polynomial.",
      more: "- Spot it by drawing the recursion tree and looking for repeated labels.\n- Merge sort has no overlap, so no caching is useful.\n- Count of states x work per state gives the DP complexity.",
      see: ['#/topic/dp-1d', '#/topic/recursion']
    },
    {
      id: 'cx-backtracking-pruning', title: 'What is pruning in backtracking',
      q: ['what is pruning', 'backtracking pruning', 'how to prune search tree', 'backtracking optimization', 'cut branches early'],
      tags: 'pruning backtracking constraints early exit search tree branch bound sort skip duplicates',
      a: "Pruning means abandoning a partial solution as soon as it cannot lead to a valid answer, so you never explore its subtree. Check constraints before recursing (sum already too big, queen attacked) and skip duplicates by sorting.",
      code: { py: L('def combo_sum(cands, target):', '    cands.sort(); out = []', '    def go(i, rem, cur):', '        if rem == 0: out.append(cur[:]); return', '        for j in range(i, len(cands)):', '            if cands[j] > rem: break      # prune: sorted, so the rest are too big', '            cur.append(cands[j]); go(j, rem - cands[j], cur); cur.pop()', '    go(0, target, [])', '    return out', '', 'print(combo_sum([2, 3, 6, 7], 7))  # [[2,2,3],[7]]'), },
      check: 'assert combo_sum([2,3,6,7],7) == [[2,2,3],[7]]\nassert combo_sum([2],1) == []',
      more: "- Pruning doesn't change worst-case complexity but often helps a lot.",
      see: ['#/topic/backtracking']
    },
    {
      id: 'cx-monotonic', title: 'What does monotonic mean',
      q: ['what is monotonic', 'monotonic array', 'monotonic stack meaning', 'monotonic function binary search', 'monotone increasing vs strictly increasing'],
      tags: 'monotonic monotone non-decreasing non-increasing strictly increasing stack predicate binary search',
      a: "Monotonic means the values move in only one direction: non-decreasing (each >= previous) or non-increasing. Strictly monotonic forbids equal neighbours. A monotonic predicate (false... then true...) is what makes binary search on the answer work.",
      code: { py: L('def is_monotonic(a):', '    inc = all(a[i] <= a[i + 1] for i in range(len(a) - 1))', '    dec = all(a[i] >= a[i + 1] for i in range(len(a) - 1))', '    return inc or dec', '', 'print(is_monotonic([1, 2, 2, 3]))  # True'), },
      check: 'assert is_monotonic([1,2,2,3]) and is_monotonic([3,2,2]) and not is_monotonic([1,3,2]) and is_monotonic([])',
      more: "- A monotonic stack keeps its contents sorted, popping items that violate the order.",
      see: ['#/topic/monotonic', '#/topic/binary-search']
    },
    {
      id: 'cx-sentinel', title: 'What is a sentinel',
      q: ['what is a sentinel value', 'sentinel node linked list', 'dummy node meaning', 'why use a dummy head', 'sentinel in algorithms'],
      tags: 'sentinel dummy node dummy head guard value infinity boundary simplify edge case',
      a: "A sentinel is a placeholder value or node added at a boundary so the main logic needs no special cases. Typical uses are a dummy head node in linked lists and `float('inf')` as a starting min.",
      code: { py: L('class Node:', '    def __init__(self, v, nxt=None): self.v, self.next = v, nxt', '', 'def remove_val(head, val):', '    dummy = Node(0, head)', '    cur = dummy', '    while cur.next:', '        if cur.next.v == val: cur.next = cur.next.next', '        else: cur = cur.next', '    return dummy.next', '', 'h = remove_val(Node(1, Node(2, Node(1))), 1)', 'print(h.v)  # 2'), },
      check: 'assert h.v == 2 and h.next is None\nassert remove_val(None, 1) is None',
      more: "- Removing the head needs no special case with a dummy.",
      see: ['#/topic/linked-lists']
    },
    {
      id: 'cx-twos-complement', title: "What is two's complement",
      q: ["what is two's complement", 'how are negative numbers stored', 'twos complement representation', 'signed integer binary', 'why is -1 all ones'],
      tags: 'twos complement negative numbers binary signed integer overflow bits invert add one',
      a: "Two's complement represents a negative number as the bit pattern of its positive value inverted, plus 1. In n bits, the range is -2^(n-1) to 2^(n-1)-1, and ordinary addition works unchanged for signed values. -1 is all ones.",
      code: { py: L('def twos(x, bits=8):', '    return format(x & ((1 << bits) - 1), "0%db" % bits)', '', 'print(twos(5), twos(-5))  # 00000101 11111011'), },
      check: "assert twos(-1) == '11111111' and twos(5) == '00000101' and twos(0) == '00000000'",
      more: "- Python integers are unbounded, so mask with `& 0xFFFFFFFF` to emulate 32-bit.\n- There is one zero and an extra negative value (-128 in 8 bits).",
      see: ['#/topic/bits']
    },
    {
      id: 'cx-endianness', title: 'What is endianness',
      q: ['what is endianness', 'big endian vs little endian', 'byte order explained', 'little endian example', 'network byte order'],
      tags: 'endianness big endian little endian byte order memory network x86',
      a: "Endianness is the order in which a multi-byte number's bytes are stored. Big-endian stores the most significant byte first; little-endian stores the least significant first (x86 and most ARM). Network protocols use big-endian.",
      code: { py: L('n = 0x01020304', 'print(n.to_bytes(4, "big").hex())     # 01020304', 'print(n.to_bytes(4, "little").hex())  # 04030201'), },
      check: "assert n.to_bytes(4,'big').hex()=='01020304' and n.to_bytes(4,'little').hex()=='04030201'",
      more: "- It matters for binary files, network code and memory dumps, not for normal arithmetic.",
      see: ['#/topic/bits']
    },
    {
      id: 'cx-unicode-ascii', title: 'Unicode vs ASCII',
      q: ['unicode vs ascii', 'what is utf-8', 'ascii vs utf-8', 'character encoding difference', 'string length bytes vs characters'],
      tags: 'unicode ascii utf-8 encoding code point bytes characters string',
      a: "ASCII maps 128 characters to 7-bit numbers. Unicode assigns a code point to every character in all scripts (over 140,000), and UTF-8 is a variable-length encoding of those code points that is backward-compatible with ASCII.",
      code: { py: L('s = "héllo"', 'print(len(s), len(s.encode("utf-8")))  # 5 6', 'print(ord("A"), chr(97))             # 65 a'), },
      check: 'assert len(s)==5 and len(s.encode())==6 and ord("A")==65 and chr(97)=="a"',
      more: "- In Python `str` is a sequence of code points; `bytes` is raw data.\n- Interview problems usually say \"lowercase letters\", i.e. 26 values.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-immutable-mutable', title: 'Mutable vs immutable in Python',
      q: ['mutable vs immutable python', 'which python types are immutable', 'why are strings immutable', 'can tuple be dict key', 'immutable meaning'],
      tags: 'mutable immutable python list dict set tuple str int frozenset hashable',
      a: "Immutable objects can't change after creation (int, float, str, tuple, frozenset, bytes); mutable ones can (list, dict, set, most classes). Only hashable (effectively immutable) objects work as dict keys or set members.",
      code: { py: L('t = (1, 2); d = {t: "ok"}   # tuples are hashable', 'try:', '    {[1, 2]: "no"}', 'except TypeError as e:', '    print("list is unhashable")', 's = "abc"', 's2 = s + "d"   # new string; s unchanged', 'print(s, s2)'), },
      check: "assert d[(1,2)]=='ok' and s=='abc' and s2=='abcd'",
      more: "- A tuple holding a list is still mutable inside and not hashable.\n- Immutability makes strings safe to share but concatenation in a loop costs O(n^2).",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-pass-by-reference', title: 'Pass by object reference in Python',
      q: ['is python pass by value or reference', 'python function modifies list argument', 'pass by assignment python', 'why did my list change after function', 'python argument passing'],
      tags: 'pass by object reference assignment python function argument mutate rebind alias',
      a: "Python passes references to objects by value: the parameter is a new name bound to the same object. Mutating the object (append) is visible to the caller; rebinding the name (`x = []`) is not.",
      code: { py: L('def f(lst):', '    lst.append(4)      # mutates caller\'s list', '    lst = [9]          # rebinds local name only', '', 'a = [1, 2, 3]', 'f(a)', 'print(a)  # [1, 2, 3, 4]'), },
      check: 'assert a == [1,2,3,4]',
      more: "- Immutable arguments (int, str) can't be mutated, so they look like pass-by-value.\n- Use `lst[:]` or `copy.copy` to protect the caller's data.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-iterator-iterable', title: 'Iterator vs iterable in Python',
      q: ['iterator vs iterable', 'what is an iterator in python', 'iter and next', '__iter__ and __next__', 'difference between iterable and iterator'],
      tags: 'iterator iterable iter next __iter__ __next__ StopIteration for loop protocol',
      a: "An iterable can produce an iterator (it has `__iter__`, e.g. list, str, dict). An iterator is the object that yields items one at a time with `__next__` and raises StopIteration when done; it is single-use. A `for` loop calls `iter()` then `next()` repeatedly.",
      code: { py: L('xs = [10, 20]', 'it = iter(xs)', 'print(next(it), next(it))   # 10 20', 'try: next(it)', 'except StopIteration: print("done")', 'print(list(it))            # [] exhausted'), },
      check: 'assert list(it) == [] and list(iter(xs)) == [10, 20]',
      more: "- Iterables like lists can be iterated many times; iterators cannot be restarted.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-generator', title: 'What is a generator in Python',
      q: ['what is a generator python', 'yield keyword', 'generator vs list', 'generator expression', 'when to use yield'],
      tags: 'generator yield lazy evaluation generator expression memory iterator python',
      a: "A generator is a function with `yield` that returns an iterator producing values lazily, one per request, keeping its local state between yields. It uses O(1) memory instead of building a whole list, but can be consumed only once.",
      code: { py: L('def evens(n):', '    for i in range(0, n, 2):', '        yield i', '', 'g = evens(10)', 'print(next(g), next(g))   # 0 2', 'print(sum(x * x for x in range(5)))  # generator expression: 30'), },
      check: 'assert list(evens(7)) == [0,2,4,6] and sum(x*x for x in range(5)) == 30',
      more: "- Handy for streaming big inputs and infinite sequences.\n- You can't index or `len()` a generator.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-closure', title: 'What is a closure',
      q: ['what is a closure', 'python closure example', 'nonlocal keyword', 'function remembering variables', 'inner function access outer variable'],
      tags: 'closure nonlocal inner function enclosing scope free variable counter python',
      a: "A closure is an inner function that remembers variables from the enclosing function even after that function has returned. To rebind such a variable (not just read it) declare it `nonlocal`.",
      code: { py: L('def counter():', '    n = 0', '    def inc():', '        nonlocal n', '        n += 1', '        return n', '    return inc', '', 'c = counter()', 'print(c(), c(), c())  # 1 2 3'), },
      check: 'assert counter()() == 1 and (c(), c()) == (4, 5)',
      more: "- Pitfall: closures in loops capture the variable, not its value: `[lambda: i for i in range(3)]` all return 2.\n- Each call to `counter()` creates an independent state.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-decorator', title: 'What is a decorator in Python',
      q: ['what is a decorator', 'python decorator example', '@ syntax in python', 'write a timing decorator', 'functools.wraps'],
      tags: 'decorator wrapper functools wraps @ syntax higher-order function python',
      a: "A decorator is a function that takes a function and returns a replacement, usually a wrapper adding behaviour. `@dec` above `def f` is shorthand for `f = dec(f)`. Use `functools.wraps` to keep the original name and docstring.",
      code: { py: L('from functools import wraps', 'def logged(fn):', '    @wraps(fn)', '    def wrapper(*args, **kw):', '        wrapper.calls += 1', '        return fn(*args, **kw)', '    wrapper.calls = 0', '    return wrapper', '', '@logged', 'def add(a, b): return a + b', '', 'print(add(1, 2), add.calls)  # 3 1'), },
      check: "assert add(2,3)==5 and add.calls==2 and add.__name__=='add'",
      more: "- `@lru_cache` and `@staticmethod` are decorators.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-deep-shallow-copy', title: 'Deep copy vs shallow copy',
      q: ['deep copy vs shallow copy', 'python copy list of lists', 'why does copying my 2d list change original', 'copy.deepcopy', 'list[:] copy nested'],
      tags: 'deep copy shallow copy deepcopy copy.copy nested list 2d matrix aliasing',
      a: "A shallow copy makes a new outer container but shares the inner objects; a deep copy duplicates everything recursively. For a list of lists, `a[:]` or `copy.copy(a)` is shallow, so inner lists are still shared. Use `copy.deepcopy` or a comprehension `[r[:] for r in a]`.",
      code: { py: L('import copy', 'a = [[1, 2], [3]]', 'sh = a[:]; dp = copy.deepcopy(a)', 'a[0].append(9)', 'print(sh[0], dp[0])  # [1, 2, 9] [1, 2]'), },
      check: 'assert sh[0] == [1,2,9] and dp[0] == [1,2]',
      more: "- Trap: `[[0]*3]*3` makes 3 references to one row; use `[[0]*3 for _ in range(3)]`.",
      see: ['#/cheatsheets/python', '#/topic/matrix']
    },
    {
      id: 'cx-gc-refcount', title: 'Garbage collection and reference counting',
      q: ['how does garbage collection work', 'python reference counting', 'what is garbage collection', 'reference counting vs tracing gc', 'memory leak in garbage collected language'],
      tags: 'garbage collection reference counting cycles tracing mark sweep memory python java',
      a: "Garbage collection frees memory that is no longer reachable. CPython counts references per object and frees it at zero, plus a cycle collector for objects that reference each other; Java and JS use tracing (mark-and-sweep style) from roots.",
      code: { py: L('import sys', 'x = []', 'y = x', 'print(sys.getrefcount(x) - 1)  # 2 references: x and y (minus the call argument)'), },
      check: 'assert sys.getrefcount(x) >= 3',
      more: "- Reference counting alone can't free cycles (a refers to b, b to a).\n- You can still leak by keeping references (global caches, listeners).",
      see: ['#/cheatsheets/python']
    },

    // ---------- (3) X vs Y ----------
    {
      id: 'cx-list-vs-deque', title: 'list vs deque in Python',
      q: ['list vs deque', 'when to use deque', 'python queue list or deque', 'why is list.pop(0) slow', 'deque vs list performance'],
      tags: 'list deque queue popleft appendleft pop(0) collections double-ended',
      a: "Use `deque` when you add or remove at both ends (queues, BFS, sliding windows); use `list` for random access and stack-like use at the end. `list.pop(0)` is O(n) while `deque.popleft()` is O(1), but indexing the middle of a deque is O(n).",
      code: { py: L('from collections import deque', 'q = deque([1, 2, 3])', 'q.append(4); print(q.popleft())  # 1', 'st = [1, 2, 3]', 'st.append(4); print(st.pop())     # 4'), },
      check: 'assert list(q) == [2,3,4] and st == [1,2,3]',
      more: "| Op | list | deque |\n|---|---|---|\n| append/pop right | O(1) | O(1) |\n| pop/insert left | O(n) | O(1) |\n| index i | O(1) | O(n) middle |",
      see: ['#/topic/queues', '#/cheatsheets/python']
    },
    {
      id: 'cx-list-vs-tuple', title: 'list vs tuple',
      q: ['list vs tuple', 'when to use tuple instead of list', 'difference between list and tuple python', 'why use tuples', 'tuple as dictionary key'],
      tags: 'list tuple immutable mutable hashable dict key fixed record python',
      a: "Use a tuple for a fixed group of values that shouldn't change (coordinates, a record, a dict key); use a list for a collection you will grow or modify. Tuples are immutable and hashable if their contents are.",
      code: { py: L('seen = set()', 'seen.add((2, 3))        # tuple works in a set', 'print((2, 3) in seen)   # True', '# seen.add([2, 3]) would raise TypeError'), },
      check: 'assert (2,3) in seen',
      more: "- Tuples are slightly smaller and faster to create.\n- Both are ordered and indexable.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-dict-vs-set', title: 'dict vs set',
      q: ['dict vs set', 'when to use a set instead of dict', 'set or dictionary for lookup', 'set vs list membership', 'hash map vs hash set'],
      tags: 'dict set hash map hash set membership key value lookup unique',
      a: "Use a set when you only need to know whether something is present (membership, dedupe, visited); use a dict when each key must map to a value (counts, index lookup, memo). Both give O(1) average lookup and need hashable keys.",
      code: { py: L('nums = [2, 7, 11, 15]', 'seen = {}                     # value -> index', 'for i, x in enumerate(nums):', '    if 9 - x in seen: print(seen[9 - x], i)  # 0 1', '    seen[x] = i'), },
      check: 'assert seen == {2:0, 7:1, 11:2, 15:3} or 7 in seen',
      more: "- Set ops: `a & b`, `a | b`, `a - b`.\n- Python 3.7+ dicts remember insertion order; sets do not.",
      see: ['#/topic/arrays-hashing']
    },
    {
      id: 'cx-array-vs-linkedlist', title: 'Array vs linked list',
      q: ['array vs linked list', 'when to use a linked list', 'linked list vs list python', 'why arrays are faster than linked lists', 'insert in middle array vs linked list'],
      tags: 'array linked list random access insertion deletion cache locality pointers',
      a: "Use an array (Python list) by default: O(1) index and better cache behaviour. Use a linked list when you already hold a node and need O(1) insert or delete there, or must splice without moving elements. Finding a position in a linked list is still O(n).",
      more: "| Op | array | linked list |\n|---|---|---|\n| index i | O(1) | O(n) |\n| insert/delete at front | O(n) | O(1) |\n| insert after known node | O(n) | O(1) |\n| memory | compact | extra pointer per node |\n- In practice linked lists are rare outside interview problems and LRU caches.",
      see: ['#/topic/linked-lists', '#/topic/arrays-hashing']
    },
    {
      id: 'cx-stack-vs-queue', title: 'Stack vs queue',
      q: ['stack vs queue', 'difference between stack and queue', 'lifo vs fifo', 'when to use a stack', 'when to use a queue'],
      tags: 'stack queue LIFO FIFO push pop enqueue dequeue order',
      a: "A stack is last-in, first-out: use it for undo, matching brackets, DFS and expression parsing. A queue is first-in, first-out: use it for BFS, scheduling and buffers. Python: list for a stack, `collections.deque` for a queue.",
      code: { py: L('from collections import deque', 'st = []; st.append(1); st.append(2); print(st.pop())    # 2', 'q = deque(); q.append(1); q.append(2); print(q.popleft())  # 1'), },
      check: 'assert st == [1] and list(q) == [2]',
      more: "- Both give O(1) push/pop at the right ends.\n- You can build either from the other.",
      see: ['#/topic/stacks', '#/topic/queues']
    },
    {
      id: 'cx-bfs-vs-dfs', title: 'BFS vs DFS',
      q: ['bfs vs dfs', 'when to use bfs over dfs', 'breadth first vs depth first', 'which traversal for shortest path', 'dfs or bfs for this problem'],
      tags: 'bfs dfs breadth first depth first shortest path queue stack recursion traversal',
      a: "Use BFS when you need the fewest steps in an unweighted graph or level-by-level order. Use DFS for exhaustive exploration, path existence, cycle detection, topological sort, components and backtracking. Both run in O(V + E).",
      more: "- BFS uses a queue and O(width) memory; DFS uses a stack or recursion and O(depth) memory.\n- On a wide tree BFS memory is large; on a very deep graph recursive DFS can overflow the stack.\n- DFS doesn't give shortest paths.",
      see: ['#/topic/graphs', '#/cheatsheets/graphs']
    },
    {
      id: 'cx-heap-vs-sorted-vs-bst', title: 'Heap vs sorted list vs BST',
      q: ['heap vs sorted list', 'heap vs bst', 'when to use a priority queue', 'sorted array vs heap', 'need min repeatedly which structure'],
      tags: 'heap priority queue sorted list bst balanced tree min max insert top k',
      a: "Use a heap when you repeatedly need only the min or max with inserts (top-k, scheduling, Dijkstra). Use a sorted array when data is static and you search a lot. Use a balanced BST (or `sortedcontainers`) when you need ordered queries: rank, range, predecessor, delete arbitrary.",
      more: "| Op | heap | sorted array | balanced BST |\n|---|---|---|---|\n| find min | O(1) | O(1) | O(log n) |\n| insert | O(log n) | O(n) | O(log n) |\n| pop min | O(log n) | O(n) | O(log n) |\n| search value | O(n) | O(log n) | O(log n) |\n- Python has no built-in BST.",
      see: ['#/topic/heaps', '#/topic/trees']
    },
    {
      id: 'cx-hashmap-vs-treemap', title: 'Hash map vs TreeMap (ordered map)',
      q: ['hashmap vs treemap', 'hash map vs balanced bst', 'when do i need a sorted map', 'unordered_map vs map', 'dict vs ordered map'],
      tags: 'hashmap treemap sorted map ordered map unordered_map std::map red-black floor ceiling',
      a: "Use a hash map for plain key lookup: O(1) average. Use a TreeMap (balanced tree, Java TreeMap, C++ `std::map`) when you need keys in sorted order or queries like floor, ceiling, range and nearest key: O(log n) each.",
      more: "- Hash map worst case is O(n); tree map guarantees O(log n).\n- Python's dict is a hash map; for ordered queries combine `bisect` with a sorted list or use `sortedcontainers.SortedDict`.\n- Problems with \"closest\" or \"range\" keywords often need ordering.",
      see: ['#/topic/hashing-internals', '#/topic/trees']
    },
    {
      id: 'cx-quick-merge-heap', title: 'Quicksort vs mergesort vs heapsort',
      q: ['quicksort vs mergesort', 'which sorting algorithm is best', 'merge sort vs heap sort', 'why is quicksort faster in practice', 'sorting algorithm comparison'],
      tags: 'quicksort mergesort heapsort comparison stable in-place worst case timsort',
      a: "Merge sort: guaranteed O(n log n), stable, needs O(n) extra space. Quicksort: O(n log n) average but O(n^2) worst case, in place, usually fastest in practice. Heapsort: guaranteed O(n log n), in place, not stable, poorer cache behaviour. Python uses Timsort (stable, O(n log n) worst).",
      more: "| | worst | space | stable |\n|---|---|---|---|\n| merge | n log n | O(n) | yes |\n| quick | n^2 | O(log n) | no |\n| heap | n log n | O(1) | no |\n- Linked lists favour merge sort.\n- Say which you'd pick and why: that is the interview answer.",
      cx: 'merge/heap O(n log n) worst; quick O(n^2) worst, O(n log n) average', see: ['#/topic/sorting', '#/cheatsheets/sorting']
    },
    {
      id: 'cx-recursion-vs-iteration', title: 'Recursion vs iteration',
      q: ['recursion vs iteration', 'when to use recursion', 'recursion or loop', 'is recursion slower than loop', 'convert recursion to iteration'],
      tags: 'recursion iteration loop stack overflow call stack explicit stack tree traversal',
      a: "Use recursion when the problem is naturally nested (trees, backtracking, divide and conquer) and depth is modest; use a loop when it is a straight repeat or the depth could exceed about 1000 in Python. Any recursion can become iteration with an explicit stack.",
      code: { py: L('def inorder(root):', '    out, st, cur = [], [], root', '    while cur or st:', '        while cur: st.append(cur); cur = cur.left', '        cur = st.pop(); out.append(cur.val); cur = cur.right', '    return out', '', 'class N:', '    def __init__(s, v, l=None, r=None): s.val, s.left, s.right = v, l, r', 'print(inorder(N(2, N(1), N(3))))  # [1, 2, 3]'), },
      check: 'assert inorder(N(2, N(1), N(3))) == [1,2,3] and inorder(None) == []',
      more: "- Recursive calls cost stack space and some overhead.\n- Recursion usually reads cleaner for trees.",
      see: ['#/topic/recursion', '#/topic/trees']
    },
    {
      id: 'cx-dp-greedy-backtracking', title: 'DP vs greedy vs backtracking',
      q: ['dp vs greedy', 'greedy vs dynamic programming', 'dp or backtracking', 'how to choose between dp and greedy', 'backtracking vs dp'],
      tags: 'dp greedy backtracking choose strategy optimization counting enumerate exhaustive',
      a: "Backtracking enumerates all possibilities (list every subset or permutation). DP counts or optimizes when subproblems overlap. Greedy commits to one choice per step and is fastest, but only valid when a greedy-choice proof exists. Try greedy first only if you can argue it.",
      more: "- \"List all\" or \"generate\" points to backtracking.\n- \"Minimum / maximum / how many ways\" with choices at each step points to DP.\n- If greedy fails on a small counterexample, move to DP.\n- Backtracking plus memoization is top-down DP.",
      see: ['#/topic/greedy', '#/topic/backtracking', '#/cheatsheets/dp-catalog']
    },
    {
      id: 'cx-memo-vs-tab', title: 'Memoization vs tabulation',
      q: ['memoization vs tabulation', 'top down vs bottom up dp', 'recursive vs iterative dp', 'which dp style is better', 'memo or table'],
      tags: 'memoization tabulation top-down bottom-up dp recursion table',
      a: "Memoization (top-down) is recursion plus a cache: easiest to write and only computes reachable states. Tabulation (bottom-up) fills a table in order: no recursion limit and easier to shrink space. Both have the same time complexity (states x work per state).",
      more: "- Start top-down if the recurrence is clear.\n- Switch to bottom-up when depth exceeds Python's recursion limit or to save space.\n- Top-down skips states never needed, which helps when the state space is sparse.",
      see: ['#/topic/dp-1d', '#/cheatsheets/dp-catalog']
    },
    {
      id: 'cx-adjlist-vs-matrix', title: 'Adjacency list vs adjacency matrix',
      q: ['adjacency list vs matrix', 'how to represent a graph', 'graph representation', 'when to use adjacency matrix', 'dense vs sparse graph'],
      tags: 'adjacency list adjacency matrix graph representation sparse dense edge lookup',
      a: "Use an adjacency list by default: O(V + E) space and fast neighbour iteration. Use an adjacency matrix for dense graphs or when you need O(1) 'is there an edge u-v' checks; it costs O(V^2) space.",
      code: { py: L('from collections import defaultdict', 'adj = defaultdict(list)', 'for u, v in [(0, 1), (1, 2)]:', '    adj[u].append(v); adj[v].append(u)', 'print(dict(adj))  # {0: [1], 1: [0, 2], 2: [1]}'), },
      check: 'assert adj[1] == [0, 2]',
      more: "- Iterating all neighbours: list O(deg), matrix O(V).\n- Floyd-Warshall naturally uses a matrix.",
      see: ['#/topic/graphs', '#/cheatsheets/graphs']
    },
    {
      id: 'cx-dijkstra-bfs-bellman', title: 'Dijkstra vs BFS vs Bellman-Ford',
      q: ['dijkstra vs bfs', 'bellman ford vs dijkstra', 'which shortest path algorithm', 'shortest path negative weights', 'when to use dijkstra'],
      tags: 'dijkstra bfs bellman-ford shortest path weighted negative edges 0-1 bfs floyd',
      a: "Unweighted (or all weights equal): BFS, O(V + E). Non-negative weights: Dijkstra with a heap, O((V + E) log V). Negative edge weights (or detecting negative cycles): Bellman-Ford, O(V * E). All pairs on a small graph: Floyd-Warshall, O(V^3).",
      more: "- Dijkstra breaks with negative edges because a settled node may later get a cheaper path.\n- For weights only 0 and 1, use a deque (0-1 BFS).\n- On a DAG, relax edges in topological order for O(V + E).",
      see: ['#/topic/shortest-paths', '#/cheatsheets/graphs']
    },
    {
      id: 'cx-kruskal-vs-prim', title: 'Kruskal vs Prim',
      q: ['kruskal vs prim', 'which mst algorithm', 'minimum spanning tree algorithms', 'kruskal or prim for dense graph', 'mst union find vs heap'],
      tags: 'kruskal prim minimum spanning tree MST union find heap edges sorted dense sparse',
      a: "Both build a minimum spanning tree. Kruskal sorts edges and adds the cheapest that don't form a cycle (union-find): good for sparse graphs or an edge list, O(E log E). Prim grows one tree from a start vertex using a heap: O(E log V), good when you have an adjacency list.",
      more: "- For very dense graphs an array-based Prim runs in O(V^2).\n- Both are greedy.\n- MST gives the cheapest connection overall, not shortest paths.",
      see: ['#/topic/mst', '#/topic/union-find']
    },
    {
      id: 'cx-array-vs-hash-counting', title: 'Array vs hash map for counting',
      q: ['array or dictionary for counting', 'count characters array vs hashmap', 'frequency array of size 26', 'counter vs list for counts', 'when to use array as hash'],
      tags: 'counting frequency array 26 letters hash map counter dict direct addressing',
      a: "If keys are small non-negative integers in a known range (lowercase letters, digits, values <= n), use an array indexed by the key: faster and O(range) space. Otherwise (strings, large or unknown keys) use a dict or `Counter`.",
      code: { py: L('s = "banana"', 'cnt = [0] * 26', 'for ch in s: cnt[ord(ch) - 97] += 1', 'print(cnt[0], cnt[1], cnt[13])  # 3 1 2'), },
      check: 'assert (cnt[0], cnt[1], cnt[13]) == (3, 1, 2)\nfrom collections import Counter\nassert Counter(s)["a"] == 3',
      more: "- Two anagram strings have equal count arrays.",
      see: ['#/topic/arrays-hashing']
    },
    {
      id: 'cx-sort-vs-hash-dups', title: 'Sorting vs hashing to find duplicates',
      q: ['sort or set to find duplicates', 'detect duplicates hash vs sort', 'contains duplicate approach', 'find duplicate with constant space', 'sorting vs hash set tradeoff'],
      tags: 'duplicates hash set sort contains duplicate space time tradeoff in place',
      a: "Use a hash set for O(n) time and O(n) space. Sort first if you must use O(1) extra space or already need sorted order: O(n log n) time, then compare neighbours. Prefer the set unless memory is constrained.",
      code: { py: L('def has_dup_set(a): return len(set(a)) != len(a)', '', 'def has_dup_sort(a):', '    a = sorted(a)', '    return any(a[i] == a[i + 1] for i in range(len(a) - 1))', '', 'print(has_dup_set([1, 2, 1]), has_dup_sort([1, 2, 3]))  # True False'), },
      check: 'assert has_dup_set([1,2,1]) and not has_dup_sort([1,2,3]) and not has_dup_set([])',
      more: "- Sorting keeps a copy here; in-place `a.sort()` mutates the input.\n- State the trade-off: that is the follow-up question.",
      see: ['#/topic/arrays-hashing']
    },
    {
      id: 'cx-binsearch-vs-hash', title: 'Binary search vs hash lookup',
      q: ['binary search vs hash table', 'when to use binary search instead of dictionary', 'sorted array lookup vs set', 'binary search or hashmap', 'hash lookup vs bisect'],
      tags: 'binary search hash lookup sorted array range query bisect floor ceiling',
      a: "Use hashing for exact-match lookup on unsorted data: O(1) average after O(n) build. Use binary search on sorted data when you need order-based answers (first >= x, count in range, nearest) or want no extra memory: O(log n) per query.",
      code: { py: L('from bisect import bisect_left', 'a = [1, 3, 5, 9]', 'i = bisect_left(a, 4)', 'print(a[i])  # 5, first element >= 4'), },
      check: 'assert a[i] == 5 and bisect_left([], 1) == 0',
      more: "- A hash set can't answer \"smallest value >= x\".",
      see: ['#/topic/binary-search', '#/topic/arrays-hashing']
    },
    {
      id: 'cx-mutable-default', title: 'Mutable default argument vs None',
      q: ['mutable default argument python', 'why does my default list keep growing', 'def f(x, lst=[])', 'default argument gotcha', 'use none as default'],
      tags: 'mutable default argument None python gotcha list default shared state bug',
      a: "Never use a mutable default like `lst=[]`: it is created once at definition time and shared by every call. Use `lst=None` and create the list inside the function.",
      code: { py: L('def bad(x, lst=[]):', '    lst.append(x); return lst', '', 'def good(x, lst=None):', '    if lst is None: lst = []', '    lst.append(x); return lst', '', 'bad(1); print(bad(2))   # [1, 2]  (shared!)', 'good(1); print(good(2))  # [2]'), },
      check: 'assert bad(3) == [1,2,3] and good(5) == [5]',
      more: "- Use `is None` rather than `if not lst`, because an empty list passed in by the caller is falsy.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-eq-vs-is', title: '== vs is in Python',
      q: ['== vs is python', 'difference between is and equals', 'when to use is in python', 'is none vs == none', 'python identity vs equality'],
      tags: 'python is equality identity == none singleton compare object id',
      a: "`==` asks whether two values are equal; `is` asks whether they are the very same object. Use `==` for values and `is` only for singletons: `x is None`, `x is True`. Small ints and interned strings may be shared, so `is` on them is unreliable.",
      code: { py: L('a = [1, 2]; b = [1, 2]; c = a', 'print(a == b, a is b, a is c)  # True False True'), },
      check: 'assert a == b and a is not b and a is c',
      more: "- `is` compares `id()`; `==` calls `__eq__`.\n- Don't write `if x == None`.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-process-vs-thread', title: 'Process vs thread',
      q: ['process vs thread', 'difference between thread and process', 'what is a thread', 'python gil threads', 'multiprocessing vs multithreading'],
      tags: 'process thread GIL concurrency parallelism memory shared multiprocessing context switch',
      a: "A process has its own memory space; a thread shares memory with other threads of the same process. Threads are lighter and share data (so need locks), processes are isolated and safer. In CPython the GIL prevents threads running Python bytecode in parallel, so use processes for CPU-bound work and threads for I/O waiting.",
      more: "- Crash isolation: a process crash doesn't kill siblings; a thread can take the whole process down.\n- Communication: threads share variables; processes use pipes, queues or shared memory.\n- Concurrency is interleaving; parallelism is simultaneous execution.",
      see: ['#/cs']
    },

    // ---------- (4) Pattern recognition ----------
    {
      id: 'cx-spot-sliding-window', title: 'How to recognise a sliding window problem',
      q: ['when to use sliding window', 'how do i know it is a sliding window problem', 'sliding window clues', 'longest substring problem approach', 'subarray of size k technique'],
      tags: 'sliding window pattern recognition contiguous subarray substring longest shortest at most k',
      a: "Look for a contiguous subarray or substring with a condition (longest/shortest, sum, at most k distinct, no repeats) where values are non-negative or the condition is monotone when the window grows. Keep two indices and a running state; expand right, shrink left.",
      more: "- Fixed size k: slide one step, add the new, remove the old.\n- Variable size: `while window invalid: shrink`.\n- Negative numbers with a target sum break the shrink logic: use prefix sums plus a hash map.\n- Each pointer only moves forward, so O(n).",
      see: ['#/topic/sliding-window', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-two-pointers', title: 'How to recognise a two pointers problem',
      q: ['when to use two pointers', 'two pointer clues', 'how to know to use two pointers', 'sorted array pair sum approach', 'two pointers vs sliding window'],
      tags: 'two pointers pattern recognition sorted array pair palindrome in place partition',
      a: "Think two pointers when the input is sorted (or can be sorted), you need pairs/triplets meeting a condition, you compare from both ends (palindrome), or you rewrite an array in place (remove duplicates, partition). Each step moves one pointer based on a comparison, giving O(n).",
      more: "- Pointers from both ends: pair sum on a sorted array, container with most water.\n- Pointers in the same direction (slow/fast): in-place compaction, linked list cycle.\n- If order can't be changed and you need pairs, use a hash map instead.",
      see: ['#/topic/two-pointers', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-binary-search-answer', title: 'How to recognise binary search on the answer',
      q: ['binary search on answer', 'when to binary search the result', 'minimize the maximum clue', 'koko eating bananas approach', 'how to know to use binary search'],
      tags: 'binary search on answer minimize maximum feasibility monotonic predicate capacity ship packages',
      a: "Use it when the question asks for the smallest/largest value that satisfies a condition, and you can write an O(n) `feasible(x)` check that is monotone (if x works, bigger x also works, or vice versa). Binary search x between its bounds.",
      code: { py: L('def min_speed(piles, h):          # Koko eating bananas', '    def ok(k): return sum(-(-p // k) for p in piles) <= h', '    lo, hi = 1, max(piles)', '    while lo < hi:', '        mid = (lo + hi) // 2', '        if ok(mid): hi = mid', '        else: lo = mid + 1', '    return lo', '', 'print(min_speed([3, 6, 7, 11], 8))  # 4'), },
      check: 'assert min_speed([3,6,7,11],8)==4 and min_speed([30,11,23,4,20],5)==30',
      more: "- Keywords: \"minimum possible largest\", \"at least ... days\", \"capacity\".\n- Cost: O(n log range).",
      see: ['#/topic/binary-search', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-dp', title: 'How to recognise a DP problem',
      q: ['how to know if a problem is dp', 'dp problem clues', 'when to use dynamic programming', 'signs of dynamic programming', 'dp keywords'],
      tags: 'dynamic programming recognition clues count ways minimum cost maximum choices overlapping subproblems',
      a: "Suspect DP when you're asked for a count of ways, a minimum/maximum, or yes/no feasibility, built from a sequence of choices, and brute force recursion repeats the same sub-inputs. Define the state, write the recurrence, then add memoization.",
      more: "- Typical hints: \"number of ways\", \"longest\", \"minimum cost\", \"can you reach/partition\".\n- Checklist: what changes between calls (the state)? what's the choice at each step? what are the base cases?\n- If the problem asks to list all solutions, it's backtracking, not DP.\n- Small constraints (n <= 1000, sums <= 10^4) fit table DP.",
      see: ['#/cheatsheets/dp-catalog', '#/topic/dp-1d']
    },
    {
      id: 'cx-spot-backtracking', title: 'How to recognise a backtracking problem',
      q: ['when to use backtracking', 'backtracking clues', 'generate all combinations problem', 'how to know it is a backtracking problem', 'permutations subsets approach'],
      tags: 'backtracking recognition generate all permutations subsets combinations n-queens sudoku small n',
      a: "Use backtracking when you must generate or search all valid arrangements: subsets, permutations, combinations, board placement (N-Queens, Sudoku, word search). Tiny constraints (n <= 15 or so) are the clue. Choose, recurse, undo, and prune when a constraint is violated.",
      more: "- Template: if complete, record; for each option: choose, recurse, unchoose.\n- Output size is usually exponential, so the time is too.\n- If you only need a count or an optimum and states repeat, DP may beat it.",
      see: ['#/topic/backtracking', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-bfs', title: 'How to recognise a BFS problem',
      q: ['when to use bfs', 'bfs clues', 'shortest path in grid approach', 'minimum number of steps problem', 'level order bfs keywords'],
      tags: 'BFS recognition shortest path unweighted grid minimum moves level order multi-source word ladder',
      a: "Use BFS when the task is the minimum number of moves/steps in an unweighted graph or grid, level-by-level processing, or spreading from several sources at once (rotting oranges). Start the queue with all sources and mark nodes visited when you enqueue them.",
      more: "- State can be more than a position (position + keys held).\n- Nodes are implicit: words one letter apart, puzzle boards.\n- Weighted edges: Dijkstra instead.\n- Complexity O(V + E).",
      see: ['#/topic/graphs', '#/cheatsheets/graphs']
    },
    {
      id: 'cx-spot-heap', title: 'How to recognise a heap problem',
      q: ['when to use a heap', 'heap problem clues', 'top k elements approach', 'priority queue keywords', 'kth largest which data structure'],
      tags: 'heap priority queue recognition top k kth largest merge k sorted lists median stream scheduling',
      a: "Reach for a heap when you repeatedly need the current smallest or largest of a changing set: top-k, kth largest, merge k sorted lists, running median (two heaps), task scheduling, Dijkstra. A size-k heap gives O(n log k).",
      more: "- Top-k largest: keep a *min*-heap of size k.\n- Python `heapq` is a min-heap; negate values for a max-heap.\n- If you only need one min of a static list, `min()` is enough.\n- If the data is bounded integers, bucket/counting may beat the heap.",
      see: ['#/topic/heaps', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-monotonic-stack', title: 'How to recognise a monotonic stack problem',
      q: ['when to use monotonic stack', 'next greater element clue', 'monotonic stack problems', 'daily temperatures approach', 'previous smaller element technique'],
      tags: 'monotonic stack next greater element previous smaller histogram temperatures recognition',
      a: "Use a monotonic stack when each element needs its nearest greater/smaller element to the left or right (next greater, daily temperatures, largest rectangle in histogram, stock span). Pop while the new element breaks the order; popped items just found their answer. It is O(n) since each item is pushed and popped once.",
      code: { py: L('def next_greater(a):', '    res, st = [-1] * len(a), []     # st holds indices with decreasing values', '    for i, x in enumerate(a):', '        while st and a[st[-1]] < x:', '            res[st.pop()] = x', '        st.append(i)', '    return res', '', 'print(next_greater([2, 1, 3]))  # [3, 3, -1]'), },
      check: 'assert next_greater([2,1,3])==[3,3,-1] and next_greater([])==[]',
      cx: 'O(n)', see: ['#/topic/monotonic', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-union-find', title: 'How to recognise a union-find problem',
      q: ['when to use union find', 'disjoint set clues', 'connected components dynamic edges', 'union find vs dfs', 'number of islands union find'],
      tags: 'union find disjoint set DSU recognition connected components groups merge cycle undirected',
      a: "Use union-find when elements are merged into groups over time and you must ask whether two items are in the same group: connectivity as edges arrive, cycle detection in an undirected graph, Kruskal's MST, accounts merge. Near O(1) per operation with path compression and union by size.",
      more: "- If the graph is static and you just count components once, a DFS or BFS does the job.\n- It handles merges but not splits.\n- Keywords: \"connected\", \"same group\", \"merge\", \"redundant edge\".",
      see: ['#/topic/union-find', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-trie', title: 'How to recognise a trie problem',
      q: ['when to use a trie', 'trie problem clues', 'prefix search which data structure', 'autocomplete data structure', 'word search ii approach'],
      tags: 'trie prefix tree recognition autocomplete dictionary words prefix search word search',
      a: "Use a trie when you query many words by prefix: autocomplete, starts-with, longest common prefix, or when a backtracking search over a grid must prune on word prefixes (Word Search II). Lookup costs O(length of word) regardless of how many words are stored.",
      more: "- A hash set answers whole-word membership but not prefix queries efficiently.\n- Memory can be large for big alphabets; use dicts for children.\n- For a few queries, sorting plus binary search might be simpler.",
      see: ['#/topic/tries', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-prefix-sums', title: 'How to recognise a prefix sums problem',
      q: ['when to use prefix sum', 'range sum query clue', 'subarray sum equals k approach', 'prefix sum hash map', 'many range queries technique'],
      tags: 'prefix sums range sum subarray sum equals k cumulative running total hash map',
      a: "Use prefix sums when you answer many range-sum queries, or ask for subarrays with a given sum/remainder (negatives allowed). Precompute `P[i]`; the sum of `a[l..r]` is `P[r+1] - P[l]`. For 'subarray sums to k', store counts of earlier prefix values in a hash map.",
      code: { py: L('def count_subarrays(a, k):', '    seen = {0: 1}; cur = ans = 0', '    for x in a:', '        cur += x', '        ans += seen.get(cur - k, 0)', '        seen[cur] = seen.get(cur, 0) + 1', '    return ans', '', 'print(count_subarrays([1, 2, 3], 3))  # 2'), },
      check: 'assert count_subarrays([1,2,3],3)==2 and count_subarrays([1,-1,0],0)==3 and count_subarrays([],0)==0',
      cx: 'O(n) time, O(n) space', see: ['#/topic/prefix-sums', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-greedy', title: 'How to recognise a greedy problem',
      q: ['when to use greedy', 'greedy problem clues', 'how to know greedy works', 'interval scheduling greedy', 'greedy keywords'],
      tags: 'greedy recognition sort then choose intervals jump game local optimum exchange argument',
      a: "Try greedy when sorting the input and repeatedly taking the best available choice looks natural (earliest end time, largest gain, smallest cost), especially for intervals, scheduling, jumping and assignment problems. Confirm with a small counterexample test or exchange argument before trusting it.",
      more: "- Typical signs: \"minimum number of ... to cover\", \"maximum number of non-overlapping\", ordering that never needs undoing.\n- Fast failure test: brute-force a tiny input and compare.\n- When one wrong choice can't be undone, think DP.",
      see: ['#/topic/greedy', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-spot-topo-sort', title: 'How to recognise a topological sort problem',
      q: ['when to use topological sort', 'topological sort clues', 'course schedule approach', 'dependency ordering problem', 'order tasks with prerequisites'],
      tags: 'topological sort recognition prerequisites dependencies ordering course schedule alien dictionary build order',
      a: "Use topological sort when items have 'A must come before B' constraints and you need a valid order or to know if one exists: course schedule, build order, alien dictionary, task dependencies. A cycle means no valid order.",
      more: "- Build a directed graph from the constraints, then run Kahn's algorithm (BFS with indegrees) or DFS.\n- If the output has fewer than n nodes, there's a cycle.\n- Alien dictionary: edges come from the first differing letter of adjacent words.",
      see: ['#/topic/topo-sort', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-stuck-first-steps', title: 'What to try first when stuck on a problem',
      q: ['what to do when stuck on a leetcode problem', 'how to start when i have no idea', 'stuck on coding problem', 'where to begin with a hard problem', 'no idea how to solve this'],
      tags: 'stuck no idea start strategy brute force examples simplify patterns approach checklist',
      a: "Write the brute force first, however slow. Then work a small example by hand and note what you actually do. Simplify (smaller input, drop a constraint), sort the data, or try each pattern in turn (hash map, two pointers, stack, heap, recursion). Say your thoughts aloud.",
      more: "- Ask what is repeated or wasted in the brute force; that is the optimization point.\n- Draw the input as a picture.\n- Try the edge cases: empty, one item, duplicates.\n- Name the data structure that would make the slow step fast.\n- If still blocked after several minutes, ask for a hint rather than silence.",
      see: ['#/cheatsheets/study-playbook', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-brute-to-optimal', title: 'How to go from brute force to optimal',
      q: ['how to optimize brute force solution', 'brute force to optimal', 'improve time complexity of my solution', 'how to find a faster algorithm', 'optimize nested loop'],
      tags: 'optimize brute force bottleneck hash map sort precompute two pointers cache trade space time',
      a: "Find the bottleneck, the repeated work in the brute force, and remove it. Typical swaps: an inner linear search becomes a hash lookup (O(n^2) to O(n)); a rescan becomes a running sum or sliding window; repeated sub-calls become memoization; sorting enables binary search or two pointers.",
      code: { py: L('def two_sum_slow(a, t):', '    return any(a[i] + a[j] == t for i in range(len(a)) for j in range(i + 1, len(a)))', '', 'def two_sum_fast(a, t):', '    seen = set()', '    for x in a:', '        if t - x in seen: return True', '        seen.add(x)', '    return False', '', 'print(two_sum_slow([2, 7, 11], 9), two_sum_fast([2, 7, 11], 9))  # True True'), },
      check: 'assert two_sum_fast([2,7,11],9) and not two_sum_fast([1,2],10) and not two_sum_fast([],1)',
      more: "- Ask: what information do I recompute? can I store it?\n- Space is often traded for time.\n- State the new complexity before coding.",
      see: ['#/cheatsheets/study-playbook']
    },
    {
      id: 'cx-choose-data-structure', title: 'How to choose a data structure',
      q: ['which data structure should i use', 'how to choose the right data structure', 'data structure for fast lookup', 'what structure for min or max', 'pick data structure interview'],
      tags: 'choose data structure hash map set stack queue heap trie sorted lookup membership min max order',
      a: "Match the operation you repeat: membership or counts -> hash set/map; latest-first or matching pairs -> stack; oldest-first or levels -> queue; repeated min/max -> heap; prefix queries -> trie; ordered queries -> sorted array or balanced tree; groups merging -> union-find; range queries -> prefix sums or segment tree.",
      more: "- Write down the operations and how often each runs; then pick the structure that makes the most frequent one cheap.\n- Default to the simplest (list, dict, set) and upgrade only if the complexity requires.\n- Combining structures is normal (LRU cache = hash map + linked list).",
      see: ['#/cheatsheets/data-structures', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-estimate-n2-ok', title: 'Is O(n^2) fast enough? Estimate from constraints',
      q: ['will n squared pass', 'is O(n^2) ok for n = 10^4', 'how to know if solution is fast enough', 'estimate runtime from constraints', 'time limit exceeded how to estimate'],
      tags: 'estimate constraints n squared 10^8 operations time limit exceeded TLE feasibility python',
      a: "Compute the number of basic operations (n^2 for n = 10^4 is 10^8) and compare with roughly 10^7 simple operations per second in Python or 10^8 in C++/Java for a 1-second limit. n up to about 3,000 is comfortable for O(n^2) in Python; n = 10^5 needs O(n log n) or better. Rule of thumb only.",
      more: "- n = 10^5 with O(n^2) is 10^10: far too slow.\n- Heavy inner work (heap ops, string building) multiplies the constant.\n- Check the limits in the problem statement, plus whether multiple test cases share the budget.\n- Built-in functions (sort, sum) run in C and are faster than your loops.",
      cx: 'about 1e7 Python ops/sec, 1e8 C++ ops/sec', see: BO
    },

    // ---------- (5) Interview process ----------
    {
      id: 'cx-interview-steps', title: 'How to approach a new coding problem step by step',
      q: ['how to approach a coding interview problem', 'steps to solve a coding problem', 'coding interview framework', 'what to do first in a coding interview', 'problem solving process interview'],
      tags: 'interview approach steps framework clarify examples brute force optimize code test walkthrough',
      a: "1) Restate the problem and ask clarifying questions. 2) Work through an example and an edge case. 3) State a brute force and its complexity. 4) Improve it and agree on the plan with the interviewer. 5) Code cleanly. 6) Test by hand with an example. 7) State time and space complexity.",
      more: "- Don't code before you both agree on the approach.\n- Narrate while you work; silence hides your reasoning.\n- Use clear variable names and small helper functions.\n- Leave a couple of minutes to test: this ordering is a common convention, not a rule.",
      see: ['#/cheatsheets/study-playbook', '#/cheatsheets/talk-track']
    },
    {
      id: 'cx-clarifying-questions', title: 'What clarifying questions to ask',
      q: ['what questions to ask in a coding interview', 'clarifying questions for algorithm problems', 'what to ask before coding', 'edge cases to ask about', 'input constraints questions'],
      tags: 'clarifying questions constraints input size empty duplicates negative sorted return value in place',
      a: "Ask about input and output: size limits, type and range of values, can it be empty, duplicates, negatives, already sorted; what to return if no answer; whether to modify the input; whether multiple answers are allowed; and whether memory is limited.",
      more: "- Size limits tell you the target complexity.\n- Ask for an example if the statement is vague, then repeat it back.\n- Strings: ASCII or Unicode, case-sensitive, spaces?\n- Graphs: directed, weighted, cycles, disconnected?\n- Don't ask so many questions that you stall; 3-5 good ones is plenty.",
      see: ['#/cheatsheets/edge-cases', '#/cheatsheets/study-playbook']
    },
    {
      id: 'cx-test-solution', title: 'How to test your solution in an interview',
      q: ['how to test code in an interview', 'dry run my solution', 'what test cases to try', 'how to find bugs in my code', 'testing after coding interview'],
      tags: 'testing dry run test cases edge cases trace example debug off by one interview verify',
      a: "Trace your code by hand on a small normal example, writing variable values step by step. Then run edge cases: empty input, a single element, duplicates, all equal, the smallest and largest values, and a case where the answer doesn't exist. Fix bugs aloud.",
      more: "- Read the code line by line as if you were the computer, not as you intended it.\n- Check loop bounds and off-by-one at both ends.\n- Verify the return value when nothing is found.\n- Re-check complexity against the code you wrote.",
      see: ['#/cheatsheets/edge-cases']
    },
    {
      id: 'cx-when-stuck-say', title: 'What to say when you are stuck',
      q: ['what to say when stuck in interview', 'i am blank in coding interview', 'how to handle being stuck', 'what if i cannot solve the problem', 'interview panic blank mind'],
      tags: 'stuck blank interview communication think aloud ask for hint panic recover',
      a: "Say where you are: 'The brute force is O(n^2); I'm looking for what to avoid recomputing.' Then try a smaller example, a different data structure, or a related problem you know. If a few minutes pass, ask a specific question or for a hint. Silence is the worst option.",
      more: "- Sample phrases: \"Let me try a small example\", \"I'll start with the brute force so we have something correct\", \"Can I check my assumption about X?\".\n- A correct slower solution beats no solution.\n- Take a breath; pausing to think is fine if you say you're thinking.",
      see: ['#/cheatsheets/talk-track', '#/cheatsheets/study-playbook']
    },
    {
      id: 'cx-handle-hint', title: 'How to handle a hint',
      q: ['how to take a hint in an interview', 'interviewer gave me a hint', 'is asking for a hint bad', 'what to do after a hint', 'respond to interviewer suggestion'],
      tags: 'hint interviewer feedback collaboration coding interview listen adapt',
      a: "Treat a hint as collaboration, not failure. Pause, repeat it back in your own words, and think about how it changes your approach. Then say where it leads and try it. Don't ignore it or defend your old idea; use it and credit it.",
      more: "- Interviewers often evaluate how you respond to input.\n- If you don't understand the hint, ask one clarifying question.\n- After solving, name what the hint unlocked so the interviewer sees you learned from it.",
      see: ['#/cheatsheets/talk-track']
    },
    {
      id: 'cx-explain-complexity', title: 'How to explain complexity in an interview',
      q: ['how to explain time complexity', 'how to state big o in interview', 'explaining space complexity', 'justify my time complexity', 'what to say about complexity'],
      tags: 'explain complexity interview justify time space variables n m amortized say',
      a: "State it with named variables, then justify it by pointing to the code: 'O(n log n) time because we sort once and then make one pass; O(n) extra space for the output.' Define n, name any second variable (m, k, V, E), and say average vs worst case if they differ.",
      more: "- Walk through the dominant loop or recursion, not every line.\n- Mention hidden costs (sorting, slicing, hashing long strings).\n- Include recursion stack in space.\n- If you can do better, say what the trade-off would be.",
      see: ['#/cheatsheets/talk-track', '#/cheatsheets/big-o']
    },
    {
      id: 'cx-practice-effectively', title: 'How to practise coding problems effectively',
      q: ['how to practice leetcode effectively', 'how many leetcode problems should i solve', 'best way to study algorithms', 'how to practice for coding interviews', 'leetcode study plan'],
      tags: 'practice study plan leetcode spaced repetition patterns review mock interview consistency',
      a: "Rules of thumb, not proven laws: study by pattern (two pointers, BFS, DP...) rather than random problems; try for a fixed time (say 20-30 minutes) before reading a solution; then re-solve it from scratch a few days later; keep a short log of mistakes; do timed mocks with another person near the end.",
      more: "- Understanding beats volume: finishing 100 problems well likely helps more than skimming 400.\n- Write code without an editor's help sometimes, since interviews often limit tools.\n- Practise saying your reasoning aloud.\n- Consistent short sessions usually beat rare marathons.\n- Revisit weak topics, not favourites.",
      see: ['#/cheatsheets/study-playbook', '#/cheatsheets/patterns']
    },
    {
      id: 'cx-last-minutes', title: 'What to do in the last minutes of an interview',
      q: ['what to do in last 5 minutes of coding interview', 'running out of time in interview', 'incomplete solution what to do', 'time almost up coding interview', 'how to wrap up interview'],
      tags: 'running out of time wrap up last minutes interview incomplete solution explain remaining',
      a: "Stop adding features and make what you have testable. Finish or stub the core path, run one example, state complexity, and say plainly what's left: 'If I had more time I'd handle X, and here's how.' Describing the fix shows you know the answer.",
      more: "- Prioritise a working simple version over an unfinished clever one.\n- Write pseudocode for missing helpers.\n- Leave a minute for questions to the interviewer.\n- Don't hide a known bug: name it and show how you'd fix it.",
      see: ['#/cheatsheets/night-before', '#/cheatsheets/talk-track']
    },

    // ---------- extra concept entries to round out coverage ----------
    {
      id: 'cx-space-time-tradeoff', title: 'Space-time tradeoff',
      q: ['what is a space time tradeoff', 'trade memory for speed', 'time vs space complexity tradeoff', 'caching tradeoff example', 'precompute vs compute on demand'],
      tags: 'space time tradeoff memory speed caching precompute hash table lookup table',
      a: "A space-time tradeoff means spending extra memory to save time, or the reverse. Hash sets, memo tables, prefix sums and lookup tables all use O(n) memory to turn repeated O(n) work into O(1). In place algorithms save memory but often cost time or mutate the input.",
      more: "- Two Sum: O(n^2) time and O(1) space vs O(n) time and O(n) space.\n- Memoized Fibonacci: O(n) space instead of exponential time.\n- Mention which side the interviewer cares about.",
      see: ['#/topic/big-o']
    },
    {
      id: 'cx-polynomial-vs-exponential', title: 'Polynomial vs exponential time',
      q: ['polynomial vs exponential time', 'what is exponential complexity', 'why is 2^n bad', 'np hard meaning interview', 'when is exponential acceptable'],
      tags: 'polynomial exponential complexity 2^n n! np-hard feasible small n subsets permutations',
      a: "Polynomial time means O(n^k) for a fixed k and scales to large inputs; exponential time (2^n, n!) doubles or worse for each extra item, so it's practical only for n up to roughly 20-25. Subsets and permutations are exponential by nature.",
      more: "- 2^20 is about 1 million; 2^30 is about 1 billion.\n- Memoization or DP can turn exponential recursion into polynomial when states overlap.\n- Problems with no known polynomial algorithm (NP-hard, e.g. travelling salesman) use bitmask DP for small n or approximations.",
      see: ['#/topic/big-o', '#/topic/bitmask-dp']
    },
    {
      id: 'cx-log-n-meaning', title: 'Why log n shows up (halving)',
      q: ['what does log n mean', 'why binary search is log n', 'where does log n come from', 'log base 2 of n intuition', 'O(log n) examples'],
      tags: 'log n logarithm halving binary search tree height heap doubling steps',
      a: "O(log n) means the work shrinks by a constant factor each step, so you need about log2(n) steps to get from n to 1. It appears in binary search, balanced-tree height, heap operations, and loops where a variable doubles or halves. A billion items need only about 30 halvings.",
      code: { py: L('def halvings(n):', '    c = 0', '    while n > 1:', '        n //= 2; c += 1', '    return c', '', 'print(halvings(1_000_000_000))  # 29'), },
      check: 'assert halvings(1_000_000_000) == 29 and halvings(1) == 0 and halvings(8) == 3',
      more: "- The log base doesn't matter in Big-O (constant factor).",
      cx: 'O(log n)', see: ['#/topic/binary-search', '#/topic/big-o']
    },
    {
      id: 'cx-sqrt-n-loop', title: 'Why loop only to the square root',
      q: ['why check divisors up to sqrt n', 'is prime time complexity', 'loop i * i <= n', 'sqrt n optimization', 'factor pairs sqrt'],
      tags: 'sqrt square root prime check divisors factor pairs O(sqrt n) i*i<=n',
      a: "Divisors come in pairs (d, n/d) and one of each pair is at most sqrt(n), so testing d up to sqrt(n) finds any factor. That makes a primality check O(sqrt n). Use `i * i <= n` to avoid floating point.",
      code: { py: L('def is_prime(n):', '    if n < 2: return False', '    i = 2', '    while i * i <= n:', '        if n % i == 0: return False', '        i += 1', '    return True', '', 'print([p for p in range(20) if is_prime(p)])'), },
      check: 'assert [p for p in range(20) if is_prime(p)] == [2,3,5,7,11,13,17,19] and not is_prime(1) and not is_prime(0)',
      cx: 'O(sqrt n)', see: ['#/topic/math']
    },
    {
      id: 'cx-stack-overflow-recursion', title: 'Recursion limit and stack overflow',
      q: ['python recursion limit', 'recursionerror maximum recursion depth exceeded', 'how to avoid stack overflow', 'increase recursion limit python', 'deep recursion fix'],
      tags: 'recursion limit RecursionError stack overflow sys.setrecursionlimit depth iterative explicit stack',
      a: "Python allows about 1000 nested calls by default and raises RecursionError beyond that. Prefer converting to a loop or an explicit stack; `sys.setrecursionlimit` can raise the limit but a very deep chain may still crash the interpreter.",
      code: { py: L('import sys', 'print(sys.getrecursionlimit())   # 1000 by default', 'def depth(n): return 0 if n == 0 else 1 + depth(n - 1)', 'try: depth(10**5)', 'except RecursionError: print("too deep")'), },
      check: 'assert depth(500) == 500',
      more: "- Java/C++ stack depth is limited by thread stack size (typically ten thousand or so frames, platform-dependent).\n- A skewed tree of 10^5 nodes is the classic trigger.",
      see: ['#/topic/recursion']
    },
    {
      id: 'cx-greedy-vs-brute-coin', title: 'Why greedy fails: coin change example',
      q: ['why does greedy fail for coin change', 'greedy counterexample', 'coin change greedy vs dp', 'when is greedy not optimal', 'greedy wrong answer example'],
      tags: 'greedy counterexample coin change dp fails canonical coin system largest first',
      a: "Greedy (always take the largest coin) fails for coins {1, 3, 4} and amount 6: it gives 4+1+1 (3 coins) but 3+3 uses 2. Greedy only works for special coin systems (like US coins); in general use DP.",
      code: { py: L('def greedy(coins, amt):', '    n = 0', '    for c in sorted(coins, reverse=True):', '        n += amt // c; amt %= c', '    return n', '', 'def dp(coins, amt):', '    best = [0] + [float("inf")] * amt', '    for a in range(1, amt + 1):', '        for c in coins:', '            if c <= a: best[a] = min(best[a], best[a - c] + 1)', '    return best[amt]', '', 'print(greedy([1, 3, 4], 6), dp([1, 3, 4], 6))  # 3 2'), },
      check: 'assert greedy([1,3,4],6)==3 and dp([1,3,4],6)==2 and dp([2],3)==float("inf")',
      more: "- Always test greedy on a tiny counterexample before trusting it.",
      see: ['#/topic/greedy', '#/topic/knapsack']
    },
    {
      id: 'cx-sorted-vs-sort', title: 'When sorting first helps',
      q: ['should i sort the input first', 'when to sort array before solving', 'sorting as a preprocessing step', 'does sorting simplify the problem', 'sort then two pointers'],
      tags: 'sort first preprocessing n log n duplicates intervals two pointers binary search greedy',
      a: "Sort first when order isn't part of the answer and sorted data enables something cheaper: grouping duplicates, two pointers, binary search, merging intervals, or greedy choices. It costs O(n log n), so only sort if the rest then fits in that budget.",
      more: "- Don't sort when the answer depends on original indices, unless you keep (value, index) pairs.\n- Sorting loses order for problems like subarrays.\n- A hash map can often avoid the sort and the log factor.",
      see: ['#/topic/sorting', '#/topic/two-pointers']
    },
    {
      id: 'cx-pure-function', title: 'What is a pure function and a side effect',
      q: ['what is a pure function', 'side effects meaning', 'why do pure functions matter', 'idempotent meaning', 'deterministic function'],
      tags: 'pure function side effect deterministic idempotent memoization mutation global state',
      a: "A pure function returns the same output for the same inputs and changes nothing outside itself (no mutation of arguments, globals or I/O). Pure functions are safe to memoize, easy to test and safe to run in parallel. Idempotent means calling twice has the same effect as once.",
      code: { py: L('def add_pure(xs, x): return xs + [x]       # new list', 'def add_impure(xs, x): xs.append(x)         # mutates', 'a = [1]', 'print(add_pure(a, 2), a)  # [1, 2] [1]'), },
      check: 'assert add_pure([1],2)==[1,2] and a==[1]',
      more: "- `lru_cache` is only correct on pure functions.",
      see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-hashable', title: 'What does hashable mean',
      q: ['what does hashable mean', 'unhashable type list', 'why cant list be a dict key', 'make a class hashable', 'hash and eq python'],
      tags: 'hashable unhashable __hash__ __eq__ dict key set member immutable python TypeError',
      a: "An object is hashable if it has a hash value that never changes during its life and an `__eq__` consistent with it. Dict keys and set members must be hashable; lists, dicts and sets are not (they're mutable), tuples of hashables are.",
      code: { py: L('class P:', '    def __init__(self, x, y): self.x, self.y = x, y', '    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)', '    def __hash__(self): return hash((self.x, self.y))', '', 's = {P(1, 2)}', 'print(P(1, 2) in s)  # True'), },
      check: 'assert P(1,2) in s and P(2,1) not in s',
      more: "- Equal objects must have equal hashes.\n- Convert a list to `tuple(lst)` to use it as a key.",
      see: ['#/topic/hashing-internals']
    },
    {
      id: 'cx-dfs-iterative-recursive', title: 'Recursive vs iterative DFS',
      q: ['recursive vs iterative dfs', 'dfs without recursion', 'when to use explicit stack', 'iterative dfs python', 'dfs recursion limit graph'],
      tags: 'dfs iterative recursive explicit stack visited graph deep python',
      a: "Recursive DFS is shorter and fine when depth is under about 1000 in Python. Use an explicit stack for deep graphs (long chains, big grids). Mark nodes visited when pushed or popped consistently to avoid repeats.",
      code: { py: L('def dfs(adj, start):', '    seen, st, order = {start}, [start], []', '    while st:', '        u = st.pop(); order.append(u)', '        for v in adj[u]:', '            if v not in seen: seen.add(v); st.append(v)', '    return order', '', 'print(dfs({0: [1, 2], 1: [3], 2: [], 3: []}, 0))'), },
      check: 'assert sorted(dfs({0:[1,2],1:[3],2:[],3:[]},0))==[0,1,2,3] and dfs({0:[]},0)==[0]',
      cx: 'O(V + E)', see: ['#/topic/graphs']
    },
    {
      id: 'cx-level-vs-depth-height', title: 'Depth vs height vs level of a tree node',
      q: ['depth vs height of a tree', 'height of binary tree definition', 'what is tree level', 'height of empty tree', 'depth of a node'],
      tags: 'tree depth height level root leaf edges nodes definition',
      a: "Depth of a node = edges from the root down to it (root is 0). Height of a node = edges on the longest path down to a leaf (a leaf is 0). Tree height is the root's height. Definitions vary: some count nodes and make an empty tree 0, so confirm which the problem uses.",
      code: { py: L('class N:', '    def __init__(s, v, l=None, r=None): s.v, s.l, s.r = v, l, r', '', 'def height(n):               # counting nodes: empty tree is 0', '    return 0 if not n else 1 + max(height(n.l), height(n.r))', '', 'print(height(N(1, N(2, N(3)), N(4))))  # 3'), },
      check: 'assert height(N(1, N(2, N(3)), N(4))) == 3 and height(None) == 0',
      more: "- LeetCode's max depth (104) counts nodes.",
      see: ['#/topic/trees']
    },
    {
      id: 'cx-bst-property', title: 'What is a binary search tree',
      q: ['what is a bst', 'binary search tree property', 'bst vs binary tree', 'validate bst rule', 'bst search complexity'],
      tags: 'bst binary search tree property left less right greater inorder sorted validate',
      a: "A binary search tree keeps, for every node, all values in its left subtree smaller and all values in its right subtree larger. An inorder traversal visits values in sorted order. Search, insert and delete are O(h): O(log n) if balanced, O(n) if skewed.",
      more: "- Validate by passing allowed (low, high) bounds down, not by comparing only with children.\n- Every BST is a binary tree; not every binary tree is a BST.\n- Python has no built-in BST.",
      see: ['#/topic/trees']
    },
    {
      id: 'cx-visited-when', title: 'When to mark a node visited',
      q: ['when to mark visited in bfs', 'mark visited on push or pop', 'why does my bfs time out', 'visited set bfs duplicates', 'graph traversal visited'],
      tags: 'visited bfs enqueue duplicate nodes time limit exceeded grid graph traversal mark',
      a: "In BFS, mark a node visited when you enqueue it, not when you dequeue it; otherwise the same node can be queued many times and the search can blow up. In DFS, mark on entry. Skipping `visited` in a graph with cycles loops forever.",
      code: { py: L('from collections import deque', 'def bfs(adj, s):', '    seen, q, order = {s}, deque([s]), []', '    while q:', '        u = q.popleft(); order.append(u)', '        for v in adj[u]:', '            if v not in seen:', '                seen.add(v)         # mark when enqueued', '                q.append(v)', '    return order', '', 'print(bfs({0: [1, 2], 1: [2], 2: [0]}, 0))  # [0, 1, 2]'), },
      check: 'assert bfs({0:[1,2],1:[2],2:[0]},0)==[0,1,2]',
      see: ['#/topic/graphs']
    },
    {
      id: 'cx-what-is-pattern', title: 'What are coding interview patterns',
      q: ['what are algorithm patterns', 'coding patterns to learn', 'list of leetcode patterns', 'why learn patterns instead of problems', 'common interview patterns'],
      tags: 'patterns list sliding window two pointers bfs dfs dp heap binary search backtracking intervals',
      a: "Patterns are reusable problem-solving templates. The core set: hash map counting, two pointers, sliding window, prefix sums, binary search (including on the answer), stack / monotonic stack, linked-list pointers, tree DFS/BFS, graph BFS/DFS, heap/top-k, intervals, backtracking, DP, union-find, trie, greedy and bit tricks.",
      more: "- Each pattern has recognisable clues in the problem statement (see the 'how to recognise' entries).\n- Learning ~15 patterns well covers most medium problems; that's a rule of thumb.\n- New problems are often a pattern plus a twist.",
      see: ['#/cheatsheets/patterns', '#/cheatsheets/study-playbook']
    },
    {
      id: 'cx-time-vs-space-which', title: 'Which matters more: time or space',
      q: ['time or space complexity more important', 'should i optimize space or time', 'which to optimize first', 'memory vs speed in interviews', 'optimize time first'],
      tags: 'time vs space optimize priority interview default memory constraints',
      a: "Default to optimizing time first; space is the usual follow-up. Unless the problem states a memory limit, a correct O(n) time solution using O(n) space is a fine answer. Mention the alternative ('I can get O(1) space by sorting in place at the cost of O(n log n) time').",
      more: "- Memory limits matter for big data and embedded work.\n- Ask the interviewer which they care about if unclear.\n- Reducing space (rolling DP rows) is often an easy bonus step.",
      see: ['#/cheatsheets/talk-track']
    },
    {
      id: 'cx-sum-loops-add-multiply', title: 'When complexities add vs multiply',
      q: ['do i add or multiply time complexities', 'sequential vs nested complexity', 'O(n) + O(n^2)', 'two inputs complexity a and b', 'combine complexities'],
      tags: 'add multiply complexities sequential nested drop smaller term two variables n m',
      a: "Add complexities for steps done one after another (O(n) then O(n log n) is O(n log n)); multiply for nested work (a loop of n calls that each cost O(m) is O(n*m)). Use separate variables for separate inputs: looping two different arrays is O(a + b), not O(n).",
      code: { py: L('def steps(n, m):', '    c = 0', '    for _ in range(n):', '        for _ in range(m): c += 1     # n * m', '    for _ in range(n): c += 1         # + n (absorbed)', '    return c', '', 'print(steps(3, 4))  # 15'), },
      check: 'assert steps(3,4)==15 and steps(0,5)==0',
      more: "- Keep the dominant term only when comparable variables are related.",
      see: ['#/topic/big-o']
    },
    {
      id: 'cx-string-immutability-cost', title: 'Why string building in a loop is slow',
      q: ['string concatenation in loop complexity', 'python join vs plus', 'why is s += x slow', 'build string efficiently', 'string immutability cost'],
      tags: 'string concatenation join list immutable O(n^2) builder StringBuilder efficiently',
      a: "Strings are immutable, so each `s += piece` may copy the whole string, making a loop O(n^2) in the worst case. Append pieces to a list and call `''.join(parts)` once for O(n). In Java use StringBuilder.",
      code: { py: L('parts = []', 'for i in range(5):', '    parts.append(str(i))', 's = "".join(parts)', 'print(s)  # 01234'), },
      check: "assert s == '01234' and ''.join([]) == ''",
      more: "- CPython sometimes optimises `+=` in place, but don't rely on it.",
      cx: 'join: O(total length)', see: ['#/cheatsheets/python']
    },
    {
      id: 'cx-concurrency-race', title: 'Race condition, deadlock and lock (short)',
      q: ['what is a race condition', 'what is a deadlock', 'what is a mutex lock', 'thread safety meaning', 'how to avoid deadlock'],
      tags: 'race condition deadlock mutex lock thread safe concurrency shared state synchronization',
      a: "A race condition is a bug where the result depends on the timing of threads touching shared data. A lock (mutex) lets one thread at a time in a critical section. Deadlock is when threads wait on each other's locks forever; avoid it by acquiring locks in a consistent order.",
      code: { py: L('import threading', 'n = 0; lock = threading.Lock()', 'def work():', '    global n', '    for _ in range(10000):', '        with lock: n += 1', 'ts = [threading.Thread(target=work) for _ in range(4)]', '[t.start() for t in ts]; [t.join() for t in ts]', 'print(n)  # 40000'), },
      check: 'assert n == 40000',
      more: "- Without the lock `n += 1` is read-modify-write and can lose updates.\n- Prefer immutable data or queues to share less.",
      see: ['#/cs']
    },
    {
      id: 'cx-nlogn-vs-n2-small', title: 'Is the lower-complexity algorithm always faster?',
      q: ['is O(n log n) always faster than O(n^2)', 'big o vs real performance', 'why insertion sort for small arrays', 'constants in big o', 'big o ignores constants'],
      tags: 'constants big o practical performance small n insertion sort timsort cache locality',
      a: "No. Big-O only describes growth for large n; constants, cache behaviour and small n can reverse it. That's why Timsort uses insertion sort on short runs and a simple linear scan can beat a hash lookup on tiny lists. Pick by growth first, then measure if it matters.",
      more: "- O(1) hash lookup still has hashing cost.\n- Python built-ins run in C, so a built-in O(n log n) sort can beat your hand-written O(n) loop for moderate n.\n- For interviews, state the asymptotic bound and move on.",
      see: ['#/topic/big-o', '#/topic/sorting']
    }
  );
})();
