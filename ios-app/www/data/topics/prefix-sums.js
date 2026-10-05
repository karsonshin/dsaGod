/* Offer Ready: Prefix sums and difference arrays. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'prefix-sums',

    hook: 'If a question asks for the sum of a range, over and over, or “how many subarrays add up to k”, precompute running totals once and every range costs one subtraction. It turns an O(n²) pile of re-adding into O(n), and it’s the standard answer when a sliding window breaks on negative numbers. It’s a quiet workhorse of phone screens and online assessments: Subarray Sum Equals K is a staple array question, and Product of Array Except Self is on the NeetCode 150.',

    cues: [
      'You’ll answer **many range-sum queries** on an array that doesn’t change: “the total between index l and r”.',
      'The question counts or finds **contiguous subarrays with an exact sum** (or an exact count, balance or remainder), and the numbers can be **negative**.',
      'You want “everything to the left of i” and “everything to the right of i” for each position: a pivot, a split, a product except self.',
      'Many **range updates** (“add v to every element from l to r”) come first and you read the final array **once** at the end.',
      'The data is a **grid** and you’re asked for the total inside many rectangles.',
      'The brute force re-adds the same elements for each query or each pair of endpoints.'
    ],

    intuition: [
      'Think of the mile markers along a highway. To find the distance from exit 12 to exit 47, you don’t drive it and add up each stretch: you read the two markers and subtract. A prefix-sum array is that row of markers: `prefix[i]` is the total of everything before position i. Any range sum is then “marker at the end minus marker before the start”.',
      'Precisely:',
      '1. Build `prefix` with one extra slot: `prefix[0] = 0` (nothing added yet) and `prefix[i + 1] = prefix[i] + nums[i]`.\n2. The sum of `nums[l..r]`, both ends included, is `prefix[r + 1] - prefix[l]`.\n3. Building costs O(n) once; every query after that is O(1).',
      'The extra zero at the front is the part people skip and regret. It makes “a range that starts at index 0” follow the same formula as every other range, with no special case.',
      'Now turn the idea around. Suppose you want the number of subarrays whose sum is exactly k. The subarray from `j` to `i` has sum `prefix[i + 1] - prefix[j]`, so it equals k exactly when `prefix[j] = prefix[i + 1] - k`. Walking left to right, at each position you ask one question: **how many earlier prefix values equal “current prefix minus k”?** A hash map from prefix value to “how many times I’ve seen it” answers that in O(1). That’s the whole algorithm, and it never looks at the sign of a number.',
      'That’s why it beats a [sliding window](#/topic/sliding-window) here. A window only works when growing it moves the sum one way. With a negative number, a window that’s too small can need to grow, and one that’s too big can need to grow too, so you can’t decide which edge to move. Prefix sums don’t decide anything: they just count matches.',
      'Two cousins share the idea. A **difference array** is the reverse of a prefix array: to add v to the range `[l, r]`, write `+v` at `l` and `-v` at `r + 1`, then take one running sum at the end. A **2D prefix sum** stores, for every cell, the total of the rectangle from the top-left corner to that cell, so any rectangle is four lookups.'
    ].join('\n\n'),

    viz: 'prefix-sum',

    template: {
      title: 'Prefix sums with a hash map: count the subarrays that sum to k',
      note: 'To reuse it, change what you store and what you look for. Here we store prefix **sums** and look up `running - k`. For “equal numbers of 0s and 1s” you store a running **balance** and look up the same balance. For “divisible by k” you store the running sum **mod k** and look up the same remainder. The three lines (extend, look up, store) stay the same, and the look-up always comes **before** the store.',
      code: {
        py: `def count_subarrays(nums, k):
    seen = {0: 1}                                  #> Prefix sums seen so far, with counts. The empty prefix (sum 0) has been seen once
    running = count = 0
    for x in nums:
        running += x                               #@add > 1. Extend the running prefix sum by one element
        count += seen.get(running - k, 0)          #@look > 2. Every earlier prefix equal to running − k ends a subarray with sum k here
        seen[running] = seen.get(running, 0) + 1   #@store > 3. Remember this prefix for the positions that follow
    return count`,
        js: `function countSubarrays(nums, k) {
  const seen = new Map([[0, 1]]);                   //> Prefix sums seen so far, with counts. The empty prefix (sum 0) has been seen once
  let running = 0, count = 0;
  for (const x of nums) {
    running += x;                                   //@add > 1. Extend the running prefix sum by one element
    count += seen.get(running - k) || 0;            //@look > 2. Every earlier prefix equal to running − k ends a subarray with sum k here
    seen.set(running, (seen.get(running) || 0) + 1); //@store > 3. Remember this prefix for the positions that follow
  }
  return count;
}`,
        java: `class Solution {
    public int countSubarrays(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                                  //> Prefix sums seen so far, with counts. The empty prefix (sum 0) has been seen once
        int running = 0, count = 0;
        for (int x : nums) {
            running += x;                                //@add > 1. Extend the running prefix sum by one element
            count += seen.getOrDefault(running - k, 0);  //@look > 2. Every earlier prefix equal to running − k ends a subarray with sum k here
            seen.merge(running, 1, Integer::sum);        //@store > 3. Remember this prefix for the positions that follow
        }
        return count;
    }
}`,
        cpp: `class Solution {
public:
    int countSubarrays(vector<int>& nums, int k) {
        unordered_map<int, int> seen;
        seen[0] = 1;                                                //> Prefix sums seen so far, with counts. The empty prefix (sum 0) has been seen once
        int running = 0, count = 0;
        for (int x : nums) {
            running += x;                                           //@add > 1. Extend the running prefix sum by one element
            count += seen.count(running - k) ? seen[running - k] : 0; //@look > 2. Every earlier prefix equal to running − k ends a subarray with sum k here
            seen[running]++;                                        //@store > 3. Remember this prefix for the positions that follow
        }
        return count;
    }
};`
      },
      tests: { fn: { py: 'count_subarrays', default: 'countSubarrays' }, sig: { args: ['int[]', 'int'] }, cases: [
        { args: [[1, 1, 1], 2], out: 2 }, { args: [[1, 2, 3], 3], out: 2 }, { args: [[1, -1, 0], 0], out: 3 }, { args: [[3, 4, 7, 2, -3, 1, 4, 2], 7], out: 4 },
        { args: [[5], 5], out: 1 }, { args: [[-1, -1, 1], 0], out: 1 }, { args: [[0, 0, 0], 0], out: 6 }, { args: [[1], 0], out: 0 }, { args: [[-1, -1], -2], out: 1 }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      why: 'Building a prefix array is one pass, O(n), and each range query afterwards is a single subtraction, O(1). The hash-map version makes one pass with one look-up and one store per element, so it’s O(n) on average, and the map holds at most n + 1 distinct prefix values, so O(n) space. A difference array is O(n + number of updates), where the brute force is O(n × updates).',
      trap: 'Hash-map operations are O(1) **on average**, not in the worst case; say “expected O(n)” if you’re asked to be precise. And don’t forget what prefix sums cost: O(n) extra memory. If you only need the answer to a single window of fixed size, a running sum does the job in O(1) space (that’s the [fixed window](#/topic/sliding-window)).'
    },

    variations: [
      {
        name: 'Range-sum queries, and the prefix[0] = 0 rule',
        body: 'This is the base case: many queries on one unchanging array. The array is **one slot longer** than the input, so `prefix[0] = 0` and `prefix[i]` is the sum of the first i elements. The sum of `nums[l..r]` (both ends included) is `prefix[r + 1] - prefix[l]`. If you build the array the same length as `nums` instead, a range starting at 0 needs a special case, which is where most off-by-one bugs come from. Range Sum Query: Immutable (303) is exactly this. If the array also **changes** between queries, a plain prefix array has to be rebuilt each time, so reach for a [Fenwick tree](#/topic/fenwick) instead.',
        code: {
          py: `def range_sums(nums, queries):
    prefix = [0] * (len(nums) + 1)                          #> prefix[i] is the sum of the first i elements, so prefix[0] = 0
    for i, x in enumerate(nums):
        prefix[i + 1] = prefix[i] + x
    return [prefix[r + 1] - prefix[l] for l, r in queries]  #> The sum of nums[l..r] is one subtraction`,
          js: `function rangeSums(nums, queries) {
  const prefix = new Array(nums.length + 1).fill(0);     //> prefix[i] is the sum of the first i elements, so prefix[0] = 0
  for (let i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
  return queries.map(([l, r]) => prefix[r + 1] - prefix[l]);  //> The sum of nums[l..r] is one subtraction
}`,
          java: `class Solution {
    public int[] rangeSums(int[] nums, int[][] queries) {
        int[] prefix = new int[nums.length + 1];         //> prefix[i] is the sum of the first i elements, so prefix[0] = 0
        for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
        int[] out = new int[queries.length];
        for (int q = 0; q < queries.length; q++) {
            out[q] = prefix[queries[q][1] + 1] - prefix[queries[q][0]];  //> The sum of nums[l..r] is one subtraction
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> rangeSums(vector<int>& nums, vector<vector<int>>& queries) {
        vector<int> prefix(nums.size() + 1, 0);          //> prefix[i] is the sum of the first i elements, so prefix[0] = 0
        for (size_t i = 0; i < nums.size(); i++) prefix[i + 1] = prefix[i] + nums[i];
        vector<int> out;
        for (auto& q : queries) out.push_back(prefix[q[1] + 1] - prefix[q[0]]);  //> The sum of nums[l..r] is one subtraction
        return out;
    }
};`
        },
        tests: { fn: { py: 'range_sums', default: 'rangeSums' }, sig: { args: ['int[]', 'int[][]'] }, cases: [
          { args: [[-2, 0, 3, -5, 2, -1], [[0, 2], [2, 5], [0, 5], [3, 3]]], out: [1, -1, -3, -5] }, { args: [[5], [[0, 0]]], out: [5] }] }
      },
      {
        name: 'Difference arrays: many range updates, one read',
        body: 'A difference array is a prefix sum run backwards. To add v to every element of `[l, r]`, don’t touch the range: write `+v` at `diff[l]` and `-v` at `diff[r + 1]`. One running sum over `diff` at the end rebuilds the final array, because `+v` switches the addition on at `l` and `-v` switches it off just after `r`. Each update is O(1), so m updates on n elements cost O(n + m) instead of O(n · m). It only fits when you read the result **after** all the updates; if reads and updates are mixed, you need a Fenwick or segment tree. Corporate Flight Bookings (1109) and Car Pooling (1094) are the classics.',
        code: {
          py: `def apply_updates(n, updates):
    diff = [0] * (n + 1)              #> One spare slot, so r + 1 is always in range
    for l, r, v in updates:
        diff[l] += v                  #> +v switches on at l ...
        diff[r + 1] -= v              #> ... and switches off just after r
    out, running = [], 0
    for i in range(n):
        running += diff[i]            #> A running sum of the differences rebuilds the array
        out.append(running)
    return out`,
          js: `function applyUpdates(n, updates) {
  const diff = new Array(n + 1).fill(0);   //> One spare slot, so r + 1 is always in range
  for (const [l, r, v] of updates) {
    diff[l] += v;                          //> +v switches on at l ...
    diff[r + 1] -= v;                      //> ... and switches off just after r
  }
  const out = [];
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];                    //> A running sum of the differences rebuilds the array
    out.push(running);
  }
  return out;
}`,
          java: `class Solution {
    public int[] applyUpdates(int n, int[][] updates) {
        int[] diff = new int[n + 1];       //> One spare slot, so r + 1 is always in range
        for (int[] u : updates) {
            diff[u[0]] += u[2];            //> +v switches on at l ...
            diff[u[1] + 1] -= u[2];        //> ... and switches off just after r
        }
        int[] out = new int[n];
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];            //> A running sum of the differences rebuilds the array
            out[i] = running;
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> applyUpdates(int n, vector<vector<int>>& updates) {
        vector<int> diff(n + 1, 0);        //> One spare slot, so r + 1 is always in range
        for (auto& u : updates) {
            diff[u[0]] += u[2];            //> +v switches on at l ...
            diff[u[1] + 1] -= u[2];        //> ... and switches off just after r
        }
        vector<int> out(n);
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];            //> A running sum of the differences rebuilds the array
            out[i] = running;
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'apply_updates', default: 'applyUpdates' }, sig: { args: ['int', 'int[][]'] }, cases: [
          { args: [5, [[1, 3, 2], [2, 4, 3], [0, 2, -2]]], out: [-2, 0, 3, 5, 3] }, { args: [3, [[0, 2, 1]]], out: [1, 1, 1] }, { args: [4, [[0, 0, 5], [3, 3, -1], [1, 2, 4], [1, 3, 1]]], out: [5, 5, 5, 0] }] }
      },
      {
        name: '2D prefix sums: any rectangle in four lookups',
        body: 'Let `P[r][c]` be the sum of the block of rows above `r` and columns left of `c` (again with a padding row and column of zeros). Build it with inclusion–exclusion: a cell’s block is the cell, plus the block above it, plus the block to its left, **minus** the overlap that both of those counted. A rectangle from `(r1, c1)` to `(r2, c2)` is the big block, minus the strip above, minus the strip to the left, plus the corner you subtracted twice. Range Sum Query 2D (304) and Matrix Block Sum (1314) use it.',
        code: {
          py: `def region_sums(grid, queries):
    rows, cols = len(grid), len(grid[0])
    P = [[0] * (cols + 1) for _ in range(rows + 1)]     #> P[r][c] is the sum of rows < r and columns < c; row 0 and column 0 are zeros
    for r in range(rows):
        for c in range(cols):
            P[r + 1][c + 1] = grid[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c]   #> Cell, plus above, plus left, minus the overlap counted twice
    return [P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]
            for r1, c1, r2, c2 in queries]               #> Whole block, minus the strip above, minus the strip left, plus the corner removed twice`,
          js: `function regionSums(grid, queries) {
  const rows = grid.length, cols = grid[0].length;
  const P = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));   //> P[r][c] is the sum of rows < r and columns < c; row 0 and column 0 are zeros
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      P[r + 1][c + 1] = grid[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];          //> Cell, plus above, plus left, minus the overlap counted twice
  return queries.map(([r1, c1, r2, c2]) =>
    P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]);               //> Whole block, minus the strip above, minus the strip left, plus the corner removed twice
}`,
          java: `class Solution {
    public int[] regionSums(int[][] grid, int[][] queries) {
        int rows = grid.length, cols = grid[0].length;
        int[][] P = new int[rows + 1][cols + 1];         //> P[r][c] is the sum of rows < r and columns < c; row 0 and column 0 are zeros
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                P[r + 1][c + 1] = grid[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];   //> Cell, plus above, plus left, minus the overlap counted twice
        int[] out = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            int[] q = queries[i];
            out[i] = P[q[2] + 1][q[3] + 1] - P[q[0]][q[3] + 1] - P[q[2] + 1][q[1]] + P[q[0]][q[1]];  //> Whole block, minus the strip above, minus the strip left, plus the corner removed twice
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> regionSums(vector<vector<int>>& grid, vector<vector<int>>& queries) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<int>> P(rows + 1, vector<int>(cols + 1, 0));   //> P[r][c] is the sum of rows < r and columns < c; row 0 and column 0 are zeros
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                P[r + 1][c + 1] = grid[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];   //> Cell, plus above, plus left, minus the overlap counted twice
        vector<int> out;
        for (auto& q : queries)
            out.push_back(P[q[2] + 1][q[3] + 1] - P[q[0]][q[3] + 1] - P[q[2] + 1][q[1]] + P[q[0]][q[1]]);  //> Whole block, minus the strip above, minus the strip left, plus the corner removed twice
        return out;
    }
};`
        },
        tests: { fn: { py: 'region_sums', default: 'regionSums' }, sig: { args: ['int[][]', 'int[][]'] }, cases: [
          { args: [[[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]], [[2, 1, 4, 3], [1, 1, 2, 2], [1, 2, 2, 4], [0, 0, 4, 4], [3, 3, 3, 3]]], out: [8, 11, 12, 58, 1] },
          { args: [[[-1, 2], [3, -4]], [[0, 0, 1, 1], [0, 1, 1, 1], [1, 0, 1, 0]]], out: [0, -2, 3] }] }
      },
      {
        name: 'Remainders: “divisible by k” and its negative-number trap',
        body: 'A subarray’s sum is divisible by k exactly when its two prefix sums leave the **same remainder** mod k, because the difference of two numbers with equal remainders is a multiple of k. So store the running sum mod k instead of the running sum, and look up the same remainder you’re holding (no `- k` this time). Subarray Sums Divisible by K (974) and Continuous Subarray Sum (523) work this way. **Watch the sign:** in Java, JavaScript and C++, `-3 % 5` is `-3`, not `2`, so a negative running sum gives a negative remainder that never matches its positive twin. Normalize with `((x % k) + k) % k`. Python’s `%` already returns a non-negative result for a positive k.',
        code: {
          py: `def subarrays_div_by_k(nums, k):
    seen = {0: 1}                          #> The empty prefix has remainder 0
    running = count = 0
    for x in nums:
        running = (running + x) % k        #> Python's % is non-negative here. In other languages normalize it
        count += seen.get(running, 0)      #> Same remainder as an earlier prefix: the stretch between them is a multiple of k
        seen[running] = seen.get(running, 0) + 1
    return count`,
          js: `function subarraysDivByK(nums, k) {
  const seen = new Map([[0, 1]]);                  //> The empty prefix has remainder 0
  let running = 0, count = 0;
  for (const x of nums) {
    running = (((running + x) % k) + k) % k;       //> JavaScript's % can be negative: normalize into 0..k-1
    count += seen.get(running) || 0;               //> Same remainder as an earlier prefix: the stretch between them is a multiple of k
    seen.set(running, (seen.get(running) || 0) + 1);
  }
  return count;
}`,
          java: `class Solution {
    public int subarraysDivByK(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                                    //> The empty prefix has remainder 0
        int running = 0, count = 0;
        for (int x : nums) {
            running = (((running + x) % k) + k) % k;       //> Java's % can be negative: normalize into 0..k-1
            count += seen.getOrDefault(running, 0);        //> Same remainder as an earlier prefix: the stretch between them is a multiple of k
            seen.merge(running, 1, Integer::sum);
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int subarraysDivByK(vector<int>& nums, int k) {
        unordered_map<int, int> seen;
        seen[0] = 1;                                       //> The empty prefix has remainder 0
        int running = 0, count = 0;
        for (int x : nums) {
            running = (((running + x) % k) + k) % k;       //> C++'s % can be negative: normalize into 0..k-1
            count += seen.count(running) ? seen[running] : 0;   //> Same remainder as an earlier prefix: the stretch between them is a multiple of k
            seen[running]++;
        }
        return count;
    }
};`
        },
        tests: { fn: { py: 'subarrays_div_by_k', default: 'subarraysDivByK' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[4, 5, 0, -2, -3, 1], 5], out: 7 }, { args: [[5], 9], out: 0 }, { args: [[-1, 2, 9], 2], out: 2 }, { args: [[2, -2, 2, -4], 6], out: 2 }, { args: [[0, 0], 3], out: 3 }] }
      },
      {
        name: 'Other things that prefix up',
        body: 'Nothing here requires the operation to be addition. Anything you can **undo** works: a prefix XOR (the XOR of a range is two prefix values XORed together), a prefix count of a letter (to ask “how many a’s between l and r”), a prefix count of vowels or candles, or a prefix **product** when no value is zero. Product of Array Except Self (238) keeps a prefix product and a suffix product, so it never needs division, which also means a zero in the input can’t break it. The 2D version above is the same idea with two directions.'
      },
      {
        name: 'When a plain prefix array is the wrong tool',
        body: 'If values change between queries, the prefix array goes stale: use a [Fenwick tree](#/topic/fenwick) or a [segment tree](#/topic/segment-tree). If you only need one window of fixed size, a running sum (the [fixed window](#/topic/sliding-window)) takes O(1) space instead of O(n). If you need the **best** sum rather than a count or a range, that’s [Kadane](#/topic/kadane). And if the array holds only non-negative numbers and the rule is monotonic (“sum at most t”, “shortest with sum at least t”), a sliding window is simpler and lighter.'
      }
    ],

    worked: [
      {
        lc: 560,
        restate: 'Given an integer array `nums` and an integer `k`, return the number of contiguous, non-empty subarrays whose elements add up to exactly `k`.',
        examples: '- `nums = [1, 1, 1]`, `k = 2` → 2: the pair at positions 0–1 and the pair at 1–2.\n- `nums = [1, 2, 3]`, `k = 3` → 2: `[1, 2]` and `[3]`.\n- `nums = [1, -1, 0]`, `k = 0` → 3: `[1, -1]`, `[0]` and `[1, -1, 0]`.\n- Edge cases: values can be negative or zero, and `k` can be zero or negative. A subarray that starts at index 0 has to be counted, which is why the map starts with `{0: 1}`.',
        brute: 'Try every start and extend to every end, keeping a running sum: O(n²) pairs, with a running total so each pair is O(1). That’s about 2·10⁸ pairs at the real limit of 2·10⁴ elements, too slow in Python and borderline elsewhere.',
        insight: 'The subarray from `j` to `i` sums to `prefix[i + 1] - prefix[j]`. It equals k exactly when `prefix[j] = prefix[i + 1] - k`. So keep a map of how many times each prefix sum has occurred so far, and at each position add the count stored under `running - k`. A sliding window can’t do this, because negative numbers mean the sum doesn’t move one way as the window grows. Look up **before** storing the current prefix, and start the map with `{0: 1}` for the empty prefix.',
        code: {
          py: `class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        seen = {0: 1}                              # prefix sum -> how many times seen; the empty prefix has sum 0
        running = count = 0
        for x in nums:
            running += x
            count += seen.get(running - k, 0)      # earlier prefixes that leave exactly k
            seen[running] = seen.get(running, 0) + 1
        return count`,
          js: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);                  // prefix sum -> how many times seen; the empty prefix has sum 0
  let running = 0, count = 0;
  for (const x of nums) {
    running += x;
    count += seen.get(running - k) || 0;           // earlier prefixes that leave exactly k
    seen.set(running, (seen.get(running) || 0) + 1);
  }
  return count;
}`,
          java: `class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                            // prefix sum -> how many times seen; the empty prefix has sum 0
        int running = 0, count = 0;
        for (int x : nums) {
            running += x;
            count += seen.getOrDefault(running - k, 0);   // earlier prefixes that leave exactly k
            seen.merge(running, 1, Integer::sum);
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> seen;
        seen[0] = 1;                               // prefix sum -> how many times seen; the empty prefix has sum 0
        int running = 0, count = 0;
        for (int x : nums) {
            running += x;
            count += seen.count(running - k) ? seen[running - k] : 0;   // earlier prefixes that leave exactly k
            seen[running]++;
        }
        return count;
    }
};`
        },
        complexity: 'O(n) expected time: one pass with one look-up and one store per element. O(n) space for the map, which holds at most n + 1 distinct prefix sums.',
        say: '“A subarray’s sum is the difference of two prefix sums, so it equals k when an earlier prefix equals the current prefix minus k. I walk left to right with a running sum and a hash map from prefix sum to how often I’ve seen it, and at each element I add the count for running minus k, then record the running sum. I start the map with zero seen once so subarrays that begin at index 0 count. It’s O(n) time and O(n) space, and it works with negatives, which a sliding window wouldn’t.”',
        followups: [
          { q: 'Why not a sliding window?', a: 'A window needs the sum to move in one direction when you grow or shrink it. With negative numbers it doesn’t, so you can’t tell which edge to move. In `[1, -1, 5, -2, 3]` with k = 3, the window `[1, -1, 5, -2]` (sum 3) only appears after the sum has gone up past 3 and back down. Prefix sums don’t need that property.' },
          { q: 'Why do you look up before you store the current prefix?', a: 'A subarray has to be non-empty. If you stored first, then with k = 0 the current prefix would match itself and count an empty subarray at every position.' },
          { q: 'What if you had to return the subarrays, not just count them?', a: 'Store a list of indices for each prefix sum instead of a count. Then each match gives you a start index for the subarray, but the output itself can be large, so the answer is no longer O(n).' },
          { q: 'Can you do it in O(1) extra space?', a: 'Not with this method: the map is the extra space. If every number is non-negative, a sliding window handles it in O(1) extra space, with a little care for zeros. With negatives, the map is the standard answer.' }
        ]
      },
      {
        lc: 238,
        restate: 'Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of every element except `nums[i]`. Don’t use division, and run in O(n).',
        examples: '- `[1, 2, 3, 4]` → `[24, 12, 8, 6]`.\n- `[-1, 1, 0, -3, 3]` → `[0, 0, 9, 0, 0]`: with a single zero, only the zero’s own slot is non-zero.\n- Edge cases: two zeros make every answer 0, and the input has at least two elements.',
        brute: 'For each i, multiply every other element: O(n²). Dividing the total product by `nums[i]` is O(n) but isn’t allowed, and it breaks the moment a zero shows up anyway.',
        insight: '`answer[i]` is (the product of everything **left** of i) × (the product of everything **right** of i). That’s a prefix product and a suffix product. Compute the left products in one pass and store them straight into the output, then sweep from the right with a running product and multiply it in. Two passes, no division, and no extra array besides the output.',
        code: {
          py: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        out = [1] * n
        left = 1
        for i in range(n):
            out[i] = left              # product of everything left of i
            left *= nums[i]
        right = 1
        for i in range(n - 1, -1, -1):
            out[i] *= right            # times the product of everything right of i
            right *= nums[i]
        return out`,
          js: `function productExceptSelf(nums) {
  const n = nums.length, out = new Array(n).fill(1);
  let left = 1;
  for (let i = 0; i < n; i++) {
    out[i] = left;                     // product of everything left of i
    left *= nums[i];
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= right;                   // times the product of everything right of i
    right *= nums[i];
  }
  return out;
}`,
          java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];
        int left = 1;
        for (int i = 0; i < n; i++) {
            out[i] = left;             // product of everything left of i
            left *= nums[i];
        }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= right;           // times the product of everything right of i
            right *= nums[i];
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n, 1);
        int left = 1;
        for (int i = 0; i < n; i++) {
            out[i] = left;             // product of everything left of i
            left *= nums[i];
        }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= right;           // times the product of everything right of i
            right *= nums[i];
        }
        return out;
    }
};`
        },
        complexity: 'O(n) time: two passes. O(1) extra space beyond the output array.',
        say: '“The answer at i is the product to its left times the product to its right, so I’ll build both as running products. The first pass writes each prefix product into the output. The second pass goes right to left with a running suffix product and multiplies it in. That’s two passes and no division, so zeros are handled for free. O(n) time, and O(1) extra space apart from the output.”',
        followups: [
          { q: 'Why is division a bad idea even when it’s allowed?', a: 'A zero makes the total product 0 and the division undefined or wrong. You’d have to count zeros and special-case them: one zero means only that slot is non-zero, two or more means everything is zero. Prefix and suffix products avoid all of that.' },
          { q: 'What if the output array doesn’t count as extra space?', a: 'That’s the version above: the output holds the prefix products, and the suffix product is a single variable. If it did count, you’d store a prefix array and a suffix array, which is O(n) extra.' },
          { q: 'What if the product can overflow?', a: 'The problem promises each answer fits in a 32-bit integer. If it didn’t, you’d use a wider type, or return the answers modulo a number. Mention it and ask.' }
        ]
      },
      {
        lc: 1109,
        restate: 'There are `n` flights, labelled 1 to `n`. Each booking `[first, last, seats]` reserves `seats` seats on every flight from `first` to `last`, both included. Return an array with the total seats reserved on each flight.',
        examples: '- `bookings = [[1,2,10],[2,3,20],[2,5,25]]`, `n = 5` → `[10, 55, 45, 25, 25]`.\n- `bookings = [[1,2,10],[2,2,15]]`, `n = 2` → `[10, 25]`.\n- Edge cases: a booking for a single flight (`first = last`), and a booking that reaches flight `n`, where the “switch off” lands one slot past the end.',
        brute: 'For each booking, add its seats to every flight in its range: O(bookings × n). With up to 2·10⁴ of each, that’s up to 4·10⁸ additions.',
        insight: 'You only read the answer once, after every booking, which is the signal for a difference array. A booking adds `seats` to flights `first..last`, so write `+seats` at `first` and `-seats` just after `last`. The labels start at 1 and arrays start at 0, so those are `diff[first - 1]` and `diff[last]`. One running sum over `diff` gives the totals.',
        code: {
          py: `class Solution:
    def corpFlightBookings(self, bookings: List[List[int]], n: int) -> List[int]:
        diff = [0] * (n + 1)
        for first, last, seats in bookings:
            diff[first - 1] += seats       # flights are 1-indexed, the array is 0-indexed
            diff[last] -= seats            # index "last" is the flight after the range ends
        out, running = [], 0
        for i in range(n):
            running += diff[i]
            out.append(running)
        return out`,
          js: `function corpFlightBookings(bookings, n) {
  const diff = new Array(n + 1).fill(0);
  for (const [first, last, seats] of bookings) {
    diff[first - 1] += seats;              // flights are 1-indexed, the array is 0-indexed
    diff[last] -= seats;                   // index "last" is the flight after the range ends
  }
  const out = [];
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];
    out.push(running);
  }
  return out;
}`,
          java: `class Solution {
    public int[] corpFlightBookings(int[][] bookings, int n) {
        int[] diff = new int[n + 1];
        for (int[] b : bookings) {
            diff[b[0] - 1] += b[2];        // flights are 1-indexed, the array is 0-indexed
            diff[b[1]] -= b[2];            // index b[1] is the flight after the range ends
        }
        int[] out = new int[n];
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];
            out[i] = running;
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> corpFlightBookings(vector<vector<int>>& bookings, int n) {
        vector<int> diff(n + 1, 0);
        for (auto& b : bookings) {
            diff[b[0] - 1] += b[2];        // flights are 1-indexed, the array is 0-indexed
            diff[b[1]] -= b[2];            // index b[1] is the flight after the range ends
        }
        vector<int> out(n);
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];
            out[i] = running;
        }
        return out;
    }
};`
        },
        complexity: 'O(n + bookings) time: each booking is two writes, then one pass over the flights. O(n) space.',
        say: '“I only need the totals after all the bookings, so I’ll use a difference array. For each booking I add its seats at the first flight and subtract them just after the last, then one running sum over the array gives each flight’s total. That’s O(n + bookings) instead of O(n × bookings). I’ll be careful with the one-based flight numbers.”',
        followups: [
          { q: 'Why is there an extra slot at the end of `diff`?', a: 'A booking that ends on flight n writes its “switch off” at index n, one past the last flight. The spare slot keeps that write in range, and the running sum never reads it.' },
          { q: 'What if you had to answer “how many seats on flight f” between bookings?', a: 'Then reads and updates are mixed, and a difference array has to be re-summed on every read. Use a Fenwick tree, which supports range update and point query in O(log n).' },
          { q: 'How does this relate to Car Pooling (1094)?', a: 'It’s the same trick, with the stops as positions: add passengers at the pick-up, remove them at the drop-off, and check that the running total never exceeds the capacity.' }
        ]
      },
      {
        lc: 525,
        restate: 'Given a binary array `nums`, return the length of the longest contiguous subarray that has the same number of 0s and 1s.',
        examples: '- `[0, 1]` → 2.\n- `[0, 1, 0]` → 2: `[0, 1]` or `[1, 0]`.\n- `[0, 0, 1, 0, 0, 0, 1, 1]` → 6: from index 2 to index 7.\n- Edge cases: no balanced stretch at all (`[1]`, `[0, 0, 0]`) → 0.',
        brute: 'Try every start and end, tracking the counts of 0s and 1s: O(n²), too slow for n = 10⁵.',
        insight: 'Treat each 0 as −1 and each 1 as +1. A stretch has equal 0s and 1s exactly when its sum is 0, and that’s “two equal prefix sums”. This time you want the **longest**, so the map keeps the **first** index where each running balance appeared: when a balance repeats, the stretch between the first sighting and now is the longest one ending here. Seed the map with balance 0 at index −1 for stretches that start at the beginning.',
        code: {
          py: `class Solution:
    def findMaxLength(self, nums: List[int]) -> int:
        first = {0: -1}                    # balance -> earliest index it appeared; -1 means before the array
        balance = best = 0
        for i, x in enumerate(nums):
            balance += 1 if x == 1 else -1
            if balance in first:
                best = max(best, i - first[balance])
            else:
                first[balance] = i         # only the first sighting is stored: it gives the longest stretch
        return best`,
          js: `function findMaxLength(nums) {
  const first = new Map([[0, -1]]);        // balance -> earliest index it appeared; -1 means before the array
  let balance = 0, best = 0;
  for (let i = 0; i < nums.length; i++) {
    balance += nums[i] === 1 ? 1 : -1;
    if (first.has(balance)) best = Math.max(best, i - first.get(balance));
    else first.set(balance, i);            // only the first sighting is stored: it gives the longest stretch
  }
  return best;
}`,
          java: `class Solution {
    public int findMaxLength(int[] nums) {
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);                  // balance -> earliest index it appeared; -1 means before the array
        int balance = 0, best = 0;
        for (int i = 0; i < nums.length; i++) {
            balance += nums[i] == 1 ? 1 : -1;
            Integer seenAt = first.get(balance);
            if (seenAt != null) best = Math.max(best, i - seenAt);
            else first.put(balance, i);    // only the first sighting is stored: it gives the longest stretch
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int findMaxLength(vector<int>& nums) {
        unordered_map<int, int> first;
        first[0] = -1;                     // balance -> earliest index it appeared; -1 means before the array
        int balance = 0, best = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            balance += nums[i] == 1 ? 1 : -1;
            auto it = first.find(balance);
            if (it != first.end()) best = max(best, i - it->second);
            else first[balance] = i;       // only the first sighting is stored: it gives the longest stretch
        }
        return best;
    }
};`
        },
        complexity: 'O(n) expected time: one pass with one map look-up per element. O(n) space: at most n + 1 distinct balances.',
        say: '“I’ll map each 0 to −1, so a balanced stretch is one whose sum is zero, which means two equal prefix balances. I keep a map from balance to the first index it appeared, seeded with balance 0 at index −1. When I see a balance I’ve seen before, the stretch since its first appearance is balanced, and I keep the longest. I never overwrite a stored index, because the earliest one gives the longest stretch. O(n) time and space.”',
        followups: [
          { q: 'Why store the first index and not the latest?', a: 'The longest stretch ending at i starts right after the **earliest** index with the same balance. Overwriting with later indices would only find shorter stretches.' },
          { q: 'What changes if the question asks for the number of balanced subarrays?', a: 'Store counts instead of first indices, as in Subarray Sum Equals K: for each position add how many times its balance has appeared before.' },
          { q: 'Does it matter that the seed is at index −1?', a: 'Yes. A balanced stretch that starts at index 0 pairs with “the empty prefix”, which sits at −1, so its length is `i - (-1) = i + 1`. Seeding with index 0 would lose one element.' }
        ]
      }
    ],

    practice: [
      { lc: 1480,
        hints: ['The answer at position i is the sum of everything up to and including i.', 'You don’t need a second pass: each answer is the previous answer plus `nums[i]`.', 'Keep one running total and append it as you go.'],
        solution: { explain: 'The prefix-sum array itself, built in place of the input’s values. O(n) time.', code: {
          py: `class Solution:
    def runningSum(self, nums: List[int]) -> List[int]:
        out, total = [], 0
        for x in nums:
            total += x
            out.append(total)
        return out`,
          js: `function runningSum(nums) {
  const out = [];
  let total = 0;
  for (const x of nums) {
    total += x;
    out.push(total);
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def runningSum(self, nums: List[int]) -> List[int]:\n        ', js: 'function runningSum(nums) {\n  \n}' },
        tests: { fn: 'runningSum', cases: [
          { args: [[1, 2, 3, 4]], out: [1, 3, 6, 10] }, { args: [[1, 1, 1, 1, 1]], out: [1, 2, 3, 4, 5] }, { args: [[3, 1, 2, 10, 1]], out: [3, 4, 6, 16, 17] }, { args: [[-5]], out: [-5] }] } },

      { lc: 303,
        hints: ['Queries come many times on the same array, so don’t re-add inside `sumRange`.', 'Build the prefix array in the constructor, with a leading zero: `prefix[i]` is the sum of the first i elements.', 'The sum of `nums[left..right]` is `prefix[right + 1] - prefix[left]`.'],
        solution: { explain: 'Build the prefix array once, answer each query with one subtraction. O(n) to build, O(1) per query.', code: {
          py: `class NumArray:
    def __init__(self, nums: List[int]):
        self.prefix = [0]
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def sumRange(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]`,
          js: `class NumArray {
  constructor(nums) {
    this.prefix = [0];
    for (const x of nums) this.prefix.push(this.prefix[this.prefix.length - 1] + x);
  }
  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];
  }
}` } },
        starter: { py: 'class NumArray:\n    def __init__(self, nums: List[int]):\n        pass\n\n    def sumRange(self, left: int, right: int) -> int:\n        pass', js: 'class NumArray {\n  constructor(nums) {\n    \n  }\n  sumRange(left, right) {\n    \n  }\n}' },
        tests: { design: true, fn: 'NumArray', cases: [
          { ops: ['NumArray', 'sumRange', 'sumRange', 'sumRange'], args: [[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]], out: [null, 1, -1, -3] },
          { ops: ['NumArray', 'sumRange', 'sumRange'], args: [[[5]], [0, 0], [0, 0]], out: [null, 5, 5] }] } },

      { lc: 724,
        hints: ['At index i, the left sum is everything before i and the right sum is everything after i.', 'You know the total, so the right sum is `total - left - nums[i]`.', 'Walk left to right keeping `left`, and return the first index where the two sides match.'],
        solution: { explain: 'Total once, then a running left sum: the right sum is whatever is left over. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def pivotIndex(self, nums: List[int]) -> int:
        total, left = sum(nums), 0
        for i, x in enumerate(nums):
            if left == total - left - x:
                return i
            left += x
        return -1`,
          js: `function pivotIndex(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    if (left === total - left - nums[i]) return i;
    left += nums[i];
  }
  return -1;
}` } },
        starter: { py: 'class Solution:\n    def pivotIndex(self, nums: List[int]) -> int:\n        ', js: 'function pivotIndex(nums) {\n  \n}' },
        tests: { fn: 'pivotIndex', cases: [
          { args: [[1, 7, 3, 6, 5, 6]], out: 3 }, { args: [[1, 2, 3]], out: -1 }, { args: [[2, 1, -1]], out: 0 }, { args: [[0]], out: 0 }, { args: [[-1, -1, 0, 1, 1, 0]], out: 5 }] } },

      { lc: 2270,
        hints: ['A split after index i makes a left part `nums[0..i]` and a right part `nums[i+1..]`, and both must be non-empty.', 'The right sum is the total minus the left sum.', 'Keep a running left sum for i from 0 to n − 2 and count the splits where `left >= total - left`.'],
        solution: { explain: 'One running left sum against the total. Stop one short of the end so the right part is never empty. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def waysToSplitArray(self, nums: List[int]) -> int:
        total, left, ways = sum(nums), 0, 0
        for i in range(len(nums) - 1):
            left += nums[i]
            if left >= total - left:
                ways += 1
        return ways`,
          js: `function waysToSplitArray(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  let left = 0, ways = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    left += nums[i];
    if (left >= total - left) ways++;
  }
  return ways;
}` } },
        starter: { py: 'class Solution:\n    def waysToSplitArray(self, nums: List[int]) -> int:\n        ', js: 'function waysToSplitArray(nums) {\n  \n}' },
        tests: { fn: 'waysToSplitArray', cases: [
          { args: [[10, 4, -8, 7]], out: 2 }, { args: [[2, 3, 1, 0]], out: 2 }, { args: [[1, 1]], out: 1 }, { args: [[0, 0, 0]], out: 2 }] } },

      { lc: 560,
        hints: ['A window won’t work: the numbers can be negative. Think about prefix sums instead.', 'A subarray ending here sums to k when an earlier prefix equals `running - k`. Count how many such prefixes you’ve seen.', 'Keep a map from prefix sum to count, start it with `{0: 1}`, and look up before you store.'],
        starter: { py: 'class Solution:\n    def subarraySum(self, nums: List[int], k: int) -> int:\n        ', js: 'function subarraySum(nums, k) {\n  \n}' },
        tests: { fn: 'subarraySum', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 1, 1], 2], out: 2 }, { args: [[1, 2, 3], 3], out: 2 }, { args: [[1, -1, 0], 0], out: 3 }, { args: [[3, 4, 7, 2, -3, 1, 4, 2], 7], out: 4 },
          { args: [[5], 5], out: 1 }, { args: [[-1, -1, 1], 0], out: 1 }, { args: [[0, 0, 0], 0], out: 6 }, { args: [[1], 0], out: 0 }, { args: [[-1, -1], -2], out: 1 }] } },

      { lc: 525,
        hints: ['Count a 0 as −1. Then “equal numbers of 0s and 1s” means the stretch sums to zero.', 'A stretch sums to zero when two prefix balances are equal.', 'You want the longest: store the **first** index of each balance and never overwrite it. Seed `{0: -1}`.'],
        starter: { py: 'class Solution:\n    def findMaxLength(self, nums: List[int]) -> int:\n        ', js: 'function findMaxLength(nums) {\n  \n}' },
        tests: { fn: 'findMaxLength', sig: { args: ['int[]'] }, cases: [
          { args: [[0, 1]], out: 2 }, { args: [[0, 1, 0]], out: 2 }, { args: [[0, 0, 1, 0, 0, 0, 1, 1]], out: 6 }, { args: [[1]], out: 0 },
          { args: [[1, 1, 0, 0, 1, 1, 1, 0]], out: 6 }, { args: [[0, 0, 0]], out: 0 }] } },

      { lc: 238,
        hints: ['`answer[i]` is the product of everything to the left of i times everything to the right.', 'Fill the output with the left products in one pass, keeping a running product.', 'Then sweep from the right with a second running product and multiply it into the output. No division needed.'],
        starter: { py: 'class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        ', js: 'function productExceptSelf(nums) {\n  \n}' },
        tests: { fn: 'productExceptSelf', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3, 4]], out: [24, 12, 8, 6] }, { args: [[-1, 1, 0, -3, 3]], out: [0, 0, 9, 0, 0] }, { args: [[2, 3]], out: [3, 2] }, { args: [[0, 0]], out: [0, 0] }, { args: [[5, -2, 1]], out: [-2, 5, -10] }] } },

      { lc: 523,
        hints: ['Two prefix sums with the same remainder mod k bracket a stretch whose sum is a multiple of k.', 'Store the **first** index of each remainder, seeded with `{0: -1}`.', 'The stretch must have at least two elements: accept a repeated remainder only when `i - firstIndex >= 2`, and don’t overwrite the stored index.'],
        solution: { explain: 'Remainders of the running sum, with the first index of each. A repeat at least two positions later means a long-enough stretch that sums to a multiple of k. O(n) time, O(min(n, k)) space.', code: {
          py: `class Solution:
    def checkSubarraySum(self, nums: List[int], k: int) -> bool:
        first = {0: -1}
        running = 0
        for i, x in enumerate(nums):
            running = (running + x) % k
            if running in first:
                if i - first[running] >= 2:
                    return True
            else:
                first[running] = i
        return False`,
          js: `function checkSubarraySum(nums, k) {
  const first = new Map([[0, -1]]);
  let running = 0;
  for (let i = 0; i < nums.length; i++) {
    running = (running + nums[i]) % k;
    if (first.has(running)) {
      if (i - first.get(running) >= 2) return true;
    } else {
      first.set(running, i);
    }
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def checkSubarraySum(self, nums: List[int], k: int) -> bool:\n        ', js: 'function checkSubarraySum(nums, k) {\n  \n}' },
        tests: { fn: 'checkSubarraySum', cases: [
          { args: [[23, 2, 4, 6, 7], 6], out: true }, { args: [[23, 2, 6, 4, 7], 6], out: true }, { args: [[23, 2, 6, 4, 7], 13], out: false }, { args: [[0], 1], out: false },
          { args: [[5, 0, 0], 3], out: true }, { args: [[1, 0], 2], out: false }] } },

      { lc: 974,
        hints: ['Two prefix sums leave the same remainder mod k exactly when the stretch between them is a multiple of k.', 'Count how many earlier prefixes have the same remainder as the current one; seed the map with remainder 0 seen once.', 'A negative running sum can give a negative remainder in some languages. Normalize into 0..k − 1.'],
        solution: { explain: 'Prefix remainders in a count map: each position adds the number of earlier prefixes with the same remainder. O(n) time, O(k) space.', code: {
          py: `class Solution:
    def subarraysDivByK(self, nums: List[int], k: int) -> int:
        seen = {0: 1}
        running = count = 0
        for x in nums:
            running = (running + x) % k
            count += seen.get(running, 0)
            seen[running] = seen.get(running, 0) + 1
        return count`,
          js: `function subarraysDivByK(nums, k) {
  const seen = new Map([[0, 1]]);
  let running = 0, count = 0;
  for (const x of nums) {
    running = (((running + x) % k) + k) % k;
    count += seen.get(running) || 0;
    seen.set(running, (seen.get(running) || 0) + 1);
  }
  return count;
}` } },
        starter: { py: 'class Solution:\n    def subarraysDivByK(self, nums: List[int], k: int) -> int:\n        ', js: 'function subarraysDivByK(nums, k) {\n  \n}' },
        tests: { fn: 'subarraysDivByK', cases: [
          { args: [[4, 5, 0, -2, -3, 1], 5], out: 7 }, { args: [[5], 9], out: 0 }, { args: [[-1, 2, 9], 2], out: 2 }, { args: [[2, -2, 2, -4], 6], out: 2 }, { args: [[0, 0], 3], out: 3 }] } },

      { lc: 930,
        hints: ['The array is all 0s and 1s, but the prefix-sum idea doesn’t care: it’s “subarray sum equals goal”.', 'Count earlier prefixes equal to `running - goal`.', 'Seed the map with `{0: 1}` and look up before you store. A goal of 0 must count runs of zeros.'],
        solution: { explain: 'The Subarray Sum Equals K template with k = goal. (Because every value is non-negative, a sliding window also works here, but the template needs no special handling for zeros.) O(n) time, O(n) space.', code: {
          py: `class Solution:
    def numSubarraysWithSum(self, nums: List[int], goal: int) -> int:
        seen = {0: 1}
        running = count = 0
        for x in nums:
            running += x
            count += seen.get(running - goal, 0)
            seen[running] = seen.get(running, 0) + 1
        return count`,
          js: `function numSubarraysWithSum(nums, goal) {
  const seen = new Map([[0, 1]]);
  let running = 0, count = 0;
  for (const x of nums) {
    running += x;
    count += seen.get(running - goal) || 0;
    seen.set(running, (seen.get(running) || 0) + 1);
  }
  return count;
}` } },
        starter: { py: 'class Solution:\n    def numSubarraysWithSum(self, nums: List[int], goal: int) -> int:\n        ', js: 'function numSubarraysWithSum(nums, goal) {\n  \n}' },
        tests: { fn: 'numSubarraysWithSum', cases: [
          { args: [[1, 0, 1, 0, 1], 2], out: 4 }, { args: [[0, 0, 0, 0, 0], 0], out: 15 }, { args: [[1, 1], 1], out: 2 }, { args: [[0], 0], out: 1 }, { args: [[1, 0, 0, 1], 1], out: 6 }] } },

      { lc: 1248,
        hints: ['Only the parity of each number matters: map odd to 1 and even to 0.', 'Now it’s “count subarrays whose sum is exactly k” on a 0/1 array.', 'Keep a running count of odd numbers and a map of how often each running count has appeared.'],
        solution: { explain: 'Replace each number by its parity, then run the exact-sum template. O(n) time, O(n) space.', code: {
          py: `class Solution:
    def numberOfSubarrays(self, nums: List[int], k: int) -> int:
        seen = {0: 1}
        odds = count = 0
        for x in nums:
            odds += x % 2
            count += seen.get(odds - k, 0)
            seen[odds] = seen.get(odds, 0) + 1
        return count`,
          js: `function numberOfSubarrays(nums, k) {
  const seen = new Map([[0, 1]]);
  let odds = 0, count = 0;
  for (const x of nums) {
    odds += x % 2;
    count += seen.get(odds - k) || 0;
    seen.set(odds, (seen.get(odds) || 0) + 1);
  }
  return count;
}` } },
        starter: { py: 'class Solution:\n    def numberOfSubarrays(self, nums: List[int], k: int) -> int:\n        ', js: 'function numberOfSubarrays(nums, k) {\n  \n}' },
        tests: { fn: 'numberOfSubarrays', cases: [
          { args: [[1, 1, 2, 1, 1], 3], out: 2 }, { args: [[2, 4, 6], 1], out: 0 }, { args: [[2, 2, 2, 1, 2, 2, 1, 2, 2, 2], 2], out: 16 }, { args: [[1], 1], out: 1 }] } },

      { lc: 1094,
        hints: ['Each trip adds passengers at the pick-up and removes them at the drop-off. Passengers who get off at stop `to` free their seats **at** `to`.', 'Record `+n` at `from` and `-n` at `to` in an array indexed by stop (stops go up to 1000).', 'Sweep the stops with a running total; if it ever exceeds the capacity, return false.'],
        solution: { explain: 'A difference array over the stops, then a running sum checked against the capacity. O(n + 1001) time, O(1001) space.', code: {
          py: `class Solution:
    def carPooling(self, trips: List[List[int]], capacity: int) -> bool:
        diff = [0] * 1002
        for people, start, end in trips:
            diff[start] += people
            diff[end] -= people
        riding = 0
        for change in diff:
            riding += change
            if riding > capacity:
                return False
        return True`,
          js: `function carPooling(trips, capacity) {
  const diff = new Array(1002).fill(0);
  for (const [people, start, end] of trips) {
    diff[start] += people;
    diff[end] -= people;
  }
  let riding = 0;
  for (const change of diff) {
    riding += change;
    if (riding > capacity) return false;
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def carPooling(self, trips: List[List[int]], capacity: int) -> bool:\n        ', js: 'function carPooling(trips, capacity) {\n  \n}' },
        tests: { fn: 'carPooling', cases: [
          { args: [[[2, 1, 5], [3, 3, 7]], 4], out: false }, { args: [[[2, 1, 5], [3, 3, 7]], 5], out: true }, { args: [[[3, 2, 7], [3, 7, 9], [8, 3, 9]], 11], out: true },
          { args: [[[1, 0, 1]], 1], out: true }, { args: [[[2, 1, 5], [3, 5, 7]], 3], out: true }] } },

      { lc: 1109,
        hints: ['You read the totals only once, after all bookings: that’s a difference array.', 'For a booking `[first, last, seats]`, add `seats` at `first - 1` and subtract it at `last` (flights are 1-indexed).', 'One running sum over the array gives each flight’s total.'],
        starter: { py: 'class Solution:\n    def corpFlightBookings(self, bookings: List[List[int]], n: int) -> List[int]:\n        ', js: 'function corpFlightBookings(bookings, n) {\n  \n}' },
        tests: { fn: 'corpFlightBookings', sig: { args: ['int[][]', 'int'] }, cases: [
          { args: [[[1, 2, 10], [2, 3, 20], [2, 5, 25]], 5], out: [10, 55, 45, 25, 25] }, { args: [[[1, 2, 10], [2, 2, 15]], 2], out: [10, 25] }, { args: [[[1, 1, 7]], 1], out: [7] }, { args: [[[1, 4, 3], [3, 3, 2]], 4], out: [3, 3, 5, 3] }] } },

      { lc: 304,
        hints: ['Same idea as the 1D version, in two directions: pad the grid with a row and a column of zeros.', 'Build `P[r + 1][c + 1] = cell + P[r][c + 1] + P[r + 1][c] - P[r][c]`.', 'A rectangle is `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`.'],
        solution: { explain: 'A 2D prefix table built once with inclusion–exclusion, then four lookups per query. O(rows × cols) to build, O(1) per query.', code: {
          py: `class NumMatrix:
    def __init__(self, matrix: List[List[int]]):
        rows, cols = len(matrix), len(matrix[0])
        self.P = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(rows):
            for c in range(cols):
                self.P[r + 1][c + 1] = matrix[r][c] + self.P[r][c + 1] + self.P[r + 1][c] - self.P[r][c]

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        P = self.P
        return P[row2 + 1][col2 + 1] - P[row1][col2 + 1] - P[row2 + 1][col1] + P[row1][col1]`,
          js: `class NumMatrix {
  constructor(matrix) {
    const rows = matrix.length, cols = matrix[0].length;
    this.P = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this.P[r + 1][c + 1] = matrix[r][c] + this.P[r][c + 1] + this.P[r + 1][c] - this.P[r][c];
  }
  sumRegion(row1, col1, row2, col2) {
    const P = this.P;
    return P[row2 + 1][col2 + 1] - P[row1][col2 + 1] - P[row2 + 1][col1] + P[row1][col1];
  }
}` } },
        starter: { py: 'class NumMatrix:\n    def __init__(self, matrix: List[List[int]]):\n        pass\n\n    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:\n        pass', js: 'class NumMatrix {\n  constructor(matrix) {\n    \n  }\n  sumRegion(row1, col1, row2, col2) {\n    \n  }\n}' },
        tests: { design: true, fn: 'NumMatrix', cases: [
          { ops: ['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], args: [[[[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]], [2, 1, 4, 3], [1, 1, 2, 2], [1, 2, 2, 4]], out: [null, 8, 11, 12] },
          { ops: ['NumMatrix', 'sumRegion', 'sumRegion'], args: [[[[-1, 2], [3, -4]]], [0, 0, 1, 1], [1, 0, 1, 0]], out: [null, 0, 3] }] } }
    ],

    mistakes: [
      '**No leading zero.** If `prefix` has the same length as `nums`, a range that starts at 0 has no `prefix[l - 1]`. Make it one slot longer, with `prefix[0] = 0`, and the formula `prefix[r + 1] - prefix[l]` covers every range.',
      '**Off-by-one on the end.** With the padded array, the range `nums[l..r]` (both ends included) is `prefix[r + 1] - prefix[l]`. Writing `prefix[r] - prefix[l]` silently drops the last element.',
      '**Forgetting to seed the map with `{0: 1}`.** Without it, every subarray that begins at index 0 goes uncounted. `[3]` with k = 3 returns 0 instead of 1.',
      '**Storing before looking up.** Do the look-up first, then store the current prefix. Reversed, a k of 0 matches the prefix against itself and counts an empty subarray at every position.',
      '**Using a sliding window on negatives.** Shrinking assumes removing elements is the only way to repair a window. With negative numbers that’s false. Use prefix sums and a hash map.',
      '**Difference-array bounds.** The “switch off” is at `r + 1`, so the array needs one spare slot. Mixing 1-indexed inputs with a 0-indexed array (as in flight bookings) moves both writes by one.',
      '**Overflow.** Prefix sums grow. If the values are large (up to 10⁹ with n up to 10⁵, say) the running sum needs a 64-bit type in Java and C++: `long` and `long long`. Python integers don’t overflow.',
      '**Remainders of negative sums.** In Java, JavaScript and C++, `-3 % 5` is `-3`, so a negative running sum never matches its positive remainder. Normalize with `((x % k) + k) % k`.',
      '**Language gotchas.** *Python:* `sum(nums[l:r + 1])` inside a loop copies a slice per query and brings back the O(n) per query you were avoiding. *JavaScript:* `seen.get(x) + 1` is `NaN` for a missing key, so write `(seen.get(x) || 0) + 1`; and a plain object `{}` turns numeric keys into strings, so prefer a `Map`. *Java:* `map.get(key)` returns `null` for a missing key, and unboxing that crashes, so use `getOrDefault`. *C++:* `seen[x]` **inserts** `x` with value 0 when you only meant to read it, so check with `count()` or `find()`.'
    ],

    quiz: [
      { kind: 'complexity', q: 'You build a prefix-sum array once for an array of n numbers, then answer q range-sum queries. What is the total time?',
        choices: ['O(n + q)', 'O(n · q)', 'O(q log n)', 'O(n²)'], answer: 0,
        explain: 'Building is one O(n) pass. Each query is one subtraction, O(1), so q queries cost O(q). Without the prefix array it would be O(n) per query, O(n · q) in all.' },
      { kind: 'concept', q: 'With `prefix[0] = 0` and `prefix[i + 1] = prefix[i] + nums[i]`, what is the sum of `nums[l..r]` (both ends included)?',
        choices: ['`prefix[r + 1] - prefix[l]`', '`prefix[r] - prefix[l]`', '`prefix[r] - prefix[l - 1]`', '`prefix[r + 1] - prefix[l + 1]`'], answer: 0,
        explain: '`prefix[r + 1]` is the total of elements 0 through r, and `prefix[l]` is the total of elements 0 through l − 1. Their difference is exactly `nums[l..r]`. The other forms drop or add one element.' },
      { kind: 'pattern', q: 'Which problem is a good fit for prefix sums with a hash map, and **not** for a sliding window?',
        choices: ['Count the subarrays whose sum is exactly k, in an array that has negative numbers', 'The longest substring without a repeated character', 'The shortest subarray with a sum of at least a target, all numbers positive', 'The maximum of every window of size k'], answer: 0,
        explain: 'A sum rule over negative numbers isn’t monotonic, so a window can’t decide which edge to move. The other three are classic window shapes (a no-repeat window, a shortest window over positives, and a fixed window).' },
      { kind: 'pattern', q: 'Which of these signal a prefix-sum approach? Pick every one that applies.',
        choices: ['Many range-sum queries on an array that doesn’t change', 'You need exact-sum subarrays and the numbers can be negative', 'Many “add v to a range” updates, with the final array read once', 'You need the largest element in each window'], answer: [0, 1, 2],
        explain: 'Static range queries, exact sums with negatives, and batched range updates (a difference array) are the three. The maximum of each window needs a monotonic deque, not sums.' },
      { kind: 'bug', q: 'This counts the subarrays that sum to k, but `count_subarrays([3], 3)` returns 0 instead of 1. What’s the bug?',
        code: `def count_subarrays(nums, k):
    seen = {}
    running = count = 0
    for x in nums:
        running += x
        count += seen.get(running - k, 0)
        seen[running] = seen.get(running, 0) + 1
    return count`,
        choices: ['`seen` should start as `{0: 1}`, so a subarray that begins at index 0 can match the empty prefix', 'The look-up should come after the store', '`count` should be updated with `seen[running]`', '`seen` should be a list'], answer: 0,
        explain: 'For `[3]` with k = 3, the running sum 3 needs an earlier prefix of 0, the empty prefix. With an empty map it never finds one. Seeding the map with `{0: 1}` fixes it. Moving the look-up after the store would make k = 0 count empty subarrays.' },
      { kind: 'concept', q: 'In a difference array, to add v to every element from index l to r, you…',
        choices: ['Add v at `diff[l]` and subtract v at `diff[r + 1]`, then take a running sum at the end', 'Add v to every `diff[i]` from l to r', 'Add v at `diff[r]` only', 'Rebuild a prefix array after every update'], answer: 0,
        explain: 'The +v starts the extra amount at l, and the −v at r + 1 cancels it. The running sum over `diff` then adds v exactly to positions l through r. Each update costs O(1).' },
      { kind: 'concept', q: 'For “the longest subarray with equal numbers of 0s and 1s”, what do you store in the map for each running balance?',
        choices: ['The first index where that balance appeared', 'The latest index where that balance appeared', 'How many times it appeared', 'The sum of the indices where it appeared'], answer: 0,
        explain: 'The longest stretch ending at i starts right after the earliest index with the same balance, so you keep the first sighting and never overwrite it. Counts are for “how many subarrays”.' },
      { kind: 'complexity', q: 'What does the 2D prefix-sum table cost for an r × c grid, and what does each rectangle query cost?',
        choices: ['O(r · c) to build, O(1) per query', 'O(r · c) to build, O(r + c) per query', 'O(1) to build, O(r · c) per query', 'O((r · c)²) to build, O(1) per query'], answer: 0,
        explain: 'Each table cell is filled from three neighbours in O(1), so building is O(r · c). A rectangle is four lookups, O(1).' },
      { kind: 'concept', q: 'In Java, what does `-3 % 5` evaluate to, and why does it matter for “subarray sums divisible by k”?',
        choices: ['−3: a negative running sum gives a negative remainder, so normalize with `((x % k) + k) % k`', '2: Java’s % is always non-negative', '−2: it rounds toward zero', '3: it takes the absolute value first'], answer: 0,
        explain: 'In Java, JavaScript and C++, the remainder takes the sign of the left operand. Equal remainders must have the same value to match in a map, so a negative −3 and a positive 2 (which differ by 5) would never meet. Normalizing puts both at 2.' }
    ],

    flashcards: [
      { id: 'range-formula', front: 'Prefix sums: with `prefix[0] = 0`, what is the sum of `nums[l..r]`?', back: '`prefix[r + 1] - prefix[l]`. The array is one slot longer than `nums`, and `prefix[i]` is the sum of the first i elements.' },
      { id: 'leading-zero', front: 'Why does the prefix array start with an extra 0?', back: 'So a range that starts at index 0 uses the same formula as every other range. Without it you need a special case, the usual source of off-by-one bugs.' },
      { id: 'subarray-k', front: 'Subarray Sum Equals K: what do you look up at each position?', back: 'How many earlier prefix sums equal `running - k`. Store counts in a hash map, seed it with `{0: 1}`, and look up before you store.' },
      { id: 'why-seed', front: 'Why seed the hash map with `{0: 1}`?', back: 'It stands for the empty prefix, so subarrays that start at index 0 can match. Without it, `[3]` with k = 3 gives 0.' },
      { id: 'lookup-first', front: 'Prefix sums with a hash map: look up first or store first?', back: 'Look up first, then store. Storing first lets a prefix match itself, which counts an empty subarray when k = 0.' },
      { id: 'negatives', front: 'Why prefix sums and not a sliding window for “sum equals k” with negatives?', back: 'A window needs the sum to move one way as it grows. With negatives it doesn’t, so you can’t tell which edge to move. Prefix sums just count matches.' },
      { id: 'first-index', front: 'Longest subarray with a given prefix property: first index or latest?', back: 'The first index. The longest stretch ending here starts after the earliest matching prefix, so never overwrite a stored index.' },
      { id: 'balance', front: 'Equal numbers of 0s and 1s: how do you reduce it to a prefix sum?', back: 'Count a 0 as −1 and a 1 as +1. A balanced stretch sums to 0, so two equal running balances bracket it. Seed `{0: -1}` for the longest version.' },
      { id: 'difference', front: 'Difference array: how do you add v to `[l, r]`?', back: '`diff[l] += v` and `diff[r + 1] -= v`. A running sum over `diff` at the end rebuilds the array. Each update is O(1).' },
      { id: '2d-rect', front: '2D prefix sums: how do you get the rectangle (r1, c1) to (r2, c2)?', back: '`P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`: the whole block, minus the strip above, minus the strip to the left, plus the corner removed twice.' },
      { id: 'divisible', front: 'Subarrays with a sum divisible by k: what do you store?', back: 'The running sum mod k. Equal remainders bracket a stretch that’s a multiple of k. Normalize negative remainders: `((x % k) + k) % k`.' },
      { id: 'product-except-self', front: 'Product of Array Except Self without division: what’s the trick?', back: 'Left product times right product. One pass writes the prefix products into the output, a second pass from the right multiplies in a running suffix product.' }
    ],

    deeper: [
      { title: 'Prefix Sum Explainer', url: 'https://cp-algorithms.com/algebra/prefix-sums.html', time: 'about 15 min', note: 'The prefix-sum link in DSA-Kit’s resource list. If the page has moved, search the site for “prefix sum”.' },
      { title: 'Prefix Sum problems (LeetCode tag)', url: 'https://leetcode.com/tag/prefix-sum/', time: 'reference', note: 'Every problem LeetCode tags as prefix sum, which you can sort by difficulty. Good for extra reps once this page feels easy.' },
      { title: 'LeetCode Patterns (Sean Prashad)', url: 'https://seanprashad.com/leetcode-patterns/', time: 'reference', note: 'A filterable problem list. Filter by the pattern you want to practice beyond this page.' }
    ],

    detective: [
      { id: 'trail-gain', decoys: ['sliding-window', 'segment-tree', 'kadane'],
        statement: 'A hiking app stores the elevation gain of every 100-metre stretch of a trail, from the trailhead to the summit. Hikers tap two markers on the trail and the app instantly shows the total gain between them. The trail data never changes, but thousands of hikers ask thousands of questions a day. How would you answer each question fast?',
        why: 'The data is fixed and the questions are many ranges of it, so precompute running totals once. Each answer is the total at one marker minus the total at the other: O(1) per query. A segment tree is for data that changes, and a window is for one range at a time.' },
      { id: 'even-days', decoys: ['sliding-window', 'kadane', 'two-pointers'],
        statement: 'A budgeting app logs, for each day, how much a person’s balance went up (a positive number) or down (a negative one). The app wants to count every run of consecutive days after which the balance ended up exactly where it started, so the changes in that run add to zero. Given the daily changes, return how many such runs there are.',
        why: 'Contiguous runs, an exact total, and values that go both up and down: a window can’t decide which edge to move, and the rule is “two running totals are equal”. Keep a count of each running total seen so far, and for each day add how often the current total has appeared before.' },
      { id: 'chairs', decoys: ['intervals', 'segment-tree', 'fenwick'],
        statement: 'A venue has rooms 1 to n in a row. Staff submit thousands of requests of the form “put c extra chairs in every room from room a to room b”, and nobody reads the chair counts until all the requests are in. Then the manager wants the final number of chairs in every room.',
        why: 'Many range updates, then one read of the whole array. Write +c at the start of each range and −c just after its end, and a single running sum rebuilds all the counts: a difference array. A Fenwick or segment tree would only be needed if reads were mixed in between.' },
      { id: 'coin-log', decoys: ['sliding-window', 'kadane', 'two-pointers'],
        statement: 'A game records a long sequence of coin flips, each heads or tails. The designers want the longest stretch of consecutive flips in which the number of heads equals the number of tails. Return its length.',
        why: 'Count heads as +1 and tails as −1, so “equal numbers” means the stretch adds to zero, which means two equal running balances. Remember the first index of each balance: the earliest match gives the longest stretch. A window can’t grow or shrink on a rule like that.' },
      { id: 'rainfall', decoys: ['matrix', 'arrays-hashing', 'fenwick'],
        statement: 'A weather service keeps a grid of rainfall readings, one number per square kilometre. Analysts draw rectangles on the map all day and want the total rainfall inside each one immediately. The readings are fixed once the grid is published.',
        why: 'A fixed grid and many rectangle totals: store, for each cell, the total of the block from the top-left corner to that cell, and any rectangle is four lookups with inclusion–exclusion. That’s a 2D prefix sum. It would not fit if the readings kept changing.' }
    ]
  });
})();
