/* Offer Ready: Knapsack family. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'knapsack',

    hook: 'Whenever a question says “pick some of these, each at most once (or any number of times), to hit a **target** or fill a **budget**”, you are in knapsack territory. Coin change, partition into equal halves, count the ways to pay, assign plus and minus signs: they are one table with a different question asked of it. The whole family costs one 1-D array and one loop direction, and Coin Change plus Partition Equal Subset Sum sit in NeetCode 150.',

    cues: [
      'You choose **some** of a list of items (a subset, not a contiguous run), and each choice has a cost against a budget: weight, a sum, a count of coins.',
      'The goal is a **target or limit** on a total: reach exactly `amount`, stay within a capacity, split into two equal sums.',
      'The question is “is it possible?”, “fewest”, “most value” or “how many ways”: the four classic questions on the same table.',
      'Brute force is “take it or leave it” for every item: 2ⁿ subsets, with the same (item, remaining budget) situations repeating.',
      'The numbers are **small integers**: a target in the thousands, not 10⁹. DP indexed by the sum only works because the sum is small.',
      'Count questions that care about **order** (1+2 and 2+1 are different) need one loop order; ones that don’t (a bag of coins) need the other.'
    ],

    intuition: [
      'Think of packing a suitcase with a weight limit. For each item you decide: leave it, or take it and spend its weight. The only thing that matters about what you already packed is **how much room is left**, not which items you used. That is why the problem collapses to a table: `dp[c]` is the best you can do with capacity `c`.',
      'The 0/1 version (each item once) in a sentence: after offering items `1..i`, `dp[c] = max(dp[c], dp[c - w] + v)`. Skip the item, or take it on top of the best answer for the smaller capacity `c - w`. The table is naturally 2-D (items × capacity), but each row only reads the row above, so one array is enough, **if you update it in the right direction**.',
      '**The direction is the whole lesson.** `dp[c]` reads `dp[c - w]`, a *smaller* index. If you walk capacity **downwards**, `dp[c - w]` has not been touched yet for this item: it still holds the previous row, so the item is used at most once (0/1). If you walk **upwards**, `dp[c - w]` was already updated for this item, so taking it again stacks a second copy on top: unlimited reuse (unbounded). Same line of code, one reversed `for`. Open the visualizer and flip the toggle on `3:5` with capacity 9: it answers 5, then 15.',
      'The same table answers different questions by changing what a cell holds and how two options combine: **max value** uses `max` and `+ v`; **reachable?** uses `or`; **fewest coins** uses `min` and `+ 1`; **number of ways** uses `+`. And for “ways”, the *loop nesting order* decides whether 1+2 and 2+1 are the same way: items outside means combinations, capacity outside means permutations.',
      'Precisely: state = `(items offered so far, remaining capacity)`, answer = the cell for the full capacity, base case = capacity 0 (or “nothing offered”), and the transition above. You do not need to enumerate subsets; you only need to know the budget.'
    ].join('\n\n'),

    viz: 'dp-knapsack',

    template: {
      title: '1-D knapsack: one array, and the capacity loop runs DOWN for 0/1',
      note: 'To reuse it, change three things and keep the skeleton: **what a cell means** (best value; or a boolean, a coin count, a number of ways), **how options combine** in the `@cell` line (`max` with `+ v`, `or`, `min` with `+ 1`, `+=`), and **the base case** (`dp[0]`). Then pick the direction: capacity **down** if each item may be used once, **up** if items repeat. Everything else, including the four problems below, is this skeleton.',
      code: {
        py: `def knapsack01(weights, values, cap):
    dp = [0] * (cap + 1)                          #> dp[c] = best value that fits in capacity c
    for i in range(len(weights)):                 #@item > 1. Offer the items one at a time
        w, v = weights[i], values[i]
        for c in range(cap, w - 1, -1):           #@loop > 2. 0/1: capacity goes DOWN, so dp[c - w] is still the row without this item (go UP to allow reuse)
            dp[c] = max(dp[c], dp[c - w] + v)     #@cell > 3. Skip the item, or take it on top of the smaller capacity
    return dp[cap]`,
        js: `function knapsack01(weights, values, cap) {
  const dp = new Array(cap + 1).fill(0);               //> dp[c] = best value that fits in capacity c
  for (let i = 0; i < weights.length; i++) {           //@item > 1. Offer the items one at a time
    const w = weights[i], v = values[i];
    for (let c = cap; c >= w; c--) {                   //@loop > 2. 0/1: capacity goes DOWN, so dp[c - w] is still the row without this item (go UP to allow reuse)
      dp[c] = Math.max(dp[c], dp[c - w] + v);          //@cell > 3. Skip the item, or take it on top of the smaller capacity
    }
  }
  return dp[cap];
}`,
        java: `class Solution {
    public int knapsack01(int[] weights, int[] values, int cap) {
        int[] dp = new int[cap + 1];                          //> dp[c] = best value that fits in capacity c
        for (int i = 0; i < weights.length; i++) {            //@item > 1. Offer the items one at a time
            int w = weights[i], v = values[i];
            for (int c = cap; c >= w; c--) {                  //@loop > 2. 0/1: capacity goes DOWN, so dp[c - w] is still the row without this item (go UP to allow reuse)
                dp[c] = Math.max(dp[c], dp[c - w] + v);       //@cell > 3. Skip the item, or take it on top of the smaller capacity
            }
        }
        return dp[cap];
    }
}`,
        cpp: `class Solution {
public:
    int knapsack01(vector<int> weights, vector<int> values, int cap) {
        vector<int> dp(cap + 1, 0);                           //> dp[c] = best value that fits in capacity c
        for (int i = 0; i < (int)weights.size(); i++) {       //@item > 1. Offer the items one at a time
            int w = weights[i], v = values[i];
            for (int c = cap; c >= w; c--) {                  //@loop > 2. 0/1: capacity goes DOWN, so dp[c - w] is still the row without this item (go UP to allow reuse)
                dp[c] = max(dp[c], dp[c - w] + v);            //@cell > 3. Skip the item, or take it on top of the smaller capacity
            }
        }
        return dp[cap];
    }
};`
      },
      tests: { fn: { py: 'knapsack01', default: 'knapsack01' }, sig: { args: ['int[]', 'int[]', 'int'] }, cases: [
        { args: [[1, 3, 4], [15, 20, 30], 4], out: 35 }, { args: [[2, 3, 4, 5], [3, 4, 5, 6], 5], out: 7 }, { args: [[5], [10], 4], out: 0 },
        { args: [[1], [7], 0], out: 0 }, { args: [[3], [5], 9], out: 5 }, { args: [[1, 3, 4], [1, 4, 5], 7], out: 9 }] }
    },

    complexity: {
      time: 'O(n · C)',
      space: 'O(C)',
      why: 'n items times C capacities, one O(1) update each. The 2-D table would take O(n · C) memory, but each item’s row reads only the row before it, so a single array of C + 1 cells is enough. Counts like “ways” can grow huge, so watch overflow when a problem asks for the count modulo something.',
      trap: 'This is **pseudo-polynomial**: C is a *value*, not an input size. With C around 10⁹ the table cannot exist, and the problem is NP-hard in general. Say so if asked: “O(n · target), fine because the target is small; not polynomial in the number of bits.”'
    },

    variations: [
      {
        name: 'Unbounded: flip the loop to go up',
        body: 'When every item is available **any number of times** (coins in a till, rods you can cut again and again), reverse the capacity loop. Now `dp[c - w]` has already been updated for this item, so “take it” can stack copies: `dp[c]` may use the item twice or ten times. This is the *only* change from the 0/1 template, and it is why the toggle in the visualizer exists. A good habit: ask “can I reuse an item?” first and let the answer pick the direction.',
        code: {
          py: `def knapsack_unbounded(weights, values, cap):
    dp = [0] * (cap + 1)
    for i in range(len(weights)):
        w, v = weights[i], values[i]
        for c in range(w, cap + 1):              #> UP: dp[c - w] may already include this item
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[cap]`,
          js: `function knapsackUnbounded(weights, values, cap) {
  const dp = new Array(cap + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i], v = values[i];
    for (let c = w; c <= cap; c++) {               //> UP: dp[c - w] may already include this item
      dp[c] = Math.max(dp[c], dp[c - w] + v);
    }
  }
  return dp[cap];
}`,
          java: `class Solution {
    public int knapsackUnbounded(int[] weights, int[] values, int cap) {
        int[] dp = new int[cap + 1];
        for (int i = 0; i < weights.length; i++) {
            int w = weights[i], v = values[i];
            for (int c = w; c <= cap; c++) {          //> UP: dp[c - w] may already include this item
                dp[c] = Math.max(dp[c], dp[c - w] + v);
            }
        }
        return dp[cap];
    }
}`,
          cpp: `class Solution {
public:
    int knapsackUnbounded(vector<int> weights, vector<int> values, int cap) {
        vector<int> dp(cap + 1, 0);
        for (int i = 0; i < (int)weights.size(); i++) {
            int w = weights[i], v = values[i];
            for (int c = w; c <= cap; c++) {          //> UP: dp[c - w] may already include this item
                dp[c] = max(dp[c], dp[c - w] + v);
            }
        }
        return dp[cap];
    }
};`
        },
        tests: { fn: { py: 'knapsack_unbounded', default: 'knapsackUnbounded' }, sig: { args: ['int[]', 'int[]', 'int'] }, cases: [
          { args: [[3], [5], 9], out: 15 }, { args: [[5, 3], [10, 5], 9], out: 15 }, { args: [[4], [3], 3], out: 0 }, { args: [[1, 3, 4], [1, 4, 5], 6], out: 8 }, { args: [[2, 3], [4, 7], 7], out: 15 }] }
      },
      {
        name: 'Subset sum: can some subset hit the target exactly?',
        body: 'Swap the cell’s meaning to a boolean: `dp[s]` is “some subset of the items offered so far sums to `s`”. The base case is `dp[0] = True` (the empty subset). The update is `dp[s] = dp[s] or dp[s - x]`, still downward because each number is used once. This is the engine inside Partition Equal Subset Sum and Last Stone Weight II. Remember to **stop at the target**: sums above it can never help when all numbers are non-negative.',
        code: {
          py: `def can_make(nums, target):
    dp = [True] + [False] * target            #> dp[s]: some subset sums to s. The empty subset makes 0
    for x in nums:
        for s in range(target, x - 1, -1):    #> DOWN: each number is used once
            dp[s] = dp[s] or dp[s - x]
    return dp[target]`,
          js: `function canMake(nums, target) {
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;                                    //> The empty subset makes 0
  for (const x of nums) {
    for (let s = target; s >= x; s--) {            //> DOWN: each number is used once
      dp[s] = dp[s] || dp[s - x];
    }
  }
  return dp[target];
}`,
          java: `class Solution {
    public boolean canMake(int[] nums, int target) {
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;                                 //> The empty subset makes 0
        for (int x : nums) {
            for (int s = target; s >= x; s--) {       //> DOWN: each number is used once
                dp[s] = dp[s] || dp[s - x];
            }
        }
        return dp[target];
    }
}`,
          cpp: `class Solution {
public:
    bool canMake(vector<int> nums, int target) {
        vector<char> dp(target + 1, 0);
        dp[0] = 1;                                    //> The empty subset makes 0
        for (int x : nums) {
            for (int s = target; s >= x; s--) {       //> DOWN: each number is used once
                dp[s] = dp[s] || dp[s - x];
            }
        }
        return dp[target];
    }
};`
        },
        tests: { fn: { py: 'can_make', default: 'canMake' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 34, 4, 12, 5, 2], 9], out: true }, { args: [[1, 2, 5], 4], out: false }, { args: [[7], 7], out: true }, { args: [[2, 2, 2], 3], out: false }, { args: [[1], 0], out: true }] }
      },
      {
        name: 'Min coins vs count ways: pick the loop order',
        body: '*Fewest coins* (322) uses `min` and `+ 1`, base `dp[0] = 0`, everything else “infinity”; order of the loops does not matter. *Count the ways* uses `+=`, base `dp[0] = 1`, and **the nesting decides what you count**. Coins in the outer loop, amount inside (the 518 solution) counts **combinations**: each coin is “closed” after its turn, so 1+2 and 2+1 can never both appear. Amount in the outer loop, coins inside (below, the 377 shape) counts **permutations**: at every amount you may end with any coin, so order matters and 1+2, 2+1 both count. Same recurrence, two loops swapped, different answers.',
        code: {
          py: `def count_orderings(coins, amount):
    dp = [1] + [0] * amount                   #> One way to make 0: use nothing
    for a in range(1, amount + 1):            #> Amount OUTSIDE: any coin may be the last one, so order counts
        for x in coins:
            if x <= a:
                dp[a] += dp[a - x]
    return dp[amount]`,
          js: `function countOrderings(coins, amount) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;                                       //> One way to make 0: use nothing
  for (let a = 1; a <= amount; a++) {              //> Amount OUTSIDE: any coin may be the last one, so order counts
    for (const x of coins) {
      if (x <= a) dp[a] += dp[a - x];
    }
  }
  return dp[amount];
}`,
          java: `class Solution {
    public int countOrderings(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;                                    //> One way to make 0: use nothing
        for (int a = 1; a <= amount; a++) {           //> Amount OUTSIDE: any coin may be the last one, so order counts
            for (int x : coins) {
                if (x <= a) dp[a] += dp[a - x];
            }
        }
        return (int) dp[amount];
    }
}`,
          cpp: `class Solution {
public:
    int countOrderings(vector<int> coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;                                    //> One way to make 0: use nothing
        for (int a = 1; a <= amount; a++) {           //> Amount OUTSIDE: any coin may be the last one, so order counts
            for (int x : coins) {
                if (x <= a) dp[a] += dp[a - x];
            }
        }
        return (int)dp[amount];
    }
};`
        },
        tests: { fn: { py: 'count_orderings', default: 'countOrderings' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 2, 3], 4], out: 7 }, { args: [[2], 3], out: 0 }, { args: [[9], 3], out: 0 }, { args: [[1, 2], 3], out: 3 }, { args: [[5], 0], out: 1 }] }
      },
      {
        name: 'Target sum: turn signs into a subset',
        body: 'If you must put `+` or `-` in front of every number to reach a target, let `P` be the numbers you give `+` and `N` the ones you give `-`. Then `P - N = target` and `P + N = total`, so `P = (total + target) / 2`. The question becomes “how many subsets sum to `P`?”: a 0/1 counting knapsack. If `|target| > total` or `total + target` is odd, the answer is 0. Worked example 494 below does this with code. The trick generalizes: whenever a problem splits a set into two groups, express one group’s sum in terms of the total.'
      },
      {
        name: 'Bitset subset sum: the whole row in one shift',
        body: 'The boolean row is a string of bits, and “`dp[s] or dp[s - x]` for every `s`” is one operation: `bits |= bits << x`. Bit `s` of `bits` says “sum `s` is reachable”. The loop over capacity vanishes (and the 0/1 hazard with it, because the right-hand side is computed from the old value before the assignment). Python’s big integers do this directly; C++ uses `bitset<N>` and gets a 32 to 64 times speedup; Java needs `BigInteger`. The complexity is still O(n · target), but divided by the word size. Interviewers like hearing it as an optimization after the plain version.',
        code: {
          py: `def can_make_bits(nums, target):
    bits = 1                                  #> Bit s is set when some subset sums to s. Bit 0: the empty subset
    for x in nums:
        bits |= bits << x                     #> Every reachable sum s also makes s + x. One shift does all of them at once
    return bool((bits >> target) & 1)`,
          js: `function canMakeBits(nums, target) {
  let bits = 1n;                                   //> Bit s is set when some subset sums to s. Bit 0: the empty subset
  for (const x of nums) bits |= bits << BigInt(x); //> Every reachable sum s also makes s + x
  return ((bits >> BigInt(target)) & 1n) === 1n;
}`,
          java: `class Solution {
    public boolean canMakeBits(int[] nums, int target) {
        java.math.BigInteger bits = java.math.BigInteger.ONE;   //> Bit s is set when some subset sums to s
        for (int x : nums) bits = bits.or(bits.shiftLeft(x));   //> Every reachable sum s also makes s + x
        return bits.testBit(target);
    }
}`,
          cpp: `class Solution {
public:
    bool canMakeBits(vector<int> nums, int target) {
        bitset<10001> bits(1);                        //> Bit s is set when some subset sums to s (target up to 10000)
        for (int x : nums) bits |= bits << x;         //> Every reachable sum s also makes s + x
        return bits[target];
    }
};`
        },
        tests: { fn: { py: 'can_make_bits', default: 'canMakeBits' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 34, 4, 12, 5, 2], 9], out: true }, { args: [[1, 2, 5], 4], out: false }, { args: [[7], 7], out: true }, { args: [[2, 2, 2], 3], out: false }, { args: [[1], 0], out: true }] }
      },
      {
        name: 'Two budgets at once (multi-dimensional)',
        body: 'Sometimes an item costs more than one resource: a string uses some zeros **and** some ones, a task uses CPU **and** memory. The table gets one dimension per budget, and each item updates it by walking **every** dimension downward (for 0/1). `dp[i][j]` is the most items you can take within `i` of the first budget and `j` of the second. This is Ones and Zeroes (474). The cost is O(items · m · n) time and O(m · n) space; the direction rule is unchanged, just applied twice.',
        code: {
          py: `def max_form(strs, m, n):
    dp = [[0] * (n + 1) for _ in range(m + 1)]     #> dp[i][j]: most strings using at most i zeros and j ones
    for s in strs:
        z = s.count('0'); o = len(s) - z
        for i in range(m, z - 1, -1):              #> Both budgets go DOWN: each string is used once
            for j in range(n, o - 1, -1):
                dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1)
    return dp[m][n]`,
          js: `function maxForm(strs, m, n) {
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));   //> dp[i][j]: most strings using at most i zeros and j ones
  for (const s of strs) {
    let z = 0;
    for (const ch of s) if (ch === '0') z++;
    const o = s.length - z;
    for (let i = m; i >= z; i--) {                 //> Both budgets go DOWN: each string is used once
      for (let j = n; j >= o; j--) dp[i][j] = Math.max(dp[i][j], dp[i - z][j - o] + 1);
    }
  }
  return dp[m][n];
}`,
          java: `class Solution {
    public int maxForm(String[] strs, int m, int n) {
        int[][] dp = new int[m + 1][n + 1];                //> dp[i][j]: most strings using at most i zeros and j ones
        for (String s : strs) {
            int z = 0;
            for (int k = 0; k < s.length(); k++) if (s.charAt(k) == '0') z++;
            int o = s.length() - z;
            for (int i = m; i >= z; i--) {                 //> Both budgets go DOWN: each string is used once
                for (int j = n; j >= o; j--) dp[i][j] = Math.max(dp[i][j], dp[i - z][j - o] + 1);
            }
        }
        return dp[m][n];
    }
}`,
          cpp: `class Solution {
public:
    int maxForm(vector<string> strs, int m, int n) {
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));   //> dp[i][j]: most strings using at most i zeros and j ones
        for (const string& s : strs) {
            int z = (int)count(s.begin(), s.end(), '0');
            int o = (int)s.size() - z;
            for (int i = m; i >= z; i--) {                 //> Both budgets go DOWN: each string is used once
                for (int j = n; j >= o; j--) dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1);
            }
        }
        return dp[m][n];
    }
};`
        },
        tests: { fn: { py: 'max_form', default: 'maxForm' }, sig: { args: ['str[]', 'int', 'int'] }, cases: [
          { args: [['10', '0001', '111001', '1', '0'], 5, 3], out: 4 }, { args: [['10', '0', '1'], 1, 1], out: 2 }, { args: [['0'], 0, 0], out: 0 },
          { args: [['00', '11'], 2, 2], out: 2 }, { args: [['0', '0', '0'], 2, 5], out: 2 }] }
      }
    ],

    worked: [
      {
        lc: 322,
        restate: 'You have coin denominations, with as many coins of each as you like, and a target amount. Return the fewest coins that add up to exactly that amount, or −1 if no combination works.',
        examples: '- `coins = [1, 2, 5]`, `amount = 11` → 3 (5 + 5 + 1).\n- `coins = [2]`, `amount = 3` → −1.\n- `amount = 0` → 0: no coins needed.\n- The trap for a greedy “biggest coin first” idea: `coins = [1, 3, 4]`, `amount = 6` → 2 (3 + 3), but greedy takes 4 + 1 + 1 = 3 coins.',
        brute: 'Recurse: to make `a`, try every coin `c` and solve `a − c`, keep the minimum. Without memory the same remainders are solved over and over, exponential in the amount. With a cache keyed on the remainder it is already O(amount · coins); the bottom-up array is the same table without recursion.',
        insight: 'This is **unbounded knapsack with `min`**. Let `dp[a]` be the fewest coins for amount `a`. Every optimal answer for `a` ends with some coin `c`, and what precedes it is an optimal answer for `a − c`. So `dp[a] = min(dp[a], dp[a − c] + 1)`. Coins repeat, so the amount loop goes **up**. Start with `dp[0] = 0` and everything else “infinity” (use `amount + 1`, which no real answer can reach), and report −1 if the target stays infinite.',
        code: {
          py: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        INF = amount + 1                        # more coins than any real answer could use
        dp = [0] + [INF] * amount
        for c in coins:
            for a in range(c, amount + 1):      # upward: a coin may be reused
                dp[a] = min(dp[a], dp[a - c] + 1)
        return dp[amount] if dp[amount] != INF else -1`,
          js: `function coinChange(coins, amount) {
  const INF = amount + 1;                       // more coins than any real answer could use
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) {         // upward: a coin may be reused
      dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === INF ? -1 : dp[amount];
}`,
          java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int INF = amount + 1;                       // more coins than any real answer could use
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) {     // upward: a coin may be reused
                dp[a] = Math.min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
}`,
          cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int INF = amount + 1;                       // more coins than any real answer could use
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) {     // upward: a coin may be reused
                dp[a] = min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
};`
        },
        complexity: 'O(amount · coins) time, O(amount) space.',
        say: '“Each amount’s best answer ends in some coin, and the rest is the best answer for the smaller amount, so it’s a DP over amounts: `dp[a] = min(dp[a − c] + 1)`. Coins are unlimited, so I loop upward over amounts for each coin. `dp[0]` is 0, everything else starts at infinity, and if the target is still infinity I return −1. Greedy fails on `[1, 3, 4]` with 6. Time is amount times coin count, space is one array.”',
        followups: [
          { q: 'Why not greedy?', a: 'Greedy works only for special coin systems (like US coins). With `[1, 3, 4]` and 6, taking the biggest coin first gives 4 + 1 + 1, but 3 + 3 uses fewer.' },
          { q: 'Does the loop order of coins and amounts matter here?', a: 'Not for `min`: both orders fill every cell with the same minimum. It matters for *counting* ways, where it decides combinations versus permutations (see 518).' },
          { q: 'How would you return the coins used, not just the count?', a: 'Store `choice[a]`, the coin that gave the minimum, then walk back from `amount` subtracting `choice[a]` until you reach 0.' },
          { q: 'What if the amount is huge, like 10⁹?', a: 'The table cannot exist. You would need number theory or a different formulation (for instance, only a few coin kinds with a cheap greedy structure). Say it is pseudo-polynomial.' }
        ]
      },
      {
        lc: 416,
        restate: 'Given an array of positive integers, decide whether it can be split into two groups with the same sum.',
        examples: '- `[1, 5, 11, 5]` → true: `[1, 5, 5]` and `[11]`, both 11.\n- `[1, 2, 3, 5]` → false (total 11 is odd).\n- `[2, 2, 3, 5]` → false: total 12, but no subset makes 6.\n- A single element can never be split into two equal groups, so → false.',
        brute: 'Try every subset and check for sum = total / 2: 2ⁿ subsets. A recursion that decides take-or-skip per element revisits the same (index, remaining) pairs.',
        insight: 'Two equal halves means one subset sums to `total / 2`. If the total is odd, stop. Otherwise this is **0/1 subset sum** with target `half`: `dp[s]` is true if some subset of the numbers seen so far sums to `s`. Each number is used once, so the sum loop goes **down**; with the loop going up, a number could be counted twice (`[3]` would “make” 6).',
        code: {
          py: `class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)
        if total % 2:
            return False
        half = total // 2
        dp = [True] + [False] * half            # dp[s]: some subset sums to s
        for x in nums:
            for s in range(half, x - 1, -1):    # downward: each number is used once
                dp[s] = dp[s] or dp[s - x]
        return dp[half]`,
          js: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const half = total / 2;
  const dp = new Array(half + 1).fill(false);   // dp[s]: some subset sums to s
  dp[0] = true;
  for (const x of nums) {
    for (let s = half; s >= x; s--) {           // downward: each number is used once
      dp[s] = dp[s] || dp[s - x];
    }
  }
  return dp[half];
}`,
          java: `class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int half = total / 2;
        boolean[] dp = new boolean[half + 1];       // dp[s]: some subset sums to s
        dp[0] = true;
        for (int x : nums) {
            for (int s = half; s >= x; s--) {       // downward: each number is used once
                dp[s] = dp[s] || dp[s - x];
            }
        }
        return dp[half];
    }
}`,
          cpp: `class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % 2) return false;
        int half = total / 2;
        vector<char> dp(half + 1, 0);               // dp[s]: some subset sums to s
        dp[0] = 1;
        for (int x : nums) {
            for (int s = half; s >= x; s--) {       // downward: each number is used once
                dp[s] = dp[s] || dp[s - x];
            }
        }
        return dp[half];
    }
};`
        },
        complexity: 'O(n · total / 2) time, O(total / 2) space. A bitset (see Variations) divides the time by the machine word size.',
        say: '“Two equal groups means a subset summing to half the total, so first I reject an odd total. Then it’s 0/1 subset sum: `dp[s]` says whether some subset reaches `s`. I update it per number, going from `half` down to the number so each number is used once. Time is n times half the total, space is half the total.”',
        followups: [
          { q: 'Why must the inner loop go downward?', a: 'Going upward lets `dp[s − x]` already include `x`, so a number could be used twice. `[3]` would wrongly reach 6.' },
          { q: 'Can you speed it up?', a: 'Use a bitset: `bits |= bits << x`. Or exit early once `dp[half]` is true. Also, if any number exceeds `half`, the answer is false.' },
          { q: 'What if you must return the two groups?', a: 'Keep a 2-D table (or parent pointers) so you can walk back which numbers set each cell, then the rest of the numbers form the other group.' },
          { q: 'What changes for three equal groups?', a: 'The state needs more information (how full the first two groups are), so it becomes a bitmask or backtracking problem, no longer a one-sum knapsack.' }
        ]
      },
      {
        lc: 518,
        restate: 'Given coin denominations, each usable any number of times, and an amount, return the number of different combinations of coins that sum to the amount. The order of coins within a combination does not matter.',
        examples: '- `amount = 5`, `coins = [1, 2, 5]` → 4: 5; 2+2+1; 2+1+1+1; 1+1+1+1+1.\n- `amount = 3`, `coins = [2]` → 0.\n- `amount = 0` → 1: the empty combination.\n- 1+2 and 2+1 are the **same** combination here, which is the whole point.',
        brute: 'Recurse over (coin index, remaining amount): take another copy of this coin, or move to the next coin. Without a cache that branches exponentially; with a cache it is exactly the table below.',
        insight: 'This is **unbounded knapsack with `+`**: `dp[a]` is the number of combinations that make `a`, with `dp[0] = 1`. To count each combination once, fix an order of coins and only ever add a coin whose turn it is: put the **coins in the outer loop**, amounts inside, going up. When coin `c` finishes its turn, no later coin can come before it, so 1+2 appears and 2+1 never does. Swap the loops and you count permutations (377).',
        code: {
          py: `class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        dp = [1] + [0] * amount               # one way to make 0
        for c in coins:                       # coins outside: counts combinations
            for a in range(c, amount + 1):    # upward: a coin may repeat
                dp[a] += dp[a - c]
        return dp[amount]`,
          js: `function change(amount, coins) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;                                  // one way to make 0
  for (const c of coins) {                    // coins outside: counts combinations
    for (let a = c; a <= amount; a++) {       // upward: a coin may repeat
      dp[a] += dp[a - c];
    }
  }
  return dp[amount];
}`,
          java: `class Solution {
    public int change(int amount, int[] coins) {
        int[] dp = new int[amount + 1];
        dp[0] = 1;                                // one way to make 0
        for (int c : coins) {                     // coins outside: counts combinations
            for (int a = c; a <= amount; a++) {   // upward: a coin may repeat
                dp[a] += dp[a - c];
            }
        }
        return dp[amount];
    }
}`,
          cpp: `class Solution {
public:
    int change(int amount, vector<int>& coins) {
        vector<unsigned> dp(amount + 1, 0);
        dp[0] = 1;                                // one way to make 0
        for (int c : coins) {                     // coins outside: counts combinations
            for (int a = c; a <= amount; a++) {   // upward: a coin may repeat
                dp[a] += dp[a - c];
            }
        }
        return (int)dp[amount];
    }
};`
        },
        complexity: 'O(amount · coins) time, O(amount) space.',
        say: '“It’s unbounded knapsack where I count instead of minimize, with `dp[0] = 1`. To count combinations rather than orderings, the coin loop is the outer one: each coin is added in a fixed order, so 1+2 is counted but 2+1 is not. Inner loop goes upward because coins repeat. If the loops were swapped it would count permutations.”',
        followups: [
          { q: 'What happens if you swap the loops?', a: 'You count ordered sequences (permutations): for amount 3 with `[1, 2]` you get 3 (1+1+1, 1+2, 2+1) instead of 2.' },
          { q: 'Why is `dp[0] = 1` and not 0?', a: 'There is exactly one way to make nothing: pick no coins. With 0, every count would stay 0.' },
          { q: 'Can the answer overflow?', a: 'The problem promises it fits in 32 bits for the final answer, but unreachable intermediate cells can exceed it in some languages. An unsigned type (C++) or `long` is a cheap guard.' },
          { q: 'What if each coin may be used at most once?', a: 'Make the amount loop go **down**: that is the 0/1 counting knapsack, as in Target Sum.' }
        ]
      },
      {
        lc: 494,
        restate: 'You get an array of non-negative integers and a target. Put a `+` or `-` in front of every number. Return how many sign assignments make the expression equal the target.',
        examples: '- `nums = [1, 1, 1, 1, 1]`, `target = 3` → 5: any one of the five ones takes the minus.\n- `nums = [1]`, `target = 1` → 1.\n- `nums = [1]`, `target = 2` → 0.\n- `nums = [0, 0, 1]`, `target = 1` → 4: each zero can take either sign, so the count doubles per zero.',
        brute: 'Try both signs for each element: 2ⁿ assignments. Memoizing on (index, running sum) gives O(n · total), the same size as the table below.',
        insight: 'Let `P` be the sum of the numbers that get `+` and `N` the sum of those that get `-`. Then `P − N = target` and `P + N = total`, so `P = (total + target) / 2`. Choosing signs is the same as choosing **which subset** gets `+`: count the subsets that sum to `P`. That is 0/1 knapsack with `+`, going **down**. If `|target| > total` or `total + target` is odd, nothing works. Zeros need no special care: `dp[s] += dp[s]` doubles the count.',
        code: {
          py: `class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        total = sum(nums)
        if abs(target) > total or (total + target) % 2:
            return 0
        need = (total + target) // 2            # the sum of the numbers that get a plus
        dp = [1] + [0] * need                   # one way to make 0: the empty subset
        for x in nums:
            for s in range(need, x - 1, -1):    # downward: each number is used once
                dp[s] += dp[s - x]
        return dp[need]`,
          js: `function findTargetSumWays(nums, target) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > total || (total + target) % 2) return 0;
  const need = (total + target) / 2;            // the sum of the numbers that get a plus
  const dp = new Array(need + 1).fill(0);
  dp[0] = 1;                                    // one way to make 0: the empty subset
  for (const x of nums) {
    for (let s = need; s >= x; s--) {           // downward: each number is used once
      dp[s] += dp[s - x];
    }
  }
  return dp[need];
}`,
          java: `class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int total = 0;
        for (int x : nums) total += x;
        if (Math.abs(target) > total || (total + target) % 2 != 0) return 0;
        int need = (total + target) / 2;            // the sum of the numbers that get a plus
        int[] dp = new int[need + 1];
        dp[0] = 1;                                  // one way to make 0: the empty subset
        for (int x : nums) {
            for (int s = need; s >= x; s--) {       // downward: each number is used once
                dp[s] += dp[s - x];
            }
        }
        return dp[need];
    }
}`,
          cpp: `class Solution {
public:
    int findTargetSumWays(vector<int>& nums, int target) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (abs(target) > total || (total + target) % 2) return 0;
        int need = (total + target) / 2;            // the sum of the numbers that get a plus
        vector<int> dp(need + 1, 0);
        dp[0] = 1;                                  // one way to make 0: the empty subset
        for (int x : nums) {
            for (int s = need; s >= x; s--) {       // downward: each number is used once
                dp[s] += dp[s - x];
            }
        }
        return dp[need];
    }
};`
        },
        complexity: 'O(n · (total + target) / 2) time, O(that) space.',
        say: '“If P is the sum of the plus group and N the minus group, then P − N = target and P + N = total, so P = (total + target) / 2. That turns signs into a subset: count subsets that sum to P. I reject the case where |target| exceeds the total or the parity is wrong, then run a 0/1 counting knapsack, with the sum loop going down so each number is used once.”',
        followups: [
          { q: 'Why is it a 0/1 knapsack and not unbounded?', a: 'Each number gets exactly one sign, so it contributes once. Going downward guarantees that.' },
          { q: 'Why does `dp[s] += dp[s]` for a zero give the right count?', a: 'A zero can sit in the plus group or the minus group without changing either sum, so every existing subset count doubles.' },
          { q: 'Why does a negative target work?', a: 'The sign flip is symmetric: `target` and `−target` have the same count, so the formula with `total + target` works for either (after the abs check).' },
          { q: 'What if the numbers can be negative?', a: 'The transform no longer gives non-negative indexes. Use a hash map keyed on the running sum, one dictionary per step, or shift the indexes by an offset.' }
        ]
      }
    ],

    practice: [
      { lc: 322,
        hints: ['Define `dp[a]` as the fewest coins that make amount `a`. What is `dp[0]`, and what should unreachable amounts hold?', 'The best answer for `a` ends with some coin `c`, preceded by the best answer for `a - c`. So `dp[a] = min(dp[a], dp[a - c] + 1)`.', 'Coins repeat, so loop the amount **upward** for each coin. Use `amount + 1` as infinity and return −1 if the target is still infinite.'],
        starter: { py: 'class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ', js: 'function coinChange(coins, amount) {\n  \n}' },
        tests: { fn: 'coinChange', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 2, 5], 11], out: 3 }, { args: [[2], 3], out: -1 }, { args: [[1], 0], out: 0 }, { args: [[1, 3, 4], 6], out: 2 }, { args: [[186, 419, 83, 408], 6249], out: 20 }, { args: [[2, 5, 10, 1], 27], out: 4 }] } },

      { lc: 416,
        hints: ['Two equal groups means one group sums to half the total. When is that impossible right away?', 'Now ask a yes/no question: can some subset sum to `half`? Let `dp[s]` be true when a subset of the numbers seen so far reaches `s`.', 'For each number, update `dp[s] = dp[s] or dp[s - x]` with `s` going **downward** from `half` to `x`, so a number is used once.'],
        starter: { py: 'class Solution:\n    def canPartition(self, nums: List[int]) -> bool:\n        ', js: 'function canPartition(nums) {\n  \n}' },
        tests: { fn: 'canPartition', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 5, 11, 5]], out: true }, { args: [[1, 2, 3, 5]], out: false }, { args: [[2, 2, 3, 5]], out: false }, { args: [[1, 1]], out: true }, { args: [[100]], out: false }, { args: [[1, 2, 5]], out: false }] } },

      { lc: 518,
        hints: ['You count ways, so a cell holds a number of ways, and combining options is addition. What is `dp[0]`?', 'For each coin, `dp[a] += dp[a - coin]`: ways to make `a` that end with this coin, on top of the ways without it.', 'To count combinations (not orderings), keep **coins in the outer loop** and amounts inside, going upward.'],
        starter: { py: 'class Solution:\n    def change(self, amount: int, coins: List[int]) -> int:\n        ', js: 'function change(amount, coins) {\n  \n}' },
        tests: { fn: 'change', sig: { args: ['int', 'int[]'] }, cases: [
          { args: [5, [1, 2, 5]], out: 4 }, { args: [3, [2]], out: 0 }, { args: [10, [10]], out: 1 }, { args: [0, [7]], out: 1 }, { args: [4, [1, 2, 3]], out: 4 }] } },

      { lc: 494,
        hints: ['Call the sum of the plus group `P` and the minus group `N`. You know `P - N = target` and `P + N = total`.', 'Solve for `P = (total + target) / 2`. When is that impossible? Then you are counting subsets that sum to `P`.', 'Count subsets with a 0/1 counting knapsack: `dp[0] = 1`, and for each number `dp[s] += dp[s - x]` with `s` going **downward**.'],
        starter: { py: 'class Solution:\n    def findTargetSumWays(self, nums: List[int], target: int) -> int:\n        ', js: 'function findTargetSumWays(nums, target) {\n  \n}' },
        tests: { fn: 'findTargetSumWays', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 1, 1, 1, 1], 3], out: 5 }, { args: [[1], 1], out: 1 }, { args: [[1], 2], out: 0 }, { args: [[0, 0, 1], 1], out: 4 }, { args: [[1, 0], 1], out: 2 }, { args: [[100], -200], out: 0 }] } },

      { lc: 474,
        hints: ['Each string costs some zeros and some ones, and you want the most strings within both budgets. What would `dp[i][j]` mean?', 'Treat each string as a 0/1 item with a two-part weight `(zeros, ones)` and value 1: `dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1)`.', 'Each string is used once, so loop **both** `i` from `m` down to `z` and `j` from `n` down to `o`.'],
        solution: { explain: 'A 0/1 knapsack with two capacities. Count each string’s zeros and ones, then update the table downward in both dimensions. O(len(strs) · m · n) time, O(m · n) space.', code: {
          py: `class Solution:
    def findMaxForm(self, strs: List[str], m: int, n: int) -> int:
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for s in strs:
            z = s.count('0')
            o = len(s) - z
            for i in range(m, z - 1, -1):
                for j in range(n, o - 1, -1):
                    dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1)
        return dp[m][n]`,
          js: `function findMaxForm(strs, m, n) {
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (const s of strs) {
    let z = 0;
    for (const ch of s) if (ch === '0') z++;
    const o = s.length - z;
    for (let i = m; i >= z; i--) {
      for (let j = n; j >= o; j--) dp[i][j] = Math.max(dp[i][j], dp[i - z][j - o] + 1);
    }
  }
  return dp[m][n];
}` } },
        starter: { py: 'class Solution:\n    def findMaxForm(self, strs: List[str], m: int, n: int) -> int:\n        ', js: 'function findMaxForm(strs, m, n) {\n  \n}' },
        tests: { fn: 'findMaxForm', sig: { args: ['str[]', 'int', 'int'] }, cases: [
          { args: [['10', '0001', '111001', '1', '0'], 5, 3], out: 4 }, { args: [['10', '0', '1'], 1, 1], out: 2 }, { args: [['0'], 0, 0], out: 0 }, { args: [['00', '11'], 2, 2], out: 2 }, { args: [['0', '0', '0'], 2, 5], out: 2 }] } },

      { lc: 1049,
        hints: ['Smashing stones together leaves a leftover weight. Think of the stones as split into two piles, one pile “plus” and one “minus”.', 'The leftover is `total - 2 * pile`, where `pile` is the sum of the smaller group. So you want the largest reachable sum that is at most `total / 2`.', 'Run the 0/1 subset-sum boolean table up to `total // 2`, then scan down from `total // 2` for the first reachable sum.'],
        solution: { explain: 'Every way of smashing corresponds to splitting the stones into two groups; the final leftover is the difference of the group sums. Minimize it by making the smaller group’s sum as close to `total / 2` as possible: 0/1 subset sum, then scan for the best reachable sum. O(n · total) time, O(total) space.', code: {
          py: `class Solution:
    def lastStoneWeightII(self, stones: List[int]) -> int:
        total = sum(stones)
        half = total // 2
        dp = [True] + [False] * half
        for x in stones:
            for s in range(half, x - 1, -1):
                dp[s] = dp[s] or dp[s - x]
        for s in range(half, -1, -1):
            if dp[s]:
                return total - 2 * s`,
          js: `function lastStoneWeightII(stones) {
  const total = stones.reduce((a, b) => a + b, 0);
  const half = Math.floor(total / 2);
  const dp = new Array(half + 1).fill(false);
  dp[0] = true;
  for (const x of stones) {
    for (let s = half; s >= x; s--) dp[s] = dp[s] || dp[s - x];
  }
  for (let s = half; s >= 0; s--) {
    if (dp[s]) return total - 2 * s;
  }
}` } },
        starter: { py: 'class Solution:\n    def lastStoneWeightII(self, stones: List[int]) -> int:\n        ', js: 'function lastStoneWeightII(stones) {\n  \n}' },
        tests: { fn: 'lastStoneWeightII', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 7, 4, 1, 8, 1]], out: 1 }, { args: [[31, 26, 33, 21, 40]], out: 5 }, { args: [[1]], out: 1 }, { args: [[1, 2]], out: 1 }, { args: [[3, 3]], out: 0 }] } },

      { lc: 377,
        hints: ['Here 1+2 and 2+1 count as different answers. Which loop order counts sequences, amounts outside or coins outside?', 'Let `dp[a]` be the number of ordered sequences summing to `a`, with `dp[0] = 1`. Any sequence ends with some number `x`: add `dp[a - x]`.', 'Put the **amount in the outer loop** and the numbers inside, adding `dp[a - x]` whenever `x <= a`.'],
        solution: { explain: 'Counting ordered sequences: at every amount, any number may be the last one. That makes the amount loop the outer loop (the opposite of Coin Change II). O(target · n) time, O(target) space.', code: {
          py: `class Solution:
    def combinationSum4(self, nums: List[int], target: int) -> int:
        dp = [1] + [0] * target
        for a in range(1, target + 1):
            for x in nums:
                if x <= a:
                    dp[a] += dp[a - x]
        return dp[target]`,
          js: `function combinationSum4(nums, target) {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;
  for (let a = 1; a <= target; a++) {
    for (const x of nums) {
      if (x <= a) dp[a] += dp[a - x];
    }
  }
  return dp[target];
}` } },
        starter: { py: 'class Solution:\n    def combinationSum4(self, nums: List[int], target: int) -> int:\n        ', js: 'function combinationSum4(nums, target) {\n  \n}' },
        tests: { fn: 'combinationSum4', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 2, 3], 4], out: 7 }, { args: [[9], 3], out: 0 }, { args: [[1, 2], 3], out: 3 }, { args: [[1], 5], out: 1 }, { args: [[2, 1, 3], 4], out: 7 }] } }
    ],

    mistakes: [
      '**Wrong loop direction.** 0/1 (each item once) loops capacity **down**; unbounded (reuse allowed) loops it **up**. Going up on a 0/1 problem silently lets an item be used twice: `[3]` “reaches” 6. If a 0/1 answer is suspiciously large, check this first.',
      '**Swapping the item and capacity loops in the 1-D version.** The items must be the outer loop. With capacity outside and items inside, the single array no longer represents “items offered so far”, and 0/1 becomes wrong.',
      '**Counting permutations when combinations were asked (or the reverse).** Coins outside, amount inside = combinations (518). Amount outside, coins inside = ordered sequences (377). Read whether 1+2 and 2+1 are the same answer before you pick the nesting.',
      '**Bad base cases.** Min-coins needs `dp[0] = 0` and everything else *infinity*; counting needs `dp[0] = 1`; reachability needs `dp[0] = True`. Starting a min table at 0 makes every amount “free”; starting a count table at 0 keeps it 0 forever.',
      '**Infinity overflow.** `INT_MAX + 1` wraps in Java and C++. Use `amount + 1` as infinity (no real answer exceeds `amount` coins when each coin is at least 1), or guard with `dp[a - c] != INF` before adding.',
      '**Forgetting the parity and range check in Target Sum.** `(total + target)` must be even and `|target| <= total`, or the “subset sum” index is fractional or negative. Check both before building the table.',
      '**Skipping the “odd total” early exit in the partition problem.** It is correct without it but wastes a whole table, and many interviewers expect to see it.',
      '**Language gotchas.** *Python:* `[[0] * n] * m` makes `m` aliases of the same row, so one update appears in every row; build rows with a comprehension. `range(cap, w - 1, -1)`: forgetting the `- 1` skips `c = w`. *JavaScript:* `new Array(n).fill([])` shares one array; for big counts, numbers lose precision past 2⁵³. *Java:* `new int[amount + 1]` starts at 0, not infinity, so use `Arrays.fill`; int counts silently wrap. *C++:* signed overflow is undefined behavior, so use `unsigned` or `long long` for counts; `vector<bool>` is a packed proxy type, so prefer `vector<char>` in hot loops.'
    ],

    quiz: [
      { kind: 'concept', q: 'In the 1-D 0/1 knapsack, the capacity loop runs from `cap` **down** to the item weight. Why?',
        choices: ['So `dp[c - w]` has not yet been updated for this item, and the item is used at most once', 'To make the code run faster', 'So the array is filled in sorted order', 'Because Python’s `range` requires it'], answer: 0,
        explain: '`dp[c]` reads `dp[c - w]`, a smaller index. Going down means that smaller cell is still the previous row. Going up means it already includes this item, which would let an item repeat.' },
      { kind: 'concept', q: 'Which change turns the 0/1 knapsack template into the unbounded one?',
        choices: ['Run the capacity loop upward', 'Replace `max` with `min`', 'Start `dp[0]` at 1', 'Sort the items first'], answer: 0,
        explain: 'Only the direction changes. Upward, `dp[c - w]` can already contain the item, so taking it again stacks copies.' },
      { kind: 'complexity', q: 'What are the time and space of the 1-D knapsack with `n` items and capacity `C`?',
        choices: ['O(n · C) time, O(C) space', 'O(2ⁿ) time, O(n) space', 'O(n · C) time, O(n · C) space', 'O(n + C) time, O(C) space'], answer: 0,
        explain: 'Each item updates every capacity once, and a single array of C + 1 cells is enough because each row reads only the one before it. It is pseudo-polynomial, since C is a value.' },
      { kind: 'pattern', q: 'For counting the ways to make an amount, what does putting the **coin loop outside** and the amount loop inside count?',
        choices: ['Combinations: 1+2 and 2+1 are the same', 'Permutations: 1+2 and 2+1 differ', 'Only the minimum number of coins', 'Nothing useful: the answer is the same for either nesting'], answer: 0,
        explain: 'With coins outside, each coin finishes its turn before the next begins, so every multiset of coins is built in one fixed order. Amount outside lets any coin come last, so orders differ.' },
      { kind: 'pattern', q: 'Which of these is a knapsack-style problem? Pick every one that applies.',
        choices: ['Split numbers into two groups with equal sums', 'Fewest coins to reach an exact amount', 'The longest increasing subsequence of an array', 'Count the sign assignments that reach a target'], answer: [0, 1, 3],
        explain: 'A target sum over a chosen subset appears in the first, second and fourth. Longest increasing subsequence is about an ordering, not a budget.' },
      { kind: 'bug', q: 'This is meant to answer “can a subset of `nums` sum to `target`?” but says true for `nums = [3]`, `target = 6`. What’s the bug?',
        code: `def can_make(nums, target):
    dp = [True] + [False] * target
    for x in nums:
        for s in range(x, target + 1):
            dp[s] = dp[s] or dp[s - x]
    return dp[target]`,
        choices: ['The inner loop goes upward, so one number can be used repeatedly', '`dp[0]` should be False', 'It should use `and` instead of `or`', 'The outer loop should be over sums'], answer: 0,
        explain: 'Upward lets `dp[3]` become true, then `dp[6] = dp[3]`, which uses the 3 twice. Run `s` from `target` down to `x`.' },
      { kind: 'concept', q: 'For Target Sum with `total = 10` and `target = 4`, how many numbers should the “plus” subset sum to?',
        choices: ['7', '3', '4', '14'], answer: 0,
        explain: '`P = (total + target) / 2 = (10 + 4) / 2 = 7`. The minus group then sums to 3, and 7 − 3 = 4.' },
      { kind: 'concept', q: 'Why is `bits |= bits << x` a valid subset-sum update, with no loop over sums?',
        choices: ['The shift moves every reachable sum `s` to `s + x`, and the OR keeps the old ones, all computed from the old value at once', 'Shifting always doubles the number of subsets', 'It ignores duplicates in the input', 'It only works when `x` is a power of two'], answer: 0,
        explain: 'Bit `s` means “sum `s` is reachable”. Shifting left by `x` marks `s + x`, and OR-ing with the old bits keeps “skip the number”. The right side is evaluated before the assignment, so each number is used once.' },
      { kind: 'concept', q: 'You are asked for the fewest coins to make an amount, and the coin set is `[1, 3, 4]` with amount 6. Why does the DP beat “always take the largest coin that fits”?',
        choices: ['Greedy gives 4 + 1 + 1 = 3 coins, but 3 + 3 uses 2', 'Greedy always works for any coin set', 'The DP uses less memory than greedy', 'Greedy cannot handle amounts above 5'], answer: 0,
        explain: 'Greedy is only correct for special coin systems. The DP tries every coin for every amount, so it finds 3 + 3.' }
    ],

    flashcards: [
      { id: 'direction', front: '1-D knapsack: which direction does the capacity loop run for 0/1 and for unbounded?', back: '0/1: **down** (so `dp[c - w]` is still the previous row, item used once). Unbounded: **up** (so `dp[c - w]` may already include the item).' },
      { id: 'cell-meaning', front: 'Four questions, one table: what does the cell hold and how do options combine?', back: 'Max value: `max(dp[c], dp[c - w] + v)`. Reachable: `or`. Fewest items: `min(..., dp[c - w] + 1)`. Number of ways: `+=`.' },
      { id: 'bases', front: 'Base cases: min coins, count ways, subset reachable?', back: 'Min: `dp[0] = 0`, the rest infinity. Count: `dp[0] = 1`. Reachable: `dp[0] = True`. All three say “making nothing needs nothing”.' },
      { id: 'comb-perm', front: 'Counting ways to pay: how do the loops decide combinations vs permutations?', back: 'Coins outside, amount inside = **combinations** (518). Amount outside, coins inside = **permutations** (377).' },
      { id: 'partition', front: 'Partition equal subset sum: reduce it.', back: 'If the total is odd, no. Otherwise it is 0/1 subset sum with target `total / 2`.' },
      { id: 'target-sum', front: 'Target Sum: how do you turn signs into a subset?', back: '`P - N = target` and `P + N = total`, so `P = (total + target) / 2`. Count subsets summing to `P`; return 0 if `|target| > total` or the parity is odd.' },
      { id: 'pseudo-poly', front: 'Why is knapsack O(n · C) not truly polynomial?', back: '`C` is a numeric value, exponential in its bit length. The table only exists when the capacity is small.' },
      { id: 'bitset', front: 'Subset sum as a bitset: the one-line update?', back: '`bits |= bits << x`. Bit `s` is set when sum `s` is reachable. Time drops by the word size.' },
      { id: 'multi-dim', front: '474-style problems with two budgets: how does the loop change?', back: 'Add a dimension per budget and loop **each** downward for 0/1: `dp[i][j] = max(dp[i][j], dp[i - z][j - o] + 1)`.' },
      { id: 'infinity', front: 'Min-coins infinity: what do you use and why?', back: '`amount + 1`: larger than any real answer, and adding 1 cannot overflow. Return −1 if the final cell still equals it.' }
    ],

    deeper: [
      { title: '0/1 Knapsack Problem (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/', time: 'about 20 min', note: 'The textbook version: recursion, memoization, the 2-D table and the 1-D space optimization side by side. Good for seeing why the 1-D loop must go downward.' },
      { title: 'NeetCode roadmap: 2-D Dynamic Programming', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where Coin Change, Partition Equal Subset Sum, Coin Change II and Target Sum sit in the NeetCode 150 order, with video walk-throughs.' },
      { title: 'LeetCode Patterns (Sean Prashad)', url: 'https://seanprashad.com/leetcode-patterns/', time: 'reference', note: 'A filterable problem list. Filter by Dynamic Programming for more knapsack-style reps once this page feels easy.' }
    ],

    detective: [
      { id: 'moving-truck', decoys: ['dp-1d', 'greedy', 'backtracking'],
        statement: 'A moving company loads one truck with a strict weight limit. In the garage are crates, each with a known weight and a resale value, and **every crate is there exactly once**. The dispatcher wants the most total resale value the truck can carry without going over the limit. Crate weights are whole kilograms and the limit is a few thousand.',
        why: 'Each crate is taken or left (once), the only thing that limits you is the remaining weight, and the weights are small integers. That is a choose-a-subset-within-a-budget table indexed by weight. Value-per-kilo greedy fails here because crates cannot be split.' },
      { id: 'change-drawer', decoys: ['dp-1d', 'greedy', 'graphs'],
        statement: 'A small cafe’s till holds coins of a few odd denominations (say 1, 6 and 10 units), as many of each as it needs. A customer is owed an exact amount of change. What is the fewest coins the cashier can hand over, or can it not be done at all?',
        why: 'The coins repeat without limit, the amount to hit is exact, and the biggest-coin-first habit breaks on odd denominations (12 = 6 + 6, not 10 + 1 + 1). That is a table over amounts, where each coin type may be reused, so the amount loop runs upward.' },
      { id: 'team-split', decoys: ['dp-1d', 'sorting', 'backtracking'],
        statement: 'Before a friendly match, a coach has players with skill ratings, all whole numbers. She has to split everyone into two teams, nobody left out, so that the two teams’ total ratings are as **close** as possible. Return the smallest possible gap. The ratings are modest, and there are a few dozen players.',
        why: 'One team’s total determines the other’s, so the question is which subset total gets closest to half of the overall sum. That is a reachable-sums table with each player used once, then a scan for the best reachable sum near the midpoint.' }
    ]
  });
})();
