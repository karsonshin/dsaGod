# Brief: writing the Answer Bank for Offer Ready's AI tutor

Offer Ready (D:\Projects\dsaGod, static HTML/JS) has an in-app tutor. Learners (a new-grad engineer, main language Python) type questions like "how do I sort a list in Python?", "how to build BFS", "explain Kadane's algorithm", "what's the difference between a stack and a queue?", "how does consistent hashing work?". The tutor must return the RIGHT ANSWER and WORKING CODE immediately, not related paragraphs. No AI model is used for facts: every answer comes from entries YOU write here, so each one must be correct, direct and verified by running it.

## What to write

Create ONLY the file(s) assigned to you under `D:\Projects\dsaGod\data\qa\`. Each file is a classic script:

```js
(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  OR.qa.push(
    {
      id: 'py-sort-list',                       // unique, kebab-case, prefix with your group
      title: 'Sort a list in Python',           // shown as the answer heading
      q: [                                      // 5-8 ways a learner might ASK it, in their own words
        'how do i sort a list in python', 'sort a list', 'python sorted vs list.sort', 'order a list from smallest to largest',
        'sort a list in descending order', 'sort a list by a key'
      ],
      tags: 'sort sorted order list ascending descending key reverse',   // extra search words (synonyms, names, terms)
      a: 'Use `sorted(items)` to get a new sorted list, or `items.sort()` to sort in place ...',   // THE DIRECT ANSWER, markdown, 1-4 sentences
      code: { py: 'nums = [3, 1, 2]\nprint(sorted(nums))   # [1, 2, 3]\n...', js: '...', java: '...', cpp: '...' },   // py REQUIRED when code makes sense; others optional
      more: 'Optional markdown: a short "how it works" or gotchas list (2-6 bullets), complexity, when to use which.',
      cx: 'Time O(n log n), space O(n) for sorted(); O(1) extra for list.sort() (CPython uses a few temporary runs)',   // optional
      see: ['#/topic/sorting', '#/cheatsheets/python'],   // real in-app links (topic ids are in data/curriculum.js; cheat sheet ids: big-o sorting patterns graphs dp-catalog languages night-before python big-o-algorithms data-structures edge-cases study-playbook talk-track; problems: #/problem/<leetcode number>)
      check: 'assert sorted([3,1,2]) == [1,2,3]'    // hidden Python that runs AFTER code.py in the same scope; REQUIRED whenever code.py exists
    }
  );
})();
```

### Rules for answers

1. **Answer the question first.** `a` is the direct answer in plain words ("Use X. It returns Y."). Never start with background. Code shows the exact syntax, runnable as written, with printed results in comments.
2. **Correct, not merely plausible.** Every claim (complexity, behaviour, edge cases) must be true. Distinguish average vs worst case. If you are unsure, test it, or leave it out. No invented statistics, no "most interviewers...".
3. **Code must run.** `code.py` is executed with Python 3.11 followed by `check` (assert statements that prove the code works, at least 2 asserts including an edge case). Include everything the snippet needs (imports, helper classes). Do not print huge output. `code.js` (when given) is run in Node after `checkJs` (optional JS asserts; if you give `code.js` you should give `checkJs`). Java and C++ code are not run by the checker, so keep them short and compile-clean (you may test them with `javac`/`g++` yourself).
4. **Implementation questions get complete code.** "How do I build BFS / a trie / union-find / LRU cache / Dijkstra / a heap from scratch" -> a complete, idiomatic implementation (a function or class) plus a tiny usage example, not a sketch.
5. **Concept questions get a crisp definition + the one idea that matters + an example.** "What is a heap" -> 2-3 sentences, then the key operations with costs, then a 10-line example.
6. **Comparison questions** ("X vs Y") -> a short decision rule first ("Use X when..., use Y when..."), then a tiny table or bullets.
7. **Question coverage matters more than length.** Prefer many focused entries over a few long ones. One entry = one question a learner would ask. 60-80 entries per assignment, each `a` under ~70 words, `more` under ~120 words.
8. `q` phrasings must be realistic and varied ("how to reverse a string", "reverse a string python", "flip a string around", "reverse words in a sentence" belong to DIFFERENT entries if the answers differ). Include the language name in some phrasings ("in python") and omit it in others. Put the key technical nouns in `tags` (include the common abbreviation or alias: "bfs breadth first search queue level order", "dsu union find disjoint set").
9. Original wording only (do not copy text from other sites or books). Keep terminology consistent with the app's lessons (`data/topics/<id>.js`, `data/extras/<id>.js`, `data/cheatsheets/s8-python.js`); read the lessons for your area first so the answers agree with them, and link them in `see`.
10. Do not duplicate: before writing, `grep -l "<id or topic>" data/qa/*.js` to see what other agents have written; stay within your assigned scope.

### Verify before you finish (from D:\Projects\dsaGod)

`node --check data/qa/<your files>`, then `node tools/check_qa.js <your files>` must print "qa OK" (it validates structure, `see` links, and RUNS every code.py + check and every code.js + checkJs). Fix everything it reports. Editing tip: if the Edit tool fails on long lines, use a small Python script with `str.replace` plus an assertion.

### Final message

Under 100 words: files written, number of entries, anything you are unsure about.
