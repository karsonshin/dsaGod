/* System design fundamentals, part 4: consistent hashing, blob storage, search, observability. Schema: data/sd/schema.md */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.fundamentals = SD.fundamentals || [];
  SD.fundamentals.push(
    {
      id: 'consistent-hashing', title: 'Consistent hashing', group: 'Distributed systems',
      hook: 'Spread keys over many nodes so that adding or removing a node moves only a small share of them.',
      keywords: 'consistent hashing ring virtual nodes vnodes rebalancing partition cache sharding',
      sections: [
        { title: 'The problem with hash mod N',
          md: 'The obvious way to place a key on one of `N` servers is `server = hash(key) mod N`. It spreads keys evenly, but when `N` changes almost every key maps to a different server. For a cache that means nearly everything misses at once; for a database it means moving most of the data.\n\n**Consistent hashing** fixes this. Hash both keys and servers onto the same circular space (a **ring**). A key belongs to the first server found going **clockwise** from the key\'s position. Now:\n\n- **Adding** a server takes over only the keys between it and the previous server on the ring. About `1/N` of the keys move, all of them to the new server.\n- **Removing** a server hands its keys to the next server clockwise. Nothing else moves.',
          viz: 'ring', caption: 'Press play, then change the keys or the points per server. The last two steps add server D and remove server B; compare how many keys move with plain hash mod N.' },
        { title: 'Virtual nodes',
          md: 'With one point per server the arcs are uneven: one server can own a big arc and take most keys, and when it leaves its whole load lands on a single neighbor. Try one point per server in the player above and watch the counts.\n\nThe fix is **virtual nodes**: each physical server is placed on the ring many times (tens to hundreds of points). Arcs average out, so load is even; a failed server\'s keys spread over many survivors instead of one; and bigger servers can take proportionally more points.\n\nThe cost is bookkeeping: the ring is a sorted structure of `servers x points` entries (a few thousand is tiny) and lookups are a binary search, `O(log n)`.\n\nUsed by: Dynamo-style stores and Cassandra for partitioning, memcached client libraries and cache tiers, and load balancers that need requests for a key to keep landing on the same backend.',
          diagram: { title: 'Client library routing keys on a ring',
            nodes: [
              { id: 'app', label: 'App with ring client', kind: 'service', detail: { why: 'Holds the ring (a sorted list of points) and finds the owner of a key with a binary search. No network call is needed to decide.', tradeoffs: ['Every client must have the same ring view, so membership changes must propagate.'], scale: 'Stale rings during changes briefly route keys to the old owner.' } },
              { id: 'n1', label: 'Cache node A', kind: 'cache', detail: { why: 'Owns several arcs of the ring via virtual nodes.', tradeoffs: ['More virtual nodes give a more even spread but a larger ring to store and update.'] } },
              { id: 'n2', label: 'Cache node B', kind: 'cache', detail: { why: 'If it fails, its arcs go to many different nodes, so no single survivor takes the whole load.' } },
              { id: 'n3', label: 'Cache node C', kind: 'cache', detail: { why: 'A new node steals only a slice from each neighbor, so the cache stays mostly warm.' } }
            ],
            edges: [{ from: 'app', to: 'n1', label: 'keys' }, { from: 'app', to: 'n2' }, { from: 'app', to: 'n3' }] } }
      ],
      takeaways: ['hash(key) mod N reshuffles almost every key when N changes.', 'On a ring, adding or removing a node moves only about 1/N of the keys.', 'Virtual nodes even out load and spread a failed node\'s keys over many neighbors.', 'Replication on a ring: copy each key to the next R servers clockwise.'],
      quiz: [
        { kind: 'concept', q: 'You add a fifth server to four using hash(key) mod N. Roughly what fraction of keys change server?', choices: ['About 80%', 'About 20%', 'About 5%', 'None'], answer: 0, explain: 'A key stays only when hash mod 4 equals hash mod 5, which is rare (about one in five). With a ring only about 1/5 would move.' },
        { kind: 'concept', q: 'On a consistent-hash ring a server is removed. What happens to its keys?', choices: ['They go to the next server clockwise', 'All keys on the ring are reassigned', 'They are deleted', 'They are split evenly across every server'], answer: 0, explain: 'Each key finds the first server clockwise, which is now the removed server\'s successor. Other keys keep their owner.' },
        { kind: 'concept', q: 'Why use many virtual nodes per server?', choices: ['To even out load and spread a failed server\'s keys over many nodes', 'To make lookups O(1)', 'To avoid hashing keys', 'To remove the need for replication'], answer: 0, explain: 'One point per server gives uneven arcs. Many points average out and let a failure fan out across many survivors.' }
      ],
      flashcards: [
        { id: 'ring-rule', front: 'Ownership rule on a consistent-hash ring?', back: 'A key belongs to the first server point found clockwise from the key\'s hash. Adding or removing a server moves only the keys next to it.' },
        { id: 'mod-n', front: 'Why is hash(key) mod N bad when N changes?', back: 'Almost every key maps to a different server, so a cache goes cold or most data must move. A ring moves about 1/N of keys.' },
        { id: 'vnodes', front: 'What are virtual nodes?', back: 'Each physical server appears at many points on the ring. They even out load, spread a failed node\'s keys across many neighbors, and allow weighting by capacity.' }
      ]
    },
    {
      id: 'blob-storage', title: 'Blob and object storage', group: 'Storage',
      hook: 'Store large files cheaply and durably, keep metadata elsewhere, and move bytes without going through your servers.',
      keywords: 's3 object storage blob upload presigned url multipart chunking dedupe erasure coding cdn metadata',
      sections: [
        { title: 'Objects, not files',
          md: '**Object storage** (S3, GCS, Azure Blob) stores immutable-ish **objects** (the bytes plus metadata) in flat **buckets**, addressed by key, accessed over HTTP. It scales almost without limit, replicates across zones for very high durability, and is cheap per gigabyte. What it is not: a file system (no in-place edits, no real directories, listing is slow) and not a low-latency database (first-byte latency is tens of milliseconds).\n\nThe standard split: **bytes in object storage, metadata in a database.** The database row holds the object key, size, owner, content type and status; queries run against the database, downloads against the store.\n\nUploading large files through your own servers wastes their bandwidth and memory. Instead the server hands the client a **pre-signed URL**: a temporary, scoped link that lets the client upload straight to storage. Large files use **multipart upload** (chunks in parallel, retry just the failed part, resume after a drop).',
          diagram: { title: 'Direct upload with pre-signed URLs',
            nodes: [
              { id: 'client', label: 'Client', kind: 'client', detail: { why: 'Uploads the bytes straight to storage, in parallel chunks for big files.', tradeoffs: ['The client must handle retries and resume for flaky networks.'] } },
              { id: 'api', label: 'API service', kind: 'service', detail: { why: 'Checks permission, creates the metadata row, and issues a short-lived pre-signed URL. It never touches the file bytes.', tradeoffs: ['Keeps the API small and cheap, but you must confirm the upload finished before marking it available.'] } },
              { id: 'meta', label: 'Metadata DB', kind: 'db', detail: { why: 'Owner, key, size, checksum, status (pending, ready). Queries and listing run here, not against the bucket.', scale: 'Metadata rows are tiny, so this scales with a normal sharded database.' } },
              { id: 'blob', label: 'Object storage', kind: 'storage', detail: { why: 'Holds the bytes, replicated across zones for durability (commonly quoted as 11 nines for the major providers).', tradeoffs: ['Cheap and durable, but higher first-byte latency than a disk or cache.', 'Storage tiers trade cost for retrieval speed.'], alternatives: ['S3', 'Google Cloud Storage', 'Azure Blob', 'Self-hosted (Ceph, MinIO)'], scale: 'Request-rate limits per prefix and egress cost, not capacity.' } },
              { id: 'cdn', label: 'CDN', kind: 'cdn', detail: { why: 'Serves popular downloads from the edge so they do not hit storage each time.', tradeoffs: ['Private content needs signed URLs or cookies at the edge.'] } }
            ],
            edges: [{ from: 'client', to: 'api', label: 'request URL' }, { from: 'api', to: 'meta' }, { from: 'client', to: 'blob', label: 'upload bytes' }, { from: 'blob', to: 'cdn', label: 'origin' }],
            scenarios: [
              { id: 'up', label: 'Upload', steps: [{ title: 'Ask to upload', path: ['client', 'api'], note: 'The client sends file name, size and type.' }, { title: 'Create metadata', path: ['api', 'meta'], note: 'A row is created with status pending, and a pre-signed URL (or multipart session) is returned.' }, { title: 'Upload directly', path: ['client', 'blob'], note: 'The bytes go straight to object storage in parallel chunks. The API servers carry none of the data.' }, { title: 'Confirm', path: ['client', 'api', 'meta'], note: 'The client (or a storage event) tells the API the upload completed; the row becomes ready after checking size or checksum.' }] },
              { id: 'down', label: 'Download', steps: [{ title: 'Request', path: ['client', 'cdn'], note: 'Popular files are fetched through the CDN.' }, { title: 'Origin fetch on miss', path: ['cdn', 'blob'], tone: 'hard', note: 'On a miss the CDN reads from object storage and caches the file.' }] }
            ] } },
        { title: 'Design points for large files',
          md: '- **Chunking and dedupe**: split files into fixed-size chunks (for example 4 to 8 MB), hash each, and store a chunk only once. Syncing or editing a large file then re-uploads only changed chunks, and identical files share storage. Costs: more metadata, and a chunk map per file.\n- **Durability** comes from replication (several copies across zones) or **erasure coding** (split data into `k` data pieces plus `m` parity pieces; any `k` of the `k+m` rebuild the file). Erasure coding uses about `(k+m)/k` of the raw size, for example 1.5x, instead of 3x for triple replication, at the price of CPU and rebuild traffic.\n- **Lifecycle**: move old objects to cheaper, slower tiers and delete expired ones automatically.\n- **Integrity**: store a checksum and verify after upload.\n- **Large video**: transcode into several resolutions in a background job fed by a queue, and serve segments over a CDN.' }
      ],
      takeaways: ['Bytes in object storage, metadata in a database.', 'Pre-signed URLs and multipart upload keep file traffic off your servers.', 'Chunk and hash to dedupe and to resume.', 'Erasure coding saves space versus replication at the cost of CPU and rebuild traffic.'],
      quiz: [
        { kind: 'concept', q: 'Why issue a pre-signed URL instead of accepting uploads through the API servers?', choices: ['The bytes bypass the API servers, saving their bandwidth and memory', 'It makes the file smaller', 'It removes the need for metadata', 'Object storage cannot accept direct uploads otherwise'], answer: 0, explain: 'Large transfers go client to storage directly. The API only authorizes and records metadata.' },
        { kind: 'concept', q: 'Where should the owner, size and status of an uploaded file live?', choices: ['In a metadata database, with the key pointing at the object', 'Only in the object\'s file name', 'In the CDN', 'In each client'], answer: 0, explain: 'Listing and querying object storage is slow and limited. A database row per object makes queries cheap.' },
        { kind: 'concept', q: 'An erasure code with 10 data and 4 parity pieces stores how much relative to the original data?', choices: ['1.4x', '3x', '0.4x', '14x'], answer: 0, explain: '(10 + 4) / 10 = 1.4x, and it survives losing any 4 pieces, versus 3x for triple replication tolerating 2 lost copies.' }
      ],
      flashcards: [
        { id: 'presigned', front: 'What is a pre-signed URL?', back: 'A temporary, scoped link generated by your server that lets a client upload or download an object directly to or from object storage, with no file bytes passing through your servers.' },
        { id: 'meta-split', front: 'How do you store user files at scale?', back: 'Bytes in object storage addressed by key; a metadata database (owner, key, size, checksum, status) for queries; a CDN for popular downloads.' },
        { id: 'erasure', front: 'Erasure coding vs replication?', back: 'Erasure coding stores k data + m parity pieces (about (k+m)/k overhead) and rebuilds from any k. Cheaper storage than 3x replication, but more CPU and rebuild traffic.' }
      ]
    },
    {
      id: 'search-indexes', title: 'Search and inverted indexes', group: 'Storage',
      hook: 'Why LIKE \'%word%\' does not scale, and how an inverted index answers text queries fast.',
      keywords: 'search inverted index elasticsearch lucene tokenization ranking tf-idf bm25 sharding typeahead trie sync',
      sections: [
        { title: 'The inverted index',
          md: 'A database can find rows by key. It cannot efficiently find rows that **contain a word**: `WHERE body LIKE \'%pizza%\'` scans every row. Full-text search flips the structure.\n\nAn **inverted index** maps each **term** to the list of documents containing it (a **postings list**):\n\n```\npizza -> [doc3, doc9, doc12]\nrecipe -> [doc3, doc4]\n```\n\nBuilding it: **tokenize** the text (split into words), **normalize** (lowercase, strip punctuation), drop **stop words**, **stem** (running to run), and record postings, often with positions for phrase queries. A query for `pizza recipe` looks up both postings lists and **intersects** them; the survivors are **ranked**, usually by BM25 (a refinement of TF-IDF: terms that are frequent in the document but rare overall score higher).\n\nEngines: **Lucene** is the core library; **Elasticsearch** and **OpenSearch** wrap it in a distributed service; Solr is similar. Typeahead and autocomplete use a **trie** or prefix index over popular queries.',
          diagram: { title: 'Search as a derived copy of the source of truth',
            nodes: [
              { id: 'app', label: 'App service', kind: 'service', detail: { why: 'Writes to the primary database and serves user searches from the index.' } },
              { id: 'db', label: 'Primary database', kind: 'db', detail: { why: 'The source of truth. The search index is a derived copy and can always be rebuilt from here.', tradeoffs: ['Never make the search index the only copy of any data.'] } },
              { id: 'q', label: 'Change events', kind: 'queue', detail: { why: 'Carries inserts, updates and deletes to the indexer, decoupling the app from index availability.', tradeoffs: ['Index lags the database by seconds. Deletes must be propagated too.'], alternatives: ['Change data capture from the database log', 'Dual writes (risky: they can disagree)'] } },
              { id: 'idx', label: 'Indexer', kind: 'service', detail: { why: 'Tokenizes documents and updates the index. Can re-index everything after a schema change.', scale: 'Bulk re-indexing competes with live traffic.' } },
              { id: 'search', label: 'Search cluster', kind: 'search', detail: { why: 'Sharded inverted index with replicas. A query goes to every shard, each returns its top hits, and a coordinator merges them.', tradeoffs: ['Scatter-gather means query latency is set by the slowest shard.', 'Near-real-time, not instant: new documents become searchable after a refresh interval.'], alternatives: ['Elasticsearch', 'OpenSearch', 'Solr', 'Postgres full-text search for small data'], scale: 'Shard count is hard to change later; deep pagination is expensive.' } }
            ],
            edges: [{ from: 'app', to: 'db', label: 'write' }, { from: 'db', to: 'q', label: 'changes', style: 'async' }, { from: 'q', to: 'idx', style: 'async' }, { from: 'idx', to: 'search' }, { from: 'app', to: 'search', label: 'query' }] } },
        { title: 'Scaling and keeping it in sync',
          md: '**Sharding**: split the index across nodes, usually by document ID, so each shard indexes a slice. A query is a **scatter-gather**: ask every shard for its top results and merge. Add replicas for read capacity and failover.\n\n**Keeping it in sync**: treat the index as a derived view. Capture changes from the primary (change data capture from the database log or an outbox table), pass them through a queue, and let an indexer apply them. Expect seconds of lag, support a full rebuild, and make updates idempotent by document version.\n\n**Relevance beyond text match**: boost by field (title over body), recency, popularity and personalization; handle typos with fuzzy matching (edit distance), and synonyms.\n\n**Typeahead**: a prefix lookup must respond in tens of milliseconds, so serve it from an in-memory trie or a prefix index of top queries per prefix, refreshed periodically, and cache results at the CDN or client.' }
      ],
      takeaways: ['An inverted index maps terms to document lists; queries intersect them and rank.', 'Search is a derived copy: the database stays the source of truth.', 'Sync via change events; accept lag; support full re-index.', 'Sharded search is scatter-gather: tail latency follows the slowest shard.'],
      quiz: [
        { kind: 'concept', q: 'Why is LIKE \'%word%\' a poor way to search large text columns?', choices: ['It must scan every row because an ordinary index cannot help', 'It does not support lowercase', 'It only works with numbers', 'It returns too few results'], answer: 0, explain: 'A leading wildcard defeats B-tree indexes. An inverted index jumps straight to the documents containing the term.' },
        { kind: 'concept', q: 'What is the safest role for a search index in the architecture?', choices: ['A derived copy rebuilt from the primary database', 'The only store of the data', 'A replacement for transactions', 'A cache of user sessions'], answer: 0, explain: 'Indexes lag and can corrupt or be lost. Keep the source of truth elsewhere so the index can be rebuilt.' },
        { kind: 'concept', q: 'A sharded search cluster has one slow shard. What happens to query latency?', choices: ['The whole query is as slow as the slowest shard', 'Only results from that shard are slow', 'Nothing; shards are independent', 'Queries skip it automatically without any setting'], answer: 0, explain: 'Scatter-gather waits for all shards before merging, so the tail of the slowest shard dominates unless you set timeouts and accept partial results.' }
      ],
      flashcards: [
        { id: 'inverted', front: 'What is an inverted index?', back: 'A map from each term to the list of documents containing it (postings list). A query looks up its terms, intersects the lists and ranks the results.' },
        { id: 'index-sync', front: 'How do you keep a search index in sync with the database?', back: 'Capture changes (CDC or outbox), send them through a queue to an indexer, make updates idempotent by version, accept seconds of lag, and keep a full re-index path.' },
        { id: 'bm25', front: 'What does BM25 favor?', back: 'Terms that appear often in a document but are rare across the corpus, with document length normalization. A refinement of TF-IDF.' }
      ]
    },
    {
      id: 'observability', title: 'Monitoring and observability', group: 'Operating it',
      hook: 'Logs, metrics and traces, the four golden signals, and how to alert without waking people for nothing.',
      keywords: 'monitoring observability metrics logs traces golden signals latency traffic errors saturation slo sli alerting percentiles p99',
      sections: [
        { title: 'Three signals and four questions',
          md: 'You cannot operate what you cannot see. The three pillars:\n\n- **Metrics**: numbers over time (requests per second, error rate, latency percentiles, queue depth). Cheap, aggregatable, good for dashboards and alerts.\n- **Logs**: event records with context. Rich but voluminous; make them structured (JSON) and include a request ID.\n- **Traces**: the path of one request through many services, with the time spent in each. The tool for "why was this slow?".\n\nGoogle\'s **four golden signals** say what to measure for any service:\n\n1. **Latency**: how long requests take (separate successes from failures).\n2. **Traffic**: how much demand it is serving.\n3. **Errors**: the rate of failed requests.\n4. **Saturation**: how full the most constrained resource is (CPU, memory, connections, queue depth).\n\nReport latency as **percentiles** (p50, p95, p99), never the average: a few very slow requests hide in a mean but define the experience for many users, especially when one page makes dozens of calls.',
          diagram: { title: 'Telemetry pipeline',
            nodes: [
              { id: 'svc', label: 'Services', kind: 'service', detail: { why: 'Emit metrics, structured logs and trace spans, tagged with a request ID that follows the call across services.', tradeoffs: ['Instrumentation costs a little CPU and must be consistent across teams.'] } },
              { id: 'agent', label: 'Collector / agent', kind: 'service', detail: { why: 'Batches, samples and forwards telemetry so services are not slowed by the backends.', tradeoffs: ['Sampling traces saves cost but can drop the one you need; keep all errors and slow requests.'] } },
              { id: 'metrics', label: 'Metrics store', kind: 'db', detail: { why: 'Time-series storage for dashboards and alert rules.', alternatives: ['Prometheus', 'Cloud monitoring services'], scale: 'High-cardinality labels (user ID as a label) can explode storage.' } },
              { id: 'logs', label: 'Log and trace store', kind: 'search', detail: { why: 'Searchable logs and trace lookup by request ID.', scale: 'Volume and retention cost; keep detailed logs briefly.' } },
              { id: 'alert', label: 'Alerting', kind: 'external', detail: { why: 'Evaluates rules and pages a human when users are affected.', tradeoffs: ['Alert on symptoms (error rate, latency SLO burn), not on every cause, or people stop trusting pages.'] } }
            ],
            edges: [{ from: 'svc', to: 'agent', style: 'async' }, { from: 'agent', to: 'metrics', style: 'async' }, { from: 'agent', to: 'logs', style: 'async' }, { from: 'metrics', to: 'alert' }] } },
        { title: 'SLIs, SLOs and good alerts',
          md: 'An **SLI** (indicator) is a measurement, such as the fraction of requests served under 300 ms. An **SLO** (objective) is the target, such as 99.9% over 30 days. The gap between 100% and the SLO is the **error budget**: the failure you may spend on releases and risk. When the budget is burning fast, slow down changes; when there is plenty, ship.\n\nAlerting rules of thumb:\n\n- **Page on symptoms users feel** (high error rate, SLO burn rate), not on causes (one CPU at 90%).\n- Every page should be **actionable** and link to a runbook. If nobody acts, delete or demote the alert.\n- Use **burn-rate alerts** over two windows (fast and slow) to catch both sudden and slow failures.\n- Add **health checks** (is it up) and **synthetic probes** (does the user flow work end to end) from outside.\n\nIn a design interview, close with the two or three signals you would watch for each component: queue lag for a queue, cache hit ratio for a cache, replication lag for a database, p99 latency and error rate for the API.' }
      ],
      takeaways: ['Metrics tell you something is wrong, traces tell you where, logs tell you why.', 'Watch latency percentiles, traffic, errors and saturation.', 'Alert on user-visible symptoms and burn rate; every page needs an action.', 'Name the key health signal for each component in your design.'],
      quiz: [
        { kind: 'concept', q: 'Why report p99 latency instead of the average?', choices: ['Averages hide the slow tail that many users experience', 'p99 is cheaper to compute', 'The average is always lower', 'Percentiles ignore errors'], answer: 0, explain: 'A mean can look healthy while one in a hundred requests takes seconds. A page that makes many calls hits the tail often.' },
        { kind: 'concept', q: 'Which is the best thing to page someone for?', choices: ['A sustained rise in the user-facing error rate', 'One server\'s CPU reaching 90% briefly', 'Disk usage at 40%', 'A single failed health check on a replaced node'], answer: 0, explain: 'Page on symptoms users feel. Causes like transient CPU spikes belong on dashboards unless they threaten the SLO.' },
        { kind: 'concept', q: 'Which signal tells you where a slow request spent its time across services?', choices: ['Distributed traces', 'CPU metrics', 'Disk logs', 'DNS TTLs'], answer: 0, explain: 'A trace follows one request through each hop with timing for each span.' },
        { kind: 'concept', q: 'Which of these are among the four golden signals?', choices: ['Latency', 'Traffic', 'Saturation', 'Number of engineers on call'], answer: [0, 1, 2], explain: 'The four are latency, traffic, errors and saturation.' }
      ],
      flashcards: [
        { id: 'golden', front: 'The four golden signals?', back: 'Latency, traffic, errors, saturation. Measure all four for every service; report latency as percentiles.' },
        { id: 'slo-budget', front: 'What is an error budget?', back: 'The allowed failure implied by an SLO (for 99.9%, 0.1%). Spend it on releases and risk; when it burns too fast, slow down changes.' },
        { id: 'three-pillars', front: 'Metrics vs logs vs traces?', back: 'Metrics: cheap aggregates over time for alerts. Logs: detailed events for why. Traces: one request across services for where the time went.' }
      ]
    }
  );
})();
