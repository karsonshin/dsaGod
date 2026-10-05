/* Offer Ready: CS fundamentals, track. Query-plan output in the text is real SQLite output. */
OR.cs = OR.cs || [];
OR.cs.push({
  id: "databases",
  order: 4,
  title: "Databases",
  blurb: "ACID, transactions and isolation anomalies, locking versus MVCC, indexes and B-trees, query plans, normalization, SQL versus NoSQL.",
  minutes: 55,
  sections: [
    {
      id: "acid",
      title: "ACID",
      body: `
A **transaction** is a group of operations treated as one unit. ACID names what a transactional database promises:

- **Atomicity**: all of it happens or none of it does. If a transfer debits account A and the crash comes before it credits B, recovery undoes the debit. Implemented with an undo log or by never exposing uncommitted versions.
- **Consistency**: a transaction moves the database from one valid state to another, *given that the application's constraints are declared* (primary and foreign keys, \`CHECK\`, \`UNIQUE\`, \`NOT NULL\`). It is the odd one out: the database enforces the declared rules, the application defines what "valid" means.
- **Isolation**: concurrent transactions do not see each other's partial work; the degree is a setting (next sections).
- **Durability**: once committed, the data survives a crash. Implemented with a **write-ahead log (WAL)**: the log record is flushed to disk *before* the commit is acknowledged, and data pages can be written lazily and replayed from the log after a crash.

Interview traps: "C in ACID is not the same as C in CAP" (CAP's consistency is about replicas agreeing, roughly linearizability); durability means flushed to stable storage, so a database with \`fsync\` disabled is not durable; and ACID does not mean serializable by default, because the default isolation level is usually weaker.

\`\`\`
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;      -- or ROLLBACK; to undo both
\`\`\`

Use a single \`UPDATE ... SET balance = balance - 100\` rather than read, compute in the app, write back, which is a lost-update race even inside a transaction at weaker isolation levels.
`
    },
    {
      id: "isolation",
      title: "Isolation levels and anomalies",
      body: `
Perfect isolation (**serializable**: the result equals some one-at-a-time order) costs concurrency, so databases offer weaker levels. They are defined by the anomalies they permit.

**The anomalies**

- **Dirty read**: you read data another transaction has written but not yet committed (and it may roll back).
- **Non-repeatable read**: you read a row twice in one transaction and get different values because someone committed an update in between.
- **Phantom read**: you run the same range query twice and the *set of rows* changes because someone committed an insert or delete.
- **Lost update**: two transactions read the same value, both compute a new one, the second write overwrites the first.
- **Write skew**: two transactions read overlapping data, make *disjoint* writes based on what they read, and together break an invariant. Example: a rule says at least one doctor is on call. Doctors A and B both check "two are on call", each takes themselves off, and now nobody is on call. Neither write conflicts with the other, so row-level conflict checks do not catch it.

**The standard table** (X means the anomaly is permitted by the SQL standard):

| Level | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| Read uncommitted | X | X | X |
| Read committed | prevented | X | X |
| Repeatable read | prevented | prevented | X |
| Serializable | prevented | prevented | prevented |

**Reality is messier**, and a strong answer says so:

- **Snapshot isolation** (PostgreSQL's \`REPEATABLE READ\`, Oracle's "serializable") gives each transaction a stable snapshot. It prevents dirty and non-repeatable reads and phantoms, and detects some lost updates, but **still allows write skew**. Only true serializable (PostgreSQL's SSI, or strict locking) prevents it.
- MySQL InnoDB defaults to \`REPEATABLE READ\` and uses next-key (range) locks, which prevent most phantoms for locking reads.
- Defaults: PostgreSQL, SQL Server (default mode) and Oracle use **read committed**; MySQL InnoDB uses **repeatable read**.
- Fixes for write skew and lost updates without going fully serializable: \`SELECT ... FOR UPDATE\` on the rows you depend on, an explicit constraint or unique index that makes the conflict visible, optimistic version columns, or retry on serialization failure.
- Under serializable you must be prepared to **retry** transactions that fail with a serialization error.
`
    },
    {
      id: "locking-mvcc",
      title: "Locking versus MVCC",
      body: `
Two ways to implement isolation:

**Lock-based (pessimistic)**: readers take shared locks, writers take exclusive locks, and conflicting requests wait. **Two-phase locking (2PL)** acquires locks during the transaction and releases them all only at commit or rollback, which gives serializability. Cost: readers block writers and writers block readers, and **deadlocks** occur (the database detects the cycle and aborts a victim). **Row**, **page** and **table** locks trade granularity against overhead; **intent locks** announce finer locks to the table level.

**MVCC (multi-version concurrency control)**: a write creates a *new version* of the row instead of overwriting it, and each transaction reads the version visible to its snapshot (by transaction id or timestamp). Result: **readers never block writers and writers never block readers**, so mixed read-heavy workloads scale far better. Writers still conflict with each other on the same row. Costs: old versions must be cleaned up (PostgreSQL \`VACUUM\`; InnoDB purge from the undo log), long-running transactions hold back that cleanup and cause bloat, and snapshot isolation alone allows write skew.

**Optimistic concurrency** at the application level: read a \`version\` column, write with \`UPDATE ... WHERE id = ? AND version = ?\`, and treat zero affected rows as a conflict to retry. Good when conflicts are rare.

Practical rules: keep transactions short; touch rows in a consistent order (avoids deadlocks); never hold a transaction open across a user interaction or a network call; and know whether your engine's \`SELECT\` takes locks (usually not, under MVCC) or whether you must write \`FOR UPDATE\`.
`
    },
    {
      id: "indexes",
      title: "Indexes and B-trees",
      body: `
An **index** is a separate sorted structure that lets the database find rows without scanning the whole table. The default is a **B+ tree**: a balanced tree with a very high fan-out (hundreds of keys per page), where internal pages route the search and **leaf pages hold the entries in sorted order, linked together**.

Why B-trees: each node is one disk page, so lookup costs \`O(log_b n)\` page reads. With a fan-out of a few hundred, three or four levels cover billions of rows. The linked sorted leaves make **range scans** and \`ORDER BY\` cheap. Inserts that overflow a page **split** it, keeping the tree balanced.

Useful rules:

- **Composite index** \`(a, b, c)\` serves \`WHERE a = ?\`, \`a = ? AND b = ?\` and so on (the **leftmost prefix** rule). It does not help \`WHERE b = ?\` alone. Put equality columns first, then a range column.
- **Covering index**: the index contains every column the query needs, so the table is never touched (an index-only scan).
- **Clustered index** (InnoDB primary key, SQL Server clustered): the table rows themselves are stored in key order, so a secondary index lookup needs a second hop through the primary key. In PostgreSQL the table is a heap and every index points to row locations.
- **Selectivity** matters: an index on a boolean or a status with three values rarely helps unless the value you want is rare.
- A condition must be **sargable**: \`WHERE created_at >= '2024-01-01'\` can use the index; \`WHERE DATE(created_at) = ...\`, \`WHERE amount + 0 = 5\` or \`LIKE '%abc'\` generally cannot.
- Every index **slows writes** and takes space, so index for real queries, not for every column.
- Other structures: **hash indexes** (equality only), **LSM trees** (write-optimized, used by Cassandra and RocksDB), **GIN/inverted** (full text, arrays), **bitmap** (low cardinality, analytics), **GiST/R-tree** (spatial).
`
    },
    {
      id: "plans",
      title: "Query plans",
      body: `
SQL says *what* you want; the **optimizer** chooses *how*: which indexes, which join order, which join algorithm. \`EXPLAIN\` shows the chosen plan (\`EXPLAIN ANALYZE\` in PostgreSQL and MySQL 8 also runs it and reports actual times and row counts).

What to look for:

- **Scan type**: a full table scan (\`Seq Scan\`, \`SCAN\`, \`type: ALL\`) versus an index search, an index-only (covering) scan, or a bitmap scan. A full scan is *fine* for small tables or when most rows are needed.
- **Join algorithm**: **nested loop** (good with an index on the inner side and few outer rows), **hash join** (builds a hash table on the smaller input; good for large unsorted equi-joins), **merge join** (both inputs sorted; good when they already are).
- **Estimated versus actual rows**: a big gap means stale statistics (\`ANALYZE\`) or correlated columns, which is the usual root cause of a bad plan.
- Sorts and temporary spills to disk, and the number of rows at each step (filter early, join late).

A real run of SQLite's \`EXPLAIN QUERY PLAN\` on a 10,000-row \`orders\` table for \`WHERE customer_id = 42 AND status = 'paid'\`:

\`\`\`
no index                          SCAN orders
index on (customer_id)            SEARCH orders USING INDEX idx_orders_customer (customer_id=?)
index on (customer_id, status, amount)
                                  SEARCH orders USING COVERING INDEX idx_cov (customer_id=? AND status=?)
WHERE customer_id + 0 = 42        SCAN orders     (arithmetic on the column defeats the index)
\`\`\`

Other tuning moves: select only the columns you need, avoid \`SELECT *\` in hot paths, fix N+1 query patterns in the application (one query per row of a previous result), paginate with **keyset** (\`WHERE id > last_seen ORDER BY id LIMIT 50\`) instead of large \`OFFSET\`s, and batch writes. Always measure with the real data distribution; plans change with table size.
`
    },
    {
      id: "normalization",
      title: "Normalization",
      body: `
**Normalization** organizes tables to remove redundancy, so each fact is stored once and cannot disagree with itself (no **update, insert or delete anomalies**).

The memory aid for 3NF: every non-key attribute depends on **the key, the whole key, and nothing but the key**.

- **1NF**: every column holds a single atomic value, with no repeating groups. A column \`phones = "555-1, 555-2"\` violates it; give phones their own rows.
- **2NF**: (1NF and) no non-key column depends on only *part* of a composite key. In \`order_items(order_id, product_id, product_name, qty)\`, \`product_name\` depends only on \`product_id\`, so move it to \`products\`.
- **3NF**: (2NF and) no non-key column depends on another non-key column (**transitive** dependency). In \`employees(id, dept_id, dept_name)\`, \`dept_name\` depends on \`dept_id\`, so move it to \`departments\`.
- **BCNF**: every determinant is a candidate key. A stricter 3NF; the difference shows up only with overlapping candidate keys.

**Denormalization** is the deliberate reversal: copy a column or precompute a count so reads avoid joins. It is a performance trade, not a mistake, but you now own keeping the copies consistent (triggers, application code, or rebuild jobs). Analytics warehouses use denormalized **star schemas** (a central fact table plus dimension tables); OLTP systems stay normalized. A good order of operations: normalize first, measure, then denormalize specific hot paths.
`
    },
    {
      id: "sql-nosql",
      title: "SQL versus NoSQL",
      body: `
"NoSQL" is a family, not one thing:

| Type | Shape | Examples | Good for |
|---|---|---|---|
| Key-value | Key to opaque value | Redis, DynamoDB | Caches, sessions, simple high-speed lookups |
| Document | JSON-like documents | MongoDB, Firestore | Aggregate-shaped data read and written together |
| Wide-column | Rows with flexible columns, partitioned | Cassandra, HBase | Huge write volume, time series, known access patterns |
| Graph | Nodes and edges | Neo4j | Relationship-heavy queries (friends of friends) |

**Relational** strengths: a rich query language with joins, mature transactions and constraints, and a schema that protects data quality. **NoSQL** strengths: horizontal scaling through partitioning, flexible or evolving schemas, and low latency for known access paths.

The trade-offs in plain terms:

- Relational systems scale **up** easily and **out** with effort (read replicas, sharding); many NoSQL systems were built to partition from day one, at the price of limited joins and ad hoc queries, so you **design tables around your queries**.
- "Schema-less" really means **schema on read**: the schema lives in application code.
- Under a network partition a distributed store must choose between **consistency and availability** (CAP). Many NoSQL stores default to eventual consistency (**BASE**: basically available, soft state, eventually consistent), though most now offer tunable consistency or transactions in limited scope. Say "it depends on the product and configuration".
- Modern relational databases handle JSON columns, and some NoSQL systems add SQL-like query layers, so the line blurs.

A good interview answer starts with **access patterns, consistency needs and scale**, not a brand: "Default to a relational database; reach for something else when a specific need (extreme write throughput, flexible documents, graph traversal, caching) justifies the operational cost of another system."
`
    },
    {
      id: "sql-practice-link",
      title: "Practice: SQL without a database",
      body: `
Reading about joins is not the same as writing them. The [SQL practice set](#/cs/sql) has 15 exercises (joins, aggregation, window functions, self joins and NULL traps) with sample tables, a hidden reference solution and the exact expected result for each. You write your query in a text box, compare, and mark yourself. The reference queries were all executed in SQLite and the expected tables are their real output.
`
    }
  ],
  quiz: [
    {
      kind: "concept",
      q: "A transaction debits account A, then the server crashes before it credits account B. Which ACID property makes recovery undo the debit?",
      choices: ["Consistency", "Isolation", "Atomicity", "Availability"],
      answer: 2,
      explain: "Atomicity: all or nothing. Recovery uses the log to roll back the unfinished transaction."
    },
    {
      kind: "concept",
      q: "Transaction T1 reads a row twice and sees different values because T2 updated and committed in between. This anomaly is a:",
      choices: ["Dirty read", "Non-repeatable read", "Phantom read", "Write skew"],
      answer: 1,
      explain: "Same row, different values across two reads in one transaction: a non-repeatable read. A dirty read would see *uncommitted* data."
    },
    {
      kind: "concept",
      q: "T1 runs `SELECT COUNT(*) FROM t WHERE x > 10` twice and gets different counts because T2 inserted a matching row and committed. This is a:",
      choices: ["Dirty read", "Non-repeatable read", "Phantom read", "Lost update"],
      answer: 2,
      explain: "The set of rows matching a predicate changed: a phantom."
    },
    {
      kind: "concept",
      q: "Two doctors each check that at least two are on call, then each takes themselves off call. Nobody is on call. Which anomaly is this, and which level prevents it?",
      choices: [
        "Dirty read; read committed",
        "Write skew; only true serializable (or explicit locking)",
        "Lost update; read uncommitted",
        "Phantom; read committed"
      ],
      answer: 1,
      explain: "Write skew: disjoint writes based on overlapping reads break an invariant. Snapshot isolation (e.g. PostgreSQL REPEATABLE READ) allows it; serializable or SELECT ... FOR UPDATE on the dependent rows prevents it."
    },
    {
      kind: "concept",
      q: "What does MVCC mainly buy you over plain two-phase locking?",
      choices: [
        "Readers do not block writers and writers do not block readers",
        "No need for any cleanup",
        "Writers never conflict with each other",
        "It guarantees serializability by itself"
      ],
      answer: 0,
      explain: "Readers use a snapshot of old versions. Writers still conflict with each other, old versions need cleanup, and snapshot isolation alone permits write skew."
    },
    {
      kind: "concept",
      q: "Given an index on `(a, b, c)`, which query can use it for an efficient lookup?",
      choices: ["WHERE b = 5", "WHERE c = 7", "WHERE a = 1 AND b = 5", "WHERE b = 5 AND c = 7"],
      answer: 2,
      explain: "The leftmost-prefix rule: the index serves conditions on a, then a and b, then a, b and c. The others skip the leading column."
    },
    {
      kind: "concept",
      q: "Which predicate is **not** sargable (cannot efficiently use a normal index on `created_at`)?",
      choices: [
        "created_at >= '2024-01-01'",
        "created_at BETWEEN '2024-01-01' AND '2024-01-31'",
        "DATE(created_at) = '2024-01-01'",
        "created_at = '2024-01-01 10:00:00'"
      ],
      answer: 2,
      explain: "Wrapping the column in a function forces evaluating it for every row. Rewrite as a range on the bare column."
    },
    {
      kind: "concept",
      q: "A column `dept_name` in `employees(id, dept_id, dept_name)` depends on `dept_id`, not on `id`. Which normal form does that violate?",
      choices: ["1NF", "2NF", "3NF", "None"],
      answer: 2,
      explain: "A non-key attribute depending on another non-key attribute is a transitive dependency, which 3NF forbids. 2NF concerns partial dependency on part of a composite key."
    },
    {
      kind: "concept",
      q: "Pick **all** statements that are true.",
      choices: [
        "PostgreSQL's default isolation level is read committed",
        "MySQL InnoDB's default is repeatable read",
        "ACID always implies serializable isolation",
        "A covering index can answer a query without reading the table"
      ],
      answer: [0, 1, 3],
      explain: "Isolation is configurable and usually weaker than serializable by default."
    }
  ],
  cards: [
    {
      id: "acid",
      front: "ACID, one line each?",
      back: "Atomicity: all or nothing. Consistency: declared constraints hold after commit. Isolation: concurrent transactions do not see partial work. Durability: committed data survives a crash (via a write-ahead log)."
    },
    {
      id: "wal",
      front: "What is a write-ahead log?",
      back: "Changes are appended to a log and flushed before the commit is acknowledged; data pages are written later. After a crash, the log is replayed (redo) and unfinished work undone."
    },
    {
      id: "anomalies",
      front: "Dirty vs non-repeatable vs phantom read?",
      back: "Dirty: read uncommitted data. Non-repeatable: same row changes between two reads. Phantom: the set of matching rows changes between two range reads."
    },
    {
      id: "write-skew",
      front: "What is write skew and how do you fix it?",
      back: "Two transactions read overlapping data and write disjoint rows, breaking an invariant (both doctors go off call). Fix with serializable isolation, SELECT ... FOR UPDATE on the rows relied on, or a constraint."
    },
    {
      id: "iso-defaults",
      front: "Default isolation levels?",
      back: "PostgreSQL, Oracle and SQL Server (default mode): read committed. MySQL InnoDB: repeatable read. PostgreSQL's repeatable read is snapshot isolation and still allows write skew."
    },
    {
      id: "mvcc",
      front: "How does MVCC work and what does it cost?",
      back: "Writes create new row versions; each transaction reads the version visible to its snapshot, so readers and writers do not block each other. Cost: version cleanup (vacuum or purge) and bloat from long transactions."
    },
    {
      id: "2pl",
      front: "What is two-phase locking?",
      back: "Acquire locks as you go, release them all only at commit or rollback. Guarantees serializability; readers and writers block each other and deadlocks need detection."
    },
    {
      id: "btree",
      front: "Why B+ trees for indexes?",
      back: "High fan-out keeps the tree 3 to 4 levels deep for billions of rows, each node is one disk page, and linked sorted leaves make range scans and ORDER BY cheap."
    },
    {
      id: "leftmost",
      front: "Composite index leftmost-prefix rule?",
      back: "An index on (a, b, c) serves a; a and b; a, b and c. It does not serve b or c alone. Equality columns first, then the range column."
    },
    {
      id: "covering",
      front: "Covering index?",
      back: "An index that holds every column a query needs, so the table is never read (index-only scan)."
    },
    {
      id: "sargable",
      front: "Sargable predicates?",
      back: "Conditions written so an index can be used: compare the bare column to a value or range. Functions or arithmetic on the column, or a leading-wildcard LIKE, defeat the index."
    },
    {
      id: "explain",
      front: "What do you look for in a query plan?",
      back: "Scan type (full scan vs index), join algorithm, estimated vs actual rows (stale stats), sorts and spills, and where rows are filtered."
    },
    {
      id: "3nf",
      front: "3NF in one phrase?",
      back: "Every non-key attribute depends on the key, the whole key, and nothing but the key. No partial or transitive dependencies."
    },
    {
      id: "nosql",
      front: "When pick NoSQL over relational?",
      back: "When a concrete need justifies it: huge partitioned write volume, flexible aggregates, graph traversal, or caching. Otherwise default to relational; design NoSQL tables around known queries."
    },
    {
      id: "join-null",
      front: "NULL traps in SQL?",
      back: "NULL = NULL is unknown, so use IS NULL. NOT IN over a column containing NULL returns nothing; use NOT EXISTS. COUNT(col) skips NULLs; COUNT(*) does not. SUM over no rows is NULL."
    }
  ],
  related: {
    label: "SQL practice set",
    href: "#/cs/sql",
    note: "15 exercises with hidden solutions and exact expected results."
  }
});
