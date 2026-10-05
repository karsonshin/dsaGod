/* System design case study: file sync and storage (Dropbox-style). Schema: data/sd/schema.md.
   Numbers are rounded estimates; "a common approach" means a widely used pattern, not a claim about any company. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'file-sync',
    title: 'Design a file sync service',
    short: 'Keep folders identical across a user\'s devices. Chunking, dedupe, change notification and conflict handling.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Chunking', 'Dedupe', 'Metadata', 'Notifications', 'Conflicts'],
    prompt: 'Design a service like Dropbox or Google Drive. Users keep a folder on each of their devices; changes on one device appear on the others, files can be shared with other people, and old versions can be restored.',

    requirements: {
      functional: [
        'A desktop or mobile client watches a local folder and uploads changes automatically.',
        'Changes made on one device are downloaded to the user\'s other devices.',
        'Files up to several gigabytes; large files must resume after interruption.',
        'Version history: restore a previous version or a deleted file for a retention period.',
        'Share a file or folder with other users (view or edit) or by link.',
        'Offline edits sync when the device reconnects, with a defined behaviour on conflicts.'
      ],
      nonFunctional: [
        '**Durability** is the product: a file that was acknowledged as synced must not be lost. Target 11 nines of durability for stored blocks.',
        '**Efficiency**: a small edit to a large file should not re-upload the whole file; identical content stored once.',
        '**Freshness**: a change appears on other online devices within a few seconds.',
        '**Consistency**: the file tree a user sees is consistent (no half-applied renames), even if delivery is eventual.',
        '**Availability** 99.9% or better; offline work must keep working locally.',
        'Security: encryption in transit and at rest, per-file authorisation on every read.'
      ],
      outOfScope: ['Real-time collaborative editing inside documents.', 'Full-text search over file contents and previews.', 'Billing, quotas and admin consoles beyond a storage limit hook.', 'Client-side zero-knowledge encryption in depth.', 'Mobile photo backup specifics.'],
      assumptions: ['Average user has tens of thousands of files, but only a handful change on a given day.', 'Most files are small (under 1 MB) with a long tail of large ones; most data is cold.', 'Each user has about 2 to 3 devices.'],
      clarify: [
        { q: 'Is this sync only, or also a file store with web access?', a: 'Both share the same backend: the desktop client is one client of the file API. Web access reads the same metadata and blocks.' },
        { q: 'Do we need real-time co-editing?', a: 'No. Conflicts are handled at the file level (keep both). Real-time co-editing needs operational transforms or CRDTs, a different project.' },
        { q: 'How long do we keep old versions and deleted files?', a: 'Assume 30 days on the free tier and longer for paid plans. This affects storage and garbage collection, since blocks may be referenced only by old versions.' },
        { q: 'Maximum file size?', a: 'Assume 50 GB. It fixes chunk size and rules out buffering whole files in memory or in a single request.' }
      ]
    },

    estimates: {
      intro: 'Model 20 million daily users. The calculator\'s "write" is **a committed file version** (after the client has uploaded its new blocks) and its "read" is a **sync request or download**. Storage depends on **new unique bytes** per commit, which chunking, delta sync and dedupe reduce a lot.',
      inputs: { dau: 20e6, writesPerUser: 5, readsPerUser: 40, peakFactor: 3, bytesPerWrite: 200e3, bytesPerRead: 100e3, years: 5, replication: 1.5, hotFraction: 0.1, serverQps: 1000, utilization: 0.6 },
      assumptions: [
        '**5 committed versions per user per day**: most users change a few files; a few power users change hundreds.',
        '**40 reads a day**: change-list polls, metadata fetches and downloads blended; most are tiny metadata calls.',
        '**200 KB of new unique data per commit (approximate)** after chunking, delta sync and dedupe. A whole-file average could be several times larger.',
        '**100 KB per read** blended between small metadata responses and occasional large downloads (approximate).',
        '**Replication 1.5** means erasure coding for cold blocks (copies across zones for hot ones). Metadata uses full replicas.',
        '**Peak 3x**: working-hours peaks, and a Monday-morning burst when devices reconnect.'
      ],
      extra: [
        { label: 'Commit rate, average', formula: '20M x 5 / 86,400', result: '~1,160 commits/s' },
        { label: 'Metadata added per day', formula: '100M commits x ~1 KB (path, hashes, version)', result: '~100 GB/day, ~36 TB/year' },
        { label: 'Blocks stored after 5 years', formula: '~36.5 PB raw / 4 MB average block', result: '~9 billion blocks' },
        { label: 'Block hash index size (approximate)', formula: '9B blocks x ~50 B (32 B hash + location)', result: '~450 GB, sharded across a key-value store' },
        { label: 'Concurrent long-poll connections at peak', formula: '20M daily users x ~25% online at once x 1 per device (approximate)', result: '~5M open connections' },
        { label: 'Servers to hold those connections', formula: '5M / ~100,000 connections per server', result: '~50 notification servers' }
      ],
      notes: [
        '**Metadata and bytes scale differently.** About 1,200 commits a second is a database-sized problem; 36 PB of blocks is an object-storage problem. Split the two.',
        'The block hash index (about 450 GB) is too big for one machine\'s memory but easy to shard by hash, so **dedupe lookups are single-shard reads**.',
        'Read QPS (about 9,000 a second average) is mostly small metadata calls, so a cache for file-tree and change-list reads pays off.',
        'Holding millions of idle long-poll connections is the unusual part: it needs a dedicated connection tier tuned for many sockets, not request throughput.',
        'Dedupe and delta sync are why storage looks affordable: without them the new-bytes figure could be 5 to 10 times higher.'
      ]
    },

    api: [
      { method: 'POST', path: '/v1/blocks/check', desc: 'Ask which block hashes the server does not already have.',
        request: '{ "hashes": ["9f2c...", "a41b...", "77de..."] }',
        response: '{ "missing": ["a41b..."] }',
        notes: ['This is the **dedupe handshake**: the client only uploads blocks the server lacks. Batch hundreds of hashes per call.', 'Scope the answer to what the caller may know. Revealing "this hash already exists" to anyone can leak that somebody has a given file, so require proof of possession in sensitive designs.'] },
      { method: 'PUT', path: '/v1/blocks/{hash}', desc: 'Upload one block (about 4 MB).', request: '(binary block bytes)', response: '204 No Content',
        notes: ['The server recomputes the hash and rejects a mismatch. Blocks are **immutable and content-addressed**, so retries are harmless.'] },
      { method: 'POST', path: '/v1/files/commit', desc: 'Commit a new version of a file as an ordered list of blocks.',
        request: '{\n  "path": "/Photos/trip.zip",\n  "parentVersion": 12,\n  "blocks": ["9f2c...", "a41b...", "77de..."],\n  "size": 11534336,\n  "mtime": "2026-10-02T09:14:00Z"\n}',
        response: '{ "version": 13, "cursor": "c_88412" }',
        notes: ['`parentVersion` is the version this edit was based on. If it is not the current head, the server returns **409** and the client resolves the conflict.', 'The commit is the atomic step: until it succeeds, uploaded blocks are invisible orphans.', 'Send an `Idempotency-Key` so a retried commit does not create two versions.'] },
      { method: 'GET', path: '/v1/changes?cursor=c_88412', desc: 'List changes in the user\'s tree since a cursor.', response: '{\n  "entries": [{ "path": "/Docs/a.txt", "op": "update", "version": 4, "blocks": ["..."] }],\n  "cursor": "c_88420",\n  "hasMore": false\n}',
        notes: ['The cursor is opaque and monotonic per namespace. The client stores it and resumes from it after any outage.', 'Include deletes and renames as entries, not absences.'] },
      { method: 'GET', path: '/v1/subscribe?cursor=c_88420', desc: 'Long poll: held open until something changes or about 60 seconds pass.', response: '{ "changed": true }',
        notes: ['Returns only a hint. The client then calls `/changes` to learn what changed, so a lost notification costs at most one poll interval.'] },
      { method: 'POST', path: '/v1/shares', desc: 'Share a file or folder.', request: '{ "path": "/Projects/launch", "with": "ana@example.com", "role": "editor" }', response: '{ "shareId": "sh_3p9", "role": "editor" }', notes: ['Check authorisation on every metadata read and every block download, not only at share time.'] },
      { method: 'GET', path: '/v1/files/{id}/versions', desc: 'List versions of a file; restore by committing an old block list as a new version.', notes: ['Restore never rewrites history: it adds a new version that points at the old blocks.'] }
    ],
    apiNotes: ['Order of operations for a change: **check blocks, upload missing blocks, commit**. Commit last, so nobody ever sees a file whose blocks are not stored.', 'Auth: short-lived tokens per device; rate limit commits and block uploads per account.'],

    data: {
      intro: 'Two stores with very different jobs. **Metadata** (the tree, versions, shares) is small, relational and needs transactions. **Blocks** are big immutable blobs addressed by content hash. A file version is just an ordered list of block hashes, which is what makes dedupe, delta sync and cheap versioning fall out naturally.',
      entities: [
        { name: 'namespace', purpose: 'The unit of sharding and of change ordering: one per user root or shared folder. Each has its own monotonically increasing journal cursor.', fields: [['namespace_id', 'bigint, primary key', ''], ['owner_id', 'bigint', ''], ['journal_head', 'bigint', 'Latest change number. Incremented in the same transaction as every change.']] },
        { name: 'file_entry', purpose: 'A node in the tree: file or folder. Its current state points at one version.', fields: [['namespace_id, entry_id', 'bigint, primary key', ''], ['parent_id', 'bigint', 'Folder it lives in. Rename or move changes only this row.'], ['name', 'string', 'Unique within parent (case rules are a product decision).'], ['is_dir, is_deleted', 'bool', 'Deletes are soft: a tombstone, so devices learn about them.'], ['head_version', 'int', '']] },
        { name: 'file_version', purpose: 'Immutable history of one file.', fields: [['entry_id, version', 'primary key', ''], ['blocks', 'array of hash', 'Ordered block list. For huge files store in a side table, one row per (version, index).'], ['size, mtime, author_device', 'int, timestamp, string', ''], ['created_at', 'timestamp', 'Drives version retention.']] },
        { name: 'block', purpose: 'Content-addressed chunk metadata. The bytes live in object storage.', fields: [['hash', 'bytes(32), primary key', 'SHA-256 of the block.'], ['size', 'int', ''], ['location', 'string', 'Object key or storage cell.'], ['ref_count', 'int, approximate', 'Used by garbage collection, see the deep dive.']] },
        { name: 'journal', purpose: 'Append-only change log per namespace. This is what `/changes` reads.', fields: [['namespace_id, seq', 'primary key', ''], ['entry_id, op, version', '', 'op is create, update, move or delete.'], ['ts', 'timestamp', '']] },
        { name: 'share', purpose: 'Access control entries.', fields: [['entry_id', 'bigint', 'Folder or file shared.'], ['principal', 'user or link token', ''], ['role', 'enum', 'viewer, editor, owner.']] }
      ],
      storage: [
        { title: 'Metadata: sharded relational database', verdict: 'Pick for the tree',
          body: 'A commit must atomically (a) check `parentVersion`, (b) insert the version row, (c) update the entry, (d) append to the journal. That wants a **transaction** within one namespace. Shard by `namespace_id`: every operation for one user or shared folder lands on one shard, so no cross-shard transactions for the common case.\n\n```\nBEGIN;\nSELECT head_version FROM file_entry WHERE entry_id = ? FOR UPDATE;\n-- if head_version != :parentVersion then ROLLBACK and return 409\nINSERT INTO file_version (entry_id, version, blocks, ...) VALUES (...);\nUPDATE file_entry SET head_version = head_version + 1 WHERE entry_id = ?;\nINSERT INTO journal (namespace_id, seq, ...) VALUES (:ns, :next_seq, ...);\nCOMMIT;\n```\n\nThe cost: **cross-namespace operations** (moving a file between two users\' folders, sharing) need care, such as a two-step move or a saga.' },
        { title: 'Blocks: object storage with a hash index', verdict: 'Pick for bytes',
          body: 'Blocks are immutable, content-addressed objects. An object store (or your own storage cells) gives cheap capacity and erasure coding. The `hash -> location` index is a **key-value store sharded by hash**, since lookups are single-key and uniformly spread.\n\nBecause blocks never change, they cache perfectly, replicate lazily, and can be moved between hot and cold tiers without coordination.' },
        { title: 'Change delivery: journal plus notification service', verdict: 'Separate path',
          body: 'The journal is the durable record. The notification service only carries a tiny "namespace X changed" hint over long-lived connections. If the hint is lost, the next poll or reconnect reads the journal from the saved cursor, so correctness never depends on notifications.' }
      ],
      decisions: [
        { title: 'Chunking strategy', question: 'How do you split a file into blocks? This decides how much a small edit costs and how much dedupe you get.',
          options: [
            { name: 'Fixed-size blocks (for example 4 MB)', pros: 'Simple and fast. Editing the middle of a file changes only the affected blocks.', cons: '**Inserting** a byte near the start shifts every later boundary, so every later block changes and re-uploads.' },
            { name: 'Content-defined chunking (rolling hash)', pros: 'Boundaries depend on content, so an insert only changes nearby chunks. Best dedupe and delta behaviour for edited files.', cons: 'More CPU on the client and variable chunk sizes. Needs min and max size limits.' },
            { name: 'Whole-file upload', pros: 'No chunk bookkeeping.', cons: 'No resume, no dedupe, no delta: a one-byte change re-sends gigabytes.' }
          ],
          pick: 'Use **content-defined chunking with a 1 MB minimum, about 4 MB average and 8 MB maximum**, with SHA-256 per chunk. Many files are smaller than one chunk, which makes them single-block files anyway. Fixed-size is a defensible simpler start if you say what it costs on inserts.' },
        { title: 'Learning about changes: polling, long poll or push', question: 'Other devices must hear about changes within seconds without hammering the servers.',
          options: [
            { name: 'Short polling every N seconds', pros: 'Trivial and stateless.', cons: 'Latency of up to N seconds, and millions of empty requests a second at scale.' },
            { name: 'Long polling', pros: 'Works over plain HTTP and through proxies. Near-instant delivery. Easy to scale horizontally.', cons: 'Each client holds a connection; reconnect churn at timeouts.' },
            { name: 'WebSocket or server push (and mobile push notifications)', pros: 'Lowest latency, bidirectional.', cons: 'Stateful connections, harder to load balance and some corporate networks block them. Mobile OS push is needed for backgrounded apps anyway.' }
          ],
          pick: '**Long poll as the baseline** (carrying only a hint) plus the OS push service for sleeping mobile apps. The authoritative record is always the journal read via the `/changes` cursor, so a missed hint is harmless.' }
      ]
    },
    design: {
      intro: 'Keep two paths apart: a **block path** that moves bytes and a **metadata path** that decides what the tree looks like. A change is visible only when its metadata commit succeeds, and other devices find out through a small notification plus a journal read. **Click any box**, or play a scenario.',
      diagram: {
        title: 'File sync high-level design',
        nodes: [
          { id: 'client', label: 'Sync client (device)', kind: 'client',
            detail: { why: 'Watches the folder, chunks and hashes changed files, uploads missing blocks, commits versions, long-polls for changes, and applies them. It keeps a **local database** of what it believes the tree is and the last journal cursor.', tradeoffs: ['A smart client keeps the server stateless and makes offline work possible.', 'Clients have bugs and run on many OSes, so the server must validate hashes and parent versions and never trust a client\'s view of the tree.', 'File-watcher events are lossy; the client also rescans periodically.'], scale: 'Initial sync of a million small files: batch metadata calls, parallelise block transfers, and throttle to leave the user\'s network usable.' } },
          { id: 'lb', label: 'Load balancer / gateway', kind: 'lb',
            detail: { why: 'Terminates TLS, authenticates device tokens and routes metadata calls, block calls and long polls to their own service pools.', tradeoffs: ['Separate pools matter because the traffic differs: tiny metadata calls, large block streams, and mostly idle held-open connections.', 'Rate limits per account live here.'], alternatives: ['Managed API gateway', 'DNS-level split by hostname for blocks versus API'], scale: 'Open-connection count for long polls, before throughput.' } },
          { id: 'meta', label: 'Metadata service', kind: 'service',
            detail: { why: 'Owns the file tree: commits versions atomically, serves the change journal, renames, deletes and permission checks. Stateless; the transaction lives in the database.', tradeoffs: ['Commit is the single serialisation point per namespace, so a conflicting edit is detected cheaply by comparing `parentVersion`.', 'Moves between namespaces are multi-shard and need a careful two-step protocol.'], alternatives: ['One service per concern (tree, sharing, versions)'], scale: 'A very large shared folder where thousands of users commit into one namespace and one shard.' } },
          { id: 'metadb', label: 'Metadata DB (sharded)', kind: 'db',
            detail: { why: 'Relational store holding entries, versions, journal and shares, sharded by namespace. Gives transactions for the commit step and ordered journals for sync cursors.', tradeoffs: ['SQL gives atomic commits and consistent reads in a namespace; sharding by namespace keeps most operations single-shard.', 'Hot namespaces (a big shared team folder) cannot be spread further without splitting the folder.', 'Replicas serve change-list reads; the commit path goes to the primary.'], alternatives: ['A distributed SQL database', 'Key-value store with per-namespace logs (more work to get atomic commits)'], scale: 'About 1,200 commits a second average, 3,500 at peak, plus journal reads; sharded databases handle this, hot shards are the risk.' } },
          { id: 'authz', label: 'Permission service', kind: 'service',
            detail: { why: 'Answers "may this user read or write this entry?" using ownership, shares, inherited folder permissions and link tokens.', tradeoffs: ['Permissions inherit down the tree, so a check may walk parents; cache the resolved ACL per namespace and invalidate on share changes.', 'Revocation must take effect quickly, so keep cache TTLs short and verify at block download time.'], alternatives: ['Embed ACL checks inside the metadata service'], scale: 'Deeply nested shared folders make resolution slow without a cache.' } },
          { id: 'blocks', label: 'Block service', kind: 'service',
            detail: { why: 'Handles the dedupe handshake and block upload and download: checks hashes, verifies content, writes to object storage, and records the location in the hash index.', tradeoffs: ['Verifying the hash on write prevents corrupted or mislabelled blocks.', 'Download URLs can be short-lived signed links so big transfers bypass this tier.'], alternatives: ['Clients upload directly to storage with signed URLs'], scale: 'Bandwidth, not CPU: a few GB/s at peak (about 2.8 GB/s egress in the estimate).' } },
          { id: 'hashidx', label: 'Block hash index', kind: 'db',
            detail: { why: 'Key-value map from block hash to location and size. It answers "do we already have this block?" for every upload, which is what makes dedupe cheap.', tradeoffs: ['Around 450 GB at 9 billion blocks: sharded by hash it spreads evenly.', 'Global dedupe saves the most space but reveals existence across users; per-user or per-team dedupe is safer and still catches most savings.'], alternatives: ['Bloom filter in front to skip most lookups', 'Index inside each storage cell'], scale: 'Index size and lookup rate during big initial syncs.' } },
          { id: 'blockstore', label: 'Block storage', kind: 'storage',
            detail: { why: 'Immutable, content-addressed blobs with erasure coding for cheap durability. Cold blocks move to colder tiers.', tradeoffs: ['Immutability makes replication and caching trivial.', 'Deleting needs reference counting or a mark-and-sweep, because many versions and files can share one block.', 'Cross-region replicas cost money but survive a region loss.'], alternatives: ['Cloud object storage', 'Own storage cells with custom erasure coding'], scale: 'Capacity (tens of PB) and garbage-collection throughput.' } },
          { id: 'queue', label: 'Change event stream', kind: 'queue',
            detail: { why: 'After each commit the metadata service publishes "namespace N reached cursor C". Subscribers include the notification service and anything that indexes or audits changes.', tradeoffs: ['Publishing after the commit means the event can be lost on a crash; that is fine because the journal is the truth and clients poll on reconnect.', 'A transactional outbox removes even that gap.'], alternatives: ['Kafka', 'Redis pub/sub for hints only'], scale: 'Fan-out when a shared folder has many members.' } },
          { id: 'notif', label: 'Notification service', kind: 'service',
            detail: { why: 'Holds millions of long-poll or WebSocket connections and wakes the right ones when a namespace changes. It sends only a hint; the client then asks the metadata service what changed.', tradeoffs: ['Stateful: each connection lives on one server, so you need a lookup of which server holds which namespace subscription.', 'Stateless-ish design: hint carries no data, so loss or reorder is harmless.', 'Reconnect storms after a deploy or outage can overload the service; add jitter.'], alternatives: ['Mobile push (APNs, FCM) for sleeping apps', 'Periodic polling as a fallback'], scale: 'Connection count: about 5 million open at peak is roughly 50 well-tuned servers.' } },
          { id: 'gc', label: 'Garbage collector', kind: 'service',
            detail: { why: 'Finds blocks no longer referenced by any retained version and deletes them, so storage does not grow forever.', tradeoffs: ['Reference counts are fast but drift on crashes; mark-and-sweep is slow but exact.', 'Delete only after a grace period, so a block uploaded moments ago but not yet committed is never swept.'], alternatives: ['Per-block reference counts maintained transactionally'], scale: 'Scanning billions of blocks; run incrementally, per shard.' } }
        ],
        edges: [
          { from: 'client', to: 'lb', label: 'HTTPS' },
          { from: 'client', to: 'notif', label: 'long poll' },
          { from: 'lb', to: 'meta', label: 'commit, list' },
          { from: 'lb', to: 'blocks', label: 'blocks' },
          { from: 'meta', to: 'metadb', label: 'txn' },
          { from: 'meta', to: 'authz', label: 'check' },
          { from: 'blocks', to: 'hashidx', label: 'lookup' },
          { from: 'blocks', to: 'blockstore', label: 'read, write' },
          { from: 'meta', to: 'queue', label: 'changed', style: 'async' },
          { from: 'queue', to: 'notif', style: 'async' },
          { from: 'metadb', to: 'gc', label: 'live refs', style: 'async' },
          { from: 'gc', to: 'blockstore', label: 'delete' }
        ],
        scenarios: [
          { id: 'upload', label: 'Edit and upload', steps: [
            { title: 'Detect and chunk', path: ['client'], note: 'The file watcher fires. The client re-chunks the file with a rolling hash and hashes each chunk. Only chunks whose hash is new need to go up.' },
            { title: 'Dedupe check', path: ['client', 'lb', 'blocks', 'hashidx'], note: 'The client sends all hashes. The block service looks each up in the hash index and returns the missing ones. Blocks already known (from this or any permitted user) are skipped.' },
            { title: 'Upload missing blocks', path: ['client', 'lb', 'blocks', 'blockstore'], note: 'Only the changed blocks travel, in parallel, each verified against its hash. Retries are safe because blocks are immutable.' },
            { title: 'Commit', path: ['lb', 'meta', 'metadb'], tone: 'accent', note: 'One transaction checks `parentVersion`, inserts the version row, updates the entry and appends to the journal. This is the moment the change becomes visible.' },
            { title: 'Announce', path: ['meta', 'queue', 'notif'], tone: 'ok', note: 'The service publishes a hint. The notification service wakes any long-poll connections watching this namespace.' }
          ] },
          { id: 'receive', label: 'Another device syncs', steps: [
            { title: 'Hint arrives', path: ['client', 'notif'], note: 'The second device\'s held-open request returns: something changed. It carries no data.' },
            { title: 'Read the journal', path: ['client', 'lb', 'meta', 'metadb'], note: 'The client asks for changes since its saved cursor. The database returns the new journal entries with their block lists.' },
            { title: 'Permission check', path: ['meta', 'authz'], note: 'Every entry is filtered by what this user may see, since shared folders mix owners.' },
            { title: 'Download blocks', path: ['client', 'lb', 'blocks', 'blockstore'], note: 'The client fetches only the blocks it does not already have locally, reassembles the file in a temporary location and atomically renames it into place.' },
            { title: 'Advance the cursor', path: ['client'], tone: 'ok', note: 'Only after the file is applied does the client store the new cursor. A crash before that just repeats the work.' }
          ] },
          { id: 'conflict', label: 'Conflicting edits', steps: [
            { title: 'Two devices edit offline', path: ['client'], note: 'Both devices edit version 12 of the same file while disconnected.' },
            { title: 'First commit wins', path: ['lb', 'meta', 'metadb'], tone: 'ok', note: 'Device A reconnects and commits with `parentVersion` 12. It matches the head, so version 13 is created.' },
            { title: 'Second commit is rejected', path: ['lb', 'meta'], tone: 'hard', note: 'Device B commits with `parentVersion` 12, but the head is 13, so the server answers 409 and writes nothing.' },
            { title: 'Keep both', path: ['client', 'lb', 'meta'], note: 'B uploads its blocks as a new file named "report (conflicted copy from B).docx" and commits that. No data is lost; the user merges by hand.' }
          ] }
        ]
      },
      walkthrough: [
        '**Upload**: chunk, hash, ask which blocks are missing, upload only those, then commit the version as an ordered list of hashes. Commit is atomic and last.',
        '**Download**: a hint wakes the device, it reads the journal from its cursor, downloads missing blocks, applies the file atomically, and then advances the cursor.',
        '**Why it scales**: bytes go through a stateless block tier into immutable object storage; the tree lives in a database sharded by namespace; notifications carry only hints.',
        '**Failure modes**: a lost notification costs at most one poll interval; a crash between block upload and commit leaves orphan blocks that GC sweeps after a grace period; a client crash mid-apply re-applies from the old cursor.'
      ],
      notes: ['The design leans on three ideas: immutable content-addressed blocks, an ordered journal with cursors, and commits guarded by a parent version.']
    },
    deepDives: [
      { id: 'chunking', title: 'Chunking, delta sync and dedupe',
        question: 'A user edits one paragraph in a 500 MB file. How do you avoid re-uploading all of it, and how do you detect duplicate data across files?',
        answer: 'Split each file into **blocks**, name each block by the **hash of its contents**, and describe a file version as an ordered list of block hashes. To sync, the client sends the hashes, the server answers which it lacks, and only those blocks upload. That single mechanism gives three things: **delta sync** (unchanged blocks are skipped), **dedupe** (identical blocks anywhere are stored once) and **resumable upload** (a retry just repeats the check).\n\nWith **fixed-size** blocks, inserting bytes near the start shifts every later boundary, so every later block changes. **Content-defined chunking** cuts where a rolling hash of the last few bytes matches a pattern, so boundaries move with the content:\n\n```\nfunction chunk(data, W = 16, mask = 0x3f, min = 32, max = 512) {\n  const cuts = []; let start = 0, sum = 0;\n  for (let i = 0; i < data.length; i++) {\n    sum += data[i]; if (i >= W) sum -= data[i - W];   // rolling sum of last W bytes\n    const len = i - start + 1;\n    if ((len >= min && (sum & mask) === mask) || len >= max) {\n      cuts.push(i + 1); start = i + 1; sum = 0;\n    }\n  }\n  if (start < data.length) cuts.push(data.length);\n  return cuts;\n}\n```\n\nThis toy version uses a plain sum (real systems use Rabin or Gear hashes) and tiny sizes. In a quick test on 5,000 random bytes with 3 bytes inserted at the front, all 55 boundaries survived (shifted by 3), while fixed 256-byte blocks kept only 1 of 20 aligned.',
        followups: [
          { q: 'What block size would you pick and why?', a: 'About 4 MB average with 1 MB minimum and 8 MB maximum. Smaller blocks dedupe and delta better but multiply metadata, hash-index entries and requests; larger blocks cut overhead but re-send more on a small edit. It is a trade-off to name, not a magic number.' },
          { q: 'Is global dedupe safe?', a: 'It saves the most space but the "do you have this hash?" answer leaks whether someone has uploaded a file. Mitigate by requiring proof of possession (hash of a server-chosen slice), deduping only within an account or team, or accepting the leak for non-sensitive data. State the privacy trade-off.' },
          { q: 'What about tiny files?', a: 'Many small files make per-file overhead dominate. Batch commits, and store small files inline or pack several into one block, so a folder of 10,000 notes is not 10,000 requests.' }
        ] },
      { id: 'notify', title: 'Telling other devices about changes',
        question: 'How does a laptop learn within seconds that the phone changed a file, without millions of clients polling constantly?',
        answer: 'Separate the **hint** from the **data**. Every commit appends to a per-namespace **journal** with an increasing sequence number. Each device stores the last cursor it applied. A notification service keeps long-lived connections (long poll or WebSocket) and, when a namespace advances, wakes its subscribers with a tiny "something changed" message. The device then calls `/changes?cursor=` and gets exactly the missed entries.\n\nBecause the hint carries no payload and the journal is durable, delivery can be **at most once and unordered** without harming correctness: a lost hint is repaired by the next poll or reconnect. Connection servers are stateful, so keep a registry (or use consistent hashing on namespace) to route a wake-up to the server holding the connection. Add jitter on reconnect to avoid thundering herds.',
        followups: [
          { q: 'What happens after a long outage?', a: 'Clients reconnect and read from their saved cursor. If the journal was compacted past that cursor, the server returns a "reset" and the client does a full tree comparison (list and diff), which is slower but always works.' },
          { q: 'How do mobile devices get changes?', a: 'Backgrounded apps cannot hold sockets. Use the OS push service to send the same hint, and sync when the app wakes. Phones usually sync metadata eagerly and download file bytes lazily on demand.' },
          { q: 'Why not push the changes themselves?', a: 'Payloads need per-user filtering and ordering, make loss harmful, and balloon for large folders. A hint plus a pull keeps the stateful tier tiny.' }
        ] },
      { id: 'conflicts', title: 'Conflict resolution',
        question: 'Two devices edit the same file while offline. What does the system do?',
        answer: 'Use **optimistic concurrency on the version**. Every commit names the `parentVersion` it was based on. The server applies it only if that is still the head; otherwise it rejects with 409. The losing client then knows its edit is based on a stale version.\n\nFor opaque binary or office files you cannot merge automatically, so the safe policy is **keep both**: save the loser as a separate "conflicted copy" file next to the original and let the user reconcile. Never silently overwrite. For plain text a client may attempt a three-way merge using the common ancestor (the parent version), and fall back to a conflicted copy if it fails.\n\nRenames and deletes conflict too: an edit to a file that another device deleted usually resurrects the file; a rename plus an edit applies both because the tree entry and the version are separate records.',
        followups: [
          { q: 'Why not last-writer-wins?', a: 'It is simple and silently loses someone\'s work, which breaks the durability promise. Clock skew also makes "last" unreliable. Use it only for data where loss is acceptable.' },
          { q: 'Could you use CRDTs?', a: 'For real-time collaborative documents, yes: operations merge automatically. For arbitrary files with no semantic structure the system cannot merge, so file-level keep-both is the practical answer.' },
          { q: 'What about conflicts in folder structure, like two moves of the same folder?', a: 'Moves are serialised by the metadata commit; the second move based on stale parent information is rejected and re-applied on the new state. Guard against cycles (moving a folder into its own child) with a server-side check.' }
        ] },
      { id: 'versions', title: 'Versioning, deletes and garbage collection',
        question: 'Users can restore old versions and deleted files. How does that work, and how do you ever reclaim space?',
        answer: 'A version is a cheap record (a block list), and blocks are immutable and shared, so keeping history costs only the blocks that differ. **Delete** writes a tombstone so other devices learn about it; **restore** commits a new version that points at old blocks, so history is never rewritten.\n\nA retention job removes versions older than the plan limit (for example 30 days). A block becomes **garbage** only when no retained version references it. Two ways to find them: **reference counts** updated with each commit and prune (fast but can drift after crashes), or a periodic **mark-and-sweep** that walks live versions, marks their blocks, and deletes unmarked ones. Always add a **grace period** (a day or more) so a block uploaded but not yet committed is never swept.',
        followups: [
          { q: 'What is the danger of reference counting?', a: 'A missed decrement leaks space; a double decrement deletes a live block, which loses data. Prefer a conservative design: counts as hints, with mark-and-sweep as the authority, and never delete without the grace period.' },
          { q: 'How do you charge a user for shared blocks?', a: 'Charge by logical file size, not physical blocks, since dedupe savings belong to the provider. Computing per-user usage is a separate aggregation over versions.' }
        ] },
      { id: 'sharing', title: 'Sharing and permissions',
        question: 'Folders can be shared with other users, with different roles. What changes in the design?',
        answer: 'A shared folder becomes its own **namespace** that several users mount into their trees. That keeps ordering simple: all changes to the shared folder go through one journal and one shard, and each member syncs that namespace like their own.\n\nPermissions are role entries (viewer, editor, owner) on the folder, inherited by descendants. Check them in the metadata service for every read or write, and again when issuing block download URLs, since blocks are content-addressed and a hash alone must never grant access. Cache resolved permissions per namespace with a short TTL and invalidate on change so revocation takes effect within seconds. Link sharing uses unguessable tokens with optional expiry and password.',
        followups: [
          { q: 'What if a huge team folder has thousands of members?', a: 'It makes one hot namespace shard, and each commit fans notifications out to thousands. Batch hints, coalesce rapid changes into one wake-up, and consider splitting very large folders into sub-namespaces.' },
          { q: 'Can someone download a block if they know its hash?', a: 'No. Authorisation is checked against a file version the user may read, then the block is served as part of that version. Do not expose a public block-by-hash endpoint.' }
        ] },
      { id: 'durability', title: 'Block storage and replication',
        question: 'How do you make a stored block effectively never get lost, without tripling the bill?',
        answer: 'Write each block to storage with **erasure coding** across several failure domains (for example 6 data and 3 parity pieces in different racks and zones), which survives multiple losses at about 1.5x raw cost, instead of 3 full copies at 3x. Verify the hash on write and **scrub** periodically: read blocks, recheck hashes and repair from parity when a piece is bad or a disk dies.\n\nAcknowledge a commit only after blocks are durably written. For region-level safety, keep a second copy in another region (often only for hot or recently written data) and replicate asynchronously. Hot recent blocks may be fully replicated for fast reads, then converted to erasure coding as they cool.\n\nBecause blocks are immutable, replication has no conflict problem: copies are identical or absent.',
        followups: [
          { q: 'What is the trade-off of erasure coding?', a: 'Lower storage overhead but more CPU and network on reads of damaged data and on repair, and higher latency for small reads. Hence full replicas for hot data, parity for cold.' },
          { q: 'How do you detect silent corruption?', a: 'Content addressing helps: any read can check the hash. Add background scrubbing, because data that nobody reads can rot unnoticed.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Hot namespaces', problem: 'A giant shared folder concentrates commits, journal reads and notifications on one shard.', mitigation: 'Batch and coalesce hints, serve journal reads from replicas, split huge folders into sub-namespaces, and rate limit per namespace so one team cannot starve a shard.' },
      { title: 'Metadata database growth', problem: 'About 36 TB of metadata a year plus indexes, and a long tail of cold versions.', mitigation: 'Shard by namespace, archive old versions to cheaper storage, store large block lists in a side table, and compact the journal (with a reset path for very stale clients).' },
      { title: 'Notification connections and reconnect storms', problem: 'Millions of idle connections are costly, and a deploy or outage makes all clients reconnect together.', mitigation: 'A dedicated connection tier, jittered backoff, stateless hints, and gradual rollout. The journal makes dropped connections harmless.' },
      { title: 'Initial sync of a huge folder', problem: 'A million small files means a million metadata calls and a flood of tiny blocks.', mitigation: 'Batch listing and commit APIs, parallel transfers with throttling, pack small files, and let the user choose selective sync or on-demand files.' },
      { title: 'Garbage collection and storage cost', problem: 'Dedupe and versioning make block lifetimes complex; leaks waste petabytes and bad deletes lose data.', mitigation: 'Mark-and-sweep as the authority with grace periods, incremental per-shard runs, tiering and erasure coding for cold data.' }
    ],

    mistakes: [
      'Uploading whole files on every change, with no chunking, delta or resume.',
      'Letting the **notification** carry the data or be the source of truth, so a lost message loses a change.',
      'Committing metadata **before** the blocks are stored, exposing files that cannot be downloaded.',
      'Last-writer-wins on conflicts, silently discarding edits.',
      'Using fixed-size chunks and not mentioning what an insert at the front does.',
      'Forgetting garbage collection, or deleting blocks with no grace period.',
      'Serving block downloads by hash with no per-file authorisation check.',
      'Putting file metadata and file bytes in the same store.',
      'Trusting the client: skipping server-side hash verification and parent-version checks.',
      'Ignoring offline edits and the cursor, so a reconnecting client cannot catch up.'
    ],

    pushes: [
      { q: 'Why does the client commit after uploading the blocks, not before?', why: 'Tests whether you see atomic visibility and orphan handling.', good: 'A file version is visible only when its commit lands, so every referenced block must already exist. Orphan blocks from a crash are harmless and collected by GC after a grace period.' },
      { q: 'What if two devices edit the same file at the same time?', why: 'The central consistency question.', good: 'Optimistic concurrency with `parentVersion`, 409 for the loser, a conflicted copy instead of overwrite, and the journal ordering that makes "first" well defined.' },
      { q: 'How do you keep notification servers from being the bottleneck?', why: 'Millions of idle connections is unusual.', good: 'Hints only, a dedicated connection tier tuned for sockets, a subscription registry, jittered reconnects, and the journal as the safety net.' },
      { q: 'How would you add end-to-end encryption?', why: 'It breaks dedupe and sharing.', good: 'Client-side encryption means the server cannot hash plaintext, so cross-user dedupe disappears (convergent encryption partially restores it but leaks equality). Sharing requires key exchange. State the trade-off and the product choice.' },
      { q: 'How do you do a rename of a folder with a million files?', why: 'Checks the data model.', good: 'Because entries point to a parent rather than storing full paths, a move updates one row. Path strings are computed. Avoid storing full path per file for exactly this reason.' },
      { q: 'How would you scale this 10 times?', why: 'Finding the first bottleneck.', good: 'Metadata shards and hot namespaces, hash index size, GC throughput and connection count. The block tier scales horizontally as it is stateless over object storage.' }
    ],

    quiz: [
      { kind: 'concept', q: 'What do a file version and a block share in this design?', choices: ['A version is an ordered list of immutable, content-addressed block hashes', 'Each version stores its own private copy of every block', 'Blocks are renamed whenever a file is renamed', 'Blocks contain the file path'], answer: 0, explain: 'Because blocks are addressed by content and never change, versions are cheap lists of hashes. That enables dedupe, delta sync and cheap history.' },
      { kind: 'concept', q: 'You insert one byte at the start of a large file. Which chunking re-uploads almost nothing?', choices: ['Content-defined chunking', 'Fixed-size chunking', 'Whole-file upload', 'Chunking by file extension'], answer: 0, explain: 'Rolling-hash boundaries follow content, so only the chunk around the insert changes. Fixed blocks all shift.' },
      { kind: 'concept', q: 'Why should a client commit metadata only after all blocks are uploaded?', choices: ['So no visible version references a block that is not yet stored', 'Because blocks cannot be uploaded in parallel', 'To save a database round trip', 'Because commit is slow'], answer: 0, explain: 'Commit is the atomic visibility point. Early commits would expose files that cannot be downloaded.' },
      { kind: 'concept', q: 'What is the role of the notification in change delivery?', choices: ['A small hint to fetch the journal from the saved cursor; losing it only delays sync', 'It carries the file contents', 'It is the source of truth for the tree', 'It guarantees exactly-once ordering'], answer: 0, explain: 'The journal is durable. The hint just reduces latency, so at-most-once delivery is acceptable.' },
      { kind: 'concept', q: 'Device B commits with parentVersion 12 but the head is 13. What should happen?', choices: ['Reject with 409 and keep B\'s edit as a conflicted copy', 'Overwrite version 13 silently', 'Delete both versions', 'Merge binary files automatically'], answer: 0, explain: 'Optimistic concurrency detects the stale base. Keeping both avoids data loss when files cannot be merged.' },
      { kind: 'concept', q: 'Pick every reason to wait before sweeping an unreferenced block.', choices: ['It may be uploaded but its commit has not landed yet', 'A reference count may have drifted after a crash', 'Blocks cannot be deleted from object storage', 'A concurrent commit may be about to reference it through dedupe'], answer: [0, 1, 3], explain: 'A grace period protects in-flight uploads, concurrent dedupe hits and bad counts. Object stores can delete objects fine.' },
      { kind: 'concept', q: 'Why shard the metadata database by namespace?', choices: ['A commit and its journal append stay in one single-shard transaction', 'It makes block storage cheaper', 'It removes the need for a journal', 'It lets every user share one transaction'], answer: 0, explain: 'Most operations touch one namespace, so they remain local transactions. Cross-namespace moves are the awkward case.' }
    ],

    flashcards: [
      { id: 'fs-blocks', front: 'File sync: what is a file version made of?', back: 'An ordered list of content hashes of immutable blocks (about 4 MB). Enables delta sync, dedupe, resume and cheap versioning.' },
      { id: 'fs-order', front: 'Order of operations for a change?', back: 'Check which blocks are missing, upload them, then commit the version atomically. Commit last so no version references a missing block.' },
      { id: 'fs-cdc', front: 'Why content-defined chunking over fixed-size?', back: 'Boundaries follow content (rolling hash), so an insert changes only nearby chunks. Fixed blocks all shift after an insert.' },
      { id: 'fs-notify', front: 'How do devices learn about changes?', back: 'Long poll or push carries only a hint; the device reads the per-namespace journal from its saved cursor. Lost hints are repaired by the next poll.' },
      { id: 'fs-conflict', front: 'How are edit conflicts detected and handled?', back: 'Commit names parentVersion; if not the head, 409. Keep both as a conflicted copy instead of overwriting. Text can try a three-way merge.' },
      { id: 'fs-gc', front: 'How do you delete unused blocks safely?', back: 'Mark-and-sweep (or ref counts as hints) over retained versions, plus a grace period so uploaded-but-uncommitted blocks survive.' },
      { id: 'fs-shard', front: 'Why shard metadata by namespace?', back: 'A commit, version row and journal append stay in one shard and one transaction; each namespace has its own ordered cursor.' }
    ]
  });
})();
