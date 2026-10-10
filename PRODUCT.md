# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and vanilla JavaScript (owner's decision). No backend, build step, bundler, npm or framework, and no server. It must run by double-clicking `index.html` (`file://`), so content loads through classic `<script src>` tags that write into a global namespace (`window.OR`). No `fetch()` of local files and no ES modules. CDN libraries are optional enhancements with offline fallbacks: Prism (cdnjs) for syntax highlighting and Pyodide (jsdelivr) lazy-loaded for running Python. Diagrams, visualizers and charts are hand-built with SVG, Canvas and CSS.

## Users

One user: the owner, a new-grad software-engineering candidate whose primary interview language is Python. They are half comfortable with data structures and not yet comfortable with algorithms, LeetCode or interviewing. They study daily for months, often late at night, mostly on a laptop and sometimes on a phone (flashcards, cheat sheets, reading).

## Product Purpose

Offer Ready is a personal interview-prep studio. It takes the owner from their current level to passing coding, system design and behavioral rounds at high-paying tech companies, and then through the job search to a signed new-grad offer. The timeline starts on October 1, 2026, and the goal is a position secured by May 2027. Success: the owner opens it every day, always knows exactly what to do next, and finishes with an offer.

## Positioning

It's a studio for one owner, not a link directory or a problem list. Every topic teaches in the same order: intuition, visual, template, worked problems, self-test, then links. The plan adapts to the owner's real timeline and pace. Progress, notes, stories and applications all stay on the owner's own machine and work offline.

## Operating Context

- Daily study sessions, often late at night, plus short phone sessions.
- Problems are solved on LeetCode (linked out). The app tracks status, notes, time taken and review intervals.
- Progress lives in `localStorage`. JSON export/import is the backup and the way to move progress between devices.
- Interview loops take 4–8 weeks to schedule, so the applications pipeline runs alongside study from week 3.

## Capabilities and Constraints

- Coverage: every topic and link in the DSA-Kit README (`source/README.md` is the source of truth), plus system design, behavioral, CS fundamentals, and career/offer material.
- All teaching content is original writing. Outside sites are linked as "go deeper" resources, never copied or closely paraphrased.
- Problems use real LeetCode numbers, titles and slugs, verified. Uncertain ones are left out.
- Code appears in Python, JavaScript, Java and C++ behind one global toggle, with Python as the default.
- Accuracy over volume, and no placeholder content in shipped topics.
- Storage fails safely: every storage call is guarded, and the app stays usable without storage.
- The JS runner is sandboxed and time-boxed. The Python runner needs internet; JS runs offline.
- Progress and resume (owner request, 2026-10-01): the app remembers the last place (route, section, scroll position) and offers to resume it. Drafts autosave: code, notes, in-progress quizzes and mocks. A Progress view acts as the training log.
- Resume & applications studio (owner request, 2026-10-01):
  - A full tech-resume guide, a bullet builder, and a structured resume editor with a printable one-page preview.
  - Storage for resume PDFs and cover letters (IndexedDB), organized per company and included in export/import.
  - Cover letters written in-app from templates.
  - Company details autofilled from a pasted URL by a layered resolver: URL and job-board parsing, then a built-in offline knowledge base, then public Wikidata, Wikipedia and job-board APIs when online. Every field shows its source and stays editable.

## Brand Commitments

- Name: "Offer Ready". No existing logo or assets.
- Voice: direct, practical and interview-real (what to say in the room, how interviewers score). Wellbeing guidance is practical, not preachy.
- Binding visual constraints from the owner, recorded verbatim in intent and not expanded here:
  - It must not look like a generic Tailwind/shadcn dashboard or a GeeksforGeeks clone.
  - Light and dark themes are both first-class, defaulting to `prefers-color-scheme`.
  - Easy/Medium/Hard color coding stays readable in both themes.
  - The owner's direction cue is "precision instrument meets beautiful textbook". The visual world itself is chosen in new-work.

## Evidence on Hand

- `source/README.md`: the DSA-Kit README, cloned 2026-10-01. Every link in it is reproduced faithfully.
- There are no testimonials, user counts, metrics or endorsements, and none may be invented.

## Product Principles

1. Always answer "what do I do next?" with today's next three actions, generated from the plan and the review queue.
2. Teach for transfer. The owner should be able to solve a new problem in a pattern, not just recognize ones they've seen. Recognition cues come first.
3. Interview-real. Everything is framed around what happens in the room.
4. Accuracy over volume. Wrong is worse than missing, and the content says so when unsure.
5. The owner's data is sacred. Progress is never lost, and export/import round-trips exactly.

## Accessibility & Inclusion

- Every surface works keyboard-only, with visible focus and ARIA on visualizers.
- WCAG AA contrast in both light and dark themes.
- `prefers-reduced-motion` is honored, with an in-app override.
- The phone layout is genuinely usable for flashcards, cheat sheets and reading.
- Dark theme is first-class for late-night study.
