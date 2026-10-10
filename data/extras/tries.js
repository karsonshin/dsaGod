/* Offer Ready: extra lesson material for Tries (primer, think, breakdown, drills, how). See js/extras.js. */
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  var P = function () { return [].slice.call(arguments).join('\n\n'); };

  OR.extras['tries'] = {
    primer: {
      kind: 'structure',
      what: 'A **trie** (prefix tree) stores words as paths of letters from a shared root. Each edge is one letter and each node stands for the prefix spelled so far, so words that start the same share the same path. It is like a dictionary\'s thumb tabs, narrowing `a`, then `ap`, then `app`.',
      does: '`insert`, `search` and `startsWith` each walk one edge per letter, so they cost **O(L)** for a word of length L, however many words are stored. Every node carries an **end-of-word flag**, so `app` can be a stored word and also a prefix of `apple`. Memory is about one node per distinct prefix.',
      impl: 'Each node holds its children keyed by letter plus the flag. In Python the shortest version is nested dicts: `node = node.setdefault(ch, {})`, with a marker key such as `\'$\'` for end-of-word. A small `Node` class with `kids = {}` and `end = False` reads more clearly, and a 26-slot array is the fixed-alphabet variant.',
      possibilities: 'Autocomplete and spell-check; asking whether any word starts with some letters; wildcard search where `.` means any letter; replacing words by their shortest stem; finding many words in a letter grid with one DFS; counting words per prefix; a binary trie for maximum XOR.'
    },

    think: [
      { q: 'You insert `car`, `cart` and `cat` into an empty trie. How many nodes exist, not counting the root?',
        a: 'Five. The path c, a is shared by all three words (2 nodes), then r hangs under a (1 node), t hangs under r for `cart` (1 node), and a second t hangs under a for `cat` (1 node). The words contain 3 + 4 + 3 = 10 letters but the trie stores 5, because shared beginnings are stored once. That sharing is the whole point.' },
      { q: 'You inserted only `apple`. What do `search("app")` and `startsWith("app")` return, and what single field makes them different?',
        a: '`search("app")` is **false** and `startsWith("app")` is **true**. The path a-p-p exists, so it is a prefix, but the node for `app` has no end-of-word flag, so it is not a stored word. `search` needs the path and the flag; `startsWith` needs only the path. Forgetting the flag is the classic trie bug.' },
      { q: 'What does `startsWith("")` return on a completely empty trie? Is that a bug?',
        a: 'It returns True: walking zero letters leaves you on the root, which exists. It is a consequence of the definition (every word starts with the empty string) and arguably vacuous on an empty trie. It is worth knowing so that you do not special-case it by accident; ask the interviewer if they care.' },
      { q: 'Wildcard search: words `bad`, `dad`, `mad` are stored. Why does `search("b..")` succeed but `search("b.")` fail?',
        a: 'Dots branch over all children but they still consume exactly one letter each, so the pattern length must equal the word length. `b..` reaches the node for `bad` and finds its end flag. `b.` reaches the node for `ba` after the dot, the pattern is used up, and that node has no flag. Checking the flag, not mere existence, is what rejects it.' },
      { q: 'You need to answer only “is this exact word in the dictionary?” a million times. Trie or hash set?',
        a: 'A hash set. It is simpler, usually faster in practice, and often smaller in memory, because a trie pays a node for every letter. A trie wins when the questions are about **prefixes**: does anything start with this, list everything under it, find the shortest stored stem, or stop a search at the first dead end.' },
      { q: 'To find 1000 words in a letter grid, why put the words in a trie rather than searching the grid once per word?',
        a: 'Per-word searches repeat the same early steps whenever words share a start, and they cannot stop early on a path that no word begins with. With a trie, one DFS carries the current trie node and steps to a neighbour only if that node has an edge for its letter, so a grid path that no word begins with dies at once, and all words with a common start are explored together.' }
    ],

    breakdown: [
      { title: 'Why not just a list of words?',
        body: P('Raw idea: to answer “does any word start with `ca`?” in a list you check every word, O(n * L). Words that begin alike repeat the same letters. A trie stores each shared beginning **once**, as a path of letters from a root.', '```\n(root)\n└─ c\n   └─ a\n      ├─ r  (word: car)\n      │  └─ t  (word: cart)\n      └─ t  (word: cat)\n```', 'Each node means “the prefix spelled on the path to me”. Everything under node `ca` starts with `ca`. Edge case: the empty prefix is the root itself. Spot it: prefix, autocomplete, “starts with”.') },
      { title: 'A node is children plus a flag',
        body: P('State per node: `kids` (a map letter to child) and `end` (does a word finish here?). Insert `cat` into an empty trie, then `car`:', '```\ninsert cat: root -c-> n1 -a-> n2 -t-> n3, set n3.end\ninsert car: root -c-> n1 (exists) -a-> n2 (exists)\n            -r-> new n4, set n4.end\n```', 'The loop in words: for each letter, if the current node has no child for it, create one, then step into the child; after the last letter, raise the flag. Edge case: inserting the same word twice changes nothing. Cost O(L).'),
        code: { py: 'class Node:\n    def __init__(self):\n        self.kids = {}\n        self.end = False\n\ndef insert(root, word):\n    node = root\n    for ch in word:\n        node = node.kids.setdefault(ch, Node())\n    node.end = True' } },
      { title: 'search versus startsWith: path, or path plus flag',
        body: P('One helper walks the letters and returns the node it ends on, or `None` if the path breaks. Then the two questions differ by one condition. Stored words: `car`, `cart`.', '```\nsearch(\'ca\')     path ok, flag off  -> False\nstartsWith(\'ca\') path ok            -> True\nsearch(\'car\')    path ok, flag on   -> True\nsearch(\'cars\')   no edge for s      -> False (walk stops early)\n```', 'The flag is what separates a word from a mere prefix. Edge cases: a query longer than any stored word fails at the first missing edge; an empty trie fails at the first letter. Cost O(L), independent of how many words are stored.') },
      { title: 'The dict-of-dicts shortcut',
        body: P('In an interview you can skip the class. Use one nested dict per node and a special key for the flag. Letters are never `\'$\'`, so they cannot collide.', '```\ninsert \'cat\' then \'car\' gives\n{ \'c\': { \'a\': { \'t\': {\'$\': True}, \'r\': {\'$\': True} } } }\n```', 'Descend and create in one line with `node = node.setdefault(ch, {})`. Test a word with `\'$\' in node` at the end. Trade-off: very compact to write, but each dict is heavy in memory, and the marker key must not be a possible letter. Cost is the same O(L).'),
        code: { py: 'def insert(root, word):\n    node = root\n    for ch in word:\n        node = node.setdefault(ch, {})\n    node[\'$\'] = True\n\ndef has_prefix(root, s):\n    node = root\n    for ch in s:\n        if ch not in node:\n            return False\n        node = node[ch]\n    return True' } },
      { title: 'Wildcards: branch on the dot',
        body: P('A straight walk cannot handle `.` because you do not know which child to take. So on a dot, **try every child** and succeed if any branch succeeds. On a normal letter follow the one child. State: the position `i` in the pattern and the current node. Words `bad`, `dad`, `mad`, pattern `.ad`:', '```\ndfs(0, root): pattern[0] is a dot, try children b, d, m\n  dfs(1, node b): \'a\' -> node ba -> \'d\' -> node bad, pattern used up, flag on -> True\n```', 'At the end of the pattern return the node\'s flag, not just that the node exists. Cost: no dots O(L); with dots up to the number of trie nodes, but each real letter prunes. Spot it: patterns with blanks over a growing dictionary.') },
      { title: 'Trie plus grid: walk both in lockstep',
        body: P('To find many words in a letter grid, put the words in a trie, then DFS the grid carrying the trie node. Move to a neighbour only if the node has an edge for its letter. Words `cat`, `car`, grid:', '```\nc a\nt r\n```', 'From the c at (0,0) the node is `c`. Neighbour a (0,1): edge `a` exists, node `ca`. From there neighbours are t at (1,0)? Not adjacent to (0,1): it is diagonal, so only r at (1,1) is a neighbour. Edge `r` exists, node `car` has its flag, record `car`. The path to `cat` dies because t is not adjacent to a. Mark cells used while on the path and restore them when backtracking. Remove found words so they are not reported twice.') },
      { title: 'Cost, memory, and when not to use a trie',
        body: P('Every operation is O(L), never O(number of words). Building from n words is O(total letters). Memory is one node per distinct prefix: shared beginnings save space, unrelated long words do not, and a node with an array of 26 slots is large even if it has one child.', 'Rule of thumb: whole-word lookup only means a hash set; one-off prefix queries on a static list can use `sort` and `bisect`; searching inside text needs string algorithms instead. Reach for a trie when the questions are about beginnings, listing under a prefix, wildcards, or many words against a grid. In the interview, say the trade-off out loud.') }
    ],

    drills: [
      { title: 'Prefix counter',
        q: 'Build a class `PrefixCounter` with `add(word)` and `count(prefix)`. `count` returns how many words **added so far** start with `prefix` (adding the same word twice counts twice). `count("")` is the total number of words added.\n\nExample: after adding `car`, `car`, `cart`, `cat`: `count("ca")` is 4, `count("car")` is 3, `count("cart")` is 1, `count("dog")` is 0.',
        hint: 'Store a counter on every node: how many added words pass through it.',
        how: 'Restated: I need to answer “how many words start with this prefix” quickly, repeatedly, while words keep being added. Brute force: keep a list and run `startswith` on all of them, O(n * L) per query, which is slow if there are many words and many queries.\n\nThe observation: in a trie, every word that starts with a prefix passes through the node for that prefix. So if each node remembers how many words passed through it, the answer to a query is just that number at the end of the walk, with no enumeration. That is a counter in place of the usual boolean flag.\n\nStructure: nested dicts, with the key `#` holding the pass-through count. On add, I descend letter by letter and increment the counter of every node I step into. The root itself is not stepped into, so `count("")` would read the root\'s counter; I increment the root too, once per word, so the empty prefix works.\n\nTrace: add `car` gives root 1, c 1, a 1, r 1. Add `car` again: 2 everywhere. Add `cart`: root 3, c 3, a 3, r 3, t 1. Add `cat`: root 4, c 4, a 4, t 1 under a. count(`ca`) walks c, a and reads 4. count(`car`) reads 3. count(`dog`) fails at the first letter and returns 0.\n\nEdge cases: empty prefix, missing path, repeated words. Cost: O(L) per operation.',
        code: { py: `class PrefixCounter:
    def __init__(self):
        self.root = {'#': 0}

    def add(self, word):
        node = self.root
        node['#'] += 1                              # the empty prefix counts every word
        for ch in word:
            node = node.setdefault(ch, {'#': 0})
            node['#'] += 1                          # one more word passes through here

    def count(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node:
                return 0
            node = node[ch]
        return node['#']` },
        explain: 'A word starts with a prefix exactly when it passes through the prefix\'s node, and every add increments each node on its path, so the counter at the end of the walk is the answer. Add and count are O(L); space is O(total letters).',
        check: 'p = PrefixCounter()\nassert p.count("a") == 0\nassert p.count("") == 0\nfor w in ["car", "car", "cart", "cat"]:\n    p.add(w)\nassert p.count("ca") == 4\nassert p.count("car") == 3\nassert p.count("cart") == 1\nassert p.count("dog") == 0\nassert p.count("") == 4\nassert p.count("carts") == 0' },

      { title: 'Shortest unique prefix',
        q: 'Given a list of distinct lowercase words where **no word is a prefix of another**, return for each word (in the same order) the **shortest prefix that belongs to that word only**, meaning no other word starts with it.\n\nExample: `["zebra", "dog", "duck", "dove"]` returns `["z", "dog", "du", "dov"]`. `["apple", "ant"]` returns `["ap", "an"]`.',
        hint: 'Count how many words pass through each trie node; the answer for a word ends at the first node whose count is 1.',
        how: 'Restating: for each word, find how many leading letters I need before it stops looking like any other word. Brute force: for each word, try prefix lengths 1, 2, 3, ... and compare against every other word, which is O(n^2 * L) overall.\n\nObservation: a prefix is unique to a word exactly when only one word passes through the corresponding trie node. If I build a trie where each node counts the words passing through, then for a word I walk down its letters and stop at the first node with count 1. After that node, every deeper node also has count 1, so this is the shortest unique prefix.\n\nStructure: nested dicts with a `#` counter per node, the same trick as counting prefixes. Two passes: insert all words, incrementing counters; then for each word walk down again and return the letters up to the first count of 1.\n\nTrace on `["zebra", "dog", "duck", "dove"]`: root children are z (count 1) and d (count 3). `zebra`: node z has count 1, so the answer is `z`. `dog`: d has 3, do has 2 (dog and dove), dog has 1, so `dog`. `duck`: d is 3, du is 1, so `du`. `dove`: d 3, do 2, dov 1, so `dov`.\n\nEdge cases: a single word returns just its first letter; the promise that no word is a prefix of another guarantees a count of 1 is always reached before the word runs out. Cost: O(total letters) time and space.',
        code: { py: `def shortest_unique_prefix(words):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {'#': 0})
            node['#'] += 1                          # how many words pass through this node
    out = []
    for w in words:
        node = root
        for i, ch in enumerate(w):
            node = node[ch]
            if node['#'] == 1:                      # only this word comes here
                out.append(w[:i + 1])
                break
    return out` },
        explain: 'A prefix is unique to a word exactly when only that word passes through its node. The counts are built in one pass and read in a second, and the first count of 1 on a word\'s path marks the shortest such prefix. Time and space O(total letters).',
        check: 'assert shortest_unique_prefix(["zebra", "dog", "duck", "dove"]) == ["z", "dog", "du", "dov"]\nassert shortest_unique_prefix(["apple", "ant"]) == ["ap", "an"]\nassert shortest_unique_prefix(["solo"]) == ["s"]\nassert shortest_unique_prefix([]) == []\nassert shortest_unique_prefix(["ab", "ac", "b"]) == ["ab", "ac", "b"]' },

      { title: 'Count wildcard matches',
        q: 'Build a class `Dict` with `add(word)` and `matches(pattern)`. In `pattern`, `?` stands for exactly one letter and every other character must match exactly. `matches` returns **how many distinct stored words** fit the pattern (the same word added twice counts once).\n\nExample: after adding `cat`, `cot`, `cut`, `car`, `cat`: `matches("c?t")` is 3, `matches("ca?")` is 2, `matches("???")` is 4, `matches("c?")` is 0.',
        hint: 'Walk the pattern with a recursive function; on `?` add up the results of every child, and at the end of the pattern return 1 if a word ends here.',
        how: 'Restated: like a wildcard search, but I must count matches instead of returning yes or no. Brute force: compare the pattern to every stored word of the same length, O(n * L) per query. Fine for tiny inputs.\n\nObservation: a trie handles the letters in the pattern by following exactly one child, and only the `?` positions branch. So it is a DFS over the trie driven by the pattern, and at a `?` I try every child and add up their counts. At the end of the pattern the node either completes a stored word (count 1) or not (count 0). That is the only change from the boolean version: `any` becomes `sum`.\n\nI use nested dicts with a `$` key for the end flag. Making the flag a plain True means the same word added twice is stored once, which gives “distinct words” automatically. In the loop over children I must skip the `$` key, since it is not a child.\n\nTrace `c?t` with words cat, cot, cut, car: dfs(0, root): letter c, follow to node c. Position 1 is `?`: try children a, o, u. Under a: letter t exists and the node has the flag, 1. Under o: 1. Under u: 1. Sum 3. Pattern `ca?`: child t and child r under `ca`, both flagged, 2.\n\nEdge cases: pattern longer or shorter than every word returns 0; an empty trie returns 0. Cost: O(L) with no `?`, otherwise bounded by the number of trie nodes.',
        code: { py: `class Dict:
    def __init__(self):
        self.root = {}

    def add(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node['$'] = True                            # a set flag, so repeats count once

    def matches(self, pattern):
        def dfs(i, node):
            if i == len(pattern):
                return 1 if '$' in node else 0      # a word must end exactly here
            ch = pattern[i]
            if ch == '?':
                return sum(dfs(i + 1, child) for key, child in node.items() if key != '$')
            return dfs(i + 1, node[ch]) if ch in node else 0
        return dfs(0, self.root)` },
        explain: 'Following the pattern through the trie visits only nodes consistent with it; a ? branches into all children and the counts add, because different branches spell different words. A boolean flag makes each word counted once. Time O(L) without wildcards and at most the trie size with them; space O(total letters).',
        check: 'd = Dict()\nassert d.matches("a") == 0\nfor w in ["cat", "cot", "cut", "car", "cat"]:\n    d.add(w)\nassert d.matches("c?t") == 3\nassert d.matches("ca?") == 2\nassert d.matches("???") == 4\nassert d.matches("c?") == 0\nassert d.matches("cat") == 1\nassert d.matches("dog") == 0\nassert d.matches("????") == 0' },

      { title: 'Biggest XOR of two numbers',
        q: 'Given a list of non-negative integers, return the largest value of `a ^ b` over any two different positions (the same value at two positions is allowed). With fewer than two numbers return 0.\n\nExample: `[3, 10, 5, 25, 2, 8]` returns 28 (5 ^ 25). `[1, 2]` returns 3. `[8, 8, 8]` returns 0.',
        hint: 'Write each number in binary and store it in a trie with two children per node. For each number, walk the trie preferring the opposite bit.',
        how: 'Restated: choose two numbers to make their XOR as large as possible. Brute force: try every pair, O(n^2), which is too slow for a big list.\n\nObservation: XOR gives a 1 in a bit position exactly when the two bits differ, and a higher bit position is worth more than all lower bits put together. So to maximise the XOR with a fixed x, I should decide the top bit first: pick a partner whose top bit is the opposite of x\'s if one exists, then the next bit, and so on. That is a walk down a tree of bits, which is a trie whose alphabet is just {0, 1}.\n\nStructure: all numbers are padded to the same bit length, taken from the largest number. Each number is a path of that many bits, from the highest to the lowest. For a query number x, at each level I ask: is there a child with the opposite bit? If yes, go there and set that bit of the result to 1; if not, go to the same-bit child and leave the result bit 0. After all levels, the result is the best XOR for x against everything inserted. To pair distinct positions I insert the numbers one at a time and query each new one before inserting it.\n\nTrace `[1, 2]` with 2 bits: insert 1 = `01`. Query 2 = `10`: top bit 1, opposite is 0, exists, result bit 1; next bit 0, opposite is 1, exists, result bit 1: result 3.\n\nEdge cases: one number, or all equal, gives 0. Cost: O(n * B) with B the bit length, which is about 30 for typical limits.',
        code: { py: `def max_xor_pair(nums):
    if len(nums) < 2:
        return 0
    bits = max(max(nums).bit_length(), 1)           # same number of levels for every number
    root = {}

    def insert(x):
        node = root
        for b in range(bits - 1, -1, -1):
            node = node.setdefault((x >> b) & 1, {})

    best = 0
    insert(nums[0])
    for x in nums[1:]:
        node, cur = root, 0
        for b in range(bits - 1, -1, -1):
            bit = (x >> b) & 1
            if (bit ^ 1) in node:                   # an opposite bit exists: this result bit becomes 1
                cur |= 1 << b
                node = node[bit ^ 1]
            else:
                node = node[bit]
        best = max(best, cur)
        insert(x)
    return best` },
        explain: 'Greedy from the highest bit is correct because one higher bit outweighs all lower bits combined, and the trie lets us test in O(1) whether an opposite-bit partner exists. Each query returns the best XOR against every earlier number, so all pairs are covered. Time O(n * bits), space O(n * bits).',
        check: 'assert max_xor_pair([3, 10, 5, 25, 2, 8]) == 28\nassert max_xor_pair([1, 2]) == 3\nassert max_xor_pair([8, 8, 8]) == 0\nassert max_xor_pair([7]) == 0\nassert max_xor_pair([]) == 0\nassert max_xor_pair([0, 0]) == 0\nassert max_xor_pair([0, 5]) == 5\nassert max_xor_pair([14, 70, 53, 83, 49, 91, 36, 80, 92, 51, 66, 70]) == 127' }
    ],

    how: {
      208: 'Restate: build a class with `insert`, `search` (is exactly this word stored) and `startsWith` (does any stored word begin with this). Brute force: a list or set of words. Search is a lookup, but `startsWith` has to test every word, O(n * L).\n\nThe observation: words that begin alike repeat their first letters. Spell each word as a path of letters from one shared root, so the path for a prefix exists exactly when some stored word starts with it. Each node holds up to 26 children and a flag saying a word ends here.\n\nInsert: walk the letters, creating a child where one is missing, step into it, and after the last letter raise the flag. I write one helper that walks a string and returns the node where it ends, or `None` if an edge is missing. Then `search` is “that node exists and has the flag”, and `startsWith` is “that node exists”.\n\nTrace: insert `apple`. `search("app")` walks a, p, p and lands on a node with no flag: False. `startsWith("app")`: True. Insert `app` and now `search("app")` flips to True because the flag is raised on that same node.\n\nEdge cases: the empty trie, a query longer than any word (the walk breaks), inserting a word twice. Cost: each operation is O(L) for the length of the argument, regardless of how many words are stored; space is O(total letters).',
      211: 'Restate: a dictionary where I can add words, and search with a pattern where `.` means any one letter. Brute force: keep a list, and compare the pattern against each stored word of the same length: O(n * L) per search.\n\nThe observation: a trie handles ordinary letters by following exactly one child, so the only hard part is the dot. At a dot I do not know which child to take, so I try all of them and return True if any branch succeeds. That is a small DFS over the trie, carrying the position in the pattern and the current node.\n\nAt the end of the pattern I return whether the node has the end flag. Returning only that the node exists would be a bug: `b.` would then match `bad`.\n\nTrace with `bad`, `dad`, `mad` stored and pattern `.ad`: at the dot try children b, d, m. Under b, letters a then d exist and the node has its flag: True, so the whole search is True. Pattern `b.`: after b the dot tries the child a, the pattern is used up, but that node has no flag: False.\n\nEdge cases: all dots, a search before anything is added, a dot as the last character. Cost: add is O(L). A search with no dots is O(L). With dots it may visit many nodes, bounded by the trie size, though real letters prune quickly. Mention bucketing by length as an optimisation.',
      212: 'Restate: given a letter grid and a list of words, return every word that can be traced through side-by-side cells without reusing a cell within one word. Brute force: for each word run a backtracking search from every cell, roughly O(words * cells * 3^L). Words with the same start redo the same walk.\n\nThe observation: if all the words are in a trie, one DFS can serve them all. Start from each cell carrying the current trie node, and step to a neighbour only if the node has an edge for the neighbour\'s letter. A grid path that no word starts with is cut off immediately, and words that share a start share one walk.\n\nDetails that make it fast and correct. Store the full word at its end node so I can append it directly. When I find a word, delete it from the trie so it cannot be reported twice, and prune a node that has nothing left under it so dead branches stop costing time. Mark the current cell as used (for example `#`) while on the path and restore it when I backtrack.\n\nTrace on grid `[[c,a],[t,s]]` with `cast`: from c, node `c`, neighbour a gives `ca`; from a, neighbour s (below it) gives `cas`; from s, neighbour t gives `cast`, a stored word, recorded. `cat` would need t next to a, but they are diagonal.\n\nEdge cases: a word needing one cell twice, duplicate words, no matches. Cost: bounded by cells * 3^(max word length), usually far less thanks to pruning; the trie takes O(total letters).',
      648: 'Restate: replace every word in a sentence by the shortest stem from a list that is a prefix of it, leaving words with no matching stem unchanged. Brute force: for each word, test every stem with `startswith` and keep the shortest, O(words * stems * L).\n\nThe observation: shortest stem means the first stem you hit while reading the word from the left. So put all stems in a trie, and walk each word one letter at a time. The moment I step onto a node with the end flag, I have found a stem, and since I read left to right it is the shortest one. Return the letters read so far. If an edge is missing before any flag, or the word runs out, keep the word as it is.\n\nTrace with stems `cat`, `bat`, `rat` on the word `cattle`: step c, a, t, and the node for `cat` has the flag, so the answer is `cat`. On `the`: t has no stem path under it that starts with t, so the walk breaks at the first letter and `the` stays. With stems `a`, `aa`, `aaa` and the word `aaa`: first step lands on a flagged node, so `a`, not `aaa`.\n\nSplit the sentence on spaces, map each word, and join. Edge cases: no stems at all, a stem equal to the whole word, a stem longer than the word (the word ends before reaching a flag, so it stays).\n\nCost: building is O(total stem letters); each word costs at most its own length, so O(sentence length) overall.',
      14: 'Restate: given several strings, return the longest prefix that all of them share. Brute force: for each possible length, check all strings, which is fine but easy to over-complicate. A trie of all strings would work too, but it uses memory for no gain here.\n\nThe observation: the common prefix can be no longer than the first string, so I only need to decide how far into the first string I can go. Compare column by column: take character `i` of the first string and check character `i` of every other string. As soon as some string is too short, or has a different character in that column, the common prefix is everything before column `i`.\n\nTrace on `["flower", "flow", "flight"]`: column 0, all f. Column 1, all l. Column 2: first has `o`, but `flight` has `i`, so stop and return `fl`. If I finish all columns of the first string without a break, the whole first string is the prefix, as for `["ab", "abc"]` or a single string.\n\nEdge cases: an empty string among the inputs fails at column 0 and returns an empty string; the list has one string; two identical strings. Check the length before indexing so a short string does not raise an index error: the `i == len(s)` test comes first.\n\nCost: O(total letters) time in the worst case (all strings identical), O(1) extra space. If asked about a trie, note that the common prefix is the chain from the root until a node has two children or an end flag.',
      720: 'Restate: among the words that can be built one letter at a time (every shorter prefix is also in the list), return the longest, and the alphabetically smallest if tied. Brute force: for each word, check each of its prefixes is in a set. That works but repeats checks.\n\nThe observation: a word is buildable exactly when the word without its last letter is buildable (and a one-letter word is buildable, since the empty string counts). So if I process words in an order where shorter prefixes always come first, I only need one lookup per word. Sorting alphabetically does this: a prefix always sorts before the words extending it.\n\nStructure: a set `built`, starting with the empty string. For each word in sorted order, if `word[:-1]` is in `built`, the word is buildable, so add it. Keep the best, replacing only when the new word is **strictly longer**. Because sorting visits ties alphabetically, the first of equal length stays.\n\nTrace on `["a", "banana", "app", "appl", "ap", "apply", "apple"]`: sorted is a, ap, app, appl, apple, apply, banana. a builds from the empty string; ap from a; app; appl; apple (length 5, new best); apply is the same length, not strictly longer, so `apple` stays; banana\'s prefix `banan` is not built. Answer `apple`.\n\nEdge cases: no word starts from a single letter, giving an empty answer; one word. Cost: O(n log n * L) for sorting, O(total letters) for the set.',
      1268: 'Restate: as the user types a word letter by letter, after each letter suggest up to three products that start with what has been typed, in alphabetical order. Brute force: after each letter, filter all products by prefix and sort, O(L * n log n). Wasteful when n is large.\n\nThe observation: if I sort the product list once, all products with a given prefix form one contiguous block, and the block starts at the first product that is not smaller than the prefix. Binary search finds that start in O(log n). The block is already in alphabetical order, so the first three entries of it are the answer, after confirming they really start with the prefix (the block can end before three entries).\n\nA trie works as well: store the first three words at each node, or do an alphabetical DFS, and you get O(1) per letter after building, but it costs more memory and more code. I would mention it, then use the sort and bisect version.\n\nTrace on products `["cart", "car", "cat", "dog"]`, typed `ca`: sorted is car, cart, cat, dog. Prefix `c`: `bisect_left` gives index 0, take car, cart, cat. Prefix `ca`: still index 0, all three start with `ca`. Output `[[car, cart, cat], [car, cart, cat]]`.\n\nEdge cases: no product matches (the slice entries fail `startswith`, giving an empty list); fewer than three products; prefix beyond the end of the list. Cost: O(n log n) to sort, then O(L * (log n + L)) for the queries.'
    }
  };
})();
