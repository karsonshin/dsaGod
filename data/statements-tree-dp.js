/* Offer Ready: problem statements, DP on trees. Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(337, 'Every node of a binary tree is a house holding some cash. Two houses joined by a parent-child link share an alarm: robbing both in one night trips it. Return the most cash you can take without ever robbing a parent and its child together.',
    '- `[3,2,3,null,3,null,1]` → `7` (rob the root 3, and the two bottom nodes 3 and 1)\n- `[3,4,5,1,3,null,1]` → `9` (rob 4 and 5)',
    'Post-order DFS returning a pair per node: the best total if that node is robbed (`val + skipL + skipR`) and if it is skipped (`max(pair of left) + max(pair of right)`). The answer is the larger half of the root pair. **O(n) time.**');
  S(968, 'You may mount a camera on any node of a binary tree. A camera watches its own node, its parent and its children. Return the fewest cameras needed so that every node is watched.',
    '- `[0,0,null,0,0]` → `1` (one camera on the left child covers all four nodes)\n- `[0,0,null,0,null,0,null,null,0]` → `2`',
    'Post-order DFS returning one of three states per node: not watched, watched without a camera, has a camera. If any child is not watched, put a camera here; if any child has one, this node is watched; otherwise it is not watched. An empty spot counts as watched. Add one more camera if the root ends up not watched. **O(n) time.**');
  S(1372, 'A zigzag walk in a binary tree starts at any node, picks a direction (left or right), steps to that child, then must switch direction at every step, and may stop whenever it likes. Its length is the number of steps. Return the longest zigzag walk in the tree.',
    '- `[1,null,1,1,1,null,null,1,1,null,1,null,null,null,1]` → `3`\n- `[1]` → `0`',
    'Post-order DFS returning a pair per node: the longest zigzag that starts here by going left, and by going right. Going left continues with the left child\'s go-right value (`1 + rightOf(left)`), and symmetrically for right. Track the maximum seen anywhere. **O(n) time.**');
})();
