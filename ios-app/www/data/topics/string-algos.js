/* Offer Ready: String algorithms. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it is written in. */
(function () {
  var OR = (window.OR = window.OR || {});

  (OR.topics = OR.topics || []).push({
    id: 'string-algos',

    hook: 'Searching for one string inside another is the oldest text problem there is, and the obvious answer, try every starting point, is quietly O(n·m). The famous linear-time fix is a single idea: **never re-read a letter you have already matched**. That same idea, a table of “longest prefix that is also a suffix”, answers a surprising family of questions with no extra machinery: is this string a repeated block, what is the shortest palindrome I can make by adding letters in front, what is the longest border. It is rare in interviews (three or four problems), but when it appears, people who know the table solve it in ten lines and everyone else writes something that times out.',

    cues: [
      'Find a **pattern inside a long text**, and the text is long enough (or the pattern repetitive enough) that trying every start would be O(n·m).',
      'The question is about a string’s **prefix that is also a suffix** (a “border”), the **shortest period**, or whether the string is **built from a repeated block**.',
      'You may **add letters at the front or back** to make a palindrome, and want the fewest. That is a longest-palindromic-**prefix** question in disguise.',
      'The phrase “**every position**” appears with “how much of the pattern still matches here”: that is a Z-function question.',
      'You need the **longest palindromic substring** in O(n), not O(n²): Manacher.',
      'The trap: for a single substring check in Python, JavaScript or Java, the built-in `find`/`indexOf` is already fast and almost always what to write. Reach for these algorithms when the question changes the problem, not when it only asks for `str.find`.'
    ],

    intuition: [
      'You are looking for the word “abcabd” inside a long text, and you have matched “abcab” when the next letter turns out wrong. The naive search says: “forget everything, slide one step, start again at the second letter.” But you **already know** the last five letters you read: they were a, b, c, a, b. You can reason about the pattern alone, before seeing any text. The end of what you matched, “ab”, is also the beginning of the pattern. So you can slide the pattern forward until that “ab” lines up with the “ab” you just read, and carry on from the next letter, **without re-reading anything**.',
      'That precomputed knowledge is the **failure table**, also called the **prefix function** or **LPS** (longest proper prefix which is also a suffix). For each position `i` of the pattern, `lps[i]` is the length of the longest piece that is both a prefix of the pattern **and** a suffix of `pattern[0..i]`, excluding the whole thing. For “aabaaab” it is `[0, 1, 0, 1, 2, 2, 3]`. It tells you, after matching `i + 1` letters and failing, how many of them are still useful: `lps[i]`.',
      'Building the table is the same trick applied to the pattern against itself. Slide a copy of the pattern under the original: a pointer `k` counts how much of the copy matches ending at `i`. If the next letters agree, `k` grows. If they do not, **do not restart**: the matched part has its own border, so fall back to `k = lps[k - 1]` and try again. The search is the identical loop with the text instead of the pattern. That is why KMP code looks like the same loop written twice.',
      'Why is it linear? The text index only moves forward. The matched count `j` goes up by at most one per letter and every fall-back lowers it, so across the whole run the total number of falls is at most the total number of rises, at most n. Same for the table: at most m. So it is O(n + m), even though there is a `while` inside a `for`.',
      'The **Z-function** is a cousin that answers a different question: for each position `i`, how long a prefix of the string starts at `i`? Put the pattern, a separator that appears nowhere, and the text together; every position whose Z value equals the pattern length is a match. **Rabin-Karp** (a rolling hash) is the third way to search; the hash machinery lives in [Hashing internals](#/topic/hashing-internals). **Manacher** is the stretch goal: it finds every palindrome centre’s radius in O(n) by reusing the mirror image of a palindrome you already know.'
    ].join('\n\n'),

    viz: 'kmp',

    template: {
      title: 'KMP: build the failure table, then search without going back',
      note: 'Two loops with the same shape. The first fills `lps` by sliding the pattern under itself: on a mismatch **fall back** to `lps[k-1]` instead of restarting, on a match **extend** `k`, then **record** `lps[i] = k`. The second runs the same loop over the text: **jump** to `lps[j-1]` on a mismatch, **match** to grow `j`, and report a hit when `j` reaches the pattern length. The text index `i` never moves backwards. To list *all* matches instead of the first, record `i - m + 1` and then set `j = lps[j-1]` rather than returning.',
      code: {
        py: `def kmp_search(text, pat):
    m = len(pat)
    lps = [0] * m
    k = 0                                       #> k = length of the border we are extending
    for i in range(1, m):
        while k > 0 and pat[i] != pat[k]:
            k = lps[k - 1]                      #@bfall > Mismatch: fall back to the next shorter border, no restart
        if pat[i] == pat[k]:
            k += 1                              #@bextend > Match: the border grows by one
        lps[i] = k                              #@bset > Record the border length for position i
    j = 0                                       #> j = how many pattern letters match right now
    for i in range(len(text)):
        while j > 0 and text[i] != pat[j]:
            j = lps[j - 1]                      #@jump > Mismatch: jump back inside the pattern, text index stays put
        if text[i] == pat[j]:                   #@cmp > Compare the text letter with the next pattern letter
            j += 1                              #@match > Match: one more pattern letter is matched
        if j == m:
            return i - m + 1                    #@found > The whole pattern matched: report where it starts
    return -1`,
        js: `function kmpSearch(text, pat) {
  const m = pat.length, lps = new Array(m).fill(0);
  let k = 0;                                    //> k = length of the border we are extending
  for (let i = 1; i < m; i++) {
    while (k > 0 && pat[i] !== pat[k]) {
      k = lps[k - 1];                           //@bfall > Mismatch: fall back to the next shorter border, no restart
    }
    if (pat[i] === pat[k]) {
      k++;                                      //@bextend > Match: the border grows by one
    }
    lps[i] = k;                                 //@bset > Record the border length for position i
  }
  let j = 0;                                    //> j = how many pattern letters match right now
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pat[j]) {
      j = lps[j - 1];                           //@jump > Mismatch: jump back inside the pattern, text index stays put
    }
    if (text[i] === pat[j]) {                   //@cmp > Compare the text letter with the next pattern letter
      j++;                                      //@match > Match: one more pattern letter is matched
    }
    if (j === m) {
      return i - m + 1;                         //@found > The whole pattern matched: report where it starts
    }
  }
  return -1;
}`,
        java: `class Solution {
    public int kmpSearch(String text, String pat) {
        int m = pat.length();
        int[] lps = new int[m];
        int k = 0;                              //> k = length of the border we are extending
        for (int i = 1; i < m; i++) {
            while (k > 0 && pat.charAt(i) != pat.charAt(k)) {
                k = lps[k - 1];                 //@bfall > Mismatch: fall back to the next shorter border, no restart
            }
            if (pat.charAt(i) == pat.charAt(k)) {
                k++;                            //@bextend > Match: the border grows by one
            }
            lps[i] = k;                         //@bset > Record the border length for position i
        }
        int j = 0;                              //> j = how many pattern letters match right now
        for (int i = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != pat.charAt(j)) {
                j = lps[j - 1];                 //@jump > Mismatch: jump back inside the pattern, text index stays put
            }
            if (text.charAt(i) == pat.charAt(j)) {   //@cmp > Compare the text letter with the next pattern letter
                j++;                            //@match > Match: one more pattern letter is matched
            }
            if (j == m) {
                return i - m + 1;               //@found > The whole pattern matched: report where it starts
            }
        }
        return -1;
    }
}`,
        cpp: `class Solution {
public:
    int kmpSearch(string text, string pat) {
        int m = pat.size();
        vector<int> lps(m, 0);
        int k = 0;                              //> k = length of the border we are extending
        for (int i = 1; i < m; i++) {
            while (k > 0 && pat[i] != pat[k]) {
                k = lps[k - 1];                 //@bfall > Mismatch: fall back to the next shorter border, no restart
            }
            if (pat[i] == pat[k]) {
                k++;                            //@bextend > Match: the border grows by one
            }
            lps[i] = k;                         //@bset > Record the border length for position i
        }
        int j = 0;                              //> j = how many pattern letters match right now
        for (int i = 0; i < (int)text.size(); i++) {
            while (j > 0 && text[i] != pat[j]) {
                j = lps[j - 1];                 //@jump > Mismatch: jump back inside the pattern, text index stays put
            }
            if (text[i] == pat[j]) {            //@cmp > Compare the text letter with the next pattern letter
                j++;                            //@match > Match: one more pattern letter is matched
            }
            if (j == m) {
                return i - m + 1;               //@found > The whole pattern matched: report where it starts
            }
        }
        return -1;
    }
};`
      },
      tests: { fn: { py: 'kmp_search', default: 'kmpSearch' }, sig: { args: ['str', 'str'] }, cases: [
        { args: ['sadbutsad', 'sad'], out: 0 }, { args: ['leetcode', 'leeto'], out: -1 }, { args: ['aaaaab', 'aab'], out: 3 },
        { args: ['aabaabaaab', 'aabaaab'], out: 3 }, { args: ['abababcab', 'ababc'], out: 2 }, { args: ['a', 'a'], out: 0 },
        { args: ['abc', 'abcd'], out: -1 }, { args: ['mississippi', 'issip'], out: 4 }, { args: ['abcxabcdabcy', 'abcy'], out: 8 }] }
    },

    complexity: {
      time: 'O(n + m)',
      space: 'O(m)',
      why: 'Building the table walks the pattern once: `k` rises by at most 1 per index and every fall-back lowers it, so there are at most m falls in total. The search does the same over the text: `j` rises at most once per text letter, and a jump only lowers it, so the total number of jumps is at most n. Two loops with an inner `while` are still linear because of this **amortized** argument (the potential is the value of `j`). The table is the only extra memory, one integer per pattern letter. The naive search is O(n·m) in the worst case, for example a text of all `a` and a pattern of `aaa…ab`.',
      trap: 'Don’t say “KMP is O(n·m) because of the nested while”. Count the total fall-backs instead: you can only fall as far as you have climbed, and you climb at most one per letter. Also be exact about the naive bound: for ordinary text it is close to O(n), which is why `str.find` is fast in practice. KMP’s value is the **guarantee**, plus the table, which answers border and period questions the naive search never could.'
    },

    variations: [
      {
        name: 'The naive search (and when it is enough)',
        body: 'Try every start and compare letter by letter, stopping at the first mismatch. Worst case O(n·m) (text `aaaaaa…`, pattern `aaab`), but on ordinary text a mismatch comes within a letter or two, so it behaves like O(n). Library `find`/`indexOf`/`strstr` implementations are heavily tuned, so for plain “does it contain” questions call the built-in and move on. In an interview, write the naive loop as a baseline, name its worst case, then offer KMP.',
        code: {
          py: `def naive_search(text, pat):
    n, m = len(text), len(pat)
    for start in range(n - m + 1):
        j = 0
        while j < m and text[start + j] == pat[j]:   #> Compare from the start; every restart re-reads text letters
            j += 1
        if j == m:
            return start
    return -1`,
          js: `function naiveSearch(text, pat) {
  const n = text.length, m = pat.length;
  for (let start = 0; start + m <= n; start++) {
    let j = 0;
    while (j < m && text[start + j] === pat[j]) j++;   //> Compare from the start; every restart re-reads text letters
    if (j === m) return start;
  }
  return -1;
}`,
          java: `class Solution {
    public int naiveSearch(String text, String pat) {
        int n = text.length(), m = pat.length();
        for (int start = 0; start + m <= n; start++) {
            int j = 0;
            while (j < m && text.charAt(start + j) == pat.charAt(j)) j++;   //> Compare from the start; every restart re-reads text letters
            if (j == m) return start;
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int naiveSearch(string text, string pat) {
        int n = text.size(), m = pat.size();
        for (int start = 0; start + m <= n; start++) {
            int j = 0;
            while (j < m && text[start + j] == pat[j]) j++;   //> Compare from the start; every restart re-reads text letters
            if (j == m) return start;
        }
        return -1;
    }
};`
        },
        tests: { fn: { py: 'naive_search', default: 'naiveSearch' }, sig: { args: ['str', 'str'] }, cases: [
          { args: ['sadbutsad', 'sad'], out: 0 }, { args: ['leetcode', 'leeto'], out: -1 }, { args: ['aaaaab', 'aab'], out: 3 },
          { args: ['mississippi', 'issip'], out: 4 }, { args: ['abc', 'abcd'], out: -1 }, { args: ['x', 'x'], out: 0 }] }
      },
      {
        name: 'The prefix function on its own',
        body: 'Pull the first loop of the template out and you have the **prefix function** (`pi` or `lps`), the most reusable tool in this topic. `lps[i]` is the length of the longest proper prefix of `s[0..i]` that is also its suffix. Three consequences are worth memorizing. **(1)** `lps[n-1]` is the length of the longest border of the whole string. **(2)** `n - lps[n-1]` is its **shortest period**, and the string is a full repetition of a block exactly when that period divides `n` and `lps[n-1] > 0`. **(3)** The chain `lps[n-1]`, `lps[lps[n-1]-1]`, … lists **every** border, longest first. Searching a pattern in a text is then the prefix function of `pattern + "#" + text`: an index where the value equals the pattern length is a match end.',
        code: {
          py: `def prefix_function(s):
    lps = [0] * len(s)
    k = 0
    for i in range(1, len(s)):
        while k > 0 and s[i] != s[k]:
            k = lps[k - 1]                #> Fall back to the next shorter border
        if s[i] == s[k]:
            k += 1
        lps[i] = k
    return lps`,
          js: `function prefixFunction(s) {
  const lps = new Array(s.length).fill(0);
  let k = 0;
  for (let i = 1; i < s.length; i++) {
    while (k > 0 && s[i] !== s[k]) k = lps[k - 1];   //> Fall back to the next shorter border
    if (s[i] === s[k]) k++;
    lps[i] = k;
  }
  return lps;
}`,
          java: `class Solution {
    public int[] prefixFunction(String s) {
        int[] lps = new int[s.length()];
        int k = 0;
        for (int i = 1; i < s.length(); i++) {
            while (k > 0 && s.charAt(i) != s.charAt(k)) k = lps[k - 1];   //> Fall back to the next shorter border
            if (s.charAt(i) == s.charAt(k)) k++;
            lps[i] = k;
        }
        return lps;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> prefixFunction(string s) {
        vector<int> lps(s.size(), 0);
        int k = 0;
        for (int i = 1; i < (int)s.size(); i++) {
            while (k > 0 && s[i] != s[k]) k = lps[k - 1];   //> Fall back to the next shorter border
            if (s[i] == s[k]) k++;
            lps[i] = k;
        }
        return lps;
    }
};`
        },
        tests: { fn: { py: 'prefix_function', default: 'prefixFunction' }, sig: { args: ['str'] }, cases: [
          { args: ['aabaaab'], out: [0, 1, 0, 1, 2, 2, 3] }, { args: ['abcabcd'], out: [0, 0, 0, 1, 2, 3, 0] }, { args: ['aaaa'], out: [0, 1, 2, 3] },
          { args: ['abab'], out: [0, 0, 1, 2] }, { args: ['a'], out: [0] }, { args: ['abacabab'], out: [0, 0, 1, 0, 1, 2, 3, 2] }] }
      },
      {
        name: 'The Z-function',
        body: '`z[i]` is the length of the longest common prefix of the string and the suffix starting at `i` (with `z[0]` left as 0). The algorithm keeps a window `[l, r)`, the rightmost stretch known to equal a prefix. For a new `i` inside the window, `z[i]` starts at `min(r - i, z[i - l])` (copied from the mirror position) and is extended letter by letter only past `r`. Because `r` never moves back, the total work is O(n). To search, compute `z` of `pattern + "#" + text` (any separator absent from both): every `i` with `z[i] == len(pattern)` is a match at `i - len(pattern) - 1` in the text. Pick Z when you think “how much of the start matches *here*”; pick the prefix function when you think “what is the border of what I have matched so far”. They hold the same information.',
        code: {
          py: `def z_function(s):
    n = len(s)
    z = [0] * n
    l = r = 0                                     #> [l, r): rightmost block known to equal a prefix
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])           #> Start from the mirror position inside the block
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1                             #> Extend only while the letters keep agreeing
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z`,
          js: `function zFunction(s) {
  const n = s.length, z = new Array(n).fill(0);
  let l = 0, r = 0;                               //> [l, r): rightmost block known to equal a prefix
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);  //> Start from the mirror position inside the block
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;   //> Extend only while the letters keep agreeing
    if (i + z[i] > r) { l = i; r = i + z[i]; }
  }
  return z;
}`,
          java: `class Solution {
    public int[] zFunction(String s) {
        int n = s.length();
        int[] z = new int[n];
        int l = 0, r = 0;                         //> [l, r): rightmost block known to equal a prefix
        for (int i = 1; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);   //> Start from the mirror position inside the block
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;   //> Extend only while the letters keep agreeing
            if (i + z[i] > r) { l = i; r = i + z[i]; }
        }
        return z;
    }
}`,
          cpp: `class Solution {
public:
    vector<int> zFunction(string s) {
        int n = s.size();
        vector<int> z(n, 0);
        int l = 0, r = 0;                         //> [l, r): rightmost block known to equal a prefix
        for (int i = 1; i < n; i++) {
            if (i < r) z[i] = min(r - i, z[i - l]);   //> Start from the mirror position inside the block
            while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;   //> Extend only while the letters keep agreeing
            if (i + z[i] > r) { l = i; r = i + z[i]; }
        }
        return z;
    }
};`
        },
        tests: { fn: { py: 'z_function', default: 'zFunction' }, sig: { args: ['str'] }, cases: [
          { args: ['aabxaab'], out: [0, 1, 0, 0, 3, 1, 0] }, { args: ['aaaa'], out: [0, 3, 2, 1] }, { args: ['abc'], out: [0, 0, 0] },
          { args: ['ababab'], out: [0, 0, 4, 0, 2, 0] }, { args: ['a'], out: [0] }] }
      },
      {
        name: 'Rabin-Karp: the hashing way',
        body: 'Rabin-Karp searches by comparing **fingerprints** instead of letters: hash the pattern, slide a window over the text updating its hash in O(1), and confirm with a letter-by-letter check only when the hashes match. Expected O(n + m), worst case O(n·m) if the hash is weak. It is the right tool when you must compare **many windows at once** (a set of patterns, or “is any window equal to another window”), because hashes go straight into a set; KMP finds one pattern. The full rolling-hash recipe, the base and modulus choice, collisions and the exact-bitmask trick are in [Hashing internals](#/topic/hashing-internals), with a runnable `rabin_karp` there. Rule of thumb: one pattern, guaranteed linear: KMP or Z. Many patterns or windows, or the question is about equality of substrings: hashing.'
      },
      {
        name: 'Periodicity and “is it a repeated block?”',
        body: 'If the string is a block `b` written `t` times (`t ≥ 2`), then the string has a border of length `n - |b|`: drop the first copy and what remains equals what you get by dropping the last copy. Conversely, with the longest border `lps[n-1]`, the shortest candidate block has length `p = n - lps[n-1]`, and it really tiles the string only when `p` divides `n`. So the test is two lines: `p = n - lps[-1]` and `lps[-1] > 0 and n % p == 0`. Examples: `abab` has `lps = [0,0,1,2]`, `p = 2`, 4 % 2 = 0, a repeat of `ab`. `ababa` has `lps[-1] = 3`, `p = 2`, but 5 % 2 ≠ 0, so it is **not** a repetition even though it has a period. The same `p` answers “smallest string whose repetition builds this one”, and `n - lps[n-1]` also tells you how many letters to append to a string to make it periodic. A cute equivalent: `s` is a repetition exactly when it appears in `(s + s)[1:-1]`.'
      },
      {
        name: 'Shortest palindrome by adding letters in front',
        body: 'You can only add to the **front**, so the original string must end up as the tail of the palindrome. The cheapest result keeps the **longest palindromic prefix** of `s` in place and adds the reverse of the rest in front. Finding that prefix is the prefix function in disguise: take `t = s + "#" + reverse(s)`. A border of `t` is a prefix of `s` that equals a suffix of `reverse(s)`, which is a prefix of `s` that equals its own reverse, a palindrome. The longest border is `lps[-1]` of `t`, so the answer is `reverse(s[lps:]) + s`. The separator matters: without it, the border could run across the join and exceed `|s|`. O(n) time and space. (A hashing solution works too; Manacher can find the longest palindromic prefix, with a centre-based scan, also in O(n).)'
      },
      {
        name: 'Manacher: longest palindromic substring in O(n) (stretch)',
        body: 'Expanding around each of the 2n−1 centres is O(n²) in the worst case (`aaaa…`). Manacher’s algorithm reuses what it already knows. First **make odd and even palindromes the same**: put a separator between every letter (`abba` becomes `^#a#b#b#a#$`; the `^` and `$` sentinels stop the expansion without bounds checks). Keep `p[i]`, the palindrome radius around centre `i` in the transformed string, which equals the palindrome’s length in the original. Maintain the palindrome that reaches furthest right, with centre `c` and right edge `r`. For a new `i` inside it, its **mirror** `2c - i` already has a known radius, and the palindrome at `i` is at least `min(r - i, p[mirror])` long, because the stretch inside `[c-(r-c), r]` reads the same backwards. Only expand beyond `r`, and since `r` never moves back, the total expansion is O(n). In an interview, “expand around centres, O(n²)” is the accepted answer; Manacher is the stretch you mention (and can code in py or js when asked) if you finish early.',
        code: {
          py: `def longest_palindrome(s):
    t = '^#' + '#'.join(s) + '#$'                 #> Separators make every palindrome odd-length; ^ and $ stop the expansion
    n = len(t)
    p = [0] * n                                   #> p[i] = palindrome radius at centre i (= its length in s)
    c = r = 0                                     #> The palindrome reaching furthest right: centre c, right edge r
    for i in range(1, n - 1):
        if i < r:
            p[i] = min(r - i, p[2 * c - i])       #> Reuse the mirror position's radius
        while t[i + 1 + p[i]] == t[i - 1 - p[i]]:
            p[i] += 1                             #> Expand only past what the mirror guaranteed
        if i + p[i] > r:
            c, r = i, i + p[i]
    k = max(range(n), key=lambda i: p[i])
    start = (k - p[k]) // 2                       #> Map the centre back to an index in s
    return s[start:start + p[k]]`,
          js: `function longestPalindrome(s) {
  const t = '^#' + s.split('').join('#') + '#$';  //> Separators make every palindrome odd-length; ^ and $ stop the expansion
  const n = t.length, p = new Array(n).fill(0);   //> p[i] = palindrome radius at centre i (= its length in s)
  let c = 0, r = 0;                               //> The palindrome reaching furthest right: centre c, right edge r
  for (let i = 1; i < n - 1; i++) {
    if (i < r) p[i] = Math.min(r - i, p[2 * c - i]);   //> Reuse the mirror position's radius
    while (t[i + 1 + p[i]] === t[i - 1 - p[i]]) p[i]++;   //> Expand only past what the mirror guaranteed
    if (i + p[i] > r) { c = i; r = i + p[i]; }
  }
  let k = 0;
  for (let i = 1; i < n; i++) if (p[i] > p[k]) k = i;
  const start = (k - p[k]) >> 1;                  //> Map the centre back to an index in s
  return s.substr(start, p[k]);
}`
        },
        tests: { fn: { py: 'longest_palindrome', default: 'longestPalindrome' }, cases: [
          { args: ['babad'], out: 'bab' }, { args: ['cbbd'], out: 'bb' }, { args: ['a'], out: 'a' }, { args: ['abc'], out: 'a' },
          { args: ['forgeeksskeegfor'], out: 'geeksskeeg' }, { args: ['aaaa'], out: 'aaaa' }, { args: ['abacdfgdcaba'], out: 'aba' }, { args: [''], out: '' }] }
      },
      {
        name: 'Building strings: immutability and the builder',
        body: 'Strings are **immutable** in Python, JavaScript and Java, so `s += ch` in a loop copies the whole string each time: O(n²) in the worst case (CPython sometimes resizes in place as an optimization, but the guarantee is not there, and other runtimes differ). The fix is the same idea everywhere: collect pieces, join once. **Python**: append to a list and `"".join(parts)`; slicing and `+` create new strings, and a string cannot be changed by index, so convert to a list of characters for in-place work. **JavaScript**: engines use ropes, so `+=` is usually fast, but build with an array and `join("")` when the loop is hot; strings are indexed by UTF-16 code unit, so use the spread operator or `Array.from` for full characters. **Java**: use `StringBuilder` (not thread-safe, fast; `StringBuffer` is its synchronized older sibling), with `append`, `insert`, `reverse`, `setCharAt` and `deleteCharAt`; `toString()` copies once at the end. Note `String.substring` copies (O(k)) since Java 7. **C++**: `std::string` is **mutable**, `+=` and `push_back` append in amortized O(1), so there is no separate builder, but `s = s + t` and `s.insert(0, x)` copy or shift everything. The interview consequence: a solution that builds the answer by repeated concatenation is O(n²) except in C++; a list or builder keeps it O(n), and say so out loud.'
      },
      {
        name: 'When not to use these',
        body: 'For one plain containment test, use the built-in `in`, `indexOf`, `includes` or `find`. For a **set of words** with shared prefixes, a [trie](#/topic/tries) (or Aho-Corasick, the trie plus failure links, which is KMP for many patterns) is the right structure. If you need all substrings or suffix queries (longest repeated substring, count distinct substrings), suffix arrays and automata exist but are beyond interview scope. When the strings are compared on edit operations rather than exact matching, that is [string DP](#/topic/string-dp).'
      }
    ],

    worked: [
      {
        lc: 28,
        restate: 'Given a text (`haystack`) and a non-empty pattern (`needle`), return the index where the pattern first occurs in the text, or -1 if it does not occur. Both are lowercase letters, up to 10⁴ long.',
        examples: '- `"sadbutsad"` and `"sad"` → `0` (it also occurs at 6, but the first one counts).\n- `"leetcode"` and `"leeto"` → `-1`.\n- `"aaaaab"` and `"aab"` → `3`.\n- Edge cases: a pattern longer than the text, a pattern equal to the text, and repeated letters that make a naive search backtrack.',
        brute: 'Try every start and compare letter by letter: O(n·m). With these limits it passes, and in a real codebase `text.find(pat)` is the answer. The follow-up is always “can you do it without ever re-reading the text?”.',
        insight: 'A mismatch after `j` matched letters does not mean the next attempt starts from scratch: the matched letters were the pattern’s own first `j`, so what is still useful is the longest prefix of the pattern that is also a suffix of those `j` letters, which is `lps[j-1]`. Precompute `lps` from the pattern alone, then scan the text with a matched-count `j`: equal letters raise `j`, a mismatch sets `j = lps[j-1]` and re-compares **the same text letter**, and `j == m` means the pattern ends here. The text index never goes back.',
        code: {
          py: `class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        m = len(needle)
        lps = [0] * m
        k = 0
        for i in range(1, m):                 # failure table of the pattern
            while k > 0 and needle[i] != needle[k]:
                k = lps[k - 1]
            if needle[i] == needle[k]:
                k += 1
            lps[i] = k
        j = 0
        for i, ch in enumerate(haystack):     # scan the text, never moving i backwards
            while j > 0 and ch != needle[j]:
                j = lps[j - 1]
            if ch == needle[j]:
                j += 1
            if j == m:
                return i - m + 1
        return -1`,
          js: `function strStr(haystack, needle) {
  const m = needle.length, lps = new Array(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {               // failure table of the pattern
    while (k > 0 && needle[i] !== needle[k]) k = lps[k - 1];
    if (needle[i] === needle[k]) k++;
    lps[i] = k;
  }
  let j = 0;
  for (let i = 0; i < haystack.length; i++) { // scan the text, never moving i backwards
    while (j > 0 && haystack[i] !== needle[j]) j = lps[j - 1];
    if (haystack[i] === needle[j]) j++;
    if (j === m) return i - m + 1;
  }
  return -1;
}`,
          java: `class Solution {
    public int strStr(String haystack, String needle) {
        int m = needle.length();
        int[] lps = new int[m];
        int k = 0;
        for (int i = 1; i < m; i++) {                 // failure table of the pattern
            while (k > 0 && needle.charAt(i) != needle.charAt(k)) k = lps[k - 1];
            if (needle.charAt(i) == needle.charAt(k)) k++;
            lps[i] = k;
        }
        int j = 0;
        for (int i = 0; i < haystack.length(); i++) { // scan the text, never moving i backwards
            while (j > 0 && haystack.charAt(i) != needle.charAt(j)) j = lps[j - 1];
            if (haystack.charAt(i) == needle.charAt(j)) j++;
            if (j == m) return i - m + 1;
        }
        return -1;
    }
}`,
          cpp: `class Solution {
public:
    int strStr(string haystack, string needle) {
        int m = needle.size();
        vector<int> lps(m, 0);
        int k = 0;
        for (int i = 1; i < m; i++) {                 // failure table of the pattern
            while (k > 0 && needle[i] != needle[k]) k = lps[k - 1];
            if (needle[i] == needle[k]) k++;
            lps[i] = k;
        }
        int j = 0;
        for (int i = 0; i < (int)haystack.size(); i++) {   // scan the text, never moving i backwards
            while (j > 0 && haystack[i] != needle[j]) j = lps[j - 1];
            if (haystack[i] == needle[j]) j++;
            if (j == m) return i - m + 1;
        }
        return -1;
    }
};`
        },
        complexity: 'O(n + m) time: the pattern table and the text scan each move their index forward and fall back at most as far as they have climbed. O(m) space for the table.',
        say: '“The simple answer is O(n·m): try every start. To avoid re-reading text I precompute, for each prefix of the pattern, the longest proper prefix that is also a suffix: that is how much of the match survives a mismatch. Then I scan the text once with a counter `j` of matched letters: on a mismatch I set `j = lps[j-1]` and compare the same text letter again, and when `j` equals the pattern length I report the start. The text index never moves back, and `j` can only fall as far as it has risen, so it is O(n + m) with O(m) space. In production I would call the library’s `find`.”',
        followups: [
          { q: 'Why does the mismatch loop re-compare the same text letter?', a: 'After falling back to `lps[j-1]` the pattern letter at the new `j` may match the current text letter, or may need to fall back further. Only when `j` reaches 0 and still mismatches do we give up on this letter and move on.' },
          { q: 'How would you return every occurrence?', a: 'When `j == m`, record `i - m + 1` and set `j = lps[m - 1]` instead of returning, so overlapping matches (`aa` in `aaaa`) are found too.' },
          { q: 'Can you do this with the Z-function?', a: 'Yes. Build `z` for `pattern + "#" + text`; every position whose value equals the pattern length is a match. Same O(n + m), and the separator stops matches from running across the join.' },
          { q: 'When would you prefer Rabin-Karp?', a: 'When searching for many patterns or comparing many windows, since fingerprints go straight into a set. See Hashing internals.' }
        ]
      },
      {
        lc: 459,
        restate: 'Decide whether a non-empty string is made of one shorter block repeated two or more times with nothing left over. Lowercase letters only, length up to 10⁴.',
        examples: '- `"abab"` → `true` (block `"ab"`).\n- `"aba"` → `false`.\n- `"abcabcabc"` → `true`.\n- Edge cases: a single letter (a block must be shorter than the string, so `false`), `"aaaa"` (block `"a"`), and `"ababa"` (periodic but not a whole repetition).',
        brute: 'For each block length `p` that divides `n`, compare the string with its first `p` letters repeated `n / p` times: O(n · d(n)), where d(n) is the number of divisors. It works, but the prefix function gives the one candidate directly.',
        insight: 'If the string is a block of length `p` repeated, then removing the first block leaves the same text as removing the last block, so the string has a **border** of length `n - p`. In reverse: the longest border is `lps[n-1]`, so the shortest possible block has length `p = n - lps[n-1]`, and the string is a whole-number repetition exactly when `lps[n-1] > 0` and `p` divides `n`. One prefix-function pass decides it.',
        code: {
          py: `class Solution:
    def repeatedSubstringPattern(self, s: str) -> bool:
        n = len(s)
        lps = [0] * n
        k = 0
        for i in range(1, n):
            while k > 0 and s[i] != s[k]:
                k = lps[k - 1]
            if s[i] == s[k]:
                k += 1
            lps[i] = k
        period = n - lps[-1]
        return lps[-1] > 0 and n % period == 0   # a border exists and the block tiles the string`,
          js: `function repeatedSubstringPattern(s) {
  const n = s.length, lps = new Array(n).fill(0);
  let k = 0;
  for (let i = 1; i < n; i++) {
    while (k > 0 && s[i] !== s[k]) k = lps[k - 1];
    if (s[i] === s[k]) k++;
    lps[i] = k;
  }
  const period = n - lps[n - 1];
  return lps[n - 1] > 0 && n % period === 0;   // a border exists and the block tiles the string
}`,
          java: `class Solution {
    public boolean repeatedSubstringPattern(String s) {
        int n = s.length();
        int[] lps = new int[n];
        int k = 0;
        for (int i = 1; i < n; i++) {
            while (k > 0 && s.charAt(i) != s.charAt(k)) k = lps[k - 1];
            if (s.charAt(i) == s.charAt(k)) k++;
            lps[i] = k;
        }
        int period = n - lps[n - 1];
        return lps[n - 1] > 0 && n % period == 0;   // a border exists and the block tiles the string
    }
}`,
          cpp: `class Solution {
public:
    bool repeatedSubstringPattern(string s) {
        int n = s.size();
        vector<int> lps(n, 0);
        int k = 0;
        for (int i = 1; i < n; i++) {
            while (k > 0 && s[i] != s[k]) k = lps[k - 1];
            if (s[i] == s[k]) k++;
            lps[i] = k;
        }
        int period = n - lps[n - 1];
        return lps[n - 1] > 0 && n % period == 0;   // a border exists and the block tiles the string
    }
};`
        },
        complexity: 'O(n) time and O(n) space for the table.',
        say: '“If the string is a block repeated, dropping the first block or the last block gives the same text, so the string has a border of length n minus the block length. So I compute the prefix function; the longest border is the last value. The shortest block that could work has length n minus that value, and it works exactly when it divides n and the border is non-zero. `ababa` has a border of 3 and period 2, but 2 does not divide 5, so it is correctly rejected. O(n).”',
        followups: [
          { q: 'Why check `n % period == 0`?', a: 'A period is not a repetition. `ababa` repeats every 2 letters but ends mid-block, so the block does not tile the string. Only a period that divides `n` does.' },
          { q: 'What is the shorter alternative?', a: 'Check whether `s` appears inside `(s + s)[1:-1]`. If it does, it is a repetition. Elegant, and O(n) with a linear-time search, but harder to justify on the spot than the border argument.' },
          { q: 'How do you return the block itself?', a: 'It is `s[:period]` when the test passes.' }
        ]
      },
      {
        lc: 214,
        restate: 'You may only add letters to the **front** of a string. Return the shortest palindrome you can make this way. The string has up to 5·10⁴ lowercase letters.',
        examples: '- `"aacecaaa"` → `"aaacecaaa"`.\n- `"abcd"` → `"dcbabcd"`.\n- `""` → `""`.\n- Edge cases: a string that is already a palindrome (add nothing), one letter, and no palindromic prefix longer than the first letter.',
        brute: 'Try prefixes from the longest down, checking each for being a palindrome: O(n²). Too slow for 5·10⁴ letters in the worst case (for instance `aaaa…ab`).',
        insight: 'The original string will be the tail of the answer, so the cheapest answer keeps the **longest palindromic prefix** in place and prepends the reverse of what is left. To find that prefix in O(n), build `t = s + "#" + reverse(s)` and take the prefix function. A border of `t` is a prefix of `s` equal to a suffix of `reverse(s)`; reversing both sides shows that prefix equals its own reverse, so it is a palindrome. The last value `lps[-1]` is the longest such prefix. The `#` stops a border from running across the join. Answer: `reverse(s[k:]) + s` with `k = lps[-1]`.',
        code: {
          py: `class Solution:
    def shortestPalindrome(self, s: str) -> str:
        t = s + '#' + s[::-1]
        lps = [0] * len(t)
        k = 0
        for i in range(1, len(t)):
            while k > 0 and t[i] != t[k]:
                k = lps[k - 1]
            if t[i] == t[k]:
                k += 1
            lps[i] = k
        longest = lps[-1]                  # length of the longest palindromic prefix of s
        return s[longest:][::-1] + s`,
          js: `function shortestPalindrome(s) {
  const t = s + '#' + s.split('').reverse().join('');
  const lps = new Array(t.length).fill(0);
  let k = 0;
  for (let i = 1; i < t.length; i++) {
    while (k > 0 && t[i] !== t[k]) k = lps[k - 1];
    if (t[i] === t[k]) k++;
    lps[i] = k;
  }
  const longest = lps[t.length - 1];       // length of the longest palindromic prefix of s
  return s.slice(longest).split('').reverse().join('') + s;
}`,
          java: `class Solution {
    public String shortestPalindrome(String s) {
        String t = s + "#" + new StringBuilder(s).reverse();
        int[] lps = new int[t.length()];
        int k = 0;
        for (int i = 1; i < t.length(); i++) {
            while (k > 0 && t.charAt(i) != t.charAt(k)) k = lps[k - 1];
            if (t.charAt(i) == t.charAt(k)) k++;
            lps[i] = k;
        }
        int longest = lps[t.length() - 1];   // length of the longest palindromic prefix of s
        return new StringBuilder(s.substring(longest)).reverse().toString() + s;
    }
}`,
          cpp: `class Solution {
public:
    string shortestPalindrome(string s) {
        string rev(s.rbegin(), s.rend());
        string t = s + "#" + rev;
        vector<int> lps(t.size(), 0);
        int k = 0;
        for (int i = 1; i < (int)t.size(); i++) {
            while (k > 0 && t[i] != t[k]) k = lps[k - 1];
            if (t[i] == t[k]) k++;
            lps[i] = k;
        }
        int longest = lps.back();            // length of the longest palindromic prefix of s
        string front(s.rbegin(), s.rend() - longest);
        return front + s;
    }
};`
        },
        complexity: 'O(n) time and space: the table over a string of length 2n + 1.',
        say: '“Only the front can change, so the original string is the tail of the answer, and I want to keep the longest palindromic prefix and add the reverse of the rest in front. To find that prefix fast I take the prefix function of `s + "#" + reverse(s)`: a border there is a prefix of s that equals a suffix of the reversed s, which means it reads the same both ways. The last value is its length, and the separator keeps the border from crossing the join. The answer is the reversed remainder plus s. Linear time and space, versus O(n²) for checking each prefix.”',
        followups: [
          { q: 'Why is the separator needed?', a: 'Without it, a border could extend past the end of `s` into the reversed copy and report a length larger than `|s|`. With `#` the border stops at `s`’s end, since `#` matches nothing in the letters.' },
          { q: 'What if you could add letters at either end?', a: 'Then you want the longest palindromic substring that touches an end, and two passes, one on `s` and one on its reverse, with the better result. A different problem.' },
          { q: 'Is there another O(n) way?', a: 'Yes: Manacher’s radii give the longest palindromic prefix (the largest centre whose palindrome reaches index 0), or a rolling hash compares each prefix with its reverse in O(1).' }
        ]
      },
      {
        lc: 1392,
        restate: 'Return the longest non-empty prefix of a string that is also a suffix of it, where the prefix may not be the whole string. If no such piece exists, return an empty string. Lowercase letters, up to 10⁵ long.',
        examples: '- `"level"` → `"l"`.\n- `"ababab"` → `"abab"` (prefix and suffix overlap, which is allowed).\n- `"abc"` → `""`.\n- Edge cases: a single letter, an all-same string (`"aaaa"` → `"aaa"`), and overlapping borders.',
        brute: 'For each length from `n - 1` down to 1, compare the prefix and suffix: O(n²), too slow at 10⁵ letters.',
        insight: 'This is the definition of the prefix function, so the answer is its **last value**: `s[:lps[n-1]]`. There is nothing else to design. (A hashing version also works: grow the prefix and suffix hashes one letter at a time and remember the longest length where they match.)',
        code: {
          py: `class Solution:
    def longestPrefix(self, s: str) -> str:
        n = len(s)
        lps = [0] * n
        k = 0
        for i in range(1, n):
            while k > 0 and s[i] != s[k]:
                k = lps[k - 1]
            if s[i] == s[k]:
                k += 1
            lps[i] = k
        return s[:lps[-1]]                 # the longest border of the whole string`,
          js: `function longestPrefix(s) {
  const n = s.length, lps = new Array(n).fill(0);
  let k = 0;
  for (let i = 1; i < n; i++) {
    while (k > 0 && s[i] !== s[k]) k = lps[k - 1];
    if (s[i] === s[k]) k++;
    lps[i] = k;
  }
  return s.slice(0, lps[n - 1]);           // the longest border of the whole string
}`,
          java: `class Solution {
    public String longestPrefix(String s) {
        int n = s.length();
        int[] lps = new int[n];
        int k = 0;
        for (int i = 1; i < n; i++) {
            while (k > 0 && s.charAt(i) != s.charAt(k)) k = lps[k - 1];
            if (s.charAt(i) == s.charAt(k)) k++;
            lps[i] = k;
        }
        return s.substring(0, lps[n - 1]);   // the longest border of the whole string
    }
}`,
          cpp: `class Solution {
public:
    string longestPrefix(string s) {
        int n = s.size();
        vector<int> lps(n, 0);
        int k = 0;
        for (int i = 1; i < n; i++) {
            while (k > 0 && s[i] != s[k]) k = lps[k - 1];
            if (s[i] == s[k]) k++;
            lps[i] = k;
        }
        return s.substr(0, lps[n - 1]);      // the longest border of the whole string
    }
};`
        },
        complexity: 'O(n) time, O(n) space for the table.',
        say: '“A prefix that is also a suffix is a border, and the longest proper border of the whole string is exactly the last entry of the prefix function. So I build the table in O(n) and return the first `lps[n-1]` letters. Overlap is fine because the table allows a border to overlap itself, as in `ababab` giving `abab`.”',
        followups: [
          { q: 'Do prefix and suffix have to be disjoint?', a: 'Not here. `ababab` gives `abab`, which overlaps itself. If they had to be disjoint, cap the answer at `n // 2` by following the border chain `lps[lps[n-1]-1]`, … until the length fits.' },
          { q: 'How do you list all borders?', a: 'Start at `k = lps[n-1]` and repeat `k = lps[k-1]` while `k > 0`; every value visited is a border length, longest first.' },
          { q: 'Why not compare hashes?', a: 'You can (running prefix and suffix hashes), but the prefix function is exact and just as short, so there is no collision risk to discuss.' }
        ]
      }
    ],

    practice: [
      { lc: 28,
        hints: ['Trying every start is O(n·m). The slow part is re-reading text letters after a mismatch: what do you already know about those letters?', 'The matched letters are the pattern’s own first `j` letters. If the next one fails, only the longest prefix of the pattern that is also a suffix of those `j` letters is still useful.', 'Precompute that length for each prefix (the prefix function), then scan the text once: on a mismatch set `j = lps[j-1]` and re-compare the same text letter.'],
        starter: { py: 'class Solution:\n    def strStr(self, haystack: str, needle: str) -> int:\n        ', js: 'function strStr(haystack, needle) {\n  \n}' },
        tests: { fn: 'strStr', sig: { args: ['str', 'str'] }, cases: [
          { args: ['sadbutsad', 'sad'], out: 0 }, { args: ['leetcode', 'leeto'], out: -1 }, { args: ['aaaaab', 'aab'], out: 3 },
          { args: ['a', 'a'], out: 0 }, { args: ['abc', 'c'], out: 2 }, { args: ['mississippi', 'issip'], out: 4 }, { args: ['aabaabaaab', 'aabaaab'], out: 3 }] } },

      { lc: 459,
        hints: ['If the string is a block repeated, then deleting the first block or the last block leaves the same text. What does that say about prefixes and suffixes?', 'It has a prefix that equals a suffix (a border) of length `n - blockLength`. So the longest border tells you the shortest possible block.', 'With `lps` the prefix function, the block length is `p = n - lps[n-1]`. It works when `lps[n-1] > 0` and `p` divides `n`.'],
        starter: { py: 'class Solution:\n    def repeatedSubstringPattern(self, s: str) -> bool:\n        ', js: 'function repeatedSubstringPattern(s) {\n  \n}' },
        tests: { fn: 'repeatedSubstringPattern', sig: { args: ['str'] }, cases: [
          { args: ['abab'], out: true }, { args: ['aba'], out: false }, { args: ['abcabcabc'], out: true }, { args: ['a'], out: false },
          { args: ['aaaa'], out: true }, { args: ['ababa'], out: false }, { args: ['abaababaab'], out: true }, { args: ['abac'], out: false }] } },

      { lc: 214,
        hints: ['The original string stays as the tail of the result. So which part of it can you keep, and which part must you copy in front?', 'Keep its longest palindromic prefix, and put the reverse of the remaining letters in front.', 'Find that prefix in O(n): take the prefix function of `s + "#" + reverse(s)`. Its last value is the length of the longest palindromic prefix.'],
        starter: { py: 'class Solution:\n    def shortestPalindrome(self, s: str) -> str:\n        ', js: 'function shortestPalindrome(s) {\n  \n}' },
        tests: { fn: 'shortestPalindrome', sig: { args: ['str'] }, cases: [
          { args: ['aacecaaa'], out: 'aaacecaaa' }, { args: ['abcd'], out: 'dcbabcd' }, { args: [''], out: '' }, { args: ['a'], out: 'a' },
          { args: ['aba'], out: 'aba' }, { args: ['aaaab'], out: 'baaaab' }, { args: ['ab'], out: 'bab' }] } },

      { lc: 1392,
        hints: ['A prefix that is also a suffix is called a border. You want the longest one that is not the whole string.', 'You do not need a search: there is a table that stores, for every prefix of the string, the length of its longest border.', 'That table is the prefix function, and the answer is `s[:lps[n-1]]`.'],
        starter: { py: 'class Solution:\n    def longestPrefix(self, s: str) -> str:\n        ', js: 'function longestPrefix(s) {\n  \n}' },
        tests: { fn: 'longestPrefix', sig: { args: ['str'] }, cases: [
          { args: ['level'], out: 'l' }, { args: ['ababab'], out: 'abab' }, { args: ['abc'], out: '' }, { args: ['a'], out: '' },
          { args: ['aaaa'], out: 'aaa' }, { args: ['acbacb'], out: 'acb' }, { args: ['abcabcabc'], out: 'abcabc' }] } }
    ],

    mistakes: [
      '**Restarting `j` at 0 on a mismatch.** That is the naive algorithm in disguise and brings back O(n·m). Set `j = lps[j - 1]` and compare the **same** text letter again.',
      '**Using `if` instead of `while` for the fall-back.** One fall-back may not be enough: `lps[j-1]` can itself mismatch. The mismatch handling is a loop until `j == 0` or the letters agree.',
      '**Falling back to `lps[j]` instead of `lps[j - 1]`.** The table index is the last *matched* letter, `j - 1`. Off by one here gives wrong answers on exactly the repetitive inputs KMP exists for.',
      '**Forgetting that `lps[i]` excludes the whole prefix.** The border must be proper. That is why the loop starts at `i = 1` and `k` begins at 0, never matching the string with itself.',
      '**No separator when concatenating.** In `s + reverse(s)` or `pattern + text`, a border or Z-value can run across the join and give a length longer than `|s|` or a false match. Insert a character that appears in neither.',
      '**Treating a period as a repetition.** `ababa` has period 2 but is not a repeated block, because 2 does not divide 5. Check `n % (n - lps[n-1]) == 0` and `lps[n-1] > 0`.',
      '**An empty or one-letter pattern.** The table loop starts at 1, so `m = 1` is fine, but `m = 0` makes `pat[j]` read past the end. Handle an empty pattern up front (the usual answer is index 0).',
      '**Returning on `j == m` when you need every match.** Record the hit and set `j = lps[m - 1]` to keep scanning, so overlapping matches count.',
      '**Concatenating in a loop.** `s += ch` is O(n) per step in Python, JavaScript and Java strings, so building a result letter by letter is O(n²). Collect pieces and join, or use a `StringBuilder`.',
      '**Reaching for KMP when `in` / `find` would do.** A plain containment test does not need it. Use the algorithm when the question needs borders, periods or a guaranteed bound.',
      '**Manacher without sentinels.** Forgetting the separators between letters or the `^` and `$` ends makes the expansion loop run off the array or miss even-length palindromes.',
      '**Z-function off by one.** `z[0]` is conventionally 0 (or n); the loop starts at `i = 1`, the extension compares `s[z[i]]` with `s[i + z[i]]`, and `i + z[i]` must stay below `n`.'
    ],

    quiz: [
      { kind: 'concept', q: 'For the pattern `"aabaaab"`, what is `lps[4]` (the value for the prefix `"aabaa"`)?',
        choices: ['2', '1', '3', '0'], answer: 0,
        explain: 'The prefix `aabaa` has the border `aa` (its first two letters equal its last two). A border of length 3 would need `aab` to equal `aaa`, which it does not. So `lps[4] = 2`.' },
      { kind: 'concept', q: 'During KMP search, `j` letters are matched and the next text letter mismatches. What happens?',
        choices: ['`j` becomes `lps[j - 1]` and the same text letter is compared again', 'The text index moves back by `j - 1` and `j` resets to 0', '`j` resets to 0 and the text index moves forward', 'The search stops with no match'], answer: 0,
        explain: 'The matched letters are the pattern’s first `j`, so only their longest border is still useful. Jump `j` to it; the text index never moves back.' },
      { kind: 'complexity', q: 'KMP has a `while` loop inside a `for` loop. What is its time complexity for a text of length n and a pattern of length m?',
        choices: ['O(n + m)', 'O(n · m)', 'O(n log m)', 'O(n²)'], answer: 0,
        explain: 'Amortized: `j` rises by at most one per text letter, and every fall-back lowers it, so the total number of fall-backs is at most n. The table build is O(m) the same way.' },
      { kind: 'complexity', q: 'Which input makes the naive search take Θ(n·m)?',
        choices: ['Text `aaaa…a` and pattern `aaa…ab`', 'Text `abcdefgh` and pattern `abc`', 'Text with all distinct letters', 'A pattern longer than the text'], answer: 0,
        explain: 'Each start matches almost the whole pattern before the last letter fails, then the next start re-reads nearly the same letters. All distinct letters fail at the first compare.' },
      { kind: 'concept', q: 'Which statement is true about the string `s` and `p = n - lps[n-1]`?',
        choices: ['`s` is a whole repetition of a block exactly when `lps[n-1] > 0` and `p` divides `n`', '`s` is always a repetition of its first `p` letters', '`s` is a palindrome when `p` divides `n`', '`p` is the length of the longest palindromic prefix'], answer: 0,
        explain: '`p` is the shortest period. A period is only a tiling when it divides `n`: `ababa` has period 2 but is not a repetition. A zero border means no repeat at all.' },
      { kind: 'bug', q: 'This search finds matches on easy inputs but is slow on `aaaa…a` against `aaa…ab`. What is the bug?',
        code: `j = 0
for i in range(len(text)):
    if text[i] == pat[j]:
        j += 1
    else:
        i -= j            # restart one past the old start
        j = 0
    if j == m:
        return i - m + 1`,
        choices: ['It restarts after every mismatch instead of jumping with `lps[j-1]`, so it is the naive O(n·m) search', 'It should use `while` instead of `for`', 'It should compare `pat[j+1]`', 'It forgot to sort the pattern'], answer: 0,
        explain: 'Moving the text index back and zeroing `j` throws away everything the failure table knows. Replace the restart with `j = lps[j - 1]` in a loop and keep `i` moving forward. (Python also ignores the `i -= j` inside a `for`, which is another sign that the logic is off.)' },
      { kind: 'concept', q: 'To find the shortest palindrome by adding letters only in front of `s`, which quantity do you compute?',
        choices: ['The length of the longest palindromic prefix of `s`', 'The length of the longest palindromic substring of `s`', 'The number of distinct letters in `s`', 'The longest common subsequence of `s` and its reverse'], answer: 0,
        explain: 'The string stays as the tail, so the best you can do is keep its longest palindromic prefix and prepend the reverse of the rest. The prefix function of `s + "#" + reverse(s)` gives that length.' },
      { kind: 'pattern', q: 'Which problem is best attacked with the prefix function or the Z-function?',
        choices: ['Check whether a string is one block written several times', 'Find the k-th largest element', 'Count islands in a grid', 'Find the minimum window containing all letters of a set'], answer: 0,
        explain: 'Periodicity and borders are exactly what the prefix function stores. The others are a heap or quickselect, a graph search and a sliding window.' },
      { kind: 'concept', q: 'Why does Manacher’s algorithm insert a separator between all letters?',
        choices: ['So odd and even palindromes both have a single centre and can be handled by one loop', 'To make the string longer so it is harder to hash', 'To sort the letters', 'To avoid using a mirror position'], answer: 0,
        explain: '`abba` has no centre letter but `a#b#b#a` does: the middle `#`. After the transform every palindrome is odd-length, so one radius array covers both kinds.' },
      { kind: 'concept', q: 'Which statements about building strings are correct? Pick every one that applies.',
        choices: ['Repeated `s += ch` in Java copies the string each time, so it is O(n²) overall; use `StringBuilder`', 'In Python, collecting pieces in a list and calling `"".join` is the standard linear way', 'C++ `std::string` is mutable, and `push_back` is amortized O(1)', 'Python strings can be modified in place by index'], answer: [0, 1, 2],
        explain: 'Python, JavaScript and Java strings are immutable, so each concatenation can copy; the fix is a list-and-join or a builder. C++ strings are mutable and grow like vectors. Python raises an error if you assign to `s[i]`.' }
    ],

    flashcards: [
      { id: 'lps-def', front: 'What is `lps[i]` (the prefix function) of a string?', back: 'The length of the longest **proper** prefix of `s[0..i]` that is also a suffix of it. For `aabaaab`: `[0,1,0,1,2,2,3]`.' },
      { id: 'kmp-idea', front: 'What is the one idea of KMP?', back: 'Never re-read a text letter. After matching `j` letters and failing, set `j = lps[j-1]` (the longest border of what matched) and compare the same letter again.' },
      { id: 'kmp-complexity', front: 'Why is KMP O(n + m) despite the inner `while`?', back: 'Amortized: `j` rises by at most 1 per text letter and each fall-back lowers it, so total fall-backs are at most n. The table build is the same argument over the pattern.' },
      { id: 'lps-build', front: 'How is the table built?', back: 'Run KMP on the pattern against itself: `k` = current border. While `k > 0` and `s[i] != s[k]`, `k = lps[k-1]`. If `s[i] == s[k]`, `k++`. Then `lps[i] = k`.' },
      { id: 'z-def', front: 'What is `z[i]`, and how do you search with it?', back: 'The length of the longest common prefix of `s` and `s[i:]`. Compute `z` of `pattern + "#" + text`; positions with `z == len(pattern)` are matches.' },
      { id: 'z-window', front: 'What makes the Z-algorithm linear?', back: 'It keeps a window `[l, r)` equal to a prefix. Inside it, `z[i]` starts at `min(r-i, z[i-l])`; letters are compared only past `r`, and `r` never moves back.' },
      { id: 'period', front: 'How do you test “is s a repeated block?” with the prefix function?', back: 'Let `p = n - lps[n-1]`. It is a repetition iff `lps[n-1] > 0` and `n % p == 0`. Equivalent: `s` occurs in `(s+s)[1:-1]`.' },
      { id: 'borders', front: 'How do you list all borders of a string?', back: 'Start at `k = lps[n-1]`; repeat `k = lps[k-1]` while `k > 0`. Every value visited is a border length, longest first.' },
      { id: 'shortest-pal', front: 'Shortest palindrome by prepending: the trick?', back: 'The longest palindromic prefix is `lps[-1]` of `s + "#" + reverse(s)`. Answer: `reverse(s[k:]) + s`. The separator stops a border crossing the join.' },
      { id: 'rabin-karp-ptr', front: 'When prefer Rabin-Karp over KMP?', back: 'Many patterns or many windows compared at once (fingerprints go into a set), or substring-equality questions. One pattern with a hard linear guarantee: KMP or Z.' },
      { id: 'manacher', front: 'What does Manacher’s algorithm reuse?', back: 'Insert separators so palindromes are odd; keep the palindrome reaching furthest right (centre c, edge r). For i inside it, start at `min(r-i, p[2c-i])` (the mirror) and expand only past r. O(n).' },
      { id: 'string-builder', front: 'Why is `s += ch` in a loop a performance bug?', back: 'Strings are immutable in Python, JavaScript and Java: each concat can copy, giving O(n²). Use a list and `join`, or `StringBuilder`. C++ `std::string` is mutable, so `+=` is amortized O(1).' }
    ],

    deeper: [
      { title: 'Prefix function and the KMP algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/string/prefix-function.html', time: 'about 25 min', note: 'The definition, the O(n) build with the amortized proof, and the applications (counting occurrences, periods, compression). The single best page for this topic.' },
      { title: 'Z-function and its calculation (cp-algorithms)', url: 'https://cp-algorithms.com/string/z-function.html', time: 'about 15 min', note: 'The window algorithm with its proof, the search by concatenation, and how to convert between Z and the prefix function.' },
      { title: 'Knuth-Morris-Pratt algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm', time: 'about 15 min', note: 'Worked example of the failure table and the search, with the history and the complexity argument.' },
      { title: 'Manacher’s algorithm (cp-algorithms)', url: 'https://cp-algorithms.com/string/manacher.html', time: 'about 15 min', note: 'The stretch topic: radii arrays for odd and even palindromes and why the mirror trick is linear.' },
      { title: 'Python string concatenation performance (Python docs: FAQ)', url: 'https://docs.python.org/3/faq/programming.html#what-is-the-most-efficient-way-to-concatenate-many-strings-together', time: 'about 5 min', note: 'The official answer on why to join a list instead of repeated `+=`.' }
    ],

    detective: [
      { id: 'strip-twins', decoys: ['hashing-internals', 'sliding-window', 'two-pointers'],
        statement: 'A label factory prints long strips of letters, and the quality team wants to know, for each strip, whether the whole strip is just one shorter piece printed several times in a row with nothing left over at the end. Strips run to tens of thousands of letters and there are millions of them, so cutting every possible piece length and comparing is too slow. A senior engineer notes that if the strip really is a repeated piece, then trimming one copy off the front leaves exactly what trimming one copy off the back would.',
        why: 'The remark about trimming the front or the back leaving the same text says the string has a prefix equal to a suffix (a border) of length n minus the piece length. One table of “longest prefix that is also a suffix” per position gives the shortest candidate piece in a single pass, and a divisibility check confirms it.' },
      { id: 'never-reread', decoys: ['hashing-internals', 'tries', 'sliding-window'],
        statement: 'A forensics tool scans a log with fifty million characters for a signature of up to forty characters. The logs are nasty: long runs of the same character, and signatures like twenty letters of one kind followed by a different one. The current tool, after each failed attempt, steps back to the second character of the attempt and starts comparing again, so it re-reads characters it just matched, and it crawls. The team needs one forward pass in which the log position never moves backwards, using only the signature itself to decide how much of the last attempt is still useful.',
        why: 'The tool must keep a pointer that never moves back, and use knowledge of the pattern alone (precomputed before touching the log) to decide how much of a failed attempt survives. That is the failure table of the longest prefix that is also a suffix, with a jump on mismatch, giving a guaranteed linear scan.' },
      { id: 'door-sign', decoys: ['string-dp', 'two-pointers', 'hashing-internals'],
        statement: 'A sign painter is hired to turn any word into a mirror-symmetric one. The only thing the painter is allowed to do is paint extra letters to the left of the word; nothing may be erased, changed or added on the right. She wants the fewest new letters, and the words can have fifty thousand letters, so checking every possible left chunk one by one is too slow. Her apprentice says the answer depends only on how long a stretch at the very start of the word already reads the same forwards and backwards.',
        why: 'The apprentice’s remark reduces the task to finding the longest symmetric prefix. Gluing the word to its own reverse with a separator and computing the table of “longest prefix that is also a suffix” gives that length in one linear pass; the new letters are the reversed remainder.' }
    ]
  });
})();
