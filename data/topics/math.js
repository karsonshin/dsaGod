/* Offer Ready: Math and number theory. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it is written in.
   The template holds gcd (Euclid) and countPrimes (the sieve); the template test calls countPrimes, and the
   gcd/lcm code is tested on its own in the first variation. */
(function () {
  var OR = (window.OR = window.OR || {});

  (OR.topics = OR.topics || []).push({
    id: 'math',

    hook: 'Math questions are the ones people dread, and they are also the most **learnable**: the same six or seven tricks cover almost everything an interviewer will ask. Greatest common divisor, “is it prime”, counting primes, raising to a power fast, doing arithmetic **modulo** a big number, counting arrangements, and adding or multiplying numbers too big for any integer type. They show up as quick warm-ups (plus one, happy number), as the engine inside harder problems (a modular inverse inside a counting problem), and every online assessment has at least one. The reward for knowing them is large: each is a handful of lines, and each one replaces a loop that would take years with one that takes a blink.',

    cues: [
      'The statement says **“return the answer modulo 10⁹ + 7”**, or the count is clearly too big for a normal integer.',
      'You are asked about **divisors, multiples, common factors, “every k-th”, or whether two numbers share a factor**: think gcd and lcm.',
      'You must **count or list primes** up to some limit, or test whether a single number is prime.',
      'An exponent is huge (`x^n` with n in the billions, or `a^b mod m`): **square instead of multiplying n times**.',
      'The numbers are **given as strings**, or are too long for 64 bits: do the arithmetic digit by digit with a carry.',
      'You process a number **one digit at a time** (`% 10` and `/ 10`), or a number’s next value is computed from its digits, and you worry it may never stop: a **cycle** hides there.',
      'You need “**how many ways to choose**” or arrange things and the answer is huge: factorials, an inverse, and a modulus.',
      'The trap: if the question is about **bits** (a power of two, counting set bits, XOR tricks), the tool is bit manipulation, not these. These are about **divisibility, remainders and digits** in base 10.'
    ],

    intuition: [
      'Start with **gcd**. Two ropes, 252 and 105 metres long: what is the longest ruler that measures both exactly? Lay the short rope along the long one as many times as it fits: 105 fits twice (210), with 42 left over. Now whatever measures both ropes also measures that 42-metre scrap, so the question shrinks to “252 and 105” becoming “105 and 42”, then “42 and 21”, then “21 and 0”. When the leftover is zero, the last non-zero length (21) is the answer. That is **Euclid’s algorithm**: `gcd(a, b) = gcd(b, a % b)`. It is fast because the leftover is always less than half of the bigger number after two steps.',
      'The **sieve** answers “which numbers below n are prime?” the way you would with a pencil. Write 2 to n-1. Circle 2 and cross out every multiple of 2. The next number still standing, 3, must be prime (nothing smaller divides it), so circle it and cross out its multiples. Repeat. The saving trick: when you handle a prime `p`, start crossing at **p × p**, because the smaller multiples (2p, 3p, …) have a smaller prime factor and are already gone. And you can stop once `p × p` is no longer below n: a number that is not prime has a factor no bigger than its square root, so all composites are crossed by then.',
      'Testing **one** number needs no sieve. A composite number n has a divisor between 2 and √n, so try every candidate up to √n: about a thousand tries for a number near a million, not a million.',
      'The third idea is **the clock**. Arithmetic modulo m is arithmetic on a clock with m hours: you may reduce after every addition and multiplication and still land on the right hour, so numbers never grow beyond m. That is why a problem can ask for “the answer mod 10⁹ + 7” and be solved with plain 64-bit numbers: reduce as you go. Two warnings come with it. **Division** is not allowed on the clock directly; you multiply by an **inverse** instead, and when m is prime, Fermat’s little theorem gives it as `a^(m-2) mod m`. And in most languages the `%` of a **negative** number is negative, so a subtraction needs `+ m` before the final `%`.',
      '**Fast exponentiation** is the same idea as halving. `x^10` is `(x^5)^2`, `x^5` is `x · (x^2)^2`. Looking at the exponent in binary, you square the base each round and multiply it into the answer whenever the current bit is 1. 30 rounds instead of a billion multiplications.',
      'Finally, **digits and cycles**. Peeling a number with `n % 10` (last digit) and `n // 10` (the rest) is the only tool you need for digit sums, reversing and palindromes. When the next value is built from the current one (add the squares of the digits, then do it again), the sequence either reaches 1 or enters a loop. Detecting the loop without extra memory is **Floyd’s tortoise and hare**: one pointer moves one step, the other two, and if there is a cycle they meet. A set of seen values also works, and is the first thing to say out loud.'
    ].join('\n\n'),

    viz: 'sieve',

    template: {
      title: 'Euclid’s gcd, and the sieve that counts primes below n',
      note: 'Two short functions, the backbone of this topic. **gcd** loops while `b` is not zero, replacing `(a, b)` with `(b, a % b)`; when `b` hits zero, `a` holds the answer. **countPrimes** marks every number below `n` as prime, then for each `p` while `p * p < n` that is still marked, crosses out its multiples **starting at `p * p`**, and finally counts what is left. The bound `p * p < n` is the square-root stop; the Java and C++ versions use a wider integer for `p` so that `p * p` cannot overflow. `n` is exclusive, so `countPrimes(10)` counts 2, 3, 5, 7.',
      code: {
        py: `class Solution:
    def gcd(self, a, b):
        while b != 0:                                       #@gloop > Euclid: stop when the remainder is zero
            a, b = b, a % b                                 #@gstep > gcd(a, b) = gcd(b, a mod b)
        return a                                            #@gdone > The last non-zero value is the gcd

    def countPrimes(self, n):
        if n < 3:
            return 0
        is_prime = [True] * n                               #@init > 1. Assume every number is prime
        is_prime[0] = is_prime[1] = False                   #@init > ...except 0 and 1
        p = 2
        while p * p < n:                                    #@bound > 2. Only p up to the square root can cross anything out
            if is_prime[p]:                                 #@prime > 3. Still standing means prime
                for m in range(p * p, n, p):                #@cross > 4. Cross out its multiples, starting at p * p
                    is_prime[m] = False                     #@cross > The smaller multiples were crossed by smaller primes
            p += 1
        return sum(is_prime)                                #@count > 5. Whatever is still standing is prime`,
        js: `function gcd(a, b) {
  while (b !== 0) {                                         //@gloop > Euclid: stop when the remainder is zero
    [a, b] = [b, a % b];                                    //@gstep > gcd(a, b) = gcd(b, a mod b)
  }
  return a;                                                 //@gdone > The last non-zero value is the gcd
}

function countPrimes(n) {
  if (n < 3) return 0;
  const isPrime = new Array(n).fill(true);                  //@init > 1. Assume every number is prime
  isPrime[0] = isPrime[1] = false;                          //@init > ...except 0 and 1
  for (let p = 2; p * p < n; p++) {                         //@bound > 2. Only p up to the square root can cross anything out
    if (isPrime[p]) {                                       //@prime > 3. Still standing means prime
      for (let m = p * p; m < n; m += p) {                  //@cross > 4. Cross out its multiples, starting at p * p
        isPrime[m] = false;                                 //@cross > The smaller multiples were crossed by smaller primes
      }
    }
  }
  return isPrime.filter(Boolean).length;                    //@count > 5. Whatever is still standing is prime
}`,
        java: `class Solution {
    public int gcd(int a, int b) {
        while (b != 0) {                                    //@gloop > Euclid: stop when the remainder is zero
            int t = a % b;                                  //@gstep > gcd(a, b) = gcd(b, a mod b)
            a = b;
            b = t;
        }
        return a;                                           //@gdone > The last non-zero value is the gcd
    }

    public int countPrimes(int n) {
        if (n < 3) return 0;
        boolean[] isPrime = new boolean[n];
        Arrays.fill(isPrime, true);                         //@init > 1. Assume every number is prime
        isPrime[0] = isPrime[1] = false;                    //@init > ...except 0 and 1
        for (long p = 2; p * p < n; p++) {                  //@bound > 2. Only p up to the square root (long: p * p cannot overflow)
            if (isPrime[(int) p]) {                         //@prime > 3. Still standing means prime
                for (long m = p * p; m < n; m += p) {       //@cross > 4. Cross out its multiples, starting at p * p
                    isPrime[(int) m] = false;               //@cross > The smaller multiples were crossed by smaller primes
                }
            }
        }
        int count = 0;
        for (boolean b : isPrime) if (b) count++;           //@count > 5. Whatever is still standing is prime
        return count;
    }
}`,
        cpp: `class Solution {
public:
    int gcd(int a, int b) {
        while (b != 0) {                                    //@gloop > Euclid: stop when the remainder is zero
            int t = a % b;                                  //@gstep > gcd(a, b) = gcd(b, a mod b)
            a = b;
            b = t;
        }
        return a;                                           //@gdone > The last non-zero value is the gcd
    }

    int countPrimes(int n) {
        if (n < 3) return 0;
        vector<bool> isPrime(n, true);                      //@init > 1. Assume every number is prime
        isPrime[0] = isPrime[1] = false;                    //@init > ...except 0 and 1
        for (long long p = 2; p * p < n; p++) {             //@bound > 2. Only p up to the square root (long long: p * p cannot overflow)
            if (isPrime[p]) {                               //@prime > 3. Still standing means prime
                for (long long m = p * p; m < n; m += p) {  //@cross > 4. Cross out its multiples, starting at p * p
                    isPrime[m] = false;                     //@cross > The smaller multiples were crossed by smaller primes
                }
            }
        }
        int count = 0;
        for (int i = 0; i < n; i++) if (isPrime[i]) count++;   //@count > 5. Whatever is still standing is prime
        return count;
    }
};`
      },
      tests: { fn: 'countPrimes', sig: { args: ['int'] }, cases: [
        { args: [10], out: 4 }, { args: [0], out: 0 }, { args: [2], out: 0 }, { args: [3], out: 1 }, { args: [30], out: 10 },
        { args: [100], out: 25 }, { args: [50], out: 15 }, { args: [1000], out: 168 }, { args: [49], out: 15 }, { args: [121], out: 30 }] }
    },

    complexity: {
      time: 'gcd O(log min(a, b)); trial division O(√n); sieve O(n log log n); fast power O(log exponent)',
      space: 'O(1) for gcd, trial division and fast power; O(n) for the sieve',
      why: 'Euclid’s remainder at least halves every two steps, so the number of steps is logarithmic (the worst case is two neighbouring Fibonacci numbers, which the visualizer’s “slowest” preset shows). Trial division tries at most √n candidates. The sieve crosses each composite once per distinct prime factor, and the total work, the sum of n/p over primes p, is about n log log n, which is almost linear. Fast exponentiation halves the exponent each round. Digit loops cost one step per digit, so O(log₁₀ n).',
      trap: 'Say **“sieve is O(n log log n), not O(n²)”** and name the two savings: start at `p * p`, stop at `√n`. For modular work, mention that **the multiplication is where the overflow is**: two numbers below 10⁹ + 7 multiply to about 10¹⁸, which fits in a signed 64-bit integer but not in a 32-bit `int`, and not in a JavaScript number (use BigInt there).'
    },

    variations: [
      {
        name: 'gcd and lcm',
        body: 'The least common multiple follows from the gcd: `lcm(a, b) = a / gcd(a, b) * b`. **Divide first, then multiply**, so the intermediate value never exceeds the answer (`a * b` can overflow when the lcm itself fits). The gcd of a whole list is a fold: `g = gcd(g, x)` for each element, starting from 0 (since `gcd(0, x) = x`). Two numbers are **coprime** when their gcd is 1. Python has `math.gcd` and C++17 has `std::gcd`; in an interview, write the loop, it is four lines.',
        code: {
          py: `class Solution:
    def lcm(self, a, b):
        x, y = a, b
        while y:
            x, y = y, x % y            # x is now gcd(a, b)
        return a // x * b              # divide first, then multiply`,
          js: `function lcm(a, b) {
  let x = a, y = b;
  while (y !== 0) [x, y] = [y, x % y];   // x is now gcd(a, b)
  return a / x * b;                      // divide first, then multiply
}`,
          java: `class Solution {
    public long lcm(long a, long b) {
        long x = a, y = b;
        while (y != 0) { long t = x % y; x = y; y = t; }   // x is now gcd(a, b)
        return a / x * b;                                  // divide first, then multiply
    }
}`,
          cpp: `class Solution {
public:
    long long lcm(long long a, long long b) {
        long long x = a, y = b;
        while (y != 0) { long long t = x % y; x = y; y = t; }   // x is now gcd(a, b)
        return a / x * b;                                       // divide first, then multiply
    }
};`
        },
        tests: { fn: 'lcm', sig: { args: ['long', 'long'] }, cases: [
          { args: [4, 6], out: 12 }, { args: [21, 6], out: 42 }, { args: [7, 13], out: 91 }, { args: [12, 12], out: 12 },
          { args: [1, 99], out: 99 }, { args: [1000000007, 2], out: 2000000014 }] }
      },
      {
        name: 'Is it prime? Trial division up to the square root',
        body: 'For one number, no sieve: reject `n < 2`, then try every `d` from 2 while `d * d <= n`. If `d` divides `n`, it is composite. Checking only 2 and then odd numbers halves the work. Use a wide integer for the bound so `d * d` cannot overflow. Use the sieve when you need **many** answers below a limit; use trial division when you need **one** answer for a big number.',
        code: {
          py: `class Solution:
    def isPrime(self, n):
        if n < 2:
            return False
        d = 2
        while d * d <= n:              # a composite has a factor <= sqrt(n)
            if n % d == 0:
                return False
            d += 1
        return True`,
          js: `function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) {   // a composite has a factor <= sqrt(n)
    if (n % d === 0) return false;
  }
  return true;
}`,
          java: `class Solution {
    public boolean isPrime(int n) {
        if (n < 2) return false;
        for (long d = 2; d * d <= n; d++) {   // long: d * d cannot overflow
            if (n % d == 0) return false;
        }
        return true;
    }
}`,
          cpp: `class Solution {
public:
    bool isPrime(int n) {
        if (n < 2) return false;
        for (long long d = 2; d * d <= n; d++) {   // long long: d * d cannot overflow
            if (n % d == 0) return false;
        }
        return true;
    }
};`
        },
        tests: { fn: 'isPrime', sig: { args: ['int'] }, cases: [
          { args: [2], out: true }, { args: [1], out: false }, { args: [0], out: false }, { args: [9], out: false }, { args: [97], out: true },
          { args: [91], out: false }, { args: [1000003], out: true }, { args: [2147483647], out: true }, { args: [49], out: false }] }
      },
      {
        name: 'Modular arithmetic and the negative-remainder trap',
        body: 'You may reduce after every `+`, `-` and `*`: `(a + b) % m = ((a % m) + (b % m)) % m`, and likewise for the others. The trap is subtraction. In **Java, C++ and JavaScript** the sign of `a % m` follows `a`, so `(-3) % 5 = -3`, not 2; in **Python** it is always 0 to m-1. Write a subtraction as `((a - b) % m + m) % m` and it is right in every language. Also reduce **before** you multiply when the inputs are not already below m, and multiply in a type wide enough for `m * m` (64-bit for m near 10⁹).',
        code: {
          py: `class Solution:
    def subMod(self, a, b, m):
        return ((a - b) % m + m) % m   # the + m is for Java, C++ and JS; harmless here`,
          js: `function subMod(a, b, m) {
  return (((a - b) % m) + m) % m;     // (-3) % 5 is -3 in JS, so add m before the last %
}`,
          java: `class Solution {
    public long subMod(long a, long b, long m) {
        return ((a - b) % m + m) % m;   // (-3) % 5 is -3 in Java, so add m before the last %
    }
}`,
          cpp: `class Solution {
public:
    long long subMod(long long a, long long b, long long m) {
        return ((a - b) % m + m) % m;   // (-3) % 5 is -3 in C++, so add m before the last %
    }
};`
        },
        tests: { fn: 'subMod', sig: { args: ['long', 'long', 'long'] }, cases: [
          { args: [3, 5, 7], out: 5 }, { args: [10, 3, 7], out: 0 }, { args: [0, 1, 1000000007], out: 1000000006 }, { args: [5, 5, 3], out: 0 },
          { args: [-8, 2, 5], out: 0 }, { args: [2, 1000000006, 1000000007], out: 3 }] }
      },
      {
        name: 'Fast exponentiation: repeated squaring',
        body: 'To compute `base^exp mod m`, walk the bits of `exp` from the lowest: if the bit is 1, multiply the answer by the current `base`; then square `base` and shift `exp` right. `O(log exp)` multiplications. The same loop without the `% m` computes plain `x^n` (for a negative exponent, invert the base and negate the exponent). **JavaScript note:** a product of two numbers near 10⁹ exceeds 2⁵³ and silently loses digits, so this version uses **BigInt**. Java and C++ use a 64-bit `long`.',
        code: {
          py: `class Solution:
    def powMod(self, base, exp, mod):
        result = 1
        base %= mod
        while exp > 0:
            if exp & 1:                    # this bit of the exponent is set
                result = result * base % mod
            base = base * base % mod       # square for the next bit
            exp >>= 1
        return result`,
          js: `function powMod(base, exp, mod) {
  let b = BigInt(base) % BigInt(mod), e = BigInt(exp), m = BigInt(mod), result = 1n;
  while (e > 0n) {
    if (e & 1n) result = result * b % m;   // this bit of the exponent is set
    b = b * b % m;                          // square for the next bit
    e >>= 1n;
  }
  return Number(result);
}`,
          java: `class Solution {
    public long powMod(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;   // this bit of the exponent is set
            base = base * base % mod;                           // square for the next bit
            exp >>= 1;
        }
        return result;
    }
}`,
          cpp: `class Solution {
public:
    long long powMod(long long base, long long exp, long long mod) {
        long long result = 1;
        base %= mod;
        while (exp > 0) {
            if (exp & 1) result = result * base % mod;   // this bit of the exponent is set
            base = base * base % mod;                    // square for the next bit
            exp >>= 1;
        }
        return result;
    }
};`
        },
        tests: { fn: 'powMod', sig: { args: ['long', 'long', 'long'] }, cases: [
          { args: [2, 10, 1000000007], out: 1024 }, { args: [3, 200, 1000000007], out: 136318165 }, { args: [2, 0, 1000000007], out: 1 },
          { args: [7, 1000000000, 1000000007], out: 312556845 }, { args: [10, 18, 1000000007], out: 49 }, { args: [5, 3, 13], out: 8 }] }
      },
      {
        name: 'Modular inverse (Fermat) and “division” mod a prime',
        body: 'There is no `a / b` on the clock; you multiply by the **inverse** `b⁻¹`, the number with `b · b⁻¹ ≡ 1 (mod m)`. When `m` is **prime** and `a` is not a multiple of it, Fermat’s little theorem says `a^(m-1) ≡ 1`, so `a⁻¹ ≡ a^(m-2)`: one fast power. (For a non-prime modulus use the extended Euclidean algorithm; the inverse exists only when `gcd(a, m) = 1`.) The standard modulus 10⁹ + 7 is prime, which is exactly why it is chosen.',
        code: {
          py: `class Solution:
    def inverse(self, a, p):
        result, base, exp = 1, a % p, p - 2
        while exp > 0:                    # fast power: a^(p-2) mod p
            if exp & 1:
                result = result * base % p
            base = base * base % p
            exp >>= 1
        return result`,
          js: `function inverse(a, p) {
  let result = 1n, base = BigInt(a) % BigInt(p), exp = BigInt(p) - 2n;
  const m = BigInt(p);
  while (exp > 0n) {                      // fast power: a^(p-2) mod p
    if (exp & 1n) result = result * base % m;
    base = base * base % m;
    exp >>= 1n;
  }
  return Number(result);
}`,
          java: `class Solution {
    public long inverse(long a, long p) {
        long result = 1, base = a % p, exp = p - 2;
        while (exp > 0) {                 // fast power: a^(p-2) mod p
            if ((exp & 1) == 1) result = result * base % p;
            base = base * base % p;
            exp >>= 1;
        }
        return result;
    }
}`,
          cpp: `class Solution {
public:
    long long inverse(long long a, long long p) {
        long long result = 1, base = a % p, exp = p - 2;
        while (exp > 0) {                 // fast power: a^(p-2) mod p
            if (exp & 1) result = result * base % p;
            base = base * base % p;
            exp >>= 1;
        }
        return result;
    }
};`
        },
        tests: { fn: 'inverse', sig: { args: ['long', 'long'] }, cases: [
          { args: [2, 1000000007], out: 500000004 }, { args: [3, 1000000007], out: 333333336 }, { args: [10, 1000000007], out: 700000005 },
          { args: [123456, 1000000007], out: 78351802 }, { args: [3, 7], out: 5 }, { args: [1, 13], out: 1 }] }
      },
      {
        name: 'Counting with nCr mod p',
        body: '`C(n, r) = n! / (r! · (n-r)!)`. The factorials are far too big, so keep them mod p, and **replace the division with the inverse** of `r! · (n-r)!`. Precompute `fact` once in O(n) and each query costs one fast power (or precompute inverse factorials and make queries O(1)). Pascal’s triangle (`C(n, r) = C(n-1, r-1) + C(n-1, r)`) needs no inverse but costs O(n²) time and memory: use it for small n.',
        code: {
          py: `class Solution:
    def nCr(self, n, r):
        p = 1000000007
        if r < 0 or r > n:
            return 0
        fact = [1] * (n + 1)
        for i in range(1, n + 1):
            fact[i] = fact[i - 1] * i % p      # n! mod p, built up
        denom = fact[r] * fact[n - r] % p
        return fact[n] * pow(denom, p - 2, p) % p   # divide = multiply by the inverse`,
          js: `function nCr(n, r) {
  const p = 1000000007n;
  if (r < 0 || r > n) return 0;
  const fact = [1n];
  for (let i = 1; i <= n; i++) fact.push(fact[i - 1] * BigInt(i) % p);   // n! mod p, built up
  let denom = fact[r] * fact[n - r] % p, inv = 1n, e = p - 2n;
  while (e > 0n) {                       // inverse by fast power
    if (e & 1n) inv = inv * denom % p;
    denom = denom * denom % p;
    e >>= 1n;
  }
  return Number(fact[n] * inv % p);
}`,
          java: `class Solution {
    public int nCr(int n, int r) {
        long p = 1000000007L;
        if (r < 0 || r > n) return 0;
        long[] fact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % p;   // n! mod p, built up
        long denom = fact[r] * fact[n - r] % p, inv = 1, e = p - 2;
        while (e > 0) {                    // inverse by fast power
            if ((e & 1) == 1) inv = inv * denom % p;
            denom = denom * denom % p;
            e >>= 1;
        }
        return (int) (fact[n] * inv % p);
    }
}`,
          cpp: `class Solution {
public:
    int nCr(int n, int r) {
        long long p = 1000000007LL;
        if (r < 0 || r > n) return 0;
        vector<long long> fact(n + 1, 1);
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % p;   // n! mod p, built up
        long long denom = fact[r] * fact[n - r] % p, inv = 1, e = p - 2;
        while (e > 0) {                    // inverse by fast power
            if (e & 1) inv = inv * denom % p;
            denom = denom * denom % p;
            e >>= 1;
        }
        return (int)(fact[n] * inv % p);
    }
};`
        },
        tests: { fn: 'nCr', sig: { args: ['int', 'int'] }, cases: [
          { args: [5, 2], out: 10 }, { args: [10, 3], out: 120 }, { args: [0, 0], out: 1 }, { args: [1000, 500], out: 159835829 },
          { args: [50, 25], out: 605552882 }, { args: [7, 7], out: 1 }, { args: [4, 6], out: 0 }] }
      },
      {
        name: 'Digit tricks: peel with % 10 and / 10',
        body: '`n % 10` is the last digit and `n / 10` (integer division) is everything else. A loop on those two builds digit sums, reversals and palindrome checks without converting to a string. Careful with **negatives** (the sign of `%` differs by language: handle the sign first) and with **overflow when you rebuild** a reversed number: for a 32-bit input the reverse can exceed the 32-bit range, so check before multiplying by 10 or use a wider type. Strings are simpler when speed does not matter, and necessary when the number does not fit any type.',
        code: {
          py: `class Solution:
    def digitSum(self, n):
        total = 0
        while n > 0:
            total += n % 10            # the last digit
            n //= 10                   # drop it
        return total`,
          js: `function digitSum(n) {
  let total = 0;
  while (n > 0) {
    total += n % 10;                   // the last digit
    n = Math.floor(n / 10);            // drop it
  }
  return total;
}`,
          java: `class Solution {
    public int digitSum(int n) {
        int total = 0;
        while (n > 0) {
            total += n % 10;           // the last digit
            n /= 10;                   // drop it
        }
        return total;
    }
}`,
          cpp: `class Solution {
public:
    int digitSum(int n) {
        int total = 0;
        while (n > 0) {
            total += n % 10;           // the last digit
            n /= 10;                   // drop it
        }
        return total;
    }
};`
        },
        tests: { fn: 'digitSum', sig: { args: ['int'] }, cases: [
          { args: [0], out: 0 }, { args: [9], out: 9 }, { args: [1234], out: 10 }, { args: [999999], out: 54 }, { args: [1000000], out: 1 }] }
      },
      {
        name: 'Numbers too big for any integer: add as strings',
        body: 'When the input arrives as a string of digits, work from the **right end**, keep a `carry`, and append each result digit; reverse at the end. Add the digits of both strings (treating a missing digit as 0), `digit = total % 10`, `carry = total / 10`, and keep going while either string has digits **or a carry remains** (the final carry is the classic miss: `999 + 1`). The same carry loop is “plus one” on a digit array, and the same place-value thinking is multiplication of strings (see the worked problem).',
        code: {
          py: `class Solution:
    def addStrings(self, a, b):
        i, j, carry = len(a) - 1, len(b) - 1, 0
        out = []
        while i >= 0 or j >= 0 or carry:
            total = carry
            if i >= 0:
                total += ord(a[i]) - 48
                i -= 1
            if j >= 0:
                total += ord(b[j]) - 48
                j -= 1
            out.append(str(total % 10))    # this digit
            carry = total // 10            # carry into the next place
        return ''.join(reversed(out))`,
          js: `function addStrings(a, b) {
  let i = a.length - 1, j = b.length - 1, carry = 0;
  const out = [];
  while (i >= 0 || j >= 0 || carry) {
    let total = carry;
    if (i >= 0) total += a.charCodeAt(i--) - 48;
    if (j >= 0) total += b.charCodeAt(j--) - 48;
    out.push(total % 10);                  // this digit
    carry = Math.floor(total / 10);        // carry into the next place
  }
  return out.reverse().join('');
}`,
          java: `class Solution {
    public String addStrings(String a, String b) {
        int i = a.length() - 1, j = b.length() - 1, carry = 0;
        StringBuilder out = new StringBuilder();
        while (i >= 0 || j >= 0 || carry > 0) {
            int total = carry;
            if (i >= 0) total += a.charAt(i--) - '0';
            if (j >= 0) total += b.charAt(j--) - '0';
            out.append(total % 10);        // this digit
            carry = total / 10;            // carry into the next place
        }
        return out.reverse().toString();
    }
}`,
          cpp: `class Solution {
public:
    string addStrings(string a, string b) {
        int i = (int)a.size() - 1, j = (int)b.size() - 1, carry = 0;
        string out;
        while (i >= 0 || j >= 0 || carry > 0) {
            int total = carry;
            if (i >= 0) total += a[i--] - '0';
            if (j >= 0) total += b[j--] - '0';
            out += char('0' + total % 10);     // this digit
            carry = total / 10;                // carry into the next place
        }
        reverse(out.begin(), out.end());
        return out;
    }
};`
        },
        tests: { fn: 'addStrings', sig: { args: ['str', 'str'] }, cases: [
          { args: ['11', '123'], out: '134' }, { args: ['456', '77'], out: '533' }, { args: ['0', '0'], out: '0' }, { args: ['999', '1'], out: '1000' },
          { args: ['987654321987654321', '123456789123456789'], out: '1111111111111111110' }] }
      },
      {
        name: 'Overflow: what each language does with big numbers',
        body: 'The same arithmetic behaves differently depending on the language, and interviewers like to ask.\n\n- **Python**: integers grow without limit. No overflow, so the work is only to keep numbers small for speed (reduce mod m as you go).\n- **JavaScript**: every number is a 64-bit float. Integers are exact only up to **2⁵³ − 1** (`Number.MAX_SAFE_INTEGER`, about 9 × 10¹⁵). Beyond that, digits are silently lost; use **BigInt** (`123n`, no mixing with Number). Bit operators (`&`, `>>`) truncate to 32 bits for plain numbers.\n- **Java**: `int` is 32-bit (±2.1 × 10⁹) and **wraps silently** (`Integer.MAX_VALUE + 1` is negative). `long` is 64-bit (±9.2 × 10¹⁸). Cast **before** multiplying: `(long) a * b`, not `(long) (a * b)`. `Math.abs(Integer.MIN_VALUE)` is still negative.\n- **C++**: `int` is usually 32-bit, and signed overflow is **undefined behaviour**, not just a wrong answer. Use `long long` for products. Unsigned arithmetic wraps by definition.\n\nA product of two values below 10⁹ + 7 is about 10¹⁸: fine in a 64-bit signed type, too big for 32-bit and for a JavaScript number. If you must multiply two 64-bit values mod a 64-bit modulus, reach for 128-bit (`__int128`) or Python or BigInt.'
      },
      {
        name: 'Floyd’s cycle idea on a number sequence',
        body: 'Whenever the next value is a function of the current one (`x → f(x)`) and the values stay in a finite range, the sequence must eventually repeat. Run a **slow** pointer one step and a **fast** pointer two steps per round: if there is a cycle they meet inside it. To get the **cycle length**, freeze the meeting point and walk once around. It needs O(1) memory where a set of seen values needs O(number of values). This variation uses `f(x) = (x * x + 1) mod m`; the worked problem on happy numbers uses `f` = sum of the squares of the digits.',
        code: {
          py: `class Solution:
    def cycleLen(self, x0, m):
        f = lambda x: (x * x + 1) % m
        slow, fast = f(x0), f(f(x0))
        while slow != fast:            # slow moves 1, fast moves 2
            slow = f(slow)
            fast = f(f(fast))
        length, fast = 1, f(slow)      # they met inside the cycle: walk once around
        while fast != slow:
            fast = f(fast)
            length += 1
        return length`,
          js: `function cycleLen(x0, m) {
  const f = x => (x * x + 1) % m;
  let slow = f(x0), fast = f(f(x0));
  while (slow !== fast) {              // slow moves 1, fast moves 2
    slow = f(slow);
    fast = f(f(fast));
  }
  let length = 1;
  fast = f(slow);                      // they met inside the cycle: walk once around
  while (fast !== slow) { fast = f(fast); length++; }
  return length;
}`,
          java: `class Solution {
    private long m;
    private long f(long x) { return (x * x + 1) % m; }

    public int cycleLen(int x0, int mod) {
        m = mod;
        long slow = f(x0), fast = f(f(x0));
        while (slow != fast) {         // slow moves 1, fast moves 2
            slow = f(slow);
            fast = f(f(fast));
        }
        int length = 1;
        fast = f(slow);                // they met inside the cycle: walk once around
        while (fast != slow) { fast = f(fast); length++; }
        return length;
    }
}`,
          cpp: `class Solution {
    long long m;
    long long f(long long x) { return (x * x + 1) % m; }
public:
    int cycleLen(int x0, int mod) {
        m = mod;
        long long slow = f(x0), fast = f(f(x0));
        while (slow != fast) {         // slow moves 1, fast moves 2
            slow = f(slow);
            fast = f(f(fast));
        }
        int length = 1;
        fast = f(slow);                // they met inside the cycle: walk once around
        while (fast != slow) { fast = f(fast); length++; }
        return length;
    }
};`
        },
        tests: { fn: 'cycleLen', sig: { args: ['int', 'int'] }, cases: [
          { args: [2, 15], out: 3 }, { args: [0, 7], out: 1 }, { args: [3, 101], out: 9 }, { args: [1, 1000003], out: 116 }, { args: [5, 2], out: 2 }] }
      }
    ],

    worked: [
      {
        lc: 50,
        restate: 'Write a function that raises a real number `x` to an integer power `n`. The exponent can be negative, zero or as large as two billion in size, so multiplying `x` by itself `n` times is far too slow.',
        examples: '- `x = 2.0, n = 10` → `1024.0`\n- `x = 2.1, n = 3` → `9.261`\n- `x = 2.0, n = -2` → `0.25` (a negative power is one over the positive power)',
        brute: 'Multiply `x` into a running result `n` times: O(n). With n near 2 × 10⁹ that is seconds to minutes. A recursive version (compute `x^(n-1)` and multiply once more) is the same count, and also runs out of stack.',
        insight: '**Halve the exponent.** `x^10 = (x^5)^2`, and an odd exponent peels off one factor: `x^5 = x · (x^2)^2`. Iteratively: look at `n` in binary. Keep `x` as the current power-of-two power (`x`, `x²`, `x⁴`, …). Whenever the lowest bit of `n` is 1, multiply that into the result; then square `x` and drop the bit. About 31 rounds. For a negative `n`, replace `x` by `1/x` and `n` by `-n` first. In Java and C++ copy `n` into a **`long`** before negating, because `-(-2³¹)` does not fit in an `int`. In JavaScript do not use `>>` on a number as large as 2³¹; halve with `Math.floor(n / 2)`.',
        code: {
          py: `class Solution:
    def myPow(self, x: float, n: int) -> float:
        if n < 0:
            x, n = 1 / x, -n          # negative power: invert, then use the positive power
        result = 1.0
        while n:
            if n & 1:                 # this bit of n is set: multiply this power of x in
                result *= x
            x *= x                    # x, x^2, x^4, x^8, ...
            n >>= 1
        return result`,
          js: `function myPow(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }   // negative power: invert, then use the positive power
  let result = 1;
  while (n > 0) {
    if (n % 2 === 1) result *= x;     // this bit of n is set: multiply this power of x in
    x *= x;                           // x, x^2, x^4, x^8, ...
    n = Math.floor(n / 2);            // (not >>: 2^31 does not fit in 32 bits)
  }
  return result;
}`,
          java: `class Solution {
    public double myPow(double x, int n) {
        long e = n;                       // long: -(-2^31) does not fit in an int
        if (e < 0) { x = 1 / x; e = -e; }
        double result = 1.0;
        while (e > 0) {
            if ((e & 1) == 1) result *= x;   // this bit of the exponent is set
            x *= x;                          // x, x^2, x^4, x^8, ...
            e >>= 1;
        }
        return result;
    }
}`,
          cpp: `class Solution {
public:
    double myPow(double x, int n) {
        long long e = n;                  // wide: -(-2^31) does not fit in an int
        if (e < 0) { x = 1 / x; e = -e; }
        double result = 1.0;
        while (e > 0) {
            if (e & 1) result *= x;       // this bit of the exponent is set
            x *= x;                       // x, x^2, x^4, x^8, ...
            e >>= 1;
        }
        return result;
    }
};`
        },
        complexity: 'O(log n) time, O(1) space (the iterative version; recursion would use O(log n) stack).',
        say: '“Multiplying n times is O(n), too slow for n around two billion. I use repeated squaring: write n in binary, keep x as x, x², x⁴ and so on, and multiply the current power into the result whenever the current bit is set. That is about 31 multiplications. For a negative exponent I invert x and negate n, using a 64-bit copy of n so that the most negative int does not overflow. Floating-point error stays small because there are only O(log n) multiplications.”',
        followups: [
          { q: 'How would you do the same modulo 10⁹ + 7?', a: 'Identical loop with integers: `result = result * base % mod` and `base = base * base % mod`. Use a 64-bit type (BigInt in JavaScript) so the product does not overflow.' },
          { q: 'Why is the order of multiplications by squares correct?', a: 'Because `n = sum of bits * 2^k`, so `x^n = product of x^(2^k)` for each set bit k. The loop builds `x^(2^k)` by squaring and picks the ones whose bit is set.' }
        ]
      },
      {
        lc: 204,
        restate: 'Given a non-negative integer `n`, return how many prime numbers are **strictly less than** `n`. `n` can be as large as five million.',
        examples: '- `n = 10` → `4` (the primes below 10 are 2, 3, 5, 7)\n- `n = 0` → `0` and `n = 1` → `0`\n- `n = 2` → `0` (2 itself is not below 2)',
        brute: 'Test each number below n with trial division up to its square root: about n · √n steps. For n = 5 million that is about 10¹⁰, too slow. Most of that work repeats: every even number is rejected again and again by the same small divisors.',
        insight: 'Turn the question around. Instead of asking “what divides this number”, ask “what does each prime knock out”. **Sieve of Eratosthenes**: mark all numbers as prime; for each `p` from 2 while `p * p < n`, if `p` is still marked, mark its multiples as composite **starting at `p * p`** (smaller multiples have a smaller factor and are already marked) in steps of `p`. Count the survivors. Total work is about `n log log n`. Skip the loop for composite `p`, because its multiples are multiples of its prime factors. Use a **wider integer for `p`** (or compare `p <= n / p`) in Java and C++ so `p * p` cannot overflow.',
        code: {
          py: `class Solution:
    def countPrimes(self, n: int) -> int:
        if n < 3:
            return 0
        is_prime = [True] * n
        is_prime[0] = is_prime[1] = False
        p = 2
        while p * p < n:                       # a composite below n has a factor < sqrt(n)
            if is_prime[p]:
                for m in range(p * p, n, p):   # smaller multiples were already crossed
                    is_prime[m] = False
            p += 1
        return sum(is_prime)`,
          js: `function countPrimes(n) {
  if (n < 3) return 0;
  const isPrime = new Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let p = 2; p * p < n; p++) {            // a composite below n has a factor < sqrt(n)
    if (isPrime[p]) {
      for (let m = p * p; m < n; m += p) isPrime[m] = false;   // smaller multiples were already crossed
    }
  }
  return isPrime.filter(Boolean).length;
}`,
          java: `class Solution {
    public int countPrimes(int n) {
        if (n < 3) return 0;
        boolean[] isPrime = new boolean[n];
        Arrays.fill(isPrime, true);
        isPrime[0] = isPrime[1] = false;
        for (long p = 2; p * p < n; p++) {            // long: p * p cannot overflow
            if (isPrime[(int) p]) {
                for (long m = p * p; m < n; m += p) isPrime[(int) m] = false;   // smaller multiples were already crossed
            }
        }
        int count = 0;
        for (boolean b : isPrime) if (b) count++;
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int countPrimes(int n) {
        if (n < 3) return 0;
        vector<bool> isPrime(n, true);
        isPrime[0] = isPrime[1] = false;
        for (long long p = 2; p * p < n; p++) {       // wide: p * p cannot overflow
            if (isPrime[p]) {
                for (long long m = p * p; m < n; m += p) isPrime[m] = false;   // smaller multiples were already crossed
            }
        }
        int count = 0;
        for (int i = 0; i < n; i++) if (isPrime[i]) count++;
        return count;
    }
};`
        },
        complexity: 'O(n log log n) time, O(n) space (a boolean per number).',
        say: '“Trial division per number is n times root n. The sieve flips it: for each prime p up to the square root of n, cross out its multiples starting at p squared, because smaller multiples were already crossed by smaller primes. The survivors are the primes. Each composite is crossed once per distinct prime factor, so the total is about n log log n, nearly linear, with an O(n) boolean array. I use a 64-bit loop variable so that p times p cannot overflow.”',
        followups: [
          { q: 'Can you use less memory?', a: 'Yes. Only store odd numbers (half the memory), or use a **segmented sieve**: sieve the primes up to √n, then process the range in blocks that fit in cache. A bitset also cuts the memory by 8.' },
          { q: 'What if you need the smallest prime factor of many numbers?', a: 'Make the sieve store the smallest prime factor instead of a boolean (`spf[m] = p` when first crossed), then factor any number by repeatedly dividing by `spf`. O(log x) per query.' }
        ]
      },
      {
        lc: 43,
        restate: 'You get two non-negative integers written as digit strings, which can each be 200 digits long. Return their product, also as a string. You may not convert the strings to integers or use a big-number library.',
        examples: '- `"2"`, `"3"` → `"6"`\n- `"123"`, `"456"` → `"56088"`\n- `"999"`, `"0"` → `"0"` (no leading zeros in the answer)',
        brute: 'Convert to integers and multiply: not allowed, and overflows anyway. Another route is adding `num1` to itself `num2` times, which is astronomically slow for a number with 200 digits.',
        insight: 'Do it the way you learned in school, but notice **where each digit product lands**. The digit at index `i` of one number times the digit at index `j` of the other contributes to positions `i + j` (the carry) and `i + j + 1` (the units digit) of the answer, which has at most `len1 + len2` digits. Keep an integer array `res` of that length. For each pair `(i, j)` from the right: `total = d1 * d2 + res[i + j + 1]`; `res[i + j + 1] = total % 10`; `res[i + j] += total / 10`. Everything stays small (at most 9 · 9 + a carry). Finally skip leading zeros. Handle a zero input first.',
        code: {
          py: `class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        if num1 == "0" or num2 == "0":
            return "0"
        res = [0] * (len(num1) + len(num2))
        for i in range(len(num1) - 1, -1, -1):
            for j in range(len(num2) - 1, -1, -1):
                total = (ord(num1[i]) - 48) * (ord(num2[j]) - 48) + res[i + j + 1]
                res[i + j + 1] = total % 10      # units digit lands at i + j + 1
                res[i + j] += total // 10        # carry lands at i + j
        k = 0
        while res[k] == 0:                       # skip leading zeros (the product is non-zero)
            k += 1
        return "".join(map(str, res[k:]))`,
          js: `function multiply(num1, num2) {
  if (num1 === "0" || num2 === "0") return "0";
  const res = new Array(num1.length + num2.length).fill(0);
  for (let i = num1.length - 1; i >= 0; i--) {
    for (let j = num2.length - 1; j >= 0; j--) {
      const total = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48) + res[i + j + 1];
      res[i + j + 1] = total % 10;               // units digit lands at i + j + 1
      res[i + j] += Math.floor(total / 10);      // carry lands at i + j
    }
  }
  let k = 0;
  while (res[k] === 0) k++;                      // skip leading zeros (the product is non-zero)
  return res.slice(k).join("");
}`,
          java: `class Solution {
    public String multiply(String num1, String num2) {
        if (num1.equals("0") || num2.equals("0")) return "0";
        int[] res = new int[num1.length() + num2.length()];
        for (int i = num1.length() - 1; i >= 0; i--) {
            for (int j = num2.length() - 1; j >= 0; j--) {
                int total = (num1.charAt(i) - '0') * (num2.charAt(j) - '0') + res[i + j + 1];
                res[i + j + 1] = total % 10;     // units digit lands at i + j + 1
                res[i + j] += total / 10;        // carry lands at i + j
            }
        }
        StringBuilder sb = new StringBuilder();
        int k = 0;
        while (res[k] == 0) k++;                 // skip leading zeros (the product is non-zero)
        for (; k < res.length; k++) sb.append(res[k]);
        return sb.toString();
    }
}`,
          cpp: `class Solution {
public:
    string multiply(string num1, string num2) {
        if (num1 == "0" || num2 == "0") return "0";
        vector<int> res(num1.size() + num2.size(), 0);
        for (int i = (int)num1.size() - 1; i >= 0; i--) {
            for (int j = (int)num2.size() - 1; j >= 0; j--) {
                int total = (num1[i] - '0') * (num2[j] - '0') + res[i + j + 1];
                res[i + j + 1] = total % 10;     // units digit lands at i + j + 1
                res[i + j] += total / 10;        // carry lands at i + j
            }
        }
        string out;
        size_t k = 0;
        while (res[k] == 0) k++;                 // skip leading zeros (the product is non-zero)
        for (; k < res.size(); k++) out += char('0' + res[k]);
        return out;
    }
};`
        },
        complexity: 'O(m · n) time for lengths m and n, O(m + n) space.',
        say: '“I can’t convert to integers, so I do grade-school multiplication. The digit product of positions i and j lands at i + j + 1, with its carry going to i + j, so I keep an array of m + n digits and accumulate into it, carrying as I go. At the end I skip leading zeros, and I special-case a zero input. It is O(m times n) time and O(m plus n) space.”',
        followups: [
          { q: 'Could it be faster for huge numbers?', a: 'Yes: Karatsuba splits each number in half and does three half-size multiplications instead of four, about O(n^1.585). FFT-based methods are nearly linear. For interview sizes, the O(m · n) digit loop is the expected answer.' },
          { q: 'Why can the carries sit in the array without being normalised immediately?', a: 'Each cell holds at most one digit product plus the previous contents, which stays small (a few hundred), and every cell is brought to 0-9 when its own position is processed from the right, so the final array is clean.' }
        ]
      },
      {
        lc: 202,
        restate: 'Start with a positive integer. Replace it by the sum of the squares of its digits, and repeat. Either it eventually reaches 1 (and stays there), or it loops forever in a cycle that does not contain 1. Return true if the number reaches 1.',
        examples: '- `19` → `true`: 1² + 9² = 82, 8² + 2² = 68, 6² + 8² = 100, 1² + 0² + 0² = 1\n- `2` → `false`: 4, 16, 37, 58, 89, 145, 42, 20, 4 and around again\n- `1` → `true`',
        brute: 'Keep applying the step and stop at 1: if the number never reaches 1, the loop never ends. A **set of seen values** fixes that (stop when a value repeats), at the cost of O(number of distinct values) memory.',
        insight: 'The sequence can’t grow forever: a number with d digits maps to at most 81 · d, so after a few steps every value is below about 243. A bounded space means the sequence must either reach 1 or enter a cycle. **Floyd’s tortoise and hare** finds the cycle with O(1) memory: `slow` takes one step per round, `fast` takes two. If the sequence reaches 1, `fast` gets there first (1 maps to itself). If it cycles, `fast` and `slow` meet somewhere in the loop. So loop until `fast == 1` (happy) or `slow == fast` (a cycle without 1, not happy). The step function is the digit-peeling loop `% 10`, `/ 10`.',
        code: {
          py: `class Solution:
    def isHappy(self, n: int) -> bool:
        def step(x):
            total = 0
            while x:
                total += (x % 10) ** 2     # square of the last digit
                x //= 10
            return total
        slow, fast = n, step(n)
        while fast != 1 and slow != fast:  # 1 reached, or the two met in a cycle
            slow = step(slow)              # one step
            fast = step(step(fast))        # two steps
        return fast == 1`,
          js: `function isHappy(n) {
  const step = x => {
    let total = 0;
    while (x > 0) {
      total += (x % 10) ** 2;              // square of the last digit
      x = Math.floor(x / 10);
    }
    return total;
  };
  let slow = n, fast = step(n);
  while (fast !== 1 && slow !== fast) {    // 1 reached, or the two met in a cycle
    slow = step(slow);                     // one step
    fast = step(step(fast));               // two steps
  }
  return fast === 1;
}`,
          java: `class Solution {
    private int step(int x) {
        int total = 0;
        while (x > 0) {
            int d = x % 10;                // the last digit
            total += d * d;
            x /= 10;
        }
        return total;
    }

    public boolean isHappy(int n) {
        int slow = n, fast = step(n);
        while (fast != 1 && slow != fast) {   // 1 reached, or the two met in a cycle
            slow = step(slow);                // one step
            fast = step(step(fast));          // two steps
        }
        return fast == 1;
    }
}`,
          cpp: `class Solution {
    int step(int x) {
        int total = 0;
        while (x > 0) {
            int d = x % 10;                // the last digit
            total += d * d;
            x /= 10;
        }
        return total;
    }
public:
    bool isHappy(int n) {
        int slow = n, fast = step(n);
        while (fast != 1 && slow != fast) {   // 1 reached, or the two met in a cycle
            slow = step(slow);                // one step
            fast = step(step(fast));          // two steps
        }
        return fast == 1;
    }
};`
        },
        complexity: 'O(log n) for the first step and then a bounded number of steps (every value drops below about 243), so effectively O(log n) time and O(1) space.',
        say: '“The step function sends any number to something small, so the sequence lives in a bounded range and either hits 1 or cycles. I could keep a set of seen numbers, but Floyd’s two pointers do it in constant space: slow moves one step, fast moves two. If the number is happy, fast reaches 1; if not, slow and fast meet inside the loop. I stop on either. The step itself peels digits with mod 10 and divide by 10.”',
        followups: [
          { q: 'Why is it guaranteed to either reach 1 or loop?', a: 'A d-digit number maps to at most 81 · d, which is smaller than the number once it has four or more digits, so the values soon stay below about 243. A finite set of values forces a repeat, and a repeat means a cycle.' },
          { q: 'What is the set-based alternative and its trade-off?', a: 'Store every value seen and return false on a repeat. Simpler to write and to reason about, costs O(number of distinct values) extra memory. Floyd uses O(1).' }
        ]
      }
    ],

    practice: [
      { lc: 202,
        hints: ['The step function maps any number to something small, so the sequence cannot grow without end. What are the only two things that can happen to it?', 'You need to detect a repeat. A set of seen numbers works; two pointers moving at different speeds work with no extra memory.', 'Write `step(x)` by peeling digits with `% 10` and `// 10`. Stop when the value is 1 (true) or when you see a value again (false).'],
        starter: { py: 'class Solution:\n    def isHappy(self, n: int) -> bool:\n        ', js: 'function isHappy(n) {\n  \n}' },
        tests: { fn: 'isHappy', sig: { args: ['int'] }, cases: [
          { args: [19], out: true }, { args: [2], out: false }, { args: [1], out: true }, { args: [7], out: true }, { args: [4], out: false },
          { args: [100], out: true }, { args: [1111111], out: true }, { args: [3], out: false }, { args: [2147483647], out: false }] } },

      { lc: 66,
        hints: ['The number is stored one digit per element, most significant first. Where does adding one start?', 'Work from the right end. A digit below 9 just goes up by one and you are done; a 9 becomes 0 and the carry moves left.', 'If every digit was a 9, the loop falls off the left end: the answer is a 1 followed by all zeros.'],
        solution: { explain: 'Walk from the last digit. If it is below 9, add one and return; otherwise set it to 0 and continue left. Falling off the front means the input was all nines, so return a 1 followed by zeros. O(n) time.', code: {
          py: `class Solution:
    def plusOne(self, digits: List[int]) -> List[int]:
        for i in range(len(digits) - 1, -1, -1):
            if digits[i] < 9:
                digits[i] += 1             # no carry: done
                return digits
            digits[i] = 0                  # 9 + 1 = 0, carry moves left
        return [1] + digits                # all nines: 999 -> 1000`,
          js: `function plusOne(digits) {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;                         // no carry: done
      return digits;
    }
    digits[i] = 0;                         // 9 + 1 = 0, carry moves left
  }
  return [1, ...digits];                   // all nines: 999 -> 1000
}`,
          java: `class Solution {
    public int[] plusOne(int[] digits) {
        for (int i = digits.length - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;               // no carry: done
                return digits;
            }
            digits[i] = 0;                 // 9 + 1 = 0, carry moves left
        }
        int[] out = new int[digits.length + 1];
        out[0] = 1;                        // all nines: 999 -> 1000
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> plusOne(vector<int> digits) {
        for (int i = (int)digits.size() - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;               // no carry: done
                return digits;
            }
            digits[i] = 0;                 // 9 + 1 = 0, carry moves left
        }
        digits.insert(digits.begin(), 1);  // all nines: 999 -> 1000
        return digits;
    }
};`
        } },
        starter: { py: 'class Solution:\n    def plusOne(self, digits: List[int]) -> List[int]:\n        ', js: 'function plusOne(digits) {\n  \n}' },
        tests: { fn: 'plusOne', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3]], out: [1, 2, 4] }, { args: [[9]], out: [1, 0] }, { args: [[9, 9, 9]], out: [1, 0, 0, 0] }, { args: [[0]], out: [1] },
          { args: [[1, 9]], out: [2, 0] }, { args: [[4, 3, 2, 1]], out: [4, 3, 2, 2] }] } },

      { lc: 50,
        hints: ['Multiplying n times is far too slow for n near two billion. Can you get x^10 from x^5?', 'Look at n in binary. Keep squaring x each round, and multiply into the result when the current lowest bit of n is 1.', 'For a negative n, invert x and negate n first. Do the negation in a 64-bit variable, because -(-2^31) does not fit in an int.'],
        starter: { py: 'class Solution:\n    def myPow(self, x: float, n: int) -> float:\n        ', js: 'function myPow(x, n) {\n  \n}' },
        tests: { fn: 'myPow', compare: 'float', sig: { args: ['float', 'int'] }, cases: [
          { args: [2.0, 10], out: 1024.0 }, { args: [2.1, 3], out: 9.261 }, { args: [2.0, -2], out: 0.25 }, { args: [5.0, 0], out: 1.0 },
          { args: [1.0, 2147483647], out: 1.0 }, { args: [-2.0, 3], out: -8.0 }, { args: [2.0, -2147483648], out: 0.0 }, { args: [0.0, 5], out: 0.0 }] } },

      { lc: 43,
        hints: ['You may not turn the strings into numbers, so use the school method. When you multiply digit i of one number by digit j of the other, which positions in the answer do they affect?', 'They affect positions i + j (the carry) and i + j + 1 (the units digit). The answer has at most len1 + len2 digits.', 'Accumulate into an integer array, carrying as you go from the right. Skip leading zeros at the end, and return "0" at once if either input is "0".'],
        starter: { py: 'class Solution:\n    def multiply(self, num1: str, num2: str) -> str:\n        ', js: 'function multiply(num1, num2) {\n  \n}' },
        tests: { fn: 'multiply', sig: { args: ['str', 'str'] }, cases: [
          { args: ['2', '3'], out: '6' }, { args: ['123', '456'], out: '56088' }, { args: ['999', '0'], out: '0' }, { args: ['0', '0'], out: '0' },
          { args: ['99', '99'], out: '9801' }, { args: ['10', '10'], out: '100' }, { args: ['123456789', '987654321'], out: '121932631112635269' }] } },

      { lc: 204,
        hints: ['Testing every number with trial division repeats the same work thousands of times. What if each prime crossed out its own multiples instead?', 'Start with a table where everything is assumed prime. For each p that is still marked, mark p*p, p*p + p, p*p + 2p, ... as composite.', 'Why start at p*p? Smaller multiples have a smaller prime factor and are already crossed. Why can the outer loop stop at p*p >= n? Every composite below n has a factor below sqrt(n).'],
        starter: { py: 'class Solution:\n    def countPrimes(self, n: int) -> int:\n        ', js: 'function countPrimes(n) {\n  \n}' },
        tests: { fn: 'countPrimes', sig: { args: ['int'] }, cases: [
          { args: [10], out: 4 }, { args: [0], out: 0 }, { args: [1], out: 0 }, { args: [2], out: 0 }, { args: [3], out: 1 }, { args: [100], out: 25 },
          { args: [1000], out: 168 }, { args: [5000], out: 669 }, { args: [49], out: 15 }] } },

      { lc: 172,
        hints: ['Trailing zeros come from factors of 10 = 2 x 5 in n!. Computing n! itself is hopeless for large n. Which of the two factors is the scarce one?', 'There are always more factors of 2 than of 5, so count the factors of 5 in 1..n. Multiples of 5 give one, multiples of 25 give a second one, and so on.', 'The count is n/5 + n/25 + n/125 + ... Loop: divide n by 5 repeatedly and add each quotient.'],
        solution: { explain: 'Each trailing zero needs one factor 5 (twos are plentiful). Numbers up to n contribute n/5 fives, plus an extra one for each multiple of 25, another for 125, and so on: the sum of n/5^k. O(log n) time, O(1) space.', code: {
          py: `class Solution:
    def trailingZeroes(self, n: int) -> int:
        count = 0
        while n:
            n //= 5                        # multiples of 5, then 25, then 125, ...
            count += n
        return count`,
          js: `function trailingZeroes(n) {
  let count = 0;
  while (n > 0) {
    n = Math.floor(n / 5);                 // multiples of 5, then 25, then 125, ...
    count += n;
  }
  return count;
}`,
          java: `class Solution {
    public int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) {
            n /= 5;                        // multiples of 5, then 25, then 125, ...
            count += n;
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) {
            n /= 5;                        // multiples of 5, then 25, then 125, ...
            count += n;
        }
        return count;
    }
};`
        } },
        starter: { py: 'class Solution:\n    def trailingZeroes(self, n: int) -> int:\n        ', js: 'function trailingZeroes(n) {\n  \n}' },
        tests: { fn: 'trailingZeroes', sig: { args: ['int'] }, cases: [
          { args: [3], out: 0 }, { args: [5], out: 1 }, { args: [0], out: 0 }, { args: [25], out: 6 }, { args: [100], out: 24 },
          { args: [1000], out: 249 }, { args: [10000], out: 2499 }, { args: [124], out: 28 }, { args: [125], out: 31 }] } },

      { lc: 9,
        hints: ['A negative number is never a palindrome (the minus sign), and neither is a positive number that ends in 0, except 0 itself. Handle those first.', 'You could convert to a string, but try with digits only: peel the last digit with `% 10` and build the reversed number.', 'You only need to reverse **half** of the digits: stop when the reversed part is no smaller than what is left. This also avoids overflow. An odd length leaves a middle digit, so compare against `rev // 10` too.'],
        solution: { explain: 'Rule out negatives and numbers ending in 0. Then move digits from the right end of `x` onto `rev` until `rev >= x`; the number is a palindrome if `x == rev` (even length) or `x == rev / 10` (odd length, the middle digit dropped). O(log x) time, no overflow because only half is reversed.', code: {
          py: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        if x < 0 or (x % 10 == 0 and x != 0):
            return False
        rev = 0
        while x > rev:                     # reverse only the second half
            rev = rev * 10 + x % 10
            x //= 10
        return x == rev or x == rev // 10  # even length, or odd length (drop the middle digit)`,
          js: `function isPalindrome(x) {
  if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
  let rev = 0;
  while (x > rev) {                        // reverse only the second half
    rev = rev * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  return x === rev || x === Math.floor(rev / 10);   // even length, or odd length (drop the middle digit)
}`,
          java: `class Solution {
    public boolean isPalindrome(int x) {
        if (x < 0 || (x % 10 == 0 && x != 0)) return false;
        int rev = 0;
        while (x > rev) {                  // reverse only the second half
            rev = rev * 10 + x % 10;
            x /= 10;
        }
        return x == rev || x == rev / 10;  // even length, or odd length (drop the middle digit)
    }
}`,
          cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0 || (x % 10 == 0 && x != 0)) return false;
        int rev = 0;
        while (x > rev) {                  // reverse only the second half
            rev = rev * 10 + x % 10;
            x /= 10;
        }
        return x == rev || x == rev / 10;  // even length, or odd length (drop the middle digit)
    }
};`
        } },
        starter: { py: 'class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        ', js: 'function isPalindrome(x) {\n  \n}' },
        tests: { fn: 'isPalindrome', sig: { args: ['int'] }, cases: [
          { args: [121], out: true }, { args: [-121], out: false }, { args: [10], out: false }, { args: [0], out: true }, { args: [1221], out: true },
          { args: [12321], out: true }, { args: [123], out: false }, { args: [1000021], out: false }, { args: [2147447412], out: true }] } },

      { lc: 2013,
        hints: ['Three stored points plus the query point must be the four corners of a square with sides parallel to the axes. Given the query and one diagonal corner, where must the other two corners be?', 'If the query is (qx, qy) and a stored point is (x, y) with |x - qx| = |y - qy| and not 0, the other two corners are (x, qy) and (qx, y).', 'Keep a count of every stored point (duplicates are separate). For each distinct stored point on a valid diagonal, add cnt[(x, y)] * cnt[(x, qy)] * cnt[(qx, y)].'],
        solution: { explain: 'Store a multiset of points as a hash map from (x, y) to its count. `add` is O(1). For `count`, loop over the distinct stored points; each one on a diagonal of the query (equal non-zero distance in x and y) pins the other two corners, and the number of squares through it is the product of the three counts. O(distinct points) per query.', code: {
          py: `class DetectSquares:
    def __init__(self):
        self.cnt = {}                              # (x, y) -> how many times added

    def add(self, point):
        key = (point[0], point[1])
        self.cnt[key] = self.cnt.get(key, 0) + 1

    def count(self, point):
        qx, qy = point
        total = 0
        for (x, y), c in list(self.cnt.items()):
            if abs(x - qx) == abs(y - qy) and x != qx:     # a diagonal corner, positive area
                total += c * self.cnt.get((x, qy), 0) * self.cnt.get((qx, y), 0)
        return total`,
          js: `class DetectSquares {
  constructor() {
    this.cnt = new Map();                          // "x,y" -> how many times added
  }
  add(point) {
    const key = point[0] + ',' + point[1];
    this.cnt.set(key, (this.cnt.get(key) || 0) + 1);
  }
  count(point) {
    const [qx, qy] = point;
    let total = 0;
    for (const [key, c] of this.cnt) {
      const [x, y] = key.split(',').map(Number);
      if (Math.abs(x - qx) === Math.abs(y - qy) && x !== qx) {   // a diagonal corner, positive area
        total += c * (this.cnt.get(x + ',' + qy) || 0) * (this.cnt.get(qx + ',' + y) || 0);
      }
    }
    return total;
  }
}`
        } },
        starter: { py: 'class DetectSquares:\n    def __init__(self):\n        pass\n\n    def add(self, point: List[int]) -> None:\n        pass\n\n    def count(self, point: List[int]) -> int:\n        pass', js: 'class DetectSquares {\n  constructor() {\n    \n  }\n  add(point) {\n    \n  }\n  count(point) {\n    \n  }\n}' },
        tests: { design: true, fn: 'DetectSquares', cases: [
          { ops: ['DetectSquares', 'add', 'add', 'add', 'count', 'count', 'add', 'count'], args: [[], [[3, 10]], [[11, 2]], [[3, 2]], [[11, 10]], [[14, 8]], [[11, 2]], [[11, 10]]], out: [null, null, null, null, 1, 0, null, 2] },
          { ops: ['DetectSquares', 'add', 'add', 'add', 'add', 'count', 'add', 'count', 'count'], args: [[], [[0, 0]], [[0, 1]], [[1, 0]], [[1, 1]], [[0, 0]], [[1, 1]], [[0, 0]], [[5, 5]]], out: [null, null, null, null, null, 1, null, 2, 0] },
          { ops: ['DetectSquares', 'add', 'add', 'count'], args: [[], [[4, 4]], [[4, 9]], [[4, 4]]], out: [null, null, null, 0] }] } }
    ],

    mistakes: [
      '**Starting the sieve’s inner loop at `2 * p`.** It still works, but it does about twice the needed work. Start at `p * p`; smaller multiples were crossed by smaller primes. (And if you start at `p * p` with a plain `int`, check it cannot overflow.)',
      '**Off-by-one on the bound.** “Primes **below** n” excludes n; “up to n” includes it. Size the array `n` or `n + 1` accordingly, and loop while `p * p < n` or `p * p <= n` to match. Test `n = 0, 1, 2, 3`.',
      '**Forgetting that 0 and 1 are not prime.** Mark them explicitly, or the count is off by two; trial division must reject `n < 2` before the loop.',
      '**Using `%` on negatives and trusting the sign.** `(-7) % 3` is `-1` in Java, C++ and JavaScript but `2` in Python. For a modular answer write `((x % m) + m) % m`.',
      '**Multiplying before reducing, in too small a type.** `a * b % m` with `a, b` near 10⁹ overflows a 32-bit `int`; cast to 64-bit **before** the multiplication (`(long) a * b % m`, not `(long)(a * b) % m`). In JavaScript, products past 2⁵³ lose digits silently: use BigInt.',
      '**Dividing under a modulus.** `(a / b) % m` is not `(a % m) / (b % m)`. Multiply by the modular inverse (`b^(m-2)` for a prime m), and remember it exists only when `gcd(b, m) = 1`.',
      '**Computing `x^n` with a loop of n multiplications**, or recursing n deep. Use repeated squaring, and handle `n < 0` and `n = -2³¹` (negating it overflows a 32-bit int).',
      '**Computing `a * b / gcd`** for the lcm: `a * b` may overflow even if the lcm fits. Divide first: `a / gcd * b`.',
      '**Dropping the final carry in string arithmetic.** `999 + 1` needs a leading 1: keep looping while either string has digits **or** a carry remains. And never leave leading zeros in a product (`"0"` times anything is `"0"`).',
      '**Reversing a whole 32-bit number to test a palindrome.** The reverse can overflow. Reverse only half, or compare digits with a string or two pointers.',
      '**Using `n!` directly for trailing zeros or for combinations.** `n!` is astronomically large. Count factors of 5 (`n/5 + n/25 + ...`), or keep factorials mod p and use inverses.',
      '**Checking only “seen before” by value in a loop with no stop.** For a digit-transform sequence like the happy-number step, forgetting a cycle check makes the loop infinite on every sad number.'
    ],

    quiz: [
      { kind: 'concept', q: 'In Euclid’s algorithm, `gcd(a, b)` equals which of these?',
        choices: ['`gcd(b, a % b)`', '`gcd(a - 1, b - 1)`', '`gcd(a / b, b)`', '`gcd(a + b, b)` divided by 2'], answer: 0,
        explain: 'Anything that divides both a and b also divides the remainder a % b, and vice versa, so the pair can be replaced by (b, a % b). Repeat until the remainder is 0; the last non-zero value is the gcd.' },
      { kind: 'complexity', q: 'What is the time complexity of the Sieve of Eratosthenes for all primes below n?',
        choices: ['O(n log log n)', 'O(n²)', 'O(n √n)', 'O(n log n)'], answer: 0,
        explain: 'Each prime p crosses about n/p numbers, and the sum of 1/p over primes up to n is about log log n. That is almost linear. O(n √n) is trial division on every number.' },
      { kind: 'concept', q: 'When the sieve handles a prime `p`, why can it start crossing out at `p * p` and not `2 * p`?',
        choices: ['Every smaller multiple `k * p` with `k < p` has a prime factor below `p`, so an earlier prime has already crossed it', 'Because `p * p` is always prime', 'To avoid crossing out `p` itself', 'It cannot; starting at `p * p` skips some composites'], answer: 0,
        explain: 'The multiple `k * p` with `k < p` has a prime factor smaller than p (a prime factor of k), and that smaller prime already crossed it out. Starting at p * p is only an optimisation, but a big one.' },
      { kind: 'bug', q: 'This trial-division primality test is wrong for one input. Which?',
        code: `def is_prime(n):
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True`,
        lang: 'py',
        choices: ['`n = 1` (and 0): it returns True, but they are not prime', '`n = 2`: it returns False', '`n = 9`: it returns True', 'Large primes: the loop never ends'], answer: 0,
        explain: 'For n = 1 (or 0) the loop body never runs, so the function falls through to True. A guard `if n < 2: return False` is needed. 2 and 9 are handled correctly, and the loop always stops at √n.' },
      { kind: 'concept', q: 'In Java, what does `(-7) % 3` evaluate to, and how do you get the mathematical remainder 2?',
        choices: ['`-1`; use `((x % m) + m) % m`', '`2`; nothing to fix', '`1`; use `Math.abs`', '`-1`; use `x % -m`'], answer: 0,
        explain: 'Java, C++ and JavaScript give the remainder the sign of the dividend. Python gives the sign of the divisor. Adding m and taking % again makes the result non-negative in every language.' },
      { kind: 'complexity', q: 'Computing `x^n` by repeated squaring takes how many multiplications?',
        choices: ['O(log n)', 'O(n)', 'O(√n)', 'O(n log n)'], answer: 0,
        explain: 'Each round halves the exponent (one squaring plus at most one extra multiplication). About 31 rounds for n near 2 × 10⁹.' },
      { kind: 'concept', q: 'For a **prime** modulus p, what is the modular inverse of `a` (with `a` not a multiple of p)?',
        choices: ['`a^(p-2) mod p`', '`p - a`', '`1 / a` as a float, then take the remainder', '`a^p mod p`'], answer: 0,
        explain: 'Fermat’s little theorem: a^(p-1) = 1 (mod p), so a · a^(p-2) = 1 and a^(p-2) is the inverse. It is one fast power. `p - a` is the negation, not the inverse.' },
      { kind: 'bug', q: 'This Java code is meant to compute `a * b % MOD` for `int a, b` near 10⁹. What is the bug?',
        code: `int MOD = 1_000_000_007;
long r = (long) (a * b) % MOD;`,
        lang: 'java',
        choices: ['The multiplication `a * b` is done in 32 bits and overflows before the cast; write `(long) a * b % MOD`', 'MOD should be a double', '`%` does not work on long', 'It is correct as written'], answer: 0,
        explain: 'Java evaluates `a * b` as an int first, so it wraps, and the cast to long happens too late. Cast one operand before multiplying.' },
      { kind: 'concept', q: 'Which of these are true about the number of trailing zeros of `n!`? Pick every one that applies.',
        choices: ['It equals `n/5 + n/25 + n/125 + ...` (integer division)', 'There are always at least as many factors of 2 as of 5, so 5 is the limiting factor', 'You need to compute `n!` exactly to count them', 'It grows roughly linearly with n, about n/4'], answer: [0, 1, 3],
        explain: 'Zeros come from pairs of 2 and 5; fives are scarcer. The sum of n/5^k is about n/4. You never compute the factorial.' },
      { kind: 'concept', q: 'In Floyd’s cycle detection applied to the happy-number sequence, what do the two pointers do and when do you stop?',
        choices: ['Slow moves one step and fast two; stop when fast reaches 1 (happy) or when they meet (a cycle, not happy)', 'Both move one step; stop when they differ', 'Fast moves one step and slow moves two; stop at 0', 'Slow starts at 1 and fast at n; stop when they cross'], answer: 0,
        explain: 'If the sequence reaches 1 it stays at 1, so fast gets there first. If it loops, a fast pointer laps the slow one and they meet. A set of seen values would also work, with O(n) memory.' },
      { kind: 'pattern', q: 'Which task is the best fit for the techniques in this lesson?',
        choices: ['Report the number of ways to pick 500 items out of 1000, modulo 10⁹ + 7', 'Find the shortest path between two cities on a map', 'Check whether brackets in an expression are balanced', 'Find the longest run of equal letters in a string'], answer: 0,
        explain: 'A huge count under a modulus is factorials, a modular inverse and fast exponentiation. The others are a graph search, a stack and a scan.' }
    ],

    flashcards: [
      { id: 'math-gcd', front: 'Euclid’s algorithm, in one line?', back: '`gcd(a, b) = gcd(b, a % b)`, until `b == 0`; the answer is `a`. O(log min(a, b)). `gcd(0, x) = x`.' },
      { id: 'math-lcm', front: 'lcm from gcd, and the safe way to compute it?', back: '`lcm(a, b) = a / gcd(a, b) * b`. **Divide first** so the intermediate value never overflows.' },
      { id: 'math-sieve', front: 'Sieve of Eratosthenes: the loop and its cost?', back: 'Mark all prime; for `p` while `p * p < n`, if marked, cross out `p*p, p*p + p, ...`. Then count the survivors. **O(n log log n)** time, O(n) space.' },
      { id: 'math-sieve-start', front: 'Why does the sieve start crossing at `p * p`?', back: 'Smaller multiples `k * p` (k < p) have a smaller prime factor and were already crossed. And stop at `p * p >= n`: a composite below n has a factor below √n.' },
      { id: 'math-trial', front: 'Test one number for primality?', back: 'Reject `n < 2`, then try divisors `d = 2..√n` (`d * d <= n`). O(√n). Use a wide type for `d * d`.' },
      { id: 'math-negmod', front: 'The negative-remainder trap?', back: '`(-7) % 3` is `-1` in Java, C++ and JS (sign of the dividend), `2` in Python. Safe form: `((x % m) + m) % m`.' },
      { id: 'math-modmul', front: 'Where does modular multiplication overflow?', back: 'In the product: two values below 10⁹ + 7 multiply to about 10¹⁸. Use a 64-bit type and cast **before** multiplying (`(long) a * b % m`). JS needs BigInt past 2⁵³.' },
      { id: 'math-fastpow', front: 'Fast exponentiation, the loop?', back: 'While `exp > 0`: if `exp & 1`, `result *= base`; `base *= base`; `exp >>= 1` (reduce mod m each time). O(log exp). Negative exponent: invert the base first.' },
      { id: 'math-inverse', front: 'Modular inverse for a prime modulus?', back: '`a^(p-2) mod p` (Fermat). Division `a / b` becomes `a * inverse(b)`. Needs `gcd(b, p) = 1`. Non-prime modulus: extended Euclid.' },
      { id: 'math-ncr', front: 'nCr mod p?', back: '`fact[n] * inverse(fact[r] * fact[n-r] % p) % p`. Build `fact` in O(n) once. Pascal’s triangle avoids inverses for small n (O(n²)).' },
      { id: 'math-digits', front: 'Peel digits off an integer?', back: '`n % 10` is the last digit, `n / 10` (integer division) the rest. Loop while `n > 0`. Mind the sign of negatives and overflow when rebuilding a reversed number.' },
      { id: 'math-bignum', front: 'Add or multiply numbers given as strings?', back: 'Go from the right with a carry; loop while either string has digits **or a carry remains**. Multiplication: digit `i` times digit `j` lands at `i + j + 1` (carry to `i + j`).' },
      { id: 'math-overflow', front: 'Integer limits per language?', back: 'Java `int` ±2.1×10⁹ (wraps), `long` ±9.2×10¹⁸. C++ signed overflow is undefined behaviour. JS exact only to 2⁵³ − 1 (BigInt beyond). Python unbounded.' },
      { id: 'math-zeros', front: 'Trailing zeros of `n!`?', back: 'Count factors of 5: `n/5 + n/25 + n/125 + ...`. Twos are always plentiful. O(log n), no factorial.' },
      { id: 'math-floyd', front: 'Floyd’s cycle idea on a numeric sequence?', back: 'Slow takes one step, fast takes two. If the sequence reaches a fixed point (1 for happy numbers) fast gets there; if it cycles they meet. O(1) memory versus a seen-set.' }
    ],

    deeper: [
      { title: 'Euclidean algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Euclidean_algorithm', time: 'about 15 min', note: 'Why it is fast (the Fibonacci worst case), and the extended version that also gives modular inverses.' },
      { title: 'Sieve of Eratosthenes (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes', time: 'about 15 min', note: 'The animation to compare with the visualizer, the complexity argument, and the segmented and wheel variants.' },
      { title: 'Modular arithmetic (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Modular_arithmetic', time: 'about 20 min', note: 'The rules for reducing sums and products, inverses, and Fermat’s little theorem.' },
      { title: 'Exponentiation by squaring (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Exponentiation_by_squaring', time: 'about 10 min', note: 'The recursive and iterative forms and the binary view of the exponent.' },
      { title: 'NeetCode: Math and geometry', url: 'https://neetcode.io/roadmap', time: 'browse', note: 'Where these problems sit in the roadmap, with a video walkthrough for each of the worked problems.' }
    ],

    detective: [
      { id: 'ribbon-squares', decoys: ['arrays-hashing', 'two-pointers', 'greedy'],
        statement: 'A craft shop has two rolls of ribbon, one 252 cm long and one 105 cm long. The owner wants to cut both rolls completely into identical pieces, with nothing left over, and wants those pieces to be as long as possible so that she has the fewest cuts to make. Her second question is about a display: one window light blinks every 252 seconds and another every 105 seconds, and both blinked together at opening time; how many seconds until they next blink together? Customers will type in any two lengths, so she needs a method that stays fast even when the numbers have ten digits.',
        why: 'Both questions come from **what two whole numbers share**: the longest equal piece that measures both, and the first moment both repeat. Replacing the pair by the shorter one and the **remainder** shrinks the numbers quickly (Euclid), and the second answer follows from the first by dividing before multiplying. Nothing about order, windows or choices: it is divisibility.' },
      { id: 'mailbox-census', decoys: ['dp-1d', 'bits', 'arrays-hashing'],
        statement: 'A town numbers its houses from 1 up to a few million. The postal service gives a special locked mailbox to a house only when its number cannot be written as two smaller whole numbers multiplied together (and the number is bigger than 1). Every month the council asks how many special mailboxes the town needs below a given house number, and each month the limit is different. Testing each house one at a time by trying every smaller number takes the clerk days; she wants a method that crosses off whole families of houses at once, so that one pass through the list answers the question.',
        why: 'The wording hides **primes below a limit**, asked for a whole range at once. The efficient move is not to test numbers one by one but to let each surviving number **eliminate its own multiples**, starting from its square, and stop once the square passes the limit. What remains is the count: nearly linear time, one boolean per house.' },
      { id: 'rumour-count', decoys: ['recursion', 'dp-1d', 'bits'],
        statement: 'On the first day a rumour is known to one person. Every day, each person who knows it tells exactly three people who have not heard it, and nobody is ever told twice, so the number of people who know it multiplies by four each day. The newsroom wants the total after d days, where d can be as large as a hundred trillion, and the number is far too big to print: they only need the answer left after dividing by 1,000,000,007 and keeping the remainder. They also want to know, for a second question, how many ways a committee of 500 can be chosen from the 1000 people who know it on a given day, using the same remainder rule.',
        why: 'A repeated multiplication by the same factor with a **huge count of repeats** and an answer **kept modulo a big prime**: halve the exponent and square instead of multiplying d times. The committee question needs division inside a remainder, so factorials are kept modulo the prime and the divisor is replaced by its **modular inverse**.' }
    ]
  });
})();
