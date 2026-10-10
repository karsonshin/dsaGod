(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['string-algos'] = {
    primer: {
      kind: 'technique',
      what: `String algorithms search inside text without re-reading letters you already matched. The key structure is the **failure table** (also called the **prefix function** or \`lps\`): for each prefix of a string, the length of its longest **border**, a proper prefix that is also a suffix of that prefix. Think of it as a bookmark telling you how far back to rewind after a mismatch.`,
      does: `Finds a pattern of length m in a text of length n in **O(n + m)** instead of O(n·m). The same table answers border, period and "is this a repeated block" questions in O(n). The **Z-function** gives, for every position, how long a prefix starts there; **Manacher** gives every palindrome radius in O(n).`,
      impl: `Build \`lps\` with two indices: \`k\` is the length of the border being extended, and on a mismatch you set \`k = lps[k-1]\` instead of restarting. Searching is the same loop over the text with \`j\` for the matched count. A rolling hash is the alternative: compare number fingerprints of windows. In Python, \`text.find(pat)\` is the built-in; write the table yourself only when the question needs the table.`,
      possibilities: `Find all occurrences of a pattern, detect a string built from a repeated block, find the shortest palindrome by adding letters at the front, find the longest prefix that is also a suffix, count how often each prefix appears, find the longest palindromic substring in O(n), and match many windows with a hash.`
    },

    think: [
      {
        q: `Compute the failure table (\`lps\`) of \`"abab"\` in your head. What do the last two entries mean in plain words?`,
        a: `\`lps = [0, 0, 1, 2]\`. At index 2 the string so far is \`"aba"\`: the prefix \`"a"\` is also its suffix, so the border has length 1. At index 3 the string is \`"abab"\`: \`"ab"\` is both a prefix and a suffix, so 2. The aha: the last entry is the longest border of the whole string, and \`n - lps[-1] = 2\` is the length of the repeating block \`"ab"\`.`
      },
      {
        q: `You matched 5 letters of the pattern \`"aabaaab"\` and the 6th letter of the text does not match. Instead of restarting at 0, how many letters do you keep, and why that many?`,
        a: `The five letters matched are \`"aabaa"\`. Its longest border is \`"aa"\` (\`lps[4] = 2\`), so you keep 2 letters and compare the same text letter against pattern position 2. Why safe: the last 2 letters you read are also the first 2 of the pattern, so no earlier restart could have matched, and any restart in between would have to start inside a shorter border. Keeping the longest border never skips a real match.`
      },
      {
        q: `The search code has a \`while\` inside a \`for\`. Why is it still O(n + m) and not O(n·m)?`,
        a: `Count total movement. \`j\` goes up by at most 1 per text letter. Every fall-back (\`j = lps[j-1]\`) strictly lowers \`j\`, and \`j\` can never go below 0, so the total number of fall-backs is at most the total number of rises, at most n. That is an amortized argument: the work of one slow step is paid for by earlier fast steps.`
      },
      {
        q: `Is \`"ababa"\` a repetition of a smaller block? It has \`lps[-1] = 3\`, so the period is \`5 - 3 = 2\`. Does that settle it?`,
        a: `No. The string repeats every 2 letters, but 2 does not divide 5, so the last block is cut off (\`"ab" "ab" "a"\`). A repetition needs the period to divide n **and** \`lps[-1] > 0\`. For \`"abab"\`: period 2, 4 % 2 = 0, yes. A period is not a repetition; checking the divisor is the whole trick.`
      },
      {
        q: `To find the shortest palindrome by adding letters in front of \`"abcd"\`, we run the prefix function on \`"abcd#dcba"\`. What would go wrong without the \`#\`?`,
        a: `Without it the joined string is \`"abcddcba"\`, and for \`"abcd"\` the border happens to be 1, which is right. But for \`"aaaa"\` you would get \`"aaaaaaaa"\` with border 7, longer than the original string, because the border runs across the join and gives nonsense. The separator, a letter in neither half, caps every border at the length of the first half.`
      },
      {
        q: `Which tool: "does any of these 10,000 words appear as a substring of a 100-letter sentence"? KMP, rolling hash, or something else?`,
        a: `With many patterns, running KMP 10,000 times costs 10,000 × (100 + m). Better: put the sentence's substrings of each word length into a set using rolling hashes, or build a trie of the words and walk the sentence (Aho-Corasick is KMP's failure links on a trie). One pattern: KMP. Many patterns or many windows compared with each other: hashing or a trie.`
      }
    ],

    breakdown: [
      {
        title: `1. The slow search and what it wastes`,
        body: `Search for \`"aabaaab"\` in \`"aabaabaaab"\`. The naive way tries every start. Start 0 matches \`"aabaa"\` (5 letters) and fails on the 6th. The naive code now throws everything away and starts at index 1, re-reading the letters \`"abaa..."\` it just read. Worst case that is n·m comparisons (text all \`a\`, pattern \`aaa...b\`). The waste: after a failure we already **know** the last 5 text letters, because they equal the first 5 pattern letters. We can reason about the pattern alone, before seeing any text.`
      },
      {
        title: `2. Borders: the one definition you need`,
        body: `A **border** of a string is a non-empty proper prefix that is also a suffix. \`"aabaa"\` has border \`"aa"\` (starts the string, ends the string) and border \`"a"\`. Longest is \`"aa"\`, length 2. After matching \`"aabaa"\` and failing, the border tells you the only restart that can still work: the pattern's first 2 letters equal the text letters you just read, so keep 2 matched and carry on. Any longer carry-over is impossible (it would not be a border), and any shorter one is found by taking the border of the border.`
      },
      {
        title: `3. Build the table by hand`,
        body: `\`lps[i]\` = longest border length of \`pat[0..i]\`. Pattern \`aabaaab\` (indices 0 to 6). Keep \`k\`, the current border length.\n\n- i=1 \`a\`: matches \`pat[0]\`, k=1. lps=1.\n- i=2 \`b\`: vs \`pat[1]=a\` no, fall back k=lps[0]=0; vs \`pat[0]\` no. lps=0.\n- i=3 \`a\`: matches pat[0], k=1.\n- i=4 \`a\`: matches pat[1], k=2.\n- i=5 \`a\`: vs pat[2]=b no, fall back k=lps[1]=1; vs pat[1]=a yes, k=2.\n- i=6 \`b\`: matches pat[2], k=3.\n\nResult \`[0,1,0,1,2,2,3]\`. The fall-back at i=5 is the whole idea: no restart, just the next shorter border.`,
        code: { py: `def prefix_function(s):
    lps = [0] * len(s)
    k = 0                                  # length of the border being extended
    for i in range(1, len(s)):
        while k > 0 and s[i] != s[k]:
            k = lps[k - 1]                 # fall back to the next shorter border
        if s[i] == s[k]:
            k += 1
        lps[i] = k
    return lps` }
      },
      {
        title: `4. Why falling back to lps[k-1] is right`,
        body: `At i=5 we had matched \`"aa"\` (k=2) and the next letter \`a\` fails against \`pat[2]=b\`. The string \`"aa"\` itself has border \`"a"\`, so \`lps[1] = 1\`. Any border of \`pat[0..5]\` that ends with our new letter must be a border of the earlier part plus one letter, so the candidates are exactly the chain: 2, then \`lps[1]=1\`, then \`lps[0]=0\`. Trying them from longest to shortest finds the longest border. Use \`lps[k-1]\`, not \`lps[k]\`: the table is indexed by the last matched letter, which is \`k-1\`.`
      },
      {
        title: `5. Search the text with the same loop`,
        body: `Now scan text \`aabaabaaab\` with \`j\` = matched pattern letters, table \`[0,1,0,1,2,2,3]\`. i=0..4 build j=5 (\`aabaa\`). i=5 is \`b\` vs \`pat[5]=a\`: mismatch, \`j = lps[4] = 2\`, then \`b\` vs \`pat[2]=b\` matches, j=3. i=6 \`a\` j=4, i=7 \`a\` j=5, i=8 \`a\` j=6, i=9 \`b\` j=7=m. Match ends at 9, so it starts at 9-7+1 = 3. The text index only ever moved forward. For all matches, record the hit and set \`j = lps[m-1]\` to allow overlaps.`
      },
      {
        title: `6. Cost and the amortized argument`,
        body: `Building the table: O(m). Searching: O(n). Total **O(n + m)** time, O(m) extra space. The inner \`while\` looks dangerous, but \`k\` (or \`j\`) rises by at most 1 per outer step and every fall-back lowers it, so across the whole run falls are at most rises. Say that sentence in the interview: "each letter raises the matched count by one at most, a fall-back only spends what was earned, so it is linear." Contrast with naive: O(n·m) worst case, close to O(n) on random text.`
      },
      {
        title: `7. The table answers more than search`,
        body: `Three facts from the last value \`lps[n-1]\`. (1) It is the longest border of the whole string: LeetCode-style "longest happy prefix". (2) \`n - lps[n-1]\` is the shortest period, and the string is a repeated block exactly when this divides n and \`lps[n-1] > 0\`. (3) For the shortest palindrome by adding letters in front, take the table of \`s + "#" + reverse(s)\`: the last value is the length of the longest palindromic prefix. Interview cue: any question about prefix-equals-suffix, periods, or repeated blocks is a table question, not a search question.`
      },
      {
        title: `8. The Z-function, the sibling`,
        body: `\`z[i]\` = how many letters starting at i match the beginning of the string. For \`aabxaab\`: \`z = [0,1,0,0,3,1,0]\` (at index 4 the text \`aab\` matches the first 3 letters). Search by computing z of \`pattern + "#" + text\`: every position with \`z == len(pattern)\` is a match. It keeps a window \`[l, r)\` of the rightmost known match with the prefix and copies values from the mirror position inside it, extending only past \`r\`, so it is O(n) too. Pick Z when you think "how much of the start matches here", the prefix function when you think "border of what I matched so far". They carry the same information.`
      }
    ],

    drills: [
      {
        title: `All overlapping occurrences`,
        q: `Given \`text\` and a non-empty \`pat\`, return the sorted list of all start indices where \`pat\` occurs, **including overlapping** ones. Example: \`find_all("aaaa", "aa")\` returns \`[0, 1, 2]\`, and \`find_all("abcabcab", "abc")\` returns \`[0, 3]\`. Do it in O(n + m).`,
        hint: `After a full match, do not reset the matched count to 0. What is the longest part of the match that could start the next one?`,
        how: `I restate it: scan a text and report every place the pattern starts, with overlaps counted, so "aa" inside "aaaa" gives 0, 1 and 2. Brute force tries every start and compares up to m letters, O(n·m), which is too slow if the text and pattern are both long and repetitive. The bottleneck is re-reading text letters after a partial match. The unlock is the failure table: after matching j letters and failing, only the longest border of those j letters is still useful. So I build the prefix function of the pattern, then scan the text with a counter j. On each letter, while j is positive and the letters differ I fall back to lps[j-1], then if they match I add one to j. The twist for "all matches": when j reaches m I record i-m+1 and then set j = lps[m-1] instead of 0, because the end of this match can be the start of the next one. Trace on "aaaa" with "aa": lps = [0,1]. i=0 j=1; i=1 j=2=m, record 0, j=lps[1]=1; i=2 j=2, record 1, j=1; i=3 j=2, record 2. Output [0,1,2], correct. Edge cases: pattern longer than text gives an empty list; an empty pattern is excluded by the statement, but I return [] defensively. Cost: O(n + m) time because the matched count never falls more than it has risen, and O(m) space for the table.`,
        code: { py: `def find_all(text, pat):
    if not pat:
        return []
    m = len(pat)
    lps = [0] * m
    k = 0
    for i in range(1, m):
        while k and pat[i] != pat[k]:
            k = lps[k - 1]
        if pat[i] == pat[k]:
            k += 1
        lps[i] = k
    res, j = [], 0
    for i, ch in enumerate(text):
        while j and ch != pat[j]:
            j = lps[j - 1]
        if ch == pat[j]:
            j += 1
        if j == m:
            res.append(i - m + 1)
            j = lps[j - 1]              # keep the border so overlaps are found
    return res`, js: `function findAll(text, pat) {
  if (!pat) return [];
  const m = pat.length, lps = new Array(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k && pat[i] !== pat[k]) k = lps[k - 1];
    if (pat[i] === pat[k]) k++;
    lps[i] = k;
  }
  const res = [];
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    while (j && text[i] !== pat[j]) j = lps[j - 1];
    if (text[i] === pat[j]) j++;
    if (j === m) { res.push(i - m + 1); j = lps[j - 1]; }
  }
  return res;
}` },
        explain: `Correct because, after any prefix of the text, \`j\` is the length of the longest pattern prefix that is a suffix of the text read so far, and the fall-back chain enumerates exactly the borders. Setting \`j = lps[m-1]\` after a match is the same rule applied to the full pattern. Time O(n + m), space O(m).`,
        check: `assert find_all("aaaa", "aa") == [0, 1, 2]
assert find_all("abcabcab", "abc") == [0, 3]
assert find_all("abc", "abcd") == []
assert find_all("", "a") == []
assert find_all("a", "a") == [0]
assert find_all("ababababa", "aba") == [0, 2, 4, 6]
assert find_all("mississippi", "issi") == [1, 4]
import random
random.seed(3)
for _ in range(300):
    t = "".join(random.choice("ab") for _ in range(random.randint(0, 12)))
    p = "".join(random.choice("ab") for _ in range(random.randint(1, 4)))
    brute = [i for i in range(len(t) - len(p) + 1) if t[i:i + len(p)] == p]
    assert find_all(t, p) == brute`
      },
      {
        title: `Every border of a string`,
        q: `A **border** of \`s\` is a non-empty proper prefix that is also a suffix. Return the lengths of **all** borders in increasing order. Example: \`all_borders("abacaba")\` returns \`[1, 3]\` (\`"a"\` and \`"aba"\`); \`all_borders("aaaa")\` returns \`[1, 2, 3]\`; \`all_borders("abc")\` returns \`[]\`.`,
        hint: `The longest border is one table value. Every other border is a border of that border. Follow the chain.`,
        how: `I restate it: list every length L, from 1 to n-1, where the first L letters equal the last L letters. Brute force tests each L by slicing and comparing, O(n²) in the worst case, which is fine for tiny strings but not for 10^5 letters. The observation: if B is the longest border, then any shorter border C is a prefix of s and a suffix of s, and since C is shorter than B it is also a suffix of B and a prefix of B, so it is a border of B. That means the borders form a chain: longest, its longest border, and so on until zero. The prefix function stores the longest border of every prefix, and the longest border of s is the last value. So I build the table, start at v = lps[n-1], and repeatedly record v and move to lps[v-1] until v reaches 0. Trace on "abacaba": table is [0,0,1,0,1,2,3]. Start v=3 (border "aba"), next lps[2]=1 (border "a"), next lps[0]=0 stop. Collected [3,1], reversed to [1,3]. Edge cases: one letter has no borders (lps = [0]) and returns []; an all-same string gives every length below n. Cost: building the table is O(n), the chain walk is at most n steps, total O(n) time and O(n) space.`,
        code: { py: `def all_borders(s):
    n = len(s)
    lps = [0] * n
    k = 0
    for i in range(1, n):
        while k and s[i] != s[k]:
            k = lps[k - 1]
        if s[i] == s[k]:
            k += 1
        lps[i] = k
    out = []
    v = lps[-1] if n else 0
    while v:
        out.append(v)                  # a border: the chain of borders of borders
        v = lps[v - 1]
    return out[::-1]` },
        explain: `Every border of \`s\` is a border of the longest border, so repeatedly applying \`lps\` visits all of them, longest first; reversing sorts ascending. Time O(n), space O(n).`,
        check: `assert all_borders("abacaba") == [1, 3]
assert all_borders("aaaa") == [1, 2, 3]
assert all_borders("abc") == []
assert all_borders("a") == []
assert all_borders("") == []
assert all_borders("abab") == [2]
import random
random.seed(5)
for _ in range(300):
    s = "".join(random.choice("ab") for _ in range(random.randint(0, 10)))
    brute = [L for L in range(1, len(s)) if s[:L] == s[len(s) - L:]]
    assert all_borders(s) == brute`
      },
      {
        title: `How often does each prefix appear?`,
        q: `For a string \`s\` of length n, return a list \`ans\` of length n where \`ans[L-1]\` is the number of times the prefix \`s[:L]\` occurs as a substring of \`s\` (overlaps counted). Example: \`prefix_counts("aba")\` returns \`[2, 1, 1]\` (\`"a"\` twice, \`"ab"\` once, \`"aba"\` once); \`prefix_counts("aaa")\` returns \`[3, 2, 1]\`. Target O(n).`,
        hint: `A prefix of length L ends at position i exactly when it is a border of s[:i+1]. Count how many positions have each border length, then pass counts down the border chain.`,
        how: `I restate it: for each prefix length L, count the substring occurrences of that prefix. Brute force counts each prefix by sliding it over the string: O(n) per prefix times n prefixes times the comparison, O(n³) or O(n²) with care, too slow. Key observation: an occurrence of the prefix of length L ending at position i means s[:L] is a suffix of s[:i+1], which is to say L is one of the border lengths of s[:i+1], either the longest one lps[i] or a border of that, down the chain. So I first count cnt[v] = how many positions have longest border exactly v. Then an occurrence counted for length v is also an occurrence of every shorter border of that prefix: the length v prefix has border lps[v-1], so I push counts down, processing lengths from n-1 down to 1 and adding cnt[v] to cnt[lps[v-1]]. Finally add 1 for the prefix's own appearance as itself at position L-1. Trace "aaa": lps [0,1,2]. cnt[0]=1, cnt[1]=1, cnt[2]=1. Push down: v=2 adds to cnt[1], which becomes 2; v=1 adds 2 to cnt[0], which becomes 3. ans[L-1] = cnt[L] + 1 for L=1..3 gives [3,2,1]. Edge cases: empty string returns []; no repeats gives all 1s. Cost: O(n) time, O(n) space.`,
        code: { py: `def prefix_counts(s):
    n = len(s)
    lps = [0] * n
    k = 0
    for i in range(1, n):
        while k and s[i] != s[k]:
            k = lps[k - 1]
        if s[i] == s[k]:
            k += 1
        lps[i] = k
    cnt = [0] * (n + 1)
    for v in lps:
        cnt[v] += 1                       # positions whose longest border is v
    for v in range(n - 1, 0, -1):
        cnt[lps[v - 1]] += cnt[v]         # an occurrence of a prefix is one of its border too
    return [cnt[L] + 1 for L in range(1, n + 1)]   # +1: the prefix itself at its own spot` },
        explain: `Occurrences of the length-L prefix correspond to positions where L is in the border chain; counting longest borders and pushing each count down the chain (long to short) credits every border once. The +1 is the prefix's own occurrence. Time O(n), space O(n).`,
        check: `assert prefix_counts("aba") == [2, 1, 1]
assert prefix_counts("aaa") == [3, 2, 1]
assert prefix_counts("") == []
assert prefix_counts("abc") == [1, 1, 1]
assert prefix_counts("a") == [1]
import random
random.seed(7)
for _ in range(300):
    s = "".join(random.choice("ab") for _ in range(random.randint(0, 10)))
    brute = [sum(1 for i in range(len(s) - L + 1) if s[i:i + L] == s[:L]) for L in range(1, len(s) + 1)]
    assert prefix_counts(s) == brute`
      },
      {
        title: `Shortest palindrome by adding at the back`,
        q: `You may only append letters to the **end** of \`s\`. Return the shortest palindrome you can build this way. Example: \`pal_append("abcd")\` returns \`"abcdcba"\`; \`pal_append("aab")\` returns \`"aabaa"\`; \`pal_append("aba")\` returns \`"aba"\`; \`pal_append("")\` returns \`""\`. Target O(n).`,
        hint: `The original string stays as the front of the answer. Which part of it can stay as the middle? Think of the longest palindromic suffix and how a prefix-function run over a joined string finds it.`,
        how: `I restate it: only the end of the string can grow, so the original is the head of the result and I add the fewest letters after it. Brute force: for each suffix from longest to shortest, test whether it is a palindrome, and the first palindromic suffix tells me how many letters to mirror. That is O(n²) in the worst case, too slow for long inputs. The observation: if s ends with a palindrome of length L, the letters before it, s[:n-L], must be mirrored after, so the answer is s plus the reverse of s[:n-L]. To minimize the added letters I want the longest palindromic suffix. This is the shortest-palindrome-at-the-front problem reflected in a mirror. Build t = reverse(s) + "#" + s and take its prefix function. A border of t is a prefix of reverse(s) that equals a suffix of s; a prefix of reverse(s) is the reverse of a suffix of s, so the border is a suffix that equals its own reverse, a palindrome. The last value of the table is the longest such suffix. The separator keeps borders from crossing the join. Trace "aab": t = "baa#aab". Last border is "b" (prefix b equals suffix b), so L=1 and the answer is "aab" + reverse("aa") = "aabaa". Edge cases: an empty string returns itself, a palindrome has L=n and adds nothing. Cost: O(n) time and space.`,
        code: { py: `def pal_append(s):
    n = len(s)
    t = s[::-1] + "#" + s
    lps = [0] * len(t)
    k = 0
    for i in range(1, len(t)):
        while k and t[i] != t[k]:
            k = lps[k - 1]
        if t[i] == t[k]:
            k += 1
        lps[i] = k
    longest = lps[-1]                  # longest palindromic suffix of s
    return s + s[:n - longest][::-1]` },
        explain: `The last border of \`reverse(s) + "#" + s\` is the longest suffix of \`s\` that equals its reverse. Keeping it as the tail of the original and mirroring the rest gives the shortest append-only palindrome. Time and space O(n).`,
        check: `assert pal_append("abcd") == "abcdcba"
assert pal_append("aab") == "aabaa"
assert pal_append("aba") == "aba"
assert pal_append("") == ""
assert pal_append("a") == "a"
assert pal_append("ab") == "aba"
import random
random.seed(11)
for _ in range(300):
    s = "".join(random.choice("ab") for _ in range(random.randint(0, 9)))
    r = pal_append(s)
    assert r == r[::-1] and r.startswith(s)
    cands = [s + s[:i][::-1] for i in range(len(s) + 1)]
    shortest = min((c for c in cands if c == c[::-1]), key=len)
    assert r == shortest`
      }
    ],

    how: {
      28: `I restate it: return the first index where the needle sits inside the haystack, or -1. The brute force tries every start and compares letter by letter. That is O(n·m) in the worst case, for example a haystack of all a's and a needle of a's ending in b. With the given limits it would pass, and in real code I would call find, but the follow-up is always "can you avoid re-reading the text". The bottleneck is that after a partial match of j letters fails I restart one position later and re-read letters I already know. The key observation is that those j matched letters are the needle's own first j letters, so I can work out from the needle alone how many of them still count: the longest proper prefix of them that is also a suffix, the border. I precompute that for every prefix in the table lps. Then I scan the haystack once with a counter j. If the letter equals needle[j], j goes up. If it does not, while j is positive I set j = lps[j-1] and compare the same letter again. When j equals m, the match ends here, so I return i-m+1. Trace: needle "aabaaab", haystack "aabaabaaab": at i=5 the b fails against needle[5]=a, j drops from 5 to lps[4]=2, then b matches needle[2], and later j reaches 7 at i=9, so I return 3. Edge cases: needle longer than haystack never reaches m and returns -1; equal strings return 0. Cost: O(n + m) time, O(m) space.`,
      459: `I restate it: decide whether the string is some shorter block written two or more times with nothing left over. Brute force: for each block length p that divides n, compare the string against its first p letters repeated n/p times. That works, costing about n times the number of divisors. The faster view: if the string is block b repeated, then deleting the first copy leaves the same text as deleting the last copy, so the string has a border of length n minus the block length. Turn it around: the longest border is the last entry of the prefix function, so the shortest block that could possibly work has length p = n - lps[n-1]. It really tiles the string only if p divides n, and I also need lps[n-1] greater than 0 so there is a border at all. I build the table in one pass, then check those two conditions. Trace "abab": lps = [0,0,1,2], p = 4-2 = 2, 4 mod 2 = 0, so true. "ababa": lps[-1] = 3, p = 2, 5 mod 2 = 1, so false even though it has a period. "a": lps[-1]=0, so false, which matches the rule that the block must be shorter. Cost: O(n) time and O(n) space for the table. If asked for the short version, s in (s+s)[1:-1] works too, but the border argument is easier to justify out loud.`,
      214: `I restate it: I may only put letters in front of the string, and I want the shortest palindrome I can get. Since the original string stays as the tail of the answer, I want to keep as much of it as possible as the palindromic middle. Brute force: from the longest prefix down, check if it is a palindrome; the first one that is tells me what to copy to the front. That is O(n²), and a string like "aaaa...ab" forces many checks at 5·10^4 letters. The observation is that I only need the longest palindromic prefix. A palindromic prefix is a prefix that equals its own reverse, so it is a prefix of s that equals a suffix of reverse(s). That is a border question. I build t = s + "#" + reverse(s) and compute the prefix function. The last value is the longest prefix of s that equals a suffix of reverse(s), which is the longest palindromic prefix. The separator stops a border from running across the join. The answer is reverse(s[k:]) + s where k is that last value. Trace "abcd": t = "abcd#dcba", last border is "a" (k=1), so I put reverse("bcd") = "dcb" in front: "dcbabcd". Edge cases: empty returns empty, a palindrome has k=n and adds nothing. Cost: O(n) time and space, versus O(n²) for the naive check.`,
      1392: `I restate it: return the longest non-empty prefix that is also a suffix, but not the whole string, or an empty string if none. Brute force: for each length from n-1 down to 1, compare the prefix and the suffix; the first equal pair wins. That is O(n²) and too slow at 10^5 letters. The observation is that this is exactly the definition of a border, and the prefix function stores the longest border of every prefix. So the answer for the whole string is the last entry of the table. I build the table in one pass: k is the border length being extended, and on a mismatch I fall back to lps[k-1] instead of restarting, which keeps it linear. Then I return s[:lps[n-1]]. Overlap is allowed, because a border may overlap itself. Trace "ababab": the table is [0,0,1,2,3,4], so the last value is 4 and the answer is "abab", which is both the first four and the last four letters. For "abc" every entry is 0 and I return the empty string. A single letter also returns empty because the only prefix would be the whole string. The hash alternative grows a prefix hash and a suffix hash and remembers the longest equal length, but the table has no collision risk to explain. Cost: O(n) time and O(n) space.`
    }
  };
})();
