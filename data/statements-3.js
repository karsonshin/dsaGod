/* Offer Ready: problem statements, part 3 (linked lists, design, trees, tries, heaps, graphs).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* linked-lists */
  S(206, 'Reverse a singly linked list and return the new head.',
    '- `1→2→3→4→5` → `5→4→3→2→1`',
    'Walk the list keeping `prev`, `cur` and a saved `next`; point `cur.next` at `prev` and advance all three. **O(n) time, O(1) space.** A recursive version uses O(n) stack.');
  S(21, 'Merge two sorted linked lists into one sorted list built from the original nodes.',
    '- `1→2→4` and `1→3→4` → `1→1→2→3→4→4`',
    'Use a dummy head and a tail pointer. Repeatedly attach the smaller front node of the two lists, then attach whatever remains. **O(n + m) time, O(1) space.**');
  S(143, 'Reorder a list `L0→L1→…→Ln` into `L0→Ln→L1→Ln-1→…` in place.',
    '- `1→2→3→4` → `1→4→2→3`\n- `1→2→3→4→5` → `1→5→2→4→3`',
    'Find the middle with slow/fast pointers, reverse the second half, then interleave the two halves node by node. **O(n) time, O(1) space.**');
  S(19, 'Remove the n-th node counted from the end of a linked list and return the head.',
    '- `1→2→3→4→5`, `n = 2` → `1→2→3→5`\n- `1`, `n = 1` → empty',
    'Use a dummy head. Advance `fast` n steps ahead, then move `slow` and `fast` together until `fast` reaches the end; `slow.next` is the node to delete. **O(n) time, one pass.**');
  S(138, 'Each node has a `next` pointer and a `random` pointer to any node or null. Make a deep copy of the list.',
    '- A 3-node list where node 1’s random points to node 3 → a new list with the same structure and no shared nodes.',
    'Map old node → new node in a hash map (two passes: create copies, then wire `next` and `random`). Or interleave copies after each original to get O(1) extra space. **O(n) time.**');
  S(2, 'Two non-negative numbers are stored as linked lists of digits in reverse order (least significant first). Return their sum in the same format.',
    '- `2→4→3` + `5→6→4` → `7→0→8` (342 + 465 = 807)',
    'Walk both lists adding digits plus a carry, emitting `sum % 10` and carrying `sum // 10`. Continue while either list or the carry remains. **O(max(n, m)) time.**');
  S(141, 'Decide whether a linked list contains a cycle.',
    '- `3→2→0→-4` where the last node points back to the second → `true`',
    'Floyd’s tortoise and hare: move one pointer by 1 and another by 2; if they ever meet there’s a cycle, and if the fast one hits null there isn’t. **O(n) time, O(1) space.**');
  S(287, 'A list of n+1 integers each between 1 and n contains exactly one value that repeats (maybe many times). Find it without changing the list and with constant extra space.',
    '- `[1,3,4,2,2]` → `2`\n- `[3,1,3,4,2]` → `3`',
    'Treat `i → nums[i]` as a linked list; the repeated value is where the cycle begins. Use Floyd’s algorithm: find the meeting point, then restart one pointer at 0 and move both by one until they meet. **O(n) time, O(1) space.**');
  S(23, 'Merge k sorted linked lists into one sorted list.',
    '- `[1→4→5, 1→3→4, 2→6]` → `1→1→2→3→4→4→5→6`',
    'Keep a min-heap holding the current head of each list; pop the smallest, append it, and push its successor. Or merge lists pairwise (divide and conquer). **O(N log k) time** for N total nodes.');
  S(25, 'Reverse the nodes of a list in groups of k. If fewer than k nodes remain at the end, leave them as they are.',
    '- `1→2→3→4→5`, `k = 2` → `2→1→4→3→5`\n- same list, `k = 3` → `3→2→1→4→5`',
    'For each group, check that k nodes exist, reverse them in place, and reconnect the previous group’s tail and the next group’s head. **O(n) time, O(1) space.**');
  S(876, 'Return the middle node of a linked list; with two middle nodes, return the second.',
    '- `1→2→3→4→5` → node `3`\n- `1→2→3→4→5→6` → node `4`',
    'Slow moves one step while fast moves two; when fast runs out, slow is in the middle. **O(n) time, O(1) space.**');
  S(83, 'Remove duplicates from a sorted linked list so each value appears once.',
    '- `1→1→2→3→3` → `1→2→3`',
    'Walk with one pointer; while the next node has the same value, skip it by relinking. **O(n) time, O(1) space.**');
  S(203, 'Remove every node of a linked list whose value equals a given number.',
    '- `1→2→6→3→4→5→6`, `val = 6` → `1→2→3→4→5`',
    'A dummy head handles removal of the first node. Walk with `cur`; while `cur.next.val == val` relink past it, else advance. **O(n) time.**');
  S(234, 'Decide whether a linked list reads the same forwards and backwards.',
    '- `1→2→2→1` → `true`\n- `1→2` → `false`',
    'Find the middle, reverse the second half, and compare it to the first half node by node (optionally restore afterwards). **O(n) time, O(1) space.**');
  S(24, 'Swap every two adjacent nodes in a list by relinking nodes, not by changing their values.',
    '- `1→2→3→4` → `2→1→4→3`',
    'Dummy head; for each pair, rewire `prev → second → first → next` and move `prev` to `first`. **O(n) time, O(1) space.**');
  S(328, 'Rearrange a list so all nodes at odd positions come first, followed by those at even positions, keeping relative order inside each group. Use O(1) extra space.',
    '- `1→2→3→4→5` → `1→3→5→2→4`',
    'Keep two chains, odd and even, advancing each by two nodes, then attach the even chain after the odd chain. **O(n) time, O(1) space.**');
  S(92, 'Reverse only the portion of a list from position `left` to position `right` (1-indexed) and return the head.',
    '- `1→2→3→4→5`, `left = 2`, `right = 4` → `1→4→3→2→5`',
    'Walk to the node before `left`, then repeatedly move the node after the segment’s tail to the front of the segment (head insertion) `right - left` times. **O(n) time, one pass.**');
  S(148, 'Sort a linked list in ascending order in O(n log n) time.',
    '- `4→2→1→3` → `1→2→3→4`',
    'Merge sort: split at the middle (slow/fast), sort both halves recursively, and merge them. **O(n log n) time**; O(log n) stack, or O(1) with bottom-up merging.');
  S(142, 'If a linked list has a cycle, return the node where the cycle begins; otherwise return null.',
    '- `3→2→0→-4` with the tail pointing back to node `2` → node `2`',
    'Detect the meeting point with slow/fast pointers, then start a new pointer at the head and move it together with the slow one one step at a time; they meet at the cycle entrance. **O(n) time, O(1) space.**');

  /* design-ds */
  S(146, 'Design a cache with a fixed capacity. `get(key)` returns the value or -1, and `put(key, value)` inserts or updates; when full, evict the least recently used entry. Both operations should be O(1).',
    '- capacity 2: put(1,1), put(2,2), get(1) → `1`, put(3,3) evicts key 2, get(2) → `-1`',
    'Combine a hash map (key → node) with a doubly linked list ordered by recency; move a node to the front on every access and drop the tail when over capacity. Sentinel head/tail nodes simplify edge cases. **O(1) per operation.**');
  S(355, 'Design a mini social feed: users can post tweets, follow or unfollow others, and fetch the 10 most recent tweet IDs from themselves and the people they follow.',
    '- user 1 posts tweet 5; follows user 2, who posts tweet 6 → user 1’s feed is `[6, 5]`',
    'Store each user’s tweets with a global timestamp counter and a follow set per user. For the feed, merge the recent tweets of the user and followees with a max-heap (or take the last 10 of each and sort). **O(f log f) per feed.**');

  /* trees */
  S(226, 'Mirror a binary tree: swap the left and right child of every node.',
    '- `[4,2,7,1,3,6,9]` → `[4,7,2,9,6,3,1]`',
    'Recursively invert both subtrees and swap the children at each node. **O(n) time, O(h) stack.**');
  S(104, 'Return the number of nodes along the longest root-to-leaf path of a binary tree.',
    '- `[3,9,20,null,null,15,7]` → `3`',
    'Depth = 1 + max(depth of left, depth of right), with 0 for a null node. **O(n) time, O(h) stack.**');
  S(543, 'Return the length (in edges) of the longest path between any two nodes of a binary tree; it need not pass through the root.',
    '- `[1,2,3,4,5]` → `3` (e.g. 4→2→1→3)',
    'DFS returning each node’s height; at every node the best path through it is `leftHeight + rightHeight`. Track the maximum globally. **O(n) time.**');
  S(110, 'Decide whether a binary tree is height-balanced: at every node the left and right subtree heights differ by at most 1.',
    '- `[3,9,20,null,null,15,7]` → `true`\n- `[1,2,2,3,3,null,null,4,4]` → `false`',
    'Return the height from a post-order DFS and use −1 as a flag for “unbalanced” so work isn’t repeated. **O(n) time.**');
  S(100, 'Decide whether two binary trees are identical in structure and values.',
    '- `[1,2,3]` and `[1,2,3]` → `true`\n- `[1,2]` and `[1,null,2]` → `false`',
    'Compare the roots; both null is equal, one null or different values is not; otherwise recurse on both children. **O(n) time.**');
  S(572, 'Decide whether one binary tree appears as a subtree (a node and all its descendants) somewhere inside another.',
    '- `root = [3,4,5,1,2]`, `sub = [4,1,2]` → `true`',
    'At every node of the big tree, run the “same tree” check against the candidate subtree. **O(n·m) time**; serializing both trees and doing a substring search can reach O(n + m).');
  S(235, 'Find the lowest common ancestor of two nodes in a binary search tree.',
    '- `[6,2,8,0,4,7,9,null,null,3,5]`, nodes `2` and `8` → `6`; nodes `2` and `4` → `2`',
    'Walk down from the root: if both values are smaller go left, if both are larger go right, otherwise the current node is the split point. **O(h) time, O(1) space.**');
  S(102, 'Return the values of a binary tree level by level, from top to bottom, left to right.',
    '- `[3,9,20,null,null,15,7]` → `[[3],[9,20],[15,7]]`',
    'BFS with a queue; process exactly the current queue length at each level to build one inner list. **O(n) time.**');
  S(199, 'Imagine standing on the right side of a binary tree; return the values of the nodes you can see, top to bottom.',
    '- `[1,2,3,null,5,null,4]` → `[1,3,4]`',
    'Level-order traversal and keep the last node of each level; or DFS right-first recording the first node seen at each depth. **O(n) time.**');
  S(1448, 'In a binary tree, a node is “good” if no node on the path from the root to it has a greater value. Count the good nodes.',
    '- `[3,1,4,3,null,1,5]` → `4`',
    'DFS carrying the maximum value on the path so far; a node is good if its value ≥ that max. Update the max for the children. **O(n) time.**');
  S(98, 'Decide whether a binary tree is a valid binary search tree: every node is greater than everything in its left subtree and smaller than everything in its right subtree.',
    '- `[2,1,3]` → `true`\n- `[5,1,4,null,null,3,6]` → `false` (3 is under 5’s right side)',
    'DFS passing an allowed `(low, high)` range down: left children get `high = node.val`, right children get `low = node.val`. Or check that an in-order traversal is strictly increasing. **O(n) time.**');
  S(230, 'Return the k-th smallest value (1-indexed) in a binary search tree.',
    '- `[3,1,4,null,2]`, `k = 1` → `1`\n- `[5,3,6,2,4,null,null,1]`, `k = 3` → `3`',
    'In-order traversal visits values in sorted order; stop after the k-th visit (iterative with a stack for early exit). **O(h + k) time.**');
  S(105, 'Rebuild a binary tree from its preorder and inorder traversals (all values are distinct).',
    '- preorder `[3,9,20,15,7]`, inorder `[9,3,15,20,7]` → `[3,9,20,null,null,15,7]`',
    'The first preorder value is the root; find it in the inorder list to split left and right subtrees, and recurse with the matching preorder slices. A value→index map makes it O(n). **O(n) time.**');
  S(297, 'Design an algorithm to turn a binary tree into a string and rebuild the identical tree from that string.',
    '- Any tree, such as `[1,2,3,null,null,4,5]`, must round-trip exactly.',
    'Preorder DFS writing a marker (like `#`) for null children, comma-separated; decoding reads tokens in the same order recursively. Level-order with markers also works. **O(n) time.**');
  S(124, 'The path sum of a path in a binary tree is the sum of its node values; a path can start and end at any nodes and goes through parent-child links, using each node at most once. Return the maximum path sum.',
    '- `[1,2,3]` → `6`\n- `[-10,9,20,null,null,15,7]` → `42`',
    'DFS returning the best downward gain from each node (ignoring negatives with `max(0, …)`). At each node, a path bending there scores `val + leftGain + rightGain`; track the global maximum. **O(n) time.**');

  /* tries */
  S(208, 'Implement a trie with `insert(word)`, `search(word)` for an exact word, and `startsWith(prefix)`.',
    '- insert `"apple"`: search `"apple"` → `true`, search `"app"` → `false`, startsWith `"app"` → `true`',
    'Each node has child links per letter and an end-of-word flag. Insert and lookup walk one node per character. **O(L) per operation.**');
  S(211, 'Design a dictionary where you add words and can search with `.` standing for any single letter.',
    '- add `"bad"`, `"dad"`, `"mad"`: search `"pad"` → `false`, `"b.."` → `true`, `".ad"` → `true`',
    'Store words in a trie. For a `.`, recurse into every child at that position; otherwise follow the exact letter. **O(L) normally, O(26ᴸ) worst case.**');
  S(212, 'Given a grid of letters and a list of words, return all words that can be traced through adjacent cells (no cell reused within one word).',
    '- A 2×2 grid `oa / et`... with words like `"oath"` found when the path exists in a larger grid.',
    'Build a trie of the words and DFS from each cell, walking the trie in step with the grid; prune dead trie branches and mark words as found once. **O(m·n·4·3ᴸ⁻¹) worst case.**');

  /* heaps */
  S(703, 'Design a class that tracks the k-th largest value in a stream: `add(val)` inserts a number and returns the current k-th largest.',
    '- k = 3, start `[4,5,8,2]`: add 3 → `4`, add 5 → `5`, add 10 → `5`',
    'Keep a min-heap of size k holding the k largest values; its root is the answer. Push, and pop when the size exceeds k. **O(log k) per add.**');
  S(1046, 'Repeatedly smash the two heaviest stones: equal stones both vanish, otherwise the heavier loses the lighter’s weight. Return the weight of the last stone (0 if none).',
    '- `[2,7,4,1,8,1]` → `1`',
    'Use a max-heap (negate values in Python); pop two, push the difference if non-zero, repeat until one or none remains. **O(n log n) time.**');
  S(973, 'Given points on a plane, return the k points closest to the origin (any order).',
    '- `[[1,3],[-2,2]]`, `k = 1` → `[[-2,2]]`',
    'Keep a max-heap of size k keyed by squared distance (no square root needed), or use quickselect for O(n) average. **O(n log k) time.**');
  S(215, 'Return the k-th largest element in an unsorted list (counting duplicates as separate entries).',
    '- `[3,2,1,5,6,4]`, `k = 2` → `5`\n- `[3,2,3,1,2,4,5,5,6]`, `k = 4` → `4`',
    'Min-heap of size k, whose root is the answer, for O(n log k); or quickselect for O(n) average. **O(n log k) time.**');
  S(621, 'Tasks are labeled with letters and each takes one unit of time. The same letter must be separated by at least n idle or other-task units. Return the least total time to finish all tasks.',
    '- `["A","A","A","B","B","B"]`, `n = 2` → `8`',
    'Count task frequencies. The most frequent task forces `(maxCount - 1) * (n + 1) + numberOfTasksWithMaxCount` slots; the answer is the larger of that and the total task count. Alternatively simulate with a max-heap and a cooldown queue. **O(n) time.**');
  S(295, 'Design a structure that supports adding numbers from a stream and returning the median of all numbers so far.',
    '- add 1, add 2 → median `1.5`; add 3 → median `2`',
    'Keep a max-heap for the lower half and a min-heap for the upper half, balanced so their sizes differ by at most 1. The median is a root or the average of both roots. **O(log n) add, O(1) median.**');

  /* graphs */
  S(200, 'In a grid of `1` (land) and `0` (water), count the islands: groups of land connected up, down, left or right.',
    '- `11000 / 11000 / 00100 / 00011` → `3`',
    'Scan the grid; each time you find unvisited land, increment the count and flood-fill (DFS/BFS) the whole island, marking its cells visited. **O(m·n) time.**');
  S(133, 'Return a deep copy of a connected undirected graph given by one of its nodes (each node has a value and a list of neighbors).',
    '- A 4-node cycle `1-2-3-4-1` → a new, separate 4-node cycle.',
    'DFS or BFS with a map from original node to clone; when a neighbor isn’t cloned yet, create and recurse; always link clones through the map. **O(V + E) time.**');
  S(695, 'In a grid of 0s and 1s, return the area (number of cells) of the largest island of connected 1s, using 4-direction adjacency.',
    '- A grid with islands of sizes 4 and 6 → `6`',
    'Flood fill from every unvisited land cell, returning the count of cells reached; track the maximum. **O(m·n) time.**');
  S(417, 'Water flows to a neighbor of equal or lower height. In a height grid, the Pacific borders the top and left, the Atlantic the bottom and right. Return all cells from which water can reach both oceans.',
    '- A 5×5 height grid → list of coordinates such as `[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]`',
    'Reverse the flow: start a BFS/DFS from each ocean’s border cells, moving to neighbors of equal or greater height. The answer is the intersection of the two reached sets. **O(m·n) time.**');
  S(130, 'In a grid of `X` and `O`, capture every region of `O`s that is fully surrounded by `X`s by flipping it to `X`. Regions touching the border are safe.',
    '- `XXXX / XOOX / XXOX / XOXX` → `XXXX / XXXX / XXXX / XOXX`',
    'Flood fill from border `O`s and mark them safe; then flip every remaining `O` to `X` and restore the safe ones. **O(m·n) time.**');
  S(994, 'A grid has empty cells (0), fresh oranges (1), and rotten oranges (2). Each minute rot spreads to the 4 adjacent fresh oranges. Return the minutes until none are fresh, or -1 if some never rot.',
    '- `[[2,1,1],[1,1,0],[0,1,1]]` → `4`\n- `[[2,1,1],[0,1,1],[1,0,1]]` → `-1`',
    'Multi-source BFS from all rotten oranges at once, processing the queue one minute (level) at a time and counting fresh ones left. **O(m·n) time.**');
  S(286, 'In a grid of walls (-1), gates (0) and empty rooms (a huge number), fill each empty room with the distance to its nearest gate, or leave it unchanged if unreachable.',
    '- A room next to a gate becomes `1`, two steps away becomes `2`, and so on.',
    'Multi-source BFS from every gate simultaneously; the first time BFS reaches a room is its shortest distance. **O(m·n) time.**');
  S(127, 'Transform a begin word into an end word by changing one letter at a time, where every intermediate word must be in a given dictionary. Return the number of words in the shortest sequence, or 0 if none.',
    '- `hit` → `cog` using `[hot,dot,dog,lot,log,cog]` → `5` (`hit→hot→dot→dog→cog`)',
    'BFS where words are nodes and two words connect if they differ in one letter. Generate neighbors using wildcard patterns (`h*t`) or by trying all 26 letters per position. **O(N·L²) time.**');

  /* topo-sort */
  S(207, 'There are numCourses courses and prerequisite pairs `[a, b]` meaning you must take b before a. Decide whether all courses can be completed.',
    '- `2`, `[[1,0]]` → `true`\n- `2`, `[[1,0],[0,1]]` → `false`',
    'Detect a cycle in the directed graph: Kahn’s algorithm (repeatedly remove nodes with in-degree 0; finishing all nodes means no cycle), or DFS with visiting states. **O(V + E) time.**');
  S(210, 'Given the same course/prerequisite setup, return a valid order in which to take all courses, or an empty list if impossible.',
    '- `4`, `[[1,0],[2,0],[3,1],[3,2]]` → `[0,1,2,3]` or `[0,2,1,3]`',
    'Topological sort with Kahn’s algorithm; the order nodes are removed is the answer, and if fewer than all nodes are removed there’s a cycle. **O(V + E) time.**');
  S(269, 'You are given words sorted by an unknown alphabet’s order. Deduce a valid letter order of that alphabet, or return an empty string if the input is contradictory.',
    '- `["wrt","wrf","er","ett","rftt"]` → `"wertf"`',
    'Compare adjacent words; the first differing letters give an edge `a → b`. Topologically sort the letters. Watch for invalid prefix cases (a longer word before its own prefix) and cycles. **O(total characters) time.**');

  /* union-find */
  S(684, 'A tree of n nodes had one extra edge added, creating a cycle. Return the extra edge that can be removed to restore a tree; if several qualify, return the one that appears last in the input.',
    '- `[[1,2],[1,3],[2,3]]` → `[2,3]`',
    'Union-find: for each edge, if both endpoints already share a root, that edge closes the cycle, so return it. **O(n·α(n)) time.**');
  S(323, 'Given n nodes and a list of undirected edges, return the number of connected components.',
    '- `n = 5`, `[[0,1],[1,2],[3,4]]` → `2`',
    'Union-find starting with n components; each successful union reduces the count by 1. DFS/BFS also works. **O(n + E·α(n)) time.**');
  S(261, 'Decide whether n nodes and a list of undirected edges form a valid tree: connected with no cycle.',
    '- `n = 5`, `[[0,1],[0,2],[0,3],[1,4]]` → `true`\n- `[[0,1],[1,2],[2,3],[1,3],[1,4]]` → `false`',
    'A tree has exactly n − 1 edges and is connected. Check the edge count, then union-find all edges: any edge joining two nodes already connected means a cycle. **O(n·α(n)) time.**');
  S(547, 'A matrix `isConnected[i][j] = 1` means city i and j are directly connected (and connections are symmetric and transitive through paths). Count the groups of connected cities (“provinces”).',
    '- `[[1,1,0],[1,1,0],[0,0,1]]` → `2`',
    'Union-find or DFS over the adjacency matrix: each unvisited city starts a new province whose members you mark visited. **O(n²) time.**');
  S(721, 'Each account is a name followed by emails. Two accounts belong to the same person if they share any email. Merge accounts, and return each with its emails sorted (name first).',
    '- Two `John` accounts sharing `johnsmith@mail.com` merge into one, with all emails combined and sorted.',
    'Union-find over emails (or accounts): union all emails within an account, then group emails by root and attach the owner’s name. **O(N log N) time** from the sorting.');

  /* advanced-graphs */
  S(332, 'Given airline tickets as `[from, to]` pairs, reconstruct a trip starting at `JFK` that uses every ticket exactly once. If several itineraries exist, return the lexicographically smallest.',
    '- `[["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]` → `["JFK","MUC","LHR","SFO","SJC"]`',
    'This is an Eulerian path. Hierholzer’s algorithm: DFS, always taking the smallest unused destination (keep adjacency in a min-heap or sorted list), and append airports to the route on the way back; reverse at the end. **O(E log E) time.**');

  /* mst */
  S(1584, 'Given points on a plane, connect all of them with the minimum total cost where the cost of a link is the Manhattan distance between its endpoints. Return that cost.',
    '- `[[0,0],[2,2],[3,10],[5,2],[7,0]]` → `20`',
    'Minimum spanning tree over the complete graph: Prim’s with a heap (or O(n²) array version), or Kruskal’s with union-find over all sorted pairs. **O(n² log n) with Kruskal, O(n²) with Prim.**');

  /* shortest-paths */
  S(743, 'A network has n nodes and directed, weighted edges `[from, to, time]`. A signal starts at node k. Return the time until all nodes receive it, or -1 if some never do.',
    '- `times = [[2,1,1],[2,3,1],[3,4,1]]`, `n = 4`, `k = 2` → `2`',
    'Run Dijkstra from k; the answer is the maximum of the shortest distances, or -1 if any node is unreachable. **O(E log V) time.**');
  S(778, 'In an n×n grid of elevations, water rises over time; at time t you can swim through cells with elevation ≤ t. Return the least t that lets you go from the top-left to the bottom-right.',
    '- `[[0,2],[1,3]]` → `3`',
    'Dijkstra on the grid where a path’s cost is the maximum elevation along it (a minimax path): pop the smallest cost frontier cell and push neighbors with `max(cost, elevation)`. Binary search plus BFS also works. **O(n² log n) time.**');
  S(787, 'A directed, weighted flight network is given. Return the cheapest price from a source to a destination using at most k stops, or -1 if impossible.',
    '- `n = 4`, flights `[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]`, `src = 0`, `dst = 3`, `k = 1` → `700`',
    'Bellman–Ford limited to k+1 edges (relax all edges k+1 times using a copy of the previous distances), or BFS/Dijkstra over (node, stops used) states. **O(k·E) time.**');
})();
