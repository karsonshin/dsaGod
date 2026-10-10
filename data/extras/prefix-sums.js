(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['prefix-sums'] = {
    primer: {
      kind: 'technique',
      what: `A prefix-sum array is a table of **running totals**: \`prefix[i]\` is the sum of the first i elements. It works like mile markers on a highway: to get the distance between two exits you read both markers and subtract, instead of driving the stretch and adding as you go.`,
      does: `After one O(n) pass to build it, any range sum costs O(1). The same idea counts or finds subarrays with an exact sum (using a hash map of earlier prefixes), handles many range updates with a difference array, and answers rectangle sums in a grid with a 2D version.`,
      impl: `Build \`prefix = [0]\` and append \`prefix[-1] + x\` for each x, so \`prefix\` is one slot longer than the input. Then \`sum(nums[l..r]) = prefix[r + 1] - prefix[l]\`. For counting, keep a running sum and a \`dict\` of how often each prefix value has appeared; \`itertools.accumulate\` builds the array in one line.`,
      possibilities: `Range-sum queries on a fixed array, count subarrays that sum to k (negatives allowed), longest balanced 0/1 subarray, subarrays divisible by k, product of array except self, pivot and split-point problems, difference arrays for bookings or car pooling, and 2D region sums.`
    },

    think: [
      {
        q: `Array \`[3, 1, 4, 1, 5]\`. Write its prefix array, then get the sum of \`nums[1..3]\` without adding anything from the original.`,
        a: `With the leading zero: \`[0, 3, 4, 8, 9, 14]\`. The sum of \`nums[1..3]\` is \`prefix[4] - prefix[1]\` = 9 - 3 = 6, which is 1+4+1. The aha: the prefix at the end counts everything up to the end, the prefix before the start counts everything before the start, and the difference is exactly the stretch in between. The leading zero lets a range starting at index 0 use the same formula.`
      },
      {
        q: `Why is the prefix array one slot longer than the input, with \`prefix[0] = 0\`? What goes wrong with a same-length array?`,
        a: `With a same-length array, \`prefix[i]\` would include \`nums[i]\`, so the sum of \`nums[l..r]\` is \`prefix[r] - prefix[l - 1]\`, and when l is 0 you would read \`prefix[-1]\`, which is the wrong element in Python and a crash elsewhere. You need a special case for ranges that start at the beginning. The extra zero is "the sum of nothing", and it removes that special case.`
      },
      {
        q: `Count subarrays of \`[1, 2, 3]\` with sum 3 using "earlier prefix equals running minus k". Which prefixes do you see, and what does the map hold at each step?`,
        a: `Start with \`{0: 1}\`. Read 1: running 1, look up 1-3 = -2 (none), store 1. Read 2: running 3, look up 0, found once, so count 1 (the subarray [1,2]); store 3. Read 3: running 6, look up 3, found once, so count 2 (the subarray [3]); store 6. Answer 2. The aha: a hit on key \`running - k\` means "the stretch between that earlier moment and now sums to k".`
      },
      {
        q: `In the counting loop, why must the look-up happen **before** storing the current prefix, at least for k = 0?`,
        a: `If you stored first, then looked up \`running - 0\` = \`running\`, you would always find the prefix you just stored and count an empty subarray at every position. Looking up first means you only match prefixes from earlier positions, which are the starts of non-empty subarrays. Order: add to running sum, look up, then store.`
      },
      {
        q: `The array is \`[1, -1, 5, -2, 3]\` and the target sum is 3. Why does a sliding window fail but the prefix map succeed?`,
        a: `A window needs growing to only raise the sum and shrinking to only lower it. With negatives, the window \`[1, -1, 5, -2]\` sums to 3 only after the total has gone to 5 and come back down, so a window that shrinks as soon as the sum passes 3 gives up too early. Prefix sums make no decision about direction: they just ask "have I seen the prefix that leaves exactly 3?" and the sign of the numbers never matters.`
      },
      {
        q: `You must apply 10,000 updates of the form "add v to every element of a range" to an array of 100,000 elements, then read the array once. What is the slow way, and what is the idea that fixes it?`,
        a: `The slow way loops over each range for each update: up to 10,000 × 100,000 = a billion additions. The fix is a difference array: for "add v on [l, r]" write \`+v\` at \`l\` and \`-v\` at \`r + 1\`, which is O(1). One running sum over the difference array at the end rebuilds the final values. It is a prefix sum run in reverse: updates in O(1) each, one pass to read.`
      }
    ],

    breakdown: [
      {
        title: `1. The slow idea: add the range every time`,
        body: `Suppose you have \`[3, 1, 4, 1, 5]\` and are asked for the sum of positions 1 to 3, then 0 to 4, then 2 to 3, and thousands more. Each answer loops over the range and adds. That is O(n) per question. With 100,000 numbers and 100,000 questions it is 10 billion additions. The waste is clear: the questions overlap heavily, and you re-add the same numbers over and over. Compute the totals once, then reuse them.`
      },
      {
        title: `2. Running totals: the prefix array`,
        body: `Walk the array once and write down the total so far, starting with 0 for "nothing yet". For \`[3, 1, 4, 1, 5]\` you get \`prefix = [0, 3, 4, 8, 9, 14]\`. Meaning: \`prefix[i]\` is the sum of the first i numbers. The sum of positions l to r (both included) is everything up to r minus everything before l: \`prefix[r + 1] - prefix[l]\`. Check positions 1 to 3: 9 - 3 = 6, and 1+4+1 = 6. Build is O(n); every query is O(1).`,
        code: { py: `def build_prefix(nums):
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    return prefix

def range_sum(prefix, l, r):    # nums[l..r], both included
    return prefix[r + 1] - prefix[l]` }
      },
      {
        title: `3. Flip it: a subarray sum is a difference of two prefixes`,
        body: `Now ask a different question: how many subarrays sum to exactly k? A subarray from j to i has sum \`prefix[i + 1] - prefix[j]\`. It equals k exactly when \`prefix[j] = prefix[i + 1] - k\`. So for each new running total, you need to know how many earlier prefixes equal "running minus k". Keep a dict from prefix value to how many times it has appeared. Try \`[1, 2, 3]\`, k = 3: running totals 1, 3, 6. At total 3 you look for 0 (the empty prefix, seen once): one hit. At total 6 you look for 3 (seen once): another. Answer 2.`
      },
      {
        title: `4. The three details that cause bugs`,
        body: `First, seed the dict with \`{0: 1}\` so a subarray that starts at index 0 matches the empty prefix. Second, look up **before** you store the current total, so you never count an empty subarray. Third, store counts (not just "seen") when the question asks how many, and store the **first index** when it asks for the longest: the earliest sighting gives the longest stretch, so never overwrite it. Edge cases: k = 0, zeros in the data, negative numbers, a single element.`,
        code: { py: `def count_sum_k(nums, k):
    seen = {0: 1}               # the empty prefix
    running = count = 0
    for x in nums:
        running += x
        count += seen.get(running - k, 0)     # look up first
        seen[running] = seen.get(running, 0) + 1   # then store
    return count` }
      },
      {
        title: `5. The same trick in disguise`,
        body: `Any "balance" can play the role of the running sum. Equal numbers of 0s and 1s: count a 0 as -1 and a 1 as +1, and a balanced stretch is one whose balance returns to an earlier value. Divisible by k: store the running sum modulo k, and two equal remainders mean the stretch between is a multiple of k. The product of everything except the current element: a prefix product from the left times a suffix product from the right. Spot the shape: "subarray", "exactly", and the possibility of negative numbers or a count.`
      },
      {
        title: `6. Range updates and grids`,
        body: `Updates instead of queries: "add v to positions l..r", many times, then read everything. Write \`+v\` at \`diff[l]\` and \`-v\` at \`diff[r + 1]\`, then one running sum over \`diff\` gives the final array. The +v switches the addition on at l and the -v switches it off after r. In a grid, store at each cell the sum of the rectangle from the top-left corner to it; any rectangle is then four lookups: whole block, minus the strip above, minus the strip to the left, plus the corner removed twice. Costs: build O(n), queries O(1), memory O(n).`
      }
    ],

    drills: [
      {
        title: `How many a's in this stretch?`,
        q: `A string contains only the letters \`'a'\` and \`'b'\`. You get many queries \`(l, r)\`, both ends included. For each, report how many \`'a'\` characters lie in \`s[l..r]\`. Return the answers as a list.\n\nExample: \`"abbaab"\` with queries \`[(0, 3), (1, 2), (3, 5)]\` returns \`[2, 0, 2]\`.`,
        hint: `Prefix sums work for counts too: store how many a's appear in the first i characters.`,
        how: `I restate it: for each query count the a's in a substring. Brute force scans the substring for every query, O(length) each. With many queries on one fixed string, that repeats work. A count of a's is just a sum of 1s and 0s, so a prefix sum applies. Let \`pre[i]\` be the number of a's among the first i characters, with \`pre[0] = 0\`. Then the number of a's in \`s[l..r]\` is \`pre[r + 1] - pre[l]\`. Build it once in O(n) and every query is one subtraction. Trace "abbaab": pre = [0, 1, 1, 1, 2, 3, 3]. Query (0, 3): pre[4] - pre[0] = 2. Query (1, 2): pre[3] - pre[1] = 0. Query (3, 5): pre[6] - pre[3] = 2. Matches the expected list. Edge cases: a query on a single character (l = r), a query that starts at 0 (the leading zero handles it without a special case), a string without any a's, and an empty query list. Cost: O(n) to build, O(1) per query, O(n) space.`,
        code: { py: `def count_a_queries(s, queries):
    pre = [0]
    for ch in s:
        pre.append(pre[-1] + (ch == 'a'))
    return [pre[r + 1] - pre[l] for l, r in queries]` },
        explain: `\`pre[i]\` counts the a's in \`s[:i]\`, so the a's in \`s[l..r]\` are the ones before \`r + 1\` minus the ones before \`l\`. The leading zero makes \`l = 0\` work with no special case. O(n + q) time and O(n) space.`,
        check: `assert count_a_queries("abbaab", [(0, 3), (1, 2), (3, 5)]) == [2, 0, 2]
assert count_a_queries("a", [(0, 0)]) == [1]
assert count_a_queries("b", [(0, 0)]) == [0]
assert count_a_queries("aaaa", [(0, 3), (1, 1)]) == [4, 1]
assert count_a_queries("abab", []) == []
import random
for _ in range(200):
    s = ''.join(random.choice('ab') for _ in range(random.randint(1, 12)))
    qs = []
    for _ in range(6):
        l = random.randrange(len(s)); r = random.randrange(l, len(s)); qs.append((l, r))
    assert count_a_queries(s, qs) == [s[l:r + 1].count('a') for l, r in qs]`
      },
      {
        title: `Busiest moment`,
        q: `A shop logs bookings as \`(start, end, guests)\`, meaning \`guests\` people are present at every integer minute from \`start\` to \`end\` inclusive, within minutes \`0..n-1\`. Return the largest number of guests present at any single minute.\n\nExample: \`n = 6\`, bookings \`[(0, 2, 3), (1, 4, 2), (4, 5, 5)]\` returns \`7\` (minute 4 has 2 + 5).`,
        hint: `Do not add guests to every minute. Mark the start and one past the end, then take one running sum.`,
        how: `I restate it: many ranges each add a number of guests to a stretch of minutes; find the largest total at any minute. Brute force loops over every minute of every booking, O(bookings × n). I only need to read the result once, after all bookings, which is the signal for a difference array. For each booking write \`+guests\` at \`start\` and \`-guests\` at \`end + 1\`, so the effect switches on at the start and off right after the end. I allocate n + 1 slots so \`end + 1\` never falls off the array when end is the last minute. A running sum over the difference array rebuilds the number of guests per minute; the maximum of that is the answer. Trace n = 6: diff gets +3 at 0, -3 at 3, +2 at 1, -2 at 5, +5 at 4, -5 at 6. Running sums: 3, 5, 5, 2, 7, 5. The maximum is 7 at minute 4. Edge cases: no bookings returns 0; a booking covering the whole day; bookings stacked on one minute. Cost: O(n + bookings) time, O(n) space.`,
        code: { py: `def busiest_minute(n, bookings):
    diff = [0] * (n + 1)
    for start, end, guests in bookings:
        diff[start] += guests
        diff[end + 1] -= guests
    best = running = 0
    for i in range(n):
        running += diff[i]
        best = max(best, running)
    return best` },
        explain: `The difference array holds the change in occupancy at each minute, so its running sum is the occupancy itself. The spare last slot absorbs the switch-off of a booking that ends at minute n - 1. O(n + bookings) time, O(n) space.`,
        check: `assert busiest_minute(6, [(0, 2, 3), (1, 4, 2), (4, 5, 5)]) == 7
assert busiest_minute(3, []) == 0
assert busiest_minute(1, [(0, 0, 4)]) == 4
assert busiest_minute(5, [(0, 4, 1), (0, 4, 1)]) == 2
assert busiest_minute(4, [(1, 1, 9), (2, 3, 4)]) == 9
import random
for _ in range(200):
    n = random.randint(1, 10)
    bs = []
    for _ in range(random.randint(0, 6)):
        a = random.randrange(n); b = random.randrange(a, n); bs.append((a, b, random.randint(1, 5)))
    arr = [0] * n
    for a, b, g in bs:
        for i in range(a, b + 1):
            arr[i] += g
    assert busiest_minute(n, bs) == max(arr)`
      },
      {
        title: `Longest stretch that adds up exactly`,
        q: `Given a list of integers (positive, negative or zero) and a target k, return the length of the longest contiguous stretch whose sum is exactly k, or \`0\` if there is none.\n\nExample: \`[1, -1, 5, -2, 3]\`, k = 3 returns \`4\` (the stretch 1, -1, 5, -2).`,
        hint: `Keep the first index where each prefix sum appeared, and look for \`running - k\`.`,
        how: `I restate it: longest contiguous run summing to exactly k, with negatives allowed. Brute force tries every start and end with a running sum, O(n²). A sliding window does not work, because negatives mean the sum does not move one way as the window grows. So use prefix sums. The stretch from j to i sums to k when \`prefix[j] = prefix[i + 1] - k\`. Walking left to right with a running sum, I need the **earliest** earlier prefix equal to \`running - k\`, because the earliest start makes the longest stretch. So the dict stores prefix value to its first index, and I never overwrite it. Seed it with \`{0: -1}\`: the empty prefix sits just before index 0, so a stretch starting at the beginning has length \`i - (-1)\`. Trace \`[1, -1, 5, -2, 3]\`, k = 3: running sums 1, 0, 5, 3, 6. At index 3 the running sum is 3, so I look for 0. The sum 0 appears at index 1 and also at the seed position -1, and the map keeps the earliest, -1, so the length is 3 - (-1) = 4 (the stretch 1, -1, 5, -2). Answer 4. Edge cases: no stretch (0), zeros, a single element equal to k. Cost: O(n) time, O(n) space.`,
        code: { py: `def longest_sum_k(nums, k):
    first = {0: -1}             # prefix sum -> earliest index it appeared
    running = best = 0
    for i, x in enumerate(nums):
        running += x
        if running - k in first:
            best = max(best, i - first[running - k])
        if running not in first:
            first[running] = i
    return best` },
        explain: `The stretch ending at i and starting right after index \`first[running - k]\` sums to k. Using the earliest index gives the longest such stretch for that ending. Never overwriting a stored index keeps the earliest. O(n) expected time, O(n) space.`,
        check: `assert longest_sum_k([1, -1, 5, -2, 3], 3) == 4
assert longest_sum_k([-2, -1, 2, 1], 1) == 2
assert longest_sum_k([], 0) == 0
assert longest_sum_k([5], 5) == 1
assert longest_sum_k([1, 2, 3], 100) == 0
assert longest_sum_k([0, 0, 0], 0) == 3
import random
for _ in range(300):
    a = [random.randint(-4, 4) for _ in range(random.randint(0, 10))]
    k = random.randint(-5, 5)
    brute = max([j - i for i in range(len(a)) for j in range(i + 1, len(a) + 1) if sum(a[i:j]) == k], default=0)
    assert longest_sum_k(a, k) == brute`
      },
      {
        title: `Best block in a grid`,
        q: `Given a grid of integers and block dimensions \`h × w\`, return the largest sum over all contiguous \`h × w\` blocks. Assume the block fits inside the grid.\n\nExample: \`[[1, 2, 3], [4, 5, 6], [7, 8, 9]]\` with \`h = 2, w = 2\` returns \`28\` (the bottom-right block 5, 6, 8, 9).`,
        hint: `Pad a 2D prefix table with a zero row and column, then use four lookups per block.`,
        how: `I restate it: slide an h by w rectangle over the grid and find the biggest total. Brute force adds up h·w cells for every position, O(rows·cols·h·w). Each block overlaps its neighbours heavily, so I want any rectangle sum in O(1). That is a 2D prefix sum: \`P[r][c]\` is the sum of all cells in rows above r and columns left of c, with a zero row and zero column of padding. Build it by inclusion-exclusion: \`P[r+1][c+1] = cell + P[r][c+1] + P[r+1][c] - P[r][c]\`, where the last term removes the overlap that the two neighbours both counted. A block with top-left (r, c) and size h by w has sum \`P[r+h][c+w] - P[r][c+w] - P[r+h][c] + P[r][c]\`: the big region, minus the strip above, minus the strip on the left, plus the corner that was subtracted twice. Trace the 3 by 3 example: the bottom-right block gives 5+6+8+9 = 28. Edge cases: a block as big as the grid, a 1 by 1 block (the maximum cell), negative numbers. Cost: O(rows·cols) time and space.`,
        code: { py: `def best_block(grid, h, w):
    rows, cols = len(grid), len(grid[0])
    P = [[0] * (cols + 1) for _ in range(rows + 1)]
    for r in range(rows):
        for c in range(cols):
            P[r + 1][c + 1] = grid[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c]
    best = None
    for r in range(rows - h + 1):
        for c in range(cols - w + 1):
            total = P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c]
            if best is None or total > best:
                best = total
    return best` },
        explain: `Inclusion-exclusion makes \`P\` correct: the cell, plus the block above, plus the block to the left, minus the overlap both counted. The same four-term formula extracts any rectangle. Building and scanning are both O(rows·cols), and the table uses the same amount of memory.`,
        check: `assert best_block([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 2, 2) == 28
assert best_block([[5]], 1, 1) == 5
assert best_block([[-1, -2], [-3, -4]], 1, 1) == -1
assert best_block([[1, 2, 3]], 1, 3) == 6
assert best_block([[1, -5], [-5, 1]], 2, 2) == -8
import random
for _ in range(200):
    R = random.randint(1, 5); C = random.randint(1, 5)
    g = [[random.randint(-5, 5) for _ in range(C)] for _ in range(R)]
    h = random.randint(1, R); w = random.randint(1, C)
    brute = max(sum(g[i][j] for i in range(r, r + h) for j in range(c, c + w)) for r in range(R - h + 1) for c in range(C - w + 1))
    assert best_block(g, h, w) == brute`
      }
    ],

    how: {
      1480: `I restate it: return an array where each position holds the sum of everything up to and including that position. This is the prefix-sum array itself, so there is almost nothing to discover; what I want to say in an interview is the idea. Brute force sums from the start for every index, O(n²). The observation is that each answer is the previous answer plus the current number, so one running total does it. Keep \`total\`, add each element, append the total to the output. Trace \`[1, 2, 3, 4]\`: totals 1, 3, 6, 10. If I may modify the input I can write the totals back into it and use O(1) extra space; here I build a new list since it is cleaner and the output is required anyway. Edge cases: a single element returns itself; negative numbers work unchanged; an empty list returns an empty list. Cost: O(n) time, O(1) extra space beyond the output. I would mention that this same array is the building block for range-sum queries: later problems differ by subtracting two entries.`,
      303: `I restate it: build an object from an array; it then answers many queries for the sum of positions left to right. Brute force sums the range for each call, O(n) per query, which is too slow if there are many queries. The array never changes, so I can pay once to precompute running totals. In the constructor I build \`prefix\` with a leading zero, where \`prefix[i]\` is the sum of the first i numbers. Then \`sumRange(left, right)\` is \`prefix[right + 1] - prefix[left]\`, a single subtraction. The leading zero matters: without it a query starting at 0 needs a special case. Trace \`[-2, 0, 3, -5, 2, -1]\`: prefix is [0, -2, -2, 1, -4, -2, -3]. Query (0, 2): prefix[3] - prefix[0] = 1. Query (2, 5): prefix[6] - prefix[2] = -3 - (-2) = -1. Edge cases: a single element; left equal to right. Cost: O(n) to construct, O(1) per query, O(n) space. If the array could change between queries, I would say a Fenwick tree is the right upgrade.`,
      724: `I restate it: find the leftmost index where the sum of everything to its left equals the sum of everything to its right; the index itself is not included in either side. Brute force sums both sides for every index, O(n²). I know the total. If the left sum is L and the element is x, then the right sum is \`total - L - x\`. So I only need a running left sum. Walk left to right: at index i, check whether \`left == total - left - nums[i]\`; if so return i; otherwise add \`nums[i]\` to left. The first index that matches is the leftmost. This is a prefix sum with the other side obtained by subtraction, so no second array is needed. Trace \`[1, 7, 3, 6, 5, 6]\`, total 28: at index 3, left is 11 and 28 - 11 - 6 = 11, a match. Edge cases: index 0 works when everything after sums to 0 (left is 0); no pivot returns -1; a single element is a pivot (both sides are empty and equal to 0). Cost: O(n) time, O(1) space.`,
      2270: `I restate it: count the ways to cut the array into a non-empty left part and a non-empty right part such that the left sum is at least the right sum. Brute force sums both parts for each cut, O(n²). The right sum is always \`total - left\`, so a running left sum is enough. Loop over cut positions: after including \`nums[i]\` in the left, the right part is everything after i. The right part must be non-empty, so i runs only up to n - 2. At each i, if \`left >= total - left\` add one to the count. Trace \`[10, 4, -8, 7]\`, total 13: cut after index 0: left 10, right 3, counts; cut after 1: left 14, right -1, counts; cut after 2: left 6, right 7, does not count. Answer 2. Edge cases: two elements gives at most one cut; negative numbers and zeros are fine because I compare sums, not signs; the last index is excluded so the right part is never empty. Cost: O(n) time, O(1) space.`,
      560: `I restate it: count the contiguous non-empty subarrays whose sum is exactly k; numbers may be negative. Brute force tries every start and end with a running sum, O(n²), about 2·10⁸ pairs at the real limit, too slow in Python. A sliding window fails because negatives break monotonicity. The subarray from j to i sums to \`prefix[i + 1] - prefix[j]\`, which equals k exactly when \`prefix[j] = prefix[i + 1] - k\`. So as I scan, at each position I ask how many earlier prefixes equal \`running - k\`. A dict maps prefix value to how many times it has appeared. Seed with \`{0: 1}\` for the empty prefix so subarrays starting at index 0 count. Order matters: look up first, then store, so I never count an empty subarray. Trace \`[1, 1, 1]\`, k = 2: running 1 (look up -1, none), 2 (look up 0, found once, count 1), 3 (look up 1, found once, count 2). Answer 2. Edge cases: k = 0 with zeros, negative k. Cost: O(n) expected time, O(n) space.`,
      525: `I restate it: in a 0/1 array, find the longest contiguous stretch with the same number of 0s and 1s. Brute force counts both for every start and end, O(n²). Recast it: turn each 0 into -1. A stretch with equal counts then sums to zero, and a stretch sums to zero exactly when two prefix balances are equal. I want the longest, so for each balance I remember only the **first** index where it appeared and never overwrite it: the earliest sighting gives the longest stretch back from the current index. Seed the map with balance 0 at index -1, the position just before the array, so a balanced stretch starting at index 0 has length \`i - (-1)\`. When the current balance has been seen, update the best with \`i - first[balance]\`; otherwise store it. Trace \`[0, 1, 0]\`: balances -1, 0, -1. At index 1 balance 0 was seen at -1, length 2. At index 2 balance -1 was seen at 0, length 2. Answer 2. Edge cases: no balanced stretch gives 0. Cost: O(n) time, O(n) space.`,
      238: `I restate it: for each index, the product of all the other elements; no division; O(n). Brute force multiplies the others for each index, O(n²). Dividing the total by the element is not allowed and also breaks on zeros. The observation: the answer at i is the product of everything to its left times the product of everything to its right. Those are a prefix product and a suffix product. First pass, left to right, keeping a running \`left\` product starting at 1: store it in \`out[i]\` before multiplying in \`nums[i]\`. Second pass, right to left, with a running \`right\` product starting at 1: multiply \`out[i]\` by it, then multiply \`right\` by \`nums[i]\`. Reusing the output array for the left products means no extra array. Trace \`[1, 2, 3, 4]\`: left products 1, 1, 2, 6; then multiplying by the right products 24, 12, 4, 1 gives \`[24, 12, 8, 6]\`. Zeros need no special case, because the products are built, not divided. Cost: O(n) time, O(1) extra space beyond the output.`,
      523: `I restate it: is there a contiguous subarray of at least two elements whose sum is a multiple of k? Brute force tries every start and end, O(n²). Two prefix sums with the same remainder mod k bracket a stretch whose sum is a multiple of k, since the difference of two numbers with the same remainder is divisible by k. So scan with a running sum mod k and remember the **first index** where each remainder appeared. When the current remainder was seen before at index j, the stretch is j + 1 through i, with length \`i - j\`; I need length at least 2, so require \`i - j >= 2\`. Do not overwrite the stored index when it is seen again, because the earliest index makes the longest stretch. Seed with remainder 0 at index -1 so a stretch from the start works. Trace \`[23, 2, 4, 6, 7]\`, k = 6: remainders 5, 1, 5, 5, 0. At index 2 remainder 5 was seen at 0, length 2, true. Edge cases: a single element is never enough; zeros like \`[0, 0]\` work. Cost: O(n) time, O(min(n, k)) space.`,
      974: `I restate it: count subarrays whose sum is divisible by k; numbers may be negative. Brute force is O(n²). Two prefix sums leave the same remainder mod k exactly when the stretch between them sums to a multiple of k. So instead of looking for \`running - k\`, I look for the same remainder as now. Keep a dict of how many times each remainder has appeared, seeded with remainder 0 seen once. At each element, update the running remainder, add the count of earlier prefixes with that remainder, then record the current one. Look up before storing, as always. In Python the % operator already returns a value from 0 to k - 1 for a positive k, even for negative sums; in Java, C++ or JavaScript I would normalise with \`((x % k) + k) % k\` because a negative remainder would never match its positive twin. Trace \`[4, 5, 0, -2, -3, 1]\`, k = 5: remainders 4, 4, 4, 2, 4, 0 give 7 matches. Cost: O(n) time, O(k) space.`,
      930: `I restate it: count subarrays of a 0/1 array whose sum equals goal. This is Subarray Sum Equals K with k = goal, so I can reuse the template. Brute force is O(n²). A sliding window also works here because the values are non-negative, but zeros make the window version fiddly (a run of zeros can extend a valid window in several ways). The prefix-sum map has no such trouble. Keep a running sum and a dict of how many times each prefix has been seen, seeded with {0: 1}. For each element, add the count stored under \`running - goal\`, then record the running sum. Look up before storing. Trace \`[1, 0, 1, 0, 1]\`, goal 2: running sums 1, 1, 2, 2, 3. At running 2 (index 2) look up 0: once, count 1. At running 2 again (index 3) look up 0: once more, count 2. At running 3 (index 4) look up 1: seen twice, count 4. Answer 4. Edge case: goal 0 must count runs of zeros, which works because the seed 0 and repeated prefixes are counted. Cost: O(n) time, O(n) space.`,
      1248: `I restate it: count subarrays containing exactly k odd numbers. Brute force counts odds in every subarray, O(n²). Only parity matters, so map each number to 1 if it is odd and 0 if even. Now the question is "count subarrays whose sum is exactly k" on a 0/1 array, which is the standard prefix-sum count. Keep a running count of odd numbers seen so far and a dict of how many times each running count has appeared, seeded with {0: 1}. At each element, update the count of odds, add the stored count for \`odds - k\`, then record the current count. Trace \`[1, 1, 2, 1, 1]\`, k = 3: odd counts 1, 2, 2, 3, 4. At 3, look up 0: once, count 1. At 4, look up 1: once, count 2. Answer 2. Notice the even numbers do not change the count, so several starting points can share the same prefix value, which the dict counts correctly. Edge cases: k greater than the number of odds gives 0; an all-even list gives 0 for k at least 1. Cost: O(n) time, O(n) space.`,
      1094: `I restate it: a car with a seat capacity drives past stops in increasing order; each trip picks up some passengers at one stop and drops them at a later one; can it carry everyone without ever exceeding the capacity? Brute force simulates every stop for every trip, O(trips × stops). I only need the load at each stop, and I read it after processing all the trips: a difference array. For each trip write \`+passengers\` at the pick-up stop and \`-passengers\` at the drop-off stop. Passengers leaving at a stop free their seats at that stop, before the next pick-up there, so the minus applies at the drop-off index, not after it. Sweep the stops with a running total; if it ever exceeds the capacity, return false. Trace trips \`[(2, 1, 5), (3, 3, 7)]\` with capacity 4: stop 1 adds 2, stop 3 adds 3 for a load of 5, which exceeds 4, so false. Edge cases: the array size comes from the largest stop (1001 entries here); pick-up and drop-off at the same stop. Cost: O(trips + stops) time, O(stops) space.`,
      1109: `I restate it: each booking reserves some seats on every flight from first to last; return the total reserved on each flight. Brute force adds the seats to each flight in each booking's range, O(bookings × n). I read the answer once at the end, which says difference array. For a booking write \`+seats\` at the first flight and \`-seats\` just after the last. Flights are numbered from 1 but arrays start at 0, so the plus goes to \`diff[first - 1]\` and the minus to \`diff[last]\`, which is the slot just past the range in 0-based terms. The array has n + 1 slots so a booking ending on flight n still has a place to write its switch-off. A running sum over the first n slots gives each flight's total. Trace \`[[1,2,10],[2,3,20],[2,5,25]]\`, n = 5: diff becomes [10, 45, -10, -20, 0, -25] and the running sums over the first five slots are \`[10, 55, 45, 25, 25]\`. Edge cases: a single-flight booking; bookings that all end on flight n. Cost: O(n + bookings) time, O(n) space.`,
      304: `I restate it: build an object from a matrix that answers many "sum of this rectangle" queries. Brute force adds every cell in the rectangle per query, O(rows × cols). The matrix never changes, so precompute a 2D prefix table. Pad with a row and column of zeros so \`P[r][c]\` is the sum of all cells in rows before r and columns before c. Build it by inclusion-exclusion: a cell's block equals the cell, plus the block above it, plus the block to its left, minus the overlap that both of those counted. Then a rectangle with corners (row1, col1) and (row2, col2) is the whole block up to the bottom-right corner, minus the strip above, minus the strip to the left, plus the top-left corner that was subtracted twice: \`P[row2+1][col2+1] - P[row1][col2+1] - P[row2+1][col1] + P[row1][col1]\`. Trace on a 2 by 2 grid \`[[1,2],[3,4]]\`: the full-grid query is P[2][2] = 10. Edge cases: a single cell; a query on the first row or column (the padding handles it). Cost: O(rows × cols) to build, O(1) per query.`
    }
  };
})();
