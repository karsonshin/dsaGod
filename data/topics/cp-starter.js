/* Offer Ready: competitive programming starter. Schema: README.md, "Adding content".
   Every runnable snippet with tests is checked by tools/verify_content.py; the stdin templates are run by hand (they read input). */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'cp-starter',

    hook: 'Contest problems hand you a number, the input limit, and expect you to turn it into an algorithm before you write a line. This is a short, practical starter for that world: how to read limits, how to read and print input fast in each language, a template to start every problem from, the bugs that cost the most points, and a routine for getting better. It pays off in interviews mostly through the first skill, because the limit tells you the answer’s shape. Treat the rest as optional training.',

    cues: [
      'A statement gives **n ≤ 20**, **n ≤ 10⁵** or **n ≤ 10⁹** and you have to decide which algorithm that allows before coding.',
      'The input is large (10⁵ to 10⁶ numbers) and the first attempt gets “time limit exceeded” with a correct algorithm: the **reading** is the slow part.',
      'The answer is huge, so the statement says “print it modulo 10⁹ + 7”, or the sums no longer fit in 32 bits.',
      'Your solution passes the samples and fails a hidden test: you need a **brute force and a random tester**, not more staring.',
      'You want a repeatable way to practice: a weekly contest, a way to review it, and a way to know you’re improving.',
      'The trap: reaching for a clever algorithm when the limit is small on purpose, or writing the textbook algorithm when the limit forbids it.'
    ],

    intuition: [
      'A contest judge runs your program on hidden inputs with a **time limit**, typically one to two seconds, and a memory limit. There is no interviewer to nudge you. The statement’s only hint is the **size of the input**, and that hint is strong: setters choose the limit so that the intended solution passes and the slower ones fail. Work backwards from it.',
      'A compiled language does roughly **10⁸ simple operations per second**; Python manages about a tenth of that unless the heavy work is inside a built-in. So: with n = 10⁵, an O(n²) loop is 10¹⁰ steps and dies, while O(n log n) is under two million and is fine. With n = 20, even 2ⁿ ≈ a million subsets is fine, which is why “try everything” becomes legal. With n = 10⁹ you cannot even loop once, so the answer is a formula or a binary search over the answer: O(log n).',
      'Think of the limit as a budget and each algorithm as a price. The skill is **pricing before building**: read n, compute n, n log n, n² and 2ⁿ for that n, drop every class over budget, and aim at the most expensive one that still fits, because the problem usually needs that much power.',
      'Beyond the limit, contests reward four habits: **fast input and output** so the reading doesn’t eat the time budget; a **ready template** so you never type boilerplate; **care with big numbers** (overflow, modular arithmetic); and **testing against a brute force** so you find the bug yourself. Each is small, and together they separate “I know the algorithm” from “I got it accepted”.',
      'Precisely, the loop for every problem:\n\n1. Read the **limits** first, before the story. Write n, the value range, and the time limit in a comment.\n2. Price the classes against the budget (the visualizer below does this for any n) and name the target complexity.\n3. Write the simplest brute force that is obviously correct, even if it is too slow.\n4. Find the fast idea that closes the gap to the target, code it from the template, and **stress test** it against the brute force on tiny random inputs.\n5. After the contest, **upsolve**: solve whatever you missed, then read the editorial for what you solved.',
      'Pick an n in the visualizer and step through the six classes. Each row says whether that complexity fits the 10⁸ budget at your n. Try 20, 5,000, 100,000 and 1,000,000, and notice which classes flip from “fits” to “too slow”.'
    ].join('\n\n'),

    viz: 'growth',

    template: {
      title: 'Fast-I/O starter: read everything, solve per test case, print once',
      note: 'The shape is the same in every language: **read the whole input in one go (or buffered), parse tokens, call `solve` once per test case, collect the answers and write them with a single flush.** `solve` is the only part you rewrite. Python reads raw bytes and splits them; JavaScript reads file descriptor 0; Java wraps `System.in` in a `BufferedReader` and a `StringTokenizer` and prints through a `PrintWriter`; C++ turns off the sync with C’s stdio and unties `cin` from `cout`. The sample `solve` returns the sum of the array, so the template runs as is: feed it `2`, `3`, `1 2 3`, `2`, `5 5` on separate lines and it prints 6 and 10. Use `long`/`long long` for sums.',
      code: {
        py: `import sys

def solve(n, a):
    return sum(a)                          #> replace with the real algorithm; this sample returns the sum

def main():
    data = sys.stdin.buffer.read().split() #> one read for the whole input, split into byte tokens
    pos = 1
    out = []
    for _ in range(int(data[0])):          #> first number: how many test cases
        n = int(data[pos]); pos += 1
        a = list(map(int, data[pos:pos + n])); pos += n
        out.append(solve(n, a))
    sys.stdout.write("\\n".join(map(str, out)) + "\\n")  #> one write at the end, not one print per case

main()`,
        js: `const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter(Boolean).map(Number);  // one read, parse all tokens
let pos = 0;
const next = () => data[pos++];

function solve(n, a) {
  return a.reduce((s, x) => s + x, 0);     // replace with the real algorithm; this sample returns the sum
}

const out = [];
for (let t = next(); t > 0; t--) {         // first number: how many test cases
  const n = next();
  const a = data.slice(pos, pos + n); pos += n;
  out.push(solve(n, a));
}
console.log(out.join('\\n'));               // one write at the end, not one console.log per case`,
        java: `import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));   // buffered: never use a bare Scanner on big input
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }
    static int nextInt() throws IOException { return Integer.parseInt(next()); }

    static long solve(int n, int[] a) {
        long sum = 0;                      // replace with the real algorithm; long so the sum can't overflow
        for (int x : a) sum += x;
        return sum;
    }

    public static void main(String[] args) throws IOException {
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        int t = nextInt();                 // first number: how many test cases
        while (t-- > 0) {
            int n = nextInt();
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = nextInt();
            out.println(solve(n, a));
        }
        out.flush();                       // forget this and nothing prints
    }
}`,
        cpp: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

ll solve(int n, vector<ll>& a) {
    return accumulate(a.begin(), a.end(), 0LL);   // replace with the real algorithm; 0LL keeps the sum in 64 bits
}

int main() {
    ios::sync_with_stdio(false);           // stop syncing with C stdio: several times faster
    cin.tie(nullptr);                      // don't flush cout before every read
    int t;
    cin >> t;                              // first number: how many test cases
    while (t--) {
        int n;
        cin >> n;
        vector<ll> a(n);
        for (auto& x : a) cin >> x;
        cout << solve(n, a) << '\\n';       // '\\n' not endl: endl flushes every line
    }
    return 0;
}`
      }
    },

    complexity: {
      time: 'Pick the class from the limit on n',
      space: 'Check the memory limit: 256 MB holds about 6 · 10⁷ ints',
      why: 'The working rule is **steps ≈ f(n) must stay under about 10⁸** (10⁷ in Python). Plug in the real n: n = 2 · 10⁵ gives n² = 4 · 10¹⁰ (no), n log₂ n ≈ 3.5 · 10⁶ (yes). Memory has a budget too. An `int` array of 10⁶ is 4 MB, of 10⁷ is 40 MB, and a 5,000 × 5,000 table of 4-byte ints is 100 MB, which is why quadratic DP tables sometimes need a rolling row. Hidden constants matter more here than in an interview: a hash map costs 10 to 50 times a plain array access, and recursion costs more than a loop.',
      trap: 'Two traps pull in opposite directions. **Over-engineering:** n ≤ 100 or n ≤ 1,000 is a signal that an O(n³) or O(n²) brute force is the intended answer, and a clever one only adds bugs. **Under-reading:** the limit is on **every** input, and a hidden second limit (the sum of n over all test cases, the value range, q queries) changes the budget. Always read all of the limits, then price them.'
    },

    variations: [
      {
        name: 'Reading the constraints',
        body: 'Work from the limit to the algorithm family. These are guides for a one-to-two second limit in a compiled language; halve or quarter the allowance for Python.\n\n| Limit | Budget class | What the setter probably wants |\n|---|---|---|\n| n ≤ 10 | O(n!) | try every ordering (permutations, backtracking) |\n| n ≤ 20 | O(2ⁿ · n) | every subset: **bitmask** enumeration or bitmask DP |\n| n ≤ 40 | O(2^(n/2)) | meet in the middle: split in halves, combine |\n| n ≤ 100 to 500 | O(n³) | triple loop, Floyd–Warshall, interval DP |\n| n ≤ 5,000 | O(n²) | every pair, a 2-D DP table |\n| n ≤ 10⁵ | O(n log n) | sort, heap, binary search, sweep line, segment tree |\n| n ≤ 10⁶ | O(n) | a single pass, two pointers, a sieve, counting |\n| n ≤ 10⁹ | O(√n) or O(log n) | trial division to √n, binary search on the answer, fast power |\n| n ≤ 10¹⁸ | O(log n) | pure math: halving, fast exponentiation, a formula |\n\nThen look at the **value** limits for a second clue. Values up to 10⁹ summed over 10⁵ items reach 10¹⁴ and need 64 bits. A small value range (say ≤ 100) suggests **counting** or DP over values. A line like “sum of n over all tests ≤ 2 · 10⁵” means the per-test cost must be near-linear, because the budget is shared across tests. A **query count** q beside n means you want O(log n) or O(1) per query after preprocessing, not O(n) per query.\n\nA final signal is the answer format. “Print modulo 10⁹ + 7” says the true answer is astronomically large, so the intended method counts with DP or combinatorics and reduces as it goes. “Minimum possible maximum” or “largest value such that” hints at **binary search on the answer** (Capacity to Ship Packages, 1011, below).'
      },
      {
        name: 'Fast input and output, by language',
        body: 'With 10⁵ to 10⁶ numbers, how you read can be the whole running time. The rules per language:\n\n**Python.** `input()` is slow in a loop. For many lines use `sys.stdin.readline`; for the whole input use `sys.stdin.buffer.read().split()` and convert with `int`. Build output in a list and write it once: a `print` per line over 10⁵ lines is noticeably slow. Convert with `map(int, ...)` rather than a Python-level loop when you can.\n\n**JavaScript (Node).** `readFileSync(0, "utf8")` reads all of stdin at once; split on whitespace and parse. Collect the lines in an array and `console.log(out.join("\n"))` once. Calling `console.log` in a loop makes a system call per line.\n\n**Java.** `Scanner` is slow (it uses regular expressions): reading 10⁶ integers with it can take longer than the time limit. Use `BufferedReader` with `StringTokenizer` and write through a `PrintWriter` (or a `StringBuilder` printed once), and **flush** the writer at the end. `StreamTokenizer` is fastest but parses numbers as doubles, so it silently loses precision above 2⁵³.\n\n**C++.** Put `ios::sync_with_stdio(false); cin.tie(nullptr);` first in `main`. After that, `cin`/`cout` are as fast as `scanf`/`printf`, but you must not **mix** the two families in one program. Print `\'\n\'`, not `endl`, because `endl` flushes the buffer each time. Reading with `cin >>` skips whitespace, so line breaks never matter, except when you need whole lines: then `getline` after `cin >>` needs a `cin.ignore()` first.\n\nOne extra Python habit: wrap the solution in a function. Local variables are much faster than globals, which often buys 20 to 30 percent for free.'
      },
      {
        name: 'Pitfalls: overflow and modular arithmetic',
        body: '**Overflow.** Python integers never overflow, so these bugs are Java, C++ and JavaScript only. A 32-bit `int` tops out near 2.1 · 10⁹. Two values of 10⁹ added are 2 · 10⁹ (still fits, barely); multiplied they are 10¹⁸ (does not). Use `long` or `long long` (up to 9.2 · 10¹⁸) whenever a sum or product can pass 2 · 10⁹, and **cast before you multiply**: `(long) a * b`, not `(long)(a * b)`, which overflows first and casts the damage. JavaScript numbers are doubles, exact only up to 2⁵³ ≈ 9 · 10¹⁵: use `BigInt` for bigger products.\n\n**Modular arithmetic.** When the statement says “modulo 10⁹ + 7”, reduce **after every addition and multiplication**, never at the end. Addition, subtraction and multiplication all commute with the mod; division does not. Three rules: after a subtraction add the modulus back (`(a - b + MOD) % MOD`) because C++ and Java return negative remainders; use 64-bit for the product of two residues (each below ~10⁹, the product below ~10¹⁸); and divide by multiplying with the **modular inverse**, which for a prime modulus is `pow(x, MOD - 2, MOD)` by Fermat’s little theorem.\n\nThe tool you will use most is **fast power**: compute b^e mod m in O(log e) by squaring. It turns “raise to a 10¹⁵ power” from impossible into 50 multiplications. The code below does it with a loop over the bits of the exponent.',
        code: {
          py: `def pow_mod(b, e, m):
    r = 1
    b %= m
    while e:
        if e & 1:                #> this bit of the exponent is set: multiply it in
            r = r * b % m
        b = b * b % m            #> square the base for the next bit
        e >>= 1
    return r`,
          js: `function powMod(b, e, m) {
  let r = 1n, base = BigInt(b) % BigInt(m);   // BigInt: products of two residues exceed 2^53
  let exp = BigInt(e);
  const mod = BigInt(m);
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % mod;       //> this bit of the exponent is set: multiply it in
    base = (base * base) % mod;               //> square the base for the next bit
    exp >>= 1n;
  }
  return Number(r);
}`
        },
        tests: { fn: { py: 'pow_mod', js: 'powMod' }, cases: [
          { args: [2, 10, 1000], out: 24 }, { args: [3, 0, 7], out: 1 }, { args: [2, 62, 1000000007], out: 145586002 }, { args: [7, 1000000006, 1000000007], out: 1 },
          { args: [10, 18, 13], out: 1 }, { args: [5, 3, 1], out: 0 }, { args: [123456789, 987654321, 1000000007], out: 652541198 }] }
      },
      {
        name: 'Pitfalls: off-by-one and recursion depth',
        body: '**Off-by-one.** Decide up front whether each range is half-open `[lo, hi)` or closed `[lo, hi]`, and use that one convention everywhere in the program. Statements often count from 1 while arrays count from 0: convert once while reading, not in every formula. In binary search, write the loop invariant in a comment (“answer is in `[lo, hi]`”) and pick `mid` to make progress: `mid = (lo + hi) // 2` with `lo = mid` loops forever, so use the upper mid when the update is `lo = mid`. The cheapest guard is the **smallest case**: run n = 1, n = 2 and the empty input by hand.\n\n**Recursion depth.** A depth-first search on a path-shaped tree of 10⁵ nodes recurses 10⁵ deep. Python stops at about 1,000 frames (`sys.setrecursionlimit(10**6)` raises the limit but can crash the interpreter without a bigger thread stack, so prefer an explicit stack). Java’s default stack handles roughly 10⁴ frames; run the solution in `new Thread(null, runnable, "", 1 << 28)` for 256 MB of stack. C++ usually allows about 10⁵ to 10⁶ frames depending on frame size, and judges differ. JavaScript manages about 10⁴. The robust habit is to convert a deep recursion into a loop with your own stack as soon as depth can reach n.\n\nTwo smaller classics: **reading a line of unknown length** (`readLine` returning `null` at the end, or a trailing blank line), and **resetting global arrays between test cases**, which silently carries one case’s data into the next.'
      },
      {
        name: 'Stress testing with a brute force',
        body: 'When a solution fails a hidden test, stop reading it and **let the computer find the counterexample**. Keep two programs: the **fast** one you submit, and a **brute** one you trust because it is too simple to be wrong (try everything). Generate thousands of tiny random inputs (n from 1 to 8, values from −5 to 5), run both, and stop at the first difference. Tiny inputs matter: a failing case with six numbers is something you can trace by hand, while a failing case with 10⁵ numbers is not. Edge-heavy ranges (duplicates, negatives, all equal, n = 1) find bugs fastest.\n\nA good stress setup has three parts: the **generator** (random, small, and seeded so a failure can be replayed), the **brute** (obviously correct, however slow), and the **loop** that compares. The example checks a maximum-subarray solution against the try-every-range brute force. Run it before you submit, whenever the fast idea was clever and the brute force is 10 lines.',
        code: {
          py: `import random

def brute(a):
    best = a[0]
    for i in range(len(a)):
        for j in range(i, len(a)):      #> try every range: slow but obviously right
            best = max(best, sum(a[i:j + 1]))
    return best

def fast(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)           #> the clever O(n) idea under test
        best = max(best, cur)
    return best

def stress(trials=3000, seed=1):
    random.seed(seed)                   #> seeded: a failure can be replayed exactly
    for _ in range(trials):
        a = [random.randint(-5, 5) for _ in range(random.randint(1, 8))]   #> tiny inputs: easy to trace by hand
        if fast(a) != brute(a):
            return a, fast(a), brute(a)
    return None

print(stress())`,
          js: `function brute(a) {
  let best = a[0];
  for (let i = 0; i < a.length; i++)
    for (let j = i; j < a.length; j++)       //> try every range: slow but obviously right
      best = Math.max(best, a.slice(i, j + 1).reduce((s, x) => s + x, 0));
  return best;
}

function fast(a) {
  let best = a[0], cur = a[0];
  for (let i = 1; i < a.length; i++) {
    cur = Math.max(a[i], cur + a[i]);        //> the clever O(n) idea under test
    best = Math.max(best, cur);
  }
  return best;
}

function stress(trials = 3000) {
  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(Math.random() * 8);                          //> tiny inputs: easy to trace by hand
    const a = Array.from({ length: n }, () => Math.floor(Math.random() * 11) - 5);
    if (fast(a) !== brute(a)) return [a, fast(a), brute(a)];
  }
  return null;
}

console.log(stress());`
        }
      },
      {
        name: 'Contest strategy',
        body: 'In a timed round, order beats brilliance. A routine that works for most people:\n\n1. **Skim all problems first** (3 to 5 minutes) and sort them by how sure you are, not by letter. Easy-looking problems early in the list are usually easy; the scoreboard confirms it within minutes.\n2. **Solve in your confidence order.** A fast accepted solution on an easy problem beats a half-finished hard one, because penalty and rank reward early accepts.\n3. **Before coding, write the limits and the target complexity in a comment**, then the brute force in two lines. If the brute force fits the limit, **submit the brute force**.\n4. **Test the samples, then your edge cases** (n = 1, all equal, maximum values) before pressing submit. A wrong attempt usually costs penalty time.\n5. **If a problem stalls for about 20 minutes, move on.** Write what you tried in a comment, take another problem, and come back with fresh eyes.\n6. **When a submission fails, don’t resubmit a tweak.** Re-read the statement, then stress test. Random patching is how contests are lost.\n7. **Reserve the last 10 minutes** for re-reading the problem you are most likely to have misread, not for starting something new.\n\nThe mental side matters as much: a wrong answer is information, a stuck problem is not a verdict on you, and the standings of others are noise until the contest ends.'
      },
      {
        name: 'Upsolving: the routine that actually improves you',
        body: 'Most improvement happens **after** the contest. Upsolving means returning to every problem you could not finish, and finishing it. The routine:\n\n1. **Within a day** of the contest, while the problems are fresh, retry each unsolved problem alone for 30 to 60 minutes **without** the editorial.\n2. If still stuck, read **only the first hint or the first paragraph** of the editorial, then go back to your own code. Reading the whole solution too early skips the learning.\n3. Implement the editorial idea yourself from a blank file. Do not paste; the typing is the practice. Submit until accepted.\n4. **For problems you did solve**, read the editorial anyway: there is often a shorter or faster way, and comparing is where you pick up new tools.\n5. Write **one line per problem** in a log: the key idea, the mistake you made, and the trigger you missed (“limit was 20: should have thought bitmask”). Review the log weekly.\n6. Re-solve the problems you needed the editorial for **a week later** from scratch. If you can’t, the idea hasn’t stuck.\n\nTwo habits keep this honest: track *why* each failure happened (did not see the idea, saw it but mis-implemented, or ran out of time), and attack the most common cause first. Implementation slips are fixed with the template and stress tests; missing ideas are fixed with volume and the log.'
      },
      {
        name: 'A first-month practice plan',
        body: 'Aim for about 5 hours a week. It assumes you already read the basics (arrays, sorting, binary search, a little graph work).\n\n- **Week 1: tools.** Build your template in your main language and test it on a large input. Solve 8 to 10 easy problems timed (15 to 20 minutes each) using the template, writing the limit and target complexity in a comment each time. Goal: no fumbling with input and output.\n- **Week 2: constraint reading and brute force.** Do 8 problems across the limit table (n ≤ 20 bitmask, n ≤ 5,000 quadratic, n ≤ 10⁵ sort and binary search). Before reading the solution, write which complexity the limit allows. Add a stress test for at least three of them.\n- **Week 3: first virtual contest.** Take a past 2-hour round, **timed, with no pause**. Spend the next two days upsolving using the routine above and fill the log.\n- **Week 4: big numbers and the toolbox.** Do 6 problems with modular arithmetic, fast power and sieve, and re-solve three problems from the log cold. Then a second timed contest, and compare to week 3.\n\nAfter the month, keep one contest a week and one upsolve session. Count progress by **problems solved in time** and by how rarely a limit surprises you, not by rating alone.'
      },
      {
        name: 'Stretch: binary lifting',
        body: 'Binary lifting answers “what is the k-th ancestor of v?” in O(log n) per query after O(n log n) preparation. The idea is the same one as fast power: keep a table where `up[j][v]` is the **2^j-th ancestor** of `v`. The 2^j-th ancestor is the 2^(j−1)-th ancestor of the 2^(j−1)-th ancestor, so each row is built from the row before it. To jump k steps, write k in binary and take one jump for every set bit.\n\nThe table is also how you find a lowest common ancestor (lift the deeper node, then lift both while their ancestors differ), and the “jump pointer” trick appears in problems about repeated functions (“where do I end after 10¹⁸ steps?”). Use −1 for “no ancestor”. It is rare in interviews and common at the contest level where n reaches 10⁵ and the query count is large.',
        code: {
          py: `def kth_ancestor(parent, v, k):
    n = len(parent)
    if k >= n:
        return -1                                    # no chain of n nodes is longer than n - 1 steps
    LOG = max(1, n.bit_length())
    up = [parent[:]]                                 #> up[0][v] is the parent: the 2^0-th ancestor
    for j in range(1, LOG):
        prev = up[-1]
        up.append([-1 if prev[u] < 0 else prev[prev[u]] for u in range(n)])   #> two jumps of 2^(j-1) make one of 2^j
    for j in range(LOG):
        if v < 0:
            break
        if (k >> j) & 1:                             #> one jump for every set bit of k
            v = up[j][v]
    return v`,
          js: `function kthAncestor(parent, v, k) {
  const n = parent.length;
  if (k >= n) return -1;                             // no chain of n nodes is longer than n - 1 steps
  const LOG = Math.max(1, n.toString(2).length);
  const up = [parent.slice()];                       //> up[0][v] is the parent: the 2^0-th ancestor
  for (let j = 1; j < LOG; j++) {
    const prev = up[j - 1];
    up.push(prev.map((p) => (p < 0 ? -1 : prev[p]))); //> two jumps of 2^(j-1) make one of 2^j
  }
  for (let j = 0; j < LOG && v >= 0; j++) {
    if ((k >> j) & 1) v = up[j][v];                  //> one jump for every set bit of k
  }
  return v;
}`
        },
        tests: { fn: { py: 'kth_ancestor', js: 'kthAncestor' }, cases: [
          { args: [[-1, 0, 0, 1, 1, 2, 3], 6, 3], out: 0 }, { args: [[-1, 0, 0, 1, 1, 2, 3], 6, 4], out: -1 }, { args: [[-1, 0, 0, 1, 1, 2, 3], 5, 1], out: 2 },
          { args: [[-1, 0, 0, 1, 1, 2, 3], 4, 0], out: 4 }, { args: [[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8], 9, 9], out: 0 }, { args: [[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8], 9, 5], out: 4 },
          { args: [[-1], 0, 1], out: -1 }, { args: [[-1, 0], 1, 1], out: 0 }] }
      },
      {
        name: 'Stretch: sparse table',
        body: 'A sparse table answers **range minimum** (or maximum, or gcd) queries in **O(1)** after O(n log n) preparation, when the array never changes. Row `j` holds the minimum of every block of length 2^j: `t[j][i] = min(t[j-1][i], t[j-1][i + 2^(j-1)])`. To answer `[l, r]`, take the largest power `2^k` that fits inside the range and combine the two blocks that start at `l` and end at `r`. They overlap in the middle, which is fine for min, max and gcd because repeating an element does not change the result. That overlap trick is why it does **not** work for sums: use prefix sums there.\n\nCompare with the alternatives: a segment tree handles updates but costs O(log n) per query; prefix sums cover sums only. Pick the sparse table when queries are many and the data is static, as in n, q ≤ 10⁵ range-minimum problems. The memory is n log n numbers, about 1.7 million at n = 10⁵.',
        code: {
          py: `def range_mins(a, queries):
    n = len(a)
    t = [a[:]]                                        #> t[0] is the array: blocks of length 1
    j = 1
    while (1 << j) <= n:
        p = t[-1]
        half = 1 << (j - 1)
        t.append([min(p[i], p[i + half]) for i in range(n - (1 << j) + 1)])   #> block of 2^j = two blocks of 2^(j-1)
        j += 1
    out = []
    for l, r in queries:                              # inclusive range
        k = (r - l + 1).bit_length() - 1              #> biggest power of two that fits in the range
        out.append(min(t[k][l], t[k][r - (1 << k) + 1]))   #> two overlapping blocks cover [l, r]
    return out`,
          js: `function rangeMins(a, queries) {
  const n = a.length;
  const t = [a.slice()];                              //> t[0] is the array: blocks of length 1
  for (let j = 1; (1 << j) <= n; j++) {
    const p = t[j - 1], half = 1 << (j - 1), row = [];
    for (let i = 0; i + (1 << j) <= n; i++) row.push(Math.min(p[i], p[i + half]));   //> block of 2^j = two blocks of 2^(j-1)
    t.push(row);
  }
  return queries.map(([l, r]) => {                    // inclusive range
    const k = 31 - Math.clz32(r - l + 1);             //> biggest power of two that fits in the range
    return Math.min(t[k][l], t[k][r - (1 << k) + 1]); //> two overlapping blocks cover [l, r]
  });
}`
        },
        tests: { fn: { py: 'range_mins', js: 'rangeMins' }, cases: [
          { args: [[5, 2, 4, 7, 1, 3, 6], [[0, 6], [0, 0], [1, 3], [3, 5], [5, 6], [2, 3]]], out: [1, 5, 2, 1, 3, 4] },
          { args: [[9], [[0, 0]]], out: [9] }, { args: [[3, 3, 3, 3], [[0, 3], [1, 2]]], out: [3, 3] },
          { args: [[8, 6, 4, 2, 1, 3, 5, 7], [[0, 7], [0, 3], [4, 7], [2, 5]]], out: [1, 2, 1, 1] }] }
      },
      {
        name: 'How contest skills differ from interview skills',
        body: 'The two games overlap, but they reward different things.\n\n| | Contest | Interview |\n|---|---|---|\n| **Input** | A hidden test set with huge n, read from stdin | A function signature, small examples, you pick the tests |\n| **Judge** | An automatic grader: right or wrong, with a time limit | A person: reasoning, communication, trade-offs |\n| **Time** | 2 hours for 4 to 7 problems | 30 to 45 minutes for one or two |\n| **Language** | One you know deeply, with a template and shortcuts | The one you can explain clearly |\n| **Code style** | Short, global variables, terse names | Readable, named, structured, testable |\n| **What you say** | Nothing | The most important part: the plan, the complexity, the edge cases |\n| **Hard topics** | Number theory, geometry, advanced trees and graphs | Mostly arrays, hashing, trees, graphs, DP, design |\n\nWhat transfers well: **reading limits to find the algorithm**, building a brute force first, stress testing, speed on standard patterns, and calm under time pressure. What does not transfer on its own: terse code (write it readable in an interview), silent solving (narrate your thinking), and obscure tricks (a persistent segment tree rarely helps you get an offer).\n\nSo treat contests as **training**, not the goal. If your target is interviews, a few rounds a month are plenty, and the rest of the time belongs to the mainstream topics and to explaining your solutions out loud. If your target is contests, the template and routines here are the foundation to build on.'
      }
    ],

    worked: [
      {
        lc: 1011,
        restate: 'Packages sit on a conveyor in a fixed order, with given weights. A ship carries one stretch of consecutive packages per day, and its capacity is the most weight it can carry in one day. Return the smallest capacity that gets every package shipped within `days` days.',
        examples: '- `weights = [1,2,3,4,5,6,7,8,9,10]`, `days = 5` → 15 (days: 1–5, 6–7, 8, 9, 10).\n- `weights = [3,2,2,4,1,4]`, `days = 3` → 6.\n- Edge cases: one package → its weight; `days = 1` → the total; capacity can never be below the heaviest package.',
        brute: 'Try capacities 1, 2, 3, … and for each one simulate the days greedily, stopping at the first capacity that finishes in time. The simulation is O(n). The number of capacities to try is up to the total weight, which can be tens of millions: **O(n · sum)**, far too slow.',
        insight: 'Read the shape of the question: “the **smallest capacity such that** it works”. If a capacity works, any larger capacity also works, so the answer sits on a boundary between “fails” and “works”, and you can **binary search over the answer** instead of scanning it. The search range is `[max(weights), sum(weights)]`: below the heaviest package nothing fits, and the total always works in one day. The check for one candidate is a greedy pass: load packages until the next one would overflow, then start a new day. That check is O(n), and the search does log₂(sum) rounds. With n up to 5 · 10⁴ and a sum near 5 · 10⁷ that is about 26 · 50,000 ≈ 1.3 million steps, instead of 2.5 · 10¹² for the scan. The limit told you which family to use before any code existed.',
        code: {
          py: `class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        lo, hi = max(weights), sum(weights)      # the answer is in [lo, hi]
        while lo < hi:
            mid = (lo + hi) // 2
            need, load = 1, 0
            for w in weights:                    # greedy check: can capacity mid do it?
                if load + w > mid:
                    need += 1
                    load = 0
                load += w
            if need <= days:
                hi = mid                         # works: try smaller
            else:
                lo = mid + 1                     # fails: need more
        return lo`,
          js: `function shipWithinDays(weights, days) {
  let lo = Math.max(...weights), hi = weights.reduce((s, w) => s + w, 0);   // the answer is in [lo, hi]
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let need = 1, load = 0;
    for (const w of weights) {                 // greedy check: can capacity mid do it?
      if (load + w > mid) { need++; load = 0; }
      load += w;
    }
    if (need <= days) hi = mid;                // works: try smaller
    else lo = mid + 1;                         // fails: need more
  }
  return lo;
}`,
          java: `class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }   // the answer is in [lo, hi]
        while (lo < hi) {
            int mid = (lo + hi) / 2, need = 1, load = 0;
            for (int w : weights) {                // greedy check: can capacity mid do it?
                if (load + w > mid) { need++; load = 0; }
                load += w;
            }
            if (need <= days) hi = mid;            // works: try smaller
            else lo = mid + 1;                     // fails: need more
        }
        return lo;
    }
}`,
          cpp: `class Solution {
public:
    int shipWithinDays(vector<int>& weights, int days) {
        int lo = *max_element(weights.begin(), weights.end());   // the answer is in [lo, hi]
        int hi = accumulate(weights.begin(), weights.end(), 0);
        while (lo < hi) {
            int mid = (lo + hi) / 2, need = 1, load = 0;
            for (int w : weights) {                // greedy check: can capacity mid do it?
                if (load + w > mid) { need++; load = 0; }
                load += w;
            }
            if (need <= days) hi = mid;            // works: try smaller
            else lo = mid + 1;                     // fails: need more
        }
        return lo;
    }
};`
        },
        tests: { fn: 'shipWithinDays', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], out: 15 }, { args: [[3, 2, 2, 4, 1, 4], 3], out: 6 }, { args: [[1, 2, 3, 1, 1], 4], out: 3 },
          { args: [[5], 1], out: 5 }, { args: [[10, 10, 10], 1], out: 30 }, { args: [[7, 2, 5, 10, 8], 2], out: 18 }, { args: [[4, 4, 4, 4], 4], out: 4 }] },
        complexity: 'O(n log S) time where S is the sum of the weights, O(1) space. The check is a single pass; the binary search halves a range of size S.',
        say: '“The limits say n is up to 5 · 10⁴ and the weights sum to tens of millions, so scanning every capacity is too slow. But feasibility is monotonic: if capacity c works, so does c + 1. That means I can binary search the answer between the heaviest package and the total. Each probe is a greedy pass: fill a day until the next package doesn’t fit, then start a new day, and count days. If the count fits, search lower; if not, higher. That’s O(n log sum) time and O(1) space.”',
        followups: [
          { q: 'Why is the lower bound the maximum weight, not 1?', a: 'A package is never split, so any capacity below the heaviest one can’t carry it at all. Starting there also guarantees the greedy check never gets stuck on a package that doesn’t fit even in an empty ship.' },
          { q: 'Why is the greedy check correct?', a: 'Packing each day as full as possible never hurts: the order is fixed, so the only choice is where each day ends, and ending later leaves the remaining suffix no worse off. So the minimum number of days for a given capacity is the greedy count.' },
          { q: 'How would you spot this pattern in a new problem?', a: 'The wording “minimum possible largest …” or “largest value such that …”, plus a cheap yes/no check that gets easier as the candidate grows. Then the answer sits on a monotonic boundary and you can binary search it.' }
        ]
      },
      {
        lc: 204,
        restate: 'Given a non-negative integer `n`, return how many prime numbers are strictly smaller than `n`.',
        examples: '- `n = 10` → 4 (the primes 2, 3, 5, 7).\n- `n = 0` → 0 and `n = 1` → 0.\n- Edge cases: `n = 2` → 0 (2 is not less than 2); `n = 3` → 1; `n = 100` → 25.',
        brute: 'Test every number below `n` for primality by trial division up to its square root: O(n √n). For n = 5 · 10⁶ that is about 10¹⁰ steps, too slow.',
        insight: 'The limit says n is in the millions, and the question is about **every** number below n, not one number. When you need the answer for the whole range, **mark off the multiples** instead of testing each number. The sieve starts with every number marked prime, then, for each prime p, crosses out its multiples. Two refinements make it fast. Crossing out can start at **p · p**, because a smaller multiple p · k already has a smaller prime factor k and was crossed out earlier. And you only need primes p with p · p < n, since a composite below n has a prime factor at most √n. The total work is about n log log n, nearly linear: for n = 5 · 10⁶, around 10⁷ steps. Memory is one byte per number.',
        code: {
          py: `class Solution:
    def countPrimes(self, n: int) -> int:
        if n < 3:
            return 0
        sieve = bytearray([1]) * n               # sieve[i] == 1 means i is still a prime candidate
        sieve[0] = sieve[1] = 0
        for p in range(2, int(n ** 0.5) + 1):
            if sieve[p]:
                sieve[p * p::p] = bytearray(len(range(p * p, n, p)))   # cross out p*p, p*p+p, ...
        return sum(sieve)`,
          js: `function countPrimes(n) {
  if (n < 3) return 0;
  const composite = new Uint8Array(n);         // composite[i] === 1 means i has been crossed out
  let count = 0;
  for (let i = 2; i < n; i++) {
    if (composite[i]) continue;
    count++;                                   // i was never crossed out, so it is prime
    for (let j = i * i; j < n; j += i) composite[j] = 1;   // cross out i*i, i*i+i, ...
  }
  return count;
}`,
          java: `class Solution {
    public int countPrimes(int n) {
        if (n < 3) return 0;
        boolean[] composite = new boolean[n];      // composite[i] means i has been crossed out
        int count = 0;
        for (int i = 2; i < n; i++) {
            if (composite[i]) continue;
            count++;                               // i was never crossed out, so it is prime
            for (long j = (long) i * i; j < n; j += i) composite[(int) j] = true;   // long: i*i can overflow int
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int countPrimes(int n) {
        if (n < 3) return 0;
        vector<bool> composite(n, false);          // composite[i] means i has been crossed out
        int count = 0;
        for (int i = 2; i < n; i++) {
            if (composite[i]) continue;
            count++;                               // i was never crossed out, so it is prime
            for (long long j = 1LL * i * i; j < n; j += i) composite[j] = true;   // 64-bit: i*i can overflow int
        }
        return count;
    }
};`
        },
        tests: { fn: 'countPrimes', sig: { args: ['int'] }, cases: [
          { args: [10], out: 4 }, { args: [0], out: 0 }, { args: [1], out: 0 }, { args: [2], out: 0 }, { args: [3], out: 1 }, { args: [4], out: 2 },
          { args: [20], out: 8 }, { args: [100], out: 25 }, { args: [1000], out: 168 }, { args: [100000], out: 9592 }, { args: [1000000], out: 78498 }] },
        complexity: 'O(n log log n) time, O(n) space. Each prime crosses out about n / p numbers, and the sum of n / p over primes is n log log n.',
        say: '“Testing each number separately is O(n √n), too slow for n in the millions. Since I need the count for the whole range, I use the sieve of Eratosthenes: mark everything as prime, and for each unmarked i, count it and cross out its multiples starting at i · i, because smaller multiples were already hit by a smaller prime. That’s about n log log n time and one byte (or bit) per number. In Java and C++ I make the start `i * i` a long so it can’t overflow.”',
        followups: [
          { q: 'Why can the inner loop start at i * i?', a: 'Any smaller multiple i · k with k < i has the smaller factor k, so it was already crossed out when the sieve processed k’s prime factors. Starting at i · i skips that repeated work and is what makes the total near-linear.' },
          { q: 'Where is the overflow risk?', a: 'In `i * i` with a 32-bit int: for i around 50,000 the square already exceeds 2³¹. Compute it as a long, or stop the outer loop at √n. Python never overflows, but a JavaScript product stays exact up to 2⁵³.' },
          { q: 'What if you need primes up to 10⁹?', a: 'A plain sieve needs a gigabyte-scale array. Use a **segmented sieve**: sieve in blocks of a few hundred thousand numbers, reusing the primes below √n. It keeps O(√n + block) memory at the same time complexity.' }
        ]
      },
      {
        lc: 1235,
        restate: 'There are `n` jobs. Job `i` runs from `startTime[i]` to `endTime[i]` and pays `profit[i]`. You can do at most one job at a time, but a job that starts exactly when another ends is allowed. Return the largest total profit you can collect.',
        examples: '- `startTime = [1,2,3,3]`, `endTime = [3,4,5,6]`, `profit = [50,10,40,70]` → 120 (take the first and the last).\n- `startTime = [1,1,1]`, `endTime = [2,3,4]`, `profit = [5,6,4]` → 6 (they all overlap, so take the best one).\n- Edge cases: one job → its profit; jobs that only touch at an endpoint can both be taken.',
        brute: 'Try every subset of jobs and keep the best one that has no overlaps: O(2ⁿ · n). It handles n ≤ 20 and nothing more; the real limit is n up to 5 · 10⁴.',
        insight: 'The limit (n up to 5 · 10⁴) rules out anything quadratic: 2.5 · 10⁹ pairs is over budget. So aim for **O(n log n)**: one sort and a log-time lookup per job. Sort jobs by **end time** and let `best[i]` be the best profit using only jobs that finish by the i-th end time. For a job, there are two choices: skip it (the best so far stays) or take it, which adds its profit to the best result among jobs that **finish no later than its start**. That last part is a binary search over the finished end times, because they are already sorted. Keeping only the entries where the best strictly improves means `ends` and `best` are both sorted, so the search is valid. Reading the limit gave you the whole plan: sort, then binary search, then a DP over a 1-D array.',
        code: {
          py: `class Solution:
    def jobScheduling(self, startTime: List[int], endTime: List[int], profit: List[int]) -> int:
        jobs = sorted(zip(endTime, startTime, profit))      # by end time
        ends, best = [0], [0]                               # best[i]: top profit among jobs finishing by ends[i]
        for e, s, p in jobs:
            i = bisect_right(ends, s) - 1                   # last entry that finishes by this job's start
            cand = best[i] + p                              # take this job on top of that
            if cand > best[-1]:                             # keep it only if it beats the best so far
                ends.append(e)
                best.append(cand)
        return best[-1]`,
          js: `function jobScheduling(startTime, endTime, profit) {
  const order = startTime.map((_, i) => i).sort((a, b) => endTime[a] - endTime[b]);   // by end time
  const ends = [0], best = [0];                  // best[i]: top profit among jobs finishing by ends[i]
  for (const j of order) {
    let lo = 0, hi = ends.length;                // first entry that finishes AFTER this job starts
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= startTime[j]) lo = mid + 1;
      else hi = mid;
    }
    const cand = best[lo - 1] + profit[j];       // take this job on top of the entry just before
    if (cand > best[best.length - 1]) {          // keep it only if it beats the best so far
      ends.push(endTime[j]);
      best.push(cand);
    }
  }
  return best[best.length - 1];
}`,
          java: `class Solution {
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(endTime[a], endTime[b]));   // by end time
        int[] ends = new int[n + 1], best = new int[n + 1];   // best[i]: top profit among jobs finishing by ends[i]
        int size = 1;                                         // entry 0 is the empty schedule
        for (int j : order) {
            int lo = 0, hi = size;                            // first entry that finishes AFTER this job starts
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (ends[mid] <= startTime[j]) lo = mid + 1;
                else hi = mid;
            }
            int cand = best[lo - 1] + profit[j];              // take this job on top of the entry just before
            if (cand > best[size - 1]) {                      // keep it only if it beats the best so far
                ends[size] = endTime[j];
                best[size] = cand;
                size++;
            }
        }
        return best[size - 1];
    }
}`,
          cpp: `class Solution {
public:
    int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        int n = startTime.size();
        vector<int> order(n);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return endTime[a] < endTime[b]; });   // by end time
        vector<int> ends{0}, best{0};                         // best[i]: top profit among jobs finishing by ends[i]
        for (int j : order) {
            int i = upper_bound(ends.begin(), ends.end(), startTime[j]) - ends.begin() - 1;   // last entry done by this start
            int cand = best[i] + profit[j];                   // take this job on top of that
            if (cand > best.back()) {                         // keep it only if it beats the best so far
                ends.push_back(endTime[j]);
                best.push_back(cand);
            }
        }
        return best.back();
    }
};`
        },
        complexity: 'O(n log n) time (the sort, plus n binary searches), O(n) space for the two arrays.',
        say: '“The limit is about 5 · 10⁴ jobs, so a quadratic DP is too slow and I want n log n. I sort the jobs by end time. For each job I either skip it, or take it and add its profit to the best total among jobs that end by its start, which I find with a binary search since the end times are sorted. I only record a new entry when it improves the best, so the arrays stay sorted for the next search. The answer is the last best. That’s O(n log n) time and O(n) space.”',
        followups: [
          { q: 'Why sort by end time rather than start time?', a: 'Processing in order of finishing means everything the current job can follow has already been handled, and the end times form the sorted array the binary search needs. Sorting by start gives no such ordering of the “can follow” set.' },
          { q: 'What changes if jobs that touch at a boundary are not allowed to follow each other?', a: 'Search for entries with end strictly less than the start: use `bisect_left` (or `lower_bound`) instead of `bisect_right` (`upper_bound`). It is a one-character change, so confirm the rule from the statement.' },
          { q: 'How does the brute force’s 2ⁿ limit show up in the statement?', a: 'The statement allows n up to 5 · 10⁴, far above the 20 or so that a subset search could take. That gap is the signal that you need a DP and a data structure, not enumeration.' }
        ]
      },
      {
        lc: 2104,
        restate: 'The range of an array is its largest value minus its smallest. Given an integer array, return the sum of the ranges of **all** of its contiguous, non-empty subarrays.',
        examples: '- `[1,2,3]` → 4: the subarrays have ranges 0, 0, 0, 1, 1 and 2.\n- `[1,3,3]` → 4.\n- `[4,-2,-3,4,1]` → 59.\n- Edge cases: a single element → 0 (every subarray of length 1 has range 0); a constant array → 0.',
        brute: 'For each subarray, scan it for its min and max: O(n³). Keeping a running min and max while the end moves right makes each extension O(1), which gives O(n²).',
        insight: 'Read the limit before choosing: here it is **n ≤ 1,000**, so there are about 500,000 subarrays and the O(n²) loop does about a million steps. That is far inside the budget, so the running-min-and-max loop **is** the intended solution. The only real traps are numeric: the answer can reach about 5 · 10⁵ subarrays times a range near 10⁹, around 10¹⁵, so the total must be a **64-bit** integer (`long` or `long long`). If the limit had been 10⁵, the same question would need contribution counting with a monotonic stack for O(n): the limit changes the problem, not the statement.',
        code: {
          py: `class Solution:
    def subArrayRanges(self, nums: List[int]) -> int:
        n, total = len(nums), 0
        for i in range(n):
            lo = hi = nums[i]
            for j in range(i, n):              # extend the subarray by one element at a time
                lo = min(lo, nums[j])
                hi = max(hi, nums[j])
                total += hi - lo               # Python ints never overflow; other languages need 64-bit
        return total`,
          js: `function subArrayRanges(nums) {
  const n = nums.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    let lo = nums[i], hi = nums[i];
    for (let j = i; j < n; j++) {              // extend the subarray by one element at a time
      lo = Math.min(lo, nums[j]);
      hi = Math.max(hi, nums[j]);
      total += hi - lo;                        // a double stays exact up to 2^53, plenty at n <= 1000
    }
  }
  return total;
}`,
          java: `class Solution {
    public long subArrayRanges(int[] nums) {
        int n = nums.length;
        long total = 0;                        // long: the sum can pass 2^31
        for (int i = 0; i < n; i++) {
            int lo = nums[i], hi = nums[i];
            for (int j = i; j < n; j++) {      // extend the subarray by one element at a time
                lo = Math.min(lo, nums[j]);
                hi = Math.max(hi, nums[j]);
                total += (long) hi - lo;       // cast first: hi - lo can overflow int on its own
            }
        }
        return total;
    }
}`,
          cpp: `class Solution {
public:
    long long subArrayRanges(vector<int>& nums) {
        int n = nums.size();
        long long total = 0;                   // 64-bit: the sum can pass 2^31
        for (int i = 0; i < n; i++) {
            int lo = nums[i], hi = nums[i];
            for (int j = i; j < n; j++) {      // extend the subarray by one element at a time
                lo = min(lo, nums[j]);
                hi = max(hi, nums[j]);
                total += (long long)hi - lo;   // cast first: hi - lo can overflow int on its own
            }
        }
        return total;
    }
};`
        },
        complexity: 'O(n²) time, O(1) space. At n ≤ 1,000 that is about 5 · 10⁵ iterations. The O(n) version uses two monotonic stacks to count how many subarrays each element is the max or min of.',
        say: '“The limit is n up to 1,000, so an O(n²) pass over every start and end is about half a million steps: well inside the budget. I fix the start, extend the end, keep a running min and max, and add max minus min each time. The one thing to watch is the sum, which can exceed 32 bits, so I use a 64-bit accumulator. If n were 10⁵, I’d switch to counting each element’s contribution as a maximum and as a minimum with monotonic stacks, which is O(n).”',
        followups: [
          { q: 'How would you reach O(n)?', a: 'The sum of ranges equals the sum of all subarray maximums minus the sum of all subarray minimums. For each element, a monotonic stack gives how far left and right it stays the max (or min), and the element contributes value × (left choices) × (right choices). Two passes, one per direction.' },
          { q: 'Why does the choice of an O(n²) solution need justifying?', a: 'Because interviewers and judges both prefer the simplest solution that meets the stated limit. Showing that 10⁶ steps is far under budget, and naming the faster alternative, shows judgment rather than laziness.' },
          { q: 'What goes wrong if the accumulator is a 32-bit int?', a: 'With values around 10⁹ the total passes 2³¹ after a few thousand subarrays and wraps to a negative number. Python is immune; in Java, C++ and JavaScript (beyond 2⁵³) use a 64-bit type or BigInt.' }
        ]
      }
    ],

    practice: [
      { lc: 1235,
        hints: ['The limit allows about 5 · 10⁴ jobs, so pairs of jobs are too many. Think sort plus a log-time lookup.', 'Sort by end time. For each job decide: skip it, or take it on top of the best schedule that ends by its start.', 'Keep two sorted arrays: finishing times, and the best profit so far at each. A binary search on the finishing times finds the schedule to build on.'],
        starter: { py: 'class Solution:\n    def jobScheduling(self, startTime: List[int], endTime: List[int], profit: List[int]) -> int:\n        ', js: 'function jobScheduling(startTime, endTime, profit) {\n  \n}' },
        tests: { fn: 'jobScheduling', sig: { args: ['int[]', 'int[]', 'int[]'] }, cases: [
          { args: [[1, 2, 3, 3], [3, 4, 5, 6], [50, 10, 40, 70]], out: 120 }, { args: [[1, 2, 3, 4, 6], [3, 5, 10, 6, 9], [20, 20, 100, 70, 60]], out: 150 },
          { args: [[1, 1, 1], [2, 3, 4], [5, 6, 4]], out: 6 }, { args: [[5], [9], [7]], out: 7 }, { args: [[1, 3], [3, 5], [4, 4]], out: 8 },
          { args: [[3, 7, 1, 2, 9, 2], [6, 12, 2, 7, 11, 3], [6, 28, 27, 5, 16, 6]], out: 67 },
          { args: [[7, 1, 10, 2, 4, 10, 1, 10], [12, 5, 11, 4, 5, 15, 3, 13], [27, 10, 35, 8, 37, 20, 36, 44]], out: 117 },
          { args: [[2, 10, 10, 4, 6], [3, 15, 11, 9, 7], [40, 14, 32, 44, 35]], out: 116 },
          { args: [[6, 8, 10, 8, 6, 5, 4], [8, 10, 11, 13, 9, 10, 8], [22, 47, 29, 19, 39, 5, 8]], out: 98 }] } },

      { lc: 2104,
        hints: ['Check the limit: n is at most 1,000. What does that say about an O(n²) approach?', 'Fix the start of the subarray and extend the end one step at a time, keeping the minimum and maximum so far.', 'Add `max - min` at each extension. Use a 64-bit total in Java and C++: the sum can pass 2³¹.'],
        starter: { py: 'class Solution:\n    def subArrayRanges(self, nums: List[int]) -> int:\n        ', js: 'function subArrayRanges(nums) {\n  \n}' },
        tests: { fn: 'subArrayRanges', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 3]], out: 4 }, { args: [[1, 3, 3]], out: 4 }, { args: [[4, -2, -3, 4, 1]], out: 59 }, { args: [[5]], out: 0 },
          { args: [[7, 7, 7]], out: 0 }, { args: [[1000000000, -1000000000, 1000000000, -1000000000]], out: 12000000000 }] } },

      { lc: 1015,
        hints: ['Numbers made only of ones (1, 11, 111, …) get huge fast, so never build them. Work with their remainder modulo K.', 'The next number is the previous times 10 plus 1, so the next remainder is `(r * 10 + 1) % K`.', 'If K is even or ends in 5, no all-ones number is divisible (it ends in 1). Otherwise a remainder repeats within K steps, so stop after K lengths and return -1 if you never hit 0.'],
        solution: { explain: 'Track only the remainder: appending a 1 turns `x` into `10x + 1`, and the remainder follows the same rule. There are only K distinct remainders, so if 0 has not appeared in K steps it never will. O(K) time, O(1) space; building the digits would be O(K²) or worse and overflow.', code: {
          py: `class Solution:
    def smallestRepunitDivByK(self, k: int) -> int:
        r = 0
        for length in range(1, k + 1):
            r = (r * 10 + 1) % k          # append a 1, keep only the remainder
            if r == 0:
                return length
        return -1                         # K remainders seen, none was 0: it never will be`,
          js: `function smallestRepunitDivByK(k) {
  let r = 0;
  for (let length = 1; length <= k; length++) {
    r = (r * 10 + 1) % k;                 // append a 1, keep only the remainder
    if (r === 0) return length;
  }
  return -1;                              // K remainders seen, none was 0: it never will be
}` } },
        starter: { py: 'class Solution:\n    def smallestRepunitDivByK(self, k: int) -> int:\n        ', js: 'function smallestRepunitDivByK(k) {\n  \n}' },
        tests: { fn: 'smallestRepunitDivByK', cases: [
          { args: [1], out: 1 }, { args: [2], out: -1 }, { args: [3], out: 3 }, { args: [7], out: 6 }, { args: [5], out: -1 }, { args: [11], out: 2 }, { args: [13], out: 6 },
          { args: [17], out: 16 }, { args: [19], out: 18 }, { args: [23], out: 22 }, { args: [97], out: 96 }, { args: [9], out: 9 }, { args: [99991], out: 49995 }, { args: [100000], out: -1 }] } }
    ],

    mistakes: [
      '**Reading the story, skipping the limits.** The limits are the real problem statement. Write n, the value range and the time limit as a comment before anything else, then price the complexity classes against them.',
      '**Using a slow input method on large input.** A correct solution times out because `input()` in a loop (Python), a bare `Scanner` (Java), or `cin` without `sync_with_stdio(false)` (C++) cannot read 10⁶ numbers in time. Use the template and test it on a big file once, before the contest.',
      '**32-bit overflow.** Sums and products of values near 10⁹ pass 2³¹ at once. Use `long` / `long long`, and **cast before multiplying**: `(long) a * b`. The bug only appears on the large hidden tests, never on the samples.',
      '**Reducing modulo at the end only, or forgetting the negative remainder.** Reduce after every addition and multiplication. After a subtraction add the modulus back: `(a - b + MOD) % MOD`, because C++ and Java give negative remainders. Never divide under a mod; multiply by the modular inverse.',
      '**Over-engineering a small limit.** With n ≤ 100 or n ≤ 1,000, the O(n³) or O(n²) brute force is the intended answer. A clever solution costs time and bugs for nothing.',
      '**Resubmitting small tweaks.** After a rejected submission, re-read the statement and stress test against a brute force. Random patching burns penalty time and rarely finds the real bug.',
      '**Deep recursion that crashes on a long chain.** A depth of 10⁵ breaks Python’s default limit, Java’s default stack and JavaScript’s, and may break C++ on a judge with a small stack. Use an explicit stack or run in a thread with a bigger stack.',
      '**Stale state between test cases.** Global arrays, counters and visited flags carry one case’s data into the next. Reset them at the start of every case, or allocate fresh ones sized by that case’s n (not the maximum n times the number of cases).',
      '**Skipping the upsolve.** The contest is the test, the upsolve is the lesson. Without finishing the unsolved problems and logging why you missed them, rating stalls even with many contests.',
      '**Treating interview and contest style as the same.** Terse names and global variables are fine in a contest and bad in an interview. Narrate your plan and write clean code when a person is grading you.'
    ],

    quiz: [
      { kind: 'concept', q: 'A statement gives n ≤ 5 · 10⁵ with a 2-second limit. Which target complexity makes sense?',
        choices: ['O(n²)', 'O(n log n)', 'O(2ⁿ)', 'O(n³)'], answer: 1,
        explain: 'n² is 2.5 · 10¹¹ steps, hundreds of times over a one-or-two-second budget of about 10⁸ to 2 · 10⁸. n log₂ n is about 10⁷. Aim for O(n log n) or O(n): sorting, a heap, binary search or a single pass.' },
      { kind: 'concept', q: 'The statement says n ≤ 18, and asks for the best way to split a set of 18 items. What does the limit suggest?',
        choices: ['A formula in O(1)', 'Trying every subset (about 2¹⁸ ≈ 262,000), possibly with bitmask DP', 'Binary search over the answer', 'A linear scan'], answer: 1,
        explain: 'A limit near 20 exists to allow exponential work: 2¹⁸ is only about 262 thousand subsets, times a small factor. That is a classic signal for bitmask enumeration or DP over subsets.' },
      { kind: 'concept', q: 'A problem says n ≤ 10¹⁸ and asks for a count. Which is the most plausible intended complexity?',
        choices: ['O(n)', 'O(√n)', 'O(log n) or a closed formula', 'O(n log n)'], answer: 2,
        explain: 'Even √(10¹⁸) = 10⁹ is too many steps. At 10¹⁸ you cannot loop over the values at all; the answer comes from a formula, a halving process or fast exponentiation, which is O(log n).' },
      { kind: 'bug', q: 'This Java program times out on 10⁶ numbers, though the algorithm is O(n). What is the most likely cause?',
        code: `Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
long sum = 0;
for (int i = 0; i < n; i++) sum += sc.nextInt();
System.out.println(sum);`, lang: 'java',
        choices: ['`Scanner` is slow on large input; use `BufferedReader` with `StringTokenizer`', '`long` is slower than `int`', '`println` is slow for one line', 'The loop should start at 1'], answer: 0,
        explain: '`Scanner` parses with regular expressions and can take longer than the whole time limit on a million numbers. A `BufferedReader` plus `StringTokenizer` reads the same input many times faster. The `long` is correct and the output is a single line.' },
      { kind: 'bug', q: 'What is wrong with this C++ snippet that computes a product modulo 1,000,000,007 of two residues?',
        code: `int a = 999999999, b = 999999998;
int r = (a * b) % 1000000007;`, lang: 'cpp',
        choices: ['`a * b` overflows a 32-bit int before the mod is applied', 'The modulus is too large', 'It should use `/` instead of `%`', 'Nothing: it is correct'], answer: 0,
        explain: 'The product is about 10¹⁸, far past 2³¹ ≈ 2.1 · 10⁹, so the 32-bit multiplication wraps first and the mod is applied to garbage (and signed overflow is undefined behaviour). Use `long long` for the product: `(long long)a * b % MOD`.' },
      { kind: 'concept', q: 'You must output a result modulo 1,000,000,007 that involves dividing by x. What is the correct way to divide?',
        choices: ['Compute the exact quotient, then take the mod', 'Multiply by the modular inverse of x, which is x^(MOD − 2) mod MOD for a prime modulus', 'Divide the residues directly with `/`', 'Subtract the modulus until it divides'], answer: 1,
        explain: 'Modular arithmetic has no ordinary division. For a prime modulus, Fermat’s little theorem says x^(MOD−1) ≡ 1, so x^(MOD−2) is x’s inverse, and multiplying by it divides. Compute the power with fast exponentiation in O(log MOD).' },
      { kind: 'pattern', q: 'Which of these suggest **binary search on the answer**? Pick every one that applies.',
        choices: ['“Find the smallest capacity such that everything fits in D days”', '“Find the maximum value such that at least k groups can be formed”', '“Count the number of subsets with sum S” with n ≤ 20', '“Return the sum of an array”'], answer: [0, 1],
        explain: 'Both of the first two ask for an extreme value of something monotonic (a larger capacity never hurts; a smaller target never hurts) with a cheap yes/no check. The subset count is exponential enumeration or DP, and the sum is a single pass.' },
      { kind: 'concept', q: 'Why stress test a solution against a brute force on tiny random inputs?',
        choices: ['It proves the solution is correct', 'It finds a small failing input you can trace by hand', 'It makes the solution run faster', 'It replaces reading the statement'], answer: 1,
        explain: 'A random tester cannot prove correctness, but thousands of tiny cases find counterexamples fast, and a failing case of five numbers can be traced by hand. It does not replace reading the statement: a misread statement makes the brute force wrong too.' },
      { kind: 'complexity', q: 'What are the time and memory of the sparse table for range minimum queries on an array of n numbers, with q queries?',
        choices: ['O(n log n) to build, O(1) per query, O(n log n) memory', 'O(n) to build, O(log n) per query, O(n) memory', 'O(n²) to build, O(1) per query', 'O(1) to build, O(n) per query'], answer: 0,
        explain: 'There are log n rows, each of up to n entries, built from the row before in O(1) per entry. A query combines two overlapping blocks in O(1). The memory is n log n numbers. A segment tree trades this for O(n) memory and O(log n) per query, and supports updates.' },
      { kind: 'concept', q: 'You finish a contest with two unsolved problems. Which routine builds skill fastest?',
        choices: ['Read both editorials right away and move on', 'Retry each alone for a while, read only a hint if stuck, then implement it yourself and log why you missed it', 'Skip them and take the next contest', 'Copy an accepted solution and submit it'], answer: 1,
        explain: 'The learning is in the struggle plus the correction. Retrying first, using minimal hints, then writing it from a blank file and recording the missed trigger turns a failure into a reusable pattern. Reading the full solution immediately removes most of the benefit.' }
    ],

    flashcards: [
      { id: 'budget-1e8', front: 'How many simple operations fit in a one-second contest limit?', back: 'About 10⁸ in C++ or Java; about 10⁷ in pure Python. Plug the real n into n, n log n and n² and compare.' },
      { id: 'limit-table', front: 'n ≤ 20, n ≤ 5,000, n ≤ 10⁵, n ≤ 10⁶, n ≤ 10⁹: intended complexity for each?', back: 'n ≤ 20: O(2ⁿ) subsets or bitmask DP. n ≤ 5,000: O(n²). n ≤ 10⁵: O(n log n). n ≤ 10⁶: O(n). n ≤ 10⁹ or more: O(log n) or math.' },
      { id: 'small-limit', front: 'The limit is small on purpose (n ≤ 100). What should you do?', back: 'Write the simple brute force (even O(n³)) and submit. A cleverer algorithm only adds time and bugs.' },
      { id: 'cpp-io', front: 'What two lines speed up C++ input and output, and what is the trap?', back: '`ios::sync_with_stdio(false); cin.tie(nullptr);`. After that don’t mix `cin` with `scanf`. Print `\'\\n\'`, not `endl` (which flushes each line).' },
      { id: 'java-io', front: 'What replaces `Scanner` for fast Java input and output?', back: '`BufferedReader` + `StringTokenizer` for reading; `PrintWriter` (flush at the end) or one `StringBuilder` for output.' },
      { id: 'py-io', front: 'What is the fast way to read big input in Python?', back: '`sys.stdin.buffer.read().split()` for everything at once, or `sys.stdin.readline` per line. Collect output in a list and write once.' },
      { id: 'overflow', front: 'When do you need 64-bit integers, and how do you multiply safely?', back: 'Whenever a sum or product can pass about 2 · 10⁹. Cast **before** multiplying: `(long) a * b`, not `(long)(a * b)`.' },
      { id: 'mod-rules', front: 'Rules for arithmetic modulo 10⁹ + 7?', back: 'Reduce after every add and multiply. After subtracting, add the modulus back. Use 64-bit for the product. For division, multiply by the inverse x^(MOD−2).' },
      { id: 'fast-power', front: 'How does fast power compute b^e mod m in O(log e)?', back: 'Walk the bits of e: if the bit is set, multiply the result by the current base; then square the base and shift e right.' },
      { id: 'stress-test', front: 'What is the stress-testing recipe?', back: 'A trusted slow brute force, a seeded random generator of tiny inputs, and a loop that compares both and stops at the first difference. Then trace that tiny input by hand.' },
      { id: 'binary-answer', front: 'How do you recognise “binary search on the answer”?', back: 'The statement asks for the smallest or largest value that works, and if v works then every larger (or smaller) v works too. Each probe is a cheap yes/no check.' },
      { id: 'upsolve', front: 'What are the steps of upsolving?', back: 'Retry alone, read only a hint, implement from scratch, then read the editorial even for solved problems, log the key idea and the missed trigger, and redo it a week later.' },
      { id: 'sparse-table', front: 'When do you use a sparse table, and why not for sums?', back: 'Many range min, max or gcd queries on a static array: O(n log n) build, O(1) query. Overlapping blocks double-count in a sum, so use prefix sums for sums.' },
      { id: 'binary-lifting', front: 'What does binary lifting store, and what does it answer?', back: '`up[j][v]` is the 2^j-th ancestor of v. A k-step jump takes one lift per set bit of k: O(log n) per query. Also used for lowest common ancestors.' }
    ],

    deeper: [
      { title: 'Competitive Programmer’s Handbook (Antti Laaksonen)', url: 'https://cses.fi/book/book.pdf', time: 'book, read in chunks', note: 'A free, compact text that goes from input and complexity through sorting, DP, graphs and number theory. Read the first chapters on efficiency and the section on bit tricks once, then use it as a reference.' },
      { title: 'USACO Guide', url: 'https://usaco.guide/', time: 'self-paced', note: 'A structured path from bronze to platinum with problems sorted by technique and difficulty. Good if you want a ready-made curriculum for the first month and beyond.' },
      { title: 'CP-Algorithms', url: 'https://cp-algorithms.com/', time: 'reference', note: 'The standard encyclopedia of contest techniques: sparse table, binary lifting, modular arithmetic, sieves, with complexity notes and code. Look things up here after you hit them in a problem.' },
      { title: 'CSES Problem Set', url: 'https://cses.fi/problemset/', time: 'weeks', note: 'About 300 classic problems with fixed, graded tests and no editorial maze. A good first source for the practice plan, especially the introductory and sorting-and-searching sections.' }
    ],

    detective: [
      { id: 'sample-ok', decoys: ['big-o', 'binary-search', 'math'],
        statement: 'A student’s program prints the right answer for all four sample inputs in the problem statement, but the grader keeps rejecting it on a hidden test and won’t show which one. She also has a slow version she wrote first, which handles only tiny inputs but which she is certain is correct. Her coach says to stop reading the code and let the machine do the searching. Describe the plan the coach has in mind.',
        why: 'The cues are “passes the samples, fails hidden tests”, “a slow version known to be right”, and “let the machine search”. The plan is to generate many tiny random inputs, run both programs, and stop at the first disagreement, which gives a small failing case to trace by hand. That is the stress-testing routine, not a new algorithm.' },
      { id: 'slow-reading', decoys: ['big-o', 'arrays-hashing', 'language'],
        statement: 'A program adds up eight hundred thousand numbers it reads from the input. The logic is a single loop and cannot be improved, yet it runs far past the time limit on the large test, while on a small test it is instant. Someone points out that nothing is wrong with the arithmetic: the way each number is pulled in and each result is pushed out is what costs the time. What should change?',
        why: 'The loop is already linear, so the cost is in the input and output calls: one slow call per number adds up over hundreds of thousands. The fix is to read everything in bulk (a buffered reader, one big read, or turning off the stream synchronization) and write once. That is fast input and output, which is the first thing to set up in any contest solution.' },
      { id: 'limit-18', decoys: ['bitmask-dp', 'recursion', 'backtracking'],
        statement: 'A festival lists eighteen stalls and wants to know which subset to open for the best total score under a rule that couples every pair of chosen stalls. A junior developer starts designing something clever with sorting and a priority queue. The organizer says the real hint was in the first line of the rules, which promises there will never be more than eighteen stalls and a two-second time limit. How should the developer have decided what approach to use, before writing anything?',
        why: 'The hint is the limit itself: with at most eighteen items, trying every subset costs about two to the eighteenth, roughly a quarter of a million, which fits easily. A big input limit would have ruled that out and called for something near-linear. Reading the limit and the time to choose the complexity class before designing anything is the skill this topic teaches.' }
    ]
  });
})();
