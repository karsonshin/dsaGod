/* System design case study: web crawler. Same shape as url-shortener.js (schema: data/sd/schema.md).
   Numbers are rounded estimates. The Bloom filter sizing was checked with the standard formulas. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'web-crawler',
    title: 'Design a web crawler',
    short: 'Fetch a billion pages a month without hurting any site. A tour of the frontier, politeness, deduplication, crawl traps and partitioning by host.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Queues', 'Politeness', 'Dedupe', 'Bloom filter'],
    prompt: 'Design a web crawler that discovers and downloads pages across the public web, starting from a list of seed URLs, so the pages can later be indexed. It should be polite to sites, avoid duplicate work, and scale out across machines.',

    requirements: {
      functional: [
        'Start from **seed URLs**, fetch each page, extract its links, and crawl the new ones.',
        'Respect **robots.txt** and a per-site politeness limit; identify the crawler with a clear user agent.',
        'Skip URLs and content already seen (**URL and content deduplication**).',
        'Store each fetched page (raw content plus metadata) for downstream indexing.',
        'Revisit pages over time: popular and fast-changing pages more often than static ones.'
      ],
      nonFunctional: [
        '**Politeness**: never overload a single site; this is a hard constraint, not a tuning knob.',
        '**Throughput**: about 1 billion pages a month, so roughly 400 pages a second on average.',
        '**Robustness**: the web is hostile and broken (slow servers, malformed HTML, infinite pages). One bad site must not stall the crawl.',
        '**Scalable and fault tolerant**: add machines to crawl faster; lose a machine without losing the frontier.',
        '**Extensible**: new content types (images, PDFs) and new processing steps plug in later.'
      ],
      outOfScope: ['Building the search index and ranking (we hand pages to a downstream system).', 'Executing JavaScript to render client-side pages (mention it as a cost multiplier).', 'The deep web behind logins and forms.', 'Legal review beyond honouring robots.txt and takedown requests.'],
      assumptions: ['Crawl **HTML text** only: about 100 KB per page uncompressed and about 30 KB on the wire when compressed (approximate).', 'About **50 links per page** on average (approximate).', 'There are on the order of **50 million hosts** in scope (an assumption to state).'],
      clarify: [
        { q: 'What is the crawl for: a search index, price monitoring, archiving?', a: 'It sets freshness and breadth. A search engine wants broad coverage and recrawls by importance; a price monitor wants a small set of sites crawled often. Assume a general search crawl.' },
        { q: 'How many pages, and how fresh?', a: 'One billion pages a month, with most pages refreshed monthly and popular ones daily. That fixes the throughput at about 400 pages a second.' },
        { q: 'HTML only, or also images, PDFs and JavaScript-rendered pages?', a: 'HTML first. Rendering JavaScript costs roughly an order of magnitude more per page, so treat it as a separate, small pool for pages that need it.' },
        { q: 'How polite must we be?', a: 'Honour robots.txt and `Crawl-delay` where present, and default to about one request a second per host. Back off on 429 and 5xx responses. Politeness is why a single huge site cannot be crawled faster by adding machines.' },
        { q: 'Do we crawl the same page again?', a: 'Yes, on a schedule. Plan a recrawl policy from the start: it is half the system, not an afterthought.' }
      ]
    },

    estimates: {
      intro: 'The calculator speaks in users, so read its inputs this way: **"users" are pages fetched per day**. One billion pages a month is about **33 million pages a day**. Each page is one fetch (a "read") and one stored page (a "write").',
      inputs: { dau: 33e6, writesPerUser: 1, readsPerUser: 1, peakFactor: 2, bytesPerWrite: 30000, bytesPerRead: 30000, years: 1, replication: 3, hotFraction: 0.01, serverQps: 80, utilization: 0.6 },
      assumptions: [
        '**30 KB per page** is compressed HTML text as downloaded and stored (about 100 KB uncompressed; approximate).',
        '**Peak is 2 times average**, because a crawl is scheduled and steady, not spiky like user traffic.',
        'A crawler node completes **about 40 pages a second** (a fetch plus a store, so 80 operations), limited by network waits and parsing; plan at 60% utilization. The "app servers" row is **crawler nodes**.',
        'The "Egress" rows are really the **download bandwidth** into the crawler and "Ingress" is the write rate to storage. Their sizes match because we assumed the same bytes each way.',
        'Ignore the **cache size** row. The "data over years" row **overstates the live corpus** because a recrawl overwrites the old copy: one billion pages at 30 KB is about 30 TB of current content (before history and replication).'
      ],
      extra: [
        { label: 'Links discovered per day', formula: '33M pages x ~50 links', result: '~1.65 billion (~19K/s to check)' },
        { label: 'Live corpus (current copy of each page)', formula: '1B pages x 30 KB', result: '~30 TB' },
        { label: 'URL-seen Bloom filter, 10B URLs at 1% false positives', formula: '10B x 9.6 bits, 7 hash functions', result: '~12 GB' },
        { label: 'Same filter at 0.1% false positives', formula: '10B x 14.4 bits, 10 hash functions', result: '~18 GB' },
        { label: 'DNS cache, 50M hosts', formula: '50M x ~100 B', result: '~5 GB' },
        { label: 'Politeness floor for one big site', formula: '1M pages at 1 request/s', result: '~11.6 days' }
      ],
      notes: [
        'About **380 pages a second on average**, roughly 760 at peak, needing about **32 crawler nodes**. That is modest: the system is hard because of **politeness and the messiness of the web**, not raw throughput.',
        'The **dedupe check is the busiest data operation**: about 19,000 URL lookups a second, 50 for every page fetched. It needs to be a fast in-memory structure, which is why a Bloom filter appears.',
        'Download bandwidth is only about 12 MB/s (roughly 90 Mbps) on average. Network capacity is not the limit; **waiting on slow servers and DNS** is, so each node runs thousands of concurrent fetches.',
        'The **politeness floor** shows why you cannot buy your way out: a million-page site at one request a second still takes about 12 days. Breadth across many hosts is where parallelism comes from.'
      ]
    },

    api: [
      { method: 'POST', path: '/v1/seeds', desc: 'Add seed URLs, with an optional priority. Admin or pipeline use.',
        request: '{\n  "urls": ["https://example.org/", "https://news.example.com/"],\n  "priority": "high"\n}',
        response: '{ "accepted": 2, "alreadyKnown": 0 }',
        notes: ['Normalize each URL (see the dedupe deep dive) before checking whether it is known.', 'Seeds enter the frontier like any other URL, with a high initial priority.'] },
      { method: 'POST', path: '/internal/frontier/next', desc: 'A fetcher asks for a batch of URLs that are **ready to crawl now** (politeness delay elapsed).',
        request: '{ "workerId": "fetch-17", "max": 100 }',
        response: '{\n  "leaseId": "L-9f31",\n  "urls": [{ "url": "https://example.org/a", "host": "example.org", "attempt": 0 }],\n  "leaseSeconds": 120\n}',
        notes: ['A **lease** means a worker that dies simply lets the lease expire and the URLs return to the queue.', 'The frontier only hands out a host\'s URL if that host\'s next-allowed time has passed.'] },
      { method: 'POST', path: '/internal/frontier/report', desc: 'A fetcher reports the outcome of each URL: success, redirect, error, or "retry later".',
        request: '{\n  "leaseId": "L-9f31",\n  "results": [{ "url": "https://example.org/a", "status": 200, "contentHash": "9be3...", "etag": "W/\\"abc\\"", "retryAfter": null }]\n}',
        notes: ['Failures carry a **reason** (timeout, 429, 5xx, robots disallow) so the frontier can apply the right backoff.', 'Reports are idempotent by URL and lease, since a retry after a timeout must not double-count.'] },
      { method: 'GET', path: '/v1/pages/{urlHash}', desc: 'Downstream consumers (the indexer) read stored pages and their metadata.',
        response: '{\n  "url": "https://example.org/a",\n  "fetchedAt": "2026-10-02T09:15:00Z",\n  "status": 200,\n  "contentHash": "9be3...",\n  "blobKey": "pages/ab/9be3..."\n}',
        notes: ['In practice downstream systems **subscribe to a stream of "page stored" events** instead of polling this endpoint.'] }
    ],
    apiNotes: ['The crawler is mostly **internal APIs**: there is no end-user traffic. The important contracts are lease-based work distribution and idempotent result reporting.', 'Send a descriptive **User-Agent** with a contact URL, so site owners can find and block or contact you.', 'Provide a public way for site owners to report problems and request removal.'],

    data: {
      intro: 'Four kinds of state with different access patterns: the **frontier** (a work queue with scheduling rules), the **URL metadata** (one row per known URL), the **seen filters** (fast membership tests) and the **page store** (large blobs). Keep them separate: each scales differently.',
      entities: [
        { name: 'url_record (metadata DB)', purpose: 'One row per known URL: its crawl state and history. Partitioned by host so a host\'s rows live together.', fields: [
          ['url_hash', 'bytes(16), key', 'Hash of the normalized URL.'],
          ['url', 'string', 'Normalized form.'],
          ['host', 'string', 'Partition key, so one node owns all of a host\'s URLs.'],
          ['state', 'enum', '`new`, `queued`, `fetched`, `error`, `blocked`.'],
          ['last_fetched / next_fetch', 'timestamp', 'Drive the recrawl schedule.'],
          ['etag / last_modified', 'string', 'For conditional requests that skip unchanged pages.'],
          ['content_hash', 'bytes(16)', 'Detects whether the page changed between visits.'],
          ['change_count / fetch_count', 'int', 'Estimate how often the page changes, to adapt the interval.'],
          ['priority', 'float', 'Importance score (link popularity, site quality).']
        ] },
        { name: 'host_record', purpose: 'Politeness and robots state for a host. Small and extremely hot.', fields: [
          ['host', 'string, key', ''], ['robots_rules', 'blob', 'Parsed robots.txt rules for our user agent.'], ['robots_fetched_at', 'timestamp', 'Re-fetch about daily.'], ['crawl_delay_ms', 'int', 'From robots.txt `Crawl-delay`, or our default (about 1,000 ms).'], ['next_allowed_at', 'timestamp', 'Earliest time we may hit this host again.'], ['ip / dns_expires_at', 'string, timestamp', 'Cached DNS answer.'], ['error_streak', 'int', 'Consecutive failures; drives backoff and temporary blocking.']
        ] },
        { name: 'page (object storage)', purpose: 'Raw content and fetch headers, keyed by content hash so identical bodies are stored once.', fields: [
          ['blob_key', 'string', 'Derived from the content hash.'], ['body', 'bytes (compressed)', 'About 30 KB average.'], ['headers', 'json', 'Status, content type, ETag, fetch time.']
        ] },
        { name: 'content_fingerprint', purpose: 'Compact signature of each page for duplicate and near-duplicate detection.', fields: [
          ['simhash', 'bytes(8)', '64-bit similarity hash of the page text.'], ['exact_hash', 'bytes(16)', 'Hash of the normalized body, for exact duplicates.'], ['canonical_url', 'string', 'First URL seen with this content.']
        ] }
      ],
      storage: [
        { title: 'Wide-column or key-value store (Cassandra, DynamoDB, Bigtable style) for url_record', verdict: 'Pick',
          body: 'Billions of rows, written and read by key, with one clear partition key (the host). That is the sweet spot of a wide-column store: it scales out, handles heavy write rates, and rows of one host stay together so one node can schedule them. You give up joins and ad-hoc queries, which the crawler does not need; it needs "what is due for this host".\n\nA SQL database is workable at small scale (a hundred million URLs) but sharding by hand and the write rate (every discovered link is a write) make it painful at billions.' },
        { title: 'Object storage for page content', verdict: 'Pick',
          body: 'Pages are write-once blobs of tens of kilobytes, read mostly in bulk by the indexer. Object storage (or a distributed file system with large append files) is cheap and durable. Batch many pages into large files rather than one object per page to avoid small-object overhead, and compress. Key by content hash so duplicates cost nothing.' },
        { title: 'In-memory filters and caches for seen URLs, DNS and robots', verdict: 'Speed layer',
          body: 'A **Bloom filter** answers "have we seen this URL?" in a few memory accesses with no false negatives. A small false-positive rate means a few new URLs are wrongly skipped, which a crawler tolerates. Back it with the persistent URL store for the exact answer on the rare uncertain cases.\n\nDNS answers and parsed robots.txt rules are cached in memory per node, keyed by host, because the same host is hit again and again.' }
      ],
      decisions: [
        { title: 'How to test "have we seen this URL?"', question: 'About 19,000 checks a second against billions of URLs.',
          options: [
            { name: 'Exact set in a database', pros: 'No errors. Also records metadata.', cons: 'A network round trip and a disk-backed lookup for every one of 1.65 billion checks a day.' },
            { name: 'Bloom filter in memory', pros: '10B URLs fit in about 12 GB at a 1% false-positive rate. Constant time, no network. **No false negatives**, so nothing seen is crawled twice.', cons: 'False positives skip about 1 in 100 new URLs. Cannot delete entries. Must be rebuilt or sized ahead of growth.' },
            { name: 'Bloom filter first, exact store on a "maybe"', pros: 'Definite "no" answers (new URL) cost nothing. Only "maybe" answers touch the database.', cons: 'Most discovered links are already seen, so many checks still reach the store unless the filter is tuned and sharded.' }
          ],
          pick: 'A **sharded Bloom filter in memory on the node that owns the host**, with the URL metadata store behind it for the exact answer when the filter says "seen" and you need the record (for example to schedule a recrawl). Accept the 1% loss of new URLs; better coverage comes from many other routes to the same page.' },
        { title: 'How to shape the frontier', question: 'The frontier must order URLs by importance **and** enforce per-host delay. These conflict: the best URL may belong to a host you hit a moment ago.',
          options: [
            { name: 'One global priority queue', pros: 'Simple. Always takes the most important URL.', cons: 'Ignores politeness: it may pop ten URLs for one host in a row and hammer it.' },
            { name: 'One queue per host with a timer', pros: 'Politeness is natural: each queue releases a URL only after the delay.', cons: 'Ignores priority across hosts, and millions of queues are heavy to manage.' },
            { name: 'Two stages: priority front queues feeding per-host back queues', pros: 'Priority decides what enters; the per-host queue and a "next allowed time" heap decide when it leaves. Both constraints hold.', cons: 'More moving parts: a mapping from hosts to back queues and a heap to keep in sync.' }
          ],
          pick: 'The **two-stage frontier**: priority-ordered front queues classify URLs; a router puts each into the back queue for its host; a min-heap keyed by each host\'s next allowed time tells fetchers which host to serve next.' },
        { title: 'How to partition the crawl', question: 'Several machines must cooperate without two of them crawling the same host.',
          options: [
            { name: 'Partition by URL hash', pros: 'Even spread of URLs.', cons: 'Pages of one host land on many nodes, so no node can enforce that host\'s politeness or share its robots and DNS cache.' },
            { name: 'Partition by host hash', pros: 'One node owns a host: it enforces the delay locally, keeps that host\'s robots rules and DNS answer in memory, and dedupes that host\'s URLs itself.', cons: 'A huge host is limited to one node (fine: politeness caps its rate anyway). Links to other hosts must be forwarded to their owners.' },
            { name: 'Central coordinator hands out work', pros: 'Simple to reason about.', cons: 'A bottleneck and a single point of failure at 19,000 decisions a second.' }
          ],
          pick: '**Partition by host** using consistent hashing, so adding or removing a node moves only a slice of hosts. Each node runs its own frontier, politeness, robots cache, DNS cache and seen filter for the hosts it owns.' }
      ]
    },

    design: {
      intro: 'Think of a loop: the **frontier** hands out URLs, **fetchers** download them, the **parser** extracts links, the **seen filters** drop repeats, and new URLs go back to the frontier through the scheduler. Everything is partitioned by host. **Click any box** for the reasoning, or pick a flow to trace.',
      diagram: {
        title: 'Web crawler high-level design',
        nodes: [
          { id: 'sched', label: 'Seeds and recrawl scheduler', kind: 'service',
            detail: { why: 'The source of all work: injects seed URLs, new URLs found by the parser, and pages that are **due for a recrawl**. It reads the URL metadata store for rows whose next-fetch time has arrived and assigns each a priority.', tradeoffs: ['Separating "decide what is due" from "decide when to hit the host" keeps the policy (importance, change rate) out of the fetch machinery.', 'In the loop of the crawl, new URLs return to the frontier through this scheduler; the diagram stays acyclic by leaving that arrow out.'], alternatives: ['Push every new URL directly into the frontier (simpler; recrawl logic then lives elsewhere)'], scale: 'Scanning billions of metadata rows for due URLs; index by (host, next_fetch) and scan per partition.' } },
          { id: 'frontier', label: 'URL frontier (priority + politeness queues)', kind: 'queue',
            detail: { why: 'The brain of the crawler. **Front queues** order URLs by priority; a router puts each into a **back queue per host**; a heap of "next allowed time" releases a host\'s URL only when its politeness delay has passed. Fetchers pull ready URLs with a lease.', tradeoffs: ['Honours both importance and politeness, which a single queue cannot.', 'It must be **durable**: losing it loses the discovered web. Persist queues to disk or a log, in memory only for the hot head.', 'Leases make worker crashes harmless: unfinished URLs reappear.'], alternatives: ['A generic message queue (no per-host timers, so you rebuild the logic on top)', 'One global priority queue (violates politeness)'], scale: 'Hundreds of millions of queued URLs; keep only the hot head in memory and spill the rest to disk.' } },
          { id: 'fetch', label: 'Fetcher workers', kind: 'service',
            detail: { why: 'Download pages. Each node runs thousands of concurrent, non-blocking fetches, because almost all the time is spent waiting on remote servers. They check DNS and robots.txt first, apply timeouts and size limits, and follow redirects (to a limit).', tradeoffs: ['Hard limits on connect time, total time, response size (a few MB) and redirect chain length protect against slow, huge or looping responses.', 'Use conditional requests (`If-None-Match`, `If-Modified-Since`) on recrawls to skip unchanged pages.', 'A global timeout per worker prevents one hung host from tying up a connection forever.'], alternatives: ['A headless browser for JavaScript pages (about 10x the cost; a small separate pool)'], scale: 'Open connections and file descriptors per node, then DNS resolution speed.' } },
          { id: 'dns', label: 'DNS resolver cache', kind: 'cache',
            detail: { why: 'Looking up a host name can take tens to hundreds of milliseconds and a public resolver may throttle a crawler, so a local caching, asynchronous resolver is a standard component. The IP is stored per host for its TTL (with a floor and a ceiling).', tradeoffs: ['Respecting the record\'s TTL keeps answers correct; ignoring it saves lookups but breaks when sites move.', 'Resolving the host once per politeness window also stops you hitting different IPs of one site in parallel by accident.'], alternatives: ['A local recursive resolver you run (more control, more to operate)', 'The operating system resolver (blocking calls, small cache)'], scale: 'Lookup throughput and cache size (about 5 GB for 50M hosts, approximate).' } },
          { id: 'robots', label: 'robots.txt cache', kind: 'cache',
            detail: { why: 'Before fetching anything from a host the crawler needs that host\'s parsed robots.txt rules. They are fetched once, parsed for our user agent, and cached for about a day, rather than fetched per page.', tradeoffs: ['Following the standard: a missing file (4xx) means everything is allowed; a server error (5xx) means treat the site as disallowed until it recovers.', 'It also supplies `Crawl-delay` and sitemap locations.', 'Cache per host on the node that owns the host, so no network call is needed.'], alternatives: ['Fetch robots.txt on every request (doubles load on the site)'], scale: 'Tiny per host, but 50M hosts of rules is large; keep it with the host record.' } },
          { id: 'web', label: 'The web (site servers)', kind: 'external',
            detail: { why: 'Billions of independent servers: slow, flaky, sometimes malicious. The crawler has no control over them, so everything about it is defensive.', tradeoffs: ['Some servers rate limit or block crawlers; honour 429 and `Retry-After`.', 'Redirects, soft 404s and infinite generated pages are routine.'], scale: 'You can only crawl a host as fast as it tolerates, whatever your capacity.' } },
          { id: 'parser', label: 'Parser and link extractor', kind: 'service',
            detail: { why: 'Decodes the response (character set, compression), extracts text and links, resolves relative links against the page URL, and **normalizes** each link before it goes anywhere. Runs separately from fetching because parsing is CPU-bound and fetching is wait-bound.', tradeoffs: ['Splitting fetch and parse lets each scale to its bottleneck.', 'Parsers must tolerate broken HTML and enforce limits on document size and depth, or one malicious page can burn a CPU.', 'Honour `rel=nofollow`, canonical links and `<meta robots>` as policy signals.'], alternatives: ['Parse inline in the fetcher (simpler, but CPU work blocks I/O capacity)'], scale: 'CPU: about 760 pages a second at peak, each producing about 50 links to normalize and check.' } },
          { id: 'fp', label: 'Content fingerprints', kind: 'cache',
            detail: { why: 'A store of compact signatures for pages already stored. An **exact hash** catches identical content at different URLs; a **similarity hash** (simhash) catches near duplicates (the same article with a different ad banner).', tradeoffs: ['Exact hashing is cheap and certain but misses small differences.', 'A 64-bit simhash with a small Hamming distance threshold finds near duplicates, at the cost of tuning and some false matches.', 'Skipping storage of duplicates saves space and downstream indexing work.'], alternatives: ['Compare full text (far too slow and large)', 'Rely on URL dedupe only (misses mirrors and parameter variants)'], scale: 'One fingerprint per stored page: about 24 bytes times a billion pages, so tens of gigabytes.' } },
          { id: 'urlseen', label: 'URL-seen filter (Bloom)', kind: 'cache',
            detail: { why: 'For each extracted link, answer "have we seen this normalized URL?" in memory. Definitely-new URLs continue to the metadata store and the frontier; probably-seen ones are dropped.', tradeoffs: ['About 12 GB for 10 billion URLs at a 1% false-positive rate (approximate), with no false negatives.', 'Cannot remove items, so it only grows; size for the future or rebuild periodically from the metadata store.', 'Sharded by host so each node holds only the filter for its own hosts.'], alternatives: ['Exact set in the database (round trip for every link)', 'A counting or cuckoo filter if deletion is needed'], scale: 'Memory as the URL universe grows, and the false-positive rate rising if you under-size it.' } },
          { id: 'store', label: 'Page store', kind: 'storage',
            detail: { why: 'Durable, cheap storage for compressed page bodies, written in large batched files and keyed by content hash. The indexer reads from here (or subscribes to "stored" events).', tradeoffs: ['Writing in large batches avoids millions of tiny objects.', 'Keying by content hash stores identical bodies once.', 'Keep a few historical versions per URL only if downstream needs change history.'], alternatives: ['A distributed file system with large append-only files', 'Database BLOBs (too expensive at 30 TB)'], scale: 'About 30 TB of current content before history and replication.' } },
          { id: 'meta', label: 'URL metadata DB', kind: 'db',
            detail: { why: 'One row per known URL: state, last fetch, ETag, content hash, change history and next-fetch time. Partitioned by host. The scheduler reads it to find what is due, and it is the exact record behind the Bloom filter.', tradeoffs: ['Partition by host so a node owns and schedules all of a host\'s rows.', 'Write volume is high: every new URL and every fetch result is a write, so a wide-column or key-value store fits.', 'It is the source of truth for rebuilding the Bloom filter and the frontier after a failure.'], alternatives: ['Sharded SQL (manual resharding at billions of rows)', 'Keep state only in the frontier (loses history and recrawl signals)'], scale: 'Billions of rows and tens of thousands of writes a second; partition by host and batch writes.' } }
        ],
        edges: [
          { from: 'sched', to: 'frontier', label: 'due URLs' },
          { from: 'frontier', to: 'fetch', label: 'next URL' },
          { from: 'fetch', to: 'dns', label: 'resolve' },
          { from: 'fetch', to: 'robots', label: 'allowed?' },
          { from: 'fetch', to: 'web', label: 'HTTP GET' },
          { from: 'fetch', to: 'parser', label: 'page' },
          { from: 'parser', to: 'fp', label: 'fingerprint' },
          { from: 'parser', to: 'urlseen', label: 'links' },
          { from: 'parser', to: 'store', label: 'save' },
          { from: 'urlseen', to: 'meta', label: 'new URLs' }
        ],
        scenarios: [
          { id: 'crawl', label: 'Crawl one URL', steps: [
            { title: 'Frontier releases a URL', path: ['sched', 'frontier'], note: 'The scheduler put the URL into a front queue by priority; the router placed it in the back queue for `example.org`. Its host timer has expired, so it is ready.' },
            { title: 'Worker takes a lease', path: ['frontier', 'fetch'], note: 'A fetcher pulls a batch of ready URLs with a lease. If the worker dies, the lease expires and the URLs go back in the queue.' },
            { title: 'Resolve and check robots', path: ['fetch', 'dns'], note: 'The IP comes from the DNS cache (a miss costs tens of milliseconds, once per TTL). The cached robots.txt rules say whether the path is allowed.' },
            { title: 'Download', path: ['fetch', 'web'], tone: 'accent', note: 'An HTTP GET with a descriptive User-Agent, a connect and total timeout, a size cap, and an `If-None-Match` header if we have an ETag from last time.' },
            { title: 'Parse', path: ['fetch', 'parser'], note: 'The parser decodes the body, extracts the text and links, and resolves each link against the page URL.' },
            { title: 'Fingerprint and store', path: ['parser', 'fp'], tone: 'ok', note: 'Compute an exact hash and a simhash. If the content is a duplicate, skip storing it; otherwise save the body to the page store, keyed by content hash.' }
          ] },
          { id: 'links', label: 'New links discovered', steps: [
            { title: 'Extract and normalize', path: ['fetch', 'parser'], note: 'About 50 links come out of the page. Each is made absolute, lowercased where safe, stripped of fragments and tracking parameters, and sorted by query key.' },
            { title: 'Check the seen filter', path: ['parser', 'urlseen'], tone: 'accent', note: 'The Bloom filter says "definitely new" or "probably seen". Most links on most pages are already known, so most are dropped here for the cost of a few memory reads.' },
            { title: 'Record the new ones', path: ['urlseen', 'meta'], tone: 'ok', note: 'New URLs get a metadata row with a starting priority. The scheduler reads these rows and feeds them to the frontier (that arrow is the loop, left out of the diagram so it stays acyclic).' }
          ] },
          { id: 'polite', label: 'A site pushes back', steps: [
            { title: 'Fetch returns 429', path: ['fetch', 'web'], tone: 'hard', note: 'The site answers 429 Too Many Requests with `Retry-After: 120`, or starts timing out. That is a signal to slow down, not to retry at once.' },
            { title: 'Back off the host', path: ['frontier', 'fetch'], tone: 'hard', note: 'The result is reported to the frontier, which pushes the host\'s next-allowed time out (honouring `Retry-After`, otherwise exponential backoff) and doubles its crawl delay. Other hosts are unaffected.' },
            { title: 'Resume slowly', path: ['sched', 'frontier'], tone: 'ok', note: 'After the pause the host is served at the reduced rate and the delay decays back toward the default if responses stay healthy. Repeated failures can mark the host as temporarily blocked.' }
          ] },
          { id: 'recrawl', label: 'Recrawl a page', steps: [
            { title: 'Page becomes due', path: ['sched', 'frontier'], note: 'Its next-fetch time arrived. A page that changed on 8 of the last 10 visits is due sooner than one that never changed.' },
            { title: 'Conditional request', path: ['fetch', 'web'], tone: 'accent', note: 'The fetcher sends `If-None-Match` with the stored ETag. A **304 Not Modified** costs the site almost nothing and costs us no storage or parsing.' },
            { title: 'Update the schedule', path: ['parser', 'fp'], tone: 'ok', note: 'If the content hash is unchanged the interval grows; if it changed the page is re-parsed, re-stored and the interval shrinks.' }
          ] }
        ]
      },
      walkthrough: [
        '**Schedule**: seeds, newly found URLs and due recrawls enter the frontier with a priority.',
        '**Release**: the frontier gives a fetcher only URLs whose host is allowed now, and the lease returns unfinished work if a worker dies.',
        '**Fetch**: resolve through the DNS cache, check cached robots rules, download with strict limits, and use conditional requests on recrawls.',
        '**Process**: parse, normalize links, drop seen URLs with the Bloom filter, fingerprint content to avoid storing duplicates, store pages, and write metadata.',
        '**Scale**: everything is partitioned by host, so one node owns each host\'s politeness, robots, DNS and seen-state, and links to other hosts are forwarded to their owners.'
      ],
      notes: ['Run a **separate small pool** for pages needing JavaScript rendering, fed only for hosts that need it; it is about ten times more expensive per page.']
    },

    deepDives: [
      { id: 'frontier', title: 'The frontier: priority and politeness together',
        question: 'How do you decide which URL to fetch next when you want important pages first but must never hit one host too fast?',
        answer: 'A single queue cannot do both, so use two stages.\n\n**Front queues (priority).** Several queues, one per priority level. A URL\'s priority comes from signals such as the site\'s importance, link popularity, depth from a seed, and how often the page changes. A selector picks from them with a bias toward the high-priority queues, so low priority is slow but never starved.\n\n**Back queues (politeness).** Each back queue holds URLs from **one host only**. A router moves a URL from a front queue into the back queue of its host. A **min-heap** orders hosts by their *next allowed time*. A fetcher takes the host at the top of the heap, if its time has arrived; pops one URL from that host\'s back queue; and after the fetch pushes the host back with `next allowed = now + delay` (about a second by default, longer for a slow server or a `Crawl-delay`).\n\nBecause each worker holds a lease on the URLs it is working on, and the frontier is **persisted** (queues on disk or in a log, only the hot head in memory), a crash loses at most work in progress. When a back queue empties, the router refills it from the front queues with the next URL for a new host.',
        followups: [
          { q: 'Why must the frontier be durable?', a: 'It represents everything discovered but not yet fetched, which is expensive to rediscover. Persist queue state, or be able to rebuild it from the URL metadata store (`state = queued`), and recover with leases that expire.' },
          { q: 'How do you stop high-priority work starving everything else?', a: 'Select among front queues with weighted probability (for example 8:4:2:1), age priorities upward over time, and reserve a share of throughput for the low queues.' },
          { q: 'What sets a URL\'s priority?', a: 'Combine host quality, a link-based importance estimate, freshness need (news sites high), and depth. State that the exact formula is tunable and that you would validate it by measuring how many crawled pages the downstream index actually uses.' }
        ] },
      { id: 'dedupe-url', title: 'URL deduplication: normalization and a Bloom filter',
        question: 'About 19,000 extracted links arrive per second. How do you avoid fetching the same page twice?',
        answer: 'Two steps: **normalize**, then **test membership**.\n\n**Normalize** so that equivalent URLs have one spelling: resolve relative links, lowercase the scheme and host, drop the default port and the `#fragment`, collapse `.` and `..` segments, sort query parameters, and strip known tracking and session parameters. Without this, `a=1&b=2` and `b=2&a=1` are two pages.\n\n```\nfunction normalize(href, base) {\n  const u = new URL(href, base);\n  if (u.protocol !== \'http:\' && u.protocol !== \'https:\') return null;\n  u.hash = \'\';\n  if ((u.protocol === \'http:\' && u.port === \'80\') || (u.protocol === \'https:\' && u.port === \'443\')) u.port = \'\';\n  const keep = [...u.searchParams].filter(([k]) => !DROP.test(k)).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);\n  u.search = new URLSearchParams(keep).toString();\n  if (u.pathname === \'\') u.pathname = \'/\';\n  return u.href;\n}\n```\n\nWith `DROP` matching `utm_*`, `fbclid`, `gclid` and session IDs, the inputs `../x/./y?b=2&a=1&utm_source=n#top` (against `https://Example.com/a/b/page.html`) and `HTTPS://EXAMPLE.COM:443/a/x/y?a=1&b=2` both become `https://example.com/a/x/y?a=1&b=2`. (Run to check.)\n\n**Membership**: an in-memory **Bloom filter** per node. For `n = 10 billion` URLs and a 1% false-positive rate you need about 9.6 bits per URL and 7 hash functions, so **about 12 GB** (about 18 GB at 0.1%). A Bloom filter has **no false negatives**, so anything it says is new really is new; it may wrongly call a new URL "seen" about 1 time in 100. For a crawler that is acceptable, since the page is usually reachable another way. Back it with the metadata store when you need the exact record.',
        followups: [
          { q: 'What are the limits of a Bloom filter here?', a: 'It cannot delete (a URL that should be recrawled is still "seen", so recrawl scheduling reads the metadata store, not the filter), it must be sized ahead of growth, and its false-positive rate rises as it fills. Rebuild it periodically from the metadata store, or use a scalable or cuckoo variant.' },
          { q: 'Is normalization always safe?', a: 'No. Lowercasing the path or dropping a parameter can merge pages that really differ (some sites are case-sensitive and some parameters select content). Normalize only what is known safe, and learn per-host rules (for example detecting that a parameter never changes the content).' },
          { q: 'How do you partition the seen-set?', a: 'By host, on the node that owns the host, so a link is checked locally. Links to other hosts are forwarded in batches to their owners, which also dedupe them.' }
        ] },
      { id: 'dedupe-content', title: 'Content fingerprints and near duplicates',
        question: 'Different URLs can serve the same or nearly the same page. How do you avoid storing and indexing all of them?',
        answer: 'Use two levels of fingerprint.\n\n- **Exact**: hash the normalized body (a 128-bit or 256-bit hash). Identical content under many URLs (mirrors, `http` versus `https`, `www` versus bare) collapses to one stored blob. Storing blobs keyed by this hash gives deduplication for free.\n- **Near duplicate**: pages that differ only in ads, timestamps or comment counts. Compute a **simhash**: a 64-bit signature where similar texts produce signatures with a small **Hamming distance** (count of differing bits). Treat pages within a distance of about 3 as near duplicates. Find candidates quickly by splitting the 64 bits into blocks and indexing by block, because two signatures within distance 3 must agree exactly on at least one block of a four-way split.\n\nBefore hashing, strip boilerplate and normalize whitespace so navigation and ads do not drown the signal. On a hit, store the URL as an alias of the canonical page instead of a new copy, and keep both URLs in metadata so link-based signals still count.',
        followups: [
          { q: 'Why simhash and not a plain hash?', a: 'A cryptographic hash changes completely when one character changes, so it only finds exact copies. A similarity hash changes a little when the text changes a little, which is what near-duplicate detection needs.' },
          { q: 'What about soft 404s and parked domains?', a: 'Many different URLs return the same "not found" template with HTTP 200. Near-duplicate detection within a host catches this: when a large share of a host\'s pages share one fingerprint, treat them as low value and stop crawling that pattern.' }
        ] },
      { id: 'politeness', title: 'robots.txt, politeness and backing off',
        question: 'What rules govern how fast and where you crawl, and how do you implement them?',
        answer: '**Fetch and cache robots.txt per host**, about once a day. Parse the group that matches your user agent. Follow the standard\'s conventions: if the file is **missing (4xx)**, everything is allowed; if the server is **erroring (5xx or unreachable)**, assume the site is disallowed until it recovers, and retry later. Honour `Disallow` and `Allow` rules, `Crawl-delay` where present (not all crawlers do, so state your choice), and use `Sitemap` entries as hints.\n\n**Politeness delay**: default about one request per second per host, longer if robots says so or if the server is slow. A standard heuristic is to scale the delay with the server\'s response time (so a slow, struggling server gets fewer requests). Cap concurrent connections per host at one or two.\n\n**Back off on signals**: on 429 or 503 honour `Retry-After`; otherwise use exponential backoff on the host\'s next-allowed time. After repeated failures, pause the host for hours. Identify yourself with a clear user agent and a contact URL.\n\nPoliteness state lives on the node that owns the host, so no cross-node coordination is needed. That is the main reason to partition by host.',
        followups: [
          { q: 'What if a site is huge, such as millions of pages?', a: 'It is bounded by politeness: at one request a second it takes weeks. Do not add machines for it. Crawl the most important pages first, use sitemaps and conditional requests, and accept partial coverage, or negotiate a higher rate with the owner.' },
          { q: 'Can robots.txt itself be used to attack the crawler?', a: 'Yes: huge or malformed files. Cap the size you read (a few hundred KB is a typical limit), set timeouts, and fall back to a safe default when parsing fails.' }
        ] },
      { id: 'dns', title: 'DNS as a hidden bottleneck',
        question: 'Why does a crawler need its own DNS handling?',
        answer: 'A fetch begins with resolving the host name. A lookup can take tens to hundreds of milliseconds, and the standard blocking call from the operating system often serialises or caches poorly. With about 380 fetches a second, plus bursts to many new hosts, naive resolution makes DNS the slowest part of the pipeline and can get you rate limited by the resolver.\n\nSolution: an **asynchronous, caching resolver** inside the crawler, with a cache keyed by host name and honouring the TTL (with a floor and a ceiling so very short TTLs do not cause storms and very long ones do not go stale). Because we partition by host, each node caches only its own hosts, which keeps the cache small (about 5 GB for 50 million hosts in total, approximate) and warm. Prefetch resolution for hosts that are about to be served by the frontier. Run your own recursive resolver close to the crawlers to avoid throttling.',
        followups: [
          { q: 'What if a host has several IP addresses?', a: 'Pick one per politeness window and respect the **host-level** delay rather than a per-IP delay, so you do not hit the same site through several addresses in parallel. Treat shared hosting carefully: many hosts on one IP can add up, so also cap requests per IP.' },
          { q: 'How do you avoid connecting to internal addresses?', a: 'Block private, loopback and link-local ranges after resolution, and re-check after every redirect. Otherwise a page can point the crawler at your own internal network (server-side request forgery).' }
        ] },
      { id: 'traps', title: 'Crawl traps and hostile pages',
        question: 'Some pages generate infinite links. How do you avoid being trapped?',
        answer: 'Classic traps: a calendar with a "next month" link forever; a URL whose path keeps growing (`/a/a/a/...`) through a relative-link bug; session IDs or sort parameters that make every visit a new URL; and pages deliberately built to waste crawlers.\n\nDefences are **budgets and pattern limits**, since you cannot always recognise a trap:\n\n- Cap **URL length** (for example 2,000 characters) and **depth** from the seed, and cap repeated path segments.\n- A **per-host budget**: a maximum number of pages per host per crawl cycle, scaled by the host\'s importance. A trap can burn only its own host\'s budget.\n- **Normalise away** session and tracking parameters, and learn per host which parameters never change content.\n- Use **content fingerprints**: a run of pages on one host with identical or near-identical fingerprints signals soft 404s or generated pages. Lower the host\'s priority.\n- Limit **redirect chains** and hard-cap the size and time of each fetch.\n\nMonitor for hosts consuming unusual shares of the budget, and alert so a human can add a blocking rule.',
        followups: [
          { q: 'How do you tell a trap from a genuinely huge site?', a: 'You cannot be certain. Importance limits the budget either way: a huge site gets a large but finite budget, and pages deep in a pattern with low link popularity and duplicate-looking content get low priority, so even if you are wrong you lose little.' },
          { q: 'What other malicious content can a page contain?', a: 'Huge responses, slow-drip responses, compression bombs, malformed HTML meant to exhaust a parser, and redirects to internal hosts. Enforce size, time, decompression and nesting limits in every stage.' }
        ] },
      { id: 'distributed', title: 'Distributing the crawl and handling failures',
        question: 'How do you scale across many machines and survive node failures?',
        answer: 'Partition by **host** with consistent hashing. Each node owns a slice of hosts and runs the whole pipeline for them: frontier back queues, politeness timers, robots and DNS caches, and the seen filter. No two nodes ever crawl the same host, so politeness is a local decision.\n\nWhen the parser finds a link to a host owned by another node, it **batches and forwards** the URL to that owner (an internal message), where it is normalised, checked against that node\'s filter and enqueued. Batching keeps cross-node traffic small, since most links on a page point to the same host (and so stay local).\n\nOn **node failure**, the hash ring reassigns its hosts to neighbours, who rebuild their frontier and filter from the **metadata store** (`state = queued` rows, and a Bloom filter rebuilt from URLs for those hosts). Leases and idempotent reports make duplicate work harmless. Adding a node moves only about `1/N` of the hosts.',
        followups: [
          { q: 'What if one node is much busier than the rest?', a: 'Hosts differ greatly in size. Use virtual nodes in the ring, track backlog per node, and move hosts (or split a very large host\'s non-politeness work, such as parsing) to balance. Politeness still caps any single host\'s rate.' },
          { q: 'Why not one central frontier?', a: 'At about 19,000 URL decisions a second it becomes both a bottleneck and a single point of failure, and every politeness check would be a network call. Host partitioning keeps decisions local.' }
        ] },
      { id: 'recrawl', title: 'Recrawl scheduling and freshness',
        question: 'Pages change. How do you decide when to revisit each one?',
        answer: 'Give every page a **next fetch time** and adapt it from history. If a recrawl finds the content unchanged (same content hash or a 304 Not Modified), grow the interval (for example multiply by 1.5 up to a cap such as 60 days). If it changed, shrink it (halve it down to a floor such as a few hours). Pages that always change (news front pages) converge to short intervals, static pages to long ones.\n\nWeight by **importance**: a page many users reach, or whose changes feed fresh results, deserves a shorter interval than an obscure page that changes just as often. Use **conditional requests** (`ETag` or `Last-Modified`), so an unchanged page costs the site almost nothing and costs you no parsing or storage. Use **sitemaps** and their `lastmod` as hints, but verify, since they are sometimes wrong.\n\nThe scheduler picks due pages (index metadata by host and next-fetch time) and feeds them into the frontier with a priority that combines importance and staleness. Budget: a recrawl competes with new discovery for the same 380 pages a second, so decide the split deliberately (for example 70% recrawl and 30% new).',
        followups: [
          { q: 'How do you balance new pages against recrawls?', a: 'Reserve a share of throughput for each, adjust by measured value, and let urgent categories (news) use a faster lane. State the split as a product decision, not a technical one.' },
          { q: 'How do you detect that a page changed in a way that matters?', a: 'Compare content fingerprints of the main text after boilerplate removal. A change in ads or a timestamp should not count as an update.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Politeness caps a single host', problem: 'Large sites are limited by their own tolerance (about one request a second), so adding crawler nodes does not speed them up and they dominate the frontier backlog.', mitigation: 'Crawl breadth across many hosts for parallelism, prioritize the most important pages of big hosts, use sitemaps and conditional requests, and set a per-host budget.' },
      { title: 'DNS resolution speed', problem: 'Slow or throttled lookups stall fetchers, especially for newly discovered hosts.', mitigation: 'Asynchronous caching resolver, prefetch for hosts about to be served, honour TTLs with a floor, and run local recursive resolvers.' },
      { title: 'The URL-seen check at 19,000 a second', problem: 'A database lookup per extracted link would dominate cost and latency.', mitigation: 'In-memory Bloom filter sharded by host, with the metadata store consulted only when an exact record is needed; rebuild the filter periodically.' },
      { title: 'Frontier size and durability', problem: 'Hundreds of millions of queued URLs do not fit in memory, and losing the frontier loses the discovered web.', mitigation: 'Keep the hot head of each queue in memory and spill the rest to disk or a log; persist state and rebuild from the metadata store after failures.' },
      { title: 'Crawl traps and junk', problem: 'Infinite generated URLs and soft-404 templates waste capacity and storage.', mitigation: 'URL length and depth caps, per-host budgets, parameter normalization, fingerprint-based junk detection, and alerts on abnormal hosts.' },
      { title: 'Hot partitions by host', problem: 'Partitioning by host puts a very large host on one node, and a skewed hash can load some nodes more than others.', mitigation: 'Virtual nodes, per-node backlog monitoring, moving hosts between nodes, and separating CPU-heavy parsing from host ownership if needed.' },
      { title: 'Bloom filter growth', problem: 'The filter fills as the URL universe grows, and its false-positive rate climbs while it cannot delete entries.', mitigation: 'Size for future growth, monitor fill ratio, and rebuild from the metadata store on a schedule or use a scalable variant.' }
    ],

    mistakes: [
      'Using one **global FIFO or priority queue** and ignoring per-host politeness.',
      'Partitioning by **URL hash**, so no node can enforce a host\'s delay or share its robots and DNS caches.',
      'Skipping **URL normalization**, so the same page is fetched under many spellings.',
      'Storing the seen-set in a **database with a lookup per link** instead of an in-memory filter.',
      'Treating a Bloom filter as exact: it has false positives, cannot delete, and fills up.',
      'Fetching **robots.txt on every request**, or not caching it and DNS answers per host.',
      'Ignoring **crawl traps**: no depth, length or per-host budget.',
      'Having no **recrawl policy**, or recrawling everything at one fixed interval.',
      'Forgetting **timeouts and size limits** on fetches, so one slow server ties up workers.',
      'Not planning for **duplicate content**: the same page under mirrors and parameters is stored and indexed several times.',
      'Retrying immediately on **429 or 5xx** instead of backing off, which makes you a bad neighbour and gets you blocked.'
    ],

    pushes: [
      { q: 'How do you make sure you never hit one site too hard?', why: 'Politeness is the defining constraint of a crawler.', good: 'Per-host back queues with a next-allowed-time heap, robots.txt Crawl-delay, a delay that scales with response time, backoff on 429 and 5xx, and host ownership by one node so the limit is enforced locally.' },
      { q: 'How do you avoid crawling the same URL twice at this scale?', why: 'They want normalization plus a data structure with a stated trade-off.', good: 'Normalize first. Then an in-memory Bloom filter: about 12 GB for 10 billion URLs at 1%, no false negatives, a 1% loss of new URLs, no deletion; exact record in the metadata store.' },
      { q: 'What if the same content lives at many URLs?', why: 'URL dedupe alone does not solve duplicates.', good: 'Exact hash of normalized content, simhash with a small Hamming distance for near duplicates, store once keyed by hash, keep aliases.' },
      { q: 'How would you handle a crawl trap like an infinite calendar?', why: 'Real web hostility.', good: 'Per-host budget, depth and URL length caps, parameter normalization, fingerprint-based duplicate detection, and priority decay for low-value patterns; you cannot always recognise a trap, so you bound the damage.' },
      { q: 'How do you partition work and what happens when a node dies?', why: 'Distributed systems fundamentals.', good: 'Consistent hashing by host; each node owns frontier, politeness and caches for its hosts; forward cross-host links in batches; rebuild a lost node\'s state from the metadata store; leases and idempotent reports.' },
      { q: 'How do you decide how often to recrawl?', why: 'It shows you think beyond the first pass.', good: 'Adaptive intervals from change history, weighted by importance, with conditional requests and sitemap hints, and an explicit split of throughput between recrawl and new discovery.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why is a crawler\'s work usually partitioned by host rather than by URL hash?', choices: ['One node can then enforce that host\'s politeness and keep its robots and DNS state local', 'Hosts are all the same size so load is even', 'It makes the Bloom filter exact', 'URL hashes cannot be computed'], answer: 0, explain: 'Politeness needs one place that knows the last request time for a host. Partitioning by URL scatters a host across nodes and loses that.' },
      { kind: 'concept', q: 'What does a Bloom filter guarantee about the "URL already seen?" check?', choices: ['No false negatives, but some false positives', 'No false positives, but some false negatives', 'Exact answers', 'It can delete old URLs'], answer: 0, explain: 'If it says "not seen" the URL is definitely new. It may wrongly say "seen" for a small fraction of new URLs, which a crawler tolerates.' },
      { kind: 'complexity', q: 'About how much memory does a Bloom filter need for 10 billion URLs at a 1% false-positive rate?', choices: ['About 12 GB', 'About 12 MB', 'About 1.2 TB', 'About 120 GB'], answer: 0, explain: 'The standard formula gives about 9.6 bits per element: 10B x 9.6 bits is about 96 Gbit, or 12 GB, with about 7 hash functions.' },
      { kind: 'concept', q: 'The frontier must give important URLs priority yet respect per-host delay. What structure does that?', choices: ['Priority front queues feeding per-host back queues, with a heap of next-allowed times', 'A single FIFO queue', 'One global priority queue only', 'A random shuffle of all URLs'], answer: 0, explain: 'Priority decides what enters; per-host queues and the timing heap decide when a URL may leave. A single queue can satisfy only one constraint.' },
      { kind: 'concept', q: 'According to the common robots.txt conventions, what should a crawler do when robots.txt returns a server error (5xx)?', choices: ['Treat the site as disallowed for now and retry later', 'Assume everything is allowed', 'Crawl at double speed', 'Delete the host from the frontier forever'], answer: 0, explain: 'A missing file (4xx) means allowed; an unreachable or erroring server means assume disallowed until it recovers.' },
      { kind: 'concept', q: 'Pick every sensible defence against crawl traps.', choices: ['A per-host page budget', 'Caps on URL length and depth', 'Stripping session and tracking parameters', 'Increasing the crawl speed on suspicious hosts'], answer: [0, 1, 2], explain: 'Speeding up on a suspicious host just burns more capacity on the trap. Budgets, caps and normalization bound the damage.' },
      { kind: 'concept', q: 'What do you get from a conditional request on a recrawl?', choices: ['A 304 Not Modified, saving the site bandwidth and us parsing and storage', 'A faster DNS lookup', 'Exemption from robots.txt', 'A guarantee the page is unchanged forever'], answer: 0, explain: 'Sending the stored ETag or Last-Modified lets the server answer 304 with no body when nothing changed.' }
    ],

    flashcards: [
      { id: 'frontier-2stage', front: 'How does the crawler frontier combine priority and politeness?', back: 'Priority front queues feed per-host back queues. A min-heap of each host\'s next allowed time releases a URL only when its delay has passed. Persist it; leases recover from worker crashes.' },
      { id: 'partition-host', front: 'Why partition a crawl by host?', back: 'One node owns a host: it enforces politeness locally and keeps that host\'s robots rules, DNS answer, seen-state and queue in memory. Use consistent hashing; forward cross-host links to owners in batches.' },
      { id: 'bloom', front: 'Bloom filter sizing and properties for URL-seen?', back: 'About 9.6 bits per URL and 7 hash functions for 1% false positives: ~12 GB for 10B URLs. No false negatives, cannot delete, fills up. Back with the metadata store for exact records.' },
      { id: 'normalize', front: 'What does URL normalization do?', back: 'Resolve relative links, lowercase scheme and host, drop default port and fragment, collapse dot segments, sort query parameters, strip tracking and session parameters, so equivalent URLs share one spelling.' },
      { id: 'simhash', front: 'Exact hash vs simhash for page dedupe?', back: 'Exact hash finds identical bodies only. Simhash is a 64-bit similarity signature; pages within a small Hamming distance (about 3) are near duplicates. Store once, keep URL aliases.' },
      { id: 'robots', front: 'robots.txt handling rules?', back: 'Cache per host about daily. 4xx or missing: allowed. 5xx or unreachable: treat as disallowed and retry later. Honour Disallow/Allow, Crawl-delay if used; cap file size and parse time.' },
      { id: 'recrawl', front: 'Adaptive recrawl policy?', back: 'Unchanged (same hash or 304): lengthen the interval. Changed: shorten it. Weight by importance, use ETag/Last-Modified conditional requests, and split throughput between recrawl and new discovery.' },
      { id: 'traps', front: 'How to defend against crawl traps?', back: 'Per-host page budget, URL length and depth caps, parameter normalization, fingerprint-based duplicate detection, redirect and size limits, and alerts on hosts using unusual budget.' }
    ]
  });
})();
