(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['two-pointers'] = {
    primer: {
      kind: 'technique',
      what: `Two pointers means keeping **two indices** into a sequence and moving them by a rule, instead of testing every pair. Picture two people walking toward each other along a sorted row of price tags, or one reader and one writer walking down the same page.`,
      does: `It turns "check every pair" (O(n²)) into one pass (O(n)) whenever each comparison lets you throw away a whole group of pairs. It solves pair and triple sums on sorted data, palindromes, merging two sorted lists, and in-place cleanup like removing duplicates.`,
      impl: `Opposite ends: \`left = 0\`, \`right = n - 1\`, loop while \`left < right\`, and move one pointer inward based on what the pair tells you. Same direction: a fast \`read\` index scans everything and a slow \`write\` index marks the end of the answer so far. Plain Python indices and \`sort()\` are all you need.`,
      possibilities: `Two Sum on a sorted array, 3Sum and 4Sum, Container With Most Water, Trapping Rain Water, valid palindrome, merge sorted arrays, remove duplicates, move zeroes, and the Dutch flag sort of 0s, 1s and 2s.`
    },

    think: [
      {
        q: `Sorted array \`[1, 3, 4, 6, 9]\`, target 11, with \`left = 0\` and \`right = 4\`. Say how each pointer moves, and what the loop returns.`,
        a: `1+9 = 10 is too small, so \`left\` goes to 1. 3+9 = 12 is too big, so \`right\` goes to 3. 3+6 = 9 is too small, so \`left\` goes to 2. 4+6 = 10 is too small, so \`left\` goes to 3 and now \`left == right\`, so the loop ends with no pair. Four moves for five numbers: that count is the aha, the pointers can never make more than n - 1 moves in total.`
      },
      {
        q: `Run the same loop on the **unsorted** list \`[4, 1, 3]\` with target 4. The answer is 1 + 3. What goes wrong?`,
        a: `4+3 = 7 is too big, so \`right\` moves in, past the 3. Then 4+1 = 5 is still too big, so \`right\` moves again and meets \`left\`. We never tried 1+3. "Too big, drop the right one" is only true when the right one is the *largest* remaining value, which is exactly what sorted order guarantees. Without that guarantee, use a hash map.`
      },
      {
        q: `The loop has two pointers and a \`while\`. Why is it O(n) and not O(n²)?`,
        a: `Count total moves, not loops. Every pass moves \`left\` up or \`right\` down and neither ever turns back. They start n - 1 apart and the loop stops when they meet, so there are at most n - 1 passes, each O(1). "Two pointers" does not multiply anything, because the pointers share one budget of steps.`
      },
      {
        q: `What breaks if you write \`while left <= right\` for a pair-sum search on \`[5]\` with target 10?`,
        a: `With \`<=\` the loop runs once with \`left == right == 0\`, adds 5 + 5, and reports a pair using the same element twice. A pair needs two different positions, so the loop must stop when the pointers meet: \`left < right\`. Some problems (the lifeboat one) do want \`<=\` because one person can ride alone, so always ask what the pointers meeting means.`
      },
      {
        q: `Read/write pointers on \`[0, 1, 0, 3]\` that push zeros to the back with a swap. What is the list after each non-zero read?`,
        a: `\`write\` starts at 0. Reading the 1 swaps it into slot 0 giving \`[1, 0, 0, 3]\` and \`write\` becomes 1. Reading the 3 swaps it into slot 1 giving \`[1, 3, 0, 0]\` and \`write\` becomes 2. The aha: everything before \`write\` is finished and non-zero, everything from \`write\` up to \`read\` is zeros, so a swap is always safe.`
      },
      {
        q: `"Find the longest stretch of letters with no repeats." Opposite-end pointers or something else, and why?`,
        a: `Something else: a sliding window. The answer is a contiguous stretch that grows and shrinks with a rule, and the two pointers both move left to right, not toward each other. Opposite-end pointers fit when the question is about a pair at the two ends, or when sorted order tells you which end to move.`
      }
    ],

    breakdown: [
      {
        title: `1. The slow idea: try every pair`,
        body: `Say you have prices \`[1, 3, 4, 6, 9]\` and want two that add up to 13. The obvious way is two loops: pair index 0 with 1, 2, 3, 4, then index 1 with 2, 3, 4, and so on. That is 10 pairs for 5 numbers, and about n²/2 pairs in general. For 100,000 numbers that is 5 billion checks. It works, so say it first in an interview, then look for waste: most of those pairs are obviously pointless.`
      },
      {
        title: `2. Sorted order tells you what to throw away`,
        body: `Put a pointer on the smallest and one on the largest: 1 + 9 = 10, which is below 13. The 1 is the smallest number, and even paired with the largest number it is too small, so 1 can pair with nothing. Throw it away: \`left\` moves to the 3. Now 3 + 9 = 12, still too small, so the 3 goes too. Then 4 + 9 = 13: found. Each comparison removed a whole row of pairs, not one pair.`,
        code: { py: `def has_pair(nums, target):   # nums sorted
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return True
        if total < target:
            left += 1      # nums[left] is too small for every remaining partner
        else:
            right -= 1     # nums[right] is too big for every remaining partner
    return False` }
      },
      {
        title: `3. Why dropping is always safe`,
        body: `Suppose the true answer is the pair at positions i and j, and the pointers have not reached them yet. If \`left\` gets to i first, then \`right\` is still beyond j, so \`nums[i] + nums[right]\` is at least \`nums[i] + nums[j]\`, which is the target or more. If it were more, \`right\` moves down, not \`left\`. So \`left\` cannot jump over i. The same argument holds from the other side. State this argument in the interview: the pointer rule must come with a reason.`
      },
      {
        title: `4. State, loop, edge cases, cost`,
        body: `The state is just two integers. The loop: look at the pair, then move exactly one pointer. Edge cases to run by hand: an empty list or a single element (the loop never starts), two equal values like \`[5, 5]\` target 10 (still fine, they are different positions), and no answer (the pointers meet). Cost: at most n - 1 moves, so O(n) time and O(1) space. If you had to sort first, add O(n log n) and say so.`
      },
      {
        title: `5. The second shape: read and write pointers`,
        body: `Remove duplicates from sorted \`[1, 1, 2, 2, 3]\` in place. A fast pointer \`read\` visits every element. A slow pointer \`write\` is where the next kept value goes, so \`nums[:write]\` is always the finished answer. Start with \`write = 1\`. Read index 1 (a 1): same as the last kept, skip. Read index 2 (a 2): new, copy to slot 1, \`write = 2\`. Read index 3: skip. Read index 4 (a 3): copy to slot 2, \`write = 3\`. Answer: 3 values, list starts \`[1, 2, 3]\`.`
      },
      {
        title: `6. How to spot it in an interview`,
        body: `Look for these signals: the input is sorted (or you may sort it) and the question is about a pair or triple; you compare the two ends of something (palindrome, container); the statement says "in place" with O(1) extra space; or you merge two sorted sequences. Then check the cost of your idea: if the brute force is a double loop over pairs and each comparison can discard many pairs, two pointers fits. If the data is unsorted and positions matter, pick a hash map instead.`
      }
    ],

    drills: [
      {
        title: `Drop the negatives, in place`,
        q: `You get a list of integers. Remove every negative number **in place**, keeping the order of the rest, and return how many numbers remain. Only the first part of the list (up to that count) is checked afterwards.\n\nExample: \`[3, -1, 4, -5, -2, 6]\` returns \`3\` and the list begins \`[3, 4, 6]\`.`,
        hint: `Use a slow index for where the next kept value goes, and a fast index that scans everything.`,
        how: `I restate it: keep the non-negative numbers, in order, packed at the front, with no second list. The brute force is to build a new list with a filter, which is O(n) space, or to delete from the middle of the list one by one, which shifts everything each time and costs O(n²). The observation that unlocks it: I never need to look backwards. The front of the list that I have already finished is always at most as long as the part I have already read, so I can overwrite it safely. That is the read/write pointer shape. \`read\` walks every element. \`write\` is the slot for the next kept value. Trace \`[3, -1, 4, -5, -2, 6]\`: read 0 is 3, keep it into slot 0, write becomes 1. Read 1 is -1, skip. Read 2 is 4, copy to slot 1, write 2. Reads 3 and 4 are negative, skip. Read 5 is 6, copy to slot 2, write 3. Return 3 and the list begins 3, 4, 6. Edge cases: an empty list returns 0; all negatives returns 0 with write never moving; all non-negative copies each value onto itself, which is harmless. Cost: one pass, O(n) time, O(1) space.`,
        code: { py: `def drop_negatives(nums):
    write = 0
    for read in range(len(nums)):
        if nums[read] >= 0:
            nums[write] = nums[read]
            write += 1
    return write` },
        explain: `Invariant: \`nums[:write]\` holds the non-negative values seen so far, in their original order. Since \`write <= read\` at all times, writing to \`nums[write]\` never overwrites an unread value. One pass, so O(n) time and O(1) extra space.`,
        check: `a = [3, -1, 4, -5, -2, 6]
n = drop_negatives(a)
assert n == 3 and a[:n] == [3, 4, 6]
a = []
assert drop_negatives(a) == 0
a = [-1, -2]
assert drop_negatives(a) == 0
a = [0, 5]
assert drop_negatives(a) == 2 and a[:2] == [0, 5]
a = [-3, 7, -3, 8]
n = drop_negatives(a)
assert n == 2 and a[:n] == [7, 8]`
      },
      {
        title: `Biggest pair that fits the budget`,
        q: `A sorted list of prices and a budget. Pick two different items so that their total is as large as possible without going over the budget. Return that total, or \`-1\` if no two items fit.\n\nExample: \`[1, 3, 4, 7, 10]\`, budget \`11\` returns \`11\` (1 + 10). \`[2, 5, 9]\`, budget \`10\` returns \`7\`.`,
        hint: `If the pair at the two ends fits, record it. Then decide which pointer could possibly give a bigger total that still fits.`,
        how: `I restate it: among all pairs of different positions whose sum is at most the budget, find the largest sum. Brute force tries all pairs, O(n²). The input is sorted, which is the signal. Look at the two ends. If their sum is over budget, the right item is too expensive for every partner, because the cheapest partner is already the left end. So the right pointer moves in for good. If the sum fits, I record it, and now the left item has done its best: paired with anything cheaper than the current right it gives a smaller total, and anything dearer was already thrown away as over budget. So the left pointer moves up to look for a bigger total. Trace \`[2, 5, 9]\` with budget 10: 2+9 = 11 is over, right moves to 5. 2+5 = 7 fits, best is 7, left moves to 1 and the pointers meet. Answer 7. Edge cases: fewer than two items returns -1; every pair over budget leaves best as -1; ties are fine. Cost: at most n - 1 moves, O(n) time, O(1) space.`,
        code: { py: `def best_pair_under(prices, budget):
    left, right = 0, len(prices) - 1
    best = -1
    while left < right:
        total = prices[left] + prices[right]
        if total <= budget:
            best = max(best, total)
            left += 1
        else:
            right -= 1
    return best` },
        explain: `When the sum is over budget the right item cannot be in any valid pair with the remaining items, so dropping it is safe. When the sum fits, the left item's best total is with the current right item (everything larger is already discarded), so it is recorded and the left item is done. Each step discards one item: O(n) time, O(1) space.`,
        check: `assert best_pair_under([1, 3, 4, 7, 10], 11) == 11
assert best_pair_under([2, 5, 9], 10) == 7
assert best_pair_under([5], 10) == -1
assert best_pair_under([], 3) == -1
assert best_pair_under([6, 7, 8], 10) == -1
assert best_pair_under([1, 1, 1], 2) == 2
import random
for _ in range(300):
    arr = sorted(random.randint(1, 20) for _ in range(random.randint(0, 8)))
    b = random.randint(1, 40)
    brute = max([arr[i] + arr[j] for i in range(len(arr)) for j in range(i + 1, len(arr)) if arr[i] + arr[j] <= b], default=-1)
    assert best_pair_under(arr, b) == brute`
      },
      {
        title: `How many pairs stay cheap`,
        q: `A sorted list and a limit. Count the pairs of different positions whose sum is **strictly less** than the limit.\n\nExample: \`[1, 2, 3, 4, 5]\`, limit \`7\` returns \`6\`: (1,2), (1,3), (1,4), (1,5), (2,3), (2,4).`,
        hint: `When the ends fit, how many partners does the left value have that also fit?`,
        how: `I restate it: count index pairs i < j with sum below the limit. Brute force checks every pair, O(n²). I want to count many pairs per step. Look at the two ends of the sorted list. If \`nums[left] + nums[right]\` is below the limit, then \`nums[left]\` also fits with every value between left and right, since those are smaller than or equal to nums[right]. That is \`right - left\` pairs at once, all led by \`nums[left]\`. Those are all the pairs led by \`left\` that can still matter: partners beyond \`right\` were already dropped because they were too big, so \`left\` is finished and moves up. If the ends do not fit, \`nums[right]\` is too big even for the smallest partner, so it can pair with nothing, and \`right\` moves down. Trace \`[1, 2, 3, 4, 5]\`, limit 7: 1+5 = 6 fits, add 4, left 1. 2+5 = 7 no, right 3. 2+4 = 6 fits, add 2, left 2. 3+4 = 7 no, right 2, stop. Total 6. Edge cases: empty or single element gives 0. Cost: O(n) time after sorting, O(1) space.`,
        code: { py: `def count_pairs_below(nums, limit):
    left, right = 0, len(nums) - 1
    count = 0
    while left < right:
        if nums[left] + nums[right] < limit:
            count += right - left
            left += 1
        else:
            right -= 1
    return count` },
        explain: `If \`nums[left] + nums[right] < limit\` then \`nums[left]\` pairs successfully with every index in \`(left, right]\` since those values are no bigger than \`nums[right]\`, giving \`right - left\` pairs. Those are all the pairs led by \`left\` whose partner is at most \`right\`, and partners beyond \`right\` were dropped because they were already too big. Then \`left\` is finished. Otherwise \`right\` is too big for everyone. O(n) time, O(1) space.`,
        check: `assert count_pairs_below([1, 2, 3, 4, 5], 7) == 6
assert count_pairs_below([], 5) == 0
assert count_pairs_below([3], 10) == 0
assert count_pairs_below([1, 1, 1], 3) == 3
assert count_pairs_below([5, 6], 11) == 0
assert count_pairs_below([-3, -1, 2], 1) == 2
import random
for _ in range(300):
    arr = sorted(random.randint(-10, 10) for _ in range(random.randint(0, 9)))
    lim = random.randint(-15, 15)
    brute = sum(1 for i in range(len(arr)) for j in range(i + 1, len(arr)) if arr[i] + arr[j] < lim)
    assert count_pairs_below(arr, lim) == brute`
      },
      {
        title: `Triples that stay below a limit`,
        q: `Given an unsorted list and a limit, count the triples of **different positions** (i < j < k) whose sum is strictly below the limit.\n\nExample: \`[-1, 0, 2, 3]\`, limit \`3\` returns \`2\` (the triples -1+0+2 and -1+0+3).`,
        hint: `Fix one value, then you have the previous drill on the rest. Sorting does not change how many triples there are.`,
        how: `I restate it: count index triples whose sum is under the limit. Brute force is three nested loops, O(n³). The structure is 3Sum: fix the first number and the rest becomes a two-number question. Counting position triples does not depend on order, so I can sort first, which costs O(n log n) and unlocks pointers. For each fixed i, the question on the right part is exactly the previous drill, how many pairs sum below \`limit - nums[i]\`. Use the same pointers: if the three-way sum fits, every index between left and right works with left, so add \`right - left\` and move left up; otherwise move right down. Trace \`[-1, 0, 2, 3]\` limit 3 (already sorted). i = 0 (value -1): left 1, right 3: -1+0+3 = 2 fits, add 2, left 2; -1+2+3 = 4 no, right 2, stop. i = 1 (value 0): 0+2+3 = 5 no, right 2, stop. i = 2 has no room. Total 2. Edge cases: fewer than three values gives 0; duplicates need no special care because I count positions, not values. Cost: O(n²) after the sort, O(1) extra space.`,
        code: { py: `def count_triples_below(nums, limit):
    nums = sorted(nums)
    n = len(nums)
    count = 0
    for i in range(n - 2):
        left, right = i + 1, n - 1
        while left < right:
            if nums[i] + nums[left] + nums[right] < limit:
                count += right - left
                left += 1
            else:
                right -= 1
    return count` },
        explain: `Counting position triples is unaffected by sorting. For each fixed first index the inner loop is the pair-counting pass on the remaining suffix, so it is correct for the same reason as before. n outer values times an O(n) pass gives O(n²) time. Sorting a copy adds O(n) space; sorting in place would make it O(1).`,
        check: `assert count_triples_below([-1, 0, 2, 3], 3) == 2
assert count_triples_below([], 5) == 0
assert count_triples_below([1, 2], 100) == 0
assert count_triples_below([0, 0, 0, 0], 1) == 4
assert count_triples_below([3, 1, 2], 7) == 1
assert count_triples_below([5, 5, 5], 15) == 0
import random
from itertools import combinations
for _ in range(300):
    arr = [random.randint(-6, 6) for _ in range(random.randint(0, 8))]
    lim = random.randint(-8, 8)
    brute = sum(1 for t in combinations(arr, 3) if sum(t) < lim)
    assert count_triples_below(arr, lim) == brute`
      }
    ],

    how: {
      125: `I restate it: ignore everything that is not a letter or digit, ignore case, and say whether the rest reads the same both ways. The easy way is to build a cleaned, lowercase copy and compare it with its reverse; that is O(n) time but O(n) extra space, and it is fine to mention first. To avoid the copy, I note that a palindrome is decided by comparing the two ends and moving inward, so two pointers fit. The only twist is the junk characters: before comparing, move \`left\` right while it points at something that is not alphanumeric, and \`right\` left likewise, keeping \`left < right\` so they cannot cross. Trace "ab_a": left is a, right is a, they match and both move. Now left is b and right is the underscore, so right skips it and lands on b; they match, the pointers meet, true. For "race a car" the first mismatch (e against c) returns false. Edge cases: an empty or all-punctuation string is a palindrome, and "0P" is false because digits count. Cost: O(n) time, O(1) space.`,
      167: `I restate it: the numbers are sorted, find the two positions adding to the target, return them counting from 1, using constant extra space. A hash map solves Two Sum in O(n) time but costs O(n) space, which the statement rules out, and binary searching a partner for each element is O(n log n). The sorted order is the clue for two pointers. Start at both ends. If the sum is too big, the right value is too big even with the smallest partner, so move \`right\` in. If too small, the left value is too small even with the largest partner, so move \`left\` up. Each step discards one number and cannot discard the answer. Trace \`[2, 7, 11, 15]\` target 9: 2+15 = 17 too big, right moves to 11; 2+11 = 13, right moves to 7; 2+7 = 9, return positions 1 and 2. Edge cases: negatives and duplicates are fine; the exact problem guarantees one answer. Remember to add one for the 1-based output. Cost: O(n) time, O(1) space.`,
      15: `I restate it: find every distinct set of three values summing to zero, with no repeated triples. Brute force is three loops, O(n³), plus a set to remove repeats. The bottleneck is searching for the third number. Fixing the first number reduces the rest to Two Sum II on the numbers to its right, which two pointers answers in O(n), so the total is O(n²). I sort first, because pointers need order, and because sorting puts duplicates next to each other. Duplicates are handled by skipping: ignore an outer value equal to the previous outer value, and after recording a triple, move \`left\` past equal values. I can also stop once the fixed value is positive, since everything after it is bigger. Trace \`[-1, 0, 1, 2, -1, -4]\` sorted \`[-4, -1, -1, 0, 1, 2]\`: i at -4 finds nothing; i at -1 pairs -1 and 2, then 0 and 1; the second -1 is skipped. Edge cases: under three numbers, and \`[0, 0, 0, 0]\` giving one triple. Cost: O(n²) time, O(1) extra space beyond the output.`,
      11: `I restate it: heights stand at positions 0, 1, 2 and so on; choose two walls, the water held is their distance times the shorter wall; maximise it. Brute force is every pair, O(n²). The observation: begin with the widest pair, the two outer walls. Any other pair is narrower, so to beat the current one it needs a taller shorter-wall. Look at the current pair: the shorter wall caps every pair it joins, and moving inward from the other side only makes the width smaller. So that shorter wall cannot do better with anyone else, and I can drop it. Move the pointer at the shorter wall inward and keep the best area. Trace \`[1, 8, 6, 2, 5, 4, 8, 3, 7]\`: 1 and 7 give 8, then drop the 1; 8 and 7 give 49, the best; then keep moving the shorter side (the 7) and nothing beats 49. Edge cases: two walls, zero-height walls, equal heights (either side may move). Cost: O(n) time, O(1) space.`,
      42: `I restate it: bars of unit width, rain fills the gaps, return the total water. For one bar, the water above it is the smaller of the tallest bar on its left and the tallest on its right, minus the bar's own height. Brute force scans both sides for every bar, O(n²). Precomputing a prefix maximum and a suffix maximum array makes it O(n) time and O(n) space, and I'd say that first. To get O(1) space, put pointers at both ends with a running maximum for each side. The side with the lower bar is settled: the other side holds a bar at least that tall, so my own running maximum is the real cap. Add runningMax minus the bar, then move that pointer in. Trace \`[2, 0, 2]\`: left bar 2 is not lower than right bar 2, so settle the right side: rightMax 2, water 0, right moves to 0. Now 2 vs 0: settle the right again, bar 0 gets 2 - 0 = 2 water. Total 2. Edge cases: under three bars, strictly rising or falling. Cost: O(n) time, O(1) space.`,
      344: `I restate it: reverse a list of characters in place, no second list. The easy version builds a reversed copy, which uses O(n) space and is not allowed. In place means I can only swap elements. The first element should end up last and the last first, then the second and second-to-last, and so on. That is two pointers on the opposite ends: swap the two, move both inward, and stop when they meet or cross, since the middle element of an odd-length list needs no move. Trace \`["h","e","l","l","o"]\`: swap h and o, then e and l, then left and right meet at the middle l and stop, giving \`["o","l","l","e","h"]\`. Edge cases: a single character, two characters, and an empty list, all of which the loop condition handles without extra code. In Python the tuple swap needs no temporary variable. Cost: n/2 swaps, so O(n) time and O(1) space.`,
      26: `I restate it: the list is sorted, so equal values sit together; keep one copy of each value at the front, in order, in place, and return how many there are. A set loses nothing but costs O(n) space and does not leave the list in place. The sorted order means a value is a duplicate exactly when it equals the last value I kept. That suggests read/write pointers: \`read\` scans every element, \`write\` is the next free slot, and \`nums[:write]\` is always the finished list. The first element is always kept, so \`write\` starts at 1. Trace \`[1, 1, 2]\`: read index 1 is 1, same as \`nums[0]\`, skip. Read index 2 is 2, differs from \`nums[write - 1]\`, copy to slot 1, write becomes 2. Return 2. Edge cases: an empty list (guard it or loop from 1 safely), all equal values, no duplicates at all. Cost: O(n) time, O(1) space.`,
      283: `I restate it: push all zeros to the end, keep the other numbers in their original order, do it in place. Making a new list of non-zeros and padding zeros is O(n) space. Pointer thinking: I want the non-zeros packed at the front in order, so I use a write pointer for the next slot and a read pointer that scans. When \`nums[read]\` is non-zero, swap it with \`nums[write]\` and advance \`write\`. Why swap instead of copy? The zeros then drift behind automatically and I never need a second pass to fill them in. Trace \`[0, 1, 0, 3, 12]\`: read 1 is non-zero, swap with slot 0, giving \`[1, 0, 0, 3, 12]\`; read 3 swaps with slot 1, giving \`[1, 3, 0, 0, 12]\`; read 12 swaps with slot 2, giving \`[1, 3, 12, 0, 0]\`. Edge cases: no zeros means each element swaps with itself, harmless; all zeros means nothing moves. Cost: one pass, O(n) time, O(1) space.`,
      88: `I restate it: \`nums1\` has m real values then n empty slots, \`nums2\` has n values, both sorted; merge into \`nums1\`. The simple way is to merge from the front into a new list, then copy back, O(m + n) space. If I merge from the front inside \`nums1\`, I overwrite values I have not read yet. The empty space is at the back, so the safe place to write is the back: the largest remaining value goes in the last free slot. Three pointers: \`i\` at the last real value of nums1, \`j\` at the last of nums2, \`k\` at the last slot. Take the larger of the two, write it at \`k\`, move that pointer and \`k\` left. Stop when \`nums2\` is exhausted: whatever remains in \`nums1\` is already in the right place. Trace \`[1,2,3,_,_,_]\` with \`[2,5,6]\`: 6, 5, 3, 2, 2, 1 are placed from the back. Edge cases: \`n = 0\` (nothing to do) and \`m = 0\` (copy nums2). Cost: O(m + n) time, O(1) space.`,
      977: `I restate it: the numbers are sorted, but squares of negatives are large, so the squared list is not sorted; return the squares in sorted order. The easy answer squares everything then sorts: O(n log n). The sorted input gives a better one. The squares are biggest at the two ends, because the largest absolute values are the most negative and the most positive numbers. So the largest square is at one of the two ends. Put a pointer on each end, compare absolute values, and place the larger square at the **back** of the output, then move that pointer inward. Filling from the back is the key, since I always know the biggest remaining. Trace \`[-4, -1, 0, 3, 10]\`: 10 beats 4 so put 100 last; then 4 beats 3, put 16; then 3 beats 1, put 9; then 1 beats 0, put 1; then 0. Result \`[0, 1, 9, 16, 100]\`. Edge cases: all negatives or all positives, one element. Cost: O(n) time, O(n) for the output.`,
      680: `I restate it: may I delete at most one character and get a palindrome? A brute force deletes each character and checks the result, O(n²). The normal palindrome check walks in from both ends. Notice the only decision point is the first mismatch: until then, deleting anything would be wasteful because the matched ends are already fine. At the first mismatch at positions left and right, the deleted character must be one of those two, so I try both: skip the left one and check that \`s[left + 1..right]\` is a palindrome, or skip the right one and check \`s[left..right - 1]\`. Each check is a plain two-pointer pass. If either works, true. Trace "abca": the outer a matches a, then b meets c, a mismatch. Skip the left b: the rest is "c", a palindrome, so the answer is true. (Skipping the right c instead would leave "b", also a palindrome.) For "abc" both tries fail: "c" vs "b" mismatch inside each. Edge cases: already a palindrome, length 1 or 2. Cost: O(n) time since each check is linear and happens once, O(1) space.`,
      75: `I restate it: the list holds only 0, 1 and 2; sort it in place in one pass without calling a sort. Counting the three values and rewriting works in two passes, and is a perfectly acceptable first answer. The one-pass version keeps three regions: everything before \`lo\` is 0, everything after \`hi\` is 2, and \`i\` scans the unknown middle. If \`nums[i]\` is 0, swap it with \`nums[lo]\` and advance both, because the swapped-in value came from the already-scanned region. If it is 2, swap it with \`nums[hi]\` and shrink \`hi\` only, because the value that arrived from the back has not been looked at yet; this is the classic bug. If it is 1, just advance. Trace \`[2, 0, 1]\`: i sees 2, swap with the back giving \`[1, 0, 2]\`, hi 1; i sees 1, advance; i sees 0, swap with lo giving \`[0, 1, 2]\`. Cost: O(n) time, O(1) space.`,
      80: `I restate it: sorted list, each value may appear at most twice, remove extras in place and return the new length. This is Remove Duplicates with a one-step change. A value is a third copy exactly when it equals the value two slots behind the write position, because the list is sorted, so equal values are adjacent. Use the read/write shape: scan with \`x\`, and keep it if \`write < 2\` or \`x != nums[write - 2]\`. Why compare to \`write - 2\` and not \`read - 2\`? \`nums[:write]\` is the finished answer, and it is the finished answer that decides whether another copy fits. Trace \`[1, 1, 1, 2, 2, 3]\`: first two 1s are kept (write 2), the third 1 equals \`nums[0]\` so it is skipped, 2 differs from nums[0], kept (write 3), second 2 differs from nums[1], kept (write 4), 3 is kept (write 5). Return 5. Edge cases: length one or two. Cost: O(n) time, O(1) space.`,
      16: `I restate it: pick three numbers whose sum is as close as possible to the target and return that sum. Brute force is three nested loops, O(n³). It is 3Sum with a different goal. Sort, fix the first number, then use two pointers on the rest. At each step compute the sum; if it is closer to the target than the best so far, remember it. Then decide direction the same way as before: if the sum is below the target, move \`left\` up to grow it; if above, move \`right\` down; if exactly equal, nothing can beat it, so return at once. Trace \`[-1, 2, 1, -4]\` sorted \`[-4, -1, 1, 2]\`, target 1: i at -4, sums -4-1+2 = -3, -4+1+2 = -1; i at -1, sum -1+1+2 = 2 is distance 1, the best. Return 2. There is no duplicate-skipping needed because I return one value, not a list. Edge cases: exactly three numbers. Cost: O(n²) time, O(1) extra space.`,
      881: `I restate it: boats hold at most two people and a weight limit; each person fits alone; minimise boats. Brute force over pairings is exponential. A greedy thought: the heaviest person has to ride in some boat, and the best possible companion is the lightest person. If the lightest cannot ride with them, nobody can, so the heaviest goes alone. If the lightest can, pairing them wastes nothing, because that heaviest person needs a boat anyway and the lightest is the easiest to place. Sort, then two pointers: the heaviest always takes a boat (move \`right\` down); the lightest hops in too if the pair fits (move \`left\` up). Count boats. Trace weights \`[3, 2, 2, 1]\`, limit 3: sorted \`[1, 2, 2, 3]\`; 3 goes alone (limit exceeded with 1), 2 pairs with 1, then the remaining 2 goes alone: 3 boats. The loop condition is \`left <= right\` because one person left alone still needs a boat. Cost: O(n log n) for the sort, O(1) extra space.`,
      18: `I restate it: find all distinct quadruples that sum to the target. Brute force is four loops, O(n⁴). It is 3Sum with one more outer loop. Sort, then fix the first number i, then the second j after it, and the last two come from two pointers. That is O(n³) overall, which is the standard answer; mention that the optimal known approach for kSum is about n to the power k - 1. Duplicates are handled at every level: skip an i equal to the previous i, skip a j equal to the previous j (but only after the first j for that i), and after a match skip equal \`left\` values. Trace \`[1, 0, -1, 0, -2, 2]\` target 0, sorted \`[-2, -1, 0, 0, 1, 2]\`: i at -2, j at -1 gives -2,-1,1,2; j at 0 gives -2,0,0,2; i at -1, j at 0 gives -1,0,0,1. Edge cases: under four numbers; large sums overflowing in other languages (not Python). Cost: O(n³) time, O(1) extra space.`
    }
  };
})();
