/* Offer Ready: Bit manipulation. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'bits',

    hook: 'Bit tricks are a small topic with an outsized reputation: a handful of one-liners (`n & (n - 1)`, `x ^ x = 0`, `n & -n`) turn problems that look like they need a hash map or a loop into **O(1) space and a few lines**. Single Number, Number of 1 Bits, Counting Bits, Missing Number and Sum of Two Integers all sit in NeetCode 150, and interviewers also use them to check that you understand how numbers are really stored, including negatives and overflow.',

    cues: [
      'The statement says **without using** `+`, `-`, extra memory, or a hash map, or asks for **constant extra space** on a “find the odd one out” question.',
      'Every value appears **twice (or three times)** except one: XOR cancels pairs, and a per-bit count mod 3 cancels triples.',
      'The question is about the **binary form**: how many 1 bits, reverse the bits, the highest or lowest set bit, is it a power of two.',
      'A **set of at most ~20 things** where each thing is in or out: a bitmask stores the whole subset in one integer, and counting from 0 to `2ⁿ − 1` visits every subset.',
      'You need a **flag array that fits in a word**: seen digits, visited cities, taken letters. One integer replaces a boolean array.',
      'Answers “count the 1s for every number up to n”: the answer for `i` is the answer for a smaller number plus one bit, a tiny DP.'
    ],

    intuition: [
      'A number is just a row of switches. Bit 0 is worth 1, bit 1 is worth 2, bit 2 is worth 4, and so on, so `13` is `1101`: 8 + 4 + 1. Every bit trick is an operation on that row of switches, done on **all the switches at once** by a single CPU instruction.',
      'The operators in one line each: `&` (AND) keeps a 1 only where **both** have it, so it *tests and clears*. `|` (OR) keeps a 1 where **either** has it, so it *sets*. `^` (XOR) keeps a 1 where they **differ**, so it *toggles* and *compares*. `~` flips every switch. `<<` slides the row left (×2 each step) and `>>` slides it right (÷2 each step). A **mask** is a number with 1s exactly at the switches you care about: `x & mask` reads them, `x | mask` sets them, `x & ~mask` clears them, `x ^ mask` flips them.',
      '**Three facts carry most interview problems.** First, `x ^ x = 0` and `x ^ 0 = x`, and XOR is order-free, so XOR-ing a list cancels every pair and leaves the loner. Second, `n - 1` flips the lowest set bit to 0 and every 0 below it to 1, so `n & (n - 1)` **erases the lowest set bit**: loop until it hits 0 and you have counted the 1s (Brian Kernighan’s trick), and `n & (n - 1) == 0` says “at most one bit”, which is a power of two. Third, `-n` is `~n + 1`, which makes `n & -n` the **lowest set bit alone**.',
      'Negatives use **two’s complement**: to get `-n`, flip every bit of `n` and add 1. In 8 bits, `-1` is `11111111`, `-8` is `11111000`, and the top bit has weight `-128` instead of `+128`. That is why `~x` equals `-x - 1`, and why a right shift of a negative number has two flavours: **arithmetic** (`>>`, copy the sign bit in) and **logical** (`>>>`, shove zeros in). Open the visualizer, set A to −8 (try the preset) and compare `>>` with `>>>`.',
      'Precisely: an `n`-bit unsigned integer is `Σ bᵢ·2ⁱ`; a signed one is the same except bit `n − 1` has weight `−2ⁿ⁻¹`. Languages differ in how wide the number is (Python: unbounded, JavaScript: 32 bits for bit operators, Java and C++: 32 or 64), and that difference is where most of the real bugs live.'
    ].join('\n\n'),

    viz: 'bits',

    template: {
      title: 'Two workhorses: Kernighan popcount (n & (n-1)) and the XOR fold',
      note: 'The first function **erases the lowest set bit each round**, so it loops once per set bit instead of once per position. The same line, `n & (n - 1)`, answers “is this a power of two?” (`== 0` afterwards for `n > 0`) and powers Counting Bits and Bitwise AND of Range. The second function XORs everything together: pairs cancel, the loner remains. The visualizer’s popcount and XOR modes walk exactly these lines. **Language note:** the Python version masks to 32 bits so a negative number terminates (Python ints are unbounded); JavaScript uses `>>> 0`, and C++ copies into `unsigned` so `n - 1` can never be signed overflow.',
      code: {
        py: `def popcount(n):
    n &= 0xFFFFFFFF                           #> Python ints never run out of bits: mask to 32 so a negative n terminates
    count = 0
    while n:                                  #@loop > 1. Any set bit left? Then there is one more round
        n &= n - 1                            #@clear > 2. n - 1 flips the lowest 1 and the zeros below it, so AND erases exactly that bit
        count += 1                            #@count > 3. One bit erased, one counted
    return count

def single_number(nums):
    x = 0                                     #> x ^ 0 = x, so 0 is the do-nothing start
    for v in nums:                            #@xloop > 1. Take the next number
        x ^= v                                #@fold > 2. Equal numbers cancel (v ^ v = 0), whatever the order
    return x`,
        js: `function popcount(n) {
  n >>>= 0;                                          //> JS bit operators work on 32 bits; >>> 0 views n as unsigned
  let count = 0;
  while (n !== 0) {                                  //@loop > 1. Any set bit left? Then there is one more round
    n &= n - 1;                                      //@clear > 2. n - 1 flips the lowest 1 and the zeros below it, so AND erases exactly that bit
    count++;                                         //@count > 3. One bit erased, one counted
  }
  return count;
}

function singleNumber(nums) {
  let x = 0;                                         //> x ^ 0 = x, so 0 is the do-nothing start
  for (const v of nums) {                            //@xloop > 1. Take the next number
    x ^= v;                                          //@fold > 2. Equal numbers cancel (v ^ v = 0), whatever the order
  }
  return x;
}`,
        java: `class Solution {
    public int popcount(int n) {
        int count = 0;
        while (n != 0) {                             //@loop > 1. Any set bit left? Then there is one more round
            n &= n - 1;                              //@clear > 2. n - 1 flips the lowest 1 and the zeros below it, so AND erases exactly that bit
            count++;                                 //@count > 3. One bit erased, one counted
        }
        return count;
    }

    public int singleNumber(int[] nums) {
        int x = 0;                                   //> x ^ 0 = x, so 0 is the do-nothing start
        for (int v : nums) {                         //@xloop > 1. Take the next number
            x ^= v;                                  //@fold > 2. Equal numbers cancel (v ^ v = 0), whatever the order
        }
        return x;
    }
}`,
        cpp: `class Solution {
public:
    int popcount(int n) {
        unsigned u = (unsigned)n;                    //> unsigned: no signed-overflow UB, and a negative n is just its 32-bit pattern
        int count = 0;
        while (u != 0) {                             //@loop > 1. Any set bit left? Then there is one more round
            u &= u - 1;                              //@clear > 2. u - 1 flips the lowest 1 and the zeros below it, so AND erases exactly that bit
            count++;                                 //@count > 3. One bit erased, one counted
        }
        return count;
    }

    int singleNumber(vector<int>& nums) {
        int x = 0;                                   //> x ^ 0 = x, so 0 is the do-nothing start
        for (int v : nums) {                         //@xloop > 1. Take the next number
            x ^= v;                                  //@fold > 2. Equal numbers cancel (v ^ v = 0), whatever the order
        }
        return x;
    }
};`
      },
      tests: { fn: { py: 'popcount', default: 'popcount' }, sig: { args: ['int'] }, cases: [
        { args: [11], out: 3 }, { args: [0], out: 0 }, { args: [128], out: 1 }, { args: [255], out: 8 }, { args: [-1], out: 32 }, { args: [-8], out: 29 }, { args: [2147483647], out: 31 }] }
    },

    complexity: {
      time: 'O(1) per operation; popcount O(k) for k set bits (at most the word size)',
      space: 'O(1)',
      why: 'Every bitwise operator is a single machine instruction on a whole word, so `n & (n - 1)` costs the same whether the number has 3 bits or 30. Kernighan’s loop runs once per **set** bit (at most 32 or 64), which is why people call it O(1) for fixed-width integers and O(log n) in general. XOR over a list is one pass: O(n) time, O(1) space, which beats the hash-set answer’s O(n) space.',
      trap: 'Bit width is a hidden input. Python’s integers are unbounded, so “O(1)” becomes O(log n) for huge numbers, and a loop like `while n: n &= n - 1` never ends on a **negative** Python int (it stays negative forever). Always say how wide the numbers are, and in Python mask with `& 0xFFFFFFFF` whenever the problem is defined on 32-bit patterns.'
    },

    variations: [
      {
        name: 'Test, set, clear and toggle one bit',
        body: 'The four moves behind every mask problem, for bit position `i` (0 is the lowest): **test** `(n >> i) & 1`, **set** `n | (1 << i)`, **clear** `n & ~(1 << i)`, **toggle** `n ^ (1 << i)`. `1 << i` builds a mask with a single 1 at position `i`. Read them as “AND to look or erase, OR to turn on, XOR to flip”. Keep the mask on the **right** of the shift (`1 << i`, not `i << 1`), and in Java and C++ remember `1` is a 32-bit `int`, so use `1L << i` or `1LL << i` for positions 32 and above.',
        code: {
          py: `def bit_ops(n, i):
    mask = 1 << i
    return [(n >> i) & 1, n | mask, n & ~mask, n ^ mask]   # test, set, clear, toggle`,
          js: `function bitOps(n, i) {
  const mask = 1 << i;
  return [(n >> i) & 1, n | mask, n & ~mask, n ^ mask];   // test, set, clear, toggle
}`,
          java: `class Solution {
    public int[] bitOps(int n, int i) {
        int mask = 1 << i;
        return new int[]{(n >> i) & 1, n | mask, n & ~mask, n ^ mask};   // test, set, clear, toggle
    }
}`,
          cpp: `class Solution {
public:
    vector<int> bitOps(int n, int i) {
        int mask = 1 << i;
        return vector<int>{(n >> i) & 1, n | mask, n & ~mask, n ^ mask};   // test, set, clear, toggle
    }
};`
        },
        tests: { fn: { py: 'bit_ops', default: 'bitOps' }, sig: { args: ['int', 'int'] }, cases: [
          { args: [13, 1], out: [0, 15, 13, 15] }, { args: [13, 0], out: [1, 13, 12, 12] }, { args: [0, 5], out: [0, 32, 0, 32] }, { args: [255, 7], out: [1, 255, 127, 127] }, { args: [8, 3], out: [1, 8, 0, 0] }] }
      },
      {
        name: 'Lowest set bit and the power-of-two test',
        body: '`n & -n` isolates the lowest set bit, because `-n = ~n + 1`: below that bit both sides are 0, at it both are 1, above it they are opposites. `n & (n - 1)` erases that bit instead. A power of two has **exactly one** set bit, so `n > 0 and n & (n - 1) == 0`. Do not forget `n > 0`: zero also satisfies `n & (n - 1) == 0`. The lowest-set-bit trick is also how a Fenwick tree jumps between nodes.',
        code: {
          py: `def lowbit_info(n):
    low = n & -n                                    # lowest set bit alone
    is_pow2 = 1 if n > 0 and n & (n - 1) == 0 else 0
    return [low, is_pow2]`,
          js: `function lowbitInfo(n) {
  const low = n & -n;                               // lowest set bit alone
  const isPow2 = n > 0 && (n & (n - 1)) === 0 ? 1 : 0;
  return [low, isPow2];
}`,
          java: `class Solution {
    public int[] lowbitInfo(int n) {
        int low = n & -n;                           // lowest set bit alone
        int isPow2 = n > 0 && (n & (n - 1)) == 0 ? 1 : 0;
        return new int[]{low, isPow2};
    }
}`,
          cpp: `class Solution {
public:
    vector<int> lowbitInfo(int n) {
        int low = n & -n;                           // lowest set bit alone
        int isPow2 = n > 0 && (n & (n - 1)) == 0 ? 1 : 0;
        return vector<int>{low, isPow2};
    }
};`
        },
        tests: { fn: { py: 'lowbit_info', default: 'lowbitInfo' }, sig: { args: ['int'] }, cases: [
          { args: [12], out: [4, 0] }, { args: [16], out: [16, 1] }, { args: [1], out: [1, 1] }, { args: [0], out: [0, 0] }, { args: [96], out: [32, 0] }, { args: [-12], out: [4, 0] }] }
      },
      {
        name: 'Swap with XOR (and why you rarely should)',
        body: 'Three XORs swap two integers with no temporary: `a ^= b; b ^= a; a ^= b`. After the first, `a` holds `a ^ b`; the second makes `b = b ^ a ^ b = a`; the third makes `a = a ^ b ^ a = b`. It is a classic quiz question and a poor production habit: it is not faster, and if both names refer to the **same** memory location it zeroes the value. Know it, say so, and use a normal swap in real code.',
        code: {
          py: `def swap_xor(a, b):
    a ^= b            # a = a ^ b
    b ^= a            # b = original a
    a ^= b            # a = original b
    return [a, b]`,
          js: `function swapXor(a, b) {
  a ^= b;             // a = a ^ b
  b ^= a;             // b = original a
  a ^= b;             // a = original b
  return [a, b];
}`,
          java: `class Solution {
    public int[] swapXor(int a, int b) {
        a ^= b;             // a = a ^ b
        b ^= a;             // b = original a
        a ^= b;             // a = original b
        return new int[]{a, b};
    }
}`,
          cpp: `class Solution {
public:
    vector<int> swapXor(int a, int b) {
        a ^= b;             // a = a ^ b
        b ^= a;             // b = original a
        a ^= b;             // a = original b
        return vector<int>{a, b};
    }
};`
        },
        tests: { fn: { py: 'swap_xor', default: 'swapXor' }, sig: { args: ['int', 'int'] }, cases: [
          { args: [3, 9], out: [9, 3] }, { args: [5, 5], out: [5, 5] }, { args: [0, 7], out: [7, 0] }, { args: [-4, 6], out: [6, -4] }] }
      },
      {
        name: 'Missing number: XOR the indices against the values',
        body: 'The list holds `0..n` with one value gone. XOR every index `0..n` together with every value in the list: each present number shows up twice (once as an index, once as a value) and cancels, so the missing one is left. It beats the sum formula `n(n+1)/2 − sum` on one point: it **cannot overflow**, because XOR never grows. Both are O(n) time and O(1) space, so mention both.',
        code: {
          py: `def missing_number(nums):
    x = len(nums)                       # the index n has no matching slot, so start with it
    for i, v in enumerate(nums):
        x ^= i ^ v
    return x`,
          js: `function missingNumber(nums) {
  let x = nums.length;                  // the index n has no matching slot, so start with it
  for (let i = 0; i < nums.length; i++) x ^= i ^ nums[i];
  return x;
}`,
          java: `class Solution {
    public int missingNumber(int[] nums) {
        int x = nums.length;                  // the index n has no matching slot, so start with it
        for (int i = 0; i < nums.length; i++) x ^= i ^ nums[i];
        return x;
    }
}`,
          cpp: `class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int x = (int)nums.size();             // the index n has no matching slot, so start with it
        for (int i = 0; i < (int)nums.size(); i++) x ^= i ^ nums[i];
        return x;
    }
};`
        },
        tests: { fn: { py: 'missing_number', default: 'missingNumber' }, sig: { args: ['int[]'] }, cases: [
          { args: [[3, 0, 1]], out: 2 }, { args: [[0, 1]], out: 2 }, { args: [[1]], out: 0 }, { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], out: 8 }, { args: [[0]], out: 1 }] }
      },
      {
        name: 'Reading a signed value from a bit pattern',
        body: 'Two’s complement in one formula: in `w` bits the top bit has weight `−2^(w−1)`. So if the top bit is set, the signed value is `pattern − 2^w`; otherwise it is the pattern itself. Check: 8 bits, pattern `11111000` = 248, and `248 − 256 = −8`. The reverse direction (value to pattern) is `x & ((1 << w) − 1)`. In Python this is how you *simulate* fixed width, since its ints never overflow on their own.',
        code: {
          py: `def from_pattern(p, w):
    if (p >> (w - 1)) & 1:          # top bit set: it weighs -2^(w-1)
        return p - (1 << w)
    return p`,
          js: `function fromPattern(p, w) {
  if ((p >> (w - 1)) & 1) return p - (1 << w);   // top bit set: it weighs -2^(w-1)
  return p;
}`,
          java: `class Solution {
    public int fromPattern(int p, int w) {
        if (((p >> (w - 1)) & 1) == 1) return p - (1 << w);   // top bit set: it weighs -2^(w-1)
        return p;
    }
}`,
          cpp: `class Solution {
public:
    int fromPattern(int p, int w) {
        if ((p >> (w - 1)) & 1) return p - (1 << w);   // top bit set: it weighs -2^(w-1)
        return p;
    }
};`
        },
        tests: { fn: { py: 'from_pattern', default: 'fromPattern' }, sig: { args: ['int', 'int'] }, cases: [
          { args: [248, 8], out: -8 }, { args: [127, 8], out: 127 }, { args: [128, 8], out: -128 }, { args: [255, 8], out: -1 }, { args: [5, 3], out: -3 }, { args: [3, 3], out: 3 }] }
      },
      {
        name: 'Logical right shift (>>>) for 32-bit patterns',
        body: 'Signed `>>` copies the sign bit into the gap, so a negative number stays negative. **Logical** `>>>` fills with zeros. Java and JavaScript have `>>>`; C++ has no such operator, so cast to `unsigned` first; Python has neither, so mask to 32 bits first. This is the shift you want whenever the number is a bag of bits rather than a quantity, as in Reverse Bits and hash mixing. (Note `x >>> 0` in JavaScript yields an unsigned value up to 4294967295, which is why shifts by 0 look different there.)',
        code: {
          py: `def shr_logical(n, k):
    return (n & 0xFFFFFFFF) >> k    # mask first: Python has no >>>`,
          js: `function shrLogical(n, k) {
  return n >>> k;                   // zero-fill right shift (k >= 1 keeps the result in int range)
}`,
          java: `class Solution {
    public int shrLogical(int n, int k) {
        return n >>> k;             // zero-fill; plain >> would copy the sign bit
    }
}`,
          cpp: `class Solution {
public:
    int shrLogical(int n, int k) {
        return (int)((unsigned)n >> k);   // unsigned >> is logical; signed >> is implementation-defined before C++20
    }
};`
        },
        tests: { fn: { py: 'shr_logical', default: 'shrLogical' }, sig: { args: ['int', 'int'] }, cases: [
          { args: [-1, 1], out: 2147483647 }, { args: [-8, 28], out: 15 }, { args: [16, 2], out: 4 }, { args: [1, 1], out: 0 }, { args: [-2, 31], out: 1 }] }
      },
      {
        name: 'Enumerate every subset with a bitmask',
        body: 'With `n` items (n up to about 20), the integers `0 .. 2ⁿ − 1` are in one-to-one correspondence with the subsets: bit `i` of the mask says whether item `i` is in. So a plain `for` loop over masks visits **every subset exactly once**, with no recursion. Inside, test bit `i` with `(mask >> i) & 1`. Cost: O(2ⁿ · n). This representation is also what bitmask DP builds on, where the mask is a DP state.',
        code: {
          py: `def subset_sums(nums):
    n = len(nums)
    out = []
    for mask in range(1 << n):                 # every subset, once
        total = 0
        for i in range(n):
            if (mask >> i) & 1:                # is item i in this subset?
                total += nums[i]
        out.append(total)
    return out`,
          js: `function subsetSums(nums) {
  const n = nums.length, out = [];
  for (let mask = 0; mask < (1 << n); mask++) {   // every subset, once
    let total = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) total += nums[i];      // is item i in this subset?
    }
    out.push(total);
  }
  return out;
}`,
          java: `class Solution {
    public List<Integer> subsetSums(int[] nums) {
        int n = nums.length;
        List<Integer> out = new ArrayList<>();
        for (int mask = 0; mask < (1 << n); mask++) {   // every subset, once
            int total = 0;
            for (int i = 0; i < n; i++) {
                if (((mask >> i) & 1) == 1) total += nums[i];   // is item i in this subset?
            }
            out.add(total);
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> subsetSums(vector<int>& nums) {
        int n = nums.size();
        vector<int> out;
        for (int mask = 0; mask < (1 << n); mask++) {   // every subset, once
            int total = 0;
            for (int i = 0; i < n; i++) {
                if ((mask >> i) & 1) total += nums[i];  // is item i in this subset?
            }
            out.push_back(total);
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'subset_sums', default: 'subsetSums' }, sig: { args: ['int[]'] }, cases: [
          { args: [[1, 2, 4]], out: [0, 1, 2, 3, 4, 5, 6, 7] }, { args: [[3, 5]], out: [0, 3, 5, 8] }, { args: [[]], out: [0] }, { args: [[7]], out: [0, 7] }] }
      },
      {
        name: 'Enumerate the submasks of a mask',
        body: 'To visit only the subsets **of a given set** (the 1 bits of `mask`), step with `sub = (sub - 1) & mask`. Subtracting 1 flips the lowest set bit and everything below; AND-ing with `mask` throws away the bits that are not allowed, landing on the next smaller submask. Start at `sub = mask` and stop after handling 0. Over all masks of `n` bits, this costs 3ⁿ in total, which is why “iterate over submasks of submasks” DP is feasible up to `n ≈ 16`.',
        code: {
          py: `def submasks(mask):
    out = []
    sub = mask
    while True:
        out.append(sub)
        if sub == 0:
            break
        sub = (sub - 1) & mask         # next smaller submask
    return out`,
          js: `function submasks(mask) {
  const out = [];
  let sub = mask;
  while (true) {
    out.push(sub);
    if (sub === 0) break;
    sub = (sub - 1) & mask;            // next smaller submask
  }
  return out;
}`,
          java: `class Solution {
    public List<Integer> submasks(int mask) {
        List<Integer> out = new ArrayList<>();
        int sub = mask;
        while (true) {
            out.add(sub);
            if (sub == 0) break;
            sub = (sub - 1) & mask;    // next smaller submask
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> submasks(int mask) {
        vector<int> out;
        int sub = mask;
        while (true) {
            out.push_back(sub);
            if (sub == 0) break;
            sub = (sub - 1) & mask;    // next smaller submask
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'submasks', default: 'submasks' }, sig: { args: ['int'] }, cases: [
          { args: [5], out: [5, 4, 1, 0] }, { args: [0], out: [0] }, { args: [7], out: [7, 6, 5, 4, 3, 2, 1, 0] }, { args: [10], out: [10, 8, 2, 0] }] }
      }
    ],

    worked: [
      {
        lc: 136,
        restate: 'A list of integers has the property that every value appears exactly twice, except one value that appears once. Return the one that appears once, using one pass and constant extra memory.',
        examples: '- `[2, 2, 1]` → 1.\n- `[4, 1, 2, 1, 2]` → 4.\n- `[7]` → 7: a single element is its own answer.\n- Negatives work too: `[-3, 5, 5]` → −3.',
        brute: 'Count every value in a hash map and return the one with count 1: O(n) time but O(n) space. Sorting and comparing neighbours is O(n log n) time with the sort’s memory. Both break the “constant memory, one pass” ask.',
        insight: 'Think about what XOR does to a number met twice: `v ^ v = 0`, and `x ^ 0 = x`. XOR is also **commutative and associative**, so the order the numbers arrive in does not matter, and a pair can be cancelled even if its two halves are far apart. XOR the whole list into one variable: every pair collapses to 0 and only the loner survives. The state is a single machine word, which is exactly the constant space the problem wants.',
        code: {
          py: `class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        x = 0
        for v in nums:
            x ^= v              # pairs cancel, the loner remains
        return x`,
          js: `function singleNumber(nums) {
  let x = 0;
  for (const v of nums) {
    x ^= v;                     // pairs cancel, the loner remains
  }
  return x;
}`,
          java: `class Solution {
    public int singleNumber(int[] nums) {
        int x = 0;
        for (int v : nums) {
            x ^= v;             // pairs cancel, the loner remains
        }
        return x;
    }
}`,
          cpp: `class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int x = 0;
        for (int v : nums) {
            x ^= v;             // pairs cancel, the loner remains
        }
        return x;
    }
};`
        },
        complexity: 'O(n) time, O(1) space.',
        say: '“XOR is its own inverse: `v ^ v` is 0 and `x ^ 0` is `x`. It is also order-independent, so I XOR everything into one variable. Every pair cancels, and what remains is the value that appears once. One pass, one integer of memory. A hash map would also work, but it uses O(n) space.”',
        followups: [
          { q: 'What if every number appears three times except one?', a: 'XOR no longer cancels triples. Count, for each of the 32 bit positions, how many numbers have that bit set; `count % 3` is that bit of the answer (see 137). Or keep two accumulators, `ones` and `twos`, as a base-3 counter per bit.' },
          { q: 'What if two numbers appear once and the rest appear twice?', a: 'XOR everything to get `a ^ b`, which is non-zero. Pick any set bit in it (the lowest, with `x & -x`): `a` and `b` differ there. Split the list by that bit and XOR each half separately; each half has one loner.' },
          { q: 'Does this work for negative numbers?', a: 'Yes. XOR works bit by bit on the stored pattern, and `v ^ v = 0` holds for any pattern.' },
          { q: 'Why not just use a set?', a: 'A set solves it too, but costs O(n) memory. The point of the question is whether you spot the algebraic cancellation.' }
        ]
      },
      {
        lc: 191,
        restate: 'Given a 32-bit unsigned integer (passed as a bit pattern), return how many of its bits are 1.',
        examples: '- `11` (binary `1011`) → 3.\n- `128` (`10000000`) → 1.\n- `0` → 0.\n- All 32 bits set (the pattern for −1 when read as signed) → 32.',
        brute: 'Loop 32 times, test the lowest bit with `n & 1`, count it, shift right by one. That is O(32) and perfectly fine. The catch is the shift: with a signed `>>` on a negative number, the sign bit keeps being copied in and the loop can run forever, so you need `>>>` or a fixed 32-iteration count.',
        insight: 'Skip the zeros. `n - 1` flips the lowest set bit to 0 and turns every 0 below it into 1, and leaves everything above untouched. So `n & (n - 1)` is `n` with its **lowest set bit erased**. Repeat until `n` is 0, counting the rounds: the number of rounds is exactly the number of 1 bits. This is **Brian Kernighan’s algorithm**. It also dodges the shift gotchas, because it never shifts. In Python, mask to 32 bits first, since a negative int never reaches 0.',
        code: {
          py: `class Solution:
    def hammingWeight(self, n: int) -> int:
        n &= 0xFFFFFFFF         # Python ints are unbounded: view n as 32 bits
        count = 0
        while n:
            n &= n - 1          # erase the lowest set bit
            count += 1
        return count`,
          js: `function hammingWeight(n) {
  n >>>= 0;                     // view n as an unsigned 32-bit value
  let count = 0;
  while (n !== 0) {
    n &= n - 1;                 // erase the lowest set bit
    count++;
  }
  return count;
}`,
          java: `class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            n &= n - 1;         // erase the lowest set bit
            count++;
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int hammingWeight(int n) {
        unsigned u = (unsigned)n;   // unsigned: no signed-overflow UB
        int count = 0;
        while (u != 0) {
            u &= u - 1;             // erase the lowest set bit
            count++;
        }
        return count;
    }
};`
        },
        complexity: 'O(k) time for k set bits (at most 32), O(1) space.',
        say: '“`n & (n - 1)` clears the lowest set bit, because subtracting 1 flips that bit and all the zeros beneath it. So I loop while `n` is non-zero, clearing one bit and counting it each time; the loop runs once per set bit. In Python I mask to 32 bits first so a negative input terminates, and in C++ I use unsigned so `n - 1` cannot overflow.”',
        followups: [
          { q: 'What if you call this function millions of times?', a: 'Precompute a table of popcounts for every byte (256 entries) and add four lookups, or use the hardware instruction (`Integer.bitCount`, `__builtin_popcount`, `int.bit_count()` in Python 3.10+).' },
          { q: 'Why not shift right and test the low bit?', a: 'It works, but runs 32 iterations regardless, and it needs a zero-filling shift (`>>>`) to be safe for negatives.' },
          { q: 'How do you know a number is a power of two with this?', a: '`n > 0 and n & (n - 1) == 0`: exactly one set bit means erasing it leaves 0.' },
          { q: 'How would you count set bits in two integers’ XOR?', a: 'That is the Hamming distance: popcount of `a ^ b`, since XOR is 1 exactly where bits differ.' }
        ]
      },
      {
        lc: 338,
        restate: 'Given a non-negative integer `n`, return a list of length `n + 1` whose entry at index `i` is the number of 1 bits in `i`.',
        examples: '- `n = 2` → `[0, 1, 1]`.\n- `n = 5` → `[0, 1, 1, 2, 1, 2]`.\n- `n = 0` → `[0]`.\n- Look at 6 = `110` and 3 = `11`: same bits shifted, same count.',
        brute: 'Call a popcount routine for each `i` from 0 to `n`: O(n · k) where k is the number of bits (about log n). It is correct and often accepted, but it recomputes the same low bits again and again.',
        insight: 'Reuse smaller answers. Drop the lowest bit of `i` with `i >> 1` and you get a smaller number whose 1-count you already stored; the number of 1s in `i` is that count, **plus 1 if the dropped bit was 1**. So `dp[i] = dp[i >> 1] + (i & 1)`, with `dp[0] = 0`. Every cell is O(1), so the whole list is O(n). (An equivalent form uses the Kernighan step: `dp[i] = dp[i & (i - 1)] + 1`, “the number with my lowest bit erased, plus that bit”.)',
        code: {
          py: `class Solution:
    def countBits(self, n: int) -> List[int]:
        dp = [0] * (n + 1)
        for i in range(1, n + 1):
            dp[i] = dp[i >> 1] + (i & 1)    # same bits shifted down, plus the dropped bit
        return dp`,
          js: `function countBits(n) {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i >> 1] + (i & 1);           // same bits shifted down, plus the dropped bit
  }
  return dp;
}`,
          java: `class Solution {
    public int[] countBits(int n) {
        int[] dp = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            dp[i] = dp[i >> 1] + (i & 1);   // same bits shifted down, plus the dropped bit
        }
        return dp;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> dp(n + 1, 0);
        for (int i = 1; i <= n; i++) {
            dp[i] = dp[i >> 1] + (i & 1);   // same bits shifted down, plus the dropped bit
        }
        return dp;
    }
};`
        },
        complexity: 'O(n) time, O(n) space (the output itself).',
        say: '“The popcount of `i` equals the popcount of `i >> 1`, which is already computed, plus the lowest bit of `i`. So `dp[i] = dp[i >> 1] + (i & 1)` with `dp[0] = 0`, filled left to right. That is O(1) per entry, so O(n) total, instead of O(n log n) with a popcount per number.”',
        followups: [
          { q: 'Can you derive it a different way?', a: '`dp[i] = dp[i & (i - 1)] + 1`: erase the lowest set bit to get a smaller number, then add back that one bit. Same cost.' },
          { q: 'Is the output space allowed to count?', a: 'The output is required, so the extra space beyond the answer is O(1).' },
          { q: 'Why is `i >> 1` always already computed?', a: 'For `i ≥ 1`, `i >> 1` is strictly smaller than `i`, and we fill the array in increasing order.' },
          { q: 'What pattern is hiding in the output?', a: 'Each block from `2^k` to `2^(k+1) − 1` is the previous block plus 1, because those numbers have one extra high bit.' }
        ]
      },
      {
        lc: 371,
        restate: 'Add two integers without using the `+` or `-` operators.',
        examples: '- `1, 2` → 3.\n- `2, 3` → 5.\n- `-1, 1` → 0.\n- `-2, -3` → −5: negatives must work too.',
        brute: 'Loop `b` times doing increments: you cannot increment without `+`, and the loop is O(value) anyway. Another idea is to add bit by bit with a carry variable, which is the right instinct but needs a cleaner formulation.',
        insight: 'Do what a grade-school adder does, but on bits, in parallel. Adding two bits without carry is **XOR** (1+0, 0+1 give 1; 1+1 gives 0). The carry appears only where **both** bits are 1, and it belongs one position to the left: `(a & b) << 1`. So `a + b = (a ^ b) + ((a & b) << 1)`. That is the same problem again, but the carry part keeps moving left and eventually falls off the top, so repeat until the carry is 0. Two’s complement makes negatives just work in a fixed-width language. In **Python** the ints are unbounded, so mask every step to 32 bits and convert back at the end.',
        code: {
          py: `class Solution:
    def getSum(self, a: int, b: int) -> int:
        MASK = 0xFFFFFFFF
        while b != 0:
            a, b = (a ^ b) & MASK, ((a & b) << 1) & MASK   # sum without carry, carry moved left
        return a if a <= 0x7FFFFFFF else ~(a ^ MASK)        # back to a signed value`,
          js: `function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;     // where both are 1, one place to the left
    a ^= b;                         // sum without carry
    b = carry;
  }
  return a;
}`,
          java: `class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;   // where both are 1, one place to the left
            a ^= b;                     // sum without carry
            b = carry;
        }
        return a;
    }
}`,
          cpp: `class Solution {
public:
    int getSum(int a, int b) {
        unsigned x = (unsigned)a, y = (unsigned)b;   // unsigned: shifting into the sign bit is safe
        while (y != 0) {
            unsigned carry = (x & y) << 1;           // where both are 1, one place to the left
            x ^= y;                                  // sum without carry
            y = carry;
        }
        return (int)x;
    }
};`
        },
        complexity: 'O(1): at most 32 rounds, because the carry moves up one position each time and falls off the top. O(1) space.',
        say: '“XOR adds two bits without the carry, and AND shifted left gives the carry. So `a + b` equals `(a ^ b) + ((a & b) << 1)`. I repeat that until the carry is zero; it takes at most 32 rounds because each carry moves one place left. Fixed-width two’s complement handles negatives. In Python I mask to 32 bits each round and convert back at the end, since its ints never overflow.”',
        followups: [
          { q: 'Why does it terminate?', a: 'The carry is shifted left each round, so its lowest set bit rises by at least one position; after at most 32 rounds it has shifted out entirely.' },
          { q: 'How would you subtract?', a: '`a - b` is `a + (-b)`, and `-b` is `~b + 1`. Use the same adder twice.' },
          { q: 'Why does Python need the mask?', a: 'Python has no fixed width, so a negative number’s “carry” would keep growing leftward forever. Masking to 32 bits simulates the fixed width, and the last line turns a pattern above `0x7FFFFFFF` back into a negative number.' },
          { q: 'What is the C++ trap?', a: 'Left-shifting a negative signed int, or overflowing a signed add, is undefined behavior before C++20. Doing the work in `unsigned` avoids it.' }
        ]
      }
    ],

    practice: [
      { lc: 136,
        hints: ['Look for an operation that undoes itself. What is `v ^ v`? What is `x ^ 0`?', 'XOR is commutative and associative, so the order of the numbers does not matter, and equal numbers cancel even when they are far apart.', 'Keep one variable, start it at 0, and XOR every number into it. What is left is the answer.'],
        starter: { py: 'class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        ', js: 'function singleNumber(nums) {\n  \n}' },
        tests: { fn: 'singleNumber', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 2, 1]], out: 1 }, { args: [[4, 1, 2, 1, 2]], out: 4 }, { args: [[7]], out: 7 }, { args: [[-3, 5, 5]], out: -3 }, { args: [[1, 0, 1]], out: 0 }] } },

      { lc: 191,
        hints: ['You could test the lowest bit 32 times and shift. Is there a way to jump straight from one set bit to the next?', 'Subtracting 1 from `n` flips the lowest set bit and all the zeros below it. What does `n & (n - 1)` do to the lowest set bit?', 'Loop while `n` is non-zero, clearing one bit and counting each round. In Python, mask `n` to 32 bits first so negatives terminate.'],
        starter: { py: 'class Solution:\n    def hammingWeight(self, n: int) -> int:\n        ', js: 'function hammingWeight(n) {\n  \n}' },
        tests: { fn: 'hammingWeight', sig: { args: ['int'] }, cases: [
          { args: [11], out: 3 }, { args: [128], out: 1 }, { args: [0], out: 0 }, { args: [-3], out: 31 }, { args: [2147483645], out: 30 }] } },

      { lc: 338,
        hints: ['Computing each popcount separately works but repeats work. Compare `i` with `i >> 1`: how do their bits relate?', '`i >> 1` is `i` without its lowest bit. So the 1-count of `i` is the 1-count of `i >> 1`, plus the dropped bit.', '`dp[i] = dp[i >> 1] + (i & 1)`, with `dp[0] = 0`, filled from 1 up to `n`.'],
        starter: { py: 'class Solution:\n    def countBits(self, n: int) -> List[int]:\n        ', js: 'function countBits(n) {\n  \n}' },
        tests: { fn: 'countBits', sig: { args: ['int'] }, cases: [
          { args: [2], out: [0, 1, 1] }, { args: [5], out: [0, 1, 1, 2, 1, 2] }, { args: [0], out: [0] }, { args: [8], out: [0, 1, 1, 2, 1, 2, 2, 3, 1] }] } },

      { lc: 371,
        hints: ['Think about adding two single bits by hand. Which operator gives the digit you write down, and which gives the carry?', 'XOR is the sum without carries. AND tells you where both bits are 1, and that carry moves one place left.', 'Replace `a` by `a ^ b` and `b` by `(a & b) << 1` until `b` is 0. In Python, mask to 32 bits each round and convert back at the end.'],
        starter: { py: 'class Solution:\n    def getSum(self, a: int, b: int) -> int:\n        ', js: 'function getSum(a, b) {\n  \n}' },
        tests: { fn: 'getSum', sig: { args: ['int', 'int'] }, cases: [
          { args: [1, 2], out: 3 }, { args: [2, 3], out: 5 }, { args: [-1, 1], out: 0 }, { args: [-2, -3], out: -5 }, { args: [0, 0], out: 0 }, { args: [20, 30], out: 50 }, { args: [-12, 5], out: -7 }] } },

      { lc: 190,
        hints: ['Build the answer one bit at a time. If you read `n` from its lowest bit upward, where does each bit belong in the result?', 'Shift the result left by one, OR in the lowest bit of `n`, then move `n` right by one. Repeat exactly 32 times, even when `n` becomes 0.', 'Use a zero-filling shift (`>>>`) for `n` in Java and JavaScript so a set top bit does not smear. In JavaScript, return `result >>> 0` so the answer is unsigned.'],
        solution: { explain: 'Treat the 32 bits as a conveyor belt: peel the lowest bit off `n`, push it onto the low end of the result, and shift the result along. After 32 rounds the first bit peeled is at the top. Always run 32 rounds so leading zeros end up in the right places. O(32) time, O(1) space.', code: {
          py: `class Solution:
    def reverseBits(self, n: int) -> int:
        res = 0
        for _ in range(32):
            res = (res << 1) | (n & 1)    # push n's lowest bit onto the result
            n >>= 1
        return res`,
          js: `function reverseBits(n) {
  let res = 0;
  for (let i = 0; i < 32; i++) {
    res = (res << 1) | (n & 1);           // push n's lowest bit onto the result
    n >>>= 1;
  }
  return res >>> 0;                       // read the 32 bits as unsigned
}`,
          java: `class Solution {
    public int reverseBits(int n) {
        int res = 0;
        for (int i = 0; i < 32; i++) {
            res = (res << 1) | (n & 1);   // push n's lowest bit onto the result
            n >>>= 1;
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    uint32_t reverseBits(uint32_t n) {
        uint32_t res = 0;
        for (int i = 0; i < 32; i++) {
            res = (res << 1) | (n & 1);   // push n's lowest bit onto the result
            n >>= 1;
        }
        return res;
    }
};` } },
        starter: { py: 'class Solution:\n    def reverseBits(self, n: int) -> int:\n        ', js: 'function reverseBits(n) {\n  \n}' },
        tests: { fn: 'reverseBits', sig: { args: ['int'] }, cases: [
          { args: [43261596], out: 964176192 }, { args: [2], out: 1073741824 }, { args: [0], out: 0 }, { args: [6], out: 1610612736 }, { args: [8], out: 268435456 }] } },

      { lc: 268,
        hints: ['The list has `n` numbers drawn from `0..n` with exactly one missing. What if you could pair every present number with something that cancels it?', 'XOR every index `0..n` with every value in the list. Present numbers appear twice and cancel.', 'Start `x` at `n` (the index with no slot), then for each index `i`, do `x ^= i ^ nums[i]`. The Gauss sum `n(n+1)/2 - sum` also works.'],
        solution: { explain: 'Every present value appears once as an index and once as a value, so XOR cancels it; the missing value appears only as an index and survives. Unlike the sum formula, XOR cannot overflow. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        x = len(nums)
        for i, v in enumerate(nums):
            x ^= i ^ v
        return x`,
          js: `function missingNumber(nums) {
  let x = nums.length;
  for (let i = 0; i < nums.length; i++) x ^= i ^ nums[i];
  return x;
}`,
          java: `class Solution {
    public int missingNumber(int[] nums) {
        int x = nums.length;
        for (int i = 0; i < nums.length; i++) x ^= i ^ nums[i];
        return x;
    }
}`,
          cpp: `class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int x = (int)nums.size();
        for (int i = 0; i < (int)nums.size(); i++) x ^= i ^ nums[i];
        return x;
    }
};` } },
        starter: { py: 'class Solution:\n    def missingNumber(self, nums: List[int]) -> int:\n        ', js: 'function missingNumber(nums) {\n  \n}' },
        tests: { fn: 'missingNumber', sig: { args: ['int[]'] }, cases: [
          { args: [[3, 0, 1]], out: 2 }, { args: [[0, 1]], out: 2 }, { args: [[1]], out: 0 }, { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], out: 8 }, { args: [[0]], out: 1 }] } },

      { lc: 7,
        hints: ['Peel digits off the end with `% 10` and `// 10`, and build the reversed number with `res * 10 + digit`. What goes wrong for large inputs?', 'The answer must fit in a signed 32-bit integer, else return 0. In Java and C++ you cannot check after overflow, so check **before** multiplying.', 'Before `res * 10 + d`: if `res > INT_MAX / 10`, or `res == INT_MAX / 10` and `d > 7`, return 0. The negative side mirrors it with `d < -8`. Mind that `%` and `/` keep the sign differently per language.'],
        solution: { explain: 'Peel the last digit, append it to the result, and guard against leaving the 32-bit range before each append. 2147483647 ends in 7 and −2147483648 ends in 8, which is where the two boundary digits come from. In Python, work with the absolute value and test the range at the end, because its ints never overflow. O(log |x|) time (one step per digit), O(1) space.', code: {
          py: `class Solution:
    def reverse(self, x: int) -> int:
        sign = -1 if x < 0 else 1
        x = abs(x)
        res = 0
        while x:
            res = res * 10 + x % 10
            x //= 10
        res *= sign
        return res if -2**31 <= res <= 2**31 - 1 else 0`,
          js: `function reverse(x) {
  const MAX = 2147483647, MIN = -2147483648;
  let res = 0;
  while (x !== 0) {
    const d = x % 10;                       // JS keeps the sign of x
    x = Math.trunc(x / 10);
    if (res > Math.trunc(MAX / 10) || (res === Math.trunc(MAX / 10) && d > 7)) return 0;
    if (res < Math.trunc(MIN / 10) || (res === Math.trunc(MIN / 10) && d < -8)) return 0;
    res = res * 10 + d;
  }
  return res;
}`,
          java: `class Solution {
    public int reverse(int x) {
        int res = 0;
        while (x != 0) {
            int d = x % 10;                 // Java keeps the sign of x
            x /= 10;
            if (res > Integer.MAX_VALUE / 10 || (res == Integer.MAX_VALUE / 10 && d > 7)) return 0;
            if (res < Integer.MIN_VALUE / 10 || (res == Integer.MIN_VALUE / 10 && d < -8)) return 0;
            res = res * 10 + d;
        }
        return res;
    }
}`,
          cpp: `class Solution {
public:
    int reverse(int x) {
        int res = 0;
        while (x != 0) {
            int d = x % 10;                 // C++11 and later: the sign follows x
            x /= 10;
            if (res > INT_MAX / 10 || (res == INT_MAX / 10 && d > 7)) return 0;
            if (res < INT_MIN / 10 || (res == INT_MIN / 10 && d < -8)) return 0;
            res = res * 10 + d;
        }
        return res;
    }
};` } },
        starter: { py: 'class Solution:\n    def reverse(self, x: int) -> int:\n        ', js: 'function reverse(x) {\n  \n}' },
        tests: { fn: 'reverse', sig: { args: ['int'] }, cases: [
          { args: [123], out: 321 }, { args: [-123], out: -321 }, { args: [120], out: 21 }, { args: [0], out: 0 }, { args: [1534236469], out: 0 }, { args: [-2147483412], out: -2143847412 }, { args: [2147483647], out: 0 }] } },

      { lc: 231,
        hints: ['A power of two in binary is a single 1 followed by zeros. How many set bits does it have?', 'Subtracting 1 turns that single 1 into 0 and the zeros below into 1s. What is `n & (n - 1)` then?', 'Return `n > 0 and n & (n - 1) == 0`. The `n > 0` part matters: zero and negatives are not powers of two.'],
        solution: { explain: 'Exactly one set bit means erasing the lowest set bit leaves 0, which is what `n & (n - 1) == 0` tests. Guard `n > 0`, because 0 also passes the AND test and negatives are excluded by definition. O(1) time and space.', code: {
          py: `class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        return n > 0 and n & (n - 1) == 0`,
          js: `function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}`,
          java: `class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}`,
          cpp: `class Solution {
public:
    bool isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
};` } },
        starter: { py: 'class Solution:\n    def isPowerOfTwo(self, n: int) -> bool:\n        ', js: 'function isPowerOfTwo(n) {\n  \n}' },
        tests: { fn: 'isPowerOfTwo', sig: { args: ['int'] }, cases: [
          { args: [1], out: true }, { args: [16], out: true }, { args: [3], out: false }, { args: [0], out: false }, { args: [-16], out: false }, { args: [1073741824], out: true }, { args: [2147483647], out: false }] } },

      { lc: 201,
        hints: ['Any bit position that takes both values somewhere in the range ends up 0 in the AND. Which bits can stay 1 for the whole range?', 'Only the common binary prefix of `left` and `right` survives; below it, the numbers in between flip those bits.', 'While `right > left`, clear the lowest set bit of `right` with `right &= right - 1`. When they meet, `right` is the common prefix with zeros after it.'],
        solution: { explain: 'The AND of a range is the shared leading bits of its two ends followed by zeros: once any bit differs between `left` and `right`, the counting through the range flips every lower bit at least once. Clearing the lowest set bit of `right` repeatedly walks it down to that prefix. At most 31 rounds. O(1) space.', code: {
          py: `class Solution:
    def rangeBitwiseAnd(self, left: int, right: int) -> int:
        while left < right:
            right &= right - 1        # drop right's lowest set bit
        return right`,
          js: `function rangeBitwiseAnd(left, right) {
  while (left < right) {
    right &= right - 1;               // drop right's lowest set bit
  }
  return right;
}`,
          java: `class Solution {
    public int rangeBitwiseAnd(int left, int right) {
        while (left < right) {
            right &= right - 1;       // drop right's lowest set bit
        }
        return right;
    }
}`,
          cpp: `class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {
        while (left < right) {
            right &= right - 1;       // drop right's lowest set bit
        }
        return right;
    }
};` } },
        starter: { py: 'class Solution:\n    def rangeBitwiseAnd(self, left: int, right: int) -> int:\n        ', js: 'function rangeBitwiseAnd(left, right) {\n  \n}' },
        tests: { fn: 'rangeBitwiseAnd', sig: { args: ['int', 'int'] }, cases: [
          { args: [5, 7], out: 4 }, { args: [0, 0], out: 0 }, { args: [6, 7], out: 6 }, { args: [1, 2147483647], out: 0 }, { args: [26, 30], out: 24 }, { args: [12, 15], out: 12 }, { args: [9, 9], out: 9 }] } },

      { lc: 137,
        hints: ['XOR cancels pairs, but here values come in triples. Think about a single bit position: how many numbers have it set?', 'For each bit, the triples contribute a multiple of 3 to the count, so `count % 3` is the loner’s bit. Can you keep those counts without 32 counters?', 'Keep two integers, `ones` and `twos`: bits seen once and bits seen twice (mod 3). For each `v`: `ones = (ones ^ v) & ~twos`, then `twos = (twos ^ v) & ~ones`. Return `ones`.'],
        solution: { explain: 'For every bit position, the number of numbers with that bit set is `3k` or `3k + 1`; the `+ 1` is the loner. `ones` and `twos` together are a two-bit counter per position that counts 0, 1, 2 and wraps back to 0 on the third hit. After one pass, bits seen once (mod 3) are in `ones`. O(n) time, O(1) space, and it works for negatives because each bit position is handled alike.', code: {
          py: `class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        ones = twos = 0
        for v in nums:
            ones = (ones ^ v) & ~twos     # first time: set. second time: it moves to twos. third: cleared
            twos = (twos ^ v) & ~ones
        return ones`,
          js: `function singleNumber(nums) {
  let ones = 0, twos = 0;
  for (const v of nums) {
    ones = (ones ^ v) & ~twos;            // first time: set. second time: it moves to twos. third: cleared
    twos = (twos ^ v) & ~ones;
  }
  return ones;
}`,
          java: `class Solution {
    public int singleNumber(int[] nums) {
        int ones = 0, twos = 0;
        for (int v : nums) {
            ones = (ones ^ v) & ~twos;    // first time: set. second time: it moves to twos. third: cleared
            twos = (twos ^ v) & ~ones;
        }
        return ones;
    }
}`,
          cpp: `class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int ones = 0, twos = 0;
        for (int v : nums) {
            ones = (ones ^ v) & ~twos;    // first time: set. second time: it moves to twos. third: cleared
            twos = (twos ^ v) & ~ones;
        }
        return ones;
    }
};` } },
        starter: { py: 'class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        ', js: 'function singleNumber(nums) {\n  \n}' },
        tests: { fn: 'singleNumber', sig: { args: ['int[]'] }, cases: [
          { args: [[2, 2, 3, 2]], out: 3 }, { args: [[0, 1, 0, 1, 0, 1, 99]], out: 99 }, { args: [[-2, -2, 1, 1, -3, 1, -3, -3, -4, -2]], out: -4 }, { args: [[5, 5, 5, 7]], out: 7 }, { args: [[-1, -1, -1, -8]], out: -8 }] } }
    ],

    mistakes: [
      '**Operator precedence.** In C, C++, Java and JavaScript, `==` binds **tighter** than `&`, `^` and `|`, so `n & 1 == 0` means `n & (1 == 0)`. Always write `(n & 1) == 0`. (Python is the odd one out: there `&` binds tighter than `==`, so `n & (n - 1) == 0` happens to work. Do not rely on it when switching languages.)',
      '**Forgetting `n > 0` in the power-of-two test.** `n & (n - 1) == 0` is also true for `n = 0`, which is not a power of two. Negatives fail the definition too, even though `INT_MIN & (INT_MIN - 1)` is a wrap-around trap in some languages.',
      '**Python and negative numbers.** Python ints are unbounded, so `-1` is “an infinite string of 1s”: `while n: n &= n - 1` never ends, and `~x` is `-x - 1`, never a 32-bit pattern. When a problem is about 32-bit patterns, mask: `n & 0xFFFFFFFF`, and convert back with `x - (1 << 32)` if bit 31 is set.',
      '**JavaScript bit operators are 32-bit signed.** `1 << 31` is `-2147483648`, and `x | 0` truncates to a signed 32-bit integer. Numbers above 2³¹ − 1 silently wrap, and `>>>` is the only operator that returns an **unsigned** result. For 64-bit work use `BigInt` (`1n << 40n`).',
      '**Java: `>>` versus `>>>`.** `>>` copies the sign bit, `>>>` shifts in zeros. A loop like `while (n != 0) { n >>= 1 }` on a negative `int` never reaches 0 (it ends at −1). Also, `1 << i` is an `int`, so for `i >= 32` use `1L << i`; shift counts wrap modulo 32 (or 64 for `long`).',
      '**C++ undefined behavior.** Shifting by a negative amount or by the width or more (`1 << 32` on a 32-bit `int`) is UB; so is left-shifting a negative value, and signed overflow such as `INT_MIN - 1` or `a + b` in the Sum of Two Integers problem. Do bit twiddling on `unsigned` types, and use `1LL << i` for wide masks.',
      '**Shifting by the wrong operand.** `1 << i` builds the mask; `i << 1` is just `2 * i`. And `x >> i & 1` reads as `(x >> i) & 1` only because shift binds tighter than `&`: add the parentheses anyway.',
      '**XOR tricks need the promise.** XOR-ing everything finds the loner only when every other value appears **an even number of times**. If a value can appear three times, XOR keeps it. State the assumption before using it.',
      '**Mixing up the three “erase”, “isolate”, “test” tricks.** `n & (n - 1)` *erases* the lowest set bit, `n & -n` *isolates* it, and `(n >> i) & 1` *tests* bit `i`. Clearing bit `i` is `n & ~(1 << i)`, and it needs the `~`: `n & (1 << i)` keeps only that bit.',
      '**Subset-mask enumeration cost.** Looping over all `2ⁿ` masks and testing `n` bits is O(2ⁿ · n); with `n = 25` that is hundreds of millions of operations. A bitmask answer is feasible only when `n` is about 20 or smaller, so check the constraint first.'
    ],

    quiz: [
      { kind: 'concept', q: 'What does `n & (n - 1)` do to `n`?',
        choices: ['Erases the lowest set bit', 'Keeps only the lowest set bit', 'Flips every bit', 'Shifts `n` right by one'], answer: 0,
        explain: 'Subtracting 1 flips the lowest set bit to 0 and the zeros below it to 1. ANDing with `n` keeps everything above unchanged and zeroes that bit and the ones below, so exactly the lowest set bit disappears.' },
      { kind: 'concept', q: 'Which expression isolates the lowest set bit of `n`?',
        choices: ['`n & -n`', '`n & (n - 1)`', '`n | (n - 1)`', '`n ^ (n >> 1)`'], answer: 0,
        explain: '`-n` is `~n + 1`. Below the lowest set bit both numbers are 0, at it both are 1, above it they are opposites. So only that bit survives the AND.' },
      { kind: 'complexity', q: 'Brian Kernighan’s popcount loop (`while n: n &= n - 1`) on a 32-bit number with `k` set bits runs in:',
        choices: ['O(k) iterations, at most 32', 'Always exactly 32 iterations', 'O(2ᵏ) iterations', 'O(log n) iterations regardless of the bits'], answer: 0,
        explain: 'Each round erases one set bit, so the loop runs once per set bit. Testing every position instead would take 32 rounds every time.' },
      { kind: 'pattern', q: 'A list has every value appearing twice except one. Which approach uses constant extra space?',
        choices: ['XOR all values together', 'Put every value in a hash set', 'Sort the list and compare neighbours', 'Count with a dictionary'], answer: 0,
        explain: '`v ^ v = 0` and `x ^ 0 = x`, and XOR does not care about order, so the pairs cancel. The set and dictionary use O(n) memory; sorting uses O(n log n) time.' },
      { kind: 'bug', q: 'This is meant to test whether `n` is even, but it never returns true. Why?',
        code: `if (n & 1 == 0) return true;`, lang: 'js',
        choices: ['`==` binds tighter than `&`, so it computes `n & (1 == 0)`, which is `n & false`', '`&` only works on booleans', 'It should use `^` instead of `&`', 'The bit mask should be 2'], answer: 0,
        explain: 'In JavaScript, C, C++ and Java the comparison has higher precedence, so the expression is `n & (1 == 0)` = `n & 0` = 0. Write `(n & 1) === 0`.' },
      { kind: 'bug', q: 'This Python function is meant to count the 1 bits of any 32-bit pattern, but hangs on `n = -1`. What is the fix?',
        code: `def popcount(n):
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count`, lang: 'py',
        choices: ['Mask first: `n &= 0xFFFFFFFF`', 'Use `n >>= 1` instead', 'Start `count` at 1', 'Use `n |= n - 1`'], answer: 0,
        explain: 'Python ints have infinitely many leading 1s when negative, so `n` never becomes 0. Masking to 32 bits turns it into a normal 32-bit pattern.' },
      { kind: 'concept', q: 'In two’s complement with 8 bits, what is the pattern for −8?',
        choices: ['`11111000`', '`10001000`', '`11110111`', '`00001000`'], answer: 0,
        explain: 'Take 8 = `00001000`, flip every bit to get `11110111`, and add 1: `11111000`. As a check, the top bit weighs −128, and −128 + 64 + 32 + 16 + 8 = −8.' },
      { kind: 'concept', q: 'What is the difference between `>>` and `>>>` in Java for a negative `int`?',
        choices: ['`>>` shifts in copies of the sign bit; `>>>` shifts in zeros', '`>>>` shifts by twice as many places', 'They are identical for `int`', '`>>` shifts in zeros; `>>>` shifts in copies of the sign bit'], answer: 0,
        explain: 'Arithmetic `>>` keeps the number negative (the sign is extended); logical `>>>` treats the number as a bag of bits and fills the top with zeros.' },
      { kind: 'pattern', q: 'Which of these problems is a natural fit for bit manipulation? Pick every one that applies.',
        choices: ['Find the value that appears once while all others appear twice', 'Check whether a number is a power of two', 'Find the longest palindromic substring', 'Enumerate every subset of 15 items'], answer: [0, 1, 3],
        explain: 'XOR cancellation, `n & (n - 1) == 0`, and counting through masks `0 .. 2ⁿ − 1` are all bit tricks. Longest palindromic substring is a string expansion/DP problem.' },
      { kind: 'concept', q: 'For Sum of Two Integers, what do `a ^ b` and `(a & b) << 1` represent?',
        choices: ['The sum without carries, and the carries moved to the next position', 'The sum and the difference', 'The larger and smaller number', 'The high half and the low half of the answer'], answer: 0,
        explain: 'XOR adds each bit pair without carry. AND finds the pairs that produce a carry, and shifting left moves each carry to the next bit up. Repeat until no carry is left.' },
      { kind: 'concept', q: 'The loop `sub = (sub - 1) & mask` starting from `sub = mask` visits:',
        choices: ['Every subset of the 1 bits of `mask`, from largest to smallest', 'Every integer from `mask` down to 0', 'Only the powers of two inside `mask`', 'Every superset of `mask`'], answer: 0,
        explain: 'Subtracting 1 flips the lowest set bit and the zeros below; ANDing with `mask` throws away any flipped bits that are not in `mask`, which lands on the next smaller submask.' }
    ],

    flashcards: [
      { id: 'ops', front: 'AND, OR, XOR and NOT in one phrase each?', back: '`&` keeps 1 where **both** are 1 (test, clear). `|` keeps 1 where **either** is 1 (set). `^` keeps 1 where they **differ** (toggle, compare). `~` flips every bit.' },
      { id: 'four-moves', front: 'Test, set, clear, toggle bit `i` of `n`?', back: 'Test `(n >> i) & 1`. Set `n | (1 << i)`. Clear `n & ~(1 << i)`. Toggle `n ^ (1 << i)`.' },
      { id: 'kernighan', front: 'What does `n & (n - 1)` do, and what is it used for?', back: 'Erases the lowest set bit. Used for popcount (loop until 0), the power-of-two test (`n > 0 and n & (n - 1) == 0`), and Range AND.' },
      { id: 'lowbit', front: 'Isolate the lowest set bit?', back: '`n & -n`. Because `-n = ~n + 1`, only the lowest set bit is 1 in both. This is also the jump step in a Fenwick tree.' },
      { id: 'xor-laws', front: 'The XOR facts behind Single Number?', back: '`x ^ x = 0`, `x ^ 0 = x`, commutative and associative. XOR all values: pairs cancel, the loner remains. Needs every other value to appear an even number of times.' },
      { id: 'twos-comp', front: 'Negate a number in two’s complement; what is `~x`?', back: '`-x = ~x + 1`, so `~x = -x - 1`. In `w` bits the top bit weighs `-2^(w-1)`; a pattern with the top bit set equals `pattern - 2^w`.' },
      { id: 'shifts', front: '`<<`, `>>` and `>>>`: what do they do?', back: '`x << k` multiplies by 2^k (bits fall off the top). `x >> k` divides by 2^k, copying the sign bit in. `>>>` shifts in zeros. Python has no `>>>`; C++ needs `unsigned`.' },
      { id: 'count-bits-dp', front: 'Counting Bits recurrence?', back: '`dp[i] = dp[i >> 1] + (i & 1)`, `dp[0] = 0`. Or `dp[i] = dp[i & (i - 1)] + 1`. O(n) total.' },
      { id: 'add-bits', front: 'Add two ints without `+`?', back: 'Repeat: `carry = (a & b) << 1`, `a = a ^ b`, `b = carry` until `b == 0`. In Python mask to 32 bits each round and sign-convert at the end.' },
      { id: 'swap', front: 'Swap two ints with XOR?', back: '`a ^= b; b ^= a; a ^= b`. It zeroes the value if both names point at the same memory, and is no faster than a temporary: know it, do not use it.' },
      { id: 'missing', front: 'Missing number in `0..n` with XOR?', back: 'Start `x = n`, then `x ^= i ^ nums[i]` for every index. Present values cancel; the missing one is left. Cannot overflow, unlike the Gauss sum.' },
      { id: 'masks', front: 'Enumerate all subsets of `n` items; and all submasks of `m`?', back: 'Subsets: `for mask in range(1 << n)`, bit `i` means item `i` is in. Submasks of `m`: `sub = m; while True: use(sub); if sub == 0: break; sub = (sub - 1) & m`. Total 3ⁿ over all masks.' },
      { id: 'gotchas', front: 'Language gotchas for bit work?', back: 'Python: unbounded ints, mask with `& 0xFFFFFFFF`. JS: operators are 32-bit signed, `>>> 0` makes unsigned. Java: `>>` vs `>>>`, `1L << i`. C++: shifts by the width and signed overflow are UB, use `unsigned`.' },
      { id: 'precedence', front: 'The precedence trap with `&` and `==`?', back: 'In C, C++, Java and JS, `==` binds tighter than `&`: write `(n & 1) == 0`. Python differs (`&` binds tighter), so parenthesize anyway.' }
    ],

    deeper: [
      { title: 'Bit Twiddling Hacks (Sean Eron Anderson)', url: 'https://graphics.stanford.edu/~seander/bithacks.html', time: 'reference', note: 'The classic catalogue of bit tricks: counting bits, parity, power-of-two tests, swapping and more, each with a short explanation. Skim the headings; do not memorize it.' },
      { title: 'Bitwise operation (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Bitwise_operation', time: 'about 15 min', note: 'Operators, shifts, arithmetic versus logical shifts and the language differences, in one page. Good for settling the `>>` versus `>>>` question.' },
      { title: 'Two’s complement (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Two%27s_complement', time: 'about 15 min', note: 'Why negatives are stored this way, how to negate by hand, and why addition circuits need no special case for signs.' },
      { title: 'NeetCode roadmap: Bit Manipulation', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where Single Number, Number of 1 Bits, Counting Bits, Reverse Bits, Missing Number, Sum of Two Integers and Reverse Integer sit in the NeetCode 150, with video walkthroughs.' }
    ],

    detective: [
      { id: 'odd-badge', decoys: ['arrays-hashing', 'sorting', 'prefix-sums'],
        statement: 'A hotel’s door system logs a badge ID every time a key card is tapped, entering or leaving. At the end of a night shift the log has a few hundred thousand IDs in the order they happened. Every guest tapped in and then out again, so every ID appears an even number of times, except one night guard whose exit tap failed. The device that checks the log has almost no memory: it can hold a few integers, and the log may only be read once. Which ID belongs to the guard?',
        why: 'Pairs of identical items with one unpaired, a single pass and almost no memory: the cancellation of equal values under XOR. A frequency dictionary would work but costs memory proportional to the number of guests.' },
      { id: 'light-grid', decoys: ['backtracking', 'dp-1d', 'math'],
        statement: 'A stage has 18 spotlights, each either on or off. A lighting designer wants to preview every possible combination, once each, and for each combination compute the total power draw, given the wattage of every lamp. There is no way to skip combinations, but she wants the cleanest possible way to write the loop, with no recursion and no list of lists. How can every on/off combination be walked through with one counter?',
        why: 'Each lamp is a yes or no, and the number of lamps is small (18), so every combination fits into one integer whose binary digits are the lamps. A plain counter from 0 up to 2¹⁸ − 1 visits each combination exactly once, and reading digit i tells whether lamp i is on.' },
      { id: 'stair-flags', decoys: ['math', 'binary-search', 'dp-1d'],
        statement: 'A warehouse robot may only be loaded when its capacity setting is a number of the form 1, 2, 4, 8, 16 and so on. A technician has to build a quick check for a setting typed in by a worker, and the check must run on a tiny controller with no loops, no division and no lookup table: just a couple of arithmetic and logic instructions on the number. Zero and negative values must be rejected. What single test accepts exactly the valid settings?',
        why: 'The valid numbers have exactly one 1 in binary. Subtracting 1 turns that lone 1 into 0 and everything below it into 1s, so combining the number with its predecessor using AND gives 0 only in that case, plus a positivity guard for zero and negatives.' }
    ]
  });
})();
