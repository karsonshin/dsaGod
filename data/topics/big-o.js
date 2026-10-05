/* Offer Ready: Big-O and complexity. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'big-o',

    hook: 'Every interview answer gets graded on two numbers: how the running time grows, and how the memory grows. Big-O is the shorthand for both, and the input limits in the problem statement tell you which complexity the interviewer expects before you write a line. Get this right and you stop guessing at which solutions are worth trying.',

    cues: [
      'The interviewer asks “what’s the time and space complexity?” (they always do, so say it before they ask).',
      'The statement gives a limit on the input: **n ≤ 10⁵** means a quadratic solution won’t finish, **n ≤ 20** means trying every subset is allowed.',
      'You have a working brute force and need to know whether it’s good enough, or what to aim for.',
      'Two solutions trade memory for speed (a hash set versus sorting), and you have to pick one and defend it.',
      'A loop sits inside a loop, a recursive call sits inside a loop, or a built-in call hides a loop of its own.',
      'The trap: counting **lines** or **loops** instead of how many times the work repeats as the input grows.'
    ],

    intuition: [
      'Don’t time your code. Count its work. A stopwatch measures your laptop, your language and what else is running; a count of steps measures the algorithm. Big-O asks one question: **when the input gets 10 times bigger, how many times bigger does the work get?** A scan gets 10 times slower. A pair-by-pair check gets 100 times slower. A binary search barely notices.',
      'Picture reading a phone book. To find one name by reading every entry, a book twice as thick takes twice as long. To find it by opening the middle and discarding half, a book twice as thick costs just one more look. Same task, two growth rates, and the gap between them gets wider the bigger the book gets.',
      'Precisely:',
      '1. Pick the size of the input, called n (the array’s length, the number of nodes, the digits in a number). When there are several inputs, name each one: n and m.\n2. Choose one operation that represents the work: a comparison, a loop step, a hash lookup.\n3. Count how many times it runs, as a function of n. Loops that follow each other **add**; loops inside loops **multiply**; a loop that halves what’s left runs log n times.\n4. Keep only the term that grows fastest and drop its constant: 3n² + 50n + 7 becomes O(n²). The constants are real, but they don’t change which solution wins once n is large.',
      'Big-O is an **upper bound on growth**, usually quoted for the worst case. “O(n)” says the work is at most proportional to n, once n is large enough. In an interview it’s used loosely to mean the tight bound, which is what you should state.',
      'The same counting works for **space**: how much extra memory does the algorithm hold at its peak? Memory for the input itself doesn’t count, but the call stack of a recursion does.',
      'The classes you’ll meet, from cheapest to ruinous: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!). The visualizer below plots the first six. Pick an n and step through them.'
    ].join('\n\n'),

    viz: 'growth',

    template: {
      title: 'Count the work: the shape of each loop gives its class',
      note: 'Read each loop by what it does to the counter. **No loop** is O(1). A loop that **halves** (`k //= 2`) runs log n times. **One pass** is n. A pass that **contains a halving loop** is n log n (this is how sorting and heap work look). **Two passes nested over the same n** is n². A function that **calls itself twice per level** doubles each level: 2ⁿ leaves after n levels. Change what the counter counts and the shapes still apply.',
      code: {
        py: `def count_steps(n):
    constant = 1                         #@const > Same work for any n: one lookup, one add
    log = 0
    k = n
    while k > 1:                         #@log > Halve what's left until one item remains: log n rounds
        k //= 2
        log += 1
    linear = 0
    for _ in range(n):                   #@linear > Touch each of the n items once
        linear += 1
    nlogn = 0
    for _ in range(n):                   #@nlogn > A halving loop inside a pass over n
        k = n
        while k > 1:
            k //= 2
            nlogn += 1
    quad = 0
    for _ in range(n):                   #@quad > A loop in a loop, both over n: every pair
        for _ in range(n):
            quad += 1
    def leaves(m):
        return 1 if m == 0 else leaves(m - 1) + leaves(m - 1)   #@exp > Two calls per level, n levels deep: 2^n leaves
    return [constant, log, linear, nlogn, quad, leaves(n)]`,
        js: `function countSteps(n) {
  const constant = 1;                            //@const > Same work for any n: one lookup, one add
  let log = 0;
  for (let k = n; k > 1; k = Math.floor(k / 2)) //@log > Halve what's left until one item remains: log n rounds
    log++;
  let linear = 0;
  for (let i = 0; i < n; i++) linear++;          //@linear > Touch each of the n items once
  let nlogn = 0;
  for (let i = 0; i < n; i++)                    //@nlogn > A halving loop inside a pass over n
    for (let k = n; k > 1; k = Math.floor(k / 2)) nlogn++;
  let quad = 0;
  for (let i = 0; i < n; i++)                    //@quad > A loop in a loop, both over n: every pair
    for (let j = 0; j < n; j++) quad++;
  const leaves = (m) => (m === 0 ? 1 : leaves(m - 1) + leaves(m - 1));   //@exp > Two calls per level, n levels deep: 2^n leaves
  return [constant, log, linear, nlogn, quad, leaves(n)];
}`,
        java: `class Solution {
    private int leaves(int m) {
        return m == 0 ? 1 : leaves(m - 1) + leaves(m - 1);   //@exp > Two calls per level, n levels deep: 2^n leaves
    }

    public int[] countSteps(int n) {
        int constant = 1;                                    //@const > Same work for any n: one lookup, one add
        int log = 0;
        for (int k = n; k > 1; k /= 2) log++;                //@log > Halve what's left until one item remains: log n rounds
        int linear = 0;
        for (int i = 0; i < n; i++) linear++;                //@linear > Touch each of the n items once
        int nlogn = 0;
        for (int i = 0; i < n; i++)                          //@nlogn > A halving loop inside a pass over n
            for (int k = n; k > 1; k /= 2) nlogn++;
        int quad = 0;
        for (int i = 0; i < n; i++)                          //@quad > A loop in a loop, both over n: every pair
            for (int j = 0; j < n; j++) quad++;
        return new int[]{constant, log, linear, nlogn, quad, leaves(n)};
    }
}`,
        cpp: `class Solution {
    int leaves(int m) {
        return m == 0 ? 1 : leaves(m - 1) + leaves(m - 1);   //@exp > Two calls per level, n levels deep: 2^n leaves
    }

public:
    vector<int> countSteps(int n) {
        int constant = 1;                                    //@const > Same work for any n: one lookup, one add
        int log = 0;
        for (int k = n; k > 1; k /= 2) log++;                //@log > Halve what's left until one item remains: log n rounds
        int linear = 0;
        for (int i = 0; i < n; i++) linear++;                //@linear > Touch each of the n items once
        int nlogn = 0;
        for (int i = 0; i < n; i++)                          //@nlogn > A halving loop inside a pass over n
            for (int k = n; k > 1; k /= 2) nlogn++;
        int quad = 0;
        for (int i = 0; i < n; i++)                          //@quad > A loop in a loop, both over n: every pair
            for (int j = 0; j < n; j++) quad++;
        return {constant, log, linear, nlogn, quad, leaves(n)};
    }
};`
      },
      tests: { fn: { py: 'count_steps', default: 'countSteps' }, sig: { args: ['int'] }, cases: [
        { args: [1], out: [1, 0, 1, 0, 1, 2] }, { args: [2], out: [1, 1, 2, 2, 4, 4] }, { args: [8], out: [1, 3, 8, 24, 64, 256] },
        { args: [10], out: [1, 3, 10, 30, 100, 1024] }, { args: [16], out: [1, 4, 16, 64, 256, 65536] }] }
    },

    complexity: {
      time: 'O(f(n)): count the steps',
      space: 'O(g(n)): extra memory at the peak',
      why: 'Add the cost of loops that run one after another, multiply the cost of loops that sit inside one another, and keep the biggest term: 5n² + 3n log n + 9 is O(n²). **Space** is the extra memory held at the same moment, and it includes the **call stack**: a recursion that goes d calls deep before returning uses O(d) stack even if it allocates nothing. Memory the input already occupies doesn’t count, which is why “in place” means O(1) extra space.\n\nThe cheat sheet to carry in your head: O(1) is one lookup, O(log n) is halving, O(n) is one pass, O(n log n) is sorting, O(n²) is every pair, O(2ⁿ) is every subset, O(n!) is every ordering.',
      trap: 'Don’t count lines or loops, count how often the work repeats. Two nested loops aren’t always O(n²): a loop that’s `for j in range(5)` is a constant, and an inner loop whose total across the whole run is n (like the shrinking pointer in a sliding window) is **amortized** O(n) overall. The opposite also bites: one visible loop can hide another, such as `x in some_list`, `s += c` in Java, or a slice. Count what the language does, not what the code looks like.'
    },

    variations: [
      {
        name: 'Reading the constraints',
        body: 'The limit on n is a hint about the intended solution. A rule of thumb is that a judge allows about 10⁸ simple steps in a second in a compiled language (Python gets nearer 10⁷). Work backwards from the limit:\n\n| Limit on n | Complexity that fits | Typical technique |\n|---|---|---|\n| up to about 10 | O(n!) | try every ordering |\n| up to about 20 | O(2ⁿ) | try every subset; bitmask DP |\n| up to about 100 to 500 | O(n³) | triple loop; Floyd–Warshall |\n| up to about 5,000 | O(n²) | every pair; simple DP tables |\n| up to about 10⁵ | O(n log n) | sort, heap, binary search, sweep |\n| up to about 10⁶ | O(n) or O(n log n) | one pass, hash map, two pointers |\n| 10⁹ or more | O(log n) or O(1) | binary search, math, a formula |\n\nThese are guides, not laws. Check the arithmetic with the real numbers: n = 10⁵ squared is 10¹⁰ steps, roughly a hundred times too many, while n log₂ n is about 1.7 million. When a problem’s limit is small on purpose (n ≤ 100), the brute force is the intended answer. Writing a clever one costs time and risks bugs for no gain: Count Good Triplets (1534) below is that case.'
      },
      {
        name: 'Amortized analysis',
        body: 'Some operations are usually cheap and occasionally expensive. **Amortized** cost spreads the rare expensive ones across the cheap ones: it’s the average cost per operation over a worst-case sequence, with no randomness involved. The textbook case is appending to a dynamic array (a Python list, a Java `ArrayList`, a C++ `vector`). When it’s full it allocates double the space and copies everything over. One append can cost O(n), but over n appends the copies add up to 1 + 2 + 4 + … which is less than 2n, so each append costs O(1) amortized. The sliding window is the same idea: the inner `while` can run many times in one step, but `left` moves forward at most n times in total.\n\nThe argument to say out loud: “each element is added once and removed at most once, so the total work is O(n).” Growing by a fixed amount instead of doubling breaks the argument and makes n appends cost O(n²) in total.',
        code: {
          py: `def total_copies(n):
    cap, size, copies = 1, 0, 0
    for _ in range(n):
        if size == cap:
            copies += size       #> Full: copy everything into a buffer twice the size
            cap *= 2
        size += 1                #> The append itself is one step
    return copies`,
          js: `function totalCopies(n) {
  let cap = 1, size = 0, copies = 0;
  for (let i = 0; i < n; i++) {
    if (size === cap) {
      copies += size;          //> Full: copy everything into a buffer twice the size
      cap *= 2;
    }
    size++;                    //> The append itself is one step
  }
  return copies;
}`
        },
        tests: { fn: { py: 'total_copies', default: 'totalCopies' }, cases: [
          { args: [0], out: 0 }, { args: [1], out: 0 }, { args: [2], out: 1 }, { args: [3], out: 3 }, { args: [5], out: 7 }, { args: [9], out: 15 }, { args: [1000], out: 1023 }] }
      },
      {
        name: 'Space complexity and the call stack',
        body: 'Count extra memory at the moment it peaks. A few variables are O(1). A new array, set or map sized by the input is O(n). A recursion that goes d calls deep keeps d frames alive at once, so it uses O(d) space for the stack even if it never creates a list: a recursive function that walks a linked list of n nodes uses O(n) stack, and a depth-first search on a balanced binary tree uses O(log n) while a skewed tree uses O(n).\n\nA language limit follows from this. Python’s default recursion limit is about 1,000 frames, so a depth of 10⁵ raises an error long before memory runs out. Java and C++ have stack-size limits too, so a deep recursion can overflow. When the depth can reach n, an explicit stack on the heap or a loop is the safe rewrite.\n\nTime and space also trade against each other. A hash set finds duplicates in O(n) time and O(n) space; sorting first uses O(n log n) time and little extra space. Say which you’re spending, and offer the other as the alternative. Contains Duplicate (217) is the standard drill.'
      },
      {
        name: 'Best, worst, average and expected',
        body: 'Quote the **worst case** unless asked otherwise, because it’s the one that can’t surprise you. But know the cases that differ. A linear search is O(1) best case (the first item) and O(n) worst. Quicksort with a random pivot is O(n log n) **expected**, and O(n²) in the worst case. A hash map lookup is O(1) **average**: with a poor hash function or hostile keys it degrades to O(n) in the worst case, which is why interviewers sometimes ask what happens when everything collides. In an interview, “O(1) on average, O(n) worst case if everything collides” is the answer that shows you know the difference.\n\nBig-O, Big-Omega (a lower bound) and Big-Theta (a tight bound) are three different statements, and “O(n²)” is technically true of a linear algorithm too. People say Big-O and mean the tight bound; if you give a bound that’s correct but looser than the truth, the interviewer will push you for the tight one.'
      },
      {
        name: 'Logs in disguise, and more than one input',
        body: 'Anything that repeatedly **divides** the remaining work is a log. Binary search halves the range. A loop `while k > 0: k //= 10` runs once per digit, so about log₁₀ n times. A balanced tree has height log n. Counting set bits with `n &= n - 1` runs once per set bit. Base doesn’t matter inside Big-O, because log₂ n and log₁₀ n differ by a constant factor, so you can write them all as log n.\n\nWhen the input has **two sizes**, keep both: merging two lists is O(n + m), checking every pair across them is O(n · m), and a grid walk is O(rows · cols). Don’t collapse them into a single n unless the problem says they’re equal. Also be careful with the **value** versus the **size** of a number: a loop that runs to `n` is O(n) in the value, which is exponential in the number of digits. Checking whether a number is prime by trial division up to its square root is O(√n) in the value.'
      }
    ],

    worked: [
      {
        lc: 1534,
        restate: 'Given an array of integers `arr` and three limits `a`, `b` and `c`, count the triplets of indices `i < j < k` where `|arr[i] − arr[j]| ≤ a`, `|arr[j] − arr[k]| ≤ b` and `|arr[i] − arr[k]| ≤ c`.',
        examples: '- `arr = [3,0,1,1,9,7]`, `a = 7`, `b = 2`, `c = 3` → 4.\n- `arr = [1,1,2,2,3]`, `a = 0`, `b = 0`, `c = 1` → 0.\n- Edge cases: fewer than three elements → 0; all limits 0 with equal values counts every equal triple.',
        brute: 'Check every triple of indices with three nested loops. That’s O(n³) time and O(1) space, and it is the intended solution here.',
        insight: 'Read the constraints before reaching for anything clever: the array has at most **100** elements. Then n³ is at most about 160,000 triples (100 choose 3), nowhere near the 10⁸ budget. A smarter algorithm would take longer to write, and be easier to get wrong, for no gain. The skill being tested is recognizing that the limit permits the brute force. Starting `j` after `i` and `k` after `j` keeps the indices ordered without extra checks.',
        code: {
          py: `class Solution:
    def countGoodTriplets(self, arr: List[int], a: int, b: int, c: int) -> int:
        n, count = len(arr), 0
        for i in range(n):
            for j in range(i + 1, n):
                if abs(arr[i] - arr[j]) > a:
                    continue                     # no k can rescue this pair
                for k in range(j + 1, n):
                    if abs(arr[j] - arr[k]) <= b and abs(arr[i] - arr[k]) <= c:
                        count += 1
        return count`,
          js: `function countGoodTriplets(arr, a, b, c) {
  const n = arr.length;
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(arr[i] - arr[j]) > a) continue;   // no k can rescue this pair
      for (let k = j + 1; k < n; k++) {
        if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++;
      }
    }
  }
  return count;
}`,
          java: `class Solution {
    public int countGoodTriplets(int[] arr, int a, int b, int c) {
        int n = arr.length, count = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (Math.abs(arr[i] - arr[j]) > a) continue;   // no k can rescue this pair
                for (int k = j + 1; k < n; k++) {
                    if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++;
                }
            }
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int countGoodTriplets(vector<int>& arr, int a, int b, int c) {
        int n = arr.size(), count = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (abs(arr[i] - arr[j]) > a) continue;   // no k can rescue this pair
                for (int k = j + 1; k < n; k++) {
                    if (abs(arr[j] - arr[k]) <= b && abs(arr[i] - arr[k]) <= c) count++;
                }
            }
        }
        return count;
    }
};`
        },
        complexity: 'O(n³) time, O(1) space. With n ≤ 100 that’s under 200,000 triples, so it’s fast. The early `continue` only trims work; it doesn’t change the bound.',
        say: '“The array has at most 100 elements, so n³ is about 10⁶ at most, far inside the budget. The straightforward triple loop is the right answer, and anything cleverer would add risk without helping. I’ll keep `i < j < k` by starting each loop after the last, and skip a whole inner loop once the first pair already breaks the limit `a`. That’s O(n³) time and O(1) space.”',
        followups: [
          { q: 'What if n were 10⁵?', a: 'Then n³ is impossible and even n² is too slow, so you’d need a fundamentally different idea (sorting plus a counting structure, for example). Say that the limits decided the approach: the same statement with a bigger n is a different problem.' },
          { q: 'Does the early `continue` improve the Big-O?', a: 'No. In the worst case (every pair passes the first check), the inner loop still runs for every pair, so it’s O(n³). It only helps on typical inputs.' },
          { q: 'How many triples is that for n = 100?', a: '100 · 99 · 98 / 6 = 161,700. A computer does that in a fraction of a millisecond, which is why the constraint was set that low.' }
        ]
      },
      {
        lc: 1588,
        restate: 'Given an array of positive integers, return the sum of all of its subarrays that have an odd length. A subarray is a contiguous block.',
        examples: '- `[1,4,2,5,3]` → 58: odd-length subarrays are `[1]`, `[4]`, `[2]`, `[5]`, `[3]`, `[1,4,2]`, `[4,2,5]`, `[2,5,3]` and `[1,4,2,5,3]`.\n- `[1,2]` → 3: only `[1]` and `[2]`.\n- Edge cases: a single element → itself; `[10,11,12]` → 66.',
        brute: 'For every start, extend the end by two at a time and add up the block. Summing each block from scratch is O(n³); keeping a running total while extending gets it to O(n²); prefix sums make each block sum O(1), still O(n²) blocks.',
        insight: 'Stop summing subarrays and count how many times each **element** is added. An element at index `i` is in a subarray if the start is one of the `i + 1` positions at or before it and the end is one of the `n − i` positions at or after it, giving `(i + 1) · (n − i)` subarrays. About half of those have odd length. The exact count is `((i + 1) · (n − i) + 1) // 2` (the rounding goes up). So each element contributes `value × that count`: one O(n) pass. This “contribution counting” trick turns a double loop over subarrays into a single loop over elements.',
        code: {
          py: `class Solution:
    def sumOddLengthSubarrays(self, arr: List[int]) -> int:
        n, total = len(arr), 0
        for i, x in enumerate(arr):
            starts, ends = i + 1, n - i           # choices of start and of end that include index i
            total += x * ((starts * ends + 1) // 2)   # about half have odd length; the half rounds up
        return total`,
          js: `function sumOddLengthSubarrays(arr) {
  const n = arr.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const starts = i + 1, ends = n - i;           // choices of start and of end that include index i
    total += arr[i] * Math.floor((starts * ends + 1) / 2);   // about half have odd length; the half rounds up
  }
  return total;
}`,
          java: `class Solution {
    public int sumOddLengthSubarrays(int[] arr) {
        int n = arr.length, total = 0;
        for (int i = 0; i < n; i++) {
            int starts = i + 1, ends = n - i;           // choices of start and of end that include index i
            total += arr[i] * ((starts * ends + 1) / 2);   // about half have odd length; the half rounds up
        }
        return total;
    }
}`,
          cpp: `class Solution {
public:
    int sumOddLengthSubarrays(vector<int>& arr) {
        int n = arr.size(), total = 0;
        for (int i = 0; i < n; i++) {
            int starts = i + 1, ends = n - i;           // choices of start and of end that include index i
            total += arr[i] * ((starts * ends + 1) / 2);   // about half have odd length; the half rounds up
        }
        return total;
    }
};`
        },
        complexity: 'O(n) time, O(1) space. The limit here (n ≤ 100) would allow O(n²) or even O(n³), so the O(n) version is a bonus the interviewer may ask for, not a requirement.',
        say: '“Summing every odd-length subarray is O(n²) at best. Instead I’ll ask how many odd-length subarrays contain each element. Index i has i + 1 possible starts and n − i possible ends, so (i + 1)(n − i) subarrays contain it, and rounding up half of them gives the odd-length count. I add value times count for each element: one pass, O(n) time and O(1) space.”',
        followups: [
          { q: 'Why is the odd-length count `(x + 1) // 2` and not `x // 2`?', a: 'Take the first element of an array of three: it has 1 start and 3 ends, so 3 subarrays contain it, with lengths 1, 2 and 3. Two of those are odd, which is `(3 + 1) // 2`. Rounding down would give 1. In general the odd lengths are the extra half when the count is odd. Check it on a tiny case before trusting the formula.' },
          { q: 'Would you use this when n ≤ 100?', a: 'The O(n²) running-total version is simpler and plenty fast. Mention both: the simple one is a safe first answer, and the contribution count is the upgrade if asked.' },
          { q: 'Could the total overflow?', a: 'In this problem the values and length are small, so a 32-bit int is fine. In general, a sum of n values times about n²/4 counts can reach about n³ times the maximum value, so use a 64-bit type for large inputs.' }
        ]
      },
      {
        lc: 217,
        restate: 'Given an array of integers, return true if any value appears at least twice, and false if all the values are distinct.',
        examples: '- `[1,2,3,1]` → true.\n- `[1,2,3,4]` → false.\n- `[1,1,1,3,3,4,3,2,4,2]` → true.\n- Edge cases: a single element → false.',
        brute: 'Compare every pair: O(n²) time, O(1) space. Fine for small n and never wrong, but with n up to 10⁵ it’s 10¹⁰ comparisons.',
        insight: 'There are three answers, and the lesson is that they sit at different points on a time-space trade-off. **Pairs:** O(n²) time, O(1) space. **Sort, then compare neighbours:** O(n log n) time, and O(1) extra space if you may reorder the input (or O(n) if you copy it first). **Hash set:** remember what you’ve seen, so each element costs one O(1) average lookup: O(n) time, O(n) space. Name all three, choose the set for speed, and say that sorting is the answer if memory is tight.',
        code: {
          py: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for x in nums:
            if x in seen:            # average O(1); a list here would make this O(n)
                return True
            seen.add(x)
        return False`,
          js: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;    // average O(1)
    seen.add(x);
  }
  return false;
}`,
          java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (!seen.add(x)) return true;   // add returns false when x was already there
        }
        return false;
    }
}`,
          cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int x : nums) {
            if (!seen.insert(x).second) return true;   // second is false when x was already there
        }
        return false;
    }
};`
        },
        complexity: 'O(n) time on average, O(n) space for the set. Say “on average”: a hash set can degrade to O(n) per lookup if everything collides, though that’s rare in practice. The sorted version is O(n log n) time with O(1) extra space.',
        say: '“The brute force compares every pair, O(n²). I can trade memory for time: keep a hash set of values seen so far. For each number, if it’s already in the set I’m done; otherwise I add it. That’s one pass, O(n) time and O(n) space. If memory mattered more I’d sort first and compare neighbours instead, O(n log n) time and O(1) extra space.”',
        followups: [
          { q: 'What would you do if memory were very tight?', a: 'Sort in place and compare adjacent elements: O(n log n) time, O(1) extra space (ignoring the sort’s own stack). It changes the order of the input, so ask if that’s allowed.' },
          { q: 'Is the set solution really O(n)?', a: 'On average, yes: each lookup and insert is O(1). Worst case, with a pathological hash, each operation is O(n), so the total would be O(n²). Real hash tables resist this, and Java’s switches buckets to trees under heavy collisions.' },
          { q: 'Can you stop early?', a: 'Yes, and the code does: return the moment a repeat appears. Worst case (all distinct) still reads the whole array.' }
        ]
      },
      {
        lc: 1,
        restate: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Exactly one pair exists, and you may not use the same element twice.',
        examples: '- `nums = [2,7,11,15]`, `target = 9` → `[0, 1]`.\n- `nums = [3,2,4]`, `target = 6` → `[1, 2]`: the first 3 can’t pair with itself.\n- `nums = [3,3]`, `target = 6` → `[0, 1]`.\n- Edge cases: negative numbers and zero are allowed; the pair may be any distance apart.',
        brute: 'Check every pair of indices: O(n²) time, O(1) space. At the real limit of n = 10⁴ that’s about 5·10⁷ pair checks, which would pass in C++ and Java, but it’s what the interviewer wants you to improve.',
        insight: 'For each number `x`, you’re really asking one question: *have I already seen `target − x`?* A hash map from value to index answers it in O(1) on average, so one pass replaces the inner loop. Check the map **before** inserting the current element, which handles `[3,3]` and prevents using one element twice.',
        code: {
          py: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}                          # value -> index
        for i, x in enumerate(nums):
            if target - x in seen:         # check first, so an element can't pair with itself
                return [seen[target - x], i]
            seen[x] = i
        return []`,
          js: `function twoSum(nums, target) {
  const seen = new Map();                  // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];   // check first, so an element can't pair with itself
    seen.set(nums[i], i);
  }
  return [];
}`,
          java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // value -> index
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);     // check first, so an element can't pair with itself
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
          cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;   // value -> index
        for (int i = 0; i < (int)nums.size(); i++) {
            auto it = seen.find(target - nums[i]);   // check first, so an element can't pair with itself
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`
        },
        complexity: 'O(n) time on average, O(n) space for the map. The brute force is O(n²) time and O(1) space: you’re buying a factor of n in speed with n extra memory.',
        say: '“The brute force is every pair, O(n²). For each element I only need to know whether its complement, target minus the element, has appeared earlier. A hash map from value to index answers that in O(1) on average, so I do one pass: look up the complement, return if it’s there, otherwise store the current element. That’s O(n) time and O(n) space, trading memory for time.”',
        followups: [
          { q: 'What if the array is sorted?', a: 'Use two pointers from both ends: O(n) time and O(1) space, so the memory trade-off disappears. That’s Two Sum II (167).' },
          { q: 'Why look up before inserting?', a: 'If you insert first, an element can match itself: with `[3]` and target 6, 3 would find its own complement. Checking first also handles duplicates like `[3,3]`, because the first 3 is already in the map when the second one arrives.' },
          { q: 'Can you do better than O(n) time?', a: 'No: any algorithm may have to read every element, so O(n) is a lower bound for an unsorted array. You can only improve the space, by sorting, at O(n log n) time.' }
        ]
      }
    ],

    practice: [
      { lc: 509,
        hints: ['The naive recursion `fib(n - 1) + fib(n - 2)` recomputes the same values again and again, so the call tree grows exponentially.', 'Each value depends only on the two before it, so you never need the whole history.', 'Walk up from 0 and 1 with two variables, updating them n times.'],
        solution: { explain: 'Two rolling variables replace the exponential recursion with a loop. O(n) time and O(1) space; the naive recursion is O(2ⁿ) time (more precisely about 1.6ⁿ) and O(n) stack.', code: {
          py: `class Solution:
    def fib(self, n: int) -> int:
        a, b = 0, 1
        for _ in range(n):
            a, b = b, a + b
        return a`,
          js: `function fib(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}` } },
        starter: { py: 'class Solution:\n    def fib(self, n: int) -> int:\n        ', js: 'function fib(n) {\n  \n}' },
        tests: { fn: 'fib', cases: [
          { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [2], out: 1 }, { args: [3], out: 2 }, { args: [4], out: 3 }, { args: [10], out: 55 }, { args: [30], out: 832040 }] } },

      { lc: 1480,
        hints: ['Output element `i` is the sum of the input elements from 0 to `i`.', 'Re-adding the start of the array for every `i` costs O(n²).', 'Each output is the previous output plus the current element, so carry a running total.'],
        solution: { explain: 'A running total: each prefix sum builds on the last one. O(n) time, and O(1) extra space beyond the output.', code: {
          py: `class Solution:
    def runningSum(self, nums: List[int]) -> List[int]:
        total, out = 0, []
        for x in nums:
            total += x
            out.append(total)
        return out`,
          js: `function runningSum(nums) {
  let total = 0;
  return nums.map((x) => (total += x));
}` } },
        starter: { py: 'class Solution:\n    def runningSum(self, nums: List[int]) -> List[int]:\n        ', js: 'function runningSum(nums) {\n  \n}' },
        tests: { fn: 'runningSum', cases: [
          { args: [[1, 2, 3, 4]], out: [1, 3, 6, 10] }, { args: [[1, 1, 1, 1, 1]], out: [1, 2, 3, 4, 5] }, { args: [[3, 1, 2, 10, 1]], out: [3, 4, 6, 16, 17] }, { args: [[5]], out: [5] }, { args: [[-1, 1, -1]], out: [-1, 0, -1] }] } },

      { lc: 704,
        hints: ['The array is sorted, so one comparison can rule out half of what’s left.', 'Keep a range `[lo, hi]` and look at the middle element.', 'If the middle is too small, the target is to its right; if too big, to its left. Stop when the range is empty.'],
        solution: { explain: 'Each comparison halves the range, so there are at most about log₂ n rounds: O(log n) time, O(1) space. Compute the middle as `lo + (hi - lo) // 2` to avoid overflow in fixed-width languages.', code: {
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
          { args: [[-1, 0, 3, 5, 9, 12], 9], out: 4 }, { args: [[-1, 0, 3, 5, 9, 12], 2], out: -1 }, { args: [[5], 5], out: 0 }, { args: [[5], -5], out: -1 }, { args: [[1, 3], 3], out: 1 }, { args: [[1, 3, 5, 7], 1], out: 0 }] } },

      { lc: 136,
        hints: ['Every value appears twice except one. A hash map of counts works in O(n) time and O(n) space.', 'To use O(1) space, look for an operation where equal values cancel each other out.', 'XOR of a value with itself is 0, and XOR with 0 changes nothing, so XOR everything together.'],
        solution: { explain: 'XOR is commutative, and `x ^ x = 0`, so all the pairs cancel and the single value is left. O(n) time, O(1) space, versus O(n) space for a counting map.', code: {
          py: `class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        out = 0
        for x in nums:
            out ^= x
        return out`,
          js: `function singleNumber(nums) {
  let out = 0;
  for (const x of nums) out ^= x;
  return out;
}` } },
        starter: { py: 'class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        ', js: 'function singleNumber(nums) {\n  \n}' },
        tests: { fn: 'singleNumber', cases: [
          { args: [[2, 2, 1]], out: 1 }, { args: [[4, 1, 2, 1, 2]], out: 4 }, { args: [[1]], out: 1 }, { args: [[-1, -1, -3]], out: -3 }, { args: [[7, 3, 5, 3, 5]], out: 7 }] } },

      { lc: 268,
        hints: ['The array holds n distinct numbers from 0 to n, so exactly one is missing.', 'A set would find it in O(n) time but costs O(n) space. Can you get the same answer from a total?', 'The numbers 0 to n add up to `n * (n + 1) / 2`. Subtract what’s actually there.'],
        solution: { explain: 'The expected sum minus the actual sum is the missing number. O(n) time, O(1) space. (XOR with the indices also works and can’t overflow.)', code: {
          py: `class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        n = len(nums)
        return n * (n + 1) // 2 - sum(nums)`,
          js: `function missingNumber(nums) {
  const n = nums.length;
  let total = (n * (n + 1)) / 2;
  for (const x of nums) total -= x;
  return total;
}` } },
        starter: { py: 'class Solution:\n    def missingNumber(self, nums: List[int]) -> int:\n        ', js: 'function missingNumber(nums) {\n  \n}' },
        tests: { fn: 'missingNumber', cases: [
          { args: [[3, 0, 1]], out: 2 }, { args: [[0, 1]], out: 2 }, { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], out: 8 }, { args: [[0]], out: 1 }, { args: [[1]], out: 0 }] } },

      { lc: 70,
        hints: ['To stand on step `n` you came from step `n - 1` (one step) or `n - 2` (two steps).', 'So ways(n) = ways(n - 1) + ways(n - 2). Written as plain recursion, how many calls does that make?', 'Only the last two values matter. Keep two variables and loop up.'],
        solution: { explain: 'The same recurrence as Fibonacci. A plain recursion is exponential, memoizing it is O(n) time and O(n) space, and keeping just the last two values is O(n) time and O(1) space.', code: {
          py: `class Solution:
    def climbStairs(self, n: int) -> int:
        prev, cur = 1, 1          # ways to stand on step 0 and on step 1
        for _ in range(n - 1):
            prev, cur = cur, prev + cur
        return cur`,
          js: `function climbStairs(n) {
  let prev = 1, cur = 1;          // ways to stand on step 0 and on step 1
  for (let i = 1; i < n; i++) [prev, cur] = [cur, prev + cur];
  return cur;
}` } },
        starter: { py: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        ', js: 'function climbStairs(n) {\n  \n}' },
        tests: { fn: 'climbStairs', cases: [
          { args: [1], out: 1 }, { args: [2], out: 2 }, { args: [3], out: 3 }, { args: [5], out: 8 }, { args: [10], out: 89 }, { args: [45], out: 1836311903 }] } },

      { lc: 1534,
        hints: ['Check the constraints first: the array has at most 100 elements.', 'Three nested loops with `i < j < k` visit every triplet once.', 'Test all three absolute-difference conditions inside the innermost loop.'],
        starter: { py: 'class Solution:\n    def countGoodTriplets(self, arr: List[int], a: int, b: int, c: int) -> int:\n        ', js: 'function countGoodTriplets(arr, a, b, c) {\n  \n}' },
        tests: { fn: 'countGoodTriplets', sig: { args: ['int[]', 'int', 'int', 'int'] }, cases: [
          { args: [[3, 0, 1, 1, 9, 7], 7, 2, 3], out: 4 }, { args: [[1, 1, 2, 2, 3], 0, 0, 1], out: 0 }, { args: [[1, 1, 1], 0, 0, 0], out: 1 }, { args: [[5, 5], 1, 1, 1], out: 0 },
          { args: [[0, 10, 20, 30], 10, 10, 20], out: 2 }, { args: [[9, 3, 7, 1, 8], 10, 10, 10], out: 10 }] } },

      { lc: 1588,
        hints: ['A direct approach sums every odd-length subarray: fine at n ≤ 100, but there’s a one-pass answer.', 'Ask instead how many odd-length subarrays contain each index.', 'Index `i` has `i + 1` possible starts and `n - i` possible ends; rounding half up, `((i + 1) * (n - i) + 1) // 2` of those are odd.'],
        starter: { py: 'class Solution:\n    def sumOddLengthSubarrays(self, arr: List[int]) -> int:\n        ', js: 'function sumOddLengthSubarrays(arr) {\n  \n}' },
        tests: { fn: 'sumOddLengthSubarrays', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 4, 2, 5, 3]], out: 58 }, { args: [[1, 2]], out: 3 }, { args: [[10, 11, 12]], out: 66 }, { args: [[7]], out: 7 }, { args: [[2, 2, 2, 2]], out: 20 }, { args: [[1, 2, 3, 4, 5, 6]], out: 98 }] } },

      { lc: 217,
        hints: ['Comparing every pair works but is O(n²).', 'Remember what you’ve seen, so each element needs one quick lookup.', 'A set gives O(1) average membership checks: return true the moment one repeats.'],
        starter: { py: 'class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ', js: 'function containsDuplicate(nums) {\n  \n}' },
        tests: { fn: 'containsDuplicate', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3, 1]], out: true }, { args: [[1, 2, 3, 4]], out: false }, { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], out: true }, { args: [[1]], out: false }, { args: [[-5, 5, 0]], out: false }] } },

      { lc: 1,
        hints: ['For each number, the partner you need is `target - x`.', 'Don’t search the rest of the array for it: store each number you’ve passed in a map from value to index.', 'Look in the map before you insert the current number.'],
        starter: { py: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ', js: 'function twoSum(nums, target) {\n  \n}' },
        tests: { fn: 'twoSum', compare: 'unordered', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[2, 7, 11, 15], 9], out: [0, 1] }, { args: [[3, 2, 4], 6], out: [1, 2] }, { args: [[3, 3], 6], out: [0, 1] }, { args: [[-1, -2, -3, -4, -5], -8], out: [2, 4] }, { args: [[0, 4, 3, 0], 0], out: [0, 3] }] } }
    ],

    mistakes: [
      '**Counting loops instead of work.** Two nested loops aren’t automatically O(n²): the inner one may run a constant number of times, or may run n times *in total* across the whole outer loop (the shrinking pointer in a sliding window). Ask how many times the innermost line runs in total.',
      '**Forgetting what the built-ins cost.** `x in some_list`, `list.pop(0)` and `list.insert(0, x)` in Python, `ArrayList.remove(0)` and `list.contains(x)` in Java, `vector::erase(begin())` in C++ and `array.shift()` in JavaScript are all O(n) (or can be). Hidden inside a loop they quietly make the solution O(n²). Slices and substrings copy: `nums[1:]` and `s.substring(i)` cost O(length).',
      '**Treating a hash lookup as always O(1).** It’s O(1) *on average*. Hashing a long string takes time proportional to its length, so a map keyed by strings of length L costs O(L) per operation, and sorting each word as a key costs O(L log L).',
      '**Adding n and m as if they were one number.** Two inputs, two variables. Merging two arrays is O(n + m), a pair check across them is O(n · m). Writing O(n²) when the sizes differ is wrong, and writing O(n) when you iterate over both sizes is incomplete.',
      '**Forgetting stack space.** A recursion that goes n deep uses O(n) space even if it allocates nothing. “O(1) space” and “recursive” rarely go together unless the recursion depth is bounded by a constant.',
      '**Dropping terms that aren’t dominated.** O(n + m) can’t be simplified to O(n) unless you know m ≤ n. And O(n · k) is not O(n) when k can be as large as n.',
      '**Mixing up value and size.** A loop that counts up to a number `n` is O(n) in the *value*, but the input is only about log n digits long. It rarely matters in an interview, but it explains why a primality check by trial division “O(√n)” is not considered polynomial in the input size.',
      '**Quoting the best or average case when asked for the worst.** Quicksort is O(n²) worst case; a hash lookup is O(n) worst case; say which you mean.',
      '**Language gotchas.** *Python:* `s += c` in a loop can be O(n²) (CPython often optimizes it, but it’s not guaranteed), so collect parts in a list and `"".join` them. *JavaScript:* `array.shift()` is O(n) in general, so use an index or a deque for a queue. *Java:* `s += c` in a loop copies the string every time, O(n²); use `StringBuilder`. *C++:* passing a `vector` or `string` **by value** copies it, O(n) per call, so pass by const reference.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of this function?',
        code: `def f(n):
    total = 0
    for i in range(n):
        for j in range(i):
            total += 1
    return total`, lang: 'py',
        choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'], answer: 2,
        explain: 'The inner loop runs 0, 1, 2, … n − 1 times, which adds up to n(n − 1)/2. Dropping the constant ½ and the lower-order term leaves O(n²). Halving the work is a constant factor, so it’s still quadratic.' },
      { kind: 'complexity', q: 'What is the time complexity of this function?',
        code: `def f(n):
    total = 0
    i = 1
    while i < n:
        for j in range(n):
            total += 1
        i *= 2
    return total`, lang: 'py',
        choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], answer: 1,
        explain: 'The outer loop doubles `i`, so it runs about log₂ n times. Each round does n steps of work. Multiply them: O(n log n).' },
      { kind: 'concept', q: 'A problem gives n ≤ 2 · 10⁵ and a 1-second limit. Which complexity should you aim for?',
        choices: ['O(n²)', 'O(n log n)', 'O(2ⁿ)', 'O(n³)'], answer: 1,
        explain: 'n² would be 4 · 10¹⁰ steps, hundreds of times over the roughly 10⁸ a second allows. n log₂ n is about 3.5 million. Target O(n log n) or better: sorting, a heap or binary search all fit.' },
      { kind: 'concept', q: 'Appending to a dynamic array doubles its capacity when full. What is the cost of one append, amortized?',
        choices: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 0,
        explain: 'The rare O(n) copy is paid for by the many cheap appends before it: n appends do under 2n element copies in total, so each is O(1) amortized. Growing by a fixed amount instead of doubling would not give this.' },
      { kind: 'concept', q: 'A recursive function calls itself once per level and goes n levels deep, doing O(1) other work at each level and allocating nothing. What are its time and extra space?',
        choices: ['O(n) time, O(1) space', 'O(n) time, O(n) space', 'O(n²) time, O(n) space', 'O(log n) time, O(log n) space'], answer: 1,
        explain: 'There are n calls, each constant work, so O(n) time. All n frames are on the call stack at the deepest point, so the stack alone is O(n) space.' },
      { kind: 'bug', q: 'This claims to reverse a string in O(n) time. What’s wrong with that claim?',
        code: `def reverse(s):
    out = []
    for ch in s:
        out.insert(0, ch)
    return "".join(out)`, lang: 'py',
        choices: ['`insert(0, ch)` shifts every element, so the loop is O(n²)', '`"".join` makes it O(n²)', 'Strings can’t be looped over in O(n)', 'Nothing: it is O(n)'], answer: 0,
        explain: 'Inserting at the front of a list moves every existing element one place right, which costs O(length so far). Over n insertions that’s O(n²). Append instead and reverse once at the end, or use `s[::-1]`.' },
      { kind: 'complexity', q: 'This looks like one loop. What’s its real time complexity?',
        code: `def has_pair(nums, target):
    for i in range(len(nums)):
        if target - nums[i] in nums[i + 1:]:
            return True
    return False`, lang: 'py',
        choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], answer: 2,
        explain: 'The slice `nums[i + 1:]` copies up to n elements, and `in` on a list scans up to n more. Both happen on every iteration, so the single loop is O(n²). A set of seen values turns it into O(n).' },
      { kind: 'pattern', q: 'Which of these are O(1) amortized or average? Pick every one that applies.',
        choices: ['Appending to a Python list', 'Looking up a key in a hash map', 'Removing the first element of a Python list', 'Checking whether a value is in a Python list'], answer: [0, 1],
        explain: 'Append (amortized) and hash lookup (average) are O(1). Removing from the front shifts everything, O(n), and `in` on a list scans it, O(n). Use a deque for front removal and a set for membership.' },
      { kind: 'concept', q: 'Which statement about Big-O is true?',
        choices: ['O(2n + 7) and O(n) are the same class', 'O(n²) is always faster than O(n) for small inputs', 'O(log n) base 2 grows faster than O(log n) base 10', 'A solution with O(n) space can’t also use O(n²) time'], answer: 0,
        explain: 'Big-O drops constants and lower-order terms. For small n a lower class can lose to a higher one with smaller constants, the base of a log is a constant factor, and time and space are independent measures.' },
      { kind: 'complexity', q: 'You merge two sorted arrays of lengths n and m into a new sorted array. What are the time and space?',
        choices: ['O(n + m) time, O(n + m) space', 'O(n · m) time, O(1) space', 'O(max(n, m)) time, O(1) space', 'O(n log m) time, O(n + m) space'], answer: 0,
        explain: 'Each element of both arrays is written to the output exactly once, so O(n + m) time, and the output array holds n + m values. Two inputs means two variables.' }
    ],

    flashcards: [
      { id: 'count-work', front: 'What does Big-O measure, and what does it deliberately ignore?', back: 'How the number of steps grows as the input grows. It ignores constants and lower-order terms, because they stop mattering once n is large.' },
      { id: 'budget', front: 'About how many simple steps fit in a one-second limit?', back: 'Roughly 10⁸ in a compiled language (C++, Java), nearer 10⁷ in Python. Compute n² or n log n for the limit and compare.' },
      { id: 'limit-1e5', front: 'n ≤ 10⁵: which complexity do you aim for?', back: 'O(n log n) or better. O(n²) would be 10¹⁰ steps, far over budget.' },
      { id: 'limit-20', front: 'n ≤ 20 (or about that): what does it allow?', back: 'Exponential work, O(2ⁿ): trying every subset or bitmask DP. About 10⁶ subsets at n = 20.' },
      { id: 'nested', front: 'How do you combine loops when counting work?', back: 'Add the costs of loops that run one after another; multiply the costs of loops nested inside each other; keep the biggest term.' },
      { id: 'halving', front: 'What kind of loop gives O(log n)?', back: 'One that repeatedly divides the remaining work: binary search halving a range, `k //= 2`, a digit loop (log₁₀ n), the height of a balanced tree.' },
      { id: 'amortized', front: 'What does “amortized O(1)” mean for a dynamic-array append?', back: 'Occasional O(n) copies are paid for by many cheap appends: n appends cost under 2n copies in total, with doubling. No randomness is involved.' },
      { id: 'stack-space', front: 'Does recursion count toward space complexity?', back: 'Yes. A recursion d calls deep holds d frames at once, so it uses O(d) stack space even if it allocates nothing.' },
      { id: 'hash-avg', front: 'Is a hash map lookup O(1)?', back: 'On average. In the worst case (everything collides) it degrades to O(n). Hashing a string key also costs its length.' },
      { id: 'hidden-linear', front: 'Name built-ins that hide an O(n) cost inside a loop.', back: '`x in list`, `list.pop(0)` / `insert(0, x)`, slicing, `array.shift()` in JS, `s += c` in Java, passing a vector or string by value in C++.' },
      { id: 'two-sizes', front: 'Merging two arrays of sizes n and m: time? Checking every pair across them?', back: 'Merge is O(n + m). Every cross pair is O(n · m). Keep both variables unless the problem says they’re equal.' },
      { id: 'tradeoff', front: 'Contains Duplicate: what are the time and space options?', back: 'Pairs: O(n²) time, O(1) space. Sort: O(n log n) time, O(1) extra space. Hash set: O(n) time, O(n) space.' }
    ],

    deeper: [
      { title: 'Big-O Cheat Sheet', url: 'https://www.bigocheatsheet.com/', time: 'reference', note: 'One page of growth curves plus the complexity of common operations on arrays, hash tables, trees and sorts. Print it, then learn to rebuild it from memory.' },
      { title: 'Introduction to Algorithms (MIT OpenCourseWare 6.006)', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/', time: 'lecture series', note: 'The first lectures cover asymptotic notation properly: Big-O, Omega and Theta, and how to analyze recurrences. Read this once you want the full theory behind the shorthand.' },
      { title: 'Algorithms (Khan Academy)', url: 'https://www.khanacademy.org/computing/computer-science/algorithms', time: 'about 1 hour', note: 'Gentle, visual lessons on asymptotic notation and why a binary search beats a linear one. Good if this page moved too fast.' },
      { title: 'Asymptotic Analysis (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/asymptotic-notation-and-analysis-based-on-input-size-of-algorithms/', time: 'about 15 min', note: 'A written walk-through of best, worst and average case and the three notations, with worked loop examples to practice counting on.' }
    ],

    detective: [
      { id: 'night-batch', decoys: ['sorting', 'arrays-hashing', 'binary-search'],
        statement: 'A logistics company runs a nightly job that compares every pair of delivery routes to flag overlapping ones. It finished in two minutes when the company had 500 routes. They now have 200,000, and the job is projected to take longer than the night itself. Before touching any code, the team wants to know roughly how much slower it will get, and what growth rate the new job must stay under.',
        why: 'The question is about how work grows with input size, not about a specific technique. Comparing every pair is quadratic, so 400 times more routes means about 160,000 times more work. The growth rate to aim for with 200,000 items is roughly n log n. That’s counting work and reading the input limit, the core of Big-O.' },
      { id: 'photo-gallery', decoys: ['sorting', 'recursion', 'heaps'],
        statement: 'A developer has two ways to look up a photo by its ID in a gallery app. One scans the whole list. The other keeps IDs in a sorted list and repeatedly checks the middle. A teammate says “the second one is just a constant faster.” The developer wants to explain, with numbers, why that’s wrong when the gallery grows from a thousand photos to a billion.',
        why: 'It’s a comparison of growth rates: a scan grows with n and a halving search grows with log n. A thousand photos is about 10 checks versus 1,000; a billion is about 30 versus a billion. Explaining why they aren’t the “same up to a constant” is exactly the difference between O(n) and O(log n).' },
      { id: 'memory-cap', decoys: ['arrays-hashing', 'recursion', 'sorting'],
        statement: 'A phone app must decide whether a list of one million contact IDs contains a repeat. The first prototype records every ID it has seen and answers quickly, but the app is crashing on older phones that don’t have much free memory. The team needs to describe both prototypes honestly, what each costs in running time and in memory, and pick one for the old phones.',
        why: 'The deciding factor is the trade between time and space. Remembering IDs spends O(n) memory to get O(n) time. Sorting in place spends O(n log n) time and almost no extra memory. Choosing between them means stating both complexities, which is the point of space analysis.' },
      { id: 'stack-crash', decoys: ['recursion', 'linked-lists', 'stacks'],
        statement: 'A reporting tool walks a company’s management chain with a function that calls itself once per level. It works for an org chart of a few hundred people. On a test file with a chain of 200,000 nested managers, it crashes with a stack error even though the machine has plenty of free memory. A new hire asks why it fails and how much memory the approach really needs.',
        why: 'The memory isn’t used by data; it’s the pending calls. A recursion n levels deep keeps n frames alive, so it needs O(n) stack space and hits a fixed stack limit first. Spotting that hidden space cost is the call-stack part of complexity analysis.' },
      { id: 'cheap-until-not', decoys: ['arrays-hashing', 'sliding-window', 'queues'],
        statement: 'A chat app keeps messages in a growing array. Adding a message is nearly instant, but once in a while the whole array is copied into a bigger one and that single add takes a visible hiccup. The product manager wants to know whether the app can promise “each message takes a constant amount of time to store” over a long day with millions of messages, or whether the hiccups add up.',
        why: 'It asks for the average cost of an operation across a long run when a few are expensive: amortized analysis. With the buffer doubling each time, the copies add up to less than twice the number of messages, so each add is O(1) amortized even though single adds can be O(n).' }
    ]
  });
})();
