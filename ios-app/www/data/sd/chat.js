/* System design case study: chat (WhatsApp-style messaging). Shape follows data/sd/url-shortener.js. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'chat',
    title: 'Design a chat app',
    short: 'Real-time one-to-one and group messaging over persistent connections: delivery, ordering, offline sync, receipts, presence and encryption.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['WebSocket', 'Ordering', 'Delivery', 'Fan-out', 'Encryption'],
    prompt: 'Design a messaging service like WhatsApp. Users send text and media to one person or to a group, see delivery and read status, and expect messages to arrive in order, even after being offline.',

    requirements: {
      functional: [
        'Send and receive one-to-one messages in real time.',
        'Group chats of up to a few hundred members.',
        'Messages sent while the recipient is offline are delivered when they reconnect.',
        'Delivery and read receipts (sent, delivered, read).',
        'Online and last-seen presence.',
        'Share images, video and files.',
        'Use the app on a phone and on a few linked devices.'
      ],
      nonFunctional: [
        '**Latency**: an online recipient sees a message in well under a second (about 200 ms at the server for the 99th percentile).',
        '**Reliability**: a message accepted by the server is **never lost** and is delivered at least once; the client hides duplicates.',
        '**Ordering**: messages within one conversation appear in the same order for every participant.',
        '**Availability** over strict consistency across conversations; there is no need for a global order.',
        '**Privacy**: messages are end-to-end encrypted, so the servers carry ciphertext they cannot read.',
        '**Scale**: about 500 million daily active users, and on the order of 100 million or more connections open at once.'
      ],
      outOfScope: ['Voice and video calls (a separate real-time media problem).', 'Stories, status updates and channels.', 'Payments and business messaging.', 'Message search on the server (it conflicts with end-to-end encryption).', 'Spam detection beyond rate limits.'],
      assumptions: ['The server holds messages only until delivered, plus a bounded multi-device history; the calculator uses **one year** of retention as a deliberately conservative upper bound.', 'Average **groups have about 20 members**; the maximum is a few hundred.', 'Most messages are short text; media is uploaded to object storage and referenced by a small message.'],
      clarify: [
        { q: 'Does the server keep message history, or only messages in transit?', a: 'This drives storage and the encryption model. A transit-only server (store until delivered, then delete) is cheaper and more private, with history on devices. A server that keeps history makes multi-device sync and new-phone restore easy. Pick one and state it.' },
        { q: 'What are the group size limits, and are there channels with thousands of readers?', a: 'A cap of a few hundred keeps group fan-out bounded. Channels with millions of readers are a broadcast problem (closer to a news feed) and we scope them out.' },
        { q: 'Is it end-to-end encrypted?', a: 'It changes what the servers can do. With end-to-end encryption they cannot search, moderate by content or render link previews; they route and store opaque blobs plus a little metadata.' },
        { q: 'Multiple devices per account?', a: 'Yes, treat each device as its own endpoint with its own keys and its own delivery state. It multiplies fan-out slightly and complicates read state.' }
      ]
    },

    estimates: {
      intro: 'Anchor on 500 million daily active users each sending 40 messages a day: **20 billion messages a day**. In the calculator a **write is one message accepted** and a **read is one message delivery or sync fetch** to a device; with group fan-out, linked devices and re-fetches that is about 50 per user per day.',
      inputs: { dau: 500e6, writesPerUser: 40, readsPerUser: 50, peakFactor: 3, bytesPerWrite: 200, bytesPerRead: 300, years: 1, replication: 3, hotFraction: 0.01, serverQps: 5000, utilization: 0.6 },
      assumptions: ['**200 bytes stored per message**: an encrypted text of ~100 bytes plus IDs, sequence number and timestamps. Media bytes are separate in object storage. Approximate.', '**300 bytes on the wire per delivery** including framing and metadata.', 'Peak is **3 times** average because evenings and events (New Year) spike traffic.', 'A cache share of **1%** stands in for hot recent messages and session state; the main in-memory structure is the connection table, sized below.', 'One chat server handles **about 5,000 message operations a second** (parse, authorize, persist, route). A stated guess, to be measured.'],
      extra: [
        { label: 'Connected devices at peak', formula: '~30% of 500M DAU online at once', result: '~150 million connections' },
        { label: 'Connections per gateway', formula: 'assume ~200,000 idle WebSockets per machine', result: '~750 gateways' },
        { label: 'Memory per connection', formula: '~10 KB state x 150M', result: '~1.5 TB across the fleet' },
        { label: 'Routing table (user to gateway)', formula: '150M entries x ~100 B', result: '~15 GB' },
        { label: 'Messages per second, average', formula: '20B / 86,400 s', result: '~231,000/s' },
        { label: 'Group fan-out, 20 members', formula: '1 message x 19 recipients', result: '19 deliveries per send' }
      ],
      notes: [
        'Roughly **230,000 messages a second on average and 700,000 at peak**. Per-message work must be small and each message handled by one partition, with no global coordination.',
        'The hard resource is **connections**, not bandwidth: 150 million long-lived sockets need hundreds of gateways, a routing table and a plan for what happens when a gateway dies and 200,000 clients reconnect at once.',
        'Upper-bound storage is about 1.5 PB raw (4.4 PB replicated) for a year; keeping messages only until delivered is orders of magnitude less. **Retention policy is a product decision that changes the storage bill by a factor of 100 or more.**',
        'Text bandwidth is tiny (about 46 MB/s in and 87 MB/s out on average). Media is the bandwidth problem and goes through object storage and a CDN.'
      ]
    },
    api: [
      { method: 'GET', path: '/v1/connect (WebSocket upgrade)', desc: 'Open the persistent connection. Authenticated once with a token; everything else flows as frames.',
        request: '// client to server frames (JSON for readability; binary in practice)\n{ "t": "send", "cid": "c_91", "clientMsgId": "d3f1-...", "body": "<ciphertext>", "type": "text" }\n{ "t": "ack",  "cid": "c_91", "seq": 1042 }          // delivered to this device\n{ "t": "read", "cid": "c_91", "upToSeq": 1042 }\n{ "t": "ping" }',
        response: '// server to client frames\n{ "t": "sent",    "clientMsgId": "d3f1-...", "cid": "c_91", "seq": 1043, "ts": 1790000000 }\n{ "t": "message", "cid": "c_91", "seq": 1043, "from": "u_7", "body": "<ciphertext>", "ts": 1790000000 }\n{ "t": "receipt", "cid": "c_91", "seq": 1043, "state": "delivered", "by": "u_9" }',
        notes: ['`clientMsgId` is generated by the client and makes **send idempotent**: a retry after a dropped connection returns the same `seq` instead of creating a second message.', 'The server answers `sent` only after the message is **durably stored**. That is the single-tick moment.', 'Heartbeats (`ping`) detect half-open connections, which look alive to the client but are dead on the network.'] },
      { method: 'GET', path: '/v1/conversations/{cid}/messages?afterSeq=1000&limit=100', desc: 'Sync: fetch messages after a sequence number. Used after reconnecting and when opening a chat.',
        response: '{\n  "messages": [ { "seq": 1001, "from": "u_7", "body": "<ciphertext>", "ts": 1790000000 } ],\n  "hasMore": false\n}',
        notes: ['Pull by sequence number is the **recovery path**: the push over WebSocket is an optimization, and this endpoint repairs any gap.', 'Paginate by `seq`, never by offset.'] },
      { method: 'POST', path: '/v1/media/uploads', desc: 'Request a pre-signed URL to upload an encrypted attachment.',
        request: '{ "size": 2400000, "mime": "image/jpeg", "sha256": "..." }',
        response: '{ "uploadUrl": "https://storage.example/...", "mediaId": "m_55a1" }',
        notes: ['The client encrypts the file with a random key, uploads the ciphertext, then sends a normal message containing `mediaId` and the key (itself encrypted for the recipient).'] },
      { method: 'POST', path: '/v1/groups', desc: 'Create a group.', request: '{ "name": "Weekend plans", "members": ["u_2", "u_9"] }', response: '{ "cid": "g_204", "members": 3 }', notes: ['Membership changes are themselves messages in the conversation so every member sees them in the same order.'] },
      { method: 'POST', path: '/v1/push/register', desc: 'Register a device token for push notifications.', notes: ['Used to wake an offline device through the OS push service. The push payload carries no message content, only "you have something".'] }
    ],
    apiNotes: ['Real-time traffic uses **one long-lived connection** (WebSocket), with HTTP only for sync, media and account calls. Long polling is the fallback for networks that block WebSockets.', 'Authenticate once at connect time and re-check authorization on every send (group membership can change while the socket stays open).', 'Version the frame protocol so old clients keep working through server upgrades.'],

    data: {
      intro: 'The access pattern is "append to a conversation and read the tail", plus "what has this device not yet received". That is a partitioned log per conversation. The server does not need joins or ad-hoc queries over messages, and with end-to-end encryption it could not run them anyway.',
      entities: [
        { name: 'message', purpose: 'One row per message, partitioned by conversation and ordered by sequence number.', fields: [
          ['conversation_id', 'string, partition key', 'One-to-one chats get a deterministic ID from the two user IDs.'],
          ['seq', 'bigint, clustering key', 'Gapless counter **per conversation**. The order everyone agrees on.'],
          ['sender_id', 'bigint', ''],
          ['client_msg_id', 'uuid', 'For idempotent retries. Unique per (conversation, sender) via a short-lived dedupe index.'],
          ['body', 'blob', 'Ciphertext. For media, the message holds a media ID and a wrapped key.'],
          ['server_ts', 'timestamp', 'Display time, not the order.']
        ] },
        { name: 'conversation_member', purpose: 'Who is in a conversation and how far each has read.', fields: [
          ['conversation_id', 'string', ''], ['user_id', 'bigint', ''], ['last_read_seq', 'bigint', 'Drives read receipts and unread badges.'], ['role', 'string', 'Admin or member.']
        ] },
        { name: 'device_cursor', purpose: 'Per device: the highest sequence delivered in each conversation. Basis of sync.', fields: [
          ['device_id', 'string', ''], ['conversation_id', 'string', ''], ['delivered_seq', 'bigint', 'Updated by acknowledgements; batched.']
        ] },
        { name: 'inbox (undelivered queue)', purpose: 'Per device, pointers to messages not yet acknowledged. Short-lived.', fields: [
          ['device_id', 'string, partition key', ''], ['cid + seq', 'composite', 'Pointer to the message; deleted on ack.'], ['expires_at', 'timestamp', 'Messages undelivered for about 30 days are dropped (and the sender told).']
        ] }
      ],
      storage: [
        { title: 'Wide-column store (Cassandra or similar)', verdict: 'Good fit',
          body: 'Partition key `conversation_id`, clustering key `seq`. Appending a message and reading the latest N are single-partition operations with predictable cost, and the store scales out and replicates across zones.\n\n```\nCREATE TABLE message (\n  conversation_id text,\n  seq             bigint,\n  sender_id       bigint,\n  client_msg_id   uuid,\n  body            blob,\n  server_ts       timestamp,\n  PRIMARY KEY (conversation_id, seq)\n) WITH CLUSTERING ORDER BY (seq DESC);\n```\n\nThe cost: the **per-conversation sequence** needs coordination the store does not give you, giant partitions in busy groups need bucketing (for example `(conversation_id, month)`), and there are no secondary queries.' },
        { title: 'Sharded SQL', verdict: 'Fine to start',
          body: 'A messages table with `(conversation_id, seq)` as primary key, sharded by `conversation_id`, gives transactional sequence assignment (`UPDATE ... SET next_seq = next_seq + 1 RETURNING`) and simple operations. It works comfortably for a long time.\n\nThe cost: manual resharding at petabyte scale and write hot spots in very active groups. Many teams start here and move message storage to a log-structured store later.' },
        { title: 'Session and routing state', verdict: 'In memory',
          body: 'Which gateway holds which device\'s connection is ephemeral, tiny (about 15 GB) and read on every message. Keep it in an in-memory key-value store with a TTL refreshed by heartbeats, so a dead gateway\'s entries expire by themselves.' }
      ],
      decisions: [
        { title: 'How to order messages', question: 'Everyone in a conversation must see the same order, and a receiver must be able to detect a gap:',
          options: [
            { name: 'Client timestamps', pros: 'No server coordination.', cons: 'Client clocks are wrong and can be set by the user. Two senders disagree on order, and gaps cannot be detected.' },
            { name: 'Global Snowflake-style ID or server timestamp', pros: 'Coordination-free and roughly time-ordered.', cons: 'Order is only approximate across machines; no way to see that a message is missing, so a lost message is invisible.' },
            { name: 'Sequence number per conversation', pros: 'Gapless: a client holding 1040, 1041 and 1043 knows 1042 is missing and can ask for it. The sync protocol is simply "give me everything after N".', cons: 'Needs one writer per conversation to assign numbers. A conversation is the unit of ordering, so this is a per-conversation serialization point.' }
          ],
          pick: '**A per-conversation sequence number**, assigned by the single partition owner for that conversation. Ordering inside a conversation is the only ordering that matters, and the sequence also powers gap detection, acknowledgements and sync. Keep a time-based ID only for display and retention.' },
        { title: 'Delivery guarantee', question: 'What does "delivered" promise given dropped connections and server restarts?',
          options: [
            { name: 'At most once (send and forget)', pros: 'Simple and fast.', cons: 'Messages disappear when a socket drops mid-send. Unacceptable for chat.' },
            { name: 'At least once with acknowledgements, retries and client-side dedupe', pros: 'Never loses an accepted message; duplicates are harmless because the sequence number identifies each message.', cons: 'Clients must dedupe and store a cursor. A message can arrive twice.' },
            { name: 'Exactly once end to end', pros: 'Conceptually clean.', cons: 'Not achievable across an unreliable network without effectively building at-least-once plus idempotency.' }
          ],
          pick: '**At-least-once delivery plus idempotent processing.** The sender retries with the same `clientMsgId`, the server dedupes on it, and the receiver ignores a sequence number it already has. Together that behaves like exactly-once for the user.' }
      ]
    },
    design: {
      intro: 'Clients hold one persistent connection to a **gateway**. A stateless-ish **chat service** assigns the conversation\'s next sequence number, stores the message, then either pushes it down the recipient\'s connection or queues it for later. Payloads are ciphertext; the servers route and store. **Click any box** for the reasoning, or pick a scenario to trace.',
      diagram: {
        title: 'Chat high-level design',
        nodes: [
          { id: 'client', label: 'Phone or web client', kind: 'client',
            detail: { why: 'Holds a WebSocket to a gateway, keeps a local database of messages and per-conversation cursors, encrypts before sending and decrypts after receiving. The client is also the retry engine: it resends until it sees a `sent` acknowledgement.', tradeoffs: ['Mobile networks drop and change constantly, so the client reconnects with exponential backoff and jitter.', 'The local database makes the app work offline and lets sync be "fetch after my last sequence number".'], scale: 'A mass reconnect after a gateway or region failure is the thundering herd the rest of the system has to survive.' } },
          { id: 'lb', label: 'Load balancer (TCP)', kind: 'lb',
            detail: { why: 'Spreads new connections across gateways with a layer 4 balancer, so it does not parse the stream and adds almost no latency.', tradeoffs: ['Balance by **least connections**, not round robin, because connections live for hours and arrival time is a poor proxy for load.', 'Draining a gateway for a deploy means asking clients to reconnect gradually, not dropping them all.'], alternatives: ['DNS-based routing to regional gateways', 'Layer 7 balancers (more flexible, more CPU per connection)'], scale: 'New-connection rate during a mass reconnect, long before bandwidth.' } },
          { id: 'gateway', label: 'Connection gateways', kind: 'service',
            detail: { why: 'Terminate TLS and hold the WebSockets: about 200,000 mostly idle connections per machine (approximate; depends on tuning). They authenticate, enforce rate limits, refresh presence on heartbeats and forward frames inward. They keep **no durable state**.', tradeoffs: ['Gateways are the only stateful-in-memory tier; losing one drops its connections and the clients reconnect elsewhere.', 'Keep them thin: parsing and fan-out logic lives in the chat service so gateways can be deployed rarely.', 'Memory per connection (buffers, TLS state) sets the machine capacity.'], alternatives: ['HTTP long polling (works through restrictive networks, far more overhead)', 'MQTT or a custom binary protocol'], scale: 'File descriptors and memory first. About 750 gateways for 150 million connections at 200,000 each.' } },
          { id: 'chat', label: 'Chat service', kind: 'service',
            detail: { why: 'Validates a send, dedupes on `clientMsgId`, assigns the next per-conversation sequence number, writes the message, and routes it: look up the recipient\'s gateway and push, or queue it if they are offline. Work for one conversation is handled by one owner so numbers stay gapless.', tradeoffs: ['Route by hash of `conversation_id` so a single instance owns each conversation\'s sequence. Failover must fence the old owner (lease or compare-and-set on the counter).', 'It returns `sent` only after the durable write, never before.'], alternatives: ['Let the database assign `seq` with an atomic increment', 'A log per conversation (Kafka partition) as the source of ordering'], scale: 'A single very active group is a hot partition, bounded by group size limits and message rates.' } },
          { id: 'msgdb', label: 'Message store', kind: 'db',
            detail: { why: 'Durable, partitioned by conversation, ordered by sequence number. It serves the tail of a conversation and "everything after N" for sync.', tradeoffs: ['Wide-column storage scales out and replicates by default, but ordering and counters are your job.', 'Retention is a policy: delete after delivery, after N days, or keep forever. It changes cost by orders of magnitude.'], alternatives: ['Sharded MySQL or PostgreSQL', 'Cassandra or ScyllaDB', 'DynamoDB'], scale: 'Petabytes if history is kept (about 1.5 PB raw a year at the assumed volume); write rate of roughly 230,000 a second on average.' } },
          { id: 'session', label: 'Session and presence store', kind: 'cache',
            detail: { why: 'Maps `device_id` to the gateway holding its connection, with a TTL that heartbeats refresh. It also holds last-seen and online status. Entries vanish by themselves when a gateway dies.', tradeoffs: ['About 150 million entries, about 15 GB: small enough for an in-memory store.', 'Presence updates are chatty; throttle them and only publish to people who are viewing that contact.', 'A stale entry sends a message to a dead gateway, so delivery must tolerate "not found" and fall back to the offline path.'], alternatives: ['Consistent hashing of user to gateway (no table, but rebalancing is hard)', 'A service-discovery system'], scale: 'Heartbeat write rate: 150 million devices pinging every 30 s is 5 million writes a second, so batch them or refresh less often.' } },
          { id: 'group', label: 'Group service', kind: 'service',
            detail: { why: 'Owns group membership and roles and returns the member list for fan-out. Membership changes are written as messages so everyone sees them in order relative to normal messages.', tradeoffs: ['Cache member lists in the chat service; stale lists cause a removed member to receive one extra message.', 'With end-to-end encryption, membership change requires key rotation on the group.'], scale: 'Fan-out of a send is the group size; bounded by a cap of a few hundred.' } },
          { id: 'queue', label: 'Delivery and push queue', kind: 'queue',
            detail: { why: 'When a recipient is offline or a group fan-out is large, deliveries go to a durable queue so a slow or absent recipient never blocks the sender\'s acknowledgement.', tradeoffs: ['At-least-once with idempotent consumers, because the sequence number makes duplicates harmless.', 'Per-device inbox is still the source of truth for "not yet delivered"; the queue only triggers work.'], alternatives: ['Kafka partitioned by conversation', 'A managed queue'], scale: 'Backlog when many users come online at once (a morning in a region).' } },
          { id: 'push', label: 'Push notification service', kind: 'service',
            detail: { why: 'Wakes an offline device through the operating system\'s push channel. The payload carries no message content, only a hint to reconnect and sync.', tradeoffs: ['OS push is best-effort and can be delayed or dropped, so sync-on-reconnect remains the real guarantee.', 'Collapse many pushes for one chat into one so the device is not flooded.'], scale: 'Provider rate limits and token churn.' } },
          { id: 'apns', label: 'APNs / FCM', kind: 'external',
            detail: { why: 'The platform push services that can reach a sleeping phone. Not under your control.', tradeoffs: ['No delivery guarantee and no ordering guarantee. Treat a push as "go check".', 'Content in the payload would leak metadata or ciphertext through a third party.'], scale: 'Outside your control: back off on throttling responses.' } },
          { id: 'keys', label: 'Key directory', kind: 'db',
            detail: { why: 'Stores each device\'s public identity key and a pool of one-time pre-keys so a sender can start an encrypted session with someone who is offline. It holds only **public** key material.', tradeoffs: ['One-time pre-keys run out; clients upload more when notified.', 'Users must be able to verify a contact\'s key (safety numbers), or the directory could be abused to insert a man in the middle.'], scale: 'Small and read-mostly; bursts when a new device is linked.' } },
          { id: 'cdn', label: 'CDN', kind: 'cdn',
            detail: { why: 'Serves encrypted attachments from the edge. The file is ciphertext, so the CDN holds nothing readable.', tradeoffs: ['Popular forwarded media is fetched many times; caching by content hash saves storage.', 'Download links are short-lived and signed.'], scale: 'Cost, not capacity.' } },
          { id: 'media', label: 'Media object storage', kind: 'storage',
            detail: { why: 'Receives encrypted files directly from clients through pre-signed URLs, so large uploads never pass through gateways.', tradeoffs: ['Expire blobs after a retention period (for example 30 days after upload) since the server cannot inspect them.', 'Thumbnails are generated by the sender client before encrypting.'], scale: 'Total size; lifecycle rules matter more than throughput.' } }
        ],
        edges: [
          { from: 'client', to: 'lb', label: 'WebSocket' },
          { from: 'client', to: 'cdn', label: 'media' },
          { from: 'cdn', to: 'media' },
          { from: 'lb', to: 'gateway' },
          { from: 'gateway', to: 'session', label: 'heartbeat' },
          { from: 'gateway', to: 'chat', label: 'frames' },
          { from: 'chat', to: 'msgdb', label: 'append' },
          { from: 'chat', to: 'group', label: 'members' },
          { from: 'chat', to: 'keys', label: 'pre-keys' },
          { from: 'chat', to: 'queue', label: 'offline', style: 'async' },
          { from: 'queue', to: 'push', style: 'async' },
          { from: 'push', to: 'apns', style: 'async' }
        ],
        scenarios: [
          { id: 'send', label: 'One-to-one, recipient online', steps: [
            { title: 'Send frame', path: ['client', 'lb', 'gateway'], note: 'The sender writes a `send` frame with a client-generated message ID on its open WebSocket.' },
            { title: 'To the chat service', path: ['gateway', 'chat'], note: 'The gateway forwards the frame to the instance that owns this conversation (hash of the conversation ID).' },
            { title: 'Assign sequence and store', path: ['chat', 'msgdb'], tone: 'accent', note: 'The service dedupes on the client ID, takes the next sequence number (say 1043) and writes the message durably.' },
            { title: 'Look up recipient', path: ['chat', 'session'], note: 'It finds that the recipient\'s device is connected to gateway 412.' },
            { title: 'Push to recipient', path: ['chat', 'gateway', 'lb', 'client'], tone: 'ok', note: 'The message goes to gateway 412 and down the recipient\'s socket (the diagram draws one gateway and one client node; this is the return leg to the other device). The sender separately receives `sent` with seq 1043 (one tick).' },
            { title: 'Ack and receipt', path: ['client', 'lb', 'gateway', 'chat'], note: 'The recipient\'s app acknowledges seq 1043. The service advances the device cursor and sends a `delivered` receipt back to the sender (two ticks). Read receipts follow the same path.' }
          ] },
          { id: 'offline', label: 'Recipient offline', steps: [
            { title: 'Send and store', path: ['client', 'lb', 'gateway', 'chat', 'msgdb'], note: 'The message is accepted and stored exactly as before. The sender gets `sent`.' },
            { title: 'No connection found', path: ['chat', 'session'], tone: 'hard', note: 'The routing lookup finds nothing, or a stale entry that fails. The message stays in the recipient\'s per-device inbox.' },
            { title: 'Queue a wake-up', path: ['chat', 'queue'], note: 'A small task is queued so the sender is not delayed by push providers.' },
            { title: 'Push without content', path: ['queue', 'push', 'apns'], note: 'The push service asks the OS to wake the device with a hint like "new message". Pushes for one chat are collapsed.' },
            { title: 'Reconnect and sync', path: ['client', 'lb', 'gateway', 'chat', 'msgdb'], tone: 'ok', note: 'On reconnect the client reports its last sequence per conversation and the service streams everything after it. Even if the push was lost, this sync delivers the message.' }
          ] },
          { id: 'group', label: 'Group message', steps: [
            { title: 'Send to the group', path: ['client', 'lb', 'gateway', 'chat'], note: 'A member sends one message addressed to the group conversation.' },
            { title: 'Store once', path: ['chat', 'msgdb'], tone: 'accent', note: 'It is stored **once** under the group\'s conversation with one sequence number, not once per member. That is what keeps ordering identical for everyone.' },
            { title: 'Get the member list', path: ['chat', 'group'], note: 'The group service returns the members (about 20 on average, capped at a few hundred).' },
            { title: 'Fan out by device', path: ['chat', 'session'], note: 'For each member device, look up its gateway and push. Offline members get an inbox pointer and a queued push.' },
            { title: 'Offline members', path: ['chat', 'queue', 'push'], tone: 'hard', note: 'Pointers to the single stored message go to each offline member\'s inbox, so storage does not multiply with group size.' }
          ] },
          { id: 'start', label: 'First message (encryption)', steps: [
            { title: 'Need a session key', path: ['client', 'lb', 'gateway', 'chat'], note: 'The sender has never messaged this contact, so it has no shared secret.' },
            { title: 'Fetch public pre-keys', path: ['chat', 'keys'], tone: 'accent', note: 'The directory returns the recipient\'s public identity key and one one-time pre-key. The sender derives a shared secret locally, without the recipient being online.' },
            { title: 'Send ciphertext', path: ['chat', 'msgdb'], tone: 'ok', note: 'The first message carries the handshake material and is stored as an opaque blob. The server cannot read it.' }
          ] }
        ]
      },
      walkthrough: [
        '**Send**: the client sends over its WebSocket with a client-generated ID; the chat service dedupes, assigns the next sequence number for that conversation, stores the ciphertext, then replies `sent`.',
        '**Deliver**: look up the recipient\'s gateway in the session store and push; otherwise leave it in the inbox, queue a content-free push and rely on sync-on-reconnect.',
        '**Sync**: a client reconnects and says "my last seq in conversation X is N"; the server returns everything after N. The sequence number makes this a simple range read and makes gaps detectable.',
        '**Failure modes**: a dead gateway drops its connections and clients reconnect elsewhere; a lost push is repaired by sync; a duplicate delivery is dropped by the client; losing the session store only makes pushes fall back to the offline path.'
      ],
      notes: ['The diagram shows one client node for both sender and recipient to avoid cycles; in reality the delivery leg reaches a different device through a different gateway.']
    },
    deepDives: [
      { id: 'connections', title: 'Connections and gateways',
        question: 'How do you keep 150 million connections open, and what happens when a gateway dies?',
        answer: 'Use **WebSockets** (one TCP connection per device, upgraded from HTTP) behind a layer 4 load balancer. Gateways are thin: TLS, authentication, heartbeats and frame forwarding. A tuned machine can hold hundreds of thousands of mostly idle connections (a rough figure to measure), limited by memory per connection and file descriptors, so about 750 gateways cover 150 million.\n\nA registry (the session store) maps each device to its gateway with a TTL refreshed by heartbeats. When a gateway dies its entries expire on their own, clients detect the broken socket through missed heartbeats and reconnect to another gateway, and then **sync from their last sequence number**, which repairs anything lost in between.\n\nThe real risk is the **reconnect storm**. Clients retry with exponential backoff plus random jitter, gateways shed load once they reach a connection cap, and deploys drain gateways gradually.',
        followups: [
          { q: 'Why heartbeats?', a: 'A half-open connection (phone in a tunnel, NAT mapping expired) looks open to both ends. A periodic ping with a timeout detects it, and also keeps mobile NAT entries alive. Tune the interval to trade battery and traffic against detection time.' },
          { q: 'How does the chat service find the right gateway?', a: 'Look up the device in the session store (an in-memory map with TTL) and send the frame to that gateway through an internal channel. If the entry is missing or stale, fall back to the offline path; sync repairs it.' },
          { q: 'WebSocket or long polling?', a: 'WebSocket is cheaper per message and lower latency. Keep long polling as a fallback for networks or proxies that break WebSockets.' },
          { q: 'How do you deploy gateways without dropping everyone?', a: 'Drain: stop accepting new connections, tell a fraction of clients to reconnect elsewhere on a schedule, and wait for the rest. Never restart the whole fleet at once.' }
        ] },
      { id: 'ordering', title: 'Message ordering and sequence numbers',
        question: 'How do you make sure all participants see messages in the same order, and detect a missing message?',
        answer: 'Assign a **gapless sequence number per conversation** on the server. Route every message for a conversation to the same owner (by hashing `conversation_id`), which increments a counter and stores the message with that number. The sequence is the order of display and the primary key in the message store.\n\nBecause the numbers are consecutive, a client holding 1040, 1041 and 1043 **knows** 1042 is missing and requests it. Sync becomes "everything after N". Acknowledgements, read positions and receipts are all just sequence numbers.\n\nOrder is only needed **within** a conversation, not across them. That removes any need for a global order or global clock: each conversation is an independent serialization point, so the system scales by adding more conversations to more owners.',
        followups: [
          { q: 'What if two people send at the same moment?', a: 'The owner serializes them: whichever it processes first gets the lower sequence number. Both senders see the same final order, which can differ from the order they typed in. That is acceptable and standard.' },
          { q: 'How do you keep the counter correct if the owner fails?', a: 'Store the counter durably (a conditional increment in the database, or a lease with a fencing token) so a new owner continues from the last committed number. Without fencing, two owners could hand out the same number.' },
          { q: 'Why not use timestamps?', a: 'Clock skew means two machines disagree on order, ties happen, and a lost message is invisible because nothing is missing from a timestamp sequence.' },
          { q: 'What about a hot group chat?', a: 'One owner serializes it, which is fine up to thousands of messages a second per conversation, far above a human group. A very large broadcast group is a different design (a log with many readers).' }
        ] },
      { id: 'delivery', title: 'Delivery guarantees and offline sync',
        question: 'How do you guarantee a message is never lost when the recipient is offline or the network drops mid-send?',
        answer: 'Layer it. First, **the sender retries until acknowledged**: it keeps the message in a local outbox and resends with the same client ID until it gets `sent`, and the server dedupes on that ID. Second, **the server stores before it acknowledges**, so once the sender sees one tick the message survives a server crash. Third, the **recipient acknowledges** each sequence number; until then the message stays in that device\'s inbox. Fourth, a push notification wakes an offline device, but the real guarantee is **sync on reconnect**: the client sends its last sequence per conversation and the server returns everything after it.\n\nThat is at-least-once delivery. Duplicates are discarded by the client because it already has that sequence number, which gives the user exactly-once behavior.',
        followups: [
          { q: 'How long does the server keep undelivered messages?', a: 'A bounded time (for example 30 days), then drops them and tells the sender it could not be delivered. Unbounded retention for a phone that never returns is a cost with no benefit.' },
          { q: 'What if the push notification is lost?', a: 'Nothing is lost. The next time the app opens it syncs. Push only reduces the delay; it is a hint.' },
          { q: 'How do you sync efficiently after a long offline period?', a: 'Page through messages by sequence number per conversation, newest conversations first, and fetch media lazily. Batch acknowledgements ("up to seq N") rather than one per message.' }
        ] },
      { id: 'receipts', title: 'Delivery and read receipts',
        question: 'How do you implement sent, delivered and read states without doubling your traffic?',
        answer: 'Model state as **cursors, not per-message flags**. For each conversation and member keep `delivered_seq` and `last_read_seq`. When a device acknowledges receipt of sequence 1043, the server moves its `delivered_seq` to at least 1043, and when the user opens the chat the app sends `read upToSeq 1043`. One small update covers every message up to that number.\n\nThe sender\'s ticks derive from the cursors: stored (one tick), delivered (two), read (two coloured). The server relays cursor changes to the sender as receipt frames. Batch and debounce these (a short delay of a second or two) because opening a busy chat should be one receipt, not fifty.',
        followups: [
          { q: 'How does a group show "read by all"?', a: 'Compare the minimum of the members\' cursors to the message sequence. Show per-member detail only on request, because computing it for large groups on every message is wasteful.' },
          { q: 'Should receipts be reliable?', a: 'They are best-effort metadata: a lost receipt is repaired by the next cursor update. Do not give them the delivery guarantee of messages.' },
          { q: 'What about privacy?', a: 'Make read receipts optional per user; the server simply does not relay them. Also remember they reveal when someone was online.' }
        ] },
      { id: 'groups', title: 'Group chat fan-out',
        question: 'A message to a group of 200 members: store it once or 200 times, and how do you deliver it?',
        answer: 'Store it **once** in the conversation log with one sequence number. That keeps ordering identical for everyone and storage independent of group size. Delivery is the multiplied part: for each member device look up its gateway and push over its socket; for offline devices add a pointer to the per-device inbox and queue a push.\n\nFan-out cost is the group size, bounded by a member cap. Fan-out runs asynchronously in workers so the sender\'s `sent` acknowledgement depends only on the durable write. Cache member lists in the chat service and refresh on membership-change messages.\n\nThe alternative, write-per-recipient ("inbox" model), makes reads trivial and ordering per recipient easy but multiplies storage by group size and lets different members have different orders, so it is a poor default for chat.',
        followups: [
          { q: 'What changes for a channel with a million subscribers?', a: 'Fan-out on write stops being viable. Use a read model: subscribers pull from the log by sequence number (like the news feed celebrity case), possibly with push notifications batched or rate limited.' },
          { q: 'How do membership changes interact with ordering?', a: 'Write them as messages in the same conversation log. Then "who could see message N" is defined by the membership state at sequence N, and every member agrees on it.' },
          { q: 'What happens when someone is removed?', a: 'They stop receiving later messages after the removal sequence. With end-to-end encryption the group key must also rotate so the removed member cannot decrypt future messages.' }
        ] },
      { id: 'presence', title: 'Presence and last seen',
        question: 'How do you show who is online without melting the system?',
        answer: 'Presence is **ephemeral, approximate and chatty**, so give it its own cheap path. Each heartbeat refreshes a TTL entry for the device in the in-memory session store. "Online" means the entry exists, and last seen is the last refresh time.\n\nThe danger is write and fan-out volume: 150 million devices pinging every 30 seconds is 5 million writes a second, and telling every contact about every change multiplies it again. Mitigate by (a) lengthening the heartbeat where possible, (b) **pulling, not pushing**: fetch a contact\'s status when a chat screen opens, and subscribe to updates only for the few contacts currently on screen, (c) debouncing flapping, and (d) letting users hide last seen.',
        followups: [
          { q: 'Do you need presence to be consistent?', a: 'No. A status that is a few seconds stale is fine. Do not give it durable storage or strong consistency.' },
          { q: 'How does "typing..." work?', a: 'A transient frame relayed to the other participants through the gateways, never stored, with a short expiry on the client. Throttle it to one event every few seconds.' }
        ] },
      { id: 'e2ee', title: 'End-to-end encryption overview',
        question: 'The service should not be able to read messages. What does that change in the design?',
        answer: 'Each device has a key pair and publishes its **public** keys (an identity key plus a pool of one-time pre-keys) to a key directory. To start a conversation, the sender fetches the recipient\'s public keys and derives a shared secret **locally** with an authenticated key exchange, even if the recipient is offline. After that, messages are encrypted with keys that change as the conversation proceeds (a ratchet), so a stolen key exposes only a little. The servers carry opaque ciphertext plus the metadata they need to route it.\n\nConsequences: the server cannot search, translate or scan content, so those features move to the client; **multi-device** means one encryption per recipient device (or a per-device key envelope), so fan-out grows with device count; groups need a shared group key rotated on membership changes; and users verify each other\'s keys out of band to defeat a key-directory substitution. Metadata (who talks to whom, when, sizes) is still visible to the servers and needs its own protection.',
        followups: [
          { q: 'Who generates and holds the private keys?', a: 'The device, in secure hardware where available. The server never sees them, so losing a phone means losing history unless the user made an encrypted backup with a key only they hold.' },
          { q: 'How does a new linked device read old messages?', a: 'It cannot read ciphertext made for other devices. Either the primary device re-encrypts and transfers recent history, or the new device only sees messages from the time it was linked. Say which.' },
          { q: 'How are media files encrypted?', a: 'The sender encrypts the file with a random key, uploads the ciphertext to object storage, and sends a normal message that contains the media ID and the file key. The storage and CDN only ever hold ciphertext.' },
          { q: 'This is an overview. What is the first protocol you would look up?', a: 'The Signal protocol family (X3DH-style key agreement and the Double Ratchet). In an interview, describe the properties (forward secrecy, deniability, asynchronous setup), not the math.' }
        ] },
      { id: 'media', title: 'Media: images, video and files',
        question: 'How do attachments travel without overloading the chat path?',
        answer: 'Separate the **bytes** from the **message**. The client requests a pre-signed URL, uploads the encrypted file straight to object storage (resumable and chunked for big files), then sends a tiny message with the media ID, size, a thumbnail, and the file key. Recipients fetch the ciphertext through the CDN with a signed URL and decrypt locally.\n\nThis keeps gateways and chat servers handling small frames only. Compress and resize on the sender (the server cannot transcode ciphertext), cap sizes, and expire blobs after a retention period. Forwarding the same attachment reuses the stored file by content hash instead of re-uploading.',
        followups: [
          { q: 'How do you handle a failed upload?', a: 'Resumable chunk uploads let the client continue, and the message is only sent after the upload completes, so recipients never see a message that points at missing media.' },
          { q: 'Can you deduplicate media?', a: 'Only with convergent schemes, which leak whether two users sent the same file. Many designs accept no dedup, except that the sender re-uses its own already-uploaded blob when forwarding.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Connection capacity and reconnect storms', problem: 'About 150 million sockets across hundreds of gateways. A gateway or network failure makes tens or hundreds of thousands of clients reconnect at once.', mitigation: 'Exponential backoff with jitter on clients, connection caps and load shedding on gateways, least-connections balancing, gradual drains for deploys, and sync-from-cursor so reconnect is cheap.' },
      { title: 'Hot conversations', problem: 'The per-conversation sequence owner is a serialization point; a very active group concentrates load on one partition.', mitigation: 'Cap group size and per-sender rates, keep the owner\'s critical path to one durable write, and treat very large audiences as a separate broadcast design.' },
      { title: 'Session store write load', problem: 'Heartbeats and presence generate millions of writes a second.', mitigation: 'Lengthen heartbeat intervals, batch refreshes per gateway, store only connection mapping in the hot store, and pull presence instead of pushing it.' },
      { title: 'Message store growth', problem: 'At 20 billion messages a day the store grows by terabytes a day if history is kept.', mitigation: 'Delete after delivery plus a short retention, bucket partitions by time, tier old data, and move history to the clients.' },
      { title: 'Group fan-out amplification', problem: 'One send becomes up to a few hundred deliveries, multiplied by linked devices.', mitigation: 'Store once, fan out asynchronously in workers, cap group size, and skip devices that are not connected (they sync later).' },
      { title: 'Push provider reliability', problem: 'OS push services throttle and sometimes drop notifications.', mitigation: 'Treat push as a hint, collapse notifications per conversation, and make sync-on-reconnect the guarantee.' }
    ],

    mistakes: [
      'Polling over HTTP for new messages instead of a **persistent connection**.',
      'Ordering with **client or server timestamps** and not mentioning ties, skew or gap detection.',
      'Claiming **exactly-once** delivery without explaining at-least-once plus idempotency.',
      'Assuming push notifications are reliable instead of using **sync on reconnect** as the guarantee.',
      'Storing a group message **once per member** without discussing ordering and storage cost.',
      'Treating **presence** as strongly consistent or durable data.',
      'Forgetting what **end-to-end encryption removes** (server search, content moderation) and what it adds (key directory, per-device encryption).',
      'Sending **media bytes through the chat servers** instead of object storage.',
      'No plan for the **reconnect storm** after a gateway failure.',
      'Ordering globally across all conversations, which is expensive and unnecessary.',
      'Acknowledging the sender **before** the message is durably stored.'
    ],

    pushes: [
      { q: 'How do you guarantee ordering in a group chat?', why: 'It is the central correctness question of messaging.', good: 'One owner per conversation assigns a gapless sequence number; the order is the sequence; clients detect gaps and request the missing range; ordering across conversations is not needed.' },
      { q: 'What does the sender\'s single tick actually promise?', why: 'They want to hear where the durability boundary is.', good: 'The message has been durably stored with a sequence number. It says nothing about the recipient. Two ticks mean the recipient\'s device acknowledged it.' },
      { q: 'What if the recipient\'s gateway crashes between the lookup and the push?', why: 'Failure mid-delivery.', good: 'The message is already stored in the inbox, so nothing is lost. The push fails or is never acknowledged; the device reconnects and syncs, and any duplicate is discarded by sequence number.' },
      { q: 'How would you support message search with end-to-end encryption?', why: 'It tests whether you understand the encryption trade-off.', good: 'Server-side search is impossible on ciphertext. Index on the device, or use client-side encrypted indexes, and say that searching across devices means syncing the index.' },
      { q: 'How do you scale to ten times the users?', why: 'Where does it break.', good: 'Connection fleet and the session store first (shard by user hash), then the message store (more partitions, shorter server retention), regional deployments with users pinned to a home region, and sharded per-conversation owners.' },
      { q: 'Why not use Kafka as the whole chat backbone?', why: 'A tempting answer; they check whether you know what it does not give you.', good: 'A partitioned log is good for ordering and replay per conversation, and many designs use one for fan-out. It does not hold 150 million client connections, do per-device inbox state or presence, so it is a component, not the design.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why use a per-conversation sequence number instead of timestamps to order messages?', choices: ['It is gapless, so every participant sees one order and a missing message is detectable', 'Timestamps are slower to store', 'Sequence numbers make messages smaller', 'Timestamps cannot be shown in the UI'], answer: 0, explain: 'Client clocks disagree and timestamps tie. A consecutive sequence from a single owner gives one order and lets a client see that 1042 is missing.' },
      { kind: 'concept', q: 'What is the real guarantee that a message reaches a device that was offline?', choices: ['Sync from the last sequence number when it reconnects', 'The OS push notification', 'The sender retrying forever', 'A WebSocket staying open while the phone is off'], answer: 0, explain: 'Push is a best-effort hint. The client reports its cursor and the server sends everything after it.' },
      { kind: 'concept', q: 'How should a group message be stored?', choices: ['Once in the conversation log, with delivery fanned out to each member device', 'Once per member, so every member has a copy', 'Only on the sender\'s device', 'In the push service'], answer: 0, explain: 'One copy with one sequence number keeps ordering identical and storage independent of group size.' },
      { kind: 'concept', q: 'A client resends a message after a dropped connection. How do you avoid creating a duplicate?', choices: ['The client generates a message ID and the server dedupes on it', 'The server rejects every retry', 'The client waits an hour before retrying', 'Duplicates cannot happen over TCP'], answer: 0, explain: 'The retry carries the same client message ID, so the server returns the original sequence number instead of storing a second message.' },
      { kind: 'concept', q: 'Which are consequences of end-to-end encryption? Pick all that apply.', choices: ['The server cannot search message content', 'Fan-out grows with the number of recipient devices', 'The server can render link previews', 'Group membership changes require key rotation'], answer: [0, 1, 3], explain: 'The server only handles ciphertext, so it cannot search or preview. Each device needs its own encryption, and removing a member means rotating the group key.' },
      { kind: 'complexity', q: 'About how many gateways are needed for 150 million connections at 200,000 per machine?', choices: ['About 750', 'About 75', 'About 7,500', 'About 7'], answer: 0, explain: '150,000,000 / 200,000 = 750, before adding headroom for failures and deploys (and the 200,000 figure is itself an approximation).' },
      { kind: 'concept', q: 'Why model read receipts as a cursor per member?', choices: ['One small update ("read up to seq N") covers every earlier message', 'Cursors are required by WebSocket', 'It removes the need for sequence numbers', 'Cursors encrypt the receipt'], answer: 0, explain: 'Per-message flags would multiply updates. A single position per member per conversation is compact and easy to sync.' }
    ],

    flashcards: [
      { id: 'sequence', front: 'Why a per-conversation sequence number?', back: 'Gapless and assigned by one owner: gives a single agreed order, makes gaps detectable, and turns sync into "everything after N".' },
      { id: 'delivery', front: 'Chat delivery semantics?', back: 'At-least-once: sender retries with a client message ID, server stores before acking and dedupes, recipient acks and ignores sequence numbers it already has.' },
      { id: 'sync', front: 'What actually guarantees delivery to an offline device?', back: 'Sync on reconnect from the last sequence per conversation. Push notifications are only a best-effort hint.' },
      { id: 'group-store', front: 'Group message: store once or per member?', back: 'Once in the conversation log; fan out delivery by device. Keeps one order for everyone and storage independent of group size.' },
      { id: 'connections', front: 'What limits a chat gateway and what is the main risk?', back: 'Memory and file descriptors per connection (hundreds of thousands per machine, approximate). Risk: reconnect storm; use backoff with jitter and load shedding.' },
      { id: 'receipts', front: 'How are delivered and read receipts modelled?', back: 'As per-member cursors (delivered_seq, last_read_seq) per conversation, batched and debounced.' },
      { id: 'e2ee', front: 'What does end-to-end encryption change for the server?', back: 'It carries and stores ciphertext only: no server search, per-device encryption (more fan-out), a public key directory with pre-keys, and group key rotation on membership change.' }
    ]
  });
})();

