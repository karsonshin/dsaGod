(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['greedy'] = {
    primer: {
      kind: 'technique',
      what: `A **greedy algorithm** builds an answer by making the best-looking choice at each step and never going back to change it. It is like packing a suitcase by always grabbing the most useful item left. It is only correct when you can argue that a locally best pick never ruins the best overall answer.`,
      does: `It solves optimisation questions (fewest, most, earliest, smallest total) where one choice at a time is enough: scheduling, jump and reach questions, matching, covering. Cost is usually O(n) for one pass, or O(n log n) when a sort or heap comes first.`,
      impl: `Two shapes. **Sort then scan**: sort by the key that makes the greedy choice (\`sorted(items, key=...)\`), then walk once. **Running state**: one pass keeping a few variables such as \`far\`, a tank, or a \`lo\`/\`hi\` range. When the best choice changes as you go, keep candidates in a heap (\`heapq\`). Correctness comes from an exchange argument, not from the code.`,
      possibilities: `Jump Game and Jump Game II, Gas Station, interval scheduling and covering, Partition Labels, assigning cookies or boats, hands of consecutive cards, valid parentheses with wildcards, lemonade change, merging triplets, and "fewest refuels" with a heap.`
    },

    think: [
      {
        q: `Coins are 1, 3 and 4 and the amount is 6. What does "always take the biggest coin that fits" produce, and what is the best answer?`,
        a: `Greedy takes 4, then 1, then 1: three coins. The best is 3 + 3: two coins. The biggest coin blocked the best answer, so the greedy-choice property is false for this coin set. The aha: a greedy rule that looks natural must be tested on a small counterexample before you trust it; when one early choice changes which later choices are cheapest, you need DP.`
      },
      {
        q: `Meetings: [1,10], [2,3], [4,5], [6,7]. You attend as many as possible in one room. Which sort key finds 3 meetings, and what does sorting by start give?`,
        a: `Sort by end time: take [2,3], [4,5], [6,7], three meetings. Sorting by start takes [1,10] first, and it blocks everything, so you attend only 1. The aha: the right key is the one that leaves the most room afterwards. Ending early frees the room soonest, and swapping the earliest-ending meeting into any best schedule never creates a conflict.`
      },
      {
        q: `Jump array [2, 0, 0, 1, 4]. Trace "far" as you scan left to right. At which index does the scan get stuck, and why does it not matter which jump you chose earlier?`,
        a: `far starts at 0. i=0: far = max(0, 0+2) = 2. i=1: 1 <= 2 fine, far = max(2, 1) = 2. i=2: fine, far = 2. i=3: 3 > far = 2, stuck. You never needed to pick which cell to jump from: because every jump can be shortened, every index up to far is reachable, so one number captures all possible choices.`
      },
      {
        q: `Gas stations on a circle: the net gain per station (gas minus cost) is [-2, -2, -2, 3, 3]. Running the tank from station 0, what happens, and where does the scan restart?`,
        a: `Starting at 0 the tank goes to -2: negative at once, so station 0 is not the start. The candidate moves to 1 (-2 again), then 2 (-2 again), then 3. From 3 the tank goes 3, 6, and wrapping around through stations 0, 1, 2 it goes 4, 2, 0: never negative. The total of the nets is 0 (not below 0), so station 3 works. The aha: one failure at station j rules out every start between the old candidate and j in a single move.`
      },
      {
        q: `String "(*))" with the wildcard * able to be "(", ")" or nothing. What are lo and hi after each character, and is the string valid?`,
        a: `Start lo=0, hi=0. "(": lo=1, hi=1. "*": lo=0, hi=2. ")": lo=-1 clamped to 0, hi=1. ")": lo=-1 clamped to 0, hi=0. hi never went negative and lo is 0 at the end, so it is valid (read * as "("). The aha: instead of guessing what * means, track every possibility at once as a range of how many opens could be unmatched.`
      },
      {
        q: `Your greedy passes all three sample inputs. Name two things you should still do before trusting it in an interview.`,
        a: `First, try a tiny hand-built counterexample designed to break it (3 to 5 elements, with ties and extremes). Second, say the exchange argument out loud: "take any best answer that differs from mine at the first step; swapping my choice in cannot make it worse because ...". If you cannot finish that sentence, you probably need a recurrence (DP) instead.`
      }
    ],

    breakdown: [
      {
        title: `1. What "greedy" means and when it is allowed`,
        body: `You have a series of choices and want the best final result. A greedy algorithm picks the choice that looks best right now, commits, and moves on. That is only safe when two things hold. **Greedy-choice property**: some best overall answer contains your pick. **Optimal substructure**: after the pick, what remains is a smaller copy of the same problem. If both hold, repeating the pick builds a best answer. If not (coins 1, 3, 4 for amount 6), greedy fails. In an interview you will be judged on saying *why* it is safe, not on the three lines of code.`
      },
      {
        title: `2. The exchange argument, step by step`,
        body: `Meetings [1,4], [3,5], [4,6]. Rule: take the one that ends earliest. Claim: some best schedule starts with [1,4]. Proof: take any best schedule. If it already starts with [1,4], done. Otherwise its first meeting, say [3,5], ends no earlier than 4. Replace it with [1,4]. Everything after [3,5] started at 5 or later, so it starts after 4 too, and nothing conflicts. The schedule is no worse and now starts with our pick. Repeat for the next pick and the schedule becomes identical to what greedy builds. That "swap and show it is no worse" is the whole proof pattern.`
      },
      {
        title: `3. Shape one: sort, then scan`,
        body: `Often the sort order *is* the greedy choice. Meetings sort by end time. Cookies and children sort both lists so the smallest cookie that satisfies the least greedy child is used first (never waste a big cookie on a small need). Hand of Straights sorts the distinct card values and always starts a group at the smallest card left, since it has no smaller partner. After the sort one pass makes all decisions. Total cost O(n log n), dominated by the sort. Decide the sort key before you write anything, and check it against one counterexample.`,
        code: { py: `def max_meetings(meetings):
    count, last_end = 0, float('-inf')
    for start, end in sorted(meetings, key=lambda m: m[1]):   # earliest end first
        if start >= last_end:        # fits after the last one we took
            count += 1
            last_end = end
    return count` }
      },
      {
        title: `4. Shape two: running state (farthest reach)`,
        body: `Array [2, 3, 1, 1, 4]: from index i you can jump up to nums[i] steps. Can you reach the end? Keep \`far\`, the farthest index reachable so far. i=0: far = 2. i=1: 1 <= far, far = max(2, 4) = 4. Now far >= last index 4, so yes. If you ever stand on an index bigger than far, no earlier cell reaches it and you are stuck. You never track *which* jump you used. That works because every jump can be shortened, so everything up to far is reachable: the reachable set is a prefix and one integer describes it.`
      },
      {
        title: `5. Counting jumps: BFS levels with two integers`,
        body: `Minimum jumps on [2, 3, 1, 1, 4]. Think in levels. Level 0 is index 0. Level 1 is every index reachable in one jump: 1 to 2. Level 2 is everything reachable from level 1: up to index 4, the end. So the answer is 2. Without a queue: keep \`end\` (last index of the current level) and \`far\` (farthest anything in it reaches). When the scan index hits \`end\`, count a jump and set \`end = far\`. Stop the loop at n - 2: standing on the last index needs no further jump. This is breadth-first search with O(1) memory.`
      },
      {
        title: `6. Resets and "one failure rules out many": Gas Station`,
        body: `Net fuel per stop is gas minus cost, for example [-2, -2, -2, 3, 3]. Keep \`total\` (all stops) and \`tank\` (since the candidate start). If \`tank\` goes negative at stop i, then every start between the candidate and i would also fail, because each of them arrived at their position with at least an empty tank, and you failed with at least as much help. So the new candidate is i + 1 and the tank resets. At the end, a start exists only if \`total >= 0\`. One pass replaces trying every start (O(n²)). The pattern "a failure rules out a whole block of candidates" shows up elsewhere.`
      },
      {
        title: `7. Tracking possibilities as a range`,
        body: `Sometimes the greedy choice is "do not choose yet". In a bracket string where * can be "(", ")" or empty, keep \`lo\` and \`hi\`: the smallest and largest count of unmatched "(" the prefix could leave. "(" adds 1 to both, ")" subtracts 1 from both, * subtracts 1 from lo and adds 1 to hi. If hi goes below 0, there are too many ")" under every reading: false. Clamp lo at 0 (you can always read a * as empty). Valid if lo is 0 at the end. Every possible reading is still covered by [lo, hi], and nothing has to be undone.`
      },
      {
        title: `8. Greedy with a heap, edge cases, and how to spot it`,
        body: `If the best choice changes as the scan moves (refuel at the largest station passed, merge the two smallest files), keep candidates in a heap: push what became available, pop the best. Cost O(n log n). Edge cases: empty input, a single element, ties, and the end condition (stop at n - 2 for jumps; check total for gas). Spot greedy by: "fewest/most/earliest", something sortable, a single left-to-right pass with a running best, and no need to undo. Then test a tiny counterexample. If greedy and brute force disagree anywhere small, switch to DP.`
      }
    ],

    drills: [
      {
        title: `Tape the potholes`,
        q: `Potholes lie at integer positions along a road. One strip of tape covers L consecutive positions (positions p, p+1, ..., p+L-1). Return the fewest strips needed to cover every pothole. Strips may overlap and may extend past the potholes.\n\nExample: positions \`[1, 2, 8, 9, 4]\`, L = 3 returns \`3\` (cover 1-3, 4-6, 8-10).`,
        hint: `Sort the positions. Look at the leftmost uncovered pothole. Where is the best place to start a strip?`,
        how: `I restate it: cover all the given positions with as few strips of length L as possible. Brute force tries every set of strip start positions, which grows exponentially. The unlocking observation: look at the leftmost pothole that is not yet covered. Some strip has to cover it, and that strip's reach to the right is largest when the strip *starts exactly at that pothole*, because any strip that starts earlier wastes its left end on empty road, and any strip starting later would miss the pothole. So placing the strip at the leftmost uncovered pothole is the greedy choice, and an exchange argument says shifting any other strip covering that pothole right until it starts there never uncovers anything. After that choice, what remains is the same problem on the potholes beyond the strip. Sort the positions, then scan with \`covered_to\`, the last position covered so far (start at negative infinity). Trace \`[1, 2, 4, 8, 9]\`, L = 3: pothole 1 is uncovered, strip covers 1 to 3, count 1. 2 is covered. 4 is uncovered, strip covers 4 to 6, count 2. 8 is uncovered, strip covers 8 to 10, count 3. 9 is covered. Answer 3. Edge cases: no potholes gives 0; duplicates are harmless; L = 1 gives the number of distinct positions. Cost: O(n log n) for the sort, O(1) extra space.`,
        code: { py: `def fewest_strips(positions, L):
    strips = 0
    covered_to = float('-inf')              # last position covered so far
    for p in sorted(positions):
        if p > covered_to:                  # leftmost uncovered pothole: start a strip right here
            strips += 1
            covered_to = p + L - 1
    return strips` },
        explain: `Whatever strip covers the leftmost uncovered pothole can be slid right until it starts at that pothole without uncovering anything (every pothole it dropped on the left is already covered), so starting there is optimal. Repeating on the rest is valid because the remainder is the same kind of problem. Sort O(n log n), scan O(n), space O(1) besides the sort.`,
        check: `assert fewest_strips([1, 2, 8, 9, 4], 3) == 3
assert fewest_strips([], 5) == 0
assert fewest_strips([7, 7, 7], 1) == 1
assert fewest_strips([1, 2, 3], 1) == 3
assert fewest_strips([1, 100], 50) == 2
assert fewest_strips([5], 1) == 1
import random
from functools import lru_cache
def brute(ps, L):
    ps = tuple(sorted(set(ps)))
    @lru_cache(None)
    def f(i):
        if i == len(ps):
            return 0
        best = 99
        for s in range(ps[i] - L + 1, ps[i] + 1):
            j = i
            while j < len(ps) and ps[j] <= s + L - 1:
                j += 1
            best = min(best, 1 + f(j))
        return best
    return f(0)
for _ in range(300):
    ps = [random.randint(0, 14) for _ in range(random.randint(0, 8))]
    L = random.randint(1, 5)
    assert fewest_strips(ps, L) == brute(ps, L)`
      },
      {
        title: `Two-seat rowboats`,
        q: `Each boat carries at most two people and at most \`cap\` total weight. Given the weights of everyone (each person weighs at most cap), return the fewest boats needed.\n\nExample: weights \`[3, 5, 3, 4]\`, cap = 5 returns \`4\`. Weights \`[1, 2, 2, 3]\`, cap = 3 returns \`3\` (1+2, 2, 3).`,
        hint: `Sort. Try to pair the heaviest person with the lightest. If even the lightest cannot fit with them, what must happen to the heaviest?`,
        how: `I restate it: put everyone in boats of two seats and a weight limit, using as few boats as possible. Brute force tries every grouping into pairs and singles, exponential. The observation: consider the heaviest person. If anyone can share a boat with them, the lightest person can (lighter means more likely to fit). So check the lightest: if heaviest + lightest fits, pair them; that is at least as good as any other pairing for the heaviest person, since any partner could be swapped for the lightest without breaking the weight limit. If even the lightest cannot fit with the heaviest, then the heaviest must ride alone. Either way the heaviest leaves, and the rest is the same problem. This is a two-pointer pattern on a sorted list: \`lo\` at the lightest, \`hi\` at the heaviest. Trace \`[1, 2, 2, 3]\`, cap 3: heaviest 3 with lightest 1 is 4, too much, so 3 rides alone (boat 1, hi moves in). Now heaviest 2 with lightest 1 is 3, fits (boat 2, both leave). Remaining [2], alone (boat 3). Answer 3. Edge cases: empty list gives 0; one person gives 1; everyone heavier than half the cap gives n boats. Cost: O(n log n) for the sort, O(n) for the scan.`,
        code: { py: `def fewest_boats(weights, cap):
    w = sorted(weights)
    lo, hi, boats = 0, len(w) - 1, 0
    while lo <= hi:
        if lo < hi and w[lo] + w[hi] <= cap:
            lo += 1                      # the lightest shares the boat
        hi -= 1                          # the heaviest always leaves in this boat
        boats += 1
    return boats` },
        explain: `The heaviest person leaves in every round. If the lightest fits with them, no other partner is better (a heavier partner could be swapped for the lightest). If the lightest does not fit, nobody does, so they go alone. Each round removes one or two people. Sort O(n log n), loop O(n), space O(n) for the sorted copy.`,
        check: `assert fewest_boats([3, 5, 3, 4], 5) == 4
assert fewest_boats([1, 2, 2, 3], 3) == 3
assert fewest_boats([], 5) == 0
assert fewest_boats([4], 4) == 1
assert fewest_boats([1, 1, 1, 1], 2) == 2
assert fewest_boats([5, 5, 5], 5) == 3
import random
from functools import lru_cache
def brute(ws, cap):
    n = len(ws)
    @lru_cache(None)
    def f(mask):
        if mask == (1 << n) - 1:
            return 0
        i = 0
        while mask >> i & 1:
            i += 1
        best = 1 + f(mask | 1 << i)
        for j in range(i + 1, n):
            if not mask >> j & 1 and ws[i] + ws[j] <= cap:
                best = min(best, 1 + f(mask | 1 << i | 1 << j))
        return best
    return f(0)
for _ in range(300):
    cap = random.randint(3, 9)
    ws = [random.randint(1, cap) for _ in range(random.randint(0, 8))]
    assert fewest_boats(ws, cap) == brute(ws, cap)`
      },
      {
        title: `Deadline jobs`,
        q: `Each job takes exactly one time unit and has a deadline (the latest time slot, counting slots from 1, in which it may run) and a profit. Only one job runs per slot. Return the largest total profit you can earn.\n\nExample: jobs \`[(2, 100), (1, 19), (2, 27), (1, 25), (3, 15)]\` returns \`142\` (run 27 and 100 in slots 1 and 2, then 15 in slot 3; the deadline-1 jobs do not fit alongside them).`,
        hint: `Process jobs by deadline. Keep a min-heap of the profits you have chosen. If you chose more jobs than the deadline allows, drop the smallest profit.`,
        how: `I restate it: unit-length jobs, each with a last allowed slot and a profit; choose a subset that can all be scheduled and maximise profit. Brute force tries every subset and checks feasibility, exponential. A subset is feasible exactly when, after sorting its jobs by deadline, the i-th job has deadline at least i (there are enough slots by each deadline). That gives a way to think: sweep jobs in order of deadline, and keep the set chosen so far. Add the current job. If the set now has more jobs than the current deadline allows, the set is infeasible, and the cheapest thing to throw away is the job with the smallest profit among the chosen ones (it might be the one just added). A min-heap of profits makes that removal O(log n). This is greedy because dropping the smallest profit never hurts: every other choice leaves a worse set. Trace jobs sorted by deadline: (1,19), (1,25), (2,100), (2,27), (3,15). Add 19 (size 1, deadline 1 ok). Add 25: size 2 > deadline 1, drop 19. Add 100: size 2, deadline 2 ok. Add 27: size 3 > 2, drop 25. Add 15: size 3, deadline 3 ok. Heap holds 27, 100, 15: total 142. Edge cases: no jobs gives 0; deadline 0 jobs can never run (they get dropped immediately). Cost: O(n log n).`,
        code: { py: `import heapq

def max_profit(jobs):
    chosen = []                                   # min-heap of profits we are keeping
    for deadline, profit in sorted(jobs):         # by deadline
        heapq.heappush(chosen, profit)
        if len(chosen) > deadline:                # more jobs than slots up to this deadline
            heapq.heappop(chosen)                 # drop the least profitable one
    return sum(chosen)` },
        explain: `A set of unit jobs is schedulable iff, sorted by deadline, the i-th has deadline >= i. Scanning by deadline keeps the invariant "chosen set is feasible and has maximum profit among feasible sets of the jobs seen"; when adding a job breaks feasibility, removing the smallest profit restores it with the largest remaining total. O(n log n) time, O(n) space.`,
        check: `assert max_profit([(2, 100), (1, 19), (2, 27), (1, 25), (3, 15)]) == 142
assert max_profit([]) == 0
assert max_profit([(0, 50)]) == 0
assert max_profit([(1, 5), (1, 9)]) == 9
assert max_profit([(3, 1), (3, 2), (3, 3), (3, 4)]) == 9
import random, itertools
def feasible(sub):
    ds = sorted(d for d, p in sub)
    return all(d >= i + 1 for i, d in enumerate(ds))
def brute(jobs):
    best = 0
    for r in range(len(jobs) + 1):
        for sub in itertools.combinations(jobs, r):
            if feasible(sub):
                best = max(best, sum(p for d, p in sub))
    return best
for _ in range(200):
    jobs = [(random.randint(0, 4), random.randint(1, 20)) for _ in range(random.randint(0, 7))]
    assert max_profit(jobs) == brute(jobs)`
      },
      {
        title: `Fewest charging stops`,
        q: `A car starts at position 0 with \`fuel\` units and uses 1 unit per distance unit. Charging stations are given as \`[position, charge]\`. Stopping at a station lets you take all its charge (the tank has no limit). Return the fewest stops needed to reach \`target\`, or -1 if it is impossible.\n\nExample: target = 100, fuel = 10, stations \`[[10,60],[20,30],[30,30],[60,40]]\` returns \`2\`.`,
        hint: `Do not decide at a station. Remember the charges of the stations you passed in a max-heap, and only pull from it when you run dry.`,
        how: `I restate it: drive as far as possible, refuelling at stations along the way, using the fewest stops. Brute force tries every subset of stations, exponential. A DP over (station, number of stops) works in O(n²), but there is a sharper way to see it. The key observation: I do not have to decide at a station whether to stop there. I can drive past it and, later, if I run out of fuel, *pretend I had stopped* at the passed station with the largest charge. Stopping retroactively at the biggest available charge is always the best way to go further with one more stop. So: keep a max-heap of charges of stations I have passed. Walk the stations in order; before reaching each position, while my fuel cannot reach it, pop the largest charge from the heap (count a stop and add the charge). If the heap is empty and I still cannot reach, return -1. Then push this station's charge. Treat the target as a final station with zero charge. Trace the example: fuel 10. Station at 10: reach, push 60. Station at 20: I have 10 fuel so reaching 20 needs 20: pop 60, stops 1, fuel 70; push 30. Stations at 30, 60: reachable, push 30 and 40. Target 100 needs 100, fuel 70: pop 40, stops 2, fuel 110. Done: 2. Edge cases: target within the starting fuel gives 0; unreachable gap gives -1. Cost: O(n log n).`,
        code: { py: `import heapq

def min_stops(target, fuel, stations):
    passed = []                                    # max-heap (negated) of charges we drove past
    stops = 0
    for pos, charge in sorted(stations) + [(target, 0)]:
        while fuel < pos:                          # cannot reach this point: stop retroactively
            if not passed:
                return -1
            fuel += -heapq.heappop(passed)
            stops += 1
        heapq.heappush(passed, -charge)
    return stops` },
        explain: `If we are going to need k stops to reach a point, the best k stops are the k largest charges among the stations passed, and pulling the largest only when fuel runs out realises exactly that. Each station is pushed once and popped at most once: O(n log n) time, O(n) space. Stations beyond the target are never needed because the target is processed as the last point.`,
        check: `assert min_stops(100, 10, [[10,60],[20,30],[30,30],[60,40]]) == 2
assert min_stops(1, 1, []) == 0
assert min_stops(100, 1, []) == -1
assert min_stops(100, 50, [[25, 50]]) == 1
assert min_stops(100, 10, [[5, 5], [30, 100]]) == -1
import random
def brute(target, fuel, stations):
    st = sorted(stations)
    dp = [fuel] + [-1] * len(st)
    for i, (pos, ch) in enumerate(st):
        for j in range(i, -1, -1):
            if dp[j] >= pos:
                dp[j + 1] = max(dp[j + 1], dp[j] + ch)
    for j, reach in enumerate(dp):
        if reach >= target:
            return j
    return -1
for _ in range(300):
    target = random.randint(1, 40)
    fuel = random.randint(1, 15)
    stations = [[random.randint(1, target - 1) if target > 1 else 1, random.randint(1, 20)] for _ in range(random.randint(0, 6))]
    stations = [s for s in stations if s[0] < target]
    stations = list({s[0]: s for s in stations}.values())
    assert min_stops(target, fuel, stations) == brute(target, fuel, stations)`
      }
    ],

    how: {
      55: `I restate it: each number is the longest jump I can take from that index, and I want to know whether I can land on the last index. Brute force is recursion trying every jump length from every cell, exponential, or a table of "can I reach i" in O(n²). The bottleneck is that I keep asking which cell to jump from. The observation: I do not care. Because any jump can be shortened, if I can reach index j then I can reach every index before j that is also reachable, so the reachable set is always an unbroken prefix 0..far. One integer describes it. So I walk left to right with \`far\`, the farthest index any visited cell can reach. At index i, if i > far, nothing could have landed here and nothing beyond can be reached either, so return false. Otherwise set far = max(far, i + nums[i]). If the loop ends, I never got stuck, so the end is reachable. Trace [3,2,1,0,4]: far goes 3, 3, 3, 3; at i=4, 4 > 3, stuck: false. Trace [2,3,1,1,4]: far 2, 4, ... never stuck: true. Edge cases: a single element is true; a leading 0 with more elements is false. Cost: O(n) time, O(1) space.`,
      45: `I restate it: same jumping array, but the last index is guaranteed reachable and I want the fewest jumps. Brute force is a DP of fewest jumps to each index, trying every earlier cell: O(n²), or an equivalent BFS. The observation: jumps can be shortened, so the indices reachable in exactly k jumps form an unbroken range. That is BFS by levels where each level is a range. I do not need a queue. Level 0 is index 0. If the current level ends at index \`end\`, the next level ends at the farthest any cell in the current level can reach, which I track as \`far\` while scanning. When the scan index reaches \`end\`, the current level is used up and I need one more jump: count it and set end = far. Trace [2,3,1,1,4]: i=0: far = 2, i == end (0), jumps 1, end 2. i=1: far = 4. i=2: far = 4, i == end, jumps 2, end 4. Done: 2. I stop the loop at n - 2 because standing on the last index needs no more jumps, and counting one there would overshoot. Edge cases: one element gives 0. Cost: O(n) time, O(1) space.`,
      134: `I restate it: stations in a circle with gas[i] to collect and cost[i] to reach the next station; find a start from which I can complete the lap with an empty initial tank, or -1. Brute force simulates a lap from every start: O(n²). Two facts make it linear. First, if total gas is less than total cost, no start can work; if it is at least, a start exists (the answer is guaranteed unique in the problem). Second, suppose I start at s and my tank first goes negative when travelling from station j to j + 1. Then no station between s and j can be the start either: each of them reached station j with a tank of at least 0 relative to my run (I did not fail before j), so starting there with an empty tank gives them no more fuel than I had, and they would fail at the same spot. So the next candidate is j + 1. I keep \`total\`, \`tank\` and \`start\`; when tank < 0 set start = i + 1 and tank = 0. Trace gas [1,2,3,4,5], cost [3,4,5,1,2]: nets -2,-2,-2,3,3. Tank fails at 0,1,2, so start becomes 3; then it stays non-negative; total 2 >= 0, answer 3. Edge case: total negative returns -1. Cost: O(n) time, O(1) space.`,
      846: `I restate it: split the cards into groups of groupSize consecutive values, using every card exactly once. If the number of cards is not a multiple of groupSize, it is impossible immediately. Brute force tries to form groups in every possible way, which explodes. The observation: look at the smallest card still available. It cannot be in the middle or end of a group, because that would need a smaller card, and there is none. So it must be the start of a group, forced. And if there are c copies of it, then c groups must start there. That is a greedy forced move, no choice at all. I count the cards in a dictionary, then visit the distinct values in increasing order. For value x with count c > 0, every value from x to x + groupSize - 1 needs at least c copies; subtract c from each, and if any is short, return false. Trace [1,2,3,6,2,3,4,7,8], size 3: counts 1:1, 2:2, 3:2, 4:1, 6:1, 7:1, 8:1. At 1 (c=1): take 1,2,3. Now 2:1, 3:1. At 2 (c=1): take 2,3,4. At 6: take 6,7,8. All good: true. Edge cases: group size 1 is always true; a missing value in the middle is false. Cost: O(n log n) for sorting the distinct values, O(n) space.`,
      1899: `I restate it: merging two triplets takes the maximum in each position. I can merge any triplets in any order any number of times, and want to know whether I can produce exactly the target. Brute force tries every subset of triplets, exponential. The key fact: a max never decreases a value. So if a triplet has any position larger than the target's value there, using it would overshoot permanently, and it can never be part of a solution. Throw it away. Among the triplets that remain, every position of every one of them is at most the target, so merging them all gives something that is at most the target everywhere. To hit the target exactly I only need, for each of the three positions, at least one remaining triplet that equals the target in that position. Those need not be the same triplet. So I keep three booleans, scan the triplets, skip the unsafe ones, and set hit[k] whenever a safe triplet matches the target in position k. The answer is whether all three are true. Trace triplets [[2,5,3],[1,8,4],[1,7,5]], target [2,7,5]: the second has 8 > 7, discard. The first matches position 0 (2), the third matches position 1 (7) and position 2 (5). All hit: true. Edge cases: no safe triplets means false. Cost: O(n) time, O(1) space.`,
      763: `I restate it: cut the string into as many consecutive pieces as possible so that no letter appears in more than one piece; return the piece lengths. Brute force checks every possible cut with sets on both sides, O(n²) or worse. The observation: if a piece contains the letter c, the piece must stretch at least to the last occurrence of c. So record the last index of every letter first. Then scan with \`end\`, the farthest last-occurrence among all letters seen in the current piece. Each new character may push end further right. When the scan index i reaches end, every letter in this piece has finished inside it, so I can close the piece there. Closing as early as possible is the greedy choice, because it leaves the longest remaining string, and a longer remainder can never yield fewer pieces. Trace "ababcbacadefegdehijhklij": last of a is 8, b is 5, c is 7. Starting at 0: end becomes 8 from the 'a'. At i = 8, i == end: piece length 9. Next piece begins at 9 with 'd' (last 14), 'e' (last 15): closes at 15, length 7. The rest gives 8. Answer [9,7,8]. Edge cases: one letter gives [1]; all distinct gives n ones. Cost: O(n) time, O(1) space (26 letters).`,
      678: `I restate it: a string of "(", ")" and "*", where * can be "(", ")" or nothing; is there a way to read it as balanced? Brute force tries all three meanings for every star: 3 to the power of the number of stars. A smarter version: instead of choosing, track every possibility. For each prefix, the number of unmatched "(" could be anything in a range, and I only need the smallest and largest values, \`lo\` and \`hi\`. "(" raises both by 1. ")" lowers both by 1. A star can lower (as ")"), raise (as "("), or stay (as nothing), so lo goes down by 1 and hi goes up by 1. If hi ever goes negative, even reading every star as "(" leaves too many ")", so return false. The count of unmatched opens can never be negative in a real reading, so I clamp lo at 0 (a star can always be read as empty instead). At the end the string is valid exactly when 0 is a possible count: lo == 0. Trace "(*))": (lo,hi) = (1,1), (0,2), (0,1), (0,0): valid. Trace ")(": hi goes to -1 immediately: false. Edge cases: a lone "*" is true; "(((*" ends with lo = 2, false. Cost: O(n) time, O(1) space.`,
      860: `I restate it: customers pay with 5, 10 or 20 dollar bills for a 5 dollar lemonade, in order. I start with no money and must give exact change from bills I already collected. Brute force: try every way to give change, but change for 5 and 10 is forced (nothing else works), so only the 20 has a choice. A 20 needs 15 back, which can be one 10 plus one 5, or three 5s. The observation: fives are more useful than tens, because a five can make change for a 10 and for a 20, while a ten helps only with a 20. So when I have the choice, spend the ten and keep the fives. That is the greedy choice, and an exchange argument says if a solution used three fives while a ten and a five were available, swapping to the ten-and-five leaves more fives and cannot make any later customer fail. So I keep two counters, five and ten. On a 5: five += 1. On a 10: need a five, else false; five -= 1, ten += 1. On a 20: if I have a ten and a five, use those; else if five >= 3, use three; else false. Trace [5,5,5,10,20]: fives 3, then 10 uses one five (five 2, ten 1), then 20 uses ten and five: true. Trace [5,5,10,10,20]: after both tens, five 0, ten 2; the 20 has no five: false. Cost: O(n) time, O(1) space.`,
      1005: `I restate it: I must negate exactly k elements of the array (I may negate the same element repeatedly), and want the largest possible sum. Brute force tries all sequences of k choices: too many. The observation: negating a negative number gains the most when the number is the most negative, so flip negatives from smallest upward while flips remain. If I run out of negatives with flips left over, then flipping a number twice cancels, so only the parity of the leftover count matters. If the leftover is even, waste them in pairs and lose nothing. If odd, exactly one flip must end up negating something; the cheapest loss is to negate the element with the smallest absolute value, which costs twice that value from the sum. So: sort, flip negatives in order while k > 0, take the sum, and if k is odd subtract twice the smallest value (taking the minimum after flipping). Trace [2,-3,-1,5,-4], k = 2: sorted [-4,-3,-1,2,5]. Flip -4 and -3: [4,3,-1,2,5], sum 13. k is 0, done. Trace [1,2], k = 3: no negatives, k stays 3 (odd), sum 3, subtract 2 * 1 = 1. Edge cases: k larger than n; zeros make the loss zero. Cost: O(n log n) for the sort.`,
      455: `I restate it: each child needs a cookie of at least their greed value, and each cookie goes to at most one child. Maximise the number of satisfied children. Brute force tries all assignments, factorial. The observation: giving a big cookie to a child with a small need wastes it, and giving a small cookie to a greedy child fails. So match small with small. Sort both lists. Walk the cookies from smallest to largest, with a pointer i at the least greedy child not yet satisfied. If the cookie is at least g[i], give it (i += 1). If it is smaller than g[i], it is too small for every remaining child (they are all at least as greedy), so skip it. Each cookie is used by the smallest need it can satisfy, which an exchange argument shows is never worse. The answer is i, the number of satisfied children. Trace g = [1,2,3], s = [1,1]: cookies sorted [1,1]. Cookie 1 satisfies child 1 (i = 1). Cookie 1 is smaller than greed 2, skipped. Answer 1. Trace g = [1,2], s = [1,2,3]: cookie 1 to child 1, cookie 2 to child 2, answer 2. Edge cases: no cookies or no children gives 0. Cost: O(n log n + m log m), O(1) extra space.`
    }
  };
})();
