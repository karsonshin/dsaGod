/* Offer Ready: CS fundamentals, track. Prose only; the socket sample was run. */
OR.cs = OR.cs || [];
OR.cs.push({
  id: "networking",
  order: 3,
  title: "Networking",
  blurb: "OSI and TCP/IP, TCP versus UDP, handshakes, congestion, HTTP versions, TLS, DNS, API styles, real-time channels, and the URL question.",
  minutes: 50,
  sections: [
    {
      id: "models",
      title: "OSI versus TCP/IP",
      body: `
Two ways to slice the same stack. **OSI** has seven layers and is a teaching model; **TCP/IP** has four and describes what is actually deployed.

| OSI layer | TCP/IP layer | Examples | Unit |
|---|---|---|---|
| 7 Application | Application | HTTP, DNS, SMTP, TLS handshake (arguably) | Message |
| 6 Presentation | Application | Encoding, compression, encryption (conceptually) | Message |
| 5 Session | Application | Session management (conceptually) | Message |
| 4 Transport | Transport | TCP, UDP, QUIC | Segment / datagram |
| 3 Network | Internet | IP, ICMP, routing | Packet |
| 2 Data link | Link | Ethernet, Wi-Fi, ARP | Frame |
| 1 Physical | Link | Cables, radio, signals | Bits |

Each layer **encapsulates** the one above: an HTTP message goes into a TCP segment, into an IP packet, into an Ethernet frame. The layers to know cold: **IP** delivers packets host to host on a best-effort basis (no guarantees); **TCP/UDP** deliver between *processes* using port numbers; **MAC addresses** matter only on the local link; a **router** works at the network layer, a **switch** at the link layer, a **load balancer** at layer 4 (by IP and port) or layer 7 (by HTTP content).

OSI numbering is still the common vocabulary ("L4 load balancer", "L7 firewall"), even though real protocols (TLS, QUIC) do not map neatly onto it.
`
    },
    {
      id: "tcp-udp",
      title: "TCP versus UDP",
      body: `
| | TCP | UDP |
|---|---|---|
| Connection | Connection-oriented (handshake first) | Connectionless |
| Reliability | Acknowledgements, retransmission, checksums | None: best effort |
| Ordering | In order | None |
| Boundaries | A byte stream: no message boundaries | Datagrams keep their boundaries |
| Flow and congestion control | Yes | No (the application must be polite) |
| Overhead | 20-byte header minimum, state per connection | 8-byte header, no state |
| Typical uses | Web, email, file transfer, databases | DNS, video calls, games, QUIC/HTTP/3, telemetry |

Choose TCP when correctness matters more than the last few milliseconds. Choose UDP when stale data is worthless (a late voice packet is useless), when you want your own reliability model, or when handshake latency hurts. QUIC builds reliable, multiplexed, encrypted streams *on top of UDP*.

A TCP trap: \`recv()\` can return half of one message or two messages glued together, so applications need **framing** (a length prefix, a delimiter, or a protocol such as HTTP). The sample shows a local echo over each protocol.
`,
      code: [
        {
          title: "TCP and UDP on localhost",
          code: {
            py: `import socket, threading

def tcp_echo_server(srv):
    conn, _ = srv.accept()                       # completes the 3-way handshake
    with conn:
        while data := conn.recv(1024):           # TCP is a byte stream: recv() may split or merge messages
            conn.sendall(data)

tcp = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp.bind(("127.0.0.1", 0)); tcp.listen()         # port 0: let the OS pick a free port
threading.Thread(target=tcp_echo_server, args=(tcp,), daemon=True).start()

c = socket.create_connection(tcp.getsockname())  # SYN, SYN-ACK, ACK happen here
c.sendall(b"hello over tcp")
print(c.recv(1024))                              # b'hello over tcp': reliable, ordered
c.close()

udp_srv = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_srv.bind(("127.0.0.1", 0))
udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp.sendto(b"hello over udp", udp_srv.getsockname())  # no connection, no delivery guarantee
msg, addr = udp_srv.recvfrom(1024)               # one datagram in, one datagram out; boundaries kept
print(msg)`
          }
        }
      ]
    },
    {
      id: "handshake",
      title: "TCP handshake and teardown",
      body: `
**Three-way handshake** (open):

1. Client sends **SYN** with its initial sequence number \`x\`.
2. Server replies **SYN-ACK** with its own \`y\` and acknowledgement \`x + 1\`.
3. Client sends **ACK** with \`y + 1\`. Data can flow (the client may send data with this third segment).

It synchronizes sequence numbers in both directions and confirms both sides can send and receive. The cost is one **round trip** before the first data byte, and a server holds state after the SYN, which is why **SYN floods** exist (mitigated with SYN cookies).

**Teardown** is four steps, because each direction is closed separately: the closer sends **FIN**, the peer **ACK**s it (it may keep sending, a **half-close**), then the peer sends its own **FIN** and gets an **ACK**. Sometimes the middle two combine, making it look like three steps.

The side that closes first enters **TIME_WAIT** for about twice the maximum segment lifetime (commonly 60 seconds on Linux). Reasons: make sure the final ACK arrived (so a lost one can be answered), and let stray packets from the old connection die before the same address-and-port pair is reused. Many connections stuck in TIME_WAIT on a busy client or proxy is a known operational issue; connection reuse (keep-alive) is the main fix. A **RST** aborts a connection immediately, for example when a packet arrives for a closed port.

Reliability in a sentence: each byte has a sequence number; the receiver sends cumulative ACKs; the sender retransmits after a timeout, or sooner after three duplicate ACKs (**fast retransmit**).
`
    },
    {
      id: "flow-congestion",
      title: "Flow control and congestion control",
      body: `
Two different problems that both limit how much a TCP sender may have **in flight** (sent but unacknowledged):

- **Flow control** protects the *receiver*. Each ACK carries the receiver's advertised window (\`rwnd\`): how much buffer space it has left. The sender may not exceed it. A zero window pauses the sender.
- **Congestion control** protects the *network*. The sender keeps a **congestion window** (\`cwnd\`), an estimate of how much the path can take. The actual limit is \`min(cwnd, rwnd)\`.

Classic behavior (Reno family):

1. **Slow start**: begin with a small \`cwnd\` (a handful of segments) and roughly **double every round trip** (it grows by one segment per ACK) until it reaches the slow-start threshold \`ssthresh\` or loses a packet.
2. **Congestion avoidance**: grow **additively**, about one segment per round trip.
3. **On loss**: halve the window (**multiplicative decrease**). A loss detected by three duplicate ACKs triggers fast retransmit and fast recovery (continue from the halved window). A retransmission **timeout** is treated as severe: \`cwnd\` drops back to one segment and slow start restarts.

This is **AIMD** (additive increase, multiplicative decrease), and it converges to a roughly fair share between competing flows. Modern variants differ: **CUBIC** (the Linux default) grows the window along a cubic curve and works better on fast, long paths; **BBR** estimates bandwidth and round-trip time instead of reacting only to loss. Throughput is bounded by roughly \`window / RTT\`, so high latency needs a large window (the **bandwidth-delay product**).

Do not mix the terms up in an interview: flow control is receiver-driven and explicit in the header; congestion control is inferred by the sender from loss and delay.
`
    },
    {
      id: "http",
      title: "HTTP/1.1 versus 2 versus 3",
      body: `
| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Format | Text | Binary frames | Binary frames |
| Transport | TCP | TCP | **QUIC over UDP** |
| Concurrency | One request at a time per connection (browsers open several connections per host) | Many **multiplexed streams** on one connection | Multiplexed streams, independent loss recovery |
| Headers | Repeated in full, uncompressed | **HPACK** compression | QPACK compression |
| Head-of-line blocking | At the HTTP level | Fixed at HTTP level, but **TCP** still blocks all streams on one lost packet | Removed: a lost packet stalls only its stream |
| Setup | TCP + TLS (separate handshakes) | TCP + TLS | One combined transport and TLS 1.3 handshake, optional 0-RTT |

Extra detail worth knowing:

- HTTP/1.1 added persistent connections (keep-alive), chunked transfer, the \`Host\` header (virtual hosting) and caching headers. **Pipelining** exists on paper but is rarely used because of head-of-line blocking.
- HTTP/2 made old workarounds (domain sharding, sprite sheets, inlining) mostly unnecessary. Server push existed but is rarely used and has been removed from major browsers.
- HTTP/3 is built on **QUIC**, which also adds **connection migration** (a connection ID survives a change from Wi-Fi to mobile data) and mandatory encryption. Clients usually learn that a server supports it from an \`Alt-Svc\` header or DNS, so the first request often still goes over HTTP/2.
- Methods and semantics are the same across versions: \`GET\`, \`POST\`, status codes and so on. Idempotent methods (\`GET\`, \`PUT\`, \`DELETE\`) are safe to retry; \`POST\` generally is not.
`
    },
    {
      id: "tls",
      title: "TLS handshake",
      body: `
**TLS** gives a connection **confidentiality** (encryption), **integrity** (tamper detection) and **authentication** (you are talking to the server you meant to).

TLS 1.3, the current standard, takes **one round trip** before encrypted application data:

1. **ClientHello**: supported TLS versions and cipher suites, a fresh random value, an ephemeral **key share** (for elliptic-curve Diffie-Hellman), the server name (**SNI**) and the application protocols it speaks (**ALPN**, for example \`h2\`).
2. **ServerHello**: the chosen cipher and the server's key share. Both sides can now compute the same shared secret and derive session keys; everything after this is encrypted.
3. The server sends its **certificate chain**, a **CertificateVerify** (a signature proving it holds the certificate's private key) and **Finished**.
4. The client **verifies** the certificate: it chains to a trusted root, is within its validity dates, matches the hostname (subject alternative name), and is not revoked. It sends its own **Finished**; data flows.

Why it is secure: the key is agreed with an *ephemeral* key exchange, so even if the server's long-term key leaks later, recorded traffic stays secret (**forward secrecy**). Symmetric encryption (AES-GCM or ChaCha20-Poly1305) then protects the data because it is much faster than public-key operations.

Other points: TLS 1.2 needed two round trips and allowed weaker options. **Session resumption** skips the full handshake; TLS 1.3 **0-RTT** sends data on the first flight but it can be **replayed**, so only use it for idempotent requests. **mTLS** also authenticates the client with a certificate (common between services). A man in the middle cannot simply substitute their own certificate, because it would not chain to a trusted root for that hostname.
`
    },
    {
      id: "dns",
      title: "DNS",
      body: `
The **Domain Name System** is a distributed, hierarchical, cached database that maps names to records, mainly addresses.

Resolution for \`www.example.com\` when nothing is cached:

1. The application asks the **stub resolver** in the OS, which asks the configured **recursive resolver** (your ISP's, or a public one).
2. The recursive resolver asks a **root server** (which answers with the \`.com\` TLD servers), then a **TLD server** (which answers with the nameservers for \`example.com\`), then the domain's **authoritative nameserver**, which returns the answer.
3. The resolver caches each answer for its **TTL** and returns the result.

Common records: \`A\` (IPv4), \`AAAA\` (IPv6), \`CNAME\` (alias to another name; cannot sit at the zone apex alongside other records), \`MX\` (mail), \`NS\` (delegation), \`TXT\` (verification, SPF), \`SRV\`, \`PTR\` (reverse lookup).

Details: DNS normally uses **UDP port 53**, falling back to **TCP** for large responses and zone transfers; **DoT/DoH** encrypt queries. Caching happens in the browser, the OS and the resolver, which is why a changed record is slow to take effect (lower the TTL *before* a migration). DNS can load-balance (multiple \`A\` records, geo-aware answers), but clients cache, so it is a coarse tool. **Negative caching** stores "does not exist" answers too. DNSSEC signs records to prevent forgery.
`
    },
    {
      id: "apis",
      title: "REST versus gRPC versus GraphQL",
      body: `
| | REST (JSON over HTTP) | gRPC | GraphQL |
|---|---|---|---|
| Model | Resources and HTTP verbs | Remote procedure calls from a typed schema | One endpoint, the client asks for exactly the fields it wants |
| Contract | Informal or OpenAPI | Protocol Buffers (\`.proto\`), code generated | Strongly typed schema |
| Encoding | Usually JSON (text) | Protobuf (binary, compact) | Usually JSON |
| Transport | HTTP/1.1 or 2 | HTTP/2 (streaming in both directions) | Usually HTTP \`POST\` |
| Strengths | Simple, cacheable with HTTP, universal tooling | Fast, small payloads, streaming, strong typing between services | No over- or under-fetching; one round trip for nested data |
| Weak spots | Over-fetching, many round trips, versioning | Harder from browsers (needs gRPC-Web), less human-readable | Caching is harder, the N+1 query problem, query cost and abuse control |

Typical split: **REST** for public and partner APIs, **gRPC** for internal service-to-service calls where latency and contracts matter, **GraphQL** for client-driven UIs that aggregate several backends.

REST details to state precisely: resources are nouns (\`/orders/42\`), verbs come from the HTTP method, responses use status codes (\`201 Created\`, \`404\`, \`409 Conflict\`), \`PUT\` and \`DELETE\` are idempotent, and pagination, filtering and versioning need an explicit convention. Strict "RESTful" (hypermedia) is rare; most APIs are really "HTTP and JSON".
`
    },
    {
      id: "realtime",
      title: "WebSockets, SSE and polling",
      body: `
Plain HTTP is request and response: the client asks first. Options when the server needs to push:

- **Polling**: the client asks every N seconds. Simple, wasteful, delayed.
- **Long polling**: the server holds the request open until it has something, then the client immediately asks again. Works everywhere, but each message costs a full request.
- **Server-Sent Events (SSE)**: one long-lived HTTP response with \`Content-Type: text/event-stream\`, **server to client only**. The browser \`EventSource\` handles reconnection and a \`Last-Event-ID\` for resuming. Works over normal HTTP infrastructure; text only.
- **WebSocket**: starts as an HTTP request with \`Upgrade: websocket\`, the server answers \`101 Switching Protocols\`, and the same TCP connection becomes a **full-duplex**, message-framed channel (text or binary). Best for chat, collaborative editing and games.

Choosing: one-way updates (notifications, dashboards, progress, LLM token streaming) are a natural fit for SSE, which is simpler to deploy. Two-way, low-latency interaction wants WebSockets. Both hold a connection per client, so capacity planning, heartbeats and reconnect with backoff matter. WebSockets do not benefit from HTTP caching or ordinary request logging, and some proxies need explicit configuration. HTTP/2 and HTTP/3 can multiplex SSE streams; browsers also limit SSE connections per host on HTTP/1.1.
`
    },
    {
      id: "url",
      title: "What happens when you type a URL",
      body: `
A common closing question. A strong answer follows the layers in order and notes what is cached:

1. **Parse** the URL: scheme, host, port, path, query. If it is not a URL, the browser searches instead. Check **HSTS** (force HTTPS) and a cached copy that is still fresh (then you may be done here).
2. **DNS**: browser cache, OS cache and hosts file, then the recursive resolver (root, TLD, authoritative if uncached). Result: an IP address (maybe several; the client tries them, often preferring IPv6).
3. **TCP**: three-way handshake to port 443 (HTTP/3 uses QUIC over UDP instead).
4. **TLS**: the handshake above, validating the certificate for the hostname and negotiating \`h2\` or \`http/1.1\` via ALPN.
5. **HTTP request**: \`GET /path HTTP/1.1\` plus \`Host\`, cookies, \`Accept\` and cache headers.
6. **Server side**: often a CDN or load balancer first, then a reverse proxy, the application, caches and databases. It produces a status code, headers and a body.
7. **Response handling**: follow redirects, honor \`Cache-Control\`, decompress, and stream the body to the HTML parser.
8. **Render**: build the DOM and CSSOM, discover subresources (CSS, JS, images, fonts) and fetch them, usually over the same connection with HTTP/2; run JavaScript; compute layout; paint and composite. Scripts without \`async\` or \`defer\` block parsing, and CSS blocks rendering.

Good extras to mention: connection reuse (keep-alive) makes later requests skip steps 2 to 4; a CDN shortens the path with edge caching; the first byte is usually dominated by round trips (DNS, TCP, TLS), which is what **HTTP/3** and TLS 1.3 reduce; and a failure at each step has a distinct symptom (DNS failure, connection refused, certificate error, 5xx).
`
    }
  ],
  quiz: [
    {
      kind: "concept",
      q: "Which layer of the TCP/IP model is responsible for delivering data between *processes* using port numbers?",
      choices: ["Link", "Internet", "Transport", "Application"],
      answer: 2,
      explain: "The transport layer (TCP, UDP, QUIC) multiplexes by port. IP (the Internet layer) only gets packets from host to host."
    },
    {
      kind: "concept",
      q: "Which application is the best fit for UDP rather than TCP?",
      choices: [
        "Bank transfers",
        "A live voice call where a late packet is useless",
        "Downloading a software installer",
        "Sending an email"
      ],
      answer: 1,
      explain: "Late voice data is worthless, so retransmission and in-order delivery would only add delay. The others need every byte, correctly."
    },
    {
      kind: "concept",
      q: "In the TCP three-way handshake, what does the server send in the second step?",
      choices: ["ACK only", "SYN-ACK: its own sequence number and an acknowledgement of the client's", "FIN", "RST"],
      answer: 1,
      explain: "SYN-ACK both synchronizes the server's sequence number and acknowledges the client's SYN (ack = x + 1)."
    },
    {
      kind: "concept",
      q: "Why does the side that closes a TCP connection first enter TIME_WAIT?",
      choices: [
        "To wait for the application to flush logs",
        "So a lost final ACK can be answered and old packets die before the address pair is reused",
        "To renegotiate TLS",
        "To free the port immediately"
      ],
      answer: 1,
      explain: "TIME_WAIT (about 2 * MSL) protects a later connection on the same four-tuple from stray old segments and ensures the peer's FIN was acknowledged."
    },
    {
      kind: "concept",
      q: "A sender's window is `min(cwnd, rwnd)`. Which of these is determined by the **receiver**?",
      choices: ["cwnd", "rwnd", "ssthresh", "The RTT"],
      answer: 1,
      explain: "rwnd is the receiver's advertised window (flow control). cwnd and ssthresh are the sender's congestion state."
    },
    {
      kind: "concept",
      q: "On a retransmission **timeout**, classic TCP Reno sets cwnd to:",
      choices: [
        "Double its value",
        "Half its value, continuing in congestion avoidance",
        "One segment, and restarts slow start",
        "Zero"
      ],
      answer: 2,
      explain: "A timeout signals severe congestion, so TCP restarts slow start from one segment. Three duplicate ACKs trigger the milder halving of fast recovery."
    },
    {
      kind: "concept",
      q: "What does HTTP/3 fix that HTTP/2 over TCP could not?",
      choices: [
        "It adds multiplexing",
        "It removes TCP-level head-of-line blocking, because QUIC streams recover independently",
        "It makes headers plain text",
        "It removes the need for TLS"
      ],
      answer: 1,
      explain: "HTTP/2 multiplexes streams, but one lost TCP packet stalls them all. QUIC (over UDP) handles loss per stream, and always includes encryption."
    },
    {
      kind: "concept",
      q: "Pick **all** that are true about the TLS 1.3 handshake.",
      choices: [
        "It needs one round trip before encrypted application data",
        "The server proves it owns the certificate by signing the handshake",
        "0-RTT data is immune to replay",
        "Ephemeral key exchange provides forward secrecy"
      ],
      answer: [0, 1, 3],
      explain: "0-RTT data can be replayed by an attacker, so only send idempotent requests that way."
    },
    {
      kind: "concept",
      q: "A browser needs live price updates pushed from the server, with no messages from client to server. Which is usually simplest?",
      choices: ["WebSocket", "Server-Sent Events", "Polling every 50 ms", "gRPC over UDP"],
      answer: 1,
      explain: "SSE is one-way server to client, over plain HTTP, with built-in reconnection. WebSockets are more than is needed unless the client also sends frequently."
    }
  ],
  cards: [
    {
      id: "osi-tcpip",
      front: "OSI vs TCP/IP?",
      back: "OSI is a 7-layer teaching model; TCP/IP has 4 layers (link, internet, transport, application) and is what is deployed. OSI layers 5 to 7 collapse into TCP/IP's application layer."
    },
    {
      id: "tcp-udp",
      front: "TCP vs UDP in one line each?",
      back: "TCP: connection-oriented, reliable, ordered byte stream with flow and congestion control. UDP: connectionless datagrams, no guarantees, minimal overhead."
    },
    {
      id: "handshake",
      front: "TCP three-way handshake?",
      back: "SYN (x), SYN-ACK (y, ack x+1), ACK (ack y+1). One round trip before data."
    },
    {
      id: "teardown",
      front: "TCP teardown and TIME_WAIT?",
      back: "FIN, ACK, FIN, ACK (each direction closed separately). The closing side sits in TIME_WAIT (about 2 MSL) so a lost final ACK can be re-sent and old segments expire."
    },
    {
      id: "flow-cc",
      front: "Flow control vs congestion control?",
      back: "Flow control protects the receiver via its advertised window (rwnd). Congestion control protects the network via the sender's cwnd, inferred from loss and delay. Window = min(cwnd, rwnd)."
    },
    {
      id: "aimd",
      front: "What is AIMD?",
      back: "Additive increase (about one segment per RTT), multiplicative decrease (halve on loss). It converges to a fair share between flows. Slow start grows exponentially before ssthresh."
    },
    {
      id: "http-versions",
      front: "HTTP/1.1 vs 2 vs 3?",
      back: "1.1: text, one request at a time per connection. 2: binary, multiplexed streams, HPACK, still TCP head-of-line blocking. 3: QUIC over UDP, per-stream loss recovery, integrated TLS 1.3."
    },
    {
      id: "tls13",
      front: "TLS 1.3 handshake in brief?",
      back: "ClientHello with key share, ServerHello with key share, then encrypted: certificate, signature, Finished. One round trip. Ephemeral ECDH gives forward secrecy."
    },
    {
      id: "dns-steps",
      front: "How does DNS resolve a name?",
      back: "Stub resolver asks the recursive resolver, which asks root, then TLD, then the authoritative nameserver. Answers are cached for their TTL. Mostly UDP 53."
    },
    {
      id: "cname",
      front: "What is a CNAME and its restriction?",
      back: "An alias from one name to another. It cannot coexist with other record types at the same name, so it cannot be used at the zone apex."
    },
    {
      id: "rest-grpc-gql",
      front: "REST vs gRPC vs GraphQL?",
      back: "REST: resources and HTTP verbs, universal and cacheable. gRPC: typed RPC over HTTP/2 with protobuf, fast, streaming, internal services. GraphQL: client-specified fields from one endpoint, avoids over-fetching, harder to cache."
    },
    {
      id: "ws-sse",
      front: "WebSocket vs SSE?",
      back: "WebSocket: full-duplex, upgraded from HTTP. SSE: server to client only, plain HTTP, auto-reconnect. Use SSE for one-way pushes, WebSocket for two-way low latency."
    },
    {
      id: "url",
      front: "What happens when you type a URL?",
      back: "Parse, HSTS and cache check, DNS, TCP (or QUIC), TLS, HTTP request, server work (CDN, proxy, app, DB), response, then DOM and CSSOM build, subresources, layout, paint."
    },
    {
      id: "idempotent",
      front: "Which HTTP methods are idempotent?",
      back: "GET, PUT, DELETE (plus HEAD, OPTIONS); repeating them has the same effect as once. POST is not, which is why retries need idempotency keys."
    }
  ]
});
