/* Offer Ready: 1-D dynamic programming lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'dp-1d',

    hook: 'Dynamic programming is the topic candidates fear most and interviewers use most to see how you think. The good news: the 1-D kind is one idea, repeated. **Decide what a single cell of a table means, write how a cell comes from earlier cells, fill the table in order.** Climbing stairs, house robber, decode ways and word break all follow that script, and each one looks like a brand-new trick until you notice the table. Practise recognising the shape, and many questions that look hard turn into short exercises.',

    cues: [
      'The question asks for a **count** (how many ways), a **best value** (min cost, max profit) or a **yes or no** (can it be done), over a sequence of choices.',
      'The answer for the first `i` items is built from the answers for **smaller prefixes**: “to finish at step 10, I came from step 9 or step 8”.',
      'A plain recursion works but is **exponential**, because the same call repeats. That repetition is the **overlapping subproblems** half of the checklist.',
      'The best overall answer contains best answers to its pieces (**optimal substructure**): the best plan for 10 houses uses a best plan for 8 or 9 of them.',
      'At each position you make a **small fixed choice**: take or skip, 1 step or 2, one digit or two, which word ends here.',
      'Greedy feels almost right but a counterexample breaks it (`[2,1,1,2]` for robbing houses). When a locally best choice can hurt later, you probably need DP.'
    ],

    intuition: [
      'Picture climbing a staircase and asking “how many ways can I reach step 10?” You do not need to think about the whole climb. Your last move was either from step 9 or step 8, so **ways(10) = ways(9) + ways(8)**. The same question for step 9 reduces to steps 8 and 7. Every question points at smaller ones, until step 0 (one way: stand still) and step 1 (one way).',
      'That is the whole technique. Four decisions, in this order:',
      '1. **State**: what does `dp[i]` *mean*, in one sentence? “The number of ways to reach step i.” “The best total using only the first i houses.” A vague state is the root of nearly every wrong DP.\n2. **Recurrence**: how does `dp[i]` come from earlier cells? Think about the *last decision*: what could have happened right before? Each possibility is a pull from an earlier cell.\n3. **Base cases**: the smallest cells the recurrence cannot reach (`dp[0]`), set by hand.\n4. **Order and answer**: fill so every cell you read is already filled (left to right here), then read the answer off the table: usually `dp[n]`.',
      '**Two ways to run it.** *Top-down* (memoization) is the recursion you already know, plus a cache: ask for `dp[n]`, recurse, store each answer the first time. *Bottom-up* (tabulation) skips the recursion and fills the table from the base cases with a loop. Same table, same time. Top-down only computes cells that are actually needed and follows the problem’s own words; bottom-up has no stack to overflow and is easy to shrink. Use the visualizer’s toggle to watch the same table fill both ways, and notice the memo hits in top-down mode: each hit is a whole subtree you didn’t have to run.',
      '**Space optimization.** If `dp[i]` only reads the last one or two cells, you never need the whole table: keep two variables and slide them forward. Stairs, robber and decode ways all drop from O(n) to O(1) space. If a cell can read *any* earlier cell (word break), you keep the table.',
      '**Reconstruction.** A DP gives you the *value*. To get the *choices* (which houses, which words), either store a parent pointer per cell, or walk backwards from `dp[n]` and ask at each cell which option produced it. Keep the full table if you plan to do this.',
      '**Is it DP? The checklist.** Both must hold. (1) **Overlapping subproblems**: the same smaller question gets asked many times (draw the recursion tree; do nodes repeat?). If every subproblem is distinct, like the halves in merge sort, a cache buys nothing. (2) **Optimal substructure**: the answer for the whole can be assembled from answers to its parts, with no hidden memory of *how* a part was solved. If a choice early on changes what is allowed later in ways the state doesn’t capture, your state is missing something: add it.'
    ].join('\n\n'),

    viz: 'dp-1d',

    template: {
      title: 'Tabulate a prefix DP (shown on decode ways)',
      note: 'The skeleton never changes: **table, base case, loop in increasing order, pull from earlier cells, write the cell, read the answer.** Only the pulls differ. Here each cell adds two allowed pulls (a digit alone, a pair of digits). For **climbing stairs** both pulls are always allowed; for **house robber** replace the sum on the `fill` line with a `max` of “skip” and “take”. Lines marked `one` and `two` are the pulls, so in the visualizer you can see exactly which earlier cells each value came from. The order of the loop is the part people forget: every pull must reach a cell that is already filled.',
      code: {
        py: `def num_decodings(s):
    n = len(s)
    dp = [0] * (n + 1)                           #> dp[i] = ways to read the first i digits
    dp[0] = 1                                    #@base > Base case: the empty prefix has exactly one reading
    for i in range(1, n + 1):                    #@next > Increasing i, so every cell we read is already filled
        ways = 0
        if s[i - 1] != '0':                      #@one > The last digit alone is a letter only if it is 1 to 9
            ways += dp[i - 1]                    #@one > Pull from one cell back
        if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:   #@two > The last two digits together form a letter only if 10 to 26
            ways += dp[i - 2]                    #@two > Pull from two cells back
        dp[i] = ways                             #@fill > Write the cell: the sum of the allowed pulls
    return dp[n]                                 #@answer > The whole string is the last prefix`,
        js: `function numDecodings(s) {
  const n = s.length;
  const dp = new Array(n + 1).fill(0);                   //> dp[i] = ways to read the first i digits
  dp[0] = 1;                                             //@base > Base case: the empty prefix has exactly one reading
  for (let i = 1; i <= n; i++) {                         //@next > Increasing i, so every cell we read is already filled
    let ways = 0;
    if (s[i - 1] !== '0') ways += dp[i - 1];             //@one > The last digit alone is a letter only if it is 1 to 9
    const two = i >= 2 ? Number(s.slice(i - 2, i)) : 0;  //@two > The last two digits together form a letter only if 10 to 26
    if (two >= 10 && two <= 26) ways += dp[i - 2];       //@two > Pull from two cells back
    dp[i] = ways;                                        //@fill > Write the cell: the sum of the allowed pulls
  }
  return dp[n];                                          //@answer > The whole string is the last prefix
}`,
        java: `class Solution {
    public int numDecodings(String s) {
        int n = s.length();
        int[] dp = new int[n + 1];                        //> dp[i] = ways to read the first i digits
        dp[0] = 1;                                        //@base > Base case: the empty prefix has exactly one reading
        for (int i = 1; i <= n; i++) {                    //@next > Increasing i, so every cell we read is already filled
            int ways = 0;
            if (s.charAt(i - 1) != '0') ways += dp[i - 1];   //@one > The last digit alone is a letter only if it is 1 to 9
            int two = i >= 2 ? (s.charAt(i - 2) - '0') * 10 + (s.charAt(i - 1) - '0') : 0;   //@two > The last two digits form a letter only if 10 to 26
            if (two >= 10 && two <= 26) ways += dp[i - 2];   //@two > Pull from two cells back
            dp[i] = ways;                                 //@fill > Write the cell: the sum of the allowed pulls
        }
        return dp[n];                                     //@answer > The whole string is the last prefix
    }
}`,
        cpp: `class Solution {
public:
    int numDecodings(string s) {
        int n = s.size();
        vector<int> dp(n + 1, 0);                         //> dp[i] = ways to read the first i digits
        dp[0] = 1;                                        //@base > Base case: the empty prefix has exactly one reading
        for (int i = 1; i <= n; i++) {                    //@next > Increasing i, so every cell we read is already filled
            int ways = 0;
            if (s[i - 1] != '0') ways += dp[i - 1];       //@one > The last digit alone is a letter only if it is 1 to 9
            int two = i >= 2 ? (s[i - 2] - '0') * 10 + (s[i - 1] - '0') : 0;   //@two > The last two digits form a letter only if 10 to 26
            if (two >= 10 && two <= 26) ways += dp[i - 2];   //@two > Pull from two cells back
            dp[i] = ways;                                 //@fill > Write the cell: the sum of the allowed pulls
        }
        return dp[n];                                     //@answer > The whole string is the last prefix
    }
};`
      },
      tests: { fn: { py: 'num_decodings', default: 'numDecodings' }, sig: { args: ['str'] }, cases: [
        { args: ['12'], out: 2 }, { args: ['226'], out: 3 }, { args: ['06'], out: 0 }, { args: ['10'], out: 1 }, { args: ['2101'], out: 1 },
        { args: ['27'], out: 1 }, { args: ['0'], out: 0 }, { args: ['1111111111'], out: 89 }, { args: ['100'], out: 0 }, { args: ['11106'], out: 2 }, { args: ['1'], out: 1 }] }
    },

    complexity: {
      time: 'O(states × transitions per state), usually O(n)',
      space: 'O(n) for the table; O(1) if each cell reads only the last few',
      why: 'Count the cells in the table and multiply by the work to fill one. Stairs, robber and decode ways have n + 1 cells and two pulls per cell: O(n) time. Word break has n + 1 cells, but a cell tries every word length that could end there: O(n · L) lookups (L is the longest word), each hashing a substring, so about O(n · L²) character work. The table is O(n) space. When a cell reads only `dp[i-1]` and `dp[i-2]`, keep two variables instead: O(1) space. Compare the unmemoized recursion: it makes one call per *path*, which is exponential, while the table makes one per *cell*.',
      trap: '**Do not call a memoized recursion O(1) space.** Top-down still uses O(n) stack depth plus the cache. For long inputs (n = 10⁵) Python and JavaScript overflow the stack, so interviewers often follow up with “now do it bottom-up”. Also watch **hidden costs inside a transition**: slicing a string or building a key is O(L), so a loop over `n` cells with `s[j:i]` lookups is more than O(n).'
    },

    variations: [
      {
        name: 'Top-down: recursion plus a cache',
        body: 'Write the recurrence as a recursive function, then add a dictionary so each input is solved once. It’s the fastest way to get a correct answer, because the code reads like the definition. Remember the order inside the function: **base case, cache check, compute, store, return**. Python’s `functools.cache` does the bookkeeping for you; the explicit version below shows what it does. The state `i` here must identify the whole subproblem.',
        code: {
          py: `def climb_memo(n):
    memo = {}
    def ways(i):                                 #> ways(i) is dp[i], asked from the top
        if i <= 1:                               #> Base cases: one way to stand on step 0 or step 1
            return 1
        if i in memo:                            #> Already solved? Return the stored answer
            return memo[i]
        memo[i] = ways(i - 1) + ways(i - 2)      #> The recurrence, stored before returning
        return memo[i]
    return ways(n)`,
          js: `function climbMemo(n) {
  const memo = new Map();
  function ways(i) {                             //> ways(i) is dp[i], asked from the top
    if (i <= 1) return 1;                        //> Base cases: one way to stand on step 0 or step 1
    if (memo.has(i)) return memo.get(i);         //> Already solved? Return the stored answer
    const v = ways(i - 1) + ways(i - 2);         //> The recurrence
    memo.set(i, v);                              //> Stored before returning
    return v;
  }
  return ways(n);
}`
        },
        tests: { fn: { py: 'climb_memo', default: 'climbMemo' }, cases: [
          { args: [0], out: 1 }, { args: [1], out: 1 }, { args: [2], out: 2 }, { args: [5], out: 8 }, { args: [10], out: 89 }, { args: [40], out: 165580141 }] }
      },
      {
        name: 'Space optimization: two variables instead of a table',
        body: 'Look at which cells the recurrence reads. If it only reads `dp[i-1]` and `dp[i-2]`, the cells further left are never needed again, so keep two variables and slide them forward. Same answer, same O(n) time, O(1) space. Write the table version first (it is easy to debug), then collapse it. Do this only when the recurrence reads a fixed number of recent cells; **you lose reconstruction**, because the old cells are gone.',
        code: {
          py: `def rob_rolling(nums):
    prev2, prev1 = 0, 0                          #> dp[i-2] and dp[i-1], both 0 before any house
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)   #> New dp[i]; the old dp[i-1] becomes dp[i-2]
    return prev1                                 #> dp[n]`,
          js: `function robRolling(nums) {
  let prev2 = 0, prev1 = 0;                      //> dp[i-2] and dp[i-1], both 0 before any house
  for (const x of nums) {
    [prev2, prev1] = [prev1, Math.max(prev1, prev2 + x)];   //> New dp[i]; the old dp[i-1] becomes dp[i-2]
  }
  return prev1;                                  //> dp[n]
}`
        },
        tests: { fn: { py: 'rob_rolling', default: 'robRolling' }, cases: [
          { args: [[1, 2, 3, 1]], out: 4 }, { args: [[2, 7, 9, 3, 1]], out: 12 }, { args: [[]], out: 0 }, { args: [[5]], out: 5 }, { args: [[2, 1, 1, 2]], out: 4 }] }
      },
      {
        name: 'Reconstruction: which houses?',
        body: 'The table holds the best *values*, so you can walk it backwards to recover the *choices*. Start at `dp[n]`. If `dp[i] == dp[i-1]`, house `i` made no difference: skip it and move to `i-1`. Otherwise it was taken: record it and jump to `i-2`, since its neighbour was off limits. On a tie this skips, so the answer is one of possibly several optimal sets. This needs the full table, which is why you can’t combine it with the two-variable trick (unless you store the decisions as you go).',
        code: {
          py: `def rob_picks(nums):
    n = len(nums)
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = max(dp[i - 1], (dp[i - 2] if i >= 2 else 0) + nums[i - 1])
    picks, i = [], n
    while i >= 1:
        if dp[i] == dp[i - 1]:                   #> Same value as skipping: house i was not taken
            i -= 1
        else:
            picks.append(i - 1)                  #> The value changed: house i was taken
            i -= 2                               #> Its neighbour was off limits
    return picks[::-1]                           # indexes in increasing order`,
          js: `function robPicks(nums) {
  const n = nums.length;
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) dp[i] = Math.max(dp[i - 1], (i >= 2 ? dp[i - 2] : 0) + nums[i - 1]);
  const picks = [];
  let i = n;
  while (i >= 1) {
    if (dp[i] === dp[i - 1]) i -= 1;             //> Same value as skipping: house i was not taken
    else { picks.push(i - 1); i -= 2; }          //> The value changed: taken, so jump over its neighbour
  }
  return picks.reverse();                        // indexes in increasing order
}`
        },
        tests: { fn: { py: 'rob_picks', default: 'robPicks' }, cases: [
          { args: [[2, 7, 9, 3, 1]], out: [0, 2, 4] }, { args: [[1, 2, 3, 1]], out: [0, 2] }, { args: [[5]], out: [0] }, { args: [[]], out: [] },
          { args: [[2, 1, 1, 2]], out: [0, 3] }, { args: [[4, 1, 1, 9]], out: [0, 3] }, { args: [[3, 3]], out: [0] }] }
      },
      {
        name: 'Two states per position: hold or free',
        body: 'Sometimes one number per index isn’t enough, because *what you are allowed to do next* depends on a mode. Keep one value per mode. For “trade a stock as often as you like”, each day has `free` (best profit while holding nothing) and `hold` (best profit while holding a share). Each day both update from yesterday’s pair. Still O(1) space; this is the doorway to the state-machine DPs in [2-D DP](#/topic/dp-2d). (For this particular problem the pair collapses to “add up every rise”, which is the shorter answer.)',
        code: {
          py: `def profit_states(prices):
    free, hold = 0, float('-inf')                #> Best profit: holding nothing / holding a share
    for p in prices:
        free, hold = max(free, hold + p), max(hold, free - p)   #> Sell today, or stay free; buy today, or keep holding
    return free                                  #> Ending free is never worse than ending holding`,
          js: `function profitStates(prices) {
  let free = 0, hold = -Infinity;                //> Best profit: holding nothing / holding a share
  for (const p of prices) {
    [free, hold] = [Math.max(free, hold + p), Math.max(hold, free - p)];   //> Sell today, or stay free; buy today, or keep holding
  }
  return free;                                   //> Ending free is never worse than ending holding
}`
        },
        tests: { fn: { py: 'profit_states', default: 'profitStates' }, cases: [
          { args: [[7, 1, 5, 3, 6, 4]], out: 7 }, { args: [[1, 2, 3, 4, 5]], out: 4 }, { args: [[7, 6, 4, 3, 1]], out: 0 }, { args: [[1]], out: 0 }, { args: [[6, 1, 3, 2, 4, 7]], out: 7 }] }
      },
      {
        name: 'Circular arrangement: run the line twice',
        body: 'If the first and last positions are neighbours (houses in a ring), the choice splits into two *line* problems: the best answer **without the first** element, and the best answer **without the last**. Any valid plan skips at least one of them, so the larger of the two is the answer. Guard the single-element case, where both ranges are empty. See practice problem 213.'
      },
      {
        name: 'Counting vs optimizing vs deciding',
        body: 'The skeleton is the same; only the **combine** changes. **Count** ways: add the pulls (stairs, decode ways). **Optimize**: take the min or max of the pulls and add the step’s own cost or gain (robber, min-cost stairs). **Decide** feasibility: OR the pulls (word break: `dp[i]` is true if *any* `dp[j]` is true and the piece `s[j:i]` is a word). Counting needs care with modulus (`% 1_000_000_007`) when asked; deciding can stop early at the first true.'
      },
      {
        name: 'Memoization or tabulation: which first?',
        body: 'In an interview, **write the recursion first** when the recurrence is not obvious: it forces you to state the subproblem clearly, and adding a cache is one line. Convert to a table when (a) the depth could overflow the stack, (b) you want to shrink the space, or (c) the interviewer asks. Prefer top-down when only a small part of the table is reachable (the states are sparse or have odd constraints); prefer bottom-up when you will visit nearly every cell anyway. Both have the same time complexity on a full table.'
      }
    ],

    worked: [
      {
        lc: 70,
        restate: 'A staircase has n steps. Each move climbs one or two steps. Count the different sequences of moves that take you exactly to the top.',
        examples: '- `n = 2` → 2 (1+1, or 2).\n- `n = 3` → 3 (1+1+1, 1+2, 2+1).\n- `n = 5` → 8.\n- Edge: `n = 1` → 1. The answer fits a 32-bit int up to n = 45.',
        brute: 'Recurse on the last move: `ways(n) = ways(n-1) + ways(n-2)`. It is correct, but each call makes two more and the same `ways(k)` repeats everywhere, so it takes about 1.6ⁿ calls: hopeless around n = 45. (Draw the tree for n = 5 and count how many times `ways(2)` appears.)',
        insight: 'Define `dp[i]` = the number of ways to reach step i. The last move arrived from step i-1 (a one-step) or step i-2 (a two-step), and these cases never overlap, so **dp[i] = dp[i-1] + dp[i-2]**. Base: dp[0] = 1 (stand still) and dp[1] = 1. Fill left to right. Since only the last two cells matter, keep two variables: O(1) space. This is the Fibonacci sequence in disguise, shifted by one.',
        code: {
          py: `class Solution:
    def climbStairs(self, n: int) -> int:
        prev, cur = 1, 1                  # dp[0], dp[1]
        for _ in range(n - 1):
            prev, cur = cur, prev + cur   # dp[i] = dp[i-1] + dp[i-2]
        return cur`,
          js: `function climbStairs(n) {
  let prev = 1, cur = 1;                  // dp[0], dp[1]
  for (let i = 2; i <= n; i++) [prev, cur] = [cur, prev + cur];   // dp[i] = dp[i-1] + dp[i-2]
  return cur;
}`,
          java: `class Solution {
    public int climbStairs(int n) {
        int prev = 1, cur = 1;            // dp[0], dp[1]
        for (int i = 2; i <= n; i++) {
            int next = prev + cur;        // dp[i] = dp[i-1] + dp[i-2]
            prev = cur;
            cur = next;
        }
        return cur;
    }
}`,
          cpp: `class Solution {
public:
    int climbStairs(int n) {
        int prev = 1, cur = 1;            // dp[0], dp[1]
        for (int i = 2; i <= n; i++) {
            int next = prev + cur;        // dp[i] = dp[i-1] + dp[i-2]
            prev = cur;
            cur = next;
        }
        return cur;
    }
};`
        },
        complexity: 'O(n) time, O(1) space (a full table would be O(n) space). For huge n the same recurrence runs in O(log n) with matrix or doubling methods (see [Recursion](#/topic/recursion)).',
        say: '“The last move was a one-step or a two-step, so ways to reach i is ways(i-1) plus ways(i-2), with one way to stand at 0 and at 1. That’s Fibonacci. I fill a table left to right, then notice I only read the last two cells, so I keep two variables: O(n) time, O(1) space.”',
        followups: [
          { q: 'What if you could climb 1, 2 or 3 steps?', a: 'Add a third pull: `dp[i] = dp[i-1] + dp[i-2] + dp[i-3]`, with three base cells. With a set of allowed step sizes `S`, `dp[i] = sum of dp[i - s]` over `s` in `S` with `s <= i`: O(n·|S|).' },
          { q: 'What if some steps are broken and cannot be stood on?', a: 'Set `dp[i] = 0` for a broken step and skip its pulls. Cells beyond it still read the cells that exist.' },
          { q: 'Why is the base dp[0] = 1 and not 0?', a: 'It counts the empty sequence of moves, which is the one way to be at the start. With 0 every cell would be 0. A base case is a count that makes the recurrence true, not “the number of steps”.' }
        ]
      },
      {
        lc: 198,
        restate: 'Houses stand in a row, each holding some money. If you rob two neighbouring houses, the alarm goes off. Find the most money you can take without ever robbing two adjacent houses.',
        examples: '- `[1,2,3,1]` → 4 (rob houses 1 and 3).\n- `[2,7,9,3,1]` → 12 (2 + 9 + 1).\n- `[2,1,1,2]` → 4 (the two ends), where “always take the biggest” fails.\n- Edge: one house returns its value; no houses returns 0.',
        brute: 'Try every subset with no two neighbours: the count grows like the Fibonacci numbers, exponential. Greedy fails: taking the largest house first can block two good neighbours.',
        insight: 'Let `dp[i]` = the best total using **only the first i houses**. For house i there are two choices. **Skip it:** the best you can do is `dp[i-1]`. **Rob it:** you cannot touch house i-1, so you get `dp[i-2] + nums[i-1]`. Take the larger: **dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])**. Base: dp[0] = 0. The “first i houses” wording matters: the state doesn’t say whether house i was robbed, it says the best you can do *with the option* to rob it, which is why two earlier cells are enough. To list the houses, walk back from dp[n]. To save space, see the rolling variation.',
        code: {
          py: `class Solution:
    def rob(self, nums: List[int]) -> int:
        n = len(nums)
        dp = [0] * (n + 1)                 # dp[i] = best using the first i houses
        for i in range(1, n + 1):
            take = nums[i - 1] + (dp[i - 2] if i >= 2 else 0)   # rob house i
            dp[i] = max(dp[i - 1], take)   # or skip it
        return dp[n]`,
          js: `function rob(nums) {
  const n = nums.length;
  const dp = new Array(n + 1).fill(0);     // dp[i] = best using the first i houses
  for (let i = 1; i <= n; i++) {
    const take = nums[i - 1] + (i >= 2 ? dp[i - 2] : 0);   // rob house i
    dp[i] = Math.max(dp[i - 1], take);     // or skip it
  }
  return dp[n];
}`,
          java: `class Solution {
    public int rob(int[] nums) {
        int n = nums.length;
        int[] dp = new int[n + 1];         // dp[i] = best using the first i houses
        for (int i = 1; i <= n; i++) {
            int take = nums[i - 1] + (i >= 2 ? dp[i - 2] : 0);   // rob house i
            dp[i] = Math.max(dp[i - 1], take);                   // or skip it
        }
        return dp[n];
    }
}`,
          cpp: `class Solution {
public:
    int rob(vector<int>& nums) {
        int n = nums.size();
        vector<int> dp(n + 1, 0);          // dp[i] = best using the first i houses
        for (int i = 1; i <= n; i++) {
            int take = nums[i - 1] + (i >= 2 ? dp[i - 2] : 0);   // rob house i
            dp[i] = max(dp[i - 1], take);                        // or skip it
        }
        return dp[n];
    }
};`
        },
        complexity: 'O(n) time, O(n) space for the table, O(1) with two rolling variables (see the variation above).',
        say: '“Let dp[i] be the best total from the first i houses. For house i I either skip it and keep dp[i-1], or rob it and add its money to dp[i-2], since its neighbour is off limits. I take the max. Base is dp[0] = 0, I fill left to right, and since I only read two cells back I can reduce it to two variables.”',
        followups: [
          { q: 'Now the houses form a circle. What changes?', a: 'The first and last are neighbours. Run the same linear robber twice, once on `nums[1:]` and once on `nums[:-1]`, and take the larger. Handle a single house separately. (Practice 213.)' },
          { q: 'How do you return which houses to rob?', a: 'Keep the table, then walk back from dp[n]: if dp[i] equals dp[i-1] skip house i, otherwise take it and jump to i-2. See the reconstruction variation.' },
          { q: 'What if you may not rob within k houses of each other?', a: 'The same idea with a longer reach: `dp[i] = max(dp[i-1], dp[i-k-1] + nums[i-1])`. Still O(n), and you need a window of k + 1 cells to roll.' }
        ]
      },
      {
        lc: 91,
        restate: 'A message was encoded by replacing letters with numbers (A is 1, B is 2, up to Z which is 26) and joining the numbers into one digit string. Given the string, count the number of ways it could be read back into letters.',
        examples: '- `"12"` → 2 (A B, or L).\n- `"226"` → 3 (B Z, V F, B B F).\n- `"06"` → 0, since a leading 0 can’t be read.\n- `"10"` → 1 (only J), because the 0 can’t stand alone.',
        brute: 'Try every way to cut the string into pieces of one or two digits and check each piece is valid: a recursion with two branches per position, exponential in the length.',
        insight: 'Define `dp[i]` = the number of ways to read the **first i digits**. Think about the last piece. It was either one digit (valid if it is 1 to 9, i.e. not "0"), which leaves the first i-1 digits to read: add `dp[i-1]`. Or it was two digits (valid if the pair is 10 to 26), leaving the first i-2: add `dp[i-2]`. These two cases are different final pieces, so no way is counted twice. Base: dp[0] = 1, the empty prefix. A prefix with no valid way gets 0, and every cell leaning only on it inherits 0, which is how “100” and “06” correctly come out as 0.',
        code: {
          py: `class Solution:
    def numDecodings(self, s: str) -> int:
        n = len(s)
        dp = [0] * (n + 1)                 # dp[i] = ways to read the first i digits
        dp[0] = 1                          # the empty prefix
        for i in range(1, n + 1):
            if s[i - 1] != '0':            # last digit alone
                dp[i] += dp[i - 1]
            if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:   # last two digits together
                dp[i] += dp[i - 2]
        return dp[n]`,
          js: `function numDecodings(s) {
  const n = s.length;
  const dp = new Array(n + 1).fill(0);     // dp[i] = ways to read the first i digits
  dp[0] = 1;                               // the empty prefix
  for (let i = 1; i <= n; i++) {
    if (s[i - 1] !== '0') dp[i] += dp[i - 1];              // last digit alone
    if (i >= 2) {
      const two = Number(s.slice(i - 2, i));
      if (two >= 10 && two <= 26) dp[i] += dp[i - 2];      // last two digits together
    }
  }
  return dp[n];
}`,
          java: `class Solution {
    public int numDecodings(String s) {
        int n = s.length();
        int[] dp = new int[n + 1];         // dp[i] = ways to read the first i digits
        dp[0] = 1;                         // the empty prefix
        for (int i = 1; i <= n; i++) {
            if (s.charAt(i - 1) != '0') dp[i] += dp[i - 1];   // last digit alone
            if (i >= 2) {
                int two = (s.charAt(i - 2) - '0') * 10 + (s.charAt(i - 1) - '0');
                if (two >= 10 && two <= 26) dp[i] += dp[i - 2];   // last two digits together
            }
        }
        return dp[n];
    }
}`,
          cpp: `class Solution {
public:
    int numDecodings(string s) {
        int n = s.size();
        vector<int> dp(n + 1, 0);          // dp[i] = ways to read the first i digits
        dp[0] = 1;                         // the empty prefix
        for (int i = 1; i <= n; i++) {
            if (s[i - 1] != '0') dp[i] += dp[i - 1];   // last digit alone
            if (i >= 2) {
                int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
                if (two >= 10 && two <= 26) dp[i] += dp[i - 2];   // last two digits together
            }
        }
        return dp[n];
    }
};`
        },
        complexity: 'O(n) time. O(n) space as written; O(1) by keeping only `dp[i-1]` and `dp[i-2]`.',
        say: '“dp[i] is the number of readings of the first i digits. The last piece is one digit, valid unless it is 0, so I add dp[i-1], or two digits, valid from 10 to 26, so I add dp[i-2]. dp[0] is 1 for the empty prefix. A zero that can’t pair with the digit before it makes the cell zero. It’s O(n) time and I can reduce space to two variables.”',
        followups: [
          { q: 'Why is "0" the dangerous character?', a: 'It is not a letter alone, and only pairs "10" and "20" make it valid. So a 0 either gets “absorbed” by the digit before it or kills the whole path. A lone zero at the start, or "00", gives 0 ways.' },
          { q: 'How would you handle a huge input?', a: 'Reduce to two rolling variables for O(1) space, and take the result modulo a big prime if the problem asks for it, since the count grows like Fibonacci.' },
          { q: 'What if letters could also be 27 to 52?', a: 'Only the pair check changes, from 10..26 to 10..52 (or whatever range). The state and the base are the same.' }
        ]
      },
      {
        lc: 139,
        restate: 'You are given a string and a list of words (each word may be used any number of times). Decide whether the string can be cut into pieces so that every piece is one of the words.',
        examples: '- `"leetcode"`, words `["leet","code"]` → true.\n- `"applepenapple"`, words `["apple","pen"]` → true (reuse allowed).\n- `"catsandog"`, words `["cats","dog","sand","and","cat"]` → false.',
        brute: 'Try every cut point recursively: at each position, for every word that matches here, recurse on the rest. With many overlapping words (`"aaaa...a"` with `"a"` and `"aa"`) the same suffix is solved again and again: exponential.',
        insight: 'Define `dp[i]` = **can the first i characters be built from words?** The last word ended at i, so it started at some `j = i - len(word)`. So `dp[i]` is true if for **some** word, `dp[j]` is true and `s[j:i]` equals that word. Base: dp[0] = true (the empty prefix). Answer `dp[n]`. Only word lengths up to the longest word matter, so limit `j` to `i - maxLen`. Unlike stairs, a cell here can read far-back cells, so you keep the whole table: no O(1) trick.',
        code: {
          py: `class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        max_len = max(len(w) for w in words)
        n = len(s)
        dp = [False] * (n + 1)             # dp[i] = can s[:i] be built from words?
        dp[0] = True                       # the empty prefix
        for i in range(1, n + 1):
            for L in range(1, min(i, max_len) + 1):   # length of the last word
                if dp[i - L] and s[i - L:i] in words:
                    dp[i] = True
                    break
        return dp[n]`,
          js: `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const maxLen = Math.max(...wordDict.map((w) => w.length));
  const n = s.length;
  const dp = new Array(n + 1).fill(false); // dp[i] = can s[0..i) be built from words?
  dp[0] = true;                            // the empty prefix
  for (let i = 1; i <= n; i++) {
    for (let L = 1; L <= Math.min(i, maxLen); L++) {      // length of the last word
      if (dp[i - L] && words.has(s.slice(i - L, i))) { dp[i] = true; break; }
    }
  }
  return dp[n];
}`,
          java: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> words = new HashSet<>(wordDict);
        int maxLen = 0;
        for (String w : wordDict) maxLen = Math.max(maxLen, w.length());
        int n = s.length();
        boolean[] dp = new boolean[n + 1]; // dp[i] = can s[0..i) be built from words?
        dp[0] = true;                      // the empty prefix
        for (int i = 1; i <= n; i++) {
            for (int L = 1; L <= Math.min(i, maxLen); L++) {   // length of the last word
                if (dp[i - L] && words.contains(s.substring(i - L, i))) { dp[i] = true; break; }
            }
        }
        return dp[n];
    }
}`,
          cpp: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        int maxLen = 0;
        for (auto& w : wordDict) maxLen = max(maxLen, (int)w.size());
        int n = s.size();
        vector<bool> dp(n + 1, false);     // dp[i] = can s[0..i) be built from words?
        dp[0] = true;                      // the empty prefix
        for (int i = 1; i <= n; i++) {
            for (int L = 1; L <= min(i, maxLen); L++) {   // length of the last word
                if (dp[i - L] && words.count(s.substr(i - L, L))) { dp[i] = true; break; }
            }
        }
        return dp[n];
    }
};`
        },
        complexity: 'O(n · L) substring lookups for L = the longest word, each O(L) to hash: O(n · L²) worst case. O(n) space for the table plus the word set.',
        say: '“dp[i] means the first i characters can be split into dictionary words. The last word ends at i and starts at some j, so dp[i] is true if some dp[j] is true and s[j:i] is a word. dp[0] is true. I cap the start at the longest word length, so it’s O(n·L) lookups. Each cell can read far back, so I keep the whole table.”',
        followups: [
          { q: 'How would you return one valid split, not just yes or no?', a: 'Store the word start `j` that made dp[i] true (a parent pointer), then walk back from n. Or walk back from dp[n] and re-find a word for each cell.' },
          { q: 'How would you count the splits?', a: 'Change the combine from OR to a sum: `dp[i] += dp[j]` for every word that fits, with dp[0] = 1. Be ready to take the result modulo a prime.' },
          { q: 'Would a trie help?', a: 'Yes, to avoid hashing substrings: from each start j where `dp[j]` is true, walk the trie along `s` and mark `dp[end]` for every word found. It makes the transition proportional to matching characters.' }
        ]
      }
    ],

    practice: [
      { lc: 70,
        hints: ['The last move was either one step or two. What does that say about how ways(n) relates to smaller cases?', '`ways(n) = ways(n-1) + ways(n-2)`, with one way to stand at step 0 and one at step 1.', 'Fill left to right and keep only the last two values.'],
        solution: { explain: 'Fibonacci in disguise. Keep the last two cells instead of a table. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def climbStairs(self, n: int) -> int:
        prev, cur = 1, 1
        for _ in range(n - 1):
            prev, cur = cur, prev + cur
        return cur`,
          js: `function climbStairs(n) {
  let prev = 1, cur = 1;
  for (let i = 2; i <= n; i++) [prev, cur] = [cur, prev + cur];
  return cur;
}` } },
        starter: { py: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        ', js: 'function climbStairs(n) {\n  \n}' },
        tests: { fn: 'climbStairs', sig: { args: ['int'] }, cases: [
          { args: [1], out: 1 }, { args: [2], out: 2 }, { args: [3], out: 3 }, { args: [5], out: 8 }, { args: [10], out: 89 }, { args: [30], out: 1346269 }, { args: [45], out: 1836311903 }] } },

      { lc: 746,
        hints: ['Define the state as the cheapest total to *arrive at* position i (position n is the top, one past the last stair). Starting on stair 0 or 1 costs nothing.', 'You arrive at i from i-1 (paying `cost[i-1]` to leave it) or from i-2 (paying `cost[i-2]`). Take the cheaper.', '`f[0] = f[1] = 0`, `f[i] = min(f[i-1] + cost[i-1], f[i-2] + cost[i-2])`, answer `f[n]`. Two variables are enough.'],
        solution: { explain: 'Let `f[i]` be the cheapest way to arrive at position i, where position n is the top. You pay a stair’s cost when you *leave* it, so the recurrence adds `cost[i-1]` or `cost[i-2]`. Rolling two variables: O(n) time, O(1) space.', code: {
          py: `class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        a = b = 0                          # f[i-2], f[i-1]
        for i in range(2, len(cost) + 1):
            a, b = b, min(b + cost[i - 1], a + cost[i - 2])
        return b`,
          js: `function minCostClimbingStairs(cost) {
  let a = 0, b = 0;
  for (let i = 2; i <= cost.length; i++) [a, b] = [b, Math.min(b + cost[i - 1], a + cost[i - 2])];
  return b;
}` } },
        starter: { py: 'class Solution:\n    def minCostClimbingStairs(self, cost: List[int]) -> int:\n        ', js: 'function minCostClimbingStairs(cost) {\n  \n}' },
        tests: { fn: 'minCostClimbingStairs', cases: [
          { args: [[10, 15, 20]], out: 15 }, { args: [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], out: 6 }, { args: [[5, 5]], out: 5 }, { args: [[10, 15]], out: 10 }, { args: [[0, 0, 0, 1]], out: 0 }] } },

      { lc: 198,
        hints: ['For each house there are two choices. What does each one give you, in terms of the best total over earlier houses?', 'Skip: `dp[i-1]`. Rob: `dp[i-2] + nums[i-1]`. Define `dp[i]` as the best total using only the first i houses.', '`dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])`, `dp[0] = 0`. You only read two cells back, so two variables are enough.'],
        solution: { explain: 'Skip-or-rob recurrence with two rolling variables. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def rob(self, nums: List[int]) -> int:
        prev2, prev1 = 0, 0
        for x in nums:
            prev2, prev1 = prev1, max(prev1, prev2 + x)
        return prev1`,
          js: `function rob(nums) {
  let prev2 = 0, prev1 = 0;
  for (const x of nums) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + x)];
  return prev1;
}` } },
        starter: { py: 'class Solution:\n    def rob(self, nums: List[int]) -> int:\n        ', js: 'function rob(nums) {\n  \n}' },
        tests: { fn: 'rob', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3, 1]], out: 4 }, { args: [[2, 7, 9, 3, 1]], out: 12 }, { args: [[5]], out: 5 }, { args: [[2, 1]], out: 2 }, { args: [[2, 1, 1, 2]], out: 4 }, { args: [[0]], out: 0 }, { args: [[100, 1, 1, 100]], out: 200 }] } },

      { lc: 213,
        hints: ['In a ring, the first and last houses are neighbours, so you can never rob both.', 'Every valid plan leaves out the first house or the last one (or both). So solve two straight-line problems.', 'Answer = max(rob(nums[1:]), rob(nums[:-1])) using the 198 recurrence. With a single house, return it directly.'],
        solution: { explain: 'Split the ring into two lines: without the first house, and without the last. Take the larger of the two linear answers; a single house is a special case. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def rob(self, nums: List[int]) -> int:
        if len(nums) == 1:
            return nums[0]
        def line(a):
            prev2 = prev1 = 0
            for x in a:
                prev2, prev1 = prev1, max(prev1, prev2 + x)
            return prev1
        return max(line(nums[1:]), line(nums[:-1]))`,
          js: `function rob(nums) {
  if (nums.length === 1) return nums[0];
  const line = (a) => {
    let prev2 = 0, prev1 = 0;
    for (const x of a) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + x)];
    return prev1;
  };
  return Math.max(line(nums.slice(1)), line(nums.slice(0, -1)));
}` } },
        starter: { py: 'class Solution:\n    def rob(self, nums: List[int]) -> int:\n        ', js: 'function rob(nums) {\n  \n}' },
        tests: { fn: 'rob', cases: [
          { args: [[2, 3, 2]], out: 3 }, { args: [[1, 2, 3, 1]], out: 4 }, { args: [[1, 2, 3]], out: 3 }, { args: [[5]], out: 5 }, { args: [[1, 3, 1, 3, 100]], out: 103 }, { args: [[200, 3, 140, 20, 10]], out: 340 }, { args: [[4, 1]], out: 4 }] } },

      { lc: 91,
        hints: ['Think about the last piece of the reading: it is either one digit or two digits.', 'One digit counts if it is not "0" (then add `dp[i-1]`); two digits count if they are 10 to 26 (then add `dp[i-2]`).', '`dp[0] = 1` for the empty prefix. Never add a pull from an invalid piece, so "0" and "06" come out as 0.'],
        solution: { explain: 'Two guarded pulls per cell. O(n) time, O(1) space with two rolling variables.', code: {
          py: `class Solution:
    def numDecodings(self, s: str) -> int:
        a, b = 0, 1                        # dp[i-2], dp[i-1]
        for i in range(1, len(s) + 1):
            cur = 0
            if s[i - 1] != '0':
                cur += b
            if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:
                cur += a
            a, b = b, cur
        return b`,
          js: `function numDecodings(s) {
  let a = 0, b = 1;
  for (let i = 1; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== '0') cur += b;
    if (i >= 2) {
      const two = Number(s.slice(i - 2, i));
      if (two >= 10 && two <= 26) cur += a;
    }
    [a, b] = [b, cur];
  }
  return b;
}` } },
        starter: { py: 'class Solution:\n    def numDecodings(self, s: str) -> int:\n        ', js: 'function numDecodings(s) {\n  \n}' },
        tests: { fn: 'numDecodings', sig: { args: ['str'] }, cases: [
          { args: ['12'], out: 2 }, { args: ['226'], out: 3 }, { args: ['06'], out: 0 }, { args: ['10'], out: 1 }, { args: ['2101'], out: 1 }, { args: ['0'], out: 0 }, { args: ['100'], out: 0 }, { args: ['11106'], out: 2 }, { args: ['2611055971756562'], out: 4 }] } },

      { lc: 139,
        hints: ['Ask: can the first i characters be built from words? Which cells does that depend on?', 'The last word ends at i and starts at some j. If `dp[j]` is true and `s[j:i]` is a word, then `dp[i]` is true.', '`dp[0] = true`. Only try word lengths up to the longest word. Put the words in a set for O(1) lookups.'],
        solution: { explain: 'A boolean table over prefixes, with “any” as the combine. O(n · L²) with a hash set, O(n) space.', code: {
          py: `class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        max_len = max(len(w) for w in words)
        dp = [False] * (len(s) + 1)
        dp[0] = True
        for i in range(1, len(s) + 1):
            for L in range(1, min(i, max_len) + 1):
                if dp[i - L] and s[i - L:i] in words:
                    dp[i] = True
                    break
        return dp[len(s)]`,
          js: `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const maxLen = Math.max(...wordDict.map((w) => w.length));
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let L = 1; L <= Math.min(i, maxLen); L++) {
      if (dp[i - L] && words.has(s.slice(i - L, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
}` } },
        starter: { py: 'class Solution:\n    def wordBreak(self, s: str, wordDict: List[str]) -> bool:\n        ', js: 'function wordBreak(s, wordDict) {\n  \n}' },
        tests: { fn: 'wordBreak', sig: { args: ['str', 'list<str>'] }, cases: [
          { args: ['leetcode', ['leet', 'code']], out: true }, { args: ['applepenapple', ['apple', 'pen']], out: true }, { args: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], out: false },
          { args: ['a', ['b']], out: false }, { args: ['aaaaaaa', ['aaaa', 'aaa']], out: true }, { args: ['aaaaaab', ['a', 'aa', 'aaa']], out: false }] } },

      { lc: 122,
        hints: ['You may trade as often as you like, so think of each day-to-day change separately.', 'A price rise between two consecutive days can always be collected by buying yesterday and selling today. A fall never needs to be paid.', 'Add up `max(0, prices[i] - prices[i-1])` over all days. (DP view: keep a “holding” and a “free” value per day.)'],
        solution: { explain: 'Every maximal rising run equals the sum of its daily rises, and falling days contribute nothing, so the total of positive differences is optimal. It matches the hold/free DP in the variations. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        return sum(max(0, b - a) for a, b in zip(prices, prices[1:]))`,
          js: `function maxProfit(prices) {
  let total = 0;
  for (let i = 1; i < prices.length; i++) total += Math.max(0, prices[i] - prices[i - 1]);
  return total;
}` } },
        starter: { py: 'class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ', js: 'function maxProfit(prices) {\n  \n}' },
        tests: { fn: 'maxProfit', cases: [
          { args: [[7, 1, 5, 3, 6, 4]], out: 7 }, { args: [[1, 2, 3, 4, 5]], out: 4 }, { args: [[7, 6, 4, 3, 1]], out: 0 }, { args: [[1]], out: 0 }, { args: [[3, 3, 3]], out: 0 }, { args: [[6, 1, 3, 2, 4, 7]], out: 7 }] } },

      { lc: 343,
        hints: ['Define `dp[i]` as the best product for splitting i into at least two parts. Which first part could you cut off?', 'Cut off a part j. The remainder `i - j` is either kept whole or split further: `max(j * (i - j), j * dp[i - j])`. Try every j. That is O(n²).', 'Printing dp for small n shows the best parts are all 3s (with a 2 or a 4 at the end). So: n ≤ 3 is `n - 1`; otherwise use as many 3s as possible, turning a leftover 1 into a 4.'],
        solution: { explain: 'The DP recurrence is `dp[i] = max over j of max(j·(i-j), j·dp[i-j])`, O(n²). Its table reveals the pattern: 3s beat everything else (2·2·2 < 3·3, and 4 = 2·2 is as good as 4). With `n = 3q + r`: r = 0 gives 3^q; r = 1 gives 3^(q-1) · 4; r = 2 gives 3^q · 2. Special case n ≤ 3 returns `n - 1`, since at least two parts are required. O(log n) with fast power (O(n) with a loop), O(1) space.', code: {
          py: `class Solution:
    def integerBreak(self, n: int) -> int:
        if n <= 3:
            return n - 1
        q, r = divmod(n, 3)
        if r == 0:
            return 3 ** q
        if r == 1:
            return 3 ** (q - 1) * 4
        return 3 ** q * 2`,
          js: `function integerBreak(n) {
  if (n <= 3) return n - 1;
  const q = Math.floor(n / 3), r = n % 3;
  if (r === 0) return 3 ** q;
  if (r === 1) return 3 ** (q - 1) * 4;
  return 3 ** q * 2;
}` } },
        starter: { py: 'class Solution:\n    def integerBreak(self, n: int) -> int:\n        ', js: 'function integerBreak(n) {\n  \n}' },
        tests: { fn: 'integerBreak', cases: [
          { args: [2], out: 1 }, { args: [3], out: 2 }, { args: [4], out: 4 }, { args: [5], out: 6 }, { args: [6], out: 9 }, { args: [7], out: 12 }, { args: [8], out: 18 }, { args: [10], out: 36 }, { args: [58], out: 1549681956 }] } },

      { lc: 279,
        hints: ['Define `dp[i]` as the fewest squares that sum to i. What could the last square be?', '`dp[i] = 1 + min(dp[i - k*k])` over every k with `k*k <= i`, with `dp[0] = 0`. That is O(n√n).', 'There is a faster way: the answer is always 1, 2, 3 or 4. It is 1 if n is a perfect square, 4 if (after dividing out all factors of 4) n mod 8 is 7, 2 if n is a sum of two squares, and 3 otherwise.'],
        solution: { explain: 'The DP is `dp[i] = 1 + min(dp[i - k²])`, O(n√n) time and O(n) space, and is the answer to give first. Lagrange’s four-square theorem caps the answer at 4, and Legendre’s three-square theorem says it is exactly 4 when n, stripped of factors of 4, is 7 mod 8. Check 1 (a square), then 4, then 2 (try each `a` and test whether `n - a²` is a square); else 3. O(√n) time, O(1) space.', code: {
          py: `from math import isqrt

class Solution:
    def numSquares(self, n: int) -> int:
        if isqrt(n) ** 2 == n:
            return 1
        m = n
        while m % 4 == 0:
            m //= 4
        if m % 8 == 7:
            return 4
        for a in range(1, isqrt(n) + 1):
            b = n - a * a
            if isqrt(b) ** 2 == b:
                return 2
        return 3`,
          js: `function numSquares(n) {
  const isSq = (x) => { const r = Math.round(Math.sqrt(x)); return r * r === x; };
  if (isSq(n)) return 1;
  let m = n;
  while (m % 4 === 0) m /= 4;
  if (m % 8 === 7) return 4;
  for (let a = 1; a * a <= n; a++) if (isSq(n - a * a)) return 2;
  return 3;
}` } },
        starter: { py: 'class Solution:\n    def numSquares(self, n: int) -> int:\n        ', js: 'function numSquares(n) {\n  \n}' },
        tests: { fn: 'numSquares', cases: [
          { args: [1], out: 1 }, { args: [2], out: 2 }, { args: [3], out: 3 }, { args: [4], out: 1 }, { args: [7], out: 4 }, { args: [12], out: 3 }, { args: [13], out: 2 }, { args: [28], out: 4 }, { args: [43], out: 3 }, { args: [100], out: 1 }, { args: [6175], out: 4 }, { args: [9999], out: 4 }] } }
    ],

    mistakes: [
      '**A vague state.** If you can’t say in one sentence what `dp[i]` means, stop. “The best total using only the first i houses” is a state; “something about house i” is not. Write the sentence in a comment above the table.',
      '**Wrong or missing base cases.** `dp[0]` is a value that makes the recurrence true, not a “zero”: it is 1 for counting (one empty way), 0 for sums, `True` for feasibility. Then check the **first cells by hand**: `dp[1]` must not read `dp[-1]` (in Python that silently wraps to the last element).',
      '**Reading a cell before it is filled.** The loop order must make every pulled cell already done. Filling a table in the wrong direction gives zeros that look plausible.',
      '**Forgetting that a choice may be invalid.** In decode ways, adding `dp[i-1]` when the digit is `0`, or `dp[i-2]` when the pair is 27, overcounts. Guard each pull with its validity test, and let a cell with no valid pull be 0 (or false).',
      '**Counting a way twice, or missing one.** The pulls must be **disjoint** and **complete**: every way ends in exactly one kind of last piece. If two pulls can describe the same way, you overcount.',
      '**Memo created inside the function.** `memo = {}` at the top of the recursive function is a fresh empty cache on every call and never hits, so you silently keep the exponential time. Create it outside the function (a closure, a parameter or a field), and clear it between independent test cases.',
      '**Using a greedy answer.** `[2,1,1,2]` kills “take the biggest house first”. If a counterexample is easy to write, you need the table. Conversely, **don’t reach for DP when the answer is simpler**: best time to trade a stock is just the sum of rises.',
      '**Language gotchas.** *Python:* `dp = [[0]*n]*m` aliases rows (not an issue in 1-D, but `[0]*(n+1)` is right and `[[]]*n` is wrong); a recursive memo hits the 1000-frame limit for n around 1000. *JavaScript:* `new Array(n)` has holes, so use `.fill(0)`; `Math.max(...hugeArray)` can overflow the argument limit. *Java:* `int` overflows silently in counting DPs (use `long` or a modulus); `boolean[]` starts all false, `int[]` all 0. *C++:* `vector<bool>` is a packed special case, fine for flags but not for references; uninitialised `int dp[n+1]` holds garbage, so always initialise.'
    ],

    quiz: [
      { kind: 'concept', q: 'For house robber, which is a well-formed definition of `dp[i]`?',
        choices: ['The best total using only the first i houses, where each house may be robbed or skipped', 'The money in house i', 'Whether house i is robbed', 'The sum of the first i houses'], answer: 0,
        explain: 'A DP state must describe a smaller *version of the question* so the answer is the last cell. Only the first option does: `dp[n]` is the final answer, and `dp[i]` reads from `dp[i-1]` and `dp[i-2]`.' },
      { kind: 'complexity', q: 'Climbing stairs with a table and two pulls per cell: time and space?',
        choices: ['O(n) time, O(n) space (O(1) space once you keep only the last two cells)', 'O(2ⁿ) time, O(n) space', 'O(n²) time, O(n) space', 'O(log n) time, O(1) space'], answer: 0,
        explain: 'There are n + 1 cells and each is filled with two lookups, so O(n) time. The table is O(n); because each cell only reads the previous two, two variables suffice. O(2ⁿ) is the *unmemoized* recursion.' },
      { kind: 'complexity', q: 'What does adding a cache (memoization) do to the time of the plain recursion `ways(n) = ways(n-1) + ways(n-2)`?',
        choices: ['Exponential → O(n)', 'O(n) → O(log n)', 'No change', 'Exponential → O(n²)'], answer: 0,
        explain: 'Without a cache the call tree has about 1.6ⁿ nodes. With one, each distinct `ways(k)` runs its body once (n + 1 of them) and the other calls are O(1) lookups.' },
      { kind: 'pattern', q: 'Which question has both **overlapping subproblems** and **optimal substructure**, so a table fits?',
        choices: ['Counting the ways a digit string can be read as letters', 'Finding the position of a value in a sorted array', 'Sorting an array with merge sort', 'Finding the maximum depth of a binary tree'], answer: 0,
        explain: 'Decode ways asks “how many readings of the first i digits” and the same prefix is asked again from different paths. In the others, every subproblem is distinct (halves, subtrees), so a cache would never be hit.' },
      { kind: 'bug', q: 'This returns 2 for `"10"`, but the right answer is 1. What is the bug?',
        code: `def num_decodings(s):
    dp = [1] * (len(s) + 1)
    for i in range(2, len(s) + 1):
        if 10 <= int(s[i - 2:i]) <= 26:
            dp[i] = dp[i - 1] + dp[i - 2]
        else:
            dp[i] = dp[i - 1]
    return dp[-1]`,
        choices: ['It adds `dp[i-1]` even when the last digit is "0", which cannot stand alone (and assumes the first digit is nonzero)', 'The loop should start at 0', 'It should return `dp[0]`', 'The range 10 to 26 should be 1 to 26'], answer: 0,
        explain: 'For "10", the lone "0" is not a letter, so the one-digit pull must be skipped; only the pair "10" counts, giving 1. Guard each pull with its own validity check, and compute `dp[1]` from the first digit instead of hard-coding 1.' },
      { kind: 'bug', q: 'This memoized recursion still takes exponential time. Why?',
        code: `def ways(i):
    memo = {}
    if i <= 1:
        return 1
    if i in memo:
        return memo[i]
    memo[i] = ways(i - 1) + ways(i - 2)
    return memo[i]`,
        choices: ['`memo` is created fresh inside every call, so it is always empty and never hits', 'The base case is wrong', 'Dictionaries are slow in Python', 'It needs a third recursive call'], answer: 0,
        explain: 'A cache must outlive the call. Put `memo` outside the function (closure, parameter, field, or `functools.cache`) so later calls can see earlier answers.' },
      { kind: 'concept', q: 'House robber can be reduced to O(1) space, but word break cannot. Why?',
        choices: ['Robber’s cell reads only the last two cells; a word-break cell may read any earlier cell as far back as the longest word', 'Word break uses strings', 'Word break is recursive', 'O(1) space is only possible in Python'], answer: 0,
        explain: 'Space optimization works when each cell depends on a fixed number of *recent* cells. In word break, `dp[i]` may need `dp[i - L]` for many word lengths L, so you must keep up to max-length cells (in practice, the table).' },
      { kind: 'concept', q: 'Which statements about top-down (memoization) and bottom-up (tabulation) are true? Pick every one that applies.',
        choices: ['Top-down only computes the subproblems that are actually reached', 'Bottom-up has no recursion depth to overflow', 'They fill the same table, so they have the same time on a full table', 'Bottom-up always uses less time than top-down by an order of magnitude'], answer: [0, 1, 2],
        explain: 'Both visit each needed state once; top-down skips unreachable ones and uses the call stack, bottom-up uses a loop. Neither is asymptotically faster on a full table, just different in constants and stack use.' },
      { kind: 'pattern', q: 'Houses stand in a circle (the first and last are neighbours). What is the standard approach?',
        choices: ['Solve the straight-line problem twice: once without the first house, once without the last, and take the larger', 'Rob only the biggest house', 'Run the linear DP once and subtract the smaller end', 'Use a different recurrence with three states per house'], answer: 0,
        explain: 'Any valid plan skips the first or the last house (or both), so the best plan is the better of the two linear problems. Remember the one-house special case.' },
      { kind: 'concept', q: 'Which two properties together tell you that dynamic programming applies?',
        choices: ['Overlapping subproblems and optimal substructure', 'A sorted input and a bounded range', 'A graph and a weight on each edge', 'Recursion and a loop'], answer: 0,
        explain: 'Overlapping subproblems mean a table saves repeated work; optimal substructure means the answer to the whole can be built from answers to its parts. Without the first, a cache is pointless; without the second, the table can’t assemble the answer.' }
    ],

    flashcards: [
      { id: 'four-steps', front: 'The four decisions of any DP, in order?', back: '**State** (what does `dp[i]` mean), **recurrence** (how it comes from earlier cells), **base cases**, **order and answer** (fill so every read cell is done; read `dp[n]`).' },
      { id: 'state-sentence', front: 'What makes a good DP state definition?', back: 'A one-sentence meaning that is a *smaller version of the question*, e.g. “the best total using only the first i houses”. The final answer should be one cell. If you can’t write the sentence, the recurrence will be wrong.' },
      { id: 'recurrence-last', front: 'How do you find a recurrence?', back: 'Ask what the **last decision** was: for each possibility, what smaller state came right before? Each possibility is a pull from an earlier cell. The pulls must be disjoint (no way counted twice) and complete.' },
      { id: 'checklist', front: 'The DP-recognition checklist?', back: '**Overlapping subproblems** (the recursion tree repeats nodes) and **optimal substructure** (the whole is built from parts’ answers). If every subproblem is distinct (merge sort, trees) a cache gives nothing.' },
      { id: 'memo-vs-tab', front: 'Memoization vs tabulation?', back: '**Top-down:** recursion plus a cache; computes only needed states; uses stack. **Bottom-up:** a loop fills the table from the base cases; no recursion; easy to shrink. Same table, same time on a full table.' },
      { id: 'climb-rec', front: 'Climbing stairs (1 or 2 steps): recurrence and base?', back: '`dp[i] = dp[i-1] + dp[i-2]`, `dp[0] = dp[1] = 1`. It is Fibonacci. O(n) time, O(1) space with two variables.' },
      { id: 'rob-rec', front: 'House robber recurrence?', back: '`dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])`, `dp[0] = 0`: skip house i or rob it and add to the best two back. O(n) time, O(1) space.' },
      { id: 'rob-circle', front: 'House robber on a circle?', back: 'Run the linear version on `nums[1:]` and on `nums[:-1]`, take the max. Special-case a single house.' },
      { id: 'decode-rec', front: 'Decode ways: recurrence and the traps?', back: '`dp[i] += dp[i-1]` if `s[i-1] != "0"`; `dp[i] += dp[i-2]` if the pair is 10 to 26; `dp[0] = 1`. Traps: a lone 0, a leading 0, pairs above 26.' },
      { id: 'wordbreak-rec', front: 'Word break: state and transition?', back: '`dp[i]` = the first i characters can be built from words. `dp[i]` is true if some `dp[j]` is true and `s[j:i]` is a word. `dp[0] = true`. Limit `j` to the longest word length; use a set.' },
      { id: 'space-opt', front: 'When can you cut a 1-D DP to O(1) space?', back: 'When each cell reads only a **fixed number of recent cells** (like `i-1` and `i-2`). Keep that many variables and slide them. You lose the ability to reconstruct the choices.' },
      { id: 'reconstruct', front: 'How do you recover the choices from a DP table?', back: 'Walk back from `dp[n]`: at each cell, ask which pull produced it (compare with `dp[i-1]`, or re-check each option), jump to that cell, and record the choice. Or store a parent pointer per cell.' },
      { id: 'combine', front: 'Counting, optimizing, deciding: what changes in the combine?', back: 'Counting: **sum** the pulls. Optimizing: **min or max** of the pulls plus the step’s own cost. Deciding: **OR** the pulls. The skeleton (state, base, order) is identical.' }
    ],

    deeper: [
      { title: 'NeetCode: 1-D Dynamic Programming roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where 1-D DP sits among the topics and which problems follow. Use it to pick more practice once these feel easy.' },
      { title: 'Introduction to dynamic programming (cp-algorithms)', url: 'https://cp-algorithms.com/dynamic_programming/intro-to-dp.html', time: 'about 20 min', note: 'A clear walk through states, transitions and bases with a few classic examples, written for contest solvers.' },
      { title: 'functools.cache (Python docs)', url: 'https://docs.python.org/3/library/functools.html#functools.cache', time: 'about 5 min', note: 'The built-in memoizer for the top-down style. Mind the recursion limit and that arguments must be hashable.' },
      { title: 'Dynamic programming (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Dynamic_programming', time: 'about 15 min', note: 'The vocabulary: overlapping subproblems, optimal substructure, memoization and tabulation, with the history of the name.' },
      { title: 'MIT 6.006 Introduction to Algorithms: dynamic programming lectures', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', time: 'about 50 min per lecture', note: 'A rigorous “SRTBOT” framework (subproblems, relations, topological order, base cases, original problem, time) that matches the four steps here.' }
    ],

    detective: [
      { id: 'festival-stalls', decoys: ['greedy', 'kadane', 'backtracking'],
        statement: 'A street festival lines up n stalls along one road. Each stall offers the sponsor a different bonus payment. Neighbouring stalls share an awning, so a sponsor who signs one stall cannot sign either of the stalls right beside it. The sponsor may sign as many other stalls as she likes. What is the largest total bonus she can collect, and which stalls should she sign?',
        why: 'The answer for the first i stalls is built from the answer for i − 1 (skip this stall) or i − 2 (sign it and leave its neighbour). That is a recurrence on prefixes with a take-or-skip choice, and the “which stalls” question is solved by walking back through the table. Always signing the biggest bonus fails, so it is not greedy.' },
      { id: 'hallway-tiles', decoys: ['math', 'backtracking', 'recursion'],
        statement: 'A builder covers a hallway that is n tiles long and one tile wide. He has two kinds of pieces in unlimited supply: small squares that cover one tile and bars that cover two tiles. Two layouts count as different if the sequence of pieces from the front door differs. The builder needs the number of layouts for hallways up to a million tiles, modulo a large prime, before the shop closes. How does he compute it?',
        why: 'The last piece laid is a square or a bar, so the count for length n adds the count for n − 1 and the count for n − 2. Two cases that never overlap, base cases by hand, and a loop over increasing lengths with only two numbers kept: counting DP with O(1) space. Enumerating layouts would be exponential.' },
      { id: 'sign-shop', decoys: ['tries', 'string-dp', 'backtracking'],
        statement: 'A sign shop owns engraved letter-blocks, each block spelling a whole word, and has as many copies of each block as it needs. A customer orders a message typed with no spaces. The shop will lay blocks end to end and cannot cut or bend them. Can the shop reproduce the customer’s message exactly using its blocks? Messages can be thousands of characters long.',
        why: 'Ask the same question for every prefix of the message: can the first i characters be covered? The last block ended at i, so the prefix is coverable if some earlier prefix is coverable and the characters in between spell a block. Prefixes repeat across many different block choices, so trying all splits is exponential while one table over prefixes is cheap. The combine here is OR, not a sum.' }
    ]
  });
})();
