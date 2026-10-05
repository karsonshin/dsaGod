/* Cheat sheet 3: recognition cue -> pattern -> skeleton, linked to lessons. */
(function () {
  var OR = (window.OR = window.OR || {});
  OR.cheatsheets.push({
    n: 3, id: 'patterns', title: 'Pattern to template',
    blurb: 'The cue that gives each pattern away, and the three-line skeleton to start from. Each pattern links to its lesson.',
    keywords: 'pattern template skeleton cue recognize',
    render: function (h) {
      var R = [
        ['You ask “have I seen this?”, “how many?”, or want a pair that sums to a target in an unsorted array', '[[arrays-hashing|Hash map]]', '`for x in a: if need(x) in seen: answer`<br>`seen[x] = i`'],
        ['Sorted input (or sortable), a pair or triple hitting a target, palindromes, compare both ends', '[[two-pointers|Two pointers]]', '`l, r = 0, n-1`<br>`while l < r: move l or r by comparing a[l], a[r]`'],
        ['Longest, shortest or count of a **contiguous** subarray or substring with a rule', '[[sliding-window|Sliding window]]', '`for r in range(n): add(a[r])`<br>`while broken(): remove(a[l]); l += 1`<br>`best = max(best, r-l+1)`'],
        ['Many range-sum queries, or subarrays with an exact sum (negatives allowed)', '[[prefix-sums|Prefix sums]]', '`pre[i+1] = pre[i] + a[i]`<br>`sum(l..r) = pre[r+1] - pre[l]`; with a map: `ans += cnt[pre - k]`'],
        ['Best contiguous subarray sum', '[[kadane|Kadane]]', '`cur = max(x, cur + x)`<br>`best = max(best, cur)`'],
        ['Brackets, undo, nested structures, reverse order of opening', '[[stacks|Stack]]', '`for c in s: if opener: st.append(c)`<br>`elif not st or st.pop() != match: fail`'],
        ['Next greater or smaller element, histogram, “how many days until”', '[[monotonic|Monotonic stack]]', '`while st and a[st[-1]] < x: ans[st.pop()] = i`<br>`st.append(i)`'],
        ['Sorted or monotonic yes/no test, “smallest x such that”, “minimize the maximum”', '[[binary-search|Binary search]] (on the answer too)', '`lo, hi = 0, n`<br>`while lo < hi: mid = (lo+hi)//2`<br>`if ok(mid): hi = mid else: lo = mid + 1`'],
        ['Linked list: cycle, middle, n-th from end, reverse, merge', '[[linked-lists|Dummy head + fast/slow]]', '`dummy = Node(0, head); slow = fast = dummy`<br>`while fast and fast.next: slow = slow.next; fast = fast.next.next`'],
        ['Top K, K-th largest, running median, merge K sorted lists, always the current best', '[[heaps|Heap]]', '`heappush(h, x)`<br>`if len(h) > k: heappop(h)`'],
        ['Binary tree: depth, path, balance, ancestors, validate', '[[trees|Tree DFS]]', '`def dfs(n): if not n: return base`<br>`l, r = dfs(n.left), dfs(n.right); return combine(l, r)`'],
        ['Fewest steps, level by level, unweighted shortest path, spread outward', '[[graphs|BFS]] ([[queues]])', '`q = deque([s]); seen = {s}`<br>`while q: u = q.popleft(); for v in nbrs(u): if v not in seen: seen.add(v); q.append(v)`'],
        ['“All” subsets, orderings, splits or placements; build the answer one decision at a time', '[[backtracking|Backtracking]]', '`def go(i): if done: out.append(path[:]); return`<br>`for c in choices: path.append(c); go(i+1); path.pop()`'],
        ['Words by prefix, autocomplete, grid word search over a dictionary', '[[tries|Trie]]', '`node = root`<br>`for ch in word: node = node.kids.setdefault(ch, Node())`<br>`node.end = True`'],
        ['Prerequisites, build order, “can all tasks finish?”', '[[topo-sort|Topological sort]]', '`indeg[v] += 1 for each edge u->v; q = [v with indeg 0]`<br>`pop u: order.append(u); decrement neighbors; push zeros`<br>`len(order) < n means a cycle`'],
        ['Groups that merge, “same group?”, edges arriving online, redundant edge', '[[union-find|Union-Find]]', '`def find(x): while p[x] != x: p[x] = p[p[x]]; x = p[x]`<br>`ra, rb = find(a), find(b); if ra == rb: cycle`<br>`else: p[ra] = rb`'],
        ['Cheapest route, non-negative weights', '[[shortest-paths|Dijkstra]]', '`pq = [(0, s)]; dist[s] = 0`<br>`while pq: d, u = heappop(pq); if d > dist[u]: continue`<br>`for v, w in g[u]: relax; push`'],
        ['Ranges to merge, insert, overlap-count or schedule', '[[intervals|Intervals]]', '`iv.sort()`<br>`for s, e in iv: if out and s <= out[-1][1]: out[-1][1] = max(out[-1][1], e)`<br>`else: out.append([s, e])`'],
        ['Count ways, best value, yes/no over a sequence of choices with repeated subproblems', '[[dp-1d|Dynamic programming]] (see sheet 5)', '`state: dp[i] = answer for the first i items`<br>`dp[i] = best(dp[i-1], dp[i-2] + gain)`<br>`answer = dp[n]`'],
        ['Optimize, and a sorted order makes each local choice safe (exchange argument)', '[[greedy|Greedy]]', '`items.sort(key=...)`<br>`for it in items: if fits(it): take(it)`'],
        ['Appears twice except one, no extra memory, small set of flags, powers of two', '[[bits|Bit manipulation]]', '`x ^= y` cancels pairs; `x & (x-1)` clears lowest bit<br>`mask |= 1 << i`; `mask >> i & 1`'],
        ['Class with O(1) methods; need lookup **and** an order (LRU)', '[[design-ds|Design: hash map + list]]', '`map: key -> node`; doubly linked list keeps order<br>`get`: move node to the front; `put`: insert, evict the tail'],
        ['`n <= 20` and you must try every subset, tour or assignment', '[[bitmask-dp|Bitmask DP]]', '`dp[mask]` over visited sets<br>`for mask in range(1 << n): for j not in mask:`<br>`dp[mask | 1<<j] = best(...)`']
      ];
      return h.T(['If you see…', 'Think', 'Skeleton (language-neutral, close to Python)'], R, { cls: 'cs-patterns', label: 'Patterns with cues and skeletons', noRowHead: true }) +
        '<p class="cs-foot">Not sure which one? Say the brute force first, name what it repeats, and look for the pattern that removes that repetition. Practice recognizing them in the <a href="#/detective">Pattern Detective</a>.</p>';
    }
  });
})();
