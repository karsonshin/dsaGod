/* System design case study: news feed (timeline generation). Shape follows data/sd/url-shortener.js. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'news-feed',
    title: 'Design a news feed',
    short: 'Build a ranked home timeline from the people you follow. The classic fan-out on write versus fan-out on read trade-off, with celebrities as the twist.',
    difficulty: 'Medium',
    time: '45 min',
    tags: ['Fan-out', 'Caching', 'Ranking', 'Pagination', 'Graph'],
    prompt: 'Design the home feed of a social network. Users follow other users, publish posts (text, images, video), and open the app to see a reverse-chronological or ranked list of recent posts from the accounts they follow.',

    requirements: {
      functional: [
        'Publish a post with text and optional media.',
        'Follow and unfollow another user.',
        'Load the home feed: recent posts from followed accounts, newest or best first.',
        'Scroll back through older posts without duplicates or gaps (pagination).',
        'See likes and comment counts on each post in the feed.'
      ],
      nonFunctional: [
        '**Latency**: the first page of the feed renders in under 300 ms at the server for the 99th percentile.',
        '**Availability** over consistency: a feed that is a few seconds stale is fine; an empty or failing feed is not.',
        '**Freshness**: a new post from a normal account appears in followers\' feeds within seconds.',
        '**Scale**: about 200 million daily active users, most opening the feed several times a day.',
        '**Durability**: a published post is never lost, even if its feed entries are.'
      ],
      outOfScope: ['Ads, sponsored posts and their auction.', 'Comments, likes and notifications as full features (only their counts appear in the feed).', 'The follow-recommendation system.', 'Content moderation pipelines beyond a delete hook.', 'The details of video transcoding.'],
      assumptions: ['An **average user follows about 200 accounts** and has about 200 followers, but the distribution is heavily skewed: most accounts have few followers, a few have tens of millions.', 'The feed holds the most recent **about 800 posts** per user; anything older is reached with a slower path or not at all.', 'Ranking is a separate scoring step that takes candidate posts in and returns an order.'],
      clarify: [
        { q: 'Chronological or ranked?', a: 'Ask. Chronological is simple and predictable. Ranked adds a scoring service and a candidate-selection step, but the fan-out design underneath is the same. Design for chronological storage and add ranking as a re-order of candidates.' },
        { q: 'Is there a cap on how many accounts one can follow, and how many followers an account can have?', a: 'A follow cap bounds read-time work. There is usually **no** follower cap, so the design must survive accounts with tens of millions of followers. That is the entire reason a hybrid is needed.' },
        { q: 'How fresh must a post be, and what happens to a deleted post?', a: 'Seconds for freshness. A deleted post must stop appearing quickly, but it is acceptable for it to linger in cached feeds briefly if the read path filters out deleted IDs when it hydrates.' },
        { q: 'Do we show media in the feed?', a: 'Yes, but only as URLs from a CDN. The feed service never moves image or video bytes, which keeps the design about metadata and lists.' }
      ]
    },

    estimates: {
      intro: 'Start from users, not from posts. 200 million daily active users each publishing 0.5 posts a day gives 100 million posts a day. Each user opens the feed about 10 times a day, and each open is one read of one page of the feed. The calculator treats a **write as one new post** and a **read as one feed page load**.',
      inputs: { dau: 200e6, writesPerUser: 0.5, readsPerUser: 10, peakFactor: 3, bytesPerWrite: 1000, bytesPerRead: 10000, years: 5, replication: 3, hotFraction: 0.05, serverQps: 1000, utilization: 0.6 },
      assumptions: ['**1 KB per post** is the text, author, timestamps, counters and media URLs. The media bytes themselves live in object storage and are not counted here.', '**10 KB per feed page**: about 20 hydrated posts (roughly 500 bytes each, compressed). Approximate.', 'Peak is **3 times** average: usage clusters around mornings and evenings.', 'Cache share is **5%** because the feed cache that matters most holds *post IDs per user* (computed separately below), not hydrated pages; the 5% here approximates a hot-post cache.', 'One feed-service server does **about 1,000 page loads a second** when each is mostly cache reads and a merge. A stated guess, to be measured.'],
      extra: [
        { label: 'Average fan-out per post', formula: '~200 followers per account (mean, skewed)', result: '~200 deliveries' },
        { label: 'Timeline inserts per day if every post fans out on write', formula: '100M posts x 200 followers', result: '~20 billion/day' },
        { label: 'Timeline inserts per second, average', formula: '20B / 86,400 s', result: '~230,000/s' },
        { label: 'One celebrity post', formula: '50M followers x 1 insert', result: '50 million inserts for one post' },
        { label: 'Feed cache of post IDs', formula: '200M users x 800 IDs x 8 B', result: '~1.3 TB per copy' },
        { label: 'Same cache with 3 copies', formula: '1.3 TB x 3', result: '~3.8 TB' }
      ],
      notes: [
        'Reads outnumber writes **20 to 1** in requests, but fan-out on write turns each post into hundreds of writes. **Total timeline writes (about 230,000 a second) are larger than total feed reads (about 23,000 a second)**. That inversion is the key insight to state out loud.',
        'The post store is modest: about 180 TB raw in five years (about 550 TB replicated). That is a sharded-store problem, not a hard one.',
        'The feed cache of IDs is only a few terabytes. IDs are 8 bytes, so keeping every active user\'s recent timeline in memory is realistic. Hydrating those IDs into full posts is a separate cache.',
        'Egress is about 230 MB/s average and 700 MB/s at peak for metadata alone, which is why feed responses are compressed and media goes through a CDN.'
      ]
    },
    api: [
      { method: 'POST', path: '/v1/posts', desc: 'Publish a post.',
        request: '{\n  "text": "Hello world",\n  "mediaIds": ["m_81f2"]\n}',
        response: '{\n  "postId": "1791234567890123456",\n  "createdAt": "2026-10-02T09:15:00Z"\n}',
        notes: ['Media is uploaded first (a pre-signed URL to object storage) and referenced by `mediaIds`, so this call stays small.', 'Accept an `Idempotency-Key` so a retried request after a timeout does not publish twice.', 'Return as soon as the post is durably stored. Fan-out happens afterwards and is not part of the response time.'] },
      { method: 'GET', path: '/v1/feed?limit=20&cursor={cursor}', desc: 'Load a page of the home feed.',
        response: '{\n  "posts": [ { "postId": "...", "author": {...}, "text": "...", "media": [...], "likes": 120, "comments": 8 } ],\n  "nextCursor": "eyJ0IjoxNzkx..."\n}',
        notes: ['The cursor is **opaque** to the client. Internally it is the last `postId` (or score plus ID) returned, so the next page is "items older than this", not "skip N rows".', 'An empty `nextCursor` means the end of the feed.', 'Optional `?since={cursor}` returns only posts newer than the top one, for the pull-to-refresh case.'] },
      { method: 'POST', path: '/v1/users/{id}/follow', desc: 'Follow a user.', notes: ['Idempotent: following twice is a no-op.', 'Also triggers a small **backfill**: copy that user\'s recent posts into the follower\'s timeline so the feed is not empty.'] },
      { method: 'DELETE', path: '/v1/users/{id}/follow', desc: 'Unfollow a user.', notes: ['Filter at read time (drop posts whose author is no longer followed) so the effect is immediate, and clean the timeline lazily.'] },
      { method: 'DELETE', path: '/v1/posts/{postId}', desc: 'Delete your own post.', notes: ['Mark deleted in the post store. Timelines keep the ID, and the read path drops deleted posts when it hydrates, so no fan-out of deletes is needed.'] }
    ],
    apiNotes: ['**Never use offset pagination** (`?page=5`) for a feed. New posts arrive constantly, so offsets shift and users see duplicates or miss items.', 'Rate limit publishing per user and feed reads per client. A buggy client polling every second multiplies load.', 'Return author data denormalized into each post (name, avatar URL) so the client needs one request, and accept that renames show up after a short delay.'],

    data: {
      intro: 'Three things are stored: the **posts** themselves, the **social graph** (who follows whom), and the **timelines** (per-user lists of post IDs). Posts and timelines are different data with different access patterns: posts are looked up by ID, timelines are read as the newest N entries for one user.',
      entities: [
        { name: 'post', purpose: 'Immutable-ish content, looked up by `post_id` when hydrating a feed.', fields: [
          ['post_id', 'bigint, primary key', 'Time-ordered ID (see the ID decision). Sorting by ID is sorting by time.'],
          ['author_id', 'bigint', 'Who wrote it. Secondary index for "posts by user" (profile page, pull model).'],
          ['text', 'string(~500)', ''],
          ['media', 'list of media IDs or URLs', 'Bytes live in object storage behind a CDN.'],
          ['created_at, deleted', 'timestamp, boolean', 'Soft delete so timelines can filter without being rewritten.']
        ] },
        { name: 'follow', purpose: 'Directed edge of the social graph. Needs both "who do I follow" and "who follows me".', fields: [
          ['follower_id', 'bigint', 'Partition key of table `following` (reads at feed time and for pull).'],
          ['followee_id', 'bigint', 'Partition key of a second copy, `followers` (read at fan-out time).'],
          ['created_at', 'timestamp', 'Both copies are written together; the second is a denormalized index.']
        ] },
        { name: 'timeline_entry', purpose: 'The precomputed feed. One row or list element per (user, post). Primary access: newest N for one user.', fields: [
          ['user_id', 'bigint, partition key', 'The reader whose feed this is.'],
          ['post_id', 'bigint, clustering key, descending', 'Doubles as the sort key and the pagination cursor.'],
          ['author_id', 'bigint', 'Lets the read path filter unfollowed authors.']
        ] },
        { name: 'post_stats', purpose: 'Likes and comment counts, updated far more often than the post, so kept apart.', fields: [
          ['post_id', 'bigint, primary key', ''], ['likes, comments, shares', 'counters', 'Approximate and eventually consistent. Often served from a cache.']
        ] }
      ],
      storage: [
        { title: 'Timelines in Redis sorted sets or lists', verdict: 'Fast, bounded',
          body: 'Keep each active user\'s newest ~800 post IDs in an in-memory structure keyed by `user_id`: a list pushed at the head and trimmed, or a sorted set scored by `post_id`. A feed read is one range query returning IDs in microseconds.\n\n```\nLPUSH  tl:{userId} {postId}     # fan-out step\nLTRIM  tl:{userId} 0 799        # keep the newest 800\nLRANGE tl:{userId} 0 19         # first page\n```\n\nThe cost: **memory is expensive** (about 1.3 TB per copy here), so keep only recently active users in memory and rebuild an inactive user\'s timeline on demand. Persistence is a cache, not the source of truth: the posts and graph can always regenerate it.' },
        { title: 'Timelines in a wide-column or key-value store', verdict: 'Durable, larger',
          body: 'A store such as Cassandra or DynamoDB with partition key `user_id` and clustering key `post_id DESC` holds timelines on disk with replication and no memory ceiling. A page is one partition range read.\n\nThe cost: reads are milliseconds rather than microseconds, **write amplification is heavy** (230,000 inserts a second on average), and per-user partitions need a TTL or trimming job or they grow forever. Common answer: a store for durability behind an in-memory cache for the active set.' },
        { title: 'Posts and the graph', verdict: 'Shard by id',
          body: 'Posts are a key lookup by `post_id`, so a key-value or sharded SQL store works well, sharded by `post_id` (even spread). The follow graph needs two lookups: by follower (for pull) and by followee (for fan-out), so store it twice, partitioned each way. A graph database is rarely necessary: this is one-hop adjacency, not multi-hop traversal.' }
      ],
      decisions: [
        { title: 'Post ID format', question: 'Timelines are sorted and paginated by post ID, so the ID needs to be unique, roughly time-ordered, and generated without a single central counter:',
          options: [
            { name: 'Database auto-increment', pros: 'Simple, strictly ordered.', cons: 'One primary is the bottleneck and the single point of failure. Hard across regions or shards.' },
            { name: 'Random UUID v4', pros: 'No coordination at all.', cons: 'Not time-ordered, so you cannot sort or paginate by ID and indexes fragment. Needs a separate timestamp column in every timeline entry.' },
            { name: 'Snowflake-style 64-bit ID (timestamp + machine + sequence)', pros: 'Coordination-free, sorts by creation time, fits in 8 bytes (cheap in timelines).', cons: 'Depends on reasonably synced clocks. Order is only approximate across machines within the same millisecond.' }
          ],
          pick: '**Snowflake-style IDs.** The timeline sort key and the cursor are the same 8-byte value, and ordering by ID is ordering by time within a millisecond or two, which is fine for a feed.' },
        { title: 'Pagination style', question: 'How does the client ask for the next page while new posts keep arriving?',
          options: [
            { name: 'Offset (`page=3`)', pros: 'Trivial to build, lets you jump to a page.', cons: 'Items shift as new posts arrive, so users see repeats or gaps. Gets slower for big offsets on disk-based stores.' },
            { name: 'Cursor / keyset (`before=postId`)', pros: 'Stable under inserts, constant cost per page, and it maps directly onto the sorted timeline.', cons: 'No random access to "page 50". Cursor must stay valid even if the post was deleted.' }
          ],
          pick: '**Cursor.** Return the last item\'s sort key, opaque to the client. For a ranked feed the cursor also carries a feed-session ID so the same ranked list is paged consistently.' }
      ]
    },
    design: {
      intro: 'The design is a **hybrid**: publishing a post fans it out into followers\' precomputed timelines (fast reads), except for accounts with huge follower counts, whose posts are merged in when the feed is read. **Click any box** for the reasoning, or pick a scenario to trace.',
      diagram: {
        title: 'News feed high-level design',
        nodes: [
          { id: 'client', label: 'Mobile or web client', kind: 'client',
            detail: { why: 'Publishes posts, uploads media straight to object storage with a pre-signed URL, and pages through the feed with an opaque cursor.', tradeoffs: ['Clients refresh and retry aggressively; every retry must be safe (idempotency key on publish, cursor on read).', 'Prefetching the next page hides latency but wastes work if the user stops scrolling.'], scale: 'Opening the app at 8 a.m. in one time zone is a synchronized read burst.' } },
          { id: 'cdn', label: 'CDN', kind: 'cdn',
            detail: { why: 'Images and video are the bulk of the bytes and are served from edge caches. The feed carries only URLs, so media traffic never reaches the feed service.', tradeoffs: ['Cache-control for deleted media: deleted posts may still be fetchable until the edge copy expires, unless you purge.', 'Egress cost is the dominant bill for a media-heavy feed.'], alternatives: ['Multiple CDN vendors for resilience'], scale: 'Cost and cache-hit rate, not capacity.' } },
          { id: 'storage', label: 'Media object storage', kind: 'storage',
            detail: { why: 'Durable, cheap storage for original and transcoded media. Clients upload directly to it, so large uploads bypass the application servers.', tradeoffs: ['Direct upload needs signed URLs and a completion callback before a post may reference the media.', 'Transcoding adds a delay before video is playable.'], alternatives: ['Block or file storage (does not scale as cheaply)'], scale: 'Total size grows without bound; lifecycle rules move cold media to cheaper tiers.' } },
          { id: 'lb', label: 'API gateway', kind: 'lb',
            detail: { why: 'Terminates TLS, authenticates the user, rate limits per user and routes publish and feed requests to separate services.', tradeoffs: ['A central gateway is a convenient place for auth and limits, and a single point to make highly available.'], alternatives: ['A plain layer 7 load balancer with auth in each service'], scale: 'TLS handshakes and connection counts at peak, about 70,000 feed reads a second.' } },
          { id: 'post', label: 'Post service', kind: 'service',
            detail: { why: 'Validates and stores a new post, then emits a "post created" event. It returns once the post is durable; fan-out is not on the request path.', tradeoffs: ['Separating publish from feed read lets them scale independently (1,160 vs 23,000 requests a second on average).', 'Emitting the event after the database write risks losing the event on a crash; use a transactional outbox or write the event first.'], scale: 'Low request rate; the hard work happens downstream of it.' } },
          { id: 'postdb', label: 'Post store', kind: 'db',
            detail: { why: 'System of record for post content, keyed by post ID and sharded for even spread. Everything else (timelines, caches) can be rebuilt from here and the follow graph.', tradeoffs: ['A key-value or sharded SQL store both fit: the access pattern is lookup by ID plus "posts by author".', 'Soft deletes keep the history that timelines refer to.'], alternatives: ['DynamoDB or Cassandra', 'Sharded MySQL or PostgreSQL'], scale: 'About 180 TB raw over five years; hot rows (viral posts) are served by the cache, not the store.' } },
          { id: 'queue', label: 'Fan-out queue', kind: 'queue',
            detail: { why: 'Decouples publishing from fan-out. A burst of posts, or one very large fan-out, builds a backlog here instead of slowing the publisher.', tradeoffs: ['Delivery is at-least-once, so inserting a post ID into a timeline must be idempotent (a sorted set ignores duplicates; a list needs a check).', 'Backlog means staleness: followers see the post later, but not lost.'], alternatives: ['Kafka partitioned by author', 'A managed queue service'], scale: 'Queue lag after a spike. Alert on lag, not on depth.' } },
          { id: 'fanout', label: 'Fan-out workers', kind: 'service',
            detail: { why: 'For each new post, look up the author\'s followers and push the post ID into each follower\'s timeline. Workers split big follower lists into batches and process them in parallel.', tradeoffs: ['Skip accounts above a follower threshold (the hybrid), and skip inactive followers whose timelines are not in memory.', 'Fan-out cost is proportional to followers, so cost is lumpy and unfair across authors.'], scale: 'About 230,000 timeline inserts a second on average; a 50-million-follower account would be 50 million inserts for one post without the hybrid.' } },
          { id: 'graph', label: 'Follow graph store', kind: 'db',
            detail: { why: 'Answers "who follows author X" (fan-out) and "whom does user Y follow" (read-time merge and the celebrity list). One-hop adjacency stored in both directions.', tradeoffs: ['Two denormalized copies must be written together; a failure between them leaves an edge visible in one direction only, which is repaired by a reconciliation job.', 'Paging a 50-million-entry follower list is itself a hard read.'], alternatives: ['A graph database (rarely needed for one hop)', 'Sharded SQL with two indexes'], scale: 'Follower lists of very large accounts: partition them and read in pages.' } },
          { id: 'tlcache', label: 'Timeline cache', kind: 'cache',
            detail: { why: 'Holds each active user\'s newest ~800 post IDs. A feed read becomes one range read of IDs instead of a join across everyone you follow.', tradeoffs: ['About 1.3 TB per copy, so keep only active users and rebuild a returning user\'s timeline from the post store.', 'It is a cache of derived data: losing it costs latency, not data.'], alternatives: ['Wide-column store for a durable copy', 'Sorted set versus list'], scale: 'Memory. A hot shard when one cache node holds many heavy users.' } },
          { id: 'feed', label: 'Feed service', kind: 'service',
            detail: { why: 'On a feed request it reads the user\'s timeline IDs, pulls in recent posts from followed celebrities, merges, drops deleted or unfollowed items, hydrates the posts, and optionally ranks them.', tradeoffs: ['The merge keeps writes cheap for celebrities at the cost of extra reads per feed load.', 'Hydration is many small lookups; batch them and cache aggressively.'], scale: 'About 70,000 requests a second at peak. The first thing to break is hydration fan-in to the post cache.' } },
          { id: 'postcache', label: 'Post cache', kind: 'cache',
            detail: { why: 'Hydrating 20 IDs into posts needs 20 lookups. Popular posts appear in millions of feeds, so a cache keyed by post ID turns most lookups into memory reads.', tradeoffs: ['Counts (likes, comments) change constantly; cache them with a short TTL or in a separate counters cache.', 'Deleted posts must be invalidated or filtered.'], alternatives: ['Memcached', 'Local in-process cache for the hottest posts'], scale: 'A viral post is a hot key: replicate it or keep a local copy per feed server.' } },
          { id: 'ranker', label: 'Ranking service', kind: 'service',
            detail: { why: 'Scores candidate posts (recency, affinity to the author, engagement) and returns an order. Kept as a separate service so models change without touching storage.', tradeoffs: ['Ranking more candidates gives better feeds and costs more CPU and latency; cap candidates (a few hundred) and the time budget.', 'On timeout, fall back to chronological order rather than failing the feed.'], alternatives: ['No ranking: chronological only', 'Precomputed scores updated by a batch job'], scale: 'Model inference latency at peak; use a strict timeout and a cheap fallback.' } }
        ],
        edges: [
          { from: 'client', to: 'lb', label: 'HTTPS' },
          { from: 'client', to: 'cdn', label: 'media' },
          { from: 'cdn', to: 'storage' },
          { from: 'lb', to: 'post', label: 'publish' },
          { from: 'lb', to: 'feed', label: 'read' },
          { from: 'post', to: 'postdb', label: 'insert' },
          { from: 'post', to: 'queue', label: 'event', style: 'async' },
          { from: 'queue', to: 'fanout', style: 'async' },
          { from: 'fanout', to: 'graph', label: 'followers' },
          { from: 'fanout', to: 'tlcache', label: 'push IDs' },
          { from: 'feed', to: 'tlcache', label: 'read IDs' },
          { from: 'feed', to: 'graph', label: 'celebrities' },
          { from: 'feed', to: 'postcache', label: 'hydrate' },
          { from: 'postcache', to: 'postdb', label: 'on miss' },
          { from: 'feed', to: 'ranker', label: 'score' }
        ],
        scenarios: [
          { id: 'publish', label: 'Publish a normal post', steps: [
            { title: 'Client publishes', path: ['client', 'lb'], note: 'The client sends text and media IDs (media was uploaded earlier directly to object storage) with an idempotency key.' },
            { title: 'Route to post service', path: ['lb', 'post'], note: 'The gateway authenticates, rate limits and forwards to the post service.' },
            { title: 'Store the post', path: ['post', 'postdb'], note: 'The post is written durably with a new time-ordered ID. After this the post can never be lost, even if every cache is wiped.' },
            { title: 'Emit event', path: ['post', 'queue'], note: 'A "post created" event goes to the queue. The client already has its response.' },
            { title: 'Find followers', path: ['queue', 'fanout', 'graph'], note: 'A worker reads the author\'s follower list in batches. An author under the threshold (say 10,000 followers) is fanned out on write.' },
            { title: 'Push into timelines', path: ['fanout', 'tlcache'], tone: 'ok', note: 'The worker inserts the post ID at the head of each active follower\'s timeline and trims to 800. Inactive followers are skipped and rebuilt on their next visit.' }
          ] },
          { id: 'celebrity', label: 'Celebrity post (pull side)', steps: [
            { title: 'Post stored as usual', path: ['client', 'lb', 'post', 'postdb'], note: 'A 50-million-follower account publishes. The post is stored exactly like any other.' },
            { title: 'Fan-out is skipped', path: ['post', 'queue', 'fanout'], tone: 'accent', note: 'The worker sees the author is flagged as a celebrity (follower count over the threshold) and writes nothing to follower timelines. This avoids 50 million inserts for one post.' },
            { title: 'Reader opens the feed', path: ['client', 'lb', 'feed'], note: 'Later, a follower loads their feed.' },
            { title: 'Find followed celebrities', path: ['feed', 'graph'], note: 'The feed service asks the graph for the celebrities this user follows (a short list, often under a dozen) and fetches their latest post IDs.' },
            { title: 'Merge at read time', path: ['feed', 'tlcache'], tone: 'ok', note: 'It merges the user\'s precomputed timeline with the celebrities\' recent posts by ID, which sorts by time.' }
          ] },
          { id: 'read', label: 'Read the feed', steps: [
            { title: 'Client asks for page one', path: ['client', 'lb', 'feed'], note: 'GET /v1/feed with no cursor (or with the cursor from the previous page).' },
            { title: 'Read timeline IDs', path: ['feed', 'tlcache'], note: 'One range read returns the newest IDs. On a cache miss for a returning user, the timeline is rebuilt from the graph and post store (the slow path).' },
            { title: 'Add celebrity posts', path: ['feed', 'graph'], note: 'Recent posts from followed celebrities are merged in. Posts by accounts the user has since unfollowed are dropped.' },
            { title: 'Hydrate posts', path: ['feed', 'postcache', 'postdb'], tone: 'hard', note: 'IDs become posts through batched lookups. Most hit the post cache; misses go to the post store. Deleted posts are dropped here.' },
            { title: 'Rank', path: ['feed', 'ranker'], note: 'Candidates are scored and ordered under a strict time budget. If ranking is slow, return them in chronological order.' },
            { title: 'Return with a cursor', path: ['lb', 'client'], tone: 'ok', note: 'The page and an opaque cursor go back. Media URLs point at the CDN, which serves the bytes.' }
          ] }
        ]
      },
      walkthrough: [
        '**Publish**: store the post, return, emit an event. A worker pushes the post ID into each active follower\'s cached timeline, except for celebrity authors.',
        '**Read**: fetch the user\'s timeline IDs, merge recent posts from followed celebrities, drop deleted items, hydrate through a post cache, rank, and return a page with a cursor.',
        '**Why a hybrid**: pure fan-out on write makes celebrity posts cost tens of millions of writes; pure fan-out on read makes every feed load a join across hundreds of authors. The hybrid pays for pushes where followers are few and for pulls where a few authors have many followers.',
        '**Failure modes**: losing the timeline cache raises feed latency (rebuild from the graph and posts) but loses no data; losing the queue delays freshness; a ranker timeout degrades to chronological order.'
      ],
      notes: ['The ID is the glue: it is the post key, the timeline sort key, the cursor, and an approximate timestamp.']
    },
    deepDives: [
      { id: 'fanout', title: 'Fan-out on write versus fan-out on read',
        question: 'When a user publishes, do you build followers\' feeds immediately, or build the feed when someone opens the app? Which is better?',
        answer: 'Both are valid; the numbers decide.\n\n- **Fan-out on write (push)**: on publish, insert the post ID into every follower\'s timeline. Reads are one cheap range query. But writes multiply: 100 million posts a day times about 200 followers is roughly 20 billion timeline inserts a day (about 230,000 a second), and most go to users who never open the app that day.\n- **Fan-out on read (pull)**: store only the post. When a user opens the feed, fetch the latest posts of every account they follow and merge. Writes are trivial and there is nothing wasted, but each feed load costs about 200 lookups plus a merge, at 70,000 loads a second peak, with a 300 ms budget.\n\nBecause reads need to be fast and most accounts have few followers, **push is the default**. The pain point is skewed follower counts, which is why production designs use a hybrid (next dive).',
        followups: [
          { q: 'Which costs more in total?', a: 'Push does more total work (writes scale with followers, including inactive ones), pull does less total work but pays at the worst moment, in the request path. Push moves cost off the latency-sensitive path and onto asynchronous workers you can scale and delay.' },
          { q: 'How do you avoid wasting writes on inactive users?', a: 'Only push into timelines that are in the cache (recently active users). A returning inactive user triggers a rebuild from the graph and posts, a pull computed once and then kept warm.' },
          { q: 'What if a user follows 5,000 accounts?', a: 'Push handles it for free on the read side. In a pull-only design it would be 5,000 lookups per load, which is why a follow cap or a bounded candidate set matters there.' }
        ] },
      { id: 'hybrid', title: 'The celebrity problem and the hybrid',
        question: 'One account has 50 million followers. What happens when they post, and how do you design around it?',
        answer: 'Pure push turns one post into 50 million timeline inserts. At even 100,000 inserts a second per cluster that is minutes of work for a single post, it crowds out everyone else\'s fan-out, and followers see the post at wildly different times.\n\nThe **hybrid**: flag accounts whose follower count exceeds a threshold (for example 10,000, chosen from the distribution). Their posts are **not** pushed. A reader\'s feed request merges (a) the precomputed timeline with (b) the latest posts from the celebrities that reader follows, which is a short list. Merge by post ID, which orders by time.\n\nRegular accounts stay on push, so the common case is still one range read; the extra read cost is bounded by how many celebrities one person follows.',
        followups: [
          { q: 'How do you pick the threshold?', a: 'From data: plot follower counts, pick the point where the tail accounts for a large share of fan-out writes. Make it a config value, and hysteresis on the flag (switch to celebrity at 12,000, back below 8,000) so accounts do not flap.' },
          { q: 'What happens when an account crosses the threshold?', a: 'New posts stop being pushed. Old posts already in timelines stay and age out. Readers pick the new posts up through the pull path, so there is no migration, only a flag change.' },
          { q: 'Is there a middle ground?', a: 'Yes: push to the most active followers only (those seen in the last few days) and let the rest pull. This caps writes without making every reader merge.' },
          { q: 'Does the merge hurt latency?', a: 'It adds a bounded number of lookups. Cache each celebrity\'s latest 20 post IDs, one key per celebrity shared by all their followers, so the extra reads are mostly cache hits.' }
        ] },
      { id: 'ranking', title: 'Feed storage and ranking',
        question: 'How do you move from a chronological list to a ranked feed without redesigning storage?',
        answer: 'Keep storage chronological and treat ranking as **re-ordering candidates**. The feed service takes the newest few hundred IDs from the timeline (plus celebrity posts), hydrates them, sends them with features (recency, closeness to the author, engagement counts, media type) to a ranking service, and returns the top 20 sorted by score.\n\nTwo cautions. First, **budget**: cap candidates and give the ranker a hard timeout with a chronological fallback, because a slow model must not break the feed. Second, **stable pages**: if scores change between page one and page two, items move and users see repeats. Pin a ranked list for a feed session (store the ranked IDs under a short-lived session key referenced by the cursor), or page through the chronological candidates and rank each page locally.',
        followups: [
          { q: 'Where do engagement counts come from?', a: 'A separate counters store updated asynchronously from like and comment events. Rankers accept slightly stale counts, and exactness is not worth the write cost.' },
          { q: 'How do you avoid showing posts the user has already seen?', a: 'Track a seen-set per user (a bloom filter or a high-water mark by post ID) and filter candidates. State the false-positive trade-off: a bloom filter may hide an unseen post rarely, which is acceptable.' },
          { q: 'How would you A/B test a new ranker?', a: 'Assign users to a bucket by hashing user ID, route their candidate lists to the new model, and log impressions and engagement keyed by bucket. The storage design does not change at all.' }
        ] },
      { id: 'pagination', title: 'Pagination and cursors',
        question: 'Design the pagination so a user scrolling never sees duplicates or gaps while new posts keep arriving.',
        answer: 'Use a **cursor** (keyset) rather than an offset. The cursor encodes the sort key of the last item returned, such as its post ID. The next request is "give me 20 items older than this ID", which is a range read on the sorted timeline and costs the same for page 1 and page 50.\n\nNew posts go to the head, so older pages are unaffected: no duplicates, no gaps. Pull-to-refresh uses the mirror image, "items newer than my top ID".\n\nThe cursor stays opaque to clients (base64 of a small structure with a version), so you can later add a ranking-session ID or a shard hint without an API change. It must keep working when the item it names has been deleted: "older than this ID" does not need the item to exist.',
        followups: [
          { q: 'What if two posts have the same timestamp?', a: 'Sort by a unique ID (Snowflake IDs are unique and almost time-ordered), so there are no ties. With timestamps alone, the cursor needs a tie-break such as (timestamp, id).' },
          { q: 'How deep can a user scroll?', a: 'Bounded by the cached timeline (about 800 items). Past that, either stop ("you are all caught up") or fall back to a slower pull path from the post store. Say which one and why.' },
          { q: 'Why not just use offsets with caching?', a: 'The list is a moving target. An offset that meant "item 40" a minute ago points at a different item after ten new posts arrive, so users get repeats.' }
        ] },
      { id: 'cache', title: 'Caching the timeline and cold starts',
        question: 'What do you cache, how do you size it, and what happens to a user returning after a month?',
        answer: 'Cache three things. **Timelines of IDs** per active user (about 1.3 TB per copy at 800 IDs for 200 million users, a few terabytes with replicas), a **post cache** keyed by post ID for hydration (popular posts appear in millions of feeds), and a **counters cache** with a short TTL.\n\nKeep timelines only for users active in the last few days. A returning user has no timeline: the feed service rebuilds it by reading the people they follow, fetching each one\'s latest posts, merging, and writing the result back (a pull, once). This is slower, so show a loading state or serve a partial feed and fill in behind it. Evict least-recently-active timelines first.',
        followups: [
          { q: 'What if the whole timeline cache is lost?', a: 'It is derived data. Feeds degrade to the slow rebuild path, so protect the post store and graph with rate limits, rebuild users in priority order (most active first), and warm the replacement cache before sending it full traffic.' },
          { q: 'How do you spot a hot cache shard?', a: 'Heavy users and consistent hashing can put a lot of load on one node. Watch per-node QPS and memory against the cluster average and split or rebalance the slot.' },
          { q: 'Why store IDs and not whole posts in the timeline?', a: 'Posts are shared across millions of timelines, so copying them multiplies memory, and edits or deletes would need fan-out. IDs are 8 bytes and the content is fetched once from a shared cache.' }
        ] },
      { id: 'consistency', title: 'Consistency, deletes and unfollows',
        question: 'What consistency do users expect from a feed, and how do you handle delete, unfollow and "my own post is missing"?',
        answer: 'The feed is **eventually consistent**: a few seconds of delay on a follower\'s feed is fine. Three cases need explicit care.\n\n- **Your own post** must appear immediately in your own feed, or users think it failed. Insert it into the author\'s timeline synchronously (or merge the author\'s recent posts at read time) so read-your-writes holds for them.\n- **Delete**: mark the post deleted in the post store and filter at hydration. Do not fan out the delete into millions of timelines.\n- **Unfollow**: filter at read time by checking the author against the user\'s follow list, and let the timeline entries age out or be cleaned lazily.',
        followups: [
          { q: 'How would you guarantee the fan-out never loses a post for a follower?', a: 'Make the queue durable and the insert idempotent so retries are safe. A periodic reconciliation can compare a sample of timelines against the graph and posts. The source of truth is always the post store, so a missing entry is recoverable.' },
          { q: 'What about a follow made a second ago?', a: 'Backfill the followee\'s recent posts into the new follower\'s timeline asynchronously, and for the first minutes merge that followee at read time so the feed is not empty.' }
        ] },
      { id: 'graph', title: 'Storing and querying the follow graph',
        question: 'How do you store who follows whom so both fan-out and feed reads are fast?',
        answer: 'Store each edge **twice**: by follower (to answer "whom do I follow", used on feed read) and by followee (to answer "who follows X", used at fan-out). Both are partitioned by their lookup key, so each query is a single-partition read. This is one-hop adjacency, so a plain key-value or wide-column store is enough and a graph database is rarely needed.\n\nFor giant accounts, the followee-side list is huge. Store it in pages or chunks (followee, chunk number) so workers read and process it in parallel batches. Counts (follower count) are kept separately as counters, not by counting rows.',
        followups: [
          { q: 'How do you keep both copies consistent?', a: 'Write one in the request path and the other from an event (or both in a transaction if the store supports it), then reconcile with a periodic job. A briefly missing reverse edge means a missed fan-out for a recent follow, which the backfill covers.' },
          { q: 'Could you support "mutual followers" or friends-of-friends?', a: 'That is multi-hop and needs set intersections over adjacency lists or a graph engine. It belongs to recommendations, not to the core feed path, which is why we scope it out.' }
        ] }
    ],

    bottlenecks: [
      { title: 'Fan-out write amplification', problem: 'About 230,000 timeline inserts a second on average and far more in a burst, dominated by a minority of authors with many followers.', mitigation: 'The hybrid threshold, skipping inactive followers, batching inserts into pipelines, and a queue so bursts become lag instead of failures. Monitor fan-out lag as a first-class metric.' },
      { title: 'Celebrity posts and hot keys', problem: 'A post by a huge account is read by millions in minutes. The post, its counters and the celebrity\'s recent-posts key become hot cache keys.', mitigation: 'Keep a short-TTL in-process copy of the hottest posts on each feed server, replicate known-hot keys across cache nodes, and cache the celebrity\'s recent IDs once for all readers.' },
      { title: 'Timeline cache memory', problem: 'Several terabytes of IDs, and growth in users or timeline depth multiplies it.', mitigation: 'Cache only active users, trim to a fixed depth, store IDs rather than posts, and rebuild cold users on demand. Trade cold-start latency for memory.' },
      { title: 'Hydration fan-in', problem: 'Each feed page needs about 20 post lookups plus counters. At 70,000 pages a second that is over a million lookups a second.', mitigation: 'Batch multi-gets, keep a post cache with a high hit rate, store author snapshots with the post, and serve counters from a separate short-TTL cache.' },
      { title: 'Ranking latency', problem: 'A model scoring hundreds of candidates adds latency to every feed load and can time out at peak.', mitigation: 'Cap candidates, set a hard budget with a chronological fallback, precompute features, and consider ranking only the first page synchronously.' },
      { title: 'Cold start after a cache loss', problem: 'Rebuilding timelines for hundreds of millions of users from the post store and graph overloads those stores.', mitigation: 'Rebuild by priority, rate limit rebuilds, warm new nodes before routing traffic, and degrade to a pull-based feed meanwhile.' }
    ],

    mistakes: [
      'Picking pure **fan-out on write** or pure **fan-out on read** without computing the numbers or mentioning celebrities.',
      'Not noticing that fan-out on write makes **total writes larger than total reads**.',
      'Using **offset pagination** for a list that changes constantly.',
      'Storing whole posts in every timeline instead of **IDs**, and then needing a fan-out to edit or delete.',
      'Treating the **follow graph** as a graph-database problem when it is one-hop adjacency.',
      'Putting **ranking** inside the storage design, or letting a slow ranker fail the whole feed.',
      'Ignoring **delete and unfollow**: they cannot be fanned out cheaply, so read-time filtering is needed.',
      'Fanning out to **inactive users**, wasting most of the write budget.',
      'Putting media bytes through the feed servers instead of a CDN.',
      'Forgetting that a new author\'s **own post must show up for them** immediately.',
      'Never saying what breaks first and at 10x.'
    ],

    pushes: [
      { q: 'Why not just compute the feed on read with a SQL join?', why: 'It is the first design everyone sketches; they want to see you compute its cost.', good: 'Show the math: about 200 followees at 70,000 loads a second means millions of lookups a second inside a 300 ms budget. Concede that pull is simplest and fine for small scale, then say what pushes you to precompute.' },
      { q: 'What is your threshold for a celebrity and how do you choose it?', why: 'They are testing whether the hybrid is hand-waved.', good: 'Choose from the follower distribution so that the tail accounts for most fan-out writes, make it a config with hysteresis, and explain the read-time cost bound (a user follows a limited number of celebrities).' },
      { q: 'A user unfollows someone. When does their posts disappear from the feed?', why: 'It checks whether you understand the cost of precomputed state.', good: 'Immediately, via read-time filtering against the follow list. The stale timeline entries are cleaned lazily. Never fan out an unfollow.' },
      { q: 'What happens if your timeline cache dies?', why: 'Single points of failure and derived-data thinking.', good: 'It is derived data, so no data loss. Feeds fall back to a slower rebuild from the graph and posts. Discuss prioritized rebuilds, rate limiting the rebuild, and warming the replacement.' },
      { q: 'How would you make the feed ranked and still paginate cleanly?', why: 'Ranked lists are not stable under paging.', good: 'Pin a ranked candidate list per feed session and have the cursor reference it, or rank within the chronological pages. State that offsets are not an option and that a session key has a TTL.' },
      { q: 'How do you handle a post that is edited or deleted after being fanned out?', why: 'They want to see why timelines store IDs.', good: 'Timelines hold IDs only. Edits are visible because content is hydrated from the shared post cache, and deletes are filtered at hydration. Invalidate the post cache entry.' },
      { q: 'How would this change at 10 times the scale?', why: 'Where does it break first.', good: 'Fan-out write throughput and timeline memory first. Respond with a lower celebrity threshold, pushing only to recently active followers, a regional timeline cache, and multi-region replication of the post store.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why does fan-out on write make total writes larger than total reads in this system?', choices: ['Each post is copied into the timeline of every follower, about 200 inserts per post, while a feed read is one request', 'Writes are always more frequent than reads in social networks', 'Posts are stored three times for durability only', 'Feed reads are served from a CDN and do not count'], answer: 0, explain: '100 million posts a day times about 200 followers is about 20 billion inserts a day, compared with about 2 billion feed reads a day.' },
      { kind: 'concept', q: 'What problem does the hybrid approach (push for most, pull for celebrities) solve?', choices: ['A single post from an account with millions of followers causing millions of timeline writes', 'Slow reads for users who follow nobody', 'Duplicate posts in the feed', 'Media files being too large for the cache'], answer: 0, explain: 'Pushing a 50-million-follower post is an enormous burst of writes. Pulling those few accounts at read time bounds the cost by how many celebrities each reader follows.' },
      { kind: 'concept', q: 'Why is cursor pagination preferred over offset pagination for a feed?', choices: ['New posts shift offsets, causing duplicates or gaps, while a cursor names a stable position', 'Cursors allow jumping straight to page 50', 'Offsets cannot be used with caches', 'Cursors avoid any need for sorting'], answer: 0, explain: 'The head of the list keeps changing. "Older than this ID" stays correct while "skip 40" does not.' },
      { kind: 'concept', q: 'What should a timeline entry store?', choices: ['The post ID (plus minimal metadata), with content hydrated from a shared post cache', 'The full post text and media for fast reads', 'Only the author ID', 'A copy of the author\'s entire profile'], answer: 0, explain: 'IDs are 8 bytes, edits and deletes need no fan-out, and popular posts are cached once instead of per timeline.' },
      { kind: 'concept', q: 'A user unfollows an account. Pick the correct approaches.', choices: ['Filter by the current follow list when reading the feed', 'Fan out a delete to remove entries from the timeline immediately', 'Clean old entries lazily or let them age out', 'Rebuild every follower\'s timeline of the other account'], answer: [0, 2], explain: 'Read-time filtering makes the effect immediate and cheap. Active fan-out for unfollows is costly and unnecessary.' },
      { kind: 'complexity', q: 'About how big is a timeline cache holding 800 eight-byte post IDs for 200 million users, per copy?', choices: ['About 1.3 TB', 'About 13 GB', 'About 130 TB', 'About 13 MB'], answer: 0, explain: '200 million x 800 x 8 bytes = 1.28 trillion bytes, about 1.3 TB (ignoring structure overhead).' },
      { kind: 'concept', q: 'A returning user has no cached timeline. What does the feed service do?', choices: ['Rebuild it by pulling recent posts from followed accounts, merge, and cache the result', 'Return an empty feed', 'Fan out every post from the past month', 'Read directly from the CDN'], answer: 0, explain: 'The timeline is derived data. A one-time pull from the graph and post store recreates it, then it stays warm.' }
    ],

    flashcards: [
      { id: 'push-pull', front: 'News feed: fan-out on write vs on read?', back: 'Write (push): copy the post ID into each follower\'s timeline, so reads are one cheap lookup but writes multiply. Read (pull): store once and merge on load, so writes are cheap but each read is expensive.' },
      { id: 'hybrid', front: 'What is the hybrid feed design?', back: 'Push for normal accounts, skip push for accounts above a follower threshold and merge their latest posts at read time.' },
      { id: 'write-amp', front: 'Estimate fan-out volume for 100M posts/day and 200 followers?', back: 'About 20 billion timeline inserts a day, around 230,000 a second: larger than the roughly 23,000 feed reads a second.' },
      { id: 'cursor', front: 'Why cursors instead of offsets for feeds?', back: 'The list changes at the head. A cursor (last seen ID) is a stable position; an offset shifts and causes repeats or gaps.' },
      { id: 'id-only', front: 'Why do timelines store post IDs, not posts?', back: 'IDs are 8 bytes. Edits and deletes need no fan-out, and popular posts are cached once and shared.' },
      { id: 'unfollow-delete', front: 'How are delete and unfollow handled in a precomputed feed?', back: 'Filter at read time (deleted flag, current follow list) and clean timelines lazily. Never fan the removal out.' },
      { id: 'rank-fallback', front: 'How do you rank a feed without breaking it?', back: 'Rank a capped set of candidates under a time budget, fall back to chronological on timeout, and pin the ranked list per session for stable paging.' }
    ]
  });
})();
