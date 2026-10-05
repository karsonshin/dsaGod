/* Offer Ready: Sliding window, the gold-standard lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'sliding-window',

    hook: 'When a question says *contiguous* (a subarray, a substring, a run of days), test a sliding window first. It turns “check every start and every end” (O(n²) or worse) into one pass, and it’s among the most common patterns in phone screens and online assessments: NeetCode 150 gives it a section of its own.',

    cues: [
      'The question is about a **contiguous** subarray or substring: the longest, the shortest, how many, or every window of size k.',
      'There’s a rule a window either keeps or breaks: no repeats, at most k distinct values, sum at most a target, contains every letter of another string.',
      'The rule is **monotonic**: shrinking a valid window keeps it valid (for longest), or growing a valid window keeps it valid (for shortest).',
      'A fixed size is given: “every k consecutive days”, “average of k elements”, “an anagram of p”.',
      'The brute force is a double loop over start and end, and the inner loop redoes work the previous start already did.',
      'The trap: a sum rule with **negative numbers** isn’t monotonic. That’s prefix sums and a hash map, not a window.'
    ],

    intuition: [
      'Picture reading a long line of text through a cardboard frame. To see the next character, you slide the frame’s right edge forward. If the frame now shows something it shouldn’t (a repeated letter, a total over budget), you pull the left edge forward until it’s fine again. The frame never moves backwards, and every character enters it once and leaves at most once.',
      'That’s the whole pattern. Precisely:',
      '1. Keep two indices, `left` and `right`, for the window `[left, right]`, plus a summary of what’s inside: a set, a count map, a running sum.\n2. For each `right` from 0 to n − 1, add the new element to the summary.\n3. While the window breaks the rule, remove the element at `left` from the summary and move `left` forward.\n4. The window is valid again. Record what you need, usually its length `right - left + 1`.',
      'Why is it safe never to move `left` back? Because the rule is **monotonic**: if a window is valid, every smaller window inside it is valid too. When `right` moves on, the best `left` for it can only stay put or move right. Check that property before you reach for this pattern. Without it (a sum rule over negative numbers, for example), the window quietly gives wrong answers.',
      'The pattern comes in two shapes. A **variable** window grows and shrinks with the rule, as above. A **fixed** window keeps a set size k: one element in, one element out, every step.'
    ].join('\n\n'),

    viz: 'sliding-window',

    template: {
      title: 'Variable window: the longest window that keeps the rule',
      note: 'To reuse it, change three things and keep the skeleton: **what the window remembers** (here `counts`), **the rule** in the `while` (here “some character appears twice”), and **what you record** (here the longest length). Grow right, shrink left while invalid, record: that skeleton covers most longest-window questions.',
      code: {
        py: `def longest_window(s):
    counts = {}                              #> What's inside the window, kept in sync with left and right
    left = best = 0
    for right, ch in enumerate(s):           #@expand > 1. Grow: take s[right] into the window
        counts[ch] = counts.get(ch, 0) + 1
        while counts[ch] > 1:                #@check > 2. The rule broke (here: a repeated character)
            counts[s[left]] -= 1             #@shrink > 3. Shrink from the left until the rule holds again
            left += 1
        best = max(best, right - left + 1)   #@record > 4. Every window that reaches this line is valid
    return best`,
        js: `function longestWindow(s) {
  const counts = new Map();                        //> What's inside the window, kept in sync with left and right
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) { //@expand > 1. Grow: take s[right] into the window
    const ch = s[right];
    counts.set(ch, (counts.get(ch) || 0) + 1);
    while (counts.get(ch) > 1) {                   //@check > 2. The rule broke (here: a repeated character)
      counts.set(s[left], counts.get(s[left]) - 1); //@shrink > 3. Shrink from the left until the rule holds again
      left++;
    }
    best = Math.max(best, right - left + 1);       //@record > 4. Every window that reaches this line is valid
  }
  return best;
}`,
        java: `class Solution {
    public int longestWindow(String s) {
        Map<Character, Integer> counts = new HashMap<>();   //> What's inside the window, kept in sync with left and right
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {  //@expand > 1. Grow: take s[right] into the window
            char ch = s.charAt(right);
            counts.merge(ch, 1, Integer::sum);
            while (counts.get(ch) > 1) {                    //@check > 2. The rule broke (here: a repeated character)
                counts.merge(s.charAt(left), -1, Integer::sum); //@shrink > 3. Shrink from the left until the rule holds again
                left++;
            }
            best = Math.max(best, right - left + 1);        //@record > 4. Every window that reaches this line is valid
        }
        return best;
    }
}`,
        cpp: `class Solution {
public:
    int longestWindow(string s) {
        unordered_map<char, int> counts;                      //> What's inside the window, kept in sync with left and right
        int left = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) { //@expand > 1. Grow: take s[right] into the window
            char ch = s[right];
            counts[ch]++;
            while (counts[ch] > 1) {                          //@check > 2. The rule broke (here: a repeated character)
                counts[s[left]]--;                            //@shrink > 3. Shrink from the left until the rule holds again
                left++;
            }
            best = max(best, right - left + 1);               //@record > 4. Every window that reaches this line is valid
        }
        return best;
    }
};`
      },
      tests: { fn: { py: 'longest_window', default: 'longestWindow' }, sig: { args: ['str'] }, cases: [
        { args: ['abcabcbb'], out: 3 }, { args: ['bbbbb'], out: 1 }, { args: ['pwwkew'], out: 3 }, { args: [''], out: 0 },
        { args: ['dvdf'], out: 3 }, { args: ['abba'], out: 2 }, { args: [' '], out: 1 }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(k)',
      why: '`right` visits each index once. `left` only ever moves forward, so across the whole run it also moves at most n times. Each move does O(1) work on the summary, so the total is O(n), even with a loop inside a loop. Space is the summary itself: the count map holds at most k distinct keys, where k is the alphabet size (26 lowercase letters, 128 ASCII characters), so O(min(n, k)).',
      trap: 'Don’t call it O(n²) because of the nested `while`. Count how many times each pointer moves in total: at most n each. Interviewers often ask you to justify exactly this, so say it out loud: “amortized O(n), because every element is added once and removed at most once.”'
    },

    variations: [
      {
        name: 'Fixed window of size k',
        body: 'When the size is given, there’s nothing to decide: add the new element, remove the one that just fell off the back (`right - k`), and record once the window is full (`right >= k - 1`). Running sums, letter counts for anagrams, and “every k consecutive” questions all use it. Unlike the variable window, it works fine with negative numbers, because the size never depends on the values.',
        code: {
          py: `def max_window_sum(nums, k):
    window = best = sum(nums[:k])                 #> The first full window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]   #> One element in, one element out
        best = max(best, window)
    return best`,
          js: `function maxWindowSum(nums, k) {
  let window = 0;
  for (let i = 0; i < k; i++) window += nums[i];   //> The first full window
  let best = window;
  for (let right = k; right < nums.length; right++) {
    window += nums[right] - nums[right - k];       //> One element in, one element out
    best = Math.max(best, window);
  }
  return best;
}`,
          java: `class Solution {
    public int maxWindowSum(int[] nums, int k) {
        int window = 0;
        for (int i = 0; i < k; i++) window += nums[i];   //> The first full window
        int best = window;
        for (int right = k; right < nums.length; right++) {
            window += nums[right] - nums[right - k];     //> One element in, one element out
            best = Math.max(best, window);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int maxWindowSum(vector<int>& nums, int k) {
        int window = 0;
        for (int i = 0; i < k; i++) window += nums[i];   //> The first full window
        int best = window;
        for (int right = k; right < (int)nums.size(); right++) {
            window += nums[right] - nums[right - k];     //> One element in, one element out
            best = max(best, window);
        }
        return best;
    }
};`
        },
        tests: { fn: { py: 'max_window_sum', default: 'maxWindowSum' }, sig: { args: ['int[]', 'int'] }, cases: [
          { args: [[1, 12, -5, -6, 50, 3], 4], out: 51 }, { args: [[5], 1], out: 5 }, { args: [[-1, -2, -3], 2], out: -3 }, { args: [[2, 1, 5, 1, 3, 2], 3], out: 9 }] }
      },
      {
        name: 'Shortest valid window',
        body: 'When the question wants the **shortest** window that satisfies the rule (sum at least a target, covers every letter of another string), flip the loop: grow until the window becomes valid, then shrink **while it stays valid**, recording inside the `while`. The record moves inside because the window is valid exactly while you’re shrinking it. Minimum Size Subarray Sum (209) and Minimum Window Substring (76) work this way.',
        code: {
          py: `def min_window_len(target, nums):        # every number is positive
    left = total = 0
    best = float('inf')
    for right, x in enumerate(nums):
        total += x
        while total >= target:               #> Valid: record it, then try a shorter one
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if best == float('inf') else best`,
          js: `function minWindowLen(target, nums) {    // every number is positive
  let left = 0, total = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {               //> Valid: record it, then try a shorter one
      best = Math.min(best, right - left + 1);
      total -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}`
        },
        tests: { fn: { py: 'min_window_len', default: 'minWindowLen' }, cases: [
          { args: [7, [2, 3, 1, 2, 4, 3]], out: 2 }, { args: [4, [1, 4, 4]], out: 1 }, { args: [11, [1, 1, 1, 1, 1, 1, 1, 1]], out: 0 }, { args: [15, [1, 2, 3, 4, 5]], out: 5 }] }
      },
      {
        name: 'Counting windows, and the “exactly k” trick',
        body: 'For “how many subarrays satisfy the rule”, every valid window that ends at `right` counts: `[left..right]`, `[left+1..right]`, and so on down to `[right..right]`. That’s `right - left + 1` new subarrays per step (Subarray Product Less Than K, 713).\n\nFor “**exactly** k” rules, count “at most k” and subtract “at most k − 1”. Exactly-k windows don’t shrink cleanly (dropping one element can take you to k − 1), but at-most-k windows do, and every exactly-k subarray is counted by the first and not the second (Subarrays with K Different Integers, 992).',
        code: {
          py: `def subarrays_with_k_distinct(nums, k):
    def at_most(k):
        counts, left, total = {}, 0, 0
        for right, x in enumerate(nums):
            counts[x] = counts.get(x, 0) + 1
            while len(counts) > k:
                counts[nums[left]] -= 1
                if counts[nums[left]] == 0:
                    del counts[nums[left]]   #> Drop zeros so len() counts distinct values
                left += 1
            total += right - left + 1        #> Every window ending at right is valid
        return total
    return at_most(k) - at_most(k - 1)`,
          js: `function subarraysWithKDistinct(nums, k) {
  const atMost = (k) => {
    const counts = new Map();
    let left = 0, total = 0;
    for (let right = 0; right < nums.length; right++) {
      counts.set(nums[right], (counts.get(nums[right]) || 0) + 1);
      while (counts.size > k) {
        const out = nums[left++];
        counts.set(out, counts.get(out) - 1);
        if (counts.get(out) === 0) counts.delete(out);   //> Drop zeros so size counts distinct values
      }
      total += right - left + 1;                          //> Every window ending at right is valid
    }
    return total;
  };
  return atMost(k) - atMost(k - 1);
}`
        },
        tests: { fn: { py: 'subarrays_with_k_distinct', default: 'subarraysWithKDistinct' }, cases: [
          { args: [[1, 2, 1, 2, 3], 2], out: 7 }, { args: [[1, 2, 1, 3, 4], 3], out: 3 }, { args: [[1, 1, 1], 1], out: 6 }, { args: [[1, 2], 1], out: 2 }] }
      },
      {
        name: 'The max or min of every window',
        body: 'A count map can’t answer “what’s the largest value in this window?” cheaply: when the maximum leaves, you need the next one. Keep a deque of indices whose values decrease from front to back. The front is always the window’s maximum; pop smaller values off the back before pushing, and pop the front when it slides out (Sliding Window Maximum, 239). That structure, a monotonic queue, has [its own topic](#/topic/monotonic).'
      },
      {
        name: 'When a window is the wrong tool',
        body: 'Shrinking only works when the rule is monotonic. Sums with negative numbers break it: adding −3 can turn an over-budget window into a valid one, so “shrink while invalid” skips answers. For “subarray sum equals k” with negatives (LeetCode 560), use [prefix sums with a hash map](#/topic/prefix-sums). If the elements don’t need to be contiguous at all, it isn’t a window question.'
      }
    ],

    worked: [
      {
        lc: 3,
        restate: 'Given a string, return the length of the longest stretch of consecutive characters in which no character appears twice.',
        examples: '- `"abcabcbb"` → 3, from `"abc"`.\n- `"bbbbb"` → 1.\n- `"pwwkew"` → 3, from `"wke"`. (`"pwke"` doesn’t count: it isn’t contiguous.)\n- Edge cases: the empty string → 0; spaces and digits are characters too; `"abba"` → 2, the classic trap for the jump version below.',
        brute: 'Try every start, extend while no character repeats, and keep the longest. With a set that’s O(n²) windows; rebuilding the set for every window makes it O(n³). Fine for n ≤ 1,000, too slow for the real limit of 5·10⁴.',
        insight: 'If `s[right]` already appears in the window at index `j`, every window that still contains index `j` is invalid. So `left` can jump straight to `j + 1`. Remember the last index of each character and move `left` there in one step, instead of shrinking one character at a time.',
        code: {
          py: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}                        # character -> index where we last saw it
        left = best = 0
        for right, ch in enumerate(s):
            if ch in last and last[ch] >= left:
                left = last[ch] + 1      # jump past the earlier copy
            last[ch] = right
            best = max(best, right - left + 1)
        return best`,
          js: `function lengthOfLongestSubstring(s) {
  const last = new Map();               // character -> index where we last saw it
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;  // jump past the earlier copy
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
          java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();  // character -> index where we last saw it
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            Integer prev = last.get(ch);
            if (prev != null && prev >= left) left = prev + 1;  // jump past the earlier copy
            last.put(ch, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> last;  // character -> index where we last saw it
        int left = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            char ch = s[right];
            auto it = last.find(ch);
            if (it != last.end() && it->second >= left) left = it->second + 1;  // jump past the earlier copy
            last[ch] = right;
            best = max(best, right - left + 1);
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time: one pass with O(1) work per character. O(min(n, k)) space for the last-seen map, where k is the alphabet size.',
        say: '“I want the longest contiguous run with no repeats, so I’ll keep a window that’s always repeat-free. I extend `right` one character at a time. If the new character is already inside the window, I move `left` just past its previous position, because any window that still holds the earlier copy is invalid. I record the best length as I go. Each index is visited once, so it’s O(n) time and O(alphabet) space.”',
        followups: [
          { q: 'Why check `last[ch] >= left` instead of always jumping?', a: 'The earlier copy may already be outside the window, and jumping to it would move `left` backwards and let a repeat back in. In `"abba"`, when the last a arrives its previous index is 0, but `left` is already 2. Writing `left = max(left, last[ch] + 1)` is the same guard.' },
          { q: 'What if the input can be any Unicode text?', a: 'The hash-map version handles any alphabet. For plain ASCII or bytes, an array of 128 or 256 slots is faster. Say which one you’re assuming.' },
          { q: 'Can you return the substring itself?', a: 'Keep the `left` and `right` that produced the best length, and slice `s[bestLeft:bestRight + 1]` at the end. Still O(n).' },
          { q: 'What if each character may appear at most k times?', a: 'Use the count-map template: increment `counts[ch]`, then shrink while `counts[ch] > k`.' }
        ]
      },
      {
        lc: 424,
        restate: 'You get a string of uppercase letters and a budget k. You may change up to k characters to any letter. Return the length of the longest stretch you can turn into a single repeated letter.',
        examples: '- `"ABAB"`, k = 2 → 4: change both B’s (or both A’s).\n- `"AABABBA"`, k = 1 → 4: `"AABA"` becomes `"AAAA"`.\n- Edge cases: k at least the string’s length → the whole string; k = 0 → the longest run of one letter.',
        brute: 'For every substring, find its most frequent letter and check whether the rest fit in the budget: O(n²) substrings × 26 counts. Too slow for n = 10⁵.',
        insight: 'A window can become one letter exactly when the letters that **aren’t** its most common letter fit in the budget: `windowLength - maxCount <= k`. Shrinking a valid window keeps it valid, so the longest-window template applies, with an array of 26 counts.',
        code: {
          py: `class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        counts = [0] * 26
        left = max_count = best = 0
        for right, ch in enumerate(s):
            i = ord(ch) - ord('A')
            counts[i] += 1
            max_count = max(max_count, counts[i])
            while (right - left + 1) - max_count > k:  # more letters to change than the budget allows
                counts[ord(s[left]) - ord('A')] -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`,
          js: `function characterReplacement(s, k) {
  const counts = new Array(26).fill(0);
  let left = 0, maxCount = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const i = s.charCodeAt(right) - 65;
    counts[i]++;
    maxCount = Math.max(maxCount, counts[i]);
    while ((right - left + 1) - maxCount > k) {  // more letters to change than the budget allows
      counts[s.charCodeAt(left) - 65]--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
          java: `class Solution {
    public int characterReplacement(String s, int k) {
        int[] counts = new int[26];
        int left = 0, maxCount = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            maxCount = Math.max(maxCount, ++counts[s.charAt(right) - 'A']);
            while ((right - left + 1) - maxCount > k) {  // more letters to change than the budget allows
                counts[s.charAt(left) - 'A']--;
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int characterReplacement(string s, int k) {
        int counts[26] = {0};
        int left = 0, maxCount = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            maxCount = max(maxCount, ++counts[s[right] - 'A']);
            while ((right - left + 1) - maxCount > k) {  // more letters to change than the budget allows
                counts[s[left] - 'A']--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`
        },
        complexity: 'O(n) time (26 is a constant). O(1) space: a fixed array of 26 counts.',
        say: '“A window can become one letter if everything except its most common letter fits in k changes, so the rule is length minus max count at most k. I’ll grow the window, update the counts and the max count, shrink from the left while the rule is broken, and record the best length. O(n) time, O(26) space.”',
        followups: [
          { q: '`max_count` never goes down when you shrink. Isn’t that a bug?', a: 'No. A stale `max_count` is never smaller than the true one, so the window never shrinks when it shouldn’t. And it can’t overstate the answer: the window never grows past `max_count + k`, and `max_count` was a real count of some letter, so a valid window of that length (or the whole string) exists. If you’d rather not argue this in the room, recompute the max over the 26 counts each step. That’s still O(26·n).' },
          { q: 'What if the string can hold any characters?', a: 'Use a hash map for the counts. Nothing else changes.' },
          { q: 'Could you binary search on the answer instead?', a: 'Yes. For a fixed length L, slide a fixed window and check `L − maxCount ≤ k`; feasibility is monotonic in L, so binary search finds the largest L in O(26·n log n). Mention it, then point out the sliding window is O(n).' }
        ]
      },
      {
        lc: 567,
        restate: 'Given two strings `s1` and `s2` of lowercase letters, return true if some rearrangement of `s1` appears as a contiguous block inside `s2`.',
        examples: '- `s1 = "ab"`, `s2 = "eidbaooo"` → true, from `"ba"`.\n- `s1 = "ab"`, `s2 = "eidboaoo"` → false.\n- Edge cases: `s1` longer than `s2` → false; repeated letters (`"aab"`) need matching **counts**, not just the same set of letters.',
        brute: 'Generating every permutation of `s1` is n! strings, hopeless past about 8 letters. A better brute force sorts every `len(s1)`-long block of `s2` and compares it with sorted `s1`: O(n · m log m).',
        insight: 'A rearrangement of `s1` is any block with the same letter counts, and the block’s length is fixed at `len(s1)`. So slide a fixed window over `s2` and keep its counts in 26 slots: one letter in, one letter out per step. To avoid comparing 26 counts every step, track how many of the 26 slots currently match.',
        code: {
          py: `class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        m = len(s1)
        if m > len(s2):
            return False
        need, have = [0] * 26, [0] * 26
        for i in range(m):
            need[ord(s1[i]) - 97] += 1
            have[ord(s2[i]) - 97] += 1
        matches = sum(need[i] == have[i] for i in range(26))

        def move(i, delta):
            nonlocal matches
            if have[i] == need[i]:
                matches -= 1             # this slot was matching; it's about to change
            have[i] += delta
            if have[i] == need[i]:
                matches += 1

        for right in range(m, len(s2)):
            if matches == 26:
                return True
            move(ord(s2[right]) - 97, 1)
            move(ord(s2[right - m]) - 97, -1)
        return matches == 26`,
          js: `function checkInclusion(s1, s2) {
  const m = s1.length;
  if (m > s2.length) return false;
  const need = new Array(26).fill(0), have = new Array(26).fill(0);
  for (let i = 0; i < m; i++) {
    need[s1.charCodeAt(i) - 97]++;
    have[s2.charCodeAt(i) - 97]++;
  }
  let matches = 0;
  for (let i = 0; i < 26; i++) if (need[i] === have[i]) matches++;
  const move = (i, delta) => {
    if (have[i] === need[i]) matches--;   // this slot was matching; it's about to change
    have[i] += delta;
    if (have[i] === need[i]) matches++;
  };
  for (let right = m; right < s2.length; right++) {
    if (matches === 26) return true;
    move(s2.charCodeAt(right) - 97, 1);
    move(s2.charCodeAt(right - m) - 97, -1);
  }
  return matches === 26;
}`,
          java: `class Solution {
    private int matches;

    private void move(int[] have, int[] need, int i, int delta) {
        if (have[i] == need[i]) matches--;   // this slot was matching; it's about to change
        have[i] += delta;
        if (have[i] == need[i]) matches++;
    }

    public boolean checkInclusion(String s1, String s2) {
        int m = s1.length();
        if (m > s2.length()) return false;
        int[] need = new int[26], have = new int[26];
        for (int i = 0; i < m; i++) {
            need[s1.charAt(i) - 'a']++;
            have[s2.charAt(i) - 'a']++;
        }
        matches = 0;
        for (int i = 0; i < 26; i++) if (need[i] == have[i]) matches++;
        for (int right = m; right < s2.length(); right++) {
            if (matches == 26) return true;
            move(have, need, s2.charAt(right) - 'a', 1);
            move(have, need, s2.charAt(right - m) - 'a', -1);
        }
        return matches == 26;
    }
}`,
          cpp: `class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        int m = s1.size(), n = s2.size();
        if (m > n) return false;
        vector<int> need(26, 0), have(26, 0);
        for (int i = 0; i < m; i++) {
            need[s1[i] - 'a']++;
            have[s2[i] - 'a']++;
        }
        int matches = 0;
        for (int i = 0; i < 26; i++) matches += need[i] == have[i];
        auto move = [&](int i, int delta) {
            if (have[i] == need[i]) matches--;   // this slot was matching; it's about to change
            have[i] += delta;
            if (have[i] == need[i]) matches++;
        };
        for (int right = m; right < n; right++) {
            if (matches == 26) return true;
            move(s2[right] - 'a', 1);
            move(s2[right - m] - 'a', -1);
        }
        return matches == 26;
    }
};`
        },
        complexity: 'O(|s1| + |s2|) time: each step changes two counts and updates `matches` in O(1). O(1) space: two arrays of 26.',
        say: '“A permutation of s1 is just a block of s2 with the same letter counts, and its length is fixed, so I’ll slide a window of size len(s1) and keep 26 counts. Comparing the two count arrays each step is already linear, O(26·n). To make each step O(1), I track how many of the 26 letters currently match.”',
        followups: [
          { q: 'Is comparing the two arrays of 26 counts every step acceptable?', a: 'Yes, it’s O(26·n), which is linear. Say that first, and offer the `matches` counter as the optimization if they push.' },
          { q: 'What if you had to return every start index?', a: 'Same window: record `right - m + 1` each time the counts match after an update. That’s Find All Anagrams in a String (438).' },
          { q: 'What if the strings could hold any Unicode characters?', a: 'Use hash maps for both counts, compare only the characters that appear in `s1`, and treat a missing key as zero.' }
        ]
      },
      {
        lc: 76,
        restate: 'Given strings `s` and `t`, return the shortest substring of `s` that contains every character of `t`, counting repeats. Return an empty string if there isn’t one.',
        examples: '- `s = "ADOBECODEBANC"`, `t = "ABC"` → `"BANC"`.\n- `s = "a"`, `t = "aa"` → `""`: `t` needs two a’s.\n- Edge cases: `t` longer than `s` → `""`; upper and lower case are different characters; extra characters inside the window are fine.',
        brute: 'Check every substring and test whether it covers `t`: O(n²) windows × O(k) per check. Far too slow at n = 10⁵.',
        insight: 'It asks for the **shortest** valid window, so flip the template: grow `right` until the window covers `t`, then shrink `left` while it still does, recording each time. Keep `missing`, the number of characters of `t` the window still lacks (counting repeats), so “is it valid?” is an O(1) check instead of a map comparison.',
        code: {
          py: `class Solution:
    def minWindow(self, s: str, t: str) -> str:
        need = Counter(t)
        missing = len(t)                 # characters of t not yet covered, counting repeats
        left = 0
        best_left, best_len = 0, float('inf')
        for right, ch in enumerate(s):
            if need[ch] > 0:
                missing -= 1             # this character covers something t still needed
            need[ch] -= 1                # extras go negative: the window has spares
            while missing == 0:          # valid: record it, then try a shorter one
                if right - left + 1 < best_len:
                    best_left, best_len = left, right - left + 1
                need[s[left]] += 1
                if need[s[left]] > 0:
                    missing += 1         # we just dropped a character t needs
                left += 1
        return "" if best_len == float('inf') else s[best_left:best_left + best_len]`,
          js: `function minWindow(s, t) {
  const need = new Map();
  for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
  let missing = t.length, left = 0, bestLeft = 0, bestLen = Infinity;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if ((need.get(ch) || 0) > 0) missing--;   // this character covers something t still needed
    need.set(ch, (need.get(ch) || 0) - 1);    // extras go negative: the window has spares
    while (missing === 0) {                   // valid: record it, then try a shorter one
      if (right - left + 1 < bestLen) { bestLeft = left; bestLen = right - left + 1; }
      const out = s[left++];
      need.set(out, need.get(out) + 1);
      if (need.get(out) > 0) missing++;       // we just dropped a character t needs
    }
  }
  return bestLen === Infinity ? '' : s.slice(bestLeft, bestLeft + bestLen);
}`,
          java: `class Solution {
    public String minWindow(String s, String t) {
        int[] need = new int[128];
        for (char ch : t.toCharArray()) need[ch]++;
        int missing = t.length(), left = 0, bestLeft = 0, bestLen = Integer.MAX_VALUE;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            if (need[ch] > 0) missing--;         // this character covers something t still needed
            need[ch]--;                          // extras go negative: the window has spares
            while (missing == 0) {               // valid: record it, then try a shorter one
                if (right - left + 1 < bestLen) { bestLeft = left; bestLen = right - left + 1; }
                char out = s.charAt(left++);
                need[out]++;
                if (need[out] > 0) missing++;    // we just dropped a character t needs
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestLeft, bestLeft + bestLen);
    }
}`,
          cpp: `class Solution {
public:
    string minWindow(string s, string t) {
        vector<int> need(128, 0);
        for (char ch : t) need[ch]++;
        int missing = t.size(), left = 0, bestLeft = 0, bestLen = INT_MAX;
        for (int right = 0; right < (int)s.size(); right++) {
            if (need[s[right]] > 0) missing--;   // this character covers something t still needed
            need[s[right]]--;                    // extras go negative: the window has spares
            while (missing == 0) {               // valid: record it, then try a shorter one
                if (right - left + 1 < bestLen) { bestLeft = left; bestLen = right - left + 1; }
                need[s[left]]++;
                if (need[s[left]] > 0) missing++;  // we just dropped a character t needs
                left++;
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestLeft, bestLen);
    }
};`
        },
        complexity: 'O(|s| + |t|) time: `right` and `left` each move at most |s| times. O(k) space for the counts, a fixed 128 slots for ASCII.',
        say: '“This is a shortest-valid-window problem. I’ll count what t needs, then grow the window until nothing is missing. While it’s valid, I record it and shrink from the left; as soon as a needed character leaves, I go back to growing. A `missing` counter makes the validity check O(1), so the whole thing is O(|s| + |t|).”',
        followups: [
          { q: 'Why does `need` go negative?', a: 'Negative means the window holds more of that character than `t` requires. Those spares can leave without breaking validity, which is exactly what the shrink step relies on.' },
          { q: 'What if `s` is huge and `t` has only a few distinct characters?', a: 'First filter `s` down to (index, character) pairs whose character is in `t`, then slide over that shorter list. The worst case is the same, but it’s much faster when most of `s` is irrelevant.' },
          { q: 'Which window do you return when several have the minimum length?', a: 'The strict `<` keeps the leftmost one. To return all of them, collect every window whose length equals the final minimum.' }
        ]
      }
    ],

    practice: [
      { lc: 643,
        hints: ['The window size is fixed at k, so there’s never a choice about when to shrink.', 'Keep a running sum: add `nums[right]` and subtract `nums[right - k]`.', 'Track the best sum, and divide by k once at the end.'],
        solution: { explain: 'A fixed window with a running sum: one element in, one out, per step. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        window = best = sum(nums[:k])
        for right in range(k, len(nums)):
            window += nums[right] - nums[right - k]
            best = max(best, window)
        return best / k`,
          js: `function findMaxAverage(nums, k) {
  let window = 0;
  for (let i = 0; i < k; i++) window += nums[i];
  let best = window;
  for (let right = k; right < nums.length; right++) {
    window += nums[right] - nums[right - k];
    best = Math.max(best, window);
  }
  return best / k;
}` } },
        starter: { py: 'class Solution:\n    def findMaxAverage(self, nums: List[int], k: int) -> float:\n        ', js: 'function findMaxAverage(nums, k) {\n  \n}' },
        tests: { fn: 'findMaxAverage', compare: 'float', cases: [
          { args: [[1, 12, -5, -6, 50, 3], 4], out: 12.75 }, { args: [[5], 1], out: 5 }, { args: [[0, 4, 0, 3, 2], 1], out: 4 }, { args: [[-1], 1], out: -1 }, { args: [[4, 0, 4, 3, 3], 5], out: 2.8 }] } },

      { lc: 121,
        hints: ['For each day you might sell, which earlier day was the best one to buy?', 'You only need the cheapest price so far, not the whole history.', 'One pass: update the cheapest price, then the best profit `price - cheapest`.'],
        solution: { explain: 'The window runs from the cheapest day so far to today. Its left edge jumps to every new low, so no shrinking loop is needed. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        cheapest = float('inf')
        best = 0
        for price in prices:
            cheapest = min(cheapest, price)
            best = max(best, price - cheapest)
        return best`,
          js: `function maxProfit(prices) {
  let cheapest = Infinity, best = 0;
  for (const price of prices) {
    cheapest = Math.min(cheapest, price);
    best = Math.max(best, price - cheapest);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ', js: 'function maxProfit(prices) {\n  \n}' },
        tests: { fn: 'maxProfit', cases: [
          { args: [[7, 1, 5, 3, 6, 4]], out: 5 }, { args: [[7, 6, 4, 3, 1]], out: 0 }, { args: [[1]], out: 0 }, { args: [[2, 4, 1]], out: 2 }, { args: [[3, 3, 5, 0, 0, 3, 1, 4]], out: 4 }] } },

      { lc: 219,
        hints: ['Two equal values at most k apart both fit inside some window of k + 1 consecutive elements.', 'Keep the previous k values in a set as you walk.', 'Check the set before adding `nums[i]`; once the set holds more than k values, drop `nums[i - k]`.'],
        solution: { explain: 'A fixed window of the last k values, held in a set. O(n) time, O(min(n, k)) space.', code: {
          py: `class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        window = set()
        for i, x in enumerate(nums):
            if x in window:
                return True
            window.add(x)
            if len(window) > k:
                window.remove(nums[i - k])
        return False`,
          js: `function containsNearbyDuplicate(nums, k) {
  const window = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (window.has(nums[i])) return true;
    window.add(nums[i]);
    if (window.size > k) window.delete(nums[i - k]);
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:\n        ', js: 'function containsNearbyDuplicate(nums, k) {\n  \n}' },
        tests: { fn: 'containsNearbyDuplicate', cases: [
          { args: [[1, 2, 3, 1], 3], out: true }, { args: [[1, 0, 1, 1], 1], out: true }, { args: [[1, 2, 3, 1, 2, 3], 2], out: false }, { args: [[1], 0], out: false }, { args: [[99, 99], 2], out: true }] } },

      { lc: 1456,
        hints: ['The window size is fixed at k.', 'Count the vowels in the first k characters.', 'Each step, add 1 if the incoming character is a vowel and subtract 1 if the outgoing one was.'],
        solution: { explain: 'A fixed window with a running vowel count. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def maxVowels(self, s: str, k: int) -> int:
        vowels = set('aeiou')
        count = sum(ch in vowels for ch in s[:k])
        best = count
        for right in range(k, len(s)):
            count += (s[right] in vowels) - (s[right - k] in vowels)
            best = max(best, count)
        return best`,
          js: `function maxVowels(s, k) {
  const isVowel = (ch) => 'aeiou'.includes(ch) ? 1 : 0;
  let count = 0;
  for (let i = 0; i < k; i++) count += isVowel(s[i]);
  let best = count;
  for (let right = k; right < s.length; right++) {
    count += isVowel(s[right]) - isVowel(s[right - k]);
    best = Math.max(best, count);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxVowels(self, s: str, k: int) -> int:\n        ', js: 'function maxVowels(s, k) {\n  \n}' },
        tests: { fn: 'maxVowels', cases: [
          { args: ['abciiidef', 3], out: 3 }, { args: ['aeiou', 2], out: 2 }, { args: ['leetcode', 3], out: 2 }, { args: ['tryhard', 4], out: 1 }, { args: ['b', 1], out: 0 }] } },

      { lc: 209,
        hints: ['Every number is positive, so growing a window can only raise its sum.', 'Grow `right` until the sum reaches the target, then shrink `left` while it still does.', 'Record the length inside the shrinking loop, and return 0 if you never recorded one.'],
        solution: { explain: 'The shortest-valid-window variation: shrink while the window still meets the target, recording each time. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        left = total = 0
        best = float('inf')
        for right, x in enumerate(nums):
            total += x
            while total >= target:
                best = min(best, right - left + 1)
                total -= nums[left]
                left += 1
        return 0 if best == float('inf') else best`,
          js: `function minSubArrayLen(target, nums) {
  let left = 0, total = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (total >= target) {
      best = Math.min(best, right - left + 1);
      total -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}` } },
        starter: { py: 'class Solution:\n    def minSubArrayLen(self, target: int, nums: List[int]) -> int:\n        ', js: 'function minSubArrayLen(target, nums) {\n  \n}' },
        tests: { fn: 'minSubArrayLen', cases: [
          { args: [7, [2, 3, 1, 2, 4, 3]], out: 2 }, { args: [4, [1, 4, 4]], out: 1 }, { args: [11, [1, 1, 1, 1, 1, 1, 1, 1]], out: 0 }, { args: [15, [1, 2, 3, 4, 5]], out: 5 }, { args: [3, [1, 1]], out: 0 }] } },

      { lc: 3,
        hints: ['Keep a window that never holds a repeated character.', 'When the new character is already inside, move `left` forward until it isn’t (or jump just past its last position).', 'The answer is the largest `right - left + 1` you see.'],
        starter: { py: 'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ', js: 'function lengthOfLongestSubstring(s) {\n  \n}' },
        tests: { fn: 'lengthOfLongestSubstring', sig: { args: ['str'] }, cases: [
          { args: ['abcabcbb'], out: 3 }, { args: ['bbbbb'], out: 1 }, { args: ['pwwkew'], out: 3 }, { args: [''], out: 0 }, { args: [' '], out: 1 },
          { args: ['dvdf'], out: 3 }, { args: ['abba'], out: 2 }, { args: ['au'], out: 2 }] } },

      { lc: 1004,
        hints: ['Flipping at most k zeros is the same as finding the longest window with at most k zeros in it.', 'Count the zeros in the window as it grows.', 'While the count is above k, shrink from the left.'],
        solution: { explain: 'The longest-window template, where the rule is “at most k zeros”. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        left = zeros = best = 0
        for right, x in enumerate(nums):
            zeros += x == 0
            while zeros > k:
                zeros -= nums[left] == 0
                left += 1
            best = max(best, right - left + 1)
        return best`,
          js: `function longestOnes(nums, k) {
  let left = 0, zeros = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;
    while (zeros > k) {
      if (nums[left] === 0) zeros--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def longestOnes(self, nums: List[int], k: int) -> int:\n        ', js: 'function longestOnes(nums, k) {\n  \n}' },
        tests: { fn: 'longestOnes', cases: [
          { args: [[1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2], out: 6 }, { args: [[0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3], out: 10 },
          { args: [[0, 0, 0], 0], out: 0 }, { args: [[1, 1], 0], out: 2 }] } },

      { lc: 904,
        hints: ['Two baskets that each hold one kind of fruit: you want the longest window with at most 2 distinct values.', 'Keep a count of each kind in the window.', 'While there are more than 2 kinds, shrink from the left, deleting a kind when its count hits zero.'],
        solution: { explain: 'The longest-window template with the rule “at most 2 distinct values”. Delete zero counts so the map’s size is the number of kinds. O(n) time, O(1) space (at most 3 keys).', code: {
          py: `class Solution:
    def totalFruit(self, fruits: List[int]) -> int:
        counts = {}
        left = best = 0
        for right, f in enumerate(fruits):
            counts[f] = counts.get(f, 0) + 1
            while len(counts) > 2:
                counts[fruits[left]] -= 1
                if counts[fruits[left]] == 0:
                    del counts[fruits[left]]
                left += 1
            best = max(best, right - left + 1)
        return best`,
          js: `function totalFruit(fruits) {
  const counts = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < fruits.length; right++) {
    counts.set(fruits[right], (counts.get(fruits[right]) || 0) + 1);
    while (counts.size > 2) {
      const out = fruits[left++];
      counts.set(out, counts.get(out) - 1);
      if (counts.get(out) === 0) counts.delete(out);
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def totalFruit(self, fruits: List[int]) -> int:\n        ', js: 'function totalFruit(fruits) {\n  \n}' },
        tests: { fn: 'totalFruit', cases: [
          { args: [[1, 2, 1]], out: 3 }, { args: [[0, 1, 2, 2]], out: 3 }, { args: [[1, 2, 3, 2, 2]], out: 4 }, { args: [[3, 3, 3, 1, 2, 1, 1, 2, 3, 3, 4]], out: 5 }, { args: [[1]], out: 1 }] } },

      { lc: 424,
        hints: ['A window can become one letter if everything except its most common letter fits in the budget.', 'So the window is valid while `length - maxCount <= k`. Keep 26 counts.', 'Grow, update the max count, shrink while the rule is broken, record the length.'],
        starter: { py: 'class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        ', js: 'function characterReplacement(s, k) {\n  \n}' },
        tests: { fn: 'characterReplacement', sig: { args: ['str', 'int'] }, cases: [
          { args: ['ABAB', 2], out: 4 }, { args: ['AABABBA', 1], out: 4 }, { args: ['A', 0], out: 1 }, { args: ['ABCDE', 1], out: 2 }, { args: ['AAAA', 0], out: 4 }, { args: ['ABBB', 2], out: 4 }] } },

      { lc: 567,
        hints: ['A permutation of s1 has exactly the same letter counts as s1, and the same length.', 'Slide a window of length `len(s1)` over s2 and keep its 26 counts.', 'Compare the counts each step (26 per step is fine), or track how many of the 26 letters match.'],
        starter: { py: 'class Solution:\n    def checkInclusion(self, s1: str, s2: str) -> bool:\n        ', js: 'function checkInclusion(s1, s2) {\n  \n}' },
        tests: { fn: 'checkInclusion', sig: { args: ['str', 'str'] }, cases: [
          { args: ['ab', 'eidbaooo'], out: true }, { args: ['ab', 'eidboaoo'], out: false }, { args: ['adc', 'dcda'], out: true }, { args: ['abc', 'ab'], out: false },
          { args: ['a', 'a'], out: true }, { args: ['hello', 'ooolleoooleh'], out: false }] } },

      { lc: 438,
        hints: ['It’s the permutation check again, but you collect every place it succeeds.', 'Slide a window of length `len(p)` over s and keep 26 counts.', 'Whenever the window’s counts equal p’s counts, record `right - len(p) + 1`.'],
        solution: { explain: 'A fixed window of length `len(p)` with 26 counts, compared each step. O(26·n) time, O(1) space.', code: {
          py: `class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        m = len(p)
        if m > len(s):
            return []
        need, have = [0] * 26, [0] * 26
        for ch in p:
            need[ord(ch) - 97] += 1
        out = []
        for right, ch in enumerate(s):
            have[ord(ch) - 97] += 1
            if right >= m:
                have[ord(s[right - m]) - 97] -= 1
            if have == need:
                out.append(right - m + 1)
        return out`,
          js: `function findAnagrams(s, p) {
  const m = p.length, out = [];
  if (m > s.length) return out;
  const need = new Array(26).fill(0), have = new Array(26).fill(0);
  for (const ch of p) need[ch.charCodeAt(0) - 97]++;
  for (let right = 0; right < s.length; right++) {
    have[s.charCodeAt(right) - 97]++;
    if (right >= m) have[s.charCodeAt(right - m) - 97]--;
    if (have.every((c, i) => c === need[i])) out.push(right - m + 1);
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def findAnagrams(self, s: str, p: str) -> List[int]:\n        ', js: 'function findAnagrams(s, p) {\n  \n}' },
        tests: { fn: 'findAnagrams', cases: [
          { args: ['cbaebabacd', 'abc'], out: [0, 6] }, { args: ['abab', 'ab'], out: [0, 1, 2] }, { args: ['a', 'ab'], out: [] }, { args: ['aaaa', 'aa'], out: [0, 1, 2] }] } },

      { lc: 713,
        hints: ['Every number is positive, so a longer window never has a smaller product.', 'Keep the window’s product, and shrink from the left while it’s at least k.', 'Every window that ends at `right` and starts anywhere in `[left, right]` qualifies, so add `right - left + 1`.'],
        solution: { explain: 'Counting windows: after shrinking, all `right - left + 1` windows ending at `right` are valid. If k ≤ 1, no product of positive integers is below it. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def numSubarrayProductLessThanK(self, nums: List[int], k: int) -> int:
        if k <= 1:
            return 0
        product, left, count = 1, 0, 0
        for right, x in enumerate(nums):
            product *= x
            while product >= k:
                product //= nums[left]
                left += 1
            count += right - left + 1
        return count`,
          js: `function numSubarrayProductLessThanK(nums, k) {
  if (k <= 1) return 0;
  let product = 1, left = 0, count = 0;
  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];
    while (product >= k) product /= nums[left++];
    count += right - left + 1;
  }
  return count;
}` } },
        starter: { py: 'class Solution:\n    def numSubarrayProductLessThanK(self, nums: List[int], k: int) -> int:\n        ', js: 'function numSubarrayProductLessThanK(nums, k) {\n  \n}' },
        tests: { fn: 'numSubarrayProductLessThanK', cases: [
          { args: [[10, 5, 2, 6], 100], out: 8 }, { args: [[1, 2, 3], 0], out: 0 }, { args: [[1, 1, 1], 2], out: 6 }, { args: [[1, 2, 3], 1], out: 0 }] } },

      { lc: 1838,
        hints: ['You can only increase numbers, so the best target is a value already in the array: raise the smaller ones in a window up to the window’s largest.', 'Sort first. For a window ending at `right`, raising everything to `nums[right]` costs `nums[right] * length - windowSum`.', 'Shrink from the left while that cost is above k, and record the window length.'],
        solution: { explain: 'Sort, then run the longest-window template where the rule is “the cost to raise everything to the window’s maximum fits in k”. O(n log n) for the sort, O(n) for the window.', code: {
          py: `class Solution:
    def maxFrequency(self, nums: List[int], k: int) -> int:
        nums.sort()
        left = total = best = 0
        for right, x in enumerate(nums):
            total += x
            while x * (right - left + 1) - total > k:
                total -= nums[left]
                left += 1
            best = max(best, right - left + 1)
        return best`,
          js: `function maxFrequency(nums, k) {
  nums.sort((a, b) => a - b);   // without the comparator, JS sorts numbers as strings
  let left = 0, total = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    total += nums[right];
    while (nums[right] * (right - left + 1) - total > k) total -= nums[left++];
    best = Math.max(best, right - left + 1);
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def maxFrequency(self, nums: List[int], k: int) -> int:\n        ', js: 'function maxFrequency(nums, k) {\n  \n}' },
        tests: { fn: 'maxFrequency', cases: [
          { args: [[1, 2, 4], 5], out: 3 }, { args: [[1, 4, 8, 13], 5], out: 2 }, { args: [[3, 9, 6], 2], out: 1 }, { args: [[1], 1], out: 1 }, { args: [[1, 1, 1, 2], 1], out: 3 }, { args: [[10, 9, 1], 1], out: 2 }] } },

      { lc: 76,
        hints: ['It asks for the **shortest** window that covers t, so grow until valid, then shrink while still valid.', 'Count what t needs, and keep `missing`: how many of t’s characters the window still lacks, counting repeats.', 'Record inside the shrinking loop; the moment a needed character leaves, go back to growing.'],
        starter: { py: 'class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ', js: 'function minWindow(s, t) {\n  \n}' },
        tests: { fn: 'minWindow', sig: { args: ['str', 'str'] }, cases: [
          { args: ['ADOBECODEBANC', 'ABC'], out: 'BANC' }, { args: ['a', 'a'], out: 'a' }, { args: ['a', 'aa'], out: '' }, { args: ['ab', 'b'], out: 'b' },
          { args: ['bba', 'ab'], out: 'ba' }, { args: ['aa', 'aa'], out: 'aa' }] } },

      { lc: 239,
        hints: ['A count map can’t tell you the next-largest value after the maximum leaves. You need order.', 'Keep a deque of indices whose values decrease from front to back; the front is the current maximum.', 'Before pushing `i`, pop smaller-or-equal values off the back. Pop the front once it falls out (`front <= i - k`). Record the front once `i >= k - 1`.'],
        solution: { explain: 'A monotonic deque: each index is pushed once and popped at most once, so the whole pass is O(n). Space is O(k).', code: {
          py: `class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq = deque()     # indices; their values decrease from front to back
        out = []
        for i, x in enumerate(nums):
            while dq and nums[dq[-1]] <= x:
                dq.pop()
            dq.append(i)
            if dq[0] <= i - k:
                dq.popleft()
            if i >= k - 1:
                out.append(nums[dq[0]])
        return out`,
          js: `function maxSlidingWindow(nums, k) {
  const dq = [];   // indices; values decrease from front to back. dq[head] is the front.
  let head = 0;
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[head] <= i - k) head++;
    if (i >= k - 1) out.push(nums[dq[head]]);
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ', js: 'function maxSlidingWindow(nums, k) {\n  \n}' },
        tests: { fn: 'maxSlidingWindow', cases: [
          { args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], out: [3, 3, 5, 5, 6, 7] }, { args: [[1], 1], out: [1] }, { args: [[9, 8, 7, 6], 2], out: [9, 8, 7] },
          { args: [[1, -1], 1], out: [1, -1] }, { args: [[4, 2, 12, 3], 4], out: [12] }] } },

      { lc: 992,
        hints: ['Windows with **exactly** k distinct values don’t shrink cleanly, but windows with **at most** k do.', 'Count subarrays with at most k distinct values: for each `right`, add `right - left + 1`.', 'The answer is atMost(k) − atMost(k − 1).'],
        solution: { explain: 'Two counting windows. Every subarray with exactly k distinct values is counted by atMost(k) and not by atMost(k − 1). O(n) time, O(k) space.', code: {
          py: `class Solution:
    def subarraysWithKDistinct(self, nums: List[int], k: int) -> int:
        def at_most(k):
            counts, left, total = {}, 0, 0
            for right, x in enumerate(nums):
                counts[x] = counts.get(x, 0) + 1
                while len(counts) > k:
                    counts[nums[left]] -= 1
                    if counts[nums[left]] == 0:
                        del counts[nums[left]]
                    left += 1
                total += right - left + 1
            return total
        return at_most(k) - at_most(k - 1)`,
          js: `function subarraysWithKDistinct(nums, k) {
  const atMost = (k) => {
    const counts = new Map();
    let left = 0, total = 0;
    for (let right = 0; right < nums.length; right++) {
      counts.set(nums[right], (counts.get(nums[right]) || 0) + 1);
      while (counts.size > k) {
        const out = nums[left++];
        counts.set(out, counts.get(out) - 1);
        if (counts.get(out) === 0) counts.delete(out);
      }
      total += right - left + 1;
    }
    return total;
  };
  return atMost(k) - atMost(k - 1);
}` } },
        starter: { py: 'class Solution:\n    def subarraysWithKDistinct(self, nums: List[int], k: int) -> int:\n        ', js: 'function subarraysWithKDistinct(nums, k) {\n  \n}' },
        tests: { fn: 'subarraysWithKDistinct', cases: [
          { args: [[1, 2, 1, 2, 3], 2], out: 7 }, { args: [[1, 2, 1, 3, 4], 3], out: 3 }, { args: [[1, 1, 1], 1], out: 6 }, { args: [[1, 2], 1], out: 2 }] } }
    ],

    mistakes: [
      '**Recording before the window is valid again.** In the longest-window template, update `best` *after* the `while` loop; in the shortest-window version, *inside* it. Mixing them up reports the length of an invalid window.',
      '**`if` instead of `while` when shrinking.** One step isn’t always enough. In `"abcb"`, the second `b` needs `left` to move two places, past `a` and the first `b`.',
      '**Off-by-one errors.** The window `[left, right]` holds `right - left + 1` elements. In a fixed window of size k, the element leaving is `nums[right - k]`, and the first full window ends at `right = k - 1`.',
      '**Zero counts left in the map.** If the rule depends on how many distinct keys the window has (`len(counts) > k`), delete a key when its count drops to zero. A key sitting at 0 still counts.',
      '**Moving `left` backwards.** With the last-seen-index trick, `left = last[ch] + 1` can jump *back* when that copy is already outside the window (`"abba"`). Use `left = max(left, last[ch] + 1)`.',
      '**A window on sums with negative numbers.** Shrinking assumes that removing elements is the only way to fix the window. With negatives that’s false; use prefix sums with a hash map.',
      '**Language gotchas.** *Python:* slicing inside the loop (`sum(nums[left:right + 1])`) copies the window every step and quietly makes the solution O(n·k); keep a running total. *JavaScript:* `map.get(x) + 1` is `NaN` for a new key, so write `(map.get(x) || 0) + 1`; and `nums.sort()` sorts numbers as strings, so pass `(a, b) => a - b`. *Java:* `map.get(a) == map.get(b)` compares `Integer` objects by reference and fails once counts pass 127; use `.equals()` or unbox first. *C++:* `counts[x]` **inserts** `x` with count 0 when you only meant to read it, so `counts.size()` grows; check with `count()` or `find()`.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of the variable-window template on a string of length n, given the `while` loop inside the `for` loop?',
        choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n · k), where k is the alphabet size'], answer: 0,
        explain: '`left` only moves forward, so across the whole run the `while` loop moves it at most n times in total. Each index enters once and leaves at most once: amortized O(n).' },
      { kind: 'pattern', q: 'Which of these is a sliding-window problem as stated?',
        choices: ['The longest subarray with at most two distinct values', 'The number of subarrays whose sum is exactly k, in an array with negative numbers', 'The longest increasing subsequence', 'Two numbers in a sorted array that add up to a target'], answer: 0,
        explain: '“At most two distinct values” is a monotonic rule over contiguous windows. Sums with negatives break monotonicity (use prefix sums and a hash map), a subsequence isn’t contiguous, and the sorted pair is two pointers moving in from both ends.' },
      { kind: 'pattern', q: 'Which signals point to a sliding window? Pick every one that applies.',
        choices: ['The answer is a contiguous subarray or substring', 'You may pick elements in any order', 'Shrinking a valid window keeps it valid', 'The question gives a fixed window size k'], answer: [0, 2, 3],
        explain: 'Contiguity, a monotonic rule and a fixed size are the three classic signals. “Any order” means subsets or sorting, not a window.' },
      { kind: 'bug', q: 'This returns 4 for `"abcbd"`, but the answer is 3. What’s the bug?',
        code: `def longest(s):
    seen, left, best = set(), 0, 0
    for right, ch in enumerate(s):
        if ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best`,
        choices: ['`if` should be `while`: one step left isn’t always enough to remove the earlier copy', '`best` should be updated before `seen.add(ch)`', 'The length should be `right - left`', 'The set should be a list'], answer: 0,
        explain: 'When the second `b` arrives, `left` moves past `a` only, so the first `b` is still inside and `"bcb"` is treated as valid. Shrinking has to repeat until `ch` is gone: `while ch in seen`.' },
      { kind: 'concept', q: 'In the shortest-window version (like Minimum Window Substring), where do you record the answer?',
        choices: ['Inside the shrinking loop, while the window is still valid', 'After the shrinking loop, like the longest-window template', 'Only when `right` reaches the end', 'Before adding `s[right]` to the window'], answer: 0,
        explain: 'For the shortest window, the window is valid exactly while you shrink it, so every step inside the loop is a candidate. After the loop, the window has just become invalid.' },
      { kind: 'complexity', q: 'Minimum Window Substring keeps a `missing` counter. What does it buy you?',
        choices: ['An O(1) validity check, instead of comparing every count each step', 'Less memory: no count map is needed', 'It removes the need to count `t`', 'It lets you skip the shrinking loop'], answer: 0,
        explain: '`missing` says how many required characters the window still lacks. Valid means `missing == 0`, an O(1) check. You still need the count map to know when a character is required.' },
      { kind: 'concept', q: 'For “the number of subarrays with **exactly** k distinct values”, why compute atMost(k) − atMost(k − 1)?',
        choices: ['Exactly-k windows don’t shrink cleanly, but at-most-k windows do, and the difference counts exactly k', 'It’s faster than one pass', 'atMost uses less memory', 'It handles negative numbers'], answer: 0,
        explain: 'Dropping one element from an exactly-k window can leave k − 1 distinct values, so “shrink while invalid” has no single direction. At-most-k is monotonic. Every exactly-k subarray is counted by atMost(k) and not by atMost(k − 1).' },
      { kind: 'concept', q: 'In a fixed window of size k, which index leaves when `right` arrives?',
        choices: ['`right - k`', '`right - k + 1`', '`right - 1`', '`k - 1`'], answer: 0,
        explain: 'The new window `[right - k + 1, right]` holds k elements, so the element just before it, at `right - k`, is the one that left.' }
    ],

    flashcards: [
      { id: 'three-parts', front: 'Sliding window: which three things change when you reuse the template?', back: 'What the window remembers (a set, counts, a sum), the rule in the `while` (when the window is invalid), and what you record (a length, a count, the window itself).' },
      { id: 'why-linear', front: 'Why is the variable-window template O(n) despite the loop inside a loop?', back: '`left` only moves forward. Each index enters the window once and leaves at most once, so the pointers move at most 2n times in total.' },
      { id: 'record-where', front: 'Longest valid window vs shortest valid window: where do you record the answer?', back: 'Longest: after the shrinking loop, once the window is valid again. Shortest: inside it, while the window is still valid.' },
      { id: 'fixed-leaves', front: 'Fixed window of size k: which element leaves when `right` arrives?', back: '`nums[right - k]`. The first full window ends at `right = k - 1`.' },
      { id: 'negatives', front: 'When does a sliding window fail on a sum rule?', back: 'When the numbers can be negative: adding an element can lower the sum, so shrinking isn’t the only way to fix a window. Use prefix sums with a hash map.' },
      { id: 'count-windows', front: 'Counting subarrays that satisfy a monotonic rule: what do you add for each `right`?', back: '`right - left + 1`: every window that ends at `right` and starts anywhere in `[left, right]` is valid.' },
      { id: 'exactly-k', front: 'Subarrays with exactly k distinct values: what’s the trick?', back: 'atMost(k) − atMost(k − 1). At-most windows shrink cleanly; exactly-k windows don’t.' },
      { id: 'replacement-rule', front: 'Longest Repeating Character Replacement: when is a window valid?', back: 'When `windowLength - maxCount <= k`: everything except the most common letter fits in the budget.' },
      { id: 'missing', front: 'Minimum Window Substring: what does `missing` track?', back: 'How many characters of `t`, counting repeats, the window still lacks. The window is valid when it reaches 0.' },
      { id: 'window-max', front: 'The maximum of every window of size k: which structure?', back: 'A deque of indices with decreasing values; the front is the max. Pop smaller values from the back before pushing, and pop the front when it leaves the window.' },
      { id: 'abba', front: 'Longest substring without repeats, using last-seen indices: what’s the trap?', back: 'Write `left = max(left, last[ch] + 1)`. Without the `max`, `left` can jump backwards, as in `"abba"`.' }
    ],

    deeper: [
      { title: 'Sliding Window Pattern (NeetCode)', url: 'https://neetcode.io/courses/advanced-algorithms/1', time: 'about 30 min', note: 'NeetCode’s lesson on the pattern, with video and code, as linked from DSA-Kit. Some NeetCode course pages may ask you to sign in or need NeetCode Pro.' },
      { title: 'Sliding Window for Beginners (LeetCode Discuss)', url: 'https://leetcode.com/discuss/general-discussion/657507/Sliding-Window-for-Beginners', time: 'about 15 min', note: 'A community post that groups sliding-window problems by type with a shared template. Good for extra reps once this page feels easy.' },
      { title: '14 Patterns to Ace Any Coding Interview (Hackernoon)', url: 'https://hackernoon.com/14-patterns-to-ace-any-coding-interview-question-c5bb3357f6ed', time: 'about 15 min', note: 'The classic pattern map; sliding window is its first pattern. Read it to see where this pattern sits next to two pointers and fast & slow pointers.' },
      { title: 'LeetCode Patterns (Sean Prashad)', url: 'https://seanprashad.com/leetcode-patterns/', time: 'reference', note: 'A filterable problem list. Filter by the Sliding Window pattern for practice beyond this page.' }
    ],

    detective: [
      { id: 'focus-mode', decoys: ['arrays-hashing', 'two-pointers', 'kadane'],
        statement: 'A music app records the genre of every song a listener plays, in order. The product team wants a “focus mode” tuned to each listener’s habits, so it needs the longest run of back-to-back plays that uses **at most two genres**. Given the list of genres, return the length of that run.',
        why: '“Back-to-back plays” means a contiguous run, and “at most two genres” is a rule that stays true when the run gets shorter. That’s a variable window: grow on the right, keep genre counts, and shrink from the left while there are three genres.' },
      { id: 'sensor-blocks', decoys: ['prefix-sums', 'kadane', 'queues'],
        statement: 'A greenhouse sensor writes one temperature reading a minute. An alert should fire for every **30-minute stretch** whose average is above a threshold. Given a day of readings, count how many stretches would fire.',
        why: 'Every stretch has the same length, so this is a fixed window: add the reading coming in, subtract the one leaving, and compare the running sum with 30 × threshold. Prefix sums work too, but they spend O(n) memory on what a single running sum can do.' },
      { id: 'stamp', decoys: ['arrays-hashing', 'two-pointers', 'binary-search'],
        statement: 'A typesetter has one long line of letters and a short stamp of letters, which may repeat. They want the **shortest stretch** of the line that contains every letter of the stamp, as many times as the stamp has it. Return that stretch, or an empty string if there isn’t one.',
        why: 'A stretch of the line is contiguous, and “contains every letter” stays true when the stretch grows. So it’s the shortest-window shape: grow until the window covers the stamp, then shrink from the left while it still does, recording the length each time.' },
      { id: 'tolls', decoys: ['prefix-sums', 'binary-search', 'kadane'],
        statement: 'A courier’s route crosses a row of toll booths, each with a positive fee. The courier has to hand in a receipt for **consecutive** booths adding up to at least B. What’s the fewest booths that can do it?',
        why: 'Consecutive booths make a window, and because every fee is positive, growing a window only raises its total. That monotonic rule is what makes a shrinking window correct. If fees could be negative, you’d need prefix sums with a monotonic deque instead.' },
      { id: 'scrambled', decoys: ['arrays-hashing', 'sorting', 'two-pointers'],
        statement: 'A spam filter has a list of banned words. A message is flagged if any run of its characters is a **rearrangement** of a banned word, for example “lpa” for “alp”. For one banned word, return every position in the message where such a run starts.',
        why: 'A rearrangement has the same length as the word, so every candidate is a fixed-size window. Slide it one character at a time and compare letter counts. Sorting each window instead would cost O(k log k) per position.' }
    ]
  });
})();
