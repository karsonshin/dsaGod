/* Offer Ready: String DP lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'string-dp',

    hook: 'Two strings, one table. Longest common subsequence, edit distance, interleaving, distinct subsequences and regex matching are all the same move: let `dp[i][j]` answer the question for the first `i` letters of one string and the first `j` of the other, and fill it from three neighbours. Palindrome questions are the odd cousin: they have a table solution, but a short expand-from-the-middle loop beats it. Seven of these sit on the NeetCode 150, and the hard ones (115 and 10) are where interviewers separate people who memorized from people who can derive.',

    cues: [
      'You are given **two strings** and asked for the best, shortest, or number of ways to relate one to the other (match, transform, merge, embed).',
      'The words **subsequence** (letters kept in order, gaps allowed) or **edit** (insert, delete, replace) appear. Subsequence is not substring.',
      'The answer for the full strings clearly depends on the answer for **slightly shorter prefixes**, the same question with one fewer letter.',
      'A **count** of ways is wanted, so you add up choices rather than pick the best. Same table, different combine step.',
      'A pattern with **wildcards** (`.`, `*`, `?`) must match a whole text. Each pattern symbol decides what the text can do next.',
      'The trap: **one** string and a question about its palindromes is often best done by **expanding around centers**, with no table. Reach for the table when two strings are involved.'
    ],

    intuition: [
      'Imagine two people reading the same two sentences from the left, each with a finger. At every step, either the letters under the fingers agree, or they do not. If they agree, you can use both letters and move both fingers. If they do not, at least one finger has to move without its letter being used. That is the whole idea, and the table is a memo of every finger position, so you never redo a position.',
      '`dp[i][j]` means: **the answer when the first string is cut to its first `i` letters and the second to its first `j`**. Row 0 and column 0 are the empty prefix, so the table is `(m + 1) × (n + 1)`, and the answer is the bottom-right cell. Say that sentence out loud before you write a loop; most wrong solutions come from a vague meaning for `dp[i][j]`.',
      'Each cell looks at the **same three neighbours**: diagonal `dp[i-1][j-1]` (both letters consumed), up `dp[i-1][j]` (first string loses a letter), left `dp[i][j-1]` (second loses a letter). What changes between problems is only the combine rule:',
      '1. **Longest common subsequence:** match gives diagonal + 1, otherwise the max of up and left.\n2. **Edit distance:** match copies the diagonal, otherwise 1 + the min of the three (replace, delete, insert).\n3. **Distinct subsequences (counting):** add the diagonal when letters match (use this letter) and always add up (skip it).\n4. **Interleaving:** a boolean cell, true if the next letter of the target comes from either string and the shorter state was true.\n5. **Regex:** the pattern letter decides which neighbour you need, and `*` can look two columns back.',
      'Because a row only reads the row above and its own left cell, you can keep **one row** and drop memory from O(m·n) to O(n). That costs you the ability to walk back through the table, so keep the full table whenever you must print the actual subsequence or edit script.',
      'Palindromes are different because the question is about one string. A palindrome mirrors around its center, so grow outward from each of the `2n - 1` centers while the two ends agree. That is O(n²) time and O(1) space. A table `pal[i][j]` (is `s[i..j]` a palindrome?) gets the same time but costs O(n²) memory, so know it, then prefer the center expansion.'
    ].join('\n\n'),

    viz: 'dp-strings',

    template: {
      title: 'Common subsequence table, with the walk back',
      note: 'Fill the table, then walk back from the corner: a match means the letter is in the answer, otherwise follow the larger neighbour. The two lines you change for other problems are the **match** line and the **skip** line. For edit distance the match line copies the diagonal and the skip line becomes `1 + min` of three neighbours (see the Variations). Drop the walk back when you only need the length.',
      code: {
        py: `def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]          #@init > dp[i][j]: answer for a[:i] and b[:j]. Row 0 and column 0 are the empty prefix
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1         #@match > Same letter: take it, and extend the diagonal answer
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])   #@skip > Different: drop a letter from one side, keep the better
    out = []
    i, j = m, n                                         #@trace > Walk back from the corner to find the letters
    while i > 0 and j > 0:                              #@trace
        if a[i - 1] == b[j - 1]:
            out.append(a[i - 1])                        #@trace > A match is in the answer
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1                                      #@trace > Otherwise follow the cell the value came from
        else:
            j -= 1
    return ''.join(reversed(out))`,
        js: `function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));   //@init > dp[i][j]: answer for a[:i] and b[:j]. Row 0 and column 0 are the empty prefix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;              //@match > Same letter: take it, and extend the diagonal answer
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);   //@skip > Different: drop a letter from one side, keep the better
      }
    }
  }
  const out = [];
  let i = m, j = n;                                   //@trace > Walk back from the corner to find the letters
  while (i > 0 && j > 0) {                            //@trace
    if (a[i - 1] === b[j - 1]) {
      out.push(a[i - 1]);                             //@trace > A match is in the answer
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;                                            //@trace > Otherwise follow the cell the value came from
    } else {
      j--;
    }
  }
  return out.reverse().join('');
}`,
        java: `class Solution {
    public String lcs(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];              //@init > dp[i][j]: answer for a[:i] and b[:j]. Row 0 and column 0 are the empty prefix
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;     //@match > Same letter: take it, and extend the diagonal answer
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);   //@skip > Different: drop a letter from one side, keep the better
                }
            }
        }
        StringBuilder out = new StringBuilder();
        int i = m, j = n;                                //@trace > Walk back from the corner to find the letters
        while (i > 0 && j > 0) {                         //@trace
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                out.append(a.charAt(i - 1));             //@trace > A match is in the answer
                i--; j--;
            } else if (dp[i - 1][j] >= dp[i][j - 1]) {
                i--;                                     //@trace > Otherwise follow the cell the value came from
            } else {
                j--;
            }
        }
        return out.reverse().toString();
    }
}`,
        cpp: `class Solution {
public:
    string lcs(string a, string b) {
        int m = a.size(), n = b.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));   //@init > dp[i][j]: answer for a[:i] and b[:j]. Row 0 and column 0 are the empty prefix
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a[i - 1] == b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;     //@match > Same letter: take it, and extend the diagonal answer
                } else {
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);   //@skip > Different: drop a letter from one side, keep the better
                }
            }
        }
        string out;
        int i = m, j = n;                                //@trace > Walk back from the corner to find the letters
        while (i > 0 && j > 0) {                         //@trace
            if (a[i - 1] == b[j - 1]) {
                out += a[i - 1];                         //@trace > A match is in the answer
                i--; j--;
            } else if (dp[i - 1][j] >= dp[i][j - 1]) {
                i--;                                     //@trace > Otherwise follow the cell the value came from
            } else {
                j--;
            }
        }
        reverse(out.begin(), out.end());
        return out;
    }
};`
      },
      tests: { fn: 'lcs', sig: { args: ['str', 'str'] }, cases: [
        { args: ['abcde', 'ace'], out: 'ace' }, { args: ['abc', 'abc'], out: 'abc' }, { args: ['abc', 'def'], out: '' }, { args: ['abcbdab', 'bdcaba'], out: 'bcba' },
        { args: ['', 'abc'], out: '' }, { args: ['aggtab', 'gxtxayb'], out: 'gtab' }, { args: ['a', 'a'], out: 'a' }, { args: ['abc', 'cba'], out: 'a' }] }
    },

    complexity: {
      time: 'O(m·n)',
      space: 'O(m·n), or O(min(m, n)) with a rolling row',
      why: 'The table has (m + 1)(n + 1) cells and each one does a constant amount of work, reading at most three neighbours. That is O(m·n) time. The full table costs O(m·n) memory. Because a cell only reads the row above and the cell to its left, one row (plus one saved diagonal value) is enough when you only need the number. Palindromes by expanding around centers are O(n²) time and O(1) space: 2n - 1 centers, each growing at most n/2 steps.',
      trap: 'Do not say “exponential, then memoized so polynomial” without naming the states: there are m·n of them, not 2^n. Say what `dp[i][j]` means, then count cells. Also: if you roll the row to save space, you can no longer walk back to rebuild the subsequence or the edit script. State that trade-off before the interviewer asks.'
    },

    variations: [
      {
        name: 'Rolling row: same answer in O(n) memory',
        body: 'Each cell needs the cell above, the cell to its left and the cell diagonally up-left. Keep one array `row` for the current row. Before you overwrite `row[j]` (which holds the “up” value), save it: it becomes the diagonal for the **next** column. Put the shorter string along the row so memory is `min(m, n) + 1`. This gives the **length** only; reconstruction needs the whole table (or Hirschberg’s divide-and-conquer, which is a follow-up, not a first answer).',
        code: {
          py: `def lcs_len(a, b):
    if len(b) > len(a):
        a, b = b, a                                    #> Short string along the row: less memory
    row = [0] * (len(b) + 1)
    for x in a:
        diag = 0                                       #> dp[i-1][j-1] for the next column
        for j in range(1, len(b) + 1):
            up = row[j]                                #> Save before overwriting
            row[j] = diag + 1 if x == b[j - 1] else max(row[j], row[j - 1])
            diag = up
    return row[-1]`,
          js: `function lcsLen(a, b) {
  if (b.length > a.length) [a, b] = [b, a];            //> Short string along the row: less memory
  const row = new Array(b.length + 1).fill(0);
  for (const x of a) {
    let diag = 0;                                      //> dp[i-1][j-1] for the next column
    for (let j = 1; j <= b.length; j++) {
      const up = row[j];                               //> Save before overwriting
      row[j] = x === b[j - 1] ? diag + 1 : Math.max(row[j], row[j - 1]);
      diag = up;
    }
  }
  return row[row.length - 1];
}`
        },
        tests: { fn: { py: 'lcs_len', default: 'lcsLen' }, cases: [
          { args: ['abcde', 'ace'], out: 3 }, { args: ['abc', 'def'], out: 0 }, { args: ['abcbdab', 'bdcaba'], out: 4 }, { args: ['', 'abc'], out: 0 }, { args: ['aggtab', 'gxtxayb'], out: 4 }, { args: ['ace', 'abcde'], out: 3 }] }
      },
      {
        name: 'Palindromes with a table, and why centers win',
        body: 'Let `pal[i][j]` be true when `s[i..j]` is a palindrome. It is true when the two end letters agree and the inside `s[i+1..j-1]` is a palindrome (or the inside is empty or one letter, `j - i < 2`). Fill `i` from the **end** to the start so `pal[i+1][j-1]` already exists. That counts every palindromic substring in O(n²) time but uses O(n²) memory. Expanding around centers does the same work with O(1) memory and no table, so it is the better answer for one string. Use the table only if the problem adds something the expansion can’t see, such as a cost per cut.',
        code: {
          py: `def count_pal_table(s):
    n = len(s)
    pal = [[False] * n for _ in range(n)]
    count = 0
    for i in range(n - 1, -1, -1):                     #> Rows from the bottom so the inner cell exists
        for j in range(i, n):
            if s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1]):
                pal[i][j] = True
                count += 1
    return count`,
          js: `function countPalTable(s) {
  const n = s.length;
  const pal = Array.from({ length: n }, () => new Array(n).fill(false));
  let count = 0;
  for (let i = n - 1; i >= 0; i--) {                   //> Rows from the bottom so the inner cell exists
    for (let j = i; j < n; j++) {
      if (s[i] === s[j] && (j - i < 2 || pal[i + 1][j - 1])) {
        pal[i][j] = true;
        count++;
      }
    }
  }
  return count;
}`
        },
        tests: { fn: { py: 'count_pal_table', default: 'countPalTable' }, cases: [
          { args: ['abc'], out: 3 }, { args: ['aaa'], out: 6 }, { args: ['abba'], out: 6 }, { args: [''], out: 0 }, { args: ['a'], out: 1 }] }
      },
      {
        name: 'Counting ways instead of picking the best',
        body: 'When the question is “in how many ways”, the same table adds instead of maximizing. Distinct subsequences (how many ways does `s` contain `t` as a subsequence) uses `dp[i][j]` = ways for `s[:i]` and `t[:j]`: always add `dp[i-1][j]` (skip this letter of `s`), and when the letters match also add `dp[i-1][j-1]` (use it). Column 0 is all 1: there is exactly one way to build the empty string (use no letters), and row 0 past it is 0. Counts overflow fast in Java and C++; the LeetCode version guarantees the answer fits in 32 bits, but the intermediate cells you never read can still overflow a signed int, so use a 64-bit type.'
      },
      {
        name: 'Interleaving: a path through the grid',
        body: 'Check whether `s3` can be built by weaving `s1` and `s2` without reordering either. Let `dp[i][j]` be true when `s3[:i+j]` is a weave of `s1[:i]` and `s2[:j]`. It is true if the last letter came from `s1` (`dp[i-1][j]` and `s1[i-1] == s3[i+j-1]`) or from `s2` (`dp[i][j-1]` and `s2[j-1] == s3[i+j-1]`). Picture it as a path from the top-left to the bottom-right moving only down (take from `s1`) or right (take from `s2`). If the lengths don’t add up to `len(s3)`, answer false immediately.'
      },
      {
        name: 'Same table, other questions',
        body: 'Once the table clicks, several “new” problems are one-line reductions. **Longest palindromic subsequence** (516) is the LCS of the string and its reverse. **Delete operation for two strings** (583) needs `m + n - 2 × LCS` deletions. **Wildcard matching** (44) has the regex shape, but `*` matches any sequence, so `dp[i][j] = dp[i-1][j] or dp[i][j-1]` for a star. **Shortest common supersequence** has length `m + n - LCS`. The skill is spotting which known table the question hides.'
      }
    ],

    worked: [
      {
        lc: 1143,
        restate: 'You get two strings. A **subsequence** of a string keeps some of its letters in their original order, with gaps allowed (not necessarily next to each other). Return the length of the longest string that is a subsequence of **both**. If they share no letter, the answer is 0.',
        examples: '- `"abcde"` and `"ace"` → `3` (the shared subsequence is `"ace"`).\n- `"abc"` and `"abc"` → `3`.\n- `"abc"` and `"def"` → `0`.\n- Edge cases: an empty string gives 0; repeated letters (`"aa"` and `"aaa"` → 2); the longer answer is not always a substring.',
        brute: 'Generate every subsequence of the shorter string (2^k of them) and check each against the other string. Exponential. The same pairs of prefixes come up again and again, which is the hint that memoizing them will collapse the work.',
        insight: 'Define `dp[i][j]` as the answer for the first `i` letters of one string and the first `j` of the other. Look at the last letters of those prefixes. If they are equal, the best answer uses them both: `dp[i-1][j-1] + 1`. If they differ, at least one of them is unused, so the answer is the better of dropping the last letter of the first (`dp[i-1][j]`) or of the second (`dp[i][j-1]`). Row 0 and column 0 are the empty prefix, so they are 0. The bottom-right cell is the answer.',
        code: {
          py: `class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        m, n = len(text1), len(text2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if text1[i - 1] == text2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        return dp[m][n]`,
          js: `function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`,
          java: `class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }
}`,
          cpp: `class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.size(), n = text2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1[i - 1] == text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }
};`
        },
        complexity: 'O(m·n) time, one constant-work step per cell. O(m·n) space for the table; a rolling row cuts it to O(min(m, n)) when you only need the length.',
        say: '“Let dp[i][j] be the longest common subsequence of the first i letters of one string and the first j of the other. If the last letters match, it is the diagonal plus one; otherwise the larger of dropping a letter from either side. Empty prefixes are zero. That is m times n cells, constant work each, so O(m·n) time, and I can roll the table to one row if I only need the length.”',
        followups: [
          { q: 'How do you recover the subsequence itself?', a: 'Keep the full table and walk back from the corner. On a match, take the letter and go diagonally; otherwise move to the larger of up and left. Reverse what you collected. The visualizer above does exactly this.' },
          { q: 'Why is the row rolling trick safe here?', a: 'A cell reads only the row above, plus the cell to its left in the current row. Save the old `row[j]` as the diagonal for the next column before overwriting it.' },
          { q: 'What changes if you want the longest common **substring** (contiguous)?', a: 'On a mismatch the cell resets to 0 instead of taking the max, and the answer is the largest cell anywhere, not the corner.' }
        ]
      },
      {
        lc: 72,
        restate: 'You get two words. In one step you may insert a letter, delete a letter, or replace one letter with another. Return the fewest steps that turn the first word into the second.',
        examples: '- `"horse"` → `"ros"` is `3`: replace h with r, delete r, delete e.\n- `"intention"` → `"execution"` is `5`.\n- `"abc"` → `"abc"` is `0`; `""` → `"abc"` is `3` (three inserts).\n- Edge cases: one or both words empty; words with nothing in common (answer is the longer length).',
        brute: 'Try every sequence of edits recursively: at each mismatch branch three ways. Exponential, and the same pair of suffixes is solved over and over.',
        insight: 'Let `dp[i][j]` be the fewest edits to turn the first `i` letters of the first word into the first `j` of the second. Edges: turning `i` letters into nothing costs `i` deletes, and building `j` letters from nothing costs `j` inserts. If the last letters are equal, they cost nothing, so copy the diagonal. Otherwise you pay one edit and take the cheapest of three: diagonal (replace), up (delete a letter of the first word), left (insert a letter of the second). Same table as the common subsequence, just a different combine rule.',
        code: {
          py: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
                else:
                    dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
        return dp[m][n]`,
          js: `function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`,
          java: `class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
        return dp[m][n];
    }
}`,
          cpp: `class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});
            }
        }
        return dp[m][n];
    }
};`
        },
        complexity: 'O(m·n) time and O(m·n) space. A rolling row gives O(min(m, n)) space if you only need the count.',
        say: '“dp[i][j] is the fewest edits to turn the first i letters of word1 into the first j of word2. Edges are i deletes and j inserts. On equal last letters I copy the diagonal; otherwise it is one plus the cheapest of replace (diagonal), delete (up) and insert (left). The corner is the answer, in O(m·n) time. To print the edits I walk back following whichever neighbour produced each cell.”',
        followups: [
          { q: 'Which neighbour is replace, delete and insert?', a: 'Diagonal is replace (or keep, if the letters match). Up consumed a letter of the first word without matching it, so it is a delete. Left consumed a letter of the second word, so it is an insert.' },
          { q: 'Can a match ever be worse than an edit?', a: 'No. Taking the diagonal on equal letters is always at least as good as any edit, because `dp` changes by at most 1 between neighbouring cells. So you never need the min on a match.' },
          { q: 'How would you print the actual edits?', a: 'Keep the table and walk back from the corner. At each cell, find which neighbour plus its cost gives the cell’s value, and record keep, replace, delete or insert. Reverse the list.' }
        ]
      },
      {
        lc: 5,
        restate: 'You get a string. Return its longest **palindromic substring**: a run of consecutive letters that reads the same forwards and backwards. If several are tied, any one is fine, but the checks here expect the leftmost.',
        examples: '- `"babad"` → `"bab"` (`"aba"` is also valid).\n- `"cbbd"` → `"bb"`.\n- `"a"` → `"a"`; `"ac"` → `"a"`.\n- Edge cases: an even-length palindrome has no single middle letter (`"bb"`); the whole string may be a palindrome.',
        brute: 'Check every substring: O(n²) substrings, each checked in O(n), so O(n³).',
        insight: 'A palindrome is symmetric around a center. There are `2n - 1` centers: each letter (odd length) and each gap between two letters (even length). From each center, step left and right while the two letters agree; the last agreeing span is the longest palindrome at that center. Keep the best. Each expansion costs at most O(n), and there are O(n) centers, so O(n²) time with O(1) extra space. A table works too (`pal[i][j]`), at O(n²) memory.',
        code: {
          py: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        best_start, best_len = 0, 0
        for c in range(len(s)):
            for l, r in ((c, c), (c, c + 1)):        # odd center, then even center
                while l >= 0 and r < len(s) and s[l] == s[r]:
                    l -= 1
                    r += 1
                if r - l - 1 > best_len:             # the span is s[l+1 : r]
                    best_start, best_len = l + 1, r - l - 1
        return s[best_start:best_start + best_len]`,
          js: `function longestPalindrome(s) {
  let bestStart = 0, bestLen = 0;
  for (let c = 0; c < s.length; c++) {
    for (const [a, b] of [[c, c], [c, c + 1]]) {     // odd center, then even center
      let l = a, r = b;
      while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
      if (r - l - 1 > bestLen) { bestStart = l + 1; bestLen = r - l - 1; }   // the span is s[l+1 .. r-1]
    }
  }
  return s.slice(bestStart, bestStart + bestLen);
}`,
          java: `class Solution {
    public String longestPalindrome(String s) {
        int bestStart = 0, bestLen = 0;
        for (int c = 0; c < s.length(); c++) {
            for (int k = 0; k < 2; k++) {              // k = 0 odd center, k = 1 even center
                int l = c, r = c + k;
                while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
                if (r - l - 1 > bestLen) { bestStart = l + 1; bestLen = r - l - 1; }
            }
        }
        return s.substring(bestStart, bestStart + bestLen);
    }
}`,
          cpp: `class Solution {
public:
    string longestPalindrome(string s) {
        int n = s.size(), bestStart = 0, bestLen = 0;
        for (int c = 0; c < n; c++) {
            for (int k = 0; k < 2; k++) {              // k = 0 odd center, k = 1 even center
                int l = c, r = c + k;
                while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
                if (r - l - 1 > bestLen) { bestStart = l + 1; bestLen = r - l - 1; }
            }
        }
        return s.substr(bestStart, bestLen);
    }
};`
        },
        complexity: 'O(n²) time: 2n - 1 centers, each expanding at most n/2 steps. O(1) extra space.',
        say: '“Every palindrome mirrors around a center, and there are 2n minus 1 of them: each letter and each gap. For each center I expand outward while the ends match, and remember the longest span. That is O(n²) time and O(1) space. A DP table does the same work in O(n²) memory, and Manacher’s algorithm gets O(n), but center expansion is the right trade for an interview.”',
        followups: [
          { q: 'Why two kinds of centers?', a: 'An odd-length palindrome is centered on a letter and an even-length one on the gap between two equal letters. Starting only from letters misses `"bb"` inside `"cbbd"`.' },
          { q: 'Is there anything faster than O(n²)?', a: 'Manacher’s algorithm finds all maximal palindromes in O(n) by reusing earlier expansions through a mirror. It is a known result, rarely expected in an interview.' },
          { q: 'How do you count all palindromic substrings instead?', a: 'Same expansion, but add 1 for every successful step instead of tracking the longest. That is the neighbouring problem 647.' }
        ]
      },
      {
        lc: 10,
        restate: 'You get a text `s` and a pattern `p`. In the pattern, `.` matches any single letter, and `*` means “zero or more of the **letter before it**” (so `a*` matches the empty string, `a`, `aa`, …). Decide whether the pattern matches the **entire** text, not just a piece of it.',
        examples: '- `"aa"` with `"a"` → `false` (the pattern is too short).\n- `"aa"` with `"a*"` → `true`.\n- `"ab"` with `".*"` → `true`.\n- `"aab"` with `"c*a*b"` → `true` (c zero times, a twice, b once).\n- Edge cases: an empty text can still match patterns like `"a*"`; a star never begins a valid pattern.',
        brute: 'Recursive matching: on a star, try skipping it, or consuming one letter and staying on the star. Without memory that is exponential on patterns like `a*a*a*a*b`.',
        insight: 'Let `dp[i][j]` be true when the first `i` letters of the text match the first `j` symbols of the pattern. `dp[0][0]` is true (empty matches empty). A plain pattern symbol needs the last letters to agree (equal or `.`) and `dp[i-1][j-1]`. A star pairs with the letter before it, and has two options: use it **zero times**, so look two columns back, `dp[i][j-2]`; or use it **once more**, which needs the letter before the star to match the current text letter and `dp[i-1][j]` (the same star state one text letter earlier). Row 0 needs separate filling: only patterns made of `x*` pairs can match the empty text.',
        code: {
          py: `class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        m, n = len(s), len(p)
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[0][0] = True
        for j in range(2, n + 1):
            if p[j - 1] == '*':
                dp[0][j] = dp[0][j - 2]               # x* can vanish
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if p[j - 1] == '*':
                    dp[i][j] = j >= 2 and (dp[i][j - 2] or
                        (p[j - 2] in (s[i - 1], '.') and dp[i - 1][j]))
                else:
                    dp[i][j] = p[j - 1] in (s[i - 1], '.') and dp[i - 1][j - 1]
        return dp[m][n]`,
          js: `function isMatch(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 2; j <= n; j++) if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];   // x* can vanish
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        dp[i][j] = j >= 2 && (dp[i][j - 2] || ((p[j - 2] === s[i - 1] || p[j - 2] === '.') && dp[i - 1][j]));
      } else {
        dp[i][j] = (p[j - 1] === s[i - 1] || p[j - 1] === '.') && dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}`,
          java: `class Solution {
    public boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int j = 2; j <= n; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];   // x* can vanish
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j - 1) == '*') {
                    char prev = j >= 2 ? p.charAt(j - 2) : '.';
                    dp[i][j] = j >= 2 && (dp[i][j - 2] || ((prev == s.charAt(i - 1) || prev == '.') && dp[i - 1][j]));
                } else {
                    dp[i][j] = (p.charAt(j - 1) == s.charAt(i - 1) || p.charAt(j - 1) == '.') && dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }
}`,
          cpp: `class Solution {
public:
    bool isMatch(string s, string p) {
        int m = s.size(), n = p.size();
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        for (int j = 2; j <= n; j++) if (p[j - 1] == '*') dp[0][j] = dp[0][j - 2];   // x* can vanish
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j - 1] == '*') {
                    dp[i][j] = j >= 2 && (dp[i][j - 2] || ((p[j - 2] == s[i - 1] || p[j - 2] == '.') && dp[i - 1][j]));
                } else {
                    dp[i][j] = (p[j - 1] == s[i - 1] || p[j - 1] == '.') && dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }
};`
        },
        complexity: 'O(m·n) time and O(m·n) space: every cell looks at a constant number of earlier cells. Two rows (current and previous) would cut the space to O(n), since the star reads two columns back in the same row and one row up, but the full table is clearer to explain.',
        say: '“dp[i][j] is true if the first i text letters match the first j pattern symbols. A normal symbol needs a letter match and the diagonal. A star has two cases: zero copies, look two columns back; or one more copy, which needs the letter before the star to match and the cell above. Row zero is true only through pairs like a-star. That is O(m·n). I’d mention the recursive-with-memo version as the same states top-down.”',
        followups: [
          { q: 'Why look two columns back for the zero case?', a: 'A star and the letter before it form one unit that may vanish. Dropping both removes two pattern symbols, so the state is `dp[i][j-2]`.' },
          { q: 'How does wildcard matching (44) differ?', a: 'There `*` matches any sequence on its own (no letter before it), so a star cell is `dp[i-1][j] or dp[i][j-1]`, and `?` matches one letter. Simpler recurrence, same table.' },
          { q: 'What do you do about the first row?', a: 'The empty text matches the empty pattern, and also patterns built of x-star pairs. Fill `dp[0][j] = dp[0][j-2]` when `p[j-1]` is a star; every other pattern symbol needs at least one letter, so it stays false.' }
        ]
      }
    ],

    practice: [
      { lc: 5,
        hints: ['A palindrome is symmetric around a middle. How many different middles does a string of length n have?', 'There are 2n - 1: every letter (odd length) and every gap between two letters (even length). From each, step outward while the two letters agree.', 'When the walk stops at `l` and `r`, the palindrome is `s[l+1 .. r-1]`, of length `r - l - 1`. Keep the start of the longest one, updating only when strictly longer.'],
        starter: { py: 'class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        ', js: 'function longestPalindrome(s) {\n  \n}' },
        tests: { fn: 'longestPalindrome', sig: { args: ['str'] }, cases: [
          { args: ['babad'], out: 'bab' }, { args: ['cbbd'], out: 'bb' }, { args: ['a'], out: 'a' }, { args: ['ac'], out: 'a' }, { args: ['forgeeksskeegfor'], out: 'geeksskeeg' },
          { args: ['abacdfgdcaba'], out: 'aba' }, { args: ['aaaa'], out: 'aaaa' }, { args: ['abb'], out: 'bb' }] } },

      { lc: 647,
        hints: ['Count palindromic substrings, not just the longest. Each one has a center, so count per center.', 'From every letter and every gap, expand outward while the ends match. Each successful step is one more palindrome.', 'For each of the two center kinds at `c`, start `l = c`, `r = c` or `r = c + 1`, and add 1 every time `s[l] == s[r]` before stepping out.'],
        solution: { explain: 'Every palindromic substring has a unique center, so expand from each of the 2n - 1 centers and count each successful step. O(n²) time, O(1) space. A DP table gives the same time at O(n²) memory.', code: {
          py: `class Solution:
    def countSubstrings(self, s: str) -> int:
        count = 0
        for c in range(len(s)):
            for l, r in ((c, c), (c, c + 1)):
                while l >= 0 and r < len(s) and s[l] == s[r]:
                    count += 1
                    l -= 1
                    r += 1
        return count`,
          js: `function countSubstrings(s) {
  let count = 0;
  for (let c = 0; c < s.length; c++) {
    for (const [a, b] of [[c, c], [c, c + 1]]) {
      let l = a, r = b;
      while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; }
    }
  }
  return count;
}` } },
        starter: { py: 'class Solution:\n    def countSubstrings(self, s: str) -> int:\n        ', js: 'function countSubstrings(s) {\n  \n}' },
        tests: { fn: 'countSubstrings', sig: { args: ['str'] }, cases: [
          { args: ['abc'], out: 3 }, { args: ['aaa'], out: 6 }, { args: ['abba'], out: 6 }, { args: ['a'], out: 1 }, { args: ['racecar'], out: 10 }, { args: ['xyz'], out: 3 }] } },

      { lc: 1143,
        hints: ['Define `dp[i][j]` as the answer for the first `i` letters of one string and the first `j` of the other.', 'If the last letters of those prefixes match, extend the diagonal answer by one. If not, one of them is unused.', 'On a mismatch take `max(dp[i-1][j], dp[i][j-1])`. Row 0 and column 0 are 0, and the answer is `dp[m][n]`.'],
        starter: { py: 'class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        ', js: 'function longestCommonSubsequence(text1, text2) {\n  \n}' },
        tests: { fn: 'longestCommonSubsequence', sig: { args: ['str', 'str'] }, cases: [
          { args: ['abcde', 'ace'], out: 3 }, { args: ['abc', 'abc'], out: 3 }, { args: ['abc', 'def'], out: 0 }, { args: ['abcbdab', 'bdcaba'], out: 4 }, { args: ['', 'abc'], out: 0 }, { args: ['aa', 'aaa'], out: 2 }, { args: ['aggtab', 'gxtxayb'], out: 4 }] } },

      { lc: 97,
        hints: ['If the lengths of the two parts do not add up to the target, stop: the answer is false.', 'Let `dp[i][j]` be true when the first `i + j` letters of the target are a weave of the first `i` letters of one part and the first `j` of the other.', 'It is true if the last target letter came from the first part (`dp[i-1][j]` and the letters agree) or from the second (`dp[i][j-1]` and they agree). The edges are the cases where only one part is used. One row is enough.'],
        solution: { explain: 'A grid path: move down to take a letter from the first part, right to take from the second. `dp[i][j]` is reachable if either predecessor is reachable and its letter matches `s3[i+j-1]`. Keep a single row, since each cell reads only the cell above (the old row value) and its left neighbour. O(m·n) time, O(n) space.', code: {
          py: `class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        m, n = len(s1), len(s2)
        if m + n != len(s3):
            return False
        dp = [False] * (n + 1)
        dp[0] = True
        for j in range(1, n + 1):
            dp[j] = dp[j - 1] and s2[j - 1] == s3[j - 1]
        for i in range(1, m + 1):
            dp[0] = dp[0] and s1[i - 1] == s3[i - 1]
            for j in range(1, n + 1):
                dp[j] = (dp[j] and s1[i - 1] == s3[i + j - 1]) or (dp[j - 1] and s2[j - 1] == s3[i + j - 1])
        return dp[n]`,
          js: `function isInterleave(s1, s2, s3) {
  const m = s1.length, n = s2.length;
  if (m + n !== s3.length) return false;
  const dp = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let j = 1; j <= n; j++) dp[j] = dp[j - 1] && s2[j - 1] === s3[j - 1];
  for (let i = 1; i <= m; i++) {
    dp[0] = dp[0] && s1[i - 1] === s3[i - 1];
    for (let j = 1; j <= n; j++) {
      dp[j] = (dp[j] && s1[i - 1] === s3[i + j - 1]) || (dp[j - 1] && s2[j - 1] === s3[i + j - 1]);
    }
  }
  return dp[n];
}` } },
        starter: { py: 'class Solution:\n    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:\n        ', js: 'function isInterleave(s1, s2, s3) {\n  \n}' },
        tests: { fn: 'isInterleave', sig: { args: ['str', 'str', 'str'] }, cases: [
          { args: ['aabcc', 'dbbca', 'aadbbcbcac'], out: true }, { args: ['aabcc', 'dbbca', 'aadbbbaccc'], out: false }, { args: ['', '', ''], out: true }, { args: ['a', '', 'a'], out: true },
          { args: ['ab', 'cd', 'acbd'], out: true }, { args: ['ab', 'cd', 'abdc'], out: false }, { args: ['abc', '', 'ab'], out: false }] } },

      { lc: 115,
        hints: ['Count the ways, so add instead of taking a max. `dp[i][j]` is the number of ways the first `j` letters of the target appear as a subsequence of the first `i` letters of the source.', 'You can always skip the current source letter: add `dp[i-1][j]`. If it equals the target letter, you may also use it: add `dp[i-1][j-1]`.', 'There is one way to build the empty target, so column 0 is 1. To keep a single row, loop `j` from high to low so the diagonal value is not overwritten before it is read.'],
        solution: { explain: 'Counting table: skip the source letter (`dp[i-1][j]`) or, on a match, use it (`dp[i-1][j-1]`). Collapse to one array by iterating `j` downwards, so `dp[j-1]` still holds the previous row. O(m·n) time, O(n) space.', code: {
          py: `class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        dp = [1] + [0] * len(t)
        for ch in s:
            for j in range(len(t), 0, -1):
                if ch == t[j - 1]:
                    dp[j] += dp[j - 1]
        return dp[len(t)]`,
          js: `function numDistinct(s, t) {
  const dp = new Array(t.length + 1).fill(0);
  dp[0] = 1;
  for (const ch of s) {
    for (let j = t.length; j >= 1; j--) {
      if (ch === t[j - 1]) dp[j] += dp[j - 1];
    }
  }
  return dp[t.length];
}` } },
        starter: { py: 'class Solution:\n    def numDistinct(self, s: str, t: str) -> int:\n        ', js: 'function numDistinct(s, t) {\n  \n}' },
        tests: { fn: 'numDistinct', sig: { args: ['str', 'str'] }, cases: [
          { args: ['rabbbit', 'rabbit'], out: 3 }, { args: ['babgbag', 'bag'], out: 5 }, { args: ['abc', 'abcd'], out: 0 }, { args: ['aaa', 'aa'], out: 3 }, { args: ['abc', ''], out: 1 }] } },

      { lc: 72,
        hints: ['Let `dp[i][j]` be the fewest edits to turn the first `i` letters of the first word into the first `j` of the second.', 'The edges are free to fill: `i` deletes for column 0 and `j` inserts for row 0. Equal last letters cost nothing, so copy the diagonal.', 'Otherwise it is `1 + min(diagonal, up, left)`: replace, delete, insert.'],
        starter: { py: 'class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        ', js: 'function minDistance(word1, word2) {\n  \n}' },
        tests: { fn: 'minDistance', sig: { args: ['str', 'str'] }, cases: [
          { args: ['horse', 'ros'], out: 3 }, { args: ['intention', 'execution'], out: 5 }, { args: ['abc', 'abc'], out: 0 }, { args: ['', 'abc'], out: 3 }, { args: ['abc', ''], out: 3 }, { args: ['a', 'b'], out: 1 }, { args: ['sunday', 'saturday'], out: 3 }] } },

      { lc: 10,
        hints: ['Let `dp[i][j]` be true when the first `i` text letters match the first `j` pattern symbols. `dp[0][0]` is true.', 'A normal symbol (letter or dot) needs the current letters to agree and `dp[i-1][j-1]`. A star belongs with the symbol before it.', 'For a star: zero copies is `dp[i][j-2]`; one more copy needs the symbol before the star to match `s[i-1]` and `dp[i-1][j]`. In row 0, a star can still vanish: `dp[0][j] = dp[0][j-2]`.'],
        starter: { py: 'class Solution:\n    def isMatch(self, s: str, p: str) -> bool:\n        ', js: 'function isMatch(s, p) {\n  \n}' },
        tests: { fn: 'isMatch', sig: { args: ['str', 'str'] }, cases: [
          { args: ['aa', 'a'], out: false }, { args: ['aa', 'a*'], out: true }, { args: ['ab', '.*'], out: true }, { args: ['aab', 'c*a*b'], out: true }, { args: ['mississippi', 'mis*is*p*.'], out: false },
          { args: ['', 'a*'], out: true }, { args: ['', ''], out: true }, { args: ['abcd', 'd*'], out: false }, { args: ['aaa', 'a*a'], out: true }, { args: ['ab', '.*c'], out: false }] } },

      { lc: 516,
        hints: ['A palindromic subsequence reads the same in both directions. Compare the string with something derived from itself.', 'Reverse the string. The longest subsequence shared by the string and its reverse is a palindrome.', 'Run the common subsequence table on `s` and `s[::-1]`; the length is the answer. A rolling row keeps memory at O(n).'],
        solution: { explain: 'A subsequence that appears in both `s` and its reverse reads the same forwards and backwards, so the answer is `LCS(s, reverse(s))`. O(n²) time; a rolling row gives O(n) space.', code: {
          py: `class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:
        t = s[::-1]
        n = len(s)
        row = [0] * (n + 1)
        for x in s:
            diag = 0
            for j in range(1, n + 1):
                up = row[j]
                row[j] = diag + 1 if x == t[j - 1] else max(row[j], row[j - 1])
                diag = up
        return row[n]`,
          js: `function longestPalindromeSubseq(s) {
  const t = s.split('').reverse().join(''), n = s.length;
  const row = new Array(n + 1).fill(0);
  for (const x of s) {
    let diag = 0;
    for (let j = 1; j <= n; j++) {
      const up = row[j];
      row[j] = x === t[j - 1] ? diag + 1 : Math.max(row[j], row[j - 1]);
      diag = up;
    }
  }
  return row[n];
}` } },
        starter: { py: 'class Solution:\n    def longestPalindromeSubseq(self, s: str) -> int:\n        ', js: 'function longestPalindromeSubseq(s) {\n  \n}' },
        tests: { fn: 'longestPalindromeSubseq', sig: { args: ['str'] }, cases: [
          { args: ['bbbab'], out: 4 }, { args: ['cbbd'], out: 2 }, { args: ['a'], out: 1 }, { args: ['abcde'], out: 1 }, { args: ['agbcba'], out: 5 }] } },

      { lc: 583,
        hints: ['You only delete, never replace. What is left of each word after deleting must be identical.', 'The most you can keep is a longest common subsequence of the two words.', 'Everything not in that subsequence is deleted from each word: `m + n - 2 * LCS`.'],
        solution: { explain: 'What survives in both words must be a common subsequence, and keeping the longest one minimizes deletions: `m + n - 2·LCS`. O(m·n) time, O(min(m, n)) space with a rolling row.', code: {
          py: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        a, b = word1, word2
        row = [0] * (len(b) + 1)
        for x in a:
            diag = 0
            for j in range(1, len(b) + 1):
                up = row[j]
                row[j] = diag + 1 if x == b[j - 1] else max(row[j], row[j - 1])
                diag = up
        return len(a) + len(b) - 2 * row[len(b)]`,
          js: `function minDistance(word1, word2) {
  const a = word1, b = word2;
  const row = new Array(b.length + 1).fill(0);
  for (const x of a) {
    let diag = 0;
    for (let j = 1; j <= b.length; j++) {
      const up = row[j];
      row[j] = x === b[j - 1] ? diag + 1 : Math.max(row[j], row[j - 1]);
      diag = up;
    }
  }
  return a.length + b.length - 2 * row[b.length];
}` } },
        starter: { py: 'class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        ', js: 'function minDistance(word1, word2) {\n  \n}' },
        tests: { fn: 'minDistance', sig: { args: ['str', 'str'] }, cases: [
          { args: ['sea', 'eat'], out: 2 }, { args: ['leetcode', 'etco'], out: 4 }, { args: ['abc', 'abc'], out: 0 }, { args: ['', 'ab'], out: 2 }, { args: ['a', 'b'], out: 2 }] } },

      { lc: 44,
        hints: ['Here `*` matches any run of letters (including none) and `?` matches exactly one letter. A table works: a star cell is `dp[i-1][j] or dp[i][j-1]`.', 'A leaner idea: walk both strings with two pointers. When you meet a star, remember where it was and where the text was, and tentatively match nothing.', 'On a later mismatch, go back to the last star and let it swallow one more text letter. At the end, the rest of the pattern must be only stars.'],
        solution: { explain: 'Greedy with one backtrack point: remember the most recent star and the text position it started at. On a mismatch, resume after the star with the star absorbing one more letter. Only the last star ever needs revisiting, because an earlier star can always be pushed to its minimum. O(m·n) worst case, near O(m + n) typically, O(1) space.', code: {
          py: `class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        i = j = 0
        star, mark = -1, 0
        while i < len(s):
            if j < len(p) and (p[j] == s[i] or p[j] == '?'):
                i += 1
                j += 1
            elif j < len(p) and p[j] == '*':
                star, mark = j, i
                j += 1
            elif star != -1:
                j = star + 1
                mark += 1
                i = mark
            else:
                return False
        while j < len(p) and p[j] == '*':
            j += 1
        return j == len(p)`,
          js: `function isMatch(s, p) {
  let i = 0, j = 0, star = -1, mark = 0;
  while (i < s.length) {
    if (j < p.length && (p[j] === s[i] || p[j] === '?')) { i++; j++; }
    else if (j < p.length && p[j] === '*') { star = j; mark = i; j++; }
    else if (star !== -1) { j = star + 1; mark++; i = mark; }
    else return false;
  }
  while (j < p.length && p[j] === '*') j++;
  return j === p.length;
}` } },
        starter: { py: 'class Solution:\n    def isMatch(self, s: str, p: str) -> bool:\n        ', js: 'function isMatch(s, p) {\n  \n}' },
        tests: { fn: 'isMatch', sig: { args: ['str', 'str'] }, cases: [
          { args: ['aa', 'a'], out: false }, { args: ['aa', '*'], out: true }, { args: ['cb', '?a'], out: false }, { args: ['adceb', '*a*b'], out: true }, { args: ['acdcb', 'a*c?b'], out: false },
          { args: ['', '*'], out: true }, { args: ['', '?'], out: false }, { args: ['abc', 'a*c'], out: true }, { args: ['mississippi', 'm??*ss*?i*pi'], out: false }] } }
    ],

    mistakes: [
      '**A vague meaning for `dp[i][j]`.** “The answer so far” is not a definition. Write it as a sentence: “the best answer for the first `i` letters of `a` and the first `j` of `b`”. Every base case and every neighbour then follows from it.',
      '**Off-by-one between the table and the strings.** The table has `m + 1` rows and `n + 1` columns, but the letters are `a[i - 1]` and `b[j - 1]`. Reading `a[i]` when you mean `a[i - 1]` shifts every comparison by one, and in Python the wrong index silently works until the last row.',
      '**Confusing subsequence with substring.** A subsequence may skip letters; a substring may not. If the problem is about contiguous runs, a mismatch resets the cell to 0 instead of taking the max.',
      '**Forgetting the edges in edit distance.** Row 0 and column 0 are not 0: turning `i` letters into nothing costs `i`. Starting with a zero-filled table makes `""` to `"abc"` answer 0.',
      '**Using the wrong combine for counting.** Distinct subsequences **adds** the skip and the use branches; it never takes a max or a min. And column 0 must be 1 (one way to build the empty string), not 0, or every count is 0.',
      '**Rolling the row in the wrong direction.** With one array, a cell that reads its left neighbour in the **same** pass wants the new value, but one that reads the diagonal needs the old one. Save the diagonal before you overwrite it (LCS), or loop `j` downward (distinct subsequences).',
      '**Skipping the length check in interleaving.** If `len(s1) + len(s2) != len(s3)` the answer is false at once; without that check the indices `i + j - 1` run off the end of `s3`.',
      '**Regex star as a standalone symbol.** In regex matching a `*` belongs to the letter before it. Treating it like the wildcard `*` of the sibling problem (any run) accepts wrong inputs; and the zero-copies case must look **two** columns back.',
      '**Expanding around only one kind of center.** Palindromes of even length (`"abba"`) are centered on a gap. Skip the `(c, c + 1)` pair and you miss every one of them. Also remember to update the best span only when it is strictly longer if the answer has a tie rule.',
      '**Language gotchas.** *Python:* `[[0] * n] * m` aliases one row, so build with `[[0] * n for _ in range(m + 1)]`. *JavaScript:* `new Array(m).fill(new Array(n).fill(0))` has the same bug, and strings are immutable, so push into an array and `join`. *Java:* compare characters with `charAt(i) == charAt(j)`, never `s.substring(...) == t.substring(...)`; use `long` for counts. *C++:* `s.size()` is unsigned, so `s.size() - 1` on an empty string wraps; cast to `int` first, and `vector<vector<bool>>` is fine but slow to debug.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What is the time complexity of filling the common-subsequence table for strings of length m and n?',
        choices: ['O(m·n)', 'O(m + n)', 'O(2^(m+n))', 'O(m·n·min(m, n))'], answer: 0,
        explain: 'There are (m + 1)(n + 1) cells and each is computed from at most three neighbours in constant time.' },
      { kind: 'concept', q: 'In the common-subsequence table, what does `dp[i][j]` mean?',
        choices: ['The longest common subsequence of the first i letters of one string and the first j of the other', 'Whether letter i of one string equals letter j of the other', 'The number of matching letters in the strings so far', 'The edit distance between letter i and letter j'], answer: 0,
        explain: 'It is about **prefixes**, not single letters. Row 0 and column 0 are the empty prefix, and the corner `dp[m][n]` is the answer for the whole strings.' },
      { kind: 'concept', q: 'In edit distance, which neighbour of `dp[i][j]` corresponds to **deleting** a letter of the first word?',
        choices: ['The cell above, `dp[i-1][j]`', 'The cell to the left, `dp[i][j-1]`', 'The diagonal, `dp[i-1][j-1]`', 'The cell two columns back'], answer: 0,
        explain: 'Moving up consumes a letter of the first word without matching it: a delete. Left consumes a letter of the second word: an insert. Diagonal consumes both: a replace (or a free keep).' },
      { kind: 'bug', q: 'This edit distance returns 0 for `"" → "abc"`. What is wrong?',
        code: `dp = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    for j in range(1, n + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = dp[i - 1][j - 1]
        else:
            dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
return dp[m][n]`,
        choices: ['Row 0 and column 0 are never set to j and i', 'The min should be a max', 'The loops should start at 0', 'The comparison should use `a[i]`'], answer: 0,
        explain: 'Building `"abc"` from nothing needs three inserts, so `dp[0][j]` must be `j` (and `dp[i][0]` must be `i`). A zero-filled edge says the empty string already equals anything.' },
      { kind: 'pattern', q: 'Which of these should use expansion around centers rather than a two-string table?',
        choices: ['Find the longest palindrome inside one string', 'Find the fewest edits between two words', 'Decide whether a text matches a pattern with `*`', 'Count the ways one string contains another as a subsequence'], answer: 0,
        explain: 'One string and a symmetry question: grow from each of the 2n - 1 centers in O(n²) time and O(1) space. The others relate two strings, which is table territory.' },
      { kind: 'concept', q: 'Why does `lcs_len` with one row save the diagonal value (`diag = up`) before overwriting `row[j]`?',
        choices: ['The next column needs the old value of `row[j]` as its up-left neighbour', 'To avoid a Python aliasing bug', 'Because the row must stay sorted', 'To count the matches twice'], answer: 0,
        explain: 'After you overwrite `row[j]` with the new row, the old value (the cell above) is gone, but column `j + 1` needs it as its diagonal.' },
      { kind: 'complexity', q: 'A solution fills the full table but the interviewer asks for the **actual subsequence**, not its length. Which statement is right?',
        choices: ['Keep the full table (or use Hirschberg), because a rolling row cannot be walked back', 'The rolling row works, you just read it backwards', 'It cannot be done in O(m·n) time', 'You must re-run the algorithm for each letter'], answer: 0,
        explain: 'Walking back needs the neighbours of every cell on the path, which a single row has thrown away. Hirschberg’s divide and conquer recovers it in O(min) space, but a full table is the normal answer.' },
      { kind: 'concept', q: 'In the distinct-subsequences count, `dp[i][j] = dp[i-1][j] + (dp[i-1][j-1] if letters match)`. What does the first term represent?',
        choices: ['Skipping the current letter of the source', 'Using the current letter of the source', 'Replacing a letter', 'Starting a new subsequence'], answer: 0,
        explain: 'You can always ignore the current source letter, which leaves the previous row’s count. Using it is only possible on a match, and adds the diagonal count.' },
      { kind: 'bug', q: 'This regex cell is wrong for `s = "aaa"`, `p = "a*"`. What is the bug?',
        code: `if p[j - 1] == '*':
    dp[i][j] = dp[i][j - 1] or (p[j - 2] in (s[i - 1], '.') and dp[i - 1][j])`,
        choices: ['The zero-copies case should be `dp[i][j - 2]`, since the letter and its star vanish together', 'The `or` should be `and`', 'The star should use `dp[i - 1][j - 1]`', 'The `.` check is missing'], answer: 0,
        explain: 'A star and the letter before it form one unit. Using it zero times removes both pattern symbols, so the state is two columns back, not one.' },
      { kind: 'pattern', q: 'Which of these are the same table with a different combine rule? Pick every one that applies.',
        choices: ['Longest common subsequence', 'Edit distance', 'Delete operation for two strings (via the LCS length)', 'Largest rectangle of zeros in a grid'], answer: [0, 1, 2],
        explain: 'All three are two-string prefix tables. The rectangle problem is a different shape (a monotonic stack over row heights).' },
      { kind: 'concept', q: 'Palindromic substrings of a string with n letters: how many centers must you try when expanding?',
        choices: ['2n - 1 (each letter and each gap between letters)', 'n', 'n²', 'log n'], answer: 0,
        explain: 'An odd-length palindrome is centered on a letter (n choices); an even-length one on a gap between two letters (n - 1 choices).' }
    ],

    flashcards: [
      { id: 'dp-meaning', front: 'Two-string DP: how do you define `dp[i][j]`, and where is the answer?', back: 'The answer for the **first `i` letters** of one string and the **first `j`** of the other. Row 0 and column 0 are the empty prefix, and the answer is `dp[m][n]`.' },
      { id: 'lcs-rule', front: 'Longest common subsequence: what is the recurrence?', back: 'Equal letters: `dp[i][j] = dp[i-1][j-1] + 1`. Otherwise `max(dp[i-1][j], dp[i][j-1])`. Edges are 0. O(m·n) time.' },
      { id: 'lcs-trace', front: 'How do you recover the subsequence from the LCS table?', back: 'Walk back from `(m, n)`. On a match, take the letter and go diagonally. Otherwise move to the larger of up and left. Reverse the collected letters. Needs the full table.' },
      { id: 'edit-rule', front: 'Edit distance: what is the recurrence and what are the edges?', back: 'Equal: copy the diagonal. Different: `1 + min(diagonal, up, left)`. Edges: `dp[i][0] = i`, `dp[0][j] = j`.' },
      { id: 'edit-moves', front: 'Edit distance: which neighbour is replace, delete, and insert?', back: 'Diagonal is replace (or keep on a match). Up is delete a letter of the first word. Left is insert a letter of the second.' },
      { id: 'roll-row', front: 'How do you cut LCS memory to one row, and what do you lose?', back: 'Keep one array and save the old `row[j]` as the next column’s diagonal before overwriting. Memory is O(min(m, n)). You lose the ability to walk back and rebuild the answer.' },
      { id: 'pal-centers', front: 'Palindromic substring by expanding: how many centers, and what is the cost?', back: '2n - 1 centers: each letter and each gap. Expand while the ends match. O(n²) time, O(1) space. Beats the O(n²)-memory table for one string.' },
      { id: 'pal-table', front: 'Palindrome table: what is the recurrence and the fill order?', back: '`pal[i][j]` is true if `s[i] == s[j]` and (`j - i < 2` or `pal[i+1][j-1]`). Fill `i` from the end to the start so the inside cell exists.' },
      { id: 'distinct-rule', front: 'Distinct subsequences: what is the count recurrence?', back: '`dp[i][j] = dp[i-1][j]` (skip the source letter) plus `dp[i-1][j-1]` when the letters match (use it). Column 0 is 1. Loop `j` downward to roll to one row.' },
      { id: 'interleave-rule', front: 'Interleaving string: what does `dp[i][j]` say and how is it filled?', back: 'True if the first `i + j` letters of the target weave the first `i` and `j` letters of the parts. True if (`dp[i-1][j]` and `s1[i-1] == s3[i+j-1]`) or (`dp[i][j-1]` and `s2[j-1] == s3[i+j-1]`). Check the lengths first.' },
      { id: 'regex-star', front: 'Regex matching: how does a `*` cell work?', back: '`*` binds to the letter before it. Zero copies: `dp[i][j-2]`. One more copy: the previous symbol matches `s[i-1]` (equal or `.`) and `dp[i-1][j]`. Row 0 uses `dp[0][j-2]` for stars.' },
      { id: 'wild-star', front: 'Wildcard matching (44) vs regex (10): what differs?', back: 'In 44, `*` alone matches any run and `?` matches one letter, so a star cell is `dp[i-1][j] or dp[i][j-1]`. In 10, `*` repeats the previous letter and looks two columns back.' },
      { id: 'reductions', front: 'Which questions reduce to LCS?', back: 'Longest palindromic subsequence = LCS(s, reverse(s)). Delete operation for two strings = `m + n - 2·LCS`. Shortest common supersequence length = `m + n - LCS`.' }
    ],

    deeper: [
      { title: 'Longest Common Subsequence (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/longest-common-subsequence-dp-4/', time: 'about 15 min', note: 'Recursion, memoization, the table and the space-optimized version side by side, a good way to see how the table falls out of the recursion.' },
      { title: 'Levenshtein distance (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Levenshtein_distance', time: 'about 10 min', note: 'The edit distance recurrence with the full matrix drawn out, plus uses in spell checkers and diff tools.' },
      { title: 'Manacher’s algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Longest_palindromic_substring', time: 'about 10 min', note: 'The O(n) linear-time answer to the longest palindromic substring, for the interviewer who asks “can you beat O(n²)?”.' },
      { title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', time: 'reference', note: 'The NeetCode 150 laid out by pattern; the 2-D Dynamic Programming row holds the string problems here. Some pages may ask you to sign in.' }
    ],

    detective: [
      { id: 'catalog-typos', decoys: ['two-pointers', 'dp-2d', 'greedy'],
        statement: 'Two clerks at an old library each typed the title of the same book into their own catalog, and the spellings disagree. The head librarian wants the cheapest fix: she may tap a key to add one letter anywhere, remove one letter from anywhere, or change one letter into another, and each tap costs the same. Titles are at most a few hundred letters. How many taps does it take, at minimum, to make the first clerk’s entry read exactly like the second’s?',
        why: 'The cues are **two strings**, a set of three single-letter operations with equal cost, and **“at minimum”**. The answer for the full titles depends on the answer for the titles with one fewer letter, so a table over prefix pairs (m by n cells, three neighbours each) gives O(m·n). Two pointers can’t work because a wrong move early can’t be undone, and greedy picks fail on inputs where the cheapest first tap is not part of the cheapest whole fix.' },
      { id: 'twin-journals', decoys: ['two-pointers', 'lis', 'dp-1d'],
        statement: 'Two hikers each kept a trail journal that lists the villages they passed through, in the order they passed them. The journals have different lengths, and some villages appear in only one of them. A historian wants the biggest set of villages that both hikers visited **in the same relative order**, though other villages may have been visited between two of them in either journal. She only needs how many villages are in that biggest set, and then, if time permits, which ones.',
        why: 'Phrases to notice: **two sequences**, the same relative order, gaps allowed on both sides, and the **largest** shared set. At each pair of positions the last villages either agree (extend the best answer for the shorter lists) or at least one is unused (the better of dropping either). That is a table over prefix pairs, O(m·n), and walking back through it answers the “which ones”. Two pointers fail because greedily taking the first shared village can block a longer match later.' },
      { id: 'routine-mixup', decoys: ['backtracking', 'two-pointers', 'dp-2d'],
        statement: 'A dance troupe has two routines, each a fixed list of moves, and a stage manager who stitched them together live on the night. The video log shows one long list of moves. Every move came from one of the two routines, each routine’s own moves appeared in their original order, and none were skipped or repeated. Given the two routines and the video log, was the performance possibly a live mix of these two? The log can be a few hundred moves long, and equal moves appear in both routines.',
        why: 'Two ordered lists must **merge** into a third without reordering or dropping anything. Because moves repeat, a greedy “whichever matches” choice can be wrong, and trying both branches blindly explodes. State is how many moves were used from each routine, so the log position is just their sum: a table with one boolean per (used from first, used from second) pair, true when the previous state was true and the next log move matches the routine it came from. O(m·n), after checking that the lengths add up.' }
    ]
  });
})();
