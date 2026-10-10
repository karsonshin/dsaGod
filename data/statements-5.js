/* Offer Ready: problem statements, part 5 (intervals, matrix, math, bits, range structures, big-o, hashing, language, sorting).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* intervals */
  S(57, 'Given non-overlapping intervals sorted by start, insert a new interval, merging anything it overlaps, and return the result.',
    '- `[[1,3],[6,9]]`, new `[2,5]` → `[[1,5],[6,9]]`',
    'One pass: copy intervals ending before the new one, merge all overlapping ones by taking min start and max end, then copy the rest. **O(n) time.**');
  S(56, 'Merge all overlapping intervals in a list and return the non-overlapping result.',
    '- `[[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`',
    'Sort by start; extend the last merged interval’s end when the next start is within it, otherwise start a new one. **O(n log n) time.**');
  S(435, 'Return the minimum number of intervals to remove so the rest don’t overlap (touching endpoints are fine).',
    '- `[[1,2],[2,3],[3,4],[1,3]]` → `1`',
    'Greedy: sort by end, keep an interval if its start ≥ the last kept end, and count the skipped ones. **O(n log n) time.**');
  S(252, 'Given meeting time intervals, decide whether one person can attend all of them.',
    '- `[[0,30],[5,10],[15,20]]` → `false`\n- `[[7,10],[2,4]]` → `true`',
    'Sort by start and check that each meeting starts at or after the previous one’s end. **O(n log n) time.**');
  S(253, 'Given meeting time intervals, return the minimum number of rooms required.',
    '- `[[0,30],[5,10],[15,20]]` → `2`',
    'Sort starts and ends separately and sweep with two pointers (a new room is needed when a start comes before the earliest end), or use a min-heap of end times. **O(n log n) time.**');
  S(1851, 'Given intervals `[left, right]` and queries, answer each query with the size (`right − left + 1`) of the smallest interval containing it, or -1.',
    '- `[[1,4],[2,4],[3,6],[4,4]]`, queries `[2,3,4,5]` → `[3,3,1,4]`',
    'Sort intervals by start and queries ascending. For each query push all intervals starting ≤ q into a min-heap keyed by size, pop those ending before q, and read the top. **O((n + q) log n) time.**');

  /* matrix */
  S(48, 'Rotate an n×n image matrix 90 degrees clockwise, in place.',
    '- `[[1,2,3],[4,5,6],[7,8,9]]` → `[[7,4,1],[8,5,2],[9,6,3]]`',
    'Transpose the matrix, then reverse each row. **O(n²) time, O(1) space.**');
  S(54, 'Return all elements of a matrix in spiral order starting from the top-left going right.',
    '- `[[1,2,3],[4,5,6],[7,8,9]]` → `[1,2,3,6,9,8,7,4,5]`',
    'Shrink four boundaries (top, bottom, left, right), walking one side at a time and checking the bounds again between sides. **O(m·n) time.**');
  S(73, 'If a matrix element is 0, set its entire row and column to 0, in place.',
    '- `[[1,1,1],[1,0,1],[1,1,1]]` → `[[1,0,1],[0,0,0],[1,0,1]]`',
    'Use the first row and column as markers (remember separately whether they themselves held a zero), then zero cells from the markers. **O(m·n) time, O(1) space.**');

  /* math */
  S(202, 'Repeatedly replace a number with the sum of the squares of its digits. Decide whether it reaches 1 (happy) or loops forever.',
    '- `19` → `true` (19 → 82 → 68 → 100 → 1)\n- `2` → `false`',
    'This is cycle detection: use Floyd’s slow/fast pointers on the digit-square function, or a set of seen values. **O(log n) per step, O(1) space** with Floyd.');
  S(66, 'A non-negative integer is stored as a list of digits (most significant first). Add one and return the digits.',
    '- `[1,2,3]` → `[1,2,4]`\n- `[9,9]` → `[1,0,0]`',
    'Walk from the end: a 9 becomes 0 and carries, anything else increments and returns. If all digits were 9, prepend a 1. **O(n) time.**');
  S(50, 'Compute x raised to the integer power n, where n may be negative.',
    '- `2.0`, `10` → `1024.0`\n- `2.0`, `-2` → `0.25`',
    'Fast exponentiation by squaring: halve the exponent each step, multiplying into the result on odd bits. For negative n, invert the base. **O(log n) time.** Beware `-2³¹` overflow when negating.');
  S(43, 'Multiply two non-negative integers given as strings and return the product as a string, without converting them to integers.',
    '- `"2"`, `"3"` → `"6"`\n- `"123"`, `"456"` → `"56088"`',
    'Grade-school multiplication: digit `i` times digit `j` lands in position `i + j + 1` of a result array with carry into `i + j`. Strip leading zeros. **O(m·n) time.**');
  S(2013, 'Design a class that stores points on a plane and, for a query point, counts the ways to choose three stored points that make an axis-aligned square with it. Duplicate points count separately.',
    '- Add `(3,10)`, `(11,2)`, `(3,2)`; query `(11,10)` → `1`',
    'Keep a count map of points. For a query, loop over stored points on the same column or row at distance d (diagonal match), and multiply the counts of the other two corners. **O(distinct points) per count.**');

  /* bits */
  S(136, 'Every value in a list appears twice except one. Find it using linear time and constant extra space.',
    '- `[4,1,2,1,2]` → `4`',
    'XOR all values: pairs cancel and the single value remains. **O(n) time, O(1) space.**');
  S(191, 'Return the number of 1 bits in the binary form of an unsigned integer (its Hamming weight).',
    '- `11` (`1011`) → `3`',
    'Brian Kernighan: `n &= n − 1` clears the lowest set bit; count the iterations. **O(number of set bits) time.**');
  S(338, 'For every number from 0 to n, return the count of 1 bits, as a list.',
    '- `5` → `[0,1,1,2,1,2]`',
    '`bits[i] = bits[i >> 1] + (i & 1)`, building on a smaller answer. **O(n) time.**');
  S(190, 'Reverse the bits of a 32-bit unsigned integer.',
    '- `00000010100101000001111010011100` → `00111001011110000010100101000000`',
    'Loop 32 times: shift the result left and append the lowest bit of n, then shift n right. For repeated calls, cache byte reversals. **O(1) time (32 steps).**');
  S(268, 'A list holds n distinct numbers from 0 to n, so exactly one number is missing. Find it.',
    '- `[3,0,1]` → `2`\n- `[0,1]` → `2`',
    'XOR all indices 0..n with all values (or compute `n(n+1)/2 − sum`). **O(n) time, O(1) space.**');
  S(371, 'Compute the sum of two integers without using `+` or `-`.',
    '- `1`, `2` → `3`\n- `2`, `3` → `5`',
    'Repeat: `sum = a ^ b`, `carry = (a & b) << 1` until carry is zero. In Python, mask to 32 bits and convert the sign at the end. **O(1) time (at most 32 iterations).**');
  S(7, 'Reverse the digits of a signed 32-bit integer; if the result leaves the 32-bit signed range, return 0.',
    '- `123` → `321`\n- `-123` → `-321`\n- `120` → `21`',
    'Pop digits with `% 10` and push onto the result, checking for overflow before each multiplication by 10 (against `2³¹ − 1` and `−2³¹`). **O(log n) time, O(1) space.**');

  /* range structures */
  S(307, 'Design a structure over a list that supports two operations: update one position to a new value, and sum the elements in an index range.',
    '- `[1,3,5]`: sumRange(0,2) → `9`; update(1,2); sumRange(0,2) → `8`',
    'A segment tree or a Fenwick (binary indexed) tree gives O(log n) for both operations. Build in O(n). **O(log n) per update and query.**');
  S(315, 'For each element of a list, count how many elements to its right are strictly smaller, and return those counts.',
    '- `[5,2,6,1]` → `[2,1,1,0]`',
    'Process from the right, inserting into a Fenwick tree over compressed values and querying the prefix count of smaller values; or use a merge sort that counts inversions with indices. **O(n log n) time.**');

  /* big-o */
  S(509, 'Return the n-th Fibonacci number, where `F(0) = 0`, `F(1) = 1` and `F(n) = F(n−1) + F(n−2)`.',
    '- `2` → `1`\n- `4` → `3`',
    'Iterate with two variables for **O(n) time, O(1) space**; matrix exponentiation or fast doubling gives O(log n). The naive recursion is exponential, which is the lesson of this problem.');
  S(1534, 'Count the index triples `i < j < k` of a list such that `|a[i]−a[j]| ≤ a`, `|a[j]−a[k]| ≤ b` and `|a[i]−a[k]| ≤ c`.',
    '- `[3,0,1,1,9,7]`, `a = 7`, `b = 2`, `c = 3` → `4`',
    'Three nested loops, **O(n³) time**, is accepted at the given small limits; pruning by checking the first condition before the third loop speeds it up. Prefix counts over values can reduce it to O(n²).');
  S(1588, 'Return the sum of all contiguous stretches of odd length in a list.',
    '- `[1,4,2,5,3]` → `58`',
    'Element i appears in `((i + 1)(n − i) + 1) / 2` odd-length stretches (integer division), so sum `a[i] × that`. **O(n) time, O(1) space.**');

  /* hashing-internals */
  S(705, 'Implement a hash set (add, remove, contains) without using a built-in hash table.',
    '- add 1, add 2, contains 1 → `true`, contains 3 → `false`, remove 2, contains 2 → `false`',
    'An array of buckets indexed by `hash % size`, each bucket a small list (separate chaining), resizing when the load factor grows. **O(1) average per operation.**');
  S(706, 'Implement a hash map (put, get, remove) without using a built-in hash table.',
    '- put(1,1), put(2,2), get(1) → `1`, get(3) → `-1`, put(2,1), get(2) → `1`, remove(2), get(2) → `-1`',
    'Same chaining table, storing key–value pairs; `put` updates an existing key or appends. **O(1) average per operation.**');
  S(2001, 'Rectangles are given as width–height pairs. Count the pairs of rectangles whose width/height ratio is equal.',
    '- `[[4,8],[3,6],[10,20],[15,30]]` → `6`',
    'Reduce each ratio by the gcd (or use the float quotient carefully), count frequencies, and add `c·(c−1)/2` for each ratio. **O(n log max) time.**');
  S(2352, 'Count the pairs `(r, c)` where row r and column c of an n×n grid are equal as sequences.',
    '- `[[3,2,1],[1,7,6],[2,7,7]]` → `1`',
    'Hash every row (as a tuple) into a counter, then look up each column’s tuple and add the count. **O(n²) time, O(n²) space.**');
  S(187, 'Find all 10-letter sequences in a DNA string (letters A, C, G, T) that occur more than once.',
    '- `"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"` → `["AAAAACCCCC","CCCCCAAAAA"]`',
    'Slide a window of length 10, storing seen strings in a set and collecting repeats. Encode each letter in 2 bits (a 20-bit integer) to avoid string hashing. **O(n) time.**');
  S(1461, 'Decide whether a binary string contains every possible binary code of length k as a substring.',
    '- `"00110110"`, `k = 2` → `true`\n- `"0110"`, `k = 1` → `true`\n- `"0110"`, `k = 2` → `false`',
    'Roll a k-bit mask across the string, adding values to a set; the answer is whether the set reaches `2ᵏ` entries. **O(n) time, O(2ᵏ) space.**');
  S(2261, 'Count the distinct contiguous stretches of a list that contain at most k elements divisible by p.',
    '- `[2,3,3,2,2]`, `k = 2`, `p = 2` → `11`',
    'Enumerate stretches from each start, stop once the divisible count exceeds k, and store a rolling hash (or serialized tuple) in a set. **O(n²) time** with the small limits.');
  S(2156, 'Given a polynomial rolling hash with a power and modulus, find the first substring of a given length whose hash equals a target, and return it.',
    '- `"leetcode"`, power `7`, mod `20`, length `2`, target `0` → `"ee"`',
    'Scan from the right with a rolling hash that adds the new low char and removes the char leaving the high side using precomputed `power^(k−1)`; record the last matching start (leftmost). **O(n) time.**');
  S(1316, 'Count the distinct non-empty substrings that can be written as some string followed by the same string (`a+a`).',
    '- `"abcabcabc"` → `3`\n- `"leetcodeleetcode"` → `2`',
    'For each half-length L, scan with a counter of how many consecutive positions satisfy `s[i] == s[i+L]`; when it reaches L, add that substring’s hash to a set. **O(n²) time.**');
  S(1044, 'Return any longest substring that appears at least twice in a string (overlaps allowed), or an empty string.',
    '- `"banana"` → `"ana"`\n- `"abcd"` → `""`',
    'Binary search the length; for each candidate length, use a rolling hash to detect a repeated window (verify on collision, or use two mods). **O(n log n) expected.** Suffix arrays are the deterministic alternative.');
  S(1147, 'Split a string into the maximum number of pieces `a1…ak` such that `ai` equals `a(k−i+1)` for every i.',
    '- `"ghiabcdefhelloadamhelloabcdefghi"` → `7`',
    'Greedy: match the shortest equal prefix and suffix, count 2, and recurse inward; leftover middle adds 1. A rolling hash makes comparisons cheap. **O(n) expected.**');
  S(1923, 'Several friends each give a path as a list of city numbers. Return the length of the longest contiguous sequence of cities that appears in every path.',
    '- `n = 5`, `[[0,1,2,3,4],[2,3,4],[4,0,1,2,3]]` → `2`',
    'Binary search the length L (feasibility is monotonic); for a candidate, hash all windows of length L in each path and intersect the hash sets. **O(total length · log min) time.**');

  /* language */
  S(387, 'Return the index of the first character in a string that doesn’t repeat anywhere else, or -1.',
    '- `"leetcode"` → `0`\n- `"loveleetcode"` → `2`\n- `"aabb"` → `-1`',
    'Count letters in one pass, then scan again for the first with count 1. **O(n) time, O(1) space** for a fixed alphabet.');
  S(557, 'Reverse the letters of each word in a sentence while keeping the word order and spaces.',
    '- `"Let\'s take LeetCode contest"` → `"s\'teL ekat edoCteeL tsetnoc"`',
    'Split on spaces, reverse each word, and join back; or reverse each word in place on a character array. **O(n) time.**');
  S(692, 'Return the k most frequent words. Order by higher frequency first, and break ties alphabetically.',
    '- `["i","love","leetcode","i","love","coding"]`, `k = 2` → `["i","love"]`',
    'Count with a hash map, then take the top k using a heap keyed by `(−count, word)`, or sort the unique words. **O(n log k) time.**');
  S(1636, 'Sort a list by frequency ascending; values with equal frequency go in descending order.',
    '- `[1,1,2,2,2,3]` → `[3,1,1,2,2,2]`',
    'Count frequencies and sort with the key `(count, −value)`. **O(n log n) time.**');

  /* sorting */
  S(912, 'Sort a list of integers ascending without using a built-in sort, in O(n log n) time.',
    '- `[5,2,3,1]` → `[1,2,3,5]`',
    'Merge sort (guaranteed O(n log n)) or heap sort; randomized quicksort works but needs care with many duplicates (three-way partition). **O(n log n) time.**');
  S(179, 'Arrange a list of non-negative integers so that concatenating them gives the largest possible number, returned as a string.',
    '- `[3,30,34,5,9]` → `"9534330"`',
    'Sort with a custom comparator: `a` before `b` if `a+b > b+a` as strings. If the first result is `"0"`, return `"0"`. **O(n log n) time.**');
  S(451, 'Sort the characters of a string by decreasing frequency.',
    '- `"tree"` → `"eert"`\n- `"Aabb"` → `"bbAa"`',
    'Count characters, then use bucket sort by frequency (bucket index = count) or sort the distinct characters by count; rebuild with repetition. **O(n) time with buckets.**');
  S(164, 'Return the largest gap between successive elements of the list once sorted, in linear time; return 0 for fewer than 2 elements.',
    '- `[3,6,9,1]` → `3`',
    'Bucket (pigeonhole) idea: the answer is at least `ceil((max − min)/(n − 1))`, so keep only min and max per bucket and compare across adjacent non-empty buckets. Radix sort also works. **O(n) time.**');
  S(1051, 'Students stand in a line and should be in non-decreasing height order. Count the positions where a student’s height differs from the sorted order.',
    '- `[1,1,4,2,1,3]` → `3`',
    'Counting sort the heights (the range is small), then compare with the original. **O(n + range) time.**');
  S(561, 'Pair up 2n integers to maximize the sum of the minimum of each pair.',
    '- `[1,4,3,2]` → `4` (pairs (1,2), (3,4))',
    'Sort and sum the elements at even indices; counting sort works for a small range. **O(n log n) time.**');
  S(976, 'Given stick lengths, return the largest perimeter of a triangle with non-zero area made from three of them, or 0.',
    '- `[2,1,2]` → `5`\n- `[1,2,1,10]` → `0`',
    'Sort descending; for consecutive triples check `a[i] < a[i+1] + a[i+2]`; the first success is the best. **O(n log n) time.**');
  S(1122, 'Sort `arr1` so that elements appearing in `arr2` follow arr2’s order, and the rest come after in ascending order.',
    '- `arr1 = [2,3,1,3,2,4,6,7,9,2,19]`, `arr2 = [2,1,4,3,9,6]` → `[2,2,2,1,4,3,3,9,6,7,19]`',
    'Count the values of arr1 (array or map), emit counts in arr2’s order, then emit the remaining values ascending. **O(n + m + range) time.**');
  S(274, 'A researcher’s h-index is the largest h such that at least h of their papers have at least h citations. Compute it from a list of citation counts.',
    '- `[3,0,6,1,5]` → `3`',
    'Counting sort with buckets capped at n: sweep from high to low accumulating counts until the total reaches the index. **O(n) time.**');
  S(2037, 'Seats and students are at integer positions on a line; you may move a student 1 step per move. Return the minimum total moves to seat everyone in distinct seats.',
    '- seats `[3,1,5]`, students `[2,7,4]` → `4`',
    'Sort both lists and sum `|seats[i] − students[i]|`. **O(n log n) time.**');
})();
