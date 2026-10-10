(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['design-ds'] = {
    primer: {
      kind: 'structure',
      what: `A design problem asks for a small class whose methods are all fast, built by gluing basic structures together. The building blocks: a **hash map** (key to value, no order), a **doubly linked list** (nodes with \`prev\` and \`next\` pointers), an **array** (slots by index) and a **heap** (the biggest or smallest item on top). Think of a cafeteria: the hash map is the card index, the list is the line.`,
      does: `Hash map: lookup, insert, delete in O(1) on average, but no order. Doubly linked list: unlink a node you already hold or insert next to it in O(1), but no searching. Array: read by index and append in O(1), delete in the middle O(n). Heap: peek O(1), push and pop O(log n). Pair two so each covers the other's weak spot.`,
      impl: `An LRU cache keeps a map \`key -> node\` and a list ordered newest first, with dummy head and tail nodes; each node stores its own key. A random set keeps an array of values plus a map \`value -> index\` and deletes by swapping with the last slot. In Python, \`dict\` remembers insertion order, \`OrderedDict\` is a ready-made map plus list (\`move_to_end\`, \`popitem(last=False)\`), and \`deque\` and \`heapq\` cover queues and heaps.`,
      possibilities: `LRU and LFU caches, an insert/delete/getRandom set, a news feed (merge sorted lists with a heap), peeking and flattening iterators, a stack that also answers min or most-frequent, snapshot or time-versioned maps, caches with expiry, and browser history with back and forward.`
    },

    think: [
      {
        q: `You build an LRU cache with only a Python \`dict\` mapping key to value. The dict has no "last used" information. Name the exact operation that becomes slow, and say how slow.`,
        a: `Eviction. To drop the least recently used key you must find which key was used longest ago, and a plain dict can only answer that by scanning every key and comparing time stamps: O(n) per eviction. Lookups stay O(1). So you add a second structure whose only job is order, a doubly linked list with newest at the front: now the oldest is always the node just before the tail, found in O(1).`
      },
      {
        q: `In the LRU list, a node stores both a key and a value. Why must the node keep the key? What breaks if it keeps only the value?`,
        a: `When the cache is full you reach the victim through the list (the node before the tail) and must also delete its entry from the hash map. The map is indexed by key, so you need the victim's key. With only the value stored you would have to search the map for the matching value: O(n). Storing the key in the node lets the list and the map stay in sync with two O(1) steps.`
      },
      {
        q: `A random set holds \`items = [4, 9, 2]\` and \`pos = {4: 0, 9: 1, 2: 2}\`. Trace \`remove(4)\` step by step. What are \`items\` and \`pos\` afterwards, and why is it O(1)?`,
        a: `4 lives at index 0 and the last element is 2. Copy 2 into slot 0: items = [2, 9, 2]. Update the map: pos[2] = 0. Pop the end: items = [2, 9]. Delete pos[4]. Final: items = [2, 9], pos = {9: 1, 2: 0}. Nothing shifted, only one slot was overwritten and one popped. The array stays gap-free, so picking a uniform random index stays uniform.`
      },
      {
        q: `Nodes A, B, C are linked both ways: A <-> B <-> C. Which pointers change to remove B in O(1)? Why can't a singly linked list do the same?`,
        a: `Two assignments: A.next = C and C.prev = A. B is bypassed. In a singly linked list C has no prev, and A (the node whose next must change) cannot be found from B, so you would scan from the head to find A: O(n). The extra pointer per node is what buys O(1) removal of a node you are holding, and that is exactly what a hash map from key to node gives you.`
      },
      {
        q: `You need a queue of ticket ids where \`cancel(id)\` works from anywhere in the queue and every operation is O(1) amortized. Which two structures, and what trick avoids deleting from the middle?`,
        a: `A deque for the order and a set of ids that are still live. cancel just removes the id from the set (O(1)); the dead id stays in the deque as a stale entry. pop looks at the front of the deque and throws away entries whose id is no longer live, then returns the first live one. This is **lazy deletion**: each id is pushed once and discarded at most once, so the total work is O(1) amortized per operation.`
      },
      {
        q: `Predict the output: \`d = OrderedDict(a=1, b=2, c=3); d.move_to_end('a'); print(d.popitem(last=False))\`. What does this say about using it as an LRU?`,
        a: `It prints \`('b', 2)\`. The order after move_to_end is b, c, a (oldest first, newest last), so popitem(last=False) removes the front: b. That is exactly LRU: every use does move_to_end, and eviction pops the front. OrderedDict is the hash map plus the doubly linked list already built for you, so ask your interviewer whether you may use it, and be ready to build the long version.`
      }
    ],

    breakdown: [
      {
        title: `1. Price list first: which operation needs which structure`,
        body: `A design question gives methods and a speed target, usually O(1). Before any code, write each method and what it needs. LRU: \`get(key)\` needs **find by key**; marking something recently used needs **reorder**; eviction needs **who is oldest**, plus **delete from the middle**. A hash map is great at the first, bad at order. A list is good at reordering a node you hold, useless at finding. So no single structure works, and the answer is a pair where every row of the price list is cheap in at least one of them. Name the invariant that ties them ("the map and the list hold the same keys") before you write anything.`
      },
      {
        title: `2. The building blocks and what each buys`,
        body: `**Hash map**: find, add, remove by key in O(1) average; no order. **Array**: item by index and append at the end in O(1); inserting or deleting in the middle shifts everything, O(n). **Singly linked list**: insert after a node you hold in O(1); to remove a node you need its predecessor, so O(n). **Doubly linked list**: each node also knows its previous, so a held node can be unlinked and re-linked anywhere in O(1); it still cannot search. **Heap**: the best item in O(1), push and pop O(log n). **Deque**: add and remove at both ends O(1). Knowing these prices is 80% of design questions.`
      },
      {
        title: `3. Pointer surgery with sentinels`,
        body: `Keep a dummy node at each end so a real node always has a real neighbour on both sides. Empty list: \`head <-> tail\`. Add A at the front, then B:

\`\`\`
head <-> A <-> tail            (after adding A)
head <-> B <-> A <-> tail      (B pushed to the front)
\`\`\`

Unlink B means \`B.prev.next = B.next\` and \`B.next.prev = B.prev\`. Push-front of n means: \`n.prev = head\`, \`n.next = head.next\`, \`head.next.prev = n\`, \`head.next = n\`. The same four lines work whether the list is empty, has one node or many. Without sentinels you write separate cases for first and last nodes.`,
        code: { py: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

head, tail = Node(), Node()
head.next, tail.prev = tail, head

def unlink(n):
    n.prev.next = n.next
    n.next.prev = n.prev

def push_front(n):
    n.prev, n.next = head, head.next
    head.next.prev = n
    head.next = n` }
      },
      {
        title: `4. Trace an LRU cache, capacity 2`,
        body: `List shown newest first. \`put(1,10)\`: list [1]. \`put(2,20)\`: [2,1]. \`get(1)\`: map finds node 1, unlink, push front: [1,2], returns 10. \`put(3,30)\`: add 3 at the front: [3,1,2]; size 3 exceeds 2, so evict the node before the tail (key 2), delete 2 from the map: [3,1]. \`get(2)\`: not in the map, returns -1. \`put(1,99)\`: key exists, so update the value and move to the front: [1,3]. Each call was a lookup plus a few pointer changes. Three checks after every step: map size equals list length, every list node is in the map, and the tail's neighbour is the oldest.`
      },
      {
        title: `5. Array plus map: delete by swapping with the last`,
        body: `Random pick needs an array (\`items[random index]\`); delete-by-value needs a map from value to index. The array's weakness, shifting after a middle delete, goes away if you overwrite the hole with the **last** element and pop the end. State \`items = [7, 3, 8, 5]\`, \`pos = {7:0, 3:1, 8:2, 5:3}\`. \`remove(3)\`: last = 5; items[1] = 5; pos[5] = 1; pop -> items = [7, 5, 8]; delete pos[3]. Edge case: removing the value that is itself last. Overwriting the hole with itself is fine as long as you pop and delete after, in that order. Order does not matter in a set, so nothing is lost.`
      },
      {
        title: `6. Heap for "newest k": merge sorted sources`,
        body: `A social feed shows the newest 10 tweets among the user and everyone they follow. Each person's tweets are already in time order (append-only), so the feed is a merge of k sorted lists, stopping after 10. Do not sort everything. Push the newest tweet of each source into a max-heap keyed by time stamp (a global counter makes stamps comparable). Pop the best, then push **the same person's next older tweet**. Ten pops cost O(10 log k). The rest of the design is plain bookkeeping: user -> list of tweets, user -> set of followees (a set makes follow and unfollow O(1) and ignores repeats).`
      },
      {
        title: `7. Add one dimension: LFU, iterators, and interview habits`,
        body: `LFU (least frequently used) needs two orders: first by use count, ties by recency. Keep \`key -> value\`, \`key -> count\`, \`count -> keys in recency order\` (an OrderedDict per count) and the lowest count in use. A use moves a key from bucket c to c+1; a new key goes to bucket 1 and resets the low count. For iterators, ask what the **minimum state between calls** is: peek needs one buffered value. Interview rhythm: state the methods and edge cases (missing key, capacity 0/1), say the invariant, build the pair, **walk a tiny example** with state after each call, then give complexities and say "average O(1)" for the hash map.`
      }
    ],

    drills: [
      {
        title: `Queue with cancel`,
        q: `Design \`CancelQueue\` with \`add(task_id)\` (appends a new unique id), \`cancel(task_id)\` (returns True if the id was waiting and is now cancelled, else False), and \`pop()\` (removes and returns the oldest still-waiting id, or -1 if none). Ids are never reused. All operations must be O(1) amortized. Example: add 1, 2, 3; \`cancel(2)\` is True; \`pop()\` returns 1; \`pop()\` returns 3; \`pop()\` returns -1.`,
        hint: `Do not delete from the middle of the queue. Mark the id as dead and skip dead ids when they reach the front.`,
        how: `I restate it as a FIFO queue where any waiting item can be removed from the middle. The brute force keeps a list and does \`list.remove(id)\` on cancel, which is O(n) because it searches and then shifts everything behind it. The bottleneck is exactly that middle deletion. The observation that unlocks it: I never have to physically remove a cancelled id at cancel time, only make sure it is never returned later. So I keep a deque for the order and a set of ids that are still alive. add appends to the deque and inserts into the set. cancel just checks the set: if the id is there, I remove it and return True; otherwise False (it was never added, already cancelled, or already popped). pop first discards entries from the front of the deque whose ids are not in the live set (stale entries), then, if the deque is empty returns -1, otherwise pops the front and removes it from the set. Trace: add 1, 2, 3 gives deque [1,2,3], live {1,2,3}. cancel(2) leaves the deque alone and live = {1,3}. pop: front is 1, live, return 1. pop: front is 2, not live, discard; front is 3, return 3. pop: empty, return -1. Edge cases: cancelling the head, cancelling an id that was already popped (live no longer contains it, so False), and many cancels followed by one pop that skips them all. That last case looks like O(n) but is amortized O(1): each id enters the deque once and leaves it once, so skipping costs are paid for by the adds. I rely on ids never being reused; otherwise a stale entry could be mistaken for a fresh one. Space is O(n).`,
        code: { py: `from collections import deque

class CancelQueue:
    def __init__(self):
        self.order = deque()      # every id ever added, oldest first
        self.live = set()         # ids that are still waiting

    def add(self, task_id):
        self.order.append(task_id)
        self.live.add(task_id)

    def cancel(self, task_id):
        if task_id in self.live:
            self.live.remove(task_id)   # lazy: leave the stale entry in the deque
            return True
        return False

    def pop(self):
        while self.order and self.order[0] not in self.live:
            self.order.popleft()        # discard stale entries
        if not self.order:
            return -1
        t = self.order.popleft()
        self.live.remove(t)
        return t` },
        explain: `The live set is the source of truth for "still waiting"; the deque only gives order. Stale ids are skipped before any answer is returned, so pop always returns the oldest live id. Each id is pushed once and removed from the deque at most once, so all operations are O(1) amortized. Space O(n).`,
        check: `q = CancelQueue()
q.add(1); q.add(2); q.add(3)
assert q.cancel(2) is True
assert q.cancel(2) is False
assert q.cancel(9) is False
assert q.pop() == 1
assert q.pop() == 3
assert q.pop() == -1
q.add(5); q.add(6)
assert q.cancel(5) is True
assert q.pop() == 6
assert q.cancel(6) is False
q.add(7); q.add(8); q.add(9)
assert q.cancel(7) and q.cancel(8) and q.cancel(9)
assert q.pop() == -1`
      },
      {
        title: `Snapshot map`,
        q: `Design \`SnapshotMap\` with \`set(key, val)\`, \`snapshot()\` (freezes the current state and returns its id, ids count up from 0) and \`get(key, snap_id)\` (the value the key had when snapshot \`snap_id\` was taken, or None if it had none). \`set\` must be O(1) amortized and \`get\` O(log s) for s snapshots; you may not copy the whole map per snapshot. Example: set a=1; \`snapshot()\` returns 0; set a=2; \`snapshot()\` returns 1; \`get('a', 0)\` is 1, \`get('a', 1)\` is 2.`,
        hint: `Store only changes: for each key, a sorted list of (snapshot id, value). Binary search for the last change at or before the asked snapshot.`,
        how: `I restate it: a map with a history, where I can ask what a key looked like at any past snapshot. The brute force copies the whole dictionary at every snapshot: with 10^5 keys and 10^5 snapshots that is 10^10 stored entries. The waste is that most keys do not change between snapshots. The observation: store only changes. For each key, keep two parallel lists, the snapshot ids at which the key was written and the values. I keep a counter \`snap\` for the id of the snapshot that is currently open (the next one to be taken). set(key, val) writes under id snap; if the last entry for that key already has the id snap, I overwrite its value instead of appending, so repeated writes in the same epoch cost no extra space. snapshot() returns snap and then increments it. For get(key, s), the answer is the latest write with id <= s, so I binary search the ids list with bisect_right: the insertion point minus one is that entry, and if the point is 0 the key had no value yet, so None. The ids are appended in increasing order because snap only grows, so each list stays sorted without sorting. Trace: set a=1 (id 0). snapshot returns 0, snap = 1. set a=2 (id 1). snapshot returns 1. get(a, 0): ids [0,1], bisect_right(0) = 1, value index 0, so 1. get(a, 1): bisect_right = 2, index 1, value 2. Edge cases: unknown key, a key first written after the asked snapshot (None), two writes before one snapshot. Cost: set O(1) amortized, snapshot O(1), get O(log s), space O(number of writes).`,
        code: { py: `from bisect import bisect_right

class SnapshotMap:
    def __init__(self):
        self.hist = {}      # key -> (ids of writes, values), ids increasing
        self.snap = 0       # id of the snapshot that will be taken next

    def set(self, key, val):
        ids, vals = self.hist.setdefault(key, ([], []))
        if ids and ids[-1] == self.snap:
            vals[-1] = val              # same epoch: overwrite
        else:
            ids.append(self.snap)
            vals.append(val)

    def snapshot(self):
        self.snap += 1
        return self.snap - 1

    def get(self, key, snap_id):
        if key not in self.hist:
            return None
        ids, vals = self.hist[key]
        i = bisect_right(ids, snap_id)  # writes with id <= snap_id
        return vals[i - 1] if i else None` },
        explain: `A write made before snapshot s is stored with an id at most s, and one made after has a larger id, so the latest entry with id <= s is exactly the value frozen by snapshot s. The lists are sorted by construction, so bisect works. set and snapshot are O(1), get is O(log s), and space is proportional to the number of writes.`,
        check: `m = SnapshotMap()
m.set('a', 1)
assert m.snapshot() == 0
m.set('a', 2)
assert m.snapshot() == 1
assert m.get('a', 0) == 1
assert m.get('a', 1) == 2
m.set('b', 7)
assert m.get('b', 1) is None
assert m.snapshot() == 2
assert m.get('b', 2) == 7
assert m.get('a', 2) == 2
assert m.get('zzz', 0) is None
m2 = SnapshotMap()
m2.set('k', 5); m2.set('k', 6)
assert m2.snapshot() == 0
assert m2.get('k', 0) == 6
assert m2.snapshot() == 1
assert m2.get('k', 1) == 6`
      },
      {
        title: `Popular stack`,
        q: `Design \`PopularStack\` with \`push(x)\` and \`pop()\`. \`pop\` removes and returns the element that currently occurs **most often** in the stack; if several tie, the one closest to the top (pushed most recently among the tied). Both must be O(1). Example: push 5, 7, 5, 7, 4, 5; then four pops return 5, 7, 5, 4.`,
        hint: `Keep a count per value, and a separate stack per count level. Track the highest level that is non-empty.`,
        how: `I restate: a stack where pop takes the most frequent value, breaking ties by recency. The brute force scans the whole stack at each pop, counts values and looks for the top-most one among the winners, O(n) per pop. The bottleneck is recomputing frequencies. The observation: when a value is pushed for the f-th time, it joins "level f". If I keep one stack per level (level 1 holds each value's first push, level 2 holds its second push, and so on), then the answer to pop is simply the top of the highest non-empty level: that value has the max frequency, and within a level the stack order is push order, so ties resolve by recency. Structures: a dict freq (value to its current count), a dict groups (level to a list used as a stack), and an integer top (highest non-empty level). push(x): bump freq[x] to f, append x to groups[f], raise top if f > top. pop(): take the last item of groups[top], remove it, decrement freq of that value, and if that level is now empty, delete it and lower top by one. Lowering by one is enough because a value present at level top was also pushed at level top - 1 earlier, and those entries are still there. Trace the example: levels 1: [5,7,4], 2: [5,7], 3: [5]. Pop: top level 3 gives 5. Pop: level 2 now [5,7] gives 7. Pop: level 2 gives 5, level 2 is empty so top = 1. Pop: level 1 gives 4. Edge cases: repeated pushes of one value, and popping everything. Every operation is O(1); space O(n).`,
        code: { py: `class PopularStack:
    def __init__(self):
        self.freq = {}        # value -> how many copies are in the stack
        self.groups = {}      # level -> stack of values that reached that level
        self.top = 0          # highest non-empty level

    def push(self, x):
        f = self.freq.get(x, 0) + 1
        self.freq[x] = f
        self.groups.setdefault(f, []).append(x)
        if f > self.top:
            self.top = f

    def pop(self):
        g = self.groups[self.top]
        x = g.pop()
        if not g:
            del self.groups[self.top]
            self.top -= 1
        self.freq[x] -= 1
        return x` },
        explain: `The highest non-empty level holds exactly the values with maximum frequency, and its top entry is the most recently pushed among them. Popping from that level also keeps all lower levels correct, since the removed value's earlier entries sit in lower levels and now represent its smaller count. All operations are O(1), space O(n).`,
        check: `import random
from collections import Counter
s = PopularStack()
for x in [5, 7, 5, 7, 4, 5]:
    s.push(x)
assert [s.pop() for _ in range(4)] == [5, 7, 5, 4]
t = PopularStack()
t.push(1)
assert t.pop() == 1
random.seed(3)
for trial in range(200):
    s = PopularStack()
    ref = []
    for _ in range(80):
        if ref and random.random() < 0.4:
            c = Counter(ref)
            m = max(c.values())
            best = max(i for i, v in enumerate(ref) if c[v] == m)
            assert s.pop() == ref.pop(best)
        else:
            x = random.randint(1, 5)
            ref.append(x)
            s.push(x)`
      },
      {
        title: `Expiring LRU cache`,
        q: `Design \`TTLCache(capacity, ttl)\`. \`put(key, val, now)\` stores the pair, valid for \`ttl\` time units: it is expired once the current time is at least the put time plus \`ttl\`. \`get(key, now)\` returns the value, or -1 if the key is missing or expired (an expired key is removed). A successful \`get\` and every \`put\` count as a use. When a \`put\` makes the cache hold more than \`capacity\` entries, drop the least recently used stored entry (expired or not). \`now\` never decreases. Both calls O(1). Example: capacity 2, ttl 10: put a at 0, put b at 1, \`get(a, 5)\` is its value, put c at 6 evicts b, \`get(a, 10)\` is -1 (expired).`,
        hint: `LRU needs a map plus an ordering. Store the expiry time next to each value, and check it lazily when the key is read.`,
        how: `I restate: an LRU cache where each entry also has a deadline. The brute force keeps a dict and, on every call, scans all entries to delete the expired ones and to find the least recently used: O(n) per call. The structure I need is the one I already know for LRU: a hash map for find-by-key and an ordering where I can move an entry to "newest" and remove the "oldest" in O(1). In Python an OrderedDict is both at once (a dict plus a doubly linked list), so I use it directly and mention to the interviewer that in a language without it I would build the map and the doubly linked list with sentinels. Each value is stored as (val, expires_at). The new idea is lazy expiry: I do not sweep. In get, if the key is missing return -1; if now >= expires_at, delete the entry and return -1; otherwise move_to_end and return the value. In put, I write (val, now + ttl), move the key to the end (this also refreshes the expiry, since a put replaces the entry), and if the size exceeds capacity I popitem(last=False) to drop the oldest by use. Trace with capacity 2, ttl 10: put a at 0 (expires 10), put b at 1 (11), get a at 5 returns its value and moves a to the end: order b, a. put c at 6 makes three entries, evict b. get a at 10: 10 >= 10 so expired, deleted, -1. Edge cases: re-putting a key refreshes its deadline; reading an expired key only costs the one delete; capacity 1. Each call is O(1); space O(capacity).`,
        code: { py: `from collections import OrderedDict

class TTLCache:
    def __init__(self, capacity, ttl):
        self.cap, self.ttl = capacity, ttl
        self.d = OrderedDict()       # key -> (value, expires_at); oldest use first

    def get(self, key, now):
        if key not in self.d:
            return -1
        val, exp = self.d[key]
        if now >= exp:               # lazy expiry: check only when read
            del self.d[key]
            return -1
        self.d.move_to_end(key)      # a read is a use
        return val

    def put(self, key, val, now):
        self.d[key] = (val, now + self.ttl)
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)   # least recently used` },
        explain: `The OrderedDict keeps entries in use order, so the front is always the least recently used. Expiry is decided at read time from the stored deadline, which is exactly what the statement defines. Each operation does one hash lookup and a constant number of list moves: O(1), with O(capacity) space.`,
        check: `c = TTLCache(2, 10)
c.put('a', 1, 0)
c.put('b', 2, 1)
assert c.get('a', 5) == 1
c.put('c', 3, 6)
assert c.get('b', 6) == -1
assert c.get('a', 9) == 1
assert c.get('a', 10) == -1
assert c.get('c', 15) == 3
assert c.get('c', 16) == -1
c2 = TTLCache(1, 5)
c2.put('x', 1, 0)
c2.put('x', 2, 4)
assert c2.get('x', 8) == 2
assert c2.get('x', 9) == -1
c2.put('x', 1, 10)
c2.put('y', 2, 11)
assert c2.get('x', 11) == -1
assert c2.get('y', 11) == 2`
      }
    ],

    how: {
      146: `Restating: build a cache with a fixed capacity. get(key) returns the value or -1 and counts as a use. put(key, value) stores the pair, counts as a use, and if the cache now holds too many pairs, removes the one used longest ago. Both must be O(1). The brute force keeps a list of keys in recency order plus a dict of values; every use finds the key in the list and moves it, which is O(n). Another brute force stores a time stamp per key and scans for the smallest on overflow, also O(n). I write down what each operation needs: find by key, change the recency order, and find or remove the oldest. A hash map is the O(1) find. For the order I need something where I can move or remove an item I already hold in O(1): a doubly linked list. The link between the two is that the map's values are the list nodes themselves, so one lookup puts me on the node to unlink. Newest sits next to a dummy head, oldest next to a dummy tail; the dummies remove all first-and-last special cases. Every use is unlink then push-front. On overflow I take tail.prev, unlink it, and delete its key from the map, which is why each node stores its key. Trace capacity 2: put 1, put 2, get 1 (order 1,2), put 3 evicts 2, get 2 gives -1. Edge cases: capacity 1, put on an existing key must update and move (not add a second node), get on an empty cache. All operations O(1), space O(capacity).`,
      355: `Restating: support postTweet, follow, unfollow and getNewsFeed, where the feed is the ten newest tweet ids among the user and their followees. The brute force is one global list of (user, tweet); to build a feed I scan from the newest end, keeping tweets whose author I follow, until I have ten. It is simple, but a user following quiet accounts may scan an enormous list. The better view: each person's own tweets are already sorted by time because they only get appended. A feed is therefore a merge of several sorted lists where I only want the newest ten. That is a heap job. To compare tweets across users I need a time stamp, so a global counter increments on every post. Structures: tweets, a map from user to a list of (time, id); follows, a map from user to a set of followees (a set makes follow and unfollow O(1) and makes repeats harmless). getNewsFeed: build the source set (followees plus the user), push each source's newest tweet into a max-heap keyed on time with its position, then pop up to ten times; after each pop push the same user's next older tweet. Trace: user 1 posts tweet 5 (time 1); follows 2; user 2 posts 6 (time 2). Heap holds (2, user 2) and (1, user 1): pops give 6 then 5. Edge cases: a user with no tweets, following yourself (set union avoids duplicates), fewer than ten tweets, unfollowing someone not followed. Cost: post and follow O(1); a feed is O(s + 10 log s) for s sources.`,
      380: `Restating: a set of integers with insert (true if newly added), remove (true if it was present) and getRandom, which must pick every stored value with equal probability. All must be O(1) on average. A hash set gives insert and remove in O(1), but random pick would require turning it into a list each time, O(n). A plain list gives random pick in O(1) by index but needs O(n) to find a value and then shift to delete it. Each structure has exactly the operation the other lacks. So pair them: an array of values for random pick, and a map from value to its index in the array for finding. The remaining weak spot is deleting from the middle of the array. Order is meaningless in a set, so I avoid the shift: overwrite the slot to delete with the last element, update that moved element's index in the map, pop the end of the array, and delete the removed value from the map. Trace items [7,3,8,5]: remove 3 puts 5 at index 1, pos[5] = 1, array becomes [7,5,8]. The case where the removed value is the last one still works because the slot is overwritten with itself; I just make sure to delete the map entry after the update, not before. Edge cases: removing from an empty set returns false, inserting an existing value returns false, value 0 is a normal value. The array stays gap-free so random.choice(items) is uniform. All operations are O(1) average; space O(n).`,
      460: `Restating: an LRU-like cache, but eviction removes the key with the smallest use count, and among equal counts the one used least recently. Capacity 0 must be accepted and stores nothing. I start from what LRU taught me: one ordering was enough for LRU, here I need two levels. The brute force keeps a count and a last-used time per key and scans for the minimum on eviction, O(n). The observation: group keys by count. For each count c I keep the keys that have exactly that count in order of use, oldest first; an OrderedDict per count does that because it remembers insertion order and can pop from the front. I also keep low, the smallest count that currently has any key. Structures: val (key to value), cnt (key to count), buckets (count to OrderedDict of keys), low. A use (get, or put on an existing key) removes the key from bucket c, adds it to the end of bucket c+1, and if bucket c is now empty and c was low, low becomes c+1. A put of a new key, when full, pops the oldest key of buckets[low], deletes it from val and cnt, then inserts the new key into bucket 1 and sets low = 1 (nothing has a smaller count than a fresh key). Trace capacity 2: put 1, put 2, get 1 (1 has count 2), put 3 evicts key 2 (count 1, the lowest), get 2 returns -1, get 3 returns 3. Edge cases: capacity 0, re-putting an existing key counts as a use and does not evict. All operations O(1); space O(capacity).`,
      284: `Restating: wrap an iterator so that, besides next and hasNext, I can call peek, which shows the upcoming value without consuming it. The underlying iterator can only move forward, so I cannot look and then step back. The brute force is to copy everything into a list up front and keep an index; it works but costs O(n) memory and fails for a stream that is long or lazy. The better question is what is the minimum I must remember between calls. The answer is one value: the next element, read ahead of time. So I keep a buffer. In the constructor I pull the first element into the buffer. peek returns the buffer. next returns the buffer and then refills it by pulling the following element from the underlying iterator. hasNext is true while the buffer holds a real element. The one subtle choice is how to represent an empty buffer: using None or null would be wrong because None can be a legitimate value in the data. I use a private sentinel object (in Python, next(it, SENTINEL) gives me the default for free; in JavaScript I would use the iterator result's done flag). Trace on [1, 2]: construct, buffer = 1. peek returns 1, hasNext true. next returns 1 and buffer becomes 2. next returns 2 and buffer becomes the sentinel. hasNext is false. Edge cases: an empty source, and calling peek several times in a row (no change). Every call is O(1) time and the extra space is O(1).`
    }
  };
})();
