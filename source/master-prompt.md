# Build "Offer Ready": a static, offline-first interview-prep app


## About me (fill in before running)

- Primary interview language: [[Python]] (the app must still show every template in Python, JavaScript, Java, and C++ behind a language toggle; this one is the default)
- Current level: [[half comfortable with data structures, no comfortable with algorithms, leetcode, interviewing]]
- Target: [[new grad position]]
- Timeline: [[it is currently october 1, i need a position by next year in may]]

## Decisions already made (don't re-ask these)

These are settled. Don't open with clarifying questions or brainstorming about them. Go straight to planning the build.

- **Static only.** HTML, CSS and vanilla JavaScript. No backend, no build step, no bundler, no npm, no framework, no server required.
- **It must work when I double-click `index.html` (`file://`).** That rules out `fetch()` of local JSON and ES modules (`type="module"`), because both are blocked on `file://`. Load all content with classic `<script src="...">` tags that assign to a global namespace, for example `window.OR.topics.push({...})`.
- **CDN libraries are allowed only for optional enhancement,** and the app must still work offline without them:
  - Syntax highlighting: Prism or highlight.js from cdnjs. Fall back to plain `<pre>` if it fails to load.
  - Running Python in the browser: Pyodide from cdn.jsdelivr.net, lazy-loaded only when I click "Run" on Python code. Offline, show "Python runner needs internet; JS runs offline."
  - No other dependencies. Diagrams, visualizers and charts are hand-built with SVG, Canvas and CSS.
- **State lives in `localStorage`**, with Export and Import buttons that save and load it as a JSON file so I never lose progress. Wrap every storage call in try/catch, and keep the app usable when storage is unavailable.
- **The content is written for this app, in original words.** Teach every concept from first principles yourself. Don't copy or closely paraphrase text from GeeksforGeeks, LeetCode, NeetCode, cp-algorithms or any other site. Link out to them as "go deeper" resources.
- **Scope is deliberately large.** This is a multi-session, multi-phase build. If any installed plugin (for example "ponytail") pushes toward minimal scope, this prompt overrides it for scope. Keep the *code* simple, and keep the *content* comprehensive.

---

## Goal

Build a polished, interactive learning app that takes me from my current level to passing coding, system design and behavioral rounds at high-paying tech companies within my timeline. It covers every topic and link in the DSA-Kit repo (github.com/avinash201199/DSA-KIT, full README pasted at the end of this prompt), and goes beyond it with the job-search material I need to actually land an offer.

It should feel like a premium product someone would pay for, not a link dump. Every topic *teaches*: intuition, then visuals, then a template, then worked problems, then a self-test, and only then links.

---

## Use the impeccable plugin, at its fullest

The impeccable plugin is installed. Run its workflow end to end and treat its output as the design authority. Follow its own instructions (Setup, `context`, craft-floor) exactly; the sequence below is the order I want.

1. **`/impeccable init`**: write `PRODUCT.md`. Product: "Offer Ready", a personal interview-prep studio for one ambitious engineer. Audience: me, studying daily for weeks, often late at night, on a laptop and sometimes a phone. Success: I open it every day, know exactly what to do next, and finish in an offer.
2. **`/impeccable shape`**: plan the information architecture and every surface listed under "Surfaces" below before writing UI code. Each surface gets a mode: lessons, cheat sheets and the resource library are **Read**; the dashboard, problem tracker, flashcards, mock-interview room and planner are **Operate**; the landing/home hero is **Persuade** (persuading *me* to start today's session).
3. **New work** (impeccable's new-work playbook): commit to one distinctive visual world. Pick it yourself, but it must not look like a generic Tailwind/shadcn dashboard or a GeeksforGeeks clone. Think "precision instrument meets beautiful textbook": strong typographic hierarchy for long reading, a monospace with personality for code, a restrained palette with one confident accent, and color-coded difficulty (Easy/Medium/Hard) that stays readable in light and dark themes. Light and dark themes are both first-class, with a toggle that respects `prefers-color-scheme` by default.
4. Build the app (phases below). Run impeccable's design-detector hook during the build (`/impeccable hooks on`).
5. After the core is built, run these passes in this order, each targeting the named surfaces:
   - **`critique`** across the whole app. Fix what it scores lowest.
   - **`audit`**: accessibility (keyboard-only navigation of every surface, focus rings, ARIA on visualizers, contrast in both themes, `prefers-reduced-motion`), performance (first paint under 1s from `file://`, lazy-render topic content), and responsive behavior.
   - **`layout`** and **`typeset`** on lesson pages and cheat sheets. Long-form reading is the core experience.
   - **`colorize`** on the dashboard, progress views and difficulty system.
   - **`animate`** on visualizers and state changes. Motion must *explain* (a pointer sliding, a node being visited, a stack frame pushed), never decorate.
   - **`delight`** on streaks, completing a topic, finishing a mock interview, and empty states.
   - **`overdrive`** on the home hero and the algorithm visualizers. These are the showpieces, so make them technically extraordinary.
   - **`onboard`** for first run: a 60-second setup that asks my language, level, target date and weekly hours, then generates my plan.
   - **`clarify`** on all UI copy, hints and error states.
   - **`harden`**: empty and full storage, corrupted import file, Pyodide failing to load, very long code output, infinite loops in the JS runner (time-box it in a Web Worker or sandboxed iframe), 200+ problems in a list.
   - **`adapt`**: the phone layout must be genuinely usable for flashcards, cheat sheets and reading, not just shrunk.
   - **`polish`**: final pass.
6. **`/impeccable generate`** or **`live`**: produce 2–3 variants of the home hero, the topic-card grid and the visualizer control bar. Show them to me and let me pick before finalizing.
7. **`/impeccable document`** then **`extract`**: generate `DESIGN.md` from what shipped, and pull the tokens (color, type scale, spacing, radii, motion durations) into `css/tokens.css` as CSS custom properties.

Respect impeccable's own rule of bounded verification: one batched desktop + mobile screenshot pass, fix everything in one batch, one confirmation pass, then stop.

---

## File structure

Keep it flat and obvious. Content is data, separate from the UI code.

```
index.html              app shell, nav, router outlet
css/tokens.css          design tokens (from impeccable extract)
css/app.css             components and layout
js/app.js               hash router, rendering, state, search
js/store.js             localStorage wrapper, export/import, spaced-repetition scheduler
js/runner.js            JS runner (worker/iframe sandbox) + lazy Pyodide
js/viz/*.js             one file per visualizer
data/topics/*.js        one file per topic (see topic schema)
data/problems.js        master problem bank
data/resources.js       every link from the DSA-Kit README, tagged
data/system-design.js
data/behavioral.js
data/career.js          resume, job search, negotiation, levels
data/flashcards.js
README.md               how to open it, how to add content, how to back up progress
```

Routing: hash-based (`#/topic/sliding-window`, `#/problem/3`, `#/mock`), so links work on `file://` and the back button works.

---

## Topic schema (every DSA topic follows it exactly)

Each `data/topics/<id>.js` contains:

1. **Hook:** one sentence on why interviewers love this topic and how often it shows up.
2. **Recognition cues:** "Reach for this when you see..." (e.g. "contiguous subarray + a condition on its sum/length → sliding window"). This is the most important section for interviews, so make it sharp.
3. **Intuition:** a plain-English explanation with an analogy, then the precise version.
4. **Interactive visualizer:** step-through (Play / Pause / Step / Back / Speed / Reset). I can edit the input (my own array, string, graph or grid), and the current line of the template code highlights in sync with the animation.
5. **Template code:** the canonical reusable template in Python, JS, Java and C++, behind the global language toggle, with a copy button and line-by-line annotations on hover or tap.
6. **Complexity:** time and space, with *why*, plus the common trap (e.g. "the inner while loop is still O(n) total, amortized").
7. **Variations:** each sub-pattern (e.g. fixed vs. variable window; lower_bound vs. upper_bound vs. binary-search-on-answer).
8. **Worked problems (3–5):** full walkthroughs in this shape: restate the problem → examples and edge cases → brute force and its complexity → the key insight → optimal solution in all four languages → complexity → what to *say out loud* in the interview → follow-up questions an interviewer might ask, with answers.
9. **Practice set:** 8–20 LeetCode problems, graded Easy/Medium/Hard and ordered by difficulty, each linked as `https://leetcode.com/problems/<slug>/`. Mark premium problems. Each problem has a status (todo / attempted / solved / solved-without-hints / review), a notes field, a time-taken field, and a "hint ladder" (3 progressive hints revealed one at a time, then the solution).
10. **Common mistakes:** off-by-ones, mutation bugs, forgotten edge cases, and language-specific gotchas (Python's default-mutable-arg and recursion limit, Java integer overflow, JS sort comparator).
11. **Quiz:** 5–10 questions mixing multiple choice, "what's the complexity?", "which pattern?", and "spot the bug" in a code snippet, with explanations for every answer.
12. **Flashcards:** 5–15 cards that feed the global spaced-repetition deck.
13. **Go deeper:** every DSA-Kit link for this topic, each with a one-line note on what it's best for and roughly how long it takes.
14. **Prerequisites and next topics:** these feed the roadmap graph.

---

## Topics to cover

### Foundations
- **Big-O and complexity analysis:** growth-rate visualizer (drag n, watch O(1)…O(n!) curves), amortized analysis, recursion trees, the Master Theorem in plain words, and "how big can n be?" rules of thumb (n ≤ 10 → n!; ≤ 20 → 2ⁿ; ≤ 500 → n³; ≤ 5000 → n²; ≤ 10⁶ → n log n; bigger → n or log n).
- **How to use your interview language for DSA:** a full cheat sheet per language (Python `collections`, `heapq`, `bisect`, `itertools`, `functools.cache`; Java Collections, `PriorityQueue`, `Deque`, `TreeMap`; C++ STL; JS `Map`/`Set` and the missing heap, with a ready-to-paste MinHeap class).

### Core patterns (each one is a full topic)
Arrays and hashing · Two pointers · Sliding window · Prefix sums and difference arrays · Kadane's algorithm · Stacks · Monotonic stack/queue · Queues and deques · Binary search (all three templates + binary search on the answer) · Linked lists (dummy node, reversal, fast & slow pointers) · Intervals (merge, insert, sweep line, meeting rooms) · Sorting (merge, quick, heap, counting, bucket, plus when the interviewer wants you to implement one) · Heaps / priority queues (top-K, two heaps, K-way merge) · Hashing internals (collisions, load factor, Rabin–Karp rolling hash) · Recursion · Backtracking (subsets, permutations, combinations, N-Queens, Sudoku, word search) · Trees (DFS orders, BFS level order, BST properties, LCA, serialization) · Tries · Graphs (BFS, DFS, grids as graphs, cycle detection, bipartite) · Topological sort (Kahn + DFS) · Shortest paths (Dijkstra, Bellman–Ford, Floyd–Warshall, 0-1 BFS) · Minimum spanning tree (Kruskal, Prim) · Union-Find / DSU (path compression, union by rank) · Greedy (exchange argument, and when greedy fails vs. DP) · 1-D DP · 2-D / grid DP · Knapsack family (0/1, unbounded, subset sum) · String DP (LCS, edit distance, palindromes) · LIS (O(n²) and O(n log n)) · Interval DP · DP on trees · Bitmask DP · Bit manipulation · Math and number theory (GCD/LCM, sieve, modular arithmetic and inverse, fast exponentiation, combinatorics) · Matrix problems (rotate, spiral, set zeroes)

### Advanced (marked "competitive / bonus, lower interview ROI")
Segment trees (with lazy propagation) · Fenwick trees · String algorithms (KMP, Z-function) · Advanced graphs (Tarjan/bridges, strongly connected components) · Competitive programming starter kit: fast I/O, a C++ template, how Codeforces ratings work, and the CSES / AtCoder DP contest path.

### DSU-adjacent design questions
LRU cache, LFU cache, design a hit counter, rate limiter, insert-delete-getRandom O(1), min stack, time-based key-value store, and iterator design. These come up constantly and combine data structures.

---

## Problem bank (`data/problems.js`)

- **All of NeetCode 150** (which includes Blind 75), each tagged with topic, pattern, difficulty, whether it's in Blind 75, and the companies known to ask it where well-documented. Use real LeetCode numbers, titles and slugs. **Verify every number/title/slug pair; don't invent problems or URLs.** If you're unsure of one, leave it out.
- Anchor problems that must be included (verify each):
  - Hashing: 1, 49, 128, 217, 238, 242, 347, 36
  - Two pointers: 11, 15, 42, 125, 167
  - Sliding window: 3, 76, 121, 239, 424, 567
  - Stack: 20, 84, 150, 155, 739, 853, 496, 503
  - Binary search: 4, 33, 74, 153, 704, 875, 981
  - Linked list: 2, 19, 21, 23, 25, 138, 141, 143, 146, 206, 287
  - Trees: 98, 100, 102, 104, 105, 110, 124, 199, 226, 230, 235, 297, 543, 572, 1448
  - Tries: 208, 211, 212
  - Heaps: 215, 295, 355, 621, 703, 973, 1046
  - Backtracking: 17, 39, 40, 46, 51, 78, 79, 90, 131
  - Graphs: 127, 130, 133, 200, 207, 210, 417, 684, 695, 994, 332, 743, 778, 787, 1584
  - DP: 5, 10, 62, 70, 72, 91, 97, 115, 139, 152, 198, 213, 300, 309, 312, 322, 329, 416, 494, 518, 647, 746, 1143
  - Greedy: 45, 53, 55, 134, 678, 763, 846, 1899
  - Intervals: 56, 57, 435, 1851
  - Math/matrix: 43, 48, 50, 54, 66, 73, 202, 2013
  - Bits: 7, 136, 190, 191, 268, 338, 371
  - DSU / advanced: 307, 315, 547, 721
- A problem-browser view with filters (topic, pattern, difficulty, status, Blind 75 / NeetCode 150, company), full-text search, and sorting.
- **"Pattern Detective" drill:** shows only a problem statement and I pick the pattern before seeing the answer. Track my accuracy per pattern. This trains the recognition skill that matters most in interviews.
- **Review queue:** solved problems resurface at increasing intervals (1, 3, 7, 14, 30 days), and so do problems I needed hints for, so I re-solve them cold.

---

## Surfaces (build all of these)

1. **Home / Today:** the next three things to do today, generated from my plan and review queue, plus a streak, a countdown to my target date, hours studied this week, and a big "Start session" button.
2. **Roadmap:** an interactive dependency graph of every topic (SVG; nodes colored by mastery, click to open), plus a linear "recommended order" view. Mastery = practice solved + quiz score + flashcard retention.
3. **Study plan:** a week-by-week plan auto-generated from my onboarding answers (timeline and weekly hours), re-balanced when I fall behind. Default 10-week shape, scaled to my timeline:
   - Weeks 1–2: language fluency, Big-O, arrays/hashing, two pointers, sliding window, stack
   - Weeks 3–4: binary search, linked lists, trees, tries, heaps
   - Weeks 5–6: backtracking, graphs, advanced graphs, start system design
   - Weeks 7–8: DP (all families), greedy, intervals, bits, plus system design case studies
   - Weeks 9–10: mixed timed practice, mock interviews, behavioral stories, company-specific lists, applications and negotiation
   - Throughout: applications pipeline starting week 3, because interview loops take 4–8 weeks to schedule.
4. **Topic lessons:** the full topic schema above.
5. **Problem browser + problem detail:** hint ladder, my notes, a timer, a solution tab hidden until I ask, and a "solve it in the in-browser editor" panel.
6. **Code playground:** a `<textarea>`-based editor (tab indentation, line numbers, no heavy editor libs) that runs JS (sandboxed, time-boxed) and Python (Pyodide). For practice problems, include a few test cases I can run my solution against, with pass/fail display.
7. **Visualizer gallery:** every visualizer in one place. At minimum: sorting race (pick 2–4 algorithms and race them on the same array), binary search, two pointers, sliding window, linked-list reversal, stack/queue, monotonic stack, BST insert/delete, tree traversals, heap sift-up/sift-down, trie insert/search, BFS vs. DFS on a grid (I draw walls), Dijkstra on an editable graph, topological sort, union-find with path compression, DP table filling (LCS, knapsack, edit distance) with arrows showing which cells each cell came from, the backtracking recursion tree, and bit manipulation (toggle bits, see AND/OR/XOR/shifts).
8. **Cheat sheets:** printable (a print stylesheet producing clean one-page sheets): Big-O for every data structure and operation, sorting comparison table, pattern → template one-pager, graph-algorithm chooser ("weighted? negative edges? all pairs?" decision tree), DP pattern catalog, language cheat sheet, and a "the night before the interview" sheet.
9. **Flashcards:** a spaced-repetition deck (SM-2 or simple Leitner) built from every topic plus system design and behavioral, with keyboard shortcuts (space to flip, 1–4 to grade), daily due count, and filter by deck.
10. **Mock interview room:** pick a 45-minute coding mock (random medium problem from my weak patterns) or a system design mock. It runs a phase timer with prompts on screen: clarify (5 min) → approach and complexity (10) → code (20) → test and edge cases (5) → follow-ups (5). Afterwards there's a self-scoring rubric (communication, problem solving, code quality, testing, the four dimensions interviewers actually score), and the history is kept so I see my trend.
11. **System design module (full curriculum, not a link list):**
    - Fundamentals: client/server, DNS, CDN, load balancers, horizontal vs. vertical scaling, caching (strategies, eviction, invalidation), databases (SQL vs. NoSQL, indexing, replication, sharding, partitioning), CAP and PACELC, consistency models, message queues and pub/sub, rate limiting, consistent hashing, blob storage, search indexes, monitoring, and back-of-the-envelope estimation (with a built-in calculator for QPS, storage and bandwidth, plus a "numbers every engineer should know" table).
    - An interview framework: requirements → estimates → API → data model → high-level design → deep dives → bottlenecks and trade-offs, with time boxes.
    - 12+ case studies, each with requirements, estimates, an interactive architecture diagram (SVG; click a component for its rationale and trade-offs), data model, and the deep-dive questions interviewers push on: URL shortener, rate limiter, news feed, chat (WhatsApp), notification system, YouTube/video streaming, Dropbox/file sync, typeahead/autocomplete, web crawler, Uber/ride matching, distributed key-value store, payment system, and ticket booking (Ticketmaster).
    - Object-oriented / low-level design: SOLID, key design patterns with code, and classic LLD problems (parking lot, elevator, library system, vending machine, LRU cache).
12. **Behavioral studio:**
    - The STAR(L) method explained, with strong vs. weak answer examples.
    - A **story bank builder:** I write 8–10 stories once in structured STAR fields; the app maps each story to the competencies it covers (leadership, conflict, failure, ambiguity, impact, mentoring, disagreeing with a manager, tight deadline) and shows coverage gaps.
    - 50+ common questions, grouped by competency, plus an Amazon Leadership Principles section, each linkable to my stories.
    - Practice mode: a random question, a 2-minute timer, then a self-check rubric.
    - "Questions to ask your interviewer," by interviewer type.
13. **CS fundamentals refresher** (for the trivia and screening rounds): OS (processes vs. threads, scheduling, memory, virtual memory, deadlocks), concurrency (locks, semaphores, race conditions, classic problems, with code), networking (TCP vs. UDP, HTTP/1.1/2/3, TLS handshake, REST vs. gRPC vs. GraphQL, WebSockets, "what happens when you type a URL"), databases (ACID, isolation levels, indexes/B-trees, transactions, plus an SQL practice section with joins, group by and window functions), and quick-hit questions with answers.
14. **Career and offer module** (this is what turns prep into a high-paying job):
    - Resume: an impact-bullet formula ("Accomplished X as measured by Y by doing Z"), before/after examples, ATS rules, a one-page template, and a checklist.
    - Job-search strategy: referrals (outreach message templates), recruiter outreach, LinkedIn optimization, which companies to target by tier, and how to sequence applications so offers land at the same time.
    - An **applications pipeline tracker** (kanban: Wishlist → Applied → Recruiter screen → Phone/OA → Onsite → Offer → Rejected), with dates, contacts, notes and next action, all in localStorage.
    - The interview process at typical big-tech and high-growth companies: OA, phone screen, onsite loop, team matching, and how leveling works.
    - Compensation: base / bonus / equity / RSU vesting schedules, how to read levels.fyi, total-comp comparison calculator (multiple offers side by side, with a 4-year view including vesting schedule and refreshers).
    - Negotiation: the principles, competing offers, exact scripts for "what are your salary expectations?", the counter-offer email, and how to handle exploding offers.
    - Company-specific prep notes: how to use LeetCode company tags, Glassdoor and the GFG interview experiences linked in the repo.
15. **Resource library:** **every link in the DSA-Kit README**, reproduced faithfully (don't fabricate or "fix" URLs), searchable and filterable by category, type (video, book, course, sheet, tool, community, article), free vs. paid, and level. Each has a one-line note on what it's best for and a "done" checkbox. Highlight "start here" picks per category (e.g. NeetCode roadmap, Tech Interview Handbook, Visualgo, System Design Primer, the CSES handbook). Where a README link looks mislabeled (e.g. a "Kadane visualization" link that points to Visualgo's recursion page), keep it but add a small note.
16. **Global search** (Ctrl/Cmd+K command palette) across topics, problems, flashcards, cheat sheets, system design and resources.
17. **Settings:** language, theme, target date, weekly hours, export/import/reset progress, and the reduced-motion override.
18. **Wellbeing:** a short page drawn from the repo's burnout and "long game" articles: session-length guidance, rest days built into the plan, and what to do after a rejection. Keep it practical, not preachy.

---

## Build phases (check in with me after each)

Work in phases. After each phase, open the app in the browser, take one screenshot round (desktop + mobile), fix what's broken, give me a 5-line summary, and continue unless I say stop.

1. **Design and shell:** impeccable init → shape → new-work. Then the app shell, router, tokens, theme toggle, nav, command palette, store with export/import, and onboarding. Show me the generated hero/card variants and let me pick.
2. **Engine:** topic-page renderer from the schema, problem browser, hint ladder, code runner (JS sandbox + Pyodide), quiz engine, flashcard SRS, review queue.
3. **Content, part 1:** Foundations + arrays/hashing through heaps, fully populated, with their visualizers. Build one topic end to end first (sliding window) as the gold standard, show me, then replicate the pattern. Content for independent topics can be written by parallel subagents, each given the schema and the gold-standard topic file as a reference.
4. **Content, part 2:** backtracking, graphs, DP families, greedy, intervals, bits, math, and the advanced topics, with visualizers.
5. **Beyond DSA:** system design (with interactive diagrams and the estimation calculator), LLD, behavioral studio, CS fundamentals, career/offer module and pipeline tracker, resource library, cheat sheets (with print CSS).
6. **Planner and dashboard:** study plan generator, roadmap graph, Home/Today, mastery calculation, mock interview room.
7. **Impeccable finishing passes:** critique → audit → layout/typeset → colorize → animate → delight → overdrive → onboard → clarify → harden → adapt → polish → document → extract (as described above).
8. **Verification:**
   - Every LeetCode link uses a real slug matching its number and title.
   - Every code template and worked solution actually runs. Add a hidden `#/selftest` route that runs every JS solution against its test cases and reports pass/fail, and run each Python solution through Pyodide or locally with `python` if available.
   - Every route works from `file://`, the back button works, nothing throws in the console, and export → reset → import round-trips my progress exactly.
   - Keyboard-only walkthrough of every surface.
   - Report what's done, what's thin, and what you'd add next.

## Quality bar

- **Accuracy over volume.** A wrong complexity or a solution that fails an edge case is worse than a missing one. If unsure, say so in the content.
- **Teach, don't list.** Every topic should leave me able to solve a new problem in that pattern, not just recognize ones I've seen.
- **Interview-real.** Everything is framed around what happens in the room: what to say, when to say it, how interviewers score you.
- **No placeholder content** like "Lorem ipsum," "TODO: add explanation," or "coming soon" in shipped topics. If a phase runs out of room, finish fewer topics completely rather than many partially, and tell me which ones remain.

---

## Source: DSA-Kit README

Before Phase 1, get the README from https://github.com/avinash201199/DSA-KIT. Use `git clone --depth 1` into a `source/` folder, or fetch `README.md` from the repo's default branch. Keep that copy in the project as the source of truth for `data/resources.js`. If the fetch fails, stop and ask me to paste it.

Every link in it must appear in the Resource Library, and in the relevant topic's "Go deeper" section. Its sections are: Roadmaps, Core Concepts, Books, Courses & Videos, Problem Sheets, Practice Platforms, 15 topic sections (Arrays & Strings → DSU), Competitive Programming, Interview Preparation, Cheat Sheets, Visualizers & Tools, Communities, Blogs & Newsletters, GitHub Repositories, Language-Specific Resources, System Design, and Key Articles & Advice. Check the parsed link count against the README before moving on.
