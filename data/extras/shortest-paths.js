/* Offer Ready: extra lesson material for shortest paths (primer, think, breakdown, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  var J = function (a) { return a.join('\n'); };
  OR.extras['shortest-paths'] = {
    primer: {
      kind: 'technique',
      what: '**Shortest paths** finds the cheapest route between nodes of a weighted graph, like a satnav choosing the fastest roads when every road has its own travel time. "Cheapest" can mean distance, time, price or effort, and the cost is a number written on each edge.',
      does: 'It answers "cheapest way from here to there (or to everywhere)". Pick by the edges: equal costs use BFS, O(V + E); non-negative costs use **Dijkstra**, O((V + E) log V); negative costs or a limit on the number of edges use **Bellman-Ford**, O(V·E); every pair on a small graph uses **Floyd-Warshall**, O(V³).',
      impl: 'Dijkstra keeps a `dist` list (infinity at first) and a **min-heap** (`heapq`) of `(distance, node)` pairs. Pop the smallest; skip it if it is stale (worse than `dist`); otherwise **relax** each edge: if `d + w < dist[v]`, update and push. Graph as a list of `(neighbour, weight)` lists. For 0/1 weights a `deque` replaces the heap.',
      possibilities: 'Network delay time, cheapest flights with at most k stops, minimum-effort and rising-water grids (cost is the worst step), highest-probability path, the city that reaches the fewest others within a limit, and 0/1 grid problems such as removing the fewest obstacles.'
    },

    think: [
      {
        q: 'Undirected roads: A-B costs 4, A-C costs 1, C-B costs 2. Run Dijkstra from A by hand. What is the distance to B, and in what order do entries leave the heap?',
        a: 'Start with (0, A). Popping A pushes (4, B) and (1, C). Pop (1, C): relaxing C-B gives 1 + 2 = 3 < 4, so record dist[B] = 3 and push (3, B). Pop (3, B): final. Later the old (4, B) comes out, sees that 4 > dist[B] = 3, and is skipped as **stale**. The distance to B is **3**, not the direct 4. The aha: the heap is never edited, you just let obsolete entries come out and throw them away.'
      },
      {
        q: 'A to D directly costs 10. A to B, B to C, C to D cost 1 each. BFS says the shortest route to D is one edge. Why is that wrong, and what do you use?',
        a: 'BFS minimises the **number of edges**, not the total cost. The direct edge is one edge but costs 10; the three-edge route costs 3. Whenever edge costs differ, the first arrival is not necessarily the cheapest, so you need Dijkstra: always expand the cheapest unfinished node, so the first time a node is popped its cost is final. BFS is correct only when all edges cost the same.'
      },
      {
        q: 'Edges: A to B costs 2, A to C costs 5, C to B costs -4, B to D costs 1. Dijkstra pops B first (distance 2) and treats it as final. What goes wrong?',
        a: 'Popping B settles it at 2 and sets D to 3. Then C is popped at 5, and relaxing C to B gives 5 - 4 = 1, better than 2. B was not final after all, and the true distance to D is 1 + 1 = 2, not 3. Dijkstra assumes a longer route can only get longer; a negative edge can pull the cost back down. With negative edges use Bellman-Ford (and a negative **cycle** means no shortest path exists at all).'
      },
      {
        q: 'Why do we skip stale entries with "if d > dist[u]: continue" instead of checking for duplicates when we push?',
        a: 'At push time you cannot know that a better route will turn up later, and the heap cannot delete or edit an entry in the middle. So the same node may sit in the heap several times with different distances. When an entry comes out whose d is greater than the best known dist[u], it is outdated and its edges were already handled by the better entry. Skipping it keeps total work at O(E log V); without the check the same node is re-scanned many times.'
      },
      {
        q: 'Choose the algorithm: (a) every edge costs 1; (b) every edge costs 0 or 1; (c) costs differ but are non-negative; (d) some costs are negative; (e) you need all pairs on 300 nodes; (f) cheapest route using at most 3 edges.',
        a: '(a) BFS. (b) 0-1 BFS with a deque: free edge to the front, paid edge to the back. (c) Dijkstra with a heap. (d) Bellman-Ford. (e) Floyd-Warshall, O(V³) = 27 million steps, fine. (f) Bellman-Ford run for exactly 3 rounds (round r allows r edges), or Dijkstra with the number of edges used in the state. The question to ask first is always "what are the edge costs like".'
      },
      {
        q: 'In Bellman-Ford with a limit of 1 edge, edges 0 to 1 and 1 to 2 both cost 1 from source 0. If you update distances in place while looping over edges in the order given, what do you get for node 2? What should it be?',
        a: 'In place, the first edge sets dist[1] = 1, and then the second edge immediately uses that new value and sets dist[2] = 2, even though that path uses **two** edges. With a limit of 1 edge, node 2 must stay unreachable. The fix is to read from last-round values and write into a copy, so each round extends paths by exactly one edge.'
      }
    ],

    breakdown: [
      {
        title: '1. Raw idea: light a fuse at the start',
        body: J([
          'Picture fire racing from the start along every road at the same speed; a road costing 9 takes 9 seconds. The first moment the flame touches a town is the shortest distance to it, because anything else would have arrived later. We will use one graph (roads work both ways) for the whole lesson:',
          '```',
          '0-1: 4    0-2: 1    2-1: 2',
          '1-3: 1    2-3: 5    3-4: 3',
          '```',
          'BFS fails here because it counts roads, not seconds. We need to always expand the **closest unfinished** town. In an interview you spot it when each road has a price, time or distance.'
        ])
      },
      {
        title: '2. State to keep: dist and a heap',
        body: J([
          '`dist[v]` is the best distance found so far to v: 0 for the start, infinity for the rest. The heap holds `(distance, node)` pairs, smallest first, so "closest unfinished town" is always on top.',
          '```',
          'dist = [0, inf, inf, inf, inf]',
          'heap = [(0, 0)]',
          '```',
          'Adjacency list (each road stored in both directions):',
          '```',
          '0: [(1,4), (2,1)]      1: [(0,4), (2,2), (3,1)]',
          '2: [(0,1), (1,2), (3,5)]   3: [(1,1), (2,5), (4,3)]   4: [(3,3)]',
          '```',
          'Nodes with no route keep infinity; report that as -1 or "unreachable" as the problem asks.'
        ])
      },
      {
        title: '3. The loop traced: pop, skip stale, relax',
        body: J([
          'Pop the smallest pair `(d, u)`. If `d > dist[u]` it is stale, skip it. Otherwise **relax** each road `u-v` of cost `w`: if `d + w < dist[v]`, update and push.',
          '```',
          'pop (0,0): 1 -> 4, 2 -> 1         dist [0,4,1,inf,inf]',
          'pop (1,2): 1 -> 3, 3 -> 6         dist [0,3,1,6,inf]',
          'pop (3,1): 3 -> 4                 dist [0,3,1,4,inf]',
          'pop (4,1): stale (4 > 3), skip',
          'pop (4,3): 4 -> 7                 dist [0,3,1,4,7]',
          'pop (6,3): stale, skip',
          'pop (7,4): nothing to improve',
          '```',
          'Distances: **0, 3, 1, 4, 7**. Note 1 is reached at 3 through town 2, not at 4 directly. Each town is finalised when first popped non-stale.'
        ]),
        code: { py: `import heapq

def dijkstra(n, edges, src):
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue                  # stale entry
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist` }
      },
      {
        title: '4. Why it works, and the route itself',
        body: J([
          'When we pop town u with distance d, every other route to u must first pass through a town still in the heap, which is already at least d away, and then add a non-negative amount. So no other route can beat d: it is **final**. To recover the route, store `parent[v] = u` every time `dist[v]` improves. Ending at town 4:',
          '```',
          'parent: 1 <- 2,  3 <- 1,  4 <- 3,  2 <- 0',
          'path to 4: 4, 3, 1, 2, 0  ->  reverse: 0, 2, 1, 3, 4   (cost 1+2+1+3 = 7)',
          '```',
          'If you only need one target, you may stop as soon as that target is popped.'
        ])
      },
      {
        title: '5. Negative edges: why the proof breaks, and Bellman-Ford',
        body: J([
          'The proof above uses "adding more edges never lowers the cost". A negative edge breaks it, so Dijkstra can finalise a node too early. **Bellman-Ford** trusts no order: it relaxes every edge, repeatedly. Directed edges: `0->1: 5`, `0->2: 2`, `2->1: -4`, `1->3: 1`. Each round reads last round values and writes a copy:',
          '```',
          'start    [0, inf, inf, inf]',
          'round 1  [0, 5, 2, inf]     (paths of at most 1 edge)',
          'round 2  [0, -2, 2, 6]      (2->1 now helps; at most 2 edges)',
          'round 3  [0, -2, 2, -1]     (0->2->1->3, 3 edges)',
          '```',
          'After round r, `dist[v]` is the cheapest cost using **at most r edges**. V - 1 rounds suffice; if round V still improves, there is a negative cycle. Cost O(V·E). The same "rounds = edges allowed" idea answers "at most k stops".'
        ])
      },
      {
        title: '6. Special shapes: 0-1 BFS, grids, bottlenecks',
        body: J([
          '- **Edge cost 0 or 1:** use a deque. A free edge pushes the neighbour to the **front** (as close as the current node), a cost-1 edge to the **back**. O(V + E), no heap.',
          '- **Grid with costs:** nodes are cells, heap entries `(cost, r, c)`, four neighbours with a bounds check. Everything else is the same loop.',
          '- **Worst step instead of the sum** (steepest climb, highest water level): replace `d + w` by `max(d, w)`. The proof only needs the cost to never decrease as the route grows, and max satisfies that.',
          '- **Probabilities:** multiply, and use a max-heap (negate in Python). Factors at most 1 never improve a route as it grows, so Dijkstra still works.',
          '- **All pairs, small graph:** Floyd-Warshall with `k` as the outermost loop.'
        ])
      },
      {
        title: '7. Edge cases and cost',
        body: J([
          'Check these out loud: the source equals the target (distance 0); a target with no route (infinity, not a huge number added to something); zero-weight edges (fine for Dijkstra); parallel edges (the loop just takes the cheaper); a directed vs undirected graph (add edges once or twice); a node numbered from 1 (allocate n + 1). Overflow: use a large sentinel like `10**9` only if adding to it cannot overflow, and never relax from an infinite value.',
          'Cost of Dijkstra with a binary heap: every successful relax pushes one entry, so at most E entries, each push or pop O(log V): **O((V + E) log V)**, space O(V + E). State clearly: "non-negative weights, so Dijkstra; I skip stale heap entries instead of decreasing keys".'
        ])
      }
    ],

    drills: [
      {
        title: 'Towns within budget',
        q: J([
          'There are `n` towns joined by two-way roads, each `[a, b, cost]` with a positive cost. Starting at `src`, count how many towns (including `src` itself) you can reach with a total cost of at most `budget`.',
          '',
          'Example: `n = 5`, `roads = [[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3]]`, `src = 0`, `budget = 4` returns `4` (towns 0, 2, 1 and 3 cost 0, 1, 3 and 4).'
        ]),
        hint: 'Compute the cheapest cost to every town first. Count the ones that fit.',
        how: J([
          'I restate it: for each town I need the cheapest cost to get there, then I count towns whose cheapest cost is at most the budget. The wrong shortcut is to count the towns within a certain number of roads, because road costs differ. A brute force that enumerates all routes is exponential.',
          '',
          'The observation: roads have different positive costs and I need the cheapest cost from one start, which is the single-source shortest path problem, so Dijkstra. The budget check is just a filter at the end: a town is in range exactly when its cheapest cost fits, since any other route to it costs more.',
          '',
          'I keep dist, a list with infinity everywhere except 0 at the source, and a min-heap of (cost, town). I pop the cheapest pair, skip it if it is stale, and relax each road. On the example, dist ends as [0, 3, 1, 4, 7]: from 0, town 2 costs 1; then town 1 costs 3 through town 2 (cheaper than the direct 4); then town 3 costs 4 through town 1; then town 4 costs 7. With budget 4 the towns 0, 1, 2, 3 qualify: 4 of them.',
          '',
          'A small optimisation: once the popped cost exceeds the budget, everything left in the heap is at least as expensive, so I can stop. Edge cases: budget 0 counts just the source (plus any towns reachable by zero-cost roads); an unreachable town stays at infinity and is never counted. Cost O((V + E) log V).'
        ]),
        code: { py: `import heapq

def reachable_within(n, roads, src, budget):
    graph = [[] for _ in range(n)]
    for u, v, w in roads:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        if d > budget:
            break
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return sum(1 for x in dist if x <= budget)` },
        explain: 'Dijkstra gives the exact cheapest cost to every town because all costs are positive, and a town is affordable exactly when its cheapest cost is within budget. O((V + E) log V) time, O(V + E) space.',
        check: J([
          'roads = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3]]',
          'assert reachable_within(5, roads, 0, 4) == 4',
          'assert reachable_within(5, roads, 0, 0) == 1',
          'assert reachable_within(5, roads, 0, 100) == 5',
          'assert reachable_within(3, [[0, 1, 2]], 0, 5) == 2',
          'assert reachable_within(2, [[0, 1, 0]], 0, 0) == 2',
          'assert reachable_within(5, roads, 4, 3) == 2'
        ])
      },
      {
        title: 'The widest bridge',
        q: J([
          'Towns are joined by two-way bridges `[a, b, capacity]` (a positive number: the heaviest load it can take). A route can carry only as much as its **weakest** bridge. Return the largest load that can travel from `src` to `dst` (different towns), or `-1` if no route exists.',
          '',
          'Example: `n = 4`, `bridges = [[0,1,5],[1,3,2],[0,2,3],[2,3,4]]`, `src = 0`, `dst = 3` returns `3` (route 0-2-3 has weakest bridge 3; route 0-1-3 has weakest 2).'
        ]),
        hint: 'This is Dijkstra, but the route value is a minimum instead of a sum, and you want the biggest.',
        how: J([
          'I restate it: among all routes from src to dst, each has a value equal to its smallest capacity, and I want the route with the biggest such value. Brute force: list every simple route and take the best minimum. That is exponential in a dense graph.',
          '',
          'The observation: this is a shortest path problem in disguise. The route value never improves as the route grows (adding a bridge can only keep the minimum or lower it), exactly the property Dijkstra needs when cost never decreases as you extend a route; here "better" means larger, so I flip the direction. So I run Dijkstra with a max-heap (in Python, push the negated value), where extending a route from u by a bridge of capacity w gives value min(b, w).',
          '',
          'State: best[v] is the largest bottleneck found for v, with best[src] = infinity. Pop the largest value; if stale skip it; if the town is dst, return its value (the first pop of dst is final). Relax: new value min(b, w), update when it beats best[v]. Trace on the example: pop 0 (inf): town 1 gets 5, town 2 gets 3. Pop town 1 (5): town 3 gets min(5,2) = 2. Pop town 2 (3): town 3 gets min(3,4) = 3, better than 2. Pop town 3 (3): dst, return 3.',
          '',
          'Edge cases: unreachable dst returns -1 after the heap empties; parallel bridges are handled because each is just another edge. Cost O((V + E) log V).'
        ]),
        code: { py: `import heapq

def widest_path(n, roads, src, dst):
    graph = [[] for _ in range(n)]
    for u, v, w in roads:
        graph[u].append((v, w))
        graph[v].append((u, w))
    best = [-1] * n
    best[src] = float('inf')
    heap = [(-float('inf'), src)]
    while heap:
        neg, u = heapq.heappop(heap)
        b = -neg
        if b < best[u]:
            continue
        if u == dst:
            return b
        for v, w in graph[u]:
            nb = min(b, w)
            if nb > best[v]:
                best[v] = nb
                heapq.heappush(heap, (-nb, v))
    return -1` },
        explain: 'Routes only get weaker as they extend, so the town popped with the largest bottleneck cannot be improved later; this is Dijkstra with min in place of + and a max-heap. O((V + E) log V).',
        check: J([
          'assert widest_path(4, [[0, 1, 5], [1, 3, 2], [0, 2, 3], [2, 3, 4]], 0, 3) == 3',
          'assert widest_path(2, [[0, 1, 7]], 0, 1) == 7',
          'assert widest_path(3, [[0, 1, 5]], 0, 2) == -1',
          'assert widest_path(3, [[0, 1, 10], [1, 2, 1], [0, 2, 4]], 0, 2) == 4',
          'assert widest_path(2, [[0, 1, 3], [0, 1, 9]], 1, 0) == 9',
          'assert widest_path(5, [[0, 1, 9], [1, 2, 9], [2, 3, 2], [3, 4, 9], [0, 4, 3]], 0, 4) == 3'
        ])
      },
      {
        title: 'How many cheapest routes',
        q: J([
          'Towns are joined by two-way roads `[a, b, cost]` with positive costs. Roads with the same endpoints are different roads. Return the **number of distinct routes** from `src` to `dst` whose total cost equals the cheapest possible (1 if `src == dst`, 0 if there is no route).',
          '',
          'Example: `n = 4`, `roads = [[0,1,1],[0,2,1],[1,3,1],[2,3,1]]`, `src = 0`, `dst = 3` returns `2`.'
        ]),
        hint: 'Besides the distance, keep how many cheapest routes reach each town. When does that count grow?',
        how: J([
          'I restate it: find the cheapest cost from src to dst, then count the routes that achieve it. Brute force: enumerate every route, find the minimum cost, count the ties. Exponential.',
          '',
          'The observation: every cheapest route to dst passes through a cheapest-prefix route to each town on it, so counts can be built town by town. Along with dist[v] I keep ways[v], the number of cheapest routes to v. When I relax an edge from u with cost w: if d + w is strictly less than dist[v], I found a strictly better cost, so ways[v] is replaced by ways[u]. If d + w equals dist[v], this is another cheapest route, so ways[v] is increased by ways[u]. If it is greater, nothing happens.',
          '',
          'Why ways[u] is final when I use it: costs are positive, so every route into u that is part of a cheapest route comes from a town with strictly smaller distance, and those towns have all been popped earlier. Positive costs are essential: with zero-cost roads the order of equal distances would break this.',
          '',
          'Trace on the diamond: ways[0] = 1. Pop 0: towns 1 and 2 get dist 1, ways 1 each. Pop town 1: town 3 gets dist 2, ways 1. Pop town 2: town 3 offers 2 again, equal, so ways[3] = 2. Answer 2. Edge cases: src equals dst returns 1; unreachable returns 0. Cost O((V + E) log V).'
        ]),
        code: { py: `import heapq

def count_shortest_paths(n, roads, src, dst):
    graph = [[] for _ in range(n)]
    for u, v, w in roads:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [float('inf')] * n
    ways = [0] * n
    dist[src] = 0
    ways[src] = 1
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                ways[v] = ways[u]
                heapq.heappush(heap, (nd, v))
            elif nd == dist[v]:
                ways[v] += ways[u]
    return ways[dst]` },
        explain: 'Each cheapest route to v extends a cheapest route to some neighbour u, and with positive costs ways[u] is final before u is expanded, so adding ways[u] on ties and replacing on strict improvement counts every cheapest route exactly once. O((V + E) log V).',
        check: J([
          'sq = [[0, 1, 1], [0, 2, 1], [1, 3, 1], [2, 3, 1]]',
          'assert count_shortest_paths(4, sq, 0, 3) == 2',
          'assert count_shortest_paths(4, sq + [[0, 3, 5]], 0, 3) == 2',
          'assert count_shortest_paths(4, sq + [[0, 3, 2]], 0, 3) == 3',
          'assert count_shortest_paths(3, [[0, 1, 1]], 0, 2) == 0',
          'assert count_shortest_paths(2, [[0, 1, 2]], 0, 0) == 1',
          'assert count_shortest_paths(7, [[0, 1, 1], [0, 2, 1], [1, 3, 1], [2, 3, 1], [3, 4, 1], [3, 5, 1], [4, 6, 1], [5, 6, 1]], 0, 6) == 4',
          'assert count_shortest_paths(2, [[0, 1, 2], [0, 1, 2]], 0, 1) == 2'
        ])
      },
      {
        title: 'One free flight',
        q: J([
          'Flights are one-way, each `[from, to, price]` with a positive price. You hold one coupon that makes **one** flight of your choice free (or you may leave it unused). Return the cheapest total price from `src` to `dst`, or `-1` if `dst` cannot be reached.',
          '',
          'Example: `n = 3`, `flights = [[0,1,10],[1,2,10]]`, `src = 0`, `dst = 2` returns `10`.'
        ]),
        hint: 'One number per town is not enough. Remember whether the coupon has been used, and treat each (town, used) as its own node.',
        how: J([
          'I restate it: cheapest route where I may zero out one flight. Brute force: for every flight, set its price to zero and rerun a shortest path, taking the best. That is E times a Dijkstra, and it hides the real structure.',
          '',
          'The observation: the cheapest cost to a town now depends on whether the coupon is already spent. Arriving at town 5 for 20 with the coupon unused is a different situation from arriving for 10 with it used: the first may be better later. So the state is (town, used), two layers of the graph. Taking a flight in the same layer costs its price. In the unused layer I may also take a flight for free and move to the used layer. That doubles the node count but it is still a plain shortest path with non-negative costs, so Dijkstra.',
          '',
          'I keep dist[town][0 or 1] and a heap of (cost, town, used). Pop the cheapest; skip stale; if the town is dst, return the cost (the first pop is the cheapest in either layer). Relax: normal edge in the same layer; and if not used, a free edge to the used layer with the same cost d. Trace on the example: (0,0,0) popped. Flight 0 to 1: normal gives (10, 1, 0); coupon gives (0, 1, 1). Pop (0,1,1): flight to 2 costs 10 normally, giving (10, 2, 1). Pop (10,1,0): coupon on the flight to 2 gives (10, 2, 1) as well. First pop of dst: 10.',
          '',
          'Edge cases: src equals dst returns 0; no route returns -1 after the heap empties. Cost O((V + E) log V) on twice as many states.'
        ]),
        code: { py: `import heapq

def cheapest_with_coupon(n, flights, src, dst):
    graph = [[] for _ in range(n)]
    for u, v, w in flights:
        graph[u].append((v, w))
    INF = float('inf')
    dist = [[INF, INF] for _ in range(n)]
    dist[src][0] = 0
    heap = [(0, src, 0)]
    while heap:
        d, u, used = heapq.heappop(heap)
        if d > dist[u][used]:
            continue
        if u == dst:
            return d
        for v, w in graph[u]:
            if d + w < dist[v][used]:
                dist[v][used] = d + w
                heapq.heappush(heap, (d + w, v, used))
            if not used and d < dist[v][1]:
                dist[v][1] = d
                heapq.heappush(heap, (d, v, 1))
    return -1` },
        explain: 'Adding the coupon flag to the node makes the problem an ordinary non-negative shortest path on 2n states; the first time dst is popped in either layer, its cost is the minimum. O((V + E) log V).',
        check: J([
          'assert cheapest_with_coupon(3, [[0, 1, 10], [1, 2, 10]], 0, 2) == 10',
          'assert cheapest_with_coupon(3, [[0, 2, 15], [0, 1, 4], [1, 2, 4]], 0, 2) == 0',
          'assert cheapest_with_coupon(3, [[1, 0, 5]], 0, 1) == -1',
          'assert cheapest_with_coupon(2, [[0, 1, 5]], 0, 0) == 0',
          'assert cheapest_with_coupon(4, [[0, 1, 1], [1, 2, 100], [2, 3, 1]], 0, 3) == 2',
          'assert cheapest_with_coupon(4, [[0, 1, 3], [1, 3, 3], [0, 2, 1], [2, 3, 9]], 0, 3) == 1'
        ])
      }
    ],

    how: {
      743: J([
        'I restate it: a signal starts at node k and travels along directed edges with given times; I want the time until every node has received it, or -1 if some node never does. Brute force: try every route to every node, exponential.',
        '',
        'The observation: each node receives the signal at its cheapest arrival time, because the signal spreads along every edge at once; so the time for node v is the shortest distance from k to v. Everyone has the signal when the slowest node has it, so the answer is the maximum of those shortest distances. Times are non-negative and differ per edge, so BFS is out and Dijkstra is the tool.',
        '',
        'I build a directed adjacency list, set dist to infinity except 0 for k, and run Dijkstra with a heap of (time, node), skipping stale entries. Trace on [[1,2,5],[1,3,2],[3,2,1],[2,4,3]] with n = 4, k = 1: pop (0,1): node 2 gets 5, node 3 gets 2. Pop (2,3): node 2 improves to 3. Pop (3,2): node 4 gets 6. Pop (5,2) is stale. Pop (6,4). Distances 0, 3, 2, 6: the answer is 6.',
        '',
        'After the heap empties I take the maximum over nodes 1 to n; if any is still infinity, I return -1. Edge cases: n = 1 returns 0; edges are directed so I add each once; nodes are numbered from 1. Cost O((V + E) log V).'
      ]),
      787: J([
        'I restate it: flights with prices, find the cheapest price from src to dst using at most k stops, meaning at most k + 1 flights, or -1. Brute force: try every route up to k + 1 flights, exponential in k.',
        '',
        'The bottleneck is that plain Dijkstra keeps one best price per city, and that can discard a pricier route that uses fewer flights, which may be the only one that still fits the limit. The state needs the flight count.',
        '',
        'The cleanest fix is Bellman-Ford, whose rounds are exactly "one more flight allowed": after round r, dist[v] is the cheapest price using at most r flights. So I run k + 1 rounds. In each round I read last round dist and write into a copy, so one round cannot chain several flights. Trace on 3 cities with [[0,1,100],[1,2,100],[0,2,500]], src 0, dst 2, k = 1: start [0, inf, inf]. Round 1: [0, 100, 500]. Round 2: [0, 100, 200]. Answer 200. With k = 0 only round 1 runs and the answer is 500.',
        '',
        'I use a sentinel for unreachable and guard against relaxing from it. Edge cases: dst unreachable within the limit returns -1; src equal to dst would be 0. Cost O((k + 1) times E) time, O(V) space.'
      ]),
      778: J([
        'I restate it: a grid of elevations; at time t, water covers every cell with elevation at most t, and I can swim between adjacent covered cells instantly. Find the earliest time I can get from the top-left to the bottom-right. Brute force: for each time, flood fill to see if the target is reachable, which is roughly time times cells.',
        '',
        'The observation: waiting is free, so the time I arrive is decided by the tallest cell on my route (including the start). I want the route whose tallest cell is smallest: minimise the maximum, not the sum. Dijkstra only needs the route cost to never decrease as the route grows, and a running maximum has that property. So I use Dijkstra with cost = max(cost so far, next cell height).',
        '',
        'State: a heap of (tallest so far, row, column), starting with the start cell height. Pop the smallest; if it is the bottom-right cell, return its value. Relax each neighbour with max(t, height). Trace on [[0,8,7],[1,2,3],[6,5,4]]: pop (0,0,0): neighbours give 8 and 1. Pop 1 at (1,0): neighbours give 2 at (1,1) and 6. Pop 2: neighbours give 3 at (1,2) and 5. Pop 3: gives 7 at (0,2) and 4 at (2,2). Pop 4 at the corner: answer 4.',
        '',
        'Edge cases: a 1 by 1 grid returns its own height; the start height counts. Cost O(N squared log N) for an N by N grid.'
      ]),
      2290: J([
        'I restate it: a grid with empty cells (0) and obstacles (1). I may remove obstacles; find the minimum number of removals to get from the top-left to the bottom-right, moving in four directions. Brute force: try subsets of obstacles, exponential.',
        '',
        'The observation: think of the cost of stepping into a cell as its value, 0 for an empty cell and 1 for an obstacle I remove. Then the answer is the cheapest route, a shortest path where every edge costs 0 or 1. A heap works, but with only 0 and 1 a deque is enough: 0-1 BFS.',
        '',
        'In 0-1 BFS a free step goes to the front of the deque, because that cell is exactly as close as the current one; a cost-1 step goes to the back. The deque then stays ordered by distance. I keep dist per cell, start at 0, and relax a neighbour when dist[current] plus its value is smaller than the stored value. Trace on [[0,1,1],[1,1,0],[1,1,0]]: from (0,0), (0,1) costs 1, then (0,2) costs 2; (1,2) is empty so it costs 2 as well, pushed to the front, and (2,2) is 2. Answer 2.',
        '',
        'Edge cases: a 1 by 1 grid returns 0; a fully open path returns 0. A cell may be relaxed more than once, which is fine because it only updates on strict improvement. Cost O(rows times cols).'
      ]),
      1514: J([
        'I restate it: an undirected graph where each edge has a success probability; the probability of a route is the product along it. Find the largest probability from start to end, or 0. Brute force: enumerate routes and multiply, exponential.',
        '',
        'The observation: this is a shortest path with the roles reversed. Dijkstra works whenever extending a route can never make it better. Every probability is at most 1, so multiplying by another one never increases a route value. That is the "does not improve as it grows" property, with "better" meaning larger. So I run Dijkstra with a max-heap; in Python I push the negated probability.',
        '',
        'State: best[v] is the highest probability found for v, with best[start] = 1. Pop the largest; skip it if stale; if it is the end node, return it. Relax: p times the edge probability, update when it beats best[v]. Trace on edges 0-1 (0.5), 1-2 (0.5), 0-2 (0.2) from 0 to 2: pop 0 (1.0): node 1 gets 0.5, node 2 gets 0.2. Pop node 1 (0.5): node 2 gets 0.25, better. Pop node 2 (0.25): the end. Answer 0.25.',
        '',
        'Edge cases: no route returns 0 after the heap empties; the start equal to the end returns 1. Cost O((V + E) log V).'
      ]),
      1334: J([
        'I restate it: cities joined by weighted two-way roads; for each city count the other cities reachable within a distance threshold; return the city with the fewest, preferring the larger index on ties. Brute force: running a path search from each city is possible but I need every pair of distances anyway.',
        '',
        'The observation: the graph is small (a few hundred cities), and I need the shortest distance between every pair. That is exactly Floyd-Warshall: a matrix d where d[i][j] starts as the direct road (or infinity, with 0 on the diagonal). Then for each possible middle stop k, I check whether going i to k to j beats d[i][j]. The loop over k must be the outermost one, so that after step k the matrix is correct for routes using only the first k+1 towns as intermediates.',
        '',
        'The graph is undirected, so I set both d[u][v] and d[v][u]. After the triple loop, I count for each city the others with distance at most the threshold. To prefer the larger index on ties, I update the best answer with less-than-or-equal while scanning cities in increasing order. Trace on n = 4 with [[0,1,3],[1,2,1],[1,3,4],[2,3,1]], threshold 4: city 0 reaches 1 and 2 (3 and 4): 2. City 1 reaches 0, 2, 3: 3. City 2 reaches 1, 3, 0: 3. City 3 reaches 2 and 1 (1 and 2), but 0 is at 5: 2. Cities 0 and 3 tie at 2, so the answer is 3.',
        '',
        'Cost O(n cubed) time, O(n squared) space.'
      ])
    }
  };
})();
