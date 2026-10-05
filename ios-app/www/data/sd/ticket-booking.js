/* System design case study: ticket booking (Ticketmaster-style). Schema: data/sd/schema.md.
   Numbers are rounded estimates; "a common approach" means a widely used pattern, not a claim about any company. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'ticket-booking',
    title: 'Design a ticket booking system',
    short: 'Sell scarce seats without ever double booking, even when a million people arrive in the same minute.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Concurrency', 'Transactions', 'Queueing', 'Idempotency', 'Spiky traffic'],
    prompt: 'Design a service like Ticketmaster. Users browse events, pick seats, pay and receive tickets. Popular on-sales sell out in minutes and must never sell the same seat twice.',

    requirements: {
      functional: [
        'Browse and search events by artist, venue, city and date.',
        'View an event\'s seat map with live availability and prices.',
        'Select seats and **hold** them for a few minutes while the user pays.',
        'Pay and receive confirmed tickets (the booking is atomic: all chosen seats or none).',
        'Release holds automatically when time runs out or the user leaves.',
        'Cancel or refund according to event policy (stretch).'
      ],
      nonFunctional: [
        '**Correctness first**: a seat is never sold to two people. This outranks availability on the booking path.',
        '**Browse** is highly available and fast (p99 under about 300 ms); it may be slightly stale.',
        '**Spiky load**: a hot on-sale can bring hundreds of times the normal traffic to one event in one minute. The system must degrade fairly, not collapse.',
        '**Fairness and abuse resistance**: bots and scalpers should not take most of the inventory.',
        '**Payments** are exactly-once in effect: a user is charged once per order, even with retries and timeouts.',
        'Durability of orders and tickets; no confirmed ticket may be lost.'
      ],
      outOfScope: ['Secondary resale marketplace and ticket transfer.', 'Dynamic pricing algorithms and fees breakdown.', 'Venue and promoter back-office tools.', 'Mobile ticket delivery, barcodes and entry scanning in depth.', 'Tax and compliance details.'],
      assumptions: ['Typical day: a few million visitors, mostly browsing. A flash sale is a handful of events a year but defines the hard requirements.', 'A hot on-sale: about 50,000 seats and about 1 million people trying to buy in the first minutes.', 'A hold lasts about 8 minutes; users buy 1 to 6 seats.'],
      clarify: [
        { q: 'Reserved seating, general admission, or both?', a: 'Both appear. Reserved seats are individual inventory items; general admission is a counter per ticket type. Design for reserved seating (the harder case) and note that counters are simpler.' },
        { q: 'Is it acceptable to show a seat as available and then fail?', a: 'It is unavoidable under contention: availability shown is a recent snapshot. The correctness guarantee is at hold time, not at display time. Say so and keep the failure message friendly.' },
        { q: 'Do we need strong consistency globally?', a: 'Per event, yes for seat state. Different events are independent, so each event can live on one primary region or shard and nothing needs global transactions.' },
        { q: 'Do we guarantee fairness among users in a flash sale?', a: 'Aim for fair-ish: a randomised or first-come waiting room and per-account limits. Absolute fairness is impossible against bots; define what we mitigate.' }
      ]
    },

    estimates: {
      intro: 'Size two regimes. A **normal day** sets baseline capacity and storage. A **flash sale** sets the peak, which is nothing like the average. In the calculator a "write" is a **hold or booking attempt** and a "read" is **an event page, search or seat-map view**. The peak factor is set high (10) because spikes dominate; the flash sale is handled separately in the extra rows.',
      inputs: { dau: 3e6, writesPerUser: 0.05, readsPerUser: 20, peakFactor: 10, bytesPerWrite: 2000, bytesPerRead: 20000, years: 7, replication: 3, hotFraction: 0.1, serverQps: 500, utilization: 0.5 },
      assumptions: [
        '**3 million daily visitors**, one in twenty tries to hold or buy: 0.05 attempts each.',
        '**20 page loads each** (search results, event pages, seat maps), at about **20 KB** per response (approximate).',
        '**2 KB stored per write** covers an order, ticket rows and payment reference (approximate).',
        '**Seven years** of retention for orders, because of refunds, disputes and accounting. Replicated three times: this is the system of record for money.',
        '**500 requests per second per server** because booking requests touch the database and payment code; keep **utilization at 50%** for spikes.'
      ],
      extra: [
        { label: 'Seats in a hot on-sale', formula: 'assumed venue', result: '50,000 seats' },
        { label: 'People arriving in the first minute', formula: 'assumed', result: '1,000,000 (about 16,700 arrivals/s)' },
        { label: 'Poll load from waiting users', formula: '1M waiting / 10 s poll interval', result: '~100,000 req/s, served from edge or in-memory, not the database' },
        { label: 'Buyers needed to sell out', formula: '50,000 seats / ~2.5 seats per order', result: '~20,000 orders' },
        { label: 'Concurrent shoppers the booking tier allows', formula: 'chosen cap (about 100 per second of admits x ~50 s typical session)', result: '~5,000 active sessions' },
        { label: 'Time to drain the queue (approximate)', formula: '20,000 orders / ~20 orders/s completed', result: '~1,000 s, about 17 minutes' },
        { label: 'Share of arrivals who can succeed', formula: '20,000 orders / 1,000,000 people', result: '~2%, so about 49 in 50 must be told "sold out" fast' }
      ],
      notes: [
        'On a normal day this is a **small system**: about 1.7 writes a second and under 1,000 reads a second on average. Storage over seven years is only a few terabytes.',
        'The **flash sale is 100 to 1,000 times normal load** concentrated on a few rows. Sizing for average is wrong; sizing for the spike with spare capacity is wasteful. The answer is to **shape the load** (waiting room, admission control) so the booking tier sees a steady rate.',
        'The number that matters is **admit rate**, not arrival rate. You control it, and it must match what the seat database and payment provider can sustain.',
        'Most of the 1,000,000 people will not get a ticket. The system\'s job is to **tell them quickly and honestly**, not to process every request fully.',
        'Reads are cacheable and can be stale by seconds; writes against seat state are tiny but must be serialised per seat.'
      ]
    },

    api: [
      { method: 'GET', path: '/v1/events?q=&city=&from=&cursor=', desc: 'Search and browse events.', response: '{ "items": [{ "eventId": "e_91", "name": "...", "venue": "...", "startsAt": "...", "minPrice": 4500, "status": "ON_SALE" }], "nextCursor": "..." }', notes: ['Served from a search index and cache; slightly stale is fine.', 'Cursor pagination. Status includes `ON_SALE`, `SOLD_OUT`, `NOT_YET_ON_SALE`.'] },
      { method: 'GET', path: '/v1/events/{id}/seats', desc: 'Seat map with availability.', response: '{\n  "version": 8841,\n  "sections": [{ "id": "A", "price": 9500, "available": 120 }],\n  "seats": { "A-12-4": "AVAILABLE", "A-12-5": "HELD", "A-12-6": "SOLD" }\n}',
        notes: ['Cached for a second or two and may be stale. A seat shown AVAILABLE can still fail at hold time: the **hold call is the truth**.', 'During a hot on-sale prefer section-level counts plus best-available over a full seat grid, which is a smaller and cacheable payload.'] },
      { method: 'POST', path: '/v1/events/{id}/queue/join', desc: 'Enter the waiting room for a hot on-sale.', response: '{ "queueToken": "qt_8a...", "position": 412883, "pollAfterSec": 10 }', notes: ['The token is signed and carries event and join time. Polling reads from an edge or in-memory store, never the seat database.', 'Allowed once per account or verified device to slow bots.'] },
      { method: 'POST', path: '/v1/holds', desc: 'Hold seats for a few minutes.',
        request: '{ "eventId": "e_91", "seatIds": ["A-12-4", "A-12-5"], "admissionToken": "at_3c..." }',
        response: '{ "holdId": "h_5d2", "expiresAt": "2026-10-02T20:08:00Z", "total": 19000 }',
        notes: ['All-or-nothing: if any seat is taken, **409** with the unavailable seats listed and nothing is held.', 'Requires an `admissionToken` issued by the waiting room during hot sales.', 'Send an `Idempotency-Key` so a retry returns the same hold.'] },
      { method: 'DELETE', path: '/v1/holds/{id}', desc: 'Release a hold early.', notes: ['Idempotent. Also happens automatically at expiry.'] },
      { method: 'POST', path: '/v1/orders', desc: 'Pay for a hold and confirm the booking.',
        request: '{ "holdId": "h_5d2", "paymentMethodId": "pm_77", "idempotencyKey": "7c1e-..." }',
        response: '{ "orderId": "o_20931", "status": "CONFIRMED", "tickets": ["t_1", "t_2"] }',
        notes: ['**Idempotency key is mandatory**: a retry after a timeout returns the same order, never a second charge.', 'Returns `PENDING` while payment is asynchronous (3-D Secure, bank redirects); the client polls or receives a webhook.', 'Fails with **410 Gone** if the hold expired before payment completed.'] },
      { method: 'GET', path: '/v1/orders/{id}', desc: 'Order status and tickets.', response: '{ "orderId": "o_20931", "status": "CONFIRMED", "tickets": [{ "id": "t_1", "seat": "A-12-4" }] }' }
    ],
    apiNotes: ['Two phases on purpose: **hold** is cheap and reversible, **order** is the commit. Never charge a card before a hold exists.', 'Rate limit holds per account, per IP and per device, and cap seats per order. Authentication is required to hold.'],

    data: {
      intro: 'The key entity is the **per-event seat**: one row per (event, seat) with a status. Everything about correctness is how that row changes state. Orders and payments are the record of money, so they live in a transactional store with strong guarantees. Search and event pages are derived, read-optimised copies.',
      entities: [
        { name: 'event', purpose: 'A show on a date at a venue, with sale rules.', fields: [['event_id', 'string, primary key', ''], ['venue_id, starts_at', '', ''], ['on_sale_at, status', 'timestamp, enum', 'NOT_YET_ON_SALE, ON_SALE, SOLD_OUT, CANCELLED.'], ['max_seats_per_order', 'int', 'A cheap anti-scalping control.']] },
        { name: 'event_seat', purpose: 'Inventory. One row per seat per event, created when the event is published.', fields: [['event_id, seat_id', 'primary key', 'Shard by `event_id`, so one event\'s seats live together.'], ['section, row, number, price_cents', '', ''], ['status', 'enum', 'AVAILABLE, HELD, SOLD (BLOCKED for venue holds).'], ['hold_id, hold_expires_at', 'nullable', 'Set while HELD. An expired hold counts as available.'], ['version', 'int', 'Optional optimistic-lock counter.']] },
        { name: 'hold', purpose: 'A short-lived claim by one user on a set of seats.', fields: [['hold_id', 'string, primary key', ''], ['user_id, event_id', '', ''], ['seat_ids', 'array', ''], ['expires_at', 'timestamp', 'Typically now plus 8 minutes.'], ['state', 'enum', 'ACTIVE, CONVERTED, RELEASED, EXPIRED.']] },
        { name: 'order', purpose: 'A confirmed or pending purchase.', fields: [['order_id', 'string, primary key', ''], ['user_id, event_id, hold_id', '', ''], ['status', 'enum', 'PENDING, CONFIRMED, FAILED, REFUNDED.'], ['total_cents, currency', '', 'Money is integer minor units.'], ['idempotency_key', 'string, unique per user', 'Prevents double orders.']] },
        { name: 'ticket', purpose: 'One per seat sold; the thing scanned at the gate.', fields: [['ticket_id', 'string, primary key', ''], ['order_id, event_id, seat_id', '', 'Unique on (event_id, seat_id): a second line of defence against double sale.'], ['barcode_secret', 'string', 'Rotatable code for entry.']] },
        { name: 'payment', purpose: 'Our record of a payment attempt with the provider.', fields: [['payment_id', 'string, primary key', ''], ['order_id', 'string', ''], ['provider_ref, state', 'string, enum', 'AUTHORIZED, CAPTURED, FAILED, REFUNDED.'], ['idempotency_key', 'string', 'Sent to the provider as well.']] }
      ],
      storage: [
        { title: 'Seat state: relational database with a conditional update', verdict: 'Pick for correctness',
          body: 'Each seat has a status and the hold is one **atomic conditional update**. The database serialises concurrent updates to the same row, so exactly one wins and the rest see zero rows changed. No explicit locks are needed.\n\n```\n-- hold one seat: succeeds only if it is free, or its old hold expired\nUPDATE event_seat\n   SET status = \'HELD\', hold_id = :hold, hold_expires_at = :now + 480\n WHERE event_id = :e AND seat_id = :s\n   AND (status = \'AVAILABLE\' OR (status = \'HELD\' AND hold_expires_at <= :now));\n-- rows affected = 1 means we got it, 0 means someone else did\n\n-- confirm after payment: only if this hold still owns the seat\nUPDATE event_seat SET status = \'SOLD\'\n WHERE event_id = :e AND seat_id = :s\n   AND status = \'HELD\' AND hold_id = :hold AND hold_expires_at > :now;\n```\n\nFor several seats, run all the updates in **one transaction** and roll back unless every one affects a row. A unique constraint on `ticket (event_id, seat_id)` is a last line of defence. Shard by `event_id`: a hot event uses one shard, which is acceptable because the admit rate (about 100 a second) is far below a single node\'s capacity.' },
        { title: 'Seat state: Redis as a fast front, database as truth', verdict: 'Add when needed',
          body: 'For extreme bursts, keep a seat bitmap or hash in Redis and do holds with an atomic script (`SET key holdId NX EX 480` per seat, or a Lua script over several). It is far faster than a database and TTL expiry is built in.\n\nThe cost: Redis is a second source of truth. A failover can lose a recent hold, so on confirm you still write to the database with the conditional update. Treat Redis as a **reservation accelerator**, never as the final word on a sale.' },
        { title: 'Orders and payments: a transactional store', verdict: 'Required',
          body: 'Orders, tickets and payments are financial records: use a relational database with synchronous replication, backups and an audit log. Reads are small and writes are few (about 2 a second), so it needs reliability, not scale.' },
        { title: 'Browse and search: search index and cache', verdict: 'Derived, stale is OK',
          body: 'Events and availability summaries are copied to a search index and a cache by a change stream. Pages can be seconds old. Never decide a sale from this data.' }
      ],
      decisions: [
        { title: 'How to prevent double booking', question: 'Many people click the same seat at once. What makes exactly one win?',
          options: [
            { name: 'Pessimistic lock (SELECT ... FOR UPDATE on the seat rows)', pros: 'Simple to reason about. Correct.', cons: 'Holds row locks while the app does other work; a slow or dead client ties up seats and under contention requests queue on the lock.' },
            { name: 'Optimistic check (conditional UPDATE or version check)', pros: 'No lock held between steps. One statement decides the winner; losers fail fast and can retry or pick another seat.', cons: 'Under heavy contention on a single seat many attempts fail. The client must handle "taken".' },
            { name: 'Distributed lock (Redis lock, ZooKeeper)', pros: 'Coordinates across services.', cons: 'Locks can expire during a pause and two holders proceed. It adds a failure mode on top of a database that can already do the job.' },
            { name: 'Single-writer queue per event', pros: 'All holds for an event are processed in order by one consumer, so no races at all.', cons: 'Throughput is bounded by one consumer; needs failover for the consumer. Fine at 100 a second, and pairs well with the waiting room.' }
          ],
          pick: 'A **conditional update in a transaction** on the seat rows, with a unique constraint on tickets as backup. It is the simplest correct answer. Add a per-event single-writer or a Redis front only if measured contention demands it.' },
        { title: 'Holds: how they expire', question: 'A hold must release if the user wanders off.',
          options: [
            { name: 'Expiry timestamp checked on every read and write', pros: 'Correct with no background work: an expired hold is just treated as available.', cons: 'Stale HELD rows remain until touched; counts of "available" must include expired holds.' },
            { name: 'Background sweeper that flips expired seats', pros: 'Keeps the stored status honest and counters accurate.', cons: 'Can lag; must not be the only mechanism or correctness depends on its timing.' },
            { name: 'TTL keys in Redis', pros: 'Expiry built in and fast.', cons: 'A second store; a restart can drop holds early.' }
          ],
          pick: 'Both **timestamp check (for correctness)** and a **sweeper (for tidy counts and notifications)**. The sale confirm always re-checks `hold_expires_at > now`, so a late payment cannot take a seat that was already re-held by someone else.' }
      ]
    },
    design: {
      intro: 'Three zones with different jobs. A **front door** (CDN, bot defence, waiting room) shapes traffic. A **read side** (browse, search, cached seat maps) is stale-tolerant and scales by caching. A **booking core** (holds, orders, payments) is small, strongly consistent and protected from the spike. **Click any box**, or play a scenario.',
      diagram: {
        title: 'Ticket booking high-level design',
        nodes: [
          { id: 'client', label: 'Browser or app', kind: 'client',
            detail: { why: 'Shows events and seat maps, joins the waiting room, holds seats and checks out. During a hot sale it polls its queue position and receives an admission token when its turn comes.', tradeoffs: ['Clients are hostile in a flash sale: scripts replay requests far faster than humans, so the server never trusts client-side timing or counts.', 'A visible countdown for the hold keeps users honest about the 8-minute window.'], scale: 'A million clients refreshing at once is the load that the front door exists to absorb.' } },
          { id: 'edge', label: 'CDN, WAF and bot defence', kind: 'cdn',
            detail: { why: 'Serves static assets and cached pages, absorbs request floods, and filters obvious bots with rate limits, device checks and challenges before traffic reaches any application server.', tradeoffs: ['Challenges (CAPTCHAs, proof-of-work) slow bots but also annoy people and are an arms race.', 'Per-IP limits hurt shared networks (offices, mobile carriers); combine with account and device signals.'], alternatives: ['Cloud WAF', 'Own rate-limiting tier'], scale: 'Layer-7 flood volume; the edge must outscale the origin by orders of magnitude.' } },
          { id: 'waiting', label: 'Waiting room', kind: 'service',
            detail: { why: 'Holds excess visitors in a virtual queue and admits them at a controlled rate, issuing signed admission tokens. It converts a spike of 1,000,000 arrivals into a steady stream of about 100 admits per second.', tradeoffs: ['**Fairness**: pure first-come favours fast connections and bots; a random draw within the first minutes is fairer and removes the race to refresh.', 'It must be cheap: positions live in memory or a sorted set, polls are served from the edge.', 'It is a promise: admitted users expect to be able to buy, so size admits to real capacity.'], alternatives: ['Lottery or pre-registration for the very hottest events', 'Rate limiting only (drops users randomly, no feedback)'], scale: 'Poll traffic of about 100,000 requests a second: serve it from the edge, never the database.' } },
          { id: 'browse', label: 'Browse and event service', kind: 'service',
            detail: { why: 'Serves event pages, search results and seat-map summaries from caches and the search index. Entirely read-side and stale-tolerant.', tradeoffs: ['A seat shown available may be gone: availability is advisory and the hold call decides.', 'During a hot sale collapse detail: show counts per section and a best-available picker instead of a 50,000-seat grid.'], alternatives: ['Static pre-rendered pages for on-sale events'], scale: 'Cache hit rate; one popular event page can be the hottest object in the system.' } },
          { id: 'cache', label: 'Availability cache', kind: 'cache',
            detail: { why: 'Holds per-event seat-map snapshots and counts, refreshed every second or two from the seat store, so browsing never queries the booking database.', tradeoffs: ['Seconds of staleness is the price of protecting the seat database.', 'Update it by change events from the booking core, or by a periodic refresh job.'], alternatives: ['CDN-cached JSON with short TTL', 'Redis hashes per event'], scale: 'A single hot key for the popular event; replicate it or use short-TTL edge caching.' } },
          { id: 'search', label: 'Event search index', kind: 'search',
            detail: { why: 'Full-text and filter search over events by artist, venue, city and date, with ranking by popularity and date.', tradeoffs: ['Eventually consistent; newly published events appear after a delay of seconds.', 'Keep seat-level data out of it: it changes constantly and would swamp indexing.'], alternatives: ['Database queries for a small catalogue'], scale: 'Index freshness during bulk event publishing.' } },
          { id: 'booking', label: 'Booking service', kind: 'service',
            detail: { why: 'Validates the admission token, runs the atomic hold transaction against the seat store, creates orders and coordinates payment. Small and strongly consistent by design.', tradeoffs: ['Sits behind the waiting room so it sees a controlled load.', 'All-or-nothing multi-seat holds in one transaction avoid partial holds that strand seats.', 'Stateless, so it scales horizontally; the contention is in the database, not here.'], alternatives: ['A single-writer queue per event for strictly ordered processing'], scale: 'Contention on popular seats and rows in a hot event shard.' } },
          { id: 'seatdb', label: 'Seat store (by event)', kind: 'db',
            detail: { why: 'Source of truth for seat status. A conditional update on `(event_id, seat_id)` guarantees exactly one hold wins. Sharded by event, replicated synchronously within a region.', tradeoffs: ['Strong consistency per event at the cost of one primary per event: fine, since the admit rate (about 100 per second) is far below a node\'s limit.', 'Cross-region active-active would need consensus and adds latency; prefer one home region per event.', 'Synchronous replication loses no committed sale on failover but adds a few milliseconds.'], alternatives: ['Distributed SQL with per-row consensus', 'Redis front plus database for confirm'], scale: 'Row-level contention when thousands try the same seats; the unavailable response must be fast and cheap.' } },
          { id: 'pay', label: 'Payment service', kind: 'service',
            detail: { why: 'Creates a payment with the provider using an idempotency key, handles asynchronous results (3-D Secure, webhooks) and records each state transition.', tradeoffs: ['The provider call is slow (seconds) and can time out ambiguously: you may not know if the charge happened. Idempotency keys and a reconciliation job resolve it.', 'Keep payment calls outside the seat transaction: never hold a database lock while waiting on a network call.'], alternatives: ['Redirect to a hosted payment page to reduce PCI scope'], scale: 'Provider rate limits and latency; this is usually the true throughput ceiling.' } },
          { id: 'provider', label: 'Payment provider', kind: 'external',
            detail: { why: 'External card processor or gateway. Authorises and captures funds and sends webhook callbacks for final status.', tradeoffs: ['You do not control its availability or latency; design for timeouts, retries and duplicate webhooks.', 'Authorise first and capture on confirm lets you release funds cleanly if the seat sale fails.'], alternatives: ['Multiple providers with failover'], scale: 'Provider limits per second and fraud-rule false positives at spike volume.' } },
          { id: 'orders', label: 'Orders DB', kind: 'db',
            detail: { why: 'Durable record of orders, tickets and payments. Synchronously replicated, backed up and auditable. This is the data you can never lose.', tradeoffs: ['Few writes but extreme importance: choose durability over speed.', 'A unique constraint on `(event_id, seat_id)` in tickets blocks a double sale even if a bug slips past the seat logic.'], alternatives: ['Same database as seats (simpler transaction, shared load)'], scale: 'Not a scale problem; reconciliation and audit queries are the heavy readers.' } },
          { id: 'sweeper', label: 'Hold sweeper', kind: 'service', layer: 3,
            detail: { why: 'Periodically releases expired holds, updates availability counts and emits events so the cache and waiting room can admit more people.', tradeoffs: ['Correctness never depends on it: expiry is also checked on every read and write.', 'Runs per shard, scanning an index on `hold_expires_at` rather than the whole table.'], alternatives: ['Delayed-message queue per hold', 'TTL keys in Redis'], scale: 'Scan cost if the expiry index is missing; with it, work is proportional to expired holds only.' } },
          { id: 'events', label: 'Order events', kind: 'queue',
            detail: { why: 'Publishes confirmed orders and released seats so email, ticket delivery, the availability cache and analytics update without being in the booking path.', tradeoffs: ['At-least-once delivery means consumers must be idempotent (sending two emails is better than none, but dedupe by order ID).', 'Use a transactional outbox so an event is never lost between the order commit and the publish.'], alternatives: ['Kafka', 'SQS or Pub/Sub'], scale: 'Not a bottleneck at about 100 events a second.' } },
          { id: 'notify', label: 'Ticket delivery service', kind: 'service',
            detail: { why: 'Sends confirmation emails, push messages and generates ticket barcodes after an order is confirmed.', tradeoffs: ['Asynchronous: the order is confirmed first, delivery follows seconds later.', 'The confirmation page must show tickets directly, so a mail delay does not look like a failure.'], alternatives: ['Third-party email and wallet-pass services'], scale: 'Email provider limits during a sell-out.' } }
        ],
        edges: [
          { from: 'client', to: 'edge', label: 'HTTPS' },
          { from: 'edge', to: 'waiting', label: 'queue' },
          { from: 'edge', to: 'browse', label: 'pages' },
          { from: 'edge', to: 'booking', label: 'token' },
          { from: 'browse', to: 'cache', label: 'seat map' },
          { from: 'browse', to: 'search', label: 'query' },
          { from: 'booking', to: 'seatdb', label: 'hold txn' },
          { from: 'booking', to: 'pay', label: 'charge' },
          { from: 'pay', to: 'provider', label: 'authorise' },
          { from: 'booking', to: 'orders', label: 'order' },
          { from: 'booking', to: 'events', label: 'confirmed', style: 'async' },
          { from: 'events', to: 'notify', style: 'async' },
          { from: 'sweeper', to: 'seatdb', label: 'release' }
        ],
        scenarios: [
          { id: 'sale', label: 'Hot on-sale and purchase', steps: [
            { title: 'Arrival spike', path: ['client', 'edge'], tone: 'hard', note: 'At 10:00 a million clients arrive. The edge serves static assets and filters obvious bots and floods before anything reaches the application.' },
            { title: 'Join the queue', path: ['edge', 'waiting'], note: 'Each verified account gets a place in the waiting room (random within the first minutes, for fairness). The page polls for position, served from memory at the edge.' },
            { title: 'Admission', path: ['edge', 'booking'], note: 'At about 100 admits per second the waiting room releases users with a signed, time-limited token. The booking service accepts only requests carrying one.' },
            { title: 'Hold seats', path: ['booking', 'seatdb'], tone: 'accent', note: 'One transaction runs a conditional update per seat. If every row changes, the seats are held for 8 minutes; if any does not, nothing is held and the user gets a fast "taken" answer.' },
            { title: 'Pay', path: ['booking', 'pay', 'provider'], note: 'The payment service authorises the card with an idempotency key. The provider answers synchronously, or later through a webhook.' },
            { title: 'Confirm', path: ['booking', 'seatdb'], tone: 'ok', note: 'A second conditional update changes HELD to SOLD only if this hold still owns the seat and has not expired. Then the order and tickets are written.' },
            { title: 'Record and announce', path: ['booking', 'orders'], note: 'The order, tickets and payment state commit to the durable orders database, and an event goes out so tickets are emailed and caches update.' }
          ] },
          { id: 'browse', label: 'Browse on a normal day', steps: [
            { title: 'Search', path: ['client', 'edge', 'browse', 'search'], note: 'Search runs on the index and a cache. The result is seconds stale, which is acceptable.' },
            { title: 'Seat map', path: ['browse', 'cache'], note: 'Availability comes from a snapshot refreshed every second or two. The booking database is not touched.' },
            { title: 'Seat shown but gone', path: ['client', 'edge', 'booking', 'seatdb'], tone: 'hard', note: 'A user picks a seat that was just taken. The conditional update changes zero rows, so the hold fails cleanly and the UI refreshes the map.' }
          ] },
          { id: 'expiry', label: 'Hold expires', steps: [
            { title: 'User walks away', path: ['seatdb'], note: 'The 8 minutes pass with no payment. The hold is now logically expired: any later hold request will treat the seat as available.' },
            { title: 'Sweeper releases', path: ['sweeper', 'seatdb'], tone: 'ok', note: 'The sweeper flips expired seats back to AVAILABLE in batches, using the expiry index, and emits events so the cache and waiting room can admit more users.' },
            { title: 'Late payment fails', path: ['booking', 'seatdb'], tone: 'hard', note: 'If the original user submits payment after expiry, the confirm update matches zero rows because the hold no longer owns the seat, and the authorisation is voided or refunded.' }
          ] }
        ]
      },
      walkthrough: [
        '**Browse**: edge, cache and search index; stale by seconds; never the booking database.',
        '**Hot sale**: edge filters, waiting room shapes 1,000,000 arrivals into about 100 admits a second with signed tokens.',
        '**Hold**: one transaction of conditional updates, all seats or none, 8-minute expiry.',
        '**Pay and confirm**: authorise with an idempotency key, then a conditional HELD to SOLD update that re-checks the hold, then durable order and tickets, then asynchronous delivery.',
        '**Failure modes**: payment timeout (reconcile by idempotency key), expired hold at confirm (void the charge), booking node crash (the database transaction is atomic), notification lost (order page still shows tickets).'
      ],
      notes: ['A strong answer states the order: shape the traffic, then make the one hot row correct, then make money idempotent.']
    },
    deepDives: [
      { id: 'double-booking', title: 'Preventing double booking',
        question: 'Ten thousand people click the same front-row seat in the same second. How do you guarantee exactly one wins?',
        answer: 'Let the database decide, with **one atomic conditional update per seat**: set status to HELD only `WHERE` it is AVAILABLE (or its old hold has expired), and check how many rows changed. The row is locked for the duration of the statement, so concurrent updates serialise and exactly one sees one row affected; everyone else sees zero and is told the seat is taken.\n\nFor several seats, do all updates in **one transaction** and roll back unless every row changed, so a user never ends up holding half their selection. At confirm, a second conditional update moves HELD to SOLD only if `hold_id` still matches and the hold has not expired. A unique constraint on `ticket (event_id, seat_id)` is a final safety net: even a bug elsewhere cannot sell a seat twice.\n\nThis avoids long-held locks (a user thinking for 3 minutes holds no database lock; the hold is just data with an expiry) and avoids a distributed lock whose expiry can silently let two holders proceed. Walk through it: the first hold wins, a concurrent second gets 0 rows, the second succeeds once the first hold has expired, and the first user\'s late confirm then fails.',
        followups: [
          { q: 'Why not a pessimistic lock with SELECT FOR UPDATE for the whole checkout?', a: 'It would hold row locks while a human decides and while the payment provider responds, so a handful of slow users could block others and exhaust connections. The hold-as-data approach has a lock lifetime of one statement.' },
          { q: 'How do you avoid deadlocks when users pick overlapping seat sets?', a: 'Always update seats in a fixed order (sorted by seat ID) inside the transaction. Opposite orderings are what create lock cycles.' },
          { q: 'What if the seat database fails over mid-transaction?', a: 'An uncommitted transaction rolls back; a committed one was synchronously replicated, so the new primary has it. The client retries with the same idempotency key and gets the same hold or a clean failure.' }
        ] },
      { id: 'holds', title: 'Holds, timeouts and releasing seats',
        question: 'Users hold seats then disappear. How do you time holds out without hurting correctness or fairness?',
        answer: 'A hold is **data with an expiry**: `status = HELD`, `hold_id`, and `hold_expires_at`. Treat an expired hold as available everywhere: the hold update accepts `status = \'HELD\' AND hold_expires_at <= now`, and the confirm update requires `hold_expires_at > now`. Correctness then never depends on a background job running on time.\n\nA **sweeper** (an indexed scan on `hold_expires_at`) physically releases expired seats, fixes availability counts and emits events so the cache refreshes and the waiting room can admit more users. Pick a TTL that balances a human checkout (about 8 minutes) against inventory locked by people who will not buy: shorter in a hot sale, longer for normal sales. Let the user extend once if payment is in progress, and tell them the time left.\n\nTrade-off: each abandoned hold briefly hides a seat from others. In a hot sale that is real money lost to idle holds, which is why admission rate and per-account hold limits matter.',
        followups: [
          { q: 'What if payment is in flight when the hold expires?', a: 'Extend the hold when payment starts (a short, one-time extension), and make the confirm re-check ownership. If expiry still wins, void the authorisation and tell the user, rather than charging and failing to deliver.' },
          { q: 'Can a user hold unlimited seats?', a: 'No. Cap seats per hold and holds per account, otherwise one user or bot can lock inventory for the whole TTL repeatedly.' },
          { q: 'How do you count available seats cheaply?', a: 'Maintain per-section counters updated on hold, release and sale, or snapshot counts into the cache each second. Do not run COUNT(*) over 50,000 rows per page view.' }
        ] },
      { id: 'waiting-room', title: 'Flash-sale traffic and the waiting room',
        question: 'A million people arrive for 50,000 seats. How does the system survive and stay fair?',
        answer: 'Shape the load instead of scaling to it. Put a **waiting room** in front of the booking tier. Visitors join a virtual queue, get a signed token with a position, and poll cheaply (answered from the edge or memory). The room admits users at a **controlled rate** based on what the seat store and payment provider can sustain: about 100 admits a second here, which keeps roughly 5,000 active shoppers.\n\nThe admission token is signed, time-limited and tied to the account; the booking service refuses holds without it. For fairness, do **not** order by arrival time in the first minutes (that rewards bots and fast networks); assign random positions to everyone who joined before the sale opened, or in the first window, then first-come afterwards.\n\nMake failure honest: when seats run out, tell the queue immediately ("sold out") instead of making 900,000 people wait to find out. Pre-scale caches and warm the edge before the sale; the booking tier needs spare capacity, not enormous capacity, because its input rate is capped.',
        followups: [
          { q: 'What if the waiting room itself goes down?', a: 'Fail closed to a static "high demand" page served by the CDN, never open to the booking tier. Keep the queue state in a replicated store so a restart does not reshuffle positions.' },
          { q: 'How do you choose the admit rate?', a: 'Load test the slowest dependency, usually payment or the hot shard, take 60 to 70% of it, and adjust live from error rates and latency (a feedback controller). A fixed number is the starting guess.' },
          { q: 'What do users who are not admitted experience?', a: 'A position, an estimate, and a clear outcome. For the hottest events, a pre-registration lottery avoids the stampede entirely and is arguably the fairest design, at the cost of product complexity.' }
        ] },
      { id: 'payments', title: 'Payments and idempotency',
        question: 'The charge request times out. Did the customer pay? How do you avoid charging twice or selling without payment?',
        answer: 'Use an **idempotency key** end to end. The client generates a key per checkout attempt; the booking service stores it with the order (unique per user) and passes it to the payment provider, so repeating the request returns the original result instead of a second charge.\n\nRun the flow as a small **state machine** on the order: `PENDING` (hold exists, payment started), then `CONFIRMED` or `FAILED`. Authorise first, then run the conditional HELD to SOLD update, then **capture**; if the seat update fails, void the authorisation. Never hold a database transaction open across the provider call.\n\nFor ambiguous timeouts, mark the order `PENDING`, and let a **reconciliation job** query the provider by idempotency key and settle the order. Webhooks may arrive late, twice or out of order, so handlers are idempotent and only move the state forward.',
        followups: [
          { q: 'What if the webhook says paid but the hold already expired?', a: 'The confirm update fails, so refund or void automatically and notify the user. A payment without a seat must never silently stay captured.' },
          { q: 'Why authorise then capture instead of charging immediately?', a: 'It lets you release the money cleanly if the seat sale fails after the card is approved, avoiding refunds that take days to appear.' },
          { q: 'How do you make "the order exists exactly once" robust?', a: 'A unique index on (user_id, idempotency_key) on orders, plus the unique constraint on (event_id, seat_id) in tickets. Two layers: a retry cannot create a second order and a bug cannot create a second ticket.' }
        ] },
      { id: 'consistency', title: 'Consistency versus availability',
        question: 'Where do you choose strong consistency and where is eventual consistency fine?',
        answer: 'Split by the cost of being wrong. **Seat state and money** need strong consistency per event: showing "sold" for a seat that is in fact free is a minor annoyance, but selling one seat twice is a failure. So seat holds, orders and payments go to a strongly consistent primary with synchronous replication, and during a partition the booking path would rather refuse (CP) than risk a double sale.\n\n**Browse, search, seat-map display and notifications** are eventually consistent (AP): caches and replicas seconds behind are fine, because the hold call makes the final decision. That keeps browsing available and fast even when the booking core is degraded.\n\nBecause events are independent, strong consistency is only needed **within one event**: shard by event, give each a single home region, and you never need a global transaction or cross-region consensus on the hot path.',
        followups: [
          { q: 'Could you run active-active across regions?', a: 'Not for the same event\'s seats without consensus, which adds latency to every hold. Run different events in different regions, keep a warm standby replica per event, and fail over with synchronous replication so no confirmed sale is lost.' },
          { q: 'What if the seat database is unreachable during a sale?', a: 'Stop admitting from the waiting room, keep serving the browse side, and show an honest status. Selling from a cache of seat state "to stay available" would risk double sales.' }
        ] },
      { id: 'browse', title: 'Search, browse and the seat map at scale',
        question: 'Everyone watches the same event page and seat map while the sale runs. How do you keep that from taking down booking?',
        answer: 'Make the read side independent of the booking database. Publish **snapshots**: the booking core emits seat change events, a consumer rebuilds a compact per-event availability view (section counts and a seat bitmap) in a cache every second or two, and the page reads only that. Use CDN caching with a short TTL for the JSON, and **request coalescing** so a stampede on the cache key triggers one refresh.\n\nFor huge venues, show section-level counts and **best available** instead of a 50,000-seat grid; the payload shrinks from hundreds of KB to a few KB and users make fewer contending clicks on the same seats. Search runs on a separate index fed by a change stream and ranks by date and popularity.\n\nBe explicit that staleness is a feature: the page may show a seat as free that just sold, and the hold call is authoritative.',
        followups: [
          { q: 'How do you push live availability to the page?', a: 'Poll the cached snapshot every few seconds, or use server-sent events from the cache tier. Updating every second for every viewer is not necessary: users pick, then the hold decides.' },
          { q: 'How do you stop users from all picking the same best seats?', a: 'Best-available allocation: the server picks seats for the user from a randomised pool, spreading contention. Offer manual selection but warn that popular seats go quickly.' }
        ] },
      { id: 'bots', title: 'Bots, scalpers and fairness',
        question: 'Scripts buy most of the inventory in seconds. What do you do?',
        answer: 'Layer defences, since none is perfect. At the **edge**: rate limits per IP, device and account, bot detection, and challenges. At **account level**: require verified accounts created before the on-sale, limit one queue entry per account and device, and cap tickets per order and per account. In the **waiting room**: random ordering in the opening window removes the benefit of speed, and signed single-use admission tokens stop token sharing.\n\nAt **checkout**: payment method checks and velocity limits (many orders from one card or address), plus post-sale review that cancels suspicious orders and returns seats to the pool. For the highest-demand events consider a **verified-fan lottery**.\n\nBe candid: determined adversaries with real accounts and human farms remain; the goal is to raise their cost and keep the median human fair, not to claim perfect prevention.',
        followups: [
          { q: 'Does a CAPTCHA solve it?', a: 'It raises the cost but is routinely bypassed by solving services and hurts real users, particularly with accessibility needs. Use it as one signal among device, behaviour and account history.' },
          { q: 'How do you cancel suspicious orders safely?', a: 'Hold them in a review window before releasing tickets to the buyer, then cancel through the normal refund path and re-release seats. Communicate clearly to avoid punishing legitimate buyers.' }
        ] }
    ],

    bottlenecks: [
      { title: 'The hot event shard', problem: 'One popular event concentrates all seat updates on one primary, and a few seats receive most of the attempts.', mitigation: 'Cap input with the waiting room, make each failed attempt a single cheap statement, use best-available allocation to spread contention, and optionally front the shard with a per-event single-writer queue or Redis accelerator.' },
      { title: 'Payment provider throughput and latency', problem: 'The provider takes seconds per call and rate-limits requests; a hold is locked while the user waits on a slow charge.', mitigation: 'Set the admit rate from the provider\'s limits, authorise asynchronously, extend holds once while payment is in progress, and keep a second provider or retry path.' },
      { title: 'Waiting-room poll traffic', problem: 'A million waiting users polling every 10 seconds is about 100,000 requests a second of pure overhead.', mitigation: 'Serve polls from the edge or an in-memory store, lengthen intervals as positions grow, use server-sent events, and keep the queue off the booking database entirely.' },
      { title: 'Idle holds locking inventory', problem: 'Abandoned holds hide seats for the whole TTL, so a sold-out sale may reopen minutes later and confuse users.', mitigation: 'Shorter TTL in hot sales, a single extension during payment, per-account hold caps, a visible countdown, and fast release events to the queue.' },
      { title: 'Stale availability and user frustration', problem: 'Cached seat maps show seats that are already gone, and users see repeated "taken" errors.', mitigation: 'Refresh snapshots every second, show section-level availability and best-available, refresh the map automatically after a failed hold, and keep error messages specific.' }
    ],

    mistakes: [
      'Checking availability with a SELECT and then updating in a separate step (a classic race), instead of one conditional update.',
      'Holding **database locks or transactions** open while the user thinks or the payment provider responds.',
      'Using a **distributed lock** as the only protection, with no database constraint behind it.',
      'No hold expiry, or relying on a background job as the only way seats are released.',
      'Charging the card **before** securing the seat, or confirming a seat without checking the hold is still valid.',
      'No **idempotency key** on payments, so a retry double charges.',
      'Letting the spike hit the booking database directly, with no waiting room or admission control.',
      'Trying to make the whole system strongly consistent (and slow), including browse and search.',
      'Ordering the queue by raw arrival time and ignoring that it rewards bots.',
      'Ignoring the sold-out experience: making everyone wait to be told no.'
    ],

    pushes: [
      { q: 'How exactly do you guarantee a seat is not sold twice?', why: 'This is the core of the problem; vague answers fail it.', good: 'Conditional update with rows-affected check inside a transaction, ordered seat updates, a unique constraint on tickets, expiry checked at hold and confirm, and an explanation of why it needs no long locks.' },
      { q: 'Why not use Redis locks for this?', why: 'Tests understanding of lock expiry and failover.', good: 'A lock can expire during a GC pause or lose state on failover, letting two holders through. Use Redis as an accelerator at most, with the database conditional update as the authority.' },
      { q: 'What happens if the payment succeeds but your service crashes before confirming?', why: 'Failure between two systems.', good: 'Order is PENDING with an idempotency key; a reconciliation job asks the provider, then completes the order if the hold is still valid or refunds if not. Webhooks and retries are idempotent.' },
      { q: 'How would you handle ten times the traffic?', why: 'Where the design actually breaks.', good: 'The waiting room already caps load, so scale the edge and poll tier, pre-warm caches, and examine the admit rate against the hot shard and payment limits. More events scale by sharding by event, not by making one event faster.' },
      { q: 'Is the waiting room fair?', why: 'Fairness is a product and engineering question.', good: 'Randomise in the opening window, one entry per verified account, signed tokens, honest messaging, and a lottery for the hottest events. Admit that bots with real accounts remain a residual risk.' },
      { q: 'How do you handle general admission (no seat map)?', why: 'Variation that checks flexibility.', good: 'A counter per ticket type decremented with a conditional update (`UPDATE ... SET remaining = remaining - :n WHERE remaining >= :n`), holds as counter reservations with expiry. Much less contention than individual seats, but the hot row is one counter, so shard it into several sub-counters if needed.' }
    ],

    quiz: [
      { kind: 'concept', q: 'What makes exactly one of many simultaneous requests win a seat?', choices: ['An atomic conditional update that changes the row only if it is still available', 'A SELECT to check availability followed by a separate UPDATE', 'Retrying until the page shows the seat as free', 'Caching seat status in the browser'], answer: 0, explain: 'The database serialises concurrent updates to one row, and the rows-affected count tells each caller if it won. A separate SELECT then UPDATE is a race.' },
      { kind: 'concept', q: 'Why should the payment provider call stay outside the seat database transaction?', choices: ['A slow network call would hold locks and exhaust connections', 'Providers cannot be called from a server', 'Transactions cannot contain INSERT statements', 'The call must happen before any database access'], answer: 0, explain: 'Hold the seat as data with an expiry, then call the provider. Locks should last only one short statement.' },
      { kind: 'concept', q: 'What problem does the idempotency key solve?', choices: ['A retried or duplicated payment request returns the original result instead of charging twice', 'It encrypts the card number', 'It orders the waiting room', 'It speeds up the seat map'], answer: 0, explain: 'After a timeout the client cannot know whether the charge happened. Replaying the same key is safe.' },
      { kind: 'concept', q: 'A user pays after their hold expired and another user now holds the seat. What should happen?', choices: ['The confirm update affects zero rows; void or refund the payment', 'Sell the seat to both users', 'Overwrite the second hold', 'Ignore the payment and keep the money'], answer: 0, explain: 'Confirm requires that the hold still owns the seat and has not expired. If it does not, the authorisation is voided.' },
      { kind: 'concept', q: 'Why use a waiting room for a flash sale?', choices: ['To convert a huge arrival spike into a steady, capacity-matched admit rate', 'To make the checkout page prettier', 'To store seat data', 'To replace the payment provider'], answer: 0, explain: 'You cannot cheaply scale a strongly consistent seat store 500 times for a few minutes. Admission control protects it and gives users honest feedback.' },
      { kind: 'concept', q: 'Pick every part that can be eventually consistent without harming correctness.', choices: ['Search results', 'Seat-map display snapshots', 'The HELD to SOLD seat update', 'Ticket confirmation emails'], answer: [0, 1, 3], explain: 'Display data is advisory because the hold call decides. The seat state update must be strongly consistent.' },
      { kind: 'concept', q: 'Why is a distributed lock alone a poor guard against double booking?', choices: ['Its lease can expire or be lost on failover, so two holders can proceed', 'Locks are too fast', 'It cannot be released', 'It forces strong consistency on browse pages'], answer: 0, explain: 'Put the invariant in the database (conditional update plus unique constraint) where it is enforced at commit.' }
    ],

    flashcards: [
      { id: 'tb-hold', front: 'How do you hold a seat without double booking?', back: 'One conditional UPDATE (status AVAILABLE or expired hold) and check rows affected; all seats of an order in one transaction, ordered by seat id. Unique (event_id, seat_id) on tickets as backup.' },
      { id: 'tb-expiry', front: 'How do holds expire?', back: 'Store hold_expires_at; treat expired as available on every hold and confirm. A sweeper only tidies counts. Correctness never depends on the sweeper.' },
      { id: 'tb-room', front: 'What does a waiting room do?', back: 'Queues arrivals and admits them at a controlled rate (matched to seat store and payment capacity) with signed tokens. Polling is served from the edge, and random order early on improves fairness.' },
      { id: 'tb-idem', front: 'How do you avoid double charges?', back: 'Idempotency key per checkout, stored with the order and sent to the provider; PENDING state plus reconciliation for ambiguous timeouts; idempotent webhooks.' },
      { id: 'tb-cp', front: 'Consistency choices in ticket booking?', back: 'Seat state and money: strong consistency per event, prefer refusing to double selling. Browse, search, seat-map display: eventually consistent caches. The hold call is authoritative.' },
      { id: 'tb-flow', front: 'Order of events in checkout?', back: 'Hold seats, authorise payment, conditional HELD to SOLD (re-check hold), capture, write order and tickets, emit events. Void the authorisation if the seat step fails.' },
      { id: 'tb-bots', front: 'Defences against bots in a flash sale?', back: 'Edge rate limits and bot detection, verified accounts, one queue entry per account, per-order and per-account caps, random early ordering, review of suspicious orders, lottery for the hottest events.' }
    ]
  });
})();
