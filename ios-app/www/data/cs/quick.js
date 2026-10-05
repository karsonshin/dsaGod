/* Offer Ready: CS fundamentals, quick hits. Tags: os, cc (concurrency), net, db, gen. */
OR.csQuick = (OR.csQuick || []).concat([
  {
    t: "os",
    q: "What does a thread not share with its sibling threads?",
    a: "Its stack, registers and program counter. Everything else in the process (heap, globals, code, open files) is shared."
  },
  {
    t: "os",
    q: "What is copy-on-write?",
    a: "After `fork`, parent and child share the same physical pages marked read-only; a page is copied only when one of them writes to it. It makes `fork` cheap."
  },
  {
    t: "os",
    q: "What is the convoy effect?",
    a: "In FCFS, many short jobs queue behind one long job, hurting average waiting time."
  },
  {
    t: "os",
    q: "Why can SJF starve jobs, and what is the fix?",
    a: "A steady stream of short jobs keeps pushing a long one back. Aging (raise priority with waiting time) fixes it."
  },
  {
    t: "os",
    q: "What is priority inversion?",
    a: "A high-priority thread waits on a lock held by a low-priority thread that is itself preempted by medium-priority work. Priority inheritance temporarily boosts the lock holder."
  },
  {
    t: "os",
    q: "What is Belady's anomaly?",
    a: "With FIFO page replacement, giving a process more frames can increase page faults. LRU does not have this problem."
  },
  {
    t: "os",
    q: "What does the dirty bit in a page table entry mean?",
    a: "The page has been modified since it was loaded, so it must be written to disk before the frame is reused."
  },
  {
    t: "os",
    q: "What is internal vs external fragmentation?",
    a: "Internal: wasted space inside an allocated block (the unused tail of a page). External: free memory split into pieces too small to use. Paging removes external fragmentation."
  },
  {
    t: "os",
    q: "What is a segmentation fault?",
    a: "An access to memory the process may not touch (unmapped address, writing a read-only page, null dereference). The kernel sends SIGSEGV."
  },
  {
    t: "os",
    q: "What is the difference between an interrupt and an exception?",
    a: "An interrupt comes asynchronously from hardware (timer, disk, network). An exception is raised synchronously by the running instruction (page fault, divide by zero)."
  },
  {
    t: "os",
    q: "Why is `fsync` needed after `write` for durability?",
    a: "`write` normally reaches only the OS page cache. `fsync` forces the data (and metadata) to stable storage."
  },
  {
    t: "os",
    q: "What does `mmap` do?",
    a: "Maps a file (or anonymous memory) into the process's address space so it can be accessed like memory, with the OS paging it in on demand."
  },
  {
    t: "os",
    q: "Spinlock or mutex for a very short critical section on a multicore machine?",
    a: "A spinlock can win, since sleeping and waking costs more than a brief spin. On one core, or for longer sections, spinning wastes the CPU, so use a mutex."
  },
  {
    t: "os",
    q: "What is a working set?",
    a: "The set of pages a process has used recently. If total working sets do not fit in RAM, the system thrashes."
  },
  {
    t: "os",
    q: "What is the difference between a mutex and a monitor?",
    a: "A mutex is just a lock. A monitor bundles the lock, the protected data and condition variables, with methods that run under the lock."
  },
  {
    t: "cc",
    q: "What does `volatile` do in Java, and what does it not do?",
    a: "It guarantees visibility and ordering of reads and writes to that variable. It does not make compound operations such as `i++` atomic."
  },
  {
    t: "cc",
    q: "What is a spurious wakeup?",
    a: "A thread returns from a condition wait although nobody signaled it (or the condition no longer holds). Always wait in a loop that re-checks the predicate."
  },
  {
    t: "cc",
    q: "What is a reentrant lock?",
    a: "A lock the owning thread can acquire again without deadlocking itself; it keeps a hold count and releases fully when the count returns to zero."
  },
  {
    t: "cc",
    q: "What is a happens-before relationship?",
    a: "A guarantee that the effects of one action (a write) are visible to another (a later read). Created by locks, volatile accesses, thread start and join, and similar."
  },
  {
    t: "cc",
    q: "What is the ABA problem?",
    a: "A compare-and-swap succeeds because the value is `A` again, although it changed to `B` and back in the meantime, so the surrounding state may be different. Fixes: version stamps or hazard pointers."
  },
  {
    t: "cc",
    q: "How do you make a class immutable and why does it help?",
    a: "Final fields set only in the constructor, no setters, defensive copies of mutable inputs. Immutable objects can be shared across threads without locks."
  },
  {
    t: "cc",
    q: "What is thread confinement?",
    a: "Keeping data accessible from only one thread (thread-local variables, stack-only data, an actor or event loop that owns it), so no locking is needed."
  },
  {
    t: "cc",
    q: "When use `notifyAll` instead of `notify`?",
    a: "When several kinds of waiters share one monitor, since `notify` may wake the wrong one. Waiters re-check their predicate, so extra wakeups are safe."
  },
  {
    t: "cc",
    q: "What is a deadlock-free way to lock two accounts for a transfer?",
    a: "Always lock them in a fixed global order, for example by account id, regardless of transfer direction."
  },
  {
    t: "cc",
    q: "Why is double-checked locking broken without `volatile` in Java?",
    a: "Another thread may see the non-null reference before the object's fields are fully written, because of reordering. A `volatile` field forbids that."
  },
  {
    t: "cc",
    q: "What is false sharing?",
    a: "Two threads write different variables that sit on the same CPU cache line, so the line bounces between cores and performance drops. Fix with padding or alignment."
  },
  {
    t: "cc",
    q: "What does `ThreadLocal` give you, and what is its risk?",
    a: "A separate value per thread. In thread pools the thread outlives the task, so values must be cleared (`remove`) or they leak or leak between tasks."
  },
  {
    t: "cc",
    q: "What is the difference between concurrency and parallelism?",
    a: "Concurrency is structuring a program as independently progressing tasks (possibly on one core). Parallelism is executing tasks literally at the same time on several cores."
  },
  {
    t: "cc",
    q: "What is Amdahl's law?",
    a: "Speedup is limited by the serial fraction: with serial fraction s and N processors, speedup is at most 1 / (s + (1 - s) / N)."
  },
  {
    t: "cc",
    q: "What does the Python GIL protect?",
    a: "CPython's interpreter internals (reference counts and so on). Only one thread runs bytecode at a time, so CPU-bound threads do not scale, but blocking I/O releases it."
  },
  {
    t: "net",
    q: "What are the well-known ports for HTTP, HTTPS, SSH, DNS and SMTP?",
    a: "80, 443, 22, 53, and 25 (SMTP between servers; 587 for submission)."
  },
  {
    t: "net",
    q: "Difference between a router and a switch?",
    a: "A switch forwards frames inside a network by MAC address (layer 2). A router forwards packets between networks by IP address (layer 3)."
  },
  {
    t: "net",
    q: "What does ARP do?",
    a: "Resolves an IPv4 address to a MAC address on the local network by broadcasting a question and caching the answer."
  },
  {
    t: "net",
    q: "What is NAT?",
    a: "Network address translation: a gateway rewrites private source addresses and ports to its public address, letting many devices share one IP. It breaks end-to-end addressing and needs port forwarding for inbound connections."
  },
  {
    t: "net",
    q: "What is the MTU and how is oversize traffic handled?",
    a: "The MTU (about 1500 bytes on Ethernet). Larger IP packets are fragmented, or TCP avoids it via MSS and path MTU discovery."
  },
  {
    t: "net",
    q: "What is a CDN?",
    a: "A geographically distributed network of caches that serves content from a location near the user, cutting latency and origin load."
  },
  {
    t: "net",
    q: "What is the difference between 301 and 302?",
    a: "301 is a permanent redirect (clients and search engines may cache it). 302 is temporary. 307 and 308 are the method-preserving equivalents."
  },
  {
    t: "net",
    q: "What are the 2xx, 3xx, 4xx and 5xx status families?",
    a: "Success, redirection, client error, server error. For example 200, 304, 404 and 503."
  },
  {
    t: "net",
    q: "What is CORS?",
    a: "A browser mechanism that blocks scripts from reading cross-origin responses unless the server allows the origin with `Access-Control-Allow-*` headers. It is enforced by browsers, not servers."
  },
  {
    t: "net",
    q: "What is a cookie, and what do `HttpOnly`, `Secure` and `SameSite` do?",
    a: "A small value the server asks the browser to send back. `HttpOnly` hides it from JavaScript, `Secure` restricts it to HTTPS, `SameSite` limits cross-site sending (CSRF defense)."
  },
  {
    t: "net",
    q: "Forward proxy vs reverse proxy?",
    a: "A forward proxy acts for clients reaching out (filtering, anonymity). A reverse proxy acts for servers (load balancing, TLS termination, caching)."
  },
  {
    t: "net",
    q: "What is the difference between L4 and L7 load balancing?",
    a: "L4 routes by IP and port without reading the payload (fast, simple). L7 inspects HTTP (path, headers, cookies) and can route, rewrite and terminate TLS."
  },
  {
    t: "net",
    q: "What is a TCP keep-alive vs HTTP keep-alive?",
    a: "TCP keep-alive probes an idle connection to see whether the peer is alive. HTTP keep-alive means reusing one connection for several requests."
  },
  {
    t: "net",
    q: "What is the Nagle algorithm?",
    a: "It coalesces small writes into fewer segments by waiting for an ACK. Latency-sensitive apps often disable it with TCP_NODELAY."
  },
  {
    t: "net",
    q: "What is an idempotency key?",
    a: "A client-supplied unique id sent with a non-idempotent request (such as a payment POST) so the server can recognize a retry and return the original result instead of repeating the action."
  },
  {
    t: "db",
    q: "What is the difference between WHERE and HAVING?",
    a: "WHERE filters rows before grouping; HAVING filters groups after aggregation."
  },
  {
    t: "db",
    q: "INNER vs LEFT vs FULL OUTER JOIN?",
    a: "INNER keeps matches only. LEFT keeps all left rows (NULLs for no match). FULL OUTER keeps unmatched rows from both sides."
  },
  {
    t: "db",
    q: "What is the logical order of SQL execution?",
    a: "FROM and JOIN, WHERE, GROUP BY, HAVING, SELECT (including window functions), DISTINCT, ORDER BY, LIMIT. It explains why a SELECT alias cannot be used in WHERE."
  },
  {
    t: "db",
    q: "UNION vs UNION ALL?",
    a: "UNION removes duplicates (extra sort or hash work). UNION ALL keeps everything and is faster; use it unless you need dedup."
  },
  {
    t: "db",
    q: "What is the difference between DELETE, TRUNCATE and DROP?",
    a: "DELETE removes rows (can be filtered, logged per row, fires triggers). TRUNCATE empties the table quickly. DROP removes the table itself. Transactional behavior of TRUNCATE and DROP varies by database."
  },
  {
    t: "db",
    q: "RANK vs DENSE_RANK vs ROW_NUMBER?",
    a: "After a tie, RANK skips numbers (1, 2, 2, 4), DENSE_RANK does not (1, 2, 2, 3), ROW_NUMBER gives every row a unique number."
  },
  {
    t: "db",
    q: "What is a primary key vs a unique key?",
    a: "A primary key identifies a row: unique and NOT NULL, one per table. A unique key enforces uniqueness on other columns and (in most databases) allows NULLs."
  },
  {
    t: "db",
    q: "What is a foreign key and what does ON DELETE CASCADE do?",
    a: "A column that must match a key in another table. CASCADE deletes the child rows automatically when the parent is deleted."
  },
  {
    t: "db",
    q: "What is a view vs a materialized view?",
    a: "A view is a stored query run each time it is used. A materialized view stores the result and must be refreshed."
  },
  {
    t: "db",
    q: "What is the N+1 query problem?",
    a: "One query loads N parent rows and then N more queries load each parent's children. Fix with a join or one batched `IN` query."
  },
  {
    t: "db",
    q: "What is a deadlock in a database and how is it resolved?",
    a: "Two transactions each hold a lock the other needs. The database detects the cycle and aborts one (the victim); the application should retry."
  },
  {
    t: "db",
    q: "What is sharding, and what is replication?",
    a: "Sharding splits data across nodes by a key (scales writes and storage). Replication copies the same data to several nodes (availability and read scale)."
  },
  {
    t: "db",
    q: "What is eventual consistency?",
    a: "If no new updates occur, all replicas converge to the same value eventually; reads may return stale data in the meantime."
  },
  {
    t: "db",
    q: "What is the CAP theorem in practice?",
    a: "During a network partition a distributed system must give up either consistency or availability. Outside partitions the real trade is consistency versus latency (PACELC)."
  },
  {
    t: "db",
    q: "Why is `SELECT COUNT(*)` slow on big tables in some engines?",
    a: "With MVCC (PostgreSQL), visibility must be checked per row, so it scans. Engines that keep an exact row count (MyISAM) are fast but cannot do this under concurrent transactions."
  },
  {
    t: "db",
    q: "What is a deadlock-prone pattern in updates and how to avoid it?",
    a: "Updating rows in different orders in different transactions. Update in a consistent order, keep transactions short, and use retries."
  },
  {
    t: "gen",
    q: "What is the difference between latency and throughput?",
    a: "Latency is the time for one operation. Throughput is how many operations complete per unit of time. They can trade off (batching raises throughput and latency)."
  },
  {
    t: "gen",
    q: "What is tail latency and why does it matter?",
    a: "The slow end of the distribution (p99, p99.9). When a request fans out to many backends, the slowest dominates, so tails hit users far more often than averages suggest."
  },
  {
    t: "gen",
    q: "What is a cache stampede and how do you prevent it?",
    a: "Many requests miss at once when a hot key expires and all hit the database. Fix with request coalescing, locking one refresher, staggered TTLs, or serving stale data while refreshing."
  },
  {
    t: "gen",
    q: "What happens to the rest of the program when one thread crashes fatally, versus one process?",
    a: "An unhandled fatal error in one thread (for example a segfault) usually takes down the whole process; a crashed process leaves other processes running."
  },
  {
    t: "gen",
    q: "Why use hashing with salts for passwords, and why a slow hash?",
    a: "Salts make identical passwords hash differently and defeat rainbow tables. Slow, memory-hard hashes (bcrypt, scrypt, Argon2) make brute-force guessing expensive. A fast hash such as plain SHA-256 is the wrong tool."
  }
]);
