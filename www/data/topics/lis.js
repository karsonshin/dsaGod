/* Offer Ready: Longest increasing subsequence lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'lis',

    hook: 'Longest increasing subsequence (LIS) is the textbook problem that has two good answers: a plain O(n²) DP everyone should be able to write cold, and an O(n log n) trick that uses a binary search in a place you wouldn’t expect. Interviewers like it because you can stop at the first answer and then be pushed to the second. It also hides inside other questions (nesting boxes, chaining pairs, counting the best paths), so it’s worth knowing as a *tool*, not just as one problem.',

    cues: [
      'You’re asked for the longest (or the number of) **subsequence** that keeps some order: you may skip elements but not rearrange them.',
      'The condition is between **pairs that are not neighbours**: “each pick must be bigger than the one before it”, “each box must fit inside the previous one”, “each task must start after the previous one ends”.',
      'Brute force would try every subset (2ⁿ), and the best answer that ends at position i depends only on best answers that end earlier.',
      'A two-dimensional version (width and height, start and end) where sorting by one coordinate leaves a one-dimensional LIS on the other.',
      'n is up to about 10⁵, so O(n²) is too slow, yet the problem still looks like DP. That’s the signal for the tails array and a binary search.',
      'The trap: the pieces must be **contiguous** (a subarray or substring). That’s a sliding window or Kadane, not LIS. “Subsequence” means gaps are allowed.'
    ],

    intuition: [
      'Picture a card game of patience. Cards come one at a time, and you deal them into piles with one rule: a card may only go on top of a pile whose top card is **at least as big** (so each pile’s top is its smallest card so far). You always put a card on the **leftmost** pile it fits on, or start a new pile at the right end if it fits nowhere. The number of piles at the end is the length of the longest increasing subsequence. Why? A card that starts pile k+1 had a smaller card sitting on top of pile k when it arrived, and that smaller card came earlier. Follow that chain back and you get an increasing run of length equal to the pile count.',
      'The piles’ top cards are the useful part. Keep them in an array called `tails`: `tails[k]` is the **smallest possible last value of an increasing subsequence of length k + 1** among everything seen so far. Smaller is better, because a smaller ending leaves more room to extend. The array is always sorted, which is exactly why a binary search can find where a new value belongs.',
      '1. Start with `tails = []`.\n2. For each value `x`, find the **first position whose tail is `>= x`** (a lower bound, as in [binary search](#/topic/binary-search)).\n3. If there is no such position, `x` extends the longest subsequence so far: **append** it.\n4. Otherwise `x` is a smaller (better) ending for a subsequence of that length: **replace** that tail with `x`.\n5. The answer is `len(tails)`.',
      'The slower way to say the same thing is a table: `dp[i]` is the length of the longest increasing subsequence **ending exactly at index i**. It is 1 plus the best `dp[j]` over all earlier `j` with `nums[j] < nums[i]`. That’s two nested loops, O(n²), and it is the version you can adapt to almost any twist. The tails trick is a faster way to get just the *length*.',
      'Do not mistake `tails` for the subsequence. After `[3, 8, 1]` the array is `[1, 8]`, but `1` came after `8`, so `[1, 8]` is not a subsequence of the input at all. Only its **length** is guaranteed to be right. To get a real subsequence you need parent pointers (see the variations).'
    ].join('\n\n'),

    viz: 'lis',

    template: {
      title: 'Tails array with a binary search (strictly increasing)',
      note: 'This is the one to memorize. `tails[k]` is the smallest tail of any increasing subsequence of length `k + 1`, and the array stays sorted, so each value costs one lower-bound search. To reuse it: for **non-decreasing** subsequences change `<` to `<=` in the test (an upper bound); to answer other questions, change what you store beside each tail (an index for reconstruction, a count for counting). Keep the skeleton: search for the first tail that is `>= x`, then append or replace.',
      code: {
        py: `def length_of_lis(nums):
    tails = []                                  #> tails[k] = smallest last value of an increasing subsequence of length k+1
    for x in nums:                              #@next > 1. Take the next value
        lo, hi = 0, len(tails)                  #@range > 2. Search the whole tails array for where x belongs
        while lo < hi:
            mid = lo + (hi - lo) // 2           #@probe > 3. Probe the middle tail
            if tails[mid] < x:
                lo = mid + 1                    #@right > 4. That tail is smaller than x, so x can extend it: look further right
            else:
                hi = mid                        #@left > 5. That tail is at least x: it might be the spot, keep it
        if lo == len(tails):
            tails.append(x)                     #@append > 6. x is bigger than every tail: the longest subsequence grew by one
        else:
            tails[lo] = x                       #@replace > 7. x is a smaller, better ending for length lo+1: replace the tail
    return len(tails)                           #@done > 8. The number of tails is the length of the LIS`,
        js: `function lengthOfLIS(nums) {
  const tails = [];                             //> tails[k] = smallest last value of an increasing subsequence of length k+1
  for (const x of nums) {                       //@next > 1. Take the next value
    let lo = 0, hi = tails.length;              //@range > 2. Search the whole tails array for where x belongs
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2); //@probe > 3. Probe the middle tail
      if (tails[mid] < x) {
        lo = mid + 1;                           //@right > 4. That tail is smaller than x, so x can extend it: look further right
      } else {
        hi = mid;                               //@left > 5. That tail is at least x: it might be the spot, keep it
      }
    }
    if (lo === tails.length) {
      tails.push(x);                            //@append > 6. x is bigger than every tail: the longest subsequence grew by one
    } else {
      tails[lo] = x;                            //@replace > 7. x is a smaller, better ending for length lo+1: replace the tail
    }
  }
  return tails.length;                          //@done > 8. The number of tails is the length of the LIS
}`,
        java: `class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];     //> tails[k] = smallest last value of an increasing subsequence of length k+1
        int size = 0;
        for (int x : nums) {                    //@next > 1. Take the next value
            int lo = 0, hi = size;              //@range > 2. Search the whole tails array for where x belongs
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;   //@probe > 3. Probe the middle tail
                if (tails[mid] < x) {
                    lo = mid + 1;               //@right > 4. That tail is smaller than x, so x can extend it: look further right
                } else {
                    hi = mid;                   //@left > 5. That tail is at least x: it might be the spot, keep it
                }
            }
            if (lo == size) {
                tails[size++] = x;              //@append > 6. x is bigger than every tail: the longest subsequence grew by one
            } else {
                tails[lo] = x;                  //@replace > 7. x is a smaller, better ending for length lo+1: replace the tail
            }
        }
        return size;                            //@done > 8. The number of tails is the length of the LIS
    }
}`,
        cpp: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails;                      //> tails[k] = smallest last value of an increasing subsequence of length k+1
        for (int x : nums) {                    //@next > 1. Take the next value
            int lo = 0, hi = tails.size();      //@range > 2. Search the whole tails array for where x belongs
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;   //@probe > 3. Probe the middle tail
                if (tails[mid] < x) {
                    lo = mid + 1;               //@right > 4. That tail is smaller than x, so x can extend it: look further right
                } else {
                    hi = mid;                   //@left > 5. That tail is at least x: it might be the spot, keep it
                }
            }
            if (lo == (int)tails.size()) {
                tails.push_back(x);             //@append > 6. x is bigger than every tail: the longest subsequence grew by one
            } else {
                tails[lo] = x;                  //@replace > 7. x is a smaller, better ending for length lo+1: replace the tail
            }
        }
        return tails.size();                    //@done > 8. The number of tails is the length of the LIS
    }
};`
      },
      tests: { fn: { py: 'length_of_lis', default: 'lengthOfLIS' }, sig: { args: ['int[]'] }, cases: [
        { args: [[10, 9, 2, 5, 3, 7, 101, 18]], out: 4 }, { args: [[0, 1, 0, 3, 2, 3]], out: 4 }, { args: [[7, 7, 7, 7, 7, 7, 7]], out: 1 }, { args: [[1]], out: 1 },
        { args: [[3, 2, 1]], out: 1 }, { args: [[1, 2, 3, 4, 5]], out: 5 }, { args: [[4, 10, 4, 3, 8, 9]], out: 3 }, { args: [[2, 2, 3, 3, 4, 4]], out: 3 }, { args: [[]], out: 0 }] }
    },

    complexity: {
      time: 'O(n log n)',
      space: 'O(n)',
      why: 'There are n values, and each does one binary search over `tails`, which never holds more than n entries: O(log n) each, so O(n log n) overall. `tails` itself takes O(n) space in the worst case (a fully increasing input). The simple DP version is **O(n²) time and O(n) space**: for each i it scans every earlier j. For n = 2,500 that’s fine; for n = 10⁵ it is about 5 × 10⁹ steps, too slow.',
      trap: 'The binary search is over `tails`, **not over the input**, and `tails` is sorted only because of how the replace rule works. Also, `len(tails)` is the answer, but `tails` is **not** the subsequence. Printing it as the answer to “return the sequence itself” is wrong (it can even list values out of their original order).'
    },

    variations: [
      {
        name: 'The O(n²) DP: length ending at each index',
        body: 'Define `dp[i]` as the length of the longest increasing subsequence that **ends at index i**. Every such subsequence is either just `nums[i]` (length 1) or some subsequence ending at an earlier `j` with `nums[j] < nums[i]`, extended by `nums[i]`. So `dp[i] = 1 + max(dp[j])` over those `j`, and the answer is the **maximum of the whole row**, not the last entry (the best subsequence may end anywhere). This is the version to write first in an interview: it’s short, hard to get wrong, and every twist in this lesson (counting, parent pointers) is a small edit of it.',
        code: {
          py: `def lis_dp(nums):
    n = len(nums)
    dp = [1] * n                           #> dp[i] = longest increasing subsequence ending exactly at i
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i]:          #> nums[i] can extend a subsequence that ends at j
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp) if dp else 0            #> the best can end anywhere, so take the max of the row`,
          js: `function lisDp(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(1);              //> dp[i] = longest increasing subsequence ending exactly at i
  let best = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);   //> nums[i] can extend a subsequence that ends at j
    }
    best = Math.max(best, dp[i]);               //> the best can end anywhere, so take the max of the row
  }
  return best;
}`,
          java: `class Solution {
    public int lisDp(int[] nums) {
        int n = nums.length, best = 0;
        int[] dp = new int[n];                  //> dp[i] = longest increasing subsequence ending exactly at i
        for (int i = 0; i < n; i++) {
            dp[i] = 1;
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);   //> nums[i] can extend a subsequence that ends at j
            }
            best = Math.max(best, dp[i]);       //> the best can end anywhere, so take the max of the row
        }
        return best;
    }
}`,
          cpp: `class Solution {
public:
    int lisDp(vector<int>& nums) {
        int n = nums.size(), best = 0;
        vector<int> dp(n, 1);                   //> dp[i] = longest increasing subsequence ending exactly at i
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) dp[i] = max(dp[i], dp[j] + 1);   //> nums[i] can extend a subsequence that ends at j
            }
            best = max(best, dp[i]);            //> the best can end anywhere, so take the max of the row
        }
        return best;
    }
};`
        },
        tests: { fn: { py: 'lis_dp', default: 'lisDp' }, sig: { args: ['int[]'] }, cases: [
          { args: [[10, 9, 2, 5, 3, 7, 101, 18]], out: 4 }, { args: [[0, 1, 0, 3, 2, 3]], out: 4 }, { args: [[7, 7, 7]], out: 1 }, { args: [[]], out: 0 }, { args: [[1, 2, 3, 4, 5]], out: 5 }, { args: [[3, 2, 1]], out: 1 }] }
      },
      {
        name: 'Why tails is not the subsequence',
        body: 'Run `[3, 8, 1]`. After 3: `[3]`. After 8: `[3, 8]`. After 1: it replaces 3, so `tails = [1, 8]`. The answer 2 is right (`[3, 8]`), but `[1, 8]` can’t be read off the input, because the 1 comes *after* the 8. What `tails` really stores is a set of **possible endings**: “a length-1 subsequence can end at 1; a length-2 one can end at 8”. Each entry is correct on its own, but they were collected at different times, so they don’t chain together. The *count* of entries is what the invariant guarantees. Two facts hold at every step: `tails` is **strictly increasing** (a smaller value never sits to the right of a bigger one), and `len(tails)` is the length of the longest increasing subsequence seen so far. If you need the sequence, store *indices* in `tails` and add a `parent` array, as in the next variation.'
      },
      {
        name: 'Reconstruction with parent pointers',
        body: 'To return an actual longest subsequence, keep three things: `tails` holds **indices** (compare through `nums[tails[mid]]`), and `parent[i]` records which index came right before `i` in the best subsequence that ends at `i`. When `nums[i]` lands at position `lo`, its predecessor is whatever index currently sits at `lo - 1` in `tails`: the end of the best length-`lo` subsequence, which was built from values that appeared earlier. At the end, start from the last entry of `tails` and follow `parent` backwards, then reverse. With ties between equally long answers, you get one of them, not all.',
        code: {
          py: `def lis_sequence(nums):
    tails, parent = [], [-1] * len(nums)   #> tails holds INDICES; parent[i] = the index before i in its subsequence
    for i, x in enumerate(nums):
        lo, hi = 0, len(tails)
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[tails[mid]] < x:       #> compare through the index
                lo = mid + 1
            else:
                hi = mid
        if lo > 0:
            parent[i] = tails[lo - 1]      #> the best length-lo subsequence ends here, and x extends it
        if lo == len(tails):
            tails.append(i)
        else:
            tails[lo] = i
    out, k = [], tails[-1] if tails else -1
    while k != -1:                         #> walk the parent chain from the end of the longest one
        out.append(nums[k])
        k = parent[k]
    return out[::-1]`,
          js: `function lisSequence(nums) {
  const tails = [], parent = new Array(nums.length).fill(-1);   //> tails holds INDICES; parent[i] = the index before i
  for (let i = 0; i < nums.length; i++) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[tails[mid]] < nums[i]) lo = mid + 1;             //> compare through the index
      else hi = mid;
    }
    if (lo > 0) parent[i] = tails[lo - 1];                      //> the best length-lo subsequence ends here, and nums[i] extends it
    if (lo === tails.length) tails.push(i);
    else tails[lo] = i;
  }
  const out = [];
  for (let k = tails.length ? tails[tails.length - 1] : -1; k !== -1; k = parent[k]) out.push(nums[k]);   //> walk the parent chain
  return out.reverse();
}`,
          java: `class Solution {
    public int[] lisSequence(int[] nums) {
        int n = nums.length, size = 0;
        int[] tails = new int[n], parent = new int[n];    //> tails holds INDICES; parent[i] = the index before i
        for (int i = 0; i < n; i++) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (nums[tails[mid]] < nums[i]) lo = mid + 1;   //> compare through the index
                else hi = mid;
            }
            parent[i] = lo > 0 ? tails[lo - 1] : -1;          //> the best length-lo subsequence ends here, and nums[i] extends it
            tails[lo] = i;
            if (lo == size) size++;
        }
        int[] out = new int[size];
        int k = size > 0 ? tails[size - 1] : -1;
        for (int p = size - 1; p >= 0; p--, k = parent[k]) out[p] = nums[k];   //> walk the parent chain from the end
        return out;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> lisSequence(vector<int>& nums) {
        int n = nums.size();
        vector<int> tails, parent(n, -1);                 //> tails holds INDICES; parent[i] = the index before i
        for (int i = 0; i < n; i++) {
            int lo = 0, hi = tails.size();
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (nums[tails[mid]] < nums[i]) lo = mid + 1;   //> compare through the index
                else hi = mid;
            }
            if (lo > 0) parent[i] = tails[lo - 1];        //> the best length-lo subsequence ends here, and nums[i] extends it
            if (lo == (int)tails.size()) tails.push_back(i);
            else tails[lo] = i;
        }
        vector<int> out;
        for (int k = tails.empty() ? -1 : tails.back(); k != -1; k = parent[k]) out.push_back(nums[k]);   //> walk the parent chain
        reverse(out.begin(), out.end());
        return out;
    }
};`
        },
        tests: { fn: { py: 'lis_sequence', default: 'lisSequence' }, sig: { args: ['int[]'] }, cases: [
          { args: [[10, 9, 2, 5, 3, 7, 101, 18]], out: [2, 3, 7, 18] }, { args: [[0, 1, 0, 3, 2, 3]], out: [0, 1, 2, 3] }, { args: [[5, 4, 3]], out: [3] },
          { args: [[]], out: [] }, { args: [[1, 2, 3]], out: [1, 2, 3] }, { args: [[4, 10, 4, 3, 8, 9]], out: [3, 8, 9] }, { args: [[3, 1, 2, 1, 2]], out: [1, 2] }] }
      },
      {
        name: 'Non-decreasing: allow equal values',
        body: 'If equal neighbours are allowed (`[2, 2, 3]` counts as length 3), the tails array must be allowed to hold repeats, so the search has to find the first tail that is **strictly greater** than `x`: an upper bound, `bisect_right` in Python. The only change from the template is `<` becoming `<=` in the test. With a plain lower bound, a repeated value would *replace* its twin instead of extending it, and `[7, 7, 7]` would report 1 instead of 3. Many bugs in this problem are a mismatch between what the statement says (strict or not) and which bound you used.',
        code: {
          py: `def lis_non_decreasing(nums):
    tails = []
    for x in nums:
        lo, hi = 0, len(tails)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if tails[mid] <= x:            #> The only change: <= instead of <  (this is bisect_right)
                lo = mid + 1
            else:
                hi = mid
        if lo == len(tails):
            tails.append(x)
        else:
            tails[lo] = x
    return len(tails)`,
          js: `function lisNonDecreasing(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] <= x) lo = mid + 1;       //> The only change: <= instead of <  (an upper bound)
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}`,
          java: `class Solution {
    public int lisNonDecreasing(int[] nums) {
        int[] tails = new int[nums.length];
        int size = 0;
        for (int x : nums) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] <= x) lo = mid + 1;   //> The only change: <= instead of <  (an upper bound)
                else hi = mid;
            }
            tails[lo] = x;
            if (lo == size) size++;
        }
        return size;
    }
}`,
          cpp: `class Solution {
public:
    int lisNonDecreasing(vector<int>& nums) {
        vector<int> tails;
        for (int x : nums) {
            int lo = 0, hi = tails.size();
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] <= x) lo = mid + 1;   //> The only change: <= instead of <  (an upper bound)
                else hi = mid;
            }
            if (lo == (int)tails.size()) tails.push_back(x);
            else tails[lo] = x;
        }
        return tails.size();
    }
};`
        },
        tests: { fn: { py: 'lis_non_decreasing', default: 'lisNonDecreasing' }, sig: { args: ['int[]'] }, cases: [
          { args: [[10, 9, 2, 5, 3, 7, 101, 18]], out: 4 }, { args: [[0, 1, 0, 3, 2, 3]], out: 4 }, { args: [[7, 7, 7]], out: 3 }, { args: [[2, 2, 3, 3, 4, 4]], out: 6 }, { args: [[3, 1, 2, 1, 2]], out: 3 }, { args: [[]], out: 0 }] }
      },
      {
        name: 'Two dimensions: sort, then LIS on the second',
        body: 'When items have two numbers and item B nests inside item A only if **both** numbers are strictly smaller (envelopes, boxes), sort by the first number ascending. Any valid chain is now increasing in the first number automatically, so only the second needs a strictly increasing subsequence. One trap remains: items with the **same** first number must never both be picked, yet after sorting they sit side by side and could look like an increase in the second number. The fix is to sort ties by the second number **descending**, so equal-first-number items can never form an increasing pair. The worked problem Russian Doll Envelopes below does exactly this. [Interval-style chaining](#/topic/intervals) is the same family: sort by one end, then run LIS or greedy on the other.'
      },
      {
        name: 'When LIS is the wrong tool',
        body: 'LIS needs a **subsequence** with an ordering condition between *any* earlier and later pair. If the pieces must be **adjacent**, use a [sliding window](#/topic/sliding-window) or [Kadane](#/topic/kadane): the longest increasing *run* is a simple one-pass counter. If you need the longest common subsequence of **two** sequences, that’s a 2-D DP (and note that LCS with a permutation reduces to LIS). If values must go up by exactly one each step (consecutive integers), a hash set is simpler. And when the answer is “the **minimum number of removals** to make it sorted”, that’s `n - LIS`, which is a use of the tool rather than a reason to avoid it.'
      }
    ],

    worked: [
      {
        lc: 300,
        restate: 'Given a list of integers, return the length of the longest **strictly increasing** subsequence: values picked in their original order, gaps allowed, each bigger than the one before.',
        examples: '- `[10,9,2,5,3,7,101,18]` → 4 (for example `2, 3, 7, 18`).\n- `[0,1,0,3,2,3]` → 4.\n- `[7,7,7,7]` → 1: equal values don’t count as increasing.\n- Edge cases: one element; a strictly decreasing list (answer 1); an already sorted list (answer n).',
        brute: 'Try every subset and keep the longest increasing one: O(2ⁿ · n). The usual first improvement is the DP “longest ending at i” with two nested loops: O(n²) time. That’s correct and fine for a couple of thousand elements, and the follow-up usually asks for better.',
        insight: 'Maintain `tails`, where `tails[k]` is the **smallest last value** among increasing subsequences of length `k + 1`. It stays strictly increasing. For a new value `x`, find the first tail that is `>= x`. If there is none, `x` extends the longest subsequence, so append. Otherwise `x` is a smaller ending for that length, so overwrite: nothing gets shorter, and a smaller tail is never worse. The answer is `len(tails)`. Use the lower bound (`<` in the search) because equal values must not extend each other.',
        code: {
          py: `class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        tails = []
        for x in nums:
            lo, hi = 0, len(tails)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if tails[mid] < x:
                    lo = mid + 1
                else:
                    hi = mid                  # first tail >= x
            if lo == len(tails):
                tails.append(x)               # longer than anything so far
            else:
                tails[lo] = x                 # a smaller ending for length lo + 1
        return len(tails)`,
          js: `function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;                          // first tail >= x
    }
    if (lo === tails.length) tails.push(x);   // longer than anything so far
    else tails[lo] = x;                       // a smaller ending for length lo + 1
  }
  return tails.length;
}`,
          java: `class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int size = 0;
        for (int x : nums) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] < x) lo = mid + 1;
                else hi = mid;                // first tail >= x
            }
            tails[lo] = x;                    // append (lo == size) or replace
            if (lo == size) size++;
        }
        return size;
    }
}`,
          cpp: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails;
        for (int x : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), x);   // first tail >= x
            if (it == tails.end()) tails.push_back(x);              // longer than anything so far
            else *it = x;                                           // a smaller ending
        }
        return tails.size();
    }
};`
        },
        complexity: 'O(n log n) time: one binary search per value. O(n) space for `tails`.',
        say: '“I’ll start with the DP: dp[i] is the longest increasing subsequence ending at i, so O(n²). To speed it up I keep an array tails where tails[k] is the smallest possible last value of an increasing subsequence of length k + 1. That array is always sorted, so for each number I binary search the first tail that is at least as big, and replace it, or append if there isn’t one. The length of tails is the answer: O(n log n). Note that tails itself isn’t a real subsequence, only its length is meaningful.”',
        followups: [
          { q: 'Why does replacing a tail never break an earlier answer?', a: 'The replaced value `tails[lo]` stands for “some subsequence of length lo + 1 ends in this value”. A smaller ending is at least as good for every future extension, and the number of entries doesn’t change, so the length you’d report is unaffected.' },
          { q: 'How would you return the subsequence itself?', a: 'Store indices in `tails`, and keep `parent[i]`, the index at `lo - 1` when `i` was placed. Follow parents back from the last tail and reverse. See the reconstruction variation.' },
          { q: 'What changes if equal values are allowed?', a: 'Swap the lower bound for an upper bound: the test becomes `tails[mid] <= x`. Then equal values append instead of replacing each other.' }
        ]
      },
      {
        lc: 354,
        restate: 'Each envelope is a pair `(width, height)`. One envelope fits inside another only if **both** its width and its height are strictly smaller. Rotating is not allowed. Return the largest number of envelopes that can be nested one inside the next.',
        examples: '- `[[5,4],[6,4],[6,7],[2,3]]` → 3 (`[2,3] → [5,4] → [6,7]`).\n- `[[1,1],[1,1],[1,1]]` → 1: identical envelopes don’t fit.\n- Edge cases: one envelope; many envelopes sharing a width (only one of each width can be used); a chain that is increasing in height but not in width.',
        brute: 'DP over pairs: sort by width, then `dp[i] = 1 + max(dp[j])` over earlier `j` with both dimensions smaller. That’s O(n²), too slow for n around 10⁵.',
        insight: 'Sort by width ascending. Then any nesting chain read in sorted order already has non-decreasing widths, so you only need a **strictly increasing subsequence of heights**: ordinary LIS. The catch is equal widths. Two envelopes with the same width can’t nest, but if they appear in ascending height order they would look like a valid step in the height sequence. Sort ties by height **descending** instead, so within one width the heights go down and the LIS can pick at most one of them. Then run the tails algorithm on the heights.',
        code: {
          py: `class Solution:
    def maxEnvelopes(self, envelopes: List[List[int]]) -> int:
        envelopes.sort(key=lambda e: (e[0], -e[1]))   # width up; ties: height DOWN
        tails = []
        for _, h in envelopes:
            lo, hi = 0, len(tails)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if tails[mid] < h:
                    lo = mid + 1
                else:
                    hi = mid
            if lo == len(tails):
                tails.append(h)
            else:
                tails[lo] = h
        return len(tails)`,
          js: `function maxEnvelopes(envelopes) {
  envelopes.sort((a, b) => a[0] - b[0] || b[1] - a[1]);   // width up; ties: height DOWN
  const tails = [];
  for (const [, h] of envelopes) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] < h) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(h);
    else tails[lo] = h;
  }
  return tails.length;
}`,
          java: `class Solution {
    public int maxEnvelopes(int[][] envelopes) {
        Arrays.sort(envelopes, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));   // width up; ties: height DOWN
        int[] tails = new int[envelopes.length];
        int size = 0;
        for (int[] e : envelopes) {
            int h = e[1], lo = 0, hi = size;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] < h) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = h;
            if (lo == size) size++;
        }
        return size;
    }
}`,
          cpp: `class Solution {
public:
    int maxEnvelopes(vector<vector<int>>& envelopes) {
        sort(envelopes.begin(), envelopes.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];   // width up; ties: height DOWN
        });
        vector<int> tails;
        for (auto& e : envelopes) {
            auto it = lower_bound(tails.begin(), tails.end(), e[1]);
            if (it == tails.end()) tails.push_back(e[1]);
            else *it = e[1];
        }
        return tails.size();
    }
};`
        },
        complexity: 'O(n log n) time: the sort, then one binary search per envelope. O(n) space.',
        say: '“It’s a 2-D longest increasing subsequence. I sort by width ascending, so widths never go backwards along a chain, and what’s left is a strictly increasing subsequence of heights. For equal widths I sort heights descending, so two envelopes of the same width can never both be in an increasing run. Then I run the tails-and-binary-search LIS on the heights: O(n log n).”',
        followups: [
          { q: 'What goes wrong if ties are sorted by height ascending?', a: 'For `[[3,1],[3,2]]` the heights read 1, 2, an increase, so LIS reports 2, but the envelopes have the same width and can’t nest. Descending order makes that pair read 2, 1.' },
          { q: 'Why is sorting by width enough to drop that dimension?', a: 'After the sort, any subsequence has non-decreasing widths. With the tie rule, a strictly increasing run of heights can’t include two equal widths, so every step is strictly bigger in both.' },
          { q: 'Could you sort by height and run LIS on width instead?', a: 'Yes, by symmetry. Sort by height ascending, ties by width descending, and take LIS on widths.' }
        ]
      },
      {
        lc: 673,
        restate: 'Given a list of integers, return **how many** strictly increasing subsequences have the maximum possible length. Different positions count as different subsequences even if the values match.',
        examples: '- `[1,3,5,4,7]` → 2 (`1,3,5,7` and `1,3,4,7`).\n- `[2,2,2,2,2]` → 5: each element alone is a longest subsequence, and they sit at different positions.\n- Edge cases: one element (answer 1); a strictly decreasing list (answer n); several different ways to reach the same length.',
        brute: 'Generate every subsequence and count the longest increasing ones: O(2ⁿ). Even enumerating just the increasing ones can explode.',
        insight: 'Take the O(n²) DP and carry a second table. `length[i]` is the length of the longest increasing subsequence ending at `i`, and `count[i]` is **how many** subsequences achieve that length. For each earlier `j` with `nums[j] < nums[i]`: if `length[j] + 1` beats `length[i]`, then `i` now has a new best length, so `count[i] = count[j]` (reset). If it **ties**, more ways reach the same length, so `count[i] += count[j]`. At the end, add `count[i]` over every `i` whose `length[i]` equals the overall maximum. The tails trick doesn’t track counts, so the quadratic DP is the right tool here.',
        code: {
          py: `class Solution:
    def findNumberOfLIS(self, nums: List[int]) -> int:
        n = len(nums)
        if n == 0:
            return 0
        length, count = [1] * n, [1] * n
        for i in range(n):
            for j in range(i):
                if nums[j] < nums[i]:
                    if length[j] + 1 > length[i]:
                        length[i] = length[j] + 1     # a longer way: restart the count
                        count[i] = count[j]
                    elif length[j] + 1 == length[i]:
                        count[i] += count[j]          # another way to tie: add its ways
        best = max(length)
        return sum(count[i] for i in range(n) if length[i] == best)`,
          js: `function findNumberOfLIS(nums) {
  const n = nums.length;
  const length = new Array(n).fill(1), count = new Array(n).fill(1);
  let best = 0, total = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        if (length[j] + 1 > length[i]) { length[i] = length[j] + 1; count[i] = count[j]; }   // a longer way: restart the count
        else if (length[j] + 1 === length[i]) count[i] += count[j];                         // another way to tie
      }
    }
    if (length[i] > best) { best = length[i]; total = count[i]; }
    else if (length[i] === best) total += count[i];
  }
  return total;
}`,
          java: `class Solution {
    public int findNumberOfLIS(int[] nums) {
        int n = nums.length, best = 0, total = 0;
        int[] length = new int[n], count = new int[n];
        for (int i = 0; i < n; i++) {
            length[i] = 1;
            count[i] = 1;
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    if (length[j] + 1 > length[i]) { length[i] = length[j] + 1; count[i] = count[j]; }   // a longer way: restart the count
                    else if (length[j] + 1 == length[i]) count[i] += count[j];                          // another way to tie
                }
            }
            if (length[i] > best) { best = length[i]; total = count[i]; }
            else if (length[i] == best) total += count[i];
        }
        return total;
    }
}`,
          cpp: `class Solution {
public:
    int findNumberOfLIS(vector<int>& nums) {
        int n = nums.size(), best = 0, total = 0;
        vector<int> length(n, 1), count(n, 1);
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    if (length[j] + 1 > length[i]) { length[i] = length[j] + 1; count[i] = count[j]; }   // a longer way: restart the count
                    else if (length[j] + 1 == length[i]) count[i] += count[j];                          // another way to tie
                }
            }
            if (length[i] > best) { best = length[i]; total = count[i]; }
            else if (length[i] == best) total += count[i];
        }
        return total;
    }
};`
        },
        complexity: 'O(n²) time and O(n) space. (A segment-tree or Fenwick version reaches O(n log n), but it’s rarely expected.)',
        say: '“I extend the LIS DP with a count. For each i I keep the best length ending there and the number of ways to get that length. Looking back at each smaller earlier j: a longer length resets the count to count[j], and an equal length adds count[j]. At the end I sum the counts over all positions whose length equals the global maximum. It’s O(n²) time, O(n) space.”',
        followups: [
          { q: 'Why can’t the tails array count them?', a: '`tails` throws information away on purpose: it keeps only the smallest ending per length. Two different subsequences with different endings collapse into one slot, so the number of ways is lost.' },
          { q: 'Why sum over every index with the maximum length, not just the last one?', a: 'A longest subsequence can end at any position. Each distinct ending index with length equal to the maximum contributes its own count.' },
          { q: 'Why `count[i] = count[j]` on a strictly better length rather than `+=`?', a: 'The ways counted so far were for a shorter length, so they’re no longer longest. You start over with only the ways that realize the new best.' }
        ]
      },
      {
        lc: 646,
        restate: 'You get pairs `[left, right]` with `left < right`. A pair can follow another if its `left` is strictly greater than the earlier pair’s `right`. You may choose pairs in any order and may skip some. Return the longest chain you can build.',
        examples: '- `[[1,2],[2,3],[3,4]]` → 2 (`[1,2]` then `[3,4]`).\n- `[[1,2],[7,8],[4,5]]` → 3.\n- Edge cases: one pair; one huge pair covering everything else (skip it); pairs touching at an endpoint do not chain.',
        brute: 'Sort by `left` and run the LIS-style DP: `dp[i] = 1 + max(dp[j])` where pair `j`’s right is below pair `i`’s left. That’s O(n²), and it is already a valid answer. It treats the problem as a longest increasing subsequence on a pair condition.',
        insight: 'This LIS has more structure than a general one, so a greedy beats the DP. Sort by **right endpoint**. Always take the pair that finishes earliest, and then the next pair whose left is past the chosen right. Finishing earliest leaves the most room for later pairs, and an exchange argument shows no optimal chain does better. It’s the same idea as the classic activity-selection problem. You’ll see the shape again in [intervals](#/topic/intervals).',
        code: {
          py: `class Solution:
    def findLongestChain(self, pairs: List[List[int]]) -> int:
        pairs.sort(key=lambda p: p[1])        # earliest finish first
        count, end = 0, float('-inf')
        for left, right in pairs:
            if left > end:                    # starts strictly after the last chosen one ends
                count += 1
                end = right
        return count`,
          js: `function findLongestChain(pairs) {
  pairs.sort((a, b) => a[1] - b[1]);         // earliest finish first
  let count = 0, end = -Infinity;
  for (const [left, right] of pairs) {
    if (left > end) {                        // starts strictly after the last chosen one ends
      count++;
      end = right;
    }
  }
  return count;
}`,
          java: `class Solution {
    public int findLongestChain(int[][] pairs) {
        Arrays.sort(pairs, (a, b) -> Integer.compare(a[1], b[1]));   // earliest finish first
        int count = 0;
        long end = Long.MIN_VALUE;
        for (int[] p : pairs) {
            if (p[0] > end) {                // starts strictly after the last chosen one ends
                count++;
                end = p[1];
            }
        }
        return count;
    }
}`,
          cpp: `class Solution {
public:
    int findLongestChain(vector<vector<int>>& pairs) {
        sort(pairs.begin(), pairs.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });   // earliest finish first
        int count = 0;
        long long end = LLONG_MIN;
        for (auto& p : pairs) {
            if (p[0] > end) {                // starts strictly after the last chosen one ends
                count++;
                end = p[1];
            }
        }
        return count;
    }
};`
        },
        complexity: 'O(n log n) time for the sort, O(1) extra space (O(n) if the sort copies).',
        say: '“It’s a longest chain, so I could do the O(n²) LIS DP after sorting. But the condition is interval-like, so greedy works: sort by right endpoint, take a pair whenever its left is strictly past the end of the last chosen pair. Finishing earliest leaves the most room, which an exchange argument backs up. O(n log n).”',
        followups: [
          { q: 'Why sort by the right end and not the left?', a: 'Sorting by left lets a long pair block many short ones. Sorting by right means the first available pair always finishes as early as possible, so no later option is lost.' },
          { q: 'How is this the same family as LIS?', a: 'The chain condition `right_j < left_i` is an ordering between any earlier and later pick, so the DP is exactly LIS. The greedy is a shortcut available because the order comes from an interval.' },
          { q: 'What if touching endpoints are allowed to chain?', a: 'Change the test to `left >= end`. That’s the same “strict or not” choice as the non-decreasing LIS.' }
        ]
      }
    ],

    practice: [
      { lc: 300,
        hints: ['“Subsequence” means you may skip elements but keep their order. Think about the best answer **ending at each index**.', 'The simple DP: `dp[i] = 1 + max(dp[j])` over earlier `j` with `nums[j] < nums[i]`. That is O(n²). To go faster, ask what single number you’d want to remember for each length.', 'Keep `tails`, where `tails[k]` is the smallest last value of an increasing subsequence of length `k + 1`. It’s sorted, so binary search the first tail `>= x`, then append or replace. The answer is `len(tails)`.'],
        solution: { explain: 'The tails array with a lower-bound search. Use `<` (a lower bound) because equal values must not extend each other. O(n log n) time, O(n) space.', code: {
          py: `class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        tails = []
        for x in nums:
            lo, hi = 0, len(tails)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if tails[mid] < x:
                    lo = mid + 1
                else:
                    hi = mid
            if lo == len(tails):
                tails.append(x)
            else:
                tails[lo] = x
        return len(tails)`,
          js: `function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return tails.length;
}` } },
        starter: { py: 'class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        ', js: 'function lengthOfLIS(nums) {\n  \n}' },
        tests: { fn: 'lengthOfLIS', sig: { args: ['int[]'] }, cases: [
          { args: [[10, 9, 2, 5, 3, 7, 101, 18]], out: 4 }, { args: [[0, 1, 0, 3, 2, 3]], out: 4 }, { args: [[7, 7, 7, 7, 7, 7, 7]], out: 1 }, { args: [[1]], out: 1 },
          { args: [[3, 2, 1]], out: 1 }, { args: [[1, 2, 3, 4, 5]], out: 5 }, { args: [[4, 10, 4, 3, 8, 9]], out: 3 }, { args: [[2, 2, 3, 3, 4, 4]], out: 3 }, { args: [[1, 3, 6, 7, 9, 4, 10, 5, 6]], out: 6 }] } },

      { lc: 354,
        hints: ['One envelope nests in another only if both numbers are strictly smaller. If you sort by one number, what remains to check?', 'Sort by width ascending, then find a strictly increasing subsequence of heights. Watch out for envelopes of equal width: they must never both be chosen.', 'Sort ties by height **descending**, so equal-width envelopes read as a decrease and the LIS can take only one. Then run the tails algorithm on the heights.'],
        starter: { py: 'class Solution:\n    def maxEnvelopes(self, envelopes: List[List[int]]) -> int:\n        ', js: 'function maxEnvelopes(envelopes) {\n  \n}' },
        tests: { fn: 'maxEnvelopes', sig: { args: ['int[][]'] }, cases: [
          { args: [[[5, 4], [6, 4], [6, 7], [2, 3]]], out: 3 }, { args: [[[1, 1], [1, 1], [1, 1]]], out: 1 }, { args: [[[4, 5], [4, 6], [6, 7], [2, 3], [1, 1]]], out: 4 },
          { args: [[[1, 3], [3, 5], [6, 7], [6, 8], [8, 4], [9, 5]]], out: 3 }, { args: [[[3, 1], [3, 2]]], out: 1 },
          { args: [[[2, 100], [3, 200], [4, 300], [5, 500], [5, 400], [5, 250], [6, 370], [6, 360], [7, 380]]], out: 5 }, { args: [[[7, 7]]], out: 1 }] } },

      { lc: 673,
        hints: ['The tails array forgets how many ways there are. Go back to the O(n²) DP, where `length[i]` is the best length ending at `i`.', 'Keep a second table `count[i]`: the number of subsequences of that best length ending at `i`. For each smaller earlier `j`, a longer `length[j] + 1` resets `count[i] = count[j]`.', 'If `length[j] + 1` ties the current `length[i]`, add: `count[i] += count[j]`. At the end, sum `count[i]` over every `i` whose length equals the maximum.'],
        starter: { py: 'class Solution:\n    def findNumberOfLIS(self, nums: List[int]) -> int:\n        ', js: 'function findNumberOfLIS(nums) {\n  \n}' },
        tests: { fn: 'findNumberOfLIS', sig: { args: ['int[]'] }, cases: [
          { args: [[1, 3, 5, 4, 7]], out: 2 }, { args: [[2, 2, 2, 2, 2]], out: 5 }, { args: [[1]], out: 1 }, { args: [[1, 2, 4, 3, 5, 4, 7, 2]], out: 3 },
          { args: [[5, 4, 3]], out: 3 }, { args: [[1, 1, 2, 2]], out: 4 }] } },

      { lc: 646,
        hints: ['A pair can follow another when its left is strictly past the other’s right. You pick the pairs, in any order.', 'You could sort and run the O(n²) LIS-style DP. But the condition is about intervals, so a greedy works: which pair should you take first to leave the most room?', 'Sort by right endpoint. Walk through them and take a pair whenever its left is greater than the last chosen right; update that right and count one.'],
        starter: { py: 'class Solution:\n    def findLongestChain(self, pairs: List[List[int]]) -> int:\n        ', js: 'function findLongestChain(pairs) {\n  \n}' },
        tests: { fn: 'findLongestChain', sig: { args: ['int[][]'] }, cases: [
          { args: [[[1, 2], [2, 3], [3, 4]]], out: 2 }, { args: [[[1, 2], [7, 8], [4, 5]]], out: 3 },
          { args: [[[-10, -8], [8, 9], [-5, 0], [6, 10], [-6, -4], [1, 7], [9, 10], [-4, 7]]], out: 4 }, { args: [[[1, 10], [2, 3], [4, 5]]], out: 2 }, { args: [[[1, 2]]], out: 1 }] } }
    ],

    mistakes: [
      '**Returning `tails` (or reading it) as the subsequence.** Only `len(tails)` is meaningful. The array mixes endings from different moments, so it can list values out of their original order. For the real subsequence, store indices and a `parent` array.',
      '**Strict versus non-decreasing mixed up.** Strict increase uses the lower bound (`tails[mid] < x`). Allowing equal values uses the upper bound (`tails[mid] <= x`). With the wrong one, `[7, 7, 7]` gives 1 when 3 is expected, or 3 when 1 is expected.',
      '**Taking `dp[-1]` instead of `max(dp)`.** In the O(n²) DP, `dp[i]` is the best subsequence that ends exactly at `i`, and the longest one can end anywhere. Return the maximum of the row. (`dp` of an empty list needs a guard too.)',
      '**Confusing subsequence with subarray.** A subsequence may skip elements; a subarray must be contiguous. If the question wants contiguous runs, the answer is a simple one-pass counter, not a DP.',
      '**Equal widths in the envelope problem.** Sorting only by width, or sorting ties by height ascending, lets two envelopes of the same width both appear in an increasing run. Sort ties by height descending.',
      '**Counting with the tails trick.** It can’t count, because it forgets which subsequences tie. Counting needs the quadratic DP with a `count` table, a reset when you find a longer length, and an add when you tie.',
      '**Not resetting the counter.** In the counting DP, setting `count[i] += count[j]` on a strictly longer length keeps stale ways from a shorter length. Reset on a better length, add on a tie.',
      '**Language gotchas.** *Python:* `bisect_left` is the strict version and `bisect_right` the non-decreasing one, so you can replace the hand-written search, but keep the loop in an interview if asked to explain. *JavaScript:* `sort()` with no comparator sorts as strings, so always pass `(a, b) => a - b` style comparators; `Math.floor` for the midpoint. *Java:* `Arrays.sort` on `int[][]` needs a comparator, and `a[0] - b[0]` can overflow, so use `Integer.compare`. *C++:* `std::lower_bound` on the tails vector does the search in one line; a sort comparator must be a strict ordering (`<`, never `<=`), or the sort can crash.'
    ],

    quiz: [
      { kind: 'concept', q: 'In the tails-array algorithm, what does `tails[k]` hold?',
        choices: ['The smallest last value of any increasing subsequence of length k + 1', 'The k-th element of the longest increasing subsequence', 'The length of the longest subsequence ending at index k', 'The largest value seen so far at position k'], answer: 0,
        explain: 'It is the smallest possible ending for a subsequence of that length. Smaller endings leave more room to extend, which is why only the smallest is kept. It is not the subsequence itself.' },
      { kind: 'complexity', q: 'What are the time complexities of the DP version and the tails version, in that order?',
        choices: ['O(n²) and O(n log n)', 'O(n log n) and O(n)', 'O(n²) and O(n²)', 'O(2ⁿ) and O(n log n)'], answer: 0,
        explain: 'The DP compares each index with every earlier one. The tails version does one binary search per element over an array of size at most n.' },
      { kind: 'concept', q: 'Running the tails algorithm on `[3, 8, 1]` leaves `tails = [1, 8]`. What does that tell you?',
        choices: ['The LIS length is 2, but `[1, 8]` is not a subsequence of the input', 'The LIS is `[1, 8]`', 'The LIS length is 3', 'The algorithm has a bug'], answer: 0,
        explain: 'The 1 came after the 8, so `[1, 8]` is not in input order. The count of entries is right (2, from `[3, 8]`), but the entries themselves are not a real subsequence.' },
      { kind: 'bug', q: 'This is meant to return the length of the longest strictly increasing subsequence. Which input exposes the bug?',
        code: `def lis(nums):
    n = len(nums)
    dp = [1] * n
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return dp[-1]`,
        choices: ['`[1, 2, 3, 0]` returns 1, but the answer is 3', '`[1, 2, 3]` returns 2', '`[]` returns 0', '`[5, 5]` returns 2'], answer: 0,
        explain: 'The longest subsequence can end anywhere. `dp[-1]` is the best ending at the last index only. Return `max(dp)`.' },
      { kind: 'concept', q: 'You need the longest **non-decreasing** subsequence (equal values allowed). What changes in the tails algorithm?',
        choices: ['Search with `tails[mid] <= x` (an upper bound) instead of `<`', 'Nothing changes', 'Sort the input first', 'Use `>` in the search'], answer: 0,
        explain: 'With an upper bound, an equal value lands after its twin and extends it. With a lower bound it would replace the twin, so `[7, 7, 7]` would give 1.' },
      { kind: 'pattern', q: 'Which of these reduce to a longest increasing subsequence? Pick every one that applies.',
        choices: ['Nesting envelopes where both dimensions must be strictly smaller (after sorting)', 'Fewest elements to delete so the list becomes strictly increasing', 'Longest run of adjacent increasing days', 'Maximum sum of a contiguous stretch'], answer: [0, 1],
        explain: 'The first is a 2-D LIS (sort by one side, LIS on the other). The second is `n - LIS`. A run of *adjacent* days is a simple counter, and the contiguous maximum sum is Kadane.' },
      { kind: 'bug', q: 'In the envelope problem, a solution sorts by width ascending and breaks width ties by height **ascending**. Which input does it get wrong?',
        choices: ['`[[3, 1], [3, 2]]`: it reports 2 instead of 1', '`[[1, 1], [2, 2]]`: it reports 1', '`[[5, 5]]`: it reports 0', 'None, since ties never matter'], answer: 0,
        explain: 'After sorting, the heights read 1, 2, an increase, so the LIS counts both even though the widths are equal and neither fits inside the other. Descending height makes them read 2, 1.' },
      { kind: 'concept', q: 'When counting longest increasing subsequences with the DP, a smaller earlier `j` gives `length[j] + 1 > length[i]`. What happens to `count[i]`?',
        choices: ['It is set to `count[j]`', 'It is increased by `count[j]`', 'It is set to 1', 'It is unchanged'], answer: 0,
        explain: 'A strictly longer length makes all the old ways (for a shorter length) irrelevant, so you restart with `count[j]`. Only a tie adds.' },
      { kind: 'complexity', q: 'The longest chain of pairs (each pair’s left strictly past the last pair’s right) can be solved how fast?',
        choices: ['O(n log n), by sorting on the right end and taking greedily', 'O(n²) only', 'O(n) with no sort', 'O(2ⁿ)'], answer: 0,
        explain: 'The interval structure allows a greedy choice (earliest finish first). The LIS-style DP is O(n²), and the greedy’s cost is the sort.' }
    ],

    flashcards: [
      { id: 'tails-def', front: 'What does `tails[k]` mean in the O(n log n) LIS?', back: 'The **smallest last value** of any increasing subsequence of length `k + 1` seen so far. The array is always strictly increasing.' },
      { id: 'tails-rule', front: 'For each `x`, what does the tails algorithm do?', back: 'Binary search the first tail `>= x`. If none exists, **append** `x` (the LIS grew). Otherwise **replace** that tail with `x`. The answer is `len(tails)`.' },
      { id: 'tails-not-seq', front: 'Is `tails` the longest increasing subsequence?', back: 'No. Only its **length** is the answer. It can hold values out of input order (`[3, 8, 1]` gives `[1, 8]`). Use indices and parent pointers to rebuild a real one.' },
      { id: 'dp-def', front: 'DP definition and recurrence for the O(n²) LIS?', back: '`dp[i]` = longest increasing subsequence **ending at i**. `dp[i] = 1 + max(dp[j])` over `j < i` with `nums[j] < nums[i]`. The answer is `max(dp)`.' },
      { id: 'dp-answer-max', front: 'Why is the answer `max(dp)` and not `dp[n-1]`?', back: 'The best subsequence can end at any index; `dp[n-1]` only covers those ending at the last element.' },
      { id: 'strict-bound', front: 'Strict LIS: lower bound or upper bound?', back: 'Lower bound: find the first tail `>= x`, so `tails[mid] < x` moves right. Equal values replace each other.' },
      { id: 'non-decreasing', front: 'How does the non-decreasing LIS differ?', back: 'Use an upper bound: `tails[mid] <= x` moves right (`bisect_right`). Equal values then append instead of replacing.' },
      { id: 'parent-ptr', front: 'How do you reconstruct an actual longest subsequence?', back: 'Store **indices** in `tails`, and `parent[i] = tails[lo - 1]` when `i` is placed at `lo`. Walk back from the last tail through `parent`, then reverse.' },
      { id: 'count-lis', front: 'How do you count the longest increasing subsequences?', back: 'O(n²) DP with `length[i]` and `count[i]`. A longer way: `count[i] = count[j]`. A tie: `count[i] += count[j]`. Sum `count` where length equals the max.' },
      { id: 'envelopes', front: 'The 2-D (envelopes) trick?', back: 'Sort by width ascending, **ties by height descending**, then strictly increasing LIS on heights. The tie rule stops two equal widths from both being chosen.' },
      { id: 'chain-greedy', front: 'Longest chain of pairs: what is the fast method?', back: 'Sort by right endpoint and take a pair whenever its left is greater than the last chosen right. Earliest finish leaves the most room. O(n log n).' },
      { id: 'removals', front: 'Minimum deletions to make a list strictly increasing?', back: '`n - LIS`. Keep the longest increasing subsequence, delete everything else.' },
      { id: 'lis-vs-subarray', front: 'LIS versus longest increasing subarray?', back: 'LIS lets you skip elements (O(n log n)). A subarray must be contiguous: a one-pass counter that resets when the next value is not bigger.' }
    ],

    deeper: [
      { title: 'NeetCode: Longest Increasing Subsequence', url: 'https://neetcode.io/problems/longest-increasing-subsequence', time: 'about 15 min', note: 'A walk-through of the DP, including the recursion with memoization behind it. Good for seeing where the quadratic table comes from.' },
      { title: 'Longest increasing subsequence (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Longest_increasing_subsequence', time: 'about 10 min', note: 'The patience-sorting algorithm and parent-pointer reconstruction in textbook form, plus the link to Young tableaux. A reference to skim after you can write the code.' },
      { title: 'Patience sorting (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Patience_sorting', time: 'about 10 min', note: 'The card game behind the tails array: why the number of piles equals the LIS length.' },
      { title: 'LeetCode: Dynamic Programming tag', url: 'https://leetcode.com/tag/dynamic-programming/', time: 'reference', note: 'More practice after LIS, including the other classics that follow the same “best ending at i” shape.' }
    ],

    detective: [
      { id: 'choir-line', decoys: ['dp-1d', 'greedy', 'sorting'],
        statement: 'A choir director has a long row of singers standing in a fixed order, each with a known pitch. She may send some singers off the stage, but the ones who stay must keep their places in the row, and from left to right each remaining singer must sing strictly higher than the one before. With up to a hundred thousand singers, how few must she send away?',
        why: 'The singers who stay form a subsequence that keeps its order and climbs, so you want the **longest** one (the answer is the row length minus it). The condition links any earlier and later pick, not neighbours, and the size needs better than checking all pairs: keep the smallest possible ending for each length and binary search it.' },
      { id: 'crate-tower', decoys: ['sorting', 'greedy', 'dp-2d'],
        statement: 'A warehouse stacks identical-looking wooden crates into towers. Each crate has a floor length and a floor width. A crate may rest on another only if both its length and its width are strictly smaller than the one beneath it, and crates can’t be turned sideways. You can pick any crates in any order. What’s the tallest tower, counted in crates?',
        why: 'Two numbers must both shrink, which looks two-dimensional. Sort by one number so that part is settled, break ties so equal sizes can’t both be used, and what remains is picking the longest strictly increasing run in the other number, in the sorted order.' },
      { id: 'rain-gauge', decoys: ['dp-1d', 'kadane', 'dp-2d'],
        statement: 'A hydrologist has a record of daily river readings. She wants to pick days, in calendar order, so that the readings she picks keep rising strictly. Out of all such selections she cares only about the longest ones. How many different sets of days give a longest rising selection? Two selections differ if they use different days, even when the readings match.',
        why: 'Finding the longest selection is the classic ordered-subsequence problem, but the question asks for how many ways, and the sorted-endings shortcut throws that information away. Keep, for each day, the best length ending there and how many selections achieve it, and combine counts from earlier smaller readings.' }
    ]
  });
})();
