/* Cheat sheet 8: Python for interviews. Every snippet was run on Python 3.11 with asserts; `# =>` comments are checked values. */
(function () {
  var OR = (window.OR = window.OR || {});
  var S = {
 "num": "import math\nx = 12\n-7 // 2, -7 % 3  # => (-4, 2)\ndivmod(-7, 2)  # => (-4, 1)\nint(-7 / 2)  # => -3 | truncates toward 0\n2 ** 100 > 2 ** 64  # => True | no overflow\nINF = float('inf')  # also -INF, math.inf\nmath.isqrt(17)  # => 4 | exact integer sqrt\nmath.gcd(12, 18), math.lcm(4, 6)  # => (6, 12)\nmath.comb(5, 2), math.perm(5, 2)  # => (10, 20)\nmath.factorial(5)  # => 120\nmath.ceil(7 / 2)  # => 4\n(7 + 1) // 2  # => 4 | int ceil(7 / 2)\npow(2, 10, 1000)  # => 24 | modular power\nround(2.5)  # => 2 | banker's rounding\nx & 1, x >> 1, 1 << 3  # => (0, 6, 8)\nx & (x - 1)  # => 8 | drop lowest set bit\nx & -x  # => 4 | keep lowest set bit\nx.bit_count()  # => 2 | 3.10+",
 "str": "s = \"Hello, World\"\ns[::-1]  # => 'dlroW ,olleH'\ns[7:]  # => 'World'\ns.lower().count('l')  # => 3\ns.find('o')  # => 4 | -1 if absent\n' a  b '.split()  # => ['a', 'b']\n'a,b,,c'.split(',')  # => ['a', 'b', '', 'c']\n'  hi\\n'.strip()  # => 'hi'\n'-'.join(['a', 'b'])  # => 'a-b'\n'ab1'.isalpha(), '12'.isdigit(), 'a1'.isalnum()\n# => (False, True, True)\nord('c') - ord('a')  # => 2\nchr(ord('a') + 3)  # => 'd'\nf\"{3.14159:.2f}|{42:05d}|{255:b}|{'x':>3}\"\n# => '3.14|00042|11111111|  x'\n''.join(sorted('bca'))  # => 'abc'",
 "lst": "a = [3, 1, 2]\na[::-1]  # => [2, 1, 3]\na[1:]  # => [1, 2] | slice = new list\nb = a[:]  # copy: also a.copy(), list(a)\na + [9]  # => [3, 1, 2, 9]\na[5:]  # => [] | slices never raise\nfirst, *rest = a  # star unpack\nrest  # => [1, 2]\n[x * x for x in range(5) if x % 2]  # => [1, 9]\nlist(enumerate('ab', 1))  # => [(1, 'a'), (2, 'b')]\nlist(zip('ab', [1, 2, 3])) # => [('a', 1), ('b', 2)]\nany(x > 2 for x in a)  # => True\nall([])  # => True | vacuous truth",
 "grid": "m, n = 2, 3\ngrid = [[0] * n for _ in range(m)]  # right\nbad = [[0] * n] * m  # WRONG: one shared row\nbad[0][0] = 1\nbad  # => [[1, 0, 0], [1, 0, 0]]\ngrid[0][0] = 1\ngrid  # => [[1, 0, 0], [0, 0, 0]]\nlist(zip(*grid))  # => [(1, 0), (0, 0), (0, 0)]\nDIRS = [(1, 0), (-1, 0), (0, 1), (0, -1)]",
 "sort": "a = [3, 1, 2]\nsorted(a, reverse=True)  # => [3, 2, 1]\na.sort()  # => None | in place\nwords = ['bb', 'a', 'cc', 'd']\nsorted(words, key=len)  # => ['a', 'd', 'bb', 'cc']\nsorted(words, key=lambda w: (-len(w), w))\n# => ['bb', 'cc', 'a', 'd']\nmax([], default=0)  # => 0 | else ValueError",
 "tup": "(1, 2) < (1, 3)  # => True | lexicographic\n{(0, 1): 'x'}[(0, 1)]  # => 'x'\nx, y = 1, 2\nx, y = y, x  # swap, no temp\ntype((5,)).__name__  # => 'tuple'",
 "dct": "d = {'a': 1}\nd.get('z', 0)  # => 0 | no KeyError, no insert\nd.setdefault('k', []).append(1)\nd['k']  # => [1]\nlist(d.items())  # => [('a', 1), ('k', [1])]\n{k: v for k, v in zip('ab', range(2))}\n# => {'a': 0, 'b': 1}\nd.pop('zz', None)  # => None\nfor k in list(d):\n    del d[k]\ncnt = {'x': 3, 'y': 9}\nmax(cnt, key=cnt.get)  # => 'y'",
 "set": "a, b = {1, 2, 3}, {2, 3, 4}\na | b  # => {1, 2, 3, 4}\na & b  # => {2, 3}\na - b  # => {1}\na ^ b  # => {1, 4}\n{1} <= a  # => True | subset\ntype({}).__name__  # => 'dict'\nfrozenset([1, 2]) in {frozenset([1, 2])}  # => True",
 "coll": "from collections import Counter, defaultdict, deque, namedtuple\nc = Counter('abracadabra')\nc['a']  # => 5\nc['zzz']  # => 0 | no insert\nc.most_common(2)  # => [('a', 5), ('b', 2)]\nCounter('ab') == Counter('ba')  # => True\ng = defaultdict(list)\ng['x'].append(1)  # missing key makes []\ndict(g)  # => {'x': [1]}\nq = deque([1, 2, 3])\nq.appendleft(0); q.pop(); q.popleft()\nq  # => deque([1, 2])\nP = namedtuple('P', 'x y')\np = P(1, 2)\np.x + p[1]  # => 3\np._replace(x=9)  # => P(x=9, y=2)",
 "lru": "from collections import OrderedDict\nclass LRU:\n    def __init__(self, cap):\n        self.cap, self.d = cap, OrderedDict()\n    def get(self, k):\n        if k not in self.d:\n            return -1\n        self.d.move_to_end(k)\n        return self.d[k]\n    def put(self, k, v):\n        self.d[k] = v\n        self.d.move_to_end(k)\n        if len(self.d) > self.cap:\n            self.d.popitem(last=False) # evict oldest",
 "dc": "from dataclasses import dataclass, field\n@dataclass(order=True)\nclass Job:\n    pri: int\n    name: str = field(compare=False)\n    tags: list = field(default_factory=list, compare=False)",
 "heap": "from heapq import heapify, heappush, heappop, nlargest\nh = [5, 1, 4]\nheapify(h)  # in place, O(n)\nheappush(h, 0)\nheappop(h)  # => 0\nh[0]  # => 1 | peek smallest\nmx = []\nheappush(mx, -7); heappush(mx, -3)\n-heappop(mx)  # => 7 | max-heap: negate\npq = []\nheappush(pq, (2, 'b')); heappush(pq, (1, 'z'))\nheappop(pq)  # => (1, 'z') | tuple order\nnlargest(2, [4, 9, 1, 7])  # => [9, 7]\ntopk = []  # k largest in O(n log k)\nfor v in [4, 9, 1, 7, 3]:\n    heappush(topk, v)\n    if len(topk) > 2:\n        heappop(topk)\ntopk[0]  # => 7 | k-th largest at root",
 "bis": "from bisect import bisect_left, bisect_right, insort\na = [1, 2, 2, 4]\nbisect_left(a, 2)  # => 1 | first i: a[i] >= 2\nbisect_right(a, 2)  # => 3 | first i: a[i] > 2\nbisect_right(a, 2) - bisect_left(a, 2)  # => 2\nbisect_left(a, 5)  # => 4 | missing: len(a)\ninsort(a, 3)\na  # => [1, 2, 2, 3, 4] | O(n) shift\nrecs = [(1, 'a'), (3, 'b')]\nbisect_left(recs, 3, key=lambda r: r[0])  # => 1",
 "itr": "from itertools import (accumulate, product, permutations, combinations,\n    combinations_with_replacement, groupby, chain, islice, count, pairwise)\nlist(accumulate([1, 2, 3, 4]))  # => [1, 3, 6, 10]\nlist(accumulate([1, 2, 3], initial=0))  # => [0, 1, 3, 6]\nlist(product('ab', repeat=2))  # => [('a', 'a'), ('a', 'b'), ('b', 'a'), ('b', 'b')]\nlist(permutations([1, 2, 3], 2))[:2]  # => [(1, 2), (1, 3)]\nlist(combinations(range(4), 2))[:3]  # => [(0, 1), (0, 2), (0, 3)]\nlist(combinations_with_replacement('ab', 2))  # => [('a', 'a'), ('a', 'b'), ('b', 'b')]\n[(k, len(list(g))) for k, g in groupby('aabccc')]  # => [('a', 2), ('b', 1), ('c', 3)]\nlist(chain([1], (2, 3))), list(islice(count(5), 3))  # => ([1, 2, 3], [5, 6, 7])\nlist(pairwise([1, 4, 9]))  # => [(1, 4), (4, 9)] | 3.10+",
 "fnt": "from functools import cache, reduce, cmp_to_key, partial\n@cache  # unbounded memo; args hashable\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\nfib(80)  # => 23416728348467685\nfib.cache_clear()  # reset between test cases\nreduce(lambda a, b: a * b, [1, 2, 3, 4], 1)  # => 24\nbig = lambda a, b: -1 if a + b > b + a else 1\n''.join(sorted(['3', '30', '34'], key=cmp_to_key(big)))\n# => '34330' | custom comparator\npartial(pow, 2)(5)  # => 32",
 "swap": "a = [4, 9, 2, 7]\ni, j = 0, 3\na[i], a[j] = a[j], a[i]  # swap\na  # => [7, 9, 2, 4]\nlo, hi = float('inf'), float('-inf')\nfor x in a:  # running min / max\n    lo, hi = min(lo, x), max(hi, x)\n(lo, hi)  # => (2, 9)",
 "twop": "def two_sum_sorted(a, t):\n    l, r = 0, len(a) - 1\n    while l < r:\n        s = a[l] + a[r]\n        if s == t:\n            return [l, r]\n        if s < t:\n            l += 1\n        else:\n            r -= 1\n    return []",
 "win": "def longest_unique(s):\n    last, l, best = {}, 0, 0\n    for r, ch in enumerate(s):\n        if last.get(ch, -1) >= l:\n            l = last[ch] + 1\n        last[ch] = r\n        best = max(best, r - l + 1)\n    return best",
 "pre": "from itertools import accumulate\nfrom collections import Counter\na = [1, 2, 3, -2, 5]\npre = [0, *accumulate(a)]\npre[4] - pre[1]  # => 3 | sum of a[1..3]\ndef count_sum_k(a, k):\n    seen, cur, ans = Counter({0: 1}), 0, 0\n    for x in a:\n        cur += x\n        ans += seen[cur - k]\n        seen[cur] += 1\n    return ans\ncount_sum_k([1, 1, 1], 2)  # => 2",
 "bfs": "from collections import deque\ndef bfs(g, s):\n    dist, q = {s: 0}, deque([s])\n    while q:\n        u = q.popleft()\n        for v in g[u]:\n            if v not in dist:\n                dist[v] = dist[u] + 1\n                q.append(v)\n    return dist",
 "dfs": "def dfs_rec(g, u, seen):\n    seen.add(u)\n    for v in g[u]:\n        if v not in seen:\n            dfs_rec(g, v, seen)\ndef dfs_iter(g, s):\n    seen, st = {s}, [s]\n    while st:\n        u = st.pop()\n        for v in g[u]:\n            if v not in seen:\n                seen.add(v)\n                st.append(v)\n    return seen",
 "rec": "import sys\nsys.setrecursionlimit(10 ** 6)\n# very deep recursion can still crash: go iterative\nfrom functools import cache\n@cache  # memo: args must be hashable\ndef ways(n):\n    return 1 if n < 2 else ways(n - 1) + ways(n - 2)",
 "multi": "people = [('bo', 30), ('al', 30), ('cy', 25)]\nsorted(people, key=lambda p: (-p[1], p[0]))\n# => [('al', 30), ('bo', 30), ('cy', 25)]",
 "build": "parts = []\nfor i in range(3):\n    parts.append(str(i))  # O(1) each\n''.join(parts)  # => '012' | one O(n) join\nch = list('abc')\nch[0] = 'z'  # edit as a list of chars\n''.join(ch)  # => 'zbc'",
 "stdin": "import sys\ninput = sys.stdin.readline\ndata = sys.stdin.read().split()\nn = int(data[0])\nnums = list(map(int, data[1:1 + n]))",
 "lchead": "from typing import List, Optional\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, x in enumerate(nums):\n            if target - x in seen:\n                return [seen[target - x], i]\n            seen[x] = i",
 "lcbuild": "from collections import deque\ndef to_list(vals):  # [1, 2, 3] -> 1 -> 2 -> 3\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v)\n        cur = cur.next\n    return dummy.next\ndef from_list(node):  # back to a Python list\n    out = []\n    while node:\n        out.append(node.val)\n        node = node.next\n    return out\ndef build_tree(vals):\n    if not vals or vals[0] is None:\n        return None\n    root = TreeNode(vals[0])\n    q, i = deque([root]), 1\n    while q and i < len(vals):\n        node = q.popleft()\n        if i < len(vals) and vals[i] is not None:\n            node.left = TreeNode(vals[i]); q.append(node.left)\n        i += 1\n        if i < len(vals) and vals[i] is not None:\n            node.right = TreeNode(vals[i]); q.append(node.right)\n        i += 1\n    return root",
 "inplace": "def rotate(nums, k):  # return None, edit nums\n    k %= len(nums)\n    nums[:] = nums[-k:] + nums[:-k]\n    # nums = ... would only rebind the local name",
 "oop": "class Point:\n    __slots__ = ('x', 'y')\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __repr__(self):\n        return f\"Point({self.x}, {self.y})\"\n    def __eq__(self, o):\n        return (self.x, self.y) == (o.x, o.y)\n    def __hash__(self):\n        return hash((self.x, self.y))\n    def __lt__(self, o):\n        return (self.x, self.y) < (o.x, o.y)\n    @property\n    def manhattan(self):\n        return abs(self.x) + abs(self.y)\n    @staticmethod\n    def origin():  # no self, no cls\n        return Point(0, 0)\n    @classmethod\n    def parse(cls, s):\n        x, y = map(int, s.split(','))\n        return cls(x, y)",
 "gen": "def countdown(n):\n    while n > 0:\n        yield n  # pause; resume on next()\n        n -= 1\nlist(countdown(3))  # => [3, 2, 1]\nsum(x * x for x in range(4))  # => 14\nit = iter([1, 2])\nnext(it), next(it), next(it, None)  # => (1, 2, None)",
 "ctx": "from contextlib import contextmanager\n@contextmanager\ndef tag(log, name):\n    log.append('open ' + name)\n    try:\n        yield\n    finally:\n        log.append('close ' + name)",
 "g1": "def bad(x, acc=[]):\n    acc.append(x)\n    return acc\nbad(1)\nbad(2)  # => [1, 2] | surprise\ndef good(x, acc=None):\n    acc = [] if acc is None else acc\n    acc.append(x)\n    return acc\ngood(1)\ngood(2)  # => [2]",
 "g2": "import copy\na = [[1], [2]]\ns = a.copy()  # shallow: inner lists shared\ns[0].append(9)\na  # => [[1, 9], [2]]\nd = copy.deepcopy(a)  # full copy, slower\nd[0].append(7)\na  # => [[1, 9], [2]]\nx = y = []  # one list, two names\nx.append(1)\ny  # => [1]",
 "g3": "a, b = [1], [1]\na == b, a is b  # => (True, False)\nx = int('1000'); y = int('1000')\nx is y  # => False\n# so use == for values; `is` only for None",
 "g4": "fs = [lambda: i for i in range(3)]\n[f() for f in fs]  # => [2, 2, 2]\nfs = [lambda i=i: i for i in range(3)]\n[f() for f in fs]  # => [0, 1, 2]\na = [2, 4, 6, 1]\nfor v in a:\n    if v % 2 == 0:\n        a.remove(v)\na  # => [4, 1] | wrong; build a new list",
 "g5": "import math\n0.1 + 0.2 == 0.3  # => False\nmath.isclose(0.1 + 0.2, 0.3)  # => True\nsorted([3, None, 1], key=lambda v: (v is None, v or 0))\n# => [1, 3, None] | None vs int compare raises TypeError\ntry:\n    {[1, 2]: 'x'}\nexcept TypeError:\n    pass  # unhashable: key on a tuple",
 "g6": "total = 0\ndef bump():\n    global total  # rebind a module-level name\n    total += 1\ndef outer():\n    n = 0\n    def inc():\n        nonlocal n\n        n += 1\n    inc(); inc()\n    return n\nbump()\n(total, outer())  # => (1, 2)"
};
  OR.cheatsheets.push({
    n: 8, id: 'python', title: 'Python for interviews: the full cheat sheet',
    blurb: 'Costs of every built-in, core syntax, collections, heapq, bisect, itertools, interview idioms, LeetCode boilerplate, OOP for design questions, gotchas and speed tips. Snippets tested on Python 3.11.',
    keywords: 'python list dict set string deque heapq bisect counter defaultdict itertools functools leetcode listnode treenode gotchas class generator',
    pages: 5,
    render: function (h) {
      // B(title, name, ...): one code block, the title as a comment line, snippets joined
      function B() {
        var a = [].slice.call(arguments), t = a.shift();
        return h.code('# == ' + t + ' ==\n' + a.map(function (k) { return S[k]; }).join('\n'));
      }
      var cost = [
        ['`a[i]`, `len(a)`, `append(x)`, `pop()`', 'O(1) (append amortized)', 'The end of a list is a stack.'],
        ['`a.pop(0)`, `a.insert(0, x)`', 'O(n)', 'Shifts every item: use `deque` for queues. [[queues]]'],
        ['`insert(i, x)`, `pop(i)`, `del a[i]`, `remove(x)`', 'O(n)', '`remove` searches, then deletes only the first match.'],
        ['`x in a`, `a.index(x)`, `a.count(x)`', 'O(n)', 'In a loop that is O(n²): build a `set` first.'],
        ['`a.sort()`, `sorted(a)`', 'O(n log n); about O(n) if nearly sorted', 'Timsort, **stable**. `sort()` returns `None`; `sorted` copies.'],
        ['`a[i:j]`, `a[:]`, `a.copy()`, `a[::-1]`', 'O(size of the slice)', 'Slicing in a loop or recursion (`f(a[1:])`) copies every time: pass indices.'],
        ['`a.extend(b)`, `a += b`; `a + b`', 'O(len b) amortized; O(n+m) new list', '`a = a + b` in a loop is O(n²).'],
        ['`s[i]`, `len(s)`; `s += c` in a loop', 'O(1); O(n²) overall', 'Strings are immutable. Append to a list, then `\'\'.join` (O(total)).'],
        ['`t in s`, `s.find(t)`', 'O(n·m) worst, usually near O(n)', '`in` on a str is a substring test; on a list, an item test.'],
        ['`d[k]`, `d[k] = v`, `k in d`, `d.get`, `del`, `pop(k)`; `set` `add`, `in`, `discard`', 'O(1) average, O(n) worst', 'Worst case needs mass hash collisions, so quote the average. Keys must be hashable. `s.remove` raises if absent.'],
        ['`for k in d`, `d.items()`; `len(d)`', 'O(n); O(1)', 'Adding or deleting keys while looping: `RuntimeError`. Loop over `list(d)`.'],
        ['`a | b`; `a & b`; `a - b`', 'O(a+b); O(min(a, b)) avg; O(a)', 'Each builds a new set.'],
        ['`Counter(a)`; `most_common(k)`; `most_common()`', 'O(n); O(n log k); O(n log n)', 'Missing keys read 0 and are not inserted.'],
        ['`deque`: `append`, `appendleft`, `pop`, `popleft`, `q[0]`', 'O(1)', 'Middle `q[i]` and `x in q` are O(n); no slicing. `maxlen=k` drops from the other end.'],
        ['`heappush`, `heappop`; `h[0]`; `heapify(h)`', 'O(log n); O(1); **O(n)**', '**Min-heap only**: negate for a max-heap. A heap list is NOT sorted. No decrease-key; `x in h` and `h.remove` are O(n). [[heaps]]'],
        ['`nlargest(k, a)`; `bisect_left/right`; `insort`', 'O(n log k); O(log n); O(n) (the shift)', '`bisect` needs an already sorted list; `key=` is 3.10+. [[binary-search]]'],
        ['`range`, `zip`, `enumerate`, `map`, generators; `copy.deepcopy`', 'O(1) to create, lazy; deepcopy O(size)', '`k in range(n)` is O(1). A generator is consumed only once.']
      ];
      return h.sec('1. What every built-in costs (n = length; “avg” where it differs from worst)', h.T(
        ['Operation', 'Cost', 'The trap'], cost, { cls: 'cs-pycost', label: 'Cost of Python built-in operations' }), '') +
      h.sec('2a. Core types: numbers and strings (ints are unbounded; strings are immutable)',
        h.cols(B('Numbers', 'num'), B('Strings', 'str'))) +
      h.sec('2b. Core types: lists, sorting, grids, tuples',
        h.cols(B('Lists and sorting', 'lst', 'sort'), B('2-D grids, tuples', 'grid', 'tup'))) +
      h.sec('2c. Core types: dicts and sets',
        h.cols(B('Dicts (insertion-ordered since 3.7)', 'dct'), B('Sets (unordered, unique, hashable items)', 'set')) +
        h.list([
          'Slice is `[start:stop:step]`, stop excluded; out-of-range bounds clamp. Falsy: `0`, `\'\'`, `[]`, `{}`, `set()`, `None`.',
          'Chained compares: `0 <= r < R`. `and`/`or` return an operand: `x or default`. Walrus: `if (n := len(a)) > 3:`. Hashable: str, int, tuple, frozenset; not list, dict, set.',
        ])) +
      h.sec('3a. Library: collections and heapq',
        h.cols(B('collections', 'coll'), B('heapq: min-heap, max-heap by negation, top-k', 'heap')) +
        h.list([
          '`defaultdict(int)` counts, `defaultdict(list)` builds adjacency lists. Reading a missing key **creates** it; test with `k in d`. Heap ties compare the next tuple item: use `(priority, counter, item)` if items are not comparable.',
        ])) +
      h.sec('3b. Library: LRU, dataclass, bisect',
        h.cols(B('OrderedDict as an LRU cache', 'lru'), B('dataclass; bisect', 'dc', 'bis'))) +
      h.sec('3c. Library: itertools and functools',
        B('itertools', 'itr') + B("functools: @cache arguments must be hashable (tuples, not lists)", 'fnt')) +
      h.sec('4a. Idioms: pointers, windows, prefix sums, BFS',
        h.cols(B('Two pointers, sliding window', 'twop', 'win'), B('Prefix sums, BFS with a deque', 'pre', 'bfs'))) +
      h.sec('4b. Idioms: DFS, recursion, sorting, strings, input',
        h.cols(B('DFS, recursion limit, memo', 'dfs', 'rec'), B('Multi-key sort, string building, fast input', 'multi', 'build', 'stdin')) +
        h.list([
          '**Sentinels:** `INF = float(\'inf\')` for min searches, `None` for “not found yet”, a dummy `ListNode()` head to skip head special cases. Swap with `a[i], a[j] = a[j], a[i]`. Return early on empty or single-item input. **Grids:** visited `set` of `(r, c)`.',
          'Mark visited when you **push**, not when you pop. Depth near 10⁵: use an explicit stack. [[recursion]] Anagrams: `Counter(a) == Counter(b)`.'
        ])) +
      h.sec('5. LeetCode specifics',
        h.cols(B('Header, node classes, a solution class', 'lchead'), B('Build a list or tree from a test array', 'lcbuild')) +
        h.list([
          'The method lives on `class Solution`: `self` first, then the inputs; helpers are `self.helper(...)` or a nested `def`. Return exactly the type asked (a `list`, not a tuple).',
          '**In place** means edit the argument and return nothing: `nums[:] = nums[k:] + nums[:k]` keeps the same list; `nums = ...` only rebinds the local name.',
          'LeetCode’s editor usually has common modules (`collections`, `heapq`, `bisect`, `itertools`, `functools`, `math`, `typing`) already available, but do not rely on it: other judges and your own files do not, so write the imports you use.',
        ])) +
      h.sec('6. Classes and OOP for design questions',
        h.cols(B('Dunders, property, static/class methods', 'oop'), B('Generators and context managers', 'gen', 'ctx')) +
        h.list([
          'Define `__eq__` and you must define `__hash__` from the same fields, or the class is unhashable. Do not mutate hashed fields while in a set or dict.',
          '`heapq` and `sorted` use `<` only, so `__lt__` is enough. Mutable class attributes are shared by all instances: set them in `__init__`. [[design-ds]]',
        ])) +
      h.sec('7a. Gotchas that cost offers: state and identity',
        h.cols(B('Mutable defaults; identity vs equality', 'g1', 'g3'), B('Copies, closures, editing while looping', 'g2', 'g4'))) +
      h.sec('7b. Gotchas: floats, None, hashing, scope',
        h.cols(B('Floats, None, unhashable keys', 'g5'), B('global and nonlocal', 'g6')) +
        h.list([
          'Python floors: `-7 // 2` is -4, `-7 % 3` is 2 (C and Java truncate). A function that falls off the end returns `None`: a missing `return` in a recursive branch fails far from the cause.'
        ])) +
      h.sec('8. Speed tips (and when they do not matter)',
        h.list([
          '**Fix the algorithm before the constants.** A set lookup or a heap beats any micro-tuning. Build the set once, outside the loop; use `deque`, not `pop(0)`; join strings once; pass indices, not slices. [[big-o]]',
          '**Interviews run plain CPython, not PyPy:** about 10⁷ simple steps per second, tens of times slower than C++ on tight loops. At n = 10⁵ to 10⁶ aim for O(n) or O(n log n), and say the complexity aloud. Features marked 3.10+ (`pairwise`, `bit_count`, `bisect key=`) may be missing on older judges: ask the version. More: [[language]], [[arrays-hashing]].'
        ])) +
      ''
    }
  });
})();
