/* Offer Ready: Interval DP lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'interval-dp',

    hook: 'Interval DP is the dynamic-programming shape for problems where **a range of a sequence is cut into two smaller ranges**: bursting balloons, cutting a stick, merging piles, triangulating a polygon, grouping a matrix product. It is rare in screens and shows up in Hard rounds at companies that like DP, so you are mostly buying one skill: when you meet a hard “in what order?” problem on a row, ask **what happens last** inside a range. That one question turns an impossible-looking order search into a clean O(n³) table.',

    cues: [
      'The input is a **row** (an array, a string, a list of marks on a stick) and the answer for the whole row is built from answers for **contiguous pieces** of it.',
      'You repeatedly **remove, merge or cut** something, and the **order** of the operations changes the total cost or reward.',
      'Removing an element changes its neighbors, so the subproblems that remain are *not* clean pieces of the row. That is the cue to flip the thought and ask which operation happens **last**.',
      'The constraint is small: **n up to 100 to 500**. An O(n³) solution is expected, and 2ⁿ or n! is the brute force it replaces.',
      'The state you would write is “the best answer for the range from `l` to `r`”: two indices, so a table with n² cells.',
      'The trap: iterating `l` and `r` in plain nested loops reads cells that are not filled yet. Fill by **increasing length** (or `l` downward, `r` upward) so every smaller range is ready.'
    ],

    intuition: [
      'Suppose you have a stick with marks on it and must cut at every mark. Each cut costs the length of the piece you are cutting. Which order is cheapest? Trying every order is n! work. Now think about the **first** cut: it splits the stick in two, and the two halves are independent problems. The **last** cut on a piece is even better: when you make it, the piece has no marks left except that one, so its cost is simple and the pieces to its sides were already finished.',
      'That is the trick. Instead of asking “which one do I do first?”, ask “**which one do I do last** inside this range?” If balloon `k` is the last to burst between walls `l` and `r`, then everything else in `(l, r)` was already gone, and the balloons to the left of `k` and right of `k` never interacted with each other. They only ever had `k`, `l` or `r` as outside neighbors, so each side is a standalone smaller problem. Bursting `k` last earns `a[l] · a[k] · a[r]`, because its neighbors at that moment are exactly the walls.',
      'So define **`dp[l][r]` = the best result for the open range strictly between `l` and `r`**. Try every `k` in the range as the last action, add `dp[l][k]` and `dp[k][r]` (the two smaller ranges) and the cost of the last action, keep the best. The answer is `dp[0][n-1]` with sentinels at the ends.',
      '**Order of filling.** `dp[l][r]` needs `dp[l][k]` and `dp[k][r]`, both **shorter** ranges. So loop over the range length from small to large, and for each length over every left end. Short ranges are done before any long range needs them. Watch it in the visualizer: the table fills a diagonal at a time, and the small `k` in each cell remembers which balloon went last.',
      'Cost: there are about n²/2 ranges, each tries up to n values of `k`, so **O(n³) time and O(n²) space**. For n = 300 that is about 4.5 million steps.'
    ].join('\n\n'),

    viz: 'dp-interval',

    template: {
      title: 'Interval table: the last action splits the range (burst balloons)',
      note: 'To reuse it, change three things: **how the sentinels are set** (here a 1 on each end, so the walls multiply by 1), **the gain on the `try` line** (the value of doing action `k` last, given walls `l` and `r`), and **whether you take max or min**. The skeleton stays: `width` from the smallest range up, every left end `l`, every candidate `k` strictly between the walls. The interval is **open** (`l` and `r` are never removed), which is why the loop for `k` runs `l + 1` to `r - 1`. If your problem uses closed ranges `[l, r]`, shift the loop bounds and write the split as `dp[l][k] + dp[k+1][r]`.',
      code: {
        py: `def maxCoins(nums):
    a = [1] + nums + [1]                                 #> Walls: a 1 on each end that is never burst
    n = len(a)
    dp = [[0] * n for _ in range(n)]                     #> dp[l][r]: best coins from the balloons strictly between l and r
    for width in range(2, n):                            #> Shortest ranges first, so smaller pieces are always ready
        for l in range(n - width):                       #@pick > Choose the range (l, r) to solve
            r = l + width
            for k in range(l + 1, r):                    #> Try each balloon k as the LAST one burst in (l, r)
                gain = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]   #@try > Left piece + right piece + k bursting beside the walls
                if gain > dp[l][r]:
                    dp[l][r] = gain                      #@best > Keep the best last action for this range
    return dp[0][n - 1]                                  #> The whole row, between the two walls`,
        js: `function maxCoins(nums) {
  const a = [1, ...nums, 1];                             //> Walls: a 1 on each end that is never burst
  const n = a.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));   //> dp[l][r]: best coins from the balloons strictly between l and r
  for (let width = 2; width < n; width++) {              //> Shortest ranges first, so smaller pieces are always ready
    for (let l = 0; l + width < n; l++) {                //@pick > Choose the range (l, r) to solve
      const r = l + width;
      for (let k = l + 1; k < r; k++) {                  //> Try each balloon k as the LAST one burst in (l, r)
        const gain = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r];   //@try > Left piece + right piece + k bursting beside the walls
        if (gain > dp[l][r]) dp[l][r] = gain;            //@best > Keep the best last action for this range
      }
    }
  }
  return dp[0][n - 1];                                   //> The whole row, between the two walls
}`,
        java: `class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length + 2;
        int[] a = new int[n];
        a[0] = 1;                                        // Walls: a 1 on each end that is never burst
        a[n - 1] = 1;
        for (int i = 0; i < nums.length; i++) a[i + 1] = nums[i];
        int[][] dp = new int[n][n];                      // dp[l][r]: best coins from the balloons strictly between l and r
        for (int width = 2; width < n; width++) {        // Shortest ranges first, so smaller pieces are always ready
            for (int l = 0; l + width < n; l++) {        //@pick > Choose the range (l, r) to solve
                int r = l + width;
                for (int k = l + 1; k < r; k++) {        // Try each balloon k as the LAST one burst in (l, r)
                    int gain = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r];   //@try > Left piece + right piece + k bursting beside the walls
                    if (gain > dp[l][r]) dp[l][r] = gain;                  //@best > Keep the best last action for this range
                }
            }
        }
        return dp[0][n - 1];                             // The whole row, between the two walls
    }
}`,
        cpp: `class Solution {
public:
    int maxCoins(vector<int>& nums) {
        vector<int> a = {1};                             // Walls: a 1 on each end that is never burst
        a.insert(a.end(), nums.begin(), nums.end());
        a.push_back(1);
        int n = a.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));    // dp[l][r]: best coins from the balloons strictly between l and r
        for (int width = 2; width < n; width++) {        // Shortest ranges first, so smaller pieces are always ready
            for (int l = 0; l + width < n; l++) {        //@pick > Choose the range (l, r) to solve
                int r = l + width;
                for (int k = l + 1; k < r; k++) {        // Try each balloon k as the LAST one burst in (l, r)
                    int gain = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r];   //@try > Left piece + right piece + k bursting beside the walls
                    if (gain > dp[l][r]) dp[l][r] = gain;                  //@best > Keep the best last action for this range
                }
            }
        }
        return dp[0][n - 1];                             // The whole row, between the two walls
    }
};`
      },
      tests: { fn: 'maxCoins', sig: { args: ['int[]'] }, cases: [
        { args: [[3, 1, 5, 8]], out: 167 }, { args: [[1, 5]], out: 10 }, { args: [[5]], out: 5 }, { args: [[]], out: 0 },
        { args: [[9, 76, 64, 21]], out: 116718 }, { args: [[7, 9, 8, 0, 7, 1, 3, 5, 5, 2, 3, 3]], out: 1717 }] }
    },

    complexity: {
      time: 'O(n³): n²/2 ranges × up to n splits each',
      space: 'O(n²) for the table',
      why: 'Count the states and the work per state. A state is a pair `(l, r)` with `l < r`, so about n²/2 of them. Each state loops over the split point `k` strictly between its walls, which is at most n values, and the gain is O(1). That is roughly n³/6 steps, written O(n³). The table holds one number per state: O(n²). If a split needs a range sum, precompute **prefix sums** so it stays O(1) and the total stays O(n³).',
      trap: 'n = 500 is already 2×10⁷ steps (fine); n = 5,000 is 2×10¹⁰ (too slow). Interval DP is only the answer when n is a few hundred at most. Also check **overflow**: balloon products multiply three values, so use a 64-bit type (`long`, `long long`) if the values or n can be large. The LeetCode limits fit in `int`, but ask.'
    },

    variations: [
      {
        name: 'Top-down with a cache',
        body: 'The same recurrence written as recursion. `best(l, r)` returns the answer for the open range, and a cache makes each `(l, r)` run once. It is easier to write when the recurrence is the hard part, and it only visits ranges that are actually reachable. The price is recursion depth up to n, fine at n = 300 but worth switching to the table for Python at larger sizes.',
        code: {
          py: `from functools import lru_cache

def max_coins_memo(nums):
    a = [1] + nums + [1]
    @lru_cache(maxsize=None)
    def best(l, r):                                  # best coins strictly between walls l and r
        return max((best(l, k) + best(k, r) + a[l] * a[k] * a[r] for k in range(l + 1, r)), default=0)
    return best(0, len(a) - 1)`,
          js: `function maxCoinsMemo(nums) {
  const a = [1, ...nums, 1];
  const memo = new Map();
  function best(l, r) {                              // best coins strictly between walls l and r
    if (r - l < 2) return 0;
    const key = l * a.length + r;
    if (memo.has(key)) return memo.get(key);
    let top = 0;
    for (let k = l + 1; k < r; k++) top = Math.max(top, best(l, k) + best(k, r) + a[l] * a[k] * a[r]);
    memo.set(key, top);
    return top;
  }
  return best(0, a.length - 1);
}`
        },
        tests: { fn: { py: 'max_coins_memo', default: 'maxCoinsMemo' }, cases: [
          { args: [[3, 1, 5, 8]], out: 167 }, { args: [[1, 5]], out: 10 }, { args: [[]], out: 0 }, { args: [[9, 76, 64, 21]], out: 116718 }] }
      },
      {
        name: 'Minimum cost to merge adjacent piles',
        body: 'Here the range is **closed** and the action is a *merge*. Piles in a row can be merged only with a neighbor, and merging two piles costs their combined size. The **last** merge in `[l, r]` joins a left block `[l, k]` with a right block `[k+1, r]`, which always costs the whole range sum, whatever `k` is. So `dp[l][r] = min over k of dp[l][k] + dp[k+1][r]`, plus `sum(l..r)` from a prefix array. The same shape solves matrix-chain multiplication, where the last multiplication splits the chain and costs `p[l] · p[k+1] · p[r+1]`.',
        code: {
          py: `def merge_cost(piles):
    n = len(piles)
    pre = [0]
    for x in piles:
        pre.append(pre[-1] + x)                      #> Prefix sums: a range total in O(1)
    dp = [[0] * n for _ in range(n)]                 # a single pile costs 0
    for width in range(2, n + 1):
        for l in range(n - width + 1):
            r = l + width - 1
            dp[l][r] = min(dp[l][k] + dp[k + 1][r] for k in range(l, r)) + pre[r + 1] - pre[l]   #> Last merge joins [l,k] and [k+1,r]
    return dp[0][n - 1]`,
          js: `function mergeCost(piles) {
  const n = piles.length;
  const pre = [0];
  for (const x of piles) pre.push(pre[pre.length - 1] + x);   //> Prefix sums: a range total in O(1)
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));   // a single pile costs 0
  for (let width = 2; width <= n; width++) {
    for (let l = 0; l + width <= n; l++) {
      const r = l + width - 1;
      let top = Infinity;
      for (let k = l; k < r; k++) top = Math.min(top, dp[l][k] + dp[k + 1][r]);
      dp[l][r] = top + pre[r + 1] - pre[l];          //> Last merge joins [l,k] and [k+1,r]
    }
  }
  return dp[0][n - 1];
}`
        },
        tests: { fn: { py: 'merge_cost', default: 'mergeCost' }, cases: [
          { args: [[4, 1, 3, 2]], out: 20 }, { args: [[10]], out: 0 }, { args: [[1, 2]], out: 3 }, { args: [[20, 1, 1, 20]], out: 66 }, { args: [[5, 5, 5, 5, 5]], out: 60 }] }
      },
      {
        name: 'Stretch: merge exactly k piles at a time',
        body: 'The hard cousin of the previous variation: each move merges **k consecutive** piles into one, costing their total, and you must end with a single pile (impossible unless `(n − 1) % (k − 1) == 0`). Now the range `[i, j]` cannot always collapse to one pile, so let `dp[i][j]` be the cheapest way to reduce it to **as few piles as possible**. Peel off a prefix that becomes exactly one pile: the split `m` steps by `k − 1`, because the prefix must be reducible to a single pile. Add the range total **only** when `(j − i) % (k − 1) == 0`, since only then does the last move produce a single pile. This is LeetCode 1000, a classic Hard; know the idea, but do not expect it in most interviews.',
        code: {
          py: `def merge_stones(stones, k):
    n = len(stones)
    if (n - 1) % (k - 1):
        return -1                                    #> Each move removes k-1 piles: reachable only if this divides
    pre = [0]
    for x in stones:
        pre.append(pre[-1] + x)
    dp = [[0] * n for _ in range(n)]
    for width in range(k, n + 1):
        for i in range(n - width + 1):
            j = i + width - 1
            dp[i][j] = min(dp[i][m] + dp[m + 1][j] for m in range(i, j, k - 1))   #> Prefix [i,m] becomes ONE pile, so m steps by k-1
            if (width - 1) % (k - 1) == 0:
                dp[i][j] += pre[j + 1] - pre[i]      #> The range can now collapse into one pile: pay its total
    return dp[0][n - 1]`,
          js: `function mergeStones(stones, k) {
  const n = stones.length;
  if ((n - 1) % (k - 1)) return -1;                  //> Each move removes k-1 piles: reachable only if this divides
  const pre = [0];
  for (const x of stones) pre.push(pre[pre.length - 1] + x);
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let width = k; width <= n; width++) {
    for (let i = 0; i + width <= n; i++) {
      const j = i + width - 1;
      let top = Infinity;
      for (let m = i; m < j; m += k - 1) top = Math.min(top, dp[i][m] + dp[m + 1][j]);   //> Prefix [i,m] becomes ONE pile, so m steps by k-1
      if ((width - 1) % (k - 1) === 0) top += pre[j + 1] - pre[i];   //> The range can now collapse into one pile: pay its total
      dp[i][j] = top;
    }
  }
  return dp[0][n - 1];
}`
        },
        tests: { fn: { py: 'merge_stones', default: 'mergeStones' }, cases: [
          { args: [[3, 2, 4, 1], 2], out: 20 }, { args: [[3, 2, 4, 1], 3], out: -1 }, { args: [[3, 5, 1, 2, 6], 3], out: 25 }, { args: [[7], 2], out: 0 }] }
      },
      {
        name: 'Same table, different rule: palindromic subsequence',
        body: 'Not every interval DP has a “last action”. Sometimes the rule is about the **two ends** of the range: if `s[l] == s[r]`, they pair up around whatever the inside holds; otherwise one end is useless and you drop it. Still `dp[l][r]` from shorter ranges, still increasing length, still O(n²) states, but only O(1) work per state, so O(n²) total. Recognize interval DP by the shape of the state (a range), not only by the split loop.',
        code: {
          py: `def longest_pal_subseq(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for l in range(n - 1, -1, -1):                   #> l goes down so dp[l+1][...] is ready
        dp[l][l] = 1                                 # one character is a palindrome
        for r in range(l + 1, n):
            if s[l] == s[r]:
                dp[l][r] = dp[l + 1][r - 1] + 2      #> Matching ends wrap the inside
            else:
                dp[l][r] = max(dp[l + 1][r], dp[l][r - 1])   #> Drop whichever end is useless
    return dp[0][n - 1]`,
          js: `function longestPalSubseq(s) {
  const n = s.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let l = n - 1; l >= 0; l--) {                 //> l goes down so dp[l+1][...] is ready
    dp[l][l] = 1;                                    // one character is a palindrome
    for (let r = l + 1; r < n; r++) {
      if (s[l] === s[r]) dp[l][r] = dp[l + 1][r - 1] + 2;      //> Matching ends wrap the inside
      else dp[l][r] = Math.max(dp[l + 1][r], dp[l][r - 1]);    //> Drop whichever end is useless
    }
  }
  return dp[0][n - 1];
}`
        },
        tests: { fn: { py: 'longest_pal_subseq', default: 'longestPalSubseq' }, cases: [
          { args: ['bbbab'], out: 4 }, { args: ['cbbd'], out: 2 }, { args: ['a'], out: 1 }, { args: ['abcde'], out: 1 }, { args: ['agbdba'], out: 5 }] }
      },
      {
        name: 'Is it interval DP? A quick test',
        body: 'Ask three questions. **1.** Is the state naturally “a contiguous range of the input”? **2.** Does the answer for a range come from **splitting it at one point** (or peeling its ends) into smaller ranges? **3.** Is n small enough for O(n³)? If the answer to the first two is yes, it is interval DP. If you only ever look at a **prefix** (`dp[i]`), it is [1-D DP](#/topic/dp-1d). If the two ranges are in **two different** strings, it is [2-D string DP](#/topic/string-dp). If you choose items rather than split ranges, it is [knapsack](#/topic/knapsack).'
      }
    ],

    worked: [
      {
        lc: 312,
        restate: 'A row of balloons each shows a number. Bursting balloon `i` earns `nums[i-1] * nums[i] * nums[i+1]` coins, where a missing neighbor counts as 1. After a burst the row closes up, so the neighbors change. Burst them all in the best order and return the most coins you can collect.',
        examples: '- `[3,1,5,8]` → 167 (burst 1, then 5, then 3, then 8: 15 + 120 + 24 + 8).\n- `[1,5]` → 10.\n- `[5]` → 5.\n- Edge cases: an empty row gives 0; a zero-valued balloon is best burst early, because it wipes out the coins of its neighbors if left in place.',
        brute: 'Try every burst order with recursion: n! orders, and after each burst the row changes, so nothing is reusable. Memoizing on the *remaining set of balloons* is 2ⁿ states. Both die around n = 20.',
        insight: 'Thinking “which balloon first?” fails: once it bursts, its neighbors become adjacent and the two sides are no longer independent. Flip it: in the range strictly between two walls `l` and `r`, which balloon `k` bursts **last**? At that moment `k` is the only balloon left, so its neighbors are exactly `a[l]` and `a[r]`, and it earns `a[l] · a[k] · a[r]`. Before that, the balloons left of `k` were only ever next to `l` or `k`, and those on the right only next to `k` or `r`: two independent subproblems, `dp[l][k]` and `dp[k][r]`. Pad the row with a 1 on each end and fill by increasing width.',
        code: {
          py: `class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        a = [1] + nums + [1]
        n = len(a)
        dp = [[0] * n for _ in range(n)]          # dp[l][r]: best strictly between l and r
        for width in range(2, n):
            for l in range(n - width):
                r = l + width
                for k in range(l + 1, r):         # k is the LAST balloon burst in (l, r)
                    dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r])
        return dp[0][n - 1]`,
          js: `function maxCoins(nums) {
  const a = [1, ...nums, 1];
  const n = a.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));   // dp[l][r]: best strictly between l and r
  for (let width = 2; width < n; width++) {
    for (let l = 0; l + width < n; l++) {
      const r = l + width;
      for (let k = l + 1; k < r; k++) {           // k is the LAST balloon burst in (l, r)
        dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
      }
    }
  }
  return dp[0][n - 1];
}`,
          java: `class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length + 2;
        int[] a = new int[n];
        a[0] = 1;
        a[n - 1] = 1;
        for (int i = 0; i < nums.length; i++) a[i + 1] = nums[i];
        int[][] dp = new int[n][n];               // dp[l][r]: best strictly between l and r
        for (int width = 2; width < n; width++) {
            for (int l = 0; l + width < n; l++) {
                int r = l + width;
                for (int k = l + 1; k < r; k++) { // k is the LAST balloon burst in (l, r)
                    dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
                }
            }
        }
        return dp[0][n - 1];
    }
}`,
          cpp: `class Solution {
public:
    int maxCoins(vector<int>& nums) {
        vector<int> a = {1};
        a.insert(a.end(), nums.begin(), nums.end());
        a.push_back(1);
        int n = a.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));   // dp[l][r]: best strictly between l and r
        for (int width = 2; width < n; width++) {
            for (int l = 0; l + width < n; l++) {
                int r = l + width;
                for (int k = l + 1; k < r; k++) {       // k is the LAST balloon burst in (l, r)
                    dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
                }
            }
        }
        return dp[0][n - 1];
    }
};`
        },
        tests: { fn: 'maxCoins', sig: { args: ['int[]'] }, cases: [
          { args: [[3, 1, 5, 8]], out: 167 }, { args: [[1, 5]], out: 10 }, { args: [[5]], out: 5 }, { args: [[]], out: 0 }, { args: [[9, 76, 64, 21]], out: 116718 }] },
        complexity: 'O(n³) time (n²/2 ranges, up to n choices of the last balloon each) and O(n²) space for the table. Values up to 100 and n up to 300 keep the answer inside a 32-bit int on this problem; with larger inputs use a 64-bit type.',
        say: '“Bursting first breaks the independence of the pieces, because the neighbors change. So I choose the balloon that bursts last in each range instead. If k is last between walls l and r, its neighbors are l and r, and the two sides are independent subproblems. I pad both ends with 1, define dp[l][r] as the best strictly between them, and fill by increasing width. That’s O(n³) time and O(n²) space.”',
        followups: [
          { q: 'Why does choosing the last balloon make the subproblems independent?', a: 'Everything left of `k` is gone before `k` bursts, and none of those bursts can see anything right of `k`, because `k` is still standing between them. So the left side only has walls `l` and `k`, the right side only `k` and `r`. Choosing the *first* balloon leaves two sides whose edges now touch.' },
          { q: 'Why the open range and the loop `k` from `l+1` to `r-1`?', a: 'The walls `l` and `r` are never burst inside this subproblem: they are the surviving neighbors. That also makes the base case free: a range with nothing strictly inside (`r − l < 2`) is 0 and the table starts at zero.' },
          { q: 'Can it be faster than O(n³)?', a: 'Not by a known general method for this problem; O(n³) is the expected optimal answer. You can drop zero-valued balloons first to shrink n, but the worst case is unchanged.' }
        ]
      },
      {
        lc: 1039,
        restate: 'A convex polygon has its corners labeled with numbers in order around the edge. Cut it into triangles using non-crossing diagonals. A triangle scores the **product** of its three corner labels, and a cutting scores the sum over all its triangles. Return the smallest possible total.',
        examples: '- `[1,2,3]` → 6 (one triangle, 1·2·3).\n- `[3,7,4,5]` → 144 (the diagonal between the 3 and the 4 gives 3·7·4 + 3·4·5 = 84 + 60; the other diagonal gives 245).\n- `[1,3,1,4,1,5]` → 13.\n- Edge cases: exactly 3 corners means a single triangle; every triangulation of an n-gon has n − 2 triangles.',
        brute: 'Enumerate every triangulation recursively: the count is a Catalan number, which grows like 4ⁿ. With n up to 50 that is far too many.',
        insight: 'Fix the edge between corner `l` and corner `r`. In any triangulation, that edge belongs to exactly **one** triangle, and its third corner is some `k` strictly between them. That triangle leaves two smaller polygons, one on corners `l..k` and one on `k..r`, which are independent. So `dp[l][r] = min over k of dp[l][k] + dp[k][r] + v[l]·v[k]·v[r]`, where a polygon of two corners (an edge) costs 0. The answer is `dp[0][n-1]`, using the edge from the first to the last corner as the base. It is the same table as balloons with `min` in place of `max`.',
        code: {
          py: `class Solution:
    def minScoreTriangulation(self, values: List[int]) -> int:
        n = len(values)
        dp = [[0] * n for _ in range(n)]          # dp[l][r]: cheapest polygon on corners l..r
        for width in range(2, n):
            for l in range(n - width):
                r = l + width
                dp[l][r] = min(dp[l][k] + dp[k][r] + values[l] * values[k] * values[r]
                               for k in range(l + 1, r))   # k: third corner of the triangle on edge (l, r)
        return dp[0][n - 1]`,
          js: `function minScoreTriangulation(values) {
  const n = values.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));   // dp[l][r]: cheapest polygon on corners l..r
  for (let width = 2; width < n; width++) {
    for (let l = 0; l + width < n; l++) {
      const r = l + width;
      let best = Infinity;
      for (let k = l + 1; k < r; k++) {           // k: third corner of the triangle on edge (l, r)
        best = Math.min(best, dp[l][k] + dp[k][r] + values[l] * values[k] * values[r]);
      }
      dp[l][r] = best;
    }
  }
  return dp[0][n - 1];
}`,
          java: `class Solution {
    public int minScoreTriangulation(int[] values) {
        int n = values.length;
        int[][] dp = new int[n][n];               // dp[l][r]: cheapest polygon on corners l..r
        for (int width = 2; width < n; width++) {
            for (int l = 0; l + width < n; l++) {
                int r = l + width;
                int best = Integer.MAX_VALUE;
                for (int k = l + 1; k < r; k++) { // k: third corner of the triangle on edge (l, r)
                    best = Math.min(best, dp[l][k] + dp[k][r] + values[l] * values[k] * values[r]);
                }
                dp[l][r] = best;
            }
        }
        return dp[0][n - 1];
    }
}`,
          cpp: `class Solution {
public:
    int minScoreTriangulation(vector<int>& values) {
        int n = values.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));   // dp[l][r]: cheapest polygon on corners l..r
        for (int width = 2; width < n; width++) {
            for (int l = 0; l + width < n; l++) {
                int r = l + width;
                int best = INT_MAX;
                for (int k = l + 1; k < r; k++) {       // k: third corner of the triangle on edge (l, r)
                    best = min(best, dp[l][k] + dp[k][r] + values[l] * values[k] * values[r]);
                }
                dp[l][r] = best;
            }
        }
        return dp[0][n - 1];
    }
};`
        },
        tests: { fn: 'minScoreTriangulation', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3]], out: 6 }, { args: [[3, 7, 4, 5]], out: 144 }, { args: [[1, 3, 1, 4, 1, 5]], out: 13 }, { args: [[2, 2, 2, 2, 2]], out: 24 }, { args: [[5, 1, 9, 2, 8, 3, 7]], out: 114 }] },
        complexity: 'O(n³) time and O(n²) space. No better algorithm is known for general weights, and n ≤ 50 makes this trivial.',
        say: '“Every triangulation puts the edge between the first and last corner in exactly one triangle, with some third corner k. That triangle splits the polygon into two smaller polygons, so dp[l][r] is the minimum over k of dp[l][k] + dp[k][r] plus the triangle’s product. Two corners is just an edge, cost 0. I fill by width and return dp[0][n-1]. It’s O(n³), the same shape as matrix-chain multiplication.”',
        followups: [
          { q: 'Why is this the same problem as multiplying a chain of matrices?', a: 'Each way to parenthesize a product of matrices corresponds to a triangulation of a polygon whose corner labels are the dimensions. The last multiplication is the triangle on the base edge, and its cost is a product of three dimensions.' },
          { q: 'Why does the answer use the edge `(0, n-1)`, not any edge?', a: 'Any edge of the polygon works as the base, since every triangulation uses all edges. `(0, n-1)` is simply the one that makes the DP a clean range over the whole input.' },
          { q: 'Can you reduce the memory?', a: 'Each cell reads from many shorter ranges, so you cannot easily keep just a row. O(n²) is the normal answer, and at n ≤ 50 it is nothing.' }
        ]
      },
      {
        lc: 375,
        restate: 'I secretly pick a whole number from 1 to n and you guess it. Each wrong guess costs you the number you guessed, in coins, and I tell you whether the secret is higher or lower. Guess it right and you pay nothing. How many coins do you need so that you can **always** win, no matter which number I picked, if you play as cleverly as possible?',
        examples: '- `n = 1` → 0 (no guess is wrong).\n- `n = 2` → 1 (guess 1; if wrong, it is 2).\n- `n = 4` → 4.\n- `n = 10` → 16.\n- Edge cases: a range with one number costs 0; a range of two costs its **smaller** number, because you guess the smaller one first.',
        brute: 'Recurse over every possible first guess and every possible answer, without remembering ranges: the same range is re-solved many times. Memoizing on `(low, high)` turns it into the table below.',
        insight: 'After a wrong guess in the range `[l, r]`, you are left with either `[l, k-1]` or `[k+1, r]`, and the adversary picks whichever costs you **more**. So guessing `k` costs `k + max(dp[l][k-1], dp[k+1][r])`, and you take the **minimum** over `k`: a min over choices of a max over outcomes. The choice that splits the range into two independent halves is the interval-DP step; here it is the *first* guess, because the worst case is chosen for you afterwards. Empty ranges and single numbers cost 0, so the table is zero-filled with room for `k±1`.',
        code: {
          py: `class Solution:
    def getMoneyAmount(self, n: int) -> int:
        dp = [[0] * (n + 2) for _ in range(n + 2)]   # dp[l][r]: cost to guarantee a win in [l, r]
        for width in range(2, n + 1):
            for l in range(1, n - width + 2):
                r = l + width - 1
                dp[l][r] = min(k + max(dp[l][k - 1], dp[k + 1][r]) for k in range(l, r + 1))
        return dp[1][n]`,
          js: `function getMoneyAmount(n) {
  const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));   // dp[l][r]: cost to guarantee a win in [l, r]
  for (let width = 2; width <= n; width++) {
    for (let l = 1; l + width - 1 <= n; l++) {
      const r = l + width - 1;
      let best = Infinity;
      for (let k = l; k <= r; k++) best = Math.min(best, k + Math.max(dp[l][k - 1], dp[k + 1][r]));
      dp[l][r] = best;
    }
  }
  return dp[1][n];
}`,
          java: `class Solution {
    public int getMoneyAmount(int n) {
        int[][] dp = new int[n + 2][n + 2];       // dp[l][r]: cost to guarantee a win in [l, r]
        for (int width = 2; width <= n; width++) {
            for (int l = 1; l + width - 1 <= n; l++) {
                int r = l + width - 1;
                int best = Integer.MAX_VALUE;
                for (int k = l; k <= r; k++) {
                    best = Math.min(best, k + Math.max(dp[l][k - 1], dp[k + 1][r]));
                }
                dp[l][r] = best;
            }
        }
        return dp[1][n];
    }
}`,
          cpp: `class Solution {
public:
    int getMoneyAmount(int n) {
        vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));   // dp[l][r]: cost to guarantee a win in [l, r]
        for (int width = 2; width <= n; width++) {
            for (int l = 1; l + width - 1 <= n; l++) {
                int r = l + width - 1;
                int best = INT_MAX;
                for (int k = l; k <= r; k++) {
                    best = min(best, k + max(dp[l][k - 1], dp[k + 1][r]));
                }
                dp[l][r] = best;
            }
        }
        return dp[1][n];
    }
};`
        },
        tests: { fn: 'getMoneyAmount', sig: { args: ['int'] }, cases: [
          { args: [1], out: 0 }, { args: [2], out: 1 }, { args: [3], out: 2 }, { args: [4], out: 4 }, { args: [5], out: 6 }, { args: [10], out: 16 }, { args: [16], out: 34 }, { args: [20], out: 49 }] },
        complexity: 'O(n³) time, O(n²) space; n is at most a few hundred. (You can start `k` from the middle of each range, since the lower half never helps, which halves the work but not the order.)',
        say: '“After a wrong guess k in [l, r], I’m left with [l, k-1] or [k+1, r], and the worst case is the larger of the two. So guessing k costs k plus the max of the two sub-costs, and I minimise over k. That is min-of-max over ranges, so dp[l][r] by increasing width, with empty and single-number ranges at zero. O(n³) time and O(n²) space.”',
        followups: [
          { q: 'Why min of max and not a sum?', a: 'Only one of the two sub-ranges actually happens, and you must be ready for the worse. The adversary picks the outcome, so you take the max; you pick the guess, so you take the min.' },
          { q: 'Why is a single number free?', a: 'If only one candidate remains, you guess it and are right, paying nothing: wrong guesses are the only thing that costs. That is why the table is initialised to 0, including for empty ranges.' },
          { q: 'How would you speed it up?', a: 'Only guesses in the upper half of a range can be optimal, since a lower guess costs less per miss but leaves a bigger right side. That halves the constant. O(n³) is what interviews accept.' }
        ]
      }
    ],

    practice: [
      { lc: 312,
        hints: ['Choosing which balloon to burst **first** breaks the problem: its neighbors become adjacent. Ask which balloon bursts **last** in a range instead.', 'Pad the row with a 1 on each end. Let `dp[l][r]` be the best coins from the balloons strictly between `l` and `r`. If `k` is last, its neighbors are `a[l]` and `a[r]`.', '`dp[l][r] = max over k of dp[l][k] + dp[k][r] + a[l]*a[k]*a[r]`. Fill by increasing `r - l`, and return `dp[0][n-1]`.'],
        solution: { explain: 'The last balloon in a range sees only the two walls, and splits the range into two independent halves. O(n³) time, O(n²) space.', code: {
          py: `class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        a = [1] + nums + [1]
        n = len(a)
        dp = [[0] * n for _ in range(n)]
        for width in range(2, n):
            for l in range(n - width):
                r = l + width
                for k in range(l + 1, r):
                    dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r])
        return dp[0][n - 1]`,
          js: `function maxCoins(nums) {
  const a = [1, ...nums, 1];
  const n = a.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let width = 2; width < n; width++) {
    for (let l = 0; l + width < n; l++) {
      const r = l + width;
      for (let k = l + 1; k < r; k++) dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
    }
  }
  return dp[0][n - 1];
}` } },
        starter: { py: 'class Solution:\n    def maxCoins(self, nums: List[int]) -> int:\n        ', js: 'function maxCoins(nums) {\n  \n}' },
        tests: { fn: 'maxCoins', cases: [
          { args: [[3, 1, 5, 8]], out: 167 }, { args: [[1, 5]], out: 10 }, { args: [[5]], out: 5 }, { args: [[]], out: 0 }, { args: [[0, 4, 0]], out: 4 }, { args: [[9, 76, 64, 21]], out: 116718 }, { args: [[7, 9, 8, 0, 7, 1, 3, 5, 5, 2, 3, 3]], out: 1717 }] } },

      { lc: 1039,
        hints: ['Look at one edge of the polygon, say from the first corner to the last. In any triangulation that edge sits in exactly one triangle.', 'That triangle has some third corner `k` between them, and it splits the rest into two smaller polygons on `l..k` and `k..r`.', '`dp[l][r] = min over k of dp[l][k] + dp[k][r] + v[l]*v[k]*v[r]`, and two corners (an edge) cost 0. Fill by width.'],
        solution: { explain: 'Choose the third corner of the triangle that rests on the base edge; the two leftover polygons are independent. O(n³) time, O(n²) space.', code: {
          py: `class Solution:
    def minScoreTriangulation(self, values: List[int]) -> int:
        n = len(values)
        dp = [[0] * n for _ in range(n)]
        for width in range(2, n):
            for l in range(n - width):
                r = l + width
                dp[l][r] = min(dp[l][k] + dp[k][r] + values[l] * values[k] * values[r] for k in range(l + 1, r))
        return dp[0][n - 1]`,
          js: `function minScoreTriangulation(values) {
  const n = values.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let width = 2; width < n; width++) {
    for (let l = 0; l + width < n; l++) {
      const r = l + width;
      let best = Infinity;
      for (let k = l + 1; k < r; k++) best = Math.min(best, dp[l][k] + dp[k][r] + values[l] * values[k] * values[r]);
      dp[l][r] = best;
    }
  }
  return dp[0][n - 1];
}` } },
        starter: { py: 'class Solution:\n    def minScoreTriangulation(self, values: List[int]) -> int:\n        ', js: 'function minScoreTriangulation(values) {\n  \n}' },
        tests: { fn: 'minScoreTriangulation', cases: [
          { args: [[1, 2, 3]], out: 6 }, { args: [[3, 7, 4, 5]], out: 144 }, { args: [[1, 3, 1, 4, 1, 5]], out: 13 }, { args: [[2, 2, 2, 2, 2]], out: 24 }, { args: [[5, 1, 9, 2, 8, 3, 7]], out: 114 }] } },

      { lc: 375,
        hints: ['If you guess `k` in the range `[l, r]` and are wrong, you pay `k` and continue in `[l, k-1]` or `[k+1, r]`.', 'You must survive the **worse** of those two, so the cost of guessing `k` is `k + max(dp[l][k-1], dp[k+1][r])`.', 'You choose the guess, so take the **min** over `k`. Ranges of 0 or 1 numbers cost 0. Fill by increasing range length and answer `dp[1][n]`.'],
        solution: { explain: 'A min-of-max over ranges: you pick the guess, the adversary picks the side. O(n³) time, O(n²) space.', code: {
          py: `class Solution:
    def getMoneyAmount(self, n: int) -> int:
        dp = [[0] * (n + 2) for _ in range(n + 2)]
        for width in range(2, n + 1):
            for l in range(1, n - width + 2):
                r = l + width - 1
                dp[l][r] = min(k + max(dp[l][k - 1], dp[k + 1][r]) for k in range(l, r + 1))
        return dp[1][n]`,
          js: `function getMoneyAmount(n) {
  const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let width = 2; width <= n; width++) {
    for (let l = 1; l + width - 1 <= n; l++) {
      const r = l + width - 1;
      let best = Infinity;
      for (let k = l; k <= r; k++) best = Math.min(best, k + Math.max(dp[l][k - 1], dp[k + 1][r]));
      dp[l][r] = best;
    }
  }
  return dp[1][n];
}` } },
        starter: { py: 'class Solution:\n    def getMoneyAmount(self, n: int) -> int:\n        ', js: 'function getMoneyAmount(n) {\n  \n}' },
        tests: { fn: 'getMoneyAmount', cases: [
          { args: [1], out: 0 }, { args: [2], out: 1 }, { args: [3], out: 2 }, { args: [4], out: 4 }, { args: [5], out: 6 }, { args: [10], out: 16 }, { args: [20], out: 49 }] } },

      { lc: 1130,
        hints: ['The tree is built by repeatedly joining two **adjacent** leaves; a join costs the product of the largest leaf on each side. You could do interval DP: split at `k`, cost `max(l..k) * max(k+1..r)`.', 'Each time you join two neighbors, the **smaller** of the pair disappears from later maxima. So you want to remove small values while their neighbors are as small as possible.', 'Keep a stack that decreases from bottom to top. When a new value is at least the top, pop it: it is joined with the smaller of its two neighbors (the new value or the next stack entry). Finish by joining what is left.'],
        solution: { explain: 'The interval DP is O(n³), and it is the bridge to the answer. The O(n) version removes the smallest remaining value at each step, joined with its smaller neighbor, which a decreasing monotonic stack does directly. Time O(n), space O(n).', code: {
          py: `class Solution:
    def mctFromLeafValues(self, arr: List[int]) -> int:
        res = 0
        stack = [float('inf')]
        for x in arr:
            while stack[-1] <= x:
                mid = stack.pop()
                res += mid * min(stack[-1], x)
            stack.append(x)
        while len(stack) > 2:
            res += stack.pop() * stack[-1]
        return res`,
          js: `function mctFromLeafValues(arr) {
  let res = 0;
  const stack = [Infinity];
  for (const x of arr) {
    while (stack[stack.length - 1] <= x) {
      const mid = stack.pop();
      res += mid * Math.min(stack[stack.length - 1], x);
    }
    stack.push(x);
  }
  while (stack.length > 2) res += stack.pop() * stack[stack.length - 1];
  return res;
}` } },
        starter: { py: 'class Solution:\n    def mctFromLeafValues(self, arr: List[int]) -> int:\n        ', js: 'function mctFromLeafValues(arr) {\n  \n}' },
        tests: { fn: 'mctFromLeafValues', cases: [
          { args: [[6, 2, 4]], out: 32 }, { args: [[4, 11]], out: 44 }, { args: [[1, 2, 3, 4]], out: 20 }, { args: [[7, 12, 8, 10]], out: 284 }, { args: [[15, 13, 5, 3, 15]], out: 500 }, { args: [[3, 3, 3]], out: 18 }] } },

      { lc: 1547,
        hints: ['Cut order matters because each cut costs the length of the piece you are cutting right now.', 'Add the two ends of the stick to the sorted cut positions. In a range between positions `l` and `r`, think about which cut is made **first** on that piece: it costs the whole piece, `pos[r] - pos[l]`, and leaves two independent pieces.', '`dp[l][r] = pos[r] - pos[l] + min over k of dp[l][k] + dp[k][r]`, with `k` strictly between. Ranges with no cut inside cost 0.'],
        solution: { explain: 'Sort the cuts, add both ends, and run the interval table. The first cut in a piece costs its full length and leaves two independent pieces (equivalently, the last cut is the cheap one). O(m³) time, O(m²) space for m cuts.', code: {
          py: `class Solution:
    def minCost(self, n: int, cuts: List[int]) -> int:
        pos = [0] + sorted(cuts) + [n]
        m = len(pos)
        dp = [[0] * m for _ in range(m)]
        for width in range(2, m):
            for l in range(m - width):
                r = l + width
                dp[l][r] = pos[r] - pos[l] + min(dp[l][k] + dp[k][r] for k in range(l + 1, r))
        return dp[0][m - 1]`,
          js: `function minCost(n, cuts) {
  const pos = [0, ...[...cuts].sort((a, b) => a - b), n];
  const m = pos.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let width = 2; width < m; width++) {
    for (let l = 0; l + width < m; l++) {
      const r = l + width;
      let best = Infinity;
      for (let k = l + 1; k < r; k++) best = Math.min(best, dp[l][k] + dp[k][r]);
      dp[l][r] = pos[r] - pos[l] + best;
    }
  }
  return dp[0][m - 1];
}` } },
        starter: { py: 'class Solution:\n    def minCost(self, n: int, cuts: List[int]) -> int:\n        ', js: 'function minCost(n, cuts) {\n  \n}' },
        tests: { fn: 'minCost', cases: [
          { args: [7, [1, 3, 4, 5]], out: 16 }, { args: [9, [5, 6, 1, 4, 2]], out: 22 }, { args: [10, [5]], out: 10 }, { args: [12, [2, 4, 6, 8, 10]], out: 32 }, { args: [100, [25, 50, 75]], out: 200 }] } }
    ],

    mistakes: [
      '**Filling the table in the wrong order.** Looping `l` then `r` upward reads `dp[k][r]` before it exists. Loop by **increasing width**, or `l` from the end down to 0 with `r` upward. If the first sample is right and the second is off, suspect the order.',
      '**Thinking about the first action when the neighbors change.** In the balloon problem, picking the first burst leaves two sides that touch. If removing something changes what its neighbors see, **choose the last action** instead.',
      '**Open versus closed ranges mixed up.** Balloons use an open range `(l, r)` with walls that stay, so `k` runs `l+1` to `r-1` and the split is `dp[l][k] + dp[k][r]`. Merging piles uses a closed range `[l, r]` and splits as `dp[l][k] + dp[k+1][r]`. Pick one and write the base case to match.',
      '**Forgetting the sentinels.** Burst balloons needs a 1 on each end; cutting a stick needs `0` and `n` among the positions; triangulation uses the polygon’s own corners. Without them the edge cases (one balloon, one cut) go wrong.',
      '**Starting a minimum table at 0.** If you update only when `gain < dp[l][r]` and the table starts at zero, nothing ever updates. For min tables, take `min(...)` over the whole loop or start the cell at infinity.',
      '**Adding the range total on the wrong splits (merge stones).** Only add `sum(l..r)` when the range really collapses into one pile, that is, when `(width − 1) % (k − 1) == 0`. Also return -1 early if `(n − 1) % (k − 1) != 0`.',
      '**Overflow.** Products of three values and sums over a range exceed 32 bits quickly. Java and C++ need `long` or `long long` when limits are larger than the LeetCode ones; JavaScript numbers are exact only to 2⁵³.',
      '**Using it when n is large.** O(n³) with n = 5,000 does not finish. If the limit is big, look for a greedy or a monotonic stack (as in tree-from-leaf-values) before writing a table.'
    ],

    quiz: [
      { kind: 'concept', q: 'In the balloon problem, why do we ask which balloon bursts **last** in a range instead of first?',
        choices: ['Its neighbors at that moment are fixed (the walls), so the two sides are independent subproblems', 'Because bursting last is always cheaper', 'Because it avoids the need for a table', 'It makes the loop run backwards'], answer: 0,
        explain: 'If `k` bursts last in `(l, r)`, its neighbors at that moment are exactly `l` and `r`, and the left and right balloons never saw across `k`. Bursting first would make the neighbors touch and tie the two sides together.' },
      { kind: 'complexity', q: 'What is the time complexity of the standard `dp[l][r]` table with a loop over the split point `k`?',
        choices: ['O(n²)', 'O(n³)', 'O(n log n)', 'O(2ⁿ)'], answer: 1,
        explain: 'About n²/2 ranges, and each tries up to n split points with O(1) work: O(n³). It is practical for n up to a few hundred.' },
      { kind: 'bug', q: 'This fill order produces wrong answers. What is the bug?',
        code: `for l in range(n):
    for r in range(l + 2, n):
        for k in range(l + 1, r):
            dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l]*a[k]*a[r])`,
        choices: ['`dp[k][r]` is read before it is computed, because `k > l` means row `k` is not filled yet', 'The loop for `k` should start at 0', 'The table should be 1-D', 'There is no bug'], answer: 0,
        explain: 'Row `l` needs rows `k > l`, which come later in this order. Loop by increasing width, or run `l` downward from n − 1 to 0, so every shorter range is ready.' },
      { kind: 'pattern', q: 'Which of these is **not** a natural interval DP?',
        choices: ['Minimum cost to merge a row of piles, two adjacent at a time', 'The longest palindromic subsequence of a string', 'The largest sum of a contiguous subarray', 'Minimum score to triangulate a polygon'], answer: 2,
        explain: 'The maximum subarray is solved in one pass, with a state per **position** (Kadane). The others need the best answer for an arbitrary range `[l, r]` built from smaller ranges.' },
      { kind: 'concept', q: 'For guessing a number from 1 to n, the cost of guessing `k` in range `[l, r]` is…',
        choices: ['`k + max(dp[l][k-1], dp[k+1][r])`', '`k + min(dp[l][k-1], dp[k+1][r])`', '`k + dp[l][k-1] + dp[k+1][r]`', '`max(k, dp[l][r])`'], answer: 0,
        explain: 'A wrong guess leaves one of the two sides, and the adversary chooses the costlier one, so you pay the max. You then pick the best `k` with a min over all guesses.' },
      { kind: 'complexity', q: 'What is the space complexity of the balloon DP table, and can it be reduced to O(n)?',
        choices: ['O(n²), and not easily reduced, since cells read from many shorter ranges', 'O(n), always', 'O(n³)', 'O(1)'], answer: 0,
        explain: 'There are about n²/2 states. A cell reads `dp[l][k]` and `dp[k][r]` for every `k`, so you cannot keep a single row the way you can in many 2-D DPs.' },
      { kind: 'concept', q: 'Polygon triangulation: why is `dp[l][r] = min over k of dp[l][k] + dp[k][r] + v[l]·v[k]·v[r]` valid?',
        choices: ['The edge `(l, r)` lies in exactly one triangle with a third corner `k`, which splits the rest into two independent polygons', 'Every triangulation has the same triangles', 'The product is always smallest for the middle corner', 'It is a greedy choice'], answer: 0,
        explain: 'Each edge belongs to exactly one triangle of a triangulation. Trying every third corner `k` covers every triangulation, and the leftover polygons on `l..k` and `k..r` are independent.' },
      { kind: 'bug', q: 'A cut-the-stick DP returns 0 for every input. What is most likely wrong?',
        code: `dp = [[0] * m for _ in range(m)]
for width in range(2, m):
    for l in range(m - width):
        r = l + width
        for k in range(l + 1, r):
            if dp[l][k] + dp[k][r] < dp[l][r]:
                dp[l][r] = dp[l][k] + dp[k][r]`,
        choices: ['The table starts at 0 and the minimum is never lower, so nothing updates (and the piece length is never added)', 'The loop for `k` is too short', 'It needs a cache', 'Python integers overflow'], answer: 0,
        explain: 'For a minimum, start each cell at infinity (or take `min(...)` over the loop), and add the cost of the cut, `pos[r] - pos[l]`. With zeros everywhere, `< dp[l][r]` can never be true.' },
      { kind: 'concept', q: 'When can the O(n³) interval table be replaced by something faster? Pick every one that applies.',
        choices: ['Tree-from-leaf-values has an O(n) monotonic stack', 'Burst balloons has a known O(n log n) solution for all inputs', 'Longest palindromic subsequence needs only O(n²) because each state does O(1) work', 'Any interval DP can be a greedy'], answer: [0, 2],
        explain: 'Some interval-style problems have special structure (a stack, or O(1) transitions), but there is no general speedup and burst balloons stays O(n³).' },
      { kind: 'pattern', q: 'A problem asks for the cheapest way to combine a row of items, where each step merges **two neighbors** and costs their total. What is `dp[l][r]`?',
        choices: ['`min over k of dp[l][k] + dp[k+1][r]`, plus the sum of the range', 'The best of `dp[l-1][r]` and `dp[l][r-1]`', 'The sum of the range only', 'Always the smallest item'], answer: 0,
        explain: 'The last merge joins a left block and a right block, whatever the split, and costs the whole range total. A prefix-sum array gives that total in O(1).' }
    ],

    flashcards: [
      { id: 'state', front: 'Interval DP: what is the state?', back: '`dp[l][r]` = the best answer for the contiguous range from `l` to `r` (open or closed, decide once). The answer is the entry for the whole input.' },
      { id: 'fill-order', front: 'In what order do you fill `dp[l][r]`?', back: 'By **increasing length** (`width`), then each left end `l`. Every range then reads only shorter ranges that are already filled. (Or `l` downward, `r` upward.)' },
      { id: 'last-action', front: 'The last-action trick?', back: 'When removing or merging changes the neighbors, ask which action happens **last** in the range. At that moment its surroundings are fixed (the walls), and the two sides are independent subproblems.' },
      { id: 'burst', front: 'Burst balloons: the recurrence?', back: 'Pad with 1 on both ends. `dp[l][r] = max over k in (l, r) of dp[l][k] + dp[k][r] + a[l]*a[k]*a[r]`. Answer `dp[0][n-1]`. O(n³) time, O(n²) space.' },
      { id: 'triangulation', front: 'Polygon triangulation: the recurrence?', back: 'The edge `(l, r)` is in one triangle with third corner `k`: `dp[l][r] = min over k of dp[l][k] + dp[k][r] + v[l]*v[k]*v[r]`. An edge (two corners) costs 0.' },
      { id: 'cut-stick', front: 'Cutting a stick at marks: the recurrence?', back: 'Sort the marks and add both ends. `dp[l][r] = pos[r] - pos[l] + min over k of dp[l][k] + dp[k][r]`: the first cut in a piece costs its whole length and leaves two independent pieces.' },
      { id: 'merge-cost', front: 'Merging adjacent piles, cost = combined size: the recurrence?', back: '`dp[l][r] = min over k of dp[l][k] + dp[k+1][r]` plus `sum(l..r)` from a prefix array, since the last merge always costs the whole range. Same as matrix-chain multiplication.' },
      { id: 'guess-cost', front: 'Guess-the-number cost: the recurrence?', back: '`dp[l][r] = min over k of k + max(dp[l][k-1], dp[k+1][r])`. You choose the guess (min), the adversary chooses the side (max). Empty or one-number ranges cost 0.' },
      { id: 'merge-stones', front: 'Merge exactly k stones at a time: what changes?', back: 'Impossible unless `(n-1) % (k-1) == 0`. Split `m` in steps of `k-1`, and add the range sum only when `(width-1) % (k-1) == 0`, the case where the range collapses into one pile.' },
      { id: 'complexity', front: 'Interval DP cost and when to use it?', back: 'O(n³) time and O(n²) space (n²/2 states, n splits each). Use it when n is at most a few hundred; for larger n look for a greedy or a stack.' },
      { id: 'recognise', front: 'How do you recognise an interval DP?', back: 'The state is a **range** of the input, the range splits at one point into smaller ranges, and n is small. A row where order of removal matters is the biggest hint.' }
    ],

    deeper: [
      { title: 'Dynamic programming (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Dynamic_programming', time: 'about 15 min', note: 'Optimal substructure and overlapping subproblems, the two ideas every interval table relies on.' },
      { title: 'CP-Algorithms: Dynamic programming on ranges', url: 'https://cp-algorithms.com/dynamic_programming/intro-to-dp.html', time: 'about 15 min', note: 'A general introduction to states and transitions, which is the vocabulary interval DP uses.' },
      { title: 'Matrix chain multiplication (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Matrix_chain_multiplication', time: 'about 10 min', note: 'The textbook interval DP, and its link to polygon triangulation. Good for understanding why the table has this shape.' },
      { title: 'NeetCode Roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where interval DP sits among the other advanced DP topics; most people reach it last.' }
    ],

    detective: [
      { id: 'log-cutter',  decoys: ['greedy', 'dp-1d', 'backtracking'],
        statement: 'A sawmill gets one long log and an order sheet listing the exact marks where it has to be cut. The saw always cuts through whichever piece the operator puts on the bed, and the electricity bill for one cut equals the length of that piece, not the length of the offcut. The foreman can do the cuts in any order. He wants the order that makes the total bill smallest, and the log is long but the order sheet has at most a couple of hundred marks.',
        why: 'The order matters, but whichever cut comes first on a piece splits it into two independent pieces whose marks never interact again. The state is “the piece between two marks”, which is a range, and a few hundred marks hints at an O(n³) table over ranges.' },
      { id: 'crate-crew', decoys: ['greedy', 'heaps', 'dp-2d'],
        statement: 'In a warehouse, n crates sit in a single row, each with a weight. A crane can only join two crates that are **side by side**, and joining costs the combined weight of the two. The joined bundle then sits where they were, side by side with its new neighbors. The foreman wants everything in one bundle for the smallest total cost. A teammate says “always join the two lightest crates”, but those two might not be next to each other. How would you find the best order?',
        why: 'Only neighbors may be joined, so a plain greedy over the lightest items is not allowed. The last join always combines a left block of the row with a right block of the row, and each block is a contiguous range solved the same way: a table indexed by range, filled from short to long.' },
      { id: 'price-grids', decoys: ['dp-2d', 'recursion', 'backtracking'],
        statement: 'A retailer must multiply a sequence of rectangular price tables, A, B, C, … in that order, and the multiplication is associative, so the grouping is up to them. Combining a table with r rows and s columns and one with s rows and t columns costs r times s times t basic operations. Different groupings cost wildly different amounts. Given the dimensions of every table in the sequence (up to a few hundred of them), find the smallest total number of operations over all groupings.',
        why: 'Every grouping has one multiplication that happens last, splitting the chain into a left chain and a right chain that are solved independently. That is a split point over a contiguous range, with cost depending on the three boundary dimensions: the same table as the polygon and the balloons.' }
    ]
  });
})();
