/* Offer Ready: Queues and deques lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in
   (class-design problems are checked in py/js by the tool; their Java and C++ were compiled by hand). */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'queues',

    hook: 'A queue is fairness made into a data structure: the item that has waited longest goes next. It looks too simple to matter, but it is the engine inside breadth-first search, which sits under shortest paths, level-order traversal, flood spread and half of the grid problems you will meet. Interviewers also love it for design questions (a circular queue, a queue from two stacks, a “calls in the last 3 seconds” counter) because the idea is small and the edge cases are not. The deque, a queue you can use at both ends, is the quiet tool behind the fastest sliding-window maximum.',

    cues: [
      'Things are served in the **order they arrived**: first come, first served, a buffer, a task line, “process in turn”.',
      'You explore **outward in rings**: the closest things first, then the next closest. That is breadth-first search, and its “frontier” is a queue.',
      'You want the **fewest steps** in an unweighted maze, grid or graph, or how many “rounds” something takes to spread.',
      'Old items must **expire from the front** while new ones arrive at the back: events in the last N seconds, a moving window of recent values.',
      'Items go to the **back of the line** when they are not done yet: round-robin turns, “pass it along”, a circle that is eliminated one by one.',
      'You need the front **and** the back of a sequence in O(1), or the max of a moving window: that is a deque.'
    ],

    intuition: [
      'Think of the line at a coffee counter. People join at the **back** and are served from the **front**. Nobody jumps the line and nobody leaves from the middle. The one who has waited longest goes next: **first in, first out**, or FIFO. A stack gives you the newest item; a queue gives you the oldest.',
      'The toolkit is two O(1) operations: `enqueue` (add at the back) and `dequeue` (remove from the front), plus `front` to look without removing. The catch is that a plain array is bad at this. Removing the first element of an array has to slide every other element one place left, which costs O(n). So a queue is built in one of two ways: a **linked** structure, or a **circular buffer**.',
      'A **circular buffer** is a fixed array plus two numbers: `head`, the index of the oldest item, and `size`, how many are stored. The next free slot is `(head + size) % capacity`. Enqueue writes there. Dequeue reads `buf[head]` and moves `head` forward by one, wrapping to 0 past the end. Nothing is ever shifted; the old slot is just ignored until it is reused. The visualizer above runs exactly this.',
      'A **deque** (double-ended queue, said “deck”) is the same buffer with both ends open: add or remove at the front **and** the back, all O(1). A stack and a queue are two restricted deques. Real libraries ship one container for all three jobs: Python `collections.deque`, Java `ArrayDeque`, C++ `std::deque`. JavaScript has no built-in queue, so you use an array with a moving head index.',
      'The most important use is **breadth-first search**:\n\n1. Put the start in the queue and mark it seen.\n2. Take the front item, and put each unseen neighbour at the back (marking it seen as you add it).\n3. Repeat until the queue is empty.\n\nBecause the queue is first-in-first-out, everything at distance 1 is served before anything at distance 2, so the first time you reach a node is by a shortest route. To count rings, freeze `len(queue)` at the start of each round and process exactly that many items.'
    ].join('\n\n'),

    viz: 'deque',

    template: {
      title: 'Queue as a circular buffer: head and size, never shift',
      note: 'Keep `head` (oldest) and `size`, and derive the tail as `(head + size) % capacity`. Storing `size` rather than a separate `tail` removes the classic full-versus-empty confusion: when `head` equals `tail`, the queue could be either, but `size` tells you which. In an interview you will almost always use the language’s deque instead (see the language section below); build the ring yourself when the problem says “design” or “fixed size”. The same buffer, with the head allowed to step backwards, gives you a deque.',
      code: {
        py: `class RingQueue:
    def __init__(self, k):
        self.buf = [0] * k                      #> A fixed array: it never grows and nothing is shifted
        self.head = 0                           #> Index of the oldest item
        self.size = 0                           #> How many items are stored

    def enqueue(self, x):
        if self.size == len(self.buf):          #@full > 1. No free slot: refuse
            return False
        tail = (self.head + self.size) % len(self.buf)   #@enqueue > 2. The next free slot, wrapping past the end
        self.buf[tail] = x                      #@enqueue
        self.size += 1                          #@enqueue
        return True

    def dequeue(self):
        if self.size == 0:                      #@empty > 3. Nothing to serve
            return -1
        x = self.buf[self.head]                 #@dequeue > 4. The oldest item sits at head
        self.head = (self.head + 1) % len(self.buf)   #@advance > 5. Move head forward, wrapping. The old slot is only ignored, not erased
        self.size -= 1                          #@advance
        return x`,
        js: `class RingQueue {
  constructor(k) {
    this.buf = new Array(k).fill(0);            //> A fixed array: it never grows and nothing is shifted
    this.head = 0;                              //> Index of the oldest item
    this.size = 0;                              //> How many items are stored
  }
  enqueue(x) {
    if (this.size === this.buf.length) return false;   //@full > 1. No free slot: refuse
    const tail = (this.head + this.size) % this.buf.length;   //@enqueue > 2. The next free slot, wrapping past the end
    this.buf[tail] = x;                         //@enqueue
    this.size++;                                //@enqueue
    return true;
  }
  dequeue() {
    if (this.size === 0) return -1;             //@empty > 3. Nothing to serve
    const x = this.buf[this.head];              //@dequeue > 4. The oldest item sits at head
    this.head = (this.head + 1) % this.buf.length;   //@advance > 5. Move head forward, wrapping. The old slot is only ignored, not erased
    this.size--;                                //@advance
    return x;
  }
}`,
        java: `class RingQueue {
    private final int[] buf;                    //> A fixed array: it never grows and nothing is shifted
    private int head = 0;                       //> Index of the oldest item
    private int size = 0;                       //> How many items are stored

    RingQueue(int k) {
        buf = new int[k];
    }

    boolean enqueue(int x) {
        if (size == buf.length) return false;   //@full > 1. No free slot: refuse
        int tail = (head + size) % buf.length;  //@enqueue > 2. The next free slot, wrapping past the end
        buf[tail] = x;                          //@enqueue
        size++;                                 //@enqueue
        return true;
    }

    int dequeue() {
        if (size == 0) return -1;               //@empty > 3. Nothing to serve
        int x = buf[head];                      //@dequeue > 4. The oldest item sits at head
        head = (head + 1) % buf.length;         //@advance > 5. Move head forward, wrapping. The old slot is only ignored, not erased
        size--;                                 //@advance
        return x;
    }
}`,
        cpp: `class RingQueue {
    vector<int> buf;                            //> A fixed array: it never grows and nothing is shifted
    int head = 0;                               //> Index of the oldest item
    int size = 0;                               //> How many items are stored
public:
    RingQueue(int k) : buf(k) {}

    bool enqueue(int x) {
        if (size == (int)buf.size()) return false;   //@full > 1. No free slot: refuse
        int tail = (head + size) % buf.size();       //@enqueue > 2. The next free slot, wrapping past the end
        buf[tail] = x;                          //@enqueue
        size++;                                 //@enqueue
        return true;
    }

    int dequeue() {
        if (size == 0) return -1;               //@empty > 3. Nothing to serve
        int x = buf[head];                      //@dequeue > 4. The oldest item sits at head
        head = (head + 1) % buf.size();         //@advance > 5. Move head forward, wrapping. The old slot is only ignored, not erased
        size--;                                 //@advance
        return x;
    }
};`
      },
      tests: { design: true, cases: [
        { ops: ['RingQueue', 'enqueue', 'enqueue', 'enqueue', 'enqueue', 'dequeue', 'enqueue', 'dequeue', 'dequeue', 'dequeue', 'dequeue'], args: [[3], [1], [2], [3], [4], [], [4], [], [], [], []], out: [null, true, true, true, false, 1, true, 2, 3, 4, -1] },
        { ops: ['RingQueue', 'dequeue', 'enqueue', 'dequeue', 'dequeue'], args: [[2], [], [9], [], []], out: [null, -1, true, 9, -1] },
        { ops: ['RingQueue', 'enqueue', 'enqueue', 'dequeue', 'enqueue', 'dequeue', 'dequeue', 'enqueue', 'dequeue'], args: [[2], [1], [2], [], [3], [], [], [4], []], out: [null, true, true, 1, true, 2, 3, true, 4] }] }
    },

    complexity: {
      time: 'O(1) per operation',
      space: 'O(k) for a buffer of capacity k',
      why: 'Enqueue and dequeue each do one index calculation and one array access, whatever the queue holds. Nothing is shifted or copied, which is the whole point of the circular layout. A BFS that enqueues and dequeues every node once, and looks at every edge once, is O(V + E). Queue from two stacks is **amortized** O(1): an item moves from the inbox to the outbox at most once, so n operations cost O(n) in total even though one `pop` can cost O(n).',
      trap: 'The expensive mistake is `list.pop(0)` in Python (or `shift()` in a hot JavaScript loop, or `list.remove(0)`-style code): removing the front of an array moves every other element, so each dequeue is O(n) and a BFS on a big graph becomes O(n²). Use `collections.deque` and `popleft()`. A related slip is thinking an amortized bound is a per-call bound: one `pop` of the two-stack queue really can take O(n), and only the **total** is linear.'
    },

    variations: [
      {
        name: 'BFS by levels: freeze the round size',
        body: 'To work ring by ring (level-order traversal, “how many steps”, “minutes until everything spreads”), read `len(queue)` **before** the inner loop and process exactly that many items. Everything the loop adds belongs to the next ring. Mark nodes seen **when you enqueue** them, not when you dequeue them, or a node reachable by two routes enters the queue twice. The tree version, Binary Tree Level Order Traversal (102), is worked below; this is the same loop on a general graph. Cost is O(V + E).',
        code: {
          py: `def bfs_levels(graph, start):
    seen, queue, out = {start}, deque([start]), []
    while queue:
        level = []
        for _ in range(len(queue)):          #> Freeze the size: only this ring
            node = queue.popleft()
            level.append(node)
            for nxt in graph[node]:
                if nxt not in seen:
                    seen.add(nxt)            #> Mark on enqueue, so nothing is queued twice
                    queue.append(nxt)
        out.append(level)
    return out`,
          js: `function bfsLevels(graph, start) {
  const seen = new Set([start]), queue = [start], out = [];
  let head = 0;                              // JS has no built-in queue: an array plus a head index
  while (head < queue.length) {
    const end = queue.length, level = [];    //> Freeze the size: only this ring
    while (head < end) {
      const node = queue[head++];
      level.push(node);
      for (const nxt of graph[node]) {
        if (!seen.has(nxt)) {
          seen.add(nxt);                     //> Mark on enqueue, so nothing is queued twice
          queue.push(nxt);
        }
      }
    }
    out.push(level);
  }
  return out;
}`
        },
        tests: { fn: { py: 'bfs_levels', default: 'bfsLevels' }, cases: [
          { args: [[[1, 2], [3], [3], []], 0], out: [[0], [1, 2], [3]] }, { args: [[[1], [2], [0]], 0], out: [[0], [1], [2]] }, { args: [[[]], 0], out: [[0]] },
          { args: [[[1, 2, 3], [], [], []], 0], out: [[0], [1, 2, 3]] }, { args: [[[1, 2], [0, 3], [0, 3], [1, 2]], 0], out: [[0], [1, 2], [3]] }] }
      },
      {
        name: 'Deque at both ends: sliding window maximum',
        body: 'A deque earns its keep when you need the back **and** the front. Sliding Window Maximum (239) keeps **indices** in a deque whose values are decreasing from front to back. A new number pops every smaller index off the **back**, because a smaller number that sits earlier in the window can never be a maximum again. When the index at the **front** slides out of the window, pop it from the front. The front is always the window’s maximum, and each index enters and leaves once: O(n). It is the monotonic-stack idea with a second open end; see [Sliding window](#/topic/sliding-window) for the family.',
        code: {
          py: `def window_max(nums, k):
    dq, out = deque(), []                    # indices; their values decrease front to back
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                         #> A smaller number behind x can never win again
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()                     #> The front slid out of the window
        if i >= k - 1:
            out.append(nums[dq[0]])          #> The front is the maximum
    return out`,
          js: `function windowMax(nums, k) {
  const dq = [], out = [];                   // indices; their values decrease front to back
  let head = 0;                              // front of the deque inside the array
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();   //> A smaller number behind x can never win again
    dq.push(i);
    if (dq[head] <= i - k) head++;           //> The front slid out of the window
    if (i >= k - 1) out.push(nums[dq[head]]);   //> The front is the maximum
  }
  return out;
}`
        },
        tests: { fn: { py: 'window_max', default: 'windowMax' }, cases: [
          { args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], out: [3, 3, 5, 5, 6, 7] }, { args: [[1], 1], out: [1] }, { args: [[9, 8, 7], 2], out: [9, 8] },
          { args: [[1, 2, 3], 3], out: [3] }, { args: [[4, 2, 12, 3], 2], out: [4, 12, 12] }] }
      },
      {
        name: 'Why list.pop(0) is O(n), and what to use',
        body: 'A Python `list` stores its items in one contiguous block. `pop(0)` removes the first item, so every other item is copied one slot to the left: n − 1 moves. Do that for each of n dequeues and you have O(n²). JavaScript’s `Array.shift()` has the same shape in principle (engines have tricks for small arrays, but do not rely on them for big queues). `collections.deque` is a linked list of small blocks, so `popleft()` and `append()` are O(1); the price is that indexing in the **middle** is O(n), so use a list when you need `x[i]`. Rule of thumb: touch only the ends, use a deque; need random access, use a list.'
      },
      {
        name: 'Language containers: which one to type',
        body: '- **Python:** `from collections import deque`. `append`, `popleft` (queue), `appendleft`, `pop` (other end), `d[0]` and `d[-1]` to peek. `deque(maxlen=k)` drops the oldest automatically.\n- **JavaScript:** no queue. Use an array with a head index (`queue[head++]`), or `push` and `shift` when the queue stays small. A deque with both ends needs a hand-built structure or two arrays.\n- **Java:** `Queue<Integer> q = new ArrayDeque<>()` with `offer`, `poll`, `peek` (they return `null` when empty), or `add`, `remove`, `element` (they throw). For both ends use `Deque` with `addFirst`, `addLast`, `pollFirst`, `pollLast`. `ArrayDeque` rejects `null`. Avoid `LinkedList`: slower and bigger.\n- **C++:** `std::queue<int>` (`push`, `front`, `back`, `pop`, `empty`) wraps `std::deque<int>`, which also gives `push_front`, `pop_front`, `push_back`, `pop_back` and indexing. `pop()` returns **void**, so read `front()` first; reading or popping an empty queue is undefined behavior.'
      },
      {
        name: 'When a plain queue is the wrong tool',
        body: 'If the next item to serve should be the **best** (smallest, most urgent) rather than the oldest, you want a priority queue, which is a heap: see [Heaps and priority queues](#/topic/heaps). If edges have different costs, a plain queue gives fewest edges, not least cost; that is Dijkstra, with a heap. If you need the newest first, that is a [stack](#/topic/stacks). Level-order and BFS on trees and graphs are covered where the structures are: [Trees](#/topic/trees) and [Graphs](#/topic/graphs).'
      }
    ],

    worked: [
      {
        lc: 232,
        restate: 'Build a first-in-first-out queue using **only stacks**. It supports `push` (add to the back), `pop` (remove and return the front), `peek` (read the front) and `empty`.',
        examples: '- push 1, push 2, `peek()` → 1, `pop()` → 1, `empty()` → false.\n- push 1, push 2, push 3, `pop()` → 1, push 4, `pop()` → 2: new items must wait behind the older ones.\n- Edge cases: `pop` when the outbox is empty but the inbox is not; `empty` must check **both** stacks.',
        brute: 'Keep one stack, and on every `pop` move all items to a second stack, take the bottom one, and move everything back. Each `pop` is O(n), and every call pays it, even a `peek` right after.',
        insight: 'A stack reverses order. Move items from one stack to another and the order flips back to first-in-first-out. So keep two stacks: an **inbox** where `push` drops items, and an **outbox** that serves the front. Only when the outbox is empty, pour **everything** from the inbox into it, which puts the oldest item on top. Never pour while the outbox still has items, or you would mix old and new. Each item moves at most once, so the cost is **amortized** O(1).',
        code: {
          py: `class MyQueue:
    def __init__(self):
        self.inbox = []                  # new items land here
        self.outbox = []                 # the oldest item is on top

    def push(self, x: int) -> None:
        self.inbox.append(x)

    def _fill(self) -> None:
        if not self.outbox:              # pour only when the outbox has run dry
            while self.inbox:
                self.outbox.append(self.inbox.pop())

    def pop(self) -> int:
        self._fill()
        return self.outbox.pop()

    def peek(self) -> int:
        self._fill()
        return self.outbox[-1]

    def empty(self) -> bool:
        return not self.inbox and not self.outbox`,
          js: `class MyQueue {
  constructor() {
    this.inbox = [];                     // new items land here
    this.outbox = [];                    // the oldest item is on top
  }
  push(x) {
    this.inbox.push(x);
  }
  fill() {
    if (this.outbox.length === 0) {      // pour only when the outbox has run dry
      while (this.inbox.length) this.outbox.push(this.inbox.pop());
    }
  }
  pop() {
    this.fill();
    return this.outbox.pop();
  }
  peek() {
    this.fill();
    return this.outbox[this.outbox.length - 1];
  }
  empty() {
    return this.inbox.length === 0 && this.outbox.length === 0;
  }
}`,
          java: `class MyQueue {
    private final Deque<Integer> inbox = new ArrayDeque<>();    // new items land here
    private final Deque<Integer> outbox = new ArrayDeque<>();   // the oldest item is on top

    public void push(int x) {
        inbox.push(x);
    }

    private void fill() {
        if (outbox.isEmpty()) {                  // pour only when the outbox has run dry
            while (!inbox.isEmpty()) outbox.push(inbox.pop());
        }
    }

    public int pop() {
        fill();
        return outbox.pop();
    }

    public int peek() {
        fill();
        return outbox.peek();
    }

    public boolean empty() {
        return inbox.isEmpty() && outbox.isEmpty();
    }
}`,
          cpp: `class MyQueue {
    stack<int> inbox, outbox;            // new items land in inbox; the oldest is on top of outbox

    void fill() {
        if (outbox.empty()) {            // pour only when the outbox has run dry
            while (!inbox.empty()) { outbox.push(inbox.top()); inbox.pop(); }
        }
    }
public:
    void push(int x) {
        inbox.push(x);
    }
    int pop() {
        fill();
        int x = outbox.top();
        outbox.pop();
        return x;
    }
    int peek() {
        fill();
        return outbox.top();
    }
    bool empty() {
        return inbox.empty() && outbox.empty();
    }
};`
        },
        complexity: '`push` and `empty` are O(1). `pop` and `peek` are **amortized O(1)**: any single call may pour n items (O(n)), but each item is poured once in its life, so n operations cost O(n) in total. O(n) space.',
        say: '“A stack reverses order, so two stacks put it back. Pushes go on an inbox stack. For pop or peek, if the outbox is empty I pour the whole inbox into it, which reverses it so the oldest item is on top. I only pour when the outbox is empty, or I’d put new items ahead of old ones. Each item is moved at most once, so the cost is amortized O(1) per operation, though one pop can be O(n).”',
        followups: [
          { q: 'Why is it wrong to pour on every `pop`?', a: 'You would pour the outbox back onto the inbox, or put newer items on top of older ones. Pouring only when the outbox is empty keeps the order and keeps each item moving once.' },
          { q: 'Can you make every call O(1) in the worst case, not just amortized?', a: 'Not with two plain stacks. You can with a real queue (a linked list or a ring buffer), or with a more intricate design that spreads the pour over later operations. Say the trade-off and move on.' },
          { q: 'What about the reverse: a stack from queues (225)?', a: 'Use one queue. After each push, rotate the older items behind the new one: dequeue and re-enqueue `size − 1` items. The newest item is then at the front, so `pop` and `top` are O(1) and `push` is O(n).' },
          { q: 'Where does this come up in real systems?', a: 'Functional-programming queues (a front list and a reversed back list) use exactly this, which is how persistent queues get amortized O(1).' }
        ]
      },
      {
        lc: 933,
        restate: 'Build a counter for incoming requests. Each call `ping(t)` records a request at time `t` (milliseconds; every call has a larger `t` than the last) and returns how many requests, including this one, happened in the closed window `[t − 3000, t]`.',
        examples: '- Pings at 1, 100, 3001, 3002 return 1, 2, 3, 3: at time 3002 the window is `[2, 3002]`, so the request at time 1 has expired.\n- Pings at 1 then 3001 return 1, 2: the window `[1, 3001]` still contains time 1.\n- Edge cases: the window is **closed**, so a request exactly 3000 ms ago still counts.',
        brute: 'Store every timestamp in a list and, on each ping, count how many are at least `t − 3000`. That scans the whole history every time: O(n) per ping and unbounded memory.',
        insight: 'Times only go up, so the request list is sorted by arrival, and an expired request can only be at the **front**. Keep the recent requests in a queue. On each ping, enqueue `t`, then dequeue from the front while the front is older than `t − 3000`. What remains is the answer, and its length is the queue’s size. A request is dequeued once, so each ping is amortized O(1), and memory is capped at the busiest 3-second window.',
        code: {
          py: `class RecentCounter:
    def __init__(self):
        self.recent = deque()            # timestamps still inside the window, oldest first

    def ping(self, t: int) -> int:
        self.recent.append(t)
        while self.recent[0] < t - 3000:
            self.recent.popleft()        # expired: older than the window
        return len(self.recent)`,
          js: `class RecentCounter {
  constructor() {
    this.recent = [];                    // timestamps; [head..] are still inside the window
    this.head = 0;
  }
  ping(t) {
    this.recent.push(t);
    while (this.recent[this.head] < t - 3000) this.head++;   // expired: older than the window
    return this.recent.length - this.head;
  }
}`,
          java: `class RecentCounter {
    private final Deque<Integer> recent = new ArrayDeque<>();   // timestamps still inside the window, oldest first

    public int ping(int t) {
        recent.offer(t);
        while (recent.peek() < t - 3000) recent.poll();     // expired: older than the window
        return recent.size();
    }
}`,
          cpp: `class RecentCounter {
    queue<int> recent;                   // timestamps still inside the window, oldest first
public:
    int ping(int t) {
        recent.push(t);
        while (recent.front() < t - 3000) recent.pop();   // expired: older than the window
        return recent.size();
    }
};`
        },
        complexity: 'Amortized O(1) per ping: each timestamp is enqueued once and dequeued at most once. Space is O(W), where W is the most requests that can fall inside one 3000 ms window. (The JavaScript version keeps old entries in its array; trim it with `splice` now and then if memory matters.)',
        say: '“The pings arrive in time order, so the old ones are always at the front. I keep a queue of the timestamps still inside the window. A new ping goes on the back; then I pop from the front while the front is older than t minus 3000. The queue’s size is the answer. Each timestamp is added and removed once, so it’s amortized O(1) per call.”',
        followups: [
          { q: 'What if the window were large and you only needed the count, not the timestamps?', a: 'You still need the timestamps to know when each expires, unless you bucket them: a ring of per-second counters gives O(1) memory per window length.' },
          { q: 'Would a binary search on a list work?', a: 'Yes: `bisect_left(times, t − 3000)` gives the first in-window index, so the count is `len − index`. It is O(log n) per call and keeps all history, so the queue is better here.' },
          { q: 'What if the timestamps could arrive out of order?', a: 'Then the expired ones are not all at the front. You would need a sorted structure or a heap keyed on time, and it becomes a different problem.' }
        ]
      },
      {
        lc: 622,
        restate: 'Design a fixed-capacity circular queue. `MyCircularQueue(k)` makes one with room for `k` items. `enQueue(v)` adds to the back and returns whether it fit, `deQueue()` removes from the front and returns whether it did, `Front()` and `Rear()` return the first and last items (or −1 if empty), and `isEmpty()` and `isFull()` report the state. Every operation must be O(1).',
        examples: '- Capacity 3: enQueue 1, 2, 3 all succeed; enQueue 4 fails (full); `Rear()` → 3; `isFull()` → true.\n- Then `deQueue()` succeeds and `enQueue(4)` now succeeds, **reusing the freed slot**: `Rear()` → 4, `Front()` → 2.\n- Edge cases: `Front()` and `Rear()` on an empty queue return −1; capacity 1 means head and tail are always the same slot.',
        brute: 'Back it with a normal list and `pop(0)` for `deQueue`: it works, but every dequeue slides the other items, O(n). Or keep `head` and `tail` indices without wrapping and the buffer “runs out” even when there is space at the front.',
        insight: 'Treat the array as a ring. Keep `head` (the oldest item) and `size`. The back item is at `(head + size − 1) % k`, and the next free slot is `(head + size) % k`. Enqueue writes to the free slot, dequeue moves `head` one step forward with wrapping. Tracking `size` instead of a separate `tail` makes empty (`size == 0`) and full (`size == k`) trivial to tell apart, which is the usual trap with two bare indices.',
        code: {
          py: `class MyCircularQueue:
    def __init__(self, k: int):
        self.buf = [0] * k
        self.head = 0                    # index of the oldest item
        self.size = 0

    def enQueue(self, value: int) -> bool:
        if self.size == len(self.buf):
            return False
        self.buf[(self.head + self.size) % len(self.buf)] = value   # the next free slot
        self.size += 1
        return True

    def deQueue(self) -> bool:
        if self.size == 0:
            return False
        self.head = (self.head + 1) % len(self.buf)
        self.size -= 1
        return True

    def Front(self) -> int:
        return -1 if self.size == 0 else self.buf[self.head]

    def Rear(self) -> int:
        return -1 if self.size == 0 else self.buf[(self.head + self.size - 1) % len(self.buf)]

    def isEmpty(self) -> bool:
        return self.size == 0

    def isFull(self) -> bool:
        return self.size == len(self.buf)`,
          js: `class MyCircularQueue {
  constructor(k) {
    this.buf = new Array(k).fill(0);
    this.head = 0;                       // index of the oldest item
    this.size = 0;
  }
  enQueue(value) {
    if (this.size === this.buf.length) return false;
    this.buf[(this.head + this.size) % this.buf.length] = value;   // the next free slot
    this.size++;
    return true;
  }
  deQueue() {
    if (this.size === 0) return false;
    this.head = (this.head + 1) % this.buf.length;
    this.size--;
    return true;
  }
  Front() {
    return this.size === 0 ? -1 : this.buf[this.head];
  }
  Rear() {
    return this.size === 0 ? -1 : this.buf[(this.head + this.size - 1) % this.buf.length];
  }
  isEmpty() {
    return this.size === 0;
  }
  isFull() {
    return this.size === this.buf.length;
  }
}`,
          java: `class MyCircularQueue {
    private final int[] buf;
    private int head = 0;                // index of the oldest item
    private int size = 0;

    public MyCircularQueue(int k) {
        buf = new int[k];
    }

    public boolean enQueue(int value) {
        if (size == buf.length) return false;
        buf[(head + size) % buf.length] = value;   // the next free slot
        size++;
        return true;
    }

    public boolean deQueue() {
        if (size == 0) return false;
        head = (head + 1) % buf.length;
        size--;
        return true;
    }

    public int Front() {
        return size == 0 ? -1 : buf[head];
    }

    public int Rear() {
        return size == 0 ? -1 : buf[(head + size - 1) % buf.length];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == buf.length;
    }
}`,
          cpp: `class MyCircularQueue {
    vector<int> buf;
    int head = 0;                        // index of the oldest item
    int size = 0;
public:
    MyCircularQueue(int k) : buf(k) {}

    bool enQueue(int value) {
        if (size == (int)buf.size()) return false;
        buf[(head + size) % buf.size()] = value;   // the next free slot
        size++;
        return true;
    }
    bool deQueue() {
        if (size == 0) return false;
        head = (head + 1) % buf.size();
        size--;
        return true;
    }
    int Front() {
        return size == 0 ? -1 : buf[head];
    }
    int Rear() {
        return size == 0 ? -1 : buf[(head + size - 1) % buf.size()];
    }
    bool isEmpty() {
        return size == 0;
    }
    bool isFull() {
        return size == (int)buf.size();
    }
};`
        },
        complexity: 'O(1) time for every operation: one modulo and one array access. O(k) space for the buffer.',
        say: '“I’ll use a fixed array as a ring, with a `head` index for the oldest item and a `size` count. The next free slot is `(head + size) mod k`, and the back item is one before it. Enqueue refuses when `size` equals `k`, otherwise writes there and bumps `size`. Dequeue moves `head` forward with wrap-around and drops `size`. I track size rather than a separate tail so empty and full can’t be confused. All operations are O(1).”',
        followups: [
          { q: 'Why not keep `head` and `tail` and no `size`?', a: 'When `head == tail` the queue could be empty or full. The usual fixes are to waste one slot (full when `(tail + 1) % k == head`) or to keep a count or flag. Keeping `size` is the clearest.' },
          { q: 'How do you turn this into a circular deque (641)?', a: 'Same buffer, with a front insert that moves `head` **backwards**: `head = (head − 1 + k) % k`, then write there. A back delete just decrements `size`. Both ends stay O(1).' },
          { q: 'What if the queue should overwrite the oldest item when full?', a: 'That is a ring buffer used as a rolling log: on a full enqueue, write at `head`, advance `head`, and leave `size` at `k`.' },
          { q: 'Is this thread-safe?', a: 'No. For one producer and one consumer, a lock-free ring buffer with separate read and write indices is a classic design. With several threads you need a lock or atomic operations. Mention it if asked.' }
        ]
      },
      {
        lc: 102,
        restate: 'Given the root of a binary tree, return its values level by level, left to right, as a list of lists: the root first, then its children, then their children, and so on.',
        examples: '- Tree `[3,9,20,null,null,15,7]` → `[[3],[9,20],[15,7]]`.\n- Tree `[1]` → `[[1]]`.\n- Edge cases: an empty tree → `[]` (not `[[]]`); a lopsided tree still gets one list per depth.',
        brute: 'Compute each node’s depth with a recursive walk, store values in a dictionary keyed by depth, then read the depths out in order. It works and is O(n), but it needs the recursion bookkeeping, and it is not the idea the interviewer is waiting for.',
        insight: 'A queue serves things in arrival order, and in a tree the nodes of one level are enqueued **before** the nodes of the next. So dequeue from the front, and enqueue each node’s children at the back. To split into levels, note `len(queue)` at the start of a round: that is exactly the number of nodes in the current level, and everything enqueued during the round belongs to the next one.',
        code: {
          py: `class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root:
            return []
        out, queue = [], deque([root])
        while queue:
            level = []
            for _ in range(len(queue)):      # exactly the nodes of this level
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            out.append(level)
        return out`,
          js: `function levelOrder(root) {
  if (!root) return [];
  const out = [], queue = [root];
  let head = 0;
  while (head < queue.length) {
    const end = queue.length, level = [];     // exactly the nodes of this level
    while (head < end) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    out.push(level);
  }
  return out;
}`,
          java: `class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int width = queue.size();            // exactly the nodes of this level
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < width; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            out.add(level);
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> out;
        if (!root) return out;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int width = q.size();                // exactly the nodes of this level
            vector<int> level;
            for (int i = 0; i < width; i++) {
                TreeNode* node = q.front();
                q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            out.push_back(level);
        }
        return out;
    }
};`
        },
        complexity: 'O(n) time: each node is enqueued and dequeued once. O(w) space, where w is the widest level (up to about n/2 for a complete tree).',
        say: '“Level order is breadth-first, so I use a queue. I start with the root. In each round I record how many nodes are in the queue, since that is exactly one level, then dequeue that many, collect their values and enqueue their children. The next round’s count is the next level. Every node enters and leaves once, so it’s O(n) time and O(width) space.”',
        followups: [
          { q: 'How would you return the levels bottom-up (107), or zigzag (103)?', a: 'Build the same lists and reverse the output for bottom-up. For zigzag, reverse every other level’s list (or use a deque, appending on a different end each round).' },
          { q: 'What is the right-side view (199)?', a: 'The last node of each level. Same loop, keep only the node dequeued when the inner counter reaches the end.' },
          { q: 'Can you do it recursively?', a: 'Yes: pass the depth down and append each value to `out[depth]`, creating the list on first visit. It is also O(n), but it uses the call stack, so a very deep tree can overflow.' },
          { q: 'How does this change for a graph?', a: 'Add a `seen` set and mark nodes **when you enqueue** them, because a node can be reached by more than one route. See the variation above.' }
        ]
      }
    ],

    practice: [
      { lc: 232,
        hints: ['A stack reverses order, and reversing twice puts it back.', 'Keep an inbox stack for `push`, and an outbox stack for `pop` and `peek`. Move items between them only when the outbox is empty.', 'When the outbox is empty, pour the **entire** inbox into it (pop each one, push onto the outbox). `empty` must check both stacks.'],
        starter: { py: 'class MyQueue:\n    def __init__(self):\n        pass\n\n    def push(self, x: int) -> None:\n        pass\n\n    def pop(self) -> int:\n        pass\n\n    def peek(self) -> int:\n        pass\n\n    def empty(self) -> bool:\n        pass', js: 'class MyQueue {\n  constructor() {\n  }\n  push(x) {\n  }\n  pop() {\n  }\n  peek() {\n  }\n  empty() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['MyQueue', 'push', 'push', 'peek', 'pop', 'empty', 'push', 'pop', 'pop', 'empty'], args: [[], [1], [2], [], [], [], [3], [], [], []], out: [null, null, null, 1, 1, false, null, 2, 3, true] },
          { ops: ['MyQueue', 'push', 'pop', 'empty'], args: [[], [5], [], []], out: [null, null, 5, true] },
          { ops: ['MyQueue', 'push', 'push', 'push', 'pop', 'push', 'pop', 'pop', 'pop'], args: [[], [1], [2], [3], [], [4], [], [], []], out: [null, null, null, null, 1, null, 2, 3, 4] }] } },

      { lc: 933,
        hints: ['Requests arrive in time order, so the oldest ones are at the front of your list.', 'Keep a queue of timestamps. On `ping(t)`, enqueue `t`, then dequeue while the front is less than `t - 3000`.', 'The answer is the size of the queue after trimming. The window is closed, so a request at exactly `t - 3000` stays.'],
        starter: { py: 'class RecentCounter:\n    def __init__(self):\n        pass\n\n    def ping(self, t: int) -> int:\n        pass', js: 'class RecentCounter {\n  constructor() {\n  }\n  ping(t) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['RecentCounter', 'ping', 'ping', 'ping', 'ping'], args: [[], [1], [100], [3001], [3002]], out: [null, 1, 2, 3, 3] },
          { ops: ['RecentCounter', 'ping', 'ping', 'ping'], args: [[], [1], [3001], [3002]], out: [null, 1, 2, 2] },
          { ops: ['RecentCounter', 'ping', 'ping'], args: [[], [10], [4000]], out: [null, 1, 1] }] } },

      { lc: 622,
        hints: ['Use a fixed array as a ring: keep the index of the oldest item and a count of items.', 'The next free slot is `(head + size) % k`, and the last item is at `(head + size - 1) % k`. Dequeue moves `head` forward with `% k`.', 'Track `size` instead of a separate tail index, so empty (`size == 0`) and full (`size == k`) can never be confused.'],
        starter: { py: 'class MyCircularQueue:\n    def __init__(self, k: int):\n        pass\n\n    def enQueue(self, value: int) -> bool:\n        pass\n\n    def deQueue(self) -> bool:\n        pass\n\n    def Front(self) -> int:\n        pass\n\n    def Rear(self) -> int:\n        pass\n\n    def isEmpty(self) -> bool:\n        pass\n\n    def isFull(self) -> bool:\n        pass', js: 'class MyCircularQueue {\n  constructor(k) {\n  }\n  enQueue(value) {\n  }\n  deQueue() {\n  }\n  Front() {\n  }\n  Rear() {\n  }\n  isEmpty() {\n  }\n  isFull() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['MyCircularQueue', 'enQueue', 'enQueue', 'enQueue', 'enQueue', 'Rear', 'isFull', 'deQueue', 'enQueue', 'Rear', 'Front'], args: [[3], [1], [2], [3], [4], [], [], [], [4], [], []], out: [null, true, true, true, false, 3, true, true, true, 4, 2] },
          { ops: ['MyCircularQueue', 'isEmpty', 'Front', 'Rear', 'deQueue', 'enQueue', 'isEmpty'], args: [[2], [], [], [], [], [7], []], out: [null, true, -1, -1, false, true, false] },
          { ops: ['MyCircularQueue', 'enQueue', 'enQueue', 'deQueue', 'enQueue', 'Front', 'Rear', 'deQueue', 'deQueue', 'isEmpty'], args: [[2], [1], [2], [], [3], [], [], [], [], []], out: [null, true, true, true, true, 2, 3, true, true, true] }] } },

      { lc: 102,
        hints: ['Level order means closest to the root first: that is breadth-first, so use a queue.', 'Dequeue a node, record its value, and enqueue its left and right children.', 'To separate the levels, read `len(queue)` at the start of each round and process exactly that many nodes before starting the next list.'],
        starter: { py: 'class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        ', js: 'function levelOrder(root) {\n  \n}' },
        tests: { fn: 'levelOrder', argTypes: ['tree'], cases: [
          { args: [[3, 9, 20, null, null, 15, 7]], out: [[3], [9, 20], [15, 7]] }, { args: [[1]], out: [[1]] }, { args: [[]], out: [] }, { args: [[1, 2, 3, 4, null, null, 5]], out: [[1], [2, 3], [4, 5]] }, { args: [[1, 2, null, 3, null, 4]], out: [[1], [2], [3], [4]] }] } },

      { lc: 225,
        hints: ['A queue serves the oldest item, but a stack must serve the newest. So the newest item has to end up at the **front**.', 'Use one queue. After enqueuing the new item at the back, rotate: dequeue and re-enqueue every item that was there before it.', 'Now the front is the newest item: `pop` is `popleft`, `top` is the front, and `empty` is whether the queue is empty. `push` is O(n), the others O(1).'],
        solution: { explain: 'One queue, rotated after each push so that the newest item sits at the front. `push` is O(n); `pop`, `top` and `empty` are O(1). (The JavaScript version uses `shift` for the rotation, which is fine for a small design problem.)', code: {
          py: `class MyStack:
    def __init__(self):
        self.q = deque()

    def push(self, x: int) -> None:
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())      # rotate the older items behind the new one

    def pop(self) -> int:
        return self.q.popleft()

    def top(self) -> int:
        return self.q[0]

    def empty(self) -> bool:
        return not self.q`,
          js: `class MyStack {
  constructor() {
    this.q = [];
  }
  push(x) {
    this.q.push(x);
    for (let i = 0; i < this.q.length - 1; i++) this.q.push(this.q.shift());   // rotate the older items behind the new one
  }
  pop() {
    return this.q.shift();
  }
  top() {
    return this.q[0];
  }
  empty() {
    return this.q.length === 0;
  }
}` } },
        starter: { py: 'class MyStack:\n    def __init__(self):\n        pass\n\n    def push(self, x: int) -> None:\n        pass\n\n    def pop(self) -> int:\n        pass\n\n    def top(self) -> int:\n        pass\n\n    def empty(self) -> bool:\n        pass', js: 'class MyStack {\n  constructor() {\n  }\n  push(x) {\n  }\n  pop() {\n  }\n  top() {\n  }\n  empty() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['MyStack', 'push', 'push', 'top', 'pop', 'empty'], args: [[], [1], [2], [], [], []], out: [null, null, null, 2, 2, false] },
          { ops: ['MyStack', 'push', 'pop', 'empty'], args: [[], [1], [], []], out: [null, null, 1, true] },
          { ops: ['MyStack', 'push', 'push', 'push', 'pop', 'top', 'pop', 'pop', 'empty'], args: [[], [1], [2], [3], [], [], [], [], []], out: [null, null, null, null, 3, 2, 2, 1, true] }] } },

      { lc: 641,
        hints: ['It is the circular queue with a second open end. Keep `head` and `size` again.', 'Inserting at the **back** writes at `(head + size) % k`. Inserting at the **front** first moves `head` back to `(head - 1 + k) % k`, then writes there.', 'Deleting from the front moves `head` forward and drops `size`. Deleting from the back only drops `size`. The last item is at `(head + size - 1) % k`.'],
        solution: { explain: 'A ring buffer with `head` and `size`. Front inserts step `head` backwards; back inserts write at `(head + size) % k`; deletes shrink from either end. All O(1), O(k) space.', code: {
          py: `class MyCircularDeque:
    def __init__(self, k: int):
        self.buf = [0] * k
        self.head = 0
        self.size = 0

    def insertFront(self, value: int) -> bool:
        if self.size == len(self.buf):
            return False
        self.head = (self.head - 1) % len(self.buf)     # step back, wrapping to the end
        self.buf[self.head] = value
        self.size += 1
        return True

    def insertLast(self, value: int) -> bool:
        if self.size == len(self.buf):
            return False
        self.buf[(self.head + self.size) % len(self.buf)] = value
        self.size += 1
        return True

    def deleteFront(self) -> bool:
        if self.size == 0:
            return False
        self.head = (self.head + 1) % len(self.buf)
        self.size -= 1
        return True

    def deleteLast(self) -> bool:
        if self.size == 0:
            return False
        self.size -= 1
        return True

    def getFront(self) -> int:
        return -1 if self.size == 0 else self.buf[self.head]

    def getRear(self) -> int:
        return -1 if self.size == 0 else self.buf[(self.head + self.size - 1) % len(self.buf)]

    def isEmpty(self) -> bool:
        return self.size == 0

    def isFull(self) -> bool:
        return self.size == len(self.buf)`,
          js: `class MyCircularDeque {
  constructor(k) {
    this.buf = new Array(k).fill(0);
    this.head = 0;
    this.size = 0;
  }
  insertFront(value) {
    if (this.size === this.buf.length) return false;
    this.head = (this.head - 1 + this.buf.length) % this.buf.length;   // step back, wrapping to the end
    this.buf[this.head] = value;
    this.size++;
    return true;
  }
  insertLast(value) {
    if (this.size === this.buf.length) return false;
    this.buf[(this.head + this.size) % this.buf.length] = value;
    this.size++;
    return true;
  }
  deleteFront() {
    if (this.size === 0) return false;
    this.head = (this.head + 1) % this.buf.length;
    this.size--;
    return true;
  }
  deleteLast() {
    if (this.size === 0) return false;
    this.size--;
    return true;
  }
  getFront() {
    return this.size === 0 ? -1 : this.buf[this.head];
  }
  getRear() {
    return this.size === 0 ? -1 : this.buf[(this.head + this.size - 1) % this.buf.length];
  }
  isEmpty() {
    return this.size === 0;
  }
  isFull() {
    return this.size === this.buf.length;
  }
}` } },
        starter: { py: 'class MyCircularDeque:\n    def __init__(self, k: int):\n        pass\n\n    def insertFront(self, value: int) -> bool:\n        pass\n\n    def insertLast(self, value: int) -> bool:\n        pass\n\n    def deleteFront(self) -> bool:\n        pass\n\n    def deleteLast(self) -> bool:\n        pass\n\n    def getFront(self) -> int:\n        pass\n\n    def getRear(self) -> int:\n        pass\n\n    def isEmpty(self) -> bool:\n        pass\n\n    def isFull(self) -> bool:\n        pass', js: 'class MyCircularDeque {\n  constructor(k) {\n  }\n  insertFront(value) {\n  }\n  insertLast(value) {\n  }\n  deleteFront() {\n  }\n  deleteLast() {\n  }\n  getFront() {\n  }\n  getRear() {\n  }\n  isEmpty() {\n  }\n  isFull() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['MyCircularDeque', 'insertLast', 'insertLast', 'insertFront', 'insertFront', 'getRear', 'isFull', 'deleteLast', 'insertFront', 'getFront'], args: [[3], [1], [2], [3], [4], [], [], [], [4], []], out: [null, true, true, true, false, 2, true, true, true, 4] },
          { ops: ['MyCircularDeque', 'isEmpty', 'getFront', 'getRear', 'deleteFront', 'deleteLast', 'insertFront', 'getRear', 'getFront'], args: [[2], [], [], [], [], [], [9], [], []], out: [null, true, -1, -1, false, false, true, 9, 9] },
          { ops: ['MyCircularDeque', 'insertFront', 'insertFront', 'deleteLast', 'insertFront', 'getFront', 'getRear', 'deleteFront', 'getFront'], args: [[2], [1], [2], [], [3], [], [], [], []], out: [null, true, true, true, true, 3, 2, true, 2] }] } },

      { lc: 1700,
        hints: ['Students who refuse the sandwich on top go to the back of the line; the sandwiches never move. Simulating that works but is more work than needed.', 'Only the **counts** matter: how many students want 0, and how many want 1. The order in the line cannot block anyone as long as someone wants the top sandwich.', 'Walk the sandwiches in order. If nobody left wants this kind, everyone still waiting is stuck: return how many sandwiches remain. Otherwise use one student of that kind.'],
        solution: { explain: 'The line rotates until somebody wants the top sandwich, so only preference counts matter. Serve sandwiches in order; the first kind with no takers left blocks everyone after it. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def countStudents(self, students: List[int], sandwiches: List[int]) -> int:
        want = [students.count(0), students.count(1)]    # how many students still want each kind
        for i, s in enumerate(sandwiches):
            if want[s] == 0:
                return len(sandwiches) - i               # nobody wants this one: the rest are stuck
            want[s] -= 1
        return 0`,
          js: `function countStudents(students, sandwiches) {
  const want = [0, 0];                                   // how many students still want each kind
  for (const s of students) want[s]++;
  for (let i = 0; i < sandwiches.length; i++) {
    if (want[sandwiches[i]] === 0) return sandwiches.length - i;   // nobody wants this one: the rest are stuck
    want[sandwiches[i]]--;
  }
  return 0;
}` } },
        starter: { py: 'class Solution:\n    def countStudents(self, students: List[int], sandwiches: List[int]) -> int:\n        ', js: 'function countStudents(students, sandwiches) {\n  \n}' },
        tests: { fn: 'countStudents', cases: [
          { args: [[1, 1, 0, 0], [0, 1, 0, 1]], out: 0 }, { args: [[1, 1, 1, 0, 0, 1], [1, 0, 0, 0, 1, 1]], out: 3 }, { args: [[0], [1]], out: 1 }, { args: [[1, 0], [1, 0]], out: 0 }] } },

      { lc: 649,
        hints: ['Each senator, in turn, bans the **nearest** opposing senator who has not acted yet.', 'Keep two queues of positions, one per party. Dequeue the front of each: the smaller position acts first and bans the other.', 'The winner goes back to the end of the line for the next round, with its position increased by `n` so it sits after everyone in this round. The party whose queue empties first loses.'],
        solution: { explain: 'Two queues of indices. Compare the fronts: the smaller index acts first, bans the other, and rejoins the back as `index + n`. Each round consumes at least one senator, so at most 2n comparisons: O(n).', code: {
          py: `class Solution:
    def predictPartyVictory(self, senate: str) -> str:
        n = len(senate)
        radiant, dire = deque(), deque()
        for i, c in enumerate(senate):
            (radiant if c == 'R' else dire).append(i)
        while radiant and dire:
            r, d = radiant.popleft(), dire.popleft()
            if r < d:
                radiant.append(r + n)        # r acts first, bans d, and waits for the next round
            else:
                dire.append(d + n)
        return 'Radiant' if radiant else 'Dire'`,
          js: `function predictPartyVictory(senate) {
  const n = senate.length, radiant = [], dire = [];
  for (let i = 0; i < n; i++) (senate[i] === 'R' ? radiant : dire).push(i);
  let rh = 0, dh = 0;                        // head indices: each array is used as a queue
  while (rh < radiant.length && dh < dire.length) {
    const r = radiant[rh++], d = dire[dh++];
    if (r < d) radiant.push(r + n);          // r acts first, bans d, and waits for the next round
    else dire.push(d + n);
  }
  return rh < radiant.length ? 'Radiant' : 'Dire';
}` } },
        starter: { py: 'class Solution:\n    def predictPartyVictory(self, senate: str) -> str:\n        ', js: 'function predictPartyVictory(senate) {\n  \n}' },
        tests: { fn: 'predictPartyVictory', cases: [
          { args: ['RD'], out: 'Radiant' }, { args: ['RDD'], out: 'Dire' }, { args: ['R'], out: 'Radiant' }, { args: ['DDRRR'], out: 'Dire' }, { args: ['RRDDD'], out: 'Radiant' }] } },

      { lc: 950,
        hints: ['Work backwards from the process: it reveals a card, moves the next one to the bottom, and repeats.', 'Sort the deck. Simulate the process on **positions** 0 to n-1 using a queue of indices: the revealed position gets the next smallest card.', 'For each sorted card: dequeue an index and put the card there; then, if indices remain, move the next index from the front to the back.'],
        solution: { explain: 'Run the reveal-and-skip process on index positions with a deque; the i-th revealed position must hold the i-th smallest card. O(n log n) for the sort, O(n) for the simulation.', code: {
          py: `class Solution:
    def deckRevealedIncreasing(self, deck: List[int]) -> List[int]:
        n = len(deck)
        out = [0] * n
        order = deque(range(n))                  # positions, in the order the process reveals them
        for card in sorted(deck):
            out[order.popleft()] = card          # this position is revealed next: smallest card
            if order:
                order.append(order.popleft())    # the next card goes to the bottom
        return out`,
          js: `function deckRevealedIncreasing(deck) {
  const n = deck.length, out = new Array(n).fill(0);
  const order = [];                              // positions, in the order the process reveals them
  for (let i = 0; i < n; i++) order.push(i);
  let head = 0;
  for (const card of [...deck].sort((a, b) => a - b)) {
    out[order[head++]] = card;                   // this position is revealed next: smallest card
    if (head < order.length) order.push(order[head++]);   // the next card goes to the bottom
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def deckRevealedIncreasing(self, deck: List[int]) -> List[int]:\n        ', js: 'function deckRevealedIncreasing(deck) {\n  \n}' },
        tests: { fn: 'deckRevealedIncreasing', cases: [
          { args: [[17, 13, 11, 2, 3, 5, 7]], out: [2, 13, 3, 11, 5, 17, 7] }, { args: [[1, 1000]], out: [1, 1000] }, { args: [[5]], out: [5] }, { args: [[3, 1, 2]], out: [1, 3, 2] }] } }
    ],

    mistakes: [
      '**Using `list.pop(0)` (or `shift`) as the dequeue.** It is O(n) because every other element slides left, so a BFS over 100,000 nodes can time out. Use `collections.deque` and `popleft()`, an index into the array, or `ArrayDeque`.',
      '**Marking a node seen when you dequeue it instead of when you enqueue it.** A node reachable by two routes then enters the queue twice, the work doubles or worse, and in a level count it appears in two rings. Mark on **enqueue**.',
      '**Reading `len(queue)` inside the loop that changes it.** For level-by-level work, freeze the size **before** the inner loop (`for _ in range(len(queue))` does this in Python, but `while i < len(queue)` does not). Otherwise children from this round get mixed into it.',
      '**Confusing empty and full in a ring buffer.** With only `head` and `tail`, `head == tail` is both. Keep a `size` count (or waste a slot). Also remember the tail is `(head + size) % k`, not `head + size`: forgetting the `% k` runs off the array.',
      '**Dequeuing from an empty queue.** Python’s `popleft()` raises `IndexError`; Java’s `remove()` throws, `poll()` returns `null` (unboxing that `null` into an `int` is a `NullPointerException`); C++ `front()`/`pop()` on an empty queue is undefined behavior. Check emptiness first, and say what an empty dequeue means in a design problem.',
      '**Treating amortized as worst case, or the reverse.** The two-stack queue’s `pop` is O(1) amortized, and one call can still cost O(n). The usual follow-up asks which one you mean.',
      '**Language gotchas.** *Python:* `deque` is fast at both ends, but `d[i]` in the middle is O(n); `len(queue)` is O(1). *JavaScript:* no built-in queue, and `shift()` on a big array is the silent O(n) trap. *Java:* `ArrayDeque` does not accept `null`; `Queue.add` throws when it fails but `offer` returns false; mixing `push` (adds at the **front**) with `poll` (removes from the front) on a `Deque` quietly gives you a stack. *C++:* `std::queue::pop()` returns **void**, and `std::queue` has no iterators or indexing: use `std::deque` if you need them.'
    ],

    quiz: [
      { kind: 'concept', q: 'You enqueue A, B, C, then dequeue once, enqueue D, and dequeue twice. Which item is served by the **last** dequeue?',
        choices: ['C', 'B', 'D', 'A'], answer: 0,
        explain: 'First in, first out. The three dequeues serve A, then B, then C. D is still waiting at the back.' },
      { kind: 'pattern', q: 'Which problem is most naturally solved with a queue?',
        choices: ['Find the fewest moves between two cells of an unweighted grid', 'Check that nested tags close in the right order', 'Find the k-th smallest value in an unsorted array', 'Find the next greater value to the right of each element'], answer: 0,
        explain: 'Fewest steps in an unweighted graph is breadth-first search, whose frontier is a queue. Nested tags are a stack, the k-th smallest is a heap or sort, and next greater is a monotonic stack.' },
      { kind: 'pattern', q: 'Which signals point to a queue or deque? Pick every one that applies.',
        choices: ['Process things in arrival order', 'Old items must expire from the front while new ones arrive at the back', 'The newest unresolved item is always the one that matters next', 'You explore all cells at distance 1 before any at distance 2'], answer: [0, 1, 3],
        explain: 'Arrival order, expiring from the front, and exploring ring by ring (BFS) are queue signals. “The newest item matters next” is a stack.' },
      { kind: 'complexity', q: 'A BFS dequeues with `queue.pop(0)` on a Python list holding up to n items. What is the worst-case cost of the whole search over n nodes (ignoring edges)?',
        choices: ['O(n²)', 'O(n)', 'O(n log n)', 'O(1)'], answer: 0,
        explain: 'Each `pop(0)` shifts every remaining element, O(n), and it runs once per node: O(n²) in total. `collections.deque.popleft()` is O(1), making the same loop O(n).' },
      { kind: 'bug', q: 'This circular queue overwrites the newest item instead of adding a new one. What is wrong?',
        code: `def enqueue(self, x):
    if self.size == len(self.buf):
        return False
    self.buf[(self.head + self.size - 1) % len(self.buf)] = x
    self.size += 1
    return True`,
        choices: ['The index points at the last stored item; the free slot is at `(head + size) % k`', 'It should check `size == 0` instead of `size == len(buf)`', 'It should not increase `size`', 'The modulo should be by `size`, not by the buffer length'], answer: 0,
        explain: 'With `size` items starting at `head`, the last item is at `head + size - 1` and the next free slot is `head + size`. Writing at `size - 1` replaces the newest item, and the new one never lands in its own slot.' },
      { kind: 'concept', q: 'In the two-stack queue, when may you move items from the inbox to the outbox?',
        choices: ['Only when the outbox is empty, and then move all of them', 'On every `pop`, to keep the stacks balanced', 'Whenever the inbox has more items than the outbox', 'Only when `push` is called'], answer: 0,
        explain: 'Pouring while the outbox still holds items would put newer items on top of older ones and break first-in-first-out. Pouring only when it is empty, and all at once, keeps the order and moves each item once, which is why the cost is amortized O(1).' },
      { kind: 'concept', q: 'In a level-order BFS, why do you read `len(queue)` once before the inner loop?',
        choices: ['It is the number of nodes in the current level; children added during the loop belong to the next level', 'It makes `popleft` run in O(1)', 'It stops the same node from being added twice', 'It is required by Python’s `deque`'], answer: 0,
        explain: 'At the start of a round the queue holds exactly one level. Items appended while you process it are the next level, so freezing the count splits the levels apart. Preventing duplicates is the job of the `seen` set.' },
      { kind: 'concept', q: 'You need to read and remove from **both** ends in O(1), and occasionally the maximum of a moving window. Which container fits in Java?',
        choices: ['`ArrayDeque` used as a `Deque`', '`Stack`', '`PriorityQueue`', '`TreeSet`'], answer: 0,
        explain: '`ArrayDeque` supports `addFirst`, `addLast`, `pollFirst` and `pollLast` in O(1); a monotonic deque of indices gives the window maximum. `Stack` is a legacy single-ended class, and `PriorityQueue` and `TreeSet` cost O(log n) per operation.' }
    ],

    flashcards: [
      { id: 'fifo', front: 'Queue: what does FIFO mean, and what are the core operations?', back: 'First in, first out. `enqueue` adds at the back, `dequeue` removes the oldest from the front, `front`/`peek` reads it. All O(1) on a proper queue.' },
      { id: 'pop-zero', front: 'Why is `list.pop(0)` a bad dequeue?', back: 'Removing the first element of an array slides every other element left: O(n) per call, O(n²) over a BFS. Use `collections.deque.popleft()` (O(1)) instead.' },
      { id: 'ring-formula', front: 'Circular buffer: where is the next free slot, and where is the last item?', back: 'Keep `head` (oldest) and `size`. Next free slot: `(head + size) % k`. Last item: `(head + size - 1) % k`. Dequeue: `head = (head + 1) % k`.' },
      { id: 'empty-full', front: 'Ring buffer: how do you tell empty from full?', back: 'With only head and tail, `head == tail` is ambiguous. Keep a `size` count (empty is 0, full is `k`), or sacrifice one slot.' },
      { id: 'bfs-queue', front: 'BFS in four lines.', back: 'Enqueue the start and mark it seen. Dequeue a node; for each unseen neighbour, mark it **and** enqueue it. Repeat until empty. First arrival at a node is by a shortest path (unweighted).' },
      { id: 'level-size', front: 'How do you process a BFS one level at a time?', back: 'At the start of each round, store `n = len(queue)`, then dequeue exactly `n` items. Whatever you enqueue meanwhile is the next level.' },
      { id: 'mark-enqueue', front: 'BFS: mark visited on enqueue or dequeue?', back: 'On **enqueue**. Marking on dequeue lets a node enter the queue several times, wasting work and corrupting level counts.' },
      { id: 'two-stacks', front: 'Queue from two stacks: the rule and the cost.', back: 'Push onto the inbox. For pop/peek, if the outbox is empty, pour **all** of the inbox into it. Each item moves once, so amortized O(1) (one pop can be O(n)).' },
      { id: 'stack-from-queue', front: 'Stack from a queue: how?', back: 'One queue. After each push, rotate: dequeue and re-enqueue every older item so the newest is at the front. `push` is O(n); `pop` and `top` are O(1).' },
      { id: 'deque-uses', front: 'What does a deque give you that a queue does not?', back: 'O(1) add and remove at **both** ends. It is a stack, a queue, or the structure for sliding-window maximum (indices, decreasing values, pop back on a bigger arrival, pop front when expired).' },
      { id: 'containers', front: 'Queue and deque containers: Python, JavaScript, Java, C++.', back: 'Python `collections.deque` (`popleft`). JavaScript: array plus head index (no built-in). Java `ArrayDeque` (`offer`/`poll`/`peek`). C++ `std::queue` or `std::deque` (`pop()` returns void).' }
    ],

    deeper: [
      { title: 'Queue problems (LeetCode tag)', url: 'https://leetcode.com/tag/queue/', time: 'reference', note: 'LeetCode’s list of problems tagged queue. Most are BFS or design questions; do the design ones first to get comfortable with the circular layout.' },
      { title: 'Breadth-first search problems (LeetCode tag)', url: 'https://leetcode.com/tag/breadth-first-search/', time: 'reference', note: 'The big payoff. BFS with a queue underlies level order, shortest paths in grids and word ladders; return here after this page feels easy.' },
      { title: 'Stacks & Queues (William Fiset, YouTube)', url: 'https://www.youtube.com/watch?v=L3ud3rXpIxA', time: 'about 20 min', note: 'A video on how queues and stacks work and how they are implemented, as linked from DSA-Kit.' },
      { title: 'collections.deque (Python docs)', url: 'https://docs.python.org/3/library/collections.html#collections.deque', time: '10 min', note: 'The official reference: `maxlen`, `rotate`, `appendleft`, and the note on O(n) middle indexing.' },
      { title: 'std::deque (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/deque', time: '10 min', note: 'What the underlying container of `std::queue` offers: both ends in O(1), plus random access.' },
      { title: 'ArrayDeque (Java API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html', time: '10 min', note: 'Why it is faster than `Stack` and `LinkedList`, and which methods throw versus return null.' }
    ],

    detective: [
      { id: 'bakery-rush', decoys: ['sliding-window', 'stacks', 'heaps'],
        statement: 'A bakery’s kitchen screen logs each online order with its arrival time in seconds, and the times only ever go up. Every time a new order comes in, the screen must show how many orders arrived in the last five minutes, counting this one. Orders keep streaming in all day, so the screen can’t afford to re-read the whole day’s list each time.',
        why: 'Times arrive in order and the **oldest** entries are the ones that fall out of range, always from one end, while new entries join the other. That is first-in-first-out: add each time at the back and drop from the front while it is too old.' },
      { id: 'flood-spread', decoys: ['recursion', 'graphs', 'trees'],
        statement: 'A grid shows a valley: some cells are dry land, some are rock, and a few cells start flooded. Every hour, each flooded cell soaks the dry land cells directly above, below, left and right of it, and rock never floods. Report how many hours pass until no dry cell is left, or say it never happens if some dry cell is cut off by rock.',
        why: 'All flooded cells spread outward **at the same pace**, ring by ring, and you need the number of rings. Starting with every flooded cell in line and taking whole rounds is breadth-first search, whose frontier is a queue.' },
      { id: 'hot-potato', decoys: ['recursion', 'linked-lists', 'arrays-hashing'],
        statement: 'A group of kids stands in a circle for a game. A hot potato starts with the first kid and is passed along m times. Whoever is holding it at the end leaves the circle, and the next round starts from the kid just after them. Play until one kid remains, and report who wins.',
        why: 'Each kid who is passed over goes to the **back of the line** and the kid who is “out” leaves from the front. Dequeue and re-enqueue m − 1 times, then drop the next one: a queue being rotated.' }
    ]
  });
})();
