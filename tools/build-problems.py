"""Build data/problems.js: NeetCode 150 plus the brief's anchor problems.

Only the LeetCode number, curriculum topic, pattern and Blind 75 membership are written by hand below.
Title, slug, difficulty and premium come from tools/lc-index.json (LeetCode's own API), so every
number/title/slug triple is correct by construction. Run: python tools/build-problems.py
"""
import glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (lc, topic id from data/curriculum.js, pattern, in Blind 75)
NC150 = [
    # Arrays & hashing
    (217, 'arrays-hashing', 'Hash set', True),
    (242, 'arrays-hashing', 'Frequency count', True),
    (1, 'arrays-hashing', 'Hash map (complement lookup)', True),
    (49, 'arrays-hashing', 'Hash map (canonical key)', True),
    (347, 'arrays-hashing', 'Frequency count + bucket sort', True),
    (271, 'arrays-hashing', 'Length-prefix encoding', True),
    (238, 'prefix-sums', 'Prefix and suffix products', True),
    (36, 'arrays-hashing', 'Hash sets per row, column and box', False),
    (128, 'arrays-hashing', 'Hash set (sequence starts)', True),
    # Two pointers
    (125, 'two-pointers', 'Opposite ends', True),
    (167, 'two-pointers', 'Opposite ends (sorted input)', False),
    (15, 'two-pointers', 'Sort + opposite ends', True),
    (11, 'two-pointers', 'Opposite ends (move the shorter side)', True),
    (42, 'two-pointers', 'Opposite ends (running max)', False),
    # Sliding window
    (121, 'sliding-window', 'Running minimum', True),
    (3, 'sliding-window', 'Variable window + set', True),
    (424, 'sliding-window', 'Variable window + counts', True),
    (567, 'sliding-window', 'Fixed window + counts', False),
    (76, 'sliding-window', 'Variable window (shrink to minimum)', True),
    (239, 'sliding-window', 'Monotonic deque', False),
    # Stack
    (20, 'stacks', 'Matching brackets', True),
    (155, 'stacks', 'Stack with running minimum', False),
    (150, 'stacks', 'Expression evaluation', False),
    (22, 'backtracking', 'Backtracking (constrained build)', False),
    (739, 'monotonic', 'Monotonic stack (next greater)', False),
    (853, 'stacks', 'Sort + stack', False),
    (84, 'monotonic', 'Monotonic stack (boundaries)', False),
    # Binary search
    (704, 'binary-search', 'Classic binary search', False),
    (74, 'binary-search', 'Binary search (flattened matrix)', False),
    (875, 'binary-search', 'Binary search on the answer', False),
    (153, 'binary-search', 'Binary search (rotated array)', True),
    (33, 'binary-search', 'Binary search (rotated array)', True),
    (981, 'binary-search', 'Binary search over timestamps', False),
    (4, 'binary-search', 'Binary search (partition)', False),
    # Linked list
    (206, 'linked-lists', 'Reversal', True),
    (21, 'linked-lists', 'Dummy node merge', True),
    (143, 'linked-lists', 'Fast & slow + reversal + merge', True),
    (19, 'linked-lists', 'Two pointers with a gap', True),
    (138, 'linked-lists', 'Hash map (old node to new node)', False),
    (2, 'linked-lists', 'Digit-by-digit with carry', False),
    (141, 'linked-lists', 'Fast & slow pointers', True),
    (287, 'linked-lists', 'Fast & slow (cycle in an index graph)', False),
    (146, 'design-ds', 'Hash map + doubly linked list', False),
    (23, 'linked-lists', 'K-way merge with a heap', True),
    (25, 'linked-lists', 'Reversal in groups', False),
    # Trees
    (226, 'trees', 'DFS (swap children)', True),
    (104, 'trees', 'DFS (depth)', True),
    (543, 'trees', 'DFS (height + global best)', False),
    (110, 'trees', 'DFS (height with early exit)', False),
    (100, 'trees', 'DFS (two trees in parallel)', True),
    (572, 'trees', 'DFS + same-tree check', True),
    (235, 'trees', 'BST property', True),
    (102, 'trees', 'BFS level order', True),
    (199, 'trees', 'BFS level order (last node)', False),
    (1448, 'trees', 'DFS with path maximum', False),
    (98, 'trees', 'DFS with bounds', True),
    (230, 'trees', 'Inorder traversal', True),
    (105, 'trees', 'Recursion (preorder + inorder index)', True),
    (124, 'tree-dp', 'DFS (max gain + global best)', True),
    (297, 'trees', 'Preorder serialization', True),
    # Tries
    (208, 'tries', 'Trie', True),
    (211, 'tries', 'Trie + DFS for wildcards', True),
    (212, 'tries', 'Trie + grid backtracking', True),
    # Heap / priority queue
    (703, 'heaps', 'Min-heap of size k', False),
    (1046, 'heaps', 'Max-heap simulation', False),
    (973, 'heaps', 'Top-K with a heap', False),
    (215, 'heaps', 'Heap or quickselect', False),
    (621, 'heaps', 'Greedy scheduling (heap or counting)', False),
    (355, 'design-ds', 'K-way merge (heap) inside a design', False),
    (295, 'heaps', 'Two heaps', True),
    # Backtracking
    (78, 'backtracking', 'Subsets (include or exclude)', False),
    (39, 'backtracking', 'Combinations (reuse allowed)', True),
    (46, 'backtracking', 'Permutations', False),
    (90, 'backtracking', 'Subsets with duplicates', False),
    (40, 'backtracking', 'Combinations (no reuse, skip duplicates)', False),
    (79, 'backtracking', 'Grid backtracking', True),
    (131, 'backtracking', 'Partitioning', False),
    (17, 'backtracking', 'Combinations (digit mapping)', False),
    (51, 'backtracking', 'Constraint placement', False),
    # Graphs
    (200, 'graphs', 'Grid flood fill (DFS or BFS)', True),
    (133, 'graphs', 'Graph DFS + hash map', True),
    (695, 'graphs', 'Grid DFS (area)', False),
    (417, 'graphs', 'Reverse flow from the borders', True),
    (130, 'graphs', 'Border DFS (capture regions)', False),
    (994, 'graphs', 'Multi-source BFS', False),
    (286, 'graphs', 'Multi-source BFS', False),
    (207, 'topo-sort', 'Cycle detection (topological sort)', True),
    (210, 'topo-sort', 'Topological sort (Kahn)', False),
    (684, 'union-find', 'Union-find (redundant edge)', False),
    (323, 'union-find', 'Union-find or DFS components', True),
    (261, 'union-find', 'Union-find (tree check)', True),
    (127, 'graphs', 'BFS (shortest transformation)', False),
    # Advanced graphs
    (332, 'advanced-graphs', 'Eulerian path (Hierholzer)', False),
    (1584, 'mst', 'Prim or Kruskal', False),
    (743, 'shortest-paths', 'Dijkstra', False),
    (778, 'shortest-paths', 'Dijkstra (minimax path)', False),
    (269, 'topo-sort', 'Topological sort (letter order)', True),
    (787, 'shortest-paths', 'Bellman-Ford (at most k edges)', False),
    # 1-D DP
    (70, 'dp-1d', 'Fibonacci-style DP', True),
    (746, 'dp-1d', 'Fibonacci-style DP (min cost)', False),
    (198, 'dp-1d', 'Take or skip', True),
    (213, 'dp-1d', 'Take or skip (circular)', True),
    (5, 'string-dp', 'Expand around center', True),
    (647, 'string-dp', 'Expand around center (count)', True),
    (91, 'dp-1d', 'Counting DP (decodings)', True),
    (322, 'knapsack', 'Unbounded knapsack (min coins)', True),
    (152, 'kadane', 'Kadane (track max and min)', True),
    (139, 'dp-1d', 'Prefix DP (word break)', True),
    (300, 'lis', 'LIS (DP or patience sorting)', True),
    (416, 'knapsack', '0/1 knapsack (subset sum)', False),
    # 2-D DP
    (62, 'dp-2d', 'Grid paths DP', True),
    (1143, 'string-dp', 'Longest common subsequence', True),
    (309, 'dp-2d', 'State machine DP', False),
    (518, 'knapsack', 'Unbounded knapsack (count ways)', False),
    (494, 'knapsack', '0/1 knapsack (target sum)', False),
    (97, 'string-dp', 'Two-string DP', False),
    (329, 'dp-2d', 'DFS + memo on a grid', False),
    (115, 'string-dp', 'Two-string DP (count)', False),
    (72, 'string-dp', 'Edit distance', False),
    (312, 'interval-dp', 'Interval DP (last one to burst)', False),
    (10, 'string-dp', 'Two-string DP (wildcards)', False),
    # Greedy
    (53, 'kadane', "Kadane's algorithm", True),
    (55, 'greedy', 'Greedy reach', True),
    (45, 'greedy', 'Greedy reach in layers', False),
    (134, 'greedy', 'Greedy (reset the start)', False),
    (846, 'greedy', 'Greedy + sorted counts', False),
    (1899, 'greedy', 'Greedy filter', False),
    (763, 'greedy', 'Last occurrence + greedy cut', False),
    (678, 'greedy', 'Greedy range of open counts', False),
    # Intervals
    (57, 'intervals', 'Insert and merge', True),
    (56, 'intervals', 'Sort + merge', True),
    (435, 'intervals', 'Greedy by end time', True),
    (252, 'intervals', 'Sort + overlap check', True),
    (253, 'intervals', 'Sweep line or min-heap', True),
    (1851, 'intervals', 'Sort + heap (offline queries)', False),
    # Math & geometry
    (48, 'matrix', 'Transpose + reverse', True),
    (54, 'matrix', 'Layer-by-layer traversal', True),
    (73, 'matrix', 'Markers in the first row and column', True),
    (202, 'math', 'Cycle detection (fast & slow)', False),
    (66, 'math', 'Carry propagation', False),
    (50, 'math', 'Fast exponentiation', False),
    (43, 'math', 'Grade-school multiplication', False),
    (2013, 'math', 'Hash map of points', False),
    # Bit manipulation
    (136, 'bits', 'XOR cancels pairs', False),
    (191, 'bits', 'Bit counting', True),
    (338, 'bits', 'DP on bits', True),
    (190, 'bits', 'Bit reversal', True),
    (268, 'bits', 'XOR or the Gauss sum', True),
    (371, 'bits', 'Bitwise addition', True),
    (7, 'bits', 'Digit reversal with overflow check', False),
]

# Anchors from the brief that NeetCode 150 does not include, then topic practice-set additions.
EXTRA = [
    (496, 'monotonic', 'Monotonic stack (next greater)'),
    (503, 'monotonic', 'Monotonic stack (circular)'),
    (307, 'segment-tree', 'Segment tree or Fenwick (point update)'),
    (315, 'fenwick', 'Fenwick tree or merge-sort counting'),
    (547, 'union-find', 'Union-find or DFS components'),
    (721, 'union-find', 'Union-find on shared emails'),
    # Topic practice sets beyond NeetCode 150 (sliding window, 2026-10-02)
    (643, 'sliding-window', 'Fixed window + running sum'),
    (219, 'sliding-window', 'Fixed window + set'),
    (1456, 'sliding-window', 'Fixed window + running count'),
    (209, 'sliding-window', 'Variable window (shortest valid)'),
    (1004, 'sliding-window', 'Variable window + budget'),
    (904, 'sliding-window', 'Variable window + counts (at most 2 kinds)'),
    (438, 'sliding-window', 'Fixed window + counts'),
    (713, 'sliding-window', 'Variable window (count windows)'),
    (1838, 'sliding-window', 'Sort + variable window'),
    (992, 'sliding-window', 'At most K minus at most K-1'),
]

ANCHORS = [1, 49, 128, 217, 238, 242, 347, 36, 11, 15, 42, 125, 167, 3, 76, 121, 239, 424, 567, 20, 84, 150, 155, 739, 853, 496, 503,
           4, 33, 74, 153, 704, 875, 981, 2, 19, 21, 23, 25, 138, 141, 143, 146, 206, 287, 98, 100, 102, 104, 105, 110, 124, 199, 226, 230,
           235, 297, 543, 572, 1448, 208, 211, 212, 215, 295, 355, 621, 703, 973, 1046, 17, 39, 40, 46, 51, 78, 79, 90, 131, 127, 130, 133,
           200, 207, 210, 417, 684, 695, 994, 332, 743, 778, 787, 1584, 5, 10, 62, 70, 72, 91, 97, 115, 139, 152, 198, 213, 300, 309, 312,
           322, 329, 416, 494, 518, 647, 746, 1143, 45, 53, 55, 134, 678, 763, 846, 1899, 56, 57, 435, 1851, 43, 48, 50, 54, 66, 73, 202,
           2013, 7, 136, 190, 191, 268, 338, 371, 307, 315, 547, 721]


def main():
    index = {p['id']: p for p in json.load(open(os.path.join(ROOT, 'tools', 'lc-index.json'), encoding='utf-8'))}
    curriculum = open(os.path.join(ROOT, 'data', 'curriculum.js'), encoding='utf-8').read()
    errors, out, seen = [], [], set()
    rows = [(lc, t, p, b, True) for lc, t, p, b in NC150] + [(lc, t, p, False, False) for lc, t, p in EXTRA]
    # Per-topic practice additions: tools/extra-problems/<topic-id>.json = [[lc, "pattern note"], ...]
    for f in sorted(glob.glob(os.path.join(ROOT, 'tools', 'extra-problems', '*.json'))):
        t = os.path.splitext(os.path.basename(f))[0]
        rows += [(lc, t, pat, False, False) for lc, pat in json.load(open(f, encoding='utf-8'))]
    for lc, topic, pattern, blind, nc in rows:
        if lc in seen: errors.append(f'{lc}: listed twice')
        seen.add(lc)
        if lc not in index: errors.append(f'{lc}: not in the LeetCode index'); continue
        if f"id: '{topic}'" not in curriculum: errors.append(f'{lc}: unknown topic {topic}')
        p = index[lc]
        lists = (['nc150'] if nc else []) + (['blind75'] if blind else [])
        out.append({'lc': lc, 'title': p['title'], 'slug': p['slug'], 'difficulty': p['diff'], 'premium': p['paid'],
                    'topic': topic, 'pattern': pattern, 'lists': lists})
    if len(NC150) != 150: errors.append(f'NeetCode 150 has {len(NC150)} entries, expected 150')
    blind = sum(1 for r in NC150 if r[3])
    if blind != 75: errors.append(f'Blind 75 has {blind} entries, expected 75')
    missing = sorted(set(ANCHORS) - seen)
    if missing: errors.append(f'anchors missing: {missing}')
    if errors:
        print('\n'.join(errors)); sys.exit(1)

    body = ',\n'.join('    ' + json.dumps(p, ensure_ascii=False) for p in out)
    js = ('/* Offer Ready: problem bank (NeetCode 150 + anchor problems).\n'
          '   GENERATED by tools/build-problems.py from tools/lc-index.json. Edit the generator, not this file. */\n'
          '(function () {\n  var OR = (window.OR = window.OR || {});\n  (OR.problems = OR.problems || []).push(\n' + body + '\n  );\n})();\n')
    open(os.path.join(ROOT, 'data', 'problems.js'), 'w', encoding='utf-8', newline='\n').write(js)
    if '--list' in sys.argv:
        for p in out: print(f"{p['lc']:>5}  {p['difficulty']:<6} {'P' if p['premium'] else ' '} {p['title']}  [{p['topic']}]")
    print(f'wrote {len(out)} problems ({blind} Blind 75, {len(rows) - 150} beyond NeetCode 150)')


if __name__ == '__main__':
    main()
