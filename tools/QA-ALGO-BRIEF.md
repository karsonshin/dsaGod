# Addendum: algorithm catalog entries

Read `tools/QA-BRIEF.md` first and follow all of it (schema, verification, `node tools/check_qa.js`). This addendum adds rules for **algorithm catalog** entries: one entry per named algorithm or technique, shown both in the tutor and on a browsable "Algorithms" page.

## One entry per algorithm

- `title` is the algorithm's name as people search for it ("A* search", "Dinic's maximum flow", "Aho-Corasick", "Convex hull (Andrew's monotone chain)"). Use the common spelling; mention aliases in `tags` ("astar a-star a star heuristic search").
- `cat` (REQUIRED): the category shown on the Algorithms page. Use exactly one of these strings, so entries group together:
  `Graphs: shortest paths`, `Graphs: search`, `Graphs: spanning trees and connectivity`, `Graphs: flow and matching`, `Graphs: trees`, `Graphs: other`,
  `Game and AI search`, `Optimization and heuristics`, `Machine learning basics`,
  `Strings: matching`, `Strings: structures`, `Strings: sequence alignment and compression`,
  `Number theory`, `Numerical methods`, `Combinatorics and randomness`, `Geometry`,
  `Data structures: advanced`, `Data structures: probabilistic`, `Range queries and offline techniques`, `DP optimizations`, `Searching and sorting: advanced`, `Puzzles and simulations`.
- `q` phrasings: at least 6, covering "what is X", "explain X", "how does X work", "X in python", "implement X", "X code", "X vs Y" (when a close alternative exists), "when to use X".
- `a` (direct answer, under ~70 words): what the algorithm computes, the key idea in one sentence, and when to use it.
- `code.py` (REQUIRED): a COMPLETE, idiomatic, runnable implementation (function or class) plus a tiny demo with printed result in a comment. Standard library only (no numpy). It must be correct on edge cases, not a sketch. `check` must compare against an independent oracle where possible (brute force, a simpler known algorithm, or hand-computed expected values) on small random or fixed inputs, with at least 3 asserts.
- `more` (REQUIRED, under ~130 words): bullets with the invariant or why it is correct, when NOT to use it, common mistakes, and its closest alternative.
- `cx` (REQUIRED): time and space with the variables defined (V, E, n, m...), average vs worst case where they differ.
- `see`: real in-app links (topic ids from data/curriculum.js, e.g. `#/topic/shortest-paths`, `#/topic/graphs`, `#/topic/string-algos`, `#/topic/advanced-graphs`, `#/topic/segment-tree`; cheat sheets `#/cheatsheets/big-o-algorithms`, `#/cheatsheets/graphs`). Only `#/problem/N` for numbers in data/problems.js.
- If the algorithm has a well-known weakness or a trap (negative weights, non-admissible heuristic, overflow), say so in `more`.
- Where an algorithm is conceptual or too large for a short implementation (for example "link-cut tree"), say clearly in `a` that this is an overview, give the idea and a small working piece (an operation or a toy version), and do not pretend it is complete.

## Accuracy

Wrong complexities and non-working code are worse than missing entries. Re-derive claims; run everything; prefer fewer, correct entries. Do not invent history ("invented by X in 19xx") unless you are certain; leave dates and names out when unsure. Original wording only.

## Do not duplicate

Existing files in `data/qa/` already cover (do not rewrite): BFS, DFS, Dijkstra with heapq, Bellman-Ford, Floyd-Warshall, 0-1 BFS, Kruskal, Prim, Tarjan and Kosaraju SCC, bridges, bipartite, Euler path, topological sort, union-find, segment tree, Fenwick, tries, KMP, Z-function, Rabin-Karp, Manacher, sieve, gcd, fast power, knapsack, LCS, LIS, edit distance, binary search variants, the basic sorts, heapq usage, consistent hashing, Bloom filter, LRU. A basic "what is A* search?" entry (id `gr-a-star`) exists but has no implementation; you may write a full A* implementation under your own id. Before writing, run `grep -il "<name>" data/qa/*.js` to see whether an entry exists; if it does, skip it or write a clearly different entry (a different variant). Other agents write the other catalog files in parallel; stay inside your scope.
