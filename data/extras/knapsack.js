(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['knapsack'] = {
    primer: {
      kind: 'technique',
      what: `Knapsack is the family of problems where you **choose some items** to fit a **budget**: a weight limit, an exact sum, an amount of money. The only thing that matters about your earlier choices is how much budget is left, like packing a suitcase where you only track the remaining room.`,
      does: `One table indexed by budget answers four questions: the **most value** that fits, whether an exact total is **reachable**, the **fewest** items to reach it, or the **number of ways**. Cost is O(items x budget) time and O(budget) space, because the budget is a value, not an input size (pseudo-polynomial).`,
      impl: `A list \`dp\` of length budget + 1, where \`dp[c]\` is the answer for budget c. For each item, update the cells that can take it: \`dp[c] = max(dp[c], dp[c - w] + v)\`. Loop the budget **downward** if each item may be used once (0/1), **upward** if it can repeat (unbounded). In Python, \`bits |= bits << x\` is a one-line subset-sum.`,
      possibilities: `Packing the most value, coin change (fewest coins, number of ways), splitting numbers into two equal halves, assigning plus and minus signs to hit a target, the smallest leftover after smashing stones, and problems with two budgets at once (zeros and ones).`
    },

    think: [
      {
        q: `One item with weight 3 and value 5, knapsack capacity 9. Predict the best value if the item can be used once, and if it can be used any number of times.`,
        a: `Once: 5, since only one copy exists. Any number of times: 15 (three copies, weight 9). The two answers come from literally the same line of code, \`dp[c] = max(dp[c], dp[c - 3] + 5)\`, and differ only in loop direction. Going down the capacities, \`dp[c - 3]\` is still the old value without this item. Going up, \`dp[c - 3]\` may already include it, so copies stack.`
      },
      {
        q: `This subset-sum code claims \`nums = [3]\`, \`target = 6\` is reachable. Find the bug: \`for s in range(x, target + 1): dp[s] = dp[s] or dp[s - x]\`.`,
        a: `The inner loop goes upward. At s = 3, \`dp[3]\` becomes true (the 3 is used). At s = 6, \`dp[6] = dp[3]\` which is now true, so the same 3 is used twice. Reverse the loop, \`range(target, x - 1, -1)\`: then \`dp[6]\` is computed while \`dp[3]\` is still false from before this item. Lesson: when each item may be used once, the cell you read must not have been touched for this item yet.`
      },
      {
        q: `Coins \`[1, 3, 4]\`, amount 6. A greedy cashier hands out the biggest coin first. How many coins, and what is the true minimum?`,
        a: `Greedy: 4, then 1, then 1, which is 3 coins. The best is 3 + 3, only 2 coins. Greedy works for special coin systems (like US coins) but fails in general, because taking the biggest coin can leave an awkward remainder. The table tries every coin for every amount, so it cannot miss 3 + 3.`
      },
      {
        q: `Coins \`[1, 2]\`, amount 3. How many *combinations* and how many *ordered sequences* make 3? Which loop nesting produces which?`,
        a: `Combinations: 2 (1+1+1 and 1+2). Ordered sequences: 3 (1+1+1, 1+2, 2+1). With **coins in the outer loop**, each coin finishes its turn before the next begins, so 2 can never come before 1 and you count combinations. With the **amount in the outer loop**, any coin may be the last one at every amount, so order matters and you count sequences.`
      },
      {
        q: `Why is the base case \`dp[0] = 1\` for counting ways, \`dp[0] = 0\` for fewest coins, and \`dp[0] = True\` for reachability?`,
        a: `All three say the same thing about the empty selection: making amount 0 uses no items. As a *count*, there is exactly one way to do nothing, and a 0 would make every later count 0. As a *minimum*, doing nothing costs 0 coins (and every other cell starts at infinity). As a *yes/no*, doing nothing certainly reaches 0. The base is whatever value makes the recurrence true for the first real item.`
      },
      {
        q: `The standard solution is O(n x target). Why is it not "polynomial", and what do you say if the target is 10^9?`,
        a: `The running time grows with the *value* of the target, which is exponential in the number of bits needed to write it down. That is called pseudo-polynomial. With a target of 10^9 the list of that length cannot even be allocated. You would say the table only works for small targets, and look for another formulation (meet in the middle, or number theory for special coin systems).`
      }
    ],

    breakdown: [
      {
        title: `1. The brute force and what it throws away`,
        body: `You have items with weights and values and a bag of capacity 4. For each item the choice is take it or leave it, so n items give 2 to the power n subsets. Notice that when you reach item 5, all you need to know about the first four choices is **how much room is left**, not which items you took. Two different earlier choices that leave the same room are the same situation, and the best future from that situation is the same. That is the overlapping subproblem: the situation is (items seen so far, room left).`
      },
      {
        title: `2. Define the state in words`,
        body: `Say it: "\`dp[i][c]\` is the best value using only the first i items with capacity c." The 2-D table has a row per item and a column per capacity 0..C. The answer is the cell for all items and the full capacity, \`dp[n][C]\`. Notice the state forgets *which* items were used and only keeps the budget. For "reachable" the cell is True/False, for "fewest" it is a count, for "ways" it is a number of subsets. Say the sentence for your variant before you code.`
      },
      {
        title: `3. The recurrence: skip or take`,
        body: `For item i with weight w and value v, there are two options. **Skip** it: the best is whatever the first i-1 items gave for the same capacity, \`dp[i-1][c]\`. **Take** it (only if \`w <= c\`): you spend w of the capacity and gain v, on top of the best with the smaller capacity, \`dp[i-1][c-w] + v\`. Take the larger: \`dp[i][c] = max(dp[i-1][c], dp[i-1][c-w] + v)\`. Both options read row i-1, the row **before** this item. That fact is the whole reason the direction of the loop will matter later.`
      },
      {
        title: `4. Base case`,
        body: `With no items (row 0) or no capacity (column 0) the best value is 0, so the first row and first column are 0. For a counting variant, \`dp[0][0] = 1\` (one way to pick nothing) and the rest of row 0 is 0. For a "fewest coins" variant, \`dp[0][0] = 0\` and everything else is infinity. For reachability, \`dp[0][0] = True\`. The base case is the value that makes the recurrence hold when you offer the very first item. Capacity 0 with positive weights means nothing fits, so the take option must check \`w <= c\`.`
      },
      {
        title: `5. Fill a small table by hand`,
        body: `Items (weight, value): A = (1, 15), B = (3, 20), C = (4, 30). Capacity 4. Columns are capacity 0 to 4.

| after offering | c=0 | c=1 | c=2 | c=3 | c=4 |
|---|---|---|---|---|---|
| nothing | 0 | 0 | 0 | 0 | 0 |
| A (1, 15) | 0 | 15 | 15 | 15 | 15 |
| B (3, 20) | 0 | 15 | 15 | 20 | 35 |
| C (4, 30) | 0 | 15 | 15 | 20 | 35 |

Check c=4 for B: skip gives 15, take gives \`dp[c=1] + 20 = 15 + 20 = 35\` (A and B together). For C at c=4: skip gives 35, take gives \`dp[c=0] + 30 = 30\`. The answer is 35, not the single big item. A value-per-weight greedy would also miss cases like this.`
      },
      {
        title: `6. Collapse to one list, and the direction rule`,
        body: `Row i only reads row i-1, so one list is enough if it still holds "row i-1" when you read it. The cell \`dp[c]\` reads \`dp[c-w]\`, a *smaller* index. Walk **downward** from C to w: \`dp[c-w]\` has not been updated yet for this item, so it is still row i-1, and the item is used at most once (0/1). Walk **upward**: \`dp[c-w]\` was already updated for this item, so you may take it again: unlimited copies. Test with one item (3, 5) and capacity 9: downward gives 5, upward gives 15. One reversed loop is the entire difference between 0/1 and unbounded.`,
        code: { py: `def knapsack01(weights, values, cap):
    dp = [0] * (cap + 1)
    for w, v in zip(weights, values):
        for c in range(cap, w - 1, -1):      # DOWN for 0/1, UP for unbounded
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[cap]` }
      },
      {
        title: `7. Same table, a different question`,
        body: `Change what the cell holds and how the options combine. **Reachable?** \`dp[s] = dp[s] or dp[s - x]\`, base True. **Fewest coins**: \`dp[a] = min(dp[a], dp[a - c] + 1)\`, base 0, others infinity. **Number of ways**: \`dp[a] += dp[a - c]\`, base 1. Hand check, coins \`[1, 3, 4]\`, amount 6 (unbounded, so upward). The row after all coins: dp[0..6] = 0, 1, 2, 1, 1, 2, 2. For example dp[6] = min(dp[5]+1, dp[3]+1, dp[2]+1) = min(3, 2, 3) = 2, which is 3 + 3. Remember to test unreachable amounts: use \`amount + 1\` as infinity and return -1 if the target stays there.`
      },
      {
        title: `8. Counting order, cost, and how to spot it`,
        body: `For counting with reuse, loop nesting decides what you count: coins outside and amount inside counts **combinations** (1+2 equals 2+1); amount outside and coins inside counts **ordered sequences**. Cost: n items times capacity C, O(n x C) time and O(C) space with one list. Spot it by: choose a subset, a total to hit or stay under, small integers, "split into two equal groups" (target half the sum), "assign plus or minus signs" (target (total + target) / 2), and brute force that takes or leaves each item. Remember the table is pseudo-polynomial.`
      }
    ],

    drills: [
      {
        title: `Gift basket`,
        q: `A shopper has a budget and a list of gifts, each with a price and a joy score. Each gift can be bought at most once. Return the largest total joy that fits within the budget.\n\nExample: prices \`[2, 3, 4]\`, joy \`[3, 4, 6]\`, budget \`6\` returns \`9\` (buy the gifts costing 2 and 4). Budget 0 returns 0.`,
        hint: `Each gift is taken or left. Use one list indexed by money spent and loop the money downward.`,
        how: `I restate it: pick a subset of gifts with total price at most the budget and maximise total joy. Brute force tries all subsets, 2 to the power n. The observation is that after deciding about some gifts, all I need is how much money is left, so the situation is (gifts seen, budget left). State: dp[c] is the most joy obtainable with a budget of c using the gifts offered so far. For each gift with price p and joy j there are two options: skip it and keep dp[c], or buy it and add j to dp[c - p], the best I could do with the smaller budget before this gift. So dp[c] = max(dp[c], dp[c - p] + j). Each gift can be bought once, and dp[c - p] must still be the value from before this gift, so I loop c from the budget down to p. Base: all zeros (no gifts, no joy), which also means dp[c] is "at most c" money. Trace the example: after gift (2, 3): dp = [0, 0, 3, 3, 3, 3, 3]. After (3, 4): dp[6] = max(3, dp[3] + 4 = 7) = 7, dp[5] = max(3, dp[2] + 4 = 7) = 7, dp[3] = 4. After (4, 6): dp[6] = max(7, dp[2] + 6 = 9) = 9. The answer is 9. Edge cases: a gift costing more than the budget is skipped by the loop range; budget 0 gives 0. Cost: O(gifts x budget) time, O(budget) space.`,
        code: { py: `def best_basket(prices, joy, budget):
    dp = [0] * (budget + 1)
    for p, j in zip(prices, joy):
        for c in range(budget, p - 1, -1):    # downward: each gift at most once
            dp[c] = max(dp[c], dp[c - p] + j)
    return dp[budget]` },
        explain: `dp[c] holds the best joy within budget c over the gifts processed so far. Going downward keeps dp[c - p] as the value before the current gift, so each gift is used at most once. O(n x budget) time, O(budget) space.`,
        check: `assert best_basket([2, 3, 4], [3, 4, 6], 6) == 9
assert best_basket([2, 3, 4], [3, 4, 6], 0) == 0
assert best_basket([], [], 5) == 0
assert best_basket([5], [10], 4) == 0
assert best_basket([5], [10], 5) == 10
assert best_basket([1, 1, 1], [1, 1, 1], 2) == 2
import random
from itertools import combinations
for _ in range(200):
    n = random.randint(0, 6)
    pr = [random.randint(1, 6) for _ in range(n)]
    jy = [random.randint(0, 9) for _ in range(n)]
    b = random.randint(0, 12)
    best = 0
    for r in range(n + 1):
        for comb in combinations(range(n), r):
            if sum(pr[i] for i in comb) <= b:
                best = max(best, sum(jy[i] for i in comb))
    assert best_basket(pr, jy, b) == best`
      },
      {
        title: `Rod cutting`,
        q: `A rod of integer length n can be cut into pieces of integer lengths. A piece of length L sells for \`prices[L - 1]\`, and you may cut as many pieces of any length as you like. Return the maximum total revenue.\n\nExample: \`prices = [2, 5, 7, 8]\`, n = 4 returns \`10\` (two pieces of length 2). n = 0 returns 0.`,
        hint: `Pieces can repeat, so this is the unbounded version. Think about the length of the last piece you cut.`,
        how: `I restate it: split a rod of length n into pieces to maximise the sum of their prices, with unlimited pieces of each length. Brute force tries every way to cut, which is exponential (2 to the power n-1 cut patterns). The observation: whatever the best cutting is, consider one piece of it, say of length L. What remains is a rod of length n - L that is itself cut optimally. So the situation is just the remaining length. State: dp[c] is the best revenue from a rod of length c. The last piece has some length L from 1 to min(c, len(prices)), and then dp[c] = max over L of prices[L - 1] + dp[c - L]. Base: dp[0] = 0, a rod of no length earns nothing. Pieces repeat freely, and since dp[c - L] belongs to a shorter rod already finished, the loop over c increases. This is the unbounded knapsack where the item weights are the piece lengths and the capacity is n. Trace prices [2, 5, 7, 8]: dp1 = 2; dp2 = max(5, dp1 + 2 = 4) = 5; dp3 = max(7, dp2 + 2 = 7, dp1 + 5 = 7) = 7; dp4 = max(8, dp3 + 2 = 9, dp2 + 5 = 10, dp1 + 7 = 9) = 10. Edge cases: n = 0 gives 0; n larger than the price list only uses lengths that have a price. Cost: O(n x number of lengths) time, O(n) space.`,
        code: { py: `def rod_revenue(prices, n):
    dp = [0] * (n + 1)
    for c in range(1, n + 1):
        for L in range(1, min(c, len(prices)) + 1):
            dp[c] = max(dp[c], prices[L - 1] + dp[c - L])
    return dp[n]` },
        explain: `Every cutting of a rod of length c has some piece of length L; removing it leaves an optimal cutting of c - L. Trying every L covers all cases, and shorter rods are finished first. O(n x lengths) time, O(n) space.`,
        check: `assert rod_revenue([2, 5, 7, 8], 4) == 10
assert rod_revenue([2, 5, 7, 8], 0) == 0
assert rod_revenue([1, 5, 8, 9, 10, 17, 17, 20], 8) == 22
assert rod_revenue([3], 5) == 15
assert rod_revenue([1, 2], 1) == 1
import random
from functools import lru_cache
for _ in range(200):
    k = random.randint(1, 5)
    pr = [random.randint(0, 9) for _ in range(k)]
    n = random.randint(0, 9)
    @lru_cache(None)
    def f(c):
        if c == 0: return 0
        return max(pr[L - 1] + f(c - L) for L in range(1, min(c, k) + 1))
    assert rod_revenue(pr, n) == f(n)`
      },
      {
        title: `Choose exactly k numbers`,
        q: `Given a list of non-negative integers \`nums\`, a count \`k\` and a target \`s\`, count the subsets (chosen by position) that have **exactly k elements** whose sum is **exactly s**.\n\nExample: \`nums = [1, 2, 3, 4]\`, k = 2, s = 5 returns \`2\` ({1, 4} and {2, 3}). k = 0, s = 0 returns 1 (the empty subset).`,
        hint: `The budget now has two parts, the sum and the number of items. Add a second dimension for the count and loop both downward.`,
        how: `I restate it: count subsets of fixed size k with a fixed sum s. Brute force enumerates all subsets of size k, which is C(n, k), too many. A plain subset-sum count tracks only the sum, so it cannot enforce the size. The observation: the size is a second budget, exactly like the zeros-and-ones problem. Each item uses 1 unit of the count budget and x units of the sum budget. State: dp[j][t] is the number of subsets from the items seen so far with exactly j elements and sum t. When an item x arrives, taking it extends a subset with j-1 elements and sum t-x, so dp[j][t] += dp[j-1][t-x]. Not taking it leaves dp[j][t] as it was. Each item is used at most once, so both j and t loop downward, which keeps dp[j-1][t-x] as the value from before this item. Base: dp[0][0] = 1 (the empty subset), everything else 0. Trace [1, 2, 3, 4], k = 2, s = 5: after 1, dp[1][1] = 1. After 2, dp[1][2] = 1, dp[2][3] = 1. After 3, dp[1][3] = 1, dp[2][4] = 1 (1 and 3), dp[2][5] = 1 (2 and 3). After 4, dp[2][5] += dp[1][1] = 1, so dp[2][5] = 2. Edge cases: k larger than the list gives 0; zeros are fine because j descends. Cost: O(n x k x s) time, O(k x s) space.`,
        code: { py: `def count_k_subsets(nums, k, s):
    dp = [[0] * (s + 1) for _ in range(k + 1)]
    dp[0][0] = 1
    for x in nums:
        for j in range(k, 0, -1):             # both budgets go downward: each item once
            for t in range(s, x - 1, -1):
                dp[j][t] += dp[j - 1][t - x]
    return dp[k][s]` },
        explain: `The table counts subsets by (size, sum). Adding item x moves a subset from (j-1, t-x) to (j, t), and the downward loops guarantee each item is added to subsets built only from earlier items. O(n x k x s) time, O(k x s) space.`,
        check: `assert count_k_subsets([1, 2, 3, 4], 2, 5) == 2
assert count_k_subsets([1, 2, 3], 0, 0) == 1
assert count_k_subsets([1, 2, 3], 4, 3) == 0
assert count_k_subsets([0, 0, 0], 2, 0) == 3
assert count_k_subsets([5], 1, 5) == 1
assert count_k_subsets([], 0, 0) == 1
import random
from itertools import combinations
for _ in range(200):
    n = random.randint(0, 7)
    a = [random.randint(0, 5) for _ in range(n)]
    k = random.randint(0, 4)
    s = random.randint(0, 12)
    cnt = sum(1 for c in combinations(range(n), k) if sum(a[i] for i in c) == s)
    assert count_k_subsets(a, k, s) == cnt`
      },
      {
        title: `Fewest coins with limited supply`,
        q: `A till holds \`counts[i]\` coins of value \`coins[i]\`. Return the fewest coins that sum to exactly \`amount\`, or \`-1\` if it cannot be done with the coins available.\n\nExample: \`coins = [1, 5]\`, \`counts = [3, 1]\`, amount 8 returns \`4\` (5 + 1 + 1 + 1). Amount 9 returns \`-1\` (only 8 is available in total).`,
        hint: `A limited count of a coin is neither 0/1 nor unbounded. Treat each physical coin as its own 0/1 item.`,
        how: `I restate it: minimum coins to make an exact amount, but each denomination has a limited number of coins. The unbounded coin-change loop would let me use a coin as often as I like, which breaks the limit, and a pure 0/1 loop over denominations would only allow one of each. The cleanest fix is to expand: a denomination with count 3 becomes three separate 0/1 items of the same value. Then it is the standard 0/1 minimum table. State: dp[a] is the fewest coins to make amount a using the coins offered so far, with dp[0] = 0 and everything else infinity (unreachable). For each physical coin c, loop a downward from the amount to c: dp[a] = min(dp[a], dp[a - c] + 1). Downward ensures this particular coin is used at most once. At the end, return dp[amount], or -1 if it is still infinity. Trace coins [1, 5] with counts [3, 1], amount 8: after the three 1s, dp[1..3] = 1, 2, 3. After the 5, dp[5] = 1, dp[6] = 2, dp[7] = 3, dp[8] = 4. The answer is 4. For amount 9, nothing reaches 9, so -1. Edge cases: amount 0 returns 0; a count of 0 contributes nothing. Cost: O(total number of coins x amount) time. A binary-splitting trick (grouping copies as 1, 2, 4, ...) would reduce the number of items to a logarithm per denomination, which I would mention as an optimisation. Space O(amount).`,
        code: { py: `def min_coins_limited(coins, counts, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for c, cnt in zip(coins, counts):
        for _ in range(cnt):                  # each physical coin is a 0/1 item
            for a in range(amount, c - 1, -1):
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] < INF else -1` },
        explain: `Expanding the limited supply into individual coins turns the problem into a 0/1 knapsack with min. Downward loops make each coin count once; infinity marks unreachable amounts so min never uses them. O(total coins x amount) time, O(amount) space.`,
        check: `assert min_coins_limited([1, 5], [3, 1], 8) == 4
assert min_coins_limited([1, 5], [3, 1], 9) == -1
assert min_coins_limited([1, 5], [3, 1], 0) == 0
assert min_coins_limited([2], [1], 4) == -1
assert min_coins_limited([1, 3, 4], [10, 10, 10], 6) == 2
assert min_coins_limited([3], [0], 3) == -1
import random
from itertools import product
for _ in range(200):
    k = random.randint(1, 3)
    cs = [random.randint(1, 6) for _ in range(k)]
    cn = [random.randint(0, 3) for _ in range(k)]
    am = random.randint(0, 15)
    best = None
    for use in product(*[range(c + 1) for c in cn]):
        if sum(u * v for u, v in zip(use, cs)) == am:
            t = sum(use)
            if best is None or t < best: best = t
    assert min_coins_limited(cs, cn, am) == (best if best is not None else -1)`
      }
    ],

    how: {
      322: `I restate it: given coin values with unlimited supply, find the fewest coins that sum to exactly the amount, or -1. Brute force recurses: to make a, try every coin c and solve a - c, keep the minimum. Without memory the same remainders repeat, exponential. A greedy "largest coin first" fails on coins [1, 3, 4] with amount 6: it takes 4 + 1 + 1, three coins, while 3 + 3 uses two. The observation: every optimal answer for amount a ends with some coin c, and the rest is an optimal answer for a - c. So the only thing that matters is the remaining amount. State: dp[a] is the fewest coins for amount a. Base: dp[0] = 0, and everything else starts at infinity, meaning unreachable. I use amount + 1 as infinity, since no real answer can need more coins than the amount (each coin is at least 1) and it cannot overflow when I add 1. Recurrence: dp[a] = min(dp[a], dp[a - c] + 1). Coins can repeat, so I loop a upward for each coin, which lets dp[a - c] already include this coin. Trace [1, 2, 5], 11: the best is 5 + 5 + 1, three coins. If dp[amount] is still infinity I return -1. Edge cases: amount 0 returns 0; a coin larger than the amount is skipped by the range. Cost: O(amount x coins) time, O(amount) space.`,
      416: `I restate it: given positive integers, can I split them into two groups with the same sum? Brute force tries every subset, 2 to the power n. If the two groups have equal sums, each has half the total, so if the total is odd I stop immediately and answer false. Otherwise the question becomes: is there a subset that sums to exactly total / 2? Once one group has half, the rest automatically has the other half. That is subset sum, a yes/no knapsack. State: dp[s] is true when some subset of the numbers seen so far sums to s. Base: dp[0] = true, the empty subset. For each number x, dp[s] = dp[s] or dp[s - x]. Each number can be used once, so I loop s downward from half to x. If I looped upward, [3] would reach 6 by using the 3 twice. Trace [1, 5, 11, 5]: total 22, half 11. After 1: {0, 1}. After 5: {0, 1, 5, 6}. After 11: adds 11, so dp[11] is true and I can answer true (the subset {11} against {1, 5, 5}). Quick prunes: a number larger than half means false. Edge cases: a single element is false; two equal numbers is true. Cost: O(n x total / 2) time, O(total / 2) space. A bitset (bits |= bits << x) divides the time by the word size.`,
      518: `I restate it: given coin values with unlimited supply, count the combinations that sum to the amount, where 1+2 and 2+1 are the same combination. Brute force recurses over (coin index, remaining amount), taking another copy of the coin or moving on, and branches exponentially without a cache. The observation: to count each combination once, I must build every combination in one fixed order of coins. So I process coin by coin: when coin c's turn is over, no later coin can be placed before it. State: dp[a] is the number of combinations that make a using the coins processed so far. Base: dp[0] = 1, the empty combination. For each coin c, loop a upward from c to the amount and do dp[a] += dp[a - c]: the new ways are those ending with one more copy of c, built on top of the ways to make a - c. Upward lets a coin repeat. Putting the coins in the **outer** loop is what makes this combinations; swapping the loops would count ordered sequences. Trace coins [1, 2, 5], amount 5: after coin 1, every dp is 1; after coin 2, dp = [1, 1, 2, 2, 3, 3]; after coin 5, dp[5] = 3 + dp[0] = 4. The four combinations are 5, 2+2+1, 2+1+1+1 and 1+1+1+1+1. Edge cases: amount 0 returns 1; an unreachable amount returns 0. Cost: O(amount x coins) time, O(amount) space.`,
      494: `I restate it: put a plus or minus before every number so the expression equals a target, and count the sign assignments. Brute force tries both signs for each number, 2 to the power n. Memoising on (index, running sum) works but is a bigger table than needed. The observation: let P be the sum of the numbers given a plus and N the sum of those given a minus. Then P - N = target and P + N = total, so adding the two equations gives P = (total + target) / 2. Choosing signs is exactly choosing which subset gets a plus, so I only need to count subsets that sum to P. That is a 0/1 counting knapsack. Two checks come first: if |target| is more than the total, or total + target is odd, the answer is 0, since P would be negative or fractional. State: dp[s] is the number of subsets of the numbers seen so far that sum to s, with dp[0] = 1. For each x, dp[s] += dp[s - x] looping s downward, because each number gets one sign. Trace [1, 1, 1, 1, 1], target 3: total 5, P = 4, and the number of subsets of five ones that sum to 4 is 5. Zeros are fine: dp[s] += dp[s] doubles the counts, since a zero can take either sign. Cost: O(n x P) time, O(P) space.`,
      474: `I restate it: given binary strings and limits of m zeros and n ones, pick as many strings as possible so the total zeros are at most m and the total ones are at most n, each string at most once. Brute force tries every subset of strings, 2 to the power of the number of strings. The observation: each string costs two resources at once, a number of zeros and a number of ones, and its value is 1. That is a 0/1 knapsack with two capacities. State: dp[i][j] is the most strings I can pick using at most i zeros and j ones from the strings seen so far. For a string with z zeros and o ones, taking it gives dp[i - z][j - o] + 1, skipping keeps dp[i][j], so dp[i][j] = max of the two. Each string is used once, so both loops run downward: i from m down to z, and j from n down to o, which keeps the cell I read as the value from before this string. Base: all zeros. Trace ["10", "0001", "111001", "1", "0"] with m = 5, n = 3: the best picks are "10", "0001", "1", "0", which use 1 + 3 + 0 + 1 = 5 zeros and 1 + 1 + 1 + 0 = 3 ones, so the answer is 4. Edge cases: m = n = 0 gives 0; strings that individually exceed the budget are never taken. Cost: O(strings x m x n) time, O(m x n) space.`,
      1049: `I restate it: repeatedly smash two stones together; equal stones vanish and unequal stones leave the difference. After all smashes, find the smallest possible weight left (or 0). Brute force simulates every order of smashing, which explodes. The observation: whatever the order, the final leftover is a signed sum of the stones, so each stone is added to one group or subtracted, as if the stones were split into two piles. The leftover is the difference between the two pile sums. To minimise it, I want the smaller pile's sum as close to half of the total as possible. So I need the largest reachable subset sum that is at most total / 2. State: dp[s] is true when some subset of the stones sums to s, with dp[0] = true. For each stone x, dp[s] = dp[s] or dp[s - x] looping downward (each stone once), up to half = total // 2. Finally I scan from half down to 0 for the first true cell s, and the answer is total - 2 * s. Trace [2, 7, 4, 1, 8, 1]: total 23, half 11, and 11 is reachable (7 + 4), so the answer is 23 - 22 = 1. Edge cases: one stone returns its weight (half is below the stone, so only 0 is reachable); two equal stones return 0. Cost: O(n x total / 2) time, O(total / 2) space.`,
      377: `I restate it: given distinct positive numbers and a target, count the ordered sequences that sum to the target, so 1+2 and 2+1 count separately. Brute force recurses on the next number to pick, which repeats the same remaining targets exponentially. The observation: any sequence ends with some number x, and what precedes it is a sequence that sums to target - x. State: dp[a] is the number of ordered sequences that sum to a. Base: dp[0] = 1, the empty sequence. Recurrence: dp[a] = sum of dp[a - x] over all numbers x with x <= a. Because the order of picks matters, every number may come last at every amount, so the amount must be the **outer** loop and the numbers the inner loop. That is the opposite nesting from the combination-counting coin problem, where the coins are outer. Trace [1, 2, 3], target 4: dp0 = 1, dp1 = 1, dp2 = dp1 + dp0 = 2, dp3 = dp2 + dp1 + dp0 = 4, dp4 = dp3 + dp2 + dp1 = 7. The seven sequences include 1+3, 3+1 and 2+2. Edge cases: a number larger than the target is ignored for small amounts; an unreachable target gives 0. Cost: O(target x numbers) time, O(target) space.`
    }
  };
})();
