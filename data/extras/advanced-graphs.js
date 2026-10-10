(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['advanced-graphs'] = {
    primer: {
      kind: 'technique',
      what: `Advanced graph techniques answer structural questions that plain BFS and DFS cannot: which single **bridge** (an edge) or **articulation point** (a node) disconnects the graph, which nodes form a **strongly connected component** (SCC, a group in a directed graph where everyone can reach everyone), whether a walk can use every **edge** once (an **Eulerian path**), and whether the nodes can be split into two sides (**bipartite**).`,
      does: `Each one is a single O(V + E) pass: low-link DFS finds bridges and cut points, Tarjan or Kosaraju finds SCCs, Hierholzer builds an Eulerian path after a degree check, and BFS two-coloring tests bipartiteness. They turn "what breaks if I remove this?" and "can I traverse every street once?" into linear scans.`,
      impl: `DFS stamps each node with a discovery time \`disc\` and tracks \`low\`, the earliest time reachable from its subtree using one back edge. SCC adds a stack of open nodes; Hierholzer keeps a stack and pops a node into the answer when it has no unused edges. In Python use adjacency lists (\`list[list[int]]\`) and an explicit stack for deep graphs, since recursion stops near 1000.`,
      possibilities: `Critical connections in a network, single points of failure, condensing a directed graph into a DAG of components, minimum number of starting nodes to reach everything, itinerary and domino-chain problems (Eulerian), two-team splits, and modeling puzzles as graphs where every edge must be used.`
    },

    think: [
      {
        q: `A graph is a triangle 0-1-2 with a tail 2-3. Without any algorithm: which edges are bridges and which node is an articulation point? What single property tells you?`,
        a: `Bridge: only 2-3. Articulation point: only node 2. The triangle edges each have a way around (the third side), so removing one keeps everything connected; node 3 hangs on one edge only. Property: an edge is a bridge exactly when it lies on **no cycle**. Removing node 2 strands node 3, which is why 2 is a cut point. The low-link algorithm computes "is there a cycle through this edge" for all edges at once.`
      },
      {
        q: `In a bridge-finding DFS, why must the DFS skip the edge it arrived by, and why skip by **edge id** rather than by parent node?`,
        a: `If it did not skip, the child would see its parent as a visited neighbor and treat the tree edge as a back edge, so every edge would look like it lies on a cycle. Skipping by node fails on parallel edges: with two cables between u and v, the second one is a genuine alternative route, but skipping "the parent node" ignores it and falsely calls the pair a bridge. The edge id skips exactly the one edge we came down.`
      },
      {
        q: `A directed graph has edges 0->1, 1->2, 2->0, 2->3. Which nodes are in the same SCC, and what happens if you add 3->1?`,
        a: `Without the extra edge: {0,1,2} is one SCC (they form a loop) and {3} is alone, since from 3 you can't get back. With 3->1 added, 3 reaches 1, which reaches 2, which reaches 3, so now all four nodes are one SCC. The aha: one edge pointing back into an existing loop merges everything on the path into one component.`
      },
      {
        q: `Does a graph with degrees 2, 2, 2, 2 (a square) have an Eulerian circuit? What about degrees 1, 2, 2, 3 (a triangle with a tail)?`,
        a: `The square: all degrees even and connected, so yes, a circuit exists (go around it). Degrees 1, 2, 2, 3: exactly two odd nodes (degree 1 and 3), so no circuit but there is an Eulerian **path** that starts at one odd node and ends at the other. Rule: 0 odd nodes means a circuit, 2 odd nodes means a path, any other count means none. (Also all edges must be in one connected piece.)`
      },
      {
        q: `Hierholzer appends a node to the answer when it has no unused edges left. Why does the answer come out reversed, and what would go wrong if you appended on arrival instead?`,
        a: `The first node that runs out of edges must be the final stop of the trip (you can only get stuck at the end), so it enters the answer first; later nodes are earlier in the trip, hence the reverse. Appending on arrival would record a greedy walk that might hit the end early and leave a side loop unused. Appending at the dead end lets that unused loop be spliced in before the stuck node when we step back.`
      },
      {
        q: `A graph has a 5-cycle plus nothing else. Is it bipartite? What does BFS coloring do on it, step by step?`,
        a: `Not bipartite, since a cycle of odd length can't be two-colored. Color node 0 red, its two neighbors blue, their other neighbors red (two nodes at distance 2), and the last edge joins the two red nodes: same color on both ends, so the check fails there. Even cycle: the colors alternate and close up fine. So bipartite is the same as "no odd cycle".`
      }
    ],

    breakdown: [
      {
        title: `1. A DFS tree and its back edges`,
        body: `Take an undirected graph: edges 0-1, 1-2, 2-0, 1-3. Run DFS from 0. The edges used to discover new nodes are **tree edges**: 0-1, 1-2, 1-3. The leftover edge 2-0 connects 2 to an **ancestor** (0), so it is a **back edge**. In an undirected DFS every non-tree edge is a back edge; there are no edges between sibling subtrees. That structure is what makes bridges easy: a tree edge is a bridge exactly when no back edge jumps over it. Edge 2-0 jumps over 0-1 and 1-2, so those are safe. Edge 1-3 has nothing jumping over it, so it is a bridge.`
      },
      {
        title: `2. disc and low, traced`,
        body: `Stamp nodes in visit order: \`disc[0]=0\`, \`disc[1]=1\`, \`disc[2]=2\`, \`disc[3]=3\`. Define \`low[u]\` = smallest \`disc\` reachable from u's subtree using tree edges down and at most one back edge. Start with \`low[u]=disc[u]\`. At node 2 the back edge to 0 gives \`low[2]=0\`. Returning to 1, lift the child: \`low[1]=min(1, low[2])=0\`. Node 3 has no back edge: \`low[3]=3\`. So the table reads: low = [0, 0, 0, 3]. Every node whose subtree can climb to an older node has a small low; the ones that cannot keep their own time.`
      },
      {
        title: `3. The bridge and cut tests`,
        body: `After finishing child v of u, lift: \`low[u] = min(low[u], low[v])\`. Then test. **Bridge u-v** if \`low[v] > disc[u]\`: nothing in v's subtree reaches u or higher. Here edge 1-3: \`low[3]=3 > disc[1]=1\`, a bridge. Edge 1-2: \`low[2]=0 > 1\`? No, safe. **Cut vertex u** (non-root) if \`low[v] >= disc[u]\` for some child: reaching u itself does not help once u is deleted. Node 1 with child 3: 3 >= 1, yes, node 1 is a cut point. The **root** has no "above", so it is a cut point only when it has two or more DFS children. Bridge uses strict >, cut uses >=.`,
        code: { py: `def bridges_only(n, edges):
    adj = [[] for _ in range(n)]
    for i, (a, b) in enumerate(edges):
        adj[a].append((b, i)); adj[b].append((a, i))
    disc, low, out, t = [-1] * n, [0] * n, [], [0]
    def dfs(u, pe):
        disc[u] = low[u] = t[0]; t[0] += 1
        for v, i in adj[u]:
            if i == pe: continue
            if disc[v] != -1:
                low[u] = min(low[u], disc[v])
            else:
                dfs(v, i)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]: out.append([u, v])
    for s in range(n):
        if disc[s] == -1: dfs(s, -1)
    return out` }
      },
      {
        title: `4. Directed graphs: SCCs and the open stack`,
        body: `In a directed graph, two nodes are in the same **SCC** if each reaches the other. Take edges 0->1, 1->2, 2->0, 2->3, 3->4, 4->3. Loops are {0,1,2} and {3,4}, and the edge 2->3 only goes one way between them. Collapse each SCC into a single node and you always get a **DAG**, which is why SCCs are used to simplify cyclic graphs. Tarjan's algorithm uses the same \`disc\` and \`low\` plus a **stack of nodes that are visited but not yet assigned**. A back edge only counts if its target is still on that stack, because an edge into a finished component can't lead back.`
      },
      {
        title: `5. Tarjan traced`,
        body: `Use the graph above. DFS 0: disc 0, stack [0]. Go 1: disc 1, stack [0,1]. Go 2: disc 2, stack [0,1,2]. From 2, edge 2->0: 0 is on the stack, so \`low[2]=0\`. Edge 2->3: new, disc 3, stack [0,1,2,3]; 3->4: disc 4, stack [..,4]; 4->3: 3 on stack, \`low[4]=3\`. Finish 4: low 3 != disc 4, not a head. Back at 3: \`low[3]=3 = disc[3]\`, so 3 is a head: pop 4 and 3, component {3,4}. Back at 2: lift \`low[2]=min(0, 3)=0\`, not a head. Same for 1. At 0: \`low[0]=0=disc[0]\`: pop 2, 1, 0 for component {0,1,2}. Order found: sinks first (reverse topological).`
      },
      {
        title: `6. Eulerian paths: the degree rule`,
        body: `Different question: walk every **edge** exactly once. Each time you pass through a node you use one edge to enter and one to leave, so edges at a node pair up. In an undirected graph that forces **even degree** everywhere except possibly the start and end. Count odd-degree nodes: 0 means a closed circuit exists, 2 means a path from one odd node to the other, anything else is impossible. In a directed graph compare out-degree and in-degree: all equal for a circuit, or one node with out = in + 1 (start) and one with in = out + 1 (end) for a path. Also all edges must be in one connected piece. This is the opposite of the Hamiltonian problem (every node once), which is hard.`
      },
      {
        title: `7. Hierholzer traced`,
        body: `Directed edges A->B, A->C, C->A. Degrees: A has out 2, in 1, so A is the start. Keep a stack and take the smallest neighbor: stack [A]; take B: [A,B]. B has no edges left: pop it into the answer, answer [B]. Top is A again: take C: [A,C]; take A: [A,C,A]; A has nothing left: answer [B,A]; pop C: [B,A,C]; pop A: [B,A,C,A]. Reverse: **A, C, A, B**. A plain greedy walk would have gone A->B and stopped, stranding C->A. Popping at dead ends is what lets the side loop get spliced in. Cost O(E) (plus a log if neighbors must be taken in sorted order).`
      },
      {
        title: `8. Two colors and picking the tool`,
        body: `**Bipartite**: split nodes into two groups with every edge between groups. BFS from each uncolored node, color neighbors the opposite color, and report failure when an edge joins two same-colored nodes; that edge closes an odd cycle. Example: square 0-1-2-3-0 colors 0,1,0,1 and passes; triangle fails at the third edge. Choosing the tool is the real skill. "Which link breaks it": low-link. "Mutually reachable groups": SCC. "Use every street once": Euler. "Two teams": bipartite. If none of those words appear, try BFS, Dijkstra, or union-find first. Always say the reason out loud before coding.`
      }
    ],

    drills: [
      {
        title: `Two teams`,
        q: `People are numbered 1 to n and some pairs dislike each other. Can everyone be put into two teams so that no disliking pair shares a team? Return True or False. Example: \`can_split(4, [[1,2],[1,3],[2,4]])\` is True; \`can_split(3, [[1,2],[2,3],[1,3]])\` is False (a triangle).`,
        hint: `A disliking pair is an edge that must cross between teams. When is that impossible?`,
        how: `I restate it: put each person in one of two teams so every disliking pair is split. Brute force tries all 2^n assignments, which dies past n around 25. The observation is that each pair says "these two must differ", which is an edge that must go between two sides. That is exactly the bipartite test, and a graph is bipartite when it has no cycle of odd length. So I build an adjacency list, then color greedily with BFS: pick an uncolored person, color them 0, then give every neighbor the opposite color, and when I meet an already-colored neighbor with the same color as the current person, I have found an odd cycle and return False. The graph may be in several pieces, so I start a BFS from every uncolored person. Trace on the triangle 1-2, 2-3, 1-3: color 1 as 0, then 2 and 3 as 1; when I process 2 its neighbor 3 has the same color 1, so return False. On 1-2, 1-3, 2-4: 1 is 0, 2 and 3 are 1, 4 (neighbor of 2) is 0, no clash, so True. Edge cases: no pairs is True; isolated people are fine; a pair repeated twice is harmless. Cost: O(n + E) time and space.`,
        code: { py: `from collections import deque

def can_split(n, dislikes):
    adj = [[] for _ in range(n + 1)]
    for a, b in dislikes:
        adj[a].append(b)
        adj[b].append(a)
    color = [-1] * (n + 1)
    for s in range(1, n + 1):
        if color[s] != -1:
            continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = color[u] ^ 1      # opposite team
                    q.append(v)
                elif color[v] == color[u]:       # same team on both ends: odd cycle
                    return False
    return True` },
        explain: `A valid split exists exactly when the dislike graph has no odd cycle, and BFS coloring finds a conflicting edge iff one exists. Every node and edge is visited once: O(n + E) time and space.`,
        check: `assert can_split(4, [[1,2],[1,3],[2,4]]) is True
assert can_split(3, [[1,2],[2,3],[1,3]]) is False
assert can_split(1, []) is True
assert can_split(5, [[1,2],[3,4],[4,5],[3,5]]) is False
assert can_split(6, [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]]) is True
assert can_split(5, [[1,2],[2,3],[3,4],[4,5],[5,1]]) is False
assert can_split(4, [[1,2],[1,2]]) is True`
      },
      {
        title: `Draw it without lifting the pen`,
        q: `A drawing is a set of undirected strokes between points 0..n-1 (edges, possibly repeated). Can you trace every stroke exactly once in a single continuous motion (you may start and end anywhere)? Return True or False. Example: \`can_draw(4, [[0,1],[1,2],[2,0],[2,3]])\` is True (start at 3 and end at 1, or the reverse); \`can_draw(4, [[0,1],[0,2],[0,3]])\` is False (three odd leaves plus the odd center). No strokes means True.`,
        hint: `Two conditions: count the points with an odd number of strokes, and make sure all strokes sit in one connected piece.`,
        how: `I restate it: decide whether an Eulerian path exists in an undirected multigraph. Brute force would try every order of strokes, which is factorial. The classic observation is the degree rule: every time the pen passes through a point it uses one stroke to enter and one to leave, so a point's strokes pair up unless it is the start or the end. Hence at most two points may have an odd degree, and the count of odd points is always even, so the allowed counts are exactly 0 or 2. That is necessary but not sufficient, because two separate drawings each satisfying the degree rule can't be traced in one motion. So I also need all points that have at least one stroke to be in one connected component. I count degrees, check the odd count is 0 or 2, then use union-find over the edges and require that all points with a positive degree share one root. Trace on the first example: degrees 0:2, 1:2, 2:3, 3:1, so the odd points are 2 and 3 (two of them), and all four points are connected, so True. Second example: degrees 3,1,1,1, four odd points, False. Edge cases: no strokes is True; a single self-loop counts as degree 2 at that point; isolated points with no strokes don't matter. Cost: O(n + E) with near-constant union-find.`,
        code: { py: `def can_draw(n, edges):
    deg = [0] * n
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        deg[a] += 1
        deg[b] += 1
        parent[find(a)] = find(b)
    if sum(d % 2 for d in deg) not in (0, 2):
        return False                     # degrees rule it out
    roots = {find(v) for v in range(n) if deg[v] > 0}
    return len(roots) <= 1               # all strokes in one connected piece` },
        explain: `An Eulerian path exists iff the strokes form one connected piece and zero or two points have odd degree. Counting degrees is O(E) and union-find connects the edges in near-linear time, so O(n + E).`,
        check: `assert can_draw(4, [[0,1],[1,2],[2,0],[2,3]]) is True
assert can_draw(4, [[0,1],[0,2],[0,3]]) is False
assert can_draw(3, []) is True
assert can_draw(4, [[0,1],[2,3]]) is False
assert can_draw(3, [[0,1],[1,2],[2,0]]) is True
assert can_draw(2, [[0,1],[0,1]]) is True
assert can_draw(5, [[0,1],[1,2],[3,4],[4,3]]) is False
assert can_draw(1, [[0,0]]) is True`
      },
      {
        title: `Single points of failure`,
        q: `An undirected network has n nodes (0 to n-1) and a list of links. Return the sorted list of nodes whose removal increases the number of connected pieces (the articulation points). Example: for \`cut_nodes(5, [[0,1],[1,2],[2,0],[2,3],[3,4]])\` the answer is \`[2, 3]\`; for a triangle it is \`[]\`; for a path 0-1-2 it is \`[1]\`.`,
        hint: `Use discovery time and low. For a non-root node u with a child v, what does low[v] >= disc[u] mean? And treat the root separately.`,
        how: `I restate it: find nodes that, once deleted, break the network into more pieces. Brute force deletes each node and counts components with a BFS: O(V·(V+E)), too slow for large graphs. The observation: in a DFS tree, if node u has a child v whose subtree can't reach any node strictly above u (using a back edge), then deleting u cuts that subtree off. I give each node a discovery time disc and keep low[u] as the earliest disc reachable from its subtree through tree edges downward and at most one back edge. After returning from child v, I update low[u] with low[v]. If u is not the DFS root and low[v] >= disc[u] for any child v, u is a cut node. The root is special: it has nothing above, so the condition would always fire, instead it is a cut node only if it has two or more DFS children. Trace on the path 0-1-2 starting at 0: disc 0,1,2; low = 0,1,2. Node 2 has no children. At node 1, child 2 has low 2 >= disc 1, so 1 is a cut node. Root 0 has one child, so not. Result [1]. Parallel edges don't matter for nodes, so skipping the parent by node is fine here. Edge cases: a single node, disconnected graphs (run DFS from every unvisited node). Cost: O(V + E). Python recursion is fine for the tests; for 10^5 nodes use an explicit stack.`,
        code: { py: `import sys
sys.setrecursionlimit(10000)

def cut_nodes(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        if a != b:
            adj[a].append(b)
            adj[b].append(a)
    disc = [-1] * n
    low = [0] * n
    cuts = set()
    timer = [0]

    def dfs(u, parent):
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        kids = 0
        for v in adj[u]:
            if v == parent:
                continue
            if disc[v] != -1:
                low[u] = min(low[u], disc[v])        # back edge
            else:
                kids += 1
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if parent != -1 and low[v] >= disc[u]:
                    cuts.add(u)                      # v's subtree can't climb above u
        if parent == -1 and kids > 1:
            cuts.add(u)                              # root with 2+ children

    for s in range(n):
        if disc[s] == -1:
            dfs(s, -1)
    return sorted(cuts)` },
        explain: `Deleting u separates v's subtree exactly when no back edge from it reaches above u, which is \`low[v] >= disc[u]\`; the root is a cut node iff it has two or more DFS children. Single DFS: O(V + E) time, O(V + E) space.`,
        check: `assert cut_nodes(5, [[0,1],[1,2],[2,0],[2,3],[3,4]]) == [2, 3]
assert cut_nodes(3, [[0,1],[1,2],[2,0]]) == []
assert cut_nodes(3, [[0,1],[1,2]]) == [1]
assert cut_nodes(1, []) == []
assert cut_nodes(4, [[0,1],[0,2],[0,3]]) == [0]
assert cut_nodes(5, [[0,1],[1,2],[3,4]]) == [1]
assert cut_nodes(6, [[0,1],[1,2],[2,0],[2,3],[3,4],[4,2],[4,5]]) == [2, 4]
assert cut_nodes(4, [[0,1],[1,2],[2,3],[3,0]]) == []`
      },
      {
        title: `Smallest set of rumor starters`,
        q: `A directed graph says "person a passes news to person b". Return the **minimum number of people** you must tell directly so that everybody eventually hears the news. Example: \`min_starters(5, [[0,1],[1,2],[2,0],[2,3],[3,4],[4,3]])\` is 1 (tell anyone in the loop 0,1,2); \`min_starters(3, [])\` is 3; for a chain 0->1->2 it is 1.`,
        hint: `People who can all reach each other are interchangeable. Collapse them. Which collapsed groups have nobody outside pointing at them?`,
        how: `I restate it: pick the fewest starting people whose reachable set covers everyone. Brute force tries every subset of starters, 2^n. The observation: if two people can reach each other, telling one is the same as telling the other, so I should think in groups, the strongly connected components. If I collapse each group into one node, the graph becomes a DAG. In a DAG, a node with no incoming edge can only be reached by being told directly, while every node with an incoming edge is reachable from some source. So the answer is the number of SCCs that have no edge coming in from another SCC. Plan: find SCCs with Tarjan (a stack plus disc and low; when low equals disc the node is a component head, pop it), label each node with a component id, then walk all edges a->b and mark the component of b as having an incoming edge whenever the component ids differ. Count unmarked components. Trace on the example: SCCs {0,1,2} and {3,4}, the only cross edge 2->3 marks {3,4}, leaving {0,1,2} unmarked, answer 1. With no edges every node is its own unmarked component: 3. Edge cases: n of 1, a graph that is one big cycle (answer 1). Cost: O(n + E).`,
        code: { py: `import sys
sys.setrecursionlimit(10000)

def min_starters(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
    disc = [-1] * n
    low = [0] * n
    on = [False] * n
    stack = []
    comp = [-1] * n
    ncomp = [0]
    timer = [0]

    def dfs(u):
        disc[u] = low[u] = timer[0]
        timer[0] += 1
        stack.append(u)
        on[u] = True
        for v in adj[u]:
            if disc[v] == -1:
                dfs(v)
                low[u] = min(low[u], low[v])
            elif on[v]:
                low[u] = min(low[u], disc[v])
        if low[u] == disc[u]:                    # u heads a component
            while True:
                w = stack.pop()
                on[w] = False
                comp[w] = ncomp[0]
                if w == u:
                    break
            ncomp[0] += 1

    for s in range(n):
        if disc[s] == -1:
            dfs(s)
    has_in = [False] * ncomp[0]
    for a, b in edges:
        if comp[a] != comp[b]:
            has_in[comp[b]] = True               # someone outside can reach this group
    return has_in.count(False)` },
        explain: `Everyone inside an SCC can reach everyone else in it, and in the condensed DAG a component is reachable from outside iff it has an incoming cross edge. So exactly the components with no incoming cross edge must be told directly. Tarjan plus one edge pass: O(n + E).`,
        check: `assert min_starters(5, [[0,1],[1,2],[2,0],[2,3],[3,4],[4,3]]) == 1
assert min_starters(3, []) == 3
assert min_starters(3, [[0,1],[1,2]]) == 1
assert min_starters(1, []) == 1
assert min_starters(4, [[0,1],[2,3]]) == 2
assert min_starters(4, [[0,1],[1,2],[2,3],[3,0]]) == 1
assert min_starters(4, [[0,3],[1,3],[2,3]]) == 3
assert min_starters(6, [[0,1],[1,0],[2,3],[3,2],[1,2],[4,5]]) == 2`
      }
    ],

    how: {
      332: `I restate it: given one-way tickets, build a trip from JFK that uses every ticket exactly once, and if several trips work return the lexicographically smallest. Brute force is backtracking: try the smallest unused ticket from the current airport, recurse, and undo if I get stuck. It is correct but can go exponential because a bad early choice is only discovered much later. The observation is that airports are nodes and tickets are directed edges, so using every ticket exactly once is an Eulerian path starting at JFK, and a valid trip is guaranteed so the degree conditions already hold. The right tool is Hierholzer. I keep a stack starting with JFK. While the top airport has an unused ticket I take the smallest one (I sort each airport's destinations in reverse so pop gives the smallest) and push the destination. When the top has no tickets left, that airport is the last stop of whatever remains unresolved, so I pop it into the route. The route comes out backwards, so I reverse it. Trace on JFK->KUL, JFK->NRT, NRT->JFK: stack [JFK], take KUL, KUL is a dead end, route [KUL]. Back to JFK, take NRT, then JFK, which has nothing left: route [KUL, JFK, NRT, JFK]; reversing gives JFK, NRT, JFK, KUL, matching the smallest-first rule even though KUL looked smaller at the start. Edge cases: duplicate tickets are separate edges; tickets that loop back. Cost: O(E log E) for the sort, O(E) space.`,
      1192: `I restate it: a connected network of servers and two-way cables; return every cable whose removal would leave some servers unable to reach each other. Brute force removes each cable in turn and runs a BFS to check connectivity, O(E·(V+E)), far too slow for 10^5 servers. The key observation is that a critical cable is exactly a bridge, an edge that lies on no cycle, and a single DFS can find them all. I give every server a discovery time disc and track low, the earliest disc reachable from its subtree using tree edges downward and at most one back edge. When I finish a child v of u, I lift low[u] = min(low[u], low[v]). If low[v] > disc[u], nothing in v's subtree can reach u or higher, so the cable u-v is the only link holding that subtree on, and it is a bridge. I skip the cable I arrived by using its edge id, not the parent node, so two parallel cables correctly count as a way around. Because a chain of 10^5 servers would blow the recursion limit, I run the DFS with an explicit stack and a next-neighbor index per node, and update the parent's low when a node is popped. Trace on 0-1, 1-2, 2-0, 1-3: low of 2 becomes 0 through the back edge to 0, low of 1 becomes 0, and low of 3 stays 3 which is greater than disc[1]=1, so only [1,3] is reported. Cost: O(V + E) time and space.`,
      2097: `I restate it: I get pairs [start, end] and must reorder them so that each pair's end equals the next pair's start, using every pair once; a valid arrangement is guaranteed. Brute force tries orders of the pairs and backtracks, which is exponential. The observation is that the numbers are nodes and each pair is a directed edge from start to end, so chaining pairs means walking every edge exactly once, an Eulerian path. Since a valid answer exists, the degrees already work out; I only need the right start node. I compute out-degree minus in-degree for every number: if some number has out - in = 1, it must be the start. If all are balanced the route is a circuit and any node with an edge works, so I take the first pair's start. Then I run Hierholzer: a stack with the start, repeatedly push an unused neighbor of the top node (using a dict of lists and pop); when the top has no unused edge, pop it into the route. Reverse the route; consecutive nodes are the pairs. Trace on [[5,1],[4,5],[11,9],[9,4]]: 11 has out 1 and in 0, so start 11. The walk goes 11, 9, 4, 5, 1 and 1 has no edges, then everything pops back, giving route 1,5,4,9,11 and reversed 11,9,4,5,1, so pairs [11,9],[9,4],[4,5],[5,1]. Edge cases: one pair; pairs forming a circuit. Cost: O(E) time with a dict and O(E) space.`
    }
  };
})();
