/* Offer Ready: Kadane's algorithm lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'kadane',

    hook: 'Maximum Subarray (53) is the cleanest example of a dynamic program that shrinks to a single variable, so interviewers use it to hear *why* the greedy step is safe, not just to see the loop. It and Maximum Product Subarray (152) are both on the NeetCode 150 and the Blind 75, and the follow-ups (a circular array, one allowed deletion, “now with products”) are favorites for the second round of questions.',

    cues: [
      'The question asks for the best **contiguous** subarray by its **sum**: the largest, the smallest, or the largest absolute value.',
      'The array has **negative numbers**. With only positives, the answer is the whole array, so a question that’s interesting has negatives in it.',
      'You can say the answer as “the best run **ending at index i**”, and that best run depends only on the best run ending at i − 1.',
      'The follow-up changes the shape but not the idea: the array is circular, one element may be deleted, or the score is a product instead of a sum.',
      'A sliding window looks tempting, but the rule isn’t monotonic: adding an element can raise the sum, so you can’t decide when to shrink. That’s your hint to think “extend or restart” instead.',
      'The trap: if every number is **negative**, the answer is the largest single element, not 0. Start the answer from `nums[0]`, never from 0.'
    ],

    intuition: [
      'Picture walking along a road where each stop either pays you or charges you. You carry a running balance of the stretch you’re currently counting. At every stop you decide: keep carrying this balance, or drop it and start counting fresh from here. You keep it only if it’s **positive**. A balance of zero or less can’t make any later stretch better, so carrying it is pure drag. Meanwhile you remember the highest balance you ever held.',
      'That’s the whole algorithm. Precisely:',
      '1. Let `cur` be the best sum of a subarray that **ends exactly at the current index**. Start with `cur = best = nums[0]`.\n2. For each next element `x`: if `cur > 0`, **extend** (`cur += x`). Otherwise **restart** (`cur = x`). In one line: `cur = max(x, cur + x)`.\n3. After each step, `best = max(best, cur)`. The best subarray has to end somewhere, so the largest `cur` is the answer.',
      'Why is the greedy step safe? Any subarray ending at index i is either `x` alone or a subarray ending at i − 1 with `x` added. The best choice for the second kind is the best subarray ending at i − 1, which is exactly last step’s `cur`. So `cur[i] = x + max(0, cur[i - 1])`. That’s a one-dimensional DP, and because it only reads the previous value, one variable is enough. A [1-D DP](#/topic/dp-1d) solution with an array would work too; Kadane is that same recurrence with the array thrown away.',
      'Why not start `best` at 0? Because with only negative numbers the best subarray is the **single largest element**, which is below 0. Starting from `nums[0]` (and letting the loop improve it) is the one habit that gets the edge case for free.',
      'There’s a second way to see it, using [prefix sums](#/topic/prefix-sums): a subarray sum is `P[j + 1] − P[i]`, so the best subarray ending at j is `P[j + 1]` minus the smallest earlier prefix. Tracking that smallest prefix is the same decision as “restart when the running balance dips below zero”.'
    ].join('\n\n'),

    viz: 'kadane',

    template: {
      title: 'Maximum subarray: extend or restart',
      note: 'To reuse it, keep the skeleton and change two things: **what “extend” means** (here `cur += x`) and **what `cur` measures** (here a sum). A product needs a second variable for the minimum (see Maximum Product Subarray below); a circular array runs the same loop twice, once for the maximum and once for the minimum. The first line is the part to get right: `cur = best = nums[0]`, not 0.',
      code: {
        py: `def max_subarray(nums):
    cur = best = nums[0]              #> cur: the best sum of a subarray that ends at the current index
    for x in nums[1:]:
        if cur > 0:                   #@check > 1. Is the best run ending one step back worth keeping?
            cur += x                  #@extend > 2. Yes: carry it forward and add x
        else:
            cur = x                   #@restart > 3. No: a run summing to 0 or less only drags x down, so start fresh at x
        best = max(best, cur)         #@record > 4. The best subarray ends somewhere: keep the largest cur seen
    return best`,
        js: `function maxSubarray(nums) {
  let cur = nums[0], best = nums[0];        //> cur: the best sum of a subarray that ends at the current index
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    if (cur > 0) {                          //@check > 1. Is the best run ending one step back worth keeping?
      cur += x;                             //@extend > 2. Yes: carry it forward and add x
    } else {
      cur = x;                              //@restart > 3. No: a run summing to 0 or less only drags x down, so start fresh at x
    }
    best = Math.max(best, cur);             //@record > 4. The best subarray ends somewhere: keep the largest cur seen
  }
  return best;
}`,
        java: `class Solution {
    public int maxSubarray(int[] nums) {
        int cur = nums[0], best = nums[0];      //> cur: the best sum of a subarray that ends at the current index
        for (int i = 1; i < nums.length; i++) {
            int x = nums[i];
            if (cur > 0) {                      //@check > 1. Is the best run ending one step back worth keeping?
                cur += x;                       //@extend > 2. Yes: carry it forward and add x
            } else {
                cur = x;                        //@restart > 3. No: a run summing to 0 or less only drags x down, so start fresh at x
            }
            best = Math.max(best, cur);         //@record > 4. The best subarray ends somewhere: keep the largest cur seen
        }
        return best;
    }
}`,
        cpp: `class Solution {
public:
    int maxSubarray(vector<int>& nums) {
        int cur = nums[0], best = nums[0];      //> cur: the best sum of a subarray that ends at the current index
        for (int i = 1; i < (int)nums.size(); i++) {
            int x = nums[i];
            if (cur > 0) {                      //@check > 1. Is the best run ending one step back worth keeping?
                cur += x;                       //@extend > 2. Yes: carry it forward and add x
            } else {
                cur = x;                        //@restart > 3. No: a run summing to 0 or less only drags x down, so start fresh at x
            }
            best = max(best, cur);              //@record > 4. The best subarray ends somewhere: keep the largest cur seen
        }
        return best;
    }
};`
      },
      tests: { fn: { py: 'max_subarray', default: 'maxSubarray' }, sig: { args: ['int[]'] }, cases: [
        { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], out: 6 }, { args: [[1]], out: 1 }, { args: [[5, 4, -1, 7, 8]], out: 23 }, { args: [[-3, -1, -2]], out: -1 },
        { args: [[-1]], out: -1 }, { args: [[0, 0]], out: 0 }, { args: [[2, -1, 2, -1, 2]], out: 4 }, { args: [[-2, -1]], out: -1 }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(1)',
      why: 'One pass, and each element does a constant amount of work: one comparison, one addition, one `max`. Space is two integers, `cur` and `best`, because `cur[i]` only needs `cur[i - 1]`. The array version of the same recurrence (`end[i] = max(nums[i], end[i - 1] + nums[i])`) is also O(n) time but spends O(n) space on values it never looks at again.',
      trap: 'The brute force that tries every start and end is O(n²) with a running sum (O(n³) if you re-add each window), and a divide-and-conquer answer is O(n log n). When an interviewer asks for “better”, they want you to say *why* one pass is enough: “the best subarray ending here only depends on the best subarray ending one step earlier, so I keep just that number.”'
    },

    variations: [
      {
        name: 'Return where the best subarray is',
        body: 'Interviewers often ask “which subarray?”, not just the sum. Remember where the current run began: set `start = i` on every **restart** and leave it alone on an extend. When `cur` beats `best`, copy `start` and `i` into the answer. Use a strict `>` so ties keep the earliest subarray. Every restart is a decision about the *start*, which is why the extend-or-restart framing makes this almost free.',
        code: {
          py: `def max_subarray_range(nums):
    cur = best = nums[0]
    start = best_l = best_r = 0
    for i in range(1, len(nums)):
        if cur > 0:
            cur += nums[i]
        else:
            cur, start = nums[i], i              #> A restart moves the start of the run
        if cur > best:
            best, best_l, best_r = cur, start, i #> The best run is [start, i]
    return [best_l, best_r]`,
          js: `function maxSubarrayRange(nums) {
  let cur = nums[0], best = nums[0], start = 0, bestL = 0, bestR = 0;
  for (let i = 1; i < nums.length; i++) {
    if (cur > 0) {
      cur += nums[i];
    } else {
      cur = nums[i]; start = i;                  //> A restart moves the start of the run
    }
    if (cur > best) { best = cur; bestL = start; bestR = i; }   //> The best run is [start, i]
  }
  return [bestL, bestR];
}`,
          java: `class Solution {
    public int[] maxSubarrayRange(int[] nums) {
        int cur = nums[0], best = nums[0], start = 0, bestL = 0, bestR = 0;
        for (int i = 1; i < nums.length; i++) {
            if (cur > 0) {
                cur += nums[i];
            } else {
                cur = nums[i]; start = i;        //> A restart moves the start of the run
            }
            if (cur > best) { best = cur; bestL = start; bestR = i; }   //> The best run is [start, i]
        }
        return new int[]{bestL, bestR};
    }
}`,
          cpp: `class Solution {
public:
    vector<int> maxSubarrayRange(vector<int>& nums) {
        int cur = nums[0], best = nums[0], start = 0, bestL = 0, bestR = 0;
        for (int i = 1; i < (int)nums.size(); i++) {
            if (cur > 0) {
                cur += nums[i];
            } else {
                cur = nums[i]; start = i;        //> A restart moves the start of the run
            }
            if (cur > best) { best = cur; bestL = start; bestR = i; }   //> The best run is [start, i]
        }
        return {bestL, bestR};
    }
};`
        },
        tests: { fn: { py: 'max_subarray_range', default: 'maxSubarrayRange' }, sig: { args: ['int[]'] }, cases: [
          { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], out: [3, 6] }, { args: [[-3, -1, -2]], out: [1, 1] }, { args: [[5]], out: [0, 0] },
          { args: [[5, 4, -1, 7, 8]], out: [0, 4] }, { args: [[-1, 2, -1]], out: [1, 1] }, { args: [[0, 0]], out: [0, 0] }] }
      },
      {
        name: 'The same thing as a 1-D DP table',
        body: 'If you’d rather derive it than recall it, write the DP honestly first: `end[i]` is the best sum of a subarray ending exactly at `i`, and the answer is `max(end)`. Then notice `end[i]` reads only `end[i - 1]`, and collapse the table into the single variable `cur`. Doing it in that order in an interview shows the loop isn’t a trick. It’s a [1-D DP](#/topic/dp-1d) with one cell of memory.',
        code: {
          py: `def max_subarray_dp(nums):
    end = [0] * len(nums)                           #> end[i]: best sum of a subarray ending exactly at i
    end[0] = nums[0]
    for i in range(1, len(nums)):
        end[i] = max(nums[i], end[i - 1] + nums[i]) #> Restart at i, or extend the best run ending at i - 1
    return max(end)                                 #> The best subarray ends at some index`,
          js: `function maxSubarrayDp(nums) {
  const end = new Array(nums.length).fill(0);       //> end[i]: best sum of a subarray ending exactly at i
  end[0] = nums[0];
  for (let i = 1; i < nums.length; i++) {
    end[i] = Math.max(nums[i], end[i - 1] + nums[i]); //> Restart at i, or extend the best run ending at i - 1
  }
  return end.reduce((a, b) => Math.max(a, b));       //> The best subarray ends at some index
}`
        },
        tests: { fn: { py: 'max_subarray_dp', default: 'maxSubarrayDp' }, cases: [
          { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], out: 6 }, { args: [[-3, -1, -2]], out: -1 }, { args: [[7]], out: 7 }, { args: [[1, 2, 3]], out: 6 }] }
      },
      {
        name: 'When the empty subarray is allowed',
        body: 'Some problems let you pick nothing, so the answer is never below 0 (Maximum Absolute Sum of Any Subarray, 1749, is one). Then the all-negative trap disappears, and you can start both variables at 0 and clamp: `cur = max(0, cur + x)` restarts whenever the run goes negative. Read the statement for “non-empty” before choosing which version to write. Mixing them up is a classic wrong answer on `[-3, -1]`.',
        code: {
          py: `def max_subarray_or_empty(nums):
    cur = best = 0                  #> Empty is allowed, so 0 is a legal answer
    for x in nums:
        cur = max(0, cur + x)       #> Clamp: a negative run restarts as the empty run
        best = max(best, cur)
    return best`,
          js: `function maxSubarrayOrEmpty(nums) {
  let cur = 0, best = 0;            //> Empty is allowed, so 0 is a legal answer
  for (const x of nums) {
    cur = Math.max(0, cur + x);     //> Clamp: a negative run restarts as the empty run
    best = Math.max(best, cur);
  }
  return best;
}`
        },
        tests: { fn: { py: 'max_subarray_or_empty', default: 'maxSubarrayOrEmpty' }, cases: [
          { args: [[-3, -1]], out: 0 }, { args: [[1, -2, 3]], out: 3 }, { args: [[]], out: 0 }, { args: [[2, -1, 2]], out: 3 }] }
      },
      {
        name: 'Max product, circular, and one deletion',
        body: 'Three well-known twists, each covered below as a worked problem. **Product** (152): a negative number can flip the smallest product into the largest, so track the running minimum next to the running maximum. **Circular** (918): the best arc either doesn’t wrap, which is plain Kadane, or wraps, which means the total minus the **smallest** subarray in the middle. **One deletion** (1186): keep two states per index, “nothing deleted yet” and “one element already deleted”.'
      },
      {
        name: 'When Kadane is the wrong tool',
        body: 'Kadane answers “extend or restart” for the single best run. It doesn’t count subarrays or hit exact targets. “Subarray sum equals k” (560), with negatives allowed, needs [prefix sums with a hash map](#/topic/prefix-sums). “Longest subarray with sum at most k” with only positives is a [sliding window](#/topic/sliding-window). “Best subarray of length at least k” needs prefix sums plus a running minimum. If the elements don’t have to be adjacent, it isn’t a subarray question at all.'
      }
    ],

    worked: [
      {
        lc: 53,
        restate: 'Given an array of integers (positive, negative or zero), return the largest sum of any non-empty contiguous run of elements.',
        examples: '- `[-2,1,-3,4,-1,2,1,-5,4]` → 6, from `[4,-1,2,1]`.\n- `[1]` → 1.\n- `[5,4,-1,7,8]` → 23: the whole array.\n- Edge cases: all negative, `[-3,-1,-2]` → −1 (the best run is the single largest element, **not** 0); a single element; zeros.',
        brute: 'Try every start and end and keep a running sum for each start: O(n²) time, O(1) space. It’s the right first sentence, and fine for n up to a few thousand, but the real limit is 10⁵.',
        insight: 'Ask what the best subarray **ending at index i** looks like. It’s either just `nums[i]`, or the best subarray ending at i − 1 with `nums[i]` added. So the only thing worth remembering from the past is one number, and you keep it only while it’s positive. The answer is the largest such number over all i.',
        code: {
          py: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        cur = best = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)      # restart at x, or extend the run ending one step back
            best = max(best, cur)
        return best`,
          js: `function maxSubArray(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);   // restart at nums[i], or extend the run ending one step back
    best = Math.max(best, cur);
  }
  return best;
}`,
          java: `class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);   // restart at nums[i], or extend the run ending one step back
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int cur = nums[0], best = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            cur = max(nums[i], cur + nums[i]);   // restart at nums[i], or extend the run ending one step back
            best = max(best, cur);
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time: one pass. O(1) space: two integers.',
        say: '“Let `cur` be the best sum of a subarray ending at the current index. It’s either the element alone or the previous `cur` plus the element, whichever is larger, so I never need more than the previous value. I keep the largest `cur` I’ve seen as the answer. I start both from the first element rather than 0 so all-negative input returns the largest single element. One pass, O(1) space.”',
        followups: [
          { q: 'Why does it work when every number is negative?', a: 'Each `cur` is `max(x, cur + x)`, and `cur + x` is smaller than `x` whenever `cur` is negative. So every step restarts, `cur` equals the element itself, and `best` ends as the largest element. Starting from `nums[0]` instead of 0 is what makes that visible.' },
          { q: 'Can you return the subarray itself?', a: 'Yes. Record `start = i` whenever you restart, and when `cur` beats `best`, save `(start, i)`. Still O(n) time and O(1) space.' },
          { q: 'Is there a divide-and-conquer solution?', a: 'Yes: the best subarray is entirely in the left half, entirely in the right half, or crosses the middle. The crossing one is the best suffix of the left plus the best prefix of the right. It’s O(n log n). Mention it, then explain why the single pass is better.' },
          { q: 'How does this relate to prefix sums?', a: 'The sum of `nums[i..j]` is `P[j + 1] − P[i]`. The best subarray ending at j subtracts the smallest earlier prefix. Tracking that minimum is the same decision as restarting when the running sum dips below zero.' }
        ]
      },
      {
        lc: 152,
        restate: 'Given an integer array, return the largest **product** of any non-empty contiguous subarray. The array can hold negatives and zeros.',
        examples: '- `[2,3,-2,4]` → 6, from `[2,3]`.\n- `[-2,0,-1]` → 0: the zero splits the array.\n- `[-2,3,-4]` → 24: two negatives make a positive.\n- Edge cases: a single negative number, `[-2]` → −2; a zero in the middle; an even or odd count of negatives.',
        brute: 'Try every start and end with a running product per start: O(n²) time, O(1) space.',
        insight: 'With sums, the best run ending at i extends the previous best. With products, a **very negative** product is dangerous only until the next negative number turns it into a very positive one. So at every index keep both the **largest** and the **smallest** product of a subarray ending there. The next element can pair either of them (or itself alone) to make the new largest and the new smallest.',
        code: {
          py: `class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        hi = lo = best = nums[0]          # largest and smallest product of a subarray ending here
        for x in nums[1:]:
            a, b = hi * x, lo * x         # both use the old hi and lo
            hi = max(x, a, b)
            lo = min(x, a, b)
            best = max(best, hi)
        return best`,
          js: `function maxProduct(nums) {
  let hi = nums[0], lo = nums[0], best = nums[0];   // largest and smallest product of a subarray ending here
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i], a = hi * x, b = lo * x;      // both use the old hi and lo
    hi = Math.max(x, a, b);
    lo = Math.min(x, a, b);
    best = Math.max(best, hi);
  }
  return best;
}`,
          java: `class Solution {
    public int maxProduct(int[] nums) {
        long hi = nums[0], lo = nums[0], best = nums[0];   // largest and smallest product of a subarray ending here
        for (int i = 1; i < nums.length; i++) {
            long x = nums[i], a = hi * x, b = lo * x;      // both use the old hi and lo
            hi = Math.max(x, Math.max(a, b));
            lo = Math.min(x, Math.min(a, b));
            best = Math.max(best, hi);
        }
        return (int) best;
    }
}`,
          cpp: `class Solution {
public:
    int maxProduct(vector<int>& nums) {
        long long hi = nums[0], lo = nums[0], best = nums[0];   // largest and smallest product of a subarray ending here
        for (int i = 1; i < (int)nums.size(); i++) {
            long long x = nums[i], a = hi * x, b = lo * x;      // both use the old hi and lo
            hi = max(x, max(a, b));
            lo = min(x, min(a, b));
            best = max(best, hi);
        }
        return (int)best;
    }
};`
        },
        complexity: 'O(n) time, O(1) space.',
        say: '“A running maximum isn’t enough for products, because a negative number can turn the smallest product into the largest. So for each index I keep the largest and smallest product of a subarray ending there. The new values come from the element alone, the old maximum times it, or the old minimum times it, and I compute both before overwriting either. A zero resets both to zero naturally, because every product with it is zero, and the next element starts fresh as a candidate on its own. The answer is the largest maximum seen.”',
        followups: [
          { q: 'What happens at a zero?', a: 'Both `a` and `b` are 0, so `hi` and `lo` become `max(0, 0, 0)` and `min(0, 0, 0)`, which is 0. The next element is then a candidate on its own through the `x` option, so the run restarts after the zero.' },
          { q: 'Why compute `a` and `b` before updating?', a: 'The new `lo` needs the **old** `hi`. If you overwrite `hi` first and then use it, you multiply the wrong value. Computing both products up front (or using a tuple assignment in Python) avoids it.' },
          { q: 'Is there a way without keeping the minimum?', a: 'Yes: scan from the left and from the right, resetting the running product to 1 after any zero, and take the best of both scans. The odd count of negatives is dropped by one scan or the other. It’s a good alternative to mention, but the max-and-min version is the one that generalizes.' },
          { q: 'Could the product overflow?', a: 'The problem guarantees the answer fits in 32 bits, but intermediate values may not. Use a 64-bit type in Java or C++ to be safe.' }
        ]
      },
      {
        lc: 918,
        restate: 'You get a circular array, where the last element is next to the first. Return the largest sum of a non-empty subarray, where a subarray may wrap around the end.',
        examples: '- `[1,-2,3,-2]` → 3: the single 3.\n- `[5,-3,5]` → 10: wrap around, `5 + 5`.\n- `[-3,-2,-3]` → −2.\n- Edge cases: all negative (the wrap trick would pick an **empty** subarray, which isn’t allowed); a single element.',
        brute: 'Try every start and every length up to n, summing as you go: O(n²) time. Fine for tiny inputs, too slow for n = 3·10⁴ in the worst case.',
        insight: 'Either the best subarray doesn’t wrap, in which case it’s ordinary Kadane, or it wraps. A wrapping subarray is the whole array **minus a contiguous piece in the middle**, so the best wrapping sum is `total − (smallest subarray sum)`. One pass can run Kadane for the maximum and for the minimum together. The answer is the larger of the two cases, with one exception: if every number is negative, the “minimum subarray” is the whole array, and `total − total = 0` would mean choosing nothing. In that case return the plain Kadane maximum.',
        code: {
          py: `class Solution:
    def maxSubarraySumCircular(self, nums: List[int]) -> int:
        total = 0
        cur_max = cur_min = 0
        best_max = best_min = nums[0]
        for x in nums:
            cur_max = max(cur_max, 0) + x     # best run ending here (restart when it goes negative)
            cur_min = min(cur_min, 0) + x     # worst run ending here (restart when it goes positive)
            best_max = max(best_max, cur_max)
            best_min = min(best_min, cur_min)
            total += x
        if best_max < 0:                      # all negative: wrapping would pick an empty subarray
            return best_max
        return max(best_max, total - best_min)`,
          js: `function maxSubarraySumCircular(nums) {
  let total = 0, curMax = 0, curMin = 0, bestMax = nums[0], bestMin = nums[0];
  for (const x of nums) {
    curMax = Math.max(curMax, 0) + x;         // best run ending here (restart when it goes negative)
    curMin = Math.min(curMin, 0) + x;         // worst run ending here (restart when it goes positive)
    bestMax = Math.max(bestMax, curMax);
    bestMin = Math.min(bestMin, curMin);
    total += x;
  }
  if (bestMax < 0) return bestMax;            // all negative: wrapping would pick an empty subarray
  return Math.max(bestMax, total - bestMin);
}`,
          java: `class Solution {
    public int maxSubarraySumCircular(int[] nums) {
        int total = 0, curMax = 0, curMin = 0, bestMax = nums[0], bestMin = nums[0];
        for (int x : nums) {
            curMax = Math.max(curMax, 0) + x;     // best run ending here (restart when it goes negative)
            curMin = Math.min(curMin, 0) + x;     // worst run ending here (restart when it goes positive)
            bestMax = Math.max(bestMax, curMax);
            bestMin = Math.min(bestMin, curMin);
            total += x;
        }
        if (bestMax < 0) return bestMax;          // all negative: wrapping would pick an empty subarray
        return Math.max(bestMax, total - bestMin);
    }
}`,
          cpp: `class Solution {
public:
    int maxSubarraySumCircular(vector<int>& nums) {
        int total = 0, curMax = 0, curMin = 0, bestMax = nums[0], bestMin = nums[0];
        for (int x : nums) {
            curMax = max(curMax, 0) + x;          // best run ending here (restart when it goes negative)
            curMin = min(curMin, 0) + x;          // worst run ending here (restart when it goes positive)
            bestMax = max(bestMax, curMax);
            bestMin = min(bestMin, curMin);
            total += x;
        }
        if (bestMax < 0) return bestMax;          // all negative: wrapping would pick an empty subarray
        return max(bestMax, total - bestMin);
    }
};`
        },
        complexity: 'O(n) time, one pass. O(1) space.',
        say: '“A circular subarray either stays inside the array, which is plain Kadane, or wraps around. A wrapping one is the total minus a contiguous piece in the middle, so I want the total minus the **minimum** subarray. I run both Kadane variants in one pass and return the larger result. The one exception is an all-negative array, where the minimum subarray is everything and the wrapping case would be empty, so I return the ordinary maximum.”',
        followups: [
          { q: 'How do you know the all-negative case is exactly `best_max < 0`?', a: 'If any element is 0 or more, some subarray has sum at least 0, so `best_max >= 0`. So `best_max < 0` happens precisely when every element is negative.' },
          { q: 'What if the minimum subarray is the whole array, but some elements are positive?', a: 'It can happen: `[-5, 1, -5]`. Then `total − best_min = 0`, which never beats `best_max`, and here `best_max` is 1, so `max` picks the non-wrapping answer. The formula stays correct.' },
          { q: 'Could you instead run Kadane on the array doubled?', a: 'Yes, but you must cap the length of the subarray at n, which needs a deque and prefix sums. The total-minus-minimum trick is simpler and O(1) space.' }
        ]
      },
      {
        lc: 1186,
        restate: 'Given an integer array, return the largest sum of a non-empty subarray after you are allowed to delete **at most one** element from it (the rest stays joined). The result must still contain at least one element.',
        examples: '- `[1,-2,0,3]` → 4: delete −2 and keep `1 + 0 + 3`.\n- `[1,-2,-2,3]` → 3: just `[3]`; deleting one −2 doesn’t help enough.\n- `[-1,-1,-1,-1]` → −1: delete nothing and take one element.\n- Edge cases: a single element (no deletion possible); deleting changes nothing when all numbers are positive.',
        brute: 'For each of the n possible deletions, run Kadane on what’s left: O(n²) time, plus one run with no deletion. Fine at small sizes, too slow at 10⁵.',
        insight: 'Keep **two** values per index instead of one. `keep` is the best sum of a run ending here with nothing deleted: ordinary Kadane. `gone` is the best sum of a run ending here that has already used its one deletion. Moving to a new element `x`: either `x` is the deleted one (so `gone` becomes the previous `keep`, a run ending one step back), or `x` is kept and the run had already used its deletion (`gone + x`). Compute `gone` from the old `keep` before updating `keep`.',
        code: {
          py: `class Solution:
    def maximumSum(self, arr: List[int]) -> int:
        keep = best = arr[0]               # best run ending here, nothing deleted
        gone = float('-inf')               # best run ending here, one element deleted (none possible yet)
        for x in arr[1:]:
            gone = max(gone + x, keep)     # keep x after a deletion, or delete x itself
            keep = max(keep + x, x)        # ordinary Kadane
            best = max(best, keep, gone)
        return best`,
          js: `function maximumSum(arr) {
  let keep = arr[0], best = arr[0], gone = -Infinity;   // gone: one element deleted (none possible yet)
  for (let i = 1; i < arr.length; i++) {
    const x = arr[i];
    gone = Math.max(gone + x, keep);     // keep x after a deletion, or delete x itself
    keep = Math.max(keep + x, x);        // ordinary Kadane
    best = Math.max(best, keep, gone);
  }
  return best;
}`,
          java: `class Solution {
    public int maximumSum(int[] arr) {
        int keep = arr[0], best = arr[0], gone = Integer.MIN_VALUE / 2;   // gone: one element deleted (none possible yet)
        for (int i = 1; i < arr.length; i++) {
            int x = arr[i];
            gone = Math.max(gone + x, keep);     // keep x after a deletion, or delete x itself
            keep = Math.max(keep + x, x);        // ordinary Kadane
            best = Math.max(best, Math.max(keep, gone));
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maximumSum(vector<int>& arr) {
        int keep = arr[0], best = arr[0], gone = INT_MIN / 2;   // gone: one element deleted (none possible yet)
        for (int i = 1; i < (int)arr.size(); i++) {
            int x = arr[i];
            gone = max(gone + x, keep);          // keep x after a deletion, or delete x itself
            keep = max(keep + x, x);             // ordinary Kadane
            best = max(best, max(keep, gone));
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time. O(1) space: two running values and the best.',
        say: '“It’s Kadane with one extra bit of state. For each index I track the best run ending here with no deletion, and the best run ending here that has used its deletion. The deleted state comes either from deleting the current element, which means taking the previous no-deletion run, or from extending an earlier deleted run. I update the deleted state first, from the old values, then ordinary Kadane, and track the overall best of both.”',
        followups: [
          { q: 'Why can the answer never be an empty array?', a: 'On the first step `gone` is minus infinity, and afterwards `gone` is at least the previous `keep`, a real non-empty run. And `best` starts at `arr[0]`, so a non-empty subarray always wins even with all negatives.' },
          { q: 'What if you could delete up to k elements?', a: 'Make the state an array indexed by deletions used, `dp[j]`, so each step costs O(k). It’s the same two-line transition per level. Total O(n·k).' },
          { q: 'Why is `Integer.MIN_VALUE / 2` used in Java and C++?', a: 'Adding a negative number to the smallest int would overflow. Halving it leaves room. It disappears immediately anyway, because the next step takes the max with a real `keep`.' }
        ]
      },
      {
        lc: 1749,
        restate: 'Given an integer array, return the largest **absolute value** of the sum of any subarray. The empty subarray is allowed, so the answer is at least 0.',
        examples: '- `[1,-3,2,3,-4]` → 5, from `[2,3]`.\n- `[2,-5,1,-4,3,-2]` → 8, from `[-5,1,-4]`, whose sum is −8.\n- Edge cases: a single zero → 0; all negative (the answer is the magnitude of the whole array); an array of all zeros → 0.',
        brute: 'Compute the absolute sum of every subarray with a running sum per start: O(n²).',
        insight: 'The largest absolute sum is either the largest positive subarray sum or the most negative one, flipped in sign. Those are plain Kadane and its mirror image. Run both in one pass: one variable restarts when it dips below zero (maximum), the other when it rises above zero (minimum). The answer is `max(best_max, -best_min)`. With the empty subarray allowed, both clamps start at 0.',
        code: {
          py: `class Solution:
    def maxAbsoluteSum(self, nums: List[int]) -> int:
        hi = lo = best = 0
        for x in nums:
            hi = max(hi, 0) + x      # best run ending here (empty allowed)
            lo = min(lo, 0) + x      # worst run ending here (empty allowed)
            best = max(best, hi, -lo)
        return best`,
          js: `function maxAbsoluteSum(nums) {
  let hi = 0, lo = 0, best = 0;
  for (const x of nums) {
    hi = Math.max(hi, 0) + x;        // best run ending here (empty allowed)
    lo = Math.min(lo, 0) + x;        // worst run ending here (empty allowed)
    best = Math.max(best, hi, -lo);
  }
  return best;
}`,
          java: `class Solution {
    public int maxAbsoluteSum(int[] nums) {
        int hi = 0, lo = 0, best = 0;
        for (int x : nums) {
            hi = Math.max(hi, 0) + x;        // best run ending here (empty allowed)
            lo = Math.min(lo, 0) + x;        // worst run ending here (empty allowed)
            best = Math.max(best, Math.max(hi, -lo));
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maxAbsoluteSum(vector<int>& nums) {
        int hi = 0, lo = 0, best = 0;
        for (int x : nums) {
            hi = max(hi, 0) + x;                 // best run ending here (empty allowed)
            lo = min(lo, 0) + x;                 // worst run ending here (empty allowed)
            best = max(best, max(hi, -lo));
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time, O(1) space.',
        say: '“The biggest absolute sum is either the biggest subarray sum or the most negative one with its sign flipped. So I run Kadane for the maximum and a mirror Kadane for the minimum in the same pass, and keep the larger of `hi` and `-lo`. Since the empty subarray is allowed, I clamp each running value at zero before adding the next element.”',
        followups: [
          { q: 'Could you do it with prefix sums?', a: 'Yes, and it’s a neat one-liner. Every subarray sum is a difference of two prefix sums (including the empty prefix 0), so the biggest absolute sum is the **maximum prefix minus the minimum prefix**.' },
          { q: 'Why is clamping at zero valid here, when it wasn’t in 53?', a: 'Because the empty subarray is allowed, a run that goes negative can legally restart as the empty run, with sum 0. In 53 the subarray must be non-empty, so restarting means starting at `x`, not at 0.' }
        ]
      }
    ],

    practice: [
      { lc: 1800,
        hints: ['A subarray here must be strictly ascending, so a number that isn’t bigger than its predecessor ends the current run.', 'Keep the running sum of the current ascending run, and restart it at the element that broke the pattern.', 'Track the best sum seen at the end of each step. A single element counts as a run.'],
        solution: { explain: 'Kadane with a different restart rule: extend while the numbers strictly rise, restart otherwise. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def maxAscendingSum(self, nums: List[int]) -> int:
        cur = best = nums[0]
        for i in range(1, len(nums)):
            cur = cur + nums[i] if nums[i] > nums[i - 1] else nums[i]
            best = max(best, cur)
        return best`,
          js: `function maxAscendingSum(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = nums[i] > nums[i - 1] ? cur + nums[i] : nums[i];
    best = Math.max(best, cur);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxAscendingSum(self, nums: List[int]) -> int:\n        ', js: 'function maxAscendingSum(nums) {\n  \n}' },
        tests: { fn: 'maxAscendingSum', cases: [
          { args: [[10, 20, 30, 5, 10, 50]], out: 65 }, { args: [[10, 20, 30, 40, 50]], out: 150 }, { args: [[12, 17, 15, 13, 10, 11, 12]], out: 33 },
          { args: [[100]], out: 100 }, { args: [[3, 6, 10, 1, 8, 9, 9, 8, 9]], out: 19 }] } },

      { lc: 53,
        hints: ['Think about the best subarray that **ends at** each index, not the best overall.', 'That best is either the element alone or the previous best plus the element. Keep only the previous one.', 'Start from the first element, not from 0, so an all-negative array works.'],
        starter: { py: 'class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ', js: 'function maxSubArray(nums) {\n  \n}' },
        tests: { fn: 'maxSubArray', sig: { args: ['int[]'] }, cases: [
          { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], out: 6 }, { args: [[1]], out: 1 }, { args: [[5, 4, -1, 7, 8]], out: 23 }, { args: [[-3, -1, -2]], out: -1 },
          { args: [[-1]], out: -1 }, { args: [[0, 0]], out: 0 }, { args: [[-2, -1]], out: -1 }, { args: [[2, -1, 2, -1, 2]], out: 4 }] } },

      { lc: 2606,
        hints: ['Give every character a value: the listed value if it’s in `chars`, otherwise its position in the alphabet (a = 1 … z = 26).', 'This is “maximum subarray sum” over those values, and an empty substring (cost 0) is allowed.', 'Because empty is allowed, clamp the running sum at 0 before adding each character.'],
        solution: { explain: 'Map each character to its cost, then run the clamped Kadane (empty allowed). O(n + |chars|) time, O(|chars|) space.', code: {
          py: `class Solution:
    def maximumCostSubstring(self, s: str, chars: str, vals: List[int]) -> int:
        cost = dict(zip(chars, vals))
        cur = best = 0
        for ch in s:
            cur = max(cur, 0) + cost.get(ch, ord(ch) - 96)
            best = max(best, cur)
        return best`,
          js: `function maximumCostSubstring(s, chars, vals) {
  const cost = new Map();
  for (let i = 0; i < chars.length; i++) cost.set(chars[i], vals[i]);
  let cur = 0, best = 0;
  for (const ch of s) {
    const v = cost.has(ch) ? cost.get(ch) : ch.charCodeAt(0) - 96;
    cur = Math.max(cur, 0) + v;
    best = Math.max(best, cur);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maximumCostSubstring(self, s: str, chars: str, vals: List[int]) -> int:\n        ', js: 'function maximumCostSubstring(s, chars, vals) {\n  \n}' },
        tests: { fn: 'maximumCostSubstring', cases: [
          { args: ['adaa', 'd', [-1000]], out: 2 }, { args: ['abc', 'abc', [-1, -1, -1]], out: 0 }, { args: ['aaa', 'b', [5]], out: 3 },
          { args: ['zz', 'z', [-5]], out: 0 }, { args: ['abcd', 'a', [10]], out: 19 }] } },

      { lc: 1014,
        hints: ['The score for i < j is `values[i] + values[j] + i - j`. Split it into a part that depends only on i and a part that depends only on j.', 'For each j, you want the best `values[i] + i` among earlier positions. Keep it as a running maximum.', 'The pair’s score is that running maximum plus `values[j] - j`; track the best over all j.'],
        solution: { explain: 'Rewrite the score as `(values[i] + i) + (values[j] - j)`. Sweep j from the left, keeping the best left part so far, a running maximum rather than a restart rule. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def maxScoreSightseeingPair(self, values: List[int]) -> int:
        left = values[0]                       # best values[i] + i so far
        best = float('-inf')
        for j in range(1, len(values)):
            best = max(best, left + values[j] - j)
            left = max(left, values[j] + j)
        return best`,
          js: `function maxScoreSightseeingPair(values) {
  let left = values[0], best = -Infinity;      // left: best values[i] + i so far
  for (let j = 1; j < values.length; j++) {
    best = Math.max(best, left + values[j] - j);
    left = Math.max(left, values[j] + j);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxScoreSightseeingPair(self, values: List[int]) -> int:\n        ', js: 'function maxScoreSightseeingPair(values) {\n  \n}' },
        tests: { fn: 'maxScoreSightseeingPair', cases: [
          { args: [[8, 1, 5, 2, 6]], out: 11 }, { args: [[1, 2]], out: 2 }, { args: [[3, 3, 3]], out: 5 }, { args: [[10, 1, 1, 10]], out: 17 }, { args: [[5, -2, 9]], out: 12 }] } },

      { lc: 978,
        hints: ['A turbulent run alternates up, down, up… (or down, up, down…) between neighbors, and equal neighbors break it.', 'Track two lengths ending at the current index: the longest run whose last step went **up**, and the longest whose last step went **down**.', 'An up-step extends the previous down-run by one and resets the up-run to 1 (and symmetrically for a down-step). Equal neighbors reset both to 1.'],
        solution: { explain: 'Two-state Kadane: the run ending here with a rising last step can only extend a run whose last step fell. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def maxTurbulenceSize(self, arr: List[int]) -> int:
        up = down = best = 1
        for i in range(1, len(arr)):
            if arr[i] > arr[i - 1]:
                up, down = down + 1, 1
            elif arr[i] < arr[i - 1]:
                up, down = 1, up + 1
            else:
                up = down = 1
            best = max(best, up, down)
        return best`,
          js: `function maxTurbulenceSize(arr) {
  let up = 1, down = 1, best = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[i - 1]) { [up, down] = [down + 1, 1]; }
    else if (arr[i] < arr[i - 1]) { [up, down] = [1, up + 1]; }
    else { up = 1; down = 1; }
    best = Math.max(best, up, down);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxTurbulenceSize(self, arr: List[int]) -> int:\n        ', js: 'function maxTurbulenceSize(arr) {\n  \n}' },
        tests: { fn: 'maxTurbulenceSize', cases: [
          { args: [[9, 4, 2, 10, 7, 8, 8, 1, 9]], out: 5 }, { args: [[4, 8, 12, 16]], out: 2 }, { args: [[100]], out: 1 }, { args: [[9, 9]], out: 1 },
          { args: [[0, 1, 1, 0, 1, 0, 1, 1, 0, 0]], out: 5 }, { args: [[1, 2, 1]], out: 3 }] } },

      { lc: 1567,
        hints: ['A zero cuts the array into independent pieces, so reset your state there.', 'Track two lengths ending at the current index: the longest run with a **positive** product and the longest with a **negative** product.', 'A positive number extends both; a negative number swaps them (positive becomes negative and vice versa). Watch the case where a length is 0, meaning “no such run”.'],
        solution: { explain: 'Kadane on lengths instead of sums, with two states (positive product, negative product) because a negative number swaps them. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def getMaxLen(self, nums: List[int]) -> int:
        pos = neg = best = 0
        for x in nums:
            if x == 0:
                pos = neg = 0
            elif x > 0:
                pos, neg = pos + 1, (neg + 1 if neg else 0)
            else:
                pos, neg = (neg + 1 if neg else 0), pos + 1
            best = max(best, pos)
        return best`,
          js: `function getMaxLen(nums) {
  let pos = 0, neg = 0, best = 0;
  for (const x of nums) {
    if (x === 0) { pos = 0; neg = 0; }
    else if (x > 0) { [pos, neg] = [pos + 1, neg ? neg + 1 : 0]; }
    else { [pos, neg] = [neg ? neg + 1 : 0, pos + 1]; }
    best = Math.max(best, pos);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def getMaxLen(self, nums: List[int]) -> int:\n        ', js: 'function getMaxLen(nums) {\n  \n}' },
        tests: { fn: 'getMaxLen', cases: [
          { args: [[1, -2, -3, 4]], out: 4 }, { args: [[0, 1, -2, -3, -4]], out: 3 }, { args: [[-1, -2, -3, 0, 1]], out: 2 }, { args: [[-1]], out: 0 },
          { args: [[1]], out: 1 }, { args: [[0]], out: 0 }, { args: [[1, 2, -3, 4]], out: 2 }] } },

      { lc: 152,
        hints: ['A negative number can turn the smallest product into the largest, so one running maximum isn’t enough.', 'Keep the largest **and** smallest product of a subarray ending at the current index.', 'Each step, the new largest and smallest come from three candidates: the element alone, old largest × element, old smallest × element. Compute both before overwriting.'],
        starter: { py: 'class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        ', js: 'function maxProduct(nums) {\n  \n}' },
        tests: { fn: 'maxProduct', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 3, -2, 4]], out: 6 }, { args: [[-2, 0, -1]], out: 0 }, { args: [[-2]], out: -2 }, { args: [[-2, 3, -4]], out: 24 },
          { args: [[0, 2]], out: 2 }, { args: [[2, -5, -2, -4, 3]], out: 24 }, { args: [[-3, -1, -1]], out: 3 }, { args: [[-2, -3, 0, -1, 5, -1]], out: 6 }] } },

      { lc: 918,
        hints: ['The best arc either stays inside the array or wraps around the end.', 'A wrapping arc is the total minus a contiguous piece in the middle, so you want the total minus the **minimum** subarray sum.', 'Run Kadane for the max and the min in one pass. If every number is negative, return the plain maximum.'],
        starter: { py: 'class Solution:\n    def maxSubarraySumCircular(self, nums: List[int]) -> int:\n        ', js: 'function maxSubarraySumCircular(nums) {\n  \n}' },
        tests: { fn: 'maxSubarraySumCircular', sig: { args: ['int[]'] }, cases: [
          { args: [[1, -2, 3, -2]], out: 3 }, { args: [[5, -3, 5]], out: 10 }, { args: [[-3, -2, -3]], out: -2 }, { args: [[3, -1, 2, -1]], out: 4 },
          { args: [[2, -2, 2, 7, 8, 0]], out: 19 }, { args: [[1]], out: 1 }, { args: [[-1]], out: -1 }, { args: [[0, 0]], out: 0 }, { args: [[3, -2, 2, -3, 4, -1]], out: 6 }] } },

      { lc: 1186,
        hints: ['Ordinary Kadane isn’t enough: you need to know whether the current run has already used its deletion.', 'Keep two values per index: the best run ending here with no deletion, and the best run ending here with one element deleted.', 'The “deleted” value is either the previous no-deletion value (delete the current element) or the previous deleted value plus the current element.'],
        starter: { py: 'class Solution:\n    def maximumSum(self, arr: List[int]) -> int:\n        ', js: 'function maximumSum(arr) {\n  \n}' },
        tests: { fn: 'maximumSum', sig: { args: ['int[]'] }, cases: [
          { args: [[1, -2, 0, 3]], out: 4 }, { args: [[1, -2, -2, 3]], out: 3 }, { args: [[-1, -1, -1, -1]], out: -1 }, { args: [[1]], out: 1 }, { args: [[-5]], out: -5 },
          { args: [[2, 1, -2, -5, -2]], out: 3 }, { args: [[1, -4, -5, -2, 5, 0, -1, 2]], out: 7 }, { args: [[5, -10, 6]], out: 11 }] } },

      { lc: 1749,
        hints: ['The largest absolute value is either the largest subarray sum or the most negative one, sign flipped.', 'Run Kadane for the maximum and a mirror version for the minimum, in the same loop.', 'The empty subarray is allowed, so clamp each running value at 0 before adding the next element.'],
        starter: { py: 'class Solution:\n    def maxAbsoluteSum(self, nums: List[int]) -> int:\n        ', js: 'function maxAbsoluteSum(nums) {\n  \n}' },
        tests: { fn: 'maxAbsoluteSum', sig: { args: ['int[]'] }, cases: [
          { args: [[1, -3, 2, 3, -4]], out: 5 }, { args: [[2, -5, 1, -4, 3, -2]], out: 8 }, { args: [[-1]], out: 1 }, { args: [[0]], out: 0 }, { args: [[5, 5]], out: 10 }, { args: [[-3, -4]], out: 7 }] } }
    ],

    mistakes: [
      '**Starting `best` (or `cur`) at 0 when the subarray must be non-empty.** On `[-3, -1, -2]` that returns 0 instead of −1. Start from `nums[0]`. Only start from 0 when the problem allows an empty subarray, and then clamp with `max(0, ...)`.',
      '**Restarting on a negative element instead of a non-positive running sum.** The restart test is about the sum carried in, tested **before** adding `x`: `cur = max(x, cur + x)`. On `[5, -1, 6]` the −1 is negative, but the carried 5 is positive, so the run continues and the answer is 10.',
      '**Forgetting that `cur` is not the answer.** `cur` is the best run ending *here*; the answer is the maximum `cur` over all indices. Returning `cur` at the end gives the best run ending at the last element only.',
      '**Tracking only the maximum for products.** A negative number turns the smallest product into the largest. You need the running minimum too, and you must compute the new maximum and minimum from the **old** pair before overwriting either.',
      '**Using the wrapping formula on an all-negative circular array.** `total − min subarray` is 0 when the minimum subarray is everything, which means selecting nothing. Return the ordinary maximum when it’s negative.',
      '**Reaching for a sliding window.** Shrinking a window only makes sense when the rule is monotonic. With negatives, adding an element can raise the sum, so there’s no safe time to shrink. “Extend or restart” is the right frame.',
      '**Language gotchas.** *Python:* `max(nums[left:right])` or `sum(nums[i:j])` inside the loop copies slices and makes an O(n²) solution without looking like one. *JavaScript:* `Math.max(...bigArray)` can overflow the call stack on very large arrays; use a loop. *Java:* `Integer.MIN_VALUE + x` with a negative `x` wraps around to a huge positive number; use `Integer.MIN_VALUE / 2` or start from `nums[0]`. *C++:* the same signed overflow is undefined behavior; also `max(a, b)` needs both arguments to be the same type, so `max(cur, 0LL)` for a `long long` `cur`.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What are the time and space complexity of Kadane’s algorithm for Maximum Subarray?',
        choices: ['O(n) time, O(1) space', 'O(n) time, O(n) space', 'O(n log n) time, O(1) space', 'O(n²) time, O(1) space'], answer: 0,
        explain: 'One pass, and `cur[i]` only reads `cur[i - 1]`, so two integers are enough. The DP-array version uses O(n) space for no benefit.' },
      { kind: 'bug', q: 'This returns 0 for `[-3, -1, -2]`, but the answer is −1. What’s the bug?',
        code: `def max_subarray(nums):
    cur, best = 0, 0
    for x in nums:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best`, lang: 'py',
        choices: ['`best` starts at 0, so it can never be negative; start `cur` and `best` from `nums[0]`', '`cur` should be `max(0, cur + x)`', 'The loop should skip the first element', '`best` should be updated before `cur`'], answer: 0,
        explain: 'Every `cur` here is negative, but `best` begins at 0 and `max(0, negative)` keeps it at 0. The subarray must be non-empty, so the answer is the largest element: initialise from `nums[0]`.' },
      { kind: 'concept', q: 'In Kadane’s algorithm, when should the running sum **restart** at the current element?',
        choices: ['When the running sum before this element is zero or negative', 'When the current element is negative', 'When the running sum becomes larger than `best`', 'Every time `best` changes'], answer: 0,
        explain: 'A non-positive running sum can’t improve any subarray that continues through the current element, so `x` alone is at least as good. A negative `x` by itself isn’t a reason to restart: `[5, -1, 6]` should keep the 5.' },
      { kind: 'pattern', q: 'Which of these is a Kadane-style problem?',
        choices: ['The largest sum of a contiguous subarray, in an array with negative numbers', 'The number of subarrays whose sum equals exactly k', 'The longest increasing subsequence', 'Two numbers in a sorted array that add up to a target'], answer: 0,
        explain: 'Best contiguous sum is the textbook case. Counting subarrays with sum exactly k is prefix sums with a hash map, a subsequence isn’t contiguous, and the sorted pair is two pointers.' },
      { kind: 'pattern', q: 'Which signals point to Kadane’s “extend or restart” idea? Pick every one that applies.',
        choices: ['The answer is the best contiguous run by sum, product or length', 'The best run ending at i depends only on the best run ending at i − 1', 'The input contains negative numbers that make the whole array a poor answer', 'You need the number of subarrays that satisfy a rule'], answer: [0, 1, 2],
        explain: 'Contiguous best-run questions where the best run ending here builds on the best run ending one step back are Kadane’s home. Counting problems usually need prefix sums or a counting window instead.' },
      { kind: 'concept', q: 'Why does Maximum Product Subarray need a running **minimum** as well as a running maximum?',
        choices: ['A negative element can turn the smallest (most negative) product into the largest', 'The minimum is needed to detect zeros', 'Products are not associative', 'It lets you skip the restart check'], answer: 0,
        explain: 'Multiplying the most negative product by a negative element gives a large positive one. If you only kept the maximum, you’d throw that candidate away. Zeros are handled by the “element alone” option instead.' },
      { kind: 'bug', q: 'This should return 24 for `[-2, 3, -4]` but returns 3. What’s missing?',
        code: `function maxProduct(nums) {
  let hi = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    hi = Math.max(nums[i], hi * nums[i]);
    best = Math.max(best, hi);
  }
  return best;
}`, lang: 'js',
        choices: ['A running minimum: the product −6 ending at the 3 becomes 24 when multiplied by −4', 'A check for zeros', '`best` should start at 0', 'The loop should run from the right'], answer: 0,
        explain: 'After `3`, the smallest product ending there is −6. Multiplying it by −4 gives 24, but the code only remembers the maximum (3), so it can never see that. Track the minimum too and compute both from the old pair.' },
      { kind: 'concept', q: 'For Maximum Sum Circular Subarray, a subarray that wraps around has what sum?',
        choices: ['The total of the array minus a contiguous subarray in the middle', 'Twice the maximum non-wrapping subarray', 'The total of the array minus its largest element', 'The maximum non-wrapping subarray plus the first element'], answer: 0,
        explain: 'What a wrapping subarray leaves out is one contiguous stretch in the middle. So the best wrap is the total minus the smallest subarray sum, and you compare that with the best non-wrapping sum.' }
    ],

    flashcards: [
      { id: 'cur-meaning', front: 'Kadane: what does `cur` hold at index i?', back: 'The best sum of a subarray that **ends exactly at i**. The answer is the maximum `cur` over all i, because the best subarray ends somewhere.' },
      { id: 'extend-restart', front: 'Kadane in one line?', back: '`cur = max(x, cur + x)`: restart at x, or extend the previous run. Equivalent: restart when the previous `cur` is 0 or less.' },
      { id: 'init-best', front: 'Why initialise `best` from `nums[0]` and not 0?', back: 'All-negative input. The best non-empty subarray is the largest single element, which is below 0. Starting from 0 would wrongly return 0.' },
      { id: 'dp-view', front: 'Kadane as a DP: state, transition, answer?', back: 'State: `end[i]`, the best sum ending exactly at i. Transition: `end[i] = nums[i] + max(0, end[i - 1])`. Answer: `max(end)`. One variable suffices, since only `end[i - 1]` is read.' },
      { id: 'indices', front: 'How do you return the subarray itself?', back: 'Set `start = i` on each restart. When `cur > best`, save `(start, i)`. A strict `>` keeps the earliest tie.' },
      { id: 'product-two', front: 'Maximum Product Subarray: what must you track and why?', back: 'The running **maximum and minimum** product ending here: a negative element turns the minimum into the maximum. Compute both from the old pair, and take the element alone as a third candidate.' },
      { id: 'circular', front: 'Circular maximum subarray: the formula?', back: '`max(kadane_max, total − kadane_min)`. A wrapping arc is the total minus a middle stretch. If every element is negative, return `kadane_max`, since total − min would mean an empty selection.' },
      { id: 'one-deletion', front: 'Max subarray with at most one deletion: what states?', back: 'Two per index: `keep` (no deletion yet, plain Kadane) and `gone` (one deleted). `gone = max(gone + x, keep)` (delete x, or extend); update it before `keep`.' },
      { id: 'empty-allowed', front: 'Empty subarray allowed: what changes?', back: 'Start `cur` and `best` at 0 and use `cur = max(0, cur + x)`. The answer is never negative.' },
      { id: 'prefix-view', front: 'Kadane in terms of prefix sums?', back: 'Best subarray ending at j is `P[j + 1]` minus the smallest earlier prefix. Tracking that minimum is the same as restarting when the running sum goes non-positive.' },
      { id: 'not-window', front: 'Why isn’t maximum subarray a sliding-window problem?', back: 'The rule isn’t monotonic: with negatives, adding an element can raise the sum, so there’s no safe moment to shrink. Use extend-or-restart.' }
    ],

    deeper: [
      { title: 'Maximum subarray problem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Maximum_subarray_problem', time: 'about 15 min', note: 'A compact write-up of the problem, Kadane’s one-pass solution and its history, plus the divide-and-conquer and 2-D versions.' },
      { title: 'Maximum Subarray (LeetCode 53)', url: 'https://leetcode.com/problems/maximum-subarray/', time: 'about 30 min', note: 'The anchor problem. Solve it, then read the solutions tab for the Kadane and divide-and-conquer approaches side by side.' },
      { title: 'Largest Sum Contiguous Subarray (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/', time: 'about 15 min', note: 'A readable walkthrough with a dry run, handy for seeing the algorithm traced on an example.' },
      { title: 'Maximum Product Subarray (LeetCode 152)', url: 'https://leetcode.com/problems/maximum-product-subarray/', time: 'about 30 min', note: 'The most common follow-up. Try it after this page, then compare the max-and-min version with the two-scan version in the discussion.' }
    ],

    detective: [
      { id: 'net-days', decoys: ['sliding-window', 'prefix-sums', 'greedy'],
        statement: 'A food truck’s owner writes down each day’s profit or loss for the whole season. Some days lost money. They want to find the single stretch of **back-to-back days** with the greatest total, and report that total. Skipping a bad day in the middle isn’t allowed.',
        why: 'Contiguous days with a sum to maximize, and the numbers can be negative. A window can’t decide when to shrink, so ask at each day: carry the running total, or drop it and start over here? That’s “extend or restart”.' },
      { id: 'ring-route', decoys: ['sliding-window', 'prefix-sums', 'dp-1d'],
        statement: 'A shuttle loops around a ring road with stops in a fixed circular order. At each stop passengers board (a positive number) or leave (a negative number, counted as a loss of revenue). The planner wants the **consecutive run of stops** with the greatest net total, and the run is allowed to cross the stop where the loop restarts.',
        why: 'Best contiguous sum, but on a circle. Either the run stays inside the list (plain extend-or-restart), or it wraps, which means the total minus the worst middle stretch. One pass tracks both the best and the worst runs.' },
      { id: 'multiplier-chain', decoys: ['dp-1d', 'prefix-sums', 'greedy'],
        statement: 'A trading desk records the daily multiplier applied to a portfolio: 2 means the value doubled, −1 means a reversal, 0 means wiped out (always whole numbers). They want the **consecutive stretch of days** whose multipliers multiply to the largest value.',
        why: 'The same extend-or-restart shape, but with products. A reversal (a negative factor) can turn the worst running product into the best one, so the solution tracks both the largest and smallest product ending at each day.' },
      { id: 'drift-swing', decoys: ['prefix-sums', 'sliding-window', 'two-pointers'],
        statement: 'A weather station logs how far each day’s temperature sits above or below the long-term average. A researcher wants the **consecutive stretch** of days whose combined deviation is largest in size, whether it runs warm or cold, and asks for that size.',
        why: 'The biggest swing in either direction is the maximum subarray sum or the negated minimum subarray sum. Run one extend-or-restart for the maximum and a mirror version for the minimum in the same pass.' },
      { id: 'cut-one-clip', decoys: ['dp-1d', 'sliding-window', 'prefix-sums'],
        statement: 'A video editor scores each clip in a continuous reel by how much viewers liked it. Some clips have a negative score. They may cut **one clip** out of a stretch (the neighbors join up), and want the highest total score of any non-empty stretch afterwards.',
        why: 'A best contiguous stretch where one element may be removed. Keep the extend-or-restart idea but carry two states per position: a run that hasn’t cut anything yet, and a run that already has.' }
    ]
  });
})();
