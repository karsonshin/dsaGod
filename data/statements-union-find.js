/* Offer Ready: problem statements for the union-find extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(990, 'You get a list of claims about lowercase letters, each written as four characters: `x==y` says the two letters stand for the same number, and `x!=y` says they stand for different numbers. Decide whether numbers can be assigned to the letters so that every claim is true.',
    '- `["a==b","b!=a"]` → `false`\n- `["a==b","b==c","a==c"]` → `true`\n- `["a==b","b!=c","c==a"]` → `false`',
    'Equality is transitive, so merge the letters of every `==` claim into groups with union-find. Then check every `!=` claim: if its two letters share a group, the claims contradict each other. **O(m · α(26)) time, O(1) space.**');
  S(1319, 'There are `n` computers numbered `0` to `n - 1`, joined by cables, each cable linking two computers. You may unplug any cable and plug it in between any two computers. Return the fewest such moves that make every computer reachable from every other, or `-1` if it is impossible.',
    '- `n = 4`, cables `[[0,1],[0,2],[1,2]]` → `1` (move the spare cable to reach computer 3)\n- `n = 6`, cables `[[0,1],[0,2],[0,3],[1,2]]` → `-1` (not enough cables)',
    'Joining `n` computers needs at least `n - 1` cables; fewer means `-1`. Otherwise there are enough, and each move can join two separate groups, so the answer is the number of groups minus 1. Count the groups with union-find. **O(m · α(n)) time.**');
  S(1202, 'You get a string and a list of index pairs. For a pair `[a, b]` you may swap the letters at positions `a` and `b`, as many times as you like and in any order. Return the lexicographically smallest string you can reach.',
    '- `"dcab"`, pairs `[[0,3],[1,2]]` → `"bacd"`\n- `"dcab"`, pairs `[[0,3],[1,2],[0,2]]` → `"abcd"`',
    'Positions linked by swaps (directly or through others) can rearrange their letters freely. Union the pairs, collect each group\'s positions, sort the group\'s letters, and write them back in position order. **O(n log n) time.**');
})();
