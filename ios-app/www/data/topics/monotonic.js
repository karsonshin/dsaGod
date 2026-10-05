/* Offer Ready: Monotonic stack and queue lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'monotonic',

    hook: 'Some questions sound like they need a nested loop: “for every element, find the next bigger one”, “how far can this bar stretch”, “the maximum of every window”. A monotonic stack or deque answers all of them in one pass, because each element is pushed once and popped once. It is the trick behind Daily Temperatures (739) and Largest Rectangle in Histogram (84), both on NeetCode 150, and behind Sliding Window Maximum (239). Interviewers like it because it separates people who memorized a pattern from people who can explain why the pops are cheap.',

    cues: [
      'For **each** element you need the nearest element to its left or right that is bigger or smaller: “next warmer day”, “first taller person ahead”, “price drop”.',
      'A naive answer scans outward from every position, and the scans keep **re-reading the same elements**.',
      'You need how far a value **stretches** before something beats it: spans, largest rectangles, “this value is the minimum of how many subarrays”.',
      'You need the maximum or minimum of **every window** as it slides, and a counter or heap feels clumsy.',
      'Greedy removal where a later, better item should evict earlier, worse ones: “delete k digits to make the smallest number”.',
      'The stack or queue you would keep has a natural order, and anything that can **never be the answer again** can be thrown away.'
    ],

    intuition: [
      'Picture people queueing for a photo, each standing on a box as tall as their height. You walk down the line and, for each person, you want the first taller person **behind** them. Keep a short list of people who are still waiting for a taller one. When someone new arrives, every waiting person who is **shorter** has just found their answer: this newcomer. Cross them off. Then the newcomer joins the waiting list.',
      'Look at that waiting list. Anyone taller than the newcomer stays, anyone shorter was removed, so the list always runs from tall to short as you go toward the back. That ordering is the **monotonic** part. It is also why the work is cheap: the people you cross off are always at the **back** of the list, so a stack (push and pop at one end) is exactly the right shape. You never search; you only look at the top.',
      'The cost argument is the one to say out loud in an interview. The inner `while` loop looks like a nested loop, but an index is pushed once and popped at most once. Across the whole run there are at most n pushes and n pops, so the total is **O(n)**, not O(n²). We call this amortized cost.',
      'The template has three decisions, and every variant changes only these:\n\n1. **What goes on the stack.** Usually the **index** (you can read the value from it, and you can compute distances).\n2. **Which direction it is ordered.** Pop smaller values for “next greater”, pop larger values for “next smaller”.\n3. **What a pop means.** Often “the popped item has just found its answer”, and sometimes “the popped item’s rectangle has just ended”.',
      'The same idea works with a **deque** (a queue you can also pop from the back). In a sliding window you also need to drop items that fall off the **front** because they left the window. So you keep a deque of indices whose values decrease: the back is cleaned by newcomers, the front is cleaned by the window moving on, and the front is always the window’s maximum. One idea, one extra end.'
    ].join('\n\n'),

    viz: 'monotonic-stack',

    template: {
      title: 'Next greater value: pop everything the new value beats',
      note: 'To reuse it, change three things and keep the skeleton: **what you push** (here the index), **the comparison that decides a pop** (here `<`, which also keeps equal values on the stack), and **what a pop records** (here the new value; for Daily Temperatures it is the index distance). For “next smaller”, flip the comparison. To go right to left, loop backwards and read the answer from the top **before** pushing, as in the previous-smaller variation. Whatever remains on the stack at the end never found one.',
      code: {
        py: `def next_greater(nums):
    res = [-1] * len(nums)                       #> -1 means "nothing bigger to the right"
    stack = []                                   #> Indices still waiting; their values never increase going up
    for i, x in enumerate(nums):                 #@read > 1. Read the next value x
        while stack and nums[stack[-1]] < x:     #@check > 2. Does x beat the waiting index on top?
            res[stack.pop()] = x                 #@pop > 3. Yes: x is its next greater. Pop it and record x
        stack.append(i)                          #@push > 4. Nothing smaller is left on top, so x waits too
    return res                                   #@end > 5. Whatever is still waiting never found a bigger value`,
        js: `function nextGreater(nums) {
  const res = new Array(nums.length).fill(-1);   //> -1 means "nothing bigger to the right"
  const stack = [];                              //> Indices still waiting; their values never increase going up
  for (let i = 0; i < nums.length; i++) {        //@read > 1. Read the next value
    const x = nums[i];
    while (stack.length && nums[stack[stack.length - 1]] < x) {   //@check > 2. Does x beat the waiting index on top?
      res[stack.pop()] = x;                      //@pop > 3. Yes: x is its next greater. Pop it and record x
    }
    stack.push(i);                               //@push > 4. Nothing smaller is left on top, so x waits too
  }
  return res;                                    //@end > 5. Whatever is still waiting never found a bigger value
}`,
        java: `class Solution {
    public int[] nextGreater(int[] nums) {
        int[] res = new int[nums.length];
        Arrays.fill(res, -1);                                   //> -1 means "nothing bigger to the right"
        Deque<Integer> stack = new ArrayDeque<>();              //> Indices still waiting; their values never increase going up
        for (int i = 0; i < nums.length; i++) {                 //@read > 1. Read the next value
            int x = nums[i];
            while (!stack.isEmpty() && nums[stack.peek()] < x) {   //@check > 2. Does x beat the waiting index on top?
                res[stack.pop()] = x;                           //@pop > 3. Yes: x is its next greater. Pop it and record x
            }
            stack.push(i);                                      //@push > 4. Nothing smaller is left on top, so x waits too
        }
        return res;                                             //@end > 5. Whatever is still waiting never found a bigger value
    }
}`,
        cpp: `class Solution {
public:
    vector<int> nextGreater(vector<int>& nums) {
        vector<int> res(nums.size(), -1);                       //> -1 means "nothing bigger to the right"
        vector<int> st;                                         //> Indices still waiting; their values never increase going up
        for (int i = 0; i < (int)nums.size(); i++) {            //@read > 1. Read the next value
            int x = nums[i];
            while (!st.empty() && nums[st.back()] < x) {        //@check > 2. Does x beat the waiting index on top?
                res[st.back()] = x;                             //@pop > 3. Yes: x is its next greater. Pop it and record x
                st.pop_back();
            }
            st.push_back(i);                                    //@push > 4. Nothing smaller is left on top, so x waits too
        }
        return res;                                             //@end > 5. Whatever is still waiting never found a bigger value
    }
};`
      },
      tests: { fn: { py: 'next_greater', default: 'nextGreater' }, sig: { args: ['int[]'] }, cases: [
        { args: [[2, 1, 2, 4, 3]], out: [4, 2, 4, -1, -1] }, { args: [[]], out: [] }, { args: [[5, 4, 3]], out: [-1, -1, -1] }, { args: [[1, 2, 3]], out: [2, 3, -1] },
        { args: [[2, 2, 3]], out: [3, 3, -1] }, { args: [[1, 3, 2, 4]], out: [3, 4, 4, -1] }, { args: [[7]], out: [-1] }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      why: 'Every index is pushed once and popped at most once, so across the whole run there are at most n pushes and n pops. The `while` loop looks like it could cost O(n) per element, but its iterations are paid for by the pushes that came before: that is **amortized** O(1) per element, O(n) total. The stack holds up to n indices (a strictly decreasing input never pops), and the result array is another n, so O(n) space. In the sliding-window deque the deque holds at most k indices, so that version is O(n) time and O(k) extra space.',
      trap: 'Don’t count the inner loop as O(n) just because it is a `while` inside a `for`. Count total pops: each index leaves the stack at most once. The opposite trap is real too: if you **rescan** instead of popping (for example, walking down the stack without removing), you really have O(n²). And the output array is O(n) space, so “O(1) space” is not available for the standard problems.'
    },

    variations: [
      {
        name: 'Previous smaller: read the answer from the top before pushing',
        body: 'Sometimes you want the nearest smaller value to the **left**. Keep the stack **increasing**: pop everything greater than or equal to the new value, then whatever is left on top is the answer (or none if the stack is empty), and finally push the new value. Here the answer is read from the stack, not written to a popped item. This is the shape behind Online Stock Span (901), Final Prices With a Discount (1475, the next *smaller or equal* to the right), and the boundaries in the histogram problem. Pop on `>=` when you want the nearest **strictly** smaller value.',
        code: {
          py: `def previous_smaller(nums):
    stack, res = [], []
    for x in nums:
        while stack and stack[-1] >= x:
            stack.pop()                      #> Those can never be "the nearest smaller" for anything later
        res.append(stack[-1] if stack else -1)   #> What survives on top is the nearest smaller
        stack.append(x)
    return res`,
          js: `function previousSmaller(nums) {
  const stack = [], res = [];
  for (const x of nums) {
    while (stack.length && stack[stack.length - 1] >= x) stack.pop();   //> Those can never be "the nearest smaller" for anything later
    res.push(stack.length ? stack[stack.length - 1] : -1);               //> What survives on top is the nearest smaller
    stack.push(x);
  }
  return res;
}`
        },
        tests: { fn: { py: 'previous_smaller', default: 'previousSmaller' }, cases: [
          { args: [[3, 1, 2, 4]], out: [-1, -1, 1, 2] }, { args: [[]], out: [] }, { args: [[2, 2]], out: [-1, -1] }, { args: [[5, 4, 3]], out: [-1, -1, -1] }, { args: [[1, 2, 3]], out: [-1, 1, 2] }] }
      },
      {
        name: 'Circular array: walk it twice',
        body: 'If the array wraps (the next greater of the last element may be at the front), loop `i` from 0 to `2n - 1` and read `nums[i % n]`. Only **push** during the first lap (`i < n`), so no index goes on the stack twice, but keep popping during both laps. Anything still waiting after two laps is the overall maximum (or tied with it), and its answer is -1. That is Next Greater Element II (503). The cost is still O(n): at most n pushes and n pops.',
        code: {
          py: `def next_greater_circular(nums):
    n = len(nums)
    res, stack = [-1] * n, []
    for i in range(2 * n):
        x = nums[i % n]
        while stack and nums[stack[-1]] < x:
            res[stack.pop()] = x
        if i < n:
            stack.append(i)                  #> Push only on the first lap
    return res`,
          js: `function nextGreaterCircular(nums) {
  const n = nums.length, res = new Array(n).fill(-1), stack = [];
  for (let i = 0; i < 2 * n; i++) {
    const x = nums[i % n];
    while (stack.length && nums[stack[stack.length - 1]] < x) res[stack.pop()] = x;
    if (i < n) stack.push(i);                //> Push only on the first lap
  }
  return res;
}`
        },
        tests: { fn: { py: 'next_greater_circular', default: 'nextGreaterCircular' }, cases: [
          { args: [[1, 2, 1]], out: [2, -1, 2] }, { args: [[1, 2, 3, 4, 3]], out: [2, 3, 4, -1, 4] }, { args: [[5]], out: [-1] }, { args: [[2, 2]], out: [-1, -1] }, { args: [[]], out: [] }] }
      },
      {
        name: 'Monotonic deque: window maximum and minimum',
        body: 'When the question is about a **window**, an item can also become useless because it **left** the window, not only because a newer value beats it. So use a deque of indices. Push at the back after popping every back value that is not better (newcomers evict weaker items); pop from the front when its index is outside the window. For a window maximum the values decrease from front to back, and the front is the answer (worked below, 239). Keep a second deque with the opposite order and you also have the window minimum, which is exactly Longest Subarray With Limited Difference (1438).',
      },
      {
        name: 'Greedy: remove digits to make the smallest number',
        body: 'The stack also builds an **answer**, not just a lookup table. In Remove K Digits (402), a digit that is larger than the digit after it is a digit worth deleting, because dropping it makes the number smaller sooner. Walk the digits keeping an increasing stack; while the next digit is smaller than the top and removals remain, pop. If removals are left over at the end, trim them from the **back**, then strip leading zeros (an empty result is `"0"`). The popping order is the same template with a different meaning for “pop”.'
      },
      {
        name: 'Contribution counting: how many subarrays is this the minimum of?',
        body: 'Sum of Subarray Minimums (907) asks for a total over **all** subarrays. Instead of enumerating them, ask per element: in how many subarrays is it the minimum? If `left` is the distance to the previous smaller value and `right` the distance to the next smaller-or-equal value, the element is the minimum of `left × right` subarrays, so it adds `value × left × right`. Both distances come from one monotonic stack. The tie rule (strict on one side, non-strict on the other) is what stops equal values being counted twice. This idea, “each element’s reach”, is the same one behind the histogram problem.'
      }
    ],

    worked: [
      {
        lc: 739,
        restate: 'You get a list of daily temperatures. For each day, report how many days you have to wait until a **warmer** day. If no later day is warmer, report 0.',
        examples: '- `[73,74,75,71,69,72,76,73]` → `[1,1,4,2,1,1,0,0]`: day 0 (73) waits one day for 74; day 2 (75) waits four days, until 76.\n- `[30,40,50,60]` → `[1,1,1,0]`.\n- `[60,50,40]` → `[0,0,0]`: it only ever cools.\n- Edge cases: equal temperatures do **not** count as warmer (`[70,70]` → `[0,0]`); a single day → `[0]`.',
        brute: 'For every day, scan forward until you find a warmer one. A long cooling stretch followed by one hot day makes almost every scan run to the end: O(n²). Many of those scans re-read the same days.',
        insight: 'Treat the days that are **still waiting** for a warmer day as a stack. A new day that is warmer than the top answers it: the wait is `today - that index`. Pop and keep checking, because one hot day can answer many cooler days at once. The waiting days are always in non-increasing temperature order from bottom to top, because anything cooler than the newcomer was just popped. Store **indices**, since the answer is a distance.',
        code: {
          py: `class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        res = [0] * len(temperatures)
        stack = []                                   # indices of days still waiting for a warmer one
        for i, t in enumerate(temperatures):
            while stack and temperatures[stack[-1]] < t:
                j = stack.pop()
                res[j] = i - j                       # days waited
            stack.append(i)
        return res`,
          js: `function dailyTemperatures(temperatures) {
  const res = new Array(temperatures.length).fill(0);
  const stack = [];                                  // indices of days still waiting for a warmer one
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
      const j = stack.pop();
      res[j] = i - j;                                // days waited
    }
    stack.push(i);
  }
  return res;
}`,
          java: `class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] res = new int[temperatures.length];
        Deque<Integer> stack = new ArrayDeque<>();   // indices of days still waiting for a warmer one
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int j = stack.pop();
                res[j] = i - j;                      // days waited
            }
            stack.push(i);
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        vector<int> res(temperatures.size(), 0);
        vector<int> st;                              // indices of days still waiting for a warmer one
        for (int i = 0; i < (int)temperatures.size(); i++) {
            while (!st.empty() && temperatures[st.back()] < temperatures[i]) {
                int j = st.back(); st.pop_back();
                res[j] = i - j;                      // days waited
            }
            st.push_back(i);
        }
        return res;
    }
};`
        },
        complexity: 'O(n) time: each day is pushed once and popped at most once. O(n) space for the stack and the result.',
        say: '“For each day I need the next day that is warmer, so I keep a stack of days still waiting, with their temperatures never increasing toward the top. When today is warmer than the top, I pop it and its wait is today’s index minus its index, and I repeat, because one warm day can settle many days. Then I push today. Every index goes in once and out at most once, so it is O(n) time and O(n) space. Days left on the stack get 0, which is the array’s default.”',
        followups: [
          { q: 'Why store indices and not temperatures?', a: 'The answer is a **distance**, so you need the position. You can always read the temperature from the index, but not the other way around.' },
          { q: 'Why `<` and not `<=`?', a: 'A day with the **same** temperature is not warmer, so it must not pop the top. Using `<=` would give wrong waits on ties.' },
          { q: 'Can you do it without a stack?', a: 'Yes, by scanning right to left and jumping with the answers already found: from day `i`, follow `i + res[i]` hops instead of stepping one day at a time. It is also O(n), and it uses only the result array, but it is harder to explain and to adapt, so lead with the stack.' },
          { q: 'What changes for “next colder day”?', a: 'Flip the comparison: pop while the top is **greater** than today.' }
        ]
      },
      {
        lc: 84,
        restate: 'You get the heights of bars in a histogram, each one unit wide and side by side. Return the area of the largest rectangle that fits entirely inside the bars.',
        examples: '- `[2,1,5,6,2,3]` → 10: the bars of height 5 and 6 give a 5 × 2 rectangle.\n- `[2,4]` → 4.\n- `[2,2,2]` → 6: equal bars join into one wide rectangle.\n- Edge cases: a single bar; all zero heights; a strictly increasing or strictly decreasing list; equal neighbours.',
        brute: 'For every pair of bars `(i, j)`, take the minimum height between them times the width: O(n²) with a running minimum (O(n³) if you recompute it). Another version expands left and right from every bar until a shorter bar blocks it, which is also O(n²).',
        insight: 'The best rectangle has some bar as its **limiting height**. For that bar, the rectangle stretches left until a **shorter** bar and right until a shorter bar. So the whole problem is “find, for every bar, the nearest shorter bar on each side”, and that is a monotonic stack. Keep an **increasing** stack of indices. When a bar `h` arrives that is not taller than the top, the top bar’s right boundary has just been found (this index) and its left boundary is the next item **down** the stack. Pop it, compute `height × (i - left - 1)`, and repeat. A final bar of height 0 flushes everything.',
        code: {
          py: `class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = []                                   # indices with increasing heights
        best = 0
        for i in range(len(heights) + 1):
            h = heights[i] if i < len(heights) else 0   # a final bar of height 0 flushes the stack
            while stack and heights[stack[-1]] >= h:
                height = heights[stack.pop()]
                left = stack[-1] if stack else -1       # the nearest shorter bar on the left
                best = max(best, height * (i - left - 1))
            stack.append(i)
        return best`,
          js: `function largestRectangleArea(heights) {
  const stack = [];                                  // indices with increasing heights
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i < heights.length ? heights[i] : 0;   // a final bar of height 0 flushes the stack
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      const left = stack.length ? stack[stack.length - 1] : -1;   // the nearest shorter bar on the left
      best = Math.max(best, height * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}`,
          java: `class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();   // indices with increasing heights
        int best = 0, n = heights.length;
        for (int i = 0; i <= n; i++) {
            int h = i < n ? heights[i] : 0;          // a final bar of height 0 flushes the stack
            while (!stack.isEmpty() && heights[stack.peek()] >= h) {
                int height = heights[stack.pop()];
                int left = stack.isEmpty() ? -1 : stack.peek();   // the nearest shorter bar on the left
                best = Math.max(best, height * (i - left - 1));
            }
            stack.push(i);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        vector<int> st;                              // indices with increasing heights
        int best = 0, n = heights.size();
        for (int i = 0; i <= n; i++) {
            int h = i < n ? heights[i] : 0;          // a final bar of height 0 flushes the stack
            while (!st.empty() && heights[st.back()] >= h) {
                int height = heights[st.back()]; st.pop_back();
                int left = st.empty() ? -1 : st.back();   // the nearest shorter bar on the left
                best = max(best, height * (i - left - 1));
            }
            st.push_back(i);
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time: every bar is pushed once and popped once. O(n) space for the stack.',
        say: '“The tallest rectangle is limited by some bar’s height, and it extends until a shorter bar on each side. So I need the nearest shorter bar on both sides of every bar. I keep a stack of indices with increasing heights. When a bar arrives that is not taller than the top, the top’s right edge is this index, and its left edge is the new top after popping. The width is right minus left minus one, and I update the best area. I add a final bar of height 0 so everything flushes. Each bar is pushed and popped once: O(n).”',
        followups: [
          { q: 'Why does the width use the new top and not the popped bar’s own index?', a: 'The stack holds only bars that were **not** shorter than what is above them. The bars between the new top and the popped bar were popped earlier because they were at least as tall, so the rectangle can stretch over them. The left edge is therefore the new top.' },
          { q: 'What do you do with equal heights?', a: 'Popping on `>=` is fine. The first of two equal bars is popped with a short width, but the second one is popped later with the full width, so the best area is still found. Popping on `>` also works.' },
          { q: 'How does this solve Maximal Rectangle (85)?', a: 'Build a histogram row by row (heights = consecutive ones above, including this row) and run this function on every row. O(rows × cols).' },
          { q: 'Why add a sentinel bar?', a: 'Without it, bars still on the stack at the end never get their area computed. A height-0 bar pops them all, and it does not change the answer.' }
        ]
      },
      {
        lc: 496,
        restate: 'You get two lists of **distinct** numbers, `nums1` and `nums2`, where every value of `nums1` also appears in `nums2`. For each value in `nums1`, find its position in `nums2` and report the first larger value to the right of it there, or -1 if there is none.',
        examples: '- `nums1 = [4,1,2]`, `nums2 = [1,3,4,2]` → `[-1,3,-1]`: nothing is greater than 4 to its right, 1 is followed by 3, and 2 is last.\n- `nums1 = [2,4]`, `nums2 = [1,2,3,4]` → `[3,-1]`.\n- Edge cases: a single element; a value at the very end of `nums2`.',
        brute: 'For each value in `nums1`, find it in `nums2` and scan right until something larger shows up: O(n × m). Looking the value up with a loop each time is the slow part.',
        insight: 'The question about `nums1` is really a question about `nums2`. Compute the next greater value of **every** element of `nums2` once, with the template stack, and store it in a hash map from value to answer. Since the values are distinct, the value is a safe key. Then each `nums1` value is a map lookup.',
        code: {
          py: `class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        nxt = {}                                     # value in nums2 -> its next greater value
        stack = []                                   # values still waiting; non-increasing toward the top
        for x in nums2:
            while stack and stack[-1] < x:
                nxt[stack.pop()] = x
            stack.append(x)
        return [nxt.get(x, -1) for x in nums1]       # leftovers never found one: -1`,
          js: `function nextGreaterElement(nums1, nums2) {
  const nxt = new Map();                             // value in nums2 -> its next greater value
  const stack = [];                                  // values still waiting; non-increasing toward the top
  for (const x of nums2) {
    while (stack.length && stack[stack.length - 1] < x) nxt.set(stack.pop(), x);
    stack.push(x);
  }
  return nums1.map((x) => (nxt.has(x) ? nxt.get(x) : -1));   // leftovers never found one: -1
}`,
          java: `class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nxt = new HashMap<>();   // value in nums2 -> its next greater value
        Deque<Integer> stack = new ArrayDeque<>();     // values still waiting; non-increasing toward the top
        for (int x : nums2) {
            while (!stack.isEmpty() && stack.peek() < x) nxt.put(stack.pop(), x);
            stack.push(x);
        }
        int[] res = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) res[i] = nxt.getOrDefault(nums1[i], -1);   // leftovers never found one: -1
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nxt;                 // value in nums2 -> its next greater value
        vector<int> st;                              // values still waiting; non-increasing toward the top
        for (int x : nums2) {
            while (!st.empty() && st.back() < x) { nxt[st.back()] = x; st.pop_back(); }
            st.push_back(x);
        }
        vector<int> res;
        for (int x : nums1) res.push_back(nxt.count(x) ? nxt[x] : -1);   // leftovers never found one: -1
        return res;
    }
};`
        },
        complexity: 'O(n + m) time: one stack pass over `nums2` (n elements) plus one lookup per `nums1` value (m). O(n) space for the map and the stack.',
        say: '“The answers only depend on `nums2`, so I solve the problem for every element of `nums2` at once with a monotonic stack: for each new value, pop every smaller waiting value and record this value as its next greater in a hash map. Values are distinct, so the value itself is a safe key. Then I answer each `nums1` entry with a lookup, defaulting to -1. O(n + m).”',
        followups: [
          { q: 'What if the values in `nums2` could repeat?', a: 'Then value-keyed storage breaks. Store results by **index** in `nums2`, and map each `nums1` query to the right position (for repeated queries you would need to say which occurrence is meant).' },
          { q: 'Is the hash map needed?', a: 'It is the simplest link between the two lists. You could instead store `nums1` positions in a map from value to index and write answers directly into the result as pops happen. Same O(n + m).' },
          { q: 'What changes for a circular `nums2`?', a: 'Walk it twice, pushing only on the first lap. That is Next Greater Element II (503), covered in the variations.' }
        ]
      },
      {
        lc: 239,
        restate: 'A window of size `k` slides across an array from the left edge to the right edge, one position at a time. Return the maximum value inside the window at every position.',
        examples: '- `nums = [1,3,-1,-3,5,3,6,7]`, `k = 3` → `[3,3,5,5,6,7]`.\n- `nums = [1]`, `k = 1` → `[1]`.\n- `nums = [9,8,7]`, `k = 2` → `[9,8]`.\n- Edge cases: `k = 1` (every element is its own max); `k = n` (one window); negative values; equal values.',
        brute: 'Take `max` over every window: O(n × k). A max-heap with lazy deletion gets O(n log n): push `(value, index)` and discard heap tops whose index has left the window. Both work, and the deque beats them.',
        insight: 'A value that is **smaller than a newcomer and to its left** can never be the window’s maximum again: the newcomer is bigger and will outlive it in the window. So throw it away. Keep a deque of indices whose values **decrease** from front to back. The front is the current maximum. Each step: pop smaller values off the **back**, push the new index, pop the front if its index has slid out of the window, and record `nums[front]` once the first window is complete.',
        code: {
          py: `class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq = deque()                                 # indices; values decrease from front to back
        res = []
        for i, x in enumerate(nums):
            while dq and nums[dq[-1]] <= x:
                dq.pop()                             # a smaller value left of x can never be the max again
            dq.append(i)
            if dq[0] <= i - k:
                dq.popleft()                         # the front slid out of the window
            if i >= k - 1:
                res.append(nums[dq[0]])              # the front is the window's max
        return res`,
          js: `function maxSlidingWindow(nums, k) {
  const dq = [];                                     // indices; values decrease from front to back
  let head = 0;                                      // the front of the deque (avoids slow shift())
  const res = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();   // a smaller value left of x can never be the max again
    dq.push(i);
    if (dq[head] <= i - k) head++;                   // the front slid out of the window
    if (i >= k - 1) res.push(nums[dq[head]]);        // the front is the window's max
  }
  return res;
}`,
          java: `class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] res = new int[n - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();      // indices; values decrease from front to back
        for (int i = 0; i < n; i++) {
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();   // a smaller value left of x can never be the max again
            dq.offerLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();   // the front slid out of the window
            if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];   // the front is the window's max
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> res;
        deque<int> dq;                               // indices; values decrease from front to back
        for (int i = 0; i < n; i++) {
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();   // a smaller value left of x can never be the max again
            dq.push_back(i);
            if (dq.front() <= i - k) dq.pop_front();   // the front slid out of the window
            if (i >= k - 1) res.push_back(nums[dq.front()]);   // the front is the window's max
        }
        return res;
    }
};`
        },
        complexity: 'O(n) time: each index enters the deque once and leaves once, from either end. O(k) extra space for the deque, plus the output.',
        say: '“Within a window, a value that is smaller than a later value can never be the maximum again, because the later one stays in the window longer. So I keep a deque of indices with decreasing values. For each new element I pop smaller values off the back, push the new index, and pop the front if it has left the window. The front is always the maximum, and I record it once the window is full. Each index is added once and removed once, so O(n) time and O(k) space.”',
        followups: [
          { q: 'Why store indices and not values?', a: 'You need the index to know when the front **expires**. The value you can look up from the index.' },
          { q: 'Why pop on `<=` and not `<`?', a: 'For equal values, the newer one lasts longer in the window, so the older equal one is useless. Either works for correctness; `<=` keeps the deque shorter.' },
          { q: 'How would you get both the window max and min?', a: 'Run two deques with opposite orders, as in Longest Subarray With Limited Difference (1438).' },
          { q: 'Why is a heap worse here?', a: 'A heap gives O(n log n) and needs lazy deletion of expired entries. The deque gets O(n) because each value is touched a constant number of times.' }
        ]
      }
    ],

    practice: [
      { lc: 739,
        hints: ['A naive scan for each day repeats work. Which days are still waiting for a warmer day?', 'Keep a stack of indices of days that have not found a warmer day. When today is warmer than the top, pop it.', 'The answer for a popped day is `today - that index`. Days left on the stack keep the default 0.'],
        starter: { py: 'class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        ', js: 'function dailyTemperatures(temperatures) {\n  \n}' },
        tests: { fn: 'dailyTemperatures', sig: { args: ['int[]'] }, cases: [
          { args: [[73, 74, 75, 71, 69, 72, 76, 73]], out: [1, 1, 4, 2, 1, 1, 0, 0] }, { args: [[30, 40, 50, 60]], out: [1, 1, 1, 0] }, { args: [[30, 60, 90]], out: [1, 1, 0] },
          { args: [[50]], out: [0] }, { args: [[60, 50, 40]], out: [0, 0, 0] }, { args: [[70, 70, 70]], out: [0, 0, 0] }] } },

      { lc: 496,
        hints: ['Solve the problem for every element of `nums2` first, then answer `nums1` from the results.', 'Use a stack of values over `nums2`. When a value is larger than the top, pop the top and store “top → this value” in a map.', 'Answer each value of `nums1` with the map, using -1 when it is missing.'],
        starter: { py: 'class Solution:\n    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:\n        ', js: 'function nextGreaterElement(nums1, nums2) {\n  \n}' },
        tests: { fn: 'nextGreaterElement', sig: { args: ['int[]', 'int[]'] }, cases: [
          { args: [[4, 1, 2], [1, 3, 4, 2]], out: [-1, 3, -1] }, { args: [[2, 4], [1, 2, 3, 4]], out: [3, -1] }, { args: [[1], [1]], out: [-1] }, { args: [[3, 1], [3, 2, 1, 4]], out: [4, 4] }] } },

      { lc: 503,
        hints: ['If the array wraps around, the next greater element of a late index may sit at the front.', 'Loop `i` from 0 to `2n - 1` and read `nums[i % n]`.', 'Pop and answer during both laps, but push indices only while `i < n`.'],
        solution: { explain: 'Walking twice simulates the wrap-around. Only the first lap pushes, so each index is on the stack at most once. O(n) time and space.', code: {
          py: `class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        n = len(nums)
        res, stack = [-1] * n, []
        for i in range(2 * n):
            x = nums[i % n]
            while stack and nums[stack[-1]] < x:
                res[stack.pop()] = x
            if i < n:
                stack.append(i)
        return res`,
          js: `function nextGreaterElements(nums) {
  const n = nums.length, res = new Array(n).fill(-1), stack = [];
  for (let i = 0; i < 2 * n; i++) {
    const x = nums[i % n];
    while (stack.length && nums[stack[stack.length - 1]] < x) res[stack.pop()] = x;
    if (i < n) stack.push(i);
  }
  return res;
}` } },
        starter: { py: 'class Solution:\n    def nextGreaterElements(self, nums: List[int]) -> List[int]:\n        ', js: 'function nextGreaterElements(nums) {\n  \n}' },
        tests: { fn: 'nextGreaterElements', cases: [
          { args: [[1, 2, 1]], out: [2, -1, 2] }, { args: [[1, 2, 3, 4, 3]], out: [2, 3, 4, -1, 4] }, { args: [[5]], out: [-1] }, { args: [[3, 3]], out: [-1, -1] }, { args: [[5, 4, 3, 2, 1]], out: [-1, 5, 5, 5, 5] }] } },

      { lc: 1475,
        hints: ['Each item’s discount is the first price to its right that is less than or equal to it.', 'That is “next smaller or equal”: keep a stack of indices whose prices are waiting for a discount.', 'When the current price is at most the top’s price, pop the top and subtract the current price from it.'],
        solution: { explain: 'The mirror of next greater: pop while the top is greater than or equal to the current price, and apply the discount at the pop. O(n) time and space.', code: {
          py: `class Solution:
    def finalPrices(self, prices: List[int]) -> List[int]:
        res = prices[:]
        stack = []                       # indices still waiting for a discount
        for i, p in enumerate(prices):
            while stack and prices[stack[-1]] >= p:
                res[stack.pop()] -= p
            stack.append(i)
        return res`,
          js: `function finalPrices(prices) {
  const res = prices.slice(), stack = [];   // stack: indices still waiting for a discount
  for (let i = 0; i < prices.length; i++) {
    while (stack.length && prices[stack[stack.length - 1]] >= prices[i]) res[stack.pop()] -= prices[i];
    stack.push(i);
  }
  return res;
}` } },
        starter: { py: 'class Solution:\n    def finalPrices(self, prices: List[int]) -> List[int]:\n        ', js: 'function finalPrices(prices) {\n  \n}' },
        tests: { fn: 'finalPrices', cases: [
          { args: [[8, 4, 6, 2, 3]], out: [4, 2, 4, 2, 3] }, { args: [[1, 2, 3, 4, 5]], out: [1, 2, 3, 4, 5] }, { args: [[10, 1, 1, 6]], out: [9, 0, 1, 6] }, { args: [[5]], out: [5] }] } },

      { lc: 901,
        hints: ['The span is how far back you can go while prices are at most today’s, so past days with smaller prices can be merged.', 'Keep a stack of `(price, span)` pairs with prices decreasing from bottom to top.', 'For a new price, start with span 1, pop every pair with price at most today’s while adding its span, then push `(price, span)`.'],
        solution: { explain: 'Each stack entry summarizes a run of days that a later, higher price will swallow whole. Popping them adds their spans together. Amortized O(1) per call.', code: {
          py: `class StockSpanner:
    def __init__(self):
        self.stack = []                  # (price, span), prices strictly decreasing going up

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]  # absorb the days that this price covers
        self.stack.append((price, span))
        return span`,
          js: `class StockSpanner {
  constructor() {
    this.stack = [];                     // [price, span], prices strictly decreasing going up
  }
  next(price) {
    let span = 1;
    while (this.stack.length && this.stack[this.stack.length - 1][0] <= price) {
      span += this.stack.pop()[1];       // absorb the days that this price covers
    }
    this.stack.push([price, span]);
    return span;
  }
}` } },
        starter: { py: 'class StockSpanner:\n    def __init__(self):\n        pass\n\n    def next(self, price: int) -> int:\n        pass', js: 'class StockSpanner {\n  constructor() {\n  }\n  next(price) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [100], [80], [60], [70], [60], [75], [85]], out: [null, 1, 1, 1, 2, 1, 4, 6] },
          { ops: ['StockSpanner', 'next', 'next', 'next'], args: [[], [5], [5], [5]], out: [null, 1, 2, 3] },
          { ops: ['StockSpanner', 'next', 'next', 'next'], args: [[], [3], [2], [1]], out: [null, 1, 1, 1] }] } },

      { lc: 402,
        hints: ['Deleting a digit that is larger than its right neighbour makes the number smaller. Deleting a digit before a larger one does not help as much.', 'Walk the digits with a stack. While you still have removals, and the top is larger than the new digit, pop.', 'If removals remain at the end, drop digits from the back. Then strip leading zeros, and return `"0"` if nothing is left.'],
        solution: { explain: 'An increasing stack of digits is the lexicographically smallest prefix so far. Pop larger digits while removals remain, trim leftover removals from the end, and strip leading zeros. O(n) time and space.', code: {
          py: `class Solution:
    def removeKdigits(self, num: str, k: int) -> str:
        stack = []
        for d in num:
            while k and stack and stack[-1] > d:
                stack.pop()
                k -= 1
            stack.append(d)
        if k:
            stack = stack[:-k]           # still owe removals: drop the biggest tail digits
        return ''.join(stack).lstrip('0') or '0'`,
          js: `function removeKdigits(num, k) {
  const stack = [];
  for (const d of num) {
    while (k && stack.length && stack[stack.length - 1] > d) { stack.pop(); k--; }
    stack.push(d);
  }
  if (k) stack.length -= k;              // still owe removals: drop the biggest tail digits
  return stack.join('').replace(/^0+/, '') || '0';
}` } },
        starter: { py: 'class Solution:\n    def removeKdigits(self, num: str, k: int) -> str:\n        ', js: 'function removeKdigits(num, k) {\n  \n}' },
        tests: { fn: 'removeKdigits', sig: { args: ['str', 'int'] }, cases: [
          { args: ['1432219', 3], out: '1219' }, { args: ['10200', 1], out: '200' }, { args: ['10', 2], out: '0' }, { args: ['112', 1], out: '11' }, { args: ['9', 1], out: '0' }, { args: ['12345', 2], out: '123' }] } },

      { lc: 456,
        hints: ['You need `nums[i] < nums[k] < nums[j]` with `i < j < k`. Think of `nums[k]` as the “2” and `nums[j]` as the “3”.', 'Scan from the **right** with a decreasing stack. When a value pops smaller ones, the last popped one is the best candidate for the “2”: it has a larger value to its left.', 'Keep the largest popped value as `third`. If any value to the left is below `third`, you found a 132 pattern.'],
        solution: { explain: 'From the right, the stack holds candidates for the “3” and the largest popped value is the best “2”: it is smaller than a number that appeared to its left (the one that popped it). Any earlier value below it completes the pattern. O(n) time and space.', code: {
          py: `class Solution:
    def find132pattern(self, nums: List[int]) -> bool:
        third = float('-inf')            # the best "2": it has a bigger "3" to its left
        stack = []
        for x in reversed(nums):
            if x < third:
                return True              # x is the "1", smaller than the "2"
            while stack and stack[-1] < x:
                third = stack.pop()
            stack.append(x)
        return False`,
          js: `function find132pattern(nums) {
  let third = -Infinity;                 // the best "2": it has a bigger "3" to its left
  const stack = [];
  for (let i = nums.length - 1; i >= 0; i--) {
    const x = nums[i];
    if (x < third) return true;          // x is the "1", smaller than the "2"
    while (stack.length && stack[stack.length - 1] < x) third = stack.pop();
    stack.push(x);
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def find132pattern(self, nums: List[int]) -> bool:\n        ', js: 'function find132pattern(nums) {\n  \n}' },
        tests: { fn: 'find132pattern', cases: [
          { args: [[1, 2, 3, 4]], out: false }, { args: [[3, 1, 4, 2]], out: true }, { args: [[-1, 3, 2, 0]], out: true }, { args: [[1, 0, 1, -4, -3]], out: false }, { args: [[1, 2]], out: false }] } },

      { lc: 907,
        hints: ['Count, for each element, in how many subarrays it is the minimum, instead of listing the subarrays.', 'If `left` is the distance back to the previous smaller value and `right` the distance forward to the next smaller-or-equal value, the element is the minimum of `left × right` subarrays.', 'A single increasing stack gives both distances at once: when an element pops, its right boundary is the current index and its left boundary is the new top. Use `>=` to pop so ties are counted once. Take the total modulo 1,000,000,007.'],
        solution: { explain: 'When an index pops, the stack below it is strictly smaller (the left boundary) and the current index is smaller or equal (the right boundary), so it is the minimum of `(mid - left) × (i - mid)` subarrays. A sentinel -1 flushes the stack. O(n) time and space.', code: {
          py: `class Solution:
    def sumSubarrayMins(self, arr: List[int]) -> int:
        MOD = 10**9 + 7
        stack, total = [], 0             # stack: indices with increasing values
        for i in range(len(arr) + 1):
            cur = arr[i] if i < len(arr) else -1    # -1 pops everything at the end
            while stack and arr[stack[-1]] >= cur:
                mid = stack.pop()
                left = stack[-1] if stack else -1
                total += arr[mid] * (mid - left) * (i - mid)
            stack.append(i)
        return total % MOD`,
          js: `function sumSubarrayMins(arr) {
  const MOD = 1000000007, stack = [];    // stack: indices with increasing values
  let total = 0;
  for (let i = 0; i <= arr.length; i++) {
    const cur = i < arr.length ? arr[i] : -1;    // -1 pops everything at the end
    while (stack.length && arr[stack[stack.length - 1]] >= cur) {
      const mid = stack.pop();
      const left = stack.length ? stack[stack.length - 1] : -1;
      total = (total + arr[mid] * (mid - left) * (i - mid)) % MOD;
    }
    stack.push(i);
  }
  return total;
}` } },
        starter: { py: 'class Solution:\n    def sumSubarrayMins(self, arr: List[int]) -> int:\n        ', js: 'function sumSubarrayMins(arr) {\n  \n}' },
        tests: { fn: 'sumSubarrayMins', cases: [
          { args: [[3, 1, 2, 4]], out: 17 }, { args: [[11, 81, 94, 43, 3]], out: 444 }, { args: [[1]], out: 1 }, { args: [[2, 2]], out: 6 }] } },

      { lc: 1438,
        hints: ['A window is valid when its largest and smallest values differ by at most `limit`. Shrinking a valid window keeps it valid.', 'Use a sliding window and keep **two** deques of indices, one with decreasing values (the max at the front) and one with increasing values (the min at the front).', 'While `max - min > limit`, advance `left` and pop any deque front whose index is now outside the window.'],
        solution: { explain: 'A variable-size window whose max and min come from two monotonic deques. Each index enters and leaves each deque once, so O(n) time and O(n) space.', code: {
          py: `class Solution:
    def longestSubarray(self, nums: List[int], limit: int) -> int:
        mx, mn = deque(), deque()        # indices: values decrease in mx, increase in mn
        left = best = 0
        for r, x in enumerate(nums):
            while mx and nums[mx[-1]] <= x:
                mx.pop()
            mx.append(r)
            while mn and nums[mn[-1]] >= x:
                mn.pop()
            mn.append(r)
            while nums[mx[0]] - nums[mn[0]] > limit:
                left += 1                # shrink until the window is valid again
                if mx[0] < left:
                    mx.popleft()
                if mn[0] < left:
                    mn.popleft()
            best = max(best, r - left + 1)
        return best`,
          js: `function longestSubarray(nums, limit) {
  const mx = [], mn = [];                // indices: values decrease in mx, increase in mn
  let hx = 0, hn = 0, left = 0, best = 0;   // hx, hn: the front of each deque
  for (let r = 0; r < nums.length; r++) {
    const x = nums[r];
    while (mx.length > hx && nums[mx[mx.length - 1]] <= x) mx.pop();
    mx.push(r);
    while (mn.length > hn && nums[mn[mn.length - 1]] >= x) mn.pop();
    mn.push(r);
    while (nums[mx[hx]] - nums[mn[hn]] > limit) {
      left++;                            // shrink until the window is valid again
      if (mx[hx] < left) hx++;
      if (mn[hn] < left) hn++;
    }
    best = Math.max(best, r - left + 1);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def longestSubarray(self, nums: List[int], limit: int) -> int:\n        ', js: 'function longestSubarray(nums, limit) {\n  \n}' },
        tests: { fn: 'longestSubarray', cases: [
          { args: [[8, 2, 4, 7], 4], out: 2 }, { args: [[10, 1, 2, 4, 7, 2], 5], out: 4 }, { args: [[4, 2, 2, 2, 4, 4, 2, 2], 0], out: 3 }, { args: [[1], 0], out: 1 }] } },

      { lc: 84,
        hints: ['The best rectangle is limited by some bar: it extends left and right until a shorter bar.', 'Keep an increasing stack of indices. When a bar is not taller than the top, pop the top: its right edge is the current index.', 'After popping, the new top is the left edge, so the width is `i - top - 1` (use -1 if the stack is empty). Add a final bar of height 0 to flush the stack.'],
        starter: { py: 'class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        ', js: 'function largestRectangleArea(heights) {\n  \n}' },
        tests: { fn: 'largestRectangleArea', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 1, 5, 6, 2, 3]], out: 10 }, { args: [[2, 4]], out: 4 }, { args: [[1]], out: 1 }, { args: [[2, 2, 2]], out: 6 }, { args: [[6, 5, 4, 3]], out: 12 }, { args: [[0, 0]], out: 0 }, { args: [[1, 2, 3, 4, 5]], out: 9 }] } },

      { lc: 239,
        hints: ['A value that is smaller than a newer value to its right can never be the window maximum again.', 'Keep a deque of indices whose values decrease from front to back. Before pushing index `i`, pop from the back while the back value is at most `nums[i]`.', 'Pop the front if its index is `i - k` or less. Once `i >= k - 1`, record `nums[front]`.'],
        starter: { py: 'class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ', js: 'function maxSlidingWindow(nums, k) {\n  \n}' },
        tests: { fn: 'maxSlidingWindow', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], out: [3, 3, 5, 5, 6, 7] }, { args: [[1], 1], out: [1] }, { args: [[9, 8, 7], 2], out: [9, 8] }, { args: [[1, 2, 3], 3], out: [3] },
          { args: [[4, 2, 12, 3], 1], out: [4, 2, 12, 3] }, { args: [[7, 2, 4], 2], out: [7, 4] }] } },

      { lc: 85,
        hints: ['Turn each row into a histogram: the height of a column is the number of consecutive 1s ending at this row.', 'A rectangle of 1s ending at a row is a rectangle inside that row’s histogram, so the answer is the best over all rows.', 'For each row, update the heights (add one for `"1"`, reset to 0 for `"0"`) and run the largest-rectangle-in-a-histogram stack.'],
        solution: { explain: 'Build heights row by row and run the histogram stack on each row. O(rows × cols) time, O(cols) space.', code: {
          py: `class Solution:
    def maximalRectangle(self, matrix: List[List[str]]) -> int:
        def largest(heights):
            stack, best = [], 0
            for i in range(len(heights) + 1):
                h = heights[i] if i < len(heights) else 0
                while stack and heights[stack[-1]] >= h:
                    height = heights[stack.pop()]
                    left = stack[-1] if stack else -1
                    best = max(best, height * (i - left - 1))
                stack.append(i)
            return best

        if not matrix:
            return 0
        heights = [0] * len(matrix[0])
        best = 0
        for row in matrix:
            for j, c in enumerate(row):
                heights[j] = heights[j] + 1 if c == '1' else 0
            best = max(best, largest(heights))
        return best`,
          js: `function maximalRectangle(matrix) {
  const largest = (heights) => {
    const stack = [];
    let best = 0;
    for (let i = 0; i <= heights.length; i++) {
      const h = i < heights.length ? heights[i] : 0;
      while (stack.length && heights[stack[stack.length - 1]] >= h) {
        const height = heights[stack.pop()];
        const left = stack.length ? stack[stack.length - 1] : -1;
        best = Math.max(best, height * (i - left - 1));
      }
      stack.push(i);
    }
    return best;
  };
  if (!matrix.length) return 0;
  const heights = new Array(matrix[0].length).fill(0);
  let best = 0;
  for (const row of matrix) {
    row.forEach((c, j) => { heights[j] = c === '1' ? heights[j] + 1 : 0; });
    best = Math.max(best, largest(heights));
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maximalRectangle(self, matrix: List[List[str]]) -> int:\n        ', js: 'function maximalRectangle(matrix) {\n  \n}' },
        tests: { fn: 'maximalRectangle', cases: [
          { args: [[['1', '0', '1', '0', '0'], ['1', '0', '1', '1', '1'], ['1', '1', '1', '1', '1'], ['1', '0', '0', '1', '0']]], out: 6 }, { args: [[['0']]], out: 0 }, { args: [[['1']]], out: 1 }, { args: [[['1', '1'], ['1', '1']]], out: 4 }] } },

      { lc: 862,
        hints: ['Negative numbers break an ordinary window, so work with prefix sums: a subarray `(j, i]` has sum `prefix[i] - prefix[j]`.', 'Keep a deque of prefix indices with increasing prefix values. A new prefix that is no larger than the back makes the back useless: pop it.', 'While `prefix[i] - prefix[front] >= k`, record `i - front` and pop the front (a later `i` would only make it longer).'],
        solution: { explain: 'Prefix sums turn it into “the closest earlier index with a small enough prefix”. The deque keeps candidate starts in increasing prefix order: a bigger-or-equal earlier prefix is never a better start, and a start that already worked is never reused. O(n) time and space.', code: {
          py: `class Solution:
    def shortestSubarray(self, nums: List[int], k: int) -> int:
        n = len(nums)
        pre = [0] * (n + 1)
        for i, x in enumerate(nums):
            pre[i + 1] = pre[i] + x
        dq = deque()                     # indices with increasing prefix sums
        best = n + 1
        for i in range(n + 1):
            while dq and pre[i] - pre[dq[0]] >= k:
                best = min(best, i - dq.popleft())    # this start is used up
            while dq and pre[dq[-1]] >= pre[i]:
                dq.pop()                 # a larger earlier prefix is never a better start
            dq.append(i)
        return best if best <= n else -1`,
          js: `function shortestSubarray(nums, k) {
  const n = nums.length, pre = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
  const dq = [];                         // indices with increasing prefix sums
  let head = 0, best = n + 1;
  for (let i = 0; i <= n; i++) {
    while (dq.length > head && pre[i] - pre[dq[head]] >= k) best = Math.min(best, i - dq[head++]);   // this start is used up
    while (dq.length > head && pre[dq[dq.length - 1]] >= pre[i]) dq.pop();   // a larger earlier prefix is never a better start
    dq.push(i);
  }
  return best <= n ? best : -1;
}` } },
        starter: { py: 'class Solution:\n    def shortestSubarray(self, nums: List[int], k: int) -> int:\n        ', js: 'function shortestSubarray(nums, k) {\n  \n}' },
        tests: { fn: 'shortestSubarray', cases: [
          { args: [[1], 1], out: 1 }, { args: [[1, 2], 4], out: -1 }, { args: [[2, -1, 2], 3], out: 3 }, { args: [[84, -37, 32, 40, 95], 167], out: 3 }] } }
    ],

    mistakes: [
      '**Pushing the value when you need the index.** Distances (739), widths (84) and window expiry (239) all need positions. Store the index; read the value with `nums[stack[-1]]`.',
      '**The wrong comparison on ties.** `<` versus `<=` decides whether equal values pop each other. For next *strictly* greater, pop on `<`. For Daily Temperatures, `[70, 70]` must give `[0, 0]`. In sum-of-minimums, one side must be strict and the other non-strict, or equal values get counted twice (or not at all).',
      '**Forgetting the leftovers.** Anything left on the stack at the end never found an answer. That is -1 or 0 for next-greater problems, and for the histogram it means areas are never computed unless you add a final sentinel bar of height 0.',
      '**Using the wrong width in the histogram.** The width after a pop is `i - newTop - 1`, with -1 for an empty stack, not `i - poppedIndex`. The bars between the new top and the popped one were popped earlier because they were taller, and they belong to the rectangle.',
      '**Moving the window front with the wrong test in a deque.** Pop the front when `dq[0] <= i - k` (the index left the window), not when its value is small. Also, never `shift()` a JavaScript array in a hot loop: it is O(n). Use a head pointer or an index.',
      '**Peeking an empty stack.** `stack[-1]` on an empty list is an `IndexError`, `.peek()` on an empty Java `ArrayDeque` returns `null` (unboxing it to `int` then throws a `NullPointerException`), and C++ `back()` on an empty vector is undefined behavior. Put `stack and ...` first in every `while`.',
      '**Calling it O(n²) because of the nested loop, or claiming O(1) space.** The inner loop is amortized, and the stack plus output are O(n). Say both out loud.',
      '**Language gotchas.** *Python:* use `collections.deque` for a queue, since `list.pop(0)` is O(n). *JavaScript:* comparing mixed values with `<` is fine on numbers but compares strings alphabetically, so convert digit characters before comparing. *Java:* `Deque<Integer>` comparisons with `==` compare references, so unbox with `.intValue()` or compare through a method like `nums[stack.peek()]`. *C++:* `std::stack::pop()` returns nothing, so read `top()` first (a `vector` as the stack avoids the trap).'
    ],

    quiz: [
      { kind: 'concept', q: 'In the monotonic stack that finds the next greater element, how are the values on the stack ordered from bottom to top?',
        choices: ['Non-increasing: bigger values sit below smaller ones', 'Non-decreasing: smaller values sit below bigger ones', 'In the order they appeared, with no relation between values', 'Sorted by index in descending order'], answer: 0,
        explain: 'Anything smaller than the newcomer is popped, so what remains is at least as large as the newcomer. The stack therefore never increases going up. (Indices always increase going up, but the values are what is “monotonic”.)' },
      { kind: 'complexity', q: 'The next-greater solution has a `while` loop inside a `for` loop. What is its time complexity?',
        choices: ['O(n)', 'O(n²)', 'O(n log n)', 'O(n × k) where k is the stack size'], answer: 0,
        explain: 'Each index is pushed once and popped at most once, so the total number of loop iterations over the whole run is at most 2n. The inner loop is amortized O(1) per element.' },
      { kind: 'pattern', q: 'Which problem is a natural fit for a monotonic stack or deque? Pick every one that applies.',
        choices: ['For each day, how many days until a warmer one', 'The maximum of every window of size k as it slides', 'Whether a string of brackets is balanced', 'The largest rectangle inside a histogram'], answer: [0, 1, 3],
        explain: 'Next-greater distances, window maximum (a deque) and histogram rectangles all ask about the nearest bigger or smaller neighbour, or about a maximum with expiry. Bracket matching is a plain stack, with no ordering of values to maintain.' },
      { kind: 'bug', q: 'This should return the number of days to wait for a warmer day, but `[70, 70]` returns `[1, 0]` instead of `[0, 0]`. What is the bug?',
        code: `def daily(t):
    res = [0] * len(t)
    stack = []
    for i, x in enumerate(t):
        while stack and t[stack[-1]] <= x:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res`,
        choices: ['The comparison should be `<`, because an equal temperature is not warmer', 'The result list should start at -1', 'The stack should hold values, not indices', 'The loop should run backwards'], answer: 0,
        explain: 'With `<=`, an equal temperature pops the top and records a wait, even though “warmer” means strictly higher. Changing it to `<` keeps equal values on the stack, giving `[0, 0]`.' },
      { kind: 'concept', q: 'In Sliding Window Maximum, why does the deque hold indices and not just values?',
        choices: ['So the front can be removed when its index slides out of the window', 'Because Python deques can only hold integers', 'To save memory', 'Because values may be negative'], answer: 0,
        explain: 'The front must be dropped once it is no longer inside the window, and only the index tells you that. The value can be read from the index whenever you need it.' },
      { kind: 'concept', q: 'In the histogram solution, you pop a bar and the stack is not empty. What is the width of that bar’s rectangle, with `i` the current index?',
        choices: ['i - stack[-1] - 1', 'i - poppedIndex', 'i - stack[-1]', 'len(heights) - poppedIndex'], answer: 0,
        explain: 'The new top is the nearest shorter bar on the left, and the current bar is the nearest shorter-or-equal bar on the right. The rectangle fills everything strictly between them: `i - top - 1` bars wide.' },
      { kind: 'concept', q: 'Why is a monotonic deque faster than a max-heap for the sliding window maximum?',
        choices: ['Each index enters and leaves once, so O(n) total, with no log factor or lazy deletion', 'A deque stores fewer numbers than a heap', 'A heap cannot return the maximum', 'A deque sorts the window for free'], answer: 0,
        explain: 'A heap costs O(log n) per push and needs lazy deletion for expired items, giving O(n log n). The deque only ever touches its two ends, and each index is pushed and popped once.' },
      { kind: 'pattern', q: 'For the circular version (next greater element in a circular array), what is the standard trick?',
        choices: ['Loop 2n times using `i % n`, and push indices only on the first n steps', 'Copy the array and sort it first', 'Run the algorithm backwards only', 'Use a queue instead of a stack'], answer: 0,
        explain: 'Two laps let every element see the ones that wrap around. Pushing only on the first lap keeps each index on the stack at most once, so the cost stays O(n).' }
    ],

    flashcards: [
      { id: 'mono-idea', front: 'Monotonic stack: the one-sentence idea.', back: 'Keep the stack ordered; when a new item breaks the order, pop items that it **resolves** (they just found their next greater or smaller). Everything is pushed once and popped once.' },
      { id: 'mono-order', front: 'Next greater element: pop on which comparison, and what order does the stack keep?', back: 'Pop while the top is **less than** the new value. The values on the stack are non-increasing from bottom to top, and equal values stay on it.' },
      { id: 'mono-cost', front: 'Why is a `while` inside a `for` still O(n)?', back: 'Each index is pushed once and popped at most once, so total pops are at most n. That is amortized O(1) per element.' },
      { id: 'mono-index', front: 'Store the index or the value on the stack?', back: 'The **index** whenever you need a distance, a width, or an expiry check. Read the value from the index.' },
      { id: 'mono-left-right', front: 'Previous smaller instead of next greater: what changes?', back: 'Keep the stack increasing, pop while the top is greater than or equal to the new value, and read the answer from the top **before** pushing.' },
      { id: 'mono-hist', front: 'Largest rectangle in a histogram in one line.', back: 'Increasing stack of indices; on a bar not taller than the top, pop it, and its width is `i - newTop - 1` (newTop is -1 if empty). A final height-0 bar flushes the stack.' },
      { id: 'mono-deque', front: 'Sliding window maximum: how is the deque kept?', back: 'Indices with decreasing values. Pop from the back while the back value is at most the new one, push the new index, pop the front if it left the window. The front is the max.' },
      { id: 'mono-circular', front: 'Next greater in a circular array.', back: 'Loop `i` from 0 to `2n - 1`, read `nums[i % n]`, push indices only when `i < n`.' },
      { id: 'mono-ties', front: 'Tie handling: where does it go wrong?', back: '`<` versus `<=` changes the answer on equal values. In contribution counting (sum of subarray minimums), use strict on one side and non-strict on the other, so each subarray is counted once.' },
      { id: 'mono-leftover', front: 'What does an index left on the stack at the end mean?', back: 'It never found a next greater (or smaller) element. Its answer is the default: -1 or 0. In the histogram, a sentinel bar of height 0 forces these to be processed.' },
      { id: 'mono-greedy', front: 'Remove k digits for the smallest number: the stack rule?', back: 'While removals remain and the top digit is larger than the new digit, pop. Afterwards trim leftover removals from the back and strip leading zeros.' }
    ],

    deeper: [
      { title: 'Monotonic stack (LeetCode tag)', url: 'https://leetcode.com/tag/monotonic-stack/', time: 'reference', note: 'LeetCode’s list of monotonic-stack problems. Start with the easy and medium ones until the pop rule feels automatic, then try the histogram family.' },
      { title: 'Monotonic queue (LeetCode tag)', url: 'https://leetcode.com/tag/monotonic-queue/', time: 'reference', note: 'The deque flavour: window maximum and its relatives. A short list, and every problem on it is worth doing once.' },
      { title: 'Largest Rectangle in Histogram (LeetCode 84)', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', time: '30 to 45 min', note: 'The hardest problem on this page and the best test of whether you understand the width calculation. Read the discussion for the sentinel variant.' },
      { title: 'Minimum stack and minimum queue (cp-algorithms)', url: 'https://cp-algorithms.com/data_structures/stack_queue_modification.html', time: 'about 15 min', note: 'A competitive-programming take on the same ideas: stacks and queues that answer “what is the minimum right now” in constant time. Useful if you want the theory behind the deque.' }
    ],

    detective: [
      { id: 'mono-lanterns', decoys: ['stacks', 'sliding-window', 'two-pointers'],
        statement: 'A festival lines up paper lanterns along a street, each with a known brightness. Every lantern keeper wants to know how many lanterns down the street (counting only forward) they must look before they see one that shines **brighter** than their own. If no brighter lantern is ahead, they simply write zero. The street can have hundreds of thousands of lanterns, so checking forward from each one over and over is too slow. Produce each keeper’s number.',
        why: 'For every element you want the nearest **bigger** one on one side, and the naive scan re-reads the same elements. Items still waiting for a bigger one are exactly the ones on a stack, and a new bigger item settles several at once. That is the monotonic stack, with distances computed from indices.' },
      { id: 'mono-billboard', decoys: ['two-pointers', 'prefix-sums', 'binary-search'],
        statement: 'A street has a long row of billboard frames, all one metre wide but of different heights. A painter wants to hang one rectangular banner across several **neighbouring** frames, as wide as she likes, but the banner cannot be taller than the shortest frame it touches. Which banner covers the largest area? Frames can number in the tens of thousands, so trying every pair of end frames is too slow.',
        why: 'The answer is limited by some frame’s height, and it stretches until a **shorter** frame on each side. Finding the nearest shorter neighbour on both sides for every element, in one pass, is the monotonic stack (the largest-rectangle-in-a-histogram idea).' },
      { id: 'mono-ticker', decoys: ['sliding-window', 'heaps', 'queues'],
        statement: 'A trading screen receives one price per second. The screen must always show the **highest price of the last k seconds**, and it has to do this for millions of ticks without slowing down. Sorting each batch of k prices again and again is too slow, and so is rescanning the whole stretch every second. Report the highest recent price after every tick.',
        why: 'It is the maximum of a **moving** window. An old price that is lower than a newer one can never be the maximum again, so a deque of candidates, cleaned from the back by newcomers and from the front by expiry, answers each tick in amortized constant time. That is the monotonic deque.' }
    ]
  });
})();
