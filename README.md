# Offer Ready

Double-click `index.html` to open it. It works offline from `file://`, with no server or install. The first run asks four questions and builds your plan.

## Your progress

- Progress lives in this browser's localStorage. Back it up from **Settings > Export backup** (a JSON file), and restore it with **Import**. Export before clearing browser data or switching machines.
- JavaScript runs offline in a sandbox and stops after 5 seconds. Python runs through Pyodide, which downloads about 10 MB from jsDelivr the first time you press Run.

## Adding content

Content is plain data in classic `<script>` files, because `file://` blocks `fetch()` and ES modules. Add each new file to `index.html` with `<script defer src="...">`, above `js/views/stubs.js`.

### Problems: `data/problems.js` (generated)

Don't edit `data/problems.js` by hand. To add practice problems for a topic, list them in `tools/extra-problems/<topic-id>.json` as `[[lc, "pattern note"], ...]` (or edit `NC150`/`EXTRA` in `tools/build-problems.py`), then run `python tools/build-problems.py`. A number already in the bank fails the build, so check `data/problems.js` first. Title, slug, difficulty and premium come from `tools/lc-index.json`, LeetCode's own list, so links can't drift. Practice sets and worked problems refer to problems by number and must use numbers that are in the bank.

### A topic lesson: `data/topics/<id>.js`

`id` must match `data/curriculum.js`, which already holds the title, phase, hours, interview frequency and prerequisites. Leave out any section you haven't written; the page skips it.

```js
OR.topics.push({
  id: 'sliding-window',
  hook: 'Why interviewers love it, and how often it shows up.',          // markdown
  cues: ['A **contiguous** subarray or substring', '...'],               // "Reach for it when you see..."
  intuition: 'Analogy first, then the precise version.',                  // markdown
  viz: 'sliding-window',                                                  // id of an OR.viz entry (js/viz/*.js)
  template: { title: 'Variable window', code: { py: '...', js: '...', java: '...', cpp: '...' }, note: 'markdown' },
  complexity: { time: 'O(n)', space: 'O(k)', why: 'markdown', trap: 'markdown' },
  variations: [{ name: 'Fixed window', body: 'markdown', code: { py: '...' } }],
  worked: [{ lc: 3, restate, examples, brute, insight, code: { py, js, java, cpp }, complexity, say, followups: [{ q, a }] }],
  practice: [{ lc: 3, hints: ['...', '...', '...'], solution: { explain: 'markdown', code: { py: '...' } },
               starter: { py: '...', js: '...' }, tests: { fn: 'lengthOfLongestSubstring', cases: [{ args: ['abcabcbb'], out: 3 }] } }],
  mistakes: ['markdown', '...'],
  quiz: [{ kind: 'complexity', q: 'markdown', code: 'optional snippet', lang: 'py', choices: ['...'], answer: 0, explain: 'markdown' }],
  flashcards: [{ id: 'window-shrink', front: 'markdown', back: 'markdown' }],
  deeper: [{ title: 'NeetCode: Sliding Window', url: 'https://...', note: 'What it is best for', time: '20 min' }],
  detective: [{ id: 'sw-streak', statement: 'markdown', why: 'markdown', decoys: ['two-pointers', 'prefix-sums'] }]
});
```

- **Code notes and visualizer marks.** End a template line with a comment that starts with `>` to attach a note, or with `@name` to name the line for visualizer sync. Python uses `#`, the other languages `//`. For example, `right += 1  #@expand > grow the window`. Both are stripped from the displayed code.
- **Quiz.** `answer` is an index, or an array of indices when several choices are right. `kind` is `concept`, `complexity`, `pattern` or `bug`.
- **Tests.** Write `fn` in LeetCode's camelCase, so `class Solution` (Python) and plain functions (JS) both work. Optional fields:
  - `compare: 'unordered' | 'deep' | 'float'` for answers whose order doesn't matter or that are floats.
  - `argTypes: ['list' | 'tree']` to build `ListNode` / `TreeNode` inputs from arrays.
  - `inPlace: <arg index>` for problems that mutate their input.
  - `design: true` for class-design problems, with cases written as `{ ops, args, out }`.
  - On a single case, `any: true` when `out` is a list of acceptable answers.
- **Flashcard and detective ids** must stay stable once written: progress is stored under `<topic>:<id>`.
- **Pattern Detective.** Each `detective` entry is an *original* problem statement (never LeetCode's wording) whose answer is this topic. Write it as a story, the way an interviewer would, without naming the pattern or its giveaway words. `why` names the cues that give it away. `decoys` are 2 or 3 curriculum topic ids it could plausibly be confused with.

### Extra lesson material: `data/extras/<id>.js`

Material added after the first lessons lives in a companion file per topic, so a 60 to 100 KB lesson never has to be rewritten. `js/extras.js` merges it into the lesson at load. Every topic has one; the brief for writing them is `tools/EXTRAS-BRIEF.md`.

```js
OR.extras['stacks'] = {
  primer:    { kind: 'structure' | 'technique', what, does, impl, possibilities },  // "At a glance" at the top of the lesson
  breakdown: [{ title, body, code? }],                    // "Break it down": 5+ tiny steps (required for hard topics)
  think:     [{ q, a }],                                  // "Build the intuition": questions to answer in your head first
  drills:    [{ title, q, hint, how, code: { py, js? }, explain, check }],   // new questions; `check` = hidden Python asserts
  how:       { 20: 'markdown' }                           // per practice problem (LeetCode number): how the solution was found
};
```

`node tools/check_extras.js [ids]` validates the structure and runs every drill's Python plus its `check`. Quiz choices are shuffled at display time (the right answer is authored first), so write `answer: 0`.

### Cheat sheets: `data/cheatsheets/sN-*.js`

`OR.cheatsheets.push({ n, id, title, blurb, keywords, pages?, render(h) })`. A sheet with no `pages` must print on one page; `pages: N` allows N. Helpers on `h`: `m`, `T`, `list`, `sec`, `code`, `cols`. Per-sheet print font sizes are in `css/cheatsheets.css`. Brief: `tools/CHEATSHEET-BRIEF.md`.

### Cloud sync and hosting

`js/sync.js` (Settings > Cloud sync) mirrors progress to a private GitHub repo with a fine-grained token. The site is published with GitHub Pages; after changing any app file run `python tools/build-sw.py` so installed copies refresh, then commit and push.

### A visualizer: `js/viz/<id>.js`

Register `OR.viz[id] = { mount(host, { mark }) { ...; return { destroy } } }`, and build it on `OR.player` (`js/player.js`). Precompute every frame as a snapshot, so stepping back means painting an earlier frame. Each frame's `step` should match a `@name` mark in the template, and `paint` calls `mark(step)` (or `mark(null)`) so the template line lights in sync. The user must be able to edit the input. Escape anything they type with `OR.esc`. Reuse the array classes `.va`, `.va-row`, `.va-cell` (`in`, `ok`, `dup`, `cur`, `gone`, `best`), `.va-ptrs`/`.va-ptr`, `.va-read`, `.va-kv` and `.va-input` from `css/app.css` where they fit. Move things with `transform` and colour transitions, never `width`/`left`/`top`. Put new styles under the visualizer's own class prefix. Expose the frame builder (`frames: frames`) so a check can test it.

## Checks

- `python tools/build-problems.py` verifies every problem against LeetCode's index, plus the NeetCode 150, Blind 75 and anchor counts.
- `python tools/check_engine.py [screenshot-dir]` drives the app in Chrome from `file://` and asserts the problem browser, problem page, runner, review queue, flashcards, quiz and lesson renderer (needs the `playwright` Python package).

Build status and next phases: see `BUILD-STATUS.md`. The original brief is `source/master-prompt.md`.


## System design content schema

The System design module (`#/system-design`) is data too: files in `data/sd/`, each a classic script that registers on `OR.sd`, listed in `index.html` before `js/diagram.js`. A file that is missing simply doesn't appear. The complete reference, with every field, is `data/sd/schema.md`; the gold-standard example to copy is `data/sd/url-shortener.js`. `md` fields use `OR.md`, `inline` fields use `OR.inline`; ids are kebab-case and stable once written (progress and flashcards are stored under them).

```js
// Case study: OR.sd.cases.push({...})   (ids are shared with OR.sd.lld; never 'fundamentals', 'framework' or 'calculator')
{ id, title, short, difficulty: 'Easy|Medium|Hard', time: '45 min', tags: [], prompt,
  requirements: { functional: [], nonFunctional: [], outOfScope: [], assumptions?: [], clarify: [{ q, a }] },
  estimates: { intro, inputs: { dau, writesPerUser, readsPerUser, peakFactor, bytesPerWrite, bytesPerRead, years, replication, hotFraction, serverQps, utilization },
               assumptions: [], extra: [{ label, formula, result }], notes: [] },     // rows are computed by OR.sd.estimate.compute(inputs)
  api: [{ method, path, desc, request?, response?, notes?: [] }], apiNotes: [],
  data: { intro, entities: [{ name, purpose, fields: [[name, type, note]] }], storage: [{ title, verdict?, body }],
          decisions: [{ title, question, options: [{ name, pros, cons }], pick }] },
  design: { intro, diagram: <diagram spec>, walkthrough: [], notes?: [] },
  deepDives: [{ id, title, question, answer, followups: [{ q, a }] }],
  bottlenecks: [{ title, problem, mitigation }], mistakes: [],
  pushes: [{ q, why, good }],                        // "What interviewers push on"
  quiz: [<same as a topic quiz>], flashcards: [{ id, front, back }] }

// Low-level design problem: OR.sd.lld.push({...})
{ id, title, short, difficulty, time, tags, prompt, requirements: { functional: [], ... },
  classDiagram: { title, intro?, classes: [...], relations: [...] },
  decisions: [{ title, pattern?, body, tradeoffs: [] }],
  code: [{ title, note?, code: { py, js, java, cpp } }], extensions: [{ q, a }], quiz: [], flashcards: [] }

// Fundamentals page: OR.sd.fundamentals.push({...})
{ id, title, group, hook, keywords?, sections: [{ id?, title, md, diagram?, viz?: 'ring', caption? }], takeaways: [], quiz: [], flashcards: [] }

// Diagram spec for OR.diagram(host, spec)
{ title, nodes: [{ id, label, kind: 'client|lb|service|cache|db|queue|cdn|storage|search|external', layer?, x?, y?,
                   detail: { why, tradeoffs: [], alternatives: [], scale /* what breaks first */ } }],
  edges: [{ from, to, label?, style?: 'sync|async|replication' }],
  scenarios: [{ id, label, steps: [{ title?, path: [nodeIds], note, tone? }] }] }      // or nodes/edges for non-linear steps

// Class diagram spec for OR.classDiagram(host, spec)
{ title, classes: [{ id, name, kind?: 'class|interface|abstract|enum', fields: ['- id: int'], methods: ['+ park(v): bool'], detail? }],
  relations: [{ from, to, type: 'inherits|implements|composes|aggregates|associates|depends', label?, fromMult?, toMult? }] }
```

Notes: sections with no data are hidden, so there is nothing to mark "coming soon". Auto layout runs left to right on wide containers and top to bottom on phones; give `x`/`y` to every node only for a hand-placed layout. Edge labels are dropped on phones, so put the meaning in the node detail too. Mark any rounded number `approx`. `node tools/test_estimate.js` checks the estimator math and the consistent-hashing ring.
