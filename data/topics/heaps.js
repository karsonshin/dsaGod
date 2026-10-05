/* Offer Ready: Heaps and priority queues. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in.
   JavaScript has no built-in heap, so HEAP (a compact comparator heap) is pasted into the JS snippets that need one. */
(function () {
  var OR = (window.OR = window.OR || {});
  var HEAP = `class Heap {                         // min-heap by default; pass less = (a, b) => a > b for a max-heap
  constructor(less = (a, b) => a < b) { this.a = []; this.less = less; }
  get size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {                    // sift up
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]]; i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (2 * i + 1 < a.length) {   // sift down
        let c = 2 * i + 1;
        if (c + 1 < a.length && this.less(a[c + 1], a[c])) c++;
        if (!this.less(a[c], a[i])) break;
        [a[c], a[i]] = [a[i], a[c]]; i = c;
      }
    }
    return top;
  }
}
`;
  (OR.topics = OR.topics || []).push({
    id: 'heaps',

    hook: 'A heap answers one question fast: *what is the smallest (or largest) thing I have right now?* It stays correct while you keep adding things, in O(log n) per change. That one trick is behind “top k”, “k-th largest”, “merge k sorted lists”, “running median” and every “always process the cheapest next” scheduler, and it is how Dijkstra works. It shows up constantly in phone screens, and NeetCode 150 gives it its own section.',

    cues: [
      'You need the **k largest or smallest**, or the **k-th** one, from a collection, especially a **stream** you can’t sort once and forget.',
      'You repeatedly need the **current best** (smallest, largest, earliest deadline, cheapest) while items keep arriving or leaving.',
      'The question says “merge k sorted …”: one pointer per list, always advance the list with the smallest front value.',
      'You need a **median** (or any middle rank) of a growing set: two heaps, one per half.',
      'Sorting once is almost enough, but new items keep arriving, so a re-sort every time would be O(n log n) per update.',
      'The trap: a heap does **not** give you sorted order, fast arbitrary search or fast delete-by-value. If you need those, you want a sorted structure or a hash map.'
    ],

    intuition: [
      'Picture a tournament bracket where only one thing matters: the champion. The champion always sits at the top. When the champion leaves, you don’t replay the whole tournament: you promote the last player into the vacant spot and let them sink down against the stronger side until they belong. When a new player joins, they enter at the bottom and climb while they beat the one above them. Each of those is one trip along a single path from top to bottom, and a path is only about log₂ n steps long.',
      'That’s a **binary heap**. Precisely:',
      '1. It is a **complete binary tree**: every level is full except possibly the last, which fills left to right. Because of that, it lives in a plain array with no pointers. For index `i`, the parent is `(i - 1) // 2` and the children are `2i + 1` and `2i + 2`.\n2. The **heap property** (for a min-heap): every node is ≤ both its children. So the minimum is always at index 0. Siblings and cousins have no order between them, and that looseness is exactly why it’s cheap.\n3. **Insert** (push): put the value in the first free slot, the end of the array, then **sift up**: while it’s smaller than its parent, swap them.\n4. **Extract** (pop): take the root, move the **last** element into the root’s slot, then **sift down**: swap with the **smaller** child until neither child is smaller.',
      'Why the smaller child on the way down? If you swapped with the larger child, the smaller child would end up as the new parent of a larger one, breaking the property. Why does the last element go to the root? It keeps the tree complete, so the array never has a gap. Both operations touch one root-to-leaf path, so they cost O(log n); peeking at the root is O(1).',
      'Three patterns cover most questions. **Size-k heap**: to keep the k *largest* values, hold a *min*-heap of size k, so the root is the weakest of the survivors and is the first to be evicted. **Two heaps**: a max-heap for the lower half and a min-heap for the upper half, so both middle values sit at the roots. **K-way merge**: a heap of one candidate per source, always popping the smallest and pushing that source’s next.'
    ].join('\n\n'),

    viz: 'heap',

    template: {
      title: 'A min-heap from scratch: sift up on insert, sift down on extract',
      note: 'Every heap question uses the library version of these two moves (`heappush`/`heappop`, `PriorityQueue`, `priority_queue`). Know them well enough to write them: interviewers ask for the sift, and the **visualizer above lights these exact lines**. Insert is *append, then climb while smaller than the parent*. Extract is *take the root, move the last value up to the root, then sink toward the smaller child*. The test below inserts everything and then extracts everything, which returns the numbers in sorted order (that’s heap sort).',
      code: {
        py: `def heap_sorted(nums):
    heap = []                                          #> A min-heap in a plain list: the children of i sit at 2i+1 and 2i+2
    for x in nums:
        heap.append(x)                                 #@append > 1. Insert: put the value in the first free slot, the end of the array
        i = len(heap) - 1
        while i > 0 and heap[(i - 1) // 2] > heap[i]:  #@up > 2. Sift up: while the parent is bigger, the new value is out of place
            p = (i - 1) // 2
            heap[p], heap[i] = heap[i], heap[p]        #@swapup > Swap with the parent and keep climbing
            i = p
    out = []
    while heap:
        out.append(heap[0])                            #@root > 3. Extract: the smallest value is always the root
        last = heap.pop()
        if heap:
            heap[0] = last                             #@move > 4. Move the last value to the root, so the array has no gap
            i = 0
            while 2 * i + 1 < len(heap):
                c = 2 * i + 1
                if c + 1 < len(heap) and heap[c + 1] < heap[c]:  #@child > 5. Sift down: look at both children, take the smaller
                    c += 1
                if heap[c] >= heap[i]:                 #@down > 6. Stop when even the smaller child isn't smaller
                    break
                heap[c], heap[i] = heap[i], heap[c]    #@swapdown > Otherwise swap with that child and keep sinking
                i = c
    return out`,
        js: `function heapSorted(nums) {
  const heap = [];                                         //> A min-heap in a plain array: the children of i sit at 2i+1 and 2i+2
  for (const x of nums) {
    heap.push(x);                                          //@append > 1. Insert: put the value in the first free slot, the end of the array
    let i = heap.length - 1;
    while (i > 0 && heap[(i - 1) >> 1] > heap[i]) {        //@up > 2. Sift up: while the parent is bigger, the new value is out of place
      const p = (i - 1) >> 1;
      [heap[p], heap[i]] = [heap[i], heap[p]];             //@swapup > Swap with the parent and keep climbing
      i = p;
    }
  }
  const out = [];
  while (heap.length) {
    out.push(heap[0]);                                     //@root > 3. Extract: the smallest value is always the root
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;                                      //@move > 4. Move the last value to the root, so the array has no gap
      let i = 0;
      while (2 * i + 1 < heap.length) {
        let c = 2 * i + 1;
        if (c + 1 < heap.length && heap[c + 1] < heap[c]) c++;  //@child > 5. Sift down: look at both children, take the smaller
        if (heap[c] >= heap[i]) break;                     //@down > 6. Stop when even the smaller child isn't smaller
        [heap[c], heap[i]] = [heap[i], heap[c]];           //@swapdown > Otherwise swap with that child and keep sinking
        i = c;
      }
    }
  }
  return out;
}`,
        java: `class Solution {
    public int[] heapSorted(int[] nums) {
        int n = nums.length, size = 0;
        int[] heap = new int[n];                                 //> A min-heap in an array: the children of i sit at 2i+1 and 2i+2
        for (int x : nums) {
            heap[size] = x;                                      //@append > 1. Insert: put the value in the first free slot, the end of the array
            int i = size++;
            while (i > 0 && heap[(i - 1) / 2] > heap[i]) {       //@up > 2. Sift up: while the parent is bigger, the new value is out of place
                int p = (i - 1) / 2;
                int t = heap[p]; heap[p] = heap[i]; heap[i] = t; //@swapup > Swap with the parent and keep climbing
                i = p;
            }
        }
        int[] out = new int[n];
        for (int k = 0; k < n; k++) {
            out[k] = heap[0];                                    //@root > 3. Extract: the smallest value is always the root
            heap[0] = heap[--size];                              //@move > 4. Move the last value to the root, so the array has no gap
            int i = 0;
            while (2 * i + 1 < size) {
                int c = 2 * i + 1;
                if (c + 1 < size && heap[c + 1] < heap[c]) c++;  //@child > 5. Sift down: look at both children, take the smaller
                if (heap[c] >= heap[i]) break;                   //@down > 6. Stop when even the smaller child isn't smaller
                int t = heap[c]; heap[c] = heap[i]; heap[i] = t; //@swapdown > Otherwise swap with that child and keep sinking
                i = c;
            }
        }
        return out;
    }
}`,
        cpp: `class Solution {
public:
    vector<int> heapSorted(vector<int>& nums) {
        vector<int> heap, out;                                   //> A min-heap in a vector: the children of i sit at 2i+1 and 2i+2
        for (int x : nums) {
            heap.push_back(x);                                   //@append > 1. Insert: put the value in the first free slot, the end of the array
            int i = heap.size() - 1;
            while (i > 0 && heap[(i - 1) / 2] > heap[i]) {       //@up > 2. Sift up: while the parent is bigger, the new value is out of place
                int p = (i - 1) / 2;
                swap(heap[p], heap[i]);                          //@swapup > Swap with the parent and keep climbing
                i = p;
            }
        }
        while (!heap.empty()) {
            out.push_back(heap[0]);                              //@root > 3. Extract: the smallest value is always the root
            int last = heap.back();
            heap.pop_back();
            if (!heap.empty()) {
                heap[0] = last;                                  //@move > 4. Move the last value to the root, so the array has no gap
                int i = 0, n = heap.size();
                while (2 * i + 1 < n) {
                    int c = 2 * i + 1;
                    if (c + 1 < n && heap[c + 1] < heap[c]) c++; //@child > 5. Sift down: look at both children, take the smaller
                    if (heap[c] >= heap[i]) break;               //@down > 6. Stop when even the smaller child isn't smaller
                    swap(heap[c], heap[i]);                      //@swapdown > Otherwise swap with that child and keep sinking
                    i = c;
                }
            }
        }
        return out;
    }
};`
      },
      tests: { fn: { py: 'heap_sorted', default: 'heapSorted' }, sig: { args: ['int[]'] }, cases: [
        { args: [[5, 3, 8, 1, 9, 2]], out: [1, 2, 3, 5, 8, 9] }, { args: [[]], out: [] }, { args: [[7]], out: [7] }, { args: [[3, 3, 1, 1]], out: [1, 1, 3, 3] },
        { args: [[9, 8, 7, 6, 5, 4, 3, 2, 1]], out: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, { args: [[-4, 10, 0, -4, 2]], out: [-4, -4, 0, 2, 10] }] }
    },

    complexity: {
      time: 'push, pop O(log n) · peek O(1) · heapify O(n)',
      space: 'O(n)',
      why: 'The tree is complete, so its height is ⌊log₂ n⌋. A push climbs at most that many levels and a pop sinks at most that many, with O(1) work per level. Peeking reads index 0. Building a heap from n values by pushing each one costs O(n log n), but **bottom-up heapify** costs only O(n): half the nodes are leaves and never move, a quarter sink at most one level, an eighth at most two, and so on, which sums to a constant times n. A size-k heap over n items costs O(n log k) time and O(k) space.',
      trap: 'Three things trip people up. (1) `heapify` is O(n), not O(n log n); say so if asked to build a heap from an array. (2) “Top k of n” with a size-k heap is O(n log k), better than sorting’s O(n log n) when k is small, but if k is about n/2 the two are about equal. (3) **Removing an arbitrary element** is O(n) in `heapq`, Java’s `PriorityQueue.remove(x)` and C++ (no support at all). Use **lazy deletion** (mark it dead, skip it when it reaches the top) instead.'
    },

    variations: [
      {
        name: 'Heaps in each language',
        body: 'Know the library API cold, because you won’t hand-write the heap in a 45-minute interview. The big gotcha is direction. **Python** `heapq` is a **min-heap only**, over a plain list: `heappush`, `heappop`, `heapify`, `heap[0]` to peek, `heapreplace` (pop, then push) and `heappushpop` (push, then pop). For a max-heap, **negate the numbers** (and negate again on the way out). For objects, push tuples: `(priority, tiebreaker, item)`. Tuples compare left to right, and an unorderable item in third place raises an error if the first two tie, so add a counter as the tiebreaker. **Java** `PriorityQueue<T>` is a min-heap: `offer`/`add`, `poll`, `peek`. Pass `Collections.reverseOrder()` or a comparator such as `(a, b) -> Integer.compare(b, a)` for max. Don’t subtract in a comparator (`a - b` overflows). **C++** `priority_queue<T>` is a **max**-heap by default: `push`, `top`, `pop`. For a min-heap write `priority_queue<int, vector<int>, greater<int>>`. It has no way to iterate, and `top()` returns a reference, so copy it before you `pop()`. **JavaScript** has **no heap** in the language. Write a small class (the one below is about 25 lines), or say you’d use a library. Interviewers on JavaScript accept either.',
        code: {
          py: `def k_largest(nums, k):                  # the k largest values, biggest first
    heap = []                            #> Python's heapq is a min-heap on a plain list
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)          #> Evict the smallest: only the k largest survive
    return sorted(heap, reverse=True)`,
          js: HEAP + `
function kLargest(nums, k) {            // the k largest values, biggest first
  const heap = new Heap();              //> JavaScript has no heap: the class above stands in for one
  for (const x of nums) {
    heap.push(x);
    if (heap.size > k) heap.pop();      //> Evict the smallest: only the k largest survive
  }
  return heap.a.sort((a, b) => b - a);
}`,
          java: `class Solution {
    public int[] kLargest(int[] nums, int k) {          // the k largest values, biggest first
        PriorityQueue<Integer> heap = new PriorityQueue<>();  //> Java's PriorityQueue is a min-heap
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();           //> Evict the smallest: only the k largest survive
        }
        int[] out = new int[heap.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = heap.poll();  // pops come out ascending, so fill from the back
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> kLargest(vector<int>& nums, int k) {    // the k largest values, biggest first
        priority_queue<int, vector<int>, greater<int>> heap;  //> C++ defaults to a MAX-heap; greater<int> makes it a min-heap
        for (int x : nums) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();       //> Evict the smallest: only the k largest survive
        }
        vector<int> out(heap.size());
        for (int i = (int)out.size() - 1; i >= 0; i--) { out[i] = heap.top(); heap.pop(); }
        return out;
    }
};`
        },
        tests: { fn: { py: 'k_largest', default: 'kLargest' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 1, 5, 12, 2, 11], 3], out: [12, 11, 5] }, { args: [[5], 1], out: [5] }, { args: [[4, 4, 4], 2], out: [4, 4] }, { args: [[-1, -5, -3], 2], out: [-1, -3] }, { args: [[1, 2], 2], out: [2, 1] }] }
      },
      {
        name: 'Heapify: build a heap in O(n)',
        body: 'If you already have all the values, don’t push them one at a time (O(n log n)). Sift down every non-leaf node, from the last parent `n // 2 - 1` back to the root. Sinking from the bottom up means each node’s subtrees are already heaps when you reach it. Most nodes sit near the bottom and sink only a level or two, which is why the total is O(n). This is exactly what `heapq.heapify`, `new PriorityQueue<>(collection)` and `priority_queue(begin, end)` do for you.',
        code: {
          py: `def build_heap(nums):
    heap = nums[:]
    n = len(heap)
    for start in range(n // 2 - 1, -1, -1):  #> Leaves are already heaps: start at the last parent and work back to the root
        i = start
        while 2 * i + 1 < n:
            c = 2 * i + 1
            if c + 1 < n and heap[c + 1] < heap[c]:
                c += 1
            if heap[c] >= heap[i]:
                break
            heap[c], heap[i] = heap[i], heap[c]
            i = c
    return heap`,
          js: `function buildHeap(nums) {
  const heap = nums.slice(), n = heap.length;
  for (let start = (n >> 1) - 1; start >= 0; start--) {   //> Leaves are already heaps: start at the last parent and work back to the root
    let i = start;
    while (2 * i + 1 < n) {
      let c = 2 * i + 1;
      if (c + 1 < n && heap[c + 1] < heap[c]) c++;
      if (heap[c] >= heap[i]) break;
      [heap[c], heap[i]] = [heap[i], heap[c]];
      i = c;
    }
  }
  return heap;
}`,
          java: `class Solution {
    public int[] buildHeap(int[] nums) {
        int[] heap = nums.clone();
        int n = heap.length;
        for (int start = n / 2 - 1; start >= 0; start--) {   //> Leaves are already heaps: start at the last parent and work back to the root
            int i = start;
            while (2 * i + 1 < n) {
                int c = 2 * i + 1;
                if (c + 1 < n && heap[c + 1] < heap[c]) c++;
                if (heap[c] >= heap[i]) break;
                int t = heap[c]; heap[c] = heap[i]; heap[i] = t;
                i = c;
            }
        }
        return heap;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> buildHeap(vector<int>& nums) {
        vector<int> heap = nums;
        int n = heap.size();
        for (int start = n / 2 - 1; start >= 0; start--) {   //> Leaves are already heaps: start at the last parent and work back to the root
            int i = start;
            while (2 * i + 1 < n) {
                int c = 2 * i + 1;
                if (c + 1 < n && heap[c + 1] < heap[c]) c++;
                if (heap[c] >= heap[i]) break;
                swap(heap[c], heap[i]);
                i = c;
            }
        }
        return heap;
    }
};`
        },
        tests: { fn: { py: 'build_heap', default: 'buildHeap' }, sig: { args: ['int[]'] }, cases: [
          { args: [[5, 3, 8, 1, 9, 2]], out: [1, 3, 2, 5, 9, 8] }, { args: [[1, 2, 3]], out: [1, 2, 3] }, { args: [[3, 2, 1]], out: [1, 2, 3] },
          { args: [[9, 8, 7, 6, 5, 4, 3, 2, 1]], out: [1, 2, 3, 6, 5, 4, 7, 8, 9] }, { args: [[4]], out: [4] }, { args: [[]], out: [] }] }
      },
      {
        name: 'K-way merge',
        body: 'To merge k sorted lists, keep a min-heap holding **one candidate per list**: its current front value. Pop the smallest, append it to the output, and push the next value from the *same* list. The heap never holds more than k entries, so the merge costs O(N log k) for N total values, versus O(N log N) for dumping everything into one sort. Store `(value, list index, position)` so you know where to continue. It is also how you find the smallest range covering k lists, merge k sorted files too big for memory, and run the “k pairs with smallest sums” family.',
        code: {
          py: `def merge_k(lists):
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]   #> One candidate per non-empty list: (value, which list, position)
    heapq.heapify(heap)
    out = []
    while heap:
        val, i, j = heapq.heappop(heap)           #> The smallest candidate is the next output value
        out.append(val)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))   #> Replace it with the next value from the same list
    return out`,
          js: HEAP + `
function mergeK(lists) {
  const heap = new Heap((a, b) => a[0] < b[0]);   // compare by value
  lists.forEach((lst, i) => { if (lst.length) heap.push([lst[0], i, 0]); });   //> One candidate per non-empty list: [value, which list, position]
  const out = [];
  while (heap.size) {
    const [val, i, j] = heap.pop();               //> The smallest candidate is the next output value
    out.push(val);
    if (j + 1 < lists[i].length) heap.push([lists[i][j + 1], i, j + 1]);   //> Replace it with the next value from the same list
  }
  return out;
}`,
          java: `class Solution {
    public int[] mergeK(int[][] lists) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        int total = 0;
        for (int i = 0; i < lists.length; i++) {
            total += lists[i].length;
            if (lists[i].length > 0) heap.offer(new int[]{lists[i][0], i, 0});   //> One candidate per non-empty list: {value, which list, position}
        }
        int[] out = new int[total];
        int k = 0;
        while (!heap.isEmpty()) {
            int[] top = heap.poll();                      //> The smallest candidate is the next output value
            out[k++] = top[0];
            int i = top[1], j = top[2] + 1;
            if (j < lists[i].length) heap.offer(new int[]{lists[i][j], i, j});   //> Replace it with the next value from the same list
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> mergeK(vector<vector<int>>& lists) {
        using T = array<int, 3>;                          // {value, which list, position}
        priority_queue<T, vector<T>, greater<T>> heap;    // min-heap: arrays compare left to right
        for (int i = 0; i < (int)lists.size(); i++)
            if (!lists[i].empty()) heap.push({lists[i][0], i, 0});   //> One candidate per non-empty list
        vector<int> out;
        while (!heap.empty()) {
            auto [val, i, j] = heap.top();                //> The smallest candidate is the next output value
            heap.pop();
            out.push_back(val);
            if (j + 1 < (int)lists[i].size()) heap.push({lists[i][j + 1], i, j + 1});   //> Replace it with the next value from the same list
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'merge_k', default: 'mergeK' }, sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 4, 5], [1, 3, 4], [2, 6]]], out: [1, 1, 2, 3, 4, 4, 5, 6] }, { args: [[[], [2, 3]]], out: [2, 3] }, { args: [[[5]]], out: [5] },
          { args: [[[-3, 0], [-5, 7, 9], [1]]], out: [-5, -3, 0, 1, 7, 9] }, { args: [[]], out: [] }] }
      },
      {
        name: 'Quickselect: the k-th largest in expected O(n)',
        body: 'When you only need **one** rank and don’t need a stream, a heap does more work than necessary. Quickselect picks a random pivot, splits the values into bigger, equal and smaller, and then keeps only the side that holds the answer. Each round discards a constant fraction in expectation, so the total is expected O(n), against O(n log k) for the heap. The worst case is O(n²) (a random pivot makes that very unlikely). It changes the array order or copies it, and it can’t handle a stream. Say both in the interview: the heap for streams and small k, quickselect for a one-shot.',
        code: {
          py: `import random


def find_kth_largest_qs(nums, k):
    while True:
        p = random.choice(nums)                      #> A random pivot makes the bad worst case very unlikely
        bigger = [x for x in nums if x > p]
        same = sum(1 for x in nums if x == p)
        if k <= len(bigger):
            nums = bigger                            #> The answer is among the bigger values
        elif k <= len(bigger) + same:
            return p                                 #> The pivot itself holds rank k
        else:
            k -= len(bigger) + same                  #> Skip the values we just ruled out
            nums = [x for x in nums if x < p]`,
          js: `function findKthLargestQs(nums, k) {
  while (true) {
    const p = nums[Math.floor(Math.random() * nums.length)];   //> A random pivot makes the bad worst case very unlikely
    const bigger = nums.filter((x) => x > p);
    const same = nums.filter((x) => x === p).length;
    if (k <= bigger.length) nums = bigger;                     //> The answer is among the bigger values
    else if (k <= bigger.length + same) return p;              //> The pivot itself holds rank k
    else {
      k -= bigger.length + same;                               //> Skip the values we just ruled out
      nums = nums.filter((x) => x < p);
    }
  }
}`,
          java: `class Solution {
    public int findKthLargestQs(int[] nums, int k) {
        List<Integer> cur = new ArrayList<>();
        for (int x : nums) cur.add(x);
        Random rnd = new Random();
        while (true) {
            int p = cur.get(rnd.nextInt(cur.size()));      //> A random pivot makes the bad worst case very unlikely
            List<Integer> bigger = new ArrayList<>(), smaller = new ArrayList<>();
            int same = 0;
            for (int x : cur) {
                if (x > p) bigger.add(x);
                else if (x < p) smaller.add(x);
                else same++;
            }
            if (k <= bigger.size()) cur = bigger;          //> The answer is among the bigger values
            else if (k <= bigger.size() + same) return p;  //> The pivot itself holds rank k
            else { k -= bigger.size() + same; cur = smaller; }   //> Skip the values we just ruled out
        }
    }
}`,
          cpp: `class Solution {
public:
    int findKthLargestQs(vector<int>& nums, int k) {
        vector<int> cur = nums;
        while (true) {
            int p = cur[rand() % cur.size()];              //> A random pivot makes the bad worst case very unlikely
            vector<int> bigger, smaller;
            int same = 0;
            for (int x : cur) {
                if (x > p) bigger.push_back(x);
                else if (x < p) smaller.push_back(x);
                else same++;
            }
            if (k <= (int)bigger.size()) cur = bigger;     //> The answer is among the bigger values
            else if (k <= (int)bigger.size() + same) return p;   //> The pivot itself holds rank k
            else { k -= bigger.size() + same; cur = smaller; }   //> Skip the values we just ruled out
        }
    }
};`
        },
        tests: { fn: { py: 'find_kth_largest_qs', default: 'findKthLargestQs' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 2, 1, 5, 6, 4], 2], out: 5 }, { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], out: 4 }, { args: [[1], 1], out: 1 }, { args: [[7, 7, 7], 3], out: 7 }, { args: [[-1, -2, -3], 3], out: -3 }] }
      },
      {
        name: 'Two heaps and the median',
        body: 'A running median needs the **middle** of a growing set. Split the values into a lower half and an upper half: a **max**-heap for the lower half (its root is the largest of the small ones) and a **min**-heap for the upper half (its root is the smallest of the large ones). Keep their sizes equal, or the lower half one bigger. Then the median is the lower root, or the average of both roots. The first worked problem below builds it. The same split solves “sliding window median” and “IPO”-style problems, where you need the best of one group while moving items between groups.'
      },
      {
        name: 'Heaps and graphs, and when a heap is the wrong tool',
        body: 'The “always expand the cheapest frontier node” step of Dijkstra, Prim and A* is a min-heap of `(cost, node)`. You don’t decrease a key in place; you push a new entry and skip stale ones when they pop (**lazy deletion**). See [Shortest paths](#/topic/shortest-paths). A heap is the wrong tool when you need **sorted output** of everything (just sort), **lookup or delete by value** (use a hash map, or a sorted container), or you only ever need the min or max of a **fixed** array once (a single pass with one variable is O(n)). If the stream has a **fixed window** with expiring items, a [monotonic deque](#/topic/monotonic) is O(n) where a heap is O(n log n).'
      }
    ],

    worked: [
      {
        lc: 703,
        restate: 'Build a class that is given a number k and some starting values. Each call to `add(val)` inserts a new value into the stream and returns the **k-th largest** value seen so far, counting duplicates separately.',
        examples: '- k = 3, start `[4, 5, 8, 2]`: `add(3)` → 4, `add(5)` → 5, `add(10)` → 5, `add(9)` → 8, `add(4)` → 8.\n- Edge cases: fewer than k values at the start (the first adds fill the structure up); k = 1 (always the maximum); duplicates (`[7, 7, 7]` with k = 2 → 7).',
        brute: 'Keep a list, sort it after every add and read index k from the end: O(n log n) per add. Or keep a sorted list and insert in place: O(n) per add because of the shifting. Both slow down as the stream grows.',
        insight: 'You never need more than the **k largest** values. The k-th largest is the smallest of them. So keep exactly those k values in a **min**-heap: its root is the smallest of the k, which is the answer. A new value either beats the root (swap it in) or doesn’t (ignore it).',
        code: {
          py: `class KthLargest:
    def __init__(self, k: int, nums: List[int]):
        self.k = k
        self.heap = []              # min-heap holding the k largest values seen so far
        for x in nums:
            self.add(x)

    def add(self, val: int) -> int:
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, val)
        elif val > self.heap[0]:
            heapq.heapreplace(self.heap, val)   # pop the smallest, push val: one sift
        return self.heap[0]`,
          js: HEAP + `
class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new Heap();       // min-heap holding the k largest values seen so far
    for (const x of nums) this.add(x);
  }
  add(val) {
    this.heap.push(val);
    if (this.heap.size > this.k) this.heap.pop();   // evict the smallest
    return this.heap.peek();
  }
}`,
          java: `class KthLargest {
    private final PriorityQueue<Integer> heap = new PriorityQueue<>();  // min-heap holding the k largest values
    private final int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int x : nums) add(x);
    }

    public int add(int val) {
        heap.offer(val);
        if (heap.size() > k) heap.poll();   // evict the smallest
        return heap.peek();
    }
}`,
          cpp: `class KthLargest {
    priority_queue<int, vector<int>, greater<int>> heap;   // min-heap holding the k largest values
    int k;
public:
    KthLargest(int k, vector<int>& nums) : k(k) {
        for (int x : nums) add(x);
    }
    int add(int val) {
        heap.push(val);
        if ((int)heap.size() > k) heap.pop();   // evict the smallest
        return heap.top();
    }
};`
        },
        complexity: 'O(log k) per `add` (one push and at most one pop on a heap of size k), O(1) to read the answer. O(k) space. Building from n starting values costs O(n log k).',
        say: '“I only ever need the k largest values, and the k-th largest is the smallest of those. So I keep a min-heap capped at size k: its root is the answer. On each add I push, and if the heap now has more than k values I pop the smallest. That’s O(log k) per call and O(k) memory, no matter how long the stream gets.”',
        followups: [
          { q: 'Why a min-heap and not a max-heap?', a: 'The element to *evict* is the smallest of the k survivors, and the one to *report* is also the smallest of them. A min-heap puts that value at the root, so both are O(1) to find. A max-heap would put the wrong end on top.' },
          { q: 'What if the stream is huge and k is close to n?', a: 'Then log k is about log n and the heap saves little. Keep the **smaller** side: for the k-th largest with k near n, track the (n − k + 1) smallest values in a max-heap instead, if n is known.' },
          { q: 'What if the problem allowed removals too?', a: 'A plain heap can’t delete an arbitrary value efficiently. You’d use lazy deletion (a count map of removed values, skipped when they reach the top), or an ordered tree set.' },
          { q: 'Could you use `heappushpop` to do this in one call?', a: 'Yes, once the heap is full: `heapq.heappushpop(heap, val)` pushes then pops the smallest in a single sift, and it skips the push entirely when `val` is smaller than the root.' }
        ]
      },
      {
        lc: 215,
        restate: 'Given an unsorted array and an integer k, return the **k-th largest element** in sorted order (not the k-th distinct value). Duplicates count separately.',
        examples: '- `[3, 2, 1, 5, 6, 4]`, k = 2 → 5.\n- `[3, 2, 3, 1, 2, 4, 5, 5, 6]`, k = 4 → 4 (sorted descending: 6, 5, 5, 4, ...).\n- Edge cases: k = 1 is the maximum; k = n is the minimum; all values equal; negative numbers.',
        brute: 'Sort and index `n - k`: O(n log n) time. It’s correct and short, and a fine first answer, but it orders all n values when you only need one rank.',
        insight: 'Same size-k trick as the stream version, minus the class. Take the first k values and **heapify** them (O(k)). For each remaining value, if it beats the root (the smallest of the current top k), replace the root. After one pass the heap holds the k largest, and its root is the k-th largest.',
        code: {
          py: `class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        heap = nums[:k]
        heapq.heapify(heap)                  # min-heap of the k largest so far, built in O(k)
        for x in nums[k:]:
            if x > heap[0]:
                heapq.heapreplace(heap, x)   # evict the smallest of the k, keep x
        return heap[0]`,
          js: HEAP + `
function findKthLargest(nums, k) {
  const heap = new Heap();                // min-heap of the k largest so far
  for (const x of nums) {
    heap.push(x);
    if (heap.size > k) heap.pop();        // evict the smallest of the k + 1
  }
  return heap.peek();
}`,
          java: `class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();   // min-heap of the k largest so far
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();                  // evict the smallest of the k + 1
        }
        return heap.peek();
    }
}`,
          cpp: `class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;   // min-heap of the k largest so far
        for (int x : nums) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();              // evict the smallest of the k + 1
        }
        return heap.top();
    }
};`
        },
        complexity: 'O(n log k) time: each of the n values costs at most one push and one pop on a heap of size k. O(k) space. Quickselect (a variation above) is expected O(n) time with O(n) extra space in the copying version.',
        say: '“Sorting is O(n log n), but I only need one rank. I’ll keep a min-heap of size k: its root is the smallest of the k largest values so far, so any value that’s smaller can’t matter. One pass is O(n log k), and the root at the end is the answer. If you want better, quickselect gets expected O(n), at the cost of a worse worst case and no streaming.”',
        followups: [
          { q: 'Can you do better than O(n log k)?', a: 'Quickselect: expected O(n), worst case O(n²) with a bad pivot. Median-of-medians makes the worst case O(n) but is rarely worth writing in an interview. Name both, then say which you’d choose: the heap for streams or small k, quickselect for a one-shot on an array you can reorder.' },
          { q: 'What if k is larger than n / 2?', a: 'Flip it. The k-th largest is the (n − k + 1)-th smallest, so keep a max-heap of size n − k + 1 and read its root. The heap is then smaller.' },
          { q: 'What if the array is too big for memory?', a: 'The size-k heap already solves it: stream the values through and keep only k. If even k is too big, binary search on the value range with a counting pass over the data each round.' },
          { q: 'Do duplicates change anything?', a: 'No. Duplicates occupy separate slots in the heap, so `[5, 5, 4]` with k = 2 gives 5, which matches the k-th element in sorted order.' }
        ]
      },
      {
        lc: 295,
        restate: 'Design a structure with two operations: `addNum(num)` adds an integer from a stream, and `findMedian()` returns the median of everything added so far. For an even count the median is the average of the two middle values.',
        examples: '- `addNum(1)`, `addNum(2)`, `findMedian()` → 1.5; `addNum(3)`, `findMedian()` → 2.\n- Edge cases: a single number; duplicates; negative numbers; the median is a float (a whole number can print as `2.0`).',
        brute: 'Keep a list, sort it on every query and read the middle: O(n log n) per `findMedian`. Or insert each number in its sorted position with binary search: O(log n) to find the spot but O(n) to shift.',
        insight: 'The median is defined by the two values in the **middle** of sorted order, and nothing else. Split the values into a **lower half** and an **upper half**. Keep the lower half in a **max**-heap and the upper half in a **min**-heap, so the two middle candidates sit at the two roots. Rebalance after every add so the lower half has the same size as the upper, or one more.',
        code: {
          py: `class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negated values): the smaller half
        self.hi = []   # min-heap: the larger half

    def addNum(self, num: int) -> None:
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))   # the biggest of lo crosses over to hi
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))   # keep lo the same size or one bigger

    def findMedian(self) -> float:
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2`,
          js: HEAP + `
class MedianFinder {
  constructor() {
    this.lo = new Heap((a, b) => a > b);   // max-heap: the smaller half
    this.hi = new Heap();                  // min-heap: the larger half
  }
  addNum(num) {
    this.lo.push(num);
    this.hi.push(this.lo.pop());           // the biggest of lo crosses over to hi
    if (this.hi.size > this.lo.size) this.lo.push(this.hi.pop());   // keep lo the same size or one bigger
  }
  findMedian() {
    if (this.lo.size > this.hi.size) return this.lo.peek();
    return (this.lo.peek() + this.hi.peek()) / 2;
  }
}`,
          java: `class MedianFinder {
    private final PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder());  // max-heap: the smaller half
    private final PriorityQueue<Integer> hi = new PriorityQueue<>();                             // min-heap: the larger half

    public MedianFinder() {}

    public void addNum(int num) {
        lo.offer(num);
        hi.offer(lo.poll());                   // the biggest of lo crosses over to hi
        if (hi.size() > lo.size()) lo.offer(hi.poll());   // keep lo the same size or one bigger
    }

    public double findMedian() {
        if (lo.size() > hi.size()) return lo.peek();
        return ((double) lo.peek() + hi.peek()) / 2;
    }
}`,
          cpp: `class MedianFinder {
    priority_queue<int> lo;                                  // max-heap: the smaller half
    priority_queue<int, vector<int>, greater<int>> hi;       // min-heap: the larger half
public:
    MedianFinder() {}

    void addNum(int num) {
        lo.push(num);
        hi.push(lo.top()); lo.pop();                         // the biggest of lo crosses over to hi
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }   // keep lo the same size or one bigger
    }

    double findMedian() {
        if (lo.size() > hi.size()) return lo.top();
        return ((double)lo.top() + hi.top()) / 2;
    }
};`
        },
        complexity: 'O(log n) per `addNum` (a constant number of heap operations), O(1) per `findMedian`. O(n) space.',
        say: '“The median only depends on the middle one or two values. So I split the numbers into a lower half in a max-heap and an upper half in a min-heap. The roots are exactly the two middle candidates. On each add I push into the lower half, move its largest over to the upper half so everything in the lower half is ≤ everything in the upper half, and if the upper half got bigger I move its smallest back. The median is the lower root, or the average of the two roots. Adds are O(log n), the median is O(1).”',
        followups: [
          { q: 'Why push to `lo`, then move one to `hi`, instead of comparing with the roots?', a: 'Pushing through `lo` and then moving its maximum guarantees that every value in `lo` is ≤ every value in `hi`, whatever the new number is. That removes the “which side does it go to” branches and their off-by-one bugs.' },
          { q: 'What if nearly all numbers are between 0 and 100?', a: 'Keep a count array of size 101 plus a count of how many numbers fall outside. The median is then found by walking the counts: O(100) per query, O(1) per add. Say what you’d do about the few outliers (keep them in their own small sorted lists).' },
          { q: 'How would you support removing a number (a sliding window median)?', a: 'Heaps can’t delete arbitrary values quickly. Use lazy deletion: record the removal in a hash map, adjust the “balance” counters immediately, and discard stale values when they reach the top of a heap. Or use an ordered tree set with order statistics.' },
          { q: 'Why not keep one sorted array with `bisect.insort`?', a: 'The search is O(log n) but the shifting is O(n) per insert. It’s fine up to about 10⁵ numbers in practice, but the two heaps are O(log n) in the worst case.' }
        ]
      },
      {
        lc: 621,
        restate: 'You get a list of tasks, each a capital letter, and each task takes one unit of time. Two runs of the **same** letter must be separated by at least n units, which can be filled with other tasks or with idling. Return the **minimum total time** to finish all the tasks.',
        examples: '- `["A","A","A","B","B","B"]`, n = 2 → 8: `A B _ A B _ A B`.\n- n = 0 → just the number of tasks.\n- `["A","A","A","A","A","A","B","C","D","E","F","G"]`, n = 2 → 16: the A’s dictate the schedule and the others fill the gaps.\n- Edge cases: one task; many different tasks and a small n (no idling needed).',
        brute: 'Simulate time unit by unit with a max-heap of remaining counts and a queue of tasks on cooldown: always run the task with the most copies left that is off cooldown, else idle. It’s correct and runs in O(total time · log 26), but it needs bookkeeping, and there’s a closed form.',
        insight: 'The task with the highest frequency `top` sets the frame. Its copies need `top - 1` full gaps of length n between them, so the frame is `(top - 1) * (n + 1)` slots, followed by one final slot for each task that **ties** for the highest count. Every other task fits in the gaps. If the gaps overflow because there are lots of distinct tasks, nothing idles and the answer is just the number of tasks. So the answer is the larger of the two.',
        code: {
          py: `class Solution:
    def leastInterval(self, tasks: List[str], n: int) -> int:
        counts = Counter(tasks)
        top = max(counts.values())                       # copies of the most frequent task
        tied = sum(1 for c in counts.values() if c == top)   # how many tasks share that count
        return max(len(tasks), (top - 1) * (n + 1) + tied)`,
          js: `function leastInterval(tasks, n) {
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
  const top = Math.max(...counts.values());                   // copies of the most frequent task
  let tied = 0;
  for (const c of counts.values()) if (c === top) tied++;     // how many tasks share that count
  return Math.max(tasks.length, (top - 1) * (n + 1) + tied);
}`,
          java: `class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] counts = new int[26];
        for (char t : tasks) counts[t - 'A']++;
        int top = 0, tied = 0;
        for (int c : counts) {
            if (c > top) { top = c; tied = 1; }    // new highest count
            else if (c == top) tied++;             // another task shares it
        }
        return Math.max(tasks.length, (top - 1) * (n + 1) + tied);
    }
}`,
          cpp: `class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        int counts[26] = {0};
        for (char t : tasks) counts[t - 'A']++;
        int top = 0, tied = 0;
        for (int c : counts) {
            if (c > top) { top = c; tied = 1; }    // new highest count
            else if (c == top) tied++;             // another task shares it
        }
        return max((int)tasks.size(), (top - 1) * (n + 1) + tied);
    }
};`
        },
        complexity: 'O(m) time for m tasks (one counting pass; 26 letters is a constant). O(1) space: a fixed table of 26 counts. The heap simulation is O(total time · log 26), which is also linear, but with more code.',
        say: '“It’s greedy. The most frequent task forces the structure: if it appears `top` times, there are `top - 1` gaps of n units between its copies, so `(top - 1) * (n + 1)` slots, plus one last slot for each task tied for that top count. Other tasks fill the gaps for free. If there are enough different tasks that no idling is needed, the answer is just the number of tasks, so I take the max of the two. It’s O(m) with a table of counts. I’d use a max-heap simulation only if the question asked for the actual schedule.”',
        followups: [
          { q: 'Where does the heap come in?', a: 'The simulation: a max-heap of remaining counts picks the task with the most copies left among those off cooldown, and a queue holds tasks until their cooldown ends. It gives the actual order, not just the length, and it extends to variants like “reorganize string” (767) and “task scheduling with different cooldowns”.' },
          { q: 'Why the max with `len(tasks)`?', a: 'When there are many distinct tasks, the gaps between the top task’s copies overfill, every slot holds a real task, and no idling is needed. The frame formula then undercounts, because it assumes the other tasks fit inside the gaps. The task count is the floor.' },
          { q: 'Why add `tied` instead of 1?', a: 'If B also appears `top` times, it needs a slot after the last A as well. All tied tasks end the schedule together, one slot each.' }
        ]
      }
    ],

    practice: [
      { lc: 703,
        hints: ['You never need all the values, only the k largest.', 'The k-th largest is the smallest of the k largest, so keep those k values in a min-heap. The root is the answer.', 'On each add, push the value and pop the smallest if the heap holds more than k.'],
        starter: { py: 'class KthLargest:\n    def __init__(self, k: int, nums: List[int]):\n        pass\n\n    def add(self, val: int) -> int:\n        pass', js: 'class KthLargest {\n  constructor(k, nums) {\n    \n  }\n  add(val) {\n    \n  }\n}' },
        tests: { fn: 'KthLargest', design: true, cases: [
          { ops: ['KthLargest', 'add', 'add', 'add', 'add', 'add'], args: [[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]], out: [null, 4, 5, 5, 8, 8] },
          { ops: ['KthLargest', 'add', 'add', 'add', 'add'], args: [[4, [7, 7, 7, 7, 8, 3]], [2], [10], [9], [9]], out: [null, 7, 7, 7, 8] },
          { ops: ['KthLargest', 'add', 'add'], args: [[1, []], [-3], [-2]], out: [null, -3, -2] }] } },

      { lc: 1046,
        hints: ['Each round you need the two heaviest stones, and the pile keeps changing.', 'A heap that gives the largest first is exactly that. In Python and C++ remember the defaults: negate the values in Python.', 'Pop two, and if they differ push the difference back. Stop when one stone or none is left.'],
        solution: { explain: 'A max-heap of the weights. Pop the two heaviest, push back their difference if it’s not zero. Each stone is pushed and popped O(1) times per round, with up to n rounds, so O(n log n) time and O(n) space. (Python negates values because `heapq` is a min-heap.)', code: {
          py: `class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        heap = [-s for s in stones]      # negate: heapq is a min-heap, we want the heaviest first
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)     # heaviest
            b = -heapq.heappop(heap)     # second heaviest
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0`,
          js: HEAP + `
function lastStoneWeight(stones) {
  const heap = new Heap((a, b) => a > b);   // max-heap
  for (const s of stones) heap.push(s);
  while (heap.size > 1) {
    const a = heap.pop(), b = heap.pop();   // heaviest, then second heaviest
    if (a !== b) heap.push(a - b);
  }
  return heap.size ? heap.peek() : 0;
}` } },
        starter: { py: 'class Solution:\n    def lastStoneWeight(self, stones: List[int]) -> int:\n        ', js: 'function lastStoneWeight(stones) {\n  \n}' },
        tests: { fn: 'lastStoneWeight', cases: [
          { args: [[2, 7, 4, 1, 8, 1]], out: 1 }, { args: [[1]], out: 1 }, { args: [[3, 3]], out: 0 }, { args: [[10, 4, 2, 10]], out: 2 }, { args: [[9, 3, 2, 10]], out: 0 }] } },

      { lc: 973,
        hints: ['Squared distance `x*x + y*y` ranks the same as the real distance, so no square root is needed.', 'To keep the k **smallest** distances, keep a **max**-heap of size k: its root is the worst of the survivors, the first to be evicted.', 'Push each point with its distance, pop when the heap passes size k, and return what’s left.'],
        solution: { explain: 'A max-heap of size k keyed by squared distance. Each point is pushed once and evicts at most one, so O(n log k) time and O(k) space. (Python negates the key because `heapq` is a min-heap.) Quickselect would be expected O(n).', code: {
          py: `class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        heap = []                                        # max-heap of size k by distance (negated)
        for x, y in points:
            heapq.heappush(heap, (-(x * x + y * y), x, y))
            if len(heap) > k:
                heapq.heappop(heap)                      # evict the farthest of the k + 1
        return [[x, y] for _, x, y in heap]`,
          js: HEAP + `
function kClosest(points, k) {
  const heap = new Heap((a, b) => a[0] > b[0]);          // max-heap by squared distance
  for (const [x, y] of points) {
    heap.push([x * x + y * y, x, y]);
    if (heap.size > k) heap.pop();                       // evict the farthest of the k + 1
  }
  return heap.a.map(([, x, y]) => [x, y]);
}` } },
        starter: { py: 'class Solution:\n    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:\n        ', js: 'function kClosest(points, k) {\n  \n}' },
        tests: { fn: 'kClosest', compare: 'unordered', cases: [
          { args: [[[1, 3], [-2, 2]], 1], out: [[-2, 2]] }, { args: [[[3, 3], [5, -1], [-2, 4]], 2], out: [[3, 3], [-2, 4]] }, { args: [[[0, 1], [1, 0]], 2], out: [[0, 1], [1, 0]] },
          { args: [[[2, 2], [1, 1], [3, 3], [-1, 0]], 2], out: [[1, 1], [-1, 0]] }] } },

      { lc: 215,
        hints: ['Sorting works in O(n log n). Can you do better when k is small?', 'Keep the k largest values seen so far in a min-heap: push each number, and pop when the size passes k.', 'After the pass, the root is the k-th largest.'],
        starter: { py: 'class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ', js: 'function findKthLargest(nums, k) {\n  \n}' },
        tests: { fn: 'findKthLargest', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 2, 1, 5, 6, 4], 2], out: 5 }, { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], out: 4 }, { args: [[1], 1], out: 1 }, { args: [[-1, -1], 2], out: -1 }, { args: [[7, 6, 5, 4], 4], out: 4 }, { args: [[5, 2, 4, 1, 3, 6, 0], 4], out: 3 }] } },

      { lc: 621,
        hints: ['The most frequent task decides how much idle time you might need.', 'If it appears `top` times, there are `top - 1` gaps between its copies, each n units long, so `(top - 1) * (n + 1)` slots, plus a last slot for every task tied for that count.', 'If there are many distinct tasks, the gaps overfill and no idling is needed: the answer can never be below the number of tasks.'],
        starter: { py: 'class Solution:\n    def leastInterval(self, tasks: List[str], n: int) -> int:\n        ', js: 'function leastInterval(tasks, n) {\n  \n}' },
        tests: { fn: 'leastInterval', sig: { args: ['char[]', 'int'] }, cases: [
          { args: [['A', 'A', 'A', 'B', 'B', 'B'], 2], out: 8 }, { args: [['A', 'C', 'A', 'B', 'D', 'B'], 1], out: 6 }, { args: [['A', 'A', 'A', 'B', 'B', 'B'], 0], out: 6 },
          { args: [['A', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], 2], out: 16 }, { args: [['A'], 5], out: 1 }, { args: [['A', 'A', 'B', 'B', 'C', 'C'], 3], out: 7 }] } },

      { lc: 295,
        hints: ['The median depends only on the middle one or two values in sorted order.', 'Split the numbers into a lower half and an upper half: a max-heap for the lower, a min-heap for the upper, so both middles sit at the roots.', 'Keep the sizes equal (or the lower half one bigger), and the median is the lower root, or the average of the two roots.'],
        starter: { py: 'class MedianFinder:\n    def __init__(self):\n        pass\n\n    def addNum(self, num: int) -> None:\n        pass\n\n    def findMedian(self) -> float:\n        pass', js: 'class MedianFinder {\n  constructor() {\n    \n  }\n  addNum(num) {\n    \n  }\n  findMedian() {\n    \n  }\n}' },
        tests: { fn: 'MedianFinder', design: true, compare: 'float', cases: [
          { ops: ['MedianFinder', 'addNum', 'addNum', 'findMedian', 'addNum', 'findMedian'], args: [[], [1], [2], [], [3], []], out: [null, null, null, 1.5, null, 2] },
          { ops: ['MedianFinder', 'addNum', 'findMedian', 'addNum', 'findMedian'], args: [[], [-1], [], [-2], []], out: [null, null, -1, null, -1.5] },
          { ops: ['MedianFinder', 'addNum', 'addNum', 'addNum', 'addNum', 'findMedian'], args: [[], [5], [3], [8], [1], []], out: [null, null, null, null, null, 4] }] } }
    ],

    mistakes: [
      '**Using `heapq` as a max-heap.** It is a min-heap only. For the largest first, push `-x` and negate on the way out. Forgetting either the push or the pop negation is the most common heap bug in Python. A custom `__lt__` on your own class works too.',
      '**The wrong kind of heap for the job.** To keep the **k largest**, use a **min**-heap of size k (the root is what you evict). To keep the k smallest, use a **max**-heap. Using the opposite heap only works if you let it grow to n entries, which costs O(n log n) time and O(n) memory.',
      '**Expecting a heap to be sorted.** Only the root is guaranteed. `heap[1]` is not the second smallest (it’s one of the root’s two children). Printing or iterating a heap shows the array layout, not sorted order. Pop repeatedly, or `sorted()` it.',
      '**Ties on tuples.** `(priority, item)` falls back to comparing `item` when priorities tie, and that raises `TypeError` for objects that can’t be ordered (in Python 3, dicts, nodes). Put a counter in the middle: `(priority, next(counter), item)`. In Java, give the comparator a tiebreak.',
      '**Sift-down swaps with the wrong child.** Swap with the **smaller** child in a min-heap (the larger in a max-heap). Swapping with the other one leaves a child smaller than its new parent. Also check `c + 1 < n` before reading the right child.',
      '**Pushing every element when you only need k.** `heappush` for all n values, then popping k, is O(n log n) in time and O(n) in memory. The size-k heap is O(n log k) and O(k). When the whole array is already in hand, `heapify` is O(n).',
      '**Trying to delete or update an arbitrary element.** It’s O(n) in `heapq` and `PriorityQueue.remove`, and impossible in C++’s `priority_queue`. Use lazy deletion (skip stale entries when they surface), or push a fresh entry with the new priority, as in Dijkstra.',
      '**Language gotchas.** *Python:* `heapq.nlargest(k, nums)` is fine for a one-off, but `heapq.merge` returns an iterator, so wrap it in `list(...)`. *JavaScript:* there is no built-in heap; `Array.prototype.sort` with a comparator on every pop is O(n log n) each time and quietly turns a heap solution into O(n² log n). *Java:* a comparator like `(a, b) -> a - b` overflows for values near ±2³¹; use `Integer.compare(a, b)`. `PriorityQueue.toString()` and iteration show the internal array order, not sorted order. *C++:* `priority_queue` is a **max**-heap by default, and `top()` returns a reference: copy it before `pop()` or you’re reading freed memory.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of building a binary heap from an array of n values with bottom-up heapify?',
        choices: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'], answer: 0,
        explain: 'Half of the nodes are leaves and never move, a quarter sink at most one level, an eighth at most two, and so on. The sum of (nodes at height h) × h converges to a constant times n. Pushing n values one at a time is O(n log n), which is why `heapify` is the better call when you have everything up front.' },
      { kind: 'concept', q: 'In a binary min-heap stored in an array, where are the children of the node at index i (0-based)?',
        choices: ['2i + 1 and 2i + 2', '2i and 2i + 1', 'i + 1 and i + 2', '(i - 1) / 2 and (i + 1) / 2'], answer: 0,
        explain: 'The tree is complete, so level by level the array is the tree. Index 0 is the root, its children are 1 and 2, theirs are 3, 4 and 5, 6. The parent of i is `(i - 1) // 2`.' },
      { kind: 'pattern', q: 'You need the **k largest** of a long stream of numbers, using only O(k) memory. Which structure fits?',
        choices: ['A min-heap capped at size k', 'A max-heap holding every number', 'A sorted list holding every number', 'A hash set of the numbers'], answer: 0,
        explain: 'Keep the k best so far. The smallest of them is the first to be evicted when something better arrives, so you want it at the root: a **min**-heap. A max-heap of everything is O(n) memory.' },
      { kind: 'concept', q: 'After `extract-min` removes the root, which element is moved into the root’s place before sifting down?',
        choices: ['The last element of the array', 'The smaller child of the root', 'The largest element', 'The previously removed root'], answer: 0,
        explain: 'Moving the last element keeps the tree complete: the array shrinks by one at the end with no gap. It might be large, so it sinks (swapping with the smaller child each time) until the heap property holds again.' },
      { kind: 'pattern', q: 'Which of these is naturally a two-heaps problem?',
        choices: ['The median of a stream of numbers, after each new number', 'The longest substring with no repeated character', 'Check whether brackets are balanced', 'The maximum of every window of size k, in O(n)'], answer: 0,
        explain: 'A running median wants the middle values of a growing set: a max-heap for the lower half and a min-heap for the upper half put both middles at the roots. The substring problem is a sliding window, the brackets a stack, and window maximum is best done with a monotonic deque.' },
      { kind: 'bug', q: 'This is meant to return the 3 largest values, but it returns the 3 smallest. What’s wrong?',
        code: `def top3(nums):
    heap = []
    for x in nums:
        heapq.heappush(heap, -x)
        if len(heap) > 3:
            heapq.heappop(heap)
    return sorted(-v for v in heap)`,
        choices: ['Negating makes the heap evict the largest value, so only the 3 smallest survive. Drop the negation for a min-heap of the k largest', 'The size check should be `> 4`', '`sorted` should be called with `reverse=True`', 'The heap should be a list of tuples'], answer: 0,
        explain: 'With `-x` stored, the root is the *most negative* value, which is the **largest** x. Popping it evicts the largest, so the survivors are the smallest. To keep the k largest, push `x` itself and pop the smallest.' },
      { kind: 'complexity', q: 'Selecting the k largest of n values with a size-k heap takes…',
        choices: ['O(n log k) time and O(k) space', 'O(n log n) time and O(k) space', 'O(k log n) time and O(n) space', 'O(n) time and O(1) space'], answer: 0,
        explain: 'Each of the n values causes at most one push and one pop on a heap of size k, each O(log k). The heap never holds more than k + 1 items. (Quickselect gets expected O(n), but it isn’t a heap.)' },
      { kind: 'concept', q: 'Which statements about a binary heap are true? Pick every one that applies.',
        choices: ['Peeking at the minimum is O(1)', 'Deleting an arbitrary value is O(log n) if you have its value but not its position', 'Siblings are not ordered relative to each other', 'Reading the array front to back gives sorted order'], answer: [0, 2],
        explain: 'The root is the minimum, so peeking is O(1). The heap property only relates parents to children, so siblings (and the array as a whole) are not sorted. Finding an arbitrary value takes O(n) first, so delete-by-value isn’t O(log n) without an extra index map.' },
      { kind: 'pattern', q: 'You must merge k sorted lists, each long, into one sorted list. What’s the best time complexity in terms of N total values?',
        choices: ['O(N log k) with a min-heap of the k list fronts', 'O(N log N) by sorting everything', 'O(N · k) by scanning every front each time', 'O(N) with no extra structure'], answer: 0,
        explain: 'The heap holds one candidate per list, so each pop and push costs O(log k), and there are N of them. Sorting the whole thing (O(N log N)) ignores that the lists are already sorted. Scanning all fronts costs O(k) per output value.' }
    ],

    flashcards: [
      { id: 'array-layout', front: 'Heap stored in an array: where are the parent and children of index i?', back: 'Parent `(i - 1) // 2`. Children `2i + 1` and `2i + 2`. A complete tree needs no pointers.' },
      { id: 'heap-property', front: 'What exactly does the min-heap property guarantee?', back: 'Every node is ≤ its children, so the minimum is at the root. Nothing is promised between siblings or across subtrees, and the array is not sorted.' },
      { id: 'sift-up', front: 'Heap insert: what are the two steps?', back: 'Append at the end of the array, then sift up: while the value is smaller than its parent (min-heap), swap with the parent. O(log n).' },
      { id: 'sift-down', front: 'Heap extract-min: what are the steps?', back: 'Take the root, move the **last** element to the root, then sift down: swap with the **smaller** child until neither child is smaller. O(log n).' },
      { id: 'heapify', front: 'Build a heap from n values: what’s the fast way and its cost?', back: 'Sift down every non-leaf from index `n // 2 - 1` back to 0: O(n). Pushing one at a time is O(n log n).' },
      { id: 'topk-direction', front: 'Keep the k LARGEST of a stream: which heap, and why?', back: 'A **min**-heap of size k. The root is the smallest survivor, the first to be evicted; after the pass it’s also the k-th largest. (The k smallest use a max-heap.)' },
      { id: 'topk-cost', front: 'Top k of n with a size-k heap: time and space?', back: 'O(n log k) time, O(k) space. Sorting is O(n log n). Quickselect is expected O(n) but needs the whole array and can’t stream.' },
      { id: 'two-heaps', front: 'Running median: how do two heaps work?', back: 'A max-heap holds the lower half, a min-heap the upper half, sizes equal (or lower one bigger). The median is the lower root, or the average of both roots. O(log n) add, O(1) median.' },
      { id: 'kway', front: 'Merge k sorted lists with a heap: what goes in the heap, and what’s the cost?', back: 'One candidate per list: `(value, list index, position)`. Pop the smallest, push that list’s next. O(N log k) for N values.' },
      { id: 'py-max-heap', front: 'How do you get a max-heap in Python, Java and C++?', back: 'Python: `heapq` is min-only, so push `-x`. Java: `new PriorityQueue<>(Collections.reverseOrder())`. C++: `priority_queue<int>` is max by default; `greater<int>` makes it min.' },
      { id: 'lazy-delete', front: 'You need to remove or update an item that’s inside a heap. What do you do?', back: 'Don’t search for it (O(n)). Lazy deletion: mark it dead, or push a new entry, and skip stale entries when they reach the top (as in Dijkstra).' },
      { id: 'tuple-tie', front: 'Python heap of `(priority, item)` raises a TypeError on ties. Why, and the fix?', back: 'On equal priorities, tuple comparison moves on to `item`, which may not be orderable. Insert a unique counter: `(priority, count, item)`.' }
    ],

    deeper: [
      { title: 'heapq: heap queue algorithm (Python docs)', url: 'https://docs.python.org/3/library/heapq.html', time: 'about 15 min', note: 'The official reference, including the priority-queue implementation notes (tie-breaking tuples, removing entries lazily) and the `nlargest`, `nsmallest` and `merge` helpers.' },
      { title: 'PriorityQueue (Java SE API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html', time: 'about 10 min', note: 'Complexity guarantees per method (O(log n) offer and poll, O(n) remove(Object)), and the warning that iteration order isn’t sorted order.' },
      { title: 'std::priority_queue (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/priority_queue', time: 'about 10 min', note: 'Why it’s a max-heap by default, how to flip it with `greater<T>`, and the custom comparator form.' },
      { title: 'Binary Heap (VisuAlgo)', url: 'https://visualgo.net/en/heap', time: 'about 15 min', note: 'An animated heap with insert, extract and a build-in-O(n) heapify. A good second visualizer once the one on this page feels easy.' },
      { title: 'NeetCode roadmap: Heap / Priority Queue', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'Where the heap section sits in the NeetCode 150, with the order they suggest for these problems. Some course pages may ask you to sign in.' }
    ],

    detective: [
      { id: 'slowest-five', decoys: ['sorting', 'arrays-hashing', 'binary-search'],
        statement: 'A food-delivery app logs the minutes each order took, one order at a time, around the clock. The ops screen has room for a single number: the time of the fifth-slowest order so far. After every new order it must show the updated value, and the app can keep only a handful of times in memory, no matter how many orders have come in.',
        why: 'A bounded memory budget on a never-ending stream rules out keeping and re-sorting everything. Keeping only the five worst times, with the smallest of those at the front so it’s the first to be replaced when a worse one arrives, is a size-k heap: O(log k) per order.' },
      { id: 'ward-records', decoys: ['sorting', 'two-pointers', 'linked-lists'],
        statement: 'A hospital group has forty wards. Each ward’s system prints that ward’s patient arrival times in order, earliest first, and every list is very long. The records office wants one combined list in chronological order, but the machine can only hold a few dozen timestamps at a time besides the output it is writing.',
        why: 'Every input is already ordered, so the next output is always the earliest of the current fronts of the forty lists. Holding one front per list, taking the smallest and replacing it with that list’s next value, is a k-way merge on a min-heap: O(N log k) with k entries in memory.' },
      { id: 'typical-fare', decoys: ['sorting', 'binary-search', 'prefix-sums'],
        statement: 'A ride-share company receives each trip’s fare as the trip ends, in no particular order. After every trip, a dashboard must show the middle fare: the one with as many fares below it as above it (the average of the two middle ones when the count is even). There can be millions of trips in a day, so the dashboard can’t re-sort the whole list for each update.',
        why: 'The middle fare depends only on the one or two values at the centre of sorted order. Splitting the fares into a lower half and an upper half, with the largest of the lower and the smallest of the upper available instantly, is two heaps: a max-heap and a min-heap, balanced to the same size. Adds are O(log n); the median is O(1).' }
    ]
  });
})();
