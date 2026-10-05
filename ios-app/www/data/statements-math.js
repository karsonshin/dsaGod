/* Offer Ready: problem statements for the math extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(204, 'Given a non-negative integer `n`, return how many prime numbers are strictly smaller than `n`. `n` can be a few million, so testing each number separately is too slow.',
    '- `n = 10` → `4` (2, 3, 5, 7)\n- `n = 0` → `0`\n- `n = 2` → `0`',
    'Use the **Sieve of Eratosthenes**. Mark every number as prime, then for each `p` with `p * p < n` that is still marked, cross out `p*p, p*p + p, ...`. Count what is left. **O(n log log n) time, O(n) space.**');
  S(172, 'Given a non-negative integer `n`, return how many zeros the number `n!` (n factorial) ends with. Do not compute the factorial.',
    '- `n = 5` → `1` (120)\n- `n = 25` → `6`\n- `n = 3` → `0`',
    'Each trailing zero is a factor 10 = 2 × 5, and fives are the scarce ones. Count them: `n/5 + n/25 + n/125 + ...` with integer division. **O(log n) time.**');
  S(9, 'Given an integer `x`, say whether it reads the same forwards and backwards in base 10. A negative number is never a palindrome.',
    '- `121` → `true`\n- `-121` → `false`\n- `10` → `false`',
    'Rule out negatives and positive numbers ending in 0. Then peel digits off the right of `x` onto a reversed number until the reversed part is at least what is left (only half the digits), and compare `x == rev` or `x == rev / 10` for an odd length. **O(log x) time, no overflow.**');
})();
