(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['fenwick'] = {
    primer: {
      kind: 'structure',
      what: `A Fenwick tree (binary indexed tree) is one flat array \`tree\` of n+1 numbers where slot \`i\` stores the sum of the **lowbit(i)** values that end at position \`i\`. \`lowbit(i) = i & -i\` is the value of the lowest set bit of \`i\` (6 is 110, so lowbit 2). Think of mile markers placed at uneven spacing, so any prefix is the sum of just a few markers.`,
      does: `\`add(i, v)\` and \`prefix(i)\` (sum of the first i values) both run in O(log n); a range sum is \`prefix(r) - prefix(l-1)\`; a linear build takes O(n). It needs an operation you can undo, such as sum, count or XOR, so it cannot do range maximum. Walking down its bits also finds the k-th item in O(log n).`,
      impl: `Positions are **1-indexed** (lowbit(0) is 0 and would loop forever). A query moves down: \`while i > 0: s += tree[i]; i -= i & -i\`. An update moves up: \`while i <= n: tree[i] += v; i += i & -i\`. The parent of \`i\` is \`i + (i & -i)\`. For arbitrary values, first compress them to ranks 1..m with \`sorted(set(a))\`. In Python it is one \`list\`.`,
      possibilities: `Mutable range sums, counting how many later elements are smaller, counting inversions and "reverse pairs", counting subarray sums that fall in a band, the k-th smallest in a changing collection, longest increasing subsequence with a prefix-maximum tree, range add with point query, and 2-D grids.`
    },

    think: [
      {
        q: `What is \`12 & -12\`, which positions does \`tree[12]\` cover, and which nodes does \`prefix(11)\` add up?`,
        a: `12 is 1100, so the lowest set bit is 4 and tree[12] covers the 4 values ending at 12: positions 9..12. For prefix(11): 11 is 1011. Take tree[11] (covers 11 alone), clear the lowest bit to get 10 (1010): tree[10] covers 9..10, clear again to get 8 (1000): tree[8] covers 1..8. Three nodes, with blocks 11, 9..10 and 1..8 that tile 1..11 exactly. One step per set bit of the index.`
      },
      {
        q: `n = 8. You add a value at position 5. Which tree slots change? Predict before you compute.`,
        a: `5 is 101 with lowbit 1. Slot 5 changes. Add the lowbit: 6 (110, lowbit 2), so slot 6 changes. Add 2 to get 8 (1000), slot 8 changes. Add 8 to get 16 > n, stop. So 5, 6, 8. Check: slot 6 covers 5..6 and slot 8 covers 1..8, and both contain position 5; no other slot does. An update climbs to every wider block that still contains the position.`
      },
      {
        q: `Why must a Fenwick tree be 1-indexed? What happens in a 0-indexed version with \`i += i & -i\`?`,
        a: `At i = 0, \`0 & -0\` is 0, so \`i += 0\` never moves: an infinite loop on updates. The structure's whole shape comes from the binary form of positive integers, where each index owns the block ending at it. So you shift the user's 0-based index by one, and keep slot 0 unused. This is the most common beginner bug.`
      },
      {
        q: `Someone says "I'll use a Fenwick tree for range maximum with point updates". Why does that not work with the usual \`prefix(r) - prefix(l-1)\` idea, and what do you use instead?`,
        a: `A range sum is the difference of two prefixes because addition can be undone: sum(l..r) = prefix(r) - prefix(l-1). A maximum cannot be undone: knowing max(1..r) and max(1..l-1) tells you nothing about max(l..r). So the Fenwick trick breaks, and the right tool is a segment tree (or a sparse table when nothing changes). Fenwick tools need an invertible operation: sum, count, XOR.`
      },
      {
        q: `Sweeping \`[5, 2, 6, 1]\` from the right to count smaller elements after each one, why is the query \`prefix(rank - 1)\` and not \`prefix(rank)\`?`,
        a: `Ranks of 1, 2, 5, 6 are 1, 2, 3, 4. Going right to left, for the 2 (rank 2) the tree holds 1 (rank 1), 6, and nothing else: prefix(1) = 1 smaller value. prefix(2) would include rank 2 itself, which counts earlier copies of the same value as smaller. "Strictly smaller" means ranks below the current one, so the query stops at rank - 1. With duplicates like [-1, -1] it is the difference between 0 and 1.`
      },
      {
        q: `A range sum \`l..r\` needs \`prefix(r)\` and \`prefix(l-1)\`. About how many array reads is that for n = 10^6, and how does it compare with a plain loop?`,
        a: `Each prefix reads at most one slot per set bit of its index, at most 20 for n near a million, so around 40 reads in total, typically fewer (about half the bits are set). A plain loop over a wide range reads up to 10^6 numbers. That gap is why mixing many updates with many range sums needs the tree: both operations cost about 20 steps instead of up to a million.`
      }
    ],

    breakdown: [
      {
        title: `1. The mile-marker idea`,
        body: `A prefix-sum array is a row of mile markers: reading one is instant, but if one value changes, every later marker is wrong. A Fenwick tree keeps **fewer, shorter markers** so that a change touches a handful and a read adds a handful. Concretely: slot \`i\` stores the sum of one block of values ending at \`i\`, and the block length is the lowest set bit of \`i\`. Odd positions hold themselves, positions like 2, 6, 10 hold two values, positions like 4, 12 hold four, 8 holds eight. A prefix is then a few non-overlapping blocks side by side. Target costs: add O(log n), prefix O(log n).`
      },
      {
        title: `2. lowbit and what each slot covers (n = 8)`,
        body: `\`lowbit(i) = i & -i\` isolates the lowest set bit: 6 is 110 and lowbit 2; 8 is 1000 and lowbit 8. The slot covers positions \`i - lowbit(i) + 1 .. i\`:

| i | binary | lowbit | covers |
|---|---|---|---|
| 1 | 0001 | 1 | 1 |
| 2 | 0010 | 2 | 1..2 |
| 3 | 0011 | 1 | 3 |
| 4 | 0100 | 4 | 1..4 |
| 5 | 0101 | 1 | 5 |
| 6 | 0110 | 2 | 5..6 |
| 7 | 0111 | 1 | 7 |
| 8 | 1000 | 8 | 1..8 |

For values \`[5,3,7,1,4,2,8,6]\` the slots are: t1=5, t2=8, t3=7, t4=16, t5=4, t6=6, t7=8, t8=36.`
      },
      {
        title: `3. Query: walk down by clearing the lowest bit`,
        body: `\`prefix(7)\` for the array above. 7 is 111. Take t7 = 8 (covers position 7). Clear the lowest set bit: 7 - 1 = 6, take t6 = 6 (covers 5..6). Clear: 6 - 2 = 4, take t4 = 16 (covers 1..4). Clear: 4 - 4 = 0, stop. Sum 8 + 6 + 16 = 30, which equals 5+3+7+1+4+2+8. The blocks never overlap, and they end exactly where the next one begins. Each step removes a set bit, so there are at most log2(n) + 1 steps. Edge case: prefix(0) is 0 and takes no steps.`,
        code: { py: `def prefix(i):
    s = 0
    while i > 0:
        s += tree[i]
        i -= i & -i      # clear the lowest set bit
    return s` }
      },
      {
        title: `4. Update: walk up by adding the lowest bit`,
        body: `Add 5 at position 3. Which slots contain position 3? Slot 3 itself (covers 3), slot 4 (covers 1..4) and slot 8 (covers 1..8). The walk: i = 3, add to t3; i += lowbit(3) = 1 gives 4, add to t4; i += 4 gives 8, add to t8; i += 8 gives 16 > n, stop. New slots: t3=12, t4=21, t8=41. Check prefix(4) = t4 = 21 = 5+3+12+1 ✓. Adding the lowest bit carries into the next wider block that still covers the position. Cost O(log n). Edge case: updates at position 0 must be shifted to 1.`,
        code: { py: `def add(i, v):
    while i <= n:
        tree[i] += v
        i += i & -i      # jump to the next wider block containing i` }
      },
      {
        title: `5. Range sums, and "set" versus "add"`,
        body: `Sum of positions \`l..r\` is \`prefix(r) - prefix(l - 1)\`. Check on the array above: positions 3..6 gives prefix(6) - prefix(2) = (t6 + t4) - t2 = (6 + 16) - 8 = 14 and 7+1+4+2 = 14 ✓. The tree only knows how to **add**. To assign a new value at position i, add the difference: \`add(i, new - current[i])\`, which means keeping a plain copy of the array. Forgetting this (adding the new value itself) is the classic mutable-range-sum bug. This works because addition is invertible; with maximum it would not.`
      },
      {
        title: `6. Building fast: push each node to its parent`,
        body: `The parent of slot \`i\` is \`i + lowbit(i)\`: the slot whose block contains i's block. Every parent has a larger index than its children, so a left-to-right loop works. Copy the values into \`tree[1..n]\`, then for \`i = 1..n\`: let \`j = i + (i & -i)\`; if \`j <= n\`, do \`tree[j] += tree[i]\`. When the loop reaches i, all of i's children were already pushed in, so \`tree[i]\` is final. Total O(n), versus O(n log n) for n separate adds. Verify on [5,3,7,1]: tree = [5,3,7,1]; i=1 pushes 5 into t2 -> 8; i=2 pushes 8 into t4 -> 9; i=3 pushes 7 into t4 -> 16; i=4: parent 8 > n, stop. t4 = 16 ✓.`
      },
      {
        title: `7. Counting by rank: the interview use`,
        body: `"For each element, how many later elements are smaller?" Values can be negative or huge, so compress: sort the distinct values and use the rank 1..m. For \`[5,2,6,1]\` the ranks are 5->3, 2->2, 6->4, 1->1. Sweep from the right keeping a Fenwick tree of counts per rank. For 1 (rank 1): prefix(0) = 0, then add at rank 1. For 6 (rank 4): prefix(3) = 1, add at 4. For 2 (rank 2): prefix(1) = 1, add at 2. For 5 (rank 3): prefix(2) = 2, add at 3. Answers, in the original order: [2, 1, 1, 0]. Query \`rank - 1\`, so equal values do not count as smaller. O(n log n) total.`,
        code: { py: `def count_smaller_after(a):
    ranks = {v: r for r, v in enumerate(sorted(set(a)), 1)}
    m = len(ranks)
    tree = [0] * (m + 1)
    out = [0] * len(a)
    for idx in range(len(a) - 1, -1, -1):
        r = ranks[a[idx]]
        i, s = r - 1, 0
        while i > 0:
            s += tree[i]
            i -= i & -i
        out[idx] = s
        i = r
        while i <= m:
            tree[i] += 1
            i += i & -i
    return out` }
      },
      {
        title: `8. Recognise it, and know its limits`,
        body: `**Spot it:** point updates mixed with prefix or range sums or counts; "count earlier or later elements that are smaller/larger"; inversions; counts of pairs under an inequality after rearranging; "k-th smallest" in a changing set. **Limits:** it needs an invertible operation, so no range min or max with arbitrary updates (use a segment tree); range add with range sum needs two trees. **Extras worth knowing:** the k-th element can be found by walking down the bits from the highest power of two, adding block sizes while their count is less than k (O(log n)). A Fenwick tree can hold a prefix **maximum** if values only ever increase. In an interview, say "Fenwick: shorter and faster than a segment tree when only sums or counts are needed".`
      }
    ],

    drills: [
      {
        title: `Raffle draw`,
        q: `A raffle has n buckets; bucket i holds \`counts[i]\` tickets, numbered consecutively across buckets (bucket 0 gets tickets 1..counts[0], bucket 1 gets the next ones, and so on). Implement \`Raffle(counts)\` with \`add(i, d)\` (change bucket i's ticket count by d, never below 0) and \`owner(t)\` (the bucket index holding ticket number t, or -1 if t is larger than the total). Both O(log n). Example: counts \`[2, 0, 3, 1]\`: \`owner(3)\` is 2; \`owner(6)\` is 3; \`owner(7)\` is -1; after \`add(1, 4)\`, \`owner(3)\` is 1.`,
        hint: `owner is "the smallest index whose prefix sum is at least t". Descend the Fenwick tree from the highest power of two, jumping when the whole block still falls short of t.`,
        how: `I restate it: counts of tickets in buckets that change, and I must map a ticket number to its bucket, which is the smallest index whose prefix sum reaches t. The brute force walks the buckets keeping a running sum, O(n) per draw. Binary search on the answer with prefix queries would be O(log^2 n) because each probe costs a prefix query, which is acceptable but there is a neater trick. A Fenwick tree already has the structure of a binary search built in: slot pos + 2^k covers a block of 2^k values just after pos. So I can build the answer one bit at a time from the highest bit down. Start pos = 0 and step = the largest power of two <= n. If pos + step <= n and tree[pos + step] < t, then the entire block after pos is still too small to reach t, so I can jump: pos += step and t -= tree[pos]. Then halve step and repeat. At the end pos is the largest index whose prefix sum is below t, so the answer's 1-based index is pos + 1, which as a 0-based bucket is pos. If pos ended at n, the total was smaller than t, so -1. Trace counts [2,0,3,1], t = 3: tree is t1=2, t2=2, t3=3, t4=6. step = 4: tree[4] = 6 is not < 3. step = 2: tree[2] = 2 < 3, so pos = 2, t = 1. step = 1: tree[3] = 3 is not < 1. pos = 2: bucket 2 ✓. Strict comparison matters so empty buckets (like bucket 1) are skipped. Edge cases: n = 0, t beyond the total, buckets with zero tickets at the start. Each call is O(log n); space O(n).`,
        code: { py: `class Raffle:
    def __init__(self, counts):
        self.n = len(counts)
        self.tree = [0] * (self.n + 1)
        for i, c in enumerate(counts):
            self.add(i, c)

    def add(self, i, d):
        i += 1
        while i <= self.n:
            self.tree[i] += d
            i += i & -i

    def owner(self, t):
        if self.n == 0:
            return -1
        pos = 0
        step = 1 << (self.n.bit_length() - 1)   # highest power of two <= n
        while step:
            nxt = pos + step
            if nxt <= self.n and self.tree[nxt] < t:
                pos = nxt                       # this whole block is too small
                t -= self.tree[nxt]
            step >>= 1
        return pos if pos < self.n else -1` },
        explain: `The loop maintains: pos is a position whose prefix sum is below the original t, and t is what remains to be found after it. Each jump skips a whole block whose sum is still too small, so at the end pos + 1 is the first index whose prefix reaches the target. Strict comparison skips empty buckets. O(log n) per call, O(n) space.`,
        check: `import random
r = Raffle([2, 0, 3, 1])
assert r.owner(1) == 0 and r.owner(2) == 0
assert r.owner(3) == 2
assert r.owner(6) == 3
assert r.owner(7) == -1
r.add(1, 4)
assert r.owner(3) == 1
assert Raffle([]).owner(1) == -1
assert Raffle([0, 0]).owner(1) == -1
random.seed(2)
for _ in range(300):
    n = random.randint(1, 20)
    arr = [random.randint(0, 3) for _ in range(n)]
    rf = Raffle(arr)
    for _ in range(25):
        if random.random() < 0.5:
            i = random.randrange(n)
            d = random.randint(-arr[i], 3)
            arr[i] += d; rf.add(i, d)
        else:
            t = random.randint(1, sum(arr) + 2)
            s, exp = 0, -1
            for i, c in enumerate(arr):
                s += c
                if s >= t:
                    exp = i; break
            assert rf.owner(t) == exp`
      },
      {
        title: `Climbing triples`,
        q: `Given a list \`a\`, count the triples of positions \`i < j < k\` with \`a[i] < a[j] < a[k]\` (strictly increasing values). It must run in O(n log n). Example: \`[1, 2, 3, 4]\` returns 4 (the triples 123, 124, 134, 234); \`[3, 2, 1]\` returns 0; \`[1, 1, 2, 3]\` returns 2.`,
        hint: `Fix the middle element j. The number of triples through it is (smaller elements before j) times (larger elements after j). Count each side with a Fenwick tree over ranks.`,
        how: `I restate: count increasing triples. The brute force tries all triples, O(n^3), or fixes the middle and scans both sides, O(n^2). The unlock is the product trick: if I fix the middle element j, every valid first element is a smaller value to its left and every valid last element is a larger value to its right, and the choices are independent, so the number of triples through j is left_smaller[j] * right_larger[j]. The total is the sum of those products over all j. Each factor is a counting-by-rank question, so a Fenwick tree fits. Values may repeat or be large, so I compress them to ranks 1..m. Pass one, left to right: for each j, left_smaller[j] = prefix(rank - 1) of what I have inserted so far, then insert my rank. Pass two, right to left with a fresh tree: the number of elements after j is n - 1 - j, and the ones that are not larger are those with rank <= mine, so right_larger[j] = (n - 1 - j) - prefix(rank), where prefix(rank) counts later elements with rank <= mine. Then I add left_smaller[j] * right_larger[j] to the total and insert my rank. Trace [1,1,2,3]: left_smaller = [0,0,2,3]. Right to left: j=3 (value 3): none after, 0. j=2 (value 2): one element after (3), prefix(rank 2) = 0, larger = 1, product 2*1 = 2. j=1 (value 1): after are 2 and 3, prefix(rank 1) = 0, larger = 2, left_smaller 0, product 0. Total 2 ✓. Strictness matters: ties must not count on either side. Time O(n log n), space O(n).`,
        code: { py: `def count_climbs(a):
    n = len(a)
    ranks = {v: r for r, v in enumerate(sorted(set(a)), 1)}
    m = len(ranks)

    def add(t, i):
        while i <= m:
            t[i] += 1
            i += i & -i

    def pref(t, i):
        s = 0
        while i > 0:
            s += t[i]
            i -= i & -i
        return s

    left = [0] * n
    t = [0] * (m + 1)
    for j, x in enumerate(a):
        left[j] = pref(t, ranks[x] - 1)          # earlier, strictly smaller
        add(t, ranks[x])
    t = [0] * (m + 1)
    total = 0
    for j in range(n - 1, -1, -1):
        r = ranks[a[j]]
        right = (n - 1 - j) - pref(t, r)         # later, strictly larger
        total += left[j] * right
        add(t, r)
    return total` },
        explain: `A triple has exactly one middle position, and for that middle the smaller-before and larger-after choices are independent, so the product counts every triple exactly once. Each count is a prefix query on a Fenwick tree of rank counts. O(n log n) time, O(n) space.`,
        check: `import random
assert count_climbs([1, 2, 3, 4]) == 4
assert count_climbs([3, 2, 1]) == 0
assert count_climbs([1, 1, 2, 3]) == 2
assert count_climbs([]) == 0
assert count_climbs([5]) == 0
assert count_climbs([2, 2, 2]) == 0
random.seed(8)
for _ in range(200):
    n = random.randint(0, 14)
    a = [random.randint(-3, 5) for _ in range(n)]
    exp = sum(1 for i in range(n) for j in range(i + 1, n) for k in range(j + 1, n) if a[i] < a[j] < a[k])
    assert count_climbs(a) == exp`
      },
      {
        title: `Longest climb with a prefix-max tree`,
        q: `Return the length of the longest strictly increasing subsequence of \`a\` (not necessarily contiguous) in O(n log n) **using a Fenwick tree** (not the patience-sorting array). Example: \`[10, 9, 2, 5, 3, 7, 101, 18]\` returns 4 (for example 2, 3, 7, 18); \`[5, 5, 5]\` returns 1; \`[]\` returns 0.`,
        hint: `Let best[r] be the longest climb ending in value-rank r. A new element needs the maximum of best over smaller ranks, which is a prefix maximum. Updates only ever raise a stored value.`,
        how: `I restate: longest strictly increasing subsequence. The classic DP says L[i] = 1 + max(L[j]) over earlier j with a[j] < a[i], which is O(n^2) because of the scan over earlier elements. The scan is a "maximum over all earlier elements with a smaller value" question. Compress the values to ranks, and then it is "maximum of best[] over ranks 1..r-1", a prefix maximum over an array indexed by rank. A Fenwick tree can do prefix maximum if its stored values only ever increase: a node stores the maximum of its block, an update sets tree[i] = max(tree[i], new) climbing with i += lowbit, and a query takes the max of the nodes visited while clearing bits. It works here because best[r] only ever grows (I never overwrite a value with a smaller one; if a rank gets a smaller candidate, max keeps the bigger one). That is the condition that makes max safe without an inverse. Procedure for each x in order: r = rank(x); cur = 1 + prefix_max(r - 1); record cur at rank r; the answer is the largest cur seen. Trace [10,9,2,5,3,7,101,18], ranks 2->1, 3->2, 5->3, 7->4, 9->5, 10->6, 18->7, 101->8: 10 gets 1; 9 gets 1; 2 gets 1; 5 gets 2 (after 2); 3 gets 2; 7 gets 3 (after 5 or 3); 101 gets 4; 18 gets 4. Answer 4. Equal values: using r - 1 means a repeat cannot extend itself, so [5,5,5] gives 1. Edge: empty list. Time O(n log n), space O(n).`,
        code: { py: `def lis_length(a):
    ranks = {v: r for r, v in enumerate(sorted(set(a)), 1)}
    m = len(ranks)
    tree = [0] * (m + 1)          # tree[i] = max climb length in the block ending at rank i
    best = 0
    for x in a:
        r = ranks[x]
        i, cur = r - 1, 0
        while i > 0:              # prefix max over strictly smaller ranks
            cur = max(cur, tree[i])
            i -= i & -i
        cur += 1
        best = max(best, cur)
        i = r
        while i <= m:             # only raises values, so max is safe here
            if tree[i] < cur:
                tree[i] = cur
            i += i & -i
    return best` },
        explain: `Each element's best climb is one more than the best climb ending in a strictly smaller value, which is a prefix maximum over ranks. A max-Fenwick tree answers prefix maxima correctly when entries only increase, as they do here. n queries and n updates of O(log n) each give O(n log n); space O(n).`,
        check: `import random
assert lis_length([10, 9, 2, 5, 3, 7, 101, 18]) == 4
assert lis_length([5, 5, 5]) == 1
assert lis_length([]) == 0
assert lis_length([1, 2, 3, 4]) == 4
assert lis_length([4, 3, 2, 1]) == 1
assert lis_length([7]) == 1
def brute(a):
    L = []
    for i in range(len(a)):
        L.append(1 + max([L[j] for j in range(i) if a[j] < a[i]], default=0))
    return max(L, default=0)
random.seed(4)
for _ in range(300):
    a = [random.randint(-5, 9) for _ in range(random.randint(0, 25))]
    assert lis_length(a) == brute(a)`
      },
      {
        title: `Range paint, range total`,
        q: `Implement \`RangeBIT(nums)\` with \`add(l, r, v)\` (add v to every position from l to r inclusive, 0-indexed) and \`total(l, r)\` (the sum of positions l..r). Both O(log n), using Fenwick trees only. Example: \`nums = [1, 2, 3, 4]\`: \`total(0, 3)\` is 10; \`add(1, 2, 10)\` gives \`[1, 12, 13, 4]\`; \`total(0, 3)\` is 30; \`total(2, 2)\` is 13.`,
        hint: `Store the difference array d (a range add is two point updates). Then a prefix sum of the array is a weighted sum of d: sum over k <= i of d[k] * (i - k + 1). Two Fenwick trees cover the two pieces of that formula.`,
        how: `I restate: range add and range sum, both logarithmic. Brute force loops over the range for both, O(n). One Fenwick tree handles a range add followed by a point query by storing the difference array: add +v at l and -v at r+1, and the value at i is the prefix sum of the differences. But a range sum asks for the sum of values, which are themselves prefix sums, so I need a sum of prefix sums. Write the array as prefix sums of d: a[x] = d[1] + ... + d[x]. Then the sum of the first i values is the sum over x <= i of the sum over k <= x of d[k]. Each d[k] appears in (i - k + 1) of those, so prefix(i) = sum over k <= i of d[k] * (i - k + 1) = (i + 1) * sum d[k] - sum k * d[k], which I can rearrange as i * sum d[k] - sum d[k] * (k - 1). So I keep two Fenwick trees: B1 stores d[k], B2 stores d[k] * (k - 1). A range add of v on [l, r] (1-indexed) updates B1 with +v at l and -v at r+1, and B2 with +v * (l - 1) at l and -v * r at r+1 (since k - 1 = r for k = r + 1). Then prefix(i) = query(B1, i) * i - query(B2, i), and total(l, r) = prefix(r + 1) - prefix(l) after converting to 1-indexed. Trace nums [0,0,0] (start from zeros), add(1,2,5) in 1-indexed l=2, r=3: B1 +5 at 2, B2 +5 at 2 (v * 1); prefix(3) = 5 * 3 - 5 = 10 ✓ (5 + 5). Updates at r+1 > n are ignored by the loop. Both operations are O(log n); space is O(n).`,
        code: { py: `class RangeBIT:
    def __init__(self, nums):
        self.n = len(nums)
        self.b1 = [0] * (self.n + 2)     # differences d[k]
        self.b2 = [0] * (self.n + 2)     # d[k] * (k - 1)
        for i, x in enumerate(nums):
            self.add(i, i, x)

    def _upd(self, tree, i, v):
        while i <= self.n:
            tree[i] += v
            i += i & -i

    def _qry(self, tree, i):
        s = 0
        while i > 0:
            s += tree[i]
            i -= i & -i
        return s

    def add(self, l, r, v):              # 0-indexed, inclusive
        l += 1
        r += 1
        self._upd(self.b1, l, v)
        self._upd(self.b1, r + 1, -v)
        self._upd(self.b2, l, v * (l - 1))
        self._upd(self.b2, r + 1, -v * r)

    def _prefix(self, i):                # sum of the first i values
        return self._qry(self.b1, i) * i - self._qry(self.b2, i)

    def total(self, l, r):
        return self._prefix(r + 1) - self._prefix(l)` },
        explain: `With d the difference array, the sum of the first i values equals i * sum(d[k]) - sum(d[k] * (k - 1)) over k <= i, so two prefix-queryable arrays are enough. A range add changes d at two positions, i.e. two updates on each tree. All operations are O(log n); space O(n).`,
        check: `import random
b = RangeBIT([1, 2, 3, 4])
assert b.total(0, 3) == 10
b.add(1, 2, 10)
assert b.total(0, 3) == 30
assert b.total(2, 2) == 13
b.add(0, 3, -1)
assert b.total(0, 3) == 26
one = RangeBIT([5])
one.add(0, 0, 2)
assert one.total(0, 0) == 7
random.seed(6)
for _ in range(300):
    n = random.randint(1, 15)
    arr = [random.randint(-5, 5) for _ in range(n)]
    rb = RangeBIT(arr)
    for _ in range(25):
        l = random.randrange(n); r = random.randrange(l, n)
        if random.random() < 0.5:
            v = random.randint(-4, 4)
            for i in range(l, r + 1):
                arr[i] += v
            rb.add(l, r, v)
        else:
            assert rb.total(l, r) == sum(arr[l:r + 1])`
      }
    ],

    how: {
      315: `Restating: for each position, count how many elements to its right are strictly smaller. The brute force scans everything to the right of every element, O(n^2), which at n = 10^5 is around five billion comparisons. The bottleneck is that I keep re-scanning. The question for each element is "among the values I have already seen on my right, how many are smaller than me?", and that is a counting-by-value query on a set that grows by one element at a time. A Fenwick tree of counts indexed by value gives the number of seen values below any threshold as a prefix sum. Values can be negative and spread out, so I compress them: sort the distinct values and replace each by its rank from 1. I sweep from the right: for the current value with rank r, the answer is prefix(r - 1), the number of seen values with a strictly smaller rank; then I record the value with an update of +1 at rank r. Querying r - 1, not r, is what keeps equal values from counting. Trace [5,2,6,1]: ranks 1->1, 2->2, 5->3, 6->4. From the right: 1 gets 0, then add rank 1; 6 gets prefix(3) = 1; 2 gets prefix(1) = 1; 5 gets prefix(2) = 2. Output in the original order is [2,1,1,0]. Edge cases: one element, all equal, strictly increasing (all zeros), negatives. Sorting is O(n log n) and each of the n updates and queries is O(log m), so overall O(n log n) time and O(n) space.`,
      493: `Restating: count pairs i < j with nums[i] > 2 * nums[j]. The brute force checks every pair, O(n^2). This has the same shape as counting inversions, but the threshold is twice the later value instead of the value itself. Sweeping left to right, for each j I need the number of earlier elements bigger than 2 * nums[j]. Equivalent: the number of earlier elements seen so far minus those that are at most 2 * nums[j]. That is a counting query on a growing set, so a Fenwick tree of counts by rank. The wrinkle is that 2 * nums[j] need not be one of the values, so the query rank comes from binary search: with the sorted distinct values, bisect_right(vals, 2 * y) gives how many distinct values are <= 2y, which is the largest rank to include. Then prefix(that rank) is the number of earlier elements <= 2y, and the pairs for this j are seen - prefix. After the query I insert y itself at its own rank bisect_right(vals, y). Doubling can exceed 32 bits when the input reaches the 32-bit limits, so I compute 2 * y in a wide type (automatic in Python, long in Java and C++). Trace [1,3,2,3,1]: at the second 1 (last element), earlier values 1,3,2,3; those > 2 are 3 and 3, giving 2; the other positions give 0 pairs, so the answer is 2. Merge sort with a two-pointer count before each merge is an equivalent O(n log n) route. Time O(n log n), space O(n).`,
      327: `Restating: count the subarrays whose sum lies in [lower, upper]. The brute force tries every start and end, using prefix sums to get each sum in O(1), so O(n^2) pairs. The key reframing: a subarray sum is prefix[j] - prefix[i] for i < j, so I'm counting pairs of prefix sums (earlier, later) whose difference falls in the band. For a fixed later prefix p, I need the number of earlier prefixes q with lower <= p - q <= upper, i.e. q between p - upper and p - lower. That is a count of earlier values within a value range, and the earlier prefixes form a set that grows by one element at a time, so a Fenwick tree of counts by rank fits. The prefix values are huge or negative, so I compress them: sort the distinct prefix sums (including the initial 0) and use ranks. The count of q in [p - upper, p - lower] is (earlier prefixes <= p - lower) minus (earlier prefixes < p - upper). Both thresholds are not necessarily stored values, so binary search the sorted values: bisect_right(vals, p - lower) and bisect_left(vals, p - upper) give the rank cutoffs for the two prefix queries. I insert the empty prefix 0 before the loop (so subarrays that start at index 0 count), then for each later prefix I query first and insert second. Trace [-2,5,-1] with band [-2,2]: prefixes 0,-2,3,2; matching pairs correspond to the subarrays [-2], [-2,5,-1] and [-1], answer 3. Sums can exceed 32 bits, so use a 64-bit type. Time O(n log n), space O(n).`
    }
  };
})();
