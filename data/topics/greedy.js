/* Offer Ready: Greedy. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it is written in. */
(function () {
  var OR = (window.OR = window.OR || {});

  (OR.topics = OR.topics || []).push({
    id: 'greedy',

    hook: 'Greedy is the shortest code in the interview and the hardest to defend. The loop is three lines; the proof that it is right is the real answer. Interviewers reach for it constantly (jump games, gas stations, scheduling, “can this string be balanced?”) because a candidate who just says “I took the best option each time” has said nothing, while one who says “and here is why swapping any other choice for mine can never hurt” has shown real maturity. It also pairs with a trap: the same-looking problem with a different rule (coin change with odd coins) needs dynamic programming, and knowing which side of that line you are on is the skill being tested.',

    cues: [
      'You must **optimize** something (fewest, most, earliest, smallest total) and each step offers a **choice** that does not need to be undone later.',
      'The input is a list you can **sort** by one key (finish time, ratio, size), after which one scan makes the choices.',
      'A question asks “**can I reach** the end?”, “**how many** pieces/jumps/rooms at least?”, or “**is there** a start from which a full trip works?”.',
      'You are tracking a **running best** (farthest reach, current fuel, a range of possible open brackets) that a single left-to-right pass can maintain in O(1) state.',
      'Brute force would try every subset or every order, but you can see that **a locally best choice never blocks a better global answer**.',
      'The trap: when you can build a small counterexample (coins 1, 3, 4 and amount 6), greedy is wrong and you want [1-D DP](#/topic/dp-1d). If you cannot argue why your choice is safe, do not trust it.'
    ],

    intuition: [
      'Think of packing a suitcase to fit as many outfits as possible when time is short. You grab whatever is on top, every time, and never reopen the case. That only works if grabbing the best-looking thing now cannot hurt you later. A **greedy algorithm** is exactly that: make one choice, commit, and never revisit it.',
      'Two ingredients make a greedy algorithm correct, and you should be able to name both. The **greedy-choice property** says some optimal answer starts with your locally best pick. **Optimal substructure** says that once you have committed, what is left is a smaller version of the same problem. If both hold, repeating the pick until nothing is left builds an optimal answer.',
      'The tool for proving the first one is the **exchange argument**. Take any optimal solution that does *not* use your pick. Show that you can swap one of its choices for yours without making it worse. Repeat the swap and you turn that optimal solution into one that agrees with greedy at every step, so greedy is optimal too. Example: to attend the most meetings, take the one that **ends earliest**. Any other optimal schedule starts with some meeting that ends no sooner; replace it with the earliest-ending one and nothing conflicts, because the replacement frees the room at least as soon.',
      'Greedy often comes in two flavors. **Sort, then scan**: the sort order is the greedy choice (sort meetings by end time, sort children by greed and cookies by size). **Running state**: no sort, just one pass with a variable like “farthest I can reach” or “fuel in the tank”, where each element can only help or hurt the state in a way you can reason about.',
      'The visualizer runs the second flavor: **farthest reach** for a row of jump lengths. At each index you ask “can I even stand here?” (is `i <= far`?), then push the frontier out to `max(far, i + nums[i])`. You never decide *which* cell to jump from. You only track how far *any* choice could take you, and that is enough to answer “can I reach the end?”. The **Jump Game II** switch adds the second variable, the end of the current jump’s range: when `i` reaches it, you must spend one more jump, and the new range ends at the farthest point seen. That is a breadth-first search done with two integers.',
      'When greedy fails, it fails visibly. With coins 1, 3, 4 and a target of 6, “take the biggest coin that fits” picks 4, then 1, then 1: three coins, while 3 + 3 uses two. The locally best pick (the biggest coin) did block a better global answer, so the greedy-choice property is false and you need to try the choices, which means [DP](#/topic/dp-1d). Always test your rule on a tiny case that could break it before you commit.'
    ].join('\n\n'),

    viz: 'jump-game',

    template: {
      title: 'Farthest reach with range ends (jump games)',
      note: 'One pass, three integers. **far** is the farthest index any visited cell can reach; **end** is the last index covered by the current jump. At each index: if `i > far`, nothing could land here, so the target is unreachable (**stuck**). Otherwise grow `far`. When `i` hits `end`, you have used up this jump’s range, so count one more jump and let the next range stretch out to `far`. The loop stops at `n - 2`, because standing on the last index needs no more jumps. For plain “can I reach the end?” ignore `jumps` and `end` and just test `far >= n - 1`. Returns -1 when the end is unreachable.',
      code: {
        py: `class Solution:
    def minJumps(self, nums):
        n = len(nums)
        jumps = end = far = 0                           #> far: farthest index reachable so far. end: where the current jump's range stops
        for i in range(n - 1):                          #@scan > Visit each index once, left to right
            if i > far:                                 #@stuck > No earlier cell reaches i: the end is unreachable
                return -1
            far = max(far, i + nums[i])                 #@reach > Push the frontier out
            if i == end:                                #@jump > Range exhausted: one more jump, and the new range ends at far
                jumps += 1                              #@jump
                end = far                               #@jump
        return jumps if far >= n - 1 else -1            #@done > The last index must be inside the frontier`,
        js: `function minJumps(nums) {
  const n = nums.length;
  let jumps = 0, end = 0, far = 0;                      //> far: farthest index reachable so far. end: where the current jump's range stops
  for (let i = 0; i < n - 1; i++) {                     //@scan > Visit each index once, left to right
    if (i > far) return -1;                             //@stuck > No earlier cell reaches i: the end is unreachable
    far = Math.max(far, i + nums[i]);                   //@reach > Push the frontier out
    if (i === end) {                                    //@jump > Range exhausted: one more jump, and the new range ends at far
      jumps++;                                          //@jump
      end = far;                                        //@jump
    }
  }
  return far >= n - 1 ? jumps : -1;                     //@done > The last index must be inside the frontier
}`,
        java: `class Solution {
    public int minJumps(int[] nums) {
        int n = nums.length, jumps = 0, end = 0, far = 0;   //> far: farthest index reachable so far. end: where the current jump's range stops
        for (int i = 0; i < n - 1; i++) {                   //@scan > Visit each index once, left to right
            if (i > far) return -1;                         //@stuck > No earlier cell reaches i: the end is unreachable
            far = Math.max(far, i + nums[i]);               //@reach > Push the frontier out
            if (i == end) {                                 //@jump > Range exhausted: one more jump, and the new range ends at far
                jumps++;                                    //@jump
                end = far;                                  //@jump
            }
        }
        return far >= n - 1 ? jumps : -1;                   //@done > The last index must be inside the frontier
    }
}`,
        cpp: `class Solution {
public:
    int minJumps(vector<int>& nums) {
        int n = nums.size(), jumps = 0, end = 0, far = 0;   //> far: farthest index reachable so far. end: where the current jump's range stops
        for (int i = 0; i < n - 1; i++) {                   //@scan > Visit each index once, left to right
            if (i > far) return -1;                         //@stuck > No earlier cell reaches i: the end is unreachable
            far = max(far, i + nums[i]);                    //@reach > Push the frontier out
            if (i == end) {                                 //@jump > Range exhausted: one more jump, and the new range ends at far
                jumps++;                                    //@jump
                end = far;                                  //@jump
            }
        }
        return far >= n - 1 ? jumps : -1;                   //@done > The last index must be inside the frontier
    }
};`
      },
      tests: { fn: 'minJumps', sig: { args: ['int[]'] }, cases: [
        { args: [[2, 3, 1, 1, 4]], out: 2 }, { args: [[3, 2, 1, 0, 4]], out: -1 }, { args: [[0]], out: 0 }, { args: [[1, 1, 1, 1, 1]], out: 4 },
        { args: [[4, 1, 1, 3, 1, 1, 1]], out: 2 }, { args: [[0, 1]], out: -1 }, { args: [[2, 0, 0]], out: 1 }, { args: [[1, 2]], out: 1 }, { args: [[5, 9, 3, 2, 1, 0, 2, 3, 3, 1, 1, 0]], out: 3 }] }
    },

    complexity: {
      time: 'Usually O(n) for a running-state pass, O(n log n) when you sort first',
      space: 'O(1) for running state; O(n) if you keep a count table or a heap',
      why: 'Greedy has no branching: each element is looked at a constant number of times and each decision is made once and kept. So the cost is the cost of the **preparation** (a sort, usually O(n log n)) plus one scan (O(n)). The jump-game template does no sort and keeps three integers, so it is O(n) time and O(1) space. Compare that with the exhaustive or DP alternatives (O(2ⁿ) or O(n²)): greedy is cheap *because* it throws away choices, which is exactly why it needs a proof.',
      trap: 'Do not say “it is O(n)” without checking for a hidden sort: sorting intervals or ratios makes the whole thing O(n log n). Also, the real danger is not the complexity but **correctness**: a greedy that passes the examples can be wrong. Say aloud the exchange argument (“swapping any other first choice for mine cannot make it worse because ...”), and try one counterexample before you code.'
    },

    variations: [
      {
        name: 'Interval scheduling: sort by end, take what fits',
        body: 'The classic exchange-argument problem. You have meetings with start and end times and one room; attend the **most** meetings (a meeting may start exactly when another ends). Sort by **end time**, then scan: take a meeting if it starts at or after the end of the last one you took. Why end time? Any optimal schedule’s first meeting ends no earlier than the earliest-ending meeting overall, so swap them: the room is free at least as soon, and nothing after it conflicts. Repeat for the second pick, and so on. Sorting by **start** fails (one huge early meeting blocks everything) and sorting by **length** fails (a short meeting can sit across two long ones that would both have fit). “Remove the fewest meetings so none overlap” is the same problem: answer = total − max kept. See also [intervals](#/topic/intervals).',
        code: {
          py: `def maxMeetings(intervals):
    count, last = 0, float('-inf')
    for s, e in sorted(intervals, key=lambda x: x[1]):   # earliest finish first
        if s >= last:                                    # fits after the last one we took
            count += 1
            last = e
    return count`,
          js: `function maxMeetings(intervals) {
  let count = 0, last = -Infinity;
  for (const [s, e] of [...intervals].sort((a, b) => a[1] - b[1])) {   // earliest finish first
    if (s >= last) {                                                   // fits after the last one we took
      count++;
      last = e;
    }
  }
  return count;
}`,
          java: `class Solution {
    int maxMeetings(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1]));   // earliest finish first
        int count = 0, last = Integer.MIN_VALUE;
        for (int[] m : sorted) {
            if (m[0] >= last) {                                       // fits after the last one we took
                count++;
                last = m[1];
            }
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int maxMeetings(vector<vector<int>> intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b) { return a[1] < b[1]; });   // earliest finish first
        int count = 0, last = INT_MIN;
        for (auto& m : intervals) {
            if (m[0] >= last) {                                                                   // fits after the last one we took
                count++;
                last = m[1];
            }
        }
        return count;
    }
};`
        },
        tests: { fn: 'maxMeetings', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [2, 4], [3, 5]]], out: 2 }, { args: [[[0, 10], [1, 2], [3, 4], [5, 6]]], out: 3 }, { args: [[[1, 2], [1, 2], [1, 2]]], out: 1 },
          { args: [[]], out: 0 }, { args: [[[1, 5], [2, 3], [4, 6], [6, 8], [7, 9]]], out: 3 }] }
      },
      {
        name: 'When greedy fails: coin change',
        body: 'Pick the biggest coin that still fits, repeat. With coins **1, 5, 10, 25** this is optimal (each coin is a multiple of the one below it, and an exchange argument works). With coins **1, 3, 4** and amount 6 it returns 4 + 1 + 1 = **3 coins**, while 3 + 3 = **2** is better. The greedy-choice property is false: the biggest coin blocks the best answer. When you cannot prove the choice safe, or you find a small counterexample like this one, switch to DP: the best answer for amount a is 1 + the best over each coin c of a − c (see [1-D DP](#/topic/dp-1d)). The code below is the greedy version, kept here so you can run it on 1, 3, 4 and watch it lose.',
        code: {
          py: `def greedyCoins(coins, amount):
    count = 0
    for c in sorted(coins, reverse=True):     # biggest coin first
        count += amount // c
        amount %= c
    return count if amount == 0 else -1`,
          js: `function greedyCoins(coins, amount) {
  let count = 0;
  for (const c of [...coins].sort((a, b) => b - a)) {   // biggest coin first
    count += Math.floor(amount / c);
    amount %= c;
  }
  return amount === 0 ? count : -1;
}`
        },
        tests: { fn: 'greedyCoins', cases: [
          { args: [[1, 5, 10, 25], 63], out: 6 }, { args: [[1, 3, 4], 6], out: 3 }, { args: [[5], 3], out: -1 }, { args: [[2, 5], 6], out: -1 }] }   // greedy says -1, yet 2 + 2 + 2 works: it can even miss a solution
      },
      {
        name: 'Two ways to prove a greedy',
        body: '**Exchange argument:** assume an optimal answer that differs from greedy at the first place, and swap in the greedy choice without losing quality (interval scheduling, partition labels). **Greedy stays ahead:** show that after every step, greedy’s state is at least as good as any other strategy’s state, and by induction it is still ahead at the end (jump games: after i steps, `far` is the farthest anyone could be). For an interview, you rarely need a formal proof; you need one clear sentence for the *why*, plus one counterexample you tried and could not break.'
      },
      {
        name: 'Sort-then-scan family',
        body: 'The sort is the greedy choice. **Interval scheduling** sorts by end. **Merging and covering** sort by start. **Matching problems** (children and cookies, boats and people, tasks and workers) sort both sides and walk two pointers: give the smallest sufficient item to the neediest, never waste a big one on a small need. **Hand of Straights** sorts the distinct values (or uses an ordered count map) and always starts a group at the **smallest** card still left, since that card has nowhere else to go. After the sort, the scan is one pass; the whole cost is the sort, O(n log n).'
      },
      {
        name: 'Range of possibilities: parentheses with wildcards',
        body: 'When a character can mean several things, do not guess; track **all** the possibilities as a range. In a string of `(`, `)` and `*` (where `*` can be `(`, `)` or nothing), keep `lo` and `hi`: the smallest and largest number of **unmatched open** brackets the prefix could leave. `(` raises both, `)` lowers both, `*` lowers `lo` and raises `hi`. If `hi` ever goes negative, too many `)` for any reading: false. Clamp `lo` at 0 (you can always read a `*` as nothing). The string is valid if `lo == 0` at the end. Every counter is O(1) and the pass is O(n).'
      },
      {
        name: 'Greedy with a heap',
        body: 'When the best choice changes as you go, keep the candidates in a [heap](#/topic/heaps) and pull the best one each time: scheduling the tasks with the most time left first, merging the two smallest files, always refuelling at the biggest station you passed. The pattern is “scan, push what became available, pop the best”. It costs O(n log n). Pure greedy is O(n) because the choice is fixed by order; the heap version pays a log factor to keep that choice up to date.'
      },
      {
        name: 'Greedy or DP? A quick test',
        body: 'Ask: after I commit to the locally best move, is the leftover problem still the **same shape**, with no regret? If yes, greedy. If one early choice changes **which later choices are cheapest** (coin sizes that do not divide, a 0/1 knapsack, longest paths), you need DP. In practice: try a 3-to-5 element counterexample by hand. If greedy and brute force agree on your tiny cases and you can say why a swap never hurts, trust it. If you cannot, write the recurrence instead.'
      }
    ],

    worked: [
      {
        lc: 55,
        restate: 'You stand at index 0 of an array of non-negative whole numbers. The number at each index is the **longest** jump you may take from there (you may also take any shorter one, down to 1 step). Return true if you can land on the last index, false if you cannot.',
        examples: '- `[2,3,1,1,4]` → `true`: jump 1 step to the 3, then 3 steps to the end.\n- `[3,2,1,0,4]` → `false`: every route ends on the 0 at index 3, which cannot move.\n- Edge cases: `[0]` is `true` (you are already at the end); `[0,1]` is `false`; a big number early makes everything after it irrelevant.',
        brute: 'Try every jump length from every reachable cell with recursion, or fill a table `can[i]` by looking at all earlier cells that could jump onto i. That is exponential without caching and O(n²) with it, both much more than needed.',
        insight: 'You never need to know **which** path gets you somewhere, only **how far** any path could take you. Keep `far`, the farthest index reachable by any visited cell. Walk left to right. If you reach an index `i` greater than `far`, no earlier cell could land on it and nothing after it can be reached either: return false. Otherwise update `far = max(far, i + nums[i])`. Every cell between 0 and `far` is reachable (any jump can be shortened), so the frontier is an unbroken range, which is why one number is enough. If the loop finishes, the last index was never beyond the frontier: true.',
        code: {
          py: `class Solution:
    def canJump(self, nums: List[int]) -> bool:
        far = 0                                  # farthest index any visited cell can reach
        for i, step in enumerate(nums):
            if i > far:                          # nothing lands here: stuck behind a gap
                return False
            far = max(far, i + step)
        return True`,
          js: `function canJump(nums) {
  let far = 0;                                   // farthest index any visited cell can reach
  for (let i = 0; i < nums.length; i++) {
    if (i > far) return false;                   // nothing lands here: stuck behind a gap
    far = Math.max(far, i + nums[i]);
  }
  return true;
}`,
          java: `class Solution {
    public boolean canJump(int[] nums) {
        int far = 0;                             // farthest index any visited cell can reach
        for (int i = 0; i < nums.length; i++) {
            if (i > far) return false;           // nothing lands here: stuck behind a gap
            far = Math.max(far, i + nums[i]);
        }
        return true;
    }
}`,
          cpp: `class Solution {
public:
    bool canJump(vector<int>& nums) {
        int far = 0;                             // farthest index any visited cell can reach
        for (int i = 0; i < (int)nums.size(); i++) {
            if (i > far) return false;           // nothing lands here: stuck behind a gap
            far = max(far, i + nums[i]);
        }
        return true;
    }
};`
        },
        tests: { fn: 'canJump', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 3, 1, 1, 4]], out: true }, { args: [[3, 2, 1, 0, 4]], out: false }, { args: [[0]], out: true }, { args: [[0, 1]], out: false },
          { args: [[2, 0, 0]], out: true }, { args: [[1, 0, 1]], out: false }, { args: [[5, 0, 0, 0, 0, 0]], out: true }] },
        complexity: 'O(n) time, one pass; O(1) space for two variables.',
        say: '“I only need to know how far I can possibly get. I keep `far`, the farthest index reachable from anything I have visited. Walking left to right, if I land on an index past `far`, nothing could have reached it, so I return false. Otherwise I extend `far` with `i + nums[i]`. Every index up to `far` is reachable because a jump can always be shortened, so one integer is enough. O(n) time, O(1) space.”',
        followups: [
          { q: 'Why is it safe to ignore which cell you jump from?', a: 'Because jumps can be shortened, the set of reachable indices is always a prefix, 0 to `far`. Any cell in that prefix could be the launch point, and `far` already holds the best result of all of them. That is the greedy-stays-ahead argument.' },
          { q: 'Can you stop early?', a: 'Yes: return true as soon as `far >= n - 1`. It does not change the complexity, but it is a nice touch.' },
          { q: 'What about going backwards instead?', a: 'Keep a `goal` index, starting at the last one. Scan from the right: if `i + nums[i] >= goal`, then i can reach the goal, so move the goal to i. The answer is `goal == 0`. Same O(n), same idea seen from the other end.' }
        ]
      },

      {
        lc: 45,
        restate: 'Same jumping array as before, but now you are told the last index **is** reachable. Return the **minimum number of jumps** needed to get from index 0 to the last index.',
        examples: '- `[2,3,1,1,4]` → `2`: 0 → 1 → 4.\n- `[2,3,0,1,4]` → `2`.\n- Edge cases: a single element needs `0` jumps; `[1,2]` needs `1`; all ones need n − 1.',
        brute: 'DP: `best[i]` = fewest jumps to reach i, computed by trying every earlier cell that can land on i. That is O(n²). A BFS over indices is equivalent and also O(n²) in the worst case.',
        insight: 'Think of breadth-first search by **levels**, without building a queue. Level k is the set of indices reachable in exactly k jumps, and because jumps can be shortened, that set is an unbroken range. Track `end`, the last index of the current level, and `far`, the farthest index any cell in the level can reach (which is where the next level ends). Scan the indices: keep growing `far`; when `i` reaches `end`, the current level is used up, so you need one more jump to move on, and the next level ends at `far`. The number of times you did that is the answer. Stop at `n - 2`: once you are standing at the last index you need no extra jump, and counting it would overshoot by one.',
        code: {
          py: `class Solution:
    def jump(self, nums: List[int]) -> int:
        jumps = end = far = 0                    # end: last index of the current level
        for i in range(len(nums) - 1):           # the last index needs no jump from it
            far = max(far, i + nums[i])
            if i == end:                         # this level is exhausted
                jumps += 1
                end = far                        # the next level reaches as far as anything saw
        return jumps`,
          js: `function jump(nums) {
  let jumps = 0, end = 0, far = 0;               // end: last index of the current level
  for (let i = 0; i < nums.length - 1; i++) {    // the last index needs no jump from it
    far = Math.max(far, i + nums[i]);
    if (i === end) {                             // this level is exhausted
      jumps++;
      end = far;                                 // the next level reaches as far as anything saw
    }
  }
  return jumps;
}`,
          java: `class Solution {
    public int jump(int[] nums) {
        int jumps = 0, end = 0, far = 0;         // end: last index of the current level
        for (int i = 0; i < nums.length - 1; i++) {   // the last index needs no jump from it
            far = Math.max(far, i + nums[i]);
            if (i == end) {                      // this level is exhausted
                jumps++;
                end = far;                       // the next level reaches as far as anything saw
            }
        }
        return jumps;
    }
}`,
          cpp: `class Solution {
public:
    int jump(vector<int>& nums) {
        int jumps = 0, end = 0, far = 0;         // end: last index of the current level
        for (int i = 0; i < (int)nums.size() - 1; i++) {   // the last index needs no jump from it
            far = max(far, i + nums[i]);
            if (i == end) {                      // this level is exhausted
                jumps++;
                end = far;                       // the next level reaches as far as anything saw
            }
        }
        return jumps;
    }
};`
        },
        tests: { fn: 'jump', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 3, 1, 1, 4]], out: 2 }, { args: [[2, 3, 0, 1, 4]], out: 2 }, { args: [[0]], out: 0 }, { args: [[1, 2]], out: 1 },
          { args: [[1, 1, 1, 1]], out: 3 }, { args: [[4, 1, 1, 3, 1, 1, 1]], out: 2 }, { args: [[10, 1, 1, 1, 1, 1]], out: 1 }] },
        complexity: 'O(n) time, each index visited once; O(1) space. The BFS and DP versions are O(n²).',
        say: '“This is BFS by levels, using two integers instead of a queue. The indices reachable in k jumps form a range. `end` marks where the current range stops and `far` is the farthest anything in it can reach. When I step onto `end`, I have to take another jump, so I count it and set `end = far`. I stop before the last index because I do not need a jump from it. It is O(n) time and O(1) space, versus O(n²) for the DP.”',
        followups: [
          { q: 'Why does the loop stop at n - 2?', a: 'If it ran to the last index, then when `end` equals `n - 1` the code would count one extra jump from a cell you have already arrived at. Stopping one early avoids that without a special case.' },
          { q: 'How do you recover the actual jumps, not just the count?', a: 'Remember, for each level, which index gave the farthest reach (`argmax` of `i + nums[i]`), and store it when `i == end`. That chain of indices is one optimal route.' }
        ]
      },

      {
        lc: 134,
        restate: 'Fuel stations sit on a circular road. Station i holds `gas[i]` units of fuel and the trip from station i to the next one costs `cost[i]`. You start with an empty tank at a station of your choice and drive around in the forward direction. Return the index of a station from which you can complete the full loop, or -1 if none exists. If an answer exists, it is unique.',
        examples: '- `gas=[1,2,3,4,5]`, `cost=[3,4,5,1,2]` → `3`: start at station 3, fill 4, spend 1, fill 5, spend 2, and so on around.\n- `gas=[2,3,4]`, `cost=[3,4,3]` → `-1`: the total fuel (9) is less than the total cost (10).\n- Edge cases: one station (`[5]`, `[4]` → `0`); a start whose own trip is impossible (a station where `gas < cost` can never be the start by itself).',
        brute: 'Try every station as the start and simulate a full lap. That is O(n²): for each of n starts, walk up to n stations.',
        insight: 'Two facts. **One:** if the total fuel is at least the total cost, some start works (the surplus and deficit stretches around the circle can be rotated so that the surplus comes first). If total fuel is smaller, nothing works. **Two:** while simulating from a start, if the tank goes **negative** at station j, then **no station between the start and j can be the answer either**. Each of them arrived at its position with a tank of at least 0 (the run from the start had not gone negative before j), so starting there with an empty tank is no better and would fail at j too. So jump the candidate to `j + 1` and reset the tank. After one pass, the last candidate is the answer, provided the total is not negative. One scan, two sums.',
        code: {
          py: `class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        total = tank = start = 0
        for i in range(len(gas)):
            d = gas[i] - cost[i]
            total += d                           # net fuel over the whole circle
            tank += d                            # fuel since the current start
            if tank < 0:                         # cannot reach i + 1 from start
                start = i + 1                    # no start in [start, i] can work
                tank = 0
        return start if total >= 0 else -1`,
          js: `function canCompleteCircuit(gas, cost) {
  let total = 0, tank = 0, start = 0;
  for (let i = 0; i < gas.length; i++) {
    const d = gas[i] - cost[i];
    total += d;                                  // net fuel over the whole circle
    tank += d;                                   // fuel since the current start
    if (tank < 0) {                              // cannot reach i + 1 from start
      start = i + 1;                             // no start in [start, i] can work
      tank = 0;
    }
  }
  return total >= 0 ? start : -1;
}`,
          java: `class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int d = gas[i] - cost[i];
            total += d;                          // net fuel over the whole circle
            tank += d;                           // fuel since the current start
            if (tank < 0) {                      // cannot reach i + 1 from start
                start = i + 1;                   // no start in [start, i] can work
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }
}`,
          cpp: `class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < (int)gas.size(); i++) {
            int d = gas[i] - cost[i];
            total += d;                          // net fuel over the whole circle
            tank += d;                           // fuel since the current start
            if (tank < 0) {                      // cannot reach i + 1 from start
                start = i + 1;                   // no start in [start, i] can work
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }
};`
        },
        tests: { fn: 'canCompleteCircuit', sig: { args: ['int[]', 'int[]'] }, cases: [
          { args: [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], out: 3 }, { args: [[2, 3, 4], [3, 4, 3]], out: -1 }, { args: [[5], [4]], out: 0 },
          { args: [[3, 1, 1], [1, 2, 2]], out: 0 }, { args: [[2, 0, 0, 3], [1, 1, 1, 1]], out: 3 }, { args: [[4], [5]], out: -1 }] },
        complexity: 'O(n) time, one pass; O(1) space.',
        say: '“If total gas is less than total cost, no start works. Otherwise a start exists, and I find it in one pass: I keep the tank since my current candidate. When it goes negative at station i, every station from the candidate to i also fails, because they all arrived with at least an empty tank and would run dry at the same spot. So the candidate becomes i + 1 and the tank resets. The final candidate is the answer. O(n) time, O(1) space, versus O(n²) for trying every start.”',
        followups: [
          { q: 'Why does a start exist whenever the total is non-negative?', a: 'Take the point where the running sum of `gas[i] - cost[i]` (from station 0) is lowest. Starting just after it, every prefix sum of the rotated order is non-negative, because the circle’s total is non-negative and we began right after the deepest dip. That station is a valid start.' },
          { q: 'Why is the answer unique when it exists?', a: 'The problem states uniqueness as a guarantee. With ties (a zero-net stretch) several starts could work; the scan returns the first candidate it settles on after the last reset.' }
        ]
      },

      {
        lc: 763,
        restate: 'You get a string of lowercase letters. Cut it into as many consecutive pieces as possible so that **each letter appears in at most one piece**. Return the lengths of the pieces in order. Joining the pieces gives back the original string.',
        examples: '- `"ababcbacadefegdehijhklij"` → `[9,7,8]`: pieces `ababcbaca`, `defegde`, `hijhklij`.\n- `"eccbbbbdec"` → `[10]`: the `e` at both ends forces one big piece.\n- Edge cases: one letter (`[1]`); all distinct letters give n pieces of length 1.',
        brute: 'For each possible cut position, check that the left part and the right part share no letter, using sets. That is O(n²) or worse, and it does not directly give the maximum number of pieces.',
        insight: 'Record the **last index** of every letter. Then scan left to right with two markers: `start` (where the current piece began) and `end` (the farthest last-occurrence of any letter seen in this piece so far). Each new character stretches `end` to its own last index. When the scan index `i` reaches `end`, every letter in the piece has had its final occurrence inside it, so the piece can close there. That cut is the earliest possible one, and cutting as early as you can leaves the most room for further cuts: the greedy choice. It is the “farthest reach” idea again, with last-occurrences instead of jump lengths.',
        code: {
          py: `class Solution:
    def partitionLabels(self, s: str) -> List[int]:
        last = {ch: i for i, ch in enumerate(s)}      # last index of each letter
        res, start, end = [], 0, 0
        for i, ch in enumerate(s):
            end = max(end, last[ch])                  # this piece must stretch to here
            if i == end:                              # every letter in it has ended: cut
                res.append(end - start + 1)
                start = i + 1
        return res`,
          js: `function partitionLabels(s) {
  const last = {};                                    // last index of each letter
  for (let i = 0; i < s.length; i++) last[s[i]] = i;
  const res = [];
  let start = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s[i]]);                  // this piece must stretch to here
    if (i === end) {                                  // every letter in it has ended: cut
      res.push(end - start + 1);
      start = i + 1;
    }
  }
  return res;
}`,
          java: `class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];                     // last index of each letter
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> res = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);   // this piece must stretch to here
            if (i == end) {                           // every letter in it has ended: cut
                res.add(end - start + 1);
                start = i + 1;
            }
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> partitionLabels(string s) {
        int last[26];                                 // last index of each letter
        for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;
        vector<int> res;
        int start = 0, end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            end = max(end, last[s[i] - 'a']);         // this piece must stretch to here
            if (i == end) {                           // every letter in it has ended: cut
                res.push_back(end - start + 1);
                start = i + 1;
            }
        }
        return res;
    }
};`
        },
        tests: { fn: 'partitionLabels', sig: { args: ['str'] }, cases: [
          { args: ['ababcbacadefegdehijhklij'], out: [9, 7, 8] }, { args: ['eccbbbbdec'], out: [10] }, { args: ['a'], out: [1] },
          { args: ['abc'], out: [1, 1, 1] }, { args: ['caedbdedda'], out: [1, 9] }, { args: ['aaabbb'], out: [3, 3] }] },
        complexity: 'O(n) time (two passes); O(1) space, since the table has at most 26 entries.',
        say: '“First I record the last index of each letter. Then I scan with `end`, the farthest last-occurrence among the letters in the current piece. Each character pushes `end` out. When my index reaches `end`, every letter in this piece has finished, so I close it there and start the next one. Closing as early as possible is safe: it leaves the most room for more pieces. Two O(n) passes, constant extra space.”',
        followups: [
          { q: 'Why is the earliest cut optimal?', a: 'Any valid piece that starts here must reach at least `end`, so a shorter piece is impossible. Taking exactly that and no more leaves the longest remaining string, and a longer remainder can never have fewer pieces. That is an exchange argument.' },
          { q: 'How is this like Jump Game?', a: 'Each letter “jumps” to its last index, `end` is `far`, and cutting when `i == end` is the range-end step of Jump Game II.' }
        ]
      }
    ],

    practice: [
      { lc: 55,
        hints: ['You do not need to know the path, only how far you could possibly get. What single number captures that?', 'Because a jump can be shortened, every index up to your frontier is reachable. When would an index be unreachable?', 'Walk left to right keeping `far = max(far, i + nums[i])`. If you ever stand on an `i` with `i > far`, return false.'],
        starter: { py: 'class Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        ', js: 'function canJump(nums) {\n  \n}' },
        tests: { fn: 'canJump', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 3, 1, 1, 4]], out: true }, { args: [[3, 2, 1, 0, 4]], out: false }, { args: [[0]], out: true }, { args: [[0, 1]], out: false },
          { args: [[2, 0, 0]], out: true }, { args: [[1, 0, 1]], out: false }] } },

      { lc: 45,
        hints: ['Think of the cells reachable in 1 jump, then in 2 jumps. What shape does each group have?', 'Each group is a range. The next range ends at the farthest any cell in the current range can reach. How do you know the current range is used up?', 'Keep `end` and `far`. When `i == end`, count a jump and set `end = far`. Stop the loop before the last index.'],
        starter: { py: 'class Solution:\n    def jump(self, nums: List[int]) -> int:\n        ', js: 'function jump(nums) {\n  \n}' },
        tests: { fn: 'jump', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 3, 1, 1, 4]], out: 2 }, { args: [[2, 3, 0, 1, 4]], out: 2 }, { args: [[0]], out: 0 }, { args: [[1, 2]], out: 1 },
          { args: [[1, 1, 1, 1]], out: 3 }, { args: [[10, 1, 1, 1, 1, 1]], out: 1 }] } },

      { lc: 134,
        hints: ['If the total fuel is less than the total cost, can any start work? What if it is not less?', 'Simulate from a candidate start. If the tank goes negative at station j, which stations between the start and j can you rule out, and why?', 'Keep `total` and `tank`. When `tank < 0`, set `start = i + 1` and reset the tank. Return `start` if `total >= 0`, otherwise -1.'],
        starter: { py: 'class Solution:\n    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:\n        ', js: 'function canCompleteCircuit(gas, cost) {\n  \n}' },
        tests: { fn: 'canCompleteCircuit', sig: { args: ['int[]', 'int[]'] }, cases: [
          { args: [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], out: 3 }, { args: [[2, 3, 4], [3, 4, 3]], out: -1 }, { args: [[5], [4]], out: 0 },
          { args: [[3, 1, 1], [1, 2, 2]], out: 0 }, { args: [[2, 0, 0, 3], [1, 1, 1, 1]], out: 3 }] } },

      { lc: 846,
        hints: ['If the card count is not a multiple of the group size, you can stop at once. Otherwise, which card must start a group?', 'The smallest card left cannot be in the middle of any group, since nothing smaller remains to start one. So it must start a group. How many groups must start at it?', 'Count the cards. Visit the values in increasing order; if value x still has `c` copies, each of x … x + g − 1 needs at least `c` copies: subtract `c` from each, fail if short.'],
        solution: { explain: 'Count each value. Going through the distinct values in increasing order, the smallest value left must start as many groups as it has copies, so subtract that many from each of the next `groupSize` values. If any is short, return false. O(n log n) for the sort, O(n) space.', code: {
          py: `class Solution:
    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:
        if len(hand) % groupSize:
            return False
        cnt = {}
        for x in hand:
            cnt[x] = cnt.get(x, 0) + 1
        for x in sorted(cnt):
            c = cnt[x]
            if c:                                   # c groups must start at x
                for y in range(x, x + groupSize):
                    if cnt.get(y, 0) < c:
                        return False
                    cnt[y] -= c
        return True`,
          js: `function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize) return false;
  const cnt = new Map();
  for (const x of hand) cnt.set(x, (cnt.get(x) || 0) + 1);
  for (const x of [...cnt.keys()].sort((a, b) => a - b)) {
    const c = cnt.get(x);
    if (c) {                                        // c groups must start at x
      for (let y = x; y < x + groupSize; y++) {
        if ((cnt.get(y) || 0) < c) return false;
        cnt.set(y, cnt.get(y) - c);
      }
    }
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:\n        ', js: 'function isNStraightHand(hand, groupSize) {\n  \n}' },
        tests: { fn: 'isNStraightHand', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 2, 3, 6, 2, 3, 4, 7, 8], 3], out: true }, { args: [[1, 2, 3, 4, 5], 4], out: false }, { args: [[1, 1, 2, 2, 3, 3], 3], out: true },
          { args: [[1, 2, 3], 1], out: true }, { args: [[1, 3], 2], out: false }, { args: [[5, 6, 7, 8], 2], out: true }] } },

      { lc: 1899,
        hints: ['Merging takes the larger value in each position. So which triplets can never be used, no matter what?', 'A triplet with any value above the target in its position would overshoot forever. Throw those away.', 'Among the rest, you need, for each of the three positions, some triplet that matches the target exactly there. Track three booleans.'],
        solution: { explain: 'Merging is a position-wise max, so any triplet that exceeds the target in some position can never be used. Among the safe ones, the answer is yes if each position is matched exactly by at least one of them. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def mergeTriplets(self, triplets: List[List[int]], target: List[int]) -> bool:
        hit = [False] * 3
        for t in triplets:
            if t[0] <= target[0] and t[1] <= target[1] and t[2] <= target[2]:   # safe to use
                for k in range(3):
                    if t[k] == target[k]:
                        hit[k] = True
        return all(hit)`,
          js: `function mergeTriplets(triplets, target) {
  const hit = [false, false, false];
  for (const t of triplets) {
    if (t[0] <= target[0] && t[1] <= target[1] && t[2] <= target[2]) {   // safe to use
      for (let k = 0; k < 3; k++) if (t[k] === target[k]) hit[k] = true;
    }
  }
  return hit.every(Boolean);
}` } },
        starter: { py: 'class Solution:\n    def mergeTriplets(self, triplets: List[List[int]], target: List[int]) -> bool:\n        ', js: 'function mergeTriplets(triplets, target) {\n  \n}' },
        tests: { fn: 'mergeTriplets', sig: { args: ['int[][]', 'int[]'] }, cases: [
          { args: [[[2, 5, 3], [1, 8, 4], [1, 7, 5]], [2, 7, 5]], out: true }, { args: [[[3, 4, 5], [4, 5, 6]], [3, 2, 5]], out: false },
          { args: [[[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], [5, 5, 5]], out: true }, { args: [[[1, 1, 1]], [1, 1, 1]], out: true }, { args: [[[1, 2, 3]], [1, 2, 4]], out: false }] } },

      { lc: 763,
        hints: ['Which index must a piece reach if it contains the letter `c`?', 'As you scan, a piece must extend to the farthest last-index among all letters it has seen. How do you know when it can close?', 'Store each letter’s last index. Keep `end = max(end, last[ch])`; when `i == end`, record the length and start a new piece.'],
        starter: { py: 'class Solution:\n    def partitionLabels(self, s: str) -> List[int]:\n        ', js: 'function partitionLabels(s) {\n  \n}' },
        tests: { fn: 'partitionLabels', sig: { args: ['str'] }, cases: [
          { args: ['ababcbacadefegdehijhklij'], out: [9, 7, 8] }, { args: ['eccbbbbdec'], out: [10] }, { args: ['a'], out: [1] },
          { args: ['abc'], out: [1, 1, 1] }, { args: ['caedbdedda'], out: [1, 9] }] } },

      { lc: 678,
        hints: ['A `*` can be three things. Instead of guessing, could you track every possibility at once?', 'Keep the lowest and highest possible count of unmatched `(`. How does each character change those two numbers?', '`(`: both +1. `)`: both −1. `*`: lo −1, hi +1. If `hi < 0`, return false. Clamp `lo` at 0. At the end, valid if `lo == 0`.'],
        solution: { explain: 'Track the range [lo, hi] of possible unmatched open brackets. `(` raises both, `)` lowers both, `*` lowers lo and raises hi. If hi goes negative there are too many `)` for any reading; lo never needs to go below 0. Valid when lo is 0 at the end. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def checkValidString(self, s: str) -> bool:
        lo = hi = 0
        for ch in s:
            if ch == '(':
                lo += 1
                hi += 1
            elif ch == ')':
                lo -= 1
                hi -= 1
            else:                                   # '*' as ')', nothing, or '('
                lo -= 1
                hi += 1
            if hi < 0:                              # too many ')' under any reading
                return False
            lo = max(lo, 0)
        return lo == 0`,
          js: `function checkValidString(s) {
  let lo = 0, hi = 0;
  for (const ch of s) {
    if (ch === '(') { lo++; hi++; }
    else if (ch === ')') { lo--; hi--; }
    else { lo--; hi++; }                            // '*' as ')', nothing, or '('
    if (hi < 0) return false;                       // too many ')' under any reading
    lo = Math.max(lo, 0);
  }
  return lo === 0;
}` } },
        starter: { py: 'class Solution:\n    def checkValidString(self, s: str) -> bool:\n        ', js: 'function checkValidString(s) {\n  \n}' },
        tests: { fn: 'checkValidString', sig: { args: ['str'] }, cases: [
          { args: ['()'], out: true }, { args: ['(*)'], out: true }, { args: ['(*))'], out: true }, { args: [')('], out: false },
          { args: ['(((*'], out: false }, { args: ['*'], out: true }, { args: ['**(('], out: false }, { args: ['(*)*)'], out: true }] } },

      { lc: 860,
        hints: ['Customers pay with 5, 10 or 20, and you only give change from bills you already took. Which bills matter?', 'For a 20, you owe 15. You can pay it as 10 + 5 or as 5 + 5 + 5. Which option should you prefer, and why?', 'Prefer to spend a 10 plus a 5 first: fives are the more useful bill, so save them. Count fives and tens; return false the moment you cannot give change.'],
        solution: { explain: 'Keep counts of fives and tens. A 10 needs one five. A 20 needs 15: use a ten and a five if you can, otherwise three fives. Preferring the ten is the greedy choice, since fives can make change for both 10 and 20 while tens only help with 20. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def lemonadeChange(self, bills: List[int]) -> bool:
        five = ten = 0
        for b in bills:
            if b == 5:
                five += 1
            elif b == 10:
                if not five:
                    return False
                five -= 1
                ten += 1
            elif ten and five:                      # 20: prefer 10 + 5, save the fives
                ten -= 1
                five -= 1
            elif five >= 3:
                five -= 3
            else:
                return False
        return True`,
          js: `function lemonadeChange(bills) {
  let five = 0, ten = 0;
  for (const b of bills) {
    if (b === 5) five++;
    else if (b === 10) {
      if (!five) return false;
      five--; ten++;
    } else if (ten && five) { ten--; five--; }      // 20: prefer 10 + 5, save the fives
    else if (five >= 3) five -= 3;
    else return false;
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def lemonadeChange(self, bills: List[int]) -> bool:\n        ', js: 'function lemonadeChange(bills) {\n  \n}' },
        tests: { fn: 'lemonadeChange', sig: { args: ['int[]'] }, cases: [
          { args: [[5, 5, 5, 10, 20]], out: true }, { args: [[5, 5, 10, 10, 20]], out: false }, { args: [[5]], out: true }, { args: [[10]], out: false },
          { args: [[5, 5, 5, 5, 20, 20]], out: false }, { args: [[5, 5, 10, 5, 20]], out: true }] } },

      { lc: 1005,
        hints: ['You must flip exactly k times, but you may flip the same number again. When does flipping a number help?', 'Flip the most negative numbers first: each flip gains the most. What do you do when you run out of negatives with flips to spare?', 'Sort, flip negatives from the smallest while k lasts. If k is still odd, one flip must be wasted: subtract twice the smallest absolute value.'],
        solution: { explain: 'Sort and flip negatives from the most negative upward while flips remain. If flips remain after that, two flips on one number cancel, so only the parity of the remainder matters: if odd, one number must end negated, so subtract twice the smallest value (by absolute value). O(n log n).', code: {
          py: `class Solution:
    def largestSumAfterKNegations(self, nums: List[int], k: int) -> int:
        nums = sorted(nums)
        for i in range(len(nums)):
            if k and nums[i] < 0:
                nums[i] = -nums[i]
                k -= 1
        total = sum(nums)
        if k % 2:                                   # one flip left over: hit the smallest value
            total -= 2 * min(nums)
        return total`,
          js: `function largestSumAfterKNegations(nums, k) {
  nums = [...nums].sort((a, b) => a - b);
  for (let i = 0; i < nums.length; i++) {
    if (k && nums[i] < 0) { nums[i] = -nums[i]; k--; }
  }
  let total = nums.reduce((a, b) => a + b, 0);
  if (k % 2) total -= 2 * Math.min(...nums);        // one flip left over: hit the smallest value
  return total;
}` } },
        starter: { py: 'class Solution:\n    def largestSumAfterKNegations(self, nums: List[int], k: int) -> int:\n        ', js: 'function largestSumAfterKNegations(nums, k) {\n  \n}' },
        tests: { fn: 'largestSumAfterKNegations', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[4, 2, 3], 1], out: 5 }, { args: [[3, -1, 0, 2], 3], out: 6 }, { args: [[2, -3, -1, 5, -4], 2], out: 13 }, { args: [[-2], 1], out: 2 }, { args: [[1, 2], 3], out: 1 }] } },

      { lc: 455,
        hints: ['Each child needs a cookie at least as big as their greed, and each cookie goes to one child. Who should get the smallest cookie that works?', 'Sort both lists. A cookie too small for the least greedy remaining child is useless to everyone, so skip it.', 'Walk the cookies in order with a pointer into the sorted greed list. If the cookie is big enough for the pointed child, satisfy them and advance. Return the pointer.'],
        solution: { explain: 'Sort greeds and cookie sizes. Walk the cookies smallest to largest; each cookie satisfies the least greedy unsatisfied child if it is big enough, otherwise it is too small for everyone left and is skipped. O(n log n + m log m).', code: {
          py: `class Solution:
    def findContentChildren(self, g: List[int], s: List[int]) -> int:
        g.sort()
        i = 0
        for cookie in sorted(s):
            if i < len(g) and cookie >= g[i]:       # smallest cookie that satisfies the least greedy child
                i += 1
        return i`,
          js: `function findContentChildren(g, s) {
  g = [...g].sort((a, b) => a - b);
  let i = 0;
  for (const cookie of [...s].sort((a, b) => a - b)) {
    if (i < g.length && cookie >= g[i]) i++;        // smallest cookie that satisfies the least greedy child
  }
  return i;
}` } },
        starter: { py: 'class Solution:\n    def findContentChildren(self, g: List[int], s: List[int]) -> int:\n        ', js: 'function findContentChildren(g, s) {\n  \n}' },
        tests: { fn: 'findContentChildren', sig: { args: ['int[]', 'int[]'] }, cases: [
          { args: [[1, 2, 3], [1, 1]], out: 1 }, { args: [[1, 2], [1, 2, 3]], out: 2 }, { args: [[], [1]], out: 0 }, { args: [[5, 6], [1, 2]], out: 0 }, { args: [[10, 9, 8, 7], [5, 6, 7, 8]], out: 2 }] } }
    ],

    mistakes: [
      '**Trusting the examples instead of a counterexample.** A greedy rule that passes the three sample inputs can still be wrong. Before coding, try it on a tiny input built to break it (coins 1, 3, 4 and amount 6). If you cannot break it and can say why a swap never hurts, go.',
      '**Sorting by the wrong key.** Interval scheduling sorts by **end** time, not start or length. Choosing the key is the whole algorithm; each wrong key has a counterexample (a long early meeting blocks everything; a short one can straddle two long ones).',
      '**Using greedy on a problem that needs DP.** Coin change with arbitrary coins, 0/1 knapsack, and longest paths all look greedy and are not. The test: does an early choice change which later choices are cheapest? If so, write a recurrence.',
      '**Off-by-one on the last index in jump problems.** For minimum jumps, the loop must stop at `n - 2`; otherwise reaching `end == n - 1` counts one jump you do not need. For “can reach”, test `i > far` before updating `far`, not after.',
      '**Resetting wrongly in the gas-station scan.** When the tank goes negative at i, the new start is **i + 1**, and the tank resets to 0. Forgetting the total check (`total >= 0`) returns a start for impossible circuits.',
      '**Treating `*` as one fixed meaning.** Guessing a wildcard’s role early is how greedy attempts on bracket strings fail. Track the **range** of possible open counts instead, and clamp the low end at 0.',
      '**Comparing intervals that merely touch.** Decide whether `[1,3]` and `[3,5]` overlap. In scheduling it usually does not (use `start >= last_end`); using `>` instead drops a valid meeting.',
      '**Forgetting the sort when the input is unsorted.** A scan over `hand` for consecutive runs, or over cookies against greed values, only works after sorting (or counting). Assuming the input is in order is a common silent bug.',
      '**Not saying why it is correct.** In an interview a greedy solution without an exchange or stays-ahead sentence sounds like a guess. Prepare one line: “swap any other first choice for mine and it is no worse, because ...”.',
      '**Mutating the input while sorting.** `nums.sort()` changes the caller’s array in JS and Python. Copy first (`sorted(nums)`, `[...nums].sort(...)`) if the caller may reuse it. JS’s default `sort()` also compares as strings: always pass `(a, b) => a - b`.'
    ],

    quiz: [
      { kind: 'concept', q: 'What two properties together make a greedy algorithm correct?',
        choices: ['The greedy-choice property (some optimal answer starts with the locally best pick) and optimal substructure (what remains is a smaller instance of the same problem)', 'The input is sorted and has no duplicates', 'The recursion has overlapping subproblems and a cache', 'The algorithm runs in O(n) time'], answer: 0,
        explain: 'If a locally best pick is part of some optimal solution and the remainder is the same kind of problem, repeating the pick builds an optimal answer. Overlapping subproblems with caching describes DP, not greedy.' },
      { kind: 'concept', q: 'What is the idea of an exchange argument?',
        choices: ['Take any optimal solution that differs from greedy and swap in the greedy choice without making it worse, until it matches greedy', 'Exchange two elements of the input to sort it', 'Try every exchange of coins and keep the best', 'Replace the greedy choice with a random one and compare'], answer: 0,
        explain: 'If any optimal answer can be turned into the greedy answer by swaps that never hurt, then the greedy answer is optimal too.' },
      { kind: 'pattern', q: 'You want to attend as many non-overlapping meetings as possible in one room. Which sort order gives the greedy choice?',
        choices: ['By end time, earliest first', 'By start time, earliest first', 'By duration, shortest first', 'By start time, latest first'], answer: 0,
        explain: 'The earliest-ending meeting frees the room soonest, and swapping it into any optimal schedule never creates a conflict. Start-time and duration orders both have counterexamples.' },
      { kind: 'concept', q: 'Coins are 1, 3 and 4, and the amount is 6. What does “always take the biggest coin that fits” return, and what does that show?',
        choices: ['3 coins (4+1+1), but 2 is possible (3+3): greedy fails, so use DP', '2 coins: greedy works for every coin set', '3 coins, and that is optimal', 'It cannot make 6'], answer: 0,
        explain: 'Taking 4 first blocks the better 3 + 3. The greedy-choice property is false here, so you need to try the alternatives, i.e. dynamic programming.' },
      { kind: 'complexity', q: 'What is the complexity of “sort the intervals by end time, then scan once”?',
        choices: ['O(n log n) time (the sort dominates), O(1) extra space for the scan', 'O(n) time', 'O(n²) time', 'O(2ⁿ) time'], answer: 0,
        explain: 'The scan is linear but the sort is O(n log n), so the whole is O(n log n). The scan itself keeps only the last end.' },
      { kind: 'bug', q: 'This Jump Game II loop returns an answer that is one too large for `[1,1,1]`. What is the bug?',
        code: `jumps = end = far = 0
for i in range(len(nums)):
    far = max(far, i + nums[i])
    if i == end:
        jumps += 1
        end = far
return jumps`,
        lang: 'py',
        choices: ['The loop runs through the last index, so it counts a jump taken from a cell you only needed to arrive at', 'far should start at 1', 'It should use min instead of max', 'It should sort nums first'], answer: 0,
        explain: 'Arriving at the last index needs no jump from it, so the loop should stop at `len(nums) - 1` (exclusive). Otherwise `i == end` at the last cell adds an extra jump.' },
      { kind: 'concept', q: 'In the Gas Station scan, the tank goes negative at station j while starting from station s. What can you conclude?',
        choices: ['No station from s through j can be a valid start, so try j + 1', 'Only station j fails; try s + 1', 'The trip is impossible', 'You must start at the station with the most gas'], answer: 0,
        explain: 'Every station between s and j arrived there with a non-negative tank, so starting there with an empty tank is no better and would run dry at j too.' },
      { kind: 'pattern', q: 'A row of numbers says how far you may jump from each cell. You are asked if the last cell is reachable. Which single piece of state is enough?',
        choices: ['The farthest index reachable so far', 'The list of all reachable indices', 'The number of jumps taken', 'A table of the best way to reach each index'], answer: 0,
        explain: 'Jumps can be shortened, so everything from 0 up to the frontier is reachable. One integer, the farthest reach, carries all the information.' },
      { kind: 'concept', q: 'In a string of `(`, `)` and `*` (where `*` may be `(`, `)` or empty), what do `lo` and `hi` track?',
        choices: ['The smallest and largest possible number of unmatched open brackets so far', 'The positions of the first and last `*`', 'The counts of `(` and `)` seen', 'The indexes of the outermost brackets'], answer: 0,
        explain: 'Each `*` adds a choice, so instead of guessing you track the whole range of possible open counts. `hi < 0` is impossible, and `lo` is clamped at 0.' },
      { kind: 'concept', q: 'Which statements about greedy algorithms are true? Pick every one that applies.',
        choices: ['A greedy algorithm never revisits a choice it made', 'A greedy rule that passes the sample inputs is therefore correct', 'Sorting by the right key is often the whole difficulty', 'Greedy is often faster than DP because it discards alternatives'], answer: [0, 2, 3],
        explain: 'Greedy commits and moves on, so it is cheap, and picking the right sort key is usually the insight. But passing examples proves nothing: it needs a proof or a failed counterexample search.' }
    ],

    flashcards: [
      { id: 'greedy-def', front: 'What is a greedy algorithm?', back: 'Make the locally best choice at each step, commit to it, never revisit. Correct only when that choice is provably safe.' },
      { id: 'greedy-two-props', front: 'Which two properties make greedy correct?', back: '**Greedy-choice property** (some optimal answer contains the local best pick) and **optimal substructure** (the rest is a smaller instance of the same problem).' },
      { id: 'greedy-exchange', front: 'What is an exchange argument?', back: 'Take any optimal solution that differs from greedy and swap in the greedy choice without making it worse. Repeat until it equals greedy, so greedy is optimal.' },
      { id: 'greedy-fails', front: 'Give a counterexample where greedy fails.', back: 'Coins 1, 3, 4, amount 6: greedy takes 4+1+1 (3 coins), but 3+3 (2 coins) is better. Switch to DP.' },
      { id: 'greedy-interval', front: 'Interval scheduling: how to pick the most non-overlapping intervals?', back: 'Sort by **end time**; take an interval if its start is at or after the last taken end. Sorting by start or length fails.' },
      { id: 'greedy-jump-reach', front: 'Jump Game: the single-variable solution?', back: 'Keep `far`. For each i: if `i > far` return false; `far = max(far, i + nums[i])`. True at the end. O(n), O(1).' },
      { id: 'greedy-jump-ii', front: 'Jump Game II: how does it count jumps?', back: 'Track `end` (the current jump’s range end) and `far`. When `i == end`, `jumps++` and `end = far`. Loop to n - 2. It is BFS by levels with two integers.' },
      { id: 'greedy-gas', front: 'Gas Station: the one-pass idea?', back: 'If total gas < total cost, return -1. Otherwise scan; when the tank goes negative at i, no start from the candidate to i works, so `start = i + 1` and reset the tank.' },
      { id: 'greedy-partition', front: 'Partition Labels: how to find the cuts?', back: 'Record each letter’s last index. Scan with `end = max(end, last[ch])`; when `i == end`, close the piece (length `end - start + 1`) and start a new one.' },
      { id: 'greedy-straights', front: 'Hand of Straights: which card starts a group?', back: 'The **smallest** card left, since nothing smaller can start a group for it. If the count is not a multiple of the group size, fail at once. Use a count map and walk values in sorted order.' },
      { id: 'greedy-parens', front: 'Valid Parenthesis String: what do you track?', back: 'The range `[lo, hi]` of possible unmatched `(`. `(`: both +1. `)`: both -1. `*`: lo -1, hi +1. `hi < 0` is false; clamp `lo` at 0; valid if `lo == 0`.' },
      { id: 'greedy-vs-dp', front: 'How do you tell greedy from DP?', back: 'If after the best local move the rest is the same problem with no regret, greedy. If an early choice changes later costs (arbitrary coins, knapsack), DP. Try a tiny counterexample.' }
    ],

    deeper: [
      { title: 'Greedy algorithms (Jeff Erickson, Algorithms)', url: 'https://jeffe.cs.illinois.edu/teaching/algorithms/book/04-greedy.pdf', time: 'about 40 min', note: 'A careful chapter on scheduling, Huffman codes and the correctness arguments, with exchange-style proofs written out.' },
      { title: 'Greedy algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Greedy_algorithm', time: 'about 15 min', note: 'Definition, the greedy-choice property, and the standard examples and counterexamples (including coin change).' },
      { title: 'Greedy algorithms (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/greedy-algorithms/', time: 'about 30 min', note: 'A catalogue of classic greedy problems to practice recognising when the locally best choice is safe.' },
      { title: 'NeetCode: Greedy', url: 'https://neetcode.io/roadmap', time: 'about 20 min', note: 'Short video walkthroughs of the jump game, gas station and parenthesis-string solutions; good as a first pass.' }
    ],

    detective: [
      { id: 'kiln-bookings', decoys: ['intervals', 'dp-1d', 'sorting'],
        statement: 'A pottery studio owns a single kiln. Each customer sends a request: a firing must start at some hour and end at a later hour, and the kiln can only hold one job at a time (a job may start the same hour another ends). The studio wants to accept as many requests as it can. The owner’s first instinct is to take the earliest-starting request, then the next one that fits, but a friend shows her a booking list where this accepts only two jobs while three were possible.',
        why: 'Maximize the **count** of non-clashing windows, and a natural-looking rule has a small counterexample. The fix is a sort key plus one scan: the request that **ends soonest** frees the kiln earliest, and swapping it into any best plan never creates a clash. Cues: one resource, choose a subset of windows, no weights.' },
      { id: 'lantern-ring', decoys: ['prefix-sums', 'kadane', 'two-pointers'],
        statement: 'Oil depots stand around a circular canal. Depot i hands a barge `oil[i]` litres, and the stretch from depot i to the next one burns `burn[i]` litres. The barge begins at a depot of the captain’s choice with an empty tank and must travel the full circle in one direction. The captain tried each depot as a start in turn and it took far too long for a canal with a hundred thousand depots. Is there a start that works, and which one?',
        why: 'The cues are a circle, a running tank that must never go below zero, and “find the start”. Two facts replace the nested loop: if the total oil is less than the total burn, nothing works; otherwise, when the running tank first dips below zero, **none of the depots passed so far** can be the start, so restart after the dip. One pass with two sums.' },
      { id: 'stone-hops', decoys: ['dp-1d', 'sliding-window', 'stacks'],
        statement: 'A row of stepping stones crosses a pond. Standing on a stone with the number k painted on it, a frog may leap forward any whole number of stones from 1 up to k. The frog starts on the first stone and wants to reach the last one with as few leaps as possible; the pond is built so that this is always doable. A friend suggests filling a table of the fewest leaps to every stone, which would take quadratic time on the long ponds in the contest. Is there a way to count the leaps in a single sweep with a couple of variables?',
        why: 'The stones reachable in one leap form a range, those reachable in two leaps form the next range, and so on, so the answer is the number of times the sweep **runs past the end of the current range**. Tracking the farthest stone anything in the range can reach, and the range end, replaces the table: an unbroken range at each level, found with two numbers.' }
    ]
  });
})();
