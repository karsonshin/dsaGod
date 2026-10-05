/* Offer Ready: DP on trees. Schema: README.md, "Adding content".
   Tree problems use argTypes: ['tree'] (level-order arrays with null). The verify tool runs py and js; Java and C++ for tree
   arguments were compiled and run by hand (the tool can't build TreeNode inputs for them). Interview-style TreeNode is assumed:
   Python/JS `.val .left .right`, Java `TreeNode`, C++ `TreeNode*`. Worked and practice solutions share the same code and tests. */
(function () {
  var OR = (window.OR = window.OR || {});

  /* ---- shared solutions and tests (worked and practice use the same ones) ---- */
  var ROB = {
    py: `class Solution:
    def rob(self, root: Optional[TreeNode]) -> int:
        def pair(node):
            if node is None:
                return 0, 0                              # an empty tree: (rob, skip) = (0, 0)
            lt, ls = pair(node.left)
            rt, rs = pair(node.right)
            take = node.val + ls + rs                    # rob this house: both children must be skipped
            skip = max(lt, ls) + max(rt, rs)             # skip it: each child does whatever is best for itself
            return take, skip
        return max(pair(root))`,
    js: `function rob(root) {
  function pair(node) {
    if (node === null) return [0, 0];                    // an empty tree: [rob, skip] = [0, 0]
    const [lt, ls] = pair(node.left), [rt, rs] = pair(node.right);
    const take = node.val + ls + rs;                     // rob this house: both children must be skipped
    const skip = Math.max(lt, ls) + Math.max(rt, rs);    // skip it: each child does whatever is best for itself
    return [take, skip];
  }
  return Math.max(...pair(root));
}`,
    java: `class Solution {
    public int rob(TreeNode root) {
        int[] r = pair(root);
        return Math.max(r[0], r[1]);
    }

    private int[] pair(TreeNode node) {
        if (node == null) return new int[]{0, 0};         // an empty tree: {rob, skip} = {0, 0}
        int[] l = pair(node.left), r = pair(node.right);
        int take = node.val + l[1] + r[1];                // rob this house: both children must be skipped
        int skip = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);   // skip it: each child does whatever is best for itself
        return new int[]{take, skip};
    }
}`,
    cpp: `class Solution {
    pair<int, int> go(TreeNode* node) {
        if (!node) return {0, 0};                         // an empty tree: {rob, skip} = {0, 0}
        auto l = go(node->left), r = go(node->right);
        int take = node->val + l.second + r.second;       // rob this house: both children must be skipped
        int skip = max(l.first, l.second) + max(r.first, r.second);   // skip it: each child does whatever is best for itself
        return {take, skip};
    }
public:
    int rob(TreeNode* root) {
        auto r = go(root);
        return max(r.first, r.second);
    }
};`
  };
  var ROB_CASES = [
    { args: [[3, 2, 3, null, 3, null, 1]], out: 7 }, { args: [[3, 4, 5, 1, 3, null, 1]], out: 9 }, { args: [[]], out: 0 }, { args: [[5]], out: 5 },
    { args: [[2, 1, 3, null, 4]], out: 7 }, { args: [[4, 1, null, 2, null, 3]], out: 7 }, { args: [[1, 2, 3, 4, 5]], out: 12 }];

  var PATH = {
    py: `class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        best = float('-inf')
        def gain(node):
            nonlocal best
            if node is None:
                return 0                                 # an empty side adds nothing
            left = max(0, gain(node.left))               # a negative branch is not worth taking
            right = max(0, gain(node.right))
            best = max(best, node.val + left + right)    # a path that bends here can't go up: record it
            return node.val + max(left, right)           # going up, the parent may only continue one branch
        gain(root)
        return best`,
    js: `function maxPathSum(root) {
  let best = -Infinity;
  function gain(node) {
    if (node === null) return 0;                         // an empty side adds nothing
    const left = Math.max(0, gain(node.left));           // a negative branch is not worth taking
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right);      // a path that bends here can't go up: record it
    return node.val + Math.max(left, right);             // going up, the parent may only continue one branch
  }
  gain(root);
  return best;
}`,
    java: `class Solution {
    private int best;

    public int maxPathSum(TreeNode root) {
        best = Integer.MIN_VALUE;
        gain(root);
        return best;
    }

    private int gain(TreeNode node) {
        if (node == null) return 0;                       // an empty side adds nothing
        int left = Math.max(0, gain(node.left));          // a negative branch is not worth taking
        int right = Math.max(0, gain(node.right));
        best = Math.max(best, node.val + left + right);   // a path that bends here can't go up: record it
        return node.val + Math.max(left, right);          // going up, the parent may only continue one branch
    }
}`,
    cpp: `class Solution {
    int best;
    int gain(TreeNode* node) {
        if (!node) return 0;                              // an empty side adds nothing
        int left = max(0, gain(node->left));              // a negative branch is not worth taking
        int right = max(0, gain(node->right));
        best = max(best, node->val + left + right);       // a path that bends here can't go up: record it
        return node->val + max(left, right);              // going up, the parent may only continue one branch
    }
public:
    int maxPathSum(TreeNode* root) {
        best = INT_MIN;
        gain(root);
        return best;
    }
};`
  };
  var PATH_CASES = [
    { args: [[1, 2, 3]], out: 6 }, { args: [[-10, 9, 20, null, null, 15, 7]], out: 42 }, { args: [[-3]], out: -3 }, { args: [[2, -1, -2]], out: 2 },
    { args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], out: 48 }, { args: [[-2, -1]], out: -1 }, { args: [[1, null, 2, null, 3]], out: 6 }];

  var CAM = {
    py: `class Solution:
    def minCameraCover(self, root: Optional[TreeNode]) -> int:
        cameras = 0
        # state: 0 = not watched yet, 1 = watched but has no camera, 2 = has a camera
        def state(node):
            nonlocal cameras
            if node is None:
                return 1                                 # an empty spot needs nothing: count it as watched
            left, right = state(node.left), state(node.right)
            if left == 0 or right == 0:
                cameras += 1                             # a child is unwatched and only we can watch it
                return 2
            if left == 2 or right == 2:
                return 1                                 # a child's camera watches us
            return 0                                     # nobody watches us yet: leave it for the parent
        if state(root) == 0:
            cameras += 1                                 # the root has no parent to rescue it
        return cameras`,
    js: `function minCameraCover(root) {
  let cameras = 0;
  // state: 0 = not watched yet, 1 = watched but has no camera, 2 = has a camera
  function state(node) {
    if (node === null) return 1;                         // an empty spot needs nothing: count it as watched
    const left = state(node.left), right = state(node.right);
    if (left === 0 || right === 0) {
      cameras++;                                         // a child is unwatched and only we can watch it
      return 2;
    }
    if (left === 2 || right === 2) return 1;             // a child's camera watches us
    return 0;                                            // nobody watches us yet: leave it for the parent
  }
  if (state(root) === 0) cameras++;                      // the root has no parent to rescue it
  return cameras;
}`,
    java: `class Solution {
    private int cameras;

    public int minCameraCover(TreeNode root) {
        cameras = 0;
        if (state(root) == 0) cameras++;                  // the root has no parent to rescue it
        return cameras;
    }

    // state: 0 = not watched yet, 1 = watched but has no camera, 2 = has a camera
    private int state(TreeNode node) {
        if (node == null) return 1;                       // an empty spot needs nothing: count it as watched
        int left = state(node.left), right = state(node.right);
        if (left == 0 || right == 0) {
            cameras++;                                    // a child is unwatched and only we can watch it
            return 2;
        }
        if (left == 2 || right == 2) return 1;            // a child's camera watches us
        return 0;                                         // nobody watches us yet: leave it for the parent
    }
}`,
    cpp: `class Solution {
    int cameras;
    // state: 0 = not watched yet, 1 = watched but has no camera, 2 = has a camera
    int state(TreeNode* node) {
        if (!node) return 1;                              // an empty spot needs nothing: count it as watched
        int left = state(node->left), right = state(node->right);
        if (left == 0 || right == 0) {
            cameras++;                                    // a child is unwatched and only we can watch it
            return 2;
        }
        if (left == 2 || right == 2) return 1;            // a child's camera watches us
        return 0;                                         // nobody watches us yet: leave it for the parent
    }
public:
    int minCameraCover(TreeNode* root) {
        cameras = 0;
        if (state(root) == 0) cameras++;                  // the root has no parent to rescue it
        return cameras;
    }
};`
  };
  var CAM_CASES = [
    { args: [[0, 0, null, 0, 0]], out: 1 }, { args: [[0, 0, null, 0, null, 0, null, null, 0]], out: 2 }, { args: [[0]], out: 1 }, { args: [[]], out: 0 },
    { args: [[0, 0, 0]], out: 1 }, { args: [[0, 0, 0, 0, 0, 0, 0]], out: 2 }, { args: [[0, 0, 0, 0, null, null, 0, 0]], out: 2 }];

  var ZIG = {
    py: `class Solution:
    def longestZigZag(self, root: Optional[TreeNode]) -> int:
        best = 0
        def go(node):                                    # returns (longest zigzag starting left, starting right), in steps
            nonlocal best
            if node is None:
                return -1, -1                            # no node: so a step into it counts as zero steps taken
            _, left_then_right = go(node.left)
            right_then_left, _ = go(node.right)
            start_left = 1 + left_then_right             # step left, then the child must step right next
            start_right = 1 + right_then_left            # step right, then the child must step left next
            best = max(best, start_left, start_right)
            return start_left, start_right
        go(root)
        return best`,
    js: `function longestZigZag(root) {
  let best = 0;
  function go(node) {                                    // returns [longest zigzag starting left, starting right], in steps
    if (node === null) return [-1, -1];                  // no node: so a step into it counts as zero steps taken
    const leftThenRight = go(node.left)[1];
    const rightThenLeft = go(node.right)[0];
    const startLeft = 1 + leftThenRight;                 // step left, then the child must step right next
    const startRight = 1 + rightThenLeft;                // step right, then the child must step left next
    best = Math.max(best, startLeft, startRight);
    return [startLeft, startRight];
  }
  go(root);
  return best;
}`,
    java: `class Solution {
    private int best;

    public int longestZigZag(TreeNode root) {
        best = 0;
        go(root);
        return best;
    }

    // returns {longest zigzag starting left, starting right}, in steps
    private int[] go(TreeNode node) {
        if (node == null) return new int[]{-1, -1};       // no node: so a step into it counts as zero steps taken
        int leftThenRight = go(node.left)[1];
        int rightThenLeft = go(node.right)[0];
        int startLeft = 1 + leftThenRight;                // step left, then the child must step right next
        int startRight = 1 + rightThenLeft;               // step right, then the child must step left next
        best = Math.max(best, Math.max(startLeft, startRight));
        return new int[]{startLeft, startRight};
    }
}`,
    cpp: `class Solution {
    int best;
    // returns {longest zigzag starting left, starting right}, in steps
    pair<int, int> go(TreeNode* node) {
        if (!node) return {-1, -1};                       // no node: so a step into it counts as zero steps taken
        int leftThenRight = go(node->left).second;
        int rightThenLeft = go(node->right).first;
        int startLeft = 1 + leftThenRight;                // step left, then the child must step right next
        int startRight = 1 + rightThenLeft;               // step right, then the child must step left next
        best = max(best, max(startLeft, startRight));
        return {startLeft, startRight};
    }
public:
    int longestZigZag(TreeNode* root) {
        best = 0;
        go(root);
        return best;
    }
};`
  };
  var ZIG_CASES = [
    { args: [[1, null, 1, 1, 1, null, null, 1, 1, null, 1, null, null, null, 1]], out: 3 }, { args: [[1]], out: 0 }, { args: [[]], out: 0 },
    { args: [[1, 1, 1, null, 1, null, null, 1, 1, null, 1]], out: 4 }, { args: [[1, 1, 1]], out: 1 }, { args: [[1, null, 1, null, 1, null, 1]], out: 1 }];

  (OR.topics = OR.topics || []).push({
    id: 'tree-dp',

    hook: 'Dynamic programming on a tree is the same idea as the 1D kind with one twist: the “previous states” are not a row of numbers, they are the **children**. Each node asks its children a question, combines the answers, and hands a small tuple up to its parent. It is the natural next step after plain tree recursion, and it unlocks a family of problems that look hard until you see the shape: rob non-adjacent houses on a tree, the best path in a tree with negative values, the fewest cameras to cover a tree. House Robber III and Binary Tree Maximum Path Sum are classic interview questions, and the camera problem is a favorite “hard” follow-up. Once you can say *“what does a parent need to know about this subtree?”*, they all become the same twenty lines.',

    cues: [
      'A **binary tree** (or any rooted hierarchy) and an **optimization**: maximum, minimum, longest, fewest.',
      'A choice at each node that **constrains its neighbors**: “no two directly linked nodes may both be picked”, “a node can cover itself and its neighbors”.',
      'The best answer for a node depends on **two or three different situations** of its children (picked or not picked, covered or not, has a camera or not).',
      'A path or chain that may **start and end anywhere**, where a path through a node uses both sides but a path continuing upward can only use one.',
      'A plain recursive return value is not enough: the parent needs a **pair** (or a small state) back, not one number.',
      'The trap: using a single value per node and a greedy choice. If the right decision at a node depends on what the parent does, return both options and let the parent choose.'
    ],

    intuition: [
      'Think of a family business as a tree of managers. A manager must decide whether a given employee gets the afternoon off, but two linked employees can never both be off. Before deciding, the manager asks each report two questions, not one: *“how well does your team do if you are off? and if you are on?”* Both answers matter, because the manager’s own decision changes which of the two answers is allowed. Every report asks the same two questions of their own reports. That is **DP on a tree**: a post-order walk where each node returns **one small answer per situation**, built only from its children’s answers.',
      'Three steps get you through every problem in this family:',
      '1. **Pick the state of a node.** Write down the few situations the parent needs to tell apart. For House Robber III the node is **robbed** or **skipped**. For maximum path sum it is the best path **going down** from the node (the parent can extend it) versus the best path **through** the node (nothing can extend it). For camera coverage it is **has a camera**, **covered without one**, or **not covered yet**.\n2. **Write the transition.** For each state, say how to build it from the children’s states. Robbing a node forces both children into the skipped state, so `rob = val + skipL + skipR`. Skipping lets each child choose freely, so `skip = max(robL, skipL) + max(robR, skipR)`.\n3. **Process children first.** That is **post-order**: the left and right calls finish before the node computes anything. Return the tuple. The answer is read at the root, or, for path problems, tracked in a variable as you go.',
      'The one subtle idea is the split between **“best through”** and **“best down”**. A path through a node can use both children, like an arch. But when that node reports to its parent, the parent can only extend **one** branch, because a path never forks. So the node *records* the arch in a variable and *returns* only the better single branch. This is the same trick as tree diameter, with values instead of edge counts. Run the visualizer: switch between the two problems on the same tree and watch each node’s pair appear from its children’s pairs. Then the stretch idea, **rerooting**: when you need the answer for *every* node as the root, do one downward pass to collect subtree answers and one upward pass to hand each child “everything except you”.'
    ].join('\n\n'),

    viz: 'tree-dp',

    template: {
      title: 'Return a pair from post-order: (rob, skip) for house robber, (through, down) for max path sum',
      note: 'One function, two classic problems. `rob` is a post-order DFS that returns a **pair**: the best total if this node is robbed, and if it is skipped. Robbing forces both children to be skipped; skipping lets each child do its best. `gain` returns only the best path **down** from a node, but records the best path **through** it in `best` (a path that arches over a node can use both sides, but cannot continue upward), and clamps negative branches to 0. The test returns `[house robber answer, max path sum]`, so for `[3, 2, 3, null, 3, null, 1]` it is `[7, 12]`. The **visualizer above lights these exact lines**: pick a problem and step through each node.',
      code: {
        py: `def tree_dp(root):
    if root is None:
        return [0, 0]
    best = float('-inf')
    def rob(node):
        if node is None:                         #@rnull > Base case: an empty tree is worth (0, 0), robbed or not
            return 0, 0
        lt, ls = rob(node.left)                  #@rleft > Ask the left subtree for its pair (robbed, skipped)
        rt, rs = rob(node.right)                 #@rright > Ask the right subtree the same question
        take = node.val + ls + rs                #@take > Rob this node: both children must be skipped
        skip = max(lt, ls) + max(rt, rs)         #@skip > Skip this node: each child takes whatever is better for it
        return take, skip                        #@rret > Hand the pair up: the parent needs both numbers
    def gain(node):
        nonlocal best
        if node is None:                         #@gnull > Base case: an empty side adds nothing
            return 0
        left = max(0, gain(node.left))           #@gleft > Best path down the left side, ignored if it is negative
        right = max(0, gain(node.right))         #@gright > Best path down the right side, ignored if it is negative
        best = max(best, node.val + left + right)  #@through > An arch over this node uses both sides: record it, it cannot go up
        return node.val + max(left, right)       #@down > Going up, the parent can only continue one branch
    gain(root)
    return [max(rob(root)), best]`,
        js: `function treeDp(root) {
  if (root === null) return [0, 0];
  let best = -Infinity;
  function rob(node) {
    if (node === null) return [0, 0];            //@rnull > Base case: an empty tree is worth [0, 0], robbed or not
    const [lt, ls] = rob(node.left);             //@rleft > Ask the left subtree for its pair [robbed, skipped]
    const [rt, rs] = rob(node.right);            //@rright > Ask the right subtree the same question
    const take = node.val + ls + rs;             //@take > Rob this node: both children must be skipped
    const skip = Math.max(lt, ls) + Math.max(rt, rs);   //@skip > Skip this node: each child takes whatever is better for it
    return [take, skip];                         //@rret > Hand the pair up: the parent needs both numbers
  }
  function gain(node) {
    if (node === null) return 0;                 //@gnull > Base case: an empty side adds nothing
    const left = Math.max(0, gain(node.left));   //@gleft > Best path down the left side, ignored if it is negative
    const right = Math.max(0, gain(node.right)); //@gright > Best path down the right side, ignored if it is negative
    best = Math.max(best, node.val + left + right);   //@through > An arch over this node uses both sides: record it, it cannot go up
    return node.val + Math.max(left, right);     //@down > Going up, the parent can only continue one branch
  }
  gain(root);
  return [Math.max(...rob(root)), best];
}`,
        java: `class Solution {
    private int best;

    public int[] treeDp(TreeNode root) {
        if (root == null) return new int[]{0, 0};
        best = Integer.MIN_VALUE;
        gain(root);
        int[] r = rob(root);
        return new int[]{Math.max(r[0], r[1]), best};
    }

    private int[] rob(TreeNode node) {
        if (node == null) return new int[]{0, 0};       //@rnull > Base case: an empty tree is worth {0, 0}, robbed or not
        int[] l = rob(node.left);                       //@rleft > Ask the left subtree for its pair {robbed, skipped}
        int[] r = rob(node.right);                      //@rright > Ask the right subtree the same question
        int take = node.val + l[1] + r[1];              //@take > Rob this node: both children must be skipped
        int skip = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);   //@skip > Skip this node: each child takes whatever is better for it
        return new int[]{take, skip};                   //@rret > Hand the pair up: the parent needs both numbers
    }

    private int gain(TreeNode node) {
        if (node == null) return 0;                     //@gnull > Base case: an empty side adds nothing
        int left = Math.max(0, gain(node.left));        //@gleft > Best path down the left side, ignored if it is negative
        int right = Math.max(0, gain(node.right));      //@gright > Best path down the right side, ignored if it is negative
        best = Math.max(best, node.val + left + right); //@through > An arch over this node uses both sides: record it, it cannot go up
        return node.val + Math.max(left, right);        //@down > Going up, the parent can only continue one branch
    }
}`,
        cpp: `class Solution {
    int best;
    pair<int, int> rob(TreeNode* node) {
        if (!node) return {0, 0};                       //@rnull > Base case: an empty tree is worth {0, 0}, robbed or not
        auto l = rob(node->left);                       //@rleft > Ask the left subtree for its pair {robbed, skipped}
        auto r = rob(node->right);                      //@rright > Ask the right subtree the same question
        int take = node->val + l.second + r.second;     //@take > Rob this node: both children must be skipped
        int skip = max(l.first, l.second) + max(r.first, r.second);   //@skip > Skip this node: each child takes whatever is better for it
        return {take, skip};                            //@rret > Hand the pair up: the parent needs both numbers
    }
    int gain(TreeNode* node) {
        if (!node) return 0;                            //@gnull > Base case: an empty side adds nothing
        int left = max(0, gain(node->left));            //@gleft > Best path down the left side, ignored if it is negative
        int right = max(0, gain(node->right));          //@gright > Best path down the right side, ignored if it is negative
        best = max(best, node->val + left + right);     //@through > An arch over this node uses both sides: record it, it cannot go up
        return node->val + max(left, right);            //@down > Going up, the parent can only continue one branch
    }
public:
    vector<int> treeDp(TreeNode* root) {
        if (!root) return {0, 0};
        best = INT_MIN;
        gain(root);
        auto r = rob(root);
        return {max(r.first, r.second), best};
    }
};`
      },
      tests: { fn: { py: 'tree_dp', default: 'treeDp' }, argTypes: ['tree'], cases: [
        { args: [[3, 2, 3, null, 3, null, 1]], out: [7, 12] }, { args: [[3, 4, 5, 1, 3, null, 1]], out: [9, 16] }, { args: [[-10, 9, 20, null, null, 15, 7]], out: [31, 42] },
        { args: [[2, -1, -2]], out: [2, 2] }, { args: [[1]], out: [1, 1] }, { args: [[]], out: [0, 0] }, { args: [[-3]], out: [0, -3] },
        { args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], out: [33, 48] }, { args: [[1, 2, 3, 4, 5]], out: [12, 11] }, { args: [[1, null, 2, null, 3]], out: [4, 6] }] }
    },

    complexity: {
      time: 'O(n): each node combines two small tuples',
      space: 'O(h) recursion stack · O(1) extra per node (a tuple)',
      why: 'Every node is visited exactly once, and the work at a node is a handful of additions and comparisons on its children’s tuples, so the total is O(n) regardless of the tree’s shape. Nothing is stored beyond the tuple that is returned and then discarded, so the only memory is the call stack: one frame per open call, which is the tree’s **height** `h` (about log₂ n balanced, n for a chain). A memo table is never needed, because each subtree is solved once and its answer is consumed by exactly one parent: that is why returning a tuple beats caching a single value.',
      trap: 'Three traps. (1) **Returning one number when the parent needs two.** The classic wrong answer to House Robber III uses `max(rob(node.left) + rob(node.right), node.val + grandchildren)` without caching, which recomputes subtrees and takes exponential time on a deep tree. Return the pair instead. (2) **Mixing up what you record and what you return.** In max path sum you record `val + left + right` but return `val + max(left, right)`; returning the arch makes the parent build a fork, which is not a path. (3) **Initializing the best at 0.** If every value is negative, the answer is negative (the single best node), so start from `-infinity` or the first value.'
    },

    variations: [
      {
        name: 'The recipe: state, transition, post-order',
        body: 'Every problem here fits one three-line recipe. **State:** list the situations a parent must tell apart, as few as possible. **Transition:** for each state of a node, write it as a function of its two children’s states, remembering that choosing a state for the node limits which child states are allowed. **Order:** children first, so use post-order and return the tuple. Typical state sets: *robbed / skipped* (a choice that blocks neighbors); *down / through* (a path that can either continue upward or stop); *no camera and uncovered / no camera and covered / camera* (a cover problem); *start left / start right* (a path whose next step is forced). If you can’t decide what to return, ask: **what would the parent have to re-derive if I returned less?** Anything it would need to re-derive by looking inside the subtree must go in the tuple. The base case is an empty tree, and its tuple should be the identity of your transition: `(0, 0)` for sums, and “covered” for the camera problem.'
      },
      {
        name: 'Tree diameter is the same idea (best through, best down)',
        body: 'The diameter of a tree is the longest path between any two nodes, and it is **exactly** the max-path-sum trick with every value set to one edge. At each node, the longest path that arches over it is `down(left) + down(right)` (record it), and what it hands up is `1 + max(down(left), down(right))`. Write it with the vocabulary of this lesson: *through* is recorded, *down* is returned. Each node does O(1) work, so it is O(n), compared with the O(n²) of calling a height function at every node. The same shape solves “longest path where every node has the same value” and “longest increasing path in a tree”: change the condition that lets a branch extend, keep the arch-versus-branch split. The code returns the diameter in **edges**.',
        code: {
          py: `def diameter(root):
    best = 0
    def down(node):                                  # longest downward path from node, in edges
        nonlocal best
        if node is None:
            return -1                                # so a leaf has down = 0
        left, right = down(node.left), down(node.right)
        best = max(best, left + right + 2)           #> The arch over this node: both branches plus the two links
        return 1 + max(left, right)                  #> The parent can continue only one branch
    down(root)
    return best`,
          js: `function diameter(root) {
  let best = 0;
  function down(node) {                              // longest downward path from node, in edges
    if (node === null) return -1;                    // so a leaf has down = 0
    const left = down(node.left), right = down(node.right);
    best = Math.max(best, left + right + 2);         //> The arch over this node: both branches plus the two links
    return 1 + Math.max(left, right);                //> The parent can continue only one branch
  }
  down(root);
  return best;
}`,
          java: `class Solution {
    private int best;

    public int diameter(TreeNode root) {
        best = 0;
        down(root);
        return best;
    }

    private int down(TreeNode node) {                  // longest downward path from node, in edges
        if (node == null) return -1;                   // so a leaf has down = 0
        int left = down(node.left), right = down(node.right);
        best = Math.max(best, left + right + 2);       //> The arch over this node: both branches plus the two links
        return 1 + Math.max(left, right);              //> The parent can continue only one branch
    }
}`,
          cpp: `class Solution {
    int best;
    int down(TreeNode* node) {                         // longest downward path from node, in edges
        if (!node) return -1;                          // so a leaf has down = 0
        int left = down(node->left), right = down(node->right);
        best = max(best, left + right + 2);            //> The arch over this node: both branches plus the two links
        return 1 + max(left, right);                   //> The parent can continue only one branch
    }
public:
    int diameter(TreeNode* root) {
        best = 0;
        down(root);
        return best;
    }
};`
        },
        tests: { fn: 'diameter', argTypes: ['tree'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: 3 }, { args: [[1, 2]], out: 1 }, { args: [[1]], out: 0 }, { args: [[]], out: 0 },
          { args: [[1, 2, 3, 4, null, null, 5, 6, null, null, 7]], out: 6 }, { args: [[1, null, 2, null, 3, null, 4]], out: 3 }] }
      },
      {
        name: 'Camera coverage: three states and the greedy shortcut',
        body: 'For the fewest cameras, the full DP gives each node three numbers: `cam` (a camera on this node), `covered` (no camera here, but a child has one, so the node is watched), and `needs` (no camera here and nobody below watches it, so the parent must). With `INF` for impossible combinations: `cam = 1 + min(cam, covered, needs)` summed over the children; `covered = Σ min(cam, covered)` over the children, but **at least one child must have a camera** (add the smallest penalty `min(cam − covered)` if none naturally does); `needs = Σ covered` over the children (each child is watched on its own, without help from this node). The answer at the root is `min(cam, covered)`. The worked solution uses the neat fact that a **greedy** choice is optimal here: never put a camera on a leaf, put it on the *parent* of an unwatched node. That collapses the three numbers into one small state per node: *not watched*, *watched, no camera*, *has a camera*. It is the same DP with the dominated options already thrown away, which is why it is allowed to be greedy: be ready to explain **why** it is safe (a camera on a parent watches everything a camera on the leaf would, and more).'
      },
      {
        name: 'Stretch: rerooting, the answer for every node as root',
        body: 'Sometimes the question is “for each node as the root of the whole tree, what is the answer?” Running the DP from every node costs O(n²). **Rerooting** does it in O(n) with two passes. Pass one (post-order, as in this lesson) computes `down[v]`, the answer for the subtree of `v` with the original root on top. Pass two (pre-order) computes `up[v]`, the answer for “the whole tree except `v`’s subtree, viewed from `v`’s parent’s side”, from `up[parent]` and the `down` values of `v`’s **siblings**. The final answer at `v` combines `down[v]` and `up[v]`. The classic example is the sum of distances from each node to all others: `down[v]` is the sum inside the subtree plus the subtree size, and moving the root from a parent to a child makes the `size[child]` nodes one step closer and the other `n − size[child]` nodes one step further. In a binary tree a node has one sibling, so the “everything except me” value is easy; on a general tree with many children you need prefix and suffix combines (or subtract, if the operation allows it) to leave one child out in O(1). Interviews rarely ask for it, but it is the senior-level follow-up, so know the two-pass shape.'
      }
    ],

    worked: [
      {
        lc: 337,
        restate: 'Each node of a binary tree is a house holding some cash. If you rob two houses that are directly linked (a parent and its child), the alarm sounds. Return the most cash you can steal.',
        examples: '- `[3, 2, 3, null, 3, null, 1]` → 7 (rob the root 3, and the bottom 3 and 1).\n- `[3, 4, 5, 1, 3, null, 1]` → 9 (rob 4 and 5).\n- Edge cases: an empty tree (0); a single house; a chain, where it alternates; a tree whose best plan skips the root.',
        brute: 'For each house, try both options: rob it and recurse on the **grandchildren**, or skip it and recurse on the children, then take the better. It is correct but exponential-ish: the same subtree is solved again as a grandchild and as a child, so a deep tree blows up. Caching the answer in a hash map by node fixes the repetition and is a fine answer (O(n)), but it spends memory on a table you do not need.',
        insight: 'The decision at a node depends on exactly one thing from each child: **what it is worth if it is robbed, and what it is worth if it is skipped.** So let each call return that pair. If this node is robbed, the children must be skipped: `take = val + skipL + skipR`. If it is skipped, each child is free to do whatever is better for it: `skip = max(takeL, skipL) + max(takeR, skipR)`. No grandchildren, no cache, and each subtree is solved once. The answer is the better of the two numbers at the root.',
        code: ROB,
        complexity: 'O(n) time: one visit per node, with a few additions each. O(h) space for the recursion stack; the pair is a few integers.',
        say: '“The decision at a house depends on whether its children were robbed. So each call returns a pair: the best total for its subtree if its root is robbed, and if it is skipped. Robbing a house forces both children to be skipped, so rob equals its value plus their skip values. Skipping it lets each child take whichever is better, so skip is the sum of the two maxes. An empty tree returns zero, zero. The answer is the larger number at the root. It is one post-order pass: O(n) time, O(h) space, and no hash map needed, which is what the grandchildren recursion would have required.”',
        followups: [
          { q: 'How does this relate to House Robber on a street?', a: 'It is the same recurrence. On a line, `rob[i] = nums[i] + skip[i-1]` and `skip[i] = max(rob[i-1], skip[i-1])`. Here “the previous house” is a pair of children instead of one neighbor, and the pair is returned instead of stored in an array.' },
          { q: 'Why does returning a pair beat memoizing by node?', a: 'Each subtree’s answer is used by exactly one parent, so there is nothing to reuse later. Returning the pair needs no table and no node-keyed hash map, only the call stack.' },
          { q: 'What if the houses were not binary, but an N-ary tree?', a: 'Sum over all the children instead of two: `take = val + Σ skip(child)`, `skip = Σ max(take(child), skip(child))`. Same shape, same O(n).' },
          { q: 'Could you also return which houses to rob?', a: 'Yes: return the pair’s totals as before, then walk down from the root once more. At a node that was chosen to be robbed, mark it and force its children to skip; at a skipped node, each child follows whichever of its two numbers is bigger.' }
        ]
      },
      {
        lc: 124,
        restate: 'A path in a binary tree is a chain of nodes connected by parent-child links, using each node at most once, and it can start and end at any nodes (it does not need to pass through the root). The path sum is the total of its values. Return the maximum path sum. Values can be negative, and a path has at least one node.',
        examples: '- `[1, 2, 3]` → 6 (2, 1, 3).\n- `[-10, 9, 20, null, null, 15, 7]` → 42 (15, 20, 7, bending at 20; the root’s -10 is left out).\n- Edge cases: a single negative node `[-3]` → -3; every value negative (the answer is the single largest node); a chain.',
        brute: 'For every pair of nodes, find the path between them and add up its values: O(n²) pairs and, done naively, O(n) per path, which is far too slow. A slightly better idea runs a DFS from each node as the start, which is still O(n²). The tree structure lets one pass do all of it.',
        insight: 'Every path has a **highest node**, where it turns around (or just ends). So for each node ask two different questions. **Best path down from here** (`down`): the node plus at most one child’s downward path, which a parent can extend. **Best path bending here** (`through`): the node plus the better downward path on **each** side, which nothing can extend, because a path never forks. Record the second in a variable, return the first. A branch with a negative value is never worth taking, so clamp each side with `max(0, ...)`. The best `through` over all nodes is the answer; start the variable at negative infinity so all-negative trees work.',
        code: PATH,
        complexity: 'O(n) time: each node does a constant amount of work after its two children return. O(h) space for the recursion stack, up to O(n) for a chain.',
        say: '“Every path has a highest node, so I consider each node as the top of the path. A recursive function returns the best gain going down from a node: its value plus the larger of its two children’s gains, where a negative gain is clamped to zero because I can simply not take that branch. At each node I also compute the path that bends there, the value plus both gains, and keep the maximum of those in a variable. The return value and the recorded value differ because a parent can only extend one branch, but the answer path can use both. I initialize the best to negative infinity since all values might be negative. O(n) time, O(h) space.”',
        followups: [
          { q: 'Why return `val + max(left, right)` and not `val + left + right`?', a: 'The returned number is what the parent may extend. A path cannot split into a fork, so only one side can continue upward. The two-sided value is recorded in `best`, where it is a complete path that ends here.' },
          { q: 'What if the problem asked for the path’s nodes, not just the sum?', a: 'Also remember, per node, which child gave the better gain, and remember the node where `best` was last improved. Then rebuild the arch: walk down both sides from that node following the saved choices.' },
          { q: 'How is this different from the diameter?', a: 'It is the same split between “through” and “down”. In the diameter every node is worth one edge, so negative branches never occur and the clamp is unnecessary; here values vary, so a negative branch must be dropped.' },
          { q: 'What happens with all-negative values if you start `best` at 0?', a: 'It returns 0, which is wrong: a path must contain a node, so the answer is the largest single (least negative) value. Starting from negative infinity, and clamping the *child gains* but not the node itself, gives the right answer.' }
        ]
      },
      {
        lc: 968,
        restate: 'You can put a camera on any node of a binary tree. A camera watches its own node, its parent and its children. Return the fewest cameras needed to watch every node.',
        examples: '- `[0, 0, null, 0, 0]` → 1 (a camera on the left child watches its parent and its two children).\n- `[0, 0, null, 0, null, 0, null, null, 0]` (a chain of five) → 2.\n- Edge cases: a single node (1); an empty tree (0); a root with two leaves (1, on the root).',
        brute: 'Try every subset of nodes as camera positions and keep the smallest one that covers everything: O(2^n · n). A cleaner brute force is a DP with three numbers per node (camera here, covered by a child, not covered), which is correct and O(n), and is the real answer; the greedy state below is the same DP with the options that can never win already removed.',
        insight: 'Work from the **bottom up**. A leaf should never get a camera: its parent watches the leaf and more. So let each node report one of three states: **0 = not watched yet**, **1 = watched but has no camera**, **2 = has a camera**. If **any child is not watched** (state 0), this node must hold a camera, because nobody else can reach that child: return 2. If a child has a camera and none is unwatched, this node is watched: return 1. If both children are watched without cameras, nothing watches this node yet, so report 0 and let the **parent** deal with it. An empty spot counts as watched (state 1), so it neither demands a camera nor offers one. The root has no parent: if it ends up in state 0, add one more camera.',
        code: CAM,
        complexity: 'O(n) time: one post-order visit per node. O(h) space for the recursion stack.',
        say: '“I walk bottom-up and each node reports one of three states: not watched, watched without a camera, or has a camera. An empty child counts as watched. If any child is not watched, this node needs a camera, so I count one and return the camera state. Otherwise, if a child has a camera, this node is watched. Otherwise it is not watched yet and the parent will handle it. A leaf therefore never gets a camera, which is the greedy part: a camera on the parent covers everything a leaf’s camera would and more. At the end, if the root is still unwatched, I add one more. That is O(n) time and O(h) space. The fully general DP carries camera, covered and uncovered costs per node, and this is that DP with the dominated choices removed.”',
        followups: [
          { q: 'Why is it safe to never put a camera on a leaf?', a: 'Exchange argument: any solution with a camera on a leaf can move it to the leaf’s parent. The parent watches the leaf, itself, its parent and its other child, which is a superset of what the leaf’s camera watched, so the count does not go up.' },
          { q: 'How would you write the exact three-number DP?', a: 'Per node, `cam`, `covered` and `needs`. `cam = 1 + Σ min(cam, covered, needs)` over children; `needs = Σ covered`; `covered = Σ min(cam, covered)` but with at least one child in `cam` (add the smallest extra cost if none is). The answer at the root is `min(cam, covered)`.' },
          { q: 'What changes if the camera also watches grandchildren, or cameras cost different amounts?', a: 'The greedy argument may stop holding, so go back to the DP and widen the state (for example, “covered, and the camera is one level down”). With weights, the three-number DP with costs added is the safe version.' },
          { q: 'Why add a camera at the end if the root is in state 0?', a: 'State 0 means nothing watches the root and, with no parent, no one else ever will. One camera on the root fixes it.' }
        ]
      },
      {
        lc: 1372,
        restate: 'A zigzag walk in a binary tree starts at any node and picks a direction. It steps to that child, then must switch direction at every step (left, right, left, ...) and may stop whenever it likes. Its length is the number of steps taken. Return the longest zigzag walk anywhere in the tree.',
        examples: '- `[1, null, 1, 1, 1, null, null, 1, 1, null, 1, null, null, null, 1]` → 3.\n- `[1]` → 0 (no steps).\n- Edge cases: a chain that always goes the same way (length 1); a perfectly alternating chain, where the length is n − 1.',
        brute: 'From every node, try both starting directions and follow the forced alternation as far as it goes, keeping the longest: O(n · h), which is O(n²) on a long chain. Each walk repeats work that the walks starting lower down already did.',
        insight: 'The answer for the walk that starts at a node and goes **left** is one step, then whatever the walk starting at the left child that goes **right** is. So each node only needs two numbers: the longest zigzag **starting by going left** and **starting by going right**. `startLeft = 1 + startRight(left child)` and `startRight = 1 + startLeft(right child)`. Return the pair and track the maximum over all nodes. Use `-1` for a missing child, so stepping into nothing contributes zero steps: a leaf gets `1 + (-1) = 0`.',
        code: ZIG,
        complexity: 'O(n) time: each node combines two numbers from its children. O(h) space for the recursion stack.',
        say: '“A zigzag from a node is determined by its first direction, so each node returns two numbers: the longest zigzag that starts by going left, and the longest that starts by going right. Going left means one step plus the longest zigzag from the left child that starts by going right, because the direction must flip. Going right is symmetric. A missing child returns minus one so that stepping into it adds zero. I keep the maximum over all nodes, and since a zigzag may start anywhere, that is the answer. O(n) time, O(h) space.”',
        followups: [
          { q: 'Why is -1 the right value for a missing child?', a: 'The step into a missing child is not a real step. With `-1`, `1 + (-1) = 0`, so a leaf reports a walk of length 0. A common alternative is to count nodes instead of steps and subtract one at the end.' },
          { q: 'Could the best zigzag be hiding under a node that is not on the longest path?', a: 'Yes, which is why `best` is updated at every node, not only at the root. A zigzag may start anywhere, and two different subtrees may hold different candidates.' },
          { q: 'How is this the same shape as max path sum?', a: 'Both return a small tuple describing the best walk that starts here and goes down, and both track a global best. Here the tuple is indexed by the forced first direction; in path sum it is indexed by through versus down.' },
          { q: 'What if the walk could also go up to the parent?', a: 'It becomes a general path problem and the state needs to say which neighbor you came from. That is rerooting territory: a downward pass for the subtree, then an upward pass for the rest of the tree.' }
        ]
      }
    ],

    practice: [
      { lc: 124,
        hints: ['Every path has one highest node. Treat each node as the top of a path and ask what the best path bending there is worth.', 'A parent can only extend **one** branch downward, so the function you recurse with returns `val + max(left, right)`, while the arch `val + left + right` is only recorded.', 'Clamp each branch with `max(0, ...)`, and start the best at negative infinity, because every value might be negative.'],
        solution: { explain: 'Post-order `gain(node)` returns the best downward path from the node (never negative on the sides, thanks to the clamp) and records `val + left + right` in a running maximum. One pass: O(n) time, O(h) space.', code: { py: PATH.py, js: PATH.js } },
        starter: { py: 'class Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function maxPathSum(root) {\n  \n}' },
        tests: { fn: 'maxPathSum', argTypes: ['tree'], cases: PATH_CASES } },

      { lc: 337,
        hints: ['Whether you may rob a house depends on whether its children were robbed. What would you like to know about each child?', 'Return two numbers per node: the best total if it is robbed, and the best if it is skipped.', 'Robbed: `val + skipLeft + skipRight`. Skipped: `max(pair of left) + max(pair of right)`. The answer is the max of the root’s pair.'],
        solution: { explain: 'A post-order DFS returning `(rob, skip)`. A robbed node forces both children into skip; a skipped node lets each child choose its better option. O(n) time, O(h) space, and no hash map.', code: { py: ROB.py, js: ROB.js } },
        starter: { py: 'class Solution:\n    def rob(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function rob(root) {\n  \n}' },
        tests: { fn: 'rob', argTypes: ['tree'], cases: ROB_CASES } },

      { lc: 968,
        hints: ['A camera on a leaf is never better than one on its parent. Think about which nodes should get cameras starting from the bottom.', 'Let each node return a state: not watched, watched without a camera, or holds a camera. An empty spot counts as watched.', 'If a child is not watched, you need a camera. If a child has one, you are watched. Otherwise you are not watched yet. Don’t forget the root.'],
        solution: { explain: 'Post-order with three states. A node with an unwatched child gets a camera; a node next to a camera is watched; otherwise it is left for the parent. If the root finishes unwatched, add one camera. O(n) time, O(h) space.', code: { py: CAM.py, js: CAM.js } },
        starter: { py: 'class Solution:\n    def minCameraCover(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function minCameraCover(root) {\n  \n}' },
        tests: { fn: 'minCameraCover', argTypes: ['tree'], cases: CAM_CASES } },

      { lc: 1372,
        hints: ['A zigzag is fully decided by which way it first steps. What two numbers would a node report to its parent?', 'The longest zigzag that starts by going left continues with what the left child does when it starts by going right.', '`startLeft = 1 + startRight(left)` and `startRight = 1 + startLeft(right)`. Use -1 for a missing child, and keep the best over every node.'],
        solution: { explain: 'Post-order returning `(startLeft, startRight)` in steps. Each node extends its child’s opposite-direction value by one step, and the best over all nodes is the answer. O(n) time, O(h) space.', code: { py: ZIG.py, js: ZIG.js } },
        starter: { py: 'class Solution:\n    def longestZigZag(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function longestZigZag(root) {\n  \n}' },
        tests: { fn: 'longestZigZag', argTypes: ['tree'], cases: ZIG_CASES } }
    ],

    mistakes: [
      '**Returning one number when the parent needs a pair.** If the right choice at a node depends on whether the parent took it, a single value cannot answer both situations. Decide the states first (robbed / skipped, covered / not), then return one number per state.',
      '**Recursing on grandchildren without a cache.** The “rob this, jump to the grandchildren” recursion solves the same subtrees again and again, which is exponential on a deep tree. Return the pair from the children instead of reaching two levels down.',
      '**Returning the arch.** In max path sum, return `val + max(left, right)`, not `val + left + right`. The arch is a finished path and cannot be extended; if you return it, the parent will build a path that forks.',
      '**Forgetting to clamp negative branches, or clamping the node itself.** Each *side* gets `max(0, gain)` (you may leave a bad branch out), but the node’s own value always counts, since a path has at least one node. If you clamp the node too, an all-negative tree answers 0.',
      '**Starting the best answer at 0.** For path-style answers with negative values, start at negative infinity (`-inf`, `Integer.MIN_VALUE`). Test `[-3]`: the answer is -3.',
      '**Getting the empty-tree base case wrong.** It must be the identity of your transition: `(0, 0)` for the robber pair; “covered” for cameras (so an empty child neither asks for nor provides a camera); `-1` for zigzag lengths so a step into nothing adds zero. A wrong base case is usually off by one at the leaves.',
      '**Forgetting the root in the camera problem.** The root has no parent to rescue it, so if it finishes in the “not watched” state you must add one more camera. Test a single node and a root with two leaves.',
      '**Counting edges versus nodes.** Diameter and zigzag lengths count edges (steps); depth and some path definitions count nodes. Check the one-node tree: 0 edges, 1 node.',
      '**Language gotchas.** *Python:* `nonlocal` is needed to update `best` from the inner function, and deep trees hit `RecursionError` near 1000 frames; unpacking a tuple of `None` fails. *JavaScript:* `Math.max(...pair)` is fine for a pair but not for a huge array; `-Infinity` is the right sentinel. *Java:* returning `int[]` allocates per node (fine), and `Integer.MIN_VALUE + something` overflows, so avoid arithmetic on the sentinel. *C++:* a member `best` must be reset at the start of each call, and `INT_MIN + x` overflows the same way.'
    ],

    quiz: [
      { kind: 'concept', q: 'In House Robber III, why does each node return a **pair** instead of one number?',
        choices: ['Whether the parent may rob this node’s children depends on whether this node was robbed, so the parent needs the best total for both cases', 'It makes the recursion run in O(log n)', 'A pair is needed to compare the left and right subtrees', 'A single number would overflow'], answer: 0,
        explain: 'The parent’s two options use different numbers from a child: robbing the parent needs the child’s **skip** value, skipping the parent lets the child take the better of its two. With only one number the parent cannot choose correctly. The pair is what makes it linear.' },
      { kind: 'concept', q: 'A node has children whose pairs are `(rob, skip)` = `(4, 3)` and `(5, 2)`, and the node’s value is 6. What pair does the node return?',
        choices: ['(11, 9)', '(15, 9)', '(11, 7)', '(6, 9)'], answer: 0,
        explain: 'Rob the node: `6 + 3 + 2 = 11` (both children skipped). Skip the node: `max(4, 3) + max(5, 2) = 4 + 5 = 9`. So `(11, 9)`; the answer at a root would be `max(11, 9)`.' },
      { kind: 'concept', q: 'In maximum path sum, a node computes `through = val + left + right` but returns `val + max(left, right)`. Why different?',
        choices: ['A path that arches over the node is complete and cannot be extended; the parent can continue only one branch', 'It is a bug: both should be the same', 'To avoid counting negative values twice', 'Because `max` is faster than `+`'], answer: 0,
        explain: 'Paths do not fork. The arch uses both sides and ends there, so it is recorded in the answer variable. What goes up to the parent must be a single downward branch it can extend.' },
      { kind: 'bug', q: 'This max path sum returns 0 for the tree `[-3]`. What is wrong?',
        code: `best = 0
def gain(node):
    global best
    if node is None:
        return 0
    left, right = max(0, gain(node.left)), max(0, gain(node.right))
    best = max(best, node.val + left + right)
    return node.val + max(left, right)`,
        choices: ['`best` starts at 0, but a path must contain a node, so it should start at negative infinity', 'The clamp `max(0, ...)` is wrong and should be removed', 'It should return `node.val + left + right`', 'The base case should return -1'], answer: 0,
        explain: 'Every value may be negative, and a path needs at least one node, so the answer for `[-3]` is -3. Starting at 0 silently allows an empty path. The clamps on the sides are right: a bad branch can simply be left out.' },
      { kind: 'complexity', q: 'What is the time complexity of the pair-returning solution to House Robber III, and of the plain “rob it and recurse on the grandchildren, or skip it and recurse on the children” without a cache?',
        choices: ['O(n), and worse than polynomial in the worst case (the same subtrees are recomputed)', 'O(n) for both', 'O(n log n) and O(n²)', 'O(h) and O(n)'], answer: 0,
        explain: 'The pair version visits each node once. Without a cache, a node’s answer is computed once as a child and again as a grandchild at every level above it, so the number of calls grows exponentially with the depth for a balanced shape. A hash map by node fixes it (O(n)) but the pair needs no table.' },
      { kind: 'pattern', q: 'For the camera coverage problem, which state set per node supports a correct bottom-up solution?',
        choices: ['Has a camera / watched without a camera / not watched yet', 'Visited / unvisited', 'Left covered / right covered', 'Depth parity (even or odd)'], answer: 0,
        explain: 'A parent’s decision depends on exactly those three situations of each child: an unwatched child forces a camera on the parent, a child with a camera watches the parent, and a watched child with no camera leaves the parent unwatched. Visited flags and depth parity say nothing about coverage.' },
      { kind: 'concept', q: 'In the camera solution, a node whose two children are both “watched without a camera” reports “not watched yet”. What happens next?',
        choices: ['The parent will get a camera, which watches this node, unless it is the root, which then gets an extra camera', 'This node gets a camera immediately', 'The answer is wrong, because the node can never be watched', 'Both children get cameras'], answer: 0,
        explain: 'Deferring is the greedy move: a camera on the parent watches this node plus the parent’s own parent and other child, so it dominates a camera here. Only the root has no parent, which is why the final check adds one camera if the root ends up unwatched.' },
      { kind: 'complexity', q: 'You want the answer for **every** node taken as the root of the tree. Running the O(n) tree DP from each node costs O(n²). What brings it to O(n)?',
        choices: ['Rerooting: a downward pass for subtree answers and an upward pass that passes each child “everything except you”', 'Memoizing by node', 'Sorting the nodes first', 'Using BFS instead of DFS'], answer: 0,
        explain: 'Rerooting reuses the downward answers. Going from a parent to a child, the parent’s “rest of the tree” value is combined from the parent’s own up value and the child’s siblings’ down values, and each edge is handled O(1) times.' },
      { kind: 'pattern', q: 'Which of these are naturally solved by the “return a tuple from post-order” recipe? Pick every one that applies.',
        choices: ['The best sum of non-adjacent nodes in a tree', 'The longest path of equal-valued nodes in a tree', 'The fewest guards so every room of a tree-shaped museum is watched', 'Sorting the node values of a tree'], answer: [0, 1, 2],
        explain: 'Each of the first three has a per-node choice or per-node path state that the parent needs back (picked or not, down or through, guarded or covered). Sorting node values is just an inorder traversal on a BST, or a plain sort: no state to return.' },
      { kind: 'bug', q: 'This diameter code (in edges) returns 2 for the two-node tree `[1, 2]`, but the answer is 1. What is wrong?',
        code: `def diameter(root):
    best = 0
    def down(node):
        nonlocal best
        if node is None:
            return -1
        left, right = down(node.left), down(node.right)
        best = max(best, left + right + 2)
        return 1 + max(left, right) + 1
    down(root)
    return best`,
        choices: ['The return adds an extra +1: `1 + max(left, right)` is already one more than the deeper child', 'The base case should return 0', '`best` should be updated after the return', 'It should use `min` instead of `max`'], answer: 0,
        explain: 'A leaf’s `down` must be 0 (no edges below it), which needs the base case -1 and a return of `1 + max(left, right)`. The extra `+ 1` inflates every level, so the arch at the root is too long. The fix is to remove it.' }
    ],

    flashcards: [
      { id: 'tdp-recipe', front: 'The three-step recipe for DP on a tree?', back: 'State: the few situations a parent must tell apart. Transition: each state of a node from its children’s states. Order: post-order (children first), return the tuple.' },
      { id: 'tdp-rob-pair', front: 'House Robber III: what does a node return, and how is it built?', back: '`(rob, skip)`. `rob = val + skipL + skipR`. `skip = max(robL, skipL) + max(robR, skipR)`. Empty tree is `(0, 0)`. Answer is `max` of the root pair.' },
      { id: 'tdp-why-pair', front: 'Why return a pair rather than memoizing one number by node?', back: 'The parent needs a different number from the child depending on its own choice. Each subtree’s result is used by one parent only, so the pair needs no table: O(n) time, O(h) stack.' },
      { id: 'tdp-through-down', front: 'Max path sum: what is recorded and what is returned?', back: 'Record `val + left + right` (the arch, a finished path). Return `val + max(left, right)` (a single branch the parent can extend). Clamp each side with `max(0, ...)`.' },
      { id: 'tdp-best-init', front: 'Where should the best answer start in max path sum?', back: 'At negative infinity, not 0. A path has at least one node, so an all-negative tree answers with its largest value, e.g. `[-3]` gives -3.' },
      { id: 'tdp-diameter', front: 'Tree diameter as “through and down”?', back: 'Return the downward height; record `leftHeight + rightHeight` (edges) as the arch at each node. Same shape as max path sum with every value an edge.' },
      { id: 'tdp-cam-states', front: 'Binary tree cameras: the three states?', back: '0 = not watched, 1 = watched without a camera, 2 = has a camera. An empty spot is 1.' },
      { id: 'tdp-cam-rules', front: 'Binary tree cameras: how is a node’s state decided?', back: 'Any child is 0: put a camera here (return 2). Else any child is 2: return 1. Else return 0 and let the parent handle it. If the root ends at 0, add one camera.' },
      { id: 'tdp-cam-greedy', front: 'Why never put a camera on a leaf?', back: 'Moving it to the parent watches the leaf, the parent, the grandparent and the sibling: a superset. The greedy choice is the three-state DP with the dominated options removed.' },
      { id: 'tdp-zigzag', front: 'Longest zigzag: what pair does a node return?', back: '`(startLeft, startRight)` in steps. `startLeft = 1 + startRight(left child)`, `startRight = 1 + startLeft(right child)`, missing child returns -1. Keep a global best.' },
      { id: 'tdp-base', front: 'How do you choose the base case of a tree DP?', back: 'It is the identity of your transition: the empty tree’s tuple must contribute nothing: `(0, 0)` for sums, “covered” for cameras, -1 so a missing step adds zero.' },
      { id: 'tdp-reroot', front: 'Rerooting in one sentence?', back: 'One post-order pass for `down` (subtree answers), then one pre-order pass for `up` (everything outside the subtree, from the parent’s `up` and the siblings’ `down`): the answer for every node as root in O(n).' }
    ],

    deeper: [
      { title: 'Dynamic programming on trees (USACO Guide)', url: 'https://usaco.guide/gold/dp-trees', time: 'about 30 min', note: 'The standard competitive-programming tour of tree DP: subtree states, take-or-skip, and an introduction to rerooting.' },
      { title: 'Tree DP: Rerooting (Codeforces Edu blog)', url: 'https://codeforces.com/blog/entry/20935', time: 'about 25 min', note: 'A readable community walkthrough of the two-pass rerooting idea and the “all nodes as root” questions it answers.' },
      { title: 'NeetCode: Binary Tree Maximum Path Sum', url: 'https://neetcode.io/problems/binary-tree-maximum-path-sum', time: 'about 15 min', note: 'A video and code walkthrough of the through-versus-down split. Some pages may ask you to sign in.' },
      { title: 'Tree diameter (CP-Algorithms)', url: 'https://cp-algorithms.com/graph/tree_diameter.html', time: 'about 10 min', note: 'Diameter and its two classic proofs, including the “two farthest nodes” method and the DP method used here.' }
    ],

    detective: [
      { id: 'td-stalls', decoys: ['dp-1d', 'greedy', 'graphs'],
        statement: 'A night market is set up as a branching layout: the entrance stall has up to two stalls attached to it, each of those has up to two more, and so on. Each stall has a known evening profit. Stalls that are directly attached to each other share a power line, and if both are switched on the fuse blows for the whole market. The organizer will only switch on a set of stalls that never contains two directly attached ones, and wants the largest total profit among such sets.',
        why: 'A branching layout with a rule about directly linked neighbors and a maximum to find: each stall is either on or off, and what its parent may do depends on that choice. Each subtree must report its best total for both cases, and the parent combines those pairs bottom-up.' },
      { id: 'td-cable', decoys: ['kadane', 'trees', 'graphs'],
        statement: 'A telecom company has laid cable along a network of junctions that branches like a family tree, with a single trunk junction at the top. Each junction has a number: positive where it earns from customers, negative where it costs upkeep. An engineer will pick a chain of junctions that are linked one to the next, never visiting one twice, starting and ending wherever she likes, even at a single junction. The value of the chain is the sum of its junction numbers, and she wants the best possible value.',
        why: 'A best chain with arbitrary ends in a branching layout, with negative numbers allowed: every chain has a highest junction where it turns. At each junction one number is the best chain that bends there (it uses both sides and is final) and another is the best chain that continues upward (it can only use one side). Record the first, report the second to the parent.' },
      { id: 'td-guards', decoys: ['greedy', 'graphs', 'trees'],
        statement: 'A museum’s halls form a branching floor plan: the lobby opens into at most two halls, each of those into at most two more, and so on, with no loops. A guard posted in a hall can see that hall, the hall it came from, and the halls directly beyond it, but nothing further. The curator wants every hall watched by someone while posting as few guards as possible.',
        why: 'A branching plan with no cycles, a guard that affects only its immediate neighbors, and a minimum to find: working from the far ends toward the lobby, each hall ends up in one of a few situations (has a guard, watched by a neighbor’s guard, still unwatched), and the hall above decides what to do from those. Returning a small state per subtree is the tell.' }
    ]
  });
})();
