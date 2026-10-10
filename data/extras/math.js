(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['math'] = {
    primer: {
      kind: 'technique',
      what: `Interview math is a short toolkit of number tricks, not a data structure: **gcd** (the biggest shared divisor), **primes**, **modular arithmetic** (math on a clock with m hours, where numbers wrap around), **fast power**, and **digit and carry** handling. Think of a calculator that can never overflow because you wrap the numbers yourself.`,
      does: `Each trick replaces a loop that would never finish with a few dozen steps: gcd in O(log n), all primes below n with a sieve in O(n log log n), one primality test in O(sqrt n), and x^n in O(log n). Modular rules keep huge counts inside 64 bits, and carries let you add or multiply numbers longer than any integer type.`,
      impl: `Euclid loops \`a, b = b, a % b\` until \`b\` is 0. The sieve is a boolean list where every surviving prime crosses off its multiples starting at \`p*p\`. Fast power squares the base while walking the bits of the exponent. Mod arithmetic reduces after every \`+\`, \`-\`, \`*\`; "division" is multiplying by \`pow(b, p-2, p)\`. Python has \`math.gcd\`, \`pow(a, b, m)\` and unbounded ints; other languages need 64-bit care.`,
      possibilities: `Happy numbers and other digit loops, plus-one and string addition or multiplication, counting primes, trailing zeros of a factorial, \`pow(x, n)\`, "answer modulo 10^9 + 7" counting with nCr, palindromic numbers, the lcm of several periods ("when do all lights blink together"), and counting squares on a grid with a hash map.`
    },

    think: [
      {
        q: `Trace Euclid's algorithm on \`gcd(48, 18)\`. Write each pair \`(a, b)\` until it stops. What is the answer, and what does the last non-zero value mean?`,
        a: `(48, 18) becomes (18, 12) because 48 % 18 = 12, then (12, 6), then (6, 0). Stop: the answer is 6. The aha: each step swaps in the remainder, and anything that divides both numbers also divides the remainder, so the set of common divisors never changes. The last non-zero value is the biggest one left, which is why \`gcd(0, x) = x\`.`
      },
      {
        q: `You run a sieve for n = 30 (primes below 30). Which values of \`p\` actually cross things out, and where does p = 5 start crossing?`,
        a: `The outer loop runs while \`p * p < 30\`, so p = 2, 3, 5 (6 * 6 = 36 is too big). All three are still standing when reached, so all three cross. p = 5 starts at 25, not 10: 10, 15 and 20 were already crossed by 2 and 3. Only 25 remains to remove. The survivors are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29: ten primes.`
      },
      {
        q: `What do \`(-7) % 3\` print in Python and in Java? And how do you write \`(a - b) mod m\` so it is correct in both?`,
        a: `Python prints 2 and Java prints -1. Python's remainder takes the sign of the divisor (3), Java's takes the sign of the dividend (-7). A modular answer must be between 0 and m-1, so write \`((a - b) % m + m) % m\`: the \`+ m\` pushes a negative remainder up into range, and the second \`% m\` fixes the case where it was already non-negative.`
      },
      {
        q: `Compute x^13 using squaring only. How many multiplications does it take, and which powers of x get multiplied into the answer?`,
        a: `13 in binary is 1101, which means 13 = 8 + 4 + 1, so x^13 = x^1 * x^4 * x^8. Square x three times to get x^2, x^4, x^8 (3 multiplications), then multiply the three needed powers together (2 more). That is 5 instead of 12. The loop does it automatically: when the lowest bit of the exponent is 1, multiply the current power in; always square and shift.`
      },
      {
        q: `Happy-number step: add the squares of the digits. A 10-digit number can be up to 9,999,999,999. Why can the sequence not grow forever?`,
        a: `The biggest next value from 10 digits is 10 * 81 = 810, so after one step the number is already tiny, and a tiny number's next value is also small. A sequence stuck in a small finite range must repeat some value sooner or later. Once a value repeats, the sequence loops forever. So there are only two outcomes: it reaches 1 (and stays at 1) or it falls into a cycle that never contains 1.`
      },
      {
        q: `Why is \`(10 / 5) % 7\` not equal to \`(10 % 7) / (5 % 7)\`? What do you do instead when a counting formula divides?`,
        a: `The left side is 2. The right side is 3 / 5, which is not even a whole number. Reducing before dividing breaks because remainders only respect +, - and *. For a prime modulus p you replace "divide by b" with "multiply by the inverse of b", which is \`b^(p-2) mod p\`, and that is one fast power. This is how nCr mod 10^9 + 7 is computed from factorials.`
      }
    ],

    breakdown: [
      {
        title: `1. gcd by hand: shrink the pair`,
        body: `Two ropes, 252 m and 105 m. The longest ruler that measures both exactly? Lay the short rope on the long one: it fits twice (210) with 42 left over. Anything that measures both ropes also measures the 42 scrap, so the problem becomes (105, 42). Then 105 = 2*42 + 21 gives (42, 21). Then 42 = 2*21 + 0 gives (21, 0). The last non-zero number, **21**, is the answer. Each step replaces a pair by (smaller, remainder), and the numbers shrink very fast: the remainder is under half the bigger number after two steps, so the loop runs O(log n) times.`
      },
      {
        title: `2. Euclid as code, then lcm`,
        body: `The loop is three lines. \`gcd(0, x) = x\`, so folding a whole list works by starting at 0. The least common multiple follows: \`lcm(a, b) = a // gcd * b\`. **Divide first**, then multiply, so the temporary value never exceeds the answer (\`a * b\` can overflow when the lcm itself fits). Two numbers are **coprime** when their gcd is 1. In an interview, "when do the lights blink together" and "cut both ropes into equal pieces" are the same gcd/lcm pair.`,
        code: { py: `def gcd(a, b):
    while b:
        a, b = b, a % b       # the pair shrinks; b hits 0 at the end
    return a

def lcm(a, b):
    return a // gcd(a, b) * b # divide first` }
      },
      {
        title: `3. Is one number prime? Stop at the square root`,
        body: `Take n = 36. Its divisor pairs are (2,18), (3,12), (4,9), (6,6). In every pair one member is at most 6, which is the square root. So if n has any divisor, it has one in 2..sqrt(n); trying d = 2, 3, ... while \`d * d <= n\` is enough. For n = 97: d up to 9 (since 10*10 = 100 > 97), none divides it, so 97 is prime. Cost O(sqrt n): about 31,000 tries for a number near 10^9. Edge cases: 0 and 1 are not prime, 2 is. Use this for **one** number; for "all primes below n" use a sieve.`
      },
      {
        title: `4. The sieve: cross off, do not test`,
        body: `Write 2..29. Take 2 (standing, so prime): cross 4, 6, 8, ... 28. Take 3: cross from 9 (6 is already gone): 9, 12, 15, 18, 21, 24, 27. Take 5: cross from 25. Next p = 7, but 49 > 30, so stop. What is still standing is prime. Two savings make it fast: start each prime at \`p*p\` (smaller multiples have a smaller prime factor and were crossed already) and stop when \`p*p >= n\` (every composite below n has a factor below sqrt(n)). Total work is about n log log n, nearly linear, with one boolean per number.`,
        code: { py: `def count_primes(n):
    if n < 3:
        return 0
    is_prime = [True] * n
    is_prime[0] = is_prime[1] = False
    p = 2
    while p * p < n:
        if is_prime[p]:
            for m in range(p * p, n, p):
                is_prime[m] = False
        p += 1
    return sum(is_prime)` }
      },
      {
        title: `5. The clock: modular arithmetic`,
        body: `"Return the answer modulo 10^9 + 7" means: only the remainder on a clock of that many hours. You may reduce after every step: \`(a + b) % m = ((a % m) + (b % m)) % m\`, and the same for \`-\` and \`*\`. Example with m = 5: 7 * 8 = 56, and 56 % 5 = 1; also (7 % 5) * (8 % 5) = 2 * 3 = 6, and 6 % 5 = 1. Same. Numbers never grow past m. Two cautions. A product of two numbers below 10^9 + 7 is about 10^18: fine in 64 bits, an overflow in 32 bits. And a subtraction can go negative in Java, C++ and JS, so add \`m\` before the final \`%\`.`
      },
      {
        title: `6. Fast power: square, do not repeat`,
        body: `Compute 3^13 mod 1000. 13 = 1101 in binary. Start result = 1, base = 3, exp = 13. exp odd: result = 3; base = 9; exp = 6. exp even: base = 81; exp = 3. exp odd: result = 3*81 = 243; base = 6561 -> 561 mod 1000; exp = 1. exp odd: result = 243 * 561 = 136,323 -> 323; exp = 0. Answer 323 (3^13 = 1,594,323). That is 4 rounds, not 13 multiplications, and for an exponent near 10^18 it is about 60 rounds. Negative exponent: invert the base first. Edge: exponent 0 returns 1.`,
        code: { py: `def pow_mod(base, exp, mod):
    result, base = 1, base % mod
    while exp:
        if exp & 1:
            result = result * base % mod
        base = base * base % mod
        exp >>= 1
    return result` }
      },
      {
        title: `7. Dividing on the clock: the inverse`,
        body: `There is no "divide by 3" modulo 7, but there is "multiply by the number that undoes 3": 3 * 5 = 15 = 1 (mod 7), so 5 is the inverse of 3. For a **prime** modulus p, the inverse of a is \`a^(p-2) mod p\` (Fermat's little theorem), one fast power. So "10 / 3 mod 7" is 10 * 5 = 50 = 1 (mod 7). This powers nCr: \`n! * inv(r!) * inv((n-r)!)\` with all factorials kept mod p. Build the factorial table once in O(n); every query is then a few multiplications. The inverse exists only when gcd(a, p) = 1, which is automatic for a prime modulus unless a is a multiple of p.`
      },
      {
        title: `8. Digits and carries, and how to recognise the topic`,
        body: `Peel digits: \`n % 10\` is the last digit, \`n // 10\` the rest. For 1234 you get 4, 3, 2, 1 in that order (digit sums, reversal, palindromes). For huge numbers given as strings, go right to left with a carry: 999 + 1 gives digits 0,0,0 with carry 1 left over, so the answer is 1000 (the last carry is the classic miss). "Plus one" is the same loop that stops early when a digit is below 9. **Spotting it:** modulo in the statement, "divisors/multiples/coprime", "count primes", a gigantic exponent, numbers as strings, or a digit rule that repeats (think Floyd: a cycle hides there).`
      }
    ],

    drills: [
      {
        title: `Blinking lights`,
        q: `Lights blink with whole-number periods in seconds. Given a non-empty list \`periods\`, all lights blink together at time 0. Return the next time (in seconds, greater than 0) at which all of them blink together. Example: \`[4, 6, 10]\` returns \`60\`; \`[7]\` returns \`7\`; \`[3, 5, 7]\` returns \`105\`.`,
        hint: `The first time two periods align is their lcm. Fold the list one period at a time.`,
        how: `I restate it as: find the smallest positive number that every period divides, which is the lcm of the whole list. The brute force counts t = 1, 2, 3, ... and tests every period at each t. That works for [4, 6, 10] but with periods like 999,983 and 1,000,003 it needs about 10^12 steps, far too slow. The observation that unlocks it: the lcm of two numbers comes from their gcd, \`lcm(a, b) = a / gcd(a, b) * b\`, and the lcm of a list is built by folding: the next common time of everything seen so far with the next period. Trace [4, 6, 10]: start t = 1. With 4: gcd(1, 4) = 1, so t = 4. With 6: gcd(4, 6) = 2, so t = 4 / 2 * 6 = 12. With 10: gcd(12, 10) = 2, so t = 12 / 2 * 10 = 60. Right. I write Euclid by hand (three lines) instead of importing it, because interviewers like to see the loop. I divide before multiplying: harmless in Python, but in Java or C++ the product t * p could overflow even when the final lcm fits. Edge cases: a single period returns itself (gcd(1, p) = 1); duplicate periods change nothing; periods equal to 1 change nothing. Cost: each fold step is O(log) for the gcd, so O(k log M) for k periods of size up to M, and O(1) extra space.`,
        code: { py: `def together(periods):
    def gcd(a, b):
        while b:
            a, b = b, a % b
        return a

    t = 1
    for p in periods:
        t = t // gcd(t, p) * p      # divide first, then multiply
    return t`,
          js: `function together(periods) {
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  let t = 1;
  for (const p of periods) t = t / gcd(t, p) * p;   // divide first, then multiply
  return t;
}` },
        explain: `After processing a prefix of the list, t is the lcm of that prefix, since lcm(lcm(a, b), c) = lcm(a, b, c). Dividing t by gcd(t, p) first leaves an exact integer, so the result is exact. Time O(k log M) for k periods bounded by M, space O(1).`,
        check: `from math import gcd as g, lcm as L
assert together([4, 6, 10]) == 60
assert together([7]) == 7
assert together([3, 5, 7]) == 105
assert together([1, 1]) == 1
assert together([12, 12, 12]) == 12
assert together([999983, 1000003]) == 999983 * 1000003
import functools
assert together([2, 3, 4, 5, 6, 7, 8, 9, 10]) == functools.reduce(L, [2, 3, 4, 5, 6, 7, 8, 9, 10])`
      },
      {
        title: `Prime recipe`,
        q: `Return the prime factorisation of n (n >= 1, up to about 10^12) as a list of \`(prime, exponent)\` pairs in increasing prime order. Example: \`360\` returns \`[(2, 3), (3, 2), (5, 1)]\` because 360 = 2^3 * 3^2 * 5. \`97\` returns \`[(97, 1)]\`. \`1\` returns \`[]\`.`,
        hint: `Divide out each divisor completely as soon as you find it, and let the stopping bound shrink as n shrinks.`,
        how: `I restate it: break n into primes with how many times each appears. The brute force tries every d from 2 up to n, which for n near 10^12 is a trillion steps. The first improvement is the square-root idea: if n has a factor, it has one at most sqrt(n), so trying d up to 10^6 is enough. The second observation is what makes it simple: when I find that d divides n, I divide n by d again and again until d no longer divides it, counting the exponent. After that, d cannot divide the smaller n, and no composite d can ever divide n later, because its prime factors were already removed. So I do not need a primality test or a sieve; I just walk d = 2, 3, 4, ... and composite values of d silently never match. The bound is also re-checked against the shrinking n: \`d * d <= n\`. When the loop ends, whatever is left in n is either 1 or a single prime larger than the last d, so I append it with exponent 1. Trace 360: d = 2 divides three times (360 -> 45), record (2, 3); d = 3 divides twice (45 -> 5), record (3, 2); d = 4: 16 > 5 so stop; leftover 5 > 1, record (5, 1). Edge cases: n = 1 gives an empty list; a prime gives itself; a prime square like 49 gives (7, 2) because the leftover is 1. Time O(sqrt n) worst case when n is prime, O(1) extra space besides the output.`,
        code: { py: `def factorize(n):
    out = []
    d = 2
    while d * d <= n:
        if n % d == 0:
            e = 0
            while n % d == 0:     # remove every copy of d
                n //= d
                e += 1
            out.append((d, e))
        d += 1
    if n > 1:                     # a leftover prime bigger than sqrt of what remained
        out.append((n, 1))
    return out` },
        explain: `Each divisor is removed completely, so only primes can ever divide the remaining n (a composite d would need prime factors already stripped). If n is still above 1 after the loop it has no factor up to its own square root, so it is prime. Time O(sqrt n), space O(1) beyond the output.`,
        check: `assert factorize(360) == [(2, 3), (3, 2), (5, 1)]
assert factorize(97) == [(97, 1)]
assert factorize(1) == []
assert factorize(49) == [(7, 2)]
assert factorize(2) == [(2, 1)]
assert factorize(10**12) == [(2, 12), (5, 12)]
assert factorize(999999937) == [(999999937, 1)]
assert factorize(600851475143) == [(71, 1), (839, 1), (1471, 1), (6857, 1)]
for n in range(1, 500):
    prod = 1
    for p, e in factorize(n):
        prod *= p ** e
    assert prod == n`
      },
      {
        title: `Digit-square loops`,
        q: `Define \`step(x)\` as the sum of the squares of the digits of x. Starting from n >= 0 and repeating \`n -> step(n)\`, the sequence eventually enters a cycle. Return the **length of that cycle**, using O(1) extra memory. Example: \`19\` returns \`1\` (19 -> 82 -> 68 -> 100 -> 1 -> 1 -> ...). \`2\` returns \`8\` (2 -> 4 -> 16 -> 37 -> 58 -> 89 -> 145 -> 42 -> 20 -> 4 ...).`,
        hint: `Floyd's two pointers: first find a meeting point inside the cycle, then walk once around it counting.`,
        how: `I restate it: follow the sequence until it repeats and report how many distinct values are in the repeating part. Brute force remembers every value in a set and counts the cycle when one comes back; that is correct but the problem asks for O(1) memory. The sequence has to repeat because every value after the first step is small (at most 81 times the number of digits), so only finitely many values exist. That is exactly the setting for Floyd's tortoise and hare. Slow takes one step, fast takes two. If there is a cycle they must meet inside it. Phase one: move slow = f(slow), fast = f(f(fast)) until they are equal. Phase two: the meeting point is inside the cycle, so I step once from it and walk until I return to it, counting steps; that count is the cycle length. Trace 19: f(19) = 82, f(82) = 68, f(68) = 100, f(100) = 1, f(1) = 1. Slow starts at 82, fast at 68; then slow 68, fast 1; slow 100, fast 1; slow 1, fast 1: they meet at 1. From 1, one step returns to 1, so length 1. Trace 2: they meet somewhere inside the eight-value loop and walking around counts 8. Edge cases: n = 0 maps to 0 (cycle length 1); n = 1 has slow and fast equal at the start of phase one. Time is a small number of steps times O(digits) per step; space O(1).`,
        code: { py: `def cycle_len(n):
    def f(x):
        s = 0
        while x:
            s += (x % 10) ** 2
            x //= 10
        return s

    slow, fast = f(n), f(f(n))
    while slow != fast:             # phase 1: meet inside the cycle
        slow = f(slow)
        fast = f(f(fast))
    length, cur = 1, f(slow)        # phase 2: walk once around
    while cur != slow:
        cur = f(cur)
        length += 1
    return length` },
        explain: `Floyd's method guarantees a meeting inside the cycle because the fast pointer gains one position per round on the slow one once both are in it. Walking once around from the meeting point counts the cycle exactly. The values are bounded, so the loops finish. Time is a small constant number of steps times O(log n) per digit sum, space O(1).`,
        check: `def brute(n):
    def f(x):
        return sum(int(c) ** 2 for c in str(x))
    seen = {}
    i = 0
    while n not in seen:
        seen[n] = i
        n = f(n)
        i += 1
    return i - seen[n]
assert cycle_len(19) == 1
assert cycle_len(2) == 8
assert cycle_len(1) == 1
assert cycle_len(0) == 1
assert cycle_len(4) == 8
assert cycle_len(2147483647) == brute(2147483647)
for n in range(0, 400):
    assert cycle_len(n) == brute(n), n`
      },
      {
        title: `Committee lookup table`,
        q: `Implement \`binom_queries(n_max, queries)\`. \`queries\` is a list of pairs \`(n, r)\` with \`0 <= n <= n_max\` (n_max up to 10^6). Return, for each pair, the number of ways to choose r items from n, modulo \`10**9 + 7\` (return 0 if r < 0 or r > n). It must answer many queries quickly after one shared setup. Example: \`binom_queries(10, [(5, 2), (10, 3), (4, 6)])\` returns \`[10, 120, 0]\`.`,
        hint: `Keep factorials mod p, and replace the division by inverse factorials. You can get all inverse factorials from a single fast power.`,
        how: `I restate it: n! / (r! (n-r)!) for many (n, r), reduced mod the prime p = 10^9 + 7. The real values are astronomically large, so I must keep everything modulo p. Brute force: Pascal's triangle gives C(n, r) with only additions, but it costs O(n_max^2) memory and time; at n_max = 10^6 that is 10^12 entries, impossible. The next idea is to compute the factorial table fact[i] = fact[i-1] * i mod p in O(n_max). Division is the problem: (a / b) mod p is not (a mod p) / (b mod p), so I multiply by the modular inverse, which exists because p is prime: inverse(x) = x^(p-2) mod p. One fast power per query works, O(log p) each, but there is a neater trick. I compute only one inverse, of fact[n_max], with pow(fact[n_max], p - 2, p). Then going down, inv_fact[i-1] = inv_fact[i] * i mod p, because 1/(i-1)! = i / i!. After that every query is O(1): fact[n] * inv_fact[r] % p * inv_fact[n-r] % p. Trace on a tiny case: C(5, 2) = 120 * inv(2) * inv(6) = 120 / 12 = 10. Edge cases: r > n or r < 0 returns 0; n = 0, r = 0 returns 1; r = 0 and r = n return 1. Cost: O(n_max + log p) setup, O(1) per query, O(n_max) space. In Java or C++ I would use long for the products, since two values near 10^9 multiply to about 10^18.`,
        code: { py: `MOD = 10**9 + 7

def binom_queries(n_max, queries):
    fact = [1] * (n_max + 1)
    for i in range(1, n_max + 1):
        fact[i] = fact[i - 1] * i % MOD
    inv = [1] * (n_max + 1)
    inv[n_max] = pow(fact[n_max], MOD - 2, MOD)    # the only modular inverse
    for i in range(n_max, 0, -1):
        inv[i - 1] = inv[i] * i % MOD              # 1/(i-1)! = i * (1/i!)
    out = []
    for n, r in queries:
        if r < 0 or r > n:
            out.append(0)
        else:
            out.append(fact[n] * inv[r] % MOD * inv[n - r] % MOD)
    return out` },
        explain: `fact[n] * inv[r] * inv[n-r] equals n! / (r! (n-r)!) modulo p because inv[k] is the inverse of k! and p is prime, so no factorial up to 10^6 is a multiple of p. The backward recurrence is valid because (i-1)! * i = i!. Setup O(n_max), queries O(1), space O(n_max).`,
        check: `from math import comb
assert binom_queries(10, [(5, 2), (10, 3), (4, 6)]) == [10, 120, 0]
assert binom_queries(0, [(0, 0)]) == [1]
assert binom_queries(5, [(5, 0), (5, 5), (3, -1)]) == [1, 1, 0]
qs = [(n, r) for n in range(0, 60) for r in range(-1, 62)]
res = binom_queries(60, qs)
for (n, r), v in zip(qs, res):
    assert v == (comb(n, r) % MOD if 0 <= r <= n else 0), (n, r)
big = binom_queries(1000, [(1000, 500)])
assert big == [comb(1000, 500) % MOD]
assert binom_queries(2000, [(1999, 1000)]) == [comb(1999, 1000) % MOD]`
      }
    ],

    how: {
      202: `Restating: repeatedly replace n by the sum of the squares of its digits; return true if you reach 1, false otherwise. The brute force is to keep going and hope. That fails for unhappy numbers because they never stop, so the real question is how to know when to stop. The key observation is that the sequence cannot grow without bound: a number with d digits maps to at most 81d, so even a 10-digit input becomes at most 810 on the first step, and from then on values stay small. A sequence in a small finite range must repeat a value, and once it repeats it loops forever. So there are exactly two outcomes: it hits 1 (and 1 maps to 1), or it falls into a cycle without 1. I write step(x) by peeling digits with % 10 and // 10. To detect repetition I either keep a set of seen values (easy to say, O(number of steps) memory) or use Floyd's two pointers, slow one step and fast two, which uses O(1) memory. Trace 19: 19 -> 82 -> 68 -> 100 -> 1, happy. Trace 2: 2 -> 4 -> 16 -> 37 -> 58 -> 89 -> 145 -> 42 -> 20 -> 4, repeat, not happy. Edge cases: n = 1 is happy immediately; large inputs like 2147483647 collapse to a small number in one step. Each step is O(log n) for the digits, and the number of steps is small and bounded, so time is effectively O(log n) and space O(1) with Floyd.`,
      66: `Restating: the digits of a non-negative integer are in an array, most significant first. Add one and return the new digit array. The brute force is to convert to an integer, add 1 and convert back. In Python that even works, but the array form exists precisely so you do not rely on a big-number type, and in other languages the number may not fit. The observation is that adding one is just the school carry rule starting at the right end. If the last digit is below 9, I increase it and I am finished, since nothing carries. If it is a 9, it becomes 0 and the carry moves one place left, so I continue with the next digit. Trace [1, 2, 9]: the 9 becomes 0 and carries, then 2 becomes 3 and I stop: [1, 3, 0]. Trace [9, 9]: both become 0 and the carry falls off the left end, so the answer has one more digit, a 1 followed by zeros: [1, 0, 0]. That is the one edge case that matters: all nines. Another small one: [0] gives [1], handled by the normal branch. I use one right-to-left loop with an early return; the all-nines case is the fall-through after the loop. Time is O(n) in the worst case (all nines) and O(1) on average when the last digit is below 9. Extra space is O(1), or O(n) in the all-nines case when a new array is needed.`,
      50: `Restating: compute x to the power n, where n can be negative, zero or around two billion. Multiplying x by itself n times is O(n); with n near 2 * 10^9 that is far too slow, and recursion n deep would overflow the stack. The observation is that powers split in half: x^10 = (x^5)^2 and x^5 = x * (x^2)^2. Looking at n in binary makes it a loop: keep x as the current power of two power (x, x^2, x^4, x^8, ...), and whenever the lowest bit of n is 1, multiply that power into the result; then square x and shift n right. Trace x = 2, n = 13 (binary 1101): bit 1, result = 2, x = 4; bit 0, x = 16; bit 1, result = 2 * 16 = 32, x = 256; bit 1, result = 32 * 256 = 8192, which is 2^13. Four rounds instead of thirteen, and about 31 rounds for any 32-bit n. For a negative n, I replace x by 1 / x and n by -n first. In Java and C++ I do the negation on a 64-bit copy, because -(-2^31) does not fit in an int; in JavaScript I halve with Math.floor(n / 2) because the shift operators work on 32 bits. Edge cases: n = 0 returns 1 (even for x = 0 under the usual convention), x = 1 or -1 with huge n, and x = 0 with a positive n. Time O(log n), space O(1).`,
      43: `Restating: multiply two non-negative integers given as digit strings, up to about 200 digits each, and return the product as a string, with no big-number library and no converting the whole string to an integer. Brute force: add num1 to itself num2 times, which is astronomically slow. The usable idea is the school multiplication method. When I multiply digit i of num1 by digit j of num2, the result belongs to place value 10^((len1-1-i) + (len2-1-j)). In an answer array of length len1 + len2, indexed from the left, that product lands at positions i + j (the carry) and i + j + 1 (the units digit). So I keep an integer array res of that length and, for each pair from the right, compute total = d1 * d2 + res[i + j + 1], store total % 10 at i + j + 1 and add total // 10 into i + j. Everything stays small, so there is no overflow. Trace "12" times "13" with res of length 4: digit 2 times 3 puts 6 at position 3; digit 2 times 1 puts 2 at position 2; digit 1 times 3 adds 3 to position 2, making 5; digit 1 times 1 puts 1 at position 1. So res = [0, 1, 5, 6]; skip the leading zero and the answer is "156". Edge cases: if either input is "0" return "0" immediately (otherwise the answer array is all zeros and the leading-zero skipper would run off the end); strip leading zeros otherwise. Time O(len1 * len2), space O(len1 + len2).`,
      204: `Restating: count the primes strictly below n, where n can reach five million. Brute force: test each number below n with trial division up to its square root, about n * sqrt(n) steps, around 10^10 for five million. The waste is that the same small divisors reject number after number. So flip the question: instead of asking what divides this number, let each prime knock out its own multiples. That is the Sieve of Eratosthenes. I mark everything prime except 0 and 1. For each p from 2 while p * p < n, if p is still marked, I cross out p*p, p*p + p, p*p + 2p and so on. Why start at p*p: a smaller multiple k * p with k < p has a smaller prime factor and was crossed by that smaller prime already. Why stop at p*p >= n: any composite below n has a factor below sqrt(n), so it was crossed by then. Trace n = 10: p = 2 crosses 4, 6, 8; p = 3 crosses 9; p = 4 is 16 >= 10, stop. Survivors 2, 3, 5, 7: four. Edge cases: n = 0, 1, 2 return 0 (2 itself is not below 2), so I return early for n < 3. In Java and C++ I use a long for p so that p * p cannot overflow. Time O(n log log n), almost linear; space O(n) booleans.`,
      172: `Restating: count the trailing zeros of n factorial, where n is up to about 10^4 here but could be larger. Brute force: compute n! and count zeros at the end. The number is gigantic (n! for n = 10000 has over 35,000 digits) and not representable in a normal integer in most languages, so that is out. A trailing zero is a factor of 10 = 2 * 5. So I need to count how many pairs of 2 and 5 are in n!. Among the numbers 1..n there are always more factors of 2 than of 5, so the number of 5s is the limit. Counting factors of 5: every multiple of 5 gives at least one, every multiple of 25 gives a second one, every multiple of 125 a third, and so on. So the total is n/5 + n/25 + n/125 + ..., each term integer division. The loop does that neatly: repeatedly divide n by 5 and add the quotient to a counter. Trace n = 100: 100/5 = 20, then 20/5 = 4 (these are the multiples of 25), then 4/5 = 0, total 24. Edge cases: n < 5 gives 0, n = 0 gives 0, and 25 gives 6, not 5, because 25 contributes two fives. Time O(log n), space O(1), and no big numbers anywhere.`,
      9: `Restating: decide whether an integer reads the same forwards and backwards. The obvious solution converts to a string and compares with its reverse; that is fine, but the follow-up asks to do it without strings. Reversing the whole number is risky because the reverse of a 32-bit integer can overflow. The better observation: I only need to reverse half of the digits. Peel digits off the right end of x (x % 10, x // 10) and push them onto rev, stopping as soon as rev >= x, which means I have processed half. Then an even-length palindrome has x == rev, and an odd-length one has x == rev // 10 (the middle digit sits at the end of rev and does not matter). Trace 1221: rev = 1, x = 122; rev = 12, x = 12; now rev >= x, and x == rev, true. Trace 12321: rev = 1, x = 1232; rev = 12, x = 123; rev = 123, x = 12; stop, x == rev // 10 = 12, true. Edge cases I handle first: negatives are never palindromes because of the minus sign; a positive number ending in 0 cannot be one (it would have to start with 0), except 0 itself. Because only half the digits are reversed, rev can never overflow. Time O(log x), space O(1).`,
      2013: `Restating: build a structure with add(point) (duplicates allowed and counted separately) and count(point), which returns how many ways to pick three stored points that, together with the query point, form an axis-aligned square with positive area. Brute force: for each count call, try every triple of stored points, O(n^3). The observation that kills this: in an axis-aligned square, once I know the query corner and the diagonally opposite corner, the other two corners are forced. If the query is (qx, qy) and the diagonal corner is (x, y), the other two are (x, qy) and (qx, y). A diagonal needs |x - qx| == |y - qy| and the distance must be non-zero. So I store a hash map from (x, y) to how many times it was added. For count, I loop over the distinct stored points; for each one that sits on a valid diagonal of the query, I add cnt[(x, y)] * cnt[(x, qy)] * cnt[(qx, y)], using multiplication because duplicate points give separate squares. Trace: add (3,10), (11,2), (3,2), then count (11,10): diagonal point (3,2) has distance 8 on both axes, the other corners are (3,10) and (11,2), both stored once, product 1. Edge cases: a point with the same x as the query is not a diagonal (zero area); the query point itself need not be stored. add is O(1); count is O(distinct points); space is O(distinct points).`
    }
  };
})();
