/* System design case study: rate limiter. Same shape as url-shortener.js (schema: data/sd/schema.md).
   Numbers are rounded estimates. The Lua token bucket in the deep dives was run against a mock of the Redis calls. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'rate-limiter',
    title: 'Design a rate limiter',
    short: 'Cap how fast each client can call an API. A compact problem with real depth in algorithms, atomic counters in Redis, and what to do when the limiter itself fails.',
    difficulty: 'Medium',
    time: '45 min',
    tags: ['Algorithms', 'Redis', 'Concurrency', 'Failure modes'],
    prompt: 'Design a rate limiter for a public API. It should reject requests from a client that goes over a configured limit, work across many gateway servers, and add almost no latency to the requests it allows.',

    requirements: {
      functional: [
        'Limit requests per **client key**: user ID, API key, IP address, or an endpoint-specific combination.',
        'Rules are data, for example "100 requests per minute per API key on `POST /orders`", and can be changed **without a deploy**.',
        'Several rules can apply to one request (per second **and** per day); the request must pass all of them.',
        'Reject with **HTTP 429** and tell the client when to retry, using response headers.',
        'Different limits per tier (free, paid, internal) and an allowlist that bypasses limits.'
      ],
      nonFunctional: [
        '**Latency**: the check adds about 1 to 2 ms at p99 on the request path. Anything slower is a tax on every call.',
        '**Availability**: the limiter must not become the reason the API is down. Decide the failure mode on purpose (fail open or fail closed).',
        '**Accuracy**: a small overshoot (a few percent) is fine for abuse protection; hard guarantees cost extra and are a product choice.',
        '**Distributed**: many gateway servers share one view of each client, so a client cannot multiply its limit by hitting different servers.',
        '**Scale**: a few hundred thousand checks a second at peak, with memory proportional to *active* clients only.'
      ],
      outOfScope: ['Network-layer DDoS defense (L3/L4 floods are stopped upstream by the edge or the provider).', 'Billing-grade monthly quotas that must be durable and exact.', 'Bot detection and WAF rules beyond a simple per-IP limit.', 'Authentication itself (assume the gateway already knows who the caller is).'],
      assumptions: ['The limiter runs as a **filter inside the API gateway**, so every request passes it once.', 'Client identity is available: an API key for authenticated calls, the IP address otherwise.', 'A single region first; multi-region is a deep-dive extension.'],
      clarify: [
        { q: 'Is this client-side or server-side limiting, and where does it sit?', a: 'Server-side, at the gateway. Client-side limiting cannot be trusted because clients can ignore it. A client library that backs off on 429 is a courtesy on top.' },
        { q: 'Hard limit or soft limit? Are short bursts allowed?', a: 'Allow bursts up to a cap (a good API tolerates a client that sends ten requests at once and then goes quiet). That choice points toward a token bucket.' },
        { q: 'What should happen when the limiter itself is unavailable?', a: 'Default to **fail open** for general API traffic, because losing the limiter should not take the product down. Login and password-reset endpoints are the usual exception and fail closed. Raise this explicitly; it is the question interviewers most want you to ask.' },
        { q: 'How exact must the count be across servers?', a: 'Approximate is fine for abuse protection (overshoot of a few percent). If the limit protects a paid quota or a fragile downstream, say so and pay for tighter coordination.' },
        { q: 'One region or several?', a: 'Start with one. Per-region limits with a global budget split across regions is the usual extension; exact global limits cost a cross-region round trip per request.' }
      ]
    },

    estimates: {
      intro: 'Every API request triggers one limiter check, and every allowed request updates a counter. Model it as **20 million daily active clients making about 500 API calls each**, so each call is one check ("read") against shared state. A few new counter keys appear per client per day (one per rule), which we model as the "writes".',
      inputs: { dau: 20e6, writesPerUser: 5, readsPerUser: 500, peakFactor: 3, bytesPerWrite: 100, bytesPerRead: 100, years: 1, replication: 2, hotFraction: 0.001, serverQps: 50000, utilization: 0.5 },
      assumptions: [
        '**500 calls per client per day** is a mix of heavy integrations and casual users (approximate).',
        'A counter or bucket is **about 100 bytes** in Redis: a short key, two fields (tokens and timestamp), and per-key overhead (approximate).',
        'Peak is **3 times** average because traffic follows daily cycles and clients retry in bursts.',
        'A Redis shard doing a small Lua script handles roughly **50,000 operations a second**; we plan at 50% utilization, so "app servers" in the table means **Redis shards**.',
        'Read the storage rows with care: limiter keys **expire in seconds to minutes**, so live state is the number of *active* keys times 100 bytes, not years of history.'
      ],
      extra: [
        { label: 'Active keys at once (approx)', formula: '20M clients x ~3 rules x ~10% active in any window', result: '~6 million keys' },
        { label: 'Live state in Redis', formula: '6M keys x 100 B', result: '~600 MB (before replication)' },
        { label: 'Shards for memory', formula: '600 MB across a few shards with headroom', result: '1 to 2 shards' },
        { label: 'Shards for throughput', formula: '~350K peak checks/s / (50K x 0.5)', result: '~15 shards' },
        { label: 'Sliding window log for a 1,000/min rule', formula: '1,000 timestamps x 8 B per client', result: '~8 KB per client (vs ~100 B for a counter)' }
      ],
      notes: [
        'About **115,000 checks a second** on average and roughly **350,000 at peak**. The limiter is a pure throughput problem: the data is tiny, the operations are many.',
        '**Throughput, not memory, decides the shard count.** Live state is well under a gigabyte, but 350K atomic operations a second needs about 15 shards at comfortable utilization.',
        'Ignore the "cache size" and "data over years" rows: counters expire quickly, so the working set is the active-key figure above.',
        'Algorithms that store **one timestamp per request** (sliding window log) multiply memory by the limit size. That is why counter-based approximations win at scale.'
      ]
    },

    api: [
      { method: 'POST', path: '/v1/check', desc: 'Internal call used by the gateway filter (or a sidecar) to ask whether a request may proceed and to consume capacity.',
        request: '{\n  "key": "apikey:k_81f3",\n  "rule": "orders-post",\n  "cost": 1\n}',
        response: '{\n  "allowed": false,\n  "limit": 100,\n  "remaining": 0,\n  "retryAfterMs": 4200,\n  "resetAfterMs": 4200\n}',
        notes: ['In practice this is a **library call plus one Redis round trip**, not a separate network hop. The HTTP form is how you would expose it as a shared service.', '`cost` lets an expensive endpoint (a bulk export) consume several units.', 'Return the **most restrictive** rule when several apply, so the client sees the limit it will actually hit.'] },
      { method: 'GET', path: '/v1/resource (any protected API)', desc: 'What the **client** sees. Allowed calls carry the quota headers; rejected calls get 429.',
        response: 'HTTP/1.1 429 Too Many Requests\nRetry-After: 5\nRateLimit-Limit: 100\nRateLimit-Remaining: 0\nRateLimit-Reset: 5\nContent-Type: application/json\n\n{ "error": "rate_limited", "retryAfterSeconds": 5 }',
        notes: ['Header names vary: many APIs use `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`, and a standardized `RateLimit` family is emerging. State which you use and keep it consistent.', '`Retry-After` is the standard one for 429 and 503. Prefer **seconds-until-reset** over an absolute timestamp, because client clocks drift.', 'Send the headers on **successful** responses too, so well-behaved clients can slow down before they are rejected.'] },
      { method: 'PUT', path: '/v1/rules/{ruleId}', desc: 'Create or replace a rule. Admin only.',
        request: '{\n  "match": { "route": "POST /orders", "keyBy": "apiKey" },\n  "algorithm": "token_bucket",\n  "capacity": 20,\n  "refillPerSecond": 2,\n  "tier": "free",\n  "onLimiterError": "fail_open"\n}',
        response: '{ "ruleId": "orders-post", "version": 7 }',
        notes: ['Rules are **versioned**; gateways poll or subscribe and apply the new version atomically, so a half-updated rule set is never used.', 'Validate before accepting: positive limits, a known algorithm, and a key dimension that exists.'] },
      { method: 'GET', path: '/v1/rules', desc: 'List active rules and their versions. Gateways use this on startup and on a refresh interval.' }
    ],
    apiNotes: ['Never put the limiter **behind** the thing it protects: the check happens first, before auth-heavy or database work, so rejected traffic is cheap.', 'Return a **machine-readable** body on 429 (error code and retry hint) as well as headers.', 'Rate-limit the rules admin API too, and log every rule change with who made it.'],

    data: {
      intro: 'There are two very different kinds of data. **Rules** are small, rarely change, and are read by every gateway (config). **Limiter state** is tiny per key, changes on every request, and must be shared and atomic, so it lives in Redis with a TTL.',
      entities: [
        { name: 'rule (config store)', purpose: 'One row per limit. Cached in every gateway and refreshed by version.', fields: [
          ['rule_id', 'string, primary key', 'For example `orders-post`.'],
          ['match', 'json', 'Route pattern plus the dimension to key by: `apiKey`, `userId`, `ip`, or a combination.'],
          ['algorithm', 'enum', '`token_bucket`, `fixed_window`, `sliding_window_counter`.'],
          ['capacity / limit', 'int', 'Burst size for a bucket, or the count allowed per window.'],
          ['refill_per_sec / window_sec', 'number', 'Refill rate for a bucket, or window length.'],
          ['tier', 'string', 'Free, paid or internal; the same route can have different limits per tier.'],
          ['on_limiter_error', 'enum', '`fail_open` (default) or `fail_closed` for sensitive routes.'],
          ['version', 'int', 'Bumped on every change so gateways can detect updates.']
        ] },
        { name: 'bucket state (Redis hash)', purpose: 'Live state for a token bucket. Key shape: `rl:{rule}:{clientKey}`.', fields: [
          ['tokens', 'float', 'Tokens left at the last update.'],
          ['ts', 'int (ms)', 'Time of the last update, from the **Redis server clock**.'],
          ['TTL', 'ms', 'About twice the time to refill from empty; idle clients disappear on their own.']
        ] },
        { name: 'window counters (Redis)', purpose: 'For window algorithms. Key shape: `rl:{rule}:{clientKey}:{windowStart}`.', fields: [
          ['count', 'int', 'Requests in that window, incremented with INCR.'],
          ['TTL', 'sec', 'Two window lengths, so the previous window is still readable for sliding-window math.']
        ] },
        { name: 'override (config store)', purpose: 'Per-client exceptions: allowlist, a raised limit for a partner, or a manual block.', fields: [
          ['client_key', 'string', ''], ['effect', 'enum', '`allow`, `block`, or `limit=N`.'], ['expires_at', 'timestamp, nullable', 'Temporary blocks should expire by themselves.']
        ] }
      ],
      storage: [
        { title: 'Redis (or a Redis-compatible in-memory store) for limiter state', verdict: 'Pick',
          body: 'The workload is single-key, atomic read-modify-write at hundreds of thousands of operations a second with tiny values and natural expiry. That is exactly what an in-memory store with **server-side scripting** and **per-key TTL** does well. Partition by the client key so each client lives on one shard and all its checks serialize there.\n\nCosts: state is volatile (a restart forgets counters, which is acceptable: clients briefly get fresh quotas), and replicas lag, so **do not read counters from replicas**. Send checks to the primary.' },
        { title: 'Local in-memory counters in each gateway', verdict: 'Fast but approximate',
          body: 'Zero network cost, but each gateway only sees its share of a client\'s traffic. With N gateways behind a round-robin balancer a client can get about N times the limit. It works if the balancer uses **sticky routing by client key**, or as a first-layer cheap filter. Usually combined with a shared store: see the deep dive on local plus global.' },
        { title: 'SQL or a durable key-value store for rules', verdict: 'Rules only',
          body: 'Rules are a few thousand rows that change by hand. Any durable database works. Put it behind a small admin service; gateways keep an **in-memory copy** and refresh on a short interval or by subscription, so the rules store is never on the request path.\n\n```\nCREATE TABLE rule (\n  rule_id     TEXT PRIMARY KEY,\n  match_json  JSONB   NOT NULL,\n  algorithm   TEXT    NOT NULL,\n  capacity    INT     NOT NULL,\n  refill_rate NUMERIC NOT NULL,\n  tier        TEXT    NOT NULL DEFAULT \'default\',\n  version     BIGINT  NOT NULL\n);\n```' }
      ],
      decisions: [
        { title: 'Which algorithm', question: 'Five common choices. They trade memory, burst behaviour and accuracy:',
          options: [
            { name: 'Token bucket', pros: 'Allows controlled bursts, matches how clients really behave, tiny state (two numbers), O(1) per check.', cons: 'Two parameters to explain (capacity and refill rate). Needs atomic read-modify-write.' },
            { name: 'Leaky bucket (as a queue)', pros: 'Smooths output to a constant rate, which protects a fragile downstream.', cons: 'Adds queueing delay, and a full queue drops new requests even if the client was idle a moment ago. Needs a queue per client.' },
            { name: 'Fixed window counter', pros: 'Simplest: `INCR` a key per window and set a TTL. One number per client.', cons: '**Boundary burst**: a client can send the full limit at the end of one window and again at the start of the next, so up to 2x in a short span.' },
            { name: 'Sliding window log', pros: 'Exact: stores a timestamp per request, so the limit holds for any window position.', cons: 'Memory grows with the limit (one entry per request); at 1,000 per minute that is about 8 KB per client instead of about 100 B.' },
            { name: 'Sliding window counter', pros: 'Near-exact with two counters: weight the previous window by how much of it still overlaps. Small and fast.', cons: 'An approximation: it assumes the previous window\'s requests were evenly spread. Overshoot is small in practice.' }
          ],
          pick: '**Token bucket for most API limits** (burst-friendly, tiny, exact within itself), and **sliding window counter** where a strict "N per rolling minute" reading matters. Avoid the log except for tiny limits. Say the fixed window\'s boundary problem out loud; it is a favourite follow-up.' },
        { title: 'Where the check runs', question: 'The state is shared, but the decision can be made in different places:',
          options: [
            { name: 'Gateway filter calling a central Redis cluster', pros: 'Accurate, one source of truth, easy to reason about.', cons: 'One extra network hop per request (about 0.5 to 1 ms in-region) and a dependency to keep alive.' },
            { name: 'Local counters only, sticky by client key', pros: 'No network, no shared dependency.', cons: 'Needs sticky routing; breaks when servers are added or removed, and limits drift.' },
            { name: 'Local pre-allocation of tokens from the central store', pros: 'Each gateway takes a batch of tokens (say 10) from Redis and spends them locally, cutting Redis calls by about 10x.', cons: 'Unused tokens on one gateway are stranded; limit accuracy becomes approximate; low limits (like 5 per minute) do not split well.' }
          ],
          pick: 'Start with **central Redis, called once per request**, because 350K ops a second is well within a shard cluster. Add local batching only for hot keys or when the Redis hop becomes the latency problem.' },
        { title: 'What to key on', question: 'The key decides who shares a budget.',
          options: [
            { name: 'API key or user ID', pros: 'Precise and fair: one account, one budget. Unaffected by shared networks.', cons: 'Only available after authentication, so unauthenticated endpoints cannot use it.' },
            { name: 'IP address', pros: 'Works before login and for anonymous traffic.', cons: 'Many users share one IP behind a company or mobile carrier NAT (one noisy user blocks everyone), while an attacker rotates through many IPs. For IPv6, key on a /64 prefix, not the single address.' },
            { name: 'Route plus key', pros: 'Lets cheap reads have a high limit and expensive writes a low one, for the same client.', cons: 'More keys and more rules to manage.' }
          ],
          pick: 'Layer them: a **generous per-IP limit** as the outer guard for unauthenticated traffic, a **per-API-key limit** as the main control, and **per-route limits** for expensive endpoints.' }
      ]
    },

    design: {
      intro: 'The limiter is a **filter in the gateway**: it asks a sharded Redis cluster for a decision in one round trip, and forwards the request only if allowed. Rules are cached in memory and pushed from a config service. Decision events go to a queue for monitoring, off the hot path. **Click any box** for the reasoning, or pick a request to trace.',
      diagram: {
        title: 'Rate limiter high-level design',
        nodes: [
          { id: 'client', label: 'API client', kind: 'client',
            detail: { why: 'Any caller of the public API. Well-behaved clients read the quota headers and back off with jitter after a 429.', tradeoffs: ['You cannot trust clients to slow down, so enforcement is always server-side.', 'Clients that retry immediately on 429 make an overload worse; document exponential backoff.'], scale: 'A misbehaving client with a tight retry loop can generate more rejected traffic than allowed traffic.' } },
          { id: 'lb', label: 'Load balancer', kind: 'lb',
            detail: { why: 'Spreads connections across gateway servers and removes unhealthy ones. It is not aware of rate limits, which is why the counters must be shared.', tradeoffs: ['Round robin means any client hits any gateway, so per-gateway counters undercount.', 'Sticky routing by key would allow local counters but breaks on scaling events.'], alternatives: ['DNS round robin', 'Managed cloud load balancer'], scale: 'Connection and TLS limits, long before the rate limiter matters.' } },
          { id: 'gw', label: 'API gateway + limiter filter', kind: 'service',
            detail: { why: 'A stateless gateway that identifies the caller, finds the matching rules in its in-memory copy, calls Redis once per rule, and either forwards or answers 429 with headers. Stateless means you scale it by adding servers.', tradeoffs: ['Running the check in the gateway rejects traffic before it touches backends, so abusive traffic is cheap.', 'A Redis call per request adds about 1 ms; if that matters, batch tokens locally for hot keys.', 'The failure mode (fail open or closed) lives here, per rule.'], alternatives: ['A sidecar next to each service', 'A separate rate-limit service called over gRPC (an extra hop and another service to run)', 'A library inside each backend (duplicated logic, later in the pipeline)'], scale: 'CPU and connection counts, then the Redis round trip adding to every request\'s latency.' } },
          { id: 'redis', label: 'Redis shards (primary)', kind: 'cache',
            detail: { why: 'Holds one bucket or counter per client key and runs the whole read-modify-write as a **single Lua script**, so concurrent gateways cannot interleave between read and write. Partitioned by hash of the client key.', tradeoffs: ['Atomicity comes from Redis executing one script at a time per shard, so a hot key limits a shard\'s throughput.', 'Keys carry a TTL, so idle clients cost nothing.', 'State is volatile: a failover can reset or lose a few counters, which grants clients a brief fresh quota.', 'Use the Redis server clock (`TIME`) inside the script so gateway clock skew cannot corrupt refill math.'], alternatives: ['Memcached (no scripting, so use atomic incr only)', 'A purpose-built rate-limit server with local state', 'DynamoDB conditional updates (higher latency and cost per check)'], scale: 'A single hot client (or one huge shared IP) lands every check on one shard. Around 50K scripts a second per shard is a reasonable ceiling.' } },
          { id: 'replica', label: 'Redis replicas', kind: 'cache',
            detail: { why: 'Exists for failover only: if a primary dies a replica is promoted, so one shard failure does not wipe a slice of clients\' state.', tradeoffs: ['Replication is asynchronous, so the last few updates may be lost on failover (clients get a small free quota).', 'Never read counters from replicas: stale reads would allow overshoot.'], alternatives: ['No replicas, accept state loss on failure (simplest; limits reset)'], scale: 'Failover time (seconds) is the window in which that shard\'s checks fail and the fail-open or fail-closed policy applies.' } },
          { id: 'rules', label: 'Rules service', kind: 'service',
            detail: { why: 'Admin API and durable store for rules and overrides. Gateways pull a versioned snapshot on a short interval (or subscribe to changes) and keep it in memory, so this service is never on the request path.', tradeoffs: ['Gateways may run an old rule version for a few seconds after an update: acceptable, and the version number makes it visible.', 'A bad rule (limit of 0) takes effect everywhere quickly, so validate and support instant rollback.'], alternatives: ['Rules in a config file shipped with each deploy (no live changes)', 'A key-value store such as etcd with watch'], scale: 'Tiny: a few thousand rules, polled every few seconds. If it is down, gateways keep serving with the last known rules.' } },
          { id: 'api', label: 'Backend services', kind: 'service',
            detail: { why: 'The protected APIs. They only see traffic that passed the limiter.', tradeoffs: ['Limiting at the gateway protects every backend uniformly, but a backend with its own expensive operations may still want its own concurrency limit.'], scale: 'If the limiter fails open during an attack, backends are the next to fall; keep a coarse global safety limit local to each gateway as a backstop.' } },
          { id: 'events', label: 'Decision events', kind: 'queue',
            detail: { why: 'Each decision (allowed, limited, error) is published as a small event, so dashboards and alerts show who is being limited without slowing the request.', tradeoffs: ['At-least-once and lossy delivery are fine for monitoring; never block a request on it.', 'Sample allowed events and log all rejections to control volume.'], alternatives: ['Kafka', 'Local metrics counters scraped by a monitoring system'], scale: 'Allowed traffic is the volume; sampling keeps it small.' } },
          { id: 'monitor', label: 'Metrics and alerts', kind: 'service',
            detail: { why: 'Tracks rejection rate per rule, limiter latency, Redis errors and fail-open count. A spike in rejections is either an attack or a rule that is too tight, and you need to know which.', tradeoffs: ['Alert on the **fail-open counter**: if the limiter is silently open you have no protection.'], scale: 'Cardinality: per-client metrics explode; aggregate by rule and keep top-N offenders.' } }
        ],
        edges: [
          { from: 'client', to: 'lb', label: 'HTTPS' },
          { from: 'lb', to: 'gw' },
          { from: 'rules', to: 'gw', label: 'rule sync' },
          { from: 'gw', to: 'redis', label: 'Lua check' },
          { from: 'redis', to: 'replica', label: 'replicate', style: 'replication' },
          { from: 'gw', to: 'api', label: 'if allowed' },
          { from: 'gw', to: 'events', label: 'decision', style: 'async' },
          { from: 'events', to: 'monitor', style: 'async' }
        ],
        scenarios: [
          { id: 'allowed', label: 'Allowed request', steps: [
            { title: 'Request arrives', path: ['client', 'lb', 'gw'], note: 'The balancer picks any gateway. The gateway authenticates the caller and finds the matching rules in its in-memory copy: no network call yet.' },
            { title: 'Check and consume', path: ['gw', 'redis'], note: 'One Lua call on the shard that owns this client key: refill the bucket from elapsed time, take a token if one is available, write back, return the result. Atomic, so concurrent gateways cannot double-spend.' },
            { title: 'Forward', path: ['gw', 'api'], tone: 'ok', note: 'Allowed. The gateway forwards the request and later adds `RateLimit-Remaining` and `RateLimit-Reset` headers to the response.' },
            { title: 'Record', path: ['gw', 'events', 'monitor'], note: 'A sampled decision event is published asynchronously for dashboards. The response does not wait for it.' }
          ] },
          { id: 'limited', label: 'Rejected (429)', steps: [
            { title: 'Request arrives', path: ['client', 'lb', 'gw'], note: 'Same entry path. The gateway resolves the key, for example the API key `k_81f3`, and the rule for `POST /orders`.' },
            { title: 'Check: no tokens', path: ['gw', 'redis'], tone: 'hard', note: 'The script finds fewer than one token. It does **not** consume anything, and returns how long until one token is available.' },
            { title: 'Reject', path: ['gw', 'lb', 'client'], tone: 'hard', note: 'The gateway answers 429 with `Retry-After` and the `RateLimit-*` headers. The backend never sees the request, which is the whole point. (The response retraces the same edges.)' },
            { title: 'Record', path: ['gw', 'events', 'monitor'], note: 'Every rejection is logged as an event so a spike per rule or per client is visible and can trigger an alert.' }
          ] },
          { id: 'outage', label: 'Redis shard down', steps: [
            { title: 'Check times out', path: ['gw', 'redis'], tone: 'hard', note: 'The gateway gives Redis a tight timeout (say 5 to 10 ms). The shard that owns this key is unreachable during failover.' },
            { title: 'Apply the failure policy', path: ['gw', 'api'], tone: 'ok', note: 'Rule says `fail_open`: forward the request anyway and increment a fail-open metric. A rule marked `fail_closed` (login, password reset) would return 503 here instead.' },
            { title: 'Alert', path: ['gw', 'events', 'monitor'], tone: 'accent', note: 'The fail-open counter rises and pages someone. Replicas promote and checks resume. A local per-gateway safety limit protects backends in the meantime.' }
          ] },
          { id: 'rule', label: 'Rule change', steps: [
            { title: 'Admin updates a rule', path: ['rules', 'gw'], tone: 'accent', note: 'An admin raises the free-tier limit. The rules service stores version 8; gateways poll and receive the new snapshot within a few seconds.' },
            { title: 'Atomic swap', path: ['rules', 'gw'], note: 'Each gateway swaps its whole in-memory rule set at once, never half old and half new. Existing buckets keep their tokens; new capacity applies from the next refill.' },
            { title: 'Next request uses it', path: ['client', 'lb', 'gw'], tone: 'ok', note: 'No deploy and no restart. The change is visible in the version metric per gateway so you can see rollout lag.' }
          ] }
        ]
      },
      walkthrough: [
        '**Check**: identify the caller, pick the rules, and send one Lua call per rule to the shard that owns the client key. The script refills from elapsed time, spends a token if one is available, and returns allowed, remaining and retry-after.',
        '**Allow**: forward to the backend and add quota headers to the response. **Reject**: answer 429 with `Retry-After` and never touch the backend.',
        '**Rules**: stored durably, cached in each gateway by version, swapped atomically, with an override table for allowlists and temporary blocks.',
        '**Failure**: a Redis timeout applies the rule\'s policy (open by default, closed for sensitive routes), raises a metric and an alert, and a coarse local limit stays as a backstop.'
      ],
      notes: ['Multiple rules per request cost multiple Redis calls. Pipeline them, or use one Lua script that checks all of a client\'s rules on the same shard by sharing a hash tag in the keys.']
    },

    deepDives: [
      { id: 'algorithms', title: 'Choosing the algorithm',
        question: 'Walk me through the common rate-limiting algorithms and tell me which you would use.',
        answer: '**Token bucket.** A bucket holds up to `capacity` tokens and refills at `rate` per second. Each request takes a token; no token means reject. Bursts up to `capacity` pass, and the long-run rate is `rate`. State is two numbers, and refill is computed lazily from elapsed time, so there is no timer per client.\n\n**Leaky bucket.** Requests enter a queue that drains at a fixed rate. Output is perfectly smooth, which suits a fragile downstream, but requests wait in the queue and a full queue drops new arrivals.\n\n**Fixed window counter.** Count requests per calendar window (for example per minute) with `INCR` and a TTL. Simple, but a client can send the full limit at the end of one window and again at the start of the next: **up to 2x the limit in a short span**.\n\n**Sliding window log.** Keep a timestamp per request and count those inside the last window. Exact, but memory is proportional to the limit (about 8 KB per client at 1,000 per minute, versus about 100 B for a counter).\n\n**Sliding window counter.** Keep the current and previous window counts and estimate the rolling count as `prev x (1 - elapsed fraction) + curr`. For a limit of 100 a minute, with 84 in the previous minute and 36 so far, 30% into this minute: `84 x 0.7 + 36 = 94.8`, so one more request is allowed. Two small counters, no boundary spike, and an approximation that is usually within a few percent.\n\nMy pick is **token bucket** for general API limits, because bursts are normal client behaviour and the state is minimal. I would use the sliding window counter where the contract says "N per rolling minute".',
        followups: [
          { q: 'Why not always use the sliding window log, since it is exact?', a: 'Memory and cost scale with the limit. A client allowed 10,000 requests an hour needs 10,000 entries, and every check trims and counts a sorted set. At hundreds of thousands of checks a second across millions of clients that is far more memory and CPU than two counters. Use it only for small limits, such as 5 login attempts in 10 minutes.' },
          { q: 'How accurate is the sliding window counter really?', a: 'It assumes the previous window\'s requests were spread evenly. If they were all at the very end of that window, the estimate undercounts what is truly in the rolling window and a client could briefly exceed the limit. With smooth, realistic traffic the error is usually small, but it is an approximation, so say so.' },
          { q: 'When would you pick the leaky bucket?', a: 'When the goal is to protect a downstream that needs a steady rate, such as a payment provider with its own strict limit, and delaying requests is acceptable. Implement it as a queue consumed at a fixed rate, with a bounded queue length.' }
        ] },
      { id: 'atomic', title: 'Making it atomic in Redis with Lua',
        question: 'Many gateways update the same bucket at the same time. How do you keep the count correct?',
        answer: 'A naive version reads the bucket, computes the new token count in the gateway, and writes it back. Two gateways can both read `1 token`, both decide "allowed", and both write `0`: **one token was spent twice**. That is a read-modify-write race.\n\nFixes, in increasing generality:\n\n- For a **fixed window**, a single `INCR` is already atomic. Check the returned value against the limit. Set the TTL when the result is 1.\n- For anything with logic (token bucket, sliding window), run the whole sequence as a **Lua script**. Redis executes one script at a time per instance, so no other command interleaves. Use `EVALSHA` after loading the script once.\n- `WATCH`/`MULTI` optimistic transactions work but retry under contention, which is exactly when you least want extra round trips.\n\nTwo details that matter: get the time **inside** the script from `redis.call("TIME")` so gateway clock skew cannot affect refill, and make sure every key the script touches maps to the same shard (use a hash tag such as `{clientKey}` in cluster mode).\n\n```\n-- KEYS[1] bucket key; ARGV: capacity, refill tokens per second, cost\nlocal t = redis.call(\"TIME\")\nlocal now = t[1] * 1000 + math.floor(t[2] / 1000)\nlocal capacity, rate, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])\nlocal s = redis.call(\"HMGET\", KEYS[1], \"tokens\", \"ts\")\nlocal tokens, ts = tonumber(s[1]), tonumber(s[2])\nif tokens == nil then tokens = capacity; ts = now end\ntokens = math.min(capacity, tokens + math.max(0, now - ts) * rate / 1000)\nlocal allowed, retry = 0, 0\nif tokens >= cost then\n  tokens = tokens - cost\n  allowed = 1\nelse\n  retry = math.ceil((cost - tokens) * 1000 / rate)\nend\nredis.call(\"HSET\", KEYS[1], \"tokens\", tokens, \"ts\", now)\nredis.call(\"PEXPIRE\", KEYS[1], math.ceil(capacity / rate * 1000) * 2)\nreturn { allowed, math.floor(tokens), retry }\n```\n\nWith capacity 10 and 5 tokens a second, ten calls pass, the next two are rejected with a retry hint of about 200 ms, and one second later five more pass. (This was run against a mock of the Redis calls.)',
        followups: [
          { q: 'Does a Lua script block Redis?', a: 'Yes, scripts run to completion and block other commands on that instance. That is the point, and it is fine because this one is a handful of O(1) operations, well under a millisecond. Never put loops over large data or a sliding window log trim of thousands of entries in a hot script.' },
          { q: 'What if the key is on a different shard from another key in the same check?', a: 'In Redis Cluster a script can only touch keys in one hash slot. Use a hash tag so all of one client\'s keys share a slot: `rl:{apikey:k_81f3}:orders`. Without that the script is rejected.' },
          { q: 'What happens to counters when the primary fails over?', a: 'With asynchronous replication, the last few updates can be lost, so some clients briefly get a fresh quota. For abuse protection that is acceptable. If it is not, you need synchronous replication (slower) or a different store.' }
        ] },
      { id: 'headers', title: 'Telling the client: 429 and headers',
        question: 'What does a rejected request look like, and how do you help clients behave?',
        answer: 'Return **429 Too Many Requests** with `Retry-After` giving seconds until the client may retry. Add the limit family of headers on every response: the limit, the remaining count, and seconds until reset. Include a short JSON error body.\n\nTwo design points. First, compute `Retry-After` from the algorithm: for a token bucket it is the time until one token exists, which the script above returns. Second, prefer **relative seconds** to an absolute timestamp, because client clocks are wrong more often than you expect.\n\nOn the client side, document **exponential backoff with jitter**. Without jitter, thousands of clients rejected together all retry at the same instant and cause the next spike.',
        followups: [
          { q: 'Should rejected requests count against the limit?', a: 'For a token bucket a rejected request consumes nothing, so a client that backs off recovers on schedule. For abuse-prone endpoints you can add a penalty: count rejections too, or escalate to a temporary block after repeated violations.' },
          { q: 'Why send quota headers on successful responses too?', a: 'It lets clients pace themselves and avoid 429 entirely. Most hard-to-debug rate limit complaints come from clients that never saw how close they were.' }
        ] },
      { id: 'failure', title: 'Fail open or fail closed',
        question: 'Redis is down or slow. What does the gateway do with the request?',
        answer: 'This is a product decision, so make it explicit per rule.\n\n**Fail open** (allow the request) keeps the API up when the limiter is broken. Limiters exist to protect the system, so letting them take it down is backwards. This is the default for general traffic.\n\n**Fail closed** (reject, usually with 503) is correct where letting traffic through is worse than the outage: login and password-reset (credential stuffing), SMS or email sends that cost money, and anything protecting a fragile downstream.\n\nWhichever you pick, build the safety net: a tight client timeout (5 to 10 ms) and a **circuit breaker** so a slow Redis does not add its timeout to every request; a coarse **local in-memory limit** per gateway as a backstop while open; and an alert on the fail-open counter, because silent fail-open means silent loss of protection.',
        followups: [
          { q: 'How do you avoid the limiter adding latency when Redis is slow rather than down?', a: 'Short timeouts and a circuit breaker. After a few consecutive failures stop calling Redis for a cooldown period and apply the failure policy immediately, then probe occasionally to close the breaker.' },
          { q: 'What is the local backstop limit?', a: 'A very rough per-gateway limit, for example a generous cap per client per second held in memory. It is inaccurate across gateways, but it keeps one client from drowning backends while the shared store is unavailable.' }
        ] },
      { id: 'hot', title: 'Hot keys, NAT and layered limits',
        question: 'One client, or one shared IP, produces a huge share of traffic. What breaks and what do you do?',
        answer: 'All checks for a key go to one shard and execute serially, so a single abusive client can saturate that shard (about 50K scripts a second) and hurt every other client mapped to it.\n\nMitigations: **reject cheaply before Redis** (a per-gateway local limit or a small local "recently blocked" cache so a known offender is rejected from memory for a few seconds); **batch tokens** for very hot legitimate clients (a gateway takes 10 tokens at once and spends them locally); and for the biggest tenants, **split the key** into several sub-buckets with a share of the limit each.\n\nShared IPs are the other trap. A corporate NAT or mobile carrier can put thousands of real users behind one address, so a strict per-IP limit blocks innocents. Use per-IP only as a generous outer layer for anonymous traffic, and key authenticated traffic on the API key or user ID. For IPv6 key on the /64.',
        followups: [
          { q: 'How do you detect a hot key?', a: 'Per-shard CPU and ops per second, plus a sampled top-N of keys by check rate in the gateways. Alert when one key exceeds a share of a shard\'s capacity.' },
          { q: 'Why not block abusive IPs at the limiter forever?', a: 'Addresses are reassigned and shared. Use escalating, expiring blocks (minutes, then hours) and hand persistent attackers to the edge or network layer to block.' }
        ] },
      { id: 'global', title: 'Many regions and local plus global limits',
        question: 'The API runs in several regions. How do limits work?',
        answer: 'An exact global limit needs every check to reach one place, which adds a cross-region round trip (tens to hundreds of milliseconds) to every request. That is rarely worth it.\n\nCommon approaches: **split the budget** (a 1,000 per minute limit becomes 500 in each of two regions, adjusted by observed traffic), or **per-region enforcement with periodic reconciliation**: each region counts locally and exchanges totals every second or so, accepting that the global total can overshoot by the traffic of one sync interval. A **local plus global** hybrid applies a cheap local check first and consults the shared store only every N requests or when the local view nears the limit.\n\nState the trade-off honestly: accuracy versus latency versus availability. Strict global exactness needs coordination; if you do not need it, do not pay for it.',
        followups: [
          { q: 'What happens if the link between regions fails?', a: 'Each region keeps enforcing its own share, so the global limit is temporarily the sum of local shares. That is bounded and safe, which is a strong argument for budget splitting over a central counter that regions cannot reach.' }
        ] }
    ],

    bottlenecks: [
      { title: 'One shard owns a hot key', problem: 'Every check for a client lands on one Redis shard and runs serially. One abusive client or a very large tenant can saturate the shard and slow unrelated clients.', mitigation: 'Cheap local rejection of known offenders, token batching for large legitimate tenants, splitting a big key into sub-buckets, and per-shard CPU alerts.' },
      { title: 'The extra network hop on every request', problem: 'A Redis round trip adds about 0.5 to 1 ms to every API call, and a slow Redis adds its full timeout.', mitigation: 'Co-locate gateways and Redis in the same zone, keep connections pooled and pipelined, set tight timeouts with a circuit breaker, and batch tokens locally for hot keys.' },
      { title: 'Limiter state loss on failover', problem: 'Asynchronous replication means a failover can lose recent updates, so some clients briefly get fresh quota. A full cluster restart resets everyone.', mitigation: 'Accept it for abuse protection and document it. For stricter needs, use synchronous replication on a small set of critical keys or persist counts for billing-grade quotas elsewhere.' },
      { title: 'Rule rollout mistakes', problem: 'A wrong rule (limit of 0, or a typo in the key dimension) propagates to every gateway within seconds.', mitigation: 'Validate rules on write, version them, roll out gradually or to a shadow mode that only logs, and keep one-click rollback.' },
      { title: 'Memory with exact algorithms', problem: 'A sliding window log stores one entry per request, which grows with both the limit and the number of active clients.', mitigation: 'Use counters (token bucket or sliding window counter) for large limits and keep the log for small, security-sensitive ones.' },
      { title: 'Clock and time handling', problem: 'Using each gateway\'s own clock for refill math lets skew create or destroy tokens, and clients cannot be trusted to report time.', mitigation: 'Read time inside the Redis script from the server clock and return relative durations in headers.' }
    ],

    mistakes: [
      'Keeping counters in **each gateway\'s memory** behind a round-robin balancer, so every client gets N times the limit.',
      'Doing **read, compute, write** as separate Redis calls and ignoring the race; the fix is a Lua script or an atomic command.',
      'Choosing the **fixed window** without mentioning the boundary burst that allows up to twice the limit.',
      'Never deciding **fail open versus fail closed**, or applying one policy to login and to ordinary reads alike.',
      'Using **gateway clocks** for refill timing instead of the store\'s clock.',
      'Rate limiting only by **IP**, which punishes shared networks and does nothing against an attacker with many addresses.',
      'Returning a bare 429 with **no `Retry-After`**, so clients retry immediately and make the overload worse.',
      'Storing a **timestamp per request** at large limits and not noticing the memory cost.',
      'Reading counters from a **replica**, which lags and lets requests slip through.',
      'Making rule changes require a **deploy**, or not versioning rules so a bad one cannot be rolled back.'
    ],

    pushes: [
      { q: 'Why token bucket and not a fixed window counter?', why: 'They want to hear the boundary burst problem and why burst tolerance matches real clients.', good: 'Fixed windows allow up to 2x the limit across a boundary; a bucket enforces a smooth long-run rate while still allowing a defined burst; the state is just as small.' },
      { q: 'Two gateways check the same client at the same instant. What stops a double spend?', why: 'The core concurrency question for a shared limiter.', good: 'Name the read-modify-write race, then a single atomic operation: INCR for fixed windows, a Lua script for buckets, executed on the one shard that owns the key.' },
      { q: 'What if Redis goes down?', why: 'They are testing whether you treat the limiter as part of the availability story.', good: 'Fail open by default with a timeout and circuit breaker, fail closed for sensitive routes, a local backstop limit, and an alert on the fail-open metric.' },
      { q: 'How does this work across regions without hurting latency?', why: 'It checks whether you know exact global limits are expensive.', good: 'Split the budget per region or reconcile on an interval, accept bounded overshoot, and keep working when regions cannot talk.' },
      { q: 'How would you rate limit by IP when many users share one?', why: 'Real-world traffic breaks the naive key.', good: 'Treat IP as a generous outer layer, key authenticated calls by API key or user, use the IPv6 /64, and use expiring blocks instead of permanent ones.' },
      { q: 'How would you test this?', why: 'Behavioural correctness of a concurrent system is hard to see.', good: 'Unit tests with a fake clock for refill math, a concurrency test that fires many parallel calls at one key and asserts the allowed count never exceeds capacity plus refill, and load tests for latency and shard throughput.' }
    ],

    quiz: [
      { kind: 'concept', q: 'A client sends the full per-minute limit at 12:00:59 and the full limit again at 12:01:00. Which algorithm lets both batches through?', choices: ['Fixed window counter', 'Token bucket', 'Sliding window log', 'Sliding window counter'], answer: 0, explain: 'The two batches fall in different calendar windows, so each looks fine on its own: up to 2x the limit in two seconds. The other three look at a rolling interval or a refilling bucket.' },
      { kind: 'concept', q: 'Two gateways read a bucket with 1 token, both decide to allow, and both write 0. What is this bug and the standard fix?', choices: ['A read-modify-write race; do the whole update in one atomic Lua script', 'Clock skew; synchronize NTP on gateways', 'Cache stampede; add TTL jitter', 'Hot key; shard the key'], answer: 0, explain: 'The read and write are separate steps, so updates interleave. Running the logic inside Redis as a single script makes it atomic per shard.' },
      { kind: 'concept', q: 'Why read the time inside the Redis script instead of passing the gateway\'s clock?', choices: ['Gateway clocks differ, so refill amounts would vary by which gateway handled the request', 'Redis has a faster clock', 'Lua cannot accept timestamps as arguments', 'It reduces memory per key'], answer: 0, explain: 'A single source of time keeps refill math consistent. Skewed gateway clocks would create or destroy tokens.' },
      { kind: 'concept', q: 'Which endpoint most clearly deserves to fail closed when the limiter is down?', choices: ['Password reset', 'Reading a public product list', 'Fetching a user\'s avatar', 'Health check'], answer: 0, explain: 'Letting unlimited reset attempts through enables credential attacks and costs money. Ordinary reads should fail open so a limiter outage is not an API outage.' },
      { kind: 'complexity', q: 'Limit is 100 per minute. The previous minute had 84 requests, this minute has 36 so far, and we are 30% into the current minute. What is the sliding window counter estimate?', choices: ['94.8', '120', '36', '84'], answer: 0, explain: '84 x (1 - 0.3) + 36 = 58.8 + 36 = 94.8, which is under 100, so another request is allowed.' },
      { kind: 'concept', q: 'Pick every reason a per-IP limit alone is a weak design.', choices: ['Many real users share one IP behind NAT', 'An attacker can rotate across many IPs', 'IPv6 gives one user many addresses', 'IP addresses cannot be read by a gateway'], answer: [0, 1, 2], explain: 'Gateways can read IPs; the weakness is that the address is a poor identity. Layer per-IP limits under per-API-key limits and key IPv6 on a /64.' },
      { kind: 'concept', q: 'What should a 429 response include so clients behave well?', choices: ['Retry-After in seconds, plus the quota headers', 'A redirect to the home page', 'A new API key', 'Nothing; clients should guess'], answer: 0, explain: 'Telling the client how long to wait lets it back off correctly. Without it clients retry at once and deepen the overload.' }
    ],

    flashcards: [
      { id: 'tb', front: 'Token bucket: how does it work and why is it the default choice?', back: 'Bucket of capacity tokens refilling at a fixed rate; each request spends one. Allows bursts up to capacity at a bounded long-run rate. State is two numbers, refill is computed lazily from elapsed time.' },
      { id: 'fixed-window', front: 'Weakness of the fixed window counter?', back: 'Boundary burst: the full limit at the end of one window plus the full limit at the start of the next allows up to 2x the limit in a short span.' },
      { id: 'swc', front: 'Sliding window counter formula?', back: 'estimate = prev_count x (1 - fraction of current window elapsed) + current_count. Example: 84 x 0.7 + 36 = 94.8. An approximation that assumes even spread in the previous window.' },
      { id: 'swlog', front: 'Why is the sliding window log expensive?', back: 'It stores a timestamp per request, so memory grows with the limit (about 8 KB per client at 1,000 per minute versus about 100 B for a counter). Use it only for small limits.' },
      { id: 'lua', front: 'Why a Lua script for the distributed limiter?', back: 'Read-modify-write across gateways races. Redis runs one script at a time per instance, so the whole refill, check and write is atomic. Also read time with TIME inside the script.' },
      { id: 'fail-mode', front: 'Fail open or fail closed when the limiter is down?', back: 'Default fail open so the limiter cannot take the API down; fail closed for sensitive routes like login and password reset. Add a tight timeout, circuit breaker, local backstop limit and an alert on the fail-open counter.' },
      { id: 'headers', front: 'What to return on a rate-limited request?', back: '429 with Retry-After (relative seconds), RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, and a small JSON body. Send quota headers on successful responses too. Clients should back off with jitter.' }
    ]
  });
})();
