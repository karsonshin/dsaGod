/* Cheat sheet 6: 25 things you need under time pressure, in Python, JavaScript, Java and C++. */
(function () {
  var OR = (window.OR = window.OR || {});
  var L = ['py', 'js', 'java', 'cpp'];
  var ROWS = [
    ['1. Array of n zeros', '`a = [0] * n`', '`const a = new Array(n).fill(0)`', '`int[] a = new int[n];`', '`vector<int> a(n);`'],
    ['2. Append, pop last', '`a.append(x)`<br>`a.pop()`', '`a.push(x)`<br>`a.pop()`', '`list.add(x)`<br>`list.remove(list.size() - 1)`', '`a.push_back(x)`<br>`a.pop_back()`'],
    ['3. Length', '`len(a)`', '`a.length`', '`a.length` (array), `list.size()`, `s.length()`', '`a.size()` is **unsigned**: `a.size() - 1` wraps when empty'],
    ['4. 2D array, n rows × m cols', '`g = [[0] * m for _ in range(n)]`<br>not `[[0] * m] * n` (rows alias)', '`Array.from({ length: n }, () => new Array(m).fill(0))`', '`int[][] g = new int[n][m];`', '`vector<vector<int>> g(n, vector<int>(m));`'],
    ['5. Slice or copy', '`a[l:r]` (copy), `a[:]`', '`a.slice(l, r)`', '`Arrays.copyOfRange(a, l, r)`', '`vector<int>(a.begin() + l, a.begin() + r)`'],
    ['6. Count with a map', '`d[k] = d.get(k, 0) + 1`<br>or `Counter(a)`', '`m.set(k, (m.get(k) ?? 0) + 1)`', '`m.merge(k, 1, Integer::sum)`<br>`m.getOrDefault(k, 0)`', '`unordered_map<int,int> m;`<br>`m[k]++` (inserts 0 first)'],
    ['7. Has key, delete key', '`k in d`<br>`d.pop(k, None)`', '`m.has(k)`<br>`m.delete(k)`', '`m.containsKey(k)`<br>`m.remove(k)`', '`m.count(k)` or `m.find(k) != m.end()`<br>`m.erase(k)`'],
    ['8. Loop over a map', '`for k, v in d.items():`', '`for (const [k, v] of m)`', '`for (var e : m.entrySet())`<br>`e.getKey(), e.getValue()`', '`for (auto& [k, v] : m)` (C++17)'],
    ['9. Set', '`s = set()`; `s.add(x)`<br>`x in s`; `s.discard(x)`', '`new Set()`; `s.add(x)`<br>`s.has(x)`; `s.delete(x)`', '`Set<Integer> s = new HashSet<>();`<br>`s.add(x)`; `s.contains(x)`; `s.remove(x)`', '`unordered_set<int> s;`<br>`s.insert(x)`; `s.count(x)`; `s.erase(x)`'],
    ['10. Stack', 'list: `st.append(x)`<br>`st.pop()`; top `st[-1]`', 'array: `st.push(x)`<br>`st.pop()`; top `st[st.length - 1]`', '`Deque<Integer> st = new ArrayDeque<>();`<br>`st.push(x)`; `st.pop()`; `st.peek()`<br>(skip the legacy `Stack`)', '`stack<int> st;`<br>`st.push(x)`; `st.top()`; `st.pop()` returns void'],
    ['11. Queue', '`from collections import deque`<br>`q = deque()`; `q.append(x)`; `q.popleft()`', 'array: `q.push(x)`; `q.shift()`<br>shift can be O(n): for big BFS use an index pointer', '`Queue<Integer> q = new ArrayDeque<>();`<br>`q.offer(x)`; `q.poll()`; `q.peek()`', '`queue<int> q;`<br>`q.push(x)`; `q.front()`; `q.pop()`'],
    ['12. Deque, both ends', '`dq.appendleft(x)`; `dq.pop()`', 'no built-in; use a ring buffer or two stacks', '`dq.offerFirst(x)`; `dq.pollLast()`', '`deque<int> dq;`<br>`dq.push_front(x)`; `dq.pop_back()`'],
    ['13. Min-heap', '`import heapq`<br>`heappush(h, x)`; `heappop(h)`<br>`h[0]` is the min; `heapify(a)`', '**no built-in**: write a small heap class', '`PriorityQueue<Integer> h = new PriorityQueue<>();`<br>`h.offer(x)`; `h.poll()`; `h.peek()`', '`priority_queue<int, vector<int>, greater<int>> h;`<br>`h.push(x)`; `h.top()`; `h.pop()`'],
    ['14. Max-heap', 'push `-x`, negate on pop', 'your heap class with a reversed compare', '`new PriorityQueue<>(Collections.reverseOrder())`', '`priority_queue<int> h;` (max is the default)'],
    ['15. Sort a list of numbers', '`a.sort()` or `sorted(a)`', '`a.sort((x, y) => x - y)`<br>the default sort is **by string**', '`Arrays.sort(a);` (int[])<br>`Collections.sort(list);`', '`sort(a.begin(), a.end());`'],
    ['16. Sort with a comparator', '`a.sort(key=lambda p: (p[0], -p[1]))`<br>old style: `functools.cmp_to_key`', '`a.sort((p, q) => p[0] - q[0] \|\| q[1] - p[1])`', '`Arrays.sort(a, (p, q) -> p[0] != q[0] ? Integer.compare(p[0], q[0]) : Integer.compare(q[1], p[1]));`<br>`a` is `int[][]`; avoid `p[0] - q[0]` (overflow)', '`sort(a.begin(), a.end(), [](auto& p, auto& q) { return p[0] != q[0] ? p[0] < q[0] : p[1] > q[1]; });`<br>use `<`, never `<=`'],
    ['17. Build a string', '`"".join(parts)`<br>avoid `+=` in a long loop', '`parts.join("")` (`+=` is fine in V8)', '`StringBuilder sb = new StringBuilder();`<br>`sb.append(c)`; `sb.toString()`', '`string s; s += c;` (strings are mutable)'],
    ['18. Characters and codes', '`list(s)`; `ord(c)`; `chr(n)`<br>`ord(c) - ord("a")`', '`s.split("")`; `s.charCodeAt(i)`<br>`String.fromCharCode(n)`', '`s.toCharArray()`; `s.charAt(i)`<br>`c - \'a\'`; `(char) (c + 1)`', '`s[i] - \'a\'`; `char(\'a\' + k)`<br>`to_string(n)`; `stoi(s)`'],
    ['19. Integer limits', 'unbounded ints; no overflow', 'numbers are doubles: exact up to `Number.MAX_SAFE_INTEGER` (2⁵³ − 1); `BigInt` beyond; `&`, `\|`, `<<` are 32-bit', '`int`: ±2.1×10⁹ (`Integer.MAX_VALUE`), `long`: ±9.2×10¹⁸. Overflow wraps silently. `lo + (hi - lo) / 2`', '`int` 32-bit, `long long` 64-bit (`INT_MAX`, `LLONG_MAX`). Signed overflow is **undefined behavior**'],
    ['20. Division and modulo of negatives', '`//` floors, `%` takes the divisor’s sign: `-7 // 2 == -4`, `-7 % 2 == 1`', '`/` is float division; `Math.floor(a / b)`<br>`%` keeps the dividend’s sign: `-7 % 2 == -1`', '`/` truncates toward 0: `-7 / 2 == -3`<br>`Math.floorMod(a, m)`', 'same as Java<br>non-negative mod: `((a % m) + m) % m`'],
    ['21. Infinity, min, max', '`float("inf")`<br>`min(a, b)`; `max(a)`', '`Infinity`; `Math.min(a, b)`<br>`Math.max(...a)` fails on huge arrays', '`Integer.MAX_VALUE`; `Math.min(a, b)`<br>`INF + w` can overflow: use `Long.MAX_VALUE / 2`', '`INT_MAX`; `min(a, b)`<br>`*min_element(a.begin(), a.end())`<br>`const int INF = 1e9;`'],
    ['22. Binary search in the library', '`bisect.bisect_left(a, x)`<br>`bisect.bisect_right(a, x)`', 'none built in; write the loop', '`Arrays.binarySearch(a, x)`: if absent returns `-(insertion point) - 1`; with duplicates the index is not defined', '`lower_bound(a.begin(), a.end(), x) - a.begin()`<br>`upper_bound(...)`'],
    ['23. Pair or tuple', '`p = (a, b)`; `x, y = p`<br>hashable, so a dict key', '`[a, b]` is not hashable by value: use the key `a + "," + b`', '`int[]{a, b}` has no value equality as a key; use `record P(int a, int b) {}` or `List.of(a, b)`', '`pair<int,int> p{a, b}`; `p.first`<br>fine as a `map` key; `unordered_map` needs a custom hash'],
    ['24. Fast input', '`import sys`<br>`input = sys.stdin.readline`<br>or `sys.stdin.read().split()`', '`require("fs").readFileSync(0, "utf8").split("\\n")`', '`BufferedReader br = new BufferedReader(new InputStreamReader(System.in));`<br>`new StringTokenizer(br.readLine())`<br>output with `PrintWriter`', '`ios::sync_with_stdio(false);`<br>`cin.tie(nullptr);`<br>print `"\\n"`, not `endl`'],
    ['25. Bit tricks', '`x & 1`; `x >> 1`; `x & -x`<br>`x.bit_count()` (3.10+)', '`x & 1`; `x >>> 1`; `x & -x`<br>no popcount: loop `x &= x - 1`', '`Integer.bitCount(x)`; `x >>> 1`<br>`1L << k` for long masks', '`__builtin_popcount(x)` (GCC, Clang) or `std::popcount` (C++20)<br>`1LL << k`']
  ];

  OR.cheatsheets.push({
    n: 6, id: 'languages', title: 'Language cheat sheet',
    blurb: 'The 25 things you reach for under time pressure, in Python, JavaScript, Java and C++, side by side.',
    keywords: 'python javascript java c++ cpp syntax map set heap deque comparator overflow fast input',
    render: function (h) {
      var names = ['Python 3', 'JavaScript', 'Java', 'C++17'];
      var head = ['Task'].concat(names.map(function (n, i) { return [n, 'data-l="' + L[i] + '"']; }));
      var rows = ROWS.map(function (r) {
        return [r[0]].concat(r.slice(1).map(function (c, i) { return [c, 'data-l="' + L[i] + '"']; }));
      });
      return h.T(head, rows, { cls: 'cs-lang', label: 'Language comparison' }) +
        '<p class="cs-foot">' + h.m('Deep recursion (around 10⁴ to 10⁵ frames) can overflow the stack in all four languages: switch to an explicit stack. Strings are immutable in Python, JavaScript and Java, and mutable in C++. More in [[language|the language lesson]] and [[cp-starter|the competitive starter]].') + '</p>';
    }
  });
})();
