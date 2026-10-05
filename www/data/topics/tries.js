/* Offer Ready: Tries (prefix trees) lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in
   (class-design problems are checked in py/js by the tool; their Java and C++ were compiled and run by hand). */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'tries',

    hook: 'A trie answers one question faster than anything else you know: “does any stored word start with these letters?” A hash set can only say whether the **whole** word is there; a trie shares the common beginnings, so one walk down the letters answers both questions and costs the length of the query, not the size of the dictionary. It shows up in autocomplete, spell-check, IP routing and, in interviews, as a short, very learnable family: implement a trie (208), add a wildcard (211), and the hard one that combines it with a grid search (212). The first two are classics you should be able to write from memory in five minutes.',

    cues: [
      'You store many words and ask about **beginnings**: “does anything start with…?”, autocomplete, “the shortest stem that matches”.',
      'A **stream of characters** arrives one at a time and you must react at the first letter that cannot lead anywhere.',
      'Many search words **share a start**, and trying each from scratch would repeat the same walk (a list of words to find in a grid).',
      'A query has **blanks or wildcards** (`c.t`, `b..`) over a growing dictionary.',
      'You need the words under a prefix, in alphabetical order, or only the first few of them.',
      'You work with **bits** of numbers and want the best partner for each (maximum XOR): the same tree, with two children per node.'
    ],

    intuition: [
      'Look up a word in a paper dictionary. You do not read from page one: you open near “c”, then look for “ca”, then “cat”, narrowing with each letter. A **trie** (said “try”, from re*trie*val) is that narrowing made into a tree. The root stands for the empty prefix. Each **edge** is one letter. A **node** stands for the prefix spelled by the edges on the path from the root to it.',
      'Words that begin the same way **share a path**. Store `car`, `cart` and `cat` and the first two letters `c-a` are stored once; the tree then splits into `r` and `t`; `car` and `cart` share even more. Nothing is repeated, and you can see every word that starts with `ca` by looking under that node.',
      'The one subtle thing is the **end-of-word flag**. If you store `car` and `cart`, the node for `car` sits on the way to `cart`. Walking to it only tells you `car` is a **prefix** of something; whether `car` is itself a **word** needs a flag on the node. That is the difference between `search` (path exists **and** the flag is set) and `startsWith` (path exists). Forgetting it is the number one trie bug.',
      'A node needs two things: its **children** (a map from letter to child node, or an array of 26 slots) and a **word-end flag** (sometimes the whole word, or a count, instead of a boolean). Each operation walks the letters one by one, so all of `insert`, `search` and `startsWith` cost **O(L)** where L is the length of the word you pass in, regardless of how many words are stored.',
      'Two extensions cover most of the interview questions. A **wildcard** (`.` means any letter) turns the straight walk into a small depth-first search: on a dot, try every child. And a **grid of letters** with a **list of target words** turns into one DFS over the grid that walks the trie in lockstep, so a path in the grid that matches no word beginning is cut off immediately. The visualizer above runs insert, search and startsWith so you can watch the path and the flags.'
    ].join('\n\n'),

    viz: 'trie',

    template: {
      title: 'Trie: insert, search, startsWith by walking letters',
      note: 'One helper, `find`, walks the letters of a string and returns the node it ends on, or nothing. `search` is “found **and** flagged as a word end”; `startsWith` is just “found”. `insert` is the same walk that **creates** the missing nodes and flags the last one. The version here keeps children in a map (Python, JavaScript) or in a 26-slot array (Java, C++): see the node-design variation below for when to pick which. In C++ the nodes are never freed, which is fine for an interview; real code would use smart pointers or a pool.',
      code: {
        py: `class Node:
    def __init__(self):
        self.kids = {}                          #> letter -> child node. Only letters that occur are stored
        self.end = False                        #> True when a stored word finishes at this node

class Trie:
    def __init__(self):
        self.root = Node()                      #> The root stands for the empty prefix

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.kids:             #@check > 1. Is there an edge for this letter?
                node.kids[ch] = Node()          #@make > 2. No: grow a new node on that edge
            node = node.kids[ch]                #@walk > 3. Step down the edge
        node.end = True                         #@flag > 4. The word ends here: raise the flag

    def _find(self, s):
        node = self.root
        for ch in s:
            if ch not in node.kids:             #@check
                return None                     #@miss > The path breaks: nothing stored starts like this
            node = node.kids[ch]                #@walk
        return node

    def search(self, word):
        node = self._find(word)
        return node is not None and node.end    #@end > A whole word needs the path AND the flag

    def startsWith(self, prefix):
        return self._find(prefix) is not None   #@prefix > A prefix only needs the path`,
        js: `class Node {
  constructor() {
    this.kids = new Map();                      //> letter -> child node. Only letters that occur are stored
    this.end = false;                           //> true when a stored word finishes at this node
  }
}

class Trie {
  constructor() {
    this.root = new Node();                     //> The root stands for the empty prefix
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.kids.has(ch))                   //@check > 1. Is there an edge for this letter?
        node.kids.set(ch, new Node());          //@make > 2. No: grow a new node on that edge
      node = node.kids.get(ch);                 //@walk > 3. Step down the edge
    }
    node.end = true;                            //@flag > 4. The word ends here: raise the flag
  }

  find(s) {
    let node = this.root;
    for (const ch of s) {
      if (!node.kids.has(ch))                   //@check
        return null;                            //@miss > The path breaks: nothing stored starts like this
      node = node.kids.get(ch);                 //@walk
    }
    return node;
  }

  search(word) {
    const node = this.find(word);
    return node !== null && node.end;           //@end > A whole word needs the path AND the flag
  }

  startsWith(prefix) {
    return this.find(prefix) !== null;          //@prefix > A prefix only needs the path
  }
}`,
        java: `class Trie {
    private static class Node {
        Node[] kids = new Node[26];             //> One slot per letter: the index is letter minus 'a'
        boolean end;                            //> True when a stored word finishes at this node
    }

    private final Node root = new Node();      //> The root stands for the empty prefix

    public void insert(String word) {
        Node node = root;
        for (char ch : word.toCharArray()) {
            int i = ch - 'a';
            if (node.kids[i] == null) {         //@check > 1. Is there an edge for this letter?
                node.kids[i] = new Node();      //@make > 2. No: grow a new node on that edge
            }
            node = node.kids[i];                //@walk > 3. Step down the edge
        }
        node.end = true;                        //@flag > 4. The word ends here: raise the flag
    }

    private Node find(String s) {
        Node node = root;
        for (char ch : s.toCharArray()) {
            int i = ch - 'a';
            if (node.kids[i] == null) {         //@check
                return null;                    //@miss > The path breaks: nothing stored starts like this
            }
            node = node.kids[i];                //@walk
        }
        return node;
    }

    public boolean search(String word) {
        Node node = find(word);
        return node != null && node.end;        //@end > A whole word needs the path AND the flag
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;            //@prefix > A prefix only needs the path
    }
}`,
        cpp: `class Trie {
    struct Node {
        Node* kids[26] = {};                    //> One slot per letter, all null at first
        bool end = false;                       //> True when a stored word finishes at this node
    };

    Node* root = new Node();                    //> The root stands for the empty prefix

    Node* find(const string& s) {
        Node* node = root;
        for (char ch : s) {
            int i = ch - 'a';
            if (node->kids[i] == nullptr) {     //@check
                return nullptr;                 //@miss > The path breaks: nothing stored starts like this
            }
            node = node->kids[i];               //@walk
        }
        return node;
    }

public:
    void insert(string word) {
        Node* node = root;
        for (char ch : word) {
            int i = ch - 'a';
            if (node->kids[i] == nullptr) {     //@check > 1. Is there an edge for this letter?
                node->kids[i] = new Node();     //@make > 2. No: grow a new node on that edge
            }
            node = node->kids[i];               //@walk > 3. Step down the edge
        }
        node->end = true;                       //@flag > 4. The word ends here: raise the flag
    }

    bool search(string word) {
        Node* node = find(word);
        return node != nullptr && node->end;    //@end > A whole word needs the path AND the flag
    }

    bool startsWith(string prefix) {
        return find(prefix) != nullptr;         //@prefix > A prefix only needs the path
    }
};`
      },
      tests: { design: true, cases: [
        { ops: ['Trie', 'insert', 'search', 'search', 'startsWith', 'insert', 'search'], args: [[], ['apple'], ['apple'], ['app'], ['app'], ['app'], ['app']], out: [null, null, true, false, true, null, true] },
        { ops: ['Trie', 'search', 'startsWith', 'insert', 'startsWith', 'search', 'startsWith'], args: [[], ['a'], ['a'], ['car'], ['ca'], ['ca'], ['cat']], out: [null, false, false, null, true, false, false] },
        { ops: ['Trie', 'insert', 'insert', 'insert', 'search', 'search', 'startsWith', 'startsWith'], args: [[], ['car'], ['cart'], ['cat'], ['car'], ['cars'], ['car'], ['d']], out: [null, null, null, null, true, false, true, false] }] }
    },

    complexity: {
      time: 'O(L) per operation, L = length of the word',
      space: 'O(total letters stored), times the alphabet size for array nodes',
      why: 'Every operation walks one edge per letter and does O(1) work on each (a map lookup or an array index), so the cost depends only on the length of the word you passed in, **not** on how many words are stored. Building a trie from n words of average length L is O(n · L). The space is at most one node per stored letter, and **less** when words share beginnings. With array nodes each node also reserves 26 slots whether used or not, so the worst case is O(n · L · 26).',
      trap: 'People say “O(1)” or “O(log n)” for a trie lookup. Neither is right: it is **O(L)**, and a hash set is also O(L) once you count hashing the string, so the trie’s edge is not raw speed on whole-word lookup, it is that it answers **prefix** questions and enumerates by prefix. The other trap is memory: a trie of many unrelated long words can be **bigger** than a hash set, because every letter costs a node.'
    },

    variations: [
      {
        name: 'Node design: an array of 26 or a map',
        body: 'There are three common ways to store a node’s children.\n\n| Design | Lookup | Memory per node | Best when |\n| --- | --- | --- | --- |\n| Array of 26 (`kids[ch - \'a\']`) | O(1), no hashing | always 26 pointers | lowercase letters, dense tries, you want speed |\n| Hash map (`dict`, `HashMap`, `Map`) | O(1) average | only the letters that exist | big or unknown alphabets (Unicode, digits and letters), sparse tries |\n| Sorted list or `TreeMap` | O(log k) | only the letters that exist | you must walk children in alphabetical order |\n\nIn an interview the array is the standard choice for “lowercase English letters”, and it is the one that needs the least explaining. Two details to say out loud: the array wastes space when most nodes have one or two children, which is the usual case deep in the tree; and if the input might contain anything other than `a` to `z`, the array index goes out of range, so ask or use a map. A cheap middle path is to use a map for the root (which is dense) and arrays below, but that is rarely worth the complexity.'
      },
      {
        name: 'Count how many words share a prefix',
        body: 'Replace the boolean flag by **counters**. Keep a `through` count on every node (how many inserted words pass through it) and an `ends` count (how many words end exactly here). Then “how many words start with `ca`?” is the `through` count of the `ca` node, found in O(L) with no enumeration. The same idea supports **delete** (decrement along the path; free nodes that reach zero) and “how many times was this exact word inserted?”. This is Map Sum Pairs (677) and many autocomplete ranking problems in disguise.',
        code: {
          py: `class WordCounter:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
            node['#'] = node.get('#', 0) + 1     # one more word passes through this node
        node['$'] = node.get('$', 0) + 1         # one more word ends here

    def _node(self, s):
        node = self.root
        for ch in s:
            if ch not in node:
                return {}
            node = node[ch]
        return node

    def countPrefix(self, prefix):
        return self._node(prefix).get('#', 0)

    def countWord(self, word):
        return self._node(word).get('$', 0)`,
          js: `class WordCounter {
  constructor() {
    this.root = {};
  }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
      node['#'] = (node['#'] || 0) + 1;          // one more word passes through this node
    }
    node['$'] = (node['$'] || 0) + 1;            // one more word ends here
  }
  node(s) {
    let node = this.root;
    for (const ch of s) {
      if (!node[ch]) return {};
      node = node[ch];
    }
    return node;
  }
  countPrefix(prefix) {
    return this.node(prefix)['#'] || 0;
  }
  countWord(word) {
    return this.node(word)['$'] || 0;
  }
}`
        },
        tests: { design: true, cases: [
          { ops: ['WordCounter', 'insert', 'insert', 'insert', 'countPrefix', 'countWord', 'countPrefix', 'countWord'], args: [[], ['car'], ['car'], ['cart'], ['ca'], ['car'], ['cart'], ['cars']], out: [null, null, null, null, 3, 2, 1, 0] },
          { ops: ['WordCounter', 'countPrefix', 'insert', 'countPrefix', 'countWord', 'countPrefix'], args: [[], ['a'], ['ab'], ['a'], ['a'], ['b']], out: [null, 0, null, 1, 0, 0] }] }
      },
      {
        name: 'Wildcard search: branch on the dot',
        body: 'When a query may contain `.` (any one letter), a straight walk is no longer enough. Walk normally on a letter. On a dot, **try every child** and succeed if any branch succeeds. That is a depth-first search over the trie, written recursively with the position in the pattern and the current node. At the end of the pattern, return the node’s end flag. In the worst case (a pattern of all dots) it visits every node, O(total letters), but each real letter prunes the search hard. Worked below as Design Add and Search Words (211). Cost summary: no dots is O(L); each dot multiplies the branches by at most 26.'
      },
      {
        name: 'Autocomplete: the first few words under a prefix',
        body: 'Walk to the prefix node (O(L)), then run a DFS under it, visiting children **in alphabetical order** and stopping after `k` words. Visit the node itself first (if it is a word end) and then its children: that yields words in dictionary order, with `car` before `cart`. Cost is O(L) for the walk plus the size of what you explore, which stays small when `k` is small. For ranking by popularity, store a score at each end node, and either collect and sort the subtree, or keep a small top-k list on every node (more memory, O(1) at query time). Search Suggestions (1268) is the same task, and also has a sort-plus-binary-search solution with no trie at all.',
        code: {
          py: `def suggest(words, prefix, k):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {})
        node['$'] = True
    node = root
    for ch in prefix:
        if ch not in node:
            return []                            # nothing starts like this
        node = node[ch]
    out = []

    def dfs(node, path):
        if len(out) == k:
            return                               # enough: stop early
        if '$' in node:
            out.append(path)                     # the node itself comes before its children
        for c in sorted(key for key in node if key != '$'):
            dfs(node[c], path + c)               # alphabetical order

    dfs(node, prefix)
    return out`,
          js: `function suggest(words, prefix, k) {
  const root = {};
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = true;
  }
  let node = root;
  for (const ch of prefix) {
    if (!node[ch]) return [];                    // nothing starts like this
    node = node[ch];
  }
  const out = [];
  function dfs(node, path) {
    if (out.length === k) return;                // enough: stop early
    if (node.$) out.push(path);                  // the node itself comes before its children
    for (const c of Object.keys(node).filter(key => key !== '$').sort()) dfs(node[c], path + c);   // alphabetical order
  }
  dfs(node, prefix);
  return out;
}`
        },
        tests: { fn: 'suggest', cases: [
          { args: [['car', 'cart', 'cat', 'dog', 'cab'], 'ca', 3], out: ['cab', 'car', 'cart'] },
          { args: [['car', 'cart', 'cat', 'dog'], 'x', 2], out: [] },
          { args: [['car', 'cart', 'cat'], 'car', 5], out: ['car', 'cart'] },
          { args: [['a', 'ab', 'abc'], '', 2], out: ['a', 'ab'] },
          { args: [['to', 'to', 'tea'], 't', 5], out: ['tea', 'to'] }] }
      },
      {
        name: 'Trie + DFS on a grid',
        body: 'Finding **one** word in a grid is a depth-first search with backtracking. Finding **many** words by running that search once per word repeats the same first steps again and again. Instead, put all the words in a trie and run **one** DFS from each cell, carrying the trie node you are on. Step to a neighbour only if the current node has an edge for the neighbour’s letter; if not, that grid path cannot start any word, so stop. When you land on a node that holds a word, record it. Two optimisations that interviewers like: store the whole word at its end node (so you do not rebuild strings), and **delete a word after finding it** (and prune nodes that become empty), so a word is not reported twice and dead branches stop being explored. Worked below as Word Search II (212). Cost is about O(cells · 4 · 3^(maxLen − 1)) in the worst case, far less than word-by-word.'
      },
      {
        name: 'Trie or hash set? Memory and speed',
        body: 'For “is this exact word stored?” a **hash set** is simpler, usually faster in practice and often smaller. Reach for a trie when you need what a set cannot give: prefix existence, listing by prefix, shortest or longest stored prefix of a string, wildcard matches, or a stream where you want to stop at the first dead end.\n\nMemory is where tries surprise people. A hash set stores each word once (about its characters plus some overhead). A trie pays **per letter**: each node has a flag and 26 pointers (about 100 to 200 bytes in Java or C++, more in Python with a dict per node). A million random words of length 10 can take far more memory as a trie than as a set, because there is little shared beginning to save. Tries win when words **share long beginnings** (URLs, file paths, dictionary words, IP addresses). Tools to shrink them: map children instead of arrays, **compress chains** of single-child nodes into one edge labelled by a string (a radix tree), or use a **DAWG** that also shares word endings. Also note that sorting the words and using binary search answers prefix queries too, with no extra structure.'
      },
      {
        name: 'The same tree over bits',
        body: 'Replace letters by the **bits** of a number, from the highest to the lowest, and every node has just two children. This **binary trie** answers “which stored number has the largest XOR with `x`?” in O(bits): at each level, try to step to the child whose bit is **different** from `x`’s bit, which sets that bit of the result to 1; fall back to the same bit when the better child does not exist. It is the standard solution for Maximum XOR of Two Numbers (421) and its offline variants (1707). Treat it as an extension to learn after the main family; the shape of the code is identical to the lesson template.'
      },
      {
        name: 'When a trie is the wrong tool',
        body: 'If you only ask for whole words, use a hash set. If the strings are few or the queries are one-offs, sorting the list and using `bisect` (or `startswith` on a slice) is shorter and nearly as fast. If you search for a pattern **inside** text rather than at the start of words, you want string algorithms (Z, KMP, rolling hash) or a suffix structure: see [String algorithms](#/topic/string-algos). If you need the k most frequent words rather than the first k alphabetically, a [heap](#/topic/heaps) on counts does the ranking, and the trie only stores the words. Trees in general are covered in [Trees](#/topic/trees); a trie is a tree whose edges carry letters, and the grid search above is the same backtracking move you will meet in [Backtracking](#/topic/backtracking).'
      }
    ],

    worked: [
      {
        lc: 208,
        restate: 'Build a trie class. `insert(word)` stores a word, `search(word)` says whether exactly that word was stored, and `startsWith(prefix)` says whether any stored word begins with the given letters. All words are lowercase letters.',
        examples: '- Insert `apple`: `search("apple")` → true, `search("app")` → **false** (only a prefix so far), `startsWith("app")` → true.\n- Then insert `app`: `search("app")` → true.\n- Edge cases: searching an empty trie; a query longer than any stored word (`search("apples")` is false); inserting the same word twice (nothing breaks).',
        brute: 'Keep a list or set of the words. `search` is a set lookup, but `startsWith` has to check every stored word with `startswith`: O(n · L) per query. Fine for ten words, too slow for a dictionary of a hundred thousand.',
        insight: 'Spell each word as a path of letters from a shared root. A node holds up to 26 children and a flag. `insert` walks the letters and creates missing nodes; the last node gets the flag. One helper, `find`, walks a string and returns the node it lands on (or nothing); then `search` is “the node exists and the flag is up” and `startsWith` is “the node exists”. That one flag is the whole difference between a **word** and a **prefix**.',
        code: {
          py: `class Trie:
    def __init__(self):
        self.kids = [None] * 26                  # child nodes: each one is a Trie too
        self.end = False

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            i = ord(ch) - ord('a')
            if node.kids[i] is None:
                node.kids[i] = Trie()
            node = node.kids[i]
        node.end = True

    def _find(self, s: str):
        node = self
        for ch in s:
            node = node.kids[ord(ch) - ord('a')]
            if node is None:
                return None
        return node

    def search(self, word: str) -> bool:
        node = self._find(word)
        return node is not None and node.end

    def startsWith(self, prefix: str) -> bool:
        return self._find(prefix) is not None`,
          js: `class Trie {
  constructor() {
    this.kids = new Array(26).fill(null);        // child nodes: each one is a Trie too
    this.end = false;
  }
  insert(word) {
    let node = this;
    for (const ch of word) {
      const i = ch.charCodeAt(0) - 97;
      if (node.kids[i] === null) node.kids[i] = new Trie();
      node = node.kids[i];
    }
    node.end = true;
  }
  find(s) {
    let node = this;
    for (const ch of s) {
      node = node.kids[ch.charCodeAt(0) - 97];
      if (node === null) return null;
    }
    return node;
  }
  search(word) {
    const node = this.find(word);
    return node !== null && node.end;
  }
  startsWith(prefix) {
    return this.find(prefix) !== null;
  }
}`,
          java: `class Trie {
    private final Trie[] kids = new Trie[26];    // child nodes: each one is a Trie too
    private boolean end;

    public Trie() {
    }

    public void insert(String word) {
        Trie node = this;
        for (char ch : word.toCharArray()) {
            int i = ch - 'a';
            if (node.kids[i] == null) node.kids[i] = new Trie();
            node = node.kids[i];
        }
        node.end = true;
    }

    private Trie find(String s) {
        Trie node = this;
        for (char ch : s.toCharArray()) {
            node = node.kids[ch - 'a'];
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word) {
        Trie node = find(word);
        return node != null && node.end;
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;
    }
}`,
          cpp: `class Trie {
    Trie* kids[26] = {};                         // child nodes: each one is a Trie too
    bool end = false;

    Trie* find(const string& s) {
        Trie* node = this;
        for (char ch : s) {
            node = node->kids[ch - 'a'];
            if (node == nullptr) return nullptr;
        }
        return node;
    }
public:
    Trie() {}

    void insert(string word) {
        Trie* node = this;
        for (char ch : word) {
            int i = ch - 'a';
            if (node->kids[i] == nullptr) node->kids[i] = new Trie();
            node = node->kids[i];
        }
        node->end = true;
    }

    bool search(string word) {
        Trie* node = find(word);
        return node != nullptr && node->end;
    }

    bool startsWith(string prefix) {
        return find(prefix) != nullptr;
    }
};`
        },
        complexity: 'Each operation is O(L) for a word of length L. Space is O(total letters stored), with 26 slots per node.',
        say: '“I model each word as a path of letters from a shared root. A node has 26 child slots and a boolean that marks the end of a stored word. Insert walks the letters and creates any missing node, then sets the flag on the last one. I write one helper that walks a string and returns the node it ends at, or null. Search is that node being non-null and flagged; startsWith is just non-null. The flag is what separates a word from a mere prefix. Everything is O(L), independent of how many words are stored.”',
        followups: [
          { q: 'Why is `search("app")` false after inserting only `apple`?', a: 'The path `a-p-p` exists, but the node for `app` has no end flag, so `app` is only a prefix. This is the case the flag is for.' },
          { q: 'How would you support delete?', a: 'Walk to the word, clear its flag, and on the way back up remove any node that has no flag and no children. A per-node pass count makes this simpler.' },
          { q: 'Array or map for the children?', a: 'Array of 26 for lowercase letters (fast, simple); a map for a large or unknown alphabet or a sparse trie. See the node-design variation.' },
          { q: 'Why not a hash set of words?', a: '`search` would be fine, but `startsWith` would scan every word. You could also store every prefix of every word in a set (O(n · L) memory), which is the trie flattened.' }
        ]
      },
      {
        lc: 211,
        restate: 'Design a word dictionary. `addWord(word)` stores a word, and `search(pattern)` says whether some stored word matches the pattern, where a `.` in the pattern stands for **any single letter** and every other character must match exactly. Lengths must match too.',
        examples: '- Add `bad`, `dad`, `mad`: `search("pad")` → false, `search("bad")` → true, `search(".ad")` → true, `search("b..")` → true.\n- `search("b.")` → false: the pattern is shorter than every stored word.\n- Edge cases: a pattern of only dots; searching before any word is added; a dot at the very end.',
        brute: 'Keep a list of words. For each search, compare the pattern against every stored word of the same length, character by character. That is O(n · L) per search, which gets slow on a big dictionary with many queries.',
        insight: 'Store the words in a trie. A search without dots is a normal walk. At a dot, you do not know which child to take, so **try all of them**: a small depth-first search that carries the position in the pattern and the current node. At the end of the pattern the answer is that node’s end flag (not just “the node exists”, or `b.` would wrongly match `bad`). Letters prune the search to one child; only dots branch.',
        code: {
          py: `class WordDictionary:
    def __init__(self):
        self.root = {}

    def addWord(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node['$'] = True                         # '$' marks a word end; letters never collide with it

    def search(self, word: str) -> bool:
        def dfs(i, node):
            if i == len(word):
                return '$' in node               # the whole pattern is used: need a word end
            ch = word[i]
            if ch == '.':
                return any(dfs(i + 1, child) for key, child in node.items() if key != '$')
            return ch in node and dfs(i + 1, node[ch])
        return dfs(0, self.root)`,
          js: `class WordDictionary {
  constructor() {
    this.root = {};
  }
  addWord(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = true;                               // '$' marks a word end; letters never collide with it
  }
  search(word) {
    const dfs = (i, node) => {
      if (i === word.length) return node.$ === true;   // the whole pattern is used: need a word end
      const ch = word[i];
      if (ch === '.') {
        for (const key of Object.keys(node)) if (key !== '$' && dfs(i + 1, node[key])) return true;
        return false;
      }
      return node[ch] !== undefined && dfs(i + 1, node[ch]);
    };
    return dfs(0, this.root);
  }
}`,
          java: `class WordDictionary {
    private static class Node {
        Node[] kids = new Node[26];
        boolean end;
    }

    private final Node root = new Node();

    public WordDictionary() {
    }

    public void addWord(String word) {
        Node node = root;
        for (char ch : word.toCharArray()) {
            int i = ch - 'a';
            if (node.kids[i] == null) node.kids[i] = new Node();
            node = node.kids[i];
        }
        node.end = true;
    }

    public boolean search(String word) {
        return dfs(word, 0, root);
    }

    private boolean dfs(String w, int i, Node node) {
        if (i == w.length()) return node.end;    // the whole pattern is used: need a word end
        char ch = w.charAt(i);
        if (ch == '.') {
            for (Node kid : node.kids) {         // a dot: try every child
                if (kid != null && dfs(w, i + 1, kid)) return true;
            }
            return false;
        }
        Node next = node.kids[ch - 'a'];
        return next != null && dfs(w, i + 1, next);
    }
}`,
          cpp: `class WordDictionary {
    struct Node {
        Node* kids[26] = {};
        bool end = false;
    };
    Node* root = new Node();

    bool dfs(const string& w, int i, Node* node) {
        if (i == (int)w.size()) return node->end;    // the whole pattern is used: need a word end
        char ch = w[i];
        if (ch == '.') {
            for (Node* kid : node->kids) {           // a dot: try every child
                if (kid != nullptr && dfs(w, i + 1, kid)) return true;
            }
            return false;
        }
        Node* next = node->kids[ch - 'a'];
        return next != nullptr && dfs(w, i + 1, next);
    }
public:
    WordDictionary() {}

    void addWord(string word) {
        Node* node = root;
        for (char ch : word) {
            int i = ch - 'a';
            if (node->kids[i] == nullptr) node->kids[i] = new Node();
            node = node->kids[i];
        }
        node->end = true;
    }

    bool search(string word) {
        return dfs(word, 0, root);
    }
};`
        },
        complexity: '`addWord` is O(L). `search` is O(L) with no dots; with d dots it can visit up to 26^d branches, bounded overall by the number of nodes in the trie. Space is O(total letters).',
        say: '“Same trie as before. A search with no dots is a straight walk, but a dot means any letter, so I switch to a recursive DFS that carries the position in the pattern and the current node. On a letter I follow that one child; on a dot I try every child and return true if any works. When the pattern is used up I return whether the node is a word end, which is what makes `b.` fail against `bad`. Letters prune hard, so it is fast unless the pattern is mostly dots.”',
        followups: [
          { q: 'What is the worst case, and can you improve it?', a: 'A pattern of all dots visits every node: O(total letters). You can bucket words by length first so patterns only search tries (or subtrees) of the right depth, or store a per-node maximum depth to cut branches that are too short.' },
          { q: 'Why check the end flag at the end?', a: 'Reaching the node means the letters matched a prefix; only the flag says a stored word ends there. Without it, `ba` would match `bad`.' },
          { q: 'Why not store every wildcard variant of every word in a set?', a: 'A word of length L has 2^L masked versions, so memory explodes. The trie shares the work instead.' },
          { q: 'Could you do this with a hash set instead?', a: 'Group words by length and compare each candidate against the pattern. It works but costs O(words of that length) per search, which is the brute force.' }
        ]
      },
      {
        lc: 212,
        restate: 'You get a grid of lowercase letters and a list of words. Return every word from the list that can be spelled by walking through **side-by-side** cells (up, down, left, right), using each cell at most once per word. Each word counts once, however many ways it can be traced.',
        examples: '- Grid `[[c,a],[t,s]]`, words `cat, cats, cast, act, tac`: `cast` (c, a, s, t) and `act` (a, c, t) can be traced; `cat` cannot, because `a` and `t` touch only diagonally. Answer: `cast`, `act`.\n- A single cell `a` with words `a, b` → `a`.\n- Edge cases: a word needing the same cell twice (`aaa` in a row of two `a`s) is not allowed; the answer may be empty; two words that share a start.',
        brute: 'For each word, run a backtracking search from every cell: O(words · cells · 4 · 3^(L−1)). Words with the same start redo the same walk, and with thousands of words it is far too slow.',
        insight: 'Put **all** the words in a trie, then run one DFS from every cell, carrying the trie node. From a cell, only step to a neighbour if the current trie node has an edge for the neighbour’s letter: a grid path that no word starts with is cut at once. Every word that shares a start is explored in a single walk. Store the finished word on its end node so you can append it directly, then **remove it from the trie** when found (so it is reported once) and prune a node when it has nothing left under it, so dead parts of the trie stop costing time. Mark the cell as used during the walk and restore it on the way back.',
        code: {
          py: `class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        root = {}
        for w in words:
            node = root
            for ch in w:
                node = node.setdefault(ch, {})
            node['$'] = w                        # store the whole word at its end node
        rows, cols = len(board), len(board[0])
        found = []

        def dfs(r, c, parent):
            ch = board[r][c]
            node = parent[ch]
            if '$' in node:
                found.append(node.pop('$'))      # report once: remove it from the trie
            board[r][c] = '#'                    # this cell is in use on the current path
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] in node:
                    dfs(nr, nc, node)
            board[r][c] = ch                     # backtrack
            if not node:
                del parent[ch]                   # nothing left under here: prune the branch

        for r in range(rows):
            for c in range(cols):
                if board[r][c] in root:
                    dfs(r, c, root)
        return found`,
          js: `function findWords(board, words) {
  const root = {};
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = w;                                  // store the whole word at its end node
  }
  const rows = board.length, cols = board[0].length, found = [];

  function dfs(r, c, parent) {
    const ch = board[r][c], node = parent[ch];
    if (node.$ !== undefined) {
      found.push(node.$);                        // report once: remove it from the trie
      delete node.$;
    }
    board[r][c] = '#';                           // this cell is in use on the current path
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && node[board[nr][nc]]) dfs(nr, nc, node);
    }
    board[r][c] = ch;                            // backtrack
    if (Object.keys(node).length === 0) delete parent[ch];   // nothing left under here: prune the branch
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (root[board[r][c]]) dfs(r, c, root);
    }
  }
  return found;
}`,
          java: `class Solution {
    private static class Node {
        Node[] kids = new Node[26];
        String word;                             // the whole word, set on its end node
    }

    private boolean empty(Node node) {
        if (node.word != null) return false;
        for (Node kid : node.kids) if (kid != null) return false;
        return true;
    }

    public List<String> findWords(char[][] board, String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char ch : w.toCharArray()) {
                int i = ch - 'a';
                if (node.kids[i] == null) node.kids[i] = new Node();
                node = node.kids[i];
            }
            node.word = w;
        }
        List<String> found = new ArrayList<>();
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                dfs(board, r, c, root, found);
            }
        }
        return found;
    }

    private void dfs(char[][] b, int r, int c, Node parent, List<String> found) {
        char ch = b[r][c];
        if (ch == '#') return;                   // already on the current path
        Node node = parent.kids[ch - 'a'];
        if (node == null) return;                // no word continues this way
        if (node.word != null) {
            found.add(node.word);                // report once: remove it from the trie
            node.word = null;
        }
        b[r][c] = '#';                           // this cell is in use on the current path
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < b.length && nc >= 0 && nc < b[0].length) dfs(b, nr, nc, node, found);
        }
        b[r][c] = ch;                            // backtrack
        if (empty(node)) parent.kids[ch - 'a'] = null;   // nothing left under here: prune the branch
    }
}`,
          cpp: `class Solution {
    struct Node {
        Node* kids[26] = {};
        string word;                             // the whole word, set on its end node
        bool has = false;
    };

    bool empty(Node* node) {
        if (node->has) return false;
        for (Node* kid : node->kids) if (kid != nullptr) return false;
        return true;
    }

    void dfs(vector<vector<char>>& b, int r, int c, Node* parent, vector<string>& found) {
        char ch = b[r][c];
        if (ch == '#') return;                   // already on the current path
        Node* node = parent->kids[ch - 'a'];
        if (node == nullptr) return;             // no word continues this way
        if (node->has) {
            found.push_back(node->word);         // report once: remove it from the trie
            node->has = false;
        }
        b[r][c] = '#';                           // this cell is in use on the current path
        int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < (int)b.size() && nc >= 0 && nc < (int)b[0].size()) dfs(b, nr, nc, node, found);
        }
        b[r][c] = ch;                            // backtrack
        if (empty(node)) parent->kids[ch - 'a'] = nullptr;   // nothing left under here: prune the branch
    }
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        Node* root = new Node();
        for (const string& w : words) {
            Node* node = root;
            for (char ch : w) {
                int i = ch - 'a';
                if (node->kids[i] == nullptr) node->kids[i] = new Node();
                node = node->kids[i];
            }
            node->word = w;
            node->has = true;
        }
        vector<string> found;
        for (int r = 0; r < (int)board.size(); r++) {
            for (int c = 0; c < (int)board[0].size(); c++) {
                dfs(board, r, c, root, found);
            }
        }
        return found;
    }
};`
        },
        complexity: 'Building the trie is O(total letters). The search is bounded by O(cells · 3^(maxLen)): from each start the walk can branch to at most 3 new neighbours per step (not back where it came from), and only as deep as the longest word. The trie prunes most of that. Space is O(total letters) for the trie plus O(maxLen) recursion.',
        say: '“Running a separate grid search per word repeats the same prefixes, so I put all words in a trie and do one DFS from every cell with the current trie node in hand. I only step to a neighbour when the node has an edge for that letter, so impossible paths die immediately. I store the finished word on its end node; when I reach it I add it to the answer and remove it so duplicates are impossible, and I delete trie nodes that are empty so dead branches stop being explored. I mark the cell used while it is on the path and restore it when I backtrack. The cost is far below words times cells because words with the same start share one walk.”',
        followups: [
          { q: 'Why remove a word after finding it?', a: 'So it cannot be reported twice by another path, and so its branch can be pruned. Without pruning the worst cases (many long words sharing a start) time out.' },
          { q: 'Why mark cells with `#` instead of a visited set?', a: 'It is O(1), allocates nothing and is undone on the way back. The letters are lowercase, so `#` can never collide with a real letter.' },
          { q: 'What if the same word appears twice in the input?', a: 'The trie stores it once, so it is found once. If duplicates should be reported twice, store a count instead.' },
          { q: 'Is a trie better than per-word DFS for a single word?', a: 'No. For one word, plain backtracking (Word Search, 79) is simpler and just as fast. The trie pays off as the number of words grows.' }
        ]
      },
      {
        lc: 648,
        restate: 'You are given a list of short **stems** and a sentence of words separated by single spaces. Rewrite the sentence so that every word that begins with some stem is replaced by that stem. If several stems fit one word, use the **shortest** one. Words with no matching stem stay as they are.',
        examples: '- Stems `cat, bat, rat`; sentence `the cattle was rattled by the battery` → `the cat was rat by the bat`.\n- Stems `a, aa, aaa`; sentence `aaa aa a bbb` → `a a a bbb`: `a` is the shortest stem for each.\n- Edge cases: no stems at all; a stem that is longer than the word; a stem that equals the whole word (`ab` against `ab`).',
        brute: 'For each word, test every stem with `startswith` and keep the shortest match. That is O(words · stems · L). Most of those comparisons repeat work on the same first letters.',
        insight: 'Put the stems in a trie. For each word, walk down it letter by letter. The **first** time you reach a node flagged as the end of a stem, you have found the shortest matching stem, so return the letters read so far and stop. If the path breaks first, or the word ends with no flag seen, keep the word unchanged. Stopping at the first flag is exactly “shortest”.',
        code: {
          py: `class Solution:
    def replaceWords(self, dictionary: List[str], sentence: str) -> str:
        root = {}
        for stem in dictionary:
            node = root
            for ch in stem:
                node = node.setdefault(ch, {})
            node['$'] = True

        def shortest(word):
            node = root
            for i, ch in enumerate(word):
                if ch not in node:
                    break                        # no stem continues this way
                node = node[ch]
                if '$' in node:
                    return word[:i + 1]          # the first flag is the shortest stem
            return word

        return ' '.join(shortest(w) for w in sentence.split())`,
          js: `function replaceWords(dictionary, sentence) {
  const root = {};
  for (const stem of dictionary) {
    let node = root;
    for (const ch of stem) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = true;
  }
  function shortest(word) {
    let node = root;
    for (let i = 0; i < word.length; i++) {
      if (!node[word[i]]) break;                 // no stem continues this way
      node = node[word[i]];
      if (node.$) return word.slice(0, i + 1);   // the first flag is the shortest stem
    }
    return word;
  }
  return sentence.split(' ').map(shortest).join(' ');
}`,
          java: `class Solution {
    private static class Node {
        Node[] kids = new Node[26];
        boolean end;
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        Node root = new Node();
        for (String stem : dictionary) {
            Node node = root;
            for (char ch : stem.toCharArray()) {
                int i = ch - 'a';
                if (node.kids[i] == null) node.kids[i] = new Node();
                node = node.kids[i];
            }
            node.end = true;
        }
        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            Node node = root;
            int cut = word.length();             // keep the whole word unless a stem ends earlier
            for (int i = 0; i < word.length(); i++) {
                node = node.kids[word.charAt(i) - 'a'];
                if (node == null) break;         // no stem continues this way
                if (node.end) { cut = i + 1; break; }   // the first flag is the shortest stem
            }
            out.append(word, 0, cut);
        }
        return out.toString();
    }
}`,
          cpp: `class Solution {
    struct Node {
        Node* kids[26] = {};
        bool end = false;
    };
public:
    string replaceWords(vector<string>& dictionary, string sentence) {
        Node* root = new Node();
        for (const string& stem : dictionary) {
            Node* node = root;
            for (char ch : stem) {
                int i = ch - 'a';
                if (node->kids[i] == nullptr) node->kids[i] = new Node();
                node = node->kids[i];
            }
            node->end = true;
        }
        string out, word;
        stringstream ss(sentence);
        while (ss >> word) {
            if (!out.empty()) out += ' ';
            Node* node = root;
            size_t cut = word.size();            // keep the whole word unless a stem ends earlier
            for (size_t i = 0; i < word.size(); i++) {
                node = node->kids[word[i] - 'a'];
                if (node == nullptr) break;      // no stem continues this way
                if (node->end) { cut = i + 1; break; }   // the first flag is the shortest stem
            }
            out += word.substr(0, cut);
        }
        return out;
    }
};`
        },
        complexity: 'O(S + W) where S is the total letters in the stems (building the trie) and W the total letters in the sentence (each word is walked at most once, and never farther than its own length). Space is O(S).',
        say: '“I put the stems in a trie. For each word I walk it letter by letter through the trie, and the first time I land on a node flagged as a stem end I return the letters so far, which is the shortest stem by construction. If the path breaks or the word ends first, I keep the word. Building is linear in the stems and each word costs at most its own length, so the whole thing is linear in the input.”',
        followups: [
          { q: 'What if you wanted the **longest** matching stem instead?', a: 'Keep walking, remember the last flagged position, and stop when the path breaks or the word ends. Return the word up to that position.' },
          { q: 'Could you avoid the trie by sorting the stems?', a: 'Yes: sort, drop stems that start with an earlier stem, and use binary search per word. It is shorter to write but less direct, and the trie is the cleaner story.' },
          { q: 'Why does stopping at the first flag give the shortest?', a: 'Walking goes through shorter prefixes before longer ones, so the first flag met belongs to the shortest stem.' }
        ]
      }
    ],

    practice: [
      { lc: 208,
        hints: ['Each word is a path of letters from a shared root. Make a node type with children and a flag.', 'Write one helper that walks a string from the root and returns the node it ends on (or nothing if the path breaks).', '`search` needs the node **and** its end flag; `startsWith` needs only the node. Inserting creates missing children and flags the last node.'],
        starter: { py: 'class Trie:\n    def __init__(self):\n        pass\n\n    def insert(self, word: str) -> None:\n        pass\n\n    def search(self, word: str) -> bool:\n        pass\n\n    def startsWith(self, prefix: str) -> bool:\n        pass', js: 'class Trie {\n  constructor() {\n  }\n  insert(word) {\n  }\n  search(word) {\n  }\n  startsWith(prefix) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['Trie', 'insert', 'search', 'search', 'startsWith', 'insert', 'search'], args: [[], ['apple'], ['apple'], ['app'], ['app'], ['app'], ['app']], out: [null, null, true, false, true, null, true] },
          { ops: ['Trie', 'search', 'startsWith', 'insert', 'startsWith', 'search'], args: [[], ['a'], ['a'], ['car'], ['ca'], ['ca']], out: [null, false, false, null, true, false] },
          { ops: ['Trie', 'insert', 'insert', 'search', 'search', 'startsWith', 'startsWith'], args: [[], ['car'], ['cart'], ['car'], ['cars'], ['cart'], ['carts']], out: [null, null, null, true, false, true, false] }] } },

      { lc: 211,
        hints: ['Store the words in a trie. A search without dots is the usual walk.', 'When the pattern has a `.`, you cannot tell which child to follow: try **every** child, recursively, and succeed if any works.', 'When you run out of pattern, return the node’s end flag, not just “reached a node”, or a short pattern would match a longer word.'],
        starter: { py: 'class WordDictionary:\n    def __init__(self):\n        pass\n\n    def addWord(self, word: str) -> None:\n        pass\n\n    def search(self, word: str) -> bool:\n        pass', js: 'class WordDictionary {\n  constructor() {\n  }\n  addWord(word) {\n  }\n  search(word) {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['WordDictionary', 'addWord', 'addWord', 'addWord', 'search', 'search', 'search', 'search', 'search'], args: [[], ['bad'], ['dad'], ['mad'], ['pad'], ['bad'], ['.ad'], ['b..'], ['b.']], out: [null, null, null, null, false, true, true, true, false] },
          { ops: ['WordDictionary', 'search', 'addWord', 'search', 'search', 'search'], args: [[], ['.'], ['a'], ['.'], ['a.'], ['..']], out: [null, false, null, true, false, false] },
          { ops: ['WordDictionary', 'addWord', 'addWord', 'search', 'search', 'search', 'search'], args: [[], ['at'], ['and'], ['a.'], ['a..'], ['...'], ['.n.']], out: [null, null, null, true, true, true, true] }] } },

      { lc: 212,
        hints: ['Running a separate grid search per word repeats the same beginnings. Put all the words in a trie instead.', 'Run one DFS from each cell, carrying the current trie node. Step to a neighbour only if that node has an edge for the neighbour’s letter.', 'Store the full word on its end node. When the DFS reaches it, add it to the answer and remove it so it is reported once. Mark the cell as used on the way down and restore it on the way back.'],
        starter: { py: 'class Solution:\n    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:\n        ', js: 'function findWords(board, words) {\n  \n}' },
        tests: { fn: 'findWords', compare: 'unordered', sig: { args: ['char[][]', 'str[]'] }, cases: [
          { args: [[['c', 'a'], ['t', 's']], ['cat', 'cats', 'cast', 'act', 'tac']], out: ['cast', 'act'] },
          { args: [[['a']], ['a', 'b']], out: ['a'] },
          { args: [[['a', 'b'], ['c', 'd']], ['abdc', 'abcd', 'ab', 'dcba']], out: ['abdc', 'ab'] },
          { args: [[['a', 'a']], ['aaa']], out: [] },
          { args: [[['a', 'b', 'c']], ['abc', 'cba', 'ac']], out: ['abc', 'cba'] }] } },

      { lc: 648,
        hints: ['For each word you want the shortest stem it starts with. Many comparisons share the same first letters.', 'Put the stems in a trie and flag the end of each one.', 'Walk each word through the trie. The first flagged node you reach is the shortest stem: return the letters so far. If the path breaks first, keep the word.'],
        starter: { py: 'class Solution:\n    def replaceWords(self, dictionary: List[str], sentence: str) -> str:\n        ', js: 'function replaceWords(dictionary, sentence) {\n  \n}' },
        tests: { fn: 'replaceWords', sig: { args: ['list<str>', 'str'] }, cases: [
          { args: [['cat', 'bat', 'rat'], 'the cattle was rattled by the battery'], out: 'the cat was rat by the bat' },
          { args: [['a', 'aa', 'aaa'], 'aaa aa a bbb'], out: 'a a a bbb' },
          { args: [[], 'hello world'], out: 'hello world' },
          { args: [['ab'], 'a ab abc'], out: 'a ab ab' },
          { args: [['app', 'apple'], 'apple apply'], out: 'app app' }] } },

      { lc: 14,
        hints: ['The common prefix cannot be longer than the shortest string, or than the first one. Start from the first string.', 'Check one column at a time: take character `i` of the first string and compare it with character `i` of every other string.', 'Return the first string up to column `i` as soon as some string is too short or has a different letter there. (A trie works too, but this scan needs no extra structure.)'],
        solution: { explain: 'Scan column by column over the first string. The first column where any other string is too short or differs ends the common prefix. O(total letters) time, O(1) extra space. A trie of all strings would also work (the common prefix is the chain from the root until a node has two children or an end flag) but costs memory for no gain here.', code: {
          py: `class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        first = strs[0]
        for i, ch in enumerate(first):
            for s in strs[1:]:
                if i == len(s) or s[i] != ch:
                    return first[:i]             # this column breaks the prefix
        return first`,
          js: `function longestCommonPrefix(strs) {
  const first = strs[0];
  for (let i = 0; i < first.length; i++) {
    for (let k = 1; k < strs.length; k++) {
      if (i === strs[k].length || strs[k][i] !== first[i]) return first.slice(0, i);   // this column breaks the prefix
    }
  }
  return first;
}` } },
        starter: { py: 'class Solution:\n    def longestCommonPrefix(self, strs: List[str]) -> str:\n        ', js: 'function longestCommonPrefix(strs) {\n  \n}' },
        tests: { fn: 'longestCommonPrefix', cases: [
          { args: [['flower', 'flow', 'flight']], out: 'fl' }, { args: [['dog', 'racecar', 'car']], out: '' }, { args: [['a']], out: 'a' },
          { args: [['abc', 'abc']], out: 'abc' }, { args: [['ab', 'a']], out: 'a' }, { args: [['', 'b']], out: '' }] } },

      { lc: 720,
        hints: ['A word qualifies if you can build it one letter at a time: each shorter prefix of it must also be in the list.', 'Sort the words. Then every prefix of a word comes before it, and among equal lengths the alphabetically smaller word comes first.', 'Keep a set of buildable words (start with the empty string). For each word in order, if the word minus its last letter is in the set, add it, and keep it as the best if it is strictly longer than the current best.'],
        solution: { explain: 'Sorting guarantees that when we reach a word, all its shorter prefixes were already decided. A word is buildable when its prefix without the last letter is buildable. Taking only strictly longer words keeps the alphabetically smallest among equals. O(n log n · L) for the sort, O(total letters) space. A trie with a DFS that only follows flagged nodes gives the same answer.', code: {
          py: `class Solution:
    def longestWord(self, words: List[str]) -> str:
        built = {''}
        best = ''
        for w in sorted(words):
            if w[:-1] in built:                  # its prefix was buildable, so it is too
                built.add(w)
                if len(w) > len(best):
                    best = w
        return best`,
          js: `function longestWord(words) {
  const built = new Set(['']);
  let best = '';
  for (const w of [...words].sort()) {
    if (built.has(w.slice(0, -1))) {             // its prefix was buildable, so it is too
      built.add(w);
      if (w.length > best.length) best = w;
    }
  }
  return best;
}` } },
        starter: { py: 'class Solution:\n    def longestWord(self, words: List[str]) -> str:\n        ', js: 'function longestWord(words) {\n  \n}' },
        tests: { fn: 'longestWord', cases: [
          { args: [['w', 'wo', 'wor', 'worl', 'world']], out: 'world' }, { args: [['a', 'banana', 'app', 'appl', 'ap', 'apply', 'apple']], out: 'apple' },
          { args: [['b', 'br', 'bre', 'a', 'ab']], out: 'bre' }, { args: [['x']], out: 'x' }, { args: [['ab', 'abc']], out: '' }, { args: [['a', 'b', 'c']], out: 'a' }] } },

      { lc: 1268,
        hints: ['For each prefix of the typed word you need up to three products that start with it, in alphabetical order.', 'Sort the products once. All products that start with a prefix then sit next to each other, beginning at the first product that is not smaller than the prefix.', 'Binary search for that start, then take up to three products from there, keeping only those that really start with the prefix. A trie with an alphabetical DFS also works.'],
        solution: { explain: 'Sort once. For each growing prefix, binary search for its first position (`bisect_left`), then check the next three entries against the prefix. O(n log n) to sort, then O(L · (log n + 3 · L)). A trie that stores the first three words at each node gives O(1) per prefix after the build, at the cost of memory.', code: {
          py: `class Solution:
    def suggestedProducts(self, products: List[str], searchWord: str) -> List[List[str]]:
        products.sort()
        out = []
        prefix = ''
        for ch in searchWord:
            prefix += ch
            i = bisect_left(products, prefix)    # first product not smaller than the prefix
            out.append([p for p in products[i:i + 3] if p.startswith(prefix)])
        return out`,
          js: `function suggestedProducts(products, searchWord) {
  products.sort();
  const out = [];
  let prefix = '';
  for (const ch of searchWord) {
    prefix += ch;
    let lo = 0, hi = products.length;            // first product not smaller than the prefix
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (products[mid] < prefix) lo = mid + 1;
      else hi = mid;
    }
    out.push(products.slice(lo, lo + 3).filter(p => p.startsWith(prefix)));
  }
  return out;
}` } },
        starter: { py: 'class Solution:\n    def suggestedProducts(self, products: List[str], searchWord: str) -> List[List[str]]:\n        ', js: 'function suggestedProducts(products, searchWord) {\n  \n}' },
        tests: { fn: 'suggestedProducts', cases: [
          { args: [['cart', 'car', 'cat', 'dog'], 'ca'], out: [['car', 'cart', 'cat'], ['car', 'cart', 'cat']] },
          { args: [['apple', 'apply', 'ape', 'ant', 'bat'], 'app'], out: [['ant', 'ape', 'apple'], ['ape', 'apple', 'apply'], ['apple', 'apply']] },
          { args: [['x'], 'y'], out: [[]] },
          { args: [['go', 'gone', 'gong', 'gold', 'golf'], 'gol'], out: [['go', 'gold', 'golf'], ['go', 'gold', 'golf'], ['gold', 'golf']] },
          { args: [['b', 'a'], 'abc'], out: [['a'], [], []] }] } }
    ],

    mistakes: [
      '**Forgetting the end-of-word flag.** Without it, `search("app")` returns true after inserting only `apple`, because the path exists. `search` needs the path **and** the flag; `startsWith` needs only the path. If a test fails on a word that is a prefix of another, look here first.',
      '**Returning “found” instead of the flag in wildcard search.** When the pattern runs out, check `node.end`. Returning true on reaching any node makes `b.` match `bad`.',
      '**Indexing an array of 26 with a character that is not `a` to `z`.** An uppercase letter, a digit, a space or a `.` gives a negative or out-of-range index (and in Java a silent wrong slot or an exception). Confirm the alphabet, or use a map.',
      '**Sharing one mutable default for the children.** In Python, `def __init__(self, kids=[])` or `[Node()] * 26` makes every node point at the same list. Build the container fresh in each node: `{}` or `[None] * 26`.',
      '**Forgetting to restore the cell in grid search.** Marking a cell as used (`board[r][c] = "#"`) and not putting the letter back makes later paths fail for no visible reason. Always undo on the way back, on every exit of the DFS.',
      '**Not removing a found word, then reporting it twice.** Two different paths can spell the same word. Clear the stored word (or its flag) when you record it, and prune empty nodes so the search stops visiting them.',
      '**Using a trie where a set is enough, or the reverse.** Whole-word lookup alone is a hash-set job. And do not forget the memory cost: a trie of a million unrelated words can dwarf a set. Say the trade-off.',
      '**Language gotchas.** *Python:* a dict-per-node trie is compact to write but heavy on memory; use `setdefault` to descend and create. *JavaScript:* a plain object as a map has inherited keys (`constructor`, `toString`); for arbitrary characters use `Map`. *Java:* `new Node[26]` holds nulls, so check for `null` before descending; `ch - \'a\'` is an `int`. *C++:* `Node* kids[26]` is **not** zeroed unless you write `= {}`; forgetting that gives garbage pointers.'
    ],

    quiz: [
      { kind: 'concept', q: 'You insert only the word `car` into a trie. What do `search("ca")` and `startsWith("ca")` return?',
        choices: ['false and true', 'true and true', 'false and false', 'true and false'], answer: 0,
        explain: 'The path `c-a` exists, so `startsWith` is true. But the node for `ca` has no end flag (only the node for `car` does), so `ca` is a prefix and not a stored word: `search` is false.' },
      { kind: 'complexity', q: 'A trie holds 100,000 words. How long does `search("cat")` take?',
        choices: ['O(3), proportional to the length of the query', 'O(100,000), it checks every word', 'O(log 100,000)', 'O(1) with no dependence on the word'], answer: 0,
        explain: 'The walk takes one step per letter of the query, so the time is O(L). It does not depend on how many words are stored. (Strictly it is not O(1): a longer query takes longer.)' },
      { kind: 'pattern', q: 'Which task is best served by a trie?',
        choices: ['Report every dictionary word that starts with what the user has typed so far', 'Check whether a list of numbers contains a duplicate', 'Find the longest substring without a repeating character', 'Find the k-th smallest element of an array'], answer: 0,
        explain: 'Starts-with queries and enumeration by prefix are what a trie is for. Duplicates are a hash set, the longest unique substring is a sliding window, and the k-th smallest is a heap or a sort.' },
      { kind: 'pattern', q: 'Which signals point to a trie? Pick every one that applies.',
        choices: ['Many words, and queries about how words **begin**', 'A pattern with `.` standing for any letter, over a growing dictionary', 'A long list of target words to find in one grid of letters', 'Count the occurrences of a single pattern inside one long text'], answer: [0, 1, 2],
        explain: 'Prefix questions, wildcard queries and many-words-in-a-grid are the trie family. Finding one pattern inside one long text is a string-matching problem (KMP, Z, rolling hash).' },
      { kind: 'concept', q: 'Why do Java and C++ tries usually use `kids[26]` while Python tries use a `dict` per node?',
        choices: ['The array is fast and simple for lowercase letters, while a dict stores only the letters that occur and is easy to write', 'Python cannot create arrays', 'An array of 26 uses less memory than a dict in every case', 'A dict is required to mark word ends'], answer: 0,
        explain: 'Both designs are valid in every language. An array gives O(1) indexing with no hashing but reserves 26 slots per node; a dict pays only for existing letters. The word-end flag is a separate field in both.' },
      { kind: 'bug', q: 'This `search` says true for `app` after only `apple` was inserted. What is wrong?',
        code: `def search(self, word):
    node = self.root
    for ch in word:
        if ch not in node.kids:
            return False
        node = node.kids[ch]
    return True`,
        choices: ['It never checks the end-of-word flag at the final node', 'It should check `ch in node.kids` after the move, not before', 'It must start from `node.kids`, not from the root', 'It should return `False` at the end'], answer: 0,
        explain: 'Reaching the node only proves the path exists, so this is really `startsWith`. `search` must return `node.end` at the last node.' },
      { kind: 'concept', q: 'In wildcard search, what should the code do on a `.` in the pattern?',
        choices: ['Try every child of the current node and succeed if any branch matches the rest', 'Skip the character and stay on the same node', 'Follow only the first child', 'Return true immediately'], answer: 0,
        explain: 'A dot stands for any one letter, so each child could be the right one. Recurse into all of them with the rest of the pattern and combine the results with “or”.' },
      { kind: 'concept', q: 'You store 1,000,000 unrelated random 12-letter strings and only ever ask “is this exact string present?”. Which is the better structure?',
        choices: ['A hash set: it is simpler and, with so little shared prefix, much smaller than a trie', 'A trie: it is always smaller', 'A trie: lookups are O(1)', 'A sorted list: lookups are O(1)'], answer: 0,
        explain: 'A trie pays per letter and saves memory only when words share beginnings. With random strings there is almost no sharing, and exact-match lookup is exactly what a hash set does well. Use a trie when you need prefix queries.' }
    ],

    flashcards: [
      { id: 'trie-shape', front: 'What is a trie, in one sentence?', back: 'A tree where each edge is a letter and each node is the prefix spelled on the path from the root; words that start the same share a path. Operations cost O(length of the word).' },
      { id: 'end-flag', front: 'Trie: how do `search` and `startsWith` differ?', back: '`startsWith`: the path for the letters exists. `search`: the path exists **and** the last node has the end-of-word flag. The flag separates a word from a mere prefix.' },
      { id: 'trie-node', front: 'What does a trie node hold?', back: 'Children (a map letter to node, or an array of 26) plus an end-of-word marker (a boolean, a count, or the whole word).' },
      { id: 'array-or-map', front: 'Array of 26 or a map for the children?', back: 'Array: lowercase letters only, O(1) index, 26 slots reserved per node. Map: any alphabet, only existing letters stored, a hash lookup each step.' },
      { id: 'trie-cost', front: 'Time and space of a trie.', back: 'insert, search and startsWith are O(L) each (L = word length). Space is O(total letters stored), times 26 for array nodes. Building n words costs O(n · L).' },
      { id: 'wildcard', front: 'Wildcard (`.`) search: how?', back: 'DFS with the pattern position and current node. Letter: follow that child. Dot: try every child, succeed if any does. At the end of the pattern return the node’s end flag.' },
      { id: 'grid-trie', front: 'Word Search II: why a trie?', back: 'One grid DFS from each cell carries the trie node and steps only along existing edges, so words sharing a start are explored once and dead grid paths stop at once. Store the word on its end node; remove it when found.' },
      { id: 'prune-trie', front: 'Word Search II: two key optimisations.', back: '1) Store the full word at its end node and delete it when found (no duplicates). 2) Delete child nodes that become empty so exhausted branches are never visited again.' },
      { id: 'trie-vs-set', front: 'Trie or hash set?', back: 'Hash set for whole-word membership (simpler, often smaller). Trie for prefix tests, listing by prefix, shortest/longest stored prefix, wildcards. A trie of unrelated words can use far more memory.' },
      { id: 'autocomplete', front: 'Autocomplete with a trie.', back: 'Walk to the prefix node (O(L)), then DFS under it in alphabetical order, node first and then its children, stopping after k words. Rank by storing a score or a top-k list per node.' },
      { id: 'shrink-trie', front: 'How can you shrink a trie?', back: 'Use maps instead of arrays, compress single-child chains into one string edge (radix tree), or share word endings too (DAWG).' },
      { id: 'binary-trie', front: 'Trie over bits: what is it good for?', back: 'Nodes have two children (bit 0 and 1). For a maximum XOR with x, at each bit try the child whose bit differs from x. O(bits) per query.' }
    ],

    deeper: [
      { title: 'Trie problems (LeetCode tag)', url: 'https://leetcode.com/tag/trie/', time: 'reference', note: 'LeetCode’s list of trie-tagged problems. Do 208 and 211 first, then 212, then the suggestion and replacement problems.' },
      { title: 'Trie (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Trie', time: '15 min', note: 'Definition, the array versus map versus compressed variants, and applications such as autocomplete and routing.' },
      { title: 'Radix tree (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Radix_tree', time: '10 min', note: 'The memory-saving form with chains of single-child nodes merged, used in routers and databases.' },
      { title: 'Aho–Corasick algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm', time: '15 min', note: 'A trie with failure links that finds many patterns in a text in one pass. The next step after Stream of Characters (1032).' }
    ],

    detective: [
      { id: 'gate-scanner', decoys: ['hashing-internals', 'binary-search', 'arrays-hashing'],
        statement: 'A warehouse tags each shelf with a label such as `frz-aisle-09`, and there are about two hundred thousand labels on file. A handheld scanner reads a label one character at a time. After every character the screen must show whether any real label could still turn out to be the one being scanned, so the worker sees a red light at the very first wrong character instead of at the end. Comparing against all the labels after every keystroke makes the scanner lag.',
        why: 'The question asked after each character is “does anything stored **begin** with what has been read so far?”, and it must be answered by continuing from the previous answer, not from scratch. Labels that start the same share their early characters: that is a shared-path tree with one step per letter, where the first missing edge means “red light”.' },
      { id: 'letter-maze', decoys: ['backtracking', 'graphs', 'recursion'],
        statement: 'A puzzle app shows a rectangle of letter tiles. A player may start on any tile and move to a tile touching the current one on a side, never stepping on the same tile twice in one attempt. The app has a list of several thousand target words, and after each puzzle it must report which targets can be spelled somewhere on the board. A first version restarts the whole search for every word, and the nightly check takes hours because so many words begin with the same few letters.',
        why: 'The expensive part is that thousands of words start the same way and each restarts the same walk. Keep all targets in one structure that follows their shared beginnings, and let a single search from each tile move through that structure in step, dropping a path the moment no target continues that way.' },
      { id: 'blank-pattern', decoys: ['hashing-internals', 'recursion', 'arrays-hashing'],
        statement: 'A word-game helper keeps a growing list of accepted words. A player types a pattern in which some positions are shown as a dot, meaning “any single letter could go here”, for example `c.t` or `..e`. The helper must say whether at least one accepted word fits the pattern exactly, and new accepted words are added between questions. Pre-storing every possible dotted version of every word would use far too much memory.',
        why: 'Fixed letters narrow the candidates one step at a time, and a dot means “try all the possibilities that exist at this point”. That is a shared-path structure over the accepted words, searched with a small branching walk that branches only on dots, and that must end on a stored word rather than a half-word.' }
    ]
  });
})();
