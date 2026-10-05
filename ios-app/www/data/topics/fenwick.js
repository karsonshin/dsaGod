/* Offer Ready: Fenwick trees (binary indexed trees). Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'fenwick',

    hook: 'A Fenwick tree answers “what is the sum of the first i values?” and absorbs “add v at position i” in O(log n) each, in about ten lines of code and one flat array. A plain prefix-sum array makes queries O(1) but every change costs O(n); a Fenwick tree balances both. It shows up in interviews mostly through one family of hard questions: **counting how many earlier or later elements are smaller** (inversions, “count of smaller numbers after self”, reverse pairs, range-sum counts). It’s less common than a heap or a hash map, but when it’s the intended answer, nothing else is as short to write.',

    cues: [
      'The array **changes** (point updates) **and** you keep asking for **prefix or range totals** (or counts) between the changes.',
      'You must count, for each element, **how many earlier (or later) elements are smaller**, or count **inversions** or similar pairs, in O(n log n).',
      'The values are huge or negative, but only their **order** matters: you can **compress** them to ranks 1..m and count by rank.',
      'The operation is **invertible** (addition, XOR, counts), so a range is “prefix(r) minus prefix(l − 1)”.',
      'You’d reach for a [segment tree](#/topic/segment-tree) but only need sums or counts, and want less code.',
      'A grid with point updates and rectangle sums (a 2-D Fenwick tree).'
    ],

    intuition: [
      'A plain prefix-sum array is a row of mile markers: reading one is instant, but if a single value changes, every marker after it is wrong. A Fenwick tree keeps **fewer, shorter markers**, so a change touches only a handful of them and a read adds up only a handful of them.',
      'The trick is binary. Number the positions 1 to n. Position `i` stores the sum of a block of **lowbit(i)** values that **ends at i**, where `lowbit(i) = i & -i` is the value of the lowest set bit of `i`. For n = 8:',
      '```\ni = 1 (0001)  lowbit 1  covers 1\ni = 2 (0010)  lowbit 2  covers 1..2\ni = 3 (0011)  lowbit 1  covers 3\ni = 4 (0100)  lowbit 4  covers 1..4\ni = 5 (0101)  lowbit 1  covers 5\ni = 6 (0110)  lowbit 2  covers 5..6\ni = 7 (0111)  lowbit 1  covers 7\ni = 8 (1000)  lowbit 8  covers 1..8\n```',
      'Two walks use that picture, and the visualizer below shows both:',
      '1. **prefix(i), moving down.** Take `tree[i]`, which covers the last lowbit(i) positions up to i. Then jump to `i - lowbit(i)`, which just **clears the lowest set bit** of i, and repeat until i is 0. The blocks you collect are disjoint and tile 1..i exactly. Seven is `111`, so prefix(7) takes nodes 7, 6 and 4: positions 7, then 5..6, then 1..4. At most one jump per set bit, so at most log₂ n jumps.\n2. **update(i, v), moving up.** The nodes whose block contains position i are the ones to change. Start at i and jump to `i + lowbit(i)`, which carries the lowest set bit upward into the next wider block that still covers i. Add v to every node you land on until you pass n. Update at 3 changes nodes 3, 4 and 8.',
      'A range sum needs nothing new: the sum of positions `l..r` is `prefix(r) - prefix(l - 1)`. That only works because addition can be **undone**, which is why a Fenwick tree handles sums, counts and XOR, but not “maximum of a range” (you can’t subtract a maximum).',
      'Building from scratch with n separate updates costs O(n log n). There’s an O(n) build: visit i from 1 to n, and push each finished node `tree[i]` into its parent `i + lowbit(i)`. The template does this.',
      'The second big idea is **counting by rank**. To ask “how many earlier values are smaller than x?” with arbitrary values, sort the distinct values once, replace each by its rank 1..m (**coordinate compression**), and keep a Fenwick tree of counts indexed by rank. Inserting a value is `update(rank, +1)`; the number of earlier values smaller than x is `prefix(rank(x) - 1)`. Sweeping the array once gives every “smaller after self” answer in O(n log n).'
    ].join('\n\n'),

    viz: 'fenwick',

    template: {
      title: 'Fenwick tree: build in O(n), update i v (up), prefix i (down)',
      note: 'The two loops are the entire data structure. **update** moves **up** by `i += i & -i`; **prefix** moves **down** by `i -= i & -i`. Positions are **1-indexed**, because lowbit(0) = 0 would loop forever. To get a range sum, call prefix twice: `prefix(r) - prefix(l - 1)`. Here `ops` are `[0, i, v]` (add v at position i) and `[1, i, 0]` (sum of positions 1 to i).',
      code: {
        py: `def fenwick_run(nums, ops):
    n = len(nums)
    tree = [0] * (n + 1)                          #> tree[i] holds the sum of the lowbit(i) values that end at position i. Positions are 1-indexed, so slot 0 is unused
    for i in range(1, n + 1):
        tree[i] += nums[i - 1]
        j = i + (i & -i)                          #> The parent of i is i + lowbit(i): the next wider block that contains it
        if j <= n:
            tree[j] += tree[i]                    #@build > Build in O(n): push the finished node into its parent
    out = []
    for kind, i, v in ops:
        if kind == 0:                             #> kind 0: add v at position i
            while i <= n:
                tree[i] += v                      #@upadd > Every block that contains position i gets the change
                i += i & -i                       #@upjump > Move up to the next wider block: add the lowest set bit
        else:                                     #> kind 1: sum of positions 1..i
            total = 0
            while i > 0:
                total += tree[i]                  #@downadd > Take this block. Blocks never overlap
                i -= i & -i                       #@downjump > Move down: clear the lowest set bit
            out.append(total)
    return out`,
        js: `function fenwickRun(nums, ops) {
  const n = nums.length;
  const tree = new Array(n + 1).fill(0);          //> tree[i] holds the sum of the lowbit(i) values that end at position i. Positions are 1-indexed, so slot 0 is unused
  for (let i = 1; i <= n; i++) {
    tree[i] += nums[i - 1];
    const j = i + (i & -i);                       //> The parent of i is i + lowbit(i): the next wider block that contains it
    if (j <= n) tree[j] += tree[i];               //@build > Build in O(n): push the finished node into its parent
  }
  const out = [];
  for (const [kind, pos, v] of ops) {
    let i = pos;
    if (kind === 0) {                             //> kind 0: add v at position i
      while (i <= n) {
        tree[i] += v;                             //@upadd > Every block that contains position i gets the change
        i += i & -i;                              //@upjump > Move up to the next wider block: add the lowest set bit
      }
    } else {                                      //> kind 1: sum of positions 1..i
      let total = 0;
      while (i > 0) {
        total += tree[i];                         //@downadd > Take this block. Blocks never overlap
        i -= i & -i;                              //@downjump > Move down: clear the lowest set bit
      }
      out.push(total);
    }
  }
  return out;
}`,
        java: `class Solution {
    public int[] fenwickRun(int[] nums, int[][] ops) {
        int n = nums.length;
        int[] tree = new int[n + 1];                  //> tree[i] holds the sum of the lowbit(i) values that end at position i. Positions are 1-indexed, so slot 0 is unused
        for (int i = 1; i <= n; i++) {
            tree[i] += nums[i - 1];
            int j = i + (i & -i);                     //> The parent of i is i + lowbit(i): the next wider block that contains it
            if (j <= n) tree[j] += tree[i];           //@build > Build in O(n): push the finished node into its parent
        }
        int[] out = new int[ops.length];
        int count = 0;
        for (int[] op : ops) {
            int i = op[1];
            if (op[0] == 0) {                         //> kind 0: add v at position i
                while (i <= n) {
                    tree[i] += op[2];                 //@upadd > Every block that contains position i gets the change
                    i += i & -i;                      //@upjump > Move up to the next wider block: add the lowest set bit
                }
            } else {                                  //> kind 1: sum of positions 1..i
                int total = 0;
                while (i > 0) {
                    total += tree[i];                 //@downadd > Take this block. Blocks never overlap
                    i -= i & -i;                      //@downjump > Move down: clear the lowest set bit
                }
                out[count++] = total;
            }
        }
        return Arrays.copyOf(out, count);
    }
}`,
        cpp: `class Solution {
public:
    vector<int> fenwickRun(vector<int>& nums, vector<vector<int>>& ops) {
        int n = nums.size();
        vector<int> tree(n + 1, 0);                   //> tree[i] holds the sum of the lowbit(i) values that end at position i. Positions are 1-indexed, so slot 0 is unused
        for (int i = 1; i <= n; i++) {
            tree[i] += nums[i - 1];
            int j = i + (i & -i);                     //> The parent of i is i + lowbit(i): the next wider block that contains it
            if (j <= n) tree[j] += tree[i];           //@build > Build in O(n): push the finished node into its parent
        }
        vector<int> out;
        for (auto& op : ops) {
            int i = op[1];
            if (op[0] == 0) {                         //> kind 0: add v at position i
                while (i <= n) {
                    tree[i] += op[2];                 //@upadd > Every block that contains position i gets the change
                    i += i & -i;                      //@upjump > Move up to the next wider block: add the lowest set bit
                }
            } else {                                  //> kind 1: sum of positions 1..i
                int total = 0;
                while (i > 0) {
                    total += tree[i];                 //@downadd > Take this block. Blocks never overlap
                    i -= i & -i;                      //@downjump > Move down: clear the lowest set bit
                }
                out.push_back(total);
            }
        }
        return out;
    }
};`
      },
      tests: { fn: { py: 'fenwick_run', default: 'fenwickRun' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
        { args: [[5, 3, 7, 1, 4, 2, 8, 6], [[1, 7, 0], [0, 3, 5], [1, 6, 0]]], out: [30, 27] },
        { args: [[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], [[0, 1, 10], [1, 12, 0]]], out: [34] },
        { args: [[4, -1, 3, 6, 2], [[1, 5, 0], [1, 4, 0], [0, 4, -6], [1, 4, 0]]], out: [14, 12, 6] },
        { args: [[1], [[1, 1, 0], [0, 1, 4], [1, 1, 0]]], out: [1, 5] },
        { args: [[3, 1, 4, 1, 5, 9, 2, 6, 5], [[1, 9, 0], [1, 1, 0], [0, 5, -5], [1, 5, 0], [1, 8, 0]]], out: [36, 3, 9, 26] }] }
    },

    complexity: {
      time: 'O(log n) per update and per prefix query; O(n) to build',
      space: 'O(n)',
      why: 'A prefix query clears one set bit of i per step, so it takes at most as many steps as i has set bits, at most ⌊log₂ n⌋ + 1. An update adds the lowest set bit each step, which carries upward and pushes the number past n after at most about log₂ n steps. The O(n) build touches each node once and each node has one parent, so there is no log factor. The tree is one array of n + 1 numbers. For counting inversions, you do one update and one query per element on a tree of size m (distinct values), so O(n log m) after an O(n log n) sort.',
      trap: 'Both “O(log n)” claims are **worst case**, not amortized, and the constant is tiny, which is why a Fenwick tree usually beats a segment tree in practice. Two things to say out loud: it needs an **invertible** operation (a range is a difference of prefixes), and a **1-indexed** array. If the interviewer wants range minimum or maximum with changes, the answer is a segment tree, not a Fenwick tree.'
    },

    variations: [
      {
        name: 'Range sum with point assignment (and the “set” trap)',
        body: 'This is the classic “update one position, sum a range” design question (Range Sum Query: Mutable, 307). Two details matter. A range sum is **two prefix queries**: `prefix(r + 1) - prefix(l)` once you shift the 0-indexed input to 1-indexed positions. And a Fenwick tree only knows how to **add**, so an assignment “set position a to b” becomes `add(a, b - current[a])`. Keep a plain copy of the array to know `current[a]`. Forgetting that translation (adding b instead of the difference) is the usual bug.',
        code: {
          py: `def range_sums_set(nums, ops):
    n = len(nums)
    tree = [0] * (n + 1)
    cur = list(nums)

    def add(i, v):
        i += 1                              #> Shift the 0-indexed position to 1-indexed
        while i <= n:
            tree[i] += v
            i += i & -i

    def prefix(i):                          #> Sum of the first i values (positions 0 to i - 1)
        s = 0
        while i > 0:
            s += tree[i]
            i -= i & -i
        return s

    for i, x in enumerate(nums):
        add(i, x)
    out = []
    for kind, a, b in ops:
        if kind == 0:
            add(a, b - cur[a])              #> A Fenwick tree only adds: assigning b means adding the difference
            cur[a] = b
        else:
            out.append(prefix(b + 1) - prefix(a))   #> Range sum a..b is a difference of two prefixes
    return out`,
          js: `function rangeSumsSet(nums, ops) {
  const n = nums.length, tree = new Array(n + 1).fill(0), cur = nums.slice();
  const add = (i, v) => {
    for (i++; i <= n; i += i & -i) tree[i] += v;   //> Shift to 1-indexed, then climb
  };
  const prefix = (i) => {
    let s = 0;
    for (; i > 0; i -= i & -i) s += tree[i];       //> Sum of the first i values (positions 0 to i - 1)
    return s;
  };
  nums.forEach((x, i) => add(i, x));
  const out = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      add(a, b - cur[a]);                          //> A Fenwick tree only adds: assigning b means adding the difference
      cur[a] = b;
    } else out.push(prefix(b + 1) - prefix(a));    //> Range sum a..b is a difference of two prefixes
  }
  return out;
}`,
          java: `class Solution {
    private void add(int[] tree, int i, int v) {
        for (i++; i < tree.length; i += i & -i) tree[i] += v;   //> Shift to 1-indexed, then climb
    }
    private int prefix(int[] tree, int i) {
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];                //> Sum of the first i values (positions 0 to i - 1)
        return s;
    }
    public int[] rangeSumsSet(int[] nums, int[][] ops) {
        int n = nums.length;
        int[] tree = new int[n + 1], cur = nums.clone();
        for (int i = 0; i < n; i++) add(tree, i, nums[i]);
        int[] out = new int[ops.length];
        int count = 0;
        for (int[] op : ops) {
            if (op[0] == 0) {
                add(tree, op[1], op[2] - cur[op[1]]);           //> A Fenwick tree only adds: assigning b means adding the difference
                cur[op[1]] = op[2];
            } else out[count++] = prefix(tree, op[2] + 1) - prefix(tree, op[1]);   //> Range sum a..b is a difference of two prefixes
        }
        return Arrays.copyOf(out, count);
    }
}`,
          cpp: `class Solution {
    void add(vector<int>& tree, int i, int v) {
        for (i++; i < (int)tree.size(); i += i & -i) tree[i] += v;   //> Shift to 1-indexed, then climb
    }
    int prefix(vector<int>& tree, int i) {
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];                     //> Sum of the first i values (positions 0 to i - 1)
        return s;
    }
public:
    vector<int> rangeSumsSet(vector<int>& nums, vector<vector<int>>& ops) {
        int n = nums.size();
        vector<int> tree(n + 1, 0), cur = nums, out;
        for (int i = 0; i < n; i++) add(tree, i, nums[i]);
        for (auto& op : ops) {
            if (op[0] == 0) {
                add(tree, op[1], op[2] - cur[op[1]]);                //> A Fenwick tree only adds: assigning b means adding the difference
                cur[op[1]] = op[2];
            } else out.push_back(prefix(tree, op[2] + 1) - prefix(tree, op[1]));   //> Range sum a..b is a difference of two prefixes
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'range_sums_set', default: 'rangeSumsSet' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
          { args: [[1, 3, 5], [[1, 0, 2], [0, 1, 2], [1, 0, 2]]], out: [9, 8] },
          { args: [[-2, 0, 3, -5, 2, -1], [[1, 0, 5], [0, 3, 4], [1, 2, 4], [1, 3, 3]]], out: [-3, 9, 4] },
          { args: [[7], [[1, 0, 0], [0, 0, -7], [1, 0, 0]]], out: [7, -7] }] }
      },
      {
        name: 'Building in O(n) instead of n updates',
        body: 'Calling `update(i, nums[i])` for every i costs O(n log n). The linear build uses the tree’s own shape: the parent of node `i` is `i + lowbit(i)`, and every child has a smaller index than its parent, so when the loop reaches `i`, node `i` is already complete. Push it into its parent once and move on. Each node is touched twice (once as a child, once as a parent), so the build is O(n). It’s a nice thing to mention after you write the basic version; at n = 10⁵ the difference is small, so don’t spend interview time on it unless you’re asked.',
        code: {
          py: `def build_tree(nums):
    n = len(nums)
    tree = [0] + nums[:]                    #> Copy the values into slots 1..n, slot 0 is unused
    for i in range(1, n + 1):
        j = i + (i & -i)                    #> The parent of i
        if j <= n:
            tree[j] += tree[i]              #> Node i is final by now, so push it up exactly once
    return tree`,
          js: `function buildTree(nums) {
  const n = nums.length, tree = [0, ...nums];     //> Copy the values into slots 1..n, slot 0 is unused
  for (let i = 1; i <= n; i++) {
    const j = i + (i & -i);                       //> The parent of i
    if (j <= n) tree[j] += tree[i];               //> Node i is final by now, so push it up exactly once
  }
  return tree;
}`,
          java: `class Solution {
    public int[] buildTree(int[] nums) {
        int n = nums.length;
        int[] tree = new int[n + 1];
        System.arraycopy(nums, 0, tree, 1, n);          //> Copy the values into slots 1..n, slot 0 is unused
        for (int i = 1; i <= n; i++) {
            int j = i + (i & -i);                       //> The parent of i
            if (j <= n) tree[j] += tree[i];             //> Node i is final by now, so push it up exactly once
        }
        return tree;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> buildTree(vector<int>& nums) {
        int n = nums.size();
        vector<int> tree(n + 1, 0);
        copy(nums.begin(), nums.end(), tree.begin() + 1);   //> Copy the values into slots 1..n, slot 0 is unused
        for (int i = 1; i <= n; i++) {
            int j = i + (i & -i);                           //> The parent of i
            if (j <= n) tree[j] += tree[i];                 //> Node i is final by now, so push it up exactly once
        }
        return tree;
    }
};`
        },
        tests: { fn: { py: 'build_tree', default: 'buildTree' }, sig: { args: ['int[]'] }, cases: [
          { args: [[5, 3, 7, 1, 4, 2, 8, 6]], out: [0, 5, 8, 7, 16, 4, 6, 8, 36] },
          { args: [[1]], out: [0, 1] },
          { args: [[2, -1, 3, 4, 0, 6, 7]], out: [0, 2, 1, 3, 8, 0, 6, 7] }] }
      },
      {
        name: 'Counting inversions with coordinate compression',
        body: 'An **inversion** is a pair `i < j` with `nums[i] > nums[j]`. Sweep left to right with a Fenwick tree of **counts by rank**. For the current value `x`, the earlier values that are `<= x` number `prefix(rank(x))`, so the earlier values **strictly greater** than x number `seen - prefix(rank(x))`, where `seen` is how many you’ve inserted. Then insert x with `update(rank(x), +1)`. Compression comes first: sort the distinct values and give each a rank from 1. That keeps the tree at size m (the number of distinct values) even when the values themselves are huge or negative. Equal values need care: using `<=` for the query is what keeps ties from counting as inversions. The same loop answers Count of Smaller Numbers After Self (315) if you sweep from the right instead. For n up to 10⁵ the count can reach about 5·10⁹, so use a 64-bit integer in Java and C++.',
        code: {
          py: `def count_inversions(nums):
    ranks = {v: r for r, v in enumerate(sorted(set(nums)), 1)}   #> Coordinate compression: the smallest value gets rank 1
    m = len(ranks)
    tree = [0] * (m + 1)
    count = 0
    for seen, x in enumerate(nums):
        r = ranks[x]
        i, le = r, 0
        while i > 0:                        #> prefix(r): how many earlier values are <= x
            le += tree[i]
            i -= i & -i
        count += seen - le                  #> The rest of the earlier values are strictly larger: inversions with x
        i = r
        while i <= m:                       #> update(r, +1): record x
            tree[i] += 1
            i += i & -i
    return count`,
          js: `function countInversions(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const ranks = new Map(sorted.map((v, k) => [v, k + 1]));      //> Coordinate compression: the smallest value gets rank 1
  const m = sorted.length, tree = new Array(m + 1).fill(0);
  let count = 0;
  nums.forEach((x, seen) => {
    const r = ranks.get(x);
    let le = 0;
    for (let i = r; i > 0; i -= i & -i) le += tree[i];          //> prefix(r): how many earlier values are <= x
    count += seen - le;                                         //> The rest of the earlier values are strictly larger: inversions with x
    for (let i = r; i <= m; i += i & -i) tree[i]++;             //> update(r, +1): record x
  });
  return count;
}`,
          java: `class Solution {
    public long countInversions(int[] nums) {
        int[] s = nums.clone();
        Arrays.sort(s);
        int m = 0;
        for (int i = 0; i < s.length; i++) if (i == 0 || s[i] != s[i - 1]) s[m++] = s[i];   //> Sort, then keep the distinct values: they define the ranks
        int[] tree = new int[m + 1];
        long count = 0;
        for (int seen = 0; seen < nums.length; seen++) {
            int r = Arrays.binarySearch(s, 0, m, nums[seen]) + 1;   //> Rank of this value, starting at 1
            int le = 0;
            for (int i = r; i > 0; i -= i & -i) le += tree[i];      //> prefix(r): how many earlier values are <= x
            count += seen - le;                                     //> The rest of the earlier values are strictly larger: inversions with x
            for (int i = r; i <= m; i += i & -i) tree[i]++;         //> update(r, +1): record x
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    long long countInversions(vector<int>& nums) {
        vector<int> s = nums;
        sort(s.begin(), s.end());
        s.erase(unique(s.begin(), s.end()), s.end());               //> Sorted distinct values define the ranks
        int m = s.size();
        vector<int> tree(m + 1, 0);
        long long count = 0;
        for (int seen = 0; seen < (int)nums.size(); seen++) {
            int r = lower_bound(s.begin(), s.end(), nums[seen]) - s.begin() + 1;   //> Rank of this value, starting at 1
            int le = 0;
            for (int i = r; i > 0; i -= i & -i) le += tree[i];      //> prefix(r): how many earlier values are <= x
            count += seen - le;                                     //> The rest of the earlier values are strictly larger: inversions with x
            for (int i = r; i <= m; i += i & -i) tree[i]++;         //> update(r, +1): record x
        }
        return count;
    }
};`
        },
        tests: { fn: { py: 'count_inversions', default: 'countInversions' }, sig: { args: ['int[]'] }, cases: [
          { args: [[2, 4, 1, 3, 5]], out: 3 }, { args: [[5, 4, 3, 2, 1]], out: 10 }, { args: [[1]], out: 0 },
          { args: [[3, 3, 3]], out: 0 }, { args: [[8, -2, 5, 5, -9, 0]], out: 10 }] }
      },
      {
        name: 'Range update, point query: a Fenwick tree over differences',
        body: 'Flip the roles. If the updates are **“add v to every position from l to r”** and the queries are **“what is the value at position i?”**, store the *difference array* in the Fenwick tree: add `+v` at `l` and `-v` at `r + 1`, and the value at i is `prefix(i)`. Both operations stay O(log n). (Range update **and** range sum together need two Fenwick trees, or a segment tree with lazy propagation; that’s the point where a segment tree is simpler.)',
        code: {
          py: `def range_add_point(n, ops):
    tree = [0] * (n + 2)

    def add(i, v):
        while i <= n:
            tree[i] += v
            i += i & -i

    out = []
    for kind, l, r, v in ops:
        if kind == 0:
            add(l, v)                       #> +v switches on at l ...
            add(r + 1, -v)                  #> ... and off just after r (add ignores positions past n)
        else:
            s, i = 0, l
            while i > 0:                    #> The value at l is the running sum of the differences: a prefix query
                s += tree[i]
                i -= i & -i
            out.append(s)
    return out`,
          js: `function rangeAddPoint(n, ops) {
  const tree = new Array(n + 2).fill(0);
  const add = (i, v) => { for (; i <= n; i += i & -i) tree[i] += v; };
  const out = [];
  for (const [kind, l, r, v] of ops) {
    if (kind === 0) {
      add(l, v);                                  //> +v switches on at l ...
      add(r + 1, -v);                             //> ... and off just after r (add ignores positions past n)
    } else {
      let s = 0;
      for (let i = l; i > 0; i -= i & -i) s += tree[i];   //> The value at l is the running sum of the differences: a prefix query
      out.push(s);
    }
  }
  return out;
}`,
          java: `class Solution {
    private void add(int[] tree, int i, int v) {
        for (; i < tree.length - 1; i += i & -i) tree[i] += v;   //> Positions past n are ignored
    }
    public int[] rangeAddPoint(int n, int[][] ops) {
        int[] tree = new int[n + 2];
        int[] out = new int[ops.length];
        int count = 0;
        for (int[] op : ops) {
            if (op[0] == 0) {
                add(tree, op[1], op[3]);                         //> +v switches on at l ...
                add(tree, op[2] + 1, -op[3]);                    //> ... and off just after r
            } else {
                int s = 0;
                for (int i = op[1]; i > 0; i -= i & -i) s += tree[i];   //> The value at l is the running sum of the differences: a prefix query
                out[count++] = s;
            }
        }
        return Arrays.copyOf(out, count);
    }
}`,
          cpp: `class Solution {
    void add(vector<int>& tree, int i, int v) {
        for (; i < (int)tree.size() - 1; i += i & -i) tree[i] += v;   //> Positions past n are ignored
    }
public:
    vector<int> rangeAddPoint(int n, vector<vector<int>>& ops) {
        vector<int> tree(n + 2, 0), out;
        for (auto& op : ops) {
            if (op[0] == 0) {
                add(tree, op[1], op[3]);                              //> +v switches on at l ...
                add(tree, op[2] + 1, -op[3]);                         //> ... and off just after r
            } else {
                int s = 0;
                for (int i = op[1]; i > 0; i -= i & -i) s += tree[i]; //> The value at l is the running sum of the differences: a prefix query
                out.push_back(s);
            }
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'range_add_point', default: 'rangeAddPoint' }, sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [5, [[0, 2, 4, 3], [1, 3, 0, 0], [0, 1, 3, -1], [1, 1, 0, 0], [1, 5, 0, 0], [1, 4, 0, 0]]], out: [3, -1, 0, 3] },
          { args: [1, [[1, 1, 0, 0], [0, 1, 1, 9], [1, 1, 0, 0]]], out: [0, 9] }] }
      },
      {
        name: 'Stretch goal: a 2-D Fenwick tree',
        body: 'For a grid with **point updates** and **rectangle-from-the-corner sums**, nest the two loops: the outer loop walks the row index, the inner walks the column index, and each uses the same lowbit jumps. Both operations are O(log R · log C). A general rectangle from `(r1, c1)` to `(r2, c2)` is four prefix calls with inclusion–exclusion, exactly like a [2D prefix sum](#/topic/prefix-sums): `P(r2, c2) - P(r1 - 1, c2) - P(r2, c1 - 1) + P(r1 - 1, c1 - 1)`. This is Range Sum Query 2D – Mutable (308, a premium question), and it’s rare in interviews, so treat it as a “can you extend it” follow-up rather than something to memorize.',
        code: {
          py: `def grid_sums(grid, ops):
    R, C = len(grid), len(grid[0])
    tree = [[0] * (C + 1) for _ in range(R + 1)]

    def add(r, c, v):
        i = r + 1                           #> Shift both coordinates to 1-indexed
        while i <= R:
            j = c + 1
            while j <= C:
                tree[i][j] += v             #> Every (row block, column block) pair that contains the cell
                j += j & -j
            i += i & -i

    def prefix(r, c):                       #> Sum of rows 0..r and columns 0..c
        s, i = 0, r + 1
        while i > 0:
            j = c + 1
            while j > 0:
                s += tree[i][j]
                j -= j & -j
            i -= i & -i
        return s

    for r in range(R):
        for c in range(C):
            add(r, c, grid[r][c])
    out = []
    for kind, r, c, v in ops:
        if kind == 0:
            add(r, c, v)
        else:
            out.append(prefix(r, c))
    return out`,
          js: `function gridSums(grid, ops) {
  const R = grid.length, C = grid[0].length;
  const tree = Array.from({ length: R + 1 }, () => new Array(C + 1).fill(0));
  const add = (r, c, v) => {
    for (let i = r + 1; i <= R; i += i & -i)             //> Shift both coordinates to 1-indexed
      for (let j = c + 1; j <= C; j += j & -j) tree[i][j] += v;   //> Every (row block, column block) pair that contains the cell
  };
  const prefix = (r, c) => {                             //> Sum of rows 0..r and columns 0..c
    let s = 0;
    for (let i = r + 1; i > 0; i -= i & -i)
      for (let j = c + 1; j > 0; j -= j & -j) s += tree[i][j];
    return s;
  };
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) add(r, c, grid[r][c]);
  const out = [];
  for (const [kind, r, c, v] of ops) {
    if (kind === 0) add(r, c, v);
    else out.push(prefix(r, c));
  }
  return out;
}`,
          java: `class Solution {
    private void add(int[][] tree, int r, int c, int v) {
        for (int i = r + 1; i < tree.length; i += i & -i)           //> Shift both coordinates to 1-indexed
            for (int j = c + 1; j < tree[0].length; j += j & -j) tree[i][j] += v;   //> Every (row block, column block) pair that contains the cell
    }
    private int prefix(int[][] tree, int r, int c) {                //> Sum of rows 0..r and columns 0..c
        int s = 0;
        for (int i = r + 1; i > 0; i -= i & -i)
            for (int j = c + 1; j > 0; j -= j & -j) s += tree[i][j];
        return s;
    }
    public int[] gridSums(int[][] grid, int[][] ops) {
        int R = grid.length, C = grid[0].length;
        int[][] tree = new int[R + 1][C + 1];
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) add(tree, r, c, grid[r][c]);
        int[] out = new int[ops.length];
        int count = 0;
        for (int[] op : ops) {
            if (op[0] == 0) add(tree, op[1], op[2], op[3]);
            else out[count++] = prefix(tree, op[1], op[2]);
        }
        return Arrays.copyOf(out, count);
    }
}`,
          cpp: `class Solution {
    void add(vector<vector<int>>& tree, int r, int c, int v) {
        for (int i = r + 1; i < (int)tree.size(); i += i & -i)      //> Shift both coordinates to 1-indexed
            for (int j = c + 1; j < (int)tree[0].size(); j += j & -j) tree[i][j] += v;   //> Every (row block, column block) pair that contains the cell
    }
    int prefix(vector<vector<int>>& tree, int r, int c) {           //> Sum of rows 0..r and columns 0..c
        int s = 0;
        for (int i = r + 1; i > 0; i -= i & -i)
            for (int j = c + 1; j > 0; j -= j & -j) s += tree[i][j];
        return s;
    }
public:
    vector<int> gridSums(vector<vector<int>>& grid, vector<vector<int>>& ops) {
        int R = grid.size(), C = grid[0].size();
        vector<vector<int>> tree(R + 1, vector<int>(C + 1, 0));
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) add(tree, r, c, grid[r][c]);
        vector<int> out;
        for (auto& op : ops) {
            if (op[0] == 0) add(tree, op[1], op[2], op[3]);
            else out.push_back(prefix(tree, op[1], op[2]));
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'grid_sums', default: 'gridSums' }, sig: { args: ['int[][]', 'int[][]'] }, cases: [
          { args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[1, 1, 1, 0], [0, 0, 0, 10], [1, 2, 2, 0], [1, 0, 2, 0], [0, 2, 1, -8], [1, 2, 1, 0]]], out: [12, 55, 16, 29] },
          { args: [[[5]], [[1, 0, 0, 0], [0, 0, 0, -2], [1, 0, 0, 0]]], out: [5, 3] },
          { args: [[[1, -1, 2, 0], [0, 3, 0, 4]], [[1, 1, 3, 0], [0, 1, 0, 5], [1, 1, 0, 0], [1, 0, 3, 0]]], out: [9, 6, 2] }] }
      },
      {
        name: 'Fenwick tree vs segment tree',
        body: 'Both give O(log n) point updates and range queries, so the decision is about what you must compute and how much code you want.\n\n| | Fenwick tree | [Segment tree](#/topic/segment-tree) |\n|---|---|---|\n| Code | about 10 lines, one flat array of n + 1 | 30 or more lines, usually an array of 2n or 4n |\n| Operations | needs an **invertible** one: sum, count, XOR | any associative one: min, max, gcd, sum |\n| Range query | two prefixes: `prefix(r) - prefix(l - 1)` | one top-down or bottom-up walk |\n| Range update | range add + point query is easy; range add + range sum needs two trees | lazy propagation handles it directly |\n| Speed | smaller constant, very cache-friendly | roughly 2 to 4 times slower in practice |\n| Extras | find the k-th element by walking down the bits in O(log n) | descend by any predicate; store a tuple per node |\n\nRule of thumb: **sums or counts, point updates, short code, reach for a Fenwick tree.** Range minimum or maximum with changes, “find the first position where…” by an arbitrary rule, or range assignment: reach for a segment tree. If nothing changes at all, a [prefix-sum array](#/topic/prefix-sums) or a sparse table is simpler than either. A Fenwick tree *can* do prefix maximum when values only ever increase, but that’s a niche trick, not the general case.'
      },
      {
        name: 'Other places a Fenwick tree hides',
        body: 'Anything that counts by rank can use one. **Longest increasing subsequence in O(n log n)** can keep a Fenwick tree of “best length ending at a value no larger than this rank” (prefix maximum, valid because the stored lengths only grow). **Counting pairs under an inequality** such as `a[i] - a[j] <= d + b[i] - b[j]` turns into counting by rank after rearranging terms. **Order statistics:** with counts in the tree, the k-th smallest element is found by walking down the bits from the highest power of two, adding the block size whenever the block’s count is less than k. And **offline queries** (sort the queries by right end, sweep, and answer “distinct values in a range” with a Fenwick tree that keeps only the last occurrence of each value) are a staple of competitive programming.'
      }
    ],

    worked: [
      {
        lc: 307,
        restate: 'Build a class over an integer array with two methods: `update(index, val)`, which replaces the value at `index`, and `sumRange(left, right)`, which returns the sum of the elements from `left` to `right`, both ends included. Many calls of both kinds are mixed together.',
        examples: '- Start with `[1, 3, 5]`. `sumRange(0, 2)` → 9. `update(1, 2)` makes it `[1, 2, 5]`. `sumRange(0, 2)` → 8.\n- Edge cases: a one-element array; updating a position to the value it already has; a range of one position.',
        brute: 'Keep the array as is: update is O(1) and every sum is O(n). Or keep a prefix-sum array: every sum is O(1) and every update is O(n) because all the later totals shift. With many calls of both kinds, both are O(n) per operation in the worst case.',
        insight: 'You need a structure where a change touches few stored totals and a sum reads few stored totals. A Fenwick tree does both in O(log n): `prefix(i)` collects at most log n disjoint blocks, and `add(i, d)` updates at most log n blocks. A sum is `prefix(right + 1) - prefix(left)`. The wrinkle is that the tree can only **add**, so `update(index, val)` adds the **difference** `val - current[index]`, which means you must keep a plain copy of the array.',
        tests: { design: true, fn: 'NumArray', cases: [
          { ops: ['NumArray', 'sumRange', 'update', 'sumRange'], args: [[[1, 3, 5]], [0, 2], [1, 2], [0, 2]], out: [null, 9, null, 8] },
          { ops: ['NumArray', 'sumRange', 'update', 'sumRange', 'sumRange'], args: [[[-2, 0, 3, -5, 2, -1]], [0, 5], [3, 4], [2, 4], [3, 3]], out: [null, -3, null, 9, 4] },
          { ops: ['NumArray', 'update', 'sumRange'], args: [[[7]], [0, -7], [0, 0]], out: [null, null, -7] }] },
        code: {
          py: `class NumArray:
    def __init__(self, nums: List[int]):
        self.n = len(nums)
        self.nums = nums[:]
        self.tree = [0] * (self.n + 1)
        for i in range(1, self.n + 1):          # O(n) build: push each finished node into its parent
            self.tree[i] += nums[i - 1]
            j = i + (i & -i)
            if j <= self.n:
                self.tree[j] += self.tree[i]

    def update(self, index: int, val: int) -> None:
        delta = val - self.nums[index]          # the tree only adds, so add the difference
        self.nums[index] = val
        i = index + 1
        while i <= self.n:
            self.tree[i] += delta
            i += i & -i

    def _prefix(self, i: int) -> int:           # sum of the first i values
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & -i
        return s

    def sumRange(self, left: int, right: int) -> int:
        return self._prefix(right + 1) - self._prefix(left)`,
          js: `class NumArray {
  constructor(nums) {
    this.n = nums.length;
    this.nums = nums.slice();
    this.tree = new Array(this.n + 1).fill(0);
    for (let i = 1; i <= this.n; i++) {          // O(n) build: push each finished node into its parent
      this.tree[i] += nums[i - 1];
      const j = i + (i & -i);
      if (j <= this.n) this.tree[j] += this.tree[i];
    }
  }
  update(index, val) {
    const delta = val - this.nums[index];        // the tree only adds, so add the difference
    this.nums[index] = val;
    for (let i = index + 1; i <= this.n; i += i & -i) this.tree[i] += delta;
  }
  prefix(i) {                                    // sum of the first i values
    let s = 0;
    for (; i > 0; i -= i & -i) s += this.tree[i];
    return s;
  }
  sumRange(left, right) {
    return this.prefix(right + 1) - this.prefix(left);
  }
}`,
          java: `class NumArray {
    private final int n;
    private final int[] nums, tree;

    public NumArray(int[] nums) {
        n = nums.length;
        this.nums = nums.clone();
        tree = new int[n + 1];
        for (int i = 1; i <= n; i++) {              // O(n) build: push each finished node into its parent
            tree[i] += nums[i - 1];
            int j = i + (i & -i);
            if (j <= n) tree[j] += tree[i];
        }
    }

    public void update(int index, int val) {
        int delta = val - nums[index];              // the tree only adds, so add the difference
        nums[index] = val;
        for (int i = index + 1; i <= n; i += i & -i) tree[i] += delta;
    }

    private int prefix(int i) {                     // sum of the first i values
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];
        return s;
    }

    public int sumRange(int left, int right) {
        return prefix(right + 1) - prefix(left);
    }
}`,
          cpp: `class NumArray {
    int n;
    vector<int> nums, tree;
    int prefix(int i) {                             // sum of the first i values
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];
        return s;
    }
public:
    NumArray(vector<int>& values) : n(values.size()), nums(values), tree(values.size() + 1, 0) {
        for (int i = 1; i <= n; i++) {              // O(n) build: push each finished node into its parent
            tree[i] += nums[i - 1];
            int j = i + (i & -i);
            if (j <= n) tree[j] += tree[i];
        }
    }
    void update(int index, int val) {
        int delta = val - nums[index];              // the tree only adds, so add the difference
        nums[index] = val;
        for (int i = index + 1; i <= n; i += i & -i) tree[i] += delta;
    }
    int sumRange(int left, int right) {
        return prefix(right + 1) - prefix(left);
    }
};`
        },
        complexity: 'O(n) to build; O(log n) per `update` and per `sumRange`; O(n) space for the tree plus a copy of the array.',
        say: '“A plain array makes sums slow and a prefix array makes updates slow, so I want something where both touch only log n stored totals. A Fenwick tree stores, at position i, the sum of the lowbit(i) values ending at i. A prefix query clears the lowest set bit each step, an update adds it. A range sum is two prefix queries. The tree only adds, so for an assignment I add the difference from the old value, which means I keep a copy of the array. I can build it in O(n) by pushing each node into its parent. Both operations are O(log n).”',
        followups: [
          { q: 'Why not a segment tree?', a: 'A segment tree also works with the same bounds. For sums, a Fenwick tree is shorter and has a smaller constant. I’d pick the segment tree if the question changed to minimum or maximum, since those can’t be subtracted, or to range assignment.' },
          { q: 'Why 1-indexed?', a: '`lowbit(0)` is 0, so `i += i & -i` would never leave 0 and `i -= i & -i` is already done. The tree’s whole shape comes from the binary form of positive integers, so shift the user’s 0-indexed input by one.' },
          { q: 'What if `update` meant “add val” instead of “set to val”?', a: 'Then skip the copy of the array and add `val` directly. Many Fenwick questions are phrased that way.' },
          { q: 'What if the array is huge and mostly zero?', a: 'Keep the tree in a hash map keyed by index (an absent key means 0), or compress the coordinates of the positions you’ll ever touch, if you can read the queries offline.' }
        ]
      },
      {
        lc: 315,
        restate: 'Given an integer array `nums`, return an array `counts` where `counts[i]` is the number of elements to the right of position `i` that are **strictly smaller** than `nums[i]`.',
        examples: '- `[5, 2, 6, 1]` → `[2, 1, 1, 0]`: for 5, the later 2 and 1 are smaller; for 2, only the 1; for 6, only the 1; for 1, none.\n- `[-1, -1]` → `[0, 0]`: equal values don’t count.\n- Edge cases: one element; all equal; strictly increasing (all zeros); values are negative, and up to 10⁴ in size, but there can be 10⁵ of them.',
        brute: 'For each position, scan everything to its right: O(n²). With n = 10⁵ that is about 5·10⁹ comparisons, far too slow.',
        insight: 'Sweep from the **right**, keeping a Fenwick tree of how many values you’ve already seen at each **rank**. For the current value x, the number of already-seen values smaller than x is `prefix(rank(x) - 1)`: that’s the answer for this position. Then record x with `update(rank(x), +1)`. Values can be negative and spread out, so first **compress**: sort the distinct values and replace each by its rank 1..m. Querying `rank - 1` (not `rank`) is what keeps equal values out of the count.',
        code: {
          py: `class Solution:
    def countSmaller(self, nums: List[int]) -> List[int]:
        ranks = {v: r for r, v in enumerate(sorted(set(nums)), 1)}   # coordinate compression
        m = len(ranks)
        tree = [0] * (m + 1)
        out = [0] * len(nums)
        for idx in range(len(nums) - 1, -1, -1):                      # sweep from the right
            r = ranks[nums[idx]]
            i, smaller = r - 1, 0
            while i > 0:                                              # prefix(r - 1): seen values with a smaller rank
                smaller += tree[i]
                i -= i & -i
            out[idx] = smaller
            i = r
            while i <= m:                                             # record this value
                tree[i] += 1
                i += i & -i
        return out`,
          js: `function countSmaller(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const ranks = new Map(sorted.map((v, k) => [v, k + 1]));           // coordinate compression
  const m = sorted.length, tree = new Array(m + 1).fill(0), out = new Array(nums.length).fill(0);
  for (let idx = nums.length - 1; idx >= 0; idx--) {                 // sweep from the right
    const r = ranks.get(nums[idx]);
    let smaller = 0;
    for (let i = r - 1; i > 0; i -= i & -i) smaller += tree[i];      // prefix(r - 1): seen values with a smaller rank
    out[idx] = smaller;
    for (let i = r; i <= m; i += i & -i) tree[i]++;                  // record this value
  }
  return out;
}`,
          java: `class Solution {
    public List<Integer> countSmaller(int[] nums) {
        int[] s = nums.clone();
        Arrays.sort(s);
        int m = 0;
        for (int i = 0; i < s.length; i++) if (i == 0 || s[i] != s[i - 1]) s[m++] = s[i];   // sorted distinct values define the ranks
        int[] tree = new int[m + 1];
        Integer[] out = new Integer[nums.length];
        for (int idx = nums.length - 1; idx >= 0; idx--) {                // sweep from the right
            int r = Arrays.binarySearch(s, 0, m, nums[idx]) + 1;
            int smaller = 0;
            for (int i = r - 1; i > 0; i -= i & -i) smaller += tree[i];   // prefix(r - 1): seen values with a smaller rank
            out[idx] = smaller;
            for (int i = r; i <= m; i += i & -i) tree[i]++;               // record this value
        }
        return Arrays.asList(out);
    }
}`,
          cpp: `class Solution {
public:
    vector<int> countSmaller(vector<int>& nums) {
        vector<int> s = nums;
        sort(s.begin(), s.end());
        s.erase(unique(s.begin(), s.end()), s.end());                    // sorted distinct values define the ranks
        int m = s.size(), n = nums.size();
        vector<int> tree(m + 1, 0), out(n, 0);
        for (int idx = n - 1; idx >= 0; idx--) {                         // sweep from the right
            int r = lower_bound(s.begin(), s.end(), nums[idx]) - s.begin() + 1;
            int smaller = 0;
            for (int i = r - 1; i > 0; i -= i & -i) smaller += tree[i];  // prefix(r - 1): seen values with a smaller rank
            out[idx] = smaller;
            for (int i = r; i <= m; i += i & -i) tree[i]++;              // record this value
        }
        return out;
    }
};`
        },
        complexity: 'O(n log n) time: sorting for the ranks, then one query and one update per element, each O(log m). O(n) space.',
        say: '“For each position I need how many later values are smaller. I’ll sweep from the right with a Fenwick tree that counts values seen so far by rank. The values can be negative and spread out, so I compress them to ranks first. For the current value I query the prefix up to rank minus one, which excludes equal values, store that as the answer, then add the value to the tree. That’s O(n log n). A merge sort that carries original indices would be the other standard answer.”',
        followups: [
          { q: 'What would change for “larger after self”?', a: 'Query `seen - prefix(rank)` instead (everything seen minus those less than or equal), or reverse the ranks. The sweep and the update stay the same.' },
          { q: 'How do you handle duplicates?', a: 'Equal values share a rank. Querying `prefix(rank - 1)` counts only strictly smaller ones, and inserting the value afterwards means it never counts itself.' },
          { q: 'Can you avoid sorting?', a: 'If the values are small integers in a known range, use them as ranks directly (shift negatives to start at 1). Otherwise you need the sort, or a balanced tree, or a merge-sort counting pass, which is also O(n log n).' },
          { q: 'What is the merge-sort alternative?', a: 'Sort the indices by value with merge sort. When an element from the left half is placed after some right-half elements have already been placed before it, those right-half elements are smaller and to its right: add their number to its count. Same O(n log n), more bookkeeping.' }
        ]
      },
      {
        lc: 493,
        restate: 'Given an integer array `nums`, count the pairs of positions `i < j` for which `nums[i] > 2 * nums[j]`.',
        examples: '- `[1, 3, 2, 3, 1]` → 2: the pairs (3, 1) at positions (1, 4) and (3, 4).\n- `[2, 4, 3, 5, 1]` → 3: the 1 at the end pairs with the earlier 4, 3 and 5. The earlier 2 does not count, because 2 is not more than 2 × 1.\n- Edge cases: values at the 32-bit limits, where `2 * x` overflows an int; negatives, where doubling makes the value **smaller**; zeros.',
        brute: 'Check every pair: O(n²), about 5·10⁹ checks at n = 10⁵.',
        insight: 'This is an inversion count with a twist: the comparison is against the **double** of the later value. Sweep left to right with a Fenwick tree of counts by rank. For the current `y`, the earlier values that are **at most** `2y` number `prefix(k)`, where `k` is how many distinct values are `<= 2y` (a binary search in the sorted distinct values). The earlier values **greater** than `2y` are `seen - prefix(k)`: add that. Then insert `y`. Only the original values need ranks, because `2y` is located by binary search rather than stored. Compute `2y` in a 64-bit type, since it can overflow.',
        code: {
          py: `from bisect import bisect_right

class Solution:
    def reversePairs(self, nums: List[int]) -> int:
        vals = sorted(set(nums))                  # distinct values: their positions are the ranks
        m = len(vals)
        tree = [0] * (m + 1)
        count = 0
        for seen, y in enumerate(nums):
            i, le = bisect_right(vals, 2 * y), 0   # how many distinct values are <= 2y
            while i > 0:                           # earlier values that are <= 2y
                le += tree[i]
                i -= i & -i
            count += seen - le                     # the rest of the earlier values are > 2y
            i = bisect_right(vals, y)              # rank of y itself
            while i <= m:
                tree[i] += 1
                i += i & -i
        return count`,
          js: `function reversePairs(nums) {
  const vals = [...new Set(nums)].sort((a, b) => a - b), m = vals.length;
  const tree = new Array(m + 1).fill(0);
  const upper = (x) => {                          // how many distinct values are <= x
    let lo = 0, hi = m;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vals[mid] <= x) lo = mid + 1; else hi = mid;
    }
    return lo;
  };
  let count = 0;
  nums.forEach((y, seen) => {
    let le = 0;
    for (let i = upper(2 * y); i > 0; i -= i & -i) le += tree[i];   // earlier values that are <= 2y
    count += seen - le;                                              // the rest of the earlier values are > 2y
    for (let i = upper(y); i <= m; i += i & -i) tree[i]++;           // rank of y itself
  });
  return count;
}`,
          java: `class Solution {
    private int upper(int[] vals, int m, long x) {      // how many distinct values are <= x
        int lo = 0, hi = m;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (vals[mid] <= x) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
    public int reversePairs(int[] nums) {
        int[] vals = nums.clone();
        Arrays.sort(vals);
        int m = 0;
        for (int i = 0; i < vals.length; i++) if (i == 0 || vals[i] != vals[i - 1]) vals[m++] = vals[i];
        int[] tree = new int[m + 1];
        int count = 0;
        for (int seen = 0; seen < nums.length; seen++) {
            int le = 0;
            for (int i = upper(vals, m, 2L * nums[seen]); i > 0; i -= i & -i) le += tree[i];   // earlier values that are <= 2y (2L avoids overflow)
            count += seen - le;                                                                  // the rest of the earlier values are > 2y
            for (int i = upper(vals, m, nums[seen]); i <= m; i += i & -i) tree[i]++;             // rank of y itself
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int reversePairs(vector<int>& nums) {
        vector<int> vals = nums;
        sort(vals.begin(), vals.end());
        vals.erase(unique(vals.begin(), vals.end()), vals.end());
        int m = vals.size(), count = 0;
        vector<int> tree(m + 1, 0);
        for (int seen = 0; seen < (int)nums.size(); seen++) {
            int le = 0;
            for (int i = upper_bound(vals.begin(), vals.end(), 2LL * nums[seen]) - vals.begin(); i > 0; i -= i & -i)
                le += tree[i];                                                  // earlier values that are <= 2y (2LL avoids overflow)
            count += seen - le;                                                 // the rest of the earlier values are > 2y
            for (int i = upper_bound(vals.begin(), vals.end(), nums[seen]) - vals.begin(); i <= m; i += i & -i)
                tree[i]++;                                                      // rank of y itself
        }
        return count;
    }
};`
        },
        complexity: 'O(n log n) time: a sort, then per element two binary searches, one query and one update, each O(log n). O(n) space.',
        say: '“It’s an inversion count where the later value is doubled. I sweep left to right with a Fenwick tree of counts by rank over the distinct values. For each y, a binary search tells me how many distinct values are at most 2y, the tree tells me how many earlier values fall there, and the rest of the earlier values are greater than 2y, so I add that and then insert y. I compute 2y as a 64-bit number to avoid overflow. O(n log n). The merge-sort version counts the same pairs with two pointers before merging.”',
        followups: [
          { q: 'Why do negatives need care?', a: 'Doubling a negative makes it smaller, so “greater than twice the later value” is a much easier test when the later value is negative. Because the code locates `2y` by binary search in the real sorted values, the order of the numbers handles that without special cases.' },
          { q: 'Why not compress `2y` together with the values?', a: 'You can, and some solutions do. A binary search in the sorted distinct values gives the same count, uses a smaller tree, and needs no extra rank table.' },
          { q: 'How does merge sort count the same pairs?', a: 'Before merging two sorted halves, advance a pointer in the right half while `left[i] > 2 * right[j]` and add how many right elements it passed, for each left element in order. Then merge normally. It’s O(n log n) with O(n) buffer space.' }
        ]
      },
      {
        lc: 327,
        restate: 'Given an integer array `nums` and two bounds `lower <= upper`, count the contiguous, non-empty stretches whose sum is between `lower` and `upper`, both included.',
        examples: '- `nums = [-2, 5, -1]`, `lower = -2`, `upper = 2` → 3: the stretches `[-2]`, `[-2, 5, -1]` and `[-1]`.\n- `nums = [0]`, `lower = 0`, `upper = 0` → 1.\n- Edge cases: sums that exceed 32 bits (use 64-bit); many zeros (every stretch counts when the range includes 0).',
        brute: 'Try every start and extend to every end with a running sum: O(n²), about 5·10⁹ at n = 10⁵.',
        insight: 'The stretch from `i` to `j` has sum `P[j + 1] - P[i]`, where `P` are the prefix sums, so it counts when `lower <= P[j + 1] - P[i] <= upper`. That is: **some earlier prefix `p` lies in `[P[j + 1] - upper, P[j + 1] - lower]`**. A sliding window doesn’t work (negatives), but a Fenwick tree does: compress all prefix values, keep counts of the earlier prefixes by rank, and for each new prefix answer with the **difference of two prefix queries**: the earlier prefixes `<= P - lower` minus those `< P - upper`. Insert `P[0] = 0` first, and use 64-bit sums.',
        code: {
          py: `from bisect import bisect_left, bisect_right

class Solution:
    def countRangeSum(self, nums: List[int], lower: int, upper: int) -> int:
        prefix = [0]
        for x in nums:
            prefix.append(prefix[-1] + x)
        vals = sorted(set(prefix))                # compress every prefix value
        m = len(vals)
        tree = [0] * (m + 1)

        def add(i):
            while i <= m:
                tree[i] += 1
                i += i & -i

        def query(i):                              # how many stored prefixes have rank <= i
            s = 0
            while i > 0:
                s += tree[i]
                i -= i & -i
            return s

        add(bisect_left(vals, 0) + 1)              # the empty prefix P[0] = 0
        total = 0
        for p in prefix[1:]:
            hi = bisect_right(vals, p - lower)     # earlier prefixes <= p - lower ...
            lo = bisect_left(vals, p - upper)      # ... minus those < p - upper
            total += query(hi) - query(lo)
            add(bisect_left(vals, p) + 1)
        return total`,
          js: `function countRangeSum(nums, lower, upper) {
  const prefix = [0];
  for (const x of nums) prefix.push(prefix[prefix.length - 1] + x);
  const vals = [...new Set(prefix)].sort((a, b) => a - b), m = vals.length;   // compress every prefix value
  const tree = new Array(m + 1).fill(0);
  const lowerBound = (x) => {                      // first index with vals[idx] >= x
    let lo = 0, hi = m;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (vals[mid] < x) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const upperBound = (x) => {                      // first index with vals[idx] > x
    let lo = 0, hi = m;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (vals[mid] <= x) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const add = (i) => { for (; i <= m; i += i & -i) tree[i]++; };
  const query = (i) => { let s = 0; for (; i > 0; i -= i & -i) s += tree[i]; return s; };   // stored prefixes with rank <= i
  add(lowerBound(0) + 1);                          // the empty prefix P[0] = 0
  let total = 0;
  for (let k = 1; k < prefix.length; k++) {
    const p = prefix[k];
    total += query(upperBound(p - lower)) - query(lowerBound(p - upper));   // earlier prefixes in [p - upper, p - lower]
    add(lowerBound(p) + 1);
  }
  return total;
}`,
          java: `class Solution {
    private int bound(long[] vals, int m, long x, boolean strict) {   // strict: first index with vals > x; else first index with vals >= x
        int lo = 0, hi = m;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (strict ? vals[mid] <= x : vals[mid] < x) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
    private int query(int[] tree, int i) {                           // stored prefixes with rank <= i
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];
        return s;
    }
    public int countRangeSum(int[] nums, int lower, int upper) {
        int n = nums.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        long[] vals = prefix.clone();
        Arrays.sort(vals);
        int m = 0;
        for (int i = 0; i <= n; i++) if (i == 0 || vals[i] != vals[i - 1]) vals[m++] = vals[i];   // compress every prefix value
        int[] tree = new int[m + 1];
        for (int i = bound(vals, m, 0, false) + 1; i <= m; i += i & -i) tree[i]++;                // the empty prefix P[0] = 0
        int total = 0;
        for (int k = 1; k <= n; k++) {
            long p = prefix[k];
            total += query(tree, bound(vals, m, p - lower, true)) - query(tree, bound(vals, m, p - upper, false));   // earlier prefixes in [p - upper, p - lower]
            for (int i = bound(vals, m, p, false) + 1; i <= m; i += i & -i) tree[i]++;
        }
        return total;
    }
}`,
          cpp: `class Solution {
    int query(vector<int>& tree, int i) {                            // stored prefixes with rank <= i
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];
        return s;
    }
public:
    int countRangeSum(vector<int>& nums, int lower, int upper) {
        int n = nums.size();
        vector<long long> prefix(n + 1, 0);
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        vector<long long> vals = prefix;
        sort(vals.begin(), vals.end());
        vals.erase(unique(vals.begin(), vals.end()), vals.end());    // compress every prefix value
        int m = vals.size();
        vector<int> tree(m + 1, 0);
        auto lowerRank = [&](long long x) { return int(lower_bound(vals.begin(), vals.end(), x) - vals.begin()); };
        auto upperRank = [&](long long x) { return int(upper_bound(vals.begin(), vals.end(), x) - vals.begin()); };
        for (int i = lowerRank(0) + 1; i <= m; i += i & -i) tree[i]++;   // the empty prefix P[0] = 0
        int total = 0;
        for (int k = 1; k <= n; k++) {
            long long p = prefix[k];
            total += query(tree, upperRank(p - lower)) - query(tree, lowerRank(p - upper));   // earlier prefixes in [p - upper, p - lower]
            for (int i = lowerRank(p) + 1; i <= m; i += i & -i) tree[i]++;
        }
        return total;
    }
};`
        },
        complexity: 'O(n log n) time: one sort of the prefix sums, then per element two binary searches, two queries and one update. O(n) space.',
        say: '“A stretch’s sum is the difference of two prefix sums, so I’m counting pairs of prefixes whose difference lies in the range. For each new prefix P, I need how many earlier prefixes fall in [P − upper, P − lower]. I compress all prefix values, keep a Fenwick tree of counts by rank, and answer each position as the count at most P − lower minus the count below P − upper, then insert P. I seed the tree with the empty prefix, zero, and use 64-bit sums. O(n log n).”',
        followups: [
          { q: 'Why not a sliding window or a plain hash map?', a: 'The target is a range, not a single value, and the numbers can be negative, so there’s no monotonic edge to move, and a hash map can only look up exact values. A tree of counts by rank answers “how many in this range of values” directly.' },
          { q: 'Why seed with the empty prefix?', a: 'A stretch that starts at index 0 pairs with `P[0] = 0`. Without it those stretches are missed.' },
          { q: 'What is the merge-sort alternative?', a: 'Merge sort on the prefix sums. Before merging two sorted halves, for each left value use two pointers to count right values in the target range, then merge. It’s O(n log n) too and avoids compression.' },
          { q: 'Can the sums overflow?', a: 'Yes: 10⁵ values near 2³¹ add up to far more than 32 bits. Use `long` or `long long` for the prefix sums and for `p - lower` and `p - upper`.' }
        ]
      }
    ],

    practice: [
      { lc: 315,
        hints: ['Scanning right of every element is O(n²). Which structure counts “how many values so far are smaller than x” in O(log n)?', 'Sweep from the right. Keep a Fenwick tree of counts indexed by the **rank** of each value (sort the distinct values first, so negatives and gaps don’t matter).', 'For each value, the answer is `prefix(rank - 1)` (strictly smaller, so equal values stay out). Then add 1 at `rank`.'],
        solution: { explain: 'Compress the values to ranks, sweep from the right, query the prefix just below the current rank, then record the value. O(n log n) time, O(n) space.', code: {
          py: `class Solution:
    def countSmaller(self, nums: List[int]) -> List[int]:
        ranks = {v: r for r, v in enumerate(sorted(set(nums)), 1)}
        m = len(ranks)
        tree = [0] * (m + 1)
        out = [0] * len(nums)
        for idx in range(len(nums) - 1, -1, -1):
            r = ranks[nums[idx]]
            i, smaller = r - 1, 0
            while i > 0:
                smaller += tree[i]
                i -= i & -i
            out[idx] = smaller
            i = r
            while i <= m:
                tree[i] += 1
                i += i & -i
        return out`,
          js: `function countSmaller(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const ranks = new Map(sorted.map((v, k) => [v, k + 1]));
  const m = sorted.length, tree = new Array(m + 1).fill(0), out = new Array(nums.length).fill(0);
  for (let idx = nums.length - 1; idx >= 0; idx--) {
    const r = ranks.get(nums[idx]);
    let smaller = 0;
    for (let i = r - 1; i > 0; i -= i & -i) smaller += tree[i];
    out[idx] = smaller;
    for (let i = r; i <= m; i += i & -i) tree[i]++;
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def countSmaller(self, nums: List[int]) -> List[int]:\n        ', js: 'function countSmaller(nums) {\n  \n}' },
        tests: { fn: 'countSmaller', sig: { args: ['int[]'] }, cases: [
          { args: [[5, 2, 6, 1]], out: [2, 1, 1, 0] }, { args: [[-1]], out: [0] }, { args: [[-1, -1]], out: [0, 0] }, { args: [[3, 2, 1]], out: [2, 1, 0] },
          { args: [[1, 2, 3]], out: [0, 0, 0] }, { args: [[2, 0, 1, 0, 2, -3]], out: [4, 1, 2, 1, 1, 0] }, { args: [[7, 7, 7, 1]], out: [1, 1, 1, 0] }] } },

      { lc: 493,
        hints: ['It’s a pair-counting problem like inversions, but the test is `nums[i] > 2 * nums[j]`. Sweep left to right and ask, for each `nums[j]`, how many earlier values are bigger than twice it.', 'Keep a Fenwick tree of counts by rank over the distinct values. The earlier values `<= 2 * y` are a prefix query at “how many distinct values are `<= 2 * y`” (a binary search).', 'The answer for this j is `seen - thatPrefix`. Then insert `y` at its own rank. Compute `2 * y` in 64 bits: the input can reach the 32-bit limits.'],
        solution: { explain: 'A Fenwick tree of counts by rank, with a binary search to find where `2y` falls among the sorted distinct values. O(n log n) time, O(n) space. A merge sort that counts pairs with two pointers before each merge is equivalent.', code: {
          py: `from bisect import bisect_right

class Solution:
    def reversePairs(self, nums: List[int]) -> int:
        vals = sorted(set(nums))
        m = len(vals)
        tree = [0] * (m + 1)
        count = 0
        for seen, y in enumerate(nums):
            i, le = bisect_right(vals, 2 * y), 0
            while i > 0:
                le += tree[i]
                i -= i & -i
            count += seen - le
            i = bisect_right(vals, y)
            while i <= m:
                tree[i] += 1
                i += i & -i
        return count`,
          js: `function reversePairs(nums) {
  const vals = [...new Set(nums)].sort((a, b) => a - b), m = vals.length;
  const tree = new Array(m + 1).fill(0);
  const upper = (x) => {
    let lo = 0, hi = m;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vals[mid] <= x) lo = mid + 1; else hi = mid;
    }
    return lo;
  };
  let count = 0;
  nums.forEach((y, seen) => {
    let le = 0;
    for (let i = upper(2 * y); i > 0; i -= i & -i) le += tree[i];
    count += seen - le;
    for (let i = upper(y); i <= m; i += i & -i) tree[i]++;
  });
  return count;
}` } },
        starter: { py: 'class Solution:\n    def reversePairs(self, nums: List[int]) -> int:\n        ', js: 'function reversePairs(nums) {\n  \n}' },
        tests: { fn: 'reversePairs', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 3, 2, 3, 1]], out: 2 }, { args: [[2, 4, 3, 5, 1]], out: 3 }, { args: [[1]], out: 0 }, { args: [[2147483647, -2147483648, 2147483647]], out: 1 },
          { args: [[0, 0, 0]], out: 0 }, { args: [[-5, -5]], out: 1 }, { args: [[5, 2, 2, 1, 0, -1]], out: 12 }] } },

      { lc: 327,
        hints: ['Write each stretch sum as a difference of two prefix sums. You’re counting pairs of prefixes (earlier, later) whose difference lies in `[lower, upper]`.', 'For a new prefix `p`, the earlier prefixes that work lie in `[p - upper, p - lower]`. Compress all prefix values and keep a Fenwick tree of counts by rank.', 'Count = (earlier prefixes `<= p - lower`) minus (earlier prefixes `< p - upper`), two prefix queries. Insert the empty prefix 0 before the loop, and use 64-bit sums.'],
        solution: { explain: 'Prefix sums, compressed, plus a Fenwick tree of counts: each position is the difference of two prefix queries. O(n log n) time, O(n) space. Merge sort over the prefix sums with two pointers is the alternative.', code: {
          py: `from bisect import bisect_left, bisect_right

class Solution:
    def countRangeSum(self, nums: List[int], lower: int, upper: int) -> int:
        prefix = [0]
        for x in nums:
            prefix.append(prefix[-1] + x)
        vals = sorted(set(prefix))
        m = len(vals)
        tree = [0] * (m + 1)

        def add(i):
            while i <= m:
                tree[i] += 1
                i += i & -i

        def query(i):
            s = 0
            while i > 0:
                s += tree[i]
                i -= i & -i
            return s

        add(bisect_left(vals, 0) + 1)
        total = 0
        for p in prefix[1:]:
            total += query(bisect_right(vals, p - lower)) - query(bisect_left(vals, p - upper))
            add(bisect_left(vals, p) + 1)
        return total`,
          js: `function countRangeSum(nums, lower, upper) {
  const prefix = [0];
  for (const x of nums) prefix.push(prefix[prefix.length - 1] + x);
  const vals = [...new Set(prefix)].sort((a, b) => a - b), m = vals.length;
  const tree = new Array(m + 1).fill(0);
  const bound = (x, strict) => {
    let lo = 0, hi = m;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (strict ? vals[mid] <= x : vals[mid] < x) lo = mid + 1; else hi = mid;
    }
    return lo;
  };
  const add = (i) => { for (; i <= m; i += i & -i) tree[i]++; };
  const query = (i) => { let s = 0; for (; i > 0; i -= i & -i) s += tree[i]; return s; };
  add(bound(0, false) + 1);
  let total = 0;
  for (let k = 1; k < prefix.length; k++) {
    const p = prefix[k];
    total += query(bound(p - lower, true)) - query(bound(p - upper, false));
    add(bound(p, false) + 1);
  }
  return total;
}` } },
        starter: { py: 'class Solution:\n    def countRangeSum(self, nums: List[int], lower: int, upper: int) -> int:\n        ', js: 'function countRangeSum(nums, lower, upper) {\n  \n}' },
        tests: { fn: 'countRangeSum', sig: { args: ['int[]', 'int', 'int'] }, cases: [
          { args: [[-2, 5, -1], -2, 2], out: 3 }, { args: [[0], 0, 0], out: 1 }, { args: [[2, -3, 4, 1], -1, 3], out: 6 },
          { args: [[2147483647, -2147483648, -1, 0], -1, 0], out: 4 }, { args: [[1, 1, 1], 5, 9], out: 0 }, { args: [[0, 0, 0], 0, 0], out: 6 }] } }
    ],

    mistakes: [
      '**Using index 0.** `lowbit(0)` is 0, so `i += i & -i` never moves and the loop hangs, while `i -= i & -i` has nothing to collect. Shift every external 0-indexed position by one, and size the array `n + 1`.',
      '**Wrong direction.** **Update goes up** (`i += i & -i`), **query goes down** (`i -= i & -i`). Swapping them runs without crashing and returns wrong sums, which is worse. The visualizer shows both.',
      '**`<=` vs `<` in the loop bounds.** Update loops while `i <= n`; query loops while `i > 0`. Writing `i < n` drops the last position.',
      '**Assigning instead of adding.** A Fenwick tree only knows how to add. “Set position a to b” is `add(a, b - current[a])`, so keep a copy of the array. Passing `b` straight to `add` double counts.',
      '**Range sum off by one.** The sum of 1-indexed positions `l..r` is `prefix(r) - prefix(l - 1)`. With 0-indexed input and a shift, that’s `prefix(r + 1) - prefix(l)`. Mixing the two conventions drops or adds one element.',
      '**Forgetting to compress.** Ranks must be small and dense. Using raw values as indices (they can be negative or 10⁹) crashes or allocates a huge array. Sort the distinct values and use each value’s position, starting at 1.',
      '**Counting equal values as smaller.** For “strictly smaller” query `prefix(rank - 1)`, not `prefix(rank)`. For “greater than” use `seen - prefix(rank)`. Check the equal-values case by hand.',
      '**Overflow.** Counts of pairs reach about n²/2, and prefix sums of large values exceed 32 bits. Use `long` in Java and `long long` in C++ for totals, and compute `2 * x` in 64 bits. Python needs no care.',
      '**Using it for min or max.** `prefix(r) - prefix(l - 1)` only works because a sum can be undone. A maximum can’t, so a Fenwick tree can’t answer “maximum of a range with updates”. Use a segment tree.',
      '**Language gotchas.** *Python:* a recursive or per-call `lowbit` helper is slower than writing `i & -i` inline, which matters at 10⁵ operations. *JavaScript:* `i & -i` works on 32-bit integers, so it’s safe for indices but wrong if you ever apply it to a value above 2³¹. *Java:* `Arrays.binarySearch` on an array with duplicates returns an arbitrary match, so de-duplicate first (or use a custom lower bound). *C++:* `lower_bound` returns an iterator, so subtract `begin()`; and `i & -i` on an unsigned type is fine but `int` is the convention.'
    ],

    quiz: [
      { kind: 'concept', q: 'What is `lowbit(i)`, and what does `tree[i]` store in a Fenwick tree?',
        choices: ['`i & -i`, the value of the lowest set bit; the sum of the `lowbit(i)` values ending at position i', '`i & (i - 1)`; the sum of the first i values', '`i >> 1`; the sum of the left half', 'The largest power of two below i; the sum of one value'], answer: 0,
        explain: '`i & -i` isolates the lowest set bit. Position 6 (`110`) has lowbit 2, so `tree[6]` covers positions 5 and 6. `i & (i - 1)` clears that bit instead.' },
      { kind: 'concept', q: 'Which positions does `prefix(7)` read, in order, and why?',
        choices: ['7, 6, 4: it clears the lowest set bit each time (111 → 110 → 100 → 0)', '7, 8, 16: it adds the lowest bit each time', '7, 5, 3, 1: it subtracts 2 each time', '7, 3, 1: it halves each time'], answer: 0,
        explain: '`7 - 1 = 6`, `6 - 2 = 4`, `4 - 4 = 0`. The blocks 7, 5..6 and 1..4 tile 1..7 exactly. Adding the lowest bit is the **update** direction.' },
      { kind: 'concept', q: 'In a Fenwick tree over n = 8, `update(3, v)` changes which nodes?',
        choices: ['3, 4 and 8', '3 only', '1, 2 and 3', '3, 6 and 7'], answer: 0,
        explain: '`3 + 1 = 4`, `4 + 4 = 8`, `8 + 8 = 16` is past n. Node 3 covers position 3, node 4 covers 1..4 and node 8 covers 1..8: exactly the blocks that contain position 3.' },
      { kind: 'complexity', q: 'You have n values and you build a Fenwick tree from them with the “push into parent” trick. What does the build cost?',
        choices: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'], answer: 0,
        explain: 'Each node is pushed into its single parent once, so it’s linear. Calling `update` for every element would be O(n log n).' },
      { kind: 'complexity', q: 'What is the total time to count inversions in an array of n values with a Fenwick tree and coordinate compression?',
        choices: ['O(n log n)', 'O(n)', 'O(n²)', 'O(n log² n)'], answer: 0,
        explain: 'Sorting for the ranks is O(n log n). Then each element does one query and one update, each O(log n), so the sweep is O(n log n) as well.' },
      { kind: 'pattern', q: 'Which problem is the best fit for a Fenwick tree?',
        choices: ['Many “add to one cell” changes interleaved with “sum of the first k cells” questions', 'The longest substring without a repeated character', 'The k-th largest element of a stream', 'The shortest path in a weighted graph'], answer: 0,
        explain: 'Point updates plus prefix sums is the Fenwick tree’s home turf. The others are a sliding window, a heap and Dijkstra.' },
      { kind: 'pattern', q: 'Which of these signal a Fenwick tree? Pick every one that applies.',
        choices: ['For each element, count how many later elements are smaller', 'The array is fixed and you answer many range sums', 'Point updates mixed with prefix or range sums', 'Range minimum with updates'], answer: [0, 2],
        explain: 'Counting smaller-after-self (by rank) and mixed updates and sums are Fenwick problems. A fixed array only needs a prefix-sum array, and range minimum can’t be undone by subtraction, so it needs a segment tree.' },
      { kind: 'bug', q: 'This `update` is meant to add `v` at position `i`, but the tree’s answers are wrong. What’s the bug?',
        code: `def update(tree, i, v):
    n = len(tree) - 1
    while i <= n:
        tree[i] += v
        i -= i & -i`,
        choices: ['It should move up with `i += i & -i`, not down with `i -= i & -i`', 'The loop should stop at `i < n`', '`tree[i]` should be assigned `v`, not incremented', 'It needs to start from `i = 0`'], answer: 0,
        explain: 'Update climbs to the wider blocks that contain position i. Subtracting the lowest bit walks down (the query direction), so it changes the wrong nodes, and for `i - lowbit` reaching 0 the loop would end early or never reach what it needs.' },
      { kind: 'bug', q: 'A learner computes “count of earlier values strictly smaller than x” as `prefix(rank(x))` and gets answers that are too big on arrays with repeated values. What’s wrong?',
        choices: ['It should query `prefix(rank(x) - 1)`, so equal values aren’t included', 'It should query `prefix(rank(x) + 1)`', 'It should update before querying', 'The ranks should start at 0'], answer: 0,
        explain: '`prefix(rank)` includes everything at rank `rank`, which are the equal values. Strictly smaller means ranks below it, so stop one earlier. (Updating before querying would make a value count itself.)' },
      { kind: 'concept', q: 'You need the minimum of a range, with point updates. Why can’t a Fenwick tree answer it as `prefix(r) - prefix(l - 1)` does for sums?',
        choices: ['A minimum can’t be “subtracted out”: the range answer isn’t a function of two prefix answers', 'Fenwick trees only support integers', 'The tree is too deep', 'Minimum needs a 2-D tree'], answer: 0,
        explain: 'The range trick depends on an invertible operation. Knowing the minimum of the first r values and of the first l − 1 values says nothing about the minimum of the stretch between them. Use a segment tree.' }
    ],

    flashcards: [
      { id: 'lowbit', front: 'Fenwick tree: what is `lowbit(i)` and what does `tree[i]` hold?', back: '`i & -i`, the value of the lowest set bit. `tree[i]` is the sum of the `lowbit(i)` values that end at position i, so position 6 (`110`) covers positions 5 and 6.' },
      { id: 'prefix-walk', front: 'Fenwick `prefix(i)`: which way do you move?', back: 'Down. Add `tree[i]`, then `i -= i & -i` (clear the lowest set bit) until i is 0. At most one step per set bit of i.' },
      { id: 'update-walk', front: 'Fenwick `update(i, v)`: which way do you move?', back: 'Up. Add v to `tree[i]`, then `i += i & -i` (carry the lowest bit up) while `i <= n`. These are exactly the blocks that contain position i.' },
      { id: 'one-indexed', front: 'Why is a Fenwick tree 1-indexed?', back: '`lowbit(0)` is 0, so `i += i & -i` would never leave 0. The structure comes from the binary form of positive integers. Shift 0-indexed input by one and size the array n + 1.' },
      { id: 'range-sum', front: 'Fenwick range sum of positions l..r (1-indexed)?', back: '`prefix(r) - prefix(l - 1)`. It works because addition can be undone. It does not work for min or max.' },
      { id: 'set-vs-add', front: 'How do you “set position a to b” in a Fenwick tree?', back: 'The tree only adds: call `add(a, b - current[a])` and keep a copy of the array to know `current[a]`.' },
      { id: 'build-linear', front: 'How do you build a Fenwick tree in O(n)?', back: 'Copy the values into slots 1..n, then for i from 1 to n push `tree[i]` into its parent `i + lowbit(i)` when that is <= n. Each node is final by the time you reach it.' },
      { id: 'complexity', front: 'Fenwick tree complexity?', back: '`update` and `prefix` are O(log n) worst case. Build is O(n). Space is O(n). Small constants, one flat array.' },
      { id: 'smaller-after', front: 'Count of smaller numbers after self: the Fenwick recipe?', back: 'Compress values to ranks. Sweep from the right. Answer = `prefix(rank - 1)` (strictly smaller), then `update(rank, +1)`. O(n log n).' },
      { id: 'inversions', front: 'Counting inversions with a Fenwick tree?', back: 'Sweep left to right. Earlier values greater than x = `seen - prefix(rank(x))`. Then `update(rank(x), +1)`. Use a 64-bit total.' },
      { id: 'range-sum-count', front: 'Count of range sums in [lo, hi]: what do you store and query?', back: 'Prefix sums, compressed. For each new prefix p, count earlier prefixes in `[p - hi, p - lo]` as `prefix(<= p - lo) - prefix(< p - hi)`. Seed with the empty prefix 0 and use 64-bit sums.' },
      { id: 'vs-segment', front: 'Fenwick tree vs segment tree: when do you pick which?', back: 'Fenwick: sums, counts or XOR with point updates, about 10 lines, faster. Segment tree: min, max, gcd, range assignment, lazy range updates, or “first position where…”. Fenwick needs an invertible operation.' },
      { id: 'two-d', front: 'How does a 2-D Fenwick tree work?', back: 'Nest the loops: the outer loop walks the row index, the inner loop the column index, both with lowbit jumps. Update and prefix are O(log R · log C). A general rectangle uses four prefix calls.' }
    ],

    deeper: [
      { title: 'Fenwick Tree (cp-algorithms)', url: 'https://cp-algorithms.com/data_structures/fenwick.html', time: 'about 20 min', note: 'A thorough write-up of the lowbit idea, the proof for the update and query loops, range updates, and the 2-D version. Not fetched while building this page, so if the address has moved, search the site for “Fenwick tree”.' },
      { title: 'Point Update Range Sum (USACO Guide)', url: 'https://usaco.guide/gold/PURS', time: 'about 25 min', note: 'A friendly intro with practice problems that run from the basic Fenwick tree to counting inversions. Not fetched while building this page.' },
      { title: 'Binary Indexed Tree problems (LeetCode tag)', url: 'https://leetcode.com/tag/binary-indexed-tree/', time: 'reference', note: 'Every problem LeetCode tags with this structure, sortable by difficulty. A good source of extra reps once the three practice items here feel easy.' }
    ],

    detective: [
      { id: 'trivia-night', decoys: ['prefix-sums', 'segment-tree', 'arrays-hashing'],
        statement: 'A pub runs a trivia night with up to 100,000 teams seated at numbered tables. Throughout the evening the host keeps announcing points awarded to one team at a time, and every few minutes the screen needs to show the combined score of every team seated at tables 1 through k, for whatever k the host picks. The screen must refresh instantly, however long the night runs. How would you keep it quick?',
        why: 'Scores change one cell at a time, and the questions are totals of a leading stretch, interleaved with those changes. A plain running-total array would need to be rebuilt after every award, and re-adding every time is too slow. Store partial totals over blocks whose sizes follow the binary form of the table number: each award touches a few blocks, and each question reads a few. The operation (adding) can be undone, so no heavier structure is needed.' },
      { id: 'bookshelf-swaps', decoys: ['sorting', 'monotonic', 'binary-search'],
        statement: 'A librarian has a shelf of up to 100,000 books, each stamped with a catalogue number that can be any whole number, including very large ones and negative ones for archived items. She may only swap two books that are standing next to each other. She wants to know how many swaps it takes at minimum to put the shelf in increasing order of catalogue number. She does not need the swaps themselves, only how many.',
        why: 'The minimum number of neighbour swaps equals the number of pairs that are out of order: an earlier book with a larger number than a later one. Counting those pairs one element at a time needs “how many earlier books are larger?”, and the numbers are too wild to index directly, so replace each by its position in the sorted order first. Keep counts by position in a structure that supports “add one here” and “how many up to here” in logarithmic time, and the whole shelf takes n log n. Sorting itself would only give you the order, not the count.' },
      { id: 'orchard-moisture', decoys: ['matrix', 'prefix-sums', 'segment-tree'],
        statement: 'An orchard is laid out as a grid of plots with up to 1,000 rows and 1,000 columns. Sensors report, all day long, that the moisture in one plot has gone up or down by some amount. Between reports, the farmer taps a plot on the map and wants the total moisture of the whole rectangle from the north-west corner of the orchard down to that plot. Reports and taps arrive in any order, and each tap must be answered immediately.',
        why: 'It’s a rectangle total over a grid, but the grid keeps changing, so a table of precomputed corner totals would need rebuilding after every report. Keep partial totals over blocks whose sizes follow the binary form of the row number, and inside each, blocks that follow the binary form of the column number. A report touches a few row blocks times a few column blocks, and so does a tap: logarithmic in each direction. A fixed grid would be the prefix-table case; a changing one needs this nesting.' }
    ]
  });
})();
