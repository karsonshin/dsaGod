(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['lis'] = {
    primer: {
      kind: 'technique',
      what: `A **longest increasing subsequence** (LIS) is the longest list of values you can pick from a sequence, left to right, skipping freely but never reordering, so that each pick is bigger than the one before. Think of crossing a river on stepping stones where you may only step onto higher stones and may ignore any stone you like.`,
      does: `It solves "longest chain where every pick must beat the previous pick, and the picks need not be neighbours". The simple dynamic program costs O(n²); a smarter version with a binary search costs O(n log n). It also answers "fewest removals to make it sorted" (n minus LIS).`,
      impl: `Quadratic version: \`dp[i]\` is the best length **ending exactly at index i**, equal to 1 plus the best \`dp[j]\` over earlier \`j\` with a smaller value. Fast version: keep a sorted list \`tails\` where \`tails[k]\` is the smallest possible last value of an increasing subsequence of length k+1, and use \`bisect_left\` to append or overwrite one slot per value.`,
      possibilities: `Fewest deletions to make a list strictly increasing, nesting envelopes or boxes (sort one side, LIS on the other), counting how many longest subsequences exist, the longest chain of pairs, longest up-then-down (bitonic) run, maximum-sum increasing subsequence, and rebuilding the actual subsequence with parent pointers.`
    },

    think: [
      {
        q: `Run the tails algorithm by hand on \`[4, 10, 4, 3, 8, 9]\` (strictly increasing). What is \`tails\` after each number, and what is the answer?`,
        a: `4 gives \`[4]\`. 10 gives \`[4, 10]\`. The second 4 finds the first tail that is at least 4, which is slot 0, so it overwrites 4 with 4: \`[4, 10]\`. 3 overwrites slot 0: \`[3, 10]\`. 8 overwrites 10: \`[3, 8]\`. 9 is bigger than everything, so it appends: \`[3, 8, 9]\`. The answer is 3. The aha: most steps *replace* rather than grow, and a replacement never shortens anything, it only makes a future extension easier.`
      },
      {
        q: `An O(n²) solution fills \`dp\` for \`[1, 2, 3, 0]\` and returns \`dp[-1]\`. What does it return and why is that wrong?`,
        a: `\`dp\` is \`[1, 2, 3, 1]\`, so it returns 1, but the answer is 3. \`dp[i]\` only counts subsequences that end **exactly at i**, and the best one (1, 2, 3) ends at index 2, not at the last index. The fix is \`max(dp)\`. Whenever a table is defined as "ending at i", the answer is the best over all i unless the problem forces the end.`
      },
      {
        q: `Why is the \`tails\` array always sorted, so a binary search is legal?`,
        a: `Suppose some \`tails[k] >= tails[k+1]\`. The subsequence of length k+2 that ends at \`tails[k+1]\` has a prefix of length k+1 whose last value is smaller than \`tails[k+1]\`, and so smaller than \`tails[k]\`. That prefix is a length-(k+1) subsequence ending below \`tails[k]\`, which contradicts \`tails[k]\` being the *smallest* such ending. So the array is strictly increasing, and binary search works.`
      },
      {
        q: `Input \`[5, 5, 5]\`. What should a strictly increasing LIS return? A non-decreasing one? Which binary-search bound does each use?`,
        a: `Strictly increasing returns 1 (equal values cannot extend each other) and uses a lower bound: find the first tail that is at least x, so an equal value overwrites its twin. Non-decreasing returns 3 and uses an upper bound: find the first tail strictly greater than x, so an equal value lands after its twin and appends. In Python these are \`bisect_left\` and \`bisect_right\`. Read the statement for the word "strictly" before you pick.`
      },
      {
        q: `Why is "fewest items to delete so the list is strictly increasing" equal to n minus LIS?`,
        a: `Whatever you keep must form an increasing subsequence, because deleting items never reorders the rest. The most you can keep is therefore the LIS length, so the fewest deletions is n minus that. Conversely, deleting everything outside one longest increasing subsequence really does leave a sorted list. The aha: "minimum removals to reach a property" often equals "n minus the largest keepable set".`
      },
      {
        q: `Two envelopes are \`(3, 1)\` and \`(3, 2)\`. After sorting by width, why must ties be ordered by height descending before running LIS on heights?`,
        a: `With ascending ties the heights read 1, 2, which looks like an increase, so LIS would stack both even though their widths are equal and neither fits inside the other. With descending ties the heights read 2, 1, a decrease, so a strictly increasing run can pick at most one envelope of each width. The sort order is what turns the "both must be strictly smaller" rule into a plain one-dimensional LIS.`
      }
    ],

    breakdown: [
      {
        title: `1. Subsequence versus subarray, and the brute force`,
        body: `A **subsequence** keeps the original order but may skip items. A **subarray** must be contiguous. In \`[10, 9, 2, 5, 3, 7, 101, 18]\` the picks \`2, 3, 7, 18\` are a valid increasing subsequence even though \`5\` sits between 2 and 3 in the input. Brute force tries every subset of the n items: 2ⁿ of them, impossible past n of about 25. The question to ask next is the dynamic-programming one: does the best answer that ends at some position depend only on best answers that end earlier? Here it does, because to extend a chain you only need to know how long it is and what its last value is.`
      },
      {
        title: `2. Define the state in words`,
        body: `Let \`dp[i]\` be **the length of the longest strictly increasing subsequence that ends exactly at index i**, meaning \`nums[i]\` is its last element. "Exactly at i" is the important phrase: it forces every chain to have a known last value, which is what lets us decide whether the next number can extend it. Every subsequence ends somewhere, so the final answer is the best \`dp[i]\` over all i, not just the last entry. Write this sentence at the top of your solution in an interview; most bugs come from forgetting it.`
      },
      {
        title: `3. Write the recurrence and the base case`,
        body: `A chain ending at i is either just \`nums[i]\` alone (length 1), or a chain ending at some earlier j with \`nums[j] < nums[i]\`, plus \`nums[i]\`. So \`dp[i] = 1 + max(dp[j])\` over all \`j < i\` with \`nums[j] < nums[i]\`, and if no such j exists the max over an empty set counts as 0, giving 1. **Base case:** every \`dp[i]\` starts at 1, because one element alone is an increasing subsequence. Order of filling: left to right, since \`dp[i]\` only reads smaller indices. The answer is \`max(dp)\`.`
      },
      {
        title: `4. Fill the table by hand, cell by cell`,
        body: `Take \`nums = [10, 9, 2, 5, 3, 7, 101, 18]\`.\n\n| i | value | earlier smaller values (their dp) | dp[i] |\n|---|---|---|---|\n| 0 | 10 | none | 1 |\n| 1 | 9 | none | 1 |\n| 2 | 2 | none | 1 |\n| 3 | 5 | 2 (1) | 2 |\n| 4 | 3 | 2 (1) | 2 |\n| 5 | 7 | 2 (1), 5 (2), 3 (2) | 3 |\n| 6 | 101 | 10, 9, 2, 5, 3, 7 (best 3) | 4 |\n| 7 | 18 | 10, 9, 2, 5, 3, 7 (best 3) | 4 |\n\nThe row is \`1 1 1 2 2 3 4 4\`, and the answer is its maximum, 4.`,
        code: { py: `def lis_dp(nums):
    n = len(nums)
    dp = [1] * n
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp, default=0)` }
      },
      {
        title: `5. Cost, and where the table wastes effort`,
        body: `Each \`i\` scans every earlier \`j\`, so the cost is about n²/2 comparisons: **O(n²) time, O(n) space**. For n of 2,500 that is 3 million steps, fine; for n of 100,000 it is 5 billion, too slow. Look at the row \`1 1 1 2 2 3 4 4\` again. For a new value like 7 we scanned all earlier values, but we only needed to know one thing per length: *what is the smallest value any chain of that length can end with?* A smaller ending is never worse, because it lets more future numbers extend the chain. That single observation is the optimisation.`
      },
      {
        title: `6. The optimisation: keep only the smallest ending per length`,
        body: `Keep a list \`tails\` where \`tails[k]\` is the smallest last value of any increasing subsequence of length k+1. Process a value x: if x is bigger than every tail, it extends the longest chain, so **append**. Otherwise find the first tail that is at least x and **overwrite** it with x, a smaller ending for that length. On \`[10, 9, 2, 5, 3, 7, 101, 18]\`: \`[10]\`, \`[9]\`, \`[2]\`, \`[2, 5]\`, \`[2, 3]\`, \`[2, 3, 7]\`, \`[2, 3, 7, 101]\`, \`[2, 3, 7, 18]\`. Length 4, the same answer. Careful: \`tails\` is **not** the subsequence, only its length is meaningful.`,
        code: { py: `from bisect import bisect_left

def lis_fast(nums):
    tails = []
    for x in nums:
        i = bisect_left(tails, x)      # first tail >= x
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)` }
      },
      {
        title: `7. Why a binary search works, and strict versus non-decreasing`,
        body: `\`tails\` is always strictly increasing (see the question above), so "first tail at least x" is a binary search: O(log n) per value, **O(n log n)** total, O(n) space. Equal values decide the bound. Strict increase wants a **lower bound** (\`bisect_left\`) so that a repeat overwrites its twin. Non-decreasing wants an **upper bound** (\`bisect_right\`) so that a repeat appends. To get the actual subsequence, store indices in \`tails\` plus a \`parent\` array pointing to the index at slot \`lo - 1\` when each index is placed, then walk the parents back from the last tail.`
      },
      {
        title: `8. Spotting it, edge cases, and the usual twists`,
        body: `Spot it: "longest/most picks in order, each beating the previous", where picks need not touch. Edge cases: empty input (return 0, hence \`default=0\`), all equal (1 when strict), strictly decreasing (1), already sorted (n). Twists: **count** the longest ones (needs the O(n²) table with a count beside each length), **two-dimensional** items (sort one dimension, break ties against the LIS direction, LIS on the other), **pairs as intervals** (sometimes a greedy by right endpoint beats LIS), **bitonic** (an LIS from the left plus one from the right at every peak). Say the O(n²) version first, then offer the faster one.`
      }
    ],

    drills: [
      {
        title: `Fewest removals to sort strictly upward`,
        q: `Given a list of integers, return the minimum number of items you must delete so that the remaining items, in their original order, are strictly increasing.\n\nExample: \`[5, 1, 2, 7, 3, 4]\` returns \`2\` (delete the 5 and the 7, leaving 1, 2, 3, 4).`,
        hint: `What is the most items you can keep? Whatever you keep must itself be an increasing subsequence.`,
        how: `I restate it: remove as few items as possible so the rest, without reordering, climbs strictly. Brute force tries every subset to keep, 2ⁿ of them. The observation that unlocks it is that the kept items must form a strictly increasing subsequence, because deleting never reorders anything. So the most I can keep is the length of the longest increasing subsequence, and the fewest deletions is n minus that. The problem has quietly become LIS. I would first say the O(n²) table, then use the tails array for O(n log n): for each value, binary search the first tail that is at least the value (strict, so a lower bound) and overwrite it, or append when none exists. Trace \`[5, 1, 2, 7, 3, 4]\`: tails go \`[5]\`, \`[1]\`, \`[1, 2]\`, \`[1, 2, 7]\`, \`[1, 2, 3]\`, \`[1, 2, 3, 4]\`. The LIS is 4, so the answer is 6 - 4 = 2. Edge cases: an empty list gives 0; an already strictly increasing list gives 0; all equal values keep only one, so n - 1 removals. Cost: O(n log n) time, O(n) space for tails.`,
        code: { py: `from bisect import bisect_left

def min_removals_strict(nums):
    tails = []
    for x in nums:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(nums) - len(tails)` },
        explain: `Any set of kept items in original order must be strictly increasing, so at most LIS items survive, and keeping exactly one longest increasing subsequence achieves that. The tails array computes the LIS length with one binary search per item: O(n log n) time, O(n) space.`,
        check: `assert min_removals_strict([5, 1, 2, 7, 3, 4]) == 2
assert min_removals_strict([]) == 0
assert min_removals_strict([1, 2, 3]) == 0
assert min_removals_strict([4, 4, 4]) == 2
assert min_removals_strict([3, 2, 1]) == 2
import random
from itertools import combinations
for _ in range(200):
    a = [random.randint(0, 6) for _ in range(random.randint(0, 9))]
    best = 0
    for k in range(len(a), 0, -1):
        if any(all(s[i] < s[i + 1] for i in range(k - 1)) for s in combinations(a, k)):
            best = k
            break
    assert min_removals_strict(a) == len(a) - best`
      },
      {
        title: `Heaviest climbing sequence`,
        q: `Each item in a list has a positive weight. Pick items in their original order so each pick is strictly larger than the previous one, and maximize the **sum** of the picked values. Return that maximum sum (0 for an empty list).\n\nExample: \`[1, 101, 2, 3, 100, 4, 5]\` returns \`106\` (1 + 2 + 3 + 100).`,
        hint: `Same table as LIS, but dp[i] stores the best sum ending at i instead of the best length.`,
        how: `I restate it: it is an increasing subsequence again, but I am scored by total value rather than by count. That matters: a long chain of small numbers (1, 2, 3, 4, 5 sums to 15) can lose to a short chain with one huge number (1, 101 sums to 102, or 1, 2, 3, 100 sums to 106). The tails trick only remembers lengths and smallest endings, so it cannot track sums. I go back to the quadratic table. Define \`dp[i]\` as the maximum sum of a strictly increasing subsequence that ends exactly at i. A chain ending at i is either nums[i] alone, or the best chain ending at some earlier j with a smaller value, plus nums[i]. So \`dp[i] = nums[i] + max(0, dp[j] for j < i with nums[j] < nums[i])\`. Trace the example: dp is 1, 102, 3, 6, 106, 10, 15. The maximum is 106. Because weights are positive, extending a chain never hurts, but I still take the max over all i since the best chain can end anywhere. Edge cases: empty list returns 0; a single item returns itself. Cost: O(n²) time, O(n) space.`,
        code: { py: `def max_sum_increasing(nums):
    dp = []
    for i, x in enumerate(nums):
        best_before = 0
        for j in range(i):
            if nums[j] < x and dp[j] > best_before:
                best_before = dp[j]
        dp.append(x + best_before)
    return max(dp, default=0)` },
        explain: `dp[i] is the heaviest chain ending at i: x plus the heaviest chain among earlier, smaller endings (or nothing). The answer is the maximum over all endings. Two nested loops give O(n²) time and O(n) space. The length-oriented tails array cannot be used because a sum needs the whole chain's total, not just its length.`,
        check: `assert max_sum_increasing([1, 101, 2, 3, 100, 4, 5]) == 106
assert max_sum_increasing([]) == 0
assert max_sum_increasing([7]) == 7
assert max_sum_increasing([5, 4, 3]) == 5
assert max_sum_increasing([3, 2, 6, 4, 5, 1]) == 12
import random
from itertools import combinations
for _ in range(200):
    a = [random.randint(1, 9) for _ in range(random.randint(0, 9))]
    best = 0
    for k in range(1, len(a) + 1):
        for s in combinations(a, k):
            if all(s[i] < s[i + 1] for i in range(k - 1)):
                best = max(best, sum(s))
    assert max_sum_increasing(a) == best`
      },
      {
        title: `Longest mountain subsequence`,
        q: `Return the length of the longest subsequence that goes strictly up and then strictly down (the top may be the first or last item, so a purely rising or purely falling subsequence counts, and a single item counts).\n\nExample: \`[1, 11, 2, 10, 4, 5, 2, 1]\` returns \`6\` (1, 2, 10, 4, 2, 1).`,
        hint: `For each index, compute the longest rising chain ending there and the longest falling chain starting there.`,
        how: `I restate it: a subsequence shaped like a hill, strictly up then strictly down. Brute force tests every subset, 2ⁿ. The unlock is to fix the peak. If index i is the top, the left half is a longest increasing subsequence that ends at i, and the right half is a longest decreasing subsequence that starts at i, and the two halves do not interfere because they use different sides of i. So I compute \`inc[i]\` with the usual LIS table going left to right, and \`dec[i]\` with the mirrored table going right to left (longest strictly decreasing subsequence starting at i, equivalently the LIS of the reversed list). The best mountain with peak i has length \`inc[i] + dec[i] - 1\`, subtracting one because the peak is counted in both. Trace \`[1, 11, 2, 10, 4, 5, 2, 1]\`: at the 10, inc is 3 (1, 2, 10) and dec is 4 (10, 4, 2, 1), so 3 + 4 - 1 = 6. Taking the max over all peaks gives 6. Edge cases: an empty list returns 0; a sorted list gives n (peak at the end, dec is 1). Cost: two O(n²) tables, O(n²) time, O(n) space; with the tails trick for each half it can be O(n log n).`,
        code: { py: `def longest_mountain_subseq(nums):
    n = len(nums)
    inc = [1] * n
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i]:
                inc[i] = max(inc[i], inc[j] + 1)
    dec = [1] * n
    for i in range(n - 1, -1, -1):
        for j in range(i + 1, n):
            if nums[j] < nums[i]:
                dec[i] = max(dec[i], dec[j] + 1)
    return max((inc[i] + dec[i] - 1 for i in range(n)), default=0)` },
        explain: `With peak i fixed, the rising part is any increasing subsequence ending at i and the falling part is any decreasing subsequence starting at i, chosen independently, so the best is inc[i] + dec[i] - 1. Maximizing over i covers every mountain. Two quadratic tables: O(n²) time, O(n) space.`,
        check: `assert longest_mountain_subseq([1, 11, 2, 10, 4, 5, 2, 1]) == 6
assert longest_mountain_subseq([]) == 0
assert longest_mountain_subseq([5]) == 1
assert longest_mountain_subseq([1, 2, 3]) == 3
assert longest_mountain_subseq([3, 2, 1]) == 3
assert longest_mountain_subseq([2, 2, 2]) == 1
import random
from itertools import combinations
def ok(s):
    return any(all(s[i] < s[i + 1] for i in range(p)) and all(s[i] > s[i + 1] for i in range(p, len(s) - 1)) for p in range(len(s)))
for _ in range(200):
    a = [random.randint(0, 6) for _ in range(random.randint(0, 9))]
    best = 0
    for k in range(1, len(a) + 1):
        if any(ok(s) for s in combinations(a, k)):
            best = k
    assert longest_mountain_subseq(a) == best`
      },
      {
        title: `Largest divisibility group`,
        q: `Given distinct positive integers, return the size of the largest group you can pick in which, for every two members, one divides the other.\n\nExample: \`[3, 4, 16, 8]\` returns \`3\` (4, 8, 16). \`[1, 2, 3]\` returns \`2\`.`,
        hint: `Sort the numbers. After sorting, is it enough to check each new number against only the largest member of the group so far?`,
        how: `I restate it: pick as many numbers as possible so that every pair is related by divisibility. Brute force checks every subset against every pair, 2ⁿ times n². The unlock: divisibility is transitive. If a divides b and b divides c, then a divides c. So after sorting ascending, a group is valid exactly when each member divides the next one in sorted order, which means I only need to compare a new number to the **largest** member so far, the last one in the chain. That makes it an LIS in disguise: the "increase" relation is "is a multiple of". With \`dp[i]\` as the largest group whose biggest member is sorted[i], I get \`dp[i] = 1 + max(dp[j])\` over earlier j with \`sorted[i] % sorted[j] == 0\`, and the answer is the max of the row. Trace \`[3, 4, 16, 8]\` sorted to \`[3, 4, 8, 16]\`: dp is 1, 1, 2 (4 divides 8), 3 (8 divides 16, and dp[8] is 2). Answer 3. Edge cases: empty list gives 0; one number gives 1; pairwise coprime numbers above 1 give 1. Cost: sorting O(n log n) plus the table O(n²) time, O(n) space. The tails trick does not apply because divisibility is not a total order on values.`,
        code: { py: `def largest_divisible_group(nums):
    a = sorted(nums)
    dp = [1] * len(a)
    for i in range(len(a)):
        for j in range(i):
            if a[i] % a[j] == 0:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp, default=0)` },
        explain: `Divisibility is transitive, so a sorted chain where each member divides the next makes every pair divisible. dp[i] is the longest such chain ending at sorted[i], extended from any earlier divisor. The answer is the row maximum. O(n²) time after an O(n log n) sort, O(n) space.`,
        check: `assert largest_divisible_group([3, 4, 16, 8]) == 3
assert largest_divisible_group([1, 2, 3]) == 2
assert largest_divisible_group([]) == 0
assert largest_divisible_group([7]) == 1
assert largest_divisible_group([5, 7, 11]) == 1
assert largest_divisible_group([1, 2, 4, 8, 16]) == 5
import random
from itertools import combinations
for _ in range(150):
    a = random.sample(range(1, 40), random.randint(0, 8))
    best = 0
    for k in range(1, len(a) + 1):
        for s in combinations(a, k):
            if all(x % y == 0 or y % x == 0 for x, y in combinations(s, 2)):
                best = k
                break
    assert largest_divisible_group(a) == best`
      }
    ],

    how: {
      300: `I restate it: pick values left to right, skipping freely, each bigger than the last, and return the longest length. Brute force tries every subset, 2ⁿ. The first improvement is the table: \`dp[i]\` is the longest increasing subsequence ending exactly at i, equal to 1 plus the best dp[j] over earlier smaller values. That is O(n²) and I would say it first. The bottleneck is that I rescan all earlier values for each new one, but for each length I only care about one thing: the smallest value a chain of that length can end with, since a smaller ending is easier to extend. So I keep \`tails\`, where \`tails[k]\` is that smallest ending for length k+1. It is always strictly increasing, which lets me binary search. For each x I find the first tail that is at least x (a lower bound, because equal values must not extend each other). If there is none, x extends the longest chain, so I append. Otherwise I overwrite that tail with x. Trace \`[10, 9, 2, 5, 3, 7, 101, 18]\`: the tails become [10], [9], [2], [2,5], [2,3], [2,3,7], [2,3,7,101], [2,3,7,18], so the answer is 4. I would mention that tails is not itself a valid subsequence. Edge cases: one element, all equal (1), decreasing (1), empty (0). Cost: O(n log n) time, O(n) space.`,
      354: `I restate it: envelopes have a width and a height, and one fits into another only if both are strictly smaller. Return the longest nesting chain. Brute force sorts by width and runs the quadratic LIS-style table checking both dimensions, O(n²), too slow for large n. The bottleneck is checking two dimensions at once. If I sort by width ascending, any chain read in sorted order already has non-decreasing widths, so the remaining condition is that heights strictly increase: a one-dimensional LIS on the heights. The trap is equal widths: two envelopes of the same width cannot nest, but if they appear in ascending height order they look like an increase. So I sort ties by height **descending**, which makes equal-width envelopes read as a decrease and lets a strictly increasing run pick at most one of them. Then I run the tails algorithm with a lower bound on the heights. Trace \`[[5,4],[6,4],[6,7],[2,3]]\`: sorted becomes (2,3), (5,4), (6,7), (6,4); heights 3, 4, 7, 4. Tails: [3], [3,4], [3,4,7], then 4 overwrites slot 1, giving [3,4,7]. The answer is 3. Edge cases: one envelope gives 1; all identical gives 1. Cost: O(n log n) for the sort and the searches, O(n) space.`,
      673: `I restate it: count how many different strictly increasing subsequences have the maximum possible length; different positions count as different even with equal values. Brute force enumerates all subsets, 2ⁿ. The tails trick is out, because it deliberately throws away every ending except the smallest per length, and the count of ways is exactly the information that gets lost. So I return to the quadratic table and carry a second table beside it. \`length[i]\` is the longest increasing subsequence ending at i, and \`count[i]\` is how many subsequences achieve that length. For each earlier j with a smaller value there are two cases. If \`length[j] + 1\` is bigger than the current \`length[i]\`, I found a longer way, so I reset: length becomes \`length[j] + 1\` and \`count[i] = count[j]\`. If it equals \`length[i]\`, I found more ways to tie, so \`count[i] += count[j]\`. At the end I sum \`count[i]\` over every i whose length equals the global maximum, since the best chains can end at different places. Trace \`[1, 3, 5, 4, 7]\`: lengths are 1, 2, 3, 3, 4; counts 1, 1, 1, 1, and for 7 the two ways through 5 and 4 give 2. The answer is 2. Edge cases: all equal gives n, because each single item is a longest subsequence. Cost: O(n²) time, O(n) space.`,
      646: `I restate it: pairs (left, right) can be chained when the next pair's left is strictly greater than the previous pair's right; pick any subset in any order and return the longest chain. Brute force sorts by left and runs the quadratic LIS-style table, where the "increase" is that a pair's right is below the next pair's left. That already works in O(n²). The key observation is that this relation comes from intervals, which allows a greedy instead. Whichever pair I choose first, it is best to pick the one that **finishes earliest**, because that leaves the most room for everything after it. An exchange argument backs this up: in any optimal chain, swapping the first pair for the earliest-finishing pair keeps it valid. So I sort by right endpoint, keep the right end of the last chosen pair (start at negative infinity), and take each pair whose left is strictly greater than that end, updating it. Trace \`[[1,2],[2,3],[3,4]]\` sorted by right: take [1,2] (end 2); [2,3] starts at 2, not strictly greater, skip; [3,4] starts at 3, take. The answer is 2. Edge cases: one pair gives 1; touching endpoints do not chain. Cost: O(n log n) for the sort, O(1) extra space.`
    }
  };
})();
