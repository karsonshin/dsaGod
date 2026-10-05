/* Offer Ready: Binary search lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'binary-search',

    hook: 'Binary search is the clearest case of “throw away half the problem with every question”. It turns a million candidates into about twenty probes, and it’s a favorite because the idea fits in a sentence while the details (off-by-ones, infinite loops, overflow) trip people up. NeetCode 150 gives it a section of its own, and the “search on the answer” variant shows up well beyond sorted arrays.',

    cues: [
      'The data is **sorted** (or sorted and then rotated), and you need a value, a position, or the place a value would go.',
      'The question asks for “the first”, “the last”, “the smallest that…” or “the largest that…” and a yes/no test flips only once along the way: no, no, no, yes, yes, yes.',
      'The statement asks for **O(log n)**, or n is so large (10⁹ and up) that even reading every candidate is too slow.',
      'You’re asked for the minimum or maximum value of something (a speed, a capacity, a number of days) and you can check whether **one candidate value works** in a single pass. That’s binary search on the answer.',
      'Brute force is a linear scan or a loop over every candidate, and each failed candidate also rules out all the ones on its side of it.',
      'The trap: the array is **unsorted**, or the yes/no test isn’t monotonic. Binary search needs a single boundary to find; otherwise use a hash map, sorting, or a different pattern.'
    ],

    intuition: [
      'Think of guessing a number from 1 to 100 when the only answer you get back is “higher” or “lower”. You never guess 1, then 2, then 3. You guess 50, and whatever comes back, half the numbers are gone. Then 25 or 75, and half of what’s left is gone. Seven guesses are always enough, because 2⁷ = 128 ≥ 100. A dictionary works the same way: open it in the middle, see which side your word is on, and ignore the other half.',
      'The precise version has a cleaner shape than “find a value”. Put a yes/no question next to every position, such as “is `nums[i] >= target`?”. In a sorted array the answers read **no, no, no, yes, yes, yes**, one boundary and nothing else. Every binary search in this lesson is the same job: **find the first yes**. Looking up a value, finding where to insert it, locating the minimum of a rotated array, and finding the smallest working speed are all that job with a different question.',
      '1. Keep a search space `[lo, hi)`: the answer is somewhere in it, and `hi` is one past the end. At first that’s the whole array, `lo = 0` and `hi = n`.\n2. Probe the middle, `mid = lo + (hi - lo) // 2`, and ask the question about `mid`.\n3. If the answer is **no**, `mid` and everything left of it can’t be the first yes, so `lo = mid + 1`.\n4. If the answer is **yes**, `mid` might be the first yes, so keep it: `hi = mid`.\n5. When `lo == hi` the space holds one position, the boundary, and that’s the answer.',
      'What keeps this honest is the **invariant**: every position left of `lo` is a no, and every position at or right of `hi` is a yes. Each step makes the space smaller while keeping the invariant true, so when the space is empty the boundary is exactly `lo`. If you ever feel lost in a binary search, say the invariant out loud and check that each branch preserves it. Most bugs are a branch that doesn’t.',
      'The cost is the number of halvings: n → n/2 → n/4 → … → 1, which is log₂ n steps. A billion elements take at most 30 probes (2³⁰ ≈ 1.07 billion).'
    ].join('\n\n'),

    viz: 'binary-search',

    template: {
      title: 'Lower bound: the first position that is big enough',
      note: 'This is the one to memorize. It returns the first index whose value is **at least** `target`, which is also where `target` would be inserted, or `n` if every value is smaller. To reuse it, change only **the question** in the `if` (here “is `nums[mid]` smaller than the target?”) and the **search range** (`0` to `n` here). Keep the skeleton: `lo < hi`, `mid = lo + (hi - lo) // 2`, and a `lo = mid + 1` / `hi = mid` pair. To check whether the target is present, look at `nums[lo]` afterwards (and make sure `lo < n`).',
      code: {
        py: `def lower_bound(nums, target):
    lo, hi = 0, len(nums)                    #> The answer lies in [lo, hi]. hi = n means "nothing is big enough"
    while lo < hi:                           #@loop > 1. Keep going while the search space [lo, hi) is not empty
        mid = lo + (hi - lo) // 2            #@mid > 2. Probe the middle. Written as lo + (hi - lo) / 2 so lo + hi can't overflow
        if nums[mid] < target:               #@test > 3. Ask the yes/no question: is mid too small to be the answer?
            lo = mid + 1                     #@right > 4. Yes: mid and everything left of it are too small. Discard them
        else:
            hi = mid                         #@left > 5. No: mid might be the answer. Keep it, discard only what's right of it
    return lo                                #@done > 6. lo == hi: the boundary between "too small" and "big enough"`,
        js: `function lowerBound(nums, target) {
  let lo = 0, hi = nums.length;               //> The answer lies in [lo, hi]. hi = n means "nothing is big enough"
  while (lo < hi) {                           //@loop > 1. Keep going while the search space [lo, hi) is not empty
    const mid = lo + Math.floor((hi - lo) / 2); //@mid > 2. Probe the middle. Written as lo + (hi - lo) / 2 so lo + hi can't overflow
    if (nums[mid] < target) {                 //@test > 3. Ask the yes/no question: is mid too small to be the answer?
      lo = mid + 1;                           //@right > 4. Yes: mid and everything left of it are too small. Discard them
    } else {
      hi = mid;                               //@left > 5. No: mid might be the answer. Keep it, discard only what's right of it
    }
  }
  return lo;                                  //@done > 6. lo == hi: the boundary between "too small" and "big enough"
}`,
        java: `class Solution {
    public int lowerBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;           //> The answer lies in [lo, hi]. hi = n means "nothing is big enough"
        while (lo < hi) {                       //@loop > 1. Keep going while the search space [lo, hi) is not empty
            int mid = lo + (hi - lo) / 2;       //@mid > 2. Probe the middle. Written as lo + (hi - lo) / 2 so lo + hi can't overflow
            if (nums[mid] < target) {           //@test > 3. Ask the yes/no question: is mid too small to be the answer?
                lo = mid + 1;                   //@right > 4. Yes: mid and everything left of it are too small. Discard them
            } else {
                hi = mid;                       //@left > 5. No: mid might be the answer. Keep it, discard only what's right of it
            }
        }
        return lo;                              //@done > 6. lo == hi: the boundary between "too small" and "big enough"
    }
}`,
        cpp: `class Solution {
public:
    int lowerBound(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();           //> The answer lies in [lo, hi]. hi = n means "nothing is big enough"
        while (lo < hi) {                       //@loop > 1. Keep going while the search space [lo, hi) is not empty
            int mid = lo + (hi - lo) / 2;       //@mid > 2. Probe the middle. Written as lo + (hi - lo) / 2 so lo + hi can't overflow
            if (nums[mid] < target) {           //@test > 3. Ask the yes/no question: is mid too small to be the answer?
                lo = mid + 1;                   //@right > 4. Yes: mid and everything left of it are too small. Discard them
            } else {
                hi = mid;                       //@left > 5. No: mid might be the answer. Keep it, discard only what's right of it
            }
        }
        return lo;                              //@done > 6. lo == hi: the boundary between "too small" and "big enough"
    }
};`
      },
      tests: { fn: { py: 'lower_bound', default: 'lowerBound' }, sig: { args: ['int[]', 'int'] }, cases: [
        { args: [[1, 3, 3, 5, 8], 3], out: 1 }, { args: [[1, 3, 3, 5, 8], 4], out: 3 }, { args: [[1, 3, 3, 5, 8], 9], out: 5 }, { args: [[1, 3, 3, 5, 8], 0], out: 0 },
        { args: [[], 5], out: 0 }, { args: [[2], 2], out: 0 }, { args: [[2], 3], out: 1 }, { args: [[5, 5, 5, 5], 5], out: 0 }] }
    },

    complexity: {
      time: 'O(log n)',
      space: 'O(1)',
      why: 'Each probe discards half of the remaining positions, so after k probes at most n / 2ᵏ are left. That reaches 1 when k = log₂ n: about 20 probes for a million values and 30 for a billion. The iterative version keeps just `lo`, `hi` and `mid`, so space is O(1). (A recursive version uses O(log n) stack.) For **binary search on the answer**, each probe runs a check that costs O(n), so the total is O(n log R), where R is the size of the range you search.',
      trap: 'O(log n) only counts the search. If the array isn’t sorted yet, sorting it costs O(n log n), which is more than one linear scan, so don’t sort just to search once. And a linked list has no O(1) “jump to the middle”, so the same idea there costs O(n) in pointer-walking.'
    },

    variations: [
      {
        name: 'Exact match (closed interval)',
        body: 'The version most people learn first: return the index of `target`, or −1. It uses a **closed** interval `[lo, hi]`, where both ends are still candidates, so a one-element space (`lo == hi`) must still be probed. That’s why the loop is `lo <= hi`, and why both updates skip `mid`: it has just been checked, so `lo = mid + 1` and `hi = mid - 1`. The pairs must match. `while lo <= hi` with `hi = mid` loops forever once `lo == hi`, and `while lo < hi` with `hi = mid - 1` skips a candidate. With duplicates this returns *some* match, not necessarily the first; use the lower bound when you need a specific one.',
        code: {
          py: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1              #> Closed interval: both ends are still candidates
    while lo <= hi:                        #> <= because a one-element space (lo == hi) still needs a look
        mid = lo + (hi - lo) // 2
        if nums[mid] == target:
            return mid                     #> Found it
        if nums[mid] < target:
            lo = mid + 1                   #> mid was checked, so skip it on both sides
        else:
            hi = mid - 1
    return -1`,
          js: `function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;           //> Closed interval: both ends are still candidates
  while (lo <= hi) {                          //> <= because a one-element space (lo == hi) still needs a look
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;     //> Found it
    if (nums[mid] < target) lo = mid + 1;     //> mid was checked, so skip it on both sides
    else hi = mid - 1;
  }
  return -1;
}`,
          java: `class Solution {
    public int binarySearch(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;           //> Closed interval: both ends are still candidates
        while (lo <= hi) {                          //> <= because a one-element space (lo == hi) still needs a look
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;    //> Found it
            if (nums[mid] < target) lo = mid + 1;   //> mid was checked, so skip it on both sides
            else hi = mid - 1;
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int binarySearch(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;      //> Closed interval: both ends are still candidates
        while (lo <= hi) {                          //> <= because a one-element space (lo == hi) still needs a look
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;    //> Found it
            if (nums[mid] < target) lo = mid + 1;   //> mid was checked, so skip it on both sides
            else hi = mid - 1;
        }
        return -1;
    }
};`
        },
        tests: { fn: { py: 'binary_search', default: 'binarySearch' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[-1, 0, 3, 5, 9, 12], 9], out: 4 }, { args: [[-1, 0, 3, 5, 9, 12], 2], out: -1 }, { args: [[5], 5], out: 0 }, { args: [[5], -5], out: -1 },
          { args: [[], 1], out: -1 }, { args: [[1, 3], 3], out: 1 }, { args: [[1, 3], 1], out: 0 }] }
      },
      {
        name: 'Upper bound, and counting duplicates',
        body: 'The **upper bound** is the first index whose value is **greater than** the target, so a run of equal values ends just before it. Take the lower-bound template and change one character: `<` becomes `<=` in the question. Then `upper_bound(x) - lower_bound(x)` is the number of copies of `x`, and the first and last positions of `x` are `lower_bound(x)` and `upper_bound(x) - 1` (Find First and Last Position, 34). Python’s `bisect_left` and `bisect_right` and C++’s `std::lower_bound` and `std::upper_bound` are exactly these two.',
        code: {
          py: `def upper_bound(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] <= target:            #> The only change from lower bound: <= instead of <
            lo = mid + 1                   #> Equal values count as "too small" now, so we move past them
        else:
            hi = mid
    return lo`,
          js: `function upperBound(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] <= target) lo = mid + 1;    //> The only change from lower bound: <= instead of <
    else hi = mid;
  }
  return lo;
}`,
          java: `class Solution {
    public int upperBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] <= target) lo = mid + 1;    //> The only change from lower bound: <= instead of <
            else hi = mid;
        }
        return lo;
    }
}`,
          cpp: `class Solution {
public:
    int upperBound(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] <= target) lo = mid + 1;    //> The only change from lower bound: <= instead of <
            else hi = mid;
        }
        return lo;
    }
};`
        },
        tests: { fn: { py: 'upper_bound', default: 'upperBound' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 3, 3, 5, 8], 3], out: 3 }, { args: [[1, 3, 3, 5, 8], 8], out: 5 }, { args: [[1, 3, 3, 5, 8], 0], out: 0 }, { args: [[], 1], out: 0 },
          { args: [[2, 2, 2], 2], out: 3 }, { args: [[1, 2], 1], out: 1 }] }
      },
      {
        name: 'Rotated sorted array: find the pivot',
        body: 'A sorted array rotated at some point, such as `[4, 5, 6, 7, 0, 1, 2]`, is two sorted runs glued together. It isn’t sorted, but it still has a yes/no question with one boundary. Compare `nums[mid]` with the **last** element: values in the first run are bigger than the last element, values in the second run are smaller (assuming distinct values). “Is `nums[i] <= nums[n-1]`?” reads **no, no, no, yes, yes, yes** across the array, and the first yes is the minimum, which is also the rotation point (Find Minimum in Rotated Sorted Array, 153). Comparing with the last element rather than the first is what makes the question work when the array wasn’t rotated at all. For searching a value in one pass, see the worked problem Search in Rotated Sorted Array below.',
        code: {
          py: `def rotation_start(nums):              # distinct values; returns the index of the minimum
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] > nums[hi]:           #> mid is still in the first (bigger) run, so the drop is to its right
            lo = mid + 1
        else:
            hi = mid                       #> mid is in the second run: it might be the minimum, so keep it
    return lo`,
          js: `function rotationStart(nums) {           // distinct values; returns the index of the minimum
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] > nums[hi]) lo = mid + 1;   //> mid is still in the first (bigger) run, so the drop is to its right
    else hi = mid;                            //> mid is in the second run: it might be the minimum, so keep it
  }
  return lo;
}`,
          java: `class Solution {
    public int rotationStart(int[] nums) {          // distinct values; returns the index of the minimum
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1; //> mid is still in the first (bigger) run, so the drop is to its right
            else hi = mid;                          //> mid is in the second run: it might be the minimum, so keep it
        }
        return lo;
    }
}`,
          cpp: `class Solution {
public:
    int rotationStart(vector<int>& nums) {          // distinct values; returns the index of the minimum
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1; //> mid is still in the first (bigger) run, so the drop is to its right
            else hi = mid;                          //> mid is in the second run: it might be the minimum, so keep it
        }
        return lo;
    }
};`
        },
        tests: { fn: { py: 'rotation_start', default: 'rotationStart' }, sig: { args: ['int[]'] }, cases: [
          { args: [[3, 4, 5, 1, 2]], out: 3 }, { args: [[4, 5, 6, 7, 0, 1, 2]], out: 4 }, { args: [[11, 13, 15, 17]], out: 0 }, { args: [[2, 1]], out: 1 }, { args: [[1]], out: 0 }, { args: [[5, 1, 2, 3, 4]], out: 1 }] }
      },
      {
        name: 'Binary search on the answer',
        body: 'The array doesn’t have to exist. When the question asks for the **smallest value that works** (or the largest), and bigger values never break something that works, search over the *values*. The recipe:\n\n1. Write `works(x)`: can the job be done with x? It’s usually a linear scan.\n2. Check that it’s **monotonic**: once it’s true, it stays true for larger x (or the reverse).\n3. Pick `lo` and `hi` so the answer is inside, and `hi` surely works.\n4. Run the lower-bound template with `works` as the question.\n\nHere the “array” is the numbers 0 to n + 1 and the question is “is x × x bigger than n?”: the first yes minus one is the integer square root. The two worked problems below, Koko Eating Bananas and Capacity To Ship Packages, use exactly this shape with a real `works`. Note the `long`: `mid * mid` overflows a 32-bit `int` for n near 2³¹.',
        code: {
          py: `def int_sqrt(n):
    lo, hi = 0, n + 1                      #> Candidates 0..n. n + 1 is a safe "yes": (n+1)² > n
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if mid * mid > n:                  #> The question: is mid already too big?
            hi = mid
        else:
            lo = mid + 1
    return lo - 1                          #> lo is the first x with x² > n, so the answer is just before it`,
          js: `function intSqrt(n) {
  let lo = 0, hi = n + 1;                     //> Candidates 0..n. n + 1 is a safe "yes": (n+1)² > n
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid * mid > n) hi = mid;              //> The question: is mid already too big?
    else lo = mid + 1;
  }
  return lo - 1;                              //> lo is the first x with x² > n, so the answer is just before it
}`,
          java: `class Solution {
    public int intSqrt(int n) {
        long lo = 0, hi = (long) n + 1;         //> Candidates 0..n. n + 1 is a safe "yes": (n+1)² > n
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;      // long, because mid * mid can pass 2^31
            if (mid * mid > n) hi = mid;        //> The question: is mid already too big?
            else lo = mid + 1;
        }
        return (int) (lo - 1);                  //> lo is the first x with x² > n, so the answer is just before it
    }
}`,
          cpp: `class Solution {
public:
    int intSqrt(int n) {
        long long lo = 0, hi = (long long)n + 1;    //> Candidates 0..n. n + 1 is a safe "yes": (n+1)² > n
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;     // long long, because mid * mid can pass 2^31
            if (mid * mid > n) hi = mid;            //> The question: is mid already too big?
            else lo = mid + 1;
        }
        return (int)(lo - 1);                       //> lo is the first x with x² > n, so the answer is just before it
    }
};`
        },
        tests: { fn: { py: 'int_sqrt', default: 'intSqrt' }, sig: { args: ['int'] }, cases: [
          { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [4], out: 2 }, { args: [8], out: 2 }, { args: [15], out: 3 }, { args: [16], out: 4 },
          { args: [2147395599], out: 46339 }, { args: [2147483647], out: 46340 }] }
      },
      {
        name: 'When binary search is the wrong tool',
        body: 'It needs two things: **random access** (jump to index mid in O(1)) and a **monotonic** question. An unsorted array has no boundary to find; a linked list has no cheap middle; and a question like “is there a subarray with sum k?” in an array with negatives isn’t monotonic, so use [prefix sums and a hash map](#/topic/prefix-sums) instead. If you’d only search a sorted array once, a linear scan is fine, and a hash set answers “is x in here?” in O(1) after one pass. Rotated arrays **with duplicates** (Search in Rotated Sorted Array II, 81) break the “which half is sorted” test when `nums[lo] == nums[mid] == nums[hi]`; the worst case degrades to O(n).'
      }
    ],

    worked: [
      {
        lc: 34,
        restate: 'Given an array sorted in non-decreasing order and a target, return the first and last index of the target, as `[first, last]`, or `[-1, -1]` if it isn’t there. It has to run in O(log n).',
        examples: '- `[5,7,7,8,8,10]`, target 8 → `[3, 4]`.\n- `[5,7,7,8,8,10]`, target 6 → `[-1, -1]`.\n- Edge cases: an empty array; a single element; every element equal to the target (`[2,2]`, 2 → `[0, 1]`); a target bigger than everything.',
        brute: 'Scan from the left until you see the target, and from the right likewise: O(n). That’s correct but ignores the sorted order, which the O(log n) requirement points at. Finding any match with a plain binary search and then walking outwards is O(n) too when every element is a match.',
        insight: 'The first copy of `x` is the **lower bound** of `x`: the first index with a value ≥ x. The last copy is just before the first value > x, and for integers, “first value > x” is the same as “first value ≥ x + 1”. So one lower-bound routine, called twice, gives both ends, and it also tells you whether the target exists: `nums[first] == target`, with `first < n`.',
        code: {
          py: `class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        def lower(x):                    # first index with nums[i] >= x
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if nums[mid] < x:
                    lo = mid + 1
                else:
                    hi = mid
            return lo

        first = lower(target)
        if first == len(nums) or nums[first] != target:
            return [-1, -1]
        return [first, lower(target + 1) - 1]`,
          js: `function searchRange(nums, target) {
  const lower = (x) => {                // first index with nums[i] >= x
    let lo = 0, hi = nums.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (nums[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const first = lower(target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  return [first, lower(target + 1) - 1];
}`,
          java: `class Solution {
    private int lower(int[] nums, int x) {          // first index with nums[i] >= x
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public int[] searchRange(int[] nums, int target) {
        int first = lower(nums, target);
        if (first == nums.length || nums[first] != target) return new int[]{-1, -1};
        return new int[]{first, lower(nums, target + 1) - 1};
    }
}`,
          cpp: `class Solution {
    int lower(vector<int>& nums, int x) {           // first index with nums[i] >= x
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

public:
    vector<int> searchRange(vector<int>& nums, int target) {
        int first = lower(nums, target);
        if (first == (int)nums.size() || nums[first] != target) return {-1, -1};
        return {first, lower(nums, target + 1) - 1};
    }
};`
        },
        complexity: 'O(log n) time: two binary searches. O(1) space.',
        say: '“The first position is the lower bound: the first index with a value at least the target. If that index is out of range or holds something else, the target isn’t there. The last position is one before the lower bound of target + 1, since the array holds integers. So I write one lower-bound helper and call it twice, which is O(log n) with O(1) space.”',
        followups: [
          { q: 'Why not find any match first and then expand outwards?', a: 'If every element equals the target, expanding costs O(n), which breaks the O(log n) requirement. The two lower bounds never walk the array.' },
          { q: 'What if the values aren’t integers?', a: 'Then `target + 1` isn’t “the next value”. Write an upper bound instead (change `<` to `<=` in the question) and use `upper(target) - 1` for the last index.' },
          { q: 'How would you count how many copies there are?', a: '`lower(target + 1) - lower(target)`, or `upper - lower`. No extra search is needed.' }
        ]
      },
      {
        lc: 33,
        restate: 'A sorted array of **distinct** integers was rotated at an unknown point, so `[0,1,2,4,5,6,7]` might become `[4,5,6,7,0,1,2]`. Given the rotated array and a target, return the target’s index, or −1. It has to run in O(log n).',
        examples: '- `[4,5,6,7,0,1,2]`, target 0 → 4.\n- `[4,5,6,7,0,1,2]`, target 3 → −1.\n- Edge cases: a single element; a two-element array like `[3,1]`; an array that wasn’t actually rotated; the target at either end.',
        brute: 'A linear scan is O(n) and always right, but it ignores the structure. Finding the pivot first, then binary searching the correct run, works too: two passes of O(log n). The single-pass idea below skips the pivot step.',
        insight: 'Split the array anywhere at `mid`: **at least one half is fully sorted**. The rotation point can only fall in one of the two halves. If `nums[lo] <= nums[mid]`, the left half `[lo, mid]` is sorted, so you can tell for sure whether the target lies inside it (`nums[lo] <= target < nums[mid]`). If it does, go left; if not, go right. Otherwise the right half is the sorted one, and the same test with `nums[mid] < target <= nums[hi]` tells you whether to go right.',
        code: {
          py: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] == target:
                return mid
            if nums[lo] <= nums[mid]:                   # the left half [lo, mid] is sorted
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1                        # the target is inside the sorted half
                else:
                    lo = mid + 1
            else:                                       # the right half [mid, hi] is sorted
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1`,
          js: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {                        // the left half [lo, mid] is sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;   // the target is inside the sorted half
      else lo = mid + 1;
    } else {                                            // the right half [mid, hi] is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
          java: `class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {                // the left half [lo, mid] is sorted
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;   // the target is inside the sorted half
                else lo = mid + 1;
            } else {                                    // the right half [mid, hi] is sorted
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {                // the left half [lo, mid] is sorted
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;   // the target is inside the sorted half
                else lo = mid + 1;
            } else {                                    // the right half [mid, hi] is sorted
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};`
        },
        complexity: 'O(log n) time: one halving per step. O(1) space.',
        say: '“After I pick mid, one half is always sorted, because the rotation point can only be on one side. I find the sorted half by comparing nums[lo] with nums[mid]. If the target falls inside that half’s range, I search it; otherwise I search the other half. Every step discards half, so it’s O(log n). It assumes distinct values.”',
        followups: [
          { q: 'Why `nums[lo] <= nums[mid]` and not `<`?', a: 'When `lo == mid` (a two-element space), the left half is a single element, which is sorted. With `<` you’d wrongly treat it as the unsorted half and discard the target. In `[3, 1]` searching for 1, that’s the difference between right and wrong.' },
          { q: 'What changes if values can repeat?', a: 'If `nums[lo] == nums[mid] == nums[hi]` you can’t tell which half is sorted. The standard fix is to shrink both ends by one (`lo += 1; hi -= 1`) and continue, which makes the worst case O(n). That’s Search in Rotated Sorted Array II (81).' },
          { q: 'Can you do it as two plain binary searches?', a: 'Yes. Find the pivot (the index of the minimum, as in the variation above), then binary search whichever side can hold the target: `[0, pivot - 1]` or `[pivot, n - 1]`. It’s O(log n) too, and some people find it easier to get right.' }
        ]
      },
      {
        lc: 875,
        restate: 'There are piles of bananas, and a guard returns in `h` hours. Each hour, Koko picks one pile and eats up to `k` bananas from it. If the pile has fewer than `k`, she eats it all and wastes the rest of the hour. Return the smallest integer `k` that lets her finish every pile within `h` hours.',
        examples: '- `piles = [3,6,7,11]`, `h = 8` → 4.\n- `piles = [30,11,23,4,20]`, `h = 5` → 30 (one pile per hour, so she must finish the largest in an hour).\n- `piles = [30,11,23,4,20]`, `h = 6` → 23.\n- Edge cases: one pile; `h` exactly equal to the number of piles; a pile of 10⁹ bananas.',
        brute: 'Try k = 1, 2, 3, … and take the first that works. Each try is O(n), and k can be as large as the biggest pile (10⁹), so that’s O(n · max(piles)), far too slow.',
        insight: 'If speed k finishes in time, any faster speed does too, so “can she finish at speed k?” reads **no, no, no, yes, yes, yes** as k grows. That’s a monotonic question, so binary search over k. The check is easy: pile `p` takes `ceil(p / k)` hours, so sum those and compare with `h`. The range is `[1, max(piles)]`: speed 1 is the slowest sensible choice, and `max(piles)` always works because each pile then takes one hour and the statement guarantees `h` is at least the number of piles. Find the first speed that works.',
        code: {
          py: `class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        lo, hi = 1, max(piles)            # max(piles) always works: one hour per pile
        while lo < hi:
            mid = lo + (hi - lo) // 2
            hours = sum((p - 1) // mid + 1 for p in piles)   # ceil(p / mid)
            if hours <= h:
                hi = mid                  # fast enough: mid might be the answer, try slower
            else:
                lo = mid + 1              # too slow: every speed up to mid fails
        return lo`,
          js: `function minEatingSpeed(piles, h) {
  let lo = 1, hi = Math.max(...piles);      // max(piles) always works: one hour per pile
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    let hours = 0;
    for (const p of piles) hours += Math.floor((p - 1) / mid) + 1;   // ceil(p / mid)
    if (hours <= h) hi = mid;               // fast enough: mid might be the answer, try slower
    else lo = mid + 1;                      // too slow: every speed up to mid fails
  }
  return lo;
}`,
          java: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);     // max(piles) always works: one hour per pile
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long hours = 0;                           // long: the total can pass 2^31
            for (int p : piles) hours += (p - 1) / mid + 1;   // ceil(p / mid)
            if (hours <= h) hi = mid;                 // fast enough: mid might be the answer, try slower
            else lo = mid + 1;                        // too slow: every speed up to mid fails
        }
        return lo;
    }
}`,
          cpp: `class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int lo = 1, hi = *max_element(piles.begin(), piles.end());   // max(piles) always works
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long long hours = 0;                      // long long: the total can pass 2^31
            for (int p : piles) hours += (p - 1) / mid + 1;          // ceil(p / mid)
            if (hours <= h) hi = mid;                 // fast enough: mid might be the answer, try slower
            else lo = mid + 1;                        // too slow: every speed up to mid fails
        }
        return lo;
    }
};`
        },
        complexity: 'O(n log M) time, where M = max(piles): about 30 probes, each a linear scan. O(1) space.',
        say: '“If Koko can finish at speed k, she can finish at any faster speed, so feasibility is monotonic in k and I can binary search the speed. For a given k, a pile takes ceil(p / k) hours, so I sum those and compare with h. The range is 1 to the largest pile, because that speed always works. I look for the first speed that fits: O(n log max) time, O(1) space.”',
        followups: [
          { q: 'Why is `hi = max(piles)` enough?', a: 'At that speed every pile takes exactly one hour, so the total is the number of piles, which the problem guarantees is at most `h`. A faster speed can’t do better, because an hour is the minimum per pile.' },
          { q: 'Could the lower bound be tighter than 1?', a: 'Yes: `ceil(sum(piles) / h)`, since she can’t eat more than k bananas per hour. It saves a few probes but isn’t needed. Mention it if asked how to speed it up.' },
          { q: 'How is this different from searching an array?', a: 'There’s no array to index. The candidates are the integers 1 to max(piles), the “array” is implicit, and the question is answered by running a check instead of reading `nums[mid]`.' }
        ]
      },
      {
        lc: 1011,
        restate: 'Packages with the given weights must be shipped **in order** within `days` days. Each day the ship carries a run of consecutive packages whose total weight is at most the ship’s capacity. Return the smallest capacity that gets everything shipped in time.',
        examples: '- `weights = [1,2,3,4,5,6,7,8,9,10]`, `days = 5` → 15.\n- `weights = [3,2,2,4,1,4]`, `days = 3` → 6.\n- `weights = [1,2,3,1,1]`, `days = 4` → 3.\n- Edge cases: one package; `days = 1` (the answer is the sum); `days` at least the number of packages (the answer is the heaviest package).',
        brute: 'Try every capacity from the heaviest package upward and simulate each: O(n · sum), too slow when the weights are large.',
        insight: 'The same monotonic shape as Koko: if capacity c ships everything in time, so does any bigger one. To check a capacity, pack greedily: add packages to today’s load until the next one wouldn’t fit, then start a new day. The range matters this time. Packages can’t be split, so capacity **below the heaviest package** is impossible (and the greedy loop would wrongly “ship” an oversized package alone). So search `[max(weights), sum(weights)]`: the sum ships everything in one day.',
        code: {
          py: `class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        lo, hi = max(weights), sum(weights)    # below max can't carry the heaviest; sum finishes in one day
        while lo < hi:
            mid = lo + (hi - lo) // 2
            needed, load = 1, 0
            for w in weights:
                if load + w > mid:             # today's ship is full: start another day
                    needed += 1
                    load = 0
                load += w
            if needed <= days:
                hi = mid                       # mid works: try smaller
            else:
                lo = mid + 1
        return lo`,
          js: `function shipWithinDays(weights, days) {
  let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b, 0);   // below max can't carry the heaviest; sum finishes in one day
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    let needed = 1, load = 0;
    for (const w of weights) {
      if (load + w > mid) { needed++; load = 0; }   // today's ship is full: start another day
      load += w;
    }
    if (needed <= days) hi = mid;                   // mid works: try smaller
    else lo = mid + 1;
  }
  return lo;
}`,
          java: `class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }   // below max can't carry the heaviest; sum finishes in one day
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int needed = 1, load = 0;
            for (int w : weights) {
                if (load + w > mid) { needed++; load = 0; }       // today's ship is full: start another day
                load += w;
            }
            if (needed <= days) hi = mid;                         // mid works: try smaller
            else lo = mid + 1;
        }
        return lo;
    }
}`,
          cpp: `class Solution {
public:
    int shipWithinDays(vector<int>& weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = max(lo, w); hi += w; }       // below max can't carry the heaviest; sum finishes in one day
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int needed = 1, load = 0;
            for (int w : weights) {
                if (load + w > mid) { needed++; load = 0; }       // today's ship is full: start another day
                load += w;
            }
            if (needed <= days) hi = mid;                         // mid works: try smaller
            else lo = mid + 1;
        }
        return lo;
    }
};`
        },
        complexity: 'O(n log S) time, where S = sum(weights): about log₂ S probes, each a linear pass. O(1) space.',
        say: '“If capacity c is enough, any larger capacity is too, so I can binary search it. For one capacity I pack greedily in order and count the days. The lowest sensible capacity is the heaviest package, since they can’t be split, and the highest is the total weight, which takes one day. I find the first capacity whose day count is within the limit: O(n log sum).”',
        followups: [
          { q: 'What goes wrong if `lo` starts at 1?', a: 'The greedy loop would accept a package that’s heavier than the capacity (it starts a new day, then adds it anyway), so tiny capacities look feasible and the search returns a wrong, too-small answer. The lower bound is part of the correctness here.' },
          { q: 'Why is greedy packing the right check?', a: 'Packages must ship in order, so the only choice each day is where to stop. Loading as many as fit never makes a later day worse, so the greedy day count is the true minimum for that capacity.' },
          { q: 'Which other problems look like this?', a: 'Split Array Largest Sum (410) is the same problem in different words: minimize the largest piece, with the same bounds. Bouquets (1482) and Koko (875) differ only in the check.' }
        ]
      }
    ],

    practice: [
      { lc: 704,
        hints: ['The array is sorted, and you’re looking for an exact value.', 'Keep a closed interval `[lo, hi]` and loop while `lo <= hi`.', 'Compare `nums[mid]` with the target: equal means return `mid`, smaller means `lo = mid + 1`, bigger means `hi = mid - 1`.'],
        solution: { explain: 'The closed-interval template: both updates skip `mid` because it has just been checked. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1`,
          js: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}` } },
        starter: { py: 'class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ', js: 'function search(nums, target) {\n  \n}' },
        tests: { fn: 'search', cases: [
          { args: [[-1, 0, 3, 5, 9, 12], 9], out: 4 }, { args: [[-1, 0, 3, 5, 9, 12], 2], out: -1 }, { args: [[5], 5], out: 0 }, { args: [[2, 5], 5], out: 1 }, { args: [[2, 5], 2], out: 0 }, { args: [[2, 5], 3], out: -1 }] } },

      { lc: 35,
        hints: ['The “insert position” of a value is the first index whose element is at least that value.', 'That’s the lower bound: search `[0, n)` with `lo < hi`.', 'If `nums[mid] < target`, then `lo = mid + 1`; otherwise `hi = mid`. Return `lo`.'],
        solution: { explain: 'Exactly the lower-bound template. If the target is bigger than everything, `lo` ends at `n`, the end of the array. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def searchInsert(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid
        return lo`,
          js: `function searchInsert(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}` } },
        starter: { py: 'class Solution:\n    def searchInsert(self, nums: List[int], target: int) -> int:\n        ', js: 'function searchInsert(nums, target) {\n  \n}' },
        tests: { fn: 'searchInsert', cases: [
          { args: [[1, 3, 5, 6], 5], out: 2 }, { args: [[1, 3, 5, 6], 2], out: 1 }, { args: [[1, 3, 5, 6], 7], out: 4 }, { args: [[1, 3, 5, 6], 0], out: 0 }, { args: [[1], 1], out: 0 }] } },

      { lc: 69,
        hints: ['You’re looking for the largest x with x × x ≤ n. That’s “the first x where x × x > n”, minus one.', 'Search the integers from 0 to n + 1 with the lower-bound template.', 'The question is `mid * mid > n`: if yes, `hi = mid`; if no, `lo = mid + 1`. Return `lo - 1`.'],
        solution: { explain: 'Binary search on the answer: the question “is x² bigger than n?” flips once. In Java or C++, use `long` for `mid * mid`. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def mySqrt(self, x: int) -> int:
        lo, hi = 0, x + 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if mid * mid > x:
                hi = mid
            else:
                lo = mid + 1
        return lo - 1`,
          js: `function mySqrt(x) {
  let lo = 0, hi = x + 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid * mid > x) hi = mid;
    else lo = mid + 1;
  }
  return lo - 1;
}` } },
        starter: { py: 'class Solution:\n    def mySqrt(self, x: int) -> int:\n        ', js: 'function mySqrt(x) {\n  \n}' },
        tests: { fn: 'mySqrt', cases: [
          { args: [4], out: 2 }, { args: [8], out: 2 }, { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [2], out: 1 }, { args: [2147395599], out: 46339 }, { args: [2147483647], out: 46340 }] } },

      { lc: 74,
        hints: ['Each row is sorted, and each row starts above where the last one ended, so the whole matrix read row by row is one sorted list.', 'Search indices `0` to `rows * cols - 1` as if the matrix were flattened.', 'Turn a flat index `mid` back into a cell with `row = mid // cols` and `col = mid % cols`.'],
        solution: { explain: 'A closed-interval search over a virtual flattened array. No flattening is done: the index arithmetic does it. O(log(m·n)) time, O(1) space.', code: {
          py: `class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        rows, cols = len(matrix), len(matrix[0])
        lo, hi = 0, rows * cols - 1
        while lo <= hi:
            mid = lo + (hi - lo) // 2
            v = matrix[mid // cols][mid % cols]
            if v == target:
                return True
            if v < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return False`,
          js: `function searchMatrix(matrix, target) {
  const rows = matrix.length, cols = matrix[0].length;
  let lo = 0, hi = rows * cols - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = matrix[Math.floor(mid / cols)][mid % cols];
    if (v === target) return true;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:\n        ', js: 'function searchMatrix(matrix, target) {\n  \n}' },
        tests: { fn: 'searchMatrix', cases: [
          { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], out: true }, { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], out: false },
          { args: [[[1]], 1], out: true }, { args: [[[1]], 2], out: false }, { args: [[[1, 3]], 3], out: true }, { args: [[[1], [3]], 3], out: true }] } },

      { lc: 153,
        hints: ['Compare `nums[mid]` with the **last** element, not the first.', 'If `nums[mid] > nums[hi]`, the minimum is to the right of `mid`. Otherwise `mid` could be the minimum.', 'Use `while lo < hi` with `lo = mid + 1` and `hi = mid`, and return `nums[lo]`.'],
        solution: { explain: 'Lower bound on the question “is `nums[i] <= nums[n - 1]`?”. Comparing with the right end works even when the array isn’t rotated. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def findMin(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] > nums[hi]:
                lo = mid + 1
            else:
                hi = mid
        return nums[lo]`,
          js: `function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}` } },
        starter: { py: 'class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        ', js: 'function findMin(nums) {\n  \n}' },
        tests: { fn: 'findMin', cases: [
          { args: [[3, 4, 5, 1, 2]], out: 1 }, { args: [[4, 5, 6, 7, 0, 1, 2]], out: 0 }, { args: [[11, 13, 15, 17]], out: 11 }, { args: [[2, 1]], out: 1 }, { args: [[1]], out: 1 }, { args: [[5, 1, 2, 3, 4]], out: 1 }] } },

      { lc: 744,
        hints: ['You want the first letter that is strictly greater than the target. That’s an upper bound.', 'Use the lower-bound shape with `letters[mid] <= target` as the question.', 'If every letter is ≤ the target, the answer wraps around to the first letter: use `lo % n`.'],
        solution: { explain: 'An upper bound, with the wrap-around handled by a modulo. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def nextGreatestLetter(self, letters: List[str], target: str) -> str:
        lo, hi = 0, len(letters)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if letters[mid] <= target:
                lo = mid + 1
            else:
                hi = mid
        return letters[lo % len(letters)]`,
          js: `function nextGreatestLetter(letters, target) {
  let lo = 0, hi = letters.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (letters[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return letters[lo % letters.length];
}` } },
        starter: { py: 'class Solution:\n    def nextGreatestLetter(self, letters: List[str], target: str) -> str:\n        ', js: 'function nextGreatestLetter(letters, target) {\n  \n}' },
        tests: { fn: 'nextGreatestLetter', cases: [
          { args: [['c', 'f', 'j'], 'a'], out: 'c' }, { args: [['c', 'f', 'j'], 'c'], out: 'f' }, { args: [['x', 'x', 'y', 'y'], 'z'], out: 'x' },
          { args: [['c', 'f', 'j'], 'j'], out: 'c' }, { args: [['c', 'f', 'j'], 'd'], out: 'f' }, { args: [['a', 'b'], 'z'], out: 'a' }] } },

      { lc: 34,
        hints: ['The first index of the target is a lower bound. The last index is just before the first value bigger than the target.', 'Write one helper that returns the first index with `nums[i] >= x`. Call it with `target` and `target + 1`.', 'Check that the lower bound is in range and holds the target before returning anything else than `[-1, -1]`.'],
        starter: { py: 'class Solution:\n    def searchRange(self, nums: List[int], target: int) -> List[int]:\n        ', js: 'function searchRange(nums, target) {\n  \n}' },
        tests: { fn: 'searchRange', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[5, 7, 7, 8, 8, 10], 8], out: [3, 4] }, { args: [[5, 7, 7, 8, 8, 10], 6], out: [-1, -1] }, { args: [[], 0], out: [-1, -1] }, { args: [[1], 1], out: [0, 0] },
          { args: [[2, 2], 2], out: [0, 1] }, { args: [[1, 2, 3], 3], out: [2, 2] }, { args: [[1, 2, 3], 4], out: [-1, -1] }] } },

      { lc: 33,
        hints: ['Whichever way you split, at least one half of a rotated array is sorted.', 'Compare `nums[lo]` with `nums[mid]` to find out which half it is.', 'If the target lies within the sorted half’s range, search that half; otherwise search the other.'],
        starter: { py: 'class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ', js: 'function search(nums, target) {\n  \n}' },
        tests: { fn: 'search', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[4, 5, 6, 7, 0, 1, 2], 0], out: 4 }, { args: [[4, 5, 6, 7, 0, 1, 2], 3], out: -1 }, { args: [[1], 0], out: -1 }, { args: [[1], 1], out: 0 },
          { args: [[3, 1], 1], out: 1 }, { args: [[5, 1, 3], 5], out: 0 }, { args: [[5, 1, 3], 3], out: 2 }, { args: [[4, 5, 6, 7, 0, 1, 2], 4], out: 0 }, { args: [[6, 7, 1, 2, 3, 4, 5], 6], out: 0 }] } },

      { lc: 875,
        hints: ['If speed k is fast enough, any faster speed is too. Search over the speed.', 'For a given speed, a pile of p bananas takes `ceil(p / k)` hours. Sum them and compare with `h`.', 'Search the speeds from 1 to `max(piles)` for the first one that finishes within `h` hours.'],
        starter: { py: 'class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        ', js: 'function minEatingSpeed(piles, h) {\n  \n}' },
        tests: { fn: 'minEatingSpeed', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 6, 7, 11], 8], out: 4 }, { args: [[30, 11, 23, 4, 20], 5], out: 30 }, { args: [[30, 11, 23, 4, 20], 6], out: 23 }, { args: [[1], 1], out: 1 },
          { args: [[1000000000], 2], out: 500000000 }, { args: [[312884470], 312884469], out: 2 }] } },

      { lc: 1011,
        hints: ['If capacity c ships everything in time, any bigger capacity does too. Search over capacity.', 'To check a capacity, load packages in order and start a new day whenever the next one doesn’t fit.', 'The smallest sensible capacity is the heaviest package, and the largest is the total weight.'],
        starter: { py: 'class Solution:\n    def shipWithinDays(self, weights: List[int], days: int) -> int:\n        ', js: 'function shipWithinDays(weights, days) {\n  \n}' },
        tests: { fn: 'shipWithinDays', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], out: 15 }, { args: [[3, 2, 2, 4, 1, 4], 3], out: 6 }, { args: [[1, 2, 3, 1, 1], 4], out: 3 }, { args: [[5], 1], out: 5 },
          { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1], out: 55 }] } },

      { lc: 162,
        hints: ['A peak is bigger than both neighbours, and the ends count as having a smaller neighbour outside the array. Any peak is accepted.', 'Compare `nums[mid]` with `nums[mid + 1]`. If the next one is bigger, you’re going uphill, so a peak lies to the right.', 'Otherwise a peak lies at `mid` or to its left: `hi = mid`. Use `while lo < hi` and return `lo`.'],
        solution: { explain: 'Binary search on the slope. Walking uphill, you can’t fall off the array without crossing a peak, so the side you climb toward always contains one. The question “is `nums[i] > nums[i + 1]`?” isn’t monotone over the whole array, but a boundary exists in every uphill run, which is enough. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < nums[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        return lo`,
          js: `function findPeakElement(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}` } },
        starter: { py: 'class Solution:\n    def findPeakElement(self, nums: List[int]) -> int:\n        ', js: 'function findPeakElement(nums) {\n  \n}' },
        tests: { fn: 'findPeakElement', cases: [
          { args: [[1, 2, 3, 1]], out: [2], any: true }, { args: [[1, 2, 1, 3, 5, 6, 4]], out: [1, 5], any: true }, { args: [[1]], out: [0], any: true },
          { args: [[2, 1]], out: [0], any: true }, { args: [[1, 2]], out: [1], any: true }, { args: [[5, 4, 3, 2, 1]], out: [0], any: true }] } },

      { lc: 1482,
        hints: ['If you can make m bouquets by day d, you can by any later day. Search over days.', 'To check a day, scan the garden: count a run of consecutive flowers with `bloomDay <= d`, and each time the run reaches k, that’s one bouquet and the run resets.', 'If `m * k` is more than the number of flowers, return −1 right away. Otherwise search from the earliest bloom to the latest.'],
        solution: { explain: 'Binary search on the day. The check counts disjoint runs of k adjacent bloomed flowers. O(n log(max − min)) time, O(1) space.', code: {
          py: `class Solution:
    def minDays(self, bloomDay: List[int], m: int, k: int) -> int:
        if m * k > len(bloomDay):
            return -1

        def enough(day):
            bouquets = run = 0
            for b in bloomDay:
                if b <= day:
                    run += 1
                    if run == k:
                        bouquets += 1
                        run = 0
                else:
                    run = 0
            return bouquets >= m

        lo, hi = min(bloomDay), max(bloomDay)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if enough(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo`,
          js: `function minDays(bloomDay, m, k) {
  if (m * k > bloomDay.length) return -1;
  const enough = (day) => {
    let bouquets = 0, run = 0;
    for (const b of bloomDay) {
      if (b <= day) {
        run++;
        if (run === k) { bouquets++; run = 0; }
      } else run = 0;
    }
    return bouquets >= m;
  };
  let lo = Math.min(...bloomDay), hi = Math.max(...bloomDay);
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (enough(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}` } },
        starter: { py: 'class Solution:\n    def minDays(self, bloomDay: List[int], m: int, k: int) -> int:\n        ', js: 'function minDays(bloomDay, m, k) {\n  \n}' },
        tests: { fn: 'minDays', cases: [
          { args: [[1, 10, 3, 10, 2], 3, 1], out: 3 }, { args: [[1, 10, 3, 10, 2], 3, 2], out: -1 }, { args: [[7, 7, 7, 7, 12, 7, 7], 2, 3], out: 12 },
          { args: [[1000000000, 1000000000], 1, 1], out: 1000000000 }, { args: [[1, 10, 2, 9, 3, 8, 4, 7, 5, 6], 4, 2], out: 9 }] } },

      { lc: 410,
        hints: ['You’re minimizing the largest piece. If a largest-sum limit L is achievable, any bigger limit is too. Search over L.', 'To check a limit, cut greedily: extend the current piece until the next number would push it past L, then start a new piece. Count pieces.', 'The limit can’t be below `max(nums)`, and `sum(nums)` always works with one piece. Look for the first limit that needs at most k pieces.'],
        solution: { explain: 'The same shape as shipping packages: the minimum capacity such that greedy packing needs at most k pieces. O(n log(sum)) time, O(1) space.', code: {
          py: `class Solution:
    def splitArray(self, nums: List[int], k: int) -> int:
        lo, hi = max(nums), sum(nums)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            pieces, load = 1, 0
            for x in nums:
                if load + x > mid:
                    pieces += 1
                    load = 0
                load += x
            if pieces <= k:
                hi = mid
            else:
                lo = mid + 1
        return lo`,
          js: `function splitArray(nums, k) {
  let lo = Math.max(...nums), hi = nums.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    let pieces = 1, load = 0;
    for (const x of nums) {
      if (load + x > mid) { pieces++; load = 0; }
      load += x;
    }
    if (pieces <= k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}` } },
        starter: { py: 'class Solution:\n    def splitArray(self, nums: List[int], k: int) -> int:\n        ', js: 'function splitArray(nums, k) {\n  \n}' },
        tests: { fn: 'splitArray', cases: [
          { args: [[7, 2, 5, 10, 8], 2], out: 18 }, { args: [[1, 2, 3, 4, 5], 2], out: 9 }, { args: [[1, 4, 4], 3], out: 4 }, { args: [[2, 3, 1, 2, 4, 3], 5], out: 4 }, { args: [[1], 1], out: 1 }] } }
    ],

    mistakes: [
      '**Mismatched loop and updates.** Half-open `[lo, hi)` pairs `while lo < hi` with `hi = mid`. Closed `[lo, hi]` pairs `while lo <= hi` with `hi = mid - 1`. Mixing them gives an infinite loop (`lo <= hi` with `hi = mid`) or a skipped candidate (`lo < hi` with `hi = mid - 1`). Pick one template and say its invariant.',
      '**An infinite loop from `lo = mid`.** If `lo = mid` and the space is two elements, `mid` rounds down to `lo` and nothing changes. Always move `lo` to `mid + 1`. If you truly need `lo = mid` (searching for a *last* yes), round `mid` up, `mid = lo + (hi - lo + 1) // 2`, and use `hi = mid - 1` on the other branch.',
      '**`mid = (lo + hi) / 2` overflowing.** When `lo + hi` passes 2³¹ − 1 in a 32-bit `int`, it wraps negative and `mid` is garbage. Write `lo + (hi - lo) / 2`. Python integers don’t overflow, but the habit is free. Joshua Bloch reported this exact bug in the JDK’s own `binarySearch` in 2006, after it had survived for years.',
      '**Returning the wrong thing at the end.** The lower bound can be `n`, one past the last index, so `nums[lo]` may be out of range: check `lo < n` before reading it. And answer-search problems that find the *first yes* sometimes want the value just before it (integer square root returns `lo - 1`).',
      '**Searching without a monotonic question.** Binary search on an unsorted array, or on an answer where “works” isn’t one-way (a bigger value can fail even though a smaller one works), returns garbage without any error. Before coding, write the pattern of answers across the range (no, no, yes, yes) and check it has one flip.',
      '**Bad bounds in answer-search.** A `lo` that’s too small can accept impossible values (capacity below the heaviest package); a `hi` that doesn’t surely work can make the loop return a value that fails. Reason about both ends, and what the check does at each.',
      '**Rotated arrays with duplicates.** The “which half is sorted” test fails when `nums[lo] == nums[mid] == nums[hi]`. Shrink both ends by one, and accept O(n) in the worst case.',
      '**Language gotchas.** *Python:* `//` for the midpoint (`/` gives a float and breaks indexing); `bisect_left` and `bisect_right` are the lower and upper bound, so use them in real code. *JavaScript:* `(lo + hi) / 2` is a fraction, so wrap it in `Math.floor`; `Math.max(...arr)` throws a `RangeError` on arrays in the hundreds of thousands, so use a loop on huge inputs. *Java:* `int` overflow in the midpoint and in products like `mid * mid`; `Arrays.binarySearch` returns *any* match for duplicates, and `-(insertionPoint) - 1` when absent. *C++:* `nums.size() - 1` on an empty vector is a huge number, because `size()` is unsigned; cast to `int` first. `std::lower_bound` and `std::upper_bound` exist, and signed overflow is undefined behaviour.'
    ],

    quiz: [
      { kind: 'complexity', q: 'Roughly how many probes does binary search need, at most, on a sorted array of 1,000,000 values?',
        choices: ['About 20', 'About 1,000', 'About 500,000', 'About 6'], answer: 0,
        explain: 'Each probe halves the space, and 2²⁰ = 1,048,576 ≥ 1,000,000, so 20 probes (21 at worst by the strict count) are enough.' },
      { kind: 'concept', q: 'Which loop condition and update pair is correct together?',
        choices: ['`while lo <= hi` with `hi = mid - 1`', '`while lo <= hi` with `hi = mid`', '`while lo < hi` with `hi = mid - 1`', '`while lo < hi` with `lo = mid`'], answer: 0,
        explain: 'A closed interval `[lo, hi]` needs `<=` and updates that skip `mid`. `lo <= hi` with `hi = mid` loops forever when `lo == hi`; `lo < hi` with `hi = mid - 1` throws away a candidate; and `lo = mid` never moves when the space has two elements.' },
      { kind: 'bug', q: 'This is meant to return the first index with a value ≥ target, but on `[1, 2, 3]` with target 2 it never stops. Why?',
        code: `def first_at_least(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
        choices: ['`hi = mid` with `lo <= hi` never shrinks the space once `lo == hi`. Use `while lo < hi`', '`mid` should round up', 'It should return `hi`', '`lo` should start at 1'], answer: 0,
        explain: 'When `lo == hi == 1`, `nums[1] >= 2` is true, so `hi = mid` leaves everything unchanged and the loop repeats forever. A half-open loop (`while lo < hi`) ends exactly when `lo == hi`.' },
      { kind: 'pattern', q: 'Which of these can be solved with binary search? Pick every one that applies.',
        choices: ['Find the smallest speed that finishes a job in time, when a faster speed never hurts', 'Find the first index of a value in a sorted array', 'Find the largest-sum subarray in an array with negative numbers', 'Check whether a value exists in an unsorted array'], answer: [0, 1],
        explain: 'Both of the first two have a single yes/no boundary. The largest-sum subarray is Kadane’s algorithm, and an unsorted array has no boundary to find (use a hash set).' },
      { kind: 'concept', q: 'In a rotated sorted array of distinct values, `nums[lo] <= nums[mid]` tells you what?',
        choices: ['The left half `[lo, mid]` is sorted', 'The target is in the left half', 'The array was not rotated', 'The right half `[mid, hi]` is sorted'], answer: 0,
        explain: 'If the rotation point were inside `[lo, mid]`, `nums[mid]` would be smaller than `nums[lo]`. So `nums[lo] <= nums[mid]` means the left half is in order. Whether the *target* is in it is a separate range check.' },
      { kind: 'complexity', q: 'Koko Eating Bananas runs a binary search on the speed over `[1, max(piles)]`, with an O(n) check per speed. What’s the time complexity?',
        choices: ['O(n log M), where M = max(piles)', 'O(n log n)', 'O(n · M)', 'O(log M)'], answer: 0,
        explain: 'There are about log₂ M probes, and each runs a linear scan of the piles.' },
      { kind: 'concept', q: 'Why can `(lo + hi) / 2` be a bug in Java or C++ but not in Python?',
        choices: ['`lo + hi` can exceed the 32-bit range and wrap to a negative number; Python integers don’t overflow', 'Python rounds differently', 'Java divides before adding', 'It only matters when `hi - lo` is odd'], answer: 0,
        explain: 'With 32-bit ints, two indices above 2³⁰ add up past 2³¹ − 1. `lo + (hi - lo) / 2` never produces a sum bigger than `hi`.' },
      { kind: 'concept', q: 'For `[1, 3, 3, 3, 7]` and target 3, what do the lower bound and the upper bound return?',
        choices: ['1 and 4', '1 and 3', '0 and 4', '2 and 4'], answer: 0,
        explain: 'The lower bound is the first index with a value ≥ 3, which is 1. The upper bound is the first index with a value > 3, which is 4. The difference, 3, is the number of copies.' },
      { kind: 'bug', q: 'In the capacity-to-ship search, what can go wrong if `lo` starts at 1 instead of the heaviest package?',
        choices: ['The greedy day count “ships” a package heavier than the capacity on a day of its own, so too-small capacities look feasible', 'The loop never ends', 'The midpoint overflows', 'Nothing: the answer is the same'], answer: 0,
        explain: 'If a package alone exceeds the capacity, the loop starts a new day and adds it anyway, so the check accepts a capacity that can’t carry it. The lower bound `max(weights)` is part of the problem’s correctness, not just a speedup.' }
    ],

    flashcards: [
      { id: 'first-yes', front: 'Every binary search in this lesson is one job. What is it?', back: 'Find the **first yes** in a row of no, no, no, yes, yes, yes. Define the yes/no question, and the lower-bound template does the rest.' },
      { id: 'invariant', front: 'What’s the invariant of the half-open template `[lo, hi)`?', back: 'Everything left of `lo` is a no, and everything at or right of `hi` is a yes. The answer is in `[lo, hi]`, and when `lo == hi` it’s `lo`.' },
      { id: 'lower-update', front: 'Lower bound template: the two updates and the loop condition?', back: '`while lo < hi`; if `nums[mid] < target` then `lo = mid + 1`, else `hi = mid`. Return `lo`.' },
      { id: 'closed-pair', front: 'Closed-interval search: loop condition and updates?', back: '`while lo <= hi`; found → return; too small → `lo = mid + 1`; too big → `hi = mid - 1`. Both updates skip `mid`.' },
      { id: 'mid-formula', front: 'How do you write the midpoint, and why?', back: '`mid = lo + (hi - lo) // 2`. `(lo + hi) / 2` can overflow a 32-bit int when both are large.' },
      { id: 'upper-bound', front: 'How does the upper bound differ from the lower bound?', back: 'It returns the first index with `nums[i] > target`. In the template, the question changes from `nums[mid] < target` to `nums[mid] <= target`.' },
      { id: 'count-copies', front: 'How do you count copies of x in a sorted array in O(log n)?', back: '`upper_bound(x) - lower_bound(x)`. The first and last positions are `lower_bound(x)` and `upper_bound(x) - 1`.' },
      { id: 'rotated-half', front: 'Rotated sorted array (distinct values): how do you find the sorted half?', back: 'If `nums[lo] <= nums[mid]`, the left half is sorted. Otherwise the right half is. Then check whether the target falls in the sorted half’s range.' },
      { id: 'rotated-min', front: 'Find the minimum of a rotated sorted array: what do you compare?', back: '`nums[mid]` with `nums[hi]`. If it’s bigger, the minimum is right of `mid` (`lo = mid + 1`); otherwise `hi = mid`.' },
      { id: 'answer-recipe', front: 'Binary search on the answer: what are the steps?', back: 'Write `works(x)`; check it’s monotonic; choose `lo` and `hi` with the answer inside and `hi` surely working; run the lower-bound template with `works` as the question.' },
      { id: 'answer-bounds', front: 'Capacity to ship packages: what range do you search?', back: 'From `max(weights)` (packages can’t be split) to `sum(weights)` (everything in one day). Below the max, the greedy check is wrong.' },
      { id: 'log-count', front: 'How many probes for a billion values?', back: 'At most about 30, because 2³⁰ ≈ 1.07 billion.' }
    ],

    deeper: [
      { title: 'Binary Search: Patterns Guide (LeetCode Discuss)', url: 'https://leetcode.com/discuss/general-discussion/786126/Python-Powerful-Ultimate-Binary-Search-Template', time: 'about 20 min', note: 'A community post that argues for one reusable template across the lower-bound, upper-bound and answer-search problems, with many example problems. Good for extra reps once this page feels easy.' },
      { title: 'Binary Search: LeetCode problem tag', url: 'https://leetcode.com/tag/binary-search/', time: 'reference', note: 'Every LeetCode problem tagged binary search. Sort by acceptance or difficulty for practice beyond this page.' },
      { title: 'Binary Search on Answer (Codeforces blog)', url: 'https://codeforces.com/blog/entry/9901', time: 'about 15 min', note: 'The “search on the answer” technique from competitive programming, linked from DSA-Kit. It’s the best next read after the Koko and shipping problems.' },
      { title: 'Extra, Extra: Nearly All Binary Searches and Mergesorts are Broken (Google Research blog)', url: 'https://ai.googleblog.com/2006/06/extra-extra-read-all-about-it-nearly.html', time: 'about 5 min', note: 'The short post about the midpoint overflow bug that sat in the JDK’s binary search for years. Worth reading once so you can explain why `lo + (hi - lo) / 2` is the habit.' }
    ],

    detective: [
      { id: 'first-bad-line',  decoys: ['arrays-hashing', 'sorting', 'two-pointers'],
        statement: 'A deploy went out at some point yesterday, and from then on every line in the service’s log file is an error line. Before it, none are. The log has a billion lines, and checking whether a given line is an error means pulling it from remote storage, which is slow. Which line should you start reading from, and how many pulls will it take at most?',
        why: 'Every line before the deploy is fine and every line after it is bad, so “is this line an error?” reads no, no, no, yes, yes, yes. That single flip is what binary search finds, using about thirty pulls for a billion lines, however slow each pull is.' },
      { id: 'printer-jobs', decoys: ['greedy', 'dp-1d', 'sliding-window'],
        statement: 'A print shop has a queue of jobs, each taking a known number of minutes, and k identical printers. Jobs must stay in order, and each printer takes one unbroken stretch of the queue. The shop wants to finish as early as possible. What’s the earliest finish time (the time the busiest printer needs)?',
        why: 'You can’t easily build the best split directly, but you can ask “can everything finish by minute T?” by packing greedily in order. That answer is monotonic in T, and T lies between the longest single job and the total, so you binary search the finish time and run a linear pass per probe.' },
      { id: 'ring-of-lights', decoys: ['arrays-hashing', 'sorting', 'two-pointers'],
        statement: 'A coastal route lists its lighthouses by serial number in increasing order, but the printed list begins at a different lighthouse for each ship (it wraps around the ring). All serial numbers are different. Given one printed list and a serial number, find its position, without reading every entry.',
        why: 'The list is two increasing runs joined together. Wherever you cut it, at least one half is still in order, so one range comparison tells you which half could hold the number. Each probe discards half the list, which is the rotated-array search.' },
      { id: 'rope-pieces', decoys: ['greedy', 'math', 'sorting'],
        statement: 'A rigger has several lengths of rope and needs at least k equal-length pieces for a rigging job. Leftover scraps are discarded, and each rope is cut on its own. What’s the longest piece length (a whole number) that still gives at least k pieces?',
        why: 'If pieces of length L give enough ropes, shorter pieces do too, so “are k pieces possible at L?” reads yes, yes, no, no as L grows. The number of pieces at L is a linear count of `rope // L`, so you binary search L, this time looking for the last yes.' },
      { id: 'summit-hunt', decoys: ['kadane', 'two-pointers', 'greedy'],
        statement: 'A trail’s elevation is recorded every 100 metres, and no two neighbouring readings are equal. A hiker wants to find a viewpoint: any reading higher than both neighbours (the trail’s two ends count as having lower ground beyond them). Reading every value is too slow. How can the hiker find one viewpoint quickly?',
        why: 'Compare the middle reading with the next one. If it’s lower, you’re going uphill, and walking uphill must end at a peak, so one exists to the right. Otherwise one exists at or to the left. Each comparison discards half the trail, so it’s a binary search on the slope.' }
    ]
  });
})();
