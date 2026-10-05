/* Offer Ready: Your language for DSA, a cheat-sheet lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'language',

    hook: 'You get about 35 minutes and no search bar. The candidate who already knows which container to grab, and what each call costs, spends those minutes on the problem instead of on syntax. Most “I was close” interview endings are really a wrong container (a list used as a queue), a silent overflow, or a comparator that sorts the wrong way. This page is the cheat sheet to read once and keep open.',

    cues: [
      'You need to ask “have I seen this?” or “how many times?”: reach for a **hash set** or a **hash map**, never a scan of a list.',
      'You remove from the **front** and add to the back (BFS, a sliding window of recent events): you want a real **deque**, not a list.',
      'You repeatedly need the **smallest or largest** of a collection that keeps changing: a **heap** (priority queue).',
      'The order depends on more than one thing (count, then name; start, then end): a **comparator** or a key function.',
      'Values or sums can pass about 2.1 billion, or you multiply two ints: think **overflow** before you code.',
      'You build a string one piece at a time inside a loop: use the language’s string builder, not repeated `+`.'
    ],

    intuition: [
      'Think of the four languages as four toolboxes. Each has a hammer, a saw and a level, but they carry different names, and a few tools are missing from a few boxes. JavaScript has no heap. Python has no sorted tree. C++’s heap puts the *largest* element on top. Knowing which tool is missing before the interview is worth more than knowing a clever trick.',
      'Here is the map. Memorize the row for your language and skim the others, because interviewers sometimes ask you to read someone else’s solution.',
      '| You need | Python | JavaScript | Java | C++ |\n| --- | --- | --- | --- | --- |\n| Dynamic array | `list` | `Array` | `ArrayList` | `vector` |\n| Hash map | `dict` | `Map` | `HashMap` | `unordered_map` |\n| Hash set | `set` | `Set` | `HashSet` | `unordered_set` |\n| Stack | `list` (`append`, `pop`) | `Array` (`push`, `pop`) | `ArrayDeque` (`push`, `pop`) | `stack` or `vector` |\n| Queue or deque | `collections.deque` | none: array plus a head index | `ArrayDeque` | `queue` or `deque` |\n| Min-heap | `heapq` | none: write one | `PriorityQueue` | `priority_queue` with `greater<>` |\n| Max-heap | `heapq` with negated values | none: write one | `PriorityQueue` with a reversed comparator | `priority_queue` (the default) |\n| Sorted map or set | none: keep a list and use `bisect` | none | `TreeMap`, `TreeSet` | `map`, `set` |\n| Sort | `sorted`, `list.sort` | `Array.sort` | `Arrays.sort`, `List.sort` | `std::sort` |',
      'And what each move costs. Hash costs are averages: a hash map can degrade to O(n) per call if many keys collide, but with ordinary data you can treat them as constant.',
      '| Operation | Cost |\n| --- | --- |\n| Hash map or set: get, put, contains, remove | O(1) average |\n| Dynamic array: push or pop at the end | O(1) amortized |\n| Dynamic array: insert or remove at the front or middle | O(n) |\n| `x in list`, `list.indexOf(x)`, `find` over a vector | O(n) |\n| Deque: push or pop at either end | O(1) |\n| Heap: push, pop | O(log n) |\n| Heap: peek the top | O(1) |\n| Heap: build from n items (`heapify`) | O(n) |\n| Sorted tree (`TreeMap`, `map`): get, put, remove | O(log n) |\n| Sort n items | O(n log n) |',
      'The habit this builds: before you write a loop, name the container and the operation inside it, then check the cost in the table. A `list.pop(0)` inside a loop of n is an O(n²) program wearing an O(n) costume.'
    ].join('\n\n'),

    viz: 'containers',

    template: {
      title: 'Count, order with a comparator, take the top: a three-container skeleton',
      note: 'This is the shape of a huge share of easy and medium problems: **count with a hash map**, **order the keys with a comparator**, **slice off what you need**. The comparator reads “higher count first; if tied, smaller value first”. Change the comparator and the slice, and the same skeleton ranks words, scores or intervals. If only the top k matter and k is small, a heap of size k beats the full sort (see the first variation below).',
      code: {
        py: `def top_k(nums, k):
    counts = {}                                           #> A hash map: value -> how many times it appears
    for x in nums:                                        #@count > 1. Count: one O(1) average map update per element
        counts[x] = counts.get(x, 0) + 1
    keys = sorted(counts, key=lambda x: (-counts[x], x))  #@sort > 2. Order the distinct values: count high to low, ties by smaller value
    return keys[:k]                                       #@take > 3. Take the first k (a slice past the end is just shorter)`,
        js: `function topK(nums, k) {
  const counts = new Map();                                //> A hash map: value -> how many times it appears
  for (const x of nums) {                                  //@count > 1. Count: one O(1) average map update per element
    counts.set(x, (counts.get(x) || 0) + 1);
  }
  const keys = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a - b);  //@sort > 2. Order the distinct values: count high to low, ties by smaller value
  return keys.slice(0, k);                                 //@take > 3. Take the first k (a slice past the end is just shorter)
}`,
        java: `class Solution {
    public int[] topK(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();      //> A hash map: value -> how many times it appears
        for (int x : nums) {                                 //@count > 1. Count: one O(1) average map update per element
            counts.merge(x, 1, Integer::sum);
        }
        List<Integer> keys = new ArrayList<>(counts.keySet());
        keys.sort((a, b) -> counts.get(a).equals(counts.get(b)) ? Integer.compare(a, b) : Integer.compare(counts.get(b), counts.get(a)));  //@sort > 2. Order the distinct values: count high to low, ties by smaller value
        int size = Math.min(k, keys.size());                 //@take > 3. Take the first k
        int[] out = new int[size];
        for (int i = 0; i < size; i++) out[i] = keys.get(i);
        return out;
    }
}`,
        cpp: `class Solution {
public:
    vector<int> topK(vector<int>& nums, int k) {
        unordered_map<int, int> counts;                      //> A hash map: value -> how many times it appears
        for (int x : nums) {                                 //@count > 1. Count: one O(1) average map update per element
            counts[x]++;
        }
        vector<int> keys;
        for (auto& entry : counts) keys.push_back(entry.first);
        sort(keys.begin(), keys.end(), [&](int a, int b) {   //@sort > 2. Order the distinct values: count high to low, ties by smaller value
            return counts[a] != counts[b] ? counts[a] > counts[b] : a < b;
        });
        keys.resize(min(k, (int)keys.size()));               //@take > 3. Take the first k
        return keys;
    }
};`
      },
      tests: { fn: { py: 'top_k', default: 'topK' }, sig: { args: ['int[]', 'int'] }, cases: [
        { args: [[1, 1, 1, 2, 2, 3], 2], out: [1, 2] }, { args: [[1], 1], out: [1] }, { args: [[4, 4, 5, 5, 6], 2], out: [4, 5] },
        { args: [[-1, -1, 2, 2, -3], 3], out: [-1, 2, -3] }, { args: [[5, 3, 5, 3, 1], 5], out: [3, 5, 1] }, { args: [[], 2], out: [] }] }
    },

    complexity: {
      time: 'O(n + m log m)',
      space: 'O(m)',
      why: 'Counting is one O(1) average update per element: O(n). Sorting the m distinct values costs O(m log m) comparisons, and each comparison is two map lookups, still O(1). In the worst case m = n, so the whole skeleton is O(n log n). Space is the map plus the key list: O(m). The container, not the loop, sets the bill: the same counting loop over a list of pairs (searching it for each element) would be O(n·m).',
      trap: 'Don’t say “hash maps are O(1)” without the word **average**, and don’t forget what you pay in other places. Sorting with a comparator is O(n log n), never O(n). A heap of size k does the top-k job in O(n log k), which is a real improvement only when k is much smaller than n. In C++, also remember that a `vector` insert at the front is O(n).'
    },

    variations: [
      {
        name: 'Heap: the k-th largest without sorting',
        body: 'A **min-heap of size k** holds the k largest values seen so far. The root is the smallest of those, so when a new value pushes the size past k, you pop the root: it can’t be among the k largest. After the pass, the root is the k-th largest. That’s O(n log k) time and O(k) space. Three language facts matter here. Python’s `heapq` is **min-only**; for a max-heap, push negated values. Java’s `PriorityQueue` is a min-heap by default. C++’s `priority_queue` is a **max**-heap by default, so pass `greater<int>` to flip it. JavaScript has **no** heap at all: you write the 25 lines below, or say so out loud and ask whether you may assume one.',
        code: {
          py: `import heapq

def kth_largest(nums, k):
    heap = []                        #> A min-heap holding the k largest values seen so far
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)      #> Drop the smallest: it can't be among the k largest
    return heap[0]                   # the root is the k-th largest`,
          js: `class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(x) {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {                  //> Sift up: swap with the parent while smaller
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {                     //> Sift down: swap with the smaller child while it is smaller
        let m = i;
        const l = 2 * i + 1, r = l + 1;
        if (l < a.length && a[l] < a[m]) m = l;
        if (r < a.length && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

function kthLargest(nums, k) {
  const heap = new MinHeap();
  for (const x of nums) {
    heap.push(x);
    if (heap.size > k) heap.pop();
  }
  return heap.peek();
}`,
          java: `class Solution {
    public int kthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();   //> A min-heap by default
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();                  //> Drop the smallest: it can't be among the k largest
        }
        return heap.peek();
    }
}`,
          cpp: `class Solution {
public:
    int kthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;   //> greater<> turns the default max-heap into a min-heap
        for (int x : nums) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();              //> Drop the smallest: it can't be among the k largest
        }
        return heap.top();
    }
};`
        },
        tests: { fn: { py: 'kth_largest', default: 'kthLargest' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[3, 2, 1, 5, 6, 4], 2], out: 5 }, { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], out: 4 }, { args: [[1], 1], out: 1 }, { args: [[-1, -2], 2], out: -2 }] }
      },
      {
        name: 'Deque: O(1) at both ends',
        body: 'A queue that forgets old entries from the front is the heart of BFS, “recent events” counters and sliding windows. Use a real deque: Python’s `collections.deque` (`popleft`), Java’s `ArrayDeque` (`pollFirst`), C++’s `deque` or `queue` (`pop_front`). Never `list.pop(0)` in Python or `remove(0)` on a Java `ArrayList`: both shift every element, which is O(n) per call. JavaScript has no deque, and `array.shift()` can cost O(n), so keep a **head index** and just move it forward. Two C++ details: `queue::pop()` returns nothing, so read `front()` first; and Java’s `ArrayDeque` rejects `null`.',
        code: {
          py: `import collections

def recent_counts(times, window):
    q = collections.deque()
    out = []
    for t in times:
        q.append(t)
        while q[0] < t - window:     #> Expired entries are always at the front
            q.popleft()
        out.append(len(q))
    return out`,
          js: `function recentCounts(times, window) {
  const q = [];
  let head = 0;                                 //> No deque in JS: move a head index instead of shift()
  const out = [];
  for (const t of times) {
    q.push(t);
    while (q[head] < t - window) head++;        //> Expired entries are always at the front
    out.push(q.length - head);
  }
  return out;
}`,
          java: `class Solution {
    public int[] recentCounts(int[] times, int window) {
        Deque<Integer> q = new ArrayDeque<>();
        int[] out = new int[times.length];
        for (int i = 0; i < times.length; i++) {
            q.addLast(times[i]);
            while (q.peekFirst() < times[i] - window) q.pollFirst();   //> Expired entries are always at the front
            out[i] = q.size();
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> recentCounts(vector<int>& times, int window) {
        deque<int> q;
        vector<int> out;
        for (int t : times) {
            q.push_back(t);
            while (q.front() < t - window) q.pop_front();   //> Expired entries are always at the front
            out.push_back(q.size());
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'recent_counts', default: 'recentCounts' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 100, 3001, 3002], 3000], out: [1, 2, 3, 3] }, { args: [[5], 10], out: [1] }, { args: [[1, 2, 3, 4], 1], out: [1, 2, 2, 2] }, { args: [[10, 20, 30], 5], out: [1, 1, 1] }] }
      },
      {
        name: 'Sorting with a comparator, and the traps in each language',
        body: 'Python sorts with a **key function** (`key=lambda w: (len(w), w)`): return a tuple and it compares left to right. For true comparator logic, `functools.cmp_to_key`. The sort is stable. JavaScript’s `sort()` with no argument converts everything to **strings**, so `[10, 9, 1].sort()` gives `[1, 10, 9]`; always pass `(a, b) => a - b`. Its comparator must return a negative, zero or positive number, not a boolean. Java sorts objects with a `Comparator` (use `Integer.compare`, never subtraction, because `a - b` can overflow); you cannot give a comparator to a primitive `int[]`, so use `Integer[]` or sort an array of arrays. C++’s `std::sort` is **not stable** (use `stable_sort` when ties must keep their order), and its comparator must be a strict “less than”: returning `<=` for equal items is undefined behavior and can crash.',
        code: {
          py: `def sort_words(words):
    return sorted(words, key=lambda w: (len(w), w))   #> A tuple key: length first, then the word itself`,
          js: `function sortWords(words) {
  return [...words].sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0));   //> A number from a comparator; a copy keeps the input intact
}`,
          java: `class Solution {
    public String[] sortWords(String[] words) {
        String[] out = words.clone();
        Arrays.sort(out, Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));   //> Chain comparators: length, then natural order
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<string> sortWords(vector<string>& words) {
        vector<string> out = words;
        sort(out.begin(), out.end(), [](const string& a, const string& b) {
            if (a.size() != b.size()) return a.size() < b.size();
            return a < b;                                  //> Strict less-than: equal items must return false
        });
        return out;
    }
};`
        },
        tests: { fn: { py: 'sort_words', default: 'sortWords' }, sig: { args: ['str[]'] }, cases: [
          { args: [['pear', 'fig', 'apple', 'kiwi', 'date']], out: ['fig', 'date', 'kiwi', 'pear', 'apple'] }, { args: [['b', 'a', 'B']], out: ['B', 'a', 'b'] }, { args: [[]], out: [] }, { args: [['aa', 'b', 'ab', 'a']], out: ['a', 'b', 'aa', 'ab'] }] }
      },
      {
        name: 'Integer overflow, and a safe midpoint',
        body: 'Python integers never overflow. JavaScript numbers are doubles: integers are exact only up to 2⁵³ − 1 (`Number.MAX_SAFE_INTEGER`), and bitwise operators silently cut to 32 bits; use `BigInt` past that. **Java** `int` is 32-bit and **wraps around silently** at 2³¹ − 1 = 2,147,483,647. **C++** signed overflow is *undefined behavior*, not even a guaranteed wrap. Fixes: use `long` (Java) or `long long` (C++); cast **before** you multiply (`(long) a * b`, since `(long)(a * b)` overflows first); and compute a midpoint as `lo + (hi - lo) / 2`, never `(lo + hi) / 2`. Two more classics: `Math.abs(Integer.MIN_VALUE)` is still negative in Java, and `-INT_MIN` overflows in C++.',
        code: {
          py: `def safe_mid(lo, hi):
    return lo + (hi - lo) // 2       #> Subtract first: hi - lo never exceeds the range`,
          js: `function safeMid(lo, hi) {
  return lo + Math.floor((hi - lo) / 2);   //> Math.floor, because / is a float divide in JS
}`,
          java: `class Solution {
    public int safeMid(int lo, int hi) {
        return lo + (hi - lo) / 2;         //> (lo + hi) / 2 can overflow int when both are large
    }
}`,
          cpp: `class Solution {
public:
    int safeMid(int lo, int hi) {
        return lo + (hi - lo) / 2;         //> (lo + hi) / 2 can overflow int when both are large
    }
};`
        },
        tests: { fn: { py: 'safe_mid', default: 'safeMid' }, sig: { args: ['int', 'int'] }, cases: [
          { args: [2147483000, 2147483600], out: 2147483300 }, { args: [0, 10], out: 5 }, { args: [3, 4], out: 3 }, { args: [-5, 5], out: 0 }, { args: [-7, -2], out: -5 }] }
      },
      {
        name: 'Strings: immutability, building and comparing',
        body: 'Strings are **immutable** in Python, JavaScript and Java, so `s += ch` in a loop copies the string each time: O(n²) in the worst case. Collect pieces and join once: `"".join(parts)` in Python, `parts.join("")` in JavaScript, `StringBuilder` in Java. C++ `std::string` is mutable, and `+=` appends in place, which is fine. Also remember: slicing (`s[i:j]`, `substring`, `substr`) **copies**, so it costs O(length). Java’s `==` on strings compares references, so use `.equals()`. JavaScript strings are sequences of 16-bit units, so one emoji has `length` 2. For letters, use arithmetic on character codes: `ord(c) - ord("a")` in Python, `s.charCodeAt(i) - 97` in JavaScript, `s.charAt(i) - \'a\'` in Java, `s[i] - \'a\'` in C++, each giving a 0 to 25 index for a lowercase letter.',
        code: {
          py: `def reverse_words(s):
    return " ".join(reversed(s.split()))   #> split() with no argument skips runs of spaces; join builds once`,
          js: `function reverseWords(s) {
  return s.trim().split(/\\s+/).reverse().join(' ');   //> trim first: an edge space would create an empty word
}`,
          java: `class Solution {
    public String reverseWords(String s) {
        String[] parts = s.trim().split("\\\\s+");          //> trim first, then split on runs of whitespace
        StringBuilder sb = new StringBuilder();              //> Build once; no += in a loop
        for (int i = parts.length - 1; i >= 0; i--) {
            sb.append(parts[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString();
    }
}`,
          cpp: `class Solution {
public:
    string reverseWords(string s) {
        istringstream in(s);                                 //> >> skips any amount of whitespace
        string word;
        vector<string> parts;
        while (in >> word) parts.push_back(word);
        string out;
        for (int i = (int)parts.size() - 1; i >= 0; i--) {
            out += parts[i];                                 //> += on a std::string appends in place
            if (i > 0) out += ' ';
        }
        return out;
    }
};`
        },
        tests: { fn: { py: 'reverse_words', default: 'reverseWords' }, sig: { args: ['str'] }, cases: [
          { args: ['  the sky  is blue '], out: 'blue is sky the' }, { args: ['a'], out: 'a' }, { args: ['hello   world'], out: 'world hello' }, { args: [''], out: '' }] }
      },
      {
        name: 'Hash keys: what you can and can’t use',
        body: 'Python keys must be hashable: tuples and strings work, `list` doesn’t, so turn it into `tuple(row)`. JavaScript `Map` keys compare by **identity** for arrays and objects, so `map.get([1, 2])` finds nothing; join the parts into a string key (`row.join(",")`) instead. Plain objects coerce every key to a string. Java `HashMap` needs `equals` and `hashCode`: a `List<Integer>` works as a key, an `int[]` does not (identity again). C++ `unordered_map` has no built-in hash for `pair` or `vector`; use `map` (a sorted tree, O(log n)), encode the pair into one `long long`, or write a hasher. Also: `map[key]` in C++ **inserts** a default value when the key is missing, and Python’s `d[key]` raises `KeyError`, so reach for `.get`, `defaultdict` or `Counter`.'
      }
    ],

    worked: [
      {
        lc: 347,
        restate: 'Given an integer array and a number k, return the k values that appear most often. The answer is guaranteed to be unique, and the order of the result doesn’t matter.',
        examples: '- `nums = [1,1,1,2,2,3]`, k = 2 → `[1,2]`.\n- `nums = [1]`, k = 1 → `[1]`.\n- Edge cases: all values distinct (every count is 1); k equal to the number of distinct values; negative numbers.',
        brute: 'Count with a map, then sort all distinct values by count: O(n log n). Perfectly acceptable to state first. It’s the template on this page.',
        insight: 'A count can never exceed n, so counts are small integers you can use as **array indexes**. Put each value in a bucket numbered by its count, then walk the buckets from high to low until you have k values. No comparison sort, and no heap: O(n).',
        code: {
          py: `class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        counts = Counter(nums)
        buckets = [[] for _ in range(len(nums) + 1)]   # buckets[c] = values that appear exactly c times
        for x, c in counts.items():
            buckets[c].append(x)
        out = []
        for c in range(len(nums), 0, -1):              # highest count first
            for x in buckets[c]:
                out.append(x)
                if len(out) == k:
                    return out
        return out`,
          js: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const x of nums) counts.set(x, (counts.get(x) || 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);   // buckets[c] = values that appear exactly c times
  for (const [x, c] of counts) buckets[c].push(x);
  const out = [];
  for (let c = nums.length; c > 0; c--) {                              // highest count first
    for (const x of buckets[c]) {
      out.push(x);
      if (out.length === k) return out;
    }
  }
  return out;
}`,
          java: `class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : nums) counts.merge(x, 1, Integer::sum);
        List<List<Integer>> buckets = new ArrayList<>();       // buckets.get(c) = values that appear exactly c times
        for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
        for (Map.Entry<Integer, Integer> e : counts.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        int[] out = new int[k];
        int size = 0;
        for (int c = nums.length; c > 0 && size < k; c--) {    // highest count first
            for (int x : buckets.get(c)) {
                if (size < k) out[size++] = x;
            }
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> counts;
        for (int x : nums) counts[x]++;
        vector<vector<int>> buckets(nums.size() + 1);   // buckets[c] = values that appear exactly c times
        for (auto& entry : counts) buckets[entry.second].push_back(entry.first);
        vector<int> out;
        for (int c = (int)nums.size(); c > 0 && (int)out.size() < k; c--) {   // highest count first
            for (int x : buckets[c]) {
                if ((int)out.size() < k) out.push_back(x);
            }
        }
        return out;
    }
};`
        },
        complexity: 'O(n) time: one counting pass, one pass to fill buckets, one walk over at most n + 1 buckets. O(n) space for the map and buckets.',
        say: '“I’ll count each value with a hash map. Sorting the distinct values by count would be O(n log n). But a count is at most n, so I can bucket values by count in an array of size n + 1 and read the buckets from the top until I have k values. That’s O(n) time and O(n) space. If k were tiny and n huge, a min-heap of size k would give O(n log k) with less memory.”',
        followups: [
          { q: 'How would you do it with a heap, and when is that better?', a: 'Keep a min-heap of at most k (count, value) pairs: push each pair, pop when the size passes k. O(m log k) for m distinct values, and only O(k) extra space. It wins when k is far smaller than the number of distinct values, or when the data arrives as a stream.' },
          { q: 'Why not just sort the map entries?', a: 'You can, and it’s fine: O(m log m). Say so, then offer the bucket version as the linear-time upgrade.' },
          { q: 'What if the answer weren’t guaranteed unique?', a: 'Then you need a tie rule from the interviewer (smaller value first, say), which turns the bucket walk or the sort into a comparator question, as in the template.' }
        ]
      },
      {
        lc: 49,
        restate: 'Given a list of strings, group together the ones that are anagrams of each other (the same letters in a different order). Return the groups in any order.',
        examples: '- `["eat","tea","tan","ate","nat","bat"]` → `[["bat"],["nat","tan"],["ate","eat","tea"]]`, in any order.\n- `[""]` → `[[""]]`.\n- Edge cases: a single string; strings with the same letters but different counts (`"aab"` vs `"abb"`) are not anagrams.',
        brute: 'Compare every pair of strings with a letter-count check, merging groups: O(n² · L). Too slow at 10⁴ strings.',
        insight: 'Two strings are anagrams exactly when their **sorted letters are the same string**. Use that as a hash-map key: map from “sorted form” to the list of originals. Each word goes straight to its group, with no pairwise comparison.',
        code: {
          py: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = defaultdict(list)
        for s in strs:
            groups["".join(sorted(s))].append(s)   # the sorted letters are the key
        return list(groups.values())`,
          js: `function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');   // the sorted letters are the key
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}`,
          java: `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] letters = s.toCharArray();
            Arrays.sort(letters);
            String key = new String(letters);   // the sorted letters are the key
            groups.computeIfAbsent(key, x -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;
        for (const string& s : strs) {
            string key = s;
            sort(key.begin(), key.end());   // the sorted letters are the key
            groups[key].push_back(s);
        }
        vector<vector<string>> out;
        for (auto& entry : groups) out.push_back(entry.second);
        return out;
    }
};`
        },
        tests: { fn: 'groupAnagrams', compare: 'deep', sig: { args: ['str[]'] }, cases: [
          { args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], out: [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']] }, { args: [['']], out: [['']] }, { args: [['a']], out: [['a']] }, { args: [['aab', 'abb', 'baa']], out: [['aab', 'baa'], ['abb']] }] },
        complexity: 'O(n · L log L) time for n strings of length at most L, because each is sorted once. O(n · L) space for the groups. With 26-slot count tuples as keys it drops to O(n · L).',
        say: '“Anagrams share the same multiset of letters, so the sorted string is a canonical form. I’ll key a hash map by it, append each word to its group, and return the map’s values. Sorting a word of length L costs L log L, so the total is O(n · L log L). If L is large I can use a tuple of 26 counts as the key and make it O(n · L).”',
        followups: [
          { q: 'How would the key work without sorting?', a: 'Count the 26 letters and use the counts as the key: a tuple in Python, a joined string like `"1#0#2#..."` in JavaScript and Java, or a string of 26 characters in C++. Never use a raw array as a Java or JavaScript key: it compares by identity.' },
          { q: 'Does the order of the groups matter?', a: 'Not for this problem. Hash maps in Java and C++ don’t promise an order, so don’t rely on one. Python dicts and JavaScript maps keep insertion order, but the problem doesn’t need it.' },
          { q: 'What if the strings can contain any Unicode text?', a: 'Sorting by code unit or code point still works as a key. The 26-count key doesn’t, so use a hash map of counts or sort.' }
        ]
      },
      {
        lc: 56,
        restate: 'Given a list of intervals `[start, end]`, merge all the ones that overlap, and return the non-overlapping intervals that cover the same ranges. Intervals that touch (`[1,4]` and `[4,5]`) merge too.',
        examples: '- `[[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`.\n- `[[1,4],[4,5]]` → `[[1,5]]`: touching counts as overlapping.\n- Edge cases: one interval; an interval fully inside another (`[[1,10],[2,3]]` → `[[1,10]]`); the input arrives unsorted.',
        brute: 'Repeatedly scan for any pair that overlaps and merge them, until nothing changes: O(n²) or worse.',
        insight: 'Sort by start. Then any interval that overlaps the last merged one must begin at or before that one’s end, and anything that doesn’t can never overlap later intervals. So one pass with a running last interval suffices: if the next start is at most the last end, stretch the end (with `max`, because the next interval may sit entirely inside); otherwise start a new one.',
        code: {
          py: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort(key=lambda iv: iv[0])          # order by start
        merged = []
        for start, end in intervals:
            if merged and start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)   # overlap: stretch the last one
            else:
                merged.append([start, end])
        return merged`,
          js: `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);          // order by start
  const merged = [];
  for (const [start, end] of intervals) {
    if (merged.length && start <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);   // overlap: stretch the last one
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}`,
          java: `class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));   // order by start
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : intervals) {
            if (!merged.isEmpty() && iv[0] <= merged.get(merged.size() - 1)[1]) {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], iv[1]);   // overlap: stretch the last one
            } else {
                merged.add(new int[]{iv[0], iv[1]});
            }
        }
        return merged.toArray(new int[0][]);
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());   // vectors compare element by element, so this orders by start
        vector<vector<int>> merged;
        for (auto& iv : intervals) {
            if (!merged.empty() && iv[0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], iv[1]);   // overlap: stretch the last one
            } else {
                merged.push_back(iv);
            }
        }
        return merged;
    }
};`
        },
        tests: { fn: 'merge', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], out: [[1, 5]] },
          { args: [[[1, 10], [2, 3]]], out: [[1, 10]] }, { args: [[[5, 6], [1, 2], [2, 4]]], out: [[1, 4], [5, 6]] }, { args: [[[7, 8]]], out: [[7, 8]] }] },
        complexity: 'O(n log n) time, dominated by the sort; the merge pass is O(n). O(n) space for the output (the sort itself is in place or O(n) depending on the language).',
        say: '“I’ll sort by start so that overlapping intervals end up next to each other. Then I walk once, keeping the last merged interval. If the next start is at most its end, they overlap, so I extend the end with a max. Otherwise I start a new interval. Sorting dominates: O(n log n) time.”',
        followups: [
          { q: 'Why `max` when extending the end?', a: 'The next interval may sit entirely inside the last one: `[1,10]` then `[2,3]`. Setting the end to 3 would shrink the merged interval and lose coverage.' },
          { q: 'What changes if touching intervals shouldn’t merge?', a: 'Use `start < last_end` instead of `<=`.' },
          { q: 'Does the sort comparator look right in every language?', a: 'In Java, `Integer.compare(a[0], b[0])` is safe; `a[0] - b[0]` can overflow with large values. In C++, the default `sort` on vectors already orders by the first element, then the next. In JavaScript, you must pass the numeric comparator, or `[10, 9]` sorts as strings.' }
        ]
      },
      {
        lc: 7,
        restate: 'Given a signed 32-bit integer, return it with its digits reversed. If the reversed value falls outside the 32-bit range [−2³¹, 2³¹ − 1], return 0. Assume you can’t store anything larger than 32 bits.',
        examples: '- `123` → `321`.\n- `-123` → `-321`.\n- `120` → `21`.\n- Edge cases: `0`; `1534236469` reverses to 9646324351, which overflows → `0`; `-2147483648` → `0`.',
        brute: 'Convert to a string, reverse it, parse it back, and range-check. It works in Python and JavaScript. It’s a fine first answer there, but in Java and C++ parsing an out-of-range number throws or misbehaves, and the problem’s rule forbids a 64-bit helper.',
        insight: 'Peel off digits with `% 10` and `/ 10`, and build the result as `rev * 10 + digit`. The danger is the multiply-add itself. Test **before** you do it: if `rev` is already above `MAX / 10`, or equals it and the next digit exceeds 7 (the last digit of 2,147,483,647), the next step would overflow. The negative side mirrors it with −8. In Java and C++, `/` and `%` truncate toward zero, so the same loop handles negative input with no special case.',
        code: {
          py: `class Solution:
    def reverse(self, x: int) -> int:
        sign = -1 if x < 0 else 1
        x = abs(x)
        rev = 0
        while x:
            rev = rev * 10 + x % 10    # Python ints don't overflow, so check the range at the end
            x //= 10
        rev *= sign
        return rev if -2**31 <= rev <= 2**31 - 1 else 0`,
          js: `function reverse(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let rev = 0;
  while (x > 0) {
    rev = rev * 10 + (x % 10);       // doubles are exact far past 32 bits, so check the range at the end
    x = Math.floor(x / 10);
  }
  rev *= sign;
  return rev >= -(2 ** 31) && rev <= 2 ** 31 - 1 ? rev : 0;
}`,
          java: `class Solution {
    public int reverse(int x) {
        int rev = 0;
        while (x != 0) {
            int digit = x % 10;       // truncates toward zero, so the sign carries through
            x /= 10;
            if (rev > Integer.MAX_VALUE / 10 || (rev == Integer.MAX_VALUE / 10 && digit > 7)) return 0;
            if (rev < Integer.MIN_VALUE / 10 || (rev == Integer.MIN_VALUE / 10 && digit < -8)) return 0;
            rev = rev * 10 + digit;   // safe: both bounds were checked first
        }
        return rev;
    }
}`,
          cpp: `class Solution {
public:
    int reverse(int x) {
        int rev = 0;
        while (x != 0) {
            int digit = x % 10;       // truncates toward zero, so the sign carries through
            x /= 10;
            if (rev > INT_MAX / 10 || (rev == INT_MAX / 10 && digit > 7)) return 0;
            if (rev < INT_MIN / 10 || (rev == INT_MIN / 10 && digit < -8)) return 0;
            rev = rev * 10 + digit;   // safe: both bounds were checked first
        }
        return rev;
    }
};`
        },
        tests: { fn: 'reverse', sig: { args: ['int'] }, cases: [
          { args: [123], out: 321 }, { args: [-123], out: -321 }, { args: [120], out: 21 }, { args: [0], out: 0 }, { args: [1534236469], out: 0 },
          { args: [-2147483648], out: 0 }, { args: [2147483647], out: 0 }, { args: [1463847412], out: 2147483641 }, { args: [-1563847412], out: 0 }] },
        complexity: 'O(log₁₀ |x|) time: one step per digit, at most 10. O(1) space.',
        say: '“I’ll pop digits off with mod 10 and push them on with `rev * 10 + digit`. The overflow can only happen at that push, so I check before it: if `rev` is above `MAX / 10`, or equal and the digit is above 7, I return 0, and the mirror check handles negatives. In languages where division truncates toward zero, there’s no sign special case. O(number of digits) time, O(1) space.”',
        followups: [
          { q: 'Why 7 and −8?', a: '`INT_MAX` is 2,147,483,647, which ends in 7, and `INT_MIN` is −2,147,483,648, which ends in 8. When `rev` equals 214,748,364, only a last digit of 7 (or −8 on the negative side) still fits.' },
          { q: 'Why does Python need a different version?', a: 'Python’s `//` and `%` round toward negative infinity, so a negative number gives the wrong digits. Working on `abs(x)` and restoring the sign avoids it. And Python never overflows, so you check the range once at the end.' },
          { q: 'Could you use a `long` instead of the pre-checks?', a: 'Yes, in Java or C++ with 64-bit integers: reverse in a `long`, then compare with the 32-bit range. It’s simpler, but this problem’s rules forbid 64-bit storage, so say you’re choosing the pre-check on purpose.' }
        ]
      }
    ],

    practice: [
      { lc: 217,
        hints: ['The question is “have I seen this value before?”. Which container answers that in O(1)?', 'Walk the array and keep a set of what you’ve seen.', 'If the value is already in the set, return true; if you finish the loop, return false.'],
        solution: { explain: 'A hash set remembers what you’ve seen. O(n) time, O(n) space. (The one-liner `len(set(nums)) != len(nums)` is the same idea.)', code: {
          py: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for x in nums:
            if x in seen:
                return True
            seen.add(x)
        return False`,
          js: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ', js: 'function containsDuplicate(nums) {\n  \n}' },
        tests: { fn: 'containsDuplicate', cases: [
          { args: [[1, 2, 3, 1]], out: true }, { args: [[1, 2, 3, 4]], out: false }, { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], out: true }, { args: [[7]], out: false }, { args: [[]], out: false }] } },

      { lc: 242,
        hints: ['Two strings are anagrams when every letter appears the same number of times in both.', 'If the lengths differ, you can answer immediately.', 'Count the letters of one string, subtract for the other, and check that everything returns to zero (or compare the two count tables).'],
        solution: { explain: 'Compare letter counts. A `Counter` or a map of counts does it in O(n) time; with only lowercase letters the space is O(1) (26 slots).', code: {
          py: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return len(s) == len(t) and Counter(s) == Counter(t)`,
          js: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (const ch of t) {
    if (!counts.get(ch)) return false;   // missing or already used up
    counts.set(ch, counts.get(ch) - 1);
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ', js: 'function isAnagram(s, t) {\n  \n}' },
        tests: { fn: 'isAnagram', cases: [
          { args: ['anagram', 'nagaram'], out: true }, { args: ['rat', 'car'], out: false }, { args: ['a', 'ab'], out: false }, { args: ['aacc', 'ccac'], out: false }, { args: ['', ''], out: true }] } },

      { lc: 387,
        hints: ['A letter is unique if it appears exactly once in the whole string.', 'One pass to count every letter, with a hash map or an array of 26.', 'A second pass, left to right: return the first index whose count is 1, or -1.'],
        solution: { explain: 'Two passes: count, then find the first letter whose count is 1. O(n) time, O(1) space (26 letters).', code: {
          py: `class Solution:
    def firstUniqChar(self, s: str) -> int:
        counts = Counter(s)
        for i, ch in enumerate(s):
            if counts[ch] == 1:
                return i
        return -1`,
          js: `function firstUniqChar(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (let i = 0; i < s.length; i++) {
    if (counts.get(s[i]) === 1) return i;
  }
  return -1;
}` } },
        starter: { py: 'class Solution:\n    def firstUniqChar(self, s: str) -> int:\n        ', js: 'function firstUniqChar(s) {\n  \n}' },
        tests: { fn: 'firstUniqChar', cases: [
          { args: ['leetcode'], out: 0 }, { args: ['loveleetcode'], out: 2 }, { args: ['aabb'], out: -1 }, { args: ['z'], out: 0 }, { args: ['abcabcd'], out: 6 }] } },

      { lc: 557,
        hints: ['Words are separated by single spaces, and only the letters inside each word flip.', 'Split on a single space, reverse each word, and join back with a single space.', 'In Java and JavaScript strings are immutable: build with an array or `StringBuilder`, not repeated `+=`.'],
        solution: { explain: 'Split on spaces, reverse each word, join. O(n) time and space. Splitting on exactly one space (not whitespace in general) keeps the original spacing.', code: {
          py: `class Solution:
    def reverseWords(self, s: str) -> str:
        return " ".join(word[::-1] for word in s.split(" "))`,
          js: `function reverseWords(s) {
  return s.split(' ').map((word) => word.split('').reverse().join('')).join(' ');
}` } },
        starter: { py: 'class Solution:\n    def reverseWords(self, s: str) -> str:\n        ', js: 'function reverseWords(s) {\n  \n}' },
        tests: { fn: 'reverseWords', cases: [
          { args: ['Let\'s take LeetCode contest'], out: 's\'teL ekat edoCteeL tsetnoc' }, { args: ['Mr Ding'], out: 'rM gniD' }, { args: ['a'], out: 'a' }, { args: ['ab cd'], out: 'ba dc' }] } },

      { lc: 1046,
        hints: ['Each round you need the two heaviest stones, and the set changes after every smash. What structure gives you the largest quickly?', 'A max-heap: pop two, and if they differ, push the difference back.', 'In Python, store negated weights in a min-heap. Return 0 if nothing is left.'],
        solution: { explain: 'A max-heap (negated in Python) gives the two heaviest stones in O(log n) per round: O(n log n) total. JavaScript has no heap, so this version re-sorts each round, which is fine for n ≤ 30.', code: {
          py: `class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        heap = [-s for s in stones]
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)
            b = -heapq.heappop(heap)
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0`,
          js: `function lastStoneWeight(stones) {
  const s = [...stones];
  while (s.length > 1) {
    s.sort((a, b) => a - b);
    const a = s.pop(), b = s.pop();
    if (a !== b) s.push(a - b);
  }
  return s.length ? s[0] : 0;
}` } },
        starter: { py: 'class Solution:\n    def lastStoneWeight(self, stones: List[int]) -> int:\n        ', js: 'function lastStoneWeight(stones) {\n  \n}' },
        tests: { fn: 'lastStoneWeight', cases: [
          { args: [[2, 7, 4, 1, 8, 1]], out: 1 }, { args: [[1]], out: 1 }, { args: [[2, 2]], out: 0 }, { args: [[3, 7, 2]], out: 2 }, { args: [[10, 4, 2, 10]], out: 2 }] } },

      { lc: 703,
        hints: ['You only ever need the k-th largest, so you don’t need to keep everything sorted.', 'Keep a min-heap of the k largest values. Its root is the k-th largest.', 'On `add`, push the value, pop the root if the size passes k, and return the root.'],
        solution: { explain: 'A min-heap of size k: `add` is O(log k), and the root is always the answer. JavaScript has no heap, so the version below keeps a sorted array of the k largest and inserts by scanning, which is O(k) per add and fine for small k; mention a real heap in an interview.', code: {
          py: `class KthLargest:
    def __init__(self, k: int, nums: List[int]):
        self.k = k
        self.heap = []
        for x in nums:
            self.add(x)

    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]`,
          js: `class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.top = [];                              // the k largest values, ascending
    for (const x of nums) this.add(x);
  }
  add(val) {
    let i = this.top.length;
    while (i > 0 && this.top[i - 1] > val) i--;   // find the insertion point
    this.top.splice(i, 0, val);
    if (this.top.length > this.k) this.top.shift();
    return this.top[0];
  }
}` } },
        starter: { py: 'class KthLargest:\n    def __init__(self, k: int, nums: List[int]):\n        pass\n\n    def add(self, val: int) -> int:\n        pass', js: 'class KthLargest {\n  constructor(k, nums) {\n    \n  }\n  add(val) {\n    \n  }\n}' },
        tests: { fn: 'KthLargest', design: true, cases: [
          { ops: ['KthLargest', 'add', 'add', 'add', 'add', 'add'], args: [[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]], out: [null, 4, 5, 5, 8, 8] },
          { ops: ['KthLargest', 'add', 'add', 'add', 'add'], args: [[4, [7, 7, 7, 7, 8, 3]], [2], [10], [9], [9]], out: [null, 7, 7, 7, 8] },
          { ops: ['KthLargest', 'add', 'add'], args: [[1, []], [-3], [-2]], out: [null, -3, -2] }] } },

      { lc: 215,
        hints: ['Sorting works in O(n log n). Can you do better when k is small?', 'Keep a min-heap of size k: push each number, and pop when the size passes k.', 'After the pass, the root is the k-th largest.'],
        solution: { explain: 'A min-heap of size k: O(n log k) time, O(k) space. (Sorting descending and indexing k − 1 is O(n log n) and equally correct.) The JavaScript version sorts.', code: {
          py: `class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        heap = []
        for x in nums:
            heapq.heappush(heap, x)
            if len(heap) > k:
                heapq.heappop(heap)
        return heap[0]`,
          js: `function findKthLargest(nums, k) {
  return [...nums].sort((a, b) => b - a)[k - 1];   // JS has no heap: sort descending, index k - 1
}` } },
        starter: { py: 'class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ', js: 'function findKthLargest(nums, k) {\n  \n}' },
        tests: { fn: 'findKthLargest', cases: [
          { args: [[3, 2, 1, 5, 6, 4], 2], out: 5 }, { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], out: 4 }, { args: [[1], 1], out: 1 }, { args: [[-1, -1], 2], out: -1 }, { args: [[7, 6, 5, 4], 4], out: 4 }] } },

      { lc: 692,
        hints: ['Count the words with a hash map.', 'The order is “higher count first, then alphabetical”: two keys, so a comparator or a tuple key.', 'Sort the distinct words by that rule and return the first k.'],
        solution: { explain: 'The template from this page, with strings instead of integers. O(n + m log m) time. Python sorts by `(-count, word)`; JavaScript compares counts, then uses `<` on the words, not `localeCompare`, which depends on the locale.', code: {
          py: `class Solution:
    def topKFrequent(self, words: List[str], k: int) -> List[str]:
        counts = Counter(words)
        return sorted(counts, key=lambda w: (-counts[w], w))[:k]`,
          js: `function topKFrequent(words, k) {
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  return [...counts.keys()]
    .sort((a, b) => counts.get(b) - counts.get(a) || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, k);
}` } },
        starter: { py: 'class Solution:\n    def topKFrequent(self, words: List[str], k: int) -> List[str]:\n        ', js: 'function topKFrequent(words, k) {\n  \n}' },
        tests: { fn: 'topKFrequent', cases: [
          { args: [['i', 'love', 'leetcode', 'i', 'love', 'coding'], 2], out: ['i', 'love'] },
          { args: [['the', 'day', 'is', 'sunny', 'the', 'the', 'the', 'sunny', 'is', 'is'], 4], out: ['the', 'is', 'sunny', 'day'] },
          { args: [['a'], 1], out: ['a'] }, { args: [['b', 'a', 'c'], 2], out: ['a', 'b'] }] } },

      { lc: 1636,
        hints: ['Count how often each value appears.', 'Sort the array itself with two keys: count ascending, and for equal counts the value descending.', 'In Python use a tuple key `(count, -value)`; in JavaScript a comparator `counts.get(a) - counts.get(b) || b - a`.'],
        solution: { explain: 'Count with a hash map, then sort the original values with a two-part key. O(n log n) time, O(n) space.', code: {
          py: `class Solution:
    def frequencySort(self, nums: List[int]) -> List[int]:
        counts = Counter(nums)
        return sorted(nums, key=lambda x: (counts[x], -x))`,
          js: `function frequencySort(nums) {
  const counts = new Map();
  for (const x of nums) counts.set(x, (counts.get(x) || 0) + 1);
  return [...nums].sort((a, b) => counts.get(a) - counts.get(b) || b - a);
}` } },
        starter: { py: 'class Solution:\n    def frequencySort(self, nums: List[int]) -> List[int]:\n        ', js: 'function frequencySort(nums) {\n  \n}' },
      
        tests: { fn: 'frequencySort', cases: [
          { args: [[1, 1, 2, 2, 2, 3]], out: [3, 1, 1, 2, 2, 2] }, { args: [[2, 3, 1, 3, 2]], out: [1, 3, 3, 2, 2] },
          { args: [[-1, 1, -6, 4, 5, -6, 1, 4, 1]], out: [5, -1, 4, 4, -6, -6, 1, 1, 1] }, { args: [[7]], out: [7] }] } },

      { lc: 347,
        hints: ['Count each value with a hash map.', 'Sorting the distinct values by count works. Can you avoid the sort, given that a count is at most n?', 'Bucket the values by count (an array of lists indexed by count) and read from the highest bucket down, or keep a min-heap of size k.'],
        starter: { py: 'class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ', js: 'function topKFrequent(nums, k) {\n  \n}' },
        tests: { fn: 'topKFrequent', compare: 'unordered', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 1, 1, 2, 2, 3], 2], out: [1, 2] }, { args: [[1], 1], out: [1] }, { args: [[4, 4, 4, 5, 5, 6, 6, 6, 6], 2], out: [4, 6] }, { args: [[-1, -1, 2], 1], out: [-1] }] } },

      { lc: 49,
        hints: ['Anagrams share the same letters. What single value could represent “the same letters” and work as a hash-map key?', 'The sorted letters of a word, or a tuple of 26 counts, are the same for every anagram.', 'Map key to list of words, then return the lists.'],
        starter: { py: 'class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ', js: 'function groupAnagrams(strs) {\n  \n}' },
        tests: { fn: 'groupAnagrams', compare: 'deep', sig: { args: ['str[]'] }, cases: [
          { args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], out: [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']] }, { args: [['']], out: [['']] }, { args: [['a']], out: [['a']] }, { args: [['ab', 'ba', 'abc']], out: [['ab', 'ba'], ['abc']] }] } },

      { lc: 56,
        hints: ['If the intervals were sorted by start, which ones could possibly overlap the current one?', 'Sort by start, then keep the last merged interval as you walk.', 'If the next start is at most the last end, extend the end with a max; otherwise open a new interval.'],
        starter: { py: 'class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        ', js: 'function merge(intervals) {\n  \n}' },
        tests: { fn: 'merge', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], out: [[1, 5]] }, { args: [[[1, 10], [2, 3]]], out: [[1, 10]] }, { args: [[[5, 6], [1, 2], [2, 4]]], out: [[1, 4], [5, 6]] }] } },

      { lc: 7,
        hints: ['Peel off the last digit with `% 10` and shrink the number with `/ 10`, building the reversed value as you go.', 'The risky step is `rev * 10 + digit`. In Java and C++ it can overflow, so check the bound before you do it.', 'Compare `rev` with `MAX / 10`: above it, or equal with a last digit over 7, means the next step overflows. Mirror it for negatives with −8.'],
        starter: { py: 'class Solution:\n    def reverse(self, x: int) -> int:\n        ', js: 'function reverse(x) {\n  \n}' },
        tests: { fn: 'reverse', sig: { args: ['int'] }, cases: [
          { args: [123], out: 321 }, { args: [-123], out: -321 }, { args: [120], out: 21 }, { args: [0], out: 0 }, { args: [1534236469], out: 0 }, { args: [-2147483648], out: 0 }] } }
    ],

    mistakes: [
      '**A list used as a queue.** `list.pop(0)` in Python or `remove(0)` on a Java `ArrayList` shifts every element: O(n) per call, so a BFS becomes O(n²). Use `deque` / `ArrayDeque` / `queue`. In JavaScript, advance a head index instead of calling `shift()` in a hot loop.',
      '**Membership in a list.** `if x in list` and `list.indexOf(x)` are O(n); inside a loop that’s O(n²). Put the values in a set or map first.',
      '**Heap direction.** Python’s `heapq` and Java’s `PriorityQueue` are min-heaps; C++’s `priority_queue` is a *max*-heap. For “k largest”, you keep a **min**-heap of size k, so in C++ you must pass `greater<>`. JavaScript has none: say so, and write one.',
      '**JavaScript `sort()` without a comparator.** It sorts by string, so `[10, 9, 1].sort()` is `[1, 10, 9]`. Always `(a, b) => a - b`. And return a number: `(a, b) => a > b` is a boolean and gives unreliable order.',
      '**Comparator by subtraction.** In Java, `(a, b) -> a - b` overflows for values of opposite extreme signs and gives a wrong order. Use `Integer.compare(a, b)`. In C++, a comparator that returns `<=` on equal elements is undefined behavior (it can crash `sort`).',
      '**Silent overflow.** Java `int` wraps at 2,147,483,647; C++ signed overflow is undefined. Compute a midpoint as `lo + (hi - lo) / 2`, widen before multiplying (`(long) a * b`), and watch sums, products and modular arithmetic with large moduli. In Python, nothing overflows, so a solution that “works” in Python can still be wrong in Java.',
      '**Division and modulo with negatives.** Python’s `//` and `%` round toward negative infinity (`-7 // 2 == -4`, `-7 % 2 == 1`). Java, C++ and JavaScript’s `%` truncate toward zero (`-7 / 2` is `-3` in Java and C++, and `-7 % 2` is `-1` everywhere else). In JavaScript, `/` is always a floating-point divide, so use `Math.trunc` or `Math.floor` yourself.',
      '**Reading a map inserts in C++.** `counts[x]` creates an entry with value 0 when `x` is missing, so a “just checking” read grows the map and changes `size()`. Use `count(x)` or `find(x)` to test. In Python, `d[x]` raises `KeyError`; use `get`, `defaultdict` or `Counter`.',
      '**Wrong keys for hash maps.** A Python list can’t be a key (use a tuple). A JavaScript `Map` or Java `HashMap` compares arrays by identity: `map.get([1,2])` finds nothing. Use a joined string, or a `List<Integer>` in Java. C++ `unordered_map` has no hash for `pair` or `vector`.',
      '**Comparing boxed values.** In Java, `map.get(a) == map.get(b)` compares `Integer` objects by reference and fails once values pass 127; use `.equals()`. `==` on strings is the same trap.',
      '**Building strings with `+=` in a loop.** O(n²) in Python, JavaScript (in the worst case) and Java. Collect pieces and join once, or use `StringBuilder`.',
      '**`pop()` returning nothing in C++.** `queue::pop()` and `stack::pop()` return `void`: read `front()` or `top()` first. And `priority_queue::top()` on an empty queue is undefined behavior, so check `empty()`.'
    ],

    quiz: [
      { kind: 'complexity', q: 'A Python solution does `while queue: x = queue.pop(0)` over a `list` of n items. What’s the loop’s cost, and what fixes it?',
        choices: ['O(n²); use `collections.deque` and `popleft()`', 'O(n); nothing needs fixing', 'O(n log n); use `heapq`', 'O(n²); use a `set`'], answer: 0,
        explain: '`list.pop(0)` shifts every remaining element, which is O(n) per pop, so the loop is O(n²). A deque pops from the front in O(1).' },
      { kind: 'concept', q: 'What does `[10, 9, 1].sort()` return in JavaScript?',
        choices: ['`[1, 10, 9]`', '`[1, 9, 10]`', '`[10, 9, 1]`', 'It throws an error'], answer: 0,
        explain: 'With no comparator, JavaScript sorts by converting elements to strings, and `"1" < "10" < "9"`. Pass `(a, b) => a - b` for numeric order.' },
      { kind: 'bug', q: 'This Java method sometimes returns `false` for equal counts. Why?',
        code: 'Map<Integer, Integer> a = new HashMap<>(), b = new HashMap<>();\n// ... fill a and b with counts ...\nreturn a.get(5) == b.get(5);',
        lang: 'java',
        choices: ['`==` compares the `Integer` objects by reference, which differs once values pass 127; use `.equals()`', '`HashMap` can’t store `Integer` keys', 'The map must be sorted first', '`get` returns a `long`'], answer: 0,
        explain: 'Small boxed integers are cached, so `==` happens to work up to 127, then fails. Compare boxed values with `.equals()` or unbox them first.' },
      { kind: 'concept', q: 'You need the k largest numbers from a stream, using as little memory as you can. Which heap do you keep, and what is its size?',
        choices: ['A min-heap of size k', 'A max-heap of size k', 'A max-heap of size n', 'A min-heap of size n'], answer: 0,
        explain: 'A min-heap of the k largest has the smallest of those at the root, so it’s the one to evict when a bigger value arrives. Memory is O(k), time O(n log k).' },
      { kind: 'concept', q: 'In C++, what’s at the top of a default `priority_queue<int>`?',
        choices: ['The largest element', 'The smallest element', 'The first element pushed', 'It depends on the compiler'], answer: 0,
        explain: 'It’s a max-heap by default. For a min-heap, declare `priority_queue<int, vector<int>, greater<int>>`.' },
      { kind: 'bug', q: 'In Java, `lo` and `hi` are both near 2,000,000,000. What’s wrong with `int mid = (lo + hi) / 2;`?',
        choices: ['`lo + hi` overflows `int` and wraps negative; use `lo + (hi - lo) / 2`', 'Nothing: integer division is always safe', 'It rounds the wrong way', 'It needs `Math.floor`'], answer: 0,
        explain: 'The sum exceeds 2,147,483,647 and wraps to a negative number before the division happens. `hi - lo` stays small, so adding half of it to `lo` is safe.' },
      { kind: 'concept', q: 'What are `-7 // 2` in Python and `-7 / 2` in Java, in that order?',
        choices: ['-4 and -3', '-3 and -3', '-4 and -4', '-3 and -4'], answer: 0,
        explain: 'Python floors toward negative infinity; Java truncates toward zero. The same split applies to `%`, which is why digit loops on negatives need care.' },
      { kind: 'pattern', q: 'Which of these give O(1) pushes and pops at **both** ends? Pick every one that applies.',
        choices: ['Python `collections.deque`', 'Java `ArrayDeque`', 'Python `list`', 'C++ `deque`'], answer: [0, 1, 3],
        explain: 'Deques are built for both ends. A Python `list` is fast only at the back; popping from the front shifts everything.' },
      { kind: 'pattern', q: 'You repeatedly insert numbers and need the current smallest each time. Which container fits best?',
        choices: ['A min-heap', 'A plain array that you re-sort each time', 'A deque', 'A hash set'], answer: 0,
        explain: 'A heap gives O(log n) insert and O(1) peek of the smallest. Re-sorting costs O(n log n) per insert, and a deque or hash set doesn’t keep order.' }
    ],

    flashcards: [
      { id: 'queue-choice', front: 'Which built-in is the right queue in Python, JavaScript, Java and C++?', back: 'Python `collections.deque`; JavaScript an array with a head index (`shift` can be O(n)); Java `ArrayDeque`; C++ `queue` or `deque`.' },
      { id: 'heap-direction', front: 'Which of the four languages have a min-heap, a max-heap, or no heap by default?', back: 'Python `heapq` and Java `PriorityQueue`: min-heaps. C++ `priority_queue`: max-heap (use `greater<>` for min). JavaScript: no heap.' },
      { id: 'max-heap-py', front: 'How do you get a max-heap from Python’s `heapq`?', back: 'Push negated values and negate again when you pop. For tuples, negate the numeric field you want in descending order.' },
      { id: 'k-largest', front: 'To find the k largest items, which heap do you keep, and what does it cost?', back: 'A min-heap of size k: push each item, pop the root when the size passes k. O(n log k) time, O(k) space; the root is the k-th largest.' },
      { id: 'js-sort', front: 'What does `arr.sort()` do in JavaScript with no comparator?', back: 'It sorts as strings (`[10, 9, 1]` becomes `[1, 10, 9]`). Pass `(a, b) => a - b`. The sort is stable.' },
      { id: 'java-compare', front: 'Why write `Integer.compare(a, b)` instead of `a - b` in a Java comparator?', back: 'Subtraction can overflow and flip the sign, giving a wrong order. `Integer.compare` is always correct.' },
      { id: 'cpp-sort', front: 'Two rules for C++ `std::sort` with a comparator?', back: 'The comparator must be a strict “less than” (equal items return false), and `sort` is not stable: use `stable_sort` to keep ties in order.' },
      { id: 'overflow', front: 'Overflow rules: Python, JavaScript, Java and C++?', back: 'Python: none. JavaScript: doubles, exact to 2⁵³ − 1, bit ops are 32-bit. Java `int`: wraps silently at 2³¹ − 1. C++ signed: undefined behavior. Use `long` / `long long`, and cast before multiplying.' },
      { id: 'midpoint', front: 'The overflow-safe midpoint of `lo` and `hi`?', back: '`lo + (hi - lo) / 2`, not `(lo + hi) / 2`.' },
      { id: 'floor-div', front: 'How do `//` / `/` and `%` behave on negatives across languages?', back: 'Python floors (`-7 // 2 == -4`, `-7 % 2 == 1`). Java and C++ truncate toward zero (`-7 / 2 == -3`, `-7 % 2 == -1`). JavaScript `/` is a float divide, `%` truncates.' },
      { id: 'cpp-map-insert', front: 'What does `counts[x]` do in C++ when `x` is missing?', back: 'It inserts `x` with value 0 and returns it, so `size()` grows. Use `count(x)` or `find(x)` to test without inserting.' },
      { id: 'hash-keys', front: 'Which values can’t be used as hash keys directly?', back: 'Python lists (use tuples). JavaScript and Java arrays compare by identity: join into a string, or use `List<Integer>` in Java. C++ `unordered_map` has no hash for `pair` or `vector`.' },
      { id: 'string-build', front: 'How do you build a long string from pieces in each language?', back: 'Python `"".join(parts)`; JavaScript `parts.join("")`; Java `StringBuilder`; C++ `+=` on a `std::string` (it appends in place). Avoid repeated `+=` on immutable strings.' },
      { id: 'java-eq', front: 'Which Java comparisons need `.equals()` instead of `==`?', back: 'Strings and boxed `Integer` values from `Map.get`. `==` compares references; boxed integers only match by accident up to 127.' }
    ],

    deeper: [
      { title: 'Python collections and heapq (docs)', url: 'https://docs.python.org/3/library/collections.html', time: 'about 15 min', note: 'Official reference for `deque`, `Counter` and `defaultdict`. Read it alongside the `heapq` module page in the same library docs.' },
      { title: 'MDN: Map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map', time: 'about 10 min', note: 'How `Map` differs from a plain object: any key type, insertion order, and identity for object keys.' },
      { title: 'Java Collections Framework overview (Oracle)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html', time: 'reference', note: 'The `java.util` package: `HashMap`, `ArrayDeque`, `PriorityQueue`, `TreeMap` and their costs in the class docs.' },
      { title: 'cppreference: containers library', url: 'https://en.cppreference.com/w/cpp/container', time: 'reference', note: 'Every standard container with its complexity guarantees, plus `priority_queue` and the `algorithm` header for `sort`.' }
    ],

    detective: [
      { id: 'ranking', decoys: ['sorting', 'heaps', 'arrays-hashing'],
        statement: 'A neighborhood bakery runs a “regular of the month” board. Each purchase is logged with the customer’s name. At month end the board lists the five customers with the most purchases, and when two customers tie, the one earlier in the alphabet is listed first. Given the purchase log, produce the board.',
        why: 'The work is counting by name, then putting the names in an order that has two rules. A hash map does the counting, and a comparator (or a tuple key) expresses “higher count first, then alphabetical”. The skill being tested is choosing the built-ins and writing the tie-break correctly.' },
      { id: 'overflow-totals', decoys: ['math', 'big-o', 'bits'],
        statement: 'A freight system stores each container’s weight in grams as a 32-bit integer, and a manifest lists up to several thousand containers on one ship. A batch job totals the weights, and on very large ships it sometimes prints a negative total. Explain why and fix it.',
        why: 'The sum passes about 2.1 billion and wraps around in a fixed-width integer type. Spotting that, and widening the accumulator before adding, is a language-level skill, not an algorithm.' },
      { id: 'recent-clicks', decoys: ['queues', 'sliding-window', 'stacks'],
        statement: 'A website banner shows “N people clicked in the last minute”. Clicks arrive with timestamps in increasing order, and a click should stop counting once it’s more than 60 seconds old. The page asks for the count after every click, thousands of times a second. Which structure would you keep the clicks in?',
        why: 'Entries are added at the back and expire from the front, so you need O(1) at both ends. A real deque fits, and a plain list shifted from the front would make each expiry O(n).' },
      { id: 'closest-todo', decoys: ['heaps', 'sorting', 'greedy'],
        statement: 'A to-do app keeps tasks with a due date. New tasks keep arriving, and every time the user finishes one, the app must show the task due soonest. The list can hold millions of tasks. Describe the structure that serves both operations quickly.',
        why: 'Insert-anything, remove-the-smallest, over and over, is the textbook use of a priority queue. The language question is which one you have: a min-heap in Python and Java, a flipped one in C++, and none in JavaScript.' },
      { id: 'log-builder', decoys: ['big-o', 'string-algos', 'arrays-hashing'],
        statement: 'A report generator makes one large text by appending a short line for each of 200,000 records, one after another in a loop. It runs in seconds on the test data, but on real data it takes minutes, and a profiler shows the time going into the appending line itself. What is the cause, and what do you change?',
        why: 'Strings are immutable in several languages, so every append copies the whole text built so far: quadratic time overall. The fix is a string builder, or collecting the pieces and joining them once.' }
    ]
  });
})();
