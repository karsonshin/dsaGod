/* Offer Ready: problem statements, part 1 (arrays-hashing, prefix-sums, two-pointers, sliding-window).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* arrays-hashing */
  S(217, 'Given a list of integers, report whether any value shows up more than once.',
    '- `[1,2,3,1]` → `true`\n- `[1,2,3,4]` → `false`',
    'Walk the list with a set of values seen so far. If the current value is already in the set, a repeat exists; otherwise add it. **O(n) time, O(n) space.** Sorting first gives O(n log n) time and O(1) extra space if memory matters.');
  S(242, 'Given two strings, decide whether one is a rearrangement of the other, using every letter exactly as many times.',
    '- `"anagram"`, `"nagaram"` → `true`\n- `"rat"`, `"car"` → `false`',
    'If the lengths differ, answer no. Otherwise count letters in the first string and subtract for the second; every count must end at zero. **O(n) time, O(1) space** for a fixed alphabet (use a hash map for Unicode).');
  S(1, 'Given a list of integers and a target, return the positions of two different elements that add up to the target. Exactly one such pair exists.',
    '- `nums = [2,7,11,15]`, `target = 9` → `[0,1]`\n- `nums = [3,2,4]`, `target = 6` → `[1,2]`',
    'For each value, the number you need is `target - value`. Keep a map from value to index; if the needed number is already in the map you have the pair, otherwise record the current value. Check before inserting so an element never pairs with itself. **O(n) time, O(n) space.**');
  S(49, 'Given a list of words, group together the words that are rearrangements of each other. Groups may come back in any order.',
    '- `["eat","tea","tan","ate","nat","bat"]` → `[["eat","tea","ate"],["tan","nat"],["bat"]]`',
    'Give each word a canonical key that all its anagrams share: either the sorted letters, or a 26-slot letter-count tuple. Append each word to the list stored under its key. **O(n·k log k)** with sorted keys, **O(n·k)** with count keys, for n words of length k.');
  S(347, 'Given a list of integers and a number k, return the k values that occur most often. The answer is guaranteed to be unambiguous.',
    '- `nums = [1,1,1,2,2,3]`, `k = 2` → `[1,2]`\n- `nums = [1]`, `k = 1` → `[1]`',
    'Count occurrences with a map. Then pick the top k by count: a min-heap of size k gives O(n log k), and bucket sort (bucket index = count, since a count can never exceed n) gives **O(n)**. Walk the buckets from high count to low until you have k values.');
  S(271, 'Design two functions: one turns a list of strings into a single string, the other turns that string back into the original list. Strings may contain any characters, including your separator.',
    '- `["lint","code","love","you"]` → encode, then decode → the same four strings\n- `["", "a"]` must survive the round trip, empty string included.',
    'Never rely on a delimiter that could appear in the data. Prefix every string with its length and a marker, like `4#lint`. To decode, read digits up to `#`, then take exactly that many characters, then repeat. **O(total length) time and space.**');
  S(36, 'Given a partially filled 9×9 Sudoku grid, say whether the filled cells so far break the rules: no repeated digit 1 to 9 in any row, column, or 3×3 box. Empty cells are `.` and don’t need to be solvable.',
    '- A grid where two `5`s sit in the same row → `false`\n- A grid with no repeats in any row, column, or box → `true`',
    'Keep a set per row, per column, and per box (box index = `(r // 3) * 3 + c // 3`). For each filled cell, if its digit is already in any of its three sets, it’s invalid; otherwise add it to all three. **O(81) = O(1) time.**');
  S(128, 'Given an unsorted list of integers, return the length of the longest run of consecutive values (like 4, 5, 6, 7), ignoring the order they appear in. Aim for linear time.',
    '- `[100,4,200,1,3,2]` → `4` (the run `1,2,3,4`)\n- `[0,3,7,2,5,8,4,6,0,1]` → `9`',
    'Put everything in a set. Only start counting from a value `v` where `v - 1` is *not* in the set (the start of a run), then walk upward while the next value exists. Each value is visited once as a non-start and once in a run, so **O(n) time, O(n) space**.');
  S(383, 'Given a ransom note and a magazine, both strings, decide whether the note can be built from magazine letters, using each magazine letter at most once.',
    '- `"a"`, `"b"` → `false`\n- `"aa"`, `"aab"` → `true`',
    'Count the magazine’s letters, then spend one count per note letter; if any count would go below zero, answer no. **O(n + m) time, O(1) space** for lowercase letters.');
  S(169, 'Given a list where one value occurs more than half the time, return that value.',
    '- `[3,2,3]` → `3`\n- `[2,2,1,1,1,2,2]` → `2`',
    'Boyer–Moore voting: keep a candidate and a counter. A matching value increments the counter, a different one decrements it, and at zero the next value becomes the candidate. The true majority outlasts every cancellation. **O(n) time, O(1) space.** A hash-map count also works.');
  S(205, 'Given two strings of equal length, decide whether you can consistently replace each character of the first to get the second: the same character always maps to the same replacement, and two different characters never map to the same one.',
    '- `"egg"`, `"add"` → `true`\n- `"foo"`, `"bar"` → `false`\n- `"badc"`, `"baba"` → `false` (two letters would both map to `b`)',
    'Maintain two maps, first→second and second→first. For each position, if either map already holds a conflicting entry, fail; otherwise record both directions. The second map is what catches the “two sources, one target” case. **O(n) time.**');
  S(448, 'Given a list of n integers, each between 1 and n, return every number from 1 to n that does not appear in the list.',
    '- `[4,3,2,7,8,2,3,1]` → `[5,6]`',
    'Use the list itself as a visited table: for each value `v`, flip the sign of the entry at index `|v| - 1`. Afterwards, any index that is still positive means `index + 1` was never seen. **O(n) time, O(1) extra space.** A set of 1..n minus the input also works with O(n) space.');

  /* prefix-sums */
  S(238, 'Given a list of integers, build a list where each entry is the product of all the other entries. Do it without division and in linear time.',
    '- `[1,2,3,4]` → `[24,12,8,6]`\n- `[-1,1,0,-3,3]` → `[0,0,9,0,0]`',
    'The product of everything except `i` is (product to the left of `i`) × (product to the right). Fill the output with left-products in one pass, then sweep right to left with a running right-product and multiply it in. **O(n) time, O(1) extra space** beyond the output.');
  S(1480, 'Given a list of integers, return its running totals: entry `i` is the sum of the first `i + 1` values.',
    '- `[1,2,3,4]` → `[1,3,6,10]`',
    'Each entry is the previous total plus the current value, so one pass suffices. This is the prefix-sum array itself. **O(n) time.**');
  S(303, 'Build a structure from a fixed list of integers that can answer many queries of the form “what is the sum of the elements from index `left` to `right`, inclusive?” quickly.',
    '- List `[-2,0,3,-5,2,-1]`: sum(0,2) → `1`, sum(2,5) → `-1`, sum(0,5) → `-3`',
    'Precompute `prefix[i]` = sum of the first `i` elements (with `prefix[0] = 0`). Then a query is `prefix[right + 1] - prefix[left]`. **O(n) to build, O(1) per query.**');
  S(724, 'Find the leftmost index where the sum of everything to its left equals the sum of everything to its right (an empty side counts as 0). Return -1 if no such index exists.',
    '- `[1,7,3,6,5,6]` → `3`\n- `[1,2,3]` → `-1`\n- `[2,1,-1]` → `0`',
    'Compute the total once. Scanning left to right with a running left sum, index `i` is a pivot when `left == total - left - nums[i]`. **O(n) time, O(1) space.**');
  S(2270, 'Count the split positions in a list where the sum of the left part is at least the sum of the right part, and the right part is not empty.',
    '- `[10,4,-8,7]` → `2`\n- `[2,3,1,0]` → `2`',
    'Get the total, then scan splits with a running left sum; a split after index `i` (for `i` < last) counts when `left >= total - left`. **O(n) time, O(1) space.**');
  S(560, 'Count the contiguous stretches of a list whose elements add up to exactly k. Values may be negative.',
    '- `nums = [1,1,1]`, `k = 2` → `2`\n- `nums = [1,2,3]`, `k = 3` → `2`',
    'A stretch ending here sums to k when an earlier prefix equals `current_prefix - k`. Keep a map of prefix-sum frequencies (seeded with `{0: 1}`), add the frequency of `current - k` to the answer, then record the current prefix. A sliding window fails because of negatives. **O(n) time, O(n) space.**');
  S(525, 'Given a list of 0s and 1s, return the length of the longest contiguous stretch that contains equally many 0s and 1s.',
    '- `[0,1]` → `2`\n- `[0,1,0]` → `2`\n- `[0,0,1,0,0,0,1,1]` → `6`',
    'Treat each 0 as -1, so a balanced stretch sums to zero. Store the first index at which each prefix sum appears; whenever the same prefix reappears, the stretch between has sum 0, so update the best length. **O(n) time, O(n) space.**');
  S(523, 'Decide whether a list contains a contiguous stretch of at least two elements whose sum is a multiple of k (zero counts as a multiple).',
    '- `nums = [23,2,4,6,7]`, `k = 6` → `true` (`2+4`)\n- `nums = [23,2,6,4,7]`, `k = 13` → `false`',
    'If two prefix sums have the same remainder mod k, the stretch between them is divisible by k. Store the earliest index of each remainder (seed remainder 0 at index -1) and require a gap of at least 2. **O(n) time, O(k) space.**');
  S(974, 'Count the contiguous stretches of a list whose sum is divisible by k.',
    '- `nums = [4,5,0,-2,-3,1]`, `k = 5` → `7`',
    'Count how many prefixes share each remainder mod k; any two prefixes with the same remainder bound a divisible stretch. Normalize negative remainders with `((r % k) + k) % k`. Answer = sum over remainders of `c·(c-1)/2` (or accumulate as you go). **O(n) time, O(k) space.**');
  S(930, 'Given a list of 0s and 1s and a goal, count the contiguous stretches whose sum equals the goal.',
    '- `nums = [1,0,1,0,1]`, `goal = 2` → `4`\n- `nums = [0,0,0,0,0]`, `goal = 0` → `15`',
    'Same prefix-sum frequency map as “subarray sum equals k”: add the count of `prefix - goal` seen so far, then record the current prefix. Because values are non-negative, “at most goal minus at most goal-1” with a sliding window also works. **O(n) time.**');
  S(1248, 'Count the contiguous stretches of a list that contain exactly k odd numbers.',
    '- `nums = [1,1,2,1,1]`, `k = 3` → `2`\n- `nums = [2,4,6]`, `k = 1` → `0`',
    'Map each value to 1 if odd, else 0, then it’s “subarray sum equals k” on a 0/1 list: keep a frequency map of how many odds were seen so far and add the count at `odds - k`. **O(n) time.**');
  S(1094, 'A car has a fixed number of seats and only drives in one direction. Each trip is `[passengers, pickup, dropoff]`, passengers board at pickup and leave at dropoff. Decide whether every trip can be served without ever exceeding capacity.',
    '- `trips = [[2,1,5],[3,3,7]]`, `capacity = 4` → `false`\n- same trips, `capacity = 5` → `true`',
    'Use a difference array over locations: add passengers at pickup, subtract at dropoff. A running sum over the array is the load at each point; if it ever exceeds capacity, answer false. **O(n + range) time.**');
  S(1109, 'There are n flights numbered 1 to n. Each booking `[first, last, seats]` reserves that many seats on every flight from `first` to `last`. Return the total seats booked on each flight.',
    '- `bookings = [[1,2,10],[2,3,20],[2,5,25]]`, `n = 5` → `[10,55,45,25,25]`',
    'Difference array: add `seats` at `first`, subtract at `last + 1`. A prefix sum of the difference array gives the per-flight totals. **O(n + bookings) time.**');
  S(304, 'Build a structure from a fixed 2D grid of integers that answers many queries for the sum inside a rectangle given by its top-left and bottom-right corners.',
    '- For a 5×5 grid, the sum for corners `(2,1)` to `(4,3)` is the total of that 3×3 block.',
    'Precompute `P[i][j]` = sum of the rectangle from (0,0) to (i-1,j-1). A query is `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]` (inclusion–exclusion). **O(mn) to build, O(1) per query.**');

  /* two-pointers */
  S(125, 'Decide whether a sentence reads the same forwards and backwards once you ignore case and everything that isn’t a letter or digit.',
    '- `"A man, a plan, a canal: Panama"` → `true`\n- `"race a car"` → `false`\n- `" "` → `true`',
    'Put one pointer at each end. Move each inward past non-alphanumeric characters, compare the lowercase characters, and stop at a mismatch. **O(n) time, O(1) space.**');
  S(167, 'Given a sorted list and a target, return the 1-indexed positions of the two elements that add to the target. Exactly one pair exists and you may not reuse an element. Use constant extra space.',
    '- `[2,7,11,15]`, `9` → `[1,2]`\n- `[2,3,4]`, `6` → `[1,3]`',
    'Start with pointers at both ends. If the sum is too small, move the left pointer right; if too large, move the right pointer left. Sortedness means each move safely discards one end. **O(n) time, O(1) space.**');
  S(15, 'Find every unique triple of values from a list that adds up to zero. The same triple must not appear twice in the output.',
    '- `[-1,0,1,2,-1,-4]` → `[[-1,-1,2],[-1,0,1]]`\n- `[0,0,0]` → `[[0,0,0]]`',
    'Sort. Fix the first value `a` (skipping duplicates), then run two pointers over the rest looking for `-a`. After finding a triple, move both pointers and skip repeats. **O(n²) time, O(1) extra space.**');
  S(11, 'Each number in a list is the height of a vertical line, spaced one unit apart. Pick two lines so that, with the x-axis, they hold the most water. Return that maximum area.',
    '- `[1,8,6,2,5,4,8,3,7]` → `49`',
    'Start with the widest pair. The area is `min(h[l], h[r]) * (r - l)`; the shorter line is the bottleneck, so move that pointer inward (moving the taller one can only shrink the area). Track the best. **O(n) time, O(1) space.**');
  S(42, 'Given the heights of bars of width 1 laid side by side, compute how much rain water would be trapped between them.',
    '- `[0,1,0,2,1,0,1,3,2,1,2,1]` → `6`\n- `[4,2,0,3,2,5]` → `9`',
    'Water above a bar = `min(tallest on its left, tallest on its right) - its height`. Use two pointers with running left-max and right-max, always advancing the side with the smaller max, since that side’s water level is already determined. **O(n) time, O(1) space.**');
  S(344, 'Reverse a list of characters in place, using constant extra memory.',
    '- `["h","e","l","l","o"]` → `["o","l","l","e","h"]`',
    'Swap the ends and walk both pointers toward the middle until they meet. **O(n) time, O(1) space.**');
  S(26, 'Given a sorted list, remove duplicates in place so each value appears once, and return how many unique values remain. The first part of the list must hold them in order.',
    '- `[1,1,2]` → `2`, list begins `[1,2]`\n- `[0,0,1,1,1,2,2,3,3,4]` → `5`, begins `[0,1,2,3,4]`',
    'A slow pointer marks where the next unique value goes; a fast pointer scans. When the fast value differs from the last kept one, copy it to the slow position and advance slow. **O(n) time, O(1) space.**');
  S(283, 'Move all zeros in a list to the end while keeping the other values in their original order. Do it in place.',
    '- `[0,1,0,3,12]` → `[1,3,12,0,0]`',
    'A write pointer tracks the next slot for a non-zero. Scan once; for each non-zero, swap it into the write slot and advance the write pointer. **O(n) time, O(1) space**, and the swap keeps writes minimal.');
  S(88, 'Two sorted lists are given; the first has extra empty room at its end, enough to hold both. Merge the second into the first so the result is sorted, in place.',
    '- `nums1 = [1,2,3,0,0,0]` (m = 3), `nums2 = [2,5,6]` (n = 3) → `[1,2,2,3,5,6]`',
    'Fill from the back. With pointers at the last real element of each list and at the last slot, place the larger of the two there and step back. No value gets overwritten before it’s used. **O(m + n) time, O(1) space.**');
  S(977, 'Given a sorted list of integers (possibly negative), return the squares of the values, also sorted.',
    '- `[-4,-1,0,3,10]` → `[0,1,9,16,100]`',
    'The largest square is at one of the two ends. Two pointers compare absolute values and write the larger square into the result from the back. **O(n) time, O(n) output.**');
  S(680, 'Decide whether a string is a palindrome, or can become one by deleting at most one character.',
    '- `"aba"` → `true`\n- `"abca"` → `true` (remove `c` or `b`)\n- `"abc"` → `false`',
    'Two pointers inward. On the first mismatch, check whether the substring that skips the left character or the one that skips the right character is a palindrome. **O(n) time, O(1) space.**');
  S(75, 'A list contains only 0, 1 and 2 (think of three colors). Sort it in place without a library sort.',
    '- `[2,0,2,1,1,0]` → `[0,0,1,1,2,2]`',
    'Dutch national flag: keep `lo` for the next slot of 0, `hi` for the next slot of 2, and a scanner `i`. A 0 swaps to `lo`, a 2 swaps to `hi` (don’t advance `i` since the swapped-in value is unchecked), a 1 just advances. **O(n) time, one pass, O(1) space.**');
  S(80, 'Given a sorted list, remove duplicates in place so that each value appears at most twice. Return the new length.',
    '- `[1,1,1,2,2,3]` → `5`, begins `[1,1,2,2,3]`',
    'Keep a write index. A value may be written if the write index is below 2 or it differs from the value two slots behind the write index. **O(n) time, O(1) space.**');
  S(16, 'Pick three values from a list whose sum is as close as possible to a target, and return that sum.',
    '- `nums = [-1,2,1,-4]`, `target = 1` → `2` (`-1 + 2 + 1`)',
    'Sort, fix one value, and run two pointers on the rest, tracking the sum closest to the target. Move the left pointer up if the sum is below target, the right pointer down if above, and return immediately on an exact hit. **O(n²) time.**');
  S(881, 'People have weights and boats carry at most two people with a combined weight limit. Return the fewest boats needed to carry everyone.',
    '- `people = [3,2,2,1]`, `limit = 3` → `3`\n- `people = [3,5,3,4]`, `limit = 5` → `4`',
    'Sort. Pair the heaviest remaining person with the lightest if they fit together; otherwise the heaviest goes alone. Either way the heaviest leaves, so each step uses one boat. **O(n log n) time.**');
  S(18, 'Find every unique group of four values from a list that adds up to a target.',
    '- `nums = [1,0,-1,0,-2,2]`, `target = 0` → `[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]`',
    'Sort, fix two values with nested loops (skipping duplicates), and finish with two pointers for the other pair. This generalizes to k-sum with recursion. **O(n³) time.** Watch for integer overflow in fixed-width languages.');

  /* sliding-window */
  S(121, 'Given a list where entry `i` is a stock’s price on day `i`, pick one day to buy and a later day to sell for the greatest profit. Return 0 if no profit is possible.',
    '- `[7,1,5,3,6,4]` → `5` (buy at 1, sell at 6)\n- `[7,6,4,3,1]` → `0`',
    'Scan once, tracking the lowest price so far; at each day, the best sale today is `price - lowest`. Update the best profit. **O(n) time, O(1) space.**');
  S(3, 'Given a string, return the length of its longest stretch with no repeated character.',
    '- `"abcabcbb"` → `3`\n- `"bbbbb"` → `1`\n- `"pwwkew"` → `3`',
    'Variable window: grow `right`, and when the new character already sits inside the window, move `left` just past its previous occurrence (a map of last-seen indices makes that a jump). Track the longest window. **O(n) time, O(alphabet) space.**');
  S(424, 'You may change at most k characters of a string to any uppercase letter. Return the length of the longest stretch you can make from one repeated letter.',
    '- `"ABAB"`, `k = 2` → `4`\n- `"AABABBA"`, `k = 1` → `4`',
    'Keep a window and the count of its most frequent letter. The window is valid when `length - maxCount <= k`; if not, slide the left edge. You don’t need to shrink `maxCount` when it goes stale, because only a larger value can improve the answer. **O(n) time.**');
  S(567, 'Decide whether the second string contains, somewhere inside it, a contiguous piece that is a rearrangement of the first string.',
    '- `"ab"`, `"eidbaooo"` → `true`\n- `"ab"`, `"eidboaoo"` → `false`',
    'A fixed window the size of the first string slides over the second. Keep letter counts for the window and compare with the target counts (or track how many letters currently match). **O(n) time, O(1) space.**');
  S(76, 'Given a string `s` and a string `t`, return the shortest contiguous piece of `s` that contains every character of `t`, with multiplicity. Return an empty string if none exists.',
    '- `s = "ADOBECODEBANC"`, `t = "ABC"` → `"BANC"`',
    'Expand `right` until the window covers all required characters (track a `need` count and a `formed` counter), then shrink `left` as far as possible while still valid, recording the smallest window. **O(|s| + |t|) time.**');
  S(239, 'A window of size k moves from left to right across a list, one step at a time. Return the maximum value inside the window at every position.',
    '- `nums = [1,3,-1,-3,5,3,6,7]`, `k = 3` → `[3,3,5,5,6,7]`',
    'Keep a deque of indices whose values are in decreasing order. Pop from the back while the new value is bigger, pop from the front when it leaves the window; the front is always the max. **O(n) time, O(k) space.**');
  S(643, 'Given a list and a window size k, find the contiguous stretch of length k with the highest average, and return that average.',
    '- `nums = [1,12,-5,-6,50,3]`, `k = 4` → `12.75`',
    'Slide a fixed window, adding the entering value and subtracting the leaving one, to maintain the sum. Return the best sum divided by k. **O(n) time, O(1) space.**');
  S(219, 'Decide whether a list has two equal values whose positions differ by at most k.',
    '- `nums = [1,2,3,1]`, `k = 3` → `true`\n- `nums = [1,2,3,1,2,3]`, `k = 2` → `false`',
    'Keep a set (or map of last indices) of the last k values. If the current value is already in it, a close duplicate exists; otherwise add it and evict the value that fell out of range. **O(n) time, O(k) space.**');
  S(1456, 'Given a string and a length k, find the largest number of vowels (a, e, i, o, u) in any stretch of k consecutive characters.',
    '- `"abciiidef"`, `k = 3` → `3`\n- `"leetcode"`, `k = 3` → `2`',
    'Fixed window: count vowels in the first k characters, then slide, adding one for an entering vowel and removing one for a leaving vowel. **O(n) time, O(1) space.**');
  S(209, 'Given a list of positive integers and a target, return the length of the shortest contiguous stretch whose sum is at least the target. Return 0 if none exists.',
    '- `target = 7`, `[2,3,1,2,4,3]` → `2` (`4 + 3`)',
    'Variable window: add values on the right; while the sum meets the target, record the length and shrink from the left. Positivity makes shrinking safe. **O(n) time, O(1) space.**');
  S(1004, 'Given a list of 0s and 1s, you may flip at most k zeros to ones. Return the length of the longest stretch of ones you can get.',
    '- `[1,1,1,0,0,0,1,1,1,1,0]`, `k = 2` → `6`',
    'Window with at most k zeros inside: extend right, and when the zero count exceeds k, advance left until it doesn’t. **O(n) time, O(1) space.**');
  S(904, 'Trees in a row each bear one fruit type. You walk right from any start, picking one fruit per tree, and you carry only two types (any amount of each). Return the most fruit you can collect.',
    '- `[1,2,1]` → `3`\n- `[0,1,2,2]` → `3`\n- `[1,2,3,2,2]` → `4`',
    'Longest window with at most two distinct values. Track counts in a map; when it holds three types, move `left` and decrement counts until one type disappears. **O(n) time, O(1) space.**');
  S(438, 'Given a string `s` and a pattern `p`, return the starting index of every piece of `s` that is a rearrangement of `p`.',
    '- `s = "cbaebabacd"`, `p = "abc"` → `[0,6]`',
    'Fixed window of length |p| with letter counts compared to the pattern’s counts at each step. Track a running “matches” number so each comparison is O(1). **O(n) time.**');
  S(713, 'Count the contiguous stretches of a list of positive integers whose product is strictly less than k.',
    '- `nums = [10,5,2,6]`, `k = 100` → `8`',
    'Window with running product: grow right, and while the product is at least k divide out the left value and advance. Every valid window ending at `right` adds `right - left + 1` new stretches. **O(n) time.** Handle `k <= 1` by returning 0.');
  S(1838, 'You may add 1 to any element, at most k times in total. Return the highest frequency any single value can reach.',
    '- `nums = [1,2,4]`, `k = 5` → `3`\n- `nums = [1,4,8,13]`, `k = 5` → `2`',
    'Sort. Keep a window where raising everything to the right-end value costs `nums[right] * length - windowSum`; shrink while that cost exceeds k. The best window length is the answer. **O(n log n) time.**');
  S(992, 'Count the contiguous stretches of a list that contain exactly k different values.',
    '- `nums = [1,2,1,2,3]`, `k = 2` → `7`',
    'Exactly k = (at most k) − (at most k−1). A helper counts stretches with at most k distinct values using a sliding window (each right edge adds `right - left + 1`). **O(n) time.**');
})();
