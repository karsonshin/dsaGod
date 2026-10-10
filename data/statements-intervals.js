/* Offer Ready: problem statements for the intervals extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(986, 'You get two lists of closed ranges `[start, end]`. Inside each list the ranges are sorted and none overlap. Return every stretch that is covered by a range from the first list and a range from the second, as a list of ranges in order. A single shared point counts as a stretch.',
    '- first `[[0,2],[5,10],[13,23],[24,25]]`, second `[[1,5],[8,12],[15,24],[25,26]]` → `[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]`\n- first `[[1,3],[5,9]]`, second `[]` → `[]`',
    'Use two pointers, one per list. The shared part of the current pair is `[max of starts, min of ends]` when that start is no later than that end. Then advance the pointer of the range that ends first, since it cannot meet anything further along in the other list. **O(n + m) time.**');
  S(452, 'Balloons hang in a line, and each balloon covers a horizontal span `[left, right]`. An arrow shot straight up at position `x` bursts every balloon whose span contains `x` (the ends count). Return the fewest arrows needed to burst all the balloons.',
    '- `[[10,16],[2,8],[1,6],[7,12]]` → `2` (one shot at 6 for the middle two, one at 12 for the others)\n- `[[1,2],[3,4],[5,6],[7,8]]` → `4`\n- `[[1,2],[2,3],[3,4],[4,5]]` → `2`',
    'Sort by right edge. Shoot at the first right edge: it is as far right as that arrow can go and still burst the first balloon, so it bursts the most others. A balloon whose left edge is past the last shot needs a new arrow, placed at its own right edge. Compare ends instead of subtracting them, since extreme values overflow. **O(n log n) time.**');
})();
