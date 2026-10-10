/* System design fundamentals, part 2: caching and databases. Schema: data/sd/schema.md */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.fundamentals = SD.fundamentals || [];
  SD.fundamentals.push(
    {
      id: 'caching', title: 'Caching strategies', group: 'Data',
      hook: 'Cache-aside, read-through, write-through and write-back: who talks to the cache, and what you risk.',
      keywords: 'cache aside read through write through write back write behind redis memcached',
      sections: [
        { title: 'Why cache, and where',
          md: 'A cache keeps a copy of data in something faster than its source. It pays off when reads far outnumber writes and some data is read again and again (a skewed distribution). The usual places, nearest the user first: the **browser**, a **CDN**, an **in-process** cache inside the app, a **distributed cache** (Redis, Memcached), and the database\'s own buffer pool.\n\nA cache trades **freshness** and **complexity** for **speed** and **load reduction**. The hit ratio decides whether it is worth it: at a 90% hit rate the backing store sees one tenth of the reads.' },
        { title: 'The four patterns',
          md: '- **Cache-aside (lazy loading)**: the app checks the cache; on a miss it reads the database, then puts the value in the cache. The app owns both. Simple, resilient (the cache can die), the default choice. Risk: stale data after a write, and a slow first read.\n- **Read-through**: the app asks only the cache; the cache itself loads from the database on a miss. Same behavior as cache-aside with the loading logic inside the cache layer.\n- **Write-through**: every write goes to the cache and the database together, synchronously. Reads are fresh, writes pay both latencies. Good when you read data right after writing it.\n- **Write-back (write-behind)**: write to the cache, acknowledge, and flush to the database later in batches. Fastest writes and coalesces repeated updates, but data can be **lost** if the cache dies before the flush.\n\nA fifth, **write-around**, writes straight to the database and skips the cache, so write-once data does not evict useful entries.',
          diagram: { title: 'Cache-aside read and write',
            nodes: [
              { id: 'app', label: 'Application', kind: 'service', detail: { why: 'In cache-aside the application owns the logic: check the cache, fall back to the database, fill the cache.', tradeoffs: ['Every service that reads this data must implement the same logic, or share a library.'] } },
              { id: 'cache', label: 'Cache', kind: 'cache', detail: { why: 'Fast key-value store, usually in memory.', tradeoffs: ['Bounded size, so it evicts.', 'Can be stale after a write.'], alternatives: ['Redis', 'Memcached', 'In-process map'], scale: 'Memory and, for one hot key, a single node\'s network.' } },
              { id: 'db', label: 'Database', kind: 'db', detail: { why: 'The source of truth.', scale: 'If the hit ratio drops, this absorbs the full read load.' } }
            ],
            edges: [{ from: 'app', to: 'cache', label: 'get / set' }, { from: 'app', to: 'db', label: 'on miss' }],
            scenarios: [
              { id: 'read-hit', label: 'Read, hit', steps: [{ title: 'Check cache', path: ['app', 'cache'], note: 'The value is in the cache: return it. The database is untouched.' }] },
              { id: 'read-miss', label: 'Read, miss', steps: [{ title: 'Check cache', path: ['app', 'cache'], note: 'Not there.' }, { title: 'Read database', path: ['app', 'db'], tone: 'hard', note: 'Load the value from the source of truth.' }, { title: 'Fill cache', path: ['app', 'cache'], note: 'Store it with a TTL so the next read hits.' }] },
              { id: 'write', label: 'Write (invalidate)', steps: [{ title: 'Update database', path: ['app', 'db'], note: 'The database is written first so the source of truth is correct.' }, { title: 'Invalidate cache', path: ['app', 'cache'], note: 'Delete the cached key. The next read repopulates it. Deleting is safer than updating because it avoids racing writes leaving old data in the cache.' }] }
            ] } }
      ],
      takeaways: ['Cache-aside is the default: simple and survives cache failure.', 'Write-through keeps reads fresh at the cost of write latency; write-back is fast but can lose data.', 'On update, delete the cache key rather than overwriting it.', 'Set a TTL on everything as a safety net against stale entries.'],
      quiz: [
        { kind: 'concept', q: 'Which pattern risks losing acknowledged writes if the cache node crashes?', choices: ['Write-back', 'Write-through', 'Cache-aside', 'Write-around'], answer: 0, explain: 'Write-back acknowledges once the cache has the data and writes to the database later, so a crash before the flush loses it.' },
        { kind: 'concept', q: 'In cache-aside, after updating a row you should usually:', choices: ['Delete the cached key', 'Do nothing and let it expire', 'Update the cache value first, then the database', 'Flush the entire cache'], answer: 0, explain: 'Write the database, then invalidate the key. Writing the value into the cache can leave a stale value when two writers race.' },
        { kind: 'concept', q: 'Pick every situation where a cache gives little benefit.', choices: ['Every key is read once and never again', 'Reads are 100 times writes on a few hot keys', 'Data changes on every request', 'The working set fits easily in memory and repeats'], answer: [0, 2], explain: 'Caches work on repeated reads of data that stays valid. One-time reads or constantly changing data give a poor hit ratio.' }
      ],
      flashcards: [
        { id: 'cache-aside', front: 'Cache-aside flow?', back: 'Read: check cache, on miss read DB and fill cache. Write: update DB, delete the cache key. The app owns the logic and the system survives cache failure.' },
        { id: 'write-through-back', front: 'Write-through vs write-back?', back: 'Through: write cache and DB synchronously; fresh reads, slower writes. Back: write cache, flush to DB later; fast writes but data loss risk on a crash.' },
        { id: 'delete-not-set', front: 'Why delete the cache key on update instead of setting it?', back: 'Two concurrent writers can leave the older value in the cache if each sets it. Deleting forces the next read to load the current value.' }
      ]
    },
    {
      id: 'cache-eviction', title: 'Eviction, invalidation and stampedes', group: 'Data',
      hook: 'What a full cache throws away, how stale data is removed, and what happens when a hot key expires.',
      keywords: 'lru lfu fifo ttl invalidation thundering herd stampede hot key coalescing jitter',
      sections: [
        { title: 'Eviction policies',
          md: 'A cache has a size limit, so when it is full something must go.\n\n| Policy | Evicts | Good when | Weak when |\n|---|---|---|---|\n| LRU | least recently used | recent use predicts reuse (most workloads) | a big one-off scan flushes the working set |\n| LFU | least frequently used | a stable set of popular items | old popular items linger after interest moves |\n| FIFO | oldest inserted | simple, rarely best | ignores usage |\n| Random | any entry | very cheap, surprisingly OK | no intelligence |\n| TTL | entries past their lifetime | time-bound data | needs a separate size policy |\n\nRedis uses approximate LRU or LFU by sampling a few keys instead of tracking exact order, which is far cheaper. Choose by access pattern, then **measure the hit ratio**.' },
        { title: 'Invalidation and the hard cases',
          md: 'Cache invalidation is hard because the cache and the database change at different times. The tools, from simplest:\n\n1. **TTL**: accept staleness up to the lifetime. Always set one as a backstop.\n2. **Delete on write**: the writer removes the key after updating the database.\n3. **Event-driven**: a change stream (database log, queue) tells caches what changed, which also covers writers that bypass the app.\n4. **Versioned keys**: include a version in the key (`user:42:v7`) so old entries are never read.\n\nTwo failure modes to name in an interview:\n\n- **Cache stampede (thundering herd)**: a hot key expires and thousands of requests miss at once, all hitting the database. Fixes: **coalesce** (one request refills while others wait), **TTL jitter** so keys do not expire together, **refresh ahead** before expiry, or serve slightly stale data while one refresh runs.\n- **Hot key**: one key gets so much traffic that its cache node saturates. Fixes: a short-lived local cache in each app server, or replicating the key across nodes under several names.\n\nAlso cache **negative results** (a short TTL for "not found") so missing keys cannot be used to bypass the cache.',
          diagram: { title: 'Stampede protection with request coalescing',
            nodes: [
              { id: 'reqs', label: 'Many requests, one key', kind: 'client', detail: { why: 'A hot key expires and thousands of requests ask for it in the same instant.' } },
              { id: 'app', label: 'App servers', kind: 'service', detail: { why: 'Take a short per-key lock (or join an in-flight load). One request goes to the database; the rest wait for its result.', tradeoffs: ['Waiters add latency for that moment.', 'The lock needs a timeout so a crashed loader cannot block the key forever.'], alternatives: ['Serve stale data while one request refreshes', 'Refresh before expiry'] } },
              { id: 'cache', label: 'Cache', kind: 'cache', detail: { why: 'Holds the refreshed value once loaded.', tradeoffs: ['TTL jitter spreads expiries so keys do not all fall due together.'] } },
              { id: 'db', label: 'Database', kind: 'db', detail: { why: 'Sees one query per expired key instead of thousands.', scale: 'Without coalescing, the burst of misses can overload it.' } }
            ],
            edges: [{ from: 'reqs', to: 'app' }, { from: 'app', to: 'cache', label: 'miss' }, { from: 'app', to: 'db', label: 'one load' }],
            scenarios: [{ id: 'herd', label: 'Expired hot key', steps: [{ title: 'Burst arrives', path: ['reqs', 'app'], note: 'The key just expired and a thousand requests arrive together.' }, { title: 'All miss', path: ['app', 'cache'], tone: 'hard', note: 'The cache has nothing for the key.' }, { title: 'Only one loads', path: ['app', 'db'], note: 'A per-key lock lets one request query the database. The others wait on it.' }, { title: 'Refill and release', path: ['app', 'cache'], note: 'The result is cached with a jittered TTL and every waiter is answered from it.' }] }] } }
      ],
      takeaways: ['LRU is the sensible default; pick by access pattern and measure hit ratio.', 'Layer invalidation: TTL as a backstop, delete on write as the main path.', 'Stampede: coalesce, jitter, refresh ahead.', 'Hot key: local cache or replicate the key; cache not-found too.'],
      quiz: [
        { kind: 'concept', q: 'Which scenario makes LRU perform badly?', choices: ['A large one-time scan that touches every key once', 'Repeated reads of a small hot set', 'Data with a short TTL', 'A cache much larger than the data'], answer: 0, explain: 'A scan makes every key look recently used and evicts the genuinely hot entries.' },
        { kind: 'concept', q: 'A popular cache key expires and the database is overwhelmed. Name the best mitigation set.', choices: ['Coalesce concurrent loads and add TTL jitter', 'Raise the TTL to one year', 'Disable the cache', 'Add more database replicas only'], answer: 0, explain: 'Coalescing sends one load instead of thousands, and jitter keeps many keys from expiring at once.' },
        { kind: 'concept', q: 'Why cache "not found" results briefly?', choices: ['Repeated lookups of missing keys would otherwise always hit the database', 'It saves memory', 'It makes writes consistent', 'The database cannot return not-found'], answer: 0, explain: 'Without a negative entry, every request for a nonexistent key reaches the database, which attackers can exploit.' },
        { kind: 'concept', q: 'A single cache node is saturated by one key while the cluster is idle. What is this called?', choices: ['A hot key', 'A stampede', 'Cache poisoning', 'Eviction thrash'], answer: 0, explain: 'Partitioning by key cannot spread one key. Use a local cache or replicate the key under several names.' }
      ],
      flashcards: [
        { id: 'lru-vs-lfu', front: 'LRU vs LFU?', back: 'LRU evicts the least recently used; LFU the least frequently used. LRU adapts quickly but a scan can flush it; LFU keeps stable favorites but is slow to forget.' },
        { id: 'stampede', front: 'Cache stampede and three fixes?', back: 'A hot key expires and many requests hit the database at once. Fix: coalesce loads, add TTL jitter, refresh ahead of expiry (or serve stale while refreshing).' },
        { id: 'neg-cache', front: 'What is negative caching?', back: 'Caching "not found" for a short time so repeated lookups of missing keys do not reach the database.' },
        { id: 'invalidation-layers', front: 'How do you invalidate caches reliably?', back: 'TTL as a backstop, delete-on-write as the main path, and a change event stream to cover writers that bypass the app. Versioned keys avoid reading old entries.' }
      ]
    },
    {
      id: 'databases', title: 'SQL, NoSQL and indexes', group: 'Data',
      hook: 'Pick a store from the access pattern, and know what an index buys and costs.',
      keywords: 'sql nosql relational document key value wide column graph index btree lsm acid transactions',
      sections: [
        { title: 'SQL or NoSQL',
          md: '**Relational (SQL)** databases store rows in tables with a schema, join across tables, and offer **ACID** transactions. Choose them when data is relational, you need flexible ad-hoc queries, or correctness across several rows matters (money, inventory).\n\n**NoSQL** is a family, not one thing:\n\n- **Key-value** (DynamoDB, Redis): lookup by key, huge scale, minimal querying.\n- **Document** (MongoDB): nested JSON-like records, flexible schema, query by fields.\n- **Wide-column** (Cassandra, Bigtable): rows keyed for partitioned storage; very high write throughput, query by key and range.\n- **Graph** (Neo4j): relationships are first-class; good for traversals.\n\nThe honest decision rule is the **access pattern**, not fashion. "Fetch by this key, billions of rows, no joins" favors key-value or wide-column. "Many different queries over related entities" favors SQL. A single SQL primary comfortably handles a few thousand writes a second and terabytes, so do not abandon it early; and do not claim NoSQL is "schemaless": the schema moves into your code.',
          diagram: { title: 'Choosing a store by access pattern',
            nodes: [
              { id: 'pattern', label: 'Access pattern', kind: 'client', detail: { why: 'Start from the queries you must serve and the consistency you need.' } },
              { id: 'sql', label: 'SQL database', kind: 'db', detail: { why: 'Joins, ad-hoc queries, multi-row transactions.', tradeoffs: ['Scaling writes past one primary means sharding by hand.'], alternatives: ['PostgreSQL', 'MySQL'], scale: 'Write throughput on one primary.' } },
              { id: 'kv', label: 'Key-value or wide-column', kind: 'db', detail: { why: 'Point lookups and ranges by key at very large scale.', tradeoffs: ['Few query shapes; secondary indexes are limited or costly.', 'Often eventually consistent by default.'], alternatives: ['DynamoDB', 'Cassandra'], scale: 'Hot partitions when the key distributes unevenly.' } },
              { id: 'doc', label: 'Document store', kind: 'db', detail: { why: 'Self-contained nested records read and written together.', tradeoffs: ['Cross-document transactions and joins are weaker.'], alternatives: ['MongoDB'] } },
              { id: 'search', label: 'Search index', kind: 'search', detail: { why: 'Full-text and faceted queries a primary store cannot do well.', tradeoffs: ['A derived copy: it lags the source and must be kept in sync.'] } }
            ],
            edges: [{ from: 'pattern', to: 'sql', label: 'joins, ACID' }, { from: 'pattern', to: 'kv', label: 'key lookups' }, { from: 'pattern', to: 'doc', label: 'nested records' }, { from: 'pattern', to: 'search', label: 'text search' }] } },
        { title: 'Indexes',
          md: 'An **index** is a separate structure that lets the database find rows without scanning the table. The common kind is a **B-tree**: sorted, so it serves equality and range queries and `ORDER BY` in `O(log n)`. Many NoSQL engines use **LSM trees** instead: writes go to memory and append-only files and are merged in the background, which favors write throughput.\n\nIndexes are not free:\n\n- Each one **slows writes** (every insert and update must maintain it) and uses storage.\n- A **composite** index `(a, b)` helps queries on `a` or on `a` and `b`, but not `b` alone: column order matters.\n- An index only helps if the query uses its leading columns, so read the query plan.\n- A **covering** index holds all columns the query needs, so the table is never touched.\n\nIndex what you filter, join and sort on; do not index everything.' }
      ],
      takeaways: ['Choose the store from the access pattern and consistency need.', 'SQL goes a long way; move for a reason you can state in numbers.', 'Indexes speed reads and slow writes; composite order matters.', 'Search belongs in a search index kept in sync, not a LIKE scan.'],
      quiz: [
        { kind: 'concept', q: 'You need a transfer between two accounts to either fully happen or not happen. Which property is that?', choices: ['Atomicity (the A in ACID)', 'Eventual consistency', 'Partition tolerance', 'Idempotency'], answer: 0, explain: 'A transaction is atomic: all of its changes commit together or none do.' },
        { kind: 'concept', q: 'A table has an index on (country, city). Which query uses it well?', choices: ['WHERE country = ? AND city = ?', 'WHERE city = ? only', 'Neither, composite indexes are never used', 'WHERE LOWER(city) = ? only'], answer: 0, explain: 'The index is ordered by country first, so queries must constrain the leading column to use it effectively.' },
        { kind: 'concept', q: 'What is the main cost of adding many indexes to a write-heavy table?', choices: ['Slower writes and more storage', 'Slower reads', 'Lost transactions', 'Stale data'], answer: 0, explain: 'Each insert, update and delete must also update every index.' },
        { kind: 'concept', q: 'Pick the best fit: billions of records, always fetched by a known key, no joins.', choices: ['Key-value or wide-column store', 'A single normalized SQL schema with many joins', 'A graph database', 'A full-text search engine as the primary store'], answer: 0, explain: 'Point lookups by key partition cleanly and scale out, which is what these stores are built for.' }
      ],
      flashcards: [
        { id: 'sql-vs-nosql', front: 'How do you decide between SQL and NoSQL?', back: 'By access pattern and consistency need. SQL: relational data, ad-hoc queries, multi-row transactions. Key-value or wide-column: huge scale, lookups by key, no joins.' },
        { id: 'btree-lsm', front: 'B-tree vs LSM tree?', back: 'B-tree: sorted pages updated in place; strong for reads and ranges. LSM: buffered appends merged later; strong for write throughput.' },
        { id: 'composite-index', front: 'Composite index (a, b): which queries benefit?', back: 'Queries filtering on a, or a and b. Not b alone, because the index is ordered by a first.' },
        { id: 'index-cost', front: 'What does an index cost?', back: 'Slower writes and extra storage, since every write must maintain it. Index only what you filter, join and sort on.' }
      ]
    },
    {
      id: 'replication-sharding', title: 'Replication, sharding and hot keys', group: 'Data',
      hook: 'Copy data for durability and read scale, split it for write scale, and plan for the key everyone wants.',
      keywords: 'replication leader follower sharding partitioning range hash directory hot key rebalancing resharding',
      sections: [
        { title: 'Replication',
          md: '**Replication** keeps copies of the same data on several nodes for **durability**, **availability** and **read scale**.\n\n- **Leader-follower**: all writes go to the leader, which streams changes to followers. Reads can go to followers. Simple, and the most common.\n- **Multi-leader**: several nodes accept writes (often one per region); conflicts must be resolved. Fast local writes, harder semantics.\n- **Leaderless** (Dynamo style): clients write to and read from several replicas using quorums (`W + R > N` gives overlap).\n\nReplication can be **synchronous** (the leader waits for the follower: safe, slower, blocks if the follower is down) or **asynchronous** (fast, but a follower lags and a leader crash can lose the latest writes). Many systems use one synchronous follower and the rest asynchronous.\n\nThe consequence of async replication is **replication lag**: a read from a follower right after a write may miss it. Mitigations: read your own writes from the leader, or pin a user to the leader briefly after a write.',
          diagram: { title: 'Leader-follower replication',
            nodes: [
              { id: 'app', label: 'Application', kind: 'service', detail: { why: 'Sends writes to the leader and reads to followers.' } },
              { id: 'leader', label: 'Leader', kind: 'db', detail: { why: 'The only node that accepts writes, so there are no write conflicts.', tradeoffs: ['A single write point: write throughput does not scale.', 'Failover needs a safe election; a stale follower promoted loses recent writes.'], scale: 'Write throughput and replication fan-out.' } },
              { id: 'f1', label: 'Follower 1', kind: 'db', detail: { why: 'Serves reads and takes over if the leader fails.', tradeoffs: ['Lags the leader, so reads can be slightly stale.'] } },
              { id: 'f2', label: 'Follower 2', kind: 'db', detail: { why: 'More read capacity and a second copy in another zone.', scale: 'Lag grows under write bursts.' } }
            ],
            edges: [{ from: 'app', to: 'leader', label: 'writes' }, { from: 'leader', to: 'f1', style: 'replication', label: 'log' }, { from: 'leader', to: 'f2', style: 'replication', label: 'log' }, { from: 'app', to: 'f1', label: 'reads' }] } },
        { title: 'Sharding',
          md: '**Sharding** (partitioning) splits data across nodes so no node holds all of it. It is how you scale **writes** and **storage** beyond one machine.\n\n- **Range**: keys A to F on shard 1, G to M on shard 2. Range scans are efficient; sequential keys (timestamps) create a **hot shard**.\n- **Hash**: `shard = hash(key) mod N`. Spreads load evenly; range queries must ask every shard. Use **consistent hashing** so that adding a node moves only about 1/N of the keys.\n- **Directory**: a lookup table maps keys to shards. Flexible, but the directory is now a critical dependency.\n\nThe shard key decides everything. A good one has **high cardinality**, spreads load evenly, and appears in your main queries so each request touches one shard. Pain points: queries across shards (scatter-gather), joins and transactions across shards, and **resharding** when you outgrow the count.\n\n**Hot keys** are the case partitioning cannot fix: one celebrity user or viral item hammers one shard. Mitigate by caching, splitting the key (`item:42#0` to `#9` and merging reads), or giving the hot entity its own shard.' }
      ],
      takeaways: ['Replication gives durability and read scale; sharding gives write and storage scale.', 'Async replication lags: plan for reading your own writes.', 'Choose the shard key from the main query and for even spread.', 'Hot keys need caching or key-splitting, not more shards.'],
      quiz: [
        { kind: 'concept', q: 'What problem does asynchronous replication create?', choices: ['A follower can serve stale reads and a leader crash can lose recent writes', 'Writes become slower than synchronous replication', 'Followers cannot serve reads', 'It prevents failover'], answer: 0, explain: 'The leader acknowledges before followers have the change, so followers lag and unreplicated writes can be lost on failure.' },
        { kind: 'concept', q: 'You shard a messages table by timestamp range. What goes wrong?', choices: ['All new writes land on the newest shard', 'Range queries become impossible', 'Hashing makes every query slow', 'Nothing; it spreads writes evenly'], answer: 0, explain: 'Time-ordered keys concentrate current traffic on one shard, a hot shard. A hash of the key would spread it.' },
        { kind: 'concept', q: 'Why use consistent hashing for shard placement?', choices: ['Adding or removing a node moves only a small share of keys', 'It makes range scans fast', 'It removes the need for replication', 'It guarantees no hot keys'], answer: 0, explain: 'With hash mod N, changing N remaps most keys. A ring only reassigns the keys next to the changed node.' },
        { kind: 'concept', q: 'One celebrity account is overloading its shard. Which helps?', choices: ['Cache it and split its key across several partitions', 'Add more shards for other users', 'Switch to synchronous replication', 'Add an index'], answer: 0, explain: 'More shards do not help because the hot key still lives on one. Caching and key-splitting spread its load.' }
      ],
      flashcards: [
        { id: 'repl-modes', front: 'Synchronous vs asynchronous replication?', back: 'Sync: leader waits for the follower; no lost writes, slower, blocks if the follower is down. Async: fast, but followers lag and a leader crash can lose recent writes.' },
        { id: 'shard-key', front: 'What makes a good shard key?', back: 'High cardinality, even load, and present in the main queries so each request hits one shard. Avoid monotonically increasing keys with range sharding.' },
        { id: 'hot-key', front: 'How do you handle a hot key?', back: 'Cache it, split it into suffixed sub-keys and merge reads, or give it a dedicated shard. Adding shards alone does not help.' },
        { id: 'quorum', front: 'Quorum rule for leaderless replication?', back: 'With N replicas, writes to W and reads from R overlap when W + R > N, so a read sees the latest acknowledged write (absent failures and concurrent writes).' }
      ]
    }
  );
})();
