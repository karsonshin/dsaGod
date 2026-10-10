/* Offer Ready: extra lesson material for this topic (primer, breakdown, think, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['hashing-internals'] = {
    primer: {
      kind: 'structure',
      what: `A **hash table** is an array of **buckets** plus a **hash function** that turns any key into a number; the number picks the bucket. Think of mail slots numbered 0 to 7: a rule turns a name into a slot, so you go straight to the right slot instead of searching. Python's \`dict\` and \`set\` are hash tables.`,
      does: `Insert, lookup and delete take O(1) on average because only one bucket is inspected. Two keys in one bucket is a **collision**; if collisions pile up, an operation degrades to O(n) in the worst case. The table doubles when it fills past its **load factor**, so inserts are O(1) amortized. Keys have no sorted order.`,
      impl: `Compute \`index = hash(key) % number_of_buckets\`. **Separate chaining**: each bucket holds a small list. **Open addressing**: one entry per slot; a collision moves to the next free slot, and deletes leave a **tombstone** marker. Equal keys must have equal hashes. A **rolling hash** slides a window's fingerprint in O(1).`,
      possibilities: `Explaining how dict and set work and why lookups are O(1) average. Building MyHashSet or MyHashMap. Rabin-Karp string search and repeated-substring problems (rolling hash plus binary search). Exact fingerprints with bitmasks, tuples or reduced fractions. Knowing when hash flooding or a weak hash makes a hash solution unsafe.`
    },
    breakdown: [
      {
        title: 'Step 1: turn a key into a slot number',
        body: `An array finds box 5 instantly because 5 is a number. A hash table makes *any* key into a number so it can do the same. The **hash function** does that conversion; the table has a fixed count of buckets, say 8, and the bucket is \`hash % 8\`.

Trace with integer keys (hash = the number itself): 10 % 8 = 2, 21 % 8 = 5, 5 % 8 = 5. Key 10 goes to bucket 2; keys 21 and 5 both want bucket 5.

State: the bucket array, and the rule. Lookup repeats the rule and looks in exactly one bucket, so the answer to "where is it?" is computed, never searched for.

Requirements of the hash function: same key gives same number every time, and results spread across buckets. Cost: computing the hash takes time proportional to the key's size (an int is O(1), a string of length L is O(L)).`,
        code: { py: `buckets = 8\nfor key in (10, 21, 5):\n    print(key, '->', key % buckets)   # 10 -> 2, 21 -> 5, 5 -> 5` }
      },
      {
        title: 'Step 2: collisions and separate chaining',
        body: `21 and 5 both map to bucket 5, a **collision**. There are more possible keys than buckets, so collisions are certain, not rare. The first fix: let each bucket hold a small **list**. This is **separate chaining**.

Trace: add 10, 21, 5 to 8 buckets. Bucket 2: [10]. Bucket 5: [21], then 5 joins: [21, 5]. Lookup of 5: compute 5 % 8 = 5, scan the list [21, 5]: 21 is not 5, next is 5, found. Two comparisons.

Edge cases: adding an existing key should not add it twice (scan the chain first). Removing deletes from that one list. Cost: one bucket, plus the chain length. If chains stay short (a handful of keys), operations are O(1). If everything lands in one bucket the chain has n keys and the lookup is O(n). That is the whole gap between "O(1) average" and "O(n) worst case".`,
        code: { py: `chains = [[] for _ in range(8)]\nfor key in (10, 21, 5):\n    chain = chains[key % 8]\n    if key not in chain:\n        chain.append(key)\nprint(chains[5])   # [21, 5]` }
      },
      {
        title: 'Step 3: open addressing, no lists',
        body: `The other design stores at most one entry per slot, in flat arrays. On a collision, move to the next slot (wrapping around) until one is free. This is **open addressing** with **linear probing**.

Trace: 8 slots, insert 10 (slot 2), 21 (slot 5), 5 (slot 5 taken, try 6, free). Slots: 2:10, 5:21, 6:5. Lookup of 5: start at slot 5, see 21, not it; go to 6, see 5, found. Lookup of 13 (13 % 8 = 5): 5 holds 21, 6 holds 5, 7 is **empty**, so 13 is absent. An empty slot ends the search because 13 would have been placed there.

Benefit: compact and cache friendly. Risks: probe trails lengthen as slots fill, so keep the table at most about half full (and never full, or a failed lookup never ends). Cue: if asked to implement a map without lists, this is it.`,
        code: { py: `slots = [None] * 8\ndef put(k):\n    i = k % 8\n    while slots[i] is not None:      # probe: next slot, wrapping\n        i = (i + 1) % 8\n    slots[i] = k\nfor k in (10, 21, 5):\n    put(k)\nprint(slots)   # [None, None, 10, None, None, 21, 5, None]` }
      },
      {
        title: 'Step 4: deleting without breaking trails',
        body: `Continue the example: slots 5:21, 6:5. Delete 21 by setting slot 5 to empty. Now look up 5: start at slot 5, it is **empty**, so the lookup stops and says "absent", but 5 is sitting in slot 6. Emptying the slot cut the trail.

Fix: mark the slot with a **tombstone** meaning "something was here". Lookups walk past tombstones; inserts may reuse them. Trace again: slot 5 = tombstone, look up 5: slot 5 is a tombstone, keep going; slot 6 holds 5; found.

State per slot: empty, full, or deleted. Tombstones still lengthen trails, so count them toward the load factor and clear them when the table is rebuilt. In chaining none of this happens: deleting a node from a list breaks nothing. Cue: interviewers love asking "what goes wrong if you just empty the slot?"`
      },
      {
        title: 'Step 5: load factor, resizing and why it is amortized O(1)',
        body: `**Load factor** = entries ÷ buckets. When it passes a limit (about 0.75 for chaining, about 0.5 for linear probing), the table allocates **twice** the buckets and reinserts every key. Every key must be reinserted, because its slot is \`hash % size\` and the size just changed; copying buckets unchanged would put keys where lookups do not look.

Trace: 4 buckets, limit 0.75 (3 entries). Adding the 4th entry (4 > 3) triggers growth to 8 buckets and 4 reinserts. The next growth happens at 7 entries (7 > 6), copying 7. Then at 13 (copying 13), and so on.

Total copies for n inserts: 4 + 7 + 13 + ... is about 2n, spread over n inserts, so **O(1) amortized**. Growing by a fixed number each time would repeat copying often and cost O(n²). One unlucky insert is still O(n); that is what "amortized" allows.`
      },
      {
        title: 'Step 6: the contract, and a weak hash',
        body: `Two rules. (1) **Equal keys must give equal hashes**; otherwise two equal keys land in different buckets and lookups miss. The reverse is not needed: different keys may share a hash. (2) A key must not change while stored: its hash would change, but the entry still sits in the old bucket and becomes unfindable. That is why Python allows tuples and strings as keys but not lists.

Spread matters. Trace ten keys 10, 20, 30, ..., 100 into 10 buckets by \`key % 10\`: all land in bucket 0, so a lookup scans 10 entries. With a prime number of buckets, 7: 10%7=3, 20%7=6, 30%7=2, 40%7=5, 50%7=1, 60%7=4, 70%7=0, so the first seven keys fill seven different buckets. Good tables use primes or scramble the bits first.

In Java, define \`hashCode\` whenever you define \`equals\`. And an attacker who knows your hash can send colliding keys to force O(n): hash flooding; the defence is a randomized hash.`
      },
      {
        title: 'Step 7: rolling hash, a fingerprint that slides',
        body: `Second use of hashing: compare long pieces of text cheaply. A **fingerprint** of a window is a number computed from its letters. Equal windows always have equal fingerprints (the contract again); unequal windows usually do not, so the character comparison is needed only on a match.

The trick is to update the number in O(1) as the window slides. Read letters as digits in base B. With letters a=1, b=2, c=3, d=4 and B = 10, window "abc" is 1·100 + 2·10 + 3 = 123. Slide to "bcd": subtract the leaving letter's share (1·100), shift everything left (×10), add the new letter: (123 − 100) × 10 + 4 = 234. Real hashes also take everything **mod M** to stay small, and in Python that stays non-negative.

Cost: O(1) per slide, O(n) for the whole text instead of O(n·m) for comparing windows. This is **Rabin-Karp**. For tiny alphabets (4 DNA letters, 2 bits each) the fingerprint can be the exact bitmask, so no verification is ever needed.`,
        code: { py: `B = 10\nh = 1 * B**2 + 2 * B + 3          # "abc" -> 123\nh = (h - 1 * B**2) * B + 4         # slide to "bcd"\nprint(h)                           # 234` }
      }
    ],
    think: [
      {
        q: `Keys 10, 20, 30, 40 go into a table with 10 buckets using \`key % 10\`. Then the same keys into 7 buckets. What happens in each, and what does it teach about table size?`,
        a: `With 10 buckets they all land in bucket 0 (every multiple of 10 has remainder 0), so a lookup scans a chain of 4; with n such keys it would scan n. With 7 buckets the remainders are 3, 6, 2, 5: no collisions. A table size that shares a factor with the keys wastes buckets, which is why implementations use primes or scramble bits before reducing.`
      },
      {
        q: `A table with 4 buckets just doubled to 8. You copy bucket 0 to bucket 0, bucket 1 to bucket 1, and so on, without rehashing. What breaks?`,
        a: `Lookups. The bucket is \`hash % size\`, and the size changed from 4 to 8, so a key that used to be in bucket 2 might now belong in bucket 6. Lookup goes to bucket 6, finds nothing, and reports the key absent even though it is in the table. Every key's position must be recomputed, which is why a resize costs O(n).`
      },
      {
        q: `In an open-addressing table, why is it wrong to just empty a slot when deleting? What do you do instead?`,
        a: `A lookup stops at the first empty slot, believing the key would have been placed there. If another key was pushed past this slot earlier because of a collision, emptying the slot makes that key unreachable. Put a tombstone in the slot: lookups skip over it, inserts can reuse it, and the trail stays intact.`
      },
      {
        q: `Resizing costs O(n) but inserts are called O(1) amortized. How can both be true?`,
        a: `Resizes happen at sizes 4, 8, 16, 32, ..., doubling each time, so a resize that copies n items is followed by about n cheap inserts before the next one. Total copying across n inserts is 1 + 2 + 4 + ... + n, about 2n, so the average insert pays a constant. Growing by a fixed amount instead would resize far more often and give O(n²) total.`
      },
      {
        q: `Two windows of text have the same rolling hash. Are they equal? And if their hashes differ?`,
        a: `Different hashes prove the windows differ, since equal windows always hash equal. Same hash does not prove equality: many windows share each fingerprint, so a collision can fool you. Rabin-Karp therefore compares the actual characters when hashes match. That check costs O(m), but with a good modulus it nearly always confirms a true match, so the expected time stays near O(n).`
      },
      {
        q: `You put a list in a Python \`set\` by turning it into a tuple, then someone mutates the original list. Does the set break? And what if the key had been a mutable object with a hash based on its fields?`,
        a: `The tuple is a separate immutable copy, so the set is fine. If a mutable object's hash depended on fields you later changed, its hash would change but the entry would still sit in the bucket for the old hash; lookups would compute the new hash, go to a different bucket, and miss it. That is why hashable keys must be immutable, or at least never changed while stored.`
      }
    ],
    drills: [
      {
        title: 'Count the collisions',
        q: `Given a list of integer keys and a bucket count \`size\`, a key goes in bucket \`key % size\`. Return how many keys land in a bucket that already holds an earlier key. Example: keys \`[10, 20, 30, 40]\` with size 10 gives 3 (all four go to bucket 0, so three collide); with size 7 it gives 0.`,
        hint: `Keep track of which buckets are occupied. A key collides when its bucket is already in that record.`,
        how: `Restating: simulate where keys land and count how many hit an already occupied bucket. I do not store the keys themselves, only the fact that a bucket is taken.

Brute force: for each key compare its bucket with the bucket of every earlier key: O(n²). It works but there is a faster way to ask "is this bucket taken?".

The observation: the question is plain membership on bucket numbers. A set of used buckets answers it in O(1) on average (and since bucket numbers are less than size, a boolean array of length size would work too). The count of collisions is the number of keys whose bucket is already in the set.

Trace \`[10,20,30,40]\`, size 10: key 10 goes to bucket 0, free, add to used. Key 20 goes to 0, taken, collisions 1. Key 30: 0, taken, 2. Key 40: 3. With size 7 the buckets are 3, 6, 2, 5, all new, so 0.

Edge cases: an empty list gives 0; negative keys, where Python's % still returns a valid bucket from 0 to size − 1 (in Java or C++ the remainder could be negative and would need fixing); duplicate keys count as a collision here because they go to an occupied bucket.

Cost: O(n) time, O(min(n, size)) space. The lesson to say out loud: the collision count depends on how the keys relate to the table size, not only on how many keys there are.`,
        code: { py: `def collisions(keys, size):\n    used = set()\n    count = 0\n    for k in keys:\n        b = k % size\n        if b in used:\n            count += 1\n        else:\n            used.add(b)\n    return count` },
        explain: `Each key is mapped to its bucket once; the set records which buckets are occupied, and a key collides exactly when its bucket is already recorded. O(n) time, O(min(n, size)) space.`,
        check: `assert collisions([10, 20, 30, 40], 10) == 3
assert collisions([10, 20, 30, 40], 7) == 0
assert collisions([], 5) == 0
assert collisions([1, 1, 1], 4) == 2
assert collisions([-1, 3], 4) == 1
assert collisions([0, 1, 2, 3, 4, 5, 6, 7, 8], 8) == 1`
      },
      {
        title: 'Build a growing hash map',
        q: `Implement \`ChainedMap\` with \`put(key, value)\`, \`get(key, default=None)\`, \`remove(key)\` (returns True if the key existed), and \`len(m)\`. Do not use \`dict\` or \`set\` for storage: use a list of buckets, each a list, starting at 4 buckets and doubling whenever the number of entries exceeds 0.75 × buckets. Keep a counter \`resizes\`. After inserting 1000 keys, every key must be retrievable and the load must be at most 0.75.`,
        hint: `Bucket index is \`hash(key) % len(buckets)\`. Updating an existing key must not add a new entry. When you grow, recompute every key's bucket against the new size.`,
        how: `Restating: I am writing the dict's core: buckets, a hash, chains, and resizing.

Starting design: one big list and a linear scan on every operation. That is correct, but every operation is O(n), so n inserts are O(n²). The reason to use buckets is that the hash narrows a search to one short list.

Structure: \`buckets\` is a list of lists; each entry is a \`[key, value]\` pair so I can update the value in place. A helper \`_chain(key)\` returns \`buckets[hash(key) % len(buckets)]\`. \`put\` scans that chain: if the key exists, overwrite and return; otherwise append, increase \`size\`, and if \`size > 0.75 * len(buckets)\` grow. \`get\` scans the chain. \`remove\` pops from the chain and decreases \`size\`.

Growing: allocate twice as many empty buckets, then loop over every old chain and every pair and re-append it to \`hash(k) % new_len\`. A key's bucket depends on the table size, so copying chains unchanged would break lookups.

Trace: 4 buckets, limit 3 entries. Put four distinct keys: at the fourth, 4 > 3, so grow to 8 buckets and rehash four pairs. Resizes = 1.

Edge cases: update existing key (size unchanged, no growth); removing a missing key returns False; None as a stored value must be distinguishable from missing, which is why \`get\` takes a default.

Cost: O(1) average per operation with load ≤ 0.75, resizes O(n) but amortized O(1) per insert since they double. Space O(n).`,
        code: { py: `class ChainedMap:\n    def __init__(self):\n        self.buckets = [[] for _ in range(4)]\n        self.size = 0\n        self.resizes = 0\n\n    def _chain(self, key):\n        return self.buckets[hash(key) % len(self.buckets)]\n\n    def put(self, key, value):\n        chain = self._chain(key)\n        for pair in chain:\n            if pair[0] == key:\n                pair[1] = value\n                return\n        chain.append([key, value])\n        self.size += 1\n        if self.size > 0.75 * len(self.buckets):\n            self._grow()\n\n    def get(self, key, default=None):\n        for k, v in self._chain(key):\n            if k == key:\n                return v\n        return default\n\n    def remove(self, key):\n        chain = self._chain(key)\n        for i, pair in enumerate(chain):\n            if pair[0] == key:\n                chain.pop(i)\n                self.size -= 1\n                return True\n        return False\n\n    def _grow(self):\n        old = self.buckets\n        self.buckets = [[] for _ in range(2 * len(old))]\n        self.resizes += 1\n        for chain in old:\n            for pair in chain:\n                self.buckets[hash(pair[0]) % len(self.buckets)].append(pair)\n\n    def __len__(self):\n        return self.size` },
        explain: `A key always lives in the chain at hash(key) % len(buckets); rehashing on growth maintains that invariant. With load kept at most 0.75 the average chain is short, so operations are O(1) on average; doubling makes growth amortized O(1) per insert. Space O(n).`,
        check: `m = ChainedMap()
assert len(m) == 0 and m.get("x") is None and m.get("x", 7) == 7
for i in range(1000):
    m.put(i, i * i)
assert len(m) == 1000
assert all(m.get(i) == i * i for i in range(1000))
assert len(m.buckets) * 0.75 >= len(m)
assert 1 <= m.resizes <= 10
m.put(5, "five")
assert len(m) == 1000 and m.get(5) == "five"
assert m.remove(5) is True and m.remove(5) is False
assert len(m) == 999 and m.get(5) is None
m.put("a", None)
assert m.get("a", 3) is None
m.put((1, 2), "tuple")
assert m.get((1, 2)) == "tuple"`
      },
      {
        title: 'Find a word with a rolling hash',
        q: `Return the first index where \`pat\` occurs inside \`text\`, or -1, using a rolling hash so that you do not compare characters at every position. An empty pattern matches at 0. Example: \`find_pattern("abracadabra", "cad")\` is 4; \`find_pattern("aaa", "aaaa")\` is -1.`,
        hint: `Compute one fingerprint for the pattern and one for the first window of text, then slide the text fingerprint, comparing real characters only when the two fingerprints match.`,
        how: `Restating: classic substring search, but the interviewer wants the hashing idea.

Brute force: at every start position compare up to m characters: O(n·m). For n = m/2 = 10⁶ that is too slow, and the repeated character comparison is the bottleneck.

The observation: compare one number instead of m characters. If I can compute the fingerprint of the next window from the previous one in O(1), every position costs O(1). Treat letters as digits in base B and keep everything mod M. For a window t₀..t_{m−1} the hash is t₀·B^{m−1} + ... + t_{m−1}. To slide: subtract t₀·B^{m−1} (I precompute \`top = B^{m−1} mod M\`), multiply by B, add the new letter, mod M.

Since different strings can share a fingerprint, on equal hashes I compare the actual window to the pattern; only then do I return. That keeps correctness and costs O(m) only on (nearly always genuine) matches.

Trace \`"abracadabra"\`, \`"cad"\`: compute hashes of "cad" and of "abr". Slide through "bra", "rac", "aca", then "cad": hashes equal, text[4:7] == "cad", return 4.

Edge cases: empty pattern returns 0; pattern longer than text returns -1; repeated characters such as \`"aaa"\` in \`"aaaa"\`; note Python's % keeps the slide non-negative even when the subtraction goes below zero.

Cost: expected O(n + m); worst case O(n·m) if many false matches, which a large modulus makes very unlikely. Space O(1).`,
        code: { py: `def find_pattern(text, pat):\n    n, m = len(text), len(pat)\n    if m == 0:\n        return 0\n    if m > n:\n        return -1\n    B, M = 256, 1_000_000_007\n    top = pow(B, m - 1, M)            # weight of the letter that leaves\n    hp = ht = 0\n    for i in range(m):\n        hp = (hp * B + ord(pat[i])) % M\n        ht = (ht * B + ord(text[i])) % M\n    for i in range(n - m + 1):\n        if hp == ht and text[i:i + m] == pat:   # confirm: equal hashes may collide\n            return i\n        if i + m < n:\n            ht = ((ht - ord(text[i]) * top) * B + ord(text[i + m])) % M\n    return -1` },
        explain: `Equal windows always have equal hashes, so no true match is missed; the character check on equal hashes removes false positives. The slide is O(1), giving O(n + m) expected time, O(1) space.`,
        check: `assert find_pattern("abracadabra", "cad") == 4
assert find_pattern("aaa", "aaaa") == -1
assert find_pattern("hello", "") == 0
assert find_pattern("", "a") == -1
assert find_pattern("aaaaab", "aab") == 3
assert find_pattern("abc", "abc") == 0
assert find_pattern("mississippi", "issip") == 4
assert find_pattern("mississippi", "xyz") == -1
import random
random.seed(1)
t = "".join(random.choice("ab") for _ in range(500))
p = t[321:331]
assert find_pattern(t, p) == t.find(p)`
      },
      {
        title: 'Count windows that are anagrams of a word',
        q: `Count the starting positions in \`text\` where a window of length \`len(pat)\` is a rearrangement of \`pat\` (same letters, same counts). Example: \`text = "cbaebabacd"\`, \`pat = "abc"\` gives 2 (windows at index 0 "cba" and at index 6 "bac"). An empty \`pat\` gives 0.`,
        hint: `The fingerprint of a window is its letter counts. Sliding one position changes only two counts: one letter leaves, one enters.`,
        how: `Restating: slide a fixed-size window over the text and count how many windows have exactly the same letter counts as the pattern.

Brute force: for every window, sort it (or count it) and compare with the pattern: O(n·m log m) or O(n·m). With long windows this repeats a lot of work.

The observation: two neighbouring windows share m − 1 letters. The "fingerprint" I choose is the letter-count table (a dict), which is an exact fingerprint, no collisions possible, because two windows are anagrams exactly when their count tables are equal. And the table updates in O(1) per slide: add the entering letter's count, subtract the leaving letter's count (and delete the key at zero so that table equality is not confused by zero-valued entries).

Structure: \`need = Counter(pat)\` once; \`window = Counter(text[:m])\` for the first window; then for each next index add \`text[i]\`, remove \`text[i − m]\`, compare \`window == need\`.

Trace \`"cbaebabacd"\`, \`"abc"\`: window "cba" equals need, count 1. Slide: "bae" (c left, e entered) no; "aeb" no; "eba" no; "bab" no; "aba" no; "bac" yes, count 2; "acd" no. Answer 2.

Edge cases: pattern longer than text gives 0; empty pattern 0; repeated letters in the pattern (\`"aab"\`) are handled by counts.

Cost: each slide is O(1) dict work, and each comparison is O(alphabet) (at most 26), so O(n · 26) = O(n); space O(alphabet).`,
        code: { py: `from collections import Counter\n\ndef count_anagram_windows(text, pat):\n    m = len(pat)\n    if m == 0 or m > len(text):\n        return 0\n    need = Counter(pat)\n    window = Counter(text[:m])\n    count = 1 if window == need else 0\n    for i in range(m, len(text)):\n        window[text[i]] += 1                 # letter enters\n        left = text[i - m]\n        window[left] -= 1                    # letter leaves\n        if window[left] == 0:\n            del window[left]\n        if window == need:\n            count += 1\n    return count` },
        explain: `A window is an anagram of the pattern iff their letter-count tables are equal, an exact fingerprint. Each slide updates two counts in O(1); each comparison costs O(alphabet size). Total O(n · alphabet), space O(alphabet).`,
        check: `assert count_anagram_windows("cbaebabacd", "abc") == 2
assert count_anagram_windows("abab", "ab") == 3
assert count_anagram_windows("a", "ab") == 0
assert count_anagram_windows("abc", "") == 0
assert count_anagram_windows("aaaa", "aa") == 3
assert count_anagram_windows("abcd", "xyz") == 0
assert count_anagram_windows("aabaab", "aab") == 4`
      }
    ],
    how: {
      705: `Restate: build a set of integers without using the built-in hash set: add, remove, contains. Brute force: keep one list and scan it, O(n) per operation. The bottleneck is scanning everything. The fix is the hash table idea: use the key to compute a bucket number, so I only ever look in one small list. Design: an array of buckets (lists), bucket = \`key % len(buckets)\`. \`add\` looks in that bucket and appends if absent. \`contains\` looks in the same bucket. \`remove\` deletes from it. Collisions simply mean two keys share a list (separate chaining). To keep the lists short as the set grows, I track \`count\`; when \`count > 0.75 × len(buckets)\` I allocate twice as many buckets and reinsert every key, because the bucket depends on the table size. Trace with 8 buckets: add 1, 9: both go to bucket 1, so its chain is [1, 9]. contains(9) scans that chain and finds it. remove(1) leaves [9]. Edge cases: adding an existing key must not duplicate it or inflate the count; removing a missing key does nothing. Cost: O(1) average per operation, O(n) for one resize but amortized O(1); O(n) space.`,
      706: `Restate: the same problem as the set, but storing a value per key: put, get (return -1 if missing), remove. This solution uses open addressing, which is the harder variant. Brute force: a list of pairs and a scan, O(n). The design uses three flat arrays: keys, values, and a state per slot (empty, full, deleted). A key's home slot is \`key % capacity\`. If it is taken by a different key I step to the next slot, wrapping. To look up, I follow the same trail and stop at the first **empty** slot, because the key would have been placed there. Deleting cannot just empty a slot, as that would cut the trail for keys placed beyond it, so it writes a tombstone: lookups walk past it and inserts may reuse it. I keep \`used\` (full plus deleted) at no more than half the capacity so an empty slot always exists, and rebuild (doubling only if genuinely full, otherwise just clearing tombstones) when the limit is hit. Trace with capacity 8: put(1,a), put(9,b) both home to slot 1, so 9 lands in slot 2; get(9) checks slot 1, then slot 2. Cost: O(1) average, amortized for rebuilds, O(n) space.`,
      2001: `Restate: rectangles are interchangeable if their width:height ratios are equal; count the pairs. Brute force: compare every pair by cross-multiplying, O(n²). The bottleneck is pair comparison. The observation: the same ratio means the same reduced fraction, so I can make a key that is identical for all interchangeable rectangles. Dividing width and height by their gcd gives that key: 4×8 and 3×6 both become (1,2). I must not use the float w/h as a key, because floats that should be equal can differ in the last bit. Then it is a counting problem: as I walk the rectangles, the number of new pairs formed with this one equals how many earlier rectangles had the same key, so I add \`counts[key]\` to the answer and then increment it. Trace \`[[4,8],[3,6],[10,20],[15,30]]\`: all reduce to (1,2); the additions are 0, 1, 2, 3, total 6. Edge cases: no matches gives 0; one rectangle gives 0. Cost: O(n log max) for the gcds, O(n) space.`,
      2352: `Restate: count pairs (row i, column j) where row i and column j contain the same numbers in the same order. Brute force: compare each row to each column element by element, O(n³). The bottleneck is comparing whole lines repeatedly. The observation: a row or column becomes a single hashable value if I turn it into a tuple. Then it is the counting pattern: count how many times each row tuple appears with a \`Counter\`, and for each column tuple, add the number of rows equal to it. A list cannot be a key, so the tuple conversion is essential. In Python, \`map(tuple, grid)\` gives the rows and \`zip(*grid)\` yields the columns as tuples. Trace \`[[3,2,1],[1,7,6],[2,7,7]]\`: rows (3,2,1), (1,7,6), (2,7,7); column 0 is (3,1,2), column 1 is (2,7,7), column 2 is (1,6,7). Only column 1 matches a row, once: answer 1. If two identical rows match one column, both pairs count. Cost: building the n tuples is O(n²) and hashing each is O(n), so O(n²) time and space.`,
      1461: `Restate: does the binary string s contain every possible binary code of length k as a substring? There are 2^k such codes. Brute force: generate all 2^k codes and test each with a substring search, which is O(2^k · n · k). The bottleneck is that the search repeats. The reverse view: collect all the length-k windows in s into a set and check whether the set has 2^k members. To make windows cheap to store and compare, treat each window as the integer its bits spell out; that number is an exact fingerprint (no collisions, it is just the code itself). I slide it in O(1): shift left by one, add the new bit, and mask to keep only k bits, so the oldest bit drops off. Trace \`"00110"\`, k = 2: windows 00, 01, 11, 10, which gives 4 distinct values, equal to 2², so True. Edge cases: when the string is shorter than k + 2^k − 1, it cannot contain them all, though counting handles that. Cost: O(n) time, O(2^k) space.`,
      2261: `Restate: count the distinct subarrays that have at most k elements divisible by p. Distinct means the actual sequence of values, not the positions. Brute force: generate every subarray, filter by the divisible count, and put each one in a set as a tuple: O(n²) subarrays, and hashing each tuple costs O(n), so O(n³). The bottleneck is hashing whole slices. The observation: all subarrays starting at the same index i are the prefixes of one long sequence, and a trie (nested dicts) stores shared prefixes once. I walk each start i forward, extending; when I step to a value that has no node yet, I have found a brand new subarray, so I create the node and add one to the answer. If the divisible count exceeds k, I stop that start. Trace \`[2,3,3,2,2]\` with k = 2, p = 2: start 0 creates nodes for [2], [2,3], [2,3,3], [2,3,3,2] (the next 2 would be a third divisible one and stops). Start 1 builds [3], [3,3], [3,3,2], [3,3,2,2]; and so on, reusing existing nodes where the path repeats. Cost: O(n²) time and space (each step is O(1)).`,
      2156: `Restate: find the first length-k substring whose polynomial hash equals a given value. The hash weights letter j by power^j (a=1, ..., z=26), mod some modulus, so the first letter has weight 1. Brute force: hash every window from scratch, O(n·k). The bottleneck is recomputing; I want O(1) per window. A normal left-to-right slide assumes the leftmost letter has the largest weight, which is the opposite of this definition. The leftmost letter here has the smallest weight, so sliding to the *left* is natural: when I move the window one step left, the letter at its right end leaves (with the highest weight, \`power^{k−1}\`, precomputed), everything else shifts up one weight (multiply by \`power\`), and the new left letter enters with weight 1. So \`h = (h − val(leaving) × top) × power + val(entering)\`, all mod the modulus. I compute the last window directly, slide left, and keep the smallest index whose hash matches (the leftmost one, since I move leftwards). Edge cases: the answer is guaranteed to exist. Cost: O(n + k) time (plus the fast power), O(1) extra space.`,
      1147: `Restate: cut the text into chunks so that chunk 1 equals the last chunk, chunk 2 equals the second to last, and so on; return the largest possible number of chunks. Brute force: try every set of cut points, exponential. The key observation: greedy works. Whenever a prefix of the remaining text equals the matching suffix, cutting it off immediately never hurts, and the shorter the chunk, the more chunks I get. So I grow a prefix chunk from the left and a suffix chunk from the right, one letter at a time, until they are equal; then I count 2 chunks, reset, and continue inward. Comparing the two chunks character by character each step would be O(n²), so I keep a running hash of each: the left chunk's hash grows by \`left × B + c\`, the right chunk's by adding the new letter with weight \`B^(length)\`. When the hashes match, I confirm with a real slice comparison, which runs only when a chunk is truly cut. Trace \`"ghiabcdefhelloadamhelloabcdefghi"\`: cut ghi, cut abcdef, cut hello, the middle \`adam\` remains, so 3 matched pairs plus one middle chunk gives 7. If nothing is cut, the answer is 1. Cost: O(n) expected, O(1) extra space.`,
      187: `Restate: find every 10-letter DNA substring that appears more than once. Brute force: put every 10-letter window in a set of strings and report repeats. That is correct, but each window is hashed in O(10), and 10-letter strings take memory. The cleaner idea is to turn each window into a number: there are only four letters, so two bits identify a letter, and a window is a 20-bit integer. That integer is an exact fingerprint, so no collisions and no verification are needed. I slide it in O(1): \`h = ((h << 2) | code) & mask\`, where the mask keeps 20 bits so the oldest letter falls off. Trace the first window of \`"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"\`: after 10 letters h is the code of AAAAACCCCC. Each later window gives a new h; I keep a \`seen\` set of numbers and an \`added\` set, and when h is already in seen but not in added, I output that window once. Edge cases: fewer than 10 letters returns empty; a repeated window that occurs three times is reported once; overlapping windows count. Cost: O(n) time, O(n) space (at most 4^10 numbers).`,
      1044: `Restate: find the longest substring that appears at least twice (overlap allowed), or empty. Brute force: for every length from long to short, check every window with a set of substrings: roughly O(n²) windows each costing O(n) to hash. The first observation is monotonic: if a substring of length L repeats, then its first L − 1 letters repeat too. So "a repeat of length L exists" is true up to some boundary and false after it, which allows binary search on the length: about log n rounds. The second observation: test one length in O(n) with a rolling hash (Rabin-Karp). Hash each window of that length in O(1) per slide, and keep a dict from hash to start positions. If a window's hash is already there, compare the actual substrings to rule out a collision; a confirmed match means length L is feasible. Trace \`"banana"\`: L = 3 finds "ana" twice (positions 1 and 3), L = 4 finds nothing, so the answer is "ana". Edge cases: no repeat returns an empty string; a repeat that overlaps itself counts. Cost: O(n log n) expected time and O(n) space.`
    }
  };
})();
