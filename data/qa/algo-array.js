(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  function E(id, title, q, tags, a, py, check, more, cx, see) {
    var e = { id: 'al-' + id, title: title, q: q, tags: tags, a: a };
    if (py) { e.code = { py: py }; e.check = check; }
    if (more) e.more = more; if (cx) e.cx = cx; if (see) e.see = see;
    OR.qa.push(e);
  }
  var BS = ['#/topic/binary-search', '#/cheatsheets/patterns'], SO = ['#/topic/sorting', '#/cheatsheets/sorting'],
    TP = ['#/topic/two-pointers', '#/cheatsheets/patterns'], SW = ['#/topic/sliding-window', '#/cheatsheets/patterns'],
    PS = ['#/topic/prefix-sums', '#/cheatsheets/patterns'], IV = ['#/topic/intervals', '#/cheatsheets/patterns'],
    AH = ['#/topic/arrays-hashing', '#/cheatsheets/patterns'], MX = ['#/topic/matrix'];

  E('binary-search', 'Binary search (classic)',
    ['how do i write binary search', 'binary search in python', 'implement binary search', 'binary search code', 'search a sorted array fast', 'explain binary search'],
    'binary search sorted array lo hi mid halve log n search',
    'Keep a window `[lo, hi]` that must contain the target, compare the middle element, and throw away the half that cannot hold it. Return the index, or -1 if the window empties. The array must be sorted.',
    `def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([1, 3, 5, 7, 9], 7))   # 3`,
    `assert binary_search([1,3,5,7,9], 7) == 3
assert binary_search([1,3,5,7,9], 4) == -1
assert binary_search([], 1) == -1
assert binary_search([5], 5) == 0
assert all(binary_search(list(range(50)), i) == i for i in range(50))`,
    '- Each step halves the window, so at most about log2(n)+1 comparisons.\n- Loop condition `lo <= hi` pairs with `mid +/- 1`. If you use `hi = mid`, use `lo < hi` instead.\n- With duplicates it returns some match, not necessarily the first; see lower_bound.',
    'Time O(log n), space O(1)', BS);

  E('binary-search-pitfalls', 'Binary search off-by-one bugs and the mid overflow',
    ['why does my binary search loop forever', 'binary search infinite loop', 'lo + (hi - lo) // 2 vs (lo + hi) // 2', 'binary search off by one', 'lo < hi or lo <= hi', 'binary search mid overflow'],
    'binary search bugs infinite loop overflow mid lo hi boundary invariant',
    'Pick one invariant and stick to it. Closed window `[lo, hi]` uses `while lo <= hi` with `mid + 1` / `mid - 1`. Half-open `[lo, hi)` uses `while lo < hi` with `lo = mid + 1` / `hi = mid`. Mixing the two causes infinite loops.',
    `def lower(a, t):          # half-open [lo, hi)
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2     # same as (lo+hi)//2 in Python
        if a[mid] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo

print(lower([1, 2, 2, 4], 2))   # 1`,
    `assert lower([1,2,2,4], 2) == 1
assert lower([], 5) == 0
assert lower([1,2], 9) == 2`,
    '- Python ints never overflow, so `(lo + hi) // 2` is safe; in Java/C++ use `lo + (hi - lo) / 2`.\n- If `lo = mid` appears, round mid up (`mid = (lo + hi + 1) // 2`) or you loop forever.\n- Check a 1-element and 2-element array by hand.', null, BS);

  E('lower-bound', 'Lower bound (first index with value >= target)',
    ['lower_bound in python', 'how to find first element greater than or equal to target', 'bisect_left implementation', 'lower bound binary search', 'smallest index where a[i] >= x', 'implement lower_bound'],
    'lower bound bisect_left first greater equal binary search c++ lower_bound',
    'Binary search on the half-open window `[0, n)` and move `hi = mid` whenever `a[mid] >= target`. The result is the first index whose value is `>= target` (n if none). This is exactly `bisect.bisect_left`.',
    `from bisect import bisect_left

def lower_bound(a, t):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo

a = [1, 2, 2, 2, 5]
print(lower_bound(a, 2), lower_bound(a, 3), lower_bound(a, 9))   # 1 4 5`,
    `a = [1,2,2,2,5]
for t in range(0, 8):
    assert lower_bound(a, t) == bisect_left(a, t)
assert lower_bound([], 3) == 0`,
    '- Target present? `i < n and a[i] == t`.\n- Count of t = upper_bound(t) - lower_bound(t).\n- Many "find boundary" problems are lower_bound on a true/false predicate.', 'O(log n)', BS);

  E('upper-bound', 'Upper bound (first index with value > target)',
    ['upper_bound in python', 'bisect_right implementation', 'first element strictly greater than target', 'upper bound binary search', 'count elements less than or equal to x in sorted array', 'implement upper_bound'],
    'upper bound bisect_right strictly greater binary search c++ upper_bound count',
    'Same loop as lower_bound but move `lo = mid + 1` when `a[mid] <= target`. It returns the first index whose value is strictly greater than target, which equals the number of elements `<= target`. This is `bisect.bisect_right`.',
    `from bisect import bisect_right

def upper_bound(a, t):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] <= t:
            lo = mid + 1
        else:
            hi = mid
    return lo

a = [1, 2, 2, 2, 5]
print(upper_bound(a, 2))   # 4`,
    `a = [1,2,2,2,5]
for t in range(0, 8):
    assert upper_bound(a, t) == bisect_right(a, t)
assert upper_bound([], 1) == 0`,
    '- `upper_bound(t) - lower_bound(t)` is the number of copies of t.', 'O(log n)', BS);

  E('first-last-occurrence', 'Find first and last position of a value in a sorted array',
    ['find first and last position of element in sorted array', 'first occurrence binary search', 'last occurrence binary search', 'search for a range', 'count occurrences in sorted array', 'leetcode 34 find first and last position'],
    'first last occurrence search range duplicates binary search leetcode 34 count',
    'Run lower_bound for the first index, and upper_bound minus 1 for the last. If the first index is out of range or does not hold the target, the value is absent: return `[-1, -1]`.',
    `def search_range(a, t):
    def bound(strict):
        lo, hi = 0, len(a)
        while lo < hi:
            mid = (lo + hi) // 2
            if a[mid] < t or (strict and a[mid] == t):
                lo = mid + 1
            else:
                hi = mid
        return lo
    first = bound(False)
    if first == len(a) or a[first] != t:
        return [-1, -1]
    return [first, bound(True) - 1]

print(search_range([5, 7, 7, 8, 8, 10], 8))   # [3, 4]`,
    `assert search_range([5,7,7,8,8,10], 8) == [3,4]
assert search_range([5,7,7,8,8,10], 6) == [-1,-1]
assert search_range([], 0) == [-1,-1]
assert search_range([2,2,2], 2) == [0,2]`,
    '- Two binary searches, so still O(log n). A linear scan after finding one hit would be O(n) with many duplicates.', 'O(log n)', BS.concat(['#/problem/34']));

  E('insertion-position', 'Search insert position in a sorted array',
    ['search insert position', 'where would target be inserted in sorted list', 'find index to insert into sorted array', 'leetcode 35', 'insert into sorted list python bisect', 'keep a list sorted while inserting'],
    'insert position bisect insort sorted binary search leetcode 35',
    'The insertion index is `lower_bound(target)`: the first position whose value is `>= target`. In Python use `bisect_left`; `bisect.insort(a, x)` inserts and keeps the list sorted.',
    `from bisect import bisect_left, insort

def search_insert(a, t):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo

a = [1, 3, 5, 6]
print(search_insert(a, 5), search_insert(a, 2), search_insert(a, 7))   # 2 1 4
insort(a, 4); print(a)   # [1, 3, 4, 5, 6]`,
    `assert search_insert([1,3,5,6], 0) == 0
assert search_insert([], 4) == 0
assert a == [1,3,4,5,6]`,
    '- The binary search is O(log n) but `list.insert` shifts elements, so insort is O(n) overall.', 'O(log n) search', BS.concat(['#/problem/35']));

  E('rotated-search', 'Search in a rotated sorted array',
    ['search in rotated sorted array', 'binary search on rotated array', 'leetcode 33', 'find target in rotated array', 'how to binary search a rotated list', 'pivoted sorted array search'],
    'rotated sorted array search pivot binary search leetcode 33',
    'At every step one half of `[lo, hi]` is sorted. Find which half is sorted by comparing `a[lo]` with `a[mid]`, check whether the target lies inside that sorted half, and go there; otherwise go to the other half. Assumes distinct values.',
    `def search_rotated(a, t):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == t:
            return mid
        if a[lo] <= a[mid]:                 # left half sorted
            if a[lo] <= t < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                               # right half sorted
            if a[mid] < t <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1

print(search_rotated([4, 5, 6, 7, 0, 1, 2], 0))   # 4`,
    `a = [4,5,6,7,0,1,2]
assert search_rotated(a, 0) == 4
assert search_rotated(a, 3) == -1
assert search_rotated([1], 1) == 0
assert search_rotated([3,1], 1) == 1
assert all(search_rotated(a, x) == i for i, x in enumerate(a))`,
    '- With duplicates the sorted-half test can be ambiguous (`a[lo]==a[mid]==a[hi]`); shrink both ends and accept worst case O(n).', 'O(log n) for distinct values', BS.concat(['#/problem/33']));

  E('rotated-min', 'Find the minimum in a rotated sorted array',
    ['find minimum in rotated sorted array', 'find rotation point', 'leetcode 153', 'how many times has a sorted array been rotated', 'pivot of rotated array', 'smallest element in rotated array'],
    'rotated minimum pivot rotation count binary search leetcode 153',
    'Compare `a[mid]` with `a[hi]`. If `a[mid] > a[hi]` the minimum is to the right of mid; otherwise it is at mid or to its left. Stop when `lo == hi`. The index of the minimum is also the number of rotations.',
    `def find_min(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:
            lo = mid + 1
        else:
            hi = mid
    return a[lo]

print(find_min([3, 4, 5, 1, 2]))   # 1`,
    `assert find_min([3,4,5,1,2]) == 1
assert find_min([4,5,6,7,0,1,2]) == 0
assert find_min([1,2,3]) == 1
assert find_min([7]) == 7`,
    '- Distinct values assumed. With duplicates, when `a[mid] == a[hi]` do `hi -= 1`.', 'O(log n)', BS.concat(['#/problem/153']));

  E('find-peak', 'Find a peak element',
    ['find peak element', 'leetcode 162', 'binary search without a sorted array', 'peak in an array in log n', 'local maximum in array binary search', 'mountain array peak'],
    'peak element mountain binary search local maximum leetcode 162 852',
    'Compare `a[mid]` with `a[mid+1]`. If it is rising, a peak exists to the right, so `lo = mid + 1`; otherwise a peak exists at mid or to the left, so `hi = mid`. Binary search works because you only need any peak, not a sorted order.',
    `def find_peak(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < a[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo

print(find_peak([1, 2, 1, 3, 5, 6, 4]))   # 5 (index of 6)`,
    `a = [1,2,1,3,5,6,4]
i = find_peak(a)
assert (i == 0 or a[i-1] < a[i]) and (i == len(a)-1 or a[i] > a[i+1])
assert find_peak([1]) == 0
assert find_peak([1,2,3]) == 2`,
    '- Assumes neighbours are never equal and out-of-range counts as minus infinity.', 'O(log n)', BS.concat(['#/problem/162']));

  E('search-on-answer', 'Binary search on the answer (what is it and the template)',
    ['what is binary search on the answer', 'binary search on answer template', 'when to binary search the result', 'minimize the maximum binary search', 'parametric search', 'binary search on a monotonic condition'],
    'binary search on answer parametric search feasibility monotonic minimize maximum',
    'When "is value x big enough?" flips from false to true exactly once as x grows, binary search x itself. Write `feasible(x)`, set `lo, hi` to the smallest and largest possible answers, and find the first x where `feasible(x)` is true.',
    `def first_true(lo, hi, feasible):
    # smallest x in [lo, hi] with feasible(x) True; assumes feasible(hi) is True
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

# example: smallest x with x*x >= 50
print(first_true(0, 50, lambda x: x * x >= 50))   # 8`,
    `assert first_true(0, 50, lambda x: x*x >= 50) == 8
assert first_true(1, 1, lambda x: True) == 1`,
    '- Steps: define the answer range, write an O(n) check, confirm monotonic, binary search.\n- Typical: Koko bananas, ship packages, split array largest sum, min days to make bouquets.\n- Total cost O(n log range).', 'O(check * log range)', BS);

  E('koko-bananas', 'Koko eating bananas (minimum speed)',
    ['koko eating bananas', 'leetcode 875', 'minimum eating speed binary search', 'binary search minimum speed to finish in h hours', 'smallest k so that total hours <= h', 'minimum rate to finish piles'],
    'koko bananas eating speed piles hours binary search on answer leetcode 875 ceil',
    'Binary search the speed k from 1 to `max(piles)`. A speed works if `sum(ceil(p / k)) <= h`. Larger speed never hurts, so find the smallest speed that works.',
    `def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        k = (lo + hi) // 2
        hours = sum((p + k - 1) // k for p in piles)   # ceil(p/k)
        if hours <= h:
            hi = k
        else:
            lo = k + 1
    return lo

print(min_eating_speed([3, 6, 7, 11], 8))   # 4`,
    `assert min_eating_speed([3,6,7,11], 8) == 4
assert min_eating_speed([30,11,23,4,20], 5) == 30
assert min_eating_speed([30,11,23,4,20], 6) == 23
assert min_eating_speed([5], 5) == 1`,
    '- Ceil division without floats: `(p + k - 1) // k`.', 'O(n log max(piles))', BS.concat(['#/problem/875']));

  E('ship-capacity', 'Minimum ship capacity to deliver in D days (split array largest sum)',
    ['capacity to ship packages within d days', 'leetcode 1011', 'minimum capacity binary search', 'split array largest sum', 'minimize the largest subarray sum', 'binary search on capacity'],
    'ship capacity days packages binary search answer split array largest sum 410 1011 minimize maximum',
    'Binary search the capacity between `max(weights)` and `sum(weights)`. Check a capacity greedily: load packages in order, start a new day when the next one would overflow, and see if days used is `<= D`. The same template solves "split array largest sum".',
    `def ship_within_days(weights, days):
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        cap = (lo + hi) // 2
        need, load = 1, 0
        for w in weights:
            if load + w > cap:
                need += 1
                load = 0
            load += w
        if need <= days:
            hi = cap
        else:
            lo = cap + 1
    return lo

print(ship_within_days([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5))   # 15`,
    `assert ship_within_days(list(range(1,11)), 5) == 15
assert ship_within_days([3,2,2,4,1,4], 3) == 6
assert ship_within_days([1,2,3,1,1], 4) == 3
assert ship_within_days([7], 1) == 7`,
    null, 'O(n log sum)', BS.concat(['#/problem/1011']));

  E('integer-sqrt', 'Integer square root without sqrt',
    ['square root binary search', 'leetcode 69 sqrt x', 'integer square root python', 'floor of square root', 'compute sqrt without math library', 'isqrt'],
    'sqrt square root integer binary search newton isqrt leetcode 69',
    'Binary search the largest integer `m` with `m*m <= x`. In Python you can also call `math.isqrt(x)`, which is exact for huge ints; `int(x ** 0.5)` can be off for large values because of floating point.',
    `import math

def my_sqrt(x):
    lo, hi, ans = 0, x, 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans

print(my_sqrt(8), math.isqrt(8))   # 2 2`,
    `for x in list(range(0, 200)) + [10**12, 10**12 - 1]:
    assert my_sqrt(x) == math.isqrt(x)`,
    null, 'O(log x)', BS.concat(['#/problem/69']));

  E('search-matrix-2d', 'Search a 2-D matrix',
    ['search in a 2d matrix', 'leetcode 74', 'binary search on a matrix', 'search sorted matrix', 'leetcode 240 search a 2d matrix ii', 'find a number in a row and column sorted matrix'],
    'search 2d matrix binary search flatten row column sorted staircase leetcode 74 240',
    'If each row is sorted and each row starts after the previous ends (LC 74), treat it as one flat array of `m*n` items and binary search with `divmod(mid, n)`. If rows and columns are each sorted but rows are not chained (LC 240), start at the top-right and walk left or down.',
    `def search_matrix(m, t):                 # LC 74: fully ordered
    if not m or not m[0]:
        return False
    n = len(m[0])
    lo, hi = 0, len(m) * n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        v = m[mid // n][mid % n]
        if v == t: return True
        if v < t: lo = mid + 1
        else: hi = mid - 1
    return False

def search_matrix_ii(m, t):              # LC 240: staircase
    r, c = 0, len(m[0]) - 1
    while r < len(m) and c >= 0:
        if m[r][c] == t: return True
        if m[r][c] > t: c -= 1
        else: r += 1
    return False

g = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
print(search_matrix(g, 3), search_matrix_ii(g, 13))   # True False`,
    `g = [[1,3,5,7],[10,11,16,20],[23,30,34,60]]
assert search_matrix(g, 16) and not search_matrix(g, 13)
assert not search_matrix([], 1)
assert search_matrix_ii(g, 60) and not search_matrix_ii(g, 0)`,
    '- LC 74 is O(log(mn)); the staircase is O(m + n).', null, BS.concat(MX, ['#/problem/74']));

  E('bisect-module', 'Python bisect module (bisect_left, bisect_right, insort)',
    ['how to use bisect in python', 'python bisect example', 'bisect_left vs bisect_right', 'binary search with the standard library python', 'bisect with key', 'insort python'],
    'bisect bisect_left bisect_right insort python binary search library key',
    '`bisect_left(a, x)` returns the leftmost index to insert x (before equal items); `bisect_right(a, x)` returns the index after equal items. Both need a sorted list. `insort` inserts and keeps order. Since Python 3.10 they accept `key=`.',
    `from bisect import bisect_left, bisect_right, insort

a = [1, 2, 2, 2, 5]
print(bisect_left(a, 2), bisect_right(a, 2))   # 1 4
print(bisect_right(a, 2) - bisect_left(a, 2))  # 3 copies

def contains(a, x):
    i = bisect_left(a, x)
    return i < len(a) and a[i] == x

rows = [("a", 1), ("b", 5), ("c", 9)]
print(bisect_left(rows, 5, key=lambda r: r[1]))   # 1`,
    `assert contains(a, 5) and not contains(a, 3)
insort(a, 3); assert a == [1,2,2,2,3,5]
assert bisect_left(rows, 5, key=lambda r: r[1]) == 1`,
    null, 'O(log n) search', BS.concat(['#/cheatsheets/python']));

  E('linear-search', 'Linear search',
    ['linear search python', 'how to search an unsorted list', 'sequential search', 'find index of element in list', 'find first element matching a condition', 'linear search vs binary search'],
    'linear search sequential scan unsorted list index find next',
    'Scan the items one by one and return the first match. Use it on unsorted or tiny data; use binary search only when the data is sorted. Python builtins: `x in a`, `a.index(x)` (raises if missing), `next((v for v in a if cond), None)`.',
    `def linear_search(a, target):
    for i, v in enumerate(a):
        if v == target:
            return i
    return -1

a = [4, 9, 2, 7]
print(linear_search(a, 2))                       # 2
print(next((v for v in a if v > 5), None))       # 9`,
    `assert linear_search([4,9,2,7], 2) == 2
assert linear_search([], 1) == -1
assert linear_search([1,1], 1) == 0
assert next((v for v in [1,2] if v > 5), None) is None`,
    '- Sorting first costs O(n log n), so for one lookup on unsorted data a scan wins. For many lookups, build a set or dict.', 'O(n) time, O(1) space', ['#/topic/arrays-hashing']);

  E('bubble-sort', 'Bubble sort',
    ['bubble sort python', 'how does bubble sort work', 'implement bubble sort', 'bubble sort code', 'simple sorting algorithm swap neighbours', 'bubble sort with early exit'],
    'bubble sort swap adjacent stable in place o(n^2) swapped flag',
    'Repeatedly swap adjacent items that are out of order; each pass bubbles the largest remaining item to the end. Stop early when a pass makes no swap. It is simple but O(n^2), so only useful for teaching or nearly sorted tiny input.',
    `def bubble_sort(a):
    n = len(a)
    for end in range(n - 1, 0, -1):
        swapped = False
        for i in range(end):
            if a[i] > a[i + 1]:
                a[i], a[i + 1] = a[i + 1], a[i]
                swapped = True
        if not swapped:
            break
    return a

print(bubble_sort([5, 1, 4, 2, 8]))   # [1, 2, 4, 5, 8]`,
    `assert bubble_sort([5,1,4,2,8]) == [1,2,4,5,8]
assert bubble_sort([]) == [] and bubble_sort([1]) == [1]
assert bubble_sort([3,3,1]) == [1,3,3]`,
    '- Stable, in place. Best case O(n) (already sorted, with the early exit), worst/average O(n^2).', 'Time O(n^2), space O(1)', SO);

  E('selection-sort', 'Selection sort',
    ['selection sort python', 'how does selection sort work', 'implement selection sort', 'selection sort code', 'sort by finding the minimum repeatedly', 'is selection sort stable'],
    'selection sort minimum swap in place not stable o(n^2)',
    'For each position i, find the smallest item in `a[i:]` and swap it into place. It always does O(n^2) comparisons but at most n-1 swaps. It is not stable.',
    `def selection_sort(a):
    for i in range(len(a) - 1):
        m = i
        for j in range(i + 1, len(a)):
            if a[j] < a[m]:
                m = j
        a[i], a[m] = a[m], a[i]
    return a

print(selection_sort([64, 25, 12, 22, 11]))   # [11, 12, 22, 25, 64]`,
    `assert selection_sort([64,25,12,22,11]) == [11,12,22,25,64]
assert selection_sort([]) == []
assert selection_sort([2,1,2]) == [1,2,2]`,
    '- The long-distance swap breaks stability: `[2a, 2b, 1]` becomes `[1, 2b, 2a]`.\n- Useful only when writes are expensive.', 'Time O(n^2), space O(1)', SO);

  E('insertion-sort', 'Insertion sort',
    ['insertion sort python', 'how does insertion sort work', 'implement insertion sort', 'insertion sort code', 'sort like a hand of cards', 'best sorting algorithm for nearly sorted data'],
    'insertion sort shift stable in place nearly sorted adaptive o(n^2)',
    'Grow a sorted prefix: take the next item, shift larger prefix items one step right, and drop it into the gap. It is stable, in place, and O(n) on nearly sorted input, which is why real sorts use it for tiny runs.',
    `def insertion_sort(a):
    for i in range(1, len(a)):
        x = a[i]
        j = i - 1
        while j >= 0 and a[j] > x:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = x
    return a

print(insertion_sort([5, 2, 4, 6, 1, 3]))   # [1, 2, 3, 4, 5, 6]`,
    `assert insertion_sort([5,2,4,6,1,3]) == [1,2,3,4,5,6]
assert insertion_sort([]) == [] and insertion_sort([9]) == [9]
assert insertion_sort([2,2,1]) == [1,2,2]`,
    '- Worst/average O(n^2); best O(n). Use strict `>` to keep equal items in original order.', 'Time O(n^2), space O(1)', SO);

  E('merge-sort', 'Merge sort',
    ['merge sort python', 'how does merge sort work', 'implement merge sort', 'merge sort code', 'divide and conquer sorting', 'is merge sort stable'],
    'merge sort divide conquer stable o(n log n) merge two halves recursion',
    'Split the list in half, sort each half recursively, then merge the two sorted halves with two pointers. It is stable and always O(n log n), at the cost of O(n) extra space.',
    `def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:          # <= keeps it stable
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out

print(merge_sort([38, 27, 43, 3, 9, 82, 10]))   # [3, 9, 10, 27, 38, 43, 82]`,
    `import random
assert merge_sort([]) == [] and merge_sort([1]) == [1]
for _ in range(100):
    x = [random.randint(-9, 9) for _ in range(random.randint(0, 30))]
    assert merge_sort(x) == sorted(x)`,
    '- Depth log n, each level does O(n) merging.\n- Good for linked lists and external sorting; counts inversions with a tiny change.', 'Time O(n log n) always, space O(n)', SO);

  E('quick-sort', 'Quicksort',
    ['quick sort python', 'how does quicksort work', 'implement quicksort in place', 'quicksort code', 'quicksort random pivot', 'quicksort worst case'],
    'quicksort quick sort partition pivot in place o(n log n) worst case random pivot lomuto',
    'Pick a pivot, partition so smaller items go left and larger go right, then recurse on both sides. A random pivot makes the expected time O(n log n); the worst case is O(n^2) (e.g. always-bad pivots). It is in place but not stable.',
    `import random

def quicksort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:
        return a
    p = random.randint(lo, hi)
    a[p], a[hi] = a[hi], a[p]
    pivot, s = a[hi], lo
    for i in range(lo, hi):             # Lomuto partition
        if a[i] < pivot:
            a[i], a[s] = a[s], a[i]
            s += 1
    a[s], a[hi] = a[hi], a[s]
    quicksort(a, lo, s - 1)
    quicksort(a, s + 1, hi)
    return a

print(quicksort([3, 6, 1, 8, 2, 9, 2]))   # [1, 2, 2, 3, 6, 8, 9]`,
    `for _ in range(100):
    x = [random.randint(0, 5) for _ in range(random.randint(0, 40))]
    assert quicksort(x[:]) == sorted(x)
assert quicksort([]) == []`,
    '- Average O(n log n), worst O(n^2). Stack depth O(log n) expected; recurse into the smaller side first to guarantee it.\n- Many equal keys hurt this Lomuto version; use 3-way or Hoare partition.', 'Average O(n log n), worst O(n^2), space O(log n)', SO);

  E('quicksort-partition-schemes', 'Quicksort partition schemes: Lomuto vs Hoare vs 3-way',
    ['lomuto vs hoare partition', 'quicksort partition schemes', 'hoare partition code', 'three way partition quicksort', 'quicksort with many duplicates', 'how does hoare partition work'],
    'lomuto hoare partition three way dutch flag quicksort duplicates pivot scheme',
    'Lomuto: one scan, pivot ends in its final place, simple but slow with many duplicates. Hoare: two pointers move inward and swap, about 3x fewer swaps, returns a split point rather than the pivot position. 3-way: splits into `<`, `==`, `>` and handles duplicates in O(n).',
    `def hoare_partition(a, lo, hi):
    pivot = a[(lo + hi) // 2]
    i, j = lo - 1, hi + 1
    while True:
        i += 1
        while a[i] < pivot: i += 1
        j -= 1
        while a[j] > pivot: j -= 1
        if i >= j:
            return j
        a[i], a[j] = a[j], a[i]

def quicksort_hoare(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo < hi:
        p = hoare_partition(a, lo, hi)
        quicksort_hoare(a, lo, p)        # note: p, not p-1
        quicksort_hoare(a, p + 1, hi)
    return a

def quicksort_3way(a):
    if len(a) <= 1: return a
    p = a[len(a) // 2]
    return (quicksort_3way([x for x in a if x < p]) + [x for x in a if x == p]
            + quicksort_3way([x for x in a if x > p]))

print(quicksort_hoare([5, 1, 4, 1, 5, 9]), quicksort_3way([5, 1, 4, 1, 5, 9]))`,
    `import random
for _ in range(200):
    x = [random.randint(0, 6) for _ in range(random.randint(0, 30))]
    assert quicksort_hoare(x[:]) == sorted(x)
    assert quicksort_3way(x) == sorted(x)`,
    '- Hoare recurses on `[lo, p]` and `[p+1, hi]`; using `p-1` loses elements.\n- The list-comprehension 3-way version is clear but not in place; the in-place version is the Dutch national flag loop.', null, SO);

  E('heap-sort', 'Heap sort',
    ['heap sort python', 'how does heapsort work', 'implement heap sort in place', 'heapsort code', 'sort using a max heap', 'heap sort vs quicksort'],
    'heap sort heapsort max heap sift down in place not stable o(n log n)',
    'Build a max-heap in the array, then repeatedly swap the root (largest) to the end, shrink the heap by one, and sift the new root down. It is in place with guaranteed O(n log n), but not stable and cache-unfriendly.',
    `def heap_sort(a):
    n = len(a)
    def sift_down(i, size):
        while True:
            big, l, r = i, 2 * i + 1, 2 * i + 2
            if l < size and a[l] > a[big]: big = l
            if r < size and a[r] > a[big]: big = r
            if big == i: return
            a[i], a[big] = a[big], a[i]
            i = big
    for i in range(n // 2 - 1, -1, -1):     # build heap in O(n)
        sift_down(i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]
        sift_down(0, end)
    return a

print(heap_sort([12, 11, 13, 5, 6, 7]))   # [5, 6, 7, 11, 12, 13]`,
    `import random
assert heap_sort([]) == [] and heap_sort([1]) == [1]
for _ in range(100):
    x = [random.randint(-5, 5) for _ in range(random.randint(0, 30))]
    assert heap_sort(x[:]) == sorted(x)`,
    '- Building the heap is O(n); the n extractions cost O(n log n).', 'Time O(n log n) worst, space O(1)', SO.concat(['#/topic/heaps']));

  E('counting-sort', 'Counting sort',
    ['counting sort python', 'how does counting sort work', 'implement counting sort', 'sort without comparisons', 'sort small integers in linear time', 'stable counting sort'],
    'counting sort non comparison linear time integers range k stable prefix counts',
    'Count how many times each value occurs, turn counts into prefix sums (end positions), then place items from right to left to keep it stable. It sorts integers in a small range `k` in O(n + k).',
    `def counting_sort(a):
    if not a:
        return []
    lo, hi = min(a), max(a)
    count = [0] * (hi - lo + 1)
    for x in a:
        count[x - lo] += 1
    for i in range(1, len(count)):
        count[i] += count[i - 1]          # count[i] = items <= value i+lo
    out = [0] * len(a)
    for x in reversed(a):                 # reversed keeps it stable
        count[x - lo] -= 1
        out[count[x - lo]] = x
    return out

print(counting_sort([4, 2, 2, 8, 3, 3, 1, -1]))   # [-1, 1, 2, 2, 3, 3, 4, 8]`,
    `assert counting_sort([4,2,2,8,3,3,1,-1]) == [-1,1,2,2,3,3,4,8]
assert counting_sort([]) == []
assert counting_sort([5]) == [5]`,
    '- Great when k is about n or smaller; terrible when values span millions.\n- Used as the stable subroutine of radix sort.', 'Time O(n + k), space O(n + k)', SO);

  E('radix-sort', 'Radix sort',
    ['radix sort python', 'how does radix sort work', 'implement lsd radix sort', 'sort numbers digit by digit', 'radix sort complexity', 'radix sort code'],
    'radix sort lsd digit base 10 stable non comparison buckets linear',
    'Sort by the least significant digit first, then the next, up to the most significant, using a stable sort for each pass. Because every pass is stable, earlier order is preserved. For non-negative ints with d digits it runs in O(d * (n + base)).',
    `def radix_sort(a):
    if not a:
        return []
    exp, m = 1, max(a)
    while m // exp > 0:
        buckets = [[] for _ in range(10)]
        for x in a:
            buckets[(x // exp) % 10].append(x)
        a = [x for b in buckets for x in b]
        exp *= 10
    return a

print(radix_sort([170, 45, 75, 90, 802, 24, 2, 66]))   # [2, 24, 45, 66, 75, 90, 170, 802]`,
    `assert radix_sort([170,45,75,90,802,24,2,66]) == [2,24,45,66,75,90,170,802]
assert radix_sort([]) == [] and radix_sort([0, 0]) == [0, 0]`,
    '- This version handles non-negative integers; for negatives, split by sign or offset by the minimum.', 'Time O(d(n + b)), space O(n + b)', SO);

  E('bucket-sort', 'Bucket sort',
    ['bucket sort python', 'how does bucket sort work', 'implement bucket sort', 'sort floats between 0 and 1', 'bucket sort complexity', 'bucket sort code'],
    'bucket sort uniform distribution floats buckets scatter gather average linear',
    'Scatter values into n buckets by range (for floats in `[0, 1)`: bucket `int(x*n)`), sort each small bucket, then concatenate. It is O(n) on average when data is spread evenly, and O(n^2) if everything lands in one bucket.',
    `def bucket_sort(a):
    n = len(a)
    if n == 0:
        return []
    buckets = [[] for _ in range(n)]
    for x in a:                           # assumes 0 <= x < 1
        buckets[int(x * n)].append(x)
    out = []
    for b in buckets:
        out.extend(sorted(b))
    return out

print(bucket_sort([0.42, 0.32, 0.23, 0.52, 0.25, 0.47, 0.51]))`,
    `import random
x = [random.random() for _ in range(100)]
assert bucket_sort(x) == sorted(x)
assert bucket_sort([]) == []`,
    '- The same idea (bucket by frequency) solves "top k frequent elements" in O(n).', 'Average O(n + k), worst O(n^2)', SO);

  E('shell-sort', 'Shell sort idea',
    ['shell sort', 'what is shell sort', 'shell sort python', 'improved insertion sort with gaps', 'shellsort gap sequence', 'implement shell sort'],
    'shell sort gap sequence insertion sort diminishing increment in place not stable',
    'Shell sort runs insertion sort on items that are `gap` apart, then shrinks the gap until it is 1. Early large-gap passes move items far with few swaps, so the final insertion pass has little to do. It is in place, not stable, and its running time depends on the gap sequence.',
    `def shell_sort(a):
    gap = len(a) // 2
    while gap > 0:
        for i in range(gap, len(a)):
            x, j = a[i], i
            while j >= gap and a[j - gap] > x:
                a[j] = a[j - gap]
                j -= gap
            a[j] = x
        gap //= 2
    return a

print(shell_sort([12, 34, 54, 2, 3]))   # [2, 3, 12, 34, 54]`,
    `import random
for _ in range(50):
    x = [random.randint(0, 20) for _ in range(random.randint(0, 40))]
    assert shell_sort(x[:]) == sorted(x)`,
    '- With the n/2, n/4, ... gaps the worst case is O(n^2); better sequences (Knuth, Ciura) are faster in practice.', 'Between O(n log n) and O(n^2) depending on gaps', SO);

  E('sort-stability-table', 'Which sorts are stable and in place? (comparison table)',
    ['which sorting algorithms are stable', 'sorting algorithms comparison table', 'what does stable sort mean', 'in place vs stable sorting', 'sorting complexity cheat sheet', 'time and space complexity of sorting algorithms'],
    'stable sort in place table complexity comparison bubble merge quick heap insertion selection counting radix',
    'A stable sort keeps equal keys in their original order, which matters when you sort by one field after another. Stable: bubble, insertion, merge, counting, radix, Timsort. Not stable: selection, quick, heap, shell.',
    `people = [("Ann", 30), ("Bob", 25), ("Cy", 30), ("Di", 25)]
by_age = sorted(people, key=lambda p: p[1])    # stable
print(by_age)   # Bob and Di keep their order; Ann before Cy`,
    `assert by_age == [("Bob",25),("Di",25),("Ann",30),("Cy",30)]`,
    '| Sort | Best | Average | Worst | Extra space | Stable |\n|---|---|---|---|---|---|\n| Bubble | n | n^2 | n^2 | 1 | yes |\n| Selection | n^2 | n^2 | n^2 | 1 | no |\n| Insertion | n | n^2 | n^2 | 1 | yes |\n| Merge | n log n | n log n | n log n | n | yes |\n| Quick | n log n | n log n | n^2 | log n | no |\n| Heap | n log n | n log n | n log n | 1 | no |\n| Counting | n+k | n+k | n+k | n+k | yes |\n| Radix | d(n+b) | d(n+b) | d(n+b) | n+b | yes |',
    null, SO);

  E('python-sort-algorithm', 'Which sorting algorithm does Python use?',
    ['what sorting algorithm does python use', 'python sort time complexity', 'what is timsort', 'is python sort stable', 'how does sorted work internally', 'python list.sort algorithm'],
    'timsort python sort sorted algorithm stable merge insertion runs complexity',
    'Python uses Timsort for `list.sort()` and `sorted()`: a stable hybrid of merge sort and insertion sort that finds already-sorted runs. It is O(n log n) worst case and O(n) on data that is already (or reverse) sorted. It needs up to O(n) temporary space.',
    `data = [("b", 2), ("a", 2), ("c", 1)]
print(sorted(data, key=lambda t: t[1]))      # stable: ("b",2) stays before ("a",2)
print(sorted(data, key=lambda t: t[1], reverse=True))   # reverse also keeps original order of equals`,
    `assert sorted(data, key=lambda t: t[1]) == [("c",1),("b",2),("a",2)]
assert sorted(data, key=lambda t: t[1], reverse=True) == [("b",2),("a",2),("c",1)]`,
    '- Because it is stable you can sort by several keys by sorting repeatedly from least to most important key, or use a tuple key.\n- JavaScript `Array.prototype.sort` is also stable (ES2019+).', 'Time O(n log n) worst, O(n) best; space O(n)', SO.concat(['#/cheatsheets/python']));

  E('which-sort', 'Which sorting algorithm should I use?',
    ['which sorting algorithm is best', 'when to use merge sort vs quicksort', 'what sort to use in an interview', 'best sorting algorithm for small arrays', 'which sort for linked list', 'when to use counting sort'],
    'which sort best choose sorting algorithm decision quicksort merge counting insertion',
    'In practice call the library sort. Interview rules: merge sort when you need stability or are sorting a linked list; quicksort/heap sort for in-place arrays; counting or radix sort when keys are small integers; insertion sort for tiny or nearly sorted data.',
    `# in practice
nums = [5, 2, 9, 1]
nums.sort()                 # in place, O(n log n), stable
print(nums)                 # [1, 2, 5, 9]
print(sorted("hello"))      # ['e', 'h', 'l', 'l', 'o']`,
    `assert nums == [1,2,5,9]`,
    '- Need only the k smallest/largest? Use a heap or quickselect, not a full sort.\n- Already sorted data? Binary search or merge, do not re-sort.', null, SO);

  E('quickselect', 'Quickselect (k-th smallest element in O(n) average)',
    ['quickselect algorithm', 'find kth smallest element', 'kth largest element in an array without sorting', 'quickselect python', 'selection algorithm average linear time', 'leetcode 215 quickselect'],
    'quickselect kth smallest largest selection partition average linear leetcode 215 hoare',
    'Quickselect is quicksort that recurses into only the side containing index k. Partition around a random pivot into `<`, `==`, `>` groups and continue in the group that holds the k-th item. Average O(n), worst O(n^2). For the k-th largest use index `n - k`.',
    `import random

def quickselect(a, k):
    """k-th smallest (0-indexed)."""
    while True:
        p = random.choice(a)
        lo = [x for x in a if x < p]
        eq = [x for x in a if x == p]
        if k < len(lo):
            a = lo
        elif k < len(lo) + len(eq):
            return p
        else:
            k -= len(lo) + len(eq)
            a = [x for x in a if x > p]

nums = [3, 2, 1, 5, 6, 4]
print(quickselect(nums, len(nums) - 2))   # 5 (2nd largest)`,
    `import random
assert quickselect([3,2,1,5,6,4], 4) == 5
assert quickselect([3,2,3,1,2,4,5,5,6], 9 - 4) == 4
assert quickselect([7], 0) == 7
for _ in range(100):
    x = [random.randint(0, 9) for _ in range(random.randint(1, 20))]
    k = random.randrange(len(x))
    assert quickselect(x, k) == sorted(x)[k]`,
    '- The 3-way split keeps duplicates from causing O(n^2). This list version uses O(n) extra space; the in-place version swaps within the array.\n- A guaranteed O(n) worst case needs median of medians, rarely worth it.', 'Average O(n), worst O(n^2)', SO.concat(['#/topic/heaps', '#/problem/215']));

  E('kth-largest-heap', 'Kth largest element using a heap',
    ['kth largest element in an array', 'find k largest elements python', 'top k elements heapq', 'kth largest in a stream', 'python heapq nlargest', 'min heap of size k'],
    'kth largest heap heapq min heap size k nlargest nsmallest leetcode 215 703',
    'Keep a min-heap of the k largest values seen so far. Push each number, pop when the size exceeds k; the root is the k-th largest. This is O(n log k) and works for streams. `heapq.nlargest(k, a)[-1]` does the same in one call.',
    `import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]

print(kth_largest([3, 2, 1, 5, 6, 4], 2))   # 5`,
    `import heapq
assert kth_largest([3,2,1,5,6,4], 2) == 5
assert kth_largest([3,2,3,1,2,4,5,5,6], 4) == 4
assert kth_largest([1], 1) == 1
assert heapq.nlargest(2, [3,2,1,5,6,4])[-1] == 5`,
    '- Heap: O(n log k) time, O(k) space. Quickselect: O(n) average. Sorting: O(n log n).', 'O(n log k)', ['#/topic/heaps', '#/problem/215']);

  E('merge-sorted-arrays', 'Merge two sorted arrays',
    ['merge two sorted arrays', 'merge two sorted lists python', 'leetcode 88 merge sorted array in place', 'merge sorted arrays two pointers', 'combine two sorted lists', 'heapq merge'],
    'merge two sorted arrays two pointers in place leetcode 88 heapq.merge',
    'Walk both arrays with two pointers, always taking the smaller head. To merge in place into a buffer with spare room at the end (LC 88), fill from the back so nothing is overwritten before it is read. `heapq.merge` does a lazy k-way merge.',
    `def merge(a, b):
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    return out + a[i:] + b[j:]

def merge_inplace(nums1, m, nums2, n):     # nums1 has m values then n spare slots
    i, j, k = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[k] = nums1[i]; i -= 1
        else:
            nums1[k] = nums2[j]; j -= 1
        k -= 1

x = [1, 2, 3, 0, 0, 0]
merge_inplace(x, 3, [2, 5, 6], 3)
print(merge([1, 3], [2, 4]), x)   # [1, 2, 3, 4] [1, 2, 2, 3, 5, 6]`,
    `assert merge([1,3],[2,4]) == [1,2,3,4]
assert merge([], [1]) == [1] and merge([], []) == []
assert x == [1,2,2,3,5,6]
y = [0]; merge_inplace(y, 0, [1], 1); assert y == [1]`,
    null, 'O(m + n)', TP.concat(['#/topic/sorting', '#/problem/88']));

  E('sort-colors', 'Sort colors / Dutch national flag (3-way partition)',
    ['sort colors', 'dutch national flag problem', 'sort an array of 0s 1s and 2s', 'leetcode 75', 'three way partition in one pass', 'sort array of 0 1 2 in place'],
    'sort colors dutch national flag three way partition 0 1 2 one pass leetcode 75',
    'Keep three pointers: `lo` (next slot for 0), `hi` (next slot for 2) and `i` (scanner). Swap 0s to `lo`, 2s to `hi`, and skip 1s. When you swap with `hi` do not advance `i`, because the swapped-in value is unchecked.',
    `def sort_colors(a):
    lo, i, hi = 0, 0, len(a) - 1
    while i <= hi:
        if a[i] == 0:
            a[lo], a[i] = a[i], a[lo]
            lo += 1; i += 1
        elif a[i] == 2:
            a[i], a[hi] = a[hi], a[i]
            hi -= 1
        else:
            i += 1
    return a

print(sort_colors([2, 0, 2, 1, 1, 0]))   # [0, 0, 1, 1, 2, 2]`,
    `assert sort_colors([2,0,2,1,1,0]) == [0,0,1,1,2,2]
assert sort_colors([]) == [] and sort_colors([1]) == [1]
assert sort_colors([2,2,0]) == [0,2,2]`,
    '- One pass, O(1) space. The same partition is the heart of 3-way quicksort.', 'Time O(n), space O(1)', TP.concat(['#/problem/75']));

  E('two-sum-sorted', 'Two sum in a sorted array (two pointers)',
    ['two sum ii sorted array', 'two pointers two sum', 'leetcode 167', 'find pair with given sum in sorted array', 'two sum without extra space', 'two sum two pointer technique'],
    'two sum sorted two pointers pair sum leetcode 167 left right',
    'Put one pointer at each end. If the sum is too big move the right pointer left; if too small move the left pointer right; if equal you have the pair. Each pointer moves at most n steps, so it is O(n) time and O(1) space.',
    `def two_sum_sorted(a, target):
    l, r = 0, len(a) - 1
    while l < r:
        s = a[l] + a[r]
        if s == target:
            return [l, r]
        if s < target:
            l += 1
        else:
            r -= 1
    return []

print(two_sum_sorted([2, 7, 11, 15], 9))   # [0, 1]`,
    `assert two_sum_sorted([2,7,11,15], 9) == [0,1]
assert two_sum_sorted([1,2,3], 7) == []
assert two_sum_sorted([-3,0,3], 0) == [0,2]
assert two_sum_sorted([5], 5) == []`,
    '- Works because sortedness lets you discard one candidate per step.', 'Time O(n), space O(1)', TP.concat(['#/problem/167']));

  E('three-sum', '3Sum (all unique triplets that add to zero)',
    ['3sum', 'three sum problem', 'leetcode 15', 'find triplets that sum to zero', 'how to solve 3sum without duplicates', '3sum two pointers'],
    '3sum three sum triplets zero sort two pointers skip duplicates leetcode 15',
    'Sort the array. For each index i, run a two-pointer two-sum on the suffix looking for `-a[i]`. Skip repeated values for i, and after finding a triplet skip repeated left values. That avoids duplicate triplets without a set.',
    `def three_sum(nums):
    nums.sort()
    out = []
    for i, x in enumerate(nums):
        if x > 0:
            break
        if i and x == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = x + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                out.append([x, nums[l], nums[r]])
                l += 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
    return out

print(three_sum([-1, 0, 1, 2, -1, -4]))   # [[-1, -1, 2], [-1, 0, 1]]`,
    `assert three_sum([-1,0,1,2,-1,-4]) == [[-1,-1,2],[-1,0,1]]
assert three_sum([0,0,0,0]) == [[0,0,0]]
assert three_sum([1,2]) == []
assert three_sum([]) == []`,
    null, 'Time O(n^2), space O(1) beyond output and sort', TP.concat(['#/problem/15']));

  E('container-most-water', 'Container with most water',
    ['container with most water', 'leetcode 11', 'max area between two lines', 'two pointers max area', 'why move the shorter pointer', 'most water two pointer proof'],
    'container most water two pointers max area heights shorter wall leetcode 11',
    'Start with pointers at both ends (widest container), compute area `min(h[l], h[r]) * (r - l)`, then move the pointer at the shorter wall inward. Moving the taller one can never help because width shrinks and the height is still capped by the short wall.',
    `def max_area(h):
    l, r, best = 0, len(h) - 1, 0
    while l < r:
        best = max(best, min(h[l], h[r]) * (r - l))
        if h[l] < h[r]:
            l += 1
        else:
            r -= 1
    return best

print(max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))   # 49`,
    `assert max_area([1,8,6,2,5,4,8,3,7]) == 49
assert max_area([1,1]) == 1
assert max_area([5]) == 0`,
    null, 'Time O(n), space O(1)', TP.concat(['#/problem/11']));

  E('remove-duplicates-sorted', 'Remove duplicates from a sorted array in place',
    ['remove duplicates from sorted array', 'leetcode 26', 'in place dedupe sorted list', 'remove duplicates in place python', 'two pointers slow fast remove duplicates', 'unique elements in place return length'],
    'remove duplicates sorted in place slow fast pointer write index leetcode 26 80',
    'Use a write pointer `k`. Scan with a read pointer, and whenever a value differs from the last kept value (`a[k-1]`) write it at `a[k]` and advance k. Return k; the first k items are the unique values.',
    `def remove_duplicates(a):
    k = 0
    for x in a:
        if k == 0 or x != a[k - 1]:
            a[k] = x
            k += 1
    return k

nums = [0, 0, 1, 1, 1, 2, 2, 3]
k = remove_duplicates(nums)
print(k, nums[:k])   # 4 [0, 1, 2, 3]`,
    `assert k == 4 and nums[:k] == [0,1,2,3]
b = []; assert remove_duplicates(b) == 0
c = [1,1]; assert remove_duplicates(c) == 1 and c[:1] == [1]`,
    '- For "allow at most 2 copies" (LC 80) compare with `a[k-2]` instead.\n- Unsorted input: use a set, or sort first.', 'Time O(n), space O(1)', TP.concat(['#/problem/26']));

  E('move-zeroes', 'Move zeroes to the end',
    ['move zeroes', 'leetcode 283', 'push all zeros to the end in place', 'move zeros to end keeping order', 'partition zero and non zero', 'move zeroes python'],
    'move zeroes in place stable two pointers write index partition leetcode 283',
    'Keep a write index for the next non-zero slot. For every non-zero value swap it into that slot and advance. All zeros end up at the back and the order of non-zeros is preserved, in one pass.',
    `def move_zeroes(a):
    w = 0
    for r in range(len(a)):
        if a[r] != 0:
            a[w], a[r] = a[r], a[w]
            w += 1
    return a

print(move_zeroes([0, 1, 0, 3, 12]))   # [1, 3, 12, 0, 0]`,
    `assert move_zeroes([0,1,0,3,12]) == [1,3,12,0,0]
assert move_zeroes([0]) == [0] and move_zeroes([]) == []
assert move_zeroes([1,2]) == [1,2]`,
    null, 'Time O(n), space O(1)', TP.concat(['#/problem/283']));

  E('valid-palindrome', 'Check for a palindrome (ignoring punctuation and case)',
    ['valid palindrome', 'palindrome check python', 'is string a palindrome two pointers', 'leetcode 125', 'check palindrome ignoring non alphanumeric', 'palindrome without extra space'],
    'palindrome valid two pointers alphanumeric lower case leetcode 125 reverse check',
    'Move two pointers inward from both ends, skipping non-alphanumeric characters, and compare lowercase characters. Mismatch means not a palindrome. For a simple clean string, `s == s[::-1]` is the one-liner (O(n) extra space).',
    `def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum(): l += 1
        while l < r and not s[r].isalnum(): r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l += 1; r -= 1
    return True

print(is_palindrome("A man, a plan, a canal: Panama"))   # True`,
    `assert is_palindrome("A man, a plan, a canal: Panama")
assert not is_palindrome("race a car")
assert is_palindrome("") and is_palindrome(" ") and is_palindrome("a")
assert "abba" == "abba"[::-1]`,
    null, 'Time O(n), space O(1)', TP.concat(['#/problem/125']));

  E('merge-intervals', 'Merge overlapping intervals',
    ['merge intervals', 'leetcode 56', 'merge overlapping intervals python', 'combine overlapping ranges', 'how to merge intervals after sorting', 'union of intervals'],
    'merge intervals overlap sort by start leetcode 56 combine ranges',
    'Sort by start. Keep a result list; for each interval, if its start is `<=` the end of the last result interval, extend that end with `max`; otherwise append a new interval.',
    `def merge_intervals(iv):
    iv = sorted(iv)
    out = []
    for s, e in iv:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out

print(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]))   # [[1, 6], [8, 10], [15, 18]]`,
    `assert merge_intervals([[1,3],[2,6],[8,10],[15,18]]) == [[1,6],[8,10],[15,18]]
assert merge_intervals([[1,4],[4,5]]) == [[1,5]]
assert merge_intervals([[1,10],[2,3]]) == [[1,10]]
assert merge_intervals([]) == []`,
    '- `<=` treats touching intervals as overlapping; use `<` if [1,4] and [4,5] must stay separate.', 'Time O(n log n), space O(n)', IV.concat(['#/problem/56']));

  E('sliding-window-fixed', 'Fixed-size sliding window (max sum / average of k elements)',
    ['maximum sum of k consecutive elements', 'fixed size sliding window', 'sliding window max average subarray', 'leetcode 643', 'how does sliding window work', 'rolling sum window of size k'],
    'sliding window fixed size k max sum average subarray leetcode 643 rolling',
    'Compute the first window sum, then slide: add the entering element and subtract the leaving one, updating the best each step. That makes each window O(1) instead of O(k), so the whole scan is O(n).',
    `def max_sum_window(a, k):
    if k > len(a):
        return None
    cur = sum(a[:k])
    best = cur
    for i in range(k, len(a)):
        cur += a[i] - a[i - k]
        best = max(best, cur)
    return best

nums = [1, 12, -5, -6, 50, 3]
print(max_sum_window(nums, 4) / 4)   # 12.75 (max average)`,
    `assert max_sum_window([1,12,-5,-6,50,3], 4) == 51
assert max_sum_window([5], 1) == 5
assert max_sum_window([1,2], 3) is None
assert max_sum_window([-1,-2,-3], 2) == -3`,
    null, 'Time O(n), space O(1)', SW.concat(['#/problem/643']));

  E('longest-substring-no-repeat', 'Longest substring without repeating characters',
    ['longest substring without repeating characters', 'leetcode 3', 'sliding window longest unique substring', 'longest substring with unique chars python', 'sliding window with hash map last seen', 'variable size sliding window example'],
    'longest substring without repeating characters sliding window hash map last index leetcode 3',
    'Slide a window `[l, r]` and remember the last index of each character. When `s[r]` was last seen inside the window, jump `l` to one past that index. The window always holds unique characters; track the maximum length.',
    `def length_of_longest_substring(s):
    last, l, best = {}, 0, 0
    for r, ch in enumerate(s):
        if ch in last and last[ch] >= l:
            l = last[ch] + 1
        last[ch] = r
        best = max(best, r - l + 1)
    return best

print(length_of_longest_substring("abcabcbb"))   # 3`,
    `assert length_of_longest_substring("abcabcbb") == 3
assert length_of_longest_substring("bbbbb") == 1
assert length_of_longest_substring("pwwkew") == 3
assert length_of_longest_substring("") == 0
assert length_of_longest_substring("abba") == 2`,
    '- The `last[ch] >= l` check matters ("abba"): a stale index left of the window must be ignored.', 'Time O(n), space O(min(n, alphabet))', SW.concat(['#/problem/3']));

  E('min-window-substring', 'Minimum window substring',
    ['minimum window substring', 'leetcode 76', 'smallest substring containing all characters of t', 'sliding window with need counts', 'shortest window containing all letters', 'min window substring python'],
    'minimum window substring sliding window need counter missing leetcode 76 shrink expand',
    'Expand the right end until the window covers every needed character (track a `missing` counter), then shrink from the left as far as it stays valid, recording the shortest window. Repeat until the right end reaches the string end.',
    `from collections import Counter

def min_window(s, t):
    need, missing = Counter(t), len(t)
    best, l = (0, float("inf")), 0
    for r, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:
            if r - l < best[1] - best[0]:
                best = (l, r)
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1
            l += 1
    return "" if best[1] == float("inf") else s[best[0]:best[1] + 1]

print(min_window("ADOBECODEBANC", "ABC"))   # BANC`,
    `assert min_window("ADOBECODEBANC", "ABC") == "BANC"
assert min_window("a", "a") == "a"
assert min_window("a", "aa") == ""
assert min_window("aa", "aa") == "aa"`,
    '- A character with `need > 0` is still required; extras drive the count negative, which is how duplicates are handled.', 'Time O(|s| + |t|), space O(alphabet)', SW.concat(['#/problem/76']));

  E('longest-subarray-sum-k', 'Longest subarray with sum at most k (non-negative numbers)',
    ['longest subarray with sum less than or equal to k', 'sliding window variable size sum', 'longest subarray sum at most k', 'shrinking window while sum too large', 'when does sliding window work with sums', 'sliding window vs prefix sum'],
    'longest subarray sum less equal k sliding window variable shrink non negative',
    'With non-negative numbers, growing the window never lowers the sum, so expand right and shrink left while `sum > k`. This is two pointers in O(n). If negatives are allowed the window is not monotonic; use prefix sums with a hash map instead.',
    `def longest_subarray_at_most(a, k):
    l, total, best = 0, 0, 0
    for r, x in enumerate(a):
        total += x
        while total > k:
            total -= a[l]
            l += 1
        best = max(best, r - l + 1)
    return best

print(longest_subarray_at_most([1, 2, 1, 0, 1, 1, 0], 4))   # 5`,
    `assert longest_subarray_at_most([1,2,1,0,1,1,0], 4) == 5
assert longest_subarray_at_most([5,6], 4) == 0
assert longest_subarray_at_most([], 3) == 0`,
    null, 'Time O(n), space O(1)', SW);

  E('at-most-k-distinct', 'Longest substring with at most k distinct characters',
    ['longest substring with at most k distinct characters', 'sliding window k distinct', 'leetcode 340', 'longest substring with two distinct characters', 'fruit into baskets', 'sliding window with counter dict'],
    'at most k distinct characters sliding window counter leetcode 340 159 904 fruit baskets',
    'Expand right, counting characters in a dict. While the dict holds more than k keys, shrink from the left, deleting keys whose count hits zero. Track the longest window. Fruit Into Baskets is the k = 2 case.',
    `from collections import defaultdict

def longest_k_distinct(s, k):
    cnt, l, best = defaultdict(int), 0, 0
    for r, ch in enumerate(s):
        cnt[ch] += 1
        while len(cnt) > k:
            cnt[s[l]] -= 1
            if cnt[s[l]] == 0:
                del cnt[s[l]]
            l += 1
        best = max(best, r - l + 1)
    return best

print(longest_k_distinct("eceba", 2))   # 3 ("ece")`,
    `assert longest_k_distinct("eceba", 2) == 3
assert longest_k_distinct("aa", 1) == 2
assert longest_k_distinct("abc", 0) == 0
assert longest_k_distinct("", 3) == 0`,
    '- "Exactly k" = atMost(k) - atMost(k-1).', 'Time O(n), space O(k)', SW.concat([]));

  E('prefix-sum-range', 'Prefix sums for fast range-sum queries',
    ['prefix sum array', 'range sum query', 'how to compute sum of subarray quickly', 'leetcode 303', 'prefix sum python itertools accumulate', 'what is a prefix sum'],
    'prefix sum range sum query accumulate cumulative leetcode 303 subarray sum',
    'Build `pre` where `pre[i]` is the sum of the first i items. Then the sum of `a[l..r]` (inclusive) is `pre[r+1] - pre[l]` in O(1) after O(n) setup.',
    `from itertools import accumulate

class NumArray:
    def __init__(self, nums):
        self.pre = [0] + list(accumulate(nums))
    def sum_range(self, l, r):
        return self.pre[r + 1] - self.pre[l]

na = NumArray([-2, 0, 3, -5, 2, -1])
print(na.sum_range(0, 2), na.sum_range(2, 5))   # 1 -1`,
    `assert na.sum_range(0, 2) == 1 and na.sum_range(2, 5) == -1
assert na.sum_range(0, 5) == -3
assert NumArray([4]).sum_range(0, 0) == 4`,
    '- The leading 0 removes the l = 0 special case.', 'Setup O(n), query O(1)', PS.concat(['#/problem/303']));

  E('subarray-sum-equals-k', 'Count subarrays with sum equal to k',
    ['subarray sum equals k', 'leetcode 560', 'count subarrays with given sum', 'prefix sum hash map', 'subarray sum with negative numbers', 'number of subarrays that add up to target'],
    'subarray sum equals k prefix sum hash map count leetcode 560 negative numbers',
    'Walk once keeping a running prefix sum. A subarray ending here sums to k when an earlier prefix equals `prefix - k`, so count how many times that prefix has appeared in a dict. Seed the dict with `{0: 1}` for subarrays starting at index 0. Works with negatives.',
    `from collections import defaultdict

def subarray_sum(nums, k):
    seen = defaultdict(int)
    seen[0] = 1
    pre = count = 0
    for x in nums:
        pre += x
        count += seen[pre - k]
        seen[pre] += 1
    return count

print(subarray_sum([1, 1, 1], 2))   # 2`,
    `assert subarray_sum([1,1,1], 2) == 2
assert subarray_sum([1,2,3], 3) == 2
assert subarray_sum([1,-1,0], 0) == 3
assert subarray_sum([], 0) == 0`,
    '- Sliding window fails here because negatives break monotonicity.\n- Same trick: longest subarray with sum k (store first index), subarrays divisible by k (store `prefix % k`).', 'Time O(n), space O(n)', PS.concat(['#/problem/560']));

  E('prefix-sum-2d', '2-D prefix sums (sum of a sub-rectangle)',
    ['2d prefix sum', 'range sum query 2d', 'leetcode 304', 'sum of submatrix in constant time', 'matrix prefix sum python', 'rectangle sum query'],
    '2d prefix sum matrix submatrix rectangle query leetcode 304 inclusion exclusion',
    'Let `P[i][j]` be the sum of the top-left rectangle of size i by j, built with `P[i][j] = m[i-1][j-1] + P[i-1][j] + P[i][j-1] - P[i-1][j-1]`. Then any rectangle is `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`.',
    `class NumMatrix:
    def __init__(self, m):
        R, C = len(m), len(m[0])
        self.P = [[0] * (C + 1) for _ in range(R + 1)]
        for i in range(R):
            for j in range(C):
                self.P[i+1][j+1] = m[i][j] + self.P[i][j+1] + self.P[i+1][j] - self.P[i][j]
    def region(self, r1, c1, r2, c2):
        P = self.P
        return P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]

nm = NumMatrix([[3, 0, 1, 4], [5, 6, 3, 2], [1, 2, 0, 1]])
print(nm.region(1, 1, 2, 2))   # 11`,
    `assert nm.region(1,1,2,2) == 11
assert nm.region(0,0,2,3) == 28
assert nm.region(0,0,0,0) == 3`,
    null, 'Build O(mn), query O(1)', PS.concat(MX, ['#/problem/304']));

  E('difference-array', 'Difference array (many range updates)',
    ['difference array', 'range update add value to subarray', 'apply many range increments efficiently', 'leetcode 370 range addition', 'car pooling difference array', 'imos method'],
    'difference array range update add increment sweep line imos prefix sum leetcode 370 1094',
    'To add v to every element in `[l, r]`, do `diff[l] += v` and `diff[r+1] -= v`. After all updates, one prefix-sum pass over `diff` gives the final array. Each update is O(1) instead of O(length).',
    `from itertools import accumulate

def apply_updates(n, updates):
    diff = [0] * (n + 1)
    for l, r, v in updates:
        diff[l] += v
        diff[r + 1] -= v
    return list(accumulate(diff[:n]))

print(apply_updates(5, [(1, 3, 2), (2, 4, 3), (0, 2, -2)]))   # [-2, 0, 3, 5, 3]`,
    `assert apply_updates(5, [(1,3,2),(2,4,3),(0,2,-2)]) == [-2,0,3,5,3]
assert apply_updates(3, []) == [0,0,0]
assert apply_updates(1, [(0,0,7)]) == [7]`,
    '- It is the inverse of prefix sums. Use it when all updates come before any reads; otherwise use a Fenwick or segment tree.', 'O(n + updates)', PS.concat(['#/topic/fenwick']));

  E('kadane', "Kadane's algorithm (maximum subarray sum)",
    ['kadane algorithm', 'maximum subarray sum', 'leetcode 53', 'largest sum contiguous subarray', 'max subarray python', 'explain kadanes algorithm'],
    'kadane maximum subarray sum contiguous largest sum dp leetcode 53',
    'At each element decide: extend the best subarray ending at the previous element, or start fresh here. `cur = max(x, cur + x)`; the answer is the maximum `cur` seen. It works with negative numbers and needs O(1) space.',
    `def max_subarray(a):
    cur = best = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best

print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))   # 6`,
    `assert max_subarray([-2,1,-3,4,-1,2,1,-5,4]) == 6
assert max_subarray([-3,-1,-2]) == -1
assert max_subarray([5]) == 5`,
    '- Initialise from `a[0]`, not 0, so all-negative arrays return the largest (least negative) element.', 'Time O(n), space O(1)', ['#/topic/kadane', '#/cheatsheets/patterns', '#/problem/53']);

  E('kadane-indices', 'Maximum subarray with start and end indices',
    ['kadane with indices', 'return the subarray with the largest sum', 'find start and end of max subarray', 'maximum subarray print the subarray', 'kadane track indices', 'which subarray has the max sum'],
    'kadane indices start end maximum subarray return subarray track',
    'Track a temporary start index. When starting fresh (`x > cur + x`) set `start = i`; whenever you beat the best, record `(start, i)`. Return the sum and the slice.',
    `def max_subarray_range(a):
    cur = best = a[0]
    start = bs = be = 0
    for i in range(1, len(a)):
        if a[i] > cur + a[i]:
            cur, start = a[i], i
        else:
            cur += a[i]
        if cur > best:
            best, bs, be = cur, start, i
    return best, bs, be

s, i, j = max_subarray_range([-2, 1, -3, 4, -1, 2, 1, -5, 4])
print(s, i, j)   # 6 3 6`,
    `assert (s, i, j) == (6, 3, 6)
assert max_subarray_range([-3,-1,-2]) == (-1, 1, 1)
assert max_subarray_range([7]) == (7, 0, 0)`,
    null, 'Time O(n), space O(1)', ['#/topic/kadane']);

  E('kadane-circular', 'Maximum sum circular subarray',
    ['maximum sum circular subarray', 'leetcode 918', 'kadane on a circular array', 'max subarray wrapping around', 'circular kadane min subarray trick', 'max sum of circular array'],
    'circular subarray kadane wrap around total minus min subarray leetcode 918',
    'The best circular subarray is either a normal one (plain Kadane) or one that wraps, which equals total sum minus the minimum subarray. Answer `max(maxKadane, total - minKadane)`, except when all numbers are negative, where the answer is just `maxKadane`.',
    `def max_circular(a):
    cur_max = cur_min = 0
    best_max, best_min = a[0], a[0]
    total = 0
    for x in a:
        cur_max = max(x, cur_max + x); best_max = max(best_max, cur_max)
        cur_min = min(x, cur_min + x); best_min = min(best_min, cur_min)
        total += x
    return best_max if best_max < 0 else max(best_max, total - best_min)

print(max_circular([5, -3, 5]))   # 10`,
    `assert max_circular([5,-3,5]) == 10
assert max_circular([1,-2,3,-2]) == 3
assert max_circular([-3,-2,-3]) == -2
assert max_circular([3,-1,2,-1]) == 4`,
    null, 'Time O(n), space O(1)', ['#/topic/kadane', '#/problem/918']);

  E('max-product-subarray', 'Maximum product subarray',
    ['maximum product subarray', 'leetcode 152', 'kadane for product', 'max product contiguous subarray', 'why track min and max product', 'product subarray negative numbers'],
    'maximum product subarray kadane min max negative leetcode 152',
    'Track both the largest and the smallest product ending at each position, because multiplying by a negative number swaps them. At each x compute candidates `x`, `hi*x`, `lo*x` and take the max and min for the new pair.',
    `def max_product(a):
    hi = lo = best = a[0]
    for x in a[1:]:
        c = (x, hi * x, lo * x)
        hi, lo = max(c), min(c)
        best = max(best, hi)
    return best

print(max_product([2, 3, -2, 4]))   # 6`,
    `assert max_product([2,3,-2,4]) == 6
assert max_product([-2,0,-1]) == 0
assert max_product([-2,3,-4]) == 24
assert max_product([-3]) == -3`,
    null, 'Time O(n), space O(1)', ['#/topic/kadane', '#/problem/152']);

  E('insert-interval', 'Insert a new interval into a sorted list of intervals',
    ['insert interval', 'leetcode 57', 'insert and merge interval', 'add interval to sorted non overlapping list', 'insert interval in one pass', 'insert interval python'],
    'insert interval merge sorted non overlapping one pass leetcode 57',
    'One pass in three phases: copy intervals that end before the new one starts, merge all that overlap it (take min start and max end), then copy the rest.',
    `def insert_interval(iv, new):
    out, i, n = [], 0, len(iv)
    while i < n and iv[i][1] < new[0]:
        out.append(iv[i]); i += 1
    while i < n and iv[i][0] <= new[1]:
        new = [min(new[0], iv[i][0]), max(new[1], iv[i][1])]
        i += 1
    out.append(new)
    return out + iv[i:]

print(insert_interval([[1, 3], [6, 9]], [2, 5]))   # [[1, 5], [6, 9]]`,
    `assert insert_interval([[1,3],[6,9]], [2,5]) == [[1,5],[6,9]]
assert insert_interval([], [5,7]) == [[5,7]]
assert insert_interval([[1,5]], [2,3]) == [[1,5]]
assert insert_interval([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]) == [[1,2],[3,10],[12,16]]`,
    null, 'Time O(n), space O(n)', IV.concat(['#/problem/57']));

  E('interval-overlap-check', 'How to check whether two intervals overlap',
    ['do two intervals overlap', 'check if two ranges overlap', 'interval overlap condition', 'overlap of two intervals intersection', 'how to know if intervals intersect', 'range overlap formula'],
    'interval overlap intersect condition start end two ranges intersection touching',
    'Intervals `[a1, a2]` and `[b1, b2]` overlap exactly when `a1 <= b2 and b1 <= a2` (closed) or `a1 < b2 and b1 < a2` (half-open, touching ends allowed). The intersection is `[max(a1, b1), min(a2, b2)]` when that is valid.',
    `def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1]

def intersection(a, b):
    lo, hi = max(a[0], b[0]), min(a[1], b[1])
    return [lo, hi] if lo <= hi else None

print(overlaps([1, 5], [5, 8]), intersection([1, 5], [3, 9]))   # True [3, 5]`,
    `assert overlaps([1,5],[5,8]) and not overlaps([1,2],[3,4])
assert intersection([1,5],[3,9]) == [3,5]
assert intersection([1,2],[3,4]) is None`,
    '- Decide up front whether touching endpoints count. Meeting-room problems say `[1,5]` and `[5,8]` do not conflict, which means half-open.', 'O(1)', IV);

  E('meeting-rooms', 'Can a person attend all meetings? (meeting rooms I)',
    ['meeting rooms', 'can attend all meetings', 'leetcode 252', 'check if any meetings overlap', 'detect overlapping intervals', 'meeting rooms i python'],
    'meeting rooms attend overlap sort start intervals leetcode 252',
    'Sort meetings by start time and check neighbours: if any meeting starts before the previous one ends, there is a conflict. Equal end and start times are fine.',
    `def can_attend(meetings):
    meetings = sorted(meetings)
    return all(meetings[i][0] >= meetings[i - 1][1] for i in range(1, len(meetings)))

print(can_attend([[0, 30], [5, 10], [15, 20]]), can_attend([[7, 10], [2, 4]]))   # False True`,
    `assert not can_attend([[0,30],[5,10],[15,20]])
assert can_attend([[7,10],[2,4]])
assert can_attend([]) and can_attend([[1,2],[2,3]])`,
    null, 'Time O(n log n)', IV.concat(['#/problem/252']));

  E('meeting-rooms-min', 'Minimum number of meeting rooms (meeting rooms II)',
    ['meeting rooms ii', 'minimum number of meeting rooms', 'leetcode 253', 'max overlapping intervals', 'minimum platforms railway', 'how many rooms are needed'],
    'meeting rooms ii minimum rooms heap sweep line max overlap leetcode 253 platforms',
    'The answer is the maximum number of meetings running at once. Sort the start times and the end times separately; walk the starts, and whenever a start is before the earliest remaining end, a new room is needed, otherwise a room is freed and reused.',
    `def min_meeting_rooms(iv):
    starts = sorted(s for s, _ in iv)
    ends = sorted(e for _, e in iv)
    rooms = j = 0
    for s in starts:
        if s < ends[j]:
            rooms += 1
        else:
            j += 1
    return rooms

print(min_meeting_rooms([[0, 30], [5, 10], [15, 20]]))   # 2`,
    `assert min_meeting_rooms([[0,30],[5,10],[15,20]]) == 2
assert min_meeting_rooms([[7,10],[2,4]]) == 1
assert min_meeting_rooms([[1,5],[5,9]]) == 1
assert min_meeting_rooms([[1,5],[1,5],[1,5]]) == 3
assert min_meeting_rooms([]) == 0`,
    '- Alternative: sort by start and keep a min-heap of end times; pop when the earliest end is `<=` the new start.', 'Time O(n log n), space O(n)', IV.concat(['#/problem/253']));

  E('min-arrows', 'Minimum number of arrows to burst balloons',
    ['minimum number of arrows to burst balloons', 'leetcode 452', 'minimum points to stab all intervals', 'greedy interval stabbing', 'burst balloons arrows greedy', 'fewest points covering all intervals'],
    'minimum arrows balloons interval greedy sort by end stabbing leetcode 452',
    'Sort balloons by end coordinate. Shoot an arrow at the first balloon end; every balloon whose start is `<=` that position bursts too. When a balloon starts after the arrow, shoot a new arrow at its end.',
    `def find_min_arrows(points):
    arrows, pos = 0, None
    for s, e in sorted(points, key=lambda p: p[1]):
        if pos is None or s > pos:
            arrows += 1
            pos = e
    return arrows

print(find_min_arrows([[10, 16], [2, 8], [1, 6], [7, 12]]))   # 2`,
    `assert find_min_arrows([[10,16],[2,8],[1,6],[7,12]]) == 2
assert find_min_arrows([[1,2],[3,4],[5,6],[7,8]]) == 4
assert find_min_arrows([[1,2],[2,3],[3,4],[4,5]]) == 2
assert find_min_arrows([]) == 0`,
    '- Touching balloons share an arrow (`s > pos` is strict).', 'Time O(n log n)', IV.concat(['#/topic/greedy', '#/problem/452']));

  E('non-overlapping-intervals', 'Non-overlapping intervals (minimum removals)',
    ['non overlapping intervals', 'leetcode 435', 'minimum intervals to remove so none overlap', 'activity selection problem', 'maximum number of non overlapping intervals', 'interval scheduling greedy'],
    'non overlapping intervals erase activity selection interval scheduling greedy earliest end leetcode 435',
    'Greedy: sort by end time and keep an interval whenever it starts at or after the last kept end; otherwise count it as a removal. Choosing the earliest finish leaves the most room for later intervals.',
    `def erase_overlap(iv):
    removed, end = 0, float("-inf")
    for s, e in sorted(iv, key=lambda x: x[1]):
        if s >= end:
            end = e
        else:
            removed += 1
    return removed

print(erase_overlap([[1, 2], [2, 3], [3, 4], [1, 3]]))   # 1`,
    `assert erase_overlap([[1,2],[2,3],[3,4],[1,3]]) == 1
assert erase_overlap([[1,2],[1,2],[1,2]]) == 2
assert erase_overlap([[1,2],[2,3]]) == 0
assert erase_overlap([]) == 0`,
    '- Sorting by start does not give the greedy guarantee; sort by end.', 'Time O(n log n)', IV.concat(['#/topic/greedy', '#/problem/435']));

  E('cyclic-sort', 'Cyclic sort (place numbers 1..n at their index)',
    ['cyclic sort', 'cyclic sort pattern', 'sort array of 1 to n in place in o(n)', 'put each number in its correct index', 'when to use cyclic sort', 'cyclic sort python'],
    'cyclic sort pattern index swap range 1 to n in place linear missing duplicate',
    'If values are in `1..n`, value v belongs at index `v-1`. Keep swapping `a[i]` into its home until the item at i is correct (or a duplicate), then advance. Every swap places one value permanently, so it is O(n).',
    `def cyclic_sort(a):
    i = 0
    while i < len(a):
        j = a[i] - 1
        if a[i] != a[j]:
            a[i], a[j] = a[j], a[i]
        else:
            i += 1
    return a

print(cyclic_sort([3, 1, 5, 4, 2]))   # [1, 2, 3, 4, 5]`,
    `assert cyclic_sort([3,1,5,4,2]) == [1,2,3,4,5]
assert cyclic_sort([2,1]) == [1,2] and cyclic_sort([1]) == [1]
assert cyclic_sort([]) == []`,
    '- `a[i] != a[j]` (not `i != j`) also stops cleanly on duplicates.\n- Foundation of first missing positive, find all duplicates and missing numbers.', 'Time O(n), space O(1)', AH);

  E('missing-number', 'Find the missing number in 0..n',
    ['find the missing number', 'leetcode 268', 'missing number in array of n distinct numbers', 'missing number xor', 'find missing number sum formula', 'first missing positive'],
    'missing number xor sum formula cyclic sort leetcode 268 41 first missing positive',
    'For distinct numbers from `0..n` with one missing, the answer is `n*(n+1)//2 - sum(nums)`, or XOR all indices and values together. For the first missing positive (LC 41), use cyclic sort to place v at index v-1 and scan for the first mismatch.',
    `def missing_number(nums):
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)

def first_missing_positive(a):
    n = len(a)
    for i in range(n):
        while 1 <= a[i] <= n and a[a[i] - 1] != a[i]:
            j = a[i] - 1
            a[i], a[j] = a[j], a[i]
    for i in range(n):
        if a[i] != i + 1:
            return i + 1
    return n + 1

print(missing_number([3, 0, 1]), first_missing_positive([3, 4, -1, 1]))   # 2 2`,
    `assert missing_number([3,0,1]) == 2 and missing_number([0]) == 1 and missing_number([1]) == 0
assert first_missing_positive([3,4,-1,1]) == 2
assert first_missing_positive([1,2,0]) == 3
assert first_missing_positive([7,8,9]) == 1`,
    null, 'Time O(n), space O(1)', AH.concat(['#/problem/268']));

  E('find-duplicate-floyd', 'Find the duplicate number without extra space (Floyd cycle)',
    ['find the duplicate number', 'leetcode 287', 'duplicate number floyd cycle detection', 'find duplicate without modifying array', 'tortoise and hare array duplicate', 'find duplicate in array of n+1 integers'],
    'find duplicate number floyd tortoise hare cycle detection leetcode 287 array as linked list',
    'With n+1 values in `1..n`, treat `i -> nums[i]` as a linked list; the duplicate is where the cycle begins. Run slow/fast pointers until they meet, then restart one pointer from 0 and move both one step at a time: they meet at the duplicate.',
    `def find_duplicate(nums):
    slow = fast = 0
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = 0
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow

print(find_duplicate([1, 3, 4, 2, 2]))   # 2`,
    `assert find_duplicate([1,3,4,2,2]) == 2
assert find_duplicate([3,1,3,4,2]) == 3
assert find_duplicate([1,1]) == 1
assert find_duplicate([2,2,2,2,2]) == 2`,
    '- O(1) space and does not modify the input, unlike cyclic sort or marking by negation.', 'Time O(n), space O(1)', ['#/topic/linked-lists', '#/problem/287']);

  E('find-duplicate-set', 'Detect or find duplicates with a set',
    ['check if list has duplicates', 'contains duplicate', 'leetcode 217', 'find the first duplicate in an array', 'python detect duplicates in list', 'find all duplicates in an array'],
    'contains duplicate set hash seen first duplicate leetcode 217 442 find all duplicates',
    'Walk the list keeping a `seen` set; a value already in the set is a duplicate. For a yes/no answer on a list, `len(set(a)) != len(a)`. This is O(n) time and O(n) space; sort first if you must use O(1) extra space.',
    `def has_duplicate(a):
    return len(set(a)) != len(a)

def first_duplicate(a):
    seen = set()
    for x in a:
        if x in seen:
            return x
        seen.add(x)
    return None

def all_duplicates(a):                 # values in 1..n, O(1) extra space by sign marking
    out = []
    for x in a:
        i = abs(x) - 1
        if a[i] < 0:
            out.append(abs(x))
        else:
            a[i] = -a[i]
    return out

print(has_duplicate([1, 2, 3, 1]), first_duplicate([2, 1, 3, 1, 2]))   # True 1`,
    `assert has_duplicate([1,2,3,1]) and not has_duplicate([])
assert first_duplicate([2,1,3,1,2]) == 1 and first_duplicate([1,2]) is None
assert sorted(all_duplicates([4,3,2,7,8,2,3,1])) == [2,3]`,
    null, 'Time O(n), space O(n)', AH.concat(['#/problem/217']));

  E('set-mismatch', 'Find the duplicate and the missing number together',
    ['find duplicate and missing number', 'set mismatch', 'leetcode 645', 'one number repeated one missing', 'find missing and repeating number', 'missing and duplicate in array 1 to n'],
    'set mismatch duplicate missing repeated number cyclic sort leetcode 645',
    'Cyclic-sort the values so that each v sits at index v-1. The one index where `a[i] != i+1` holds the duplicate, and `i+1` is the missing number.',
    `def find_error_nums(nums):
    a = nums[:]
    i = 0
    while i < len(a):
        j = a[i] - 1
        if a[i] != a[j]:
            a[i], a[j] = a[j], a[i]
        else:
            i += 1
    for i, v in enumerate(a):
        if v != i + 1:
            return [v, i + 1]      # [duplicate, missing]

print(find_error_nums([1, 2, 2, 4]))   # [2, 3]`,
    `assert find_error_nums([1,2,2,4]) == [2,3]
assert find_error_nums([1,1]) == [1,2]
assert find_error_nums([3,2,3,4,6,5]) == [3,1]`,
    null, 'Time O(n), space O(1)', AH.concat([]));

  E('majority-element', 'Majority element (Boyer-Moore voting)',
    ['majority element', 'boyer moore majority vote', 'leetcode 169', 'find element appearing more than n/2 times', 'majority element o(1) space', 'moore voting algorithm'],
    'majority element boyer moore voting candidate count more than half leetcode 169 229',
    'Keep a candidate and a count: if count is 0 take the current number as candidate; add 1 when you see the candidate, subtract 1 otherwise. If a majority (> n/2) exists, the candidate at the end is it, because every non-majority element can cancel at most one majority element.',
    `def majority_element(nums):
    cand, count = None, 0
    for x in nums:
        if count == 0:
            cand = x
        count += 1 if x == cand else -1
    return cand

print(majority_element([2, 2, 1, 1, 1, 2, 2]))   # 2`,
    `assert majority_element([2,2,1,1,1,2,2]) == 2
assert majority_element([3,2,3]) == 3
assert majority_element([7]) == 7`,
    '- If a majority is not guaranteed, do a second pass counting the candidate to confirm.\n- For "more than n/3" keep two candidates.', 'Time O(n), space O(1)', AH.concat(['#/problem/169']));

  E('reservoir-sampling', 'Reservoir sampling (random item from a stream)',
    ['reservoir sampling', 'pick a random element from a stream of unknown length', 'sample k items from a stream', 'random node from linked list', 'uniform sampling without knowing n', 'leetcode 382'],
    'reservoir sampling random stream unknown length uniform k items algorithm r leetcode 382 398',
    'Keep the first k items. For the i-th item (0-indexed, i >= k) pick a random j in `[0, i]`; if `j < k`, replace `reservoir[j]` with the item. Every item ends up in the sample with probability k/n, and you only hold k items in memory.',
    `import random

def reservoir_sample(stream, k):
    res = []
    for i, x in enumerate(stream):
        if i < k:
            res.append(x)
        else:
            j = random.randint(0, i)
            if j < k:
                res[j] = x
    return res

print(reservoir_sample(range(100), 3))   # three values, uniformly chosen`,
    `from collections import Counter
assert len(reservoir_sample(range(100), 3)) == 3
assert sorted(reservoir_sample([1,2], 5)) == [1,2]
c = Counter(reservoir_sample(range(4), 1)[0] for _ in range(2000))
assert all(350 < c[v] < 650 for v in range(4))`,
    '- For k = 1: replace the pick with probability 1/i when the i-th (1-indexed) item arrives.', 'Time O(n), space O(k)', AH);

  E('fisher-yates', 'Fisher-Yates shuffle',
    ['how to shuffle an array', 'fisher yates shuffle', 'shuffle a list python', 'leetcode 384 shuffle an array', 'random permutation in place', 'uniform random shuffle algorithm'],
    'fisher yates knuth shuffle random permutation in place uniform leetcode 384 random.shuffle',
    'Walk from the end to the start; swap `a[i]` with `a[j]` where j is a random index in `[0, i]`. This gives every permutation with equal probability in O(n). In Python just call `random.shuffle(a)`.',
    `import random

def shuffle(a):
    for i in range(len(a) - 1, 0, -1):
        j = random.randint(0, i)         # inclusive on both ends
        a[i], a[j] = a[j], a[i]
    return a

print(shuffle([1, 2, 3, 4, 5]))`,
    `x = list(range(10))
assert sorted(shuffle(x[:])) == x
assert shuffle([]) == [] and shuffle([1]) == [1]
from collections import Counter
c = Counter(tuple(shuffle([1,2,3])) for _ in range(6000))
assert len(c) == 6 and all(800 < v < 1200 for v in c.values())`,
    '- Common bug: picking j from the whole array (`randint(0, n-1)`) every time is biased (n^n paths cannot map evenly onto n! permutations).', 'Time O(n), space O(1)', AH);

  E('rotate-array', 'Rotate an array by k steps',
    ['rotate array', 'leetcode 189', 'rotate array to the right by k', 'rotate list python in place', 'rotate array reverse trick', 'rotate left by k'],
    'rotate array k steps right left reverse three times in place leetcode 189 modulo slice',
    'To rotate right by k: take `k %= n`, reverse the whole array, then reverse the first k items and the remaining n-k items. It is in place with O(1) extra space. In Python the slice form is `a[:] = a[-k:] + a[:-k]`.',
    `def rotate(a, k):
    n = len(a)
    if n == 0:
        return a
    k %= n
    def rev(l, r):
        while l < r:
            a[l], a[r] = a[r], a[l]
            l += 1; r -= 1
    rev(0, n - 1); rev(0, k - 1); rev(k, n - 1)
    return a

print(rotate([1, 2, 3, 4, 5, 6, 7], 3))   # [5, 6, 7, 1, 2, 3, 4]`,
    `assert rotate([1,2,3,4,5,6,7], 3) == [5,6,7,1,2,3,4]
assert rotate([1,2], 5) == [2,1]
assert rotate([], 3) == [] and rotate([1], 0) == [1]
assert rotate([1,2,3], 3) == [1,2,3]`,
    '- Rotate left by k = rotate right by `n - k`.', 'Time O(n), space O(1)', AH.concat([]));

  E('reverse-in-place', 'Reverse an array or string in place',
    ['reverse an array in place', 'reverse a list python', 'reverse a string', 'reverse string in place two pointers', 'leetcode 344', 'flip a list around'],
    'reverse array list string in place two pointers swap slice reversed leetcode 344',
    'Swap the two ends and move inward until the pointers meet. In Python use `a.reverse()` (in place), `a[::-1]` (copy) or `reversed(a)` (iterator); strings are immutable, so `s[::-1]` makes a new string.',
    `def reverse_in_place(a):
    l, r = 0, len(a) - 1
    while l < r:
        a[l], a[r] = a[r], a[l]
        l += 1; r -= 1
    return a

print(reverse_in_place(list("hello")))   # ['o', 'l', 'l', 'e', 'h']
print("hello"[::-1], list(reversed([1, 2, 3])))   # olleh [3, 2, 1]`,
    `assert reverse_in_place([1,2,3]) == [3,2,1]
assert reverse_in_place([]) == [] and reverse_in_place([1,2]) == [2,1]
assert "".join(reverse_in_place(list("abcd"))) == "dcba"`,
    null, 'Time O(n), space O(1)', TP);

  E('rotate-matrix', 'Rotate an image / matrix by 90 degrees in place',
    ['rotate matrix 90 degrees', 'rotate image', 'leetcode 48', 'rotate a square matrix in place', 'rotate matrix clockwise python', 'rotate matrix counterclockwise'],
    'rotate matrix image 90 degrees clockwise transpose reverse rows in place leetcode 48',
    'Clockwise 90 degrees = transpose, then reverse every row. Counter-clockwise = transpose, then reverse the order of the rows. Both are in place for a square matrix.',
    `def rotate_clockwise(m):
    n = len(m)
    for i in range(n):
        for j in range(i + 1, n):
            m[i][j], m[j][i] = m[j][i], m[i][j]
    for row in m:
        row.reverse()
    return m

print(rotate_clockwise([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))   # [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
# one-liner copy: [list(r) for r in zip(*m[::-1])]`,
    `assert rotate_clockwise([[1,2,3],[4,5,6],[7,8,9]]) == [[7,4,1],[8,5,2],[9,6,3]]
assert rotate_clockwise([[1]]) == [[1]]
assert rotate_clockwise([[1,2],[3,4]]) == [[3,1],[4,2]]
m = [[1,2],[3,4]]; assert [list(r) for r in zip(*m[::-1])] == [[3,1],[4,2]]`,
    null, 'Time O(n^2), space O(1)', MX.concat(['#/problem/48']));

  E('spiral-matrix', 'Spiral order traversal of a matrix',
    ['spiral matrix', 'leetcode 54', 'print matrix in spiral order', 'traverse a matrix in a spiral', 'spiral order python', 'clockwise spiral traversal'],
    'spiral matrix traversal boundaries top bottom left right layer leetcode 54 59',
    'Keep four boundaries (top, bottom, left, right). Walk the top row left-to-right, the right column downward, then the bottom row and left column backwards, shrinking the boundary after each side and checking they have not crossed.',
    `def spiral_order(m):
    if not m:
        return []
    top, bot, left, right = 0, len(m) - 1, 0, len(m[0]) - 1
    out = []
    while top <= bot and left <= right:
        out += m[top][left:right + 1]
        top += 1
        for i in range(top, bot + 1):
            out.append(m[i][right])
        right -= 1
        if top <= bot:
            out += m[bot][left:right + 1][::-1]
            bot -= 1
        if left <= right:
            for i in range(bot, top - 1, -1):
                out.append(m[i][left])
            left += 1
    return out

print(spiral_order([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))   # [1, 2, 3, 6, 9, 8, 7, 4, 5]`,
    `assert spiral_order([[1,2,3],[4,5,6],[7,8,9]]) == [1,2,3,6,9,8,7,4,5]
assert spiral_order([[1,2,3,4],[5,6,7,8],[9,10,11,12]]) == [1,2,3,4,8,12,11,10,9,5,6,7]
assert spiral_order([[1],[2],[3]]) == [1,2,3]
assert spiral_order([[1,2,3]]) == [1,2,3]
assert spiral_order([]) == []`,
    '- The two `if` guards prevent re-visiting a row or column in single-row or single-column leftovers.', 'Time O(mn), space O(1) beyond output', MX.concat(['#/problem/54']));

  E('transpose-matrix', 'Transpose a matrix',
    ['transpose a matrix', 'matrix transpose python', 'swap rows and columns', 'leetcode 867', 'zip star transpose', 'transpose non square matrix'],
    'transpose matrix rows columns zip star swap leetcode 867',
    'In Python, `[list(r) for r in zip(*m)]` transposes any rectangular matrix. For a square matrix in place, swap `m[i][j]` with `m[j][i]` for `j > i`. A rectangular matrix needs a new matrix of shape (cols, rows).',
    `def transpose(m):
    return [list(r) for r in zip(*m)]

def transpose_square(m):
    for i in range(len(m)):
        for j in range(i + 1, len(m)):
            m[i][j], m[j][i] = m[j][i], m[i][j]
    return m

print(transpose([[1, 2, 3], [4, 5, 6]]))   # [[1, 4], [2, 5], [3, 6]]`,
    `assert transpose([[1,2,3],[4,5,6]]) == [[1,4],[2,5],[3,6]]
assert transpose([[1]]) == [[1]]
assert transpose_square([[1,2],[3,4]]) == [[1,3],[2,4]]`,
    null, 'Time O(mn)', MX.concat(['#/problem/867']));

  E('set-matrix-zeroes', 'Set matrix zeroes',
    ['set matrix zeroes', 'leetcode 73', 'zero out row and column when element is zero', 'matrix zeroes in place', 'make rows and columns zero', 'set zeroes python'],
    'set matrix zeroes row column zero in place markers leetcode 73',
    'First scan and record which rows and columns contain a zero, then zero those rows and columns in a second pass. Doing it in one pass would turn new zeros into false triggers. Recording in two sets costs O(m + n) space; the O(1) version stores the markers in the first row and column.',
    `def set_zeroes(m):
    rows = {i for i, r in enumerate(m) if 0 in r}
    cols = {j for r in m for j, v in enumerate(r) if v == 0}
    for i in range(len(m)):
        for j in range(len(m[0])):
            if i in rows or j in cols:
                m[i][j] = 0
    return m

print(set_zeroes([[1, 1, 1], [1, 0, 1], [1, 1, 1]]))   # [[1, 0, 1], [0, 0, 0], [1, 0, 1]]`,
    `assert set_zeroes([[1,1,1],[1,0,1],[1,1,1]]) == [[1,0,1],[0,0,0],[1,0,1]]
assert set_zeroes([[0,1,2,0],[3,4,5,2],[1,3,1,5]]) == [[0,0,0,0],[0,4,5,0],[0,3,1,0]]
assert set_zeroes([[1]]) == [[1]]`,
    null, 'Time O(mn), space O(m + n)', MX.concat(['#/problem/73']));

  E('valid-anagram', 'Check if two strings are anagrams',
    ['valid anagram', 'check anagram python', 'are two strings anagrams', 'leetcode 242', 'anagram check with counter', 'anagram without sorting'],
    'valid anagram counter sorted letters frequency leetcode 242 compare',
    'Two strings are anagrams if they have the same character counts. Compare `Counter(a) == Counter(b)` (O(n)) or `sorted(a) == sorted(b)` (O(n log n)). Different lengths can never match.',
    `from collections import Counter

def is_anagram(a, b):
    return len(a) == len(b) and Counter(a) == Counter(b)

print(is_anagram("listen", "silent"), is_anagram("rat", "car"))   # True False`,
    `assert is_anagram("listen","silent") and not is_anagram("rat","car")
assert is_anagram("","") and not is_anagram("a","ab")
assert sorted("anagram") == sorted("nagaram")`,
    '- For lowercase letters only, a 26-int array is faster than a Counter.', 'Time O(n), space O(alphabet)', AH.concat(['#/problem/242']));

  E('group-anagrams', 'Group anagrams',
    ['group anagrams', 'leetcode 49', 'group words that are anagrams', 'anagram groups python defaultdict', 'hash key for anagrams', 'group strings by letters'],
    'group anagrams hash map sorted key tuple count leetcode 49 defaultdict',
    'Give every word a canonical key that is equal for anagrams, and bucket words in a dict by that key. The key is the sorted string (`"".join(sorted(w))`, O(k log k)) or a 26-count tuple (O(k)).',
    `from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())

print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
# [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]`,
    `r = group_anagrams(["eat","tea","tan","ate","nat","bat"])
assert sorted(map(sorted, r)) == [["ate","eat","tea"],["bat"],["nat","tan"]]
assert group_anagrams([""]) == [[""]]
assert group_anagrams([]) == []`,
    null, 'Time O(n k log k), space O(nk)', AH.concat(['#/problem/49']));

  E('longest-common-prefix', 'Longest common prefix of strings',
    ['longest common prefix', 'leetcode 14', 'common prefix of a list of strings', 'longest common prefix python', 'shared prefix of words', 'find common prefix'],
    'longest common prefix strings zip min max leetcode 14 vertical scan',
    'Compare characters column by column using `zip(*words)` and stop at the first column where they differ. A neat alternative: the common prefix of `min(words)` and `max(words)` (lexicographic extremes) is the prefix of all.',
    `def longest_common_prefix(words):
    out = []
    for chars in zip(*words):
        if len(set(chars)) != 1:
            break
        out.append(chars[0])
    return "".join(out)

print(longest_common_prefix(["flower", "flow", "flight"]))   # fl`,
    `assert longest_common_prefix(["flower","flow","flight"]) == "fl"
assert longest_common_prefix(["dog","racecar","car"]) == ""
assert longest_common_prefix([]) == "" and longest_common_prefix(["a"]) == "a"`,
    null, 'Time O(total characters)', AH.concat(['#/problem/14']));

  E('reverse-words', 'Reverse the words in a sentence',
    ['reverse words in a string', 'reverse words in a sentence python', 'leetcode 151', 'reverse word order', 'reverse each word in a string', 'flip the order of words'],
    'reverse words sentence split join string leetcode 151 557 whitespace',
    'Use `" ".join(s.split()[::-1])`. `split()` with no argument also drops extra spaces. To reverse the letters inside each word but keep the word order, use `" ".join(w[::-1] for w in s.split(" "))`.',
    `def reverse_words(s):
    return " ".join(s.split()[::-1])

def reverse_each_word(s):
    return " ".join(w[::-1] for w in s.split(" "))

print(reverse_words("  the sky   is blue "))    # blue is sky the
print(reverse_each_word("Let's take LeetCode"))  # s'teL ekat edoCteeL`,
    `assert reverse_words("  the sky   is blue ") == "blue is sky the"
assert reverse_words("") == "" and reverse_words("a") == "a"
assert reverse_each_word("ab cd") == "ba dc"`,
    null, 'Time O(n), space O(n)', AH);

  E('string-compression', 'String compression (run-length encoding)',
    ['string compression', 'run length encoding python', 'leetcode 443', 'compress repeated characters', 'aaabb to a3b2', 'rle encode and decode'],
    'string compression run length encoding rle groupby repeated characters leetcode 443 decode',
    'Walk through the string counting each run of equal characters and emit the character plus the count (omit a count of 1). Use `itertools.groupby` for a short version. Decoding is the reverse: read a letter, then its number.',
    `from itertools import groupby
import re

def compress(s):
    out = []
    for ch, grp in groupby(s):
        n = len(list(grp))
        out.append(ch + (str(n) if n > 1 else ""))
    return "".join(out)

def decompress(s):
    return "".join(ch * int(n or 1) for ch, n in re.findall(r"(\\D)(\\d*)", s))

print(compress("aabcccccaaa"))   # a2bc5a3`,
    `assert compress("aabcccccaaa") == "a2bc5a3"
assert compress("") == "" and compress("abc") == "abc"
assert decompress("a2bc5a3") == "aabcccccaaa"
assert decompress(compress("zzzzzzzzzzzz")) == "zzzzzzzzzzzz"`,
    '- LC 443 compresses a char array in place with two pointers (read/write) and returns the new length.', 'Time O(n)', AH.concat([]));

  E('count-and-say', 'Count and say sequence',
    ['count and say', 'leetcode 38', 'look and say sequence', 'count and say python', 'how does count and say work', 'run length description generator'],
    'count and say look and say sequence groupby run length leetcode 38',
    'Start from "1". Each next term reads the previous one aloud by grouping equal digits: for each run write its length followed by the digit. "1" becomes "11", then "21", "1211", "111221".',
    `from itertools import groupby

def count_and_say(n):
    s = "1"
    for _ in range(n - 1):
        s = "".join(str(len(list(g))) + d for d, g in groupby(s))
    return s

print([count_and_say(i) for i in range(1, 6)])   # ['1', '11', '21', '1211', '111221']`,
    `assert [count_and_say(i) for i in range(1,6)] == ['1','11','21','1211','111221']
assert count_and_say(6) == '312211'`,
    null, 'O(total output length)', AH.concat([]));

  E('top-k-frequent', 'Top k frequent elements',
    ['top k frequent elements', 'leetcode 347', 'most common elements in a list', 'k most frequent words', 'counter most_common python', 'bucket sort by frequency'],
    'top k frequent elements counter most_common heap bucket sort frequency leetcode 347 692',
    'Count with `Counter`, then take the k largest counts. `Counter(nums).most_common(k)` is the one-liner (heap based, O(n log k)). For true O(n), bucket values by frequency (index = count) and read the buckets from high to low.',
    `from collections import Counter

def top_k_frequent(nums, k):
    freq = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for v, c in freq.items():
        buckets[c].append(v)
    out = []
    for c in range(len(buckets) - 1, 0, -1):
        for v in buckets[c]:
            out.append(v)
            if len(out) == k:
                return out
    return out

print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))   # [1, 2]
print([v for v, _ in Counter([1, 1, 1, 2, 2, 3]).most_common(2)])`,
    `assert top_k_frequent([1,1,1,2,2,3], 2) == [1,2]
assert top_k_frequent([1], 1) == [1]
assert top_k_frequent([4,4,5,5,6], 1) in ([4],[5])
assert top_k_frequent([], 1) == []`,
    null, 'Time O(n) with buckets, O(n log k) with a heap', ['#/topic/heaps', '#/topic/arrays-hashing', '#/problem/347']);

  E('product-except-self', 'Product of array except self',
    ['product of array except self', 'leetcode 238', 'product except self without division', 'prefix and suffix products', 'array of products excluding current element', 'product except self o(1) space'],
    'product of array except self prefix suffix products no division leetcode 238',
    'The answer at i is (product of everything left of i) times (product of everything right of i). Fill `out` with left products in one pass, then sweep from the right multiplying in a running suffix product. No division, O(1) extra space beyond the output.',
    `def product_except_self(nums):
    n = len(nums)
    out = [1] * n
    left = 1
    for i in range(n):
        out[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= nums[i]
    return out

print(product_except_self([1, 2, 3, 4]))   # [24, 12, 8, 6]`,
    `assert product_except_self([1,2,3,4]) == [24,12,8,6]
assert product_except_self([-1,1,0,-3,3]) == [0,0,9,0,0]
assert product_except_self([2,3]) == [3,2]`,
    '- Division fails with zeros, which is why the prefix/suffix split is preferred.', 'Time O(n), space O(1) extra', AH.concat(['#/topic/prefix-sums', '#/problem/238']));

  E('two-sum-hashmap', 'Two sum with a hash map',
    ['two sum', 'leetcode 1', 'two sum python hash map', 'find two numbers that add up to target', 'complement lookup hash map', 'two sum unsorted array'],
    'two sum hash map complement target indices unsorted leetcode 1 dictionary',
    'For each number, check whether `target - x` is already in a dict of value-to-index; if so return both indices, otherwise store the current number. One pass, O(n). Use the two-pointer version only if the array is sorted.',
    `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

print(two_sum([2, 7, 11, 15], 9))   # [0, 1]`,
    `assert two_sum([2,7,11,15], 9) == [0,1]
assert two_sum([3,3], 6) == [0,1]
assert two_sum([3,2,4], 6) == [1,2]
assert two_sum([1,2], 10) == []`,
    '- Check before inserting so an element cannot pair with itself.\n- Extends to "count pairs", 3Sum (fix one, hash the rest) and subarray sum problems.', 'Time O(n), space O(n)', AH.concat(['#/problem/1']));

  E('binary-search-first-bad', 'Find the first bad version / first True in a monotonic predicate',
    ['first bad version', 'leetcode 278', 'find the first true in a sorted boolean sequence', 'binary search with api call', 'smallest index where condition becomes true', 'binary search on a predicate'],
    'first bad version predicate monotonic false true boundary binary search leetcode 278',
    'When values go False, False, ..., True, True, the first True is found by keeping `hi` as a known-True candidate: if `is_bad(mid)` set `hi = mid`, else `lo = mid + 1`. The loop ends with `lo == hi` at the first bad one, using only O(log n) calls.',
    `def first_bad(n, is_bad):
    lo, hi = 1, n
    while lo < hi:
        mid = (lo + hi) // 2
        if is_bad(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

print(first_bad(10, lambda v: v >= 4))   # 4`,
    `assert first_bad(10, lambda v: v >= 4) == 4
assert first_bad(1, lambda v: True) == 1
assert first_bad(5, lambda v: v >= 5) == 5`,
    null, 'O(log n) calls', BS.concat([]));

  E('sorted-squares', 'Squares of a sorted array (two pointers)',
    ['squares of a sorted array', 'leetcode 977', 'sorted squares with negative numbers', 'square and sort in linear time', 'two pointers largest square first', 'sort squares of sorted array'],
    'sorted squares two pointers negative absolute value leetcode 977 linear',
    'The largest square is at one of the two ends. Use two pointers on the ends, put the larger square at the back of the result, and move that pointer inward. This is O(n) instead of O(n log n) from squaring and sorting.',
    `def sorted_squares(a):
    n = len(a)
    out = [0] * n
    l, r = 0, n - 1
    for k in range(n - 1, -1, -1):
        if abs(a[l]) > abs(a[r]):
            out[k] = a[l] * a[l]; l += 1
        else:
            out[k] = a[r] * a[r]; r -= 1
    return out

print(sorted_squares([-4, -1, 0, 3, 10]))   # [0, 1, 9, 16, 100]`,
    `assert sorted_squares([-4,-1,0,3,10]) == [0,1,9,16,100]
assert sorted_squares([-7,-3,2,3,11]) == [4,9,9,49,121]
assert sorted_squares([]) == [] and sorted_squares([-2]) == [4]`,
    null, 'Time O(n), space O(n)', TP.concat(['#/problem/977']));

  E('sort-custom-key', 'Sort by multiple keys or a custom comparator in Python',
    ['sort list of tuples by second element', 'sort by multiple keys python', 'custom comparator in python sort', 'sort descending by one key and ascending by another', 'cmp_to_key python', 'largest number sort strings'],
    'sort key lambda tuple multiple keys comparator cmp_to_key descending ascending largest number leetcode 179',
    'Pass `key=` returning a tuple; negate numeric parts to sort them descending. For orderings that cannot be a key (like "which concatenation is bigger", LC 179) use `functools.cmp_to_key` with a comparator returning negative, zero or positive.',
    `from functools import cmp_to_key

words = ["pear", "fig", "apple", "kiwi"]
print(sorted(words, key=lambda w: (-len(w), w)))   # ['apple', 'kiwi', 'pear', 'fig']

def largest_number(nums):
    strs = sorted(map(str, nums), key=cmp_to_key(lambda a, b: -1 if a + b > b + a else 1))
    return str(int("".join(strs)))

print(largest_number([3, 30, 34, 5, 9]))   # 9534330`,
    `assert sorted(words, key=lambda w: (-len(w), w)) == ['apple','kiwi','pear','fig']
assert largest_number([3,30,34,5,9]) == '9534330'
assert largest_number([0,0]) == '0'`,
    '- Prefer key functions: they are called once per item, comparators once per comparison.', 'O(n log n)', SO.concat(['#/cheatsheets/python']));

  E('anagram-sliding-window', 'Find all anagrams of a pattern in a string',
    ['find all anagrams in a string', 'leetcode 438', 'permutation in string', 'leetcode 567', 'sliding window anagram counts', 'check if a permutation of s1 is a substring of s2'],
    'find all anagrams permutation in string fixed window counter leetcode 438 567',
    'Slide a fixed window of length `len(p)` over the string, keeping a Counter of the window. When the window counter equals the pattern counter, record the start index. Add the incoming char and remove the outgoing one each step.',
    `from collections import Counter

def find_anagrams(s, p):
    k, need, win, out = len(p), Counter(p), Counter(), []
    for i, ch in enumerate(s):
        win[ch] += 1
        if i >= k:
            old = s[i - k]
            win[old] -= 1
            if win[old] == 0:
                del win[old]
        if win == need:
            out.append(i - k + 1)
    return out

print(find_anagrams("cbaebabacd", "abc"))   # [0, 6]`,
    `assert find_anagrams("cbaebabacd","abc") == [0,6]
assert find_anagrams("abab","ab") == [0,1,2]
assert find_anagrams("a","ab") == []`,
    '- Deleting zero counts is needed because Counter equality treats `{a:0}` and `{}` as different.', 'Time O(n * alphabet), space O(alphabet)', SW.concat(['#/problem/438']));

  E('sliding-window-maximum', 'Sliding window maximum (monotonic deque)',
    ['sliding window maximum', 'leetcode 239', 'max of every window of size k', 'monotonic deque sliding window', 'maximum in each subarray of length k', 'deque sliding window python'],
    'sliding window maximum monotonic deque max of each window leetcode 239 decreasing',
    'Keep a deque of indices whose values are in decreasing order. For each new element pop smaller values from the back, append the index, drop the front if it left the window, and the front is the window maximum. Each index enters and leaves once, so O(n).',
    `from collections import deque

def max_sliding_window(nums, k):
    dq, out = deque(), []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out

print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))   # [3, 3, 5, 5, 6, 7]`,
    `assert max_sliding_window([1,3,-1,-3,5,3,6,7], 3) == [3,3,5,5,6,7]
assert max_sliding_window([1], 1) == [1]
assert max_sliding_window([9,8,7], 2) == [9,8]
assert max_sliding_window([1,2,3], 3) == [3]`,
    null, 'Time O(n), space O(k)', SW.concat(['#/topic/monotonic', '#/problem/239']));

  E('sort-by-frequency', 'Sort characters or numbers by frequency',
    ['sort characters by frequency', 'leetcode 451', 'sort array by frequency python', 'order elements by count then value', 'sort string by character frequency', 'frequency sort'],
    'sort by frequency counter characters leetcode 451 1636 count then value',
    'Count with `Counter`, then sort the items by a key built from the counts: `sorted(s, key=lambda c: (-cnt[c], c))`. The tuple makes ties break alphabetically and keeps equal characters together.',
    `from collections import Counter

def frequency_sort(s):
    cnt = Counter(s)
    return "".join(sorted(s, key=lambda c: (-cnt[c], c)))

print(frequency_sort("tree"))   # eert`,
    `assert frequency_sort("tree") == "eert"
assert frequency_sort("cccaaa") == "aaaccc"
assert frequency_sort("") == ""`,
    null, 'Time O(n log n)', SO.concat(AH));

  E('sort-dicts-objects', 'Sort a list of dicts or objects by one field',
    ['sort list of dictionaries by key', 'sort objects by attribute python', 'sort a list of tuples', 'itemgetter python sort', 'sort records by field', 'sort list of dicts by value'],
    'sort list dicts objects attribute key itemgetter attrgetter records field',
    'Use `sorted(items, key=...)`: `lambda d: d["age"]` or `operator.itemgetter("age")` for dicts, `operator.attrgetter("age")` for objects. Add `reverse=True` for descending. Because Python sorts are stable, ties keep their original order.',
    `from operator import itemgetter, attrgetter

people = [{"name": "Ann", "age": 30}, {"name": "Bob", "age": 25}]
print(sorted(people, key=itemgetter("age")))        # Bob first

class P:
    def __init__(self, n, a): self.n, self.a = n, a
ps = [P("Ann", 30), P("Bob", 25)]
print([p.n for p in sorted(ps, key=attrgetter("a"), reverse=True)])   # ['Ann', 'Bob']`,
    `assert [p["name"] for p in sorted(people, key=itemgetter("age"))] == ["Bob","Ann"]
assert [p.n for p in sorted(ps, key=attrgetter("a"), reverse=True)] == ["Ann","Bob"]`,
    null, 'O(n log n)', SO.concat(['#/cheatsheets/python']));

  E('subarray-product-less-than-k', 'Count subarrays with product less than k',
    ['subarray product less than k', 'leetcode 713', 'count subarrays whose product is below k', 'sliding window count subarrays', 'number of contiguous subarrays with small product', 'window adds r-l+1 subarrays'],
    'subarray product less than k sliding window count positive leetcode 713 r minus l plus one',
    'For positive numbers, keep a window whose product is `< k`. For each right end r, shrink l while the product is `>= k`; all subarrays ending at r that start in `[l, r]` are valid, which adds `r - l + 1` to the count.',
    `def num_subarray_product_less_than_k(nums, k):
    if k <= 1:
        return 0
    prod, l, count = 1, 0, 0
    for r, x in enumerate(nums):
        prod *= x
        while prod >= k:
            prod //= nums[l]
            l += 1
        count += r - l + 1
    return count

print(num_subarray_product_less_than_k([10, 5, 2, 6], 100))   # 8`,
    `assert num_subarray_product_less_than_k([10,5,2,6], 100) == 8
assert num_subarray_product_less_than_k([1,2,3], 0) == 0
assert num_subarray_product_less_than_k([1,1,1], 2) == 6`,
    null, 'Time O(n), space O(1)', SW.concat(['#/problem/713']));
})();
