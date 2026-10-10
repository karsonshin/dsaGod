# Brief: writing lesson extras for Offer Ready

You are writing new teaching material for "Offer Ready", a personal interview-prep app at D:\Projects\dsaGod (static HTML/JS, no build step). The learner is a new-grad software engineer whose main language is Python. They are half comfortable with data structures, NOT comfortable with algorithms or LeetCode, and they study fast, so explanations must be intuitive, concrete and step by step: small numbers traced by hand, plain words, define every term the first time it is used.

For each assigned topic id ID, create/overwrite ONLY `D:\Projects\dsaGod\data\extras\ID.js` (a stub exists; replace it). Do not edit any other file. First READ `data/topics/ID.js` fully (hook, intuition, template, worked, practice with solutions, quiz, flashcards) and the "A topic lesson" schema in README.md, so your material is consistent and does not repeat it. If the existing lesson contains something you believe is factually wrong, do NOT silently contradict it: list it in your final report. A finished example to match in depth and tone: `data/extras/sliding-window.js`.

## File format (classic script, no modules)

```js
(function () {
  var OR = (window.OR = window.OR || {}); OR.extras = OR.extras || {};
  OR.extras['ID'] = {
    primer: { kind: 'structure' | 'technique', what: '...', does: '...', impl: '...', possibilities: '...' },
    breakdown: [ { title: '...', body: 'markdown', code: { py: '...' } /* code optional */ } ],
    think: [ { q: '...', a: 'markdown' } ],
    drills: [ { title: '...', q: 'markdown', hint: '...', how: 'markdown', code: { py: '...', js: '...' /* js optional */ }, explain: 'markdown', check: 'python asserts' } ],
    how: { 217: 'markdown', 242: 'markdown' }   // keyed by LeetCode number
  };
})();
```

Strings: single quotes with \n, or template literals (escape backticks and `${`). Markdown supported: paragraphs, **bold**, *italic*, `inline code`, `-` lists, `1.` lists, fenced code blocks, | tables |, `>` quotes, `##` headings. primer fields use inline markdown only (bold, code), no lists.

## What to write

1. **primer** (every topic): the four-part summary shown at the very top of the lesson so the learner can grasp the topic at a glance. `kind: 'structure'` when the topic centers on a data structure (define it from scratch, assume the reader has never seen it), else `'technique'`. Each field 1-3 sentences, 40-90 words:
   - **what**: the definition in plain words, with a one-line analogy;
   - **does**: the operations/behaviour and their costs (technique: the class of problem it solves);
   - **impl**: how it is actually built or how it works (memory layout, pointers, the loop, the state kept) and what to use in Python;
   - **possibilities**: 3-5 concrete things you can build, or interview problem types it unlocks.
   Any data structure the topic introduces must be defined here.
2. **think** (4-6 items): intuition-building questions the learner answers in their head before opening the answer: predict-the-output, "what would break if...", "why is this O(...)?", "which structure/pattern and why?". Each answer 2-5 sentences with the aha.
3. **breakdown** (minimum 5 steps, ideally 6-8). REQUIRED for hard topics: recursion monotonic linked-lists binary-search heaps trees tries backtracking graphs topo-sort union-find shortest-paths mst greedy intervals dp-1d dp-2d knapsack string-dp lis interval-dp tree-dp bitmask-dp design-ds segment-tree fenwick string-algos advanced-graphs bits math. Optional but welcome elsewhere. Each step = the next smallest idea: raw idea -> smallest example traced by hand with real numbers (draw small trees, graphs, grids, tables in text) -> what state we track -> the loop or recursion in words -> edge cases -> cost -> how to spot it in an interview. Body 60-140 words, optional tiny code.
4. **drills** (3-4): NEW original practice questions written for this topic (never copy LeetCode wording; no LeetCode number needed). Increasing difficulty. Each has: `title`; `q` (with a concrete example input/output); `hint` (one nudge); `how` = the first-person coach narration of HOW YOU SOLVED IT, 150-300 words (restate in your own words, brute force and why it is too slow, the observation that unlocks it, which structure/pattern and why, a hand trace on the example, edge cases, then the cost); `code.py` = a clean idiomatic Python 3.11 solution (function or class; define any helper class inside it); optional `code.js`; `explain` = why it is correct plus time/space; `check` = hidden Python asserts calling what `code.py` defines (at least 4, including edge cases). The check is NOT shown to the learner; it proves the solution runs.
5. **how**: for EVERY practice problem in the topic's `practice` list (the `lc:` numbers in `data/topics/ID.js`), 120-250 words in first person on how to arrive at the solution: restate, brute force, the bottleneck, the key observation, structure choice, trace, edge cases, complexity. It must agree with the existing solution in that entry (read its `solution.code`/`explain`). Your own words; do not reproduce LeetCode's text. Do not invent facts you are unsure of.

## Quality rules

Accuracy over volume (a wrong complexity or a failing solution is worse than a missing one); interview-real framing (what to say, what the interviewer is checking); direct, calm, practical voice; no filler. Complexities must be right (average vs worst case where they differ). Python idiomatic and correct.

## Verify before you finish (from D:\Projects\dsaGod)

`node --check data/extras/ID.js` for each file, then `node tools/check_extras.js <your ids>` must print "extras OK" (it validates structure and RUNS every drill's code.py plus its check). Fix everything it reports.

## Final message

Under 150 words: files written, errors you suspect in existing lessons (file and what), nothing else.
