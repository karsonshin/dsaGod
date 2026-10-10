/* Offer Ready: extra lesson material for this topic (primer, breakdown, think, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['arrays-hashing'] = {
    primer: {
      kind: 'structure',
      what: `An **array** (Python \`list\`) is a row of numbered boxes. A **hash table** is a coat-check desk: you hand over a name tag and the attendant goes straight to the right hook without searching. Python's \`dict\` is a hash table of key to value; a \`set\` is one that stores keys only.`,
      does: `Array: read or write \`a[i]\` in O(1), append at the end in O(1) amortized, insert or search in the middle in O(n). \`dict\` and \`set\`: insert, lookup, delete and "is it there?" in O(1) on average, but keys have no sorted order to rely on and must be hashable (numbers, strings, tuples).`,
      impl: `An array is one block of memory, so box i sits at a fixed distance from box 0. A hash table runs the key through \`hash(key)\`, turns the number into a bucket position, and looks only in that bucket; if two keys land together they share it. In Python use \`dict\`, \`set\`, \`Counter\` and \`defaultdict(list)\`.`,
      possibilities: `Detect duplicates (set). Find a pair that sums to a target (value to index map). Count frequencies, anagrams or majority (Counter). Group items by a shared signature (dict of lists). Longest runs and subarray-sum questions (set or prefix map). Rebuilding "O(n²) loops" as one O(n) pass is the most common interview move.`
    },
    breakdown: [
      {
        title: 'Step 1: the array, boxes you reach by number',
        body: `Memory is a long street of equal-sized houses. An array takes a stretch of consecutive houses, so box 5 is exactly five houses from box 0. That is why \`a[5]\` is **O(1)**: no searching, just arithmetic.

The price: finding a *value* (not a position) means opening boxes one by one, O(n), and putting something in the middle shifts everything after it, O(n).

Trace \`a = [7, 3, 9]\`. \`a[2]\` is 9 immediately. \`3 in a\` checks 7, then 3: 2 steps. \`a.insert(0, 1)\` moves 7, 3 and 9 each one place right.

State we track in most array problems: an index (or two), and a running value (a sum, a best, a count). Edge cases: empty array, one element, all equal, negative values. Cue: the problem hands you positions and asks about values nearby or in total.`
      },
      {
        title: 'Step 2: the hash table, computing where to look',
        body: `Imagine a wall of 8 mail slots. To file "ann" you turn the word into a number with a fixed rule (say, add the letter codes) and take the remainder after dividing by 8; that is the slot. To find "ann" later, apply the same rule and look in just that slot. You never search the wall.

That rule is the **hash function**, the slots are **buckets**. Two keys can land in the same bucket (a **collision**); then the bucket holds both and a lookup compares the few keys in it. With a well spread hash and a table that grows as it fills, buckets stay tiny, so lookup is **O(1) on average**. In the worst case (everything collides) it is O(n), which is why we say "on average".

Rule of thumb: if you keep asking "have I seen this?" or "how many times?" for different values, store the answer in a dict or set instead of scanning. (Inside view: the *Hashing internals* topic.)`
      },
      {
        title: 'Step 3: set, "have I seen this before?"',
        body: `Problem shape: does anything repeat? The slow way compares every pair: O(n²). The fast way keeps a **set** of what you have passed.

Trace \`[4, 7, 4]\`. Start \`seen = {}\`. Read 4: not in seen, so add: \`{4}\`. Read 7: not in seen, add: \`{4, 7}\`. Read 4: in seen, so a repeat. Return True. Three steps.

The loop in words: for each x, **ask first, add second**. If you add first, every element finds itself. Edge cases: empty input (no repeat), one element (no repeat). Cost: n steps, each O(1) on average, so O(n) time, O(n) space for the set.

Cues: "duplicate", "first repeated", "visited", "already used", "distinct". Cousins: set for membership of a fixed list too (build the set once, then each query is O(1)).`,
        code: { py: `def has_repeat(nums):\n    seen = set()\n    for x in nums:\n        if x in seen:      # ask first\n            return True\n        seen.add(x)        # then remember\n    return False` }
      },
      {
        title: 'Step 4: dict, remember something about each key',
        body: `A set remembers *that* you saw x. A **dict** remembers *something about it*: how many times, where, or which items share it.

Counting: trace \`"banana"\` into \`counts\`: b→1, a→1, n→1, a→2, n→2, a→3. Result \`{'b':1,'a':3,'n':2}\`. Use \`Counter("banana")\` or \`counts[x] = counts.get(x, 0) + 1\`.

Complement search (Two Sum): for each x, the partner is \`target − x\`. Store \`value → index\` of numbers already passed, and ask whether the partner is in the dict *before* storing x. Trace \`[2, 7, 11]\`, target 9: x=2, need 7, not found, store {2:0}; x=7, need 2, found at 0, answer [0, 1].

State: key (what you search by), value (what you need back). Decide those two first. Edge cases: duplicates (\`[3, 3]\`, target 6), no answer, negatives. Cost O(n) time and space.`,
        code: { py: `def two_sum(nums, target):\n    seen = {}                      # value -> index\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n    return []` }
      },
      {
        title: 'Step 5: group by a signature',
        body: `Sometimes the question is "which items belong together?". Find a **signature**: a key that is the same for every member of a group and different across groups. Then a \`dict\` of key to list does the whole job.

Trace anagrams \`["eat", "tea", "tan"]\`. Signature = letters sorted. eat→"aet", tea→"aet", tan→"ant". Groups: \`{"aet": ["eat","tea"], "ant": ["tan"]}\`. Each word goes straight to its group, no pair comparisons, so O(n·L log L) for n words of length L, instead of O(n²·L).

The key must be hashable and canonical: a list cannot be a key (use a tuple, or join to a string). Empty strings are valid and group together. Cue: "group", "same after reordering", "same shape", "same pattern". Other signatures: letter-count tuple, gap pattern between letters, a reduced fraction.`,
        code: { py: `from collections import defaultdict\ngroups = defaultdict(list)\nfor w in ["eat", "tea", "tan"]:\n    groups["".join(sorted(w))].append(w)\nprint(list(groups.values()))  # [['eat', 'tea'], ['tan']]` }
      },
      {
        title: 'Step 6: when the keys are small, the array is the hash table',
        body: `If the keys are small whole numbers (26 letters, values 1..n), you do not need hashing: use an array whose index *is* the key. Counting letters: \`counts = [0] * 26\` and \`counts[ord(c) - 97] += 1\`.

Even better, when the values are exactly 1..n, the input array can serve as its own table. Trace \`[3, 1, 3]\` (values 1..3, find missing): for x=3 flip the sign at index 2: \`[3, 1, -3]\`; x=1 flip index 0: \`[-3, 1, -3]\`; x=|-3|=3 again (already negative, leave it). Positive slot remaining: index 1, so value 2 is missing. It uses O(1) extra space, but it changes the input.

Use a bucket array for frequencies too: a count is at most n, so index by count (Top K Frequent in O(n)). Cue: "values in range 1..n", "only lowercase letters", "ask for O(1) extra space".`
      }
    ],
    think: [
      {
        q: `In Two Sum you write \`seen[x] = i\` first and then check \`target - x in seen\`. What goes wrong for \`nums = [3, 2, 4]\` and target 6?`,
        a: `At index 0, x = 3: you store 3, then look for 6 − 3 = 3 and find the 3 you *just stored*, so you return \`[0, 0]\`, an element paired with itself. The right answer is \`[1, 2]\` (2 + 4). Looking *before* storing guarantees every match is with an earlier element. Remember the rule as: ask the past, then add the present.`
      },
      {
        q: `You need to know whether two strings are anagrams. Why does sorting both work, and why is counting better?`,
        a: `Sorting puts equal multisets of letters into the same order, so equal sorted strings mean anagrams; cost O(n log n). Counting each letter (a \`Counter\` or a 26-slot array) and comparing the counts costs O(n), because order never mattered, only how many of each letter. The aha: if order is irrelevant, don't pay for ordering.`
      },
      {
        q: `Why is looking something up in a Python \`dict\` O(1) while \`x in my_list\` is O(n)?`,
        a: `A list has no idea where x is, so it checks box after box. A dict turns the key into a bucket position with the hash function and checks only that bucket, so the work does not depend on how many keys are stored. Caveat: "O(1) on average"; many collisions make a bucket long, and hashing a long string key takes time proportional to its length.`
      },
      {
        q: `Which structure for each: (a) is any value repeated, (b) how often does each word appear, (c) which words are rearrangements of each other?`,
        a: `(a) a **set**: only "seen or not" matters. (b) a **dict of counts** (\`Counter\`): you need a number per word. (c) a **dict of lists** keyed by a signature such as the sorted letters: you need to collect members. The aha: choose by what you must remember per key: nothing, a number, or a list.`
      },
      {
        q: `The values are known to be between 1 and n in an array of length n. How can you find which values are missing using no extra memory?`,
        a: `Use the array as its own table. For each value v, mark slot v − 1 by turning its number negative. After the pass, any slot that is still positive means its value v = index + 1 never appeared. It is a hash table where the hash function is "v − 1", so there are no collisions. The cost: the input is modified, which you should mention.`
      },
      {
        q: `Why can't \`[1, 2]\` be a dict key in Python, but \`(1, 2)\` can? What do you do to group rows of numbers?`,
        a: `A key's hash must not change while it is stored, and a list can be edited, so Python refuses it (unhashable). A tuple cannot be edited, so it is safe. To group rows, convert each row with \`tuple(row)\` (or build a string) and use that as the key. In JavaScript or Java arrays hash by identity, so two equal arrays would not match; join them into a string key there.`
      }
    ],
    drills: [
      {
        title: 'First letter to repeat',
        q: `Given a string, return the letter whose *second* appearance comes earliest. If no letter repeats, return \`None\`. Example: \`"abcbca"\` gives \`"b"\` (its second appearance at index 3 comes before the second \`c\` at index 4); \`"abc"\` gives \`None\`.`,
        hint: `Walk left to right and remember what you have passed. The first time you meet a letter you remember, that is the answer.`,
        how: `Restating: I want the letter whose second occurrence appears earliest in the string, not the first letter that happens to have a duplicate somewhere.

Brute force: for each position j, scan the positions before it to see whether the same letter appeared. The first j where that is true gives the answer. That is O(n²) because each j rescans its past.

The bottleneck is the question "have I seen this letter?" asked again and again. That is membership, and a set answers it in O(1) on average. The observation that settles the ordering: if I walk left to right and stop at the first letter that is already in my set, I have found the earliest *second* occurrence, because every position before it was a first occurrence or was checked already.

Trace \`"abcbca"\`: a not seen, add; b add; c add; b is in the set, so return \`"b"\`. I never reach the second c at index 4, which is correct because b repeated at index 3 first.

Edge cases: empty string and all-distinct strings return \`None\`; case sensitivity ('A' and 'a' differ) unless told otherwise; a long run like \`"aa"\` returns 'a' at index 1.

Cost: one pass with O(1) average per step: O(n) time. Space is O(min(n, alphabet)), at most 26 for lowercase letters, so O(1) in that case.`,
        code: { py: `def first_repeat(s):\n    seen = set()\n    for ch in s:\n        if ch in seen:\n            return ch\n        seen.add(ch)\n    return None` },
        explain: `Scanning in order, the first letter found already in the set is the one whose second occurrence has the smallest index, since any earlier index belonged to a first occurrence. Time O(n) average, space O(k) for k distinct letters.`,
        check: `assert first_repeat("abcbca") == "b"
assert first_repeat("abc") is None
assert first_repeat("") is None
assert first_repeat("aa") == "a"
assert first_repeat("xyzzyx") == "z"
assert first_repeat("Aa") is None`
      },
      {
        title: 'Count the pairs that hit the target',
        q: `Count index pairs \`i < j\` with \`nums[i] + nums[j] == target\`. The list may contain duplicates. Example: \`[1, 5, 1, 5]\` with target 6 gives 4 (pairs of indices (0,1), (0,3), (1,2), (2,3)).`,
        hint: `When you reach x, how many earlier numbers would pair with it? Keep a count of each value you have passed.`,
        how: `Restating: count pairs of positions, so duplicates make several pairs, not one.

Brute force: two nested loops over every i < j, check the sum, O(n²). For n = 10⁵ that is five billion checks.

The bottleneck is the inner loop, which hunts for partners of x. But the partner is determined: it must equal \`target − x\`. So the real question is "how many earlier elements equal target − x?". That is a counting question, so I keep a dict (a \`Counter\`) from value to how many times I have passed it.

The structure: walk left to right. At x, add \`seen[target − x]\` to the answer (every earlier element with that value forms one pair with this x), then record x in the counter. Looking before recording matters when x is its own partner, such as 3 + 3 = 6: a number should not pair with itself, only with earlier copies.

Trace \`[1,5,1,5]\`, target 6: x=1: partners of 5 seen: 0; record 1. x=5: need 1, seen 1, so answer 1; record 5. x=1: need 5, seen 1, so answer 2; record 1 (count 2). x=5: need 1, seen 2, so answer 4. Total 4.

Edge cases: empty list gives 0; negatives; target is twice a value (all pairs of copies), e.g. \`[3,3,3]\` target 6 gives 3.

Cost: O(n) time on average, O(n) space.`,
        code: { py: `from collections import Counter\n\ndef count_pairs(nums, target):\n    seen = Counter()\n    pairs = 0\n    for x in nums:\n        pairs += seen[target - x]   # earlier partners; Counter returns 0 if missing\n        seen[x] += 1\n    return pairs` },
        explain: `Every pair (i, j) with i < j is counted exactly once, when we reach j: all earlier elements equal to target − nums[j] are in the counter. Counting before inserting stops an element from pairing with itself. O(n) time on average, O(n) space.`,
        check: `assert count_pairs([1, 5, 1, 5], 6) == 4
assert count_pairs([], 3) == 0
assert count_pairs([3, 3, 3], 6) == 3
assert count_pairs([1, 2, 3], 10) == 0
assert count_pairs([-2, 2, 0, 0], 0) == 2
assert count_pairs([4], 8) == 0`
      },
      {
        title: 'Longest balanced stretch of 0s and 1s',
        q: `Given a list of 0s and 1s, return the length of the longest contiguous stretch that has the same number of 0s and 1s (0 if none). Example: \`[0, 1, 0, 0, 1, 1, 0]\` gives 6 (the first six values hold three 0s and three 1s).`,
        hint: `Give each 0 a score of -1 and each 1 a score of +1, keep a running total, and ask when the same total has appeared before.`,
        how: `Restating: find the longest block with equal numbers of 0s and 1s.

Brute force: try every start and end and count: O(n²) with a running count, O(n³) if I recount each block. Both are too slow for 10⁵ values.

The observation: replace each 0 by -1. Now "equal 0s and 1s" means "the block sums to zero". Let \`bal\` be the running total after position i. A block from i+1 to j sums to zero exactly when \`bal\` after j equals \`bal\` after i. So I want the two farthest-apart positions with the same running total.

Structure: a dict from running total to the **first** index where it occurred. To maximize the length for a given total, I only ever want the earliest index, so I never overwrite it. I seed it with \`{0: -1}\`: the empty prefix before the array has total 0 at index -1, which lets a block that starts at index 0 be found.

Trace \`[0,1,0,0,1,1,0]\`: totals after each index are -1, 0, -1, -2, -1, 0, -1. First seen: -1 at 0, 0 at -1 (seed), -2 at 3. At index 5 the total is 0 again, length 5 − (−1) = 6. At index 6 the total is -1, first at 0, so length 6. Best is 6.

Edge cases: empty list or all equal values give 0; the whole array can be balanced.

Cost: one pass, O(n) time on average, O(n) space.`,
        code: { py: `def longest_balanced(bits):\n    first = {0: -1}          # running total -> earliest index\n    bal = best = 0\n    for i, b in enumerate(bits):\n        bal += 1 if b else -1\n        if bal in first:\n            best = max(best, i - first[bal])\n        else:\n            first[bal] = i\n    return best` },
        explain: `With 0 as -1, a block is balanced iff its prefix totals at both ends are equal. Storing only the first index per total makes each candidate block as long as possible. One pass with O(1) average dict work: O(n) time, O(n) space.`,
        check: `assert longest_balanced([0, 1, 0, 0, 1, 1, 0]) == 6
assert longest_balanced([]) == 0
assert longest_balanced([1, 1, 1]) == 0
assert longest_balanced([0, 1]) == 2
assert longest_balanced([1, 0, 0, 1, 1]) == 4
assert longest_balanced([0, 0, 1, 0, 0, 0, 1, 1]) == 6`
      },
      {
        title: 'Subarrays whose sum is a multiple of m',
        q: `Given a list of integers (possibly negative) and a positive integer \`m\`, count the contiguous subarrays whose sum is divisible by \`m\`. Example: \`[2, 3, 5]\` with \`m = 5\` gives 3 (\`[2,3]\`, \`[5]\`, \`[2,3,5]\`).`,
        hint: `Write the running total mod m after each element. Two equal remainders at different spots mean the part between them is divisible. Count equal remainders.`,
        how: `Restating: count the blocks whose sum leaves remainder 0 when divided by m.

Brute force: for each start and end, add the block up, O(n²) with running sums. Too slow when n is large.

The observation uses prefix sums. Let \`P[i]\` be the sum of the first i numbers. A block between positions i and j has sum \`P[j] − P[i]\`. That is divisible by m exactly when P[j] and P[i] leave the same remainder. So I do not need sums, only remainders, and the question becomes: how many pairs of prefixes share a remainder?

Structure: a Counter from remainder to how many prefixes had it. Walk once, keep \`pref = (pref + x) % m\`, add \`seen[pref]\` (earlier prefixes with the same remainder, each one is a block ending here) and then increment. I seed the counter with \`{0: 1}\` for the empty prefix, so a block starting at index 0 counts.

Trace \`[2,3,5]\`, m = 5: pref 2: seen[2]=0, now {0:1,2:1}. pref 0: seen[0]=1 so total 1, now {0:2,2:1}. pref 0: seen[0]=2 so total 3. Answer 3.

Edge cases: negatives. Python's % returns a value in 0..m−1 even for negatives, so remainders compare correctly; in Java or C++ I would normalize with \`((r % m) + m) % m\`. Empty list gives 0; m = 1 makes every subarray count.

Cost: O(n) time, O(min(n, m)) space.`,
        code: { py: `from collections import Counter\n\ndef count_divisible(nums, m):\n    seen = Counter({0: 1})   # the empty prefix has remainder 0\n    pref = total = 0\n    for x in nums:\n        pref = (pref + x) % m\n        total += seen[pref]  # earlier prefixes with the same remainder\n        seen[pref] += 1\n    return total` },
        explain: `The block (i, j] has sum P[j] − P[i], divisible by m iff P[i] ≡ P[j] (mod m). Each pair of equal-remainder prefixes (including the empty prefix) is exactly one block, and counting before incrementing counts each pair once. O(n) time, O(min(n, m)) space.`,
        check: `assert count_divisible([2, 3, 5], 5) == 3
assert count_divisible([4, 5, 0, -2, -3, 1], 5) == 7
assert count_divisible([], 3) == 0
assert count_divisible([1], 1) == 1
assert count_divisible([1, 2], 5) == 0
assert count_divisible([-1, 1], 2) == 1`
      }
    ],
    how: {
      217: `Restate: is any value present more than once? Brute force: compare every pair, O(n²) time, O(1) space. The bottleneck is that each element re-scans the others to ask "have I seen you?". A set answers that question in O(1) on average. So I can ask the set instead of scanning. The existing solution is the one-liner: build a set from the list and compare sizes. A set keeps one copy of each value, so if any value repeats, the set is smaller than the list. Trace \`[1,2,3,1]\`: the set is {1,2,3}, size 3, list size 4, so True. For \`[1,2,3]\` both are 3, so False. Edge cases: an empty list gives False; one element gives False. Cost: O(n) time on average and O(n) space for the set. The explicit loop version, adding to the set and returning True at the first repeat, has the same cost but stops early. If the interviewer says memory is tight, I switch to sorting and comparing neighbours: O(n log n) time, no extra set.`,
      242: `Restate: do two strings contain the same letters with the same counts? Brute force: sort both and compare, O(n log n). It works but orders letters I do not need ordered. What matters is how many of each. The existing solution uses a fixed array of 26 counters: for each pair of letters at the same position, add 1 for the letter from s and subtract 1 for the letter from t. If the strings are anagrams, every counter ends at 0. First, if lengths differ, return False immediately. Trace \`"rat"\` and \`"tar"\`: r: +1, −1 (from tar's r) and so on; every slot returns to 0, so True. For \`"ab"\` and \`"bb"\`: a ends at +1, b at −1, so some slot is nonzero, False. Edge cases: empty strings (True), different lengths, repeated letters. The array is the hash table here because keys are just 26 small integers. If the problem allowed Unicode, I would use a dict or \`Counter\`. Cost: O(n) time, O(1) space.`,
      383: `Restate: can the ransom note be built using letters from the magazine, using each magazine letter at most once? Brute force: for each note letter, search the magazine for an unused copy and cross it out, O(n·m). The bottleneck is searching. The observation: only how many of each letter I have matters. So I count the magazine once with a \`Counter\` (a pool of letters). Then for each letter in the note, if the pool has none left, return False; otherwise spend one. Trace note \`"aab"\`, magazine \`"baa"\`: pool {b:1,a:2}; spend a (1 left), spend a (0 left), spend b (0 left): True. Note \`"aa"\`, magazine \`"ab"\`: the second a finds 0, False. Edge cases: empty note is True; note longer than magazine is always False. Counter returns 0 for a missing letter without inserting, which is why the check is safe. Cost: O(n + m) time, and O(1) space for lowercase letters (at most 26 keys).`,
      169: `Restate: find the value that appears more than n/2 times (it is guaranteed to exist). Brute force: for each element count its copies, O(n²). The bottleneck is recounting. Counting everything once with a \`Counter\` takes O(n), and then the answer is the value with the largest count: \`max(counts, key=counts.get)\`. Trace \`[2,2,1,1,1,2,2]\`: counts 2→4, 1→3; the max is 2. Edge cases: a one-element list returns it; the guarantee means no tie. Cost: O(n) time, O(n) space. If the interviewer asks for O(1) space, I'd offer Boyer-Moore voting: keep a candidate and a counter, add one for a match and subtract one for a non-match, replace the candidate when the counter hits zero. It works because a true majority has more copies than all other values combined, so it cannot be cancelled out entirely. Sorting and taking the middle element is another option, O(n log n).`,
      1: `Restate: find two different positions whose values add to the target. Brute force: try every pair, O(n²). The bottleneck is the inner loop, which hunts for the partner of each number. But the partner is known: target minus x. So I replace the search with a lookup in a dict from value to index. Walk the list; for each x, if \`target − x\` is in the dict, return its index and the current index; otherwise store x with its index. Look first, store second, so a number cannot pair with itself. Trace \`[3,2,4]\` with target 6: x=3, need 3, not in the dict, store {3:0}. x=2, need 4, store {3:0,2:1}. x=4, need 2, found at 1, return [1,2]. If I had stored first, x=3 would have matched itself and returned [0,0]. Edge cases: duplicates like \`[3,3]\` (works because the first 3 is stored before the second is checked), negatives, no solution. Cost: O(n) time on average, O(n) space.`,
      205: `Restate: can I rename letters of s one-to-one to get t? "One-to-one" means two rules: the same letter must always map to the same partner, and two different letters may not map to the same partner. Brute force: try assigning mappings by trial, which is clumsy. The observation: I can check both rules as I walk the strings in parallel, using two dicts, one for s to t and one for t to s. For each pair of letters (x, y): if x was already mapped to something other than y, fail; if y was already claimed by a different x, fail; otherwise record. The existing solution does this with \`setdefault\`, which returns the existing value or stores the new one. Trace \`"egg"\` and \`"add"\`: e to a, g to d, then g to d again matches: True. For \`"foo"\` and \`"bar"\`: o would need to map to both a and r: False. For \`"badc"\` and \`"baba"\`: d and b would both map to b, so the reverse map catches it: False. Cost: O(n) time, O(1) space for a bounded alphabet.`,
      49: `Restate: put words that are anagrams of each other into the same group. Brute force: compare every pair of words with an anagram test, O(n²) tests. The bottleneck is comparing pairs. The observation: all anagrams become identical when their letters are sorted, so the sorted string is a **signature** that is the same inside a group and different between groups. A dict from signature to list of words then sorts everything with one pass. I use \`defaultdict(list)\` so a new signature starts with an empty list. Trace \`["eat","tea","tan","ate"]\`: signatures aet, aet, ant, aet; groups {aet: [eat, tea, ate], ant: [tan]}; return the dict's values. The key must be a string or tuple, not a list. Edge cases: an empty string is valid, with signature ""; one word; words of different lengths never collide. Cost: O(n · L log L) for n words of length L, since each is sorted once; a 26-count tuple as the key lowers it to O(n · L).`,
      347: `Restate: return the k values that appear most often. Brute force: count and sort the counts, O(n log n). That is acceptable, and I would say so first. The next observation: a frequency can be at most n, so frequencies are small whole numbers that can be array indexes. After counting with a Counter, I make n + 1 empty buckets and put each value into the bucket numbered by its count. Then I walk the buckets from the highest index down, collecting values until I have k. No sorting at all. Trace \`[1,1,1,2,2,3]\`, k = 2: counts 1→3, 2→2, 3→1; buckets[3] = [1], buckets[2] = [2], buckets[1] = [3]. Walking down from 6: take 1, take 2, stop. Edge cases: k equals the number of distinct values; a single value; ties across the cut do not occur because the answer is guaranteed unique. Cost: O(n) time and space. A min-heap of size k is another valid answer at O(n log k). This is the array-as-hash-table idea.`,
      238: `Restate: for each position, the product of all the other numbers, with no division. Brute force: for each i multiply everything except i, O(n²). Using division (total product divided by nums[i]) fails when there are zeros and is not allowed. The observation: the product of everything except i is the product of everything to the left of i times everything to the right. Both can be built by running products. So I make the output array with two passes. Left to right: out[i] holds the product of nums[0..i−1] (keep a running \`left\`). Right to left: multiply out[i] by the product of nums[i+1..] (keep a running \`right\`). Trace \`[1,2,3,4]\`: after the left pass out is [1,1,2,6]; the right products, from the last index back to the first, are 1, 4, 12, 24, so out becomes [1×24, 1×12, 2×4, 6×1] = [24,12,8,6]. Edge cases: zeros work naturally; two elements swap places. Cost: O(n) time, O(1) extra space beyond the output.`,
      448: `Restate: the array has n values in the range 1..n, some repeated, so some values are missing; list the missing ones. Brute force: put everything in a set, then check each 1..n: O(n) time and O(n) space. The bottleneck is only memory. The observation: the values are valid indexes (value v belongs at index v − 1), so the array can serve as its own presence table. For each value v, go to index |v| − 1 and make that number negative, which says "v exists". Use \`abs\` because the number I am reading may already have been flipped. After the pass, any index that still holds a positive number was never marked, so value index + 1 is missing. Trace \`[4,3,2,7,8,2,3,1]\`: marking flips indexes 3, 2, 1, 6, 7, then the repeated 2 and 3 are already negative, then index 0. Indexes 4 and 5 stay positive, so the answer is [5, 6]. Cost: O(n) time, O(1) extra space, but the input is modified; I would say so, and restore the signs if needed.`,
      128: `Restate: the length of the longest run of consecutive integers (like 4,5,6,7) that can be formed from the values in any order, in O(n). Brute force: sort and scan for runs, O(n log n). The bottleneck is the sort, which I try to avoid with a set, so that "is x + 1 here?" is O(1). The naive set solution starts a counting loop at every element, and a long run gets walked from every member, which is O(n²). The observation: only count from the **start** of a run, a value x whose predecessor x − 1 is not in the set. Every run has exactly one start, so each element is stepped over by one while-loop only. Trace \`[100,4,200,1,3,2]\`: set contains all; 100 is a start (99 absent), run length 1; 4 is not a start (3 present); 200 is a start, length 1; 1 is a start (0 absent), walk 2, 3, 4 giving length 4. Best 4. Edge cases: empty input gives 0; duplicates vanish in the set; negatives work. Cost: O(n) time and space.`,
      36: `Restate: is a partly filled 9×9 Sudoku board valid so far? A digit may not repeat in any row, column or 3×3 box (I do not need to solve it). Brute force: for each filled cell, scan its row, column and box for the same digit, which is a constant amount of work per cell but a lot of code. The cleaner idea is the seen-before pattern with one set that stores tagged tuples. For every digit v at row r and column c, there are three facts to record: \`('row', r, v)\`, \`('col', c, v)\` and \`('box', r // 3, c // 3, v)\`. If any of them is already in the set, the board is invalid; otherwise add all three. The tag keeps a row fact from colliding with a column fact. Trace: a 5 at (0,0) stores row 0 has 5, column 0 has 5, box (0,0) has 5. A second 5 at (0,7) finds ('row',0,'5') and fails. Edge cases: empty cells ('.') are skipped. Cost: 81 cells, so O(1) time and space; in general O(n²) for an n by n board.`
    }
  };
})();
