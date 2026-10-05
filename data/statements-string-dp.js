/* Offer Ready: problem statements for the string DP extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(516, 'Given a string, find the length of the longest sequence of its letters, kept in their original order but not necessarily next to each other, that reads the same forwards and backwards.',
    '- `"bbbab"` → `4` (`"bbbb"`)\n- `"cbbd"` → `2` (`"bb"`)',
    'A sequence shared by the string and its reverse is a palindrome, so the answer is the **longest common subsequence of the string and its reverse**. Fill the usual two-string table, with a rolling row for space. **O(n²) time, O(n) space.**');
  S(583, 'Given two words, you may only delete letters (from either word, one at a time). Return the fewest deletions that make the two words identical.',
    '- `"sea"` and `"eat"` → `2` (delete s, then t)\n- `"abc"` and `"abc"` → `0`',
    'Whatever survives in both words is a common subsequence, so keep the longest one. The answer is `len(a) + len(b) - 2 * LCS(a, b)`. **O(m·n) time, O(min(m, n)) space** with a rolling row.');
  S(44, 'Given a text and a pattern, decide whether the pattern matches the **whole** text. In the pattern, `?` matches exactly one letter and `*` matches any run of letters, including an empty one.',
    '- `"aa"` with `"a"` → `false`\n- `"adceb"` with `"*a*b"` → `true`\n- `""` with `"*"` → `true`',
    'Walk both strings with two pointers. On a `*`, remember its position and the text position, and try matching nothing. On a later mismatch, go back to the last star and let it swallow one more text letter. Afterwards the rest of the pattern must be stars. **O(m·n) worst case, O(1) space**; the equivalent table `dp[i][j] = dp[i-1][j] or dp[i][j-1]` for a star is O(m·n) space.');
})();
