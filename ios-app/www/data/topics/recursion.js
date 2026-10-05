/* Offer Ready: Recursion lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'recursion',

    hook: 'Recursion is the habit of saying “if I could solve a slightly smaller version of this, I’d be done.” Trees, backtracking, divide and conquer, memoization and most dynamic programming all start here, so interviewers use a small recursion question to see whether you can name a **base case**, shrink the input and trust the call. It is also where candidates meet their first stack overflow.',

    cues: [
      'The problem **contains a smaller copy of itself**: a list is a head plus a shorter list, a tree is a node plus two subtrees, a number n is built from n − 1.',
      'You can write the answer for the **smallest input** by hand (an empty list, a single node, n = 0) and extend it by one step.',
      'The structure is nested to an unknown depth: folders in folders, brackets in brackets, a tree of any shape.',
      'The input can be **split in halves** and the halves combined (merge sort, max of a range, fast power).',
      'A first recursive attempt is slow because the **same call repeats**. That’s the cue to add a cache (memoization), the doorway to dynamic programming.',
      'The trap: recursion depth equals input size. A list of 100,000 elements can overflow the stack in Python or JavaScript, so ask about limits and switch to a loop or an explicit stack when the depth can be large.'
    ],

    intuition: [
      'Think of a queue of people, and you want to know your position. You can’t see the front, so you ask the person ahead: “what’s your position?” They ask the one ahead of them, and so on, until the first person says “I’m number 1.” Then the answers travel back: 2, 3, 4, and finally yours. Nobody did anything clever. Each person did one small step and trusted the person ahead.',
      'That’s the whole pattern. A recursive function has two parts:',
      '1. **A base case**: an input so small you can answer it directly. It is what stops the recursion.\n2. **A recursive case**: solve a *smaller* input by calling yourself, then combine the result with one small step of your own.',
      'Every call gets its own **stack frame**: its own copy of the parameters and local variables, kept until the call returns. Calls pile up as you go deeper, then unwind as answers return. If the pile gets too tall, the program crashes with a stack overflow, which is exactly what happens when the base case is missing or never reached.',
      'Drawing the calls as a **recursion tree** shows the cost. A node is one call, its children are the calls it makes. Total work is the number of nodes times the work per node; the stack depth is the longest path from root to a leaf. For `fib(n) = fib(n-1) + fib(n-2)` the tree doubles at nearly every level, so the same `fib(3)` is computed again and again. **Memoization** stores each answer the first time and returns it on every later call, so each distinct input runs once. Watch it happen in the visualizer: turn the cache on and the tree collapses from exponential to linear.'
    ].join('\n\n'),

    viz: 'recursion-tree',

    template: {
      title: 'Recursion with a base case and a cache (memoization)',
      note: 'To reuse it, change three things: **the state** (here a single number `k`, and it must identify the subproblem), **the base case**, and **the combine step** on the `split` line. The `hit` lines are the memoization: delete them and you get plain recursion, with the exponential tree you saw. Always check the cache *first*, then the base case, then recurse, and store the answer before you return.',
      code: {
        py: `def fib(n):
    memo = {}
    def solve(k):                                  #@call > One call = one new frame on the call stack
        if k in memo:                              #@hit > Seen this input before? Return the stored answer
            return memo[k]
        if k < 2:                                  #@base > Base case: small enough to answer directly
            return k
        memo[k] = solve(k - 1) + solve(k - 2)      #@split > Trust the smaller calls, combine their answers
        return memo[k]                             #@ret > The answer is stored, then handed to the caller
    return solve(n)`,
        js: `function fib(n) {
  const memo = new Map();
  function solve(k) {                              //@call > One call = one new frame on the call stack
    if (memo.has(k)) return memo.get(k);           //@hit > Seen this input before? Return the stored answer
    if (k < 2) return k;                           //@base > Base case: small enough to answer directly
    const v = solve(k - 1) + solve(k - 2);         //@split > Trust the smaller calls, combine their answers
    memo.set(k, v);
    return v;                                      //@ret > The answer is stored, then handed to the caller
  }
  return solve(n);
}`,
        java: `class Solution {
    public int fib(int n) {
        return solve(n, new HashMap<>());
    }

    private int solve(int k, Map<Integer, Integer> memo) {   //@call > One call = one new frame on the call stack
        if (memo.containsKey(k)) return memo.get(k);          //@hit > Seen this input before? Return the stored answer
        if (k < 2) return k;                                  //@base > Base case: small enough to answer directly
        int v = solve(k - 1, memo) + solve(k - 2, memo);      //@split > Trust the smaller calls, combine their answers
        memo.put(k, v);
        return v;                                             //@ret > The answer is stored, then handed to the caller
    }
}`,
        cpp: `class Solution {
public:
    int fib(int n) {
        unordered_map<int, int> memo;
        return solve(n, memo);
    }

private:
    int solve(int k, unordered_map<int, int>& memo) {         //@call > One call = one new frame on the call stack
        if (memo.count(k)) return memo[k];                    //@hit > Seen this input before? Return the stored answer
        if (k < 2) return k;                                  //@base > Base case: small enough to answer directly
        int v = solve(k - 1, memo) + solve(k - 2, memo);      //@split > Trust the smaller calls, combine their answers
        memo[k] = v;
        return v;                                             //@ret > The answer is stored, then handed to the caller
    }
};`
      },
      tests: { fn: { py: 'fib', default: 'fib' }, sig: { args: ['int'] }, cases: [
        { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [2], out: 1 }, { args: [10], out: 55 }, { args: [20], out: 6765 }, { args: [30], out: 832040 }] }
    },

    complexity: {
      time: 'O(branches^depth) plain; O(states × work per state) with a cache',
      space: 'O(depth) for the stack, plus the cache',
      why: 'Count the nodes of the recursion tree and multiply by the work done in each. Plain `fib(n)` makes two calls per node, so the tree has about φⁿ nodes (φ ≈ 1.618; 2ⁿ is the easy upper bound): exponential. With a cache, each distinct input `k` from 0 to n runs its body once and every other visit is an O(1) lookup, so the tree has about 2n nodes: O(n) time. Space is the **stack depth**, the longest root-to-leaf path (n here), plus the cache (n entries). A recursion that halves its input each time, like fast power or binary search, has depth O(log n).',
      trap: 'Recursive space is never free. A “no extra memory” recursive solution still uses O(depth) stack, and interviewers will ask. For a linked list of n nodes that’s O(n); for a balanced tree O(log n); for a skewed tree O(n). Also remember a cache only helps when subproblems **repeat**: merge sort’s halves never overlap, so memoizing it would only waste memory.'
    },

    variations: [
      {
        name: 'Divide and conquer: split in halves',
        body: 'Instead of shrinking by one, cut the input in **half**, solve each half, and combine. The tree is only O(log n) deep and the halves don’t overlap, so no cache is needed. The combine step decides the cost: constant here (taking a max), linear in merge sort (merging two sorted halves, see [Sorting](#/topic/sorting)). In practice you’d just write a loop for a max; the shape is what matters.',
        code: {
          py: `def max_split(nums):
    def best(lo, hi):                         # the largest of nums[lo:hi]
        if hi - lo == 1:                      #> Base case: one element
            return nums[lo]
        mid = (lo + hi) // 2
        return max(best(lo, mid), best(mid, hi))   #> Solve each half, then combine
    return best(0, len(nums))`,
          js: `function maxSplit(nums) {
  function best(lo, hi) {                     // the largest of nums[lo..hi)
    if (hi - lo === 1) return nums[lo];       //> Base case: one element
    const mid = Math.floor((lo + hi) / 2);
    return Math.max(best(lo, mid), best(mid, hi));   //> Solve each half, then combine
  }
  return best(0, nums.length);
}`
        },
        tests: { fn: { py: 'max_split', default: 'maxSplit' }, cases: [
          { args: [[3, 1, 4, 1, 5, 9, 2, 6]], out: 9 }, { args: [[7]], out: 7 }, { args: [[-5, -2, -9]], out: -2 }, { args: [[2, 8]], out: 8 }] }
      },
      {
        name: 'Recursion to iteration: bottom-up',
        body: 'When the subproblems only depend on **smaller** ones, you can run the recursion backwards: compute the base cases first and build up to n with a loop. No stack, no recursion limit, and usually less memory, because you can often keep only the last few values. This is what dynamic programming tabulation means. Rule of thumb: write the recursion first to get the logic right, then convert if the depth or the space matters.',
        code: {
          py: `def fib_loop(n):
    a, b = 0, 1                      #> F(0) and F(1): the base cases come first
    for _ in range(n):
        a, b = b, a + b              #> Slide the pair forward: no stack, O(1) space
    return a`,
          js: `function fibLoop(n) {
  let a = 0, b = 1;                  //> F(0) and F(1): the base cases come first
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b];             //> Slide the pair forward: no stack, O(1) space
  }
  return a;
}`,
          java: `class Solution {
    public int fibLoop(int n) {
        int a = 0, b = 1;                  //> F(0) and F(1): the base cases come first
        for (int i = 0; i < n; i++) {
            int next = a + b;              //> Slide the pair forward: no stack, O(1) space
            a = b;
            b = next;
        }
        return a;
    }
}`,
          cpp: `class Solution {
public:
    int fibLoop(int n) {
        int a = 0, b = 1;                  //> F(0) and F(1): the base cases come first
        for (int i = 0; i < n; i++) {
            int next = a + b;              //> Slide the pair forward: no stack, O(1) space
            a = b;
            b = next;
        }
        return a;
    }
};`
        },
        tests: { fn: { py: 'fib_loop', default: 'fibLoop' }, sig: { args: ['int'] }, cases: [
          { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [2], out: 1 }, { args: [10], out: 55 }, { args: [30], out: 832040 }] }
      },
      {
        name: 'Recursion to iteration: an explicit stack',
        body: 'Some recursions can’t be turned into a plain loop: nested structures, trees, depth-first search. Keep the stack yourself instead. Push the work that is still waiting, pop one piece at a time, and push the pieces it creates. You get the same traversal, but the limit is memory, not the language’s call-stack size. This version adds up a list nested to any depth; the recursive version would call itself on every inner list.',
        code: {
          py: `def nested_sum(items):
    total, stack = 0, [items]              #> The stack of lists still to visit replaces the call stack
    while stack:
        for x in stack.pop():
            if isinstance(x, list):
                stack.append(x)            #> A smaller piece of the problem: visit it later
            else:
                total += x
    return total`,
          js: `function nestedSum(items) {
  let total = 0;
  const stack = [items];                   //> The stack of lists still to visit replaces the call stack
  while (stack.length) {
    for (const x of stack.pop()) {
      if (Array.isArray(x)) stack.push(x); //> A smaller piece of the problem: visit it later
      else total += x;
    }
  }
  return total;
}`
        },
        tests: { fn: { py: 'nested_sum', default: 'nestedSum' }, cases: [
          { args: [[1, [2, [3]], 4]], out: 10 }, { args: [[]], out: 0 }, { args: [[[[[5]]]]], out: 5 }, { args: [[[1, 2], [3, [4, [5]]]]], out: 15 }] }
      },
      {
        name: 'Stack-overflow limits, by language',
        body: 'Every call costs a frame, and every language has a ceiling. The numbers below are typical defaults, not guarantees: frame size, platform and version all move them.\n\n- **Python:** `sys.getrecursionlimit()` is **1000** by default, and deeper calls raise `RecursionError`. `sys.setrecursionlimit(10**6)` lifts the check, but a really deep recursion can then crash the interpreter (a real C-stack overflow), so it is a stopgap, not a fix.\n- **JavaScript:** no fixed number; Node (V8) allows roughly **10,000 to 12,000** simple frames with its default stack of about 1 MB, then throws `RangeError: Maximum call stack size exceeded`.\n- **Java:** the thread stack is typically 512 KB to 1 MB, which is roughly **10,000 to 20,000** simple frames before `StackOverflowError`. You can give a thread a bigger stack: `new Thread(null, task, "big", 1L << 28)`.\n- **C++:** **no check at all.** The main thread has about 8 MB on Linux and 1 MB on Windows, which is tens of thousands of small frames; past that it’s undefined behavior, usually a segfault, with no exception to catch.\n\nIn an interview, ask “how large can the depth get?” If it can reach about 10⁵ (a linked list of 100,000 nodes, a path-shaped tree), say you’ll use a loop or an explicit stack. Mention that none of these four languages guarantees **tail-call optimization**, so rewriting to a tail call doesn’t save you.'
      },
      {
        name: 'Overlapping vs non-overlapping subproblems',
        body: 'A quick way to choose the technique: do the subproblems **repeat**? If the recursion tree has the same node many times (Fibonacci, climbing stairs, “can I reach the end”), add a cache and you’ve met [1-D dynamic programming](#/topic/dp-1d). If each subproblem is distinct (halves of an array, subtrees of a tree), plain recursion is already optimal. If you must enumerate every choice and undo it, that’s [backtracking](#/topic/backtracking).'
      }
    ],

    worked: [
      {
        lc: 509,
        restate: 'The Fibonacci numbers start F(0) = 0, F(1) = 1, and each later one is the sum of the two before it. Given n, return F(n).',
        examples: '- `n = 2` → 1.\n- `n = 3` → 2.\n- `n = 4` → 3.\n- Edge cases: `n = 0` → 0 and `n = 1` → 1 are the base cases. LeetCode caps n at 30, but real interviewers will ask “what if n is 10⁹?”',
        brute: 'Write the definition directly: `fib(n) = fib(n-1) + fib(n-2)`. Each call makes two more, so the tree has about 1.6ⁿ nodes: fine for n = 30 (about 1.6 million calls), hopeless for n = 50. The same `fib(k)` is recomputed over and over.',
        insight: 'Two upgrades. A **cache** makes each `fib(k)` run once: O(n) time and O(n) stack. Better, use the **doubling identities**: from `a = F(m)` and `b = F(m + 1)` you get `F(2m) = a·(2b − a)` and `F(2m + 1) = a² + b²`. So one call on `n // 2` gives the pair for `n`: the recursion halves its input, O(log n) time and depth. Return the pair `(F(k), F(k+1))` so the base case is `k = 0` → `(0, 1)`.',
        code: {
          py: `class Solution:
    def fib(self, n: int) -> int:
        def pair(k):                       # returns (F(k), F(k + 1))
            if k == 0:
                return (0, 1)              # base case
            a, b = pair(k // 2)            # the pair for half of k
            c = a * (2 * b - a)            # F(2m)
            d = a * a + b * b              # F(2m + 1)
            return (d, c + d) if k % 2 else (c, d)
        return pair(n)[0]`,
          js: `function fib(n) {
  function pair(k) {                       // returns [F(k), F(k + 1)]
    if (k === 0) return [0, 1];            // base case
    const [a, b] = pair(Math.floor(k / 2)); // the pair for half of k
    const c = a * (2 * b - a);             // F(2m)
    const d = a * a + b * b;               // F(2m + 1)
    return k % 2 ? [d, c + d] : [c, d];
  }
  return pair(n)[0];
}`,
          java: `class Solution {
    public int fib(int n) {
        return pair(n)[0];
    }

    private int[] pair(int k) {              // returns {F(k), F(k + 1)}
        if (k == 0) return new int[]{0, 1};  // base case
        int[] p = pair(k / 2);               // the pair for half of k
        int a = p[0], b = p[1];
        int c = a * (2 * b - a);             // F(2m)
        int d = a * a + b * b;               // F(2m + 1)
        return k % 2 == 1 ? new int[]{d, c + d} : new int[]{c, d};
    }
}`,
          cpp: `class Solution {
public:
    int fib(int n) {
        return pairOf(n).first;
    }

private:
    pair<int, int> pairOf(int k) {             // returns {F(k), F(k + 1)}
        if (k == 0) return {0, 1};           // base case
        auto p = pairOf(k / 2);              // the pair for half of k
        int a = p.first, b = p.second;
        int c = a * (2 * b - a);             // F(2m)
        int d = a * a + b * b;               // F(2m + 1)
        return k % 2 ? make_pair(d, c + d) : make_pair(c, d);
    }
};`
        },
        complexity: 'O(log n) time and O(log n) stack: each call halves k. (For a very large n the numbers themselves grow, so the arithmetic isn’t constant time, but for n ≤ 30 everything fits an int.)',
        say: '“The direct recursion is exponential because it recomputes the same values. I could memoize it for O(n), or run it as a loop for O(n) time and O(1) space. For something faster I’d use the doubling identities: F(2m) and F(2m+1) come from F(m) and F(m+1), so the recursion halves n and I get O(log n).”',
        followups: [
          { q: 'Which would you write first in an interview?', a: 'The memoized recursion or the two-variable loop. Both are O(n), obviously correct, and quick to write. Mention doubling as the faster option and implement it only if asked: it’s easy to slip on an identity under pressure.' },
          { q: 'Why does the pair-returning version avoid repeated work?', a: 'The plain recursion calls `fib(k-1)` and `fib(k-2)`, which overlap. Returning `(F(k), F(k+1))` hands the caller both values it needs from a **single** call, so there’s one recursive call per level instead of two.' },
          { q: 'What if n were 10⁹ and the answer is wanted mod 1,000,000,007?', a: 'The same doubling recursion with `% mod` after each multiplication: 30 levels deep. In Java or C++ use `long` for the products.' }
        ]
      },
      {
        lc: 50,
        restate: 'Given a real number x and an integer n (possibly negative), return x raised to the power n.',
        examples: '- `x = 2.0, n = 10` → 1024.0.\n- `x = 2.1, n = 3` → 9.261.\n- `x = 2.0, n = -2` → 0.25.\n- Edge cases: `n = 0` → 1; a negative `n` means 1 / x^|n|; `n` can be −2³¹, and negating it overflows a 32-bit int.',
        brute: 'Multiply x by itself n times: O(n) multiplications, and n can be about 2 billion. Too slow.',
        insight: 'Halve the exponent. `x^n = (x^(n/2))²`, and when n is odd there’s one extra factor of x. One recursive call on `n // 2` replaces half of all the multiplications, so the depth is about log₂ n (31 levels at most). Compute the half **once** and square it; calling `power(x, n/2)` twice would bring the exponential tree back. For a negative n, compute with |n| and take the reciprocal.',
        code: {
          py: `class Solution:
    def myPow(self, x: float, n: int) -> float:
        def power(b, e):                   # e >= 0
            if e == 0:
                return 1.0                 # base case
            half = power(b, e // 2)        # computed once, then squared
            return half * half * (b if e % 2 else 1.0)
        return power(x, n) if n >= 0 else 1.0 / power(x, -n)`,
          js: `function myPow(x, n) {
  function power(b, e) {                   // e >= 0
    if (e === 0) return 1;                 // base case
    const half = power(b, Math.floor(e / 2));  // computed once, then squared
    return half * half * (e % 2 ? b : 1);
  }
  return n >= 0 ? power(x, n) : 1 / power(x, -n);
}`,
          java: `class Solution {
    public double myPow(double x, int n) {
        long e = n;                          // long, so -n can't overflow
        return e >= 0 ? power(x, e) : 1.0 / power(x, -e);
    }

    private double power(double b, long e) { // e >= 0
        if (e == 0) return 1.0;              // base case
        double half = power(b, e / 2);       // computed once, then squared
        return half * half * (e % 2 == 1 ? b : 1.0);
    }
}`,
          cpp: `class Solution {
public:
    double myPow(double x, int n) {
        long long e = n;                     // long long, so -n can't overflow
        return e >= 0 ? power(x, e) : 1.0 / power(x, -e);
    }

private:
    double power(double b, long long e) {    // e >= 0
        if (e == 0) return 1.0;              // base case
        double half = power(b, e / 2);       // computed once, then squared
        return half * half * (e % 2 ? b : 1.0);
    }
};`
        },
        complexity: 'O(log |n|) time and O(log |n|) stack. About 31 frames at most, well under every language’s limit.',
        say: '“Multiplying n times is O(n). Instead I use x^n = (x^(n/2))², with one more x when n is odd, so I recurse on half the exponent: O(log n) time and depth. I compute the half once and square it. For a negative exponent I compute with the absolute value in a wider integer type, because negating −2³¹ overflows, and return the reciprocal.”',
        followups: [
          { q: 'Why store `half` instead of writing `power(b, e/2) * power(b, e/2)`?', a: 'Two calls per level give 2^depth = n calls again, which is the brute force. One call plus one multiplication keeps it at O(log n).' },
          { q: 'Can you do it without recursion?', a: 'Yes. Loop over the bits of the exponent: keep a running base that squares each step, and multiply it into the result when the current bit is 1. O(log n) time and O(1) space, so it’s the answer if the interviewer wants constant space.' },
          { q: 'What about x = 0 with a negative n?', a: 'That’s a division by zero, so it’s undefined; ask what to return. LeetCode guarantees it won’t happen.' }
        ]
      },
      {
        lc: 206,
        restate: 'Given the head of a singly linked list, reverse it and return the new head. Do it recursively.',
        examples: '- `1→2→3→4→5` gives `5→4→3→2→1`.\n- `1→2` gives `2→1`.\n- Edge cases: an empty list (return null) and a single node (return it).',
        brute: 'Copy the values into an array, reverse it and rebuild the list: O(n) time but O(n) extra nodes or values, and it ignores the point of the exercise.',
        insight: 'Trust the call. Suppose `reverseList(head.next)` already reversed everything after the head and returned its new head. Then `head.next` is now the **tail** of that reversed part, so one more step finishes the job: point `head.next.next` back at `head`, and cut `head.next` so the old head becomes the new tail. The base case is a list of zero or one node, which is its own reverse. The new head never changes as the answers come back up.',
        code: {
          py: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if head is None or head.next is None:
            return head                    # base case: already reversed
        new_head = self.reverseList(head.next)   # reverses everything after head
        head.next.next = head              # the old successor now points back at head
        head.next = None                   # head becomes the tail
        return new_head`,
          js: `function reverseList(head) {
  if (head === null || head.next === null) return head;  // base case: already reversed
  const newHead = reverseList(head.next);  // reverses everything after head
  head.next.next = head;                   // the old successor now points back at head
  head.next = null;                        // head becomes the tail
  return newHead;
}`,
          java: `class Solution {
    public ListNode reverseList(ListNode head) {
        if (head == null || head.next == null) return head;  // base case: already reversed
        ListNode newHead = reverseList(head.next);  // reverses everything after head
        head.next.next = head;               // the old successor now points back at head
        head.next = null;                    // head becomes the tail
        return newHead;
    }
}`,
          cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        if (head == nullptr || head->next == nullptr) return head;  // base case: already reversed
        ListNode* newHead = reverseList(head->next);  // reverses everything after head
        head->next->next = head;             // the old successor now points back at head
        head->next = nullptr;                // head becomes the tail
        return newHead;
    }
};`
        },
        complexity: 'O(n) time. O(n) space for the call stack: one frame per node. The loop version in [Linked lists](#/topic/linked-lists) is O(1) space.',
        say: '“I assume the recursive call reverses everything after the head and returns the new head. Then head.next is that part’s tail, so I set head.next.next to head and clear head.next. The base case is an empty or one-node list. It’s O(n) time but O(n) stack, so for long lists I’d use the iterative version, which is O(1) space.”',
        followups: [
          { q: 'What breaks if you forget `head.next = None`?', a: 'The old head still points at its old successor, which now points back at it: a two-node cycle at the tail. Printing the list loops forever.' },
          { q: 'Is there a depth problem?', a: 'One frame per node, so a list of 5,000 nodes needs 5,000 frames. That is over Python’s default limit of 1000 (LeetCode raises it for you; a plain script doesn’t). For long lists, use the loop.' },
          { q: 'Can you reverse only part of the list?', a: 'Yes: recurse until the left boundary, reverse the next `right − left + 1` nodes, and reconnect. The iterative version with a dummy head is usually less error-prone.' }
        ]
      },
      {
        lc: 21,
        restate: 'You get the heads of two sorted linked lists. Merge them into one sorted list by relinking the existing nodes, and return its head. Do it recursively.',
        examples: '- `[1,2,4]` and `[1,3,4]` → `[1,1,2,3,4,4]`.\n- `[]` and `[]` → `[]`.\n- `[]` and `[0]` → `[0]`.\n- Edge cases: one list runs out first; equal values from both lists.',
        brute: 'Dump both lists into an array, sort it and rebuild: O(n log n) time and extra memory, and it wastes the fact that both inputs are already sorted.',
        insight: 'The smallest node overall is one of the two **heads**. Take it, then the rest of the answer is “merge what’s left of both lists”: the same problem, one node smaller. So compare the heads, keep the smaller one, point its `next` at the merge of the remaining lists, and return it. The base case: if either list is empty, the answer is the other list, which is already sorted and needs no copying.',
        code: {
          py: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        if list1 is None:
            return list2                   # base case: nothing left to merge
        if list2 is None:
            return list1
        if list1.val <= list2.val:         # <= keeps the merge stable
            list1.next = self.mergeTwoLists(list1.next, list2)
            return list1
        list2.next = self.mergeTwoLists(list1, list2.next)
        return list2`,
          js: `function mergeTwoLists(list1, list2) {
  if (list1 === null) return list2;        // base case: nothing left to merge
  if (list2 === null) return list1;
  if (list1.val <= list2.val) {            // <= keeps the merge stable
    list1.next = mergeTwoLists(list1.next, list2);
    return list1;
  }
  list2.next = mergeTwoLists(list1, list2.next);
  return list2;
}`,
          java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        if (list1 == null) return list2;     // base case: nothing left to merge
        if (list2 == null) return list1;
        if (list1.val <= list2.val) {        // <= keeps the merge stable
            list1.next = mergeTwoLists(list1.next, list2);
            return list1;
        }
        list2.next = mergeTwoLists(list1, list2.next);
        return list2;
    }
}`,
          cpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        if (list1 == nullptr) return list2;  // base case: nothing left to merge
        if (list2 == nullptr) return list1;
        if (list1->val <= list2->val) {      // <= keeps the merge stable
            list1->next = mergeTwoLists(list1->next, list2);
            return list1;
        }
        list2->next = mergeTwoLists(list1, list2->next);
        return list2;
    }
};`
        },
        complexity: 'O(m + n) time: each call places one node. O(m + n) stack in the worst case, because there is one frame per node placed. The iterative merge with a dummy head is O(1) space.',
        say: '“The smallest node is one of the two heads. I keep it and set its next to the merge of the rest, so it’s the same problem with one fewer node. If a list is empty, I return the other. It’s O(m + n) time. The recursion uses O(m + n) stack, so if the lists can be long I’d switch to the iterative version with a dummy node, which uses O(1).”',
        followups: [
          { q: 'Why is `list1.val <= list2.val` and not `<`?', a: 'Either gives a sorted result. With `<=`, equal values keep list1’s node first, which makes the merge stable: needed when the lists hold records and the order of equal keys matters.' },
          { q: 'How would you merge k sorted lists?', a: 'Merge them pairwise (divide and conquer, O(N log k)) or use a min-heap of the k current heads (also O(N log k)). Repeated one-by-one merging is O(N·k).' },
          { q: 'How deep does the recursion go?', a: 'Up to m + n frames, if the lists alternate (every call places one node). On long lists, use the loop.' }
        ]
      }
    ],

    practice: [
      { lc: 344,
        hints: ['Swap the first and last characters, then do the same for the pair just inside them.', 'You need two indices, `i` from the front and `j` from the back. Stop when they meet.', 'A recursive helper would be n/2 frames deep: too deep for Python at n = 10⁵. A loop does the same swaps with no stack.'],
        solution: { explain: 'The recursion is “swap the ends, then reverse the middle”. That middle call could be n/2 frames deep (50,000 at the limit), which overflows Python and risks JavaScript, so the production answer is the same idea as a loop. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def reverseString(self, s: List[str]) -> None:
        i, j = 0, len(s) - 1
        while i < j:
            s[i], s[j] = s[j], s[i]
            i += 1
            j -= 1`,
          js: `function reverseString(s) {
  let i = 0, j = s.length - 1;
  while (i < j) {
    [s[i], s[j]] = [s[j], s[i]];
    i++;
    j--;
  }
}` } },
        starter: { py: 'class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        ', js: 'function reverseString(s) {\n  \n}' },
        tests: { fn: 'reverseString', inPlace: 0, cases: [
          { args: [['h', 'e', 'l', 'l', 'o']], out: ['o', 'l', 'l', 'e', 'h'] }, { args: [['H', 'a', 'n', 'n', 'a', 'h']], out: ['h', 'a', 'n', 'n', 'a', 'H'] }, { args: [['a']], out: ['a'] }, { args: [['a', 'b']], out: ['b', 'a'] }] } },

      { lc: 24,
        hints: ['Look at the first two nodes. Swapping them leaves the rest of the list, which is the same problem again.', 'Base case: fewer than two nodes means nothing to swap.', 'Let `second = head.next`. Point `head.next` at the swapped rest (recurse on `second.next`), point `second.next` at `head`, and return `second`.'],
        solution: { explain: 'Swap the first pair, and let the recursive call swap everything after it. The second node becomes the new head of this piece. O(n) time, O(n) stack (n/2 frames); a dummy-head loop is O(1) space.', code: {
          py: `class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if head is None or head.next is None:
            return head
        second = head.next
        head.next = self.swapPairs(second.next)
        second.next = head
        return second`,
          js: `function swapPairs(head) {
  if (head === null || head.next === null) return head;
  const second = head.next;
  head.next = swapPairs(second.next);
  second.next = head;
  return second;
}` } },
        starter: { py: 'class Solution:\n    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function swapPairs(head) {\n  \n}' },
        tests: { fn: 'swapPairs', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4]], out: [2, 1, 4, 3] }, { args: [[]], out: null }, { args: [[1]], out: [1] }, { args: [[1, 2, 3]], out: [2, 1, 3] }, { args: [[1, 2]], out: [2, 1] }] } },

      { lc: 104,
        hints: ['The depth of a tree is one more than the depth of its deeper child.', 'Base case: an empty tree has depth 0.', 'Return `1 + max(depth(left), depth(right))`.'],
        solution: { explain: 'A tree is a node plus two smaller trees, so the depth is 1 plus the larger of their depths. O(n) time, O(h) stack for a tree of height h.', code: {
          py: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if root is None:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
          js: `function maxDepth(root) {
  if (root === null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}` } },
        starter: { py: 'class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ', js: 'function maxDepth(root) {\n  \n}' },
        tests: { fn: 'maxDepth', argTypes: ['tree'], cases: [
          { args: [[3, 9, 20, null, null, 15, 7]], out: 3 }, { args: [[1, null, 2]], out: 2 }, { args: [[]], out: 0 }, { args: [[1]], out: 1 }, { args: [[1, 2, 3, 4, null, null, 5]], out: 3 }] } },

      { lc: 1137,
        hints: ['It’s Fibonacci with three terms. Doing it the naive recursive way branches three ways and repeats work.', 'Each value needs only the previous three, so you don’t need a table.', 'Keep `a, b, c` for T(i−2), T(i−1), T(i)... and slide them forward, `a, b, c = b, c, a + b + c`.'],
        solution: { explain: 'Bottom-up: start from the three base values and roll them forward n − 2 times. O(n) time, O(1) space. (Memoizing the recursion gives the same time with O(n) space.)', code: {
          py: `class Solution:
    def tribonacci(self, n: int) -> int:
        if n < 2:
            return n
        a, b, c = 0, 1, 1
        for _ in range(n - 2):
            a, b, c = b, c, a + b + c
        return c`,
          js: `function tribonacci(n) {
  if (n < 2) return n;
  let a = 0, b = 1, c = 1;
  for (let i = 0; i < n - 2; i++) [a, b, c] = [b, c, a + b + c];
  return c;
}` } },
        starter: { py: 'class Solution:\n    def tribonacci(self, n: int) -> int:\n        ', js: 'function tribonacci(n) {\n  \n}' },
        tests: { fn: 'tribonacci', cases: [
          { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [2], out: 1 }, { args: [3], out: 2 }, { args: [4], out: 4 }, { args: [25], out: 1389537 }, { args: [37], out: 2082876103 }] } },

      { lc: 779,
        hints: ['Each digit in row n comes from one digit in row n − 1. Which one, for position k?', 'Position k in row n comes from position `(k + 1) // 2` in row n − 1. An odd k is the first child (same digit), an even k the second (the opposite digit).', 'Base case: row 1 is 0. Recurse on the parent and flip when k is even.'],
        solution: { explain: 'Walk up to the parent instead of building rows (which are 2ⁿ⁻¹ long). One call per row: O(n) time, O(n) stack. Equivalent closed form: the answer is the parity of the number of 1 bits in `k − 1`.', code: {
          py: `class Solution:
    def kthGrammar(self, n: int, k: int) -> int:
        if n == 1:
            return 0
        parent = self.kthGrammar(n - 1, (k + 1) // 2)
        return parent if k % 2 else 1 - parent`,
          js: `function kthGrammar(n, k) {
  if (n === 1) return 0;
  const parent = kthGrammar(n - 1, Math.floor((k + 1) / 2));
  return k % 2 ? parent : 1 - parent;
}` } },
        starter: { py: 'class Solution:\n    def kthGrammar(self, n: int, k: int) -> int:\n        ', js: 'function kthGrammar(n, k) {\n  \n}' },
        tests: { fn: 'kthGrammar', cases: [
          { args: [1, 1], out: 0 }, { args: [2, 1], out: 0 }, { args: [2, 2], out: 1 }, { args: [3, 3], out: 1 }, { args: [4, 5], out: 1 }, { args: [4, 8], out: 1 }, { args: [5, 12], out: 1 }, { args: [30, 536870912], out: 1 }] } },

      { lc: 112,
        hints: ['A path to a leaf in the whole tree is a path to a leaf in one of its subtrees, with the node’s value used up.', 'At each node, subtract its value from the target and ask both children about the remainder.', 'Only a **leaf** (no children) can end a path: there, check whether the remainder is exactly 0. An empty tree is false.'],
        solution: { explain: 'Subtract as you descend. At a leaf the remaining target must be zero; otherwise either child may succeed. O(n) time, O(h) stack, and `or` stops as soon as one side says true.', code: {
          py: `class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if root is None:
            return False
        rest = targetSum - root.val
        if root.left is None and root.right is None:
            return rest == 0
        return self.hasPathSum(root.left, rest) or self.hasPathSum(root.right, rest)`,
          js: `function hasPathSum(root, targetSum) {
  if (root === null) return false;
  const rest = targetSum - root.val;
  if (root.left === null && root.right === null) return rest === 0;
  return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
}` } },
        starter: { py: 'class Solution:\n    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:\n        ', js: 'function hasPathSum(root, targetSum) {\n  \n}' },
        tests: { fn: 'hasPathSum', argTypes: ['tree'], cases: [
          { args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], 22], out: true }, { args: [[1, 2, 3], 5], out: false }, { args: [[], 0], out: false },
          { args: [[1, 2], 1], out: false }, { args: [[1], 1], out: true }, { args: [[-2, null, -3], -5], out: true }] } },

      { lc: 938,
        hints: ['You could visit every node and add the ones in range, which is correct but ignores the BST order.', 'If a node’s value is below `low`, nothing in its left subtree can be in range.', 'Symmetrically, if it is above `high`, skip the right subtree. Otherwise add the node and go both ways.'],
        solution: { explain: 'Use the search-tree order to skip whole subtrees that can’t hold a value in range. O(n) worst case (the range covers everything), O(h + answer size) typically, O(h) stack.', code: {
          py: `class Solution:
    def rangeSumBST(self, root: Optional[TreeNode], low: int, high: int) -> int:
        if root is None:
            return 0
        if root.val < low:
            return self.rangeSumBST(root.right, low, high)
        if root.val > high:
            return self.rangeSumBST(root.left, low, high)
        return root.val + self.rangeSumBST(root.left, low, high) + self.rangeSumBST(root.right, low, high)`,
          js: `function rangeSumBST(root, low, high) {
  if (root === null) return 0;
  if (root.val < low) return rangeSumBST(root.right, low, high);
  if (root.val > high) return rangeSumBST(root.left, low, high);
  return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
}` } },
        starter: { py: 'class Solution:\n    def rangeSumBST(self, root: Optional[TreeNode], low: int, high: int) -> int:\n        ', js: 'function rangeSumBST(root, low, high) {\n  \n}' },
        tests: { fn: 'rangeSumBST', argTypes: ['tree'], cases: [
          { args: [[10, 5, 15, 3, 7, null, 18], 7, 15], out: 32 }, { args: [[10, 5, 15, 3, 7, 13, 18, 1, null, 6], 6, 10], out: 23 }, { args: [[5], 1, 10], out: 5 }, { args: [[5], 6, 10], out: 0 }, { args: [[], 1, 2], out: 0 }] } },

      { lc: 1922,
        hints: ['Positions are independent. Count how many digits are allowed at an even index and at an odd index.', 'Even indices: 0, 2, 4, 6, 8 (5 choices). Odd indices: 2, 3, 5, 7 (4 choices). The total is `5^ceil(n/2) · 4^floor(n/2)`.', 'n is up to 10¹⁵, so compute each power by halving the exponent (squaring), taking the modulus after every multiplication.'],
        solution: { explain: 'Fast exponentiation, twice. Each call squares the result for `e // 2` and multiplies in one extra base if `e` is odd, taking the modulus each time. O(log n) time and depth. In JavaScript use BigInt, since products of two 30-bit numbers exceed 2⁵³.', code: {
          py: `class Solution:
    def countGoodNumbers(self, n: int) -> int:
        MOD = 10**9 + 7
        def power(b, e):
            if e == 0:
                return 1
            half = power(b, e // 2)
            r = half * half % MOD
            return r * b % MOD if e % 2 else r
        return power(5, (n + 1) // 2) * power(4, n // 2) % MOD`,
          js: `function countGoodNumbers(n) {
  const MOD = 1000000007n;
  const power = (b, e) => {
    if (e === 0n) return 1n;
    const half = power(b, e / 2n);
    const r = half * half % MOD;
    return e % 2n ? r * b % MOD : r;
  };
  const N = BigInt(n);
  return Number(power(5n, (N + 1n) / 2n) * power(4n, N / 2n) % MOD);
}` } },
        starter: { py: 'class Solution:\n    def countGoodNumbers(self, n: int) -> int:\n        ', js: 'function countGoodNumbers(n) {\n  \n}' },
        tests: { fn: 'countGoodNumbers', cases: [
          { args: [1], out: 5 }, { args: [2], out: 20 }, { args: [4], out: 400 }, { args: [50], out: 564908303 }, { args: [806166225460393], out: 643535977 }] } },

      { lc: 241,
        hints: ['Every way of grouping has one operator that is evaluated **last**. Try each operator in that role.', 'For the chosen operator, recursively compute every possible value of the left part and of the right part, then combine every pair of values.', 'If the piece has no operator, it is just a number: that is the base case. Cache by substring, since the same piece appears under many splits.'],
        solution: { explain: 'Divide and conquer on the last operator, with a cache keyed by the substring so repeated pieces are solved once. The number of results (a Catalan number) sets the cost, so no algorithm can beat it by much.', code: {
          py: `class Solution:
    def diffWaysToCompute(self, expression: str) -> List[int]:
        memo = {}
        def solve(s):
            if s in memo:
                return memo[s]
            res = []
            for i, c in enumerate(s):
                if c in '+-*':
                    for a in solve(s[:i]):
                        for b in solve(s[i + 1:]):
                            res.append(a + b if c == '+' else a - b if c == '-' else a * b)
            if not res:
                res = [int(s)]
            memo[s] = res
            return res
        return solve(expression)`,
          js: `function diffWaysToCompute(expression) {
  const memo = new Map();
  function solve(s) {
    if (memo.has(s)) return memo.get(s);
    const res = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '+' || c === '-' || c === '*') {
        for (const a of solve(s.slice(0, i))) {
          for (const b of solve(s.slice(i + 1))) {
            res.push(c === '+' ? a + b : c === '-' ? a - b : a * b);
          }
        }
      }
    }
    if (res.length === 0) res.push(parseInt(s, 10));
    memo.set(s, res);
    return res;
  }
  return solve(expression);
}` } },
        starter: { py: 'class Solution:\n    def diffWaysToCompute(self, expression: str) -> List[int]:\n        ', js: 'function diffWaysToCompute(expression) {\n  \n}' },
        tests: { fn: 'diffWaysToCompute', compare: 'unordered', cases: [
          { args: ['2-1-1'], out: [0, 2] }, { args: ['2*3-4*5'], out: [-34, -14, -10, -10, 10] }, { args: ['11'], out: [11] }, { args: ['1+2+3'], out: [6, 6] }, { args: ['3-2*1'], out: [1, 1] }] } },

      { lc: 784,
        hints: ['At every digit you have one choice, and at every letter you have two.', 'Build the answers one position at a time: extend every partial string with the next character’s options.', 'A recursive version is a function `build(i, current)` that records the string when `i` reaches the end.'],
        solution: { explain: 'Process the string left to right, branching on each letter (the layer-by-layer form of the recursion). Every answer is produced once and the output has 2^L strings, so it’s optimal: O(n · 2^L) time and space for L letters.', code: {
          py: `class Solution:
    def letterCasePermutation(self, s: str) -> List[str]:
        out = ['']
        for ch in s:
            if ch.isalpha():
                out = [p + c for p in out for c in (ch.lower(), ch.upper())]
            else:
                out = [p + ch for p in out]
        return out`,
          js: `function letterCasePermutation(s) {
  let out = [''];
  for (const ch of s) {
    if (ch.toLowerCase() !== ch.toUpperCase()) {
      out = out.flatMap((p) => [p + ch.toLowerCase(), p + ch.toUpperCase()]);
    } else {
      out = out.map((p) => p + ch);
    }
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def letterCasePermutation(self, s: str) -> List[str]:\n        ', js: 'function letterCasePermutation(s) {\n  \n}' },
        tests: { fn: 'letterCasePermutation', compare: 'unordered', cases: [
          { args: ['a1b2'], out: ['a1b2', 'a1B2', 'A1b2', 'A1B2'] }, { args: ['3z4'], out: ['3z4', '3Z4'] }, { args: ['12345'], out: ['12345'] }, { args: ['C'], out: ['C', 'c'] }] } },

      { lc: 1545,
        hints: ['S_n has length 2ⁿ − 1 and a `1` exactly in the middle, at position 2ⁿ⁻¹. The left half is S_(n−1).', 'If k is left of the middle, the answer is the same position in S_(n−1). If it is the middle, the answer is `1`.', 'If k is right of the middle, it mirrors position `2·mid − k` in S_(n−1), and the character is inverted.'],
        solution: { explain: 'Each level either answers directly (the middle), stays in the left half, or reflects into it and flips the bit. One call per level: O(n) time, O(n) stack, never building a string.', code: {
          py: `class Solution:
    def findKthBit(self, n: int, k: int) -> str:
        if n == 1:
            return '0'
        mid = 1 << (n - 1)
        if k == mid:
            return '1'
        if k < mid:
            return self.findKthBit(n - 1, k)
        return '1' if self.findKthBit(n - 1, 2 * mid - k) == '0' else '0'`,
          js: `function findKthBit(n, k) {
  if (n === 1) return '0';
  const mid = 2 ** (n - 1);
  if (k === mid) return '1';
  if (k < mid) return findKthBit(n - 1, k);
  return findKthBit(n - 1, 2 * mid - k) === '0' ? '1' : '0';
}` } },
        starter: { py: 'class Solution:\n    def findKthBit(self, n: int, k: int) -> str:\n        ', js: 'function findKthBit(n, k) {\n  \n}' },
        tests: { fn: 'findKthBit', cases: [
          { args: [3, 1], out: '0' }, { args: [4, 11], out: '1' }, { args: [1, 1], out: '0' }, { args: [2, 3], out: '1' }, { args: [5, 31], out: '1' }, { args: [5, 16], out: '1' }, { args: [5, 17], out: '0' }] } },

      { lc: 509,
        hints: ['The definition is already recursive: `fib(n) = fib(n-1) + fib(n-2)`, with F(0) = 0 and F(1) = 1.', 'The plain recursion repeats work. Add a cache, or notice you only ever need the last two values.', 'For O(log n), return the pair `(F(k), F(k + 1))` and use the doubling identities.'],
        solution: { explain: 'A memoized recursion is O(n) time and O(n) space; the two-variable loop is O(n) time and O(1) space, which is the simple answer to give first.', code: {
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
        tests: { fn: 'fib', sig: { args: ['int'] }, cases: [
          { args: [0], out: 0 }, { args: [1], out: 1 }, { args: [2], out: 1 }, { args: [10], out: 55 }, { args: [30], out: 832040 }] } },

      { lc: 50,
        hints: ['Multiplying n times is too slow when n is about two billion. Halve the exponent instead.', '`x^n = (x^(n/2))²`, with one extra x when n is odd. Compute the half once.', 'For a negative n, compute with `-n` (in a wider integer type, since `-2³¹` overflows an int) and return the reciprocal.'],
        solution: { explain: 'Recursive fast exponentiation: O(log n) time and depth.', code: {
          py: `class Solution:
    def myPow(self, x: float, n: int) -> float:
        def power(b, e):
            if e == 0:
                return 1.0
            half = power(b, e // 2)
            return half * half * (b if e % 2 else 1.0)
        return power(x, n) if n >= 0 else 1.0 / power(x, -n)`,
          js: `function myPow(x, n) {
  const power = (b, e) => {
    if (e === 0) return 1;
    const half = power(b, Math.floor(e / 2));
    return half * half * (e % 2 ? b : 1);
  };
  return n >= 0 ? power(x, n) : 1 / power(x, -n);
}` } },
        starter: { py: 'class Solution:\n    def myPow(self, x: float, n: int) -> float:\n        ', js: 'function myPow(x, n) {\n  \n}' },
        tests: { fn: 'myPow', compare: 'float', sig: { args: ['float', 'int'] }, cases: [
          { args: [2.0, 10], out: 1024.0 }, { args: [2.1, 3], out: 9.261 }, { args: [2.0, -2], out: 0.25 }, { args: [5.0, 0], out: 1.0 }, { args: [2.0, -2147483648], out: 0.0 }, { args: [1.0, 2147483647], out: 1.0 }, { args: [-2.0, 3], out: -8.0 }] } },

      { lc: 206,
        hints: ['Assume the recursive call already reversed everything after the head, and returned the new head.', 'After that call, `head.next` is the tail of the reversed part. Point `head.next.next` back at `head`.', 'Set `head.next = None` so the old head becomes the tail, and return the new head. Base case: zero or one node.'],
        solution: { explain: 'Recurse to the end, then flip one arrow per frame on the way back. O(n) time, O(n) stack; the loop version is O(1) space.', code: {
          py: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if head is None or head.next is None:
            return head
        new_head = self.reverseList(head.next)
        head.next.next = head
        head.next = None
        return new_head`,
          js: `function reverseList(head) {
  if (head === null || head.next === null) return head;
  const newHead = reverseList(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}` } },
        starter: { py: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function reverseList(head) {\n  \n}' },
        tests: { fn: 'reverseList', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: [5, 4, 3, 2, 1] }, { args: [[1, 2]], out: [2, 1] }, { args: [[]], out: null }, { args: [[7]], out: [7] }] } },

      { lc: 21,
        hints: ['The smallest node overall is the smaller of the two heads.', 'Keep that node, and set its `next` to the merge of the remaining nodes: the same problem, one node smaller.', 'Base case: if one list is empty, return the other.'],
        solution: { explain: 'Compare the heads, keep the smaller, and recurse on the rest. O(m + n) time, O(m + n) stack.', code: {
          py: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        if list1 is None:
            return list2
        if list2 is None:
            return list1
        if list1.val <= list2.val:
            list1.next = self.mergeTwoLists(list1.next, list2)
            return list1
        list2.next = self.mergeTwoLists(list1, list2.next)
        return list2`,
          js: `function mergeTwoLists(list1, list2) {
  if (list1 === null) return list2;
  if (list2 === null) return list1;
  if (list1.val <= list2.val) {
    list1.next = mergeTwoLists(list1.next, list2);
    return list1;
  }
  list2.next = mergeTwoLists(list1, list2.next);
  return list2;
}` } },
        starter: { py: 'class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function mergeTwoLists(list1, list2) {\n  \n}' },
        tests: { fn: 'mergeTwoLists', argTypes: ['list', 'list'], cases: [
          { args: [[1, 2, 4], [1, 3, 4]], out: [1, 1, 2, 3, 4, 4] }, { args: [[], []], out: null }, { args: [[], [0]], out: [0] }, { args: [[5], [1, 2, 3]], out: [1, 2, 3, 5] }] } }
    ],

    mistakes: [
      '**A missing or unreachable base case.** `f(n - 2)` with a base case of `n == 0` never stops on odd n. Check that every path of the recursive case moves toward a base case, and that the base case covers *all* the smallest inputs (n = 0 **and** n = 1 for Fibonacci).',
      '**Not shrinking the problem.** Calling the function on the same input, or one that grows, recurses forever. Each call must pass something strictly smaller.',
      '**Two recursive calls where one will do.** `power(x, n/2) * power(x, n/2)` quietly makes the exponential tree again. Call once, store the result, then use it twice.',
      '**Forgetting to return the recursive result.** In Python especially, `self.find(x)` without `return` produces `None` all the way back up.',
      '**A cache keyed on too little.** If the answer depends on `(i, j)`, the memo key is `(i, j)`, not `i`. The key must identify the whole subproblem. And never put a mutable list in the key; use a tuple.',
      '**A cache that’s shared by mistake, or reset by mistake.** A memo created *inside* the recursive function is empty on every call, so it never hits. Create it outside (a closure, a parameter or a field) and make sure it’s cleared between independent test cases.',
      '**Ignoring the depth.** The recursion tree’s *depth* is your stack. 10⁵ levels overflows Python (limit 1000), JavaScript (about 10⁴) and usually Java; in C++ it’s an unrecoverable crash. Ask for the input limits, then use a loop or an explicit stack if needed.',
      '**Language gotchas.** *Python:* default arguments like `memo={}` are created once and **shared** between calls; that sometimes helps and sometimes leaks answers between inputs, so make it explicit. *JavaScript:* `n / 2` isn’t an integer division; use `Math.floor(n / 2)` or `n >> 1` (for values under 2³¹). *Java:* `Integer` overflow is silent: `fib(47)` already wraps, and `-n` fails for `Integer.MIN_VALUE`; widen to `long`. *C++:* `memo[k]` inserts a default value when you only meant to read it, so test with `count()` or `find()` first.'
    ],

    quiz: [
      { kind: 'concept', q: 'What two things must every correct recursive function have?',
        choices: ['A base case that stops the recursion, and a recursive step that moves toward it', 'A loop and a counter', 'A cache and a stack', 'Two parameters'], answer: 0,
        explain: 'Without a base case, it never stops; without a step that gets closer to the base case, it never arrives. Caches, stacks and parameters are optional.' },
      { kind: 'complexity', q: 'What is the time complexity of `fib(n) = fib(n-1) + fib(n-2)` with no cache?',
        choices: ['O(n)', 'Exponential: about 1.6ⁿ calls', 'O(n²)', 'O(log n)'], answer: 1,
        explain: 'Each call makes two calls, and the tree has roughly φⁿ nodes (φ ≈ 1.618). The same values are recomputed over and over. With a cache, it drops to O(n).' },
      { kind: 'complexity', q: 'What is the space complexity of the memoized `fib(n)`?',
        choices: ['O(1)', 'O(n): the call stack is n deep and the cache holds n entries', 'O(log n)', 'O(2ⁿ)'], answer: 1,
        explain: 'The stack goes `fib(n)` → `fib(n-1)` → … → `fib(1)`, n levels. The cache stores one value for each k from 2 to n. A bottom-up loop uses O(1).' },
      { kind: 'bug', q: 'This is called as `count_down(7)` and crashes with a RecursionError. What’s the bug?',
        code: `def count_down(n):
    if n == 0:
        return 0
    return count_down(n - 2) + 1`,
        choices: ['The base case is skipped over for odd n: 7, 5, 3, 1, −1, …', 'It should be `n + 1`', 'The function needs a cache', 'Python can’t recurse more than once'], answer: 0,
        explain: 'Stepping by 2 from an odd number jumps over 0 and never stops. Widen the base case (`n <= 0`) or make sure the step always lands on a base case.' },
      { kind: 'concept', q: 'In Python, what happens when a recursion goes 5,000 calls deep with the default settings?',
        choices: ['It runs fine', 'A `RecursionError` (the default limit is about 1000)', 'The process silently returns None', 'It switches to a loop automatically'], answer: 1,
        explain: 'CPython counts frames and raises `RecursionError` at about 1000. Java throws `StackOverflowError`, JavaScript a `RangeError`, and C++ simply crashes. None of them converts the recursion to a loop for you.' },
      { kind: 'pattern', q: 'Which problem **benefits from memoization**?',
        choices: ['The number of ways to climb n stairs taking 1 or 2 steps', 'Merge sort of an array', 'The maximum depth of a binary tree', 'Reversing a linked list recursively'], answer: 0,
        explain: 'Climbing stairs has overlapping subproblems: `ways(n)` needs `ways(n-1)` and `ways(n-2)`, which both need `ways(n-2)`. In the other three, every subproblem is different, so a cache would never be hit.' },
      { kind: 'concept', q: 'Which of these can replace a deep recursion? Pick every one that applies.',
        choices: ['A loop that builds the answer bottom-up from the base cases', 'Your own stack (a list) holding the work still to do', 'Rewriting the recursion as a tail call, in Python', 'Raising the recursion limit to a huge number'], answer: [0, 1],
        explain: 'A bottom-up loop and an explicit stack both avoid the call stack. Python doesn’t optimize tail calls, and a huge recursion limit just moves the crash to the C stack.' },
      { kind: 'complexity', q: 'What are the time and stack depth of recursive fast power, `power(x, n)` with `half = power(x, n // 2)` stored once?',
        choices: ['O(n) time, O(n) depth', 'O(log n) time, O(log n) depth', 'O(log n) time, O(1) depth', 'O(n log n) time'], answer: 1,
        explain: 'The exponent halves each call, so there are about log₂ n calls in a single chain: log n time and log n frames. Calling `power(x, n // 2)` twice instead would make it O(n).' },
      { kind: 'bug', q: 'This recursive list reversal sometimes loops forever when you print the result. What’s missing?',
        code: `def reverse(head):
    if head is None or head.next is None:
        return head
    new_head = reverse(head.next)
    head.next.next = head
    return new_head`,
        choices: ['`head.next = None` after relinking, so the old head doesn’t still point forward', 'A second base case', 'A cache of visited nodes', 'It should return `head`'], answer: 0,
        explain: 'The old head keeps pointing at its former successor, which now points back at it: a 2-node cycle at the tail. Setting `head.next = None` makes the old head the tail.' },
      { kind: 'concept', q: 'Merge sort splits an array in halves and recurses. Would adding a memo (cache) speed it up?',
        choices: ['No: the halves never overlap, so no subproblem repeats', 'Yes, it turns O(n log n) into O(n)', 'Yes, but only for sorted input', 'Only in Python'], answer: 0,
        explain: 'Memoization pays off only when the same subproblem is asked twice. The two halves of an array are disjoint, so every call is new. A cache would just use more memory.' }
    ],

    flashcards: [
      { id: 'two-parts', front: 'The two parts of every recursive function?', back: 'A **base case** (an input small enough to answer directly) and a **recursive case** that calls itself on a strictly smaller input and combines the result.' },
      { id: 'trust', front: 'How should you reason about a recursive call while writing it?', back: 'Assume it already works for the smaller input (“trust the call”). Only work out how one step uses that answer, and what the base case is.' },
      { id: 'stack-frame', front: 'What is a stack frame, and when is it freed?', back: 'A call’s own copy of parameters and locals, plus where to return. It’s created when the function is called and freed when it returns. Frames pile up along the path from root to current call in the recursion tree.' },
      { id: 'tree-cost', front: 'How do you read time and space off a recursion tree?', back: 'Time = (number of nodes) × (work per node). Space = the stack depth: the longest root-to-leaf path (plus any cache or data you store).' },
      { id: 'fib-cost', front: 'Plain recursive `fib(n)`: time? With memoization?', back: 'About 1.6ⁿ calls (exponential), because the same subproblems repeat. With a cache it’s O(n) time, since each `fib(k)` runs once, and O(n) space.' },
      { id: 'memo-key', front: 'What must a memoization key capture?', back: 'Everything the answer depends on: the full state of the subproblem, e.g. `(i, j)` and not just `i`. Use immutable keys (numbers, strings, tuples).' },
      { id: 'when-memo', front: 'When does memoization help, and when is it pointless?', back: 'It helps when subproblems **overlap** (the same call repeats), as in Fibonacci or climbing stairs. It’s pointless when every subproblem is distinct, like the halves in merge sort or subtrees in a tree.' },
      { id: 'dnc', front: 'Divide and conquer: the shape?', back: 'Split the input (usually in half), solve each part recursively, then combine the answers. Depth is O(log n); the combine step sets the total cost (O(1) for a max, O(n) for a merge).' },
      { id: 'fast-power', front: 'Fast exponentiation: the recursion?', back: '`x^n = (x^(n//2))²`, times an extra x when n is odd. Compute the half **once**: O(log n). Negative n: use |n| (in a wider integer type), then take the reciprocal.' },
      { id: 'limits', front: 'Default recursion limits: Python, JavaScript, Java, C++?', back: 'Python: 1000 frames (`RecursionError`). JavaScript: about 10,000 (`RangeError`). Java: about 10,000 to 20,000 (`StackOverflowError`). C++: no check, a crash after tens of thousands (8 MB Linux, 1 MB Windows). All approximate.' },
      { id: 'tco', front: 'Do Python, JavaScript, Java or C++ guarantee tail-call optimization?', back: 'No. Python and Java never do it; JavaScript specifies it but major engines (except Safari) don’t implement it; C++ compilers may do it at -O2 but you can’t rely on it. Use a loop.' },
      { id: 'to-iter', front: 'Two ways to remove a recursion?', back: 'Bottom-up loop (compute from the base cases up, keep only what you need): no stack at all. Or an explicit stack (a list of pending work) for tree and DFS shapes.' }
    ],

    deeper: [
      { title: 'Recursion visualized (VisuAlgo)', url: 'https://visualgo.net/en/recursion', time: 'about 15 min', note: 'Animated recursion trees for Fibonacci and other classics, with a step-by-step call stack. A good complement to the visualizer on this page.' },
      { title: 'sys.setrecursionlimit (Python docs)', url: 'https://docs.python.org/3/library/sys.html#sys.setrecursionlimit', time: 'about 5 min', note: 'What the Python limit is, why raising it can crash the interpreter, and how it’s measured.' },
      { title: 'RangeError: Maximum call stack size exceeded (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion', time: 'about 5 min', note: 'The JavaScript error for runaway recursion, with the usual causes and fixes.' },
      { title: 'StackOverflowError (Java API)', url: 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/StackOverflowError.html', time: 'about 3 min', note: 'The Java error thrown when the call stack is exhausted. Unlike in C++, you can catch it, though you rarely should.' },
      { title: 'NeetCode Roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where recursion sits before trees, backtracking and dynamic programming. Use it to pick problems once this page feels easy.' }
    ],

    detective: [
      { id: 'folder-total', decoys: ['trees', 'stacks', 'backtracking'],
        statement: 'A cloud-storage admin gets a folder, and every folder can hold files and other folders, nested as deep as users like. Each file has a size in kilobytes. For any folder she picks, the admin needs the **total size of everything inside it**, however deeply buried. Given the folder, return that total.',
        why: 'Each folder is a smaller copy of the same problem: its total is the sum of its files plus the totals of its sub-folders. The base case is a folder with no sub-folders. The nesting depth is unknown, which is the classic cue for a recursive function (or an explicit stack if depth could be huge).' },
      { id: 'growth-days', decoys: ['binary-search', 'dp-1d', 'math'],
        statement: 'A savings plan multiplies the balance by the same factor every day. The bank’s auditor must report the factor’s effect after as many as two billion days. A script that multiplies once per day would run for hours, and the auditor needs the answer before lunch. How should the script compute it, and in how many steps?',
        why: 'The repeated multiplication has a self-similar shape: the effect of 2m days is the effect of m days, squared. Halving the exponent each time is recursion with one call per level, so about 31 steps instead of two billion: fast exponentiation. Computing the half only once is the crucial detail.' },
      { id: 'plate-shelves', decoys: ['stacks', 'backtracking', 'dp-1d'],
        statement: 'A museum has n round display plates stacked on one shelf, largest at the bottom. Staff must move the whole stack to a second shelf using a third as a spare. They can carry one plate at a time and must never put a bigger plate on top of a smaller one. How many carries does it take, and in what order?',
        why: 'To move n plates, first move the top n − 1 out of the way, carry the big one, then move the n − 1 back on top: the same task with one fewer plate, done twice. That self-reference with a trivial base case (zero or one plate) is recursion; the call tree has 2ⁿ − 1 nodes.' }
    ]
  });
})();
