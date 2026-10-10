(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['string-dp'] = {
    primer: {
      kind: 'technique',
      what: `String DP is dynamic programming over **two strings**: \`dp[i][j]\` answers a question about the first i letters of one string and the first j of the other. Picture two fingers reading the strings left to right, and a grid that remembers the best answer for every pair of finger positions.`,
      does: `It solves "how similar are these two strings" questions: the longest common subsequence, the fewest edits to turn one into the other, counting how many ways one embeds in the other, interleaving, and wildcard or regex matching. Every cell is O(1), so the whole table is O(m x n).`,
      impl: `A grid of (m + 1) x (n + 1) built with \`[[0] * (n + 1) for _ in range(m + 1)]\`; row 0 and column 0 stand for the empty prefix, and the letters are \`a[i - 1]\` and \`b[j - 1]\`. Each cell reads its diagonal, up and left neighbours. Keep one row (plus a saved diagonal) when you only need the number. One-string palindrome questions use centre expansion instead.`,
      possibilities: `Longest common subsequence and substring, edit distance, distinct subsequences, interleaving strings, regex and wildcard matching, shortest common supersequence, minimum deletions to make two words equal, and longest palindromic subsequence (LCS with the reversed string).`
    },

    think: [
      {
        q: `What is the longest common subsequence of \`"abc"\` and \`"cba"\`? Say the length first, then explain what makes it so short.`,
        a: `The length is 1. Any single shared letter works (a, b or c), but no two letters appear in the same order in both strings: in "abc" a comes before b, in "cba" b comes before a, and so on. A subsequence keeps the original order, so reversed strings share almost nothing. This is also why the longest palindromic subsequence is the LCS of a string and its reverse.`
      },
      {
        q: `Edit distance between \`"ab"\` and \`"ba"\`. Before computing, guess: is it 1 or 2? Then check with the first row of the table, turning \`""\` into \`"ba"\`.`,
        a: `It is 2: replace both letters, or delete the a and insert an a at the end. A single edit cannot swap two letters. The first row of the table is 0, 1, 2: turning the empty string into "", "b", "ba" takes 0, 1, 2 inserts. Row 0 and column 0 are *not* all zero in edit distance, because building letters from nothing, or deleting letters to nothing, is not free.`
      },
      {
        q: `Longest common **substring** (letters must be adjacent) of \`"abcde"\` and \`"ace"\`. What is the answer, and what two things change in the subsequence table?`,
        a: `The answer is 1: the shared letters a, c, e never sit next to each other in both strings. Two changes: on a mismatch the cell becomes 0 (the run is broken) instead of the max of up and left, and the answer is the largest cell anywhere, not the bottom-right corner. A match still extends the diagonal, \`dp[i-1][j-1] + 1\`.`
      },
      {
        q: `Count how many ways \`"aa"\` appears as a subsequence of \`"aaa"\`. Why is the answer 3 and not 1?`,
        a: `Choose which a to skip: skip the first, the second or the third, giving three different position choices. The table counts positions, not distinct-looking strings. For each letter of the source you can always **skip** it (carry the count above), and if it matches the target letter you may also **use** it (add the diagonal). That sum of two options is why counting problems add where the longest-subsequence version takes a max.`
      },
      {
        q: `In regex matching, a star after a letter can mean zero copies. Why does the "zero copies" case look **two columns back** in the table?`,
        a: `A letter followed by a star acts as one unit that may vanish. Dropping both pattern symbols (the letter and the star) moves you from pattern column j to column j-2 without consuming any text, so you ask \`dp[i][j-2]\`. The "one more copy" case consumes one text letter and stays on the star, so it asks \`dp[i-1][j]\`. Two cases, two neighbours; a star never looks only one column back.`
      },
      {
        q: `You want the longest palindromic substring of \`"cbbd"\`. How many centres must you try, and which centre finds the answer?`,
        a: `A string of length 4 has 2n - 1 = 7 centres: each of the 4 letters and each of the 3 gaps between letters. The answer "bb" is found from the gap between the two b's, an *even* centre. If you only try letters as centres you would stop at a single "b". Expanding outwards from each centre while the ends match costs O(n) per centre, so O(n squared) total with no table.`
      }
    ],

    breakdown: [
      {
        title: `1. Two fingers, one decision at a time`,
        body: `Take the longest common subsequence of \`"abcde"\` and \`"ace"\`. Put one finger on each string. If the letters under the fingers are equal, you can use both and move both fingers. If they differ, at least one finger has to move without its letter being used. The brute force tries every subset of one string against the other, 2 to the power n. The waste: the same finger positions come up again and again. A table that remembers the answer for every pair of finger positions removes all the repetition.`
      },
      {
        title: `2. Define the state in words`,
        body: `Say: "\`dp[i][j]\` is the answer when the first string is cut to its first i letters and the second to its first j." The table has (m + 1) rows and (n + 1) columns, because row 0 and column 0 are the **empty** prefix. The letters live at \`a[i - 1]\` and \`b[j - 1]\`; mixing up those two index systems is the most common off-by-one in this topic. The answer is the bottom-right cell, the full strings. Each cell will only ever read three neighbours: diagonal, up and left.`
      },
      {
        title: `3. The recurrence: match or skip`,
        body: `Look at the last letters of the two prefixes. If \`a[i-1] == b[j-1]\`, the best subsequence uses them both: \`dp[i][j] = dp[i-1][j-1] + 1\`. If they differ, one of them is unused: either drop the last letter of a (\`dp[i-1][j]\`, up) or of b (\`dp[i][j-1]\`, left), and take the larger. Three neighbours, one rule per case. Other problems keep the same table and change only these two lines: edit distance copies the diagonal on a match, otherwise 1 + min of three; counting problems add instead of max.`
      },
      {
        title: `4. Base cases: the empty prefix`,
        body: `Row 0 compares nothing with the first j letters of b; column 0 compares the first i letters of a with nothing. For the longest common subsequence both are 0: nothing is shared with the empty string. For edit distance they are **not** 0: turning i letters into nothing costs i deletes, and building j letters from nothing costs j inserts, so row 0 is 0, 1, 2, ... and column 0 is 0, 1, 2, .... For counting subsequences, column 0 is all 1 (one way to build the empty target) and the rest of row 0 is 0. Fill the base first, then loop from (1, 1).`
      },
      {
        title: `5. Fill a table by hand`,
        body: `LCS of \`a = "abcde"\` (rows) and \`b = "ace"\` (columns).

| | "" | a | ac | ace |
|---|---|---|---|---|
| "" | 0 | 0 | 0 | 0 |
| a | 0 | 1 | 1 | 1 |
| ab | 0 | 1 | 1 | 1 |
| abc | 0 | 1 | 2 | 2 |
| abcd | 0 | 1 | 2 | 2 |
| abcde | 0 | 1 | 2 | 3 |

Row a: a matches a, diagonal 0 + 1 = 1, then max(up, left) carries it. Row abc, column ac: c matches c, so diagonal (row ab, column a) = 1, plus 1 = 2. Last row, column ace: e matches e, diagonal (row abcd, column ac) = 2, plus 1 = 3. The answer is 3.`
      },
      {
        title: `6. Walk back to see the actual letters`,
        body: `The table gives the length. To get the subsequence, start at the bottom-right cell and walk back. If the two letters match, that letter is part of the answer: record it and move diagonally. Otherwise move to the neighbour with the larger value (up or left), since that is where this cell's value came from. In the table above: (abcde, ace) e matches e, record e, go to (abcd, ac); d is not c, up has 2 and left has 1, go up to (abc, ac); c matches c, record c, go to (ab, a); then a is reached. Reverse what you recorded: "ace". You need the full table for this; a rolling row cannot walk back.`
      },
      {
        title: `7. Same table, other combine rules`,
        body: `**Edit distance** (insert, delete, replace). Equal letters copy the diagonal; otherwise 1 + the smallest of diagonal (replace), up (delete from a), left (insert into a). Hand check, \`"ab"\` to \`"ba"\`:

| | "" | b | ba |
|---|---|---|---|
| "" | 0 | 1 | 2 |
| a | 1 | 1 | 1 |
| ab | 2 | 1 | 2 |

Cell (a, b): letters differ, 1 + min(0, 1, 1) = 1. Cell (a, ba): a matches a, diagonal (empty, b) = 1. Cell (ab, ba): b differs from a, 1 + min(1, 1, 1) = 2. The answer is 2. **Counting** problems add the options; **yes/no** problems (interleaving, regex) OR them.`
      },
      {
        title: `8. Rolling row, cost, and how to spot it`,
        body: `A cell reads only the row above and its left neighbour, so one list is enough: before overwriting \`row[j]\` save it in \`up\`, it becomes the diagonal for the next column. Memory drops to O(min(m, n)), but you lose the walk back. Time is O(m x n): every cell does constant work. Spot it by: two strings, the words subsequence, edit, interleave, match or wildcard, and an answer for the full strings built from answers for slightly shorter prefixes. One string and palindromes? Use centre expansion, not a table.`,
        code: { py: `def lcs_len(a, b):
    row = [0] * (len(b) + 1)
    for x in a:
        diag = 0                              # dp[i-1][j-1] for the next column
        for j in range(1, len(b) + 1):
            up = row[j]                       # save before overwriting
            row[j] = diag + 1 if x == b[j - 1] else max(row[j], row[j - 1])
            diag = up
    return row[-1]` }
      }
    ],

    drills: [
      {
        title: `Longest common run`,
        q: `Given two strings, return the length of the longest **substring** (consecutive letters) that appears in both.\n\nExample: \`"abcdef"\` and \`"zcdemf"\` returns \`3\` ("cde"). \`"abc"\` and \`"xyz"\` returns \`0\`.`,
        hint: `Same grid as the subsequence table, but a mismatch resets the cell to 0, and the answer is the largest cell anywhere.`,
        how: `I restate it: the longest block of consecutive letters shared by both strings. This is the subsequence problem with one constraint, adjacency. Brute force compares every substring of one with every substring of the other, around O(m squared times n squared) or worse. The observation: a common substring that ends at positions i in a and j in b either extends a common substring ending one position earlier in both, or starts fresh. State: dp[i][j] is the length of the longest common substring that ends exactly at a[i-1] and b[j-1]. If the two letters match, dp[i][j] = dp[i-1][j-1] + 1; if they do not match, no common run can end here, so dp[i][j] = 0 (not a max of the neighbours, which would allow gaps). Because the best run can end anywhere, I keep a running maximum over all cells and return that, not the corner. Base: row 0 and column 0 are 0. Trace "abcdef" and "zcdemf": the letters c, d, e match on a diagonal: dp at (c, c) = 1, (d, d) = 2, (e, e) = 3, then (f, f) resets because the previous diagonal cell (e, m) is 0, so f gives 1. The best is 3. Edge cases: an empty string returns 0; identical strings return the length. Cost: O(m x n) time, O(m x n) space, or O(n) with a rolling row.`,
        code: { py: `def longest_common_run(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    best = 0
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                best = max(best, dp[i][j])
            # else stays 0: the run is broken
    return best` },
        explain: `A match extends the run that ended at the previous diagonal cell; a mismatch breaks it, so the cell is 0. The longest run can end at any cell, so we track the maximum. O(m x n) time and space.`,
        check: `assert longest_common_run("abcdef", "zcdemf") == 3
assert longest_common_run("abc", "xyz") == 0
assert longest_common_run("", "abc") == 0
assert longest_common_run("abc", "abc") == 3
assert longest_common_run("abcde", "ace") == 1
assert longest_common_run("aaaa", "aa") == 2
import random
for _ in range(300):
    a = ''.join(random.choice('abc') for _ in range(random.randint(0, 8)))
    b = ''.join(random.choice('abc') for _ in range(random.randint(0, 8)))
    best = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a) + 1):
            if a[i:j] in b: best = max(best, j - i)
    assert longest_common_run(a, b) == best`
      },
      {
        title: `Edit distance with prices`,
        q: `Turn string \`a\` into string \`b\` using three operations: insert a letter (cost \`ins\`), delete a letter (cost \`dele\`), replace a letter with a different one (cost \`rep\`). Return the minimum total cost.\n\nExample: \`weighted_edit("ab", "b", 2, 3, 4)\` returns \`3\` (delete the a). \`weighted_edit("", "abc", 2, 3, 4)\` returns \`6\`.`,
        hint: `Same grid as edit distance. The three neighbours now add three different prices, and the edges are i deletes and j inserts.`,
        how: `I restate it: edit distance where each kind of edit has its own price. Brute force tries every sequence of edits, exponential, with the same pair of suffixes repeated. The unit-cost version's table still applies; I only have to replace the +1 with the right price on each arrow. State: dp[i][j] is the cheapest cost to turn the first i letters of a into the first j letters of b. Look at the last letters. If they are equal, copying them is free: dp[i-1][j-1]. Otherwise there are three options: replace the last letter of a with the last letter of b, dp[i-1][j-1] + rep; delete the last letter of a, dp[i-1][j] + dele (I moved up, consuming an a letter); or insert the last letter of b, dp[i][j-1] + ins (I moved left, consuming a b letter). I take the minimum. On equal letters I take the free diagonal, since an edit there could never be cheaper than zero. Base: dp[i][0] = i * dele, dp[0][j] = j * ins. Trace "ab" to "b" with prices 2, 3, 4: dp[1][1] (a vs b) = min(replace 0 + 4 = 4, delete dp[0][1] + 3 = 5, insert dp[1][0] + 2 = 5) = 4; dp[2][1] (b vs b) = dp[1][0] = 3. Answer 3. Cost: O(m x n) time and space.`,
        code: { py: `def weighted_edit(a, b, ins, dele, rep):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        dp[i][0] = i * dele
    for j in range(1, n + 1):
        dp[0][j] = j * ins
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(dp[i - 1][j - 1] + rep,
                               dp[i - 1][j] + dele,
                               dp[i][j - 1] + ins)
    return dp[m][n]` },
        explain: `Each cell is the cheapest of the three last operations, each added to the cost of the smaller prefix pair; equal letters are copied free. The edge row and column are all deletes or all inserts. O(m x n) time and space.`,
        check: `assert weighted_edit("ab", "b", 2, 3, 4) == 3
assert weighted_edit("", "abc", 2, 3, 4) == 6
assert weighted_edit("abc", "", 2, 3, 4) == 9
assert weighted_edit("abc", "abc", 2, 3, 4) == 0
assert weighted_edit("kitten", "sitting", 1, 1, 1) == 3
assert weighted_edit("a", "b", 5, 5, 1) == 1
import random
from functools import lru_cache
for _ in range(200):
    a = ''.join(random.choice('abc') for _ in range(random.randint(0, 5)))
    b = ''.join(random.choice('abc') for _ in range(random.randint(0, 5)))
    I, D, R = random.randint(1, 5), random.randint(1, 5), random.randint(1, 5)
    @lru_cache(None)
    def f(i, j):
        if i == 0: return j * I
        if j == 0: return i * D
        best = min(f(i - 1, j) + D, f(i, j - 1) + I)
        best = min(best, f(i - 1, j - 1) + (0 if a[i - 1] == b[j - 1] else R))
        return best
    assert weighted_edit(a, b, I, D, R) == f(len(a), len(b))`
      },
      {
        title: `Build the shortest common supersequence`,
        q: `Return a shortest string that contains both \`a\` and \`b\` as subsequences. If several exist, any one is fine.\n\nExample: \`"abac"\` and \`"cab"\` could return \`"cabac"\` (length 5). \`"abc"\` and \`"abc"\` returns \`"abc"\`.`,
        hint: `The length is m + n - LCS. To build the string, fill the LCS table then walk back, emitting letters from both strings and sharing the matched ones.`,
        how: `I restate it: the shortest string that has both inputs hidden inside it in order. Brute force tries every merge of the two strings, exponential. The observation: letters that both strings share in a common subsequence only need to be written once, and everything else must be written out. So the length is m + n minus the length of the LCS, and the string is a merge of a and b where the LCS letters are shared. To build it I need the actual walk through the table, so I keep the full table. State: dp[i][j] is the LCS length of the first i letters of a and the first j of b. Then I walk back from (m, n). If the letters match, they are a shared letter: emit it once and move diagonally. If they differ, I must emit one of them: if the cell above is at least as large, the LCS did not need a[i-1], so emit a[i-1] and move up; otherwise emit b[j-1] and move left. When one string runs out, emit the rest of the other. The pieces come out in reverse, so I reverse at the end. Trace "abac" and "cab": the LCS has length 2 ("ab"), so the answer has length 4 + 3 - 2 = 5. Edge cases: one empty string returns the other; identical strings return the string. Cost: O(m x n) time and space.`,
        code: { py: `def shortest_supersequence(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    out = []
    i, j = m, n
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            out.append(a[i - 1])               # shared letter written once
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            out.append(a[i - 1])
            i -= 1
        else:
            out.append(b[j - 1])
            j -= 1
    while i > 0:
        out.append(a[i - 1])
        i -= 1
    while j > 0:
        out.append(b[j - 1])
        j -= 1
    return ''.join(reversed(out))` },
        explain: `The walk back emits each letter of a and b exactly once, except matched letters of one longest common subsequence, which are emitted once for both. The result has length m + n - LCS and both inputs appear in order inside it. O(m x n) time and space.`,
        check: `def is_subseq(s, t):
    it = iter(t)
    return all(c in it for c in s)
def lcs_len(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = dp[i-1][j-1] + 1 if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])
    return dp[-1][-1]
assert shortest_supersequence("abc", "abc") == "abc"
assert shortest_supersequence("", "abc") == "abc"
assert shortest_supersequence("abc", "") == "abc"
assert len(shortest_supersequence("abac", "cab")) == 5
import random
for _ in range(300):
    a = ''.join(random.choice('abc') for _ in range(random.randint(0, 7)))
    b = ''.join(random.choice('abc') for _ in range(random.randint(0, 7)))
    r = shortest_supersequence(a, b)
    assert is_subseq(a, r) and is_subseq(b, r)
    assert len(r) == len(a) + len(b) - lcs_len(a, b)`
      },
      {
        title: `Common subsequence of three strings`,
        q: `Given three strings, return the length of the longest subsequence that appears in all three.\n\nExample: \`"abcde"\`, \`"ace"\`, \`"aec"\` returns \`2\` ("ae" or "ac"). Three identical strings of length 3 return \`3\`.`,
        hint: `Add a third index. The match case needs all three last letters equal; otherwise try dropping the last letter of each string in turn.`,
        how: `I restate it: the longest subsequence common to three strings. Brute force enumerates the subsequences of the shortest string and tests each against the other two, exponential. The two-string table generalises by one more finger. State: dp[i][j][k] is the longest common subsequence of the first i letters of a, the first j of b and the first k of c. The table has (m+1)(n+1)(p+1) cells. Recurrence: if the last letters of all three prefixes are equal, they can be used together, so dp[i][j][k] = dp[i-1][j-1][k-1] + 1. Otherwise at least one string's last letter is unused, and I try dropping each in turn: dp[i-1][j][k], dp[i][j-1][k], dp[i][j][k-1], and take the largest. (Taking the largest of those three covers every case, since dropping two letters at once is already covered by dropping them one after the other.) Base: any cell with an index 0 is 0, the empty prefix. Trace "abcde", "ace", "aec": the a matches in all three, giving 1; then e and c appear in a different order in the third string, so only one of them can be used, giving 2. Edge cases: any empty string gives 0. Cost: O(m x n x p) time and space. Memory can drop to two layers along one axis if I only need the length.`,
        code: { py: `def lcs3(a, b, c):
    m, n, p = len(a), len(b), len(c)
    dp = [[[0] * (p + 1) for _ in range(n + 1)] for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            for k in range(1, p + 1):
                if a[i - 1] == b[j - 1] == c[k - 1]:
                    dp[i][j][k] = dp[i - 1][j - 1][k - 1] + 1
                else:
                    dp[i][j][k] = max(dp[i - 1][j][k], dp[i][j - 1][k], dp[i][j][k - 1])
    return dp[m][n][p]` },
        explain: `If all three last letters agree they extend the diagonal answer; otherwise one of the last letters is unused and the best of the three "drop one" neighbours is the answer. Every cell reads at most four earlier cells: O(m x n x p) time and space.`,
        check: `assert lcs3("abcde", "ace", "aec") == 2
assert lcs3("abc", "abc", "abc") == 3
assert lcs3("", "abc", "abc") == 0
assert lcs3("abc", "def", "ghi") == 0
assert lcs3("aaa", "aa", "aaaa") == 2
import random
from itertools import combinations
def subseqs(s):
    out = {""}
    for r in range(1, len(s) + 1):
        for comb in combinations(range(len(s)), r):
            out.add(''.join(s[i] for i in comb))
    return out
for _ in range(150):
    a, b, c = (''.join(random.choice('abc') for _ in range(random.randint(0, 6))) for _ in range(3))
    common = subseqs(a) & subseqs(b) & subseqs(c)
    assert lcs3(a, b, c) == max(len(x) for x in common)`
      }
    ],

    how: {
      5: `I restate it: given a string, return its longest substring that reads the same forwards and backwards. Brute force checks every substring: O(n squared) of them, each checked in O(n), so O(n cubed). The observation: a palindrome mirrors around its centre, so instead of testing whole substrings I can grow outwards from a centre while the two end letters agree. There are 2n - 1 centres: each letter (for odd lengths) and each gap between two letters (for even lengths). From each centre I set l and r (equal for odd, adjacent for even) and move them apart while s[l] == s[r]. When it stops, the palindrome is s[l+1 .. r-1] with length r - l - 1, and I keep the longest, updating only when strictly longer so ties keep the leftmost. A DP table pal[i][j] gives the same time but O(n squared) memory, so centre expansion is the better answer here, and Manacher's algorithm reaches O(n) as a follow-up. Trace "cbbd": centre at the first b grows to just "b"; the gap between the two b's matches (b, b) then fails at c versus d, giving "bb" with length 2; the answer is "bb". Edge cases: a single letter, an all-same string (expansion runs the whole length), and even-length palindromes, which are missed if you only try letter centres. Cost: O(n squared) time, O(1) extra space.`,
      647: `I restate it: count every substring that is a palindrome, counting equal substrings at different positions separately. Brute force checks every substring, O(n cubed). The observation is the same as the longest-palindrome problem, but now every successful expansion step is one more palindrome. Every palindromic substring has exactly one centre, so counting per centre never double counts. For each of the 2n - 1 centres (a letter, or a gap between two letters), start with l and r on the centre and, while s[l] == s[r] and both are in range, add 1 to the count and move l left and r right. Each time the loop body runs, the current s[l..r] is a palindrome. Trace "aaa": the odd centre at index 0 gives 1 ("a"); the gap between 0 and 1 gives 1 ("aa"); the centre at 1 gives 2 ("a" and "aaa"); the gap between 1 and 2 gives 1; the centre at 2 gives 1; the last gap is out of range. Total 1 + 1 + 2 + 1 + 1 = 6. Edge cases: all different letters give n; the empty string gives 0. The DP alternative marks pal[i][j] true when the ends match and the inside is a palindrome, at O(n squared) memory. Cost: O(n squared) time, O(1) space.`,
      1143: `I restate it: given two strings, return the length of the longest sequence of letters that appears in both in the same order, gaps allowed. Brute force generates every subsequence of one string and checks it in the other: 2 to the power n subsequences. The bottleneck is that the same pairs of prefixes get compared repeatedly. State: dp[i][j] is the answer for the first i letters of text1 and the first j letters of text2, with row 0 and column 0 being 0 (an empty prefix shares nothing). Look at the last letters. If text1[i-1] equals text2[j-1], the best sequence can use both: dp[i-1][j-1] + 1. If they differ, one of the two letters is unused, so the answer is the better of dropping the last letter of the first string (dp[i-1][j]) or of the second (dp[i][j-1]). The answer is dp[m][n]. Trace "abcde" and "ace": the table's last row reads 0, 1, 2, 3, so the answer is 3 ("ace"). To recover the letters I would walk back from the corner. Edge cases: empty strings give 0; repeated letters ("aa" and "aaa" gives 2). Cost: O(m x n) time and space, and O(min(m, n)) space with a rolling row if I only need the length.`,
      97: `I restate it: given s1, s2 and s3, can s3 be formed by weaving the letters of s1 and s2 together without reordering either? Brute force tries every merge, exponential, and revisits the same (letters used from s1, letters used from s2) pairs. A first check: if the lengths do not add up, answer false right away. Then the observation: after using i letters of s1 and j letters of s2, I have built exactly the first i + j letters of s3, so the pair (i, j) is the whole state. State: dp[i][j] is true when s3[:i+j] is a weave of s1[:i] and s2[:j]. The last letter of that prefix came from s1 or from s2. From s1: dp[i-1][j] must be true and s1[i-1] must equal s3[i+j-1]. From s2: dp[i][j-1] must be true and s2[j-1] must equal s3[i+j-1]. Either one suffices. Picture a path from the top-left to the bottom-right moving down for s1 letters and right for s2 letters. Base: dp[0][0] is true; the first row and column use only one string. Trace s1 "ab", s2 "cd", s3 "acbd": the path a (down), c (right), b (down), d (right) gives true. Each cell reads only its upper and left cells, so one row suffices. Cost: O(m x n) time, O(n) space.`,
      115: `I restate it: count how many ways the string t appears as a subsequence of s, where different position choices count as different ways. Brute force tries every subset of positions of s, exponential. State: dp[i][j] is the number of ways the first j letters of t appear as a subsequence of the first i letters of s. For the next letter of s there are two options. Always allowed: skip it, which keeps dp[i-1][j]. If it equals t[j-1], I may also use it to match that letter of t, which adds dp[i-1][j-1]. Because I am counting, both options are added rather than compared. Base: dp[i][0] = 1 for every i, since there is one way to build the empty target (choose nothing), and dp[0][j] = 0 for j > 0. Since each row reads only the row above, I use one list and loop j from high to low, so that dp[j-1] still holds the previous row when I read it. Trace s "aaa", t "aa": the list starts [1, 0, 0]; after the first a it is [1, 1, 0]; after the second [1, 2, 1]; after the third [1, 3, 3]. The answer is 3. Edge cases: an empty t gives 1; t longer than s gives 0. Counts can be large, so languages with fixed-width integers may need a 64-bit type or a modulus. Cost: O(m x n) time, O(n) space.`,
      72: `I restate it: turn word1 into word2 using insert, delete or replace, one letter per step, and return the fewest steps. Brute force tries every sequence of edits, exponential. State: dp[i][j] is the fewest edits to turn the first i letters of word1 into the first j letters of word2. The edges are cheap to fill: turning i letters into nothing costs i deletes, and building j letters from nothing costs j inserts, so column 0 is 0, 1, 2, ... and row 0 is the same. Look at the last letters. If they are equal there is nothing to do for them, so dp[i][j] = dp[i-1][j-1]. Otherwise I pay one edit and choose the cheapest of three: replace, from the diagonal dp[i-1][j-1]; delete a letter of word1, from above dp[i-1][j]; insert a letter of word2, from the left dp[i][j-1]. So dp[i][j] = 1 + min of the three. Trace "cat" to "cut": c matches c (diagonal 0), a differs from u (1 + min = 1), t matches t (copy the diagonal 1). Answer 1. For "horse" to "ros" the table's corner is 3. To print the edits I would keep the table and walk back from the corner, following whichever neighbour produced each value. Edge cases: either word empty gives the other's length. Cost: O(m x n) time and space, O(min(m, n)) with a rolling row for the count only.`,
      10: `I restate it: match a whole text s against a pattern p where a dot matches any one letter and a star means zero or more copies of the letter before it. The match must cover the entire text. Brute force recurses: on a star try zero copies, or consume a letter and stay on the star, and without memory it is exponential on patterns like a*a*a*b. State: dp[i][j] is true when the first i letters of the text match the first j symbols of the pattern. dp[0][0] is true. For a normal symbol (a letter or a dot), the letters must agree and the rest must match: dp[i][j] = dp[i-1][j-1] if p[j-1] equals s[i-1] or is a dot. For a star, it pairs with the symbol before it and has two cases: zero copies, dp[i][j-2] (drop the pair); or one more copy, which needs the symbol before the star to match s[i-1] and dp[i-1][j] to be true (the star still available after one fewer text letter). Row 0 needs separate filling: the empty text matches a pattern only when it is built of pairs like a*, so dp[0][j] = dp[0][j-2] when p[j-1] is a star. Trace "aa" against "a*": row 0 is true, false, true; "a" gives true at the star via the one-more-copy case from dp[0][2]; "aa" gives true again from dp[1][2]. Edge cases: an empty text with pattern "a*" is true; a pattern cannot start with a star. Cost: O(m x n) time and space.`,
      516: `I restate it: find the length of the longest palindromic subsequence, letters in order with gaps allowed. Brute force generates all subsequences and checks each, exponential. The observation is a reduction: a palindrome reads the same in both directions, so a palindromic subsequence of s is a subsequence of s that is also a subsequence of the reversed s. Conversely, the longest common subsequence of s and its reverse can always be chosen to be symmetric, so it has the same length as the longest palindromic subsequence. So the answer is the LCS of s and s reversed. I reuse the table from the common subsequence problem: dp[i][j] is the LCS of the first i letters of s and the first j letters of reversed s, with a match giving the diagonal plus one and a mismatch giving the larger of up and left. Trace "bbbab": the reverse is "babbb" and the LCS is "bbbb", length 4. Since I only need the number, I roll the table to one row with a saved diagonal, as in my stored solution. Edge cases: a single letter gives 1; all different letters give 1. A direct interval DP also exists, dp[i][j] over substrings, but the reduction is shorter to code and explain. Cost: O(n squared) time, O(n) space with a rolling row.`,
      583: `I restate it: given two words, delete letters from either (only deletions allowed) until both words are equal, using the fewest deletions. Brute force tries every set of deletions, exponential. The observation: what is left in both words after the deletions must be the same string, and it must be a subsequence of each word (deleting letters keeps the order of the rest). To delete as little as possible I want to keep as much as possible, so I keep the longest common subsequence. If the LCS has length L, then I delete m - L letters from the first word and n - L from the second, a total of m + n - 2L. So the whole problem is the LCS table. State: dp[i][j] is the LCS of the first i letters of word1 and the first j of word2, with a match giving the diagonal plus one and a mismatch giving the max of up and left. Trace "sea" and "eat": the LCS is "ea", length 2, so the answer is 3 + 3 - 4 = 2: delete s from "sea" and t from "eat". Edge cases: identical words give 0; no common letter gives m + n; an empty word gives the other's length. Cost: O(m x n) time, O(min(m, n)) space with a rolling row since only the final length is needed.`,
      44: `I restate it: match a text against a pattern in which a question mark matches exactly one letter and a star matches any run of letters, including none. The match must cover the entire text. A DP table works: dp[i][j] is true when the first i text letters match the first j pattern symbols, and a star cell is dp[i-1][j] (the star absorbs one more letter) or dp[i][j-1] (the star matches nothing). That is O(m x n) time and space. The stored solution uses a leaner two-pointer approach: walk through both strings, and when a letter matches or the pattern has a question mark, advance both. When I meet a star, I remember its position and the current text position, and tentatively let it match nothing by advancing only the pattern pointer. On a later mismatch, I go back to the last star and make it absorb one more text letter, moving the remembered text position forward by one. Only the most recent star ever needs to be revisited, because earlier stars can stay at their smallest match. Once the text is used up, the rest of the pattern must be only stars. Trace "adceb" against "*a*b": the first star is remembered, a matches a, the second star is remembered, then d fails against b so the second star absorbs d, then c, then e, and finally b matches b, with the pattern used up: true. Edge cases: an empty text matches "" and "*"; a pattern with no stars needs equal lengths. Cost: O(m x n) worst case, close to O(m + n) typically, O(1) space.`
    }
  };
})();
