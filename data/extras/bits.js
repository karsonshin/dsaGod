(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['bits'] = {
    primer: {
      kind: 'technique',
      what: `Inside the computer every integer is a row of **bits**, switches that are 0 or 1, where the switch at position i is worth 2^i (so 13 is \`1101\` = 8 + 4 + 1). Negative numbers use **two's complement**: flip every bit of the positive number and add 1, so in 8 bits -1 is \`11111111\`. Bit tricks work on all the switches at once.`,
      does: `The operators \`&\` (both), \`|\` (either), \`^\` (differ), \`~\` (flip), \`<<\` and \`>>\` (shift, which multiplies or divides by 2) each cost O(1) on a whole word. They answer "is it a power of two?", "how many 1 bits?", "which value appears once?", and store a subset of up to about 20 items in one integer.`,
      impl: `A **mask** is a number with 1s at the positions you care about: \`x & mask\` reads them, \`x | mask\` sets them, \`x & ~mask\` clears them, \`x ^ mask\` flips them. \`n & (n - 1)\` erases the lowest set bit; \`n & -n\` isolates it; \`x ^ x == 0\` cancels pairs. Python ints are unbounded, so mask with \`& 0xFFFFFFFF\` when a problem means 32-bit patterns.`,
      possibilities: `Single Number (and its triple and two-loner variants), Number of 1 Bits, Counting Bits, Missing Number, Sum of Two Integers without plus, Reverse Bits, power-of-two tests, range AND, enumerating all subsets with a bitmask loop, and maximum XOR of two numbers.`
    },

    think: [
      {
        q: `Compute 13 & 6, 13 | 6 and 13 ^ 6 by writing both numbers in four-bit binary.`,
        a: `13 = 1101, 6 = 0110. AND keeps a 1 only where both have it: 0100 = 4. OR keeps a 1 where either has it: 1111 = 15. XOR keeps a 1 where they differ: 1011 = 11. The aha: line the numbers up column by column and treat each column independently; every bit operator is just a rule for one column.`
      },
      {
        q: `For n = 40 (binary 101000), what are n & (n - 1) and n & -n?`,
        a: `n - 1 = 39 = 100111 (the lowest 1 became 0 and the zeros below it became 1s). 101000 & 100111 = 100000 = 32: the lowest set bit is erased. -n is the flip of n plus 1, ...011000, and 101000 & 011000 = 001000 = 8: only the lowest set bit survives. The aha: one expression erases the lowest set bit, the other keeps just it.`
      },
      {
        q: `The list is [5, 3, 5, 9, 3]. Without counting anything, what does XOR-ing everything give, and why?`,
        a: `Every value except 9 appears twice. v ^ v = 0, and XOR does not care about order, so 5 ^ 3 ^ 5 ^ 9 ^ 3 regroups as (5 ^ 5) ^ (3 ^ 3) ^ 9 = 0 ^ 0 ^ 9 = 9. The aha: XOR undoes itself, so pairs vanish no matter how far apart they are in the list, using one integer of memory instead of a hash map.`
      },
      {
        q: `In Python, why does "while n: n &= n - 1" loop forever when n = -1, and how do you fix it?`,
        a: `Python integers have no fixed width, so -1 behaves like an infinite row of 1s. -1 & -2 = -2, -2 & -3 = -4, -4 & -5 = -8: it stays negative and never reaches 0. The fix is to view the number as a 32-bit pattern first: n &= 0xFFFFFFFF turns -1 into 4294967295 (thirty-two 1s), and the loop runs 32 times. The aha: the width of the number is a hidden input.`
      },
      {
        q: `What is the difference between 1 << 3 and 3 << 1, and which one builds a mask for bit 3?`,
        a: `1 << 3 slides the single 1 left three places: 1000 = 8, a mask with only bit 3 set. 3 << 1 slides 11 left one place: 110 = 6, just 3 times 2. A mask for bit i is always 1 << i (the 1 is the thing being shifted). Mixing the operands is a common bug, and in Java and C++ remember 1 is an int, so for bit positions 32 and up use 1L << i.`
      },
      {
        q: `A power of two has exactly one 1 bit. Why does n & (n - 1) == 0 detect that, and what number wrongly passes unless you check n > 0?`,
        a: `n & (n - 1) erases the lowest set bit. If there was exactly one 1 bit, erasing it leaves 0. If there were two or more, something remains. But n = 0 also gives 0 & (-1) = 0, and 0 is not a power of two, so the test must be n > 0 and n & (n - 1) == 0. Negative numbers must be excluded for the same reason.`
      }
    ],

    breakdown: [
      {
        title: `1. A number is a row of switches (and how negatives work)`,
        body: `Write 13 as 1101: from the left the switches are worth 8, 4, 2, 1, so 13 = 8 + 4 + 1. Each position is a **bit**, 0 or 1. Bit 0 is the rightmost. Negatives use **two's complement**: to get -13 in 8 bits, write 13 as 00001101, flip every bit to 11110010, then add 1 to get 11110011. Check: 11110011 read as plain binary is 243, and 243 - 256 = -13, which is why the top bit counts as -128 instead of +128. The same pattern means 243 if you treat it as unsigned or -13 if signed. Bit operations just shuffle the pattern.`
      },
      {
        title: `2. The six operators on 12 and 10`,
        body: `12 = 1100, 10 = 1010. AND (\`&\`): 1000 = 8, a 1 only where both have one. OR (\`|\`): 1110 = 14, a 1 where either has one. XOR (\`^\`): 0110 = 6, a 1 where they differ. NOT (\`~\`) flips every bit, and ~12 = -13 because ~x = -x - 1. Shift left: 12 << 1 = 11000 = 24 (times 2). Shift right: 12 >> 2 = 11 = 3 (divide by 4, drop the remainder). Read them as: AND to look or erase, OR to turn on, XOR to flip or compare.`
      },
      {
        title: `3. Masks: test, set, clear, toggle`,
        body: `A mask for bit i is \`1 << i\`: for i = 1 it is 0010. With n = 13 (1101): test bit 1 with \`(13 >> 1) & 1\` = 110 & 1 = 0 (the bit is off). Set it: 13 | 2 = 1111 = 15. Clear it: 13 & ~2 = 1101 & 1101 = 13 (already off). Toggle it: 13 ^ 2 = 1111 = 15. The pattern: AND with a mask keeps or erases bits, OR forces bits on, XOR flips them. A flag array that fits in one word can be one integer, and a set of up to about 20 items fits in a mask.`,
        code: { py: `n, i = 13, 1
mask = 1 << i
test   = (n >> i) & 1     # 0: bit is off
set_   = n | mask         # 15
clear  = n & ~mask        # 13
toggle = n ^ mask         # 15` }
      },
      {
        title: `4. n & (n - 1) erases the lowest set bit`,
        body: `Subtracting 1 from n flips the lowest 1 to 0 and turns every 0 below it into 1; bits above stay put. So AND-ing n with n - 1 clears exactly that lowest 1. Trace n = 12 = 1100: n - 1 = 1011, and 1100 & 1011 = 1000 = 8. Again: 8 - 1 = 0111, 1000 & 0111 = 0. Two rounds, and 12 has two 1 bits. That is **Brian Kernighan's popcount**: loop while n is non-zero, erase a bit, count it. It runs once per set bit, not once per position. The same line shows that n is a power of two when n > 0 and n & (n - 1) == 0.`,
        code: { py: `def popcount(n):
    n &= 0xFFFFFFFF          # Python: treat n as 32 bits so negatives end
    count = 0
    while n:
        n &= n - 1           # erase the lowest set bit
        count += 1
    return count` }
      },
      {
        title: `5. XOR cancels pairs`,
        body: `Two facts: x ^ x = 0 and x ^ 0 = x. XOR is also order-free, so a long XOR can be regrouped any way. Take [4, 1, 2, 1, 2], where everything but 4 appears twice. Running XOR: 0 ^ 4 = 4; 4 ^ 1 = 5; 5 ^ 2 = 7; 7 ^ 1 = 6; 6 ^ 2 = 4. The loner is left, with no hash map and one integer of memory. The same trick finds a missing number: XOR every index 0..n with every value, and each present number appears twice and cancels. It only works when everything else appears an even number of times; say that assumption out loud.`
      },
      {
        title: `6. Subsets as masks`,
        body: `With 3 items, the integers 0 to 7 (that is 2^3 numbers) are in one-to-one correspondence with the 8 subsets. Bit i of the mask says whether item i is in. Mask 5 = 101 means items 0 and 2; mask 0 is the empty set; mask 7 is everything. A plain loop \`for mask in range(1 << n)\` visits every subset exactly once, and \`(mask >> i) & 1\` tests whether item i is in. Cost O(2^n * n), so it works for n up to about 20. This is also the starting point of bitmask DP, where the mask is the state of a subproblem.`,
        code: { py: `items = ['a', 'b', 'c']
for mask in range(1 << len(items)):
    chosen = [items[i] for i in range(len(items)) if (mask >> i) & 1]
    # mask 5 (101) -> ['a', 'c']` }
      },
      {
        title: `7. Building answers bit by bit`,
        body: `Many problems reuse smaller answers. Counting Bits for 0..5 uses dp[i] = dp[i >> 1] + (i & 1): the 1-count of i is the 1-count of i without its last bit, plus that last bit. dp: 0, 1 (1), 1 (10 -> dp[1] + 0), 2 (11 -> dp[1] + 1), 1 (100 -> dp[2] + 0), 2 (101 -> dp[2] + 1). Adding without plus works the same way: a ^ b is the sum without carries, (a & b) << 1 is the carries, and you repeat until the carry is 0. Reverse bits: peel the lowest bit off n, push it onto the low end of the result, 32 times.`
      },
      {
        title: `8. Widths, languages, and spotting it`,
        body: `Bit width is a hidden input. Python ints are unbounded: negative numbers never reach 0 by shifting or by n & (n - 1), so mask with & 0xFFFFFFFF for 32-bit questions. JavaScript bit operators work on signed 32 bits (>>> gives unsigned). Java has >> (copies the sign) and >>> (zeros in). In C++ prefer unsigned to avoid overflow problems. Spot bit problems by: "without extra space" on an odd-one-out question, "binary representation", "power of two", "set of at most 20 things", and "do not use + or -". Also remember precedence: in C-like languages write (n & 1) == 0 with brackets.`
      }
    ],

    drills: [
      {
        title: `Flips to match`,
        q: `Given two non-negative integers a and b, return the number of bits you must flip in a to turn it into b.\n\nExample: a = 10 (1010), b = 7 (0111) returns \`3\`.`,
        hint: `XOR is 1 exactly where two bits differ. Count the 1s in a ^ b.`,
        how: `I restate it: how many bit positions differ between a and b? Brute force converts both to binary strings, pads them to the same length and compares column by column, which works but is clumsy and relies on string handling. The observation: XOR does exactly this comparison for every column at once. a ^ b has a 1 in each position where the bits differ and a 0 where they match. So the answer is the number of 1 bits in a ^ b, a popcount. For the popcount I use Brian Kernighan's loop: n & (n - 1) erases the lowest set bit, so looping until n is 0 and counting rounds gives the number of 1s, once per set bit instead of once per position. Trace a = 10 = 1010, b = 7 = 0111: a ^ b = 1101 = 13. Loop: 13 & 12 = 12 (count 1), 12 & 11 = 8 (count 2), 8 & 7 = 0 (count 3). Answer 3. Edge cases: a equal to b gives 0; a = 0 gives the popcount of b. Since both are non-negative, there is no sign problem in Python. Cost: O(k) for k set bits in the XOR, at most the word size, so O(1) for fixed width, O(1) extra space.`,
        code: { py: `def flips_needed(a, b):
    diff = a ^ b               # 1 exactly where the bits differ
    count = 0
    while diff:
        diff &= diff - 1       # erase the lowest set bit
        count += 1
    return count` },
        explain: `Each column where a and b differ is a 1 in a ^ b, and each needs exactly one flip, so the answer is the popcount of a ^ b. Kernighan's loop runs once per set bit. O(k) time with k at most the number of bits, O(1) space.`,
        check: `assert flips_needed(10, 7) == 3
assert flips_needed(0, 0) == 0
assert flips_needed(5, 5) == 0
assert flips_needed(0, 255) == 8
assert flips_needed(1, 2) == 2
import random
for _ in range(500):
    a, b = random.randint(0, 5000), random.randint(0, 5000)
    w = max(a.bit_length(), b.bit_length(), 1)
    sa, sb = format(a, '0%db' % w), format(b, '0%db' % w)
    assert flips_needed(a, b) == sum(x != y for x, y in zip(sa, sb))`
      },
      {
        title: `The lonely pair`,
        q: `Every number in a list appears exactly twice, except two different numbers that each appear once. Return those two numbers in increasing order, using one pass of XOR and constant extra memory. Negatives are allowed.\n\nExample: \`[1, 2, 1, 3, 2, 5]\` returns \`[3, 5]\`.`,
        hint: `XOR everything: you get a ^ b. That is non-zero, so some bit differs between a and b. Use that bit to split the list into two halves.`,
        how: `I restate it: two values appear once, everything else appears twice; find the two. A hash map counts each value in O(n) time but O(n) space, and the problem asks for constant memory. XOR everything first, as in the single-loner case: pairs cancel, and what is left is a ^ b. That is not directly useful, but it is not zero either, because a and b are different. So at least one bit is set in a ^ b, which means a and b differ at that bit: one has a 1 there, the other a 0. Pick one such bit, the lowest set bit, isolated with x & -x. Now split all numbers into two groups by whether they have that bit set. Each pair of equal numbers lands entirely in one group (equal numbers have equal bits). And a and b land in different groups. So each group is the single-loner problem: XOR within each group cancels the pairs and leaves one lonely number. Trace [1, 2, 1, 3, 2, 5]: total XOR = 3 ^ 5 = 011 ^ 101 = 110 = 6. Lowest set bit is 2 (010). Numbers with that bit: 2, 3, 2 (010, 011, 010) XOR to 3. Others: 1, 1, 5 XOR to 5. Answer [3, 5]. Negatives work, since Python's & and ^ behave consistently on negatives, and x & -x still isolates the lowest set bit. Edge cases: exactly two numbers in the list. Cost: O(n) time, O(1) space.`,
        code: { py: `def lonely_pair(nums):
    x = 0
    for v in nums:
        x ^= v                   # pairs cancel: x == a ^ b
    low = x & -x                 # a bit where a and b differ
    a = b = 0
    for v in nums:
        if v & low:
            a ^= v               # group with that bit set
        else:
            b ^= v               # group with that bit clear
    return sorted([a, b])` },
        explain: `The total XOR is a ^ b, non-zero because a differs from b, so its lowest set bit separates a from b. Equal numbers share all bits and stay together in the same group, so each group XORs down to a single loner. O(n) time, O(1) space.`,
        check: `assert lonely_pair([1, 2, 1, 3, 2, 5]) == [3, 5]
assert lonely_pair([7, 9]) == [7, 9]
assert lonely_pair([-1, 4, -1, 6]) == [4, 6]
assert lonely_pair([0, 8, 8, 5]) == [0, 5]
assert lonely_pair([-3, -4, 2, 2]) == [-4, -3]
import random
for _ in range(300):
    vals = random.sample(range(-20, 20), random.randint(2, 8))
    a, b, rest = vals[0], vals[1], vals[2:]
    nums = [a, b] + rest + rest
    random.shuffle(nums)
    assert lonely_pair(nums) == sorted([a, b])`
      },
      {
        title: `Smallest covering team`,
        q: `There are up to 15 people. Each person is described by a bitmask of the skills they have (bit i set means skill i). Given \`need\`, a bitmask of required skills, return the fewest people whose skills together include every required skill, or -1 if impossible.\n\nExample: people \`[0b011, 0b110, 0b100]\`, need \`0b111\` returns \`2\` (the first two cover bits 0, 1 and 2).`,
        hint: `Try every subset of people with a mask loop. OR their skill masks together and check that need is a subset.`,
        how: `I restate it: pick the smallest group of people so that between them all required skills are present. Brute force by hand would try every subset, and with at most 15 people that is only 2^15 = 32768 subsets, so brute force is exactly right; the work is representing it neatly. I let an integer \`team\` from 0 to 2^n - 1 stand for a subset: bit i says person i is on the team. For each team I OR together the skill masks of its members to get what the team covers. The team is good when it covers everything needed, which is the test \`covered & need == need\` (every required bit is present in covered). Among good teams I track the smallest size. For the size I count the set bits in team, using Kernighan's loop or \`bin(team).count('1')\`. Trace the example: need = 111. Team {0} covers 011, not enough; team {0,1} covers 011 | 110 = 111, which contains need, size 2. Team {1,2}: 110 | 100 = 110, missing bit 0. Any single person misses something. Answer 2. Edge cases: need = 0 means the empty team works: answer 0; a skill nobody has gives -1. Cost: O(2^n * n) time, O(1) space, fine for n up to about 15 to 20.`,
        code: { py: `def smallest_team(skills, need):
    n = len(skills)
    best = -1
    for team in range(1 << n):                  # every subset of people, once
        covered = 0
        size = 0
        for i in range(n):
            if (team >> i) & 1:                 # person i is on this team
                covered |= skills[i]
                size += 1
        if covered & need == need:              # every required skill is present
            if best == -1 or size < best:
                best = size
    return best` },
        explain: `The integers 0 to 2^n - 1 enumerate every subset exactly once. OR accumulates the union of skills, and covered & need == need tests that need is a subset of that union. O(2^n * n) time, O(1) space.`,
        check: `assert smallest_team([0b011, 0b110, 0b100], 0b111) == 2
assert smallest_team([], 0) == 0
assert smallest_team([0b1], 0b10) == -1
assert smallest_team([0b1111], 0b1010) == 1
assert smallest_team([0b01, 0b10, 0b11], 0b11) == 1
import random, itertools
for _ in range(200):
    n = random.randint(0, 7)
    sk = [random.randint(0, 15) for _ in range(n)]
    need = random.randint(0, 15)
    exp = -1
    for r in range(n + 1):
        found = False
        for c in itertools.combinations(sk, r):
            m = 0
            for s in c:
                m |= s
            if m & need == need:
                found = True
                break
        if found:
            exp = r
            break
    assert smallest_team(sk, need) == exp`
      },
      {
        title: `Biggest XOR of two`,
        q: `Given a list of non-negative integers below 2^31, return the largest value of a ^ b over all pairs of elements (a pair may use the same position twice, giving 0).\n\nExample: \`[3, 10, 5, 25, 2, 8]\` returns \`28\` (5 ^ 25).`,
        hint: `Decide the answer one bit at a time from the top. For a candidate answer, check if two prefixes XOR to it.`,
        how: `I restate it: among all pairs, the largest XOR. Brute force tries every pair, O(n²), which is too slow for large lists. The observation: to make a ^ b large, the highest bit matters most, then the next, and so on, so I can build the answer greedily from the top bit down. Suppose I have decided the answer's top bits and want to try setting the next bit. The candidate is ans | (1 << bit). The candidate is achievable exactly when there exist two numbers whose top-prefixes (their bits from the top down to this bit) XOR to the candidate's prefix. I get the prefixes by masking each number with the bits decided so far, and store them in a set. Because x ^ y = c means y = x ^ c, I just test whether, for some prefix p, candidate ^ p is also in the set. If yes, keep the bit; if not, leave it 0. Repeat for 31 bits. Trace [3, 10, 5, 25, 2, 8] in five bits. Bit 4: prefixes {0, 16}; candidate 16, and 16 ^ 0 = 16 is present, keep (ans 16). Bit 3: prefixes {0, 8, 24}; candidate 24, 24 ^ 0 = 24 present, keep. Bit 2: prefixes {0, 4, 8, 24}; candidate 28, 28 ^ 4 = 24 present, keep (ans 28). Bits 1 and 0: no prefix pair reaches candidate 30 or 29, so they stay 0. Answer 28 = 5 ^ 25. Edge cases: one element gives 0 (x ^ x); all equal gives 0. Cost: 31 passes over n elements, O(31 n) time, O(n) space.`,
        code: { py: `def max_xor(nums):
    ans = mask = 0
    for bit in range(30, -1, -1):                  # from the top bit down
        mask |= 1 << bit                           # look at the bits decided so far
        prefixes = {x & mask for x in nums}
        candidate = ans | (1 << bit)               # can the answer have this bit?
        if any(candidate ^ p in prefixes for p in prefixes):
            ans = candidate
    return ans` },
        explain: `At each bit we ask whether the best answer can have a 1 here, given the higher bits already chosen. If some prefix p and candidate ^ p both exist, two numbers achieve that prefix XOR, so the bit is kept; otherwise no pair can. Greedy on the top bit is valid because one higher bit outweighs all lower bits together. O(31 n) time, O(n) space.`,
        check: `assert max_xor([3, 10, 5, 25, 2, 8]) == 28
assert max_xor([7]) == 0
assert max_xor([0, 0]) == 0
assert max_xor([1, 2]) == 3
assert max_xor([2147483647, 0]) == 2147483647
assert max_xor([8, 10, 2]) == 10
import random
for _ in range(300):
    a = [random.randint(0, 1000) for _ in range(random.randint(1, 9))]
    assert max_xor(a) == max(x ^ y for x in a for y in a)`
      }
    ],

    how: {
      136: `I restate it: every value appears twice except one, and I must return that one using a single pass and constant memory. A hash map of counts or a set that toggles membership is O(n) memory, and sorting is O(n log n). The problem is asking for an operation that undoes itself. XOR does: v ^ v = 0 and x ^ 0 = x. XOR is also commutative and associative, so the order of the numbers does not matter, and two equal numbers cancel even if they are far apart in the list. So I start a variable at 0 (the do-nothing value for XOR) and XOR every number into it. Every pair collapses to 0, and only the loner survives. Trace [4, 1, 2, 1, 2]: 0 ^ 4 = 4, 4 ^ 1 = 5, 5 ^ 2 = 7, 7 ^ 1 = 6, 6 ^ 2 = 4. Answer 4. Negatives work, because XOR acts bit by bit on the stored pattern and a ^ a = 0 for any pattern; [-3, 5, 5] gives -3. A single element is its own answer. The assumption I would state to an interviewer is that all others appear an even number of times, otherwise XOR keeps them. Cost: O(n) time, O(1) space.`,
      191: `I restate it: count the 1 bits in a 32-bit pattern. The obvious way is to test the lowest bit with n & 1, count it, shift right, and repeat 32 times. That is O(32), which is acceptable, but it runs a fixed 32 rounds even for a number with one 1 bit, and a signed right shift on a negative number copies the sign bit in forever, so I would need a zero-filling shift or a fixed loop count. The observation: n - 1 flips the lowest set bit to 0 and every 0 below it to 1, leaving bits above alone. So n & (n - 1) is n with its lowest set bit erased. If I repeat that until n is 0 and count the rounds, the count is the number of 1 bits, and the loop runs once per set bit, never shifting. Trace n = 11 = 1011: 1011 & 1010 = 1010 (1), 1010 & 1001 = 1000 (2), 1000 & 0111 = 0 (3). Answer 3. In Python, a negative input never reaches 0 because it is an infinite row of 1s, so I mask with 0xFFFFFFFF first; in C++ I use unsigned so n - 1 cannot overflow. Edge cases: 0 gives 0; all 32 bits set gives 32. Cost: O(k) for k set bits, at most 32, and O(1) space.`,
      338: `I restate it: for every i from 0 to n, report how many 1 bits i has, as a list. Calling a popcount for each number works, O(n log n), but the numbers share most of their bits, so I am repeating work. The observation: i without its last bit is i >> 1, a smaller number whose answer I have already stored. So the 1-count of i equals the 1-count of i >> 1, plus 1 if the dropped bit was 1, which is i & 1. That gives dp[i] = dp[i >> 1] + (i & 1) with dp[0] = 0, filled in increasing order. i >> 1 is always smaller than i for i >= 1, so it is always ready. Trace: dp[1] = dp[0] + 1 = 1; dp[2] = dp[1] + 0 = 1; dp[3] = dp[1] + 1 = 2; dp[4] = dp[2] + 0 = 1; dp[5] = dp[2] + 1 = 2. Result [0,1,1,2,1,2], matching 0, 1, 10, 11, 100, 101. An equivalent recurrence erases the lowest set bit instead: dp[i] = dp[i & (i - 1)] + 1. Edge case: n = 0 gives [0]. Cost: each entry is O(1), so O(n) time and O(n) space, which is the output itself.`,
      371: `I restate it: add two integers without the plus or minus operators. Looping b times and incrementing is impossible without plus and is O(value) anyway. The observation comes from adding by hand: write down each column's digit and carry. In binary, adding two bits without the carry is XOR (1 + 0 gives 1, 1 + 1 gives 0). A carry appears only where both bits are 1, which is a & b, and it belongs one column to the left, so (a & b) << 1. Therefore a + b equals (a ^ b) + ((a & b) << 1): the sum without carries plus the carries. That is the same problem again, but the carry keeps moving left and eventually falls off, so I repeat: set a to the XOR, b to the shifted carry, until b is 0. Trace 2 + 3: a = 010, b = 011. XOR = 001, carry = (010) << 1 = 100. Next a = 001, b = 100: XOR = 101, carry = 0. Done: 101 = 5. Fixed-width two's complement handles negatives automatically in Java and JavaScript. In Python integers are unbounded, so I mask both values to 32 bits each round, and at the end convert a result above 0x7FFFFFFF back to negative with ~(a ^ 0xFFFFFFFF). Cost: at most 32 rounds, so O(1) time and space.`,
      190: `I restate it: reverse the order of the 32 bits of an unsigned integer and return the result. Converting to a 32-character binary string, reversing and parsing works but is clumsy, and leading zeros must be kept. The cleaner idea: peel bits off n from the lowest end and push them onto the result from the low end too, shifting the result along. After 32 rounds, the first bit I peeled has been pushed upward 31 times and sits at the top. Each round: result = (result << 1) | (n & 1), then n >>= 1. I must run exactly 32 rounds even if n becomes 0 early, otherwise the leading zeros of the original would not appear as trailing zeros of the answer. In Java and JavaScript I use >>> for n so a set top bit does not smear in copies of the sign, and in JavaScript I return result >>> 0 so the answer is read as unsigned. Trace on 4 bits for brevity, n = 0010: peel 0 (res 0), peel 1 (res 01), peel 0 (res 010), peel 0 (res 0100), so 0010 becomes 0100. With 32 bits, 2 becomes 2^30 = 1073741824. Edge cases: 0 gives 0. Cost: 32 rounds, O(1) time and space.`,
      268: `I restate it: a list of n distinct numbers from 0 to n with exactly one missing; find it. Sorting and scanning is O(n log n), a set is O(n) memory. The statement suggests two O(1)-space formulas. The sum: the numbers 0..n add up to n(n+1)/2, so the missing one is that total minus the sum of the list; it is simple, but the total can overflow in fixed-width languages. The XOR way: every present number appears once as an index (0..n) and once as a value in the list, so XOR-ing all indices and all values cancels every present number and leaves the missing one, because it appears only as an index. XOR never grows beyond the word, so it cannot overflow. Index n has no matching list slot, so I start x at n, then for each position i do x ^= i ^ nums[i]. Trace [3, 0, 1], n = 3: x = 3; i = 0: 3 ^ 0 ^ 3 = 0; i = 1: 0 ^ 1 ^ 0 = 1; i = 2: 1 ^ 2 ^ 1 = 2. Answer 2. Edge cases: [0] gives 1 (the missing value is n); [1] gives 0. Cost: O(n) time, O(1) space.`,
      7: `I restate it: reverse the digits of a 32-bit signed integer and return the result, or 0 if the reversed value is outside the 32-bit range. The digit work is simple: peel the last digit with x % 10, drop it with integer division, and append it to the result with res * 10 + digit. The danger is overflow. In Java and C++ I cannot check after the multiply because the value has already wrapped, so I must check before. The limits are 2147483647 and -2147483648. Before computing res * 10 + d, if res is larger than 214748364 (that is MAX / 10), the multiply would overflow; if res equals 214748364, then d must be at most 7 (the last digit of MAX). The negative side mirrors it with d at least -8. Mind that % and / treat negatives differently across languages, which is why in Python I work with the absolute value, reverse it with no worry about overflow, then reapply the sign and test the range once at the end. Trace 123: digits 3, 2, 1 build 3, 32, 321. Trace -120: sign -1, abs 120 reverses to 021 = 21, result -21. Trace 1534236469: its reverse 9646324351 exceeds the limit, so return 0. Edge cases: 0, trailing zeros. Cost: O(number of digits) time, O(1) space.`,
      231: `I restate it: decide whether n is a power of two, such as 1, 2, 4, 8, 16. Brute force divides by two repeatedly while the number is even and checks if you end at 1, O(log n). The bit view is neater. In binary a power of two is a single 1 followed by zeros: 1, 10, 100, 1000. So it has exactly one set bit. The observation I already know: n & (n - 1) erases the lowest set bit. If there is exactly one set bit, erasing it leaves 0; if there were two or more, something remains. So the test is n & (n - 1) == 0. Trace 16 = 10000: 15 = 01111, and 10000 & 01111 = 0, so yes. Trace 12 = 1100: 11 = 1011, 1100 & 1011 = 1000, not 0, so no. Two edge cases matter. n = 0: 0 & (-1) is 0, so the bare test wrongly says yes, but 0 is not a power of two, so I need n > 0. Negative numbers are not powers of two either, and the n > 0 guard excludes them. Final one-liner: n > 0 and n & (n - 1) == 0. Cost: O(1) time and space.`,
      201: `I restate it: given left and right, return the bitwise AND of every integer from left to right inclusive. Looping through the whole range and ANDing is O(right - left), which can be two billion steps. The observation: look at any bit position. If it takes both values 0 and 1 somewhere across the range, the AND at that bit is 0. As you count upward from left to right, if left and right differ at some bit, then every lower bit than that has gone through both 0 and 1 (counting rolls them over). So the only bits that can survive are the common leading bits of left and right, the shared prefix, followed by zeros. To get that prefix, I can shift both right until they are equal, then shift back; or equivalently clear the lowest set bit of right with right &= right - 1 while right is greater than left, which strips the differing low bits one at a time. When they meet, right equals the shared prefix padded with zeros. Trace left = 5 (101), right = 7 (111): 7 & 6 = 6 (110), still greater than 5; 6 & 5 = 4 (100), now not greater than 5. Answer 4. Check by hand: 5 & 6 & 7 = 4. Edge cases: left equals right returns itself; a range from 1 to 2^31 - 1 gives 0. Cost: at most 31 rounds, O(1).`,
      137: `I restate it: every value appears three times except one, which appears once; find it with constant memory. XOR no longer helps directly, because three equal values XOR to the value itself. A hash map of counts works in O(n) memory, which I want to avoid. The observation is to think one bit position at a time. Among the numbers, the count of numbers with a given bit set is a multiple of 3 for all the triples, plus 1 if the loner has that bit. So count mod 3 at each of the 32 positions gives the loner's bit. That works with 32 counters, but I can compress those 32 counters mod 3 into two integers: each bit position needs a counter that runs 0, 1, 2 and then wraps to 0, which takes two bits of state, and I keep one bit in \`ones\` and the other in \`twos\`, for all 32 positions at once. For each number v: ones = (ones ^ v) & ~twos, then twos = (twos ^ v) & ~ones. Trace a single bit seen three times: (ones, twos) goes (0,0) to (1,0), then (0,1), then (0,0). So bits seen three times return to zero and only a bit seen once remains in ones. Trace [2, 2, 3, 2]: the end result in ones is 3. Negatives work because each bit position is treated alike. Cost: O(n) time, O(1) space.`
    }
  };
})();
