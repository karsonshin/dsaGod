/* System design case study: distributed key-value store (Dynamo / Cassandra style). Schema: data/sd/schema.md. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'distributed-kv-store',
    title: 'Design a distributed key-value store',
    short: 'Build a Dynamo or Cassandra-style store: partitioning, replication, quorums, repair, failure detection and an LSM-tree storage engine.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Quorum', 'Replication', 'LSM tree'],
    prompt: 'Design a distributed key-value store that scales horizontally, stays available when nodes fail, and offers tunable consistency. Clients call get(key), put(key, value) and delete(key).',

    requirements: {
      functional: [
        '`put(key, value)`, `get(key)` and `delete(key)` with values up to about 1 MB (typically around 1 KB).',
        'Data is **partitioned** across many nodes and **replicated** for durability and availability.',
        'Nodes can be added and removed while the cluster serves traffic.',
        'Tunable consistency per request: choose how many replicas must answer a read or a write.',
        'Optional TTL on a key.'
      ],
      nonFunctional: [
        '**High availability**: reads and writes keep working through node and zone failures. Availability is prioritised over strict consistency (an AP-leaning design).',
        '**Low latency**: single-digit milliseconds at the median and tens of milliseconds at p99 for a single-key operation.',
        '**Horizontal scalability**: capacity grows by adding nodes, with no single master on the data path.',
        '**Durability**: an acknowledged write survives the loss of a node.',
        '**Eventual consistency** by default, with a documented path to stronger reads.'
      ],
      outOfScope: ['Multi-key transactions and secondary indexes.', 'SQL, joins and range queries across partitions.', 'Multi-region active-active conflict policy beyond a brief mention.', 'Encryption, access control and billing.'],
      assumptions: ['Keys are chosen by the application and are well distributed, or are hashed.', 'Machines have local SSDs and the network is a data centre network with occasional partitions.'],
      clarify: [
        { q: 'Do we need strong consistency or is eventual consistency acceptable?', a: 'Ask which operations need it. A Dynamo-style store defaults to eventual consistency and lets callers raise it with quorums. If every read must see the latest write, a consensus-based store (Raft or Paxos per partition) is the better foundation, at a cost in availability and latency under partition.' },
        { q: 'What is the read to write ratio and the value size?', a: 'It drives storage engine choice. Write-heavy workloads suit an LSM tree. Large values may need blob storage with the key-value store holding a pointer.' },
        { q: 'Do concurrent writes to the same key need to be merged, or is a single winner fine?', a: 'Last-write-wins is simple and loses data on conflicts. Vector clocks keep siblings and push merging to the client. Pick based on how costly a lost update is.' },
        { q: 'Single data centre or multiple regions?', a: 'Start with one cluster spread over three zones. Multi-region adds latency and conflict policy, so discuss it after the single-region design holds.' }
      ]
    },

    estimates: {
      intro: 'Imagine the store backs a product with 50 million daily active users. Each user triggers 5 writes and 100 reads a day (profile, session, preference and feed-state lookups). Values are about 1 KB, data is kept 2 years, and every record has 3 replicas.',
      inputs: { dau: 50e6, writesPerUser: 5, readsPerUser: 100, peakFactor: 2, bytesPerWrite: 1000, bytesPerRead: 1000, years: 2, replication: 3, hotFraction: 0.05, serverQps: 10000, utilization: 0.5 },
      assumptions: [
        '**1 KB per record** including key and metadata; real overhead varies with the engine.',
        'Peak is **2 times** average for a global consumer product.',
        'A node handles **10,000 operations a second** when many reads hit memory or the page cache. Treat as a rough planning number.',
        'Only the **hottest 5%** of a day\'s reads need to live in caches (the calculator\'s cache size row).',
        'Nodes are sized by **disk**, not throughput: assume about 5 TB of usable data per node (disks kept under about 60% full to leave room for compaction).'
      ],
      extra: [
        { label: 'Replicated data (2 years)', formula: '183 TB x 3 copies', result: '~548 TB' },
        { label: 'Nodes for storage', formula: '548 TB / 5 TB usable per node', result: '~110 nodes' },
        { label: 'Peak operations per node', formula: '~122K ops/s peak / 110 nodes', result: '~1,100 ops/s per node (very comfortable)' },
        { label: 'Quorum (N=3)', formula: 'R + W > N: 2 + 2 > 3', result: 'read and write sets must overlap in at least 1 replica' },
        { label: 'Keys moved when adding a node', formula: '1 / (N + 1) with N = 110', result: '~0.9% of the keys (consistent hashing)' }
      ],
      notes: [
        'It is **read-heavy** (about 20 to 1) at about 58,000 reads a second on average, but the cluster is **storage-bound**: 548 TB of replicated data needs about 110 nodes, and each node then handles only about a thousand operations a second at peak.',
        'Because nodes are sized by disk, CPU is idle most of the time. That is why background work (compaction, repair, streaming new nodes) fits without hurting the foreground, if it is rate limited.',
        'Writes are about 2,900 a second on average. Each is acknowledged after reaching a commit log and a memtable, which is why LSM-tree engines absorb them cheaply.',
        'The calculator\'s server row estimates **coordinator capacity** (25 servers). In a peer-to-peer store every storage node can coordinate, so the storage count is the binding one.'
      ]
    },

    api: [
      { method: 'PUT', path: '/v1/kv/{key}', desc: 'Write a value. Optional consistency level and TTL.',
        request: '{\n  "value": "base64-or-json",\n  "ttlSeconds": 86400,\n  "consistency": "quorum",\n  "context": "opaque-version-token"\n}',
        response: '{ "ok": true, "version": "opaque-version-token" }',
        notes: ['`consistency` is how many replicas must acknowledge: `one`, `quorum` or `all`. With N=3, quorum is 2.', 'The `context` returned by an earlier read carries the vector clock, so the store can tell an update from a concurrent write.'] },
      { method: 'GET', path: '/v1/kv/{key}?consistency=quorum', desc: 'Read a value.',
        response: '{\n  "values": [ { "value": "...", "version": "opaque-token" } ]\n}',
        notes: ['With vector clocks the response may contain **several sibling values** when writes were concurrent, and the client merges and writes back. With last-write-wins there is always one.', 'A missing key returns **404**; a deleted key within the tombstone window also returns 404.'] },
      { method: 'DELETE', path: '/v1/kv/{key}', desc: 'Delete a key by writing a **tombstone** (a marker with a timestamp), not by erasing data.',
        notes: ['Tombstones are kept for a grace period (for example 10 days) so every replica learns about the delete during repair. After that, compaction removes them.'] },
      { method: 'GET', path: '/v1/cluster/ring', desc: 'Admin: membership, token ranges and node states (up, down, joining, leaving).',
        notes: ['Smart clients and coordinators use this view to route a key straight to a replica.'] }
    ],
    apiNotes: ['A client library that knows the ring can call a replica directly and avoid an extra hop; a thin client sends to any node and that node coordinates.', 'Every request has a timeout and the client retries on another node, so `put` must be safe to retry (writes are idempotent by key and version).'],

    data: {
      intro: 'The logical model is tiny: a key maps to a value with some version metadata. The interesting data model is **physical**: how a node stores records on disk, and how the cluster stores the map from keys to nodes.',
      entities: [
        { name: 'record (per replica)', purpose: 'What each replica stores for a key.', fields: [
          ['key', 'bytes', 'Hashed to a position on the ring for placement; the original key is kept for lookups.'],
          ['value', 'bytes, up to ~1 MB', 'Opaque to the store.'],
          ['version', 'timestamp or vector clock', 'Used to pick a winner or to detect concurrent writes.'],
          ['tombstone', 'bool', 'True means deleted. Kept until the grace period ends.'],
          ['expires_at', 'timestamp, nullable', 'TTL; expired records are treated as tombstones.']
        ] },
        { name: 'commit log entry (per node)', purpose: 'Sequential append of every write before it is acknowledged, so a crash loses nothing.', fields: [
          ['seq', 'int64', 'Position in the log; the memtable flush records which prefix is safe to discard.'],
          ['key, value, version', 'bytes', 'The mutation itself.'], ['checksum', 'int32', 'Detects a torn write at the tail.']
        ] },
        { name: 'ring membership (gossiped)', purpose: 'Which nodes exist, which token ranges they own and whether they are alive.', fields: [
          ['node_id', 'string', ''], ['tokens', 'list of int64', 'Positions on the ring owned by this node (virtual nodes).'],
          ['state', 'enum', '`joining`, `up`, `suspect`, `down`, `leaving`.'], ['heartbeat', 'int', 'Counter incremented by the node; spreading it is how failures get detected.']
        ] },
        { name: 'hint (per node)', purpose: 'A write held for a replica that was down, to deliver when it returns.', fields: [
          ['target_node', 'string', ''], ['key, value, version', 'bytes', ''], ['created_at', 'timestamp', 'Hints older than a limit (for example 3 hours) are dropped and repair takes over.']
        ] }
      ],
      storage: [
        { title: 'LSM tree on each node (memtable, SSTables, compaction)', verdict: 'Pick for writes',
          body: 'A write goes to the **commit log** (sequential disk append) and to an in-memory sorted **memtable**, then is acknowledged. When the memtable reaches a size limit (for example 64 to 256 MB) it is flushed to disk as an immutable sorted file, an **SSTable**. Reads check the memtable, then SSTables from newest to oldest, using a **Bloom filter** per SSTable to skip files that cannot contain the key.\n\nBecause SSTables are immutable, **compaction** merges several into a larger one in the background, keeping the newest version of each key and dropping overwritten values and expired tombstones.\n\nStrengths: writes are sequential, so a node absorbs very high write rates. Weakness: **read amplification** (several files per read) and **write amplification** (data is rewritten by compaction), plus space overhead during compaction.' },
        { title: 'B-tree on each node (page-oriented engine)', verdict: 'Pick for reads',
          body: 'Updates modify pages in place, so a read touches one tree path, with predictable latency and no background compaction. Writes are random I/O and need a write-ahead log for safety.\n\nA good fit for read-heavy, update-in-place workloads and for stores that need range scans. For a store whose design goal is cheap, highly available writes across many replicas, the LSM tree is the usual choice.' }
      ],
      decisions: [
        { title: 'How to partition keys across nodes', question: 'Keys must be spread over about 110 nodes, and nodes will join and fail.',
          options: [
            { name: 'hash(key) mod N', pros: 'One line of code. Even spread.', cons: 'Changing N remaps **almost every key** (about N/(N+1) of them), which would mean moving nearly all the data when a node is added.' },
            { name: 'Consistent hashing with virtual nodes', pros: 'Adding or removing a node moves only about 1/N of the keys, and only to or from its neighbours. Giving each physical node many tokens (virtual nodes) evens out load and lets a failed node\'s ranges spread across many peers.', cons: 'More metadata to track and gossip. Per-node load depends on tokens; you must choose a token count and handle heterogeneous machines by giving big nodes more tokens.' },
            { name: 'Range partitioning (sorted key ranges)', pros: 'Range scans are efficient and ranges can split and move individually.', cons: 'Hot ranges (for example time-ordered keys) overload one partition. Needs a metadata service that tracks ranges.' }
          ],
          pick: '**Consistent hashing with virtual nodes.** Hash the key onto a ring; the first node clockwise owns it, and the next N-1 distinct physical nodes clockwise hold the replicas. Say that hash partitioning gives up range queries, and that range partitioning is the answer if scans matter more.' },
        { title: 'Resolving concurrent writes', question: 'Two clients write the same key through different coordinators at the same time while replicas are partitioned. Which value wins?',
          options: [
            { name: 'Last-write-wins (timestamps)', pros: 'Simple: one value per key, no client merging, small metadata.', cons: 'Relies on clocks. Clock skew between machines can make an older write win, and a concurrent write is **silently lost**. Safe only when overwrites are the intent or loss is tolerable.' },
            { name: 'Vector clocks and sibling values', pros: 'Detects whether one write happened after another or whether they are truly concurrent, and keeps both versions so nothing is lost.', cons: 'Pushes merging to the application. Clocks grow with the number of writers (usually pruned), and clients must handle multiple values.' },
            { name: 'Conflict-free replicated data types (CRDTs)', pros: 'Merging is automatic and mathematically safe for supported types (counters, sets).', cons: 'Limited to data that can be modelled that way and adds complexity to the value format.' }
          ],
          pick: '**Vector clocks (or a similar versioning scheme) when lost updates matter, last-write-wins when they do not.** A good answer names which one you are using and what it loses. Clock skew is the reason last-write-wins can lose a newer write.' }
      ]
    },

    design: {
      intro: 'The design is **peer to peer**: every node can coordinate any request, and no node is special. A key hashes onto a ring and is stored on the next N nodes. The coordinator sends the operation to all N replicas and answers when enough of them (W for writes, R for reads) respond. Everything else (gossip, hints, read repair, Merkle-tree repair) exists to bring replicas back together after failures. **Click any box** for the reasoning, or pick a scenario.',
      diagram: {
        title: 'Distributed key-value store high-level design',
        nodes: [
          { id: 'client', label: 'Client application', kind: 'client',
            detail: { why: 'Calls get and put with a chosen consistency level. A smart client keeps a copy of the ring and sends the request straight to a replica; a simple client sends it to any node.', tradeoffs: ['A token-aware client saves one network hop on every request but needs to refresh its ring view.', 'The client picks the consistency level, so it owns the trade-off between latency, availability and freshness.'], scale: 'Timeouts and retry storms. Retries must back off or a slow node pulls the cluster into overload.' } },
          { id: 'lb', label: 'Smart client or balancer', kind: 'lb',
            detail: { why: 'Chooses a coordinator for the request. Prefers a node that owns the key (token-aware) and one in the same zone, and skips nodes the client believes are down.', tradeoffs: ['Round robin across all nodes works but adds a hop whenever the chosen node is not a replica for the key.', 'Avoid a central proxy on the data path: it becomes the bottleneck and the failure point the design wants to avoid.'], alternatives: ['DNS round robin to a seed list', 'Service discovery with ring awareness'], scale: 'Stale ring information after nodes join or leave, which costs extra hops but not correctness.' } },
          { id: 'gossip', label: 'Gossip and failure detector', kind: 'service', layer: 1,
            detail: { why: 'Each node, about once a second, trades its view of the cluster with a few random peers: who is in the ring, which tokens they own, and a heartbeat counter per node. Knowledge spreads to all nodes in roughly log N rounds, with no central registry. A failure detector turns missing heartbeats into a suspicion level.', tradeoffs: ['An **accrual** detector (suspicion rises with silence, relative to normal heartbeat gaps) adapts to slow networks better than a fixed timeout.', 'A false positive marks a healthy but slow node as down: its traffic shifts and hints pile up. A false negative sends requests to a dead node and costs timeouts.', 'Seed nodes help new nodes find the cluster; they are not authorities.'], alternatives: ['A coordination service such as ZooKeeper or etcd for membership (stronger, but a central dependency)'], scale: 'Gossip traffic grows with cluster size but stays small per node; very large clusters tune fan-out and interval.' } },
          { id: 'coord', label: 'Coordinator node', kind: 'service',
            detail: { why: 'Whichever node received the request. It hashes the key, finds the N replicas from its ring view, sends the operation to them in parallel and waits for W acknowledgements (write) or R responses (read). For reads it compares versions and triggers **read repair** if replicas disagree.', tradeoffs: ['With N=3, R=2, W=2: R+W=4>3, so any read quorum overlaps any write quorum in at least one replica, so a read sees the latest acknowledged write (absent concurrent writes and sloppy quorums).', 'W=1 and R=1 give lowest latency and highest availability but no overlap guarantee.', 'Any node can coordinate, so there is no leader to fail or to saturate.'], alternatives: ['A leader per partition replicated by Raft (strong consistency, writes stop during elections and partitions)'], scale: 'Coordinators fan out N messages per operation, so network and CPU grow with N; tail latency is set by the slowest of the replicas needed.' } },
          { id: 'r1', label: 'Replica A (key owner)', kind: 'db',
            detail: { why: 'The first node clockwise from the key\'s position on the ring. Stores the record in its local storage engine and answers coordinator requests.', tradeoffs: ['Replica placement skips virtual nodes of the same physical node and prefers different racks or zones, so one failure cannot remove all copies.', 'Each replica stores the key independently; there is no leader among replicas for a key.'], scale: 'Disk capacity first (nodes are sized by data), then compaction I/O competing with reads.' } },
          { id: 'r2', label: 'Replica B (next on ring)', kind: 'db',
            detail: { why: 'The second distinct node clockwise. Part of every write and read quorum for keys that land on the same range.', tradeoffs: ['If B is slow, a quorum of 2 from {A, B, C} can be satisfied by A and C, which is how the store masks one slow or dead node.'], scale: 'A slow disk or long garbage-collection pause on one replica shows up as tail latency unless the coordinator can use another replica.' } },
          { id: 'r3', label: 'Replica C (next on ring)', kind: 'db',
            detail: { why: 'The third distinct node. Gives durability against two failures if all acknowledged, and a read or write path when one of the others is down.', tradeoffs: ['Placing C in a third zone survives the loss of a zone; the cost is cross-zone latency on every quorum.'], scale: 'When C is down, its writes become hints on the coordinator and its reads fall to A and B.' } },
          { id: 'hints', label: 'Hinted handoff store', kind: 'storage',
            detail: { why: 'When a target replica is down, the coordinator (or another node) keeps the write locally as a **hint** and delivers it when the replica returns. That keeps W satisfied and shortens the window of divergence.', tradeoffs: ['With a **sloppy quorum**, a stand-in node outside the key\'s N replicas can count towards W. Availability improves, but R + W > N no longer guarantees a read sees the latest write until the hint is delivered.', 'Hints are bounded in age and size. After the limit the node is treated as lost and anti-entropy repair takes over.', 'A burst of hints replayed at once can overload a recovering node, so replay is rate limited.'], alternatives: ['Strict quorum (fail the write instead of using a stand-in)'], scale: 'A long outage fills hint storage on the nodes that hold hints for it.' } },
          { id: 'lsm', label: 'Storage engine (LSM tree)', kind: 'storage',
            detail: { why: 'On every node (drawn once): a commit log for durability, a memtable for recent writes, immutable SSTables on disk, Bloom filters to skip SSTables, and background compaction that merges SSTables.', tradeoffs: ['Writes are sequential appends, so the node absorbs bursts easily.', 'Reads may touch several SSTables; Bloom filters (about 1% false positives at around 10 bits per key) and caches keep this to a small number of disk reads.', 'Compaction rewrites data (write amplification) and competes with foreground I/O, so it is rate limited. Leave free disk space for it.'], alternatives: ['B-tree engine (predictable reads, random writes)', 'Tiered versus leveled compaction: write cost against read cost and space'], scale: 'Compaction falling behind makes read amplification climb, because reads must check ever more SSTables.' } },
          { id: 'repair', label: 'Anti-entropy repair', kind: 'service',
            detail: { why: 'A background process compares replicas of a key range cheaply. Each replica builds a **Merkle tree** (a tree of hashes over the range). Two replicas compare root hashes; if they differ, compare children and descend only into the differing subtrees to find the exact keys to stream.', tradeoffs: ['Cost is proportional to the differences (O(log n) comparisons per differing range), not to the data size, so repair is cheap when replicas mostly agree.', 'Building the trees reads the data, so it is scheduled and rate limited.', 'It is the safety net for what hints and read repair miss: cold keys never read, and nodes down longer than the hint window.'], alternatives: ['Rely only on read repair (cold data never converges)', 'Full data comparison (far too expensive)'], scale: 'Tree build time on large ranges; split ranges into many small trees so repair can resume and run in parallel.' } }
        ],
        edges: [
          { from: 'client', to: 'lb', label: 'get / put' },
          { from: 'lb', to: 'coord', label: 'route' },
          { from: 'gossip', to: 'coord', label: 'ring view', style: 'async' },
          { from: 'coord', to: 'r1', label: 'N=3 copies' },
          { from: 'coord', to: 'r2' },
          { from: 'coord', to: 'r3' },
          { from: 'coord', to: 'hints', label: 'if down', style: 'async' },
          { from: 'r1', to: 'lsm', label: 'log, memtable' },
          { from: 'r2', to: 'lsm' },
          { from: 'r3', to: 'lsm' },
          { from: 'r1', to: 'repair', label: 'trees', style: 'async' },
          { from: 'r2', to: 'repair', style: 'async' },
          { from: 'r3', to: 'repair', style: 'async' }
        ],
        scenarios: [
          { id: 'write', label: 'Write path (N=3, W=2)', steps: [
            { title: 'Client writes', path: ['client', 'lb', 'coord'], note: 'The request goes to a coordinator, ideally one of the key\'s replicas. The coordinator hashes the key and reads its ring view to find the three owners.' },
            { title: 'Fan out', nodes: ['coord', 'r1', 'r2', 'r3'], edges: ['coord>r1', 'coord>r2', 'coord>r3'], note: 'The coordinator sends the write to all three replicas in parallel, not just two. Waiting for only W of them is what hides one slow node.' },
            { title: 'Local durability', path: ['r1', 'lsm'], note: 'Each replica appends to its commit log, then inserts into its memtable. Both done means the write is durable on that node. A periodic flush turns full memtables into SSTables.' },
            { title: 'Acknowledge at W=2', nodes: ['coord', 'r1', 'r2'], edges: ['coord>r1', 'coord>r2'], tone: 'ok', note: 'After two replicas confirm, the coordinator acknowledges the client. The third copy still arrives, or is repaired later.' }
          ] },
          { id: 'read', label: 'Read with read repair (R=2)', steps: [
            { title: 'Client reads', path: ['client', 'lb', 'coord'], note: 'The coordinator picks replicas for the key.' },
            { title: 'Query replicas', nodes: ['coord', 'r1', 'r2', 'r3'], edges: ['coord>r1', 'coord>r2', 'coord>r3'], note: 'Ask one replica for the full data and the others for a digest (a hash), or ask two for data. Wait for R=2 responses.' },
            { title: 'Compare versions', nodes: ['coord', 'r1', 'r2'], edges: ['coord>r1', 'coord>r2'], note: 'If the two answers match, return it. With R+W>N at least one of these two has the latest acknowledged write, so the newest version is among them.' },
            { title: 'Repair stale replica', nodes: ['coord', 'r2'], edges: ['coord>r2'], tone: 'hard', note: 'If replica B returned an older version, the coordinator writes the newer one back to B in the background. This is **read repair**: hot keys heal themselves.' }
          ] },
          { id: 'failure', label: 'Replica down: hints and repair', steps: [
            { title: 'Failure detected', path: ['gossip', 'coord'], tone: 'hard', note: 'Gossip stops hearing heartbeats from replica C; the failure detector raises its suspicion above the threshold and marks C down in the ring view.' },
            { title: 'Write still succeeds', nodes: ['coord', 'r1', 'r2', 'hints'], edges: ['coord>r1', 'coord>r2', 'coord>hints'], tone: 'ok', note: 'A and B acknowledge, so W=2 is met. The copy meant for C is stored as a hint.' },
            { title: 'C returns', path: ['coord', 'hints'], note: 'When gossip reports C up again, the hint holder replays the stored writes to C, rate limited, then deletes them.' },
            { title: 'Anti-entropy backstop', path: ['r1', 'repair'], note: 'If C was down longer than the hint window, or hints were lost, a scheduled repair builds Merkle trees for the shared ranges, finds the differing keys and streams them to C.' }
          ] }
        ]
      },
      walkthrough: [
        '**Place**: hash the key onto the ring; the next three distinct nodes clockwise (preferably in different zones) are the replicas.',
        '**Write**: the coordinator sends to all three, acknowledges after W. Each replica writes its commit log and memtable.',
        '**Read**: ask for R responses, return the newest version (or siblings for vector clocks), and repair any stale replica found.',
        '**Heal**: hinted handoff covers short outages, read repair heals hot keys, Merkle-tree anti-entropy catches everything else.',
        '**Failure modes**: one dead replica costs nothing at quorum 2 of 3; two dead replicas of the same range make QUORUM operations fail while ONE operations still work.'
      ],
      notes: ['The same cluster serves different consistency needs: a session cache reads at ONE, a profile page at QUORUM, and nothing at ALL, because ALL makes every request fail when any one replica is down.']
    },

    deepDives: [
      { id: 'partitioning', title: 'Partitioning with consistent hashing and virtual nodes',
        question: 'How do you spread keys across about 110 nodes so that adding or losing a node moves as little data as possible?',
        answer: 'Hash the key to a position on a ring (a circular space of, say, 64-bit integers). Each node owns one or more **tokens**, positions on the same ring. A key belongs to the first token clockwise from its hash, and its replicas are the next N-1 **distinct physical nodes** clockwise.\n\nWhen a node joins, it takes over only the arcs just before its tokens, from their former owners: about **1/(N+1)** of the keys move, and only to the new node. With plain `hash(key) mod N`, changing N remaps about N/(N+1) of all keys (about 91% going from 10 to 11 nodes in a quick test).\n\nWith **one token per node**, the arcs are uneven and a failed node dumps its whole load on one neighbour. With **virtual nodes** (many tokens per node, for example 128 to 256) arcs are small and numerous, so load evens out and a failed node\'s ranges spread across many peers. Give bigger machines more tokens.\n\n```\nclass Ring {\n  constructor(vnodes = 128) { this.v = vnodes; this.t = []; }          // t: sorted [hash, node]\n  add(node) { for (let i = 0; i < this.v; i++) this.t.push([h(node + \'#\' + i), node]); this.t.sort((a, b) => a[0] - b[0]); }\n  owners(key, N) {\n    const p = h(key); let i = this.t.findIndex(x => x[0] >= p); if (i < 0) i = 0;\n    const out = [];\n    for (let k = 0; out.length < N && k < this.t.length; k++) {\n      const n = this.t[(i + k) % this.t.length][1];\n      if (!out.includes(n)) out.push(n);                                // distinct physical nodes\n    }\n    return out;\n  }\n}\n```\n\nIn a quick test with 10 nodes and 128 tokens each, adding an 11th moved about 8% of 20,000 keys (expected about 9%), all of them to the new node.',
        followups: [
          { q: 'Why skip virtual nodes of the same physical machine when choosing replicas?', a: 'Otherwise all three replicas of a key could sit on one physical node, and one failure would remove every copy. Walk the ring and keep only distinct physical nodes, ideally in distinct racks or zones.' },
          { q: 'What happens to data when a node joins?', a: 'The new node enters as `joining`, streams the ranges it will own from current replicas, then switches to `up` and starts serving. Throttle streaming so it does not starve foreground reads. Old owners later delete the ranges they gave up.' },
          { q: 'How do you handle one very hot key?', a: 'Consistent hashing balances keys, not traffic per key. For a hot key, cache in front of the store, or split it into several keys (a suffix) and read-merge. Replication helps reads only if clients can read any replica.' }
        ] },
      { id: 'quorum', title: 'Replication and quorums (N, R, W)',
        question: 'Explain N, R and W. How do they trade consistency against availability and latency?',
        answer: '**N** is how many replicas store each key (commonly 3). A write succeeds when **W** replicas acknowledge. A read waits for **R** replicas to answer. If **R + W > N**, every read quorum shares at least one replica with every write quorum, so a read includes the newest acknowledged write (the coordinator returns the newest version it sees).\n\nWith N=3:\n\n- **W=2, R=2** (quorum): overlap guaranteed (4 > 3), tolerates one replica down for both reads and writes. The balanced default.\n- **W=3, R=1**: fast reads, but a write fails if any replica is down.\n- **W=1, R=3**: fast writes that never wait, but reads fail if any replica is down, and one lost replica can lose the only copy.\n- **W=1, R=1**: lowest latency and highest availability, but R + W = 2 is not greater than 3, so a read can return stale data.\n\nThe guarantee has limits. **Sloppy quorums** (stand-in nodes) break the overlap until hints are delivered. **Concurrent writes** to the same key still need conflict handling. A write that fails the quorum is not rolled back: replicas that did accept it keep it, so a later read may return a write the client was told failed. R + W > N gives recency of acknowledged writes, not linearizability.\n\nLatency is set by the slowest replica among the ones you wait for, so waiting for fewer replicas (smaller R or W) lowers tail latency.',
        followups: [
          { q: 'Why does the coordinator send a write to all N replicas rather than just W?', a: 'Sending to all N costs little and gets the extra copy there without waiting. Waiting for only W lets one slow or dead replica go unnoticed by the client, and the remaining replica catches up by itself or through repair.' },
          { q: 'If you want strong consistency, can you just set R + W > N?', a: 'It gets you close for acknowledged writes in the absence of failures, but it is not linearizable: a partial write, concurrent writes, clock-based conflict resolution and sloppy quorums all leave gaps. For true strong consistency use a consensus protocol per partition (Raft or Paxos) or conditional writes through a single leader.' },
          { q: 'What consistency levels would you expose?', a: '`ONE`, `QUORUM` and `ALL`, plus a local-quorum variant in multi-region clusters so a quorum is reached inside one region. `ALL` is rarely wise: any single replica failure makes the operation fail.' }
        ] },
      { id: 'conflicts', title: 'Vector clocks versus last-write-wins',
        question: 'Two clients update the same key on different sides of a network partition. How does the store decide what the value is?',
        answer: '**Last-write-wins (LWW)** attaches a timestamp to each write and keeps the highest. It is simple and keeps one value, but it depends on clocks. If node A\'s clock runs ahead, its older write can overwrite a newer write from B, and a truly concurrent write is **silently lost**. LWW is acceptable for caches and for values that are always fully overwritten.\n\n**Vector clocks** attach a counter per writer: a version is a map like `{A:2, B:1}`. Version X **happened before** Y if every counter in X is at most the one in Y (and they differ). If neither dominates, the writes were **concurrent**. Example: the value starts at `{A:1}`. One client updates via node B (`{A:1,B:1}`) while another updates via node C (`{A:1,C:1}`). Neither dominates, so the store keeps **both as siblings** and returns both on the next read. The client merges them (for a shopping cart, a union) and writes back with a clock that dominates both.\n\nCosts: clocks grow with the number of coordinators (so they are pruned by size or age, accepting rare false conflicts), and every client must be prepared to merge siblings. If merging is too hard, use CRDTs for suitable data, or avoid concurrent writes by routing a key\'s writes through one coordinator.',
        followups: [
          { q: 'How can LWW lose an update even with synchronised clocks?', a: 'Two writes within the clock\'s resolution or skew window get an arbitrary winner. NTP typically keeps clocks within milliseconds, but a drifting or stepped clock reorders writes. Using a hybrid logical clock reduces but does not remove the problem.' },
          { q: 'What do you do with siblings that are never read?', a: 'They stay until a read or a repair resolves them. Reading and writing back the merged value collapses them. Some systems collapse on a timer using LWW as a last resort.' }
        ] },
      { id: 'failures', title: 'Handling failures: hinted handoff, read repair and Merkle-tree anti-entropy',
        question: 'A replica is down for an hour, then comes back. How does it catch up, and how do you make sure replicas converge?',
        answer: 'Three mechanisms at different time scales.\n\n1. **Hinted handoff** (minutes to hours). While the replica is down, coordinators store the missed writes as hints and replay them when gossip reports the node up. This keeps W satisfiable and shrinks the divergence window. Hints are bounded (for example 3 hours) because storing them forever is unbounded.\n2. **Read repair** (on access). When a read gets different versions from different replicas, the coordinator sends the newest to the stale ones. Hot keys converge quickly; cold keys never get read.\n3. **Anti-entropy with Merkle trees** (background, always). Each node builds a hash tree over each key range it owns (leaves hash small key sub-ranges, each parent hashes its children). Two replicas compare **root hashes**; equal roots mean identical ranges and nothing more is sent. Unequal roots: compare children, descend only into differing subtrees until reaching the keys that differ, then stream just those. The comparison cost is proportional to the number of differences (logarithmic in range size per difference), not the data volume.\n\nTogether they give **eventual consistency**: even if all hints are lost and no one reads a key, scheduled repair will eventually make every replica agree.\n\nDeletes need care: a deleted key is a **tombstone** kept for a grace period longer than the longest expected repair interval. If a tombstone is purged before a replica that missed the delete is repaired, that replica\'s old value can resurrect the key.',
        followups: [
          { q: 'Why not just compare all the data between replicas?', a: 'That reads and ships terabytes to find a few differences. A Merkle tree lets two nodes exchange a handful of hashes and zero in on the changed keys.' },
          { q: 'What is the downside of Merkle trees?', a: 'Building them requires scanning the range, and the tree must be rebuilt as data changes. Systems build trees on demand for a range during repair, split large ranges into many small trees, and rate limit the work.' },
          { q: 'How long should the tombstone grace period be?', a: 'Longer than the maximum time a replica can be down and still be repaired, plus the repair interval. Ten days is a common order of magnitude. Too short risks zombie data; too long wastes disk and slows reads.' }
        ] },
      { id: 'gossip', title: 'Gossip and failure detection',
        question: 'How do nodes learn about membership and failures without a central coordinator?',
        answer: 'Every node, roughly once a second, picks a few random peers and exchanges a compact digest of what it knows: for each node, its state, tokens and a **heartbeat counter** (a number only that node increments). On receiving fresher information, a node updates its view. Information spreads **epidemically**: each informed node informs others, so a fact reaches all N nodes in about log N rounds (a handful of seconds for hundreds of nodes), and traffic per node stays small and constant.\n\n**Failure detection** watches heartbeat counters. A fixed timeout is brittle: a slow network or a long pause looks like a failure. A **phi-accrual** style detector tracks the distribution of heartbeat gaps and outputs a suspicion level that grows the longer a node is silent compared to its normal pattern; you act when it crosses a threshold. The result is probabilistic: a node may be wrongly declared down (a false positive) or detected late.\n\nA node believed down is not removed from the ring. It is skipped for requests and its writes become hints; it only leaves the ring by an explicit decommission, so short blips do not trigger large data movement.',
        followups: [
          { q: 'What if two sides of a network partition each think the other is dead?', a: 'Each side keeps serving with what it can reach. With sloppy quorums both sides accept writes, which creates divergent replicas that repair and conflict resolution reconcile after the partition heals. That is the availability-over-consistency choice.' },
          { q: 'Why not use ZooKeeper or etcd for membership?', a: 'It gives a consistent view and simple semantics, but the store then depends on a separate quorum-based service and its availability. Gossip keeps the store self-contained at the cost of eventual agreement about membership.' }
        ] },
      { id: 'lsm', title: 'The LSM-tree storage engine',
        question: 'Describe how one node stores data so that writes are fast. What are the costs?',
        answer: 'A write is appended to the **commit log** (sequential, durable on fsync or periodic sync) and inserted into the **memtable**, a sorted in-memory structure (a skip list or balanced tree). Then it is acknowledged. The log is only read after a crash, to rebuild the memtable.\n\nWhen the memtable is full it becomes immutable and is written out as an **SSTable**: a sorted file of keys and values with an index and a **Bloom filter**. Log segments covering it can be deleted. SSTables are never modified.\n\n**Read**: check the memtable, then SSTables newest first, stopping at the first version found (for the newest-version rule). For each SSTable the Bloom filter answers "definitely not here" or "maybe". A filter with about 10 bits per key and 7 hash functions gives roughly a 1% false positive rate (about 0.8% by the standard formula), so most files that do not hold the key are skipped without a disk read.\n\n**Compaction** merges SSTables: size-tiered (merge similar-sized files; cheaper writes, more space and more files per read) or leveled (sorted non-overlapping levels; fewer files per read, more rewriting). Compaction keeps the newest version of each key, drops shadowed values, and drops tombstones past the grace period.\n\nCosts: **write amplification** (data rewritten several times by compaction), **read amplification** (multiple files per read), **space amplification** (old versions until compaction), and background I/O that must be rate limited.',
        followups: [
          { q: 'Why does a delete write a tombstone instead of removing the key?', a: 'The key may exist in older SSTables and on other replicas. The tombstone shadows those older values on this node and, through repair, propagates the delete to the others. It is removed only when compaction is sure it has covered everything.' },
          { q: 'What happens if compaction cannot keep up?', a: 'The number of SSTables grows and reads get slower; disk fills. Mitigate by throttling writes (backpressure), adding nodes, or tuning the compaction strategy. Monitor pending compactions and SSTables per read.' },
          { q: 'Why is a memtable plus log faster than updating a B-tree?', a: 'Both memory insert and log append are sequential or in memory, with no random disk I/O. A B-tree update may read and rewrite a page at a random location.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Compaction I/O', problem: 'Background merging rewrites data and competes with foreground reads and writes. If it falls behind, reads touch more SSTables; if it runs hot, latency spikes.', mitigation: 'Rate-limit compaction, leave 40% free disk, pick a compaction strategy for the workload (leveled for read-heavy), and monitor pending compactions and SSTables per read.' },
      { title: 'Hot keys and hot partitions', problem: 'Consistent hashing balances keys but not traffic: one popular key or a time-ordered key prefix overloads the same replicas.', mitigation: 'Cache the hot key above the store, split it across suffixed keys, avoid sequential key prefixes, and use virtual nodes so load is spread when a range moves.' },
      { title: 'Tail latency from the slowest replica', problem: 'A quorum read waits for the R-th fastest replica, so a replica in garbage collection or compaction drags p99.', mitigation: 'Speculative retry (ask another replica after a short delay), prefer fast replicas by recent latency, keep R and W at quorum rather than ALL, and tune memory and GC.' },
      { title: 'Repair and streaming load', problem: 'Merkle-tree builds, node bootstrap and rebalancing move large volumes of data over the same disks and network as user traffic.', mitigation: 'Throttle streaming, repair small ranges incrementally, schedule off-peak, and bring nodes in one at a time.' },
      { title: 'Stale reads and lost updates', problem: 'With eventual consistency and last-write-wins, a client can read old data or have a concurrent update discarded.', mitigation: 'Use QUORUM for reads and writes that matter, vector clocks or CRDTs where updates must merge, and conditional writes through a single coordinator for strict cases. Say which operations need what.' },
      { title: 'Membership churn and false failure detection', problem: 'A slow node declared down shifts traffic, builds hints and may trigger needless rebalancing.', mitigation: 'Use an accrual failure detector, separate "down" from "removed from the ring", and require an explicit decommission before data moves.' }
    ],

    mistakes: [
      'Using `hash(key) mod N` and not noticing that adding a node remaps almost every key.',
      'Saying "R + W > N means strong consistency" without mentioning sloppy quorums, concurrent writes and partial failures.',
      'Choosing **ALL** for reads or writes and forgetting that one failed replica now fails the operation.',
      'Relying on **timestamps** for conflict resolution and not mentioning clock skew and lost concurrent writes.',
      'Putting all replicas of a key on the same rack, zone or physical machine (including via virtual nodes).',
      'Deleting by erasing data, with no **tombstones**, so repair brings the old value back.',
      'Forgetting that **cold data** never heals through read repair, so anti-entropy is needed.',
      'Ignoring **compaction**: no mention of write, read and space amplification, or of free disk headroom.',
      'Adding a central metadata master or proxy on the data path and calling the store masterless.',
      'Not stating the consistency model: saying "it is consistent" or "it is available" without the CAP trade-off in the context of a partition.'
    ],

    pushes: [
      { q: 'Walk me through what happens if a replica is down when a client writes.', why: 'Tests whether you know the whole recovery chain, not just the quorum.', good: 'Quorum still met with the other two, a hint stored for the down node, replay on return, anti-entropy as the backstop, and the sloppy-quorum caveat on read-your-write.' },
      { q: 'Is this a CP or an AP system?', why: 'They want the CAP trade-off tied to behaviour, not a label.', good: 'During a partition it chooses availability by default (serves from reachable replicas, with hints and sloppy quorums); with strict QUORUM it refuses operations that cannot reach a majority. It is tunable per request.' },
      { q: 'How would you add strong consistency for some keys?', why: 'Probes the limit of the quorum approach.', good: 'Conditional writes or a per-partition consensus group (Raft or Paxos) with a leader; explain the availability and latency cost, and that quorum overlap alone is not linearizable.' },
      { q: 'Why are Bloom filters useful here and what are the trade-offs?', why: 'Checks understanding of read amplification.', good: 'They skip SSTables that cannot hold the key; about 10 bits per key gives roughly 1% false positives; they cost memory and give no help for keys that exist or for range scans.' },
      { q: 'How do you rebalance when you add a node?', why: 'Operations under load.', good: 'Consistent hashing moves about 1/(N+1) of keys to the new node, bootstrapping streams from replicas under a throttle, the node serves after streaming, old owners clean up later.' },
      { q: 'What would you monitor?', why: 'Operational maturity.', good: 'p99 latency per operation, pending compactions, SSTables per read, hint backlog, repair lag, disk usage headroom, dropped mutations, and gossip suspicion events.' }
    ],

    quiz: [
      { kind: 'concept', q: 'N=3 replicas. Which settings guarantee that a read quorum overlaps every write quorum?', choices: ['W=2, R=2', 'W=1, R=1', 'W=1, R=2', 'W=2, R=1'], answer: 0, explain: 'The condition is R + W > N. 2 + 2 = 4 > 3. W=1, R=2 gives 3 which equals N, not greater, so a read can miss the single replica that took the write.' },
      { kind: 'concept', q: 'You add one node to a 10-node consistent-hashing ring. About how many keys move?', choices: ['About 1/11 of them, all to the new node', 'About 10/11 of them, spread everywhere', 'None, new nodes only get new keys', 'Exactly half of them'], answer: 0, explain: 'Only the arcs the new node takes over move, about 1/(N+1). With mod N hashing, about 10/11 of the keys would move.' },
      { kind: 'concept', q: 'What is the main purpose of virtual nodes?', choices: ['Even out load and spread a failed node\'s ranges across many peers', 'Make hashing faster', 'Replace replication', 'Guarantee strong consistency'], answer: 0, explain: 'Many small arcs per physical node average out hash imbalance and avoid dumping a failed node\'s whole range on its single neighbour.' },
      { kind: 'concept', q: 'Which of these can break the "R + W > N so a read sees the latest write" guarantee? Pick all that apply.', choices: ['Sloppy quorums with stand-in nodes', 'Two concurrent writes to the same key', 'A write that fails to reach W replicas but landed on some', 'Using three replicas instead of five'], answer: [0, 1, 2], explain: 'Stand-in nodes do not overlap the read set until hints land, concurrent writes need conflict handling, and a partially applied failed write can still be read. The replica count is not the issue.' },
      { kind: 'concept', q: 'Two clients write the same key concurrently. The versions are {A:1,B:1} and {A:1,C:1}. What does a vector-clock store do?', choices: ['Detects they are concurrent and keeps both as siblings', 'Keeps the one with more counters', 'Discards both', 'Picks the one from the alphabetically first node'], answer: 0, explain: 'Neither clock dominates the other, so the writes were concurrent. The store returns both and the client merges them.' },
      { kind: 'concept', q: 'How does anti-entropy with Merkle trees find differing keys cheaply?', choices: ['Compare root hashes, then descend only into subtrees whose hashes differ', 'Send every key from one replica to the other', 'Compare timestamps of the latest write on each node', 'Ask the client which keys changed'], answer: 0, explain: 'Equal roots mean identical ranges. Unequal roots narrow down by comparing children, so cost follows the number of differences, not the data size.' },
      { kind: 'concept', q: 'Why does a delete in an LSM-based replicated store write a tombstone?', choices: ['Older SSTables and other replicas still hold the value, and the tombstone shadows it and spreads the delete', 'It saves disk space immediately', 'SSTables can be edited in place', 'Tombstones make reads faster'], answer: 0, explain: 'SSTables are immutable and replicas are independent, so the delete must be recorded as data. It is purged only after a grace period so repair can propagate it.' }
    ],

    flashcards: [
      { id: 'kv-quorum', front: 'Quorum rule for N, R, W?', back: 'R + W > N makes every read set overlap every write set, so a read includes the latest acknowledged write. N=3, R=2, W=2 is the balanced default. Sloppy quorums and concurrent writes weaken the guarantee.' },
      { id: 'kv-ring', front: 'Why consistent hashing instead of hash mod N?', back: 'Adding or removing a node moves only about 1/(N+1) of keys, not nearly all of them. Virtual nodes even out load and spread a failure across many peers.' },
      { id: 'kv-lww', front: 'Last-write-wins: the catch?', back: 'It uses timestamps, so clock skew can let an older write win, and concurrent writes are silently lost. Vector clocks detect concurrency and keep siblings for the client to merge.' },
      { id: 'kv-hint', front: 'What is hinted handoff?', back: 'When a replica is down, another node stores its writes as hints and replays them when it returns. It keeps writes available and shortens divergence; hints are time-bounded, so repair is still needed.' },
      { id: 'kv-readrepair', front: 'What is read repair?', back: 'When a read sees replicas with different versions, the coordinator writes the newest version to the stale replicas. It heals keys that are read; cold keys need anti-entropy.' },
      { id: 'kv-merkle', front: 'How do Merkle trees speed up replica comparison?', back: 'Each replica hashes its key range into a tree. Equal root hashes mean equal data; otherwise descend only into differing subtrees. Cost follows the number of differences, not the data size.' },
      { id: 'kv-gossip', front: 'How do gossip and failure detection work?', back: 'Each node periodically swaps membership and heartbeat state with random peers, so facts reach all nodes in about log N rounds. An accrual detector turns missing heartbeats into a suspicion level against a threshold.' },
      { id: 'kv-lsm', front: 'LSM tree write and read path?', back: 'Write: commit log plus memtable, flushed to immutable SSTables. Read: memtable, then SSTables newest first, using a Bloom filter per file. Compaction merges files; costs are write, read and space amplification.' },
      { id: 'kv-bloom', front: 'Bloom filter: what does a hit or miss mean?', back: '"No" is definite (the key is not in this SSTable). "Yes" means maybe. About 10 bits per key with 7 hash functions gives roughly a 1% false-positive rate.' }
    ]
  });
})();
