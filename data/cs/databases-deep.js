/* Offer Ready: CS fundamentals, track. Concepts are general; product specifics are labelled as such. */
OR.cs = OR.cs || [];
OR.cs.push({
  id: "databases-deep",
  order: 5,
  title: "Databases in depth",
  blurb: "Storage engines (pages, B-trees, LSM trees, WAL), index design and EXPLAIN, MVCC and deadlocks, replication, sharding, CAP/PACELC and quorums, NoSQL families, search and vector databases, columnar storage, Redis patterns, online migrations, change data capture, and how to choose a database.",
  minutes: 90,
  sections: [
    {
      id: "storage-engines",
      title: "Storage engines: pages and B-trees",
      body: `
A **storage engine** is the part of a database that decides how bytes are laid out on disk and how to find them again. Everything above it (SQL parsing, planning) is a layer on top. The same SQL can run on engines with very different performance, so knowing the engine tells you what is cheap and what is expensive.

Disks (even SSDs) are read and written in blocks, not single bytes. So engines group data into fixed-size **pages**. A page is the unit of I/O: typical sizes are a few kilobytes (PostgreSQL defaults to 8 KB, MySQL InnoDB to 16 KB). Each page holds many rows. To read one row, you read its whole page.

Because disk is far slower than memory, engines keep a **buffer pool** (page cache): recently used pages stay in RAM, and a replacement policy (often an LRU variant) decides what to evict. A "fast" query is mostly one that touches few pages, or pages already in the buffer pool.

Most relational engines store the table as a **heap** (rows in no particular order) or as a **clustered index** (rows stored in the primary-key order, as in InnoDB). A **B-tree** (strictly, usually a B+tree) is the standard index structure:

- It is a shallow, wide tree. Each node is one page and holds hundreds of keys, so the tree is only 3 or 4 levels deep even for hundreds of millions of rows. A lookup reads about one page per level.
- Keys are kept sorted, so range scans (\`BETWEEN\`, \`ORDER BY\`) walk neighbouring leaf pages. In a B+tree the leaves are linked to each other for exactly this reason.
- Inserts go into the right leaf. If the page is full it **splits** in two, and the split can propagate up. Updates happen **in place**: the engine overwrites the page.

The cost model to remember: a B-tree gives O(log n) reads and good range scans, but a write is a *random* write to some page in the middle of the file, and a write that splits pages costs more. Random writes are the weak point, which is the problem LSM trees (later section) attack.

\`\`\`
-- the rule of thumb for "how deep is my index":
-- fan-out ~ 200-500 keys per page  =>  depth = ceil(log_fanout(rows))
-- 100 million rows, fan-out 300 -> about 4 levels (rule of thumb, not a guarantee)
\`\`\`

**Interview trap:** saying "a B-tree lookup is O(log n)" and stopping. The useful answer is that the base of the log is large, so it is a handful of page reads, and the top levels are almost always cached. Also: a random UUID primary key in a clustered index scatters inserts across all pages (more splits, worse cache use), where a sequential key appends to the right edge.
`
    },
    {
      id: "wal",
      title: "Write-ahead logging and crash recovery",
      body: `
If a database updated pages in place and the machine lost power halfway through, you could end up with a half-written page or a transaction that is half applied. The **write-ahead log (WAL)** solves this with one rule: **describe the change in an append-only log and force that log to disk before the change is considered done.** The same idea appears as a "redo log" or "journal" in different products.

How it works, in general terms:

1. A transaction changes pages in the buffer pool (memory). These pages are now "dirty".
2. The engine appends a log record describing each change to the WAL (sequential append, cheap).
3. On \`COMMIT\`, the engine **flushes the log to stable storage** (\`fsync\`) and only then tells the client "committed".
4. The dirty data pages are written to their real location later, in the background, in batches. This is why a commit does not need to wait for random page writes.
5. Periodically a **checkpoint** writes the dirty pages out and records "everything before this point is on disk", so recovery does not have to replay the whole log.

After a crash, **recovery** reads the log from the last checkpoint: it **redoes** committed changes that never reached the data pages, and **undoes** changes of transactions that never committed. Together this gives atomicity and durability from the ACID guarantees (see [Databases](#/cs/databases)).

Why this design wins: the commit path is one sequential write instead of many random ones. Sequential writes are far faster on both spinning disks and SSDs.

The WAL is also a *byproduct you can reuse*. Because it is an ordered record of every change, databases ship it to replicas (physical replication), and tools read a decoded form of it for change data capture. One mechanism serves recovery, replication and streaming.

\`\`\`
# tunable durability, a common trade-off (names differ per product)
# strict:  flush the log on every commit      -> safe, limited by fsync latency
# relaxed: flush the log every N ms (async)   -> faster, can lose the last few ms of commits on a crash
\`\`\`

**Common mistakes:** believing "committed" always means "on disk" (it depends on the flush setting, and on disks or VMs that lie about \`fsync\`); and confusing the WAL (recovery) with a backup (it is not, since it is trimmed once checkpointed unless you archive it on purpose).
`
    },
    {
      id: "lsm",
      title: "LSM trees",
      body: `
A **log-structured merge tree (LSM tree)** is the other major storage design, used by many write-heavy stores (for example Cassandra, RocksDB, LevelDB, and HBase use variants of it). It flips the B-tree trade-off: make writes cheap and sequential, and pay later on reads.

How it works:

1. Writes go to an in-memory sorted structure called the **memtable**, and also to a WAL for crash safety.
2. When the memtable is full, it is written to disk as one immutable, sorted file called an **SSTable** (sorted string table). That write is purely sequential.
3. Files are never edited in place. An update or delete is just a *newer* entry; a delete writes a **tombstone** marker.
4. A read checks the memtable, then the SSTables from newest to oldest, until it finds the key. To avoid opening every file, each SSTable has a **Bloom filter**: a small probabilistic structure that says "definitely not here" or "maybe here" (false positives possible, false negatives not).
5. Background **compaction** merges SSTables, drops overwritten values and expired tombstones, and keeps the file count bounded.

\`\`\`
write k=1 -> memtable ... flush -> SSTable-1
write k=1 (new value) -> memtable ... flush -> SSTable-2
read k=1 -> checks SSTable-2 first, finds newest value
compaction merges 1 and 2 -> only the newest k=1 survives
\`\`\`

The costs are the three **amplifications**:

- **Write amplification**: compaction rewrites the same data several times over its life.
- **Read amplification**: a read may check several files (Bloom filters reduce this).
- **Space amplification**: stale versions exist until compaction removes them.

| | B-tree | LSM tree |
|---|---|---|
| Writes | random, in place | sequential, batched |
| Point reads | predictable (a few pages) | may touch several files |
| Range scans | excellent | good, but merges several files |
| Strength | read-heavy, mixed workloads | very high write rates, compressible data |
| Weak spot | random write cost | compaction spikes, tombstone buildup |

**Interview trap:** claiming "LSM is faster". It is faster for sustained writes; B-trees often win on reads and on latency predictability, since compaction can compete for I/O at inconvenient moments.
`
    },
    {
      id: "composite-indexes",
      title: "Composite indexes and column order",
      body: `
Basic indexes are covered in [Databases](#/cs/databases). Here we go deeper on the decision that matters most in practice: the **column order** in a multi-column index.

A **composite index** on \`(a, b, c)\` is a B-tree sorted by \`a\`, then by \`b\` within equal \`a\`, then by \`c\` within equal \`(a, b)\`. Think of a phone book sorted by last name, then first name. You can quickly find "Smith", or "Smith, Anna", but not everyone called "Anna" without scanning the whole book.

That gives the **leftmost-prefix rule**: the index can serve queries that constrain a prefix of its columns.

\`\`\`
CREATE INDEX idx_orders ON orders (customer_id, status, created_at);

-- can use the index well:
WHERE customer_id = 7
WHERE customer_id = 7 AND status = 'paid'
WHERE customer_id = 7 AND status = 'paid' AND created_at > '2026-01-01'
WHERE customer_id = 7 ORDER BY status          -- already sorted that way

-- cannot use it efficiently for seeking:
WHERE status = 'paid'                          -- skips the first column
\`\`\`

**Choosing the order** (rules of thumb, not laws):

1. **Equality columns first, range column last.** After a range condition (\`created_at > ...\`) the later columns can no longer narrow the seek, because the matching rows are no longer contiguous in the later columns. \`(customer_id, status, created_at)\` is good for "equal, equal, range".
2. Among equality columns, put the more *selective* one first only if queries sometimes filter on it alone. Otherwise prefer the column that the most query shapes share.
3. Match the \`ORDER BY\`: if the index already delivers rows in the needed order, the database can skip a sort, and \`LIMIT\` queries can stop early.

**Redundancy:** an index on \`(a, b)\` makes a separate index on \`(a)\` mostly redundant. Extra indexes are not free: each one is updated on every insert, update or delete of the indexed columns, costs disk and buffer-pool space, and slows writes.

**Interview trap:** "I'll index every column." Single-column indexes do not combine into a composite one; the planner may merge two, but it is usually slower than one well-ordered composite. Another trap: ignoring that a function or implicit type cast on the column (\`WHERE lower(email) = ...\`, comparing a string column to a number) can stop the index being used unless you index that exact expression.
`
    },
    {
      id: "covering-partial",
      title: "Covering, partial indexes and selectivity",
      body: `
Three ideas that decide whether an index is worth having.

**Selectivity** is how much an index narrows the table: roughly the fraction of rows a predicate matches. \`WHERE email = 'x'\` matches about one row (highly selective). \`WHERE is_active = true\` might match 95% of rows (not selective). The planner uses collected **statistics** (value distributions) to estimate this and pick a plan. Surprising consequence: even with an index on a low-selectivity column, the planner may *ignore it* and scan the table, because reading a large fraction of rows through an index (random page hops) is slower than one sequential scan. That is correct behaviour, not a bug.

**Covering index (index-only scan).** Normally an index lookup finds a row's location, then fetches the row from the table (an extra page read). If the index itself contains every column the query needs, the table is never touched.

\`\`\`
-- query: SELECT status, total FROM orders WHERE customer_id = 7;
CREATE INDEX idx_cover ON orders (customer_id) INCLUDE (status, total);
-- INCLUDE (supported by PostgreSQL and SQL Server, among others) stores
-- extra columns in the index leaves without making them part of the sort key.
\`\`\`

Another way is to put the extra columns into the key itself, as in \`(customer_id, status, total)\`; that works in every engine but makes the index key larger. Trade-off: wider indexes use more space and slow writes more.

**Partial (filtered) index.** An index over only the rows matching a condition. Supported by PostgreSQL and SQLite (and by SQL Server as "filtered indexes"); not by every engine.

\`\`\`
-- only a few orders are 'pending'; the hot query looks for them
CREATE INDEX idx_pending ON orders (created_at) WHERE status = 'pending';
-- unique-but-only-when-not-deleted (soft deletes):
CREATE UNIQUE INDEX uq_email ON users (email) WHERE deleted_at IS NULL;
\`\`\`

The index is small, cheap to maintain (rows outside the condition do not touch it), and fast. The query's \`WHERE\` must imply the index condition for the planner to use it.

**Rules of thumb:** index for your real queries, not for every column; skewed data (rare status values) is the classic case for a partial index; low-cardinality columns alone (booleans) rarely deserve a plain index, but as the leading or trailing part of a composite, or as a partial-index condition, they can.

**Interview trap:** assuming "the index exists, so it will be used." Stale statistics, low selectivity, or non-sargable predicates all cause scans.
`
    },
    {
      id: "explain",
      title: "Reading EXPLAIN",
      body: `
\`EXPLAIN\` shows the plan the optimizer chose: a tree of operations, each producing rows for its parent. Reading plans is the main skill for fixing slow queries, and it transfers across products even though the output format differs. (The basic idea is also in [Databases](#/cs/databases).)

Plain \`EXPLAIN\` shows the *estimated* plan. Adding \`ANALYZE\` (PostgreSQL: \`EXPLAIN (ANALYZE, BUFFERS) ...\`) actually **runs** the query and reports real times and row counts. Careful: it executes the statement, so wrap \`UPDATE\`/\`DELETE\` in a transaction you roll back.

What to look for, in the order that usually pays off:

1. **Scan type at the leaves.** A sequential (full table) scan, an index scan (seek then fetch rows), an index-only scan (covering index), or a bitmap scan (PostgreSQL's way to combine index hits then fetch pages in order). A full scan is not automatically wrong; it is wrong when you expected a seek.
2. **Estimated vs actual rows.** If the planner expected 10 rows and got 2 million, its statistics are stale or the predicates are correlated in ways it cannot see, and every decision above that node (join order, join method) may be bad. Fix: refresh statistics (\`ANALYZE\`), or add extended statistics or an index.
3. **Join method.** *Nested loop* (for each outer row, probe the inner; great with an index on the inner side and few outer rows), *hash join* (build a hash table of one input, probe with the other; good for large unsorted inputs), *merge join* (both inputs sorted on the key).
4. **Sorts and spills.** A sort that does not fit in memory spills to disk and slows down badly. An index that delivers the order removes the sort.
5. **Loops.** A node with "loops: 50000" and a cost per loop adds up; this is how N+1-like behaviour shows inside a single query.
6. **Where filtering happens.** Rows removed late ("Rows Removed by Filter" large) mean work was wasted before the filter; a better index moves the filter down.

\`\`\`
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 7 ORDER BY created_at DESC LIMIT 20;
-- ideal: an index on (customer_id, created_at) -> index scan, no sort node, stops after 20 rows
\`\`\`

**Interview traps:** comparing the *cost* numbers across different queries (cost is an internal unit for comparing plans of one query, not milliseconds); trusting the estimated plan without checking actual rows; and tuning on a tiny dev database, where the planner rightly prefers a full scan.
`
    },
    {
      id: "mvcc",
      title: "Transactions in depth: MVCC",
      body: `
[Databases](#/cs/databases) introduces ACID and the isolation anomalies. Here is how engines actually deliver isolation without making everyone wait.

**MVCC (multi-version concurrency control)** keeps *several versions* of a row so readers and writers do not block each other: a reader sees an older consistent version while a writer creates a new one. "Readers don't block writers, writers don't block readers" is the headline benefit.

The common mechanics (details vary by product):

- Every row version is tagged with the id of the transaction that created it (and, once superseded or deleted, the one that ended it).
- When a transaction (or, at read committed, a statement) starts, it gets a **snapshot**: roughly, "the set of transactions committed as of now". A row version is visible to you if its creator is in your snapshot and it has not been ended by someone in your snapshot.
- **PostgreSQL** keeps old versions *in the table itself* as extra row versions; a background process, **vacuum**, later reclaims versions nobody can see. **InnoDB (MySQL)** updates the row in place and keeps old versions in an **undo log**, rebuilding old values from it for readers who need them.

Isolation levels become a question of *when the snapshot is taken*:

- **Read committed**: a fresh snapshot for every statement. Two statements in one transaction can see different data.
- **Repeatable read / snapshot isolation**: one snapshot for the whole transaction. You see a frozen world, but, as covered earlier, snapshot isolation can still allow **write skew** (two transactions read the same facts, write different rows, together break an invariant).
- **Serializable**: PostgreSQL's serializable mode builds on snapshots and detects dangerous patterns, aborting one transaction; you must retry. Lock-based serializable engines instead block.

Costs of MVCC:

- **Bloat and cleanup.** Old versions take space until reclaimed. A forgotten long-running transaction (or an idle-in-transaction connection) pins the oldest snapshot, so vacuum or purge cannot remove anything newer, and tables or undo space grow.
- **Write conflicts still exist.** Two transactions updating the same row: the second waits for the first, then either proceeds (read committed re-reads the new row) or fails with a serialization error (snapshot levels in some engines).

**Interview traps:** "MVCC means no locks" (writers still lock rows against other writers); "repeatable read stops all anomalies" (not write skew); and forgetting that long transactions are expensive in an MVCC system.
`
    },
    {
      id: "locking-deadlocks",
      title: "Locking and deadlocks",
      body: `
Even with MVCC, some work needs locks: writers against writers, schema changes, and explicit "I am going to change this" reads.

**Lock modes.** A **shared (read) lock** allows other readers but blocks writers; an **exclusive (write) lock** blocks everyone else on that item. **Granularity** ranges from a whole table to a page to a single row; row locks give more concurrency but cost more bookkeeping.

**Explicit row locking** is how you avoid races in read-then-write logic:

\`\`\`
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;   -- locks that row
-- ...app checks balance >= 100...
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
\`\`\`

Variants: \`FOR UPDATE SKIP LOCKED\` lets a worker grab rows no one else holds (a simple job-queue pattern), and \`NOWAIT\` fails immediately instead of waiting.

**Pessimistic vs optimistic.** Pessimistic: lock first, work, release. Optimistic: do not lock; add a **version column** and make the write conditional.

\`\`\`
UPDATE docs SET body = :new, version = version + 1
WHERE id = :id AND version = :seen_version;
-- 0 rows updated -> someone else changed it first; reload and retry
\`\`\`

Optimistic suits low contention; under heavy contention it wastes work on retries.

**Deadlock:** transaction A holds a lock on row 1 and wants row 2; B holds row 2 and wants row 1. Neither can proceed. Databases detect this (by checking a wait-for graph for cycles, or by a timeout), pick a **victim**, roll it back and raise an error. The application must catch it and **retry the transaction**.

**Preventing deadlocks:**

- **Acquire locks in a consistent order** everywhere (always lower id first). This removes the cycle.
- Keep transactions short; do not hold locks while calling a slow external service or waiting on a user.
- Lock only what you need; touch rows in a deterministic order (\`ORDER BY id\` in the locking select).
- Index the columns used in \`UPDATE\`/\`DELETE\` conditions, so the engine does not scan and lock more rows than necessary (in some engines a scan under certain isolation levels locks a wide range).

**Interview traps:** saying deadlocks can be "avoided entirely" (you reduce them; you must still handle the error); and treating a lock timeout and a deadlock as the same thing (a timeout just means someone held a lock for too long).
`
    },
    {
      id: "replication",
      title: "Replication and failover",
      body: `
**Replication** keeps copies of the same data on several machines. Reasons: **availability** (survive a machine dying), **read scaling** (serve reads from copies), and **locality** (copies near users). It does not by itself increase write capacity: every copy still has to apply every write.

**Single-leader (primary/replica).** One node, the **leader**, accepts writes and streams its changes (typically from the WAL or a binary log) to **followers**, which apply them in the same order. This is the default in most relational databases.

- **Synchronous** replication: the leader waits for a follower to confirm before acknowledging the commit. No acknowledged write is lost if the leader dies, but a slow or dead follower stalls writes.
- **Asynchronous**: the leader acknowledges immediately. Fast, but if the leader dies, recent writes that had not reached a follower are lost.
- Common compromise: one synchronous follower, the rest asynchronous.

**Replication lag** is the delay before a follower reflects a write. It causes visible anomalies when you read from followers:

- **Read-your-writes** violation: you post a comment, reload, and it is missing because the read hit a lagging follower. Fix: read your own recent writes from the leader, or route a user to the leader for a short time after they write.
- **Monotonic reads** violation: you see newer data, then older data on the next request because two requests hit different followers. Fix: pin a user's reads to one replica.

**Failover** is promoting a follower when the leader fails. The hard parts:

1. **Detecting failure**: a timeout cannot tell "dead" from "slow or partitioned".
2. **Choosing** the most up-to-date follower (with async replication some writes may be lost).
3. **Avoiding split brain**: the old leader comes back believing it is still leader, and two nodes accept writes. Systems prevent this with an agreed-upon epoch/term and by fencing the old leader (cut it off from storage or the network).
4. **Redirecting clients** to the new leader.

**Multi-leader** and **leaderless** (quorum) replication allow writes at several nodes, at the price of write conflicts that must be resolved (last-write-wins, merge rules, or CRDTs). Leaderless is covered with quorums later.

**Interview traps:** "add replicas to scale writes" (wrong); promising zero data loss with async replication; and forgetting that automated failover can itself cause an outage if it triggers on a brief network blip.
`
    },
    {
      id: "sharding",
      title: "Sharding and partitioning",
      body: `
When one machine's disk, memory or write rate is not enough, you split the data. **Partitioning** is dividing a table into pieces; **sharding** usually means partitioning across *multiple machines*. (Terms overlap; many databases also partition within one server for manageability, such as dropping an old month's partition instantly.)

**How to choose which shard a row lives on:**

- **Range**: shard by key ranges (\`A-F\`, \`G-M\`...). Range scans stay local, but hot ranges form (timestamps: all new writes hit the latest range).
- **Hash**: \`shard = hash(key) mod N\`. Spreads load evenly, but kills range queries and has a rebalancing problem: change N and almost every key moves. **Consistent hashing** (or a fixed larger number of logical partitions mapped to machines) limits movement when nodes are added: only a fraction of keys move.
- **Directory**: a lookup table says which shard owns which key. Flexible, but the directory is an extra component that must be fast and available.

**The shard key is the most important decision.** A good key:

1. Spreads data and traffic evenly (high cardinality, no giant keys).
2. Matches your common query, so most queries touch one shard.
3. Rarely changes.

A **hot shard** (celebrity user, a single huge tenant, a monotonic timestamp key) defeats the purpose. Mitigations include adding a salt to split a hot key, or isolating giant tenants.

**What gets harder:**

- **Cross-shard queries**: scatter-gather across all shards, then merge. Slow and fragile.
- **Cross-shard joins** and **transactions**: no single-node ACID. You need two-phase commit (slow, blocking if the coordinator fails) or application-level patterns such as sagas (compensating actions), and you often redesign to avoid them.
- **Global uniqueness and auto-increment ids**: use UUIDs or time-ordered ids from a generator.
- **Resharding** while serving traffic, backups, and operational complexity in general.

\`\`\`
# toy router: hash partitioning with a fixed number of logical partitions
import zlib
PARTITIONS = 64                       # fixed forever; machines own sets of partitions
def partition(key: str) -> int:
    return zlib.crc32(key.encode()) % PARTITIONS
\`\`\`

Moving a partition between machines does not change which partition a key is in, so adding machines never rehashes keys.

**Interview trap:** sharding too early. Rule of thumb: first use better indexes, caching, read replicas and a bigger machine; shard when one primary cannot keep up on writes or storage. For system-design practice see [system design fundamentals](#/system-design/fundamentals).
`
    },
    {
      id: "consistency",
      title: "Consistency models, CAP, PACELC and quorums",
      body: `
A **consistency model** is a promise about what reads can return when data is copied across machines.

- **Linearizability** (strong consistency): the system behaves as if there is one copy and each operation takes effect at one instant between its start and end. Once a write completes, every later read sees it. Expensive in latency, and unavailable during some failures.
- **Sequential / causal consistency**: weaker. Causal keeps cause-before-effect (you see a reply only after the post it replies to) without ordering unrelated operations.
- **Eventual consistency**: if writes stop, all replicas converge to the same value eventually. Says nothing about what you read in the meantime.
- Session guarantees such as read-your-writes and monotonic reads (see replication) are practical middle grounds.

**CAP theorem.** When a network **partition** (nodes cannot talk) happens, a system must choose: stay **consistent** (refuse some requests) or stay **available** (answer, possibly with stale data). Partitions will happen, so the real choice is between C and A *during a partition*. Common misreadings: "pick any two of three" (you cannot opt out of partitions), and "CAP's C is the same as ACID's C" (CAP's is linearizability; ACID's is about constraints).

**PACELC** extends it: if there is a **P**artition, choose **A** or **C**; **E**lse (normal operation), choose **L**atency or **C**onsistency. Even with no failures, strongly consistent replication costs round trips, so there is a latency vs consistency trade-off all the time. This is the more useful framing day to day.

**Quorums** (used in leaderless designs such as Dynamo-style stores): with **N** replicas of each key, a write must be acknowledged by **W** replicas and a read must contact **R** replicas. If **R + W > N**, every read set overlaps every write set, so a read includes at least one replica holding the latest acknowledged write.

\`\`\`
N=3, W=2, R=2  -> R+W=4 > 3: reads see the latest write (overlap guaranteed)
N=3, W=1, R=1  -> R+W=2 <= 3: fast, but stale reads possible
N=3, W=3, R=1  -> fast reads, but one down node blocks writes
\`\`\`

Caveat: overlap is not full linearizability. Concurrent writes, sloppy quorums (using stand-in nodes during failures), and clock-based last-write-wins conflict resolution can still return stale or lost data. Read repair and anti-entropy processes fix replicas over time.

**Interview traps:** calling a system "CP" or "AP" as a fixed label (many are configurable per query); and forgetting that "eventually consistent" says nothing about how long or what you see before then.
`
    },
    {
      id: "nosql-families",
      title: "NoSQL families and when to pick them",
      body: `
"NoSQL" is a label for several unrelated designs, usually chosen for a specific scaling or data-shape need. Names of products below are examples, not endorsements.

**Key-value stores.** \`get(key)\`, \`put(key, value)\`; the value is opaque. Extremely fast and easy to partition. Use for sessions, caches, counters, feature flags, shopping carts. Weakness: no querying by value; you design around the key. (Redis, DynamoDB in its basic mode, etcd for small coordination data.)

**Document stores.** Values are structured documents (JSON-like) that you can query by fields. A document holds a whole **aggregate** (an order with its line items), so one read returns it all, with no joins. Use when data is naturally nested, schemas vary, and you mostly access by aggregate. Weaknesses: duplicated data, awkward many-to-many relationships and multi-document transactions (support varies). (MongoDB, Couchbase.)

**Wide-column stores.** Rows identified by a partition key, with sorted clustering columns inside the partition and sparse columns per row. Built on LSM trees for huge write throughput and horizontal scale. You model tables **per query** (denormalize heavily) and cannot do ad hoc joins. Use for time series, event logs, messaging history at massive scale. (Cassandra, HBase, Bigtable.)

**Graph databases.** Store nodes and edges as first-class, with traversal queries ("friends of friends who like X, 3 hops"). Use when relationships *are* the question: recommendation, fraud rings, dependency graphs. Weakness: harder to partition; many problems that sound like graphs are fine as relational joins at moderate depth. (Neo4j, and others.)

**How to choose** (rules of thumb):

| Need | Lean towards |
|---|---|
| Money, inventory, strict constraints, ad hoc reporting | relational |
| Simple lookups by id at huge scale, caching | key-value |
| Self-contained nested aggregates, evolving shape | document |
| Enormous sustained writes, known query patterns | wide-column |
| Multi-hop relationship queries | graph |

**Interview traps:** choosing NoSQL "for scale" with no numbers (a single well-tuned PostgreSQL or MySQL server handles a lot, and managed relational databases now scale far); saying NoSQL means "no schema" (the schema just lives in the application, and old documents still have to be read); and claiming NoSQL cannot do transactions (many offer them with limits). Compare with the relational view in [Databases](#/cs/databases).
`
    },
    {
      id: "search-vector",
      title: "Search and vector databases",
      body: `
Relational indexes answer "find rows where column equals or ranges". They are poor at "find documents that talk about this" or "find things similar to this". Two index families handle those.

**Full-text search: the inverted index.** Instead of document -> words, store word -> list of documents containing it (a **posting list**).

\`\`\`
doc1: "red fast car"      doc2: "blue car"      doc3: "red bike"
red  -> [doc1, doc3]
car  -> [doc1, doc2]
query "red car" -> intersect lists -> [doc1]
\`\`\`

Text is first **analysed**: lowercased, split into tokens, stop words dropped, words reduced to roots (**stemming**: "running" to "run"). The same analysis runs on the query. Results are ranked with a relevance score; **TF-IDF** and its refinement **BM25** score a document higher when the query term appears often in it but rarely across the collection. Search engines (Elasticsearch/OpenSearch, Solr, built on Lucene) also give you filters, facets and typo tolerance; PostgreSQL has built-in full-text search that is enough for modest needs.

**Vector search.** An **embedding** is a list of numbers (a vector, often hundreds to a few thousand dimensions) produced by a machine learning model so that *similar meaning means nearby vectors*. Text, images or products can be embedded. Search then becomes "find the k vectors nearest to the query vector", using a distance such as cosine similarity or Euclidean distance.

Exact nearest-neighbour search compares the query to every vector: O(n * d), too slow at scale. So databases use **approximate nearest neighbour (ANN)** indexes, which trade a little accuracy for large speed-ups:

- **HNSW**: a layered graph where search hops towards closer neighbours. Fast and accurate, memory-hungry.
- **IVF**: cluster the vectors, search only the few clusters nearest the query. Smaller, tunable.
- Compression (quantization) shrinks vectors further at some accuracy cost.

The key concept is **recall**: the fraction of the true nearest neighbours that the approximate search returns. You tune index parameters to trade recall against latency and memory.

Common pattern in LLM applications (retrieval-augmented generation): embed documents, store the vectors, embed a question, fetch the nearest chunks, hand them to the model. **Hybrid search** combines keyword (BM25) and vector scores, since keywords catch exact names and codes that embeddings blur.

**Interview traps:** treating a search engine as the system of record (usually it is a derived index fed from the main database); expecting exact results from ANN; and mixing embeddings from different models in one index (distances are meaningless across models). Vector support also exists as extensions of general databases, which is often enough at moderate scale.
`
    },
    {
      id: "oltp-olap",
      title: "OLTP vs OLAP and columnar storage",
      body: `
Two workloads need opposite designs.

**OLTP** (online transaction processing): many small, concurrent operations touching a few rows each: "place this order", "update this profile". Needs low latency, high concurrency, correctness (ACID). Stored **row by row**, so reading or writing one entire row touches one place; B-tree indexes locate rows fast.

**OLAP** (online analytical processing): few queries, each scanning huge numbers of rows but only a few columns: "total revenue per country per month over three years". Latency in seconds is fine; throughput on scans is what matters.

Running OLAP on the OLTP database is a classic mistake: a big scan evicts hot pages from the cache and competes for I/O with customer-facing queries.

**Columnar storage** stores each column's values together instead of each row's.

\`\`\`
row store:    [id1,US,19.99] [id2,DE,5.00] [id3,US,7.50]
column store: id:[1,2,3]  country:[US,DE,US]  amount:[19.99,5.00,7.50]
SUM(amount) GROUP BY country  -> reads only the country and amount columns
\`\`\`

Why it wins for analytics:

- **Reads only needed columns.** A table with 100 columns where the query uses 3 reads about 3% of the data.
- **Compresses well.** Same-typed neighbours with repeated values compress strongly (run-length encoding, dictionary encoding of strings like country codes).
- **Vectorized execution.** Operating on batches of column values is CPU- and cache-friendly.
- Sorting or partitioning data by date lets queries skip whole chunks using min/max metadata.

The cost: reconstructing a whole row, and single-row inserts and updates, are slow. Column stores prefer **bulk loads**.

**A warehouse pipeline** (ELT/ETL): operational databases -> extract (often through change data capture, see later) -> load into a **data warehouse** (BigQuery, Snowflake, Redshift, ClickHouse are examples of the category) -> transform into analytics tables. Teams also model a **star schema**: a central **fact table** (events or measurements: sales rows) surrounded by **dimension tables** (customer, product, date), often denormalized on purpose, which reverses the normalization advice for OLTP. **HTAP** systems try to serve both workloads in one product, usually by keeping a row copy and a column copy; evaluate carefully.

**Interview trap:** "just add an index" for an analytics query that must aggregate millions of rows; the right answer is often a separate analytical store or pre-aggregated tables (**materialized views**).
`
    },
    {
      id: "caching-redis",
      title: "Caching and Redis patterns",
      body: `
A **cache** keeps copies of expensive-to-get data in fast storage. **Redis** is an in-memory data-structure server often used for it. Its data types do real work: strings (also counters), hashes, lists, sets, **sorted sets** (members ordered by a score: leaderboards, rate-limit windows, delayed queues), and streams. Single commands are atomic.

**Caching patterns**

- **Cache-aside (lazy loading)**, the most common: the app checks the cache; on a miss it reads the database, then writes the result to the cache.
- **Write-through**: writes go to cache and database together. Reads stay warm, writes are slower.
- **Write-behind**: write to cache, flush to the database later. Fast, but you can lose data if the cache dies first.

\`\`\`
def get_user(uid):
    v = cache.get(f"user:{uid}")
    if v is not None:
        return v
    v = db.fetch_user(uid)
    cache.set(f"user:{uid}", v, ex=300)     # TTL: expire after 300 s
    return v

def update_user(uid, data):
    db.update_user(uid, data)
    cache.delete(f"user:{uid}")             # invalidate; next read refills
\`\`\`

Deleting on write (instead of overwriting the cache) is the safer default: it avoids a race where two writers set the cache in the wrong order.

**The hard problems**

- **Invalidation**: stale data until the TTL expires or you delete it. Always set a TTL as a safety net.
- **Cache stampede**: a hot key expires and thousands of requests all hit the database at once. Mitigations: per-key locking so one request refills while others wait, early/probabilistic refresh, adding random jitter to TTLs.
- **Cache penetration**: requests for keys that do not exist always miss. Cache a "not found" marker with a short TTL.
- **Eviction**: when memory is full, a policy such as least-recently-used removes entries; choose it deliberately.
- Persistence is optional in Redis (snapshots or an append-only log); treat a cache as losable unless you configured and tested otherwise.

**Other common uses:** rate limiting (an atomic \`INCR\` with an expiry), session storage, and simple distributed locks. For locks, set a value with a unique token and an expiry (\`SET key token NX EX 30\`) and release only if the token matches. A lock with an expiry can be held by two clients after a pause, so protect the real resource with a **fencing token** if correctness matters.

**Interview traps:** treating Redis as the only copy of important data; caching without a plan for invalidation; and ignoring the hit ratio (a cache with a low hit ratio adds latency and complexity for nothing).
`
    },
    {
      id: "schema-migrations",
      title: "Schema design and migrations without downtime",
      body: `
Changing a schema on a live system is risky because the application and the database change at different moments, and some changes lock tables. The central rule: **every step must work with both the old and the new application code**, because during a deploy both run at once.

**The expand / migrate / contract pattern** (also "parallel change"):

1. **Expand**: add the new thing without breaking the old (a new nullable column, a new table).
2. **Migrate**: deploy code that writes both old and new, backfill existing rows in small batches, switch reads to the new.
3. **Contract**: once nothing uses the old, drop it in a later release.

Example, renaming \`users.name\` to \`users.full_name\`: never run \`RENAME\` while old code is live. Instead add \`full_name\`, dual-write, backfill, switch reads, stop writing \`name\`, drop it later.

**Operations to treat with care** (behaviour is product- and version-specific; check your database's docs):

- **Adding a column with a default** or **a \`NOT NULL\`**: some engines rewrite the whole table or take a long exclusive lock; modern versions of some avoid that for constant defaults. Safer: add nullable, backfill in batches, then add the constraint (some engines let you add it as unvalidated first, then validate with a weaker lock).
- **Creating an index**: a plain create can block writes. Use the online variant (PostgreSQL: \`CREATE INDEX CONCURRENTLY\`; MySQL and others have online DDL options).
- **Backfills**: update in batches of a few thousand rows with pauses, not one giant transaction that holds locks, bloats the log, and lags replicas.
- **Lock queue effect**: a migration waiting for a lock blocks every later query queued behind it. Set a **lock timeout** so it fails fast and retries instead of freezing the app.
- **Dropping or renaming columns or tables**: only after nothing reads them; keep a way to roll back.

Large tables sometimes use external tools that copy the table, replay changes, and swap names (examples: gh-ost and pt-online-schema-change for MySQL).

**Schema design habits that age well:** declare constraints (primary key, foreign keys, \`NOT NULL\`, \`CHECK\`, \`UNIQUE\`) so the database defends invariants; use narrow, stable primary keys; store money as integers (cents) or exact decimals, never floats; store timestamps in UTC with a time zone type; prefer additive changes; keep migrations in version control and run them in order, one tool-managed history. See [SQL basics](#/cs/databases).

**Interview trap:** "we'll migrate during a maintenance window" is sometimes acceptable, but the strong answer explains how to do it with zero downtime and what you would measure (lock waits, replica lag).
`
    },
    {
      id: "cdc-streams",
      title: "Change data capture and streams",
      body: `
Systems around a database (search index, cache, warehouse, other services) need to learn about changes. The naive ways each have a flaw:

- **Dual writes** (the app writes the database, then also the search index): if one fails or they interleave differently under concurrency, the two disagree forever, and no transaction spans both.
- **Polling** (\`WHERE updated_at > :last\`): misses deletes, hits the database repeatedly, and can miss rows when timestamps tie or commit order differs from timestamp order.

**Change data capture (CDC)** reads the database's own ordered record of changes, the WAL or binary log we met earlier (via mechanisms such as PostgreSQL's logical decoding or MySQL's binlog), and turns each committed insert, update or delete into an **event**. Events usually go into a durable log such as Kafka, and consumers update their own stores. Debezium is a widely used open-source tool for this; the concept does not depend on it.

Benefits: the database stays the single source of truth; changes arrive in commit order; consumers are decoupled and can be added later, and replayed from the log to rebuild a derived store.

**The outbox pattern** solves a related problem: "update my table *and* publish a message, atomically." Write the business row and an \`outbox\` row **in one local transaction**; a CDC process or poller then publishes outbox rows to the broker. The message cannot be lost or published without the data change.

\`\`\`
BEGIN;
UPDATE orders SET status = 'paid' WHERE id = 42;
INSERT INTO outbox (aggregate_id, type, payload)
VALUES (42, 'OrderPaid', '{"order_id": 42}');
COMMIT;      -- a relay reads outbox and publishes; delete or mark rows afterwards
\`\`\`

**Delivery semantics.** The relay can crash after publishing and before marking done, so a message may be sent twice: you get **at-least-once** delivery. True exactly-once across systems is not generally achievable; instead make consumers **idempotent** (applying the same event twice has the same effect as once), for instance by recording processed event ids or using upserts keyed by entity id.

**Related ideas:** **event sourcing** stores the sequence of events as the source of truth and derives current state from it; **CQRS** separates the write model from read models. Both add complexity and are worth it only when their benefits (audit trail, multiple tailored read views) are truly needed.

**Interview traps:** proposing dual writes as the integration plan; promising exactly-once without idempotent consumers; and forgetting ordering is only guaranteed per partition or key, not globally.
`
    },
    {
      id: "choosing-database",
      title: "Interview: choosing a database",
      body: `
"Which database would you use for X?" is testing your reasoning, not your memory of products. A reliable structure:

1. **Clarify the access patterns and numbers.** What are the main reads and writes? Read:write ratio? Data size now and in a year? Writes per second at peak? Latency target? Do you need joins, ad hoc queries, transactions across entities?
2. **State the consistency and durability needs.** Money and inventory need correctness (transactions, constraints). A "like" counter tolerates staleness.
3. **Default to relational** (PostgreSQL or MySQL) unless a number or shape forces otherwise. It gives transactions, constraints, flexible queries and mature tooling, and one server goes a long way (a rule of thumb: millions of rows and thousands of operations per second are unremarkable on modern hardware with good indexes).
4. **Name the specific force that moves you off the default**, then the cost you accept:

| Force | Move | You give up |
|---|---|---|
| Huge sustained writes, simple known queries | wide-column / LSM store | joins, ad hoc queries, strong transactions |
| Lookup by key, low latency, caching | key-value / Redis | querying by value, durability if memory-only |
| Nested aggregates, evolving shape | document store | cross-document integrity |
| Text relevance, faceting | search engine as a derived index | being a source of truth |
| Similarity over embeddings | vector index | exactness |
| Scans over huge history | columnar warehouse | fast single-row writes |
| Multi-hop relationships | graph database | easy scaling |

5. **Compose, don't pick one.** Real systems use a relational primary store plus a cache, a search index, and a warehouse fed by CDC. Say which is the **source of truth** and which are derived and rebuildable.
6. **Say how it grows:** indexes, replicas for reads, partitioning/sharding for writes, and what the shard key would be.

**Worked examples (sketches):**

- *E-commerce orders*: relational primary (transactions on orders, payments, stock), Redis for sessions and the cart, search engine for product search, warehouse for reporting.
- *Chat message history*: access is "latest messages in a channel", enormous write volume; a partitioned store keyed by channel with messages sorted by time fits (wide-column or sharded relational), with user and channel metadata kept relational.
- *Product recommendations by similarity*: embeddings stored in a vector index, product data stays in the main database.

**Traps to avoid:** picking a technology by popularity; ignoring operational cost (who runs, backs up, and upgrades it?); choosing by benchmark headlines instead of your workload; ignoring failure behaviour ("what happens when the primary dies?"); and stating a number you cannot justify. If you assume a number, say it is an assumption.

Related: the practical SQL in [Databases](#/cs/databases) and the exercises in [SQL practice](#/cs/sql).
`
    }
  ],
  quiz: [
    {
      kind: "concept",
      q: "Why does a write-ahead log make commits fast and safe?",
      choices: [
        "The commit needs only one sequential log flush; data pages can be written later and replayed from the log after a crash",
        "It writes every data page to disk twice, so one copy always survives",
        "It keeps all data in memory and never writes to disk",
        "It removes the need for fsync"
      ],
      answer: 0,
      explain: "The log is flushed (fsync) before the commit is acknowledged, which is sequential and cheap. Dirty pages are written later in batches, and recovery redoes committed changes from the log."
    },
    {
      kind: "concept",
      q: "In an LSM tree, what does a delete actually do?",
      choices: [
        "Writes a tombstone marker that hides older values until compaction removes them",
        "Overwrites the old value in place with zeros",
        "Rebuilds the whole SSTable immediately",
        "Removes the key from the Bloom filter"
      ],
      answer: 0,
      explain: "SSTables are immutable, so a delete is a newer entry (a tombstone). The old data and the tombstone are dropped during compaction. Bloom filters cannot remove entries."
    },
    {
      kind: "pattern",
      q: "Queries are \`WHERE customer_id = ? AND status = ? AND created_at > ?\`. Which composite index order is best?",
      choices: [
        "(customer_id, status, created_at)",
        "(created_at, status, customer_id)",
        "(status, created_at, customer_id)",
        "(created_at, customer_id, status)"
      ],
      answer: 0,
      explain: "Put equality columns first and the range column last. After a range condition, later columns cannot narrow the seek."
    },
    {
      kind: "concept",
      q: "A table has an index on a boolean column where 95% of rows are true, and the query filters for true. What will a sensible planner usually do?",
      choices: [
        "Ignore the index and do a sequential scan, since reading most rows through an index is slower",
        "Always use the index, because indexes are always faster",
        "Refuse to run the query",
        "Rebuild the index first"
      ],
      answer: 0,
      explain: "Low selectivity means the index would fetch nearly every row through random page hops. A sequential scan is cheaper, and the planner uses statistics to see that."
    },
    {
      kind: "concept",
      q: "What is a partial index good for?",
      choices: [
        "Indexing only rows that match a condition, such as the few 'pending' orders, keeping the index small and cheap to maintain",
        "Indexing only the first half of each row",
        "Speeding up every query on the table equally",
        "Replacing the primary key"
      ],
      answer: 0,
      explain: "A partial (filtered) index covers a subset of rows. It suits skewed data and patterns like unique-where-not-deleted, but the query's WHERE must imply the index condition."
    },
    {
      kind: "bug",
      q: "EXPLAIN ANALYZE shows the planner estimated 10 rows at a node but 2,000,000 were produced. What is the most likely consequence and first fix?",
      choices: [
        "Join order and method were chosen from bad estimates; refresh statistics (ANALYZE) or add an index/extended statistics",
        "The query is already optimal; ignore the mismatch",
        "The database is out of disk space",
        "The cost numbers are in milliseconds and too high"
      ],
      answer: 0,
      explain: "Large estimate errors usually mean stale or insufficient statistics. Decisions above that node, such as nested loop versus hash join, may then be wrong. Cost is an internal unit, not milliseconds."
    },
    {
      kind: "concept",
      q: "What does MVCC give you?",
      choices: [
        "Readers see a consistent older version while writers create new ones, so readers and writers do not block each other",
        "Writers never need locks of any kind",
        "Automatic serializable isolation in every product",
        "Immunity from long-running transactions causing problems"
      ],
      answer: 0,
      explain: "MVCC keeps multiple row versions. Writers still conflict with other writers, snapshot isolation can still allow write skew, and long transactions pin old versions and cause bloat."
    },
    {
      kind: "bug",
      q: "Two transactions each lock a pair of rows, in opposite orders, and both hang until the database aborts one. How do you most effectively prevent this?",
      choices: [
        "Acquire locks in a consistent global order (for example by ascending id) and retry on deadlock errors",
        "Switch to a lower isolation level",
        "Make the transactions longer",
        "Remove the primary key"
      ],
      answer: 0,
      explain: "A consistent lock order removes the cycle. You still have to handle the occasional deadlock error by retrying, because deadlocks can never be excluded completely."
    },
    {
      kind: "concept",
      q: "With asynchronous single-leader replication, the leader crashes right after acknowledging a write. What can happen?",
      choices: [
        "A promoted follower may not have that write, so it can be lost",
        "The write is guaranteed to be on every follower",
        "The follower automatically replays it from the client",
        "Nothing, because async replication is lossless"
      ],
      answer: 0,
      explain: "Async replication acknowledges before followers confirm. Failover to a lagging follower can lose recent acknowledged writes. Synchronous replication avoids this at a latency and availability cost."
    },
    {
      kind: "pattern",
      q: "Which is the most important property of a good shard key?",
      choices: [
        "It spreads data and traffic evenly and matches the common query so most queries hit one shard",
        "It is always an auto-increment integer",
        "It changes often, to rebalance load",
        "It has as few distinct values as possible"
      ],
      answer: 0,
      explain: "A good key has high cardinality, even load, and aligns with query patterns. Monotonic keys create hot shards, and keys that change cause rows to move."
    },
    {
      kind: "complexity",
      q: "A leaderless store has N=5 replicas. Which setting guarantees that a read quorum overlaps every write quorum?",
      choices: [
        "W=3, R=3",
        "W=2, R=2",
        "W=1, R=4 ... no, W=1, R=3",
        "W=2, R=3 with N=6"
      ],
      answer: 0,
      explain: "Overlap needs R + W > N. 3 + 3 = 6 > 5. The 2+2, 1+3 and 2+3 with N=6 cases sum to 4, 4 and 5, none of which exceed N."
    },
    {
      kind: "concept",
      q: "What does PACELC add to CAP?",
      choices: [
        "Even with no partition there is a trade-off between latency and consistency",
        "That partitions never occur in cloud systems",
        "That availability is more important than consistency",
        "A third guarantee called Cost"
      ],
      answer: 0,
      explain: "PACELC: if Partition, choose Availability or Consistency; Else, choose Latency or Consistency. Strong replication costs round trips even in normal operation."
    },
    {
      kind: "concept",
      q: "What is 'recall' in approximate nearest neighbour search?",
      choices: [
        "The fraction of the true nearest neighbours that the approximate search returns",
        "How quickly the index can be rebuilt",
        "The number of dimensions in each vector",
        "The memory used by the index"
      ],
      answer: 0,
      explain: "ANN indexes trade accuracy for speed; recall measures the accuracy side. Index parameters let you trade recall against latency and memory."
    },
    {
      kind: "concept",
      q: "Why are columnar stores fast for analytics such as SUM(amount) GROUP BY country?",
      choices: [
        "They read only the needed columns, which also compress well and suit batch processing",
        "They keep every row in a B-tree for point lookups",
        "They avoid storing data on disk",
        "They make single-row updates cheaper than row stores"
      ],
      answer: 0,
      explain: "Column layout means a query touching 2 of 100 columns reads a small fraction of the data, and similar values compress strongly. The cost is slow single-row writes."
    },
    {
      kind: "bug",
      q: "A popular cache key expires and thousands of requests hit the database simultaneously. What is this, and one fix?",
      choices: [
        "A cache stampede; let one request refill the key under a lock, or add TTL jitter and early refresh",
        "Cache penetration; delete the database",
        "Write-behind; switch to write-through",
        "Cache eviction; add more memory only"
      ],
      answer: 0,
      explain: "A stampede is many misses on one hot key at once. Per-key locking, probabilistic early refresh and randomized TTLs spread or serialize the refill."
    },
    {
      kind: "pattern",
      q: "You must update an order row and also publish an event, never doing one without the other. What is the standard approach?",
      choices: [
        "Outbox pattern: write the row and an outbox row in one local transaction; relay the outbox to the broker, with idempotent consumers",
        "Write to the database, then to the broker, and hope both succeed",
        "Publish first, then update the database",
        "Use floating point timestamps to order them"
      ],
      answer: 0,
      explain: "A single transaction makes the data change and the pending event atomic. Delivery is then at-least-once, so consumers must be idempotent."
    }
  ],
  cards: [
    { id: "page", front: "What is a page in a storage engine?", back: "The fixed-size block (a few KB, e.g. 8 KB or 16 KB) that is the unit of disk I/O and caching; many rows live in one page." },
    { id: "btree-depth", front: "Why are B-trees shallow?", back: "Each node is a page holding hundreds of keys, so even huge tables need only about 3 to 4 levels; a lookup is a handful of page reads." },
    { id: "wal-rule", front: "The write-ahead log rule?", back: "Flush the log record describing a change to stable storage before acknowledging the commit; data pages are written later and recovered by replay." },
    { id: "checkpoint", front: "What does a checkpoint do?", back: "Writes dirty pages to disk and records that earlier log is no longer needed for recovery, bounding replay time." },
    { id: "lsm-write", front: "How does an LSM tree handle writes?", back: "Append to a WAL and an in-memory memtable, flush to immutable sorted SSTables, merge them later by compaction." },
    { id: "bloom", front: "What does a Bloom filter tell you?", back: "Either 'definitely not present' or 'maybe present': false positives possible, false negatives not. LSM reads use it to skip files." },
    { id: "amplification", front: "The three amplifications of LSM trees?", back: "Write (compaction rewrites data), read (several files may be checked) and space (stale versions persist until compaction)." },
    { id: "equality-first", front: "Composite index column order rule of thumb?", back: "Equality columns first, then the range column last; match the ORDER BY where possible." },
    { id: "selectivity", front: "What is selectivity?", back: "How narrowly a predicate filters, roughly the fraction of rows matched. Low selectivity makes the planner prefer a full scan over an index." },
    { id: "covering-deep", front: "What is an index-only scan?", back: "The index contains every column the query needs (via INCLUDE or extra key columns), so the table is not read." },
    { id: "partial-index", front: "What is a partial index?", back: "An index over only rows matching a condition (e.g. WHERE status = 'pending'); small and cheap; the query must imply the condition." },
    { id: "explain-analyze", front: "EXPLAIN versus EXPLAIN ANALYZE?", back: "EXPLAIN shows the estimated plan; ANALYZE runs the query and shows actual times and row counts, so wrap writes in a rolled-back transaction." },
    { id: "est-vs-actual", front: "Why compare estimated and actual rows?", back: "Big gaps mean stale or insufficient statistics, which can lead to bad join order and method choices." },
    { id: "mvcc-def", front: "What is MVCC?", back: "Keeping several versions of rows so readers see a consistent snapshot without blocking writers; old versions are later cleaned up." },
    { id: "long-tx", front: "Why are long transactions harmful under MVCC?", back: "They pin an old snapshot, preventing cleanup of dead versions, which causes bloat; they also hold locks and lag replicas." },
    { id: "deadlock-fix", front: "How do you prevent deadlocks?", back: "Take locks in a consistent order, keep transactions short, lock only needed rows, and retry when the database aborts a victim." },
    { id: "skip-locked", front: "What does FOR UPDATE SKIP LOCKED do?", back: "Locks rows for update but skips ones already locked by others; a common pattern for job queues with several workers." },
    { id: "repl-lag", front: "Name two replication-lag anomalies and fixes.", back: "Read-your-writes (read own writes from the leader) and monotonic reads (pin a user to one replica)." },
    { id: "split-brain", front: "What is split brain?", back: "Two nodes both believe they are leader and accept writes; prevented with terms/epochs and by fencing the old leader." },
    { id: "hash-shard", front: "Problem with hash(key) mod N sharding?", back: "Changing N moves almost all keys; use many fixed logical partitions or consistent hashing, and note range queries are lost." },
    { id: "cap", front: "What does CAP really say?", back: "During a network partition you must choose between consistency (linearizability) and availability; partitions cannot be opted out of." },
    { id: "quorum", front: "Quorum overlap rule?", back: "With N replicas, W write acks and R read contacts, R + W > N makes read and write sets overlap; it is not full linearizability by itself." },
    { id: "nosql-pick", front: "Four NoSQL families and a use for each?", back: "Key-value (cache, sessions), document (nested aggregates), wide-column (massive writes by known query), graph (multi-hop relationships)." },
    { id: "inverted-index", front: "What is an inverted index?", back: "A map from each term to the list of documents containing it; queries intersect or score posting lists, with BM25 or TF-IDF ranking." },
    { id: "ann", front: "Why use approximate nearest neighbour search?", back: "Exact vector search compares against every vector; ANN indexes (HNSW, IVF) trade a little recall for large speed gains." },
    { id: "columnar", front: "Why is columnar storage good for analytics?", back: "Reads only needed columns, compresses well, and processes in batches; bad at single-row writes." },
    { id: "cache-aside", front: "Cache-aside pattern?", back: "Check the cache; on a miss read the database and fill the cache; on writes update the database and delete the cache entry; set a TTL." },
    { id: "expand-contract", front: "Zero-downtime migration pattern?", back: "Expand (add new, compatible), migrate (dual-write, backfill in batches, switch reads), contract (drop old later); every step must work with old and new code." },
    { id: "cdc-outbox", front: "What is the outbox pattern?", back: "Write the data change and an outbox row in one transaction, then relay outbox rows to a broker; delivery is at-least-once so consumers must be idempotent." }
  ],
  related: {
    label: "Databases basics",
    href: "#/cs/databases",
    note: "ACID, isolation anomalies, indexes, query plans and normalization, the foundation for this deeper track."
  }
});
