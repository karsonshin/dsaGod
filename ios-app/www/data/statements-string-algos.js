/* Offer Ready: problem statements for the string algorithm problems. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(28, 'Given a long text and a shorter pattern, return the position where the pattern first appears inside the text, or -1 if it never does. An empty pattern is not given.',
    '- `"sadbutsad"` with `"sad"` → `0`\n- `"leetcode"` with `"leeto"` → `-1`\n- `"aaaaab"` with `"aab"` → `3`',
    'Build the pattern\'s **prefix function** (for each position, the longest proper prefix that is also a suffix), then scan the text keeping `j`, the number of pattern letters currently matched. On a mismatch, set `j = lps[j-1]` instead of restarting. **O(n + m) time, O(m) space.** The Z-function on `pattern + "#" + text` gives the same answer.');
  S(459, 'Given a non-empty string, decide whether it can be built by writing some shorter block of it two or more times in a row.',
    '- `"abab"` → `true` (block `"ab"`)\n- `"aba"` → `false`\n- `"abcabcabc"` → `true`',
    'Compute the prefix function. Let `p = n - lps[n-1]` be the shortest period. The string is a repetition exactly when `lps[n-1] > 0` and `n % p == 0`. **O(n) time, O(n) space.** The one-liner alternative: the string occurs inside `(s + s)[1:-1]`.');
  S(214, 'You may only add letters to the **front** of a string. Return the shortest palindrome you can get this way.',
    '- `"aacecaaa"` → `"aaacecaaa"`\n- `"abcd"` → `"dcbabcd"`\n- `""` → `""`',
    'Find the longest palindromic **prefix**; the rest, reversed, goes in front. Run the prefix function on `s + "#" + reverse(s)`: its last value is the length of that longest palindromic prefix (a prefix of `s` that equals a suffix of the reverse is a prefix that reads the same backwards). **O(n) time and space.**');
  S(1392, 'Given a string, return its longest non-empty prefix that is also a suffix, where the prefix is not the whole string. Return an empty string if there is none.',
    '- `"level"` → `"l"`\n- `"ababab"` → `"abab"`\n- `"abc"` → `""`',
    'This is the last entry of the prefix function: `s[:lps[n-1]]`. A hash-based version (running prefix and suffix hashes, compared as the length grows) also works in O(n). **O(n) time, O(n) space.**');
})();
