/* Low-level design: LRU cache as a reusable component. The code under "Code" was compiled and run (Python, Node, javac, g++ -std=c++17 -Wall -Wextra) before it was pasted here. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.lld = SD.lld || [];
  SD.lld.push({
    id: 'lru-cache-design',
    title: 'Design an LRU cache (the class-design view)',
    short: 'A generic cache component: a hash map plus a doubly linked list with sentinels, a pluggable eviction policy, thread safety and tests.',
    difficulty: 'Medium',
    time: '45 min',
    tags: ['Strategy', 'Generics', 'Concurrency', 'Data structures', 'Extensibility'],
    prompt: 'Design a generic in-memory cache with a fixed capacity that evicts the least recently used entry when full. Make it something other code can depend on: clean interfaces, swappable eviction, safe for many threads.',

    requirements: {
      functional: [
        '`get(key)` returns the value or a clear "missing" result, and counts as a **use** of that key.',
        '`put(key, value)` inserts or **updates**. An update replaces the value and also counts as a use.',
        'When a new key arrives and the cache is full, evict one entry chosen by the **eviction policy** (least recently used by default) and report which key it was.',
        '`remove(key)` deletes an entry and frees its slot without evicting anything else.',
        'The key and value types are **generic**. Capacity is fixed at construction and must be at least 1.',
        'Eviction is **pluggable**: LRU, FIFO and LFU are different policy objects behind one interface.'
      ],
      nonFunctional: [
        '`get` and `put` are **O(1)** on average, not O(n).',
        'Safe when many threads share one cache: the size never exceeds capacity and map and recency order never disagree.',
        'The cache never holds more than capacity entries, even for an instant visible to other threads.',
        'Behavior is deterministic, so every eviction order can be tested without sleeps or clocks.'
      ],
      assumptions: [
        'In-process memory only; no persistence and no network.',
        'Values are opaque, and the cache never copies or inspects them.',
        'A miss is not an error: callers decide what a miss means (usually "load it and put it").'
      ],
      outOfScope: [
        'Distributed caches, replication and consistent hashing (see the system design fundamentals).',
        'Loading on miss, write-through and write-back: a wrapper around this component.',
        'TTL and size-based (bytes) eviction: covered as extensions.'
      ],
      clarify: [
        { q: 'Does reading a key count as using it? What about updating it?', a: 'Yes to both for LRU: both mark the key as most recent. This is exactly what the policy interface models: a read and an update both call `onAccess`. A FIFO policy ignores accesses, an LFU policy counts them.' },
        { q: 'What do I return on a miss, and can a value be null?', a: 'Return an explicit "missing" (Optional in Java and C++, a default argument in Python, undefined in JS). Ask whether null values are legal. If they are, a null return is ambiguous, which is the reason to prefer Optional.' },
        { q: 'Should `put` tell the caller what was evicted?', a: 'Yes, return the evicted key. Callers use it to close a resource or write back a dirty entry, and tests use it to assert order without poking at internals.' },
        { q: 'Is it multi-threaded, and is it read-heavy?', a: 'Assume yes to threads. Note the twist: even `get` mutates the recency list, so a read-write lock does not help for strict LRU. A single mutex is the right start, and striping the cache is the upgrade when profiling shows contention.' },
        { q: 'Is this the LeetCode 146 problem?', a: 'Same core, different goal. LeetCode 146 asks for the two-structure trick with int keys. Here the interviewer wants the **component**: generics, interfaces, an eviction strategy, concurrency and tests. Build the core first, then show those.' },
        { q: 'Do entries expire?', a: 'Not in the core. Mention TTL as an extension: store an expiry time per entry and check it lazily on `get`, plus an optional background sweep.' }
      ]
    },

    classDiagram: {
      title: 'LRU cache class diagram',
      intro: 'This is the **component** view of the cache. Under the hood the trick is still a hash map plus a doubly linked list; the [LeetCode 146 treatment in Design data structures](#/topic/design-ds) walks through that algorithm with a visualizer. Here the question is how the pieces are cut so that other code can use and extend them: the cache owns the **values**, the policy owns the **order**. Click a class to see why it exists.',
      classes: [
        { id: 'cache', name: 'Cache<K, V>', kind: 'interface', fields: [], methods: ['+ get(key): V?', '+ put(key, value): K?', '+ remove(key): bool', '+ size(): int'],
          detail: { why: 'What callers depend on. Four methods and no mention of eviction, locking or lists, so a different cache (sharded, TTL, no-op for tests) drops in.', tradeoffs: ['An interface for one implementation is only justified here because test doubles and decorators (metrics, TTL) are real needs.'], alternatives: ['Depend on the concrete class directly: simpler, harder to fake in tests.'], scale: 'n/a' } },
        { id: 'policycache', name: 'PolicyCache<K, V>', fields: ['- capacity: int', '- policy: EvictionPolicy<K>', '- data: Map<K, V>', '- lock'], methods: ['+ get(key)', '+ put(key, value)', '+ remove(key)', '+ size()'],
          detail: { why: 'Owns the key to value map, the capacity rule and the lock. It decides **when** to evict (map full and the key is new); the policy decides **which** key.', tradeoffs: ['Splitting values (cache) from order (policy) means the policy never touches values and never has to be generic over V.', 'Every call goes through the lock, then the policy: two lookups per get.'], alternatives: ['A cache class that hard-codes the linked list: one class fewer, no way to try FIFO or LFU.'], scale: 'The lock is the first thing to stripe if many cores share one cache.' } },
        { id: 'policy', name: 'EvictionPolicy<K>', kind: 'interface', fields: [], methods: ['+ onInsert(key)', '+ onAccess(key)', '+ onRemove(key)', '+ evict(): K'],
          detail: { why: 'Strategy for "which entry goes". The cache reports events (inserted, used, removed) and asks for a victim, and the policy keeps whatever bookkeeping it needs.', tradeoffs: ['Four callbacks is the minimum that lets LRU, FIFO and LFU all work.', 'The policy has its own key set, so memory per entry is a bit higher than a fused design.'], alternatives: ['A comparator over entries and a scan at eviction time: simple, O(n).'], scale: 'n/a' } },
        { id: 'lru', name: 'LruPolicy<K>', fields: ['- nodes: Map<K, Node>', '- order: DList<K>'], methods: ['+ onInsert / onAccess / onRemove', '+ evict(): K'],
          detail: { why: 'Hash map from key to list node, plus the list in recency order (front = most recent). Every event is a few pointer assignments, so all four callbacks are O(1).', tradeoffs: ['Two structures that must always agree; one class owns both so they cannot drift.'], alternatives: ['A language ordered map (Python OrderedDict, Java LinkedHashMap with access order) is less code and hides the mechanism the interviewer wants to see.'], scale: 'O(1) per operation; memory is one node per key.' } },
        { id: 'fifo', name: 'FifoPolicy<K>', fields: [], methods: ['+ onAccess(key): does nothing'],
          detail: { why: 'The same list, but reads do not reorder, so the oldest **insert** is evicted. One overridden method proves the interface carries its weight.', tradeoffs: ['Inherits from the LRU policy to share the list; if the two diverge, extract a shared base instead.'], alternatives: ['A queue and a set.'], scale: 'O(1).' } },
        { id: 'lfu', name: 'LfuPolicy<K>', fields: ['- stats: Map<K, (count, tick)>', '- clock: long'], methods: ['+ onInsert / onAccess / onRemove', '+ evict(): K'],
          detail: { why: 'Counts uses and evicts the least frequently used key, with ties going to the least recently used. Keeps hot keys alive when a scan of one-off keys would flush an LRU.', tradeoffs: ['This version scans for the victim, O(n). Frequency buckets (a list per count) make it O(1) but are much more code.', 'Old popular keys can linger forever unless counts decay.'], alternatives: ['The O(1) design from LeetCode 460.'], scale: 'Use buckets once capacity reaches thousands.' } },
        { id: 'dlist', name: 'DList<K>', fields: ['- head: Node (sentinel)', '- tail: Node (sentinel)'], methods: ['+ pushFront(node)', '+ unlink(node)', '+ popBack(): Node?'],
          detail: { why: 'A doubly linked list with two sentinel nodes, so insert and unlink never check for null head, tail or empty list. Unlinking a node needs no search because the node knows its neighbors.', tradeoffs: ['Two dummy nodes of memory buy the removal of every edge case.'], alternatives: ['A standard library linked list with iterators, which is fine and just hides the point.'], scale: 'O(1) for every method.' } },
        { id: 'node', name: 'Node<K>', fields: ['+ key: K', '+ prev: Node', '+ next: Node'], methods: [],
          detail: { why: 'Stores the key so that evicting the last node can tell the policy and the cache which key to delete.', tradeoffs: ['Values live in the cache map, not here, so the list stays small and generic.'], alternatives: ['Store (key, value) in the node and make the cache a single map to nodes: fewer lookups, but the policy now owns the values.'], scale: 'One allocation per entry.' } }
      ],
      relations: [
        { from: 'policycache', to: 'cache', type: 'implements' },
        { from: 'policycache', to: 'policy', type: 'aggregates', label: 'uses' },
        { from: 'lru', to: 'policy', type: 'implements' },
        { from: 'lfu', to: 'policy', type: 'implements' },
        { from: 'fifo', to: 'lru', type: 'inherits' },
        { from: 'lru', to: 'dlist', type: 'composes', fromMult: '1', toMult: '1' },
        { from: 'dlist', to: 'node', type: 'composes', fromMult: '1', toMult: '*' }
      ]
    },

    decisions: [
      { title: 'Eviction is a Strategy; the cache owns values, the policy owns order', pattern: 'Strategy',
        body: 'The cache decides **when** to evict: the key is new and the map is at capacity. Which key goes is a separate question with many answers (least recently used, first in, least frequently used, random). So the cache reports events to an `EvictionPolicy` (`onInsert`, `onAccess`, `onRemove`) and asks it for a victim.\n\nBecause the policy only ever sees **keys**, it needs no generic value type and cannot corrupt data. FIFO is one overridden method on the LRU policy, and LFU swaps the list for counters.\n\n**Alternative:** hard-code the list into the cache. It is a bit shorter, and the first request for another policy becomes a rewrite.',
        tradeoffs: ['Two key-indexed structures (the cache map and the policy bookkeeping) that must stay in sync, protected by the cache lock.', 'The interface is the smallest that still supports LFU; resist adding callbacks nobody needs.'] },
      { title: 'HashMap plus doubly linked list with sentinel nodes', pattern: 'Hash map + list',
        body: 'The map finds a key\'s node in O(1). The list orders nodes by recency, so "move to front" and "drop the back" are O(1) too. A **singly** linked list fails because unlinking a node from the middle needs its predecessor. Two **sentinel** nodes (a fixed head and tail) mean a node always has a predecessor and a successor, so insert and unlink have no branches for empty list, first node or last node.\n\n**Alternative:** `OrderedDict` or `LinkedHashMap`. In an interview, say you would use it in production and then build the mechanism, because the mechanism is what is being tested.',
        tradeoffs: ['Two dummy nodes of memory remove every null check.', 'The map stores node references, so the map and the list can never disagree on a key as long as one class owns both.'] },
      { title: 'A coarse lock first, because get() writes', pattern: 'Monitor',
        body: 'Even a read moves a node to the front of the list, so a **read-write lock buys nothing** for strict LRU: every `get` needs the write side. The simple correct design is one mutex around every public method.\n\nThe options in order of effort: (1) **coarse lock**, correct and fine for tens of threads; (2) **striped locks**, with N independent caches and the key hash choosing a stripe (the cache holds about capacity/N entries per stripe, so eviction is approximately LRU globally); (3) **relaxed recency**, as in Caffeine: record reads in a lock-free buffer and apply them in batches, so a hit takes no lock at all.\n\n**Alternative:** `ConcurrentHashMap` plus a locked list. It looks faster and creates a window where the map and the list disagree.',
        tradeoffs: ['Coarse lock: simple and exact, contended under heavy parallel reads.', 'Striping: scales with cores, but a hot stripe evicts earlier than a global LRU would.', 'Never call user code (a value loader or eviction listener) while holding the lock.'] },
      { title: 'Update counts as a use; evict before you insert', pattern: 'Invariant',
        body: 'Two small rules cause most interview bugs. First, **updating** an existing key must replace the value **and** move it to the front, not insert a second node. Second, when the cache is full and the key is new, **evict first, then insert**, so the size never exceeds capacity, not even briefly.\n\nCapacity 1 is the smallest case that exercises both: put A, put B evicts A, and putting B again evicts nothing.\n\n**Alternative:** insert then trim. It works single-threaded and leaves a moment where size is capacity + 1.',
        tradeoffs: ['The put path has three branches (update, insert, insert with eviction); each needs a test.', 'Returning the evicted key makes those tests one-liners.'] },
      { title: 'Misses are values, not exceptions; capacity is validated', pattern: 'Explicit absence',
        body: 'A miss is the normal case for a cache, so `get` returns an explicit "missing" (`Optional`, `std::optional`, a default argument, `undefined`) rather than throwing. That also lets callers cache a null-like value without ambiguity. A capacity below 1 is a programming error and fails fast in the constructor.\n\n**Alternative:** return null on a miss. It is shorter and ambiguous the first time someone caches a null.',
        tradeoffs: ['Callers write one more line to unwrap the result.', 'Throwing for a bad capacity at construction beats a silent cache that never stores anything.'] }
    ],

    code: [
      { title: 'LRU cache component: four languages, one driver each',
        note: 'Each file is complete and runs on its own. The driver covers least-recently-used order, an update refreshing recency, capacity 1, remove, a bad capacity, and swaps in FIFO and LFU (including an LFU tie). Python, Java and C++ also hammer one cache from eight threads and assert the size and the policy bookkeeping stay consistent. JS has no shared-memory threads, so its driver runs one long single-thread sequence instead.',
        code: { py: String.raw`import threading
from abc import ABC, abstractmethod
from typing import Dict, Generic, Hashable, Optional, TypeVar

K = TypeVar("K", bound=Hashable)
V = TypeVar("V")


class Node(Generic[K]):
    __slots__ = ("key", "prev", "next")

    def __init__(self, key=None):
        self.key, self.prev, self.next = key, None, None


class DList(Generic[K]):                    # doubly linked list; head and tail are sentinels, so no None checks
    def __init__(self):
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def push_front(self, n):
        n.prev, n.next = self.head, self.head.next
        self.head.next.prev = n
        self.head.next = n

    def unlink(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def pop_back(self):                     # least recent node, or None when empty
        n = self.tail.prev
        if n is self.head:
            return None
        self.unlink(n)
        return n


class EvictionPolicy(ABC, Generic[K]):      # Strategy: tracks keys only, the cache owns the values
    @abstractmethod
    def on_insert(self, key): ...

    @abstractmethod
    def on_access(self, key): ...

    @abstractmethod
    def on_remove(self, key): ...

    @abstractmethod
    def evict(self): ...                    # forget and return the key to drop


class LruPolicy(EvictionPolicy[K]):
    def __init__(self):
        self.nodes: Dict[K, Node] = {}
        self.order = DList()                # front = most recently used

    def on_insert(self, key):
        n = self.nodes[key] = Node(key)
        self.order.push_front(n)

    def on_access(self, key):
        n = self.nodes[key]
        self.order.unlink(n)
        self.order.push_front(n)

    def on_remove(self, key):
        self.order.unlink(self.nodes.pop(key))

    def evict(self):
        n = self.order.pop_back()
        del self.nodes[n.key]
        return n.key


class FifoPolicy(LruPolicy):                # same list, but reads do not reorder
    def on_access(self, key):
        pass


class LfuPolicy(EvictionPolicy[K]):         # least frequently used, ties go to the least recently used
    def __init__(self):
        self.stats: Dict[K, list] = {}      # key -> [use count, last-use tick]
        self.clock = 0

    def _tick(self):
        self.clock += 1
        return self.clock

    def on_insert(self, key):
        self.stats[key] = [1, self._tick()]

    def on_access(self, key):
        s = self.stats[key]
        s[0] += 1
        s[1] = self._tick()

    def on_remove(self, key):
        del self.stats[key]

    def evict(self):                        # ponytail: O(n) scan; frequency buckets of lists make it O(1)
        key = min(self.stats, key=self.stats.get)
        del self.stats[key]
        return key


class Cache(ABC, Generic[K, V]):
    @abstractmethod
    def get(self, key, default=None): ...

    @abstractmethod
    def put(self, key, value): ...          # returns the evicted key, or None

    @abstractmethod
    def remove(self, key): ...

    @abstractmethod
    def __len__(self): ...


class PolicyCache(Cache[K, V]):
    def __init__(self, capacity, policy):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self.capacity, self.policy, self.data = capacity, policy, {}
        self.lock = threading.Lock()        # ponytail: one lock, because get() reorders; stripe by key hash if it contends

    def get(self, key, default=None):
        with self.lock:
            if key not in self.data:
                return default
            self.policy.on_access(key)
            return self.data[key]

    def put(self, key, value):
        with self.lock:
            if key in self.data:            # an update counts as a use
                self.data[key] = value
                self.policy.on_access(key)
                return None
            victim = None
            if len(self.data) >= self.capacity:
                victim = self.policy.evict()
                del self.data[victim]
            self.data[key] = value
            self.policy.on_insert(key)
            return victim

    def remove(self, key):
        with self.lock:
            if key not in self.data:
                return False
            del self.data[key]
            self.policy.on_remove(key)
            return True

    def __len__(self):
        with self.lock:
            return len(self.data)


def demo():
    c = PolicyCache(2, LruPolicy())
    assert c.put("a", 1) is None and c.put("b", 2) is None
    assert c.get("a") == 1                  # a is now fresher than b
    assert c.put("c", 3) == "b"             # so b is evicted
    assert c.get("b") is None and c.get("a") == 1 and c.get("c") == 3
    c = PolicyCache(2, LruPolicy())         # an update refreshes recency and replaces the value
    c.put("a", 1)
    c.put("b", 2)
    assert c.put("a", 10) is None and len(c) == 2
    assert c.put("c", 3) == "b" and c.get("a") == 10
    c = PolicyCache(1, LruPolicy())         # capacity one
    c.put("a", 1)
    assert c.put("b", 2) == "a" and c.get("a") is None and c.get("b") == 2
    assert c.put("b", 3) is None and len(c) == 1 and c.get("b") == 3
    c = PolicyCache(2, LruPolicy())         # remove frees a slot without evicting
    c.put("a", 1)
    c.put("b", 2)
    assert c.remove("a") and not c.remove("a") and len(c) == 1
    assert c.put("c", 3) is None and c.get("b") == 2 and c.get("c") == 3
    assert c.get("zzz", "dflt") == "dflt"
    try:
        PolicyCache(0, LruPolicy())
        assert False
    except ValueError:
        pass
    f = PolicyCache(2, FifoPolicy())        # FIFO ignores the read of a
    f.put("a", 1)
    f.put("b", 2)
    f.get("a")
    assert f.put("c", 3) == "a"
    lf = PolicyCache(2, LfuPolicy())        # LFU keeps the popular key
    lf.put("a", 1)
    lf.put("b", 2)
    lf.get("a")
    lf.get("a")
    assert lf.put("c", 3) == "b"
    assert lf.put("d", 4) == "c"            # c has one use, a has three
    tie = PolicyCache(2, LfuPolicy())       # equal counts: the older use loses
    tie.put("a", 1)
    tie.put("b", 2)
    assert tie.put("c", 3) == "a"
    big = PolicyCache(16, LruPolicy())      # eight threads, shared cache
    def work(t):
        for i in range(3000):
            k = (i * 7 + t) % 40
            big.put(k, k * 10)
            v = big.get((i * 3 + t) % 40)
            assert v is None or v % 10 == 0
    ts = [threading.Thread(target=work, args=(t,)) for t in range(8)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    assert len(big) == 16 and len(big.policy.nodes) == 16
    print("lru ok")


if __name__ == "__main__":
    demo()`, js: String.raw`const assert = require('assert');

class Node {
  constructor(key) { this.key = key; this.prev = null; this.next = null; }
}

class DList {                                  // doubly linked list; head and tail are sentinels, so no null checks
  constructor() {
    this.head = new Node(); this.tail = new Node();
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  pushFront(n) {
    n.prev = this.head; n.next = this.head.next;
    this.head.next.prev = n;
    this.head.next = n;
  }
  unlink(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  popBack() {                                  // least recent node, or null when empty
    const n = this.tail.prev;
    if (n === this.head) return null;
    this.unlink(n);
    return n;
  }
}

class LruPolicy {                              // Strategy: tracks keys only, the cache owns the values
  constructor() { this.nodes = new Map(); this.order = new DList(); }   // front = most recently used
  onInsert(key) {
    const n = new Node(key);
    this.nodes.set(key, n);
    this.order.pushFront(n);
  }
  onAccess(key) {
    const n = this.nodes.get(key);
    this.order.unlink(n);
    this.order.pushFront(n);
  }
  onRemove(key) { this.order.unlink(this.nodes.get(key)); this.nodes.delete(key); }
  evict() {                                    // forget and return the key to drop
    const n = this.order.popBack();
    this.nodes.delete(n.key);
    return n.key;
  }
}

class FifoPolicy extends LruPolicy {           // same list, but reads do not reorder
  onAccess() {}
}

class LfuPolicy {                              // least frequently used, ties go to the least recently used
  constructor() { this.stats = new Map(); this.clock = 0; }   // key -> { count, tick }
  onInsert(key) { this.stats.set(key, { count: 1, tick: ++this.clock }); }
  onAccess(key) { const s = this.stats.get(key); s.count++; s.tick = ++this.clock; }
  onRemove(key) { this.stats.delete(key); }
  evict() {                                    // ponytail: O(n) scan; frequency buckets of lists make it O(1)
    let best = null, bs = null;
    for (const [key, s] of this.stats) {
      if (!bs || s.count < bs.count || (s.count === bs.count && s.tick < bs.tick)) { best = key; bs = s; }
    }
    this.stats.delete(best);
    return best;
  }
}

class PolicyCache {                            // JS runs one task at a time, so no lock; workers would need one
  constructor(capacity, policy) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be at least 1');
    this.capacity = capacity; this.policy = policy; this.data = new Map();
  }
  get(key, dflt) {
    if (!this.data.has(key)) return dflt;
    this.policy.onAccess(key);
    return this.data.get(key);
  }
  put(key, value) {                            // returns the evicted key, or undefined
    if (this.data.has(key)) {                  // an update counts as a use
      this.data.set(key, value);
      this.policy.onAccess(key);
      return undefined;
    }
    let victim;
    if (this.data.size >= this.capacity) {
      victim = this.policy.evict();
      this.data.delete(victim);
    }
    this.data.set(key, value);
    this.policy.onInsert(key);
    return victim;
  }
  remove(key) {
    if (!this.data.delete(key)) return false;
    this.policy.onRemove(key);
    return true;
  }
  get size() { return this.data.size; }
}

function demo() {
  let c = new PolicyCache(2, new LruPolicy());
  assert.strictEqual(c.put('a', 1), undefined);
  assert.strictEqual(c.put('b', 2), undefined);
  assert.strictEqual(c.get('a'), 1);           // a is now fresher than b
  assert.strictEqual(c.put('c', 3), 'b');      // so b is evicted
  assert.strictEqual(c.get('b'), undefined);
  assert(c.get('a') === 1 && c.get('c') === 3);
  c = new PolicyCache(2, new LruPolicy());     // an update refreshes recency and replaces the value
  c.put('a', 1); c.put('b', 2);
  assert.strictEqual(c.put('a', 10), undefined);
  assert.strictEqual(c.size, 2);
  assert.strictEqual(c.put('c', 3), 'b');
  assert.strictEqual(c.get('a'), 10);
  c = new PolicyCache(1, new LruPolicy());     // capacity one
  c.put('a', 1);
  assert.strictEqual(c.put('b', 2), 'a');
  assert(c.get('a') === undefined && c.get('b') === 2);
  assert.strictEqual(c.put('b', 3), undefined);
  assert(c.size === 1 && c.get('b') === 3);
  c = new PolicyCache(2, new LruPolicy());     // remove frees a slot without evicting
  c.put('a', 1); c.put('b', 2);
  assert(c.remove('a') && !c.remove('a') && c.size === 1);
  assert.strictEqual(c.put('c', 3), undefined);
  assert(c.get('b') === 2 && c.get('c') === 3);
  assert.strictEqual(c.get('zzz', 'dflt'), 'dflt');
  assert.throws(() => new PolicyCache(0, new LruPolicy()), RangeError);
  const f = new PolicyCache(2, new FifoPolicy());   // FIFO ignores the read of a
  f.put('a', 1); f.put('b', 2); f.get('a');
  assert.strictEqual(f.put('c', 3), 'a');
  const lf = new PolicyCache(2, new LfuPolicy());   // LFU keeps the popular key
  lf.put('a', 1); lf.put('b', 2); lf.get('a'); lf.get('a');
  assert.strictEqual(lf.put('c', 3), 'b');
  assert.strictEqual(lf.put('d', 4), 'c');     // c has one use, a has three
  const tie = new PolicyCache(2, new LfuPolicy());  // equal counts: the older use loses
  tie.put('a', 1); tie.put('b', 2);
  assert.strictEqual(tie.put('c', 3), 'a');
  const big = new PolicyCache(16, new LruPolicy()); // many keys through a small cache
  for (let i = 0; i < 20000; i++) {
    const k = (i * 7) % 40;
    big.put(k, k * 10);
    const v = big.get((i * 3) % 40);
    assert(v === undefined || v % 10 === 0);
  }
  assert(big.size === 16 && big.policy.nodes.size === 16);
  console.log('lru ok');
}

demo();`, java: String.raw`import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

public class LruDesign {
    static class Node<K> {
        final K key; Node<K> prev, next;
        Node(K key) { this.key = key; }
    }

    static class DList<K> {                                  // doubly linked list; head and tail are sentinels, so no null checks
        final Node<K> head = new Node<>(null), tail = new Node<>(null);
        DList() { head.next = tail; tail.prev = head; }
        void pushFront(Node<K> n) {
            n.prev = head; n.next = head.next;
            head.next.prev = n;
            head.next = n;
        }
        void unlink(Node<K> n) { n.prev.next = n.next; n.next.prev = n.prev; }
        Node<K> popBack() {                                  // least recent node, or null when empty
            Node<K> n = tail.prev;
            if (n == head) return null;
            unlink(n);
            return n;
        }
    }

    interface EvictionPolicy<K> {                            // Strategy: tracks keys only, the cache owns the values
        void onInsert(K key);
        void onAccess(K key);
        void onRemove(K key);
        K evict();                                           // forget and return the key to drop
    }

    static class LruPolicy<K> implements EvictionPolicy<K> {
        final Map<K, Node<K>> nodes = new HashMap<>();
        final DList<K> order = new DList<>();                // front = most recently used
        public void onInsert(K key) { Node<K> n = new Node<>(key); nodes.put(key, n); order.pushFront(n); }
        public void onAccess(K key) { Node<K> n = nodes.get(key); order.unlink(n); order.pushFront(n); }
        public void onRemove(K key) { order.unlink(nodes.remove(key)); }
        public K evict() { Node<K> n = order.popBack(); nodes.remove(n.key); return n.key; }
    }

    static class FifoPolicy<K> extends LruPolicy<K> {        // same list, but reads do not reorder
        @Override public void onAccess(K key) {}
    }

    static class LfuPolicy<K> implements EvictionPolicy<K> { // least frequently used, ties go to the least recently used
        final Map<K, long[]> stats = new HashMap<>();        // key -> {use count, last-use tick}
        long clock = 0;
        public void onInsert(K key) { stats.put(key, new long[]{1, ++clock}); }
        public void onAccess(K key) { long[] s = stats.get(key); s[0]++; s[1] = ++clock; }
        public void onRemove(K key) { stats.remove(key); }
        public K evict() {                                   // ponytail: O(n) scan; frequency buckets of lists make it O(1)
            K best = null; long[] bs = null;
            for (Map.Entry<K, long[]> e : stats.entrySet()) {
                long[] s = e.getValue();
                if (bs == null || s[0] < bs[0] || (s[0] == bs[0] && s[1] < bs[1])) { best = e.getKey(); bs = s; }
            }
            stats.remove(best);
            return best;
        }
    }

    interface Cache<K, V> {
        Optional<V> get(K key);
        Optional<K> put(K key, V value);                     // returns the evicted key, if any
        boolean remove(K key);
        int size();
    }

    static class PolicyCache<K, V> implements Cache<K, V> {
        private final int capacity;
        private final EvictionPolicy<K> policy;
        private final Map<K, V> data = new HashMap<>();
        private final ReentrantLock lock = new ReentrantLock();   // ponytail: one lock, because get() reorders; stripe by key hash if it contends

        PolicyCache(int capacity, EvictionPolicy<K> policy) {
            if (capacity < 1) throw new IllegalArgumentException("capacity must be at least 1");
            this.capacity = capacity; this.policy = policy;
        }
        public Optional<V> get(K key) {
            lock.lock();
            try {
                if (!data.containsKey(key)) return Optional.empty();
                policy.onAccess(key);
                return Optional.of(data.get(key));
            } finally { lock.unlock(); }
        }
        public Optional<K> put(K key, V value) {
            lock.lock();
            try {
                if (data.containsKey(key)) {                 // an update counts as a use
                    data.put(key, value);
                    policy.onAccess(key);
                    return Optional.empty();
                }
                K victim = null;
                if (data.size() >= capacity) { victim = policy.evict(); data.remove(victim); }
                data.put(key, value);
                policy.onInsert(key);
                return Optional.ofNullable(victim);
            } finally { lock.unlock(); }
        }
        public boolean remove(K key) {
            lock.lock();
            try {
                if (!data.containsKey(key)) return false;
                data.remove(key);
                policy.onRemove(key);
                return true;
            } finally { lock.unlock(); }
        }
        public int size() { lock.lock(); try { return data.size(); } finally { lock.unlock(); } }
    }

    static void check(boolean c, String what) {
        if (!c) { System.err.println("FAILED: " + what); System.exit(1); }
    }

    public static void main(String[] args) throws Exception {
        Cache<String, Integer> c = new PolicyCache<>(2, new LruPolicy<>());
        check(c.put("a", 1).isEmpty() && c.put("b", 2).isEmpty(), "fill");
        check(c.get("a").get() == 1, "hit a");                // a is now fresher than b
        check(c.put("c", 3).get().equals("b"), "evict b");    // so b is evicted
        check(c.get("b").isEmpty() && c.get("a").get() == 1 && c.get("c").get() == 3, "after evict");
        c = new PolicyCache<>(2, new LruPolicy<>());          // an update refreshes recency and replaces the value
        c.put("a", 1); c.put("b", 2);
        check(c.put("a", 10).isEmpty() && c.size() == 2, "update");
        check(c.put("c", 3).get().equals("b") && c.get("a").get() == 10, "update refreshed a");
        c = new PolicyCache<>(1, new LruPolicy<>());          // capacity one
        c.put("a", 1);
        check(c.put("b", 2).get().equals("a") && c.get("a").isEmpty() && c.get("b").get() == 2, "cap 1");
        check(c.put("b", 3).isEmpty() && c.size() == 1 && c.get("b").get() == 3, "cap 1 update");
        c = new PolicyCache<>(2, new LruPolicy<>());          // remove frees a slot without evicting
        c.put("a", 1); c.put("b", 2);
        check(c.remove("a") && !c.remove("a") && c.size() == 1, "remove");
        check(c.put("c", 3).isEmpty() && c.get("b").get() == 2 && c.get("c").get() == 3, "slot reused");
        try { new PolicyCache<String, Integer>(0, new LruPolicy<>()); check(false, "capacity 0"); }
        catch (IllegalArgumentException e) { /* expected */ }
        Cache<String, Integer> f = new PolicyCache<>(2, new FifoPolicy<>());   // FIFO ignores the read of a
        f.put("a", 1); f.put("b", 2); f.get("a");
        check(f.put("c", 3).get().equals("a"), "fifo");
        Cache<String, Integer> lf = new PolicyCache<>(2, new LfuPolicy<>());   // LFU keeps the popular key
        lf.put("a", 1); lf.put("b", 2); lf.get("a"); lf.get("a");
        check(lf.put("c", 3).get().equals("b"), "lfu b");
        check(lf.put("d", 4).get().equals("c"), "lfu c");     // c has one use, a has three
        Cache<String, Integer> tie = new PolicyCache<>(2, new LfuPolicy<>());  // equal counts: the older use loses
        tie.put("a", 1); tie.put("b", 2);
        check(tie.put("c", 3).get().equals("a"), "lfu tie");
        Cache<Integer, Integer> big = new PolicyCache<>(16, new LruPolicy<>()); // eight threads, shared cache
        Thread[] ts = new Thread[8];
        for (int t = 0; t < ts.length; t++) {
            final int id = t;
            ts[t] = new Thread(() -> {
                for (int i = 0; i < 3000; i++) {
                    int k = (i * 7 + id) % 40;
                    big.put(k, k * 10);
                    Optional<Integer> v = big.get((i * 3 + id) % 40);
                    if (v.isPresent() && v.get() % 10 != 0) { System.err.println("FAILED: torn value"); System.exit(1); }
                }
            });
            ts[t].start();
        }
        for (Thread t : ts) t.join();
        check(big.size() == 16, "size bounded");
        System.out.println("lru ok");
    }
}`, cpp: String.raw`#include <cstdlib>
#include <iostream>
#include <memory>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <thread>
#include <unordered_map>
#include <vector>

template <class K> struct Node {
    K key{};                                 // sentinels use a default-constructed key
    Node* prev = nullptr;
    Node* next = nullptr;
};

template <class K> class DList {             // doubly linked list; head and tail are sentinels, so no null checks
public:
    DList() { head.next = &tail; tail.prev = &head; }
    DList(const DList&) = delete;
    DList& operator=(const DList&) = delete;
    void pushFront(Node<K>* n) {
        n->prev = &head; n->next = head.next;
        head.next->prev = n;
        head.next = n;
    }
    void unlink(Node<K>* n) { n->prev->next = n->next; n->next->prev = n->prev; }
    Node<K>* popBack() {                     // least recent node, or nullptr when empty
        Node<K>* n = tail.prev;
        if (n == &head) return nullptr;
        unlink(n);
        return n;
    }
private:
    Node<K> head, tail;
};

template <class K> struct EvictionPolicy {   // Strategy: tracks keys only, the cache owns the values
    virtual ~EvictionPolicy() = default;
    virtual void onInsert(const K& key) = 0;
    virtual void onAccess(const K& key) = 0;
    virtual void onRemove(const K& key) = 0;
    virtual K evict() = 0;                   // forget and return the key to drop
};

template <class K> class LruPolicy : public EvictionPolicy<K> {
public:
    void onInsert(const K& key) override {
        auto n = std::make_unique<Node<K>>();
        n->key = key;
        order.pushFront(n.get());
        nodes[key] = std::move(n);           // the map owns the nodes, the list only links them
    }
    void onAccess(const K& key) override {
        Node<K>* n = nodes.at(key).get();
        order.unlink(n);
        order.pushFront(n);
    }
    void onRemove(const K& key) override { order.unlink(nodes.at(key).get()); nodes.erase(key); }
    K evict() override {
        Node<K>* n = order.popBack();
        K key = n->key;
        nodes.erase(key);
        return key;
    }
    size_t tracked() const { return nodes.size(); }
private:
    std::unordered_map<K, std::unique_ptr<Node<K>>> nodes;
    DList<K> order;                          // front = most recently used
};

template <class K> struct FifoPolicy : LruPolicy<K> {   // same list, but reads do not reorder
    void onAccess(const K&) override {}
};

template <class K> class LfuPolicy : public EvictionPolicy<K> {   // least frequently used, ties go to the least recently used
public:
    void onInsert(const K& key) override { stats[key] = {1, ++clock}; }
    void onAccess(const K& key) override { auto& s = stats.at(key); s.count++; s.tick = ++clock; }
    void onRemove(const K& key) override { stats.erase(key); }
    K evict() override {                     // ponytail: O(n) scan; frequency buckets of lists make it O(1)
        auto best = stats.begin();
        for (auto it = stats.begin(); it != stats.end(); ++it)
            if (it->second.count < best->second.count ||
                (it->second.count == best->second.count && it->second.tick < best->second.tick)) best = it;
        K key = best->first;
        stats.erase(best);
        return key;
    }
private:
    struct Stat { long count, tick; };
    std::unordered_map<K, Stat> stats;
    long clock = 0;
};

template <class K, class V> struct Cache {
    virtual ~Cache() = default;
    virtual std::optional<V> get(const K& key) = 0;
    virtual std::optional<K> put(const K& key, V value) = 0;   // returns the evicted key, if any
    virtual bool remove(const K& key) = 0;
    virtual size_t size() = 0;
};

template <class K, class V> class PolicyCache : public Cache<K, V> {
public:
    PolicyCache(size_t capacity, std::unique_ptr<EvictionPolicy<K>> policy)
        : capacity(capacity), policy(std::move(policy)) {
        if (capacity < 1) throw std::invalid_argument("capacity must be at least 1");
    }
    std::optional<V> get(const K& key) override {
        std::lock_guard<std::mutex> g(mu);   // ponytail: one lock, because get() reorders; stripe by key hash if it contends
        auto it = data.find(key);
        if (it == data.end()) return std::nullopt;
        policy->onAccess(key);
        return it->second;
    }
    std::optional<K> put(const K& key, V value) override {
        std::lock_guard<std::mutex> g(mu);
        auto it = data.find(key);
        if (it != data.end()) {              // an update counts as a use
            it->second = std::move(value);
            policy->onAccess(key);
            return std::nullopt;
        }
        std::optional<K> victim;
        if (data.size() >= capacity) {
            victim = policy->evict();
            data.erase(*victim);
        }
        data.emplace(key, std::move(value));
        policy->onInsert(key);
        return victim;
    }
    bool remove(const K& key) override {
        std::lock_guard<std::mutex> g(mu);
        if (data.erase(key) == 0) return false;
        policy->onRemove(key);
        return true;
    }
    size_t size() override { std::lock_guard<std::mutex> g(mu); return data.size(); }
private:
    size_t capacity;
    std::unique_ptr<EvictionPolicy<K>> policy;
    std::unordered_map<K, V> data;
    std::mutex mu;
};

#define CHECK(c) do { if (!(c)) { std::cerr << "FAILED: " #c "\n"; std::exit(1); } } while (0)
using S = std::string;
template <class P> std::unique_ptr<EvictionPolicy<S>> pol() { return std::make_unique<P>(); }
using Str = PolicyCache<S, int>;

int main() {
    Str c(2, pol<LruPolicy<S>>());
    CHECK(!c.put("a", 1) && !c.put("b", 2));
    CHECK(c.get("a") == 1);                  // a is now fresher than b
    CHECK(c.put("c", 3) == S("b"));          // so b is evicted
    CHECK(!c.get("b") && c.get("a") == 1 && c.get("c") == 3);
    Str u(2, pol<LruPolicy<S>>());           // an update refreshes recency and replaces the value
    u.put("a", 1); u.put("b", 2);
    CHECK(!u.put("a", 10) && u.size() == 2);
    CHECK(u.put("c", 3) == S("b") && u.get("a") == 10);
    Str one(1, pol<LruPolicy<S>>());         // capacity one
    one.put("a", 1);
    CHECK(one.put("b", 2) == S("a") && !one.get("a") && one.get("b") == 2);
    CHECK(!one.put("b", 3) && one.size() == 1 && one.get("b") == 3);
    Str r(2, pol<LruPolicy<S>>());           // remove frees a slot without evicting
    r.put("a", 1); r.put("b", 2);
    CHECK(r.remove("a") && !r.remove("a") && r.size() == 1);
    CHECK(!r.put("c", 3) && r.get("b") == 2 && r.get("c") == 3);
    bool threw = false;
    try { Str bad(0, pol<LruPolicy<S>>()); } catch (const std::invalid_argument&) { threw = true; }
    CHECK(threw);
    Str f(2, pol<FifoPolicy<S>>());          // FIFO ignores the read of a
    f.put("a", 1); f.put("b", 2); f.get("a");
    CHECK(f.put("c", 3) == S("a"));
    Str lf(2, pol<LfuPolicy<S>>());          // LFU keeps the popular key
    lf.put("a", 1); lf.put("b", 2); lf.get("a"); lf.get("a");
    CHECK(lf.put("c", 3) == S("b"));
    CHECK(lf.put("d", 4) == S("c"));         // c has one use, a has three
    Str tie(2, pol<LfuPolicy<S>>());         // equal counts: the older use loses
    tie.put("a", 1); tie.put("b", 2);
    CHECK(tie.put("c", 3) == S("a"));
    auto lru = std::make_unique<LruPolicy<int>>();   // eight threads, shared cache
    LruPolicy<int>* peek = lru.get();
    PolicyCache<int, int> big(16, std::move(lru));
    std::vector<std::thread> ts;
    for (int t = 0; t < 8; t++)
        ts.emplace_back([&big, t] {
            for (int i = 0; i < 3000; i++) {
                int k = (i * 7 + t) % 40;
                big.put(k, k * 10);
                auto v = big.get((i * 3 + t) % 40);
                if (v && *v % 10 != 0) { std::cerr << "FAILED: torn value\n"; std::exit(1); }
            }
        });
    for (auto& t : ts) t.join();
    CHECK(big.size() == 16 && peek->tracked() == 16);
    std::cout << "lru ok\n";
}` } }
    ],

    extensions: [
      { q: 'Add a **TTL** so entries expire. What changes?', a: 'Store an expiry time with each value (the cache map holds a small record: value and `expiresAt`). On `get`, if `now >= expiresAt`, treat it as a miss, remove it from the map **and** tell the policy (`onRemove`). That is **lazy expiry**, with no background thread, and it covers correctness.\n\nExpired entries nobody reads still take space until evicted, so add an optional sweeper (a timer that removes a small batch, or a min-heap by expiry). Inject a clock so tests are deterministic. TTL belongs in the cache, not the policy: the policy decides what to evict when **full**, the TTL decides what is **stale**.' },
      { q: 'How would you make it **thread-safe and fast** under heavy read traffic?', a: 'Start with one mutex and say why not a read-write lock: `get` mutates the order, so every read is a write. If profiling shows contention, **stripe**: N shards, each a full cache with its own lock and capacity/N, chosen by `hash(key) % N`. Contention drops by about N, at the cost of eviction being only approximately global LRU.\n\nBeyond that, buffer the recency updates (a ring buffer of "key was read" events that one thread drains under the lock), so a hit does a map lookup and a buffer write. That is how high-throughput JVM caches work.' },
      { q: 'Swap in **LFU**. What breaks, and how would you make it O(1)?', a: 'Nothing in the cache changes, which is the point of the Strategy. The policy changes: counts per key, victim is the lowest count with ties broken by recency. The scan version here is O(n) at eviction.\n\nFor O(1), keep a map from count to a doubly linked list of keys with that count, a map from key to its count and list node, and a `minCount` variable. An access moves the node from list `c` to list `c+1` and bumps `minCount` if list `c` emptied. Eviction pops the oldest node of list `minCount`. That is LeetCode 460. Note LFU also needs an aging story, or yesterday\'s hot key never leaves.' },
      { q: 'Add **hit and miss metrics**, or an **eviction listener**, without touching the core.', a: 'Wrap, do not edit. A `MeteredCache` decorator implements `Cache`, delegates every call, and counts hits and misses (get returned present or missing) and evictions (put returned a key). The decorator works because `put` returns the evicted key.\n\nFor listeners that must run on eviction (closing a file, writing back a dirty value), call them **after** releasing the lock, or hand them to an executor, so slow callbacks never block other threads and cannot re-enter the cache while it is inconsistent.' },
      { q: 'How would you **test** a cache thoroughly?', a: 'Deterministic cases first, each asserted through the evicted key that `put` returns: recency after a get, update refreshing, capacity 1, remove then insert, and a bad capacity. Then one test per policy that shows the order differs for the same operations (FIFO ignores reads, LFU keeps the popular key).\n\nFor concurrency: run several threads against a small cache with a key range larger than capacity, then assert size is at most capacity and that every value read is one that was written (no torn values). A randomized test comparing against a slow reference model (a plain list that moves items on every access) catches pointer bugs in the linked list.' }
    ],

    quiz: [
      { kind: 'pattern', q: 'The product team wants to try FIFO and LFU eviction without changing the cache class. Which pattern is that?', choices: ['Strategy', 'Singleton', 'Builder', 'Adapter'], answer: 0, explain: 'The eviction algorithm is a swappable object behind an interface. The cache calls it and does not know which one it holds.' },
      { kind: 'complexity', q: 'What are the time complexities of get and put in a hash map plus doubly linked list LRU?', choices: ['O(1) average for both', 'O(log n) for both', 'O(n) for get, O(1) for put', 'O(1) for get, O(n) for put'], answer: 0, explain: 'The map finds the node in O(1), and unlinking or relinking a node is a few pointer writes. Eviction removes the tail node and its map key, also O(1).' },
      { kind: 'concept', q: 'Why is a read-write lock a poor fit for a strict LRU cache?', choices: ['A get moves the entry to the front, so every read mutates shared state', 'Read-write locks do not work with hash maps', 'put is more common than get', 'It makes the list singly linked'], answer: 0, explain: 'A read-write lock only helps when reads do not write. Strict LRU updates recency on every get, so reads need exclusive access too.' },
      { kind: 'bug', q: 'A cache has capacity 2 with keys A then B. put(A, newValue) then put(C, v) evicts A instead of B. What is the most likely bug?', choices: ['Updating an existing key did not move it to the front', 'The capacity check uses less than instead of greater or equal', 'The list is not doubly linked', 'The hash function is weak'], answer: 0, explain: 'An update is a use. If it replaces the value without refreshing recency, A stays the oldest and gets evicted.' },
      { kind: 'concept', q: 'What do sentinel head and tail nodes in the list buy you?', choices: ['Insert and unlink need no special cases for an empty list or the first and last node', 'They make the list thread-safe', 'They store the cached values', 'They allow O(1) search by value'], answer: 0, explain: 'With sentinels every real node has a previous and next node, so the pointer updates are the same in all cases.' },
      { kind: 'concept', q: 'Which two options reduce lock contention in a shared cache while keeping eviction reasonable?', choices: ['Striped locks: shard by key hash into independent caches', 'Buffering read events and applying recency updates in batches', 'Removing the lock and hoping', 'Making capacity unlimited'], answer: [0, 1], explain: 'Striping divides the contention across shards, and batching takes the lock off the read path. Both trade exactness of global LRU for speed. No lock means corrupted pointers.' }
    ],

    flashcards: [
      { id: 'lc-parts', front: 'LRU cache design: what are the two structures and why?', back: 'A hash map from key to list node (O(1) find) and a doubly linked list in recency order (O(1) move to front, drop from back). Neither alone gives O(1) for both lookup and eviction.' },
      { id: 'lc-sentinel', front: 'Why sentinel nodes in the linked list?', back: 'A fixed dummy head and tail give every real node a neighbor on both sides, so insert and unlink never check for empty list, first node or last node.' },
      { id: 'lc-strategy', front: 'How do you make eviction pluggable?', back: 'An EvictionPolicy interface with onInsert, onAccess, onRemove and evict. The cache owns the values and decides when to evict; the policy owns the order over keys and decides which. FIFO ignores onAccess, LFU counts it.' },
      { id: 'lc-rwlock', front: 'Why does a read-write lock not help an LRU cache?', back: 'Every get reorders the list, so reads are writes. Use one mutex, then striped shards, or buffered recency updates if contention shows up.' },
      { id: 'lc-update', front: 'Two classic LRU put bugs?', back: 'Not refreshing recency when updating an existing key, and inserting before evicting so size briefly exceeds capacity. Test with capacity 1.' },
      { id: 'lc-ttl', front: 'How do you add TTL to the cache?', back: 'Store an expiry with each value, treat an expired entry as a miss on get (remove it from the map and notify the policy), optionally sweep in the background, and inject a clock for tests.' },
      { id: 'lc-vs146', front: 'LRU cache design versus LeetCode 146?', back: '146 is the algorithm with int keys and a fixed API. The design version adds generics, a cache interface, a pluggable eviction policy, thread safety options, TTL and tests. Build the O(1) core first, then show those.' }
    ]
  });
})();
