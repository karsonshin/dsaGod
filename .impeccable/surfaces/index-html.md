---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief: index.html (Offer Ready, every hash route)

## Scope and modes
One single-page app: every surface is a hash route inside index.html.
- Persuade: the Home/Today hero, which persuades the owner to start tonight's session.
- Read: topic lessons, cheat sheets, resource library, the system design / CS fundamentals / career / behavioral reading pages, resume guide, wellbeing.
- Operate: the rest of Today, onboarding, Plan, Progress, Roadmap, Problems and problem detail, Pattern Detective, Review queue, Flashcards, Playground, Visualizers, Mock room, Pipeline, Resume studio (documents, companies, builder, cover letters), Settings.

## Audience, job, constraints
The owner, nightly on a laptop and sometimes on a phone. Job on every visit: see the next action and start it within seconds, or resume exactly where they left off. Constraints: works from file:// and offline, localStorage plus IndexedDB (documents) with JSON export/import, keyboard-complete, AA contrast in both themes, reduced motion honored.

## Chosen direction and memorable moment
Training Block (seed 523347d2, assigned direction, confirmed by the owner). Memorable moment: the Season Chart on Home. The whole prep season up to offer day is drawn as a coach's periodization chart, and this week's bar fills as the owner studies.

## Resolved decisions
- Variant picks by the owner, 2026-10-02:
  - Home hero: **A, Statement**. Type-led headline, bib countdown and Start, with tonight's three in a column on the right (`js/views/today.js`).
  - Topic grid: **C, Season lanes**. One lane per phase with week ranges; each row fills and underlines with mastery (`js/views/topics.js`).
  - Visualizer control bar: **C, Timeline**. A draggable track with one tick per step, coded by height and color (`js/player.js`, `OR.player`).

## Direction contract
THESIS: Interview prep is a training season, not a backlog. The surface owns the coach's periodized plan (one season, weekly load, race day) and refuses the category default: a sidebar plus a grid of topic cards with progress bars.

OWN-WORLD: Restrained graphite neutrals tinted cool, plus one confident timing-blue accent for action, selection and the live week. Easy/Medium/Hard use turf green, amber and track red. Archivo condensed is used for headings and race-bib LeetCode numerals, Literata for lesson prose, and Martian Mono for code, splits and timers. Tabular figures appear wherever data lives. Hairline rules, no card chrome, small radii.

STORY: The owner opens it at night and sees the day and phase of the season, the distance to offer day, and tonight's three items with times. They press Start, the stopwatch runs while they learn and drill, and the week's bar fills.

FIRST VIEWPORT: Desktop: a left rail, and a top bar with search, stopwatch, language and theme. The hero spans two-thirds: a day/phase line, a countdown in bib numerals, tonight's plan in one sentence, and a large timing-blue Start session button. Tonight's three items sit at the right. A full-width Season Chart runs below. Phone: hero, items, a swipeable chart, bottom tabs.

FORM: Training Block (athletic periodization log), candidate 5 of 7 on the ordered list, seed 523347d2. Signature interaction: scrubbing the Season Chart (pointer or arrow keys) reveals each week's plan, and a pace line shows behind or ahead. Raises: transit 45/90-degree roadmap routing (Midnight Transit); in-place reranking with persistent change marks (Gate Board); type-led layout without chrome (Metro Tiles); fixed scales across steps and weeks (Botanical Folio); tabular data density (Datamatics); size-ramp importance and low-glare night ink (Star Atlas).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
