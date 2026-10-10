---
name: Offer Ready
description: A nightly interview-prep studio drawn as an athletic training log, with the whole prep season charted to offer day.
colors:
  timing-blue: "#2b3fe0"
  timing-blue-hover: "#2131c0"
  timing-blue-text: "#2735cc"
  timing-blue-soft: "#e5e9ff"
  timing-blue-line: "#8e9bff"  # also --rail-accent in tokens.css
  graphite-paper: "#f3f4f6"
  surface-white: "#ffffff"
  surface-sunk: "#eceef2"
  surface-deep: "#e1e4ea"
  hairline: "#d5d9e0"
  hairline-strong: "#b2b8c3"
  ink: "#11141b"
  ink-2: "#454c5b"
  ink-3: "#5f6778"
  rail-night: "#151922"
  rail-raised: "#1e2330"
  rail-active: "#2a3040"
  rail-ink: "#e8ebf2"
  rail-ink-2: "#a3abbb"
  turf-easy: "#0d7a5c"
  turf-easy-soft: "#dcf2e9"
  amber-medium: "#975700"
  amber-medium-soft: "#f9ead1"
  track-red-hard: "#bd2440"
  track-red-hard-soft: "#fbe0e5"
  code-paper: "#f8f9fb"
  night-bg: "#0f121a"
  night-surface: "#161a24"
  night-ink: "#e4e7ee"
  night-accent: "#8391ff"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.4vw, 3.25rem)"
    fontWeight: 760
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  bib:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.75rem, 2.4rem + 4.2vw, 6rem)"
    fontWeight: 850
    lineHeight: 0.86
    letterSpacing: "-0.02em"
    fontFeature: "tnum, lnum"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 760
    lineHeight: 1.1
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 760
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  reading:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.68
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "Martian Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.7
    fontFeature: "tnum"
rounded:
  sm: "3px"
  md: "5px"
  lg: "8px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "40px"
  s-12: "48px"
  s-16: "64px"
  s-20: "80px"
components:
  button-primary:
    backgroundColor: "{colors.timing-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.timing-blue-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    height: "24px"
    padding: "0 8px"
  segmented-control:
    backgroundColor: "{colors.surface-sunk}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-option-selected:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "28px"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "38px"
  nav-link:
    textColor: "{colors.rail-ink-2}"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 12px"
  nav-link-active:
    backgroundColor: "{colors.rail-active}"
    textColor: "#ffffff"
  bib-tag:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "26px"
    padding: "0 6px"
  lane-row:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  split-bar-segment:
    backgroundColor: "{colors.surface-sunk}"
    padding: "8px 8px 6px"
  code-block:
    backgroundColor: "{colors.code-paper}"
    rounded: "{rounded.lg}"
---

# Design System: Offer Ready

## Overview

**Creative North Star: "The Training Block"**

Offer Ready treats interview prep as an athletic training season, not a backlog. A coach's periodization log sets the grammar: one season, a weekly load, a race day. The owner opens it at night and sees the day and phase, the distance to offer day, and tonight's three items with times. The surface refuses the category default of a sidebar plus a grid of topic cards with progress bars. Structure comes from hairline rules, tabular numerals and shape-coded marks instead of card chrome.

The voice is precise and instrument-like, with a textbook warmth in the reading pages. Graphite neutrals tinted cool carry everything. One timing-blue accent is reserved for action, selection and the live week. Numbers are the hero: LeetCode numbers and week counts are set as race-bib numerals in condensed Archivo, and every place data lives uses tabular figures. Radii are small, like instrument bezels.

Light ("day session") and dark ("night session") are both first-class and follow the OS unless the owner picks one. The Season Chart on Home is the signature moment: the whole season drawn as a periodization chart, this week's bar filling as the owner studies, scrubbable by pointer or arrow keys with a pace line showing ahead or behind. The product brief also rules out a generic Tailwind/shadcn dashboard look.

**Key Characteristics:**
- Hairline rules and tabular numerals instead of card chrome; a 2px ink rule opens a list or table, 1px lines separate rows.
- Race-bib numerals (Archivo at 62% width, weight 850) for problem numbers, week numbers, countdowns and stats.
- One accent, timing blue, on action, selection and "now".
- Difficulty coded by shape and color together (circle green, diamond amber, triangle red), readable in both themes.
- Small radii (3, 5, 8px), flat surfaces, shadows only on floating layers.
- A dark graphite rail on the left in both themes; the content canvas flips, the rail stays night.

## Colors

A cool graphite palette with a single electric timing-blue, plus three turf/amber/track signals that mean difficulty and status.

### Primary
- **Timing Blue** (#2b3fe0): the one accent. Primary buttons, focus ring, the live week and logged bars on the Season Chart, selected states, the caret. In dark it lifts to **Night Timing Blue** (#8391ff) with dark ink on it.
- **Timing Blue Text** (#2735cc): the accent when used as link or label text on light surfaces, so it passes contrast; **Timing Blue Soft** (#e5e9ff) is the selected-row and chip wash, **Timing Blue Line** (#8e9bff) the quiet accent stroke (also used on the dark rail for active icons).

### Secondary
- **Turf Green** (#0d7a5c): Easy, solved, mastered, on-pace. Soft fill #dcf2e9.
- **Amber** (#975700): Medium, warnings. Soft fill #f9ead1.
- **Track Red** (#bd2440): Hard, errors, behind-pace, destructive actions. Soft fill #fbe0e5.
In dark these become #4fcfa3, #f0b44c and #ff7b8b with 13% alpha fills.

### Neutral
- **Graphite Paper** (#f3f4f6): page canvas. **Surface White** (#ffffff): panels, inputs, selected segments. **Surface Sunk** (#eceef2) and **Surface Deep** (#e1e4ea): hover fills, tracks, empty bars.
- **Hairline** (#d5d9e0) and **Hairline Strong** (#b2b8c3): row dividers and control borders.
- **Ink** (#11141b), **Ink 2** (#454c5b), **Ink 3** (#5f6778): primary, secondary and tertiary text; Ink also draws the 2px list-opening rules.
- **Rail Night** (#151922) with **Rail Raised** (#1e2330) hover and **Rail Active** (#2a3040): the left rail, bottom tabs, toasts and phone sheet.
- **Code Paper** (#f8f9fb): code surfaces. Dark canvas set: #0f121a bg, #161a24 surface, #e4e7ee ink.

### Named Rules
**The One Blue Rule.** Timing blue marks action, selection or "now" and nothing else. Status and difficulty never borrow it.
**The Shape Plus Hue Rule.** Easy, Medium, Hard and problem status are always a color with a distinct shape; hue alone never carries meaning.
**The Night Rail Rule.** The rail is graphite in both themes; only the canvas flips.

## Typography

**Display Font:** Archivo (variable, width axis 62-125%), with ui-sans-serif, system-ui fallbacks
**Body Font:** Archivo for UI; Literata (variable, with italic) for lesson prose
**Label/Mono Font:** Martian Mono at 84% width, with ui-monospace fallbacks

**Character:** Condensed Archivo gives headings and numerals the look of a bib and a stopwatch; Literata makes the lessons read like a beautiful textbook; Martian Mono is for code, splits, timers and counts. Fonts are self-hosted from fonts/.

### Hierarchy
- **Bib** (850, clamp(3.75rem, 2.4rem + 4.2vw, 6rem), 0.86, 62% width): countdown and race-card numbers. Smaller bib steps use 40px (week numbers), 31px, 24px and 17px (tags).
- **Display** (760, clamp(2rem, 1.3rem + 2.4vw, 3.25rem), 1.02, 74% width, balanced wrap): hero and page titles; 40px for page titles.
- **Headline** (760, 24px / 31px for lesson sections, 74% width): section titles.
- **Title** (700-760, 17-20px): lane heads, card titles, worked-example titles.
- **Body** (400, 15px, 1.5): UI text at 13-15px; secondary text uses Ink 2.
- **Reading** (Literata 400, 18px, 1.68, 68ch measure): lessons and guides; headings inside prose switch back to condensed Archivo.
- **Label** (600, 11-13px; the rail group label is 11px, 0.12em tracking, uppercase): field labels, metadata, legends.
- **Mono** (Martian Mono 400-600, 11-13px, tabular): code at 13px / 1.7, counts, timers, week ranges.

### Named Rules
**The Bib Numeral Rule.** Any number that is an identity or a score (LeetCode number, week, countdown, tally) is a condensed tabular bib numeral, never body text.
**The Tabular Rule.** Wherever data lives, use tabular figures so columns and timers do not jitter.

## Layout

A fixed 236px graphite rail on the left (68px icon-only below 1180px, gone below 760px where five bottom tabs and a More sheet take over), a 56px sticky top bar with search, stopwatch, language and theme, and a main column up to 1320px (reading pages 920px, lesson body 820px) with a fluid gutter of clamp(16px, 2.6vw, 40px). Spacing runs on a 4px base from 4 to 80px. Home is a two-thirds/one-third hero (1.75fr / 1fr, collapsing below 1100px) over a full-width Season Chart. Lists are separated by rules rather than boxed: 2px ink rule on top, 1px hairline between rows, 20-24px row padding. Topics use season lanes: one column per phase, separated by vertical hairlines, auto-fit at 190px minimum. The rail folds its labelled groups with a chevron. Phone layouts reflow tables to stacked rows and make the Season Chart swipeable (640px minimum chart width).

Motion is short and decisive: 120ms for hover, 200ms for state, 320ms for pointer slides, 560ms for the chart bar fill, on an expo-out curve. All durations go to 0 under the OS reduced-motion setting or the in-app override.

## Elevation & Depth

Flat by default. Depth is conveyed by hairlines, tonal steps (canvas, surface, sunk, deep) and the 2px ink rule, not shadows. Two soft shadows exist: a small one on the selected segment and the flashcard, and a larger one on floating layers (command palette, dialogs, toasts). The top bar uses a translucent blurred canvas as it scrolls.

### Shadow Vocabulary
- **Raised** (`0 1px 2px rgb(17 20 27 / 0.06), 0 2px 6px rgb(17 20 27 / 0.05)`): selected segment, flashcard.
- **Floating** (`0 2px 6px rgb(17 20 27 / 0.08), 0 16px 40px rgb(17 20 27 / 0.14)`): palette, modal, toast. Heavier black-based values in dark.

### Named Rules
**The Flat-At-Rest Rule.** Content surfaces carry no shadow; only the selected segment, flashcard and floating layers do.
**The Top Rule Rule.** Emphasis on a block is a top rule (2px ink for lists, 3px for cards such as pipeline cards and example blocks), never a colored side stripe.

## Shapes

Small, instrument-like radii: 3px for chips, tags, kbd and lane rows; 5px for buttons, inputs and selects; 8px for panels, code blocks and dialogs. Borders are 1px hairlines; the bib tag uses a 1.5px currentColor outline. Difficulty and status marks are tiny geometry (8-9px circle, diamond, triangle; hollow, half, solid and double-ringed circles). Focus is a 2px accent outline with 2px offset; inputs also get a 3px soft accent halo. Chart bars are plain rectangles with a hairline stroke; rest weeks are dashed.

## Components

### Buttons
- **Shape:** 5px radius, 36px high, 16px side padding, 13px semibold; sm 30px, lg 52px (hero Start session).
- **Primary:** timing blue fill with white text (dark ink in dark theme); darkens to #2131c0 on hover.
- **Ghost:** transparent, Ink 2 text; hover fills Surface Sunk and darkens text. The default (secondary) button is a white surface with a strong hairline border.
- **Hover / Focus:** 120ms color change, 1px press translate on active, 2px accent focus outline. Danger variant uses red text and a soft red hover.

### Chips and segmented control
- **Chip:** 24px, 3px radius, 1px hairline, white fill, Ink 2 text; the accent chip uses the soft blue fill with no border.
- **Segmented control:** a sunk 5px-radius trough with 2px padding; the selected option is a white 28px pill with the Raised shadow. Used for language, theme and filters.

### Inputs / Fields
- **Style:** 38px min height, 1px strong hairline, 5px radius, white fill; selects use a drawn chevron. Labels are 13px semibold with 12px hints below.
- **Focus:** border turns timing blue with a 3px soft-blue halo. Placeholder in Ink 3.

### Navigation
- Rail link: 34px, 5px radius, 13px medium, rail-ink-2 text; hover lifts to Rail Raised, current page gets Rail Active, white text and a blue-line icon. Group labels are 11px uppercase and fold with a chevron. Counts are mono chips. Phone swaps to five bottom tabs, 62px.

### Topic Lane Row
- A row inside a phase lane: mono number, 13px semibold title, 3px radius. A fill behind the text reports mastery: 8% accent with a blue-line underline for learning, 15% accent for practicing, 16% green for mastered. Lane heads carry a 2px ink rule with condensed titles.

### Bib Tag
- The problem number as a 26px outlined tag: 1.5px currentColor border, 3px radius, condensed 17px tabular numerals. Difficulty sits beside it as a shape-coded label.

### Season Chart (signature)
- A full-width SVG periodization chart: alternating phase bands, one bar per week with a hairline outline, logged hours filling from the bottom in timing blue, this week hatched with a blue outline, a blue today line, a flag for offer day, and a solid-ink pace line against a dashed planned line. Empty plan bars carry a faint 7% accent tint so the season's shape reads before any study. Short past weeks outline in muted red. Scrubbing selects a week and fills a detail strip below (bib week number, plan sentence, mono hours). Pace text is green when on or ahead, red when behind.

### Race Card and Split Bar
- Mock room opens with a race card: a bib numeral, title and mono clock between a 2px ink rule and a hairline. Under it the phase split bar is a row of proportional segments (3px gap), each a sunk cell with a 3px bottom edge: strong hairline to come, green when past, blue with a soft-blue fill for the current phase.

### Code Block
- Code Paper surface, 1px hairline, 8px radius; a white title bar with a per-language segmented toggle, Martian Mono 13px at 1.7 with line-number gutter, highlighted lines in a 10% accent wash, and a note strip beneath. Syntax colors are a restrained set (blue keywords, ochre strings, violet numbers, teal builtins) with italic grey comments.

## Do's and Don'ts

### Do:
- **Do** open lists and tables with a 2px ink rule and separate rows with 1px hairlines; use a 3px top rule for emphasized blocks.
- **Do** set identity and score numbers as condensed bib numerals with tabular figures.
- **Do** code Easy, Medium and Hard with both color and shape (circle, diamond, triangle) in both themes.
- **Do** reserve timing blue for action, selection and the live week.
- **Do** keep radii at 3, 5 or 8px and surfaces flat; put shadows only on floating layers.
- **Do** keep focus visible (2px accent outline) and honor reduced motion via the duration tokens.
- **Do** let the Season Chart stay the signature; new surfaces borrow its hairline-and-numeral grammar.

### Don't:
- **Don't** return to a sidebar-plus-grid-of-topic-cards-with-progress-bars layout; the product brief rejects it.
- **Don't** use colored side-stripe borders on cards or rows; use a top rule instead (the owner replaced them).
- **Don't** make it look like a generic Tailwind/shadcn dashboard or a GeeksforGeeks clone.
- **Don't** rely on hue alone for difficulty, status or pace.
- **Don't** introduce a second accent color or large pill radii.
