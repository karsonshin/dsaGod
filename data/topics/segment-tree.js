/* Offer Ready: Segment trees. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in.
   Operations are encoded as int rows so the snippets are plain functions: [0, i, v] = set position i to v, [1, l, r] = ask for the range l..r (inclusive).
   The lazy variants use rows [0, l, r, v] = add v to l..r and [1, l, r, 0] = sum of l..r. */
(function () {
  var OR = (window.OR = window.OR || {});
  var HEAP = `class Heap {                         // max-heap by default here; pass less = (a, b) => a < b for a min-heap
  constructor(less = (a, b) => a > b) { this.a = []; this.less = less; }
  get size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]]; i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (2 * i + 1 < a.length) {
        let c = 2 * i + 1;
        if (c + 1 < a.length && this.less(a[c + 1], a[c])) c++;
        if (!this.less(a[c], a[i])) break;
        [a[c], a[i]] = [a[i], a[c]]; i = c;
      }
    }
    return top;
  }
}
`;
  (OR.topics = OR.topics || []).push({
    id: 'segment-tree',

    hook: 'A prefix-sum array answers “what is the sum of this range?” instantly, until the array changes: one update means rebuilding O(n) sums. A segment tree keeps **both** operations cheap, O(log n) to change a value and O(log n) to ask about any range, and it works for far more than sums: minimum, maximum, gcd, “how many are below x”. It is the standard tool when the question mixes **changes** with **range questions**. It is rare in phone screens (and is a stretch topic, not in the NeetCode 150) but common in hard rounds and contest-style onsites, and the idea of “store an answer for every block of a halving split” comes back in many other problems.',

    cues: [
      'You are asked about **ranges** (sum, minimum, maximum, count) **and** the values can **change** between questions. If nothing ever changes, prefix sums or a sparse table are simpler.',
      'There are many (10⁴ to 10⁵) mixed updates and queries, so O(n) per query or per update is too slow.',
      'The operation **combines** two halves into one answer (sum, min, max, gcd, product, “is it sorted”), meaning the answer for a range can be built from the answers of its two halves.',
      'A whole range changes at once (“add 5 to every item in positions 3 to 9”) and you still need range answers: that’s a **lazy** segment tree.',
      'The coordinates are huge but there are few of them (positions up to 10⁹ but only 1000 events): **compress** them first, then build the tree over the ranks.',
      'The trap: if you only need prefix sums with point updates, a Fenwick tree is half the code. If you need only static answers, skip the tree entirely.'
    ],

    intuition: [
      'Think of a company’s sales split into a tree. The root says “total for the whole year”. Its two children say “first half” and “second half”. Each of those splits again, down to single days at the bottom. To ask “sales from day 40 to day 200”, you don’t add up 160 days. You take a few **whole blocks** that fit inside the range exactly (say a quarter, a month, a few days) and add their stored totals. To change one day, you fix that day and then the handful of blocks that contain it, all the way up to the root.',
      'That’s a **segment tree**. Precisely:',
      '1. Each node stores the answer (here, the sum) for one **segment** `[lo, hi]` of the array. The root covers `[0, n-1]`. A node with `lo < hi` splits at `mid = (lo + hi) // 2` into a left child `[lo, mid]` and a right child `[mid + 1, hi]`. A node with `lo == hi` is a **leaf** holding one array value.\n2. It lives in a plain array, like a heap: node `k` has children `2k` and `2k + 1`, and the root is node 1. With the halving split the depth is ⌈log₂ n⌉, so `4n` slots are always enough (the iterative version below needs only `2n`).\n3. **Build**: fill the leaves, and on the way back up set each node to the combine of its two children. Every node is visited once: **O(n)**.\n4. **Point update**: walk from the root to the one leaf that holds the index, set it, then recompute each node on the way back. One path, **O(log n)**.\n5. **Range query** `[l, r]`: at each node there are three cases. The node’s segment is **outside** the query (prune: return the neutral value, 0 for sums). It is **fully inside** (return the stored answer without looking deeper). It **partly overlaps** (ask both children and combine).',
      'Why is a query only O(log n)? At each level, at most **two** nodes are partial overlaps (the ones that contain the query’s left edge and right edge). Everything else at that level is either pruned or fully covered, and those two cases return immediately. Two partial nodes per level times log n levels is about 4 log n visited nodes in total, however wide the range is.',
      'The same skeleton does min, max, gcd and more: change the combine and the “outside” value. Only the combine has to be **associative** (grouping doesn’t matter), because the tree groups values by blocks. Sum, min, max and gcd are; “median of a range” is not.'
    ].join('\n\n'),

    viz: 'segment-tree',

    template: {
      title: 'Recursive segment tree for range sums: build, update, query',
      note: 'The **visualizer above lights these exact lines**. The array and its operations are passed in and the function returns the answer to each query, in order. An operation row is `[0, i, v]` to set position `i` to `v`, or `[1, l, r]` to ask for the sum of positions `l` to `r`, both ends included. Watch the three outcomes in `query`: **prune** (no overlap, return 0), **cover** (the whole segment fits, return the stored sum) and **split** (partial overlap, ask both children). Everything in the interview version is these ~25 lines.',
      code: {
        py: `def run_ops(nums, ops):
    n = len(nums)
    tree = [0] * (4 * n)                                   #> tree[1] is the root. Node k has children 2k and 2k+1. 4n slots are always enough

    def build(node, lo, hi):
        if lo == hi:
            tree[node] = nums[lo]                          #@leaf > 1. Build: a leaf is a single array value
            return
        mid = (lo + hi) // 2
        build(2 * node, lo, mid)
        build(2 * node + 1, mid + 1, hi)
        tree[node] = tree[2 * node] + tree[2 * node + 1]   #@pull > 2. A parent is the combine of its two children (the sum here)

    def update(node, lo, hi, i, v):
        if lo == hi:
            tree[node] = v                                 #@uleaf > 3. Update: reach the one leaf that holds index i and overwrite it
            return
        mid = (lo + hi) // 2
        if i <= mid:                                       #@udown > Go to the half that contains i. Only one child is visited
            update(2 * node, lo, mid, i, v)
        else:
            update(2 * node + 1, mid + 1, hi, i, v)
        tree[node] = tree[2 * node] + tree[2 * node + 1]   #@upull > 4. On the way back up, recompute every ancestor from its children

    def query(node, lo, hi, l, r):
        if r < lo or hi < l:                               #@prune > 5. Query: no overlap. This segment adds nothing, so return the neutral value
            return 0
        if l <= lo and hi <= r:                            #@cover > 6. Fully inside the query: use the stored sum and stop
            return tree[node]
        mid = (lo + hi) // 2
        return (query(2 * node, lo, mid, l, r) +           #@split > 7. Partial overlap: ask both halves and combine their answers
                query(2 * node + 1, mid + 1, hi, l, r))

    build(1, 0, n - 1)
    out = []
    for kind, a, b in ops:
        if kind == 0:
            update(1, 0, n - 1, a, b)
        else:
            out.append(query(1, 0, n - 1, a, b))
    return out`,
        js: `function runOps(nums, ops) {
  const n = nums.length;
  const tree = new Array(4 * n).fill(0);                   //> tree[1] is the root. Node k has children 2k and 2k+1. 4n slots are always enough

  function build(node, lo, hi) {
    if (lo === hi) {
      tree[node] = nums[lo];                               //@leaf > 1. Build: a leaf is a single array value
      return;
    }
    const mid = (lo + hi) >> 1;
    build(2 * node, lo, mid);
    build(2 * node + 1, mid + 1, hi);
    tree[node] = tree[2 * node] + tree[2 * node + 1];      //@pull > 2. A parent is the combine of its two children (the sum here)
  }

  function update(node, lo, hi, i, v) {
    if (lo === hi) {
      tree[node] = v;                                      //@uleaf > 3. Update: reach the one leaf that holds index i and overwrite it
      return;
    }
    const mid = (lo + hi) >> 1;
    if (i <= mid) update(2 * node, lo, mid, i, v);         //@udown > Go to the half that contains i. Only one child is visited
    else update(2 * node + 1, mid + 1, hi, i, v);
    tree[node] = tree[2 * node] + tree[2 * node + 1];      //@upull > 4. On the way back up, recompute every ancestor from its children
  }

  function query(node, lo, hi, l, r) {
    if (r < lo || hi < l) return 0;                        //@prune > 5. Query: no overlap. This segment adds nothing, so return the neutral value
    if (l <= lo && hi <= r) return tree[node];             //@cover > 6. Fully inside the query: use the stored sum and stop
    const mid = (lo + hi) >> 1;
    return query(2 * node, lo, mid, l, r) +                //@split > 7. Partial overlap: ask both halves and combine their answers
           query(2 * node + 1, mid + 1, hi, l, r);
  }

  build(1, 0, n - 1);
  const out = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) update(1, 0, n - 1, a, b);
    else out.push(query(1, 0, n - 1, a, b));
  }
  return out;
}`,
        java: `class Solution {
    int[] tree, nums;

    void build(int node, int lo, int hi) {
        if (lo == hi) {
            tree[node] = nums[lo];                                //@leaf > 1. Build: a leaf is a single array value
            return;
        }
        int mid = (lo + hi) / 2;
        build(2 * node, lo, mid);
        build(2 * node + 1, mid + 1, hi);
        tree[node] = tree[2 * node] + tree[2 * node + 1];         //@pull > 2. A parent is the combine of its two children (the sum here)
    }

    void update(int node, int lo, int hi, int i, int v) {
        if (lo == hi) {
            tree[node] = v;                                       //@uleaf > 3. Update: reach the one leaf that holds index i and overwrite it
            return;
        }
        int mid = (lo + hi) / 2;
        if (i <= mid) update(2 * node, lo, mid, i, v);            //@udown > Go to the half that contains i. Only one child is visited
        else update(2 * node + 1, mid + 1, hi, i, v);
        tree[node] = tree[2 * node] + tree[2 * node + 1];         //@upull > 4. On the way back up, recompute every ancestor from its children
    }

    int query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;                           //@prune > 5. Query: no overlap. This segment adds nothing, so return the neutral value
        if (l <= lo && hi <= r) return tree[node];                //@cover > 6. Fully inside the query: use the stored sum and stop
        int mid = (lo + hi) / 2;
        return query(2 * node, lo, mid, l, r) +                   //@split > 7. Partial overlap: ask both halves and combine their answers
               query(2 * node + 1, mid + 1, hi, l, r);
    }

    public int[] runOps(int[] nums, int[][] ops) {
        this.nums = nums;
        int n = nums.length;
        tree = new int[4 * n];                                    //> tree[1] is the root. Node k has children 2k and 2k+1. 4n slots are always enough
        build(1, 0, n - 1);
        List<Integer> out = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) update(1, 0, n - 1, op[1], op[2]);
            else out.add(query(1, 0, n - 1, op[1], op[2]));
        }
        int[] res = new int[out.size()];
        for (int k = 0; k < res.length; k++) res[k] = out.get(k);
        return res;
    }
}`,
        cpp: `class Solution {
    vector<int> tree, nums;

    void build(int node, int lo, int hi) {
        if (lo == hi) {
            tree[node] = nums[lo];                                //@leaf > 1. Build: a leaf is a single array value
            return;
        }
        int mid = (lo + hi) / 2;
        build(2 * node, lo, mid);
        build(2 * node + 1, mid + 1, hi);
        tree[node] = tree[2 * node] + tree[2 * node + 1];         //@pull > 2. A parent is the combine of its two children (the sum here)
    }

    void update(int node, int lo, int hi, int i, int v) {
        if (lo == hi) {
            tree[node] = v;                                       //@uleaf > 3. Update: reach the one leaf that holds index i and overwrite it
            return;
        }
        int mid = (lo + hi) / 2;
        if (i <= mid) update(2 * node, lo, mid, i, v);            //@udown > Go to the half that contains i. Only one child is visited
        else update(2 * node + 1, mid + 1, hi, i, v);
        tree[node] = tree[2 * node] + tree[2 * node + 1];         //@upull > 4. On the way back up, recompute every ancestor from its children
    }

    int query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;                           //@prune > 5. Query: no overlap. This segment adds nothing, so return the neutral value
        if (l <= lo && hi <= r) return tree[node];                //@cover > 6. Fully inside the query: use the stored sum and stop
        int mid = (lo + hi) / 2;
        return query(2 * node, lo, mid, l, r) +                   //@split > 7. Partial overlap: ask both halves and combine their answers
               query(2 * node + 1, mid + 1, hi, l, r);
    }

public:
    vector<int> runOps(vector<int>& nums_, vector<vector<int>>& ops) {
        nums = nums_;
        int n = nums.size();
        tree.assign(4 * n, 0);                                    //> tree[1] is the root. Node k has children 2k and 2k+1. 4n slots are always enough
        build(1, 0, n - 1);
        vector<int> out;
        for (auto& op : ops) {
            if (op[0] == 0) update(1, 0, n - 1, op[1], op[2]);
            else out.push_back(query(1, 0, n - 1, op[1], op[2]));
        }
        return out;
    }
};`
      },
      tests: { fn: { py: 'run_ops', default: 'runOps' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
        { args: [[5,3,8,6,2,7,4,1],[[1,2,5],[0,3,1],[1,0,4]]], out: [23,19] }, { args: [[4],[[1,0,0],[0,0,-3],[1,0,0]]], out: [4,-3] }, { args: [[2,1,5],[[1,0,2],[0,1,9],[1,1,1],[1,0,1]]], out: [8,9,11] },
        { args: [[1,2,3,4,5],[[1,1,3],[1,0,4],[0,4,10],[1,3,4]]], out: [9,15,14] }, { args: [[-2,6,-1,0,3,9],[[1,0,5],[0,0,5],[1,0,2],[1,5,5]]], out: [15,10,9] }] }
    },

    complexity: {
      time: 'build O(n) · point update O(log n) · range query O(log n)',
      space: 'O(n)  (4n slots recursive, 2n iterative)',
      why: 'Build touches each of the 2n − 1 nodes once, so it is O(n). The tree has about log₂ n levels. An update follows **one** root-to-leaf path and recomputes each node on it, O(1) per level, so O(log n). For a query, at every level at most two nodes are partial overlaps (the ones holding the left edge and the right edge of the range); every other node is pruned or fully covered and returns at once. That bounds the visited nodes by about 4 log n, **independent of the width of the range**. Space is the node array: `4n` for the recursive layout (a safe bound for any n), `2n` for the bottom-up layout.',
      trap: 'Three things trip people up. (1) The **4n** size: `2n` is only enough when n is a power of two in the top-down layout, so use `4n` there (or the iterative version, which is exactly `2n`). (2) A query is O(log n) only because **covered nodes stop the recursion**. If you forget the “fully inside, return the stored value” check and always descend to the leaves, a query becomes O(n). (3) Building the tree by calling `update` n times is O(n log n); the recursive build is O(n). It rarely matters, but it is a common follow-up.'
    },

    variations: [
      {
        name: 'Iterative bottom-up (size 2n)',
        body: 'There’s a version with **no recursion and no 4n**. Put the n array values in the **second half** of an array of size 2n, at positions `n .. 2n-1`. The parent of position `i` is `i // 2`, so node `i` has children `2i` and `2i + 1`, and `t[1]` is the root. Build by looping `i` from `n-1` down to 1. An update writes the leaf, then walks up with `i //= 2` recomputing from the two children. A query uses a half-open range `[lo, hi)` starting at the leaves: whenever `lo` is a right child (odd) take it and move right; whenever `hi` is a right child, step left and take `t[hi]`; then both move up a level. It is about as short as a Fenwick tree and quicker in practice, and it works for any n (not only powers of two) for any **commutative** combine (sum, min, max, gcd). For a non-commutative combine (string concatenation, matrix product) keep left and right results separately, or use the recursive version.',
        code: {
          py: `def iter_ops(nums, ops):
    n = len(nums)
    t = [0] * n + nums[:]                    #> Leaves sit at n..2n-1; node i has children 2i and 2i+1; t[1] is the root
    for i in range(n - 1, 0, -1):
        t[i] = t[2 * i] + t[2 * i + 1]       #> Build bottom-up: every parent after both children
    out = []
    for kind, a, b in ops:
        if kind == 0:
            i = a + n
            t[i] = b                         #> Update: write the leaf...
            while i > 1:
                i //= 2
                t[i] = t[2 * i] + t[2 * i + 1]   #> ...then recompute each ancestor from its children
        else:
            lo, hi = a + n, b + n + 1        #> A half-open range [lo, hi) of leaf positions
            s = 0
            while lo < hi:
                if lo & 1:
                    s += t[lo]               #> lo is a right child: its parent would cover too much on the left, so take it alone
                    lo += 1
                if hi & 1:
                    hi -= 1
                    s += t[hi]               #> hi - 1 is a right child sitting inside the range: take it
                lo //= 2
                hi //= 2
            out.append(s)
    return out`,
          js: `function iterOps(nums, ops) {
  const n = nums.length;
  const t = new Array(n).fill(0).concat(nums);        //> Leaves sit at n..2n-1; node i has children 2i and 2i+1; t[1] is the root
  for (let i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];   //> Build bottom-up: every parent after both children
  const out = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      let i = a + n;
      t[i] = b;                                       //> Update: write the leaf...
      while (i > 1) {
        i >>= 1;
        t[i] = t[2 * i] + t[2 * i + 1];               //> ...then recompute each ancestor from its children
      }
    } else {
      let lo = a + n, hi = b + n + 1, s = 0;          //> A half-open range [lo, hi) of leaf positions
      while (lo < hi) {
        if (lo & 1) s += t[lo++];                     //> lo is a right child: take it alone and step right
        if (hi & 1) s += t[--hi];                     //> hi - 1 is a right child inside the range: take it
        lo >>= 1; hi >>= 1;
      }
      out.push(s);
    }
  }
  return out;
}`,
          java: `class Solution {
    public int[] iterOps(int[] nums, int[][] ops) {
        int n = nums.length;
        int[] t = new int[2 * n];                   //> Leaves sit at n..2n-1; node i has children 2i and 2i+1; t[1] is the root
        System.arraycopy(nums, 0, t, n, n);
        for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];   //> Build bottom-up: every parent after both children
        List<Integer> out = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) {
                int i = op[1] + n;
                t[i] = op[2];                       //> Update: write the leaf...
                while (i > 1) {
                    i /= 2;
                    t[i] = t[2 * i] + t[2 * i + 1]; //> ...then recompute each ancestor from its children
                }
            } else {
                int lo = op[1] + n, hi = op[2] + n + 1, s = 0;   //> A half-open range [lo, hi) of leaf positions
                while (lo < hi) {
                    if ((lo & 1) == 1) s += t[lo++];   //> lo is a right child: take it alone and step right
                    if ((hi & 1) == 1) s += t[--hi];   //> hi - 1 is a right child inside the range: take it
                    lo /= 2; hi /= 2;
                }
                out.add(s);
            }
        }
        int[] res = new int[out.size()];
        for (int k = 0; k < res.length; k++) res[k] = out.get(k);
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> iterOps(vector<int>& nums, vector<vector<int>>& ops) {
        int n = nums.size();
        vector<int> t(2 * n, 0);                    //> Leaves sit at n..2n-1; node i has children 2i and 2i+1; t[1] is the root
        for (int i = 0; i < n; i++) t[n + i] = nums[i];
        for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];   //> Build bottom-up: every parent after both children
        vector<int> out;
        for (auto& op : ops) {
            if (op[0] == 0) {
                int i = op[1] + n;
                t[i] = op[2];                       //> Update: write the leaf...
                while (i > 1) {
                    i /= 2;
                    t[i] = t[2 * i] + t[2 * i + 1]; //> ...then recompute each ancestor from its children
                }
            } else {
                int lo = op[1] + n, hi = op[2] + n + 1, s = 0;   //> A half-open range [lo, hi) of leaf positions
                while (lo < hi) {
                    if (lo & 1) s += t[lo++];       //> lo is a right child: take it alone and step right
                    if (hi & 1) s += t[--hi];       //> hi - 1 is a right child inside the range: take it
                    lo /= 2; hi /= 2;
                }
                out.push_back(s);
            }
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'iter_ops', default: 'iterOps' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
          { args: [[5,3,8,6,2,7,4,1],[[1,2,5],[0,3,1],[1,0,4]]], out: [23,19] }, { args: [[4],[[1,0,0],[0,0,-3],[1,0,0]]], out: [4,-3] }, { args: [[2,1,5],[[1,0,2],[0,1,9],[1,1,1],[1,0,1]]], out: [8,9,11] },
          { args: [[1,2,3,4,5],[[1,1,3],[1,0,4],[0,4,10],[1,3,4]]], out: [9,15,14] }, { args: [[-2,6,-1,0,3,9],[[1,0,5],[0,0,5],[1,0,2],[1,5,5]]], out: [15,10,9] }] }
      },
      {
        name: 'Range minimum and maximum',
        body: 'Only two things change: the **combine** (`min` instead of `+`) and the **neutral value** returned for a segment outside the query, which must not affect the answer (`+∞` for min, `-∞` for max, 0 for sum, 0 for gcd). Everything else in the tree is identical. A segment tree is the natural answer to “range minimum with updates”. If the array never changes, a **sparse table** answers range min in O(1) after O(n log n) preprocessing, so say that if asked.',
        code: {
          py: `def min_ops(nums, ops):
    n = len(nums)
    INF = float('inf')                       #> The neutral value for min: it never wins a comparison
    t = [INF] * n + nums[:]
    for i in range(n - 1, 0, -1):
        t[i] = min(t[2 * i], t[2 * i + 1])   #> The only change from the sum tree: min instead of +
    out = []
    for kind, a, b in ops:
        if kind == 0:
            i = a + n
            t[i] = b
            while i > 1:
                i //= 2
                t[i] = min(t[2 * i], t[2 * i + 1])
        else:
            lo, hi, best = a + n, b + n + 1, INF
            while lo < hi:
                if lo & 1:
                    best = min(best, t[lo])
                    lo += 1
                if hi & 1:
                    hi -= 1
                    best = min(best, t[hi])
                lo //= 2
                hi //= 2
            out.append(best)
    return out`,
          js: `function minOps(nums, ops) {
  const n = nums.length, INF = Infinity;               //> The neutral value for min: it never wins a comparison
  const t = new Array(n).fill(INF).concat(nums);
  for (let i = n - 1; i > 0; i--) t[i] = Math.min(t[2 * i], t[2 * i + 1]);   //> The only change from the sum tree: min instead of +
  const out = [];
  for (const [kind, a, b] of ops) {
    if (kind === 0) {
      let i = a + n;
      t[i] = b;
      while (i > 1) { i >>= 1; t[i] = Math.min(t[2 * i], t[2 * i + 1]); }
    } else {
      let lo = a + n, hi = b + n + 1, best = INF;
      while (lo < hi) {
        if (lo & 1) best = Math.min(best, t[lo++]);
        if (hi & 1) best = Math.min(best, t[--hi]);
        lo >>= 1; hi >>= 1;
      }
      out.push(best);
    }
  }
  return out;
}`
        },
        tests: { fn: { py: 'min_ops', default: 'minOps' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
          { args: [[5,3,8,6,2,7,4,1],[[1,2,5],[0,3,1],[1,0,4]]], out: [2,1] }, { args: [[4],[[1,0,0],[0,0,-3],[1,0,0]]], out: [4,-3] }, { args: [[2,1,5],[[1,0,2],[0,1,9],[1,1,1],[1,0,1]]], out: [1,9,2] },
          { args: [[1,2,3,4,5],[[1,1,3],[1,0,4],[0,4,10],[1,3,4]]], out: [2,1,4] }, { args: [[-2,6,-1,0,3,9],[[1,0,5],[0,0,5],[1,0,2],[1,5,5]]], out: [-2,-1,9] }] }
      },
      {
        name: 'Stretch: lazy propagation (range add, range sum)',
        body: 'What if an update changes a **whole range** (“add v to every position in `[l, r]`”)? Updating each leaf is O(n). Instead, treat a range update exactly like a query: nodes **fully inside** the range get the update applied **to themselves only**, and the news for their children is stored as a pending note, the **lazy** tag, to be passed down later. For range-add with sums, applying `v` to a node covering `len` items adds `v * len` to its sum and `v` to its tag. The rule that makes it correct: **before you descend into a node, push its tag down** to both children (apply the tag to each child, clear it). Then every node you look at is up to date. The cost stays O(log n) per operation, since a range update visits the same ~4 log n nodes as a query. Lazy trees also do range-assign, and range-min with range-add (the tag adds to the min directly, no length factor). The combine must “distribute” over the tag: sum × add needs the segment length; min + add doesn’t.',
        code: {
          py: `def lazy_ops(nums, ops):
    n = len(nums)
    tree = [0] * (4 * n)
    lazy = [0] * (4 * n)                     #> lazy[k]: "add this to every item in k's segment", not yet passed to k's children

    def build(node, lo, hi):
        if lo == hi:
            tree[node] = nums[lo]
            return
        mid = (lo + hi) // 2
        build(2 * node, lo, mid)
        build(2 * node + 1, mid + 1, hi)
        tree[node] = tree[2 * node] + tree[2 * node + 1]

    def apply(node, lo, hi, v):
        tree[node] += v * (hi - lo + 1)      #> The node's sum grows by v for each item it covers
        lazy[node] += v                      #> Remember v for the children

    def push(node, lo, hi):
        if lazy[node]:
            mid = (lo + hi) // 2
            apply(2 * node, lo, mid, lazy[node])             #> Hand the pending add to both children...
            apply(2 * node + 1, mid + 1, hi, lazy[node])
            lazy[node] = 0                                   #> ...and clear it here

    def add(node, lo, hi, l, r, v):
        if r < lo or hi < l:
            return
        if l <= lo and hi <= r:
            apply(node, lo, hi, v)           #> Fully inside: update this node only, children are told later
            return
        push(node, lo, hi)                   #> Before going deeper, make the children current
        mid = (lo + hi) // 2
        add(2 * node, lo, mid, l, r, v)
        add(2 * node + 1, mid + 1, hi, l, r, v)
        tree[node] = tree[2 * node] + tree[2 * node + 1]

    def query(node, lo, hi, l, r):
        if r < lo or hi < l:
            return 0
        if l <= lo and hi <= r:
            return tree[node]
        push(node, lo, hi)                   #> Queries push too, so what they read below is up to date
        mid = (lo + hi) // 2
        return query(2 * node, lo, mid, l, r) + query(2 * node + 1, mid + 1, hi, l, r)

    build(1, 0, n - 1)
    out = []
    for kind, l, r, v in ops:
        if kind == 0:
            add(1, 0, n - 1, l, r, v)
        else:
            out.append(query(1, 0, n - 1, l, r))
    return out`,
          js: `function lazyOps(nums, ops) {
  const n = nums.length;
  const tree = new Array(4 * n).fill(0);
  const lazy = new Array(4 * n).fill(0);               //> lazy[k]: "add this to every item in k's segment", not yet passed to k's children

  function build(node, lo, hi) {
    if (lo === hi) { tree[node] = nums[lo]; return; }
    const mid = (lo + hi) >> 1;
    build(2 * node, lo, mid);
    build(2 * node + 1, mid + 1, hi);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  }
  function apply(node, lo, hi, v) {
    tree[node] += v * (hi - lo + 1);                   //> The node's sum grows by v for each item it covers
    lazy[node] += v;                                   //> Remember v for the children
  }
  function push(node, lo, hi) {
    if (lazy[node]) {
      const mid = (lo + hi) >> 1;
      apply(2 * node, lo, mid, lazy[node]);            //> Hand the pending add to both children...
      apply(2 * node + 1, mid + 1, hi, lazy[node]);
      lazy[node] = 0;                                  //> ...and clear it here
    }
  }
  function add(node, lo, hi, l, r, v) {
    if (r < lo || hi < l) return;
    if (l <= lo && hi <= r) { apply(node, lo, hi, v); return; }   //> Fully inside: update this node only, children are told later
    push(node, lo, hi);                                //> Before going deeper, make the children current
    const mid = (lo + hi) >> 1;
    add(2 * node, lo, mid, l, r, v);
    add(2 * node + 1, mid + 1, hi, l, r, v);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  }
  function query(node, lo, hi, l, r) {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return tree[node];
    push(node, lo, hi);                                //> Queries push too, so what they read below is up to date
    const mid = (lo + hi) >> 1;
    return query(2 * node, lo, mid, l, r) + query(2 * node + 1, mid + 1, hi, l, r);
  }

  build(1, 0, n - 1);
  const out = [];
  for (const [kind, l, r, v] of ops) {
    if (kind === 0) add(1, 0, n - 1, l, r, v);
    else out.push(query(1, 0, n - 1, l, r));
  }
  return out;
}`
        },
        tests: { fn: { py: 'lazy_ops', default: 'lazyOps' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
          { args: [[1,2,3,4,5],[[1,0,4,0],[0,1,3,10],[1,0,2,0],[1,3,4,0]]], out: [15,26,19] }, { args: [[7],[[0,0,0,-2],[1,0,0,0]]], out: [5] },
          { args: [[0,0,0,0,0,0],[[0,0,5,1],[0,2,3,4],[1,1,4,0],[1,0,5,0],[0,0,1,-3],[1,0,2,0]]], out: [12,14,1] },
          { args: [[3,-1,4,1,-5,9,2,6],[[1,2,6,0],[0,2,6,5],[1,2,6,0],[1,0,1,0],[0,0,7,-1],[1,0,7,0]]], out: [11,36,2,36] }] }
      },
      {
        name: 'When prefix sums or a Fenwick tree are enough',
        body: 'Pick the lightest tool that fits. **Never changes?** A prefix-sum array answers a range sum in O(1): `prefix[r+1] - prefix[l]` (see [Prefix sums](#/topic/prefix-sums)); a **sparse table** does the same for range min or max. **Point updates and range sums only?** A **Fenwick tree** (binary indexed tree) is a 10-line array of partial sums with O(log n) for both, about a third of the code and the best constant factor. Range sum is `prefix(r) - prefix(l-1)`. **Only prefix queries** (like “how many items so far are smaller than x”)? Fenwick again. Reach for a segment tree when the combine isn’t invertible (**min, max, gcd** can’t be subtracted the way sums can, so Fenwick can’t do an arbitrary range of them), when you need **range updates** with lazy propagation, or when each node must carry richer data (best subarray sum in the segment, count and sum together). See [Fenwick trees](#/topic/fenwick).'
      },
      {
        name: 'Coordinate compression',
        body: 'A segment tree is built over **indices**, so it needs small ones. If positions are huge but sparse (x up to 10⁹, only a thousand events), collect every position that matters, **sort and dedupe** them, and use each position’s **rank** as its index. Order is all the tree needs, and compression keeps it. The usual trap is stretches versus points: if squares or buildings cover half-open spans `[left, right)`, make each rank stand for the stretch from that coordinate to the next one, so a span becomes the rank range `[rank(left), rank(right) - 1]`. The falling-squares problem below uses it, and the skyline problem can too.',
        code: {
          py: `def compress(xs):
    ranks = {x: i for i, x in enumerate(sorted(set(xs)))}   #> Sort and dedupe: the rank of a value is its index in that list
    return [ranks[x] for x in xs]`,
          js: `function compress(xs) {
  const sorted = [...new Set(xs)].sort((a, b) => a - b);   //> Sort and dedupe: the rank of a value is its index in that list
  const ranks = new Map(sorted.map((x, i) => [x, i]));
  return xs.map((x) => ranks.get(x));
}`
        },
        tests: { fn: { py: 'compress', default: 'compress' }, sig: { args: ['int[]'] }, cases: [
          { args: [[100, 5, 100, -3]], out: [2, 1, 2, 0] }, { args: [[7]], out: [0] }, { args: [[1000000000, 1, 500, 1]], out: [2, 0, 1, 0] }, { args: [[]], out: [] }] }
      }
    ],

    worked: [
      {
        lc: 307,
        restate: 'Build a class over a list of numbers with two methods: `update(index, val)` sets one position to a new value, and `sumRange(left, right)` returns the sum of the positions from `left` to `right`, both included. Calls come in any order, many times.',
        examples: '- `[1, 3, 5]`: `sumRange(0, 2)` → 9; `update(1, 2)`; `sumRange(0, 2)` → 8.\n- Edge cases: a single element; `left == right`; an update that leaves the value unchanged; negative numbers.',
        brute: 'Keep the array. Update is O(1) (assign), but each `sumRange` loops over the range: O(n). Or keep a prefix-sum array: queries become O(1) but an update must fix every later prefix, O(n). With 10⁴ calls on 3 × 10⁴ items, either one is O(n) per call on the heavy side.',
        insight: 'Neither extreme balances the two operations, so store sums of **blocks**. Split the array in halves, recursively. A query then needs only a few whole blocks (about 2 log n), and an update touches only the blocks containing one position (log n of them). The bottom-up layout is short: leaves at `n .. 2n-1`, parent of `i` is `i // 2`.',
        code: {
          py: `class NumArray:
    def __init__(self, nums: List[int]):
        self.n = len(nums)
        self.t = [0] * self.n + nums[:]        # leaves at n..2n-1; t[i] = t[2i] + t[2i+1]
        for i in range(self.n - 1, 0, -1):
            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]

    def update(self, index: int, val: int) -> None:
        i = index + self.n
        self.t[i] = val
        while i > 1:                           # recompute each ancestor from its children
            i //= 2
            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]

    def sumRange(self, left: int, right: int) -> int:
        lo, hi, s = left + self.n, right + self.n + 1, 0   # half-open [lo, hi)
        while lo < hi:
            if lo & 1:
                s += self.t[lo]
                lo += 1
            if hi & 1:
                hi -= 1
                s += self.t[hi]
            lo //= 2
            hi //= 2
        return s`,
          js: `class NumArray {
  constructor(nums) {
    this.n = nums.length;
    this.t = new Array(this.n).fill(0).concat(nums);   // leaves at n..2n-1; t[i] = t[2i] + t[2i+1]
    for (let i = this.n - 1; i > 0; i--) this.t[i] = this.t[2 * i] + this.t[2 * i + 1];
  }
  update(index, val) {
    let i = index + this.n;
    this.t[i] = val;
    while (i > 1) {                                    // recompute each ancestor from its children
      i >>= 1;
      this.t[i] = this.t[2 * i] + this.t[2 * i + 1];
    }
  }
  sumRange(left, right) {
    let lo = left + this.n, hi = right + this.n + 1, s = 0;   // half-open [lo, hi)
    while (lo < hi) {
      if (lo & 1) s += this.t[lo++];
      if (hi & 1) s += this.t[--hi];
      lo >>= 1; hi >>= 1;
    }
    return s;
  }
}`,
          java: `class NumArray {
    private final int n;
    private final int[] t;                          // leaves at n..2n-1; t[i] = t[2i] + t[2i+1]

    public NumArray(int[] nums) {
        n = nums.length;
        t = new int[2 * n];
        System.arraycopy(nums, 0, t, n, n);
        for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];
    }

    public void update(int index, int val) {
        int i = index + n;
        t[i] = val;
        while (i > 1) {                             // recompute each ancestor from its children
            i /= 2;
            t[i] = t[2 * i] + t[2 * i + 1];
        }
    }

    public int sumRange(int left, int right) {
        int lo = left + n, hi = right + n + 1, s = 0;   // half-open [lo, hi)
        while (lo < hi) {
            if ((lo & 1) == 1) s += t[lo++];
            if ((hi & 1) == 1) s += t[--hi];
            lo /= 2; hi /= 2;
        }
        return s;
    }
}`,
          cpp: `class NumArray {
    int n;
    vector<int> t;                                  // leaves at n..2n-1; t[i] = t[2i] + t[2i+1]
public:
    NumArray(vector<int>& nums) : n(nums.size()), t(2 * nums.size(), 0) {
        for (int i = 0; i < n; i++) t[n + i] = nums[i];
        for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];
    }
    void update(int index, int val) {
        int i = index + n;
        t[i] = val;
        while (i > 1) {                             // recompute each ancestor from its children
            i /= 2;
            t[i] = t[2 * i] + t[2 * i + 1];
        }
    }
    int sumRange(int left, int right) {
        int lo = left + n, hi = right + n + 1, s = 0;   // half-open [lo, hi)
        while (lo < hi) {
            if (lo & 1) s += t[lo++];
            if (hi & 1) s += t[--hi];
            lo /= 2; hi /= 2;
        }
        return s;
    }
};`
        },
        complexity: 'O(n) to build, O(log n) per `update` (one leaf-to-root path), O(log n) per `sumRange` (at most about 2 nodes per level). O(n) space, `2n` ints.',
        say: '“Prefix sums give O(1) queries but O(n) updates; a plain array is the reverse. I want both to be logarithmic, so I store the sum of every block in a halving split: a segment tree. An update rewrites one leaf and the log n ancestors above it. A query combines a few whole blocks that sit inside the range, about two per level. I’ll use the bottom-up layout in an array of size 2n, so there’s no recursion. A Fenwick tree would also work here, since only sums are needed; a segment tree generalises to min, max and range updates.”',
        followups: [
          { q: 'Why does the query loop stay correct when n is not a power of two?', a: 'Because the combine is commutative (addition). The bottom-up tree for an odd n is a collection of perfect trees glued awkwardly, but each node still equals the sum of its two children, and the loop only ever uses nodes whose leaf range lies fully inside `[lo, hi)`. For a non-commutative combine you’d keep the left and right accumulators separate, or use the recursive version.' },
          { q: 'Could a Fenwick tree do this too?', a: 'Yes: point update and range sum are exactly what it is built for, in about 10 lines. Say that you know it, then explain why you picked the segment tree: it extends to min, max and gcd (which can’t be subtracted) and to range updates with lazy propagation.' },
          { q: 'What if the updates add a delta instead of setting a value?', a: 'Same tree, but the leaf update becomes `t[i] += delta` and each ancestor `t[i] += delta` too (or recompute from children). Setting is easier to get right because you recompute, not patch.' },
          { q: 'What if there were also range updates (add v to a whole range)?', a: 'Then you need lazy propagation: store a pending add on the highest nodes fully inside the range and push it down before descending. Still O(log n) per operation. See the lazy variation above.' }
        ]
      },
      {
        lc: 218,
        restate: 'Each building is a flat rectangle on the ground: `[left, right, height]`, covering from `left` up to (not including) `right`. Seen from far away the buildings merge into one outline. Return the outline as a list of `[x, height]` points, each marking where the height changes (the left end of a flat stretch), from left to right, ending with a drop to height 0. No two neighbouring points may have the same height.',
        examples: '- `[[1,4,6],[2,3,9],[6,8,4]]` → `[[1,6],[2,9],[3,6],[4,0],[6,4],[8,0]]`.\n- Two buildings of equal height that touch (`[0,2,3]`, `[2,5,3]`) give one flat stretch: `[[0,3],[5,0]]`.\n- Edge cases: one building; buildings with the same left edge; a short building completely hidden behind a tall one (it produces no point).',
        brute: 'Mark the tallest height at every integer x (or every compressed x): O(n · width) when you paint each building over its span, then scan for changes. With widths up to 2³¹ the array doesn’t fit, and compressing the coordinates still leaves O(n²) painting.',
        insight: 'The outline can only change at a building **edge**, so sweep the 2n edges from left to right while keeping the set of buildings that currently cover the sweep line. The outline height is the **tallest** of them: a max-heap. Entries expire when the sweep passes their right edge; rather than delete from the middle, **leave stale entries and discard them only when they reach the top** (lazy deletion). Emit a point whenever the top height differs from the last emitted height. To get ties right, sort edges at the same x so **starts come before ends** and **taller starts come first**. A segment tree over compressed x with “range chmax, point read” is the other standard answer, and the one to mention if the interviewer wants a tree.',
        code: {
          py: `class Solution:
    def getSkyline(self, buildings: List[List[int]]) -> List[List[int]]:
        events = []
        for l, r, h in buildings:
            events.append((l, -h, r))              # start: negative height sorts taller starts first
            events.append((r, 0, 0))               # end: sorts after every start at the same x
        events.sort()
        heap = [(0, float('inf'))]                 # max-heap by height: (-height, right edge); ground never expires
        res = []
        for x, negh, r in events:
            while heap[0][1] <= x:                 # drop buildings the sweep has passed (lazy deletion)
                heapq.heappop(heap)
            if negh:
                heapq.heappush(heap, (negh, r))
            top = -heap[0][0]
            if not res or res[-1][1] != top:       # the outline only moves when the tallest height changes
                res.append([x, top])
        return res`,
          js: HEAP + `
function getSkyline(buildings) {
  const events = [];
  for (const [l, r, h] of buildings) {
    events.push([l, -h, r]);                       // start: negative height sorts taller starts first
    events.push([r, 0, 0]);                        // end: sorts after every start at the same x
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const heap = new Heap((a, b) => a[0] > b[0]);    // max-heap by height: [height, right edge]
  heap.push([0, Infinity]);                        // the ground never expires
  const res = [];
  for (const [x, negh, r] of events) {
    while (heap.peek()[1] <= x) heap.pop();        // drop buildings the sweep has passed (lazy deletion)
    if (negh) heap.push([-negh, r]);
    const top = heap.peek()[0];
    if (!res.length || res[res.length - 1][1] !== top) res.push([x, top]);   // only when the tallest height changes
  }
  return res;
}`,
          java: `class Solution {
    public List<List<Integer>> getSkyline(int[][] buildings) {
        int[][] events = new int[buildings.length * 2][];
        int k = 0;
        for (int[] b : buildings) {
            events[k++] = new int[]{b[0], -b[2], b[1]};   // start: negative height sorts taller starts first
            events[k++] = new int[]{b[1], 0, 0};          // end: sorts after every start at the same x
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                : a[1] != b[1] ? Integer.compare(a[1], b[1]) : Integer.compare(a[2], b[2]));
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(b[0], a[0]));   // max-heap by height: {height, right edge}
        heap.offer(new int[]{0, Integer.MAX_VALUE});      // the ground never expires
        List<List<Integer>> res = new ArrayList<>();
        for (int[] e : events) {
            while (heap.peek()[1] <= e[0]) heap.poll();   // drop buildings the sweep has passed (lazy deletion)
            if (e[1] != 0) heap.offer(new int[]{-e[1], e[2]});
            int top = heap.peek()[0];
            if (res.isEmpty() || res.get(res.size() - 1).get(1) != top) res.add(Arrays.asList(e[0], top));   // only when the tallest height changes
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> getSkyline(vector<vector<int>>& buildings) {
        vector<array<int, 3>> events;
        for (auto& b : buildings) {
            events.push_back({b[0], -b[2], b[1]});        // start: negative height sorts taller starts first
            events.push_back({b[1], 0, 0});               // end: sorts after every start at the same x
        }
        sort(events.begin(), events.end());
        priority_queue<pair<int, int>> heap;              // max-heap by height: {height, right edge}
        heap.push({0, INT_MAX});                          // the ground never expires
        vector<vector<int>> res;
        for (auto& e : events) {
            while (heap.top().second <= e[0]) heap.pop(); // drop buildings the sweep has passed (lazy deletion)
            if (e[1] != 0) heap.push({-e[1], e[2]});
            int top = heap.top().first;
            if (res.empty() || res.back()[1] != top) res.push_back({e[0], top});   // only when the tallest height changes
        }
        return res;
    }
};`
        },
        complexity: 'O(n log n) time: sorting 2n events, and each building is pushed once and popped at most once (lazy deletion keeps heap size at most n + 1). O(n) space.',
        say: '“The outline can only change at a building’s edge, so I sweep the sorted edges. I keep a max-heap of the buildings covering the sweep line, and the outline height is the top. A building leaves when the sweep passes its right edge, but I don’t delete from the middle; I discard stale entries when they surface at the top. Whenever the top height differs from the last emitted height I add a point. To handle ties I sort starts before ends and taller starts first, so equal-x events never emit a spurious intermediate point. That’s O(n log n). A segment tree over compressed x with range-max-assign is an alternative with the same bound.”',
        followups: [
          { q: 'Why sort taller starts first at the same x?', a: 'If a short start were processed first it would emit a point at that x, immediately followed by a taller point at the same x, which is wrong (two points with the same x). Processing the tallest first means the first emitted point is already the right one, and later starts at that x change nothing.' },
          { q: 'Why must starts come before ends at the same x?', a: 'When one building ends exactly where another starts, ending first would dip to the lower height and emit a false point. Starting first keeps the outline continuous: the heap pops the stale building when it surfaces, and the new top equals the last emitted height if they match.' },
          { q: 'How would a segment tree solve this?', a: 'Compress the 2n edge coordinates into ranks. Process buildings in any order and apply “range chmax” with the height over the building’s stretch ranks (a lazy tag that never needs pushing), then read each stretch’s height with a point query and emit the changes. O(n log n) too, with more code.' },
          { q: 'What if the coordinates are floating point?', a: 'The sweep works unchanged, since only ordering matters. Be careful that “start before end at the same x” relies on exact equality, so use exact decimals or integers scaled up.' }
        ]
      },
      {
        lc: 699,
        restate: 'Squares fall one at a time onto a number line. Each is `[left, side]` and occupies the span from `left` to `left + side`. A square falls until it lands on the highest surface beneath its span (or the ground). Squares that only touch along an edge do not rest on each other. After each square lands, report the height of the tallest stack so far. Return one number per square.',
        examples: '- `[[0,3],[2,2],[10,1]]` → `[3,5,5]`: the second square spans 2 to 4 and lands on the first (height 3), reaching 5; the third is far away.\n- `[[0,2],[2,2]]` → `[2,2]`: they only touch, so the second lands on the ground.\n- Edge cases: one square; squares with identical spans (they stack); coordinates up to 10⁸ with only a thousand squares.',
        brute: 'Keep the landed squares in a list. For each new square, scan every earlier one, check whether the spans overlap (strictly), and take the highest top: O(n²) overall. It’s fine at n = 1000, but it is the quadratic version of a range-max problem.',
        insight: 'Each drop is a **range max query** (the highest surface under the span) followed by a **range update** (everything under the span now has height `max + side`). Coordinates are huge, so **compress** the span edges: sort and dedupe all `left` and `left + side`, and let index `i` stand for the stretch from `xs[i]` to `xs[i+1]`. A span becomes the index range `[rank(left), rank(left+side) - 1]`. The new height is at least every old height in that range, so “assign” equals “take the max”, which allows a tiny lazy tree: **tags that are never pushed down**. A node keeps `mx` (the best height anywhere in its segment, tags below included) and `tag` (a height that applies to its whole segment). A query adds the tags of the partial nodes it passes through.',
        code: {
          py: `class Solution:
    def fallingSquares(self, positions: List[List[int]]) -> List[int]:
        xs = sorted({p for l, s in positions for p in (l, l + s)})
        rank = {x: i for i, x in enumerate(xs)}          # compress: rank i is the stretch [xs[i], xs[i+1])
        m = len(xs)
        mx = [0] * (4 * m)                               # best height anywhere in the node's segment
        tag = [0] * (4 * m)                              # a height covering the node's whole segment (never pushed down)

        def update(node, lo, hi, l, r, v):
            mx[node] = max(mx[node], v)
            if l <= lo and hi <= r:
                tag[node] = max(tag[node], v)            # fully covered: stamp it here and stop
                return
            mid = (lo + hi) // 2
            if l <= mid:
                update(2 * node, lo, mid, l, r, v)
            if r > mid:
                update(2 * node + 1, mid + 1, hi, l, r, v)

        def query(node, lo, hi, l, r):
            if l <= lo and hi <= r:
                return mx[node]
            mid = (lo + hi) // 2
            best = tag[node]                             # this node's tag lies under the whole queried part
            if l <= mid:
                best = max(best, query(2 * node, lo, mid, l, r))
            if r > mid:
                best = max(best, query(2 * node + 1, mid + 1, hi, l, r))
            return best

        res, tallest = [], 0
        for left, side in positions:
            l, r = rank[left], rank[left + side] - 1     # the stretches under this square
            h = query(1, 0, m - 1, l, r) + side          # rests on the highest surface beneath
            update(1, 0, m - 1, l, r, h)
            tallest = max(tallest, h)
            res.append(tallest)
        return res`,
          js: `function fallingSquares(positions) {
  const xs = [...new Set(positions.flatMap(([l, s]) => [l, l + s]))].sort((a, b) => a - b);
  const rank = new Map(xs.map((x, i) => [x, i]));    // compress: rank i is the stretch [xs[i], xs[i+1])
  const m = xs.length;
  const mx = new Array(4 * m).fill(0);               // best height anywhere in the node's segment
  const tag = new Array(4 * m).fill(0);              // a height covering the node's whole segment (never pushed down)

  function update(node, lo, hi, l, r, v) {
    mx[node] = Math.max(mx[node], v);
    if (l <= lo && hi <= r) { tag[node] = Math.max(tag[node], v); return; }   // fully covered: stamp it here and stop
    const mid = (lo + hi) >> 1;
    if (l <= mid) update(2 * node, lo, mid, l, r, v);
    if (r > mid) update(2 * node + 1, mid + 1, hi, l, r, v);
  }
  function query(node, lo, hi, l, r) {
    if (l <= lo && hi <= r) return mx[node];
    const mid = (lo + hi) >> 1;
    let best = tag[node];                            // this node's tag lies under the whole queried part
    if (l <= mid) best = Math.max(best, query(2 * node, lo, mid, l, r));
    if (r > mid) best = Math.max(best, query(2 * node + 1, mid + 1, hi, l, r));
    return best;
  }

  const res = [];
  let tallest = 0;
  for (const [left, side] of positions) {
    const l = rank.get(left), r = rank.get(left + side) - 1;   // the stretches under this square
    const h = query(1, 0, m - 1, l, r) + side;                 // rests on the highest surface beneath
    update(1, 0, m - 1, l, r, h);
    tallest = Math.max(tallest, h);
    res.push(tallest);
  }
  return res;
}`,
          java: `class Solution {
    int[] mx, tag;                                       // mx: best height in the segment; tag: a height over the whole segment (never pushed down)

    void update(int node, int lo, int hi, int l, int r, int v) {
        mx[node] = Math.max(mx[node], v);
        if (l <= lo && hi <= r) { tag[node] = Math.max(tag[node], v); return; }   // fully covered: stamp it here and stop
        int mid = (lo + hi) / 2;
        if (l <= mid) update(2 * node, lo, mid, l, r, v);
        if (r > mid) update(2 * node + 1, mid + 1, hi, l, r, v);
    }

    int query(int node, int lo, int hi, int l, int r) {
        if (l <= lo && hi <= r) return mx[node];
        int mid = (lo + hi) / 2;
        int best = tag[node];                            // this node's tag lies under the whole queried part
        if (l <= mid) best = Math.max(best, query(2 * node, lo, mid, l, r));
        if (r > mid) best = Math.max(best, query(2 * node + 1, mid + 1, hi, l, r));
        return best;
    }

    public List<Integer> fallingSquares(int[][] positions) {
        TreeSet<Integer> set = new TreeSet<>();
        for (int[] p : positions) { set.add(p[0]); set.add(p[0] + p[1]); }
        Map<Integer, Integer> rank = new HashMap<>();    // compress: rank i is the stretch [xs[i], xs[i+1])
        for (int x : set) rank.put(x, rank.size());
        int m = rank.size();
        mx = new int[4 * m];
        tag = new int[4 * m];
        List<Integer> res = new ArrayList<>();
        int tallest = 0;
        for (int[] p : positions) {
            int l = rank.get(p[0]), r = rank.get(p[0] + p[1]) - 1;   // the stretches under this square
            int h = query(1, 0, m - 1, l, r) + p[1];                 // rests on the highest surface beneath
            update(1, 0, m - 1, l, r, h);
            tallest = Math.max(tallest, h);
            res.add(tallest);
        }
        return res;
    }
}`,
          cpp: `class Solution {
    vector<int> mx, tag;                                 // mx: best height in the segment; tag: a height over the whole segment (never pushed down)

    void update(int node, int lo, int hi, int l, int r, int v) {
        mx[node] = max(mx[node], v);
        if (l <= lo && hi <= r) { tag[node] = max(tag[node], v); return; }   // fully covered: stamp it here and stop
        int mid = (lo + hi) / 2;
        if (l <= mid) update(2 * node, lo, mid, l, r, v);
        if (r > mid) update(2 * node + 1, mid + 1, hi, l, r, v);
    }

    int query(int node, int lo, int hi, int l, int r) {
        if (l <= lo && hi <= r) return mx[node];
        int mid = (lo + hi) / 2;
        int best = tag[node];                            // this node's tag lies under the whole queried part
        if (l <= mid) best = max(best, query(2 * node, lo, mid, l, r));
        if (r > mid) best = max(best, query(2 * node + 1, mid + 1, hi, l, r));
        return best;
    }

public:
    vector<int> fallingSquares(vector<vector<int>>& positions) {
        vector<int> xs;
        for (auto& p : positions) { xs.push_back(p[0]); xs.push_back(p[0] + p[1]); }
        sort(xs.begin(), xs.end());
        xs.erase(unique(xs.begin(), xs.end()), xs.end());   // compress: rank i is the stretch [xs[i], xs[i+1])
        int m = xs.size();
        mx.assign(4 * m, 0);
        tag.assign(4 * m, 0);
        auto rank = [&](int x) { return int(lower_bound(xs.begin(), xs.end(), x) - xs.begin()); };
        vector<int> res;
        int tallest = 0;
        for (auto& p : positions) {
            int l = rank(p[0]), r = rank(p[0] + p[1]) - 1;      // the stretches under this square
            int h = query(1, 0, m - 1, l, r) + p[1];            // rests on the highest surface beneath
            update(1, 0, m - 1, l, r, h);
            tallest = max(tallest, h);
            res.push_back(tallest);
        }
        return res;
    }
};`
        },
        complexity: 'O(n log n) time: sorting the 2n coordinates, then one query and one update per square, each visiting O(log n) nodes. O(n) space for the compression and the tree.',
        say: '“Each square is a range max (the highest thing under its span) followed by a range assign. The coordinates are huge, so I compress the span edges, giving each stretch between neighbouring coordinates an index. Because the new height is at least everything it covers, assign is the same as chmax, so I use a segment tree where a covered node just stores a height tag and I never push tags down: a query takes the max of the tags on the partial nodes it passes and the stored max of the covered nodes. That’s O(n log n). The O(n²) scan of earlier squares also passes at n = 1000, but this is the version that scales.”',
        followups: [
          { q: 'Why is the new height range index `rank(left+side) - 1` and not `rank(left+side)`?', a: 'An index stands for the **stretch** from one coordinate to the next. The square covers stretches from `rank(left)` up to the one that ends at `left + side`, which is the stretch before `rank(left+side)`. Using the end rank itself would make squares that only touch (`[0,2]` and `[2,2]`) wrongly overlap.' },
          { q: 'Why can the tags stay un-pushed?', a: 'Every update assigns a height at least as large as everything it covers, so tags only ever need “max” semantics: a tag on a node says the whole segment is at least that high. A later query takes the max of tags on the path, and a covered node’s `mx` already includes everything below it. That is simpler than add or assign, where order of updates matters and tags must be pushed down.' },
          { q: 'Could you avoid the segment tree?', a: 'Keep the squares sorted by span in an ordered map of “stretch → height” and split intervals as squares land; amortised O(n log n) with a balanced tree, but harder to write. The O(n²) scan is the fallback if n is small.' },
          { q: 'What if squares could also be removed?', a: 'Max can’t be undone, so a tag-based max tree breaks. You’d need a structure that stores multiple candidate heights per node (a multiset), or process offline in reverse time with a different approach.' }
        ]
      }
    ],

    practice: [
      { lc: 307,
        hints: ['A prefix-sum array makes queries O(1) but an update has to fix every later prefix. A plain array is the opposite. You want both in O(log n).', 'Store the sum of every block in a halving split of the array: the root covers everything, each node covers half of its parent. An update touches one leaf and its ancestors.', 'For a query, take whole blocks that lie inside the range and skip blocks outside it. Bottom-up layout: leaves at `n..2n-1`, parent of `i` is `i // 2`, query a half-open `[lo, hi)`.'],
        starter: { py: 'class NumArray:\n    def __init__(self, nums: List[int]):\n        pass\n\n    def update(self, index: int, val: int) -> None:\n        pass\n\n    def sumRange(self, left: int, right: int) -> int:\n        pass', js: 'class NumArray {\n  constructor(nums) {\n    \n  }\n  update(index, val) {\n    \n  }\n  sumRange(left, right) {\n    \n  }\n}' },
        tests: { fn: 'NumArray', design: true, cases: [
          { ops: ['NumArray', 'sumRange', 'update', 'sumRange'], args: [[[1, 3, 5]], [0, 2], [1, 2], [0, 2]], out: [null, 9, null, 8] },
          { ops: ['NumArray', 'sumRange', 'update', 'sumRange'], args: [[[5]], [0, 0], [0, -4], [0, 0]], out: [null, 5, null, -4] },
          { ops: ['NumArray', 'sumRange', 'update', 'sumRange', 'sumRange', 'update', 'sumRange'], args: [[[2, 4, 6, 8, 10]], [1, 3], [2, 0], [1, 3], [0, 4], [4, 1], [3, 4]], out: [null, 18, null, 12, 24, null, 9] },
          { ops: ['NumArray', 'sumRange', 'update', 'sumRange', 'sumRange'], args: [[[-1, -2, -3, -4]], [0, 3], [3, 4], [2, 3], [0, 3]], out: [null, -10, null, 1, -2] }] } },

      { lc: 218,
        hints: ['The outline can only change at a building edge, so look at the sorted left and right edges, not at every x.', 'Sweep left to right with a max-heap of the buildings currently covering the sweep line. The top is the outline height. When the sweep passes a building’s right edge, discard it only when it reaches the top.', 'Emit a point when the top height changes. At equal x, handle starts before ends and taller starts first, so you never emit a false point.'],
        starter: { py: 'class Solution:\n    def getSkyline(self, buildings: List[List[int]]) -> List[List[int]]:\n        ', js: 'function getSkyline(buildings) {\n  \n}' },
        tests: { fn: 'getSkyline', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1,4,6],[2,3,9],[6,8,4]]], out: [[1,6],[2,9],[3,6],[4,0],[6,4],[8,0]] }, { args: [[[0,2,3],[2,5,3]]], out: [[0,3],[5,0]] }, { args: [[[0,3,3],[1,2,5],[2,4,4]]], out: [[0,3],[1,5],[2,4],[4,0]] },
          { args: [[[1,2,1],[1,2,2],[1,2,3]]], out: [[1,3],[2,0]] }, { args: [[[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]], out: [[2,10],[3,15],[7,12],[12,0],[15,10],[20,8],[24,0]] },
          { args: [[[0,5,7],[5,10,7],[5,10,12]]], out: [[0,7],[5,12],[10,0]] }, { args: [[[3,5,2]]], out: [[3,2],[5,0]] }] } },

      { lc: 699,
        hints: ['Each square does two things: find the highest surface under its span, then raise everything under its span to the new top. That is a range max and a range assign.', 'Coordinates can be huge but there are at most 2n distinct edges. Sort and dedupe them, and let each index stand for the stretch to the next coordinate. A span `[left, left+side)` is the index range `[rank(left), rank(left+side) - 1]`.', 'A new height is at least everything it covers, so assign is the same as chmax. Keep per node a max `mx` and a tag that is never pushed down: queries take the tags of partial nodes and `mx` of covered ones.'],
        starter: { py: 'class Solution:\n    def fallingSquares(self, positions: List[List[int]]) -> List[int]:\n        ', js: 'function fallingSquares(positions) {\n  \n}' },
        tests: { fn: 'fallingSquares', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0,3],[2,2],[10,1]]], out: [3,5,5] }, { args: [[[0,2],[2,2]]], out: [2,2] }, { args: [[[5,1]]], out: [1] }, { args: [[[1,5],[2,2],[7,5]]], out: [5,7,7] },
          { args: [[[4,2],[2,4],[0,3],[3,3],[1,1]]], out: [2,6,9,9,10] }, { args: [[[100,100],[200,100],[150,100]]], out: [100,100,200] }] } }
    ],

    mistakes: [
      '**Allocating `2n` for the recursive tree.** With the `node, 2*node, 2*node+1` layout and a halving split, the highest index used can approach 4n for awkward n (n = 6, for instance, reaches index 13, which is past 2n = 12). Allocate `4 * n`. Only the bottom-up layout (leaves at `n..2n-1`) is exactly `2n`.',
      '**Off-by-one in the split.** Left child `[lo, mid]`, right child `[mid + 1, hi]` with `mid = (lo + hi) // 2`. Using `[lo, mid)` and `[mid, hi)` in one place and inclusive ranges in another is the most common bug. Pick **inclusive** ranges everywhere (and in the bottom-up query, a half-open `[lo, hi)` by design), and write which one on the first line.',
      '**No “fully covered” stop in the query.** If the code only stops at the leaves, every query touches O(n) nodes, and the whole point of the tree is gone, with correct answers hiding the problem until the timeouts. Check order matters too: test “outside” first, then “inside”, then split.',
      '**A wrong neutral value for “outside”.** Returning 0 is right for sum and gcd, but for **min** it must be `+∞` and for **max** `-∞` (or `INT_MAX` / `INT_MIN`). Returning 0 for min silently reports 0 whenever a pruned node is on the path.',
      '**Updating the leaf but not its ancestors.** After `tree[leaf] = v`, every ancestor must be recomputed on the way back up from its two children. Recompute rather than patch with a delta; deltas break for min and max.',
      '**Lazy propagation: forgetting to push before descending.** In a lazy tree, a node with a pending tag has stale children. Push the tag down before recursing in **both** updates and queries, and recompute the parent from its children after an update. Another classic: the tag for range-add must scale by the segment length when applied to a **sum**.',
      '**Using a segment tree when something simpler works.** Static array and range sums: a prefix-sum array. Point update and range sum only: a Fenwick tree (less code). A segment tree is for min/max/gcd, range updates, or richer node data. Interviewers often like hearing you weigh this out loud.',
      '**Language gotchas.** *Python:* recursion depth is not an issue (depth about 20), but deep recursion per query is slow at 10⁵ operations; the bottom-up version is several times faster. `sum` of an empty slice is fine, but `min` of an empty range raises: keep the neutral value. *JavaScript:* `(lo + hi) >> 1` is fine below 2³¹; `Math.min()` of nothing is `Infinity`. *Java:* `new int[4 * n]` for n = 0 makes an empty array and `build(1, 0, -1)` goes wrong; guard `n == 0`. Sum of large values may need `long`. *C++:* use `vector<int>(4 * n)` rather than a fixed global size you may overflow, and use `long long` for sums of up to 10⁵ values of 10⁹.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of building a segment tree over n values (recursive build, combining two children into each parent)?',
        choices: ['O(n log n)', 'O(n)', 'O(log n)', 'O(n²)'], answer: 1,
        explain: 'The tree has 2n − 1 nodes and the build visits each exactly once, with O(1) work to combine two children. Building by calling `update` n times would cost O(n log n), but the recursive build avoids that.' },
      { kind: 'pattern', q: 'Which job is the best fit for a segment tree (as opposed to prefix sums)?',
        choices: ['Many range-sum queries on an array that never changes', 'Many range-minimum queries mixed with point updates', 'Finding the longest increasing run once', 'Counting how often each value occurs'], answer: 1,
        explain: 'Prefix sums break on updates (each one rewrites O(n) prefixes) and don’t handle min at all, since min can’t be subtracted. A segment tree gives O(log n) for both the update and the range minimum. A static array with sums needs only prefix sums.' },
      { kind: 'concept', q: 'In the array layout of a recursive segment tree with the root at index 1, where are the children of node k?',
        choices: ['2k − 1 and 2k', 'k + 1 and k + 2', '2k and 2k + 1', 'k / 2 and k / 2 + 1'], answer: 2,
        explain: 'Same as a heap: with the root at 1, node k’s children are 2k and 2k + 1, and its parent is k // 2. With the root at 0 it would be 2k + 1 and 2k + 2.' },
      { kind: 'complexity', q: 'Why is a range query O(log n) even when the range covers almost the whole array?',
        choices: ['The tree is sorted, so it can binary search', 'At each level at most two nodes partially overlap; the rest are pruned or fully covered and return immediately', 'It reads exactly one leaf', 'It caches earlier answers'], answer: 1,
        explain: 'Only the nodes holding the query’s left edge and right edge can be partial overlaps; every other node at that level is wholly outside or wholly inside and returns without recursing. Two partial nodes per level over about log n levels is O(log n), however wide the range is.' },
      { kind: 'bug', q: 'This range-sum query returns correct answers but is O(n) per call. Why?',
        code: `def query(node, lo, hi, l, r):
    if r < lo or hi < l:
        return 0
    if lo == hi:
        return tree[node]
    mid = (lo + hi) // 2
    return query(2 * node, lo, mid, l, r) + query(2 * node + 1, mid + 1, hi, l, r)`,
        choices: ['The “no overlap” check should come last', 'It never stops at a node that is fully inside the range, so it always walks down to the leaves', 'mid should be (lo + hi + 1) // 2', 'The tree needs 2n slots, not 4n'], answer: 1,
        explain: 'The missing branch is `if l <= lo and hi <= r: return tree[node]`. Without it, every node inside the range recurses down to its leaves, so a query over the whole array touches all 2n − 1 nodes. The answers are right; only the cost is wrong.' },
      { kind: 'concept', q: 'Which of these can be the combine operation of a segment tree? Pick every one that applies.',
        choices: ['Sum', 'Minimum', 'Greatest common divisor', 'Median of the segment'], answer: [0, 1, 2],
        explain: 'The combine must be associative, so the answer for a range can be built from the answers of its two halves. Sum, min and gcd satisfy this. The median of a union can’t be computed from the medians of the two halves, so a plain segment tree can’t store it (you’d store the sorted values or counts instead).' },
      { kind: 'concept', q: 'In a lazy segment tree, what must happen before you recurse into the children of a node that holds a pending tag?',
        choices: ['Nothing: the tag is applied at the end of the query', 'The tag is pushed down: applied to both children (and cleared at the node)', 'The node is rebuilt from the original array', 'The tag is added to the answer twice'], answer: 1,
        explain: 'A pending tag means the children’s stored values are stale. Pushing it down (apply to each child’s value and tag, then clear the node’s tag) makes every node you look at current, in both updates and queries.' },
      { kind: 'pattern', q: 'You only need point updates and range-sum queries, with about 10⁵ operations. What’s the best choice?',
        choices: ['A Fenwick tree: the same O(log n) with less code', 'A prefix-sum array rebuilt after every update', 'A sorted list with binary search', 'A heap'], answer: 0,
        explain: 'Point update plus range sum is exactly what a Fenwick (binary indexed) tree does, in about 10 lines and with a small constant. A segment tree also works and is the right pick when you need min, max, gcd or range updates. A rebuilt prefix array is O(n) per update.' },
      { kind: 'complexity', q: 'How does the cost of a lazy-propagation range-add compare with a plain point update?',
        choices: ['Range add is O(n) because it touches every item', 'Both are O(log n); range add visits about the same nodes as a query, using tags', 'Range add is O(1)', 'Range add is O(log² n)'], answer: 1,
        explain: 'A range update is handled like a query: nodes fully inside the range are stamped with the tag and not explored, so only about 4 log n nodes are touched. Tags are paid back later by pushes, each O(1), along paths that are being visited anyway.' },
      { kind: 'bug', q: 'This min-segment-tree query returns 0 for ranges that include any pruned node. What’s the fix?',
        code: `def query(node, lo, hi, l, r):
    if r < lo or hi < l:
        return 0
    if l <= lo and hi <= r:
        return tree[node]
    mid = (lo + hi) // 2
    return min(query(2 * node, lo, mid, l, r), query(2 * node + 1, mid + 1, hi, l, r))`,
        choices: ['Return float(\'inf\') for the no-overlap case: the neutral value for min', 'Use max instead of min', 'Remove the covered case', 'Build the tree with 2n slots'], answer: 0,
        explain: 'A pruned node must contribute something that can never win the combine. For sum that is 0, but for min it is +∞ (and −∞ for max). Returning 0 makes `min(…, 0)` report 0 whenever one side was pruned.' }
    ],

    flashcards: [
      { id: 'what-stores', front: 'What does each node of a segment tree store?', back: 'The answer (sum, min, max, …) for one segment `[lo, hi]`. The root covers the whole array; a node splits at `mid` into `[lo, mid]` and `[mid+1, hi]`; a leaf is a single value.' },
      { id: 'layout-4n', front: 'Recursive segment tree in an array: child indices and array size?', back: 'Root is node 1; node k has children `2k` and `2k+1`. Allocate `4n` to be safe. (The bottom-up layout with leaves at `n..2n-1` needs exactly `2n`.)' },
      { id: 'build-cost', front: 'Segment tree build: how, and what cost?', back: 'Recurse to the leaves, set each parent to the combine of its two children on the way back. Every node once: **O(n)**.' },
      { id: 'update-path', front: 'Point update: what steps, what cost?', back: 'Walk one root-to-leaf path to the leaf holding the index, overwrite it, recompute each ancestor from its two children on the way back. **O(log n)**.' },
      { id: 'query-cases', front: 'The three cases of a range query at a node?', back: '**Outside** the query: return the neutral value. **Fully inside**: return the stored value, stop. **Partial overlap**: ask both children and combine.' },
      { id: 'query-why-log', front: 'Why is a range query O(log n)?', back: 'At each level at most two nodes (the ones holding the query’s edges) partially overlap; all other visited nodes return immediately. About 4 log n nodes in total, whatever the range width.' },
      { id: 'neutral', front: 'What neutral value does a pruned node return for sum, min, max, gcd?', back: 'Sum: 0. Min: +∞. Max: −∞. gcd: 0. It must not change the combine’s result.' },
      { id: 'assoc', front: 'What property must the combine have, and what fails it?', back: '**Associative** (grouping doesn’t matter). Sum, min, max, gcd, product: fine. “Median” or “mode” of a union can’t be built from the halves’ medians.' },
      { id: 'bottom-up', front: 'Bottom-up (iterative) segment tree: layout and query loop?', back: 'Leaves at `n..2n-1`, parent of i is `i//2`. Query `[lo, hi)`: `if lo&1: take t[lo++]`; `if hi&1: take t[--hi]`; then `lo//=2; hi//=2` until `lo >= hi`. Commutative combines only.' },
      { id: 'lazy-rule', front: 'Lazy propagation: the one rule that keeps it correct?', back: 'Push a node’s pending tag down to both children **before** recursing into them (in updates and queries). A fully covered node is updated alone and stamped with the tag. For range-add on a sum, apply `v * length`.' },
      { id: 'fenwick-vs', front: 'When is a Fenwick tree enough instead of a segment tree?', back: 'Point update + prefix or range **sum** (or other invertible operations). Use a segment tree for min, max, gcd, range updates (lazy), or richer node data.' },
      { id: 'compress', front: 'Huge coordinates, few events: how do you use a segment tree?', back: 'Sort and dedupe the coordinates; use each one’s rank as the index. For half-open spans `[a, b)`, let rank i stand for the stretch to the next coordinate, so the span is `[rank(a), rank(b) - 1]`.' }
    ],

    deeper: [
      { title: 'Segment Tree (cp-algorithms)', url: 'https://cp-algorithms.com/data_structures/segment_tree.html', time: 'about 30 min', note: 'The standard reference: sum, min with position, lazy propagation, persistent and 2D variants, with clean code and the usual gotchas. Read the lazy section after the basics click.' },
      { title: 'Efficient and easy segment trees (Codeforces blog)', url: 'https://codeforces.com/blog/entry/18051', time: 'about 20 min', note: 'The source of the bottom-up 2n layout used in this lesson, including range updates without recursion and the non-commutative query.' },
      { title: 'Segment Tree Visualization (VisuAlgo)', url: 'https://visualgo.net/en/segmenttree', time: 'about 15 min', note: 'An animated tree for range-minimum and range-sum with update. A second view of the same moves once the one on this page feels easy.' },
      { title: 'Point Update Range Sum (USACO Guide)', url: 'https://usaco.guide/gold/PURS', time: 'about 25 min', note: 'Segment trees and Fenwick trees side by side for the same task, with practice problems. Good for the “which one should I pick” question.' },
      { title: 'NeetCode roadmap: Advanced Algorithms', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where segment trees sit among the advanced topics. They are outside the NeetCode 150 itself. Some course pages may ask you to sign in.' }
    ],

    detective: [
      { id: 'cold-spot', decoys: ['prefix-sums', 'sliding-window', 'heaps'],
        statement: 'A pipeline has 40,000 temperature sensors in a line. Readings are corrected all day long: a technician recalibrates one sensor and its value changes. Meanwhile, inspectors keep asking for the coldest reading between two markers along the pipe, for markers anywhere. Both kinds of request arrive at thousands per minute, and a full re-scan of the stretch for every question is much too slow.',
        why: 'Values change one at a time **and** the questions are about arbitrary ranges. The answer is a minimum, which can’t be subtracted the way a running total can, so a prefix table doesn’t apply. Storing the coldest reading of every block in a halving split lets both the correction and the question run in O(log n): a segment tree.' },
      { id: 'lamp-rows', decoys: ['prefix-sums', 'intervals', 'sliding-window'],
        statement: 'A theatre has 100,000 stage lamps in a row, each with a brightness level. The lighting designer keeps issuing cues of the kind “raise every lamp from number 300 to number 7,000 by three levels”, and the electrician keeps asking for the **total** brightness of the lamps between two numbers. Raising each lamp one by one for every cue would take far too long when there are 50,000 cues.',
        why: 'An update that changes a **whole range** at once, paired with range totals, defeats a plain prefix table (each cue would rewrite thousands of entries) and a per-lamp tree update. Storing a pending “add this to every lamp in this block” note on a few big blocks, and passing it down only when needed, makes each cue and each total O(log n): a segment tree with lazy propagation.' },
      { id: 'crane-rail', decoys: ['intervals', 'heaps', 'monotonic'],
        statement: 'A crane drops wooden crates, one after another, onto a rail a billion metres long. Each crate is a square block given by where its left edge starts and how wide it is. It falls until it rests on the highest crate beneath it (or on the rail). Crates that merely touch side by side don’t support each other. After every drop, the foreman wants the height of the tallest tower on the rail. There are only a couple of thousand crates, but the positions are huge.',
        why: 'Each drop needs the **highest** value across a span, then raises that whole span to a new height: a range maximum and a range update. The positions are enormous but few, so they can be squeezed into small indices by sorting the crate edges. A tree over those compressed indices does each drop in O(log n).' }
    ]
  });
})();
