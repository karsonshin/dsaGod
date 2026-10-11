# Brief: writing a new CS track for Offer Ready

Offer Ready (D:\Projects\dsaGod, static HTML/JS) has "CS fundamentals" tracks (`#/cs/<id>`): readable lessons with a mini-quiz and flashcards. You write ONE new track as `data/cs/<id>.js`. Match the depth, voice and format of the existing tracks: read `data/cs/databases.js` (best example) and `data/cs/os.js` first. The learner is a new-grad software engineer (main language Python) who wants to be current and interview-ready. They want plain words, every new term defined where it first appears, small concrete examples, and accurate facts.

## File format

```js
OR.cs = OR.cs || [];
OR.cs.push({
  id: "databases-deep", order: 5, title: "Databases in depth",
  blurb: "One or two sentences listing what it covers.", minutes: 90,
  sections: [ { id: "storage-engines", title: "Storage engines: pages, B-trees and LSM trees", body: `markdown...` }, ... ],
  quiz: [ { kind: "concept", q: "...", choices: ["right answer first", "wrong", "wrong", "wrong"], answer: 0, explain: "..." } ],   // the right answer is authored first; the app shuffles the order
  cards: [ { id: "wal", front: "short question", back: "short answer" } ],
  related: { label: "...", href: "#/cs/sql", note: "..." }   // optional; one related page
});
```
Markdown in `body` supports paragraphs, **bold**, `code`, lists, fenced code, tables, `>` quotes, `##` headings. Inside a JS template literal escape backticks as \` and `${` as \${ (the existing files show how).

## Content rules

- 14-18 sections, each 250-550 words, in a teaching order (basics before internals). Every section: what it is, why it exists (the problem it solves), how it works with a small concrete example, the trade-off, and the interview trap or common mistake. Use code or commands where they help (SQL, Python, shell, YAML), short and correct.
- Quiz: 12-16 questions (`kind` concept / complexity / pattern / bug), one clearly right answer, plausible wrong ones, a real explanation. Cards: 18-25, one fact each.
- **Accuracy is the priority.** Do not state anything you are not sure of. Distinguish how a concept works in general from how one product does it. Time-sensitive facts (product names, versions, prices, release dates, regulations, benchmark rankings) change quickly: avoid them, or label them with "as of" and keep them rare; prefer durable concepts. Do not invent statistics or history. When something is a rule of thumb, say so.
- Verify anything runnable: run SQL against SQLite (`python -c "import sqlite3..."`) and Python snippets with Python 3.11; paste real output into the text only when you ran it.
- Original wording; no copying from other sites or books.
- Link related material with in-app hashes where natural, only to real routes: `#/topic/<id>` (ids in data/curriculum.js), `#/cs/<id>`, `#/system-design/fundamentals/<page id>` (see data/sd/fundamentals-*.js), `#/algorithms`, `#/cheatsheets/<id>`.

## Verify before you finish

`node --check data/cs/<id>.js`. Then load it for real: `node tools/check_track.js data/cs/<id>.js` must print "track OK" (it validates structure, quiz answers and card ids). Fix everything it reports.

## Final message

Under 100 words: the file, section/quiz/card counts, anything you were unsure about and softened or left out.
