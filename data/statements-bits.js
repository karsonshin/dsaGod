/* Offer Ready: problem statements for bit manipulation extras. Original wording. S(lc, question, examples, approach). */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(231, 'Decide whether a whole number is an exact power of two (1, 2, 4, 8, ...). Zero and negative numbers are not.',
    '- `16` → `true`\n- `12` → `false`\n- `1` → `true` (2⁰)\n- `0` → `false`\n- `-8` → `false`',
    'A power of two has exactly one set bit, and subtracting 1 flips that bit and everything below it, so `n & (n - 1)` is 0. Check `n > 0 and n & (n - 1) == 0`. **O(1).**');
  S(201, 'Given two non-negative integers `left <= right`, return the bitwise AND of every integer from `left` through `right`, inclusive.',
    '- `5, 7` → `4`\n- `0, 0` → `0`\n- `6, 7` → `6`\n- `1, 2147483647` → `0`',
    'Any bit that flips somewhere in the range ends up 0. What survives is the common binary prefix of `left` and `right`. Shift both right until they are equal, counting shifts, then shift back. Or clear the lowest set bit of `right` with `right & (right - 1)` while `right > left`. **O(log n).**');
  S(137, 'Every number in a list appears exactly three times, except one that appears once. Find the odd one out in linear time and constant extra space.',
    '- `[2, 2, 3, 2]` → `3`\n- `[0, 1, 0, 1, 0, 1, 99]` → `99`',
    'Count, for each of the 32 bit positions, how many numbers have that bit set. Triplets contribute multiples of 3, so `count % 3` is the single number’s bit. Rebuild the answer from those bits (mind the sign bit in Python and Java). A two-variable state machine (`ones`, `twos`) does it in one pass. **O(32 n) time, O(1) space.**');
})();
