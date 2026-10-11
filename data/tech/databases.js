(function () {
  var OR = (window.OR = window.OR || {}); OR.tech = OR.tech || { items: [] };
  OR.tech.items.push(
    {
      id: 'db-2026-10-spanner-omni-ga',
      area: 'Databases',
      date: '2026-10-07',
      title: 'Google makes Spanner Omni generally available for self-hosting',
      source: 'InfoQ (news)',
      url: 'https://www.infoq.com/news/2026/10/spanner-omni-deploy-anywhere-ga/',
      summary: 'Spanner Omni, a distributed SQL database, can now run in your own data center, on other clouds or on a laptop. It swaps Google\'s Colossus file system and TrueTime atomic-clock service for software equivalents, while keeping Paxos, automatic sharding and synchronous replication. Google claims millions of queries per second in internal tests. Caveats: no availability SLA, some cloud-linked integrations excluded, and operations move to the customer.',
      why: 'It shows how a famously hardware-dependent design is being repackaged for ordinary infrastructure, and what you take on when you self-host a globally consistent database.',
      terms: [
        ['TrueTime', 'Google\'s clock service that bounds time uncertainty so transactions can be ordered globally.'],
        ['Paxos', 'A consensus protocol that lets replicas agree on a value even when some fail.'],
        ['Synchronous replication', 'A write is acknowledged only after replicas have stored it.']
      ],
      interview: 'A good example of the consistency vs availability trade-off and how clock assumptions affect distributed transactions.'
    },
    {
      id: 'db-2026-09-aurora-dsql-foreign-keys',
      area: 'Databases',
      date: '2026-09-28',
      title: 'Aurora DSQL adds foreign key constraints',
      source: 'InfoQ (news)',
      url: 'https://www.infoq.com/news/2026/09/aurora-dsql-foreign-keys/',
      summary: 'AWS added foreign keys, including CASCADE and SET NULL actions, to its distributed SQL service Aurora DSQL (announced August, reported September 28). Checks run against a consistent snapshot without table locks. A conflicting transaction is rejected with a serialization error rather than waiting, so applications need retry logic. AWS advises benchmarking first because every write to related tables now costs extra reads.',
      why: 'It shows that integrity features in optimistic, lock-free databases surface as retries in your application code.',
      terms: [
        ['Foreign key', 'A constraint requiring a column value to exist in another table.'],
        ['Optimistic concurrency', 'Transactions proceed without locks and are aborted at commit if they conflict.'],
        ['Serialization error', 'An abort signalling the transaction could not be ordered consistently with others.']
      ],
      interview: 'Ties to transaction isolation levels and why retry-on-conflict is a standard pattern.'
    },
    {
      id: 'db-2026-09-duckdb-2-alpha',
      area: 'Databases',
      date: '2026-09-02',
      title: 'DuckDB 2.0 hits feature freeze with an alpha',
      source: 'DuckDB official blog',
      url: 'https://duckdb.org/2026/09/02/try-duckdb-20-alpha.html',
      summary: 'The DuckDB team branched v2.0 and froze features, leaving only testing and bug fixing. Alpha builds exist for the CLI and Python. The quack client-server extension moves to 1.0, and httpfs, ducklake, iceberg and spatial extensions are in alpha. The post says alpha clients are not production-ready. The release is projected for the second half of October; the release calendar lists 21 October as tentative.',
      why: 'DuckDB is a common embedded analytics engine, and a major version can change how you use it from Python and over the network.',
      terms: [
        ['Feature freeze', 'A point after which only fixes, not new features, are accepted.'],
        ['Embedded database', 'A database that runs inside your application process instead of as a separate server.'],
        ['Extension', 'An optional module loaded into the database to add capabilities.']
      ],
      interview: 'Useful for contrasting OLAP (columnar, analytical) engines with OLTP databases.'
    },
    {
      id: 'db-2026-09-mariadb-13-duckdb',
      area: 'Databases',
      date: '2026-09-15',
      title: 'MariaDB 13.0 reaches stable with an experimental DuckDB engine',
      source: 'MariaDB documentation',
      url: 'https://mariadb.com/docs/release-notes/community-server/changelogs/13.0/13.0.2.md',
      summary: 'MariaDB Community Server 13.0.2 was released as stable on 15 September 2026. The changelog is dominated by fixes to innodb_log_archive, a log archiving feature, covering corruption, recovery failures and race conditions. Secondary coverage says 13.0 also adds UPDATE ... RETURNING and a DuckDB storage engine for columnar analytics (still labelled gamma). It is a rolling release rather than long-term support, and mariadb-backup does not yet support the archive feature.',
      why: 'It shows a traditional row-store database bolting on a columnar engine, and the support-line choice teams face between rolling and LTS releases.',
      terms: [
        ['Storage engine', 'The component that decides how a table is stored on disk and read back.'],
        ['Redo log', 'A log of changes used to recover a database after a crash.'],
        ['LTS', 'Long-term support: a release line maintained with fixes for years.']
      ],
      interview: 'Relates to row-oriented vs column-oriented storage and write-ahead logging for crash recovery.'
    },
    {
      id: 'db-2026-08-postgres-security-release',
      area: 'Databases',
      date: '2026-08-13',
      title: 'PostgreSQL minor releases fix 28 security issues',
      source: 'PostgreSQL project',
      url: 'https://www.postgresql.org/about/news/postgresql-186-1711-1615-1519-1424-and-19-beta-3-released-3365/',
      summary: 'PostgreSQL 18.6, 17.11, 16.15, 15.19 and 14.24 fix 28 security vulnerabilities and over 110 bugs; 18.5 was skipped because of a regression. Three issues need follow-up after updating: bad reltuples values after parallel GIN builds, possibly corrupt btree_gist indexes on NaN or bit columns, and possibly corrupt ltree indexes. PostgreSQL 14 stops receiving fixes on 12 November 2026.',
      why: 'It is a concrete reminder that minor updates can require reindexing, and that major versions have a hard end-of-life date.',
      terms: [
        ['REINDEX', 'A command that rebuilds an index from the table data.'],
        ['End of life', 'The date a version stops receiving fixes, including security patches.'],
        ['GIN index', 'An inverted index type used for arrays, full-text search and JSON.']
      ],
      interview: 'Connects to indexing internals and why index corruption means wrong query results, not just slowness.'
    },
    {
      id: 'db-2026-09-linear-eu-sync-outage',
      area: 'Databases',
      date: '2026-09-27',
      title: 'Linear explains a 10-hour sync outage that began with database maintenance',
      source: 'Linear incident report',
      url: 'https://linear.app/docs/eu-sync-outage',
      summary: 'A table-repacking cron job ran long transactions in Linear\'s EU cell, which stopped the sync source from creating its replication slot. Later a race condition made sync servers drop a reset message, and replacement servers never became ready. EU users lacked live updates for about 10 hours. Roughly 9.5 hours passed before an engineer was paged because alerts were misrouted or closed. Linear fixed the reset bug and improved alerting.',
      why: 'It shows how routine maintenance on a database can cascade into replication trouble, and how weak alerting turns a fault into a long outage.',
      terms: [
        ['Replication slot', 'A Postgres feature that reserves a position in the write-ahead log for a consumer.'],
        ['Repack', 'Rewriting a table to reclaim bloated space, which can hold long locks or transactions.'],
        ['Race condition', 'A bug where behaviour depends on the unlucky timing of two events.']
      ],
      interview: 'A real incident for discussing observability, on-call, and failure modes in replication and CDC pipelines.'
    },
    {
      id: 'db-2026-09-uber-m3db-subclusters',
      area: 'Databases',
      date: '2026-09-21',
      title: 'Uber limits failure blast radius in M3DB with subclusters',
      source: 'InfoQ (news)',
      url: 'https://www.infoq.com/news/2026/09/uber-m3db-subcluster-sharding/',
      summary: 'Uber changed M3DB, its time-series store, so nodes are grouped into fixed-size subclusters that each own a separate slice of shards. Previously a node could share data with up to two thirds of the cluster, so one failure or topology change touched many nodes. Scaling uses a greedy algorithm to choose shards to move. Limits include equal instance weights and scaling only in multiples of the subcluster size.',
      why: 'It is a practical case of shrinking the blast radius of failures in a sharded system.',
      terms: [
        ['Shard', 'A slice of a dataset stored on a subset of nodes.'],
        ['Replication factor', 'How many copies of each piece of data are kept.'],
        ['Blast radius', 'How much of a system a single failure can affect.']
      ],
      interview: 'Relates to sharding, replica placement and consistent hashing trade-offs in system design.'
    },
    {
      id: 'db-2026-09-databricks-cdf-iceberg',
      area: 'Databases',
      date: '2026-09-01',
      title: 'Databricks makes automatic change data feed generally available',
      source: 'Databricks release notes',
      url: 'https://docs.databricks.com/aws/en/release-notes/product/2026/september',
      summary: 'Databricks says automatic change data feed is generally available. It computes changes at query time instead of requiring per-table enablement, works for Delta and Iceberg v3 tables, and needs Runtime 19 or later with row tracking. The notes claim MERGE and UPDATE become about 15% faster on tables queried for changes. September notes also list foreign Iceberg and Delta table sharing as GA.',
      why: 'Lakehouse tables are replacing separate warehouses, and change feeds are how downstream systems stay in sync.',
      terms: [
        ['Change data feed', 'A stream of row-level inserts, updates and deletes from a table.'],
        ['Lakehouse', 'An architecture that adds table semantics to files in object storage.'],
        ['Apache Iceberg', 'An open table format that tracks data files and snapshots for large analytic tables.']
      ],
      interview: 'Links to change data capture and keeping derived stores consistent with a source of truth.'
    }
  );
})();
