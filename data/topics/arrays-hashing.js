/* Offer Ready: Arrays and hashing. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'arrays-hashing',

    hook: 'Most “find a pair”, “count these”, “is there a duplicate” and “group the same things” questions have a slow version that scans the data again for every element (O(n²)) and a fast one that asks a hash table instead (O(n)). It’s the first section of NeetCode 150, it’s the pattern behind Two Sum, and it’s the one every other pattern quietly borrows: sliding windows, prefix sums and graph searches all keep a map or a set on the side.',

    cues: [
      'You catch yourself writing a loop **inside** a loop just to ask “have I seen this value before?” or “is there a partner for this value?”',
      'The question asks for a **count**, a most-frequent value, or whether two things have the same makeup (anagrams, a ransom note, a permutation).',
      'You have to **group** things that are “the same” by some rule, such as anagrams or strings with the same shape. Pick a canonical key and group by it.',
      'It’s about **duplicates, uniqueness or membership**: contains a duplicate, first unique character, the intersection of two lists.',
      'Values are small and bounded (letters, digits 1 to n, frequencies up to n). That means an **array can replace the map**, and sometimes the input array itself can.',
      'The order of the answer doesn’t matter, or you may reorder things. Ordered questions lean on sorting or two pointers.',
      'The trap: if the input is already sorted and you need O(1) extra space, that’s [two pointers](#/topic/two-pointers). If it’s about subarray sums, that’s [prefix sums](#/topic/prefix-sums) with a map.'
    ],

    intuition: [
      'Think of an index-card box on your desk. As you read a list, you file a card for each item: the item on the front, what you know about it on the back (where it was, how many times you’ve met it). Before you file a new card you check whether a card with that front already exists. The check takes the same short moment no matter how many cards are in the box. That’s a hash table: it trades memory for the ability to answer “have I seen this?” in constant time.',
      'That’s the whole pattern. Precisely:',
      '1. Decide what you’re looking for in the data you’ve already passed: the same value again, a partner that completes a pair, a running count, a group.\n2. Decide the **key** (what you look things up by) and the **value** (what you need to remember): value → index, value → count, canonical form → list of members.\n3. Walk the input once. For each element, **look first**, then **store**.\n4. Return as soon as the lookup answers the question, or when the walk ends.',
      'Why look before store? Because the element must not match itself. In Two Sum with `[3, 2, 4]` and target 6, storing `3` before asking would let it pair with its own copy.',
      'The pattern comes in a few shapes. **Seen-before** uses a set. **Complement search** uses a map from value to index. **Counting** uses a map from value to count, or an array when the values are small. **Grouping** uses a map from a canonical key to a list. When the keys are small integers, an array (or the input array itself) works as the hash table. How these tables work inside is in [Hashing internals](#/topic/hashing-internals).'
    ].join('\n\n'),

    viz: 'hashmap',

    template: {
      title: 'Complement search: remember what you’ve passed, ask before you add',
      note: 'To reuse it, change three things and keep the skeleton: **what you store** (here value → index), **what you look up** (here the partner `target - x`), and **what you return** (here the two indices). Look first, then store. For a duplicate check the map becomes a set, for counting the value becomes a count, and for grouping the value becomes a list.',
      code: {
        py: `def two_sum(nums, target):
    seen = {}                        #> value -> index, for every number we have already passed
    for i, x in enumerate(nums):     #@visit > 1. Take the next number
        need = target - x            #@need > 2. The partner that would complete the pair
        if need in seen:             #@look > 3. Ask the map first: seen it before?
            return [seen[need], i]   #@found > Yes: that earlier index and this one are the pair
        seen[x] = i                  #@store > 4. No: remember x so a later number can find it
    return []`,
        js: `function twoSum(nums, target) {
  const seen = new Map();                   //> value -> index, for every number we have already passed
  for (let i = 0; i < nums.length; i++) {   //@visit > 1. Take the next number
    const need = target - nums[i];          //@need > 2. The partner that would complete the pair
    if (seen.has(need)) {                   //@look > 3. Ask the map first: seen it before?
      return [seen.get(need), i];           //@found > Yes: that earlier index and this one are the pair
    }
    seen.set(nums[i], i);                   //@store > 4. No: remember it so a later number can find it
  }
  return [];
}`,
        java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();        //> value -> index, for every number we have already passed
        for (int i = 0; i < nums.length; i++) {              //@visit > 1. Take the next number
            int need = target - nums[i];                     //@need > 2. The partner that would complete the pair
            if (seen.containsKey(need)) {                    //@look > 3. Ask the map first: seen it before?
                return new int[]{seen.get(need), i};         //@found > Yes: that earlier index and this one are the pair
            }
            seen.put(nums[i], i);                            //@store > 4. No: remember it so a later number can find it
        }
        return new int[0];
    }
}`,
        cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;                        //> value -> index, for every number we have already passed
        for (int i = 0; i < (int)nums.size(); i++) {         //@visit > 1. Take the next number
            int need = target - nums[i];                     //@need > 2. The partner that would complete the pair
            auto it = seen.find(need);                       //@look > 3. Ask the map first: seen it before?
            if (it != seen.end()) return {it->second, i};    //@found > Yes: that earlier index and this one are the pair
            seen[nums[i]] = i;                               //@store > 4. No: remember it so a later number can find it
        }
        return {};
    }
};`
      },
      tests: { fn: { py: 'two_sum', default: 'twoSum' }, sig: { args: ['int[]', 'int'] }, cases: [
        { args: [[2, 7, 11, 15], 9], out: [0, 1] }, { args: [[3, 2, 4], 6], out: [1, 2] }, { args: [[3, 3], 6], out: [0, 1] },
        { args: [[1, 5, 8, 3], 20], out: [] }, { args: [[-3, 4, 3, 90], 0], out: [0, 2] }, { args: [[0, 4, 3, 0], 0], out: [0, 3] }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      why: 'One pass visits each element once, and each visit does a constant number of hash operations (one lookup, one insert), so the time is O(n) on average. The price is memory: in the worst case the map ends up holding every element, so the space is O(n). That trade, O(n) memory for O(n) time instead of O(1) memory for O(n²) time, is the whole point of the pattern.',
      trap: 'Two honest caveats. “O(1) lookup” is the **expected** cost; a table can degrade to O(n) per operation if many keys collide, which is rare in practice but worth one sentence. And the cost of a lookup includes **hashing the key**: when the key is a string or tuple of length k, each operation is O(k), so Group Anagrams is O(n·k), not O(n). Say the key length out loud.'
    },

    variations: [
      {
        name: 'Seen-before: a set',
        body: 'When you only need “have I met this value?”, a set is a map without the values. Contains Duplicate (217) is exactly that. Variations on it: the first value that repeats, the intersection of two arrays (insert one array, check the other), and Valid Sudoku (36), which is nine row sets, nine column sets and nine box sets filled in one pass. If the input may not be changed and memory doesn’t matter, a set is the simplest answer; sorting first is the O(1)-extra-space alternative at O(n log n).',
        code: {
          py: `def contains_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:        #> Met it before: done
            return True
        seen.add(x)          #> Otherwise remember it
    return False`,
          js: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;   //> Met it before: done
    seen.add(x);                    //> Otherwise remember it
  }
  return false;
}`
        },
        tests: { fn: { py: 'contains_duplicate', default: 'containsDuplicate' }, cases: [
          { args: [[1, 2, 3, 1]], out: true }, { args: [[1, 2, 3, 4]], out: false }, { args: [[]], out: false }, { args: [[7]], out: false }, { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], out: true }] }
      },
      {
        name: 'Counting: a map, or an array when the keys are small',
        body: 'For “how many of each”, store value → count. When the keys are lowercase letters, an array of 26 slots does the same job without hashing: slot `ord(c) - 97` is the key. Valid Anagram (242) and Ransom Note (383) are two-line variations: count one string up, count the other down, and check that every slot is zero. Say which one you’re assuming (“lowercase only, so I’ll use 26 slots; for Unicode I’d switch to a map”).',
        code: {
          py: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = [0] * 26                  #> One slot per lowercase letter
    for a, b in zip(s, t):
        counts[ord(a) - 97] += 1       #> s adds
        counts[ord(b) - 97] -= 1       #> t takes away
    return not any(counts)             #> Anagrams cancel to all zeros`,
          js: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Array(26).fill(0);   //> One slot per lowercase letter
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;       //> s adds
    counts[t.charCodeAt(i) - 97]--;       //> t takes away
  }
  return counts.every((c) => c === 0);    //> Anagrams cancel to all zeros
}`
        },
        tests: { fn: { py: 'is_anagram', default: 'isAnagram' }, cases: [
          { args: ['anagram', 'nagaram'], out: true }, { args: ['rat', 'car'], out: false }, { args: ['a', 'a'], out: true }, { args: ['ab', 'a'], out: false }, { args: ['aacc', 'ccac'], out: false }] }
      },
      {
        name: 'Grouping by a canonical key',
        body: 'To group things that are “the same” under a rule, find a key that is **identical for every member of a group and different across groups**, then use a map from key to list. For anagrams the key is the sorted letters (`"eat"` and `"tea"` both give `"aet"`) or the 26 letter counts. For strings with the same shape (`"abb"` and `"xyy"`), replace each letter by the position of its first appearance. Choosing the key is the whole problem; the code is always the same four lines. The worked Group Anagrams (49) below shows it.'
      },
      {
        name: 'Frequencies as positions: bucket sort',
        body: 'Counting leaves you with “which values are most frequent?”. Sorting the counts costs O(n log n), but a frequency can’t exceed n, so you can drop each value into a bucket indexed by its count and read the buckets from the top. That’s O(n). Top K Frequent Elements (347) is the worked example below.'
      },
      {
        name: 'The array as its own hash table',
        body: 'When the values are guaranteed to be 1 to n for an array of length n, each value names a slot in the array itself. Mark “seen” by flipping the sign of `nums[value - 1]`, and afterwards the slots that are still positive are exactly the values that never appeared. That gives O(1) extra space (Find All Numbers Disappeared in an Array, 448). It changes the input, so say so, and undo it if the caller still needs the array. The same idea in disguise is the prefix and suffix products in Product of Array Except Self (238): store partial results in the output array instead of a separate map.',
        code: {
          py: `def find_disappeared(nums):
    for x in nums:
        i = abs(x) - 1              #> The slot this value points at
        if nums[i] > 0:
            nums[i] = -nums[i]      #> Flip the sign: "value i + 1 appeared"
    return [i + 1 for i, x in enumerate(nums) if x > 0]   #> Still positive: never appeared`,
          js: `function findDisappeared(nums) {
  for (const x of nums) {
    const i = Math.abs(x) - 1;                //> The slot this value points at
    if (nums[i] > 0) nums[i] = -nums[i];      //> Flip the sign: "value i + 1 appeared"
  }
  const out = [];
  nums.forEach((x, i) => { if (x > 0) out.push(i + 1); });   //> Still positive: never appeared
  return out;
}`
        },
        tests: { fn: { py: 'find_disappeared', default: 'findDisappeared' }, cases: [
          { args: [[4, 3, 2, 7, 8, 2, 3, 1]], out: [5, 6] }, { args: [[1, 1]], out: [2] }, { args: [[1, 2, 3]], out: [] }, { args: [[2, 2]], out: [1] }, { args: [[1]], out: [] }] }
      },
      {
        name: 'When a hash map is the wrong tool',
        body: 'If the array is **sorted** and you want a pair with O(1) extra space, use [two pointers](#/topic/two-pointers). If the question is about **sums of subarrays**, a map of running sums is the tool, covered in [prefix sums](#/topic/prefix-sums). If you need the answer **in order** or the nearest larger value, you want sorting or a stack. And if keys are objects with no stable equality (floating-point results, mutable lists), the lookup can silently miss; convert them to an exact, immutable key first.'
      }
    ],

    worked: [
      {
        lc: 1,
        restate: 'Given an array of integers and a target, return the indices of two different elements that add up to the target. Exactly one such pair exists, and you may not use the same element twice.',
        examples: '- `[2, 7, 11, 15]`, target 9 → `[0, 1]`, since 2 + 7 = 9.\n- `[3, 2, 4]`, target 6 → `[1, 2]`. Not `[0, 0]`: 3 + 3 would use one element twice.\n- `[3, 3]`, target 6 → `[0, 1]`: equal values at different indices are fine.\n- Edge cases: negative numbers and zeros (`[-3, 4, 3, 90]`, target 0), and the answer’s indices can come in either order (LeetCode accepts both).',
        brute: 'Try every pair with two nested loops and check the sum: O(n²) time, O(1) space. Fine for a few thousand elements, too slow past 10⁵.',
        insight: 'For each number `x`, the partner you want is fixed: `target - x`. So the question becomes “has `target - x` appeared earlier?”, and a hash map from value to index answers that in constant time. Look in the map first and store `x` afterwards, so a number can’t pair with itself.',
        code: {
          py: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}                          # value -> index of numbers already passed
        for i, x in enumerate(nums):
            need = target - x
            if need in seen:               # look before storing: x must not pair with itself
                return [seen[need], i]
            seen[x] = i
        return []`,
          js: `function twoSum(nums, target) {
  const seen = new Map();                  // value -> index of numbers already passed
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];   // look before storing: x must not pair with itself
    seen.set(nums[i], i);
  }
  return [];
}`,
          java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // value -> index of numbers already passed
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};   // look before storing
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
          cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;   // value -> index of numbers already passed
        for (int i = 0; i < (int)nums.size(); i++) {
            auto it = seen.find(target - nums[i]);
            if (it != seen.end()) return {it->second, i};   // look before storing
            seen[nums[i]] = i;
        }
        return {};
    }
};`
        },
        complexity: 'O(n) time on average: one pass, one lookup and one insert per element. O(n) space for the map.',
        say: '“The brute force checks every pair, O(n²). But for each number the partner is fixed, `target - x`, so I only need to know whether I’ve already seen it. I’ll keep a map from value to index. For each number I look up its partner first, and if it’s there I return both indices; otherwise I store the number. Looking before storing means an element can’t pair with itself. One pass: O(n) time, O(n) space.”',
        followups: [
          { q: 'What if the array is sorted?', a: 'Use two pointers, one at each end: if the sum is too small move the left pointer right, if too large move the right pointer left. O(n) time and O(1) space, but you must keep the original indices if the problem wants them, which sorting would scramble.' },
          { q: 'What if there are duplicates and no pair is guaranteed?', a: 'The code already handles duplicates, because the lookup happens before the store. For `[3, 3]` and target 6, the second 3 finds the first. If no pair exists, the loop ends and the code returns an empty list. Say what the interviewer wants returned in that case.' },
          { q: 'What if you need every pair, not just one?', a: 'Store value → list of indices (or a count), and collect all matches. The number of answers can be quadratic, so the output itself dictates the cost.' },
          { q: 'What if the array is too big for memory?', a: 'Sort externally and use the two-pointer scan, or partition the values by hash so that a number and its partner land in the same partition, then solve each partition in memory.' }
        ]
      },
      {
        lc: 49,
        restate: 'Given a list of strings, group the ones that are anagrams of each other. Return the groups in any order, and the strings within a group in any order.',
        examples: '- `["eat", "tea", "tan", "ate", "nat", "bat"]` → `[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]`.\n- `[""]` → `[[""]]`.\n- `["a"]` → `[["a"]]`.\n- Edge cases: several empty strings are anagrams of each other; strings of different lengths can never be in the same group.',
        brute: 'Compare every pair of strings with an anagram check and merge groups as you go: O(n² · k). Too slow when n is in the thousands.',
        insight: 'Two strings are anagrams exactly when they have the same letter counts. So compute a **canonical key** that is the same for every anagram and different otherwise, and let a map do the grouping: key → list of strings. The key can be the sorted string (O(k log k) per word) or the 26 letter counts (O(k) per word).',
        code: {
          py: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = defaultdict(list)           # key -> every string with that key
        for s in strs:
            counts = [0] * 26
            for ch in s:
                counts[ord(ch) - 97] += 1
            groups[tuple(counts)].append(s)  # a tuple is hashable; a list is not
        return list(groups.values())`,
          js: `function groupAnagrams(strs) {
  const groups = new Map();                  // key -> every string with that key
  for (const s of strs) {
    const counts = new Array(26).fill(0);
    for (let i = 0; i < s.length; i++) counts[s.charCodeAt(i) - 97]++;
    const key = counts.join('#');            // an array as a key would compare by reference
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}`,
          java: `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();   // key -> every string with that key
        for (String s : strs) {
            int[] counts = new int[26];
            for (char ch : s.toCharArray()) counts[ch - 'a']++;
            String key = Arrays.toString(counts);             // an int[] as a key would hash by identity
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> groups;   // key -> every string with that key
        for (const string& s : strs) {
            string key(26, 0);                          // 26 counts packed into a string key
            for (char ch : s) key[ch - 'a']++;
            groups[key].push_back(s);
        }
        vector<vector<string>> out;
        for (auto& g : groups) out.push_back(g.second);
        return out;
    }
};`
        },
        complexity: 'O(n · k) time for n strings of length k: each string is scanned once to build a key, and hashing a 26-slot key is O(26). With sorted keys it is O(n · k log k). O(n · k) space for the groups.',
        say: '“Anagrams share the same letter counts, so I’ll build a canonical key per word and group by it in a map. For lowercase letters the key is the 26 counts, which costs O(k) per word instead of O(k log k) for sorting. Then the map’s values are the groups. O(n·k) time and space.”',
        followups: [
          { q: 'Sorted key or count key?', a: 'Sorting is shorter to write and fine when words are short. The count key is O(k) per word and wins for long words, but it only fits a small alphabet. For Unicode, use a map of counts converted to a sorted tuple.' },
          { q: 'Why can’t I use a list as the key in Python?', a: 'Lists are mutable, so they’re unhashable and `groups[[0, 1]]` raises a `TypeError`. A tuple has the same contents and is hashable.' },
          { q: 'What if the strings can contain uppercase letters or digits?', a: 'Widen the count array (128 slots for ASCII) or use a map of counts. The idea doesn’t change.' }
        ]
      },
      {
        lc: 347,
        restate: 'Given an integer array and a number k, return the k most frequent values, in any order. The answer is guaranteed to be unique.',
        examples: '- `[1, 1, 1, 2, 2, 3]`, k = 2 → `[1, 2]`.\n- `[1]`, k = 1 → `[1]`.\n- Edge cases: negative values; k equal to the number of distinct values (return everything); the answer is only unique when there are no ties at the cut-off, which the problem promises.',
        brute: 'Count the values, sort the (value, count) pairs by count, and take the first k: O(n log n). A heap of size k improves it to O(n log k). Both are acceptable; the bucket approach is O(n).',
        insight: 'A value can appear at most n times, so counts are small integers between 1 and n. Make an array of n + 1 buckets, where bucket `c` holds every value that appears exactly `c` times, and read the buckets from the highest count down until you have k values. No sorting needed.',
        code: {
          py: `class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        counts = Counter(nums)                          # value -> how many times
        buckets = [[] for _ in range(len(nums) + 1)]    # buckets[c] = values that appear c times
        for x, c in counts.items():
            buckets[c].append(x)
        out = []
        for c in range(len(nums), 0, -1):               # highest count first
            for x in buckets[c]:
                out.append(x)
                if len(out) == k:
                    return out
        return out`,
          js: `function topKFrequent(nums, k) {
  const counts = new Map();                              // value -> how many times
  for (const x of nums) counts.set(x, (counts.get(x) || 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);   // buckets[c] = values that appear c times
  for (const [x, c] of counts) buckets[c].push(x);
  const out = [];
  for (let c = nums.length; c > 0; c--) {                // highest count first
    for (const x of buckets[c]) {
      out.push(x);
      if (out.length === k) return out;
    }
  }
  return out;
}`,
          java: `class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();        // value -> how many times
        for (int x : nums) counts.merge(x, 1, Integer::sum);
        List<List<Integer>> buckets = new ArrayList<>();       // buckets.get(c) = values that appear c times
        for (int c = 0; c <= nums.length; c++) buckets.add(new ArrayList<>());
        for (Map.Entry<Integer, Integer> e : counts.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        int[] out = new int[k];
        int p = 0;
        for (int c = nums.length; c > 0 && p < k; c--) {       // highest count first
            for (int x : buckets.get(c)) {
                if (p < k) out[p++] = x;
            }
        }
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> counts;                  // value -> how many times
        for (int x : nums) counts[x]++;
        vector<vector<int>> buckets(nums.size() + 1);    // buckets[c] = values that appear c times
        for (auto& e : counts) buckets[e.second].push_back(e.first);
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
        complexity: 'O(n) time: counting is one pass, filling the buckets is one pass over the distinct values, and reading them back touches each bucket and each value once. O(n) space for the map and the buckets.',
        say: '“I’ll count frequencies with a map. A frequency is at most n, so instead of sorting by count I’ll bucket the values by count, indexed 1 to n, and read the buckets from the top until I’ve collected k values. That’s O(n) time and O(n) space. If k is small I’d also mention a min-heap of size k, which is O(n log k).”',
        followups: [
          { q: 'When would you prefer the heap?', a: 'When the values arrive as a stream, or when n is large but k is tiny and you can’t afford n buckets. Keep a min-heap of size k keyed by count: O(n log k) time, O(k) extra space beyond the counts.' },
          { q: 'What if two values tie at the cut-off?', a: 'The problem promises a unique answer, so it can’t happen here. In real code, decide a tie-break (smaller value first, say) and apply it when reading the bucket.' },
          { q: 'Is quickselect an option?', a: 'Run quickselect over the distinct values by count to find the k-th largest in O(d) average, where d is the number of distinct values. It’s O(n) on average like the buckets but with a worse worst case.' }
        ]
      },
      {
        lc: 128,
        restate: 'Given an unsorted array of integers, return the length of the longest run of consecutive values (like 4, 5, 6, 7) that appear anywhere in the array, in any order. It must run in O(n).',
        examples: '- `[100, 4, 200, 1, 3, 2]` → 4, from 1, 2, 3, 4.\n- `[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]` → 9, from 0 through 8.\n- Edge cases: the empty array → 0; duplicates (`[1, 2, 0, 1]` → 3); negative numbers.',
        brute: 'For every value, count upward (`x + 1`, `x + 2`, …) by scanning the array each time: O(n²) or worse. Sorting first gives O(n log n), which is quick to write but not the O(n) the problem asks for.',
        insight: 'Put every value in a set so “is `x + 1` present?” is O(1). Then only start counting from the **beginning** of a run, a value `x` whose predecessor `x - 1` is **not** in the set. Each run is then walked exactly once, from its start, so the total work is O(n) even though there’s a loop inside a loop.',
        code: {
          py: `class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        values = set(nums)
        best = 0
        for x in values:
            if x - 1 not in values:            # x starts a run; skip everything in the middle
                y = x
                while y + 1 in values:
                    y += 1
                best = max(best, y - x + 1)
        return best`,
          js: `function longestConsecutive(nums) {
  const values = new Set(nums);
  let best = 0;
  for (const x of values) {
    if (!values.has(x - 1)) {                  // x starts a run; skip everything in the middle
      let y = x;
      while (values.has(y + 1)) y++;
      best = Math.max(best, y - x + 1);
    }
  }
  return best;
}`,
          java: `class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> values = new HashSet<>();
        for (int x : nums) values.add(x);
        int best = 0;
        for (int x : values) {
            if (!values.contains(x - 1)) {       // x starts a run; skip everything in the middle
                int y = x;
                while (values.contains(y + 1)) y++;
                best = Math.max(best, y - x + 1);
            }
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> values(nums.begin(), nums.end());
        int best = 0;
        for (int x : values) {
            if (!values.count(x - 1)) {          // x starts a run; skip everything in the middle
                int y = x;
                while (values.count(y + 1)) y++;
                best = max(best, y - x + 1);
            }
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time: building the set is O(n), and the inner `while` only runs from run starts, so across the whole loop every value is stepped over at most once. O(n) space for the set.',
        say: '“Sorting gives O(n log n); to get O(n) I’ll use a hash set. For each value I only start counting if its predecessor isn’t in the set, so I’m at the start of a run. Then I walk up while the next value exists. Each run is walked once, from its start, so the total is O(n).”',
        followups: [
          { q: 'Why is it O(n) with a loop inside a loop?', a: 'The inner `while` is guarded by “`x - 1` is not in the set”. Every run has exactly one start, so each element is visited by the inner loop at most once, and by the outer loop once. About 2n steps.' },
          { q: 'What goes wrong if you drop the “start of a run” check?', a: 'On `[1, 2, 3, ..., n]` every value would walk the rest of the run, which is n + (n − 1) + … , so O(n²).' },
          { q: 'Can you return the run itself?', a: 'Remember the `x` that produced the best length, then the run is `x` up to `x + best - 1`.' }
        ]
      }
    ],

    practice: [
      { lc: 217,
        hints: ['You only need to know whether a value has appeared before, not where.', 'A set answers “is it in there?” in constant time. Check it before you add.', 'Return true the moment the check succeeds; return false if the loop ends.'],
        solution: { explain: 'The seen-before pattern with a set. O(n) time, O(n) space. (Sorting first and comparing neighbours is O(n log n) with O(1) extra space.)', code: {
          py: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        return len(set(nums)) != len(nums)`,
          js: `function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}` } },
        starter: { py: 'class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ', js: 'function containsDuplicate(nums) {\n  \n}' },
        tests: { fn: 'containsDuplicate', cases: [
          { args: [[1, 2, 3, 1]], out: true }, { args: [[1, 2, 3, 4]], out: false }, { args: [[]], out: false }, { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], out: true }, { args: [[-1, -1]], out: true }] } },

      { lc: 242,
        hints: ['Anagrams contain exactly the same letters with the same counts.', 'Different lengths can’t be anagrams, so check that first.', 'Count one string up and the other down in a single array of 26, then check that everything is zero.'],
        solution: { explain: 'Frequency counting with a fixed array. O(n) time, O(1) space (26 slots).', code: {
          py: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        counts = [0] * 26
        for a, b in zip(s, t):
            counts[ord(a) - 97] += 1
            counts[ord(b) - 97] -= 1
        return not any(counts)`,
          js: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }
  return counts.every((c) => c === 0);
}` } },
        starter: { py: 'class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ', js: 'function isAnagram(s, t) {\n  \n}' },
        tests: { fn: 'isAnagram', cases: [
          { args: ['anagram', 'nagaram'], out: true }, { args: ['rat', 'car'], out: false }, { args: ['a', 'a'], out: true }, { args: ['ab', 'a'], out: false }, { args: ['aacc', 'ccac'], out: false }] } },

      { lc: 383,
        hints: ['Every letter of the note has to come out of the magazine, and each magazine letter can be used once.', 'Count the letters available in the magazine.', 'Walk the note, spend one count per letter, and fail if a count would go below zero.'],
        solution: { explain: 'Count the magazine, then spend from the pool. O(n + m) time, O(1) space for lowercase letters.', code: {
          py: `class Solution:
    def canConstruct(self, ransomNote: str, magazine: str) -> bool:
        pool = Counter(magazine)
        for ch in ransomNote:
            if pool[ch] == 0:
                return False
            pool[ch] -= 1
        return True`,
          js: `function canConstruct(ransomNote, magazine) {
  const pool = new Map();
  for (const ch of magazine) pool.set(ch, (pool.get(ch) || 0) + 1);
  for (const ch of ransomNote) {
    if (!pool.get(ch)) return false;
    pool.set(ch, pool.get(ch) - 1);
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def canConstruct(self, ransomNote: str, magazine: str) -> bool:\n        ', js: 'function canConstruct(ransomNote, magazine) {\n  \n}' },
        tests: { fn: 'canConstruct', cases: [
          { args: ['a', 'b'], out: false }, { args: ['aa', 'ab'], out: false }, { args: ['aa', 'aab'], out: true }, { args: ['', 'abc'], out: true }, { args: ['abc', 'cba'], out: true }] } },

      { lc: 169,
        hints: ['The majority element appears more than n / 2 times, so it beats everything else combined.', 'Count each value and return the one whose count passes n / 2.', 'For O(1) space: keep a candidate and a counter, add one when you see the candidate and subtract one otherwise (Boyer-Moore voting).'],
        solution: { explain: 'Count every value and keep the one with the largest count. O(n) time, O(n) space. Boyer-Moore voting does it in O(1) space, because a true majority can’t be cancelled out by all the others.', code: {
          py: `class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        counts = Counter(nums)
        return max(counts, key=counts.get)`,
          js: `function majorityElement(nums) {
  const counts = new Map();
  let best = nums[0];
  for (const x of nums) {
    counts.set(x, (counts.get(x) || 0) + 1);
    if (counts.get(x) > counts.get(best)) best = x;
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        ', js: 'function majorityElement(nums) {\n  \n}' },
        tests: { fn: 'majorityElement', cases: [
          { args: [[3, 2, 3]], out: 3 }, { args: [[2, 2, 1, 1, 1, 2, 2]], out: 2 }, { args: [[1]], out: 1 }, { args: [[6, 5, 5]], out: 5 }, { args: [[-1, -1, 2]], out: -1 }] } },

      { lc: 1 ,
        hints: ['For each number, the partner you need is `target - x`.', 'Keep a map from value to index of the numbers you’ve already passed.', 'Look up the partner before you store the current number, so it can’t pair with itself.'],
        starter: { py: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ', js: 'function twoSum(nums, target) {\n  \n}' },
        tests: { fn: 'twoSum', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[2, 7, 11, 15], 9], out: [0, 1] }, { args: [[3, 2, 4], 6], out: [1, 2] }, { args: [[3, 3], 6], out: [0, 1] },
          { args: [[-3, 4, 3, 90], 0], out: [0, 2] }, { args: [[0, 4, 3, 0], 0], out: [0, 3] }, { args: [[5, 75, 25], 100], out: [1, 2] }] } },

      { lc: 205,
        hints: ['It’s a one-to-one mapping: each letter of s maps to one letter of t, and no two letters of s map to the same letter of t.', 'Keep a map from s-letters to t-letters, and a second map for the other direction.', 'Walk both strings together; if either map already holds a different partner, return false.'],
        solution: { explain: 'Two maps enforce the mapping in both directions. O(n) time, O(1) space for a bounded alphabet.', code: {
          py: `class Solution:
    def isIsomorphic(self, s: str, t: str) -> bool:
        a, b = {}, {}
        for x, y in zip(s, t):
            if a.setdefault(x, y) != y or b.setdefault(y, x) != x:
                return False
        return True`,
          js: `function isIsomorphic(s, t) {
  const a = new Map(), b = new Map();
  for (let i = 0; i < s.length; i++) {
    const x = s[i], y = t[i];
    if ((a.has(x) && a.get(x) !== y) || (b.has(y) && b.get(y) !== x)) return false;
    a.set(x, y);
    b.set(y, x);
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isIsomorphic(self, s: str, t: str) -> bool:\n        ', js: 'function isIsomorphic(s, t) {\n  \n}' },
        tests: { fn: 'isIsomorphic', cases: [
          { args: ['egg', 'add'], out: true }, { args: ['foo', 'bar'], out: false }, { args: ['paper', 'title'], out: true }, { args: ['badc', 'baba'], out: false }, { args: ['a', 'a'], out: true }] } },

      { lc: 49,
        hints: ['Two strings are anagrams when their letter counts match, so find one key that every anagram shares.', 'The sorted letters of a word, or its 26 counts as a tuple, make a good key.', 'Use a map from key to list of words, then return the map’s values.'],
        starter: { py: 'class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ', js: 'function groupAnagrams(strs) {\n  \n}' },
        tests: { fn: 'groupAnagrams', compare: 'deep', sig: { args: ['str[]'] }, cases: [
          { args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], out: [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']] }, { args: [['']], out: [['']] },
          { args: [['a']], out: [['a']] }, { args: [['', '']], out: [['', '']] }, { args: [['ab', 'ba', 'abc', 'cab']], out: [['ab', 'ba'], ['abc', 'cab']] }] } },

      { lc: 347,
        hints: ['First count how often each value appears.', 'A count can’t exceed n, so counts make good array indices: bucket the values by count.', 'Read the buckets from the highest count down and stop once you have k values.'],
        starter: { py: 'class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ', js: 'function topKFrequent(nums, k) {\n  \n}' },
        tests: { fn: 'topKFrequent', compare: 'unordered', sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 1, 1, 2, 2, 3], 2], out: [1, 2] }, { args: [[1], 1], out: [1] }, { args: [[4, 4, 4, 6, 6, 7], 1], out: [4] },
          { args: [[-1, -1, 2, 2, 2, 3], 2], out: [2, -1] }, { args: [[5, 3, 5, 3, 5, 9, 9, 9, 9], 3], out: [9, 5, 3] }] } },

      { lc: 238,
        hints: ['Division is off the table, and zeros would break it anyway.', 'The answer at i is (the product of everything to its left) times (the product of everything to its right).', 'Fill the output with left products in one pass, then multiply in the right products with a running variable on a second pass from the end.'],
        solution: { explain: 'Prefix and suffix products stored in the output array itself: no division, O(n) time, O(1) extra space beyond the output.', code: {
          py: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        out = [1] * n
        left = 1
        for i in range(n):
            out[i] = left          # product of everything to the left of i
            left *= nums[i]
        right = 1
        for i in range(n - 1, -1, -1):
            out[i] *= right        # times the product of everything to the right
            right *= nums[i]
        return out`,
          js: `function productExceptSelf(nums) {
  const n = nums.length, out = new Array(n).fill(1);
  let left = 1;
  for (let i = 0; i < n; i++) {
    out[i] = left;                 // product of everything to the left of i
    left *= nums[i];
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= right;               // times the product of everything to the right
    right *= nums[i];
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        ', js: 'function productExceptSelf(nums) {\n  \n}' },
        tests: { fn: 'productExceptSelf', cases: [
          { args: [[1, 2, 3, 4]], out: [24, 12, 8, 6] }, { args: [[-1, 1, 0, -3, 3]], out: [0, 0, 9, 0, 0] }, { args: [[2, 3]], out: [3, 2] }, { args: [[0, 0]], out: [0, 0] }] } },

      { lc: 448,
        hints: ['Values are from 1 to n in an array of length n, so every value names a slot in the same array.', 'When you see a value, flip the sign of the number at its slot to mark it as “seen”. Use the absolute value when you read.', 'Afterwards, every slot that is still positive means its index + 1 never appeared.'],
        solution: { explain: 'The array is its own hash table: sign flips mark presence. O(n) time, O(1) extra space, and the input is modified.', code: {
          py: `class Solution:
    def findDisappearedNumbers(self, nums: List[int]) -> List[int]:
        for x in nums:
            i = abs(x) - 1
            if nums[i] > 0:
                nums[i] = -nums[i]
        return [i + 1 for i, x in enumerate(nums) if x > 0]`,
          js: `function findDisappearedNumbers(nums) {
  for (const x of nums) {
    const i = Math.abs(x) - 1;
    if (nums[i] > 0) nums[i] = -nums[i];
  }
  const out = [];
  nums.forEach((x, i) => { if (x > 0) out.push(i + 1); });
  return out;
}` } },
        starter: { py: 'class Solution:\n    def findDisappearedNumbers(self, nums: List[int]) -> List[int]:\n        ', js: 'function findDisappearedNumbers(nums) {\n  \n}' },
        tests: { fn: 'findDisappearedNumbers', cases: [
          { args: [[4, 3, 2, 7, 8, 2, 3, 1]], out: [5, 6] }, { args: [[1, 1]], out: [2] }, { args: [[1, 2, 3]], out: [] }, { args: [[2, 2]], out: [1] }] } },

      { lc: 128,
        hints: ['Sorting works in O(n log n), but the problem wants O(n), so put the values in a set instead.', 'Only start counting at a value whose predecessor `x - 1` is not in the set.', 'From such a start, walk up while `y + 1` is in the set, and keep the longest length.'],
        starter: { py: 'class Solution:\n    def longestConsecutive(self, nums: List[int]) -> int:\n        ', js: 'function longestConsecutive(nums) {\n  \n}' },
        tests: { fn: 'longestConsecutive', sig: { args: ['int[]'] }, cases: [
          { args: [[100, 4, 200, 1, 3, 2]], out: 4 }, { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], out: 9 }, { args: [[]], out: 0 },
          { args: [[1, 2, 0, 1]], out: 3 }, { args: [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]], out: 7 }] } },

      { lc: 36,
        hints: ['A board is valid when no digit repeats in any row, any column, or any of the nine 3 by 3 boxes. Empty cells are ignored.', 'One set per row, per column and per box is enough, filled while you scan the board once.', 'The box of cell (r, c) is `(r // 3, c // 3)`. A digit that is already in any of its three sets makes the board invalid.'],
        solution: { explain: 'Seen-before with three kinds of keys, in one set of tuples. O(81) = O(1) time and space, since the board size is fixed.', code: {
          py: `class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        seen = set()
        for r in range(9):
            for c in range(9):
                v = board[r][c]
                if v == '.':
                    continue
                for key in (('row', r, v), ('col', c, v), ('box', r // 3, c // 3, v)):
                    if key in seen:
                        return False
                    seen.add(key)
        return True`,
          js: `function isValidSudoku(board) {
  const seen = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === '.') continue;
      const keys = ['r' + r + v, 'c' + c + v, 'b' + Math.floor(r / 3) + Math.floor(c / 3) + v];
      for (const key of keys) {
        if (seen.has(key)) return false;
        seen.add(key);
      }
    }
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isValidSudoku(self, board: List[List[str]]) -> bool:\n        ', js: 'function isValidSudoku(board) {\n  \n}' },
        tests: { fn: 'isValidSudoku', cases: [
          { args: [[['5', '3', '.', '.', '7', '.', '.', '.', '.'], ['6', '.', '.', '1', '9', '5', '.', '.', '.'], ['.', '9', '8', '.', '.', '.', '.', '6', '.'], ['8', '.', '.', '.', '6', '.', '.', '.', '3'], ['4', '.', '.', '8', '.', '3', '.', '.', '1'], ['7', '.', '.', '.', '2', '.', '.', '.', '6'], ['.', '6', '.', '.', '.', '.', '2', '8', '.'], ['.', '.', '.', '4', '1', '9', '.', '.', '5'], ['.', '.', '.', '.', '8', '.', '.', '7', '9']]], out: true },
          { args: [[['8', '3', '.', '.', '7', '.', '.', '.', '.'], ['6', '.', '.', '1', '9', '5', '.', '.', '.'], ['.', '9', '8', '.', '.', '.', '.', '6', '.'], ['8', '.', '.', '.', '6', '.', '.', '.', '3'], ['4', '.', '.', '8', '.', '3', '.', '.', '1'], ['7', '.', '.', '.', '2', '.', '.', '.', '6'], ['.', '6', '.', '.', '.', '.', '2', '8', '.'], ['.', '.', '.', '4', '1', '9', '.', '.', '5'], ['.', '.', '.', '.', '8', '.', '.', '7', '9']]], out: false },
          { args: [[['1', '.', '.', '.', '.', '.', '.', '.', '1'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.']]], out: false },
          { args: [[['2', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['2', '.', '.', '.', '.', '.', '.', '.', '.']]], out: false },
          { args: [[['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.']]], out: true }] } }
    ],

    mistakes: [
      '**Storing before looking.** In Two Sum, adding `nums[i]` to the map before asking for `target - nums[i]` lets a number pair with itself: `[3, 2, 4]` with target 6 returns `[0, 0]`. Look first, then store.',
      '**Returning values instead of indices** (or the other way round). Reread what the question wants back. If the answer is an index, the map’s value must be the index, not the count.',
      '**Unhashable or unstable keys.** *Python:* a list can’t be a dict key or set member (use a tuple). *JavaScript:* a `Map` or `Set` compares arrays and objects by reference, so `[1, 2]` never matches another `[1, 2]`; join the parts into a string key. *Java:* an `int[]` as a key hashes by identity; use `Arrays.toString`, a `List<Integer>`, or a string.',
      '**Starting the scan at every element in Longest Consecutive Sequence.** Without the “`x - 1` is not in the set” guard, each run is walked once per member, which is O(n²) on a long run.',
      '**Using a sorted key for grouping when the words are huge,** or forgetting that empty strings are valid and group together. The key length is part of the cost: O(n·k), not O(n).',
      '**Reading a missing key as if it were present.** *Python:* `counts[x]` raises `KeyError` on a plain dict, and on a `defaultdict` it **inserts** the key; use `.get(x, 0)`. *JavaScript:* `map.get(x) + 1` is `NaN` for a new key, so write `(map.get(x) || 0) + 1`; and a plain object `{}` already has keys like `constructor`, so `counts["constructor"] || 0` isn’t 0, which is why a `Map` is safer for words. *Java:* `int c = map.get(x)` throws `NullPointerException` when `x` is missing; use `getOrDefault` or `merge`. *C++:* `counts[x]` **inserts** `x` with count 0 when you only meant to read it, so use `find` or `count` for a pure lookup; and `unordered_map` has no built-in hash for a `pair` or `vector` key, so build a string key instead.',
      '**Forgetting that the in-place trick changes the input.** Flipping signs in the array (448) or reusing it as a table breaks the caller’s data. Say so, and restore the signs if the array is needed afterwards.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What are the time and space complexity of the one-pass hash-map solution to Two Sum on n numbers?',
        choices: ['O(n) time, O(n) space', 'O(n) time, O(1) space', 'O(n²) time, O(1) space', 'O(n log n) time, O(n) space'], answer: 0,
        explain: 'One pass with one expected-O(1) lookup and one insert per element gives O(n) time. In the worst case the map holds every element, so O(n) space. The nested-loop version is the one that has O(n²) time and O(1) space.' },
      { kind: 'pattern', q: 'Which of these is best solved by a hash map or set as stated?',
        choices: ['Whether any value appears twice in an unsorted array', 'Two numbers in a sorted array that add to a target using O(1) extra space', 'The longest substring with at most two distinct letters', 'The number of subarrays whose sum equals k, with negative numbers allowed'], answer: 0,
        explain: 'Membership and duplicates are the set pattern. The sorted pair with O(1) space is two pointers, the substring question is a sliding window, and subarray sums with negatives need prefix sums (which do use a map, but of running sums).' },
      { kind: 'pattern', q: 'Which signals point to a hash map or set? Pick every one that applies.',
        choices: ['You keep wanting to ask “have I seen this before?” inside a loop', 'The question counts or groups items by a property', 'The array is sorted and you must use O(1) extra space', 'Values are small integers, so an array can act as the table'], answer: [0, 1, 3],
        explain: 'Repeated membership checks, counting and grouping are the core cues, and bounded small keys let an array replace the hash table. A sorted array with O(1) space points to two pointers instead.' },
      { kind: 'bug', q: 'This Two Sum returns `[0, 0]` for `[3, 2, 4]` with target 6, but the answer is `[1, 2]`. What is the bug?',
        code: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        seen[x] = i
        need = target - x
        if need in seen:
            return [seen[need], i]
    return []`,
        choices: ['It stores `x` before looking up its partner, so a number can match itself', 'It should use a list instead of a dict', '`need` should be `x - target`', 'It should return `[i, seen[need]]`'], answer: 0,
        explain: 'At i = 0, `3` is stored first, then `need = 3` is found in the map: the number paired with itself. Look up the partner first and store afterwards.' },
      { kind: 'concept', q: 'Why does the Longest Consecutive Sequence solution only start counting at values whose predecessor is missing from the set?',
        choices: ['So each run is walked exactly once, keeping the total work O(n)', 'To avoid counting negative numbers', 'Because sets can’t be iterated in order', 'To make the set smaller'], answer: 0,
        explain: 'Every run has exactly one start. Skipping the middle elements means the inner loop touches each element at most once overall. Without the guard, a run of length n is walked from every member: O(n²).' },
      { kind: 'concept', q: 'For Group Anagrams, which property must the key have?',
        choices: ['The same for every anagram of a word, and different for strings that aren’t anagrams', 'Unique for every string', 'Sorted alphabetically across the whole input', 'Equal to the string’s length'], answer: 0,
        explain: 'A key that varies within a group splits it; a key shared across groups merges them. The sorted letters, or the letter counts, are canonical: identical for all anagrams and different otherwise.' },
      { kind: 'complexity', q: 'Top K Frequent Elements: why can the bucket approach beat sorting the counts?',
        choices: ['A count is at most n, so counts are small integers that can index an array of n + 1 buckets', 'Buckets use no extra memory', 'A hash map keeps its keys sorted by value', 'k is always 1'], answer: 0,
        explain: 'Because a frequency is between 1 and n, you can place each value in the bucket for its count and read from the top: O(n) time instead of O(n log n) for sorting.' },
      { kind: 'concept', q: 'Why is the claim “a hash-map lookup is O(1)” slightly incomplete?',
        choices: ['It’s the expected cost: many collisions can slow it down, and hashing a long key takes time proportional to the key’s length', 'Lookups are really O(log n) always', 'Lookups only work for integers', 'It ignores the cost of building the map'], answer: 0,
        explain: 'A table’s operations are O(1) on average, with a worse worst case under heavy collisions, and the hash of a string or tuple takes time proportional to its length. That is why Group Anagrams is O(n·k).' }
    ],

    flashcards: [
      { id: 'look-then-store', front: 'Two Sum with a hash map: in what order do you look up and store?', back: 'Look up `target - x` first, then store `x`. Storing first lets a number pair with itself.' },
      { id: 'tradeoff', front: 'What does the hash-map pattern trade, and for what?', back: 'O(n) extra memory for O(1) expected lookups, which turns an O(n²) double loop into one O(n) pass.' },
      { id: 'what-to-store', front: 'Seen-before, complement, counting, grouping: what does the map store in each?', back: 'Seen-before: a set of values. Complement: value → index. Counting: value → count. Grouping: canonical key → list of members.' },
      { id: 'anagram-key', front: 'Two canonical keys for grouping anagrams?', back: 'The sorted letters (O(k log k) per word) or the 26 letter counts as a tuple (O(k) per word).' },
      { id: 'list-key', front: 'Why can’t a Python list be a dict key, and what do you use?', back: 'Lists are mutable, so they’re unhashable. Use a tuple. In JavaScript, a `Map` compares arrays by reference, so join the parts into a string key.' },
      { id: 'bucket-freq', front: 'How do you get Top K Frequent in O(n)?', back: 'Count, then bucket the values by count (counts are at most n), and read the buckets from the highest count down until you have k values.' },
      { id: 'consec-start', front: 'Longest Consecutive Sequence: why start only where `x - 1` is absent?', back: 'Each run has one start, so each element is walked once and the total is O(n). Without the guard it can be O(n²).' },
      { id: 'array-table', front: 'Values 1..n in an array of length n: how can the array be its own hash table?', back: 'Value v names slot v − 1. Flip the sign there to mark “seen”; slots still positive afterwards are the missing values. O(1) extra space, but it mutates the input.' },
      { id: 'array-or-map', front: 'When can an array replace a hash map for counting?', back: 'When the keys are small bounded integers, such as 26 lowercase letters, 128 ASCII codes or values 1 to n. It’s faster and uses no hashing.' },
      { id: 'hash-cost', front: 'What hidden cost does the O(1) lookup claim ignore?', back: 'Hashing a key of length k costs O(k), and collisions can slow a lookup in the worst case. Say it for string keys.' },
      { id: 'not-hash', front: 'Sorted array pair sum with O(1) space: hash map or something else?', back: 'Two pointers from both ends. A hash map would spend O(n) memory the problem doesn’t need.' }
    ],

    deeper: [
      { title: 'Hash Tables (CS Dojo)', url: 'https://www.youtube.com/watch?v=shs0KM3wKv8', time: 'about 15 min', note: 'A short video on how a hash table stores and finds keys, as linked from DSA-Kit. Watch it if “why is a lookup constant time?” still feels like magic.' },
      { title: 'Hashing: LeetCode Tag', url: 'https://leetcode.com/tag/hash-table/', time: 'reference', note: 'Every LeetCode problem tagged Hash Table. Good for extra reps after the practice set here.' },
      { title: 'Hashing in Practice (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/hashing-data-structure/', time: 'about 20 min', note: 'An overview of hashing with the usual collision-handling schemes. Pairs with this site’s Hashing internals topic.' },
      { title: 'Arrays (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/array-data-structure/', time: 'about 15 min', note: 'The basics of arrays: indexing, insertion cost, and traversal. A refresher if the in-place tricks feel unfamiliar.' }
    ],

    detective: [
      { id: 'coupon-pair', decoys: ['two-pointers', 'sorting', 'prefix-sums'],
        statement: 'A shop prints each customer’s receipt total in cents, in the order customers checked out, and has a gift card whose balance it wants to clear exactly. Management wants to know which **two different customers’ receipts** add up to exactly the balance, so they can send them a joint offer. Given the totals in checkout order and the balance, return the positions of the two receipts.',
        why: 'The partner of every receipt is fixed (`balance - total`), the totals are unsorted, and the answer is a pair of original positions. Asking “did I already see my partner?” with a map from total to position finds it in one pass, and sorting would lose the positions.' },
      { id: 'typo-tally', decoys: ['sorting', 'heaps', 'two-pointers'],
        statement: 'A spelling checker logs every word that users mis-type in a week, one entry per mistake. The team wants a short list of the **ten words that were mis-typed most often**. Given the log of up to a million entries, produce that list in time proportional to the log’s length.',
        why: 'It’s counting, then picking the biggest counts. A hash map gives the counts in one pass, and since no count can exceed the log’s length, buckets indexed by count give the top ten without a sort. A heap works too at O(n log k), but “proportional to the length” points at buckets.' },
      { id: 'mirror-words', decoys: ['sorting', 'string-algos', 'two-pointers'],
        statement: 'A word-game company stores its dictionary as a plain list. For a new “find the hidden twins” level, it wants to bundle together all words that use **exactly the same letters, the same number of times**, in any order, for example “listen” and “silent”. Given the dictionary, return the bundles.',
        why: 'Words with the same letter counts are one group, so the work is picking a key every member shares: sorted letters or a 26-slot count. Group by that key in a map from key to list of words.' },
      { id: 'streak-hunt', decoys: ['sorting', 'union-find', 'dp-1d'],
        statement: 'A fitness app stores the day numbers on which a user trained, in no particular order and sometimes twice. The app wants to praise the user’s **longest streak of back-to-back days**. Given the list, return the length of that streak, without sorting the list first.',
        why: 'Putting the days in a set makes “did they train the day before?” a constant-time check. Starting a count only on days whose previous day is missing means each streak is walked once, giving O(n) with no sort.' },
      { id: 'first-twice', decoys: ['two-pointers', 'sliding-window', 'bits'],
        statement: 'A ticket scanner reads barcodes at a gate. Each barcode should only ever be scanned once; a repeat means a forged copy. Given the stream of scanned codes in order, report as early as possible whether any code has been scanned **before**, without holding anything but the codes themselves.',
        why: '“Have I seen this before?” on a stream is the seen-before pattern: a set of past codes, checked before each new one is added. Sorting wouldn’t work because answers are needed as the codes arrive.' }
    ]
  });
})();
