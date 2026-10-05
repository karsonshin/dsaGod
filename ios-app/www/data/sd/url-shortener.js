/* System design case study: URL shortener. This is the gold-standard example: copy its shape for new cases
   (schema in data/sd/schema.md and README.md, "System design content schema"). */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'url-shortener',
    title: 'Design a URL shortener',
    short: 'Turn long links into short codes and redirect fast. A small problem with real depth in ID generation, caching and hot keys.',
    difficulty: 'Easy',
    time: '45 min',
    tags: ['ID generation', 'Caching', 'Key-value store', 'Read-heavy'],
    prompt: 'Design a service like bit.ly. Users paste a long URL and get a short one; anyone who opens the short URL is redirected to the original.',

    requirements: {
      functional: [
        'Create a short URL from a long URL.',
        'Redirect a short URL to its long URL.',
        'Optional custom alias chosen by the user (for example `/summer-sale`).',
        'Optional expiry time; expired links stop redirecting.',
        'Basic click counts per link.'
      ],
      nonFunctional: [
        '**Availability** matters most on the redirect path: a dead link breaks someone else\'s page. Aim for 99.99%.',
        '**Latency**: redirects feel instant, under 100 ms at the server for the 99th percentile.',
        '**Durability**: a mapping must never be lost once the short URL is handed out.',
        'Codes are **unique** and not trivially guessable or enumerable.',
        'Scale: about 100 million new URLs a month and 100 redirects for every creation.'
      ],
      outOfScope: ['User accounts, billing and a link-management dashboard.', 'Rich analytics (geography, devices, funnels).', 'Spam and phishing detection beyond a basic blocklist hook.', 'Editing the destination after creation.'],
      clarify: [
        { q: 'Can the same long URL map to one short URL, or does every request create a new one?', a: 'Treat each request as a new link by default. De-duplicating by long URL needs a second index and breaks per-user expiry and analytics, so it is a product choice to raise, not to assume.' },
        { q: 'How long should short URLs live?', a: 'Default to forever unless the creator sets an expiry. That drives the five-year storage estimate.' },
        { q: 'Is 301 or 302 acceptable for the redirect?', a: 'It changes whether you can count clicks. A permanent 301 is cached by browsers, so repeat clicks never reach you. See the deep dive.' }
      ]
    },

    estimates: {
      intro: 'Anchor on the stated scale: 100 million new URLs a month is about 3.3 million a day. Pick a user model that produces it: 33 million daily active users, one in ten of whom creates a link, each making ten redirect clicks.',
      inputs: { dau: 33e6, writesPerUser: 0.1, readsPerUser: 10, peakFactor: 3, bytesPerWrite: 500, bytesPerRead: 500, years: 5, replication: 3, hotFraction: 0.2, serverQps: 2000, utilization: 0.6 },
      assumptions: ['**500 bytes per record** covers the 7-character code, a long URL averaging a couple of hundred characters, timestamps, owner and flags.', 'Peak is **3 times** average because links go viral in bursts.', 'One server does **2,000 redirects a second** when it is mostly a cache lookup and a small response.'],
      extra: [
        { label: 'Links created in 5 years', formula: '3.3M/day x 365 x 5', result: '~6 billion' },
        { label: 'Key space, 6 base62 chars', formula: '62^6', result: '~56.8 billion' },
        { label: 'Key space, 7 base62 chars', formula: '62^7', result: '~3.5 trillion' },
        { label: 'Share of 7-char space used after 5 years', formula: '6.0B / 3.5T', result: '~0.17%' }
      ],
      notes: [
        'Writes are a trickle (about 40 a second) and reads are about 4,000 a second on average. **This is a read-heavy system**, so cache the read path and keep writes simple.',
        'Roughly 3 TB of raw data in five years (9 TB replicated) is large for one node but small for a sharded key-value store. Storage is not the hard part.',
        'Seven characters is enough: the 5-year volume fills under 1% of the space, which keeps random or hash-based codes from colliding often.',
        'A cache of the hottest 20% of a day\'s reads is about 33 GB, which fits across a small Redis cluster.'
      ]
    },

    api: [
      { method: 'POST', path: '/v1/urls', desc: 'Create a short URL.',
        request: '{\n  "longUrl": "https://example.com/some/very/long/path?x=1",\n  "customAlias": "summer-sale",\n  "expiresAt": "2027-01-01T00:00:00Z"\n}',
        response: '{\n  "code": "aZ3kP9x",\n  "shortUrl": "https://sho.rt/aZ3kP9x",\n  "expiresAt": "2027-01-01T00:00:00Z"\n}',
        notes: ['`customAlias` and `expiresAt` are optional. Return **409** when the alias is taken and **400** for an invalid URL (scheme must be http or https).', 'Accept an `Idempotency-Key` header so a retry after a timeout returns the same code instead of creating a second link.'] },
      { method: 'GET', path: '/{code}', desc: 'Redirect to the long URL.',
        response: 'HTTP/1.1 302 Found\nLocation: https://example.com/some/very/long/path?x=1',
        notes: ['**404** for an unknown code and **410 Gone** for an expired one.', 'This is the hot path: no auth, no body, and nothing slower than a cache lookup in the common case.'] },
      { method: 'DELETE', path: '/v1/urls/{code}', desc: 'Remove a link you own. Needs auth.', notes: ['Delete must also **invalidate the cache** entry, or the link keeps working until its TTL expires.'] },
      { method: 'GET', path: '/v1/urls/{code}/stats', desc: 'Click count for a link you own.', response: '{ "code": "aZ3kP9x", "clicks": 18204 }', notes: ['Reads from the analytics store, not the URL store, and is allowed to lag by seconds.'] }
    ],
    apiNotes: ['Put creation behind a **rate limit** per API key and IP. Redirects stay unauthenticated.', 'Return the short URL built from a configured domain, never from the request\'s `Host` header.'],
    data: {
      intro: 'The core is one mapping from code to long URL, read by key and almost never updated. There are no joins on the hot path, which is why a key-value store fits well.',
      entities: [
        { name: 'url', purpose: 'One row per short link. Primary access pattern: look up by `code`.', fields: [
          ['code', 'string(7), primary key', 'The short code, base62. Custom aliases live in the same column.'],
          ['long_url', 'string(2048)', 'Original URL.'],
          ['created_at', 'timestamp', ''],
          ['expires_at', 'timestamp, nullable', 'Null means never. Checked on read.'],
          ['owner_id', 'bigint, nullable', 'Needed for delete and per-user listing; indexed only if listing is a feature.']
        ] },
        { name: 'click_event (analytics store)', purpose: 'Append-only. Kept out of the URL store so click volume never competes with redirects.', fields: [
          ['code', 'string(7)', 'Partition key.'], ['ts', 'timestamp', ''], ['referrer, user_agent, country', 'string', 'Optional, coarse.']
        ] }
      ],
      storage: [
        { title: 'SQL (PostgreSQL or MySQL)', verdict: 'Fine to start',
          body: 'Simple, transactional, and a primary key lookup is fast. Uniqueness of `code` is enforced by the database for free, which makes custom aliases easy.\n\n```\nCREATE TABLE url (\n  code        VARCHAR(7)  PRIMARY KEY,\n  long_url    TEXT        NOT NULL,\n  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),\n  expires_at  TIMESTAMPTZ,\n  owner_id    BIGINT\n);\nCREATE INDEX url_owner_idx ON url (owner_id) WHERE owner_id IS NOT NULL;\n```\n\nAt this size a single primary handles the writes (about 40 a second), and read replicas plus a cache handle the reads. The cost: **sharding by hand** once you pass a few terabytes, and no built-in multi-region writes.' },
        { title: 'NoSQL key-value or wide-column (DynamoDB, Cassandra)', verdict: 'Pick for scale',
          body: 'The access pattern is a pure key lookup with no joins and no multi-row transactions, which is the sweet spot. Partitioning by `code` spreads load evenly (codes are effectively random), replication and multi-region come built in, and you never reshard by hand.\n\nThe cost: uniqueness for custom aliases needs a **conditional write** (`PutItem` with `attribute_not_exists(code)` in DynamoDB, a lightweight transaction in Cassandra), listing by owner needs a secondary index, and you give up ad-hoc queries.' }
      ],
      decisions: [
        { title: 'How to generate the short code', question: 'The code must be unique, short, and cheap to produce at about 40 writes a second now and far more later. Four common options:',
          options: [
            { name: 'Counter + base62', pros: 'No collisions by construction. Shortest codes. Trivial to implement: encode the integer.', cons: 'Needs one coordinated counter (a single point of failure and a write bottleneck). Sequential codes are **guessable**, so people can enumerate every link.' },
            { name: 'Hash the long URL (MD5 or SHA-256, reduced to 7 base62 chars)', pros: 'Stateless. Same URL gives the same code, so it de-duplicates for free.', cons: 'Truncation **collides**: at 6 billion links about 1 insert in 600 hits an existing code. You must check and retry with a salt, and every create becomes read-then-write.' },
            { name: 'Random 7 chars + uniqueness check', pros: 'No coordination. Unguessable. Collision odds are tiny at 0.17% fill and a conditional insert resolves them.', cons: 'A retry loop on the write path. Collision rate rises as the space fills.' },
            { name: 'Snowflake-style 64-bit ID (time + machine + sequence), then base62', pros: 'Coordination-free, time-ordered, scales to thousands of IDs a second per machine.', cons: '64 bits is **11 base62 characters**, too long for a short link. Needs clock discipline. Only worth it if codes may be longer.' }
          ],
          pick: '**Counter ranges + a bijective scramble.** Each app server leases a block of, say, 1,000 IDs from a small allocator service, hands them out locally with no network call, and base62-encodes the number after passing it through a reversible permutation so codes are not sequential. If the allocator is down, servers keep working until their block runs out. Random-plus-conditional-insert is the simpler fallback and also a good answer.' },
        { title: 'Redirect status: 301 or 302', question: 'Both send the browser to the long URL.',
          options: [
            { name: '301 Moved Permanently', pros: 'Browsers and intermediaries cache it. Less load on you and faster repeat visits.', cons: 'Cached clicks never reach you, so counts are wrong. You cannot change or expire the link for those clients.' },
            { name: '302 Found (temporary)', pros: 'Every click hits your service, so analytics and expiry stay accurate.', cons: 'Higher load. Slightly slower repeat visits.' }
          ],
          pick: 'Default to **302** because clicks are the product and expiry must work. Offer 301 as an option for links the owner promises never to change.' }
      ]
    },
    design: {
      intro: 'Start with the smallest design that meets the numbers: stateless services behind a load balancer, a cache in front of a key-value store, and click counting moved off the redirect path. **Click any box** for the reasoning, or pick a request to trace.',
      diagram: {
        title: 'URL shortener high-level design',
        nodes: [
          { id: 'client', label: 'Browser or API client', kind: 'client',
            detail: { why: 'Creates links through the API and follows short links by plain HTTP GET. Browsers may cache a 301 redirect, which is why the status code is a product decision.', tradeoffs: ['You do not control clients: retries, bots and crawlers all hit the redirect path.'], scale: 'A viral link sends a sudden burst of identical GETs from many clients at once.' } },
          { id: 'lb', label: 'Load balancer', kind: 'lb',
            detail: { why: 'Spreads requests across stateless app servers, terminates TLS and removes unhealthy servers from rotation, so the redirect path survives a server loss.', tradeoffs: ['Layer 7 can route by path (create vs redirect) but costs more CPU than layer 4.', 'The balancer itself must be redundant or it becomes the single point of failure.'], alternatives: ['DNS round robin (no health checks)', 'Managed cloud load balancer'], scale: 'Connection limits and TLS handshakes per second, long before bandwidth.' } },
          { id: 'app', label: 'Shortener service', kind: 'service',
            detail: { why: 'Stateless servers that validate input, encode IDs, and run the cache-aside read path. Stateless means any server can serve any request and you scale by adding more.', tradeoffs: ['Create and redirect have very different load (40 vs 4,000 per second), so they can be deployed as two services scaled separately.'], alternatives: ['Serverless functions (cold starts hurt the redirect p99)'], scale: 'CPU is not the limit; the hot path is a cache lookup. The first failure is the database when the cache hit rate drops.' } },
          { id: 'cache', label: 'Redis cache', kind: 'cache',
            detail: { why: 'Reads are 100 times writes and follow a skewed distribution: a few links get most clicks. Cache-aside on `code -> long_url` serves the common case in about a millisecond and shields the database.', tradeoffs: ['Entries need a TTL no longer than the link\'s expiry, and delete must invalidate.', 'Stale data is acceptable here because mappings almost never change.', 'About 33 GB for the hottest fifth of a day, so a small cluster partitioned by consistent hashing.'], alternatives: ['Memcached (simpler, no persistence)', 'CDN edge cache for 301 links'], scale: 'A single viral key can overload one cache node. Keep a short-TTL in-process copy on each app server for the hottest keys.' } },
          { id: 'db', label: 'URL store (primary)', kind: 'db',
            detail: { why: 'The system of record: `code -> long_url`. A key-value access pattern, so partition by `code` and the data spreads evenly because codes are random-looking.', tradeoffs: ['SQL gives uniqueness and transactions for free but needs manual sharding past a few TB.', 'A key-value store scales out and replicates across regions but needs conditional writes for custom aliases.'], alternatives: ['DynamoDB', 'Cassandra', 'MySQL with sharding'], scale: 'Write volume is tiny; the first thing to break is read load on a cold or flushed cache, then total size past a single node (about 3 TB raw in 5 years).' } },
          { id: 'replica', label: 'URL store (replica)', kind: 'db',
            detail: { why: 'Serves cache misses so reads never touch the primary, and takes over if the primary fails.', tradeoffs: ['Asynchronous replication lags by milliseconds, so a link might 404 for a moment after creation if the redirect reads a lagging replica. Fix: read the primary on a miss for codes created in the last few seconds, or retry once.'], scale: 'Replication lag under write bursts.' } },
          { id: 'idgen', label: 'ID allocator', kind: 'service',
            detail: { why: 'Hands each app server a block of unused numbers (say 1,000). Servers encode them locally into 7-character codes without a network call per URL.', tradeoffs: ['If the allocator is down, servers keep working until their block runs out, so it is not on the hot path.', 'A crashed server wastes the unused part of its block. With 3.5 trillion codes that waste is irrelevant.', 'The allocator needs durable state, so run it as a small replicated store or a single row with compare-and-swap.'], alternatives: ['Random code plus conditional insert (no allocator at all)', 'Snowflake IDs'], scale: 'Allocator downtime longer than the time to burn a block.' } },
          { id: 'queue', label: 'Click events', kind: 'queue',
            detail: { why: 'Counting clicks must not slow or break a redirect. The service publishes a small event and returns; workers aggregate later.', tradeoffs: ['At-least-once delivery means counts can double-count after a retry; dedupe by event ID if exactness matters, or accept approximate counts.', 'If the queue is down, drop or buffer events locally rather than failing the redirect.'], alternatives: ['Kafka', 'Kinesis', 'Batching in memory and flushing every second'], scale: 'Volume is 4,000 events a second on average: easy for Kafka, so partitions are not the limit.' } },
          { id: 'worker', label: 'Analytics worker', kind: 'service',
            detail: { why: 'Consumes click events and writes aggregated counts, so the analytics store sees far fewer writes than there are clicks.', tradeoffs: ['Aggregating per code per minute cuts write volume by orders of magnitude but delays stats by a minute.'], scale: 'A viral code makes one partition hot; spread by code plus a random suffix and merge.' } },
          { id: 'olap', label: 'Analytics store', kind: 'db',
            detail: { why: 'Append-heavy, query-by-code counts. Kept separate so analytics scans never compete with the redirect lookups.', tradeoffs: ['Eventually consistent with the URL store, which is fine for a click counter.'], alternatives: ['ClickHouse or another column store', 'Time-series store', 'Counters in Redis for simple totals'], scale: 'Raw event retention; roll up and expire old detail.' } }
        ],
        edges: [
          { from: 'client', to: 'lb', label: 'HTTPS' },
          { from: 'lb', to: 'app' },
          { from: 'app', to: 'cache', label: 'get / set' },
          { from: 'app', to: 'replica', label: 'on miss' },
          { from: 'app', to: 'db', label: 'insert' },
          { from: 'app', to: 'idgen', label: 'ID block' },
          { from: 'db', to: 'replica', label: 'replicate', style: 'replication' },
          { from: 'app', to: 'queue', label: 'click', style: 'async' },
          { from: 'queue', to: 'worker', style: 'async' },
          { from: 'worker', to: 'olap' }
        ],
        scenarios: [
          { id: 'write', label: 'Write path: create', steps: [
            { title: 'Client submits', path: ['client', 'lb'], note: 'The client POSTs the long URL to the create endpoint.' },
            { title: 'Route', path: ['lb', 'app'], note: 'The load balancer picks a healthy stateless server.' },
            { title: 'Next ID', path: ['app', 'idgen'], note: 'The server takes the next number from its leased block. The allocator is only contacted when the block is nearly empty, so this step is usually local.' },
            { title: 'Encode and store', path: ['app', 'db'], note: 'Scramble the number, base62-encode it to 7 characters, and insert the row. A conditional insert is what makes custom aliases safe.' },
            { title: 'Replicate', path: ['db', 'replica'], note: 'The primary copies the row to the replica asynchronously. The server already has the code and returns the short URL.' }
          ] },
          { id: 'read', label: 'Read path: redirect', steps: [
            { title: 'Client follows link', path: ['client', 'lb'], note: 'A browser sends GET /aZ3kP9x.' },
            { title: 'Route', path: ['lb', 'app'], note: 'Any server can answer, since none holds state.' },
            { title: 'Cache lookup', path: ['app', 'cache'], note: 'Check Redis for the code. With a 90%+ hit rate nearly every request ends here with the long URL and a 302.' },
            { title: 'Cache miss', path: ['app', 'replica'], tone: 'hard', note: 'On a miss the server reads from a replica, never the primary. If the code is unknown or expired it returns 404 or 410.' },
            { title: 'Fill the cache', path: ['app', 'cache'], note: 'Store the mapping with a TTL no later than its expiry so the next click is a hit.' },
            { title: 'Emit click', path: ['app', 'queue'], note: 'Publish a small click event without waiting for it. The browser is already being redirected.' },
            { title: 'Count later', path: ['queue', 'worker', 'olap'], note: 'A worker aggregates events and writes counts to the analytics store, off the hot path.' }
          ] }
        ]
      },
      walkthrough: [
        '**Create**: validate the URL, take an ID from the local block, scramble and base62-encode it, insert it with a conditional write, return the short URL.',
        '**Redirect**: look up the code in Redis; on a miss read a replica and fill the cache; answer 302 with `Location`; publish a click event without waiting.',
        '**Why two stores for data**: the URL store is read by key at 4,000 a second with a 100 ms budget; click counts are append-heavy and can lag, so they live elsewhere.',
        '**Failure modes**: losing a cache node raises database reads for a while; losing the allocator is invisible until blocks run out; losing the queue loses some counts but never a redirect.'
      ]
    },
    deepDives: [
      { id: 'ids', title: 'Generating unique short codes',
        question: 'How do you produce a 7-character code that is unique, cheap to generate, and not guessable?',
        answer: 'Compare the options by what they cost.\n\n- **Counter + base62** never collides and gives the shortest codes, but a single counter is a bottleneck and sequential codes can be enumerated.\n- **Hash and truncate** is stateless, but truncating to 7 characters collides. At 6 billion links roughly 1 in 600 inserts hits an existing code, so every create needs a check and a retry.\n- **Random plus conditional insert** needs no coordination. At 0.17% fill the retry is rare, and a unique constraint or conditional write settles it.\n- **Snowflake IDs** are coordination-free but 64 bits is 11 base62 characters, too long for this product.\n\nMy pick is leased counter blocks (so the allocator is off the hot path) with a reversible scramble applied before base62 so codes look random. The simpler fallback is random plus a conditional insert.',
        followups: [
          { q: 'What if the allocator goes down?', a: 'Servers keep serving creates until their leased block is empty. Size blocks and alert on allocator health so there is minutes of headroom. If it stays down, fall back to random codes with a conditional insert, since both schemes produce the same 7-character format.' },
          { q: 'How do you stop people enumerating codes?', a: 'Pass the counter through a keyed bijection (a small Feistel permutation over the 41-bit range) before encoding. It is reversible and collision-free, so uniqueness is preserved but order is hidden. Enumeration is also limited by rate limits on 404s.' },
          { q: 'Why not just auto-increment the primary key?', a: 'It works at the start, but it ties code generation to one database primary, makes multi-region writes hard, and leaks creation order and volume.' }
        ] },
      { id: 'redirect', title: '301 versus 302 and counting clicks',
        question: 'The product shows click counts. Which redirect status do you return, and how do you count without slowing the redirect?',
        answer: 'Return **302**. A 301 is cacheable, so after the first visit a browser skips your service entirely: counts under-report and you cannot expire or edit the link for that client. The cost is more traffic, which the cache already absorbs.\n\nTo count without adding latency, publish a click event **after deciding the redirect**, fire-and-forget, to a queue. A worker aggregates per code per minute into the analytics store. If the queue is unavailable, buffer in memory or drop the event; never fail the redirect for a counter.',
        followups: [
          { q: 'What if exact counts matter, for billing?', a: 'Use at-least-once delivery with an event ID and dedupe in the worker, or write to a log first. Say plainly that exactly-once end to end is expensive, and agree what accuracy the product needs.' },
          { q: 'Can a CDN help?', a: 'For links marked permanent (301), yes: cache at the edge and count from edge logs. For 302 links, the edge can still cache the lookup briefly if edge logs feed the counter.' }
        ] },
      { id: 'hot', title: 'A link goes viral: hot keys and cache stampede',
        question: 'One link suddenly gets 100,000 requests a second. What happens and what do you do?',
        answer: 'Two problems. First, a **hot key**: every request hashes to the same cache node, which saturates even though the cluster is idle. Second, a **stampede**: if that key\'s TTL expires, thousands of requests miss at once and all query the database.\n\nFixes: keep a tiny in-process cache (one second TTL) on every app server so a hot code is served from local memory; **coalesce** concurrent misses so one request refills the cache and the rest wait; add jitter to TTLs so keys do not expire together; and optionally replicate known-hot keys across several cache nodes under suffixed names.',
        followups: [
          { q: 'How do you detect hot keys?', a: 'Sample requests or keep a count-min sketch in each app server and promote keys over a threshold. Alert on a single cache node\'s CPU or network far above the cluster average.' },
          { q: 'Does the CDN make this problem disappear?', a: 'Largely, if redirects are cacheable at the edge. It moves the question to cache-control: how stale may a redirect be, and how fast must a deleted link die.' }
        ] },
      { id: 'storage', title: 'Scaling and sharding the URL store',
        question: 'Three terabytes now, growing. How do you partition the data, and what changes when you add a node?',
        answer: 'Partition by **hash of `code`**. Because codes are effectively random, data and load spread evenly, and the lookup is a single-partition read with no scatter-gather.\n\nUse **consistent hashing** (or a managed store that does it for you) so adding a node moves only about 1/N of the keys instead of nearly all of them. Keep three replicas per partition in different zones for durability and read capacity.\n\nPartitioning by owner or by creation time would create hot partitions and would not match the redirect access pattern, which has neither.',
        followups: [
          { q: 'How do you serve users in other regions?', a: 'Replicate the URL store to each region and put a cache in each. Writes are rare, so writing in one home region and replicating asynchronously is acceptable, with the lag caveat for brand-new links.' },
          { q: 'Why not shard by creation date?', a: 'All new writes land on the newest shard, and old links are read as often as new ones, so it concentrates load and breaks the even-spread property.' }
        ] },
      { id: 'alias', title: 'Custom aliases, expiry and cleanup',
        question: 'How do custom aliases and expiry change the design?',
        answer: 'A custom alias makes `code` user-chosen, so uniqueness must be enforced by the store: a unique key (SQL) or a conditional put (key-value). Reserve a namespace so aliases cannot collide with generated codes (for example generated codes are exactly 7 characters and aliases must differ in length or use a reserved character).\n\nExpiry is checked **at read time** (`expires_at` below now means 410) so correctness never depends on cleanup. Physical deletion is a lazy background job, or a native TTL in the store. Cache TTL is capped at the remaining lifetime.',
        followups: [
          { q: 'Can an expired code be reused?', a: 'Only after a quarantine period, so old cached redirects and browser history cannot send a new owner\'s visitors to the previous destination.' }
        ] },
      { id: 'abuse', title: 'Abuse and security',
        question: 'People will use this for phishing and to hammer it with junk. What do you add?',
        answer: 'Rate limit creation per API key and IP with a token bucket. Validate scheme (http and https only), length and syntax. Check destinations against a safe-browsing style blocklist at creation, and re-scan asynchronously because pages change after creation. Provide a report-and-disable path that invalidates the cache.\n\nOn the read side, rate limit 404s per IP to slow enumeration, and never reflect user input into the redirect `Location` without validation.',
        followups: [
          { q: 'What about open-redirect style abuse?', a: 'The service is an open redirector by nature. Mitigate with blocklists, interstitial warning pages for flagged links, and by never redirecting to internal address ranges (block private IPs to prevent server-side request abuse if you fetch titles).' }
        ] }
    ],

    bottlenecks: [
      { title: 'The database after a cache loss', problem: 'A cache flush or node loss sends nearly all 4,000 reads a second to the database at once, plus the viral burst on top.', mitigation: 'Replicas absorb reads. Warm new cache nodes before putting them in rotation, coalesce misses, add TTL jitter, and rate limit as a last line so the store degrades rather than collapses.' },
      { title: 'The ID allocator', problem: 'A single allocator is a single point of failure and, if every create called it, a write bottleneck.', mitigation: 'Lease blocks of IDs so it is called once per thousand creates; replicate its state; fall back to random codes if it stays down.' },
      { title: 'Replication lag on new links', problem: 'A just-created link can 404 if the redirect reads a replica that has not received the row yet.', mitigation: 'Fill the cache at create time, or read the primary on a miss for codes younger than a few seconds, or retry once before returning 404.' },
      { title: 'Click-event volume', problem: 'At ten times the traffic the queue and analytics store see 40,000 events a second.', mitigation: 'Pre-aggregate in memory per app server and flush every second, partition the queue by code with salting for hot codes, and keep raw events only briefly.' },
      { title: 'Cross-region consistency', problem: 'Users in other continents see high redirect latency and a regional outage takes the service down.', mitigation: 'Replicate the store and the cache per region and route by latency. Accept asynchronous replication and its brief window where a new link is unknown elsewhere.' }
    ],

    mistakes: [
      'Starting with the architecture before asking the 100:1 read ratio and the redirect latency target.',
      'Using a **plain hash of the long URL** and ignoring collisions, or truncating MD5 and calling it unique.',
      'Choosing **sequential IDs** and not mentioning that codes become guessable.',
      'Counting clicks **synchronously** on the redirect path, which turns an analytics outage into a redirect outage.',
      'Returning **301** without noticing it breaks click counting and expiry.',
      'Naming a database with no link to the access pattern (key lookup, no joins, 3 TB).',
      'Forgetting cache **invalidation on delete** and on expiry.',
      'Putting the database in the redirect path for every request and calling the cache an optional extra.',
      'Never saying what breaks at 10x.'
    ],

    pushes: [
      { q: 'Why not generate the code from a hash of the URL?', why: 'It is the obvious first idea, and they want to see whether you know it collides after truncation.', good: 'Birthday math at 6 billion links in a 3.5 trillion space; the check-and-retry that makes creation read-then-write; the upside that identical URLs dedupe; why you still prefer ID-based codes.' },
      { q: 'How do you know your cache hit rate will be high enough?', why: 'They are testing whether the 80/20 assumption is a guess you can defend.', good: 'Link popularity is heavily skewed. State the assumption, size the cache from it (33 GB), say how you would measure the actual rate, and what happens to the database if it falls to 50%.' },
      { q: 'What happens if your ID allocator dies?', why: 'Single points of failure are always probed.', good: 'Leased blocks mean no immediate impact; alert on headroom; the random-code fallback; recover allocator state from durable storage without reissuing a block.' },
      { q: 'How would you support analytics for each link?', why: 'It extends the design and checks that you protect the hot path.', good: 'Asynchronous events through a queue, aggregation in workers, a separate store, tolerance for lag, and a statement about exactness versus cost.' },
      { q: 'How would this change for 100 times the scale?', why: 'They want to see where it breaks first.', good: 'Sharded or managed key-value store, per-region caches, in-process caching for hot keys, batching click events, and an honest note that the allocator and hot keys are the limits.' },
      { q: 'Could someone scrape every URL in the system?', why: 'Security and privacy thinking.', good: 'Scrambled IDs, rate limits on 404s, longer codes for private links, and an option to require auth for sensitive links.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why is the URL shortener described as read-heavy, and what does it change?', choices: ['Reads are 100 times writes, so cache the read path and keep writes simple', 'Writes are the bottleneck, so shard the write path first', 'It needs strong consistency between every read and write', 'Reads and writes are balanced, so both paths get the same design effort'], answer: 0, explain: 'About 40 writes a second against about 4,000 reads. The cost and risk sit on the read path, so the cache and replicas matter more than write throughput.' },
      { kind: 'concept', q: 'You hash the long URL with MD5 and keep 7 base62 characters. Which problem do you have to handle?', choices: ['Collisions: two URLs can map to the same code', 'MD5 is too slow for 40 writes per second', 'The code cannot be decoded back to the URL', 'The same URL always gets a different code'], answer: 0, explain: 'Truncation shrinks the space to about 3.5 trillion codes. As the table fills you must detect a collision and retry, for example by salting the input.' },
      { kind: 'concept', q: 'Which redirect status keeps click counts accurate?', choices: ['302, because every click reaches your service', '301, because it is permanent', 'Either, since counting happens in the browser', '200 with a meta refresh tag only'], answer: 0, explain: 'A 301 is cacheable: browsers skip your service on repeat visits, so those clicks go uncounted and the link cannot be expired.' },
      { kind: 'concept', q: 'A single link goes viral and one cache node is saturated while the others idle. What is this?', choices: ['A hot key', 'A cache stampede', 'Replication lag', 'A split brain'], answer: 0, explain: 'All requests for one key hash to one node. A short-lived in-process cache on app servers spreads that load. A stampede is the separate case of many misses at once when a key expires.' },
      { kind: 'concept', q: 'Pick every reason to keep click analytics out of the redirect request path.', choices: ['An analytics outage must not break redirects', 'Writing an event adds latency to the user-facing request', 'Analytics data cannot be stored durably', 'Click volume can swamp the URL store'], answer: [0, 1, 3], explain: 'Publish an event asynchronously and aggregate elsewhere. Analytics can absolutely be stored durably, so that choice is wrong.' },
      { kind: 'complexity', q: 'How many 7-character base62 codes exist?', choices: ['About 3.5 trillion (62^7)', 'About 56 billion (62^6)', 'About 7 million', 'About 2^64'], answer: 0, explain: '62^7 = 3,521,614,606,208. Five years at 3.3 million links a day is about 6 billion, under 1% of that.' }
    ],

    flashcards: [
      { id: 'read-heavy', front: 'URL shortener: read to write ratio and what it implies?', back: 'About 100:1 (4,000 reads/s vs 40 writes/s). Cache the read path, add replicas, keep writes simple.' },
      { id: 'codes', front: 'Why 7 base62 characters for short codes?', back: '62^7 is about 3.5 trillion. Five years at 3.3M links/day is about 6 billion, so under 1% of the space is used and collisions stay rare.' },
      { id: 'hash-collision', front: 'Problem with hashing the long URL and truncating to 7 chars?', back: 'Collisions. You must check and retry (for example with a salt), so every create becomes read-then-write.' },
      { id: 'counter-lease', front: 'How do leased ID blocks avoid a counter bottleneck?', back: 'Each server leases a range (say 1,000 IDs) from an allocator and hands them out locally, so the allocator is called once per block, not per URL. Scramble before base62 so codes are not sequential.' },
      { id: '301-302', front: '301 vs 302 for a shortener redirect?', back: '301 is cached by browsers: less load, but clicks go uncounted and links cannot expire. 302 sends every click through you: accurate analytics and expiry.' },
      { id: 'viral-link', front: 'Fixes for a viral link (hot key plus stampede)?', back: 'In-process cache on app servers, coalesce concurrent misses, TTL jitter, and replicate known-hot keys across cache nodes.' }
    ]
  });
})();
