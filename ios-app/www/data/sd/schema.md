# System design content schema

All System design content is plain data in classic `<script defer>` files (no fetch, no ES modules). Each file registers itself on `OR.sd` and is listed in `index.html` among the other `data/sd/*.js` lines (before `js/diagram.js`). A file that is missing simply does not appear: the index only lists what is registered. Do not add "coming soon" entries.

Copy `url-shortener.js` for a case study. Copy a page from `fundamentals-1.js` for a concept page. Every file begins with:

```js
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];            // or SD.lld, SD.fundamentals
  SD.cases.push({ ... });
})();
```

Text fields marked `md` go through `OR.md` (paragraphs, lists, `**bold**`, `code`, ``` fences, tables). Fields marked `inline` go through `OR.inline` (bold, italics, code, links only). Everything is HTML-escaped. Ids are lowercase kebab-case and **stable once written**: progress, quiz scores and flashcard schedules are stored under them.

Routes: `#/system-design` (index), `#/system-design/fundamentals/<page id>`, `#/system-design/framework`, `#/system-design/calculator`, `#/system-design/<case or lld id>[/<section>]`. Case and LLD ids share one namespace and must not be `fundamentals`, `framework` or `calculator`.

## Case study: `OR.sd.cases.push({...})`

```js
{
  id: 'url-shortener',                    // unique, stable
  title: 'Design a URL shortener',
  short: 'One sentence for the index row.',
  difficulty: 'Easy' | 'Medium' | 'Hard',
  time: '45 min',
  tags: ['Caching', 'ID generation'],     // shown as chips and searchable
  prompt: 'What the interviewer says.',   // shown under the title

  requirements: {                         // section "Requirements"
    functional: [inline], nonFunctional: [inline], outOfScope: [inline],
    assumptions: [inline]?,               // optional fourth column
    clarify: [{ q: inline, a: md }]       // "Questions to ask first"
  },

  estimates: {                            // section "Estimates"
    intro: md,
    inputs: { dau, writesPerUser, readsPerUser, peakFactor, bytesPerWrite, bytesPerRead,
              years, replication, hotFraction, serverQps, utilization },   // numbers or '10M' strings; omit a key to use the calculator default
    assumptions: [inline],                // why those inputs
    extra: [{ label, formula, result }],  // case-specific math (key space, fan-out) as text
    notes: [inline]                       // "What these numbers tell you"
  },
  // The table of rows is computed by OR.sd.estimate.compute(inputs) in js/sd-estimate.js, so the numbers
  // always match the calculator. The "Open in the calculator" button passes the same inputs.

  api: [{ method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE', path, desc: inline, request?: 'JSON text', response?: 'text',
          notes?: [inline] }],            // section "API"
  apiNotes: [inline],

  data: {                                 // section "Data model"
    intro: md,
    entities: [{ name, purpose: inline, fields: [[name, type, note]] }],
    storage: [{ title, verdict?: 'short chip', body: md }],           // SQL / NoSQL options (put DDL in a ``` fence)
    decisions: [{ title, question: md, options: [{ name, pros: inline, cons: inline }], pick: inline }]   // e.g. ID generation
  },

  design: {                               // section "High-level design"
    intro: md,
    diagram: DIAGRAM SPEC (below),
    walkthrough: [inline],
    notes: [inline]
  },

  deepDives: [{ id, title, question: md, answer: md, followups: [{ q: inline, a: md }] }],   // 5 or more
  bottlenecks: [{ title, problem: md, mitigation: md }],                                    // "Bottlenecks and trade-offs"
  mistakes: [inline],
  pushes: [{ q: inline, why: inline, good: inline }],                                       // "What interviewers push on"
  quiz: [QUIZ QUESTION],                  // same schema as topic lessons (README, "Adding content"); 5 or more
  flashcards: [{ id, front, back }]       // join the global deck "System design"
}
```

A section with no data is not shown, so every field except `id`, `title` and one section is optional. A gold-standard case fills all of them.

## Low-level design problem: `OR.sd.lld.push({...})`

```js
{
  id: 'parking-lot', title, short, difficulty, time, tags, prompt,
  requirements: { functional: [inline], nonFunctional: [inline]?, assumptions: [inline]?, outOfScope: [inline]?, clarify: [{ q, a }]? },
  classDiagram: CLASS DIAGRAM SPEC (below), // section "Class diagram"; classDiagram.intro (md) shows above it
  decisions: [{ title, pattern?: 'Strategy', body: md, tradeoffs: [inline] }],   // "Key design decisions"
  code: [{ title, note?: md, code: { py, js, java, cpp } }],                     // any subset of the four; OR.codeBlock follows the global language toggle
  extensions: [{ q: inline, a: md }],                                            // "Extension questions"
  quiz: [...], flashcards: [...]
}
```

Code strings support the usual notes: end a line with `#> note` (Python) or `//> note` to attach a hover note.

## Fundamentals page: `OR.sd.fundamentals.push({...})`

```js
{
  id: 'caching', title: 'Caching strategies',
  group: 'Data',                          // pages are listed under their group, in the order groups first appear
  hook: 'One inline sentence for the index and page header.',
  keywords: 'extra words for Ctrl+K search',
  sections: [{ id?: 'optional', title, md, diagram?: DIAGRAM SPEC, viz?: 'ring', caption?: inline }],   // viz is a key of OR.sd.viz
  takeaways: [inline],
  quiz: [QUIZ QUESTION],                  // every page has one
  flashcards: [{ id, front, back }]
}
```

`OR.sd.viz[name] = { mount(host) { ...; return { destroy } } }` registers an interactive visualizer; `js/sd-ring.js` is an example built on `OR.player`.

## Other singletons

- `OR.sd.framework = { intro, steps: [{ id, name, minutes, goal, do: [inline], say: [inline], avoid: [inline] }], closing?: md }` (data/sd/framework.js).
- `OR.sd.numbers.push({ group, note?: inline, col?: 'column heading', rows: [{ name, value, approx?: true, note? }] })` (data/sd/numbers.js). Mark every rounded rule of thumb `approx: true`.

## Diagram spec: `OR.diagram(host, spec)`

```js
{
  title: 'accessible name of the figure',
  nodes: [{
    id: 'cache', label: 'Redis cache',        // keep labels under about 28 characters; two lines of 16 are shown
    kind: 'client' | 'lb' | 'service' | 'cache' | 'db' | 'queue' | 'cdn' | 'storage' | 'search' | 'external',
    layer?: 2,                               // optional; otherwise the layer is the longest path from the sources
    x?: 0, y?: 0,                            // optional; only used when EVERY node has both (manual layout, desktop-sized)
    detail: { why: md, tradeoffs: [inline], alternatives: [inline], scale: inline /* "what breaks first" */ }
  }],
  edges: [{ from, to, label?: 'short, under 12 characters', style?: 'sync' | 'async' | 'replication' }],
  scenarios: [{ id, label: 'Write path', steps: [{
    title?: 'short step name', path: ['client', 'lb', 'app'],   // highlights these nodes and the edges between consecutive ids
    // or: nodes: [ids], edges: ['a>b']  for non-linear steps
    note: 'what happens here', tone?: 'accent' | 'hard' | 'ok'  // a tone lists the step in the player legend
  }] }]
}
```

Layout: layers run left to right on wide containers and top to bottom (wrapping) on phones; do not draw cycles (a response is not a second edge, say it in the step note; highlighting works in either direction of an existing edge). `replication` edges keep both nodes in the same layer. Every node and every scenario step needs real content: the panel is the point of the diagram. Keyboard: arrows move between nodes, Enter or Space opens the panel, Escape closes it; scenarios play through `OR.player`.

## Class diagram spec: `OR.classDiagram(host, spec)`

```js
{
  title,
  classes: [{ id, name, kind?: 'class'|'interface'|'abstract'|'enum', fields: ['- id: int'], methods: ['+ park(v): bool'],
              detail?: { why, tradeoffs, alternatives, scale } }],
  relations: [{ from, to, type: 'inherits' | 'implements' | 'composes' | 'aggregates' | 'associates' | 'depends',
                label?, fromMult?: '1', toMult?: '*' }]
}
```

Read a relation as "from <type> to": `Car inherits Vehicle`, `Lot composes Spot` (whole to part, diamond at the whole), `Hourly implements Policy`. Parents and wholes are placed above their children and parts. Prefix members with `+`, `-` or `#`.

## Estimator: `OR.sd.estimate` (js/sd-estimate.js)

`compute(inputs)` returns ordered rows `{ id, group, label, formula, value, unit, text }`. Row ids: `writesPerDay, readsPerDay, readWrite, avgWriteQps, avgReadQps, peakWriteQps, peakReadQps, storagePerDay, storageRaw, storageReplicated, ingressAvg, ingressPeak, egressAvg, egressPeak, cacheBytes, servers`. Units are decimal (1 KB = 1,000 B), a day is 86,400 s, a year is 365 days. `node tools/test_estimate.js` checks the math.
