/* Offer Ready: extra lesson material for topological sort (primer, think, breakdown, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  var J = function (a) { return a.join('\n'); };
  OR.extras['topo-sort'] = {
    primer: {
      kind: 'technique',
      what: 'A **topological sort** lines up the nodes of a directed graph so that every arrow points forward, like getting dressed: socks before shoes, trousers before belt. It exists exactly when the graph has no cycle (a **DAG**, directed acyclic graph).',
      does: 'It solves "do these rules allow one valid order, and what is one?" problems: prerequisites, build steps, install order. It doubles as a cycle detector for directed graphs. The cost is O(V + E): every node is emitted once and every edge released once.',
      impl: '**Kahn algorithm:** count the **in-degree** of each node (arrows pointing into it), put the nodes with 0 in a `deque`, repeatedly emit one and lower the in-degree of its targets, queueing any that reach 0. If fewer than n nodes come out, there is a cycle. The depth-first twin uses three colours and reverses the finish order.',
      possibilities: 'Course schedules (can I finish, in what order), build and package dependency order, deciding an unknown alphabet from sorted words, spreadsheet recalculation order, minimum number of rounds or semesters (longest chain), and peeling leaves of a tree layer by layer.'
    },

    think: [
      {
        q: 'Edges are 0 to 1, 0 to 2, 1 to 3, 2 to 3. Predict the order Kahn produces. Then add the edge 3 to 0: what happens?',
        a: 'In-degrees are 0:0, 1:1, 2:1, 3:2. Only 0 is free, so the output starts 0; that frees 1 and 2, giving **0, 1, 2, 3**. With the extra edge 3 to 0, node 0 now has in-degree 1, so **nothing** is free at the start: the queue is empty and the output has 0 nodes. The cycle 0, 1, 3, 0 holds every node hostage. The aha: a cycle shows up as a loop that stops early, not as an error.'
      },
      {
        q: 'The prerequisite pair is [1, 0] meaning "to take course 1 you must first take course 0". Which way does the arrow point, and which node gets the in-degree?',
        a: 'The arrow points from the thing that comes **first** to the thing that waits: 0 to 1. Node 1 gets the in-degree, because it is the one still waiting. Reading the pair in the order it is written is the classic mistake and gives a mirrored answer. Say the direction out loud before you code.'
      },
      {
        q: 'Kahn finished with 3 nodes emitted out of 5. Why does that prove a cycle, and which nodes are the culprits?',
        a: 'A node is emitted only when everything it waits for has been emitted. The 2 leftover nodes (and anything that depends on a stuck node) still have in-degree above 0, which means each waits on a node that is itself waiting. Following "who am I waiting for" among them must eventually repeat, so there is a cycle. The leftover nodes are the cycle plus whatever hangs off it.'
      },
      {
        q: 'Why does reversing the finish order of a DFS give a valid topological order?',
        a: 'A node finishes only after every node it points to has finished, because the DFS had to explore all of them before returning. So in the finish list, targets come before their sources, and the reversed list has every source before its targets, which is exactly what every arrow needs. The aha: the finish order is an upside-down answer.'
      },
      {
        q: 'Three tasks: A before C, B before C. How many valid orders are there, and what does the queue look like at the start of Kahn?',
        a: 'Two: A, B, C and B, A, C. At the start the queue holds **both A and B**, because both have in-degree 0, and picking either first is valid. Whenever the queue holds more than one node, you have a choice, and each choice is a different valid order. That is also why you can ask whether the order is unique: it is unique only if the queue never holds two nodes at once.'
      },
      {
        q: 'You need the minimum number of rounds to finish all tasks if independent tasks run at the same time. Is that the same problem as listing an order?',
        a: 'Same graph, different question. The number of rounds is the length of the **longest chain** of dependencies, because tasks on that chain cannot overlap. In Kahn, process the queue one layer at a time (everything free right now is one round) and count the layers. If the layers do not cover every node, there is a cycle.'
      }
    ],

    breakdown: [
      {
        title: '1. Raw idea: arrows that say "this first"',
        body: J([
          'Five tasks numbered 0 to 4 with rules written as arrows (first, then):',
          '`4 -> 2, 4 -> 1, 2 -> 3, 1 -> 3, 3 -> 0`.',
          'So 4 must happen before 2 and 1; 2 and 1 must both happen before 3; 3 must happen before 0. We want a single row of all five tasks in which every arrow points to the right. Brute force would try all 120 orderings and check the rules. Better: always do something that nothing is still blocking, then cross it off. In an interview you spot it when the statement says "before", "prerequisite", "depends on", or "can this ever finish".'
        ])
      },
      {
        title: '2. The number to track: in-degree',
        body: J([
          'The **in-degree** of a node is how many arrows point into it, that is how many things it still waits for.',
          '```',
          'node        0  1  2  3  4',
          'in-degree   1  1  1  2  0',
          '```',
          'Node 4 has 0, so it waits for nothing and is safe to do first. We also keep, for each node, the list of nodes its arrows point to (`graph[4] = [2, 1]`, `graph[2] = [3]`, `graph[1] = [3]`, `graph[3] = [0]`). Build both in one pass over the edges. Nodes with no edges at all still exist and have in-degree 0.'
        ]),
        code: { py: `from collections import deque

def build(n, edges):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:        # a must come before b
        graph[a].append(b)
        indeg[b] += 1         # b waits for one more thing
    return graph, indeg` }
      },
      {
        title: '3. The loop, traced by hand (Kahn)',
        body: J([
          'Put every node with in-degree 0 in a queue, then repeat: take one, write it down, lower the in-degree of everything it points to, queue any that hit 0.',
          '```',
          'start         queue [4]          order []',
          'take 4        2:1->0, 1:1->0     queue [2, 1]   order [4]',
          'take 2        3:2->1             queue [1]      order [4, 2]',
          'take 1        3:1->0             queue [3]      order [4, 2, 1]',
          'take 3        0:1->0             queue [0]      order [4, 2, 1, 3]',
          'take 0                           queue []       order [4, 2, 1, 3, 0]',
          '```',
          'All five came out, so the order **4, 2, 1, 3, 0** is valid: check each arrow, 4 before 2 and 1, both before 3, 3 before 0. Cost O(V + E).'
        ]),
        code: { py: `def kahn(n, edges):
    graph, indeg = build(n, edges)
    queue = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return order      # shorter than n means a cycle` }
      },
      {
        title: '4. Cycles: the loop stops early',
        body: J([
          'Add one more rule, `3 -> 1`. Now node 1 waits for both 4 and 3, so its in-degree is 2.',
          '```',
          'start    queue [4]',
          'take 4   2:1->0, 1:2->1       queue [2]      order [4]',
          'take 2   3:2->1               queue []       order [4, 2]',
          '```',
          'The queue is empty after only 2 of 5 nodes. Nodes 1, 3 and 0 are stuck: 1 waits for 3, and 3 waits for 1. That is a cycle (and 0 hangs off it). The code does not complain, it just returns a short list, so **always compare the length with n**. Self-loops (`3 -> 3`) behave the same: the node waits for itself and never reaches 0. For "can all be finished" you return `len(order) == n`; for "give me the order" you return `[]` on a short list.'
        ])
      },
      {
        title: '5. Ties and many valid orders',
        body: J([
          'When the queue holds two or more nodes, any one may go next. In step 3 after taking 4, the queue was `[2, 1]`; taking 1 first would give `4, 1, 2, 3, 0`, also valid. So a graph usually has **many** correct answers, and a problem that says "any valid order" accepts all of them. If it asks for the **smallest** order (lowest label first), replace the queue with a min-heap (`heapq`), so each step emits the smallest free node; cost becomes O(V log V + E). If it asks whether the order is **unique**, check that the queue never holds more than one node. Duplicate edges are fine as long as in-degree is counted once per copy and released once per copy.'
        ])
      },
      {
        title: '6. Rounds: process one layer at a time',
        body: J([
          'If independent tasks run in parallel, how many rounds are needed? Process the queue **a layer at a time**: freeze its length, handle exactly that many nodes, count one round.',
          '```',
          'round 1: [4]        frees 2, 1',
          'round 2: [2, 1]     frees 3',
          'round 3: [3]        frees 0',
          'round 4: [0]',
          '```',
          'Four rounds, which equals the longest chain 4 -> 2 -> 3 -> 0 (4 nodes). If the nodes handled in total are fewer than n, return -1 for a cycle. With task durations, carry a `finish[v] = max(finish[v], finish[u] + duration[v])` instead of counting rounds. Spot it when the question asks for "minimum semesters", "minimum time", or "longest chain".'
        ])
      },
      {
        title: '7. The DFS twin: three colours',
        body: J([
          'Colour each node white (unseen), gray (on the current path), black (finished). Visit a node by painting it gray, visiting each target, painting it black, then appending it to a list. Reaching a **gray** node means a cycle. On our graph from node 4 (targets in list order 2, 1):',
          '```',
          'visit 4 -> visit 2 -> visit 3 -> visit 0',
          'finish 0, finish 3, finish 2',
          'visit 1 (3 is black, skip), finish 1',
          'finish 4',
          'finish list [0, 3, 2, 1, 4]  reversed: [4, 1, 2, 3, 0]',
          '```',
          'That is also a valid order: 4 first, then 1 and 2, then 3, then 0. Use DFS when you already have a recursive helper, or only need cycle detection; use Kahn for layers and very deep chains (Python recursion stops near 1000).'
        ]),
        code: { py: `def dfs_topo(n, edges):
    graph = [[] for _ in range(n)]
    for a, b in edges:
        graph[a].append(b)
    color, post = [0] * n, []        # 0 new, 1 on path, 2 done

    def visit(u):
        color[u] = 1
        for v in graph[u]:
            if color[v] == 1:
                return False         # back to the current path: cycle
            if color[v] == 0 and not visit(v):
                return False
        color[u] = 2
        post.append(u)
        return True

    for u in range(n):
        if color[u] == 0 and not visit(u):
            return []
    return post[::-1]` }
      }
    ],

    drills: [
      {
        title: 'Spreadsheet recalculation order',
        q: J([
          'A spreadsheet stores, for each formula cell, the list of cells it reads. Given a dict `deps` mapping a cell name to the cells it depends on, return a list of **all** cells (including cells that appear only as dependencies, which are plain values) in an order where every cell comes after the cells it depends on. Return `None` if the formulas are circular.',
          '',
          'Example: `{"C": ["A", "B"], "B": ["A"]}` returns `["A", "B", "C"]`.'
        ]),
        hint: 'A cell that only appears inside a list still needs to be a node. The arrow goes from the cell read to the cell that reads it.',
        how: J([
          'I restate it: evaluate cells in an order where each formula is computed after everything it reads, or report a circular reference. Brute force: repeatedly scan all cells for one whose inputs are all computed. That is O(n squared) and gives no clean way to notice a cycle.',
          '',
          'The observation: "X must come after Y" is an arrow Y to X, so this is a topological sort of the dependency graph. Two details. First, a name that only ever appears as an input, like A in the example, is a node too, with nothing to wait for. I collect every name from both keys and values before building. Second, the pairing: deps[c] = [A, B] means A and B come first, so the arrows are A to c and B to c, and the in-degree of c is the number of its inputs.',
          '',
          'Trace on the example: nodes A, B, C. Arrows A to B, A to C, B to C. In-degrees A 0, B 1, C 2. Queue [A]. Take A: B drops to 0 (queue it), C drops to 1. Take B: C drops to 0. Take C. Order A, B, C.',
          '',
          'To keep the output deterministic I process names in sorted order. Edge cases: an empty dict returns an empty list; a cell that depends on itself has in-degree that never reaches zero, so the output is short and I return None; duplicates in a dependency list are counted once per copy, and released once per copy, so the counts stay consistent. Cost O(V + E).'
        ]),
        code: { py: `from collections import deque

def eval_order(deps):
    nodes = set(deps)
    for cells in deps.values():
        nodes.update(cells)
    users = {c: [] for c in nodes}      # cell -> cells that read it
    indeg = {c: 0 for c in nodes}
    for cell, inputs in deps.items():
        for src in inputs:
            users[src].append(cell)
            indeg[cell] += 1
    queue = deque(sorted(c for c in nodes if indeg[c] == 0))
    order = []
    while queue:
        c = queue.popleft()
        order.append(c)
        for u in users[c]:
            indeg[u] -= 1
            if indeg[u] == 0:
                queue.append(u)
    return order if len(order) == len(nodes) else None` },
        explain: 'Each cell is emitted only after all of its inputs, and any circular reference leaves its cells with a positive in-degree forever, so the output is short and we return None. Time O(V + E), space O(V + E).',
        check: J([
          "def valid(deps, order):",
          "    pos = {c: i for i, c in enumerate(order)}",
          "    return all(pos[s] < pos[c] for c, ins in deps.items() for s in ins)",
          "d1 = {'C': ['A', 'B'], 'B': ['A']}",
          "assert eval_order(d1) == ['A', 'B', 'C']",
          "assert eval_order({}) == []",
          "assert eval_order({'A': ['A']}) is None",
          "assert eval_order({'A': ['B'], 'B': ['C'], 'C': ['A']}) is None",
          "d2 = {'D': ['B', 'C'], 'B': ['A'], 'C': ['A'], 'E': []}",
          "o2 = eval_order(d2)",
          "assert sorted(o2) == ['A', 'B', 'C', 'D', 'E'] and valid(d2, o2)",
          "assert eval_order({'X': ['Y', 'Y']}) == ['Y', 'X']"
        ])
      },
      {
        title: 'Lowest label first',
        q: J([
          'There are `n` tasks numbered `0` to `n - 1` and pairs `[a, b]` meaning task `a` must come before task `b`. Return the order that is smallest when compared position by position (so a smaller label early wins), or `[]` if the rules contain a cycle.',
          '',
          'Example: `n = 4`, `edges = [[3, 0], [1, 2]]` returns `[1, 2, 3, 0]`.'
        ]),
        hint: 'Kahn keeps a collection of free tasks. Which collection hands you the smallest one each time?',
        how: J([
          'I restate it: among all valid orders pick the lexicographically smallest one. Brute force: generate every valid order and compare them. A graph with no edges has n factorial orders, so that is hopeless.',
          '',
          'The observation: at each position, any currently free task (in-degree 0) is a legal choice, and no other task is. To make the sequence as small as possible, the first position should hold the smallest legal label, then the second should hold the smallest legal label given that, and so on. This greedy is safe because choosing the smallest free label never makes a later choice impossible: removing a free node only frees more nodes.',
          '',
          'So it is Kahn with a min-heap instead of a queue. On the example: in-degrees are 0:1, 1:0, 2:1, 3:0. Heap holds [1, 3]. Pop 1, order [1], node 2 becomes free, heap [2, 3]. Pop 2, order [1, 2]. Pop 3, order [1, 2, 3], node 0 becomes free. Pop 0. Result [1, 2, 3, 0]. A plain queue seeded in label order would have given [1, 3, 2, 0], which is a valid order but not the smallest.',
          '',
          'Edge cases: no edges returns 0..n-1; a cycle leaves a short list so return []; n = 0 returns []. Cost: each node enters and leaves the heap once, O(V log V + E).'
        ]),
        code: { py: `import heapq

def smallest_order(n, edges):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    heap = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        u = heapq.heappop(heap)
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(heap, v)
    return order if len(order) == n else []` },
        explain: 'At every step the legal choices are exactly the free nodes; taking the smallest never blocks later choices, so the greedy yields the lexicographically smallest order. A cycle leaves nodes unreleased, giving a short result. O(V log V + E).',
        check: J([
          'assert smallest_order(4, [[3, 0], [1, 2]]) == [1, 2, 3, 0]',
          'assert smallest_order(3, []) == [0, 1, 2]',
          'assert smallest_order(0, []) == []',
          'assert smallest_order(3, [[0, 1], [1, 2], [2, 0]]) == []',
          'assert smallest_order(5, [[4, 0], [4, 1], [2, 3]]) == [2, 3, 4, 0, 1]',
          'assert smallest_order(3, [[2, 1], [1, 0]]) == [2, 1, 0]'
        ])
      },
      {
        title: 'Is there only one way?',
        q: J([
          'Given `n` items and pairs `[a, b]` meaning `a` ranks above `b`, return `True` if the pairs force **exactly one** possible ranking of all `n` items, and `False` if there is more than one ranking or none (a contradiction).',
          '',
          'Example: `n = 3`, `edges = [[0, 1], [1, 2]]` returns `True`; `edges = [[0, 1], [0, 2]]` returns `False` (1 and 2 can swap).'
        ]),
        hint: 'Two valid orders exist as soon as there is a moment with a real choice. When does Kahn have a choice?',
        how: J([
          'I restate it: do the rules pin down every item position, with no freedom at all? Brute force would enumerate all valid orders and count them, which is exponential in the worst case.',
          '',
          'The observation: Kahn emits one node per step, and every node in the queue at that moment is a legal choice. If two or more nodes are in the queue at the same moment, I can emit either one first, and the two choices lead to different orders. So the order is unique exactly when the queue has size one at every step and the whole graph is consumed. I do not need to count anything, only to watch the queue size.',
          '',
          'Trace on the chain 0 to 1 to 2: in-degrees 0, 1, 1. Queue [0] (size 1). Take 0, node 1 is freed, queue [1] (size 1). Take 1, queue [2]. Take 2. Never saw two: unique. On edges 0 to 1 and 0 to 2: queue [0], take it, both 1 and 2 are freed, queue [1, 2] has size 2: not unique, return False.',
          '',
          'Edge cases: a cycle ends with fewer than n nodes emitted, so there is no valid ranking and the answer is False; no edges with n greater than 1 starts with a queue of n nodes, so False; n = 1 gives True. Cost O(V + E).'
        ]),
        code: { py: `from collections import deque

def unique_order(n, edges):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    queue = deque(i for i in range(n) if indeg[i] == 0)
    emitted = 0
    while queue:
        if len(queue) > 1:
            return False          # a real choice means two valid orders
        u = queue.popleft()
        emitted += 1
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return emitted == n` },
        explain: 'A topological order is unique iff at every step exactly one node is available. If the queue ever holds two, swapping them gives another valid order; if it is always one, every position is forced. The final length check rules out cycles. O(V + E).',
        check: J([
          'assert unique_order(3, [[0, 1], [1, 2]]) is True',
          'assert unique_order(3, [[0, 1], [0, 2]]) is False',
          'assert unique_order(1, []) is True',
          'assert unique_order(2, []) is False',
          'assert unique_order(3, [[0, 1], [1, 2], [2, 0]]) is False',
          'assert unique_order(4, [[0, 1], [1, 2], [2, 3], [0, 3]]) is True',
          'assert unique_order(0, []) is True'
        ])
      },
      {
        title: 'Earliest finish with durations',
        q: J([
          'Tasks `0` to `n - 1` each take `duration[i]` time units. A pair `[a, b]` means `b` cannot start until `a` has finished. Any number of tasks may run at the same time. Return the earliest time at which **all** tasks are finished, or `-1` if the rules are circular.',
          '',
          'Example: `duration = [3, 2, 4, 1]`, `edges = [[0,1],[0,2],[1,3],[2,3]]` returns `8` (task 0 ends at 3, task 2 at 7, task 3 starts at 7 and ends at 8).'
        ]),
        hint: 'A task starts when the last of its prerequisites ends. Carry a finish time along the Kahn loop.',
        how: J([
          'I restate it: with unlimited parallelism, each task starts as soon as all its prerequisites are done, and I want the time the last task ends. A simulation over time ticks would work but wastes steps and is awkward with big durations. The real structure is a longest path in a DAG: the total time is the most expensive chain of dependent tasks.',
          '',
          'The observation: if I know the finish time of every prerequisite of v, then v finishes at (the latest of those) plus duration[v]. Kahn emits a node only after all its prerequisites, so at that moment the finish time of the prerequisites is final. So I carry `start[v]`, the latest finish among v prerequisites seen so far, and update it as each prerequisite is emitted: start[v] = max(start[v], finish[u]). When v is emitted, finish[v] = start[v] + duration[v].',
          '',
          'Trace on the example: durations 3, 2, 4, 1. Queue [0]. Take 0: finish 3; starts of 1 and 2 become 3; both freed. Take 1: finish 5; start of 3 becomes 5, in-degree 1 left. Take 2: finish 7; start of 3 becomes 7, freed. Take 3: finish 8. Answer 8, the max of all finishes.',
          '',
          'Edge cases: no edges means the answer is the largest duration; a cycle leaves nodes unemitted so return -1; n = 0 returns 0. Cost O(V + E).'
        ]),
        code: { py: `from collections import deque

def earliest_finish(duration, edges):
    n = len(duration)
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    start = [0] * n
    queue = deque(i for i in range(n) if indeg[i] == 0)
    done, total = 0, 0
    while queue:
        u = queue.popleft()
        done += 1
        finish = start[u] + duration[u]
        total = max(total, finish)
        for v in graph[u]:
            start[v] = max(start[v], finish)
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return total if done == n else -1` },
        explain: 'The finish time of a task is its duration plus the latest finish among its prerequisites. Kahn processes a task only after all prerequisites, so every start value is final when used. This is the longest path in a DAG, O(V + E).',
        check: J([
          'assert earliest_finish([3, 2, 4, 1], [[0, 1], [0, 2], [1, 3], [2, 3]]) == 8',
          'assert earliest_finish([5, 2, 9], []) == 9',
          'assert earliest_finish([], []) == 0',
          'assert earliest_finish([1, 1], [[0, 1], [1, 0]]) == -1',
          'assert earliest_finish([2, 3, 4], [[0, 1], [1, 2]]) == 9',
          'assert earliest_finish([1, 10, 1, 1], [[0, 1], [1, 3], [0, 2], [2, 3]]) == 12'
        ])
      }
    ],

    how: {
      207: J([
        'I restate it: courses with "take b before a" rules, and I only need to say whether every course can be completed. Brute force: try all orderings, or for each course walk its prerequisite chain looking for itself. Both repeat work badly.',
        '',
        'The key observation: a valid schedule exists exactly when the rules, drawn as arrows b to a, have no cycle. A cycle means courses waiting on each other forever. So I do not need the order, only a yes or no, but producing the order is the easiest way to find out.',
        '',
        'I use Kahn: build graph[need] containing course, and count indeg[course]. Queue all courses with in-degree 0 and count how many I take. Each time I take one, I lower the in-degree of the courses it unlocks and queue any that reach 0. Trace on 2 courses with [[1,0],[0,1]]: both have in-degree 1, the queue starts empty, taken = 0, which is less than 2, so false. On [[1,0]]: take 0, which frees 1; take 1; taken 2: true.',
        '',
        'Edge cases: no prerequisites is true; a self-requirement like [[0,0]] gives course 0 in-degree 1 forever, false; courses in no pair are free from the start. I return taken == numCourses. Cost: every course is taken once, every pair released once, O(V + E).'
      ]),
      210: J([
        'I restate it: same rules as the previous problem, but now I return an actual order in which to take every course, or an empty list when impossible. Brute force would permute all courses and test each, which is factorial.',
        '',
        'The key observation: the order in which Kahn emits courses is already a valid schedule. A course is emitted only after its in-degree reached 0, which means every prerequisite was emitted before it. So the only new code is to append each emitted course to a list.',
        '',
        'Trace on 4 courses with [[1,0],[2,0],[3,1],[3,2]]: arrows 0 to 1, 0 to 2, 1 to 3, 2 to 3. In-degrees 0,1,1,2. Queue [0]. Take 0: both 1 and 2 reach 0, queue [1,2]. Take 1: 3 drops to 1. Take 2: 3 drops to 0. Take 3. Order [0,1,2,3]. Another valid answer is [0,2,1,3], since 1 and 2 are independent, and the problem accepts any.',
        '',
        'The detail that loses marks: if the list is shorter than numCourses there is a cycle, and I must return an empty list, not the partial list. Other edge cases: one course with no rules returns [0]; courses with no pairs are free and appear. Cost O(V + E) time and space.'
      ]),
      269: J([
        'I restate it: a list of words is sorted according to an unknown alphabet, and I must recover a possible letter order, or return an empty string if the words contradict themselves. Brute force over all permutations of up to 26 letters is impossible.',
        '',
        'The key observation: sorted words give me precedence facts. For two neighbouring words, the first position where they differ says the letter in the earlier word comes before the letter in the later word. After that position nothing is known. Facts are directed pairs of letters, so I topologically sort the letters.',
        '',
        'Details I must get right. Every letter that appears anywhere is a node, even if it ends up with no rule. I compare only adjacent words, because sortedness is transitive. If a longer word is followed by its own prefix, like abc then ab, no letter differs and yet the input is invalid, so I return the empty string. Trace on [wrt, wrf, er, ett, rftt]: rules t before f, w before e, r before t, e before r. Kahn: only w has in-degree 0; emit w, then e, then r, then t, then f. Result wertf.',
        '',
        'If fewer letters come out than exist, the rules form a cycle, so return the empty string. Cost: O(total characters) to read the words plus O(V + E) over at most 26 letters.'
      ]),
      310: J([
        'I restate it: in a tree I may pick any node as root, and I want every root that gives the smallest height. Brute force: root at each node and measure the height, O(n squared) overall, too slow for large n.',
        '',
        'The key observation: the best roots sit at the middle of the longest path of the tree, the centre, and there are only one or two of them. To find the centre without measuring heights, peel the tree like an onion: repeatedly remove all current leaves (nodes of degree 1). What remains in the end, one or two nodes, is the centre. This is Kahn running on an undirected tree, where degree 1 plays the role of in-degree 0.',
        '',
        'Trace on n = 6, edges 3-0, 3-1, 3-2, 3-4, 5-4: degrees 3:4, 4:2, others 1. Leaves are 0,1,2,5. Remove them all in one layer: 6 - 4 leaves 2 nodes, and the degrees of 3 and 4 drop to 1, so they are the next leaves. The loop stops because at most 2 nodes remain, and the answer is [3, 4].',
        '',
        'I peel a whole layer at once; removing leaves one at a time could shave one branch before another and give the wrong centre. Edge cases: n = 1 returns [0] (its degree is 0, so it is never a leaf); n = 2 returns both. Cost O(n).'
      ]),
      802: J([
        'I restate it: in a directed graph, a node is safe if every path starting at it ends at a terminal node (no outgoing edges); nodes on or leading into a cycle are unsafe. I return the safe nodes in sorted order. Brute force: DFS from each node, checking all paths, which repeats work.',
        '',
        'The key observation: a node is safe exactly when all of its targets are safe. Terminal nodes are safe because they have no targets. That is a "peel from the sinks" process, which is Kahn on the reversed graph. The count to track is the out-degree: how many of my targets are not yet known to be safe.',
        '',
        'Plan: reverse every edge (rev[v] lists the nodes that point at v), set outdeg[u] = len(graph[u]), queue all nodes with out-degree 0. When I take a safe node v, each node u that points at v loses one unresolved target, so I lower outdeg[u], and when it reaches 0, u is safe too. Trace on [[1],[0],[]]: node 2 is terminal and safe; nodes 0 and 1 point at each other, so their out-degrees never reach 0 and they are not safe. Result [2].',
        '',
        'Edge cases: all nodes terminal means all are safe; a self-loop is an unsafe cycle. Sort the output at the end. Cost O(V + E).'
      ]),
      1136: J([
        'I restate it: courses numbered from 1 with relations "a before b". Each semester I may take any number of courses whose prerequisites were completed in earlier semesters. I want the minimum number of semesters, or -1 if a cycle makes it impossible.',
        '',
        'The key observation: the answer is the length of the longest chain of dependent courses, since those cannot overlap. Everything else can be packed alongside. Kahn does this naturally if I process it one layer at a time: all courses with in-degree 0 right now form one semester, taking them frees the next set.',
        '',
        'Trace on n = 4, relations [[2,1],[3,1],[1,4]]: arrows 2 to 1, 3 to 1, 1 to 4. In-degrees 1:2, 4:1, 2:0, 3:0. Semester 1: queue [2,3], taking both drops 1 to 0. Semester 2: [1], frees 4. Semester 3: [4]. Answer 3, matching the chain 2 to 1 to 4.',
        '',
        'In code I freeze the queue length at the start of each round and count one semester per round, and I count the courses taken in total. If the total is less than n, a cycle stranded some courses, so return -1. Edge cases: no relations gives 1 semester (everything is free at once); n = 1 gives 1. Cost O(V + E).'
      ])
    }
  };
})();
