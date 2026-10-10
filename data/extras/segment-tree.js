(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['segment-tree'] = {
    primer: {
      kind: 'structure',
      what: `A segment tree is a binary tree stored in a flat array where **every node holds the answer (sum, min, max, gcd...) for one segment** of the input. The root covers the whole array, a node's two children cover its left and right halves, and leaves cover a single element. Think of a tournament bracket: each match result summarises a whole group of players.`,
      does: `Build in O(n). Change one value in O(log n) by fixing the leaf and recomputing its ancestors. Answer any range query in O(log n) by combining a few stored blocks instead of visiting every element. With lazy tags, adding to or assigning a whole range is O(log n) too. The combine must be associative: sum, min, max, gcd, count.`,
      impl: `Recursive layout: root is node 1, the children of node \`k\` are \`2k\` and \`2k+1\`, node \`k\` covers \`[lo, hi]\` and splits at \`mid = (lo + hi) // 2\`; allocate \`4n\` slots. Bottom-up layout: leaves live at \`n..2n-1\`, the parent of \`i\` is \`i // 2\`, and \`2n\` slots are enough. Python has no built-in; use a list \`t\` and two short loops.`,
      possibilities: `Range sum, min or max with updates, range add with lazy tags, "first index whose value is at least k" by walking down the tree, the k-th one in a bit array, longest run of 1s in a range (nodes store prefix, suffix and best), skyline and falling-squares problems, and counting over compressed coordinates.`
    },

    think: [
      {
        q: `n = 8, root is node 1 covering [0, 7], children of node k are 2k and 2k+1. Which node covers [4, 7], and which node is the leaf for index 5?`,
        a: `Node 1 splits at mid = 3 into node 2 = [0, 3] and node 3 = [4, 7]. So [4, 7] is node 3. For index 5: node 3 splits at mid = 5 into node 6 = [4, 5] and node 7 = [6, 7]; node 6 splits into node 12 = [4, 4] and node 13 = [5, 5]. So the leaf is node 13. Notice it equals 8 + 5: when n is a power of two the leaf of index i is n + i.`
      },
      {
        q: `Array \`[5, 3, 8, 6, 2, 7, 4, 1]\` as a sum tree. Which stored nodes does the query "sum of positions 2 to 5" combine, and how many is that, compared with adding 4 elements?`,
        a: `Two nodes: [2, 3] (sum 14) and [4, 5] (sum 9), total 23. That is 2 stored blocks instead of 4 elements. The saving grows with width: a query over 1000 elements still takes about 2 blocks per level, around 20 in total. The idea: any range can be cut into a few pieces that are exactly nodes of the tree.`
      },
      {
        q: `You change \`a[5]\` in an n = 8 sum tree. Which nodes must be recomputed, and why exactly these?`,
        a: `Leaf 13, then its ancestors: node 6 = [4, 5], node 3 = [4, 7], node 1 = [0, 7]. Four nodes, which is log2(8) + 1. Only nodes whose segment contains position 5 can have a different sum; every other segment is untouched. Recompute each from its two children on the way up instead of patching with a delta: it also works for min and max, where deltas do not.`
      },
      {
        q: `A recursive segment tree for n = 6 uses nodes up to index 13, but 2n = 12. Why can't you allocate 2n slots in general, and what do you allocate?`,
        a: `Because the halving split makes uneven branches: for n = 6 the segment [3, 5] splits into [3, 4] and [5, 5], and [3, 4] splits again, so the tree is one level deeper in places and indices run past 2n. The depth is ceil(log2 n), and a safe bound for the largest index is below 4n for every n, so you allocate 4n. The bottom-up layout avoids this and uses exactly 2n.`
      },
      {
        q: `Which of these can be the "combine" of a segment tree: sum, maximum, gcd, "median of the segment"? Say why for the one that fails.`,
        a: `Sum, maximum and gcd work: each combines two half answers into the whole answer, and grouping does not matter (associative). The median fails: the median of a segment is not determined by the two half-medians (halves [1, 2, 3] and [4, 8, 100] have medians 2 and 8 and a whole median of 3.5; halves [1, 2, 3] and [7, 8, 9] have the same medians 2 and 8 but a whole median of 5). Rule: if the answer for a segment cannot be computed from the answers of its two halves, the tree needs richer nodes or is the wrong tool.`
      },
      {
        q: `You write a range-minimum tree but the prune case (segment completely outside the query) returns 0. For \`[5, 3, 8, 6]\`, query min over positions 2 to 3. What do you get, and what should the pruned node return?`,
        a: `The real answer is 6. The two nodes [0, 1] and [2, 3]: [0, 1] is outside, returns 0, [2, 3] is inside and returns 6, and min(0, 6) = 0: wrong. A pruned node must return the **neutral value** of the combine, one that never changes the answer: +infinity for min, -infinity for max, 0 for sum and gcd. With +infinity the result is min(inf, 6) = 6.`
      }
    ],

    breakdown: [
      {
        title: `1. The problem the tree solves`,
        body: `Take \`a = [5, 3, 8, 6, 2, 7, 4, 1]\`. A prefix-sum array answers "sum of positions l..r" in O(1), but when one value changes, every later prefix is wrong: O(n) to repair. A plain array updates in O(1) but sums in O(n). With 10^5 mixed operations either extreme is too slow. The middle road: precompute the sum of **blocks**, big blocks for big queries and small blocks near the edges. If the blocks come from repeatedly halving the array, a query uses only a handful of them and an update touches only the few blocks containing the changed position. That structure is the segment tree.`
      },
      {
        title: `2. The tree for a = [5, 3, 8, 6, 2, 7, 4, 1]`,
        body: `Split in half until single elements, and store each segment's sum:

\`\`\`
                   [0..7] = 36
          [0..3] = 22          [4..7] = 14
      [0..1]=8   [2..3]=14  [4..5]=9   [6..7]=5
      5    3     8    6     2    7     4    1
\`\`\`

Each parent is the sum of its two children: 5+3 = 8, 8+6 = 14, 8+14 = 22, 2+7 = 9, 4+1 = 5, 9+5 = 14, 22+14 = 36. A **node** stores the sum of one segment; a **leaf** is one array element; the root is the whole array. For other combines (min, max, gcd) only the "sum of two children" changes.`
      },
      {
        title: `3. Array layout: how an index maps to a range`,
        body: `Store the tree in a list like a heap. Root = node 1. Node \`k\` has children \`2k\` and \`2k + 1\`; its parent is \`k // 2\`. The range is not stored: you carry \`(lo, hi)\` down the recursion and split at \`mid = (lo + hi) // 2\`: left child is \`[lo, mid]\`, right child \`[mid + 1, hi]\`. For n = 8: node 1 = [0,7]; 2 = [0,3]; 3 = [4,7]; 4 = [0,1]; 5 = [2,3]; 6 = [4,5]; 7 = [6,7]; nodes 8..15 are the leaves for index 0..7. Slot 0 is unused. Because splits can be uneven when n is not a power of two, allocate **4n** slots. The bottom-up variant puts leaf i at \`n + i\` and needs only 2n.`
      },
      {
        title: `4. Build: children first, then the parent`,
        body: `Build is a recursion. \`build(node, lo, hi)\`: if \`lo == hi\` the node is a leaf, so copy \`a[lo]\`. Otherwise build the left child, build the right child, then set \`tree[node]\` to the combine of the two. Order matters: a parent can only be computed after both children. Every node is visited once and does O(1) work, so building is **O(n)** (there are 2n - 1 nodes). Calling \`update\` n times would also work but costs O(n log n). Edge case: n = 0 or 1; guard the empty array so you never call \`build(1, 0, -1)\`.`,
        code: { py: `def build(node, lo, hi):
    if lo == hi:
        tree[node] = a[lo]
        return
    mid = (lo + hi) // 2
    build(2 * node, lo, mid)
    build(2 * node + 1, mid + 1, hi)
    tree[node] = tree[2 * node] + tree[2 * node + 1]` }
      },
      {
        title: `5. Point update: one path from root to leaf`,
        body: `Set \`a[5]\` from 7 to 10 in the tree above. Go down from the root toward the leaf that contains index 5: node 1, then node 3 (5 > mid=3), then node 6, then leaf 13. Write 10 into the leaf. On the way back up, recompute each node from its children: node 6 = 2 + 10 = 12; node 3 = 12 + 5 = 17; node 1 = 22 + 17 = 39. That is 36 + (10 - 7) = 39, as expected. Only one child is visited per level, so the cost is the tree height, **O(log n)**. Always recompute from the children instead of adding the delta; it also works for min and max.`
      },
      {
        title: `6. Range query: prune, cover, or split`,
        body: `Query the sum of positions 2..5 on the original tree. At each node there are three outcomes. **Outside** the query: return the neutral value (0 for sums). **Fully inside**: return the stored value, do not look deeper. **Partial**: ask both children and combine. Root [0,7] is partial. Node 2 [0,3] is partial: its child [0,1] is outside (0) and [2,3] is inside (14). Node 3 [4,7] is partial: [4,5] is inside (9), [6,7] is outside (0). Total 14 + 9 = 23, which equals 8 + 6 + 2 + 7. We touched 7 nodes. The "inside, return now" rule is what keeps it fast; skip it and every query walks to the leaves.`,
        code: { py: `def query(node, lo, hi, l, r):
    if r < lo or hi < l:            # outside
        return 0
    if l <= lo and hi <= r:         # fully inside
        return tree[node]
    mid = (lo + hi) // 2            # partial: split
    return (query(2 * node, lo, mid, l, r) +
            query(2 * node + 1, mid + 1, hi, l, r))` }
      },
      {
        title: `7. Why O(log n), and what else can be stored`,
        body: `At each level at most **two** nodes are partial overlaps: the ones containing the query's left edge and right edge. Every other node at that level is outside or inside and returns immediately. So a query visits about 4 log n nodes however wide the range is. Swap the combine and the neutral value to get other answers: min (neutral +infinity), max (-infinity), gcd (0). The combine must be **associative**; a node may also hold a tuple. For "longest run of 1s" a node stores (prefix run, suffix run, best run, length), and merging two children uses the fact that the best run may cross the middle: \`left.suffix + right.prefix\`.`
      },
      {
        title: `8. Lazy tags, and when not to use it`,
        body: `If an update changes a whole range ("add 5 to positions 3..9"), updating each leaf is O(n). Treat the update like a query: nodes fully inside get the change applied to **themselves** (sum grows by 5 * segment length, or max grows by 5) and keep a **lazy tag** noting that their children still owe the change. Before going deeper into a node, push its tag down to its children. Still O(log n). **Spotting it:** "many updates and range queries interleaved" and the answer is a min/max/gcd/count over a range. If values never change use prefix sums or a sparse table; if you only need point updates with range **sums**, a Fenwick tree is shorter. The segment tree is the tool for non-invertible combines and range updates.`
      }
    ],

    drills: [
      {
        title: `Hotel room finder`,
        q: `A hotel has rooms numbered 0..n-1, each with a free-bed count. Implement \`RoomFinder(beds)\` with \`set(i, v)\` (change room i to v free beds) and \`first_at_least(k)\`, returning the **lowest-numbered** room with at least k free beds, or -1 if none. Both O(log n). Example: beds \`[2, 5, 1, 7]\`: \`first_at_least(4)\` is 1; after \`set(1, 0)\`, \`first_at_least(4)\` is 3; \`first_at_least(8)\` is -1.`,
        hint: `Store the maximum of each segment. If the left child's maximum is at least k, the answer is in the left half; otherwise go right.`,
        how: `I restate it: find the leftmost position whose value is at least k, with the values changing over time. Brute force scans from the left on every query, O(n) each, too slow for many queries. The key observation is that I can decide, from a single stored number, whether a whole block contains a good room: the block's maximum. So I want a segment tree whose nodes store the maximum capacity of their segment. Now a query becomes a descent: if the root's maximum is below k, return -1. Otherwise I know a good room exists; at each node I look at the left child first: if its maximum is at least k, the leftmost good room must be in the left half (anything in the left half is further left than anything in the right half), so I go left; otherwise I go right, where the maximum must be at least k. After log n steps I land on a leaf, which is the answer. I use the bottom-up layout with size rounded up to a power of two so that every internal node has two real children: leaves at size + i, and padding leaves hold -1 so they never qualify. Trace beds [2,5,1,7], k = 4: tree maxima are leaf pairs (5) and (7), root 7. Root >= 4. Left child max 5 >= 4, go left. Its left leaf is 2 < 4, go right to the leaf with 5: index 1. After set(1, 0) the left pair max is 2 < 4, so the walk goes right and finds 7 at index 3. Edge cases: k larger than every capacity returns -1, a single room, k = 0. Update recomputes ancestors, O(log n). Space O(n).`,
        code: { py: `class RoomFinder:
    def __init__(self, beds):
        self.n = len(beds)
        self.size = 1
        while self.size < self.n:
            self.size *= 2
        self.t = [-1] * (2 * self.size)          # -1: padding that never qualifies
        for i, b in enumerate(beds):
            self.t[self.size + i] = b
        for i in range(self.size - 1, 0, -1):
            self.t[i] = max(self.t[2 * i], self.t[2 * i + 1])

    def set(self, i, v):
        i += self.size
        self.t[i] = v
        i //= 2
        while i >= 1:                            # recompute each ancestor
            self.t[i] = max(self.t[2 * i], self.t[2 * i + 1])
            i //= 2

    def first_at_least(self, k):
        if self.t[1] < k:
            return -1
        i = 1
        while i < self.size:                     # walk down toward the leftmost qualifying leaf
            i = 2 * i if self.t[2 * i] >= k else 2 * i + 1
        return i - self.size` },
        explain: `Each node holds the maximum of its segment. If the left child's maximum is at least k the leftmost qualifying leaf is in the left subtree; otherwise it is in the right one, whose maximum is at least k because the parent's is. Padding leaves hold -1 and never qualify for k >= 0. The descent is O(log n), an update recomputes log n ancestors, and space is O(n).`,
        check: `import random
r = RoomFinder([2, 5, 1, 7])
assert r.first_at_least(4) == 1
r.set(1, 0)
assert r.first_at_least(4) == 3
assert r.first_at_least(8) == -1
assert r.first_at_least(0) == 0
one = RoomFinder([3])
assert one.first_at_least(3) == 0 and one.first_at_least(4) == -1
random.seed(5)
for _ in range(300):
    n = random.randint(1, 20)
    arr = [random.randint(0, 9) for _ in range(n)]
    rf = RoomFinder(arr)
    for _ in range(30):
        if random.random() < 0.5:
            i = random.randrange(n); v = random.randint(0, 9)
            arr[i] = v; rf.set(i, v)
        else:
            k = random.randint(0, 10)
            exp = next((i for i, x in enumerate(arr) if x >= k), -1)
            assert rf.first_at_least(k) == exp`
      },
      {
        title: `Longest run of ones`,
        q: `You have a row of lamps, each on (1) or off (0). Implement \`OnesRuns(bits)\` with \`flip(i)\` (toggle lamp i) and \`longest(l, r)\` (the length of the longest block of consecutive lamps that are all on, within positions l..r inclusive). Both O(log n). Example: bits \`[1,1,0,1,1,1,0,1]\`: \`longest(0, 7)\` is 3; \`longest(0, 4)\` is 2; after \`flip(2)\`, \`longest(0, 7)\` is 6.`,
        hint: `Each node must remember more than one number: how long a run of ones it starts with, ends with, its best inside, and its length. Merging has a case where the best run crosses the middle.`,
        how: `I restate it: longest all-ones stretch inside a query window, while lamps flip. Brute force scans the window each time, O(n). A segment tree should help, but a node storing just "best run" is not enough, because two halves with best runs 2 and 3 can have a combined run of 7 across their boundary. So the node has to carry enough to compute the crossing run: pref (how many ones at the left end), suf (how many at the right end), best (longest run inside), and length (number of lamps). Merging left node A and right node B: best is max(A.best, B.best, A.suf + B.pref), pref is A.pref normally but A.length + B.pref when A is entirely ones (A.pref == A.length), suf is symmetric (B.suf, or B.length + A.suf when B is entirely ones), and length adds. A leaf with bit v is (v, v, v, 1). A query asks for the merged node over [l, r]; to avoid inventing a neutral element, I only combine when the query truly spans both children: if the range lies entirely in one child I recurse into it only. Trace [1,1,0,1,1,1,0,1], longest(0, 7): the left half [1,1,0,1] has pref 2, suf 1, best 2; the right half [1,1,0,1] similarly; the crossing run is 1 + 2 = 3, so the answer is 3. After flip(2) the array is [1,1,1,1,1,1,0,1]: the left half is all ones (suffix 4) and the right half starts with a prefix of 2, so the crossing run is 4 + 2 = 6. Edge cases: single lamp, all zeros (answer 0), query of one position. Cost O(log n) per call, O(n) space.`,
        code: { py: `class OnesRuns:
    def __init__(self, bits):
        self.n = len(bits)
        self.bits = list(bits)
        self.t = [None] * (4 * max(1, self.n))
        self._build(1, 0, self.n - 1)

    @staticmethod
    def _merge(a, b):                            # node = (pref, suf, best, length)
        pa, sa, ba, la = a
        pb, sb, bb, lb = b
        pref = la + pb if pa == la else pa       # left half all ones: run continues into the right
        suf = lb + sa if sb == lb else sb
        return (pref, suf, max(ba, bb, sa + pb), la + lb)

    def _build(self, node, lo, hi):
        if lo == hi:
            v = self.bits[lo]
            self.t[node] = (v, v, v, 1)
            return
        mid = (lo + hi) // 2
        self._build(2 * node, lo, mid)
        self._build(2 * node + 1, mid + 1, hi)
        self.t[node] = self._merge(self.t[2 * node], self.t[2 * node + 1])

    def flip(self, i):
        self.bits[i] ^= 1
        self._set(1, 0, self.n - 1, i)

    def _set(self, node, lo, hi, i):
        if lo == hi:
            v = self.bits[i]
            self.t[node] = (v, v, v, 1)
            return
        mid = (lo + hi) // 2
        if i <= mid:
            self._set(2 * node, lo, mid, i)
        else:
            self._set(2 * node + 1, mid + 1, hi, i)
        self.t[node] = self._merge(self.t[2 * node], self.t[2 * node + 1])

    def longest(self, l, r):
        return self._query(1, 0, self.n - 1, l, r)[2]

    def _query(self, node, lo, hi, l, r):
        if l <= lo and hi <= r:
            return self.t[node]
        mid = (lo + hi) // 2
        if r <= mid:
            return self._query(2 * node, lo, mid, l, r)
        if l > mid:
            return self._query(2 * node + 1, mid + 1, hi, l, r)
        return self._merge(self._query(2 * node, lo, mid, l, r),
                           self._query(2 * node + 1, mid + 1, hi, l, r))` },
        explain: `The node tuple has everything needed to merge: the best run in the union is either inside one half or crosses the middle as suf of the left plus pref of the right, and the new prefix and suffix extend across the middle only when a half is entirely ones. The query only merges when the window straddles the middle, so no neutral element is needed. O(log n) per call, O(n) space.`,
        check: `import random
o = OnesRuns([1, 1, 0, 1, 1, 1, 0, 1])
assert o.longest(0, 7) == 3
assert o.longest(0, 4) == 2
o.flip(2)
assert o.longest(0, 7) == 6
one = OnesRuns([0])
assert one.longest(0, 0) == 0
one.flip(0)
assert one.longest(0, 0) == 1
def brute(bits, l, r):
    best = cur = 0
    for x in bits[l:r + 1]:
        cur = cur + 1 if x else 0
        best = max(best, cur)
    return best
random.seed(11)
for _ in range(300):
    n = random.randint(1, 16)
    bits = [random.randint(0, 1) for _ in range(n)]
    o = OnesRuns(bits)
    for _ in range(25):
        if random.random() < 0.4:
            i = random.randrange(n); bits[i] ^= 1; o.flip(i)
        else:
            l = random.randrange(n); r = random.randrange(l, n)
            assert o.longest(l, r) == brute(bits, l, r)`
      },
      {
        title: `Range raise, range peak`,
        q: `Implement \`AddMax(nums)\` with \`add(l, r, v)\` (add v to every position from l to r inclusive) and \`peak(l, r)\` (the maximum value among positions l..r). Both O(log n). Example: \`nums = [1, 5, 2, 4]\`: \`peak(0, 3)\` is 5; \`add(2, 3, 10)\` makes it \`[1, 5, 12, 14]\`; \`peak(0, 2)\` is 12; \`peak(0, 1)\` is 5.`,
        hint: `Lazy trick: never push tags down. Keep a tag on each node meaning "everything in this segment got this much extra", and add tags of the partial nodes you walk through when answering.`,
        how: `I restate: range add and range maximum, both logarithmic. Brute force updates each position (O(n)) and scans for the max (O(n)). A plain max tree gives fast queries but a range add would have to touch every leaf. The standard fix is lazy propagation: store a pending tag and push it down before descending. There is a simpler variant for this problem because "add to all" and "max" interact simply: adding v to everything in a segment adds exactly v to the segment's maximum. So I can keep, in each node, mx = the maximum of the segment counting the node's own tag and all tags below it, but not the tags above it, and tag = the amount added to the whole segment at this node. An update walks like a query: a node fully inside the range gets mx += v and tag += v and I stop. A partial node recurses into the children that overlap and then recomputes mx = max(mx[left], mx[right]) + tag, because the node's own tag applies on top of whatever the children report. For a query, a fully covered node returns mx. A partial node asks the overlapping children, takes the max of their answers, and adds its own tag, since those answers do not include it. No push-down is ever needed because each tag stays where it was put and is added back while walking up. Trace [1,5,2,4], add(2,3,10): the node covering [2,3] has mx 4 and gets mx 14, tag 10. The root recomputes mx = max(5, 14) + 0 = 14. peak(0,2): root is partial; left child [0,1] fully inside returns 5; right child [2,3] is partial: child leaf [2,2] returns 2, then add the tag 10 of [2,3] to get 12; max is 12. Edge cases: negative v, a single-position range, an add that is exactly the whole array. Time O(log n) both, space O(n).`,
        code: { py: `class AddMax:
    def __init__(self, nums):
        self.n = len(nums)
        self.mx = [0] * (4 * max(1, self.n))   # max of the segment, counting tags here and below
        self.tag = [0] * (4 * max(1, self.n))  # added to the whole segment; never pushed down
        self._build(1, 0, self.n - 1, nums)

    def _build(self, node, lo, hi, nums):
        if lo == hi:
            self.mx[node] = nums[lo]
            return
        mid = (lo + hi) // 2
        self._build(2 * node, lo, mid, nums)
        self._build(2 * node + 1, mid + 1, hi, nums)
        self.mx[node] = max(self.mx[2 * node], self.mx[2 * node + 1])

    def add(self, l, r, v):
        self._add(1, 0, self.n - 1, l, r, v)

    def _add(self, node, lo, hi, l, r, v):
        if l <= lo and hi <= r:
            self.mx[node] += v
            self.tag[node] += v
            return
        mid = (lo + hi) // 2
        if l <= mid:
            self._add(2 * node, lo, mid, l, r, v)
        if r > mid:
            self._add(2 * node + 1, mid + 1, hi, l, r, v)
        self.mx[node] = max(self.mx[2 * node], self.mx[2 * node + 1]) + self.tag[node]

    def peak(self, l, r):
        return self._peak(1, 0, self.n - 1, l, r)

    def _peak(self, node, lo, hi, l, r):
        if l <= lo and hi <= r:
            return self.mx[node]
        mid = (lo + hi) // 2
        best = None
        if l <= mid:
            best = self._peak(2 * node, lo, mid, l, r)
        if r > mid:
            right = self._peak(2 * node + 1, mid + 1, hi, l, r)
            best = right if best is None else max(best, right)
        return best + self.tag[node]           # tags above the children are not in their answers` },
        explain: `Invariant: mx[node] is the true maximum of its segment considering all updates applied at this node or below. A partial update fixes it by recomputing from the children plus the node's own tag; a partial query adds the node's own tag to the children's answers because it applies to everything beneath. Tags are never pushed, so each operation visits O(log n) nodes. Space O(n).`,
        check: `import random
a = AddMax([1, 5, 2, 4])
assert a.peak(0, 3) == 5
a.add(2, 3, 10)
assert a.peak(0, 2) == 12
assert a.peak(0, 1) == 5
assert a.peak(3, 3) == 14
a.add(0, 3, -20)
assert a.peak(0, 3) == -6
one = AddMax([7])
one.add(0, 0, 3)
assert one.peak(0, 0) == 10
random.seed(21)
for _ in range(300):
    n = random.randint(1, 15)
    arr = [random.randint(-5, 5) for _ in range(n)]
    s = AddMax(arr)
    for _ in range(25):
        l = random.randrange(n); r = random.randrange(l, n)
        if random.random() < 0.5:
            v = random.randint(-4, 4)
            for i in range(l, r + 1):
                arr[i] += v
            s.add(l, r, v)
        else:
            assert s.peak(l, r) == max(arr[l:r + 1])`
      }
    ],

    how: {
      307: `Restating: given an array, support update(index, val), which replaces one value, and sumRange(left, right), the sum of that stretch, with many calls mixed together. Brute force: keep the array, update in O(1) and sum with a loop in O(n). The prefix-sum alternative flips it: queries are O(1) but one update changes every later prefix, O(n). With tens of thousands of operations on tens of thousands of numbers, both are too slow. The bottleneck is that neither extreme makes both operations cheap. The observation is to store the sums of blocks from a halving split, so that a change touches only the few blocks containing that position and a query uses only a few whole blocks. That is a segment tree. I choose the bottom-up layout because it is short: an array t of size 2n with the numbers at t[n..2n-1], and t[i] = t[2i] + t[2i+1] for i from n-1 down to 1. To update, I write the leaf at index + n, then walk up with i //= 2 recomputing each parent from its two children. To query a half-open range [lo, hi) of leaf positions, I loop while lo < hi: if lo is odd it is a right child whose parent would include elements to the left of the range, so I take t[lo] alone and move lo right; if hi is odd then hi - 1 is a right child inside the range, so I take it; then both move up a level. Trace [1,3,5], sumRange(0,2) = 9, update(1,2), then 8. Edge cases: one element, left == right, negative numbers. Updates and queries are O(log n), build is O(n), space is 2n.`,
      218: `Restating: each building is a rectangle on the ground, [left, right, height]. I must output the outline as points (x, height) where the height changes, ending with a drop to 0, and never two consecutive points with the same height. Brute force paints each building over every integer x and then scans for changes: far too big when coordinates reach 2^31, and still quadratic after compressing. The observation: the outline can only change at a building edge, so I only look at the sorted left and right edges. Sweeping left to right, at any x the outline height is the tallest building currently covering x. That is a max-heap, with one catch: when the sweep passes a building's right edge I would have to delete it from the middle of a heap. Instead I use lazy deletion: store (-height, right edge) and, at each event, pop from the top while the top building's right edge is <= x, since those have ended. A ground entry (0, infinity) keeps the heap non-empty. Event ordering at the same x matters: starts must come before ends, and taller starts first, otherwise I would emit a false dip. I encode a start as (l, -h, r) and an end as (r, 0, 0); sorting puts the more negative (taller) starts first and ends after all starts. After handling an event I read the top height and emit [x, top] only if it differs from the last emitted height. Trace [[1,4,6],[2,3,9],[6,8,4]]: 6 at 1, 9 at 2, building 9 expires at 3 so back to 6, building 6 expires at 4 so 0, then 4 at 6, 0 at 8. Time O(n log n), space O(n).`,
      699: `Restating: squares drop one at a time onto a number line, each with a left x and a side length. A square stops when it lands on the highest surface beneath its span, and touching only at a boundary does not count. After each drop, I output the current tallest height anywhere. Brute force keeps a height for every unit of the line; with coordinates up to 10^8 that is far too big, and even with only the n squares, finding the highest surface under a span by scanning a list of earlier squares is O(n) each, O(n^2) overall. The observations: coordinates are huge but only the 2n edge values matter, so I compress them; and each drop is two operations on a range: find the maximum height under [left, left+side), then set the whole range to max + side. Because the new height is at least everything under it, "assign" is the same as "raise to at least this", which is a chmax. So a segment tree works with a max and a tag. Each compressed index stands for the stretch from one coordinate to the next, so the span [left, left+side) maps to indexes [rank(left), rank(left+side) - 1]; that is what makes touching squares not overlap. In each node I keep mx (the highest value in the segment) and tag (a floor applied to the whole segment), never pushing tags down: a query that ends at a partial node uses max(tag, the children's answers). After each drop I update a running best answer and append it. Trace [[0,3],[2,2],[10,1]]: first square top 3; second spans [2,4), max under it is 3 so it rises to 5; third far away lands at 1: results 3, 5, 5. Time O(n log n), space O(n).`
    }
  };
})();
