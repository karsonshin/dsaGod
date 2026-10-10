(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['sliding-window'] = {
    primer: {
      kind: 'technique',
      what: `A sliding window is a **contiguous stretch** of an array or string, tracked by a \`left\` and a \`right\` index plus a small summary of what is inside. Think of reading a long line of text through a cardboard frame that you slide along, stretching the front edge and pulling the back edge.`,
      does: `It answers "longest / shortest / how many contiguous stretches obey a rule" in one pass, O(n), instead of testing every start and end (O(n²)). A fixed-size window handles "every k consecutive items"; a variable window grows and shrinks with the rule.`,
      impl: `Loop \`right\` over the input and add \`nums[right]\` to the summary (a running sum, a \`dict\` of counts, a \`set\`). While the rule is broken, remove \`nums[left]\` from the summary and do \`left += 1\`. Record the answer from \`right - left + 1\`. Each index enters once and leaves at most once. A \`collections.deque\` holds a window's maximum.`,
      possibilities: `Longest substring without repeats, longest run with at most k distinct letters or k flips, shortest subarray with sum at least a target, minimum window containing all letters of another string, anagram searches, maximum of every window, and counting subarrays that obey a rule.`
    },

    think: [
      {
        q: `Positive numbers \`[2, 3, 1, 2, 4, 3]\`, target 7, shortest stretch with sum at least 7. Trace the window: when does \`left\` first move, and what is recorded?`,
        a: `Grow right: sums 2, 5, 6, then 8 at index 3 (window [2,3,1,2]). Valid, so record length 4, then shrink: drop the 2, sum 6, too small, stop. Grow with the 4 (sum 10), record 4, drop 3 (sum 7, record 3), drop 1 (sum 6, stop). Grow with the 3 (sum 9, record 3), drop 2 (sum 7, record 2), drop 4 (sum 3, stop). Best is 2. The aha: you record **inside** the shrink loop, because the window is valid exactly while you are shrinking it.`
      },
      {
        q: `Numbers \`[1, -1, 5, -2, 3]\`, target sum 3. A window "shrink while sum is above 3" will miss something. What, and why?`,
        a: `The stretch \`[1, -1, 5, -2]\` has sum 3, but the window's sum goes 1, 0, 5 (above 3, so you shrink away the 1 and -1), losing the start. The sum did not move one way as the window grew, because a negative number lowered it again. Sliding windows need a **monotonic** rule: growing only helps one direction. Negatives break that, and the tool becomes prefix sums with a hash map.`
      },
      {
        q: `The code has a \`for\` over \`right\` and a \`while\` inside that moves \`left\`. Why is it O(n) and not O(n²)?`,
        a: `Count total moves, not loops. \`right\` moves n times. \`left\` only moves forward and can never pass \`right\`, so across the whole run it also moves at most n times. Each move does O(1) work, so total work is at most about 2n. This amortized argument ("every element enters once and leaves at most once") is the sentence interviewers listen for.`
      },
      {
        q: `For "longest substring without repeating letters" on \`"abba"\`, the jump version does \`left = last[ch] + 1\`. What goes wrong at the final a if you forget the guard \`last[ch] >= left\`?`,
        a: `At the last a, \`last['a']\` is 0, so you would set \`left = 1\`. But \`left\` was already 2 (after the second b). Moving \`left\` backwards brings the second b back into the window, and a window that still has repeated letters is counted as valid. The fix is \`left = max(left, last[ch] + 1)\`. Rule: \`left\` never moves backwards.`
      },
      {
        q: `A fixed window of size 3 slides over \`[4, 1, 7, 2]\`. After the first window, what two operations make the next window's sum?`,
        a: `First window is 4+1+7 = 12. Moving right by one adds the new element (2) and removes the one that just fell off the back (4): 12 + 2 - 4 = 10, the sum of 1+7+2. One in, one out, O(1) per step, instead of re-adding k numbers each time. This is what turns O(n·k) into O(n).`
      },
      {
        q: `"Count subarrays with exactly 2 distinct values." Why is a direct window awkward, and what trick fixes it?`,
        a: `With exactly k, dropping an element from the left can take you from a valid window to an invalid one (k-1 distinct), so there is no clean "shrink while invalid". But "at most k distinct" is monotonic: shrinking only helps. So count at most 2, count at most 1, and subtract. Every subarray with exactly 2 is counted by the first and not the second.`
      }
    ],

    breakdown: [
      {
        title: `1. The slow idea and the waste in it`,
        body: `Find the longest stretch of \`"abcabcbb"\` with no repeated letter. The slow way picks every start, and from each start extends one letter at a time until a repeat shows up: start at 0 gives "abc", start at 1 gives "bca", start at 2 gives "cab", and so on. That is about n²/2 checks. The waste: starting at 1 re-examines "bc", which the start at 0 already knew was fine. The sliding window keeps that knowledge instead of throwing it away.`
      },
      {
        title: `2. The window and what it remembers`,
        body: `Keep two indices, \`left\` and \`right\`, so the window is \`s[left..right]\`, plus a summary of what is inside. For "no repeats" the summary is the letters present, say a \`set\`. Rule: the window must never hold a repeat. Walk \`right\` from the left: add \`s[right]\`. If it was already in the set, the window is broken, so remove \`s[left]\` and move \`left\` up until the letter is gone. Every window that survives is valid, so its length \`right - left + 1\` is a candidate.`
      },
      {
        title: `3. Trace it by hand`,
        body: `\`"abcabcbb"\`. right=0..2 builds "abc" (length 3, best 3). right=3 is a: it is already inside, so drop letters from the left until the first a is gone: drop a, window is "bca", length 3. right=4 is b: drop b, window "cab". right=5 is c: drop c, window "abc". right=6 is b: drop a, drop b, window "cb". And so on; the length never beats 3. Best is 3. Notice \`left\` and \`right\` only ever moved forward.`,
        code: { py: `def longest_unique(s):
    seen = set()
    left = best = 0
    for right, ch in enumerate(s):
        while ch in seen:           # the rule broke: shrink
            seen.remove(s[left])
            left += 1
        seen.add(ch)                # now the window is valid again
        best = max(best, right - left + 1)
    return best` }
      },
      {
        title: `4. Why shrinking is allowed: the monotonic rule`,
        body: `We only ever move \`left\` forward, never back. That is safe because of one property: if a window is valid, every smaller window inside it is valid too. So once \`right\` moves on, the best \`left\` for it can only be the same or later. Check this property out loud before you use the pattern. For "sum at most t" with positive numbers it holds (removing a number lowers the sum). For sums with negative numbers it fails (removing a negative raises the sum), and a window gives wrong answers.`
      },
      {
        title: `5. Longest versus shortest, fixed versus variable`,
        body: `Longest valid window: expand, shrink while invalid, record after shrinking. Shortest valid window: expand until valid, then shrink **while still valid**, recording inside the shrink loop (\`minimum size subarray with sum ≥ target\` works this way). Fixed size k: add the new element, remove the one at \`right - k\`, and record once \`right >= k - 1\`, no rule to check. Counting windows: every valid window ending at \`right\` counts, which is \`right - left + 1\` new subarrays per step.`
      },
      {
        title: `6. Edge cases, cost, and spotting it`,
        body: `Edge cases: empty input (loop never runs, return 0 or an empty answer), k larger than the input for a fixed window, no valid window at all (return 0 or \`""\` as the problem says), and an all-equal input. Cost: O(n) time because each index enters and leaves once, and space equals the summary (O(1) for a running sum, O(alphabet) for letter counts). Spot it by the words contiguous, substring, subarray, "every k consecutive", plus a rule like at most, no repeats, or sum at least.`
      }
    ],

    drills: [
      {
        title: `Count warm stretches`,
        q: `Given a list of daily temperatures, a length k and a threshold t, count the stretches of exactly k consecutive days whose **average** is at least t.\n\nExample: \`[2, 4, 6, 8, 1]\`, k = 3, t = 4 returns \`3\` (the averages are 4, 6 and 5).`,
        hint: `Compare the sum to t * k so you avoid decimals, and slide by adding one day and removing one.`,
        how: `I restate it: look at every block of k days in a row and count the blocks whose average meets the threshold. The brute force sums each block from scratch, which is O(n·k). The waste is that neighbouring blocks share k - 1 days. The block size is fixed, so this is a fixed window: keep the running sum, add the new day, remove the day that fell off the back, and each step is O(1). To avoid division and floating point, I compare the sum to \`t * k\`, since average >= t exactly when sum >= t * k. Trace \`[2, 4, 6, 8, 1]\`, k = 3, t = 4, so the bar is 12. First block 2+4+6 = 12, which meets the bar (count 1). Slide: +8 -2 = 18, counts (2). Slide: +1 -4 = 15, counts (3). So the answer is 3. Edge cases: k larger than the list returns 0; k equal to the length gives 0 or 1. Cost: O(n) time, O(1) space.`,
        code: { py: `def count_warm_windows(temps, k, t):
    if k <= 0 or k > len(temps):
        return 0
    window = sum(temps[:k])
    count = 1 if window >= t * k else 0
    for right in range(k, len(temps)):
        window += temps[right] - temps[right - k]
        if window >= t * k:
            count += 1
    return count` },
        explain: `Average >= t is the same as sum >= t * k, so integers suffice. Each step swaps one day in and one out, keeping the window sum exact. There are n - k + 1 windows, each in O(1): O(n) time, O(1) space.`,
        check: `assert count_warm_windows([2, 4, 6, 8, 1], 3, 4) == 3
assert count_warm_windows([5], 1, 5) == 1
assert count_warm_windows([5], 2, 1) == 0
assert count_warm_windows([], 1, 1) == 0
assert count_warm_windows([1, 1, 1, 1], 2, 2) == 0
assert count_warm_windows([-1, -2, -3], 1, -2) == 2
import random
for _ in range(200):
    a = [random.randint(-5, 9) for _ in range(random.randint(0, 9))]
    k = random.randint(1, 5); t = random.randint(-3, 6)
    brute = sum(1 for i in range(len(a) - k + 1) if sum(a[i:i + k]) >= t * k)
    assert count_warm_windows(a, k, t) == brute`
      },
      {
        title: `Longest stretch within budget`,
        q: `Each item in a list costs a positive amount. Given a budget, find the length of the longest run of **consecutive** items whose total cost is at most the budget.\n\nExample: \`[2, 1, 3, 1, 1]\`, budget \`5\` returns \`3\` (for instance 1 + 3 + 1).`,
        hint: `Costs are positive, so removing an item always lowers the total. Grow right, shrink left while over budget.`,
        how: `I restate it: biggest number of back-to-back items whose costs add to at most the budget. Brute force tries every start and end, O(n²) with running sums. The costs are all positive, which gives the monotonic property I need: if a stretch fits the budget, any smaller stretch inside it fits too, and extending a stretch can only raise its total. So a variable window works. Add \`costs[right]\` to a running total. While the total exceeds the budget, subtract \`costs[left]\` and move \`left\` up. After that the window fits, so its length is a candidate. Trace \`[2, 1, 3, 1, 1]\`, budget 5: right 0 total 2; right 1 total 3; right 2 total 6 over, drop 2 total 4, window is [1,3], length 2; right 3 total 5, length 3; right 4 total 6 over, drop 1 total 5, window [3,1,1], length 3. Best 3. Edge cases: one item above the budget gives an empty window and length 0; budget zero gives 0; an empty list gives 0. Cost: O(n) time, O(1) space.`,
        code: { py: `def longest_within_budget(costs, budget):
    left = total = best = 0
    for right, c in enumerate(costs):
        total += c
        while total > budget:
            total -= costs[left]
            left += 1
        best = max(best, right - left + 1)
    return best` },
        explain: `Positive costs make "fits the budget" monotonic under shrinking, so \`left\` never needs to move back. After the \`while\` the window fits (or is empty), so recording its length is valid. Each index is added once and removed at most once: O(n) time, O(1) space.`,
        check: `assert longest_within_budget([2, 1, 3, 1, 1], 5) == 3
assert longest_within_budget([], 5) == 0
assert longest_within_budget([9], 5) == 0
assert longest_within_budget([1, 1, 1], 0) == 0
assert longest_within_budget([1, 1, 1], 10) == 3
assert longest_within_budget([4, 4, 4], 4) == 1
import random
for _ in range(300):
    a = [random.randint(1, 6) for _ in range(random.randint(0, 9))]
    b = random.randint(0, 15)
    brute = max([j - i for i in range(len(a)) for j in range(i + 1, len(a) + 1) if sum(a[i:j]) <= b], default=0)
    assert longest_within_budget(a, b) == brute`
      },
      {
        title: `At most k kinds`,
        q: `Given a string and a number k, return the length of the longest substring that contains **at most k different characters**.\n\nExample: \`"eceba"\`, k = 2 returns \`3\` ("ece"). \`"aaaa"\`, k = 1 returns \`4\`.`,
        hint: `Keep a count per character in the window. When the number of keys exceeds k, shrink, deleting a key when its count reaches zero.`,
        how: `I restate it: the longest piece of the string that uses no more than k distinct characters. Brute force checks every substring and counts distinct characters, O(n²) or worse. Shrinking a valid window keeps it valid (fewer or equal kinds), and growing can only add kinds, so the rule is monotonic and a variable window fits. The summary is a dict from character to its count in the window; the number of kinds is the number of keys. Add \`s[right]\`. While there are more than k keys, decrement the count of \`s[left]\`, delete the key if it reaches zero (otherwise the key count is wrong), and move \`left\` up. Then record the length. Trace \`"eceba"\` with k = 2: e (1 key), c (2 keys, length 2), e (still 2 keys, window "ece", length 3), b makes 3 keys, drop e (count 1), drop c (count 0, delete key) giving window "eb" with 2 keys, length 2; a makes 3 keys again, drop e, window "ba". Best 3. Edge cases: k = 0 returns 0; empty string; k at least the number of distinct letters returns the length. Cost: O(n) time, O(k) space.`,
        code: { py: `def longest_k_distinct(s, k):
    if k <= 0:
        return 0
    counts = {}
    left = best = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        while len(counts) > k:
            out = s[left]
            counts[out] -= 1
            if counts[out] == 0:
                del counts[out]
            left += 1
        best = max(best, right - left + 1)
    return best` },
        explain: `Deleting zero-count keys keeps \`len(counts)\` equal to the number of distinct characters in the window. After the \`while\` the window has at most k kinds, so its length is a valid candidate, and every start is considered because \`left\` is the smallest valid start for each \`right\`. Each index enters and leaves once: O(n) time, O(k) space.`,
        check: `assert longest_k_distinct("eceba", 2) == 3
assert longest_k_distinct("aaaa", 1) == 4
assert longest_k_distinct("", 3) == 0
assert longest_k_distinct("abc", 0) == 0
assert longest_k_distinct("abc", 5) == 3
assert longest_k_distinct("aabbcc", 2) == 4
import random
for _ in range(300):
    s = ''.join(random.choice('abcd') for _ in range(random.randint(0, 10)))
    k = random.randint(0, 4)
    brute = max([j - i for i in range(len(s)) for j in range(i + 1, len(s) + 1) if len(set(s[i:j])) <= k], default=0)
    assert longest_k_distinct(s, k) == brute`
      },
      {
        title: `Calm stretch`,
        q: `Given a list of integers and a limit, return the length of the longest stretch of consecutive items where the **largest minus the smallest** is at most the limit.\n\nExample: \`[10, 1, 2, 4, 7, 2]\`, limit \`5\` returns \`4\` (the stretch 2, 4, 7, 2).`,
        hint: `A count map cannot tell you the new maximum after the old one leaves. Keep two deques of indices, one for maxima and one for minima.`,
        how: `I restate it: the longest run where max minus min stays within the limit. Brute force tries every start and end and takes max/min, O(n²) at best. The rule is monotonic: shrinking a valid window cannot widen the max-min gap, and growing cannot narrow it. So a variable window fits. The new difficulty is the summary. I need the window's max and min at all times, and when the current max leaves from the left I need the next largest. A running variable cannot give that. A monotonic deque can: keep a deque of indices whose values decrease from front to back, so the front is the maximum; push a new index after popping smaller values from the back; pop the front when it falls out of the window. A second deque, increasing, gives the minimum. Each index is pushed and popped at most once. Trace \`[10, 1, 2, 4, 7, 2]\` limit 5: window [10,1] gap 9 breaks, shrink to [1]; adding 2, 4, 7 gives [1,2,4,7] gap 6 breaks, shrink to [2,4,7] gap 5, length 3; adding 2 gives [2,4,7,2], gap 5, length 4. Edge cases: empty list; limit 0; single element. Cost: O(n) time, O(n) space for the deques.`,
        code: { py: `from collections import deque

def longest_calm(nums, limit):
    big, small = deque(), deque()   # indices; values decreasing / increasing
    left = best = 0
    for right, x in enumerate(nums):
        while big and nums[big[-1]] <= x:
            big.pop()
        big.append(right)
        while small and nums[small[-1]] >= x:
            small.pop()
        small.append(right)
        while nums[big[0]] - nums[small[0]] > limit:
            left += 1
            if big[0] < left:
                big.popleft()
            if small[0] < left:
                small.popleft()
        best = max(best, right - left + 1)
    return best` },
        explain: `The front of \`big\` is always the index of the window maximum and the front of \`small\` the minimum, because every smaller (larger) value behind a newer bigger (smaller) one can never be the extreme again. When \`left\` passes a front index, that index is popped. The window never becomes empty since a single element has gap 0, which is within any non-negative limit. Each index enters and leaves each deque once: O(n) time, O(n) space.`,
        check: `assert longest_calm([10, 1, 2, 4, 7, 2], 5) == 4
assert longest_calm([8, 2, 4, 7], 4) == 2
assert longest_calm([4, 2, 2, 2, 4, 4, 2, 2], 0) == 3
assert longest_calm([5], 0) == 1
assert longest_calm([], 3) == 0
import random
for _ in range(300):
    a = [random.randint(0, 12) for _ in range(random.randint(1, 10))]
    lim = random.randint(0, 8)
    brute = max(j - i for i in range(len(a)) for j in range(i + 1, len(a) + 1) if max(a[i:j]) - min(a[i:j]) <= lim)
    assert longest_calm(a, lim) == brute`
      }
    ],

    how: {
      643: `I restate it: look at every block of exactly k numbers in a row, find the block with the largest average, return that average. Brute force sums each block separately, O(n·k). The blocks overlap in k - 1 numbers, so most of that adding repeats itself. The block size is fixed, so this is a fixed window. The largest average is the largest sum divided by k, so I only need the maximum window sum and one division at the end. Sum the first k numbers. Then slide: add the number entering on the right and subtract the number leaving on the left, one in and one out. Keep the maximum sum. Trace \`[1, 12, -5, -6, 50, 3]\`, k = 4: first sum 2, then +50 -1 = 51, then +3 -12 = 42. Max 51, so the answer is 12.75. Negative numbers are fine, because the window size never depends on the values. Edge cases: k equals the length (one window), k = 1 (the largest element). Start the best from the first window, not 0, so all-negative input works. Cost: O(n) time, O(1) space.`,
      121: `I restate it: pick a day to buy and a later day to sell, maximise the difference, or return 0 if every pair loses money. Brute force tries every pair, O(n²). The bottleneck is looking back for the best buy day for each sell day. But for a given sell day, the best buy day is simply the cheapest price so far. So one number of history is enough. Walk through the prices, keep \`cheapest\`, and for each price compute \`price - cheapest\` as the profit if selling today. Keep the maximum. Think of it as a window whose left edge jumps to every new low, so no shrinking loop is needed. Trace \`[7, 1, 5, 3, 6, 4]\`: cheapest 7 then 1; profits 0, 0, 4, 2, 5, 3; best is 5 (buy at 1, sell at 6). Edge cases: strictly falling prices give 0 (never negative, because I start the best at 0); one price gives 0. Update cheapest before computing profit so selling on the buy day gives 0, which is harmless. Cost: O(n) time, O(1) space.`,
      219: `I restate it: are there two equal values at positions at most k apart? Brute force compares each element with the next k, O(n·k). Two equal values within distance k fit inside some window of k + 1 consecutive elements, so I only need to remember the last k elements, and ask "have I already seen this one in the window?" That is a fixed-size window with a set as the summary: membership is O(1). For each element, check the set first; if it is there, return true. Otherwise add it. When the set holds more than k values, remove the element that is now k positions back (\`nums[i - k]\`), so it can no longer match. Trace \`[1, 2, 3, 1]\`, k = 3: set grows to {1,2,3}, size 3 is fine, then the next 1 is found: true. With \`[1, 2, 3, 1, 2, 3]\`, k = 2: when the second 1 arrives the 1 has already been evicted (the set holds {2,3}), so no match; the answer is false. Edge cases: k = 0 means the set never holds anything, so false; a single element. Cost: O(n) time, O(min(n, k)) space.`,
      1456: `I restate it: among all substrings of length exactly k, find the largest number of vowels in one. The length is fixed, so it is a fixed window. Brute force counts the vowels of each substring from scratch, O(n·k). Instead keep a running vowel count for the current window. Count the vowels in the first k characters. Then each step adds one if the incoming character is a vowel and subtracts one if the outgoing character was a vowel, then updates the best. In Python a boolean adds as 0 or 1, so \`count += (s[right] in vowels) - (s[right - k] in vowels)\` is the whole update. Trace "abciiidef", k = 3: first window "abc" has 1 vowel; slide to "bci" 1; "cii" 2; "iii" 3 (best); "ide" 2; "def" 1. Answer 3. Edge cases: k equals the string length, a string with no vowels (answer 0), k = 1. Cost: O(n) time, O(1) space, since the vowel set has five fixed members.`,
      209: `I restate it: all numbers are positive; find the length of the shortest run whose sum is at least the target, or 0 if none. Brute force tries every start and end, O(n²). Positive numbers give me the monotonic property: adding an element can only raise the sum, removing one can only lower it. This is the shortest-valid-window shape: grow \`right\` until the sum reaches the target; then shrink \`left\` for as long as the window is still valid, recording the length each time, because a shorter valid window may exist. Record inside the shrinking loop, since the window is valid exactly then. Trace \`[2, 3, 1, 2, 4, 3]\`, target 7: after 2,3,1,2 the sum is 8, valid, length 4; drop 2, sum 6 stops; add 4, sum 10, valid length 4, drop 3 sum 7 valid length 3, drop 1 sum 6 stop; add 3, sum 9, valid length 3, drop 2 sum 7 valid length 2, drop 4 sum 3 stop. Best 2. Edge cases: no window reaches the target (return 0, not infinity); a single element at least the target gives 1. Cost: O(n) time, O(1) space.`,
      3: `I restate it: longest stretch of consecutive characters with no repeated character. Brute force extends from every start until a repeat, O(n²), and rebuilding a set per window gives O(n³). The window rule is "no repeated letter", and it is monotonic: any smaller window inside a repeat-free window is also repeat-free. So a variable window works. Two versions. The simple one keeps a set and, when the new character is already in it, removes letters from the left until it is gone. The faster-to-run one keeps the last index of each character; when the new character was last seen at position j inside the window, jump \`left\` straight to j + 1. The jump must never move \`left\` backwards, which is why I check that j is at least \`left\`. Trace "abba": a, b build "ab"; the second b was last seen at 1, so left jumps to 2; the final a was last seen at 0, which is before left, so left stays at 2. The best is 2. Edge cases: the empty string gives 0; a single space is a character. Cost: O(n) time, O(alphabet) space.`,
      1004: `I restate it: a 0/1 array; I may flip at most k zeros to ones; return the longest run of ones I can end up with. Brute force tries every window and counts zeros, O(n²). The rewrite: "a window can become all ones if it contains at most k zeros." That is a longest-window problem with the rule "zero count <= k", and it is monotonic: removing an element can only lower the zero count. So keep a counter of zeros inside the window. Add \`nums[right]\` (if it is a zero, increment). While the count exceeds k, remove \`nums[left]\` (decrement if it was a zero) and move \`left\` up. Then record the length. I never actually flip anything; I only measure how long a stretch could be fixed. Trace \`[1, 1, 0, 0, 1]\` with k = 1: window grows to [1,1,0] (one zero, length 3); the next 0 makes two zeros, so I drop from the left until a zero leaves, which leaves just the second 0 (length 1); the final 1 makes [0,1] (length 2). The best is 3. Edge cases: k = 0 gives the longest run of ones; k at least the number of zeros gives the whole length. Cost: O(n) time, O(1) space.`,
      904: `I restate it: fruits sit in a row of trees; I have two baskets, each holding one kind; I pick one fruit from each tree in a contiguous stretch; return the longest stretch. In plain words: the longest subarray with at most 2 distinct values. Brute force counts kinds for every stretch, O(n²). The rule "at most 2 kinds" is monotonic, so use a variable window. The summary is a dict of fruit kind to count inside the window. Add \`fruits[right]\`. While the dict holds more than 2 keys, decrement the count of \`fruits[left]\`, delete the key when it reaches zero, and move \`left\` up. If I forget to delete zero-count keys the key count never drops and the window shrinks too far. Trace \`[1, 2, 3, 2, 2]\`: 1,2 fits; adding 3 makes three kinds, drop 1 (delete it), window [2,3]; add 2, 2 giving [2,3,2,2], length 4. Edge cases: one tree, or all the same kind. Cost: O(n) time, O(1) space (at most three keys).`,
      424: `I restate it: change at most k characters of an uppercase string to anything; return the longest stretch that can become a single repeated letter. Brute force checks every substring, finds its most common letter, and sees whether the rest fit in the budget: O(n²) substrings times 26. The key idea: a window can be made uniform when the letters that are **not** its most common letter number at most k, i.e. \`length - maxCount <= k\`. Shrinking a valid window keeps it valid, so the variable window applies. The summary is 26 counts and the highest count. Add \`s[right]\`, update \`maxCount\`. While \`(right - left + 1) - maxCount > k\`, remove \`s[left]\` and move \`left\` up. Record the length. The max count is allowed to be stale after shrinking: it can only make the window shrink less, and the window can only grow when a real new maximum appears. Trace "AABABBA", k = 1: the window reaches length 4 at "AABA" (3 A's + 1 other), which is the answer. Edge cases: k at least the length; k = 0. Cost: O(n) time, O(26) space.`,
      567: `I restate it: does s2 contain a contiguous block that is a rearrangement of s1? Generating all permutations of s1 is n! and hopeless. Two strings are rearrangements of each other exactly when their letter counts match. The block must be exactly len(s1) long, so this is a fixed window over s2. Keep the counts of the current window in 26 slots, compared with the counts of s1. The simple version compares the two arrays of 26 each step, O(26·n), which is still linear. Build the first window of length m, then slide: add the incoming letter, remove the outgoing letter, compare. Trace s1 "ab", s2 "eidbaooo": windows "ei", "id", "db", "ba": counts of "ba" equal the counts of "ab", true. The faster refinement tracks how many of the 26 slots currently match so each step is O(1). Edge cases: s1 longer than s2 is false right away; repeated letters like "aab" need count equality, not just the same set of letters; remember to compare the last window after the loop. Cost: O(n) time, O(1) space.`,
      438: `I restate it: return every start index in s where a rearrangement of p begins. It is the permutation check again, but instead of stopping at the first match I collect all of them. Brute force sorts each block, O(n·m log m). Since the block length is fixed at len(p), it is a fixed window with 26 letter counts. Compute the counts of p once. Then walk \`right\` over s: add the incoming letter; once \`right >= m\`, remove the letter that just fell off (\`s[right - m]\`); whenever the window counts equal p's counts, append the start index \`right - m + 1\`. In Python comparing two lists of 26 is one expression. Trace s "abab", p "ab": after index 1 the window "ab" matches, start 0; after index 2 the window "ba" matches, start 1; after index 3 the window "ab" matches, start 2. Answer [0, 1, 2]. Edge cases: p longer than s returns an empty list; overlapping matches are all reported. Cost: O(26·n) which is O(n) time, O(1) space apart from the output.`,
      713: `I restate it: count the contiguous subarrays whose product is strictly less than k; all numbers are positive. Brute force multiplies every start/end pair, O(n²). All numbers are at least 1, so growing a window never lowers the product, and shrinking never raises it: monotonic. Variable window with the running product as the summary. Multiply by \`nums[right]\`. While the product is at least k, divide by \`nums[left]\` and move \`left\` up. Now every window that ends at \`right\` and starts anywhere from \`left\` to \`right\` is valid, because shrinking keeps the product small. That is \`right - left + 1\` new subarrays, so I add that to the count rather than recording a max. Trace \`[10, 5, 2, 6]\`, k = 100: right 0 adds 1, right 1 (product 50) adds 2, right 2 (product 100, shrink to 10, left 1) adds 2, right 3 (product 60) adds 3. Total 8. Edge case: if k <= 1, no product of positive integers can be below it, so return 0 (otherwise the shrink loop would run past the window). Cost: O(n) time, O(1) space.`,
      1838: `I restate it: I may add 1 to any element up to k times in total; return the highest frequency any value can reach. I can only increase numbers, so the final repeated value is some number in the array and everything I raise comes from smaller numbers. Brute force tries each target value and counts how many smaller values I can raise within budget, O(n²). Sorting puts the candidates for a given target just to its left. For a window ending at \`right\` with target \`nums[right]\`, raising every element in the window to the target costs \`nums[right] * length - windowSum\`. If that cost is within k, the window works, and shrinking the window only lowers the cost, so the rule is monotonic. Variable window: add \`nums[right]\` to the sum, while the cost exceeds k, drop \`nums[left]\` and move \`left\` up, and record the length. Trace \`[1, 2, 4]\`, k = 5: window [1,2,4] costs 4*3 - 7 = 5, which fits, so the answer is 3. Edge cases: a single element; k = 0 gives the longest run of equal numbers. Cost: O(n log n) for the sort, O(n) for the window, O(1) extra space.`,
      76: `I restate it: find the shortest piece of s that contains every character of t, counting repeats; return "" if none. Brute force checks every substring against t, far too slow. This is the shortest-valid-window shape. Grow \`right\` until the window covers t; then shrink \`left\` while it still covers, recording the best each time. The cost of checking validity must be O(1), so I keep \`need\`, a count of what t requires, which I decrement as characters enter, and a number \`missing\` of required characters still absent. A character entering reduces \`missing\` only when its need count was above zero; extras push the count negative, meaning spare copies. When \`missing\` hits 0 the window is valid, so record and shrink; a dropped character that makes its count positive again raises \`missing\` and ends the shrink. Trace s "ADOBECODEBANC", t "ABC": the first valid window is "ADOBEC" (length 6); shrinking and growing eventually finds "BANC" (length 4). Edge cases: t longer than s; repeated letters in t such as "aa" against "a". Cost: O(|s| + |t|) time, O(alphabet) space.`,
      239: `I restate it: for every window of k consecutive elements, output its maximum. Brute force takes max of each window, O(n·k). A count map cannot help, because when the maximum leaves the window I need the second largest, which a map does not know. I need an ordered structure. The idea: an element that is smaller than a newer element to its right can never be a window maximum again, because it will leave the window first and the newer one is bigger. So I can discard it. Keep a deque of indices whose values decrease from front to back. For each new index: pop smaller or equal values off the back, push the new index, pop the front if it has fallen out of the window (index at most i - k), and once i reaches k - 1, the front is the maximum. Trace \`[1, 3, -1, -3, 5]\`, k = 3: the deque holds 3, then -1, then -3; first answer is 3; the 5 clears everything and becomes the front. Edge cases: k = 1 returns the array; k equals the length gives one answer. Each index is pushed and popped once: O(n) time, O(k) space.`,
      992: `I restate it: count subarrays with exactly k different values. Brute force counts distinct values in every subarray, O(n²) or worse. A window for "exactly k" does not shrink cleanly: dropping one element can take a valid window to k - 1 kinds, so there is no safe moment to stop. But "at most k distinct" is monotonic, and counting windows is easy: after shrinking, every window that ends at \`right\` and starts in \`[left, right]\` is valid, adding \`right - left + 1\`. Then the number of subarrays with exactly k kinds equals the number with at most k minus the number with at most k - 1, because the at-most-k set contains the exactly-k set plus the at-most-(k-1) set. So write one helper \`at_most(k)\` with a counts dict (delete zero keys) and return \`at_most(k) - at_most(k - 1)\`. Trace \`[1, 2, 1, 2, 3]\`, k = 2: at most 2 gives 10, at most 1 gives 5, answer 7. Edge case: k = 1 means at_most(0), which is 0 for non-empty input, so the helper must handle k = 0 by shrinking everything. Cost: O(n) time, O(k) space.`
    }
  };
})();
