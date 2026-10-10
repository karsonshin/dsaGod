/* Offer Ready: extra lesson material for union-find (primer, think, breakdown, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  var J = function (a) { return a.join('\n'); };
  OR.extras['union-find'] = {
    primer: {
      kind: 'structure',
      what: 'A **union-find** (also called a disjoint set) keeps items split into groups, like students sorted into clubs where each club has exactly one **captain**. You can ask "are these two in the same club?" and "merge these two clubs", but you can never split a club apart.',
      does: '`find(x)` returns the captain (the **root**) of the group of x; `union(a, b)` merges two groups, or reports that they were already one. With path compression and union by size each operation costs O(α(n)), which is effectively constant. A counter of groups comes for free.',
      impl: 'A **parent list**: `parent[i]` is the parent of item i, and a root points to itself. `find` climbs to the root and re-points the nodes it passed straight at it (**compression**); `union` hangs the smaller tree under the larger (**union by size**, tracked in a `size` list). Plain Python lists, no library.',
      possibilities: 'Counting connected components, finding the edge that closes a cycle (redundant connection), checking that a graph is a tree, merging accounts that share an email, equality constraints such as a==b, grouping grid cells as land appears, and Kruskal minimum spanning tree.'
    },

    think: [
      {
        q: 'Start with parent = [0, 1, 2, 3, 4] and use the simple rule union(a, b): parent[find(a)] = find(b). Do union(0, 1), union(2, 3), union(1, 3). What is the parent list, and what does find(0) return?',
        a: 'union(0,1) sets parent[0]=1, giving [1,1,2,3,4]. union(2,3) sets parent[2]=3, giving [1,1,3,3,4]. union(1,3): the roots are 1 and 3, so parent[1]=3, giving **[1,3,3,3,4]**. find(0) walks 0 to 1 to 3 and returns **3**. There are 2 groups left: {0,1,2,3} and {4}. The aha: only roots get re-pointed, so the whole group of 1 (including 0) moves in a single assignment.'
      },
      {
        q: 'Do union(0,1), union(0,2), union(0,3) with the simple rule above. What shape is the tree, and what goes wrong? How does union by size change it?',
        a: 'Each union hangs the old root under the new item, so the tree becomes a chain 0 to 1 to 2 to 3, and find(0) walks 3 hops. With n items, a find costs O(n), which defeats the purpose. With union by size the one-node tree is always hung under the bigger one, so all of 1, 2, 3 point straight at 0 and every find takes 1 hop. The aha: keep the trees short by always hanging the small under the big.'
      },
      {
        q: 'Why must you compare find(a) == find(b) to test "same group", and not parent[a] == parent[b]?',
        a: 'Two items in the same group can have different parents, for example 0 pointing at 1 and 2 pointing at 3 while 1 points at 3. Only the root is the same for everyone in the group. Comparing parents gives false negatives, comparing roots is exactly the definition of "same group".'
      },
      {
        q: 'You add the edges 0-1, 1-2, 2-0 one at a time and call union on each. What do the three calls return, and what does the last one mean?',
        a: 'The first two return True (two merges, 3 groups become 1). The third finds that 2 and 0 already have the same root and returns **False**. That False is the signal that this edge connects two nodes that were already connected, which means it closes a cycle. In a graph with n nodes, successful unions number at most n - 1, and every extra edge is a cycle edge.'
      },
      {
        q: 'Edges are given once, in full, and you need to count the components. Union-find or a plain BFS/DFS? What changes if edges keep arriving over time and you must report the count after each?',
        a: 'For a one-time graph either works in O(n + m); a DFS labelling is just as short. When edges **keep arriving**, union-find wins: each new edge is one near-constant union, and the count is updated instantly, whereas a DFS would have to start over each time. Union-find also cannot give you a path or delete an edge; if you need those, use a search.'
      },
      {
        q: 'You start with n groups and make k successful unions. How many groups are there? Why is it exactly that?',
        a: 'Exactly **n - k**. Every successful union merges two different groups into one, so it reduces the group count by exactly one; a failed union changes nothing. That is why the template keeps a `count` that starts at n and drops by one inside the successful branch, and why "number of components" problems are one subtraction.'
      }
    ],

    breakdown: [
      {
        title: '1. Raw idea: ask the captain, not the members',
        body: J([
          'Six people, 0 to 5, start in six separate clubs. Merge facts arrive: "0 and 1 are linked", "2 and 3", "4 and 5", then "1 and 3". Naive plan: keep a label per person and, on every merge, rewrite all labels of one club. That costs O(n) per merge. Better plan: each club has one **captain**; to ask whether two people are together, ask each for their captain and compare. To merge, one captain starts reporting to the other. The picture is a **forest** of trees where each root is a captain. Spot it in an interview: groups keep merging, and you are asked "same group?" or "how many groups?".'
        ])
      },
      {
        title: '2. Store it: a parent list and find',
        body: J([
          '`parent[i]` is the person that i reports to; a captain reports to themselves. At the start:',
          '```',
          'parent = [0, 1, 2, 3, 4, 5]     six roots, six groups, count = 6',
          '```',
          '`find(x)` climbs: while `parent[x] != x`, move to `parent[x]`. The node you stop at is the root. Edge cases: a single node is its own root; nodes never mentioned stay separate groups. Without any tricks, a bad sequence of merges can build a long chain, and a find then walks O(n) steps. The next steps fix that.'
        ])
      },
      {
        title: '3. Union, traced by hand',
        body: J([
          '`union(a, b)`: find both roots; if equal return False (already together); otherwise hang one root under the other and lower the count. Here we hang the smaller tree under the larger (ties: under the first root).',
          '```',
          'union(0,1)  roots 0,1 tie   parent = [0,0,2,3,4,5]  count 5',
          'union(2,3)  roots 2,3 tie   parent = [0,0,2,2,4,5]  count 4',
          'union(4,5)  roots 4,5 tie   parent = [0,0,2,2,4,4]  count 3',
          'union(1,3)  roots 0,2 tie   parent = [0,0,0,2,4,4]  count 2',
          'union(0,2)  roots 0,0 SAME  returns False, no change',
          '```',
          'The last call says 0 and 2 are already together: that edge would close a cycle.'
        ]),
        code: { py: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.count = n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.count -= 1
        return True` }
      },
      {
        title: '4. Fix one: path compression',
        body: J([
          'Suppose the tree is a chain: `parent = [1, 2, 3, 3]`, so 0 reports to 1, 1 to 2, 2 to 3 (the captain). `find(0)` takes three hops. While climbing, we can re-point every node we passed straight at the captain:',
          '```',
          'before: parent = [1, 2, 3, 3]',
          'find(0): climb 0 -> 1 -> 2 -> 3, root is 3',
          'compress: parent[0] = 3, parent[1] = 3',
          'after:  parent = [3, 3, 3, 3]',
          '```',
          'The next find from 0, 1 or 2 is a single hop. The tree flattens as a side effect of being used. The set of groups does not change, only the shape. Two common versions: full compression (two passes), or **path halving** (`parent[x] = parent[parent[x]]` in one loop), which is shorter and nearly as good.'
        ])
      },
      {
        title: '5. Fix two: union by size',
        body: J([
          'Hang the **smaller** tree under the larger. Why it helps: a node only gets one level deeper when its tree is the smaller one in a merge, and then it lands in a tree at least twice as big. A tree of n nodes can double only about log2(n) times, so depth is at most log2(n).',
          '```',
          'sizes: root 0 has size 4, root 4 has size 2',
          'union(3,5): find(3)=0, find(5)=4  -> size[0]=4 >= size[4]=2',
          'parent[4] = 0 and size[0] = 6',
          '```',
          'With both fixes the cost per operation is O(α(n)), the inverse Ackermann function, which is at most 4 for any input you will ever meet. Say "nearly constant", not "O(1)". Read `size` only at roots; the value of a non-root is stale.'
        ])
      },
      {
        title: '6. Count and the cycle signal',
        body: J([
          'Two facts carry half of all union-find problems.',
          '1. `count` starts at n and drops by one on every **successful** union. After processing all edges it is the number of components.',
          '2. A union that returns False found both ends already connected. In an undirected graph that means the edge closes a cycle.',
          '```',
          'edges 0-1, 1-2, 2-0  (n = 3)',
          '0-1 -> True,  count 2',
          '1-2 -> True,  count 1',
          '2-0 -> False  <- this edge is the cycle edge',
          '```',
          'A graph with n nodes is a tree exactly when it has n - 1 edges and no failed union. Do not throw the return value of union away.'
        ])
      },
      {
        title: '7. Edge cases, limits and how to spot it',
        body: J([
          'Check: 1-indexed nodes need an array of n + 1 entries; self-edges `a-a` fail the union (same root); repeated edges fail on the second copy; items that are strings need a mapping to indices first (or a dict of parents). Cost: n + m operations at O(α(n)) each, memory O(n).',
          '**Say yes to union-find when:** edges or links arrive one at a time; the question is "connected?", "how many groups?" or "which edge closes a cycle?"; items are grouped by a shared property (same email, equal letter).',
          '**Say no when:** you need a path or distance (use BFS), the direction of edges matters (use DFS, topological sort), or edges get deleted (reverse time and add instead, or use a different structure).'
        ])
      }
    ],

    drills: [
      {
        title: 'Biggest group after each merge',
        q: J([
          'There are `n` people, each starting in a group of their own. You get a list of `[a, b]` merge requests, applied in order. Merging two people already in the same group changes nothing. After each request, record the size of the **largest** group. Return the list of those sizes.',
          '',
          'Example: `n = 5`, `unions = [[0,1],[2,3],[1,2],[3,4]]` returns `[2, 2, 4, 5]`.'
        ]),
        hint: 'Keep a size for each root and a running maximum; only a successful merge can change the maximum.',
        how: J([
          'I restate it: groups merge over time, and after each request I want the biggest group so far. Brute force: after each merge, relabel and count group sizes from scratch, O(n) per request, which is O(n times k) overall. The bottleneck is recomputing sizes that mostly did not change.',
          '',
          'The observation: this is groups merging and queries about groups, which is union-find with a size array. A merge changes exactly one group: the new merged group. Every other group keeps its size. So the running maximum can only change when a merge succeeds, and the only candidate for a new maximum is the merged group, whose size I already have as size[root].',
          '',
          'Trace on the example. Sizes all 1, best = 1. Request (0,1): different roots, merged size 2, best 2. Request (2,3): merged size 2, best stays 2. Request (1,2): roots of {0,1} and {2,3}, merged size 4, best 4. Request (3,4): joins {0,1,2,3} with {4}, size 5, best 5. Output [2, 2, 4, 5].',
          '',
          'Edge cases: a request between two people already together (even a repeated pair, or a person with themselves) leaves everything unchanged but still outputs the current best; an empty request list returns an empty list. Cost: each request is two finds and an update, O(α(n)) per request.'
        ]),
        code: { py: `def largest_after_each(n, unions):
    parent = list(range(n))
    size = [1] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    best = 1 if n else 0
    out = []
    for a, b in unions:
        ra, rb = find(a), find(b)
        if ra != rb:
            if size[ra] < size[rb]:
                ra, rb = rb, ra
            parent[rb] = ra
            size[ra] += size[rb]
            best = max(best, size[ra])
        out.append(best)
    return out` },
        explain: 'Only a successful merge creates a larger group, and the only group that grows is the merged one, whose size is stored at its root, so the running maximum is exact. O(k α(n)) for k requests.',
        check: J([
          'assert largest_after_each(5, [[0, 1], [2, 3], [1, 2], [3, 4]]) == [2, 2, 4, 5]',
          'assert largest_after_each(3, [[0, 1], [1, 0], [0, 0]]) == [2, 2, 2]',
          'assert largest_after_each(1, [[0, 0]]) == [1]',
          'assert largest_after_each(4, []) == []',
          'assert largest_after_each(4, [[0, 1], [2, 3]]) == [2, 2]',
          'assert largest_after_each(6, [[0, 1], [2, 3], [4, 5], [0, 2], [0, 4]]) == [2, 2, 2, 4, 6]'
        ])
      },
      {
        title: 'Count the households',
        q: J([
          'Each person has a list of interests (strings). Two people belong to the same **household** if they share at least one interest, and households chain: if A shares with B and B shares with C, all three are one household. A person with no interests is a household alone. Return the number of households.',
          '',
          'Example: `[["a","b"],["b","c"],["d"],["x","d"],[]]` returns `3` (people 0 and 1; people 2 and 3; person 4).'
        ]),
        hint: 'The things to group are the people. Remember, in a dictionary, who first listed each interest.',
        how: J([
          'I restate it: link people by shared interests, including indirect links, and count the groups. Brute force: compare every pair of people for a shared interest, then merge repeatedly until nothing changes. That is O(n squared) comparisons and fiddly merging logic.',
          '',
          'The observation: sharing is the link, and links chain, so I want connected groups of people: union-find over people. The shortcut that avoids comparing pairs: keep a dictionary from interest to the first person who listed it. When I meet an interest that is already in the dictionary, the current person and that first person share it, so I union them. When it is new, I record the current person as its first owner.',
          '',
          'Trace on the example. Start with 5 groups. Person 0: records a and b. Person 1: b is owned by 0, so union(1, 0), count 4; records c. Person 2: records d. Person 3: x is new; d is owned by 2, so union(3, 2), count 3. Person 4: nothing. Final count 3.',
          '',
          'Edge cases: an empty people list returns 0; a person who lists the same interest twice unions with themselves (same root, no change); all people sharing one interest become one household. Cost: each interest costs a dictionary lookup and at most one union, so O(total interests times α(n)).'
        ]),
        code: { py: `def count_households(people):
    n = len(people)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    first = {}
    count = n
    for i, interests in enumerate(people):
        for t in interests:
            if t in first:
                ra, rb = find(i), find(first[t])
                if ra != rb:
                    parent[ra] = rb
                    count -= 1
            else:
                first[t] = i
    return count` },
        explain: 'Every shared interest links the current person to the first owner, so the groups are exactly the connected components of the sharing relation, and count drops once per real merge. O(S α(n)) for S total interests.',
        check: J([
          "assert count_households([['a', 'b'], ['b', 'c'], ['d'], ['x', 'd'], []]) == 3",
          "assert count_households([]) == 0",
          "assert count_households([['a'], ['a'], ['a']]) == 1",
          "assert count_households([['a'], ['b']]) == 2",
          "assert count_households([['a', 'a']]) == 1",
          "assert count_households([['a', 'b'], ['c', 'd'], ['b', 'c']]) == 1"
        ])
      },
      {
        title: 'When is everyone connected',
        q: J([
          'There are `n` people. A log lists friendships as `[time, a, b]` in no particular order, meaning `a` and `b` became friends at that time. Friendship is mutual and chains. Return the earliest time at which everyone is connected to everyone (directly or through chains), or `-1` if that never happens. With one person, the answer is `0`.',
          '',
          'Example: `n = 4`, `logs = [[3,0,1],[5,2,3],[4,1,2]]` returns `5`.'
        ]),
        hint: 'Time order matters, so put the events in time order first.',
        how: J([
          'I restate it: friendships appear over time and I want the first moment the whole network is one connected piece. Brute force: for each distinct time, build the graph of friendships so far and run a DFS to see whether it is connected. That repeats the whole graph walk for every time.',
          '',
          'The observation: connectivity only ever grows as time passes, and union-find handles growth directly. If I sort the logs by time and apply them one by one, the first moment the number of groups reaches 1 is the answer. The count starts at n and drops by one per successful union; I stop the moment it equals 1.',
          '',
          'Trace on the example. Sorted logs: (3,0,1), (4,1,2), (5,2,3). Count starts at 4. Time 3: union 0 and 1, count 3. Time 4: union 1 and 2, count 2. Time 5: union 2 and 3, count 1, so return 5.',
          '',
          'Edge cases: one person returns 0 without looking at the logs; logs that never connect everyone return -1 after the loop; repeated friendships and already-connected pairs fail the union and change nothing; several logs with the same time are fine, because the answer is that time. Cost: sorting dominates, O(k log k) for k logs, plus O(k α(n)) for the unions.'
        ]),
        code: { py: `def earliest_all_connected(n, logs):
    if n <= 1:
        return 0
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    count = n
    for t, a, b in sorted(logs):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            count -= 1
            if count == 1:
                return t
    return -1` },
        explain: 'Applying friendships in time order means the union-find always represents the network at the current time; the first time only one group remains is the earliest moment of full connection. O(k log k + k α(n)).',
        check: J([
          'assert earliest_all_connected(4, [[3, 0, 1], [5, 2, 3], [4, 1, 2]]) == 5',
          'assert earliest_all_connected(3, [[1, 0, 1]]) == -1',
          'assert earliest_all_connected(1, []) == 0',
          'assert earliest_all_connected(2, [[7, 0, 1], [2, 0, 1]]) == 2',
          'assert earliest_all_connected(3, [[2, 0, 1], [2, 1, 2]]) == 2',
          'assert earliest_all_connected(4, [[1, 0, 1], [2, 2, 3]]) == -1'
        ])
      },
      {
        title: 'Islands as the tide goes out',
        q: J([
          'A `rows` by `cols` grid starts as all water. You are given a list of cells `[r, c]` that turn into land one at a time. After each one, report the number of islands, where land cells touching up, down, left or right are the same island. A cell listed twice only becomes land the first time.',
          '',
          'Example: a 3 by 3 grid with cells `[[0,0],[0,1],[1,2],[2,1],[1,1]]` returns `[1, 1, 2, 3, 1]`.'
        ]),
        hint: 'Re-counting islands after each cell is too slow. Think about what one new land cell can do to the island count.',
        how: J([
          'I restate it: land appears one cell at a time and after each step I need the island count. The brute force re-runs an island count over the whole grid after every new cell, which is O(rows times cols) per step.',
          '',
          'The observation: one new land cell does exactly this. It starts as a new island (count plus one). Then, for each of its land neighbours that belongs to a different island, it joins the two together (count minus one per real merge). Nothing else in the grid changes. Islands only ever merge, never split, which is exactly the shape union-find supports.',
          '',
          'So I number cells as r times cols plus c, keep a parent list and a land flag. Trace on the example. (0,0): count 1. (0,1): count 2, neighbour (0,0) is land and a different island, merge, count 1. (1,2): count 2, no land neighbours. (2,1): count 3, no land neighbours. (1,1): count 4; its neighbours (0,1), (1,2), (2,1) are land in three different islands: three merges, count 1. Output [1, 1, 2, 3, 1].',
          '',
          'Edge cases: a duplicate cell must be ignored but still reports the current count; an empty list returns an empty list; I bounds-check neighbours before indexing. Cost: each cell does at most four unions, so O(k α(rows times cols)) for k cells.'
        ]),
        code: { py: `def islands_over_time(rows, cols, cells):
    parent = list(range(rows * cols))
    land = [False] * (rows * cols)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    count = 0
    out = []
    for r, c in cells:
        i = r * cols + c
        if not land[i]:
            land[i] = True
            count += 1
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and land[nr * cols + nc]:
                    ra, rb = find(i), find(nr * cols + nc)
                    if ra != rb:
                        parent[ra] = rb
                        count -= 1
        out.append(count)
    return out` },
        explain: 'A new land cell adds one island and each successful merge with a neighbouring island removes one, and no other island is affected, so the running count is exact. O(k α(rows × cols)).',
        check: J([
          'assert islands_over_time(3, 3, [[0, 0], [0, 1], [1, 2], [2, 1], [1, 1]]) == [1, 1, 2, 3, 1]',
          'assert islands_over_time(2, 2, [[0, 0], [0, 0]]) == [1, 1]',
          'assert islands_over_time(1, 1, [[0, 0]]) == [1]',
          'assert islands_over_time(2, 2, []) == []',
          'assert islands_over_time(1, 5, [[0, 0], [0, 2], [0, 4], [0, 1], [0, 3]]) == [1, 2, 3, 2, 1]',
          'assert islands_over_time(2, 2, [[0, 0], [1, 1], [0, 1], [1, 0]]) == [1, 2, 1, 1]'
        ])
      }
    ],

    how: {
      684: J([
        'I restate it: a tree with n nodes had one extra edge added, so exactly one cycle exists; edges arrive in order, and I return the edge that can be removed, preferring the one that appears last. Brute force: from the last edge backwards, remove it and check with a DFS whether the rest is still a connected tree. That is O(n) work per edge.',
        '',
        'The key observation: a cycle forms at the moment I add an edge whose two ends are already connected. So I process edges in order with a union-find. For each edge I find both roots. If they are equal, the ends were already connected by earlier edges, so this edge closes the cycle, and I return it. Otherwise I merge the two groups.',
        '',
        'Why the first failing edge is the right one: there is only one cycle, and the earlier edges contain no cycle at all, so the first edge to fail is the last edge of that cycle in input order, exactly the one wanted. Trace on [[1,2],[2,3],[3,1]]: 1-2 merges, 2-3 merges, 3-1 finds the same root, return [3,1]. Trace on [[1,2],[1,3],[2,3]]: the third edge fails, return [2,3].',
        '',
        'Edge cases: nodes are numbered from 1, so the parent array has n + 1 entries. Cost: one pair of finds per edge, O(n α(n)) time, O(n) space.'
      ]),
      323: J([
        'I restate it: n nodes and a list of undirected edges; return how many connected components the graph has. Brute force: DFS or BFS from each unvisited node and count the walks. That is correct and O(n + m), so union-find is an alternative, not a necessity.',
        '',
        'The key observation: start with n separate groups, so n components. Every edge either connects two different groups, which merges them and removes one component, or connects two nodes already in the same group, which changes nothing. So the answer is n minus the number of successful unions. The nice property is that this also works when edges arrive as a stream.',
        '',
        'I keep a parent list and a count equal to n. For each edge, find both roots; if they differ, link them and decrement the count. Trace on n = 5 with [[0,1],[1,2],[3,4]]: count 5; edge 0-1 merges, 4; edge 1-2 merges, 3; edge 3-4 merges, 2. Answer 2. With edges [[0,1],[1,0]] the second edge fails the union and does not decrement.',
        '',
        'Edge cases: no edges returns n; a single node returns 1; duplicate edges and self-loops fail the union harmlessly. Cost: O((n + m) α(n)) time, O(n) space.'
      ]),
      261: J([
        'I restate it: given n nodes and a list of undirected edges, decide whether they form a valid tree: connected and no cycle. Brute force: DFS from node 0 to check it reaches everything, and a separate cycle check. Fine, but there is a shorter route.',
        '',
        'The key observation: a tree on n nodes has exactly n - 1 edges. And a graph with n - 1 edges and no cycle is automatically connected, because every extra connected piece would need an additional edge somewhere. So two checks are enough: the edge count equals n - 1, and no edge closes a cycle.',
        '',
        'I check the count first and return false if it is wrong, which also rules out too few edges (disconnected) and too many (must contain a cycle). Then I run union-find over the edges: if a union fails, both ends were already connected, which is a cycle, return false. Trace on n = 3 with [[0,1],[1,2],[2,0]]: three edges is not n - 1 = 2, so false at once. On n = 4 with [[0,1],[2,3]]: count 2 is not 3, false (disconnected).',
        '',
        'Edge cases: n = 1 with no edges is a tree (0 edges equals n - 1). Cost: O(n α(n)) time, O(n) space.'
      ]),
      547: J([
        'I restate it: an n by n matrix tells me which cities are directly linked; linked groups, including through other cities, are provinces; I count them. Brute force: DFS from each unvisited city, counting walks. That is already O(n squared), the same as reading the matrix, so union-find is an equally good answer.',
        '',
        'The key observation: start with n provinces, one per city. Each direct link between two cities in different provinces merges them and removes one province. The matrix is symmetric, so I only read the cells above the diagonal, which also skips the diagonal of self-links.',
        '',
        'I keep a parent list and count = n. For each pair i < j with isConnected[i][j] equal to 1, I find both roots; if they differ I link them and decrement the count. Trace on [[1,1,0],[1,1,0],[0,0,1]]: count 3; pair (0,1) is linked, roots differ, merge, count 2; the other pairs are 0. Answer 2.',
        '',
        'Edge cases: a single city returns 1; all cities linked returns 1; a chain 0-1, 1-2 without 0-2 still ends as one province because links are transitive. Cost: O(n squared times α(n)) for reading the matrix, O(n) extra space.'
      ]),
      721: J([
        'I restate it: each account has a name and emails. Accounts sharing any email belong to the same person, so I merge them and output the name plus sorted distinct emails. Names alone prove nothing. Brute force: compare every pair of accounts for a shared email, merge, and repeat until stable. That is quadratic and the transitive merging is error prone.',
        '',
        'The key observation: the things to group are accounts, so each account is a node in a union-find. A shared email is the link. I keep a dictionary from email to the first account that listed it. When I meet an email already in the dictionary, I union the current account with that first one. Chains work automatically: A shares with B, B shares with C, so all three share a root.',
        '',
        'After the pass, I collect each email under the root of its owner account, sort each group, and put the name of the root account in front. Trace on [[John,a,b],[John,a,c],[Mary,m],[John,j]]: account 1 shares a with account 0, union; Mary and the last John share nothing. Groups: {a,b,c} under John, {m} under Mary, {j} under John.',
        '',
        'Edge cases: the same email twice in one account unions the account with itself, a no-op; two people with the same name and no shared email stay separate. Cost: O(E α(n) + E log E) for E emails, O(E) space.'
      ]),
      990: J([
        'I restate it: I get claims like a==b and c!=d about letters; can numbers be assigned so all hold? Brute force: try assignments of numbers to 26 letters, hopeless. A smarter loop that relabels until nothing changes works but is a clumsy union-find.',
        '',
        'The key observation: equality is transitive and symmetric, which is exactly what a group is. All letters connected by == claims must carry one number. So pass one: for every == claim, union the two letters. After this, each group is a set of letters that are forced to be equal.',
        '',
        'Pass two: for every != claim, check the roots. If the two letters share a root, they are forced equal by the groups but the claim says different, a contradiction: return false. If no claim breaks, giving each group its own number satisfies all of them, so true. The order matters: all unions must come before any != check, otherwise a later == could invalidate a != that I already accepted.',
        '',
        'Trace on [a==b, b!=c, c==a]: pass one links a-b and c-a, so a, b, c are one group; pass two sees b!=c with the same root: false. Edge cases: a!=a is false at once (same root as itself); letters with no == claims stay alone. Cost: O(m) times a tiny α over 26 letters.'
      ]),
      1319: J([
        'I restate it: n computers, a list of cables between some pairs; in one move I can unplug a cable and reconnect it elsewhere. I want the minimum moves to connect all computers into one network, or -1. Brute force over which cables to move explodes.',
        '',
        'The key observation: to connect n computers into one network I need at least n - 1 cables, so if there are fewer I return -1 right away. Otherwise there are enough cables in total. A cable is spare if its two ends are already connected (it closes a cycle). If there are k separate groups, I need k - 1 cables to join them, and because the total is at least n - 1, there are always at least k - 1 spare cables sitting in cycles.',
        '',
        'So the answer is k - 1, where k is the number of components. Union-find gives k: start with n, subtract one per successful union. Trace on n = 4 with [[0,1],[0,2],[1,2]]: 3 cables is at least 3, fine. Unions: 0-1, 0-2 succeed (count 2), 1-2 fails (a spare cable). Components 2, answer 1.',
        '',
        'Edge cases: one computer needs 0 moves; if already connected the count is 1 and the answer is 0. Cost: O((n + m) α(n)).'
      ]),
      1202: J([
        'I restate it: I have a string and pairs of positions that may be swapped any number of times; return the lexicographically smallest string I can reach. Brute force: BFS over all reachable strings, which is astronomically many.',
        '',
        'The key observation: swaps are reversible and chain. If positions 0 and 3 can swap, and 3 and 5 can swap, then the letters at positions 0, 3 and 5 can be arranged in any order among those three positions. So positions linked by pairs, directly or through others, form a group, and inside a group I can permute freely. To get the smallest string, each group should hold its letters in sorted order across its positions in increasing order.',
        '',
        'Union-find finds the groups: union the two positions of each pair. Then I collect the positions of each root in increasing order (a natural result of scanning i from 0), sort the letters at those positions, and write them back in order. Trace on dcab with pairs [[0,3],[1,2]]: groups {0,3} with letters d,b becomes b,d at positions 0,3; {1,2} with c,a becomes a,c. Result bacd.',
        '',
        'Edge cases: no pairs leaves the string unchanged; one big group sorts the whole string. Cost: O(n log n) for the sorts plus O((n + m) α(n)).'
      ])
    }
  };
})();
