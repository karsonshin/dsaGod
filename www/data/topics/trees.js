/* Offer Ready: Trees. Schema: README.md, "Adding content".
   Tree problems use argTypes: ['tree'] (level-order arrays with null). The verify tool runs py and js; Java and C++ for tree
   arguments were compiled and run by hand (the tool can't build TreeNode inputs for them). Interview-style TreeNode is assumed:
   Python/JS `.val .left .right`, Java `TreeNode`, C++ `TreeNode*`. For LCA problems the runner passes node VALUES for p and q
   (it can't hand over node references), so the solutions compare `.val`; in an interview you would compare the nodes themselves. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'trees',

    hook: 'Trees are where recursion stops being an exercise and becomes a tool. A tree is a node with smaller trees hanging off it, so almost every tree question is *“solve it for the children, then combine”*. About a fifth of NeetCode 150 lives here, in the problems you will meet again and again: depth, same tree, level order, validate a BST, lowest common ancestor, serialize. Interviewers love them because the code is short and the **traversal order you choose** is the whole idea.',

    cues: [
      'The input is a **binary tree** (a `root` with `left` and `right`), or a hierarchy you can draw as one: an org chart, a file system, an expression.',
      'The answer for a node depends on the answers for its **children** (height, size, sum, “is it balanced”): recurse, then combine on the way back up.',
      'You must visit nodes **level by level**, or you need the **closest** node of some kind, or a **right-side view**: that is breadth-first, with a queue.',
      '“Binary **search** tree”: the sorted structure is a gift. Inorder gives sorted order, and each comparison throws away half the tree.',
      'The question gives you **two traversals** (preorder and inorder) and asks for the tree, or asks you to turn a tree into a string and back.',
      'Two nodes and a question about where they **meet**: lowest common ancestor.',
      'The trap: checking only a node against its **direct** children is not enough for a BST. Every node in the left subtree must be smaller, not just the child.'
    ],

    intuition: [
      'Picture a company org chart. To count everyone under the CEO, you do not walk the whole chart yourself. You ask each direct report “how many are under you?”, add their answers, add one for each report, and that is your answer. Every manager does the same thing for their own team. That is **recursion on a tree**: the same question, asked of a smaller tree, with the answers combined. The base case is the empty spot below a leaf, where the answer is “nothing”.',
      'There are only two ways to walk a tree:',
      '1. **Depth-first (DFS)**: go all the way down one branch before trying the next. Recursion does this for free, because the call stack remembers where you came from. The only choice is *when you record a node*: **preorder** (before its children: node, left, right), **inorder** (between them: left, node, right), or **postorder** (after both: left, right, node). Preorder suits “copy or serialize the tree” (a parent comes before its children). Postorder suits “compute from the children” (height, size, diameter). Inorder on a binary **search** tree yields the values sorted.\n2. **Breadth-first (BFS)**: visit level by level with a **queue**. Dequeue a node, record it, enqueue its children. To keep levels apart, read the queue’s length at the start of a round and process exactly that many nodes. The queue holds at most one level, so BFS is the tool for “by level”, “right side view” and “shortest path in an unweighted tree or graph”.',
      'A **binary search tree** adds one rule: for **every** node, everything in its left subtree is smaller and everything in its right subtree is larger. Not just the children: the whole subtree. That rule is what makes search O(height), and it is the rule people forget when they validate one. The cure is to pass down an allowed range `(low, high)`: going left tightens the upper bound to the current value, going right raises the lower bound.',
      'Two other ideas recur. **Lowest common ancestor**: do a postorder pass where each call reports whether it found a target below it; the first node where *both* sides report a find is where the paths meet. **Build from traversals**: preorder tells you the next *root*, inorder tells you how many nodes are on its left, so you can split recursively. Run the visualizer: switch between the four orders on the same tree and watch the call stack (DFS) or the queue (BFS) change.'
    ].join('\n\n'),

    viz: 'tree-traversal',

    template: {
      title: 'All four traversals: three depth-first orders in one walk, then breadth-first by level',
      note: 'The recursive `dfs` is **one walk** with three possible record lines, and the order you pick is just which line you read. **Preorder** records before recursing, **inorder** between the two recursive calls, **postorder** after both. The BFS loop below it uses a queue and a frozen level size. The test returns the three depth-first orders first, then one list per level, so the answer for `[1, 2, 3, null, 4]` is `[[1,2,4,3], [2,4,1,3], [4,2,3,1], [1], [2,3], [4]]`. The **visualizer above lights these exact lines**: pick an order and watch the call stack or the queue.',
      code: {
        py: `def orders(root):
    pre, ino, post, levels = [], [], [], []
    def dfs(node):
        if node is None:                        #@null > Base case: an empty spot ends this call at once
            return
        pre.append(node.val)                    #@pre > Preorder: record on the way down, before either child
        dfs(node.left)                          #@left > Recurse into the whole left subtree
        ino.append(node.val)                    #@in > Inorder: record between the two subtrees
        dfs(node.right)                         #@right > Recurse into the whole right subtree
        post.append(node.val)                   #@post > Postorder: record on the way back up, after both children
    dfs(root)
    queue = deque([root] if root else [])       #> BFS: a queue holds the nodes waiting to be visited
    while queue:
        row = []
        for _ in range(len(queue)):             #@level > Freeze the size: exactly this many nodes are on the current level
            node = queue.popleft()              #@deq > Take the node at the front
            row.append(node.val)                #@visit > Record it in this level's list
            if node.left: queue.append(node.left)     #@enq > Children join the back: they belong to the next level
            if node.right: queue.append(node.right)   #@enq
        levels.append(row)
    return [pre, ino, post] + levels`,
        js: `function orders(root) {
  const pre = [], ino = [], post = [], levels = [];
  function dfs(node) {
    if (node === null) return;                  //@null > Base case: an empty spot ends this call at once
    pre.push(node.val);                         //@pre > Preorder: record on the way down, before either child
    dfs(node.left);                             //@left > Recurse into the whole left subtree
    ino.push(node.val);                         //@in > Inorder: record between the two subtrees
    dfs(node.right);                            //@right > Recurse into the whole right subtree
    post.push(node.val);                        //@post > Postorder: record on the way back up, after both children
  }
  dfs(root);
  const queue = root ? [root] : [];             //> BFS: a queue holds the nodes waiting to be visited
  while (queue.length) {
    const row = [];
    for (let k = queue.length; k > 0; k--) {    //@level > Freeze the size: exactly this many nodes are on the current level
      const node = queue.shift();               //@deq > Take the node at the front
      row.push(node.val);                       //@visit > Record it in this level's list
      if (node.left) queue.push(node.left);     //@enq > Children join the back: they belong to the next level
      if (node.right) queue.push(node.right);   //@enq
    }
    levels.push(row);
  }
  return [pre, ino, post, ...levels];
}`,
        java: `class Solution {
    public List<List<Integer>> orders(TreeNode root) {
        List<Integer> pre = new ArrayList<>(), ino = new ArrayList<>(), post = new ArrayList<>();
        dfs(root, pre, ino, post);
        List<List<Integer>> out = new ArrayList<>(List.of(pre, ino, post));
        Deque<TreeNode> queue = new ArrayDeque<>();    //> BFS: a queue holds the nodes waiting to be visited
        if (root != null) queue.add(root);
        while (!queue.isEmpty()) {
            List<Integer> row = new ArrayList<>();
            for (int k = queue.size(); k > 0; k--) {   //@level > Freeze the size: exactly this many nodes are on the current level
                TreeNode node = queue.poll();          //@deq > Take the node at the front
                row.add(node.val);                     //@visit > Record it in this level's list
                if (node.left != null) queue.add(node.left);     //@enq > Children join the back: they belong to the next level
                if (node.right != null) queue.add(node.right);   //@enq
            }
            out.add(row);
        }
        return out;
    }

    private void dfs(TreeNode node, List<Integer> pre, List<Integer> ino, List<Integer> post) {
        if (node == null) return;                      //@null > Base case: an empty spot ends this call at once
        pre.add(node.val);                             //@pre > Preorder: record on the way down, before either child
        dfs(node.left, pre, ino, post);                //@left > Recurse into the whole left subtree
        ino.add(node.val);                             //@in > Inorder: record between the two subtrees
        dfs(node.right, pre, ino, post);               //@right > Recurse into the whole right subtree
        post.add(node.val);                            //@post > Postorder: record on the way back up, after both children
    }
}`,
        cpp: `class Solution {
    void dfs(TreeNode* node, vector<int>& pre, vector<int>& ino, vector<int>& post) {
        if (!node) return;                             //@null > Base case: an empty spot ends this call at once
        pre.push_back(node->val);                      //@pre > Preorder: record on the way down, before either child
        dfs(node->left, pre, ino, post);               //@left > Recurse into the whole left subtree
        ino.push_back(node->val);                      //@in > Inorder: record between the two subtrees
        dfs(node->right, pre, ino, post);              //@right > Recurse into the whole right subtree
        post.push_back(node->val);                     //@post > Postorder: record on the way back up, after both children
    }
public:
    vector<vector<int>> orders(TreeNode* root) {
        vector<int> pre, ino, post;
        dfs(root, pre, ino, post);
        vector<vector<int>> out = {pre, ino, post};
        queue<TreeNode*> q;                            //> BFS: a queue holds the nodes waiting to be visited
        if (root) q.push(root);
        while (!q.empty()) {
            vector<int> row;
            for (int k = q.size(); k > 0; k--) {       //@level > Freeze the size: exactly this many nodes are on the current level
                TreeNode* node = q.front(); q.pop();   //@deq > Take the node at the front
                row.push_back(node->val);              //@visit > Record it in this level's list
                if (node->left) q.push(node->left);    //@enq > Children join the back: they belong to the next level
                if (node->right) q.push(node->right);  //@enq
            }
            out.push_back(row);
        }
        return out;
    }
};`
      },
      tests: { fn: 'orders', argTypes: ['tree'], cases: [
        { args: [[1, 2, 3, null, 4]], out: [[1, 2, 4, 3], [2, 4, 1, 3], [4, 2, 3, 1], [1], [2, 3], [4]] },
        { args: [[]], out: [[], [], []] },
        { args: [[1]], out: [[1], [1], [1], [1]] },
        { args: [[3, 9, 20, null, null, 15, 7]], out: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7], [9, 15, 7, 20, 3], [3], [9, 20], [15, 7]] },
        { args: [[4, 2, 6, 1, 3, 5, 7]], out: [[4, 2, 1, 3, 6, 5, 7], [1, 2, 3, 4, 5, 6, 7], [1, 3, 2, 5, 7, 6, 4], [4], [2, 6], [1, 3, 5, 7]] },
        { args: [[1, null, 2, null, 3]], out: [[1, 2, 3], [1, 2, 3], [3, 2, 1], [1], [2], [3]] }] }
    },

    complexity: {
      time: 'O(n) for every traversal · BST search O(h) · BST validate O(n)',
      space: 'DFS O(h) stack · BFS O(w) queue · h = height, w = widest level',
      why: 'Every traversal touches each node a constant number of times, so time is O(n) whichever order you pick. The extra memory is the part that differs. A recursive DFS keeps one stack frame per **open** call, which is at most the tree’s **height** `h`: about log₂ n for a balanced tree, up to n for a chain. BFS keeps a queue that holds at most one level, so O(w) where `w` is the widest level, which can be about n/2 for a complete tree. A BST search or insert follows a single root-to-leaf path: O(h).',
      trap: 'Three things trip people up. (1) **“O(log n)” is only for a balanced tree.** An ordinary BST built from sorted input is a chain with height n, so search is O(n) and recursion goes n deep. (2) **Recursion depth is real.** Python’s default limit is about 1000 frames, so a 5000-node chain raises `RecursionError`; say you would switch to an explicit stack. (3) “Space O(1)” claims for a DFS ignore the call stack. Counting it, the answer is O(h). Morris traversal gets true O(1), by temporarily rewiring the tree.'
    },

    variations: [
      {
        name: 'Recursion that returns something: height, diameter, balanced',
        body: 'Most tree problems are the same shape: a **postorder** function that returns a fact about its subtree, while a variable outside records the answer. **Height** is `1 + max(left, right)`. **Diameter** (the longest path between any two nodes, which need not pass through the root) is, at each node, `left height + right height`; keep the best over all nodes, and return the height up. **Balanced** (every node’s two subtrees differ in height by at most 1) is the same walk, but return `-1` the moment a subtree is unbalanced, so the bad news propagates up and you never recompute heights. The trap is calling a separate `height()` at every node: that is O(n²) on a chain. Return the height **and** do the check in the same pass. The code below returns `[height, diameter]` in one pass, with the diameter counted in **edges**.',
        code: {
          py: `def tree_stats(root):
    best = 0
    def height(node):
        nonlocal best
        if node is None:
            return 0                              #> An empty tree has height 0
        left, right = height(node.left), height(node.right)
        best = max(best, left + right)            #> The longest path that bends at this node
        return 1 + max(left, right)               #> Hand the height up to the parent
    h = height(root)
    return [h, best]`,
          js: `function treeStats(root) {
  let best = 0;
  function height(node) {
    if (node === null) return 0;                  //> An empty tree has height 0
    const left = height(node.left), right = height(node.right);
    best = Math.max(best, left + right);          //> The longest path that bends at this node
    return 1 + Math.max(left, right);             //> Hand the height up to the parent
  }
  const h = height(root);
  return [h, best];
}`,
          java: `class Solution {
    private int best;

    public int[] treeStats(TreeNode root) {
        best = 0;
        int h = height(root);
        return new int[]{h, best};
    }

    private int height(TreeNode node) {
        if (node == null) return 0;                    //> An empty tree has height 0
        int left = height(node.left), right = height(node.right);
        best = Math.max(best, left + right);           //> The longest path that bends at this node
        return 1 + Math.max(left, right);              //> Hand the height up to the parent
    }
}`,
          cpp: `class Solution {
    int best;
    int height(TreeNode* node) {
        if (!node) return 0;                           //> An empty tree has height 0
        int left = height(node->left), right = height(node->right);
        best = max(best, left + right);                //> The longest path that bends at this node
        return 1 + max(left, right);                   //> Hand the height up to the parent
    }
public:
    vector<int> treeStats(TreeNode* root) {
        best = 0;
        int h = height(root);
        return {h, best};
    }
};`
        },
        tests: { fn: { py: 'tree_stats', default: 'treeStats' }, argTypes: ['tree'], cases: [
          { args: [[3, 9, 20, null, null, 15, 7]], out: [3, 3] }, { args: [[]], out: [0, 0] }, { args: [[1]], out: [1, 0] },
          { args: [[1, 2, 3, 4, 5]], out: [3, 3] }, { args: [[1, null, 2, null, 3]], out: [3, 2] }] }
      },
      {
        name: 'Iterative traversals with your own stack',
        body: 'Recursion is the call stack in disguise, so you can write the stack yourself. This matters when the tree is deep enough to overflow, when the interviewer says “no recursion”, and for BST iterators that must pause between values. **Inorder**: walk left as far as you can, pushing each node; pop one, record it, then move to its right child and repeat. **Preorder**: pop a node, record it, push its right child and then its left (so left pops first). **Postorder** is the awkward one: do a mirrored preorder (node, right, left) and reverse the result. The code below is the inorder version, which is also the engine behind “k-th smallest in a BST” and the BST iterator.',
        code: {
          py: `def inorder_iter(root):
    out, stack, node = [], [], root
    while stack or node:
        while node:
            stack.append(node)               #> Go left as far as possible, remembering the way back
            node = node.left
        node = stack.pop()                   #> The most recent unfinished node: its left side is done
        out.append(node.val)                 #> Inorder: record now
        node = node.right                    #> Then the whole right side
    return out`,
          js: `function inorderIter(root) {
  const out = [], stack = [];
  let node = root;
  while (stack.length || node) {
    while (node) {
      stack.push(node);                      //> Go left as far as possible, remembering the way back
      node = node.left;
    }
    node = stack.pop();                      //> The most recent unfinished node: its left side is done
    out.push(node.val);                      //> Inorder: record now
    node = node.right;                       //> Then the whole right side
  }
  return out;
}`,
          java: `class Solution {
    public List<Integer> inorderIter(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (!stack.isEmpty() || node != null) {
            while (node != null) {
                stack.push(node);                  //> Go left as far as possible, remembering the way back
                node = node.left;
            }
            node = stack.pop();                    //> The most recent unfinished node: its left side is done
            out.add(node.val);                     //> Inorder: record now
            node = node.right;                     //> Then the whole right side
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> inorderIter(TreeNode* root) {
        vector<int> out;
        stack<TreeNode*> st;
        TreeNode* node = root;
        while (!st.empty() || node) {
            while (node) {
                st.push(node);                     //> Go left as far as possible, remembering the way back
                node = node->left;
            }
            node = st.top(); st.pop();             //> The most recent unfinished node: its left side is done
            out.push_back(node->val);              //> Inorder: record now
            node = node->right;                    //> Then the whole right side
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'inorder_iter', default: 'inorderIter' }, argTypes: ['tree'], cases: [
          { args: [[1, null, 2, 3]], out: [1, 3, 2] }, { args: [[4, 2, 6, 1, 3, 5, 7]], out: [1, 2, 3, 4, 5, 6, 7] }, { args: [[]], out: [] },
          { args: [[1]], out: [1] }, { args: [[3, 9, 20, null, null, 15, 7]], out: [9, 3, 15, 20, 7] }] }
      },
      {
        name: 'Binary search trees: search, insert, delete, and what to remember',
        body: '**Search** follows one path: go left if the target is smaller, right if larger, stop on a match or on an empty spot. O(h), and an iterative loop needs no stack. **Insert** is the same walk, attaching the new node at the empty spot where the search ended. **Delete** has three cases: a leaf (just remove it), one child (the child takes its place), two children (replace its value with its **inorder successor**, the smallest value in the right subtree, then delete that node from the right subtree). Remember three facts: **inorder gives sorted order**, so “k-th smallest” is the k-th node of an inorder walk; the **minimum** is the leftmost node and the **maximum** the rightmost; and **a plain BST is only fast when it stays balanced**. Sorted input gives a chain, which is why production code uses self-balancing trees (AVL, red-black), and why Java’s `TreeMap` and C++’s `std::map` guarantee O(log n).',
        code: {
          py: `def bst_contains(root, target):
    node = root
    while node:
        if target == node.val:
            return True
        node = node.left if target < node.val else node.right   #> The BST rule throws away one whole side
    return False`,
          js: `function bstContains(root, target) {
  let node = root;
  while (node) {
    if (target === node.val) return true;
    node = target < node.val ? node.left : node.right;   //> The BST rule throws away one whole side
  }
  return false;
}`,
          java: `class Solution {
    public boolean bstContains(TreeNode root, int target) {
        TreeNode node = root;
        while (node != null) {
            if (target == node.val) return true;
            node = target < node.val ? node.left : node.right;   //> The BST rule throws away one whole side
        }
        return false;
    }
}`,
          cpp: `class Solution {
public:
    bool bstContains(TreeNode* root, int target) {
        TreeNode* node = root;
        while (node) {
            if (target == node->val) return true;
            node = target < node->val ? node->left : node->right;   //> The BST rule throws away one whole side
        }
        return false;
    }
};`
        },
        tests: { fn: { py: 'bst_contains', default: 'bstContains' }, argTypes: ['tree'], cases: [
          { args: [[4, 2, 6, 1, 3, 5, 7], 5], out: true }, { args: [[4, 2, 6, 1, 3, 5, 7], 8], out: false }, { args: [[], 1], out: false },
          { args: [[1], 1], out: true }, { args: [[4, 2, 6, 1, 3, 5, 7], 1], out: true }] }
      },
      {
        name: 'Build a tree from two traversals',
        body: 'A single traversal is ambiguous, but **preorder plus inorder** pins the tree down (if values are distinct). The first value of preorder is the **root**. Find that value in inorder: everything to its left is the left subtree, everything to its right is the right subtree, and the **size of the left part** tells you how many of the next preorder values belong to it. Recurse. Two details make it fast: a hash map from value to inorder index (so each lookup is O(1), giving O(n) overall instead of O(n²)), and a single running index into preorder, so you never slice arrays. The mirror version uses **postorder plus inorder**; there the *last* postorder value is the root, and you must build the **right** subtree first. Preorder alone cannot do it, but preorder with null markers can, and that is serialization (next).'
      },
      {
        name: 'Serialize and deserialize',
        body: 'Turn a tree into a string and back. The simplest correct scheme is **preorder with explicit null markers**: write `val` for a node and `#` for an empty spot, separated by commas, so `[1, 2, 3, null, null, 4, 5]` becomes `1,2,#,#,3,4,#,#,5,#,#`. Because the markers record where every branch ends, the string has exactly one tree: rebuild by reading tokens with a shared iterator, where a `#` returns null and a value makes a node and recurses left, then right. **Level-order with nulls** (LeetCode’s own display format) works too and uses a queue. Both are O(n). Watch two pitfalls: negative numbers and multi-digit values need a delimiter, and the iterator must be **shared** across recursive calls, not re-created. The same idea encodes any N-ary tree, and checking “is this a subtree” can be done by serializing both and searching for a substring, if you wrap each value in delimiters.'
      },
      {
        name: 'Lowest common ancestor, and why a BST makes it easy',
        body: 'In a general binary tree, do a **postorder** pass. A call returns its own node if it *is* one of the targets, otherwise whatever its children found. If **both** the left and right calls return something, the targets sit on different sides, so the current node is the lowest common ancestor. If only one side returns something, pass it up. If a target is an ancestor of the other, it gets returned before the recursion even reaches the second one, which is correct. That is O(n) time and O(h) space. In a **BST** you can skip the search: from the root, if both targets are smaller go left, if both are larger go right, otherwise this node **splits** them and is the answer. That is O(h) with a plain loop. For many queries on the same tree, precompute depths and use binary lifting, or an Euler tour with a range-minimum structure.'
      }
    ],

    worked: [
      {
        lc: 104,
        restate: 'Given the root of a binary tree, return its **maximum depth**: the number of nodes on the longest path from the root down to a leaf. An empty tree has depth 0.',
        examples: '- `[3, 9, 20, null, null, 15, 7]` → 3 (the path 3, 20, 15).\n- `[1, null, 2]` → 2.\n- Edge cases: an empty tree (0); a single node (1); a chain where every node has one child (the depth is n).',
        brute: 'There is no slower approach to speak of, which is the point of the problem. A first attempt might collect every root-to-leaf path and take the longest. That works, in O(n) time, but stores paths you never need.',
        insight: 'The depth of a tree is **one more than the deeper of its two subtrees**. An empty tree has depth 0. That sentence *is* the algorithm: a tree is a root plus two smaller trees, so ask each child for its depth, take the larger, add one for the current node. This is the pattern for every “compute from the children” question.',
        code: {
          py: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if root is None:
            return 0                                    # base case: an empty tree has depth 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
          js: `function maxDepth(root) {
  if (root === null) return 0;                          // base case: an empty tree has depth 0
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
          java: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;                     // base case: an empty tree has depth 0
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
          cpp: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;                            // base case: an empty tree has depth 0
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};`
        },
        complexity: 'O(n) time: each node is visited once. O(h) space for the recursion stack, where h is the height: O(log n) for a balanced tree, O(n) for a chain.',
        say: '“The depth of a tree is one plus the larger depth of its two subtrees, and an empty tree has depth zero. So I recurse on both children, take the max, and add one. Every node is visited once, so it is O(n) time, and the recursion goes as deep as the tree is tall, so O(h) space. If the tree could be very deep I would switch to a level-order BFS and count the levels, which avoids the call stack.”',
        followups: [
          { q: 'How would you do it without recursion?', a: 'BFS with a queue: process the tree one level at a time and count the levels. Or DFS with an explicit stack of `(node, depth)` pairs, keeping the largest depth seen. Both are O(n) time; BFS uses O(width) space.' },
          { q: 'What is the minimum depth, and why is it not just `1 + min(left, right)`?', a: 'A node with only one child is not a leaf, so the path must continue through that child. If one side is empty, `min` would wrongly give 0 for it. Handle it: if a child is missing, use the other child’s depth.' },
          { q: 'What changes if the tree is huge and skewed?', a: 'Recursion could overflow the stack at around a thousand frames in Python. Use the iterative BFS or an explicit stack.' }
        ]
      },
      {
        lc: 102,
        restate: 'Given the root of a binary tree, return its values **level by level**, from left to right within each level, as a list of lists. The root is level one.',
        examples: '- `[3, 9, 20, null, null, 15, 7]` → `[[3], [9, 20], [15, 7]]`.\n- `[1]` → `[[1]]`; empty tree → `[]`.\n- Edge cases: a chain (one value per list); a node with only a right child.',
        brute: 'Run a depth-first search that records each node’s depth, put values in buckets by depth, then read the buckets in order. That is O(n) too and works fine, but it is the wrong tool: breadth-first visits nodes in level order already.',
        insight: 'A **queue** gives breadth-first order: nodes leave from the front and their children join the back, so all of level k leaves before any of level k + 1. To split levels, **freeze the queue’s size at the start of each round**: at that moment the queue holds exactly one whole level, so process that many nodes, and everything they enqueue belongs to the next round.',
        code: {
          py: `class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        levels = []
        queue = deque([root] if root else [])
        while queue:
            row = []
            for _ in range(len(queue)):        # the size now is exactly one level
                node = queue.popleft()
                row.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            levels.append(row)
        return levels`,
          js: `function levelOrder(root) {
  const levels = [], queue = root ? [root] : [];
  while (queue.length) {
    const row = [];
    for (let k = queue.length; k > 0; k--) {   // the size now is exactly one level
      const node = queue.shift();
      row.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(row);
  }
  return levels;
}`,
          java: `class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        Deque<TreeNode> queue = new ArrayDeque<>();
        if (root != null) queue.add(root);
        while (!queue.isEmpty()) {
            List<Integer> row = new ArrayList<>();
            for (int k = queue.size(); k > 0; k--) {   // the size now is exactly one level
                TreeNode node = queue.poll();
                row.add(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            levels.add(row);
        }
        return levels;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> levels;
        queue<TreeNode*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            vector<int> row;
            for (int k = q.size(); k > 0; k--) {       // the size now is exactly one level
                TreeNode* node = q.front(); q.pop();
                row.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            levels.push_back(row);
        }
        return levels;
    }
};`
        },
        complexity: 'O(n) time: each node is enqueued and dequeued once. O(w) space for the queue, where w is the widest level (up to about n / 2 for a complete tree). The output itself is O(n).',
        say: '“Level order is breadth-first, so I use a queue. At the start of each round I read the queue’s length, which is exactly the number of nodes on this level, and process that many: record each value and enqueue its children. Whatever is enqueued during the round belongs to the next one. It’s O(n) time and O(width) space. In Python I use `deque` so popping from the front is O(1), because `list.pop(0)` would make it quadratic.”',
        followups: [
          { q: 'How would you return the levels bottom-up, or zigzag?', a: 'Bottom-up: build the same list and reverse it at the end. Zigzag: reverse every other row as you finish it (or `appendleft` into a deque on alternate rows). The traversal is unchanged.' },
          { q: 'How would you get only the right-side view?', a: 'Keep the last node of each level: when the loop index is the final one in the round, record it. That is one extra `if`.' },
          { q: 'Can you do it with DFS?', a: 'Yes: pass the depth down, and append to `levels[depth]`, creating a new row when `depth == len(levels)`. It uses stack space instead of a queue, and visits left before right so the order within a row is still correct.' },
          { q: 'Why `deque` and not a list in Python?', a: '`list.pop(0)` shifts every remaining element: O(n) per pop, so O(n²) overall. `deque.popleft()` is O(1).' }
        ]
      },
      {
        lc: 98,
        restate: 'Given the root of a binary tree, decide whether it is a **valid binary search tree**: for every node, all values in its left subtree are **strictly smaller** and all values in its right subtree are **strictly larger**. Duplicates make it invalid.',
        examples: '- `[2, 1, 3]` → true.\n- `[5, 1, 4, null, null, 3, 6]` → false (the 3 sits in 5’s *right* subtree but is smaller than 5, even though it is fine next to its parent 4).\n- Edge cases: empty tree (valid); one node; duplicates `[2, 2, 2]` (invalid); a node holding the maximum 32-bit value.',
        brute: 'For every node, scan its whole left subtree for a value that is too big and its right subtree for one that is too small. That is correct but O(n²) on a chain. The popular wrong answer is to compare each node only with its two children, which is O(n) but fails whenever a violation is deeper than one level.',
        insight: 'Each node must lie in an **allowed range** inherited from its ancestors. The root may be anything: `(−∞, +∞)`. Going **left** from a node with value `v`, everything below must be **less than v**, so the upper bound becomes `v`. Going **right**, the lower bound becomes `v`. Check each node against its range and recurse with the tightened range. Alternatively, an **inorder** walk of a valid BST is strictly increasing, so check each value against the previous one.',
        code: {
          py: `class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        def ok(node, low, high):
            if node is None:
                return True                              # an empty spot breaks no rule
            if not (low < node.val < high):
                return False                             # outside the range its ancestors allow
            return ok(node.left, low, node.val) and ok(node.right, node.val, high)
        return ok(root, float('-inf'), float('inf'))`,
          js: `function isValidBST(root) {
  function ok(node, low, high) {
    if (node === null) return true;                      // an empty spot breaks no rule
    if (!(low < node.val && node.val < high)) return false;   // outside the range its ancestors allow
    return ok(node.left, low, node.val) && ok(node.right, node.val, high);
  }
  return ok(root, -Infinity, Infinity);
}`,
          java: `class Solution {
    public boolean isValidBST(TreeNode root) {
        return ok(root, Long.MIN_VALUE, Long.MAX_VALUE);       // long bounds, because a node may hold Integer.MIN_VALUE
    }

    private boolean ok(TreeNode node, long low, long high) {
        if (node == null) return true;                         // an empty spot breaks no rule
        if (node.val <= low || node.val >= high) return false; // outside the range its ancestors allow
        return ok(node.left, low, node.val) && ok(node.right, node.val, high);
    }
}`,
          cpp: `class Solution {
    bool ok(TreeNode* node, long long low, long long high) {
        if (!node) return true;                          // an empty spot breaks no rule
        if (node->val <= low || node->val >= high) return false;   // outside the range its ancestors allow
        return ok(node->left, low, node->val) && ok(node->right, node->val, high);
    }
public:
    bool isValidBST(TreeNode* root) {
        return ok(root, LLONG_MIN, LLONG_MAX);           // long long bounds, because a node may hold INT_MIN
    }
};`
        },
        complexity: 'O(n) time: each node is checked once against two numbers. O(h) space for the recursion stack.',
        say: '“Comparing a node with just its children is not enough, because the rule applies to the whole subtree. So I pass an allowed range down: the root can be anything, going left caps the upper bound at the current value, going right raises the lower bound. Each node must be strictly inside its range. That’s one pass, O(n) time and O(h) space. In Java and C++ I use long bounds so a node holding the integer minimum or maximum doesn’t collide with the sentinels. An inorder walk checking strictly increasing values is an equivalent alternative.”',
        followups: [
          { q: 'How would the inorder version work?', a: 'Walk inorder, keeping the previous value. The sequence must be strictly increasing, so return false the first time `node.val <= prev`. It needs a stateful walk (a nonlocal in Python or an iterative stack), but it is a good second answer.' },
          { q: 'What if duplicates were allowed on the left?', a: 'Then the left bound becomes inclusive: `low <= val`, or the right side is `val <= high` depending on the convention. Ask which side duplicates go on, then change one comparison from strict to non-strict.' },
          { q: 'Why not use `Integer.MIN_VALUE` as the starting bound?', a: 'A valid tree may contain that exact value, which a strict check against the sentinel would reject. Use `Long` bounds, or pass nullable bounds (`null` meaning unbounded).' },
          { q: 'Can the check use O(1) extra space?', a: 'Morris inorder traversal threads the tree temporarily and checks the increasing order with no stack, at the cost of mutating the tree and then restoring it. Rarely asked; know that it exists.' }
        ]
      },
      {
        lc: 236,
        restate: 'Given a binary tree (no ordering) and two nodes that are both in it, return their **lowest common ancestor**: the deepest node that has both of them in its subtree. A node counts as part of its own subtree, so a node can be the ancestor of the other. (Here the two nodes are given by their values, which are unique.)',
        examples: '- Tree `[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]`: nodes 5 and 1 → 3.\n- Nodes 5 and 4 → 5 (4 is below 5, and a node counts as its own ancestor).\n- Nodes 7 and 4 → 2.\n- Edge cases: the two nodes are the same depth on opposite sides of the root; one is the root.',
        brute: 'Find the path from the root to each node (a list of ancestors), then compare the two paths and take the last shared node. That is O(n) time and O(n) space and it is a perfectly good answer: two searches and a compare. The single-pass version below drops the path storage.',
        insight: 'Ask each subtree one question: **“do you contain either target?”** A call returns its own node when it *is* a target, and otherwise returns whatever its children found (or nothing). Now at any node: if the **left call and the right call both return something**, one target sits on each side, so this node is where their paths meet. If only one side returned something, pass it up. If a node is itself a target, return it immediately: if the other target is below it, it is the answer, and if not, the other side will say so higher up.',
        code: {
          py: `class Solution:
    def lowestCommonAncestor(self, root: Optional[TreeNode], p: int, q: int) -> int:
        # p and q are values here (the runner can't pass node references); compare nodes instead in an interview
        def find(node):
            if node is None or node.val == p or node.val == q:
                return node                               # nothing here, or we hit a target: report it
            left, right = find(node.left), find(node.right)
            if left and right:
                return node                               # one target on each side: this is where they meet
            return left or right                          # pass up whichever side found something
        return find(root).val`,
          js: `function lowestCommonAncestor(root, p, q) {
  // p and q are values here (the runner can't pass node references); compare nodes instead in an interview
  function find(node) {
    if (node === null || node.val === p || node.val === q) return node;   // nothing here, or we hit a target: report it
    const left = find(node.left), right = find(node.right);
    if (left && right) return node;                       // one target on each side: this is where they meet
    return left || right;                                 // pass up whichever side found something
  }
  return find(root).val;
}`,
          java: `class Solution {
    // p and q are values here (the runner can't pass node references); compare nodes instead in an interview
    public int lowestCommonAncestor(TreeNode root, int p, int q) {
        return find(root, p, q).val;
    }

    private TreeNode find(TreeNode node, int p, int q) {
        if (node == null || node.val == p || node.val == q) return node;   // nothing here, or we hit a target: report it
        TreeNode left = find(node.left, p, q), right = find(node.right, p, q);
        if (left != null && right != null) return node;   // one target on each side: this is where they meet
        return left != null ? left : right;               // pass up whichever side found something
    }
}`,
          cpp: `class Solution {
    // p and q are values here (the runner can't pass node references); compare nodes instead in an interview
    TreeNode* find(TreeNode* node, int p, int q) {
        if (!node || node->val == p || node->val == q) return node;   // nothing here, or we hit a target: report it
        TreeNode* left = find(node->left, p, q);
        TreeNode* right = find(node->right, p, q);
        if (left && right) return node;                   // one target on each side: this is where they meet
        return left ? left : right;                       // pass up whichever side found something
    }
public:
    int lowestCommonAncestor(TreeNode* root, int p, int q) {
        return find(root, p, q)->val;
    }
};`
        },
        complexity: 'O(n) time: every node is visited at most once. O(h) space for the recursion stack.',
        say: '“I do one postorder pass where each call answers: do you contain either target? A call returns its own node if it is a target, otherwise whatever its children returned. If both children return something, the two targets are on different sides, so this node is where their paths meet and I return it. If only one side returns something, I pass it up. Finding a target early and returning it also handles the case where one target is the ancestor of the other. It’s O(n) time and O(h) space. If the tree were a BST, I would drop the search and walk down: both smaller, go left; both larger, go right; otherwise this is the split.”',
        followups: [
          { q: 'What if one of the nodes might not be in the tree?', a: 'The shortcut “return when you hit a target” becomes wrong, because finding only one target would be reported as an answer. Do a full pass that counts how many targets were found, and return the meeting node only when the count is 2.' },
          { q: 'What if each node had a parent pointer?', a: 'Treat it as two linked lists that merge: walk up from one node, putting ancestors in a set, then walk up from the other until you hit one. Or advance two pointers, switching to the other start when one reaches the end, exactly as in finding the intersection of two lists. O(h) time.' },
          { q: 'How would you answer many LCA queries on the same tree?', a: 'Preprocess: store each node’s depth and a table of 2^j-th ancestors (binary lifting), then each query is O(log n). An Euler tour plus a range-minimum query gives O(1) per query after O(n log n) setup.' },
          { q: 'Is the BST version different?', a: 'Yes, and simpler: walk down from the root. If both targets are less than the current value, go left; if both are greater, go right; otherwise the current node splits them, so return it. O(h) time and O(1) space, no recursion.' }
        ]
      }
    ],

    practice: [
      { lc: 226,
        hints: ['Look at the smallest case: a node with two children. Inverting it swaps those two children.', 'Every subtree must be inverted too, so after the swap, invert the left side and the right side recursively.', 'Base case: an empty spot returns nothing. Swap, recurse both ways, return the root.'],
        solution: { explain: 'Preorder or postorder, it does not matter: swap the two children at every node and recurse into both. O(n) time, O(h) space.', code: {
          py: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root is None:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root`,
          js: `function invertTree(root) {
  if (root === null) return null;
  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  return root;
}` } },
        starter: { py: 'class Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        ', js: 'function invertTree(root) {\n  \n}' },
        tests: { fn: 'invertTree', argTypes: ['tree'], cases: [
          { args: [[4, 2, 7, 1, 3, 6, 9]], out: [4, 7, 2, 9, 6, 3, 1] }, { args: [[2, 1, 3]], out: [2, 3, 1] }, { args: [[]], out: null }, { args: [[1]], out: [1] },
          { args: [[1, 2]], out: [1, null, 2] }, { args: [[1, 2, 3, 4]], out: [1, 3, 2, null, null, null, 4] }] } },

      { lc: 104,
        hints: ['The depth of a tree is built from the depths of its two subtrees.', 'An empty tree has depth 0. Otherwise the depth is one more than the larger of the two children’s depths.', 'That is a two-line recursive function.'],
        starter: { py: 'class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function maxDepth(root) {\n  \n}' },
        tests: { fn: 'maxDepth', argTypes: ['tree'], cases: [
          { args: [[3, 9, 20, null, null, 15, 7]], out: 3 }, { args: [[1, null, 2]], out: 2 }, { args: [[]], out: 0 }, { args: [[1]], out: 1 }, { args: [[1, 2, 3, 4, null, null, 5]], out: 3 },
          { args: [[1, null, 2, null, 3, null, 4]], out: 4 }] } },

      { lc: 543,
        hints: ['The longest path bends at some node, and at that node its length is (height of left) + (height of right).', 'You already know how to get heights with a postorder recursion. Can the same function also record the best bend it sees?', 'Return the height upward, but update a variable outside the function with `left + right` at every node. The answer is that variable.'],
        solution: { explain: 'A postorder height function. At each node the longest path through it, in edges, is `left height + right height`, so keep the maximum of that over all nodes while returning the usual height. One pass: O(n) time, O(h) space.', code: {
          py: `class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        best = 0
        def height(node):
            nonlocal best
            if node is None:
                return 0
            left, right = height(node.left), height(node.right)
            best = max(best, left + right)       # longest path bending here, counted in edges
            return 1 + max(left, right)
        height(root)
        return best`,
          js: `function diameterOfBinaryTree(root) {
  let best = 0;
  function height(node) {
    if (node === null) return 0;
    const left = height(node.left), right = height(node.right);
    best = Math.max(best, left + right);         // longest path bending here, counted in edges
    return 1 + Math.max(left, right);
  }
  height(root);
  return best;
}` } },
        starter: { py: 'class Solution:\n    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function diameterOfBinaryTree(root) {\n  \n}' },
        tests: { fn: 'diameterOfBinaryTree', argTypes: ['tree'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: 3 }, { args: [[1, 2]], out: 1 }, { args: [[1]], out: 0 }, { args: [[]], out: 0 },
          { args: [[1, 2, 3, 4, null, null, 5, 6, null, null, 7]], out: 6 }, { args: [[1, null, 2, null, 3, null, 4]], out: 3 }] } },

      { lc: 110,
        hints: ['“Balanced” has to hold at every node, not just the root.', 'Calling a height function at every node works but costs O(n²) on a chain. Can one pass do both jobs?', 'Return the height, but return -1 as soon as a subtree is unbalanced, and pass -1 straight up without computing anything else.'],
        solution: { explain: 'A postorder height that doubles as the check: a subtree that is unbalanced returns `-1`, and every caller passes that up at once. A node is unbalanced when its children’s heights differ by more than one. One pass: O(n) time, O(h) space.', code: {
          py: `class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        def height(node):
            if node is None:
                return 0
            left = height(node.left)
            if left < 0:
                return -1                        # already unbalanced below: stop early
            right = height(node.right)
            if right < 0 or abs(left - right) > 1:
                return -1
            return 1 + max(left, right)
        return height(root) >= 0`,
          js: `function isBalanced(root) {
  function height(node) {
    if (node === null) return 0;
    const left = height(node.left);
    if (left < 0) return -1;                     // already unbalanced below: stop early
    const right = height(node.right);
    if (right < 0 || Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  }
  return height(root) >= 0;
}` } },
        starter: { py: 'class Solution:\n    def isBalanced(self, root: Optional[TreeNode]) -> bool:\n        ', js: 'function isBalanced(root) {\n  \n}' },
        tests: { fn: 'isBalanced', argTypes: ['tree'], cases: [
          { args: [[3, 9, 20, null, null, 15, 7]], out: true }, { args: [[1, 2, 2, 3, 3, null, null, 4, 4]], out: false }, { args: [[]], out: true },
          { args: [[1, 2, null, 3]], out: false }, { args: [[1, 2, 3, 4, 5, 6]], out: true }, { args: [[1, null, 2]], out: true }] } },

      { lc: 100,
        hints: ['Two trees are the same when their roots match and their left subtrees are the same and their right subtrees are the same.', 'Walk both trees at once, with one function that takes a node from each.', 'If both are empty, they match. If only one is empty, or the values differ, they do not. Otherwise recurse on both pairs.'],
        solution: { explain: 'Recurse on the two trees in parallel. Both empty is a match; exactly one empty, or different values, is a mismatch; otherwise both subtree pairs must match. O(n) time (stops at the first difference), O(h) space.', code: {
          py: `class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        if p is None or q is None:
            return p is q                        # both empty is a match; one empty is not
        return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)`,
          js: `function isSameTree(p, q) {
  if (p === null || q === null) return p === q;  // both empty is a match; one empty is not
  return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}` } },
        starter: { py: 'class Solution:\n    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:\n        ', js: 'function isSameTree(p, q) {\n  \n}' },
        tests: { fn: 'isSameTree', argTypes: ['tree', 'tree'], cases: [
          { args: [[1, 2, 3], [1, 2, 3]], out: true }, { args: [[1, 2], [1, null, 2]], out: false }, { args: [[], []], out: true }, { args: [[1], []], out: false },
          { args: [[1, 2, 1], [1, 1, 2]], out: false }, { args: [[5, 3, 8], [5, 3, 8]], out: true }] } },

      { lc: 572,
        hints: ['Try every node of the big tree as a possible starting point for the smaller one.', 'You already have a function that says whether two trees are identical. Reuse it.', 'Return true if the trees match at this node, or if the smaller tree is a subtree of the left child or of the right child.'],
        solution: { explain: 'For every node of the big tree, run the same-tree check against the small tree. The check is O(m) and runs for up to n nodes, so O(n · m) time worst case, O(h) space. (Serializing both trees and searching for a substring, or hashing subtrees, gets O(n + m).)', code: {
          py: `class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def same(a, b):
            if a is None or b is None:
                return a is b
            return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)
        if root is None:
            return subRoot is None               # the empty tree is a subtree of anything
        return same(root, subRoot) or self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)`,
          js: `function isSubtree(root, subRoot) {
  function same(a, b) {
    if (a === null || b === null) return a === b;
    return a.val === b.val && same(a.left, b.left) && same(a.right, b.right);
  }
  if (root === null) return subRoot === null;    // the empty tree is a subtree of anything
  return same(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}` } },
        starter: { py: 'class Solution:\n    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:\n        ', js: 'function isSubtree(root, subRoot) {\n  \n}' },
        tests: { fn: 'isSubtree', argTypes: ['tree', 'tree'], cases: [
          { args: [[3, 4, 5, 1, 2], [4, 1, 2]], out: true }, { args: [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], out: false }, { args: [[1, 1], [1]], out: true },
          { args: [[1], [2]], out: false }, { args: [[1, 2, 3], [3]], out: true }, { args: [[1, 2, 3], [2, 4]], out: false }] } },

      { lc: 235,
        hints: ['Use the BST rule: it tells you which side each value lies on, so you never need to search.', 'Start at the root. If both targets are smaller than the current value, the answer is in the left subtree. If both are larger, it is in the right.', 'Otherwise the targets are on different sides (or one equals the node): the current node is the answer. A plain loop does it.'],
        solution: { explain: 'Walk down from the root. If both targets are smaller, go left; if both are larger, go right; otherwise this node splits them (or is one of them), so it is the answer. O(h) time, O(1) space. (The runner passes values for p and q.)', code: {
          py: `class Solution:
    def lowestCommonAncestor(self, root: Optional[TreeNode], p: int, q: int) -> int:
        node = root
        while True:
            if p < node.val and q < node.val:
                node = node.left                 # both targets are in the left subtree
            elif p > node.val and q > node.val:
                node = node.right                # both targets are in the right subtree
            else:
                return node.val                  # they split here, or this node is one of them`,
          js: `function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (true) {
    if (p < node.val && q < node.val) node = node.left;         // both targets are in the left subtree
    else if (p > node.val && q > node.val) node = node.right;   // both targets are in the right subtree
    else return node.val;                                       // they split here, or this node is one of them
  }
}` } },
        starter: { py: 'class Solution:\n    # p and q are VALUES here (the runner cannot pass node references); return the value of the LCA\n    def lowestCommonAncestor(self, root: Optional[TreeNode], p: int, q: int) -> int:\n        ', js: '// p and q are VALUES here (the runner cannot pass node references); return the value of the LCA\nfunction lowestCommonAncestor(root, p, q) {\n  \n}' },
        tests: { fn: 'lowestCommonAncestor', argTypes: ['tree'], cases: [
          { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], out: 6 }, { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], out: 2 },
          { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 5], out: 4 }, { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 0, 5], out: 2 },
          { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 7, 9], out: 8 }, { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 6, 9], out: 6 }] } },

      { lc: 102,
        hints: ['Level by level means closest to the root first: that is breadth-first, so a queue.', 'Dequeue a node, record its value, and enqueue its children.', 'To separate levels, read the queue length at the start of each round and process exactly that many nodes before starting the next list.'],
        starter: { py: 'class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        ', js: 'function levelOrder(root) {\n  \n}' },
        tests: { fn: 'levelOrder', argTypes: ['tree'], cases: [
          { args: [[3, 9, 20, null, null, 15, 7]], out: [[3], [9, 20], [15, 7]] }, { args: [[1]], out: [[1]] }, { args: [[]], out: [] },
          { args: [[1, 2, 3, 4, null, null, 5]], out: [[1], [2, 3], [4, 5]] }, { args: [[1, 2, null, 3, null, 4]], out: [[1], [2], [3], [4]] }] } },

      { lc: 199,
        hints: ['Standing on the right, what do you see at each depth? Exactly one node per level.', 'It is the last node of each level in a level-order traversal.', 'Run level-order BFS, and from each round keep only the final node processed (or the final value in the row).'],
        solution: { explain: 'Level-order BFS; at the end of each level keep its last node. O(n) time, O(w) space. (A DFS that visits the right child first and records the first node seen at each new depth is the O(h)-space alternative.)', code: {
          py: `class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        view = []
        queue = deque([root] if root else [])
        while queue:
            for _ in range(len(queue)):
                node = queue.popleft()
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            view.append(node.val)                # the last node processed this round is the rightmost
        return view`,
          js: `function rightSideView(root) {
  const view = [], queue = root ? [root] : [];
  while (queue.length) {
    let node;
    for (let k = queue.length; k > 0; k--) {
      node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    view.push(node.val);                         // the last node processed this round is the rightmost
  }
  return view;
}` } },
        starter: { py: 'class Solution:\n    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:\n        ', js: 'function rightSideView(root) {\n  \n}' },
        tests: { fn: 'rightSideView', argTypes: ['tree'], cases: [
          { args: [[1, 2, 3, null, 5, null, 4]], out: [1, 3, 4] }, { args: [[1, null, 3]], out: [1, 3] }, { args: [[]], out: [] }, { args: [[1, 2]], out: [1, 2] }, { args: [[1, 2, 3, 4]], out: [1, 3, 4] }] } },

      { lc: 1448,
        hints: ['A node is “good” when nothing on the path from the root to it is bigger. So each node needs to know the largest value above it.', 'Pass that maximum down as a parameter as you recurse.', 'At each node: count it if its value is at least the running max, then recurse into both children with the updated max.'],
        solution: { explain: 'Preorder DFS carrying the largest value on the path so far. A node is good when its value is at least that. Add the counts from both sides. O(n) time, O(h) space.', code: {
          py: `class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        def dfs(node, top):
            if node is None:
                return 0
            good = 1 if node.val >= top else 0   # nothing bigger on the path above
            top = max(top, node.val)
            return good + dfs(node.left, top) + dfs(node.right, top)
        return dfs(root, float('-inf'))`,
          js: `function goodNodes(root) {
  function dfs(node, top) {
    if (node === null) return 0;
    const good = node.val >= top ? 1 : 0;        // nothing bigger on the path above
    top = Math.max(top, node.val);
    return good + dfs(node.left, top) + dfs(node.right, top);
  }
  return dfs(root, -Infinity);
}` } },
        starter: { py: 'class Solution:\n    def goodNodes(self, root: TreeNode) -> int:\n        ', js: 'function goodNodes(root) {\n  \n}' },
        tests: { fn: 'goodNodes', argTypes: ['tree'], cases: [
          { args: [[3, 1, 4, 3, null, 1, 5]], out: 4 }, { args: [[3, 3, null, 4, 2]], out: 3 }, { args: [[1]], out: 1 }, { args: [[5, 4, 6, 3, 5]], out: 3 },
          { args: [[9, 8, null, 7, null, 6]], out: 1 }, { args: [[-1, -2, -3]], out: 1 }] } },

      { lc: 98,
        hints: ['Comparing each node only with its two children is not enough: a value deep in the left subtree can still be bigger than the root.', 'Give every node a range it must stay inside, inherited from all its ancestors.', 'Going left, the upper bound becomes the current value. Going right, the lower bound does. Check `low < val < high` at each node.'],
        starter: { py: 'class Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        ', js: 'function isValidBST(root) {\n  \n}' },
        tests: { fn: 'isValidBST', argTypes: ['tree'], cases: [
          { args: [[2, 1, 3]], out: true }, { args: [[5, 1, 4, null, null, 3, 6]], out: false }, { args: [[5, 4, 6, null, null, 3, 7]], out: false }, { args: [[1]], out: true }, { args: [[]], out: true },
          { args: [[2, 2, 2]], out: false }, { args: [[10, 5, 15, null, null, 6, 20]], out: false }, { args: [[3, 1, 5, 0, 2, 4, 6]], out: true }, { args: [[2147483647]], out: true }] } },

      { lc: 230,
        hints: ['Which traversal of a BST gives the values in sorted order?', 'Inorder. So the k-th smallest is the k-th node you record in an inorder walk.', 'You can stop early: do an iterative inorder with a stack, count as you pop, and return when the count reaches k.'],
        solution: { explain: 'Iterative inorder with an explicit stack: push the left spine, pop a node, count it, then go right. Stop at the k-th pop. O(h + k) time, O(h) space, without visiting the whole tree.', code: {
          py: `class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        stack, node = [], root
        while stack or node:
            while node:
                stack.append(node)               # go left as far as possible
                node = node.left
            node = stack.pop()
            k -= 1
            if k == 0:
                return node.val                  # the k-th node in sorted order
            node = node.right`,
          js: `function kthSmallest(root, k) {
  const stack = [];
  let node = root;
  while (stack.length || node) {
    while (node) { stack.push(node); node = node.left; }   // go left as far as possible
    node = stack.pop();
    if (--k === 0) return node.val;                         // the k-th node in sorted order
    node = node.right;
  }
}` } },
        starter: { py: 'class Solution:\n    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:\n        ', js: 'function kthSmallest(root, k) {\n  \n}' },
        tests: { fn: 'kthSmallest', argTypes: ['tree'], cases: [
          { args: [[3, 1, 4, null, 2], 1], out: 1 }, { args: [[5, 3, 6, 2, 4, null, null, 1], 3], out: 3 }, { args: [[1], 1], out: 1 }, { args: [[2, 1, 3], 3], out: 3 },
          { args: [[5, 3, 6, 2, 4, null, null, 1], 6], out: 6 }] } },

      { lc: 105,
        hints: ['The first value in preorder is always the root of the tree.', 'Find that value in the inorder list: everything before it is the left subtree, everything after it is the right subtree.', 'Recurse on those two ranges, taking the next preorder value for each root. Use a hash map from value to inorder index so each lookup is O(1).'],
        solution: { explain: 'Walk preorder with one running index. For each root value, look up its position in inorder with a hash map; the inorder range to its left builds the left subtree, the range to its right builds the right. Building the left subtree first keeps the preorder index in step. O(n) time and space.', code: {
          py: `class Solution:
    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
        where = {v: i for i, v in enumerate(inorder)}   # value -> index in inorder
        pos = 0
        def build(lo, hi):                               # build from inorder[lo..hi]
            nonlocal pos
            if lo > hi:
                return None
            val = preorder[pos]                          # the next preorder value is this subtree's root
            pos += 1
            node = TreeNode(val)
            mid = where[val]
            node.left = build(lo, mid - 1)
            node.right = build(mid + 1, hi)
            return node
        return build(0, len(inorder) - 1)`,
          js: `function buildTree(preorder, inorder) {
  const where = new Map(inorder.map((v, i) => [v, i]));   // value -> index in inorder
  let pos = 0;
  function build(lo, hi) {                                // build from inorder[lo..hi]
    if (lo > hi) return null;
    const val = preorder[pos++];                          // the next preorder value is this subtree's root
    const node = new TreeNode(val), mid = where.get(val);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  }
  return build(0, inorder.length - 1);
}` } },
        starter: { py: 'class Solution:\n    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:\n        ', js: 'function buildTree(preorder, inorder) {\n  \n}' },
        tests: { fn: 'buildTree', cases: [
          { args: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], out: [3, 9, 20, null, null, 15, 7] }, { args: [[1], [1]], out: [1] }, { args: [[1, 2], [2, 1]], out: [1, 2] },
          { args: [[1, 2], [1, 2]], out: [1, null, 2] }, { args: [[1, 2, 3], [2, 1, 3]], out: [1, 2, 3] }, { args: [[], []], out: null }] } },

      { lc: 297,
        hints: ['You need a string that records the shape as well as the values: a plain list of values loses where branches end.', 'Preorder, with a marker such as `#` for every empty spot, is enough to rebuild exactly one tree.', 'To deserialize, read the tokens in order with one shared iterator: `#` returns null; a number makes a node and builds its left, then its right.'],
        solution: { explain: 'Serialize in preorder, writing `#` for each empty spot, joined with commas. Deserialize by reading tokens with a shared iterator: `#` returns null, a value creates a node and builds its left and then right subtrees. O(n) time and space each way. (The `roundTrip` helper at the end is just for the runner: it serializes and then deserializes.)', code: {
          py: `class Codec:
    def serialize(self, root):
        out = []
        def go(node):
            if node is None:
                out.append('#')                  # mark every empty spot
                return
            out.append(str(node.val))
            go(node.left)
            go(node.right)
        go(root)
        return ','.join(out)

    def deserialize(self, data):
        tokens = iter(data.split(','))           # one shared iterator, in preorder
        def build():
            tok = next(tokens)
            if tok == '#':
                return None
            node = TreeNode(int(tok))
            node.left = build()
            node.right = build()
            return node
        return build()


def roundTrip(root):
    codec = Codec()
    return codec.deserialize(codec.serialize(root))`,
          js: `class Codec {
  serialize(root) {
    const out = [];
    (function go(node) {
      if (node === null) { out.push('#'); return; }   // mark every empty spot
      out.push(String(node.val));
      go(node.left);
      go(node.right);
    })(root);
    return out.join(',');
  }
  deserialize(data) {
    const tokens = data.split(','); let i = 0;         // one shared index, in preorder
    function build() {
      const tok = tokens[i++];
      if (tok === '#') return null;
      const node = new TreeNode(Number(tok));
      node.left = build();
      node.right = build();
      return node;
    }
    return build();
  }
}

function roundTrip(root) {
  const codec = new Codec();
  return codec.deserialize(codec.serialize(root));
}` } },
        starter: { py: 'class Codec:\n    def serialize(self, root):\n        pass\n\n    def deserialize(self, data):\n        pass\n\n\n# Used by the test runner: leave it as it is.\ndef roundTrip(root):\n    codec = Codec()\n    return codec.deserialize(codec.serialize(root))', js: 'class Codec {\n  serialize(root) {\n    \n  }\n  deserialize(data) {\n    \n  }\n}\n\n// Used by the test runner: leave it as it is.\nfunction roundTrip(root) {\n  const codec = new Codec();\n  return codec.deserialize(codec.serialize(root));\n}' },
        tests: { fn: 'roundTrip', argTypes: ['tree'], cases: [
          { args: [[1, 2, 3, null, null, 4, 5]], out: [1, 2, 3, null, null, 4, 5] }, { args: [[]], out: null }, { args: [[1]], out: [1] }, { args: [[1, null, 2, null, 3]], out: [1, null, 2, null, 3] },
          { args: [[5, 2, null, 1]], out: [5, 2, null, 1] }, { args: [[-1, 0, 1]], out: [-1, 0, 1] }] } },

      { lc: 236,
        hints: ['There is no ordering to exploit, so you have to look in both subtrees.', 'Let each call report the first target it finds below it (or its own node if it is one).', 'If the left call and the right call both report something, this node is where the paths meet. If only one does, pass its answer up.'],
        starter: { py: 'class Solution:\n    # p and q are VALUES here (the runner cannot pass node references); return the value of the LCA\n    def lowestCommonAncestor(self, root: Optional[TreeNode], p: int, q: int) -> int:\n        ', js: '// p and q are VALUES here (the runner cannot pass node references); return the value of the LCA\nfunction lowestCommonAncestor(root, p, q) {\n  \n}' },
        tests: { fn: 'lowestCommonAncestor', argTypes: ['tree'], cases: [
          { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1], out: 3 }, { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 4], out: 5 },
          { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 6, 4], out: 5 }, { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 4], out: 2 },
          { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 0, 8], out: 1 }, { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 6, 8], out: 3 },
          { args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 3, 7], out: 3 }, { args: [[1, 2], 1, 2], out: 1 }] } }
    ],

    mistakes: [
      '**Forgetting the base case.** Every recursive tree function starts with `if node is None: return <something>`. Without it, `node.left` on `None` crashes. Decide what an empty tree means for *this* question (0 for a height, true for “is valid”, nothing for a list) before writing the rest.',
      '**Validating a BST by comparing only with the children.** `[5, 1, 4, null, null, 3, 6]` passes every parent-child check, yet the 3 is in the right subtree of 5. Pass an allowed `(low, high)` range down, or check that inorder is strictly increasing.',
      '**Mixing up height and depth, and nodes versus edges.** Height is measured upward from the leaves, depth downward from the root. “Max depth of a tree” counts **nodes** (a single node is 1) but “diameter” counts **edges** (a single node is 0). Read the example before choosing, and test the one-node tree.',
      '**Recomputing heights at every node.** Calling a `height()` helper inside a function that is itself called at every node makes the whole thing O(n²) on a chain. Return the height (and the answer, or an error flag) from a single postorder pass.',
      '**BFS without freezing the level size.** `for _ in range(len(queue))` must read the length *once*, before the loop starts. Writing `while len(queue)` inside the level, or reading the length again after you enqueue children, blends two levels into one list.',
      '**Using a list as a queue.** `list.pop(0)` in Python and `Array.shift()` in JavaScript look O(1) but shift every remaining element. Use `collections.deque` in Python; in JavaScript use an index pointer when the tree is large; in Java use `ArrayDeque`, not `Stack`.',
      '**Thinking a BST is always O(log n).** Only a balanced one is. Insert 1, 2, 3, 4, 5 in order and you get a chain with height 5. Say “O(h), which is O(log n) if balanced” and mention self-balancing trees if asked how to guarantee it.',
      '**Mutating while you traverse, and returning the wrong thing.** When you build or modify a tree recursively, assign the recursive results back (`root.left = insert(root.left, x)`) and return the root, including in the base case. Forgetting to return the node, or to reattach the child, silently drops the subtree.',
      '**Language gotchas.** *Python:* `RecursionError` at about 1000 frames on a deep tree: go iterative, or raise the limit only with care; `if node.left:` is fine for nodes, but `if node.val:` is false for a value of 0. *JavaScript:* an `undefined` child is not `null`, so use `if (!node)` rather than `=== null` when the tree might come from hand-built objects; `Array.shift()` on a big queue is slow. *Java:* compare node values with `.equals()` for `Integer` objects, since `==` fails outside the cache range -128 to 127, and use `long` for BST bounds. *C++:* `INT_MIN` and `INT_MAX` collide with real node values in a BST range check (use `long long`), and a node you `new` needs a matching `delete` (interview code often skips it, but say so).'
    ],

    quiz: [
      { kind: 'concept', q: 'You print the values of this tree in **postorder**. The tree is `1` with left child `2` and right child `3`, and `2` has a right child `4`. What is the output?',
        choices: ['4, 2, 3, 1', '1, 2, 4, 3', '2, 4, 1, 3', '1, 2, 3, 4'], answer: 0,
        explain: 'Postorder is left subtree, right subtree, then the node. The left subtree (rooted at 2) gives `4, 2` (its right child 4 first, then 2), then the right subtree gives `3`, then the root `1`. `1, 2, 4, 3` is preorder and `2, 4, 1, 3` is inorder.' },
      { kind: 'pattern', q: 'Which traversal of a **binary search tree** visits its values in sorted order?',
        choices: ['Inorder', 'Preorder', 'Postorder', 'Level order'], answer: 0,
        explain: 'Inorder goes left subtree, node, right subtree. The BST rule says the left subtree is all smaller and the right all larger, so this order is ascending. Preorder and postorder only reflect the shape, and level order mixes depths.' },
      { kind: 'complexity', q: 'What is the space complexity of a recursive depth-first traversal of a tree with n nodes and height h, counting the call stack?',
        choices: ['O(h)', 'O(1)', 'O(n) always', 'O(log n) always'], answer: 0,
        explain: 'One stack frame is open per node on the current root-to-node path, so the stack never exceeds the height. That is O(log n) for a balanced tree and O(n) for a chain, so only O(h) is correct in general. “O(1)” ignores the stack.' },
      { kind: 'bug', q: 'This function is meant to check a BST. Which tree does it wrongly accept?',
        code: `def is_bst(node):
    if node is None:
        return True
    if node.left and node.left.val >= node.val:
        return False
    if node.right and node.right.val <= node.val:
        return False
    return is_bst(node.left) and is_bst(node.right)`,
        choices: ['`[5, 4, 6, null, null, 3, 7]`: the 3 is in the right subtree of 5 but smaller than 5', '`[5, 1, 4, null, null, 3, 6]`', '`[2, 1, 3]`', 'An empty tree'], answer: 0,
        explain: 'Every parent-child pair in `[5, 4, 6, null, null, 3, 7]` is fine (4 < 5, 6 > 5, 3 < 6, 7 > 6), so the check accepts it, yet 3 is smaller than the root 5 and sits in its right subtree. (`[5, 1, 4, null, null, 3, 6]` is caught because 4 is a right child smaller than 5.) The rule applies to the whole subtree, so pass down a `(low, high)` range.' },
      { kind: 'pattern', q: 'You need the nodes of a tree grouped by depth, shallowest first. Which tool fits best?',
        choices: ['A queue (breadth-first search)', 'A stack (depth-first search)', 'A min-heap', 'A hash set'], answer: 0,
        explain: 'A queue serves nodes in the order they were discovered, so everything at depth k leaves before anything at depth k + 1. Depth-first search goes deep first and would need extra bookkeeping to regroup by depth.' },
      { kind: 'concept', q: 'You are given the **preorder** and **inorder** traversals of a tree with distinct values. What lets you find the root and split the rest?',
        choices: ['The first preorder value is the root, and its position in inorder separates the left and right subtrees', 'The last inorder value is the root', 'The middle of the preorder list is the root', 'Nothing: two traversals can never determine a tree'], answer: 0,
        explain: 'Preorder visits the root first. In inorder, everything left of the root belongs to its left subtree and everything right to its right subtree, which also tells you how many preorder values go to each side. With distinct values this is unambiguous. (Preorder alone, or inorder alone, is not enough.)' },
      { kind: 'complexity', q: 'You insert the values 1, 2, 3, 4, 5, 6, 7 **in that order** into an empty ordinary BST. How long does a later search take, in the worst case?',
        choices: ['O(n): the tree is a chain', 'O(log n): the BST rule always halves the tree', 'O(1)', 'O(n log n)'], answer: 0,
        explain: 'Each value is larger than everything before it, so it becomes the right child of the previous one: a chain of height 7. Search is O(h) and h = n here. Self-balancing trees (AVL, red-black) avoid this by rotating.' },
      { kind: 'concept', q: 'In the single-pass solution for the lowest common ancestor of two nodes in a general binary tree, when does a node return **itself** as the answer?',
        choices: ['When both its left call and its right call returned a node', 'When its value is the larger of the two targets', 'When it is a leaf', 'When it is the root'], answer: 0,
        explain: 'If both sides found a target, the two targets are in different subtrees, and this is the lowest node containing both. If only one side found something, that result is passed up unchanged. (A node that is itself a target also returns itself early.)' },
      { kind: 'pattern', q: 'Which statements about serializing a tree to a string are true? Pick every one that applies.',
        choices: ['Preorder values alone, without null markers, can describe more than one tree', 'Preorder with a marker for each empty spot identifies exactly one tree', 'A delimiter between values is needed, because values can have several digits or be negative', 'Postorder can never be used for serialization'], answer: [0, 1, 2],
        explain: 'Without markers, `1, 2` fits both “2 is the left child” and “2 is the right child”. Marking the empty spots records where every branch ends. A delimiter is needed so `12` is not read as `1` and `2`. Postorder with markers works too (read it from the back).' },
      { kind: 'bug', q: 'This is meant to return the diameter (in edges) of a tree, but it gets the wrong answer on a chain. What is wrong with the approach?',
        code: `def diameter(root):
    if root is None:
        return 0
    through_root = height(root.left) + height(root.right)
    return max(through_root, diameter(root.left), diameter(root.right))`,
        choices: ['It is correct but O(n²): `height` re-walks the subtree at every node. Return the height from one postorder pass and track the best', 'It ignores paths that pass through the root', 'It should add 1 to `through_root`', 'It returns the height instead of the diameter'], answer: 0,
        explain: 'The logic is right: the longest path either passes through the root (left height + right height) or lies entirely within one subtree. The cost is the problem: `height` walks the whole subtree at every node, which is O(n²) on a chain (it times out at scale). One postorder pass that returns the height and updates a running best is O(n).' }
    ],

    flashcards: [
      { id: 'three-orders', front: 'Preorder, inorder, postorder: where is the node recorded, and what is each order good for?', back: 'Preorder: node, left, right (copy or serialize a tree). Inorder: left, node, right (sorted order on a BST). Postorder: left, right, node (compute from the children: height, size, delete). Same walk; only the record line moves.' },
      { id: 'tree-recursion', front: 'The recipe for a recursive tree function?', back: 'Base case for the empty tree. Solve for the left and right subtrees. Combine the two answers with the current node, and return. Decide first what the empty tree returns.' },
      { id: 'bfs-levels', front: 'How do you keep levels apart in a BFS of a tree?', back: 'At the start of each round read `len(queue)` once, and process exactly that many nodes. Anything enqueued during the round belongs to the next level.' },
      { id: 'bst-rule', front: 'The exact BST rule, and the common mistake?', back: 'For EVERY node, all values in its left subtree are smaller and all in its right subtree larger. The mistake is checking only the direct children.' },
      { id: 'bst-validate', front: 'How do you validate a BST in O(n)?', back: 'Pass an allowed range `(low, high)` down: left tightens `high` to the node’s value, right raises `low`. Or check that an inorder walk is strictly increasing. Use long bounds for extreme values.' },
      { id: 'tree-space', front: 'Space of DFS versus BFS on a tree?', back: 'DFS: O(h) for the call stack (log n balanced, n for a chain). BFS: O(w), the widest level (up to about n / 2). Time is O(n) for both.' },
      { id: 'tree-height', front: 'Height of a tree, as a formula?', back: '`height(empty) = 0`, `height(node) = 1 + max(height(left), height(right))`. Diameter at a node (in edges) is `height(left) + height(right)`; keep the max over all nodes.' },
      { id: 'balanced-fast', front: 'How do you check “balanced” in O(n) rather than O(n²)?', back: 'One postorder pass returning the height, but return -1 as soon as a subtree is unbalanced (children differ by more than 1) and pass -1 straight up.' },
      { id: 'lca-general', front: 'Lowest common ancestor in a general binary tree: the single-pass idea?', back: 'A call returns its node if it is a target, else whatever its children returned. If both sides return something, this node is the LCA. Otherwise pass up the non-empty side. O(n).' },
      { id: 'lca-bst', front: 'Lowest common ancestor in a BST?', back: 'Walk down from the root: both targets smaller, go left; both larger, go right; otherwise this node splits them and is the answer. O(h), no recursion needed.' },
      { id: 'build-from-traversals', front: 'Build a tree from preorder and inorder: how?', back: 'The next preorder value is the root. Its index in inorder splits left from right. Recurse, using a hash map for the index and one running preorder pointer. O(n). Postorder + inorder works the same, from the back, right subtree first.' },
      { id: 'serialize-tree', front: 'A simple, correct tree serialization?', back: 'Preorder with `#` for every empty spot, comma-separated. Deserialize with one shared iterator: `#` gives null, a value makes a node and builds left then right.' },
      { id: 'bst-skewed', front: 'When is a BST search not O(log n)?', back: 'When the tree is unbalanced: inserting sorted data makes a chain, so search is O(n). It is O(h); self-balancing trees (AVL, red-black) keep h at O(log n).' },
      { id: 'iterative-inorder', front: 'Iterative inorder traversal, in words?', back: 'Push the left spine onto a stack. Pop a node, record it, move to its right child, and push that child’s left spine. Repeat while there is a stack or a current node.' }
    ],

    deeper: [
      { title: 'Tree traversal (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Tree_traversal', time: 'about 15 min', note: 'The standard reference: all the orders, iterative versions, Morris traversal, and which traversal pairs can reconstruct a tree.' },
      { title: 'Binary Search Tree (VisuAlgo)', url: 'https://visualgo.net/en/bst', time: 'about 20 min', note: 'An animated BST with insert, search, delete and traversals. Good for watching deletion with an inorder successor.' },
      { title: 'Binary Search Trees (Algorithms, 4th ed., Sedgewick and Wayne)', url: 'https://algs4.cs.princeton.edu/32bst/', time: 'about 30 min', note: 'A careful treatment of BST operations, ordered queries (floor, ceiling, rank, select) and why balance matters.' },
      { title: 'NeetCode roadmap: Trees', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where the Trees section sits in the NeetCode 150, with the order they suggest. Some course pages may ask you to sign in.' },
      { title: 'Binary Tree Visualizer (David Galles, USFCA)', url: 'https://www.cs.usfca.edu/~galles/visualization/BST.html', time: 'about 10 min', note: 'A second animated BST, with step-by-step insertion, find and delete.' }
    ],

    detective: [
      { id: 'common-boss', decoys: ['graphs', 'recursion', 'linked-lists'],
        statement: 'A company stores who reports to whom: every employee has one manager, the CEO has none, and nobody manages more than two people. HR is investigating two employees named in a complaint, and wants to know the most junior person in the company whom both of them answer to, directly or through other managers. If one of the two employees manages the other, that employee is the answer.',
        why: 'The “reports to” data forms a rooted hierarchy where each person has at most two children, and the question asks for the deepest node above both targets. That is a lowest-common-ancestor query on a binary tree: search both subtrees, and the first node where both sides report a find is the meeting point.' },
      { id: 'folder-weight', decoys: ['recursion', 'graphs', 'stacks'],
        statement: 'A backup tool needs to report the size of every folder on a drive. A folder’s size is the total of the files directly inside it plus the sizes of all the folders it contains, and folders can be nested many levels deep. The report must name the folder with the largest total, and each folder’s size may only be computed once its sub-folders are done.',
        why: 'A nested hierarchy where a parent’s value is built from its children’s values is a tree computed bottom-up: a postorder traversal, where each call returns the size of its subtree and a running maximum records the best folder. “Only once its sub-folders are done” is the giveaway for visiting a node after its children.' },
      { id: 'sorting-chutes', decoys: ['sorting', 'binary-search', 'linked-lists'],
        statement: 'A parcel sorting machine has a junction at every step: lighter parcels are sent down the left chute and heavier ones down the right. Inspectors keep finding that it still misroutes parcels even though every junction looks correct compared with the two chutes directly below it. Write a check that tells whether the whole machine is consistent, so that no parcel ever ends up past a junction on the wrong side of a junction higher up.',
        why: 'The machine is a binary tree where the left side must hold smaller values and the right side larger ones, and the bug is that the rule must hold against **every ancestor**, not just the parent. Carrying an allowed range down from the top, tightened at each junction, is how you validate a binary search tree.' }
    ]
  });
})();
