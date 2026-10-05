/* System design case study: typeahead (search autocomplete). Same shape as url-shortener.js (schema: data/sd/schema.md).
   Numbers are rounded estimates. The top-k trie snippet in the deep dives was run against a small example. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'typeahead',
    title: 'Design search autocomplete (typeahead)',
    short: 'Suggest the best completions as a user types. A latency puzzle in prefix indexes, top-k ranking, caching and the gap between batch and fresh data.',
    difficulty: 'Medium',
    time: '45 min',
    tags: ['Trie', 'Caching', 'Ranking', 'Sharding'],
    prompt: 'Design the autocomplete box of a search engine. As a user types, show the top suggestions that start with what they have typed so far, fast enough to feel instant.',

    requirements: {
      functional: [
        'Given a **prefix**, return the top **10 suggested completions**, best first.',
        'Rank by how often people search for each phrase, with newer activity counting more.',
        'New popular phrases (a breaking news story) show up as suggestions within **minutes to hours**, not weeks.',
        'Never suggest blocked content (offensive, illegal, or removed by policy).',
        'Optional: lightly **personalize** with the user\'s own recent searches, and support several languages.'
      ],
      nonFunctional: [
        '**Latency**: suggestions appear within about 100 ms of a keystroke end to end, so the server budget is a few tens of milliseconds.',
        '**Availability**: the search box must keep working. If suggestions fail, show none and let the user search anyway.',
        '**Scale**: tens of thousands of suggestion requests a second at peak, because every pause in typing sends one.',
        '**Eventual consistency** is fine: a suggestion list that is an hour stale is acceptable; a wrong or missing list for a popular prefix is not.',
        '**Quality**: results must be relevant, deduplicated and safe.'
      ],
      outOfScope: ['The full search results page and its ranking.', 'Spelling correction as a primary feature (covered as a stretch in a deep dive).', 'Voice input, ads in suggestions, and rich suggestions with images.', 'Exact real-time counts: approximate popularity is enough.'],
      assumptions: ['Suggestions come from **past queries**, not from a document index.', 'Prefixes are matched on **normalized** text: lowercase, trimmed, accents folded.', 'The suggestion list contains text only (about 10 short strings).'],
      clarify: [
        { q: 'What are we suggesting: past queries, or titles from a catalogue?', a: 'Past queries from the search log. A catalogue (product names) is easier to build but ranks differently. Say which one you assume.' },
        { q: 'How fresh must a trending query be?', a: 'This drives the architecture. If hours are fine, a batch pipeline is enough. If minutes matter, add a small streaming path for trends on top of the batch index.' },
        { q: 'Is personalization required?', a: 'Treat it as an optional second ranking layer. Personalized responses cannot be cached publicly, so it changes the caching plan. Raise that trade-off.' },
        { q: 'How many suggestions and how long can prefixes be?', a: 'Ten suggestions and prefixes up to about 30 characters. Longer input is unlikely to match anything useful, so stop suggesting past a cap.' },
        { q: 'Which languages?', a: 'Start with one. Scripts without spaces (Chinese, Japanese) need tokenization or character-level indexing, which is a worthwhile mention but a separate project.' }
      ]
    },

    estimates: {
      intro: 'Anchor on **50 million daily active users** who each run about **5 searches a day**. A person typing a 20-character query fires a suggestion request after every short pause rather than every keystroke (debouncing), so call it about **6 requests per search**, or 30 suggestion reads per user per day. Each completed search is one logged event (the "write").',
      inputs: { dau: 50e6, writesPerUser: 5, readsPerUser: 30, peakFactor: 3, bytesPerWrite: 100, bytesPerRead: 500, years: 1, replication: 3, hotFraction: 0.05, serverQps: 5000, utilization: 0.6 },
      assumptions: [
        '**Debounce and prefix reuse** cut requests per search to about 6 (approximate; without debouncing it is closer to 15 to 20).',
        'A response is **about 500 bytes**: 10 suggestions of roughly 40 bytes plus headers (approximate).',
        'A logged search event is **about 100 bytes** (query text, timestamp, anonymous ID, locale).',
        'Peak is **3 times** average, because queries cluster around events and daily cycles.',
        'One suggestion server answers **about 5,000 requests a second** from memory, so the "app servers" row is the number of suggestion servers.',
        'The "cache size" row is an **upper bound**: popular prefixes repeat heavily, so a real cache holds far fewer distinct entries than a share of traffic bytes suggests.'
      ],
      extra: [
        { label: 'Distinct phrases kept (after pruning rare ones)', formula: 'assumed', result: '~50 million' },
        { label: 'Raw phrase text', formula: '50M x ~25 B', result: '~1.25 GB' },
        { label: 'Prefix nodes (shared prefixes, approx)', formula: 'up to ~25 per phrase unshared; sharing cuts it a lot', result: '~200 million' },
        { label: 'Prefix index with top-10 per node', formula: '200M x ~100 B (node + 10 phrase IDs)', result: '~20 GB' },
        { label: 'Search events per day', formula: '50M x 5', result: '250 million (~2.9K/s)' }
      ],
      notes: [
        'Roughly **17,000 suggestion reads a second on average and about 52,000 at peak**, against about 3,000 logged writes a second. **Reads dominate by 6 to 1, but the ranking data is rebuilt offline**, so the serving path is read-only.',
        'The prefix index is about **20 GB**: fits in the memory of one large machine, but you shard it anyway for throughput and for several replicas.',
        'The raw search log is the big data (about 9 TB a year at these numbers), but it is processed in batches and then aggregated; serving never touches it.',
        'Short prefixes dominate traffic (one or two letters), and there are few distinct short prefixes. That is why **caching works unusually well** here.'
      ]
    },

    api: [
      { method: 'GET', path: '/v1/suggest', desc: 'Return the top suggestions for a prefix. This is the hot path.',
        request: 'GET /v1/suggest?q=how%20to%20co&limit=10&lang=en',
        response: '{\n  "prefix": "how to co",\n  "suggestions": [\n    "how to cook rice",\n    "how to code",\n    "how to convert pdf to word"\n  ],\n  "indexVersion": 1842\n}',
        notes: ['Send `Cache-Control: public, max-age=300` for the generic (non-personalized) response so browsers and a CDN can reuse it.', '`q` is normalized on the server (lowercase, trim, collapse spaces); cache keys use the **normalized** prefix.', 'Return an empty list with 200 for a prefix with no matches. Do not return 404, which clients and CDNs treat as an error.', '`indexVersion` helps debugging and lets you see which snapshot a node served.'] },
      { method: 'POST', path: '/v1/events/search', desc: 'Record a completed search. Usually emitted by the search service, not called by browsers directly.',
        request: '{\n  "query": "how to cook rice",\n  "ts": 1790000000,\n  "anonId": "u_91c2",\n  "lang": "en"\n}',
        response: 'HTTP/1.1 202 Accepted',
        notes: ['**Fire and forget**: return 202 and enqueue. Logging must never slow or fail a search.', 'Only log **submitted** searches, not every prefix: keystroke prefixes would count "h", "ho", "how" as separate demand.'] },
      { method: 'GET', path: '/v1/suggest?q=...  (with a signed-in user)', desc: 'Personalized variant: same endpoint, but the response also blends in the user\'s recent searches.',
        notes: ['Send `Cache-Control: private` so a shared cache never serves one user\'s history to another.', 'Treat personalization as an optional **re-rank of the global top list**, applied last.'] },
      { method: 'PUT', path: '/v1/blocklist/{term}', desc: 'Admin: block a phrase (or pattern) from ever being suggested. Takes effect on the next build and, for urgent cases, immediately.',
        notes: ['An urgent block must also **purge CDN and cache entries** that contain the term.'] }
    ],
    apiNotes: ['Rate limit the suggest endpoint per client; it is cheap but unbounded callers can scrape your whole query history.', 'Use **GET** with the prefix in the URL, so it can be cached by URL.', 'Keep the response tiny: strings only. Rich fields cost bandwidth on every keystroke.'],

    data: {
      intro: 'Two datasets with opposite shapes. The **search log** is huge, append-only and processed offline. The **prefix index** is small, read-only at serving time, and rebuilt from the log on a schedule. Serving machines hold the index in memory and never read the log.',
      entities: [
        { name: 'search_event (log)', purpose: 'One row per submitted search. Append-only, partitioned by time. The raw input to ranking.', fields: [
          ['query', 'string', 'Normalized text.'], ['ts', 'timestamp', 'Used for time decay.'], ['anon_id', 'string', 'For dedupe and bot filtering; hashed.'], ['lang / region', 'string', 'Lets you build separate indexes per locale.']
        ] },
        { name: 'phrase_stats', purpose: 'Aggregated popularity per phrase. Produced by the batch job; read by the index builder.', fields: [
          ['phrase', 'string, primary key', ''], ['weighted_count', 'float', 'Count with exponential time decay, so recent searches matter more.'], ['unique_users', 'int', 'Helps resist one bot repeating a query.'], ['flags', 'bitset', 'Blocked, adult, low quality.']
        ] },
        { name: 'prefix index (serving)', purpose: 'Maps a prefix to its precomputed top-k list. Held in memory, versioned, replaced atomically.', fields: [
          ['prefix', 'string, key', 'Normalized prefix up to a maximum length.'], ['top_k', 'list of (phrase id, score)', 'Ten entries, best first. Storing IDs instead of strings saves memory.'], ['version', 'int', 'Snapshot number.']
        ] },
        { name: 'trending overlay', purpose: 'A small, fast-changing list of surging phrases, merged into results at query time.', fields: [
          ['phrase', 'string', ''], ['recent_rate', 'float', 'Searches in the last few minutes versus baseline.'], ['expires_at', 'timestamp', 'Entries age out on their own.']
        ] }
      ],
      storage: [
        { title: 'In-memory trie with top-k on every node', verdict: 'Fastest reads',
          body: 'Each node represents a prefix and stores the **precomputed top 10** phrases below it. A lookup walks `len(prefix)` nodes and returns the stored list: no search, no sorting. The cost is memory (every node carries a list) and build time, both paid offline.\n\n```\nfunction build(counts, k) {\n  const root = { next: {}, top: [] };\n  for (const [phrase, w] of Object.entries(counts)) {\n    let node = root;\n    for (const ch of phrase) {\n      node = node.next[ch] || (node.next[ch] = { next: {}, top: [] });\n      node.top.push([phrase, w]);\n      node.top.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));\n      if (node.top.length > k) node.top.pop();\n    }\n  }\n  return root;\n}\nfunction suggest(root, prefix) {\n  let node = root;\n  for (const ch of prefix) { node = node.next[ch]; if (!node) return []; }\n  return node.top.map(t => t[0]);\n}\n```\n\nWith counts `tea 50, ten 40, tent 30, team 90, tell 5, to 70` and k = 3, the prefix `te` returns `team, tea, ten` and `t` returns `team, to, tea`. (Run to check.) A real build compresses it: merge single-child chains into one edge, and store phrase IDs.' },
        { title: 'Prefix to top-k key-value table', verdict: 'Simplest to operate',
          body: 'Skip the tree: precompute, for every useful prefix, a row `prefix -> [top 10 phrases]` and put it in a key-value store or Redis. Lookup is one key read. It stores more bytes than a compressed trie (each prefix repeats its list) and reads cost a network hop, but you get sharding, replication and TTLs from the store for free, and the builder is trivial.' },
        { title: 'Search engine completion (finite-state transducer or n-gram index)', verdict: 'Good for fuzzy',
          body: 'Search libraries ship compact **FST-based suggesters** and n-gram indexes that handle prefix matches and fuzzy matches (typos) in one structure, with the operational features of a search cluster. Ranking is richer, but each query is heavier than reading a precomputed list, so it suits a smaller scale or the "stretch" tier behind a cache.' }
      ],
      decisions: [
        { title: 'Where to compute the top k', question: 'The ranking of the top 10 under a prefix can be done at build time or at query time.',
          options: [
            { name: 'Precompute top-k per prefix (offline)', pros: 'Lookup is O(prefix length), flat latency, cacheable, trivially replicated.', cons: 'More memory, freshness limited by the rebuild interval, and a changed score means rebuilding affected nodes.' },
            { name: 'Walk the subtree at query time', pros: 'Tiny index and always uses current counts.', cons: 'For the prefix "a" the subtree is enormous. Latency depends on the prefix and is worst for the most common queries.' },
            { name: 'Hybrid: precompute for short prefixes, search for long ones', pros: 'Short prefixes (the busiest, fewest) are cached lists; long prefixes have small subtrees that are cheap to scan.', cons: 'Two code paths and a threshold to tune.' }
          ],
          pick: '**Precompute top-k on every node** and prune the tree (drop rare phrases and prefixes longer than about 30 characters). Memory is cheap at 20 GB; unpredictable latency is not.' },
        { title: 'Batch or streaming updates', question: 'How quickly should new popularity show up?',
          options: [
            { name: 'Batch rebuild (hourly or daily)', pros: 'Simple, deterministic, reproducible; builds a whole snapshot you can validate and roll back.', cons: 'A story that breaks now does not appear for up to an hour.' },
            { name: 'Streaming updates to the live index', pros: 'Minutes of freshness.', cons: 'Concurrent writes to a read-optimized structure, harder consistency, and every update may touch up to 25 prefix nodes.' },
            { name: 'Batch base plus a small trending overlay', pros: 'Stable base index with a tiny, fast layer for what is surging right now. Merge both at query time.', cons: 'Two data sources to merge and a ranking rule for combining them.' }
          ],
          pick: 'The **hybrid**: an hourly (or daily) batch snapshot as the base, and a streaming job that watches the last few minutes of events and publishes a small overlay of surging phrases. Most traffic never needs the overlay.' },
        { title: 'How to partition the index', question: 'One machine can hold 20 GB, but you want throughput and replicas.',
          options: [
            { name: 'Replicate the whole index on every server', pros: 'Simplest; any server answers any prefix, no routing, linear read scaling.', cons: 'Every server holds all the memory; fine at 20 GB, painful at 20x.' },
            { name: 'Shard by first characters (range of prefix)', pros: 'Each shard owns a slice of the alphabet; small per-shard memory.', cons: 'Skewed: far more queries start with "s" than "x". Needs weighted ranges or splitting hot ranges.' },
            { name: 'Shard by hash of the prefix', pros: 'Even load.', cons: 'A user typing "app", "appl", "apple" hits a different shard on each keystroke, so no locality, and rebuilds are scattered.' }
          ],
          pick: 'At this size **replicate the whole index** and put the effort into caching. When it outgrows one node, shard by **weighted prefix ranges** (split hot ranges like "s" by the second letter), and add replicas per shard for throughput.' }
      ]
    },

    design: {
      intro: 'Reads and index building are separate worlds. The read path is **browser cache, then CDN, then suggestion servers reading an in-memory index**. The build path turns the search log into a new index snapshot every hour, with a small streaming overlay for trends. **Click any box** for the reasoning, or pick a flow to trace.',
      diagram: {
        title: 'Typeahead high-level design',
        nodes: [
          { id: 'client', label: 'Browser search box', kind: 'client',
            detail: { why: 'Does the cheap work first: **debounce** (wait about 100 to 200 ms after the last keystroke), cancel stale in-flight requests, and reuse a cached response for a prefix already seen in this session.', tradeoffs: ['Debounce trades a little responsiveness for far fewer requests, often 3 to 5 times fewer.', 'A response for "ap" can pre-filter the list for "app" while the new request is in flight.'], alternatives: ['Prefetch the top suggestions for the empty box at page load'], scale: 'Without debouncing, every keystroke is a request and peak load multiplies.' } },
          { id: 'cdn', label: 'CDN edge cache', kind: 'cdn',
            detail: { why: 'Suggestion responses are small and identical for everyone who types the same prefix, so an edge cache answers most requests close to the user without reaching the origin.', tradeoffs: ['A short TTL (a few minutes) keeps trends reasonably fresh; longer TTL means better hit rate and staler lists.', 'Personalized responses must bypass it (`Cache-Control: private`).', 'Short prefixes have a very high hit rate; long unusual ones rarely hit.'], alternatives: ['Origin-only with a Redis cache (more load on origin)', 'Browser cache only'], scale: 'Hit rate collapses for long, rare prefixes, which is fine because those reach the origin at low volume.' } },
          { id: 'search', label: 'Search service', kind: 'service',
            detail: { why: 'Handles submitted searches (the results page). It also emits a small log event for each completed query, which is the raw input to ranking.', tradeoffs: ['Logging is fire-and-forget; a logging outage must never break search.', 'Log only submitted queries, so "h", "ho", "how" are not counted as separate demand.'], scale: 'Event volume is about 3,000 a second here, small for a log pipeline.' } },
          { id: 'lb', label: 'Load balancer', kind: 'lb',
            detail: { why: 'Distributes CDN misses across suggestion servers and removes unhealthy ones.', tradeoffs: ['Can route by prefix range if the index is sharded.', 'Needs a short health-check interval: suggestion servers are stateless in logic but warm in memory.'], alternatives: ['Client-side or DNS-based routing'], scale: 'Not the limit at 50K peak requests a second.' } },
          { id: 'svc', label: 'Suggestion servers', kind: 'service',
            detail: { why: 'Stateless request handlers: normalize the prefix, check Redis, read the in-memory index, merge in the trending overlay, drop blocked phrases, and return ten strings. All in memory, so a few milliseconds per request.', tradeoffs: ['Holding the index in process memory gives flat latency but needs a warm-up when a server starts or swaps snapshots.', 'Swap snapshots atomically (build the new index, then switch a pointer) so a request never sees half of each.'], alternatives: ['Calling a remote index service per request (extra hop)', 'Serverless (cold start and no warm in-memory index)'], scale: 'About 5,000 requests a second per server, so roughly 20 servers at peak. Memory (20 GB per server) is the sizing limit, not CPU.' } },
          { id: 'cache', label: 'Redis cache', kind: 'cache',
            detail: { why: 'Shared hot-prefix cache in front of the index for personalized merges and for responses that cannot sit at the CDN. Key is the normalized prefix plus locale.', tradeoffs: ['If the index is already in memory this layer is optional; keep it where assembling a response is expensive (personalization, many sources).', 'TTL of a few minutes; invalidate on blocklist changes.'], alternatives: ['In-process LRU only (no shared state)'], scale: 'Hot short prefixes concentrate on a few keys; replicate them or keep a local copy.' } },
          { id: 'index', label: 'Prefix index (top-k trie)', kind: 'search',
            detail: { why: 'The core data structure: a compact trie where each node holds its precomputed top 10 phrases. A lookup is a walk of at most about 30 nodes, with no scoring at query time.', tradeoffs: ['About 20 GB for 200M nodes (approximate); compress by merging single-child chains and storing phrase IDs.', 'Read-only at serving time, which makes it safe to share across threads without locks.', 'Rebuilt from scratch each cycle instead of mutated in place.'], alternatives: ['Prefix-to-list table in a key-value store', 'FST or n-gram index in a search engine'], scale: 'Memory per replica as phrase count grows; shard by weighted prefix range past one node.' } },
          { id: 'trending', label: 'Trending overlay', kind: 'cache',
            detail: { why: 'A tiny store of phrases whose search rate in the last few minutes is far above normal. The suggestion server merges them in at query time, giving minute-level freshness without touching the base index.', tradeoffs: ['Only a few thousand entries, so it fits in each server\'s memory and refreshes every minute.', 'Needs a rule for ranking an overlay phrase against base phrases (for example insert if its score beats the tenth base item).', 'Entries expire quickly so a one-off spike does not linger.'], alternatives: ['No overlay: accept batch freshness', 'Update the live trie in place (harder concurrency)'], scale: 'Spam can try to game it with coordinated searches; require many distinct users before promoting a phrase.' } },
          { id: 'queue', label: 'Search event log', kind: 'queue',
            detail: { why: 'A durable, partitioned log of submitted searches. It decouples search from analytics: the batch and streaming jobs consume from it at their own pace.', tradeoffs: ['At-least-once delivery can double-count a few events; negligible for popularity but dedupe by event ID if counts matter.', 'Retention of days lets you reprocess after a bug in the aggregator.'], alternatives: ['Kafka or Kinesis', 'Writing events to object storage in batches'], scale: 'Easy at 3K events a second; partitions are not the limit.' } },
          { id: 'agg', label: 'Aggregator jobs', kind: 'service',
            detail: { why: 'Two jobs read the log. A **batch** job counts phrases over a sliding window with time decay, removes blocked and bot-heavy phrases, and outputs `phrase_stats`. A **streaming** job watches the last few minutes and emits the trending overlay.', tradeoffs: ['Decay (for example halving weight every few days) lets recent behaviour dominate without discarding history.', 'Unique-user counts blunt a single bot repeating a query thousands of times.'], alternatives: ['A single streaming job doing everything (more complex, harder to reproduce)'], scale: 'The batch job scans the day\'s log (about 250M events); fine for a modest cluster in minutes.' } },
          { id: 'builder', label: 'Index builder', kind: 'service',
            detail: { why: 'Turns `phrase_stats` into a new trie with top-k lists, validates it (sanity checks on size and sample queries), and publishes it as a versioned snapshot that servers load and swap in.', tradeoffs: ['Validation protects against a bad build (empty or wildly smaller index) reaching production; keep the previous snapshot for instant rollback.', 'Building a fresh snapshot is simpler and safer than updating nodes in place.'], alternatives: ['Incremental updates to the live index'], scale: 'Build time grows with phrase count; shard the build by prefix range when it passes an hour.' } }
        ],
        edges: [
          { from: 'client', to: 'cdn', label: 'GET prefix' },
          { from: 'client', to: 'search', label: 'submit' },
          { from: 'cdn', to: 'lb', label: 'on miss' },
          { from: 'lb', to: 'svc' },
          { from: 'svc', to: 'cache', label: 'get / set' },
          { from: 'svc', to: 'index', label: 'lookup' },
          { from: 'svc', to: 'trending', label: 'merge' },
          { from: 'search', to: 'queue', label: 'log', style: 'async' },
          { from: 'queue', to: 'agg', style: 'async' },
          { from: 'agg', to: 'builder', label: 'phrase stats' },
          { from: 'agg', to: 'trending', label: 'hot terms', style: 'async' },
          { from: 'builder', to: 'index', label: 'new snapshot' }
        ],
        scenarios: [
          { id: 'read', label: 'Read path: one keystroke', steps: [
            { title: 'User pauses typing', path: ['client', 'cdn'], note: 'After a short debounce the browser requests `/v1/suggest?q=how to c`. If the edge already holds that normalized prefix, it answers immediately.' },
            { title: 'Edge miss', path: ['cdn', 'lb', 'svc'], tone: 'hard', note: 'A prefix the edge has not seen reaches a suggestion server through the balancer. Long, rare prefixes mostly end up here.' },
            { title: 'Look in the cache', path: ['svc', 'cache'], note: 'Check Redis for the normalized prefix. A hit returns the finished list, with the blocklist already applied.' },
            { title: 'Read the index', path: ['svc', 'index'], tone: 'ok', note: 'On a miss, walk the trie: one step per character, then read the node\'s precomputed top 10. No sorting and no scan.' },
            { title: 'Merge trends', path: ['svc', 'trending'], note: 'Check the small overlay for surging phrases that start with this prefix and insert any that beat the tenth result. The response is cached with a short TTL.' }
          ] },
          { id: 'build', label: 'Index refresh', steps: [
            { title: 'Searches are logged', path: ['client', 'search', 'queue'], note: 'When the user submits a search, the search service appends a small event to the log without waiting. Prefixes typed on the way are not logged.' },
            { title: 'Aggregate', path: ['queue', 'agg'], note: 'The hourly batch job counts phrases with time decay, drops blocked and bot-heavy ones, and writes `phrase_stats`.' },
            { title: 'Build snapshot', path: ['agg', 'builder'], note: 'The builder constructs a trie with top-10 per node and validates it against the previous version (size and sample queries).' },
            { title: 'Publish', path: ['builder', 'index'], tone: 'ok', note: 'Servers load the new snapshot in the background and swap a pointer atomically. If validation had failed, the old snapshot would stay live.' }
          ] },
          { id: 'trend', label: 'Breaking trend', steps: [
            { title: 'Searches surge', path: ['client', 'search', 'queue'], tone: 'hard', note: 'Thousands of people search a new phrase within minutes. The batch index will not know it for up to an hour.' },
            { title: 'Streaming job notices', path: ['queue', 'agg'], note: 'The streaming job compares the last few minutes with the baseline and finds the phrase far above normal, from many distinct users.' },
            { title: 'Publish to overlay', path: ['agg', 'trending'], tone: 'ok', note: 'The phrase is written to the small trending overlay, which servers refresh every minute.' },
            { title: 'Served on the next request', path: ['svc', 'trending'], tone: 'accent', note: 'The suggestion server merges it into results for matching prefixes. The CDN TTL (a few minutes) is the remaining delay.' }
          ] }
        ]
      },
      walkthrough: [
        '**Read**: debounce in the browser, edge cache by normalized prefix, then a suggestion server that reads Redis or walks the in-memory trie and merges the trending overlay. Return ten strings.',
        '**Write**: log each submitted search asynchronously. An hourly batch job aggregates with time decay and filters; the builder makes a new validated snapshot; servers swap it atomically.',
        '**Freshness**: base index within an hour, a small streaming overlay within minutes, and the CDN TTL as the last delay.',
        '**Failure modes**: a bad snapshot is rejected by validation and the old one stays; a CDN or cache failure raises origin load but never changes answers; if the whole service is down the search box still works with no suggestions.'
      ],
      notes: ['Personalization, if added, happens last: take the global top list, blend the user\'s recent searches, and mark the response `private` so it skips the CDN.']
    },

    deepDives: [
      { id: 'trie', title: 'Trie versus a prefix index, and why store top-k',
        question: 'How do you find the best 10 completions for a prefix in a few milliseconds?',
        answer: 'A **trie** has one node per prefix. To answer a query you walk one node per typed character, so the cost is `O(length of prefix)`, independent of how many phrases exist.\n\nThe catch is what happens at the end of the walk. If you only mark where phrases end, you must scan the whole subtree to find the best 10, which is huge for the prefix "a". So store the **top 10 on every node**, precomputed. Now the lookup returns a stored list: no scan, no sort, flat latency.\n\nThe price is memory and build time. Each node carries a list of 10 phrase IDs (about 40 bytes), and one phrase appears in the list of every node along its path, up to about 25. Reduce it: **prune** rare phrases and prefixes beyond about 30 characters, **merge single-child chains** into one edge (a radix tree), and store phrase **IDs** instead of strings. At 50 million phrases that lands near 20 GB (approximate), which fits in memory.\n\nA flat **prefix to list table** in a key-value store is the same idea without a tree: simpler to operate and shard, a little larger. A search-engine suggester (an FST) handles prefix and fuzzy matching in one structure, at a heavier per-query cost.',
        followups: [
          { q: 'Why not scan the subtree and sort at query time?', a: 'Latency would depend on the prefix: the single letter "a" would touch millions of phrases while "xylophone" touches a handful. The short, common prefixes are exactly the busiest, so the worst case would land on most of the traffic. Precomputing removes the variance.' },
          { q: 'What does it cost to change one phrase\'s score?', a: 'Up to about 25 nodes on its path may need their top-10 recomputed, and some lists may gain or lose it. That is why updates are batched into a rebuild, not applied one at a time.' },
          { q: 'How do you handle phrases with several words?', a: 'Index the whole phrase so "how to c" matches "how to cook rice". For mid-phrase matching ("cook rice" finding "how to cook rice"), also index suffixes starting at word boundaries, and mark them lower priority. Say that this multiplies index size.' }
        ] },
      { id: 'freshness', title: 'Offline aggregation versus online updates',
        question: 'A news story breaks and everyone searches for it. How fast does it appear in the suggestions, and how do you design for that?',
        answer: 'Start with the **batch pipeline**: search events go to a log; an hourly job counts phrases with **time decay** (weight halves every few days, so recent behaviour dominates), filters blocked and bot-heavy phrases, and builds a new index snapshot. It is simple, reproducible and easy to validate and roll back. Its weakness is delay: a surge can take up to an hour to appear.\n\nTo get **minutes**, add a **streaming path** that only tracks what is surging: compare each phrase\'s rate over the last few minutes to its baseline, require many **distinct users** (so one bot cannot fake a trend), and publish the survivors to a small trending overlay. Servers merge overlay entries into results at query time.\n\nWhy not update the live trie directly? Each phrase touches up to about 25 nodes, writers would contend with readers on a structure designed to be read-only, and a bug corrupts live data. The overlay keeps the big index immutable and the fast path tiny.\n\nThe CDN TTL is then the last delay, so choose a short TTL (a few minutes) for the generic response.',
        followups: [
          { q: 'How do you rank an overlay phrase against base phrases?', a: 'Give each a comparable score. A simple rule: insert the overlay phrase if its recent-rate-based score exceeds the tenth base score, and expire it when the rate falls. Tune with measured click-through.' },
          { q: 'How does time decay work?', a: 'Keep `score = score x 0.5^(elapsed / half-life) + new events`, updated in batch. A half-life of a few days means last week counts a fraction of today. Shorter half-lives chase trends; longer ones favour stable classics.' },
          { q: 'What if the batch build is delayed or fails?', a: 'Serving keeps the last good snapshot, so users see stale but valid suggestions. Alert on snapshot age, and keep the previous versions for rollback.' }
        ] },
      { id: 'caching', title: 'Caching at the browser and the CDN',
        question: 'Where do you cache, and what are the traps?',
        answer: 'Cache at every layer, because the same short prefixes repeat enormously.\n\n- **Browser**: debounce and cancel stale requests; remember responses for prefixes already typed (and use the response for "ap" to pre-filter while "app" loads); set `Cache-Control: public, max-age=300` so repeat lookups never leave the machine.\n- **CDN**: key on the **normalized** prefix (lowercase, trimmed, same language), strip tracking parameters, and keep the URL small. Popular short prefixes will have hit rates well above 90% (an assumption to measure). Personalized responses use `private`.\n- **Server**: Redis or an in-process LRU for expensive-to-assemble responses.\n\nThe traps: a long TTL serves stale trends and stale blocked content. A cache key that includes user ID defeats sharing. And **a cache miss on every long, rare prefix is expected**: size the origin for that tail instead of expecting the CDN to absorb it.',
        followups: [
          { q: 'How do you remove a blocked phrase immediately?', a: 'Apply the blocklist on the server at serve time as a filter, purge or version-bump the CDN keys that contain it, and drop it in the next build. The serve-time filter is the fast path.' },
          { q: 'Why not cache every keystroke at the edge?', a: 'You do, but the browser has already cut requests with debouncing. The remaining requests are the ones that matter, and edge caches turn most of them into local reads.' },
          { q: 'What cache hit rate would you expect and how do you know?', a: 'State it as a hypothesis: very high for 1 to 3 character prefixes, falling steeply with length. Measure hit rate per prefix length and size the origin from the measured miss traffic, not the guess.' }
        ] },
      { id: 'sharding', title: 'Sharding the index by prefix',
        question: 'The index no longer fits on one machine. How do you split it?',
        answer: 'First, check whether you need to. 20 GB fits in memory, so **replicate the whole index** on every suggestion server: no routing, perfect read scaling, and any server can serve any prefix. Spend the effort on caching.\n\nWhen it truly outgrows a machine, shard by **prefix range**: a request for "how to c" always goes to the shard owning "ho". This keeps all keystrokes of one typing session on the same shard, and builds are local to a range.\n\nThe problem is **skew**: far more queries begin with "s" or "a" than with "x" or "q". Fix with weighted ranges built from the query distribution: split "s" into "sa..sh", "si..sz", and so on, rebalanced by measured traffic at each build. Add replicas per shard for throughput.\n\n**Hash of the prefix** gives even load but scatters one user\'s keystrokes across shards and loses locality, so it is the second choice.',
        followups: [
          { q: 'How do you rebalance shards?', a: 'The builder already scans all phrases and their weights, so it can pick new range boundaries each build. Publish the shard map with the snapshot and swap both atomically so a router never uses an old map with a new index.' },
          { q: 'What if one shard is much hotter than the rest?', a: 'Add replicas to that shard, split its range, and rely on the cache for the shortest prefixes, since those are the hottest and the most cacheable.' }
        ] },
      { id: 'ranking', title: 'Ranking, freshness and personalization',
        question: 'How do you decide which 10 appear, and how would you personalize?',
        answer: 'The base score is **decayed popularity**: searches weighted by recency. Improve it with signals that resist manipulation and reflect quality: number of **unique users** (not raw counts), click-through on past suggestions, and a language and region filter. Remove blocked, adult-by-default and low-quality phrases at build time, and again at serve time.\n\nTwo cheap quality rules: **deduplicate near-identical phrases** ("iphone 15" and "iphone  15") by normalizing, and prefer one canonical form.\n\nPersonalization is an **optional re-rank on top** of the global list: fetch the user\'s recent searches (a small per-user list, held in a fast store), boost matching global candidates, and add the user\'s own matching history ahead of them. The cost: the response is now per-user, so it cannot be cached publicly. Keep the global list cached and do the blend in the server for signed-in users only.',
        followups: [
          { q: 'How do you protect users\' privacy?', a: 'Keep history per user with an expiry, hash identifiers in the log, let users clear their history, and keep personalized responses `private`. Never put one user\'s phrases into the shared index unless they cross a threshold of many distinct users.' },
          { q: 'How do you measure whether ranking is good?', a: 'Offline: compare against logged chosen suggestions (was the eventual query in the top 10?). Online: A/B test on suggestion acceptance rate and keystrokes saved per search.' }
        ] },
      { id: 'typo', title: 'Stretch: typo tolerance',
        question: 'The user types "recipie for". The exact prefix matches nothing. What do you do?',
        answer: 'Treat it as a **fallback tier** so the common case stays fast: serve the exact-prefix answer; only when it returns too few results, try a fuzzy lookup.\n\nOptions for the fuzzy tier: an **edit-distance search** over the phrase dictionary (a Levenshtein automaton intersected with an FST, or a BK-tree) limited to distance 1 or 2; an **n-gram index**, where "recipie" is split into short overlapping pieces and candidates sharing many pieces are re-ranked by edit distance; or a **query rewrite table** learned from the log ("recipie" is usually followed by a submitted "recipe"), which is cheap and often best.\n\nBound the cost: limit fuzzy matching to prefixes longer than about 3 characters (short prefixes explode), cap the candidates, and cache results. Rank exact matches above fuzzy ones.',
        followups: [
          { q: 'Why not run fuzzy matching on every request?', a: 'It is far heavier than a precomputed list lookup and short prefixes match huge numbers of near neighbours. Reserve it for the case where the exact tier has nothing good to show.' },
          { q: 'How do you learn corrections from data?', a: 'From the log: when a user submits a phrase, then quickly submits a close variant and clicks results, count that pair. Frequent pairs become rewrite entries with a confidence score.' }
        ] },
      { id: 'abuse', title: 'Keeping the data honest: bots, spam and bad suggestions',
        question: 'People can game popularity, and some phrases must never be suggested. How do you handle both?',
        answer: 'The input is user behaviour, so treat it as untrusted. A script that searches a phrase a million times should not make it a suggestion. Count **distinct users or devices** per phrase, cap each user\'s contribution per day, and drop traffic flagged as automated.\n\nFor content safety, use layers: a **blocklist and classifier** at build time, a **serve-time filter** so a new block takes effect without waiting for a build, and a fast **kill switch** with CDN purge for emergencies. Review the top phrases for new entries, especially anything surging in the trending overlay.\n\nFinally, include sensitive-query rules: for some categories suggest nothing rather than the most popular completion, because a popular completion can still be harmful.',
        followups: [
          { q: 'Why filter again at serve time if the build already filtered?', a: 'Builds are hourly and a harmful phrase can appear between them. A serve-time filter against a small, fast-updating blocklist closes that window.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Memory per replica as the phrase set grows', problem: 'The in-memory index grows with distinct phrases and with the length of each phrase (every prefix node stores a list).', mitigation: 'Prune rare phrases and long prefixes, compress chains, store phrase IDs, and move to weighted prefix-range shards when one machine cannot hold it.' },
      { title: 'Skewed prefix distribution', problem: 'A few prefixes ("s", "a", "the") see a huge share of traffic and long-tail prefixes see very little. Shards by alphabet range are uneven.', mitigation: 'Cache short prefixes at the browser and CDN, use weighted ranges from measured traffic, and replicate hot shards.' },
      { title: 'Freshness versus cost', problem: 'Rebuilding hourly costs compute and still leaves a delay, while streaming updates complicate a read-optimized structure.', mitigation: 'Batch base index plus a tiny streaming overlay for trends, with a short CDN TTL for the generic response.' },
      { title: 'Snapshot swaps', problem: 'Loading a new index means a transient 2x memory cost and a risk of serving a half-loaded structure.', mitigation: 'Load in the background, validate, swap one pointer atomically, then release the old index; stagger swaps so not all replicas reload at once.' },
      { title: 'Tail latency from cache misses', problem: 'Long, rare prefixes always miss the edge cache and reach the origin, where a slow node adds latency users feel on every keystroke.', mitigation: 'Hedge or retry once on a slow replica, keep the origin lookup in memory, and let the client treat a slow response as "no suggestions" rather than blocking typing.' },
      { title: 'Log poisoning', problem: 'Because ranking comes from user behaviour, coordinated searches can promote spam or harmful phrases.', mitigation: 'Count distinct users, cap per-user influence, require a threshold before promotion, and keep serve-time blocklists and review of the top and trending phrases.' }
    ],

    mistakes: [
      'Walking the **subtree at query time** and not noticing it is slowest for the shortest, busiest prefixes.',
      'Logging **every keystroke prefix** as a search, which counts "h", "ho" and "how" as separate demand and skews popularity.',
      'Sending a request on **every keystroke** with no debounce or cancellation.',
      'Ignoring **time decay**, so last year\'s hit outranks today\'s news forever.',
      'Updating the **live trie in place** with concurrent writers instead of building an immutable snapshot and swapping it.',
      'Putting **user IDs in the cache key**, destroying the shared cache, or caching personalized responses publicly.',
      'Sharding by the first letter with **no thought for skew**.',
      'Treating raw counts as truth and **forgetting bots** and spam in the query log.',
      'Returning **404 or an error** for an empty suggestion list, which breaks the box and poisons CDN caches.',
      'Forgetting the **blocklist at serve time** and relying on the next build.'
    ],

    pushes: [
      { q: 'Why store top-k at every trie node instead of computing it when asked?', why: 'It is the central trade of the design and shows whether you think about the busiest queries.', good: 'Short prefixes are the most common and have the largest subtrees, so query-time scans are worst exactly where traffic is highest. Precompute, pay memory (about 20 GB) and build time offline, and get flat latency.' },
      { q: 'How would a trending topic show up within minutes?', why: 'They want to see you separate the stable index from the fast signal.', good: 'A streaming job over the last few minutes, distinct-user thresholds, a small overlay merged at query time, and the CDN TTL as the remaining delay. Do not mutate the big index.' },
      { q: 'What do you cache and how long?', why: 'Caching is the main lever, and the TTL is a freshness decision.', good: 'Browser, CDN, then server. Key on the normalized prefix. A few minutes TTL for the generic list, private and uncached for personalized. Expect high hit rates on short prefixes and misses on the tail.' },
      { q: 'How would you shard this index?', why: 'Tests whether you size before splitting and recognize skew.', good: 'Say 20 GB fits one machine, so replicate first. Then weighted prefix ranges rebalanced at each build, with replicas for hot shards; hash sharding loses typing locality.' },
      { q: 'How do you keep offensive or manipulated suggestions out?', why: 'Behaviour-derived data is untrusted.', good: 'Distinct-user counts, per-user caps, build-time and serve-time filters, a kill switch with purge, and review of trending phrases.' },
      { q: 'How would you add personalization without losing the cache?', why: 'Personalization conflicts with shared caching.', good: 'Cache the global list publicly and blend a small per-user history list in the server for signed-in users, with a private response. Mention privacy and expiry of history.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why does a typeahead trie store the top 10 phrases on every node?', choices: ['So a lookup returns a stored list without scanning the subtree', 'To save memory', 'So the trie can be updated in place cheaply', 'Because phrases cannot be sorted at query time'], answer: 0, explain: 'Without it, a short prefix such as "a" needs a scan of a huge subtree. Precomputing spends memory and build time to make lookup O(prefix length).' },
      { kind: 'complexity', q: 'What is the lookup cost of a trie with top-k on each node, for a prefix of length L?', choices: ['O(L)', 'O(number of phrases)', 'O(L x log n)', 'O(n)'], answer: 0, explain: 'Walk L nodes, then return the stored list. It does not depend on how many phrases exist.' },
      { kind: 'concept', q: 'Which event should be logged as the source of popularity counts?', choices: ['Submitted searches', 'Every keystroke prefix', 'Every suggestion response', 'Only clicks on the first suggestion'], answer: 0, explain: 'Logging prefixes counts "h", "ho", "how" as separate demand. Submitted searches reflect what people actually wanted.' },
      { kind: 'concept', q: 'What is the best way to give a breaking trend minute-level freshness?', choices: ['A small streaming overlay merged at query time, on top of a batch index', 'Rebuild the whole index every minute', 'Update the live trie in place from each event', 'Lower the CDN TTL to zero'], answer: 0, explain: 'The overlay is tiny and fast to change, so the large index stays immutable. Rebuilding every minute is wasteful and in-place updates add concurrency risk.' },
      { kind: 'concept', q: 'Pick every sensible measure to reduce suggestion requests per search.', choices: ['Debounce keystrokes', 'Cancel stale in-flight requests', 'Reuse a cached response for a prefix already typed', 'Send a request only after the user presses Enter'], answer: [0, 1, 2], explain: 'Waiting for Enter removes the feature. The other three keep suggestions responsive while cutting requests several times.' },
      { kind: 'concept', q: 'Why is sharding the index by the first letter alone risky?', choices: ['Query volume is highly skewed across letters', 'Letters cannot be hashed', 'It prevents caching', 'It breaks the trie structure'], answer: 0, explain: 'Many more queries start with some letters than others, so shards become uneven. Use ranges weighted by measured traffic.' },
      { kind: 'concept', q: 'A personalized suggestion response should be sent with which caching policy?', choices: ['Cache-Control: private', 'Cache-Control: public, max-age=3600', 'No header, so the CDN decides', 'A cache key that includes the user ID at the CDN'], answer: 0, explain: 'A shared cache must not serve one user\'s history to another. Keep the global list public and blend history on the server.' }
    ],

    flashcards: [
      { id: 'topk-node', front: 'Why precompute top-k at each trie node?', back: 'Lookup becomes O(prefix length): walk the nodes and return the stored list. Without it a short prefix needs a huge subtree scan. Cost: memory and offline build time.' },
      { id: 'debounce', front: 'How do you cut suggestion requests at the client?', back: 'Debounce (wait ~100-200 ms after the last keystroke), cancel stale in-flight requests, and reuse cached responses for prefixes already typed. Often 3-5x fewer requests.' },
      { id: 'batch-overlay', front: 'How to be both stable and fresh?', back: 'Hourly batch builds the base index (time-decayed counts, validated, atomic swap). A streaming job adds a small trending overlay merged at query time. CDN TTL is the final delay.' },
      { id: 'log-what', front: 'What should the search log contain for ranking?', back: 'Submitted searches only, not keystroke prefixes. Count distinct users and cap per-user influence to resist bots.' },
      { id: 'shard-prefix', front: 'How to shard a typeahead index?', back: 'First replicate (about 20 GB fits one machine). Then shard by weighted prefix ranges rebalanced each build, with replicas on hot shards. Hash sharding scatters one typing session.' },
      { id: 'cache-key', front: 'Typeahead cache key and policy?', back: 'Normalized prefix plus locale, public with a few minutes TTL for the generic list. Personalized responses are private. Expect high hit rates for short prefixes and misses for the long tail.' },
      { id: 'typo-tier', front: 'How to add typo tolerance cheaply?', back: 'As a fallback tier only when exact matches are few: edit-distance via FST or BK-tree, an n-gram index, or a learned rewrite table. Limit it to longer prefixes and cache results.' }
    ]
  });
})();
