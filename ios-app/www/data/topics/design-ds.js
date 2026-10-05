/* Offer Ready: Data-structure design questions lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in py/js (class-design problems are skipped for java/cpp by the tool;
   their Java and C++ were compiled and run by hand). */
(function () {
  var OR = (window.OR = window.OR || {});
  var topic = {
    id: 'design-ds',

    hook: 'A design question gives you **no input array**. It gives you a list of operations (`get`, `put`, `insert`, `remove`, `getRandom`, `next`, `peek`…), a speed target (almost always **O(1)**), and asks you to build the class. No single textbook structure meets the target, so the answer is to **glue two structures together**, each covering the other’s weakness. It is one of the most reliably asked interview categories, because it tests whether you really know what a hash map and a linked list can and cannot do. The famous ones: LRU Cache (146), Insert Delete GetRandom O(1) (380), Design Twitter (355) and the hard one, LFU Cache (460). If you only learn one pairing, make it **hash map + doubly linked list**.',

    cues: [
      'The statement lists **methods** of a class and says each must be **O(1)** (or O(log n)). There is no function to write, only an object that remembers things.',
      'It needs both **fast lookup by key** and a **maintained order** (recency, frequency, insertion): a map alone has no order, a list alone has no fast lookup.',
      'It needs **removal from the middle** in constant time: you have to be able to reach the exact node and unlink it, which is a doubly linked list job.',
      '“**Evict** the least recently used / least frequently used”, “most recent first”, “move to the front on access”.',
      'You must return a **uniformly random** element after inserts and deletes, in constant time (an array, with a trick to delete).',
      'You wrap an iterator so it can do something extra (**peek**, skip, flatten) and must keep exactly the state needed between calls.',
      'A feed or “top k” is assembled from several already-sorted sources: **merge the k newest** with a heap instead of sorting everything.'
    ],

    intuition: [
      'Think of a design problem as a **shopping list of operations, each with a price tag**. A hash map is cheap for “find by key” (O(1)) and useless for “who was used last?”. A doubly linked list is cheap for “move this node to the front” and “remove this node” (O(1), if you already **hold** the node) and useless for “find the node for key 7” (it needs a scan). An array is cheap for “give me item number i” and “append”, and costly for deleting from the middle (everything shifts). Pair two structures so that **every operation is cheap in at least one of them**, and keep the two in sync.',
      '**LRU cache** is the model case. The map answers “is key 7 cached, and where is its node?” in O(1). The list holds the nodes in recency order, **front = most recently used, back = oldest**. A `get` finds the node through the map, **unlinks** it, and **relinks** it at the front. A `put` of a new key adds a node at the front, and if the cache is over capacity, drops the node at the back **and deletes its key from the map**. Every step is a few pointer assignments, so everything is O(1). The visualizer above runs exactly this with the map on one side and the list on the other.',
      'Two tricks make the code short and bug-free. First, **sentinel nodes**: a dummy `head` and a dummy `tail` that are always in the list, so a real node always has a real `prev` and `next` and you never write “if it is the first node” or “if it is the last”. Second, a node stores its **own key**, because when you evict the tail you need the key to delete it from the map.',
      '**Insert Delete GetRandom** uses a different pairing for a different price list. Random pick needs an array (`items[randint]`). Delete-by-value needs to find the value fast (a map from value to its array index). The array’s weakness, deleting from the middle, disappears with the **swap-with-last** trick: copy the last element into the hole, fix that one element’s index in the map, and pop the end. No shifting.',
      'Before you write any code, do three things aloud: **state the interface** (the exact methods and what they return, including the “missing” cases), **name the invariant** that ties your structures together (“the map and the list always hold exactly the same keys”), and **walk a tiny example** through every operation, counting the pointer or index updates. Interviewers watch for that order. The code after it is the easy part.'
    ].join('\n\n'),

    viz: 'lru',

    template: {
      title: 'LRU cache: hash map + doubly linked list with sentinels',
      note: 'Read it as three layers. The two private helpers, `unlink` and `pushFront`, are pure pointer surgery on a node you already hold. `get` and `put` use them: **every use of a key = unlink then pushFront**, and only `put` of a new key can overflow. The map is updated in exactly two places: when a node is added and when the tail is evicted. Forget the second one (the line `del self.map[lru.key]`) and the map grows forever, which is the classic bug. The node keeps its own `key` for that reason. In C++ the evicted node is freed; in the other languages the garbage collector does it.',
      code: {
        py: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                              #> key -> node: finds a node in O(1)
        self.head, self.tail = Node(), Node()      #> Sentinels: real nodes always sit between them
        self.head.next = self.tail                 #> Empty list: head and tail point at each other
        self.tail.prev = self.head

    def _unlink(self, n):
        n.prev.next = n.next                       #@unlink > Bypass n: its two neighbours now point at each other
        n.next.prev = n.prev

    def _push_front(self, n):
        n.prev = self.head                         #@front > Splice n in right after head: most recently used
        n.next = self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key):
        if key not in self.map:                    #@lookup > One O(1) map lookup finds the node, no list scan
            return -1                              #@miss > Not cached: answer -1 and change nothing
        n = self.map[key]
        self._unlink(n)
        self._push_front(n)
        return n.val                               #@hit > A read is a use: it moved to the front

    def put(self, key, value):
        if key in self.map:                        #@lookup
            n = self.map[key]
            n.val = value                          #@update > Overwrite the value; a write counts as a use too
            self._unlink(n)
        else:
            n = Node(key, value)                   #@add > New key: new node, recorded in the map
            self.map[key] = n
        self._push_front(n)
        if len(self.map) > self.cap:               #@over > Only a new key can push the size over capacity
            lru = self.tail.prev                   #@evict > The node just before tail is the least recently used
            self._unlink(lru)
            del self.map[lru.key]                  #> It must leave the map too, hence the node stores its key`,
        js: `class Node {
  constructor(key = 0, val = 0) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();                          //> key -> node: finds a node in O(1)
    this.head = new Node();                        //> Sentinels: real nodes always sit between them
    this.tail = new Node();
    this.head.next = this.tail;                    //> Empty list: head and tail point at each other
    this.tail.prev = this.head;
  }

  unlink(n) {
    n.prev.next = n.next;                          //@unlink > Bypass n: its two neighbours now point at each other
    n.next.prev = n.prev;
  }

  pushFront(n) {
    n.prev = this.head;                            //@front > Splice n in right after head: most recently used
    n.next = this.head.next;
    this.head.next.prev = n;
    this.head.next = n;
  }

  get(key) {
    if (!this.map.has(key))                        //@lookup > One O(1) map lookup finds the node, no list scan
      return -1;                                   //@miss > Not cached: answer -1 and change nothing
    const n = this.map.get(key);
    this.unlink(n);
    this.pushFront(n);
    return n.val;                                  //@hit > A read is a use: it moved to the front
  }

  put(key, value) {
    let n;
    if (this.map.has(key)) {                       //@lookup
      n = this.map.get(key);
      n.val = value;                               //@update > Overwrite the value; a write counts as a use too
      this.unlink(n);
    } else {
      n = new Node(key, value);                    //@add > New key: new node, recorded in the map
      this.map.set(key, n);
    }
    this.pushFront(n);
    if (this.map.size > this.cap) {                //@over > Only a new key can push the size over capacity
      const lru = this.tail.prev;                  //@evict > The node just before tail is the least recently used
      this.unlink(lru);
      this.map.delete(lru.key);                    //> It must leave the map too, hence the node stores its key
    }
  }
}`,
        java: `class LRUCache {
    private static class Node {
        int key, val;
        Node prev, next;
        Node(int key, int val) { this.key = key; this.val = val; }
    }

    private final int cap;
    private final Map<Integer, Node> map = new HashMap<>();   //> key -> node: finds a node in O(1)
    private final Node head = new Node(0, 0);                 //> Sentinels: real nodes always sit between them
    private final Node tail = new Node(0, 0);

    public LRUCache(int capacity) {
        cap = capacity;
        head.next = tail;                                     //> Empty list: head and tail point at each other
        tail.prev = head;
    }

    private void unlink(Node n) {
        n.prev.next = n.next;                                 //@unlink > Bypass n: its two neighbours now point at each other
        n.next.prev = n.prev;
    }

    private void pushFront(Node n) {
        n.prev = head;                                        //@front > Splice n in right after head: most recently used
        n.next = head.next;
        head.next.prev = n;
        head.next = n;
    }

    public int get(int key) {
        if (!map.containsKey(key)) {                          //@lookup > One O(1) map lookup finds the node, no list scan
            return -1;                                        //@miss > Not cached: answer -1 and change nothing
        }
        Node n = map.get(key);
        unlink(n);
        pushFront(n);
        return n.val;                                         //@hit > A read is a use: it moved to the front
    }

    public void put(int key, int value) {
        Node n;
        if (map.containsKey(key)) {                           //@lookup
            n = map.get(key);
            n.val = value;                                    //@update > Overwrite the value; a write counts as a use too
            unlink(n);
        } else {
            n = new Node(key, value);                         //@add > New key: new node, recorded in the map
            map.put(key, n);
        }
        pushFront(n);
        if (map.size() > cap) {                               //@over > Only a new key can push the size over capacity
            Node lru = tail.prev;                             //@evict > The node just before tail is the least recently used
            unlink(lru);
            map.remove(lru.key);                              //> It must leave the map too, hence the node stores its key
        }
    }
}`,
        cpp: `class LRUCache {
    struct Node {
        int key, val;
        Node *prev = nullptr, *next = nullptr;
        Node(int k, int v) : key(k), val(v) {}
    };

    int cap;
    unordered_map<int, Node*> map;                            //> key -> node: finds a node in O(1)
    Node* head = new Node(0, 0);                              //> Sentinels: real nodes always sit between them
    Node* tail = new Node(0, 0);

    void unlink(Node* n) {
        n->prev->next = n->next;                              //@unlink > Bypass n: its two neighbours now point at each other
        n->next->prev = n->prev;
    }

    void pushFront(Node* n) {
        n->prev = head;                                       //@front > Splice n in right after head: most recently used
        n->next = head->next;
        head->next->prev = n;
        head->next = n;
    }

public:
    LRUCache(int capacity) : cap(capacity) {
        head->next = tail;                                    //> Empty list: head and tail point at each other
        tail->prev = head;
    }

    int get(int key) {
        auto it = map.find(key);                              //@lookup > One O(1) map lookup finds the node, no list scan
        if (it == map.end()) return -1;                       //@miss > Not cached: answer -1 and change nothing
        Node* n = it->second;
        unlink(n);
        pushFront(n);
        return n->val;                                        //@hit > A read is a use: it moved to the front
    }

    void put(int key, int value) {
        Node* n;
        auto it = map.find(key);                              //@lookup
        if (it != map.end()) {
            n = it->second;
            n->val = value;                                   //@update > Overwrite the value; a write counts as a use too
            unlink(n);
        } else {
            n = new Node(key, value);                         //@add > New key: new node, recorded in the map
            map[key] = n;
        }
        pushFront(n);
        if ((int)map.size() > cap) {                          //@over > Only a new key can push the size over capacity
            Node* lru = tail->prev;                           //@evict > The node just before tail is the least recently used
            unlink(lru);
            map.erase(lru->key);                              //> It must leave the map too, hence the node stores its key
            delete lru;
        }
    }
};`
      },
      tests: { design: true, cases: [
        { ops: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]], out: [null, null, null, 1, null, -1, null, -1, 3, 4] },
        { ops: ['LRUCache', 'put', 'put', 'put', 'get', 'put', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1, 10], [1], [3, 3], [2], [1]], out: [null, null, null, null, 10, null, -1, 10] },
        { ops: ['LRUCache', 'get', 'put', 'put', 'get', 'get'], args: [[1], [5], [5, 50], [6, 60], [5], [6]], out: [null, -1, null, null, -1, 60] }] }
    },

    complexity: {
      time: 'O(1) per operation (average, for the hash map)',
      space: 'O(capacity), or O(n) for n stored items',
      why: 'Every operation does a **fixed number of steps**: one hash lookup, then a handful of pointer assignments (unlink is 2, push-front is 4), and at most one eviction (another unlink and one map delete). Nothing loops over the stored items. Remove the map and `get` has to walk the list, O(n). Remove the list and “which key is oldest?” needs a scan or a sort, O(n) or O(n log n). It is the **pairing** that gives O(1). Space is one node plus one map entry per stored key.',
      trap: 'Saying “O(1)” while hiding a scan. A singly linked list makes unlink O(n) (you need the previous node), so the list must be **doubly** linked. A Python `list.remove(x)` or `list.insert(0, x)` is O(n) too. And a hash map is O(1) **on average**: say so, and mention that a bad hash or many collisions can degrade it. If an operation truly needs sorted order (floor, ceiling, k-th smallest), O(1) is impossible and the target becomes O(log n) with a balanced tree or a heap.'
    },

    variations: [
      {
        name: 'Sentinels: why two dummy nodes',
        body: 'Without sentinels, every pointer operation needs special cases: removing the first node must update `head`, removing the last must update `tail`, inserting into an empty list must set both. That is four to six extra `if`s, and each is a place for a bug. With a dummy `head` and a dummy `tail` that **never leave the list**, a real node always has a real `prev` and a real `next`, so `unlink` and `pushFront` are the same four lines for every case, empty list included. The cost is two nodes of memory. Rule of thumb: whenever you code a linked list with insert and delete in the middle, add sentinels first and the edge cases vanish. The same trick works for sorted arrays (put a very small and a very large value at the ends) and for linked-list merges (a dummy head).'
      },
      {
        name: 'The library shortcut (and why you should still know the long way)',
        body: 'Python’s `OrderedDict` and Java’s `LinkedHashMap` are exactly “hash map + doubly linked list” already built: they remember insertion order and let you move a key to either end in O(1). JavaScript’s `Map` also iterates in insertion order, so deleting and re-setting a key moves it to the back. In an interview, **ask whether you may use them**. If yes, the whole LRU is about ten lines (below). If the interviewer says “implement it yourself”, that is the template above. Either way, say out loud what the library is doing underneath, because that is the point of the question.',
        code: {
          py: `from collections import OrderedDict

class LRUCacheShort:
    def __init__(self, capacity):
        self.cap = capacity
        self.d = OrderedDict()                   # oldest first, newest last

    def get(self, key):
        if key not in self.d:
            return -1
        self.d.move_to_end(key)                  # a read is a use
        return self.d[key]

    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)           # drop the oldest`,
          js: `class LRUCacheShort {
  constructor(capacity) {
    this.cap = capacity;
    this.d = new Map();                          // iterates oldest first, newest last
  }
  get(key) {
    if (!this.d.has(key)) return -1;
    const v = this.d.get(key);
    this.d.delete(key);                          // delete and set again: moves it to the newest end
    this.d.set(key, v);
    return v;
  }
  put(key, value) {
    this.d.delete(key);
    this.d.set(key, value);
    if (this.d.size > this.cap) this.d.delete(this.d.keys().next().value);   // drop the oldest
  }
}`
        },
        tests: { design: true, cases: [
          { ops: ['LRUCacheShort', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]], out: [null, null, null, 1, null, -1, null, -1, 3, 4] },
          { ops: ['LRUCacheShort', 'put', 'put', 'put', 'get', 'put', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1, 10], [1], [3, 3], [2], [1]], out: [null, null, null, null, 10, null, -1, 10] }] }
      },
      {
        name: 'Interface first: the four-question opening',
        body: 'Spend the first two minutes on questions, not code. They are cheap, they show maturity, and they pin down which structures you need.\n\n1. **What exactly are the methods, their inputs, and their return values?** What does `get` return for a missing key (-1, null, an exception)? Does `insert` of a duplicate return false?\n2. **What are the speed targets for each method?** “Both O(1)” decides the whole design. Ask if “average O(1)” is acceptable (it makes a hash map legal).\n3. **What are the sizes and edge cases?** Capacity 0 or 1, empty structure, repeated keys, many deletes in a row.\n4. **Is it single-threaded?** (Almost always yes. If not, say where a lock would go and move on.)\n\nThen write the **method table**: for every method, the cheap structure that serves it. If two methods need different structures, that is your pairing. Only then write code.'
      },
      {
        name: 'Test-driven walk: simulate before you submit',
        body: 'After the code, **run it by hand** on a tiny scenario, writing the state after every operation. For LRU with capacity 2: `put(1,1)` → list `[1]`; `put(2,2)` → `[2,1]`; `get(1)` → `[1,2]`, returns 1; `put(3,3)` → `[3,1,2]` is over capacity, evict the tail (2) → `[3,1]`; `get(2)` → -1; `put(4,4)` → evict 1 → `[4,3]`. Three habits make this catch real bugs: (1) include a **repeated key** (`put(1,1)` then `put(1,9)` must update, not duplicate); (2) include a **read that changes the future** (the `get(1)` above is why 1 survives); (3) after each step, check the **invariant**: map size equals list length, and every list node is in the map. Say “my invariant is...” once at the start and the walk becomes a checklist instead of a guess.'
      },
      {
        name: 'Iterator design: hold exactly one look-ahead value',
        body: 'Iterator questions (peek, flatten, merge two streams) are small state machines. Ask: **what is the minimum I must remember between calls so that every method answers in O(1)?** For `peek` it is one buffered value: you pulled it from the source early, so it must not be pulled again. For flattening a list of lists it is two numbers, the current row and the position in it, plus a helper that **skips empty rows** after every move. Always do the skipping *eagerly* (right after the constructor and after each `next`), so that `hasNext` is a one-line check with no side effects. The flat iterator below shows the pattern.',
        code: {
          py: `class FlatIterator:
    def __init__(self, rows):
        self.rows = rows
        self.r = 0                               # current row
        self.c = 0                               # position inside it
        self._skip()

    def _skip(self):
        while self.r < len(self.rows) and self.c == len(self.rows[self.r]):
            self.r += 1                          # row used up (or empty): go to the next
            self.c = 0

    def next(self):
        v = self.rows[self.r][self.c]
        self.c += 1
        self._skip()                             # keep the invariant: we always rest on a real value
        return v

    def hasNext(self):
        return self.r < len(self.rows)`,
          js: `class FlatIterator {
  constructor(rows) {
    this.rows = rows;
    this.r = 0;                                  // current row
    this.c = 0;                                  // position inside it
    this.skip();
  }
  skip() {
    while (this.r < this.rows.length && this.c === this.rows[this.r].length) {
      this.r++;                                  // row used up (or empty): go to the next
      this.c = 0;
    }
  }
  next() {
    const v = this.rows[this.r][this.c++];
    this.skip();                                 // keep the invariant: we always rest on a real value
    return v;
  }
  hasNext() {
    return this.r < this.rows.length;
  }
}`
        },
        tests: { design: true, cases: [
          { ops: ['FlatIterator', 'next', 'next', 'hasNext', 'next', 'next', 'hasNext'], args: [[[[1, 2], [], [3], [4]]], [], [], [], [], [], []], out: [null, 1, 2, true, 3, 4, false] },
          { ops: ['FlatIterator', 'hasNext'], args: [[[[], []]], []], out: [null, false] },
          { ops: ['FlatIterator', 'hasNext', 'next', 'hasNext'], args: [[[[], [7], []]], [], [], []], out: [null, true, 7, false] }] }
      },
      {
        name: 'Design Twitter in one idea: merge k sorted lists',
        body: 'The feed is “the 10 newest tweets among everyone I follow”. Each person’s tweets are already in time order (append only), so the feed is a **k-way merge** of k sorted lists, stopping after 10. Do not collect and sort everything (O(total tweets)). Instead put the **newest tweet of each followed user** in a max-heap, pop the best, and push that user’s next older tweet. Ten pops cost O(10 log k). The design half is small: a global counter gives each tweet a time stamp (so tweets from different users compare), a dictionary from user to their tweet list, and a dictionary from user to the **set** of followees (a set makes follow and unfollow O(1) and ignores duplicates). The merge below is the heart; the full class is the worked problem.',
        code: {
          py: `import heapq

def newest(lists, k):
    # lists: each is oldest-first [(time, id), ...]; return the k newest ids overall
    heap = [(-L[-1][0], i, len(L) - 1) for i, L in enumerate(lists) if L]
    heapq.heapify(heap)                          # newest tweet of every list
    out = []
    while heap and len(out) < k:
        _, i, j = heapq.heappop(heap)
        out.append(lists[i][j][1])
        if j:
            heapq.heappush(heap, (-lists[i][j - 1][0], i, j - 1))   # that list's next older tweet
    return out`,
          js: `function newest(lists, k) {
  // a tiny binary heap keyed by time, newest first
  const heap = [];
  const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] >= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const down = (i) => {
    for (;;) {
      let m = i, l = 2 * i + 1, r = l + 1;
      if (l < heap.length && heap[l][0] > heap[m][0]) m = l;
      if (r < heap.length && heap[r][0] > heap[m][0]) m = r;
      if (m === i) return;
      [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
    }
  };
  const push = (x) => { heap.push(x); up(heap.length - 1); };
  lists.forEach((L, i) => { if (L.length) push([L[L.length - 1][0], i, L.length - 1]); });
  const out = [];
  while (heap.length && out.length < k) {
    const top = heap[0], last = heap.pop();
    if (heap.length) { heap[0] = last; down(0); }
    const [, i, j] = top;
    out.push(lists[i][j][1]);
    if (j) push([lists[i][j - 1][0], i, j - 1]);   // that list's next older tweet
  }
  return out;
}`
        },
        tests: { fn: 'newest', cases: [
          { args: [[[[1, 11], [4, 14]], [[2, 22], [3, 23], [5, 25]], []], 4], out: [25, 14, 23, 22] },
          { args: [[[[1, 7]]], 3], out: [7] },
          { args: [[[], []], 2], out: [] },
          { args: [[[[1, 1], [2, 2], [3, 3]], [[4, 4]]], 10], out: [4, 3, 2, 1] }] }
      },
      {
        name: 'LFU in one paragraph: three maps and a floor',
        body: 'LRU needs one order. **LFU** (least frequently used, ties broken by least recent) needs two: first by use count, then by recency inside a count. The O(1) design is **key → (value, count)**, **count → keys of that count in recency order** (a linked hash map per count), and a number `low`, the smallest count that currently has any key. A use moves the key from bucket `c` to bucket `c + 1`; if bucket `c` became empty and `c` was `low`, then `low` becomes `c + 1`. An insert of a new key evicts the oldest key of bucket `low` (if full) and sets `low = 1`. It is a stretch goal: first nail LRU, then add the count dimension. Worked in full as 460 below.'
      },
      {
        name: 'Beyond the interview: what real caches add',
        body: 'Production caches add **expiry** (a time stamp per entry, plus lazy deletion on read or a timer wheel), **size in bytes** instead of entry count, **thread safety** (a lock around the map and list, or sharded caches, one lock per shard), and **approximate LRU** (Redis samples a few random keys and evicts the oldest of them, avoiding the list entirely). Mentioning one or two shows you know the textbook version is the beginning. Don’t build them unless asked. Related reading: the lesson on [hashing internals](#/topic/hashing-internals) explains why the map is O(1) on average, [linked lists](#/topic/linked-lists) covers the pointer surgery, and [heaps](#/topic/heaps) the merge used by the feed.'
      }
    ],

    worked: [
      {
        lc: 146,
        restate: 'Build a cache that holds at most `capacity` key-value pairs. `get(key)` returns the stored value, or -1 if the key is not cached. `put(key, value)` stores the pair (replacing the value if the key exists). If storing makes the cache hold more than `capacity` pairs, remove the pair whose key was **used longest ago**, where a use is any `get` or `put` of that key. Both methods must run in O(1).',
        examples: '- Capacity 2: `put(1,1)`, `put(2,2)`, `get(1)` → `1`, `put(3,3)` (key 2 is the oldest use, so it goes), `get(2)` → `-1`, `put(4,4)` (now key 1 goes), `get(1)` → `-1`, `get(3)` → `3`, `get(4)` → `4`.\n- A `put` on an existing key updates it **and** makes it the newest.\n- Edge cases: capacity 1; `get` on an empty cache; many puts of the same key (never grows).',
        brute: 'Keep a plain list of keys in recency order plus a dictionary of values. Each use finds the key in the list and moves it: O(n). Or store a time stamp per key and, on overflow, scan for the smallest: O(n). Correct, but the statement asks for O(1) and a long run of operations on a big cache would crawl.',
        insight: 'List the cheap structure for each need. **Find by key**: hash map. **Know the order, and move or drop items in O(1)**: doubly linked list, front = newest, back = oldest. Put them together: the map’s values are the **list nodes themselves**, so one lookup lands you on the node you need to unlink. Use two sentinel nodes so the first and last real nodes need no special case. Every use is “unlink, push to front”; overflow is “take the node before the tail sentinel, unlink it, and **also** delete its key from the map”. The node stores its key for exactly that last step.',
        complexity: 'Every operation is O(1): one hash lookup plus a constant number of pointer changes. Space is O(capacity).',
        say: '“I need lookup by key and an order I can change in constant time, so I combine a hash map with a doubly linked list. The map goes from key to node; the list runs from most recent at the front to least recent at the back, with a dummy head and tail so there are no edge cases. A get unlinks the node and puts it after the head. A put of an existing key updates the value and does the same; a put of a new key adds a node after the head and, if I am over capacity, removes the node before the tail and its entry in the map. That is why the node stores its key. All O(1).”',
        followups: [
          { q: 'Why a doubly linked list and not a singly linked one?', a: 'To unlink a node you must change its **previous** node’s `next`. With a singly linked list you cannot reach the previous node without scanning from the head, which is O(n). The `prev` pointer makes it O(1).' },
          { q: 'Why does the node store its own key?', a: 'On eviction you reach the node from the tail side, and you must delete its key from the map. Without the key in the node you would have to search the map for the value, O(n).' },
          { q: 'How would you make it thread safe?', a: 'One lock around get and put (both mutate the list), or shard the keys across several independent caches, each with its own lock. A read-write lock does not help because every get also writes.' },
          { q: 'What changes if the cache must expire entries after a time limit?', a: 'Store an expiry time in the node. On get, if it has passed, unlink the node and delete the key (lazy expiry); optionally sweep from the tail side on put, since the oldest entries are at the back.' }
        ]
      },
      {
        lc: 380,
        restate: 'Design a set of distinct integers with `insert(val)` (returns true if it was absent and is now added), `remove(val)` (returns true if it was present and is now removed), and `getRandom()` (returns one stored value, each stored value equally likely; the set is never empty when it is called). Every operation must run in O(1) on average.',
        examples: '- `insert(1)` → true, `remove(2)` → false, `insert(2)` → true, `getRandom()` → `1` or `2`, `remove(1)` → true, `insert(2)` → false, `getRandom()` → `2`.\n- Edge cases: remove from an empty set; remove the value that sits **last** in the array; insert the value `0`; many inserts after many removes.',
        brute: 'A hash set gives O(1) insert and remove but no random pick: you would copy it to a list each time (O(n)). A list gives O(1) random pick but O(n) to find and delete a value.',
        insight: 'Random pick needs **indexed access**: an array. Delete-by-value needs a **fast find**: a map from value to its index. The array’s weak spot is deleting from the middle (shifting). Remove that weakness with **swap-with-last**: to delete the value at index `i`, copy the **last** element into slot `i`, update that moved element’s index in the map, and pop the end. Order does not matter in a set, so nothing is lost. Be careful with the case where the removed value *is* the last one: it works (the slot is overwritten with itself), as long as you delete the map entry **after** updating the moved element, not before.',
        code: {
          py: `import random

class RandomizedSet:
    def __init__(self):
        self.items = []                          # values, for picking by index
        self.pos = {}                            # value -> its index in items

    def insert(self, val: int) -> bool:
        if val in self.pos:
            return False
        self.pos[val] = len(self.items)
        self.items.append(val)
        return True

    def remove(self, val: int) -> bool:
        if val not in self.pos:
            return False
        i = self.pos[val]
        last = self.items[-1]
        self.items[i] = last                     # the last element fills the hole
        self.pos[last] = i                       # ...and its index changes
        self.items.pop()                         # O(1): nothing shifts
        del self.pos[val]
        return True

    def getRandom(self) -> int:
        return random.choice(self.items)`,
          js: `class RandomizedSet {
  constructor() {
    this.items = [];                             // values, for picking by index
    this.pos = new Map();                        // value -> its index in items
  }
  insert(val) {
    if (this.pos.has(val)) return false;
    this.pos.set(val, this.items.length);
    this.items.push(val);
    return true;
  }
  remove(val) {
    if (!this.pos.has(val)) return false;
    const i = this.pos.get(val);
    const last = this.items[this.items.length - 1];
    this.items[i] = last;                        // the last element fills the hole
    this.pos.set(last, i);                       // ...and its index changes
    this.items.pop();                            // O(1): nothing shifts
    this.pos.delete(val);
    return true;
  }
  getRandom() {
    return this.items[Math.floor(Math.random() * this.items.length)];
  }
}`,
          java: `class RandomizedSet {
    private final List<Integer> items = new ArrayList<>();       // values, for picking by index
    private final Map<Integer, Integer> pos = new HashMap<>();   // value -> its index in items
    private final Random rng = new Random();

    public RandomizedSet() {
    }

    public boolean insert(int val) {
        if (pos.containsKey(val)) return false;
        pos.put(val, items.size());
        items.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer i = pos.get(val);
        if (i == null) return false;
        int last = items.get(items.size() - 1);
        items.set(i, last);                      // the last element fills the hole
        pos.put(last, i);                        // ...and its index changes
        items.remove(items.size() - 1);          // O(1): removes by index, nothing shifts
        pos.remove(val);
        return true;
    }

    public int getRandom() {
        return items.get(rng.nextInt(items.size()));
    }
}`,
          cpp: `class RandomizedSet {
    vector<int> items;                           // values, for picking by index
    unordered_map<int, int> pos;                 // value -> its index in items
public:
    RandomizedSet() {}

    bool insert(int val) {
        if (pos.count(val)) return false;
        pos[val] = items.size();
        items.push_back(val);
        return true;
    }

    bool remove(int val) {
        auto it = pos.find(val);
        if (it == pos.end()) return false;
        int i = it->second, last = items.back();
        items[i] = last;                         // the last element fills the hole
        pos[last] = i;                           // ...and its index changes
        items.pop_back();                        // O(1): nothing shifts
        pos.erase(val);
        return true;
    }

    int getRandom() {
        return items[rand() % items.size()];
    }
};`
        },
        complexity: 'All three operations are O(1) on average (hash map lookups, array append, pop and index). Space is O(n) for the array and the map.',
        say: '“Picking at random needs an array; deleting by value needs a map from value to index. The problem with an array is deleting from the middle, so I swap the element to delete with the last one, update the moved element’s index in the map, and pop the end. No shifting, so it is O(1). The order in the array is meaningless for a set, so the swap loses nothing. I delete the map entry after the update so that removing the last element itself still works.”',
        followups: [
          { q: 'What if duplicates are allowed (a multiset)?', a: 'Map each value to a **set** of its indices instead of one index. Remove: take any index of the value, swap with the last element, and fix both index sets (the moved value loses the last index and gains the freed one). Random picks are then weighted by count, which is what a multiset wants.' },
          { q: 'Why not swap and leave the old map entry?', a: 'It would claim the value is still present at an index that now holds a different value. The map and the array must always describe the same set: that is the invariant.' },
          { q: 'Is `getRandom` really uniform?', a: 'Yes. Every stored value occupies exactly one slot in a gap-free array, and the index is drawn uniformly from the length. Leaving holes (marking deleted slots) would break that, which is why we fill the hole.' },
          { q: 'Why not use a hash set and `random.choice(list(s))`?', a: 'Converting the set to a list is O(n) on every call. Keeping the list permanently, with the map for finding, is the whole idea.' }
        ]
      },
      {
        lc: 355,
        restate: 'Build a small social feed. `postTweet(user, tweetId)` records a tweet. `getNewsFeed(user)` returns the ids of the **10 most recent** tweets posted by that user or by anyone they follow, newest first. `follow(a, b)` makes a follow b, and `unfollow(a, b)` stops it (both are harmless if repeated).',
        examples: '- User 1 posts 5, `getNewsFeed(1)` → `[5]`. User 1 follows 2; user 2 posts 6; the feed → `[6, 5]`. Unfollow 2 → `[5]`.\n- A user with more than 10 tweets in their feed gets only the newest 10.\n- Edge cases: a user who follows themselves; unfollowing someone not followed; a user with no tweets.',
        brute: 'Keep one global list of all tweets as `(user, id)`. For a feed, scan it from the newest end and keep tweets whose author is in the followed set, until you have 10. Simple, but a quiet user following quiet people scans an enormous list, O(all tweets).',
        insight: 'Two small maps do the bookkeeping: user → their own tweets (append-only, so already sorted by time) and user → set of followees. A global counter stamps each tweet so tweets from different users can be compared. A feed is then a **merge of k sorted lists** (the user’s and each followee’s): put each list’s **newest tweet** in a max-heap, pop the newest, and push the next older tweet **of the same user**. After 10 pops you are done; you never touch the rest. Include the user in their own list of sources.',
        code: {
          py: `import heapq
from collections import defaultdict

class Twitter:
    def __init__(self):
        self.clock = 0                           # global time stamp: orders tweets across users
        self.tweets = defaultdict(list)          # user -> [(time, id)], oldest first
        self.follows = defaultdict(set)          # user -> set of followees

    def postTweet(self, userId: int, tweetId: int) -> None:
        self.clock += 1
        self.tweets[userId].append((self.clock, tweetId))

    def getNewsFeed(self, userId: int) -> list:
        heap = []
        for u in self.follows[userId] | {userId}:
            t = self.tweets[u]
            if t:
                heap.append((-t[-1][0], u, len(t) - 1))   # newest tweet of each source
        heapq.heapify(heap)
        out = []
        while heap and len(out) < 10:
            _, u, i = heapq.heappop(heap)
            out.append(self.tweets[u][i][1])
            if i:
                heapq.heappush(heap, (-self.tweets[u][i - 1][0], u, i - 1))   # same user's next older tweet
        return out

    def follow(self, followerId: int, followeeId: int) -> None:
        self.follows[followerId].add(followeeId)

    def unfollow(self, followerId: int, followeeId: int) -> None:
        self.follows[followerId].discard(followeeId)`,
          js: `class Twitter {
  constructor() {
    this.clock = 0;                              // global time stamp: orders tweets across users
    this.tweets = new Map();                     // user -> [[time, id], ...], oldest first
    this.follows = new Map();                    // user -> Set of followees
  }
  postTweet(userId, tweetId) {
    if (!this.tweets.has(userId)) this.tweets.set(userId, []);
    this.tweets.get(userId).push([++this.clock, tweetId]);
  }
  getNewsFeed(userId) {
    const sources = new Set(this.follows.get(userId) || []);
    sources.add(userId);
    const heap = [];                             // max-heap on time, entries [time, user, index]
    const swap = (a, b) => { const t = heap[a]; heap[a] = heap[b]; heap[b] = t; };
    const push = (x) => {
      heap.push(x);
      for (let i = heap.length - 1; i > 0;) {
        const p = (i - 1) >> 1;
        if (heap[p][0] >= heap[i][0]) break;
        swap(p, i); i = p;
      }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let i = 0;;) {
          let m = i; const l = 2 * i + 1, r = l + 1;
          if (l < heap.length && heap[l][0] > heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] > heap[m][0]) m = r;
          if (m === i) break;
          swap(m, i); i = m;
        }
      }
      return top;
    };
    for (const u of sources) {
      const t = this.tweets.get(u);
      if (t && t.length) push([t[t.length - 1][0], u, t.length - 1]);   // newest tweet of each source
    }
    const out = [];
    while (heap.length && out.length < 10) {
      const [, u, i] = pop();
      const t = this.tweets.get(u);
      out.push(t[i][1]);
      if (i) push([t[i - 1][0], u, i - 1]);      // same user's next older tweet
    }
    return out;
  }
  follow(followerId, followeeId) {
    if (!this.follows.has(followerId)) this.follows.set(followerId, new Set());
    this.follows.get(followerId).add(followeeId);
  }
  unfollow(followerId, followeeId) {
    if (this.follows.has(followerId)) this.follows.get(followerId).delete(followeeId);
  }
}`,
          java: `class Twitter {
    private int clock = 0;                                                  // global time stamp: orders tweets across users
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();      // user -> [time, id], oldest first
    private final Map<Integer, Set<Integer>> follows = new HashMap<>();    // user -> followees

    public Twitter() {
    }

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new int[]{++clock, tweetId});
    }

    public List<Integer> getNewsFeed(int userId) {
        Set<Integer> sources = new HashSet<>(follows.getOrDefault(userId, new HashSet<>()));
        sources.add(userId);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[0] - a[0]);   // max-heap on time: [time, user, index]
        for (int u : sources) {
            List<int[]> t = tweets.get(u);
            if (t != null && !t.isEmpty()) heap.add(new int[]{t.get(t.size() - 1)[0], u, t.size() - 1});   // newest of each source
        }
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty() && out.size() < 10) {
            int[] top = heap.poll();
            List<int[]> t = tweets.get(top[1]);
            out.add(t.get(top[2])[1]);
            if (top[2] > 0) heap.add(new int[]{t.get(top[2] - 1)[0], top[1], top[2] - 1});   // same user's next older tweet
        }
        return out;
    }

    public void follow(int followerId, int followeeId) {
        follows.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        if (follows.containsKey(followerId)) follows.get(followerId).remove(followeeId);
    }
}`,
          cpp: `class Twitter {
    int clock = 0;                                           // global time stamp: orders tweets across users
    unordered_map<int, vector<pair<int, int>>> tweets;       // user -> (time, id), oldest first
    unordered_map<int, unordered_set<int>> follows;          // user -> followees
public:
    Twitter() {}

    void postTweet(int userId, int tweetId) {
        tweets[userId].push_back({++clock, tweetId});
    }

    vector<int> getNewsFeed(int userId) {
        unordered_set<int> sources = follows[userId];
        sources.insert(userId);
        priority_queue<array<int, 3>> heap;                  // max-heap on time: {time, user, index}
        for (int u : sources) {
            auto it = tweets.find(u);
            if (it != tweets.end() && !it->second.empty())
                heap.push({it->second.back().first, u, (int)it->second.size() - 1});   // newest of each source
        }
        vector<int> out;
        while (!heap.empty() && out.size() < 10) {
            array<int, 3> top = heap.top();
            heap.pop();
            auto& t = tweets[top[1]];
            out.push_back(t[top[2]].second);
            if (top[2] > 0) heap.push({t[top[2] - 1].first, top[1], top[2] - 1});   // same user's next older tweet
        }
        return out;
    }

    void follow(int followerId, int followeeId) {
        follows[followerId].insert(followeeId);
    }

    void unfollow(int followerId, int followeeId) {
        follows[followerId].erase(followeeId);
    }
};`,
          java: `class Twitter {
    private int clock = 0;                                                  // global time stamp: orders tweets across users
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();      // user -> [time, id], oldest first
    private final Map<Integer, Set<Integer>> follows = new HashMap<>();    // user -> followees

    public Twitter() {
    }

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new int[]{++clock, tweetId});
    }

    public List<Integer> getNewsFeed(int userId) {
        Set<Integer> sources = new HashSet<>(follows.getOrDefault(userId, new HashSet<>()));
        sources.add(userId);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[0] - a[0]);   // max-heap on time: [time, user, index]
        for (int u : sources) {
            List<int[]> t = tweets.get(u);
            if (t != null && !t.isEmpty()) heap.add(new int[]{t.get(t.size() - 1)[0], u, t.size() - 1});   // newest of each source
        }
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty() && out.size() < 10) {
            int[] top = heap.poll();
            List<int[]> t = tweets.get(top[1]);
            out.add(t.get(top[2])[1]);
            if (top[2] > 0) heap.add(new int[]{t.get(top[2] - 1)[0], top[1], top[2] - 1});   // same user's next older tweet
        }
        return out;
    }

    public void follow(int followerId, int followeeId) {
        follows.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        if (follows.containsKey(followerId)) follows.get(followerId).remove(followeeId);
    }
}`,
          cpp: `class Twitter {
    int clock = 0;                                           // global time stamp: orders tweets across users
    unordered_map<int, vector<pair<int, int>>> tweets;       // user -> (time, id), oldest first
    unordered_map<int, unordered_set<int>> follows;          // user -> followees
public:
    Twitter() {}

    void postTweet(int userId, int tweetId) {
        tweets[userId].push_back({++clock, tweetId});
    }

    vector<int> getNewsFeed(int userId) {
        unordered_set<int> sources = follows[userId];
        sources.insert(userId);
        priority_queue<array<int, 3>> heap;                  // max-heap on time: {time, user, index}
        for (int u : sources) {
            auto it = tweets.find(u);
            if (it != tweets.end() && !it->second.empty())
                heap.push({it->second.back().first, u, (int)it->second.size() - 1});   // newest of each source
        }
        vector<int> out;
        while (!heap.empty() && out.size() < 10) {
            array<int, 3> top = heap.top();
            heap.pop();
            auto& t = tweets[top[1]];
            out.push_back(t[top[2]].second);
            if (top[2] > 0) heap.push({t[top[2] - 1].first, top[1], top[2] - 1});   // same user's next older tweet
        }
        return out;
    }

    void follow(int followerId, int followeeId) {
        follows[followerId].insert(followeeId);
    }

    void unfollow(int followerId, int followeeId) {
        follows[followerId].erase(followeeId);
    }
};`
        },
        complexity: '`postTweet`, `follow` and `unfollow` are O(1). `getNewsFeed` builds a heap of f sources in O(f) and does at most 10 pops and pushes of O(log f) each: O(f + 10 log f). Space is O(total tweets + follow edges).',
        say: '“I store each user’s tweets in an append-only list with a global time stamp, and each user’s followees in a set, so post, follow and unfollow are O(1). The feed is a merge of already-sorted lists, so I seed a max-heap with the newest tweet of the user and of each followee, pop the newest, and push that same user’s next older tweet, ten times at most. That costs O(f) to build and O(10 log f) to drain, and never touches old tweets.”',
        followups: [
          { q: 'What if users have millions of followees?', a: 'Reading becomes the bottleneck. Real systems switch to **fan-out on write**: push each new tweet into every follower’s precomputed feed list, trading write cost for O(1) reads. Celebrity accounts are usually handled by merging at read time instead.' },
          { q: 'Why a set for followees?', a: 'Follow and unfollow become O(1) and repeats do nothing. A list would allow duplicates and make unfollow O(n).' },
          { q: 'Why a global counter, not the real clock?', a: 'It is strictly increasing, so there are no ties between tweets posted in the same millisecond, and it needs no clock call. Any monotonic counter works.' },
          { q: 'Why not collect all tweets and sort?', a: 'That is O(total tweets log total) per feed. The merge only reads about 10 + f entries.' }
        ]
      },
      {
        lc: 460,
        restate: 'Build a cache with a fixed capacity. `get(key)` returns the value or -1. `put(key, value)` stores the pair, or updates it. When storing a **new** key into a full cache, first remove the key with the **lowest use count** (a use is any `get` or `put` of that key); if several keys tie, remove the one used **least recently**. Both methods must be O(1). A capacity of 0 stores nothing.',
        examples: '- Capacity 2: `put(1,1)`, `put(2,2)`, `get(1)` → `1`, `put(3,3)` (key 2 has been used once, key 1 twice, so 2 goes), `get(2)` → `-1`, `get(3)` → `3`, `put(4,4)` (keys 1 and 3 both have 2 uses; key 1 is older, so it goes), `get(1)` → `-1`, `get(3)` → `3`, `get(4)` → `4`.\n- Capacity 0: `put` does nothing, `get` returns -1.\n- Updating an existing key counts as a use and never evicts.',
        brute: 'Store a count and a last-used time per key. On eviction scan all keys for the smallest `(count, time)`: O(n) per put. Or keep a heap keyed by `(count, time)`: O(log n), and updating an arbitrary key’s priority is awkward. The statement wants O(1).',
        insight: 'LRU needs one order; LFU needs two **nested** orders: by count, then by recency inside the same count. Keep **`val[key]`** and **`cnt[key]`**, and a map **`buckets[count]`** whose value is an insertion-ordered set of the keys with that count (oldest first). A use of a key with count `c` removes it from bucket `c` and appends it to bucket `c + 1`. Eviction needs the smallest non-empty count, so also keep **`low`**. It only changes in two ways, both O(1): after a use, if bucket `low` has just emptied, `low` is `low + 1` (the key itself moved there); after inserting a new key, `low = 1`. Evict by popping the **oldest** key of bucket `low`.',
        code: {
          py: `from collections import defaultdict, OrderedDict

class LFUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.val = {}                            # key -> value
        self.cnt = {}                            # key -> use count
        self.buckets = defaultdict(OrderedDict)  # count -> keys with that count, oldest first
        self.low = 0                             # smallest count that has any key

    def _use(self, key):
        c = self.cnt[key]
        del self.buckets[c][key]
        if not self.buckets[c]:
            del self.buckets[c]
            if self.low == c:
                self.low = c + 1                 # its only key just moved up one bucket
        self.cnt[key] = c + 1
        self.buckets[c + 1][key] = None          # newest in its new bucket

    def get(self, key: int) -> int:
        if key not in self.val:
            return -1
        self._use(key)
        return self.val[key]

    def put(self, key: int, value: int) -> None:
        if self.cap == 0:
            return
        if key in self.val:
            self.val[key] = value
            self._use(key)
            return
        if len(self.val) == self.cap:
            old, _ = self.buckets[self.low].popitem(last=False)   # oldest key of the lowest count
            if not self.buckets[self.low]:
                del self.buckets[self.low]
            del self.val[old]
            del self.cnt[old]
        self.val[key] = value
        self.cnt[key] = 1
        self.buckets[1][key] = None
        self.low = 1                             # a brand-new key has the lowest possible count`,
          js: `class LFUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.val = new Map();                        // key -> value
    this.cnt = new Map();                        // key -> use count
    this.buckets = new Map();                    // count -> Map of keys (insertion order = oldest first)
    this.low = 0;                                // smallest count that has any key
  }
  use(key) {
    const c = this.cnt.get(key);
    const b = this.buckets.get(c);
    b.delete(key);
    if (b.size === 0) {
      this.buckets.delete(c);
      if (this.low === c) this.low = c + 1;      // its only key just moved up one bucket
    }
    this.cnt.set(key, c + 1);
    if (!this.buckets.has(c + 1)) this.buckets.set(c + 1, new Map());
    this.buckets.get(c + 1).set(key, true);      // newest in its new bucket
  }
  get(key) {
    if (!this.val.has(key)) return -1;
    this.use(key);
    return this.val.get(key);
  }
  put(key, value) {
    if (this.cap === 0) return;
    if (this.val.has(key)) {
      this.val.set(key, value);
      this.use(key);
      return;
    }
    if (this.val.size === this.cap) {
      const b = this.buckets.get(this.low);
      const old = b.keys().next().value;         // oldest key of the lowest count
      b.delete(old);
      if (b.size === 0) this.buckets.delete(this.low);
      this.val.delete(old);
      this.cnt.delete(old);
    }
    this.val.set(key, value);
    this.cnt.set(key, 1);
    if (!this.buckets.has(1)) this.buckets.set(1, new Map());
    this.buckets.get(1).set(key, true);
    this.low = 1;                                // a brand-new key has the lowest possible count
  }
}`,
          java: `class LFUCache {
    private final int cap;
    private final Map<Integer, Integer> val = new HashMap<>();                     // key -> value
    private final Map<Integer, Integer> cnt = new HashMap<>();                     // key -> use count
    private final Map<Integer, LinkedHashSet<Integer>> buckets = new HashMap<>();  // count -> keys, oldest first
    private int low = 0;                                                           // smallest count that has any key

    public LFUCache(int capacity) {
        cap = capacity;
    }

    private void use(int key) {
        int c = cnt.get(key);
        LinkedHashSet<Integer> b = buckets.get(c);
        b.remove(key);
        if (b.isEmpty()) {
            buckets.remove(c);
            if (low == c) low = c + 1;           // its only key just moved up one bucket
        }
        cnt.put(key, c + 1);
        buckets.computeIfAbsent(c + 1, x -> new LinkedHashSet<>()).add(key);   // newest in its new bucket
    }

    public int get(int key) {
        if (!val.containsKey(key)) return -1;
        use(key);
        return val.get(key);
    }

    public void put(int key, int value) {
        if (cap == 0) return;
        if (val.containsKey(key)) {
            val.put(key, value);
            use(key);
            return;
        }
        if (val.size() == cap) {
            LinkedHashSet<Integer> b = buckets.get(low);
            int old = b.iterator().next();       // oldest key of the lowest count
            b.remove(old);
            if (b.isEmpty()) buckets.remove(low);
            val.remove(old);
            cnt.remove(old);
        }
        val.put(key, value);
        cnt.put(key, 1);
        buckets.computeIfAbsent(1, x -> new LinkedHashSet<>()).add(key);
        low = 1;                                 // a brand-new key has the lowest possible count
    }
}`,
          cpp: `class LFUCache {
    int cap, low = 0;                            // low: smallest count that has any key
    unordered_map<int, int> val, cnt;            // key -> value, key -> use count
    unordered_map<int, list<int>> buckets;       // count -> keys, oldest at the front
    unordered_map<int, list<int>::iterator> where;   // key -> its place inside its bucket

    void use(int key) {
        int c = cnt[key];
        buckets[c].erase(where[key]);
        if (buckets[c].empty()) {
            buckets.erase(c);
            if (low == c) low = c + 1;           // its only key just moved up one bucket
        }
        cnt[key] = c + 1;
        buckets[c + 1].push_back(key);           // newest in its new bucket
        where[key] = prev(buckets[c + 1].end());
    }

public:
    LFUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        if (!val.count(key)) return -1;
        use(key);
        return val[key];
    }

    void put(int key, int value) {
        if (cap == 0) return;
        if (val.count(key)) {
            val[key] = value;
            use(key);
            return;
        }
        if ((int)val.size() == cap) {
            int old = buckets[low].front();      // oldest key of the lowest count
            buckets[low].pop_front();
            if (buckets[low].empty()) buckets.erase(low);
            val.erase(old);
            cnt.erase(old);
            where.erase(old);
        }
        val[key] = value;
        cnt[key] = 1;
        buckets[1].push_back(key);
        where[key] = prev(buckets[1].end());
        low = 1;                                 // a brand-new key has the lowest possible count
    }
};`
        },
        complexity: 'Every operation is O(1) on average: a few hash lookups, and insertion-ordered sets give O(1) removal and O(1) oldest-key access. Space is O(capacity).',
        say: '“LFU is LRU with a second dimension. I keep value and count per key, a map from count to the keys with that count in recency order, and `low`, the smallest count in use. A use moves the key from bucket c to c + 1, and if that emptied bucket `low`, `low` becomes c + 1. A new key goes into bucket 1 and sets `low` to 1. When full, I evict the oldest key in bucket `low`, which is least frequent and, among those, least recent. All O(1), because each bucket is an ordered hash set.”',
        followups: [
          { q: 'Why can `low` be updated without a search?', a: 'It only decreases when a new key arrives (to 1), and it only increases when a use empties the lowest bucket, in which case the key just moved to the very next count. No gaps can appear, so `low + 1` always holds a key.' },
          { q: 'What is the difference from LRU, concretely?', a: 'LRU keeps one list ordered by recency. LFU needs recency **inside** each count, hence one ordered list per count, plus the pointer to the lowest non-empty count.' },
          { q: 'What about a key that was hot long ago and is never used now?', a: 'Pure LFU keeps it forever because its count is high (cache pollution). Real systems decay or age the counts (for example Redis’s LFU halves counters over time).' },
          { q: 'Why `put` on an existing key must not evict?', a: 'The key count does not change, so the cache is not growing. Check for the key first; only a new key can need room.' }
        ]
      }
    ],

    practice: [
      { lc: 146,
        hints: ['Write down what each operation needs: find by key, change the recency order, drop the oldest. No single structure does all three in O(1).', 'A hash map finds a node by key; a **doubly** linked list can unlink and re-insert a node you already hold in O(1). Make the map’s values the nodes.', 'Add a dummy head and tail so there are no edge cases. Every use is unlink then push-front. On overflow remove the node before the tail **and** its key from the map (so the node needs to store its key).'],
        starter: { py: 'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass', js: 'class LRUCache {\n  constructor(capacity) {\n  }\n  get(key) {\n  }\n  put(key, value) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]], out: [null, null, null, 1, null, -1, null, -1, 3, 4] },
          { ops: ['LRUCache', 'put', 'put', 'put', 'get', 'put', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1, 10], [1], [3, 3], [2], [1]], out: [null, null, null, null, 10, null, -1, 10] },
          { ops: ['LRUCache', 'get', 'put', 'put', 'get', 'get'], args: [[1], [5], [5, 50], [6, 60], [5], [6]], out: [null, -1, null, null, -1, 60] },
          { ops: ['LRUCache', 'put', 'put', 'put', 'get', 'get', 'put', 'get', 'get', 'get'], args: [[3], [1, 1], [2, 2], [3, 3], [1], [2], [4, 4], [3], [1], [4]], out: [null, null, null, null, 1, 2, null, -1, 1, 4] }] } },

      { lc: 355,
        hints: ['Each user needs their own tweets and a set of followees. A global counter gives every tweet a time stamp so different users’ tweets can be ordered.', 'A user’s own tweet list is already in time order, so the feed is a merge of several sorted lists, and you only want the newest 10.', 'Put the newest tweet of each source (the user included) in a max-heap on time. Pop the newest, then push the **same user’s** next older tweet. Stop after 10.'],
        starter: { py: 'class Twitter:\n    def __init__(self):\n        pass\n\n    def postTweet(self, userId: int, tweetId: int) -> None:\n        pass\n\n    def getNewsFeed(self, userId: int) -> list:\n        pass\n\n    def follow(self, followerId: int, followeeId: int) -> None:\n        pass\n\n    def unfollow(self, followerId: int, followeeId: int) -> None:\n        pass', js: 'class Twitter {\n  constructor() {\n  }\n  postTweet(userId, tweetId) {\n  }\n  getNewsFeed(userId) {\n  }\n  follow(followerId, followeeId) {\n  }\n  unfollow(followerId, followeeId) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['Twitter', 'postTweet', 'getNewsFeed', 'follow', 'postTweet', 'getNewsFeed', 'unfollow', 'getNewsFeed'], args: [[], [1, 5], [1], [1, 2], [2, 6], [1], [1, 2], [1]], out: [null, null, [5], null, null, [6, 5], null, [5]] },
          { ops: ['Twitter', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'getNewsFeed'], args: [[], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1]], out: [null, null, null, null, null, null, null, null, null, null, null, null, null, [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]] },
          { ops: ['Twitter', 'follow', 'follow', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'postTweet', 'getNewsFeed', 'getNewsFeed', 'unfollow', 'unfollow', 'getNewsFeed'], args: [[], [1, 2], [1, 3], [2, 10], [3, 20], [1, 30], [2, 40], [3, 50], [1], [2], [1, 3], [1, 9], [1]], out: [null, null, null, null, null, null, null, null, [50, 40, 30, 20, 10], [40, 10], null, null, [40, 30, 10]] },
          { ops: ['Twitter', 'getNewsFeed', 'follow', 'getNewsFeed'], args: [[], [7], [7, 8], [7]], out: [null, [], null, []] }] } },

      { lc: 380,
        hints: ['Random pick needs indexed access (an array). Delete-by-value needs a fast find (a map from value to index).', 'Deleting from the middle of an array shifts everything: avoid it. Overwrite the deleted slot with the **last** element instead.', 'After copying the last element into slot i, update that element’s index in the map, pop the array, and delete the removed value from the map. It must still work when the removed value is the last one.'],
        starter: { py: 'class RandomizedSet:\n    def __init__(self):\n        pass\n\n    def insert(self, val: int) -> bool:\n        pass\n\n    def remove(self, val: int) -> bool:\n        pass\n\n    def getRandom(self) -> int:\n        pass', js: 'class RandomizedSet {\n  constructor() {\n  }\n  insert(val) {\n  }\n  remove(val) {\n  }\n  getRandom() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['RandomizedSet', 'insert', 'remove', 'insert', 'remove', 'getRandom', 'insert'], args: [[], [1], [2], [2], [1], [], [2]], out: [null, true, false, true, true, 2, false] },
          { ops: ['RandomizedSet', 'insert', 'insert', 'insert', 'remove', 'remove', 'getRandom', 'remove', 'insert'], args: [[], [5], [6], [7], [5], [7], [], [6], [5]], out: [null, true, true, true, true, true, 6, true, true] },
          { ops: ['RandomizedSet', 'insert', 'remove', 'remove', 'insert', 'getRandom'], args: [[], [0], [0], [0], [0], []], out: [null, true, true, false, true, 0] }] } },

      { lc: 460,
        hints: ['It is LRU with a second ordering: first by how many times a key was used, then by how long ago inside the same count.', 'Keep value and count per key, a map from count to the keys with that count in insertion order (oldest first), and the smallest count currently in use.', 'A use moves the key from bucket c to c + 1 (and bumps the minimum if it emptied the minimum bucket). A new key goes to bucket 1 and resets the minimum to 1. Evict the oldest key in the minimum bucket. Handle capacity 0.'],
        starter: { py: 'class LFUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass', js: 'class LFUCache {\n  constructor(capacity) {\n  }\n  get(key) {\n  }\n  put(key, value) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['LFUCache', 'put', 'put', 'get', 'put', 'get', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]], out: [null, null, null, 1, null, -1, 3, null, -1, 3, 4] },
          { ops: ['LFUCache', 'put', 'get'], args: [[0], [0, 0], [0]], out: [null, null, -1] },
          { ops: ['LFUCache', 'put', 'put', 'get', 'get'], args: [[1], [1, 1], [2, 2], [1], [2]], out: [null, null, null, -1, 2] },
          { ops: ['LFUCache', 'put', 'put', 'put', 'get', 'get', 'put', 'get', 'get', 'get'], args: [[2], [1, 1], [2, 2], [1, 5], [1], [2], [3, 3], [1], [2], [3]], out: [null, null, null, null, 5, 2, null, 5, -1, 3] }] } },

      { lc: 284,
        hints: ['`peek` must return the next value **without** consuming it, but the wrapped iterator can only move forward.', 'So pull one value ahead of time and keep it in a field: it is the next value to hand out.', '`next` returns the buffered value and refills the buffer from the underlying iterator; `hasNext` asks whether the buffer holds a real value (use a sentinel, or the iterator’s own “done” flag, since `None` or `undefined` can be a legal value).'],
        solution: { explain: 'Hold one look-ahead value. The constructor pulls it; `peek` returns it; `next` returns it and pulls the following one; `hasNext` checks that the buffer is not the “finished” marker. Using a private sentinel (or the iterator result’s `done` flag in JavaScript) is safer than `None`/`null`, which could be real data. O(1) time per call, O(1) extra space. The tests pass a plain array; `iter(...)` / `[Symbol.iterator]()` make the same code work for any iterator.', code: {
          py: `class PeekingIterator:
    _END = object()                              # sentinel: cannot clash with real data

    def __init__(self, iterator):
        self.it = iter(iterator)
        self.buf = next(self.it, PeekingIterator._END)   # the look-ahead value

    def peek(self):
        return self.buf

    def next(self):
        v = self.buf
        self.buf = next(self.it, PeekingIterator._END)   # refill right away
        return v

    def hasNext(self):
        return self.buf is not PeekingIterator._END`,
          js: `class PeekingIterator {
  constructor(iterator) {
    this.it = iterator[Symbol.iterator]();
    this.cur = this.it.next();                   // { value, done }: the look-ahead
  }
  peek() {
    return this.cur.value;
  }
  next() {
    const v = this.cur.value;
    this.cur = this.it.next();                   // refill right away
    return v;
  }
  hasNext() {
    return !this.cur.done;
  }
}` } },
        starter: { py: 'class PeekingIterator:\n    def __init__(self, iterator):\n        pass\n\n    def peek(self):\n        pass\n\n    def next(self):\n        pass\n\n    def hasNext(self):\n        pass', js: 'class PeekingIterator {\n  constructor(iterator) {\n  }\n  peek() {\n  }\n  next() {\n  }\n  hasNext() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['PeekingIterator', 'next', 'peek', 'next', 'next', 'hasNext'], args: [[[1, 2, 3]], [], [], [], [], []], out: [null, 1, 2, 2, 3, false] },
          { ops: ['PeekingIterator', 'peek', 'peek', 'next', 'hasNext', 'next', 'hasNext'], args: [[[5, 6]], [], [], [], [], [], []], out: [null, 5, 5, 5, true, 6, false] },
          { ops: ['PeekingIterator', 'hasNext'], args: [[[]], []], out: [null, false] },
          { ops: ['PeekingIterator', 'hasNext', 'next', 'hasNext'], args: [[[0]], [], [], []], out: [null, true, 0, false] }] } }
    ],

    mistakes: [
      '**Forgetting to delete the evicted key from the map.** You unlink the tail node from the list but leave `map[key]` behind. The next `get` of that key “finds” a node that is no longer in the list, and the map grows past capacity. Two structures, two removals, every time. This is why the node stores its key.',
      '**A singly linked list, or a list you search.** Unlinking a node needs its `prev`; without it you scan from the head, O(n). The map must hold **nodes** (not keys or values), so one lookup lands on the exact node to move.',
      '**Not treating `put` of an existing key as a use.** It must update the value **and** move the node to the front. And an update never grows the cache, so it must not trigger an eviction. Check for the key first.',
      '**Skipping sentinels and then mishandling the ends.** Removing the only node, the first node, or the last node each breaks a different pointer. Add dummy head and tail nodes and the code has no cases.',
      '**Order of operations in swap-with-last delete.** Update the moved element’s index, **then** pop and delete the removed value’s entry. If you delete the map entry first and the removed value is the last element, you then re-create it. Test removing the last element explicitly.',
      '**Leaving holes in the random-pick array.** Marking a slot as deleted instead of filling it breaks uniform randomness and makes `getRandom` loop. Always keep the array gap-free.',
      '**LFU bookkeeping slips.** A new key must reset `low` to 1; a use must bump `low` only if it emptied the lowest bucket; evicting must pick the **oldest** key within the lowest bucket (ties are by recency). Also: capacity 0 must be handled up front, and an update of an existing key must not evict.',
      '**Using `None`/`null`/`undefined` as the “nothing left” marker in an iterator.** If the data may contain that value, `hasNext` lies. Use a private sentinel or the iterator’s own done flag.',
      '**Writing code before the interface is clear.** Ask what a miss returns, what duplicates do, and the speed target of each method. Design answers that skip this often solve the wrong problem fast.',
      '**Language gotchas.** *Python:* `list.pop(0)` and `list.insert(0, x)` are O(n); use `deque`, `OrderedDict` or your own list. *JavaScript:* `Map` keeps insertion order, but a plain `{}` sorts integer-like keys first and cannot hold object keys. *Java:* `items.remove(int)` removes by **index**, `remove(Object)` by value (watch autoboxing on `List<Integer>`); `HashMap<Integer, Node>` returns `null` for a miss. *C++:* `map[key]` silently **inserts** a default value on a miss, so use `find` or `count` for lookups; free evicted nodes with `delete`.'
    ],

    quiz: [
      { kind: 'concept', q: 'Why does an O(1) LRU cache use a **doubly** linked list rather than a singly linked one?',
        choices: ['Unlinking a node in O(1) requires changing its previous node’s `next`, so each node needs a `prev` pointer', 'A doubly linked list uses less memory', 'The hash map cannot point at a singly linked node', 'It lets the cache be read in both directions'], answer: 0,
        explain: 'To remove a node you must make its predecessor skip it. With a singly linked list you only reach the predecessor by scanning from the head: O(n). The `prev` pointer gives it directly.' },
      { kind: 'complexity', q: 'An LRU cache stores its keys in a Python list in recency order (newest at the front) plus a dict of values. What does `get` cost?',
        choices: ['O(n), because finding and moving the key in the list scans and shifts', 'O(1)', 'O(log n)', 'O(n log n)'], answer: 0,
        explain: 'The dict finds the value in O(1) but the order list needs `remove(key)` (a scan) and `insert(0, key)` (a shift): both O(n). The linked list plus node-valued map avoids both.' },
      { kind: 'concept', q: 'In the LRU eviction step, which statement is correct?',
        choices: ['Remove the node before the tail sentinel from the list **and** delete its key from the map', 'Remove the node after the head sentinel from the list only', 'Remove the node before the tail sentinel from the list only; the map cleans itself', 'Clear the map and rebuild it from the list'], answer: 0,
        explain: 'The least recently used node sits just before the tail sentinel. The map still holds its key, so it must be deleted explicitly, which is why nodes store their own key.' },
      { kind: 'pattern', q: 'You must support `insert`, `remove` and `getRandom` on a set of integers, all in O(1) average. Which pair of structures works?',
        choices: ['A dynamic array plus a map from value to array index', 'A sorted array plus binary search', 'A hash set alone', 'A linked list plus a hash set'], answer: 0,
        explain: 'The array gives O(1) random indexing; the map finds a value’s index in O(1); swapping with the last element deletes without shifting. A hash set alone has no random access; a sorted array and a linked list both make some operation O(n) or O(log n).' },
      { kind: 'bug', q: 'This `remove` for the array-plus-map set sometimes leaves a stale entry. What is wrong?',
        code: `def remove(self, val):
    if val not in self.pos:
        return False
    i = self.pos.pop(val)
    last = self.items[-1]
    self.items[i] = last
    self.pos[last] = i
    self.items.pop()
    return True`,
        choices: ['When `val` is the last element, `pos[last] = i` re-inserts the value that was just removed', 'It should pop the array before the swap', 'The swap should copy `val` into the last slot', 'It must rebuild `pos` from scratch'], answer: 0,
        explain: 'If `val` is the last element then `last == val`: popping its entry and then setting `pos[last]` puts it back, pointing at a slot that no longer exists. Update the moved element first and delete the removed value’s entry afterwards.' },
      { kind: 'complexity', q: 'Design Twitter’s `getNewsFeed` returns the 10 newest tweets among f followed users, each with a time-ordered tweet list, using a heap. What is the cost?',
        choices: ['O(f + 10 log f)', 'O(total number of tweets)', 'O(f · 10)', 'O(f²)'], answer: 0,
        explain: 'Building the heap with each user’s newest tweet is O(f); each of at most 10 steps pops one entry and pushes the next older tweet of the same user, O(log f) each. Old tweets are never touched.' },
      { kind: 'concept', q: 'What is the invariant of an LRU cache built from a map and a list?',
        choices: ['The map and the list contain exactly the same keys, and the list is ordered by recency', 'The list is sorted by key', 'The map is sorted by recency', 'The list contains more nodes than the capacity'], answer: 0,
        explain: 'Every operation must leave both structures describing the same set of keys, with the list order encoding recency. Most bugs are a step that updates only one of them.' },
      { kind: 'pattern', q: 'Which statements fit an **LFU** (least frequently used) cache design? Pick every one that applies.',
        choices: ['It keeps a use count per key', 'It needs the oldest key among those with the lowest count', 'A single recency list is enough', 'It tracks the smallest count currently in use'], answer: [0, 1, 3],
        explain: 'LFU orders by count and breaks ties by recency, so it needs counts, per-count recency order, and the lowest count. One recency list (plain LRU) cannot tell frequency.' },
      { kind: 'concept', q: 'A wrapped iterator needs a `peek()` that does not consume. What state is the minimum that makes every method O(1)?',
        choices: ['One buffered look-ahead value (plus a way to tell “none left”)', 'A copy of the whole remaining sequence', 'A counter of how many values were returned', 'Nothing: call `next()` and put the value back'], answer: 0,
        explain: 'The source cannot rewind, so pull one value early and keep it. `peek` returns it, `next` returns it and refills, `hasNext` checks that the buffer is real.' }
    ],

    flashcards: [
      { id: 'design-recipe', front: 'Design-class recipe in one line.', back: 'List the operations and their speed targets; pick the cheap structure for each; glue two structures so every operation is cheap in at least one; state the invariant tying them; walk a tiny example.' },
      { id: 'lru-pair', front: 'LRU cache: which structures, and why each?', back: 'Hash map key to node (O(1) find). Doubly linked list in recency order (O(1) move to front and drop the tail). Map values are the nodes themselves.' },
      { id: 'lru-sentinel', front: 'Why sentinel nodes in a linked-list design?', back: 'A dummy head and tail never leave the list, so every real node has a real prev and next. Unlink and insert are the same lines for first, last, middle and empty cases.' },
      { id: 'lru-key-in-node', front: 'LRU: why does a node store its key?', back: 'On eviction you reach the tail-side node and must delete its key from the map. Without the key in the node that needs an O(n) search.' },
      { id: 'lru-use', front: 'LRU: what counts as a use?', back: 'A get that hits, and a put (new or update). A miss changes nothing. A put on an existing key updates the value, moves the node to the front, and never evicts.' },
      { id: 'lru-evict', front: 'LRU eviction steps.', back: 'After inserting, if size > capacity: take the node before tail, unlink it, delete its key from the map. Both structures, every time.' },
      { id: 'swap-with-last', front: 'O(1) delete from an array when order does not matter.', back: 'Copy the last element into the hole, update the moved element’s index in the map, pop the end. Works even if you delete the last element, if the map entry is removed after the update.' },
      { id: 'random-set', front: 'Insert, delete, getRandom in O(1): the structure.', back: 'Array of values (random by index) plus a map value to index; swap-with-last for delete; keep the array gap-free so the pick is uniform.' },
      { id: 'lfu-design', front: 'LFU cache in O(1): the three pieces.', back: 'key to value and count; count to keys of that count in recency order (an ordered hash set); and low, the smallest count in use. New key: low = 1. Evict the oldest key of bucket low.' },
      { id: 'lfu-low', front: 'LFU: when does `low` change?', back: 'To 1 when a new key is added. To c + 1 when a use empties bucket c and c was low. Never needs a search.' },
      { id: 'twitter-merge', front: 'Design Twitter feed: the idea.', back: 'Per-user append-only tweet lists with a global time stamp; a feed is a k-way merge of the user and followees: max-heap of each list’s newest, pop, push that user’s next older. O(f + 10 log f).' },
      { id: 'iterator-state', front: 'Iterator design: how to choose the state?', back: 'The minimum remembered between calls so every method is O(1): one look-ahead for peek; row and column plus eager skipping of empty rows for flatten. Keep hasNext side-effect free.' },
      { id: 'library-lru', front: 'Library shortcuts for LRU?', back: 'Python OrderedDict (move_to_end, popitem(last=False)), Java LinkedHashMap (access order, removeEldestEntry), JS Map (delete and re-set). Ask first; know what they do underneath.' },
      { id: 'interface-first', front: 'Before coding a design question, ask:', back: 'Exact methods and return values (miss, duplicate)? Speed targets per method? Sizes and edge cases (capacity 0 or 1)? Single-threaded? Then write the method table.' }
    ],

    deeper: [
      { title: 'Design problems (LeetCode tag)', url: 'https://leetcode.com/tag/design/', time: 'reference', note: 'LeetCode’s list of design-tagged problems. Do 146, 380 and 355 first, then 460 and the iterator problems.' },
      { title: 'Cache replacement policies (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Cache_replacement_policies', time: '15 min', note: 'LRU, LFU and the many variants (ARC, CLOCK, random), with when each wins.' },
      { title: 'Python: collections.OrderedDict', url: 'https://docs.python.org/3/library/collections.html#collections.OrderedDict', time: '10 min', note: 'The built-in hash map plus doubly linked list; its docs show an LRU built from it.' },
      { title: 'Redis: key eviction', url: 'https://redis.io/docs/latest/develop/reference/eviction/', time: '10 min', note: 'How a real system approximates LRU and LFU without a list, by sampling and decaying counters.' }
    ],

    detective: [
      { id: 'stencil-rack', decoys: ['linked-lists', 'queues', 'hashing-internals'],
        statement: 'A sign shop keeps its cutting stencils in a wall rack that holds forty. When a customer asks for a design, the clerk must tell instantly whether its stencil is on the rack and hand it over. Every time a stencil is used, it goes back in the **front** slot, and when a brand-new design is cut and the rack is already full, the stencil that has been sitting untouched for the longest is thrown out. The clerk wants each of these steps to take the same short time whether the rack holds ten or ten thousand stencils.',
        why: 'Two needs pull in different directions: finding an item **by name** instantly, and maintaining an **order of last use** where you can move any item to the front and drop the oldest without scanning. One structure serves each need, and they must be kept in step, with each entry pointing at its place in the order.' },
      { id: 'prize-hat', decoys: ['arrays-hashing', 'heaps', 'hashing-internals'],
        statement: 'A radio station keeps every listener’s name in a prize pool. Names are added when someone enters (a repeat entry is ignored) and removed when someone wins or withdraws, and between those, the host presses a button that must name one pool member, each equally likely. The pool can have a million names and people leave from all over the pool, yet the button and the add and withdraw actions must all stay quick: shifting a million names every time someone withdraws is not acceptable.',
        why: 'Equal-chance picking needs items you can reach by position, while withdrawing a specific person needs to find them fast, and filling the gap they leave must not move everyone. Two views of the same members, one by position and one by name, with a cheap trick for closing the gap.' },
      { id: 'notice-board', decoys: ['heaps', 'sorting', 'arrays-hashing'],
        statement: 'A neighbourhood app lets residents pin notes and follow other residents. Opening the app shows the ten newest notes from the resident themselves and everyone they follow, newest first. Each resident’s own notes are stored in the order they were pinned, some residents follow hundreds of people, and the app must not dig through all the notes of all those people just to show ten. Following and unfollowing must also be instant.',
        why: 'Every source is already in time order, and only the first few of the combined stream are wanted, so it is a matter of repeatedly taking the newest among the current front of several ordered lists. Cheap follow bookkeeping plus a small structure that always yields the newest front item.' }
    ]
  };
  topic.worked[0].code = topic.template.code;   // 146 is the lesson template itself
  (OR.topics = OR.topics || []).push(topic);
})();
