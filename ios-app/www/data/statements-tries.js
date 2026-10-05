/* Offer Ready: problem statements for the tries topic's added problems.
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* tries */
  S(14, 'Given a list of lowercase strings, return the longest string that every one of them starts with. Return an empty string if they share no first letter.',
    '- `["flower", "flow", "flight"]` → `"fl"`\n- `["dog", "racecar", "car"]` → `""`',
    'The answer is at most as long as the first string. Compare it column by column with every other string and stop at the first column where one is too short or differs. **O(total letters), O(1) extra space.** A trie also works: follow the root while each node has exactly one child and no word ends.');
  S(648, 'You get a list of stems and a sentence of space-separated words. Replace each word that starts with any stem by the **shortest** such stem; leave other words alone. Return the new sentence.',
    '- stems `["cat", "bat", "rat"]`, sentence `"the cattle was rattled"` → `"the cat was rat"`',
    'Put the stems in a trie. Walk each word through it; the first node flagged as a stem end gives the shortest stem. If the path breaks first, keep the word. **O(total letters).**');
  S(720, 'Given a list of words, find the longest word that can be built one letter at a time, where every shorter prefix of it is also a word in the list. If several tie, return the alphabetically smallest. Return an empty string if there is none.',
    '- `["w", "wo", "wor", "worl", "world"]` → `"world"`\n- `["b", "br", "bre", "a", "ab"]` → `"bre"`',
    'Sort the words and keep a set of buildable ones, starting with the empty string. A word is buildable if the word minus its last letter is in the set. Keep the longest; sorting makes ties resolve alphabetically. **O(n log n · L).** A trie with a DFS over flagged nodes also works.');
  S(1268, 'Given a list of products and a search word typed one letter at a time, return for each typed prefix up to three products that start with it, in alphabetical order.',
    '- products `["cart", "car", "cat", "dog"]`, typed `"ca"` → `[["car", "cart", "cat"], ["car", "cart", "cat"]]`',
    'Sort the products. For each prefix, binary search for its first position and take up to three neighbours that really start with it. **O(n log n + L · (log n + L)).** A trie with an alphabetical DFS, or the top three kept at each node, is the alternative.');
})();
