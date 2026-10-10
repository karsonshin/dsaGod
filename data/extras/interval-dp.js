(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['interval-dp'] = {
    primer: {
      kind: 'technique',
      what: `**Interval DP** is dynamic programming where the state is a **contiguous range** \`[l, r]\` of the input, and a range's answer is built from the answers of smaller ranges inside it. Think of solving a long rope problem by first solving every short piece of rope, then gluing pieces together into longer ones.`,
      does: `It solves problems on a row where you cut, merge, remove or parenthesize, and the order of operations changes the cost: bursting balloons, cutting a stick, merging piles, multiplying a chain of matrices, triangulating a polygon, palindromes. Usual cost is O(n³) time and O(n²) space, so n is a few hundred at most.`,
      impl: `Make a 2-D table \`dp[l][r]\`. Fill it by **increasing range length** (width 1, 2, 3, ...) so every smaller range is ready. For each range, either try every split point \`k\` (\`dp[l][k] + dp[k][r] + cost\`) or peel an end (\`dp[l+1][r]\`, \`dp[l][r-1]\`). In Python use a list of lists, and \`functools.lru_cache\` for the top-down form.`,
      possibilities: `Burst balloons for maximum coins, cheapest way to cut a stick at given marks, minimum cost to merge adjacent piles, matrix-chain multiplication order, minimum score polygon triangulation, longest palindromic subsequence, counting ways to parenthesize an expression, and two-player games that take from either end of a row.`
    },

    think: [
      {
        q: `You have to cut a stick of length 10 at marks 2, 5 and 7, and each cut costs the length of the piece being cut. Cutting in the order 2, 5, 7 versus 5, 2, 7: which is cheaper, and why does order matter at all?`,
        a: `Order 2, 5, 7: the first cut costs 10, then the piece 2..10 has length 8 and the cut at 5 costs 8, then the piece 5..10 has length 5 and the cut at 7 costs 5. Total 23. Order 5, 2, 7: 10 + 5 (piece 0..5) + 5 (piece 5..10) = 20. Cheaper, because cutting near the middle first leaves smaller pieces for the later cuts. Each cut costs the *current* piece, and which pieces exist depends on the earlier cuts, so order matters.`
      },
      {
        q: `In balloon bursting, why does "which balloon do I burst first?" lead nowhere, but "which balloon bursts last in this range?" works?`,
        a: `After bursting a balloon first, its two neighbours become adjacent, so the left side and right side now touch and are no longer independent problems. If balloon k bursts **last** in a range, then at that moment it is the only one left, so its neighbours are the two walls, and everything on its left was finished without ever seeing anything on its right. The two sides really are separate problems. The aha: pick the action whose effect on the rest is fixed.`
      },
      {
        q: `You fill \`dp[l][r]\` with plain nested loops \`for l in range(n): for r in range(l+1, n)\` but the recurrence reads \`dp[k][r]\` for \`k > l\`. What goes wrong?`,
        a: `When you are computing row l, rows below it (larger k) have not been computed yet, so you read zeros or stale values and get wrong answers without any error. Fix it by filling in an order where every dependency is ready: loop over the range length from small to large, or loop \`l\` from the end down to 0 with \`r\` going up. Rule: ask "which cells does this cell read?" and fill those first.`
      },
      {
        q: `Roughly how many steps does the O(n³) table take for n = 300, and for n = 5000? What does that say about when to use it?`,
        a: `For n = 300 there are about n²/2 = 45,000 ranges, each trying up to about n/3 splits on average, so about 4.5 million steps: instant. For n = 5000 the count is about 2 × 10¹⁰, which will not finish in time. So interval DP is the intended answer only when the limit is a few hundred; with a big n, look for a greedy, a stack, or a different formulation.`
      },
      {
        q: `For the longest palindromic subsequence, each cell \`dp[l][r]\` does O(1) work (compare the two ends). What is the total time, and is this still "interval DP"?`,
        a: `There are about n²/2 ranges and O(1) per range, so O(n²) in total. Yes, it is still interval DP, because the state is a range and the answer is built from shorter ranges (\`dp[l+1][r-1]\`, \`dp[l+1][r]\`, \`dp[l][r-1]\`). The cubic cost only appears when each state loops over a split point. You recognise the pattern by the *state*, not by the triple loop.`
      }
    ],

    breakdown: [
      {
        title: `1. The problem shape, and the brute force`,
        body: `Take the balloons \`[3, 1, 5]\`. Bursting balloon i gives (left neighbour) × (value) × (right neighbour) coins, with a missing neighbour counting as 1, and the row closes up after every burst. Six orders are possible (3! = 6), and with 20 balloons there are 2.4 × 10¹⁸. Memoizing on the set of remaining balloons is still 2ⁿ states. The trouble is that after each burst the neighbours change, so the sub-situations do not look like clean pieces of the original row. We need a way to cut the problem into pieces that *are* contiguous ranges.`
      },
      {
        title: `2. Flip the question: what happens last?`,
        body: `Pad the row with a 1 on each end: \`a = [1, 3, 1, 5, 1]\` (indices 0 to 4). The walls at 0 and 4 are never burst. Look at the open range strictly between walls l and r. Suppose balloon k is the **last** one burst there. At that moment it is alone between the walls, so it earns \`a[l] * a[k] * a[r]\`. Everything left of k (between l and k) was burst earlier and only ever had l or k as outside neighbours. Everything right of k only had k or r. So the left and right sides are two independent smaller problems of exactly the same kind.`
      },
      {
        title: `3. State in words, recurrence, base case`,
        body: `**State:** \`dp[l][r]\` is the most coins you can get from the balloons *strictly between* positions l and r, with l and r still standing. **Recurrence:** \`dp[l][r] = max over k in (l, r) of dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]\`, meaning the left piece, the right piece, and the last burst between the walls. **Base case:** a range with nothing strictly inside (r = l + 1) is worth 0, so the whole table starts as zeros. **Answer:** \`dp[0][n-1]\`, the whole row between the two outer walls. **Fill order:** by increasing width r - l, since each cell reads only narrower ranges.`
      },
      {
        title: `4. Fill the table by hand: width 2`,
        body: `With \`a = [1, 3, 1, 5, 1]\`, width 2 means exactly one balloon between the walls, so k is forced:\n\n- \`dp[0][2]\`: k = 1, so 0 + 0 + 1·3·1 = **3**\n- \`dp[1][3]\`: k = 2, so 0 + 0 + 3·1·5 = **15**\n- \`dp[2][4]\`: k = 3, so 0 + 0 + 1·5·1 = **5**\n\nEach cell is just "burst the only balloon in there, next to its walls". Width 1 cells (like \`dp[0][1]\`) stay 0 because there is nothing inside.`
      },
      {
        title: `5. Fill the table by hand: width 3`,
        body: `Now two balloons sit between the walls, so each cell tries two choices of last balloon k.\n\n- \`dp[0][3]\` (balloons 3 and 1): k = 1 gives dp[0][1] + dp[1][3] + 1·3·5 = 0 + 15 + 15 = 30; k = 2 gives dp[0][2] + dp[2][3] + 1·1·5 = 3 + 0 + 5 = 8. Best **30**.\n- \`dp[1][4]\` (balloons 1 and 5): k = 2 gives dp[1][2] + dp[2][4] + 3·1·1 = 0 + 5 + 3 = 8; k = 3 gives dp[1][3] + dp[3][4] + 3·5·1 = 15 + 0 + 15 = 30. Best **30**.\n\nThe pieces read from width 2 are the numbers we just computed: that is why we fill by width.`
      },
      {
        title: `6. The last cell, and the answer`,
        body: `Width 4 is the whole row, \`dp[0][4]\`, with three choices for the final burst:\n\n- k = 1: dp[0][1] + dp[1][4] + 1·3·1 = 0 + 30 + 3 = 33\n- k = 2: dp[0][2] + dp[2][4] + 1·1·1 = 3 + 5 + 1 = 9\n- k = 3: dp[0][3] + dp[3][4] + 1·5·1 = 30 + 0 + 5 = **35**\n\nThe answer is **35** (burst 1, then 3, then 5: 15 + 15 + 5). Remember which k won in each cell if you need the actual order. The visualizer in the lesson fills these same diagonals one at a time.`,
        code: { py: `def max_coins(nums):
    a = [1] + nums + [1]
    n = len(a)
    dp = [[0] * n for _ in range(n)]
    for width in range(2, n):
        for l in range(n - width):
            r = l + width
            for k in range(l + 1, r):
                dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r])
    return dp[0][n - 1]` }
      },
      {
        title: `7. Cost, other flavours, and edge cases`,
        body: `About n²/2 ranges times up to n splits each gives **O(n³) time and O(n²) space**; fine for n up to a few hundred. Other flavours use the same table: closed ranges \`[l, r]\` with split \`dp[l][k] + dp[k+1][r]\` (merging piles, plus a prefix-sum array for the range total); a min instead of a max (cutting a stick, triangulation; start cells at infinity, not 0); a min-of-max for games (guessing numbers); and **peeling the ends** with O(1) work per cell (palindromes, coin games), giving O(n²). Edge cases: an empty row, one element, and sentinels at both ends. Check overflow when three values multiply.`
      },
      {
        title: `8. Optimising and spotting it in an interview`,
        body: `Optimise only if asked: prefix sums keep a range total O(1); for some merge-cost problems **Knuth's optimisation** cuts O(n³) to O(n²) when the best split point moves monotonically (a known but advanced fact); top-down memoization visits only reachable ranges. Spot it with three questions: is the state "a range of the input"? Does a range split at one point (or lose an end) into smaller ranges of the same kind? Is n small? A row where removal or merge order matters, or one phrase like "in what order", is the strongest cue. If removing changes neighbours, ask what happens **last**.`
      }
    ],

    drills: [
      {
        title: `Fewest letters to make it a palindrome`,
        q: `Given a string, return the minimum number of characters you must **insert** (anywhere) to make it read the same forwards and backwards.\n\nExample: \`"abcd"\` returns \`3\` (for instance "dcbabcd"). \`"abca"\` returns \`1\`.`,
        hint: `Let dp[l][r] be the answer for s[l..r]. Compare the two ends: equal ends cost nothing, unequal ends need one insertion on one side.`,
        how: `I restate it: add the fewest letters, in any positions, so the string becomes a palindrome. Brute force tries insertions at every position and checks, which explodes. The state is a range: \`dp[l][r]\` is the fewest insertions needed to make \`s[l..r]\` a palindrome. Look at the two ends. If \`s[l] == s[r]\`, they already match as the outer pair, so the cost is whatever the inside needs: \`dp[l+1][r-1]\`. If they differ, one of them needs a partner: either insert a copy of \`s[r]\` at the front (then the problem shrinks to \`s[l..r-1]\`) or insert a copy of \`s[l]\` at the back (shrinks to \`s[l+1..r]\`), so the cost is 1 plus the smaller of those two. Base case: a range of length 0 or 1 is already a palindrome, cost 0. I fill by increasing length so shorter ranges are ready. Trace "abca": ends a and a match, so dp[0][3] = dp[1][2], the range "bc", whose ends differ, so 1 + min(dp[2][2], dp[1][1]) = 1. The answer is 1. Edge cases: empty string 0; already a palindrome 0; all different letters n - 1. Cost: O(n²) time and space, O(1) per cell.`,
        code: { py: `def min_insertions_palindrome(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for width in range(2, n + 1):
        for l in range(n - width + 1):
            r = l + width - 1
            if s[l] == s[r]:
                dp[l][r] = dp[l + 1][r - 1] if width > 2 else 0
            else:
                dp[l][r] = 1 + min(dp[l + 1][r], dp[l][r - 1])
    return dp[0][n - 1] if n else 0` },
        explain: `Matching ends cost nothing and shrink the range by two; mismatched ends need one insertion and shrink the range by one from either side, so we take the cheaper. Ranges of length 0 or 1 cost 0. There are about n²/2 states with O(1) work each: O(n²) time, O(n²) space.`,
        check: `assert min_insertions_palindrome("abcd") == 3
assert min_insertions_palindrome("abca") == 1
assert min_insertions_palindrome("") == 0
assert min_insertions_palindrome("a") == 0
assert min_insertions_palindrome("aa") == 0
assert min_insertions_palindrome("ab") == 1
assert min_insertions_palindrome("racecar") == 0
import random
def lcs(a, b):
    t = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a)):
        for j in range(len(b)):
            t[i + 1][j + 1] = t[i][j] + 1 if a[i] == b[j] else max(t[i][j + 1], t[i + 1][j])
    return t[-1][-1]
for _ in range(300):
    s = "".join(random.choice("abc") for _ in range(random.randint(0, 10)))
    assert min_insertions_palindrome(s) == len(s) - lcs(s, s[::-1])`
      },
      {
        title: `Coin row duel`,
        q: `A row of coins has values given in a list. Two players alternate turns; on each turn a player takes the coin at the **left end or the right end** of the row. Both play to maximize their own total. Return (first player's total) minus (second player's total) under best play.\n\nExample: \`[1, 5, 2]\` returns \`-2\` (whichever end the first player takes, the second player ends up ahead). \`[3, 9, 1, 2]\` returns \`5\`.`,
        hint: `Let dp[l][r] be the best margin the player to move can get on coins l..r. Taking a coin gains its value but hands the turn over, so subtract the opponent's margin.`,
        how: `I restate it: two players take coins from the ends of a row, each trying to come out ahead; I report the first player's lead. Brute force explores every sequence of choices, 2ⁿ. The row left after any sequence of moves is always a contiguous range, which gives the state: \`dp[l][r]\` is the largest lead (my total minus the opponent's) that the player *about to move* can force on coins l through r. If I take the left coin I gain \`a[l]\`, and then my opponent is the player to move on \`l+1..r\` and will force a lead of \`dp[l+1][r]\` over me, so my margin is \`a[l] - dp[l+1][r]\`. Taking the right coin gives \`a[r] - dp[l][r-1]\`. I pick the larger. The subtraction trick means I do not need to track whose turn it is. Base case: one coin left, the margin is that coin, \`dp[l][l] = a[l]\`; an empty row is 0. Trace \`[1, 5, 2]\`: dp[0][1] = max(1-5, 5-1) = 4; dp[1][2] = max(5-2, 2-5) = 3; dp[0][2] = max(1 - 3, 2 - 4) = -2. Edge cases: empty list 0; one coin is its value. Cost: O(n²) time and space.`,
        code: { py: `def coin_row_margin(coins):
    n = len(coins)
    if n == 0:
        return 0
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = coins[i]
    for width in range(2, n + 1):
        for l in range(n - width + 1):
            r = l + width - 1
            dp[l][r] = max(coins[l] - dp[l + 1][r], coins[r] - dp[l][r - 1])
    return dp[0][n - 1]` },
        explain: `dp[l][r] is the best lead for whoever moves on that range. Taking a coin adds its value and passes the turn, so the mover's lead is that value minus the opponent's best lead on what remains. Each of the n²/2 cells does O(1) work: O(n²) time, O(n²) space.`,
        check: `assert coin_row_margin([1, 5, 2]) == -2
assert coin_row_margin([3, 9, 1, 2]) == 7
assert coin_row_margin([]) == 0
assert coin_row_margin([4]) == 4
assert coin_row_margin([2, 7]) == 5
import random
from functools import lru_cache
for _ in range(200):
    a = tuple(random.randint(-3, 9) for _ in range(random.randint(0, 9)))
    @lru_cache(maxsize=None)
    def play(l, r, me):
        if l > r:
            return 0
        left = a[l] * me + play(l + 1, r, -me)
        right = a[r] * me + play(l, r - 1, -me)
        return max(left, right) if me == 1 else min(left, right)
    assert coin_row_margin(list(a)) == play(0, len(a) - 1, 1)`
      },
      {
        title: `Cheapest way to multiply a chain`,
        q: `A chain of matrices is given by a list of dimensions \`dims\`: matrix i has \`dims[i]\` rows and \`dims[i+1]\` columns. Multiplying an a×b matrix by a b×c matrix costs a·b·c scalar multiplications. Choose the order of multiplications (the parenthesization) that minimizes the total cost, and return it.\n\nExample: \`[10, 30, 5, 60]\` returns \`4500\` (multiply the first two first: 1500 + 3000). \`[40, 20, 30, 10, 30]\` returns \`26000\`.`,
        hint: `The last multiplication splits the chain at some point k into a left chain and a right chain, and costs dims[l] * dims[k+1] * dims[r+1].`,
        how: `I restate it: matrix multiplication is associative, so any grouping gives the same result, but the groupings cost very different amounts; find the cheapest. Brute force counts every full parenthesization, which is a Catalan number and grows like 4ⁿ. The state is a range of matrices: \`dp[l][r]\` is the cheapest cost to multiply matrices l through r into one. Think about the **last** multiplication in that range: it joins a left block l..k and a right block k+1..r. The left block ends up as a dims[l] × dims[k+1] matrix and the right block as dims[k+1] × dims[r+1], so the final join costs \`dims[l] * dims[k+1] * dims[r+1]\`. The two blocks are independent subproblems. So \`dp[l][r] = min over k of dp[l][k] + dp[k+1][r] + dims[l]*dims[k+1]*dims[r+1]\`. Base case: one matrix costs 0. Trace \`[10, 30, 5, 60]\` (three matrices): split after the first costs 0 + (30·5·60 = 9000) + 10·30·60 = 18000 + 9000 = 27000; split after the second costs 1500 + 0 + 10·5·60 = 3000 → 4500. Minimum 4500. Edge cases: zero or one matrix costs 0. Cost: O(n³) time, O(n²) space.`,
        code: { py: `def matrix_chain_cost(dims):
    n = len(dims) - 1
    if n < 2:
        return 0
    dp = [[0] * n for _ in range(n)]
    for width in range(2, n + 1):
        for l in range(n - width + 1):
            r = l + width - 1
            dp[l][r] = min(dp[l][k] + dp[k + 1][r] + dims[l] * dims[k + 1] * dims[r + 1]
                           for k in range(l, r))
    return dp[0][n - 1]` },
        explain: `Every parenthesization has exactly one last multiplication, which splits the chain at some k; the two sides are independent and cost dp values, and the final join costs the product of the three boundary dimensions. Trying every k covers every grouping. n²/2 states times up to n splits: O(n³) time, O(n²) space.`,
        check: `assert matrix_chain_cost([10, 30, 5, 60]) == 4500
assert matrix_chain_cost([40, 20, 30, 10, 30]) == 26000
assert matrix_chain_cost([]) == 0
assert matrix_chain_cost([5]) == 0
assert matrix_chain_cost([5, 6]) == 0
assert matrix_chain_cost([2, 3, 4]) == 24
import random
def brute(d, l, r):
    if l == r:
        return 0
    return min(brute(d, l, k) + brute(d, k + 1, r) + d[l] * d[k + 1] * d[r + 1] for k in range(l, r))
for _ in range(100):
    d = [random.randint(1, 9) for _ in range(random.randint(2, 8))]
    assert matrix_chain_cost(d) == brute(d, 0, len(d) - 2)`
      },
      {
        title: `Ways to make an expression true`,
        q: `A boolean expression is a string of the symbols \`T\` and \`F\` separated by the operators \`&\`, \`|\` and \`^\` (and, or, xor), such as \`"T|F&T"\`. Count the number of ways to fully parenthesize it so that it evaluates to **True**.\n\nExample: \`"T|F&T"\` returns \`2\`... check: (T|F)&T is True and T|(F&T) is True, so the answer is 2. \`"F^T"\` returns \`1\`.`,
        hint: `Track two counts per range: ways to evaluate True and ways to evaluate False. The last operator decides how the left and right counts combine.`,
        how: `I restate it: operators can be applied in any grouping, and I count the groupings whose final value is True. Brute force generates every parenthesization (Catalan growth) and evaluates each. The structure is an interval: the operands sit at even positions, and for a range of operands l..r the **last operator evaluated** is some operator between them, splitting it into a left expression and a right expression that are independent. For each range I keep two numbers, \`t[l][r]\` and \`f[l][r]\`, the number of groupings giving True and False. Given a split with left counts (lt, lf) and right counts (rt, rf), an & is True only for (True, True); an | is False only for (False, False); an ^ is True for (True, False) or (False, True). I add the products of counts accordingly, keeping the total number of groupings equal to \`lt+lf\` times \`rt+rf\`. Base case: a single symbol is one way, True for T and False for F. Trace "T|F&T": last operator | gives T | (F&T) with F&T false-only, so 1 way True; last operator & gives (T|F) & T, 1 way True. Total 2. Edge cases: a single symbol; no True possible gives 0. Cost: O(n³) time, O(n²) space for n operands.`,
        code: { py: `def count_true_parenthesizations(expr):
    syms = expr[0::2]
    ops = expr[1::2]
    n = len(syms)
    if n == 0:
        return 0
    t = [[0] * n for _ in range(n)]
    f = [[0] * n for _ in range(n)]
    for i, c in enumerate(syms):
        t[i][i] = 1 if c == 'T' else 0
        f[i][i] = 1 - t[i][i]
    for width in range(2, n + 1):
        for l in range(n - width + 1):
            r = l + width - 1
            for k in range(l, r):
                lt, lf, rt, rf = t[l][k], f[l][k], t[k + 1][r], f[k + 1][r]
                total = (lt + lf) * (rt + rf)
                op = ops[k]
                if op == '&':
                    true = lt * rt
                elif op == '|':
                    true = total - lf * rf
                else:
                    true = lt * rf + lf * rt
                t[l][r] += true
                f[l][r] += total - true
    return t[0][n - 1]` },
        explain: `The last-evaluated operator splits the operands into independent left and right expressions. For each operator the number of True outcomes follows from the four count products, and the False outcomes are the rest of the total (left ways times right ways). Summing over every split counts each parenthesization exactly once. O(n³) time, O(n²) space for n operands.`,
        check: `assert count_true_parenthesizations("T|F&T") == 2
assert count_true_parenthesizations("F^T") == 1
assert count_true_parenthesizations("T") == 1
assert count_true_parenthesizations("F") == 0
assert count_true_parenthesizations("") == 0
assert count_true_parenthesizations("T^T^T") == 2
import random
def outcomes(syms, ops, l, r):
    if l == r:
        return [syms[l] == 'T']
    res = []
    for k in range(l, r):
        for a in outcomes(syms, ops, l, k):
            for b in outcomes(syms, ops, k + 1, r):
                o = ops[k]
                res.append(a and b if o == '&' else (a or b if o == '|' else a != b))
    return res
for _ in range(200):
    n = random.randint(1, 7)
    syms = [random.choice("TF") for _ in range(n)]
    ops = [random.choice("&|^") for _ in range(n - 1)]
    e = "".join(x + (ops[i] if i < n - 1 else "") for i, x in enumerate(syms))
    assert count_true_parenthesizations(e) == sum(outcomes(syms, ops, 0, n - 1))`
      }
    ],

    how: {
      312: `I restate it: bursting balloon i gives left × i × right coins, the row closes after each burst, and I want the best order. Brute force tries every order, n!, and memoizing on the remaining set is 2ⁿ. The bottleneck is that bursting a balloon first makes its neighbours adjacent, so the pieces are not independent. The unlock is to ask which balloon bursts **last** in a range. If k is last between two walls l and r that are never burst, then at that moment its neighbours are exactly the walls, so it earns a[l]·a[k]·a[r], and the left and right sides never saw across k, so they are independent subproblems. I pad the row with a 1 on each end, define dp[l][r] as the best coins strictly between the walls, and use dp[l][r] = max over k of dp[l][k] + dp[k][r] + a[l]·a[k]·a[r]. Ranges with nothing inside are 0. Each cell reads only narrower ranges, so I loop by increasing width and return dp[0][n-1]. Trace [3,1,5]: padded [1,3,1,5,1], width-2 cells give 3, 15, 5; width-3 cells give 30 and 30; the full range tries three last bursts and the best is 35. Edge cases: an empty row gives 0, and zeros are fine. Cost: O(n³) time, O(n²) space, and I would mention overflow if values were large.`,
      1039: `I restate it: a convex polygon has labels on its corners; cut it into triangles with non-crossing diagonals; each triangle scores the product of its three labels; I want the smallest total. Brute force enumerates every triangulation, a Catalan number growing like 4ⁿ. The unlock is to look at one fixed edge, say between corner l and corner r. In any triangulation that edge belongs to exactly one triangle, and its third corner is some k strictly between l and r. That triangle removes itself and leaves two smaller polygons, one on corners l..k and one on k..r, which are independent. So dp[l][r] = min over k of dp[l][k] + dp[k][r] + v[l]·v[k]·v[r], and a "polygon" of two corners is just an edge, cost 0. The state is a range of consecutive corners, so it is an interval DP, filled by increasing width, answer dp[0][n-1]. Trace [3,7,4,5]: the only splits for the full range are k = 1 (0 + dp[1][3] + 3·7·5 where dp[1][3] = 7·4·5 = 140, so 140 + 105 = 245) and k = 2 (dp[0][2] = 3·7·4 = 84, plus dp[2][3] = 0, plus 3·4·5 = 60, so 144). The minimum is 144. Edge cases: three corners give a single triangle. Cost: O(n³) time, O(n²) space, which is trivial for n up to 50. It is the same table as matrix-chain multiplication.`,
      375: `I restate it: a secret number from 1 to n; each wrong guess costs the number I guessed; I am told higher or lower; I want the smallest budget that guarantees a win however the secret is chosen. Brute force explores every guess sequence and every possible answer, repeating the same ranges. The state is a range of numbers still possible: dp[l][r] is the cost to guarantee a win when the secret lies in [l, r]. If I guess k and I am wrong, I pay k and continue in [l, k-1] or [k+1, r], and the adversary will send me to whichever is more expensive, so the guess costs k + max(dp[l][k-1], dp[k+1][r]). I choose the guess, so I take the min over k. Ranges of one number or none cost 0, because a correct guess is free, which is also why the table is zero-initialised with a margin of one on each side. It is a min-of-max over ranges, filled by increasing width, answer dp[1][n]. Trace n = 3: guessing 2 costs 2 + max(dp[1][1], dp[3][3]) = 2; guessing 1 costs 1 + dp[2][3] = 1 + 2 = 3. The minimum is 2. Edge cases: n = 1 gives 0. Cost: O(n³) time, O(n²) space.`,
      1130: `I restate it: leaf values are given in order; a tree is built by repeatedly joining two adjacent subtrees; a join costs the product of the largest leaf in each; I want the smallest total. Brute force tries every tree shape. My first correct approach is an interval DP: dp[l][r] is the cheapest cost for leaves l..r, split at k, and add max(l..k) × max(k+1..r); that is O(n³) and is a fine start. To see something faster, note that every time two neighbours are joined, the **smaller** of the pair stops mattering for later maxima, so the smallest value should be removed first, joined with its smaller neighbour (the cheapest partner). A decreasing monotonic stack does exactly that. I start with infinity at the bottom as a sentinel. For each x, while the top is at most x, pop it as the current smallest; it is joined with the smaller of its two neighbours, min(new stack top, x), costing popped × that. Then push x. At the end the stack is strictly decreasing, so I pop from the top and join each with the one below it. Trace [6,2,4]: push 6; push 2; x = 4 pops 2 and adds 2·min(6,4) = 8, push 4; end: pop 4, add 4·6 = 24. Total 32. Edge cases: two leaves cost their product. Cost: O(n) time, O(n) space.`,
      1547: `I restate it: a stick of length n must be cut at the given positions, in any order I choose, and each cut costs the length of the piece being cut; minimize the total. Brute force tries every order, m!. The state is a piece of the stick between two marks. I sort the cuts and add 0 and n at the ends so a piece is described by two positions in this array, l and r. Consider the **first** cut made on that piece, at some mark k strictly between them: it costs the whole piece, pos[r] - pos[l], and leaves two independent pieces, l..k and k..r. So dp[l][r] = pos[r] - pos[l] + min over k of dp[l][k] + dp[k][r]. A piece with no mark strictly inside needs no cut, cost 0, so the table starts at zero and I must take the min over the loop rather than update only when smaller. I fill by increasing width and return dp[0][m-1]. Trace n = 7, cuts [1,3,4,5]: pos is [0,1,3,4,5,7]. The best first cut is at 3, costing 7; then [0,3] needs the cut at 1 (cost 3) and [3,7] needs cuts at 4 and 5 (cost 4 + 2 = 6), so the best total is 16. Edge cases: one cut costs n; the cuts list is unsorted in the input, so sort first. Cost: O(m³) time, O(m²) space for m cuts, which is small because m is at most a hundred or so.`
    }
  };
})();
