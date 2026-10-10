/* Offer Ready: extra lesson material for this topic (primer, breakdown, think, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['language'] = {
    primer: {
      kind: 'structure',
      what: `Five built-in Python containers cover almost every interview: a **list** (a numbered row of boxes), a **dict** (a filing cabinet: look up a label, get what is inside), a **set** (the same cabinet with labels only), a **deque** (a queue you can add to or take from at both ends) and a **heap** via \`heapq\` (a line where the smallest number is always at the front).`,
      does: `\`list\`: index and append at the end are O(1), insert or delete at the front or middle is O(n), \`x in list\` is O(n). \`dict\` and \`set\`: get, put, contains, remove are O(1) on average. \`deque\`: both ends O(1). \`heapq\`: push and pop O(log n), peek at \`heap[0]\` O(1). \`sorted\` is O(n log n) and stable.`,
      impl: `A list is one block of memory holding pointers, doubled when full. A dict or set is a hash table (array of buckets chosen by \`hash(key)\`). A deque is a chain of small blocks so both ends are cheap. \`heapq\` stores a binary heap inside an ordinary list, a tree packed into array positions. Python ints never overflow; \`//\` and \`%\` round down.`,
      possibilities: `Count things with \`Counter\`; remember what you have seen with a set; run BFS with a deque; keep the k largest items with a size-k min-heap; sort by several keys with \`key=lambda\`; merge sorted streams; build a sliding-window counter. Choosing the right container is half the answer to most easy and medium problems.`
    },
    breakdown: [
      {
        title: 'Step 1: the list, and what is cheap on it',
        body: `A list is boxes in a row, numbered from 0. Because the boxes sit side by side, jumping to box 5 is one step: \`a[5]\` is O(1). Adding at the end is O(1) amortized (when the row is full Python builds a row twice as long and copies once, which averages out).

Trace \`a = [4, 7, 9]\` then \`a.insert(0, 1)\`: 4, 7, 9 each slide one box right, giving \`[1, 4, 7, 9]\`. That is 3 moves for 3 items, so insert at the front is O(n). Same for \`pop(0)\` and for \`x in a\`, which looks at boxes one by one.

Rule: **end of the list is cheap, everything else costs a walk.** In an interview, say the cost of each list call out loud.`,
        code: { py: `a = [4, 7, 9]\na.append(2)      # O(1)  -> [4, 7, 9, 2]\na.pop()          # O(1)  -> removes 2\na.insert(0, 1)   # O(n)  -> [1, 4, 7, 9], everything shifted\n7 in a           # O(n)  -> scans the boxes\na[1:3]           # O(k)  -> a COPY of 2 items` }
      },
      {
        title: 'Step 2: dict and set, the "have I seen it?" boxes',
        body: `A dict answers "what do I know about this key?" without walking. Python turns the key into a number with \`hash(key)\`, uses it to pick a bucket, and looks only there. Average cost is O(1) no matter how many keys exist.

Trace counting \`"abca"\`: start \`{}\`; 'a' not there so \`{'a':1}\`; 'b' gives \`{'a':1,'b':1}\`; 'c'; the second 'a' finds 1 and makes it 2. Four items, four O(1) steps.

A **set** is the dict with no values: use it for "seen before?". Keys must be hashable, so a tuple like \`(2, 3)\` works and a list does not. Reading a missing key with \`d[k]\` raises \`KeyError\`; use \`d.get(k, 0)\`, \`defaultdict\` or \`Counter\`. Cue: any time you write \`x in some_list\` inside a loop, swap the list for a set.`,
        code: { py: `from collections import Counter, defaultdict\ncounts = Counter("abca")        # {'a': 2, 'b': 1, 'c': 1}\ngroups = defaultdict(list)      # missing key -> empty list\ngroups[len("hi")].append("hi")  # {2: ['hi']}\nseen = set()\nseen.add((2, 3))                # tuple key is fine\n(2, 3) in seen                  # True, O(1) on average` }
      },
      {
        title: 'Step 3: the deque, the real queue',
        body: `A queue is first in, first out: BFS, "process in arrival order", sliding windows. Using a list, \`pop(0)\` removes the first item and slides all the others left, O(n) each. A **deque** (say "deck") keeps a chain of small blocks and a pointer at each end, so \`popleft()\` and \`append()\` are both O(1).

Trace a queue holding \`[a, b, c]\`: \`popleft()\` returns a and the deque is \`[b, c]\`; \`append(d)\` gives \`[b, c, d]\`. Nothing shifted.

Edge cases: \`popleft()\` on an empty deque raises \`IndexError\`, so loop with \`while q:\`. Indexing the middle of a deque is O(n), so do not use it as a random-access array. Cue: "level by level", "oldest first", "expire from the front".`,
        code: { py: `from collections import deque\nq = deque([1])\nwhile q:\n    x = q.popleft()      # O(1)\n    if x < 4:\n        q.append(x + 1)  # O(1)` }
      },
      {
        title: 'Step 4: heapq, always the smallest first',
        body: `A heap answers "what is the smallest item right now?" while items keep arriving. \`heapq\` keeps a list arranged so \`heap[0]\` is the minimum: peek O(1), push and pop O(log n) (about log₂ n swaps along one path). Sorting after every insert would cost O(n log n) each time.

Trace \`heappush\` of 5, 2, 8 then \`heappop()\`: you get 2, then the heap holds 5 and 8.

**There is only a min-heap.** For a max-heap push negatives: push \`-x\`, pop and negate. For pairs, push tuples \`(priority, item)\`; Python compares left to right. Keeping the **k largest** uses a min-heap of size k: if it grows past k, pop the smallest, which is not one of the k largest. Cost O(n log k).`,
        code: { py: `import heapq\nh = []\nfor x in [5, 2, 8, 1]:\n    heapq.heappush(h, x)\n    if len(h) > 2:\n        heapq.heappop(h)   # drop the smallest\nprint(h[0])                # 5 = second largest of the four` }
      },
      {
        title: 'Step 5: sorting with a key',
        body: `\`sorted(items, key=f)\` computes \`f(item)\` once per item and orders by those values, O(n log n). It is **stable**: items with equal keys keep their original order.

Trace words \`["bb","a","cc"]\` with \`key=len\`: keys are 2, 1, 2 so the order is \`"a"\`, then \`"bb"\`, \`"cc"\` (the two length-2 words keep their order).

To sort descending on one field and ascending on another, return a tuple and negate the numeric one: \`key=lambda w: (-count[w], w)\` means highest count first, ties alphabetical. Negating only works for numbers, so for strings sort twice (stability makes that safe) or use \`reverse=True\`. \`list.sort()\` sorts in place and returns \`None\`; \`sorted\` returns a new list.`,
        code: { py: `words = ["bb", "a", "cc", "a"]\nfrom collections import Counter\nc = Counter(words)\nprint(sorted(c, key=lambda w: (-c[w], w)))  # ['a', 'bb', 'cc']` }
      },
      {
        title: 'Step 6: ints, division and strings',
        body: `Python ints grow as needed, so nothing overflows. If you port to Java or C++ later, the same code can break at 2³¹ − 1.

Division rounds toward negative infinity: \`-7 // 2\` is -4 and \`-7 % 2\` is 1, with \`(a // b) * b + a % b == a\` always. Java, C++ and JavaScript truncate toward zero: -3 and -1. A very common bug is a digit loop or modulo-index loop that was only tested on positives.

Strings are immutable: \`s[0] = "x"\` is an error, and \`s += c\` in a loop may copy the whole string each time. Collect pieces in a list and \`"".join(parts)\` once. Slices \`s[i:j]\` copy, O(j − i). Comparing \`s == t\` costs up to the string length.`,
        code: { py: `print(-7 // 2, -7 % 2)     # -4 1\nparts = []\nfor ch in "abc":\n    parts.append(ch.upper())\nprint("".join(parts))      # ABC` }
      }
    ],
    think: [
      {
        q: `A BFS uses \`queue = [start]\` and \`node = queue.pop(0)\` in a loop. The graph has 100,000 nodes. Is that fine? What changes if you switch to \`deque\`?`,
        a: `It is slow. \`pop(0)\` shifts every remaining item one box left, so each pop costs up to 100,000 steps and the BFS is O(n²) overall, billions of steps in the worst case. A \`deque\` with \`popleft()\` does the same job in O(1) per pop and the BFS is O(n + edges). The aha: a list is cheap at one end only, and a queue needs both ends.`
      },
      {
        q: `What does this print? \`d = {}\` then \`d["a"] = d.get("a", 0) + 1\` twice, then \`print(d["b"])\`.`,
        a: `The first two lines make \`d = {"a": 2}\`. Then \`d["b"]\` raises \`KeyError: 'b'\` because plain indexing never invents a missing key. \`get("b", 0)\` would return 0. A \`defaultdict(int)\` would return 0 *and insert* \`"b"\`, so merely reading it changes the dict. Know which of the three behaviours you are relying on.`
      },
      {
        q: `You need the 3 largest numbers from a stream of a million numbers, memory is tight. Which container, and why not just sort?`,
        a: `A **min-heap of size 3**. Push each number; if the heap has 4 items, pop the smallest, because it cannot be among the 3 largest. The heap never holds more than 3 items, so memory is O(3) and time is O(n log 3), about O(n). Sorting would need all a million numbers in memory and O(n log n) time. The aha: to keep the biggest, you keep a gatekeeper at the *smallest* of the winners.`
      },
      {
        q: `Predict: \`sorted(["bb", "a", "cc", "dd"], key=len)\`. Which of \`"bb"\`, \`"cc"\`, \`"dd"\` comes first?`,
        a: `\`["a", "bb", "cc", "dd"]\`. The keys are 2, 1, 2, 2; the three equal keys keep their *input* order because Python's sort is stable. So \`"bb"\` stays before \`"cc"\` before \`"dd"\`. Stability is why "sort by count, ties by original order" needs no extra code, and why sorting twice (first by the tie-breaker, then by the main key) works.`
      },
      {
        q: `Why can a tuple be a dict key but a list cannot? And what breaks if you try to use \`[1, 2]\` as a key?`,
        a: `A key's hash decides which bucket it lives in, so the hash must never change while it is stored. A list can be edited (append, assign), so its content, and any hash made from it, could change; Python refuses with \`TypeError: unhashable type: 'list'\`. A tuple cannot be edited, so its hash is stable. Use \`tuple(row)\` when you need a row of numbers as a key, e.g. to group or to compare rows.`
      },
      {
        q: `In Python \`-7 // 2\` is -4. A teammate ports your digit loop to Java and gets -3. Who is right, and why does it matter for an interview?`,
        a: `Both are right in their language. Python floors (rounds toward negative infinity); Java truncates toward zero. For positives they agree, so tests pass, and then negative inputs produce different answers. In an interview, ask "can inputs be negative?" and, if you work in Python, say how the language rounds. If you must match C++ or Java, use \`int(a / b)\` carefully or \`math.fmod\`, or handle the sign yourself.`
      }
    ],
    drills: [
      {
        title: 'Hits in the last five minutes',
        q: `Build a class \`HitCounter\` with \`hit(t)\`, which records a hit at second \`t\` (calls arrive with non-decreasing \`t\`), and \`count(t)\`, which returns how many recorded hits happened in the last 300 seconds, meaning times in the range (t − 300, t]. Example: hits at 1, 2, 3 and 300; \`count(300)\` is 4, \`count(301)\` is 3 (the hit at 1 expired), \`count(600)\` is 0.`,
        hint: `Hits are stored in the order they arrive, and the oldest are the ones that expire. Which container is cheap to remove from the front?`,
        how: `I restate it first: I keep a record of times and, when asked about time t, I must count the ones still inside the 300 second window.

The brute force is a list of all hits and, at each \`count\`, a scan that counts times greater than t − 300. That is O(n) per query, and with millions of hits it is too slow, and it also keeps memory for hits that can never matter again.

The observation is that calls come in time order, so the hits are already sorted, and a hit that has expired for time t is expired for every later t. So expired hits can be thrown away for good, and they are always the oldest ones, at the front.

That says queue, and the right Python queue is a \`deque\`: \`append\` on the right, \`popleft\` on the left, both O(1). A list would make the front removal O(n).

Trace the example. After hits 1, 2, 3, 300 the deque is \`[1, 2, 3, 300]\`. \`count(300)\`: expire anything ≤ 0, nothing, so 4. \`count(301)\`: expire ≤ 1, so 1 leaves and 3 remain. \`count(600)\`: expire ≤ 300, all four are gone, answer 0.

Edge cases: an empty deque (loop guard \`while hits and ...\`), several hits on the same second (each is its own entry), and a query before any hit.

Cost: each hit is appended once and removed at most once, so any sequence of m calls takes O(m) total, O(1) amortized per call. Space is the hits inside the window.`,
        code: { py: `from collections import deque\n\nclass HitCounter:\n    def __init__(self, window=300):\n        self.window = window\n        self.hits = deque()\n\n    def hit(self, t):\n        self.hits.append(t)\n\n    def count(self, t):\n        while self.hits and self.hits[0] <= t - self.window:\n            self.hits.popleft()   # expired for t, so expired forever\n        return len(self.hits)` },
        explain: `Because times never go backwards, the deque stays sorted, so the expired hits are exactly a prefix and popping from the left removes them all. \`len\` then counts the hits with time > t − 300. Each hit is pushed once and popped at most once, so the total over m operations is O(m) (O(1) amortized each). Space is O(hits in one window).`,
        check: `h = HitCounter()
for t in (1, 2, 3, 300):
    h.hit(t)
assert h.count(300) == 4
assert h.count(301) == 3
assert h.count(600) == 0
assert HitCounter().count(5) == 0
g = HitCounter(10)
g.hit(5); g.hit(5); g.hit(14)
assert g.count(14) == 3
assert g.count(15) == 1`
      },
      {
        title: 'Merge sorted streams',
        q: `You are given several lists, each already sorted ascending (some may be empty). Return one sorted list with every value. Example: \`[[1, 4, 9], [2, 3], [], [5]]\` gives \`[1, 2, 3, 4, 5, 9]\`. Do it without concatenating and re-sorting everything.`,
        hint: `At any moment the next output value is the smallest among the *fronts* of the lists. Which container gives you the smallest of a changing group?`,
        how: `My restatement: k sorted lists in, one sorted list out.

The brute force is to concatenate and sort: O(N log N) for N values in total. It is correct, but it ignores that the inputs were already sorted, and interviewers ask for the version that uses that.

The key observation is that the smallest unused value overall is always the front of one of the lists. So I only ever need to compare k values, one per list, not all N.

Choosing the structure: I need "give me the smallest of these k fronts, then replace that front with the next one from the same list". That is a min-heap. I store tuples \`(value, list_index, position)\`. The extra numbers tell me where to continue; they also stop Python from comparing anything else on ties.

Trace \`[[1,4,9],[2,3],[],[5]]\`: the heap starts with \`(1,0,0), (2,1,0), (5,3,0)\` (the empty list is skipped). Pop 1 and push the next from list 0, which is 4. Pop 2, push 3. Pop 3: list 1 is finished, push nothing. Pop 4, push 9. Pop 5. Pop 9. Output \`1,2,3,4,5,9\`.

Edge cases: all lists empty gives \`[]\`; a single list; duplicates across lists.

Cost: each of the N values is pushed and popped once at O(log k), so O(N log k) time, O(k) extra space besides the output. That beats O(N log N) when k is small.`,
        code: { py: `import heapq\n\ndef merge_sorted(lists):\n    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]\n    heapq.heapify(heap)\n    out = []\n    while heap:\n        val, i, j = heapq.heappop(heap)\n        out.append(val)\n        if j + 1 < len(lists[i]):\n            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))\n    return out` },
        explain: `Invariant: the heap holds the first unused value of every non-empty list, so its minimum is the smallest unused value overall, which is exactly what we append next. After taking it we add that list's next value to keep the invariant. Every value enters and leaves the heap once: O(N log k) time, O(k) heap space.`,
        check: `assert merge_sorted([[1, 4, 9], [2, 3], [], [5]]) == [1, 2, 3, 4, 5, 9]
assert merge_sorted([]) == []
assert merge_sorted([[], []]) == []
assert merge_sorted([[3, 3], [3]]) == [3, 3, 3]
assert merge_sorted([[-5, 0], [-6, 1, 2]]) == [-6, -5, 0, 1, 2]`
      },
      {
        title: 'Sum of the smallest k so far',
        q: `Numbers arrive one at a time. After each arrival, report the sum of the \`k\` smallest numbers seen so far (if fewer than k have arrived, the sum of all of them). Example: stream \`[5, 1, 4, 2]\` with \`k = 2\` gives \`[5, 6, 5, 3]\`.`,
        hint: `You never need the whole history, only the k smallest. Python's heap is a min-heap, but here you must throw away the *largest* of the kept group.`,
        how: `Restating: after each number, the answer is the sum of the k smallest values seen so far.

Brute force: keep every number, sort after each arrival and add the first k. That is O(n log n) per step, O(n² log n) overall for a stream of n numbers, and it stores everything.

The observation is that a number which is not among the k smallest now can never be among them later (more numbers only push it further down the ranking). So I can forget it. I only keep k numbers, and I keep a running total instead of re-adding.

Which structure? When a new number arrives, I need to evict the *largest* of my kept group. Evicting the largest of a changing group is a max-heap. Python only has a min-heap, so I push negatives: the smallest negative is the largest real number.

Trace \`[5,1,4,2]\`, \`k=2\`. Push 5: kept {5}, total 5. Push 1: kept {5,1}, total 6. Push 4: kept {5,1,4}, too many, evict the largest (5): total 6 + 4 − 5 = 5. Push 2: kept {1,4,2}, evict 4: total 5 + 2 − 4 = 3. Output \`[5,6,5,3]\`.

Edge cases: \`k = 0\` (everything is evicted, answers 0), negative numbers, duplicates.

Cost: each arrival does one push and at most one pop on a heap of size at most k+1, so O(log k) per number, O(k) space.`,
        code: { py: `import heapq\n\ndef smallest_k_sums(stream, k):\n    heap, total, out = [], 0, []   # heap holds negatives: a max-heap\n    for x in stream:\n        heapq.heappush(heap, -x)\n        total += x\n        if len(heap) > k:\n            total += heapq.heappop(heap)   # popped value is minus the largest\n        out.append(total)\n    return out` },
        explain: `The heap always holds the k smallest values seen so far (a value evicted as the largest of k+1 cannot be among the k smallest later). The running total is adjusted by exactly the value added and the value evicted, so it equals their sum. O(log k) per element, O(k) space.`,
        check: `assert smallest_k_sums([5, 1, 4, 2], 2) == [5, 6, 5, 3]
assert smallest_k_sums([], 3) == []
assert smallest_k_sums([7, 7, 7], 2) == [7, 14, 14]
assert smallest_k_sums([3, -1], 5) == [3, 2]
assert smallest_k_sums([4, 9], 0) == [0, 0]
assert smallest_k_sums([-2, -5, -1], 2) == [-2, -7, -7]`
      },
      {
        title: 'Speak Java arithmetic from Python',
        q: `Write two helpers that behave like 32-bit Java ints. \`java_divmod(a, b)\` returns \`(quotient, remainder)\` where the quotient truncates toward zero and \`a == q*b + r\`. \`wrap32(x)\` returns \`x\` as a signed 32-bit int would hold it after overflow. Examples: \`java_divmod(-7, 2) == (-3, -1)\`, \`wrap32(2147483647 + 1) == -2147483648\`.`,
        hint: `Compute the quotient on absolute values, then fix the sign. For wrap32, keep only the low 32 bits and then decide whether the top bit makes it negative.`,
        how: `Restating: Python's \`//\` floors and its ints never overflow; Java truncates and wraps. I need helpers that reproduce Java's results.

The naive attempt is \`a // b\` and \`a % b\` directly. That agrees with Java for positives, and silently disagrees when exactly one operand is negative: Python gives -4 and 1 for -7 and 2, Java gives -3 and -1. For overflow, Python just keeps growing.

The observation for division: truncating toward zero means "do the division on the sizes, then attach the sign". So \`q = abs(a) // abs(b)\`, and negate it when the signs of a and b differ. The remainder follows from the identity \`a = q*b + r\`, so \`r = a − q*b\`. That gives the remainder the sign of \`a\`, as Java does.

For wrap: a 32-bit int is just the low 32 bits of the number, read in two's complement. \`x & 0xFFFFFFFF\` keeps the low 32 bits as a number from 0 to 2³²−1. If that number is at least 2³¹, the top bit is set and the value is negative, so subtract 2³².

Trace \`wrap32(2147483648)\`: the mask leaves 2147483648, which is ≥ 2³¹, so subtract 4294967296 and get -2147483648. Trace \`java_divmod(-7,2)\`: q = 3, signs differ, q = -3, r = -7 − (−6) = −1.

Edge cases: dividing by a negative, a zero remainder, wrapping a negative number, and a value already in range, which comes back unchanged. Division by zero should raise as in Java; here \`//\` raises \`ZeroDivisionError\`. All are O(1).`,
        code: { py: `def java_divmod(a, b):\n    q = abs(a) // abs(b)\n    if (a < 0) != (b < 0):\n        q = -q\n    return q, a - q * b\n\ndef wrap32(x):\n    x &= 0xFFFFFFFF\n    return x - (1 << 32) if x >= (1 << 31) else x` },
        explain: `Truncation toward zero equals "divide magnitudes, then apply the sign", and the remainder is whatever makes \`a == q*b + r\` true, which gives it the sign of the dividend. Masking to 32 bits reproduces wrapping; subtracting 2³² when bit 31 is set converts to two's complement. Both are O(1) time and space.`,
        check: `assert java_divmod(-7, 2) == (-3, -1)
assert java_divmod(7, -2) == (-3, 1)
assert java_divmod(-7, -2) == (3, -1)
assert java_divmod(8, 2) == (4, 0)
assert wrap32(2147483647 + 1) == -2147483648
assert wrap32(-2147483649) == 2147483647
assert wrap32(123) == 123
assert wrap32(-5) == -5`
      }
    ],
    how: {
      217: `Restate: does any value appear at least twice? Brute force compares every pair, O(n²) time, O(1) space. The bottleneck is that for each element I re-scan the rest to ask "have I seen you?". That question is membership, and the container built for membership is a hash set, O(1) on average. So I walk the array once: if the number is already in the set, return True; otherwise add it. Trace \`[3,1,3]\`: add 3, add 1, see 3 again, return True. For \`[1,2,3]\` the loop ends and I return False. Edge cases: empty or one-element array gives False. The one-liner \`len(set(nums)) != len(nums)\` is the same idea. I would also mention the sort-then-compare-neighbours version: O(n log n) time but no extra set. Time O(n), space O(n). The language point the interviewer checks is that I used a set, not \`x in list\`, which would quietly make this O(n²) again.`,
      242: `Restate: are the two strings made of the same letters with the same counts, in any order? Brute force: sort both and compare, O(n log n). That works, but the order is irrelevant, so sorting does more than needed. What matters is only how many times each letter appears. So I count each string with \`Counter\` (a dict of letter to count) and compare the two dicts; equal counts means anagram. First I check the lengths are equal, which rejects many cases cheaply. Trace \`"rat"\` and \`"tar"\`: both give r1 a1 t1, equal, True. \`"rat"\` vs \`"car"\` gives different dicts, False. Edge cases: different lengths, empty strings (equal), repeated letters (\`"aab"\` vs \`"abb"\` has different counts). Cost: O(n) time; space O(1) for lowercase letters (at most 26 keys), O(k) for a larger alphabet. The practice of reaching for a counting map instead of sorting is the thing being tested.`,
      387: `Restate: return the index of the first letter that occurs exactly once, or -1. Brute force: for each position, scan the whole string to count that letter, O(n²). The bottleneck is recounting the same letters over and over. Fix: count everything once, which is a \`Counter\` (letter to count) in O(n). But I still must return the *first* such letter, in original order, and the dict does not tell me positions. So a second pass walks the string in order and returns the first index whose count is 1. Trace \`"loveleetcode"\`: l2 o2 v1 e4 t1 c1 d1; walking from the left, l is 2, o is 2, v is 1, so the answer is index 2. Edge cases: no unique letter returns -1; single character returns 0; empty string returns -1. Cost: two passes, O(n) time, O(1) space for 26 letters. I would say why the second pass is over the string and not over the dict: dict order is not the question's order.`,
      557: `Restate: reverse the letters inside each word but keep the words in place and keep the spaces. Brute force is already fine: this is linear. The only thinking is about structure. Splitting on a single space \`s.split(" ")\` (not bare \`split()\`, which would collapse repeated spaces) gives the words, and a repeated space shows up as an empty word that reverses to itself. Reverse each word with the slice \`word[::-1]\`, then \`" ".join(...)\` puts the single spaces back. Trace \`"let it go"\`: words let, it, go become tel, ti, og; joined: \`"tel ti og"\`. Edge cases: one word; empty string (the list is \`[""]\` and joins back to empty); words separated by two spaces keep both. Cost: O(n) time and O(n) space, because strings are immutable and each slice makes a copy. The trap to avoid is building the answer with \`+=\` in a loop; \`join\` builds it once.`,
      1046: `Restate: repeatedly smash the two heaviest stones; if they differ, the difference goes back; return the final weight or 0. Brute force: sort the list every round, O(n log n) per round and up to n rounds, so O(n² log n). The bottleneck is that I only ever need the *two largest*, not full order. "Largest of a changing group" is a max-heap. Python has only a min-heap, so I store negatives. Each round pops two (a is the largest, b the second), and if they differ I push back \`a − b\` as a negative. Trace \`[2,7,4,1,8,1]\`: pop 8 and 7, push 1; pop 4 and 2, push 2; pop 2 and 1, push 1; pop 1 and 1, nothing pushed; one 1 is left, so the answer is 1. Edge cases: one stone (return it), all stones cancel (return 0, so check for an empty heap). Cost: each round is O(log n), at most n rounds, so O(n log n) time and O(n) space.`,
      703: `Restate: a class that gets numbers over time and, after each, returns the k-th largest so far. Brute force: keep a list, sort on every add, return the element k from the end, O(n log n) per call. The bottleneck is that I keep full order when I only care about the top k. The observation: the k-th largest is the *smallest* of the top k. If I keep exactly the k largest numbers in a min-heap, the root \`heap[0]\` is the smallest of them, which is the answer. Add: push the new value; if the heap has more than k items, pop the root, since it cannot be among the top k. Trace k=3 with [4,5,8,2]: heap {4,5,8}, root 4. Add 3: push, pop 3, root 4. Add 5: push, pop 4, heap {5,5,8}, root 5. Edge cases: fewer than k numbers at the start (the heap simply is not full yet; the problem guarantees enough for a query), duplicates. Cost: O(log k) per add, O(k) space.`,
      215: `Restate: return the k-th largest value in an unsorted array (counting duplicates). Brute force: sort descending and take index k − 1, O(n log n). That is correct and short, and I would mention it first. To do better in space and time when k is small: keep a min-heap of size k. Walk the array, push each number, and if the heap grows past k, pop the smallest. When I finish, the heap holds the k largest numbers and its root is the smallest of them, which is the k-th largest. Trace \`[3,2,1,5,6,4]\`, k=2: heap grows {3,2}; push 1 then pop 1 gives {2,3}; push 5, pop 2 gives {3,5}; push 6, pop 3 gives {5,6}; push 4, pop 4; root is 5. Edge cases: k = 1 (the maximum), k = n (the minimum), duplicates count separately. Cost: O(n log k) time, O(k) space. An interviewer may then ask for quickselect, which is O(n) average.`,
      692: `Restate: return the k most frequent words, highest count first, ties broken alphabetically. Brute force isn't slow here; the work is in the ordering rule. Step one is counting, with \`Counter\`, O(n). Step two is ordering the distinct words by two criteria at once. Python lets me express this with a tuple key: \`(-count, word)\`. The negative count sorts high counts first, and the word then breaks ties in ascending order. Take the first k. Trace \`["i","love","leetcode","i","love","coding"]\` with k=2: counts i2 love2 leetcode1 coding1. Keys: i (-2,"i"), love (-2,"love"). "i" comes before "love" alphabetically, so the answer is \`["i","love"]\`. Edge cases: k equals the number of distinct words; all counts equal (pure alphabetical order). Cost: O(n) to count plus O(m log m) to sort m distinct words. A heap of size k would give O(m log k), but the sort is usually enough and it is easier to get right.`,
      1636: `Restate: sort numbers by frequency ascending, and where frequencies tie, by value descending. The structure is the same as the previous word problem: count first, then sort with a tuple key. Step one: \`Counter\` over the array. Step two: sort the original numbers (not the distinct ones, since the answer repeats each value) with \`key=lambda x: (counts[x], -x)\`. Ascending count puts rare values first; the negated value turns ascending order into descending order for ties. Trace \`[2,3,1,3,2]\`: counts 2→2, 3→2, 1→1. Keys: 1 gets (1,-1), 2 gets (2,-2), 3 gets (2,-3). Sorted: 1, then 3, 3 (key (2,-3) is smaller than (2,-2)), then 2, 2. Result \`[1,3,3,2,2]\`. Edge cases: all values equal; all different (sorted descending); negative values (negating is still correct). Cost: O(n log n) time, O(n) space. The skill is composing a multi-key sort in one expression.`,
      347: `Restate: return the k most frequent numbers, in any order. Brute force: count, then sort the entries by count, O(n log n). The observation that makes it faster: a count can never exceed n, so counts are small whole numbers that can be array positions. So after counting with \`Counter\`, I make \`n + 1\` buckets where \`buckets[c]\` holds the values that appear exactly c times. Then I walk the buckets from the highest count down and collect values until I have k. No comparison sorting needed. Trace \`[1,1,1,2,2,3]\`, k=2: counts 1→3, 2→2, 3→1; buckets[3]=[1], buckets[2]=[2], buckets[1]=[3]. Walk down: take 1, take 2, stop. Edge cases: k equals the number of distinct values; ties across the cut (the problem guarantees a unique answer). Cost: O(n) time and space. A min-heap of size k is the other accepted answer at O(n log k), and the sort is O(n log n); I would name all three.`,
      49: `Restate: group words that are anagrams of each other. Brute force: compare every pair of words with an anagram test, O(n²) tests. The bottleneck is pairwise comparison. The observation: all anagrams become the same string when their letters are sorted, so sorted letters can be a *label* for the group. Using that label as a dict key, each word goes straight into its group's list with no comparison. I use \`defaultdict(list)\` so a new key starts as an empty list. Trace \`["eat","tea","tan","ate","nat","bat"]\`: eat→"aet", tea→"aet", tan→"ant", ate→"aet", nat→"ant", bat→"abt". Groups: aet has 3 words, ant has 2, abt has 1. The keys must be strings (hashable); a list would raise an error. Edge cases: an empty string is its own valid key; a single word. Cost: O(n · L log L) for n words of length L, because every word is sorted once. Counting letters into a 26-tuple instead gives O(n · L).`,
      56: `Restate: merge all overlapping intervals and return the merged list. Brute force: repeatedly look for any two overlapping intervals and join them until none are left; that can take O(n²) or worse. The key observation: if I sort by start, then an interval can only overlap the *last* merged interval, because everything earlier ends before it begins. So one pass with a "current last" suffices. For each \`(start, end)\`: if \`start ≤ merged[-1][1]\` it overlaps, so I stretch the last end to \`max(last end, end)\` (max, because the new one can sit fully inside). Otherwise I append it as a new interval. Trace \`[[1,3],[8,10],[2,6]]\` sorted: [1,3],[2,6],[8,10]. [2,6] starts at 2 ≤ 3, so the last becomes [1,6]. [8,10] starts after 6, so append. Result \`[[1,6],[8,10]]\`. Edge cases: touching intervals like [1,4],[4,5] merge (≤); a nested interval; one interval. Cost: O(n log n) for the sort, O(n) for the pass.`,
      7: `Restate: reverse the digits of an integer, and return 0 if the result leaves the 32-bit signed range. Brute force: convert to a string, reverse, convert back. That is fine, and for a Python solution it is the shortest. The interview point is the manual digit loop and the overflow. Peel the last digit with \`x % 10\` and drop it with \`x // 10\`, and build \`rev = rev * 10 + digit\`. Trace 123: digit 3, rev 3, x 12; digit 2, rev 32; digit 1, rev 321. Python ints do not overflow, so I work on the absolute value, put the sign back at the end, and check the range \`-2**31 ≤ rev ≤ 2**31 − 1\`, returning 0 if it fails. In Java or C++ I would instead test before the multiply: if rev is greater than MAX/10 (or equal with a digit above 7), the next step would overflow. Working on \`abs(x)\` also avoids Python's floor division of negatives. Edge cases: 0, trailing zeros (120 becomes 21), negative numbers. Cost: O(log₁₀ |x|) time, O(1) space.`
    }
  };
})();
