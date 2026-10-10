(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['recursion'] = {
    primer: {
      kind: 'technique',
      what: '**Recursion** solves a problem by calling the same function on a smaller piece of it and combining the answer; a **base case** answers the tiniest input directly and stops the chain. It is asking the person ahead of you in a queue for their position, then adding one.',
      does: 'It fits anything that contains a smaller copy of itself: linked lists, trees, nested brackets or folders, halving problems (fast power, merge sort), and choice trees (subsets, permutations, backtracking). Cost is the number of calls in the recursion tree times the work per call; extra space is the depth of the stack.',
      impl: 'Each call gets its own **stack frame** with its own arguments and variables, kept until it returns, so frames pile up then unwind. Python allows about 1000 frames by default (`sys.getrecursionlimit()`), has no tail-call optimization, and `functools.cache` memoizes repeated calls. Convert to a loop or explicit stack when the depth can be large.',
      possibilities: 'Tree problems (depth, path sum, validate a BST), linked list reversal and merging, divide and conquer (fast power, merge sort, quickselect), memoized recursion that turns into dynamic programming, and backtracking over choices (subsets, permutations, N-Queens, word search). Walking nested JSON, folders or expressions is naturally recursive too.'
    },

    breakdown: [
      {
        title: '1. The raw idea: a smaller copy of the same problem',
        body: 'Add up the list `[3, 1, 4]`. You could say: the total is `3` plus the total of `[1, 4]`. That second sentence is the same question about a **shorter list**. Keep going: the total of `[1, 4]` is `1` plus the total of `[4]`, which is `4` plus the total of `[]`. A list with nothing in it totals 0, and we can answer that without asking anyone. Recursion is exactly this habit: define the answer for a bigger input in terms of the answer for a smaller one, and write down the answer for the smallest input by hand.',
        code: { py: 'def total(nums):\n    if not nums:\n        return 0                      # base case: nothing left\n    return nums[0] + total(nums[1:])  # one step + trust the smaller call' }
      },
      {
        title: '2. Base case, recursive case, and the call stack',
        body: 'Every recursive function needs a **base case** (stops the chain) and a **recursive case** (moves toward it). Trace `total([3, 1, 4])`. Each call is a **stack frame**: a private box holding that call’s arguments and waiting state. Frame 1: `3 + total([1, 4])`, waits. Frame 2: `1 + total([4])`, waits. Frame 3: `4 + total([])`, waits. Frame 4: `[]` hits the base case and returns 0. Now unwind: frame 3 returns `4 + 0 = 4`, frame 2 returns `1 + 4 = 5`, frame 1 returns `3 + 5 = 8`. Four frames were alive at the same time: that is the **depth**, and it is the space cost.'
      },
      {
        title: '3. What can go wrong: no base case, too deep',
        body: 'If the call does not move toward the base case (calling `total(nums)` again unchanged) or the base case is wrong (`if len(nums) == 1` and then someone passes `[]`), frames pile up forever. Python stops at about 1000 frames and raises `RecursionError`; C++ just crashes. Even a correct recursion breaks if the depth is the input size: `total` on a list of 5000 numbers needs 5000 frames. Two cures: raise the limit carefully, or rewrite as a loop or an explicit stack. Always ask yourself: how deep can this go for the largest input?'
      },
      {
        title: '4. The recursion tree and repeated work (Fibonacci)',
        body: 'Draw each call as a node and its calls as children. `fib(n) = fib(n-1) + fib(n-2)` with `fib(0) = 0`, `fib(1) = 1`. Calls for `fib(4)`: it calls `fib(3)` and `fib(2)`; `fib(3)` calls `fib(2)` and `fib(1)`; each `fib(2)` calls `fib(1)` and `fib(0)`. That is 9 calls, and `fib(2)` is computed **twice**. The count of calls roughly multiplies by 1.6 for each step up in n: `fib(30)` makes about 2.7 million calls. The cost of a recursion is the number of nodes in this tree, so a tree that branches twice at every level is exponential.'
      },
      {
        title: '5. Memoization: remember answers you already computed',
        body: 'The fix for repeated nodes is a **cache** (dictionary) keyed by the whole state of a call, here just `k`. Order matters: check the cache first, then the base case, then recurse, and store the result before returning. With a cache, `fib(4)` makes `fib(3)`, which makes `fib(2)`, which makes `fib(1)` and `fib(0)`; after that, the other `fib(2)` and `fib(3)` calls are instant lookups. Each distinct `k` runs its body once, so `fib(n)` makes about `2n - 1` calls: 59 for n = 30 instead of 2.7 million. In Python write `@functools.cache` above the function. This only helps when subproblems actually **repeat**; merge sort halves never overlap, so caching it is pointless.'
      },
      {
        title: '6. Halving: the cheapest recursions are log-deep',
        body: 'Computing `2^10` by 10 multiplications is O(n) in the exponent. Instead use `x^e = (x^(e//2))^2`, times one more `x` if `e` is odd. Trace: `p(10)` needs `p(5)`, which needs `p(2)`, then `p(1)`, then `p(0) = 1`. Unwind: `p(1) = 1*1*2 = 2`, `p(2) = 2*2 = 4`, `p(5) = 4*4*2 = 32`, `p(10) = 32*32 = 1024`. Five frames instead of ten multiplications, and the depth grows as log2 of the exponent. One rule: call the smaller problem **once** and reuse the value (`half = p(e//2)`); writing `p(e//2) * p(e//2)` doubles the calls at every level and brings back the exponential tree.'
      },
      {
        title: '7. Trees and lists, and how to spot recursion',
        body: 'A tree is a node plus two smaller trees, so most tree questions are one line: depth of an empty tree is 0, otherwise `1 + max(depth(left), depth(right))`. Information flows two ways: **parameters carry things down** (remaining target in path sum) and **return values carry things up** (height, count, result). Spot recursion by phrases like “nested”, “tree”, “split in half”, “try every choice”, or by seeing that a smaller version of the question has the same shape. In the interview: say the base case, say what shrinks, say “I trust the recursive call”, then state depth and total cost.'
      }
    ],

    think: [
      {
        q: 'Predict the output of `f(3)`. def f(n): if n == 0: return; print("down", n); f(n - 1); print("up", n)',
        a: 'It prints down 3, down 2, down 1, then up 1, up 2, up 3. Everything before the recursive call runs on the way **down** the stack in order, and everything after it runs on the way **back up** in reverse order. This is the picture to hold: code before the call is “before the smaller problem is solved”, code after it uses the smaller answer.'
      },
      {
        q: 'What happens if the base case is `if n == 1: return 1` and someone calls the function with `n = 0`?',
        a: 'The call never reaches the base case: n goes 0, -1, -2, and so on, so the stack grows until Python raises `RecursionError` (about 1000 frames). The base case has to cover **every** smallest input the recursion can reach, including the empty or zero input, not only the one you had in mind. Writing `n <= 1` or `not nums` is the usual cure.'
      },
      {
        q: 'How many calls does plain `fib(5)` make, and how many with a cache?',
        a: 'Plain: 15 calls (calls(n) = 1 + calls(n-1) + calls(n-2), giving 1, 1, 3, 5, 9, 15). With a cache: 9, since `fib(2)` and `fib(3)` are only worked out once and their second visits are lookups. The aha is the growth: at n = 30 it is about 2.7 million calls plain and 59 cached. Memoization turns an exponential tree into a linear one.'
      },
      {
        q: 'Why can a recursive linked-list reversal crash on a list of 5000 nodes while the loop version does not?',
        a: 'The recursion makes one frame per node, so 5000 nodes need 5000 frames, past Python’s default of 1000. The loop keeps three variables and no stack. The recursion is just as correct; its **space** is O(n) because the stack is memory too. This is the follow-up interviewers ask: “what is the space?” The honest answer counts stack frames.'
      },
      {
        q: 'In fast power, why must you write `half = power(b, e // 2)` and then use `half * half`, rather than `power(b, e // 2) * power(b, e // 2)`?',
        a: 'Two calls per level means the number of calls doubles at every level: with depth log2(e), that is 2^(log2 e) = e calls, the same as multiplying e times. One call plus a squaring keeps one chain of about log2(e) calls. The lesson: a recursion that makes one call per level is a line; two calls per level on a halving input without overlap is still fine, but two identical calls is wasteful.'
      },
      {
        q: 'For path sum you pass the remaining target as a parameter; for tree depth you use a return value. How do you decide which one to use?',
        a: 'Ask what each call needs to know. If a node needs information from above (how much of the target is still left, the allowed range of a BST), pass it **down** as a parameter. If the parent needs information about the subtree (its height, its sum, whether it is balanced), return it **up**. Many problems use both. Decide this before writing, and the function signature falls out.'
      }
    ],

    drills: [
      {
        title: 'How deeply is this list nested?',
        q: 'A list can contain numbers and other lists, nested to any depth. Return its **nesting depth**: a list with no inner list has depth 1, and each level of nesting adds 1. Example: `[1, [2, [3]], 4]` returns `3`; `[1, 2]` returns `1`; `[]` returns `1`; `[[], [[]]]` returns `3`.',
        hint: 'The depth of a list is 1 plus the deepest depth among its inner lists (or 1 if it has none).',
        how: 'I restate it: count the levels of brackets in a nested list. A loop with a counter does not work naturally, because I do not know in advance how many levels there are or which branch goes deepest. That is the signal for recursion: the structure repeats itself, since an inner list is itself a nested list of the same kind. So I ask what the answer for a list would be if I already knew the depth of each inner list. It is `1 +` the largest of those depths, where the `1` counts the current list, and if there are no inner lists it is just `1`. The base case is built in: a list with no inner lists makes no recursive calls and returns `1 + 0`. In code, I walk the items, and for each item that is itself a list I take `max` of the depths so far with the recursive answer. Trace `[1, [2, [3]], 4]`: the outer call sees `[2, [3]]`, calls itself. That call sees `[3]` and calls itself. `[3]` has no inner list, so it returns 1. The middle call returns `1 + 1 = 2`. The outer call returns `1 + 2 = 3`. Edge cases: `[]` returns 1 because the loop never runs; `[[], [[]]]` takes the max of 1 and 2, so 3. Numbers are ignored. Cost: O(total items) time because each item is looked at once; O(depth) stack, so very deep nesting (over 1000) would need an explicit stack instead.',
        code: {
          py: `def nesting_depth(items):
    deepest = 0
    for x in items:
        if isinstance(x, list):
            deepest = max(deepest, nesting_depth(x))
    return 1 + deepest`
        },
        explain: 'Each list is one node of a tree whose children are its inner lists. The depth of a node is 1 plus the maximum depth of its children, and a leaf list (no inner lists) has depth 1. Every item is visited once: O(n) time, O(depth) stack.',
        check: `assert nesting_depth([1, [2, [3]], 4]) == 3
assert nesting_depth([1, 2]) == 1
assert nesting_depth([]) == 1
assert nesting_depth([[], [[]]]) == 3
assert nesting_depth([[[[[5]]]]]) == 5
assert nesting_depth([1, [2], [3, [4]], [[5]]]) == 3`
      },
      {
        title: 'Strings with no two 1s in a row',
        q: 'Given `n`, return every binary string of length `n` that has **no two adjacent 1s**, in increasing (alphabetical) order. Example: `n = 3` returns `["000", "001", "010", "100", "101"]`; `n = 1` returns `["0", "1"]`; `n = 0` returns `[""]`.',
        hint: 'Build the string one character at a time. At each step you may always add 0, but you may add 1 only if the last character is not 1.',
        how: 'I restate it: list every length-n string of 0s and 1s where 1s are never neighbours. The brute force writes all 2^n strings and filters them, which is fine for small n but does wasted work building strings that already broke the rule in their first two characters. The better way is to build a string left to right and refuse a bad move immediately. This is recursion over choices. The state of a call is the prefix built so far. The base case is `len(prefix) == n`: the prefix is complete and valid, so add it to the answer. Otherwise there are at most two choices for the next character: 0 is always legal; 1 is legal only if the prefix does not already end in 1. Because I try 0 first and then 1, the results come out in alphabetical order for free. Trace `n = 3`: start with the empty prefix. Take 0, then 00, then 000 (complete, record), back to 00 and try 001 (record), back to 0: try 01, then 010 (record), and 011 is not allowed because 01 ends in 1. Back to the empty prefix: try 1, then 10, then 100 (record) and 101 (record); 11 is skipped. Five results. Edge cases: `n = 0` returns the single empty string, since the base case holds immediately. Cost: the output size is the Fibonacci-like count of valid strings, and each is built in O(n), so about O(n * F(n)) time; the stack depth is n.',
        code: {
          py: `def no_adjacent_ones(n):
    out = []

    def build(prefix):
        if len(prefix) == n:           # base case: a complete valid string
            out.append(prefix)
            return
        build(prefix + '0')            # 0 is always allowed
        if not prefix.endswith('1'):   # 1 only after a 0 (or at the start)
            build(prefix + '1')

    build('')
    return out`
        },
        explain: 'Each call extends a valid prefix by one character and never produces an invalid prefix, so every leaf of the recursion is a valid answer and every valid string is reached exactly once. Trying 0 before 1 gives increasing order. Time is proportional to the output size times n; the stack depth is n.',
        check: `assert no_adjacent_ones(3) == ['000', '001', '010', '100', '101']
assert no_adjacent_ones(1) == ['0', '1']
assert no_adjacent_ones(0) == ['']
assert no_adjacent_ones(2) == ['00', '01', '10']
for n in range(0, 12):
    got = no_adjacent_ones(n)
    want = [format(i, '0%db' % n) if n else '' for i in range(2 ** n) if '11' not in (format(i, '0%db' % n) if n else '')]
    assert got == want
assert len(no_adjacent_ones(10)) == 144`
      },
      {
        title: 'Move the tower',
        q: 'Three pegs are named `"A"` (source), `"C"` (destination) and `"B"` (spare). `n` disks of different sizes sit on A, biggest at the bottom. You may move one disk at a time from one peg to another, and a bigger disk may never sit on a smaller one. Return the list of moves as `(from_peg, to_peg)` pairs that moves the whole tower from A to C using the fewest moves. Example: `hanoi(2)` returns `[("A","B"), ("A","C"), ("B","C")]`; `hanoi(0)` returns `[]`; `hanoi(3)` has 7 moves.',
        hint: 'To move the bottom disk to the destination, everything above it must first be out of the way on the spare peg.',
        how: 'I restate it: produce the sequence of moves to carry n disks from A to C. Searching all move sequences would be hopeless. The unlock is to look at the biggest disk. It can only move when it is alone on top of its peg and the destination is empty, so at that moment the other n - 1 disks must be all stacked on the spare peg. So: move the top n - 1 disks from the source to the spare peg (a smaller copy of the same problem, with the roles of the pegs rotated), move the biggest disk to the destination (one move), then move the n - 1 disks from the spare onto the destination (again the same smaller problem). The base case is zero disks: no moves, return an empty list. I trust the recursive calls to be valid and optimal, since they are the same problem. Trace `n = 2`: first `hanoi(1, A, B, C)`: move 1 disk from A to B, giving `(A, B)`. Then the big disk: `(A, C)`. Then `hanoi(1, B, C, A)`: `(B, C)`. Result `[(A,B), (A,C), (B,C)]`, three moves. The count M satisfies M(n) = 2 M(n-1) + 1, so it is 2^n - 1, and no shorter solution exists because the largest disk has to move at least once and must have the n - 1 others out of the way. Edge: n = 0 returns the empty list. Cost: O(2^n) time and output, O(n) stack depth. Concatenating lists adds a little overhead; fine here.',
        code: {
          py: `def hanoi(n, src='A', dst='C', spare='B'):
    if n == 0:
        return []                                   # base case: nothing to move
    return (hanoi(n - 1, src, spare, dst)           # clear the top n - 1 disks onto the spare
            + [(src, dst)]                          # move the biggest disk
            + hanoi(n - 1, spare, dst, src))        # put the n - 1 disks back on top of it`
        },
        explain: 'Moving the largest disk requires the rest to be stacked on the spare peg, which forces the three-step structure. The two sub-moves are the same problem with the peg roles rotated. The move count satisfies M(n) = 2M(n-1) + 1 = 2^n - 1, which is also the minimum. O(2^n) time, O(n) depth.',
        check: `def simulate(n):
    pegs = {'A': list(range(n, 0, -1)), 'B': [], 'C': []}
    for s, d in hanoi(n):
        disk = pegs[s].pop()
        assert not pegs[d] or pegs[d][-1] > disk
        pegs[d].append(disk)
    return pegs
assert hanoi(0) == []
assert hanoi(1) == [('A', 'C')]
assert hanoi(2) == [('A', 'B'), ('A', 'C'), ('B', 'C')]
for n in range(1, 11):
    assert len(hanoi(n)) == 2 ** n - 1
    p = simulate(n)
    assert p['A'] == [] and p['B'] == [] and p['C'] == list(range(n, 0, -1))`
      },
      {
        title: 'How many ways to read these digits?',
        q: 'Letters A to Z are encoded as 1 to 26. A string of digits can be read in several ways by splitting it into codes. Return the **number of ways** to split a digit string into valid codes (no leading zeros: `"06"` is not a code, `"0"` is not a code). Example: `"226"` returns `3` (2|2|6, 22|6, 2|26); `"12"` returns `2`; `"10"` returns `1`; `"06"` returns `0`; `"27"` returns `1`.',
        hint: 'Define ways(i) as the number of ways to read the string from position i to the end. A call at i can use one digit or two.',
        how: 'I restate it: count how many different splittings of the digit string into numbers from 1 to 26 exist. Brute force: enumerate every split, and check each; that is exponential. Instead, look at the first position. The first code is either one digit (valid if it is not 0) or two digits (valid if the number is 10 to 26). After taking it, what remains is the same problem on a shorter suffix. So define `ways(i)`: the number of readings of `s[i:]`. Base case: `ways(len(s)) = 1`, the empty remainder has exactly one reading (do nothing). If `s[i]` is "0", no code can start here: return 0. Otherwise `ways(i) = ways(i+1)`, plus `ways(i+2)` if the two-digit number `s[i:i+2]` is at most 26. Trace "226": ways(0) = ways(1) + ways(2) (22 fits). ways(1): "26" fits, so ways(2) + ways(3). ways(2): "6" alone, `ways(3) = 1` (no second digit). ways(3) = 1. So ways(1) = 1 + 1 = 2. ways(0) = 2 + 1 = 3. Note ways(2) is requested twice: this recursion tree has repeated nodes (same shape as Fibonacci), so I memoize it with `functools.cache`; only n + 1 distinct states exist. Edge cases: "06" and "0" return 0, "10" returns 1 (only "10" as a code), "27" returns 1 (27 is too big for a pair). Cost: O(n) time and O(n) space for the cache and the stack, so a very long string would need the bottom-up loop.',
        code: {
          py: `from functools import cache

def num_decodings(s):
    @cache
    def ways(i):                          # readings of s[i:]
        if i == len(s):
            return 1                      # base case: nothing left, one way
        if s[i] == '0':
            return 0                      # no code starts with 0
        total = ways(i + 1)               # take one digit
        if i + 1 < len(s) and int(s[i:i + 2]) <= 26:
            total += ways(i + 2)          # or take two digits
        return total

    return ways(0)`
        },
        explain: 'The first code is one or two digits, and what remains is the same question on a shorter suffix, so ways(i) = ways(i+1) + (ways(i+2) if a valid pair). Many calls share suffixes, so caching on i makes each of the n + 1 states run once. O(n) time, O(n) space (cache plus stack).',
        check: `def brute(s):
    if not s:
        return 1
    n = 0
    for k in (1, 2):
        piece = s[:k]
        if len(piece) == k and piece[0] != '0' and 1 <= int(piece) <= 26:
            n += brute(s[k:])
    return n
assert num_decodings('226') == 3
assert num_decodings('12') == 2
assert num_decodings('10') == 1
assert num_decodings('06') == 0
assert num_decodings('0') == 0
assert num_decodings('27') == 1
assert num_decodings('1111') == 5
for s in ['11106', '2101', '1201234', '100', '301', '1' * 15, '2611055971756562']:
    assert num_decodings(s) == brute(s), s
assert num_decodings('1' * 200) > 0`
      }
    ],

    how: {
      344: 'I restate it: reverse a list of characters in place, using O(1) extra memory. The recursive idea is natural: swap the first and last characters, then reverse the middle, which is the same problem on a shorter range. The base case is a range with fewer than two characters, which is already its own reverse. But look at the cost: the recursion would be n/2 frames deep, and for 10^5 characters that is 50,000 frames, past Python’s default limit of 1000. The recursion has no work after the call, so a loop does exactly the same swaps without a stack. I keep two indices, `i` at the front and `j` at the back, swap `s[i]` and `s[j]`, then move them toward each other and stop when they meet or cross. Trace `["h", "e", "l", "l", "o"]`: i = 0, j = 4 swap h and o; i = 1, j = 3 swap e and l; i = 2, j = 2, so the loop stops (the middle letter stays). Result "olleh". Edge cases: a single character or an empty list does nothing; an even length ends with i just past j. Cost: O(n) time, O(1) space, which is what the problem asks for. I would say out loud: the recursive version is correct but spends O(n) stack, so I chose the loop.',
      24: 'I restate it: swap every two adjacent nodes of a linked list by relinking the nodes themselves, not by swapping their values. The pattern repeats: after swapping the first pair, the rest of the list is the same problem. So the base case is a list of fewer than two nodes (empty or one node), which has no pair to swap. Otherwise, call the first node `head` and the second `second`. Ask the recursion to swap the pairs of everything after `second`, and hang the result after `head`: `head.next = swapPairs(second.next)`. Then put `head` after `second`: `second.next = head`. The new front of this piece is `second`, so return it. Trace `1 → 2 → 3 → 4`: the call on 1 has second = 2 and recurses on 3. The call on 3 has second = 4 and recurses on null, which returns null. So 3.next = null and 4.next = 3, returning 4 → 3. Back in the first call: 1.next = (4 → 3), 2.next = 1, return 2. The list is 2 → 1 → 4 → 3. For odd length `[1, 2, 3]` the last single node is returned unchanged by the base case. Cost: O(n) time, and O(n) stack (n/2 frames), where an iterative version with a dummy head would use O(1) space.',
      104: 'I restate it: the maximum depth of a binary tree is the number of nodes along the longest path from the root down to a leaf. A tree is a node with two smaller trees below it, which is the signal for recursion. If I knew the depth of the left subtree and of the right subtree, the depth of the whole tree is one more than the larger of them; the extra 1 counts the current node. The base case is the empty tree (a null pointer), whose depth is 0. So the function is a single line: return 0 for null, otherwise `1 + max(depth(left), depth(right))`. Trace `[3, 9, 20, null, null, 15, 7]`: node 9 has no children, so it returns `1 + max(0, 0) = 1`. Node 20 has children 15 and 7, each returning 1, so it returns 2. The root 3 returns `1 + max(1, 2) = 3`. Edge cases: an empty tree gives 0; a single node gives 1; a path-shaped tree is as deep as it is long (that is the worst case for the stack). Every node is visited once, so the time is O(n); the stack is as deep as the tree is high, O(h), which is O(log n) for a balanced tree and O(n) for a skewed one. If the depth could be 10^5 I would switch to a level-by-level traversal (BFS).',
      1137: 'I restate it: T0 = 0, T1 = 1, T2 = 1, and every later term is the sum of the three terms before it; return Tn. Writing it straight from the definition, `t(n) = t(n-1) + t(n-2) + t(n-3)`, makes three calls per call, so the tree grows roughly like 1.84^n and repeats the same inputs over and over. Two fixes are easy: memoize on n (O(n) time, O(n) space and stack), or notice each term only needs the three before it, so I do not need the whole table. I keep three variables `a, b, c` holding T(i-2), T(i-1), T(i) and slide them forward: `a, b, c = b, c, a + b + c`. Start from `a, b, c = 0, 1, 1` (that is T0, T1, T2), and repeat `n - 2` times to reach Tn. Trace `n = 4`: start (0, 1, 1); after one step (1, 1, 2), so T3 = 2; after two steps (1, 2, 4), so T4 = 4. Edge cases: `n = 0` and `n = 1` return n directly (the loop would run a negative number of times), and `n = 2` runs zero times and returns c = 1. Cost: O(n) time and O(1) space, and no recursion limit can be hit. This is bottom-up: compute the base cases first and build up.',
      779: 'I restate it: row 1 is "0", and each next row replaces every 0 by "01" and every 1 by "10". Return the k-th symbol of row n. Building row n costs 2^(n-1) symbols, which is hopeless for n = 30. So find out which symbol of the previous row produced position k. Each symbol makes two children, so position k in row n comes from position `(k + 1) // 2` in row n - 1. If k is odd it is the first child, which equals its parent (0 gives 0, 1 gives 1); if k is even it is the second child, which is the opposite of its parent. Base case: row 1 is 0. So one recursive call per row, walking up one level at a time. Trace `n = 4, k = 5`: parent position is 3 in row 3. In row 3, position 3 has parent position 2 in row 2. Position 2 in row 2 has parent position 1 in row 1, which is 0. Position 2 is even, so flip: 1. Back in row 3, position 3 is odd, same as the parent: 1. Row 4, position 5 is odd: 1. Check against row 4 = 01101001: position 5 is 1. Edge cases: n = 1 returns 0 immediately. Cost: O(n) time and O(n) stack, no strings built. There is a shortcut: the answer is the parity of the number of 1-bits in k - 1.',
      112: 'I restate it: does any path from the root down to a leaf add up to the target? The word leaf matters: the path must end at a node with no children. Checking every path by listing them works but wastes effort. Instead, push the target down: at each node, subtract the node’s value, and ask both children whether the remainder can be reached. This is the pattern of passing information **down** as a parameter. The base cases: an empty tree has no path, so false; a leaf succeeds only if the remainder is exactly 0. For any other node, the answer is the left child’s answer or the right child’s answer, and `or` stops early once one side is true. Trace the sample tree with target 22: node 5 leaves 17; node 4 leaves 13; node 11 leaves 2; node 7 is a leaf with remainder 2 - 7 = -5, so false; node 2 is a leaf with remainder 0, so true. Edge cases: an empty tree is false even for target 0; a node with one child is not a leaf (`[1, 2]` with target 1 is false, because the path must continue to node 2); negative values mean you cannot stop early when the remainder goes negative. Cost: O(n) time, O(h) stack.',
      938: 'I restate it: sum the values of the nodes of a binary search tree that lie between low and high inclusive. Visiting every node and adding the ones in range is O(n) and correct, but it ignores the BST order, which lets me skip whole subtrees. Remember that everything in a left subtree is smaller than the node, and everything in a right subtree is bigger. So if the node’s value is below `low`, the node and its entire left subtree are too small, and only the right subtree can contribute: recurse right. If the value is above `high`, only the left subtree can contribute: recurse left. Otherwise the node is in range: add it and recurse both ways. The base case is an empty tree, which contributes 0. Trace `[10, 5, 15, 3, 7, null, 18]` with low 7, high 15: root 10 is in range. Its left child 5 is below 7, so skip its left subtree and look right, finding 7 (in range, adds 7). Its right child 15 is in range (adds 15), and its right child 18 is above 15, so only its left subtree (empty) is searched. Total 10 + 7 + 15 = 32. Edge cases: an empty tree; a range that covers everything (back to O(n)); a range that excludes the root. Cost: O(h + number of nodes in range) typically, O(n) worst case; stack O(h).',
      1922: 'I restate it: count digit strings of length n in which digits at even positions (0-indexed) are even, and digits at odd positions are prime, modulo 10^9 + 7. n can be 10^15, so I cannot loop n times. The positions are independent, so the answer is a product: each even position has 5 choices (0, 2, 4, 6, 8) and each odd position has 4 choices (2, 3, 5, 7). There are `ceil(n/2)` even positions and `floor(n/2)` odd ones, so the answer is `5^ceil(n/2) * 4^floor(n/2)`. I need fast powers: use the halving recursion `b^e = (b^(e//2))^2`, times `b` when `e` is odd, taking the remainder after **every** multiplication so numbers stay small. Base case: `e = 0` gives 1. Trace `n = 4`: 2 even positions and 2 odd: `5^2 * 4^2 = 25 * 16 = 400`. And `n = 1`: one even position, 5^1 * 4^0 = 5. The recursion is about log2(10^15) = 50 frames deep, nowhere near the limit. I compute the half once and square it, which keeps one call per level. Python integers never overflow; in Java or C++ I would use `long` for the products, and in JavaScript BigInt. Cost: O(log n) time and stack, O(1) extra space.',
      241: 'I restate it: given an expression of numbers and the operators plus, minus and times, return every value you can get by choosing how to group it with brackets. Listing all bracketings is the problem itself, so I need a structure. Every full bracketing has exactly one operator that is applied **last**. If I choose that operator, the expression splits into a left part and a right part, and each part can be bracketed in its own ways, which is the same problem on a smaller string. So for each operator in the string: compute all results of the left part, all results of the right part, and combine every pair with that operator. If the string has no operator, it is just a number: that is the base case, returning a list with that one value. Trace `2-1-1`: split at the first minus: left [2], right "1-1" gives [0], so 2 - 0 = 2. Split at the second minus: left "2-1" gives [1], right [1], so 1 - 1 = 0. Result [2, 0]. The same substrings appear again and again in longer inputs, so I cache the results by substring. The number of results is a Catalan number, which grows quickly, so the cost is dominated by the size of the output; there is no hope to do much better. Edge cases: a single number returns itself; numbers can have several digits ("11").',
      784: 'I restate it: for each letter in the string you may choose lower or upper case; digits stay as they are. Return all resulting strings. Every output is a different combination of choices, so the answer size is 2^L for L letters, and no algorithm can be faster than writing them all out. The structure is a choice at each position: a digit offers one option, a letter offers two. I build the answer one position at a time. Start with a list holding the empty string. For each character, if it is a digit, append it to every string in the list; if it is a letter, make two copies of every string, one with the lower-case letter and one with the upper-case letter. Trace "a1b2": start [""]. After "a": ["a", "A"]. After "1": ["a1", "A1"]. After "b": ["a1b", "a1B", "A1b", "A1B"]. After "2": four strings. This is the layer-by-layer version of the recursion `build(i, current)` that records the string when `i` reaches the end; same result, without stack depth. Edge cases: a string of only digits returns one string; a single letter returns two. Cost: O(n * 2^L) time and space for L letters, which is optimal since that is the output size. Order of the results does not matter for this problem.',
      1545: 'I restate it: S1 is "0", and Sn is S(n-1), then "1", then the reverse of the inverted S(n-1) (swap 0 and 1, then reverse). Return the k-th bit of Sn. The length is 2^n - 1, so for n = 20 building the string is a million characters, and larger n explodes. So I should find the character without building anything. The structure tells me where position k sits. The middle position, `mid = 2^(n-1)`, is always "1". If k is smaller than mid, the bit is the same as position k in S(n-1). If k is larger than mid, it is in the reversed, inverted copy: its mirror image in S(n-1) is at `2 * mid - k`, and the bit is the **inverse** of that one. Base case: S1 is "0". Trace `n = 4, k = 11`: mid = 8, k > 8, so mirror to position 5 in S3 and flip. In S3, mid = 4, 5 > 4, so mirror to position 3 in S2 and flip. In S2, mid = 2, 3 > 2, so mirror to position 1 in S1 and flip. S1 gives "0". Unwinding: flip gives 1, then flip gives 0, then flip gives 1. Answer "1". That matches S4 = 011100110110001, whose 11th character is 1. Cost: O(n) time and stack depth, because each call drops one level.',
      509: 'I restate it: F(0) = 0, F(1) = 1, each later number is the sum of the two before it; return F(n). Straight from the definition, `fib(n-1) + fib(n-2)` makes two calls per call, and the tree has about 1.6^n nodes, because it recomputes the same values; n = 30 is already 1.6 million calls and n = 50 is unusable. The bottleneck is repeated subproblems. Two easy fixes: cache each answer (memoization, O(n) time and O(n) stack), or build upward from the base cases. Each term only needs the previous two, so I keep two variables `a, b = 0, 1` and repeat `a, b = b, a + b` n times; at the end `a` holds F(n). Trace `n = 5`: (0, 1), (1, 1), (1, 2), (2, 3), (3, 5), (5, 8), so F(5) = 5. Edge cases: n = 0 runs zero times and returns 0; n = 1 returns 1. Cost: O(n) time, O(1) space, no recursion limit. The simple loop is the answer I give first; if the interviewer asks for faster, the doubling identities `F(2m) = F(m) * (2 F(m+1) - F(m))` and `F(2m+1) = F(m)^2 + F(m+1)^2` give O(log n) by recursing on n // 2, returning the pair (F(m), F(m+1)).',
      50: 'I restate it: compute x to the power n, where n can be negative and as large as about 2 billion. Multiplying x by itself n times is O(n), too slow. The observation: x^n is the square of x^(n/2), and when n is odd there is one extra factor of x. That is a recursive structure where the input halves each time. Base case: exponent 0 gives 1. I compute `half = power(x, e // 2)` **once**, then return `half * half`, times x if e is odd. Two identical calls would double the work at every level and bring back O(n); storing the half avoids it. A negative exponent means the reciprocal of the positive power. Trace `x = 2, n = 10`: e = 10 asks for e = 5, which asks for e = 2, then e = 1, then e = 0 returning 1. Unwinding: e = 1 gives 1*1*2 = 2; e = 2 gives 2*2 = 4; e = 5 gives 4*4*2 = 32; e = 10 gives 32*32 = 1024. For `n = -2` the answer is 1 / power(2, 2) = 0.25. Edge cases: n = 0 returns 1; n = -2^31 cannot be negated in a 32-bit int, so in Java or C++ I widen to a 64-bit integer first (Python has no problem); x = 0 with a negative n is undefined. Cost: O(log n) time and about 31 frames of stack.',
      206: 'I restate it: reverse a singly linked list and return the new head, recursively. The brute force copies values into an array and rebuilds, which uses O(n) extra nodes and misses the point. The recursive trick is to trust the call. Suppose `reverseList(head.next)` already reverses everything after the head and returns the new head. After that, `head.next` is the **tail** of the reversed part. So one more step finishes it: make that tail point back at head with `head.next.next = head`, and cut the old forward link with `head.next = None`, so the old head becomes the new tail. Return the new head unchanged. The base case is an empty list or a single node, which is already reversed. Trace `1 → 2 → 3`: the call on 1 asks for the call on 2, which asks for the call on 3; 3 is the base case and is returned as the new head. In the frame for 2: head.next is 3, so 3.next = 2, and 2.next = None, giving 3 → 2. In the frame for 1: 2.next = 1 and 1.next = None, giving 3 → 2 → 1. Forgetting `head.next = None` leaves a two-node cycle at the tail. Cost: O(n) time and O(n) stack; I would offer the three-pointer loop for O(1) space.',
      21: 'I restate it: merge two sorted linked lists into one sorted list by reusing the existing nodes, recursively. Copying everything into an array and sorting is O(n log n) and ignores the fact that both lists are already sorted. The key observation: the smallest node overall is one of the two **heads**. Take it, and the rest of the answer is the merge of what remains, the same problem with one fewer node. So compare the heads: keep the smaller node, set its `next` to the merge of the remaining lists, and return it. The base cases: if one list is empty, the answer is the other list, which is already in order and needs no copying. Using `<=` when the heads are equal keeps the merge stable, because list1’s node goes first. Trace `[1, 2, 4]` and `[1, 3, 4]`: heads 1 and 1, take the first list’s 1 and merge `[2, 4]` with `[1, 3, 4]`; the next smaller head is the second list’s 1, then 2, then 3, then the two 4s; when the first list runs out the remaining second-list nodes are returned as they are. Edge cases: both empty returns null; one empty returns the other. Cost: O(m + n) time, one frame per node placed, so O(m + n) stack; the loop with a dummy head uses O(1) space.'
    }
  };
})();
