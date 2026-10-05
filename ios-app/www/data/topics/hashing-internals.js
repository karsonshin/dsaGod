/* Offer Ready: Hashing internals. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in
   (design classes in py and js only; the Java and C++ design classes were compiled and run by hand). */
(function () {
  var OR = (window.OR = window.OR || {});

  /* Stress case for the open-addressing map: many puts, overwrites and removes, with expected answers
     computed from a built-in Map, so the table's tombstones and resizes get exercised. */
  function mapStress() {
    var ops = ['MyHashMap'], args = [[]], out = [null], ref = new Map(), seed = 7;
    function rnd(n) { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; }
    for (var t = 0; t < 160; t++) {
      var k = rnd(5) * 16 + rnd(3), r = rnd(5);   // keys that pile onto a few buckets
      if (r < 2) { var v = rnd(1000); ops.push('put'); args.push([k, v]); out.push(null); ref.set(k, v); }
      else if (r < 3) { ops.push('remove'); args.push([k]); out.push(null); ref.delete(k); }
      else { ops.push('get'); args.push([k]); out.push(ref.has(k) ? ref.get(k) : -1); }
    }
    return { ops: ops, args: args, out: out };
  }

  (OR.topics = OR.topics || []).push({
    id: 'hashing-internals',

    hook: 'Interviewers ask “how does a hash map work?” far more often than they ask you to build one, and the answer separates people who use hash maps from people who understand them. It also decides real bugs: why a lookup is O(1) on average and O(n) in the worst case, why a table resizes, why changing a key after inserting it loses the entry, and why a hash-based solution can be hacked on a contest site. The same machinery gives you rolling hashes, which turn “compare every window of a string” into one number per window.',

    cues: [
      'You are asked to **implement** a set or a map without the built-in one (Design HashSet, Design HashMap), or to explain what happens inside `put` and `get`.',
      'The question says **“without using any built-in hash table”**, or asks about collisions, load factor, resizing or what happens when two keys land in the same bucket.',
      'You need to compare **many substrings or windows** of a string for equality, find a repeated one, or find the longest one that repeats. Comparing characters costs O(length) each; a **rolling hash** makes each comparison O(1).',
      'Keys are **composite**: a row of a grid, a reduced fraction, a window of letters. You must choose a key that is hashable, exact (a float won’t do) and cheap to compute.',
      'The window is small and the alphabet is tiny (4 DNA letters, bits): pack it into an **integer bitmask** and use it as its own hash, with no collisions at all.',
      'The follow-up is about **worst cases**: an adversary picks keys that all collide, or a custom key type has a broken `equals`/`hashCode`.',
      'The trap: if you only need to *use* a map to count or look up, that is [arrays and hashing](#/topic/arrays-hashing). This topic is for the moments the internals matter.'
    ],

    intuition: [
      'Picture a wall of mail slots in an office, numbered 0 to 7. To file a letter you do not search for a free slot. You turn the recipient’s name into a number with a fixed rule, divide by 8, and drop the letter in the slot given by the remainder. To find it later you apply the same rule and look in exactly one slot. The rule is the **hash function**, the slots are **buckets**, and the whole trick is that the answer to “where is it?” is computed, not searched for.',
      'The trouble is that 8 slots cannot give every name its own slot. Two names will eventually hash to the same slot: a **collision**. A hash table is mostly a decision about what to do then:',
      '1. **Separate chaining**: each slot holds a small list. A colliding key joins the list; a lookup computes the slot and scans its list.\n2. **Open addressing**: each slot holds at most one entry. A colliding key moves on to the next free slot by a fixed rule (the next slot, then the next, and so on); a lookup follows the same trail until it finds the key or hits an empty slot.',
      'Both stay fast only while the lists (or trails) stay short. The measure is the **load factor**, the number of entries divided by the number of slots. When it passes a threshold (0.75 is the classic choice for chaining), the table allocates **twice as many slots and reinserts every key**, because a key’s slot depends on the table size. That resize costs O(n) once, but it happens after n/2 more inserts, so the **amortized** cost per insert stays O(1).',
      'Everything above assumes the hash function spreads keys evenly. If it does not (all keys share a factor with the table size, or an attacker picks keys that collide), every key lands in a few slots and a lookup degrades to scanning O(n) entries. That is the whole difference between “O(1) average” and “O(n) worst case”.',
      'The second half of the topic is the other use of hashing: **fingerprints**. A rolling hash computes the hash of a window from the previous window’s in O(1), by subtracting the letter that left and adding the one that arrived. Two equal windows always have equal fingerprints, so you only compare characters when the fingerprints match (Rabin-Karp). When the window is a few bits per letter, the fingerprint can be the exact bitmask and no check is needed.'
    ].join('\n\n'),

    viz: 'hashing',

    template: {
      title: 'A hash set with chaining: hash, scan, append, and grow when crowded',
      note: 'The skeleton of every from-scratch hash table: **hash** the key to a bucket, **scan** that bucket for the key, **append** if it is new, then check the **load factor** and, when it is too high, **grow** by allocating a bigger array and **rehashing** every key (its bucket depends on the size). To make a map, store `(key, value)` pairs in the chains and overwrite the value on a hit. Keys here are non-negative integers; for strings or tuples, compute an integer hash first and reduce it the same way.',
      code: {
        py: `class ChainedSet:
    def __init__(self, size=4):
        self.buckets = [[] for _ in range(size)]      #> One list per bucket: separate chaining
        self.count = 0

    def add(self, key):
        i = key % len(self.buckets)                   #@hash > 1. Hash: the key picks its bucket
        chain = self.buckets[i]
        if key in chain:                              #@scan > 2. Walk the chain: is it already here?
            return False
        chain.append(key)                             #@append > 3. Not there: join the end of the chain
        self.count += 1
        if self.count > 0.75 * len(self.buckets):     #@load > 4. Load factor too high? Chains are getting long
            self._grow()                              #@resize > Yes: double the bucket array
        return True

    def contains(self, key):
        return key in self.buckets[key % len(self.buckets)]

    def _grow(self):
        old = self.buckets
        self.buckets = [[] for _ in range(2 * len(old))]
        for chain in old:
            for key in chain:
                self.buckets[key % len(self.buckets)].append(key)   #@rehash > Recompute every key's bucket for the new size`,
        js: `class ChainedSet {
  constructor(size = 4) {
    this.buckets = Array.from({ length: size }, () => []);   //> One array per bucket: separate chaining
    this.count = 0;
  }

  add(key) {
    const i = key % this.buckets.length;                     //@hash > 1. Hash: the key picks its bucket
    const chain = this.buckets[i];
    if (chain.includes(key)) return false;                   //@scan > 2. Walk the chain: is it already here?
    chain.push(key);                                         //@append > 3. Not there: join the end of the chain
    this.count++;
    if (this.count > 0.75 * this.buckets.length) {           //@load > 4. Load factor too high? Chains are getting long
      this._grow();                                          //@resize > Yes: double the bucket array
    }
    return true;
  }

  contains(key) {
    return this.buckets[key % this.buckets.length].includes(key);
  }

  _grow() {
    const old = this.buckets;
    this.buckets = Array.from({ length: 2 * old.length }, () => []);
    for (const chain of old) {
      for (const key of chain) {
        this.buckets[key % this.buckets.length].push(key);   //@rehash > Recompute every key's bucket for the new size
      }
    }
  }
}`,
        java: `class ChainedSet {
    private List<List<Integer>> buckets = new ArrayList<>();
    private int count = 0;

    ChainedSet(int size) {
        for (int i = 0; i < size; i++) buckets.add(new ArrayList<>());   //> One list per bucket: separate chaining
    }
    ChainedSet() { this(4); }

    boolean add(int key) {
        int i = key % buckets.size();                       //@hash > 1. Hash: the key picks its bucket
        List<Integer> chain = buckets.get(i);
        if (chain.contains(key)) return false;              //@scan > 2. Walk the chain: is it already here?
        chain.add(key);                                     //@append > 3. Not there: join the end of the chain
        count++;
        if (count > 0.75 * buckets.size()) {                //@load > 4. Load factor too high? Chains are getting long
            grow();                                         //@resize > Yes: double the bucket array
        }
        return true;
    }

    boolean contains(int key) {
        return buckets.get(key % buckets.size()).contains(key);
    }

    private void grow() {
        List<List<Integer>> old = buckets;
        buckets = new ArrayList<>();
        for (int i = 0; i < 2 * old.size(); i++) buckets.add(new ArrayList<>());
        for (List<Integer> chain : old) {
            for (int key : chain) {
                buckets.get(key % buckets.size()).add(key);   //@rehash > Recompute every key's bucket for the new size
            }
        }
    }
}`,
        cpp: `class ChainedSet {
    vector<list<int>> buckets;
    int count = 0;

    void grow() {
        vector<list<int>> old(buckets.size() * 2);
        swap(old, buckets);                                   // buckets is now the bigger, empty array
        for (auto& chain : old) {
            for (int key : chain) {
                buckets[key % buckets.size()].push_back(key);   //@rehash > Recompute every key's bucket for the new size
            }
        }
    }

public:
    ChainedSet(int size = 4) : buckets(size) {}               //> One list per bucket: separate chaining

    bool add(int key) {
        auto& chain = buckets[key % buckets.size()];          //@hash > 1. Hash: the key picks its bucket
        if (find(chain.begin(), chain.end(), key) != chain.end()) return false;   //@scan > 2. Walk the chain: is it already here?
        chain.push_back(key);                                 //@append > 3. Not there: join the end of the chain
        count++;
        if (count > 0.75 * buckets.size()) {                  //@load > 4. Load factor too high? Chains are getting long
            grow();                                           //@resize > Yes: double the bucket array
        }
        return true;
    }

    bool contains(int key) {
        auto& chain = buckets[key % buckets.size()];
        return find(chain.begin(), chain.end(), key) != chain.end();
    }
};`
      },
      tests: { design: true, fn: 'ChainedSet', cases: [
        { ops: ['ChainedSet', 'add', 'add', 'add', 'contains', 'contains', 'add', 'add', 'contains', 'add', 'contains'], args: [[], [5], [13], [5], [13], [6], [21], [29], [29], [37], [37]], out: [null, true, true, false, true, false, true, true, true, true, true] },
        { ops: ['ChainedSet', 'add', 'add', 'add', 'add', 'contains', 'contains', 'contains'], args: [[2], [0], [2], [4], [6], [4], [3], [6]], out: [null, true, true, true, true, true, false, true] }] }
    },

    complexity: {
      time: 'O(1) average per operation; O(n) worst case',
      space: 'O(n)',
      why: 'A lookup computes one bucket in O(1) and then scans that bucket’s chain, whose expected length is the load factor (at most 0.75), so the expected cost is O(1). A resize copies all n keys, which is O(n), but the table only doubles after the count has grown by half its size, so spreading that cost over the inserts that caused it gives **O(1) amortized per insert**. The table takes O(n) space: the entries plus the bucket array, which stays within a constant factor of n because of the load-factor limit.',
      trap: 'Three honest caveats. “O(1)” is an **average over a good hash function**; if every key collides, a lookup scans one chain of n entries, O(n). A single `put` that triggers a resize costs O(n), so the cost is **amortized**, not per-operation (matters for real-time code). And the hash of a string or tuple costs O(length of the key), so a map keyed by strings of length k is O(k) per operation, not O(1). Say all three when an interviewer asks “is it really constant time?”.'
    },

    variations: [
      {
        name: 'Separate chaining vs open addressing',
        body: 'Chaining keeps a list per bucket: simple, never “full”, and removing is just deleting from a list. Java’s `HashMap` and Python’s sets of objects use ideas close to this (Java even turns a long chain into a balanced tree). **Open addressing** stores entries directly in the array and **probes** to the next slot on a collision: linear probing tries `i, i+1, i+2, …`, quadratic probing tries `i, i+1, i+4, i+9, …`, double hashing uses a second hash for the step. It is cache-friendly and has no per-entry list, but it must keep the load factor lower (about 0.5 to 0.7), and **deleting needs care**: if you simply empty a slot you break the trail for keys that probed past it, so you leave a **tombstone** (“deleted” marker) that lookups step over and inserts may reuse. Python’s `dict` and C++ libraries such as `absl::flat_hash_map` are open-addressing designs. The worked Design HashMap below uses linear probing with tombstones.'
      },
      {
        name: 'Load factor and resizing',
        body: 'The **load factor** is `count / buckets`. Chaining tolerates a high one (Java’s default limit is 0.75, `unordered_map`’s is 1.0); open addressing needs a low one because a probe sequence lengthens sharply as the table fills. When the limit is crossed, allocate a bigger array (double it) and **reinsert every key** with the new size, since `hash % size` changes. Never just copy the old array, and never grow by a fixed amount: growing by +10 each time makes n inserts cost O(n²), while doubling makes them O(n) total. Shrinking is optional; most libraries never shrink automatically. If you know the final size, reserving it up front (`reserve` in C++, an initial capacity in Java) avoids every resize.'
      },
      {
        name: 'Hash functions that behave',
        body: 'A good hash spreads similar keys across different buckets and is cheap. For integers, `key % size` works if `size` does not share factors with the keys (a prime size, or mixing the bits first), because keys 10, 20, 30, 40 with size 10 all land in bucket 0. For strings, the standard recipe is a polynomial: `h = h * 31 + c` over the characters (Java’s `String.hashCode`). A hash must be **consistent with equality**: if `a == b`, then `hash(a) == hash(b)`, so a key must not change while it is in the table (a mutable list used as a key is the classic bug, and is why Python refuses it). The reverse is not required: different keys may share a hash, which is exactly a collision. In Java, overriding `equals` without `hashCode` silently breaks `HashMap` for that type.'
      },
      {
        name: 'Rolling hash: Rabin-Karp',
        body: 'To find a pattern of length m in a text, compute the polynomial hash of the pattern, then slide a window across the text, updating its hash in O(1): drop the leftmost letter’s contribution, multiply by the base, add the new letter. Where the hashes match, compare the actual characters to rule out a collision. Expected O(n + m); the worst case is O(n·m) if the hash is weak and keeps matching. The same window update powers Repeated DNA Sequences, Longest Duplicate Substring and many “is any window equal to another window” problems.',
        code: {
          py: `def rabin_karp(text, pat):
    n, m = len(text), len(pat)
    if m > n:
        return -1
    B, M = 131, 1_000_000_007
    top = pow(B, m - 1, M)                    #> Weight of the leftmost letter in a window
    hp = ht = 0
    for i in range(m):
        hp = (hp * B + ord(pat[i])) % M       #> Hash of the pattern
        ht = (ht * B + ord(text[i])) % M      #> Hash of the first window
    for i in range(n - m + 1):
        if hp == ht and text[i:i + m] == pat: #> Equal hashes: confirm, in case of a collision
            return i
        if i + m < n:                         #> Slide: drop text[i], add text[i + m]
            ht = ((ht - ord(text[i]) * top) * B + ord(text[i + m])) % M
    return -1`,
          js: `function rabinKarp(text, pat) {
  const n = text.length, m = pat.length;
  if (m > n) return -1;
  const B = 131, M = 1000000007;
  let top = 1;
  for (let i = 1; i < m; i++) top = (top * B) % M;       //> Weight of the leftmost letter in a window
  let hp = 0, ht = 0;
  for (let i = 0; i < m; i++) {
    hp = (hp * B + pat.charCodeAt(i)) % M;               //> Hash of the pattern
    ht = (ht * B + text.charCodeAt(i)) % M;              //> Hash of the first window
  }
  for (let i = 0; i + m <= n; i++) {
    if (hp === ht && text.startsWith(pat, i)) return i;  //> Equal hashes: confirm, in case of a collision
    if (i + m < n) {                                     //> Slide: drop text[i], add text[i + m]
      ht = (((ht - text.charCodeAt(i) * top) % M + M) * B + text.charCodeAt(i + m)) % M;
    }
  }
  return -1;
}`
        },
        tests: { fn: { py: 'rabin_karp', default: 'rabinKarp' }, cases: [
          { args: ['hello world', 'o w'], out: 4 }, { args: ['aaaaab', 'aab'], out: 3 }, { args: ['abc', 'abcd'], out: -1 },
          { args: ['abcabcabd', 'abd'], out: 6 }, { args: ['x', 'x'], out: 0 }, { args: ['mississippi', 'issip'], out: 4 }, { args: ['abab', 'ba'], out: 1 }] }
      },
      {
        name: 'Exact keys: bitmasks, tuples and reduced fractions',
        body: 'When the data is small, skip hashing tricks and build an **exact** key. Four DNA letters need 2 bits each, so a 10-letter window is a 20-bit integer: no collisions, no verification, and sliding is `((h << 2) | next) & mask`. A binary string of length k is a k-bit integer the same way. A row of a grid is a tuple (Python) or a joined string (JavaScript, Java). A ratio like 4/8 must be reduced by the gcd to 1/2 before it is a key: the float `0.5` is exact here, but `1/3` and `2/6` compare equal only by luck of rounding, and a float key is a bug waiting for a different input. The rule: if you can make the key exact, do; reach for a polynomial hash only when the key is too big to store.'
      },
      {
        name: 'Anti-hash tests and hash flooding',
        body: 'A hash table is O(1) only against inputs that do not know its hash. On contest sites, people craft inputs for a known `unordered_map` (C++) or `HashMap` (Java) so every key lands in one bucket and a “linear” solution times out; that is **hash flooding**. Defences: use a **randomized** hash (Python randomizes string hashes per process; in C++ add a custom hash with a random seed), or use a sorted structure (`std::map`, `TreeMap`) when O(log n) is acceptable. For polynomial hashing the same idea applies: use a random base, and a large modulus (or two moduli) so that no fixed input makes distinct windows collide. In interviews, one sentence is enough: “average O(1), worst case O(n), and I would use a randomized or larger-modulus hash if the input could be adversarial.”'
      },
      {
        name: 'When not to hash',
        body: 'If you need keys **in order**, the next larger key, or a range, a hash table cannot do it: use a sorted array with binary search, a heap, or a tree map. If the keys are small integers in a known range, a plain **array** is a perfect hash with no collisions and no resizing. And if you only need to compare two long strings once, comparing them directly is O(n) with no hashing at all.'
      }
    ],

    worked: [
      {
        lc: 705,
        restate: 'Build a set of non-negative integers with `add(key)`, `remove(key)` and `contains(key)`, without using the language’s built-in hash set or map. Keys are at most 10⁶, and there can be up to 10⁴ calls.',
        examples: '- `add(1)`, `add(2)`, `contains(1)` → true, `contains(3)` → false.\n- `add(2)` again leaves one copy; `contains(2)` → true.\n- `remove(2)`, then `contains(2)` → false.\n- Edge cases: adding a key twice, removing a key that is not there, and many keys that share a bucket.',
        brute: 'A boolean array of 10⁶ + 1 entries gives O(1) everything because the key range is small and fixed, and it is a fine answer to mention. It uses a megabyte even when the set is empty, and it stops working the moment the keys are strings or the range is unbounded, which is what the question is really testing.',
        insight: 'Keep an array of buckets, and let `key % size` pick the bucket. Each bucket is a small list (separate chaining), so a collision is just two keys sharing a list. `add` and `contains` scan one list; `remove` deletes from one list. To keep the lists short as the set grows, double the bucket array whenever the load factor passes 0.75 and reinsert every key.',
        code: {
          py: `class MyHashSet:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]
        self.count = 0

    def add(self, key: int) -> None:
        chain = self.buckets[key % len(self.buckets)]
        if key in chain:
            return
        chain.append(key)
        self.count += 1
        if self.count > 0.75 * len(self.buckets):   # too crowded: double and rehash
            old = self.buckets
            self.buckets = [[] for _ in range(2 * len(old))]
            for c in old:
                for k in c:
                    self.buckets[k % len(self.buckets)].append(k)

    def remove(self, key: int) -> None:
        chain = self.buckets[key % len(self.buckets)]
        if key in chain:
            chain.remove(key)
            self.count -= 1

    def contains(self, key: int) -> bool:
        return key in self.buckets[key % len(self.buckets)]`,
          js: `class MyHashSet {
  constructor() {
    this.buckets = Array.from({ length: 8 }, () => []);
    this.count = 0;
  }
  add(key) {
    const chain = this.buckets[key % this.buckets.length];
    if (chain.includes(key)) return;
    chain.push(key);
    this.count++;
    if (this.count > 0.75 * this.buckets.length) {   // too crowded: double and rehash
      const old = this.buckets;
      this.buckets = Array.from({ length: 2 * old.length }, () => []);
      for (const c of old) for (const k of c) this.buckets[k % this.buckets.length].push(k);
    }
  }
  remove(key) {
    const chain = this.buckets[key % this.buckets.length];
    const at = chain.indexOf(key);
    if (at >= 0) { chain.splice(at, 1); this.count--; }
  }
  contains(key) {
    return this.buckets[key % this.buckets.length].includes(key);
  }
}`,
          java: `class MyHashSet {
    private List<List<Integer>> buckets = new ArrayList<>();
    private int count = 0;

    public MyHashSet() {
        for (int i = 0; i < 8; i++) buckets.add(new ArrayList<>());
    }

    public void add(int key) {
        List<Integer> chain = buckets.get(key % buckets.size());
        if (chain.contains(key)) return;
        chain.add(key);
        count++;
        if (count > 0.75 * buckets.size()) {   // too crowded: double and rehash
            List<List<Integer>> old = buckets;
            buckets = new ArrayList<>();
            for (int i = 0; i < 2 * old.size(); i++) buckets.add(new ArrayList<>());
            for (List<Integer> c : old) for (int k : c) buckets.get(k % buckets.size()).add(k);
        }
    }

    public void remove(int key) {
        List<Integer> chain = buckets.get(key % buckets.size());
        if (chain.remove(Integer.valueOf(key))) count--;   // Integer.valueOf: remove by value, not by index
    }

    public boolean contains(int key) {
        return buckets.get(key % buckets.size()).contains(key);
    }
}`,
          cpp: `class MyHashSet {
    vector<list<int>> buckets;
    int count = 0;
public:
    MyHashSet() : buckets(8) {}

    void add(int key) {
        auto& chain = buckets[key % buckets.size()];
        if (find(chain.begin(), chain.end(), key) != chain.end()) return;
        chain.push_back(key);
        count++;
        if (count > 0.75 * buckets.size()) {   // too crowded: double and rehash
            vector<list<int>> old(buckets.size() * 2);
            swap(old, buckets);
            for (auto& c : old)
                for (int k : c) buckets[k % buckets.size()].push_back(k);
        }
    }

    void remove(int key) {
        auto& chain = buckets[key % buckets.size()];
        auto it = find(chain.begin(), chain.end(), key);
        if (it != chain.end()) { chain.erase(it); count--; }
    }

    bool contains(int key) {
        auto& chain = buckets[key % buckets.size()];
        return find(chain.begin(), chain.end(), key) != chain.end();
    }
};`
        },
        complexity: 'O(1) average per operation: one bucket, one short chain (load factor at most 0.75). An individual `add` that triggers a resize is O(n), but doubling makes that O(1) amortized. O(n) space.',
        say: '“I will use separate chaining: an array of buckets, each a small list, with `key % size` as the hash. `add` scans one chain and appends if the key is absent, `remove` deletes from one chain, `contains` scans one chain. To keep chains short I track the count and double the array when the load factor passes 0.75, rehashing every key, because a key’s bucket depends on the size. Operations are O(1) on average, and the resize is amortized O(1). The keys here are bounded by 10⁶, so a boolean array also works, but that does not generalize to other key types.”',
        followups: [
          { q: 'Why rehash on resize instead of copying the old buckets?', a: 'Because the bucket is `key % size`. With a new size the same key belongs somewhere else, so copying bucket i of the old array into bucket i of the new one would make `contains` look in the wrong place and miss keys that are present.' },
          { q: 'Why double instead of growing by a fixed amount?', a: 'Doubling makes the total resize work for n inserts about 2n (1 + 2 + 4 + … ), so each insert pays O(1) amortized. Growing by +k each time makes the work 1 + 2 + … + n/k, which is quadratic.' },
          { q: 'What if the keys are not integers?', a: 'Compute an integer hash first (for a string, a polynomial over the characters), reduce it with `% size`, and compare keys with `equals` inside the chain. The structure is unchanged; the hash function and the equality check are what you swap.' },
          { q: 'How would you make a lookup O(log n) in the worst case?', a: 'Turn a chain that grows past about 8 entries into a balanced tree, which is what Java’s `HashMap` does. Then even a flooded bucket costs O(log n) per operation.' }
        ]
      },
      {
        lc: 706,
        restate: 'Build a map from non-negative integer keys to integer values with `put(key, value)`, `get(key)` (return -1 if absent) and `remove(key)`, without using a built-in hash map. Writing a key that already exists replaces its value.',
        examples: '- `put(1, 1)`, `put(2, 2)`, `get(1)` → 1, `get(3)` → -1.\n- `put(2, 1)` updates, so `get(2)` → 1; after `remove(2)`, `get(2)` → -1.\n- Edge cases: removing then re-adding the same key, and keys that collide so a probe has to walk past a removed entry.',
        brute: 'A list of (key, value) pairs scanned on every call is O(n) per operation. Chaining (as in the set above) is the standard fix. For contrast, this solution uses **open addressing**: no lists, just three parallel arrays and linear probing.',
        insight: 'Store entries directly in the arrays. A key’s home slot is `key % capacity`; if it is taken by another key, step to the next slot (wrapping), and keep going. To look a key up, follow the same trail and stop at the first **empty** slot, because a key cannot be beyond one. Deleting must not leave a hole in the trail, so mark the slot **deleted** (a tombstone): lookups step over it, inserts may reuse it. Keep `used` (full plus deleted slots) at no more than half the capacity, so an empty slot always exists and trails stay short; rebuilding the table (doubling it, or just clearing tombstones) restores that.',
        code: {
          py: `class MyHashMap:
    def __init__(self):
        self.cap = 8
        self.keys = [0] * 8
        self.vals = [0] * 8
        self.state = [0] * 8     # 0 empty, 1 full, 2 deleted (tombstone)
        self.used = 0            # full + deleted: what lengthens a probe

    def _find(self, key):
        i = key % self.cap
        while self.state[i] != 0:                 # an empty slot ends the trail
            if self.state[i] == 1 and self.keys[i] == key:
                return i
            i = (i + 1) % self.cap
        return -1

    def _place(self, key, value):                 # insert a key known to be absent
        i = key % self.cap
        while self.state[i] == 1:
            i = (i + 1) % self.cap
        if self.state[i] == 0:
            self.used += 1                        # reusing a tombstone adds no new used slot
        self.keys[i], self.vals[i], self.state[i] = key, value, 1

    def _rebuild(self):
        old = [(k, v) for k, v, s in zip(self.keys, self.vals, self.state) if s == 1]
        if len(old) * 4 >= self.cap:
            self.cap *= 2                         # genuinely full: double. Otherwise it was tombstones
        self.keys, self.vals, self.state = [0] * self.cap, [0] * self.cap, [0] * self.cap
        self.used = 0
        for k, v in old:
            self._place(k, v)

    def put(self, key: int, value: int) -> None:
        i = self._find(key)
        if i >= 0:
            self.vals[i] = value
            return
        if (self.used + 1) * 2 > self.cap:
            self._rebuild()
        self._place(key, value)

    def get(self, key: int) -> int:
        i = self._find(key)
        return self.vals[i] if i >= 0 else -1

    def remove(self, key: int) -> None:
        i = self._find(key)
        if i >= 0:
            self.state[i] = 2`,
          js: `class MyHashMap {
  constructor() {
    this.cap = 8;
    this.keys = new Array(8).fill(0);
    this.vals = new Array(8).fill(0);
    this.state = new Array(8).fill(0);   // 0 empty, 1 full, 2 deleted (tombstone)
    this.used = 0;                       // full + deleted: what lengthens a probe
  }
  _find(key) {
    let i = key % this.cap;
    while (this.state[i] !== 0) {        // an empty slot ends the trail
      if (this.state[i] === 1 && this.keys[i] === key) return i;
      i = (i + 1) % this.cap;
    }
    return -1;
  }
  _place(key, value) {                   // insert a key known to be absent
    let i = key % this.cap;
    while (this.state[i] === 1) i = (i + 1) % this.cap;
    if (this.state[i] === 0) this.used++;   // reusing a tombstone adds no new used slot
    this.keys[i] = key; this.vals[i] = value; this.state[i] = 1;
  }
  _rebuild() {
    const old = [];
    for (let i = 0; i < this.cap; i++) if (this.state[i] === 1) old.push([this.keys[i], this.vals[i]]);
    if (old.length * 4 >= this.cap) this.cap *= 2;   // genuinely full: double. Otherwise it was tombstones
    this.keys = new Array(this.cap).fill(0);
    this.vals = new Array(this.cap).fill(0);
    this.state = new Array(this.cap).fill(0);
    this.used = 0;
    for (const [k, v] of old) this._place(k, v);
  }
  put(key, value) {
    const i = this._find(key);
    if (i >= 0) { this.vals[i] = value; return; }
    if ((this.used + 1) * 2 > this.cap) this._rebuild();
    this._place(key, value);
  }
  get(key) {
    const i = this._find(key);
    return i >= 0 ? this.vals[i] : -1;
  }
  remove(key) {
    const i = this._find(key);
    if (i >= 0) this.state[i] = 2;
  }
}`,
          java: `class MyHashMap {
    private int cap = 8, used = 0;                // used = full + deleted slots
    private int[] keys = new int[8], vals = new int[8], state = new int[8];   // state: 0 empty, 1 full, 2 deleted

    private int find(int key) {
        int i = key % cap;
        while (state[i] != 0) {                   // an empty slot ends the trail
            if (state[i] == 1 && keys[i] == key) return i;
            i = (i + 1) % cap;
        }
        return -1;
    }

    private void place(int key, int value) {      // insert a key known to be absent
        int i = key % cap;
        while (state[i] == 1) i = (i + 1) % cap;
        if (state[i] == 0) used++;                // reusing a tombstone adds no new used slot
        keys[i] = key; vals[i] = value; state[i] = 1;
    }

    private void rebuild() {
        int[] ok = keys, ov = vals, os = state;
        int oldCap = cap, live = 0;
        for (int i = 0; i < oldCap; i++) if (os[i] == 1) live++;
        if (live * 4 >= cap) cap *= 2;            // genuinely full: double. Otherwise it was tombstones
        keys = new int[cap]; vals = new int[cap]; state = new int[cap]; used = 0;
        for (int i = 0; i < oldCap; i++) if (os[i] == 1) place(ok[i], ov[i]);
    }

    public void put(int key, int value) {
        int i = find(key);
        if (i >= 0) { vals[i] = value; return; }
        if ((used + 1) * 2 > cap) rebuild();
        place(key, value);
    }

    public int get(int key) {
        int i = find(key);
        return i >= 0 ? vals[i] : -1;
    }

    public void remove(int key) {
        int i = find(key);
        if (i >= 0) state[i] = 2;
    }
}`,
          cpp: `class MyHashMap {
    int cap = 8, used = 0;                        // used = full + deleted slots
    vector<int> keys = vector<int>(8), vals = vector<int>(8), state = vector<int>(8);   // state: 0 empty, 1 full, 2 deleted

    int find(int key) {
        int i = key % cap;
        while (state[i] != 0) {                   // an empty slot ends the trail
            if (state[i] == 1 && keys[i] == key) return i;
            i = (i + 1) % cap;
        }
        return -1;
    }

    void place(int key, int value) {              // insert a key known to be absent
        int i = key % cap;
        while (state[i] == 1) i = (i + 1) % cap;
        if (state[i] == 0) used++;                // reusing a tombstone adds no new used slot
        keys[i] = key; vals[i] = value; state[i] = 1;
    }

    void rebuild() {
        vector<int> ok = keys, ov = vals, os = state;
        int oldCap = cap, live = 0;
        for (int i = 0; i < oldCap; i++) if (os[i] == 1) live++;
        if (live * 4 >= cap) cap *= 2;            // genuinely full: double. Otherwise it was tombstones
        keys.assign(cap, 0); vals.assign(cap, 0); state.assign(cap, 0); used = 0;
        for (int i = 0; i < oldCap; i++) if (os[i] == 1) place(ok[i], ov[i]);
    }

public:
    void put(int key, int value) {
        int i = find(key);
        if (i >= 0) { vals[i] = value; return; }
        if ((used + 1) * 2 > cap) rebuild();
        place(key, value);
    }

    int get(int key) {
        int i = find(key);
        return i >= 0 ? vals[i] : -1;
    }

    void remove(int key) {
        int i = find(key);
        if (i >= 0) state[i] = 2;
    }
};`
        },
        complexity: 'O(1) average per operation: with `used` kept at most half the capacity, an expected probe walks a couple of slots. Rebuilds are O(capacity) and happen after a constant fraction of the capacity has been used, so they are amortized O(1). O(n) space.',
        say: '“I will use open addressing with linear probing: three arrays for key, value and state, and a home slot of `key % capacity`. A lookup walks forward until it finds the key or an empty slot. Removing sets a tombstone instead of emptying the slot, because emptying it would cut the trail for keys that were pushed past it. I count full plus deleted slots as used and rebuild when that passes half the capacity: doubling if the table is really full, same size if it was mostly tombstones. That keeps probes short, so each operation is O(1) average.”',
        followups: [
          { q: 'Why not just empty the slot on remove?', a: 'Suppose keys A and B both hash to slot 3, A took slot 3 and B probed to slot 4. If you empty slot 3 when A is removed, a lookup for B stops at the empty slot 3 and wrongly reports it missing. A tombstone says “keep going”.' },
          { q: 'Why keep the load factor at most one half?', a: 'With linear probing the expected probes for a miss grow like 1 / (1 − load)² / 2, so at 0.5 it is about 2.5 and at 0.9 it is about 50. Open addressing has to stay emptier than chaining.' },
          { q: 'What is primary clustering?', a: 'With linear probing, filled slots form runs, and any key that hashes into a run extends it, so runs grow and merge. Quadratic probing or double hashing spreads the trail out at the cost of cache locality.' },
          { q: 'Chaining or open addressing in an interview?', a: 'Chaining is shorter and harder to get wrong, so default to it. Open addressing is worth knowing for the tombstone discussion and because real libraries (Python’s dict among them) use it.' }
        ]
      },
      {
        lc: 187,
        restate: 'A DNA string uses only the letters A, C, G and T. Return every 10-letter substring that occurs more than once. The answer can be in any order.',
        examples: '- `"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"` → `["AAAAACCCCC", "CCCCCAAAAA"]`.\n- `"AAAAAAAAAAAAA"` → `["AAAAAAAAAA"]`, reported once even though it occurs 4 times.\n- Edge cases: a string shorter than 10 letters has no answer, and overlapping occurrences count.',
        brute: 'Slice every 10-letter window as a string and put it in a set: O(10·n) time and O(10·n) memory, since every window is a fresh string to hash and store. It is accepted, but the work per window is proportional to the window length.',
        insight: 'There are only 4 letters, so each letter fits in **2 bits**, and a 10-letter window is a **20-bit integer**. Slide it with `h = ((h << 2) | code(next)) & mask`, which drops the oldest letter and adds the newest in O(1). The integer is an exact fingerprint: two windows are equal exactly when their integers are equal, so there are no collisions to verify. Keep one set of integers seen and another of integers already reported.',
        code: {
          py: `class Solution:
    def findRepeatedDnaSequences(self, s: str) -> List[str]:
        code = {'A': 0, 'C': 1, 'G': 2, 'T': 3}
        mask = (1 << 20) - 1                  # keep the newest 10 letters (2 bits each)
        seen, added, out = set(), set(), []
        h = 0
        for i, ch in enumerate(s):
            h = ((h << 2) | code[ch]) & mask  # slide: drop the oldest letter, add this one
            if i >= 9:                        # a full window ends here
                if h in seen and h not in added:
                    added.add(h)
                    out.append(s[i - 9:i + 1])
                seen.add(h)
        return out`,
          js: `function findRepeatedDnaSequences(s) {
  const code = { A: 0, C: 1, G: 2, T: 3 };
  const mask = (1 << 20) - 1;                // keep the newest 10 letters (2 bits each)
  const seen = new Set(), added = new Set(), out = [];
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 2) | code[s[i]]) & mask;      // slide: drop the oldest letter, add this one
    if (i >= 9) {                            // a full window ends here
      if (seen.has(h) && !added.has(h)) {
        added.add(h);
        out.push(s.slice(i - 9, i + 1));
      }
      seen.add(h);
    }
  }
  return out;
}`,
          java: `class Solution {
    public List<String> findRepeatedDnaSequences(String s) {
        int mask = (1 << 20) - 1;                 // keep the newest 10 letters (2 bits each)
        Set<Integer> seen = new HashSet<>(), added = new HashSet<>();
        List<String> out = new ArrayList<>();
        int h = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            int c = ch == 'A' ? 0 : ch == 'C' ? 1 : ch == 'G' ? 2 : 3;
            h = ((h << 2) | c) & mask;            // slide: drop the oldest letter, add this one
            if (i >= 9) {                         // a full window ends here
                if (seen.contains(h) && added.add(h)) out.add(s.substring(i - 9, i + 1));
                seen.add(h);
            }
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<string> findRepeatedDnaSequences(string s) {
        int mask = (1 << 20) - 1;                 // keep the newest 10 letters (2 bits each)
        unordered_set<int> seen, added;
        vector<string> out;
        int h = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            char ch = s[i];
            int c = ch == 'A' ? 0 : ch == 'C' ? 1 : ch == 'G' ? 2 : 3;
            h = ((h << 2) | c) & mask;            // slide: drop the oldest letter, add this one
            if (i >= 9) {                         // a full window ends here
                if (seen.count(h) && added.insert(h).second) out.push_back(s.substr(i - 9, 10));
                seen.insert(h);
            }
        }
        return out;
    }
};`
        },
        complexity: 'O(n) time: each letter updates the integer in O(1) and does two O(1) set operations. O(min(n, 4¹⁰)) space for the integers, at most about a million.',
        say: '“Putting 10-letter strings in a set works but costs O(10) per window. With four letters, each is 2 bits, so a window is a 20-bit integer, and I can slide it in O(1) by shifting left two, or-ing in the new letter and masking to 20 bits. The integer is an exact key, so no collision handling is needed. I keep a set of seen integers and a set of ones already reported, and emit the substring the first time an integer repeats. O(n) time.”',
        followups: [
          { q: 'What if the alphabet is larger?', a: 'Use more bits per letter while the window still fits in a machine word (5 bits per letter for 26 letters fits 12 letters in 60 bits). Beyond that, switch to a polynomial rolling hash and verify matches, since the fingerprint is no longer exact.' },
          { q: 'Why is the mask needed?', a: 'Each shift pushes the oldest letter’s bits above bit 19. Masking to 20 bits throws them away, which is exactly “remove the letter that left the window”.' },
          { q: 'How do you avoid returning a repeat several times?', a: 'The second set. Without it a substring that occurs 4 times would be reported on its 2nd, 3rd and 4th occurrences.' }
        ]
      },
      {
        lc: 1044,
        restate: 'Given a string of lowercase letters, return the longest substring that appears at least twice (the two occurrences may overlap). If no substring repeats, return the empty string. The string can have 30,000 letters.',
        examples: '- `"banana"` → `"ana"`: it appears at positions 1 and 3 and overlaps itself.\n- `"abcd"` → `""`: every letter is different.\n- `"aaaaa"` → `"aaaa"`.\n- Edge cases: a one-letter string, and a repeat that overlaps itself.',
        brute: 'Try every length from the longest down; for each, put all windows of that length in a set. Each length costs O(n · L) with string slicing, and there are n lengths: O(n³) in the worst case. Too slow for 30,000 letters.',
        insight: 'Two facts combine. First, **monotonicity**: if some substring of length L repeats, then its first L − 1 letters repeat too, so “a repeat of length L exists” flips from true to false exactly once as L grows. That means **binary search on the length**. Second, to test one length in O(n), use a **rolling hash** (Rabin-Karp): hash every window of that length in O(1) each, and store hash → start positions. When a window’s hash is already present, compare the actual substrings to rule out a collision. Total O(n log n) expected.',
        code: {
          py: `class Solution:
    def longestDupSubstring(self, s: str) -> str:
        n = len(s)
        B, M = 131, 1_000_000_007
        a = [ord(c) - 96 for c in s]            # letters become 1..26

        def find(L):                            # start of some repeated window of length L, or -1
            top = pow(B, L, M)                  # weight of the letter that leaves the window
            h = 0
            for i in range(L):
                h = (h * B + a[i]) % M
            seen = {h: [0]}                     # hash -> start positions with that hash
            for i in range(L, n):
                h = (h * B + a[i] - a[i - L] * top) % M   # slide the window one letter right
                start = i - L + 1
                for j in seen.get(h, ()):
                    if s[j:j + L] == s[start:start + L]:  # equal hash: confirm, it may be a collision
                        return start
                seen.setdefault(h, []).append(start)
            return -1

        lo, hi, best = 1, n - 1, ""
        while lo <= hi:                         # largest L for which a repeat exists
            mid = (lo + hi) // 2
            p = find(mid)
            if p >= 0:
                best = s[p:p + mid]
                lo = mid + 1
            else:
                hi = mid - 1
        return best`,
          js: `function longestDupSubstring(s) {
  const n = s.length, B = 131, M = 1000000007;
  const a = Array.from(s, (c) => c.charCodeAt(0) - 96);   // letters become 1..26

  function find(L) {                                       // start of some repeated window of length L, or -1
    let top = 1;
    for (let i = 0; i < L; i++) top = (top * B) % M;       // weight of the letter that leaves the window
    let h = 0;
    for (let i = 0; i < L; i++) h = (h * B + a[i]) % M;
    const seen = new Map([[h, [0]]]);                      // hash -> start positions with that hash
    for (let i = L; i < n; i++) {
      h = (((h * B + a[i] - a[i - L] * top) % M) + M) % M; // slide the window one letter right
      const start = i - L + 1;
      const list = seen.get(h);
      if (list) {
        for (const j of list) {
          if (s.substr(j, L) === s.substr(start, L)) return start;   // equal hash: confirm, it may be a collision
        }
        list.push(start);
      } else seen.set(h, [start]);
    }
    return -1;
  }

  let lo = 1, hi = n - 1, best = '';
  while (lo <= hi) {                                       // largest L for which a repeat exists
    const mid = (lo + hi) >> 1, p = find(mid);
    if (p >= 0) { best = s.substr(p, mid); lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}`,
          java: `class Solution {
    private static final long B = 131, M = 1_000_000_007L;
    private int[] a;
    private String s;

    private int find(int L) {                         // start of some repeated window of length L, or -1
        long top = 1;
        for (int i = 0; i < L; i++) top = top * B % M;   // weight of the letter that leaves the window
        long h = 0;
        for (int i = 0; i < L; i++) h = (h * B + a[i]) % M;
        Map<Long, List<Integer>> seen = new HashMap<>();   // hash -> start positions with that hash
        seen.computeIfAbsent(h, k -> new ArrayList<>()).add(0);
        for (int i = L; i < a.length; i++) {
            h = ((h * B + a[i] - a[i - L] * top) % M + M) % M;   // slide the window one letter right
            int start = i - L + 1;
            List<Integer> list = seen.computeIfAbsent(h, k -> new ArrayList<>());
            for (int j : list) {
                if (s.regionMatches(j, s, start, L)) return start;   // equal hash: confirm, it may be a collision
            }
            list.add(start);
        }
        return -1;
    }

    public String longestDupSubstring(String s) {
        this.s = s;
        int n = s.length();
        a = new int[n];
        for (int i = 0; i < n; i++) a[i] = s.charAt(i) - 'a' + 1;   // letters become 1..26
        int lo = 1, hi = n - 1, bestStart = 0, bestLen = 0;
        while (lo <= hi) {                            // largest L for which a repeat exists
            int mid = (lo + hi) >>> 1, p = find(mid);
            if (p >= 0) { bestStart = p; bestLen = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return s.substring(bestStart, bestStart + bestLen);
    }
}`,
          cpp: `class Solution {
    static constexpr long long B = 131, M = 1000000007LL;
    vector<int> a;
    string s;

    int find(int L) {                                 // start of some repeated window of length L, or -1
        long long top = 1;
        for (int i = 0; i < L; i++) top = top * B % M;   // weight of the letter that leaves the window
        long long h = 0;
        for (int i = 0; i < L; i++) h = (h * B + a[i]) % M;
        unordered_map<long long, vector<int>> seen;   // hash -> start positions with that hash
        seen[h].push_back(0);
        for (int i = L; i < (int)a.size(); i++) {
            h = ((h * B + a[i] - a[i - L] * top) % M + M) % M;   // slide the window one letter right
            int start = i - L + 1;
            auto& list = seen[h];
            for (int j : list) {
                if (s.compare(j, L, s, start, L) == 0) return start;   // equal hash: confirm, it may be a collision
            }
            list.push_back(start);
        }
        return -1;
    }

public:
    string longestDupSubstring(string str) {
        s = str;
        int n = s.size();
        a.assign(n, 0);
        for (int i = 0; i < n; i++) a[i] = s[i] - 'a' + 1;   // letters become 1..26
        int lo = 1, hi = n - 1, bestStart = 0, bestLen = 0;
        while (lo <= hi) {                            // largest L for which a repeat exists
            int mid = (lo + hi) / 2, p = find(mid);
            if (p >= 0) { bestStart = p; bestLen = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return s.substr(bestStart, bestLen);
    }
};`
        },
        complexity: 'O(n log n) expected time: about log₂ n binary-search rounds, each one pass of O(1) hash updates, plus a character comparison only when two hashes match (almost always a real repeat). O(n) space for the table of hashes.',
        say: '“If a substring of length L repeats, so does every shorter one, so I can binary search the length. For a fixed L I roll a polynomial hash across the string, so each window’s hash costs O(1), and keep a map from hash to start positions. When a hash is already there I compare the real substrings, which makes collisions harmless. If I find a repeat I try longer, otherwise shorter. That is O(n log n) expected time and O(n) space.”',
        followups: [
          { q: 'Why store a list of starts per hash instead of one?', a: 'Two different windows can share a hash. If you keep only the first, a later window might collide with it, fail the character check, and you would never compare it against the other window that really matches. A list keeps every candidate.' },
          { q: 'Is there a deterministic alternative?', a: 'A suffix array (or suffix automaton) finds the longest repeated substring in O(n log n) or O(n) with no hashing, at the price of much more code. Hashing plus binary search is the short interview answer.' },
          { q: 'What if an adversary picks the input?', a: 'A fixed base and modulus can be attacked. Pick the base at random, use a larger modulus (a 61-bit prime with 128-bit multiplication) or two moduli, and keep the verification step so a collision only costs time and never correctness.' },
          { q: 'Why is the answer allowed to overlap?', a: 'The window comparison does not care whether the two starts are L apart or less. For `"aaaaa"` the repeat `"aaaa"` starts at 0 and 1.' }
        ]
      }
    ],

    practice: [
      { lc: 705,
        hints: ['Make an array of buckets, and let `key % size` choose the bucket for every operation.', 'Each bucket is a small list. `add` skips keys already in it, `remove` deletes from it, `contains` scans it.', 'Count the keys, and double the bucket array (rehashing every key) when the count passes three quarters of the bucket count.'],
        starter: { py: 'class MyHashSet:\n    def __init__(self):\n        pass\n\n    def add(self, key: int) -> None:\n        pass\n\n    def remove(self, key: int) -> None:\n        pass\n\n    def contains(self, key: int) -> bool:\n        pass', js: 'class MyHashSet {\n  constructor() {\n    \n  }\n  add(key) {\n    \n  }\n  remove(key) {\n    \n  }\n  contains(key) {\n    \n  }\n}' },
        tests: { design: true, fn: 'MyHashSet', cases: [
          { ops: ['MyHashSet', 'add', 'add', 'contains', 'contains', 'add', 'contains', 'remove', 'contains'], args: [[], [1], [2], [1], [3], [2], [2], [2], [2]], out: [null, null, null, true, false, null, true, null, false] },
          { ops: ['MyHashSet', 'remove', 'contains', 'add', 'add', 'remove', 'contains', 'contains'], args: [[], [5], [5], [8], [16], [8], [16], [8]], out: [null, null, false, null, null, null, true, false] },
          { ops: ['MyHashSet', 'add', 'add', 'add', 'add', 'add', 'add', 'add', 'add', 'add', 'add', 'contains', 'contains', 'contains', 'remove', 'contains'], args: [[], [0], [8], [16], [24], [32], [40], [48], [56], [64], [72], [0], [72], [40], [40], [40]], out: [null, null, null, null, null, null, null, null, null, null, null, true, true, true, null, false] }] } },

      { lc: 706,
        hints: ['Store entries in arrays and use `key % capacity` as the home slot. On a collision step to the next slot (wrapping around).', 'A lookup follows the same trail and stops at the first empty slot. Removing must leave a tombstone, not an empty slot.', 'Keep full plus deleted slots at most half the capacity, and rebuild (doubling if mostly full, same size if mostly tombstones) when you would exceed it.'],
        starter: { py: 'class MyHashMap:\n    def __init__(self):\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def remove(self, key: int) -> None:\n        pass', js: 'class MyHashMap {\n  constructor() {\n    \n  }\n  put(key, value) {\n    \n  }\n  get(key) {\n    \n  }\n  remove(key) {\n    \n  }\n}' },
        tests: { design: true, fn: 'MyHashMap', cases: [
          { ops: ['MyHashMap', 'put', 'put', 'get', 'get', 'put', 'get', 'remove', 'get'], args: [[], [1, 1], [2, 2], [1], [3], [2, 1], [2], [2], [2]], out: [null, null, null, 1, -1, null, 1, null, -1] },
          { ops: ['MyHashMap', 'put', 'put', 'put', 'remove', 'get', 'get', 'put', 'get'], args: [[], [3, 30], [11, 110], [19, 190], [11], [19], [11], [11, 7], [11]], out: [null, null, null, null, null, 190, -1, null, 7] },
          mapStress()] } },

      { lc: 2001,
        hints: ['Two rectangles are interchangeable when `w1 / h1 == w2 / h2`. Comparing floats is risky, so find an exact key.', 'Reduce each `(w, h)` by their gcd, so 4:8 and 3:6 both become 1:2, and count how many rectangles share each reduced pair.', 'A group of c identical ratios contributes `c * (c - 1) / 2` pairs. Add them up.'],
        solution: { explain: 'Exact key (the gcd-reduced pair) plus counting. O(n log max) time for the gcds, O(n) space.', code: {
          py: `class Solution:
    def interchangeableRectangles(self, rectangles: List[List[int]]) -> int:
        counts = Counter()
        pairs = 0
        for w, h in rectangles:
            g = math.gcd(w, h)
            key = (w // g, h // g)
            pairs += counts[key]      # pairs it forms with the earlier ones
            counts[key] += 1
        return pairs`,
          js: `function interchangeableRectangles(rectangles) {
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const counts = new Map();
  let pairs = 0;
  for (const [w, h] of rectangles) {
    const g = gcd(w, h), key = (w / g) + ',' + (h / g);
    const c = counts.get(key) || 0;
    pairs += c;                       // pairs it forms with the earlier ones
    counts.set(key, c + 1);
  }
  return pairs;
}` } },
        starter: { py: 'class Solution:\n    def interchangeableRectangles(self, rectangles: List[List[int]]) -> int:\n        ', js: 'function interchangeableRectangles(rectangles) {\n  \n}' },
        tests: { fn: 'interchangeableRectangles', cases: [
          { args: [[[4, 8], [3, 6], [10, 20], [15, 30]]], out: 6 }, { args: [[[4, 5], [7, 8]]], out: 0 }, { args: [[[1, 1]]], out: 0 },
          { args: [[[2, 3], [4, 6], [6, 9], [3, 2]]], out: 3 }, { args: [[[100000, 1], [99999, 1], [100000, 1]]], out: 1 }] } },

      { lc: 2352,
        hints: ['A row and a column are equal when they hold the same numbers in the same order, so a whole row can be one key.', 'In Python a tuple is hashable; a list is not. In JavaScript, join the numbers into a string.', 'Count every row by its key, then for each column look up that column’s key and add the count.'],
        solution: { explain: 'Rows and columns turned into exact keys, then one lookup per column. O(n²) time and space.', code: {
          py: `class Solution:
    def equalPairs(self, grid: List[List[int]]) -> int:
        rows = Counter(map(tuple, grid))
        return sum(rows[col] for col in zip(*grid))   # zip(*grid) yields the columns as tuples`,
          js: `function equalPairs(grid) {
  const rows = new Map();
  for (const r of grid) {
    const key = r.join(',');
    rows.set(key, (rows.get(key) || 0) + 1);
  }
  let pairs = 0;
  for (let c = 0; c < grid.length; c++) {
    const key = grid.map((r) => r[c]).join(',');
    pairs += rows.get(key) || 0;
  }
  return pairs;
}` } },
        starter: { py: 'class Solution:\n    def equalPairs(self, grid: List[List[int]]) -> int:\n        ', js: 'function equalPairs(grid) {\n  \n}' },
        tests: { fn: 'equalPairs', cases: [
          { args: [[[3, 2, 1], [1, 7, 6], [2, 7, 7]]], out: 1 }, { args: [[[3, 1, 2, 2], [1, 4, 4, 5], [2, 4, 2, 2], [2, 4, 2, 2]]], out: 3 },
          { args: [[[1]]], out: 1 }, { args: [[[1, 1], [1, 1]]], out: 4 }, { args: [[[1, 2], [3, 4]]], out: 0 }] } },

      { lc: 1461,
        hints: ['There are exactly 2^k binary strings of length k, so you need to see all 2^k distinct windows of length k.', 'A window of k bits is a k-bit integer. Slide it with `h = ((h << 1) | bit) & mask`, where `mask = 2^k - 1`.', 'Put each full window’s integer in a set and stop as soon as the set has 2^k members.'],
        solution: { explain: 'A rolling bitmask is an exact hash of each window. O(n) time, O(2^k) space.', code: {
          py: `class Solution:
    def hasAllCodes(self, s: str, k: int) -> bool:
        need = 1 << k
        mask = need - 1
        seen, h = set(), 0
        for i, ch in enumerate(s):
            h = ((h << 1) | (ch == '1')) & mask   # slide: drop the oldest bit, add this one
            if i >= k - 1:
                seen.add(h)
                if len(seen) == need:
                    return True
        return False`,
          js: `function hasAllCodes(s, k) {
  const need = 1 << k, mask = need - 1;
  const seen = new Set();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 1) | (s[i] === '1' ? 1 : 0)) & mask;   // slide: drop the oldest bit, add this one
    if (i >= k - 1) {
      seen.add(h);
      if (seen.size === need) return true;
    }
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def hasAllCodes(self, s: str, k: int) -> bool:\n        ', js: 'function hasAllCodes(s, k) {\n  \n}' },
        tests: { fn: 'hasAllCodes', cases: [
          { args: ['00110110', 2], out: true }, { args: ['0110', 1], out: true }, { args: ['0110', 2], out: false },
          { args: ['0', 1], out: false }, { args: ['00110', 2], out: true }, { args: ['1', 2], out: false }] } },

      { lc: 2261,
        hints: ['There are at most n(n+1)/2 subarrays and n is small, so think of each distinct subarray as a distinct path of values.', 'Fix a start, extend to the right while the count of values divisible by p stays at most k, and stop when it exceeds k.', 'Insert the values into a trie as you extend, and count each node the first time it is created: that is one new distinct subarray.'],
        solution: { explain: 'A trie of values makes “seen this exact subarray before?” free: every start walks down the same trie, and a newly created node is a new distinct subarray. O(n²) time and space, which beats hashing whole slices (O(n³)).', code: {
          py: `class Solution:
    def countDistinct(self, nums: List[int], k: int, p: int) -> int:
        root = {}
        distinct = 0
        for i in range(len(nums)):
            node, bad = root, 0
            for j in range(i, len(nums)):
                if nums[j] % p == 0:
                    bad += 1
                    if bad > k:
                        break
                if nums[j] not in node:
                    node[nums[j]] = {}
                    distinct += 1            # a new path in the trie: a new distinct subarray
                node = node[nums[j]]
        return distinct`,
          js: `function countDistinct(nums, k, p) {
  const root = new Map();
  let distinct = 0;
  for (let i = 0; i < nums.length; i++) {
    let node = root, bad = 0;
    for (let j = i; j < nums.length; j++) {
      if (nums[j] % p === 0 && ++bad > k) break;
      if (!node.has(nums[j])) {
        node.set(nums[j], new Map());
        distinct++;                           // a new path in the trie: a new distinct subarray
      }
      node = node.get(nums[j]);
    }
  }
  return distinct;
}` } },
        starter: { py: 'class Solution:\n    def countDistinct(self, nums: List[int], k: int, p: int) -> int:\n        ', js: 'function countDistinct(nums, k, p) {\n  \n}' },
        tests: { fn: 'countDistinct', cases: [
          { args: [[2, 3, 3, 2, 2], 2, 2], out: 11 }, { args: [[1, 2, 3, 4], 4, 1], out: 10 }, { args: [[1], 0, 1], out: 0 },
          { args: [[3, 5], 0, 2], out: 3 }, { args: [[1, 1, 1], 1, 5], out: 3 }] } },

      { lc: 2156,
        hints: ['The hash of a window is `sum of val(s[i + j]) * power^j`, with a = 1 up to z = 26. Note that the **first** letter has the lowest power.', 'Scan the windows from the **right** end and update the hash as the window slides left: remove the letter that leaves (it has the highest power), multiply by `power`, add the new letter.', 'Remember the leftmost match while you scan, since the answer is the first such substring. Keep everything modulo `modulo` (use BigInt in JavaScript, because the products overflow).'],
        solution: { explain: 'A rolling hash that slides leftwards, because the weights run left to right. O(n) time, O(1) extra space. The only subtlety is the direction: sliding left lets the new letter take the power-0 spot with one multiplication.', code: {
          py: `class Solution:
    def subStrHash(self, s: str, power: int, modulo: int, k: int, hashValue: int) -> str:
        n = len(s)
        top = pow(power, k - 1, modulo)           # weight of the last letter of a window
        val = lambda c: ord(c) - 96
        h = 0
        for j in range(k):                        # the window at the right end, computed directly
            h = (h + val(s[n - k + j]) * pow(power, j, modulo)) % modulo
        best = n - k if h == hashValue else -1
        for i in range(n - k - 1, -1, -1):        # slide left
            h = ((h - val(s[i + k]) * top) * power + val(s[i])) % modulo
            if h == hashValue:
                best = i
        return s[best:best + k]`,
          js: `function subStrHash(s, power, modulo, k, hashValue) {
  const n = s.length, P = BigInt(power), M = BigInt(modulo), target = BigInt(hashValue);
  const val = (i) => BigInt(s.charCodeAt(i) - 96);
  let top = 1n;
  for (let j = 1; j < k; j++) top = (top * P) % M;   // weight of the last letter of a window
  let h = 0n, w = 1n;
  for (let j = 0; j < k; j++) {                      // the window at the right end, computed directly
    h = (h + val(n - k + j) * w) % M;
    w = (w * P) % M;
  }
  let best = h === target ? n - k : -1;
  for (let i = n - k - 1; i >= 0; i--) {             // slide left
    h = (((h - val(i + k) * top) * P + val(i)) % M + M) % M;
    if (h === target) best = i;
  }
  return s.substr(best, k);
}` } },
        starter: { py: 'class Solution:\n    def subStrHash(self, s: str, power: int, modulo: int, k: int, hashValue: int) -> str:\n        ', js: 'function subStrHash(s, power, modulo, k, hashValue) {\n  \n}' },
        tests: { fn: 'subStrHash', cases: [
          { args: ['leetcode', 7, 20, 2, 0], out: 'ee' }, { args: ['fbxzaad', 31, 100, 3, 32], out: 'fbx' },
          { args: ['abcabc', 3, 100, 2, 11], out: 'bc' }, { args: ['xmmhdakfursinye', 96, 45, 15, 21], out: 'xmmhdakfursinye' }] } },

      { lc: 1147,
        hints: ['Greedy works: whenever the shortest prefix equals the shortest suffix of the same length, cut both off and count 2 pieces.', 'Comparing every prefix and suffix as slices costs O(n) each. Keep a running hash of the current prefix chunk and of the current suffix chunk instead.', 'On equal hashes confirm with a slice compare (it only runs on real matches), reset both hashes, and at the end add 1 if a middle piece remains.'],
        solution: { explain: 'Greedily cut the shortest matching prefix and suffix. Running hashes of both chunks (grown one letter at a time from each end) make each check O(1). Expected O(n) time, since the confirming slice compare only runs when a chunk is really cut.', code: {
          py: `class Solution:
    def longestDecomposition(self, text: str) -> int:
        n, B, M = len(text), 131, 1_000_000_007
        left = right = 0
        pw = 1                       # B^(k-1) for the current chunk length k
        start = res = 0
        for i in range(n // 2):
            left = (left * B + ord(text[i])) % M                  # prefix chunk text[start..i]
            right = (right + ord(text[n - 1 - i]) * pw) % M       # suffix chunk text[n-1-i..n-1-start]
            if left == right and text[start:i + 1] == text[n - 1 - i:n - start]:
                res += 2
                start = i + 1
                left = right = 0
                pw = 1
            else:
                pw = pw * B % M
        return res + (1 if 2 * start < n else 0)`,
          js: `function longestDecomposition(text) {
  const n = text.length, B = 131, M = 1000000007;
  let left = 0, right = 0, pw = 1, start = 0, res = 0;   // pw = B^(k-1) for the current chunk length k
  for (let i = 0; i < Math.floor(n / 2); i++) {
    left = (left * B + text.charCodeAt(i)) % M;                       // prefix chunk text[start..i]
    right = (right + text.charCodeAt(n - 1 - i) * pw) % M;           // suffix chunk text[n-1-i..n-1-start]
    if (left === right && text.slice(start, i + 1) === text.slice(n - 1 - i, n - start)) {
      res += 2;
      start = i + 1;
      left = right = 0;
      pw = 1;
    } else {
      pw = (pw * B) % M;
    }
  }
  return res + (2 * start < n ? 1 : 0);
}` } },
        starter: { py: 'class Solution:\n    def longestDecomposition(self, text: str) -> int:\n        ', js: 'function longestDecomposition(text) {\n  \n}' },
        tests: { fn: 'longestDecomposition', cases: [
          { args: ['ghiabcdefhelloadamhelloabcdefghi'], out: 7 }, { args: ['merchant'], out: 1 }, { args: ['antaprezatepzapreanta'], out: 11 },
          { args: ['aaa'], out: 3 }, { args: ['abab'], out: 2 }, { args: ['a'], out: 1 }] } },

      { lc: 187,
        hints: ['Every window has exactly 10 letters from a 4-letter alphabet, so a window is small enough to fit in an integer.', 'Give each letter 2 bits. Slide the window with `h = ((h << 2) | code) & mask`, where the mask keeps 20 bits.', 'Remember which integers you have seen and which you have already reported, so each repeated window appears once.'],
        starter: { py: 'class Solution:\n    def findRepeatedDnaSequences(self, s: str) -> List[str]:\n        ', js: 'function findRepeatedDnaSequences(s) {\n  \n}' },
        tests: { fn: 'findRepeatedDnaSequences', compare: 'unordered', sig: { args: ['str'] }, cases: [
          { args: ['AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT'], out: ['AAAAACCCCC', 'CCCCCAAAAA'] }, { args: ['AAAAAAAAAAAAA'], out: ['AAAAAAAAAA'] },
          { args: ['ACGT'], out: [] }, { args: ['AAAAAAAAAAA'], out: ['AAAAAAAAAA'] }, { args: ['ACGTACGTACGTACGTACGT'], out: ['ACGTACGTAC', 'CGTACGTACG', 'GTACGTACGT', 'TACGTACGTA'] }] } },

      { lc: 1044,
        hints: ['If a substring of length L repeats, then some substring of length L - 1 repeats too. What does that let you do to the length?', 'For one fixed length, hash every window with a rolling hash and look for a hash you have already seen.', 'A matching hash is only a candidate: compare the real substrings. Store a list of starts per hash so a collision cannot hide a true match.'],
        starter: { py: 'class Solution:\n    def longestDupSubstring(self, s: str) -> str:\n        ', js: 'function longestDupSubstring(s) {\n  \n}' },
        tests: { fn: 'longestDupSubstring', sig: { args: ['str'] }, cases: [
          { args: ['banana'], out: 'ana' }, { args: ['abcd'], out: '' }, { args: ['aaaaa'], out: 'aaaa' },
          { args: ['abcabc'], out: 'abc' }, { args: ['aabcaabdaab'], out: 'aab' }, { args: ['a'], out: '' }] } }
    ],

    mistakes: [
      '**Rehashing with the old size, or not rehashing at all.** After a resize, a key’s bucket is `hash % newSize`. Copying bucket i to bucket i makes `contains` look in the wrong place and miss keys that are in the table.',
      '**Growing by a constant instead of doubling.** Adding 10 slots each time makes n inserts cost O(n²). Multiply the size.',
      '**Emptying a slot on delete in open addressing.** It breaks the trail for any key that probed past it, so those keys become unfindable. Leave a tombstone, and count tombstones toward the load factor.',
      '**Probing forever.** An open-addressing table with no empty slot never ends a failed lookup. Keep the load factor below 1 (about 0.5 for linear probing) and rebuild before you hit it.',
      '**Mutating a key after inserting it.** The entry sits in the bucket for the old hash and can no longer be found. Use immutable keys (a tuple, a string), never a list or an object you edit.',
      '**`equals` without `hashCode` (Java), or equal objects with different hashes.** Two keys that compare equal must hash equal. Otherwise `HashMap` and `HashSet` treat them as different keys, and lookups fail intermittently.',
      '**Negative remainders.** In Java, C++ and JavaScript `-3 % 8` is `-3`, an invalid index. Python returns 5. For possibly negative hashes use `((h % n) + n) % n`, or mask with `h & 0x7fffffff` first. The same applies to the “remove the old letter” step of a rolling hash, which can go negative before you reduce it.',
      '**Overflow in a rolling hash.** `hash * base` can exceed a 32-bit `int` in Java/C++ and 2⁵³ in JavaScript. Use `long` (with a modulus near 10⁹, so the product fits in 64 bits), BigInt in JavaScript, or a smaller modulus.',
      '**Trusting a matching hash.** Equal hashes do not mean equal strings. Either compare the substrings when the hashes match, or use an exact key (a bitmask) where equal means equal.',
      '**Using a float, or a list, as a key.** Floats that look equal can differ in the last bit, and lists are unhashable in Python or compare by reference elsewhere. Reduce a fraction by its gcd, and turn a row into a tuple or a joined string.',
      '**A weak hash for a structured key.** `key % size` with keys that are all multiples of 10 and a size of 10 puts everything in one bucket. Use a prime size, or mix the bits before reducing.',
      '**Quoting “O(1)” without the qualifier.** Say “average O(1), worst case O(n)”, and note that the cost of hashing a key of length k is O(k).'
    ],

    quiz: [
      { kind: 'concept', q: 'Two different keys land in the same bucket of a hash table. What is this called, and what does separate chaining do about it?',
        choices: ['A collision; each bucket holds a list and both keys go in it', 'An overflow; the table is rebuilt immediately', 'A rehash; the second key replaces the first', 'A load; the second key is rejected'], answer: 0,
        explain: 'Two keys with the same bucket index collide. With chaining, a bucket is a list, so both keys live in that list and a lookup scans it. Open addressing, the alternative, moves the second key to another slot.' },
      { kind: 'concept', q: 'A table has 8 buckets and now holds 7 keys. What is its load factor, and what do most tables do about it?',
        choices: ['0.875; they allocate a bigger array and rehash every key', '7; they delete the oldest key', '0.875; they copy the old buckets into a bigger array unchanged', '1.14; they switch to a sorted list'], answer: 0,
        explain: 'Load factor is entries divided by buckets, 7 / 8 = 0.875. Past the threshold (0.75 for chaining) the table allocates a larger bucket array and reinserts every key, because a key’s bucket depends on the table size. Copying the buckets unchanged would put keys in the wrong places.' },
      { kind: 'complexity', q: 'Why is inserting into a doubling hash table O(1) amortized even though one insert can trigger an O(n) rehash?',
        choices: ['The rehash happens only after the count has grown by about half the size, so its cost is spread over many cheap inserts', 'The rehash is O(1) because the keys are already hashed', 'Rehashing never happens in practice', 'Doubling makes the table sorted'], answer: 0,
        explain: 'Resizes happen at sizes 8, 16, 32, …, so the total copying for n inserts is about 1 + 2 + 4 + … + n ≈ 2n. Spread over n inserts that is O(1) each. Growing by a fixed amount would break this and make it O(n²).' },
      { kind: 'bug', q: 'This open-addressing delete passes a quick test but later fails to find keys that are still in the table. What is the bug?',
        code: `def remove(self, key):
    i = key % self.cap
    while self.state[i] != EMPTY:
        if self.keys[i] == key:
            self.state[i] = EMPTY        # free the slot
            return
        i = (i + 1) % self.cap`,
        choices: ['Setting the slot to EMPTY cuts the probe trail for keys that were pushed past it; it should mark a tombstone', 'It should have set the key to 0', 'The loop should step by 2', 'It should rebuild the whole table on every delete'], answer: 0,
        explain: 'A lookup stops at the first empty slot. If a key B probed past this slot when it was occupied, B is now unreachable. Marking the slot deleted (a tombstone) tells lookups to keep walking.' },
      { kind: 'concept', q: 'Why must two keys that compare equal always have the same hash?',
        choices: ['Otherwise they could be filed in different buckets, and a lookup would look in the wrong one and miss', 'Because hashes must be unique', 'Because equal keys are stored once on disk', 'Only to make hashing faster'], answer: 0,
        explain: 'A lookup computes the hash and goes straight to one bucket. If an equal key had hashed elsewhere, it would never be found. The converse is not required: unequal keys may share a hash (a collision).' },
      { kind: 'pattern', q: 'Which of these problems is best solved with a rolling hash (or an exact bitmask fingerprint) of a sliding window?',
        choices: ['Find a 10-letter DNA sequence that occurs more than once', 'Find the k-th smallest number in an unsorted list', 'Check whether brackets are balanced', 'Count the islands in a grid'], answer: 0,
        explain: 'Comparing every pair of windows letter by letter is too slow; a fingerprint updated in O(1) per slide makes each window comparable in O(1). The others are a heap or quickselect, a stack and a graph search.' },
      { kind: 'concept', q: 'In Rabin-Karp, two windows have equal hashes. What should the algorithm do before reporting a match?',
        choices: ['Compare the actual characters, because different strings can share a hash', 'Nothing: equal hashes prove equal strings', 'Rehash with a different base twice', 'Sort both windows'], answer: 0,
        explain: 'A hash maps many strings to few numbers, so collisions are possible. Verifying costs O(m), but it runs only when hashes match, which is almost always a true match, so the expected time stays O(n + m).' },
      { kind: 'complexity', q: 'Longest Duplicate Substring runs a Rabin-Karp pass inside a binary search on the length. What is the expected total time for a string of length n?',
        choices: ['O(n log n)', 'O(n)', 'O(n²)', 'O(n² log n)'], answer: 0,
        explain: 'Binary search tries about log₂ n lengths, and each length is one O(n) pass with O(1) hash updates. The search is valid because a repeat of length L implies a repeat of every shorter length.' },
      { kind: 'concept', q: 'You insert keys 10, 20, 30, 40 into a table with 10 buckets using `key % size`. What goes wrong, and what fixes it?',
        choices: ['They all land in bucket 0, so lookups scan one chain; use a size that shares no factor with the keys (a prime) or mix the hash first', 'Nothing goes wrong; the table is perfectly balanced', 'The table is too large; shrink it', 'The keys must be sorted first'], answer: 0,
        explain: 'Every multiple of 10 is 0 mod 10, so all four collide, and a lookup degrades to a linear scan. A prime table size, or scrambling the key’s bits before reducing, spreads such keys out.' },
      { kind: 'concept', q: 'Which statements about hash table complexity are true? Pick every one that applies.',
        choices: ['Average lookup is O(1) with a good hash function and a bounded load factor', 'Worst-case lookup can be O(n) if many keys collide', 'Hashing a string key of length k costs O(k)', 'A hash table keeps its keys in sorted order'], answer: [0, 1, 2],
        explain: 'The first three are the standard honest summary. A hash table does not keep keys in order; for that you need a tree map or a sorted array.' }
    ],

    flashcards: [
      { id: 'what-is-hash-table', front: 'What are the three parts of a hash table?', back: 'A hash function (key to integer), an array of buckets (slot = hash % size), and a collision strategy for keys that share a slot.' },
      { id: 'chaining-vs-open', front: 'Separate chaining vs open addressing?', back: 'Chaining: each bucket holds a list, collisions join the list. Open addressing: one entry per slot, a collision probes to another slot. Open addressing needs a lower load factor and tombstones for deletes.' },
      { id: 'load-factor', front: 'What is the load factor and when do you resize?', back: 'Entries divided by buckets. Resize past a limit (about 0.75 for chaining, about 0.5 for linear probing): allocate 2x buckets and reinsert every key.' },
      { id: 'why-rehash', front: 'Why must a resize rehash every key?', back: 'The bucket is hash % size. When the size changes, so does every key’s bucket, so copying buckets over unchanged makes lookups miss.' },
      { id: 'amortized-resize', front: 'Why is a doubling table O(1) amortized per insert?', back: 'Resizes cost 1 + 2 + 4 + … ≈ 2n in total over n inserts, so about O(1) each. Growing by a fixed step would be O(n²).' },
      { id: 'worst-case', front: 'When is a hash lookup O(n)?', back: 'When many keys collide into the same bucket (a weak hash, keys sharing a factor with the size, or an adversary). Java trees a long chain to get O(log n).' },
      { id: 'tombstone', front: 'Why do open-addressing tables use tombstones?', back: 'Lookups stop at the first empty slot. Emptying a deleted slot would hide keys that probed past it, so it is marked deleted: lookups skip it, inserts may reuse it.' },
      { id: 'equals-hash', front: 'What contract must hash and equality satisfy?', back: 'If a == b then hash(a) == hash(b). The reverse need not hold. Keys must not change while in the table; override hashCode whenever you override equals.' },
      { id: 'rolling-hash', front: 'How does a rolling hash slide a window in O(1)?', back: 'Subtract the leaving letter times base^(m-1), multiply by base, add the new letter, all mod M. Equal windows have equal hashes; verify on a match.' },
      { id: 'exact-key', front: 'When can you skip hashing tricks and use an exact key?', back: 'When the window fits in an integer: 2 bits per DNA letter, 1 bit per binary digit. A bitmask is collision-free, so no verification is needed.' },
      { id: 'hash-flooding', front: 'What is hash flooding and the defence?', back: 'Crafted keys that all collide turn O(1) into O(n). Use a randomized hash or random base and a large modulus, or a tree map when O(log n) is fine.' },
      { id: 'neg-mod', front: 'Pitfall when reducing a hash with `%`?', back: 'In Java, C++ and JavaScript the remainder can be negative. Use ((h % n) + n) % n, or mask to non-negative first. Python’s % is already non-negative.' }
    ],

    deeper: [
      { title: 'Hash table (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Hash_table', time: 'about 25 min', note: 'The reference article: hash functions, chaining, open addressing with linear and quadratic probing, resizing, and complexity. Read the collision-resolution and dynamic-resizing sections.' },
      { title: 'String hashing (cp-algorithms)', url: 'https://cp-algorithms.com/string/string-hashing.html', time: 'about 20 min', note: 'Polynomial hashing, how to choose the base and modulus, collision probability, and uses such as comparing substrings in O(1). The best single page for the rolling-hash half of this topic.' },
      { title: 'Rabin-Karp algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/string/rabin-karp.html', time: 'about 10 min', note: 'The pattern-search algorithm with a worked implementation, plus the problems it solves.' },
      { title: 'Blowing up unordered_map (Codeforces blog)', url: 'https://codeforces.com/blog/entry/62393', time: 'about 10 min', note: 'How inputs are crafted to make C++ `unordered_map` quadratic, and how a custom randomized hash defeats them. Read it for the anti-hash discussion.' },
      { title: 'HashMap (Java documentation)', url: 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/HashMap.html', time: 'reference', note: 'The initial capacity and load factor contract in one place, and the note that iteration order is not guaranteed.' }
    ],

    detective: [
      { id: 'own-registry', decoys: ['arrays-hashing', 'design-ds', 'binary-search'],
        statement: 'A small embedded device has no dictionary or set type in its toolkit, only plain arrays and the ability to write functions. Its firmware must keep track of up to ten thousand registered tag numbers, each a whole number below a million, and answer “is this tag registered?”, “register it” and “unregister it” quickly, however many tags come and go. The review board also asks what happens if hundreds of tags happen to share the same remainder when divided by the array length.',
        why: 'There is no built-in map to lean on: the task is to build one. The array plus a rule that turns a tag into an index, the question about tags sharing a remainder (collisions), and the requirement to stay quick as the tag count grows (load factor and resizing) all point to constructing a hash table from scratch.' },
      { id: 'genome-twins', decoys: ['sliding-window', 'string-algos', 'arrays-hashing'],
        statement: 'A lab stores a genome fragment as one very long string over a four-letter alphabet. Scientists want every stretch of exactly twelve letters that shows up at least twice anywhere in the fragment, and the fragment is millions of letters long. Writing out each stretch and comparing it with all the others is far too slow, and even copying each stretch into a set uses too much work per stretch. Each stretch’s fingerprint has to come from the previous stretch’s in a constant number of steps.',
        why: 'The key phrase is that each window’s fingerprint is derived from the previous one in constant time. With only four letters a twelve-letter stretch packs into a 24-bit integer that slides by shifting and masking, which is an exact rolling hash. Equal fingerprints mean equal stretches, so a set of integers finds the repeats.' },
      { id: 'echo-passage', decoys: ['binary-search', 'string-algos', 'sliding-window'],
        statement: 'A plagiarism checker is handed a single essay of up to thirty thousand characters and must report the longest passage that appears at least twice in it (the two appearances may overlap). Trying every passage against every other is hopeless. The reviewer points out that if a passage of some length appears twice, then so does the same passage with its last character removed, and that a quick way to compare equal-length passages is needed for each guessed length.',
        why: 'Two cues: the “if it repeats at length L, it repeats at L-1” remark lets you guess the length by halving, and the need to compare all equal-length passages quickly is the job of a rolling hash that gives every window a fingerprint in O(1). Matching fingerprints are confirmed by comparing the text.' }
    ]
  });
})();
