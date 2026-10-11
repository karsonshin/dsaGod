(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  function E(id, title, q, tags, a, py, check, more, cx, see) {
    var o = { id: 'dp-' + id, title: title, q: q, tags: tags, a: a };
    if (py) { o.code = { py: py }; o.check = check; }
    if (more) o.more = more;
    if (cx) o.cx = cx;
    if (see) o.see = see;
    OR.qa.push(o);
  }

  E('what-is-dp', 'What is dynamic programming and how do I recognise it',
    ['what is dynamic programming', 'explain dp', 'how do i know a problem is dp', 'when to use dynamic programming', 'dp vs recursion', 'how to recognise a dp problem'],
    'dp dynamic programming overlapping subproblems optimal substructure memoization recognise',
    'Dynamic programming solves a problem by combining answers to smaller subproblems, storing each answer so it is computed once. Use it when the problem has **optimal substructure** (the best answer is built from best sub-answers) and **overlapping subproblems** (plain recursion would recompute the same inputs).',
    'from functools import lru_cache\n\n@lru_cache(None)\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\n\nprint(fib(50))  # 12586269025',
    'assert fib(50) == 12586269025\nassert fib(0) == 0 and fib(1) == 1',
    'Signals in the wording:\n- "count the number of ways", "minimum/maximum cost", "is it possible"\n- choices at each step where brute force is exponential\n- small integer state (index, remaining capacity, last choice)\n- greedy fails and sorting does not help\n\nIf subproblems never repeat, it is plain divide and conquer, not DP.',
    'Time = (number of states) x (work per state)', ['#/topic/dp-1d', '#/cheatsheets/dp-catalog']);

  E('four-step-recipe', 'The 4-step recipe for solving a DP problem',
    ['how do i solve a dp problem', 'steps to solve dynamic programming', 'dp state recurrence base case', 'how to come up with a dp recurrence', 'dp framework', 'how to approach dp in an interview'],
    'dp recipe state recurrence base case order of computation framework approach',
    'Four steps: (1) **state** - what do the parameters of `f(...)` mean, in one sentence; (2) **recurrence** - express `f` through smaller states; (3) **base cases** - the smallest states with known answers; (4) **order** - an iteration order where dependencies are computed first (or just memoize the recursion). Answer = one specific state.',
    '# Example: climbing stairs\n# state: f(i) = ways to reach step i\n# recurrence: f(i) = f(i-1) + f(i-2)\n# base: f(0)=1, f(1)=1   order: i ascending\ndef climb(n):\n    f = [1, 1]\n    for i in range(2, n + 1):\n        f.append(f[-1] + f[-2])\n    return f[n]\n\nprint(climb(5))  # 8',
    'assert climb(5) == 8\nassert climb(1) == 1',
    'If you cannot state the state in one sentence, the recurrence will be wrong. Say it out loud in the interview.',
    null, ['#/topic/dp-1d', '#/cheatsheets/dp-catalog']);

  E('memo-vs-tab', 'Memoization vs tabulation',
    ['memoization vs tabulation', 'top down vs bottom up dp', 'difference between memoization and tabulation', 'should i use memoization or tabulation', 'top-down dp python', 'bottom-up dynamic programming'],
    'memoization tabulation top-down bottom-up cache recursion table dp',
    'Memoization is top-down: write the recursion, cache results. Tabulation is bottom-up: fill a table in dependency order with loops. Start with memoization (easier to write correctly); switch to tabulation to avoid recursion depth limits or to shrink memory.',
    'from functools import lru_cache\n\ndef paths_memo(m, n):\n    @lru_cache(None)\n    def f(r, c):\n        if r == 0 or c == 0:\n            return 1\n        return f(r - 1, c) + f(r, c - 1)\n    return f(m - 1, n - 1)\n\ndef paths_tab(m, n):\n    dp = [[1] * n for _ in range(m)]\n    for r in range(1, m):\n        for c in range(1, n):\n            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]\n    return dp[-1][-1]\n\nprint(paths_memo(3, 7), paths_tab(3, 7))  # 28 28',
    'assert paths_memo(3, 7) == paths_tab(3, 7) == 28\nassert paths_tab(1, 1) == 1',
    '- Memo only computes states actually reached; tabulation computes all.\n- Python recursion limit (about 1000) can break deep memo; use tabulation or raise the limit.\n- Tabulation makes space optimisation easy (keep only the last row).',
    'Same time O(states); memo adds recursion stack', ['#/topic/dp-1d', '#/topic/recursion']);

  E('fib-stairs', 'Fibonacci and climbing stairs with DP',
    ['climbing stairs', 'fibonacci dynamic programming', 'fibonacci in o(1) space', 'how many ways to climb n stairs', 'nth fibonacci number python iterative', 'climbing stairs leetcode 70'],
    'fibonacci climbing stairs dp 1d leetcode 70 ways',
    'Both are `f(n) = f(n-1) + f(n-2)`. You only need the previous two values, so keep two variables for O(n) time and O(1) space.',
    'def climb_stairs(n):\n    a, b = 1, 1          # ways to reach step 0 and step 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b\n\nprint(climb_stairs(5))  # 8',
    'assert climb_stairs(1) == 1\nassert climb_stairs(2) == 2\nassert climb_stairs(5) == 8\nassert climb_stairs(10) == 89',
    'For huge n use fast doubling or matrix exponentiation (see the Fibonacci matrix entry) for O(log n).',
    'Time O(n), space O(1)', ['#/problem/70', '#/topic/dp-1d']);

  E('house-robber', 'House robber (no two adjacent)',
    ['house robber', 'house robber dp solution', 'max sum of non adjacent elements', 'rob houses without robbing adjacent', 'house robber leetcode 198', 'pick non adjacent numbers for max sum'],
    'house robber non adjacent max sum dp 198 skip take',
    'At each house choose: skip it (keep best so far) or rob it (previous-previous best + this). `best[i] = max(best[i-1], best[i-2] + nums[i])`. Two variables are enough.',
    'def rob(nums):\n    prev2 = prev1 = 0   # best up to i-2, best up to i-1\n    for x in nums:\n        prev2, prev1 = prev1, max(prev1, prev2 + x)\n    return prev1\n\nprint(rob([2, 7, 9, 3, 1]))  # 12',
    'assert rob([2, 7, 9, 3, 1]) == 12\nassert rob([]) == 0\nassert rob([5]) == 5\nassert rob([2, 1, 1, 2]) == 4',
    'Circular street (LC 213): answer is max(rob(nums[1:]), rob(nums[:-1])), with a single house handled separately.',
    'Time O(n), space O(1)', ['#/problem/198', '#/topic/dp-1d']);

  E('coin-change-min', 'Coin change: fewest coins for an amount',
    ['coin change', 'minimum number of coins to make amount', 'coin change dp python', 'fewest coins that sum to target', 'coin change leetcode 322', 'coin change bottom up'],
    'coin change minimum coins dp unbounded 322 amount',
    '`dp[a]` = fewest coins to make amount `a`. `dp[a] = 1 + min(dp[a - c])` over coins `c <= a`. Start with `dp[0] = 0`, everything else infinity; return -1 if the target stays infinite.',
    'def coin_change(coins, amount):\n    INF = float("inf")\n    dp = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and dp[a - c] + 1 < dp[a]:\n                dp[a] = dp[a - c] + 1\n    return dp[amount] if dp[amount] != INF else -1\n\nprint(coin_change([1, 2, 5], 11))  # 3',
    'assert coin_change([1, 2, 5], 11) == 3\nassert coin_change([2], 3) == -1\nassert coin_change([1], 0) == 0\nassert coin_change([186, 419, 83, 408], 6249) == 20',
    'Greedy (take the largest coin) is wrong for general coin sets, e.g. coins [1,3,4], amount 6: greedy gives 4+1+1 (3 coins), best is 3+3 (2 coins).',
    'Time O(amount x coins), space O(amount)', ['#/problem/322', '#/topic/knapsack']);

  E('coin-change-ways', 'Coin change II: number of ways to make an amount',
    ['coin change 2', 'number of ways to make change', 'count combinations of coins', 'coin change number of combinations', 'coin change ii leetcode 518', 'why coin loop goes outside in coin change ways'],
    'coin change ways combinations count unbounded knapsack 518 order loop',
    'Put the **coin loop outside** and the amount loop inside: `dp[a] += dp[a - c]`. That counts combinations (order ignored). Swapping the loops would count permutations (1+2 and 2+1 as different).',
    'def change(amount, coins):\n    dp = [1] + [0] * amount\n    for c in coins:\n        for a in range(c, amount + 1):\n            dp[a] += dp[a - c]\n    return dp[amount]\n\nprint(change(5, [1, 2, 5]))  # 4',
    'assert change(5, [1, 2, 5]) == 4\nassert change(3, [2]) == 0\nassert change(0, [7]) == 1',
    '- Coins outer, amount inner = combinations.\n- Amount outer, coins inner = ordered sequences (LC 377 combination sum IV).',
    'Time O(amount x coins), space O(amount)', ['#/problem/518', '#/topic/knapsack']);

  E('grid-paths', 'Unique paths and minimum path sum in a grid',
    ['unique paths', 'minimum path sum', 'grid dp python', 'min cost path from top left to bottom right', 'count paths in a grid moving right and down', 'minimum path sum leetcode 64'],
    'grid dp unique paths minimum path sum 62 64 matrix 2d',
    '`dp[r][c]` depends on the cell above and the cell to the left. Unique paths: sum them. Min path sum: `grid[r][c] + min(up, left)`. One row of memory is enough.',
    'def unique_paths(m, n):\n    row = [1] * n\n    for _ in range(1, m):\n        for c in range(1, n):\n            row[c] += row[c - 1]\n    return row[-1]\n\ndef min_path_sum(grid):\n    n = len(grid[0])\n    row = [float("inf")] * n\n    row[0] = 0\n    for r in grid:\n        for c in range(n):\n            best = row[c] if c == 0 else min(row[c], row[c - 1])\n            row[c] = best + r[c]\n    return row[-1]\n\nprint(unique_paths(3, 7), min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]))  # 28 7',
    'assert unique_paths(3, 7) == 28\nassert min_path_sum([[1,3,1],[1,5,1],[4,2,1]]) == 7\nassert min_path_sum([[5]]) == 5\nassert unique_paths(1, 5) == 1',
    null, 'Time O(m*n), space O(n)', ['#/problem/62', '#/problem/64', '#/topic/dp-2d']);

  E('lis-n2', 'Longest increasing subsequence in O(n^2)',
    ['longest increasing subsequence', 'lis dp', 'lis o(n^2) python', 'longest increasing subsequence leetcode 300', 'explain lis dynamic programming'],
    'lis longest increasing subsequence dp quadratic 300',
    '`dp[i]` = length of the longest increasing subsequence ending at `i`. `dp[i] = 1 + max(dp[j])` over `j < i` with `nums[j] < nums[i]`. The answer is `max(dp)`, not `dp[-1]`.',
    'def lis(nums):\n    if not nums:\n        return 0\n    dp = [1] * len(nums)\n    for i in range(len(nums)):\n        for j in range(i):\n            if nums[j] < nums[i]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp)\n\nprint(lis([10, 9, 2, 5, 3, 7, 101, 18]))  # 4',
    'assert lis([10,9,2,5,3,7,101,18]) == 4\nassert lis([]) == 0\nassert lis([7,7,7]) == 1\nassert lis([1,2,3,4]) == 4',
    null, 'Time O(n^2), space O(n)', ['#/problem/300', '#/topic/lis']);

  E('lis-nlogn', 'Longest increasing subsequence in O(n log n)',
    ['lis n log n', 'patience sorting lis', 'lis with binary search', 'faster longest increasing subsequence', 'tails array lis bisect'],
    'lis nlogn binary search bisect tails patience sorting',
    'Keep `tails[k]` = the smallest possible last value of an increasing subsequence of length `k+1`. For each number, `bisect_left` finds where it goes: replace that slot, or append if it is larger than all. The length of `tails` is the answer (the list itself is not a real subsequence).',
    'from bisect import bisect_left\n\ndef lis(nums):\n    tails = []\n    for x in nums:\n        i = bisect_left(tails, x)\n        if i == len(tails):\n            tails.append(x)\n        else:\n            tails[i] = x\n    return len(tails)\n\nprint(lis([10, 9, 2, 5, 3, 7, 101, 18]))  # 4',
    'assert lis([10,9,2,5,3,7,101,18]) == 4\nassert lis([]) == 0\nassert lis([2,2,2]) == 1',
    'Use `bisect_right` instead for non-decreasing (allow equal) subsequences.',
    'Time O(n log n), space O(n)', ['#/problem/300', '#/topic/lis', '#/topic/binary-search']);

  E('lcs', 'Longest common subsequence (LCS)',
    ['longest common subsequence', 'lcs dp python', 'lcs leetcode 1143', 'common subsequence of two strings', 'explain lcs table'],
    'lcs longest common subsequence string dp 2d 1143',
    '`dp[i][j]` = LCS length of `a[:i]` and `b[:j]`. If `a[i-1] == b[j-1]` it is `dp[i-1][j-1] + 1`, otherwise `max(dp[i-1][j], dp[i][j-1])`. Answer is `dp[m][n]`.',
    'def lcs(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[m][n]\n\nprint(lcs("abcde", "ace"))  # 3',
    'assert lcs("abcde", "ace") == 3\nassert lcs("abc", "def") == 0\nassert lcs("", "abc") == 0',
    null, 'Time O(m*n), space O(m*n) (O(min(m,n)) if you only need the length)', ['#/problem/1143', '#/topic/string-dp']);

  E('longest-common-substring', 'Longest common substring (contiguous)',
    ['longest common substring', 'longest common substring vs subsequence', 'common substring dp', 'longest repeated subarray', 'maximum length of repeated subarray'],
    'longest common substring subarray contiguous dp 718',
    'Same table as LCS but a mismatch resets to 0: `dp[i][j] = dp[i-1][j-1] + 1` if characters match else `0`. The answer is the **maximum cell**, not the corner.',
    'def longest_common_substring(a, b):\n    best = 0\n    prev = [0] * (len(b) + 1)\n    for i in range(1, len(a) + 1):\n        cur = [0] * (len(b) + 1)\n        for j in range(1, len(b) + 1):\n            if a[i - 1] == b[j - 1]:\n                cur[j] = prev[j - 1] + 1\n                best = max(best, cur[j])\n        prev = cur\n    return best\n\nprint(longest_common_substring("abcdef", "zbcdf"))  # 3',
    'assert longest_common_substring("abcdef", "zbcdf") == 3\nassert longest_common_substring("abc", "xyz") == 0',
    'Subsequence = may skip characters; substring = contiguous.',
    'Time O(m*n), space O(n)', ['#/topic/string-dp']);

  E('edit-distance', 'Edit distance (Levenshtein)',
    ['edit distance', 'levenshtein distance python', 'minimum edits to convert one string to another', 'edit distance dp explained', 'edit distance leetcode 72'],
    'edit distance levenshtein insert delete replace dp 72 strings',
    '`dp[i][j]` = edits to turn `a[:i]` into `b[:j]`. Equal characters cost nothing (`dp[i-1][j-1]`); otherwise `1 + min(delete, insert, replace)` = `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. Base: `dp[i][0] = i`, `dp[0][j] = j`.',
    'def edit_distance(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n    return dp[m][n]\n\nprint(edit_distance("horse", "ros"))  # 3',
    'assert edit_distance("horse", "ros") == 3\nassert edit_distance("", "abc") == 3\nassert edit_distance("same", "same") == 0',
    null, 'Time O(m*n), space O(m*n)', ['#/problem/72', '#/topic/string-dp']);

  E('knapsack-01', '0/1 knapsack',
    ['0/1 knapsack', 'knapsack problem python', 'knapsack dp', 'maximize value with weight limit', 'why does 0/1 knapsack loop backwards', 'knapsack 1d array'],
    'knapsack 0 1 dp weight value capacity backwards loop',
    '`dp[w]` = best value with capacity `w`. For each item loop capacity **downwards**: `dp[w] = max(dp[w], dp[w - wt] + val)`. Going downwards guarantees each item is used at most once.',
    'def knapsack(weights, values, cap):\n    dp = [0] * (cap + 1)\n    for wt, val in zip(weights, values):\n        for w in range(cap, wt - 1, -1):\n            dp[w] = max(dp[w], dp[w - wt] + val)\n    return dp[cap]\n\nprint(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7))  # 9',
    'assert knapsack([1,3,4,5],[1,4,5,7],7) == 9\nassert knapsack([5],[10],4) == 0\nassert knapsack([],[],10) == 0',
    null, 'Time O(n x cap), space O(cap) - pseudo-polynomial', ['#/topic/knapsack', '#/cheatsheets/dp-catalog']);

  E('knapsack-unbounded', 'Unbounded knapsack (items reusable)',
    ['unbounded knapsack', 'knapsack with unlimited items', 'rod cutting', 'knapsack loop forward', 'difference between 0/1 and unbounded knapsack'],
    'unbounded knapsack unlimited reuse rod cutting forward loop dp',
    'Identical to 0/1 knapsack except the capacity loop runs **forwards**, so an item can be reused within the same pass.',
    'def unbounded(weights, values, cap):\n    dp = [0] * (cap + 1)\n    for wt, val in zip(weights, values):\n        for w in range(wt, cap + 1):\n            dp[w] = max(dp[w], dp[w - wt] + val)\n    return dp[cap]\n\nprint(unbounded([2, 3], [4, 5], 7))  # 13',
    'assert unbounded([2,3],[4,5],7) == 13\nassert unbounded([5],[1],4) == 0',
    '0/1: backwards. Unbounded: forwards. That one loop direction is the whole difference. Rod cutting and coin change are unbounded knapsacks.',
    'Time O(n x cap), space O(cap)', ['#/topic/knapsack']);

  E('subset-sum', 'Subset sum and partition equal subset',
    ['subset sum', 'partition equal subset sum', 'can array be split into two equal sums', 'subset sum dp python', 'partition equal subset leetcode 416', 'subset sum with bitset'],
    'subset sum partition equal 416 dp boolean knapsack bitset',
    'Subset sum is a boolean 0/1 knapsack: `dp[s]` is true if some subset adds to `s`; loop `s` downwards per number. Partition into equal halves = subset sum with target `total / 2` (impossible if total is odd). A Python big integer works as a bitset.',
    'def can_partition(nums):\n    total = sum(nums)\n    if total % 2:\n        return False\n    target = total // 2\n    dp = [True] + [False] * target\n    for x in nums:\n        for s in range(target, x - 1, -1):\n            dp[s] = dp[s] or dp[s - x]\n    return dp[target]\n\ndef can_partition_bits(nums):\n    total = sum(nums)\n    if total % 2:\n        return False\n    bits = 1\n    for x in nums:\n        bits |= bits << x\n    return bool(bits >> (total // 2) & 1)\n\nprint(can_partition([1, 5, 11, 5]))  # True',
    'assert can_partition([1,5,11,5]) is True\nassert can_partition([1,2,3,5]) is False\nassert can_partition_bits([1,5,11,5]) is True\nassert can_partition_bits([1,2,3,5]) is False',
    null, 'Time O(n x target), space O(target)', ['#/problem/416', '#/topic/knapsack']);

  E('word-break', 'Word break',
    ['word break', 'word break dp python', 'can a string be segmented into dictionary words', 'word break leetcode 139', 'word break memoization'],
    'word break dictionary segment dp 139 string',
    '`dp[i]` is true if the prefix `s[:i]` can be segmented. For each `i`, check every `j < i` where `dp[j]` is true and `s[j:i]` is in the word set. Use a set for O(1) lookups.',
    'def word_break(s, words):\n    ws = set(words)\n    dp = [True] + [False] * len(s)\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in ws:\n                dp[i] = True\n                break\n    return dp[-1]\n\nprint(word_break("leetcode", ["leet", "code"]))  # True',
    'assert word_break("leetcode", ["leet","code"]) is True\nassert word_break("catsandog", ["cats","dog","sand","and","cat"]) is False\nassert word_break("", ["a"]) is True',
    'Optimisation: only try `j` within the maximum word length.',
    'Time O(n^2 x avg slice cost), space O(n)', ['#/problem/139', '#/topic/string-dp']);

  E('decode-ways', 'Decode ways',
    ['decode ways', 'number of ways to decode a digit string', 'decode ways dp', 'decode ways leetcode 91', 'a=1 b=2 decode string count'],
    'decode ways 91 dp digits letters count',
    '`dp[i]` = ways to decode the first `i` digits. Add `dp[i-1]` if the single digit is 1-9, and add `dp[i-2]` if the two-digit number is 10-26. It is a climbing-stairs recurrence with validity checks.',
    'def num_decodings(s):\n    if not s or s[0] == "0":\n        return 0\n    prev2, prev1 = 1, 1\n    for i in range(1, len(s)):\n        cur = 0\n        if s[i] != "0":\n            cur += prev1\n        if 10 <= int(s[i - 1:i + 1]) <= 26:\n            cur += prev2\n        prev2, prev1 = prev1, cur\n    return prev1\n\nprint(num_decodings("226"))  # 3',
    'assert num_decodings("226") == 3\nassert num_decodings("06") == 0\nassert num_decodings("10") == 1\nassert num_decodings("12") == 2',
    null, 'Time O(n), space O(1)', ['#/problem/91', '#/topic/dp-1d']);

  E('longest-palindromic-substring', 'Longest palindromic substring',
    ['longest palindromic substring', 'longest palindrome in a string', 'expand around center', 'longest palindromic substring leetcode 5', 'find longest palindrome python'],
    'longest palindromic substring expand around center 5 palindrome',
    'Expand around every center (n characters for odd, n-1 gaps for even) while the ends match, and keep the longest. It is O(n^2) with O(1) space and much simpler than the DP table; Manacher gives O(n).',
    'def longest_palindrome(s):\n    best = ""\n    for c in range(len(s)):\n        for l, r in ((c, c), (c, c + 1)):\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                l -= 1\n                r += 1\n            if r - l - 1 > len(best):\n                best = s[l + 1:r]\n    return best\n\nprint(longest_palindrome("babad"))  # bab',
    'assert longest_palindrome("babad") in ("bab","aba")\nassert longest_palindrome("cbbd") == "bb"\nassert longest_palindrome("a") == "a"\nassert longest_palindrome("") == ""',
    null, 'Time O(n^2), space O(1)', ['#/problem/5', '#/topic/string-dp']);

  E('longest-palindromic-subsequence', 'Longest palindromic subsequence',
    ['longest palindromic subsequence', 'lps dp', 'longest palindromic subsequence leetcode 516', 'palindrome subsequence of a string', 'minimum insertions to make palindrome'],
    'longest palindromic subsequence 516 dp interval lcs reverse',
    'It equals the LCS of the string and its reverse. Or use interval DP: `dp[i][j]` = `dp[i+1][j-1] + 2` if `s[i] == s[j]`, else `max(dp[i+1][j], dp[i][j-1])`. Minimum insertions to make a palindrome = `n - LPS`.',
    'def lps(s):\n    n = len(s)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n - 1, -1, -1):\n        dp[i][i] = 1\n        for j in range(i + 1, n):\n            if s[i] == s[j]:\n                dp[i][j] = dp[i + 1][j - 1] + 2\n            else:\n                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])\n    return dp[0][n - 1] if n else 0\n\nprint(lps("bbbab"))  # 4',
    'assert lps("bbbab") == 4\nassert lps("cbbd") == 2\nassert lps("") == 0',
    null, 'Time O(n^2), space O(n^2)', ['#/problem/516', '#/topic/string-dp']);

  E('maximal-square', 'Maximal square in a binary matrix',
    ['maximal square', 'largest square of 1s in a matrix', 'maximal square dp', 'maximal square leetcode 221', 'biggest square submatrix of ones'],
    'maximal square 221 matrix dp binary largest submatrix ones',
    '`dp[r][c]` = side of the largest square of 1s whose bottom-right corner is `(r, c)`. If the cell is 1: `1 + min(up, left, up-left)`, else 0. Answer is the best side squared.',
    'def maximal_square(grid):\n    if not grid:\n        return 0\n    n = len(grid[0])\n    prev = [0] * (n + 1)\n    best = 0\n    for row in grid:\n        cur = [0] * (n + 1)\n        for c in range(n):\n            if row[c] == "1":\n                cur[c + 1] = 1 + min(prev[c], prev[c + 1], cur[c])\n                best = max(best, cur[c + 1])\n        prev = cur\n    return best * best\n\nprint(maximal_square([list("10100"), list("10111"), list("11111"), list("10010")]))  # 4',
    'assert maximal_square([list("10100"),list("10111"),list("11111"),list("10010")]) == 4\nassert maximal_square([list("0")]) == 0\nassert maximal_square([]) == 0',
    null, 'Time O(m*n), space O(n)', ['#/problem/221', '#/topic/dp-2d']);

  E('stock-variants', 'Best time to buy and sell stock (all variants)',
    ['best time to buy and sell stock', 'stock buy sell dp', 'buy and sell stock with cooldown', 'buy sell stock at most k transactions', 'stock problem state machine', 'stock with transaction fee'],
    'stock buy sell 121 122 309 714 188 state machine dp profit cooldown fee',
    'One transaction: track the minimum price so far. Unlimited transactions: sum every positive day-to-day rise. Cooldown, fee and at-most-k variants are state machines with states like "holding" and "not holding", updated per day.',
    'def max_profit_one(prices):\n    lo, best = float("inf"), 0\n    for p in prices:\n        lo = min(lo, p)\n        best = max(best, p - lo)\n    return best\n\ndef max_profit_many(prices):\n    return sum(max(0, b - a) for a, b in zip(prices, prices[1:]))\n\ndef max_profit_cooldown(prices):\n    hold, sold, rest = float("-inf"), 0, 0\n    for p in prices:\n        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)\n    return max(sold, rest)\n\ndef max_profit_k(k, prices):\n    buy = [float("-inf")] * (k + 1)\n    sell = [0] * (k + 1)\n    for p in prices:\n        for t in range(1, k + 1):\n            buy[t] = max(buy[t], sell[t - 1] - p)\n            sell[t] = max(sell[t], buy[t] + p)\n    return sell[k]\n\nprint(max_profit_one([7, 1, 5, 3, 6, 4]), max_profit_many([7, 1, 5, 3, 6, 4]))  # 5 7',
    'assert max_profit_one([7,1,5,3,6,4]) == 5\nassert max_profit_one([7,6,4,3,1]) == 0\nassert max_profit_many([7,1,5,3,6,4]) == 7\nassert max_profit_cooldown([1,2,3,0,2]) == 3\nassert max_profit_k(2, [3,2,6,5,0,3]) == 7',
    'For the fee variant subtract the fee when selling. For k >= n/2 the k limit no longer matters (unlimited).',
    'One/many: O(n); cooldown O(n); at most k: O(n*k)', ['#/problem/121', '#/problem/122', '#/problem/309', '#/topic/dp-1d']);

  E('jump-game', 'Jump game (can you reach the end)',
    ['jump game', 'can i reach the last index', 'jump game leetcode 55', 'jump game greedy', 'reachable end of array with jumps'],
    'jump game 55 greedy reach farthest array',
    'Track the farthest index reachable so far. Walk left to right; if you ever stand on an index beyond `farthest`, you are stuck. Otherwise update `farthest = max(farthest, i + nums[i])`. Greedy beats DP here.',
    'def can_jump(nums):\n    far = 0\n    for i, x in enumerate(nums):\n        if i > far:\n            return False\n        far = max(far, i + x)\n    return True\n\nprint(can_jump([2, 3, 1, 1, 4]), can_jump([3, 2, 1, 0, 4]))  # True False',
    'assert can_jump([2,3,1,1,4]) is True\nassert can_jump([3,2,1,0,4]) is False\nassert can_jump([0]) is True',
    null, 'Time O(n), space O(1)', ['#/problem/55', '#/topic/greedy']);

  E('burst-balloons', 'Burst balloons (interval DP)',
    ['burst balloons', 'interval dp example', 'burst balloons leetcode 312', 'interval dp explained', 'why choose the last balloon to burst'],
    'burst balloons 312 interval dp last k range',
    'Think about the **last** balloon `k` to burst in range `(i, j)`: its neighbours are then the fixed boundaries `nums[i]` and `nums[j]`, which splits the problem into two independent halves. `dp[i][j] = max(dp[i][k] + dp[k][j] + nums[i]*nums[k]*nums[j])`.',
    'def max_coins(nums):\n    a = [1] + nums + [1]\n    n = len(a)\n    dp = [[0] * n for _ in range(n)]\n    for length in range(2, n):\n        for i in range(n - length):\n            j = i + length\n            for k in range(i + 1, j):\n                dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + a[i] * a[k] * a[j])\n    return dp[0][n - 1]\n\nprint(max_coins([3, 1, 5, 8]))  # 167',
    'assert max_coins([3,1,5,8]) == 167\nassert max_coins([1,5]) == 10\nassert max_coins([]) == 0',
    'General interval DP template: iterate by increasing length, try every split point `k`.',
    'Time O(n^3), space O(n^2)', ['#/problem/312', '#/topic/interval-dp']);

  E('matrix-chain', 'Matrix chain multiplication',
    ['matrix chain multiplication', 'matrix chain order dp', 'minimum multiplications for matrix chain', 'parenthesization dp', 'interval dp split point'],
    'matrix chain multiplication interval dp parenthesization split',
    '`dp[i][j]` = minimum scalar multiplications to multiply matrices `i..j`. Try each split `k`: `dp[i][k] + dp[k+1][j] + p[i]*p[k+1]*p[j+1]`, where matrix `t` has shape `p[t] x p[t+1]`.',
    'def matrix_chain(p):\n    n = len(p) - 1          # number of matrices\n    dp = [[0] * n for _ in range(n)]\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            dp[i][j] = min(dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1]\n                           for k in range(i, j))\n    return dp[0][n - 1] if n else 0\n\nprint(matrix_chain([10, 30, 5, 60]))  # 4500',
    'assert matrix_chain([10,30,5,60]) == 4500\nassert matrix_chain([10,20]) == 0\nassert matrix_chain([40,20,30,10,30]) == 26000',
    null, 'Time O(n^3), space O(n^2)', ['#/topic/interval-dp']);

  E('bitmask-tsp', 'Bitmask DP: travelling salesman (TSP)',
    ['travelling salesman dp', 'tsp bitmask dp', 'bitmask dp explained', 'held karp algorithm', 'visit all nodes shortest path bitmask'],
    'tsp travelling salesman bitmask dp held karp subsets visited mask',
    'State = (set of visited cities as a bitmask, current city). `dp[mask][i]` = cheapest way to have visited `mask` ending at `i`. Extend to unvisited `j`: `dp[mask | 1<<j][j] = dp[mask][i] + d[i][j]`. This is Held-Karp, usable for n up to about 20.',
    'def tsp(d):\n    n = len(d)\n    INF = float("inf")\n    dp = [[INF] * n for _ in range(1 << n)]\n    dp[1][0] = 0\n    for mask in range(1 << n):\n        for i in range(n):\n            if dp[mask][i] == INF:\n                continue\n            for j in range(n):\n                if not mask >> j & 1:\n                    nm = mask | 1 << j\n                    dp[nm][j] = min(dp[nm][j], dp[mask][i] + d[i][j])\n    full = (1 << n) - 1\n    return min(dp[full][i] + d[i][0] for i in range(n))\n\nprint(tsp([[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]))  # 80',
    'assert tsp([[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]) == 80\nassert tsp([[0]]) == 0',
    'Mask loop in increasing order is valid because `nm > mask`.',
    'Time O(2^n * n^2), space O(2^n * n)', ['#/topic/bitmask-dp']);

  E('tree-dp', 'Tree DP (house robber III, diameter pattern)',
    ['tree dp', 'dp on trees', 'house robber iii', 'tree dp return two values', 'tree diameter dp', 'post order dp binary tree'],
    'tree dp binary tree postorder house robber 337 rob skip two values',
    'Do a post-order DFS where each node returns a small tuple describing its subtree (e.g. best with / without this node), and combine children at the parent. No memo table needed since each node is visited once.',
    'class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef rob_tree(root):\n    def dfs(node):\n        if not node:\n            return 0, 0            # (rob this node, skip this node)\n        l_rob, l_skip = dfs(node.left)\n        r_rob, r_skip = dfs(node.right)\n        rob = node.val + l_skip + r_skip\n        skip = max(l_rob, l_skip) + max(r_rob, r_skip)\n        return rob, skip\n    return max(dfs(root))\n\nt = Node(3, Node(2, None, Node(3)), Node(3, None, Node(1)))\nprint(rob_tree(t))  # 7',
    't = Node(3, Node(2, None, Node(3)), Node(3, None, Node(1)))\nassert rob_tree(t) == 7\nassert rob_tree(None) == 0\nassert rob_tree(Node(4, Node(1, Node(2)), Node(1))) == 6',
    null, 'Time O(n), space O(h)', ['#/problem/337', '#/topic/tree-dp']);

  E('digit-dp', 'Digit DP idea',
    ['digit dp', 'count numbers up to n with a property', 'what is digit dp', 'digit dp tight flag', 'count numbers without digit 4'],
    'digit dp tight flag count numbers range property memo',
    'Digit DP counts numbers in `[0, N]` with some digit property by building the number digit by digit. State: `(position, tight, extra info)`, where `tight` means the prefix still equals the prefix of N so the next digit is capped by the matching digit of N. Memoize on the states.',
    'from functools import lru_cache\n\ndef count_without_digit(n, bad=4):\n    digits = list(map(int, str(n)))\n    @lru_cache(None)\n    def go(pos, tight):\n        if pos == len(digits):\n            return 1\n        hi = digits[pos] if tight else 9\n        total = 0\n        for d in range(hi + 1):\n            if d != bad:\n                total += go(pos + 1, tight and d == hi)\n        return total\n    return go(0, True)    # counts 0..n\n\nprint(count_without_digit(100))  # 82 (0..100 without a 4)',
    'assert count_without_digit(100) == 82\nassert count_without_digit(3) == 4\nassert count_without_digit(4) == 4',
    'Add a "started" flag to handle leading zeros when they matter. Range [a, b] = f(b) - f(a-1).',
    'Time O(digits x states x 10)', ['#/topic/dp-1d']);

  E('space-optimise', 'Space optimisation of DP tables',
    ['how to optimize dp space', 'reduce dp space complexity', 'rolling array dp', 'dp 2d to 1d', 'space optimized dynamic programming'],
    'dp space optimization rolling array 1d row previous state memory',
    'If row `i` depends only on row `i-1` (or the same row), keep one or two rows instead of the whole table. Loop direction matters when updating in place: iterate so you never overwrite a value you still need.',
    'def lcs_len(a, b):\n    prev = [0] * (len(b) + 1)\n    for ch in a:\n        cur = [0]\n        for j, bc in enumerate(b, 1):\n            cur.append(prev[j - 1] + 1 if ch == bc else max(prev[j], cur[j - 1]))\n        prev = cur\n    return prev[-1]\n\nprint(lcs_len("abcde", "ace"))  # 3',
    'assert lcs_len("abcde", "ace") == 3\nassert lcs_len("", "x") == 0',
    '- Depends on i-1 only: two rows (or one with care).\n- Depends on i-1 and i-2: two or three variables.\n- Trade-off: you lose the ability to reconstruct the path unless you store extra info.',
    'Space drops from O(m*n) to O(n)', ['#/topic/dp-2d', '#/topic/knapsack']);

  E('reconstruct-path', 'Reconstruct the actual answer from a DP table',
    ['reconstruct dp solution', 'print the lcs string not just length', 'how to get the path from dp', 'backtrack through dp table', 'recover chosen items from dp'],
    'reconstruct path backtrack dp table parent pointers lcs string traceback',
    'Fill the full table, then walk back from the final cell, at each step re-deciding which transition produced the value (or store a parent pointer when filling). Space optimisation breaks this, so keep the full table when you need the answer itself.',
    'def lcs_string(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            dp[i][j] = dp[i-1][j-1] + 1 if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])\n    out, i, j = [], m, n\n    while i and j:\n        if a[i - 1] == b[j - 1]:\n            out.append(a[i - 1]); i -= 1; j -= 1\n        elif dp[i - 1][j] >= dp[i][j - 1]:\n            i -= 1\n        else:\n            j -= 1\n    return "".join(reversed(out))\n\nprint(lcs_string("abcde", "ace"))  # ace',
    'assert lcs_string("abcde", "ace") == "ace"\nassert lcs_string("abc", "xyz") == ""\nassert len(lcs_string("AGGTAB", "GXTXAYB")) == 4',
    null, 'Time O(m*n), space O(m*n)', ['#/topic/string-dp']);

  // ---------- backtracking ----------
  E('bt-template', 'Backtracking template (choose, explore, un-choose)',
    ['backtracking template', 'how does backtracking work', 'how to write a backtracking function', 'explain backtracking', 'choose explore unchoose', 'backtracking vs recursion'],
    'backtracking template choose explore unchoose recursion decision tree path',
    'Backtracking builds a solution one choice at a time with recursion: **choose** an option, **explore** deeper, then **un-choose** (undo) so the next option starts from a clean state. Record a copy of `path` when it is a complete answer.',
    'def solve(options):\n    res, path = [], []\n    def backtrack(start):\n        res.append(path[:])          # record (copy!) - here every prefix is valid\n        for i in range(start, len(options)):\n            path.append(options[i])  # choose\n            backtrack(i + 1)         # explore\n            path.pop()               # un-choose\n    backtrack(0)\n    return res\n\nprint(solve([1, 2]))  # [[], [1], [1, 2], [2]]',
    'assert solve([1,2]) == [[],[1],[1,2],[2]]\nassert solve([]) == [[]]',
    '- Always append `path[:]` (a copy), never `path` itself.\n- Pruning = return early when a partial path cannot become valid.\n- The decision tree size sets the complexity (often 2^n or n!).',
    null, ['#/topic/backtracking']);

  E('subsets', 'Generate all subsets (power set)',
    ['subsets', 'all subsets of a list python', 'power set', 'generate all subsets backtracking', 'subsets leetcode 78', 'subsets with duplicates'],
    'subsets power set 78 90 backtracking bitmask duplicates',
    'Backtrack with a `start` index: record every path, then try each later element. For input with duplicates, sort first and skip an element equal to the previous one at the same depth (`i > start and nums[i] == nums[i-1]`).',
    'def subsets(nums):\n    res, path = [], []\n    def bt(start):\n        res.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            bt(i + 1)\n            path.pop()\n    bt(0)\n    return res\n\ndef subsets_dup(nums):\n    nums = sorted(nums)\n    res, path = [], []\n    def bt(start):\n        res.append(path[:])\n        for i in range(start, len(nums)):\n            if i > start and nums[i] == nums[i - 1]:\n                continue\n            path.append(nums[i])\n            bt(i + 1)\n            path.pop()\n    bt(0)\n    return res\n\nprint(len(subsets([1, 2, 3])), subsets_dup([1, 2, 2]))  # 8 [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]',
    'assert len(subsets([1,2,3])) == 8\nassert subsets([]) == [[]]\nassert subsets_dup([1,2,2]) == [[],[1],[1,2],[1,2,2],[2],[2,2]]',
    null, 'Time O(n * 2^n), space O(n) recursion plus output', ['#/problem/78', '#/problem/90', '#/topic/backtracking']);

  E('permutations', 'Generate all permutations',
    ['permutations', 'all permutations of a list python', 'permutations leetcode 46', 'generate permutations backtracking', 'permutations with used array', 'itertools permutations'],
    'permutations 46 backtracking used array itertools n factorial',
    'Backtrack with a `used` array: at each depth try every unused element, mark it, recurse, unmark. A permutation is complete when `len(path) == n`. In Python `list(itertools.permutations(nums))` does the same if a library is allowed.',
    'def permutations(nums):\n    res, path = [], []\n    used = [False] * len(nums)\n    def bt():\n        if len(path) == len(nums):\n            res.append(path[:])\n            return\n        for i in range(len(nums)):\n            if used[i]:\n                continue\n            used[i] = True\n            path.append(nums[i])\n            bt()\n            path.pop()\n            used[i] = False\n    bt()\n    return res\n\nprint(permutations([1, 2, 3]))  # 6 lists',
    'assert len(permutations([1,2,3])) == 6\nassert permutations([1]) == [[1]]\nassert sorted(permutations([1,2])) == [[1,2],[2,1]]',
    null, 'Time O(n * n!), space O(n)', ['#/problem/46', '#/topic/backtracking']);

  E('permutations-dup', 'Permutations with duplicate elements',
    ['permutations with duplicates', 'unique permutations', 'permutations ii', 'permutations leetcode 47', 'skip duplicates in backtracking'],
    'permutations ii 47 duplicates unique sort skip used backtracking',
    'Sort the input. When trying element `i`, skip it if it equals `nums[i-1]` and `nums[i-1]` is **not currently used** - that means an identical value was just tried at this depth, so this branch would repeat the same permutations.',
    'def permute_unique(nums):\n    nums = sorted(nums)\n    res, path = [], []\n    used = [False] * len(nums)\n    def bt():\n        if len(path) == len(nums):\n            res.append(path[:])\n            return\n        for i in range(len(nums)):\n            if used[i] or (i > 0 and nums[i] == nums[i - 1] and not used[i - 1]):\n                continue\n            used[i] = True\n            path.append(nums[i])\n            bt()\n            path.pop()\n            used[i] = False\n    bt()\n    return res\n\nprint(permute_unique([1, 1, 2]))  # [[1, 1, 2], [1, 2, 1], [2, 1, 1]]',
    'assert permute_unique([1,1,2]) == [[1,1,2],[1,2,1],[2,1,1]]\nassert len(permute_unique([1,1,1])) == 1',
    null, 'Time O(n * n!) worst case, space O(n)', ['#/topic/backtracking']);

  E('combinations', 'Combinations: choose k from n',
    ['combinations', 'n choose k combinations python', 'combinations leetcode 77', 'generate all k combinations', 'itertools combinations'],
    'combinations 77 n choose k backtracking itertools start index',
    'Backtrack over numbers 1..n with a `start` index so each combination is built in increasing order (no repeats). Stop when the path has `k` items. Prune: stop looping when fewer than `k - len(path)` numbers remain.',
    'def combine(n, k):\n    res, path = [], []\n    def bt(start):\n        if len(path) == k:\n            res.append(path[:])\n            return\n        for i in range(start, n - (k - len(path)) + 2):   # pruning\n            path.append(i)\n            bt(i + 1)\n            path.pop()\n    bt(1)\n    return res\n\nprint(combine(4, 2))  # [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]',
    'assert combine(4,2) == [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]\nassert combine(1,1) == [[1]]\nassert len(combine(6,3)) == 20',
    null, 'Time O(k * C(n,k)), space O(k)', ['#/topic/backtracking']);

  E('combination-sum', 'Combination sum',
    ['combination sum', 'combination sum leetcode 39', 'combination sum with reuse', 'combination sum ii no duplicates', 'find combinations that add up to target'],
    'combination sum 39 40 target backtracking reuse pruning sorted',
    'Sort candidates, backtrack with a running remaining target. To allow reuse recurse with `i` (not `i + 1`). Stop a loop as soon as a candidate exceeds the remaining target (sorted order makes this safe). For Combination Sum II (each used once) recurse with `i + 1` and skip duplicates at the same depth.',
    'def combination_sum(cands, target):\n    cands = sorted(cands)\n    res, path = [], []\n    def bt(start, rem):\n        if rem == 0:\n            res.append(path[:])\n            return\n        for i in range(start, len(cands)):\n            if cands[i] > rem:\n                break\n            path.append(cands[i])\n            bt(i, rem - cands[i])\n            path.pop()\n    bt(0, target)\n    return res\n\nprint(combination_sum([2, 3, 6, 7], 7))  # [[2, 2, 3], [7]]',
    'assert combination_sum([2,3,6,7],7) == [[2,2,3],[7]]\nassert combination_sum([2],1) == []\nassert sorted(combination_sum([2,3,5],8)) == [[2,2,2,2],[2,3,3],[3,5]]',
    null, 'Exponential; bounded by target / min(candidate) depth', ['#/problem/39', '#/problem/40', '#/topic/backtracking']);

  E('n-queens', 'N-Queens',
    ['n queens', 'n-queens solution python', 'place n queens on a chessboard', 'n queens leetcode 51', 'count n queens solutions', 'n queens with sets'],
    'n queens 51 52 backtracking columns diagonals sets chessboard',
    'Place one queen per row. Track used columns and the two diagonals in sets: `r - c` identifies one diagonal direction and `r + c` the other. A cell is safe only if none of the three is taken.',
    'def solve_n_queens(n):\n    cols, d1, d2 = set(), set(), set()\n    board, res = [], []\n    def bt(r):\n        if r == n:\n            res.append(["." * c + "Q" + "." * (n - c - 1) for c in board])\n            return\n        for c in range(n):\n            if c in cols or r - c in d1 or r + c in d2:\n                continue\n            cols.add(c); d1.add(r - c); d2.add(r + c); board.append(c)\n            bt(r + 1)\n            cols.remove(c); d1.remove(r - c); d2.remove(r + c); board.pop()\n    bt(0)\n    return res\n\nprint(len(solve_n_queens(6)), solve_n_queens(4)[0])  # 4 [".Q..", "...Q", "Q...", "..Q."]',
    'assert len(solve_n_queens(4)) == 2\nassert len(solve_n_queens(8)) == 92\nassert solve_n_queens(1) == [["Q"]]\nassert solve_n_queens(3) == []',
    null, 'Roughly O(n!) with pruning, space O(n)', ['#/problem/51', '#/topic/backtracking']);

  E('sudoku', 'Sudoku solver idea',
    ['sudoku solver', 'how to solve sudoku with backtracking', 'sudoku solver leetcode 37', 'sudoku backtracking python', 'solve sudoku algorithm'],
    'sudoku solver 37 backtracking constraint rows columns boxes',
    'Find an empty cell, try digits 1-9 that do not clash with its row, column or 3x3 box, recurse, and undo on failure. Return True the moment the board is complete. Speed-up: always pick the empty cell with the fewest candidates.',
    'def solve_sudoku(b):\n    def ok(r, c, d):\n        for i in range(9):\n            if b[r][i] == d or b[i][c] == d:\n                return False\n        br, bc = r // 3 * 3, c // 3 * 3\n        return all(b[br + i][bc + j] != d for i in range(3) for j in range(3))\n    def bt():\n        for r in range(9):\n            for c in range(9):\n                if b[r][c] == 0:\n                    for d in range(1, 10):\n                        if ok(r, c, d):\n                            b[r][c] = d\n                            if bt():\n                                return True\n                            b[r][c] = 0\n                    return False\n        return True\n    return bt()\n\nbase = "534678912672195348198342567859761423426853791713924856961537284287419635345286179"\nboard = [[int(base[r * 9 + c]) for c in range(9)] for r in range(9)]\nboard[0][2] = board[4][4] = board[8][8] = 0\nprint(solve_sudoku(board), board[0][2])  # True 4',
    'assert board[0][2] == 4 and board[4][4] == 5 and board[8][8] == 9\nassert all(sorted(row) == list(range(1, 10)) for row in board)',
    null, 'Exponential worst case; fast in practice with constraint checks', ['#/topic/backtracking']);

  E('word-search', 'Word search in a grid',
    ['word search', 'word search leetcode 79', 'find a word in a grid dfs', 'word search backtracking python', 'search word in 2d board'],
    'word search 79 grid dfs backtracking visited board',
    'DFS from every cell that matches the first letter. Mark the current cell as used (overwrite it with a sentinel), try the four neighbours for the next letter, then restore the cell on the way back.',
    'def exist(board, word):\n    R, C = len(board), len(board[0])\n    def dfs(r, c, i):\n        if i == len(word):\n            return True\n        if not (0 <= r < R and 0 <= c < C) or board[r][c] != word[i]:\n            return False\n        ch, board[r][c] = board[r][c], "#"\n        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or\n                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))\n        board[r][c] = ch\n        return found\n    return any(dfs(r, c, 0) for r in range(R) for c in range(C))\n\ng = [list("ABCE"), list("SFCS"), list("ADEE")]\nprint(exist(g, "ABCCED"), exist(g, "ABCB"))  # True False',
    'g = [list("ABCE"), list("SFCS"), list("ADEE")]\nassert exist(g, "ABCCED") is True\nassert exist(g, "SEE") is True\nassert exist(g, "ABCB") is False',
    null, 'Time O(R*C*4^L), space O(L)', ['#/problem/79', '#/topic/backtracking']);

  E('palindrome-partitioning', 'Palindrome partitioning',
    ['palindrome partitioning', 'split string into palindromes', 'palindrome partitioning leetcode 131', 'all palindrome partitions of a string'],
    'palindrome partitioning 131 backtracking cut string',
    'Backtrack on the cut position: for each end index, if `s[start:end]` is a palindrome, add it to the path and recurse from `end`. When `start == len(s)` the path is a full partition.',
    'def partition(s):\n    res, path = [], []\n    def bt(start):\n        if start == len(s):\n            res.append(path[:])\n            return\n        for end in range(start + 1, len(s) + 1):\n            piece = s[start:end]\n            if piece == piece[::-1]:\n                path.append(piece)\n                bt(end)\n                path.pop()\n    bt(0)\n    return res\n\nprint(partition("aab"))  # [["a", "a", "b"], ["aa", "b"]]',
    'assert partition("aab") == [["a","a","b"],["aa","b"]]\nassert partition("a") == [["a"]]',
    'Precompute an `is_pal[i][j]` table with DP to avoid re-checking substrings.',
    'Time O(n * 2^n)', ['#/problem/131', '#/topic/backtracking']);

  E('generate-parentheses', 'Generate parentheses',
    ['generate parentheses', 'all valid parentheses combinations', 'generate parentheses leetcode 22', 'well formed parentheses n pairs', 'balanced brackets generation'],
    'generate parentheses 22 backtracking balanced open close',
    'Build the string left to right keeping counts of opens and closes used. You may add `(` while `open < n`, and `)` while `close < open`. That rule alone guarantees every result is valid, so no validity check is needed.',
    'def generate_parenthesis(n):\n    res = []\n    def bt(cur, o, c):\n        if len(cur) == 2 * n:\n            res.append(cur)\n            return\n        if o < n:\n            bt(cur + "(", o + 1, c)\n        if c < o:\n            bt(cur + ")", o, c + 1)\n    bt("", 0, 0)\n    return res\n\nprint(generate_parenthesis(3))  # 5 strings',
    'assert sorted(generate_parenthesis(2)) == ["(())","()()"]\nassert len(generate_parenthesis(4)) == 14\nassert generate_parenthesis(1) == ["()"]',
    null, 'Output size is the Catalan number C(n), about 4^n / n^1.5', ['#/problem/22', '#/topic/backtracking']);

  E('letter-combinations', 'Letter combinations of a phone number',
    ['letter combinations of a phone number', 'phone keypad combinations', 'letter combinations leetcode 17', 'cartesian product backtracking', 'digits to letters combinations'],
    'letter combinations phone 17 keypad backtracking product',
    'Map each digit to its letters and backtrack: one position per digit, try each letter. Return an empty list for empty input (not `[""]`).',
    'def letter_combinations(digits):\n    if not digits:\n        return []\n    m = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno",\n         "7": "pqrs", "8": "tuv", "9": "wxyz"}\n    res = []\n    def bt(i, cur):\n        if i == len(digits):\n            res.append("".join(cur))\n            return\n        for ch in m[digits[i]]:\n            cur.append(ch)\n            bt(i + 1, cur)\n            cur.pop()\n    bt(0, [])\n    return res\n\nprint(letter_combinations("23"))  # [\'ad\', \'ae\', ...]',
    'assert letter_combinations("23") == ["ad","ae","af","bd","be","bf","cd","ce","cf"]\nassert letter_combinations("") == []\nassert len(letter_combinations("79")) == 16',
    null, 'Time O(4^n * n), space O(n)', ['#/problem/17', '#/topic/backtracking']);

  E('pruning', 'Pruning in backtracking',
    ['pruning backtracking', 'how to speed up backtracking', 'what is pruning in recursion', 'optimize backtracking', 'backtracking too slow'],
    'pruning backtracking optimize bound early exit constraint speed',
    'Pruning means abandoning a branch the moment it cannot lead to a valid answer. Common forms: stop when the running sum exceeds the target (sort first), stop when too few items remain, keep sets for O(1) conflict checks, and skip duplicate values at the same depth.',
    'def count_subsets_sum(nums, target):\n    nums = sorted(nums)\n    count = 0\n    def bt(i, rem):\n        nonlocal count\n        if rem == 0:\n            count += 1          # keep going: zeros can extend\n        for j in range(i, len(nums)):\n            if nums[j] > rem:\n                break           # prune: sorted, so everything after is too big\n            bt(j + 1, rem - nums[j])\n    bt(0, target)\n    return count\n\nprint(count_subsets_sum([1, 2, 3, 4, 5], 5))  # 3 ({5}, {1,4}, {2,3})',
    'assert count_subsets_sum([1,2,3,4,5],5) == 3\nassert count_subsets_sum([10,20],5) == 0',
    'Pruning does not change worst-case complexity but often cuts real running time by orders of magnitude.',
    null, ['#/topic/backtracking']);

  // ---------- greedy ----------
  E('greedy-when', 'When does greedy work (and when does it fail)',
    ['when does greedy work', 'greedy vs dynamic programming', 'how to know if greedy is correct', 'greedy algorithm explained', 'greedy choice property', 'why greedy fails'],
    'greedy vs dp exchange argument greedy choice property optimal substructure proof',
    'Greedy works when a locally best choice can always be extended to a globally best answer (the **greedy-choice property**, usually shown by an exchange argument) plus optimal substructure. If a counterexample exists, you need DP. Try small cases by hand before committing.',
    'def greedy_coins(coins, amount):\n    n = 0\n    for c in sorted(coins, reverse=True):\n        n += amount // c\n        amount %= c\n    return n if amount == 0 else -1\n\nprint(greedy_coins([25, 10, 5, 1], 30))  # 2 (correct)\nprint(greedy_coins([1, 3, 4], 6))        # 3 (wrong, optimum is 2)',
    'assert greedy_coins([25,10,5,1],30) == 2\nassert greedy_coins([1,3,4],6) == 3  # but 3+3 uses only 2 coins: greedy fails',
    '- Works: activity selection, interval merging, Huffman, Dijkstra, minimum spanning tree, jump game.\n- Fails: general coin change, 0/1 knapsack, longest path.\n- Fractional knapsack is greedy; 0/1 knapsack is not.',
    null, ['#/topic/greedy', '#/cheatsheets/dp-catalog']);

  E('activity-selection', 'Activity selection / maximum non-overlapping intervals',
    ['activity selection', 'maximum number of non overlapping intervals', 'interval scheduling greedy', 'non overlapping intervals leetcode 435', 'sort by end time greedy', 'meeting rooms max meetings'],
    'activity selection interval scheduling greedy sort end time 435 non overlapping',
    'Sort by **end time** and take every interval that starts at or after the last chosen end. Finishing earliest leaves the most room for the rest. Minimum removals to make the rest non-overlapping = `n - taken`.',
    'def max_non_overlapping(intervals):\n    end = float("-inf")\n    taken = 0\n    for s, e in sorted(intervals, key=lambda x: x[1]):\n        if s >= end:\n            taken += 1\n            end = e\n    return taken\n\nprint(max_non_overlapping([[1, 2], [2, 3], [3, 4], [1, 3]]))  # 3',
    'assert max_non_overlapping([[1,2],[2,3],[3,4],[1,3]]) == 3\nassert max_non_overlapping([]) == 0\nassert max_non_overlapping([[1,2],[1,2],[1,2]]) == 1',
    'Sorting by start time or by length is wrong.',
    'Time O(n log n), space O(1) extra', ['#/problem/435', '#/topic/greedy', '#/topic/intervals']);

  E('jump-game-ii', 'Jump game II (minimum jumps)',
    ['jump game ii', 'minimum number of jumps to reach the end', 'jump game 2 leetcode 45', 'min jumps greedy bfs', 'fewest jumps array'],
    'jump game 2 45 minimum jumps greedy bfs levels window',
    'Treat it as BFS over index ranges. Keep the end of the current jump range and the farthest reachable from it; when you reach the end of the range, take a jump and extend the range to `farthest`.',
    'def jump(nums):\n    jumps = cur_end = far = 0\n    for i in range(len(nums) - 1):\n        far = max(far, i + nums[i])\n        if i == cur_end:\n            jumps += 1\n            cur_end = far\n    return jumps\n\nprint(jump([2, 3, 1, 1, 4]))  # 2',
    'assert jump([2,3,1,1,4]) == 2\nassert jump([2,3,0,1,4]) == 2\nassert jump([0]) == 0\nassert jump([1,1,1,1]) == 3',
    'Assumes the end is reachable (as the problem guarantees).',
    'Time O(n), space O(1)', ['#/problem/45', '#/topic/greedy']);

  E('gas-station', 'Gas station (circular route)',
    ['gas station', 'gas station leetcode 134', 'circular tour starting point', 'gas station greedy proof', 'which station to start from'],
    'gas station 134 greedy circular tour total tank',
    'If total gas is less than total cost, no start works. Otherwise scan once keeping a running tank; whenever it drops below zero, the start must be after this index, so reset the tank and set start to `i + 1`. The surviving start is the answer.',
    'def can_complete_circuit(gas, cost):\n    if sum(gas) < sum(cost):\n        return -1\n    start = tank = 0\n    for i in range(len(gas)):\n        tank += gas[i] - cost[i]\n        if tank < 0:\n            start, tank = i + 1, 0\n    return start\n\nprint(can_complete_circuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]))  # 3',
    'assert can_complete_circuit([1,2,3,4,5],[3,4,5,1,2]) == 3\nassert can_complete_circuit([2,3,4],[3,4,3]) == -1\nassert can_complete_circuit([5],[4]) == 0',
    null, 'Time O(n), space O(1)', ['#/problem/134', '#/topic/greedy']);

  E('task-scheduler', 'Task scheduler (cooldown n)',
    ['task scheduler', 'task scheduler leetcode 621', 'minimum time to finish tasks with cooldown', 'cpu scheduling with cooldown greedy', 'most frequent task formula'],
    'task scheduler 621 cooldown greedy formula max frequency idle',
    'The most frequent task decides the frame: `(maxFreq - 1) * (n + 1) + countOfTasksWithMaxFreq`. The answer is that or `len(tasks)`, whichever is larger (when there are enough different tasks, no idle time is needed).',
    'from collections import Counter\n\ndef least_interval(tasks, n):\n    freq = Counter(tasks)\n    mx = max(freq.values())\n    n_max = sum(1 for v in freq.values() if v == mx)\n    return max(len(tasks), (mx - 1) * (n + 1) + n_max)\n\nprint(least_interval(list("AAABBB"), 2))  # 8',
    'assert least_interval(list("AAABBB"),2) == 8\nassert least_interval(list("AAABBB"),0) == 6\nassert least_interval(list("AAAAAABCDEFG"),2) == 16',
    'A max-heap plus a cooldown queue also works and builds the actual schedule.',
    'Time O(n), space O(1) (26 letters)', ['#/problem/621', '#/topic/greedy', '#/topic/heaps']);

  E('huffman', 'Huffman coding idea',
    ['huffman coding', 'huffman tree python', 'how does huffman encoding work', 'optimal prefix code greedy', 'huffman with heap'],
    'huffman coding prefix code greedy heap tree compression',
    'Repeatedly merge the two lowest-frequency nodes into a parent whose weight is their sum, using a min-heap, until one tree remains. Read codes off the tree (left = 0, right = 1). Frequent symbols end up near the root, so they get short codes, and no code is a prefix of another.',
    'import heapq\nfrom itertools import count\n\ndef huffman(freq):\n    tick = count()\n    heap = [(f, next(tick), ch) for ch, f in freq.items()]\n    heapq.heapify(heap)\n    while len(heap) > 1:\n        f1, _, a = heapq.heappop(heap)\n        f2, _, b = heapq.heappop(heap)\n        heapq.heappush(heap, (f1 + f2, next(tick), (a, b)))\n    codes = {}\n    def walk(node, code):\n        if isinstance(node, tuple):\n            walk(node[0], code + "0")\n            walk(node[1], code + "1")\n        else:\n            codes[node] = code or "0"\n    walk(heap[0][2], "")\n    return codes\n\nc = huffman({"a": 45, "b": 13, "c": 12, "d": 16, "e": 9, "f": 5})\nprint(c["a"], sum(len(c[k]) * v for k, v in {"a": 45, "b": 13, "c": 12, "d": 16, "e": 9, "f": 5}.items()))  # 0 224',
    'f = {"a": 45, "b": 13, "c": 12, "d": 16, "e": 9, "f": 5}\nassert sum(len(c[k]) * v for k, v in f.items()) == 224\nassert len(c["a"]) == 1\nassert huffman({"x": 1}) == {"x": "0"}',
    'The counter in the tuple stops the heap from comparing nodes when frequencies tie.',
    'Time O(n log n)', ['#/topic/greedy', '#/topic/heaps']);

  // ---------- bits ----------
  E('single-number', 'Single number with XOR',
    ['single number', 'find the element that appears once', 'xor trick find unique number', 'single number leetcode 136', 'single number ii appears three times', 'find the missing number xor'],
    'single number 136 137 xor unique missing number bit manipulation',
    'XOR all numbers: `a ^ a = 0` and `a ^ 0 = a`, so pairs cancel and the lone element remains. O(n) time, O(1) space. The same trick finds a missing number in 0..n: XOR indices and values together.',
    'from functools import reduce\nfrom operator import xor\n\ndef single_number(nums):\n    return reduce(xor, nums)\n\ndef missing_number(nums):\n    r = len(nums)\n    for i, x in enumerate(nums):\n        r ^= i ^ x\n    return r\n\nprint(single_number([4, 1, 2, 1, 2]), missing_number([3, 0, 1]))  # 4 2',
    'assert single_number([4,1,2,1,2]) == 4\nassert single_number([7]) == 7\nassert missing_number([3,0,1]) == 2\nassert missing_number([0]) == 1',
    'When every other number appears three times (LC 137), count each bit position modulo 3, or use the `ones`/`twos` state-machine trick.',
    'Time O(n), space O(1)', ['#/problem/136', '#/topic/bits']);

  E('count-bits', 'Count set bits (popcount)',
    ['count set bits', 'number of 1 bits', 'hamming weight', 'count bits leetcode 338', 'brian kernighan algorithm', 'popcount python'],
    'count bits popcount hamming weight 191 338 brian kernighan n and n-1',
    '`n & (n - 1)` clears the lowest set bit, so loop until `n == 0` and count the iterations (Brian Kernighan). In Python 3.10+ use `n.bit_count()`; `bin(n).count("1")` works anywhere. For 0..n at once: `bits[i] = bits[i >> 1] + (i & 1)`.',
    'def popcount(n):\n    c = 0\n    while n:\n        n &= n - 1\n        c += 1\n    return c\n\ndef count_bits_upto(n):\n    bits = [0] * (n + 1)\n    for i in range(1, n + 1):\n        bits[i] = bits[i >> 1] + (i & 1)\n    return bits\n\nprint(popcount(11), count_bits_upto(5))  # 3 [0, 1, 1, 2, 1, 2]',
    'assert popcount(11) == 3 == bin(11).count("1")\nassert popcount(0) == 0\nassert count_bits_upto(5) == [0,1,1,2,1,2]',
    null, 'popcount: O(number of set bits); table: O(n)', ['#/problem/191', '#/problem/338', '#/topic/bits']);

  E('power-of-two', 'Check if a number is a power of two',
    ['power of two', 'is power of two bit trick', 'check if n is a power of 2', 'power of two leetcode 231', 'power of four'],
    'power of two 231 bit trick n and n-1 power of 4',
    'A positive power of two has exactly one set bit, so `n > 0 and n & (n - 1) == 0`. For a power of four also require the bit to be in an even position: `n & 0x55555555 != 0`.',
    'def is_power_of_two(n):\n    return n > 0 and n & (n - 1) == 0\n\ndef is_power_of_four(n):\n    return is_power_of_two(n) and n & 0x55555555 != 0\n\nprint(is_power_of_two(16), is_power_of_two(18))  # True False',
    'assert is_power_of_two(1) and is_power_of_two(1024)\nassert not is_power_of_two(0) and not is_power_of_two(-4) and not is_power_of_two(6)\nassert is_power_of_four(16) and not is_power_of_four(8)',
    'Do not forget `n > 0`: zero and negatives would otherwise slip through.',
    'O(1)', ['#/topic/bits']);

  E('subsets-bitmask', 'Enumerate all subsets with a bitmask',
    ['subsets using bitmask', 'iterate all subsets with bits', 'bitmask enumeration', 'power set with bit manipulation', 'loop over submasks'],
    'subsets bitmask enumeration submask power set 2^n bit',
    'For n items, every integer `mask` from 0 to `2**n - 1` is a subset: bit `i` set means item `i` is included. To enumerate submasks of a mask `m`, use `sub = (sub - 1) & m` until it wraps.',
    'def all_subsets(items):\n    n = len(items)\n    return [[items[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n)]\n\ndef submasks(m):\n    sub = m\n    while True:\n        yield sub\n        if sub == 0:\n            break\n        sub = (sub - 1) & m\n\nprint(all_subsets([1, 2]), list(submasks(0b101)))  # [[], [1], [2], [1, 2]] [5, 4, 1, 0]',
    'assert all_subsets([1,2]) == [[],[1],[2],[1,2]]\nassert list(submasks(0b101)) == [5,4,1,0]\nassert all_subsets([]) == [[]]',
    'Handy for n up to about 20. Useful operations: set bit `m | 1<<i`, clear `m & ~(1<<i)`, test `m >> i & 1`, toggle `m ^ 1<<i`.',
    'Time O(n * 2^n)', ['#/topic/bits', '#/topic/bitmask-dp']);

  E('swap-xor', 'Swap two numbers without a temp variable',
    ['swap without temp', 'swap two variables xor', 'swap two numbers without third variable', 'xor swap', 'swap variables in python'],
    'swap xor temp variable tuple unpack bit trick',
    'In Python just write `a, b = b, a`. The classic XOR version is `a ^= b; b ^= a; a ^= b` (works for integers; breaks if both names refer to the same memory location, which is why it is a trivia answer rather than good practice).',
    'a, b = 3, 5\na, b = b, a\nprint(a, b)        # 5 3\n\nx, y = 3, 5\nx ^= y\ny ^= x\nx ^= y\nprint(x, y)        # 5 3',
    'assert (a, b) == (5, 3)\nassert (x, y) == (5, 3)',
    'XOR swap in C/Java on the same variable (`swap(a[i], a[i])`) zeroes it - a known bug.',
    'O(1)', ['#/topic/bits']);

  E('reverse-bits', 'Reverse the bits of an integer',
    ['reverse bits', 'reverse bits of a 32 bit integer', 'reverse bits leetcode 190', 'flip binary representation', 'reverse binary number'],
    'reverse bits 190 32 bit shift or binary',
    'Build the result by shifting it left and appending the lowest bit of the input, 32 times: `res = (res << 1) | (n & 1); n >>= 1`.',
    'def reverse_bits(n):\n    res = 0\n    for _ in range(32):\n        res = (res << 1) | (n & 1)\n        n >>= 1\n    return res\n\nprint(reverse_bits(0b00000010100101000001111010011100))  # 964176192',
    'assert reverse_bits(0b00000010100101000001111010011100) == 964176192\nassert reverse_bits(0) == 0\nassert reverse_bits(1) == 1 << 31',
    null, 'Time O(32) = O(1)', ['#/problem/190', '#/topic/bits']);

  E('xor-tricks', 'Useful XOR and bit tricks cheat list',
    ['xor tricks', 'bit manipulation tricks', 'common bit manipulation operations', 'lowest set bit', 'check if bit is set', 'set clear toggle a bit'],
    'xor bit tricks lowest set bit set clear toggle check mask shift',
    'The few you need: test bit `i` -> `n >> i & 1`; set -> `n | 1 << i`; clear -> `n & ~(1 << i)`; toggle -> `n ^ 1 << i`; isolate lowest set bit -> `n & -n`; clear lowest set bit -> `n & (n - 1)`; `x ^ x = 0`, `x ^ 0 = x`.',
    'n = 0b101100\nprint(n >> 2 & 1)     # 1  (bit 2 is set)\nprint(n | 1 << 0)     # 45\nprint(n & ~(1 << 2))  # 40\nprint(n ^ 1 << 5)     # 12\nprint(n & -n)         # 4   lowest set bit\nprint(n & (n - 1))    # 40  clear lowest set bit',
    'assert n & -n == 4\nassert n & (n - 1) == 40\nassert n >> 2 & 1 == 1\nassert (n | 1) == 45',
    'Python integers are arbitrary precision: negative numbers behave as infinite two\'s complement, so mask with `& 0xFFFFFFFF` when you need 32-bit behaviour.',
    null, ['#/topic/bits']);

  // ---------- math ----------
  E('gcd-lcm', 'GCD and LCM',
    ['gcd', 'greatest common divisor python', 'lcm of two numbers', 'euclidean algorithm', 'lcm python', 'gcd of a list'],
    'gcd lcm euclid euclidean greatest common divisor least common multiple math',
    'Euclid: `gcd(a, b) = gcd(b, a % b)` until `b == 0`. Then `lcm(a, b) = a // gcd(a, b) * b` (divide first to avoid overflow in other languages). Python has `math.gcd` and, from 3.9, `math.lcm`.',
    'import math\n\ndef gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\ndef lcm(a, b):\n    return a // gcd(a, b) * b\n\nprint(gcd(48, 18), lcm(4, 6), math.gcd(48, 18))  # 6 12 6',
    'assert gcd(48,18) == 6 == math.gcd(48,18)\nassert gcd(7,0) == 7\nassert lcm(4,6) == 12\nassert math.gcd(*[12,18,24]) == 6',
    null, 'Time O(log min(a, b))', ['#/topic/math']);

  E('sieve', 'Sieve of Eratosthenes',
    ['sieve of eratosthenes', 'all primes up to n', 'generate primes python', 'count primes leetcode 204', 'prime sieve'],
    'sieve eratosthenes primes count primes 204 prime numbers up to n',
    'Mark every number as prime, then for each prime `p` starting at 2 cross off its multiples starting at `p*p`. Stop when `p*p > n`. The remaining marked numbers are the primes.',
    'def sieve(n):\n    if n < 2:\n        return []\n    is_p = [True] * (n + 1)\n    is_p[0] = is_p[1] = False\n    p = 2\n    while p * p <= n:\n        if is_p[p]:\n            is_p[p * p::p] = [False] * len(range(p * p, n + 1, p))\n        p += 1\n    return [i for i, v in enumerate(is_p) if v]\n\nprint(sieve(30))  # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]',
    'assert sieve(30) == [2,3,5,7,11,13,17,19,23,29]\nassert sieve(1) == []\nassert len(sieve(100)) == 25',
    null, 'Time O(n log log n), space O(n)', ['#/problem/204', '#/topic/math']);

  E('is-prime', 'Primality test for one number',
    ['is prime', 'check if a number is prime', 'prime check python', 'primality test', 'trial division prime'],
    'prime check primality trial division sqrt miller rabin',
    'Trial division up to the square root: if `n` has a factor it has one `<= sqrt(n)`. Handle `n < 2`, 2 and even numbers first, then test odd divisors. For very large numbers use Miller-Rabin.',
    'def is_prime(n):\n    if n < 2:\n        return False\n    if n % 2 == 0:\n        return n == 2\n    i = 3\n    while i * i <= n:\n        if n % i == 0:\n            return False\n        i += 2\n    return True\n\nprint([x for x in range(20) if is_prime(x)])  # [2, 3, 5, 7, 11, 13, 17, 19]',
    'assert [x for x in range(20) if is_prime(x)] == [2,3,5,7,11,13,17,19]\nassert not is_prime(1) and not is_prime(0) and not is_prime(-7)\nassert is_prime(1000000007)',
    null, 'Time O(sqrt n)', ['#/topic/math']);

  E('fast-pow', 'Fast exponentiation (power by squaring)',
    ['fast exponentiation', 'binary exponentiation', 'pow(x, n) implementation', 'power function in log n', 'pow x n leetcode 50', 'modular exponentiation'],
    'fast exponentiation binary exponentiation pow x n 50 square multiply modular',
    'Square the base and halve the exponent: if the exponent bit is 1 multiply the result by the current base. That needs O(log n) multiplications instead of n. Negative exponent: compute with `-n` and invert. In Python, `pow(b, e, m)` does modular exponentiation natively.',
    'def power(x, n):\n    if n < 0:\n        x, n = 1 / x, -n\n    res = 1\n    while n:\n        if n & 1:\n            res *= x\n        x *= x\n        n >>= 1\n    return res\n\ndef power_mod(b, e, m):\n    res, b = 1, b % m\n    while e:\n        if e & 1:\n            res = res * b % m\n        b = b * b % m\n        e >>= 1\n    return res\n\nprint(power(2, 10), power(2, -2), power_mod(3, 200, 13))  # 1024 0.25 9',
    'assert power(2,10) == 1024\nassert power(2,-2) == 0.25\nassert power(5,0) == 1\nassert power_mod(3,200,13) == pow(3,200,13) == 9',
    null, 'Time O(log n), space O(1)', ['#/problem/50', '#/topic/math']);

  E('mod-arith', 'Modular arithmetic rules',
    ['modular arithmetic', 'mod 10^9+7 why', 'how to take modulo of large numbers', 'modulo addition multiplication rules', 'negative modulo python', 'answer modulo 1e9+7'],
    'modular arithmetic mod 1e9+7 10^9+7 modulo overflow negative rules',
    'You may reduce after every `+`, `-`, `*`: `(a*b) % m = ((a%m)*(b%m)) % m`. Do **not** reduce before dividing or comparing. Python\'s `%` always returns a non-negative result for positive `m`; in C++/Java `-7 % 5` is `-2`, so add `m` back. 10^9+7 is a prime that keeps products below 2^63.',
    'MOD = 10**9 + 7\n\ndef fact_mod(n):\n    r = 1\n    for i in range(2, n + 1):\n        r = r * i % MOD\n    return r\n\nprint(fact_mod(20), (-7) % 5)  # 146326063 3',
    'import math\nassert fact_mod(20) == math.factorial(20) % MOD\nassert (-7) % 5 == 3\nassert (10**18 * 10**18) % MOD == (10**18 % MOD) ** 2 % MOD',
    null, null, ['#/topic/math']);

  E('mod-inverse', 'Modular inverse',
    ['modular inverse', 'mod inverse python', 'division under modulo', 'inverse of a mod p', 'fermat little theorem inverse', 'divide in modular arithmetic'],
    'modular inverse division mod prime fermat little theorem pow extended euclid',
    'To compute `a / b mod p`, multiply by the inverse of `b`. For prime `p`, Fermat gives `inv(b) = b^(p-2) mod p`, i.e. `pow(b, p - 2, p)`. From Python 3.8, `pow(b, -1, p)` also works for any `p` coprime to `b` (raises ValueError otherwise).',
    'MOD = 10**9 + 7\n\ndef inv(b, p=MOD):\n    return pow(b, p - 2, p)\n\nprint(inv(3), 6 * inv(3) % MOD)  # 333333336 2',
    'assert inv(3) * 3 % MOD == 1\nassert 6 * inv(3) % MOD == 2\nassert pow(3, -1, 11) == 4\nassert inv(10**9) * 10**9 % MOD == 1',
    null, 'Time O(log p)', ['#/topic/math']);

  E('ncr-mod', 'nCr modulo a prime',
    ['ncr mod p', 'binomial coefficient modulo', 'n choose k modulo 1e9+7', 'precompute factorials and inverse factorials', 'combinations count mod prime', 'pascal triangle nCr'],
    'ncr binomial coefficient combinations modulo factorial inverse pascal triangle',
    'Precompute factorials and inverse factorials mod a prime `p`, then `C(n, k) = fact[n] * inv_fact[k] * inv_fact[n-k] mod p` in O(1) per query. Without a modulus (or with small n) use `math.comb(n, k)` or Pascal\'s rule.',
    'import math\nMOD = 10**9 + 7\nN = 1000\nfact = [1] * (N + 1)\nfor i in range(1, N + 1):\n    fact[i] = fact[i - 1] * i % MOD\ninv_fact = [1] * (N + 1)\ninv_fact[N] = pow(fact[N], MOD - 2, MOD)\nfor i in range(N, 0, -1):\n    inv_fact[i - 1] = inv_fact[i] * i % MOD\n\ndef ncr(n, k):\n    if k < 0 or k > n:\n        return 0\n    return fact[n] * inv_fact[k] % MOD * inv_fact[n - k] % MOD\n\nprint(ncr(10, 3), ncr(1000, 500) == math.comb(1000, 500) % MOD)  # 120 True',
    'assert ncr(10,3) == 120\nassert ncr(5,0) == 1 and ncr(5,5) == 1\nassert ncr(3,5) == 0\nassert ncr(1000,500) == math.comb(1000,500) % MOD',
    null, 'Precompute O(N), query O(1)', ['#/topic/math']);

  E('trailing-zeros', 'Trailing zeros in n factorial',
    ['trailing zeroes in factorial', 'factorial trailing zeros', 'trailing zeroes leetcode 172', 'count zeros at end of n!', 'how many zeros in 100 factorial'],
    'factorial trailing zeroes 172 count fives legendre',
    'Each trailing zero comes from a factor pair 2x5, and 2s are plentiful, so count the factors of 5 in `n!`: `n//5 + n//25 + n//125 + ...`. No need to compute the factorial.',
    'def trailing_zeroes(n):\n    count = 0\n    while n:\n        n //= 5\n        count += n\n    return count\n\nprint(trailing_zeroes(100))  # 24',
    'assert trailing_zeroes(100) == 24\nassert trailing_zeroes(5) == 1\nassert trailing_zeroes(4) == 0\nassert trailing_zeroes(25) == 6',
    null, 'Time O(log n)', ['#/problem/172', '#/topic/math']);

  E('reverse-integer', 'Reverse an integer with overflow check',
    ['reverse integer', 'reverse integer leetcode 7', 'reverse digits of a number', 'reverse integer 32 bit overflow', 'integer overflow when reversing'],
    'reverse integer 7 digits overflow 32 bit pop push',
    'Pop digits with `% 10` and push them with `* 10 +`. Work on the absolute value and restore the sign. If the result leaves the signed 32-bit range, return 0. In C++/Java you must check before multiplying, since you cannot overflow first and inspect later.',
    'def reverse(x):\n    sign = -1 if x < 0 else 1\n    x, r = abs(x), 0\n    while x:\n        r = r * 10 + x % 10\n        x //= 10\n    r *= sign\n    return r if -2**31 <= r <= 2**31 - 1 else 0\n\nprint(reverse(123), reverse(-120), reverse(1534236469))  # 321 -21 0',
    'assert reverse(123) == 321\nassert reverse(-120) == -21\nassert reverse(1534236469) == 0\nassert reverse(0) == 0',
    null, 'Time O(digits), space O(1)', ['#/problem/7', '#/topic/math']);

  E('base-conversion', 'Convert a number between bases',
    ['convert to binary', 'base conversion python', 'decimal to base k', 'int to hex and back', 'convert number to base 7', 'parse binary string'],
    'base conversion binary hex decimal radix int bin hex digits',
    'Parse with `int(s, base)`; format with `bin`, `oct`, `hex`, or an f-string like `f"{n:b}"`. For an arbitrary base, divide repeatedly by the base and collect the remainders, then reverse them.',
    'def to_base(n, b):\n    if n == 0:\n        return "0"\n    digits = "0123456789abcdefghijklmnopqrstuvwxyz"\n    neg, n = n < 0, abs(n)\n    out = []\n    while n:\n        n, r = divmod(n, b)\n        out.append(digits[r])\n    return ("-" if neg else "") + "".join(reversed(out))\n\nprint(to_base(100, 7), int("202", 7), f"{10:b}", int("ff", 16))  # 202 100 1010 255',
    'assert to_base(100,7) == "202"\nassert int("202",7) == 100\nassert to_base(255,16) == "ff"\nassert to_base(0,2) == "0"\nassert to_base(-5,2) == "-101"',
    null, 'Time O(log_b n)', ['#/topic/math']);

  E('fib-matrix', 'Fibonacci in O(log n) with matrix exponentiation',
    ['fibonacci matrix exponentiation', 'fast fibonacci', 'fibonacci in log n', 'fast doubling fibonacci', 'compute huge fibonacci number'],
    'fibonacci matrix exponentiation fast doubling log n [[1,1],[1,0]]',
    'Powers of the matrix `[[1,1],[1,0]]` hold Fibonacci numbers: `M^n = [[F(n+1), F(n)], [F(n), F(n-1)]]`. Compute `M^n` by repeated squaring in O(log n). Fast doubling is a slimmer variant of the same idea. Add `% MOD` for huge n.',
    'def fib(n):\n    def mul(A, B):\n        return [[A[0][0]*B[0][0] + A[0][1]*B[1][0], A[0][0]*B[0][1] + A[0][1]*B[1][1]],\n                [A[1][0]*B[0][0] + A[1][1]*B[1][0], A[1][0]*B[0][1] + A[1][1]*B[1][1]]]\n    res, m = [[1, 0], [0, 1]], [[1, 1], [1, 0]]\n    while n:\n        if n & 1:\n            res = mul(res, m)\n        m = mul(m, m)\n        n >>= 1\n    return res[0][1]\n\nprint(fib(10), fib(90))  # 55 2880067194370816120',
    'assert fib(0) == 0 and fib(1) == 1\nassert fib(10) == 55\nassert fib(90) == 2880067194370816120',
    'The same trick speeds up any linear recurrence with a fixed number of terms.',
    'Time O(log n) multiplications of 2x2 matrices', ['#/topic/math', '#/topic/dp-1d']);

  // ---------- strings ----------
  E('kmp', 'KMP string matching',
    ['kmp algorithm', 'knuth morris pratt python', 'find substring in o(n+m)', 'strstr implementation', 'kmp prefix function failure table', 'find needle in haystack leetcode 28'],
    'kmp knuth morris pratt prefix function failure table lps substring search 28 strstr',
    'KMP precomputes, for each prefix of the pattern, the length of its longest proper prefix that is also a suffix (the `lps` or failure table). On a mismatch the pattern pointer falls back using `lps` instead of restarting, and the text pointer never moves backward.',
    'def build_lps(p):\n    lps = [0] * len(p)\n    k = 0\n    for i in range(1, len(p)):\n        while k and p[i] != p[k]:\n            k = lps[k - 1]\n        if p[i] == p[k]:\n            k += 1\n        lps[i] = k\n    return lps\n\ndef kmp_search(text, p):\n    """Return the start index of every match of p in text."""\n    if not p:\n        return []\n    lps, k, res = build_lps(p), 0, []\n    for i, ch in enumerate(text):\n        while k and ch != p[k]:\n            k = lps[k - 1]\n        if ch == p[k]:\n            k += 1\n        if k == len(p):\n            res.append(i - k + 1)\n            k = lps[k - 1]\n    return res\n\nprint(build_lps("ababaca"), kmp_search("abababa", "aba"))  # [0, 0, 1, 2, 3, 0, 1] [0, 2, 4]',
    'assert build_lps("ababaca") == [0,0,1,2,3,0,1]\nassert kmp_search("abababa","aba") == [0,2,4]\nassert kmp_search("hello","xyz") == []\nassert kmp_search("aaaa","aa") == [0,1,2]',
    'Python\'s `text.find(p)` is fine in practice; know KMP for interviews.',
    'Time O(n + m), space O(m)', ['#/problem/28', '#/topic/string-algos']);

  E('z-function', 'Z-function',
    ['z function', 'z algorithm string', 'z array pattern matching', 'z algorithm python', 'longest prefix match at every position'],
    'z function z algorithm z array prefix match pattern search linear',
    '`z[i]` is the length of the longest substring starting at `i` that matches a prefix of the string. It is computed in O(n) by reusing a window `[l, r)` that already matches the prefix. To search `p` in `t`, build `z` on `p + "#" + t` and report positions where `z == len(p)`.',
    'def z_function(s):\n    n = len(s)\n    z = [0] * n\n    l = r = 0\n    for i in range(1, n):\n        if i < r:\n            z[i] = min(r - i, z[i - l])\n        while i + z[i] < n and s[z[i]] == s[i + z[i]]:\n            z[i] += 1\n        if i + z[i] > r:\n            l, r = i, i + z[i]\n    return z\n\ndef z_search(t, p):\n    s = p + "#" + t\n    z = z_function(s)\n    return [i - len(p) - 1 for i in range(len(s)) if z[i] == len(p)]\n\nprint(z_function("aabxaab"), z_search("abababa", "aba"))  # [0, 1, 0, 0, 3, 1, 0] [0, 2, 4]',
    'assert z_function("aabxaab") == [0,1,0,0,3,1,0]\nassert z_search("abababa","aba") == [0,2,4]\nassert z_search("abc","d") == []',
    'Use a separator character that does not occur in either string.',
    'Time O(n), space O(n)', ['#/topic/string-algos']);

  E('rabin-karp', 'Rolling hash and Rabin-Karp',
    ['rabin karp', 'rolling hash', 'rabin karp algorithm python', 'string hashing substring search', 'polynomial hash', 'find repeated dna sequences hash'],
    'rabin karp rolling hash polynomial hash substring search modulo collision',
    'Hash the pattern as a polynomial `sum(s[i] * B^(m-1-i)) mod M`, then slide a window over the text updating the hash in O(1): drop the leading character, shift, add the new one. Only compare strings when hashes match, to rule out collisions. Expected O(n + m).',
    'def rabin_karp(text, p, B=256, M=1_000_000_007):\n    n, m = len(text), len(p)\n    if m == 0 or m > n:\n        return []\n    high = pow(B, m - 1, M)\n    hp = ht = 0\n    for i in range(m):\n        hp = (hp * B + ord(p[i])) % M\n        ht = (ht * B + ord(text[i])) % M\n    res = []\n    for i in range(n - m + 1):\n        if hp == ht and text[i:i + m] == p:\n            res.append(i)\n        if i + m < n:\n            ht = ((ht - ord(text[i]) * high) * B + ord(text[i + m])) % M\n    return res\n\nprint(rabin_karp("abababa", "aba"))  # [0, 2, 4]',
    'assert rabin_karp("abababa","aba") == [0,2,4]\nassert rabin_karp("abc","abcd") == []\nassert rabin_karp("aaaa","aa") == [0,1,2]',
    '- Worst case O(n*m) if many collisions; use a large prime modulus (or two).\n- Great for many patterns of the same length or for finding duplicate substrings with a set of hashes.',
    'Expected O(n + m), worst case O(n*m)', ['#/topic/string-algos', '#/topic/hashing-internals']);

  E('manacher', 'Manacher\'s algorithm (longest palindrome in O(n))',
    ['manacher algorithm', 'longest palindromic substring in linear time', 'manacher python', 'palindrome radius array', 'o(n) longest palindrome'],
    'manacher palindrome linear time radius transformed string center',
    'Insert a separator between characters (`abc` becomes `^#a#b#c#$`) so odd and even palindromes look alike, then compute a palindrome radius at each center, reusing the mirror of the current rightmost palindrome to skip comparisons. Total work is linear because the right edge only moves forward.',
    'def manacher(s):\n    t = "^#" + "#".join(s) + "#$"\n    p = [0] * len(t)\n    c = r = 0\n    for i in range(1, len(t) - 1):\n        if i < r:\n            p[i] = min(r - i, p[2 * c - i])\n        while t[i + 1 + p[i]] == t[i - 1 - p[i]]:\n            p[i] += 1\n        if i + p[i] > r:\n            c, r = i, i + p[i]\n    best = max(range(len(t)), key=lambda i: p[i])\n    start = (best - p[best]) // 2\n    return s[start:start + p[best]]\n\nprint(manacher("babad"), manacher("cbbd"))  # bab bb',
    'assert manacher("babad") == "bab"\nassert manacher("cbbd") == "bb"\nassert manacher("a") == "a"\nassert manacher("forgeeksskeegfor") == "geeksskeeg"',
    null, 'Time O(n), space O(n)', ['#/topic/string-algos']);

  E('boyer-moore', 'Boyer-Moore idea',
    ['boyer moore', 'boyer moore algorithm', 'fastest string search', 'bad character rule', 'why is boyer moore fast'],
    'boyer moore bad character good suffix string search right to left sublinear',
    'Boyer-Moore compares the pattern right to left and, on a mismatch, shifts the pattern by a precomputed amount (bad-character and good-suffix rules), often skipping many text characters. It is typically sublinear in practice on long patterns; the simplified Horspool version below uses only the bad-character shift.',
    'def horspool(text, p):\n    m = len(p)\n    shift = {c: m - 1 - i for i, c in enumerate(p[:-1])}\n    res, i = [], 0\n    while i <= len(text) - m:\n        j = m - 1\n        while j >= 0 and text[i + j] == p[j]:\n            j -= 1\n        if j < 0:\n            res.append(i)\n        i += shift.get(text[i + m - 1], m)\n    return res\n\nprint(horspool("abababa", "aba"))  # [0, 2, 4]',
    'assert horspool("abababa","aba") == [0,2,4]\nassert horspool("hello world","wor") == [6]\nassert horspool("abc","zz") == []',
    'Worst case of Horspool is O(n*m); full Boyer-Moore with the good-suffix rule (or Galil\'s rule) is O(n + m) in the worst case.',
    'Best case about O(n/m), worst case O(n*m) for Horspool', ['#/topic/string-algos']);

  E('suffix-array', 'Suffix array idea',
    ['suffix array', 'what is a suffix array', 'suffix array vs suffix tree', 'build suffix array python', 'lcp array', 'longest repeated substring suffix array'],
    'suffix array lcp longest repeated substring sort suffixes suffix tree',
    'A suffix array lists the starting indices of all suffixes of a string in sorted order. It lets you find any substring by binary search and, with an LCP array (longest common prefix of neighbouring suffixes), solve problems such as longest repeated substring. The simple build sorts the suffixes directly; fast builds are O(n log n) or O(n).',
    'def suffix_array(s):\n    return sorted(range(len(s)), key=lambda i: s[i:])\n\ndef lcp_array(s, sa):\n    return [next((k for k in range(min(len(s) - sa[i], len(s) - sa[i - 1])) if s[sa[i] + k] != s[sa[i - 1] + k]), min(len(s) - sa[i], len(s) - sa[i - 1])) for i in range(1, len(sa))]\n\ns = "banana"\nsa = suffix_array(s)\nlcp = lcp_array(s, sa)\nprint(sa, lcp)  # [5, 3, 1, 0, 4, 2] [1, 3, 0, 0, 2]\nprint(s[sa[lcp.index(max(lcp)) + 1]:][:max(lcp)])  # ana',
    'assert sa == [5,3,1,0,4,2]\nassert lcp == [1,3,0,0,2]\nassert s[sa[lcp.index(max(lcp)) + 1]:][:max(lcp)] == "ana"',
    'The one-liner build costs O(n^2 log n) because each comparison copies suffixes; use prefix doubling for real inputs. Suffix automaton and suffix tree solve similar problems.',
    'Naive build O(n^2 log n); prefix doubling O(n log n)', ['#/topic/string-algos']);

  E('trie-vs-hash', 'Trie vs hash set for prefix queries',
    ['trie vs hash map', 'when to use a trie', 'trie or set for prefix search', 'prefix lookup data structure', 'autocomplete trie vs hashset'],
    'trie vs hash set hash map prefix search autocomplete startswith memory',
    'Use a **hash set** to ask "is this exact word present" (O(L) average to hash a word of length L). Use a **trie** when you need prefix questions: does any word start with `pre`, list all completions, or prune a search as soon as the prefix dies (word search II). A set of words answers prefix queries only by scanning every word.',
    'class Trie:\n    def __init__(self):\n        self.root = {}\n    def insert(self, w):\n        node = self.root\n        for ch in w:\n            node = node.setdefault(ch, {})\n        node["$"] = True\n    def starts_with(self, pre):\n        node = self.root\n        for ch in pre:\n            if ch not in node:\n                return False\n            node = node[ch]\n        return True\n\nwords = ["apple", "app", "apt"]\nt, s = Trie(), set(words)\nfor w in words:\n    t.insert(w)\nprint(t.starts_with("ap"), "ap" in s, any(w.startswith("ap") for w in s))  # True False True',
    'assert t.starts_with("ap") and not t.starts_with("b")\nassert "ap" not in s\nassert any(w.startswith("app") for w in s)',
    '- Trie: prefix queries in O(L), ordered/lexicographic traversal, shared prefixes; costs more memory per node.\n- Hash set: simplest and fastest for exact membership.',
    'Trie insert/search O(L); set average O(L)', ['#/topic/tries', '#/topic/hashing-internals']);

  E('anagram-find', 'Find all anagrams of a pattern in a string',
    ['find all anagrams in a string', 'anagram substring search', 'find anagrams leetcode 438', 'sliding window character count', 'permutation in string'],
    'find all anagrams 438 sliding window counter permutation in string 567',
    'Slide a window of length `len(p)` over the text, maintaining character counts; when the window\'s counts equal the pattern\'s counts, record the start. Update by adding the new character and removing the one that left.',
    'from collections import Counter\n\ndef find_anagrams(s, p):\n    need, win, res = Counter(p), Counter(), []\n    for i, ch in enumerate(s):\n        win[ch] += 1\n        if i >= len(p):\n            old = s[i - len(p)]\n            win[old] -= 1\n            if win[old] == 0:\n                del win[old]\n        if win == need:\n            res.append(i - len(p) + 1)\n    return res\n\nprint(find_anagrams("cbaebabacd", "abc"))  # [0, 6]',
    'assert find_anagrams("cbaebabacd","abc") == [0,6]\nassert find_anagrams("abab","ab") == [0,1,2]\nassert find_anagrams("a","ab") == []',
    null, 'Time O(n * alphabet), space O(alphabet)', ['#/problem/438', '#/topic/sliding-window']);
})();
