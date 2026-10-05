/* System design case study: ride matching (Uber-style). Schema: data/sd/schema.md. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'ride-matching',
    title: 'Design a ride-matching service',
    short: 'Track a million moving drivers, find the nearest ones for a rider, and assign exactly one. Geospatial indexing, dispatch and a trip state machine.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Geospatial', 'Real-time', 'Dispatch'],
    prompt: 'Design the backend for a ride-hailing app like Uber. Drivers stream their location, riders request a ride, and the system matches each rider with a nearby driver and tracks the trip until it ends.',

    requirements: {
      functional: [
        'Drivers go online and stream their location; riders see nearby available drivers.',
        'A rider requests a ride from a pickup point to a destination and sees a fare estimate and an ETA first.',
        'The system **matches** the request to a nearby available driver, who can accept or decline.',
        'Both sides see live trip progress: driver approaching, arrived, in trip, completed.',
        'Cancellation by either side, with the right state transitions.',
        'Fare calculation at the end, with surge pricing when demand exceeds supply.'
      ],
      nonFunctional: [
        '**Match latency**: a rider hears back within a few seconds of requesting. Aim for a p99 of about 10 seconds including the driver\'s response time.',
        '**No double assignment**: one driver is never on two trips and one request never gets two drivers. This is a correctness rule, not a best effort.',
        '**Location freshness**: a driver position older than roughly 10 to 15 seconds is treated as unknown.',
        '**Availability** of the request and trip path matters more than perfect location accuracy. Losing a few pings is fine; losing a trip is not.',
        '**Scale** (stated assumption): about 500 thousand drivers online on a typical day, one ping every 4 seconds each, about 5 million trips a day.'
      ],
      outOfScope: ['Payments and payouts (see the payment system case).', 'Driver onboarding, document checks and ratings.', 'Pooled or shared rides and multi-stop trips.', 'Building the map and the routing engine itself.', 'Fraud and safety features.'],
      assumptions: ['One city or region is served by one shard of the matching system; cities are independent.', 'A routing and ETA service exists and can be called.'],
      clarify: [
        { q: 'Do we match one rider at a time, or batch requests and optimise globally?', a: 'Start with greedy matching: take the request, offer it to the best nearby driver. Mention that a short batching window (a few seconds) lets you solve a small assignment problem across many riders and drivers and improves overall wait time, at the cost of a deliberate delay.' },
        { q: 'How accurate must "nearest" be: straight-line or road distance?', a: 'Use straight-line distance to shortlist candidates cheaply, then rank the shortlist by routed ETA. Road distance for every driver in range is too expensive.' },
        { q: 'Is it acceptable to show a slightly stale map of drivers?', a: 'Yes, for the rider\'s map a delay of a few seconds is invisible. For the dispatch decision itself, check the driver\'s current state transactionally, not from the map data.' },
        { q: 'Single region or global?', a: 'Treat each metro area as an independent cell. Almost nothing crosses city boundaries, which makes partitioning by geography natural.' }
      ]
    },

    estimates: {
      intro: 'Model the driver as the "user". About 500 thousand drivers are online on a typical day, each online roughly 8 hours (28,800 seconds). A ping every 4 seconds is about 7,200 updates per driver per day. Reads are the rider-side calls (nearby drivers, ETA, trip status), about 500 per driver per day when each driver does about 10 trips and every trip drives roughly 50 rider reads (a few searches plus status polls).',
      inputs: { dau: 500e3, writesPerUser: 7200, readsPerUser: 500, peakFactor: 3, bytesPerWrite: 100, bytesPerRead: 500, years: 0.1, replication: 3, hotFraction: 0.2, serverQps: 3000, utilization: 0.6 },
      assumptions: [
        '**100 bytes per ping**: driver id, latitude, longitude, heading, speed, timestamp and a status flag, in a compact binary or JSON form.',
        '**Raw pings are kept about 36 days** (0.1 year) for disputes and analytics; older data is aggregated or dropped.',
        'Peak is **3 times** average for commute hours and events.',
        'An ingest server handles **3,000 location updates a second** (parse, validate, write to the in-memory index).',
        'Read bytes (500) approximate a short JSON response with a handful of nearby drivers.'
      ],
      extra: [
        { label: 'Trips per day', formula: '500K drivers x 10 trips', result: '~5 million (about 58 a second on average)' },
        { label: 'Current-position state', formula: '500K drivers x 100 B', result: '~50 MB (fits in memory on one box; replicate it)' },
        { label: 'Geohash precision 6 cell', formula: '~1.2 km x 0.6 km (approximate)', result: 'a good driver-search cell size in a city' },
        { label: 'Candidate pool per search', formula: 'own cell + 8 neighbours, 5 to 10 drivers each', result: '~50 to 90 drivers to rank' }
      ],
      notes: [
        'This is a **write-heavy** system: about 42,000 location writes a second on average and 125,000 at peak, against only about 3,000 rider reads a second. Most of the load is location ingest, not matching.',
        'Trips are rare by comparison (about 58 a second). The transactional, correctness-critical part is small; the high-volume part tolerates loss.',
        'The live position of every driver is about 50 MB. Keep **only the latest position in memory**, and write the history to a log or time-series store asynchronously.',
        'Raw ping history is the large number: about 13 TB for 36 days and about 39 TB replicated. That is storage for a log, not for the matching path.',
        'Ingest alone needs dozens of servers at peak, which is why the location path is split from the trip path and scaled separately.'
      ]
    },

    api: [
      { method: 'PUT', path: '/v1/drivers/me/location', desc: 'Driver app reports its position. Sent every few seconds over a long-lived connection, not a new HTTP request each time.',
        request: '{\n  "lat": 37.7749,\n  "lng": -122.4194,\n  "heading": 90,\n  "speedKmh": 32,\n  "status": "available",\n  "ts": 1767312000\n}',
        response: '204 No Content',
        notes: ['At 42,000 writes a second, use a **persistent connection** (WebSocket or a gRPC stream) and batch on the client when the network is poor.', 'Fire and forget: a lost ping is replaced by the next one. Do not retry old pings.'] },
      { method: 'GET', path: '/v1/rides/estimate?pickup=lat,lng&dest=lat,lng', desc: 'Fare range and pickup ETA before the rider commits.',
        response: '{\n  "fare": { "min": 1400, "max": 1800, "currency": "USD", "surge": 1.2 },\n  "pickupEtaSeconds": 240\n}',
        notes: ['Money in **integer minor units** (cents). The surge multiplier shown here is locked into the request so the rider is not surprised later.'] },
      { method: 'POST', path: '/v1/rides', desc: 'Request a ride. Starts matching.',
        request: '{\n  "pickup": { "lat": 37.7749, "lng": -122.4194 },\n  "dest": { "lat": 37.8044, "lng": -122.2712 },\n  "productType": "standard"\n}',
        response: '{ "rideId": "r_8f3a", "state": "REQUESTED" }',
        notes: ['Needs an `Idempotency-Key` header. A double tap on the request button must not create two rides.', 'Returns immediately. The match result arrives through push or by polling the ride.'] },
      { method: 'GET', path: '/v1/rides/{rideId}', desc: 'Current trip state, driver and position. The fallback when push is not connected.',
        response: '{\n  "rideId": "r_8f3a",\n  "state": "DRIVER_ASSIGNED",\n  "driver": { "id": "d_41", "lat": 37.7761, "lng": -122.4170, "etaSeconds": 190 }\n}',
        notes: ['Cheap, cacheable for about a second, and returns a `version` so clients ignore out-of-order updates.'] },
      { method: 'POST', path: '/v1/offers/{offerId}/accept', desc: 'Driver accepts an offered ride (a decline is the same path with `/decline`).',
        notes: ['This is the **atomic claim**: it succeeds only if the offer is still valid and the driver is still free. Return **409** if the offer expired or the ride was already taken.'] },
      { method: 'POST', path: '/v1/rides/{rideId}/cancel', desc: 'Cancel before the trip starts. Allowed states depend on who cancels.',
        notes: ['Cancelling after assignment may carry a fee and must release the driver back to `available` in the same transaction as the state change.'] }
    ],
    apiNotes: ['Authenticate the driver socket once and bind it to a driver id; never trust an id in the message body.', 'Every state-changing call carries the ride `version` it saw, so a stale client cannot overwrite newer state.'],

    data: {
      intro: 'There are two very different kinds of data. **Driver location** is high-volume, ephemeral and only the latest value matters. **Rides** are low-volume, durable, transactional and have a strict state machine. Use a different store for each.',
      entities: [
        { name: 'driver_location (in-memory geo index)', purpose: 'Latest position per driver, indexed by cell. Rebuilt from fresh pings if lost, so it needs no durability.', fields: [
          ['driver_id', 'string, key', ''],
          ['lat, lng', 'float32 x 2', 'Last reported position.'],
          ['cell', 'string or int64', 'Geohash or S2 cell id at the search level, derived from lat and lng.'],
          ['status', 'enum', '`offline`, `available`, `reserved`, `on_trip`. Kept here only as a hint for search; the authority is the driver state record.'],
          ['updated_at', 'timestamp', 'Entries older than about 15 seconds are skipped and then evicted.']
        ] },
        { name: 'ride', purpose: 'One row per trip request. The system of record for state, with a version for optimistic concurrency.', fields: [
          ['ride_id', 'string, primary key', 'Unique, client-safe id.'],
          ['rider_id', 'bigint', 'Indexed to find the rider\'s active ride.'],
          ['driver_id', 'bigint, nullable', 'Set when assigned.'],
          ['state', 'enum', '`REQUESTED, MATCHING, DRIVER_ASSIGNED, DRIVER_ARRIVED, IN_TRIP, COMPLETED, CANCELLED, NO_DRIVER`.'],
          ['version', 'int', 'Incremented on every transition; transitions are compare-and-set on it.'],
          ['pickup, dest', 'lat/lng pair', ''],
          ['surge_multiplier, fare_estimate', 'decimal, int (cents)', 'Locked at request time.'],
          ['created_at, updated_at', 'timestamp', '']
        ] },
        { name: 'driver_state', purpose: 'Authoritative availability of each driver, separate from the noisy location stream.', fields: [
          ['driver_id', 'bigint, primary key', ''],
          ['state', 'enum', '`offline`, `available`, `reserved`, `on_trip`.'],
          ['current_ride_id', 'string, nullable', 'At most one. Guarded by a conditional update.'],
          ['version', 'int', 'For compare-and-set.']
        ] },
        { name: 'ride_event (append-only log)', purpose: 'Every transition and offer, for audit, support and analytics.', fields: [
          ['ride_id', 'string', 'Partition key.'], ['seq', 'int', 'Order within the ride.'], ['type, payload', 'string, json', ''], ['ts', 'timestamp', '']
        ] }
      ],
      storage: [
        { title: 'Driver locations: in-memory store (Redis-style geo index or a custom service)', verdict: 'Latest position only',
          body: 'A sorted set keyed by cell, or a hash from cell to a set of drivers, answers "who is in these nine cells" in microseconds. Writes are a map update. Partition by city or by cell range so one machine holds a region. Because only the latest value matters, a node loss is healed by the next round of pings (a few seconds), so replication is for fast failover, not durability.\n\nAppend every ping to a log (Kafka-style) in parallel. That feeds trip-path replay, ETA models and analytics without touching the hot index.' },
        { title: 'Rides and driver state: a transactional store (SQL or a strongly consistent key-value store)', verdict: 'Needs transactions',
          body: 'The data is small (about 5 million rides a day, a few hundred bytes each) but the rules are strict: a transition must happen once, and a driver must belong to at most one active ride. A relational database gives conditional updates and transactions directly:\n\n```\nUPDATE driver_state\n   SET state = \'reserved\', current_ride_id = :ride, version = version + 1\n WHERE driver_id = :driver AND state = \'available\';\n-- 1 row updated: claimed. 0 rows: someone else got there first.\n```\n\nShard by city or by ride id. Many teams put a cache or in-memory lock in front for the hot path, but the conditional write on the durable record is the source of truth.' }
      ],
      decisions: [
        { title: 'Geospatial index', question: 'Which structure answers "available drivers within a few kilometres of this point" when 125,000 positions change per second?',
          options: [
            { name: 'Geohash cells in a hash map', pros: 'A cell is a string prefix; nearby points share a prefix. Moving a driver is delete-from-old-cell plus add-to-new-cell, both O(1). Easy to shard by prefix and to store in any key-value system.', cons: 'Cells are rectangles that get narrower toward the poles. Two points close together can have very different prefixes at a cell edge, so you must always query the **neighbouring cells** too. Fixed cell size does not adapt to density.' },
            { name: 'Quadtree', pros: 'Subdivides dense areas more and sparse areas less, so each leaf holds a bounded number of drivers. Range queries are natural.', cons: 'A tree in memory is harder to update at 125K moves a second, and it is awkward to share between servers and to rebuild. Splitting and merging leaves under constant movement is real work.' },
            { name: 'S2 or H3-style cells (hierarchical cells on a sphere)', pros: 'Cells are more uniform in size, there is a built-in way to get a cover of a circle at a chosen level, and cell ids are 64-bit integers that sort well.', cons: 'Needs a library, and the concept is less familiar. For a whiteboard answer, the benefit over geohash is better geometry, not a different design.' },
            { name: 'SQL with a spatial index (PostGIS-style)', pros: 'Powerful queries and a mature R-tree index.', cons: 'Index maintenance under 125K updates a second is expensive and disk-backed. Fine for the ride table, wrong for live positions.' }
          ],
          pick: '**A uniform grid of cells (geohash or S2) held in memory, one map per city.** Query the driver\'s own cell and its eight neighbours, rank by routed ETA. It is the simplest structure that matches the write rate. Say that a quadtree is the right answer when density varies enormously and you want adaptive cells, and that you would pick the cell level from typical driver density (about 1 km cells in a city).' },
        { title: 'Rider app updates: push or polling', question: 'How does the rider learn that a driver was assigned and see the car move?',
          options: [
            { name: 'Short polling (GET every 2 to 5 seconds)', pros: 'Trivial, stateless, works through any proxy, and recovers by itself after a disconnect.', cons: 'Wasteful: most responses say "no change". Latency is up to one interval. Millions of idle polls add load.' },
            { name: 'WebSocket or server-sent events', pros: 'Instant updates, one small message per change, and far fewer requests. The same channel carries driver positions and trip transitions.', cons: 'Stateful connections: you must route a message to the server holding that user\'s socket, handle reconnects and resync, and size the gateway for millions of open sockets.' },
            { name: 'Mobile push notifications (APNs, FCM)', pros: 'Reaches the app when it is backgrounded.', cons: 'Best-effort delivery with no ordering or timing guarantee. Good for "driver arriving", not for live map movement.' }
          ],
          pick: '**WebSocket (or SSE) while the app is open, with a push notification for key transitions and a poll as the resync path.** On every reconnect the client fetches the current ride (with its `version`), so a missed message never leaves it wrong.' }
      ]
    },

    design: {
      intro: 'Split the system along its two workloads. A **location path** takes a firehose of pings into an in-memory geo index and a log. A **trip path** is a small transactional service that owns rides and the driver-claim step. **Dispatch** sits between them: it reads the geo index to shortlist, asks routing to rank, then claims a driver through the trip store. **Click any box** for the reasoning, or pick a scenario to trace.',
      diagram: {
        title: 'Ride matching high-level design',
        nodes: [
          { id: 'rider', label: 'Rider app', kind: 'client',
            detail: { why: 'Requests rides, shows nearby cars and trip progress. Holds a WebSocket while open and falls back to polling the ride, so a lost message never leaves it wrong.', tradeoffs: ['Mobile networks drop constantly: every request needs an idempotency key and every update carries a version.', 'A backgrounded app cannot hold a socket, so key transitions also go out as push notifications.'], scale: 'Millions of open sockets during commute peaks; the gateway fleet is sized by connections, not requests.' } },
          { id: 'driverapp', label: 'Driver app', kind: 'client',
            detail: { why: 'Streams a location ping every few seconds and receives ride offers. It is the source of almost all write traffic.', tradeoffs: ['Ping interval trades freshness against battery, data and server load. Adaptive intervals (slower when idle or stopped) cut load noticeably.', 'The app must accept or decline within a timeout; silence counts as a decline.'], scale: 'About 42,000 pings a second on average, 125,000 at peak, under the stated assumptions.' } },
          { id: 'gw', label: 'API and socket gateway', kind: 'lb',
            detail: { why: 'Terminates TLS, authenticates the connection once, and routes: location frames to the location service, ride calls to the ride service. Also holds the live sockets used to push updates back.', tradeoffs: ['Stateful sockets mean a message for user X must reach the gateway node that holds X. A small presence map (user to gateway node) or a pub/sub topic per user solves it.', 'Separate the ping ingress from ride API traffic so a ping surge cannot starve ride requests.'], alternatives: ['Separate gateways for ingest and for the ride API', 'Managed API gateway plus a dedicated socket tier'], scale: 'Open connection count and per-connection memory.' } },
          { id: 'loc', label: 'Location service', kind: 'service',
            detail: { why: 'Validates a ping, computes its cell, updates the in-memory index (remove from old cell, add to new) and appends it to the log. Stateless and horizontally scaled, because the state lives in the index.', tradeoffs: ['Drop pings that are out of order (older timestamp than the stored one) or physically impossible (a jump of many kilometres in seconds).', 'Shed load by sampling or by widening the interval if ingest saturates; availability beats completeness here.'], alternatives: ['Write straight to Kafka and let a consumer update the index (more buffering, more delay)'], scale: 'CPU for parsing and cell computation; first to need more instances at peak.' } },
          { id: 'geo', label: 'Geo index (in memory)', kind: 'cache',
            detail: { why: 'A map from cell to the set of available drivers with their latest position and timestamp. Answers "drivers in these nine cells" in microseconds. It holds only the present, about 50 MB for 500K drivers.', tradeoffs: ['Partition by city (or by cell range inside a very large city). Neighbour queries that cross a partition boundary must hit both partitions.', 'Not durable by design: after a restart it refills within a few ping intervals. Run a hot replica to make that gap invisible.', 'Treat entries older than about 15 seconds as absent.'], alternatives: ['Redis with geo commands or sorted sets', 'A custom in-memory service', 'A quadtree for very uneven density'], scale: 'Update rate on one hot partition (a city centre at rush hour). Split the city by cell range before CPU saturates.' } },
          { id: 'log', label: 'Location log', kind: 'queue',
            detail: { why: 'Every ping is appended to a partitioned log. Consumers build trip polylines for fare and disputes, feed ETA models, and compute supply per area for surge pricing, all off the hot path.', tradeoffs: ['At-least-once delivery: consumers must tolerate duplicates (key by driver id and timestamp).', 'Retention is a cost lever: keep days of raw pings, then compact into aggregates.'], alternatives: ['Kafka or Kinesis', 'Direct batch uploads from the driver app after the trip for the fare polyline'], scale: 'Total throughput of about 125K messages a second at peak; partition by driver id for ordering.' } },
          { id: 'ride', label: 'Ride service', kind: 'service',
            detail: { why: 'Owns the trip state machine. Creates the ride (idempotently), asks pricing for the quote, hands the request to dispatch, applies every transition as a compare-and-set on the ride version, and publishes state changes to the push path.', tradeoffs: ['One writer per ride keeps the state machine simple: route all calls for a ride id to the same shard.', 'Small volume (about 58 trips a second) means this can be strongly consistent without strain.'], alternatives: ['Event-sourced ride with a separate read model'], scale: 'Not throughput. The risks are correctness bugs and slow downstream calls (routing, pricing) blocking requests.' } },
          { id: 'pricing', label: 'Pricing service', kind: 'service',
            detail: { why: 'Computes the fare estimate and the surge multiplier per area from a supply and demand ratio over a recent window. The multiplier is locked into the ride at request time.', tradeoffs: ['Compute per cell or per region on a timer (every minute or so) and cache the result: you do not need a fresh number per request.', 'Smooth the multiplier over time and across neighbouring cells so prices do not jump block to block.', 'Surge is also a product and fairness decision, not just an algorithm.'], alternatives: ['Static time-of-day multipliers (simple, less responsive)'], scale: 'Cheap per request because of caching; the aggregation job reads the demand and supply streams.' } },
          { id: 'dispatch', label: 'Dispatch service', kind: 'service',
            detail: { why: 'Given a ride request: shortlist drivers from the geo index, rank them by routed ETA, then offer to the best one at a time (or a few in parallel) and claim the winner with a conditional write. It owns timeouts and retries until someone accepts or the search gives up.', tradeoffs: ['Offering to one driver at a time is fair and simple but slow when drivers decline. Offering to several wastes driver attention and needs the claim step to be race-safe.', 'Expand the search radius in rings if the first ring is empty, bounded by a maximum wait.', 'Stateless workers with the offer state in the ride store, so a crashed worker\'s requests are picked up by another.'], alternatives: ['Batch matching every few seconds with an assignment solver (better global outcomes, adds a short fixed delay)'], scale: 'Dispatch work per second is small (about 58 requests a second); the risk is a downstream timeout stalling matches.' } },
          { id: 'eta', label: 'Routing and ETA service', kind: 'external',
            detail: { why: 'Returns the driving time and distance between points using road graph and traffic data. Dispatch calls it to re-rank the straight-line shortlist; the estimate endpoint uses it for pickup ETA.', tradeoffs: ['Routing calls are comparatively expensive, so only call it for the top 10 to 20 candidates, never for every driver in range.', 'Have a fallback: straight-line distance divided by an average speed when routing is slow or down.', 'The engine itself is out of scope here; treat it as a service with its own SLA.'], alternatives: ['Precomputed ETA tables between cells', 'A third-party routing API'], scale: 'Latency and cost per call; add a cache keyed on pairs of coarse cells.' } },
          { id: 'db', label: 'Ride and driver store', kind: 'db',
            detail: { why: 'The durable record of rides, offers and driver state. The conditional update on `driver_state` is what guarantees a driver gets only one ride, and the version check on `ride` keeps transitions ordered.', tradeoffs: ['Needs real transactions or at least single-row conditional writes, which SQL provides directly.', 'Shard by city so most transactions stay inside one shard and cross-city travel is a rare special case.'], alternatives: ['PostgreSQL or MySQL, sharded by city', 'A strongly consistent distributed SQL store', 'DynamoDB-style conditional writes'], scale: 'Small volume, so it is the correctness requirement, not capacity, that drives the choice.' } },
          { id: 'push', label: 'Push and notification path', kind: 'external',
            detail: { why: 'Delivers offers to drivers and state changes and driver positions to riders, over the open sockets and through mobile push when the app is in the background.', tradeoffs: ['Mobile push is best effort and can be delayed; offers expire on the server regardless of whether the driver saw them.', 'Every message carries a ride version so the client can drop stale or duplicate updates.'], alternatives: ['Poll-only for simplicity at small scale'], scale: 'Fan-out per ride is tiny (two parties), but the socket count is large.' } }
        ],
        edges: [
          { from: 'rider', to: 'gw', label: 'HTTPS / WS' },
          { from: 'driverapp', to: 'gw', label: 'ping, accept' },
          { from: 'gw', to: 'loc', label: 'pings' },
          { from: 'gw', to: 'ride', label: 'ride API' },
          { from: 'loc', to: 'geo', label: 'upsert' },
          { from: 'loc', to: 'log', label: 'append', style: 'async' },
          { from: 'ride', to: 'pricing', label: 'quote' },
          { from: 'ride', to: 'db', label: 'create, CAS' },
          { from: 'ride', to: 'dispatch', label: 'match' },
          { from: 'dispatch', to: 'geo', label: 'nearby' },
          { from: 'dispatch', to: 'eta', label: 'rank' },
          { from: 'dispatch', to: 'db', label: 'claim' },
          { from: 'dispatch', to: 'push', label: 'offer', style: 'async' }
        ],
        scenarios: [
          { id: 'ping', label: 'Location update', steps: [
            { title: 'Driver pings', path: ['driverapp', 'gw'], note: 'The app sends its position over its open connection every few seconds.' },
            { title: 'Route to ingest', path: ['gw', 'loc'], note: 'The gateway forwards the frame to a location service instance. Any instance will do.' },
            { title: 'Update the index', path: ['loc', 'geo'], note: 'Compute the cell, remove the driver from the old cell if it changed, add to the new one, store position and timestamp. Out-of-order pings are dropped.' },
            { title: 'Append to the log', path: ['loc', 'log'], note: 'In parallel, the ping goes to the log for trip replay, ETA models and supply counts. This write is asynchronous and never blocks the index update.' }
          ] },
          { id: 'match', label: 'Request and match', steps: [
            { title: 'Rider requests', path: ['rider', 'gw', 'ride'], note: 'POST /rides with an idempotency key. A retry after a timeout returns the same ride.' },
            { title: 'Quote and persist', path: ['ride', 'pricing'], note: 'Fetch the cached surge multiplier for the pickup area and store it on the ride, then write the ride as REQUESTED.' },
            { title: 'Hand to dispatch', path: ['ride', 'dispatch'], note: 'The ride moves to MATCHING and dispatch starts a search.' },
            { title: 'Shortlist', path: ['dispatch', 'geo'], note: 'Query the pickup cell and its eight neighbours for drivers marked available with a fresh timestamp. Typically 50 to 90 candidates.' },
            { title: 'Rank by ETA', path: ['dispatch', 'eta'], note: 'Sort by straight-line distance, then ask routing for the road ETA of the closest 10 to 20 and sort by that.' },
            { title: 'Claim the best driver', path: ['dispatch', 'db'], note: 'Conditional update: set the driver to `reserved` for this ride only if still `available`. If it fails, move to the next candidate. Success means no one else can be offered this driver.', tone: 'ok' },
            { title: 'Offer', path: ['dispatch', 'push'], note: 'Send the offer to the driver\'s socket and as a push, with an expiry of about 10 to 15 seconds. The offer state is stored, so a restarted worker can resume.' }
          ] },
          { id: 'accept', label: 'Accept, decline and timeout', steps: [
            { title: 'Driver accepts', path: ['driverapp', 'gw', 'ride'], note: 'POST /offers/{id}/accept reaches the ride service. The call carries the offer id.' },
            { title: 'Atomic transition', path: ['ride', 'db'], note: 'In one transaction: ride MATCHING to DRIVER_ASSIGNED (version check) and driver `reserved` to `on_trip`. If the offer already expired, the version check fails and the driver gets a 409.', tone: 'ok' },
            { title: 'Tell the rider', path: ['ride', 'dispatch', 'push'], note: 'The state change is published so the rider\'s socket receives the driver and ETA. Dispatch stops searching for this ride.' },
            { title: 'Decline or no answer', path: ['dispatch', 'db'], tone: 'hard', note: 'On decline or timeout, release the reservation (`reserved` back to `available`) and move on to the next candidate. A background sweeper also releases reservations whose offer expired, in case a worker died mid-flight.' }
          ] }
        ]
      },
      walkthrough: [
        '**Location path**: drivers ping every few seconds; the location service updates an in-memory cell index and appends to a log. Only the latest position is kept hot.',
        '**Request**: the ride service creates the ride idempotently, locks in the surge multiplier, and hands it to dispatch.',
        '**Match**: dispatch shortlists from the cell and its neighbours, ranks by routed ETA, **claims** the best driver with a conditional write, then offers. Accept is a second atomic transition.',
        '**Updates**: sockets carry offers, assignments and driver positions, with push notifications for key transitions and polling as the resync path.',
        '**Failure modes**: losing a geo index node empties its region for a few seconds; losing dispatch workers delays matches until another picks up the stored offers; losing the trip store stops new assignments but not location tracking.'
      ],
      notes: ['The design splits by **consistency need**: location is eventually consistent and lossy; the claim and the trip state are strictly consistent. Say that out loud.']
    },

    deepDives: [
      { id: 'geo-index', title: 'Geospatial indexing: geohash, quadtree and S2-style cells',
        question: 'How do you find the available drivers near a point when 125,000 positions change every second?',
        answer: 'Use a **grid of cells held in memory** and map each driver to the cell that contains it. A search reads the rider\'s cell plus its eight neighbours and then ranks the result.\n\n**Geohash** encodes latitude and longitude by repeatedly halving the ranges and interleaving the bits, then writes 5 bits per base32 character. A longer prefix is a smaller cell, and points that share a prefix are close. Precision 6 is a cell of roughly 1.2 km by 0.6 km (approximate). Moving a driver is two O(1) set operations.\n\n```\nconst B = \'0123456789bcdefghjkmnpqrstuvwxyz\';\nfunction geohash(lat, lng, len) {\n  let la = [-90, 90], lo = [-180, 180], h = \'\', bits = 0, ch = 0, even = true;\n  while (h.length < len) {\n    const r = even ? lo : la, v = even ? lng : lat, m = (r[0] + r[1]) / 2;\n    ch <<= 1;\n    if (v >= m) { ch |= 1; r[0] = m; } else r[1] = m;\n    even = !even;\n    if (++bits === 5) { h += B[ch]; bits = 0; ch = 0; }\n  }\n  return h;   // geohash(42.6, -5.6, 5) === \'ezs42\'\n}\n```\n\nThe catch is the **edge problem**: two drivers a few metres apart on either side of a cell boundary can have totally different prefixes, so always query the neighbouring cells. Cells also shrink in width toward the poles, so the cell size is not uniform worldwide.\n\n**Quadtree** splits a square into four whenever it holds more than a threshold number of drivers, so dense areas get small leaves and empty areas stay large. It adapts to density, but updating a tree at this write rate and sharing it across servers is harder than updating a flat map.\n\n**S2 or H3-style cells** are a hierarchy of cells on the sphere with fairly uniform area and a function that covers a circle with cells. Same design as geohash with better geometry.\n\nMy pick: a flat grid of cells in memory (geohash or S2), partitioned by city, searching nine cells.',
        followups: [
          { q: 'What cell size do you pick, and what if the nine cells have no drivers?', a: 'Choose the level so a cell typically holds a handful of drivers in the busiest areas: around 1 km in a city. If the first ring is empty, expand to the next ring of cells (the 16 around the 3 by 3 block), up to a maximum radius, and stop at a maximum wait rather than searching forever.' },
          { q: 'Why not store drivers in a SQL table with a spatial index?', a: 'The index would be updated 125,000 times a second and is disk-backed. Positions are ephemeral, so memory with no durability is the right fit. Use SQL for rides.' },
          { q: 'How do you move a driver between cells safely?', a: 'Compute the new cell. If it differs from the stored one, add to the new set and then remove from the old one, so a concurrent query never misses the driver (it may briefly see them twice, which you deduplicate by driver id). Store the timestamp and ignore older updates.' }
        ] },
      { id: 'matching', title: 'Nearest-driver matching and dispatch',
        question: 'A rider requests a ride. Walk through how you pick the driver, and how you handle declines and timeouts.',
        answer: 'Dispatch runs a short pipeline.\n\n1. **Shortlist**: read the pickup cell and its neighbours from the geo index, keep drivers that are `available` with a position under about 15 seconds old.\n2. **Rank**: sort by straight-line distance, take the closest 10 to 20, and ask the routing service for road ETAs. Re-sort by ETA. You can mix in other signals (driver rating, trip direction) but ETA is the core.\n3. **Claim and offer**: attempt the conditional update on the best driver. If it succeeds, send an offer with an expiry of about 10 to 15 seconds.\n4. **Decline or timeout**: release the reservation and try the next candidate. After a few misses, widen the search radius.\n5. **Give up** after a maximum wait and return NO_DRIVER, so the rider is never left in limbo.\n\nSequential offers are fair and use driver attention well but add up to a delay when drivers decline. **Batching** requests for a couple of seconds and solving a small assignment problem (minimise total pickup time across riders and drivers) gives better overall wait times but adds a built-in delay. State that greedy is the baseline and batching is the improvement.',
        followups: [
          { q: 'Why rank by ETA instead of straight-line distance?', a: 'A driver 400 m away across a river or a one-way system can be 10 minutes by road. Straight-line distance is a cheap filter; the routed ETA is the real cost. You only pay for routing on the shortlist.' },
          { q: 'Should you offer to several drivers at once?', a: 'It cuts latency but wastes drivers\' time and makes the "who got it" question hard. If you do it, each offer must be a reservation backed by the claim step, and the first accept wins while the others are released immediately with a clear message.' },
          { q: 'What if the routing service is down or slow?', a: 'Fall back to straight-line distance over an assumed average speed and mark the ETA as approximate. A worse ranking is better than no match.' }
        ] },
      { id: 'consistency', title: 'Preventing double assignment',
        question: 'Two ride requests pick the same nearby driver at the same moment. How do you guarantee only one gets them, and a ride never has two drivers?',
        answer: 'The geo index is **only a hint**; it can be a few seconds stale, so two dispatchers can legitimately shortlist the same driver. The guarantee comes from a **conditional write on the authoritative record**, not from the index.\n\nClaim step: `UPDATE driver_state SET state = \'reserved\', current_ride_id = :ride WHERE driver_id = :d AND state = \'available\'`. The database serialises the two updates on that row; exactly one reports 1 row changed and the other reports 0 and moves to its next candidate. The same compare-and-set pattern guards the ride: `UPDATE ride SET state = \'DRIVER_ASSIGNED\', driver_id = :d, version = version + 1 WHERE ride_id = :r AND state = \'MATCHING\' AND version = :v`.\n\nAdd a **reservation expiry**: a reserved driver who does not accept in time is released by dispatch, and a background sweeper releases reservations whose owner crashed. A distributed lock with a TTL (Redis `SET NX PX`) can speed up the hot path, but if it is the only guard, a lock that expires or fails over can still produce two owners, so keep the conditional write as the authority.\n\nAssign each ride one version-checked state machine, and make the accept endpoint idempotent so a retried accept does not fail or double-apply.',
        followups: [
          { q: 'What if the dispatch worker crashes after claiming but before offering?', a: 'The reservation has an expiry and the ride is still MATCHING with a stored offer record. Another worker (or the sweeper) sees the stale reservation, releases the driver and resumes the search. Nothing depends on a single process surviving.' },
          { q: 'Why not hold a global lock per city?', a: 'It serialises all matching in a city and becomes the bottleneck and a single point of failure. Row-level conditional writes contend only when two requests want the same driver.' },
          { q: 'What if a driver goes offline while reserved?', a: 'No heartbeat for a threshold means the driver is marked offline and any pending reservation or offer is cancelled; the ride goes back to MATCHING. If already on a trip, a separate rescue flow is needed, out of scope here.' }
        ] },
      { id: 'state-machine', title: 'The trip state machine',
        question: 'Describe the states of a ride and how you keep transitions correct under retries and concurrent actions.',
        answer: 'Main path: `REQUESTED -> MATCHING -> DRIVER_ASSIGNED -> DRIVER_ARRIVED -> IN_TRIP -> COMPLETED`. Side exits: `MATCHING -> NO_DRIVER`, and `CANCELLED` from `REQUESTED`, `MATCHING`, `DRIVER_ASSIGNED` or `DRIVER_ARRIVED` (with different fees). `COMPLETED` and `CANCELLED` are terminal.\n\nKeep the **allowed transitions in one table in code** and reject anything else. Each transition is a **compare-and-set** on `(state, version)`, so a late or duplicate request fails cleanly instead of corrupting the ride. Every transition is also appended to an event log in the same transaction.\n\nTransitions caused by a client call use an idempotency key or the target state, so a retry of "start trip" returns the current result. Transitions caused by time (offer expiry, rider no-show) come from a timer service or a sweeper that uses the same compare-and-set, so a late timer cannot override a real accept.\n\nTrip completion triggers the fare calculation from the recorded route and hands the amount to the payment system asynchronously.',
        followups: [
          { q: 'The rider cancels at the same instant the driver accepts. What happens?', a: 'Both are compare-and-set on the ride row. Whichever commits first wins; the other sees a changed version or state and gets a clear error (the accept gets 409; the cancel is then evaluated against DRIVER_ASSIGNED and may carry a fee). The driver is released in the cancel transaction.' },
          { q: 'Why store version numbers?', a: 'They let clients and workers discard stale updates and make every write conditional, which is cheaper and safer than locks.' }
        ] },
      { id: 'push-poll', title: 'Push or polling for the rider app',
        question: 'How do riders see the driver\'s car moving on the map and learn about state changes? What happens on a bad connection?',
        answer: 'Use a **persistent connection** (WebSocket or server-sent events) for live updates, because polling at 2 to 5 seconds multiplies requests by the number of active trips for no benefit most of the time. The gateway holds the socket; the ride service and dispatch publish events to a per-user channel, and a presence map tells the system which gateway node to deliver through.\n\nMake it robust: every message has the ride `version`, the client ignores older ones, and on every reconnect the client fetches the full current ride (`GET /rides/{id}`) before trusting the stream. Send **mobile push** for important transitions (driver assigned, arrived) when the app is backgrounded, but never rely on it for correctness. Keep polling as the simple fallback at a slow interval if the socket cannot be established.\n\nDriver position updates to the rider do not go through the trip store: the gateway streams them from the location path for the assigned driver only.',
        followups: [
          { q: 'How many sockets can one gateway node hold?', a: 'Idle sockets are cheap (tens of thousands per node is plausible, depending on memory and OS tuning). The design must tolerate a node loss by letting clients reconnect and resync from the ride state, so no state lives only on the socket.' },
          { q: 'How do you avoid a thundering herd after a gateway restart?', a: 'Reconnect with exponential backoff and random jitter, and spread connections across nodes via the load balancer so a single node loss is a small fraction of users.' }
        ] },
      { id: 'eta-surge', title: 'ETA, routing and surge pricing overview',
        question: 'Briefly: how do you produce ETAs and a surge multiplier, and where does it fit?',
        answer: '**ETA**: a routing service over a road graph with traffic-adjusted edge weights. For one driver, a shortest-path query from driver to pickup. For a whole shortlist, run the queries in parallel and cache by coarse cell pairs. Show the rider an ETA and a range, not a promise.\n\n**Surge**: divide the area into cells (or hexagons). Every minute or so, compute **demand** (recent ride requests and app opens) and **supply** (available drivers) per cell from the location log and ride events. Map the ratio to a multiplier with a cap, smooth it over time and across neighbours, and publish it to a cache. At request time the pricing service reads the cached multiplier and the ride stores it, so the rider\'s quote cannot change underneath them.\n\nIt is a feedback system: higher prices reduce demand and attract supply. Say that it needs caps, smoothing and monitoring, and that fairness and regulation are product constraints.',
        followups: [
          { q: 'Why compute surge per cell on a timer instead of per request?', a: 'Per-request recomputation means scanning the demand and supply data on the hot path. A one-minute cadence is accurate enough, cached reads are cheap, and everyone in the cell sees the same number.' },
          { q: 'How would you keep ETA predictions honest?', a: 'Log predicted versus actual pickup and trip times, and track the error by area and time of day. Retrain or recalibrate when it drifts.' }
        ] },
      { id: 'ingest-scale', title: 'Scaling location ingest and failure of a region',
        question: 'Location updates are 125,000 a second at peak. How do you scale ingest, and what if a geo index node dies?',
        answer: 'Ingest is **stateless and partitionable**: gateways forward pings to location service instances; add instances as the peak grows. Partition the geo index by city (and by cell range for the largest cities) so each partition handles a bounded update rate. Reduce volume with **adaptive ping intervals** (slower when parked or stuck in traffic), client-side batching, and compact encodings.\n\nIf an index node dies, its region has no drivers until it recovers. Because positions refresh every few seconds, a replacement node refills itself from live pings within seconds; a hot replica makes it invisible. Existing trips are unaffected because their state is in the trip store. Pings that arrive while the index is down still reach the log.\n\nWhen the pipeline is overloaded, **shed load**: drop or sample pings. Matching quality dips slightly; the system stays up.',
        followups: [
          { q: 'How do you avoid a hot partition in a stadium or airport?', a: 'Split that area into smaller cell ranges across more nodes, and note that the shard key is the cell, not the city. Dispatch queries that span the boundary hit both nodes and merge.' },
          { q: 'Do you need the log if the index is the product?', a: 'Yes for the trip polyline (fare, disputes, safety), ETA models and surge supply counts. It keeps those consumers off the latency-critical index.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Location write throughput', problem: 'About 42,000 pings a second on average and 125,000 at peak. Each is a small write, but the aggregate saturates a single index node or a single log partition.', mitigation: 'Partition the index by city and cell range, make ingest stateless, use adaptive ping intervals and batching, and shed load by sampling when needed.' },
      { title: 'Hot geographic partitions', problem: 'A downtown at rush hour, an airport, or a stadium letting out concentrates both pings and ride requests into a few cells.', mitigation: 'Choose the shard key as cell ranges so a hot area can be split, use smaller cells where density is high, and keep dispatch workers independent of the geography shard.' },
      { title: 'Stale locations in the index', problem: 'A driver who lost signal still looks available, so riders get offers sent to someone unreachable, which wastes seconds.', mitigation: 'Store the ping time and ignore entries older than about 15 seconds, require an acknowledgement for offers with a short timeout, and move to the next candidate immediately on timeout.' },
      { title: 'Match latency from sequential offers', problem: 'If drivers decline or ignore offers one at a time, each costs 10 to 15 seconds and the rider waits through several rounds.', mitigation: 'Shorter offer timeouts, a short list of parallel reservations (with the claim step guarding it), predictive ranking by acceptance probability, or batching with a global assignment.' },
      { title: 'Cross-boundary matches', problem: 'A rider near a city or shard boundary has candidate drivers in two partitions, and a trip may cross shards.', mitigation: 'Fan the nearby query out to both partitions and merge. Keep the ride on the shard where it was requested for its whole life, and let the driver state live in a store that both can reach.' },
      { title: 'Downstream dependency slowness', problem: 'Routing, pricing or push calls that stall can hold up every match in progress.', mitigation: 'Hard timeouts with fallbacks (straight-line ETA, last-known surge), bulkheads per dependency, and idempotent retries.' }
    ],

    mistakes: [
      'Storing every driver ping in a **SQL table** and querying it for "nearby drivers".',
      'Forgetting the **edge problem**: searching only the rider\'s own cell and missing a driver 20 metres away in the next one.',
      'Ranking by **straight-line distance** only and ignoring roads and traffic.',
      'Using the geo index as the **source of truth** for who is available, with no conditional write, so two riders get one driver.',
      'Relying on a **lock with a TTL** as the only guard against double assignment.',
      'Treating location data as precious: giving pings strong consistency and synchronous durability, which wastes capacity.',
      'Polling the server every second from millions of apps instead of using a persistent connection.',
      'No **timeout and release** for offers, so a driver who ignores a request is stuck reserved.',
      'No state machine: letting any call set any state, so cancel and accept race into inconsistent trips.',
      'Never saying what happens when a rider\'s connection drops mid-trip.'
    ],

    pushes: [
      { q: 'Geohash or quadtree: which would you choose, and why?', why: 'They want a reasoned choice, not a memorised name.', good: 'A flat grid in memory because it is the simplest thing that survives the write rate; mention the neighbour-cell edge problem; say quadtrees help with uneven density but are harder to update and share.' },
      { q: 'How do you guarantee a driver is not assigned two rides?', why: 'This is the core correctness requirement.', good: 'The index is a hint; a conditional update on the authoritative driver record is the guarantee; reservation expiry and a sweeper; idempotent accept; why a TTL lock alone is not enough.' },
      { q: 'What happens if the dispatch service crashes mid-match?', why: 'Tests whether progress lives in durable state.', good: 'Offer and reservation state live in the ride store with expiries; another worker resumes; no process-local state decides the outcome.' },
      { q: 'How would you handle surge pricing fairly and stably?', why: 'Checks awareness that it is a feedback loop.', good: 'Per-cell supply and demand on a timer, smoothing, caps, a locked-in multiplier per ride, and acknowledging product and regulatory constraints.' },
      { q: 'Why not just poll?', why: 'They are probing whether you can quantify the cost.', good: 'Estimate the request rate for active riders at a 3 second interval against push messages that only fire on change; keep polling as the resync fallback.' },
      { q: 'How does the system behave when location updates are delayed or lost?', why: 'Real networks are bad; they want graceful degradation.', good: 'Timestamps, staleness limits, load shedding, tolerance of missing pings (the next one replaces it), and a fallback for the trip polyline.' }
    ],

    quiz: [
      { kind: 'concept', q: 'In this system, which workload dominates traffic, and what does it imply?', choices: ['Location writes dominate, so keep the live index in memory and treat pings as lossy', 'Ride reads dominate, so add a cache in front of the ride table', 'Fare computation dominates, so scale the pricing service first', 'Trip creation dominates, so shard the ride table by rider id first'], answer: 0, explain: 'About 42,000 pings a second against about 58 trips a second. Pings are small, ephemeral and replaced by the next one, so memory with no durability fits; the strict correctness work lives in the small trip path.' },
      { kind: 'concept', q: 'You search only the rider\'s own geohash cell. What goes wrong?', choices: ['A driver just across a cell boundary is missed', 'Geohash cells overlap, so you get duplicate drivers', 'Cells with long prefixes cannot be indexed in memory', 'Nothing, a cell always contains the nearest driver'], answer: 0, explain: 'Nearby points can fall on either side of a boundary with unrelated prefixes. Always query the neighbouring cells too.' },
      { kind: 'concept', q: 'Two dispatchers pick the same driver. What actually prevents a double assignment?', choices: ['A conditional update on the driver record that succeeds for only one', 'The geo index removing the driver once it is listed', 'A strict ordering of requests by timestamp across the city', 'Larger cells so fewer drivers are shared'], answer: 0, explain: 'The index is stale by seconds and cannot be the guard. A conditional write (set reserved only if available) is serialised by the database row, so exactly one succeeds.' },
      { kind: 'concept', q: 'Pick every reason to rank the shortlist by routed ETA instead of straight-line distance.', choices: ['Rivers, one-way streets and traffic make road distance differ greatly', 'It is cheaper than a distance calculation', 'Pickup time is what the rider experiences', 'Straight-line distance cannot be computed from lat and lng'], answer: [0, 2], explain: 'Routing is more expensive, which is why you only apply it to the closest 10 to 20 candidates. Straight-line distance is easy to compute, and it makes a good first filter.' },
      { kind: 'concept', q: 'The rider cancels at the same instant the driver accepts. What is the cleanest way to resolve it?', choices: ['Both are compare-and-set on the ride version; the first to commit wins and the other gets a clear error', 'Take a global lock on the city while either runs', 'Apply whichever message arrived at the gateway first by wall clock', 'Let both succeed and fix it up during payment'], answer: 0, explain: 'Version-checked transitions give a single winner without a global lock. Wall-clock ordering across servers is unreliable.' },
      { kind: 'concept', q: 'Why does the rider client fetch the full ride on every socket reconnect?', choices: ['Messages may have been missed while disconnected, and versions let it discard stale ones', 'Sockets cannot carry ride state', 'The server forgets the ride when the socket closes', 'To cancel the previous subscription'], answer: 0, explain: 'The socket is a convenience channel. The ride record is the truth, and a fetch plus version check makes missed or reordered messages harmless.' },
      { kind: 'concept', q: 'Why compute the surge multiplier per cell on a timer rather than per request?', choices: ['It is cheap on the hot path, consistent for everyone in the cell and accurate enough', 'Per-request pricing is illegal', 'Timers are more accurate than per-request math', 'The multiplier cannot depend on supply'], answer: 0, explain: 'Supply and demand are aggregates over a window, so a one-minute cadence loses little and keeps pricing reads to a cache hit.' }
    ],

    flashcards: [
      { id: 'rm-workload', front: 'Ride matching: which workload dominates and how do you store it?', back: 'Driver location writes (about 42K/s average, 125K/s peak in this estimate). Keep only the latest position in an in-memory cell index and append pings to a log; rides go in a transactional store.' },
      { id: 'rm-geohash', front: 'Geohash: what is it and what is its main gotcha?', back: 'A string made by interleaving lat and lng bit-halvings; longer prefix means a smaller cell. Nearby points can have different prefixes at a cell edge, so always search the neighbour cells too.' },
      { id: 'rm-quadtree', front: 'Quadtree vs fixed grid for drivers?', back: 'A quadtree splits dense areas into smaller leaves, adapting to density, but is harder to update at high write rates and to share across servers. A flat grid is simpler and usually enough.' },
      { id: 'rm-claim', front: 'How do you prevent double assignment of a driver?', back: 'A conditional write on the authoritative driver record (set reserved only if available). The geo index is only a hint. Add reservation expiry and a sweeper.' },
      { id: 'rm-rank', front: 'How do you pick the nearest driver in practice?', back: 'Shortlist from the cell and its neighbours using straight-line distance, then rank the closest 10 to 20 by routed ETA. Fall back to straight-line if routing is down.' },
      { id: 'rm-state', front: 'Trip state machine, main path?', back: 'REQUESTED, MATCHING, DRIVER_ASSIGNED, DRIVER_ARRIVED, IN_TRIP, COMPLETED. Exits: NO_DRIVER and CANCELLED. Every transition is a compare-and-set on state and version.' },
      { id: 'rm-push', front: 'Push or polling for the rider app?', back: 'A persistent connection (WebSocket or SSE) for live updates, mobile push for key transitions, and fetch-on-reconnect with a version check as the resync path. Poll only as a fallback.' },
      { id: 'rm-surge', front: 'How is surge pricing computed in outline?', back: 'Per cell, on a timer: demand versus supply over a recent window mapped to a capped, smoothed multiplier, cached, and locked into each ride at request time.' }
    ]
  });
})();
