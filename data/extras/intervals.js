(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['intervals'] = {
    primer: {
      kind: 'technique',
      what: `An **interval** is a span on a line written \`[start, end]\`: a meeting from 9 to 10, a booking, a range of IDs. Interval problems ask you to combine, insert, count or choose among many such spans. Picture coloured tape strips on a ruler; the trick is to look at them in the right order.`,
      does: `Typical questions: merge overlapping spans, insert one into a tidy list, find the most that overlap at once (rooms needed), keep the most non-clashing spans, or answer which span covers a point. Almost all cost O(n log n), because the sort dominates and the pass after it is O(n).`,
      impl: `Sort first: by **start** to combine, by **end** to choose a maximum set. Then one pass compares each span with the last one kept (\`start <= last_end\` means overlap). For "how many at once", turn each span into +1 and -1 events and sweep, or keep a min-heap (\`heapq\`) of end times. In Python: \`intervals.sort(key=lambda iv: iv[0])\`.`,
      possibilities: `Merge Intervals, Insert Interval, Meeting Rooms I and II, fewest removals so none overlap, fewest arrows to burst balloons, intersection of two schedules, free-time gaps, busiest moment, and "smallest range containing each query" with a heap.`
    },

    think: [
      {
        q: `Ranges [1,10] and [2,3] are merged by taking the new end each time. What does a careless "last end = new end" produce, and what is the fix?`,
        a: `Sorted by start the order is [1,10], [2,3]. They overlap (2 <= 10). Setting the end to the new range's end gives [1,3], which loses the ground from 3 to 10. The fix is the max: end = max(10, 3) = 10. The aha: sorting is by start only, so a later range can finish earlier than the current stretch.`
      },
      {
        q: `Meetings [1,5] and [5,6]. Do they need two rooms? Do the ranges [1,5] and [5,6] merge into [1,6]?`,
        a: `For meetings, one room: a meeting ending at 5 frees the room for one starting at 5. For merging, [1,5] and [5,6] usually become [1,6], because with closed ends a shared point counts as touching. Same two ranges, opposite answers, depending on whether ends are inclusive. The aha: always ask (or state) the boundary rule before coding. In the sweep line it means the end event sorts before the start event at the same time.`
      },
      {
        q: `You want to keep as many non-overlapping ranges as possible among [1,3], [2,4], [3,5]. Sort by start and by end: do they pick the same ones?`,
        a: `By end: [1,3], then [3,5] fits (3 >= 3): keep 2. By start the order is the same here, so this input does not tell them apart. Try [1,10], [2,3], [4,5], [6,7]: by start you take [1,10] and block the rest (1 kept); by end you take [2,3], [4,5], [6,7] (3 kept). The aha: to choose a maximum set, ending early is what leaves room, so sort by end.`
      },
      {
        q: `Why does the min-heap of end times give the number of rooms? Trace [0,30], [5,10], [15,20].`,
        a: `Sort by start. [0,30]: heap empty, push 30 (1 room). [5,10]: smallest end 30 > 5, no room is free, push 10 (2 rooms). [15,20]: smallest end is 10 <= 15, so that room is free; replace it with 20 (still 2 rooms). The heap size is the number of rooms ever needed at once: 2. The heap always shows which room frees up soonest.`
      },
      {
        q: `A sorted, non-overlapping list gets one new range inserted. Why is no sort needed, and what are the three phases?`,
        a: `The list is already in order and disjoint, so the position of every existing range relative to the new one is clear. Phase 1: copy ranges that end before the new range starts. Phase 2: for ranges that start at or before the new end, absorb them into the new range (min of starts, max of ends). Phase 3: copy the rest. The output order is automatically correct, so the whole thing is O(n).`
      },
      {
        q: `You need "how many things are happening at each minute" and all times are between 0 and 1440. What is a way that needs no sort at all?`,
        a: `A difference array: make an array of 1441 zeros, add 1 at each start index and subtract 1 at each end index, then take a running sum. The running sum at minute t is the number of ranges covering t. It costs O(n + 1440). It is the sweep line with the events already in order, but only works well when the coordinate range is small.`
      }
    ],

    breakdown: [
      {
        title: `1. What an interval problem looks like`,
        body: `You get ranges like [1,3], [2,6], [8,10], [15,18] in no particular order. Questions: combine the overlapping ones, check for clashes, count simultaneous ones, keep the most or remove the fewest. Comparing every pair is O(n²) and messy. The first move is almost always the same: **sort**, so that the only range that can interact with the one you are looking at is its neighbour. Before coding, decide the boundary rule: do ranges that touch at one point (like [1,4] and [4,5]) overlap? Say it out loud.`
      },
      {
        title: `2. Merge: sort by start, then one pass`,
        body: `Take [8,10], [1,3], [2,6], [15,18]. Sort by start: [1,3], [2,6], [8,10], [15,18]. Open the answer with [1,3]. Next [2,6]: its start 2 <= current end 3, so overlap: end = max(3, 6) = 6, current is [1,6]. Next [8,10]: 8 > 6, a gap, so push [8,10] as a new stretch. Next [15,18]: 15 > 10, push. Result [[1,6],[8,10],[15,18]]. Why only compare with the *last* kept range? Everything after starts even further right, so if it cannot reach the current stretch, it cannot reach back to earlier ones either.`,
        code: { py: `def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:                  # overlaps the current stretch
            merged[-1][1] = max(merged[-1][1], end) # max: a contained range must not shrink it
        else:
            merged.append([start, end])
    return merged` }
      },
      {
        title: `3. Insert into a sorted list: three phases`,
        body: `List [[1,2],[3,5],[6,7],[8,10],[12,16]], new range [4,8]. Phase 1, ranges ending before 4: [1,2] (2 < 4), copy it. Phase 2, ranges starting at or before 8: [3,5] gives new = [3,8]; [6,7] gives [3,8]; [8,10] starts at 8 <= 8, gives [3,10]. Stop at [12,16] (12 > 10). Write [3,10]. Phase 3: copy [12,16]. Result [[1,2],[3,10],[12,16]]. No sort, one pass, O(n). The phases come out left to right, so the output stays sorted without any extra work. Edge cases: empty list, new range far left or far right of everything, new range inside one existing range.`
      },
      {
        title: `4. Choosing a maximum set: sort by end`,
        body: `Different question: keep as many ranges as possible that do not overlap. Now sort by **end**. Take the first (it ends earliest), then walk on, keeping a range if its start is >= the end of the last one kept. Ranges [1,10], [2,3], [4,5], [6,7]: by end [2,3], [4,5], [6,7], [1,10]; keep the first three, skip [1,10]. Why earliest end? It frees the line soonest, so whatever any best answer does afterwards still fits. "Remove the fewest so none overlap" is the same code: answer = n - kept. Rule of thumb: **start to combine, end to choose**.`
      },
      {
        title: `5. How many at once: the sweep line`,
        body: `Meetings [0,30], [5,10], [15,20]. Make events: (0,+1), (30,-1), (5,+1), (10,-1), (15,+1), (20,-1). Sort by time, and at the same time put the end (-1) before the start (+1): (0,+1), (5,+1), (10,-1), (15,+1), (20,-1), (30,-1). Walk with a running count: 1, 2, 1, 2, 1, 0. The maximum is 2, so two rooms. The tie rule is the boundary rule in disguise: a meeting ending at 5 frees its room for one starting at 5. Cost: 2n events to sort, O(n log n), then O(n).`,
        code: { py: `def min_rooms(intervals):
    events = []
    for s, e in intervals:
        events.append((s, 1))
        events.append((e, -1))
    events.sort()                # at the same time, -1 sorts before +1
    rooms = best = 0
    for t, d in events:
        rooms += d
        best = max(best, rooms)
    return best` }
      },
      {
        title: `6. The same answer with a min-heap`,
        body: `Another view of the same count. Sort by start and keep a min-heap of end times for meetings that currently hold a room. For the next meeting, look at the smallest end. If it is <= the new start, that room is free: remove it (heapreplace pushes the new end). Otherwise every room is busy: push a new end. The heap size at the end is the answer, and the heap also tells you *which* room frees up first, which the sweep line cannot. Both approaches are O(n log n). Pick the sweep for brevity, the heap when you must name rooms or assign work.`
      },
      {
        title: `7. Queries and two sorted lists`,
        body: `Two further shapes. **Two sorted lists** of disjoint ranges: use two pointers. The overlap of the current pair is [max of starts, min of ends], if that start <= that end. Then advance the list whose range ends first (it cannot meet anything else in the other list). O(n + m). **Queries against ranges**: to find the smallest range containing each query value, sort the queries, sweep ranges by start, push started ranges into a min-heap keyed by size, and pop those whose end is before the query. Because queries are sorted, a range that has expired once is expired for every later query.`
      },
      {
        title: `8. Edge cases, cost, and how to spot it`,
        body: `Edge cases: empty input (guard before reading intervals[0]), a single range, identical ranges, ranges that touch, a range fully inside another, negative coordinates. Cost: the sort makes everything O(n log n); only inserting into an already sorted list is O(n). Spot interval problems by the words meeting, booking, schedule, overlap, merge, range, segment, free time. Always ask: sort by start (combine) or by end (choose)? Closed or half-open ends? Then write the one comparison \`start <= last_end\` (or \`<\`) and test it on a touching pair.`
      }
    ],

    drills: [
      {
        title: `Free slots in a day`,
        q: `A calendar covers times from \`day_start\` to \`day_end\`. Bookings are \`[start, end]\` and use the time from start up to but not including end, so a booking ending at 5 and another starting at 5 leave no gap. Return the free gaps, in order, as \`[from, to]\` pairs. Bookings may overlap and may stick out of the day.\n\nExample: bookings \`[[3,5],[1,2],[4,8]]\`, day 0 to 10 returns \`[[0,1],[2,3],[8,10]]\`.`,
        hint: `Sort by start and keep how far the day is covered so far. A gap exists when the next booking starts after that point.`,
        how: `I restate it: given possibly overlapping bookings, list the stretches of the day that nothing occupies. Brute force marks every minute busy in an array and reads off the gaps, which works only when times are small whole numbers and costs O(length of the day). The observation: if I look at the bookings in order of start time, I only need one number, \`covered\`, the furthest time that is occupied so far. For the next booking, if its start is greater than \`covered\`, the stretch between is free, so record it. Then update \`covered\` with the max of itself and the booking's end (not just the end: a booking can sit inside an earlier one). This is the merge pass, recording gaps instead of merged ranges. Because bookings may stick out of the day, I clip each to the day first, and drop empty ones. Trace the example: clip nothing; sorted [1,2], [3,5], [4,8]. covered starts at 0. [1,2]: 1 > 0, gap [0,1]; covered 2. [3,5]: 3 > 2, gap [2,3]; covered 5. [4,8]: 4 <= 5, no gap; covered 8. After the loop, 8 < 10, so gap [8,10]. Edge cases: no bookings gives the whole day; bookings that exactly touch leave no gap; a booking covering the whole day returns an empty list. Cost: O(n log n) time for the sort, O(n) for the output.`,
        code: { py: `def free_slots(bookings, day_start, day_end):
    clipped = []
    for s, e in bookings:
        s, e = max(s, day_start), min(e, day_end)
        if s < e:                              # ignore bookings outside the day
            clipped.append((s, e))
    clipped.sort()
    gaps, covered = [], day_start
    for s, e in clipped:
        if s > covered:                        # nothing occupies covered..s
            gaps.append([covered, s])
        covered = max(covered, e)              # max: a booking inside an earlier one must not shrink it
    if covered < day_end:
        gaps.append([covered, day_end])
    return gaps` },
        explain: `After sorting by start, covered is always the furthest occupied time among bookings seen, so every time between covered and the next start is free, and nothing later can fill it (later bookings start even further right). Half-open ends mean touching bookings use strict comparison s > covered. O(n log n) time, O(n) space.`,
        check: `assert free_slots([[3,5],[1,2],[4,8]], 0, 10) == [[0,1],[2,3],[8,10]]
assert free_slots([], 0, 5) == [[0,5]]
assert free_slots([[0,10]], 0, 10) == []
assert free_slots([[1,3],[3,5]], 0, 5) == [[0,1]]
assert free_slots([[-5,2],[8,20]], 0, 10) == [[2,8]]
assert free_slots([[2,2]], 0, 4) == [[0,4]]
import random
def brute(b, a, z):
    busy = [any(s <= t < e for s, e in b) for t in range(a, z)]
    out, i = [], 0
    while i < len(busy):
        if not busy[i]:
            j = i
            while j < len(busy) and not busy[j]:
                j += 1
            out.append([a + i, a + j])
            i = j
        else:
            i += 1
    return out
for _ in range(300):
    b = []
    for _ in range(random.randint(0, 6)):
        s = random.randint(-2, 12)
        b.append([s, s + random.randint(0, 5)])
    assert free_slots(b, 0, 10) == brute(b, 0, 10)`
      },
      {
        title: `Busiest moment`,
        q: `Visitors are in a museum during \`[arrive, leave]\`, counting from arrive up to but not including leave (so someone leaving at 5 and someone arriving at 5 are never inside together). Return \`[time, count]\`: the earliest time at which the number of visitors inside is largest, and that number. If the list is empty (or all visits are empty), return \`[0, 0]\`.\n\nExample: \`[[1,4],[2,6],[3,5],[7,9]]\` returns \`[3, 3]\`.`,
        hint: `Turn each visit into a +1 at arrive and -1 at leave. Sort so leaves come first at equal times, and update the best only when the running count strictly increases.`,
        how: `I restate it: find the moment with the most people inside, and if several moments tie, the earliest. Brute force tests every possible time and counts the visits covering it, O(range times n), fine only when times are small. The observation: the count of people inside only changes at an arrive or a leave. So I only need to look at those event times. I turn every visit into two events, (arrive, +1) and (leave, -1), sort them, and walk with a running count. At equal times the leave must come first, because a person leaving at 5 is not inside with someone arriving at 5; sorting the tuples (time, delta) does this automatically since -1 sorts before +1. For the earliest peak, I update the answer only when the running count is strictly greater than the best so far. Trace [[1,4],[2,6],[3,5],[7,9]]: events (1,+1), (2,+1), (3,+1), (4,-1), (5,-1), (6,-1), (7,+1), (9,-1). Counts: 1, 2, 3 (new best at time 3), 2, 1, 0, 1, 0. Answer [3, 3]. I drop empty visits (arrive >= leave) first, since they would put a leave before its own arrive and give a false count. Edge cases: nothing in the list gives [0, 0]; two identical visits give count 2 at their start. Cost: O(n log n) for the sort, O(n) space.`,
        code: { py: `def busiest(visits):
    events = []
    for s, e in visits:
        if s < e:                       # skip empty visits
            events.append((s, 1))
            events.append((e, -1))
    events.sort()                       # at equal times a leave (-1) comes before an arrival (+1)
    inside = best = 0
    when = 0
    for t, d in events:
        inside += d
        if inside > best:               # strictly greater: keeps the earliest peak
            best, when = inside, t
    return [when, best]` },
        explain: `The count only changes at event times, so the maximum occurs at one of them. Processing leaves before arrivals at the same time respects the half-open rule, and updating only on a strict increase records the first time the peak value is reached. Sorting 2n events is O(n log n), the sweep is O(n), space O(n).`,
        check: `assert busiest([[1,4],[2,6],[3,5],[7,9]]) == [3, 3]
assert busiest([]) == [0, 0]
assert busiest([[1,5],[5,9]]) == [1, 1]
assert busiest([[2,2]]) == [0, 0]
assert busiest([[4,8],[4,8]]) == [4, 2]
import random
def brute(v):
    best, when = 0, 0
    for t in range(0, 20):
        c = sum(1 for s, e in v if s <= t < e)
        if c > best:
            best, when = c, t
    return [when, best]
for _ in range(300):
    v = []
    for _ in range(random.randint(0, 7)):
        s = random.randint(0, 12)
        v.append([s, s + random.randint(0, 6)])
    assert busiest(v) == brute(v)`
      },
      {
        title: `Visible ranges`,
        q: `Given a list of distinct ranges \`[start, end]\`, count the ranges that are **not completely inside** another range in the list. A range \`a\` is inside \`b\` when \`b.start <= a.start\` and \`a.end <= b.end\`.\n\nExample: \`[[1,4],[3,6],[2,8]]\` returns \`2\` (\`[3,6]\` is inside \`[2,8]\`; \`[1,4]\` and \`[2,8]\` are not inside anything).`,
        hint: `Sort by start ascending and, for equal starts, by end descending. Then you only need the largest end seen so far.`,
        how: `I restate it: count ranges that no other range swallows completely. Brute force compares every pair, O(n²). The observation: if I order ranges by start, then any range that could swallow the current one has an earlier (or equal) start. So the only question is whether some earlier range reaches at least as far right. That is one number: \`max_end\`, the largest end among ranges already seen. For the current range, if its end is at most max_end, it is swallowed; otherwise it is visible and raises max_end. The one trap is equal starts: [2,8] and [2,5] share a start. [2,5] is inside [2,8], so [2,8] must be processed first. Sorting by start ascending and, on ties, end descending guarantees the longer one comes first. Trace [[1,4],[3,6],[2,8]]: sorted [1,4], [2,8], [3,6]. [1,4]: end 4 > max_end (minus infinity), visible, max_end 4. [2,8]: 8 > 4, visible, max_end 8. [3,6]: 6 <= 8, swallowed. Answer 2. Edge cases: empty list gives 0; a single range gives 1; ranges are distinct so none swallows an equal copy. Cost: O(n log n) for the sort, O(1) extra space.`,
        code: { py: `def count_visible(ranges):
    visible, max_end = 0, float('-inf')
    for s, e in sorted(ranges, key=lambda r: (r[0], -r[1])):
        if e > max_end:                 # reaches further right than everything that starts before it
            visible += 1
            max_end = e
    return visible` },
        explain: `With starts ascending and ties broken by longer first, every range that could contain the current one has already been seen. The current range is contained exactly when some earlier end is >= its end, which max_end tracks. O(n log n) time, O(1) extra space.`,
        check: `assert count_visible([[1,4],[3,6],[2,8]]) == 2
assert count_visible([]) == 0
assert count_visible([[5,6]]) == 1
assert count_visible([[2,8],[2,5]]) == 1
assert count_visible([[1,2],[3,4],[5,6]]) == 3
import random
def brute(r):
    n = 0
    for i, (s, e) in enumerate(r):
        if not any(j != i and r[j][0] <= s and e <= r[j][1] for j in range(len(r))):
            n += 1
    return n
for _ in range(300):
    seen = set()
    r = []
    for _ in range(random.randint(0, 8)):
        s = random.randint(0, 8)
        t = (s, s + random.randint(0, 6))
        if t not in seen:
            seen.add(t)
            r.append(list(t))
    assert count_visible(r) == brute(r)`
      },
      {
        title: `Fewest lamps`,
        q: `A path runs from position 0 to position n. At each whole position i from 0 to n there is a lamp with radius \`radii[i]\`, lighting every point from i - radii[i] to i + radii[i]. Return the fewest lamps to switch on so that the **whole** path from 0 to n is lit, or -1 if impossible. Touching lit stretches count as continuous.\n\nExample: n = 5, radii \`[3,4,1,1,0,0]\` returns \`1\` (lamp 1 lights -3 to 5).`,
        hint: `For each starting point, record the farthest end any lamp starting there can reach. Then it is a "minimum jumps" problem.`,
        how: `I restate it: each lamp lights an interval; choose the fewest intervals whose union covers the entire path [0, n]. Brute force tries every subset of lamps, 2 to the power of n + 1, and checks coverage. The observation: this is interval covering, and it is the Jump Game II idea in disguise. For each position, what matters is how far right a lamp can light, given that it must already touch the lit part. Pre-compute \`reach[lo]\`: for each lamp, its lit stretch clipped to the path is [lo, hi] with lo = max(0, i - r) and hi = min(n, i + r), and I record at index lo the largest hi among lamps starting there. Now treat the path as unit segments 0 to n - 1. Scan i from left to right keeping \`far\`, the farthest point any lamp starting at or before i can light, and \`end\`, the point covered by the lamps chosen so far. When i reaches \`end\`, I need one more lamp: if far has not moved beyond i, there is a hole, return -1; otherwise count a lamp and set end = far. The lamp chosen is the one reaching furthest, which an exchange argument shows is best. Trace n = 5, radii [3,4,1,1,0,0]: lamp 1 has lo = 0 and hi = 5, so reach[0] = 5. At i = 0 == end: far = 5, count 1, end = 5, and since end >= n we stop. Answer 1. Edge cases: n = 0 needs 0 lamps; a gap no lamp touches returns -1. Cost: O(n) time and O(n) space.`,
        code: { py: `def fewest_lamps(n, radii):
    if n == 0:
        return 0
    reach = [0] * (n + 1)                          # reach[lo] = farthest hi of a lamp that starts lighting at lo
    for i, r in enumerate(radii):
        lo, hi = max(0, i - r), min(n, i + r)
        reach[lo] = max(reach[lo], hi)
    lamps = end = far = 0
    for i in range(n):                             # unit segments [i, i + 1]
        far = max(far, reach[i])
        if i == end:                               # everything chosen so far is used up
            if far <= i:
                return -1                          # a hole nobody lights
            lamps += 1
            end = far
            if end >= n:
                break
    return lamps` },
        explain: `reach[lo] holds the best lamp starting at lo. The scan is the "minimum jumps" level walk: lamps chosen so far cover up to end; at end we must pick the lamp (among those starting at or before end) that reaches farthest, tracked in far. If far has not passed the current point, nothing covers the next segment. O(n) time, O(n) space.`,
        check: `assert fewest_lamps(5, [3,4,1,1,0,0]) == 1
assert fewest_lamps(3, [0,0,0,0]) == -1
assert fewest_lamps(7, [1,2,1,0,2,1,0,1]) == 3
assert fewest_lamps(0, [5]) == 0
assert fewest_lamps(2, [1,0,1]) == 2
assert fewest_lamps(1, [0,0]) == -1
import random, itertools
def brute(n, radii):
    m = len(radii)
    if n == 0:
        return 0
    for k in range(1, m + 1):
        for combo in itertools.combinations(range(m), k):
            iv = sorted((i - radii[i], i + radii[i]) for i in combo)
            cur = 0
            ok = True
            for a, b in iv:
                if a > cur:
                    ok = False
                    break
                cur = max(cur, b)
            if ok and cur >= n:
                return k
    return -1
for _ in range(300):
    n = random.randint(1, 8)
    radii = [random.randint(0, 3) for _ in range(n + 1)]
    assert fewest_lamps(n, radii) == brute(n, radii)`
      }
    ],

    how: {
      57: `I restate it: I have a sorted list of disjoint ranges plus one new range; I must add it, merging with whatever it overlaps, and keep the list sorted and disjoint. The brute force is to append the new range, sort everything and run the merge pass: O(n log n). That ignores the gift in the statement that the list is already sorted, so the answer should be a single O(n) pass. The observation: relative to the new range, every existing range falls into exactly one of three groups, in order from left to right. Group one ends before the new range starts, so it cannot touch it: copy as is. Group two starts at or before the new range's end (and has not been passed yet), so it overlaps: absorb it by setting the new start to the minimum of starts and the new end to the maximum of ends. Group three starts after the grown range ends: copy as is. I write the answer in that order, so it stays sorted with no sort. Trace [[1,3],[6,9]] with [2,5]: [1,3] ends at 3, which is not before 2, so it is not group one. It starts at 1 <= 5, so absorb: new = [1,5]. [6,9] starts at 6 > 5: group three. Result [[1,5],[6,9]]. Edge cases: empty list returns just the new range; new range inside an existing one leaves it unchanged. Cost: O(n) time, O(n) space for the output.`,
      56: `I restate it: given ranges in any order, combine the ones that overlap (or touch) so that no two output ranges overlap. The brute force repeatedly looks for any overlapping pair and replaces them with their union until nothing changes: O(n²) per sweep and possibly n sweeps. The bottleneck is not knowing which ranges are neighbours. The observation: if I sort by start, any range that overlaps the current stretch must be one of the very next ones, because every later range starts even further right. So a single pass suffices. I open the answer with the first range. For each next range, if its start is at most the end of the last range in the answer, they overlap: set that end to the maximum of the two ends. The max matters because a range can sit entirely inside the current one, like [2,3] inside [1,10], and must not shrink it. Otherwise it is a gap, so I append a new stretch. Trace [[8,10],[1,3],[2,6]]: sorted [1,3],[2,6],[8,10]. [2,6] starts at 2 <= 3, end becomes 6. [8,10] starts at 8 > 6, new stretch. Result [[1,6],[8,10]]. Edge cases: touching ranges merge ([1,4],[4,5] becomes [1,5]); a single range returns itself. Cost: O(n log n) for the sort, O(n) for the pass.`,
      435: `I restate it: remove the fewest ranges so the rest do not overlap; ranges that only share an endpoint are fine. Brute force tries removing subsets of increasing size, exponential. Another way to say the same thing: keep as many ranges as possible that do not overlap, and the answer is n minus that. This is interval scheduling. Which range should I keep first? One that ends earliest, since it leaves the most room for the rest, and an exchange argument backs this: in any best answer, swap the first kept range for the earliest-ending one and nothing after it conflicts. Sorting by start fails on [1,100] against the short ranges inside it; sorting by length fails when a short range straddles two long ones that would both have fit. So: sort by end, keep a range when its start is at least the end of the last one kept, otherwise it clashes with something that finishes no later, so skip it. Trace [[1,2],[2,3],[3,4],[1,3]]: sorted by end [1,2],[2,3],[1,3],[3,4] (ties any order). Keep [1,2], keep [2,3] (2 >= 2), skip [1,3] (1 < 3), keep [3,4]. Kept 3, so remove 4 - 3 = 1. Edge cases: identical ranges (keep one); empty list gives 0. Cost: O(n log n).`,
      252: `I restate it: given meeting time ranges, can one person attend all of them? That means no two overlap. Brute force compares every pair of meetings, O(n²). The observation: after sorting by start time, a clash can only occur between neighbours. If meeting i starts before meeting i - 1 ends, they overlap. And if every neighbouring pair is fine, then no non-neighbouring pair can clash either, because meeting i - 1 ends no later than meeting i starts, and the later meetings start even later. So one pass over the sorted list with a single comparison is enough: return false as soon as intervals[i].start < intervals[i - 1].end. The comparison is strict because a meeting ending at 5 and another starting at 5 do not overlap (the person simply walks from one to the other); that is the boundary rule I would confirm with the interviewer first. Trace [[0,30],[5,10],[15,20]]: sorted by start is the same; 5 < 30 is a clash: false. Trace [[7,10],[2,4]]: sorted [2,4],[7,10]; 7 >= 4, fine: true. Edge cases: empty list or one meeting is true. Cost: O(n log n) for the sort, O(n) for the pass, O(1) extra space.`,
      253: `I restate it: given meetings, find the fewest rooms so that no two overlapping meetings share one. A meeting ending at 5 and one starting at 5 can share a room. Brute force assigns each meeting to the first free room, scanning all rooms: O(n²) in the worst case. The observation: the number of rooms needed is the largest number of meetings running at the same moment. There are two ways to read that off, both O(n log n). The heap way: sort by start, and keep a min-heap of the end times of rooms in use. For each meeting, look at the smallest end. If it is at most the new start, that room is free, so reuse it (replace that end with the new meeting's end). Otherwise everyone is busy and I need a new room, so push. The heap size at the end is the answer. The sweep-line way: turn each meeting into +1 at its start and -1 at its end, sort with ends before starts at the same time, and take the maximum of the running count. Trace [[0,30],[5,10],[15,20]]: push 30; 5 < 30 so push 10; 15 >= 10 so replace 10 with 20. Heap size 2. Edge cases: one meeting gives 1; back-to-back meetings give 1. Cost: O(n log n) time, O(n) space.`,
      1851: `I restate it: I have ranges and a list of query values; for each query, I want the size of the smallest range that contains it (size = end - start + 1), or -1 if none does. The answers go back in the original query order. Brute force checks every range for every query: O(n · q). The bottleneck is rescanning ranges that I already know are useless. The observation: if I process the queries in increasing order, a range that has ended before the current query is also useless for every later (larger) query, so I can discard it for good. And a range that starts after the current query cannot contain it yet. So: sort the ranges by start, sort the query indices by value, and sweep. For each query x, push every range with start <= x into a min-heap keyed by size (storing the end too). Then pop from the top while the top range ends before x. If the heap is not empty, the top is the smallest range that still contains x. Write the answer at the query's original index. Trace ranges [[1,4],[2,4],[3,6],[4,4]], query 2: ranges starting at <= 2 are [1,4] size 4 and [2,4] size 3; both end at 4 >= 2; the smallest is 3. Edge cases: no range contains the query gives -1; duplicate queries are fine. Cost: O((n + q) log (n + q)) time, O(n + q) space.`,
      986: `I restate it: two lists of ranges, each sorted and each internally disjoint; return every place where a range from one overlaps a range from the other. Brute force compares every pair: O(n · m). Both lists are sorted, which suggests walking them together with two pointers, like the merge step of merge sort. The overlap of the current pair a and b is the range from max(a.start, b.start) to min(a.end, b.end), and it exists exactly when that start is no later than that end; in that case I record it. The question is which pointer to move. The range that ends first cannot overlap anything further along in the other list (everything further along starts later than the other range's end, or at least after this one's end), so I advance the pointer of the range with the smaller end. If the ends are equal, either is fine. Trace [[0,2],[5,10]] and [[1,5],[8,12]]: pair [0,2] and [1,5]: overlap [1,2]; [0,2] ends first, move first. Pair [5,10] and [1,5]: lo = 5, hi = 5, overlap [5,5] (touching counts); [1,5] ends first, move second. Pair [5,10] and [8,12]: overlap [8,10]; 10 < 12, move first, loop ends. Result [[1,2],[5,5],[8,10]]. Edge cases: either list empty gives an empty result. Cost: O(n + m) time, O(1) extra space besides the output.`,
      452: `I restate it: balloons are horizontal spans [start, end]; an arrow shot straight up at x bursts every balloon whose span contains x. Find the fewest arrows to burst them all. Brute force tries every set of shooting positions, which grows quickly. The observation: this is the same as picking the fewest points that hit every interval, and the earliest-ending interval is the key. Whatever arrow bursts the first balloon (the one with the smallest end), the best place for it is that balloon's end: shooting further right would miss it, and shooting at its end reaches as far right as possible, bursting every other balloon that starts at or before that point. So sort by end, shoot at the first end, and then skip every balloon that starts at or before the shot position. When I meet a balloon that starts after the last shot, it needs a new arrow, shot at its own end. Count the arrows. Trace [[10,16],[2,8],[1,6],[7,12]]: sorted by end [1,6],[2,8],[7,12],[10,16]. Shoot at 6: bursts [1,6] and [2,8] (starts 1 and 2 <= 6). [7,12] starts at 7 > 6: new arrow at 12, which also bursts [10,16] (10 <= 12). Answer 2. Edge cases: empty list gives 0; touching balloons share an arrow (the comparison is start > shot, not >=). Cost: O(n log n).`
    }
  };
})();
