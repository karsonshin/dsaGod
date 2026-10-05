/* Offer Ready: problem statements for the trees topic (original wording). S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(236, 'Given a binary tree (not necessarily ordered) and two nodes that are both in it, find their **lowest common ancestor**: the deepest node that has both of them in its subtree. A node counts as part of its own subtree.',
    '- Tree `[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]`, nodes 5 and 1 → `3`\n- Same tree, nodes 5 and 4 → `5` (a node can be its own ancestor)',
    'One postorder pass. Each call returns the lowest node it found that holds **a target**, or nothing. If both the left and right calls return something, the current node is where the paths meet: return it. Otherwise pass up whichever side found something. **O(n) time, O(h) stack.**');
})();
