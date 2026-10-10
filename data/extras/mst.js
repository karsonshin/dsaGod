(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['mst'] = {
    primer: {
      kind: 'technique',
      what: `A **minimum spanning tree** (MST) of a weighted, undirected graph is the cheapest set of edges that links every node together. It always has exactly n - 1 edges and no cycle (a cycle is a loop of edges that returns to where it started). Think of laying cable between towns so everyone is connected using the least total cable.`,
      does: `It solves "connect everything at the smallest total cost". Kruskal runs in O(E log E), dominated by sorting the edges; Prim with a heap runs in O(E log V), and an array version of Prim runs in O(V²), best for dense graphs. The same machinery also counts components and finds bottleneck paths.`,
      impl: `**Kruskal** sorts edges by weight and uses union-find (a \`parent\` list with a \`find\` function) to skip any edge whose two ends are already connected. **Prim** grows one tree from a start node, keeping a min-heap (\`heapq\`) of edges that leave the tree. In Python: \`sorted(edges, key=...)\`, a plain list for \`parent\`, and \`heapq.heappush\` / \`heappop\`.`,
      possibilities: `Cheapest cable or road network, connecting points on a plane (Min Cost to Connect All Points), counting spare cables or components, "minimum effort" bottleneck routes through a grid, clustering by stopping early, and Hard questions asking which edges every cheapest network must contain.`
    },

    think: [
      {
        q: `A triangle has edges A-B = 2, B-C = 2 and A-C = 3. Which two edges does Kruskal keep, and what is the total? What is the cheapest route from A to C?`,
        a: `Sorted order is 2, 2, 3. Take A-B (join A and B), take B-C (join in C), then A-C is skipped because A and C are already in one group. Total 4. The cheapest *route* from A to C is the direct edge of weight 3, not 2 + 2 = 4. The aha: an MST minimises the total of all links, a shortest path minimises one trip, and they can pick different edges.`
      },
      {
        q: `Kruskal finishes on a graph of 6 nodes having kept only 3 edges. What does that tell you, and how many separate groups are there?`,
        a: `A connected graph on 6 nodes needs 5 tree edges. Each kept edge merges two groups, so groups = 6 - 3 = 3. The graph is not connected: you got a spanning *forest* (one tree per component). The aha: you never need a separate component-counting pass, because the count of groups left is already the answer.`
      },
      {
        q: `A 4-node ring has every edge weight 1. How many different minimum spanning trees are there, and is the total the same in each?`,
        a: `A spanning tree needs 3 of the 4 edges, and dropping any single edge leaves a valid tree, so there are 4 different MSTs. Every one has total 3. The aha: ties make the *edges* non-unique but the *total* unique. That is why problems either ask only for the total, or give a tie-breaking rule.`
      },
      {
        q: `Edges 1-2 = 1, 2-3 = 2 and 1-3 = 5 form a triangle. Without running any algorithm, which edge is never needed, and why?`,
        a: `The edge 1-3 with weight 5. It is the heaviest edge on the cycle 1-2-3, and nodes 1 and 3 are already linked through 2 for a cost of 1 + 2. This is the cycle property: the heaviest edge on any cycle can be dropped without disconnecting anyone, so a cheapest network leaves it out.`
      },
      {
        q: `You must connect 1000 points on a plane, with the cost of a link being the distance between its ends. Why is "build all edges and run Kruskal" a poor idea, and what is better?`,
        a: `Every pair is an edge, so there are about 500,000 edges. Building and sorting them costs O(n² log n) time and O(n²) memory. Array Prim keeps, for each outside point, the distance to the nearest point already in the tree, and needs only O(n²) time and O(n) memory with no edge list at all. The aha: for a *dense* graph, skipping the sort wins.`
      },
      {
        q: `Does Kruskal still work if some edge weights are negative? What if you add 100 to every weight?`,
        a: `Yes to both. Kruskal only compares weights, so negatives are fine (this is where it differs from Dijkstra). Adding the same constant to every edge adds 100 * (n - 1) to every spanning tree, because each has exactly n - 1 edges, so the ranking of trees does not change. The sorted order is unchanged, so the same edges are chosen.`
      }
    ],

    breakdown: [
      {
        title: `1. The problem, and why the answer is a tree`,
        body: `Five offices need network cables, and each possible cable has a price. You need every office reachable from every other at the lowest total price. If the chosen cables ever form a loop (A-B, B-C, C-A), one of them is wasted, because removing it still leaves everyone connected. So the best answer has no loop. A connected graph with no loop on n nodes always has exactly n - 1 edges: with 5 offices, 4 cables. That already tells you the final check: after you finish, you should have kept n - 1 edges, or the graph was never fully connectable.`
      },
      {
        title: `2. The safe move: the cheapest edge across any divide`,
        body: `Split the nodes into two non-empty groups anywhere you like. Some cable has to cross the divide, and the cheapest crossing cable is always safe to keep. Why? If a best network skipped it, adding it would close a loop through some other crossing cable, and that other cable is at least as expensive, so you can swap it out without paying more. This single rule is the whole reason greedy works here. Both algorithms are just two ways of choosing which divide to look at. Kruskal looks at the divide around the group one edge belongs to; Prim looks at "tree so far" against "everything else".`
      },
      {
        title: `3. Kruskal traced on a 5-node graph`,
        body: `Edges as (u, v, weight): (0,2,1) (1,2,2) (3,4,2) (0,1,4) (1,3,5) (2,3,8) (2,4,10). They are already sorted. Groups start as {0} {1} {2} {3} {4}.\n\n- (0,2,1): different groups, take it. Groups {0,2} {1} {3} {4}. Total 1.\n- (1,2,2): take. {0,1,2} {3} {4}. Total 3.\n- (3,4,2): take. {0,1,2} {3,4}. Total 5.\n- (0,1,4): 0 and 1 are in the same group, so skip (it would close a loop).\n- (1,3,5): take. One group. Total 10.\n\nWe kept 4 = n - 1 edges, so it is a spanning tree with total 10. The remaining edges are skipped without even needing to be examined deeply.`
      },
      {
        title: `4. Union-find is the "are they already joined?" question`,
        body: `Kruskal asks one question per edge: are these two ends already connected through edges I kept? Re-searching the graph each time would be slow. Union-find answers it in almost constant time. Keep \`parent[x]\`, a pointer from each node toward its group's leader. \`find(x)\` follows pointers to the leader; two nodes are in the same group exactly when their leaders match. To merge, point one leader at the other: \`parent[ru] = rv\`. Note you set the *leader's* pointer, not the node's own, otherwise you abandon the rest of its group. Path halving (\`parent[x] = parent[parent[x]]\`) keeps the chains short.`,
        code: { py: `def find(parent, x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # point at the grandparent: chains stay short
        x = parent[x]
    return x

parent = list(range(5))
ru, rv = find(parent, 0), find(parent, 2)
if ru != rv:
    parent[ru] = rv                     # merge the two groups` }
      },
      {
        title: `5. Prim traced on the same graph`,
        body: `Prim grows one tree. Start at node 0 and put (weight, node) entries for edges leaving the tree in a min-heap. Heap: (0,0). Pop (0,0): node 0 joins, total 0, push (4,1) and (1,2). Pop (1,2): node 2 joins, total 1, push (2,1), (8,3), (10,4). Pop (2,1): node 1 joins, total 3, push (5,3). Pop (4,1): node 1 is already in, so this entry is stale; skip. Pop (5,3): node 3 joins, total 8, push (2,4). Pop (2,4): node 4 joins, total 10. All 5 nodes are in. Same total, 10, found by a different order of decisions.`
      },
      {
        title: `6. Dense graphs: Prim without a heap`,
        body: `When every pair of points is an edge (points on a plane), a heap holds up to n² entries. Instead keep \`dist[v]\`, the cheapest known link from the tree to each outside node, starting at infinity (0 for the start node). Repeat n times: scan for the outside node with the smallest \`dist\`, add it to the tree and to the total, then for every other outside node compare its \`dist\` with its distance to the newly added node and keep the smaller. Each round is O(n), so the whole thing is O(n²) time and O(n) space, with no sorting and no edge list.`
      },
      {
        title: `7. Forests, bottlenecks and the interview checklist`,
        body: `If the graph is not connected, Kruskal ends with several groups: that is a minimum spanning *forest*, and \`n - kept\` is the number of components. If you stop Kruskal the moment two chosen nodes S and T share a group, the weight of the edge just added is the smallest possible "largest edge on a path from S to T": a bottleneck. Edge cases: one node (total 0), disconnected graph, duplicate weights, negative weights (fine). Spot an MST by wording like "connect all", "minimum total cost", "fewest extra cables", "minimum effort to reach". Say the cost: Kruskal O(E log E), Prim O(E log V) or O(V²).`
      }
    ],

    drills: [
      {
        title: `Cheapest network`,
        q: `There are n offices numbered 0 to n-1 and a list of possible cables \`[a, b, price]\` (each can be used in both directions). Return the smallest total price that connects every office, or -1 if it cannot be done.\n\nExample: n = 4, cables \`[[0,1,3],[1,2,1],[0,2,2],[2,3,4]]\` returns \`7\` (take 1, 2 and 4).`,
        hint: `Sort by price and skip a cable if its two ends are already connected. Count how many you kept.`,
        how: `I restate it: pick cables so every office can reach every other, with the smallest total price, or say it is impossible. Brute force tries every subset of n - 1 cables and tests connectivity, which is exponential in the number of cables. The observation that unlocks it: the cheapest cable that joins two not-yet-connected groups is always safe to keep, and a cable that joins two already-connected offices is only a loop, so it is wasted. That is Kruskal. The structure I need is union-find to answer "are these two already connected?" quickly. Trace on the example: sorted prices are 1 (1-2), 2 (0-2), 3 (0-1), 4 (2-3). Take 1-2, groups {1,2}. Take 0-2, groups {0,1,2}, total 3. The 3 cable joins 0 and 1, which are already together, so skip. Take 2-3, total 7, and we kept 3 = n - 1 cables. Edge cases: n = 1 needs no cables, so the answer is 0 (kept = 0 = n - 1); if fewer than n - 1 cables get kept the graph is disconnected, so return -1. Cost: sorting dominates, O(E log E) time, and O(n) space for the parent list.`,
        code: { py: `def cheapest_network(n, cables):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = kept = 0
    for a, b, price in sorted(cables, key=lambda c: c[2]):
        ra, rb = find(a), find(b)
        if ra != rb:                 # joins two separate groups: keep it
            parent[ra] = rb
            total += price
            kept += 1
    return total if kept == n - 1 else -1` },
        explain: `Each kept cable merges two groups, so a connected result needs exactly n - 1 of them. Taking the cheapest cable across any divide is safe (cut property), and a cable inside one group would only create a loop. Sorting costs O(E log E); the union-find work is nearly constant per edge. Space O(n).`,
        check: `assert cheapest_network(4, [[0,1,3],[1,2,1],[0,2,2],[2,3,4]]) == 7
assert cheapest_network(1, []) == 0
assert cheapest_network(3, [[0,1,5]]) == -1
assert cheapest_network(2, [[0,1,9],[0,1,4]]) == 4
assert cheapest_network(3, [[0,1,-2],[1,2,-3],[0,2,1]]) == -5
import random, itertools
def brute(n, es):
    best = None
    for combo in itertools.combinations(es, n - 1):
        p = list(range(n))
        def f(x):
            while p[x] != x:
                x = p[x]
            return x
        ok = True
        for a, b, w in combo:
            ra, rb = f(a), f(b)
            if ra == rb:
                ok = False
                break
            p[ra] = rb
        if ok:
            t = sum(w for a, b, w in combo)
            if best is None or t < best:
                best = t
    return -1 if best is None else best
for _ in range(200):
    n = random.randint(1, 5)
    es = [[random.randrange(n), random.randrange(n), random.randint(1, 9)] for _ in range(random.randint(0, 7))]
    es = [e for e in es if e[0] != e[1]]
    assert cheapest_network(n, es) == brute(n, es)`
      },
      {
        title: `Cables to move`,
        q: `A data centre has n computers numbered 0 to n-1 and a list of cables \`[a, b]\`, each already plugged in between two computers. You may unplug any cable and plug it between any two computers. Return the smallest number of such moves needed to make every computer reachable from every other, or -1 if there are not enough cables.\n\nExample: n = 5, cables \`[[0,1],[1,2],[0,2],[3,4]]\` returns \`1\` (move the spare cable 0-2 to link the two groups).`,
        hint: `A connected network needs n - 1 cables. Count the groups of already-connected computers.`,
        how: `I restate it: I want everything connected, and I can re-plug existing cables, never buy new ones. So the first question is whether there are enough cables at all: a connected network on n computers needs at least n - 1, so with fewer I return -1 immediately. Brute force would try moving cables around, which is a mess. The observation: the current cables already form some groups (components). To join g groups into one I need g - 1 new links, and each move supplies exactly one. Are there enough *spare* cables to move? A cable is spare when it closes a loop inside a group, and since total cables are at least n - 1, there are at least g - 1 spare ones (a forest across n computers with g groups has n - g useful cables, so everything beyond that is spare, at least (n - 1) - (n - g) = g - 1). So the answer is g - 1. To count groups I use union-find: start with n groups, subtract one each time a cable merges two. Trace: n = 5, edges 0-1, 1-2 merge (3 groups left: {0,1,2},{3},{4}), 0-2 is a loop, 3-4 merges (2 groups). Answer 2 - 1 = 1. Edge cases: no cables with n = 1 gives 0; n = 4 with 2 cables gives -1. Cost: O(E α(n)) time, O(n) space.`,
        code: { py: `def moves_to_connect(n, cables):
    if len(cables) < n - 1:
        return -1                       # not enough cables to ever connect n computers
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    groups = n
    for a, b in cables:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            groups -= 1
    return groups - 1` },
        explain: `With at least n - 1 cables, the cables that merge groups number n - groups, so the spare ones number len(cables) - (n - groups) >= groups - 1. Each move joins two groups using one spare cable, so groups - 1 moves are both necessary and sufficient. Time O(E α(n)), space O(n).`,
        check: `assert moves_to_connect(5, [[0,1],[1,2],[0,2],[3,4]]) == 1
assert moves_to_connect(1, []) == 0
assert moves_to_connect(4, [[0,1],[0,2]]) == -1
assert moves_to_connect(3, [[0,1],[1,2]]) == 0
assert moves_to_connect(6, [[0,1],[0,2],[0,3],[1,2],[1,3]]) == 2
assert moves_to_connect(2, []) == -1
import random
def comps(n, es):
    seen = [False] * n
    c = 0
    for s in range(n):
        if not seen[s]:
            c += 1
            stack = [s]
            seen[s] = True
            while stack:
                u = stack.pop()
                for a, b in es:
                    for x, y in ((a, b), (b, a)):
                        if x == u and not seen[y]:
                            seen[y] = True
                            stack.append(y)
    return c
for _ in range(200):
    n = random.randint(1, 7)
    es = []
    if n > 1:
        for _ in range(random.randint(0, 9)):
            a, b = random.sample(range(n), 2)
            es.append([a, b])
    exp = -1 if len(es) < n - 1 else comps(n, es) - 1
    assert moves_to_connect(n, es) == exp`
      },
      {
        title: `Smallest worst hop`,
        q: `A road network has n towns and a list of roads \`[a, b, length]\` (two-way). A trip's *hardness* is the length of the longest single road on it. Return the smallest possible hardness over all trips from town s to town t, or -1 if t cannot be reached from s. If s equals t the answer is 0.\n\nExample: n = 4, roads \`[[0,1,5],[1,3,2],[0,2,3],[2,3,4]]\`, s = 0, t = 3 returns \`4\` (route 0-2-3 has longest road 4; route 0-1-3 has 5).`,
        hint: `Add roads from shortest to longest. When s and t first become connected, which road did you just add?`,
        how: `I restate it: among all routes from s to t, pick the one whose single worst road is as short as possible, and report that road's length. Brute force lists every route and takes the best, exponential. A second idea: binary search a threshold L and check whether s reaches t using only roads of length at most L. That works and costs a log factor, but it points at something simpler. If the roads are added in increasing order of length, then the first moment s and t become connected, the road I just added is the longest road on a connecting route, and no route can have a smaller longest road (otherwise s and t would have been connected earlier). That is exactly Kruskal run until s and t share a group, and it is why the best bottleneck route always lies on the minimum spanning tree. Union-find answers "connected yet?". Trace: sorted roads 2 (1-3), 3 (0-2), 4 (2-3), 5 (0-1). Add 1-3, add 0-2, still two groups {1,3} and {0,2}. Add 2-3 (length 4): now 0 and 3 share a group, return 4. Edge cases: s == t returns 0 before reading any road; unreachable returns -1. Cost: O(E log E) for the sort, O(n) space.`,
        code: { py: `def smallest_worst_hop(n, roads, s, t):
    if s == t:
        return 0
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b, length in sorted(roads, key=lambda r: r[2]):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            if find(s) == find(t):       # this road just completed a route
                return length
    return -1` },
        explain: `Roads are added shortest first, so when s and t first connect, every route inside the structure uses roads no longer than the one just added, and no connection existed with all roads shorter. The answer is that road's length. Sorting O(E log E), union-find near-constant per road, space O(n).`,
        check: `assert smallest_worst_hop(4, [[0,1,5],[1,3,2],[0,2,3],[2,3,4]], 0, 3) == 4
assert smallest_worst_hop(3, [[0,1,1]], 0, 2) == -1
assert smallest_worst_hop(1, [], 0, 0) == 0
assert smallest_worst_hop(2, [[0,1,7],[0,1,3]], 0, 1) == 3
assert smallest_worst_hop(3, [[0,1,2],[1,2,2]], 0, 2) == 2
import random
def brute(n, roads, s, t):
    if s == t:
        return 0
    for L in sorted(set(r[2] for r in roads)):
        seen = {s}
        stack = [s]
        while stack:
            u = stack.pop()
            for a, b, w in roads:
                if w <= L:
                    for x, y in ((a, b), (b, a)):
                        if x == u and y not in seen:
                            seen.add(y)
                            stack.append(y)
        if t in seen:
            return L
    return -1
for _ in range(200):
    n = random.randint(1, 6)
    roads = []
    if n > 1:
        for _ in range(random.randint(0, 8)):
            a, b = random.sample(range(n), 2)
            roads.append([a, b, random.randint(1, 9)])
    s, t = random.randrange(n), random.randrange(n)
    assert smallest_worst_hop(n, roads, s, t) == brute(n, roads, s, t)`
      },
      {
        title: `Widest gap clusters`,
        q: `You have n items and a distance for every pair, given as a list of \`[a, b, distance]\` (all n(n-1)/2 pairs appear exactly once). Split the items into exactly k non-empty groups so that the smallest distance between two items in *different* groups is as large as possible. Return that largest-possible smallest gap.\n\nExample: n = 4, distances \`[[0,1,1],[2,3,2],[0,2,6],[0,3,7],[1,2,5],[1,3,8]]\`, k = 2 returns \`5\` (groups {0,1} and {2,3}).`,
        hint: `Run Kruskal, but stop merging when only k groups remain. Which edge is the first one you meet after that?`,
        how: `I restate it: cut the items into k clusters so that the closest pair across two clusters is still as far apart as possible. Brute force tries every way of labelling items with k labels, which is k to the power n. The observation: if two items are closer than the gap I am hoping for, they have to sit in the same cluster. So process pairs from closest to farthest and glue them together (union-find), exactly like Kruskal. As soon as only k groups are left, the groups are forced: any closer pair was already glued. The next pair that would join two *different* groups is the smallest cross-group distance, and that is the answer. Why can it not be larger? Any split into k groups must separate items that Kruskal had glued together, or it matches ours. If it separated a glued pair, that pair's distance (smaller than our answer) would become a cross-group distance and make the gap smaller. Trace on the example: sorted distances 1 (0-1), 2 (2-3), 5 (1-2), ... Start with 4 groups. Take 1: 3 groups. Take 2: 2 groups = k. The next edge joining different groups is 5 (1-2). Answer 5. Edge cases: k = n returns the smallest distance overall; k = 1 is not allowed (no cross gap). Cost: O(E log E), where E is n² / 2.`,
        code: { py: `def widest_gap(n, dists, k):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    groups = n
    for a, b, d in sorted(dists, key=lambda e: e[2]):
        ra, rb = find(a), find(b)
        if ra == rb:
            continue                     # already glued together
        if groups == k:
            return d                     # first pair that would cross two final groups
        parent[ra] = rb
        groups -= 1
    return -1` },
        explain: `Merging closest pairs first is Kruskal. When k groups remain, the next edge between two different groups is the cheapest edge leaving any group, so it is the smallest cross-group distance of this partition. Any other partition into k groups must either split a glued pair (smaller gap) or equal this partition. O(E log E) time, O(n) space.`,
        check: `assert widest_gap(4, [[0,1,1],[2,3,2],[0,2,6],[0,3,7],[1,2,5],[1,3,8]], 2) == 5
assert widest_gap(3, [[0,1,4],[0,2,2],[1,2,9]], 3) == 2
assert widest_gap(2, [[0,1,7]], 2) == 7
import random, itertools
def brute(n, ds, k):
    best = -1
    for lab in itertools.product(range(k), repeat=n):
        if len(set(lab)) != k:
            continue
        g = min(d for a, b, d in ds if lab[a] != lab[b])
        best = max(best, g)
    return best
for _ in range(150):
    n = random.randint(2, 6)
    k = random.randint(2, n)
    ds = [[a, b, random.randint(1, 20)] for a in range(n) for b in range(a + 1, n)]
    assert widest_gap(n, ds, k) == brute(n, ds, k)`
      }
    ],

    how: {
      1584: `I restate it: given points on a plane, link them so everything is connected with the least total Manhattan distance, no redundant links. "Connect everything, minimum total, no extra links" is the minimum spanning tree. Brute force tries every set of n - 1 links out of n(n - 1)/2, which is exponential. Kruskal works but must create all n(n - 1)/2 edges and sort them: O(n² log n) time and O(n²) memory, wasteful because the graph is complete and dense. So I use Prim's array form. Keep \`dist[i]\`, the cheapest known link from the tree to point i, starting at infinity with \`dist[0] = 0\`. Repeat n times: pick the unused point with the smallest \`dist\`, add its \`dist\` to the total, mark it used, then for every other unused point compare its \`dist\` with its Manhattan distance to the new point and keep the smaller. Trace on (0,0), (2,2), (5,2), (7,0): take (0,0) at 0; distances 4, 7, 7. Take (2,2) at 4; (5,2) improves to 3, (7,0) stays 7. Take (5,2) at 3; (7,0) improves to 4. Take (7,0) at 4. Total 11. Edge cases: one point gives 0; duplicate points cost 0. Cost: O(n²) time, O(n) space, no heap and no edge list.`,
      1489: `I restate it: among all minimum spanning trees, report edges that appear in every one (critical) and edges that appear in some but not all (pseudo-critical). Brute force enumerates all spanning trees, exponential. First I compute the MST weight \`base\` with Kruskal. Then I judge each edge on its own with two experiments, each a full Kruskal pass over the pre-sorted edge order with a fresh union-find. Experiment one: ban the edge. If the total rises above \`base\`, or the graph can no longer be connected, then no cheapest tree can avoid it, so it is critical. Experiment two, only for edges not critical: force the edge in first, then finish with Kruskal. If the total still equals \`base\`, some cheapest tree uses it, so it is pseudo-critical. An edge that is neither is the heaviest on some cycle and is never used. The order matters: a critical edge would also pass experiment two, so I test critical first and use an \`elif\`. Trace on a 4-cycle of weight-1 edges: banning any edge leaves total 3 (equal), so none are critical; forcing any edge in still gives 3, so all four are pseudo-critical. Cost: up to 2E Kruskal passes of O(E α), so O(E²), fine for the small limits.`,
      1579: `I restate it: two people, Alice and Bob, each need to be able to travel between all n nodes. Cables have type 1 (Alice only), 2 (Bob only) or 3 (both). I want to remove as many cables as possible while keeping both able to reach everything, or say -1. Removing the most equals keeping the fewest, so each person needs a spanning tree and I want to reuse cables where I can. Brute force tries subsets of cables, exponential. The key observation: a type 3 cable serves both people at once, so it is always worth taking before any single-person cable. I keep two union-finds, one for Alice and one for Bob. First pass: for every type 3 cable, if it merges two groups for Alice, it merges the same groups for Bob (they are identical so far), so count it as used and merge in both. Second pass: type 1 cables merge in Alice's structure, type 2 in Bob's, counting each that actually merges two groups. Anything that never merged anything is redundant. At the end, if Alice or Bob still has more than one group, return -1. Otherwise the answer is total cables minus used. Edge case: only type 3 cables forming a tree means everything else is removable. Cost: O(m α(n)), O(n) space.`,
      1631: `I restate it: a grid of heights; I walk from the top-left to the bottom-right, moving up, down, left or right. A route's effort is the largest height difference between two consecutive cells on it. I want the route with the smallest effort. Brute force tries every path, exponential. The cost of a route is a *maximum*, not a sum, which tells me this is a bottleneck problem rather than a plain shortest path. Think of each pair of neighbouring cells as an edge weighted by their height difference. The best route's cost is the smallest weight W such that, using only edges of weight at most W, the two corners are connected. So I sort all the edges by weight and union them one by one with union-find; the moment the start and finish share a group, the weight of the edge I just added is the answer. This is Kruskal stopped early, and the best bottleneck route always lies on the MST. Trace on [[1,2],[3,4]], cells numbered 0..3 row by row: the edges are 0-1 (1), 2-3 (1), 0-2 (2) and 1-3 (2). Add 0-1 and 2-3 (weight 1): the corners 0 and 3 are still in different groups. Add 0-2 (weight 2): everything joins, so the answer is 2. Edge case: a single cell returns 0 immediately. Cost: about 2RC edges, so O(RC log RC); Dijkstra with a max rule is the same order.`
    }
  };
})();
