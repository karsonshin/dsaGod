/* Offer Ready: extra lesson material for this topic (primer, breakdown, think, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['big-o'] = {
    primer: {
      kind: 'technique',
      what: `**Big-O** is a way to describe how the work of a program (or the memory it uses) grows as the input gets bigger, ignoring constants. It is like asking how a road trip changes if the distance doubles, not how many minutes it takes on your car today. **n** is the input size.`,
      does: `It lets you compare solutions before writing them. Count the steps as a function of n, keep the fastest-growing term: a single loop is O(n), a loop in a loop is O(n²), halving each round is O(log n), sorting is O(n log n), trying every subset is O(2ⁿ). Time and space are counted separately.`,
      impl: `You do not measure; you count. Pick the line that runs most often, ask how many times it runs in total, add loops that follow each other, multiply loops nested in each other, drop constants and smaller terms. For recursion, count the calls times the work per call, and remember the call stack is memory.`,
      possibilities: `Reading the limits in a problem to guess the intended solution (n ≤ 10⁵ means O(n log n) or better). Justifying a hash set over a nested loop. Explaining why a dynamic-array append is O(1) amortized. Spotting hidden costs like \`list.pop(0)\` or slicing. Choosing a time-versus-memory trade-off aloud.`
    },
    breakdown: [
      {
        title: 'Step 1: count the work, not the seconds',
        body: `Seconds depend on your laptop. Steps depend only on the algorithm. So pick one repeated action (a comparison, a loop pass) and count how many times it runs for an input of size n.

Trace: \`for x in nums: total += x\` with n = 4 runs the addition 4 times; with n = 8, 8 times; with n = 1000, 1000 times. The count equals n, so we say **O(n)**: double the input, double the work.

Now \`for x in nums: for y in nums:\` with n = 4 runs the inner line 4 × 4 = 16 times; n = 8 gives 64. Doubling n quadruples the work: **O(n²)**.

State to track: "what is n?" and "how many times does the innermost line run in total?". In an interview, say that sentence out loud before you give a class.`
      },
      {
        title: 'Step 2: add loops in a row, multiply loops inside each other',
        body: `Two loops one after another each do their own work, so the costs **add**: a pass over n then a pass over n is n + n = 2n, still O(n). A loop inside a loop **multiplies**.

Trace a triangle: \`for i in range(n): for j in range(i + 1, n):\` with n = 4. When i = 0 the inner runs 3 times, i = 1: 2, i = 2: 1, i = 3: 0. Total 3 + 2 + 1 = 6 = n(n − 1)/2. For n = 1000 that is about 500,000. Drop the ½ and the −n/2 term (constants and smaller terms) and you get O(n²).

Rule: **keep the term that grows fastest, drop constants.** 3n² + 50n + 7 is O(n²). Edge case: two different inputs need two letters; an n × m grid is O(n·m), and merging two lists is O(n + m).`,
        code: { py: `def pairs(a):\n    count = 0\n    for i in range(len(a)):\n        for j in range(i + 1, len(a)):   # runs n-1, n-2, ..., 0 times\n            count += 1                   # n(n-1)/2 in total -> O(n^2)\n    return count\n\nprint(pairs([5, 6, 7, 8]))               # 6` }
      },
      {
        title: 'Step 3: where log n comes from',
        body: `A loop that **halves** what is left runs only log₂ n times, because you can halve n only that many times before reaching 1.

Trace n = 16: 16 → 8 → 4 → 2 → 1. That is 4 halvings, and log₂ 16 = 4. For n = 1,000,000,000 it is only about 30. That is why binary search over a billion sorted items takes about 30 comparisons.

State: the size of the remaining range. Each round throws away half, so the range shrinks 16, 8, 4, 2, 1. The loop ends when one item is left (or none).

Cues: "sorted array", "halve the range", "balanced tree height", "number of digits" (log₁₀ n). Inside a pass over n items, a halving loop gives O(n log n), which is the cost of sorting. The base of the log is a constant factor, so we do not write it.`,
        code: { py: `def halvings(n):\n    rounds = 0\n    while n > 1:\n        n //= 2        # throw away half\n        rounds += 1\n    return rounds\n\nprint(halvings(16), halvings(1_000_000_000))  # 4 29` }
      },
      {
        title: 'Step 4: amortized cost, the dynamic array',
        body: `Python's list append is O(1) *amortized*: most appends are one write, but when the array is full Python allocates a bigger one and copies everything, which costs O(n). Amortized means: look at the average over a long run.

Trace: capacity starts at 1 and doubles when full. Appending 8 items triggers copies at sizes 1, 2, 4, which is 1 + 2 + 4 = 7 element copies in total, for 8 appends. In general n appends cause fewer than 2n copies, so each append averages under 2 extra steps: O(1).

Why doubling matters: growing by a fixed 10 slots would copy n/10 times, giving O(n²) total. The same argument explains why a hash table doubles when it fills.

Edge case: one single append can still cost O(n). Amortized is about the average over many operations, not randomness, and not a guarantee for each call.`
      },
      {
        title: 'Step 5: space, and the call stack',
        body: `Space is the extra memory your algorithm holds at its peak, not counting the input. A set of up to n seen values is O(n). Two counters is O(1).

Recursion uses memory too: each active call keeps a frame on the **call stack**. A function that calls itself n times deep before returning holds n frames at once, so it is O(n) space even if it creates no lists.

Trace \`countdown(3)\` calling \`countdown(2)\`, then \`countdown(1)\`, then \`countdown(0)\`: four frames exist at the deepest moment, so depth is n + 1 and space is O(n). A loop doing the same thing uses O(1).

Slices and copies also count: \`nums[1:]\` allocates a new list of n − 1 items. Cue: when someone says "O(1) space" in a recursive solution, check the depth.`
      },
      {
        title: 'Step 6: from limits to algorithm, and hidden costs',
        body: `Computers do roughly 10⁸ simple steps in a second in compiled languages, about 10⁷ in Python. So the limit n tells you the target:

| n up to | aim for |
| --- | --- |
| 20 | O(2ⁿ), try all subsets |
| 500 | O(n³) |
| 5,000 | O(n²) |
| 10⁵ to 10⁶ | O(n log n) or O(n) |
| 10⁹ and up | O(log n) or O(1) |

Check n = 10⁵: n² = 10¹⁰ is 100 seconds, too slow; n log n is about 1.7 million, fine.

The other half is hidden costs. A single line like \`x in my_list\`, \`my_list.pop(0)\`, \`my_list.insert(0, x)\` or \`s = s + c\` can be O(n) and turns a loop into O(n²). Know the price of every call you write, and say it.`
      }
    ],
    think: [
      {
        q: `A loop does \`for i in range(n): for j in range(i, n): work()\`. For n = 1000, roughly how many times does \`work()\` run, and what is the class?`,
        a: `The inner loop runs n, n − 1, ..., 1 times, which adds to n(n + 1)/2, about 500,000 for n = 1000. That is O(n²). The aha: starting the inner loop at i halves the count, but a half is a constant, and constants vanish. Only when the inner loop gets a different *growth* (halving, or a fixed number of times) does the class change.`
      },
      {
        q: `Binary search over 1,000,000,000 sorted values: about how many comparisons, and why so few?`,
        a: `About 30. Each comparison discards half the remaining values: 10⁹ → 5·10⁸ → ... → 1 takes log₂(10⁹) ≈ 30 halvings. Linear search would take up to a billion. The aha: log n grows so slowly that doubling the input adds just one more step.`
      },
      {
        q: `This is O(n) on paper: \`for x in nums: if x in seen_list: ...; seen_list.append(x)\`. What is it really, and what is the one-word fix?`,
        a: `O(n²). The loop is n passes, but \`x in seen_list\` scans the list, up to n items, on each pass. The fix is **set**: \`x in seen_set\` is O(1) on average, which gets back to O(n). The aha: always ask what each line costs, not just how many lines run.`
      },
      {
        q: `Why is appending to a Python list called "O(1) amortized" even though one append sometimes copies the whole list?`,
        a: `The copy happens rarely and gets rarer: the array doubles, so after a copy of size n you get n cheap appends before the next one. Over n appends the total copy work is 1 + 2 + 4 + ... < 2n, so each append averages under 2 extra steps. A single slow append is allowed; the average over any long run is constant.`
      },
      {
        q: `A recursive function halves its list each time (\`solve(a[:len(a)//2])\`) and does O(1) other work. Is it O(log n) time? What about space?`,
        a: `Not quite. There are log n calls, but each slice copies half of the list: n/2 + n/4 + ... ≈ n steps of copying, so time is O(n), and each level holds its own slice so space is O(n) too (recursion depth adds O(log n)). Passing indexes \`lo, hi\` instead of slicing makes it O(log n) time and O(log n) stack. The aha: slicing hides an O(n) cost.`
      },
      {
        q: `A problem says n ≤ 200,000 and gives one second. You thought of an O(n²) solution. What do you do?`,
        a: `n² is 4 × 10¹⁰ steps, hundreds of times over budget, so it will time out. Look for an O(n log n) idea: sort first, use a heap, use a hash map to replace the inner loop, or binary search. The aha: the limit is a hint about the intended answer, so read it before coding and say it out loud.`
      }
    ],
    drills: [
      {
        title: 'Unique in first-seen order, in O(n)',
        q: `Given a list of integers, return the distinct values in the order they first appear. Example: \`[4, 1, 4, 2, 1, 3]\` gives \`[4, 1, 2, 3]\`. A solution that checks \`if x not in result\` on a list is O(n²); yours must be O(n) on average.`,
        hint: `The slow part is asking "have I already kept this?" on a list. Which structure answers that in O(1)?`,
        how: `Restating: keep each value once, in the order I first met it.

The obvious solution loops over the input and appends to \`result\` if \`x not in result\`. It is correct, but \`in\` on a list scans it, up to n items, and it runs on every pass, so the whole thing is O(n²). For n = 100,000 that is about 5 billion comparisons.

The bottleneck is the membership question. A hash set answers "is x in here?" in O(1) on average. So the fix is to keep two things: a list \`out\` for order, and a set \`seen\` for the fast question. The set has no useful order, the list has no fast lookup, and together they cover both needs.

Trace \`[4,1,4,2,1,3]\`: 4 is not seen, add to both; 1 is new, add; 4 is in seen, skip; 2 new, add; 1 seen, skip; 3 new, add. Result \`[4,1,2,3]\`.

Edge cases: empty list returns empty; all equal values returns one item; negative numbers are fine. Values must be hashable.

Cost: n passes with O(1) average work each, so O(n) time on average, and O(n) space for the set and the output. I would mention the trade: I bought a factor of n in speed with n extra memory. A shortcut in Python is \`list(dict.fromkeys(nums))\`, since dicts remember insertion order.`,
        code: { py: `def unique_in_order(nums):\n    seen, out = set(), []\n    for x in nums:\n        if x not in seen:\n            seen.add(x)\n            out.append(x)\n    return out` },
        explain: `The set answers membership in O(1) on average and the list preserves first-seen order, so each element costs a constant amount of work: O(n) time on average, O(n) space. The first occurrence is exactly the one that passes the not-in-seen check.`,
        check: `assert unique_in_order([4, 1, 4, 2, 1, 3]) == [4, 1, 2, 3]
assert unique_in_order([]) == []
assert unique_in_order([7, 7, 7]) == [7]
assert unique_in_order([-1, 0, -1, 0, 2]) == [-1, 0, 2]
assert unique_in_order(list(range(1000)) * 3) == list(range(1000))`
      },
      {
        title: 'Best sum of k in a row',
        q: `Given a list of numbers and a window size \`k\` (1 ≤ k ≤ len), return the largest sum of \`k\` consecutive numbers. Example: \`[2, 1, 5, 1, 3, 2]\` with \`k = 3\` gives 9 (the window \`5, 1, 3\`). Aim for O(n), not O(n·k).`,
        hint: `Moving the window one step to the right changes only two numbers: one leaves, one enters.`,
        how: `Restating: among all blocks of k neighbours, find the largest total.

The brute force sums every block from scratch: n − k + 1 blocks, k additions each, so O(n·k). If k is about n/2 and n is 10⁵, that is 2.5 billion additions: too slow.

The bottleneck is recomputing. Two neighbouring blocks share k − 1 numbers; the sum I just computed already contains almost everything I need.

The observation: to slide the window one step, subtract the number that leaves on the left and add the number that enters on the right. That is two operations instead of k. So I keep a running \`window\` sum.

Trace \`[2,1,5,1,3,2]\` with k = 3: first window 2+1+5 = 8. Slide: remove 2, add 1 gives 7. Slide: remove 1, add 3 gives 9. Slide: remove 5, add 2 gives 6. Best is 9.

Edge cases: k equal to the length (one window, no slide); k = 1 (the maximum element); negative numbers (the best sum may be negative, so start \`best\` from the first window, not from 0).

Cost: one pass for the first window (k steps) and n − k slides of O(1): O(n) time, O(1) space. This is the sliding-window idea, which is just Big-O thinking applied: stop repeating work you already did.`,
        code: { py: `def best_window_sum(nums, k):\n    window = sum(nums[:k])\n    best = window\n    for i in range(k, len(nums)):\n        window += nums[i] - nums[i - k]   # one enters, one leaves\n        best = max(best, window)\n    return best` },
        explain: `Each window sum differs from the previous by exactly the entering and leaving values, so the update is O(1) and correct. Starting best from the first window handles all-negative inputs. Time O(n), space O(1) (the slice \`nums[:k]\` is a temporary O(k) copy; summing by index avoids it).`,
        check: `assert best_window_sum([2, 1, 5, 1, 3, 2], 3) == 9
assert best_window_sum([4], 1) == 4
assert best_window_sum([-3, -1, -2], 2) == -3
assert best_window_sum([1, 2, 3, 4], 4) == 10
assert best_window_sum([5, -10, 6, 7], 2) == 13
assert best_window_sum([1, 1, 1, 1], 1) == 1`
      },
      {
        title: 'Build a dynamic array and count the copies',
        q: `Implement \`DynamicArray\` on top of a fixed-size Python list (you may only create a new list of a given size, not use \`append\`). Methods: \`append(x)\`, \`get(i)\` (raise \`IndexError\` when out of range), \`len(arr)\`, and a counter \`copies\` of how many elements have been copied during resizes. It starts at capacity 1 and doubles when full. After 1000 appends, \`copies\` must be below 2000.`,
        hint: `When full, make a list of double the size, copy the old items over (counting them), then write the new item. Why does doubling keep the total small?`,
        how: `Restating: I am building the thing Python's list does internally, to prove append is O(1) amortized.

The simplest idea is a fixed array that grows by one slot whenever it is full: every append copies all existing items, so n appends cost 1 + 2 + ... + n = O(n²) copies. That is the brute force and it is the reason growth must be geometric.

The observation: if I double the capacity, a resize at size s copies s items but buys me s more free appends before the next resize. The copy cost is paid for by the appends that follow.

Structure: a list \`data\` of length \`cap\`, a count \`n\` of used slots, and \`copies\`. On \`append\`: if \`n == cap\`, build a new list of \`2 * cap\`, copy \`n\` items, add \`n\` to \`copies\`, swap it in. Then write at index \`n\` and increase \`n\`.

Trace for 5 appends: cap 1: write a. Full, grow to 2 (1 copy), write b. Full, grow to 4 (2 copies), write c, d. Full, grow to 8 (4 copies), write e. Copies: 1 + 2 + 4 = 7 for 5 appends.

Edge cases: \`get\` with a negative or too-large index must raise (a slot beyond \`n\` holds \`None\`, so check against \`n\`, not \`cap\`). An empty array has length 0.

Cost: resizes happen at sizes 1, 2, 4, ... up to n, so total copies are under 2n, which makes each append O(1) amortized. A single append can still cost O(n). Space is at most 2n.`,
        code: { py: `class DynamicArray:\n    def __init__(self):\n        self.cap = 1\n        self.n = 0\n        self.data = [None] * self.cap\n        self.copies = 0\n\n    def append(self, x):\n        if self.n == self.cap:\n            self.cap *= 2\n            new = [None] * self.cap\n            for i in range(self.n):\n                new[i] = self.data[i]\n            self.copies += self.n\n            self.data = new\n        self.data[self.n] = x\n        self.n += 1\n\n    def get(self, i):\n        if not 0 <= i < self.n:\n            raise IndexError(i)\n        return self.data[i]\n\n    def __len__(self):\n        return self.n` },
        explain: `Resizes occur when n is 1, 2, 4, ..., so the copy counts form 1 + 2 + 4 + ... which is less than twice the final size. Hence n appends do fewer than 2n copies plus n writes: O(n) total, O(1) amortized per append. \`get\` is a direct index, O(1).`,
        check: `a = DynamicArray()
assert len(a) == 0
for i in range(1000):
    a.append(i * 2)
assert len(a) == 1000
assert a.get(0) == 0 and a.get(999) == 1998
assert a.copies < 2000
assert a.cap == 1024
try:
    a.get(1000)
    assert False
except IndexError:
    pass
try:
    a.get(-1)
    assert False
except IndexError:
    pass
b = DynamicArray()
for i in range(5):
    b.append(i)
assert b.copies == 7`
      },
      {
        title: 'Find the first value that works, in log steps',
        q: `A function \`pred(x)\` is False for small x and True from some point onward (it never flips back). Write \`first_true(lo, hi, pred)\` returning the smallest x in \`[lo, hi]\` with \`pred(x)\` True, or \`hi + 1\` if none. It must call \`pred\` at most about log₂(range) times. Example: \`first_true(0, 10, lambda x: x * x >= 50)\` is 8.`,
        hint: `Keep the answer inside a shrinking range. Test the middle: if it is True, the answer is the middle or earlier; if False, it is later.`,
        how: `Restating: find the boundary where False switches to True.

The brute force tests lo, lo+1, lo+2, ... until it sees True. That is O(range) calls, which for a range of a million with an expensive \`pred\` is far too many.

The observation is the monotonic shape: False False False True True True. If \`pred(mid)\` is True, then everything to the right of mid is True as well, so the boundary is at mid or to its left; I can discard the right part. If it is False, the boundary is strictly right of mid; I can discard mid and the left part. Each test throws away half the range, so there are at most about log₂(range) tests.

Structure: two pointers \`left\` and \`right\` with the answer always inside \`[left, right]\`; I use \`right = hi + 1\` as an imaginary "everything failed" position so the none-case falls out naturally. Loop while \`left < right\`, with \`mid = left + (right - left) // 2\`. If \`pred(mid)\`: \`right = mid\`. Else \`left = mid + 1\`. When they meet, that index is the answer.

Trace \`lo=0, hi=10\`, x·x ≥ 50: range [0, 11]; mid 5: 25 False so left 6; mid 8: 64 True so right 8; mid 7: 49 False so left 8. Stop at 8.

Edge cases: nothing works returns hi+1; everything works returns lo; single-element range.

Cost: O(log(hi − lo)) calls to \`pred\`, O(1) space.`,
        code: { py: `def first_true(lo, hi, pred):\n    left, right = lo, hi + 1          # right = hi + 1 means "no x works"\n    while left < right:\n        mid = left + (right - left) // 2\n        if pred(mid):\n            right = mid                 # mid works; the answer is mid or earlier\n        else:\n            left = mid + 1              # mid fails; the answer is later\n    return left` },
        explain: `Invariant: every x below \`left\` has pred False and every x at or above \`right\` has pred True (with hi+1 treated as True). Each step halves the interval, and when \`left == right\` that index is the first True. Time O(log(hi − lo)) pred calls, space O(1).`,
        check: `assert first_true(0, 10, lambda x: x * x >= 50) == 8
assert first_true(0, 10, lambda x: False) == 11
assert first_true(0, 10, lambda x: True) == 0
assert first_true(5, 5, lambda x: x >= 5) == 5
calls = []
def p(x):
    calls.append(x)
    return x >= 777_777
assert first_true(0, 1_000_000, p) == 777_777
assert len(calls) <= 21
assert first_true(-10, 10, lambda x: x > -3) == -2`
      }
    ],
    how: {
      509: `Restate: the n-th Fibonacci number, where each is the sum of the previous two. Brute force is the direct recursion \`fib(n-1) + fib(n-2)\`. It is correct, but it recomputes: fib(5) computes fib(3) twice, fib(2) three times, and the number of calls grows by about 1.6 times per level, so it is exponential, O(2ⁿ) as a bound, and the call stack is O(n) deep. The bottleneck is repeated subproblems. The observation: to get the next number I only need the last two, never the whole history. So I keep two variables \`a, b = 0, 1\` and move them forward \`n\` times with \`a, b = b, a + b\`. Trace n = 5: (0,1) → (1,1) → (1,2) → (2,3) → (3,5) → (5,8); return \`a\` which is 5. Edge cases: n = 0 returns 0 (the loop never runs), n = 1 returns 1. Python's big ints do not overflow, though in Java the values exceed int after n = 46. Cost: O(n) time and O(1) space. Memoizing the recursion would also be O(n), with O(n) space.`,
      1480: `Restate: output[i] is the sum of nums[0..i]. Brute force: for each i, add up the first i + 1 numbers from scratch, O(n²). The bottleneck is re-adding the same prefix: the sum up to i is just the sum up to i − 1 plus one number. So I carry a running \`total\` and append it after each addition. Trace \`[1,2,3,4]\`: total 1, then 3, then 6, then 10, giving \`[1,3,6,10]\`. Edge cases: a single element returns itself; negative numbers work the same; empty input returns empty. Cost: one pass, O(n) time; the output list is required, so extra space beyond it is O(1). This running-total move is the seed of prefix sums, which later turn "sum of any range" into a subtraction. In an interview I would also say that I could do it in place by writing into \`nums\` itself, if mutating the input is allowed.`,
      704: `Restate: find the index of target in a sorted array, or -1. Brute force: scan from the left, O(n). It ignores that the array is sorted. The observation: compare the target to the middle element. If the middle is smaller than the target, everything at or left of the middle is too small, so the target can only be to the right; if bigger, only to the left. Each comparison discards half, so about log₂ n rounds. Structure: two indices \`lo\` and \`hi\` bounding where the target could still be; loop while \`lo ≤ hi\`; \`mid = lo + (hi - lo) // 2\` (this form does not overflow in Java or C++). Trace \`[-1,0,3,5,9,12]\` for 9: lo 0, hi 5, mid 2 (value 3 < 9) so lo 3; mid 4 (value 9) found. Edge cases: empty array (the loop never runs, return -1), target missing, one element, target at either end. The classic bugs are \`lo < hi\` instead of \`≤\` and forgetting \`±1\`, which causes an infinite loop. Cost: O(log n) time, O(1) space.`,
      136: `Restate: every number appears twice except one; find it. Brute force: count with a dict, O(n) time and O(n) space, or compare every pair, O(n²). The counting map is fine, but the problem hints at constant extra space. The observation uses XOR (^): a number XOR itself is 0, a number XOR 0 is itself, and XOR does not care about order. So XOR-ing the whole array makes every pair cancel and leaves the single number. Trace \`[4,1,2,1,2]\`: 0^4=4, ^1=5, ^2=7, ^1=6, ^2=4. The answer is 4. Edge cases: one element returns that element; negative numbers still work because XOR is bitwise. In an interview I would first state the dict solution, then give XOR as the optimization, and say that it works only because the other numbers appear exactly twice. Cost: O(n) time, O(1) space.`,
      268: `Restate: the array has n numbers from 0..n with exactly one missing; find it. Brute force: for each value 0..n check whether it is in the list: O(n²), or put the numbers in a set and test each value: O(n) time and O(n) space. The observation: I know exactly what the full set sums to, the Gauss formula \`n(n+1)/2\`. The array's actual sum is smaller by exactly the missing number. So the answer is expected minus actual. Trace \`[3,0,1]\`: n = 3, expected 6, actual 4, missing 2. Edge cases: \`[0]\` gives n = 1, expected 1, actual 0, missing 1; the missing value can be 0 or n. In Java, the sum can overflow for large n, so use a long or XOR the values with their indices, which cannot overflow. Cost: O(n) time and O(1) space. The skill is noticing that the structure of the input (a known range) lets arithmetic replace a lookup table.`,
      70: `Restate: how many distinct ways to climb n stairs taking 1 or 2 steps at a time. Brute force: recursion \`ways(n) = ways(n-1) + ways(n-2)\`, which is exponential because it recomputes the same stairs. The observation: the last move to reach step n was either a 1-step from n − 1 or a 2-step from n − 2, so the count is the sum of those two counts. That is Fibonacci. I only need the previous two values, so I keep \`prev, cur = 1, 1\` (one way to stand on step 0, one way on step 1) and advance n − 1 times with \`prev, cur = cur, prev + cur\`. Trace n = 4: (1,1) → (1,2) → (2,3) → (3,5). Answer 5: 1111, 112, 121, 211, 22. Edge cases: n = 1 gives 1 (the loop runs zero times), n = 2 gives 2. Cost: O(n) time, O(1) space; memoized recursion would be O(n) space, naive recursion O(2ⁿ) time.`,
      1534: `Restate: count triples of indices i < j < k whose three pairwise differences each stay within given limits a, b, c. The first thing I do is read the constraints: the array has at most 100 elements. The brute force is three nested loops over every triple, about 161,700 triples for n = 100 (100 choose 3), which is well inside the budget of roughly 10⁸ steps. A cleverer algorithm would take longer to write, and be riskier, for no gain. So I do the brute force, with one small speed-up: after choosing i and j, if \`|arr[i] − arr[j]|\` already exceeds a, skip the whole inner loop. Starting j at i + 1 and k at j + 1 keeps the indexes in order without extra checks. Trace \`[3,0,1,1,9,7]\` with a = 7, b = 2, c = 3: the good index triples are (0,1,2), (0,1,3), (0,2,3) and (1,2,3), so the answer is 4; every triple using 9 or 7 fails the b or c limit. Edge cases: fewer than 3 elements gives 0. Cost: O(n³) time, O(1) space. What the interviewer is checking is whether I use the limits to justify brute force.`,
      1588: `Restate: add up the sums of every odd-length subarray. Brute force: for each start and each odd length, sum the subarray: O(n³), or O(n²) with prefix sums. With n ≤ 100 that is allowed, so I would say so. The better idea is to flip the question: instead of summing subarrays, ask how many odd-length subarrays contain each element. Element i can start at any of i + 1 positions (0..i) and end at any of n − i positions (i..n−1), giving \`(i+1)(n−i)\` subarrays containing it. About half of them have odd length: the exact count is \`((i+1)(n−i) + 1) // 2\`. Each element contributes \`value × count\`. Trace \`[1,4,2]\`: i = 0 has 1 × 3 = 3 subarrays, 2 odd, contributes 2; i = 1 has 2 × 2 = 4, 2 odd, contributes 8; i = 2 has 3 × 1 = 3, 2 odd, contributes 4. Total 14, which matches the direct sum: 7 for the three single elements plus 7 for the whole array. Cost: O(n) time, O(1) space.`,
      217: `Restate: does any value appear at least twice? There are three answers and they trade time against memory. Pair every element with every other: O(n²) time, O(1) space. Sort and compare neighbours: O(n log n) time, O(1) extra space if I may reorder the input. A hash set: O(n) time, O(n) space. The bottleneck of the pairs is re-asking "have I seen this?" by scanning. A set answers that in O(1) on average. So I walk the array once: if the number is already in the set return True; otherwise add it. Trace \`[1,2,3,1]\`: add 1, 2, 3, then 1 is found, True. For \`[1,2,3]\` the loop ends, False. Edge cases: empty or one element returns False. I would say the cost as "O(n) time on average, O(n) space" and mention that if memory were tight, sorting is the alternative. Using a list instead of a set here would silently make it O(n²), which is the exact trap this problem teaches.`,
      1: `Restate: find two indexes whose values add to the target. Brute force: try every pair, O(n²) time, O(1) space. The bottleneck is the inner loop, which searches for the partner of each number. But the partner is fully determined: for x it must be target − x. So the inner loop is really the question "have I already seen target − x?", and a hash map from value to index answers it in O(1) on average. One pass: for each x compute \`need = target − x\`; if need is in the map, return its stored index and the current one; otherwise store x with its index. I look first and store after, so an element cannot pair with itself. Trace \`[2,7,11,15]\` with target 9: x = 2, need 7, not seen, store 2. x = 7, need 2, found at index 0, return [0, 1]. Edge cases: duplicates such as \`[3,3]\` with target 6 (works because of look-first), negative numbers, no answer (return empty). Cost: O(n) time on average, O(n) space.`
    }
  };
})();
