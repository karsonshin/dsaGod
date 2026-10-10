(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['tree-dp'] = {
    primer: {
      kind: 'technique',
      what: `**DP on a tree** solves an optimisation problem on a rooted tree by letting every node ask its children for a **small summary**, combine the answers, and pass a summary up to its parent. Think of a company where every manager reports to a boss only the numbers the boss actually needs, never the whole org chart below.`,
      does: `It handles "best total / longest path / fewest items" on a tree where a choice at a node limits its neighbours: pick non-adjacent nodes, cover all nodes with cameras, find the best path that bends anywhere. Every node is visited once, so the cost is O(n) time and O(h) stack space for tree height h.`,
      impl: `A post-order recursive function: call it on the children **first**, then compute this node's states from theirs, and return them as a tuple (for example \`(take, skip)\`). A global or \`nonlocal\` variable records answers that cannot travel upward, like a path that bends at this node. The base case, an empty node, returns the identity tuple (\`(0, 0)\` for sums).`,
      possibilities: `House Robber on a tree (max sum with no two linked nodes), maximum path sum, tree diameter, fewest cameras or guards to cover every node, minimum vertex cover, largest binary search tree inside a tree, longest zigzag or same-value path, and, with a second pass called rerooting, the answer for every node taken as the root.`
    },

    think: [
      {
        q: `A node's two children report \`(take, skip)\` of \`(4, 3)\` and \`(5, 2)\`. The node is worth 6 and no two linked nodes may both be taken. What pair does the node report, and which child numbers does each entry use?`,
        a: `Taking the node forces both children to be skipped: \`take = 6 + 3 + 2 = 11\`. Skipping the node leaves each child free to choose its better option: \`skip = max(4, 3) + max(5, 2) = 4 + 5 = 9\`. So it reports \`(11, 9)\`. The aha: the two entries use *different* numbers from the same child, which is why one value per child is not enough and the tuple is needed.`
      },
      {
        q: `In maximum path sum a node computes \`val + left + right\` but returns \`val + max(left, right)\` to its parent. Why do they differ?`,
        a: `A path never forks. The value \`val + left + right\` is a complete path that bends at this node, using both sides, and nothing above can extend it, so it is *recorded* in a global best. What the parent can use is a path that goes **down** from this node, which can include at most one child's branch, so we *return* the better single branch. Record the arch, return the branch.`
      },
      {
        q: `You write House Robber III as \`max(rob(l) + rob(r), val + grandchildren)\` with no cache. Why does a deep tree make this blow up, and what removes the problem without any hash map?`,
        a: `A node's answer is computed once as a child and again as a grandchild by the levels above, so the same subtrees are solved over and over and the number of calls grows exponentially with depth. Returning the pair \`(rob, skip)\` from each call gives the parent both numbers it could need, so each subtree is solved exactly once and nothing has to be cached. Return enough information and recomputation disappears.`
      },
      {
        q: `A max-path-sum solution starts \`best = 0\`. On the tree with one node of value -3, what does it return and what should it return?`,
        a: `It returns 0, but a path must contain at least one node, so the answer is -3. Starting at 0 silently allows an empty path. Start from negative infinity, and clamp only the child branches with \`max(0, ...)\` (you may leave a bad branch out), never the node itself. The node's own value always counts.`
      },
      {
        q: `In the camera problem, why is it never worth putting a camera on a leaf?`,
        a: `A camera on a leaf's parent watches the leaf, the parent, the grandparent and the leaf's sibling, which is everything the leaf's own camera would watch and more. So any solution with a camera on a leaf can be changed to put it on the parent without using more cameras. That is why the greedy rule "give a camera to the parent of an unwatched child" is safe.`
      },
      {
        q: `A root has a tuple answer \`(a, b)\` computed in one O(n) pass. You now need the answer for every node as the root. Why is running the pass from each node a problem, and what is the idea of rerooting?`,
        a: `Running O(n) from each of n nodes is O(n²). Rerooting does two passes: a post-order pass computes each subtree's answer, then a pre-order pass computes, for each child, the answer for "the whole tree except this child's subtree", from the parent's own up-value and the siblings' down-values. Combining the two at each node gives its answer as root, in O(n) total.`
      }
    ],

    breakdown: [
      {
        title: `1. What the parent needs, and the slow idea`,
        body: `Take House Robber on a tree: each node holds cash, and two linked nodes (parent and child) may not both be robbed. A natural recursion says: "rob this node and jump to its grandchildren, or skip it and recurse on the children, take the better". It is correct but re-solves the same subtree as a child and as a grandchild, exponential on a deep tree. The smarter question is: *what does a parent need to know about a child's subtree?* Exactly two numbers: its best total if the child is robbed, and its best if the child is skipped. If every call returns those two numbers, nothing needs re-solving.`
      },
      {
        title: `2. State in words`,
        body: `Each call on a node returns a pair \`(take, skip)\`. \`take\` is the best total from the subtree **if this node is robbed**. \`skip\` is the best total from the subtree **if this node is not robbed**. Notice we split the situations by the one thing the parent cares about, the node's own state, and nothing else. Anything the parent would otherwise have to dig into the subtree to learn must go in the tuple; everything else should stay out. That is the whole design skill of tree DP: choose the smallest set of states that decides the parent's options.`
      },
      {
        title: `3. Recurrence and base case`,
        body: `If this node is robbed, both children must be skipped: \`take = val + left.skip + right.skip\`. If it is skipped, each child chooses freely: \`skip = max(left.take, left.skip) + max(right.take, right.skip)\`. **Base case:** an empty node (None) returns \`(0, 0)\`, which contributes nothing whether "taken" or not; it is the identity for these formulas. **Order:** both children must finish before the node computes, so this is **post-order**. The answer is \`max(take, skip)\` at the root, and the total work is O(n) because each node does a few additions.`
      },
      {
        title: `4. Post-order by hand, node by node`,
        body: `Tree \`[3, 2, 3, null, 3, null, 1]\`: root 3 with left child 2 and right child 3; the 2 has a right child 3; the right 3 has a right child 1. Post-order visits deepest first:\n\n| node | children's pairs | take | skip | pair |\n|---|---|---|---|---|\n| leaf 3 (under 2) | none | 3 | 0 | (3, 0) |\n| node 2 | right (3, 0) | 2 + 0 = 2 | max(3,0) = 3 | (2, 3) |\n| leaf 1 | none | 1 | 0 | (1, 0) |\n| node 3 (right) | right (1, 0) | 3 + 0 = 3 | max(1,0) = 1 | (3, 1) |\n| root 3 | (2,3) and (3,1) | 3 + 3 + 1 = 7 | 3 + 3 = 6 | (7, 6) |\n\nThe answer is max(7, 6) = **7**.`,
        code: { py: `def rob(root):
    def pair(node):
        if node is None:
            return 0, 0
        lt, ls = pair(node.left)
        rt, rs = pair(node.right)
        take = node.val + ls + rs
        skip = max(lt, ls) + max(rt, rs)
        return take, skip
    return max(pair(root))` }
      },
      {
        title: `5. A different state set: best down versus best through`,
        body: `For maximum path sum the parent needs a different thing from each child: the best path that **goes down** from the child (the parent can extend it). Each node then forms the arch \`val + left + right\` and records it in a global \`best\`. Clamp each child's gain with \`max(0, ...)\` so a negative branch is left out. Tree \`[-10, 9, 20, null, null, 15, 7]\`: leaf 9 gives down 9, through 9. Leaf 15: down 15. Leaf 7: down 7. Node 20: left 15, right 7, so through = 20 + 15 + 7 = **42** (recorded), down = 20 + 15 = 35. Root -10: left 9, right 35, through = -10 + 9 + 35 = 34, below 42. Answer 42.`
      },
      {
        title: `6. A three-state example: cameras`,
        body: `For the fewest cameras, a node can be in one of three states: **0 = not watched**, **1 = watched but no camera**, **2 = has a camera**. An empty child counts as 1 (watched). Rules: if any child is 0, this node needs a camera (return 2, count one); else if any child is 2, this node is watched (return 1); else return 0 and leave it for the parent. Tree: a root with left child A, and A has two leaves B and C. B and C are 0 (nobody watches them). A sees a child in state 0, takes a camera, count 1, returns 2. The root sees a child with a camera and returns 1. Answer **1**. If the root had ended at 0, add one more camera.`
      },
      {
        title: `7. Record versus return, and the edge cases`,
        body: `Most mistakes are about what leaves the function. Whatever the **parent** needs goes in the return value; whatever is a **finished answer** that cannot be extended goes in a global. In path problems that is the arch; in the diameter it is \`left + right + 2\` edges. Base cases must be the identity of your formulas: \`(0, 0)\` for sums, "watched" for cameras, -1 for zigzag lengths so that a step into nothing adds 0. Edge cases: empty tree, one node, a chain of n nodes (recursion depth n, so Python may hit its limit near 1000), all-negative values, and edges versus nodes in the length.`
      },
      {
        title: `8. Cost, spotting it, and the follow-up`,
        body: `Cost: every node is visited once and does O(1) work on its children's tuples, so **O(n) time and O(h) space** for the call stack, where h is the height (log n balanced, n for a chain). No table is needed because each subtree's answer is used by exactly one parent. Spot it with: a tree, an optimisation, and a choice at a node that limits its neighbours, or a path that can start and end anywhere. In an interview say the state first, then the two formulas. The follow-up is **rerooting**: compute the answer for every node as root with a second pre-order pass in O(n).`
      }
    ],

    drills: [
      {
        title: `Nodes equal to the sum below them`,
        q: `Given a binary tree of integers, count the nodes whose value equals the sum of **all their descendants'** values (a leaf has no descendants, so its descendant sum is 0).\n\nExample: a root 10 with children 4 and 6 returns \`1\` (the root, since 4 + 6 = 10; the leaves 4 and 6 are not 0).`,
        hint: `Have each call return the sum of its whole subtree, so the parent can test its value against left plus right.`,
        how: `I restate it: for each node, add up everything below it, and count the nodes whose own value matches that total. Brute force computes the descendant sum separately at every node by walking its subtree, which is O(n·h) and O(n²) on a chain. The waste is that a node's descendant sum is just its two children's whole-subtree sums added together, and those were already computed when we visited the children. So I use a post-order function that returns the sum of the whole subtree (node value plus both children's returns). Before returning, the node checks its own value against \`left + right\`, because those two are exactly the sum of all descendants, and increments a counter if they match. Base case: an empty node returns 0. Trace root 10 with children 4 and 6: leaf 4 returns 4 and checks 4 == 0, no; leaf 6 returns 6, no; the root checks 10 == 4 + 6, yes, count 1. Edge cases: an empty tree returns 0; a leaf valued 0 counts; negative values still work because I am just comparing sums. Cost: O(n) time, O(h) stack space, with a nonlocal counter.`,
        code: { py: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def count_matching_nodes(root):
    count = 0
    def total(node):
        nonlocal count
        if node is None:
            return 0
        below = total(node.left) + total(node.right)
        if node.val == below:
            count += 1
        return node.val + below
    total(root)
    return count` },
        explain: `The descendant sum of a node is the sum of its children's whole-subtree sums, so one post-order pass can both test each node and hand the whole-subtree sum to its parent. Every node does O(1) work: O(n) time, O(h) space.`,
        check: `import random
def rand_tree(n, lo=-3, hi=5):
    if n == 0:
        return None
    k = random.randint(0, n - 1)
    return TreeNode(random.randint(lo, hi), rand_tree(k, lo, hi), rand_tree(n - 1 - k, lo, hi))
def nodes(t):
    return [] if t is None else [t] + nodes(t.left) + nodes(t.right)
assert count_matching_nodes(None) == 0
assert count_matching_nodes(TreeNode(10, TreeNode(4), TreeNode(6))) == 1
assert count_matching_nodes(TreeNode(0)) == 1
assert count_matching_nodes(TreeNode(5)) == 0
assert count_matching_nodes(TreeNode(1, TreeNode(-1))) == 0
for _ in range(300):
    t = rand_tree(random.randint(0, 10))
    brute = sum(1 for x in nodes(t) if x.val == sum(d.val for d in nodes(x)[1:]))
    assert count_matching_nodes(t) == brute`
      },
      {
        title: `Longest same-value path`,
        q: `In a binary tree, a path is a chain of linked nodes that may start and end anywhere. Return the length, **in edges**, of the longest path in which every node has the same value.\n\nExample: a root 5 with left child 5 and right child 5, each of those having a child 5 on its outer side (five nodes in all), returns \`4\`. A tree where no two linked nodes match returns \`0\`.`,
        hint: `This is the diameter trick: record the arch through a node, return only the single best branch downward, and extend a branch only if the child has the same value.`,
        how: `I restate it: find the longest chain of linked equal-valued nodes, counted in edges, and the chain may bend at any node (go down one side, up, and down the other). Brute force tries every pair of nodes and checks the path between them, O(n²) pairs and more. A path has one highest node where it bends. So I look at each node as the top of the arch. Let \`down(node)\` be the longest same-value path that starts at the node and goes downward. For the left side, if the left child exists and has the same value as the node, the left branch is \`down(left) + 1\` edges, otherwise 0. The same for the right. The arch bending here is \`leftBranch + rightBranch\`, recorded in a global best because nothing above can extend a path that already uses both sides. What I return to the parent is \`max(leftBranch, rightBranch)\`, a single branch it may extend. Trace the five-node example: each outer leaf returns 0; each middle 5 has a matching child, so its branch is 0 + 1 = 1, which it returns; at the root each side is 1 + 1 = 2 (the middle's return plus the edge to it), so the arch is 2 + 2 = 4. Edge cases: empty tree 0, one node 0. Cost: O(n) time, O(h) space.`,
        code: { py: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def longest_same_value_path(root):
    best = 0
    def down(node):
        nonlocal best
        if node is None:
            return 0
        l = down(node.left)
        r = down(node.right)
        lw = l + 1 if node.left is not None and node.left.val == node.val else 0
        rw = r + 1 if node.right is not None and node.right.val == node.val else 0
        best = max(best, lw + rw)
        return max(lw, rw)
    down(root)
    return best` },
        explain: `Every path has a highest node; there it can combine the extendable branches on both sides (recorded in best), while only one branch continues upward (returned). A branch only counts when the child has the same value. One post-order pass: O(n) time, O(h) space.`,
        check: `import random
def rand_tree(n, lo=1, hi=2):
    if n == 0:
        return None
    k = random.randint(0, n - 1)
    return TreeNode(random.randint(lo, hi), rand_tree(k, lo, hi), rand_tree(n - 1 - k, lo, hi))
def nodes(t):
    return [] if t is None else [t] + nodes(t.left) + nodes(t.right)
five = TreeNode(5, TreeNode(5, TreeNode(5)), TreeNode(5, None, TreeNode(5)))
assert longest_same_value_path(five) == 4
assert longest_same_value_path(None) == 0
assert longest_same_value_path(TreeNode(7)) == 0
assert longest_same_value_path(TreeNode(1, TreeNode(2), TreeNode(3))) == 0
assert longest_same_value_path(TreeNode(2, TreeNode(2, TreeNode(2)))) == 2
for _ in range(300):
    t = rand_tree(random.randint(0, 11))
    par, dep = {}, {}
    def walk(x, p, d):
        if x is None:
            return
        par[x], dep[x] = p, d
        walk(x.left, x, d + 1)
        walk(x.right, x, d + 1)
    walk(t, None, 0)
    best = 0
    for u in par:
        for v in par:
            a, b, path = u, v, []
            while a is not b:
                if dep[a] >= dep[b]:
                    path.append(a)
                    a = par[a]
                else:
                    path.append(b)
                    b = par[b]
            path.append(a)
            if len({x.val for x in path}) == 1:
                best = max(best, len(path) - 1)
    assert longest_same_value_path(t) == best`
      },
      {
        title: `Smallest watch set for every corridor`,
        q: `A binary tree models corridors, with nodes as junctions. You may post a guard at some junctions. A guard at a junction covers every corridor (edge) touching it. Return the fewest guards needed so that **every edge** has a guard at one of its two ends (a minimum vertex cover).\n\nExample: a root with two leaf children returns \`1\` (guard the root). A single node returns \`0\`.`,
        hint: `Per node return (cost if guarded, cost if not guarded). If a node is not guarded, every child must be guarded.`,
        how: `I restate it: pick as few nodes as possible so that every parent-child link has at least one chosen end. Brute force tries every subset, 2ⁿ. The choice at a node constrains its neighbours in an asymmetric way: if I do not guard a node, then every edge to a child needs the child guarded; if I do guard it, those edges are fine and each child is free. That is a classic two-state tree DP. For each node return \`(guard, free)\`: \`guard\` is the fewest guards in the subtree if this node is guarded, \`free\` if it is not. If guarded: \`guard = 1 + sum over children of min(child.guard, child.free)\`, since the children are unconstrained. If not guarded: \`free = sum over children of child.guard\`, since each edge to a child must be covered by the child. Base case: an empty child contributes 0 to both, which also works for the min (min(0, 0) = 0) and does not force a nonexistent guard. The answer is \`min\` of the root's pair. Trace a root with two leaves: each leaf is (1, 0); the root is guard = 1 + 0 + 0 = 1 and free = 1 + 1 = 2, so the answer is 1. Edge cases: one node has no edges, so (1, 0) gives 0; empty tree 0. Cost: O(n) time, O(h) space.`,
        code: { py: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def min_vertex_cover(root):
    def pair(node):
        if node is None:
            return 0, 0
        lg, lf = pair(node.left)
        rg, rf = pair(node.right)
        guard = 1 + min(lg, lf) + min(rg, rf)
        free = lg + rg
        return guard, free
    return min(pair(root))` },
        explain: `Guarding a node covers its child edges, so each child may do whatever is cheaper; not guarding it forces every child to be guarded. Empty children contribute 0 either way. One post-order pass with two numbers per node: O(n) time, O(h) space.`,
        check: `import random
from itertools import product
def rand_tree(n):
    if n == 0:
        return None
    k = random.randint(0, n - 1)
    return TreeNode(0, rand_tree(k), rand_tree(n - 1 - k))
def nodes(t):
    return [] if t is None else [t] + nodes(t.left) + nodes(t.right)
assert min_vertex_cover(None) == 0
assert min_vertex_cover(TreeNode(0)) == 0
assert min_vertex_cover(TreeNode(0, TreeNode(0), TreeNode(0))) == 1
assert min_vertex_cover(TreeNode(0, TreeNode(0, TreeNode(0)))) == 1
for _ in range(300):
    t = rand_tree(random.randint(0, 9))
    ns = nodes(t)
    idx = {id(x): i for i, x in enumerate(ns)}
    edges = [(idx[id(x)], idx[id(c)]) for x in ns for c in (x.left, x.right) if c is not None]
    best = len(ns)
    for mask in range(1 << len(ns)):
        if all(mask >> a & 1 or mask >> b & 1 for a, b in edges):
            best = min(best, bin(mask).count("1"))
    if not edges:
        best = 0
    assert min_vertex_cover(t) == best`
      },
      {
        title: `Biggest search-tree island`,
        q: `Given a binary tree of integers, return the number of nodes in the largest subtree (a node together with all its descendants) that is a valid binary search tree: for every node, all values in its left subtree are strictly smaller and all values in its right subtree are strictly larger.\n\nExample: a root 10 with left child 5 (children 1 and 8) and right child 15 (right child 7) returns \`3\` (the subtree rooted at 5), because the whole tree is broken by the 7 sitting under 15.`,
        hint: `Each call must report whether its subtree is a BST, its size, and its smallest and largest value, so the parent can compare.`,
        how: `I restate it: look at every subtree rooted at some node and find the biggest one that is a legal search tree. Brute force validates each subtree separately, walking all its nodes, O(n²) on a chain. The slow part is re-checking the same values from every ancestor. Instead each call should hand its parent exactly what the parent needs to decide whether it can join: is my subtree a BST, how many nodes does it have, and what are its smallest and largest values. The parent, with a value v, is the root of a BST exactly when both children are BSTs, the left subtree's maximum is below v, and the right subtree's minimum is above v. Then its size is left + right + 1, its minimum is the smaller of the left minimum and v, and its maximum the larger of the right maximum and v. If it fails, it reports not-a-BST, and so does every ancestor, but the best size seen so far is kept in a global. Base case: an empty tree is a BST of size 0 with minimum infinity and maximum negative infinity, so the comparisons pass. Trace the example: the 1 and 8 leaves are BSTs; the 5 has max 1 < 5 < 8, size 3, recorded; the 7 leaf is a BST but the 15 needs 7 > 15, so it fails; the root fails. Answer 3. Edge cases: empty tree 0; a single node 1; equal values break strictness. Cost: O(n) time, O(h) space.`,
        code: { py: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def largest_bst_size(root):
    best = 0
    INF = float('inf')
    def go(node):
        nonlocal best
        if node is None:
            return True, 0, INF, -INF
        lok, lsize, llo, lhi = go(node.left)
        rok, rsize, rlo, rhi = go(node.right)
        if lok and rok and lhi < node.val < rlo:
            size = lsize + rsize + 1
            best = max(best, size)
            return True, size, min(llo, node.val), max(rhi, node.val)
        return False, 0, -INF, INF
    go(root)
    return best` },
        explain: `A subtree rooted at v is a BST exactly when both children's subtrees are BSTs and the left maximum is below v and the right minimum above v. Returning (is-BST, size, min, max) from each call lets the parent test that in O(1); failed subtrees poison their ancestors, while the global best remembers the largest success. O(n) time, O(h) space.`,
        check: `import random
def rand_tree(n, lo=1, hi=9):
    if n == 0:
        return None
    k = random.randint(0, n - 1)
    return TreeNode(random.randint(lo, hi), rand_tree(k, lo, hi), rand_tree(n - 1 - k, lo, hi))
def nodes(t):
    return [] if t is None else [t] + nodes(t.left) + nodes(t.right)
def inorder(t):
    return [] if t is None else inorder(t.left) + [t.val] + inorder(t.right)
def is_bst(t):
    v = inorder(t)
    return all(v[i] < v[i + 1] for i in range(len(v) - 1))
tree = TreeNode(10, TreeNode(5, TreeNode(1), TreeNode(8)), TreeNode(15, None, TreeNode(7)))
assert largest_bst_size(tree) == 3
assert largest_bst_size(None) == 0
assert largest_bst_size(TreeNode(4)) == 1
assert largest_bst_size(TreeNode(2, TreeNode(2))) == 1
assert largest_bst_size(TreeNode(2, TreeNode(1), TreeNode(3))) == 3
for _ in range(400):
    t = rand_tree(random.randint(0, 10))
    best = max([len(nodes(x)) for x in nodes(t) if is_bst(x)], default=0)
    assert largest_bst_size(t) == best`
      }
    ],

    how: {
      124: `I restate it: a path is a chain of linked nodes that can start and end anywhere without reusing a node, its value is the sum of its nodes, values can be negative, and I want the maximum. Brute force sums the path between every pair of nodes, O(n²) pairs at least. The observation is that every path has a single highest node, the point where it turns around or just ends. So I treat each node as that top and ask two different questions. The first is the best path that **goes down** from the node: the node plus at most one child's downward path, because a parent can only extend one branch. The second is the best path that **bends** at the node: the node plus the best downward path on each side. I compute these with a post-order function that returns the first and records the second in a variable. Each child's gain is clamped with max(0, ...) so a negative branch is simply left out, but the node's own value always counts. I start the answer at negative infinity so an all-negative tree returns its largest single node. Trace [-10, 9, 20, null, null, 15, 7]: node 20 has gains 15 and 7, bends for 42, and returns 35; the root bends at -10 + 9 + 35 = 34; the answer is 42. Edge cases: one node [-3] gives -3; a chain. Cost: O(n) time, O(h) space.`,
      337: `I restate it: the houses are tree nodes, robbing two linked houses (parent and child) triggers the alarm, and I want the most cash. Brute force from each house tries both options: rob it and recurse on the grandchildren, or skip it and recurse on the children. It is correct but a subtree is solved once as a child and again as a grandchild, so it is exponential on a deep tree, unless I cache by node. The cleaner observation is that the decision at a node depends on exactly one thing from each child: its best total if robbed and its best if skipped. So every call returns that pair. If this node is robbed, the children must be skipped: take = val + left.skip + right.skip. If it is skipped, each child is free to pick its better option: skip = max(left pair) + max(right pair). An empty node returns (0, 0). The answer is the larger number at the root. Trace [3,2,3,null,3,null,1]: the bottom 3 is (3,0); the 2 above it is (2,3); the 1 is (1,0); the right 3 is (3,1); the root is take 3+3+1 = 7, skip 3+3 = 6, so the answer is 7. Edge cases: empty tree 0; a chain alternates. Cost: O(n) time, O(h) space, and no hash map.`,
      968: `I restate it: a camera on a node watches the node, its parent and its children; place the fewest cameras so every node is watched. Brute force tries all subsets of nodes, 2ⁿ. The honest DP gives each node three numbers (camera here, watched without a camera, not watched), and it is O(n); but a greedy argument collapses it. A camera on a leaf is never better than a camera on its parent, since the parent watches everything the leaf would, and more. So I work bottom-up and let each node report one of three states: 0 not watched, 1 watched without a camera, 2 has a camera. An empty child counts as watched, state 1, so it neither demands nor offers a camera. At a node: if any child is 0, the node must hold a camera, because nobody else can reach that child, so count one and return 2. Otherwise, if any child is 2, the node is watched, return 1. Otherwise return 0 and leave it to the parent. The root has no parent, so if it ends in state 0 I add one more camera. Trace a root with left child A, which has leaves B and C: B and C are 0, A takes a camera, the root is watched; the answer is 1. Edge cases: one node needs 1, empty tree needs 0. Cost: O(n) time, O(h) space.`,
      1372: `I restate it: a zigzag walk starts at any node, steps to a child in some direction, must alternate direction every step, and may stop whenever; I want the most steps over the whole tree. Brute force starts a walk from every node in both directions and follows the forced alternation, O(n·h), O(n²) on a long chain, repeating work the lower starts already did. The observation is that a walk starting at a node is fully decided by its first direction. A walk starting at a node and going left is one step plus the walk starting at the left child that goes right, because the direction must flip. Going right is symmetric. So each node returns two numbers: the longest zigzag starting by going left, and the longest starting by going right. startLeft = 1 + startRight(left child); startRight = 1 + startLeft(right child). A missing child returns -1 for both, so stepping into nothing contributes 1 + (-1) = 0 steps and a leaf reports 0. Since a walk can start anywhere, I keep the maximum over every node in a global. Trace a root whose left child A has a right child B, which has a left child C: C reports (0,0), B reports (1,0), A reports (0,2), and the root gets startLeft = 1 + 2 = 3. Edge cases: one node gives 0; a chain that always goes the same way gives 1. Cost: O(n) time, O(h) space.`
    }
  };
})();
