/* System design case study: video streaming (YouTube/Netflix-style). Schema: data/sd/schema.md.
   All numbers are rounded estimates; "a common approach" means a widely used pattern, not a claim about any company. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.cases = SD.cases || [];
  SD.cases.push({
    id: 'video-streaming',
    title: 'Design a video streaming platform',
    short: 'Upload, transcode, store and stream video to millions of viewers. Heavy on pipelines, CDNs and egress cost.',
    difficulty: 'Hard',
    time: '60 min',
    tags: ['Transcoding', 'CDN', 'Blob storage', 'Adaptive bitrate', 'Counters'],
    prompt: 'Design a video platform like YouTube or Netflix. Creators upload videos; viewers search for them and watch on any device and network, with playback that starts fast and rarely stalls.',

    requirements: {
      functional: [
        'Upload a video file (large, possibly resumable) with a title, description and thumbnail.',
        'Process each upload into formats that play on phones, browsers and TVs.',
        'Stream a video with fast start, seeking and quality that adapts to the viewer\'s bandwidth.',
        'Search and browse by title, tags and channel; show a video page with metadata and a view count.',
        'Count views and likes per video.',
        'Stretch: personalised recommendations on the home page.'
      ],
      nonFunctional: [
        '**Playback start** under about 2 seconds at the 95th percentile and **rebuffering** on fewer than 1% of sessions.',
        '**Availability** matters most for playback (99.99%). A slow or failed upload pipeline is less severe: delay it, never lose the original.',
        '**Durability**: an uploaded original must never be lost.',
        '**Scale**: tens of millions of daily viewers, a few hundred thousand uploads a day. Egress bandwidth dominates the bill.',
        'Eventual consistency is fine for view counts and search; a video should become playable soon after processing, not instantly.'
      ],
      outOfScope: ['Live streaming (different latency and ingest design).', 'DRM and licensing deals in depth (mention hooks only).', 'Ads, payments and creator monetisation.', 'Comments and social features.', 'Content moderation models (mention a hook in the pipeline).'],
      assumptions: ['Average video is about 8 minutes; average viewing session is about 5 minutes.', 'Most uploads arrive from phones and cameras as H.264 or H.265 at 1080p or lower.', 'Viewers are spread across continents; most watch popular and recent videos (a long tail of rarely watched ones).'],
      clarify: [
        { q: 'Video on demand only, or live as well?', a: 'Assume on demand. Live needs a low-latency ingest and a packaging step that runs in seconds, which is a different problem. Say so and move on.' },
        { q: 'What devices and what maximum quality?', a: 'Assume phones, browsers and smart TVs, up to 1080p with an optional 4K tier. That fixes the rendition ladder and the codec list.' },
        { q: 'How fast must an uploaded video be watchable?', a: 'Minutes, not seconds. A fast low-quality rendition can publish first and higher qualities follow. This lets the pipeline be asynchronous and queue-based.' },
        { q: 'Are view counts billing-grade or just displayed?', a: 'Displayed. Approximate and a little late is fine, which allows batching and sharded counters. If monetisation depends on exact counts, that is a separate audited pipeline.' }
      ]
    },

    estimates: {
      intro: 'Model 50 million daily viewers who each start about 4 videos, and a creator side of 100,000 uploads a day. The interesting numbers are **egress** (viewers) and **stored bytes** (all renditions of every upload), because both are enormous next to the request rate. The calculator\'s "write" is an **upload** and its "read" is a **play**.',
      inputs: { dau: 50e6, writesPerUser: 0.002, readsPerUser: 4, peakFactor: 3, bytesPerWrite: 800e6, bytesPerRead: 100e6, years: 5, replication: 1.5, hotFraction: 0.01, serverQps: 500, utilization: 0.6 },
      assumptions: [
        '**100,000 uploads a day** is 50M viewers x 0.002 uploads each (about 1 uploader in 500 viewers).',
        '**800 MB stored per upload (approximate)**: about 200 MB original plus roughly 600 MB for a 5 to 6 rung ladder (240p to 1080p) in one codec. Extra codecs and 4K add more.',
        '**100 MB streamed per play (approximate)**: 5 minutes at an average delivered bitrate near 2.5 Mbps.',
        '**Replication 1.5** stands for erasure coding (for example 6 data plus 3 parity shards, which costs 1.5x) rather than three full copies. Raw originals are often kept at higher durability.',
        '**Peak is 3x average**: evening peaks and a hit video. Servers here means the API and manifest tier, not the CDN that moves the bytes.',
        'The calculator\'s **ingress** row multiplies uploads by the 800 MB stored size, so it overstates what clients send. Real upload ingest is about 200 MB per upload (see the extra rows); the rest is created inside the pipeline.',
        'The calculator\'s cache row is the **bytes streamed** from a 1% slice of the day\'s plays, not the unique footprint. The hot set that a CDN holds is far smaller than total storage.'
      ],
      extra: [
        { label: 'Plays per second, average', formula: '50M x 4 / 86,400', result: '~2,300/s' },
        { label: 'Egress, average (approximate)', formula: '2,315 plays/s x 100 MB = 231 GB/s x 8', result: '~1.9 Tbit/s' },
        { label: 'Egress, peak', formula: '1.9 Tbit/s x 3', result: '~5.5 Tbit/s (served by a CDN, not an origin)' },
        { label: 'Video-minutes uploaded per day', formula: '100,000 x 8 min', result: '800,000 min' },
        { label: 'Transcode work (approximate)', formula: '800,000 min x 6 renditions x ~1 core-minute per video-minute', result: '~4.8M core-minutes/day = ~3,300 cores average, ~10,000 at a 3x peak' },
        { label: 'Upload ingest, average', formula: '100,000 x 200 MB / 86,400 s', result: '~230 MB/s (~1.9 Gbit/s)' },
        { label: 'Raw storage added per day', formula: '100,000 x 800 MB', result: '80 TB/day, about 29 PB a year' }
      ],
      notes: [
        '**Egress is the problem.** Roughly 2 Tbit/s average cannot come from your own origin. It is served from CDN caches near viewers, and a cache hit ratio of 95%+ is what keeps the origin at tens of Gbit/s.',
        'Request rate is modest: about 2,300 plays a second means the **metadata and manifest tier is small** (tens of servers). The bytes, not the QPS, drive the architecture.',
        'Storage grows about 29 PB a year at these assumptions, so you need **blob/object storage** with tiering. Old, rarely watched videos can move to cheaper cold storage or drop the biggest renditions.',
        'Transcoding is a **bursty batch workload**: thousands of cores at peak, near idle overnight. It fits a queue of independent jobs on autoscaled or spot machines, never the API servers.',
        'Cost drivers in order: CDN egress, then storage, then transcoding compute. Bytes per play and cache hit ratio are the two numbers to protect.'
      ]
    },

    api: [
      { method: 'POST', path: '/v1/videos', desc: 'Start an upload: create the video record and get upload URLs.',
        request: '{\n  "title": "Trail run, 8 km",\n  "description": "...",\n  "sizeBytes": 214748364,\n  "contentType": "video/mp4"\n}',
        response: '{\n  "videoId": "v_8fKq2",\n  "uploadId": "u_91xz",\n  "partSizeBytes": 8388608,\n  "partUrls": ["https://up.example.com/u_91xz/1?sig=...", "..."]\n}',
        notes: ['The video starts in state `UPLOADING`. The client sends **parts straight to object storage** with signed URLs, so file bytes never pass through the API servers.', 'Each part is retried independently, so a dropped connection resumes from the last good part.'] },
      { method: 'POST', path: '/v1/videos/{id}/complete', desc: 'Tell the service all parts are uploaded.', request: '{ "uploadId": "u_91xz", "parts": [{ "n": 1, "etag": "..." }] }', response: '{ "videoId": "v_8fKq2", "state": "PROCESSING" }',
        notes: ['Storage assembles the parts; the service then enqueues a **transcode job**. Idempotent: completing twice does not enqueue twice.'] },
      { method: 'GET', path: '/v1/videos/{id}', desc: 'Video metadata for the watch page.', response: '{\n  "videoId": "v_8fKq2",\n  "title": "Trail run, 8 km",\n  "state": "READY",\n  "durationSec": 483,\n  "viewCount": 18204,\n  "manifestUrl": "https://cdn.example.com/v_8fKq2/master.m3u8"\n}',
        notes: ['The view count is read from a cache and is allowed to be seconds or minutes behind.', 'Return `PROCESSING` or `FAILED` as a state so the client can show a useful message instead of a 404.'] },
      { method: 'GET', path: '/v1/videos/{id}/manifest', desc: 'Get the playback manifest (or redirect to its CDN URL).', response: '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720\n720p/index.m3u8',
        notes: ['Signed or tokenised URLs when videos are private or paid. Manifests are tiny and highly cacheable.'] },
      { method: 'GET', path: '/v1/search?q=trail+run&cursor=...', desc: 'Search videos by text.', response: '{ "items": [{ "videoId": "...", "title": "...", "thumb": "..." }], "nextCursor": "..." }', notes: ['Cursor pagination, because offset pagination gets slow and unstable on a live index.'] },
      { method: 'POST', path: '/v1/videos/{id}/view', desc: 'Record a view (sent by the player, not the CDN).', request: '{ "sessionId": "s_77", "positionSec": 31 }', notes: ['Fire-and-forget. A view counts only after the player has watched a minimum duration, which filters accidental plays and a lot of bot traffic.'] }
    ],
    apiNotes: ['Segments themselves are plain HTTP GETs to the **CDN** on a separate domain. They are not part of the API.', 'Uploads and metadata edits need auth; watching public videos does not. Rate limit uploads per account and view events per session.'],

    data: {
      intro: 'Three kinds of data with three different shapes. **Metadata** is small, structured and read often. **Video bytes** are huge immutable blobs addressed by key. **Counters** are write-heavy tiny numbers. Keep them in separate stores so each can scale on its own terms.',
      entities: [
        { name: 'video', purpose: 'One row per video. The system of record for metadata and processing state. Read by `video_id` on every watch page.', fields: [
          ['video_id', 'string, primary key', 'Random or time-ordered ID. Not guessable for private videos.'],
          ['owner_id', 'bigint', 'Channel or user. Indexed for the creator\'s video list.'],
          ['title, description, tags', 'text', 'Also indexed in the search store.'],
          ['state', 'enum', 'UPLOADING, PROCESSING, READY, FAILED, REMOVED.'],
          ['duration_sec, created_at', 'int, timestamp', ''],
          ['visibility', 'enum', 'public, unlisted, private.']
        ] },
        { name: 'rendition', purpose: 'One row per encoded output. The manifest is built from these.', fields: [
          ['video_id', 'string', 'Partition key.'], ['profile', 'string', 'For example `h264-720p` or `av1-1080p`.'], ['bitrate_kbps, width, height', 'int', ''], ['object_prefix', 'string', 'Where its segments live in object storage.'], ['state', 'enum', 'PENDING, READY, FAILED. A video is playable once its first rungs are READY.']
        ] },
        { name: 'view_count (counter store)', purpose: 'Approximate running totals, updated in batches.', fields: [['video_id', 'string', 'Key.'], ['shard', 'int', 'Optional counter shard for very hot videos.'], ['count', 'bigint', 'Summed on read or periodically rolled up.']] },
        { name: 'view_event (log)', purpose: 'Append-only raw events for analytics and recommendations. Never read on the hot path.', fields: [['video_id, user_or_session', 'string', ''], ['ts', 'timestamp', ''], ['watch_sec', 'int', 'Used to decide whether it counts as a view.']] }
      ],
      storage: [
        { title: 'Metadata: SQL or a sharded key-value store', verdict: 'Either works',
          body: 'About 100,000 new videos a day is 1 to 2 writes a second. That is trivial for a single relational primary with replicas for years, and joins (video to channel to renditions) are convenient. Shard by `video_id` only once the table reaches many billions of rows or one node cannot hold the working set.\n\nA wide-column or key-value store makes sense when you want multi-region writes and know every access pattern up front (by video, by owner). The cost is losing ad-hoc queries.' },
        { title: 'Video bytes: object storage', verdict: 'Required',
          body: 'Originals and segments are immutable blobs of megabytes each. Use an **object store** (S3-like). It gives cheap capacity, erasure-coded durability and ranged reads, and the CDN can use it directly as an origin.\n\nLay keys out as `video_id/profile/segment_00042.m4s` so one video\'s data is a prefix. Add lifecycle rules: move old, rarely watched videos to colder tiers, and optionally delete the largest renditions of cold videos and re-create them on demand.' },
        { title: 'Search: inverted index', verdict: 'Separate store',
          body: 'Use a search engine (Elasticsearch/OpenSearch style) fed by a change stream from the metadata store. It is eventually consistent, so a new video appears in search seconds after publish, not instantly. Never use it as the system of record.' },
        { title: 'Counters: sharded counters plus a log', verdict: 'Never a row-per-view update',
          body: 'Updating `UPDATE video SET views = views + 1` on every play makes the hottest video a hot row. Instead write view events to a log, aggregate in workers, and add the batch to a counter store. See the deep dive on view counting.' }
      ],
      decisions: [
        { title: 'Streaming protocol: HLS or DASH, and segment length', question: 'Players need video split into short **segments** fetched over plain HTTP, plus a manifest listing the qualities and segment URLs.',
          options: [
            { name: 'HLS (HTTP Live Streaming)', pros: 'Native on Apple devices and supported almost everywhere through players. Plain files on a CDN.', cons: 'Traditionally needed TS or fragmented MP4 packaging; some features differ from DASH.' },
            { name: 'MPEG-DASH', pros: 'An open standard with flexible manifests, common on Android, TVs and browsers.', cons: 'Not natively supported on Apple platforms; needs a player library there.' },
            { name: 'CMAF fragmented MP4 shared by both', pros: 'One set of media segments with two small manifests. Halves storage and cache footprint.', cons: 'Encryption and packaging details need care across DRM systems.' }
          ],
          pick: 'Package once as **CMAF segments of about 4 to 6 seconds** and publish both an HLS and a DASH manifest over them. Shorter segments adapt faster and start sooner but add requests and lower encoding efficiency (each segment starts on a keyframe); longer ones are cheaper but react slowly to a bandwidth drop.' },
        { title: 'How many renditions and which codecs', question: 'Every extra rendition costs compute, storage and cache space, but gives viewers a better fit.',
          options: [
            { name: 'One fixed ladder for every video', pros: 'Simple and predictable.', cons: 'Wastes bits on easy content (a talking head) and starves hard content (sports).' },
            { name: 'Per-title or per-scene ladders', pros: 'Better quality per byte; a common approach for a catalogue that is watched many times.', cons: 'More analysis and compute up front, only worth it for popular content.' },
            { name: 'Multiple codecs (H.264, VP9, AV1)', pros: 'Newer codecs cut bitrate by a large fraction at the same quality, which saves egress.', cons: 'Much slower to encode, and not every device decodes them. Keep H.264 as the universal baseline.' }
          ],
          pick: 'Start with a fixed H.264 ladder (240p to 1080p) so every video plays quickly. Re-encode **only videos that prove popular** with a newer codec, since the extra compute pays for itself only when it saves egress on many views.' }
      ]
    },
    design: {
      intro: 'Split the system along the data: a small **control plane** (API, metadata, search, counters) and a huge **data plane** (upload, processing, storage, CDN). The two planes meet at the video record and its manifest. **Click any box** for the reasoning, or play a scenario.',
      diagram: {
        title: 'Video streaming high-level design',
        nodes: [
          { id: 'client', label: 'Viewer or creator app', kind: 'client',
            detail: { why: 'Uploads parts directly to object storage with signed URLs, and plays video with an adaptive-bitrate player that measures throughput and switches renditions between segments.', tradeoffs: ['Smart clients keep servers simple: the player, not the server, picks the quality.', 'Behaviour differs per device, so the manifest and codec set must suit the weakest common player.'], scale: 'Millions of concurrent players each fetching a segment every few seconds is the load that everything else exists to absorb.' } },
          { id: 'api', label: 'API and video service', kind: 'service',
            detail: { why: 'Stateless servers for create-upload, metadata, search and view events. They issue signed URLs and manifests but never touch video bytes.', tradeoffs: ['Keeping bytes off these servers makes them small: about 2,300 plays a second needs tens of servers.', 'Signed URLs push auth to the edge but need short expiry and key rotation.'], alternatives: ['Separate services for upload, catalogue and playback', 'Serverless functions (fine for control calls)'], scale: 'The metadata database and the signing path, long before CPU.' } },
          { id: 'uploads', label: 'Upload bucket (originals)', kind: 'storage',
            detail: { why: 'Receives multipart uploads straight from clients and holds the untouched original. Keeping the original means you can re-encode in newer codecs years later.', tradeoffs: ['Direct-to-storage uploads scale for free but you must validate the file after upload, not before.', 'Originals are the most expensive thing to lose; store them with the highest durability tier.'], alternatives: ['Proxy uploads through your servers (simple, but bandwidth-bound and costly)'], scale: 'Abandoned half-finished uploads pile up: add a lifecycle rule that aborts incomplete uploads after a day.' } },
          { id: 'queue', label: 'Transcode job queue', kind: 'queue',
            detail: { why: 'Decouples upload from processing. A completed upload becomes one message; workers pull jobs at their own pace, so a spike in uploads builds a queue instead of an outage.', tradeoffs: ['At-least-once delivery means a job can run twice, so outputs must be written under deterministic keys and be idempotent.', 'Priorities help: a fast low-quality rendition first, higher rungs and new codecs later.'], alternatives: ['Kafka plus a job tracker', 'A workflow engine (DAG of probe, split, encode, package)'], scale: 'Queue depth and worker start-up time at a creator-upload peak.' } },
          { id: 'workers', label: 'Transcoding workers', kind: 'service',
            detail: { why: 'Pull a job, probe the file, split it into chunks, encode every rendition, package segments and manifests, generate thumbnails, and write results to storage. Splitting a video into chunks lets many machines encode one video in parallel.', tradeoffs: ['Chunk-parallel encoding cuts latency from hours to minutes at some quality cost at chunk seams, avoided by cutting on keyframes.', 'Spot or preemptible machines are cheap; jobs must tolerate being killed and retried.', 'Heavy codecs (AV1) cost several times the compute of H.264.'], alternatives: ['Hardware encoders (GPU or ASIC) for speed and cost', 'Managed cloud transcoding service'], scale: 'Compute cost and tail latency of the longest video in a batch. A 4-hour upload can occupy the pipeline unless it is chunked.' } },
          { id: 'vstore', label: 'Segment store (object storage)', kind: 'storage',
            detail: { why: 'Holds every rendition\'s segments and manifests as immutable objects. Immutable files cache perfectly: a segment URL never changes content.', tradeoffs: ['Erasure coding gives durability at about 1.5x raw size instead of 3x.', 'Cold-tier transitions save money but add retrieval latency for the odd old video.'], alternatives: ['Your own distributed file system (only at very large scale)'], scale: 'Total size (tens of PB), and per-prefix request limits if all segments land in one key range, so spread keys.' } },
          { id: 'shield', label: 'Origin shield cache', kind: 'cache',
            detail: { why: 'A mid-tier cache between the edge and storage. Many edge locations that miss on the same segment make one request to the shield instead of one each, protecting the origin.', tradeoffs: ['An extra hop adds a little latency on edge misses but greatly improves hit ratio and cuts origin egress.', 'One more tier to size and monitor.'], alternatives: ['Regional cache tiers', 'Direct edge-to-origin (fine for small catalogues)'], scale: 'A freshly published hit video: every edge misses at once, so the shield must collapse duplicate requests.' } },
          { id: 'cdn', label: 'CDN edge', kind: 'cdn',
            detail: { why: 'Serves segments from servers near the viewer. Popular segments are cached in memory or SSD at the edge, so most of the 2 Tbit/s never reaches the origin.', tradeoffs: ['Own edge caches inside ISPs give the best cost and latency but need scale and partnerships; rented CDNs are simpler and priced per byte.', 'Multiple CDN vendors give resilience and price leverage but complicate routing and cache warm-up.', 'Long cache lifetimes for immutable segments, short for manifests that can change.'], alternatives: ['Single CDN vendor', 'Multi-CDN with steering', 'Peer-assisted delivery (niche)'], scale: 'Cache hit ratio. At 95% the origin sees a twentieth of the traffic; at 80% it sees four times as much.' } },
          { id: 'meta', label: 'Metadata database', kind: 'db',
            detail: { why: 'The record of each video, its state and renditions. Read by the watch page and written by the pipeline when a rendition becomes ready.', tradeoffs: ['SQL with replicas is enough for years at 1 to 2 writes a second; shard by `video_id` later.', 'The state machine (UPLOADING to READY) is easy to model with transactions.'], alternatives: ['DynamoDB or Cassandra for multi-region', 'Document store'], scale: 'Read load on hot video pages: put a cache in front and replicas behind.' } },
          { id: 'search', label: 'Search index', kind: 'search',
            detail: { why: 'Inverted index over titles, descriptions, tags and channels, with popularity as a ranking signal. Fed asynchronously from the metadata store.', tradeoffs: ['Eventual consistency: a new video appears in search seconds later.', 'Ranking mixes text relevance with watch time and recency; keep the first version simple.'], alternatives: ['Database full-text search (small catalogues only)', 'Managed search service'], scale: 'Index size and indexing lag during upload peaks.' } },
          { id: 'viewq', label: 'View event stream', kind: 'queue',
            detail: { why: 'The player sends a view beacon; the API appends it to a log and returns immediately. Aggregation happens later, off the playback path.', tradeoffs: ['A partitioned log absorbs bursts and can be replayed to rebuild counts.', 'Partition by video ID so one aggregator sees all events for a video, but salt hot videos.'], alternatives: ['Kafka', 'Kinesis or Pub/Sub'], scale: 'A viral video makes one partition hot.' } },
          { id: 'counter', label: 'Counter store', kind: 'cache',
            detail: { why: 'Holds the displayed view counts. Aggregators add batched increments (for example +4,812 for video X this minute) instead of one write per view.', tradeoffs: ['Batching cuts writes by orders of magnitude and makes the count lag by seconds.', 'Sharded counters (several keys per hot video, summed on read) avoid a hot key.', 'Periodically reconciled from the log so drift does not accumulate.'], alternatives: ['Redis counters', 'Cassandra counter columns', 'Approximate sketches for uniques'], scale: 'Hot-key writes on a single viral video.' } }
        ],
        edges: [
          { from: 'client', to: 'api', label: 'metadata' },
          { from: 'client', to: 'uploads', label: 'parts' },
          { from: 'client', to: 'cdn', label: 'segments' },
          { from: 'uploads', to: 'queue', label: 'on complete', style: 'async' },
          { from: 'queue', to: 'workers', style: 'async' },
          { from: 'workers', to: 'vstore', label: 'write' },
          { from: 'workers', to: 'meta', label: 'mark ready' },
          { from: 'cdn', to: 'shield', label: 'on miss' },
          { from: 'shield', to: 'vstore', label: 'on miss' },
          { from: 'api', to: 'meta' },
          { from: 'api', to: 'search', label: 'query' },
          { from: 'meta', to: 'search', label: 'index', style: 'async' },
          { from: 'api', to: 'viewq', label: 'view', style: 'async' },
          { from: 'viewq', to: 'counter', label: 'batch add', style: 'async' }
        ],
        scenarios: [
          { id: 'upload', label: 'Upload and process', steps: [
            { title: 'Start upload', path: ['client', 'api'], note: 'The client asks to upload; the API creates the video record in UPLOADING and returns signed part URLs.' },
            { title: 'Send parts', path: ['client', 'uploads'], note: 'The client PUTs 8 MB parts directly to the bucket in parallel. A dropped part is retried alone; the upload resumes where it stopped.' },
            { title: 'Enqueue', path: ['uploads', 'queue'], note: 'Completion produces one transcode message. Duplicate messages are harmless because outputs use deterministic keys.' },
            { title: 'Encode', path: ['queue', 'workers'], tone: 'hard', note: 'A worker probes the file, splits it into keyframe-aligned chunks and encodes the ladder, possibly in parallel across machines. This is the expensive step.' },
            { title: 'Store segments', path: ['workers', 'vstore'], note: 'Segments and manifests are written as immutable objects, lowest rungs first so a quick version can publish early.' },
            { title: 'Publish', path: ['workers', 'meta'], tone: 'ok', note: 'The worker marks renditions READY. Once the first rungs are ready the video becomes playable; the change stream then updates search.' }
          ] },
          { id: 'watch', label: 'Watch a video', steps: [
            { title: 'Load the page', path: ['client', 'api', 'meta'], note: 'The client fetches metadata and the manifest URL. The manifest lists renditions and segment URLs.' },
            { title: 'Fetch a segment', path: ['client', 'cdn'], note: 'The player requests the first segment at a conservative rung, then measures download speed and switches up or down each segment.' },
            { title: 'Edge miss', path: ['cdn', 'shield'], tone: 'hard', note: 'On a miss the edge asks the origin shield. The shield collapses duplicate requests from many edge locations into one.' },
            { title: 'Origin fetch', path: ['shield', 'vstore'], note: 'Only if the shield misses does a request reach object storage. The segment is then cached at every tier on the way back.' },
            { title: 'Steady state', path: ['client', 'cdn'], tone: 'ok', note: 'Later viewers hit the edge directly. Playback never touches the API again except for view beacons.' }
          ] },
          { id: 'views', label: 'Count a view', steps: [
            { title: 'Beacon', path: ['client', 'api'], note: 'After about 30 seconds of watch time the player posts a view event with a session ID.' },
            { title: 'Append', path: ['api', 'viewq'], note: 'The API appends to the log and returns 204 immediately. Playback does not wait for it.' },
            { title: 'Aggregate and add', path: ['viewq', 'counter'], tone: 'ok', note: 'An aggregator sums events per video per interval, drops duplicate sessions, and adds the total to the counter store.' }
          ] }
        ]
      },
      walkthrough: [
        '**Upload**: signed multipart upload straight to object storage, one queue message per finished upload, chunk-parallel transcoding into a ladder, segments written to the segment store, video marked READY.',
        '**Play**: fetch metadata and manifest, then the player pulls 4 to 6 second segments from the CDN, picking a rung per segment from measured throughput. Edge, then shield, then origin.',
        '**Search**: metadata changes stream into a separate inverted index; search is eventually consistent.',
        '**Views**: beacons go to a log, aggregators batch-add to a counter store. Counts lag by seconds and can be rebuilt from the log.',
        '**Failure modes**: a CDN edge outage reroutes viewers to another edge; a transcoder crash retries the job; a queue backlog delays publishing but never breaks playback of existing videos.'
      ],
      notes: ['Keep the control plane boring and small; spend your design time on the data plane (pipeline, storage tiers, CDN hit ratio).']
    },
    deepDives: [
      { id: 'transcoding', title: 'The transcoding pipeline',
        question: 'A creator uploads a 2 GB, 40-minute video. How do you turn it into something every device can play, quickly and reliably?',
        answer: 'Treat it as a **DAG of idempotent tasks** driven by a queue.\n\n1. **Probe and validate**: read codec, resolution, duration; reject corrupt or unsupported files; run safety and copyright hooks.\n2. **Split** into chunks (a few seconds to a minute) on keyframe boundaries.\n3. **Encode in parallel**: each chunk is encoded into every rung of the ladder by independent tasks. Parallelism turns hours into minutes.\n4. **Package**: assemble segments, write HLS and DASH manifests, extract thumbnails and audio tracks.\n5. **Publish**: mark renditions READY in the metadata store.\n\nPublish the **lowest rungs first** so the video is playable early, and let higher rungs and extra codecs finish later. Every task writes to a deterministic key, so a retry overwrites with the same bytes. Use spot machines, with checkpointing at chunk level so a preempted worker loses a chunk, not the whole video.',
        followups: [
          { q: 'What if a worker dies halfway through a chunk?', a: 'The queue message is not acknowledged, so after a visibility timeout it is redelivered. The retry rewrites the same output key. A job tracker marks the video FAILED after N attempts and alerts, keeping the original so it can be reprocessed.' },
          { q: 'How do you handle a 10-hour upload or a poisonous file?', a: 'Chunking bounds work per task, so one huge file does not block a worker. Cap duration or size per account tier, and send files that repeatedly crash the encoder to a dead-letter queue for inspection.' },
          { q: 'How would you cut transcoding cost?', a: 'Encode cheap codecs first and expensive ones only for videos that become popular, skip rungs above the source resolution, use hardware encoders, and run on spot capacity. Measure cost per video-minute and watch the share of videos that never get viewed.' }
        ] },
      { id: 'abr', title: 'Adaptive bitrate streaming',
        question: 'How does the player choose a quality, and why is video split into segments?',
        answer: 'Each video is encoded at several bitrates and cut into **segments of a few seconds**. The manifest lists every rung and segment URL. The player downloads one segment at a time, measures how fast it arrived, keeps a **buffer** of a few segments ahead of the playhead, and picks the rung for the next segment.\n\nA common rule: choose the highest rung whose bitrate is below a safety fraction (say 70 to 80%) of measured throughput, and drop quickly when the buffer is low but climb slowly when it is healthy. That asymmetry prevents oscillation and rebuffering. Segments being plain files means **any HTTP cache or CDN** can serve them: no special streaming servers, and seeking is just fetching a later segment.\n\nKeyframe alignment matters: every rung must start segments at the same timestamps so the player can switch rungs at a segment boundary without a glitch.',
        followups: [
          { q: 'Why not one long file with HTTP range requests?', a: 'It works for simple playback, but it has a single quality and no rendition switching. Segmenting enables adaptive quality and finer caching: a popular middle section can be cached on its own.' },
          { q: 'Trade-off of shorter segments?', a: 'Faster adaptation and start, but more requests, larger manifests and slightly worse compression (each segment needs a keyframe). Roughly 2 to 6 seconds is typical; low-latency live uses much shorter parts.' },
          { q: 'How do you make start-up fast?', a: 'Begin at a modest rung, use small first segments, prefetch the manifest early, keep connections warm to the CDN, and ramp quality up once the buffer is filling.' }
        ] },
      { id: 'cdn', title: 'CDN, cache tiers and the origin',
        question: 'Egress is about 2 Tbit/s on average. How do you serve it, and what protects the origin?',
        answer: 'Serve segments from a **tiered cache**: edge servers near viewers, then a regional or **origin shield** tier, then object storage. Segments are immutable, so they can be cached for a long time under versioned URLs; manifests are short-lived because they can change.\n\nA 95% edge hit ratio means the origin sees about 5% of traffic, and the shield cuts that further by collapsing simultaneous misses into one request. Warm caches ahead of a known launch by pre-pushing the first segments of a big release to edges.\n\nPopularity is heavily skewed: a few videos account for most views. Cache them in memory at the edge; the long tail lives on SSD or is fetched from the origin on demand. Choose between a rented CDN (simple, pay per byte) and your own edge servers inside ISPs (cheaper per byte at huge scale, but a large operational investment).',
        followups: [
          { q: 'How do you protect private or paid videos on a CDN?', a: 'Signed URLs or cookies with a short expiry and a path scope, plus DRM licences for premium content. The edge validates the signature without calling your API. Accept that a leaked URL works until it expires.' },
          { q: 'A new video goes viral minutes after publishing. What happens?', a: 'Every edge misses at once. The shield collapses duplicates so storage sees one request per segment, then caches fill within seconds. Pre-warm segments for scheduled releases and keep per-prefix request limits in mind.' },
          { q: 'How do you choose which videos stay hot?', a: 'LRU or frequency-based eviction at each tier, with larger and slower tiers further back. Do not cache every rendition equally: the middle rungs are watched most.' }
        ] },
      { id: 'views', title: 'Counting views at scale',
        question: 'A video can get 100,000 views a second. How do you maintain a view count without a hot row?',
        answer: 'Do not increment a database row per view. Write each view to a **partitioned log**; workers aggregate per video over an interval (say 10 seconds) and apply one batched increment to the counter store. The displayed number lags a little, which is acceptable.\n\nFor a very hot video use **sharded counters**: N keys for the video, increments go to a random shard, reads sum them (or a rollup job does). Count only valid views: a minimum watch time, dedupe by session, and filter bots, which keeps the number meaningful and cuts load.\n\nThe log is the source of truth, so counts can be recomputed after a bug. Exact, audited counts for payments belong in a separate pipeline with stronger delivery guarantees.',
        followups: [
          { q: 'Why not Redis INCR on every view?', a: 'It works until one key gets 100,000 writes a second, which saturates one shard. Batching and sharded keys fix it, and the log gives durability that an in-memory counter alone does not.' },
          { q: 'How do you avoid double counting on retries?', a: 'Give each beacon an event or session ID and dedupe in the aggregator, or accept approximate counts. At-least-once delivery with dedupe is cheaper than exactly-once.' },
          { q: 'How do you display the count so it looks live?', a: 'Serve the last rolled-up number from cache and let the client animate small increments. Do not recompute from raw events on read.' }
        ] },
      { id: 'upload', title: 'Reliable large uploads',
        question: 'Users upload multi-gigabyte files over unreliable mobile networks. How do you make it work?',
        answer: 'Use **multipart, resumable uploads straight to object storage**. The API creates an upload session and returns signed URLs for fixed-size parts (say 8 MB). The client uploads parts in parallel, retries any failed part alone, and finally calls complete with the part list. Storage assembles the object.\n\nThe client records which parts succeeded so it can resume after an app restart. The server verifies size and checksums per part, and after completion validates the file by probing it, since a client can upload anything. Abandoned sessions are cleaned up by a lifecycle rule.\n\nBecause the bytes bypass your API servers, upload capacity scales with storage, and your servers only handle small control requests.',
        followups: [
          { q: 'How do you stop abuse of upload URLs?', a: 'Short-lived signatures, scoped to one key and size, per-account quotas and rate limits, and post-upload scanning before any video is published.' },
          { q: 'How do you detect a duplicate upload?', a: 'A content hash computed by the client and verified by the server can dedupe identical files. Perceptual fingerprints detect re-uploads of near-identical videos, as a separate content-matching system.' }
        ] },
      { id: 'storage', title: 'Storage tiers and cost control',
        question: 'Storage grows by about 29 PB a year. How do you keep the bill under control?',
        answer: 'Most videos are watched rarely after the first weeks, so move them down **storage tiers** by age and access: hot (SSD or standard), warm, cold archive. Use **erasure coding** for renditions (about 1.5x raw) and keep originals at stronger durability, because a rendition can be re-made but the original cannot.\n\nFor cold videos, delete the heaviest rungs and keep only a small set; re-transcode from the original if a video heats up. Deduplicate exact duplicates. Track cost per video and watch what share of bytes belongs to videos with no recent views.\n\nThe trade-off is a slow first play for a cold video versus cheaper bytes. Show a spinner honestly or warm the object when a view arrives.',
        followups: [
          { q: 'How do you decide what is cold?', a: 'Recency of last view and total views, from the view log. Use a rolling policy (for example no views in 90 days) and review the rehydration rate: if too many cold videos return, the policy is too aggressive.' },
          { q: 'Where do recommendations fit, as a stretch?', a: 'A separate offline pipeline reads the view log, builds candidate videos per user (by collaborative signals and recency) and a ranking model scores them. Results are precomputed per user into a cache that the home page reads. It is eventually consistent and never on the playback path.' }
        ] }
    ],

    bottlenecks: [
      { title: 'CDN egress cost and hit ratio', problem: 'About 2 Tbit/s average is the single largest cost. A hit ratio that slips from 95% to 85% triples origin traffic and the bill.', mitigation: 'Immutable, long-cached segments; an origin shield to collapse misses; newer codecs for popular videos to lower bytes per play; own edge caches or multi-CDN pricing at large scale; alert on hit ratio per region.' },
      { title: 'Transcoding capacity at upload peaks', problem: 'Uploads spike (events, evenings) and the queue grows, delaying publishing. Encoding is CPU heavy and long videos create stragglers.', mitigation: 'Autoscale workers on queue depth, use spot capacity, chunk-parallel encoding, priority lanes (low rungs first, new codecs later), per-account limits, and accept a delay rather than dropping work.' },
      { title: 'Hot videos and cold starts', problem: 'A new hit makes every edge miss together, and counters and metadata for that video become hot keys.', mitigation: 'Request collapsing at shield and edge, pre-warming for scheduled releases, cached metadata with short TTL, sharded counters.' },
      { title: 'Storage growth', problem: 'About 29 PB a year, plus extra codecs, grows without bound.', mitigation: 'Erasure coding, lifecycle tiering, dropping heavy rungs of cold videos, quotas, and re-encoding with efficient codecs only where views justify it.' },
      { title: 'Search and metadata freshness', problem: 'Search is eventually consistent and a video can be playable but not yet searchable, or deleted but still listed.', mitigation: 'Index from a change stream with retries, treat the metadata store as the truth at read time (filter removed videos when rendering results), and show a processing state on the creator\'s own page.' }
    ],

    mistakes: [
      'Proxying uploads and downloads through the API servers instead of signed direct-to-storage uploads and a CDN.',
      'Serving video from the origin with a single quality, skipping adaptive bitrate and segmenting.',
      'Transcoding synchronously in the upload request, or on the same servers that handle API traffic.',
      'Forgetting that **egress**, not QPS, dominates cost, and never mentioning CDN hit ratio.',
      'Updating a `views` column per view (a hot row), instead of batching through a log.',
      'Making the whole pipeline non-idempotent so a retry duplicates or corrupts output.',
      'Deleting or overwriting the original after transcoding, which blocks future re-encodes.',
      'Ignoring failures: no dead-letter queue, no FAILED state, no way to reprocess.',
      'Using the search index as the source of truth.',
      'Giving exact numbers with false confidence instead of stating assumptions.'
    ],

    pushes: [
      { q: 'Why not just stream one big MP4 over HTTP?', why: 'They want to see whether you understand adaptive streaming and CDN caching.', good: 'One file has one quality and cannot adapt to bandwidth changes; segments plus a manifest allow rung switching per segment and cache fine-grained, popular pieces on any HTTP CDN.' },
      { q: 'How would you reduce the CDN bill by 30%?', why: 'Cost is the real-world constraint on this problem.', good: 'Raise hit ratio (shield, tuned eviction), newer codecs for popular titles, cap the top rung by device, negotiate or add own edge caches, and shrink bytes per play with better ladders. Quantify with the 100 MB per play figure.' },
      { q: 'What happens when the transcoder is down for an hour?', why: 'Failure handling of the asynchronous pipeline.', good: 'Uploads still succeed and queue up; videos stay in PROCESSING; existing playback is unaffected; the backlog drains on recovery with autoscaling; alert on queue age, not just depth.' },
      { q: 'How do you count views reliably and prevent bots?', why: 'Counters and abuse are classic follow-ups.', good: 'Valid-view threshold, session dedupe, rate limits and bot signals, log-based aggregation with batched increments, sharded counters for hot videos, and a note on exact versus approximate.' },
      { q: 'How would you add live streaming?', why: 'Tests whether you see what changes.', good: 'Ingest over RTMP or WebRTC, real-time packaging into short segments, a shorter manifest window, tighter CDN TTLs, and a separate pipeline because latency, not throughput, is the constraint.' },
      { q: 'How would the design change for a global audience?', why: 'Multi-region and locality.', good: 'Per-region CDN and shield tiers, replicate popular segments to regional origins, geo-aware routing, regional metadata replicas with a home region for writes, and regional content restrictions.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Which resource dominates the cost and design of a video platform?', choices: ['Egress bandwidth, served mostly from a CDN', 'Database write QPS', 'App server CPU', 'Search index size'], answer: 0, explain: 'About 2,300 plays a second is a small request rate, but at roughly 100 MB each that is around 2 Tbit/s. Bytes moved, not requests, drive the architecture and cost.' },
      { kind: 'concept', q: 'Why are videos cut into short segments with a manifest?', choices: ['So players can switch quality per segment and any HTTP CDN can cache the pieces', 'To make files smaller without re-encoding', 'To avoid needing a CDN', 'Because databases cannot store large files'], answer: 0, explain: 'Segments plus a manifest enable adaptive bitrate and fine-grained caching with plain HTTP.' },
      { kind: 'concept', q: 'How should clients upload a multi-gigabyte video?', choices: ['In parts straight to object storage with signed URLs, retrying failed parts', 'As one request through the API servers', 'By email-style attachments to a queue', 'Over a long-lived WebSocket to the database'], answer: 0, explain: 'Direct multipart upload scales with storage, resumes after failure, and keeps big bytes off your servers.' },
      { kind: 'concept', q: 'Transcode jobs can be delivered twice by an at-least-once queue. What makes that safe?', choices: ['Idempotent tasks that write outputs under deterministic keys', 'Exactly-once delivery from the queue', 'Running only one worker', 'Deleting the original after the first run'], answer: 0, explain: 'A retry then overwrites the same object with identical bytes. Exactly-once delivery is expensive and not required.' },
      { kind: 'concept', q: 'A video gets 100,000 views a second. Which design avoids a hot row?', choices: ['Append views to a log, aggregate, and add batched or sharded counter increments', 'UPDATE the views column on every view', 'Count views in the CDN only', 'Store every view as a row and COUNT(*) on read'], answer: 0, explain: 'Batching reduces writes by orders of magnitude and sharded counters spread a hot key. The count lags slightly, which is acceptable.' },
      { kind: 'concept', q: 'Pick every benefit of an origin shield tier.', choices: ['Collapses simultaneous edge misses into one origin request', 'Raises the overall cache hit ratio', 'Removes the need for object storage', 'Lowers origin egress'], answer: [0, 1, 3], explain: 'The shield is a cache, not storage: the durable copies still live in object storage.' },
      { kind: 'concept', q: 'Why keep the original upload after transcoding?', choices: ['So you can re-encode with newer codecs or fix a bad rendition later', 'Players stream from the original', 'It is required for adaptive bitrate', 'It makes search faster'], answer: 0, explain: 'Renditions can be regenerated; the original cannot. It is the most valuable object to protect.' }
    ],

    flashcards: [
      { id: 'vs-egress', front: 'Video platform: what dominates cost and why?', back: 'Egress. Around 2,300 plays/s x ~100 MB is about 2 Tbit/s average (approximate). A CDN serves most of it; hit ratio and bytes per play are the levers.' },
      { id: 'vs-abr', front: 'How does adaptive bitrate streaming work?', back: 'Video is encoded at several bitrates and cut into 2 to 6 second segments with a manifest. The player measures throughput and picks a rung per segment, keeping a buffer.' },
      { id: 'vs-hls-dash', front: 'HLS vs DASH?', back: 'Both are segment-and-manifest HTTP streaming. HLS is native on Apple devices; DASH is an open standard common elsewhere. Packaging CMAF segments once lets you publish both manifests.' },
      { id: 'vs-pipeline', front: 'Steps of the transcoding pipeline?', back: 'Probe and validate, split on keyframes, encode chunks in parallel into the ladder, package segments and manifests, publish READY. Idempotent tasks, queue-driven, lowest rungs first.' },
      { id: 'vs-views', front: 'How to count views at 100K/s?', back: 'Append events to a partitioned log, aggregate per video per interval, batch-add to a counter store, shard hot counters. Valid view = minimum watch time and session dedupe.' },
      { id: 'vs-upload', front: 'How do uploads avoid the API servers?', back: 'Signed multipart URLs to object storage; parts uploaded in parallel and retried alone; complete call assembles and enqueues the transcode job.' },
      { id: 'vs-shield', front: 'What does an origin shield do?', back: 'A mid-tier cache that collapses many edge misses for the same object into one origin request, raising hit ratio and cutting origin egress.' }
    ]
  });
})();
