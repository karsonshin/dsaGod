/* Offer Ready: problem statements for the segment-tree topic. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(218, 'Each building is a rectangle standing on flat ground, given as `[left, right, height]`. Looking from far away, the buildings merge into one outline. Return the points where that outline changes height, as `[x, height]` pairs, from left to right. Each point is the left end of a flat stretch, and the final point drops to height 0. No two consecutive points may share the same height.',
    '- `[[1,4,6],[2,3,9],[6,8,4]]` → `[[1,6],[2,9],[3,6],[4,0],[6,4],[8,0]]`\n- Two buildings that touch with equal heights give no point at the join.',
    'Sweep the building edges from left to right. At a left edge add the height to a max-heap; at a right edge mark it for removal. Before reading the tallest height, pop stale tops (lazy deletion). Emit a point whenever the tallest height changes; process edges at equal x so that starts come before ends and taller starts come first. **O(n log n) time, O(n) space.** A segment tree over compressed x-coordinates also works.');
  S(699, 'Squares drop one at a time onto a number line. Each is `[left, side]`: it covers the span from `left` to `left + side`, and falls until it rests on the highest thing under that span (or the ground). Squares that only touch at an edge do not support each other. After each drop, report the height of the tallest stack so far.',
    '- `[[0,3],[2,2],[10,1]]` → `[3,5,5]`\n- `[[0,2],[2,2]]` → `[2,2]` (they only touch)',
    'Compress the span edges to a small set of coordinates, so each elementary stretch is one index. For each square, query the **maximum** height over its stretches, add the side, and **assign** that new height to the same stretches (it is at least every old height there, so assign equals chmax). A segment tree with a range-max query and a range chmax gives **O(n log n) time.**');
})();
