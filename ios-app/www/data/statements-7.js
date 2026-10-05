/* Offer Ready: problem statements, part 7 (recursion).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* recursion */
  S(779, 'Row 1 of a table is the single digit 0. Each later row is built from the row above by replacing every 0 with `01` and every 1 with `10`. Given a row number n and a 1-based position k in that row, return the digit there, without building the row.',
    '- `n = 1, k = 1` → `0`\n- `n = 2, k = 2` → `1` (row 2 is `01`)\n- `n = 4, k = 5` → `1` (row 4 is `01101001`)',
    'Position k in row n was produced by position `(k + 1) / 2` in row n − 1. If k is odd it keeps its parent’s digit; if k is even it is the opposite. Recurse up to row 1, then flip on the way back. **O(n) time, O(n) stack** (a bit-count of k − 1 gives O(1) extra space).');
  S(1137, 'Define T(0) = 0, T(1) = 1, T(2) = 1 and T(i) = T(i−1) + T(i−2) + T(i−3) for i ≥ 3. Return T(n).',
    '- `n = 4` → `4`\n- `n = 25` → `1389537`',
    'The naive recursion branches three ways and repeats work exponentially. Each value needs only the previous three, so keep three variables and slide them forward. **O(n) time, O(1) space.** (Memoizing the recursion gives the same time with O(n) space.)');
  S(112, 'Given a binary tree and a target number, report whether some path from the root down to a leaf has values that add up to the target.',
    '- Tree `[5,4,8,11,null,13,4,7,2,null,null,null,1]`, target `22` → `true` (5 → 4 → 11 → 2)\n- Tree `[1,2,3]`, target `5` → `false`\n- An empty tree → `false`',
    'At each node subtract its value from the target and recurse into both children. At a leaf, check whether the remainder is zero. Stop as soon as one side answers true. **O(n) time, O(h) stack** where h is the tree height.');
  S(938, 'Given a binary search tree and two bounds low and high, return the sum of every node value that lies between them, inclusive.',
    '- Tree `[10,5,15,3,7,null,18]`, low `7`, high `15` → `32` (7 + 10 + 15)',
    'Use the search-tree order to prune. If a node is below `low`, its whole left subtree is too small, so go right only; if above `high`, go left only; otherwise add it and visit both sides. **O(n) time worst case, O(h) stack.**');
  S(241, 'Given an expression made of non-negative integers and the operators `+`, `-` and `*`, return the result of every distinct way of grouping it with parentheses. Order does not matter.',
    '- `"2-1-1"` → `[0, 2]` (that is `(2-1)-1` and `2-(1-1)`)\n- `"2*3-4*5"` → `[-34, -14, -10, -10, 10]`',
    'Pick each operator as the **last** one evaluated. Recursively compute every result of the left part and of the right part, then combine every pair. A bare number is the base case. Cache by substring so repeated pieces are solved once. The output size (a Catalan number) dominates the cost.');
  S(784, 'Given a string of letters and digits, return every string you can make by changing each letter to upper or lower case independently. Digits stay as they are.',
    '- `"a1b2"` → `["a1b2","a1B2","A1b2","A1B2"]`\n- `"3z4"` → `["3z4","3Z4"]`',
    'Walk the string by position. At a digit, there is one choice; at a letter, two. Build each answer one character at a time and collect it when the position reaches the end. **O(n · 2^L) time**, where L is the number of letters, which is the output size.');
  S(1922, 'A passcode of length n is "good" if every digit at an even index (0, 2, 4, …) is even and every digit at an odd index is a prime (2, 3, 5 or 7). Count the good passcodes of length n, modulo 1,000,000,007. n can be as large as 10^15.',
    '- `n = 1` → `5`\n- `n = 4` → `400`\n- `n = 50` → `564908303`',
    'Even positions have 5 choices and odd positions have 4, so the answer is `5^ceil(n/2) · 4^floor(n/2)` mod p. Compute each power by repeated squaring (halve the exponent each call). **O(log n) time.** Use 64-bit or big integers for the intermediate products.');
  S(1545, 'Build strings like this: S1 = `"0"`, and for i > 1, S_i = S_(i−1) + `"1"` + reverse(invert(S_(i−1))), where invert swaps every 0 and 1. Return the k-th character (1-based) of S_n, as a string.',
    '- `n = 3, k = 1` → `"0"` (S3 is `0111001`)\n- `n = 4, k = 11` → `"1"`',
    'S_n has length 2^n − 1 and a middle `1` at position 2^(n−1). If k is that middle, answer `1`. If k is left of it, it is the same position in S_(n−1). If k is right of it, mirror it to position `length − k + 1` in S_(n−1) and invert. One recursive call per level: **O(n) time, O(n) stack.**');
})();
