/* Offer Ready: problem statements for the greedy extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(860, 'Customers queue at a stall selling one drink for 5. Each pays with a single bill of 5, 10 or 20, in order, and you start with no money. You must give exact change from the bills you have already collected. Return whether you can serve every customer.',
    '- `[5,5,5,10,20]` → `true`\n- `[5,5,10,10,20]` → `false`: the 20 needs 15 back and only one 5 is left',
    'Count fives and tens. A 10 needs one five. A 20 needs a ten plus a five if you have them, else three fives: prefer the ten, since fives are useful for both 10 and 20. **O(n) time, O(1) space.**');
  S(1005, 'You get a list of whole numbers and a count `k`. In one move you pick any element and negate it (an element may be picked again). Make exactly `k` moves so that the sum is as large as possible, and return that sum.',
    '- `[4,2,3]`, `k = 1` → `5`\n- `[2,-3,-1,5,-4]`, `k = 2` → `13`',
    'Sort, then negate the most negative numbers first while moves remain. If an odd number of moves is left, one element must end negated: subtract twice the smallest absolute value. **O(n log n).**');
  S(455, 'Each child wants a cookie of at least some size (their greed). You have cookies of various sizes and each cookie can go to only one child. Return the largest number of children who can get a cookie they are happy with.',
    '- greed `[1,2,3]`, cookies `[1,1]` → `1`\n- greed `[1,2]`, cookies `[1,2,3]` → `2`',
    'Sort both lists. Walk the cookies from smallest: if it satisfies the least greedy unsatisfied child, give it and move on, otherwise it is too small for everyone left. **O(n log n + m log m).**');
})();
