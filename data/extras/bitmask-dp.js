(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['bitmask-dp'] = {
    primer: {
      kind: 'technique',
      what: `**Bitmask DP** is dynamic programming where the state is a **set of items written as one integer**: bit j is 1 if item j has been used. Think of a row of light switches, one per item, read as a binary number; the number is then used directly as an index into a table with one slot per possible set.`,
      does: `It solves "use or visit every item exactly once, and the order or pairing matters" when there are only about 20 items: tours, assigning jobs to workers, splitting into equal groups, counting arrangements, games where numbers get used up. It replaces n! orderings with 2ⁿ sets, typically O(2ⁿ · n) time.`,
      impl: `Allocate \`dp = [INF] * (1 << n)\`. Loop \`mask\` upward from 0: adding an item sets a bit, so a new mask is always numerically larger and every source is already final. Test bit j with \`mask >> j & 1\`, add with \`mask | (1 << j)\`, count with \`mask.bit_count()\` (3.10+) or \`bin(mask).count("1")\`. Use \`dp[mask][last]\` when position matters, or BFS over \`(node, mask)\` for shortest paths.`,
      possibilities: `Assign n jobs to n workers at least cost, travelling-salesman tours (Held-Karp), partition into k equal-sum groups, count valid permutations, shortest walk visiting all nodes of a small graph, smallest set of people covering all skills, tiling a grid row by row, and win-or-lose games on a pool of numbers.`
    },

    think: [
      {
        q: `What does the 4-bit mask \`0b1010\` mean, and what are the masks you get by adding item 0, and by removing item 3?`,
        a: `Bits are numbered from the right, so \`0b1010\` has bits 1 and 3 set: items 1 and 3 are in the set, items 0 and 2 are not. Adding item 0 is \`mask | (1 << 0)\`, giving \`0b1011\` (11). Removing item 3 is \`mask & ~(1 << 3)\`, giving \`0b0010\` (2). Bit j is the switch for item j; the integer is just the switches read as a binary number.`
      },
      {
        q: `Brute force over visiting orders of 16 cities is 16! orders. Why can a table with 2¹⁶ entries (times a small factor) replace it?`,
        a: `Two different orders that visit the same set of cities and end at the same city leave exactly the same future: the same cities remain and you stand in the same place. So the order of the past is irrelevant; only the *set visited* (and where you are) matters. There are 2¹⁶ = 65,536 sets against about 2 × 10¹³ orders. The art is to see what part of the history the future actually depends on.`
      },
      {
        q: `Why can we loop \`mask\` from 0 to \`2ⁿ - 1\` in plain increasing order and be sure every source mask is finished before it is used?`,
        a: `A transition adds one item, which sets a bit that was 0, so the new mask is strictly larger than the old one: \`mask | (1 << j) > mask\`. Therefore every mask that can lead to M is numerically smaller than M and has already been visited. Increasing numeric order is already a valid topological order of the states, with no recursion needed.`
      },
      {
        q: `Someone writes \`if mask & 1 << j == 0\` to test that item j is absent and it works in Python. Why might the same line fail in JavaScript, Java and C++?`,
        a: `In Python, comparisons bind looser than the bitwise operators, so the line means \`(mask & (1 << j)) == 0\`. In C++, Java and JavaScript, \`==\` binds tighter than \`&\`, so it parses as \`mask & ((1 << j) == 0)\`: that is \`mask & 0\`, always 0, or a compile error in Java. Always write \`(mask & (1 << j)) == 0\` with explicit brackets; this one slip silently breaks the whole DP.`
      },
      {
        q: `Enumerating every submask of every mask is described as O(3ⁿ), not O(4ⁿ). Why 3?`,
        a: `For a pair (mask, submask), each of the n items is in exactly one of three situations: not in the mask, in the mask but not in the submask, or in both. That is 3 choices per item, 3ⁿ pairs in total. For n = 15 that is 14 million, fine; for n = 20 it is 3.5 billion, too slow. So submask loops are only for n about 15 or less.`
      },
      {
        q: `The state is \`dp[mask]\` for assigning jobs to workers, and the next worker is "the number of bits set in mask". Why is that enough to know whose turn it is?`,
        a: `Workers are handed jobs in order 0, 1, 2, ..., so if \`k\` jobs have been given out, workers 0 to k-1 have one each and the next worker to serve is number k. The popcount of the mask is exactly k. This is a common trick: when items are consumed in a fixed order, the *size* of the set tells you which step you are on, and the set tells you what was used.`
      }
    ],

    breakdown: [
      {
        title: `1. Why sets, not orders`,
        body: `Three workers (0, 1, 2) must each take one of three jobs, and \`cost[w][j]\` is what worker w charges for job j. Brute force tries every assignment: 3! = 6 here, but n! for n workers (15! is over a trillion). Look for what repeated work hides. After workers 0 and 1 have taken jobs 2 and 0, the cheapest completion for worker 2 depends only on which jobs are *left* (job 1), not on who took which of the first two. All histories that use the same set of jobs share one future, so we need one table entry per set of jobs: 2ⁿ entries instead of n! orders.`
      },
      {
        title: `2. A set as an integer`,
        body: `Use one bit per job: bit j is 1 if job j is taken. Reading bits from right to left, \`0b101\` means jobs 0 and 2 are taken and job 1 is free. For n = 3 there are 8 masks: \`000\` (nothing), \`001\` (job 0), \`010\` (job 1), \`011\` (jobs 0, 1), \`100\` (job 2), \`101\`, \`110\`, \`111\` (all). Tools: test bit j with \`mask >> j & 1\`; add job j with \`mask | (1 << j)\`; the full set is \`(1 << n) - 1 = 0b111\`; how many are taken is \`bin(mask).count("1")\`. The integer is also an array index, so \`dp[0b101]\` is a perfectly ordinary list lookup.`
      },
      {
        title: `3. State in words`,
        body: `\`dp[mask]\` = **the cheapest total cost of giving jobs to the first popcount(mask) workers, using exactly the jobs in mask**. So \`dp[0b101]\` is the cheapest way for workers 0 and 1 to take jobs 0 and 2 between them (in either arrangement). The worker about to be served is number popcount(mask). Everything we need to know about the past is compressed into the set; how the jobs were distributed among earlier workers is already folded into the cost. If the next cost also depended on *where you stand* (a tour), we would need a second index; here we do not.`
      },
      {
        title: `4. Recurrence and base case`,
        body: `To reach \`mask\`, some job j in it must have been given to worker w = popcount(mask) - 1, last. So by pulling: \`dp[mask] = min over j in mask of dp[mask without j] + cost[w][j]\`. Equivalently, by pushing from a finished mask to larger ones: for each job j not in mask, \`dp[mask | (1 << j)] = min(that, dp[mask] + cost[w][j])\` with w = popcount(mask). **Base case:** \`dp[0] = 0\`, nobody has a job, cost nothing. Everything else starts at infinity ("unreached"). **Answer:** \`dp[(1 << n) - 1]\`, every job taken.`
      },
      {
        title: `5. Fill the table by hand, cell by cell`,
        body: `Costs: worker 0 pays \`[3, 1, 5]\`, worker 1 pays \`[2, 4, 1]\`, worker 2 pays \`[6, 2, 3]\` for jobs 0, 1, 2. Masks are written job2 job1 job0.\n\n| mask | jobs | worker | how it is reached | dp |\n|---|---|---|---|---|\n| 000 | none | | base | 0 |\n| 001 | 0 | 0 | 0 + cost[0][0] | 3 |\n| 010 | 1 | 0 | 0 + cost[0][1] | 1 |\n| 100 | 2 | 0 | 0 + cost[0][2] | 5 |\n| 011 | 0,1 | 1 | from 001 + cost[1][1] = 7; from 010 + cost[1][0] = 3 | 3 |\n| 101 | 0,2 | 1 | from 001 + cost[1][2] = 4; from 100 + cost[1][0] = 7 | 4 |\n| 110 | 1,2 | 1 | from 010 + cost[1][2] = 2; from 100 + cost[1][1] = 9 | 2 |\n\nSingle-job masks are worker 0's choices; two-job masks pick the cheaper of two ways.`
      },
      {
        title: `6. The last row, the answer, and why this order works`,
        body: `Mask \`111\` hands the last job to worker 2, and it can come from three masks: from \`011\` taking job 2: 3 + cost[2][2] = 3 + 3 = 6; from \`101\` taking job 1: 4 + cost[2][1] = 4 + 2 = 6; from \`110\` taking job 0: 2 + cost[2][0] = 2 + 6 = 8. The minimum is **6**, the cheapest assignment (brute force agrees: worker 0 takes job 0, worker 1 takes job 2, worker 2 takes job 1, costing 3 + 1 + 2 = 6). We never needed an explicit ordering: every transition sets a bit, so the new mask is larger, and counting masks upward from 0 visits sources first.`,
        code: { py: `def min_assign(cost):
    n = len(cost)
    INF = float('inf')
    dp = [INF] * (1 << n)
    dp[0] = 0
    for mask in range(1 << n):
        if dp[mask] == INF:
            continue
        w = bin(mask).count("1")
        for j in range(n):
            if mask >> j & 1:
                continue
            nxt = mask | (1 << j)
            dp[nxt] = min(dp[nxt], dp[mask] + cost[w][j])
    return dp[(1 << n) - 1]` }
      },
      {
        title: `7. When position matters: dp[mask][last]`,
        body: `A travelling salesman cannot get by with the set of cities alone, because the next leg's cost depends on the city you are standing in. Add a second index: \`dp[mask][last]\` is the cheapest cost to have visited exactly the cities in mask and be at \`last\` (which must be in mask). Start \`dp[1][0] = 0\` (only city 0 visited, standing at 0). From each reached state, try every city \`nxt\` not in mask: \`dp[mask | 1<<nxt][nxt] = min(..., dp[mask][last] + dist[last][nxt])\`. Answer: the minimum over \`last\` of \`dp[full][last] + dist[last][0]\`. Cost: 2ⁿ·n states, n transitions each, so **O(2ⁿ · n²)** time and **O(2ⁿ · n)** space, against n! for brute force.`
      },
      {
        title: `8. Cost, limits and how to spot it`,
        body: `Time is O(2ⁿ · n) for the plain mask table, space O(2ⁿ). Memory often fails first: at n = 20, 2²⁰ ints is 4 MB, but \`dp[mask][last]\` is 20 million cells. Variants: **count** instead of minimize (use \`+=\`, as in Beautiful Arrangement), **boolean** reachability (OR), **BFS over (node, mask)** when every step costs 1, **submask loops** (O(3ⁿ)) when a state is built from a whole group, and **meet in the middle** when n is 30 to 40. Spot it by the constraint \`n <= 16\` or \`n <= 20\`, plus "use each item once" or a permutation search. Edge cases: n = 0 or 1, impossible states staying infinite, 64-bit counts.`
      }
    ],

    drills: [
      {
        title: `Smallest team covering every skill`,
        q: `A project needs \`n\` skills, numbered 0 to n-1 (n at most 10). You have a list of people; each person is a list of the skills they have. Return the minimum number of people whose skills together cover **all** n skills, or \`-1\` if it is impossible.\n\nExample: \`n = 3\`, \`people = [[0, 1], [1, 2], [2], [0]]\` returns \`2\` (the first two people cover 0, 1, 2).`,
        hint: `Turn each person into a bitmask of skills. Let dp[mask] be the fewest people whose combined skills are exactly mask.`,
        how: `I restate it: choose the fewest people so every skill from 0 to n-1 is held by at least one of them. Brute force tries every subset of people, which is exponential in the number of people, and that can be much bigger than n. The unlock is that the number of skills is small (at most 10), so the state should be the **set of skills covered so far**, which is a mask of n bits, at most 1024 values. I convert each person to a bitmask \`pm\` where bit s is set if they have skill s. Let \`dp[mask]\` be the fewest people needed so that the union of their skills is exactly mask, with \`dp[0] = 0\`. From each reached mask, adding person p moves to \`mask | pm\` with one more person: \`dp[mask | pm] = min(dp[mask | pm], dp[mask] + 1)\`. The new mask is greater than or equal to the old one, so iterating masks in increasing order is safe (if a person adds nothing, the new mask equals the old, and the update cannot improve it). The answer is \`dp[(1 << n) - 1]\`, or -1 if it stayed infinite. Trace the example: masks of people are 011, 110, 100, 001; dp[011] = 1, dp[110] = 1, then 011 | 110 = 111 gives dp[111] = 2. Edge cases: n = 0 needs 0 people; a skill nobody has gives -1. Cost: O(2ⁿ · people) time, O(2ⁿ) space.`,
        code: { py: `def fewest_people(n, people):
    masks = []
    for skills in people:
        m = 0
        for s in skills:
            m |= 1 << s
        masks.append(m)
    full = (1 << n) - 1
    INF = float('inf')
    dp = [INF] * (full + 1)
    dp[0] = 0
    for mask in range(full + 1):
        if dp[mask] == INF:
            continue
        for pm in masks:
            nxt = mask | pm
            if dp[mask] + 1 < dp[nxt]:
                dp[nxt] = dp[mask] + 1
    return dp[full] if dp[full] != INF else -1` },
        explain: `The only thing that matters about a chosen group is which skills it covers, so dp over skill sets is exact. Adding a person only sets bits, so masks never decrease and increasing order is a valid evaluation order. O(2ⁿ · p) time for p people, O(2ⁿ) space.`,
        check: `assert fewest_people(3, [[0, 1], [1, 2], [2], [0]]) == 2
assert fewest_people(0, [[]]) == 0
assert fewest_people(2, [[0]]) == -1
assert fewest_people(1, [[0], [0]]) == 1
assert fewest_people(3, [[0], [1], [2]]) == 3
import random
from itertools import combinations
for _ in range(200):
    n = random.randint(0, 5)
    people = [random.sample(range(n), random.randint(0, n)) if n else [] for _ in range(random.randint(0, 6))]
    best = -1
    for k in range(0, len(people) + 1):
        if any(set().union(*[set(p) for p in c]) >= set(range(n)) for c in combinations(people, k)) if k else n == 0:
            best = k
            break
    assert fewest_people(n, people) == best`
      },
      {
        title: `Count the tours`,
        q: `A graph has \`n\` nodes (numbered 0 to n-1, with n between 1 and 10) and a list of undirected edges. Count the **ordered** sequences of all n nodes in which every two consecutive nodes are joined by an edge (a Hamiltonian path, counted once for each direction and start).\n\nExample: \`n = 3\`, edges \`[[0, 1], [1, 2]]\` returns \`2\` (0,1,2 and 2,1,0). A single node returns \`1\`.`,
        hint: `The next step depends on the node you stand in, so use dp[mask][last] and count with += instead of min.`,
        how: `I restate it: count the ways to walk through all n nodes exactly once, moving along edges. Brute force tries all n! orderings and checks each consecutive pair, about 3.6 million for n = 10, fine here but hopeless at n = 20. The state needs both the set of nodes already visited and the node I am currently at, because the next move depends on my position: \`dp[mask][last]\` is the number of ordered paths that visit exactly the nodes in mask and end at last. Base case: every single node is a path of one node, so \`dp[1 << i][i] = 1\` for every i (the walk can start anywhere). From a state, extend to each neighbour \`nb\` not in mask: \`dp[mask | (1 << nb)][nb] += dp[mask][last]\`. Iterating masks upward is safe because the mask grows. The answer is the sum of \`dp[full][last]\` over all last nodes. Trace n = 3 with edges 0-1 and 1-2: starts 0, 1, 2 each count 1; extending {0} to 1 gives {0,1} at 1; extending {1} to 0 gives {0,1} at 0, and to 2 gives {1,2} at 2; then {0,1} ending at 1 extends to node 2, giving the full mask at 2, and {1,2} ending at 1 extends to node 0, giving the full mask at 0. That is two paths. Edge cases: n = 1 returns 1; no edges with n > 1 returns 0. Cost: O(2ⁿ · n²) time, O(2ⁿ · n) space.`,
        code: { py: `def count_tours(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    full = (1 << n) - 1
    dp = [[0] * n for _ in range(full + 1)]
    for i in range(n):
        dp[1 << i][i] = 1
    for mask in range(1, full + 1):
        for last in range(n):
            ways = dp[mask][last]
            if not ways:
                continue
            for nb in adj[last]:
                if not mask >> nb & 1:
                    dp[mask | (1 << nb)][nb] += ways
    return sum(dp[full])` },
        explain: `dp[mask][last] counts the paths that have used exactly the nodes in mask and stand at last, so extending along an edge to an unvisited node moves to a larger mask. Paths are counted once per direction because each is an ordered sequence. O(2ⁿ · n²) time in the worst case, O(2ⁿ · n) space.`,
        check: `assert count_tours(3, [[0, 1], [1, 2]]) == 2
assert count_tours(1, []) == 1
assert count_tours(2, []) == 0
assert count_tours(3, [[0, 1], [1, 2], [0, 2]]) == 6
assert count_tours(4, [[0, 1], [1, 2], [2, 3]]) == 2
import random
from itertools import permutations
for _ in range(100):
    n = random.randint(1, 6)
    es = [[a, b] for a in range(n) for b in range(a + 1, n) if random.random() < 0.5]
    es_set = {tuple(sorted(e)) for e in es}
    brute = sum(all(tuple(sorted((p[i], p[i + 1]))) in es_set for i in range(n - 1)) for p in permutations(range(n)))
    assert count_tours(n, es) == brute`
      },
      {
        title: `Fewest stickers to spell a word`,
        q: `You have an unlimited supply of each sticker; a sticker is a string of lowercase letters, and you may cut out any of its letters to use (each letter on a sticker used at most once per sticker). Return the fewest stickers needed to spell \`target\` (length at most 12), or \`-1\` if some letter can never be spelled.\n\nExample: stickers \`["with", "example", "science"]\`, target \`"thehat"\` returns \`3\`. Stickers \`["a"]\`, target \`"b"\` returns \`-1\`.`,
        hint: `The state is which positions of the target are already spelled. From a state, apply a sticker and cover leftmost matching positions.`,
        how: `I restate it: cover each letter of the target using letters cut from stickers, using as few stickers as possible. Brute force chooses multisets of stickers and checks whether their letters cover the target, which has no good bound. The target is short (at most 12 letters), so I make the state the **set of target positions already covered**, a mask of up to 12 bits, 4096 states. \`dp[mask]\` is the fewest stickers that cover exactly the positions in mask. Start with \`dp[0] = 0\`. From a reached mask, for each sticker, count its letters and then walk through the target positions in order: for each uncovered position whose letter is still available on the sticker, cover it and use up that letter. That gives the new mask; if it is larger than the old one, update \`dp[new] = min(dp[new], dp[mask] + 1)\`. Covering the leftmost uncovered positions of each letter is enough, since positions holding the same letter are interchangeable. Masks only grow, so I iterate upward. The answer is \`dp[full]\`, or -1 if still infinite. Trace "thehat" with the three stickers: "with" covers t,h; "example" covers e,... and "science" covers the rest; the best is 3. Edge cases: empty target needs 0; an impossible letter gives -1. Cost: O(2ˡ · s · (l + 26)) time for target length l and s stickers, O(2ˡ) space.`,
        code: { py: `from collections import Counter

def min_stickers(stickers, target):
    n = len(target)
    full = (1 << n) - 1
    counts = [Counter(s) for s in stickers]
    INF = float('inf')
    dp = [INF] * (full + 1)
    dp[0] = 0
    for mask in range(full + 1):
        if dp[mask] == INF:
            continue
        for cnt in counts:
            left = dict(cnt)
            nxt = mask
            for i in range(n):
                if not nxt >> i & 1 and left.get(target[i], 0) > 0:
                    left[target[i]] -= 1
                    nxt |= 1 << i
            if nxt != mask and dp[mask] + 1 < dp[nxt]:
                dp[nxt] = dp[mask] + 1
    return dp[full] if dp[full] != INF else -1` },
        explain: `Positions with equal letters are interchangeable, so always covering the leftmost uncovered matches reaches every useful state. Applying a sticker only adds bits, so increasing mask order is valid. At most 2^l states, each trying s stickers over l letters: O(2^l · s · l) time, O(2^l) space.`,
        check: `assert min_stickers(["with", "example", "science"], "thehat") == 3
assert min_stickers(["a"], "b") == -1
assert min_stickers(["a"], "") == 0
assert min_stickers(["ab"], "aabb") == 2
assert min_stickers(["notice", "possible"], "basicbasic") == -1
import random
from collections import Counter
from itertools import combinations_with_replacement
for _ in range(200):
    stickers = ["".join(random.choice("abc") for _ in range(random.randint(1, 3))) for _ in range(random.randint(1, 3))]
    target = "".join(random.choice("abc") for _ in range(random.randint(0, 6)))
    need = Counter(target)
    best = -1
    for k in range(0, len(target) + 1):
        if any(not (need - sum((Counter(s) for s in c), Counter())) for c in combinations_with_replacement(stickers, k)):
            best = k
            break
    assert min_stickers(stickers, target) == best`
      },
      {
        title: `Domino floor`,
        q: `Count the ways to tile a \`rows × cols\` rectangle (both at most 8) completely with 1×2 dominoes, each placed horizontally or vertically, with no overlaps and no gaps.\n\nExample: \`rows = 2, cols = 3\` returns \`3\`; \`rows = 3, cols = 4\` returns \`11\`; \`rows = 3, cols = 3\` returns \`0\` (odd area).`,
        hint: `Process cells in row-major order and keep a mask of the next cols cells saying which are already covered by a domino sticking in from before.`,
        how: `I restate it: fill the whole grid with dominoes in every possible way and count the ways. Brute force places a domino at the first empty cell in every possible orientation and recurses, which repeats work badly on wide grids. The structure to exploit is that I fill cells in row-major order, and a domino only reaches forward, at most cols cells ahead (a vertical one covers the cell cols positions later). So at any moment the only thing that matters about the past is which of the **next cols cells** are already covered, and that is a mask of cols bits: this is a **broken-profile** bitmask DP. Let \`dp[mask]\` be the number of ways to have processed all cells before the current one, where bit j of mask says the cell at offset j from the current one is already filled. At the current cell: if bit 0 is set, it is already covered, so the new mask is mask >> 1. Otherwise I can place a horizontal domino (needs a next cell in the same row and bit 1 clear): new mask is (mask >> 1) | 1, covering the next cell. Or a vertical domino (needs a row below): new mask is (mask >> 1) | (1 << (cols - 1)), covering the cell cols ahead. After all cells, the answer is dp[0]: nothing sticking out of the grid. Trace 2×1: first cell vertical gives mask 1; second cell sees bit 0 set, mask 0; total 1. Edge cases: odd area returns 0 directly. Cost: O(rows · cols · 2^cols) time, O(2^cols) space.`,
        code: { py: `def domino_tilings(rows, cols):
    if rows * cols % 2:
        return 0
    dp = {0: 1}
    for r in range(rows):
        for c in range(cols):
            nd = {}
            for mask, ways in dp.items():
                if mask & 1:
                    nm = mask >> 1
                    nd[nm] = nd.get(nm, 0) + ways
                    continue
                if c + 1 < cols and not mask & 2:
                    nm = (mask >> 1) | 1
                    nd[nm] = nd.get(nm, 0) + ways
                if r + 1 < rows:
                    nm = (mask >> 1) | (1 << (cols - 1))
                    nd[nm] = nd.get(nm, 0) + ways
            dp = nd
    return dp.get(0, 0)` },
        explain: `Processing cells in row-major order, a domino can only extend at most cols cells forward, so a cols-bit mask of already-covered upcoming cells captures everything about the past. Each cell transitions each mask in at most two ways. The count of finished tilings is the ways ending with an empty mask. O(rows · cols · 2^cols) time, O(2^cols) space.`,
        check: `assert domino_tilings(2, 3) == 3
assert domino_tilings(3, 4) == 11
assert domino_tilings(3, 3) == 0
assert domino_tilings(1, 2) == 1
assert domino_tilings(2, 2) == 2
assert domino_tilings(4, 4) == 36
assert domino_tilings(8, 8) == 12988816
assert domino_tilings(1, 1) == 0
def brute(rows, cols):
    grid = [[False] * cols for _ in range(rows)]
    def go(pos):
        while pos < rows * cols and grid[pos // cols][pos % cols]:
            pos += 1
        if pos == rows * cols:
            return 1
        r, c = divmod(pos, cols)
        total = 0
        if c + 1 < cols and not grid[r][c + 1]:
            grid[r][c] = grid[r][c + 1] = True
            total += go(pos + 1)
            grid[r][c] = grid[r][c + 1] = False
        if r + 1 < rows:
            grid[r][c] = grid[r + 1][c] = True
            total += go(pos + 1)
            grid[r][c] = grid[r + 1][c] = False
        return total
    return go(0)
for r in range(1, 5):
    for c in range(1, 6):
        assert domino_tilings(r, c) == brute(r, c)`
      }
    ],

    how: {
      698: `I restate it: put every number into exactly one of k groups so all groups have the same sum. Brute force assigns each number to one of k groups, up to kⁿ ways, and pruned backtracking is fast in practice but gives no guarantee. First, if the total is not divisible by k, stop; otherwise each group must reach target = total / k. Now build the groups one after another. After I have placed the numbers in some set, how full is the group I am currently filling? Exactly sum(set) % target, because every earlier group is full. So all I need to remember about the past is which numbers are placed, and that is a mask. Let dp[mask] be that current fill, or -1 if the set cannot be arranged into complete groups plus one partial group. Start with dp[0] = 0. From a reachable mask, add an unplaced number i if dp[mask] + nums[i] <= target; the new fill is (dp[mask] + nums[i]) % target, wrapping to 0 when a group closes exactly. Masks grow, so I iterate upward. The answer is whether dp[full] == 0. Trace [4,3,2,3,5,2,1], k = 4, target 5: placing 5 gives fill 0, then 4 and 1 gives 4, then 0 again, and so on until every number is placed with fill 0. Edge cases: k = 1 is always true; a number larger than the target makes it impossible. Cost: O(2ⁿ · n) time, O(2ⁿ) space.`,
      847: `I restate it: in an undirected connected graph I may start at any node, revisit nodes and reuse edges, and I want the shortest walk that touches every node. Brute force tries every order of the nodes and adds shortest distances between consecutive ones, n!. A plain BFS over single nodes does not work, because the same node means different things depending on what I have already seen. So the state is (current node, set of nodes visited) with the set as a bitmask: n · 2ⁿ states. Every edge costs 1, and the walk can revisit nodes (which may leave the mask unchanged), so this is an unweighted shortest path over the state graph, which is BFS. Masks alone do not give an increasing order, which is why I do not use the filling-by-mask loop here. Because I may start anywhere, I begin with all states (i, 1 << i) at distance 0 in the queue (multi-source BFS). A move to neighbour nb goes to (nb, mask | (1 << nb)) with distance + 1, and I skip states already seen. The first time a state with the full mask appears, its distance is the answer. Trace the star graph with centre 0 and three leaves: starting at leaf 1: 1, 0, 2, 0, 3 is 4 edges. Edge cases: one node returns 0 immediately. Cost: O(2ⁿ · n · degree) time, O(2ⁿ · n) space.`,
      526: `I restate it: place the numbers 1 to n into positions 1 to n, each number once, so that at every position i the number there divides i or is divisible by i; count the valid placements. Brute force generates all n! permutations and tests each, over a trillion for n = 15. Backtracking that rejects bad prefixes early helps, but explores every good partial arrangement separately. The observation is that when I am choosing the number for position p, the only thing that matters about the earlier choices is **which numbers are already used**, not how they were arranged. So dp[mask] is the number of ways to fill positions 1 to popcount(mask) using exactly the numbers in mask. The next position is p = popcount(mask) + 1. For each number j+1 not in the mask, if (j+1) % p == 0 or p % (j+1) == 0, add dp[mask] into dp[mask | (1 << j)]. Start with dp[0] = 1 (one way to fill nothing), iterate masks upward since each addition grows the mask, and the answer is dp[full]. Trace n = 3: position 1 accepts anything; so masks of size one all get 1; position 2 accepts numbers 1 and 2 only (3 neither divides nor is divided by 2); and so on, ending with 3 total. Edge cases: n = 1 gives 1. It is the assignment DP with counting. Cost: O(2ⁿ · n) time, O(2ⁿ) space.`,
      464: `I restate it: two players alternately pick unused integers from 1 to m, adding to a running total; whoever reaches at least the target on their own pick wins; with perfect play, does the first player win? First the easy cases: if the target is at most 0 the first player already wins; if 1 + 2 + ... + m is below the target, nobody can ever win, so the answer is false. Brute force explores every pick sequence, up to m!. The key observation is that the set of numbers already picked determines the running total (it is the sum of the set) and therefore what is left to reach, so the whole game state is the mask of used numbers. Let win(mask) mean the player to move, with these numbers used, can force a win. They win if some unused x either reaches the remaining total right now (x >= remaining) or leaves the opponent in a state where win(mask | bit(x)) is false. This is minimax, and I memoize on the mask: at most 2^m states, each trying m moves. I use the top-down form because many masks are never reached. Trace m = 4, target 6: picking 3 or 4 first loses, because the opponent finishes at once; picking 1 leaves 5, which no single pick of at most 4 reaches, and whatever they take (2, 3 or 4) leaves at most 3, which an unused number can finish. So a winning first pick exists and the answer is true. Edge cases: m = 1, target 1 is true. Cost: O(2^m · m) time, O(2^m) space.`
    }
  };
})();
