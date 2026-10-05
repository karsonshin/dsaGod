/* System design case study: notification system (push, SMS, email). Shape follows data/sd/url-shortener.js. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'notification-system',
    title: 'Design a notification system',
    short: 'Send push, SMS and email reliably at scale: intake, templates, preferences, rate limits, priorities, retries, dedupe and unreliable third-party providers.',
    difficulty: 'Medium',
    time: '45 min',
    tags: ['Queues', 'Idempotency', 'Rate limiting', 'Retries'],
    prompt: 'Design a notification platform that other services in the company call to notify users. It sends mobile push, SMS and email, respects user preferences, never spams, and keeps working when providers fail.',

    requirements: {
      functional: [
        'Internal services submit a notification request (event, recipient or audience, template, data).',
        'Deliver over mobile push, SMS and email, choosing channels by user preference and notification type.',
        'Render messages from templates with localization.',
        'Users manage preferences: per channel and per category, plus a global opt-out and quiet hours.',
        'Support immediate, scheduled and batched or digest sends.',
        'Track status (accepted, sent, delivered, opened, failed) and expose analytics.'
      ],
      nonFunctional: [
        '**Reliability**: an accepted notification is sent **at least once**; critical ones (security codes, payment alerts) must not be lost.',
        '**No duplicates**: retries and replays must not send the same message twice to a user.',
        '**Latency**: high priority (a one-time code) delivered within seconds; bulk marketing may take minutes to hours.',
        '**Isolation**: a marketing blast must not delay a password-reset message.',
        '**Compliance**: honor opt-outs and unsubscribe immediately; keep an audit trail.',
        '**Scale**: about 100 million daily active users and roughly 500 million notification events a day, with large bursts.'
      ],
      outOfScope: ['Building the push, SMS or email carriers themselves (we integrate with third-party providers).', 'In-app notification inbox UI.', 'Deciding **what** to notify about (product and growth logic).', 'Full campaign management and audience segmentation tools.', 'Two-way SMS conversations.'],
      assumptions: ['Callers are trusted internal services that authenticate to the platform.', 'Roughly **80% of deliveries are push, 17% email, 3% SMS** (an assumption; SMS is rare because it is expensive).', 'Each event produces about **1.6 deliveries** on average (some go to several channels, some are suppressed by preferences).'],
      clarify: [
        { q: 'Which notifications are critical, and which are promotional?', a: 'Ask for categories. Transactional and security messages get the highest priority, bypass quiet hours, and cannot be opted out of (only channel choice). Marketing is lowest priority, rate limited, and always opt-out-able.' },
        { q: 'Is exactly-once required?', a: 'Not achievable end to end with third-party providers. Promise at-least-once delivery to the provider plus idempotent submission and dedupe so the **user** rarely sees duplicates, and say plainly that a rare duplicate or loss is possible when a provider fails ambiguously.' },
        { q: 'Does the platform decide recipients, or do callers pass a user ID?', a: 'Callers pass a user ID (or an audience ID resolved by an upstream system). The platform looks up channel addresses (device tokens, phone, email) itself, so callers never handle contact details.' },
        { q: 'Do we need regional or legal rules (quiet hours, consent by country)?', a: 'Yes, in practice. Model them as policy checks in the preference step, driven by user time zone and country, and keep them out of callers\' code.' }
      ]
    },

    estimates: {
      intro: 'Start from 100 million daily active users and an average of 5 notification events each per day, which is **500 million events a day**. A "write" in the calculator is one event accepted. A "read" is one delivery attempt to a provider (channel fan-out plus retries and status callbacks) at about 8 per user per day.',
      inputs: { dau: 100e6, writesPerUser: 5, readsPerUser: 8, peakFactor: 10, bytesPerWrite: 1500, bytesPerRead: 1000, years: 0.25, replication: 3, hotFraction: 0.1, serverQps: 500, utilization: 0.5 },
      assumptions: ['**1.5 KB per stored event** covers the request, rendered payload, per-channel status rows and timestamps. Approximate.', '**Retention of 90 days (0.25 years)** for status and audit; older data is aggregated or archived.', '**Peak factor of 10** because notifications are bursty: a campaign, an outage alert or a live event can send millions in minutes.', '**500 requests a second per worker**, low because each one calls an external provider over the network and waits. A stated guess; measure it.', 'Cache share of **10%** approximates hot templates, preferences and device tokens held in memory.'],
      extra: [
        { label: 'Deliveries per day', formula: '500M events x ~1.6 deliveries', result: '~800 million' },
        { label: 'Push (about 80%)', formula: '800M x 0.80', result: '~640 million/day' },
        { label: 'Email (about 17%)', formula: '800M x 0.17', result: '~136 million/day' },
        { label: 'SMS (about 3%)', formula: '800M x 0.03', result: '~24 million/day' },
        { label: 'SMS cost at an assumed ~1 cent each', formula: '24M x $0.01', result: '~$240,000/day (approximate; rates vary by country)' },
        { label: 'One marketing blast', formula: '50M users in 10 minutes = 50M / 600 s', result: '~83,000 sends/s on top of normal load' }
      ],
      notes: [
        'Average load is modest (about 5,800 events and 9,300 deliveries a second). **The design problem is bursts and isolation**, not average throughput: the 10x peak is about 58,000 events and 93,000 deliveries a second.',
        'About 600 workers at peak (150,000 delivery QPS at 500 each and 50% utilization) is mostly **waiting on providers**. This is an I/O-bound fan-out, so concurrency and queue design matter more than CPU.',
        'SMS is about 3% of volume and probably the **largest share of cost**. That is why preferences, caps and channel fallback rules matter.',
        'Data is small (about 70 TB for 90 days, 200 TB replicated). The store is a log of statuses, not a hard capacity problem.'
      ]
    },
    api: [
      { method: 'POST', path: '/v1/notifications', desc: 'Submit a notification for one user. Internal services only.',
        request: '{\n  "userId": "u_123",\n  "category": "order_shipped",\n  "priority": "normal",\n  "template": "order_shipped_v3",\n  "data": { "orderId": "o_889", "eta": "Oct 5" },\n  "channels": ["push", "email"],\n  "sendAt": "2026-10-02T14:00:00Z",\n  "dedupeKey": "order_shipped:o_889"\n}',
        response: '{ "notificationId": "n_7f3a", "status": "accepted" }',
        notes: ['Return **202 Accepted** as soon as the request is durably stored and queued. Delivery happens afterwards.', '`dedupeKey` (or an `Idempotency-Key` header) makes retries by the caller safe: a second request with the same key within a window returns the original `notificationId`.', '`channels` is optional; if omitted, the platform picks from the category\'s defaults and the user\'s preferences. `sendAt` is optional for scheduling.'] },
      { method: 'POST', path: '/v1/notifications/batch', desc: 'Send one template to an audience (a list or a saved segment).',
        request: '{ "audienceId": "seg_44", "category": "promo", "priority": "low", "template": "autumn_sale", "campaignId": "camp_9" }',
        response: '{ "campaignId": "camp_9", "status": "expanding" }',
        notes: ['The audience is expanded by workers into individual notifications in chunks, so one request never creates millions of rows synchronously.', 'Batch traffic is always **low priority** and rate limited so it cannot starve transactional sends.'] },
      { method: 'GET', path: '/v1/notifications/{id}', desc: 'Status of a notification and each of its channel deliveries.', response: '{\n  "notificationId": "n_7f3a",\n  "deliveries": [ { "channel": "push", "status": "delivered" }, { "channel": "email", "status": "sent" } ]\n}', notes: ['Status is eventually consistent: provider callbacks arrive seconds to hours later.'] },
      { method: 'PUT', path: '/v1/users/{id}/preferences', desc: 'Update a user\'s channel and category preferences.', request: '{\n  "channels": { "push": true, "sms": false, "email": true },\n  "categories": { "promo": false, "order_updates": true },\n  "quietHours": { "start": "22:00", "end": "07:00", "tz": "Europe/Berlin" }\n}', notes: ['Takes effect for notifications **not yet sent**, including those waiting in queues, because preferences are checked right before sending, not only at intake.'] },
      { method: 'POST', path: '/v1/providers/{name}/callbacks', desc: 'Webhook endpoint for provider delivery receipts, bounces and unsubscribes.', notes: ['Verify the provider\'s signature. Callbacks can be duplicated and arrive out of order, so updates must be idempotent and only move a status forward.', 'A hard bounce or a spam complaint adds the address to the **suppression list**.'] },
      { method: 'GET', path: '/u/{token}', desc: 'One-click unsubscribe link placed in every email.', notes: ['A signed token identifies the user and category without a login. Process it immediately and idempotently; it is also a legal requirement in many places.'] }
    ],
    apiNotes: ['Authenticate callers (service identity) and give each its own **quota**, so one team\'s bug cannot flood users.', 'Accept a **priority** and a **category** on every request. They drive routing, preferences, rate limits and compliance.', 'Never accept raw phone numbers, emails or device tokens from callers for normal sends: resolve them from the user profile so opt-outs and suppression always apply.'],

    data: {
      intro: 'Three kinds of data with different access patterns: **configuration** (templates, preferences, device tokens: small, read on every send, cache it), the **notification log** (high-volume append with status updates, read by ID), and **counters and dedupe keys** (tiny, hot, expiring: in memory).',
      entities: [
        { name: 'notification', purpose: 'One accepted request. Immutable except for status.', fields: [
          ['notification_id', 'uuid or time-ordered ID, primary key', ''],
          ['user_id', 'bigint', 'Recipient. Index for "recent notifications for a user".'],
          ['category, priority', 'string, enum', 'Drive routing and policy.'],
          ['template_id, data', 'string, json', 'Rendered at send time so a template fix applies to queued messages.'],
          ['dedupe_key', 'string, unique with expiry', 'Prevents double-accept.'],
          ['send_at, created_at', 'timestamp', 'Scheduling and audit.']
        ] },
        { name: 'delivery', purpose: 'One row per channel attempt chain for a notification. Status moves forward only.', fields: [
          ['notification_id, channel', 'composite key', ''],
          ['status', 'enum', 'queued, sent, delivered, opened, failed, suppressed.'],
          ['provider, provider_msg_id', 'string', 'Correlates provider callbacks with our row.'],
          ['attempts, last_error', 'int, string', 'Retry bookkeeping.']
        ] },
        { name: 'preference', purpose: 'What the user allows. Read before every send.', fields: [
          ['user_id', 'bigint, primary key', ''], ['channels, categories', 'json', 'Booleans per channel and category.'], ['quiet_hours, tz, locale', 'json, string', 'Used by scheduling and templates.']
        ] },
        { name: 'contact_point', purpose: 'Where to reach the user on each channel.', fields: [
          ['user_id', 'bigint', ''], ['channel', 'enum', 'push, sms, email.'], ['address', 'string', 'Device token, phone number or email.'], ['status', 'enum', 'active, bounced, unsubscribed, invalid. Providers report dead tokens.']
        ] },
        { name: 'template', purpose: 'Versioned message bodies per channel and locale.', fields: [
          ['template_id, version', 'composite', 'Versions are immutable.'], ['channel, locale', 'string', ''], ['body', 'text with placeholders', 'Rendered with `data`; escaped by channel.']
        ] }
      ],
      storage: [
        { title: 'Notification log: wide-column or sharded SQL', verdict: 'Write-heavy log',
          body: 'About 500 million rows a day is an append-heavy workload with lookups by ID and by `(user_id, time)`. A wide-column store (partition key `user_id`, clustering by time) or sharded SQL both work, with a 90-day TTL or time-partitioned tables so expiry is a cheap drop of old partitions.\n\n```\nCREATE TABLE notification (\n  user_id         BIGINT,\n  notification_id UUID,\n  category        TEXT,\n  priority        TEXT,\n  created_at      TIMESTAMP,\n  PRIMARY KEY (user_id, notification_id)\n);\n```\n\nStatus updates from callbacks are in-place updates to the delivery row, which is safe because they only move forward.' },
        { title: 'Preferences and templates: a database with a cache', verdict: 'Read-mostly',
          body: 'Preferences and templates are small and read on every send but change rarely. Keep them in a normal database and in a cache in front of the workers, with short TTLs or explicit invalidation when a user saves a preference. **Stale preferences are a compliance risk**, so favor quick invalidation over long TTLs for opt-outs.' },
        { title: 'Dedupe keys and rate-limit counters: in-memory store', verdict: 'Redis-style',
          body: 'A dedupe check is "set this key only if absent, expiring in 24 hours", and a rate limit is "increment this counter, expiring at the end of the window". Both are atomic single-key operations that an in-memory store does at hundreds of thousands per second. They are safe to lose in a failure (worst case a few duplicate-protection windows reset), which is acceptable if provider-side idempotency is also used.' }
      ],
      decisions: [
        { title: 'Queue layout', question: 'Marketing blasts and password-reset codes share the system. How do you stop one from delaying the other?',
          options: [
            { name: 'One shared queue', pros: 'Simplest to run.', cons: 'A 50-million-message blast sits ahead of a time-critical code. Head-of-line blocking is the classic failure.' },
            { name: 'Separate queues per priority, with workers weighted toward high priority', pros: 'High priority is processed first and never waits behind bulk. Bulk drains with leftover capacity.', cons: 'More queues and routing logic. Needs a rule against starving the lowest priority forever.' },
            { name: 'Queue per channel and priority (for example push-high, email-low)', pros: 'Also isolates providers: a slow email provider backs up only the email queues. Workers scale per channel.', cons: 'Most moving parts. Needs good queue-depth and lag monitoring per queue.' }
          ],
          pick: '**Queue per channel and priority.** Isolation by priority protects critical messages from bulk, and isolation by channel protects push from a slow or failing SMS or email provider. Run dedicated worker pools per queue and cap the low-priority pool\'s concurrency.' },
        { title: 'Avoiding duplicates', question: 'Retries, replays and at-least-once queues mean the same message can be processed twice. Where do you dedupe?',
          options: [
            { name: 'Only at intake (caller dedupe key)', pros: 'Cheap and catches caller retries.', cons: 'Does nothing for a worker that crashes after sending but before recording success.' },
            { name: 'At send time with an atomic claim per (notification, channel)', pros: 'A worker "claims" the delivery before calling the provider, so a replayed message sees the claim and skips.', cons: 'If a worker dies after claiming and before sending, the message is stuck until the claim expires, so you need a timeout and a retry.' },
            { name: 'Provider-side idempotency key', pros: 'The provider itself ignores a repeated request with the same key (where supported).', cons: 'Not every provider supports it, and windows are limited.' }
          ],
          pick: '**Use all three where possible.** Dedupe key at intake, an atomic claim per delivery with a lease that expires, and the provider\'s idempotency key when offered. State the residual risk: when a provider call times out, the outcome is unknown, so choosing to retry means an occasional duplicate, and choosing not to means an occasional loss. Critical messages retry; promotional ones may be dropped.' }
      ]
    },
    design: {
      intro: 'Treat a notification as a **job that moves through stages**, each separated by a durable queue: accept and store it, apply policy (preferences, limits, templates), route it to a per-channel, per-priority queue, send through a provider, then record the outcome. Queues give isolation, retries and backpressure. **Click any box** for the reasoning, or pick a scenario to trace.',
      diagram: {
        title: 'Notification system high-level design',
        nodes: [
          { id: 'callers', label: 'Calling services', kind: 'client',
            detail: { why: 'Internal services (orders, security, growth) call the platform with a user ID, a category and a template. They should never call a push, SMS or email provider directly.', tradeoffs: ['Centralizing sending gives one place for preferences, limits and audit, at the cost of a shared platform every team depends on.', 'Callers retry on timeouts, so intake must be idempotent.'], scale: 'One buggy caller in a loop can send millions of requests; per-caller quotas are the defense.' } },
          { id: 'api', label: 'Notification API', kind: 'service',
            detail: { why: 'Authenticates the caller, validates the request, checks the dedupe key, stores the notification durably and enqueues it, then returns 202. It does no sending and no slow work.', tradeoffs: ['Doing the minimum keeps intake fast and highly available: accept first, process later.', 'It must write the record and enqueue atomically (or use an outbox) or a crash can leave an accepted notification that is never sent.'], scale: 'Up to about 58,000 events a second at 10x peak. It is stateless, so add instances.' } },
          { id: 'dedupe', label: 'Dedupe cache', kind: 'cache',
            detail: { why: 'Atomic "set if absent, expire in 24 hours" on the caller\'s dedupe key. A repeated request returns the original notification instead of creating a new one.', tradeoffs: ['An in-memory store is fast but can lose keys on failure, so keep a unique constraint on the dedupe key in the log store as a backstop.', 'Window length is a trade: long windows catch late retries but block legitimate repeats of the same event.'], alternatives: ['A unique index in the log database only (slower, simpler)'], scale: 'Memory for 24 hours of keys, about 500 million entries at 100 bytes each, 50 GB.' } },
          { id: 'logdb', label: 'Notification log', kind: 'db',
            detail: { why: 'The durable record of every accepted request, written before the 202. It is the source of truth for replays and audits.', tradeoffs: ['Partition by user for "what did we send this user"; time-partition for cheap 90-day expiry.', 'Write volume is high but simple appends.'], alternatives: ['Cassandra or DynamoDB', 'Sharded PostgreSQL with time partitions'], scale: 'About 750 GB a day; expire by dropping old partitions.' } },
          { id: 'intake', label: 'Intake queue', kind: 'queue',
            detail: { why: 'Decouples fast acceptance from slower policy work, and absorbs bursts: a 10x spike becomes queue depth rather than API failures.', tradeoffs: ['At-least-once delivery, so every later stage must tolerate seeing a message twice.', 'Partition by user ID so one user\'s notifications are processed in order and rate limits are consistent.'], alternatives: ['Kafka', 'A managed queue service'], scale: 'Consumer lag. Alert on how old the oldest message is, not on queue depth alone.' } },
          { id: 'sched', label: 'Scheduler', kind: 'service',
            detail: { why: 'Holds notifications with a future `sendAt` (and those delayed by quiet hours or digest windows) and releases them to the policy stage when due.', tradeoffs: ['A time-indexed store scanned every few seconds is simple; very large backlogs need sharded timers.', 'Delayed sends must re-check preferences when released, because the user may have opted out meanwhile.'], alternatives: ['Delayed-message feature of a queue', 'A timer wheel in each worker'], scale: 'Mass release at common times (9 a.m. in a time zone) is itself a burst; spread it with jitter.' } },
          { id: 'policy', label: 'Policy and render workers', kind: 'service',
            detail: { why: 'For each message: load the user\'s preferences and contact points, drop opted-out categories and channels, apply quiet hours, check rate limits, choose channels, render the localized template, and route to a channel queue.', tradeoffs: ['Checking preferences **here and again just before sending** catches opt-outs that happen while a message waits.', 'Rendering late means a template fix applies to queued messages, but costs CPU in the hot path.'], scale: 'Preference and template lookups per message: serve them from a cache with fast invalidation.' } },
          { id: 'prefs', label: 'Preferences and templates', kind: 'db',
            detail: { why: 'The user\'s channel and category settings, contact points (device tokens, phone, email, suppression status) and versioned templates. Small, read on every send, rarely written.', tradeoffs: ['A cache with explicit invalidation on write; long TTLs on opt-outs are a compliance risk.', 'Dead tokens and bounced addresses reported by providers must be written back so they are not retried forever.'], alternatives: ['Relational database plus Redis cache', 'A key-value store keyed by user'], scale: 'Read rate equal to the policy stage rate; the cache absorbs it.' } },
          { id: 'limits', label: 'Rate limits and claims', kind: 'cache',
            detail: { why: 'Per-user counters ("at most 3 marketing pushes a day", "5 SMS an hour") and per-delivery claims ("this worker is sending delivery X"). Both are atomic single-key operations with expiry.', tradeoffs: ['A token bucket or sliding window per (user, category) is cheap in memory.', 'Claims need a lease that expires so a crashed worker does not block a delivery forever.', 'Losing this store briefly means limits and claims reset, which risks a few extras; critical categories are exempt from limits.'], alternatives: ['Counters in the log database (slower)'], scale: 'Hundreds of thousands of atomic operations a second at peak.' } },
          { id: 'chanq', label: 'Channel queues by priority', kind: 'queue',
            detail: { why: 'A separate queue for each channel and priority (push-high, push-low, sms-high, email-low, and so on). A flood in one cannot delay the others.', tradeoffs: ['Isolation costs more queues and workers to monitor.', 'Lowest priority needs a guaranteed minimum share or it can starve in a prolonged high-priority surge.'], alternatives: ['A single queue with priority fields (head-of-line blocking is hard to avoid)'], scale: 'Depth and age of each queue; the email-low queue may hold hours of backlog during a campaign, and that is fine.' } },
          { id: 'senders', label: 'Channel sender workers', kind: 'service',
            detail: { why: 'Take a message, claim the delivery, re-check opt-out, call the provider with an idempotency key, record the result, and on a retryable error schedule a retry. One pool per channel, sized to the provider\'s limits.', tradeoffs: ['Concurrency per provider must respect its rate limits and our contract; otherwise throttle responses force retries.', 'A timeout leaves the outcome unknown: retrying risks a duplicate, not retrying risks a loss.'], scale: 'Provider latency: with calls taking 100 ms, 50,000 sends a second needs about 5,000 concurrent in-flight requests.' } },
          { id: 'retry', label: 'Retry and dead-letter queues', kind: 'queue',
            detail: { why: 'Failed sends wait here with exponential backoff and jitter, then return to the channel queue. After a maximum number of attempts or a permanent error they land in a dead-letter queue for inspection.', tradeoffs: ['Retry only retryable errors (timeouts, 429, 5xx). A permanent error (invalid token, bounced address) must not be retried.', 'A cap on attempts and message age: an OTP code is useless after a few minutes.', 'Without backoff, retries amplify an outage into a retry storm.'], scale: 'During a provider outage this queue grows fast; circuit breakers stop sending to a failing provider.' } },
          { id: 'push', label: 'Push provider (APNs / FCM)', kind: 'external',
            detail: { why: 'The platform push services reach iOS and Android devices. They return per-token errors such as "token no longer valid".', tradeoffs: ['No guarantee on delivery time or order; treat a success as "accepted for delivery".', 'Remove invalid tokens when told, to keep the device list clean.'], scale: 'Provider rate limits and connection counts; use persistent multiplexed connections.' } },
          { id: 'sms', label: 'SMS provider', kind: 'external',
            detail: { why: 'A messaging aggregator that reaches carriers. The most expensive and least reliable channel, and the most regulated (consent, sender registration, time-of-day rules).', tradeoffs: ['Keep a **second provider** and fail over on error or latency; routes differ by country.', 'Cost makes it the channel to protect with caps and a fall-back-to-push-first rule.'], alternatives: ['Multiple aggregators with per-country routing'], scale: 'Throughput caps per sender number and per country.' } },
          { id: 'mail', label: 'Email provider', kind: 'external',
            detail: { why: 'Email infrastructure (SMTP or API) with reputation management. Reports bounces, complaints and opens.', tradeoffs: ['Sender reputation is fragile: too many bounces or complaints get you throttled or blocked, so promptly suppress bounced addresses.', 'Separate sending domains or IPs for transactional and marketing mail so a bad campaign cannot hurt password resets.'], scale: 'Warm up new sending IPs gradually; provider throttling by receiving domain.' } },
          { id: 'cb', label: 'Callback handler', kind: 'service',
            detail: { why: 'Receives delivery receipts, bounces, complaints, unsubscribes and opens from providers via webhooks, verifies signatures and updates delivery status.', tradeoffs: ['Callbacks are duplicated and out of order: accept them idempotently and only move status forward (sent to delivered to opened).', 'Webhooks can arrive in huge bursts after a provider recovers; put them on a queue.'], scale: 'Callback volume is at least equal to deliveries; scale it like the senders.' } },
          { id: 'status', label: 'Status and analytics store', kind: 'db',
            detail: { why: 'Per-delivery status for the status API, plus aggregates (sent, delivered, opened, failed by category and provider) for dashboards and alerting.', tradeoffs: ['Eventually consistent with the log: acceptable.', 'Detailed rows expire after 90 days; aggregates are kept longer.'], alternatives: ['A column store for analytics', 'Time-series store for rates'], scale: 'Callback write volume; aggregate on the way in.' } }
        ],
        edges: [
          { from: 'callers', to: 'api', label: 'request' },
          { from: 'api', to: 'dedupe', label: 'dedupe' },
          { from: 'api', to: 'logdb', label: 'store' },
          { from: 'api', to: 'intake', label: 'enqueue', style: 'async' },
          { from: 'api', to: 'sched', label: 'sendAt' },
          { from: 'intake', to: 'policy', style: 'async' },
          { from: 'sched', to: 'policy', label: 'when due' },
          { from: 'policy', to: 'prefs', label: 'prefs' },
          { from: 'policy', to: 'limits', label: 'limits' },
          { from: 'policy', to: 'chanq', label: 'route', style: 'async' },
          { from: 'chanq', to: 'senders', style: 'async' },
          { from: 'senders', to: 'limits', label: 'claim' },
          { from: 'senders', to: 'push' },
          { from: 'senders', to: 'sms' },
          { from: 'senders', to: 'mail' },
          { from: 'senders', to: 'retry', label: 'failure', style: 'async' },
          { from: 'push', to: 'cb', label: 'receipt', style: 'async' },
          { from: 'sms', to: 'cb', style: 'async' },
          { from: 'mail', to: 'cb', style: 'async' },
          { from: 'cb', to: 'status' },
          { from: 'senders', to: 'status', label: 'sent' }
        ],
        scenarios: [
          { id: 'normal', label: 'Normal push notification', steps: [
            { title: 'Request arrives', path: ['callers', 'api'], note: 'The orders service submits "order shipped" for a user with a dedupe key.' },
            { title: 'Dedupe and store', path: ['api', 'dedupe', 'logdb'], tone: 'accent', note: 'The key is claimed atomically (first time, so proceed) and the notification is written durably. This is the point of no loss.' },
            { title: 'Accept and enqueue', path: ['api', 'intake'], note: 'The request is queued and the caller gets 202 Accepted.' },
            { title: 'Apply policy', path: ['intake', 'policy', 'prefs'], note: 'A worker loads the user\'s preferences and device tokens, confirms the category is allowed and it is not quiet hours, and renders the localized template.' },
            { title: 'Check rate limits', path: ['policy', 'limits'], note: 'The per-user counter for this category is incremented; under the cap, so continue. A transactional message would skip this step.' },
            { title: 'Route to a queue', path: ['policy', 'chanq'], note: 'The push delivery goes to the normal-priority push queue.' },
            { title: 'Claim and send', path: ['chanq', 'senders', 'limits'], note: 'A sender claims the delivery (so a replay would skip it), re-checks opt-out, and calls the provider with an idempotency key.' },
            { title: 'Provider accepts', path: ['senders', 'push'], tone: 'ok', note: 'The push service accepts the message. Status becomes "sent". Later a receipt callback moves it to "delivered".' }
          ] },
          { id: 'failure', label: 'Provider failure and retry', steps: [
            { title: 'Send an SMS code', path: ['chanq', 'senders', 'sms'], note: 'A high-priority SMS (login code) is sent to the primary SMS provider.' },
            { title: 'Provider errors', path: ['sms', 'cb'], tone: 'hard', note: 'The call times out or returns a 5xx. The outcome is unknown, which is the hard part: it may or may not have been sent. A callback might still arrive.' },
            { title: 'Back off and retry', path: ['senders', 'retry'], tone: 'accent', note: 'The failure goes to the retry queue with exponential backoff and jitter, capped by the code\'s short lifetime. The idempotency key limits the chance of a duplicate send.' },
            { title: 'Circuit breaker opens', path: ['senders', 'sms'], tone: 'hard', note: 'After repeated failures the breaker stops sending to this provider and traffic switches to the second SMS provider rather than piling into retries.' },
            { title: 'Fall back to another channel', path: ['senders', 'mail'], tone: 'ok', note: 'For a critical message with no live SMS route, send by push or email as the policy allows, and record each attempt.' },
            { title: 'Record outcome', path: ['senders', 'status'], note: 'Final status, attempts and provider are stored. A message that exhausts attempts goes to the dead-letter queue and raises an alert.' }
          ] },
          { id: 'blast', label: 'Scheduled marketing blast', steps: [
            { title: 'Campaign submitted', path: ['callers', 'api', 'sched'], note: 'A campaign for 50 million users is submitted with a send time of 9 a.m. The scheduler holds it.' },
            { title: 'Released when due', path: ['sched', 'policy'], tone: 'accent', note: 'At the send time workers expand the audience in chunks and release notifications gradually, with per-time-zone jitter, so there is no single spike.' },
            { title: 'Per-user limits and preferences', path: ['policy', 'limits'], note: 'Users who opted out of promotions, are in quiet hours, or already received their daily cap are dropped here. The audience shrinks, often substantially.' },
            { title: 'Low-priority queue', path: ['policy', 'chanq', 'senders'], tone: 'ok', note: 'Surviving sends go into low-priority queues with a concurrency cap. A reset code arriving now uses a different queue and does not wait behind them.' },
            { title: 'Drain with spare capacity', path: ['senders', 'mail'], note: 'Email sends drain at the rate the provider and our reputation allow, possibly over hours. Delays are acceptable for marketing.' }
          ] },
          { id: 'dup', label: 'Duplicate request from a caller', steps: [
            { title: 'Caller times out and retries', path: ['callers', 'api'], note: 'The first response was lost, so the caller sends the same request with the same dedupe key.' },
            { title: 'Dedupe catches it', path: ['api', 'dedupe'], tone: 'ok', note: 'The key already exists. The API returns the original notification ID with 202 and creates nothing new, so the user gets one message.' }
          ] }
        ]
      },
      walkthrough: [
        '**Accept**: authenticate, check the dedupe key, write the notification durably, enqueue it, and return 202. Nothing slow happens in the request.',
        '**Policy**: a worker applies opt-outs, quiet hours, rate limits and channel selection, renders the template, and routes each channel delivery to its own priority queue.',
        '**Send**: a channel worker claims the delivery, re-checks preferences, and calls the provider with an idempotency key. Retryable failures go to a backoff queue; permanent ones are recorded and the address is suppressed.',
        '**Learn**: provider webhooks update delivery status idempotently; bounces and complaints suppress addresses; aggregates feed dashboards and alerts.',
        '**Failure modes**: a slow provider backs up only its own queue; a circuit breaker and a second provider limit the impact; the log store lets you replay anything the queues lost.'
      ],
      notes: ['Retries return to the channel queue through the retry queue; the diagram draws only the outbound edge to keep the graph acyclic.']
    },
    deepDives: [
      { id: 'intake', title: 'Event intake, templating and localization',
        question: 'How do callers submit notifications, and how do you render the right message for each user?',
        answer: 'Callers send an **event or request** with a user ID, a category and template data, never the final text. The platform renders it, so wording, localization and legal footers live in one place.\n\nTemplates are **versioned and immutable**, stored per channel and locale (push is short, email has HTML and plain text, SMS is limited to a few hundred characters). Rendering picks the user\'s locale with a fallback chain (user locale, language, default), fills placeholders with escaping appropriate to the channel, and fails loudly on a missing variable rather than sending "Hello {name}".\n\nRender **late**, at policy time, so a corrected template applies to messages still queued. Store the template ID and version used for each delivery for audit. Validate `data` against a schema when the template is registered so callers get errors at intake, not in a worker at 3 a.m.',
        followups: [
          { q: 'How do you handle a failed render?', a: 'Treat it as a permanent failure: do not retry, record the reason, put it in the dead-letter queue and alert the owning team. Retrying never fixes a missing variable.' },
          { q: 'Why not let callers send the final text?', a: 'You lose central control of wording, localization and compliance text, and every team re-implements opt-out footers. Offer a raw escape hatch only for tightly controlled uses.' },
          { q: 'How do you test a template change?', a: 'Render with sample data per locale in a preview endpoint, roll out the new version to a small percentage, and keep the old version available for instant rollback.' }
        ] },
      { id: 'preferences', title: 'Preferences, opt-outs and compliance',
        question: 'How do you make sure you never send something a user opted out of?',
        answer: 'Model preferences as **channel x category** switches plus quiet hours, a global opt-out, and a **suppression list** for addresses that bounced, complained or unsubscribed. Check them **twice**: at the policy stage, and again right before the provider call, because a message may wait in a queue for minutes or hours and the user can opt out in between.\n\nCategories matter: transactional and security messages (a login code) are not subject to marketing opt-outs, though users can still choose a channel. Marketing always honors opt-out, and every marketing email carries a one-click unsubscribe processed immediately and idempotently.\n\nUse a cache with **explicit invalidation** on preference writes. A long TTL on an opt-out is a compliance bug. Keep an audit trail of consent changes with timestamps and source.',
        followups: [
          { q: 'Where do quiet hours get applied?', a: 'In policy, using the user\'s time zone. Non-urgent messages are delayed to the end of the window by the scheduler (and re-checked on release); urgent categories bypass quiet hours.' },
          { q: 'What if the preference store is down?', a: 'Fail closed for marketing (do not send) and fail open for critical security messages, which is a deliberate choice you state explicitly.' },
          { q: 'How do you handle legal requirements by country?', a: 'Encode them as policy rules keyed by category and country (consent required, allowed sending hours, mandatory unsubscribe), kept in the policy stage so callers cannot bypass them.' }
        ] },
      { id: 'ratelimit', title: 'Rate limiting and per-user caps',
        question: 'How do you prevent a user from being spammed even when many services notify them?',
        answer: 'Apply limits at **two levels**. Per caller, a quota at the API so one buggy service cannot flood the platform. Per user, caps by category and channel at the policy stage (for example 3 marketing pushes a day, 5 SMS an hour), counted in an in-memory store with atomic increments and expiry.\n\nA token bucket gives a smooth rate with a small burst allowance:\n\n```js\nfunction allow(bucket, now, rate, burst) {\n  // refill since the last check, up to the burst size\n  bucket.tokens = Math.min(burst, bucket.tokens + (now - bucket.t) * rate);\n  bucket.t = now;\n  if (bucket.tokens >= 1) { bucket.tokens -= 1; return true; }\n  return false;\n}\n```\n\nIn production the same logic runs atomically in the store (a script or compare-and-set) so concurrent workers cannot both take the last token. **Transactional and security categories are exempt**; marketing is not. When a message is over the limit, **drop, delay or collapse it** (merge several into a digest) according to the category, and record the suppression so analytics show it.',
        followups: [
          { q: 'Why count in memory and not in the main database?', a: 'The check runs for every message at up to tens of thousands a second. Atomic increments with expiry are what in-memory stores do best. Losing a counter occasionally means a few extra sends, which is tolerable for non-critical categories.' },
          { q: 'Per-user rate limits across channels?', a: 'Keep a per-user budget across channels (so a user does not get push, email and SMS for the same thing), plus per-channel limits. Prefer the cheapest suitable channel and use the next only if unacknowledged.' },
          { q: 'How do you protect providers from your own burst?', a: 'A separate outbound limiter per provider and per sender worker pool, tuned to the provider\'s published limits. Exceeding them causes throttle errors and retries, which make the burst worse.' }
        ] },
      { id: 'priority', title: 'Priority queues and isolation',
        question: 'A marketing blast and a password-reset code arrive together. How do you keep the code fast?',
        answer: 'Give each combination of **channel and priority** its own queue and its own worker pool: sms-high, push-high, email-low, and so on. High-priority workers are sized for latency and never share capacity with bulk. Low-priority pools have a concurrency cap so a blast cannot exhaust provider limits or connection pools. If capacity is shared, use **weighted** fair scheduling (for example 90% high and 10% low) so that low priority never fully starves.\n\nIsolation by channel also contains a provider failure: when the email provider slows down, only the email queues back up, and push is unaffected.\n\nOperate by **age of the oldest message** per queue, with an alert threshold per priority (seconds for high, an hour for low), not by queue depth. Depth is meaningless without the drain rate.',
        followups: [
          { q: 'Why not a single priority queue?', a: 'Many queue systems cannot do true priority at this scale, and a single consumer pool is exposed to head-of-line blocking and to one slow provider holding all workers.' },
          { q: 'How do you avoid starving low-priority messages?', a: 'Reserve a minimum share, or age messages up (raise priority after a long wait). Marketing delays are fine, but "never" is not.' },
          { q: 'What gets the highest priority?', a: 'One-time passcodes, security alerts and payment confirmations. Define the tiers with product owners, and enforce them at the API: only certain callers may use the high tier.' }
        ] },
      { id: 'retries', title: 'Retries and idempotency',
        question: 'A provider times out. Do you retry, and how do you avoid sending twice?',
        answer: 'Classify the error. **Permanent** (invalid token, bounced address, rejected content): never retry, record it and suppress the address. **Retryable** (timeout, 429, 5xx): retry with **exponential backoff and jitter**, a maximum number of attempts, and a maximum age (an OTP is worthless after five minutes).\n\n```js\nfunction backoff(attempt, base, cap, rnd) {\n  return rnd() * Math.min(cap, base * Math.pow(2, attempt)); // full jitter\n}\n```\n\nJitter spreads retries so they do not arrive as a synchronized wave. For duplicates, combine three layers: the dedupe key at intake, an **atomic claim per delivery** with an expiring lease before calling the provider, and the **provider\'s idempotency key** where supported. A timeout is genuinely ambiguous: the provider may have sent it. For critical messages accept an occasional duplicate over a loss; for promotional ones, prefer a drop.',
        followups: [
          { q: 'What happens to messages that exhaust retries?', a: 'They go to a dead-letter queue with the error, raise an alert, and can be replayed by an operator after the cause is fixed. Never drop them silently.' },
          { q: 'What if a worker dies after calling the provider but before recording success?', a: 'The claim lease expires and the message is retried. The provider idempotency key makes the repeat harmless where supported; otherwise a rare duplicate is the price of not losing messages.' },
          { q: 'How do you prevent a retry storm?', a: 'Backoff with jitter, a retry budget (a cap on the fraction of traffic that is retries), and a circuit breaker that stops calling a failing provider altogether.' }
        ] },
      { id: 'providers', title: 'Third-party providers and failure handling',
        question: 'Your SMS provider has an outage. What does the system do?',
        answer: 'Assume providers fail and design for it. Wrap each provider call with a **timeout** and a **circuit breaker**: after N failures in a window the breaker opens, calls stop for a cooldown, and a few trial calls test recovery. Keep **two providers per channel** where it matters (SMS especially) and fail over on error rate or latency, with per-country routing because quality differs by region.\n\nFor critical messages define **fallback channels** (push first, then SMS, then email) rather than one channel only. Queue the rest and let them drain after recovery; because sends are isolated by channel, nothing else is slowed.\n\nProcess feedback from providers: bounces, invalid tokens and complaints must update contact points and the suppression list quickly. Sending repeatedly to dead addresses damages email reputation and wastes SMS money.',
        followups: [
          { q: 'How do you know a provider is degraded before it fully fails?', a: 'Track success rate and p99 latency per provider and per country, alert on sudden changes, and compare delivery receipts rate. Shift traffic gradually.' },
          { q: 'How do you avoid vendor lock-in?', a: 'Put each provider behind a small internal interface (send, parse receipt), keep templates and preferences in your own store, and use provider message IDs only for correlation.' },
          { q: 'What about email reputation?', a: 'Separate transactional and marketing sending identities, suppress bounces and complainers immediately, warm up new IPs gradually, and authenticate with SPF, DKIM and DMARC.' }
        ] },
      { id: 'scheduling', title: 'Scheduling, batching and digests',
        question: 'How do you support "send tomorrow at 9", quiet hours and a daily digest instead of ten separate pings?',
        answer: 'Put a **scheduler** between acceptance and policy. Notifications with a future time sit in a time-indexed store keyed by due time; workers scan for due items every few seconds and release them, with jitter to avoid a spike at the exact minute. On release, run the policy stage again because preferences may have changed.\n\nFor **digests**, collect eligible notifications per user and category into a buffer (a list keyed by user and window). When the window closes (or the count passes a threshold), render one combined message. This reduces volume, cost and annoyance, and it fits naturally with per-user rate limits ("over cap, so add to the digest").\n\nFor time zones, schedule by the user\'s local time stored in their profile, and spread the global campaign across zones so the load is a rolling wave and not one spike.',
        followups: [
          { q: 'How does a campaign to 50 million users work?', a: 'Expand the audience in chunks by workers, apply policy per user, drop the suppressed, and enqueue the rest into low-priority queues at a rate limit. The request itself returns immediately.' },
          { q: 'How do you cancel a scheduled notification?', a: 'Mark it cancelled in the log. The scheduler and the sender both check status before sending, so a cancel is effective until the instant of the provider call.' }
        ] },
      { id: 'analytics', title: 'Status tracking and analytics',
        question: 'How do you know what happened to a notification, and how do you measure the system?',
        answer: 'Record a **status per delivery** that only moves forward: queued, sent, delivered, opened or failed (and suppressed with a reason). Provider callbacks update it asynchronously, so handle duplicates and out-of-order arrival by comparing status rank before writing.\n\nFor analytics, stream status events to an aggregation pipeline that rolls up counts by category, channel, provider and minute. Track **delivery rate**, **time to deliver** (accept to delivered, percentiles by priority), **queue age**, **retry rate**, **opt-out rate** after sends, and **cost per channel**. Alert on a drop in delivery rate per provider and on rising queue age for high priority.\n\nBe careful with "opened" (images can be blocked or pre-fetched) and "delivered" (push receipts are best-effort), and describe them as signals, not facts.',
        followups: [
          { q: 'How long do you keep detail?', a: 'Per-delivery rows for about 90 days (a compliance and support window), aggregates much longer. Expire by dropping time partitions.' },
          { q: 'How would you debug "I never got my code"?', a: 'Look up the notification by user and time: see which stages it passed, which channel and provider handled it, the provider message ID and the receipt. This is why every stage writes a reason when it drops or delays a message.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Bursts and head-of-line blocking', problem: 'A campaign or outage alert can add tens of thousands of sends a second, and a shared queue makes critical messages wait behind bulk.', mitigation: 'Queues per channel and priority, separate worker pools with caps on low priority, spreading campaign releases with jitter, and alerting on the age of the oldest message.' },
      { title: 'Provider throughput and latency', problem: 'Workers mostly wait on the provider. With 100 ms calls, 50,000 sends a second needs about 5,000 concurrent requests, and providers have their own rate limits.', mitigation: 'Persistent multiplexed connections, concurrency tuned to provider limits, batch APIs where offered, and outbound rate limiters per provider.' },
      { title: 'Provider outage', problem: 'One provider degrades and retries pile up or messages are lost.', mitigation: 'Timeouts, circuit breakers, a second provider, fallback channels for critical messages, bounded retries, and a dead-letter queue.' },
      { title: 'Duplicate or lost sends', problem: 'At-least-once queues, worker crashes and ambiguous provider timeouts make both duplicates and losses possible.', mitigation: 'Dedupe key at intake, atomic delivery claims with leases, provider idempotency keys, and an explicit policy by category on which risk to accept.' },
      { title: 'Stale preferences', problem: 'A user opts out but a message already in a queue is still sent, which is a compliance problem.', mitigation: 'Re-check preferences immediately before sending, invalidate caches on write, and keep a fast suppression list.' },
      { title: 'Cost of SMS', problem: 'SMS is a small share of volume and a large share of cost, and is abused by fraud (pumping).', mitigation: 'Caps per user and per caller, push first with SMS as fallback, per-country limits, and monitoring for unusual volume to premium routes.' }
    ],

    mistakes: [
      'Sending **synchronously** from the caller\'s request to the provider instead of accepting and queueing.',
      'One **shared queue** for everything, so a campaign delays a login code.',
      'Retrying with **no backoff or jitter**, or retrying permanent errors forever.',
      'Claiming **exactly-once** and not discussing the ambiguous provider timeout.',
      'Checking preferences only at intake and not **before sending**.',
      'Letting callers pass **raw emails and phone numbers**, bypassing opt-outs and suppression.',
      'No **per-user rate limits**, so many services together spam one person.',
      'Ignoring **bounces, invalid tokens and complaints**, which wrecks email reputation and wastes money.',
      'A **single provider** per channel with no failover plan.',
      'Treating the **notification log** as optional, so nothing can be replayed or debugged.',
      'Scheduling a mass send at one instant instead of **spreading it**.'
    ],

    pushes: [
      { q: 'How do you guarantee a user gets exactly one notification?', why: 'Exactly-once is the trap question.', good: 'You do not get it across a third-party boundary. Describe at-least-once with intake dedupe, delivery claims and provider idempotency keys, and the explicit choice by category between a rare duplicate and a rare loss.' },
      { q: 'What happens if the provider times out on an OTP?', why: 'Tests reasoning under ambiguity.', good: 'Retry with the same idempotency key a few times within the code\'s lifetime, fail over to another provider or channel, and accept a rare duplicate over a lost code.' },
      { q: 'How do you stop a campaign from delaying critical alerts?', why: 'Isolation under load.', good: 'Separate queues and worker pools by priority and channel, capped low-priority concurrency, only trusted callers allowed to use high priority, and alerts on queue age.' },
      { q: 'A user unsubscribes while their message is in the queue. What happens?', why: 'Compliance edge case.', good: 'Senders re-check preferences and the suppression list right before calling the provider, and preference writes invalidate the cache.' },
      { q: 'How would you add a new channel such as WhatsApp or in-app?', why: 'Extensibility without over-engineering.', good: 'A new channel is a new queue, a worker pool, a provider adapter with send and parse-receipt, templates per channel and a preference switch. Policy and intake do not change.' },
      { q: 'How do you scale this 10 times?', why: 'Where it breaks.', good: 'Partition queues and log by user, scale stateless API and workers, shard the in-memory limiters, and watch provider limits (the real ceiling) and callback volume. More providers and regions before more code.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why separate queues for each channel and priority?', choices: ['So bulk sends cannot delay critical ones, and a slow provider only affects its own channel', 'Because queues cannot hold more than one message type', 'To avoid needing retries', 'To make rendering templates faster'], answer: 0, explain: 'A shared queue causes head-of-line blocking. Per-channel and per-priority queues isolate load and failures.' },
      { kind: 'concept', q: 'A provider call times out. What is true about the outcome?', choices: ['It is unknown: the message may have been sent, so retries risk a duplicate', 'It definitely failed, so retrying is always safe', 'It definitely succeeded', 'Timeouts cannot happen with HTTPS'], answer: 0, explain: 'Without a response you cannot tell. Idempotency keys reduce duplicate risk, but critical messages may still accept a rare duplicate over a loss.' },
      { kind: 'concept', q: 'Why add random jitter to exponential backoff?', choices: ['So many failed sends do not retry at the same instant and create a wave', 'To make retries slower on average than the cap', 'Because the provider requires random delays', 'To avoid storing attempts'], answer: 0, explain: 'Without jitter, all clients that failed together retry together. Jitter spreads them out.' },
      { kind: 'concept', q: 'Which errors should NOT be retried?', choices: ['Invalid device token or bounced email address', 'Timeout', '429 Too Many Requests', '503 Service Unavailable'], answer: 0, explain: 'Permanent errors never succeed on retry; record them and suppress the address. Timeouts, 429 and 5xx are retryable with backoff.' },
      { kind: 'concept', q: 'Pick the places where opt-outs must be checked.', choices: ['At the policy stage after intake', 'Immediately before calling the provider', 'Only when the caller submits the request', 'Never, if the caller says it is important'], answer: [0, 1], explain: 'A message can wait for a long time in a queue. Checking at both points catches opt-outs made while it waited.' },
      { kind: 'concept', q: 'What should the API return after storing and enqueuing a notification?', choices: ['202 Accepted with a notification ID, before delivery', '200 OK only after the provider confirms delivery', '201 Created after the user opens it', 'Nothing until retries finish'], answer: 0, explain: 'Delivery is asynchronous and depends on providers. Accept first, process later, and expose status through a separate endpoint.' },
      { kind: 'complexity', q: 'Each provider call takes 100 ms. About how many requests must be in flight to send 50,000 per second?', choices: ['About 5,000', 'About 500', 'About 50,000', 'About 50'], answer: 0, explain: 'By Little\'s law, concurrency = rate x latency = 50,000 x 0.1 s = 5,000.' }
    ],

    flashcards: [
      { id: 'pipeline', front: 'Notification pipeline stages?', back: 'Accept and store (202), queue, policy (preferences, limits, render), route to channel and priority queue, send via provider, record status from callbacks.' },
      { id: 'isolation', front: 'How do you keep an OTP fast during a marketing blast?', back: 'Separate queues and worker pools per channel and priority, with capped concurrency on low priority and queue-age alerts.' },
      { id: 'retry', front: 'Retry rules for provider failures?', back: 'Retry only retryable errors (timeout, 429, 5xx) with exponential backoff plus jitter, a max attempts and max age; permanent errors are not retried; exhausted go to a dead-letter queue.' },
      { id: 'dupes', front: 'How do you avoid duplicate notifications?', back: 'Dedupe key at intake, an atomic claim per delivery with an expiring lease, and provider idempotency keys. A timeout stays ambiguous, so choose duplicate versus loss per category.' },
      { id: 'prefs', front: 'When are user preferences checked?', back: 'At the policy stage and again right before sending, with cache invalidation on change, because messages wait in queues.' },
      { id: 'breaker', front: 'What does a circuit breaker do for a provider?', back: 'After repeated failures it stops calls for a cooldown (avoiding retry storms), then probes recovery; traffic fails over to a second provider or fallback channel.' },
      { id: 'littles', front: 'Workers needed to send R per second at latency L?', back: 'In-flight requests = R x L (Little\'s law). Example: 50,000/s x 0.1 s = 5,000 concurrent calls.' }
    ]
  });
})();

