/* Offer Ready: Intervals. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it is written in.
   The template also holds minRooms (the sweep line); the template test calls merge, and the same sweep code is
   tested on its own in the "Sweep line" variation. */
(function () {
  var OR = (window.OR = window.OR || {});

  (OR.topics = OR.topics || []).push({
    id: 'intervals',

    hook: 'Calendars, bookings, ranges of IDs, closed roads, video segments: a huge share of real data is “from here to there”, and interviewers know it. Interval questions look like a zoo (merge, insert, count rooms, remove the fewest, answer range queries) but nearly all of them are one move: **sort, then make a single pass** where the only question is “does this one start before the last one ended?”. They appear in almost every loop at companies that schedule things, they are short to code, and the traps (touching endpoints, which field to sort by) are exactly what a careful candidate talks through out loud.',

    cues: [
      'The input is a list of **ranges**: `[start, end]` pairs, meetings, bookings, segments, closed stretches.',
      'You are asked to **combine** ranges that touch or cross, or to **add one more** range to a tidy list.',
      'You must say whether any two ranges **clash**, or **how many things happen at the same moment** (rooms, platforms, servers).',
      'You must keep **as many ranges as possible** that don’t clash, or remove **as few as possible** so none do.',
      'You get **points or queries** and must say which range covers each one (“the shortest range that contains this value”).',
      'The list is **not sorted** and nothing says it is. Your first thought should be: *sorting by which field makes the neighbours the only ones that matter?*',
      'The trap: if the problem is about **a window moving across an array**, or about picking elements by value, it is not this. These problems are about spans on a line, and about **which end you sort by** (start to combine, end to choose).'
    ],

    intuition: [
      'Picture a row of coloured tape strips laid on a ruler, each starting and ending at some marks. Strips are in no particular order. You want a tidy report: “the ruler is covered from 1 to 6, then from 8 to 10”. Looking at every pair is hopeless. But if you **pick the strips up in order of where they start**, something nice happens: the only strip that can possibly overlap the stretch you are building is the *next* one. If the next strip starts after your stretch ends, no later strip can reach back, because every later strip starts even further right.',
      'That is the whole idea of **merging**: sort by start, keep a current range, and for each next range ask one question: does its start fall at or before the end of the current range? If yes, they overlap, so **stretch the current end to the larger of the two ends** (never just copy the new end: the new strip might sit entirely inside the old one). If no, the current range is finished: write it down and start a new one.',
      'The pass costs O(n). The sort costs O(n log n) and is the real price. Inserting into a list that is **already sorted** needs no sort at all: copy everything that ends before the new range starts, absorb everything that starts before it ends, then copy the rest.',
      'Now a different question: not “combine them” but “**choose** as many as possible that don’t clash”. Here you sort by **end**, because finishing early leaves the most room for the rest. Walk through the strips, keep one if it starts at or after the end of the last one kept, and skip it otherwise. The strips you skip are the ones to remove. The two sorts are the thing to remember: **start to combine, end to choose**.',
      'Finally, “how many are happening at once?” (meeting rooms). Two views give the same answer. **Sweep line**: turn each range into two events, a start (+1) and an end (-1), sort the events, and walk through keeping a running total. The peak of that total is the answer. **Min-heap of end times**: sort by start and keep a heap of the ends of meetings that are running; when a new meeting begins, if the earliest end is already over, that room is reused, otherwise you open another. The heap size at the end is the answer.',
      'When coordinates are small, the sweep line is just a **difference array**: add 1 at each start, subtract 1 at each end, then prefix-sum. It is the [prefix sums](#/topic/prefix-sums) trick written backwards, and it is what the sweep line is, in disguise.'
    ].join('\n\n'),

    viz: 'intervals',

    template: {
      title: 'Sort by start, merge in one pass; and the sweep line for “how many at once”',
      note: 'Two short functions that between them cover most of this topic. **merge**: sort by start, open the answer with the first range, then for each next range the overlap test `start <= last end` decides between **extend** (take the larger end) and **push** (a gap, so a new range). It assumes at least one range. **minRooms** is the sweep line: each range makes a +1 event at its start and a -1 event at its end; sorting puts an end **before** a start at the same time (so a meeting ending at 5 frees its room for one starting at 5), and a running total tracks the rooms in use, with its maximum as the answer. The visualizer has a switch between the two.',
      code: {
        py: `class Solution:
    def merge(self, intervals):
        intervals.sort(key=lambda iv: iv[0])                 #@sort > 1. Sort by start: only the next range can overlap the current one
        merged = [intervals[0]]                              #@open > 2. Open with the first range
        for start, end in intervals[1:]:
            last = merged[-1]
            if start <= last[1]:                             #@overlap > 3. Overlap test: it starts before the current range ends
                last[1] = max(last[1], end)                  #@extend > Stretch the end, taking the larger one
            else:
                merged.append([start, end])                  #@push > A gap: the current range is finished, start a new one
        return merged

    def minRooms(self, intervals):
        events = []
        for s, e in intervals:
            events.append((s, 1))                            #@events > A start is +1 room
            events.append((e, -1))                           #@events > An end is -1 room
        events.sort()                                        #@esort > By time; at a tie the end (-1) comes first
        rooms = best = 0
        for t, d in events:                                  #@sweep > Sweep the line left to right
            rooms += d                                       #@rooms > Update the rooms in use
            best = max(best, rooms)                          #@peak > The busiest moment is the answer
        return best`,
        js: `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);                     //@sort > 1. Sort by start: only the next range can overlap the current one
  const merged = [intervals[0]];                             //@open > 2. Open with the first range
  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) {                                  //@overlap > 3. Overlap test: it starts before the current range ends
      last[1] = Math.max(last[1], end);                      //@extend > Stretch the end, taking the larger one
    } else {
      merged.push([start, end]);                             //@push > A gap: the current range is finished, start a new one
    }
  }
  return merged;
}

function minRooms(intervals) {
  const events = [];
  for (const [s, e] of intervals) {
    events.push([s, 1]);                                     //@events > A start is +1 room
    events.push([e, -1]);                                    //@events > An end is -1 room
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);         //@esort > By time; at a tie the end (-1) comes first
  let rooms = 0, best = 0;
  for (const [t, d] of events) {                             //@sweep > Sweep the line left to right
    rooms += d;                                              //@rooms > Update the rooms in use
    best = Math.max(best, rooms);                            //@peak > The busiest moment is the answer
  }
  return best;
}`,
        java: `class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));   //@sort > 1. Sort by start: only the next range can overlap the current one
        List<int[]> merged = new ArrayList<>();
        merged.add(intervals[0]);                                        //@open > 2. Open with the first range
        for (int i = 1; i < intervals.length; i++) {
            int[] last = merged.get(merged.size() - 1);
            if (intervals[i][0] <= last[1]) {                            //@overlap > 3. Overlap test: it starts before the current range ends
                last[1] = Math.max(last[1], intervals[i][1]);            //@extend > Stretch the end, taking the larger one
            } else {
                merged.add(intervals[i]);                                //@push > A gap: the current range is finished, start a new one
            }
        }
        return merged.toArray(new int[0][]);
    }

    public int minRooms(int[][] intervals) {
        int[][] events = new int[intervals.length * 2][];
        for (int i = 0; i < intervals.length; i++) {
            events[2 * i] = new int[]{intervals[i][0], 1};               //@events > A start is +1 room
            events[2 * i + 1] = new int[]{intervals[i][1], -1};          //@events > An end is -1 room
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : a[1] - b[1]);   //@esort > By time; at a tie the end (-1) comes first
        int rooms = 0, best = 0;
        for (int[] ev : events) {                                        //@sweep > Sweep the line left to right
            rooms += ev[1];                                              //@rooms > Update the rooms in use
            best = Math.max(best, rooms);                                //@peak > The busiest moment is the answer
        }
        return best;
    }
}`,
        cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());                        //@sort > 1. Sort by start: only the next range can overlap the current one
        vector<vector<int>> merged = {intervals[0]};                     //@open > 2. Open with the first range
        for (int i = 1; i < (int)intervals.size(); i++) {
            vector<int>& last = merged.back();
            if (intervals[i][0] <= last[1]) {                            //@overlap > 3. Overlap test: it starts before the current range ends
                last[1] = max(last[1], intervals[i][1]);                 //@extend > Stretch the end, taking the larger one
            } else {
                merged.push_back(intervals[i]);                          //@push > A gap: the current range is finished, start a new one
            }
        }
        return merged;
    }

    int minRooms(vector<vector<int>>& intervals) {
        vector<pair<int, int>> events;
        for (auto& iv : intervals) {
            events.push_back({iv[0], 1});                                //@events > A start is +1 room
            events.push_back({iv[1], -1});                               //@events > An end is -1 room
        }
        sort(events.begin(), events.end());                              //@esort > By time; at a tie the end (-1) comes first
        int rooms = 0, best = 0;
        for (auto& ev : events) {                                        //@sweep > Sweep the line left to right
            rooms += ev.second;                                          //@rooms > Update the rooms in use
            best = max(best, rooms);                                     //@peak > The busiest moment is the answer
        }
        return best;
    }
};`
      },
      tests: { fn: 'merge', sig: { args: ['int[][]'] }, cases: [
        { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]] },
        { args: [[[1, 4], [4, 5]]], out: [[1, 5]] },
        { args: [[[8, 10], [1, 3], [2, 6]]], out: [[1, 6], [8, 10]] },
        { args: [[[1, 10], [2, 3], [4, 5]]], out: [[1, 10]] },
        { args: [[[5, 5]]], out: [[5, 5]] },
        { args: [[[1, 2], [3, 4], [5, 6]]], out: [[1, 2], [3, 4], [5, 6]] }] }
    },

    complexity: {
      time: 'O(n log n): the sort dominates. The single pass, or the sweep over events, is O(n)',
      space: 'O(n) for the answer (O(1) extra if you may reuse the input); O(n) for the events or the heap',
      why: 'Sorting is the only super-linear step. After it, merging looks at each range once and does O(1) work, so the pass is O(n). The sweep line has 2n events to sort, still O(n log n), then one pass. The min-heap version pushes each end once and pops each at most once, O(log n) apiece, so O(n log n) as well. Inserting into an already-sorted list skips the sort and is O(n). A difference array is O(n + R) where R is the size of the coordinate range, which is only a win when R is small.',
      trap: 'Don’t say “O(n)” for merge: the sort is part of the cost unless the input is stated to be sorted already. Also say which field you sort by and why: **start** when combining, **end** when choosing a maximum set. And name your boundary rule out loud: do ranges that **touch** at a point (`[1,4]` and `[4,5]`) overlap? For merging they usually do (closed ends); for meetings they usually don’t (a room is free at the moment the last one ends). Ask.'
    },

    variations: [
      {
        name: 'The overlap test and the touching question',
        body: 'Two ranges `a` and `b` overlap exactly when **each starts no later than the other ends**: `a.start <= b.end` and `b.start <= a.end`. That is the closed-range rule, where touching counts. For half-open ranges `[start, end)` (a meeting from 9:00 up to but not including 10:00) the comparison becomes strict: `a.start < b.end` and `b.start < a.end`. Do not memorise the cases where one is inside the other, or one is to the left: they all fall out of those two comparisons, and the single-comparison version inside a sorted pass (`start <= last end`) works because sorting already guarantees the other half. Before you code, say the rule you are using and, if the problem is unclear, ask which one it is.',
        code: {
          py: `def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1]      # closed ranges: touching counts`,
          js: `function overlaps(a, b) {
  return a[0] <= b[1] && b[0] <= a[1];       // closed ranges: touching counts
}`,
          java: `class Solution {
    boolean overlaps(int[] a, int[] b) {
        return a[0] <= b[1] && b[0] <= a[1];   // closed ranges: touching counts
    }
}`,
          cpp: `class Solution {
public:
    bool overlaps(vector<int> a, vector<int> b) {
        return a[0] <= b[1] && b[0] <= a[1];   // closed ranges: touching counts
    }
};`
        },
        tests: { fn: 'overlaps', sig: { args: ['int[]', 'int[]'] }, cases: [
          { args: [[1, 4], [4, 5]], out: true }, { args: [[1, 3], [4, 5]], out: false }, { args: [[1, 10], [3, 4]], out: true },
          { args: [[6, 8], [1, 6]], out: true }, { args: [[2, 2], [1, 3]], out: true }, { args: [[7, 9], [1, 2]], out: false }] }
      },
      {
        name: 'Insert into a sorted list: three phases, no sort',
        body: 'When the list is already sorted and non-overlapping, one pass splits into three phases: **before** (ranges that end before the new one starts: copy them), **overlapping** (ranges that start no later than the new one ends: absorb each into the new range by taking the smaller start and the larger end), and **after** (everything left: copy). It is O(n), and writing the answer in this order means the result stays sorted without any sort. The worked problem below does exactly this.'
      },
      {
        name: 'Interval scheduling: sort by end, keep what fits',
        body: 'To keep the **maximum number** of non-clashing ranges, sort by **end** and greedily take each range whose start is at or after the end of the last one taken. The exchange argument: among all choices for the first pick, the range that ends earliest leaves the most room for everything else, so some best answer contains it, and then the same argument applies to what remains. Sorting by start, by length or by the fewest conflicts all fail on small counterexamples. The number to **remove** is `n` minus the number kept. Balloon-bursting and “remove the fewest ranges” are the same code with a different last line.',
        code: {
          py: `def maxKept(intervals):
    intervals.sort(key=lambda iv: iv[1])      # earliest finish first
    kept, end = 0, float('-inf')
    for s, e in intervals:
        if s >= end:                          # fits after the last kept one
            kept += 1
            end = e
    return kept`,
          js: `function maxKept(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);     // earliest finish first
  let kept = 0, end = -Infinity;
  for (const [s, e] of intervals) {
    if (s >= end) {                          // fits after the last kept one
      kept++;
      end = e;
    }
  }
  return kept;
}`,
          java: `class Solution {
    int maxKept(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));   // earliest finish first
        int kept = 0, end = Integer.MIN_VALUE;
        for (int[] iv : intervals) {
            if (iv[0] >= end) {                                          // fits after the last kept one
                kept++;
                end = iv[1];
            }
        }
        return kept;
    }
}`,
          cpp: `class Solution {
public:
    int maxKept(vector<vector<int>> intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // earliest finish first
        int kept = 0, end = INT_MIN;
        for (auto& iv : intervals) {
            if (iv[0] >= end) {                                          // fits after the last kept one
                kept++;
                end = iv[1];
            }
        }
        return kept;
    }
};`
        },
        tests: { fn: 'maxKept', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [2, 4], [3, 5]]], out: 2 }, { args: [[[1, 10], [2, 3], [4, 5], [6, 7]]], out: 3 },
          { args: [[[1, 2], [1, 2], [1, 2]]], out: 1 }, { args: [[[0, 3], [3, 6], [6, 9]]], out: 3 }, { args: [[[5, 8]]], out: 1 }] }
      },
      {
        name: 'Sweep line with events (meeting rooms)',
        body: 'The template’s `minRooms`, on its own. Each range becomes two events; sorting by time with **ends before starts at the same time** (the tuple `(t, -1)` sorts below `(t, +1)`) means a room freed at 5 can be reused by a meeting starting at 5. The running total is the number of ranges covering the current moment, so its maximum is the answer. The same sweep answers “at which time is it busiest?” (record `t` when `best` improves) and “how long is at least one thing running?” (sum the gaps while the total is above zero). Many problems about overlaps are this loop with a different thing recorded at each event.',
        code: {
          py: `def minRooms(intervals):
    events = []
    for s, e in intervals:
        events.append((s, 1))
        events.append((e, -1))
    events.sort()                  # at a tie, -1 (an end) comes before +1 (a start)
    rooms = best = 0
    for t, d in events:
        rooms += d
        best = max(best, rooms)
    return best`,
          js: `function minRooms(intervals) {
  const events = [];
  for (const [s, e] of intervals) {
    events.push([s, 1]);
    events.push([e, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);   // at a tie, -1 (an end) comes before +1 (a start)
  let rooms = 0, best = 0;
  for (const [t, d] of events) {
    rooms += d;
    best = Math.max(best, rooms);
  }
  return best;
}`,
          java: `class Solution {
    int minRooms(int[][] intervals) {
        int[][] events = new int[intervals.length * 2][];
        for (int i = 0; i < intervals.length; i++) {
            events[2 * i] = new int[]{intervals[i][0], 1};
            events[2 * i + 1] = new int[]{intervals[i][1], -1};
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : a[1] - b[1]);   // an end before a start at a tie
        int rooms = 0, best = 0;
        for (int[] ev : events) {
            rooms += ev[1];
            best = Math.max(best, rooms);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int minRooms(vector<vector<int>> intervals) {
        vector<pair<int, int>> events;
        for (auto& iv : intervals) {
            events.push_back({iv[0], 1});
            events.push_back({iv[1], -1});
        }
        sort(events.begin(), events.end());        // at a tie, -1 (an end) comes before +1 (a start)
        int rooms = 0, best = 0;
        for (auto& ev : events) {
            rooms += ev.second;
            best = max(best, rooms);
        }
        return best;
    }
};`
        },
        tests: { fn: 'minRooms', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 30], [5, 10], [15, 20]]], out: 2 }, { args: [[[7, 10], [2, 4]]], out: 1 }, { args: [[[1, 5], [5, 6]]], out: 1 },
          { args: [[[1, 4], [2, 5], [3, 6]]], out: 3 }, { args: [[[1, 2]]], out: 1 }, { args: [[[0, 30], [5, 10], [15, 20], [8, 16]]], out: 3 }] }
      },
      {
        name: 'The difference array (the prefix-sum link)',
        body: 'When the coordinates are small whole numbers, skip the sort: make an array `diff` over the coordinate range, add 1 at each start and subtract 1 at each end, then take a **running sum**. The running sum at position x is how many ranges cover x, which is the sweep line with the events already in order. It is the [prefix sums](#/topic/prefix-sums) idea run backwards: instead of summing a range to answer a query, you record where the change happens and sum once. Cost is O(n + R) for coordinate range R, so it is great for “time in minutes of one day” and wrong for values up to 10⁹, where you sort the events instead. The code here treats ranges as half-open `[start, end)`.',
        code: {
          py: `def maxOverlap(intervals):
    top = max(e for s, e in intervals)
    diff = [0] * (top + 2)
    for s, e in intervals:
        diff[s] += 1               # a range begins here
        diff[e] -= 1               # and has stopped covering from here
    best = cur = 0
    for d in diff:
        cur += d                   # running sum = how many cover this point
        best = max(best, cur)
    return best`,
          js: `function maxOverlap(intervals) {
  const top = Math.max(...intervals.map(iv => iv[1]));
  const diff = new Array(top + 2).fill(0);
  for (const [s, e] of intervals) {
    diff[s] += 1;                  // a range begins here
    diff[e] -= 1;                  // and has stopped covering from here
  }
  let best = 0, cur = 0;
  for (const d of diff) {
    cur += d;                      // running sum = how many cover this point
    best = Math.max(best, cur);
  }
  return best;
}`,
          java: `class Solution {
    int maxOverlap(int[][] intervals) {
        int top = 0;
        for (int[] iv : intervals) top = Math.max(top, iv[1]);
        int[] diff = new int[top + 2];
        for (int[] iv : intervals) {
            diff[iv[0]] += 1;      // a range begins here
            diff[iv[1]] -= 1;      // and has stopped covering from here
        }
        int best = 0, cur = 0;
        for (int d : diff) {
            cur += d;              // running sum = how many cover this point
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maxOverlap(vector<vector<int>> intervals) {
        int top = 0;
        for (auto& iv : intervals) top = max(top, iv[1]);
        vector<int> diff(top + 2, 0);
        for (auto& iv : intervals) {
            diff[iv[0]] += 1;      // a range begins here
            diff[iv[1]] -= 1;      // and has stopped covering from here
        }
        int best = 0, cur = 0;
        for (int d : diff) {
            cur += d;              // running sum = how many cover this point
            best = max(best, cur);
        }
        return best;
    }
};`
        },
        tests: { fn: 'maxOverlap', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 30], [5, 10], [15, 20]]], out: 2 }, { args: [[[1, 5], [5, 6]]], out: 1 }, { args: [[[1, 4], [2, 5], [3, 6]]], out: 3 },
          { args: [[[2, 3]]], out: 1 }, { args: [[[0, 9], [1, 8], [2, 7], [3, 6], [4, 5]]], out: 5 }] }
      },
      {
        name: 'Queries against ranges: sort both, use a heap (offline)',
        body: 'For “the smallest range that contains this value”, answering each query by scanning every range is O(n·q). Instead answer the **queries in increasing order**, and sweep the ranges in order of start alongside them. For each query value `x`: push every range with `start <= x` into a **min-heap keyed by size** (store the end with it); then pop from the top while the top range **ends before x** (it can never help a later, larger query either, so it is safe to discard for good); the top is now the smallest range covering `x`. Write answers back by each query’s original position. It is O((n + q) log (n + q)). The trick that makes it work is sorting the queries: with queries in order, a range that has expired once is expired forever. The practice problem below is exactly this.'
      },
      {
        name: 'Two sorted lists: walk with two pointers',
        body: 'When you get **two** lists, each sorted and each internally non-overlapping, and need where they overlap, use two pointers. At each step the intersection of the two current ranges is `[max of starts, min of ends]`, and it exists when that start is `<=` that end. Then **advance whichever range ends first**: it cannot overlap anything further along in the other list. This is O(n + m) and never sorts. It is the merge step of merge sort, with an intersection test in the middle.'
      }
    ],

    worked: [
      {
        lc: 56,
        restate: 'You get a list of ranges, each a pair `[start, end]`, in no particular order. Ranges that overlap (or touch at an endpoint) belong together. Return a list of ranges with the overlapping ones combined, so that no two of the result overlap, and they cover exactly the same ground as the input.',
        examples: '- `[[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`: the first two overlap and become `[1,6]`.\n- `[[1,4],[4,5]]` → `[[1,5]]`: touching at 4 counts.\n- `[[1,10],[2,3]]` → `[[1,10]]`: the second sits wholly inside the first, so the end must not shrink to 3.',
        brute: 'Repeat until nothing changes: compare every pair of ranges, and if two overlap, replace them with their union. A single pass of that is O(n²) and you may need up to n passes, so O(n³). The point of sorting is that you don’t have to ask “which other ranges does this overlap?” at all.',
        insight: 'Sort by **start**. Then the ranges that belong to one combined stretch form a **run of neighbours**, so a single left-to-right pass can build the answer. Keep the last range of the answer as the current stretch. For the next range, if its start is at or before the current end, it overlaps, so stretch the end to `max(current end, its end)`; the `max` is what handles a range sitting inside the current one. Otherwise there is a gap, so close the current stretch and start a new one. Sorting dominates, O(n log n).',
        code: {
          py: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort(key=lambda iv: iv[0])          # by start
        merged = [intervals[0]]
        for start, end in intervals[1:]:
            last = merged[-1]
            if start <= last[1]:                      # overlaps (or touches) the current stretch
                last[1] = max(last[1], end)           # max: a range inside it must not shrink the end
            else:
                merged.append([start, end])           # a gap: begin a new stretch
        return merged`,
          js: `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);              // by start
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) {                           // overlaps (or touches) the current stretch
      last[1] = Math.max(last[1], end);               // max: a range inside it must not shrink the end
    } else {
      merged.push([start, end]);                      // a gap: begin a new stretch
    }
  }
  return merged;
}`,
          java: `class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));   // by start
        List<int[]> merged = new ArrayList<>();
        merged.add(intervals[0]);
        for (int i = 1; i < intervals.length; i++) {
            int[] last = merged.get(merged.size() - 1);
            if (intervals[i][0] <= last[1]) {                            // overlaps (or touches) the current stretch
                last[1] = Math.max(last[1], intervals[i][1]);            // max: a range inside it must not shrink the end
            } else {
                merged.add(intervals[i]);                                // a gap: begin a new stretch
            }
        }
        return merged.toArray(new int[0][]);
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());                        // by start
        vector<vector<int>> merged = {intervals[0]};
        for (int i = 1; i < (int)intervals.size(); i++) {
            vector<int>& last = merged.back();
            if (intervals[i][0] <= last[1]) {                            // overlaps (or touches) the current stretch
                last[1] = max(last[1], intervals[i][1]);                 // max: a range inside it must not shrink the end
            } else {
                merged.push_back(intervals[i]);                          // a gap: begin a new stretch
            }
        }
        return merged;
    }
};`
        },
        tests: { fn: 'merge', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], out: [[1, 5]] },
          { args: [[[1, 10], [2, 3]]], out: [[1, 10]] }, { args: [[[9, 12], [1, 5], [4, 8], [11, 14]]], out: [[1, 8], [9, 14]] }, { args: [[[2, 2]]], out: [[2, 2]] }] },
        complexity: 'O(n log n) time for the sort, O(n) for the pass; O(n) extra space for the answer (plus the sort’s own).',
        say: '“I sort by start. After that, anything overlapping the current stretch has to be the very next range, because later ones start even further right. So I keep the current stretch as the last item of the answer. If the next start is at or before its end, I stretch the end to the max of the two ends, which also covers a range that sits inside it. If not, I close it and start a new one. Sorting is O(n log n) and the pass is O(n). I’m treating touching endpoints as overlapping; if that is wrong for this problem it is a one-character change, `<` instead of `<=`.”',
        followups: [
          { q: 'What if the ranges arrive as a stream and you need the merged view at any time?', a: 'Keep the merged ranges in an ordered structure (a balanced tree, or a sorted list with binary search). A new range finds its neighbours by binary search, absorbs every merged range it overlaps, and is inserted as one. That is O(log n) to find and amortized O(log n) per absorbed range.' },
          { q: 'Why the max when stretching the end?', a: 'Because sorting is by start only. A later range may start after the current one but end before it (`[1,10]` then `[2,3]`). Taking the new end blindly would shrink the stretch to 3 and lose ground.' }
        ]
      },

      {
        lc: 57,
        restate: 'You get a list of ranges that is already sorted by start and has no overlaps, plus one more range. Add the new range, combining it with every range it overlaps, and return the list, still sorted and still without overlaps.',
        examples: '- ranges `[[1,3],[6,9]]`, new `[2,5]` → `[[1,5],[6,9]]`.\n- ranges `[[1,2],[3,5],[6,7],[8,10],[12,16]]`, new `[4,8]` → `[[1,2],[3,10],[12,16]]`: it swallows three ranges.\n- Edge cases: the list is empty; the new range is entirely left of everything, or right of everything; it sits entirely inside one range.',
        brute: 'Append the new range, sort the whole list, and merge as in the previous problem. It is correct, and O(n log n). It ignores the fact that the list is already sorted, which is the whole point of the question: the answer should be linear.',
        insight: 'Everything falls into three groups by position, so one pass in three phases is enough. **Before**: ranges whose end is less than the new start can’t touch it, so copy them. **Overlapping**: every range whose start is at most the new end does touch it; absorb each by replacing the new range with `[min of starts, max of ends]`. **After**: copy what is left. The order of the output is automatically sorted, because the three groups come out left to right.',
        code: {
          py: `class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        res, i, n = [], 0, len(intervals)
        while i < n and intervals[i][1] < newInterval[0]:       # before: ends before the new one starts
            res.append(intervals[i])
            i += 1
        while i < n and intervals[i][0] <= newInterval[1]:      # overlapping: absorb into the new range
            newInterval = [min(newInterval[0], intervals[i][0]), max(newInterval[1], intervals[i][1])]
            i += 1
        res.append(newInterval)
        res.extend(intervals[i:])                               # after: everything left
        return res`,
          js: `function insert(intervals, newInterval) {
  const res = [], n = intervals.length;
  let i = 0, lo = newInterval[0], hi = newInterval[1];
  while (i < n && intervals[i][1] < lo) res.push(intervals[i++]);          // before: ends before the new one starts
  while (i < n && intervals[i][0] <= hi) {                                 // overlapping: absorb into the new range
    lo = Math.min(lo, intervals[i][0]);
    hi = Math.max(hi, intervals[i][1]);
    i++;
  }
  res.push([lo, hi]);
  while (i < n) res.push(intervals[i++]);                                  // after: everything left
  return res;
}`,
          java: `class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> res = new ArrayList<>();
        int i = 0, n = intervals.length;
        int lo = newInterval[0], hi = newInterval[1];
        while (i < n && intervals[i][1] < lo) res.add(intervals[i++]);     // before: ends before the new one starts
        while (i < n && intervals[i][0] <= hi) {                           // overlapping: absorb into the new range
            lo = Math.min(lo, intervals[i][0]);
            hi = Math.max(hi, intervals[i][1]);
            i++;
        }
        res.add(new int[]{lo, hi});
        while (i < n) res.add(intervals[i++]);                             // after: everything left
        return res.toArray(new int[0][]);
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> res;
        int i = 0, n = intervals.size();
        int lo = newInterval[0], hi = newInterval[1];
        while (i < n && intervals[i][1] < lo) res.push_back(intervals[i++]);   // before: ends before the new one starts
        while (i < n && intervals[i][0] <= hi) {                               // overlapping: absorb into the new range
            lo = min(lo, intervals[i][0]);
            hi = max(hi, intervals[i][1]);
            i++;
        }
        res.push_back({lo, hi});
        while (i < n) res.push_back(intervals[i++]);                           // after: everything left
        return res;
    }
};`
        },
        tests: { fn: 'insert', sig: { args: ['int[][]', 'int[]'] }, cases: [
          { args: [[[1, 3], [6, 9]], [2, 5]], out: [[1, 5], [6, 9]] }, { args: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], out: [[1, 2], [3, 10], [12, 16]] },
          { args: [[], [5, 7]], out: [[5, 7]] }, { args: [[[1, 5]], [2, 3]], out: [[1, 5]] }, { args: [[[1, 5]], [6, 8]], out: [[1, 5], [6, 8]] },
          { args: [[[3, 5]], [1, 2]], out: [[1, 2], [3, 5]] }, { args: [[[1, 2], [3, 4]], [2, 3]], out: [[1, 4]] }] },
        complexity: 'O(n) time, one pass with no sort; O(n) space for the answer.',
        say: '“The list is already sorted and disjoint, so I don’t need to sort. I walk it in three phases. First I copy every range that ends before the new one starts. Then, for every range that starts at or before the new range’s end, I grow the new range to cover it: smallest start, largest end. Then I write the new range and copy the rest. The output is sorted automatically and the whole thing is O(n).”',
        followups: [
          { q: 'The list is long and you will do many inserts. Can you do better than O(n) each?', a: 'Yes: binary search for where the new range starts, then absorb neighbours. Finding the position is O(log n); with an array the shift to insert is still O(n), so use a balanced tree or a sorted container for O(log n) overall.' },
          { q: 'What if the list were not sorted?', a: 'Then you cannot rely on the three groups, and the simplest answer is to append and run the merge from the previous problem: sort, then one pass.' }
        ]
      },

      {
        lc: 253,
        restate: 'You get a list of meetings, each a `[start, end]` pair. Two meetings can share a room only if one ends no later than the other starts. Return the smallest number of rooms that fits every meeting.',
        examples: '- `[[0,30],[5,10],[15,20]]` → `2`: the long meeting overlaps both short ones, which don’t overlap each other.\n- `[[7,10],[2,4]]` → `1`.\n- `[[1,5],[5,6]]` → `1`: one ends at 5 as the other begins, so the room is free in time.\n- `[[1,4],[2,5],[3,6]]` → `3`.',
        brute: 'For every meeting, count how many other meetings overlap its start moment; the biggest count is the answer. That is O(n²). Or assign rooms greedily and, for each new meeting, scan every room for one that is free: also O(n²) in the worst case.',
        insight: 'The number of rooms needed is the **largest number of meetings running at the same moment**. Two ways to read that off. (1) **Min-heap of end times**: sort the meetings by start and keep a heap holding the end time of every meeting currently using a room. For the next meeting, look at the **smallest** end in the heap: if it is at or before this meeting’s start, that room has been freed, so reuse it (replace that end with this meeting’s end). If not, every room is busy, so open a new one (push). The heap’s final size is the number of rooms. (2) The **sweep line**, in the template: start events add one, end events subtract one, and the peak of the running total is the answer. Both are O(n log n).',
        code: {
          py: `class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda iv: iv[0])             # by start
        ends = []                                        # min-heap of end times of rooms in use
        for start, end in intervals:
            if ends and ends[0] <= start:                # the earliest-finishing room is free by now
                heapq.heapreplace(ends, end)             # reuse it: pop its old end, push the new one
            else:
                heapq.heappush(ends, end)                # every room is busy: open a new one
        return len(ends)`,
          js: `function minMeetingRooms(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);                 // by start
  const heap = [];                                       // min-heap of end times of rooms in use (JS has none built in)
  const push = (x) => {
    heap.push(x);
    for (let k = heap.length - 1; k > 0;) {
      const p = (k - 1) >> 1;
      if (heap[p] <= heap[k]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const last = heap.pop();
    if (!heap.length) return;
    heap[0] = last;
    for (let k = 0;;) {
      let m = k;
      const l = 2 * k + 1, r = l + 1;
      if (l < heap.length && heap[l] < heap[m]) m = l;
      if (r < heap.length && heap[r] < heap[m]) m = r;
      if (m === k) break;
      [heap[k], heap[m]] = [heap[m], heap[k]];
      k = m;
    }
  };
  for (const [start, end] of intervals) {
    if (heap.length && heap[0] <= start) pop();          // the earliest-finishing room is free by now: reuse it
    push(end);                                           // this meeting now holds a room until end
  }
  return heap.length;
}`,
          java: `class Solution {
    public int minMeetingRooms(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));   // by start
        PriorityQueue<Integer> ends = new PriorityQueue<>();             // min-heap of end times of rooms in use
        for (int[] iv : intervals) {
            if (!ends.isEmpty() && ends.peek() <= iv[0]) ends.poll();    // the earliest-finishing room is free by now: reuse it
            ends.add(iv[1]);                                             // this meeting now holds a room until iv[1]
        }
        return ends.size();
    }
}`,
          cpp: `class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());                        // by start
        priority_queue<int, vector<int>, greater<int>> ends;             // min-heap of end times of rooms in use
        for (auto& iv : intervals) {
            if (!ends.empty() && ends.top() <= iv[0]) ends.pop();        // the earliest-finishing room is free by now: reuse it
            ends.push(iv[1]);                                            // this meeting now holds a room until iv[1]
        }
        return ends.size();
    }
};`
        },
        tests: { fn: 'minMeetingRooms', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 30], [5, 10], [15, 20]]], out: 2 }, { args: [[[7, 10], [2, 4]]], out: 1 }, { args: [[[1, 5], [5, 6]]], out: 1 },
          { args: [[[1, 4], [2, 5], [3, 6]]], out: 3 }, { args: [[[1, 2]]], out: 1 }, { args: [[[0, 30], [5, 10], [15, 20], [8, 16]]], out: 3 }] },
        complexity: 'O(n log n) time (the sort, then n heap operations of O(log n)); O(n) space for the heap.',
        say: '“The answer is the most meetings running at once. I sort by start and keep a min-heap of the end times of rooms in use. For each meeting, if the smallest end is at or before its start, that room is free, so I reuse it; otherwise I open a new room. The heap size is the answer. The other way is a sweep line: +1 at starts, -1 at ends, sort the events with ends first on ties, and take the peak of the running sum. Both are O(n log n); the sweep is shorter, the heap makes the room reuse explicit.”',
        followups: [
          { q: 'Why does an end sort before a start at the same time?', a: 'A meeting that ends at 5 and one that begins at 5 do not overlap, so they can share a room. Processing the end first lowers the count before the start raises it again, so the peak never counts a phantom overlap.' },
          { q: 'Can you print which meeting goes in which room?', a: 'Use the heap version and store `(end, roomId)` pairs. When you reuse the top, the new meeting takes that room id; when you push, assign a fresh id. The sweep line cannot say which room, only how many.' }
        ]
      },

      {
        lc: 435,
        restate: 'You get a list of ranges. Remove as few as you can so that none of the remaining ranges overlap. Ranges that only share an endpoint do not count as overlapping. Return how many you removed.',
        examples: '- `[[1,2],[2,3],[3,4],[1,3]]` → `1`: remove `[1,3]` and the other three touch but don’t overlap.\n- `[[1,2],[1,2],[1,2]]` → `2`: keep one copy.\n- `[[1,2],[2,3]]` → `0`.\n- `[[1,100],[11,22],[1,11],[2,12]]` → `2`: keep `[1,11]` and `[11,22]`.',
        brute: 'Try every subset of ranges to remove, smallest first, and check whether the rest is free of overlaps. That is exponential. A dynamic program over ranges sorted by end (longest chain of compatible ranges) works in O(n²), but a greedy choice is enough and is linear after the sort.',
        insight: 'Removing the fewest is the same as **keeping the most**: answer = n − (the largest set that doesn’t overlap). To keep the most, always take the range that **finishes earliest**, because that leaves the most room for the rest. So: sort by **end**, walk through, and keep a range if its start is at or after the end of the last one kept; otherwise it clashes with something that finishes at least as early, so skip it (that is a removal). Sorting by start would fail on a long range that starts first but blocks many short ones, like `[1,100]` against the short ranges inside it.',
        code: {
          py: `class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda iv: iv[1])          # earliest finish first
        kept, end = 0, float('-inf')
        for s, e in intervals:
            if s >= end:                              # starts after (or when) the last kept one ends
                kept += 1
                end = e
        return len(intervals) - kept                  # everything not kept was removed`,
          js: `function eraseOverlapIntervals(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);              // earliest finish first
  let kept = 0, end = -Infinity;
  for (const [s, e] of intervals) {
    if (s >= end) {                                   // starts after (or when) the last kept one ends
      kept++;
      end = e;
    }
  }
  return intervals.length - kept;                     // everything not kept was removed
}`,
          java: `class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));   // earliest finish first
        int kept = 0, end = Integer.MIN_VALUE;
        for (int[] iv : intervals) {
            if (iv[0] >= end) {                                          // starts after (or when) the last kept one ends
                kept++;
                end = iv[1];
            }
        }
        return intervals.length - kept;                                  // everything not kept was removed
    }
}`,
          cpp: `class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // earliest finish first
        int kept = 0, end = INT_MIN;
        for (auto& iv : intervals) {
            if (iv[0] >= end) {                                          // starts after (or when) the last kept one ends
                kept++;
                end = iv[1];
            }
        }
        return (int)intervals.size() - kept;                             // everything not kept was removed
    }
};`
        },
        tests: { fn: 'eraseOverlapIntervals', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2], [2, 3], [3, 4], [1, 3]]], out: 1 }, { args: [[[1, 2], [1, 2], [1, 2]]], out: 2 }, { args: [[[1, 2], [2, 3]]], out: 0 },
          { args: [[[1, 100], [11, 22], [1, 11], [2, 12]]], out: 2 }, { args: [[[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]]], out: 2 }, { args: [[[5, 8]]], out: 0 }] },
        complexity: 'O(n log n) time for the sort, one O(n) pass; O(1) extra space beyond the sort.',
        say: '“Removing the fewest means keeping the most that don’t overlap. I sort by end time and take greedily: keep a range if it starts at or after the end of the last one I kept. Finishing earliest leaves the most room, and an exchange argument shows some optimal answer starts with that range. The answer is n minus how many I kept. I sort by end rather than start because a range that starts early but ends late can block many others.”',
        followups: [
          { q: 'What if each range had a weight and you wanted the heaviest non-overlapping set?', a: 'Greedy fails. Sort by end and use dynamic programming: `best[i]` is the larger of skipping range i, or its weight plus the best over ranges that end at or before its start, found with binary search. That is O(n log n).' },
          { q: 'How does this change for “fewest points to hit every range” (balloons)?', a: 'It is the same sort by end. Shoot at the end of the first range, which also bursts every range that starts at or before that point; the next range that starts after it needs a new shot. Count the shots.' }
        ]
      }
    ],

    practice: [
      { lc: 57,
        hints: ['The list is already sorted and has no overlaps, so you should not need to sort. What are the three kinds of range, by position relative to the new one?', 'A range ends before the new one starts: copy it. A range starts after the new one ends: copy it too. What do you do with the ones in between?', 'Absorb each overlapping range into the new one with min of starts and max of ends, add the grown range once, then copy the rest.'],
        starter: { py: 'class Solution:\n    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:\n        ', js: 'function insert(intervals, newInterval) {\n  \n}' },
        tests: { fn: 'insert', sig: { args: ['int[][]', 'int[]'] }, cases: [
          { args: [[[1, 3], [6, 9]], [2, 5]], out: [[1, 5], [6, 9]] }, { args: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], out: [[1, 2], [3, 10], [12, 16]] },
          { args: [[], [5, 7]], out: [[5, 7]] }, { args: [[[1, 5]], [2, 3]], out: [[1, 5]] }, { args: [[[3, 5]], [1, 2]], out: [[1, 2], [3, 5]] }] } },

      { lc: 56,
        hints: ['Overlapping ranges can be far apart in the input. What single change makes neighbours the only candidates?', 'After sorting by start, compare the next range’s start with the end of the last range you kept.', 'If it starts at or before that end, set the end to the larger of the two ends. Otherwise append it as a new range.'],
        starter: { py: 'class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        ', js: 'function merge(intervals) {\n  \n}' },
        tests: { fn: 'merge', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], out: [[1, 5]] },
          { args: [[[1, 10], [2, 3], [4, 5]]], out: [[1, 10]] }, { args: [[[9, 12], [1, 5], [4, 8], [11, 14]]], out: [[1, 8], [9, 14]] }, { args: [[[2, 2]]], out: [[2, 2]] }] } },

      { lc: 435,
        hints: ['Removing the fewest is the same as keeping the most. Which kind of range is safest to keep first?', 'The one that finishes earliest leaves the most room. Sort by end time, not start.', 'Keep a range when its start is at or after the end of the last kept one; the answer is n minus the number kept.'],
        starter: { py: 'class Solution:\n    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:\n        ', js: 'function eraseOverlapIntervals(intervals) {\n  \n}' },
        tests: { fn: 'eraseOverlapIntervals', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2], [2, 3], [3, 4], [1, 3]]], out: 1 }, { args: [[[1, 2], [1, 2], [1, 2]]], out: 2 }, { args: [[[1, 2], [2, 3]]], out: 0 },
          { args: [[[1, 100], [11, 22], [1, 11], [2, 12]]], out: 2 }, { args: [[[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]]], out: 2 }] } },

      { lc: 252,
        hints: ['One person can attend everything only if no two meetings overlap. Comparing every pair is O(n²). What order lets you compare only neighbours?', 'Sort by start. Then only a meeting and the one right after it can clash.', 'After sorting, return false as soon as a meeting starts before the previous one ends. Touching at a single moment is fine.'],
        solution: { explain: 'Sort by start and compare each meeting with the previous one. If one starts strictly before the previous ends, they overlap. O(n log n) time.', code: {
          py: `class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        intervals.sort(key=lambda iv: iv[0])
        for i in range(1, len(intervals)):
            if intervals[i][0] < intervals[i - 1][1]:     # starts before the previous one ends
                return False
        return True`,
          js: `function canAttendMeetings(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;   // starts before the previous one ends
  }
  return true;
}`,
          java: `class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i - 1][1]) return false;   // starts before the previous one ends
        }
        return true;
    }
}`,
          cpp: `class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] < intervals[i - 1][1]) return false;   // starts before the previous one ends
        }
        return true;
    }
};` } },
        starter: { py: 'class Solution:\n    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:\n        ', js: 'function canAttendMeetings(intervals) {\n  \n}' },
        tests: { fn: 'canAttendMeetings', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 30], [5, 10], [15, 20]]], out: false }, { args: [[[7, 10], [2, 4]]], out: true }, { args: [[], ], out: true },
          { args: [[[1, 5], [5, 8]]], out: true }, { args: [[[1, 2]]], out: true }, { args: [[[9, 12], [1, 3], [2, 4]]], out: false }] } },

      { lc: 253,
        hints: ['The rooms needed equal the largest number of meetings running at the same moment. How can you count that without checking every moment?', 'Turn each meeting into a start event (+1) and an end event (-1). Sort the events by time. What goes first at a tie?', 'Put the end before the start at the same time, keep a running total, and track its maximum. Or sort by start and use a min-heap of end times.'],
        starter: { py: 'class Solution:\n    def minMeetingRooms(self, intervals: List[List[int]]) -> int:\n        ', js: 'function minMeetingRooms(intervals) {\n  \n}' },
        tests: { fn: 'minMeetingRooms', sig: { args: ['int[][]'] }, cases: [
          { args: [[[0, 30], [5, 10], [15, 20]]], out: 2 }, { args: [[[7, 10], [2, 4]]], out: 1 }, { args: [[[1, 5], [5, 6]]], out: 1 },
          { args: [[[1, 4], [2, 5], [3, 6]]], out: 3 }, { args: [[[1, 2]]], out: 1 }] } },

      { lc: 1851,
        hints: ['Scanning every range for every query is too slow. If the queries were in increasing order, what would you know about a range that has already ended?', 'Sort the queries (remembering their original positions) and the ranges by start. For a query x, which ranges can possibly contain it?', 'Push every range with start <= x into a min-heap keyed by size, storing its end. Pop while the top ends before x. The top is the answer; no top means -1.'],
        solution: { explain: 'Answer the queries in sorted order while sweeping the ranges by start. A min-heap keyed by size holds every range that has started; ranges that have ended are popped off the top for good, since later queries are larger. O((n + q) log (n + q)).', code: {
          py: `class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        intervals.sort()                                        # by start
        order = sorted(range(len(queries)), key=lambda i: queries[i])
        heap, res, i = [], [-1] * len(queries), 0               # heap of (size, end)
        for qi in order:
            q = queries[qi]
            while i < len(intervals) and intervals[i][0] <= q:  # every range that has started
                l, r = intervals[i]
                heapq.heappush(heap, (r - l + 1, r))
                i += 1
            while heap and heap[0][1] < q:                      # the top ended before q: gone for every later query too
                heapq.heappop(heap)
            if heap:
                res[qi] = heap[0][0]
        return res`,
          js: `function minInterval(intervals, queries) {
  intervals.sort((a, b) => a[0] - b[0]);                        // by start
  const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]);
  const heap = [], res = new Array(queries.length).fill(-1);    // min-heap of [size, end]
  const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = (x) => {
    heap.push(x);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (!less(heap[k], heap[p])) break;
      [heap[k], heap[p]] = [heap[p], heap[k]];
      k = p;
    }
  };
  const pop = () => {
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        let m = k;
        const l = 2 * k + 1, r = l + 1;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (r < heap.length && less(heap[r], heap[m])) m = r;
        if (m === k) break;
        [heap[k], heap[m]] = [heap[m], heap[k]];
        k = m;
      }
    }
  };
  let i = 0;
  for (const qi of order) {
    const q = queries[qi];
    while (i < intervals.length && intervals[i][0] <= q) {      // every range that has started
      push([intervals[i][1] - intervals[i][0] + 1, intervals[i][1]]);
      i++;
    }
    while (heap.length && heap[0][1] < q) pop();                // the top ended before q: gone for every later query too
    if (heap.length) res[qi] = heap[0][0];
  }
  return res;
}`,
          java: `class Solution {
    public int[] minInterval(int[][] intervals, int[] queries) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));       // by start
        int q = queries.length;
        Integer[] order = new Integer[q];
        for (int i = 0; i < q; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(queries[a], queries[b]));
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));   // {size, end}
        int[] res = new int[q];
        Arrays.fill(res, -1);
        int i = 0;
        for (int qi : order) {
            int x = queries[qi];
            while (i < intervals.length && intervals[i][0] <= x) {           // every range that has started
                heap.add(new int[]{intervals[i][1] - intervals[i][0] + 1, intervals[i][1]});
                i++;
            }
            while (!heap.isEmpty() && heap.peek()[1] < x) heap.poll();       // the top ended before x: gone for every later query too
            if (!heap.isEmpty()) res[qi] = heap.peek()[0];
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
        sort(intervals.begin(), intervals.end());                            // by start
        int q = queries.size();
        vector<int> order(q), res(q, -1);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return queries[a] < queries[b]; });
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;   // {size, end}
        int i = 0;
        for (int qi : order) {
            int x = queries[qi];
            while (i < (int)intervals.size() && intervals[i][0] <= x) {      // every range that has started
                heap.push({intervals[i][1] - intervals[i][0] + 1, intervals[i][1]});
                i++;
            }
            while (!heap.empty() && heap.top().second < x) heap.pop();       // the top ended before x: gone for every later query too
            if (!heap.empty()) res[qi] = heap.top().first;
        }
        return res;
    }
};` } },
        starter: { py: 'class Solution:\n    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:\n        ', js: 'function minInterval(intervals, queries) {\n  \n}' },
        tests: { fn: 'minInterval', sig: { args: ['int[][]', 'int[]'] }, cases: [
          { args: [[[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]], out: [3, 3, 1, 4] }, { args: [[[1, 10], [3, 5], [4, 4]], [1, 4, 5, 11]], out: [10, 1, 3, -1] },
          { args: [[[1, 3]], [5]], out: [-1] }, { args: [[[5, 5]], [5]], out: [1] }, { args: [[[2, 3], [2, 5], [1, 8], [20, 25]], [19, 2, 22, 5]], out: [-1, 2, 6, 4] }] } },

      { lc: 986,
        hints: ['Both lists are sorted and internally disjoint, so you should be able to walk them together without sorting. How do you get the overlap of two ranges, if any?', 'Their overlap runs from the larger start to the smaller end, and exists when that start is no later than that end.', 'After recording any overlap, advance the pointer of the range that ends first: it cannot meet anything further in the other list.'],
        solution: { explain: 'Two pointers. The overlap of the current pair is `[max(starts), min(ends)]` when non-empty; then move past whichever range ends first. O(n + m).', code: {
          py: `class Solution:
    def intervalIntersection(self, firstList: List[List[int]], secondList: List[List[int]]) -> List[List[int]]:
        i = j = 0
        res = []
        while i < len(firstList) and j < len(secondList):
            lo = max(firstList[i][0], secondList[j][0])
            hi = min(firstList[i][1], secondList[j][1])
            if lo <= hi:                                  # the two ranges share [lo, hi]
                res.append([lo, hi])
            if firstList[i][1] < secondList[j][1]:        # the one that ends first can't meet anything more
                i += 1
            else:
                j += 1
        return res`,
          js: `function intervalIntersection(firstList, secondList) {
  let i = 0, j = 0;
  const res = [];
  while (i < firstList.length && j < secondList.length) {
    const lo = Math.max(firstList[i][0], secondList[j][0]);
    const hi = Math.min(firstList[i][1], secondList[j][1]);
    if (lo <= hi) res.push([lo, hi]);                     // the two ranges share [lo, hi]
    if (firstList[i][1] < secondList[j][1]) i++;          // the one that ends first can't meet anything more
    else j++;
  }
  return res;
}`,
          java: `class Solution {
    public int[][] intervalIntersection(int[][] firstList, int[][] secondList) {
        List<int[]> res = new ArrayList<>();
        int i = 0, j = 0;
        while (i < firstList.length && j < secondList.length) {
            int lo = Math.max(firstList[i][0], secondList[j][0]);
            int hi = Math.min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) res.add(new int[]{lo, hi});                  // the two ranges share [lo, hi]
            if (firstList[i][1] < secondList[j][1]) i++;               // the one that ends first can't meet anything more
            else j++;
        }
        return res.toArray(new int[0][]);
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> intervalIntersection(vector<vector<int>>& firstList, vector<vector<int>>& secondList) {
        vector<vector<int>> res;
        size_t i = 0, j = 0;
        while (i < firstList.size() && j < secondList.size()) {
            int lo = max(firstList[i][0], secondList[j][0]);
            int hi = min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) res.push_back({lo, hi});                     // the two ranges share [lo, hi]
            if (firstList[i][1] < secondList[j][1]) i++;               // the one that ends first can't meet anything more
            else j++;
        }
        return res;
    }
};` } },
        starter: { py: 'class Solution:\n    def intervalIntersection(self, firstList: List[List[int]], secondList: List[List[int]]) -> List[List[int]]:\n        ', js: 'function intervalIntersection(firstList, secondList) {\n  \n}' },
        tests: { fn: 'intervalIntersection', sig: { args: ['int[][]', 'int[][]'] }, cases: [
          { args: [[[0, 2], [5, 10], [13, 23], [24, 25]], [[1, 5], [8, 12], [15, 24], [25, 26]]], out: [[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]] },
          { args: [[[1, 3], [5, 9]], []], out: [] }, { args: [[], [[4, 8]]], out: [] }, { args: [[[1, 7]], [[3, 10]]], out: [[3, 7]] },
          { args: [[[1, 3], [5, 6]], [[2, 2], [3, 5]]], out: [[2, 2], [3, 3], [5, 5]] }] } },

      { lc: 452,
        hints: ['A single shot at position x bursts every balloon whose horizontal span contains x. Where is the best place to shoot first?', 'Sort by end. The first balloon’s end is the furthest right you can shoot and still hit it, which also hits the most others.', 'Shoot at the first end. Walk on; a balloon that starts after the last shot needs a new shot, placed at its own end.'],
        solution: { explain: 'Same sort as the greedy scheduling: sort by end, shoot at the end of the first, and start a new shot whenever a balloon begins after the last shot position. O(n log n).', code: {
          py: `class Solution:
    def findMinArrowShots(self, points: List[List[int]]) -> int:
        if not points:
            return 0
        points.sort(key=lambda p: p[1])               # by right edge
        shots, pos = 1, points[0][1]                  # shoot at the first right edge
        for s, e in points[1:]:
            if s > pos:                               # this one starts after the last shot: a new shot
                shots += 1
                pos = e
        return shots`,
          js: `function findMinArrowShots(points) {
  if (!points.length) return 0;
  points.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));   // by right edge (no subtraction: it can overflow elsewhere)
  let shots = 1, pos = points[0][1];                                 // shoot at the first right edge
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] > pos) {                                        // this one starts after the last shot: a new shot
      shots++;
      pos = points[i][1];
    }
  }
  return shots;
}`,
          java: `class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));   // by right edge: compare, don't subtract (overflow)
        int shots = 1, pos = points[0][1];                            // shoot at the first right edge
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > pos) {                                 // this one starts after the last shot: a new shot
                shots++;
                pos = points[i][1];
            }
        }
        return shots;
    }
}`,
          cpp: `class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        if (points.empty()) return 0;
        sort(points.begin(), points.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // by right edge
        int shots = 1, pos = points[0][1];                            // shoot at the first right edge
        for (int i = 1; i < (int)points.size(); i++) {
            if (points[i][0] > pos) {                                 // this one starts after the last shot: a new shot
                shots++;
                pos = points[i][1];
            }
        }
        return shots;
    }
};` } },
        starter: { py: 'class Solution:\n    def findMinArrowShots(self, points: List[List[int]]) -> int:\n        ', js: 'function findMinArrowShots(points) {\n  \n}' },
        tests: { fn: 'findMinArrowShots', sig: { args: ['int[][]'] }, cases: [
          { args: [[[10, 16], [2, 8], [1, 6], [7, 12]]], out: 2 }, { args: [[[1, 2], [3, 4], [5, 6], [7, 8]]], out: 4 }, { args: [[[1, 2], [2, 3], [3, 4], [4, 5]]], out: 2 },
          { args: [[[1, 2]]], out: 1 }, { args: [[[-2147483646, -2147483645], [2147483646, 2147483647]]], out: 2 }] } }
    ],

    mistakes: [
      '**Sorting by the wrong field.** Combining ranges needs a sort by **start**; choosing a maximum compatible set needs a sort by **end**. Swap them and the code looks right and fails on a long range that starts first.',
      '**Copying the new end instead of taking the max.** `last[1] = end` shrinks the stretch when the new range sits inside it (`[1,10]` then `[2,3]` becomes `[1,3]`). It is always `max(last end, end)`.',
      '**Getting touching endpoints wrong.** `[1,4]` and `[4,5]` overlap under closed ranges (merge uses `<=`), but a meeting ending at 4 and one starting at 4 do not need two rooms. Read the problem, pick `<` or `<=` on purpose, and say which.',
      '**Forgetting that the sort is part of the cost.** The pass is O(n), but the answer is O(n log n) unless the input is promised sorted. Claiming O(n) for merging an unsorted list is a common slip.',
      '**Sorting events with the start before the end at the same time.** A meeting ending at 5 and one starting at 5 then look like an overlap and the room count is one too high. Sort `(time, -1)` before `(time, +1)`.',
      '**Mutating the list you are looping over.** Deleting or editing ranges during a pass skips the next one. Build a new answer list, or edit only the last element of it.',
      '**Starting the answer from an empty list without a guard.** `merged[-1]` on an empty list crashes. Either open with the first range (and handle empty input) or test `if not merged or start > merged[-1][1]`.',
      '**Subtracting in a comparator.** `(a, b) -> a[1] - b[1]` overflows with values near the integer limits, and the sort quietly returns a wrong order. Use `Integer.compare` in Java, a comparison in C++ and JS.',
      '**Pushing an expired range’s answer in the query-with-heap problem.** The heap must drop a range once its end is before the query, not only compare sizes; otherwise the smallest range may not contain the query at all.',
      '**Using a difference array when coordinates are huge.** An array sized to the largest value is O(R) memory and time. If values reach 10⁹, sort the events instead.',
      '**Assuming the input is sorted.** The three-phase insert only works because the list is sorted and disjoint. Applying it to an unsorted list silently gives a wrong answer.'
    ],

    quiz: [
      { kind: 'concept', q: 'You want to merge overlapping ranges in one pass. What do you sort by, and why does that make a single pass enough?',
        choices: ['By start: any range that overlaps the current stretch must be the very next one, since later ones start even further right', 'By end: the last range ends furthest right', 'By length: short ranges merge first', 'You do not need to sort; a hash set of points is enough'], answer: 0,
        explain: 'Sorted by start, once a range starts after the current stretch ends, every later range does too. So only the next range can still overlap, and one pass suffices.' },
      { kind: 'concept', q: 'You are keeping the **most** ranges that do not overlap. Which sort gives the correct greedy?',
        choices: ['By end time, taking each range that starts at or after the last kept end', 'By start time, taking the earliest starts', 'By length, taking the shortest first', 'By number of overlaps, fewest first'], answer: 0,
        explain: 'A range that finishes earliest leaves the most room. Sorting by start fails when a long range begins first and blocks many short ones; the length and conflict-count versions each have small counterexamples.' },
      { kind: 'complexity', q: 'What is the time complexity of merging n unsorted ranges with sort-then-pass?',
        choices: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], answer: 0,
        explain: 'The sort costs O(n log n). The pass afterwards is O(n), so the sort dominates. O(n) only holds if the input is already sorted.' },
      { kind: 'bug', q: 'This merge is meant to combine overlapping ranges, but `[[1,10],[2,3]]` comes back as `[[1,3]]`. What is wrong?',
        code: `intervals.sort(key=lambda iv: iv[0])
merged = [intervals[0]]
for start, end in intervals[1:]:
    if start <= merged[-1][1]:
        merged[-1][1] = end
    else:
        merged.append([start, end])`,
        lang: 'py',
        choices: ['It copies `end` into the stretch; it should take `max(merged[-1][1], end)`', 'The sort should be by end', 'It should compare `start < merged[-1][0]`', 'It needs to reverse the list first'], answer: 0,
        explain: 'A later range can sit entirely inside the current stretch. Overwriting the end with its smaller end shrinks the stretch. Use the larger of the two ends.' },
      { kind: 'concept', q: 'In the sweep line for meeting rooms, events are `(time, +1)` for a start and `(time, -1)` for an end. Why must an end sort before a start at the same time?',
        choices: ['A meeting that ends at 5 and one that starts at 5 can share a room, so the room should be freed before it is taken again', 'To make the sort stable', 'Because ends are always smaller numbers', 'It does not matter which comes first'], answer: 0,
        explain: 'If the start were processed first, the count would briefly include both meetings and the peak would be one too high. Ends first keeps touching meetings from counting as overlapping.' },
      { kind: 'concept', q: 'In the min-heap solution to meeting rooms, what does the heap hold and what does its size mean at the end?',
        choices: ['The end times of rooms in use; the final size is the number of rooms needed', 'The start times of all meetings; the size is the number of meetings', 'Every meeting sorted by length; the size is the longest meeting', 'The gaps between meetings; the size is the number of gaps'], answer: 0,
        explain: 'For each meeting, if the smallest end is at or before its start the room is reused (replace the top), otherwise a new room is opened (push). Every room that was ever opened still has an entry, so the size is the room count.' },
      { kind: 'pattern', q: 'Which problem is the best fit for sort-then-pass over ranges?',
        choices: ['Combine a list of booked time slots into the smallest set of distinct busy stretches', 'Find the longest substring without a repeated letter', 'Find two numbers in an array that sum to a target', 'Count the number of islands in a grid'], answer: 0,
        explain: 'Busy stretches built from overlapping slots are exactly merging ranges. The substring is a sliding window, the two-number sum is a hash map, and islands are a grid search.' },
      { kind: 'concept', q: 'Which statements about the difference array for counting overlaps are true? Pick every one that applies.',
        choices: ['Add 1 at each start and subtract 1 at each end, then take a running sum', 'It is the prefix-sum idea run backwards', 'It is a good fit when the coordinates are huge, like values up to 10⁹', 'The maximum of the running sum is the number of overlapping ranges at the busiest point'], answer: [0, 1, 3],
        explain: 'The array is sized to the coordinate range, so with huge values it is too big; sort the events instead. For small coordinates it is simple and linear.' },
      { kind: 'concept', q: 'You insert a new range into a sorted list of non-overlapping ranges. Which approach is O(n) with no sort?',
        choices: ['Copy ranges ending before the new one starts, absorb every range that overlaps it, then copy the rest', 'Append, sort the whole list, then merge', 'Binary search and shift the array one element at a time without merging', 'Insert at the end and let later queries sort it'], answer: 0,
        explain: 'The list is sorted and disjoint, so the three groups (before, overlapping, after) come out left to right. One pass, and the output stays sorted.' },
      { kind: 'pattern', q: 'You are given queries (single values) and a list of ranges, and each query asks for the smallest range that contains it. Which approach avoids O(n·q)?',
        choices: ['Sort queries and ranges, sweep with a min-heap of the ranges that have started, and drop ones that ended before the query', 'Merge all ranges first and look each query up', 'Sort the ranges by end and binary search each query', 'Use a hash map from every integer to its range'], answer: 0,
        explain: 'With queries in increasing order, a range that has expired once is useless for every later query, so it can be popped off the heap for good. Merging would lose the sizes of the individual ranges.' }
    ],

    flashcards: [
      { id: 'iv-sort-start', front: 'Merging ranges: what do you sort by, and why?', back: 'By **start**. Then anything overlapping the current stretch is the very next range, so one pass is enough. Cost is O(n log n), dominated by the sort.' },
      { id: 'iv-merge-rule', front: 'The merge step, in one line?', back: 'If `start <= last end`: `last end = max(last end, end)`. Otherwise start a new range. The `max` matters: a range can sit inside the current one.' },
      { id: 'iv-overlap-test', front: 'The two-range overlap test?', back: '`a.start <= b.end` and `b.start <= a.end` for closed ranges. Half-open `[s, e)` makes both comparisons strict. State which rule you are using.' },
      { id: 'iv-insert', front: 'Insert into a sorted, disjoint list: the plan?', back: 'Three phases, O(n), no sort: copy ranges that end before the new start; absorb every range that starts at or before the new end (min start, max end); copy the rest.' },
      { id: 'iv-sort-end', front: 'Max set of non-overlapping ranges: sort by what?', back: 'By **end**. Keep a range if it starts at or after the last kept end. Removals = n − kept. Sorting by start fails on one long early range.' },
      { id: 'iv-start-vs-end', front: 'Rule of thumb for the two sorts?', back: '**Start to combine, end to choose.** Combining needs neighbours by start; choosing the most needs the earliest finish.' },
      { id: 'iv-sweep', front: 'How does the sweep line count rooms?', back: 'Each range gives `(start, +1)` and `(end, -1)`. Sort events; ends before starts at ties. Keep a running total; its maximum is the number of rooms.' },
      { id: 'iv-heap', front: 'Meeting rooms with a heap: the loop?', back: 'Sort by start; keep a min-heap of end times. If the smallest end <= this start, replace it with this end (room reused); else push (new room). Answer is the heap size.' },
      { id: 'iv-diff', front: 'Difference array for overlaps?', back: '`diff[start] += 1; diff[end] -= 1`, then a running sum gives the coverage at each point. O(n + R): fine for small coordinates, wrong for huge ones. It is the prefix-sum trick backwards.' },
      { id: 'iv-queries', front: 'Smallest range containing each query: the approach?', back: 'Sort queries (keep original positions) and ranges by start. For each query push ranges with start <= q into a min-heap by size, pop while the top ends before q, answer the top. O((n + q) log).' },
      { id: 'iv-two-lists', front: 'Intersecting two sorted lists of ranges?', back: 'Two pointers. Overlap is `[max starts, min ends]` if non-empty. Then advance the pointer whose range ends first. O(n + m).' },
      { id: 'iv-comparator', front: 'Comparator trap with ranges in Java or C++?', back: 'Subtracting (`a[0] - b[0]`) can overflow near the integer limits. Use `Integer.compare`, or a plain `<` comparison, in the comparator.' }
    ],

    deeper: [
      { title: 'Interval scheduling (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Interval_scheduling', time: 'about 15 min', note: 'The maximum non-overlapping set, the earliest-finish greedy and the weighted version that needs dynamic programming.' },
      { title: 'Sweep line algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sweep_line_algorithm', time: 'about 15 min', note: 'The general idea behind the events-and-a-running-total trick, with geometry examples beyond intervals.' },
      { title: 'heapq: heap queue algorithm (Python docs)', url: 'https://docs.python.org/3/library/heapq.html', time: 'about 10 min', note: 'Push, pop, replace and the tuple trick for keyed heaps, which the meeting-rooms and query-with-heap solutions use.' },
      { title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', time: 'browse', note: 'Where intervals sits among the other patterns, with a short video walkthrough for each of the problems in this lesson.' }
    ],

    detective: [
      { id: 'bakery-ovens', decoys: ['heaps', 'greedy', 'sorting'],
        statement: 'A bakery takes pre-orders where each batch of loaves must sit in an oven from a given start minute until a given finish minute. An oven holds one batch at a time, but it can take a new batch the very minute the previous one comes out. The owner has the whole day’s list, in whatever order the orders came in, and wants to know the fewest ovens she must own so that every batch can be baked exactly when the customer asked.',
        why: 'Each order is a **span on a timeline**, and the answer is the largest number of spans that are alive at the same moment. Turning the day into “something starts, something stops” events and keeping a running count (or keeping the finish times of ovens in use in a min-heap) gives it after a sort. The minute-it-frees detail is the touching-endpoint rule.' },
      { id: 'trail-closures', decoys: ['sorting', 'two-pointers', 'prefix-sums'],
        statement: 'A park ranger keeps a notebook of closed stretches of a long trail, each written as a pair of mile markers: from here to there. Different rangers wrote their notes on different days, so stretches sit in the notebook in no order, and many of them run into each other or lie inside bigger ones. The ranger wants one clean list for the park website: each entry a separate closed section, with no two entries that touch or cross.',
        why: 'The facts are **spans on a line** that have to be fused wherever they run into each other. Sorting by where each starts makes the only candidate for fusing the span right after, and one pass keeping the current section’s far end does the rest. Watch for the span that sits entirely inside another: the far end must never shrink.' },
      { id: 'stage-slots', decoys: ['greedy', 'dp-1d', 'sorting'],
        statement: 'A small festival has one stage and a stack of requests from bands, each asking for a fixed slot from one time to another. No two bands can play at once, but one may begin the moment the previous one finishes. The organiser wants to book as many different bands as possible and would like a rule she can apply while reading the requests one by one, not a search through every combination.',
        why: 'Requests are **spans**, and the aim is the **largest set that never clash**. The rule that works is to look at them in order of when they **finish** and take each that begins no earlier than the last one taken. Looking in order of start, or taking the shortest first, goes wrong on a request that is long and early.' }
    ]
  });
})();
