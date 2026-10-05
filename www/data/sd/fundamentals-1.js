/* System design fundamentals, part 1: request path, CDN, load balancing, scaling. Schema: data/sd/schema.md */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.fundamentals = SD.fundamentals || [];
  SD.fundamentals.push(
    {
      id: 'client-server-dns', title: 'Clients, servers and DNS', group: 'The request path',
      hook: 'What happens between typing a URL and getting bytes back, and where each step can be slow or fail.',
      keywords: 'http tcp tls dns resolver latency round trip stateless',
      sections: [
        { title: 'The life of a request',
          md: 'A client (browser, phone app, another service) sends a request to a server and waits for a response. Before any bytes of your application move, three things happen:\n\n1. **DNS** turns `api.example.com` into an IP address.\n2. **TCP** opens a connection (one round trip), and **TLS** secures it (one more round trip with TLS 1.3, two with 1.2).\n3. The client sends an **HTTP** request and the server answers.\n\nEach round trip costs the network latency between the two machines, which is about 0.5 ms inside a data center and 100 to 150 ms across continents. Reusing connections (HTTP keep-alive, HTTP/2) removes the setup cost from later requests.\n\nServers should be **stateless** where possible: any request can be handled by any server because session state lives in a shared store or in the client (a token). That single property is what makes load balancing and scaling out easy.',
          diagram: { title: 'Request path from client to server',
            nodes: [
              { id: 'client', label: 'Browser or app', kind: 'client', detail: { why: 'Starts every request. It caches DNS answers and keeps connections open to avoid repeating setup.', tradeoffs: ['You do not control the network, the device or retries.'], scale: 'Mobile networks add latency and drop connections, so clients need timeouts and retry with backoff.' } },
              { id: 'dns', label: 'DNS resolver', kind: 'external', detail: { why: 'Maps a name to one or more IP addresses. Answers are cached for a time set by the record\'s TTL.', tradeoffs: ['A long TTL means fewer lookups but slow failover; a short TTL gives fast failover but more lookups.'], scale: 'DNS is rarely the bottleneck, but a stale record after a failure can keep clients pointed at a dead address until the TTL expires.' } },
              { id: 'lb', label: 'Load balancer', kind: 'lb', detail: { why: 'The single address that DNS returns. It forwards each request to one of many servers.', tradeoffs: ['Adds one network hop but gives health checks and a place to terminate TLS.'], scale: 'Must itself be redundant.' } },
              { id: 'app', label: 'Stateless servers', kind: 'service', detail: { why: 'Run your code. Because they hold no session state, any one can serve any request.', tradeoffs: ['Statelessness pushes state into a database or cache, adding a network call per request.'], scale: 'CPU or memory per request; add servers to scale.' } },
              { id: 'db', label: 'Database', kind: 'db', detail: { why: 'Holds the state the servers do not.', scale: 'Usually the first tier that stops scaling by just adding machines.' } }
            ],
            edges: [{ from: 'client', to: 'dns', label: 'lookup' }, { from: 'client', to: 'lb', label: 'HTTPS' }, { from: 'lb', to: 'app' }, { from: 'app', to: 'db' }],
            scenarios: [{ id: 'req', label: 'One request', steps: [
              { title: 'Resolve the name', path: ['client', 'dns'], note: 'The client asks DNS for the IP address, unless it is cached already.' },
              { title: 'Connect and send', path: ['client', 'lb'], note: 'TCP and TLS setup cost round trips; then the HTTP request goes out. Reused connections skip the setup.' },
              { title: 'Pick a server', path: ['lb', 'app'], note: 'The balancer chooses a healthy server.' },
              { title: 'Do the work', path: ['app', 'db'], note: 'The server reads or writes shared state and builds the response, which travels back the same way.' }] }] },
          caption: 'Trace the request to see each hop. Every arrow is a network call that can be slow or fail.' },
        { title: 'DNS in more detail',
          md: 'DNS is a distributed, cached lookup. A resolver walks root, top-level domain and authoritative servers, then caches the answer for the record\'s **TTL**.\n\n| Record | Maps | Use |\n|---|---|---|\n| A / AAAA | name to IPv4 / IPv6 | the normal case |\n| CNAME | name to another name | point `www` at a CDN hostname |\n| NS | zone to its name servers | delegation |\n\nDNS can also steer traffic: return several IPs (round robin), or return the nearest data center by the resolver\'s location (geo DNS). It cannot see server health on its own and caches are outside your control, so it is a coarse tool. Use it to find a load balancer, not to balance individual requests.' }
      ],
      takeaways: ['Every request pays DNS, connection setup and the data transfer; reuse connections to avoid the setup.', 'Stateless servers behind one address are the foundation for scaling out.', 'DNS caching makes failover slow: lower the TTL before planned moves.', 'Network latency is physics: pick data center locations by where your users are.'],
      quiz: [
        { kind: 'concept', q: 'Why do stateless servers make scaling easier?', choices: ['Any server can handle any request, so you can add or remove servers freely', 'They use less memory', 'They never need a database', 'They remove the need for a load balancer'], answer: 0, explain: 'No request depends on state held by one particular server, so a balancer may send it anywhere and failed servers are replaceable.' },
        { kind: 'concept', q: 'You lower a DNS record TTL from one day to 60 seconds before migrating servers. Why?', choices: ['Caches will pick up the new address within about a minute', 'It makes lookups faster for every client', 'It encrypts the lookup', 'It stops clients from caching the TCP connection'], answer: 0, explain: 'Resolvers keep an answer for the TTL, so a short TTL bounds how long clients keep using the old address.' },
        { kind: 'concept', q: 'Which add round trips before the first HTTP byte on a new HTTPS connection?', choices: ['TCP handshake and TLS handshake', 'Only DNS', 'Only HTTP headers', 'Nothing; HTTPS has no setup cost'], answer: 0, explain: 'DNS (if uncached), TCP (one round trip) and TLS (one or two) all happen before the request is sent.' }
      ],
      flashcards: [
        { id: 'stateless', front: 'Why make web servers stateless?', back: 'Any server can serve any request, so you can scale by adding servers and replace failed ones without losing sessions. State moves to a shared store or the client.' },
        { id: 'dns-ttl', front: 'What does a DNS TTL control and what is the trade-off?', back: 'How long resolvers cache an answer. Long TTL: fewer lookups, slow failover. Short TTL: fast failover, more lookups.' },
        { id: 'conn-reuse', front: 'Why reuse connections (keep-alive, HTTP/2)?', back: 'It skips the TCP and TLS round trips on later requests, which dominate latency for small responses.' }
      ]
    },
    {
      id: 'cdn', title: 'Content delivery networks', group: 'The request path',
      hook: 'Serve static and cacheable content from a server near the user and take that load off your origin.',
      keywords: 'edge cache pop origin cache-control ttl invalidation push pull',
      sections: [
        { title: 'What a CDN does',
          md: 'A CDN is a worldwide set of caching servers (**points of presence**, or PoPs). A user\'s request goes to the nearest PoP. On a **hit** the PoP answers immediately; on a **miss** it fetches from your **origin**, stores the response, and serves it. The next nearby user gets a hit.\n\nThe wins: lower latency (less distance), less load on the origin, and absorption of traffic spikes. It is the cheapest large win for static assets (images, video segments, JavaScript, CSS) and for any response that is the same for many users.\n\n**Pull** CDNs fetch from the origin on first miss (simple, the default). **Push** CDNs get content uploaded ahead of time (good for large files published rarely).',
          diagram: { title: 'CDN edge in front of an origin',
            nodes: [
              { id: 'user', label: 'User', kind: 'client', detail: { why: 'Requests are routed to the nearest edge by DNS or anycast.' } },
              { id: 'edge', label: 'CDN edge (PoP)', kind: 'cdn', detail: { why: 'Caches responses close to users. Honors cache headers such as `Cache-Control: max-age`.', tradeoffs: ['Cached content can be stale until it expires or is purged.', 'Personalized responses usually cannot be cached at the edge.'], alternatives: ['Cache static assets only; send dynamic requests straight to the origin'], scale: 'Cache hit ratio. A low ratio means the origin still takes the traffic.' } },
              { id: 'origin', label: 'Origin server', kind: 'service', detail: { why: 'The source of truth the CDN fetches from on a miss.', tradeoffs: ['If the CDN is misconfigured to bypass the cache, all traffic lands here.'], scale: 'A cold cache or a mass purge sends a burst of misses to the origin at once.' } },
              { id: 'store', label: 'Object storage', kind: 'storage', detail: { why: 'Static files usually live in blob storage, which the origin or the CDN reads from.', alternatives: ['Origin web servers with local disks'] } }
            ],
            edges: [{ from: 'user', to: 'edge', label: 'GET' }, { from: 'edge', to: 'origin', label: 'on miss' }, { from: 'origin', to: 'store' }],
            scenarios: [
              { id: 'hit', label: 'Cache hit', steps: [{ title: 'Request', path: ['user', 'edge'], note: 'The user\'s request lands on the nearest edge.' }, { title: 'Served from cache', path: ['edge'], note: 'The edge already holds a fresh copy and answers directly. The origin never sees the request.' }] },
              { id: 'miss', label: 'Cache miss', steps: [{ title: 'Request', path: ['user', 'edge'], note: 'The edge has no fresh copy.' }, { title: 'Fetch from origin', path: ['edge', 'origin', 'store'], tone: 'hard', note: 'The edge asks the origin, which reads the file from storage.' }, { title: 'Store and serve', path: ['edge'], note: 'The edge keeps the response for its TTL and returns it. Later users nearby get hits.' }] }
            ] } },
        { title: 'Freshness and invalidation',
          md: 'The origin controls freshness with headers: `Cache-Control: max-age=...` (how long the edge may reuse it) and validators (`ETag`, `Last-Modified`) that let a cache check cheaply whether a copy is still good.\n\nThe cleanest way to change a cached file is to **never change it**: put a content hash in the name (`app.3f9a1c.js`) and cache it for a year. A new deploy produces a new name, so there is nothing to invalidate. For content that must keep its URL, either use a short TTL or **purge** it through the CDN\'s API. Purges take effect worldwide in seconds to minutes and are rate-limited, so do not depend on them for correctness.\n\nWhat to keep off the CDN: responses that differ per user unless you vary the cache key correctly, and anything with secrets in the URL.' }
      ],
      takeaways: ['A CDN is a geographically distributed cache in front of the origin.', 'Cache hit ratio is the number that matters; watch it.', 'Version file names with a content hash instead of purging.', 'A cold cache or global purge hits the origin all at once; protect it.'],
      quiz: [
        { kind: 'concept', q: 'What is the most reliable way to roll out a changed JavaScript file through a CDN?', choices: ['Give it a new, content-hashed file name', 'Purge the CDN after each deploy and hope', 'Set max-age to zero for everything', 'Serve it from the origin only'], answer: 0, explain: 'A new URL cannot be stale anywhere, so no purge is needed, and the old file stays valid for pages that still reference it.' },
        { kind: 'concept', q: 'A mass purge makes your origin fall over. Why?', choices: ['Every edge misses at once and fetches from the origin together', 'Purging deletes the origin\'s files', 'DNS TTLs reset', 'The CDN stops serving traffic'], answer: 0, explain: 'The cache is empty everywhere, so all requests become misses and hit the origin until the edges refill.' },
        { kind: 'concept', q: 'Which responses are poor candidates for edge caching?', choices: ['Personalized pages that differ per user', 'Images and video segments', 'Versioned JavaScript bundles', 'Public documentation pages'], answer: 0, explain: 'Without a careful cache key, a personalized response cached for one user could be served to another.' }
      ],
      flashcards: [
        { id: 'cdn-flow', front: 'CDN hit vs miss?', back: 'Hit: the nearest edge has a fresh copy and answers. Miss: it fetches from the origin, stores the response for its TTL, then serves it.' },
        { id: 'cache-bust', front: 'How do you invalidate CDN-cached static files?', back: 'Prefer immutable URLs with a content hash and a long max-age. Use short TTLs or explicit purges only for files that must keep their URL.' },
        { id: 'pull-push', front: 'Pull CDN vs push CDN?', back: 'Pull fetches from the origin on the first miss (simple default). Push means you upload content ahead of time, useful for large rarely-changing files.' }
      ]
    },
    {
      id: 'load-balancing', title: 'Load balancers', group: 'The request path',
      hook: 'Spread traffic over many servers, remove broken ones, and choose between layer 4 and layer 7.',
      keywords: 'l4 l7 round robin least connections ip hash health check sticky sessions tls termination',
      sections: [
        { title: 'Layer 4 and layer 7',
          md: 'A load balancer sits in front of a pool of servers and forwards each request or connection to one of them, based on health and an algorithm.\n\n- **Layer 4 (transport)** balances TCP or UDP connections by IP and port. It does not read the request, so it is fast, cheap, and works for any protocol.\n- **Layer 7 (application)** reads the HTTP request, so it can route by path or header (`/api` to one pool, `/images` to another), terminate TLS, rewrite headers, add auth, and retry. It costs more CPU.\n\nHealth checks remove failing servers automatically. The balancer itself is a single point of failure, so it runs as a redundant pair or as a managed service with a virtual IP.',
          diagram: { title: 'Load balancer in front of a server pool',
            nodes: [
              { id: 'c', label: 'Clients', kind: 'client', detail: { why: 'Many clients, one stable address.' } },
              { id: 'lb', label: 'Load balancer', kind: 'lb', detail: { why: 'Chooses a server for each request using health and an algorithm.', tradeoffs: ['Layer 7 gives smart routing but costs CPU and can become the bottleneck.', 'Layer 4 is cheap and fast but blind to the request.'], alternatives: ['Client-side balancing in a service mesh', 'DNS round robin'], scale: 'New connections per second and TLS handshakes, before bandwidth.' } },
              { id: 's1', label: 'Server 1', kind: 'service', detail: { why: 'Interchangeable with the others because it is stateless.' } },
              { id: 's2', label: 'Server 2', kind: 'service', detail: { why: 'Takes traffic when server 1 fails its health check.' } },
              { id: 's3', label: 'Server 3', kind: 'service', detail: { why: 'Can be added or drained without downtime.' } }
            ],
            edges: [{ from: 'c', to: 'lb' }, { from: 'lb', to: 's1' }, { from: 'lb', to: 's2' }, { from: 'lb', to: 's3' }] } },
        { title: 'Algorithms',
          md: '| Algorithm | How it picks | Good for | Watch out |\n|---|---|---|---|\n| Round robin | next server in turn | equal servers, similar requests | ignores load |\n| Weighted round robin | turns proportional to weight | mixed server sizes | weights need upkeep |\n| Least connections | fewest open connections | long-lived or uneven requests | needs connection tracking |\n| IP or key hash | hash of client IP or key | sticky routing, cache locality | uneven spread, reshuffles on change (use consistent hashing) |\n| Power of two choices | sample two, take the less loaded | huge pools, cheap and near-optimal | needs a load signal |\n\n**Sticky sessions** pin a client to one server. They are a fallback for stateful servers; they cause uneven load and lose the session when that server dies. Prefer stateless servers with shared session storage.\n\nA balancer pool is also where **draining** happens: stop sending new requests to a server, let in-flight ones finish, then remove it. That is how you deploy without dropped requests.' }
      ],
      takeaways: ['Layer 4 is fast and protocol-agnostic; layer 7 is smart and costs more.', 'Least connections beats round robin when requests vary a lot in duration.', 'Avoid sticky sessions by making servers stateless.', 'Make the balancer redundant and drain servers before removal.'],
      quiz: [
        { kind: 'concept', q: 'You need to send `/api/*` to one server pool and `/static/*` to another. Which balancer type?', choices: ['Layer 7', 'Layer 4', 'Either; both read the URL', 'DNS only'], answer: 0, explain: 'Routing by path requires reading the HTTP request, which only a layer 7 balancer does.' },
        { kind: 'concept', q: 'Requests range from 5 ms to 30 seconds. Which algorithm usually spreads load best?', choices: ['Least connections', 'Round robin', 'Plain IP hash', 'Random with no health checks'], answer: 0, explain: 'Long requests keep connections open, so least connections steers new work toward servers that are less busy.' },
        { kind: 'concept', q: 'Pick every real downside of sticky sessions.', choices: ['Uneven load across servers', 'A server failure loses its sessions', 'They make servers harder to drain', 'They remove the need for TLS'], answer: [0, 1, 2], explain: 'Pinning clients concentrates load and ties state to one machine. Nothing about stickiness removes TLS.' },
        { kind: 'concept', q: 'Why does the load balancer need to be redundant?', choices: ['Otherwise it is a single point of failure for everything behind it', 'Because TLS requires two balancers', 'To double throughput automatically', 'Servers cannot start without one'], answer: 0, explain: 'All traffic flows through it. Run an active-passive pair or a managed multi-zone service.' }
      ],
      flashcards: [
        { id: 'l4-l7', front: 'Layer 4 vs layer 7 load balancing?', back: 'L4 forwards TCP/UDP connections by IP and port: fast, protocol-agnostic. L7 reads HTTP: routing by path or header, TLS termination, retries; more CPU.' },
        { id: 'least-conn', front: 'When prefer least connections over round robin?', back: 'When request durations vary widely, so equal turns do not mean equal load.' },
        { id: 'sticky', front: 'Why avoid sticky sessions?', back: 'They cause uneven load and lose the session when the server dies. Keep servers stateless and store sessions in a shared store.' },
        { id: 'drain', front: 'What is connection draining?', back: 'Stop sending new requests to a server, let in-flight ones finish, then remove it. It enables deploys without dropped requests.' }
      ]
    },
    {
      id: 'scaling', title: 'Scaling: vertical and horizontal', group: 'The request path',
      hook: 'When to buy a bigger machine, when to add more machines, and what changes when you do.',
      keywords: 'scale up scale out horizontal vertical stateless shared nothing autoscaling bottleneck',
      sections: [
        { title: 'Up or out',
          md: '**Vertical scaling** (scale up) means a bigger machine: more CPU, RAM, disk. It is the simplest thing that works, needs no code change, and often wins early. It has a ceiling, a price curve that bends sharply upward, and one machine is one failure.\n\n**Horizontal scaling** (scale out) means more machines doing the same job. It has no hard ceiling and gives redundancy, but the software must support it: requests must be spread (load balancer), and **state** must be shared or partitioned.\n\nRules of thumb:\n\n- Scale **stateless tiers** horizontally first; it is nearly free once servers hold no state.\n- Scale **stateful tiers** (databases, caches) vertically as far as is sensible, then add read replicas, then partition (shard).\n- Find the real bottleneck (CPU, memory, disk I/O, network, a lock, a slow dependency) before spending; a bigger box does not fix a slow query.',
          diagram: { title: 'Scaling each tier',
            nodes: [
              { id: 'lb', label: 'Load balancer', kind: 'lb', detail: { why: 'Makes many identical servers look like one.' } },
              { id: 'app', label: 'App servers (scale out)', kind: 'service', detail: { why: 'Stateless, so adding servers raises capacity almost linearly.', tradeoffs: ['Autoscaling needs warm-up time and a signal such as CPU or queue depth.'], scale: 'The tier behind it: more servers means more database connections.' } },
              { id: 'cache', label: 'Cache (partition)', kind: 'cache', detail: { why: 'Takes read load off the database.', scale: 'Memory per node; add nodes and partition by key.' } },
              { id: 'db', label: 'Primary DB (scale up first)', kind: 'db', detail: { why: 'State is hard to spread, so start by making this one machine bigger.', tradeoffs: ['Vertical scaling is simple but has a ceiling and is a single failure domain.'], scale: 'Write throughput on one primary.' } },
              { id: 'rep', label: 'Read replicas', kind: 'db', detail: { why: 'Scale reads by adding copies.', tradeoffs: ['Replication lag means a read can return slightly old data.'], scale: 'Does nothing for write throughput.' } }
            ],
            edges: [{ from: 'lb', to: 'app' }, { from: 'app', to: 'cache' }, { from: 'app', to: 'db' }, { from: 'db', to: 'rep', style: 'replication', label: 'replicate' }, { from: 'app', to: 'rep', label: 'reads' }] } },
        { title: 'What changes when you scale out',
          md: 'Adding machines turns single-machine guarantees into distributed-systems problems:\n\n- **Shared state**: sessions, uploads and caches cannot sit on one server\'s disk. Use a shared store or the client.\n- **Partial failure**: some machines fail while others work, so every network call needs a timeout, a retry policy (with backoff and jitter) and often an idempotency key.\n- **Coordination**: unique IDs, locks, leader election and counters need a design, not a variable.\n- **Cost of consistency**: keeping many copies in sync trades latency or availability for correctness (see CAP and consistency models).\n\n**Autoscaling** adds and removes servers from a metric. Scale on something that leads load (requests per server, queue depth), keep a minimum for availability, and remember that new servers take time to start, so it handles trends, not instant spikes.' }
      ],
      takeaways: ['Scale stateless tiers out; scale stateful tiers up, then replicate, then partition.', 'Measure to find the bottleneck first.', 'Scaling out brings partial failure and coordination problems.', 'Autoscaling follows trends; keep headroom for spikes.'],
      quiz: [
        { kind: 'concept', q: 'Which tier is usually easiest to scale horizontally?', choices: ['Stateless application servers', 'The primary database', 'A single-leader lock service', 'A local disk cache holding sessions'], answer: 0, explain: 'With no state on the server, adding another changes nothing for correctness; the balancer just uses it.' },
        { kind: 'concept', q: 'Read replicas help with which problem?', choices: ['Read throughput', 'Write throughput', 'Both equally', 'Neither; they only back up data'], answer: 0, explain: 'Every write still goes to the primary and must be applied on every replica, so writes do not scale this way.' },
        { kind: 'concept', q: 'Your app server CPU is low but responses are slow. What should you do first?', choices: ['Find the bottleneck, for example a slow query or dependency', 'Add more app servers', 'Move to a bigger server', 'Turn on autoscaling'], answer: 0, explain: 'If CPU is idle, more of the same capacity will not help. Look for waiting on a database, lock or downstream call.' }
      ],
      flashcards: [
        { id: 'up-out', front: 'Vertical vs horizontal scaling?', back: 'Vertical: bigger machine; simple, but has a ceiling and is one failure domain. Horizontal: more machines; no hard ceiling, redundant, but needs shared or partitioned state.' },
        { id: 'scale-order', front: 'Typical order for scaling a database?', back: 'Optimize queries and indexes, scale up, add a cache and read replicas, then partition (shard) for write scale.' },
        { id: 'autoscale', front: 'What makes a good autoscaling signal?', back: 'One that leads load and tracks work per server: requests per server or queue depth. CPU alone lags and misses I/O-bound services.' }
      ]
    }
  );
})();
