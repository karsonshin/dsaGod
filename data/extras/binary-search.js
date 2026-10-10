(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['binary-search'] = {
    primer: {
      kind: 'technique',
      what: '**Binary search** finds a boundary in sorted (or one-flip) data by asking one yes/no question at the middle and throwing away the half that cannot hold the answer. It is opening a dictionary in the middle instead of reading it page by page.',
      does: 'It solves “find the **first position where a test turns true**”: look up a value, find where to insert one, find the first or last copy, find the minimum of a rotated array, or find the smallest value that works. It costs **O(log n)** probes, about 30 for a billion items, as long as each probe is O(1).',
      impl: 'Keep `lo` and `hi` around the answer, probe `mid = lo + (hi - lo) // 2`, and move one end past `mid` every round. In Python use `bisect_left` (first index with value >= x) and `bisect_right` (first index with value > x) on a sorted list. Write the loop yourself when there is no list, as in “search on the answer”.',
      possibilities: 'Sorted lookup and insert position, first/last occurrence and counting duplicates, rotated-array search and minimum, peak finding, integer square root, and “smallest speed, capacity or day that works” problems such as Koko Eating Bananas, Ship Packages and Split Array Largest Sum.'
    },

    breakdown: [
      {
        title: '1. The raw idea: every question removes half',
        body: 'Take the sorted list `[2, 5, 8, 12, 16, 23, 38, 56, 72, 91]` and look for 23. Reading left to right takes 6 looks. Instead look at the **middle** one, index 4, value 16. Since 16 < 23 and the list is sorted, 23 cannot be at index 0 to 4, so five numbers are gone in one look. Next middle of indices 5 to 9 is index 7, value 56 > 23, so indices 7 to 9 are gone. Then index 5 holds 23. Three looks. The only thing that makes this legal is **sorted order**: one comparison tells you which side the answer is on.'
      },
      {
        title: '2. What state we track: lo, hi and an invariant',
        body: 'We need to remember which part is still possible. Keep two indices, `lo` and `hi`, with the **invariant**: “if the answer exists, it lies between `lo` and `hi`”. Each round computes `mid = lo + (hi - lo) // 2` (the `lo +` form avoids integer overflow in Java and C++), compares `nums[mid]` with the target, and moves **one** end past `mid`. Moving past `mid`, not onto it, is what guarantees the space shrinks. Say the invariant out loud whenever you write a binary search: every bug is a branch that breaks it.',
        code: { py: 'lo, hi = 0, len(nums)      # invariant: the answer is in [lo, hi]\nmid = lo + (hi - lo) // 2  # always a valid index while lo < hi' }
      },
      {
        title: '3. Turn any task into “find the first yes”',
        body: 'Where would 6 be inserted in `[1, 3, 5, 7, 9]`? Ask of each index “is `nums[i] >= 6`?”. The answers read no, no, no, yes, yes: one flip, and the first yes is the insert position. Trace with `lo = 0, hi = 5`: mid 2 holds 5, “5 < 6” so the answer is right of it, `lo = 3`. mid 4 holds 9, not < 6, so 4 could be the answer: `hi = 4`. mid 3 holds 7, `hi = 3`. Now `lo == hi == 3`, the answer. The rule: **no** means `lo = mid + 1`; **yes** means `hi = mid` (keep it, it might be the first yes).'
      },
      {
        title: '4. Loop conditions and edge cases',
        body: 'Two consistent styles exist. **Half-open** `[lo, hi)` uses `while lo < hi` with `hi = mid`: it ends when `lo == hi`, and the answer is `lo`. **Closed** `[lo, hi]` uses `while lo <= hi` with `hi = mid - 1`, because a one-element space still needs a look. Mixing the styles gives an infinite loop or a skipped candidate. Edge cases to run by hand: an empty list (`hi = 0`, loop never runs, answer 0), one element, a target smaller than everything (answer 0), and a target bigger than everything (answer `n`, one past the end, so check `lo < n` before reading `nums[lo]`).'
      },
      {
        title: '5. Duplicates: lower bound versus upper bound',
        body: 'In `[1, 3, 3, 3, 7]` the value 3 occupies indices 1 to 3. The **lower bound** of 3 is the first index with value >= 3, so 1. The **upper bound** is the first index with value > 3, so 4. They differ by one character in the question (`<` versus `<=`). Now first occurrence is the lower bound, last occurrence is upper bound minus one, and the number of copies is `upper - lower`, here 3. In Python these are `bisect_left` and `bisect_right`. A plain “return when equal” search finds some copy, not a specific one, so use bounds when the problem says first or last.'
      },
      {
        title: '6. Search on the answer: there is no array',
        body: 'Koko eats piles `[3, 6, 7, 11]` and has `h = 8` hours. Candidate speeds are 1 to 11. “Does speed k finish in time?” is a linear scan, hours = sum of ceil(pile / k). Speed 3 needs 1+2+3+4 = 10 hours (no), speed 4 needs 1+2+2+3 = 8 (yes), and bigger speeds also work, so the answers read no, no, no, yes, yes, … : one flip. Trace: `lo = 1, hi = 11`; mid 6 gives 6 hours (yes) so `hi = 6`; mid 3 gives 10 (no) so `lo = 4`; mid 5 gives 8 (yes) so `hi = 5`; mid 4 gives 8 (yes) so `hi = 4`. Answer 4. The candidate list was never built; the check replaced `nums[mid]`.'
      },
      {
        title: '7. Cost and how to spot it in an interview',
        body: 'Each probe halves the space, so a million values need about 20 probes and a billion about 30: **O(log n)** probes. For search on the answer, multiply by the cost of the check: O(n log range). Spot it by these phrases: sorted input, “O(log n)”, “first”, “last”, “smallest X such that”, “minimum possible maximum”, or n up to 10^9. Before writing code, say the pattern of answers out loud (“no, no, yes, yes”). If you cannot name a single flip, binary search is the wrong tool, and a hash map or sort is the likelier answer.'
      }
    ],

    think: [
      {
        q: 'You guess a secret number from 1 to 100 and are told only “higher” or “lower”. What is the most guesses you ever need with the best strategy, and why not 6?',
        a: 'Seven. Every guess at best halves the numbers left, so after g guesses at most 2^g numbers can be told apart. 2^6 = 64 is below 100, but 2^7 = 128 covers it. The aha is that the count of guesses is log2 of the size, which is why 30 probes handle a billion.'
      },
      {
        q: 'Predict `bisect_left`, `bisect_right` and `bisect_left` on `[1, 3, 3, 5]` for the values 3, 3 and 4, in that order.',
        a: '`bisect_left([1,3,3,5], 3)` is 1 (first index with value >= 3). `bisect_right([1,3,3,5], 3)` is 3 (first index with value > 3). `bisect_left([1,3,3,5], 4)` is 3 (where 4 would be inserted). The gap between the first two is 2, the number of copies. When the value is absent, left and right agree.'
      },
      {
        q: 'Why does the exact-match search use `while lo <= hi` but the lower-bound search uses `while lo < hi`?',
        a: 'They use different intervals. Exact match keeps a closed range `[lo, hi]`, so when `lo == hi` one candidate is still unchecked and must be probed. Lower bound keeps a half-open range `[lo, hi)` where `hi` is itself a valid answer (“nothing before it”), so `lo == hi` means nothing is left to decide. Each pair of update and loop condition goes together: closed uses `mid - 1`, half-open uses `hi = mid`.'
      },
      {
        q: 'What happens on `[3, 4]` if a search sets `lo = mid` instead of `lo = mid + 1`?',
        a: 'With `lo = 0, hi = 1`, `mid = 0 + (1 - 0) // 2 = 0`. Setting `lo = mid` leaves `lo` at 0, nothing changes, and the loop runs forever. Because the midpoint rounds down, a two-element space never shrinks unless `lo` jumps past `mid`. The cure is `lo = mid + 1`, or rounding `mid` up when you really need `lo = mid`.'
      },
      {
        q: 'For a rotated array like `[4, 5, 6, 7, 0, 1, 2]`, why compare `nums[mid]` with the last element and not with the first?',
        a: 'Compared with the last element, values from the first run are all bigger and values from the second run are all smaller, so “is `nums[i] <= nums[last]`?” reads no, no, no, no, yes, yes, yes: one flip, whose first yes is the minimum. It also works when the array was not rotated at all (every answer is yes). Compared with the first element, an unrotated array gives no usable signal.'
      },
      {
        q: 'Which one is a binary-search problem: (a) smallest number of days to ship all packages in order with a given ship capacity, (b) longest subarray whose sum is exactly k in an array with negatives?',
        a: '(a) is. Bigger capacity never needs more days, so “fits in D days?” reads no, no, yes, yes and a greedy pass checks it. (b) is not: with negative numbers a longer or shorter subarray can flip the sum either way, so there is no single boundary. That one wants a prefix-sum hash map. Always ask “does the yes/no answer flip only once?” before choosing.'
      }
    ],

    drills: [
      {
        title: 'First gap in the ticket numbers',
        q: 'A sorted list of **distinct non-negative integers** is supposed to be `0, 1, 2, 3, ...` but some numbers are missing. Return the **smallest missing** number in O(log n). Example: `[0, 1, 2, 4, 5]` returns `3`; `[0, 1, 2]` returns `3`; `[1, 2]` returns `0`; `[]` returns `0`.',
        hint: 'Because the values are distinct and non-negative, `nums[i] >= i` always. Look at where `nums[i] == i` stops being true.',
        how: 'I restate it: find the first number from 0 upward that is not in the list. The brute force is a scan that checks `nums[i] == i` and returns the first index where it fails: O(n), correct, but it ignores that the list is sorted. The unlock is a fact about the data. The values are distinct and start at 0 or higher, so at index i there can be at most i smaller values, which means `nums[i] >= i` always. Before the first gap every slot satisfies `nums[i] == i`; once a number is missing, everything after it is shifted up, so `nums[i] > i` forever. The question “is `nums[i] == i`?” therefore reads yes, yes, yes, no, no, no: one flip, which is a binary search for the **first no**. I use the half-open lower-bound template: if `nums[mid] == mid` the gap is further right (`lo = mid + 1`), otherwise `mid` might be the first no (`hi = mid`). Trace on `[0, 1, 2, 4, 5]`: lo 0, hi 5, mid 2 matches so lo = 3; mid 4 holds 5, not 4, so hi = 4; mid 3 holds 4, not 3, so hi = 3. Answer 3. Edge cases: an empty list gives 0 without entering the loop; a complete list `[0, 1, 2]` ends with `lo = n = 3`, the right answer; a list starting at 1 fails at index 0 and returns 0. Cost: O(log n) time, O(1) space.',
        code: {
          py: `def first_gap(nums):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] == mid:      # everything up to mid is in place
            lo = mid + 1
        else:                     # mid is already shifted: the gap is here or left
            hi = mid
    return lo`
        },
        explain: 'Distinct non-negative values force nums[i] >= i, so the positions with nums[i] == i form a prefix and the rest do not. The loop finds the end of that prefix, and the index where the prefix ends is exactly the number that is missing. O(log n) time, O(1) space.',
        check: `assert first_gap([0, 1, 2, 4, 5]) == 3
assert first_gap([0, 1, 2]) == 3
assert first_gap([1, 2]) == 0
assert first_gap([]) == 0
assert first_gap([0, 2]) == 1
assert first_gap(list(range(1000))) == 1000
assert first_gap(list(range(500)) + list(range(501, 1001))) == 500`
      },
      {
        title: 'Fastest team of printers',
        q: 'Several printers work at the same time. Printer `i` makes one item every `times[i]` minutes (so after T minutes it has made `T // times[i]` items). Return the **fewest whole minutes** needed to make at least `m` items in total. Example: `times = [2, 3]`, `m = 5` returns `6` (3 items from the first printer plus 2 from the second).',
        hint: 'If T minutes are enough, so are T + 1 minutes. Search over T, and count the items made by time T in one pass.',
        how: 'I restate it: choose the smallest T so that the printers together finish m items. A brute force tries T = 1, 2, 3, and so on, and counts items each time; since T can reach min(times) * m, which is huge, that is far too slow. The observation is that more time never hurts: if T minutes produce enough items, T + 1 minutes produce at least as many. So “are T minutes enough?” reads no, no, no, yes, yes, yes as T grows, a single flip, which means binary search on the answer. The check is one pass: `sum(T // t for t in times) >= m`. For the range, T = 1 is the lowest sensible value, and the **fastest printer alone** finishes m items in `min(times) * m` minutes, so that value surely works and is my `hi`. I use the lower-bound template: if enough, `hi = mid` (keep it); otherwise `lo = mid + 1`. Trace on `[2, 3]`, m = 5: lo 1, hi 10; mid 5 makes 2 + 1 = 3 items, not enough, lo = 6; mid 8 makes 4 + 2 = 6, enough, hi = 8; mid 7 makes 3 + 2 = 5, hi = 7; mid 6 makes 3 + 2 = 5, hi = 6. Answer 6. Edge cases: m = 1 gives `min(times)`; one printer gives `times[0] * m`. Cost: O(n log(min(times) * m)): about 60 probes at most for realistic limits, each a pass over n printers. Space O(1).',
        code: {
          py: `def min_minutes(times, m):
    lo, hi = 1, min(times) * m       # the fastest printer alone always works
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if sum(mid // t for t in times) >= m:
            hi = mid                 # enough items: try less time
        else:
            lo = mid + 1             # not enough: every time up to mid fails
    return lo`
        },
        explain: 'The item count at time T never decreases as T grows, so the set of good T values is a suffix and the lower-bound template finds its first element. hi is safe because the fastest printer alone makes m items by then. O(n log(min(times) * m)) time, O(1) space.',
        check: `def brute(times, m):
    t = 1
    while sum(t // x for x in times) < m:
        t += 1
    return t
assert min_minutes([2, 3], 5) == 6
assert min_minutes([5], 3) == 15
assert min_minutes([1, 1, 1], 3) == 1
assert min_minutes([4, 7], 1) == 4
assert min_minutes([10, 10], 4) == 20
assert min_minutes([1], 1) == 1
for ts, m in [([3, 5, 7], 10), ([6, 2, 9, 4], 17), ([8, 8, 3], 12)]:
    assert min_minutes(ts, m) == brute(ts, m)`
      },
      {
        title: 'Searching a list without knowing its length',
        q: 'You are given a **sorted** list but want to treat it as if its length were unknown: you may only read position `i` through a helper that returns `float("inf")` for any `i` past the end. Return the first index whose value is at least `target` (the length of the list if there is none) **without first computing `len`** for the search range. Example: `[1, 3, 3, 5, 8]`, target 4 returns `3`; target 3 returns `1`; `[]`, target 1 returns `0`.',
        hint: 'You cannot binary search without an upper end. Find one first by doubling a probe index until the value there is at least the target.',
        how: 'I restate it: this is the lower bound again, except I do not know where the list ends, so I cannot start with `hi = n`. A linear scan finds the answer in O(answer) but is slow if the answer is far away. The idea: I need any `hi` that surely answers “yes”, and I should find it cheaply. Reading past the end gives infinity, which is always at least the target, so I **double a probe index** (1, 2, 4, 8, ...) until the value there is at least the target. That takes about log2(answer) steps. Now I know the answer is at most `hi`, and the last probe that failed, `hi // 2`, was still too small, so the answer lies inside a window of size about `hi / 2`. Then I run the ordinary lower-bound loop on `[hi // 2, hi]`. Trace on `[1, 3, 3, 5, 8]`, target 4: probe 1 is 3 (too small), double to 2: value 3, too small; double to 4: value 8, enough. Now search lo = 2, hi = 4: mid 3 holds 5, not < 4, so hi = 3; mid 2 holds 3 < 4, so lo = 3. Answer 3. Edge cases: an empty list makes probe 1 infinity, lo = 0, hi = 1, mid 0 is infinity so hi = 0, answer 0; a target above everything ends on the first infinity, index n. Cost: O(log answer) for the doubling plus O(log answer) for the search, so O(log i) where i is the answer position, and O(1) space.',
        code: {
          py: `def first_at_least(arr, target):
    def probe(i):
        return arr[i] if i < len(arr) else float('inf')

    hi = 1
    while probe(hi) < target:        # gallop: double until we overshoot
        hi *= 2
    lo = hi // 2                     # the previous probe was too small (or hi == 1)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if probe(mid) < target:
            lo = mid + 1
        else:
            hi = mid
    return lo`
        },
        explain: 'After the doubling loop, probe(hi) >= target and probe(hi // 2) < target (or hi // 2 is 0), so the first index with value >= target is in [hi // 2, hi]. The second loop is the standard lower bound there, and infinity beyond the end makes index n a valid yes. O(log p) time where p is the answer position, O(1) space.',
        check: `import bisect, random
assert first_at_least([1, 3, 3, 5, 8], 4) == 3
assert first_at_least([1, 3, 3, 5, 8], 3) == 1
assert first_at_least([], 1) == 0
assert first_at_least([5], 5) == 0
assert first_at_least([5], 6) == 1
big = list(range(0, 2000, 2))
assert first_at_least(big, 1001) == 501
assert first_at_least(big, 5000) == 1000
assert first_at_least(big, -3) == 0
random.seed(1)
for _ in range(200):
    a = sorted(random.randint(0, 30) for _ in range(random.randint(0, 25)))
    t = random.randint(-2, 32)
    assert first_at_least(a, t) == bisect.bisect_left(a, t)`
      },
      {
        title: 'The k-th smallest in a sorted grid',
        q: 'A grid has numbers that increase left to right along every row and top to bottom down every column (rows and columns are each sorted, but the grid as a whole is not). Return the **k-th smallest** number, counting duplicates (k is 1-based), in better than O(rows * cols) time and without sorting the whole grid. Example: `[[1,5,9],[10,11,13],[12,13,15]]`, `k = 8` returns `13` (sorted: 1,5,9,10,11,12,13,13,15).',
        hint: 'Search over the value, not the position. For a value x, you can count how many grid cells are <= x with one staircase walk from the top-right corner.',
        how: 'I restate it: pick out the k-th smallest of a grid that is sorted in two directions. Flatten and sort is O(N log N) for N cells; a heap of row fronts is O(k log rows). Both ignore the neat two-way order, or are slow for big k. The unlock is to stop searching for a **position** and search for a **value**. Define `count_le(x)`, the number of cells that are at most x. It never decreases as x grows, so “is `count_le(x) >= k`?” reads no, no, yes, yes: one flip. The smallest x where it becomes yes is the answer, and it must be a real cell value, because the count can only jump at values that occur in the grid. How to compute `count_le(x)` fast: start at the top-right corner. If that cell is <= x, then its whole row prefix, `c + 1` cells, is <= x, so add them and step down. If it is bigger than x, nothing below it in that column can be at most x, so step left. That walk takes at most rows + cols steps. Trace: grid above, x = 12: top-right 9 <= 12 adds 3, go down; 13 > 12, go left; 11 <= 12 adds 2, go down; 12 <= 12 adds 1, finished: 6 < 8, so no. For x = 13 the count is 3 + 3 + 2 = 8, yes. Search range: smallest cell `grid[0][0]` to largest `grid[-1][-1]`. Cost: O((rows + cols) * log(max - min)) time, O(1) space.',
        code: {
          py: `def kth_in_grid(grid, k):
    rows, cols = len(grid), len(grid[0])

    def count_le(x):                      # how many cells are <= x
        r, c, total = 0, cols - 1, 0
        while r < rows and c >= 0:
            if grid[r][c] <= x:
                total += c + 1            # the whole row prefix is <= x
                r += 1
            else:
                c -= 1                    # this column is too big from here down
        return total

    lo, hi = grid[0][0], grid[-1][-1]
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if count_le(mid) >= k:
            hi = mid                      # mid might be the answer
        else:
            lo = mid + 1
    return lo`
        },
        explain: 'count_le is monotone in x, so the smallest x with count_le(x) >= k can be found by binary search. That x is the k-th smallest: below it fewer than k cells are small enough, and the count first reaches k at a value that exists in the grid. The staircase walk counts in O(rows + cols). Total O((rows + cols) log(range)), O(1) space.',
        check: `import random
assert kth_in_grid([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8) == 13
assert kth_in_grid([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 1) == 1
assert kth_in_grid([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 9) == 15
assert kth_in_grid([[-5]], 1) == -5
assert kth_in_grid([[1, 2], [1, 3]], 2) == 1
assert kth_in_grid([[2, 2], [2, 2]], 3) == 2
random.seed(7)
for _ in range(100):
    n, m = random.randint(1, 5), random.randint(1, 5)
    xs = sorted(random.randint(0, 9) for _ in range(n))
    ys = sorted(random.randint(0, 9) for _ in range(m))
    g = [[x + y for y in ys] for x in xs]
    flat = sorted(v for row in g for v in row)
    k = random.randint(1, n * m)
    assert kth_in_grid(g, k) == flat[k - 1]`
      }
    ],

    how: {
      704: 'I restate it: the list is sorted and I want the index of an exact value, or -1. A scan works but is O(n) and ignores the order. Each comparison of `nums[mid]` with the target tells me which half to keep: smaller means the target is to the right, bigger means to the left, equal means done. So I keep a **closed** interval `[lo, hi]` with `lo = 0, hi = n - 1`, and loop while `lo <= hi`, because a single remaining element still has to be checked. Both updates skip `mid` (`lo = mid + 1`, `hi = mid - 1`) since `mid` was just inspected, which guarantees progress. Trace `[-1, 0, 3, 5, 9, 12]`, target 9: mid 2 holds 3 < 9, so lo = 3; mid 4 holds 9, return 4. For target 2, the interval collapses: lo passes hi and I return -1. Edge cases are an empty list (hi = -1, loop never runs), one element, and a target outside the range. The midpoint is `lo + (hi - lo) // 2` out of habit, because `(lo + hi) / 2` can overflow in Java and C++. Cost: O(log n) time, O(1) space. I would mention that with duplicates this returns some match, not a specific one.',
      35: 'I restate it: return where the target is, or where it would go to keep the list sorted. The position where it would go is the first index with a value at least the target, because everything before that is smaller. That is exactly the lower bound, so the problem is the “find the first yes” template with the question “is `nums[i] >= target`?”. A scan for the first such index is O(n). With the half-open range `[0, n)`, I take `mid`; if `nums[mid] < target`, then mid and everything left are too small, so `lo = mid + 1`; otherwise mid could be the answer, so `hi = mid`. Trace `[1, 3, 5, 6]`, target 2: lo 0, hi 4; mid 2 holds 5 >= 2, hi = 2; mid 1 holds 3 >= 2, hi = 1; mid 0 holds 1 < 2, lo = 1. Return 1. Edge cases: a target above everything leaves `lo = n`, which is the right insert position at the end; a target below everything returns 0; an existing target returns its first index. Cost: O(log n) time and O(1) space. In Python this is exactly `bisect_left`, and I would say so, then write the loop if asked.',
      69: 'I restate it: return the integer part of the square root of x, without a built-in. Trying each integer upward until its square passes x is O(sqrt x), which is slow for large x. The key observation is about the question “is `m * m > x`?”. As m grows it reads no, no, yes, yes: it flips once. The first m with a square above x is one past the answer, so the answer is that index minus one. That is a lower bound on a range of values, not an array. I search `[0, x + 1)`, where x + 1 always squares above x (a safe yes). If `mid * mid > x`, keep it with `hi = mid`; otherwise `lo = mid + 1`. Trace x = 8: lo 0, hi 9; mid 4, 16 > 8, hi = 4; mid 2, 4 not > 8, lo = 3; mid 3, 9 > 8, hi = 3. Return lo - 1 = 2. Edge cases: x = 0 and x = 1 (the range `[0, 1)` or `[0, 2)` gives 0 and 1 correctly). In Java or C++ I would use a 64-bit type for `mid * mid`, because it overflows a 32-bit int near 2^31. Cost: O(log x) time, O(1) space.',
      74: 'I restate it: a matrix where each row is sorted and each row starts above where the previous row ends; is the target in it? Checking every cell is O(m * n). The key observation is that these two rules mean reading the matrix row by row gives **one long sorted list** of m * n values, even though I never build it. So I binary search over flat indices `0 .. m*n - 1` and translate each index into a cell: row = `mid // cols`, column = `mid % cols`. Then it is the ordinary closed-interval search: compare the cell with the target, move `lo` or `hi` past `mid`. Trace the matrix `[[1,3,5,7],[10,11,16,20],[23,30,34,60]]`, target 3: lo 0, hi 11; mid 5 is row 1, col 1, value 11 > 3, so hi = 4; mid 2 is row 0, col 2, value 5 > 3, so hi = 1; mid 0 holds 1 < 3, so lo = 1; mid 1 holds 3, found. Edge cases: a single cell, a single row, a single column (the formula still works since `cols` is 1). Alternatively two searches (pick the row, then search it) cost the same asymptotically. Cost: O(log(m * n)) time, O(1) space.',
      153: 'I restate it: a sorted list was rotated, so it is two sorted runs glued together; find the minimum in O(log n). A scan is O(n). I need a yes/no question with a single flip. Compare `nums[mid]` with the **last** element `nums[hi]`. If `nums[mid] > nums[hi]`, then `mid` is inside the first, higher run, and the drop (the minimum) is strictly to its right. Otherwise `mid` is in the second run, or the array is not rotated, so `mid` could itself be the minimum: keep it. That is the half-open pattern: `while lo < hi`, `lo = mid + 1` on the first case, `hi = mid` on the second. Trace `[4, 5, 6, 7, 0, 1, 2]`: lo 0, hi 6, mid 3 holds 7 > 2, lo = 4; mid 5 holds 1 <= 2, hi = 5; mid 4 holds 0 <= 1, hi = 4. Return `nums[4] = 0`. Comparing with the last element rather than the first is what makes an unrotated array work: every comparison says “keep left” and `lo` ends at 0. This assumes distinct values. Cost: O(log n) time, O(1) space.',
      744: 'I restate it: given sorted letters and a target letter, return the smallest letter strictly bigger than the target, wrapping to the first letter if none is bigger. A scan is O(n). “Strictly bigger” makes this an **upper bound**: the first index whose letter is greater than the target. The question “is `letters[i] > target`?” reads no, no, yes, yes. In the template the question becomes: if `letters[mid] <= target`, mid is too small and `lo = mid + 1`; otherwise keep it with `hi = mid`. Trace `["c", "f", "j"]`, target "c": lo 0, hi 3; mid 1 holds "f" > "c", hi = 1; mid 0 holds "c" <= "c", lo = 1. Return `letters[1] = "f"`. For target "j" every letter is <= it, so `lo` ends at 3, one past the end; the wrap rule says the answer is the first letter, which `lo % n` gives for free. Equal letters (`["x", "x", "y", "y"]`) need no special handling, because `<=` skips over every copy of the target. Cost: O(log n) time, O(1) space.',
      34: 'I restate it: in a sorted list, give the first and last index of the target, or `[-1, -1]`, in O(log n). Finding any match and walking outwards is O(n) when everything matches. The observation is that the **first** copy is a lower bound, the first index with a value >= target. The **last** copy is just before the first value greater than the target, and for integers “first value > t” equals “first value >= t + 1”. So one lower-bound helper called twice gives both ends. Trace `[5, 7, 7, 8, 8, 10]`, target 8: `lower(8)` finds index 3; `lower(9)` finds index 5 (the value 10), so the last is 4. Return `[3, 4]`. For target 6 the helper returns index 1, which holds 7, not 6, so the answer is `[-1, -1]`. The existence check needs two guards: the index must be less than n, and the value there must equal the target. Edge cases: empty list, all elements equal (`[2, 2]` gives `[0, 1]`), target above everything (helper returns n). If the values were not integers I would write an upper bound instead (`<=` in the question). Cost: two binary searches, O(log n) time, O(1) space.',
      33: 'I restate it: a sorted list of distinct values was rotated; find a target in O(log n). A scan is O(n). The pivot-first approach (find the minimum, then binary search one side) works. For a single pass, the insight is that after choosing `mid`, **one half is always fully sorted**, because the rotation point can only be in one half. I find the sorted half with `nums[lo] <= nums[mid]` (left half sorted; the `<=` matters when `lo == mid`). Then a plain range check tells me whether the target is inside that sorted half: for the left half, `nums[lo] <= target < nums[mid]`. If yes, go there, else go to the other half. Trace `[4, 5, 6, 7, 0, 1, 2]`, target 0: lo 0, hi 6, mid 3 (7). Left half 4..7 is sorted, 0 is not within, so lo = 4. Now mid 5 (1): `nums[4] = 0 <= 1`, left half 0..1 sorted and contains 0 (0 <= 0 < 1), so hi = 4. mid 4 holds 0, found. Edge cases: a two-element space like `[3, 1]` is why the test is `<=`; an unrotated array works as is; duplicates break it, which is a different problem. Cost: O(log n) time, O(1) space.',
      875: 'I restate it: piles of bananas, h hours, one pile per hour at speed k; find the smallest integer k that finishes in time. Trying k = 1, 2, 3, and so on costs O(n) per try and k can reach a billion. The observation: a faster speed never hurts, so “finishes within h hours at speed k?” reads no, no, yes, yes: **one flip**. So I binary search the speed. The check is one pass: a pile of p bananas takes `ceil(p / k)` hours, computed as `(p - 1) // k + 1`; sum these and compare with h. The range is 1 to `max(piles)`: speed 1 is the slowest sensible choice, and `max(piles)` surely works since each pile then takes one hour and h is at least the number of piles. I run the lower-bound template: if the hours fit, keep `mid` with `hi = mid`; otherwise `lo = mid + 1`. Trace `[3, 6, 7, 11]`, h = 8: mid 6 needs 6 hours (fits, hi = 6); mid 3 needs 10 (lo = 4); mid 5 needs 8 (hi = 5); mid 4 needs 8 (hi = 4). Answer 4. Edge cases: one pile, h equal to the number of piles (the answer is the largest pile). Cost: O(n log max(piles)) time, O(1) space.',
      1011: 'I restate it: packages must ship in order, a ship carries a consecutive run of total weight at most its capacity each day; find the smallest capacity that ships everything within the given days. Trying every capacity is too slow. The observation: a bigger ship never needs more days, so “ships in time at capacity c?” reads no, no, yes, yes. That is a binary search on capacity. The check is greedy: walk the packages, add each to today’s load, and when the next one would overflow start a new day; count days. Greedy is exact here because order is fixed and loading as much as possible never hurts a later day. The range matters: the capacity cannot be below the **heaviest package** (it cannot be split, and the greedy loop would wrongly accept an oversized package), and the total weight always works in one day. Trace `[3, 2, 2, 4, 1, 4]`, 3 days, lo 4, hi 16: mid 10 needs 2 days (hi = 10); mid 7 needs 3 days: [3,2,2], [4,1], [4] (hi = 7); mid 5 needs 4 days (lo = 6); mid 6 needs 3 days: [3,2], [2,4], [1,4] (hi = 6). Answer 6. Cost: O(n log sum) time, O(1) space.',
      162: 'I restate it: find any index whose value is bigger than both neighbours, where the ends count as having a lower value outside the array, in O(log n). A scan would find one in O(n). The array is not sorted, so what is the single flip? Compare `nums[mid]` with `nums[mid + 1]`. If the next value is bigger, I am walking **uphill** to the right. Keep walking right and one of two things happens: it keeps rising to the last element (which counts as a peak because beyond it is lower) or it turns down, and the turning point is a peak. Either way a peak exists to the right, so `lo = mid + 1`. Otherwise `nums[mid] >= nums[mid + 1]` (going downhill, or at a peak), so a peak lies at `mid` or to its left: `hi = mid`. Trace `[1, 2, 1, 3, 5, 6, 4]`: lo 0, hi 6; mid 3 holds 3 < 5, lo = 4; mid 5 holds 6 > 4, hi = 5; mid 4 holds 5 < 6, lo = 5. Return 5 (value 6). Edge cases: one element returns 0; two elements compare once. Cost: O(log n) time, O(1) space. The boundary exists even though the whole array is not monotone, and that is enough.',
      1482: 'I restate it: flowers bloom on given days; a bouquet needs k **adjacent** flowers that have all bloomed; find the earliest day with m bouquets, or -1. Trying every day is too slow. First a sanity check: m * k flowers are needed, so if that exceeds the garden size return -1. The observation: waiting longer never removes a bloomed flower, so “can I make m bouquets by day d?” reads no, no, yes, yes. That is a binary search on days. The check is one pass: keep a run counter of consecutive flowers with `bloomDay <= d`; each time the run reaches k, count a bouquet and reset the run to 0 (flowers are used once); an unbloomed flower resets the run too. The search range is from the earliest bloom to the latest, since by the latest day everything has bloomed. Trace `[1, 10, 3, 10, 2]`, m = 3, k = 1: lo 1, hi 10; mid 5 gives 3 bloomed flowers, enough, hi = 5; mid 3 gives 3 (days 1, 3, 2), hi = 3; mid 2 gives 2 flowers, lo = 3. Answer 3. Cost: O(n log(max - min)) time, O(1) space.',
      410: 'I restate it: cut the array into k consecutive pieces so that the **largest piece sum** is as small as possible; return that sum. Trying every way of cutting is exponential. The observation: if some limit L allows k pieces or fewer, any bigger limit does too, so “can the array be split into at most k pieces each with sum <= L?” reads no, no, yes, yes. This is the same problem as shipping packages with different words. The check is greedy: extend the current piece until the next number would push it over L, then start a new piece and count. The range: L cannot be below `max(nums)` because every number must sit in some piece, and `sum(nums)` always works with one piece. I run the lower-bound template: if pieces <= k keep `mid` with `hi = mid`, else `lo = mid + 1`. Trace `[7, 2, 5, 10, 8]`, k = 2, lo 10, hi 32: mid 21 gives 2 pieces (hi = 21); mid 15 gives 3 (lo = 16); mid 18 gives 2 (hi = 18); mid 17 gives 3 (lo = 18). Answer 18. Note “at most k” is fine, because splitting into fewer pieces never makes a piece smaller than needed. Cost: O(n log sum) time, O(1) space.'
    }
  };
})();
