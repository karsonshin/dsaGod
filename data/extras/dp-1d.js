(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['dp-1d'] = {
    primer: {
      kind: 'technique',
      what: `Dynamic programming (DP) means answering a big question by first answering every smaller version of it, writing each answer in a **table**, and reusing it instead of recomputing. Think of a notebook where you jot "ways to reach step 7" once, so every later step just reads the page.`,
      does: `It solves problems that ask for a **count** (how many ways), a **best value** (min cost, max profit) or a **yes/no** (is it possible) over a sequence of choices. A plain recursion repeats the same sub-question and is exponential; the table makes it one cell per sub-question, usually O(n).`,
      impl: `A list \`dp\` where \`dp[i]\` has a one-sentence meaning (for example "best total from the first i houses"). Set the smallest cells by hand (the base case), then loop \`i\` upward and compute each cell from earlier cells. In Python use a list, or \`functools.cache\` for the top-down version, and two variables when only the last cells matter.`,
      possibilities: `Climbing stairs, house robber, min-cost stairs, decode ways, word break, coin-style counting, perfect squares, integer break, and stock problems with a few "modes". It is also the doorway to 2-D DP, knapsack, string DP and LIS.`
    },

    think: [
      {
        q: `You can climb 1 or 2 steps at a time. Fill in the number of ways to reach steps 0, 1, 2, 3, 4, 5 before looking anything up. What pattern shows up?`,
        a: `Step 0 has 1 way (do nothing) and step 1 has 1 way. Then each step is the sum of the two before it: 2, 3, 5, 8. So the row reads 1, 1, 2, 3, 5, 8. The aha: you never think about the whole climb, only about the **last move**, which came from one step back or two steps back. That is Fibonacci, and it appears whenever "the last move is one of two things".`
      },
      {
        q: `Plain recursion for ways(5) calls ways(4) and ways(3), and so on. How many times is ways(2) computed, and what does that tell you?`,
        a: `Three times: once under ways(3) when called by ways(5), once under ways(3) when called by ways(4), and once directly under ways(4). The same question is asked repeatedly with the same answer, and the repeats multiply as n grows (roughly 1.6 to the power n calls in total). That repetition is exactly what a table or a cache removes, and spotting it is how you decide a problem is DP.`
      },
      {
        q: `Houses \`[3, 5, 3]\`. A greedy robber takes the biggest house first. What does he get, and what is the real best?`,
        a: `Greedy takes the 5 and is then blocked from both neighbours, so he gets 5. Taking the two 3s gives 6. The locally best move (the biggest house) hurt the future, which is the warning sign for DP. The table handles it by comparing "skip this house, keep the best so far" against "rob it, add to the best from two houses back", and both options stay alive.`
      },
      {
        q: `In house robber, suppose you define \`dp[i]\` as "best total where house i IS robbed". What goes wrong with returning \`dp[n]\`?`,
        a: `The best plan might not rob the last house. On \`[4, 9, 1]\` the best is 9 (skip the last house), but "best with house 3 robbed" is only 4 + 1 = 5, so returning \`dp[n]\` gives 5, which is wrong. You would need the maximum of the last two cells. The cleaner state is "best total using only the first i houses", which already includes the choice to skip, so the answer is simply \`dp[n]\`. The wording of the state decides how easy the answer is to read.`
      },
      {
        q: `Decode ways on \`"2101"\`. Predict the answer, then say which character is the dangerous one and why.`,
        a: `The answer is 1: only "2 10 1" works. The dangerous character is the 0. It cannot be a letter alone, so it must pair with the digit before it ("10" or "20"). Table: dp0=1, dp1=1 ("2"), dp2=2 ("2 1" or "21"), dp3=1 (the 0 cannot stand alone, only "10" pairs from dp1), dp4=1 ("01" is not a valid pair, so only the lone 1 from dp3). A zero either gets absorbed by its left neighbour or kills the path.`
      },
      {
        q: `Stairs and house robber drop to O(1) memory, but word break does not. What is the difference in what a cell reads?`,
        a: `Stairs and robber read only \`dp[i-1]\` and \`dp[i-2]\`, a fixed number of recent cells, so older cells can be forgotten. Word break at position i can read **any** earlier \`dp[j]\` (every place where the last word might start), so old cells must stay available. Before you compress a DP, look at the furthest-back index the recurrence touches. A fixed small reach means a rolling variable; a variable reach means keep the table.`
      }
    ],

    breakdown: [
      {
        title: `1. Start from the last move, not the whole path`,
        body: `Question: how many ways to climb 4 steps taking 1 or 2 at a time? Do not list paths. Ask what the **final move** was. Either you stepped from step 3 (a 1-step) or from step 2 (a 2-step). Those two cases cannot overlap, and together they cover everything, so ways(4) = ways(3) + ways(2). The same question for step 3 asks about steps 2 and 1. Every question points at smaller ones. This "what was the last decision?" habit is how you find the recurrence in every 1-D DP.`
      },
      {
        title: `2. Define the state in words`,
        body: `Before any code, finish the sentence "\`dp[i]\` is ...". For stairs: "the number of ways to reach step i". For house robber: "the best total using only the first i houses". For decode ways: "the number of ways to read the first i digits". A good state has two properties: it is a question about a **prefix** (the first i things), and the final answer is one specific cell, usually \`dp[n]\`. If you cannot say it in one sentence, the DP will be wrong; write the sentence as a comment above the list.`
      },
      {
        title: `3. Write the recurrence from the last decision`,
        body: `List what the last piece of the answer could be, and pull from the cell that remains. Stairs: \`dp[i] = dp[i-1] + dp[i-2]\` (add, because we **count**). House robber: skip house i and keep \`dp[i-1]\`, or rob it and add to \`dp[i-2]\` (its neighbour is off limits), so \`dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])\` (max, because we **optimise**). Word break: \`dp[i]\` is true if any \`dp[j]\` is true and \`s[j:i]\` is a word (or, because we **decide**). Same skeleton, different combine.`
      },
      {
        title: `4. Base case: the smallest cells by hand`,
        body: `The recurrence needs cells to read, so set the ones it cannot reach. A base case is a value that makes the recurrence true, not "the number of steps". For counting, the empty prefix has exactly one way (do nothing), so \`dp[0] = 1\`. For sums, the empty prefix is worth \`0\`. For yes/no, the empty prefix is \`True\`. Then check that \`dp[1]\` does not read \`dp[-1]\`: in Python a negative index silently wraps to the end of the list, so guard it with \`if i >= 2\`.`
      },
      {
        title: `5. Fill a small table by hand, cell by cell`,
        body: `House robber on \`[2, 7, 9, 3, 1]\`. Each row compares skip (copy the cell above) with take (the cell two above plus this house).

| i | house | skip = dp[i-1] | take = dp[i-2] + house | dp[i] |
|---|---|---|---|---|
| 0 | none | | | 0 |
| 1 | 2 | 0 | 0 + 2 = 2 | 2 |
| 2 | 7 | 2 | 0 + 7 = 7 | 7 |
| 3 | 9 | 7 | 2 + 9 = 11 | 11 |
| 4 | 3 | 11 | 7 + 3 = 10 | 11 |
| 5 | 1 | 11 | 11 + 1 = 12 | 12 |

The answer is the last cell, 12 (houses 2, 9 and 1). Do this on paper in the interview before coding; it catches a wrong recurrence instantly.`,
        code: { py: `def rob(nums):
    n = len(nums)
    dp = [0] * (n + 1)                 # dp[i] = best using the first i houses
    for i in range(1, n + 1):
        take = nums[i - 1] + (dp[i - 2] if i >= 2 else 0)
        dp[i] = max(dp[i - 1], take)
    return dp[n]` }
      },
      {
        title: `6. Optimise space: keep only what you read`,
        body: `Look at the table above. Row 5 read only rows 4 and 3. Row 4 read rows 3 and 2. Nothing ever reads three rows back, so the old rows are dead weight. Keep two variables, \`prev2\` for \`dp[i-2]\` and \`prev1\` for \`dp[i-1]\`, compute the new cell, then slide: the old \`prev1\` becomes \`prev2\`. Trace on \`[2, 7, 9, 3, 1]\`: (0,0), then (0,2), (2,7), (7,11), (11,11), (11,12). Same answer, O(1) memory. The cost: you can no longer walk the table backwards to list **which** houses, so keep the table if the question asks for the choices.`,
        code: { py: `def rob(nums):
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1` }
      },
      {
        title: `7. Top-down is the same table, asked from the end`,
        body: `If the recurrence is not clear, write the recursion first and add a cache. \`ways(i)\` calls \`ways(i-1)\` and \`ways(i-2)\`, and a dictionary stores each answer the first time. The order inside is always: base case, cache check, compute, store, return. Same cells, same O(n) time. Two cautions: the cache must live **outside** the function (a fresh \`{}\` per call never hits), and deep recursion can overflow the stack for n around 10^5, which is why interviewers often ask you to convert to the loop. Python's \`@functools.cache\` does the bookkeeping for you.`
      },
      {
        title: `8. Costs, edge cases, and how to spot it`,
        body: `Cost: cells times work per cell. Stairs, robber and decode ways have n+1 cells and two pulls each, so O(n) time. Word break tries every word length per cell, so about O(n times longest word), plus hashing cost. Edge cases: empty input, one element, invalid pulls (a 0 digit in decode ways), and unreachable states (use infinity or 0, not a real value). Spot it by: a count / best / yes-no question over a sequence, "ways to reach", a recursion that repeats subproblems, and greedy that fails on a small counterexample.`
      }
    ],

    drills: [
      {
        title: `Hops of one, three or four`,
        q: `A frog starts at position 0 and wants to reach position n. In one hop it moves exactly 1, 3 or 4 positions forward. Count the different hop sequences that land exactly on n.\n\nExample: n = 5 returns \`6\` (1+1+1+1+1, 1+1+3, 1+3+1, 3+1+1, 1+4, 4+1). n = 0 returns \`1\`.`,
        hint: `Think about the last hop. It came from n-1, n-3 or n-4. Add the three counts.`,
        how: `I restate it: count ordered hop sequences made of 1s, 3s and 4s that add up to n. The brute force recursion branches three ways per call and repeats the same remainders, which is exponential. The unlock is the last hop. Whatever sequence reaches n, its final hop was a 1, a 3 or a 4, and what came before is some sequence reaching n-1, n-3 or n-4. Those three cases are different last hops, so no sequence is counted twice. State: dp[i] is the number of ways to land exactly on i. Base: dp[0] = 1, the empty sequence. Only add a pull when the index is not negative. Trace n = 5: dp1 = dp0 = 1; dp2 = dp1 = 1; dp3 = dp2 + dp0 = 2; dp4 = dp3 + dp1 + dp0 = 4; dp5 = dp4 + dp2 + dp1 = 6. That matches the six sequences I listed. Edge cases: n = 0 returns 1; n = 2 returns 1 (only 1+1). The recurrence reads up to four cells back, so the table could shrink to four variables, but the list is clear enough. Cost: O(n) time, O(n) space.`,
        code: { py: `def count_hops(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        for hop in (1, 3, 4):
            if i >= hop:
                dp[i] += dp[i - hop]
    return dp[n]` },
        explain: `Every hop sequence ending at i has a unique last hop from {1, 3, 4}, and the part before it is a sequence ending at i minus that hop, so summing the three cells counts each sequence exactly once. dp[0] = 1 anchors the recursion. O(n) time, O(n) space.`,
        check: `assert count_hops(0) == 1
assert count_hops(1) == 1
assert count_hops(2) == 1
assert count_hops(3) == 2
assert count_hops(5) == 6
def brute(n):
    if n == 0: return 1
    return sum(brute(n - h) for h in (1, 3, 4) if n >= h)
for n in range(0, 16):
    assert count_hops(n) == brute(n)`
      },
      {
        title: `Cheapest hops with blocked cells`,
        q: `A list \`cost\` gives the price of landing on each cell. You start on cell 0 (free), and each hop moves 1 or 2 cells forward. A cost of \`-1\` means the cell is blocked and cannot be landed on. Return the cheapest total price to land on the last cell, or \`-1\` if it cannot be reached.\n\nExample: \`[0, 3, -1, 2, 4]\` returns \`9\` (land on cells 1, 3, 4: 3 + 2 + 4). \`[0, -1, -1, 5]\` returns \`-1\`.`,
        hint: `Use infinity for unreachable cells so min never routes through a blocked one, and convert infinity to -1 only at the end.`,
        how: `I restate it: shortest weighted route along a line where you hop one or two cells and some cells are walls. Brute force tries every hop pattern, exponential, with repeated suffixes. The state is dp[i], the cheapest price to land on cell i, and the last hop came from i-1 or i-2, so dp[i] = cost[i] + min(dp[i-1], dp[i-2]). The trap is blocked cells. If I store 0 for a wall, min would happily route through it for free, so a wall and any cell that cannot be reached must hold infinity, which means nobody picks it. Base: dp[0] = 0, because I start there at no cost. Trace [0, 3, -1, 2, 4]: dp0 = 0; dp1 = 3 + min(0, none) = 3; cell 2 is blocked so it stays infinity; dp3 = 2 + min(dp2 = inf, dp1 = 3) = 5; dp4 = 4 + min(dp3 = 5, dp2 = inf) = 9. The answer is 9. For [0, -1, -1, 5] cell 3 can only come from blocked cells, so it stays infinity and I return -1. Edge cases: a single cell costs 0; a blocked last cell returns -1. Cost: O(n) time, O(n) space (two rolling variables would give O(1)).`,
        code: { py: `def cheapest_hops(cost):
    n = len(cost)
    INF = float('inf')
    dp = [INF] * n
    dp[0] = 0
    for i in range(1, n):
        if cost[i] == -1:
            continue                      # blocked: stays infinity
        best = min(dp[i - 1], dp[i - 2] if i >= 2 else INF)
        if best < INF:
            dp[i] = best + cost[i]
    return dp[-1] if dp[-1] < INF else -1` },
        explain: `Each cell is the cheaper arrival (from one or two cells back) plus its own price. Using infinity for walls means a minimum can never pick an unreachable source. Every cell is computed once from two cells: O(n) time, O(n) space.`,
        check: `assert cheapest_hops([0, 3, -1, 2, 4]) == 9
assert cheapest_hops([0, -1, -1, 5]) == -1
assert cheapest_hops([0]) == 0
assert cheapest_hops([0, 5]) == 5
assert cheapest_hops([0, -1]) == -1
assert cheapest_hops([0, 1, 1, 1, 1]) == 2
import random
def brute(c, i=0):
    if i == len(c) - 1: return 0
    best = float('inf')
    for h in (1, 2):
        j = i + h
        if j < len(c) and c[j] != -1:
            best = min(best, c[j] + brute(c, j))
    return best
for _ in range(300):
    n = random.randint(1, 9)
    c = [0] + [random.choice([-1, 1, 2, 3, 4]) for _ in range(n - 1)]
    b = brute(c)
    assert cheapest_hops(c) == (b if b < float('inf') else -1)`
      },
      {
        title: `Bit strings with no two ones in a row`,
        q: `Count the binary strings of length n that never contain two adjacent \`1\` characters.\n\nExample: n = 3 returns \`5\` (000, 001, 010, 100, 101). n = 1 returns \`2\`, n = 0 returns \`1\` (the empty string).`,
        hint: `One number per position is not enough, because what you may append depends on whether the string ends in 1. Keep two numbers: strings ending in 0 and strings ending in 1.`,
        how: `I restate it: count length-n strings over {0, 1} with no "11". Brute force generates all 2^n strings and filters, exponential. The observation: when I append a character, the rule only cares about the **last** character. After a 0 I may append 0 or 1. After a 1 I may only append 0. So a single dp[i] is not enough to know what is legal next, and I split the state into two: end0[i] counts valid strings of length i ending in 0, end1[i] counts those ending in 1. Transitions: end0[i] = end0[i-1] + end1[i-1] (append a 0 to anything), end1[i] = end0[i-1] (append a 1 only after a 0). Base: for length 0 I treat the empty string as ending in 0, so end0 = 1 and end1 = 0, which lets the empty string accept a 1 next. Trace: length 1: end0 = 1, end1 = 1, total 2. Length 2: end0 = 2, end1 = 1, total 3 (00, 10, 01). Length 3: end0 = 3, end1 = 2, total 5. That matches the five strings. The totals 1, 2, 3, 5, 8 are Fibonacci. Edge cases: n = 0 returns 1. Cost: O(n) time, O(1) space.`,
        code: { py: `def no_adjacent_ones(n):
    end0, end1 = 1, 0                    # the empty string counts as ending in 0
    for _ in range(n):
        end0, end1 = end0 + end1, end0   # append 0 to anything; append 1 only after a 0
    return end0 + end1` },
        explain: `Splitting the state by the last character captures exactly the information the rule needs. Each step appends one character, so every valid string of length i comes from a unique valid string of length i-1. O(n) time, O(1) space.`,
        check: `assert no_adjacent_ones(0) == 1
assert no_adjacent_ones(1) == 2
assert no_adjacent_ones(2) == 3
assert no_adjacent_ones(3) == 5
assert no_adjacent_ones(10) == 144
from itertools import product
for n in range(0, 12):
    cnt = sum(1 for t in product('01', repeat=n) if '11' not in ''.join(t))
    assert no_adjacent_ones(n) == cnt`
      },
      {
        title: `Count the ways to split into words`,
        q: `Given a string \`s\` and a list of words (each word may be reused), count the number of different ways to cut \`s\` into a sequence of words from the list.\n\nExample: \`s = "catsanddog"\`, words \`["cat", "cats", "and", "sand", "dog"]\` returns \`2\` ("cats and dog" and "cat sand dog"). \`s = "ab"\`, words \`["a"]\` returns \`0\`.`,
        hint: `Same table as the yes/no split question, but add the counts instead of OR-ing booleans. dp[0] = 1.`,
        how: `I restate it: how many different segmentations of s into dictionary words. Brute force tries every cut recursively and repeats the same suffixes, exponential. This is the word-break table with one change, because I count instead of decide. State: dp[i] is the number of ways to split the first i characters. The last word ended at i, so it started at some j, and it is valid when s[j:i] is in the set. Then every split of the first j characters can be extended by that last word, so I add dp[j]. Different last words (or the same word at different start points) give different segmentations, so there is no double counting. Base: dp[0] = 1, the one way to split the empty prefix (use no words). Trace "catsanddog": dp3 = 1 ("cat"), dp4 = 1 ("cats"), dp7 = dp4 ("and") + dp3 ("sand") = 2, dp10 = dp7 ("dog") = 2. The answer is 2. Because a cell reads cells far back, I keep the whole table. I cap the word length by the longest word so that I do not scan every start. Edge cases: empty word list gives 0 for a non-empty string; the answer can be huge, so a real system might ask for a modulus. Cost: O(n times longest word) lookups, plus hashing cost, O(n) space.`,
        code: { py: `def count_splits(s, words):
    wordset = set(words)
    max_len = max((len(w) for w in wordset), default=0)
    n = len(s)
    dp = [0] * (n + 1)
    dp[0] = 1                                   # one way to split the empty prefix
    for i in range(1, n + 1):
        for L in range(1, min(i, max_len) + 1):
            if s[i - L:i] in wordset:
                dp[i] += dp[i - L]
    return dp[n]` },
        explain: `Each segmentation has a unique last word, which fixes where it starts, and the part before it is a segmentation of a shorter prefix. Summing dp[start] over valid last words counts each segmentation once. O(n times longest word) lookups, O(n) space.`,
        check: `assert count_splits("catsanddog", ["cat", "cats", "and", "sand", "dog"]) == 2
assert count_splits("ab", ["a"]) == 0
assert count_splits("", ["a"]) == 1
assert count_splits("aaa", ["a", "aa"]) == 3
assert count_splits("aaaa", ["a", "aa", "aaa"]) == 7
assert count_splits("abc", []) == 0
import random
def brute(s, ws):
    if not s: return 1
    return sum(brute(s[len(w):], ws) for w in ws if s.startswith(w))
for _ in range(200):
    s = ''.join(random.choice('ab') for _ in range(random.randint(0, 8)))
    ws = list({''.join(random.choice('ab') for _ in range(random.randint(1, 3))) for _ in range(random.randint(0, 4))})
    assert count_splits(s, ws) == brute(s, ws)`
      }
    ],

    how: {
      70: `I restate it: n steps, each move is 1 or 2 steps, count the move sequences that reach exactly the top. Brute force recurses on the last move, ways(n) = ways(n-1) + ways(n-2), and it is correct but makes about 1.6 to the power n calls because ways(2), ways(3) and so on repeat everywhere. Drawing the tree for n = 5 makes the waste visible. The key observation: to arrive at step i you came from step i-1 with a one-step or from step i-2 with a two-step. Those are different last moves, so the counts add with no overlap. State: dp[i] is the number of ways to reach step i, with dp[0] = 1 (stand still) and dp[1] = 1. Trace: 1, 1, 2, 3, 5, 8 for n = 5. The answer is 8. Since each cell only reads the previous two, I keep two variables and slide them, exactly like my solution with prev and cur. Edge cases: n = 1 returns 1, and the loop runs n - 1 times so n = 1 does not run it. Cost: O(n) time, O(1) space. I would mention this is Fibonacci, and a matrix power would make it O(log n) if n were huge.`,
      746: `I restate it: each stair has a price you pay when you step off it, you may start on stair 0 or 1, and each move climbs 1 or 2. Find the cheapest way to get past the last stair, to position n. Brute force tries every move pattern, exponential. The subtle point is what the state means. I define f[i] as the cheapest total to arrive at position i, where position n is the top, one beyond the last stair. Starting on stair 0 or 1 costs nothing, so f[0] = f[1] = 0. To arrive at i I came from i-1 (paying cost[i-1] to leave it) or from i-2 (paying cost[i-2]), so f[i] = min(f[i-1] + cost[i-1], f[i-2] + cost[i-2]). Trace [10, 15, 20]: f2 = min(0 + 15, 0 + 10) = 10, f3 = min(f2 + cost[2] = 30, f1 + cost[1] = 15) = 15. The answer is 15 (start on stair 1, jump to the top). Because f[i] reads only two cells back I roll two variables, as in my solution with a and b. Edge cases: two stairs, where the answer is the cheaper of the two. Cost: O(n) time, O(1) space. The common mistake is paying the cost of the landing stair instead of the departure stair, which shifts every number.`,
      198: `I restate it: houses in a row, adjacent houses cannot both be robbed, maximise the total. Brute force tries every subset with no neighbours, growing like Fibonacci, so it is exponential. Greedy by taking the largest house fails on [3, 5, 3] (greedy gets 5, the best is 6) or [2, 1, 1, 2], so I need to keep both options alive. For each house there are exactly two choices. Skip it and the best I can do is what I had for the previous house. Rob it and I cannot have used the previous house, so I add its value to the best from two houses back. State: dp[i] is the best total using only the first i houses. Then dp[i] = max(dp[i-1], dp[i-2] + nums[i-1]) with dp[0] = 0. Trace [2, 7, 9, 3, 1]: 0, 2, 7, 11, 11, 12. The answer is 12. Only the last two cells are ever read, so I collapse the table to two variables, which is my solution. If the interviewer wants the houses themselves, I keep the table and walk back: if dp[i] equals dp[i-1] the house was skipped, otherwise taken and I jump two back. Edge cases: empty input returns 0, one house returns its value. Cost: O(n) time, O(1) space.`,
      213: `I restate it: the same robbery, but the houses form a circle, so the first and last are neighbours and cannot both be robbed. I start from the line solution. The new constraint only touches one pair. Any valid plan must skip the first house or skip the last house (or both), because robbing both is forbidden. That splits the world into two cases that I already know how to solve: houses 1 to n-1 as a line (the last one skipped), and houses 2 to n as a line (the first one skipped). Their best answers cover every valid plan, so the answer is the larger of the two. I reuse the two-variable line function. Trace [2, 3, 2]: without the last, [2, 3] gives 3; without the first, [3, 2] gives 3; the answer is 3, whereas the line answer 4 would rob both ends of the circle, which is illegal. Edge case: one house. Both slices are empty and would return 0, which is wrong, so I return nums[0] directly. Two houses work naturally: each slice has one house. Cost: two O(n) passes, so O(n) time, O(1) extra space apart from the slices (index bounds would avoid the copies).`,
      91: `I restate it: a digit string is a message where A is 1 up to Z which is 26. Count the ways to read it back as letters. Brute force tries every cut into pieces of one or two digits with a validity check, two branches per position, exponential. The key observation is again the last piece. The final piece is one digit or two digits. A single digit is a letter unless it is 0, and then the first i-1 digits must be readable, so I add dp[i-1]. A pair is a letter if it is between 10 and 26, and then the first i-2 digits must be readable, so I add dp[i-2]. They are different last pieces, so there is no double count. State: dp[i] is the number of readings of the first i digits, dp[0] = 1 for the empty prefix. Trace "226": dp1 = 1, dp2 = 2 (2 2, or 22), dp3 = dp2 (6 alone) + dp1 (26) = 3. Zeros are the trap: in "06" the 0 cannot stand alone and "06" is not a valid pair, so both pulls fail and the cell is 0, and everything after inherits 0. Edge cases: leading 0 returns 0, "10" returns 1, "27" returns 1. Cost: O(n) time, O(1) space with two variables.`,
      139: `I restate it: can the string be cut into pieces so that every piece is a word in the dictionary, with words reusable? Brute force tries every word at every position recursively, and strings like "aaaa...ab" with words "a" and "aa" repeat the same suffixes exponentially. The observation: the last word ends at the end of the string, and everything before it must itself be splittable. So define dp[i] as true if the first i characters can be built from words. It is true when some j exists with dp[j] true and s[j:i] in the dictionary. Base: dp[0] = true, the empty prefix. The answer is dp[n]. I put the words in a set for O(1) membership, and only try start points within the longest word length of i, which cuts the work from O(n squared) pairs to O(n times L). Trace "leetcode" with {leet, code}: dp4 is true (leet from dp0), dp8 is true (code from dp4). Unlike stairs, a cell can read far-back cells, so I keep the whole table, no O(1) trick. Edge cases: a word list with a very long word, an unreachable middle. Cost: O(n times L) lookups, each hashing a substring of up to L characters, so about O(n times L squared) character work, and O(n) space.`,
      122: `I restate it: I can buy and sell as many times as I like, holding at most one share, and I want the maximum total profit. Brute force tries every set of trade days, exponential. The DP view keeps two numbers per day: free (best profit holding nothing) and hold (best profit holding a share). Each day free = max(free, hold + price), hold = max(hold, free - price). That works, but there is a shorter way to see it. Any profit is a sum of day-to-day price changes. If tomorrow's price is higher than today's, I can buy today and sell tomorrow and collect the rise. A fall never needs to be taken, because I simply do not hold through it. So the optimum is the sum of every positive daily difference. Trace [7, 1, 5, 3, 6, 4]: the changes are -6, +4, -2, +3, -2, so the positive ones add to 4 + 3 = 7. The two-state DP gives the same 7, which is a good cross-check to mention. Edge cases: a single price or a falling series returns 0. Cost: O(n) time, O(1) space. I would say aloud that DP is correct but greedy collection is simpler here, and that this shortcut breaks the moment trades have fees or cooldowns.`,
      343: `I restate it: split the integer n into at least two positive integers that add up to n, and maximise their product. Brute force tries all partitions, which grow very fast. The DP: define dp[i] as the best product for splitting i into at least two parts. Cut off a first part j. The remainder i - j is either left as a single piece (product j times (i - j)) or split further (product j times dp[i - j]), so dp[i] = max over j of max(j * (i-j), j * dp[i-j]). That is O(n squared) and is the answer I would write first. Printing the table for small n shows a pattern: the best parts are all 3s, with a 2 or a 4 to finish. The reason is that 3 times 3 beats 2 times 2 times 2, and a 1 is always wasteful, so a leftover of 1 turns a 3 into a 4. With n = 3q + r: r = 0 gives 3^q; r = 1 gives 3^(q-1) * 4; r = 2 gives 3^q * 2. Special case n <= 3 returns n - 1 because at least two parts are required (2 gives 1, 3 gives 2). Trace n = 10: q = 3, r = 1, so 3^2 * 4 = 36. Cost: the formula is O(log n) with fast power, O(1) space.`,
      279: `I restate it: given n, find the fewest perfect squares that add up to n. Brute force tries combinations of squares, exponential. This is a coin-change shape where the coins are 1, 4, 9, 16 and so on. State: dp[i] is the fewest squares that sum to i, with dp[0] = 0. The last square used is k squared for some k with k squared at most i, and what remains is dp[i - k squared], so dp[i] = 1 + min over k of dp[i - k*k]. That is O(n times sqrt n) time and O(n) space, and is the solution I would give first. Trace n = 12: dp1 = 1, dp2 = 2, dp3 = 3, dp4 = 1, dp5 = 2, dp6 = 3, dp7 = 4, dp8 = 2, dp9 = 1, dp10 = 2, dp11 = 3, dp12 = 3 (4 + 4 + 4). There is also a number-theory shortcut, which is what my stored solution uses: the answer is never more than 4 (Lagrange), it is 1 for a perfect square, 4 exactly when n with all factors of 4 removed is 7 mod 8, 2 if n is a sum of two squares, and 3 otherwise. I would only offer that as a follow-up, since it is easy to misremember. Cost: DP is O(n sqrt n) time, O(n) space; the shortcut is O(sqrt n) time, O(1) space.`
    }
  };
})();
