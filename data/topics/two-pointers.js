/* Offer Ready: Two pointers lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'two-pointers',

    hook: 'Two indices walking an array turn “check every pair” (O(n²)) into one pass (O(n)). It shows up in phone screens constantly: pair sums, palindromes, merging, in-place cleanup, and the 3Sum family. NeetCode 150 gives it its own section, and it’s the base for sliding window and for linked-list tricks.',

    cues: [
      'The input is **sorted** (or you’re allowed to sort it), and the question is about a **pair or triple** that hits a target.',
      'You need to compare the two **ends** of a sequence and move inward: palindromes, “the best pair of walls”, reversing.',
      'The question says **in place**, with O(1) extra space: removing duplicates, moving zeroes, partitioning by a value.',
      'Two sorted sequences must be merged, intersected or compared in one pass.',
      'The brute force is a double loop over pairs, and each comparison tells you that a whole group of pairs can be thrown away.',
      'The trap: on an **unsorted** array, a pair-sum question wants a hash map. Moving pointers only works because sorted order says which way to go.'
    ],

    intuition: [
      'Picture two people walking toward each other along a sorted row of price tags, one from the cheapest end and one from the priciest. You want two tags that add up to your budget. If the pair costs too much, the person at the expensive end is the problem: that tag is too big for **every** partner still in the row, since the cheapest partner is already in use. So they can step in for good. If the pair costs too little, the cheap-end tag can’t reach the budget with any remaining partner, so that person steps in. Each step discards a tag forever, so at most n steps are possible.',
      'That is the opposite-ends shape. Precisely:',
      '1. Sort first if the order isn’t given. Put `left = 0` and `right = n - 1`.\n2. While `left < right`, look at the pair `(nums[left], nums[right])`.\n3. If the pair is **too small**, move `left` up. If it’s **too big**, move `right` down. If it’s right, you’re done (or record it and keep going).\n4. Every move rules out a whole group of pairs, which is why one pass is enough.',
      'There is a second shape: **same direction**. A fast pointer `read` scans every element; a slow pointer `write` marks where the next kept element goes. Everything behind `write` is the finished answer. This is how you remove duplicates or push zeroes to the back without a second array.',
      'The skill is the **argument**, not the loop. Before using the pattern, say why moving a pointer can’t skip the answer. If you can’t, it’s the wrong pattern.'
    ].join('\n\n'),

    viz: 'two-pointers',

    template: {
      title: 'Opposite ends: find a pair in a sorted array',
      note: 'To reuse it, keep the skeleton and change two things: **what you compute** from the pair (a sum, an area, a comparison of two characters) and **which pointer moves** for each outcome. The rule for choosing is always “which pointer can’t possibly be part of a better answer?”.',
      code: {
        py: `def pair_sum(nums, target):               # nums is sorted
    left, right = 0, len(nums) - 1        #> One pointer at each end
    while left < right:                   #> Each pass discards one element, so at most n passes
        total = nums[left] + nums[right]  #@compare > 1. Look at the pair
        if total == target:
            return [left, right]          #@found > 2. Exactly right: done
        if total < target:
            left += 1                     #@moveL > 3. Too small: nums[left] can't work with anyone left, so drop it
        else:
            right -= 1                    #@moveR > 4. Too big: nums[right] is too large for every remaining partner
    return []`,
        js: `function pairSum(nums, target) {               // nums is sorted
  let left = 0, right = nums.length - 1;       //> One pointer at each end
  while (left < right) {                       //> Each pass discards one element, so at most n passes
    const total = nums[left] + nums[right];    //@compare > 1. Look at the pair
    if (total === target) {
      return [left, right];                    //@found > 2. Exactly right: done
    }
    if (total < target) {
      left++;                                  //@moveL > 3. Too small: nums[left] can't work with anyone left, so drop it
    } else {
      right--;                                 //@moveR > 4. Too big: nums[right] is too large for every remaining partner
    }
  }
  return [];
}`,
        java: `class Solution {
    public int[] pairSum(int[] nums, int target) {       // nums is sorted
        int left = 0, right = nums.length - 1;           //> One pointer at each end
        while (left < right) {                           //> Each pass discards one element, so at most n passes
            int total = nums[left] + nums[right];        //@compare > 1. Look at the pair
            if (total == target) {
                return new int[]{left, right};           //@found > 2. Exactly right: done
            }
            if (total < target) {
                left++;                                  //@moveL > 3. Too small: nums[left] can't work with anyone left, so drop it
            } else {
                right--;                                 //@moveR > 4. Too big: nums[right] is too large for every remaining partner
            }
        }
        return new int[0];
    }
}`,
        cpp: `class Solution {
public:
    vector<int> pairSum(vector<int>& nums, int target) {  // nums is sorted
        int left = 0, right = (int)nums.size() - 1;       //> One pointer at each end
        while (left < right) {                            //> Each pass discards one element, so at most n passes
            int total = nums[left] + nums[right];         //@compare > 1. Look at the pair
            if (total == target) {
                return {left, right};                     //@found > 2. Exactly right: done
            }
            if (total < target) {
                left++;                                   //@moveL > 3. Too small: nums[left] can't work with anyone left, so drop it
            } else {
                right--;                                  //@moveR > 4. Too big: nums[right] is too large for every remaining partner
            }
        }
        return {};
    }
};`
      },
      tests: { fn: { py: 'pair_sum', default: 'pairSum' }, sig: { args: ['int[]', 'int'] }, cases: [
        { args: [[2, 7, 11, 15], 9], out: [0, 1] }, { args: [[1, 2, 4, 7, 11, 15], 15], out: [2, 4] }, { args: [[-4, -1, 0, 3, 10], 6], out: [0, 4] },
        { args: [[5, 5], 10], out: [0, 1] }, { args: [[3], 6], out: [] }, { args: [[1, 2, 3, 9], 20], out: [] }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(1)',
      why: 'Every pass of the loop moves `left` up or `right` down, never back. The pointers start n − 1 apart and the loop stops when they meet, so there are at most n − 1 passes, each O(1). No extra array or map is needed, so space is O(1). If you have to sort first, the sort dominates: O(n log n) time overall.',
      trap: 'Don’t say “O(n²) because there are two pointers”. Say what each pointer does: they only move toward each other, so together they make at most n moves. And don’t forget the sort: “O(n) after sorting, O(n log n) if I have to sort it first”. For 3Sum, the outer loop adds one factor of n, so it’s O(n²), and that’s optimal for the problem.'
    },

    variations: [
      {
        name: 'Same direction: read and write pointers',
        body: 'For in-place cleanup, a fast pointer `read` visits every element and a slow pointer `write` marks the end of the answer so far. Copy `nums[read]` to `nums[write]` only when it belongs in the output. Here it removes duplicates from a sorted array: an element is new when it differs from the last one kept. The same skeleton does Move Zeroes (keep non-zeros) and Remove Duplicates II (keep an element unless it matches the one two back).',
        code: {
          py: `def dedupe_sorted(nums):
    if not nums:
        return 0
    write = 1                           #> nums[:write] is the answer so far
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]    #> A new value: keep it
            write += 1
    return write`,
          js: `function dedupeSorted(nums) {
  if (nums.length === 0) return 0;
  let write = 1;                         //> nums.slice(0, write) is the answer so far
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write++] = nums[read];        //> A new value: keep it
    }
  }
  return write;
}`
        },
        tests: { fn: { py: 'dedupe_sorted', default: 'dedupeSorted' }, cases: [
          { args: [[1, 1, 2]], out: 2 }, { args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], out: 5 }, { args: [[]], out: 0 }, { args: [[7]], out: 1 }, { args: [[4, 4, 4]], out: 1 }] }
      },
      {
        name: 'Three-way partition (Dutch flag)',
        body: 'With three groups (low, middle, high), keep three regions: everything before `lo` is low, everything after `hi` is high, and `i` scans the unknown middle. When `nums[i]` is low, swap it into `lo` and advance both; when it’s high, swap it into `hi` and move only `hi`, because the swapped-in value hasn’t been looked at yet. That detail is the common bug.',
        code: {
          py: `def partition3(nums, pivot):
    lo, i, hi = 0, 0, len(nums) - 1
    while i <= hi:
        if nums[i] < pivot:
            nums[lo], nums[i] = nums[i], nums[lo]
            lo += 1
            i += 1
        elif nums[i] > pivot:
            nums[i], nums[hi] = nums[hi], nums[i]
            hi -= 1                         #> Don't advance i: the swapped-in value is unchecked
        else:
            i += 1
    return nums`,
          js: `function partition3(nums, pivot) {
  let lo = 0, i = 0, hi = nums.length - 1;
  while (i <= hi) {
    if (nums[i] < pivot) {
      [nums[lo], nums[i]] = [nums[i], nums[lo]];
      lo++;
      i++;
    } else if (nums[i] > pivot) {
      [nums[i], nums[hi]] = [nums[hi], nums[i]];
      hi--;                                  //> Don't advance i: the swapped-in value is unchecked
    } else {
      i++;
    }
  }
  return nums;
}`
        },
        tests: { fn: { py: 'partition3', default: 'partition3' }, cases: [
          { args: [[2, 0, 2, 1, 1, 0], 1], out: [0, 0, 1, 1, 2, 2] }, { args: [[1, 1, 1], 1], out: [1, 1, 1] }, { args: [[5, 0, 5], 5], out: [0, 5, 5] }] }
      },
      {
        name: 'Merge two sorted sequences',
        body: 'One pointer per sequence, always take the smaller front element. If the result has to live inside the first array’s spare space (Merge Sorted Array, 88), fill from the **back** instead: the largest element goes at the end, where nothing unread is stored. Filling from the front would overwrite values you haven’t read yet.'
      },
      {
        name: 'Palindromes: compare the two ends',
        body: 'Start one pointer at each end, skip characters that don’t count (spaces, punctuation), and compare. A mismatch means “no”; the pointers meeting means “yes”. For “can it become a palindrome by deleting at most one character” (680), on the first mismatch try skipping the left character **or** the right one, and check that the rest is a plain palindrome. Two tries, still O(n).'
      },
      {
        name: 'When two pointers is the wrong tool',
        body: 'If the array is unsorted and you can’t sort it, because the answer needs original positions, use a hash map of values seen so far: [that’s the Two Sum pattern](#/topic/arrays-hashing). If the answer is a **contiguous** stretch that grows and shrinks with a rule, you want a [sliding window](#/topic/sliding-window), which is two same-direction pointers with a summary of what’s between them.'
      }
    ],

    worked: [
      {
        lc: 167,
        restate: 'You get a list of integers already sorted from smallest to largest, plus a target. Exactly one pair of different positions adds up to the target. Return those two positions, counting from 1, using only constant extra space.',
        examples: '- `[2, 7, 11, 15]`, target 9 → `[1, 2]`.\n- `[2, 3, 4]`, target 6 → `[1, 3]`.\n- `[-1, 0]`, target −1 → `[1, 2]`: negatives are fine, because the order of the array is what drives the pointers.\n- Edge cases: duplicates (`[5, 5]`, target 10) work, since the two pointers are different positions.',
        brute: 'Try every pair: O(n²). A hash map of seen values gives O(n) time but uses O(n) space, which the question rules out. A binary search for `target - nums[i]` for each i is O(n log n).',
        insight: 'Look at the two ends. If their sum is too large, the right element is too big for every partner (the smallest partner is already the left end), so `right` can move in for good. If it’s too small, the left element is too small for every partner, so `left` moves in. Each step discards one element and never discards the answer.',
        code: {
          py: `class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        left, right = 0, len(numbers) - 1
        while left < right:
            total = numbers[left] + numbers[right]
            if total == target:
                return [left + 1, right + 1]   # the problem counts from 1
            if total < target:
                left += 1
            else:
                right -= 1
        return []`,
          js: `function twoSum(numbers, target) {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const total = numbers[left] + numbers[right];
    if (total === target) return [left + 1, right + 1];  // the problem counts from 1
    if (total < target) left++;
    else right--;
  }
  return [];
}`,
          java: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int total = numbers[left] + numbers[right];
            if (total == target) return new int[]{left + 1, right + 1};  // the problem counts from 1
            if (total < target) left++;
            else right--;
        }
        return new int[0];
    }
}`,
          cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        int left = 0, right = (int)numbers.size() - 1;
        while (left < right) {
            int total = numbers[left] + numbers[right];
            if (total == target) return {left + 1, right + 1};  // the problem counts from 1
            if (total < target) left++;
            else right--;
        }
        return {};
    }
};`
        },
        complexity: 'O(n) time: the pointers make at most n − 1 moves in total. O(1) space.',
        say: '“The array is sorted, so I can use two pointers from the ends. If the sum is too big, the right element can’t pair with anything remaining, since the smallest possible partner is already at the left, so I move right in. If it’s too small, I move left in. Each step discards one element, so it’s O(n) time and O(1) space. The problem counts from 1, so I add one when returning.”',
        followups: [
          { q: 'Why can’t moving a pointer skip the answer?', a: 'Suppose the answer is the pair (i, j) and `left` reaches i first. While `right > j`, the sum is at least `nums[i] + nums[right]`, which exceeds the target, so `right` moves down, not `left`. The same argument works if `right` reaches j first. The pointers can’t cross the answer without hitting it.' },
          { q: 'What if the array weren’t sorted?', a: 'Either sort a copy of (value, index) pairs and use this, O(n log n), or use a hash map from value to index, O(n) time and O(n) space. Say which trade-off you’re making.' },
          { q: 'What if there could be several answers and you had to return all of them?', a: 'After a match, move both pointers inward and keep going; skip equal neighbours if the pairs must be distinct. That’s the inner loop of 3Sum.' }
        ]
      },
      {
        lc: 15,
        restate: 'Given a list of integers, return every distinct set of three values (taken from three different positions) that adds up to zero. The same triple of values must not appear twice, and the triples can come back in any order.',
        examples: '- `[-1, 0, 1, 2, -1, -4]` → `[[-1, -1, 2], [-1, 0, 1]]`.\n- `[0, 1, 1]` → `[]`.\n- `[0, 0, 0]` → `[[0, 0, 0]]`.\n- Edge cases: fewer than three numbers → empty; many repeated values (`[0, 0, 0, 0]`) must still give one triple.',
        brute: 'Three nested loops, then dedupe the triples with a set: O(n³) time. A hash map for the third value brings it to O(n²) time and O(n) space, but then removing duplicates is awkward.',
        insight: 'Fix the first number, and the rest is Two Sum II on the numbers to its right: find a pair adding to `-first`. Sort once so the pair search can use two pointers. Duplicates are handled by order: skip an outer value equal to the previous one, and after recording a triple, skip over equal values for `left`.',
        code: {
          py: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if nums[i] > 0:
                break                          # everything after is positive: no sum of zero
            if i > 0 and nums[i] == nums[i - 1]:
                continue                       # same first value as last time: same triples
            left, right = i + 1, len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total < 0:
                    left += 1
                elif total > 0:
                    right -= 1
                else:
                    res.append([nums[i], nums[left], nums[right]])
                    left += 1
                    while left < right and nums[left] == nums[left - 1]:
                        left += 1              # skip equal middles so the triple isn't repeated
        return res`,
          js: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;                    // everything after is positive: no sum of zero
    if (i > 0 && nums[i] === nums[i - 1]) continue;  // same first value as last time: same triples
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const total = nums[i] + nums[left] + nums[right];
      if (total < 0) left++;
      else if (total > 0) right--;
      else {
        res.push([nums[i], nums[left], nums[right]]);
        left++;
        while (left < right && nums[left] === nums[left - 1]) left++;  // skip equal middles
      }
    }
  }
  return res;
}`,
          java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (nums[i] > 0) break;                          // everything after is positive: no sum of zero
            if (i > 0 && nums[i] == nums[i - 1]) continue;   // same first value as last time: same triples
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (total < 0) left++;
                else if (total > 0) right--;
                else {
                    res.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    left++;
                    while (left < right && nums[left] == nums[left - 1]) left++;  // skip equal middles
                }
            }
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        int n = nums.size();
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;                          // everything after is positive: no sum of zero
            if (i > 0 && nums[i] == nums[i - 1]) continue;   // same first value as last time: same triples
            int left = i + 1, right = n - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (total < 0) left++;
                else if (total > 0) right--;
                else {
                    res.push_back({nums[i], nums[left], nums[right]});
                    left++;
                    while (left < right && nums[left] == nums[left - 1]) left++;  // skip equal middles
                }
            }
        }
        return res;
    }
};`
        },
        complexity: 'O(n²) time: the sort is O(n log n), then each of the n outer values runs one O(n) two-pointer pass. O(1) extra space besides the output (and the sort’s own stack).',
        say: '“I’ll sort, then fix the smallest number of each triple and look for the other two with two pointers on the rest, which is Two Sum II. Sorting also makes duplicates easy: skip an outer value equal to the previous one, and after recording a triple skip equal values for the left pointer. That’s O(n²) time, and O(n²) is the best known for 3Sum.”',
        followups: [
          { q: 'Why only skip duplicates for `left` after a match, and not for `right`?', a: 'After a match, `left` moves up, so the sum is now too big or equal-plus; a duplicate for `left` would reproduce the same triple. The sum then becomes positive and `right` moves down on its own. You can skip equal `right` values too, but it isn’t required for correctness.' },
          { q: 'Why can you stop once `nums[i] > 0`?', a: 'The array is sorted, so the other two numbers are at least as large. Three positive numbers can’t sum to zero.' },
          { q: 'How would you generalize to 4Sum or kSum?', a: 'Add one more outer loop per extra number, with the same duplicate skipping, and finish with the two-pointer pass: O(n^(k−1)) overall. Write it recursively if k is a parameter.' },
          { q: 'Could you use a hash set instead of sorting?', a: 'Yes, for O(n²) time too, but removing duplicate triples is much messier and costs O(n) extra space. Sorting plus pointers is the standard answer.' }
        ]
      },
      {
        lc: 11,
        restate: 'You get a list of non-negative heights, one for each vertical wall standing at position 0, 1, 2, and so on. Pick two walls to hold water between them. The amount held is the distance between them times the shorter height. Return the largest amount you can get.',
        examples: '- `[1, 8, 6, 2, 5, 4, 8, 3, 7]` → 49: walls at positions 1 and 8 (heights 8 and 7), width 7, so 7 × 7.\n- `[1, 1]` → 1.\n- Edge cases: two walls only; a zero-height wall holds nothing; the thickness of walls is ignored.',
        brute: 'Try every pair of walls: O(n²) time, O(1) space. Fine for a few thousand walls, too slow for 10⁵.',
        insight: 'Start with the widest pair: the outer walls. Any narrower pair needs a taller **shorter wall** to compete. So move the shorter of the two walls inward. Moving the taller one only shrinks the width and can’t raise the limit, which is the shorter wall, so every pair it would have led to is no better than what we’ve already measured.',
        code: {
          py: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        left, right = 0, len(height) - 1
        best = 0
        while left < right:
            best = max(best, min(height[left], height[right]) * (right - left))
            if height[left] < height[right]:
                left += 1       # the shorter wall limits every pair it's part of: try a new one
            else:
                right -= 1
        return best`,
          js: `function maxArea(height) {
  let left = 0, right = height.length - 1, best = 0;
  while (left < right) {
    best = Math.max(best, Math.min(height[left], height[right]) * (right - left));
    if (height[left] < height[right]) left++;   // the shorter wall limits every pair it's part of: try a new one
    else right--;
  }
  return best;
}`,
          java: `class Solution {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1, best = 0;
        while (left < right) {
            best = Math.max(best, Math.min(height[left], height[right]) * (right - left));
            if (height[left] < height[right]) left++;   // the shorter wall limits every pair it's part of: try a new one
            else right--;
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int left = 0, right = (int)height.size() - 1, best = 0;
        while (left < right) {
            best = max(best, min(height[left], height[right]) * (right - left));
            if (height[left] < height[right]) left++;   // the shorter wall limits every pair it's part of: try a new one
            else right--;
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time: one pointer moves each step, at most n − 1 steps. O(1) space.',
        say: '“I start with the widest container. The water level is the shorter wall, so moving the taller wall inward can only lose width without raising that limit. Moving the shorter wall is the only move that might help, so I do that and keep the best area seen. One pass, O(n) time, O(1) space.”',
        followups: [
          { q: 'Prove that moving the taller wall is never useful.', a: 'Say the left wall is the shorter one, with height h. Pairing it with any wall closer than the current right gives width smaller than now and height at most h, so area at most what we just measured. So every pair using this left wall is already covered, and `left` can be discarded.' },
          { q: 'What if the two walls have equal height?', a: 'Either can move. Both are limited to that height, and any pair using one of them with something closer is no better. Moving either is safe.' },
          { q: 'How does this differ from Trapping Rain Water?', a: 'Here the water is a single block between two chosen walls and walls in between don’t matter. In Trapping Rain Water every position holds water up to the lower of the tallest wall on each side.' }
        ]
      },
      {
        lc: 42,
        restate: 'You get a list of non-negative heights, a skyline of unit-width bars. After rain, water collects in the gaps. Return the total amount of water the skyline holds.',
        examples: '- `[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` → 6.\n- `[4, 2, 0, 3, 2, 5]` → 9.\n- `[2, 0, 2]` → 2.\n- Edge cases: fewer than three bars holds nothing; a strictly rising or falling skyline holds nothing.',
        brute: 'For each bar, scan left and right for the tallest bar on each side; the water above it is `min(leftMax, rightMax) - height`. O(n²) time. Precomputing prefix and suffix maximums makes it O(n) time and O(n) space.',
        insight: 'The water above a bar depends only on the **smaller** of the tallest bars on its two sides. Keep pointers at both ends with the running maximum seen from each end. Whichever end currently has the **lower** bar already knows its limit: the other side holds something at least as tall, so the running max on its own side is the real cap. Settle that bar and move that pointer in.',
        code: {
          py: `class Solution:
    def trap(self, height: List[int]) -> int:
        left, right = 0, len(height) - 1
        left_max = right_max = water = 0
        while left < right:
            if height[left] < height[right]:
                left_max = max(left_max, height[left])
                water += left_max - height[left]    # right side has a wall at least this tall
                left += 1
            else:
                right_max = max(right_max, height[right])
                water += right_max - height[right]  # left side has a wall at least this tall
                right -= 1
        return water`,
          js: `function trap(height) {
  let left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];       // right side has a wall at least this tall
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];     // left side has a wall at least this tall
      right--;
    }
  }
  return water;
}`,
          java: `class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                leftMax = Math.max(leftMax, height[left]);
                water += leftMax - height[left];       // right side has a wall at least this tall
                left++;
            } else {
                rightMax = Math.max(rightMax, height[right]);
                water += rightMax - height[right];     // left side has a wall at least this tall
                right--;
            }
        }
        return water;
    }
}`,
          cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = (int)height.size() - 1, leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                leftMax = max(leftMax, height[left]);
                water += leftMax - height[left];       // right side has a wall at least this tall
                left++;
            } else {
                rightMax = max(rightMax, height[right]);
                water += rightMax - height[right];     // left side has a wall at least this tall
                right--;
            }
        }
        return water;
    }
};`
        },
        complexity: 'O(n) time: each step settles one bar. O(1) space, against O(n) for the prefix/suffix-max version.',
        say: '“Water above a bar is the smaller of the two side maximums minus the bar. I keep a pointer at each end and a running max for each. I always settle the end with the lower bar: the other end has a bar at least as tall, so my own running max is the real cap and I can add the water now. Then I move that pointer in. It’s one pass, O(n) time, O(1) space.”',
        followups: [
          { q: 'Why is it safe to use only `left_max` when `height[left] < height[right]`?', a: '`right_max` is at least `height[right]`, which is greater than `height[left]`, and also at least as large as anything to its right. We know the true cap for `left` is `min(true_left_max, true_right_max)`. Since the right side has a bar taller than the current left bar, the left running max is what limits it, unless the current bar is itself the max, in which case no water sits on it.' },
          { q: 'Can you do it with a stack instead?', a: 'Yes: keep a stack of decreasing bars; when a taller bar arrives, pop and add the water in the basin between the new bar and the new stack top. Also O(n) time, but O(n) space. It’s the [monotonic stack](#/topic/monotonic) pattern.' },
          { q: 'What’s the prefix/suffix version?', a: 'Precompute `leftMax[i]` and `rightMax[i]`, then sum `min(leftMax[i], rightMax[i]) - height[i]`. Simpler to explain, O(n) space. Offer it first if you’re unsure, then improve it to two pointers.' }
        ]
      }
    ],

    practice: [
      { lc: 125,
        hints: ['Only letters and digits count, and case doesn’t matter.', 'Put one pointer at each end. Skip anything that isn’t a letter or digit.', 'Compare the lowercase characters. Any mismatch means false; the pointers meeting means true.'],
        solution: { explain: 'Opposite-ends pointers that skip non-alphanumeric characters in place, so no cleaned copy is needed. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        left, right = 0, len(s) - 1
        while left < right:
            while left < right and not s[left].isalnum():
                left += 1
            while left < right and not s[right].isalnum():
                right -= 1
            if s[left].lower() != s[right].lower():
                return False
            left += 1
            right -= 1
        return True`,
          js: `function isPalindrome(s) {
  const alnum = (c) => /[a-z0-9]/i.test(c);
  let left = 0, right = s.length - 1;
  while (left < right) {
    while (left < right && !alnum(s[left])) left++;
    while (left < right && !alnum(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        ', js: 'function isPalindrome(s) {\n  \n}' },
        tests: { fn: 'isPalindrome', cases: [
          { args: ['A man, a plan, a canal: Panama'], out: true }, { args: ['race a car'], out: false }, { args: [' '], out: true }, { args: ['0P'], out: false }, { args: ['ab_a'], out: true }] } },

      { lc: 167,
        hints: ['The array is sorted. What does the sum of the two ends tell you?', 'Too big: the right element can’t work with anything remaining. Too small: the left one can’t.', 'Move the matching pointer inward, and return 1-based positions on a match.'],
        starter: { py: 'class Solution:\n    def twoSum(self, numbers: List[int], target: int) -> List[int]:\n        ', js: 'function twoSum(numbers, target) {\n  \n}' },
        tests: { fn: 'twoSum', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[2, 7, 11, 15], 9], out: [1, 2] }, { args: [[2, 3, 4], 6], out: [1, 3] }, { args: [[-1, 0], -1], out: [1, 2] }, { args: [[1, 2, 3, 4, 4, 9, 56, 90], 8], out: [4, 5] }, { args: [[5, 25, 75], 100], out: [2, 3] }] } },

      { lc: 15,
        hints: ['Sort first. Then fix one number and look for a pair that adds up to its negative.', 'The pair search on the sorted rest is the two-pointer pass from Two Sum II.', 'Skip an outer value equal to the previous one, and after a match skip equal `left` values, so no triple repeats.'],
        starter: { py: 'class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        ', js: 'function threeSum(nums) {\n  \n}' },
        tests: { fn: 'threeSum', compare: 'deep', sig: { args: ['int[]'] }, cases: [
          { args: [[-1, 0, 1, 2, -1, -4]], out: [[-1, -1, 2], [-1, 0, 1]] }, { args: [[0, 1, 1]], out: [] }, { args: [[0, 0, 0]], out: [[0, 0, 0]] },
          { args: [[-2, 0, 0, 2, 2]], out: [[-2, 0, 2]] }, { args: [[0, 0, 0, 0]], out: [[0, 0, 0]] }, { args: [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]], out: [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]] }] } },

      { lc: 11,
        hints: ['The area of a pair is the distance between them times the shorter wall.', 'Start with the widest pair. A narrower pair is only worth it if its shorter wall is taller.', 'Move the pointer at the shorter wall inward, and keep the best area seen.'],
        starter: { py: 'class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        ', js: 'function maxArea(height) {\n  \n}' },
        tests: { fn: 'maxArea', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], out: 49 }, { args: [[1, 1]], out: 1 }, { args: [[4, 3, 2, 1, 4]], out: 16 }, { args: [[1, 2, 1]], out: 2 }, { args: [[0, 0, 0]], out: 0 }] } },

      { lc: 42,
        hints: ['The water above a bar is `min(tallest to its left, tallest to its right) - its height`.', 'Precomputing both maximums works in O(n) space. To get O(1), keep a running max from each end.', 'Settle the end with the lower bar: its own running max is the cap. Add the water, then move that pointer in.'],
        starter: { py: 'class Solution:\n    def trap(self, height: List[int]) -> int:\n        ', js: 'function trap(height) {\n  \n}' },
        tests: { fn: 'trap', sig: { args: ['int[]'] }, cases: [
          { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], out: 6 }, { args: [[4, 2, 0, 3, 2, 5]], out: 9 }, { args: [[2, 0, 2]], out: 2 }, { args: [[3]], out: 0 }, { args: [[1, 2, 3, 4]], out: 0 }, { args: [[5, 4, 1, 2]], out: 1 }] } },

      { lc: 344,
        hints: ['You must reverse the list in place, with O(1) extra space.', 'Swap the two ends, then move both pointers toward the middle.', 'Stop when they meet or cross.'],
        solution: { explain: 'Opposite-ends pointers swapping as they go. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def reverseString(self, s: List[str]) -> None:
        left, right = 0, len(s) - 1
        while left < right:
            s[left], s[right] = s[right], s[left]
            left += 1
            right -= 1`,
          js: `function reverseString(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    [s[left], s[right]] = [s[right], s[left]];
    left++;
    right--;
  }
}` } },
        starter: { py: 'class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        ', js: 'function reverseString(s) {\n  \n}' },
        tests: { fn: 'reverseString', inPlace: 0, cases: [
          { args: [['h', 'e', 'l', 'l', 'o']], out: ['o', 'l', 'l', 'e', 'h'] }, { args: [['H', 'a', 'n', 'n', 'a', 'h']], out: ['h', 'a', 'n', 'n', 'a', 'H'] }, { args: [['a']], out: ['a'] }, { args: [['a', 'b']], out: ['b', 'a'] }] } },

      { lc: 26,
        hints: ['The array is sorted, so duplicates sit next to each other.', 'Keep a write pointer for the end of the unique prefix, and a read pointer that scans everything.', 'Copy `nums[read]` to the write slot only when it differs from the last kept value. Return the write index.'],
        solution: { explain: 'Read/write pointers: the prefix before `write` always holds the distinct values so far. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        write = 1
        for read in range(1, len(nums)):
            if nums[read] != nums[write - 1]:
                nums[write] = nums[read]
                write += 1
        return write`,
          js: `function removeDuplicates(nums) {
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) nums[write++] = nums[read];
  }
  return write;
}` } },
        starter: { py: 'class Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        ', js: 'function removeDuplicates(nums) {\n  \n}' },
        tests: { fn: 'removeDuplicates', cases: [
          { args: [[1, 1, 2]], out: 2 }, { args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], out: 5 }, { args: [[1]], out: 1 }, { args: [[1, 2, 3]], out: 3 }] } },

      { lc: 283,
        hints: ['Keep the order of the non-zero values, and do it in place.', 'A write pointer marks where the next non-zero belongs; a read pointer scans.', 'When `nums[read]` is non-zero, swap it with the write slot and advance write. The zeroes drift to the back.'],
        solution: { explain: 'Read/write pointers with a swap, so the zeroes end up behind the write pointer. One pass, O(1) space.', code: {
          py: `class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        write = 0
        for read in range(len(nums)):
            if nums[read] != 0:
                nums[write], nums[read] = nums[read], nums[write]
                write += 1`,
          js: `function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}` } },
        starter: { py: 'class Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        ', js: 'function moveZeroes(nums) {\n  \n}' },
        tests: { fn: 'moveZeroes', inPlace: 0, cases: [
          { args: [[0, 1, 0, 3, 12]], out: [1, 3, 12, 0, 0] }, { args: [[0]], out: [0] }, { args: [[1, 2]], out: [1, 2] }, { args: [[0, 0, 1]], out: [1, 0, 0] }] } },

      { lc: 88,
        hints: ['`nums1` has spare room at its end, and both inputs are sorted.', 'Merging from the front would overwrite values of `nums1` you still need. Which end is safe to write to?', 'Fill from the back: put the larger of the two current last elements at the last free slot. Copy any leftover of `nums2` at the end.'],
        solution: { explain: 'Three pointers, filling `nums1` from the back so unread values are never overwritten. When `nums2` runs out, the rest of `nums1` is already in place. O(m + n) time, O(1) space.', code: {
          py: `class Solution:
    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:
        i, j, k = m - 1, n - 1, m + n - 1
        while j >= 0:
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[k] = nums1[i]
                i -= 1
            else:
                nums1[k] = nums2[j]
                j -= 1
            k -= 1`,
          js: `function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
    else nums1[k--] = nums2[j--];
  }
}` } },
        starter: { py: 'class Solution:\n    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:\n        ', js: 'function merge(nums1, m, nums2, n) {\n  \n}' },
        tests: { fn: 'merge', inPlace: 0, cases: [
          { args: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3], out: [1, 2, 2, 3, 5, 6] }, { args: [[1], 1, [], 0], out: [1] }, { args: [[0], 0, [1], 1], out: [1] }, { args: [[4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3], out: [1, 2, 3, 4, 5, 6] }] } },

      { lc: 977,
        hints: ['Squares of a sorted array aren’t sorted when there are negatives. Where is the largest square?', 'It’s at one of the two ends, since the biggest absolute values are there.', 'Fill the result from the back: compare the squares at both ends, place the larger, and move that pointer inward.'],
        solution: { explain: 'The largest square is always at an end, so build the answer from the largest down using two pointers. O(n) time, O(n) for the output.', code: {
          py: `class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        n = len(nums)
        out = [0] * n
        left, right = 0, n - 1
        for k in range(n - 1, -1, -1):
            if abs(nums[left]) > abs(nums[right]):
                out[k] = nums[left] ** 2
                left += 1
            else:
                out[k] = nums[right] ** 2
                right -= 1
        return out`,
          js: `function sortedSquares(nums) {
  const n = nums.length, out = new Array(n);
  let left = 0, right = n - 1;
  for (let k = n - 1; k >= 0; k--) {
    if (Math.abs(nums[left]) > Math.abs(nums[right])) {
      out[k] = nums[left] ** 2;
      left++;
    } else {
      out[k] = nums[right] ** 2;
      right--;
    }
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def sortedSquares(self, nums: List[int]) -> List[int]:\n        ', js: 'function sortedSquares(nums) {\n  \n}' },
        tests: { fn: 'sortedSquares', cases: [
          { args: [[-4, -1, 0, 3, 10]], out: [0, 1, 9, 16, 100] }, { args: [[-7, -3, 2, 3, 11]], out: [4, 9, 9, 49, 121] }, { args: [[5]], out: [25] }, { args: [[-2, -1]], out: [1, 4] }] } },

      { lc: 680,
        hints: ['A plain palindrome check walks in from both ends. What happens at the first mismatch?', 'At the first mismatch you may delete one character: either the left one or the right one.', 'Check whether the remaining inner part is a palindrome in each case; either one passing is enough.'],
        solution: { explain: 'Walk in from both ends; at the first mismatch, try skipping the left character or the right one and check the rest. Two linear checks, so O(n) time, O(1) space.', code: {
          py: `class Solution:
    def validPalindrome(self, s: str) -> bool:
        def check(i, j):
            while i < j:
                if s[i] != s[j]:
                    return False
                i += 1
                j -= 1
            return True
        left, right = 0, len(s) - 1
        while left < right:
            if s[left] != s[right]:
                return check(left + 1, right) or check(left, right - 1)
            left += 1
            right -= 1
        return True`,
          js: `function validPalindrome(s) {
  const check = (i, j) => {
    while (i < j) {
      if (s[i] !== s[j]) return false;
      i++;
      j--;
    }
    return true;
  };
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return check(left + 1, right) || check(left, right - 1);
    left++;
    right--;
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def validPalindrome(self, s: str) -> bool:\n        ', js: 'function validPalindrome(s) {\n  \n}' },
        tests: { fn: 'validPalindrome', cases: [
          { args: ['aba'], out: true }, { args: ['abca'], out: true }, { args: ['abc'], out: false }, { args: ['a'], out: true }, { args: ['eedede'], out: true }, { args: ['abcdea'], out: false }] } },

      { lc: 75,
        hints: ['Three values, one pass, no sorting library.', 'Keep a pointer for the end of the 0s, one for the start of the 2s, and a scanner for the unknown middle.', 'Swapping a 2 to the back doesn’t tell you what came from the back, so don’t advance the scanner in that case.'],
        solution: { explain: 'Dutch national flag: `lo` ends the zeros, `hi` starts the twos, `i` scans. A swapped-in value from `hi` is unchecked, so `i` stays. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def sortColors(self, nums: List[int]) -> None:
        lo, i, hi = 0, 0, len(nums) - 1
        while i <= hi:
            if nums[i] == 0:
                nums[lo], nums[i] = nums[i], nums[lo]
                lo += 1
                i += 1
            elif nums[i] == 2:
                nums[i], nums[hi] = nums[hi], nums[i]
                hi -= 1
            else:
                i += 1`,
          js: `function sortColors(nums) {
  let lo = 0, i = 0, hi = nums.length - 1;
  while (i <= hi) {
    if (nums[i] === 0) {
      [nums[lo], nums[i]] = [nums[i], nums[lo]];
      lo++;
      i++;
    } else if (nums[i] === 2) {
      [nums[i], nums[hi]] = [nums[hi], nums[i]];
      hi--;
    } else {
      i++;
    }
  }
}` } },
        starter: { py: 'class Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        ', js: 'function sortColors(nums) {\n  \n}' },
        tests: { fn: 'sortColors', inPlace: 0, cases: [
          { args: [[2, 0, 2, 1, 1, 0]], out: [0, 0, 1, 1, 2, 2] }, { args: [[2, 0, 1]], out: [0, 1, 2] }, { args: [[0]], out: [0] }, { args: [[1, 2, 0, 1, 2, 0, 0]], out: [0, 0, 0, 1, 1, 2, 2] }] } },

      { lc: 80,
        hints: ['Each value may stay at most twice. The array is sorted.', 'Use read/write pointers. The first two elements always stay.', 'Keep `nums[read]` only if it differs from `nums[write - 2]`: that means it isn’t a third copy.'],
        solution: { explain: 'Read/write pointers. An element is a third copy exactly when it equals the one two slots behind the write pointer. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        write = 0
        for x in nums:
            if write < 2 or x != nums[write - 2]:
                nums[write] = x
                write += 1
        return write`,
          js: `function removeDuplicates(nums) {
  let write = 0;
  for (const x of nums) {
    if (write < 2 || x !== nums[write - 2]) nums[write++] = x;
  }
  return write;
}` } },
        starter: { py: 'class Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        ', js: 'function removeDuplicates(nums) {\n  \n}' },
        tests: { fn: 'removeDuplicates', cases: [
          { args: [[1, 1, 1, 2, 2, 3]], out: 5 }, { args: [[0, 0, 1, 1, 1, 1, 2, 3, 3]], out: 7 }, { args: [[1]], out: 1 }, { args: [[1, 1, 1]], out: 2 }] } },

      { lc: 16,
        hints: ['It’s 3Sum, but instead of hitting zero you track the sum closest to the target.', 'Sort, fix one number, and run the two-pointer pass on the rest.', 'On each pass, update the best sum if this one is closer. Move `left` if the sum is below the target, `right` if above, and stop early on an exact hit.'],
        solution: { explain: 'Sort, fix one value, two pointers for the other two, tracking the closest sum. O(n²) time, O(1) extra space.', code: {
          py: `class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        nums.sort()
        best = nums[0] + nums[1] + nums[2]
        for i in range(len(nums) - 2):
            left, right = i + 1, len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if abs(total - target) < abs(best - target):
                    best = total
                if total < target:
                    left += 1
                elif total > target:
                    right -= 1
                else:
                    return total
        return best`,
          js: `function threeSumClosest(nums, target) {
  nums.sort((a, b) => a - b);
  let best = nums[0] + nums[1] + nums[2];
  for (let i = 0; i < nums.length - 2; i++) {
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const total = nums[i] + nums[left] + nums[right];
      if (Math.abs(total - target) < Math.abs(best - target)) best = total;
      if (total < target) left++;
      else if (total > target) right--;
      else return total;
    }
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def threeSumClosest(self, nums: List[int], target: int) -> int:\n        ', js: 'function threeSumClosest(nums, target) {\n  \n}' },
        tests: { fn: 'threeSumClosest', cases: [
          { args: [[-1, 2, 1, -4], 1], out: 2 }, { args: [[0, 0, 0], 1], out: 0 }, { args: [[1, 1, 1, 0], -100], out: 2 }, { args: [[1, 2, 5, 10, 11], 12], out: 13 }] } },

      { lc: 881,
        hints: ['Each boat carries at most two people and has a weight limit.', 'Sort the weights. The heaviest person needs a boat; can the lightest person share it?', 'Two pointers: if lightest plus heaviest fits, move both; otherwise the heaviest goes alone. Count boats.'],
        solution: { explain: 'Greedy pairing after sorting: the heaviest person either shares with the lightest or rides alone, and no other partner could do better. O(n log n) time for the sort, O(1) extra space.', code: {
          py: `class Solution:
    def numRescueBoats(self, people: List[int], limit: int) -> int:
        people.sort()
        left, right = 0, len(people) - 1
        boats = 0
        while left <= right:
            if people[left] + people[right] <= limit:
                left += 1
            right -= 1
            boats += 1
        return boats`,
          js: `function numRescueBoats(people, limit) {
  people.sort((a, b) => a - b);
  let left = 0, right = people.length - 1, boats = 0;
  while (left <= right) {
    if (people[left] + people[right] <= limit) left++;
    right--;
    boats++;
  }
  return boats;
}` } },
        starter: { py: 'class Solution:\n    def numRescueBoats(self, people: List[int], limit: int) -> int:\n        ', js: 'function numRescueBoats(people, limit) {\n  \n}' },
        tests: { fn: 'numRescueBoats', cases: [
          { args: [[1, 2], 3], out: 1 }, { args: [[3, 2, 2, 1], 3], out: 3 }, { args: [[3, 5, 3, 4], 5], out: 4 }, { args: [[5], 5], out: 1 }, { args: [[2, 2, 2, 2], 4], out: 2 }] } },

      { lc: 18,
        hints: ['It’s 3Sum with one more outer loop.', 'Sort, then fix the first two numbers with two nested loops and run two pointers on the rest.', 'Skip repeated values at each of the two outer levels, and after a match, skip equal `left` values. Watch for sums above 32 bits in typed languages.'],
        solution: { explain: 'Two nested fixed indices, then two pointers: O(n³) time, O(1) extra space. Skipping equal values at each level keeps the quadruples distinct.', code: {
          py: `class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        res = []
        for i in range(n - 3):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            for j in range(i + 1, n - 2):
                if j > i + 1 and nums[j] == nums[j - 1]:
                    continue
                left, right = j + 1, n - 1
                while left < right:
                    total = nums[i] + nums[j] + nums[left] + nums[right]
                    if total < target:
                        left += 1
                    elif total > target:
                        right -= 1
                    else:
                        res.append([nums[i], nums[j], nums[left], nums[right]])
                        left += 1
                        while left < right and nums[left] == nums[left - 1]:
                            left += 1
        return res`,
          js: `function fourSum(nums, target) {
  nums.sort((a, b) => a - b);
  const n = nums.length, res = [];
  for (let i = 0; i < n - 3; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    for (let j = i + 1; j < n - 2; j++) {
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;
      let left = j + 1, right = n - 1;
      while (left < right) {
        const total = nums[i] + nums[j] + nums[left] + nums[right];
        if (total < target) left++;
        else if (total > target) right--;
        else {
          res.push([nums[i], nums[j], nums[left], nums[right]]);
          left++;
          while (left < right && nums[left] === nums[left - 1]) left++;
        }
      }
    }
  }
  return res;
}` } },
        starter: { py: 'class Solution:\n    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:\n        ', js: 'function fourSum(nums, target) {\n  \n}' },
        tests: { fn: 'fourSum', compare: 'deep', cases: [
          { args: [[1, 0, -1, 0, -2, 2], 0], out: [[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]] }, { args: [[2, 2, 2, 2, 2], 8], out: [[2, 2, 2, 2]] }, { args: [[0, 0, 0, 0], 0], out: [[0, 0, 0, 0]] }, { args: [[1, 2, 3], 6], out: [] }] } }
    ],

    mistakes: [
      '**Using the pattern on unsorted input.** Moving pointers by “too small / too big” only works because sorted order says which way is which. On unsorted data, sort first (if positions don’t matter) or use a hash map.',
      '**`<` versus `<=` in the loop condition.** For pairs of different positions, use `while left < right`. If you use `<=`, one element can pair with itself. Some problems (like boats, where one person can ride alone) do want `<=`: ask what happens when the pointers land on the same element.',
      '**Moving the wrong pointer.** Write down the reason before the code: “this element is too small for every remaining partner, so it goes.” If you can’t finish that sentence, you’re guessing.',
      '**Duplicates in 3Sum and 4Sum.** Skip repeated outer values, and after a match skip equal `left` values. Don’t dedupe by putting triples in a set at the end unless you must: it adds O(n) space and hides a missing skip.',
      '**Advancing the scanner after a swap from the back.** In the three-way partition, the value swapped in from `hi` hasn’t been examined. Moving `i` skips it.',
      '**Merging into a shared array from the front.** It overwrites elements you still need to read. Fill from the back.',
      '**Off-by-one when the problem counts from 1.** Return `left + 1` and `right + 1`. Read the output format before coding.',
      '**Language gotchas.** *Python:* `nums[left], nums[right] = nums[right], nums[left]` is safe, but `nums.sort()` mutates the caller’s list, so copy it first if the caller needs the original order. *JavaScript:* `nums.sort()` sorts numbers as strings, so pass `(a, b) => a - b`. *Java:* `left + right` can overflow when computing a midpoint, and sums of three or four `int`s can overflow, so widen to `long` when values go near 10⁹. *C++:* an `int` index minus `size()` mixes signed and unsigned: `right = nums.size() - 1` on an empty vector wraps around, so cast to `int` or check for empty first.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of the opposite-ends pair search on an array that is already sorted?',
        choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], answer: 0,
        explain: 'Each pass moves `left` up or `right` down, and they stop when they meet, so there are at most n − 1 passes of O(1) work.' },
      { kind: 'concept', q: 'In the sorted pair-sum search, the sum is **too big**. Which pointer moves, and why is it safe?',
        choices: ['`right` moves down: that element is too large even with the smallest remaining partner', '`left` moves up: it has been tried', 'Both move inward', 'Restart with a different left pointer'], answer: 0,
        explain: 'The smallest remaining partner for the right element is at the left end, and that pair is already too big. Every other partner is larger, so the right element can’t be part of any answer.' },
      { kind: 'pattern', q: 'Which of these is best solved with two pointers as stated?',
        choices: ['In a sorted array, find two numbers that add up to a target using O(1) extra space', 'Find two numbers in an unsorted array that add up to a target and return their original positions', 'Find the longest substring with at most two distinct letters', 'Count the subarrays with sum exactly k, with negatives allowed'], answer: 0,
        explain: 'Sorted order and O(1) space point to pointers. The unsorted version wants a hash map, the distinct-letters one is a sliding window, and sums with negatives need prefix sums with a hash map.' },
      { kind: 'pattern', q: 'Which signals point to two pointers? Pick every one that applies.',
        choices: ['The input is sorted and you need a pair or triple', 'You must modify the array in place with O(1) extra space', 'You need the original index of every element in an unsorted array', 'You need to compare both ends of a sequence, like a palindrome check'], answer: [0, 1, 3],
        explain: 'Sorted pairs, in-place cleanup and end-to-end comparison are the classic signals. Needing original indices of unsorted data is the hash-map case.' },
      { kind: 'bug', q: 'This 3Sum returns `[[0, 0, 0], [0, 0, 0]]` for `[0, 0, 0, 0]`, but the answer is one triple. What’s missing?',
        code: `nums.sort(); res = []
for i in range(len(nums) - 2):
    left, right = i + 1, len(nums) - 1
    while left < right:
        s = nums[i] + nums[left] + nums[right]
        if s < 0: left += 1
        elif s > 0: right -= 1
        else:
            res.append([nums[i], nums[left], nums[right]])
            left += 1; right -= 1`,
        choices: ['Skipping an outer value equal to the previous one (and repeated inner values after a match)', 'The sort should be descending', 'The loop should be `while left <= right`', 'The result should be a set of lists'], answer: 0,
        explain: 'Equal outer values reproduce the same triples. Add `if i > 0 and nums[i] == nums[i - 1]: continue`, and after a match skip equal `left` values. A set of lists can’t be built (lists aren’t hashable), and tuples would only hide the missing skips.' },
      { kind: 'concept', q: 'In Container With Most Water, why do you move the pointer at the **shorter** wall?',
        choices: ['The shorter wall caps every pair it’s part of, and the width only shrinks, so that wall can’t do better', 'Shorter walls are always the wrong choice', 'It guarantees the maximum width', 'The taller wall has already been counted'], answer: 0,
        explain: 'Any pair with the shorter wall and a closer partner has less width and no more height than the current pair, so it can’t beat what we measured. Only moving the shorter wall can raise the cap.' },
      { kind: 'concept', q: 'In the three-way partition (Dutch flag), when you swap `nums[i]` with `nums[hi]`, why don’t you advance `i`?',
        choices: ['The value that arrived from `hi` hasn’t been examined yet', 'The swap made `nums[i]` equal to the pivot', 'It would move `i` past `hi`', 'The write pointer already moved'], answer: 0,
        explain: 'The element swapped in from the unexplored end could be any of the three values. You have to look at it before moving on. Swaps with `lo` are different: that region has already been scanned.' },
      { kind: 'complexity', q: 'What is the best time complexity you can state for 3Sum on an unsorted array of n numbers?',
        choices: ['O(n²)', 'O(n)', 'O(n log n)', 'O(n³)'], answer: 0,
        explain: 'Sorting costs O(n log n), then n outer values each run an O(n) two-pointer pass: O(n²) in total. O(n²) is the best known bound for 3Sum.' }
    ],

    flashcards: [
      { id: 'when-sorted', front: 'Two pointers on a pair-sum: why is it safe to move a pointer?', back: 'Too big: the right element is too large even with the smallest remaining partner, so it can never be in an answer. Too small: the left element is too small even with the largest remaining partner. Each move discards an element for good.' },
      { id: 'two-shapes', front: 'Name the two shapes of two pointers.', back: 'Opposite ends (start at both ends, move inward; pairs, palindromes, container) and same direction (a fast read pointer and a slow write pointer; in-place filtering, deduping, partitioning).' },
      { id: 'why-linear', front: 'Why is the opposite-ends loop O(n) even though it looks like two pointers?', back: 'The pointers only move toward each other, so together they make at most n − 1 moves. It’s one pass, not a pass per pointer.' },
      { id: 'three-sum', front: '3Sum in one sentence, with its time complexity.', back: 'Sort, fix the first number, and run a two-pointer pair search on the rest, skipping repeated values. O(n²) time.' },
      { id: 'skip-dupes', front: '3Sum: how do you avoid duplicate triples?', back: 'Skip an outer value equal to the previous one, and after recording a triple move `left` past equal values.' },
      { id: 'container', front: 'Container With Most Water: which pointer do you move?', back: 'The one at the shorter wall. Moving the taller wall only shrinks the width without raising the limit.' },
      { id: 'trap-rain', front: 'Trapping Rain Water with two pointers: what do you settle each step?', back: 'The end with the lower bar. Its own running max is the real cap, since the other side has a bar at least as tall. Add `runningMax - height`, move that pointer in.' },
      { id: 'merge-back', front: 'Merge Sorted Array in place: which end do you fill?', back: 'The back. Filling from the front would overwrite elements of `nums1` you haven’t read yet.' },
      { id: 'read-write', front: 'Read/write pointers: what does everything before `write` mean?', back: 'It’s the finished answer so far. `read` scans every element, and an element is copied to `write` only when it belongs in the output.' },
      { id: 'dutch-flag', front: 'Dutch flag: after swapping with `hi`, do you advance `i`?', back: 'No. The value that arrived hasn’t been examined. After swapping with `lo`, you do advance `i`, since that region was already scanned.' },
      { id: 'unsorted', front: 'Pair sum on an unsorted array with original indices: what instead of two pointers?', back: 'A hash map from value to index: for each element look up `target - x`, then record `x`. O(n) time, O(n) space.' }
    ],

    deeper: [
      { title: 'Two Pointers Technique (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/two-pointers-technique/', time: 'about 15 min', note: 'The DSA-Kit reference for the pattern: the pair-sum idea with a few classic variants and worked code in several languages.' },
      { title: '14 Patterns to Ace Any Coding Interview (Hackernoon)', url: 'https://hackernoon.com/14-patterns-to-ace-any-coding-interview-question-c5bb3357f6ed', time: 'about 15 min', note: 'The pattern map; two pointers sits next to sliding window and fast & slow pointers. Read it to see where each one applies.' },
      { title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'The NeetCode 150 laid out by pattern; the Two Pointers row is the practice order this lesson follows. Some pages may ask you to sign in.' },
      { title: 'LeetCode Patterns (Sean Prashad)', url: 'https://seanprashad.com/leetcode-patterns/', time: 'reference', note: 'A filterable problem list. Filter by the Two Pointers pattern for practice beyond this page.' }
    ],

    detective: [
      { id: 'wristbands', decoys: ['arrays-hashing', 'binary-search', 'sliding-window'],
        statement: 'A festival lists wristband prices on a board from cheapest to priciest. A visitor holds a voucher worth exactly V coins and wants to spend all of it on two different wristbands. Return the board positions of a pair of wristbands whose prices add up to V. The visitor’s hands are full, so no memory-hungry tricks: the booth’s old tablet can’t hold a second copy of the board.',
        why: 'The list is **sorted** and the question is about a **pair with a target sum**, with tight memory. Compare the cheapest and priciest: if the pair is too dear, drop the priciest; if too cheap, drop the cheapest. That’s opposite-end pointers, O(n) time and O(1) space. A hash map would work but spends the memory the story rules out.' },
      { id: 'billboards', decoys: ['sliding-window', 'kadane', 'monotonic'],
        statement: 'A town has a straight road with billboards standing at every block, each a different height. A banner will be hung between two billboards, and it’s only as tall as the lower of the two. Its area is that height times the number of blocks between them. Which two billboards give the biggest banner?',
        why: 'The answer is a **pair of positions** and the score mixes their distance with the smaller of two values. Start with the two outermost billboards, the widest banner, and move the pointer at the lower one inward, since the lower billboard caps every banner it’s part of. That’s opposite-end pointers with a “move the limiting side” rule, not a sliding window, because the stretch in between doesn’t matter.' },
      { id: 'bin-log', decoys: ['arrays-hashing', 'sorting', 'sliding-window'],
        statement: 'A warehouse scanner logs bin numbers in nondecreasing order, so the same bin can appear many times in a row. The scanner has almost no spare memory. Without creating a second list, rewrite the log so that the first part of it lists each bin number exactly once, in order, and report how many distinct bins there were. What sits after that first part doesn’t matter.',
        why: '“In place”, tiny extra memory, and **sorted** input (equal values sit together) are the giveaways. A slow pointer marks where the next distinct value goes while a fast one scans every entry, copying only when the value changes. That’s the same-direction read/write shape, one pass, O(1) space. A hash set would work but violates the memory limit.' }
    ]
  });
})();
