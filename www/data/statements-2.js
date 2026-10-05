/* Offer Ready: problem statements, part 2 (stacks, monotonic, backtracking, binary-search).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* stacks */
  S(20, 'Given a string made only of brackets `()[]{}`, decide whether every opener is closed by the matching type in the correct order.',
    '- `"()[]{}"` → `true`\n- `"(]"` → `false`\n- `"([)]"` → `false`',
    'Push each opener. On a closer, the top of the stack must be its matching opener; pop it, otherwise fail. At the end the stack must be empty. **O(n) time, O(n) space.**');
  S(155, 'Design a stack that supports push, pop, top, and retrieving the minimum element, all in constant time.',
    '- push 5, push 3, push 7 → `getMin()` is `3`; pop → `getMin()` is still `3`; pop, pop → `getMin()` is `5`',
    'Store, with each pushed value, the minimum at or below it (a second stack of minimums, or pairs). The current minimum is the top of that record, and popping restores the previous one automatically. **O(1) per operation.**');
  S(150, 'Evaluate an arithmetic expression given in reverse Polish notation (operators come after their operands). Division truncates toward zero.',
    '- `["2","1","+","3","*"]` → `9`\n- `["4","13","5","/","+"]` → `6`',
    'Scan tokens: push numbers; on an operator, pop two values (the first popped is the right operand), apply it, and push the result. The stack ends with the answer. **O(n) time.** Mind truncation toward zero for negatives.');
  S(853, 'Cars are at given positions on a one-lane road, heading to a target mile, each with its own constant speed. A car can’t pass; when it reaches a slower car it slows down and they travel together as a fleet. Count the fleets that arrive.',
    '- `target = 12`, `position = [10,8,0,5,3]`, `speed = [2,4,1,1,3]` → `3`',
    'Sort by position descending. Compute each car’s arrival time `(target - pos) / speed`. A car whose time is greater than the fleet ahead’s time starts a new fleet; otherwise it merges. A stack of times (or a running max) tracks this. **O(n log n) time.**');
  S(682, 'Score a game from a list of operations: a number records that score, `+` records the sum of the previous two scores, `D` records double the previous score, and `C` cancels the previous score. Return the total of all remaining scores.',
    '- `["5","2","C","D","+"]` → `30`',
    'Keep a stack of valid scores and apply each operation to its top entries; the answer is the stack’s sum. **O(n) time.**');
  S(1047, 'Repeatedly delete a pair of equal adjacent letters from a string until none remain, and return the result.',
    '- `"abbaca"` → `"ca"`',
    'Stream the characters onto a stack; if the next character equals the top, pop instead of pushing. The stack contents are the answer. **O(n) time.**');
  S(844, 'Two strings are typed into editors where `#` acts as backspace. Decide whether they end up with the same text.',
    '- `"ab#c"`, `"ad#c"` → `true`\n- `"a#c"`, `"b"` → `false`',
    'Simulate with a stack for each string (push letters, pop on `#`) and compare. For O(1) space, scan both strings from the back, skipping the characters that are erased. **O(n) time.**');
  S(71, 'Given an absolute Unix-style file path that may contain `.` (current directory), `..` (parent), and repeated slashes, return its simplified canonical form.',
    '- `"/home//foo/"` → `"/home/foo"`\n- `"/a/./b/../../c/"` → `"/c"`\n- `"/../"` → `"/"`',
    'Split on `/`. Ignore empty parts and `.`; for `..` pop the stack if non-empty; otherwise push the name. Join the stack with `/` and prefix a slash. **O(n) time.**');
  S(394, 'Decode a string in which `k[text]` means the text repeated k times. Encodings may nest.',
    '- `"3[a]2[bc]"` → `"aaabcbc"`\n- `"3[a2[c]]"` → `"accaccacc"`',
    'Keep a stack of (string so far, repeat count). On `[`, push the current string and count and start fresh; on `]`, pop and append the current string repeated that many times. Digits can be multi-character. **O(output length) time.**');
  S(735, 'Asteroids move along a line; the sign of a number is its direction and its size is the magnitude. Two moving toward each other collide: the smaller explodes, equal sizes both explode, and same-direction asteroids never meet. Return the survivors.',
    '- `[5,10,-5]` → `[5,10]`\n- `[8,-8]` → `[]`\n- `[10,2,-5]` → `[10]`',
    'Stack of survivors. A new left-moving asteroid fights the top while the top moves right and is smaller (pop it); equal sizes pop both; otherwise it dies or is pushed. **O(n) time.**');
  S(227, 'Evaluate an expression string with non-negative integers and `+ - * /` (no parentheses, integer division truncates toward zero).',
    '- `"3+2*2"` → `7`\n- `" 3/2 "` → `1`\n- `" 3+5 / 2 "` → `5`',
    'Track the pending operator. For `+`/`-` push the signed number; for `*`/`/` combine with the stack’s top. The answer is the stack’s sum. **O(n) time.** One-variable versions use O(1) space.');
  S(1249, 'Given a string of letters and parentheses, remove the fewest parentheses so every remaining one is matched, and return any valid result.',
    '- `"lee(t(c)o)de)"` → `"lee(t(c)o)de"`\n- `"a)b(c)d"` → `"ab(c)d"`',
    'Scan with a stack of indices of `(`; a `)` with an empty stack is invalid, otherwise it pops a match. Mark invalid `)` and the leftover `(` indices for deletion, then rebuild. **O(n) time.**');

  /* monotonic */
  S(739, 'Given a list of daily temperatures, return for each day how many days you must wait for a warmer one, or 0 if there is none.',
    '- `[73,74,75,71,69,72,76,73]` → `[1,1,4,2,1,1,0,0]`',
    'Monotonic stack of indices with decreasing temperatures. When today is warmer than the stack’s top, pop it and its answer is the index difference. **O(n) time, O(n) space.**');
  S(84, 'Given the heights of adjacent histogram bars (width 1 each), find the area of the largest rectangle that fits entirely inside.',
    '- `[2,1,5,6,2,3]` → `10`',
    'Stack of increasing heights. When a shorter bar arrives, pop taller ones; each popped bar’s rectangle spans from the previous stack index to the current index. A sentinel 0 at the end flushes the stack. **O(n) time.**');
  S(496, 'For each value in a first list `nums1` (all appear in `nums2`), find the next larger value to its right inside `nums2`, or -1.',
    '- `nums1 = [4,1,2]`, `nums2 = [1,3,4,2]` → `[-1,3,-1]`',
    'Compute next-greater for every value in `nums2` with a monotonic stack, storing results in a map, then look up each `nums1` value. **O(n + m) time.**');
  S(503, 'For a circular list, find the next larger value for each entry, wrapping around the end; use -1 when none exists.',
    '- `[1,2,1]` → `[2,-1,2]`',
    'Process indices 0 to 2n−1 (use `i % n`) with a decreasing stack, assigning answers only during the first pass. **O(n) time.**');
  S(1475, 'Each item has a price; its discount is the price of the first later item whose price is less than or equal to it. Return the final prices.',
    '- `[8,4,6,2,3]` → `[4,2,4,2,3]`',
    'Monotonic stack of indices: when the current price is at most the stack top’s price, that top gets this discount. **O(n) time.**');
  S(901, 'Design a class that receives daily stock prices one at a time and returns the “span”: the number of consecutive days up to and including today with price at most today’s.',
    '- Prices `100,80,60,70,60,75,85` → spans `1,1,1,2,1,4,6`',
    'Keep a stack of (price, span); pop everything with price ≤ today’s while accumulating their spans, then push the new pair. **Amortized O(1) per call.**');
  S(907, 'Sum the minimum value of every contiguous stretch of a list, and return the total modulo 1,000,000,007.',
    '- `[3,1,2,4]` → `17`',
    'For each element, count stretches where it is the minimum: (distance to previous smaller) × (distance to next smaller or equal), via a monotonic stack. Answer = Σ value × left × right. **O(n) time.**');
  S(402, 'Given a number as a digit string and an integer k, delete k digits so the remaining number is as small as possible.',
    '- `"1432219"`, `k = 3` → `"1219"`\n- `"10200"`, `k = 1` → `"200"`\n- `"10"`, `k = 2` → `"0"`',
    'Greedy with a stack: while the next digit is smaller than the top and removals remain, pop. Afterwards trim any leftover removals from the end and strip leading zeros. **O(n) time.**');
  S(456, 'Decide whether a list has indices `i < j < k` with `nums[i] < nums[k] < nums[j]` (a “132” shape).',
    '- `[1,2,3,4]` → `false`\n- `[3,1,4,2]` → `true`',
    'Scan from the right with a decreasing stack, keeping the largest popped value as the candidate “2”. If any value on the left is below that candidate, a 132 exists. **O(n) time.**');
  S(1438, 'Return the length of the longest contiguous stretch of a list in which the largest and smallest values differ by at most a limit.',
    '- `nums = [8,2,4,7]`, `limit = 4` → `2`\n- `nums = [10,1,2,4,7,2]`, `limit = 5` → `4`',
    'Sliding window with two monotonic deques (one for max, one for min). While `max - min > limit`, advance `left` and drop expired indices from the deques fronts. **O(n) time.**');
  S(85, 'Given a binary matrix of `0`/`1`, find the area of the largest rectangle containing only 1s.',
    '- A grid whose best block of ones is 2 rows × 3 columns → `6`',
    'Row by row, build histogram heights (consecutive ones above, including this row) and run “largest rectangle in a histogram” on each. **O(rows × cols) time.**');
  S(862, 'Return the length of the shortest contiguous stretch of a list (values may be negative) whose sum is at least k, or -1 if none exists.',
    '- `[1]`, `k = 1` → `1`\n- `[1,2]`, `k = 4` → `-1`\n- `[2,-1,2]`, `k = 3` → `3`',
    'Compute prefix sums and keep a deque of indices with increasing prefix values. While `prefix[i] - prefix[deque.front] >= k`, record the length and pop the front; pop from the back while its prefix is ≥ `prefix[i]`. **O(n) time.**');

  /* backtracking */
  S(22, 'Given n pairs of parentheses, generate every well-formed combination.',
    '- `n = 3` → `["((()))","(()())","(())()","()(())","()()()"]`',
    'Build the string character by character: add `(` while fewer than n opens have been used, add `)` while closes are fewer than opens. Every finished string of length 2n is valid. **O(4ⁿ/√n) outputs.**');
  S(78, 'Given a list of distinct integers, return all possible subsets (including the empty one).',
    '- `[1,2,3]` → `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]`',
    'Backtrack with a start index: at each node record the current path, then try adding each later element and recurse. **O(n·2ⁿ) time.**');
  S(39, 'Given distinct positive integers and a target, list all unique combinations that sum to the target. A number may be used any number of times.',
    '- `[2,3,6,7]`, `7` → `[[2,2,3],[7]]`',
    'Backtrack with a start index and a remaining sum; recurse with the same index so a number can repeat, and prune when the remainder goes negative. Sorting lets you break early. **Exponential, bounded by target / min.**');
  S(46, 'Return every ordering (permutation) of a list of distinct integers.',
    '- `[1,2,3]` → six permutations from `[1,2,3]` to `[3,2,1]`',
    'Backtrack: at each position try every element not yet used (track with a boolean array or by swapping). A full-length path is a permutation. **O(n·n!) time.**');
  S(90, 'Given a list that may contain duplicates, return all unique subsets.',
    '- `[1,2,2]` → `[[],[1],[1,2],[1,2,2],[2],[2,2]]`',
    'Sort, then use subset backtracking, but skip an element if it equals the previous one *at the same depth* (`i > start and nums[i] == nums[i-1]`). **O(n·2ⁿ) time.**');
  S(40, 'Given positive integers that may repeat and a target, list all unique combinations that sum to the target, using each list entry at most once.',
    '- `[10,1,2,7,6,1,5]`, `8` → `[[1,1,6],[1,2,5],[1,7],[2,6]]`',
    'Sort; backtrack with start index `i + 1` (each entry used once) and skip duplicates at the same depth to avoid repeated combinations. Prune when the remainder is negative. **Exponential.**');
  S(79, 'Given a grid of letters and a word, decide whether the word can be traced through adjacent (up, down, left, right) cells without reusing a cell.',
    '- Grid `ABCE / SFCS / ADEE`, word `"ABCCED"` → `true`; word `"ABCB"` → `false`',
    'DFS from every cell matching the first letter; mark the cell visited while exploring neighbors for the next letter, then unmark on return. **O(m·n·3ᴸ) time** for word length L.');
  S(131, 'Split a string into pieces so that every piece is a palindrome, and return all possible splits.',
    '- `"aab"` → `[["a","a","b"],["aa","b"]]`',
    'Backtrack on the start index: for each end index where `s[start:end]` is a palindrome, take it and recurse on the rest. Precomputing a palindrome table avoids repeated checks. **O(n·2ⁿ) time.**');
  S(17, 'On a phone keypad each digit 2 to 9 maps to letters (2 = abc, 3 = def, and so on). Given a string of digits, return every letter combination it could spell.',
    '- `"23"` → `["ad","ae","af","bd","be","bf","cd","ce","cf"]`',
    'Backtrack through the digits, trying each letter of the current digit and recursing. Return `[]` for an empty input. **O(4ⁿ·n) time.**');
  S(51, 'Place n queens on an n×n board so no two attack each other (same row, column, or diagonal). Return every distinct arrangement as a board drawing.',
    '- `n = 4` → two solutions, e.g. `[".Q..","...Q","Q...","..Q."]`',
    'Place one queen per row; track used columns and both diagonals (`r - c` and `r + c`) in sets, skip conflicts, and recurse. **O(n!) time, pruned heavily.**');

  /* binary-search */
  S(704, 'Given a sorted list of distinct integers and a target, return the target’s index or -1 if it is absent. It must run in O(log n).',
    '- `[-1,0,3,5,9,12]`, `9` → `4`\n- same list, `2` → `-1`',
    'Keep `lo` and `hi`; compare the middle value with the target and discard half. Compute `mid = lo + (hi - lo) // 2`. **O(log n) time, O(1) space.**');
  S(74, 'A matrix has rows sorted left to right, and each row’s first number is greater than the previous row’s last. Decide whether a target is in it.',
    '- `[[1,3,5,7],[10,11,16,20],[23,30,34,60]]`, `3` → `true`; `13` → `false`',
    'Treat the matrix as one sorted list of m×n entries and binary-search it, mapping index `k` to `(k // n, k % n)`. **O(log(mn)) time.**');
  S(875, 'There are piles of bananas and h hours. Each hour you pick one pile and eat up to k bananas from it (finishing it early wastes the rest of the hour). Return the smallest k that finishes all piles within h hours.',
    '- `piles = [3,6,7,11]`, `h = 8` → `4`',
    'Binary search on the answer k from 1 to max pile. For a candidate, hours needed = Σ ceil(pile / k); if ≤ h, try smaller, else larger. **O(n log max) time.**');
  S(153, 'A sorted list of distinct values has been rotated at some pivot. Find its minimum in O(log n).',
    '- `[3,4,5,1,2]` → `1`\n- `[4,5,6,7,0,1,2]` → `0`',
    'Compare `nums[mid]` with `nums[hi]`: if mid is greater, the minimum is to its right; otherwise it is at mid or to its left. Converge on it. **O(log n) time.**');
  S(33, 'Search for a target in a rotated sorted list of distinct values and return its index, or -1. Aim for O(log n).',
    '- `[4,5,6,7,0,1,2]`, `0` → `4`; `3` → `-1`',
    'At each step one half is properly sorted. Find which half, check whether the target lies within its range, and discard the other half. **O(log n) time.**');
  S(981, 'Design a time-based key-value store: `set(key, value, timestamp)` and `get(key, timestamp)`, which returns the value stored with the largest timestamp not greater than the one given (or an empty string).',
    '- set(`"love"`, `"high"`, 10); get(`"love"`, 15) → `"high"`; get(`"love"`, 5) → `""`',
    'Per key keep a list of (timestamp, value), appended in increasing order. `get` binary-searches for the rightmost timestamp ≤ the query. **O(log n) per get.**');
  S(4, 'Given two sorted lists, return the median of all their elements combined, in O(log(m + n)).',
    '- `[1,3]`, `[2]` → `2.0`\n- `[1,2]`, `[3,4]` → `2.5`',
    'Binary search the partition point in the smaller list so the left halves hold half the elements and `maxLeft <= minRight` across both lists. The median comes from those boundary values. **O(log min(m, n)) time.**');
  S(35, 'In a sorted list of distinct values, return the index of a target, or the index where it would be inserted to keep the list sorted.',
    '- `[1,3,5,6]`, `5` → `2`; `2` → `1`; `7` → `4`',
    'Lower-bound binary search: the first index whose value is ≥ target. **O(log n) time.**');
  S(744, 'Given a sorted list of letters (it wraps around) and a target letter, return the smallest letter greater than the target, wrapping to the first letter if none is larger.',
    '- `["c","f","j"]`, `"a"` → `"c"`; `"c"` → `"f"`; `"j"` → `"c"`',
    'Binary search for the first letter strictly greater than the target; use `index % n` to wrap. **O(log n) time.**');
  S(69, 'Return the integer square root of a non-negative integer (rounded down), without a built-in power function.',
    '- `4` → `2`\n- `8` → `2`',
    'Binary search `x` in `[0, n]` for the largest value with `x*x <= n`. Use division (`x <= n // x`) if overflow is a concern. **O(log n) time.**');
  S(34, 'Given a sorted list with possible duplicates and a target, return the first and last index of the target, or `[-1,-1]`.',
    '- `[5,7,7,8,8,10]`, `8` → `[3,4]`; `6` → `[-1,-1]`',
    'Run two binary searches: lower bound for the left edge and, for the right edge, the first index greater than target minus one. **O(log n) time.**');
  S(162, 'A peak is an element strictly larger than its neighbours (edges count as −∞). Return the index of any peak, in O(log n). Adjacent values are always different.',
    '- `[1,2,3,1]` → `2`\n- `[1,2,1,3,5,6,4]` → `1` or `5`',
    'Compare `nums[mid]` with `nums[mid + 1]`: if rising, a peak lies to the right; otherwise at mid or to the left. **O(log n) time.**');
  S(540, 'In a sorted list where every value appears twice except one, find the single value in O(log n).',
    '- `[1,1,2,3,3,4,4,8,8]` → `2`',
    'Before the single element, pairs start at even indices; after it, at odd. Binary search on even-aligned mid: if `nums[mid] == nums[mid+1]` the single value is to the right. **O(log n) time.**');
  S(1011, 'Packages must be shipped in the given order, in at most D days, with a ship that carries up to some weight per day. Return the smallest capacity that works.',
    '- `weights = [1,2,3,4,5,6,7,8,9,10]`, `days = 5` → `15`',
    'Binary search the capacity between max weight and total weight. Greedily simulate loading days for a candidate; if days ≤ D it’s feasible, so try smaller. **O(n log sum) time.**');
  S(1482, 'You need m bouquets, each made of k adjacent flowers, and flower `i` blooms on day `bloomDay[i]`. Return the earliest day you can make m bouquets, or -1 if impossible.',
    '- `bloomDay = [1,10,3,10,2]`, `m = 3`, `k = 1` → `3`\n- `m = 3`, `k = 2` → `-1`',
    'If `m*k > n` return -1. Otherwise binary search the day, counting consecutive bloomed runs (each run of k makes a bouquet). **O(n log maxDay) time.**');
  S(410, 'Split a list of non-negative integers into m non-empty contiguous parts so that the largest part-sum is as small as possible, and return that value.',
    '- `nums = [7,2,5,10,8]`, `m = 2` → `18`',
    'Binary search the answer between the max element and the total. For a limit, greedily cut whenever the next value would overflow it; if parts ≤ m the limit is feasible. **O(n log sum) time.**');
})();
