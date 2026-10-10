(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['cp-starter'] = {
    primer: {
      kind: 'technique',
      what: `Competitive-programming style is solving problems against a **time limit** on hidden inputs, where the statement's **size limits** (n up to 20, 10^5, 10^9) tell you which algorithm is allowed. Think of the limit as a budget and each algorithm class (n², n log n, 2^n) as a price tag: you price before you build.`,
      does: `It turns a limit into an algorithm family: n up to 20 allows subsets, up to 5,000 allows O(n²), up to 10^5 needs O(n log n), up to 10^9 needs a formula or a binary search. It also covers fast input and output, big numbers (overflow, modulo 10^9+7), stress testing against a brute force, and upsolving.`,
      impl: `A compiled language does about 10^8 simple steps per second, Python about 10^7. Read all input at once (\`sys.stdin.buffer.read().split()\`), write all output once, keep sums in 64-bit (Python ints never overflow), reduce modulo after every multiply, and write a tiny brute force plus a random-input loop to compare against your fast solution.`,
      possibilities: `Binary search on the answer, sieve of primes, fast power and modular combinations, precomputed tables (binary lifting, sparse table), and the habit of picking the right complexity from the limits in interviews and contests alike.`
    },

    think: [
      {
        q: `A problem says n ≤ 10^5. You write an O(n²) solution. Roughly how many steps is that, and does it pass in Python? In C++?`,
        a: `n² = 10^10 steps. A compiled language does about 10^8 simple steps per second, so that is around 100 seconds; Python is roughly ten times slower. Neither passes a 1 to 2 second limit. The aha: at n = 10^5 you must aim for O(n log n), about 1.7 million steps, so think sorting, heaps, binary search or a single pass.`
      },
      {
        q: `n ≤ 20 and the question asks for the best subset of items. Why is a "try every subset" solution acceptable here, and what does it cost?`,
        a: `2^20 is about a million subsets, and checking one subset takes up to n = 20 steps, so roughly 2 × 10^7 steps, which fits. The limit is that small on purpose: it tells you brute force over subsets (or a bitmask DP) is the intended solution. If n were 40, 2^40 would be a trillion, and you'd need meet-in-the-middle.`
      },
      {
        q: `Python adds two numbers near 10^9 and multiplies them. In Java with \`int\`, what happens to the product, and what is the fix?`,
        a: `The product is near 10^18, far over the int maximum of about 2.1 × 10^9, so it silently wraps to a wrong (possibly negative) number. Fix: use \`long\` and **cast before multiplying**, \`(long) a * b\`; casting after (\`(long)(a * b)\`) overflows first. Python integers are arbitrary size, so this bug does not exist there, but modulo reduction still matters for speed.`
      },
      {
        q: `Why compute \`(a * b) % MOD\` after each step instead of multiplying everything and taking one mod at the end?`,
        a: `Because the true product can have millions of digits: it is slow in Python and impossible in a 64-bit type. Modular arithmetic lets you reduce after every addition and multiplication, since (a * b) mod m = ((a mod m) * (b mod m)) mod m. Division is the exception: multiply by the modular inverse instead.`
      },
      {
        q: `You find a solution that passes the samples but fails a hidden test. What is the fastest way to find the bug, and why use tiny random inputs?`,
        a: `Write a brute force that is obviously correct (try everything), then compare it with your fast solution on thousands of tiny random inputs (n from 1 to 8). A counterexample with six numbers can be traced by hand; one with 10^5 numbers cannot. Seed the random generator so a failure can be replayed.`
      },
      {
        q: `"Find the smallest capacity so that everything ships within D days." Why can you binary search on capacity?`,
        a: `Because the answer is **monotonic**: if capacity c works, every larger capacity also works. So the capacities split into "fails" then "works", and you search for the boundary. The check for one candidate is a cheap greedy pass. The wording "smallest value such that" plus a monotonic yes/no check is the signal.`
      }
    ],

    breakdown: [
      {
        title: `1. Read the limit before the story`,
        body: `Before understanding the plot, write down n, the value range, and the time limit. For example: "n ≤ 2·10^5, values ≤ 10^9, 2 seconds". The limit is the strongest hint in the statement, because the setter chose it so the intended solution passes and the slower ones fail. Put the numbers in a comment at the top of your code; it keeps you honest later when you are tempted to write something too slow.`
      },
      {
        title: `2. Price the classes`,
        body: `With n = 2·10^5: n = 2·10^5 steps, n log₂ n ≈ 3.5·10^6, n² = 4·10^10 (too slow), 2^n absurd. Budget is about 10^8 for compiled code and 10^7 for Python. So the target is O(n log n) or better. A rough table: n ≤ 10 → n!, n ≤ 20 → 2^n, n ≤ 500 → n³, n ≤ 5,000 → n², n ≤ 10^5 → n log n, n ≤ 10^6 → n, n ≤ 10^9 → log n or √n. Always check for a second limit (sum of n over tests, number of queries q) before you commit.`
      },
      {
        title: `3. Brute force first`,
        body: `Write the dumbest correct version, even if it is too slow: try all pairs, all subsets, or all capacities. Two reasons. If it fits the limit, you are done and the clever version only adds bugs. If it does not, you now have a **reference** to test the clever one against. Example: for "shortest day count to ship", simulate each capacity 1, 2, 3, ... until one works. It takes O(n · sum) but it is obviously right, and its answers will check your binary search later.`
      },
      {
        title: `4. Close the gap with the limit's own hint`,
        body: `Ask what changes the brute force's cost. Scanning every capacity is slow, but the feasibility check is monotonic, so binary search drops the scan from sum steps to log(sum) probes. Other common moves: sort and use two pointers (n² pairs → n log n), a sieve (marking multiples instead of testing each number), prefix sums (repeated range sums → O(1) each), a hash map (nested lookup → one pass). The statement's wording often gives it away: "smallest such that", "number of pairs", "modulo 10^9+7".`
      },
      {
        title: `5. Fast I/O and big numbers`,
        body: `With 10^5 to 10^6 numbers, reading can be the whole running time. In Python read everything once with \`sys.stdin.buffer.read().split()\` and print once with a joined string. In Java use BufferedReader and PrintWriter (not Scanner); in C++ turn off syncing with \`ios::sync_with_stdio(false); cin.tie(nullptr);\`. For sums and products over 2·10^9 use \`long\`/\`long long\`, cast before multiplying, and for "modulo 10^9+7" reduce after every multiply. Fast power computes b^e mod m in O(log e) by squaring.`,
        code: { py: `def pow_mod(b, e, m):
    r = 1
    b %= m
    while e:
        if e & 1:
            r = r * b % m        # this bit of the exponent is set
        b = b * b % m            # square for the next bit
        e >>= 1
    return r` }
      },
      {
        title: `6. Stress test, then submit`,
        body: `Generate thousands of tiny random inputs, run brute force and fast solution on each, and stop at the first difference. Use ranges that find bugs quickly: duplicates, negatives, all equal, n = 1. Seed the generator. After the contest, upsolve: finish what you missed, read the editorial, write one line in a log of what you missed ("limit was 20: should have thought bitmask"), and re-solve in a week. Interview angle: say the limit and complexity out loud first; interviewers hear "I priced the classes against the limit" as strong signal.`
      }
    ],

    drills: [
      {
        title: `Pairs with a small sum`,
        q: `Given a list of integers \`a\` (length up to 10^5, so pairs must not be enumerated one by one) and a number \`s\`, count the index pairs i < j with \`a[i] + a[j] <= s\`. Example: \`count_pairs_le([1, 5, 3, 4], 6)\` is 3 (the pairs 1+5, 1+3 and 1+4; the pair 3+4 = 7 is too big). Negative numbers are allowed.`,
        hint: `Sort first. If the smallest and largest sum is fine, then the smallest pairs with everything in between.`,
        how: `I restate it: count unordered pairs whose sum is at most s. Brute force checks all pairs, O(n²); at n = 10^5 that is 5·10^9 checks and fails the budget. The unlock is that the order of the array does not matter for an unordered pair count, so I sort. Then use two pointers, left at the smallest and right at the largest. If a[left] + a[right] is at most s, then a[left] also works with every element between left and right (they are all no larger than a[right]), so that adds right - left pairs at once, and I advance left, since I've counted all pairs with a[left] as the smaller side. If the sum is too big, a[right] is too large for anyone remaining on its left (even the smallest, a[left], fails), so I drop right by one. Each step moves a pointer, so it is O(n) after an O(n log n) sort. Trace on [1,5,3,4], s=6: sorted [1,3,4,5]. left=0,right=3: 1+5=6 ok, add 3 pairs, left=1. 3+5=8 too big, right=2. 3+4=7 too big, right=1. Stop. Answer 3. Edge cases: empty or one element gives 0; negatives work because the logic only uses ordering; large n requires only O(n log n). Cost: O(n log n) time, O(n) space for the sorted copy.`,
        code: { py: `def count_pairs_le(a, s):
    b = sorted(a)
    left, right, total = 0, len(b) - 1, 0
    while left < right:
        if b[left] + b[right] <= s:
            total += right - left      # b[left] pairs with everything up to right
            left += 1
        else:
            right -= 1                 # b[right] is too big for anyone left
    return total` },
        explain: `If the extremes satisfy the bound, the smaller element works with every element between them; if they don't, the larger one works with nobody. Each iteration discards one candidate: O(n log n) for the sort plus O(n).`,
        check: `assert count_pairs_le([1, 5, 3, 4], 6) == 3
assert count_pairs_le([], 5) == 0
assert count_pairs_le([5], 5) == 0
assert count_pairs_le([2, 2, 2], 4) == 3
assert count_pairs_le([-3, 0, 4], 1) == 3 - 1
import random
random.seed(1)
for _ in range(300):
    arr = [random.randint(-5, 5) for _ in range(random.randint(0, 9))]
    s = random.randint(-6, 6)
    brute = sum(1 for i in range(len(arr)) for j in range(i + 1, len(arr)) if arr[i] + arr[j] <= s)
    assert count_pairs_le(arr, s) == brute`
      },
      {
        title: `Longest equal rope pieces`,
        q: `You have ropes with integer lengths and need \`k\` pieces of the **same integer length** L, cut from the ropes (each rope can yield several pieces; leftovers are discarded). Return the largest L, or 0 if even length 1 cannot produce k pieces. Example: \`max_piece([8, 5, 9], 7)\` is 2: length 3 gives only 2+1+3 = 6 pieces, but length 2 gives 4+2+4 = 10 pieces.`,
        hint: `If length L gives enough pieces, does a smaller length also give enough? That monotonic behavior is the key.`,
        how: `I restate it: choose the biggest integer piece length such that the ropes together give at least k pieces. Brute force tries L from large to small, computing the sum of rope // L each time, which costs O(n) per L and up to max(rope) values of L, too slow when ropes are up to 10^9. The observation: as L grows, each rope yields fewer pieces, so the piece count never increases. If L works, every smaller length works, so the feasible lengths form a prefix and I want its end: classic binary search on the answer. The check for a candidate L is sum(r // L for each rope) >= k, one O(n) pass. Search range is 1 to the longest rope (a piece can't be longer). I use the upper mid: mid = (lo + hi + 1) // 2; if mid works, lo = mid, otherwise hi = mid - 1, which makes progress and avoids an infinite loop. If even L = 1 fails (the total length is below k), the answer is 0. Trace [8,5,9], k=7: range [1,9]. mid=5: 1+1+1=3 < 7, hi=4. mid=3 (lo=1,hi=4: (1+4+1)//2 = 3): 2+1+3=6 < 7, hi=2. mid=2 ((1+2+1)//2): 4+2+4=10 >= 7, lo=2. Done: 2. Cost: O(n log max) time, O(1) space.`,
        code: { py: `def max_piece(ropes, k):
    lo, hi = 0, max(ropes, default=0)      # lo = 0 means "nothing works yet"
    while lo < hi:
        mid = (lo + hi + 1) // 2           # upper mid: lo = mid must make progress
        if sum(r // mid for r in ropes) >= k:
            lo = mid                       # mid works: try longer
        else:
            hi = mid - 1                   # mid is too long
    return lo` },
        explain: `The piece count is non-increasing in L, so the feasible lengths are a prefix of 1..max and the largest feasible one is found by binary search with an O(n) check. Time O(n log max), space O(1).`,
        check: `assert max_piece([8, 5, 9], 7) == 2
assert max_piece([5], 1) == 5
assert max_piece([5], 5) == 1 and max_piece([5], 6) == 0
assert max_piece([1, 1], 3) == 0
assert max_piece([], 1) == 0
assert max_piece([10, 10], 4) == 5
import random
random.seed(2)
for _ in range(200):
    rs = [random.randint(1, 12) for _ in range(random.randint(1, 5))]
    k = random.randint(1, 15)
    brute = max([L for L in range(1, max(rs) + 1) if sum(r // L for r in rs) >= k], default=0)
    assert max_piece(rs, k) == brute`
      },
      {
        title: `Many binomials, modulo a prime`,
        q: `Build a class \`Combo(N)\` with a method \`ncr(n, r)\` that returns C(n, r) modulo 1_000_000_007 for any 0 ≤ n ≤ N, in O(1) per query after O(N) setup. If r < 0 or r > n return 0. Example: \`Combo(10).ncr(5, 2)\` is 10; \`Combo(100).ncr(100, 50)\` is 538992043.`,
        hint: `C(n, r) = n! / (r! (n-r)!). You can't divide under a modulus, but for a prime modulus you can multiply by an inverse computed with fast power.`,
        how: `I restate it: answer many "n choose r" queries quickly, with results reduced modulo the prime 10^9+7. Brute force builds Pascal's triangle, O(N²) memory and time, too slow if N is 10^6. Computing the factorial formula directly needs division, and the modulus breaks ordinary division. The observation: modulo a prime p, every non-zero x has an inverse, x^(p-2) by Fermat's little theorem, so I can divide by multiplying with it. The plan: precompute fact[i] = i! mod p for all i up to N with one running product. Then compute inv_fact[N] = pow(fact[N], p-2, p) once and walk downward, inv_fact[i-1] = inv_fact[i] * i % p, which avoids N separate fast powers. A query is fact[n] * inv_fact[r] % p * inv_fact[n-r] % p. Trace C(5,2): fact = [1,1,2,6,24,120], 120 / (2·6) = 10, and the modular route gives the same 10 because 120 * inv(2) * inv(6) mod p equals 10 exactly. Edge cases: r > n or r < 0 returns 0; r = 0 or r = n returns 1. In Java or C++ the product of two residues needs a 64-bit type, and reduce after each multiplication. Cost: O(N) setup, O(1) per query, O(N) memory.`,
        code: { py: `MOD = 1_000_000_007

class Combo:
    def __init__(self, N):
        self.fact = [1] * (N + 1)
        for i in range(1, N + 1):
            self.fact[i] = self.fact[i - 1] * i % MOD
        self.inv = [1] * (N + 1)
        self.inv[N] = pow(self.fact[N], MOD - 2, MOD)     # one modular inverse
        for i in range(N, 0, -1):
            self.inv[i - 1] = self.inv[i] * i % MOD        # walk it down: (i-1)!^-1

    def ncr(self, n, r):
        if r < 0 or r > n:
            return 0
        return self.fact[n] * self.inv[r] % MOD * self.inv[n - r] % MOD` },
        explain: `Fermat's little theorem gives x^(MOD-2) as the inverse of x for a prime MOD, and inverse factorials chain downward from one fast power. Setup O(N) (plus O(log MOD)), queries O(1).`,
        check: `import math
c = Combo(1000)
assert c.ncr(5, 2) == 10
assert Combo(100).ncr(100, 50) == 538992043
assert c.ncr(7, 0) == 1 and c.ncr(7, 7) == 1
assert c.ncr(3, 5) == 0 and c.ncr(3, -1) == 0
for n in (0, 1, 10, 57, 500, 1000):
    for r in (0, 1, n // 2, n):
        assert c.ncr(n, r) == math.comb(n, r) % MOD`
      },
      {
        title: `Write the stress harness`,
        q: `Implement \`find_counterexample(fast, brute, gen, trials=2000, seed=0)\`. It builds \`rng = random.Random(seed)\`, then repeats up to \`trials\` times: \`x = gen(rng)\`; if \`fast(x) != brute(x)\` return \`x\`. If no difference is found return \`None\`. This is the tool you reach for when a solution passes samples but fails hidden tests. Example: given a Kadane implementation that wrongly starts its best at 0, it returns a small all-negative list.`,
        hint: `The harness is a loop and one comparison. The skill is in the choice of tiny inputs and in seeding so a failure can be replayed.`,
        how: `I restate it: a function that automates "find a small input where my fast solution disagrees with the slow, trusted one". Doing it by staring at code is slow, and a failing hidden test may have 10^5 numbers that I cannot trace. The observation: if I can generate inputs, the computer can search, and a bug usually shows up on a tiny input if I include edge-heavy values (negatives, duplicates, length 1). So the harness takes the three pieces as parameters: the fast function, the brute function, and a generator that takes a random number generator. Seeding with random.Random(seed) makes a failure reproducible: the same seed produces the same inputs, so once I see a counterexample I can re-run and debug it. The loop is for trials times: x = gen(rng); compare; return x on the first mismatch, otherwise None. I return the input itself, not just True or False, because the input is what I need to trace by hand. Trace with the buggy Kadane that starts best at 0: on [-3] the brute force says -3, the fast says 0, so the harness returns [-3] (or a similarly small list). Pitfalls: if gen reuses mutable state, fast may mutate the input before brute runs, so I pass a copy or build fresh data in gen. Cost: trials times the cost of both functions on a tiny input, so negligible.`,
        code: { py: `import random

def find_counterexample(fast, brute, gen, trials=2000, seed=0):
    rng = random.Random(seed)            # seeded: a failure can be replayed exactly
    for _ in range(trials):
        x = gen(rng)
        if fast(x) != brute(x):
            return x                     # tiny input that breaks the fast solution
    return None` },
        explain: `Random testing on small inputs exposes most logic bugs, and returning the failing input makes it debuggable. Time is trials times the cost of the two functions on small input.`,
        check: `def brute(a):
    return max(sum(a[i:j + 1]) for i in range(len(a)) for j in range(i, len(a)))

def buggy(a):
    best = cur = 0                       # bug: all-negative arrays return 0
    for x in a:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best

def good(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best

def gen(rng):
    return [rng.randint(-5, 5) for _ in range(rng.randint(1, 6))]

bad = find_counterexample(buggy, brute, gen)
assert bad is not None and buggy(bad) != brute(bad)
assert find_counterexample(good, brute, gen) is None
assert find_counterexample(good, brute, gen, trials=0) is None
assert find_counterexample(buggy, brute, gen, seed=5) == find_counterexample(buggy, brute, gen, seed=5)`
      }
    ],

    how: {
      1235: `I restate it: jobs have a start, an end and a profit; I can run one at a time, and a job may start exactly when another ends. I want the maximum total profit. Brute force tries every subset of jobs and keeps the best non-overlapping one: 2^n, fine for 20 jobs but the real limit is 5·10^4. A pairwise DP, where each job looks back at all earlier jobs, is O(n²) = 2.5·10^9, still too slow. The limit tells me I need O(n log n): sort, then one log-time lookup per job. I sort jobs by end time. For each job there are two choices: skip it, and the best so far stays; or take it, which adds its profit to the best total among jobs that end no later than its start. Those earlier ends are sorted, so a binary search finds that spot. I keep two parallel arrays, ends and best, and only append an entry when taking this job beats the current best, so both arrays stay sorted. Starting with ends=[0] and best=[0] represents the empty schedule. Using bisect_right on ends with the job's start, then stepping back one entry, a job starting exactly when another ends can chain. Trace [1,2,3,3] / [3,4,5,6] / [50,10,40,70]: the job ending at 3 gives 50; the job ending at 4 gives 10 (50 stays); the job ending at 5 starting at 3 gives 50+40=90; the job ending at 6 starting at 3 gives 50+70=120. Answer 120. Cost: O(n log n) time, O(n) space.`,
      2104: `I restate it: for every contiguous subarray, take the max minus the min, and sum those ranges over all subarrays. Brute force scans each subarray for its min and max: there are about n²/2 subarrays and each scan is O(n), so O(n³). I improve by fixing the left end and extending the right end one element at a time while keeping a running min and max, so each new subarray costs O(1): O(n²) total. Then I read the limit, which is n ≤ 1,000: that is about 500,000 subarrays, one million steps, far inside the budget, so this simple O(n²) loop is the intended solution and a monotonic-stack contribution trick would only add bugs. If the limit were 10^5 I'd switch to counting for each element how many subarrays it is the max or min of, using monotonic stacks, for O(n). The real trap is numeric: the sum can reach roughly 5·10^5 subarrays times a range near 2·10^9, so around 10^15, which overflows a 32-bit int, so in Java or C++ the total must be a long. Trace [1,2,3]: from start 0: [1] range 0, [1,2] range 1, [1,2,3] range 2; from start 1: [2] 0, [2,3] 1; from 2: [3] 0. Sum 4. A single element or constant array gives 0. Cost: O(n²) time, O(1) space.`,
      1015: `I restate it: numbers made only of ones (1, 11, 111, ...) — find the length of the shortest one divisible by K, or -1 if none exists. Brute force builds each repunit as an integer and checks the remainder, but the number has length digits, so it quickly outgrows 64 bits and takes O(length) per step to build and divide. The observation is that I never need the number, only its remainder modulo K. Appending a 1 turns x into 10x + 1, and remainders follow the same rule: new remainder = (old * 10 + 1) % K. So I loop with a single integer r, and the first time r hits 0 I return the current length. How long must I try? There are only K possible remainders, so if none of the first K lengths gives 0, a remainder has repeated and the sequence cycles without ever reaching 0, so I return -1 after K steps. A quick shortcut: if K is even or ends in 5, every repunit ends in 1 and can't be divisible, but the loop handles this automatically. Trace K=3: r = 1, then (10+1)%3 = 2, then (20+1)%3 = 0 at length 3, so 3 (111 = 3·37). K=2: remainders 1, 1, 1, ... never 0 so -1 after 2 steps. Edge case K=1: r = 0 immediately, so 1. Cost: O(K) time, O(1) space.`
    }
  };
})();
