# Brief: accuracy audit of Offer Ready lesson content

Offer Ready (D:\Projects\dsaGod, static HTML/JS) teaches a new-grad software engineer (main language Python) for coding, system design and behavioral interviews. An in-app AI tutor will answer questions using ONLY this content as its source of truth, so every statement in it must be correct. Your job is to AUDIT assigned content for factual errors and fix them in place.

## What to check (be a skeptical senior engineer)

- Definitions and terminology (a "heap" is not a "priority queue"; a BST is not any binary tree; "amortized" vs "average" vs "worst" case).
- Every Big-O claim (time and space, average vs worst, including hidden costs: string concatenation, slicing copies, `list.pop(0)`, `in` on a list, hash of long keys, recursion stack space).
- Language behaviour in Python (primary), and in JavaScript, Java, C++ where shown: built-in semantics, floor division and modulo with negatives, mutable defaults, `heapq` being a min-heap with no decrease-key, `sorted` stability, dict ordering, integer overflow in Java/C++ but not Python, `bisect` argument order, `Counter`/`defaultdict` behaviour, operator precedence (`&` vs `==`), etc.
- Algorithm descriptions, recurrences, invariants and correctness arguments.
- Every hand trace and worked example: re-execute it step by step; check every number in every table, every printed output, every "returns" claim. Run the code where possible (write snippets to your scratchpad and run them with Python; Node is available for JS).
- Quiz questions: the authored right answer (`answer`, always shown first in the source file; it is shuffled on screen) must truly be right, the wrong choices truly wrong, and `explain` correct. Multi-answer questions: every index right.
- Flashcards (front/back) and Pattern Detective cases (`detective`: the statement must really be best solved by the named topic).
- Claims about interviews or statistics ("most common", "about a third of..."): remove or soften anything you cannot support; do not invent numbers.
- Internal consistency: the same fact must not be stated two different ways in the lesson, its extras, and the related cheat sheet.

## Rules

- Fix errors with the SMALLEST edit that makes the text correct, keeping the author's voice, structure and field names. Do not rewrite sections that are fine, do not restyle, do not add new material.
- If you are not sure something is wrong, verify it (run code, re-derive by hand). If still unsure, make the text more careful rather than wrong, and list it in your report.
- Python (and JS where you touch it) edits must still run. After editing a file: `node --check <file>`. For topics: `node tools/check_extras.js <ids>` must print "extras OK". Do not edit `tools/` files or anything outside your assignment.
- Editing tip: the Edit tool can fail on long lines with special characters; if an exact match fails, use a small Python script with `str.replace` and an assertion that the old text was found exactly once.
- Do not change `id`, `lc`, flashcard ids or detective ids (progress is stored under them).

## Final message

Under 200 words: what you audited, a numbered list of each correction (file, what was wrong, what it says now), and anything you could not settle.
