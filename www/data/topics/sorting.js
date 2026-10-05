/* Offer Ready: Sorting lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'sorting',

    hook: 'Sorting is rarely the whole question. It’s the first move: put the data in order and the answer is often one pass away (overlapping meetings, closest pairs, the k-th largest, a greedy pairing). You’ll seldom be asked to code a sort from scratch, but you’ll be asked what the built-in costs, whether it’s stable, and when you can beat O(n log n). Interviewers use those questions to see if you understand the machinery you’re calling.',

    cues: [
      'The question talks about **order**: largest, smallest, k-th, closest, “in sorted order”, “rearrange so that…”.',
      'The brute force compares every pair, and the pairs that matter would be **neighbors** if the data were sorted (duplicates, overlaps, closest values, gaps).',
      'Intervals or events: starts and ends, meetings, bookings. Sort by start (or by end) first, then scan once.',
      'A greedy choice needs a ranking: “take the cheapest first”, “pair the biggest with the biggest”.',
      'The values live in a **small known range** (digits, ages, lowercase letters, scores 0 to 100). That’s the cue for counting or bucket sort and O(n).',
      'Only the k-th element is wanted, not the whole order. That’s quickselect or a heap, not a full sort.',
      'The question says “stable”, or you’re sorting records by more than one key.'
    ],

    intuition: [
      'Start with a hand of playing cards. **Insertion sort** is what your hands already do: pick up the next card and slide it left until it sits between a smaller and a bigger one. Fine for ten cards, painful for ten thousand, because each card may travel the whole way.',
      'The fast sorts all find a way to avoid long trips. **Merge sort** splits the deck in half, sorts each half (by splitting again), then merges: two sorted piles, always compare the top cards and take the smaller. Merging is cheap because each pile is already in order, so every card is touched once per level, and halving gives log n levels: O(n log n). **Quick sort** picks one card, the *pivot*, and deals everything smaller to its left and everything bigger to its right. The pivot is now exactly where it belongs; sort each side the same way. **Heap sort** builds a max-heap (the biggest item on top), swaps that top with the last slot, shrinks the heap by one and repairs it, again and again.',
      'All of those work by **comparing** items, and comparing alone can’t beat roughly n log n. There are n! possible orders, each comparison answers one yes/no question, and you need about log₂(n!) ≈ n log n questions to pin one down. **Counting sort** escapes the bound by not comparing at all: when the values are small integers, tally how many of each value exist, turn the tallies into “where does each value start”, and place every item directly. That’s O(n + k) for n items with values in a range of size k. **Bucket sort** is the same idea for a spread-out range: drop items into buckets by value, then handle each bucket.',
      'Two properties decide which sort you reach for:',
      '1. **Stable** means equal items keep their original relative order. It matters when you sort records by one key after another (sort by name, then stable-sort by team, and each team stays alphabetical).\n2. **In place** means O(1) or O(log n) extra memory. Merge sort uses O(n) extra; quick sort and heap sort don’t.',
      'Quick sort’s speed depends on the pivot. A pivot near the middle halves the problem. A pivot that’s always the smallest or largest (the last item of already-sorted input, for instance) peels off one item per round and costs O(n²). A **random** pivot makes that outcome vanishingly unlikely, which is why you pick one at random or use median-of-three.',
      'In a real interview, call the built-in unless the question is *about* sorting. Writing merge sort from memory is a fair ask, and the ability to reason about what the built-in does is a better one.'
    ].join('\n\n'),

    viz: 'sorting-race',

    template: {
      title: 'Merge sort: split, sort each half, merge by comparing fronts',
      note: 'Memorize the merge loop: two indices, compare the fronts, take the smaller, then append what’s left. Everything else is the recursion. The `<=` in the comparison is not decoration: taking the **left** item on a tie is what makes merge sort stable. The same merge step is the heart of Merge Two Sorted Lists, Merge Sorted Array, and counting inversions (count how many left items a right item jumps over).',
      code: {
        py: `def merge_sort(nums):
    if len(nums) <= 1:                      #> Base case: zero or one item is already sorted
        return nums
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])           #> Trust the recursion: each half comes back sorted
    right = merge_sort(nums[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:             #@compare > 1. Compare the two fronts. Taking the LEFT item on a tie keeps equal items in order: that's stability
            out.append(left[i])             #@take > 2. Take the smaller front and advance that half
            i += 1                          #@take
        else:
            out.append(right[j])            #@take
            j += 1                          #@take
    return out + left[i:] + right[j:]       #@rest > 3. One half ran out, so the rest of the other is already sorted: append it`,
        js: `function mergeSort(nums) {
  if (nums.length <= 1) return nums;                  //> Base case: zero or one item is already sorted
  const mid = nums.length >> 1;
  const left = mergeSort(nums.slice(0, mid));         //> Trust the recursion: each half comes back sorted
  const right = mergeSort(nums.slice(mid));
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {                        //@compare > 1. Compare the two fronts. Taking the LEFT item on a tie keeps equal items in order: that's stability
      out.push(left[i++]);                            //@take > 2. Take the smaller front and advance that half
    } else {
      out.push(right[j++]);                           //@take
    }
  }
  return out.concat(left.slice(i), right.slice(j));   //@rest > 3. One half ran out, so the rest of the other is already sorted: append it
}`,
        java: `class Solution {
    public int[] mergeSort(int[] nums) {
        if (nums.length <= 1) return nums;                                   //> Base case: zero or one item is already sorted
        int mid = nums.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(nums, 0, mid));            //> Trust the recursion: each half comes back sorted
        int[] right = mergeSort(Arrays.copyOfRange(nums, mid, nums.length));
        int[] out = new int[nums.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) {                                       //@compare > 1. Compare the two fronts. Taking the LEFT item on a tie keeps equal items in order: that's stability
                out[k++] = left[i++];                                        //@take > 2. Take the smaller front and advance that half
            } else {
                out[k++] = right[j++];                                       //@take
            }
        }
        while (i < left.length) out[k++] = left[i++];                        //@rest > 3. One half ran out, so the rest of the other is already sorted: append it
        while (j < right.length) out[k++] = right[j++];                      //@rest
        return out;
    }
}`,
        cpp: `class Solution {
public:
    vector<int> mergeSort(vector<int> nums) {
        if (nums.size() <= 1) return nums;                                          //> Base case: zero or one item is already sorted
        size_t mid = nums.size() / 2;
        vector<int> left = mergeSort(vector<int>(nums.begin(), nums.begin() + mid));  //> Trust the recursion: each half comes back sorted
        vector<int> right = mergeSort(vector<int>(nums.begin() + mid, nums.end()));
        vector<int> out;
        size_t i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            if (left[i] <= right[j]) {                                              //@compare > 1. Compare the two fronts. Taking the LEFT item on a tie keeps equal items in order: that's stability
                out.push_back(left[i++]);                                           //@take > 2. Take the smaller front and advance that half
            } else {
                out.push_back(right[j++]);                                          //@take
            }
        }
        out.insert(out.end(), left.begin() + i, left.end());                        //@rest > 3. One half ran out, so the rest of the other is already sorted: append it
        out.insert(out.end(), right.begin() + j, right.end());                      //@rest
        return out;
    }
};`
      },
      tests: { fn: { py: 'merge_sort', default: 'mergeSort' }, sig: { args: ['int[]'] }, cases: [
        { args: [[5, 2, 3, 1]], out: [1, 2, 3, 5] }, { args: [[]], out: [] }, { args: [[1]], out: [1] }, { args: [[3, 3, 1, 3]], out: [1, 3, 3, 3] },
        { args: [[-2, 5, -2, 0]], out: [-2, -2, 0, 5] }, { args: [[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]], out: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }, { args: [[2, 1]], out: [1, 2] }] }
    },

    complexity: {
      time: 'O(n log n)',
      space: 'O(n)',
      why: 'Merge sort halves the array, so there are about log₂ n levels, and the merges on each level touch every item once: n × log n comparisons and moves, whatever the input looks like. The extra space is the merged output (and the recursion, only log n deep). The other sorts differ on exactly these two columns. **Quick sort:** O(n log n) on average, O(n²) in the worst case, O(log n) extra space if you recurse into the smaller side first. **Heap sort:** O(n log n) always, O(1) extra space, but not stable and unfriendly to caches. **Insertion sort:** O(n²), but O(n) on input that’s already nearly sorted. **Counting sort:** O(n + k) time and O(n + k) space, with no comparisons at all. No comparison sort can beat Ω(n log n) in the worst case.',
      trap: 'Don’t say “quick sort is O(n log n)” without the word *average*, and don’t say “counting sort is O(n)” without the k: if the range of values is far larger than n (32-bit integers, say), O(n + k) is worse than O(n log n). When asked about a built-in, give the worst case and whether it’s stable: Python’s `sort` and JavaScript’s `sort` are stable and O(n log n); Java’s `Arrays.sort` on `int[]` and C++’s `std::sort` are not stable (use `stable_sort`, or sort objects in Java, when you need it).'
    },

    variations: [
      {
        name: 'Quickselect: the k-th element without a full sort',
        body: 'If the question asks for only the k-th smallest or largest, you don’t need the whole order. Pick a pivot, split the items into *smaller*, *equal* and *larger*, and then keep only the group that contains rank k, discarding the others. Each round discards part of the input, so the expected work is n + n/2 + n/4 + … = **O(n)**, against O(n log n) for sorting. The worst case is O(n²) with unlucky pivots, which a random pivot makes very unlikely. Splitting three ways (rather than two) keeps it fast when many values are equal. The alternative is a size-k heap at O(n log k), which also works on a stream (see [Heaps](#/topic/heaps)). Kth Largest Element in an Array (215) is the classic.',
        code: {
          py: `import random

def kth_smallest(nums, k):                  # k = 1 means the smallest
    while True:
        pivot = random.choice(nums)         #> A random pivot makes the quadratic case very unlikely
        less = [x for x in nums if x < pivot]
        more = [x for x in nums if x > pivot]
        if k <= len(less):
            nums = less                     #> The answer is among the smaller items
        elif k > len(nums) - len(more):
            k -= len(nums) - len(more)      #> Skip everything <= pivot and re-rank inside the larger items
            nums = more
        else:
            return pivot                    #> Rank k falls in the "equal" group`,
          js: `function kthSmallest(nums, k) {              // k = 1 means the smallest
  for (;;) {
    const pivot = nums[Math.floor(Math.random() * nums.length)];  //> A random pivot makes the quadratic case very unlikely
    const less = nums.filter((x) => x < pivot);
    const more = nums.filter((x) => x > pivot);
    if (k <= less.length) {
      nums = less;                                 //> The answer is among the smaller items
    } else if (k > nums.length - more.length) {
      k -= nums.length - more.length;              //> Skip everything <= pivot and re-rank inside the larger items
      nums = more;
    } else {
      return pivot;                                //> Rank k falls in the "equal" group
    }
  }
}`
        },
        tests: { fn: { py: 'kth_smallest', default: 'kthSmallest' }, cases: [
          { args: [[3, 2, 1, 5, 6, 4], 2], out: 2 }, { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], out: 3 }, { args: [[7], 1], out: 7 },
          { args: [[2, 2, 2, 2], 3], out: 2 }, { args: [[5, 1, 4], 3], out: 5 }] }
      },
      {
        name: 'Heap sort: a guaranteed O(n log n) with no extra space',
        body: 'Build a max-heap inside the array (bottom-up, which costs O(n)), then repeat: swap the maximum from the front to the end of the unsorted part, shrink the heap by one, and sift the new front down to repair it. The sorted region grows from the right. It has no bad inputs, unlike quick sort, and needs no extra memory, unlike merge sort, but it isn’t stable and jumps around memory, so in practice it loses to both. You rarely code it; you use the *idea* whenever you need the top k of something ([Heaps](#/topic/heaps)).',
        code: {
          py: `def heap_sort(nums):
    a = nums[:]
    n = len(a)

    def sift_down(i, size):
        while True:
            big, l, r = i, 2 * i + 1, 2 * i + 2
            if l < size and a[l] > a[big]: big = l
            if r < size and a[r] > a[big]: big = r
            if big == i: return
            a[i], a[big] = a[big], a[i]
            i = big

    for i in range(n // 2 - 1, -1, -1):     #> Build the max-heap from the last parent upward: O(n)
        sift_down(i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]         #> The maximum goes to its final slot at the back...
        sift_down(0, end)                   #> ...and the smaller heap repairs itself in O(log n)
    return a`,
          js: `function heapSort(nums) {
  const a = nums.slice(), n = a.length;
  function siftDown(i, size) {
    for (;;) {
      let big = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < size && a[l] > a[big]) big = l;
      if (r < size && a[r] > a[big]) big = r;
      if (big === i) return;
      [a[i], a[big]] = [a[big], a[i]];
      i = big;
    }
  }
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(i, n);   //> Build the max-heap from the last parent upward: O(n)
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];                        //> The maximum goes to its final slot at the back...
    siftDown(0, end);                                       //> ...and the smaller heap repairs itself in O(log n)
  }
  return a;
}`
        },
        tests: { fn: { py: 'heap_sort', default: 'heapSort' }, cases: [
          { args: [[5, 2, 3, 1]], out: [1, 2, 3, 5] }, { args: [[]], out: [] }, { args: [[4, 4, 1, 4, 0]], out: [0, 1, 4, 4, 4] }, { args: [[9, 8, 7, 6, 5, 4, 3, 2, 1]], out: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, { args: [[-3, 7, -3]], out: [-3, -3, 7] }] }
      },
      {
        name: 'Counting sort: beating n log n when the range is small',
        body: 'When every value is an integer in `0..k-1` with k small, skip the comparisons. Tally how often each value occurs, turn the tallies into running totals (`count[v]` becomes the number of items that are ≤ v, which is one past the last slot value v may occupy), then walk the input **right to left** and drop each item into its slot. Going right to left is what makes it stable, and stability is what lets counting sort serve as the inner pass of radix sort. Reach for it with digits, ages, letters, or scores. Bucket sort generalizes it: with values spread over a wide range, drop each item into a bucket by value range and sort within the bucket (Maximum Gap, below, is a clever use). The cost is O(n + k), so it’s a win only when k isn’t much bigger than n.',
        code: {
          py: `def counting_sort(nums, k):                 # every value is in range(k)
    count = [0] * k
    for x in nums:
        count[x] += 1                       #> Tally how many of each value
    for v in range(1, k):
        count[v] += count[v - 1]            #> count[v] = how many items are <= v, so one past v's last slot
    out = [0] * len(nums)
    for x in reversed(nums):                #> Right to left keeps equal values in their original order: stable
        count[x] -= 1
        out[count[x]] = x
    return out`,
          js: `function countingSort(nums, k) {                // every value is in 0..k-1
  const count = new Array(k).fill(0);
  for (const x of nums) count[x]++;                 //> Tally how many of each value
  for (let v = 1; v < k; v++) count[v] += count[v - 1];   //> count[v] = how many items are <= v, so one past v's last slot
  const out = new Array(nums.length);
  for (let i = nums.length - 1; i >= 0; i--) {      //> Right to left keeps equal values in their original order: stable
    out[--count[nums[i]]] = nums[i];
  }
  return out;
}`
        },
        tests: { fn: { py: 'counting_sort', default: 'countingSort' }, cases: [
          { args: [[4, 2, 2, 8, 3, 3, 1], 9], out: [1, 2, 2, 3, 3, 4, 8] }, { args: [[], 1], out: [] }, { args: [[0, 0], 1], out: [0, 0] }, { args: [[3, 1, 2], 4], out: [1, 2, 3] }, { args: [[9, 9, 0, 5], 10], out: [0, 5, 9, 9] }] }
      },
      {
        name: 'Stability and sorting by several keys',
        body: 'A **stable** sort keeps items that compare equal in their original order. Two uses: sorting by several keys, and sorting records whose other fields matter. In Python and JavaScript, the built-in sort is stable, so you can sort by the *minor* key first and the *major* key second, or sort once with a combined key (a tuple in Python, a chained comparator in JavaScript). Mixed directions are the usual snag: negate a numeric key to flip it. Java’s `Arrays.sort(int[])` and C++’s `std::sort` make no stability promise; `Arrays.sort` on objects, `Collections.sort` and `std::stable_sort` do. This example sorts by frequency ascending, then by value descending (Sort Array by Increasing Frequency, 1636).',
        code: {
          py: `def frequency_sort(nums):
    count = {}
    for x in nums:
        count[x] = count.get(x, 0) + 1
    return sorted(nums, key=lambda x: (count[x], -x))   #> One combined key: frequency up, then value down (negated)`,
          js: `function frequencySort(nums) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
  return [...nums].sort((a, b) => count.get(a) - count.get(b) || b - a);   //> Frequency up; on a tie (0 is falsy), value down
}`
        },
        tests: { fn: { py: 'frequency_sort', default: 'frequencySort' }, cases: [
          { args: [[1, 1, 2, 2, 2, 3]], out: [3, 1, 1, 2, 2, 2] }, { args: [[2, 3, 1, 3, 2]], out: [1, 3, 3, 2, 2] },
          { args: [[-1, 1, -6, 4, 5, -6, 1, 4, 1]], out: [5, -1, 4, 4, -6, -6, 1, 1, 1] }, { args: [[]], out: [] }] }
      },
      {
        name: 'Sort, then scan: intervals and meeting rooms',
        body: 'The most common way sorting shows up: spend O(n log n) to put events in order, then answer with one O(n) pass. For “can one person attend every meeting?” (Meeting Rooms, 252), sort by start and check that each start is at or after the previous end. For “how many rooms?” (Meeting Rooms II, 253), sort the **starts** and the **ends** separately: walk the starts; if a meeting starts before the earliest unfinished end, it needs a new room, otherwise it reuses that room. Merging overlapping intervals (56) is the same shape: sort by start, extend the last interval while the next one overlaps. The sort dominates, so the total is O(n log n). [Intervals](#/topic/intervals) goes deeper.',
        code: {
          py: `def min_rooms(intervals):
    starts = sorted(s for s, e in intervals)
    ends = sorted(e for s, e in intervals)    #> Starts and ends sorted separately: we only need the counts, not the pairing
    rooms = j = 0
    for s in starts:
        if s < ends[j]:
            rooms += 1                        #> Starts before the earliest end: every room is still busy, add one
        else:
            j += 1                            #> That earliest meeting is over: reuse its room
    return rooms`,
          js: `function minRooms(intervals) {
  const starts = intervals.map((x) => x[0]).sort((a, b) => a - b);
  const ends = intervals.map((x) => x[1]).sort((a, b) => a - b);   //> Starts and ends sorted separately: we only need the counts, not the pairing
  let rooms = 0, j = 0;
  for (const s of starts) {
    if (s < ends[j]) rooms++;                 //> Starts before the earliest end: every room is still busy, add one
    else j++;                                 //> That earliest meeting is over: reuse its room
  }
  return rooms;
}`
        },
        tests: { fn: { py: 'min_rooms', default: 'minRooms' }, cases: [
          { args: [[[0, 30], [5, 10], [15, 20]]], out: 2 }, { args: [[[7, 10], [2, 4]]], out: 1 }, { args: [[]], out: 0 },
          { args: [[[1, 5], [5, 8]]], out: 1 }, { args: [[[1, 10], [2, 3], [4, 5], [6, 7]]], out: 2 }, { args: [[[1, 3], [1, 3], [1, 3]]], out: 3 }] }
      },
      {
        name: 'Write one, or call the built-in?',
        body: 'Default to the built-in: `sorted(x)` or `x.sort()` in Python, `sort` in the other languages. It’s faster than anything you’ll hand-write and it can’t have your bugs. Python’s and JavaScript’s are stable merge-and-insertion hybrids (Timsort) and run in O(n) on input that’s already in order; Java’s sort on primitives and C++’s `std::sort` are fast but unstable. Write your own when the question is *about* the algorithm (“implement merge sort”, “sort in place with O(1) space”), when you can use structure the built-in can’t (a small range means counting sort; a nearly sorted array means insertion sort), or when you need a **partial** result: quickselect for one rank, a heap for the top k. In every other case, say the cost out loud (“I’ll sort first, O(n log n)”) and keep going. An answer that sorts when a hash map would do O(n) is the one thing to avoid, so name the trade-off.'
      },
      {
        name: 'When sorting is the wrong tool',
        body: 'Sorting destroys the original positions, so it can’t answer questions about order *in the input*: “longest subarray”, “two indices that sum to a target” (return indices, so use a hash map), “next greater element”. If a hash set or map answers the question in O(n), that beats an O(n log n) sort. And if the input is a stream that keeps changing, keep a heap or a balanced structure instead of re-sorting.'
      }
    ],

    worked: [
      {
        lc: 912,
        restate: 'Given an array of integers, return it sorted in ascending order, without using a built-in sort. It must run in O(n log n) time, and the values may repeat.',
        examples: '- `[5,2,3,1]` → `[1,2,3,5]`.\n- `[5,1,1,2,0,0]` → `[0,0,1,1,2,5]` (duplicates are common).\n- Edge cases: one element; all elements equal; already sorted or reverse sorted. These are the inputs that expose a bad pivot.',
        brute: 'Insertion, selection or bubble sort: O(n²). Fine for 10³ items and too slow for the real limit of 5·10⁴. Merge sort (the template) is the safe O(n log n) answer. Quick sort is faster in practice, and writing it right is a better test of understanding.',
        insight: 'Quick sort, with two upgrades. First, a **random pivot**, so no particular input (sorted, reversed) is reliably bad. Second, a **three-way partition**: one pass splits the range into *less than*, *equal to* and *greater than* the pivot, and the equal block is finished, so an array full of duplicates costs O(n) instead of O(n²). Recurse into the smaller side and loop on the larger so the stack stays O(log n).',
        code: {
          py: `import random

class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:
        def sort(lo, hi):                     # sorts nums[lo..hi] in place
            while lo < hi:
                pivot = nums[random.randint(lo, hi)]
                lt, i, gt = lo, lo, hi        # nums[lo..lt-1] < pivot, nums[lt..i-1] == pivot, nums[gt+1..hi] > pivot
                while i <= gt:
                    if nums[i] < pivot:
                        nums[lt], nums[i] = nums[i], nums[lt]
                        lt += 1
                        i += 1
                    elif nums[i] > pivot:
                        nums[i], nums[gt] = nums[gt], nums[i]
                        gt -= 1               # the swapped-in item is unexamined, so i stays
                    else:
                        i += 1
                if lt - lo < hi - gt:         # recurse into the smaller side, loop on the larger
                    sort(lo, lt - 1)
                    lo = gt + 1
                else:
                    sort(gt + 1, hi)
                    hi = lt - 1

        sort(0, len(nums) - 1)
        return nums`,
          js: `function sortArray(nums) {
  function sort(lo, hi) {                       // sorts nums[lo..hi] in place
    while (lo < hi) {
      const pivot = nums[lo + Math.floor(Math.random() * (hi - lo + 1))];
      let lt = lo, i = lo, gt = hi;             // nums[lo..lt-1] < pivot, nums[lt..i-1] == pivot, nums[gt+1..hi] > pivot
      while (i <= gt) {
        if (nums[i] < pivot) {
          [nums[lt], nums[i]] = [nums[i], nums[lt]];
          lt++; i++;
        } else if (nums[i] > pivot) {
          [nums[i], nums[gt]] = [nums[gt], nums[i]];
          gt--;                                 // the swapped-in item is unexamined, so i stays
        } else {
          i++;
        }
      }
      if (lt - lo < hi - gt) { sort(lo, lt - 1); lo = gt + 1; }   // recurse into the smaller side, loop on the larger
      else { sort(gt + 1, hi); hi = lt - 1; }
    }
  }
  sort(0, nums.length - 1);
  return nums;
}`,
          java: `class Solution {
    private final Random rnd = new Random();

    public int[] sortArray(int[] nums) {
        sort(nums, 0, nums.length - 1);
        return nums;
    }

    private void sort(int[] nums, int lo, int hi) {          // sorts nums[lo..hi] in place
        while (lo < hi) {
            int pivot = nums[lo + rnd.nextInt(hi - lo + 1)];
            int lt = lo, i = lo, gt = hi;                    // nums[lo..lt-1] < pivot, nums[lt..i-1] == pivot, nums[gt+1..hi] > pivot
            while (i <= gt) {
                if (nums[i] < pivot) swap(nums, lt++, i++);
                else if (nums[i] > pivot) swap(nums, i, gt--);  // the swapped-in item is unexamined, so i stays
                else i++;
            }
            if (lt - lo < hi - gt) { sort(nums, lo, lt - 1); lo = gt + 1; }   // recurse into the smaller side, loop on the larger
            else { sort(nums, gt + 1, hi); hi = lt - 1; }
        }
    }

    private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
}`,
          cpp: `class Solution {
public:
    vector<int> sortArray(vector<int>& nums) {
        quick(nums, 0, (int)nums.size() - 1);
        return nums;
    }

private:
    void quick(vector<int>& nums, int lo, int hi) {          // sorts nums[lo..hi] in place
        while (lo < hi) {
            int pivot = nums[lo + rand() % (hi - lo + 1)];
            int lt = lo, i = lo, gt = hi;                    // nums[lo..lt-1] < pivot, nums[lt..i-1] == pivot, nums[gt+1..hi] > pivot
            while (i <= gt) {
                if (nums[i] < pivot) swap(nums[lt++], nums[i++]);
                else if (nums[i] > pivot) swap(nums[i], nums[gt--]);  // the swapped-in item is unexamined, so i stays
                else i++;
            }
            if (lt - lo < hi - gt) { quick(nums, lo, lt - 1); lo = gt + 1; }   // recurse into the smaller side, loop on the larger
            else { quick(nums, gt + 1, hi); hi = lt - 1; }
        }
    }
};`
        },
        complexity: 'Expected O(n log n) time (a random pivot makes the O(n²) worst case astronomically unlikely). O(log n) extra space for the recursion, since only the smaller side is recursed into; the sort itself is in place.',
        say: '“The safe baseline is merge sort: O(n log n) always, but it needs O(n) extra space. I’ll write quick sort instead: it’s in place and fast in practice. To avoid the quadratic case on sorted input I pick a random pivot, and to survive many duplicates I partition three ways, into less, equal and greater, so the equal block is already done. I recurse into the smaller side and loop on the larger, which keeps the stack at O(log n). The worst case is still O(n²), but it’s astronomically unlikely, and I’d say that out loud.”',
        followups: [
          { q: 'What goes wrong with the last element as pivot?', a: 'On sorted or reverse-sorted input it’s always the minimum or the maximum, so each round peels off one item: n + (n − 1) + … = O(n²) comparisons, and the recursion goes n levels deep. A random pivot or median-of-three avoids it. Try the “Sorted” preset in the race above.' },
          { q: 'Why three-way partitioning?', a: 'With a two-way split, a pile of equal values keeps landing on one side and you get O(n²) on an array like `[7,7,7,7,…]`. Three-way sets all the equal values aside in one pass, so they’re never looked at again.' },
          { q: 'Is quick sort stable?', a: 'No. Swapping items across the array can reorder equal values. If you need stability, use merge sort.' },
          { q: 'Could you guarantee O(n log n)?', a: 'Use merge sort or heap sort. Or use introsort: quick sort that switches to heap sort when the recursion gets too deep (C++’s `std::sort` is implemented this way).' }
        ]
      },
      {
        lc: 179,
        restate: 'Given a list of non-negative integers, arrange them so that, joined together as text, they make the largest possible number. Return that number as a string, because it can overflow an integer.',
        examples: '- `[10,2]` → `"210"`.\n- `[3,30,34,5,9]` → `"9534330"`.\n- Edge cases: `[0,0]` → `"0"`, not `"00"`; a single number; `[34323,3432]` → `"343234323"`.',
        brute: 'Try every permutation and keep the largest string: n! orders. Hopeless past about 9 numbers.',
        insight: 'It’s a sort with a custom order. Comparing numbers by size or comparing strings alphabetically is wrong (`"30"` is bigger than `"3"` alphabetically, but `"330"` beats `"303"`). The right comparison asks about the **joined result**: a goes before b when `a + b > b + a` as strings. That order is consistent (it’s transitive), so sorting with it is valid, and joining the sorted pieces gives the answer. One edge case remains: if the largest piece is `"0"`, everything is zero.',
        code: {
          py: `from functools import cmp_to_key

class Solution:
    def largestNumber(self, nums: List[int]) -> str:
        def order(a, b):                      # negative means a goes first
            if a + b > b + a: return -1
            if a + b < b + a: return 1
            return 0

        words = sorted(map(str, nums), key=cmp_to_key(order))
        return '0' if words[0] == '0' else ''.join(words)`,
          js: `function largestNumber(nums) {
  const words = nums.map(String).sort((a, b) => {
    if (a + b > b + a) return -1;             // negative means a goes first
    if (a + b < b + a) return 1;
    return 0;
  });
  return words[0] === '0' ? '0' : words.join('');
}`,
          java: `class Solution {
    public String largestNumber(int[] nums) {
        String[] words = new String[nums.length];
        for (int i = 0; i < nums.length; i++) words[i] = String.valueOf(nums[i]);
        Arrays.sort(words, (a, b) -> (b + a).compareTo(a + b));   // a goes first when a+b > b+a
        if (words[0].equals("0")) return "0";
        StringBuilder sb = new StringBuilder();
        for (String w : words) sb.append(w);
        return sb.toString();
    }
}`,
          cpp: `class Solution {
public:
    string largestNumber(vector<int>& nums) {
        vector<string> words;
        for (int x : nums) words.push_back(to_string(x));
        sort(words.begin(), words.end(), [](const string& a, const string& b) { return a + b > b + a; });  // a goes first when a+b > b+a
        if (words[0] == "0") return "0";
        string out;
        for (const string& w : words) out += w;
        return out;
    }
};`
        },
        complexity: 'O(n log n) comparisons, each comparing strings of up to about 10 characters (a constant), so O(n log n) time. O(n) space for the strings.',
        say: '“I’ll treat it as a sort with a custom comparator. Two numbers should be ordered by which concatenation is bigger: a before b when a-then-b beats b-then-a. That comparison is transitive, so sorting by it is valid. After sorting, I join the pieces; if the first piece is zero, the answer is just “0”. It’s O(n log n).”',
        followups: [
          { q: 'Why can’t you just compare the strings alphabetically?', a: '`"3"` and `"30"`: alphabetically `"30"` is bigger, but `"3" + "30" = "330"` beats `"30" + "3" = "303"`. The prefix relationship is what breaks alphabetical order, which is why the comparison has to look at the joined result.' },
          { q: 'How do you know the custom order is valid for sorting?', a: 'It has to be a consistent total preorder (transitive). Here a + b > b + a is the same as comparing a/(10^len(a) − 1) with b/(10^len(b) − 1), a comparison of real numbers, so it’s transitive. An inconsistent comparator can crash a sort in C++ or throw in Java.' },
          { q: 'What if there are no zeros-only inputs?', a: 'The all-zero check is cheap and you still need it for inputs like `[0,0]`. After sorting, a leading `"0"` means every piece is `"0"`.' }
        ]
      },
      {
        lc: 451,
        restate: 'Given a string, return it rearranged so that characters appear in decreasing order of how often they occur. Equal-frequency characters can come in any order, but all copies of a character must stay together.',
        examples: '- `"tree"` → `"eert"` (or `"eetr"`): `e` appears twice.\n- `"cccaaa"` → `"cccaaa"` or `"aaaccc"`.\n- `"Aabb"` → `"bbAa"` or `"bbaA"`: case matters, so `A` and `a` are different characters.',
        brute: 'Count the characters, sort the (character, count) pairs by count, and rebuild the string: O(n + d log d) for d distinct characters. That’s fine, and it’s a good first answer. The better one notices that a count is an integer between 1 and n.',
        insight: 'Counts are small integers in the range 1 to n, so sort them with a **bucket per count**. Count each character, put the character in the bucket of its frequency, then read the buckets from the highest frequency down, writing each character as many times as its count. No comparisons, so it’s O(n).',
        code: {
          py: `class Solution:
    def frequencySort(self, s: str) -> str:
        buckets = [[] for _ in range(len(s) + 1)]    # buckets[f] holds the characters that appear f times
        for ch, f in Counter(s).items():
            buckets[f].append(ch * f)
        return ''.join(chunk for f in range(len(s), 0, -1) for chunk in buckets[f])`,
          js: `function frequencySort(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  const buckets = Array.from({ length: s.length + 1 }, () => []);   // buckets[f] holds the characters that appear f times
  for (const [ch, f] of counts) buckets[f].push(ch.repeat(f));
  let out = '';
  for (let f = s.length; f > 0; f--) out += buckets[f].join('');
  return out;
}`,
          java: `class Solution {
    public String frequencySort(String s) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char ch : s.toCharArray()) counts.merge(ch, 1, Integer::sum);
        List<List<Character>> buckets = new ArrayList<>();             // buckets[f] holds the characters that appear f times
        for (int f = 0; f <= s.length(); f++) buckets.add(new ArrayList<>());
        for (Map.Entry<Character, Integer> e : counts.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        StringBuilder sb = new StringBuilder();
        for (int f = s.length(); f > 0; f--)
            for (char ch : buckets.get(f))
                for (int k = 0; k < f; k++) sb.append(ch);
        return sb.toString();
    }
}`,
          cpp: `class Solution {
public:
    string frequencySort(string s) {
        unordered_map<char, int> counts;
        for (char ch : s) counts[ch]++;
        vector<string> buckets(s.size() + 1);                         // buckets[f] holds the characters that appear f times
        for (auto& [ch, f] : counts) buckets[f] += string(f, ch);
        string out;
        for (int f = (int)s.size(); f > 0; f--) out += buckets[f];
        return out;
    }
};`
        },
        complexity: 'O(n) time: one pass to count, then the buckets add up to n characters in total. O(n) space for the count map and the buckets.',
        say: '“The obvious way is to count, sort the characters by count, and rebuild: O(n + d log d). But a frequency is an integer from 1 to n, so I can bucket-sort instead: put each character in the bucket for its count, then read the buckets from high to low, repeating each character count times. That’s O(n) with no comparisons.”',
        followups: [
          { q: 'Why is the sort-based answer still acceptable?', a: 'The number of distinct characters d is bounded by the alphabet, so d log d is tiny in practice. Offer both, and say you’d use the sort version first because it’s shorter and harder to get wrong.' },
          { q: 'How would a heap compare?', a: 'Push (count, character) pairs and pop the largest repeatedly: O(n + d log d), the same as sorting. A heap wins only if you need just the top few characters.' },
          { q: 'What if equal-frequency characters had to be alphabetical?', a: 'Sort each bucket (or the pairs, with a two-part key). Now stability or a tie-break key matters.' }
        ]
      },
      {
        lc: 164,
        restate: 'Given an unsorted integer array, return the largest difference between two successive elements *of its sorted form*, or 0 if it has fewer than two elements. You must do it in linear time and space.',
        examples: '- `[3,6,9,1]` → 3: sorted it’s `[1,3,6,9]`, and the gaps are 2, 3, 3.\n- `[10]` → 0.\n- Edge cases: all values equal → 0; two values far apart (`[1,10000000]` → 9999999); `0 ≤ nums[i] ≤ 10⁹`.',
        brute: 'Sort and scan neighbors: O(n log n), correct and usually fine. The question asks for linear time, which means no comparison sort.',
        insight: 'The pigeonhole principle. With n numbers between `lo` and `hi`, the n − 1 gaps add up to `hi − lo`, so the biggest gap is at least `⌊(hi − lo) / (n − 1)⌋`, call it `size`. Put numbers into buckets of width `size`. Two numbers in the same bucket differ by less than `size`, so they can’t be the answer. The largest gap therefore sits **between** buckets: it is the distance from one bucket’s maximum to the next non-empty bucket’s minimum. Track only the minimum and maximum of each bucket.',
        code: {
          py: `class Solution:
    def maximumGap(self, nums: List[int]) -> int:
        n = len(nums)
        if n < 2:
            return 0
        lo, hi = min(nums), max(nums)
        if lo == hi:
            return 0
        size = max(1, (hi - lo) // (n - 1))      # the answer is at least this, so same-bucket pairs can't win
        count = (hi - lo) // size + 1
        mins, maxs = [-1] * count, [-1] * count  # -1 = empty bucket (values are never negative)
        for x in nums:
            b = (x - lo) // size
            if mins[b] < 0 or x < mins[b]: mins[b] = x
            if maxs[b] < 0 or x > maxs[b]: maxs[b] = x
        best, prev = 0, lo
        for b in range(count):
            if mins[b] < 0:
                continue
            best = max(best, mins[b] - prev)     # gap from the previous bucket's max to this bucket's min
            prev = maxs[b]
        return best`,
          js: `function maximumGap(nums) {
  const n = nums.length;
  if (n < 2) return 0;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  if (lo === hi) return 0;
  const size = Math.max(1, Math.floor((hi - lo) / (n - 1)));   // the answer is at least this, so same-bucket pairs can't win
  const count = Math.floor((hi - lo) / size) + 1;
  const mins = new Array(count).fill(-1), maxs = new Array(count).fill(-1);   // -1 = empty bucket (values are never negative)
  for (const x of nums) {
    const b = Math.floor((x - lo) / size);
    if (mins[b] < 0 || x < mins[b]) mins[b] = x;
    if (maxs[b] < 0 || x > maxs[b]) maxs[b] = x;
  }
  let best = 0, prev = lo;
  for (let b = 0; b < count; b++) {
    if (mins[b] < 0) continue;
    best = Math.max(best, mins[b] - prev);     // gap from the previous bucket's max to this bucket's min
    prev = maxs[b];
  }
  return best;
}`,
          java: `class Solution {
    public int maximumGap(int[] nums) {
        int n = nums.length;
        if (n < 2) return 0;
        int lo = nums[0], hi = nums[0];
        for (int x : nums) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
        if (lo == hi) return 0;
        int size = Math.max(1, (hi - lo) / (n - 1));             // the answer is at least this, so same-bucket pairs can't win
        int count = (hi - lo) / size + 1;
        int[] mins = new int[count], maxs = new int[count];
        Arrays.fill(mins, -1);                                    // -1 = empty bucket (values are never negative)
        Arrays.fill(maxs, -1);
        for (int x : nums) {
            int b = (x - lo) / size;
            if (mins[b] < 0 || x < mins[b]) mins[b] = x;
            if (maxs[b] < 0 || x > maxs[b]) maxs[b] = x;
        }
        int best = 0, prev = lo;
        for (int b = 0; b < count; b++) {
            if (mins[b] < 0) continue;
            best = Math.max(best, mins[b] - prev);               // gap from the previous bucket's max to this bucket's min
            prev = maxs[b];
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maximumGap(vector<int>& nums) {
        int n = nums.size();
        if (n < 2) return 0;
        int lo = *min_element(nums.begin(), nums.end()), hi = *max_element(nums.begin(), nums.end());
        if (lo == hi) return 0;
        int size = max(1, (hi - lo) / (n - 1));                  // the answer is at least this, so same-bucket pairs can't win
        int count = (hi - lo) / size + 1;
        vector<int> mins(count, -1), maxs(count, -1);            // -1 = empty bucket (values are never negative)
        for (int x : nums) {
            int b = (x - lo) / size;
            if (mins[b] < 0 || x < mins[b]) mins[b] = x;
            if (maxs[b] < 0 || x > maxs[b]) maxs[b] = x;
        }
        int best = 0, prev = lo;
        for (int b = 0; b < count; b++) {
            if (mins[b] < 0) continue;
            best = max(best, mins[b] - prev);                    // gap from the previous bucket's max to this bucket's min
            prev = maxs[b];
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time: a min and max pass, one pass to fill the buckets, one to scan them (the bucket count is O(n)). O(n) space for the two bucket arrays.',
        say: '“Sorting and scanning is O(n log n), which is what I’d do first. For linear time I use the pigeonhole principle: the n − 1 gaps sum to max − min, so the biggest gap is at least (max − min) / (n − 1). If I make buckets that wide, two numbers in the same bucket can’t be the answer, so I only keep each bucket’s min and max and look at the gaps between consecutive non-empty buckets.”',
        followups: [
          { q: 'Why is the bucket width floor((hi − lo) / (n − 1))?', a: 'The largest gap is at least the average gap, `(hi − lo) / (n − 1)`, rounded up. A bucket of width `size = ⌊(hi − lo) / (n − 1)⌋` holds values that differ by at most `size − 1`, which is smaller than the answer. So the answer must straddle buckets.' },
          { q: 'Why only the min and the max of each bucket?', a: 'Inside a bucket, no gap can be the answer. The only gaps that matter go from one bucket’s maximum to the next non-empty bucket’s minimum.' },
          { q: 'Would radix sort work instead?', a: 'Yes. Radix sort the numbers (counting sort per digit, stable) in O(d · (n + 10)) and scan the neighbors. Same linear flavor, a different route.' }
        ]
      }
    ],

    practice: [
      { lc: 1051,
        hints: ['Compare the array with what it would look like if every student stood in order.', 'Make a sorted copy of the heights.', 'Count the positions where the original and the sorted copy differ.'],
        solution: { explain: 'Sort a copy and count mismatches. O(n log n) time, O(n) space (counting sort over 1 to 100 makes it O(n)).', code: {
          py: `class Solution:
    def heightChecker(self, heights: List[int]) -> int:
        return sum(a != b for a, b in zip(heights, sorted(heights)))`,
          js: `function heightChecker(heights) {
  const sorted = [...heights].sort((a, b) => a - b);
  return heights.filter((h, i) => h !== sorted[i]).length;
}` } },
        starter: { py: 'class Solution:\n    def heightChecker(self, heights: List[int]) -> int:\n        ', js: 'function heightChecker(heights) {\n  \n}' },
        tests: { fn: 'heightChecker', cases: [
          { args: [[1, 1, 4, 2, 1, 3]], out: 3 }, { args: [[5, 1, 2, 3, 4]], out: 5 }, { args: [[1, 2, 3, 4, 5]], out: 0 }, { args: [[1]], out: 0 }, { args: [[2, 1, 2, 1, 1, 2, 2, 1]], out: 4 }] } },

      { lc: 561,
        hints: ['Each pair contributes its smaller number, so you want the small numbers to be as large as possible.', 'Pairing two big numbers “wastes” the larger one; pair each number with its closest neighbor.', 'Sort, then pair neighbors: the answer is the sum of every other element, starting at the first.'],
        solution: { explain: 'After sorting, pairing neighbors loses the least: each pair gives up only the gap between its two members. Sum the elements at even indices. O(n log n) time.', code: {
          py: `class Solution:
    def arrayPairSum(self, nums: List[int]) -> int:
        return sum(sorted(nums)[::2])`,
          js: `function arrayPairSum(nums) {
  const a = [...nums].sort((x, y) => x - y);
  let total = 0;
  for (let i = 0; i < a.length; i += 2) total += a[i];
  return total;
}` } },
        starter: { py: 'class Solution:\n    def arrayPairSum(self, nums: List[int]) -> int:\n        ', js: 'function arrayPairSum(nums) {\n  \n}' },
        tests: { fn: 'arrayPairSum', cases: [
          { args: [[1, 4, 3, 2]], out: 4 }, { args: [[6, 2, 6, 5, 1, 2]], out: 9 }, { args: [[1, 1]], out: 1 }, { args: [[-1, 0]], out: -1 }, { args: [[-5, -4, 3, 8]], out: -2 }] } },

      { lc: 976,
        hints: ['Three lengths form a triangle with area exactly when the longest is shorter than the other two combined.', 'If you want the biggest perimeter, try the largest lengths first.', 'Sort descending and check consecutive triples: the first that fits is the answer.'],
        solution: { explain: 'In descending order, if a triple fails (`a >= b + c`), then a is too long for any smaller pair, so drop it and slide on. The first triple that passes has the largest possible lengths. O(n log n) time.', code: {
          py: `class Solution:
    def largestPerimeter(self, nums: List[int]) -> int:
        nums.sort(reverse=True)
        for i in range(len(nums) - 2):
            if nums[i] < nums[i + 1] + nums[i + 2]:
                return nums[i] + nums[i + 1] + nums[i + 2]
        return 0`,
          js: `function largestPerimeter(nums) {
  nums.sort((a, b) => b - a);
  for (let i = 0; i + 2 < nums.length; i++) {
    if (nums[i] < nums[i + 1] + nums[i + 2]) return nums[i] + nums[i + 1] + nums[i + 2];
  }
  return 0;
}` } },
        starter: { py: 'class Solution:\n    def largestPerimeter(self, nums: List[int]) -> int:\n        ', js: 'function largestPerimeter(nums) {\n  \n}' },
        tests: { fn: 'largestPerimeter', cases: [
          { args: [[2, 1, 2]], out: 5 }, { args: [[1, 2, 1, 10]], out: 0 }, { args: [[3, 2, 3, 4]], out: 10 }, { args: [[3, 6, 2, 3]], out: 8 }, { args: [[1, 2, 3]], out: 0 }] } },

      { lc: 2037,
        hints: ['Each student has to end up in a different seat, and you want the total distance to be as small as possible.', 'Crossing paths never helps: if two students swap seats, the total can only go up or stay the same.', 'Sort both lists and pair them by position.'],
        solution: { explain: 'Matching in sorted order never crosses, and an exchange argument shows crossing matches can’t be better. Sum the absolute differences. O(n log n) time.', code: {
          py: `class Solution:
    def minMovesToSeat(self, seats: List[int], students: List[int]) -> int:
        return sum(abs(a - b) for a, b in zip(sorted(seats), sorted(students)))`,
          js: `function minMovesToSeat(seats, students) {
  const a = [...seats].sort((x, y) => x - y), b = [...students].sort((x, y) => x - y);
  return a.reduce((total, seat, i) => total + Math.abs(seat - b[i]), 0);
}` } },
        starter: { py: 'class Solution:\n    def minMovesToSeat(self, seats: List[int], students: List[int]) -> int:\n        ', js: 'function minMovesToSeat(seats, students) {\n  \n}' },
        tests: { fn: 'minMovesToSeat', cases: [
          { args: [[3, 1, 5], [2, 7, 4]], out: 4 }, { args: [[4, 1, 5, 9], [1, 3, 2, 6]], out: 7 }, { args: [[2, 2, 6, 6], [1, 3, 2, 6]], out: 4 }, { args: [[1], [1]], out: 0 }] } },

      { lc: 1122,
        hints: ['Elements of arr2 define the order of the first part of the answer; the rest go at the end, ascending.', 'Count how many times each value appears in arr1.', 'Write out each arr2 value that many times, in arr2’s order, then the leftover values in ascending order.'],
        solution: { explain: 'A counting approach: tally arr1, emit arr2’s values in the given order, then emit whatever is left sorted. O(n + m + d log d) time for d leftover distinct values.', code: {
          py: `class Solution:
    def relativeSortArray(self, arr1: List[int], arr2: List[int]) -> List[int]:
        count = Counter(arr1)
        out = []
        for x in arr2:
            out += [x] * count.pop(x)
        for x in sorted(count):
            out += [x] * count[x]
        return out`,
          js: `function relativeSortArray(arr1, arr2) {
  const count = new Map();
  for (const x of arr1) count.set(x, (count.get(x) || 0) + 1);
  const out = [];
  for (const x of arr2) {
    for (let k = count.get(x); k > 0; k--) out.push(x);
    count.delete(x);
  }
  for (const x of [...count.keys()].sort((a, b) => a - b)) {
    for (let k = count.get(x); k > 0; k--) out.push(x);
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def relativeSortArray(self, arr1: List[int], arr2: List[int]) -> List[int]:\n        ', js: 'function relativeSortArray(arr1, arr2) {\n  \n}' },
        tests: { fn: 'relativeSortArray', cases: [
          { args: [[2, 3, 1, 3, 2, 4, 6, 7, 9, 2, 19], [2, 1, 4, 3, 9, 6]], out: [2, 2, 2, 1, 4, 3, 3, 9, 6, 7, 19] },
          { args: [[28, 6, 22, 8, 44, 17], [22, 28, 8, 6]], out: [22, 28, 8, 6, 17, 44] }, { args: [[1], [1]], out: [1] }, { args: [[5, 3, 5], [5]], out: [5, 5, 3] }] } },

      { lc: 274,
        hints: ['The h-index is the largest h such that at least h papers have h or more citations.', 'If you sort the citations in descending order, the paper at position i (counting from 1) has i papers at least as cited.', 'Walk the sorted list and keep the last position where `citations[i] >= i + 1`.'],
        solution: { explain: 'Sort descending; the h-index is the number of leading papers whose citation count is at least their rank. A counting version in O(n) works too, because an h-index can never exceed n. O(n log n) time.', code: {
          py: `class Solution:
    def hIndex(self, citations: List[int]) -> int:
        h = 0
        for i, c in enumerate(sorted(citations, reverse=True)):
            if c >= i + 1:
                h = i + 1
            else:
                break
        return h`,
          js: `function hIndex(citations) {
  const sorted = [...citations].sort((a, b) => b - a);
  let h = 0;
  while (h < sorted.length && sorted[h] >= h + 1) h++;
  return h;
}` } },
        starter: { py: 'class Solution:\n    def hIndex(self, citations: List[int]) -> int:\n        ', js: 'function hIndex(citations) {\n  \n}' },
        tests: { fn: 'hIndex', cases: [
          { args: [[3, 0, 6, 1, 5]], out: 3 }, { args: [[1, 3, 1]], out: 1 }, { args: [[0]], out: 0 }, { args: [[100]], out: 1 }, { args: [[4, 4, 4, 4]], out: 4 }, { args: [[0, 0]], out: 0 }] } },

      { lc: 75,
        hints: ['Only three values exist: 0, 1 and 2. Counting each and rewriting is O(n) but takes two passes.', 'For one pass, keep three zones: zeros on the left, twos on the right, and the unsorted middle.', 'Look at the middle item: a 0 swaps to the left zone, a 2 swaps to the right zone, a 1 just stays. This is a three-way partition, with 1 as the pivot.'],
        solution: { explain: 'The Dutch national flag: the same three-way partition quick sort uses, with pivot 1. After a swap with the right zone, don’t advance `i`, because the swapped-in item hasn’t been looked at. O(n) time, O(1) space, one pass.', code: {
          py: `class Solution:
    def sortColors(self, nums: List[int]) -> None:
        lt, i, gt = 0, 0, len(nums) - 1
        while i <= gt:
            if nums[i] == 0:
                nums[lt], nums[i] = nums[i], nums[lt]
                lt += 1
                i += 1
            elif nums[i] == 2:
                nums[i], nums[gt] = nums[gt], nums[i]
                gt -= 1
            else:
                i += 1`,
          js: `function sortColors(nums) {
  let lt = 0, i = 0, gt = nums.length - 1;
  while (i <= gt) {
    if (nums[i] === 0) {
      [nums[lt], nums[i]] = [nums[i], nums[lt]];
      lt++; i++;
    } else if (nums[i] === 2) {
      [nums[i], nums[gt]] = [nums[gt], nums[i]];
      gt--;
    } else {
      i++;
    }
  }
}` } },
        starter: { py: 'class Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        ', js: 'function sortColors(nums) {\n  \n}' },
        tests: { fn: 'sortColors', inPlace: 0, cases: [
          { args: [[2, 0, 2, 1, 1, 0]], out: [0, 0, 1, 1, 2, 2] }, { args: [[2, 0, 1]], out: [0, 1, 2] }, { args: [[0]], out: [0] }, { args: [[1, 1, 1]], out: [1, 1, 1] }, { args: [[2, 2, 0, 0]], out: [0, 0, 2, 2] }] } },

      { lc: 215,
        hints: ['Sorting and indexing works in O(n log n), but you don’t need the whole order.', 'Pick a pivot and split the numbers into larger, equal and smaller groups. Which group holds rank k?', 'Keep only that group and repeat: this is quickselect, O(n) on average. A min-heap of size k also works.'],
        solution: { explain: 'Quickselect on “largest”: split into larger and smaller than a random pivot and keep the group that holds rank k. Expected O(n) time, O(n) space for the lists.', code: {
          py: `import random

class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        while True:
            pivot = random.choice(nums)
            more = [x for x in nums if x > pivot]
            less = [x for x in nums if x < pivot]
            if k <= len(more):
                nums = more
            elif k > len(nums) - len(less):
                k -= len(nums) - len(less)
                nums = less
            else:
                return pivot`,
          js: `function findKthLargest(nums, k) {
  for (;;) {
    const pivot = nums[Math.floor(Math.random() * nums.length)];
    const more = nums.filter((x) => x > pivot);
    const less = nums.filter((x) => x < pivot);
    if (k <= more.length) {
      nums = more;
    } else if (k > nums.length - less.length) {
      k -= nums.length - less.length;
      nums = less;
    } else {
      return pivot;
    }
  }
}` } },
        starter: { py: 'class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ', js: 'function findKthLargest(nums, k) {\n  \n}' },
        tests: { fn: 'findKthLargest', cases: [
          { args: [[3, 2, 1, 5, 6, 4], 2], out: 5 }, { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], out: 4 }, { args: [[1], 1], out: 1 }, { args: [[2, 1], 2], out: 1 }, { args: [[7, 7, 7], 2], out: 7 }] } },

      { lc: 56,
        hints: ['If the intervals are in order of start, two can only overlap with the one right before them.', 'Sort by start. Keep a list of merged intervals and look at the last one.', 'If the next start is at or before the last end, extend that end (use the max of the two ends); otherwise start a new interval.'],
        solution: { explain: 'Sort by start, then one pass: extend the last merged interval while the next one overlaps, otherwise open a new one. The sort dominates: O(n log n) time.', code: {
          py: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        out = []
        for s, e in sorted(intervals):
            if out and s <= out[-1][1]:
                out[-1][1] = max(out[-1][1], e)
            else:
                out.append([s, e])
        return out`,
          js: `function merge(intervals) {
  const out = [];
  for (const [s, e] of [...intervals].sort((a, b) => a[0] - b[0])) {
    if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
    else out.push([s, e]);
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        ', js: 'function merge(intervals) {\n  \n}' },
        tests: { fn: 'merge', cases: [
          { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], out: [[1, 5]] }, { args: [[[1, 4], [0, 4]]], out: [[0, 4]] },
          { args: [[[1, 4], [2, 3]]], out: [[1, 4]] }, { args: [[[5, 6], [1, 2], [3, 4]]], out: [[1, 2], [3, 4], [5, 6]] }] } },

      { lc: 912,
        hints: ['You need O(n log n), so merge sort, quick sort and heap sort are all candidates.', 'For quick sort, pick a random pivot and split into less, equal and greater, so duplicates and sorted input can’t hurt.', 'Recurse into the smaller side and loop on the larger so the stack stays shallow.'],
        starter: { py: 'class Solution:\n    def sortArray(self, nums: List[int]) -> List[int]:\n        ', js: 'function sortArray(nums) {\n  \n}' },
        tests: { fn: 'sortArray', sig: { args: ['int[]'] }, cases: [
          { args: [[5, 2, 3, 1]], out: [1, 2, 3, 5] }, { args: [[5, 1, 1, 2, 0, 0]], out: [0, 0, 1, 1, 2, 5] }, { args: [[1]], out: [1] }, { args: [[3, 3, 3]], out: [3, 3, 3] },
          { args: [[-4, 0, 7, 4, 9, -5, -1, 0, -7, -1]], out: [-7, -5, -4, -1, -1, 0, 0, 4, 7, 9] }, { args: [[2, 1]], out: [1, 2] }] } },

      { lc: 179,
        hints: ['Sorting numerically or alphabetically gives wrong answers: `"30"` vs `"3"` shows why.', 'Compare two numbers by the two strings you get when you join them in either order.', 'Put a before b when `a + b > b + a`. Then handle the all-zeros result.'],
        starter: { py: 'class Solution:\n    def largestNumber(self, nums: List[int]) -> str:\n        ', js: 'function largestNumber(nums) {\n  \n}' },
        tests: { fn: 'largestNumber', sig: { args: ['int[]'] }, cases: [
          { args: [[10, 2]], out: '210' }, { args: [[3, 30, 34, 5, 9]], out: '9534330' }, { args: [[0, 0]], out: '0' }, { args: [[1]], out: '1' }, { args: [[34323, 3432]], out: '343234323' }] } },

      { lc: 451,
        hints: ['First count how often each character appears.', 'A count is a whole number from 1 to n. What does that suggest about how to order by it?', 'Bucket the characters by count, then read the buckets from high to low, repeating each character count times. Any order within a bucket is accepted.'],
        starter: { py: 'class Solution:\n    def frequencySort(self, s: str) -> str:\n        ', js: 'function frequencySort(s) {\n  \n}' },
        tests: { fn: 'frequencySort', sig: { args: ['str'] }, cases: [
          { args: ['tree'], out: ['eert', 'eetr'], any: true }, { args: ['cccaaa'], out: ['cccaaa', 'aaaccc'], any: true }, { args: ['Aabb'], out: ['bbAa', 'bbaA'], any: true },
          { args: ['a'], out: ['a'], any: true }, { args: [''], out: [''], any: true }] } },

      { lc: 164,
        hints: ['Sorting and scanning neighbors works in O(n log n). The question wants linear time.', 'The gaps between sorted neighbors add up to max − min, so the biggest gap is at least (max − min) / (n − 1).', 'Put numbers in buckets that wide and track each bucket’s min and max: the answer sits between buckets, never inside one.'],
        starter: { py: 'class Solution:\n    def maximumGap(self, nums: List[int]) -> int:\n        ', js: 'function maximumGap(nums) {\n  \n}' },
        tests: { fn: 'maximumGap', sig: { args: ['int[]'] }, cases: [
          { args: [[3, 6, 9, 1]], out: 3 }, { args: [[10]], out: 0 }, { args: [[1, 1, 1, 1]], out: 0 }, { args: [[1, 10000000]], out: 9999999 }, { args: [[100, 3, 2, 1]], out: 97 }, { args: [[5, 1, 9, 2]], out: 4 }] } }
    ],

    mistakes: [
      '**Calling quick sort O(n log n) without “on average”.** The worst case is O(n²), and a fixed pivot (first or last item) on sorted input triggers it. Say “random pivot” and “expected”.',
      '**Forgetting the tail of the merge.** After the main loop, one half still has items left. Without the `out + left[i:] + right[j:]` step you silently drop them.',
      '**`<` instead of `<=` in the merge.** It still sorts, but equal items from the right half jump ahead of equal items from the left, and the sort is no longer stable. This only shows when you sort records, so it hides easily.',
      '**A base case that misses the empty array.** `if len(nums) == 1` recurses forever on `[]`. Use `<= 1`.',
      '**Off-by-one in the partition.** Mixing inclusive and exclusive bounds (`hi = len - 1` in one place, `len` in another) makes ranges overlap or skip an item. Pick one convention and write it in a comment.',
      '**Sorting when a hash map gives O(n).** Duplicate checks, “do these two lists share an element”, and two-sum with indices are hash questions. Sorting first costs O(n log n) and loses the original indices.',
      '**Using counting sort on a huge range.** O(n + k) with k around 10⁹ means allocating a billion counters. Check the range before reaching for it.',
      '**An inconsistent comparator.** A custom order must be consistent: if a < b and b < c then a < c, and a is never before itself (use `<`, not `<=`, in a C++ comparator). Violating it can crash `std::sort` and throws in Java’s `TimSort` (“Comparison method violates its general contract”).',
      '**Language gotchas.** *Python:* `nums.sort()` sorts in place and **returns `None`**, so `x = nums.sort()` leaves `x` empty-handed; use `sorted(nums)` when you want a new list. *JavaScript:* `[10, 9, 1].sort()` gives `[1, 10, 9]`, because the default compares as **strings**; pass `(a, b) => a - b`. *Java:* `(a, b) -> a - b` overflows on large values; use `Integer.compare(a, b)`. Also `Arrays.sort(int[])` takes no comparator, so to sort primitives in descending order, sort ascending and read from the back, or box the values. *C++:* `std::sort` isn’t stable (use `stable_sort`), and a comparator written with `<=` is undefined behavior.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the worst-case time of quick sort that always picks the last element as pivot, on an array that’s already sorted?',
        choices: ['O(n log n)', 'O(n²)', 'O(n)', 'O(n log² n)'], answer: 1,
        explain: 'The last element of sorted input is the maximum, so every partition peels off one item and leaves a subproblem of size n − 1: n + (n − 1) + … + 1 comparisons, O(n²). A random pivot or median-of-three avoids it.' },
      { kind: 'concept', q: 'Which of these sorts is **stable** as usually written?',
        choices: ['Merge sort (taking the left item on ties)', 'Quick sort with in-place partitioning', 'Heap sort', 'Selection sort with swaps'], answer: 0,
        explain: 'Merge sort is stable when the merge takes from the left half on a tie. In-place quick sort, heap sort and swap-based selection sort all move items across long distances and can reorder equals.' },
      { kind: 'complexity', q: 'Which sort has O(n log n) worst-case time **and** needs only O(1) extra space?',
        choices: ['Heap sort', 'Merge sort', 'Quick sort', 'Counting sort'], answer: 0,
        explain: 'Heap sort sorts in place with no bad inputs. Merge sort needs O(n) extra space, quick sort can degrade to O(n²), and counting sort needs O(n + k) space.' },
      { kind: 'pattern', q: 'You need the 10th smallest value in an array of a million numbers, once. What’s the best fit?',
        choices: ['Quickselect, or a size-10 max-heap', 'Merge sort the whole array and index it', 'Counting sort', 'A hash map of counts'], answer: 0,
        explain: 'You don’t need the order, only one rank. Quickselect is O(n) on average, and a heap of size 10 is O(n log 10). Sorting the whole array does more work than the question needs.' },
      { kind: 'pattern', q: 'Which of these inputs makes counting sort a good choice? Pick every one that applies.',
        choices: ['Exam scores from 0 to 100 for a million students', 'Arbitrary 64-bit integers', 'Lowercase letters in a long string', 'Floating-point sensor readings with many decimals'], answer: [0, 2],
        explain: 'Counting sort wants small integer keys: scores (k = 101) and letters (k = 26). A 64-bit range would need billions of counters, and floats need bucketing or comparisons.' },
      { kind: 'bug', q: 'This merge sort never terminates on an empty list. What’s the bug?',
        code: `def merge_sort(a):
    if len(a) == 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    return out + left[i:] + right[j:]`, lang: 'py',
        choices: ['The base case should be `len(a) <= 1`', 'The merge should use `<` instead of `<=`', '`mid` should be `len(a) // 2 + 1`', 'The tail `left[i:] + right[j:]` is wrong'], answer: 0,
        explain: 'For `[]`, `mid` is 0, so the left half is `[]` again and the recursion never shrinks. `<= 1` covers both the empty and the one-item case.' },
      { kind: 'bug', q: 'In JavaScript, `[10, 9, 1].sort()` returns `[1, 10, 9]`. Why?',
        choices: ['The default comparison converts items to strings', 'sort() is unstable for numbers', 'sort() only sorts the first two items', 'Arrays of numbers need Array.from first'], answer: 0,
        explain: 'Without a comparator, JavaScript compares the string forms: `"1"` < `"10"` < `"9"`. Pass `(a, b) => a - b` to sort numerically.' },
      { kind: 'concept', q: 'Counting sort walks the input **right to left** when placing items. Why?',
        choices: ['It makes the sort stable, so equal values keep their original order', 'It makes the loop faster', 'It lets you skip the prefix sums', 'It avoids needing an output array'], answer: 0,
        explain: 'The prefix sum gives each value its last slot, and you fill slots from the back. Scanning right to left means the last equal item in the input takes the last slot, which preserves order. Stability is what lets radix sort use counting sort digit by digit.' },
      { kind: 'concept', q: 'No comparison-based sort can beat Ω(n log n) in the worst case. What is the reason?',
        choices: ['There are n! possible orders, and each comparison gives one yes/no answer, so you need about log₂(n!) ≈ n log n comparisons', 'Every sort must look at each pair of items', 'Recursion always adds a log n factor', 'Memory access takes O(log n) per item'], answer: 0,
        explain: 'It’s an information argument: telling n! orderings apart needs at least log₂(n!) binary decisions, and log₂(n!) grows like n log n. Counting and bucket sort escape it by not comparing items.' },
      { kind: 'concept', q: 'Sort Colors (75) uses a three-way partition with pivot 1. After swapping a `2` from the middle zone with the right zone, why doesn’t `i` advance?',
        choices: ['The item swapped in from the right hasn’t been examined yet', 'The swap might have been wrong', 'i only advances on zeros', 'The right zone is already sorted'], answer: 0,
        explain: 'Items from the right end haven’t been looked at, so after the swap `nums[i]` is a new, unclassified item. After swapping with the left zone, the swapped-in item is a known 1, so `i` can advance.' }
    ],

    flashcards: [
      { id: 'lower-bound', front: 'Why can’t a comparison sort beat O(n log n)?', back: 'n! possible orders, one yes/no answer per comparison: you need at least log₂(n!) ≈ n log n comparisons. Counting and bucket sort avoid it by not comparing.' },
      { id: 'merge-sort', front: 'Merge sort: time, space, stable?', back: 'O(n log n) always, O(n) extra space, stable if the merge takes from the left half on ties (`<=`).' },
      { id: 'quick-sort', front: 'Quick sort: time, space, stable?', back: 'O(n log n) on average, O(n²) worst case (bad pivots), O(log n) stack if you recurse into the smaller side, not stable.' },
      { id: 'pivot', front: 'How do you avoid quick sort’s O(n²) worst case?', back: 'A random pivot (or median-of-three). Add a three-way partition so many equal values cost O(n), not O(n²).' },
      { id: 'heap-sort', front: 'Heap sort: time, space, stable?', back: 'O(n log n) always, O(1) extra space, not stable. Build the max-heap in O(n), then swap the max to the back and sift down, n times.' },
      { id: 'counting', front: 'Counting sort: when and how?', back: 'Small integer range 0..k-1: tally, prefix-sum the tallies, then place items right to left (stable). O(n + k) time and space.' },
      { id: 'stable', front: 'What is a stable sort, and why does it matter?', back: 'Equal items keep their original relative order. It lets you sort by several keys one after another, and it’s what radix sort relies on.' },
      { id: 'quickselect', front: 'Quickselect: what is it, and what does it cost?', back: 'Partition around a pivot and keep only the part that contains rank k. O(n) on average, O(n²) worst case. For the top k of a stream, use a size-k heap instead.' },
      { id: 'builtins', front: 'Which built-in sorts are stable?', back: 'Python `sorted`/`list.sort` and JavaScript `Array.prototype.sort` (since ES2019): yes. Java `Arrays.sort(Object[])` / `Collections.sort`: yes. Java `Arrays.sort(int[])` and C++ `std::sort`: no (use `std::stable_sort`).' },
      { id: 'sort-scan', front: 'Sort-then-scan: what’s the total cost, and where does it show up?', back: 'O(n log n) for the sort plus O(n) for the pass. Intervals (merge, meeting rooms), closest pairs, greedy pairings, duplicates adjacent after sorting.' },
      { id: 'meeting-rooms', front: 'Meeting Rooms II without a heap: how?', back: 'Sort the start times and the end times separately. For each start: if it’s before the earliest end, add a room; otherwise reuse that room (advance the end pointer).' },
      { id: 'js-sort', front: 'What is the JavaScript `sort()` gotcha?', back: 'The default order compares items as strings, so `[10, 9, 1].sort()` is `[1, 10, 9]`. Pass `(a, b) => a - b`.' }
    ],

    deeper: [
      { title: 'Sorting Algorithms Visualizer (VisuAlgo)', url: 'https://visualgo.net/en/sorting', time: 'about 20 min', note: 'Step through bubble, insertion, merge, quick, counting and radix sort on your own input. Good for seeing exactly how a partition or a merge moves data.' },
      { title: 'Sorting Algorithms (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/sorting-algorithms/', time: 'reference', note: 'A catalog of every sort with complexity and stability notes. Use it as a reference, not a reading assignment.' },
      { title: 'Merge Sort, Quick Sort, Heap Sort Explained (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/merge-sort/', time: 'about 20 min', note: 'Walkthroughs with code in several languages, to compare with the versions on this page.' },
      { title: 'Sorting Algorithms Cheat Sheet (Interview Cake)', url: 'https://www.interviewcake.com/sorting-algorithm-cheat-sheet', time: 'about 5 min', note: 'One page of time, space and stability per algorithm: handy the night before an interview.' },
      { title: 'Sorting Techniques (Python docs)', url: 'https://docs.python.org/3/howto/sorting.html', time: 'about 15 min', note: 'Key functions, multi-key sorts, stability and `cmp_to_key`, from the official source. Directly useful for custom-order problems.' }
    ],

    detective: [
      { id: 'oven-schedule', decoys: ['heaps', 'greedy', 'two-pointers'],
        statement: 'A bakery has a list of bake jobs, each with a start minute and an end minute. A job needs an oven for its whole duration, and a job can start in an oven that finishes another job at that same minute. What’s the **fewest ovens** that can run every job?',
        why: 'Put the start times and end times in order and sweep once: a start before the earliest unfinished end needs a new oven, anything else reuses one. The sorted order is the whole trick. (A heap of end times also works, but the sorted-starts-and-ends version needs nothing beyond a sort.)' },
      { id: 'age-roster', decoys: ['heaps', 'binary-search', 'two-pointers'],
        statement: 'A census office has the ages of 40 million residents, each a whole number from 0 to 120. They need the full list in ascending order, as fast as possible.',
        why: 'The values come from a tiny known range, so counting sort tallies 121 counters in one pass and writes the answer in a second: O(n + 121). A comparison sort would pay n log n for no reason.' },
      { id: 'seat-swap', decoys: ['two-pointers', 'dp-1d', 'arrays-hashing'],
        statement: 'A school has n lockers at known positions along a hallway and n students at known positions. Each student must go to exactly one locker, each locker gets exactly one student, and the school wants the **smallest total walking distance**. How should students be matched?',
        why: 'Sort both lists and match them rank by rank. Crossing two matches never reduces the total distance, so the sorted pairing is optimal. The structure that matters is the order; the matching itself is trivial after a sort.' },
      { id: 'banner-number', decoys: ['math', 'string-algos', 'arrays-hashing'],
        statement: 'A lottery printer has a pile of numbered tickets. Gluing the ticket numbers side by side forms one long number. In what order should the tickets be glued so that the long number is as **large** as possible?',
        why: 'It’s a sort with a custom comparison: put ticket a before ticket b when the text “a then b” is bigger than “b then a”. Neither numeric nor alphabetical order works, but this pairwise order is consistent, so a normal sort with it gives the best arrangement.' },
      { id: 'steepest-step', decoys: ['kadane', 'prefix-sums', 'binary-search'],
        statement: 'A sensor logs a million integer readings in the order they arrive. If the readings were sorted, what would be the largest jump between two neighboring values? The engineers want the answer in **linear time**, without actually sorting.',
        why: 'The n − 1 sorted gaps add up to max − min, so the largest gap is at least their average. Buckets of that width can’t contain the answer inside a bucket, so it lies between one bucket’s max and the next bucket’s min. That’s bucket (pigeonhole) sort, with no comparisons.' }
    ]
  });
})();
