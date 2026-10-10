(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['heaps'] = {
    primer: {
      kind: 'structure',
      what: 'A **priority queue** is a collection from which you always remove the item with the highest priority next. A **binary heap** is the standard way to build one: a complete binary tree stored in an array in which every parent is smaller than or equal to its children (a min-heap). It is a triage desk: the most urgent patient is always at the front.',
      does: 'It gives you the smallest item instantly and keeps that true as items come and go. **Peek** is O(1); **push** and **pop** are O(log n); building a heap from n values with **heapify** is O(n). It does not keep the rest sorted, and it cannot search or delete by value quickly.',
      impl: 'Stored in a plain array, the node at index `i` has children `2i + 1` and `2i + 2` and parent `(i - 1) // 2`. Push appends at the end and swaps upward while smaller than its parent; pop moves the last item to the root and swaps downward with the smaller child. In Python use `heapq` (min-heap on a list: `heappush`, `heappop`, `heapify`, `heap[0]`); negate numbers for a max-heap.',
      possibilities: 'Top-k and k-th largest of a stream, merging k sorted lists, running median with two heaps, always-process-the-cheapest-next scheduling (task scheduling, Huffman-style joining), and Dijkstra’s shortest paths, where a heap picks the next closest node. Scheduling and event simulations (always run the earliest event next) also use it.'
    },

    breakdown: [
      {
        title: '1. The raw idea: keep the best item cheap to find',
        body: 'You keep receiving jobs and must always do the most urgent next. A plain list finds the minimum by scanning: O(n) per query. A sorted list finds it instantly but inserting a new job shifts items: O(n) per insert. A heap is the compromise. It does **not** keep everything sorted; it only promises that the smallest item is at the front and that repairing the structure after a change costs O(log n). Fully sorted order is more than you need if you only ever ask “what is the best one right now?”.'
      },
      {
        title: '2. The shape: a complete tree flattened into an array',
        body: 'A binary heap is a **complete binary tree**: every level is full except possibly the last, which fills from the left. That shape lets us store it in a plain array with no pointers. Take `[1, 3, 2, 7, 4, 5]`. Index 0 (value 1) is the root. Its children are indices 1 and 2 (values 3 and 2). The children of index 1 are indices 3 and 4 (values 7 and 4); of index 2, index 5 (value 5). The rule: children of `i` are `2i + 1` and `2i + 2`, parent is `(i - 1) // 2`. Check: index 4 has parent `(4 - 1) // 2 = 1`. The **heap property** (min-heap): every parent is <= its children. Siblings have no order.'
      },
      {
        title: '3. Push: add at the end, sift up',
        body: 'Insert 1 into the heap `[2, 5, 3, 9, 6]`. The shape forces the new value into the first free slot, the end: `[2, 5, 3, 9, 6, 1]`, index 5. Compare with its parent at index `(5 - 1) // 2 = 2`, value 3. 1 < 3, so swap: `[2, 5, 1, 9, 6, 3]`, now at index 2. Parent index 0, value 2. 1 < 2, swap: `[1, 5, 2, 9, 6, 3]`. Now at the root, stop. The new value climbed one path from a leaf toward the root, at most the height of the tree, which is about log2(n). That is why push is **O(log n)**. If the new value is large it stops right away.'
      },
      {
        title: '4. Pop: take the root, move the last item up, sift down',
        body: 'Pop from `[1, 5, 2, 9, 6, 3]`. The smallest, 1, is the root: that is what we return. Now there is a hole at the root. Fill it with the **last** array item (3), which keeps the shape complete: `[3, 5, 2, 9, 6]`. Sift down: look at the children of index 0, values 5 and 2. Swap with the **smaller** child (2): `[2, 5, 3, 9, 6]`. The children of index 2 would be indices 5 and 6, which do not exist, so stop. Why the smaller child? If you swapped with the larger one, the smaller child would become the parent of a bigger value and the property would break. Cost: one path down, **O(log n)**.'
      },
      {
        title: '5. Heapify: building a heap from n values in O(n)',
        body: 'Pushing n values one by one costs O(n log n). A better way: sift down every non-leaf, starting from the last parent `n // 2 - 1` and moving back to index 0. Take `[5, 3, 8, 1, 9, 2]` (n = 6, last parent index 2). Index 2 (value 8) has child 2 at index 5: swap, giving `[5, 3, 2, 1, 9, 8]`. Index 1 (value 3) has children 1 and 9: swap with 1, giving `[5, 1, 2, 3, 9, 8]`. Index 0 (value 5) has children 1 and 2: swap with 1, then compare with children 3 and 9: swap with 3, giving `[1, 3, 2, 5, 9, 8]`. Half the nodes are leaves and never move, a quarter move at most one level, and so on, which adds up to O(n).'
      },
      {
        title: '6. The size-k heap for “k largest”',
        body: 'To find the 3 largest of a stream `4, 1, 7, 3, 8, 5`, keep a **min**-heap of at most 3 items. Its root is the weakest of the current top three, the first one to be evicted. Push 4, 1, 7: heap holds `{1, 4, 7}`, root 1. Push 3: size 4, pop the smallest (1): `{3, 4, 7}`. Push 8, pop 3: `{4, 7, 8}`. Push 5, pop 4: `{5, 7, 8}`. The root, 5, is the 3rd largest. Each value costs one push and at most one pop on a heap of size k: **O(n log k)** time, O(k) memory, and it works on a stream you cannot store. The opposite pair (k smallest) uses a max-heap.'
      },
      {
        title: '7. Two heaps, k-way merge, and how to spot a heap',
        body: 'Two more patterns. **Running median**: a max-heap `lo` holds the smaller half and a min-heap `hi` the larger half, sizes equal or `lo` one bigger; the median sits at the roots. Adding 5, 2, 8 gives `lo = {5}`; then `lo = {2}, hi = {5}` (median 3.5); then `lo = {2, 5}, hi = {8}` (median 5). **K-way merge**: a min-heap of one candidate from each sorted list; pop the smallest, push that list’s next. Spot a heap by “k largest/smallest”, “k-th”, “median of a stream”, “merge k sorted”, “always the cheapest next”, or “shortest path”. In Python watch two traps: `heapq` is min-only (negate for max) and tuples with equal first items compare the next item.'
      }
    ],

    think: [
      {
        q: 'Is `[1, 5, 2, 8, 6, 3]` a valid min-heap? Is it sorted?',
        a: 'It is a valid min-heap: index 0 (1) is <= its children 5 and 2; index 1 (5) is <= 8 and 6; index 2 (2) is <= its only child 3. It is not sorted, because 5 comes before 2. A heap only orders each parent against its children, never siblings or cousins. That is the whole reason it is cheaper than a sorted list: the order it promises is weaker.'
      },
      {
        q: 'In a min-heap, where can the second-smallest value be? Can it be at index 5?',
        a: 'It must be a child of the root, so index 1 or index 2. Any other node has an ancestor chain that includes a child of the root, and that ancestor is smaller or equal, so the node cannot be the second smallest unless it ties. So no, not at index 5 (grandchild or deeper). The aha: to read the sorted order you must keep popping, not read the array left to right.'
      },
      {
        q: 'When popping the minimum, why do we move the **last** array element to the root instead of the smaller child?',
        a: 'Removing the last array slot keeps the tree complete, so the array has no gap. Pulling the smaller child up would leave a hole lower down and break the shape. The last element may be big, which breaks the heap property at the root, but that is repaired by sifting it down one path in O(log n). Keep the shape right first, then fix the order.'
      },
      {
        q: 'You want the 3 largest of `[4, 1, 7, 3, 8, 5]`. Which heap do you use, how big, and what is the answer?',
        a: 'A **min**-heap capped at size 3. The root is the smallest of the survivors, which is exactly the one to evict when something better arrives. The final contents are 5, 7, 8; the root 5 is the 3rd largest. Using a max-heap would put the wrong end on top and force you to keep everything. Largest-k needs a min-heap; smallest-k needs a max-heap.'
      },
      {
        q: 'In Python, `heapq.heappush(h, (2, {"a": 1}))` followed by `heapq.heappush(h, (2, {"b": 2}))` raises an error. Why, and what is the fix?',
        a: 'Tuples compare element by element. The first elements are equal (2 and 2), so Python goes on to compare the dictionaries, and dictionaries cannot be ordered, which raises a TypeError. Put a unique counter between priority and payload: `(2, next(counter), item)`. Then ties are resolved by the counter and the payload is never compared.'
      },
      {
        q: 'You have one million numbers already in a list and need them in a heap. Is it faster to call `heappush` a million times or `heapify` once, and why?',
        a: '`heapify` is O(n); a million pushes is O(n log n). Heapify sifts down from the last parent. Half of the nodes are leaves and need no work, a quarter move at most one level, an eighth at most two, and the sum of those distances is proportional to n. A push starts at the bottom and may climb the full height log n, and most pushes happen at the bottom of the tree, so the average is not much lower than log n.'
      }
    ],

    drills: [
      {
        title: 'Cheapest way to join the ropes',
        q: 'You have ropes of given lengths. Joining two ropes costs the sum of their lengths and produces one longer rope. Join all the ropes into one rope with the **smallest total cost**. Example: `[4, 3, 2, 6]` returns `29` (join 2+3=5, then 4+5=9, then 6+9=15, total 5+9+15). `[5]` returns `0`; `[]` returns `0`; `[1, 1]` returns `2`.',
        hint: 'Every rope gets paid for again each time it is part of a join, so you want the longest ropes to be joined as late as possible.',
        how: 'I restate it: repeatedly merge two ropes into one, paying the combined length, until one rope is left; minimise the total payment. A rope that sits inside a merged rope is paid for again every time that rope is joined further, so a long rope that is merged early is charged many times. That suggests joining the **shortest** ropes first and leaving the long ones for late joins. This is the same idea as Huffman coding. The greedy rule is: always take the two shortest ropes currently available, join them, and put the result back. After each join the new rope must compete with the rest, so I need a structure that gives me the smallest item fast and accepts new items: a min-heap. Trace `[4, 3, 2, 6]`: heap {2, 3, 4, 6}. Pop 2 and 3, cost 5, push 5: heap {4, 5, 6}. Pop 4 and 5, cost 9, push 9: heap {6, 9}. Pop 6 and 9, cost 15, push 15. Total 5 + 9 + 15 = 29. A sorted list would work too, but inserting the new rope into it costs O(n) each time. Edge cases: zero or one rope costs 0 (the loop needs at least two items). Cost: heapify O(n), then n - 1 rounds with two pops and a push, each O(log n), so O(n log n) time and O(n) space for the heap.',
        code: {
          py: `import heapq

def min_join_cost(ropes):
    heap = list(ropes)
    heapq.heapify(heap)                   # O(n)
    cost = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)           # two shortest ropes
        b = heapq.heappop(heap)
        cost += a + b
        heapq.heappush(heap, a + b)       # the joined rope competes again
    return cost`
        },
        explain: 'Joining the two shortest ropes first is optimal because every rope’s length is added once per join it takes part in, so the longest ropes should take part in the fewest joins (an exchange argument, the same as Huffman coding). The min-heap supplies the two smallest in O(log n). O(n log n) time.',
        check: `import random
from functools import lru_cache
assert min_join_cost([4, 3, 2, 6]) == 29
assert min_join_cost([5]) == 0
assert min_join_cost([]) == 0
assert min_join_cost([1, 1]) == 2
assert min_join_cost([1, 2, 3, 4, 5]) == 33
@lru_cache(None)
def best(t):
    if len(t) <= 1:
        return 0
    res = float('inf')
    for i in range(len(t)):
        for j in range(i + 1, len(t)):
            rest = [t[k] for k in range(len(t)) if k != i and k != j] + [t[i] + t[j]]
            res = min(res, t[i] + t[j] + best(tuple(sorted(rest))))
    return res
random.seed(4)
for _ in range(60):
    r = [random.randint(1, 9) for _ in range(random.randint(0, 6))]
    assert min_join_cost(r) == best(tuple(sorted(r)))`
      },
      {
        title: 'The k most frequent words',
        q: 'Given a list of words and `k`, return the `k` most frequent distinct words, ordered from most to least frequent; words with the same frequency come in **alphabetical order**. If there are fewer than `k` distinct words, return them all. Example: `["a", "b", "a", "c", "b", "a"]`, `k = 2` returns `["a", "b"]`; `["y", "x", "z"]`, `k = 2` returns `["x", "y"]`.',
        hint: 'Count first. Then you need the k best (count, word) pairs; build a sort key where "best" means smallest: `(-count, word)`.',
        how: 'I restate it: rank words by count, highest first, break ties alphabetically, and keep the top k. The straightforward approach is to count with a dictionary, sort all distinct words by the rule, and slice k. That costs O(d log d) for d distinct words, which is fine, but I only need k of them. When k is small compared with d, a heap that holds only the best k does less work: O(d log k). The trick in Python is turning "best" into "smallest", because `heapq` is a min-heap. I use the key `(-count, word)`: a bigger count becomes a more negative number, so it sorts first; for equal counts, tuples fall through to the word, and alphabetical order is the natural string order. Then `heapq.nsmallest(k, counts.items(), key=...)` returns the k items with the smallest keys in order, and internally it keeps a heap of size k. Trace `["a","b","a","c","b","a"]`: counts a:3, b:2, c:1. Keys: a gets (-3, "a"), b gets (-2, "b"), c gets (-1, "c"). The two smallest are a then b. For `["y","x","z"]` all counts are 1, so the keys differ only in the word: x, y, z; the first two are x and y. Edge cases: `k` larger than the number of distinct words returns all of them; an empty list returns an empty list. Cost: O(n) to count plus O(d log k) to select, O(d) space.',
        code: {
          py: `import heapq
from collections import Counter

def top_k_frequent(words, k):
    counts = Counter(words)
    best = heapq.nsmallest(k, counts.items(), key=lambda p: (-p[1], p[0]))
    return [word for word, _ in best]`
        },
        explain: 'Counter gives each distinct word its count in O(n). The key (-count, word) makes the desired order the ascending order, including the alphabetical tie-break. nsmallest keeps a heap of size k while scanning the d distinct words, so it costs O(d log k). The result is already in the required order.',
        check: `import random
assert top_k_frequent(['a', 'b', 'a', 'c', 'b', 'a'], 2) == ['a', 'b']
assert top_k_frequent(['y', 'x', 'z'], 2) == ['x', 'y']
assert top_k_frequent([], 3) == []
assert top_k_frequent(['q'], 5) == ['q']
assert top_k_frequent(['b', 'a', 'b', 'a', 'c'], 3) == ['a', 'b', 'c']
random.seed(8)
for _ in range(100):
    w = [random.choice('abcdefg') for _ in range(random.randint(0, 25))]
    k = random.randint(1, 8)
    c = {}
    for x in w:
        c[x] = c.get(x, 0) + 1
    want = [x for x, _ in sorted(c.items(), key=lambda p: (-p[1], p[0]))][:k]
    assert top_k_frequent(w, k) == want`
      },
      {
        title: 'Take as many courses as you can',
        q: 'Each course is `(duration, deadline)`: it takes `duration` days and must be **finished by** day `deadline`. You take one course at a time, starting at day 0, and each course you take must be done before moving to the next. Return the **maximum number of courses** you can complete. Example: `[(100, 200), (200, 1300), (1000, 1250), (2000, 3200)]` returns `3`; `[(3, 2)]` returns `0`; `[]` returns `0`.',
        hint: 'Consider the courses in order of deadline. If you go over a deadline, which course already taken is the best one to drop?',
        how: 'I restate it: choose a subset of courses and an order so that each finishes by its deadline, maximising how many. Trying all subsets is 2^n. Two facts simplify it. First, for any chosen set, doing the courses in order of deadline (earliest first) is the best order: if any order is feasible, deadline order is. So I process courses sorted by deadline. Second, I keep a running total of the days used by the courses I have chosen so far. When I consider the next course, I tentatively take it and add its duration. If the total is still within this course’s deadline, everything is fine. If not, I must drop one course from my chosen set, and the best one to drop is the **longest** (it frees the most time and the count shrinks by only one, the same as dropping any other). That is exactly what a max-heap of durations gives me. Dropping the longest, even if it is the one just added, keeps the count as large as possible and the total as small as possible, which is the best state to carry forward. Python’s heap is a min-heap, so I store negated durations. Trace the sample sorted by deadline: (100,200): total 100 fine. (1000,1250): total 1100 fine. (200,1300): total 1300 <= 1300 fine. (2000,3200): total 3300 > 3200, drop the longest, 2000, total 1300. Three courses remain. Edge cases: a course whose duration exceeds its deadline is added and immediately dropped. Cost: O(n log n) for the sort and the heap work, O(n) space.',
        code: {
          py: `import heapq

def max_courses(courses):
    taken = []                            # max-heap (negated durations) of chosen courses
    total = 0
    for duration, deadline in sorted(courses, key=lambda c: c[1]):
        heapq.heappush(taken, -duration)
        total += duration
        if total > deadline:              # over budget: drop the longest course taken
            total += heapq.heappop(taken) # popped value is negative
    return len(taken)`
        },
        explain: 'Sorted by deadline, a set is feasible iff its running total fits each deadline in that order. When adding a course breaks feasibility, removing the longest course in the set restores it with the largest possible freed time while losing only one course, so the greedy keeps the maximum count and the minimum total at every step. O(n log n) time.',
        check: `import itertools, random
assert max_courses([(100, 200), (200, 1300), (1000, 1250), (2000, 3200)]) == 3
assert max_courses([(3, 2)]) == 0
assert max_courses([]) == 0
assert max_courses([(1, 2), (2, 3)]) == 2
assert max_courses([(5, 5), (4, 6), (2, 6)]) == 2
def brute(cs):
    best = 0
    for r in range(len(cs) + 1):
        for combo in itertools.combinations(cs, r):
            t = 0
            ok = True
            for d, dl in sorted(combo, key=lambda c: c[1]):
                t += d
                if t > dl:
                    ok = False
                    break
            if ok:
                best = max(best, r)
    return best
random.seed(9)
for _ in range(100):
    cs = [(random.randint(1, 6), random.randint(1, 15)) for _ in range(random.randint(0, 7))]
    assert max_courses(cs) == brute(cs)`
      },
      {
        title: 'Cheapest walk across a cost grid',
        q: 'A grid of non-negative integers gives the cost of stepping **onto** each cell. Start at the top-left cell (you pay its cost) and reach the bottom-right cell, moving up, down, left or right. Return the **minimum total cost** of a path, including both end cells. Example: `[[1, 3, 1], [1, 5, 1], [4, 2, 1]]` returns `7`; `[[5]]` returns `5`. Note that the cheapest path may need to move up or left.',
        hint: 'Always expand the cheapest known unfinished cell next. A min-heap of (cost so far, row, column) does that.',
        how: 'I restate it: find the cheapest route in a weighted grid with moves in four directions. Only moving right and down would allow a simple table, but here the best path may wind around expensive cells, so a left-to-right table is not enough. The problem is a shortest path in a graph with non-negative weights, where every cell is a node and stepping onto a neighbour costs that neighbour’s value. That is Dijkstra’s algorithm. The idea: keep `best[r][c]`, the cheapest known cost to reach each cell, starting at infinity except the start. Keep a min-heap of `(cost, r, c)`. Repeatedly pop the entry with the smallest cost. Because all costs are non-negative, the first time a cell is popped with its best cost, that cost is final. If the popped entry is worse than `best` for that cell, it is stale (we found a cheaper way after pushing it), so skip it; this is lazy deletion, since a heap cannot update an entry. If it is the bottom-right cell, return its cost. Otherwise try the four neighbours: if `cost + grid[neighbour]` beats `best[neighbour]`, record it and push it. Trace the 3 x 3 example: start cost 1. Neighbours: (0,1) costs 4, (1,0) costs 2. Pop (1,0) at 2; its neighbours (2,0) costs 6, (1,1) costs 7. Pop (0,1) at 4; (0,2) costs 5. Pop (0,2) at 5; (1,2) costs 6. Pop (1,2) at 6; (2,2) costs 7. Pop (2,0) at 6 ... then (2,2) pops at 7: answer 7. Cost: each cell is pushed at most a few times, so O(RC log(RC)) time and O(RC) space.',
        code: {
          py: `import heapq

def min_path_cost(grid):
    rows, cols = len(grid), len(grid[0])
    best = [[float('inf')] * cols for _ in range(rows)]
    best[0][0] = grid[0][0]
    heap = [(grid[0][0], 0, 0)]               # (cost so far, row, col)
    while heap:
        cost, r, c = heapq.heappop(heap)
        if cost > best[r][c]:
            continue                          # stale entry: a cheaper way was found later
        if (r, c) == (rows - 1, cols - 1):
            return cost
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols:
                new = cost + grid[nr][nc]
                if new < best[nr][nc]:
                    best[nr][nc] = new
                    heapq.heappush(heap, (new, nr, nc))`
        },
        explain: 'This is Dijkstra’s algorithm. With non-negative costs, the cheapest unfinished cell in the heap already has its final cost, so popping in cost order never needs a correction. Stale heap entries are skipped (lazy deletion). Each cell is pushed only when its best cost improves, so the work is O(RC log RC).',
        check: `import random
assert min_path_cost([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) == 7
assert min_path_cost([[5]]) == 5
assert min_path_cost([[1, 2]]) == 3
assert min_path_cost([[1], [2], [3]]) == 6
snake = [[1, 1, 1, 1, 1],
         [9, 9, 9, 9, 1],
         [1, 1, 1, 1, 1],
         [1, 9, 9, 9, 9],
         [1, 1, 1, 1, 1]]
assert min_path_cost(snake) == 17
def relax(g):
    R, C = len(g), len(g[0])
    d = [[float('inf')] * C for _ in range(R)]
    d[0][0] = g[0][0]
    changed = True
    while changed:
        changed = False
        for r in range(R):
            for c in range(C):
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < R and 0 <= nc < C and d[r][c] + g[nr][nc] < d[nr][nc]:
                        d[nr][nc] = d[r][c] + g[nr][nc]
                        changed = True
    return d[R - 1][C - 1]
random.seed(6)
for _ in range(60):
    R, C = random.randint(1, 5), random.randint(1, 5)
    g = [[random.randint(0, 9) for _ in range(C)] for _ in range(R)]
    assert min_path_cost(g) == relax(g)`
      }
    ],

    how: {
      703: 'I restate it: build a class that takes k and some starting numbers, and after every `add(val)` reports the k-th largest value seen so far. Re-sorting the whole list on every add is O(n log n) per call, and inserting into a sorted list is O(n) because of shifting; both degrade as the stream grows. The observation: I never need more than the k largest values. The k-th largest is the smallest of those k. So I keep exactly those k values in a **min**-heap: its root is the smallest of the k, which is the answer, and it is also the first one to be thrown out when something bigger arrives. On `add(val)`: while the heap has fewer than k values, push; otherwise, if `val` is bigger than the root, replace the root with `val` (`heapreplace` does a pop and a push in one sift); if it is not bigger, ignore it. Return the root. Trace k = 3, start `[4, 5, 8, 2]`: the first three fill the heap {4, 5, 8}; 2 is smaller than the root 4, so it is ignored. `add(3)` is ignored, answer 4. `add(5)` replaces 4: heap {5, 5, 8}, answer 5. `add(10)` replaces 5: {5, 8, 10}, answer 5. `add(9)` replaces 5: {8, 9, 10}, answer 8. Edge cases: fewer than k values at the start (the first adds just fill the heap); k = 1 always returns the maximum; duplicates occupy separate slots. Cost: O(log k) per add, O(k) space.',
      1046: 'I restate it: repeatedly smash the two heaviest stones. If they weigh the same both vanish; otherwise the lighter one vanishes and the heavier loses that weight. Return the weight of the last stone, or 0. Each round needs the two largest stones from a collection that keeps changing, since the leftover stone goes back in. Re-sorting each round is O(n log n) per round. A max-heap gives the largest in O(log n) and accepts the new stone in O(log n). Python’s `heapq` is a min-heap, so I store negated weights and negate again when reading them. The loop: while more than one stone remains, pop two (the heaviest `a` and the next `b`, with `a >= b`); if `a != b` push the difference `a - b` back. At the end, return the remaining stone, or 0 if the heap is empty. Trace `[2, 7, 4, 1, 8, 1]`: smash 8 and 7, push 1: {4, 2, 1, 1, 1}. Smash 4 and 2, push 2: {2, 1, 1, 1}. Smash 2 and 1, push 1: {1, 1, 1}. Smash 1 and 1, nothing pushed: {1}. The last stone weighs 1. Edge cases: a single stone returns its weight; two equal stones return 0. Cost: at most n rounds with a constant number of heap operations each, so O(n log n) time and O(n) space.',
      973: 'I restate it: given points on a plane, return the k closest to the origin, in any order. Sorting all points by distance and slicing k is O(n log n) and orders more than needed. First, I do not need the square root: comparing `x*x + y*y` ranks points exactly like comparing real distances, and avoids floating point. Now I want the k smallest distances. Keep the k best seen so far; the one to throw out when something better comes along is the **farthest** of the k. That is a **max**-heap keyed by squared distance, capped at size k. For each point: push it; if the heap now holds more than k, pop the farthest. Python’s `heapq` is a min-heap, so I store the negated distance as the first element of the tuple `(-dist, x, y)`. When the loop ends the heap holds exactly the k closest points. Trace `[[3,3],[5,-1],[-2,4]]`, k = 2: distances 18, 26 and 20. Push 18, push 26 (size 2). Push 20 (size 3), pop the farthest, 26 (the point [5,-1]). The heap holds [3,3] and [-2,4]. Edge cases: k equal to n returns everything; ties in distance may be resolved either way since any order is accepted. Cost: O(n log k) time, O(k) space; quickselect would be expected O(n).',
      215: 'I restate it: return the k-th largest element of an unsorted array, where duplicates count separately. Sorting and indexing is O(n log n) and orders all n values when I only need one rank. The observation is the same as for the stream problem: the k-th largest is the smallest of the k largest values. So I keep a **min**-heap holding the k largest values seen so far. Seed it with the first k numbers using `heapify` (O(k)); then for each remaining number, if it beats the root (the smallest of the current top k), replace the root. After one pass the heap contains the k largest values, and its root is the k-th largest. Trace `[3, 2, 1, 5, 6, 4]`, k = 2: seed with {3, 2}, root 2. Value 1 is not greater than 2, skip. Value 5 beats 2: replace, {3, 5}, root 3. Value 6 beats 3: {5, 6}, root 5. Value 4 does not beat 5. Answer 5. Edge cases: k = 1 returns the maximum (heap of one item); k = n returns the minimum; all equal values work since duplicates occupy separate slots. Cost: O(n log k) time, O(k) space. If asked for better, quickselect gives expected O(n) but changes or copies the array and cannot handle a stream; if k is more than n/2, flip it and keep the n - k + 1 smallest in a max-heap.',
      621: 'I restate it: each task takes one unit; two runs of the same letter must be at least n units apart; return the minimum total time, including idle units. Simulating each time step with a max-heap of remaining counts and a cooldown queue works but needs a lot of bookkeeping. A closed form exists. The task with the highest frequency, `top` copies, sets the frame. Its copies need `top - 1` gaps between them, each gap n units long, so the frame is `(top - 1) * (n + 1)` slots (one slot for the task itself plus n for the gap, repeated). After the last copy, one more slot is needed for each task that ties for the highest count. Every other task fits inside the gaps. If there are many distinct tasks, the gaps overflow and no idle time is needed; then the answer is simply the number of tasks. So the answer is the larger of the two numbers. Trace `["A","A","A","B","B","B"]`, n = 2: top = 3, two tasks tie, so (3 - 1) * 3 + 2 = 8, schedule A B _ A B _ A B. For n = 0 the formula gives (3-1)*1 + 2 = 4, but there are 6 tasks, so the answer is 6. Edge cases: a single task gives 1; no idling when the tasks are all different. Cost: O(m) time for m tasks with a count table of 26 letters, O(1) space. The heap simulation is the answer if the actual schedule is requested.',
      295: 'I restate it: support `addNum` for a stream and `findMedian` at any time, where the median is the middle value, or the average of the two middle values when the count is even. Sorting the list on every query is O(n log n); inserting into a sorted array with binary search finds the spot in O(log n) but shifting costs O(n). The median depends only on the one or two values in the middle of the sorted order, so I do not need the full order. Split the numbers into a **lower half** and an **upper half**: a max-heap for the lower half (its root is the largest of the small ones) and a min-heap for the upper half (its root is the smallest of the large ones). Keep their sizes equal, or the lower half one bigger. The median is then the lower root, or the average of both roots. To add a number: push it into the lower heap, move the lower heap’s maximum over to the upper heap (this guarantees everything in the lower half is <= everything in the upper half), and if the upper heap got bigger, move its minimum back. Trace adding 5, 2, 8: after 5, lower {5}, median 5. After 2: lower {2}, upper {5}, median 3.5. After 8: lower {2, 5}, upper {8}, median 5. Python negates values for the max-heap. Cost: O(log n) per add, O(1) per median, O(n) space.'
    }
  };
})();
