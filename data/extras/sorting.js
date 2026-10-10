(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['sorting'] = {
    primer: {
      kind: 'technique',
      what: '**Sorting** rearranges items into order by some key, smallest to largest. It is usually a first move, not the goal: like alphabetizing a pile of cards so that duplicates, neighbours and overlaps end up next to each other and one pass can find them.',
      does: 'It turns “compare every pair” problems into “look at neighbours” problems. Comparison sorts cost **O(n log n)** and cannot do better in the worst case; counting and bucket sort reach **O(n + k)** when values are small integers. Two properties matter: **stable** (equal items keep their order) and **in place** (little extra memory).',
      impl: 'In Python use `sorted(x, key=...)` or `x.sort()`: Timsort, stable, O(n log n) worst case and O(n) on already-ordered data. Use `key=` for one rule, tuples for several, `functools.cmp_to_key` for a custom comparison. Write merge sort, quick sort or counting sort only when the question is about them.',
      possibilities: 'Merge intervals and meeting rooms, closest pair and gap problems, greedy pairing (sort both sides), k-th largest by quickselect, sort-by-frequency with buckets, custom orderings such as the largest number from digits, in-place three-way partition (colours), and counting inversions with merge sort.'
    },

    breakdown: [
      {
        title: '1. The raw idea: sort a hand of cards (insertion sort)',
        body: 'Sort `[5, 2, 4, 1]` the way you sort cards. Keep the left part sorted. Take 2 and slide it left past 5: `[2, 5, 4, 1]`. Take 4: it slides past 5 and stops after 2: `[2, 4, 5, 1]`. Take 1: it slides past 5, 4 and 2 to the front: `[1, 2, 4, 5]`. The **state** is “everything left of position i is already sorted”. The cost shows up in the worst case: each new item may slide the whole way left, 1 + 2 + 3 + ... + (n-1) moves, which is about n^2 / 2. That is fine for 10 items and painful for 100,000.'
      },
      {
        title: '2. Merging: two sorted piles become one in a single pass',
        body: 'The speed-up starts from an easy fact: **merging two already-sorted piles is cheap**. Piles `[1, 4, 7]` and `[2, 3, 9]`. Compare the two fronts, take the smaller, advance that pile. 1 vs 2: take 1. 4 vs 2: take 2. 4 vs 3: take 3. 4 vs 9: take 4. 7 vs 9: take 7. The left pile is empty, so append what remains of the right: 9. Result `[1, 2, 3, 4, 7, 9]`. Every item is placed exactly once, so merging piles of total size n costs O(n). On a tie take the **left** item (`<=`): that keeps equal items in their original order.'
      },
      {
        title: '3. Merge sort: halve, sort each half, merge',
        body: 'If merging is cheap, make the piles by splitting. A list of one item is already sorted (the **base case**). Trace `[6, 3, 8, 2]`: split into `[6, 3]` and `[8, 2]`. Split again into `[6] [3]` and `[8] [2]`. Merge `[6] [3]` into `[3, 6]`; merge `[8] [2]` into `[2, 8]`. Merge `[3, 6]` with `[2, 8]` into `[2, 3, 6, 8]`. Halving four items takes 2 levels, and each level merges n items in total, so the cost is n per level times log2(n) levels: **O(n log n)**, always. The price is O(n) extra space for the merged output.',
        code: { py: 'def merge_sort(a):\n    if len(a) <= 1:\n        return a\n    mid = len(a) // 2\n    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])\n    out, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            out.append(left[i]); i += 1\n        else:\n            out.append(right[j]); j += 1\n    return out + left[i:] + right[j:]' }
      },
      {
        title: '4. Quick sort: choose a pivot, deal items around it',
        body: 'Quick sort splits by value instead of by position. Pick a **pivot**, say 5 in `[5, 2, 8, 1, 9, 3]`. Everything smaller goes left: `[2, 1, 3]`; equal stays: `[5]`; larger goes right: `[8, 9]`. The pivot is now in its final place. Sort `[2, 1, 3]` and `[8, 9]` the same way and join them. A pivot near the middle halves the problem, so the cost is O(n log n) on average. But if the pivot is always the smallest or largest (the first item of already-sorted input), each round removes one item: n + (n-1) + ... = O(n^2). Fix it with a **random** pivot, and use a three-way split so many equal values stay O(n).'
      },
      {
        title: '5. Counting sort: no comparisons when values are small',
        body: 'Sort `[3, 1, 3, 0, 2]` where every value is in `0..3`. Count each value: `count = [1, 1, 1, 2]` (one 0, one 1, one 2, two 3s). Turn counts into running totals: `[1, 2, 3, 5]`, meaning “this many items are <= v”, so value 3 ends before position 5. Now walk the input **right to left**: 2 goes to position 2, 0 to position 0, the last 3 to position 4, 1 to position 1, the first 3 to position 3. Output `[0, 1, 2, 3, 3]`. Cost O(n + k) for range size k. It wins for ages, scores or letters, and loses if k is far bigger than n.'
      },
      {
        title: '6. Keys, ties and stability in practice',
        body: 'Real data is sorted by a **key**, not by itself. `sorted(people, key=lambda p: (p.team, p.name))` sorts by team, then by name inside each team: tuples compare left to right. For mixed directions negate a number: `key=lambda p: (-p.score, p.name)` gives highest score first, ties alphabetical. Python’s sort is **stable**, so you may also sort by the minor key first and the major key second. Be careful with strings: `sorted(["10", "9", "2"])` gives `["10", "2", "9"]` because text compares character by character. Convert with `key=int` when you mean numbers.'
      },
      {
        title: '7. Sort then scan: how to spot sorting in an interview',
        body: 'The common shape: spend O(n log n) to sort, then answer with one O(n) pass. After sorting, duplicates, overlaps and closest pairs sit next to each other. Trace merging intervals `[[8,10], [1,3], [2,6]]`: sorted by start `[1,3], [2,6], [8,10]`. Take `[1,3]`; next start 2 <= 3, so extend to `[1,6]`; next start 8 > 6, start a new interval. Result `[[1,6],[8,10]]`. Cue words: “overlapping”, “closest”, “k-th”, “rearrange so that”, “pair up the largest with the largest”. Say the cost out loud (“sorting dominates at O(n log n)”). If only one rank is needed, think quickselect or a heap instead of a full sort.'
      }
    ],

    think: [
      {
        q: 'Three numbers can be arranged in 3! = 6 different orders. Using only yes/no comparisons, what is the fewest comparisons that always suffices, and what does that suggest for n numbers?',
        a: 'Three comparisons. One comparison has 2 outcomes, so two comparisons separate at most 4 orders, which is less than 6; three separate up to 8. For n items there are n! orders, so you need at least log2(n!) comparisons, which is about n log2 n. This is why no comparison sort beats O(n log n) in the worst case, and why counting sort has to avoid comparisons to do better.'
      },
      {
        q: 'Sort `[("b", 1), ("a", 1), ("c", 0)]` by the number only, using Python’s `sorted`. Where do `"b"` and `"a"` end up relative to each other?',
        a: 'The result is `[("c", 0), ("b", 1), ("a", 1)]`: `"b"` stays before `"a"`. Python’s sort is stable, so items with equal keys keep their original order. The aha: stability means you can sort in two passes, minor key first and major key second, and the minor order survives inside each major group.'
      },
      {
        q: 'A quick sort always picks the first element as the pivot. What input makes it O(n^2), and why does a random pivot fix it?',
        a: 'An already sorted (or reverse sorted) list. The first element is then the smallest, so the "smaller" side is empty and the "larger" side has n - 1 items: each round removes just one item, giving n + (n-1) + ... about n^2 / 2 work. A random pivot makes a lopsided split unlikely on any input, so the expected cost is O(n log n) whatever order the data arrives in.'
      },
      {
        q: 'What do `sorted(["10", "9", "2"])` and `sorted([10, 9, 2])` return?',
        a: 'The strings give `["10", "2", "9"]` and the ints give `[2, 9, 10]`. Strings compare character by character, so `"1"` < `"2"` < `"9"` puts `"10"` first. This is also the reason the Largest Number problem cannot just sort strings: you need a rule about the joined result (`a + b` vs `b + a`), not the plain text order.'
      },
      {
        q: 'In merge sort’s merge step, what changes if you write `<` instead of `<=` when comparing `left[i]` with `right[j]`?',
        a: 'The output is still sorted, but on a tie the right item is taken first, so equal items from the right half jump ahead of equal items from the left half. The sort is no longer stable. With plain numbers you will never notice; with records sorted by one field it changes the output, which is why `<=` is deliberate.'
      },
      {
        q: 'You must sort 10 million people by age (0 to 120). Which sort fits best, and why would it be wrong for sorting 10 million 64-bit IDs?',
        a: 'Counting sort: one pass to tally 121 counters, then place everyone, O(n + 121) with no comparisons. For 64-bit IDs the range k is around 10^19, far larger than n, so O(n + k) is hopeless, and a comparison sort (or radix sort on the digits) is the right choice. Counting sort wins only when the value range is small compared with n.'
      }
    ],

    drills: [
      {
        title: 'Smallest gap between any two numbers',
        q: 'Given a list of integers, return the **smallest difference between any two of its numbers** (any two positions, not only neighbours in the list). If there are fewer than two numbers, return `-1`. Example: `[9, 1, 4, 7]` returns `2` (9 and 7); `[3, 3]` returns `0`; `[5]` returns `-1`.',
        hint: 'After sorting, the two numbers closest to each other must be next to each other.',
        how: 'I restate it: find the minimum of |a - b| over every pair of positions. The brute force checks all pairs, n(n-1)/2 of them, which is O(n^2): too slow for 100,000 numbers. The observation that unlocks it is about order. Suppose the numbers are sorted and the closest pair is a and c with some number b strictly between them. Then b is closer to a than c is, so the pair (a, c) was not the closest after all. So in sorted order the closest pair is always **adjacent**. That reduces n^2 pairs to n - 1 neighbour pairs. So the plan is: sort, then take the minimum of the differences between consecutive elements. In Python, `zip(s, s[1:])` gives consecutive pairs. Trace `[9, 1, 4, 7]`: sorted is `[1, 4, 7, 9]`, gaps are 3, 3 and 2, the minimum is 2. Duplicates sort next to each other and give a gap of 0, as in `[3, 3]`. Edge cases: with fewer than two numbers there is no pair, so I return -1 before touching the list; negative numbers need no special handling since subtraction after sorting is non-negative. Cost: sorting dominates, O(n log n) time, O(n) space for the sorted copy (I avoid mutating the input). This is the standard sort-then-scan shape.',
        code: {
          py: `def min_gap(nums):
    if len(nums) < 2:
        return -1
    s = sorted(nums)
    return min(b - a for a, b in zip(s, s[1:]))`
        },
        explain: 'In sorted order any number strictly between a pair would be closer to each end than the ends are to each other, so the minimum difference occurs between neighbours. Checking n - 1 neighbours after an O(n log n) sort replaces checking all n(n-1)/2 pairs.',
        check: `import random
assert min_gap([9, 1, 4, 7]) == 2
assert min_gap([5]) == -1
assert min_gap([]) == -1
assert min_gap([3, 3]) == 0
assert min_gap([1, 10]) == 9
assert min_gap([8, 1, 15, 5, 12]) == 3
assert min_gap([-5, -1, -20, 7]) == 4
random.seed(3)
for _ in range(100):
    a = [random.randint(-50, 50) for _ in range(random.randint(2, 12))]
    want = min(abs(a[i] - a[j]) for i in range(len(a)) for j in range(i + 1, len(a)))
    assert min_gap(a) == want`
      },
      {
        title: 'How long was the lab occupied?',
        q: 'Bookings are `(start, end)` pairs meaning the lab is in use from `start` up to `end` (length `end - start`). Bookings may overlap or touch. Return the **total length of time during which at least one booking is active**. Example: `[(1, 4), (2, 6), (8, 10)]` returns `7` (time 1 to 6, then 8 to 10); `[(1, 3), (3, 5)]` returns `4`; `[]` returns `0`.',
        hint: 'Sort by start time; keep the current merged block and extend it while the next booking begins before the block ends.',
        how: 'I restate it: add up the length of the union of the intervals, counting overlapping time only once. The naive plan is to add up all the lengths, but overlaps get counted twice (in the example 3 + 4 + 2 = 9, not 7). Another brute force marks every unit of time in a set, which fails for large coordinates. The observation: if the bookings are **sorted by start**, an overlap can only happen with the block I am currently building, never with something far back, because every earlier block ended before the current block started. So I sweep once, keeping a current block `[cur_start, cur_end]`. For the next booking `(s, e)`: if `s > cur_end`, there is a gap, so the block is finished: add its length and start a new block at `(s, e)`. Otherwise it overlaps or touches, so extend the end with `max(cur_end, e)` (the max matters when a booking sits entirely inside the block). At the end add the last block. Trace `[(1,4),(2,6),(8,10)]`: block (1,4); (2,6) overlaps, block becomes (1,6); (8,10) has a gap, add 5, block (8,10); at the end add 2: total 7. Touching bookings `(1,3),(3,5)` merge because 3 is not greater than 3, giving 4. Edge cases: an empty list gives 0; a booking nested inside another does not shorten the block. Cost: O(n log n) for the sort plus one O(n) sweep; O(1) extra space beyond the sort.',
        code: {
          py: `def covered_length(intervals):
    total = 0
    cur_start = cur_end = None
    for s, e in sorted(intervals):        # sorted by start
        if cur_end is None or s > cur_end:
            if cur_end is not None:
                total += cur_end - cur_start   # close the finished block
            cur_start, cur_end = s, e
        else:
            cur_end = max(cur_end, e)          # overlap or touch: extend
    if cur_end is not None:
        total += cur_end - cur_start
    return total`
        },
        explain: 'Sorted by start, every booking either begins inside the current block (extend it, using max so nested bookings do not shrink it) or after it (the block is final and the next one begins). Blocks are disjoint, so their lengths add up exactly to the union. O(n log n) time.',
        check: `import random
assert covered_length([(1, 4), (2, 6), (8, 10)]) == 7
assert covered_length([(1, 3), (3, 5)]) == 4
assert covered_length([]) == 0
assert covered_length([(5, 6)]) == 1
assert covered_length([(1, 10), (2, 3), (4, 5)]) == 9
assert covered_length([(7, 9), (1, 2)]) == 3
random.seed(5)
for _ in range(100):
    iv = []
    for _ in range(random.randint(0, 8)):
        s = random.randint(0, 20)
        iv.append((s, s + random.randint(1, 6)))
    units = set()
    for s, e in iv:
        units.update(range(s, e))
    assert covered_length(iv) == len(units)`
      },
      {
        title: 'Most talks in one room',
        q: 'A conference room hosts talks, each given as `(start, end)`. Two talks can be in the same room if one ends at or before the moment the other starts. Return the **maximum number of talks** that can be held in the single room. Example: `[(1, 3), (2, 4), (3, 5)]` returns `2` (talks 1 and 3); `[(1, 10), (2, 3), (4, 5), (6, 7)]` returns `3`; `[]` returns `0`.',
        hint: 'Which talk should you pick first? Think about which choice leaves the most room for the rest.',
        how: 'I restate it: choose as many non-overlapping talks as possible. Trying every subset is 2^n. A first greedy idea is to pick the shortest talk or the earliest start, but both fail: one long-ish talk in the middle can block two short ones, and an early start can be a very long talk. The right question is what to do first: pick the talk that **finishes earliest**, because it leaves the largest remaining time for everything else. After taking it, discard any talk that overlaps it and repeat. That means: sort the talks by end time, walk through them, and take a talk if its start is at or after the end of the last talk I took. Why is it safe? Exchange argument: take any optimal schedule; its first talk ends no earlier than my earliest-finishing talk, so swapping my talk in cannot create an overlap, and the count stays the same. Repeating that argument shows greedy matches an optimum. Trace `[(1,3),(2,4),(3,5)]`: sorted by end it is the same order. Take (1,3), last_end = 3. (2,4) starts at 2 < 3, skip. (3,5) starts at 3 >= 3, take. Count 2. Edge cases: an empty list gives 0; identical talks count once (`[(1,2),(1,2),(1,2)]` gives 1); touching talks are allowed because the test is `>=`. Cost: O(n log n) for the sort, O(n) scan, O(1) extra space.',
        code: {
          py: `def max_meetings(meetings):
    count, last_end = 0, float('-inf')
    for s, e in sorted(meetings, key=lambda m: m[1]):   # earliest finish first
        if s >= last_end:                                # fits after the last one
            count += 1
            last_end = e
    return count`
        },
        explain: 'Greedy by earliest finish: the talk that ends first leaves the most time for the rest, and an exchange argument shows some optimal schedule contains it. Repeating on the talks that start after it gives an optimal schedule overall. O(n log n) time for the sort.',
        check: `import itertools, random
assert max_meetings([(1, 3), (2, 4), (3, 5)]) == 2
assert max_meetings([]) == 0
assert max_meetings([(1, 10), (2, 3), (4, 5), (6, 7)]) == 3
assert max_meetings([(1, 2), (1, 2), (1, 2)]) == 1
assert max_meetings([(0, 5), (5, 10)]) == 2
def brute(ms):
    best = 0
    for r in range(len(ms) + 1):
        for combo in itertools.combinations(ms, r):
            c = sorted(combo)
            if all(c[i][1] <= c[i + 1][0] for i in range(len(c) - 1)):
                best = max(best, r)
    return best
random.seed(11)
for _ in range(100):
    ms = []
    for _ in range(random.randint(0, 7)):
        s = random.randint(0, 12)
        ms.append((s, s + random.randint(1, 5)))
    assert max_meetings(ms) == brute(ms)`
      },
      {
        title: 'How out of order is this list?',
        q: 'An **inversion** is a pair of positions `i < j` where `nums[i] > nums[j]` (a bigger number sits before a smaller one). Count the inversions in O(n log n). Example: `[2, 4, 1, 3, 5]` returns `3` (the pairs 2>1, 4>1, 4>3); `[1, 2, 3]` returns `0`; `[3, 2, 1]` returns `3`; `[1, 1, 1]` returns `0`.',
        hint: 'Count while merge sorting: when the merge step takes an item from the right half, it jumps ahead of every item still waiting in the left half.',
        how: 'I restate it: count pairs that are in the wrong order relative to sorted order. Checking every pair is O(n^2), which is too slow for 10^5 numbers. The unlock is to notice that merge sort already does the work of comparing across halves. Split the list in half, count inversions inside the left half, inside the right half, and then count **crossing** inversions: a left item bigger than a right item. Merge sort sorts each half first, and then sortedness makes crossing pairs easy to count. During the merge I compare the fronts of the sorted halves `left[i]` and `right[j]`. If `left[i] <= right[j]`, take the left one: it is not bigger than anything remaining on the right, so it causes no crossing inversion. If `right[j] < left[i]`, take the right one. Because the left half is sorted, every one of the `len(left) - i` items still waiting in the left is at least `left[i]`, so all of them are bigger than `right[j]` and are inverted with it. I add `len(left) - i` to the count. Trace `[2, 4, 1, 3, 5]`: split `[2, 4]` and `[1, 3, 5]`. The left has 0 inversions; the right has 0. Merge: fronts 2 and 1: right is smaller, add 2 (both 2 and 4 remain); fronts 2 and 3: take 2; 4 and 3: right smaller, add 1 (just 4 remains); then 4 vs 5: take 4, then append the rest. Total 3. Using `<=` on ties is essential so equal numbers are not counted. Edge cases: an empty list, one element, all equal. Cost: O(n log n) time, O(n) space for the merges.',
        code: {
          py: `def count_inversions(nums):
    def sort(a):                          # returns (sorted list, inversions)
        if len(a) <= 1:
            return a, 0
        mid = len(a) // 2
        left, x = sort(a[:mid])
        right, y = sort(a[mid:])
        merged, i, j, cross = [], 0, 0, 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
                cross += len(left) - i    # right[j] jumps over every remaining left item
        merged += left[i:] + right[j:]
        return merged, x + y + cross

    return sort(list(nums))[1]`
        },
        explain: 'Every inversion lies inside the left half, inside the right half, or across them. Recursion counts the first two. For crossing pairs, when a right item is placed before the remaining left items, all of them (which are at least as big as left[i], and strictly greater than the right item) form inversions with it. Ties take the left item, so equal values never count. O(n log n) time, O(n) space.',
        check: `import random
assert count_inversions([2, 4, 1, 3, 5]) == 3
assert count_inversions([]) == 0
assert count_inversions([1, 2, 3]) == 0
assert count_inversions([3, 2, 1]) == 3
assert count_inversions([1, 1, 1]) == 0
assert count_inversions([2, 1, 2, 1]) == 3
random.seed(2)
for _ in range(100):
    a = [random.randint(0, 9) for _ in range(random.randint(0, 15))]
    want = sum(1 for i in range(len(a)) for j in range(i + 1, len(a)) if a[i] > a[j])
    assert count_inversions(a) == want
assert count_inversions(list(range(2000, 0, -1))) == 2000 * 1999 // 2`
      }
    ],

    how: {
      1051: 'I restate it: heights should be in non-decreasing order; count the positions where a student is not standing where the sorted order says. I do not need to find who to move, only how many positions differ. The sorted version of the list is exactly the order they should stand in, so I make a sorted copy and compare the two lists position by position, counting mismatches. Do not sort in place first, because I need the original to compare. Trace `[1, 1, 4, 2, 1, 3]`: sorted is `[1, 1, 1, 2, 3, 4]`. Compare: positions 0 and 1 match; position 2 has 4 vs 1, mismatch; position 3 has 2 vs 2, match; position 4 has 1 vs 3, mismatch; position 5 has 3 vs 4, mismatch. Count 3. Edge cases: an already sorted list gives 0, one student gives 0, duplicates are no problem because equal heights are interchangeable (the comparison is by value, not identity). Cost: sorting makes it O(n log n) time and O(n) space for the copy. Heights are small integers (1 to 100), so counting sort would make the whole thing O(n); I would mention that as the optimisation, since the range is much smaller than the number of students.',
      561: 'I restate it: pair up the 2n numbers into n pairs, and maximise the sum of the smaller number of each pair. The brute force tries all pairings, which is hopeless. The question is how to waste the least. In each pair the larger number contributes nothing, so I want the discarded (larger) numbers to be as small as possible, which means pairing numbers that are close together: a large number paired with a tiny one wastes a lot. The cleanest arrangement is to sort and pair neighbours: (a1, a2), (a3, a4), and so on. Each pair then loses only the gap between its two members. An exchange argument shows any other pairing can only lose more: pairing a small number with a far bigger one throws away the bigger one’s value. The answer is therefore the sum of every other element of the sorted list, starting at index 0 (the smaller of each pair). Trace `[1, 4, 3, 2]`: sorted `[1, 2, 3, 4]`, pairs (1,2) and (3,4), sum of mins 1 + 3 = 4. Edge cases: negatives work the same way (`[-5, -4, 3, 8]` gives -5 + 3 = -2); two numbers give the smaller. Cost: O(n log n) for the sort, O(n) to sum; in Python it is `sum(sorted(nums)[::2])`.',
      976: 'I restate it: pick three lengths that form a triangle with positive area and make the perimeter as big as possible, or return 0 if no three can. Three lengths a >= b >= c form a triangle exactly when the longest is shorter than the other two combined: `a < b + c`. Checking every triple is O(n^3). Sorting helps. If I want the largest perimeter, I should try the biggest numbers first, so sort in descending order and look at consecutive triples `nums[i], nums[i+1], nums[i+2]`. For a fixed longest side `nums[i]`, the best partners are the next two biggest values, since they make the inequality easiest to satisfy and the perimeter largest. If `nums[i] >= nums[i+1] + nums[i+2]`, then `nums[i]` is too long for any pair among the smaller numbers, so it can never be the longest side of a triangle, and I move on. The first triple that passes is the answer, because I scanned from the largest. Trace `[3, 6, 2, 3]`: sorted descending `[6, 3, 3, 2]`; 6 < 3 + 3 is false, skip; 3 < 3 + 2 is true, so 3 + 3 + 2 = 8. Edge cases: fewer than 3 numbers or none passing returns 0. Cost: O(n log n) time for the sort, then O(n) scan, O(1) extra.',
      2037: 'I restate it: seats and students sit at positions on a line; assign each student to a different seat to minimise the total distance moved. Trying every assignment is n!. The observation: crossing assignments never help. If student A is left of student B but A is sent to a seat to the right of B’s seat, swapping their seats does not increase the total distance (a two-student check on a line, by the triangle-style inequality for absolute differences). So there is always an optimal assignment where the leftmost student takes the leftmost seat, the second the second, and so on. That is exactly what sorting both lists and pairing by index gives. Trace `seats = [3, 1, 5]` and `students = [2, 7, 4]`: sorted seats `[1, 3, 5]`, sorted students `[2, 4, 7]`; distances 1, 1 and 2; total 4. Edge cases: one student and one seat gives the absolute difference; students and seats at the same positions give 0; duplicate positions are fine. Cost: two sorts, O(n log n) time, plus an O(n) sum, O(n) space for the sorted copies. This is a standard pattern for matching on a line: sort both sides and pair by rank.',
      1122: 'I restate it: sort arr1 so that the values listed in arr2 come first in arr2’s order, and all remaining values follow in ascending order. A custom comparator can express it, but a counting approach is simpler and linear for the first part. Because values repeat, I count how many times each value appears in arr1. Then I build the answer in two parts: for each value x in arr2, in order, output x as many times as it appears in arr1 (and remove it from the counts); then output all the leftover values in ascending order, each repeated by its count. The leftovers need sorting only over the distinct leftover values, so it costs d log d for d distinct leftovers. Trace `arr1 = [5, 3, 5, 1, 9]`, `arr2 = [5, 1]`: counts 5:2, 3:1, 1:1, 9:1. From arr2, output 5, 5, then 1. Leftovers are 3 and 9 in ascending order. Result `[5, 5, 1, 3, 9]`. Edge cases: arr2 values are guaranteed to be in arr1 here, so the lookup is safe; leftover duplicates stay together because we repeat by count; an empty leftover set skips the second part. Cost: O(n + m) for counting and the first part, plus O(d log d) for the leftover sort, O(n) space.',
      274: 'I restate it: the h-index is the largest h such that at least h papers have at least h citations each. Trying every h and counting papers is O(n^2). If I sort the citations in descending order, the paper at position i (counting from 1) has i papers that are cited at least as much as it. So the condition "there are at least h papers with at least h citations" is the same as "the h-th paper in descending order has at least h citations". As I walk down the sorted list, the citation counts only fall while the rank only rises, so the condition `citations[i] >= i + 1` is true for a while and then false forever: one flip. The answer is the number of leading papers where it holds. Trace `[3, 0, 6, 1, 5]`: sorted descending `[6, 5, 3, 1, 0]`. Rank 1: 6 >= 1 yes; rank 2: 5 >= 2 yes; rank 3: 3 >= 3 yes; rank 4: 1 >= 4 no. So h = 3. Edge cases: `[0]` gives 0, `[100]` gives 1 (one paper, h cannot exceed the number of papers), `[4, 4, 4, 4]` gives 4. Cost: O(n log n) from the sort. Because h can never exceed n, I could use counting (a bucket per citation count, capped at n) for O(n); I would mention it as the follow-up.',
      75: 'I restate it: the array contains only 0, 1 and 2 (colours); sort it in place without a library sort. The easy way is to count each colour, then overwrite, which takes two passes. A one-pass solution uses the idea behind quick sort’s three-way partition, with the pivot 1: everything less than 1 goes left, everything greater goes right, and 1s stay in the middle. I keep three zones: `nums[:lt]` are zeros, `nums[lt:i]` are ones, `nums[gt+1:]` are twos, and `nums[i:gt+1]` is not yet looked at. I look at `nums[i]`. If it is 0, swap it with `nums[lt]` and advance both `lt` and `i` (the item swapped in from the ones zone is a 1, known). If it is 2, swap it with `nums[gt]` and shrink `gt`, but do **not** advance `i`, because the item that arrived has not been examined. If it is 1, just advance `i`. Trace `[2, 0, 2, 1, 1, 0]`: i=0 sees 2, swap with the end: `[0,0,2,1,1,2]`, gt=4. Then 0, 0 are placed (lt=2, i=2). i=2 sees 2, swap with gt=4: `[0,0,1,1,2,2]`, gt=3. i=2 sees 1, i=3 sees 1, now i > gt, done. Cost: O(n) time, one pass, O(1) space.',
      215: 'I restate it: return the k-th largest value in sorted order, counting duplicates. Sorting and indexing is O(n log n); that is a fine first answer but it orders everything when I need one rank. The better idea is quickselect, which is quick sort that follows only one side. Pick a random pivot and split the numbers into those greater than the pivot, those equal to it and those smaller. If k is at most the count of greater values, the k-th largest is among them: discard everything else and repeat on the greater group. If k is beyond the greater and equal groups, it is among the smaller ones: subtract the sizes of the discarded groups from k and continue on the smaller group. Otherwise rank k falls in the equal group and the pivot is the answer. The three-way split makes many duplicates harmless. Trace `[3, 2, 1, 5, 6, 4]`, k = 2: suppose the pivot is 4; greater = `[5, 6]` has 2 items, k <= 2, so continue on `[5, 6]`. Pivot 5: greater = `[6]` (1 item), k = 2 is beyond that, smaller is empty, so k falls in the equal group: the answer is 5. Each round discards part of the input, so the expected cost is n + n/2 + n/4 + ..., which is O(n); the worst case is O(n^2) with unlucky pivots. A min-heap of size k is the O(n log k) alternative that also works on streams.',
      56: 'I restate it: merge all overlapping intervals and return the disjoint intervals that remain. Comparing every pair repeatedly is slow and awkward because merging two intervals can create a new overlap. The observation: if the intervals are sorted by start, an interval can only overlap the **last merged** interval in my output, never something earlier, because earlier ones end before the last one started. So sort by start, then sweep, keeping an output list. For each interval `(s, e)`: if the output is non-empty and `s <= out[-1][1]` (it begins before or at the end of the last merged interval), extend the last interval’s end to `max(out[-1][1], e)`; the max handles an interval fully inside the previous one. Otherwise append `(s, e)` as a new interval. Trace `[[8,10], [1,3], [2,6], [15,18]]`: sorted `[1,3], [2,6], [8,10], [15,18]`. Take [1,3]. [2,6]: 2 <= 3, merge into [1,6]. [8,10]: 8 > 6, append. [15,18]: append. Result `[[1,6],[8,10],[15,18]]`. Touching intervals such as [1,4] and [4,5] merge because `<=` counts a shared endpoint. Edge cases: one interval, an empty list. Cost: O(n log n) for the sort, then one O(n) pass; the sort dominates.',
      912: 'I restate it: sort an integer array without using a built-in sort, in O(n log n), with possible duplicates. The simple O(n^2) sorts (insertion, selection) are too slow for 50,000 elements. Merge sort is the safe answer: always O(n log n), but it needs O(n) extra space. Quick sort is in place and fast in practice, but two details decide whether it is correct and fast. First, the pivot: a fixed pivot (first or last element) makes sorted input O(n^2), so I choose a random one. Second, duplicates: a plain two-way split with many equal values puts them all on one side and degrades to O(n^2); a three-way partition (less, equal, greater) finishes the equal block in the same pass. I keep pointers `lt`, `i`, `gt` so that `[lo, lt)` is smaller, `[lt, i)` is equal, `(gt, hi]` is greater, and `[i, gt]` unseen. Smaller items swap to `lt`; greater items swap to `gt` without advancing `i`; equals just advance `i`. Then I recurse on the smaller of the two outer parts and loop on the larger so the stack stays O(log n). Trace `[3, 1, 2, 3]` with pivot 3: after one pass the array is `[1, 2, 3, 3]` with the equal block at indices 2 to 3; only `[1, 2]` remains to sort. Cost: expected O(n log n), O(log n) stack.',
      179: 'I restate it: arrange the numbers so that, joined as text, they make the biggest possible number; return it as a string. Trying every permutation is n!. Sorting the numbers by value fails: for 3 and 30, 3 is smaller than 30 numerically, yet "330" beats "303". Sorting them as strings fails the other way: "30" is bigger than "3" alphabetically. What matters is the **joined result**. For two pieces a and b, put a first if `a + b > b + a` as strings. Such an order is consistent (transitive), which is what a sort needs, because it is equivalent to comparing the fractions a/(10^len(a) - 1) and b/(10^len(b) - 1). So I sort the string forms with a custom comparator (in Python `cmp_to_key`) and join. One edge: if the best first piece is "0", all pieces are zero, so return "0" rather than "000". Trace `[3, 30, 34, 5, 9]`: 9 comes first, then 5, then 34, then 3 vs 30: "330" > "303" so 3 goes before 30. Result "9534330". Cost: O(n log n) comparisons, each on short strings (numbers up to 10^9), so O(n log n) time and O(n) space. Without a comparator, there is no key function that does it directly.',
      451: 'I restate it: rearrange a string so characters appear in decreasing order of frequency, with all copies of a character together. The simple route: count characters, sort the (character, count) pairs by count descending, and write each character count times. That costs O(n + d log d) for d distinct characters, which is fine since d is small, and it is the first answer I would give. But a count is a whole number between 1 and n, which is a small range, and that suggests a bucket sort with no comparisons. I count each character, then put the character into a bucket indexed by its frequency, `buckets[f]`. Then I read the buckets from the highest frequency down to 1, and for each character in a bucket write it f times. Trace "tree": counts t:1, r:1, e:2. buckets[2] = ["ee"], buckets[1] = ["t", "r"]. Reading from high to low gives "ee" + "t" + "r" = "eetr", which is valid (any order within a frequency is accepted). Case matters: "A" and "a" are different characters. Edge cases: an empty string returns an empty string; a single repeated character returns itself. Cost: O(n) time since the buckets hold n characters in total, and O(n) space for the counts and buckets.',
      164: 'I restate it: given unsorted numbers, return the largest difference between neighbours in the sorted order, in linear time and space. Sorting and scanning is O(n log n), a fine first answer; linear time forbids a comparison sort. The key is the pigeonhole principle. With n numbers between lo and hi there are n - 1 gaps in sorted order, and they add up to hi - lo, so the largest gap is at least `(hi - lo) / (n - 1)`. Call `size` that value rounded down (at least 1). Now drop each number into a bucket of width `size`. Two numbers in the same bucket differ by less than `size`, so they cannot be the largest gap. So the answer lies **between** buckets: from the maximum of one non-empty bucket to the minimum of the next non-empty bucket. That means I only need to track each bucket’s minimum and maximum. Trace `[3, 6, 9, 1]`: lo = 1, hi = 9, n = 4, size = 8 // 3 = 2. Bucket index is (x - 1) // 2: 1 goes to bucket 0, 3 to bucket 1, 6 to bucket 2, 9 to bucket 4 (bucket 3 is empty). Scanning with `prev` = 1: gaps 3-1 = 2, 6-3 = 3, 9-6 = 3. The answer is 3. Edge cases: fewer than 2 numbers or all equal gives 0. Cost: O(n) time, O(n) space.'
    }
  };
})();
