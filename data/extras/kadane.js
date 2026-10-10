(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['kadane'] = {
    primer: {
      kind: 'technique',
      what: `Kadane's algorithm finds the best **contiguous** run of numbers by carrying one running balance and asking, at every step, "keep carrying it or start fresh?" Picture walking a road where each stop pays or charges you: you drop a balance that is not positive, because it can only drag you down.`,
      does: `It solves "best contiguous subarray" questions in one pass, O(n) time and O(1) space, even with negative numbers: the maximum sum, the minimum sum, the largest product, a circular array, or one allowed deletion. It does not count subarrays or hit exact targets.`,
      impl: `Keep \`cur\`, the best value of a run that **ends at the current index**, and \`best\`, the largest \`cur\` seen. For each x, \`cur = max(x, cur + x)\`, then \`best = max(best, cur)\`. Start both from \`nums[0]\`, not 0. In Python that is a \`for\` loop and the built-in \`max\`.`,
      possibilities: `Maximum subarray sum, maximum product subarray, best circular subarray, maximum absolute subarray sum, best subarray with one deletion, longest ascending run by sum, the best pair of non-overlapping subarrays, and any "extend or restart" dynamic program that needs only the last value.`
    },

    think: [
      {
        q: `Trace \`cur\` and \`best\` on \`[-2, 1, -3, 4, -1, 2, 1, -5, 4]\` using \`cur = max(x, cur + x)\` and say which stretch wins.`,
        a: `Start cur = best = -2. Then cur is 1 (restart), -2, 4 (restart), 3, 5, 6, 1, 5, and best ends at 6. The values of cur show a run building up from the 4: 4, -1, 2, 1 sums to 6. The aha: every time cur goes to zero or below, the old stretch is dropped and the next element starts a new one; best remembers the peak.`
      },
      {
        q: `All numbers are negative: \`[-3, -1, -2]\`. What does the algorithm return, and why must \`best\` start at \`nums[0]\` instead of 0?`,
        a: `Every step restarts (cur plus a negative number is worse than the element alone), so cur is -3, -1, -2 and best is -1, the largest single element. The subarray must be non-empty, so -1 is the right answer. If best started at 0, \`max(0, negative)\` would stay 0 and you would return the answer for an empty subarray, which does not exist here.`
      },
      {
        q: `Why is the restart rule "the carried balance is zero or negative", and not "the new element is negative"? Test it on \`[5, -1, 6]\`.`,
        a: `cur is 5, then 5 + (-1) = 4 (the -1 is negative but the carried 5 is positive, so extending wins), then 4 + 6 = 10. The answer 10 uses the negative element, because the 5 before it is worth keeping. A negative element is not a reason to restart; a carried balance that is not positive is, because it cannot help any later stretch.`
      },
      {
        q: `A friend suggests a sliding window: expand right, and shrink from the left whenever the sum drops. Find an input where this goes wrong.`,
        a: `Take \`[5, -4, 6]\`, answer 7 (the whole array). A rule like "shrink when the sum drops" would cut the 5 as soon as the -4 arrives, and the run 5, -4, 6 is never seen. Whether to give up the front depends on whether the carried balance is positive, not on whether the last step went down. There is no monotonic rule for when to shrink, so the right frame is "extend or restart", decided by the carried balance.`
      },
      {
        q: `For \`[-2, 3, -4]\` the best product subarray is 24? Walk through why a running maximum alone says 3.`,
        a: `Products: after the 3, the best product ending there is 3 and the worst is -6 (the -2 times 3). The next element is -4. Max times -4 gives -12, but the old minimum -6 times -4 gives 24. A running maximum alone throws away the -6 and never finds 24. For products, a very negative value is one negative factor away from being the best, so keep both the largest and smallest product ending here.`
      },
      {
        q: `A reviewer says "just return \`cur\` at the end". What does that return on \`[4, -10, 2]\`, and what should it return?`,
        a: `cur is 4, then max(-10, -6) = -6, then max(2, -4) = 2. Returning cur gives 2, but the best subarray is [4] with sum 4. cur is the best run ending **here**, not the best run overall. The answer is the maximum cur ever seen, which is why best exists.`
      }
    ],

    breakdown: [
      {
        title: `1. The slow idea: every start, every end`,
        body: `Take \`[-2, 1, -3, 4, -1, 2, 1, -5, 4]\` and find the best contiguous stretch. The slow way tries every starting point and extends to every ending point, keeping a running sum for each start: about n²/2 sums. For 100,000 numbers that is 5 billion. It works and you should say it first. Now look for waste: when you start at index 4 you re-add numbers that the start at index 3 already added. Is there a way to carry the work forward?`
      },
      {
        title: `2. Ask a smaller question: the best run ending here`,
        body: `Instead of "the best subarray overall", ask "the best subarray that **ends at index i**". There are only two choices for it: just the element alone, or the best run ending at i - 1 with the element added. So \`end[i] = max(nums[i], end[i - 1] + nums[i])\`. The answer overall is the largest \`end[i]\`, because the best subarray has to end somewhere. This is a tiny dynamic program: each value depends only on the one before it.`
      },
      {
        title: `3. Hand trace with real numbers`,
        body: `\`[2, -5, 3, 4]\`. i=0: end = 2. i=1: max(-5, 2-5) = -3 (restarting gives -5, extending gives -3, so extend). i=2: max(3, -3+3) = 3 (restart: the carried -3 is not worth keeping). i=3: max(4, 3+4) = 7. The ends are 2, -3, 3, 7, and the largest is 7, the stretch [3, 4]. Notice the restart at index 2: a carried balance of -3 would only subtract from the 3.`,
        code: { py: `def max_subarray(nums):
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)     # restart at x, or extend
        best = max(best, cur)
    return best` }
      },
      {
        title: `4. Throw away the table`,
        body: `Since \`end[i]\` only reads \`end[i - 1]\`, you do not need the whole array, just one variable: \`cur\`. Keep a second variable \`best\` for the largest \`cur\` so far. Rule of thumb for the restart: if \`cur\` before adding x is zero or less, then \`cur + x <= x\`, so restarting is at least as good. Initialise \`cur = best = nums[0]\` and loop from index 1. Cost: one pass, O(n) time, and two integers, O(1) space.`
      },
      {
        title: `5. Edge cases that bite`,
        body: `All negative: the answer is the largest single element (\`[-3, -1, -2]\` gives -1), which is why you start from \`nums[0]\` and not 0. A single element returns itself. Zeros are fine. If the problem allows an **empty** subarray, start both at 0 and use \`cur = max(0, cur + x)\`, so the answer is never negative. Read the statement for "non-empty" before you choose. To return the subarray itself, record \`start = i\` on every restart and copy \`(start, i)\` whenever \`cur\` beats \`best\`.`
      },
      {
        title: `6. Variations and how to spot them`,
        body: `Spot it by: "contiguous", "best/largest/smallest", and negatives that make the whole array a poor answer. If the score is a product, track the running max and min together because a negative flips them. If the array is circular, the best wrapping run is the total minus the smallest middle run, so run Kadane for the maximum and the minimum. If one deletion is allowed, carry two states per index. If the question asks how many subarrays or an exact target, it is a different tool: prefix sums with a hash map.`
      }
    ],

    drills: [
      {
        title: `The worst stretch`,
        q: `A shop records its daily profit or loss. Find the **smallest** total over any non-empty run of consecutive days (the worst stretch).\n\nExample: \`[3, -4, 2, -3, 1, -1]\` returns \`-5\` (the run -4, 2, -3).`,
        hint: `Mirror the usual algorithm: keep the worst run ending here, and restart when the carried balance is positive.`,
        how: `I restate it: the minimum sum over contiguous non-empty runs. Brute force tries every start and end, O(n²). It is the maximum-subarray problem with the sign flipped. Define \`cur\` as the smallest sum of a run that ends at the current day. Either the day alone is the worst run ending here, or I extend the worst run ending the day before. So \`cur = min(x, cur + x)\`: if the carried balance is positive it only raises my total, so I drop it and restart; if it is zero or negative I keep it. Keep \`best\` as the smallest \`cur\` seen. Start both from the first element so an all-positive list returns the smallest single element. Trace \`[3, -4, 2, -3, 1, -1]\`: cur is 3, -4 (restart gives -4 versus -1), -2, -5, -4, -5. The best is -5, the run -4, 2, -3. Edge cases: a single element; all positive numbers (the answer is the smallest element); all negative (the whole array). Cost: O(n) time, O(1) space. Equivalent trick: negate every number, run the usual Kadane, and negate the answer.`,
        code: { py: `def min_subarray(nums):
    cur = best = nums[0]
    for x in nums[1:]:
        cur = min(x, cur + x)
        best = min(best, cur)
    return best` },
        explain: `The recurrence \`end[i] = min(nums[i], end[i-1] + nums[i])\` is the maximum recurrence mirrored, so the same correctness argument applies: the worst run ending at i is either the element alone or the worst run ending one step back plus the element. The answer is the smallest of these. One pass, O(n) time, O(1) space.`,
        check: `assert min_subarray([3, -4, 2, -3, 1, -1]) == -5
assert min_subarray([5]) == 5
assert min_subarray([4, 2, 7]) == 2
assert min_subarray([-1, -2, -3]) == -6
assert min_subarray([0, 0]) == 0
import random
for _ in range(300):
    a = [random.randint(-6, 6) for _ in range(random.randint(1, 10))]
    brute = min(sum(a[i:j]) for i in range(len(a)) for j in range(i + 1, len(a) + 1))
    assert min_subarray(a) == brute`
      },
      {
        title: `At least two`,
        q: `Return the largest sum of a contiguous run that has **at least two** elements. You may assume the list has at least two numbers.\n\nExample: \`[-1, -2, 5]\` returns \`3\` (the run -2, 5). \`[4, -1]\` returns \`3\`.`,
        hint: `A run of length 2 or more is "some run ending one step back, plus this element". What do you already track that gives the best run ending one step back?`,
        how: `I restate it: the best sum over runs with two or more elements. Plain Kadane would happily return a single element, like the 5 in the example, which is not allowed. Brute force tries every start and every end at least one apart, O(n²). The observation: a run of length at least 2 ending at index i is a run of length at least 1 ending at i - 1, plus \`nums[i]\`. The best run of length at least 1 ending at i - 1 is exactly ordinary Kadane's \`cur\` from the previous step. So the best run of length at least 2 ending at i is \`cur_prev + nums[i]\`, and the answer is the maximum of that over i from 1 onward. I keep ordinary Kadane going alongside it. Order matters: compute the candidate from the old \`cur\`, then update \`cur\`. Trace \`[-1, -2, 5]\`: cur starts at -1. x = -2: candidate -1 + -2 = -3, then cur = max(-2, -3) = -2. x = 5: candidate -2 + 5 = 3, then cur = 5. The best candidate is 3. Edge cases: exactly two elements gives their sum; all negative gives the least bad pair run. Cost: O(n) time, O(1) space.`,
        code: { py: `def best_run_two_plus(nums):
    cur = nums[0]                     # best run ending at the previous index
    best = float('-inf')
    for x in nums[1:]:
        best = max(best, cur + x)     # that run, extended by x: at least two elements
        cur = max(x, cur + x)
    return best` },
        explain: `Any run with at least two elements ending at i is a non-empty run ending at i - 1 with \`nums[i]\` appended, and the best non-empty run ending at i - 1 is Kadane's \`cur\`. So \`cur + x\` is the best length-2-or-more run ending at i. Computing it before updating \`cur\` keeps the roles straight. O(n) time, O(1) space.`,
        check: `assert best_run_two_plus([-1, -2, 5]) == 3
assert best_run_two_plus([4, -1]) == 3
assert best_run_two_plus([-5, -6]) == -11
assert best_run_two_plus([1, 2, 3]) == 6
assert best_run_two_plus([5, -10, 5]) == 0
import random
for _ in range(300):
    a = [random.randint(-6, 6) for _ in range(random.randint(2, 10))]
    brute = max(sum(a[i:j]) for i in range(len(a)) for j in range(i + 2, len(a) + 1))
    assert best_run_two_plus(a) == brute`
      },
      {
        title: `Two separate stretches`,
        q: `Choose two non-empty contiguous stretches that do not overlap, so that the total of both is as large as possible. The first must end before the second begins. Return that total. You may assume at least two numbers.\n\nExample: \`[1, -3, 5, -2, 9, -8, 7]\` returns \`19\`: take \`[5, -2, 9]\` (12) and \`[7]\` (7).`,
        hint: `Choose a split point. What is the best stretch entirely on the left of it, and entirely on the right?`,
        how: `I restate it: pick two disjoint non-empty runs, left one before the right one, maximise the combined sum. Brute force tries all pairs of runs, O(n⁴), or O(n²) with some care. The two runs are separated somewhere: there is a split position such that the first run lies entirely in the prefix up to it and the second entirely in the suffix after it. For a fixed split, the best choice on each side is independent, so I need the best run inside each prefix and the best run inside each suffix. Both come from Kadane: sweep left to right keeping ordinary Kadane's \`cur\` and a running \`left_best[i]\`, the best run inside \`nums[:i+1]\`. Sweep right to left the same way to get \`right_best[i]\`, the best run inside \`nums[i:]\`. Then the answer is the maximum over splits i of \`left_best[i] + right_best[i + 1]\`. Trace the example: left_best is 1, 1, 5, 5, 12, 12, 12 and right_best is 12, 12, 12, 9, 9, 7, 7. The split after index 4 gives 12 + 7 = 19, the best. Edge cases: exactly two numbers uses both singly; all negative picks the two largest singles that are in order. Cost: O(n) time, O(n) space for the two arrays.`,
        code: { py: `def best_two_runs(nums):
    n = len(nums)
    left = [0] * n
    cur = best = nums[0]
    left[0] = best
    for i in range(1, n):
        cur = max(nums[i], cur + nums[i])
        best = max(best, cur)
        left[i] = best                 # best run inside nums[:i+1]
    right = [0] * n
    cur = best = nums[-1]
    right[-1] = best
    for i in range(n - 2, -1, -1):
        cur = max(nums[i], cur + nums[i])
        best = max(best, cur)
        right[i] = best                # best run inside nums[i:]
    return max(left[i] + right[i + 1] for i in range(n - 1))` },
        explain: `Any valid pair is separated by some split i with the first run inside \`nums[:i+1]\` and the second inside \`nums[i+1:]\`, so taking the best on each side and maximising over splits finds the optimum, and every candidate it considers is valid. Each side is one Kadane sweep. O(n) time, O(n) space.`,
        check: `assert best_two_runs([1, -3, 5, -2, 9, -8, 7]) == 19
assert best_two_runs([4, 5]) == 9
assert best_two_runs([-3, -1, -2]) == -3
assert best_two_runs([2, -100, 3]) == 5
assert best_two_runs([1, 1, 1, 1]) == 4
import random
for _ in range(300):
    a = [random.randint(-6, 6) for _ in range(random.randint(2, 9))]
    n = len(a)
    runs = [(i, j) for i in range(n) for j in range(i + 1, n + 1)]
    brute = max(sum(a[i:j]) + sum(a[k:l]) for (i, j) in runs for (k, l) in runs if j <= k)
    assert best_two_runs(a) == brute`
      }
    ],

    how: {
      1800: `I restate it: find the largest sum of a contiguous run whose numbers strictly increase; a single element counts as a run. Brute force checks every subarray for being ascending and sums it, O(n²) at best. The structure matches Kadane with a different restart rule. A run ending at index i either extends the run ending at i - 1, which is only possible when \`nums[i] > nums[i - 1]\`, or it starts fresh at i. Unlike plain Kadane the restart is forced by the ascending condition, not by the sign of the balance. So keep \`cur\`, the sum of the current ascending run: if the element is bigger than its predecessor, add it, otherwise reset \`cur = nums[i]\`. Track the best \`cur\` seen. Trace \`[10, 20, 30, 5, 10, 50]\`: cur is 10, 30, 60, then 5 (restart), 15, 65. The best is 65, the run 5, 10, 50. Edge cases: one element returns itself; equal neighbours break a strictly ascending run, so the extend test is a strict \`>\`; values are positive here, so the whole ascending run is always worth taking. Cost: O(n) time, O(1) space.`,
      53: `I restate it: the largest sum of any non-empty contiguous run in an array that can hold negatives. Brute force tries every start and end with a running sum for each start, O(n²). I'd say that first, then look for waste: starting at index 4 re-adds numbers that the start at 3 added. The unlocking question is "what is the best run that ends exactly at index i?" It is either the element alone or the best run ending at i - 1 with the element added. So I only need one number of memory, \`cur\`, and I keep it only while it helps: \`cur = max(x, cur + x)\`. The final answer is the largest \`cur\` over all i, held in \`best\`, because the best run ends somewhere. Start both from \`nums[0]\`, not 0, so an all-negative array returns its largest element. Trace \`[-2, 1, -3, 4, -1, 2, 1, -5, 4]\`: cur goes -2, 1, -2, 4, 3, 5, 6, 1, 5 and best is 6, from 4, -1, 2, 1. Edge cases: single element, all negative, zeros. Cost: O(n) time, O(1) space. I'd mention divide and conquer at O(n log n) only to explain why one pass is better.`,
      2606: `I restate it: each lowercase letter has a cost: its alphabet position (a is 1, up to z is 26) unless it appears in chars, in which case the matching value from vals is used. Find the most expensive substring, where the empty substring has cost 0 and is allowed. Brute force costs every substring, O(n²). Replace the string by its list of costs, and the question is the maximum subarray sum with the empty subarray allowed. That is Kadane with a clamp: since an empty run is legal, a negative carried balance can restart as zero. Use \`cur = max(cur, 0) + cost[ch]\` and \`best = max(best, cur)\`, both starting at 0, so the answer is never below 0. Build a dict from chars to vals once; for a letter not in the dict use \`ord(ch) - 96\`. Trace "adaa" with d costing -1000: costs 1, -1000, 1, 1. cur is 1, then -999, then max(-999,0)+1 = 1, then 2. Best 2. Edge cases: every letter costs less than zero (answer 0); the empty string. Cost: O(n + |chars|) time, O(|chars|) space.`,
      1014: `I restate it: two sightseeing spots at positions i < j score \`values[i] + values[j] + i - j\`; find the best pair. Brute force checks all pairs, O(n²). The score mixes i and j, but it separates: \`(values[i] + i) + (values[j] - j)\`. For a fixed j, the part from j is fixed, so I want the best \`values[i] + i\` over earlier positions. That is a running maximum rather than a restart rule. Sweep j from 1: before updating, combine the best earlier left part with \`values[j] - j\` to get a candidate score and keep the best; then update the left part with \`values[j] + j\` for the positions after j. Trace \`[8, 1, 5, 2, 6]\`: left starts at 8. j=1: 8 + 1 - 1 = 8, then left = max(8, 2) = 8. j=2: 8 + 5 - 2 = 11, left stays 8 (5+2=7). j=3: 8 + 2 - 3 = 7. j=4: 8 + 6 - 4 = 10. Best 11. Edge cases: exactly two spots; ties. Cost: O(n) time, O(1) space. It belongs with Kadane because it is the same "carry one best-so-far value" structure.`,
      978: `I restate it: find the longest contiguous run where the comparison between neighbours strictly alternates (up, down, up... or down, up, down...); equal neighbours break the run. Brute force checks every subarray, O(n²). Kadane's idea fits: the longest alternating run ending at i depends only on the runs ending at i - 1, but I must remember which direction the last step went. So carry two lengths: \`up\`, the longest run ending here whose last step rose, and \`down\`, the longest whose last step fell. When \`arr[i] > arr[i - 1]\`, a rising step can only follow a falling one: \`up = down + 1\`, and \`down = 1\`. When \`arr[i] < arr[i - 1]\`, \`down = up + 1\` and \`up = 1\`. Equal neighbours reset both to 1. Compute both from the old values before overwriting. Trace \`[9, 4, 2, 10, 7, 8]\`: (up, down) goes (1,2), (1,2), (3,1), (1,4), (5,1): the run 4, 2, 10, 7, 8 has steps down, up, down, up, length 5. Edge cases: a single element is 1; all equal is 1. Cost: O(n) time, O(1) space.`,
      1567: `I restate it: find the longest subarray whose product is positive. Multiplying all the numbers risks overflow and is unnecessary: only the sign matters. A zero breaks the array into independent pieces, so reset there. Brute force checks every subarray, O(n²). Use Kadane's "carry the best ending here" idea, with two states because the sign can flip: \`pos\`, the longest run ending here with a positive product, and \`neg\`, the longest with a negative product. A positive x extends both: \`pos + 1\`, and \`neg + 1\` only if \`neg > 0\` (a length of 0 means no such run exists). A negative x swaps them: the new \`pos\` is \`neg + 1\` if \`neg > 0\` else 0, and the new \`neg\` is \`pos + 1\`. A zero resets both to 0. Compute both new values from the old pair. Trace \`[1, -2, -3, 4]\`: (pos, neg) goes (1,0), (0,2), (3,1), (4,2). The best pos is 4. Edge cases: a single negative gives 0; a zero in the middle. Cost: O(n) time, O(1) space.`,
      152: `I restate it: the largest product of a contiguous non-empty run, with negatives and zeros allowed. Brute force multiplies every start and end, O(n²). Kadane's sum idea does not carry over by itself: with sums, the best run ending at i extends the best run ending at i - 1, but with products a very negative run can become the best after one more negative factor. So I track both the largest and the smallest product of a run ending at i. The new largest is the maximum of three candidates: the element alone, old largest times x, old smallest times x. The new smallest is the minimum of the same three. I must compute both candidates from the old pair before overwriting, otherwise the minimum uses a stale-overwritten maximum. A zero collapses both to 0 and the next element restarts on its own through the "element alone" option. Keep the best of the largest values. Trace \`[-2, 3, -4]\`: (hi, lo) is (-2,-2), (3,-6), (24,-12). Best 24. Edge cases: a single negative; a zero in the middle. Cost: O(n) time, O(1) space. In Java or C++ I'd use a 64-bit type for intermediate products.`,
      918: `I restate it: a circular array, where the end is adjacent to the start; return the largest sum of a non-empty subarray, which may wrap around. Brute force tries every start and every length, O(n²). A subarray either does not wrap, which is plain Kadane, or it wraps. A wrapping run is the whole array minus one contiguous stretch in the middle, so its sum is the total minus that middle stretch, and I want that stretch to be as small as possible: the minimum subarray sum. So run Kadane twice in the same pass, once for the maximum and once for the minimum, and the answer is the larger of the best non-wrapping sum and \`total - best_min\`. One exception: if every number is negative, the minimum subarray is the whole array and \`total - total = 0\` would mean picking nothing, which is illegal. In that case return the ordinary maximum (which is negative). Trace \`[5, -3, 5]\`: best max is 7, total 7, best min -3, wrap gives 7 + 3 = 10. Answer 10. Cost: O(n) time, O(1) space.`,
      1186: `I restate it: the largest sum of a non-empty subarray, allowed to delete at most one element from it (the rest stays joined). Brute force tries each deletion and runs Kadane, O(n²). Plain Kadane has no memory of whether a deletion happened. Add one bit of state: two values per index. \`keep\` is the best run ending here with nothing deleted, which is ordinary Kadane. \`gone\` is the best run ending here that has already used its deletion. To compute \`gone\` at x there are two ways: delete x itself, which means taking the previous \`keep\` (a run ending at the previous index with nothing deleted), or keep x after an earlier deletion, \`gone + x\`. So \`gone = max(gone + x, keep)\`. I compute \`gone\` first, from the old \`keep\`, then update \`keep = max(keep + x, x)\`. The best answer is the maximum of both. Start \`gone\` at minus infinity, since no deletion is possible with one element. Trace \`[1, -2, 0, 3]\`: keep is 1, -1, 0, 3 and gone is -inf, 1, 1, 4. Best 4. Edge cases: one element; all negative. Cost: O(n) time, O(1) space.`,
      1749: `I restate it: the largest absolute value of the sum of any subarray; the empty subarray is allowed, so the answer is at least 0. Brute force computes every subarray sum, O(n²). The largest absolute value is either the biggest positive subarray sum or the most negative one with the sign flipped. Those are Kadane and its mirror image. Run both in one pass: \`hi\` is the best sum ending here, restarting when it goes negative, and \`lo\` is the worst sum ending here, restarting when it goes positive. Since the empty subarray is allowed, a restart means starting from 0: \`hi = max(hi, 0) + x\` and \`lo = min(lo, 0) + x\`. The answer is the maximum over the pass of \`hi\` and \`-lo\`. Trace \`[2, -5, 1, -4, 3, -2]\`: lo goes 2, -5, -4, -8, -5, -7 (min with 0 first, then add x), so -8 appears and the answer is 8 from the run -5, 1, -4. Edge cases: all zeros gives 0; all negative gives the magnitude of the whole array. Cost: O(n) time, O(1) space. Alternative: the answer equals max prefix minus min prefix.`
    }
  };
})();
