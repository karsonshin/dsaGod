/* Offer Ready: Bitmask DP. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'bitmask-dp',

    hook: 'When a problem has **at most about 20 items** and asks you to use each at most once in some clever order (visit every city, hand out every job, split into equal groups, play a game with numbers that get used up), the item count is a signal. 2²⁰ is about a million, so a table with **one entry per subset** fits. One integer whose bits say “used or not” is the key to that table. It is a niche topic, rarely the main course, but when it appears (Shortest Path Visiting All Nodes, Partition to K Equal Sum Subsets, Beautiful Arrangement, Can I Win) it is usually a Medium or Hard that nothing else solves cleanly.',

    cues: [
      'The input is **small and the bound is stated**: `n <= 12`, `n <= 16`, `n <= 20`. Constraints that small are a gift: they allow 2ⁿ states.',
      'You must **visit, assign or use every item exactly once**, and the order or pairing matters: tours, one-job-per-worker, permutations with a rule.',
      'The brute force is a **permutation search**: n! orderings. But what you need to know about a partial answer is only **which items are used** (plus maybe the last one), not the order they were used in.',
      'You are splitting a set into groups: `k` equal sums, two teams, the best way to cover everything with a few pieces.',
      'A **game** where numbers or cards get used up and the state is “what is left”.',
      'A graph question that says “visit **all** nodes” with a handful of nodes: the BFS state needs the set of nodes already seen.'
    ],

    intuition: [
      'Think of a bag of 12 numbered tokens. At any moment each token is either **in the bag** or **out**. That is 12 yes/no answers, which fits in a 12-bit integer. The integer `0b000000001101` means tokens 0, 2 and 3 are out. A **bitmask** is just a set, written as a number, and there are 2ⁿ of them, so we can use the number directly as an array index.',
      'Why this helps: brute force on “visit everything in some order” tries n! orders. But two different orders that visit the same cities and end in the same city leave the same future. All that matters is **the set visited (and the current position)**. There are far fewer sets than orders: 2ⁿ against n!. For n = 16, that is 65 thousand against 20 trillion. So define `dp[mask]` = the best result for the situation where exactly the items in `mask` have been used, and build bigger masks from smaller ones.',
      'The order of work is the trick. Adding an item **sets a bit**, so the new mask is **numerically larger** than the old one: `mask | (1 << j) > mask`. Loop `mask` from 0 up to `2ⁿ - 1` and, by the time you reach a mask, every mask that can lead to it has already been visited and pushed its value in. No recursion and no explicit ordering needed. In the visualizer the tiles fill left to right, each one pushing its value into larger neighbours that differ by one bit.',
      'Three small variants cover the whole topic. **`dp[mask]`** alone, when the mask is enough to know what happens next (assigning jobs to workers: the next worker is `popcount(mask)`). **`dp[mask][last]`**, when the position matters too (travelling salesman: which city you stand in). And **BFS over `(node, mask)`** when the question is shortest rather than cheapest, so the transitions are unweighted steps.',
      'Precisely: state = a subset (plus maybe the last element), transition = add one element not yet in the subset, answer = the full mask, base case = the empty mask. Time is `O(2ⁿ · n)` for one pass over “add one element”, space is `O(2ⁿ)` (times `n` if you keep the last element). The cost is exponential, but the constraint was small on purpose.'
    ].join('\n\n'),

    viz: 'bitmask',

    template: {
      title: 'Bitmask DP: dp[mask] over used items, add one item at a time',
      note: 'To reuse it, change three things and keep the skeleton: **what `dp[mask]` means** (cheapest cost, a count, a boolean, a game result), **how the next item is chosen** (here the worker is `popcount(mask)`, in a tour it is the position you add), and **what combines** in the `@relax` line (`min` with `+ cost`, `+=` for counting, `or` for reachability). The loops, the `mask | (1 << j)` step and the answer at the full mask `(1 << n) - 1` stay. Python has `int.bit_count()` in 3.10+, but `bin(mask).count("1")` works everywhere.',
      code: {
        py: `def min_assign(cost):
    n = len(cost)
    INF = 10 ** 9
    dp = [INF] * (1 << n)                           #> dp[mask] = cheapest way to give the first popcount(mask) workers exactly the jobs in mask
    dp[0] = 0                                       #@init > 1. Nobody has a job yet: cost 0
    for mask in range(1 << n):                      #@mask > 2. Masks in increasing order: every smaller mask is already final
        if dp[mask] == INF:
            continue
        w = bin(mask).count("1")                    #> the next worker is the one after those who already have jobs
        for j in range(n):                          #@pick > 3. Try every job not yet taken
            if mask >> j & 1:
                continue                            #> test bit j: skip jobs already in mask
            nxt = mask | (1 << j)                   #> set bit j: add the job
            dp[nxt] = min(dp[nxt], dp[mask] + cost[w][j])   #@relax > 4. Keep the cheaper way to reach the bigger mask
    return dp[(1 << n) - 1]                         #@done > 5. Full mask: every job taken`,
        js: `function minAssign(cost) {
  const n = cost.length, INF = 1e9;
  const dp = new Array(1 << n).fill(INF);                     //> dp[mask] = cheapest way to give the first popcount(mask) workers exactly the jobs in mask
  dp[0] = 0;                                                  //@init > 1. Nobody has a job yet: cost 0
  for (let mask = 0; mask < (1 << n); mask++) {               //@mask > 2. Masks in increasing order: every smaller mask is already final
    if (dp[mask] === INF) continue;
    let w = 0;                                                //> the next worker is the one after those who already have jobs
    for (let m = mask; m; m &= m - 1) w++;
    for (let j = 0; j < n; j++) {                             //@pick > 3. Try every job not yet taken
      if ((mask >> j) & 1) continue;                          //> test bit j: skip jobs already in mask
      const nxt = mask | (1 << j);                            //> set bit j: add the job
      dp[nxt] = Math.min(dp[nxt], dp[mask] + cost[w][j]);     //@relax > 4. Keep the cheaper way to reach the bigger mask
    }
  }
  return dp[(1 << n) - 1];                                    //@done > 5. Full mask: every job taken
}`,
        java: `class Solution {
    public int minAssign(int[][] cost) {
        int n = cost.length, INF = 1_000_000_000;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, INF);                                 //> dp[mask] = cheapest way to give the first popcount(mask) workers exactly the jobs in mask
        dp[0] = 0;                                            //@init > 1. Nobody has a job yet: cost 0
        for (int mask = 0; mask < (1 << n); mask++) {         //@mask > 2. Masks in increasing order: every smaller mask is already final
            if (dp[mask] == INF) continue;
            int w = Integer.bitCount(mask);                   //> the next worker is the one after those who already have jobs
            for (int j = 0; j < n; j++) {                     //@pick > 3. Try every job not yet taken
                if (((mask >> j) & 1) != 0) continue;         //> test bit j: skip jobs already in mask
                int nxt = mask | (1 << j);                    //> set bit j: add the job
                dp[nxt] = Math.min(dp[nxt], dp[mask] + cost[w][j]);   //@relax > 4. Keep the cheaper way to reach the bigger mask
            }
        }
        return dp[(1 << n) - 1];                              //@done > 5. Full mask: every job taken
    }
}`,
        cpp: `class Solution {
public:
    int minAssign(vector<vector<int>> cost) {
        int n = cost.size(), INF = 1000000000;
        vector<int> dp(1 << n, INF);                          //> dp[mask] = cheapest way to give the first popcount(mask) workers exactly the jobs in mask
        dp[0] = 0;                                            //@init > 1. Nobody has a job yet: cost 0
        for (int mask = 0; mask < (1 << n); mask++) {         //@mask > 2. Masks in increasing order: every smaller mask is already final
            if (dp[mask] == INF) continue;
            int w = __builtin_popcount(mask);                 //> the next worker is the one after those who already have jobs
            for (int j = 0; j < n; j++) {                     //@pick > 3. Try every job not yet taken
                if ((mask >> j) & 1) continue;                //> test bit j: skip jobs already in mask
                int nxt = mask | (1 << j);                    //> set bit j: add the job
                dp[nxt] = min(dp[nxt], dp[mask] + cost[w][j]);   //@relax > 4. Keep the cheaper way to reach the bigger mask
            }
        }
        return dp[(1 << n) - 1];                              //@done > 5. Full mask: every job taken
    }
};`
      },
      tests: { fn: { py: 'min_assign', default: 'minAssign' }, sig: { args: ['int[][]'] }, cases: [
        { args: [[[1, 2, 9], [1, 9, 9], [9, 9, 1]]], out: 4 }, { args: [[[5]]], out: 5 }, { args: [[[4, 1, 3], [2, 0, 5], [3, 2, 2]]], out: 5 },
        { args: [[[9, 2, 7, 8], [6, 4, 3, 7], [5, 8, 1, 8], [7, 6, 9, 4]]], out: 13 },
        { args: [[[7, 3, 8, 6, 5], [4, 9, 2, 7, 6], [8, 5, 6, 3, 9], [3, 7, 4, 8, 2], [6, 2, 9, 5, 4]]], out: 15 }, { args: [[[0, 0], [0, 0]]], out: 0 }, { args: [[[3, 1], [1, 3]]], out: 2 }] }
    },

    complexity: {
      time: 'O(2ⁿ · n)',
      space: 'O(2ⁿ)',
      why: 'There are 2ⁿ masks and each one tries to add at most n items, one O(1) update each. With `dp[mask][last]` (travelling salesman) the table has 2ⁿ · n cells and each transition tries n next cities, so time is **O(2ⁿ · n²)** and space **O(2ⁿ · n)**. Compare with the n! orderings (or nⁿ labelled assignments) that the table replaces. Enumerating **all submasks of every mask** is a different cost: **O(3ⁿ)**, since each item is in the mask, in the submask, or out.',
      trap: '**Memory, not time, is usually what breaks first.** At n = 20 a table of 2²⁰ ints is 4 MB, fine. But `dp[mask][last]` at n = 20 is 20 million cells (80 MB as int, 20 MB as one-byte values), and at n = 24 a plain array of 16 million ints is already 64 MB. If you only need the previous layer, or only the full-mask answer, say so: interviewers like to hear that you know the table, not the n, is the limit.'
    },

    variations: [
      {
        name: 'The bit toolbox: test, set, clear, toggle, count, lowest bit',
        body: 'Six one-liners do all the work. **Test** bit `j`: `(mask >> j) & 1`. **Add** an item: `mask | (1 << j)`. **Remove** it: `mask & ~(1 << j)`. **Toggle**: `mask ^ (1 << j)`. **Count** items: popcount (`bin(mask).count("1")`, `Integer.bitCount`, `__builtin_popcount`). **Lowest set bit**: `mask & -mask`, and `mask & (mask - 1)` drops it, which gives the loop `while m: low = m & -m; ...; m &= m - 1` that visits only the set bits. The full set of `n` items is `(1 << n) - 1`. Mind operator precedence in Java, JavaScript and C++: comparisons bind tighter than `&`, so `mask & bit == 0` is a bug. Write `(mask & bit) == 0`, and parenthesize every shift expression you are unsure about.',
        code: {
          py: `def bit_toolbox(mask, j):
    has = mask >> j & 1            # is item j in the set?
    added = mask | (1 << j)        # put j in
    removed = mask & ~(1 << j)     # take j out
    toggled = mask ^ (1 << j)      # flip j
    count = bin(mask).count("1")   # how many items
    low = mask & -mask             # lowest set bit, as a value
    return [has, added, removed, toggled, count, low]`,
          js: `function bitToolbox(mask, j) {
  const has = (mask >> j) & 1;           // is item j in the set?
  const added = mask | (1 << j);         // put j in
  const removed = mask & ~(1 << j);      // take j out
  const toggled = mask ^ (1 << j);       // flip j
  let count = 0;
  for (let m = mask; m; m &= m - 1) count++;   // each step drops the lowest set bit
  const low = mask & -mask;              // lowest set bit, as a value
  return [has, added, removed, toggled, count, low];
}`,
          java: `class Solution {
    public int[] bitToolbox(int mask, int j) {
        int has = (mask >> j) & 1;           // is item j in the set?
        int added = mask | (1 << j);         // put j in
        int removed = mask & ~(1 << j);      // take j out
        int toggled = mask ^ (1 << j);       // flip j
        int count = Integer.bitCount(mask);  // how many items
        int low = mask & -mask;              // lowest set bit, as a value
        return new int[]{has, added, removed, toggled, count, low};
    }
}`,
          cpp: `class Solution {
public:
    vector<int> bitToolbox(int mask, int j) {
        int has = (mask >> j) & 1;           // is item j in the set?
        int added = mask | (1 << j);         // put j in
        int removed = mask & ~(1 << j);      // take j out
        int toggled = mask ^ (1 << j);       // flip j
        int count = __builtin_popcount(mask);   // how many items
        int low = mask & -mask;              // lowest set bit, as a value
        return {has, added, removed, toggled, count, low};
    }
};`
        },
        tests: { fn: { py: 'bit_toolbox', default: 'bitToolbox' }, sig: { args: ['int', 'int'] }, cases: [
          { args: [12, 2], out: [1, 12, 8, 8, 2, 4] }, { args: [12, 0], out: [0, 13, 12, 13, 2, 4] }, { args: [0, 3], out: [0, 8, 0, 8, 0, 0] },
          { args: [10, 1], out: [1, 10, 8, 8, 2, 2] }, { args: [7, 5], out: [0, 39, 7, 39, 3, 1] }] }
      },
      {
        name: 'Travelling salesman: dp[mask][last]',
        body: 'When the cost of the next step depends on **where you stand**, the mask is not enough: add the last item. `dp[mask][last]` is the cheapest way to have visited exactly the cities in `mask` and be standing at `last` (which must be in `mask`). Start with `dp[{0}][0] = 0`, extend to every unvisited city, and finish by adding the way home. This is the classic **Held–Karp** algorithm: **O(2ⁿ · n²)** time against n! for brute force, and **O(2ⁿ · n)** memory. For the open-path version (no return trip, any start) initialise `dp[1 << i][i] = 0` for every `i` and take the minimum over `last` at the full mask. It is exactly the shape that Shortest Path Visiting All Nodes uses, with BFS instead of costs.',
        code: {
          py: `def tsp(dist):
    n = len(dist)
    INF = 10 ** 9
    dp = [[INF] * n for _ in range(1 << n)]   # dp[mask][last]
    dp[1][0] = 0                              # start at city 0, only city 0 visited
    for mask in range(1 << n):
        for last in range(n):
            if dp[mask][last] == INF:
                continue                      # unreachable, or last not in mask
            for nxt in range(n):
                if mask >> nxt & 1:
                    continue
                nm = mask | (1 << nxt)
                dp[nm][nxt] = min(dp[nm][nxt], dp[mask][last] + dist[last][nxt])
    full = (1 << n) - 1
    return min(dp[full][last] + dist[last][0] for last in range(n))   # and go home`,
          js: `function tsp(dist) {
  const n = dist.length, INF = 1e9;
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));   // dp[mask][last]
  dp[1][0] = 0;                               // start at city 0, only city 0 visited
  for (let mask = 0; mask < (1 << n); mask++) {
    for (let last = 0; last < n; last++) {
      if (dp[mask][last] === INF) continue;   // unreachable, or last not in mask
      for (let nxt = 0; nxt < n; nxt++) {
        if ((mask >> nxt) & 1) continue;
        const nm = mask | (1 << nxt);
        dp[nm][nxt] = Math.min(dp[nm][nxt], dp[mask][last] + dist[last][nxt]);
      }
    }
  }
  const full = (1 << n) - 1;
  let best = INF * 2;
  for (let last = 0; last < n; last++) best = Math.min(best, dp[full][last] + dist[last][0]);   // and go home
  return best;
}`,
          java: `class Solution {
    public int tsp(int[][] dist) {
        int n = dist.length, INF = 1_000_000_000;
        int[][] dp = new int[1 << n][n];            // dp[mask][last]
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[1][0] = 0;                               // start at city 0, only city 0 visited
        for (int mask = 0; mask < (1 << n); mask++) {
            for (int last = 0; last < n; last++) {
                if (dp[mask][last] == INF) continue;   // unreachable, or last not in mask
                for (int nxt = 0; nxt < n; nxt++) {
                    if (((mask >> nxt) & 1) != 0) continue;
                    int nm = mask | (1 << nxt);
                    dp[nm][nxt] = Math.min(dp[nm][nxt], dp[mask][last] + dist[last][nxt]);
                }
            }
        }
        int full = (1 << n) - 1, best = Integer.MAX_VALUE;
        for (int last = 0; last < n; last++) {
            if (dp[full][last] < INF) best = Math.min(best, dp[full][last] + dist[last][0]);   // and go home
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int tsp(vector<vector<int>> dist) {
        int n = dist.size(), INF = 1000000000;
        vector<vector<int>> dp(1 << n, vector<int>(n, INF));   // dp[mask][last]
        dp[1][0] = 0;                               // start at city 0, only city 0 visited
        for (int mask = 0; mask < (1 << n); mask++) {
            for (int last = 0; last < n; last++) {
                if (dp[mask][last] == INF) continue;   // unreachable, or last not in mask
                for (int nxt = 0; nxt < n; nxt++) {
                    if ((mask >> nxt) & 1) continue;
                    int nm = mask | (1 << nxt);
                    dp[nm][nxt] = min(dp[nm][nxt], dp[mask][last] + dist[last][nxt]);
                }
            }
        }
        int full = (1 << n) - 1, best = INT_MAX;
        for (int last = 0; last < n; last++) {
            if (dp[full][last] < INF) best = min(best, dp[full][last] + dist[last][0]);   // and go home
        }
        return best;
    }
};`
        },
        tests: { fn: 'tsp', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]], out: 80 }, { args: [[[0, 1, 5], [1, 0, 2], [5, 2, 0]]], out: 8 },
          { args: [[[0, 2, 9, 10, 7], [2, 0, 6, 4, 3], [9, 6, 0, 8, 5], [10, 4, 8, 0, 6], [7, 3, 5, 6, 0]]], out: 26 }, { args: [[[0]]], out: 0 }, { args: [[[0, 4], [4, 0]]], out: 8 }] }
      },
      {
        name: 'Submask enumeration: fewest trips, O(3ⁿ)',
        body: 'Sometimes a state is built from a **whole subset**, not one item: the cheapest way to cover `mask` is some group `sub` (a submask of it) plus the cheapest way to cover what is left. The loop `sub = mask; while sub: ...; sub = (sub - 1) & mask` visits every non-empty submask of `mask`, and it is worth memorising. Every item is in `sub`, in `mask` but not `sub`, or outside `mask`, so across all masks that is **3ⁿ** steps (n = 15 is 14 million, n = 20 is 3.5 billion: too slow). Here: carry items of given weights in trips of capacity `cap`, fewest trips (each item fits alone). Precompute `total[mask]` in O(2ⁿ) by peeling the lowest bit. A common speed-up: only try submasks that contain the lowest set bit of `mask`, since some trip must carry that item.',
        code: {
          py: `def min_trips(weights, cap):
    n = len(weights)
    total = [0] * (1 << n)
    for mask in range(1, 1 << n):             # total weight of every subset
        low = (mask & -mask).bit_length() - 1
        total[mask] = total[mask & (mask - 1)] + weights[low]
    INF = 10 ** 9
    dp = [INF] * (1 << n)                     # dp[mask] = fewest trips to carry exactly mask
    dp[0] = 0
    for mask in range(1, 1 << n):
        sub = mask
        while sub:                            # every non-empty submask of mask
            if total[sub] <= cap:
                dp[mask] = min(dp[mask], dp[mask ^ sub] + 1)
            sub = (sub - 1) & mask
    return dp[(1 << n) - 1]`,
          js: `function minTrips(weights, cap) {
  const n = weights.length;
  const total = new Array(1 << n).fill(0);
  for (let mask = 1; mask < (1 << n); mask++) {          // total weight of every subset
    const low = 31 - Math.clz32(mask & -mask);
    total[mask] = total[mask & (mask - 1)] + weights[low];
  }
  const INF = 1e9;
  const dp = new Array(1 << n).fill(INF);                // dp[mask] = fewest trips to carry exactly mask
  dp[0] = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    for (let sub = mask; sub; sub = (sub - 1) & mask) {  // every non-empty submask of mask
      if (total[sub] <= cap) dp[mask] = Math.min(dp[mask], dp[mask ^ sub] + 1);
    }
  }
  return dp[(1 << n) - 1];
}`,
          java: `class Solution {
    public int minTrips(int[] weights, int cap) {
        int n = weights.length;
        int[] total = new int[1 << n];
        for (int mask = 1; mask < (1 << n); mask++) {           // total weight of every subset
            int low = Integer.numberOfTrailingZeros(mask);
            total[mask] = total[mask & (mask - 1)] + weights[low];
        }
        int INF = 1_000_000_000;
        int[] dp = new int[1 << n];                             // dp[mask] = fewest trips to carry exactly mask
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int mask = 1; mask < (1 << n); mask++) {
            for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {   // every non-empty submask of mask
                if (total[sub] <= cap) dp[mask] = Math.min(dp[mask], dp[mask ^ sub] + 1);
            }
        }
        return dp[(1 << n) - 1];
    }
}`,
          cpp: `class Solution {
public:
    int minTrips(vector<int> weights, int cap) {
        int n = weights.size();
        vector<int> total(1 << n, 0);
        for (int mask = 1; mask < (1 << n); mask++) {           // total weight of every subset
            int low = __builtin_ctz(mask);
            total[mask] = total[mask & (mask - 1)] + weights[low];
        }
        int INF = 1000000000;
        vector<int> dp(1 << n, INF);                            // dp[mask] = fewest trips to carry exactly mask
        dp[0] = 0;
        for (int mask = 1; mask < (1 << n); mask++) {
            for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {   // every non-empty submask of mask
                if (total[sub] <= cap) dp[mask] = min(dp[mask], dp[mask ^ sub] + 1);
            }
        }
        return dp[(1 << n) - 1];
    }
};`
        },
        tests: { fn: { py: 'min_trips', default: 'minTrips' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 5, 3, 4], 6], out: 3 }, { args: [[3, 1, 4, 2, 2], 5], out: 3 }, { args: [[7], 10], out: 1 }, { args: [[5, 5, 5, 5], 10], out: 2 },
          { args: [[1, 1, 1, 1, 1, 1], 3], out: 2 }, { args: [[4, 4, 4], 7], out: 3 }, { args: [[2, 3, 4, 5, 6, 7, 8], 10], out: 4 }, { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 11], out: 5 }] }
      },
      {
        name: 'Push or pull, and the memory squeeze',
        body: 'The template **pushes**: from a finished mask it updates larger masks. The same table can **pull**: `dp[mask] = min over j in mask of dp[mask ^ (1 << j)] + cost[popcount(mask) - 1][j]`, which reads smaller masks and writes only itself. Both visit masks in increasing order and give identical answers. Pull is the shape of the top-down version (a recursion with `memo[mask]`), which is the better choice for games like Can I Win, where many masks are never reached. Memory squeezes that are realistic: one-byte or two-byte values where the answer is small, `dp[mask][last]` stored as a flat array, or only the reachable states kept in a hash map. If `n` is larger (say 30 to 40), look for **meet in the middle** instead: enumerate the 2^(n/2) subsets of each half and combine them.'
      }
    ],
    worked: [
      {
        lc: 698,
        restate: 'You get a list of positive integers and a number `k`. Decide whether you can put every number into exactly one of `k` groups so that all `k` groups have the same total.',
        examples: '- `[4, 3, 2, 3, 5, 2, 1]`, `k = 4` → true: groups `[5]`, `[1, 4]`, `[2, 3]`, `[2, 3]`, each summing to 5.\n- `[1, 2, 3, 4]`, `k = 3` → false: the total 10 does not split into 3 equal parts.\n- `[2, 2, 2, 2, 3, 4, 5]`, `k = 4` → false: the total 20 gives a target of 5, but the 4 cannot be completed without a 1.\n- `k = 1` is always true.',
        brute: 'Place each number into one of the `k` groups, backtracking: up to `k^n` ways, and with `n = 16`, `k = 8` that is hopeless. Pruning (sort descending, skip groups with equal fill) helps a lot in practice but is not a guarantee, and the same set of placed numbers keeps getting rebuilt in different orders.',
        insight: 'The total must be divisible by `k`, and each group must hit `target = total / k`. Now fill the groups **one at a time**. After you have placed the numbers in `mask`, how full is the group you are currently working on? Exactly `sum(mask) % target`, because all the earlier groups are full. So the only thing you need to remember about the past is **which numbers are placed**. Let `dp[mask]` be that current fill, or `-1` if the set cannot be arranged into complete groups plus a partial one. Adding number `i` is legal when `dp[mask] + nums[i] <= target`, and the new fill wraps to 0 when the group closes exactly. If `dp[full] == 0`, every group is closed. Masks are visited in increasing order, as in the template.',
        code: {
          py: `class Solution:
    def canPartitionKSubsets(self, nums: List[int], k: int) -> bool:
        total = sum(nums)
        if total % k:
            return False
        target = total // k
        n = len(nums)
        dp = [-1] * (1 << n)                 # dp[mask] = fill of the group being built, -1 if impossible
        dp[0] = 0
        for mask in range(1 << n):
            if dp[mask] < 0:
                continue
            for i in range(n):
                if mask >> i & 1 or dp[mask] + nums[i] > target:
                    continue                 # already placed, or would overflow the group
                dp[mask | (1 << i)] = (dp[mask] + nums[i]) % target
        return dp[(1 << n) - 1] == 0`,
          js: `function canPartitionKSubsets(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % k) return false;
  const target = total / k, n = nums.length;
  const dp = new Array(1 << n).fill(-1);       // dp[mask] = fill of the group being built, -1 if impossible
  dp[0] = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    if (dp[mask] < 0) continue;
    for (let i = 0; i < n; i++) {
      if (((mask >> i) & 1) || dp[mask] + nums[i] > target) continue;   // already placed, or would overflow the group
      dp[mask | (1 << i)] = (dp[mask] + nums[i]) % target;
    }
  }
  return dp[(1 << n) - 1] === 0;
}`,
          java: `class Solution {
    public boolean canPartitionKSubsets(int[] nums, int k) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % k != 0) return false;
        int target = total / k, n = nums.length;
        int[] dp = new int[1 << n];              // dp[mask] = fill of the group being built, -1 if impossible
        Arrays.fill(dp, -1);
        dp[0] = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] < 0) continue;
            for (int i = 0; i < n; i++) {
                if (((mask >> i) & 1) != 0 || dp[mask] + nums[i] > target) continue;   // placed, or would overflow
                dp[mask | (1 << i)] = (dp[mask] + nums[i]) % target;
            }
        }
        return dp[(1 << n) - 1] == 0;
    }
}`,
          cpp: `class Solution {
public:
    bool canPartitionKSubsets(vector<int> nums, int k) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % k != 0) return false;
        int target = total / k, n = nums.size();
        vector<int> dp(1 << n, -1);              // dp[mask] = fill of the group being built, -1 if impossible
        dp[0] = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] < 0) continue;
            for (int i = 0; i < n; i++) {
                if (((mask >> i) & 1) || dp[mask] + nums[i] > target) continue;   // placed, or would overflow
                dp[mask | (1 << i)] = (dp[mask] + nums[i]) % target;
            }
        }
        return dp[(1 << n) - 1] == 0;
    }
};`
        },
        complexity: 'O(2ⁿ · n) time, O(2ⁿ) space.',
        say: '“If the total is not divisible by k it is impossible; otherwise each group has to reach total over k. I build the groups one at a time, so after placing the numbers in a mask, the current group’s fill is determined: the mask’s sum modulo the target. That means `dp[mask]` just stores that fill, or minus one if it is unreachable. Adding a number is allowed when the fill plus the number stays within the target, and the fill wraps to zero when a group closes. The answer is whether the full mask has fill zero. It is 2 to the n times n, with n at most 16.”',
        followups: [
          { q: 'Why is the fill the same for every route to a mask?', a: 'Every placed number belongs to a closed group or to the open one, and closed groups each hold exactly `target`. So the open group holds `sum(mask) - target · (closed groups)`, which is `sum(mask) % target` while it is below `target`. The order of placement cannot change it, which is why one number per mask is enough.' },
          { q: 'What does a backtracking solution add or lose?', a: 'It is simple and fast with pruning (sort descending, skip a bucket whose fill you already tried), but it has no guarantee. The mask DP caps the work at 2ⁿ · n no matter how nasty the input.' },
          { q: 'Can you get the groups, not just yes or no?', a: 'Store a parent (the last number added) for each reachable mask and walk back from the full mask, starting a new group whenever the fill resets to 0.' }
        ]
      },
      {
        lc: 847,
        restate: 'An undirected connected graph has `n` nodes, given as adjacency lists. You may start at any node and end at any node, and you may revisit nodes and reuse edges. Return the length of the shortest walk that touches every node at least once.',
        examples: '- Star: `[[1,2,3],[0],[0],[0]]` → 4 (for instance 1, 0, 2, 0, 3: four edges).\n- `[[1],[0,2,4],[1,3,4],[2],[1,2]]` → 4 (0, 1, 4, 2, 3).\n- A single node `[[]]` → 0.\n- A triangle needs 2 edges, a path of 5 nodes needs 4.',
        brute: 'Try every order of visiting the nodes and sum shortest-path lengths between consecutive ones: n! orders. Or BFS where a state is just the current node: that never terminates sensibly, because you do not know what you have already seen.',
        insight: 'The right state is **where you are and which nodes you have seen**: `(node, mask)`. There are only `n · 2ⁿ` of them. Each edge moves you to a neighbour and ORs that neighbour’s bit into the mask, and every move costs 1, so this is an **unweighted shortest-path problem: BFS**, not DP in mask order (a step can revisit a node and leave the mask unchanged, so masks alone do not give an order). Start from **every** node at once: `(i, 1 << i)` all at distance 0 (the multi-source trick, because you may start anywhere). The first time you pop or create a state whose mask is full, its distance is the answer. Remember the single-node case is already done at distance 0.',
        code: {
          py: `class Solution:
    def shortestPathLength(self, graph: List[List[int]]) -> int:
        from collections import deque
        n = len(graph)
        full = (1 << n) - 1
        if n == 1:
            return 0
        dist = [[-1] * (1 << n) for _ in range(n)]      # dist[node][mask]
        q = deque()
        for i in range(n):
            dist[i][1 << i] = 0                         # start anywhere
            q.append((i, 1 << i))
        while q:
            node, mask = q.popleft()
            for nb in graph[node]:
                nm = mask | (1 << nb)
                if dist[nb][nm] == -1:
                    dist[nb][nm] = dist[node][mask] + 1
                    if nm == full:
                        return dist[nb][nm]
                    q.append((nb, nm))
        return 0`,
          js: `function shortestPathLength(graph) {
  const n = graph.length, full = (1 << n) - 1;
  if (n === 1) return 0;
  const dist = Array.from({ length: n }, () => new Array(1 << n).fill(-1));   // dist[node][mask]
  const q = [];
  for (let i = 0; i < n; i++) { dist[i][1 << i] = 0; q.push([i, 1 << i]); }   // start anywhere
  for (let h = 0; h < q.length; h++) {
    const [node, mask] = q[h];
    for (const nb of graph[node]) {
      const nm = mask | (1 << nb);
      if (dist[nb][nm] === -1) {
        dist[nb][nm] = dist[node][mask] + 1;
        if (nm === full) return dist[nb][nm];
        q.push([nb, nm]);
      }
    }
  }
  return 0;
}`,
          java: `class Solution {
    public int shortestPathLength(int[][] graph) {
        int n = graph.length, full = (1 << n) - 1;
        if (n == 1) return 0;
        int[][] dist = new int[n][1 << n];                  // dist[node][mask]
        for (int[] row : dist) Arrays.fill(row, -1);
        ArrayDeque<int[]> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) { dist[i][1 << i] = 0; q.add(new int[]{i, 1 << i}); }   // start anywhere
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int node = cur[0], mask = cur[1];
            for (int nb : graph[node]) {
                int nm = mask | (1 << nb);
                if (dist[nb][nm] == -1) {
                    dist[nb][nm] = dist[node][mask] + 1;
                    if (nm == full) return dist[nb][nm];
                    q.add(new int[]{nb, nm});
                }
            }
        }
        return 0;
    }
}`,
          cpp: `class Solution {
public:
    int shortestPathLength(vector<vector<int>> graph) {
        int n = graph.size(), full = (1 << n) - 1;
        if (n == 1) return 0;
        vector<vector<int>> dist(n, vector<int>(1 << n, -1));   // dist[node][mask]
        queue<pair<int, int>> q;
        for (int i = 0; i < n; i++) { dist[i][1 << i] = 0; q.push({i, 1 << i}); }   // start anywhere
        while (!q.empty()) {
            auto [node, mask] = q.front(); q.pop();
            for (int nb : graph[node]) {
                int nm = mask | (1 << nb);
                if (dist[nb][nm] == -1) {
                    dist[nb][nm] = dist[node][mask] + 1;
                    if (nm == full) return dist[nb][nm];
                    q.push({nb, nm});
                }
            }
        }
        return 0;
    }
};`
        },
        complexity: 'O(2ⁿ · n · deg) time, O(2ⁿ · n) space. Each of the `n · 2ⁿ` states is created once and scans its node’s edges.',
        say: '“The walk can reuse nodes, so the state has to be the current node plus the set of nodes visited, as a bitmask. Every step costs one, so I use BFS rather than costs. I start from all nodes at once, each with its own bit set and distance zero, because the start is free. A state moves to a neighbour and ORs in its bit. The first time any state has all bits set, its distance is the answer. States are n times 2 to the n, and each looks at its node’s edges.”',
        followups: [
          { q: 'Why BFS and not the TSP dp[mask][last]?', a: 'Because you may revisit nodes and edges have no weights. The TSP table assumes each city is visited once and goes up in mask order; here the same mask recurs with different nodes and a step may add no new bit. BFS handles revisits naturally, the visited array is the state set.' },
          { q: 'Why start from every node?', a: 'Because the walk may start anywhere. Seeding the queue with all `(i, 1 << i)` at distance 0 finds the best start in a single BFS instead of n of them.' },
          { q: 'What if the graph had edge weights?', a: 'Replace the BFS queue with Dijkstra over the same `(node, mask)` states, or run all-pairs shortest paths first and do the TSP-style `dp[mask][last]` over the node set.' }
        ]
      },
      {
        lc: 526,
        restate: 'Place the numbers `1..n` into positions `1..n`, each number exactly once. A placement is *good* when, at every position `i`, the number there is divisible by `i` or `i` is divisible by that number. Count the good placements.',
        examples: '- `n = 1` → 1.\n- `n = 2` → 2: both `[1, 2]` and `[2, 1]` work (position 2 holds 1, which divides 2).\n- `n = 3` → 3: `[1, 2, 3]`, `[2, 1, 3]`, `[3, 2, 1]`.\n- `n = 4` → 8, `n = 5` → 10.',
        brute: 'Generate all n! permutations and test each: 15! is over a trillion. Backtracking that rejects a bad prefix early is much faster, but still explores every good partial arrangement as a separate path, even though many arrangements of the early positions leave exactly the same numbers free.',
        insight: 'Fill positions in order 1, 2, 3, … . When you are choosing the number for position `p`, the only thing that affects the future is **which numbers are already used**; how they were arranged earlier is irrelevant. So `dp[mask]` counts the ways to fill positions `1..popcount(mask)` using exactly the numbers in `mask`. The next position is `p = popcount(mask) + 1`. For each number `j + 1` not in the mask, if it divides `p` or `p` divides it, add `dp[mask]` into `dp[mask | (1 << j)]`. This is the assignment template, with addition instead of `min` and a divisibility test instead of a cost matrix. `n` is at most 15, so 32 thousand masks.',
        code: {
          py: `class Solution:
    def countArrangement(self, n: int) -> int:
        dp = [0] * (1 << n)                      # dp[mask] = ways to fill positions 1..popcount(mask)
        dp[0] = 1
        for mask in range(1 << n):
            if dp[mask] == 0:
                continue
            pos = bin(mask).count("1") + 1       # the next position to fill
            for j in range(n):
                num = j + 1
                if mask >> j & 1:
                    continue
                if num % pos == 0 or pos % num == 0:
                    dp[mask | (1 << j)] += dp[mask]
        return dp[(1 << n) - 1]`,
          js: `function countArrangement(n) {
  const dp = new Array(1 << n).fill(0);          // dp[mask] = ways to fill positions 1..popcount(mask)
  dp[0] = 1;
  for (let mask = 0; mask < (1 << n); mask++) {
    if (dp[mask] === 0) continue;
    let pos = 1;                                 // the next position to fill
    for (let m = mask; m; m &= m - 1) pos++;
    for (let j = 0; j < n; j++) {
      const num = j + 1;
      if ((mask >> j) & 1) continue;
      if (num % pos === 0 || pos % num === 0) dp[mask | (1 << j)] += dp[mask];
    }
  }
  return dp[(1 << n) - 1];
}`,
          java: `class Solution {
    public int countArrangement(int n) {
        int[] dp = new int[1 << n];                  // dp[mask] = ways to fill positions 1..popcount(mask)
        dp[0] = 1;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] == 0) continue;
            int pos = Integer.bitCount(mask) + 1;    // the next position to fill
            for (int j = 0; j < n; j++) {
                int num = j + 1;
                if (((mask >> j) & 1) != 0) continue;
                if (num % pos == 0 || pos % num == 0) dp[mask | (1 << j)] += dp[mask];
            }
        }
        return dp[(1 << n) - 1];
    }
}`,
          cpp: `class Solution {
public:
    int countArrangement(int n) {
        vector<int> dp(1 << n, 0);                   // dp[mask] = ways to fill positions 1..popcount(mask)
        dp[0] = 1;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] == 0) continue;
            int pos = __builtin_popcount(mask) + 1;  // the next position to fill
            for (int j = 0; j < n; j++) {
                int num = j + 1;
                if ((mask >> j) & 1) continue;
                if (num % pos == 0 || pos % num == 0) dp[mask | (1 << j)] += dp[mask];
            }
        }
        return dp[(1 << n) - 1];
    }
};`
        },
        complexity: 'O(2ⁿ · n) time, O(2ⁿ) space.',
        say: '“Positions are filled in order, and what matters about a partial arrangement is only which numbers are used, not how they were laid out. So `dp[mask]` is the number of ways to fill the first popcount positions with exactly those numbers. For the next position, I try each unused number and keep it if it divides the position or the position divides it, adding the count into the larger mask. The answer is the full mask. It is the assignment DP with counting instead of minimum, 2 to the n times n.”',
        followups: [
          { q: 'How does it compare with backtracking?', a: 'Backtracking with early rejection is the usual answer and is accepted at n = 15. The mask DP merges every ordering of the same used set into one number, so it never repeats work; the backtracking tree can blow up for stricter rules.' },
          { q: 'Why can you add dp values instead of storing the arrangements?', a: 'The question only asks for a count. Two different prefixes that use the same numbers have the same set of valid futures, so their counts simply add.' },
          { q: 'Can the answer overflow an int?', a: 'Not for n up to 15 (the answer is 24679). For bigger n, switch to 64-bit, and take a modulus if the problem asks for one.' }
        ]
      },
      {
        lc: 464,
        restate: 'Two players alternately pick an integer from `1..m`; a number may be picked only once in the whole game. A running total starts at 0 and each pick is added to it. The player whose pick makes the total reach at least `target` wins. Assuming perfect play, can the first player force a win?',
        examples: '- `m = 10`, `target = 11` → false: whatever the first player picks, the second can always finish.\n- `m = 10`, `target = 0` → true (the game is already won).\n- `m = 4`, `target = 6` → true.\n- `m = 3`, `target = 7` → false: even all numbers (1 + 2 + 3 = 6) cannot reach it, so nobody wins.',
        brute: 'Try every pick, then every reply, and so on: up to m! game sequences. With `m = 20` that is 2.4 quintillion. Most sequences end in the same situations over and over: two games where the same numbers were picked, in a different order, have the same total and the same numbers left.',
        insight: 'First the easy cases: if `target <= 0` the first player wins by default; if the sum `1 + … + m` is below `target`, nobody can ever win, so the answer is false. Now the real game: the **set of numbers already picked** fixes the running total (the sum of the set), so the whole state is a mask. Let `win(mask)` mean “the player to move, with this mask used, can force a win”. They win if some unpicked number `x` either reaches the target right now (`x >= remaining`) or leaves the opponent in a state where `win(mask | bit(x))` is false. Memoize it: at most `2^m` masks, each looking at `m` moves. This is **minimax over a mask** and the cleanest top-down use of bitmasks.',
        code: {
          py: `class Solution:
    def canIWin(self, maxChoosableInteger: int, desiredTotal: int) -> bool:
        m = maxChoosableInteger
        if desiredTotal <= 0:
            return True
        if m * (m + 1) // 2 < desiredTotal:
            return False                           # even all numbers cannot reach it
        memo = {}
        def win(used, rem):                        # can the player to move force a win?
            if used in memo:
                return memo[used]
            res = False
            for x in range(1, m + 1):
                bit = 1 << (x - 1)
                if used & bit:
                    continue
                if x >= rem or not win(used | bit, rem - x):
                    res = True                     # finish now, or leave the opponent losing
                    break
            memo[used] = res
            return res
        return win(0, desiredTotal)`,
          js: `function canIWin(maxChoosableInteger, desiredTotal) {
  const m = maxChoosableInteger;
  if (desiredTotal <= 0) return true;
  if (m * (m + 1) / 2 < desiredTotal) return false;   // even all numbers cannot reach it
  const memo = new Map();
  function win(used, rem) {                           // can the player to move force a win?
    if (memo.has(used)) return memo.get(used);
    let res = false;
    for (let x = 1; x <= m && !res; x++) {
      const bit = 1 << (x - 1);
      if (used & bit) continue;
      if (x >= rem || !win(used | bit, rem - x)) res = true;   // finish now, or leave the opponent losing
    }
    memo.set(used, res);
    return res;
  }
  return win(0, desiredTotal);
}`,
          java: `class Solution {
    private int m;
    private Boolean[] memo;

    public boolean canIWin(int maxChoosableInteger, int desiredTotal) {
        m = maxChoosableInteger;
        if (desiredTotal <= 0) return true;
        if (m * (m + 1) / 2 < desiredTotal) return false;   // even all numbers cannot reach it
        memo = new Boolean[1 << m];
        return win(0, desiredTotal);
    }

    private boolean win(int used, int rem) {                // can the player to move force a win?
        if (memo[used] != null) return memo[used];
        boolean res = false;
        for (int x = 1; x <= m && !res; x++) {
            int bit = 1 << (x - 1);
            if ((used & bit) != 0) continue;
            if (x >= rem || !win(used | bit, rem - x)) res = true;   // finish now, or leave the opponent losing
        }
        memo[used] = res;
        return res;
    }
}`,
          cpp: `class Solution {
    int m;
    vector<signed char> memo;                           // -1 unknown, 0 lose, 1 win

    bool win(int used, int rem) {                       // can the player to move force a win?
        if (memo[used] != -1) return memo[used];
        bool res = false;
        for (int x = 1; x <= m && !res; x++) {
            int bit = 1 << (x - 1);
            if (used & bit) continue;
            if (x >= rem || !win(used | bit, rem - x)) res = true;   // finish now, or leave the opponent losing
        }
        memo[used] = res;
        return res;
    }
public:
    bool canIWin(int maxChoosableInteger, int desiredTotal) {
        m = maxChoosableInteger;
        if (desiredTotal <= 0) return true;
        if (m * (m + 1) / 2 < desiredTotal) return false;   // even all numbers cannot reach it
        memo.assign(1 << m, -1);
        return win(0, desiredTotal);
    }
};`
        },
        complexity: 'O(2ᵐ · m) time, O(2ᵐ) space for the memo (plus recursion depth up to m).',
        say: '“If the target is already zero the first player wins, and if even all the numbers add up to less than the target, nobody can win. Otherwise the numbers picked so far determine the running total, so the state is just the bitmask of used numbers. I memoize whether the player to move can force a win from a mask: they can if some unused number reaches the target now, or leaves the opponent in a losing state. That is at most 2 to the m masks with m moves each.”',
        followups: [
          { q: 'Why is the mask alone a sufficient memo key?', a: 'The running total equals the sum of the picked numbers, which the mask determines, and whose turn it is is also determined by `popcount(mask)`. Because the player to move is implied by the mask, the same key never means two different games.' },
          { q: 'What if numbers could be reused?', a: 'Then the state would only be the remaining total, a plain 1-D DP on the total. The mask exists because each number can be used once.' },
          { q: 'Can this be bottom-up?', a: 'Yes, iterate masks from full down to 0 (a mask’s value depends on larger masks), but top-down is natural here and skips the many unreachable masks.' }
        ]
      }
    ],
    practice: [
      { lc: 698,
        hints: ['The total must split evenly into `k` parts, so what is the target for each group? If the total is not divisible, you can stop at once.', 'Fill the groups one after another. After placing the numbers in a set, how full is the group you are working on? It depends only on the set, not the order.', 'Let `dp[mask]` be that fill (or −1 if the set is impossible). Add number `i` when `dp[mask] + nums[i] <= target`, setting the new fill to `(dp[mask] + nums[i]) % target`. Check that `dp[full] == 0`.'],
        starter: { py: 'class Solution:\n    def canPartitionKSubsets(self, nums: List[int], k: int) -> bool:\n        ', js: 'function canPartitionKSubsets(nums, k) {\n  \n}' },
        tests: { fn: 'canPartitionKSubsets', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[4, 3, 2, 3, 5, 2, 1], 4], out: true }, { args: [[1, 2, 3, 4], 3], out: false }, { args: [[1], 1], out: true }, { args: [[2, 2, 2, 2, 3, 4, 5], 4], out: false },
          { args: [[5, 5, 5, 5], 2], out: true }, { args: [[10, 10, 10, 7, 7, 7, 7, 7, 7, 6, 6, 6], 3], out: true }, { args: [[1, 1, 1, 1, 2, 2, 2, 2], 4], out: true }, { args: [[3, 3, 3, 3], 3], out: false }, { args: [[2, 9, 6, 7, 1, 4], 3], out: false }] } },

      { lc: 847,
        hints: ['You may revisit nodes, so the order of first visits is not enough to describe where you are. What two things do you need in a state?', 'The state is `(current node, set of nodes seen)`. Every move costs 1, so which search finds the shortest path in an unweighted graph?', 'Start BFS from every `(i, 1 << i)` at distance 0 (the walk can start anywhere). Moving to neighbour `nb` gives mask `mask | (1 << nb)`. Stop the first time the mask is full. Handle a one-node graph separately.'],
        starter: { py: 'class Solution:\n    def shortestPathLength(self, graph: List[List[int]]) -> int:\n        ', js: 'function shortestPathLength(graph) {\n  \n}' },
        tests: { fn: 'shortestPathLength', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2, 3], [0], [0], [0]]], out: 4 }, { args: [[[1], [0, 2, 4], [1, 3, 4], [2], [1, 2]]], out: 4 }, { args: [[[]]], out: 0 }, { args: [[[1], [0]]], out: 1 },
          { args: [[[1, 2], [0, 2], [0, 1]]], out: 2 }, { args: [[[1], [0, 2], [1, 3], [2, 4], [3]]], out: 4 }, { args: [[[1, 2, 3, 4], [0], [0], [0], [0]]], out: 6 }] } },

      { lc: 526,
        hints: ['Fill the positions one at a time from 1 to `n`. When you choose a number for the next position, what do you need to know about the earlier choices?', 'Only which numbers are used. Let `dp[mask]` be the number of ways to fill the first `popcount(mask)` positions with exactly those numbers. What is the next position?', 'For each unused number `num`, if `num % pos == 0` or `pos % num == 0`, add `dp[mask]` into `dp[mask | (1 << (num - 1))]`. The answer is `dp[full]`.'],
        starter: { py: 'class Solution:\n    def countArrangement(self, n: int) -> int:\n        ', js: 'function countArrangement(n) {\n  \n}' },
        tests: { fn: 'countArrangement', sig: { args: ['int'] }, cases: [
          { args: [1], out: 1 }, { args: [2], out: 2 }, { args: [3], out: 3 }, { args: [4], out: 8 }, { args: [5], out: 10 }, { args: [6], out: 36 },
          { args: [8], out: 132 }, { args: [10], out: 700 }, { args: [15], out: 24679 }] } },

      { lc: 464,
        hints: ['Handle two quick cases first: a target that is already reached (≤ 0), and a target larger than `1 + 2 + … + m`. What should each return?', 'Which numbers have been picked determines the running total and whose turn it is. So the game state is just a mask. A player to move wins if some pick wins now, or leaves the opponent in a losing state.', 'Memoize `win(mask)` (the remaining total is `target − sum(mask)`). Try each unused `x`: if `x >= remaining` or `not win(mask | bit(x))`, it is a win. 2^m states with m moves each is enough.'],
        starter: { py: 'class Solution:\n    def canIWin(self, maxChoosableInteger: int, desiredTotal: int) -> bool:\n        ', js: 'function canIWin(maxChoosableInteger, desiredTotal) {\n  \n}' },
        tests: { fn: 'canIWin', sig: { args: ['int', 'int'] }, cases: [
          { args: [10, 11], out: false }, { args: [10, 0], out: true }, { args: [10, 1], out: true }, { args: [5, 50], out: false }, { args: [4, 6], out: true }, { args: [10, 40], out: false },
          { args: [3, 4], out: false }, { args: [1, 1], out: true }, { args: [2, 3], out: false }, { args: [6, 10], out: true }, { args: [7, 15], out: false }, { args: [15, 100], out: true }, { args: [18, 79], out: true }, { args: [20, 210], out: false }] } }
    ],
    mistakes: [
      '**Operator precedence with `&` and `<<`.** In C++, Java and JavaScript, `==` binds tighter than `&`, so `mask & bit == 0` means `mask & (bit == 0)`. Python gets this one right, which hides the habit. Always write `(mask >> j) & 1` or `(mask & (1 << j)) != 0`. And `1 << n - 1` is `1 << (n - 1)`: half the masks, not all but one.',
      '**Off-by-one on the mask range.** The masks are `0 .. (1 << n) - 1` inclusive, the full set is `(1 << n) - 1`, and `range(1 << n)` / `mask < (1 << n)` covers them. Reading `dp[1 << n]` is out of bounds; asking for `dp[(1 << n) - 1]` and getting infinity usually means a transition is wrong or unreachable.',
      '**Visiting masks in the wrong order.** The forward DP is correct only because a transition sets a bit and makes the mask larger. If you ever remove a bit or move to a smaller mask (a pull from a larger one, or a game where the state shrinks), the loop direction must flip, or use memoized recursion.',
      '**Forgetting that `dp[mask][last]` needs `last` to be in `mask`.** States where it is not are garbage. Skip with an infinity or `-1` check when reading, and only write to `dp[mask | bit][nxt]` for the bit you just added.',
      '**Using INF carelessly.** `INT_MAX + cost` overflows in Java and C++. Use a large-but-safe constant such as `10**9`, skip unreachable states with `if dp[mask] == INF: continue`, and remember the final answer may still be INF (impossible).',
      '**Treating a revisit-allowed graph problem like TSP.** If nodes and edges may be reused (847), the mask does not grow at every step, so there is no “increasing mask order”. Use BFS over `(node, mask)` states with a visited table, and seed every start node at distance 0 if the start is free.',
      '**Ignoring the size limit.** 2²⁰ ints is 4 MB, but `dp[mask][last]` at n = 20 is 20 million cells, and 3ⁿ submask loops die around n = 17. Look at `n` before choosing: if it is 30 or more, a bitmask over the items is not the intended solution.',
      '**Language gotchas.** *Python:* `bin(x).count("1")` is slow in a hot loop (use `x.bit_count()` on 3.10+, or precompute popcounts); a list of 2²⁰ Python ints is fine, but `[[INF] * n] * (1 << n)` aliases one row, so build with a comprehension. *JavaScript:* bitwise operators work on **32-bit signed** integers, so `1 << 31` is negative, and masks of 32 or more bits silently break. *Java:* `1 << j` is an `int`, so use `1L << j` for `long` masks. *C++:* `1 << 31` overflows an `int`; use `1LL << j` or `unsigned`, and `__builtin_popcountll` for 64-bit values.'
    ],

    quiz: [
      { kind: 'concept', q: 'In the bitmask DP template, why can the loop simply run `mask` from 0 up to `(1 << n) - 1`?',
        choices: ['Adding an item sets a bit, so every transition goes to a numerically larger mask: smaller masks are always final first', 'Because the masks are sorted by how many items they hold', 'Because Python iterates integers in binary order', 'Because the table is symmetric, so order does not matter'], answer: 0,
        explain: '`mask | (1 << j)` is larger than `mask` whenever bit `j` was clear. By the time the loop reaches a mask, every mask that could lead to it is smaller and has already been processed.' },
      { kind: 'complexity', q: 'What are the time and space of Held–Karp (`dp[mask][last]`) for `n` cities?',
        choices: ['O(2ⁿ · n²) time, O(2ⁿ · n) space', 'O(n!) time, O(n) space', 'O(2ⁿ · n) time, O(2ⁿ) space', 'O(3ⁿ) time, O(2ⁿ) space'], answer: 0,
        explain: 'There are 2ⁿ · n states `(mask, last)`, and each tries up to n next cities. The memory is the table itself.' },
      { kind: 'complexity', q: 'You compute `dp[mask]` from every non-empty submask of `mask`, over all masks. How many steps in total?',
        choices: ['O(3ⁿ)', 'O(2ⁿ · n)', 'O(4ⁿ)', 'O(2ⁿ)'], answer: 0,
        explain: 'Each of the n items is in the submask, in the mask but not the submask, or outside the mask: three choices each, so 3ⁿ (mask, submask) pairs. That is why this approach stops being practical past n ≈ 17.' },
      { kind: 'pattern', q: 'Which of these is a natural fit for a bitmask over the items? Pick every one that applies.',
        choices: ['Give 12 workers 12 different jobs at minimum total cost', 'Longest increasing subsequence of 100,000 numbers', 'Shortest walk that visits all of 15 nodes of a graph', 'Count the permutations of `1..14` that obey a rule between position and value'], answer: [0, 2, 3],
        explain: 'Small `n`, each item used once, and the future depends on which items are used. A sequence of 100,000 numbers has no such small `n`; it needs a different technique.' },
      { kind: 'concept', q: 'Which expression is true exactly when item `j` is in the set `mask`?',
        choices: ['`(mask >> j) & 1`', '`mask & j`', '`mask | (1 << j)`', '`mask ^ j`'], answer: 0,
        explain: 'Shifting right by `j` brings bit `j` to the bottom, and `& 1` isolates it. `mask | (1 << j)` adds the item instead of testing it.' },
      { kind: 'bug', q: 'This JavaScript is meant to skip every job whose bit is clear, but it never skips anything. Why?',
        code: `for (let j = 0; j < n; j++) {
  if (mask & 1 << j == 0) continue;   // meant: skip when bit j is clear
  ...
}`, lang: 'js',
        choices: ['`==` binds tighter than `&`, so it computes `mask & ((1 << j) == 0)`, which is always 0, and the condition is never true', 'The shift is applied after the comparison, so `j` is wrong', '`continue` is not allowed inside a `for` loop', 'Masks must be compared with `===`'], answer: 0,
        explain: 'Comparison operators have higher precedence than `&`. Parenthesize: `(mask & (1 << j)) === 0`.' },
      { kind: 'bug', q: 'This was meant to loop over every mask, but the answer at the full mask is always infinity. What is wrong?',
        code: `for mask in range(1 << n - 1):
    for j in range(n):
        ...
return dp[(1 << n) - 1]`, lang: 'py',
        choices: ['`1 << n - 1` is `1 << (n - 1)`, so only half of the masks are visited and the full mask never gets filled', 'The inner loop should go over `n - 1`', '`range` cannot take a shifted value', 'The return should be `dp[1 << n]`'], answer: 0,
        explain: 'Subtraction binds tighter than the shift. Write `range(1 << n)` for all masks (`0 .. 2ⁿ − 1`).' },
      { kind: 'concept', q: 'In Shortest Path Visiting All Nodes (revisits allowed, every edge costs 1), why BFS over `(node, mask)` instead of a TSP-style table in mask order?',
        choices: ['A step may revisit a node without changing the mask, so masks alone give no order; BFS on the state graph handles it', 'BFS uses less memory than a table', 'The graph is always a tree', 'TSP tables cannot hold booleans'], answer: 0,
        explain: 'The TSP loop relies on every transition adding a new item. Here a move can leave the mask unchanged, so you search the graph of `(node, mask)` states instead; unit costs make BFS the right shortest-path tool.' },
      { kind: 'concept', q: 'For Partition to K Equal Sum Subsets, why can `dp[mask]` store just one number, the current group’s fill?',
        choices: ['Every route to the same set of placed numbers leaves the open group with the same fill: `sum(mask) % target`', 'Because the numbers are sorted', 'Because `k` is always 2', 'Because groups cannot be rebuilt'], answer: 0,
        explain: 'All the closed groups sum to exactly `target`, so whatever remains of the placed total sits in the open group. The order in which the numbers were placed cannot change that.' },
      { kind: 'concept', q: 'A plain `dp[mask][last]` table for 20 cities uses 4-byte ints. Roughly how much memory is that?',
        choices: ['About 80 MB (2²⁰ · 20 · 4 bytes)', 'About 4 MB', 'About 1 GB', 'About 160 KB'], answer: 0,
        explain: '2²⁰ ≈ 1.05 million masks, times 20 positions, times 4 bytes is roughly 84 MB. The one-dimensional table `dp[mask]` at n = 20 is only 4 MB.' }
    ],

    flashcards: [
      { id: 'when', front: 'What input signal says “try a bitmask DP”?', back: 'A small stated bound (`n <= 12 to 20`), each item used at most once, and a brute force over **orderings or subsets** where the future depends only on **which items are used**.' },
      { id: 'bit-ops', front: 'Test, add, remove and toggle bit `j`.', back: 'Test: `(mask >> j) & 1`. Add: `mask | (1 << j)`. Remove: `mask & ~(1 << j)`. Toggle: `mask ^ (1 << j)`. Full set: `(1 << n) - 1`.' },
      { id: 'order', front: 'Why does iterating masks 0 → 2ⁿ−1 work for a forward DP?', back: 'Adding an item sets a bit, which makes the mask larger, so every predecessor of a mask is numerically smaller and already processed.' },
      { id: 'low-bit', front: 'Lowest set bit, and how do you iterate only the set bits?', back: '`mask & -mask` is the lowest set bit; `mask & (mask - 1)` clears it. `while m: low = m & -m; ...; m &= m - 1`.' },
      { id: 'submask', front: 'Enumerate every non-empty submask of `mask`.', back: '`sub = mask; while sub: ...; sub = (sub - 1) & mask`. Over all masks it costs **O(3ⁿ)**.' },
      { id: 'tsp', front: 'Held–Karp: state, transition, cost.', back: '`dp[mask][last]` = cheapest way to visit exactly `mask`, standing at `last`. Add a `nxt` not in `mask`: `+ dist[last][nxt]`. **O(2ⁿ · n²)** time, **O(2ⁿ · n)** space.' },
      { id: 'assign', front: 'Assignment as a DP: which worker is next?', back: 'The next worker is `popcount(mask)`: the workers before it already have exactly the jobs in `mask`. `dp[mask | (1 << j)] = min(..., dp[mask] + cost[w][j])`.' },
      { id: 'k-equal', front: 'Partition into `k` equal sums: what does `dp[mask]` hold?', back: 'The fill of the group being built, `sum(mask) % target` (or −1 if impossible). Add a number if the fill stays within `target`. Success when `dp[full] == 0`.' },
      { id: 'bfs-mask', front: 'Shortest walk visiting every node, revisits allowed: how?', back: 'BFS over `(node, mask)`, seeded with every `(i, 1 << i)` at distance 0. Moving to `nb` ORs in `1 << nb`. The first state with a full mask gives the answer.' },
      { id: 'game', front: 'Game on a set of numbers that get used up: how do you memoize?', back: 'The mask of used numbers fixes the total and whose turn it is, so `win(mask)` = some move wins now or leaves the opponent in a losing mask. **O(2ᵐ · m)**.' },
      { id: 'limits', front: 'Where does bitmask DP break down?', back: 'Time: 3ⁿ submask loops stop at n ≈ 17. Memory: 2ⁿ · n cells. And 32-bit shift limits in JavaScript or `int` masks: use `1L << j`, `1LL << j`, or BigInt for 32+ bits.' }
    ],

    deeper: [
      { title: 'Bitmask DP on the USACO Guide', url: 'https://usaco.guide/gold/dp-bitmasks', time: 'about 30 min', note: 'A clear walk through subsets as states with competitive-programming style problems of increasing difficulty. Good for submask loops and 2ⁿ · n state counting.' },
      { title: 'Held–Karp algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Held%E2%80%93Karp_algorithm', time: 'about 10 min', note: 'The dp[mask][last] recurrence for the travelling salesman problem, with the O(2ⁿ · n²) bound and why nothing much better is known.' },
      { title: 'Bit manipulation (cp-algorithms)', url: 'https://cp-algorithms.com/algebra/bit-manipulation.html', time: 'about 15 min', note: 'Every bit trick used here (lowest set bit, popcount, iterating submasks) explained with proofs. Keep it open as a reference while practising.' }
    ],

    detective: [
      { id: 'festival-stalls', decoys: ['greedy', 'graphs', 'backtracking'],
        statement: 'A food festival has eleven stalls and exactly eleven volunteers. Each volunteer has a table of walking times to every stall, and each stall needs exactly one volunteer. The organizer wants the **smallest total walking time** over everybody. Walking times are whole minutes, nothing is symmetric, and sending each volunteer to their own nearest stall tends to leave someone with a long trek.',
        why: 'One-to-one pairing with an exact set of stalls, a tiny count (eleven), and the greedy “nearest first” clearly fails. What the future needs from a half-finished plan is **which stalls are already staffed**, so the state is that set and you add the next volunteer’s stall one at a time.' },
      { id: 'night-patrol', decoys: ['graphs', 'shortest-paths', 'backtracking'],
        statement: 'A museum has fourteen rooms joined by corridors, and every corridor takes the guard one minute to walk. On the night shift, the guard must step into every room **at least once**, may begin in any room, may stop in any room, and does not mind walking through the same room or corridor repeatedly. What is the fewest minutes a patrol can take?',
        why: 'The walk may repeat rooms, so position alone is not enough: you also need **which rooms have already been seen**. With only fourteen rooms that set is a small number, and with every step costing the same, a breadth-first search over (room, rooms seen) finds the shortest patrol.' },
      { id: 'lab-batches', decoys: ['knapsack', 'greedy', 'backtracking'],
        statement: 'A lab has fifteen samples, each with a known mass, that must all pass through one machine in batches. A batch can carry samples whose combined mass is at most a fixed limit, and every sample is small enough to go alone. What is the **fewest batches** that process all of the samples?',
        why: 'It is a cover-everything question on a small collection, where a batch is any group that fits. The best answer for a set of samples is one fitting group plus the best answer for **the rest of the set**. With about fifteen samples you can afford to try every group inside every remaining set. Fitting groups into a limit sounds like a budget table, but there is no single total to index by.' }
    ]
  });
})();
