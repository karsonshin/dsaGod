(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  OR.qa.push(
    {
      id: 'cs-process-vs-thread',
      title: 'Process vs thread',
      q: ['process vs thread', 'what is the difference between a process and a thread', 'thread vs process', 'do threads share memory', 'what is a thread', 'what is a process in an operating system'],
      tags: 'process thread os address space shared memory concurrency pcb stack heap',
      a: 'A **process** is a running program with its own address space (code, heap, file descriptors). A **thread** is a unit of execution inside a process; threads of one process share its heap and globals but each has its own stack and registers. Threads are cheaper to create and switch, but a bug in one can corrupt the whole process.',
      more: '- Process: isolated, crash is contained, communicate via pipes, sockets, shared memory (IPC).\n- Thread: shared memory makes communication easy and makes **races** possible.\n- Context switch between threads of the same process is cheaper (no address-space switch).\n- Python: threads share the interpreter (and the GIL); processes get their own interpreter.',
      see: ['#/cs']
    },
    {
      id: 'cs-context-switch',
      title: 'What is a context switch?',
      q: ['what is a context switch', 'context switching cost', 'why is context switching expensive', 'what happens during a context switch', 'process switch overhead'],
      tags: 'context switch scheduler pcb registers save restore tlb cache overhead',
      a: 'A context switch is when the OS stops running one thread or process and resumes another: it saves the running one\'s registers, program counter and stack pointer into its control block (PCB/TCB), then loads the saved state of the next one.',
      more: '- Direct cost: saving/restoring state plus scheduler work.\n- Indirect cost (usually bigger): CPU caches go cold and, between processes, the TLB is flushed or tagged.\n- Switching threads of the same process skips the address-space change, so it is cheaper.\n- Too many runnable threads means more time switching and less time working.',
      see: ['#/cs']
    },
    {
      id: 'cs-scheduling-algorithms',
      title: 'CPU scheduling algorithms: FCFS, SJF, priority',
      q: ['cpu scheduling algorithms', 'fcfs vs sjf', 'what is shortest job first', 'priority scheduling', 'what is starvation in scheduling', 'which scheduling algorithm minimizes average waiting time', 'scheduling algorithms operating system'],
      tags: 'scheduling fcfs fifo sjf srtf priority starvation aging convoy waiting time turnaround preemptive',
      a: '**FCFS** runs jobs in arrival order (simple, but a long job delays everyone: convoy effect). **SJF** runs the shortest burst first and gives the minimum average waiting time, but needs burst predictions and can starve long jobs. **Priority** runs the highest priority first; fix starvation with **aging** (raise priority over time).',
      code: { py: 'def avg_wait(bursts):\n    t = wait = 0\n    for b in bursts:\n        wait += t\n        t += b\n    return wait / len(bursts)\n\njobs = [8, 4, 1]            # all arrive at time 0\nprint("FCFS", avg_wait(jobs))           # 8.0\nprint("SJF ", avg_wait(sorted(jobs)))   # 2.0' },
      check: 'assert avg_wait(jobs) == (0 + 8 + 12) / 3\nassert avg_wait(sorted(jobs)) == (0 + 1 + 5) / 3\nassert avg_wait([5]) == 0',
      more: '- Preemptive SJF is called SRTF (shortest remaining time first).\n- Turnaround = finish - arrival; waiting = turnaround - burst.\n- SJF is optimal for average wait when all jobs are known up front.',
      see: ['#/cs']
    },
    {
      id: 'cs-round-robin',
      title: 'Round robin scheduling',
      q: ['round robin scheduling', 'what is round robin scheduling', 'time quantum round robin', 'simulate round robin in python', 'round robin algorithm cpu'],
      tags: 'round robin time slice quantum preemptive scheduling queue fairness',
      a: 'Round robin gives each ready process a fixed **time quantum** in turn; if it is not finished it goes to the back of the queue. It is fair and gives good response time. A tiny quantum wastes time on context switches; a huge one degrades into FCFS.',
      code: { py: 'from collections import deque\n\ndef round_robin(bursts, q):\n    """Return the finish time of each job (all arrive at 0)."""\n    dq = deque(enumerate(bursts))\n    t, done = 0, [0] * len(bursts)\n    while dq:\n        i, left = dq.popleft()\n        run = min(q, left)\n        t += run\n        if left > run:\n            dq.append((i, left - run))\n        else:\n            done[i] = t\n    return done\n\nprint(round_robin([5, 3, 1], 2))   # [9, 8, 5]' },
      check: 'assert round_robin([5, 3, 1], 2) == [9, 8, 5]\nassert round_robin([4], 10) == [4]\nassert round_robin([], 3) == []',
      see: ['#/cs']
    },
    {
      id: 'cs-virtual-memory-paging',
      title: 'Virtual memory and paging',
      q: ['what is virtual memory', 'how does paging work', 'what is a page table', 'virtual address to physical address', 'why do we need virtual memory', 'explain paging in operating systems'],
      tags: 'virtual memory paging page table frame offset mmu address translation swap isolation',
      a: 'Virtual memory gives each process its own private address space. Memory is cut into fixed-size **pages** (commonly 4 KiB); the MMU uses a per-process **page table** to map a virtual page number to a physical **frame**, and the offset inside the page is kept unchanged. This gives isolation, lets memory exceed RAM (swap), and avoids fragmentation.',
      code: { py: 'PAGE = 4096\npage_table = {0: 5, 1: 9}      # virtual page -> physical frame\n\ndef translate(vaddr):\n    vpn, off = divmod(vaddr, PAGE)\n    if vpn not in page_table:\n        raise LookupError("page fault")\n    return page_table[vpn] * PAGE + off\n\nprint(translate(4100))   # page 1, offset 4 -> frame 9 -> 36868' },
      check: 'assert translate(4100) == 9 * 4096 + 4\nassert translate(0) == 5 * 4096\ntry:\n    translate(9000); assert False\nexcept LookupError:\n    pass',
      more: '- Real page tables are multi-level (sparse) so unused regions cost nothing.\n- Each entry holds present, writable, user/kernel and dirty bits.\n- The TLB caches recent translations; see the TLB entry.',
      see: ['#/cs']
    },
    {
      id: 'cs-page-fault',
      title: 'What is a page fault?',
      q: ['what is a page fault', 'page fault handling steps', 'major vs minor page fault', 'what happens on a page fault', 'is a page fault an error'],
      tags: 'page fault demand paging swap disk trap minor major segfault',
      a: 'A page fault is a CPU trap raised when a program touches a virtual page that has no valid mapping in the page table. It is usually **not an error**: the OS loads the page (from disk or zero-fills it), updates the page table, and re-runs the instruction. If the address is truly invalid, the process gets a segmentation fault.',
      more: '- **Minor** fault: page already in RAM, only the mapping is missing (fast).\n- **Major** fault: needs disk I/O (milliseconds, a million times slower than RAM).\n- Demand paging loads pages only when first touched.\n- Thrashing: so many faults that the system does little real work.',
      see: ['#/cs']
    },
    {
      id: 'cs-tlb',
      title: 'What is the TLB?',
      q: ['what is a tlb', 'translation lookaside buffer', 'tlb miss vs page fault', 'why do we need a tlb', 'what does the tlb do'],
      tags: 'tlb translation lookaside buffer cache page table mmu miss hit',
      a: 'The TLB is a small, fast hardware cache of recent virtual-to-physical page translations. Without it every memory access would need extra memory reads to walk the page table. A TLB hit translates in about a cycle; a miss triggers a page-table walk, and only if the page is not mapped does it become a page fault.',
      more: '- TLB miss is not a page fault: it just costs a walk.\n- On a process switch the TLB is flushed, or entries are tagged with an address-space id (ASID).\n- Effective access time = hit rate x fast + miss rate x slow, so even a 99% hit rate matters.',
      see: ['#/cs']
    },
    {
      id: 'cs-deadlock-conditions',
      title: 'Deadlock and its four conditions',
      q: ['what is a deadlock', 'four conditions for deadlock', 'coffman conditions', 'necessary conditions for deadlock', 'deadlock example operating system', 'what causes a deadlock'],
      tags: 'deadlock mutual exclusion hold and wait no preemption circular wait coffman',
      a: 'A deadlock is a set of threads each waiting for a resource another holds, so none can proceed. It needs all four (Coffman) conditions: **mutual exclusion** (resource is exclusive), **hold and wait** (holds one while requesting another), **no preemption** (cannot be taken away), **circular wait** (a cycle of waiters). Break any one and deadlock cannot happen.',
      more: '- Example: thread A locks 1 then wants 2; thread B locks 2 then wants 1.\n- Same idea in databases (row locks) and in distributed systems.\n- See the prevention entry for how to break each condition.',
      see: ['#/cs']
    },
    {
      id: 'cs-deadlock-prevention',
      title: 'Prevent or avoid deadlock',
      q: ['how to prevent deadlock', 'deadlock prevention vs avoidance', 'what is the bankers algorithm', 'how do you avoid deadlocks', 'deadlock detection and recovery', 'lock ordering'],
      tags: 'deadlock prevention avoidance bankers algorithm safe state lock ordering timeout detection recovery',
      a: '**Prevent** by breaking a condition: acquire all locks at once (no hold and wait), allow preemption or timeouts (try-lock and back off), or impose a global lock order (no circular wait; the most practical fix). **Avoid** by only granting requests that keep the system in a safe state (Banker\'s algorithm). Otherwise **detect** cycles in the wait-for graph and kill or roll back a victim.',
      more: '- Lock ordering: always take locks in the same order, e.g. by id.\n- Timeouts: `lock.acquire(timeout=...)`, then release everything and retry.\n- Banker\'s algorithm needs max demands declared in advance, so it is rare in practice.\n- Databases detect deadlocks and abort one transaction.',
      see: ['#/cs']
    },
    {
      id: 'cs-mutex-semaphore-monitor',
      title: 'Mutex vs semaphore vs monitor',
      q: ['mutex vs semaphore', 'difference between mutex and semaphore', 'what is a monitor in os', 'binary semaphore vs mutex', 'what is a semaphore', 'what is a mutex'],
      tags: 'mutex semaphore monitor lock condition variable synchronization binary counting ownership',
      a: 'A **mutex** is a lock with an owner: only the thread that locked it may unlock it, giving mutual exclusion. A **semaphore** is a counter: `acquire` decrements (blocks at 0), `release` increments, so it limits access to N resources and any thread may signal. A **monitor** bundles data, a lock and condition variables so only one thread runs inside at a time.',
      code: { py: 'import threading, time\n\nsem = threading.Semaphore(2)     # at most 2 inside\nactive = peak = 0\nguard = threading.Lock()\n\ndef worker():\n    global active, peak\n    with sem:\n        with guard:\n            active += 1; peak = max(peak, active)\n        time.sleep(0.02)\n        with guard:\n            active -= 1\n\nts = [threading.Thread(target=worker) for _ in range(6)]\n[t.start() for t in ts]; [t.join() for t in ts]\nprint(peak)   # 2' },
      check: 'assert peak <= 2 and peak >= 1\nassert active == 0',
      more: '- Use a mutex to protect a critical section; a semaphore to throttle or signal (e.g. a connection pool of size N).\n- Python `threading.Condition` plus a lock is the monitor pattern.\n- Java `synchronized` methods are monitors.',
      see: ['#/cs']
    },
    {
      id: 'cs-race-condition-critical-section',
      title: 'Race condition and critical section',
      q: ['what is a race condition', 'what is a critical section', 'how to fix a race condition', 'race condition example', 'data race vs race condition', 'why is counter += 1 not thread safe'],
      tags: 'race condition critical section lost update read modify write mutual exclusion synchronization',
      a: 'A **race condition** is a bug where the result depends on the timing of threads. A **critical section** is the code that touches shared state and must run by one thread at a time. Classic cause: `x += 1` is read, add, write; two threads can both read the old value and one update is lost. Fix by guarding the critical section with a lock (or using an atomic).',
      code: { py: '# Deterministic replay of the bad interleaving of two "x += 1":\nx = 0\na = x        # thread A reads 0\nb = x        # thread B reads 0\nx = a + 1    # A writes 1\nx = b + 1    # B writes 1  -> one increment lost\nprint(x)     # 1, not 2\n\n# Fix: lock around the read-modify-write\nimport threading\ncount, lock = 0, threading.Lock()\ndef work():\n    global count\n    for _ in range(10000):\n        with lock:\n            count += 1\nts = [threading.Thread(target=work) for _ in range(4)]\n[t.start() for t in ts]; [t.join() for t in ts]\nprint(count)  # always 40000' },
      check: 'assert x == 1\nassert count == 40000',
      more: '- Keep critical sections small; locking everything kills parallelism.\n- A **data race** is unsynchronized access where one is a write; it is undefined behaviour in C/C++.\n- Alternatives: immutable data, message passing, atomics.',
      see: ['#/cs']
    },
    {
      id: 'cs-producer-consumer',
      title: 'Producer-consumer problem',
      q: ['producer consumer problem', 'producer consumer in python', 'bounded buffer problem', 'producer consumer with semaphores', 'how to implement producer consumer'],
      tags: 'producer consumer bounded buffer queue semaphore condition variable blocking queue',
      a: 'Producers add items to a bounded buffer and consumers remove them; producers must wait when it is full and consumers when it is empty. Classic solution: two semaphores (empty slots, filled slots) plus a mutex. In Python just use `queue.Queue(maxsize=N)`, which does all of that for you.',
      code: { py: 'import queue, threading\n\nq = queue.Queue(maxsize=3)\nSTOP = object()\nout = []\n\ndef producer():\n    for i in range(5):\n        q.put(i)          # blocks when full\n    q.put(STOP)\n\ndef consumer():\n    while True:\n        item = q.get()    # blocks when empty\n        if item is STOP:\n            break\n        out.append(item * 10)\n\nt1 = threading.Thread(target=producer)\nt2 = threading.Thread(target=consumer)\nt1.start(); t2.start(); t1.join(); t2.join()\nprint(out)   # [0, 10, 20, 30, 40]' },
      check: 'assert out == [0, 10, 20, 30, 40]\nassert q.empty()',
      more: '- With several consumers, put one STOP sentinel per consumer.\n- Use `task_done()` / `join()` to wait until all work is processed.',
      see: ['#/cs']
    },
    {
      id: 'cs-dining-philosophers',
      title: 'Dining philosophers problem',
      q: ['dining philosophers problem', 'dining philosophers solution', 'how to solve dining philosophers', 'dining philosophers deadlock', 'dining philosophers python'],
      tags: 'dining philosophers deadlock starvation forks resource ordering concurrency classic',
      a: 'Five philosophers share five forks and each needs two to eat. If everyone grabs the left fork first, all wait forever (deadlock). Simple fixes: number the forks and always pick the lower-numbered one first (breaks circular wait), allow at most four philosophers to sit at once, or let one philosopher pick right first.',
      code: { py: 'import threading\n\nN = 5\nforks = [threading.Lock() for _ in range(N)]\nmeals = [0] * N\n\ndef philosopher(i):\n    a, b = sorted((i, (i + 1) % N))   # lower-numbered fork first\n    for _ in range(100):\n        with forks[a]:\n            with forks[b]:\n                meals[i] += 1\n\nts = [threading.Thread(target=philosopher, args=(i,)) for i in range(N)]\n[t.start() for t in ts]; [t.join() for t in ts]\nprint(meals)   # [100, 100, 100, 100, 100]' },
      check: 'assert meals == [100] * 5',
      see: ['#/cs']
    },
    {
      id: 'cs-atomic-operations',
      title: 'What is an atomic operation?',
      q: ['what is an atomic operation', 'atomic vs lock', 'compare and swap', 'what is cas', 'lock free programming basics', 'atomic increment'],
      tags: 'atomic compare and swap cas lock free volatile memory ordering fetch add',
      a: 'An atomic operation completes as one indivisible step: no other thread can see it half done. Hardware provides primitives like fetch-and-add and **compare-and-swap** (set the value only if it still equals what I read). Atomics make simple counters and flags safe without a lock; multi-step invariants still need locks.',
      more: '- CAS loop: read old, compute new, retry if the CAS fails.\n- Java `AtomicInteger`, C++ `std::atomic`, Go `sync/atomic`.\n- Python has no public atomic integer; use `threading.Lock`, or rely on the fact that single bytecodes like `list.append` are atomic under the GIL.\n- Lock-free structures face the ABA problem.',
      see: ['#/cs']
    },
    {
      id: 'cs-stack-vs-heap',
      title: 'Stack vs heap memory',
      q: ['stack vs heap', 'difference between stack and heap memory', 'process memory layout', 'where are local variables stored', 'what is the heap in memory', 'memory layout of a program'],
      tags: 'stack heap memory layout text data bss local variables malloc stack overflow frame',
      a: 'The **stack** holds call frames (locals, return addresses): allocation is just moving a pointer, it is freed automatically on return, and it is small (stack overflow on deep recursion). The **heap** holds dynamically allocated objects that outlive a call: slower to allocate, manually freed or garbage collected, can fragment. A process layout is: code (text), globals (data/bss), heap growing up, stack growing down.',
      code: { py: 'import sys\n\ndef depth(n=0):\n    try:\n        return depth(n + 1)\n    except RecursionError:\n        return n\n\nprint(sys.getrecursionlimit())   # 1000 by default: Python guards its call stack\nprint(depth() > 100)             # True' },
      check: 'assert sys.getrecursionlimit() > 0\nassert depth() > 100',
      more: '- In Python every object lives on the heap; frames hold references.\n- Stack variables die with their frame; heap objects need an owner (GC, free, RAII).',
      see: ['#/cs']
    },
    {
      id: 'cs-system-calls',
      title: 'What is a system call?',
      q: ['what is a system call', 'user mode vs kernel mode', 'how does a program talk to the kernel', 'syscall examples', 'what happens on a system call'],
      tags: 'system call syscall kernel mode user mode trap read write fork open privilege',
      a: 'A system call is the controlled way a user program asks the kernel to do something privileged (open a file, read a socket, create a process). The program puts the call number and arguments in registers and executes a trap instruction; the CPU switches to kernel mode, the kernel does the work and returns. Library calls like `print` or `open` wrap them.',
      code: { py: 'import os\n\nfd = os.open(__file__ if "__file__" in globals() else ".", os.O_RDONLY)   # open(2)\nprint(fd >= 3)         # True: 0,1,2 are stdin/stdout/stderr\nos.close(fd)           # close(2)\nprint(os.getpid() > 0) # getpid(2)' },
      check: 'assert fd >= 3\nassert os.getpid() > 0',
      more: '- Examples: open, read, write, fork, exec, mmap, socket.\n- The mode switch has a cost, so libraries batch I/O with buffers.\n- Hardware-enforced privilege rings stop user code touching devices directly.',
      see: ['#/cs']
    },
    {
      id: 'cs-interrupts',
      title: 'What is an interrupt?',
      q: ['what is an interrupt', 'interrupt vs polling', 'hardware interrupt vs software interrupt', 'what happens when an interrupt occurs', 'interrupt handler'],
      tags: 'interrupt polling isr handler trap exception timer keyboard dma',
      a: 'An interrupt is a signal that makes the CPU pause what it is doing, save its state and run a handler (ISR), then resume. **Hardware** interrupts come from devices (keyboard, network card, timer); **software** interrupts/traps come from the program (system calls, page faults, divide by zero). Interrupts avoid wasteful **polling**.',
      more: '- The timer interrupt is how the OS regains control to do preemptive scheduling.\n- Handlers must be short; heavy work is deferred to a lower-priority context.\n- Polling is simpler and can win when events arrive constantly (high-speed networking).',
      see: ['#/cs']
    },
    {
      id: 'cs-file-system-basics',
      title: 'File system basics: inodes and directories',
      q: ['how does a file system work', 'what is an inode', 'hard link vs soft link', 'what is a file descriptor', 'file system basics', 'symbolic link vs hard link'],
      tags: 'file system inode directory hard link symlink soft link file descriptor block journaling',
      a: 'A file system maps names to data on disk. A directory maps a **name to an inode number**; the **inode** stores metadata (size, owner, permissions, timestamps) and where the data blocks are, but not the name. A **hard link** is another name for the same inode; a **symlink** is a small file holding a path. A **file descriptor** is a per-process integer handle to an open file.',
      code: { py: 'import os, tempfile\n\nd = tempfile.mkdtemp()\np = os.path.join(d, "a.txt")\nopen(p, "w").write("hi")\nos.link(p, os.path.join(d, "b.txt"))        # hard link\nprint(os.stat(p).st_nlink)                   # 2\nprint(os.stat(p).st_ino == os.stat(os.path.join(d, "b.txt")).st_ino)  # True' },
      check: 'assert os.stat(p).st_nlink == 2',
      more: '- Deleting a file removes a name; data is freed when link count and open handles drop to 0.\n- Journaling file systems log changes first so a crash cannot corrupt metadata.\n- Hard links cannot cross file systems; symlinks can and may dangle.',
      see: ['#/cs']
    },
    {
      id: 'cs-zombie-orphan',
      title: 'Zombie vs orphan process',
      q: ['zombie process', 'orphan process', 'zombie vs orphan process', 'what is a defunct process', 'how to remove a zombie process'],
      tags: 'zombie orphan process wait fork init sigchld defunct reaping parent',
      a: 'A **zombie** is a child that has exited but whose parent has not yet called `wait()`, so its exit status entry stays in the process table (shown as `<defunct>`). An **orphan** is a still-running child whose parent died; it is adopted by init/systemd. Fix zombies by having the parent `wait()` (reap) or handle SIGCHLD; you cannot kill a zombie, only its parent.',
      code: { py: 'import os\n\npid = os.fork() if hasattr(os, "fork") else 0\nif pid == 0 and hasattr(os, "fork"):\n    os._exit(3)                       # child exits immediately\nelif pid:\n    _, status = os.waitpid(pid, 0)    # parent reaps it: no zombie\n    print(os.WEXITSTATUS(status))     # 3' },
      check: 'assert (not hasattr(os, "fork")) or os.WEXITSTATUS(status) == 3',
      more: 'Zombies use almost no memory but each holds a PID; thousands of them can exhaust the PID table.',
      see: ['#/cs']
    },
    {
      id: 'cs-page-replacement-lru',
      title: 'Page replacement algorithms (FIFO, LRU)',
      q: ['page replacement algorithms', 'lru page replacement', 'fifo vs lru page replacement', 'beladys anomaly', 'count page faults lru', 'which page is evicted'],
      tags: 'page replacement fifo lru optimal clock belady anomaly page faults frames eviction',
      a: 'When RAM is full the OS must evict a page. **FIFO** evicts the oldest (can suffer Belady\'s anomaly: more frames, more faults). **LRU** evicts the least recently used and approximates the optimal policy well; real kernels use the cheaper **clock** approximation. **Optimal** (evict the page used farthest in the future) is only a benchmark.',
      code: { py: 'from collections import OrderedDict\n\ndef lru_faults(refs, frames):\n    cache, faults = OrderedDict(), 0\n    for p in refs:\n        if p in cache:\n            cache.move_to_end(p)\n        else:\n            faults += 1\n            if len(cache) == frames:\n                cache.popitem(last=False)\n            cache[p] = True\n    return faults\n\nrefs = [1, 2, 3, 1, 4, 2]\nprint(lru_faults(refs, 3))   # 5' },
      check: 'assert lru_faults(refs, 3) == 5\nassert lru_faults([1, 1, 1], 1) == 1\nassert lru_faults([], 2) == 0',
      see: ['#/cs']
    },
    {
      id: 'cs-priority-inversion-starvation',
      title: 'Starvation vs priority inversion',
      q: ['what is starvation', 'priority inversion', 'starvation vs deadlock', 'what is livelock', 'priority inheritance'],
      tags: 'starvation priority inversion priority inheritance livelock deadlock aging mars pathfinder',
      a: 'In **starvation** a runnable thread never gets the resource because others keep winning; fix with aging or fair queues. **Priority inversion**: a high-priority task waits on a lock held by a low-priority task that a medium-priority task keeps pre-empting; fix with **priority inheritance**. In **livelock** threads keep reacting to each other and make no progress, whereas in deadlock they are blocked.',
      more: '- Deadlock: stuck and idle. Livelock: busy but stuck. Starvation: others progress, you do not.\n- Priority inversion famously hit the Mars Pathfinder lander in 1997.',
      see: ['#/cs']
    },

    /* ---------- Python concurrency ---------- */
    {
      id: 'cs-threading-multiprocessing-asyncio',
      title: 'Threading vs multiprocessing vs asyncio',
      q: ['threading vs multiprocessing vs asyncio', 'when to use threads vs processes in python', 'asyncio vs threading', 'python concurrency options', 'multiprocessing vs multithreading python', 'cpu bound vs io bound python'],
      tags: 'threading multiprocessing asyncio gil io bound cpu bound concurrency parallelism python',
      a: 'I/O-bound with a few blocking calls: **threading** (or `ThreadPoolExecutor`). I/O-bound with thousands of connections and async libraries: **asyncio** (one thread, cooperative `await`). CPU-bound: **multiprocessing** (`ProcessPoolExecutor`), because each process has its own GIL and runs truly in parallel.',
      code: { py: 'from concurrent.futures import ThreadPoolExecutor\nimport time\n\ndef fake_io(i):\n    time.sleep(0.1)       # blocking wait releases the GIL\n    return i * 2\n\nstart = time.perf_counter()\nwith ThreadPoolExecutor(max_workers=10) as ex:\n    res = list(ex.map(fake_io, range(10)))\nelapsed = time.perf_counter() - start\nprint(res, elapsed < 0.5)   # ten waits overlap, ~0.1s total' },
      check: 'assert res == [i * 2 for i in range(10)]\nassert elapsed < 0.6',
      more: '- Threads: preemptive, shared memory, need locks.\n- asyncio: cooperative, one blocking call stalls everything, no locks needed between awaits.\n- Processes: heavy to start, data must be pickled between them.\n- Threads do not speed up pure-Python CPU work.',
      see: ['#/cs']
    },
    {
      id: 'cs-python-gil',
      title: 'What is the GIL?',
      q: ['what is the gil in python', 'global interpreter lock', 'why python threads are not parallel', 'does the gil make code thread safe', 'how to bypass the gil', 'gil explained'],
      tags: 'gil global interpreter lock cpython threads parallelism free threaded reference counting',
      a: 'The GIL is a lock in CPython that lets only one thread execute Python bytecode at a time. It protects the interpreter\'s internals (reference counts, object allocation), not your data. It is released during blocking I/O and many C extensions, so threads help I/O but not CPU-bound Python. It does **not** make `x += 1` or multi-step logic thread safe.',
      more: '- Bypass: `multiprocessing`, C extensions (NumPy) that release the GIL, or other interpreters.\n- Python 3.13+ has an optional free-threaded build without the GIL.\n- A thread switch can occur between any two bytecodes, so compound operations still need locks.',
      see: ['#/cs']
    },
    {
      id: 'cs-python-lock',
      title: 'How to use a Lock in Python',
      q: ['python threading lock', 'how to use lock in python', 'with lock python', 'rlock vs lock', 'protect shared variable between threads python'],
      tags: 'python threading lock rlock acquire release with context manager mutex',
      a: 'Create one `threading.Lock()` shared by the threads and wrap the critical section in `with lock:` so it is always released, even on exceptions. A plain `Lock` cannot be re-acquired by the thread that holds it (deadlock); use `RLock` when the same thread may enter nested locked code.',
      code: { py: 'import threading\n\nbalance = 100\nlock = threading.Lock()\n\ndef withdraw(n):\n    global balance\n    with lock:                 # check-then-act must be atomic\n        if balance >= n:\n            balance -= n\n            return True\n        return False\n\nrs = []\nts = [threading.Thread(target=lambda: rs.append(withdraw(30))) for _ in range(5)]\n[t.start() for t in ts]; [t.join() for t in ts]\nprint(balance, rs.count(True))   # 10 3' },
      check: 'assert balance == 10 and rs.count(True) == 3\nr = threading.RLock()\nwith r:\n    with r:\n        pass',
      see: ['#/cs']
    },
    {
      id: 'cs-threadpool-executor',
      title: 'ThreadPoolExecutor in Python',
      q: ['threadpoolexecutor example', 'how to run tasks in parallel with threads python', 'concurrent.futures tutorial', 'executor map vs submit', 'as_completed python', 'thread pool python'],
      tags: 'threadpoolexecutor concurrent futures submit map as_completed thread pool future result',
      a: 'Use `concurrent.futures.ThreadPoolExecutor` as a context manager. `ex.map(fn, items)` returns results in input order; `ex.submit(fn, x)` returns a `Future` whose `.result()` waits (and re-raises the task\'s exception); `as_completed(futures)` yields futures as each finishes.',
      code: { py: 'from concurrent.futures import ThreadPoolExecutor, as_completed\nimport time\n\ndef work(n):\n    time.sleep(0.05 * (3 - n))\n    return n * n\n\nwith ThreadPoolExecutor(max_workers=3) as ex:\n    ordered = list(ex.map(work, [0, 1, 2]))          # input order\n    futs = [ex.submit(work, n) for n in [0, 1, 2]]\n    finished = [f.result() for f in as_completed(futs)]  # completion order\nprint(ordered, finished)   # [0, 1, 4] [4, 1, 0]' },
      check: 'assert ordered == [0, 1, 4]\nassert sorted(finished) == [0, 1, 4]',
      more: 'Use `ProcessPoolExecutor` (same API) for CPU-bound work; the function and arguments must be picklable and the code guarded by `if __name__ == "__main__":`.',
      see: ['#/cs']
    },
    {
      id: 'cs-asyncio-gather-create-task',
      title: 'asyncio: gather vs create_task',
      q: ['asyncio gather example', 'asyncio create_task', 'how to run coroutines concurrently', 'asyncio.run python', 'gather vs create_task', 'async await python example'],
      tags: 'asyncio gather create_task await coroutine event loop async python concurrent sleep',
      a: 'Calling an `async def` function only creates a coroutine. Run it with `asyncio.run(main())`. To run several concurrently, use `await asyncio.gather(c1(), c2())` (results come back in order) or `asyncio.create_task(c())` to start one now and `await` it later. Awaiting them one after another runs them sequentially.',
      code: { py: 'import asyncio, time\n\nasync def fetch(n):\n    await asyncio.sleep(0.1)     # non-blocking wait\n    return n * 2\n\nasync def main():\n    t = asyncio.create_task(fetch(1))     # starts running now\n    rest = await asyncio.gather(fetch(2), fetch(3))\n    return [await t] + rest\n\nstart = time.perf_counter()\nresult = asyncio.run(main())\nelapsed = time.perf_counter() - start\nprint(result, elapsed < 0.25)   # [2, 4, 6] True' },
      check: 'assert result == [2, 4, 6]\nassert elapsed < 0.3',
      more: '- Never call blocking code (`time.sleep`, `requests.get`) inside a coroutine; use `await asyncio.sleep`, an async client, or `await asyncio.to_thread(fn)`.\n- Python 3.11 adds `asyncio.TaskGroup` for structured concurrency.',
      see: ['#/cs']
    },
    {
      id: 'cs-race-condition-demo-fix',
      title: 'Race condition demo and fix in Python',
      q: ['race condition python example', 'python threads lost update demo', 'thread safe counter python', 'demonstrate race condition in python', 'make a counter thread safe'],
      tags: 'race condition python demo thread safe counter lock lost update threads shared state',
      a: 'The counter `n += 1` compiles to load, add, store; a thread switch in between loses an update. The reliable fix is a `Lock` around the read-modify-write (or keep one counter per thread and add at the end). The unsafe version may print the right answer on some runs, which is what makes races hard to find.',
      code: { py: 'import threading\n\nclass Counter:\n    def __init__(self):\n        self.n = 0\n        self._lock = threading.Lock()\n    def inc(self):\n        with self._lock:\n            self.n += 1\n\nc = Counter()\ndef run():\n    for _ in range(50000):\n        c.inc()\nts = [threading.Thread(target=run) for _ in range(4)]\n[t.start() for t in ts]; [t.join() for t in ts]\nprint(c.n)   # 200000 every time' },
      check: 'assert c.n == 200000',
      see: ['#/cs']
    },
    {
      id: 'cs-deadlock-demo-lock-ordering',
      title: 'Deadlock demo and lock ordering fix',
      q: ['deadlock example python', 'python deadlock threads', 'how to fix deadlock with lock ordering', 'demonstrate deadlock', 'two locks deadlock'],
      tags: 'deadlock python lock ordering threads acquire timeout barrier two locks fix',
      a: 'Two threads deadlock when one takes lock A then B and the other takes B then A. The fix is a global order: always acquire in the same order (for example by `id`). The demo below uses `acquire(timeout=...)` so the deadlock is detected instead of hanging.',
      code: { py: 'import threading\n\nA, B = threading.Lock(), threading.Lock()\nbar = threading.Barrier(2)\nbar2 = threading.Barrier(2)\nstuck = []\n\ndef bad(first, second):\n    with first:\n        bar.wait()                       # both now hold their first lock\n        if second.acquire(timeout=0.3):  # would wait forever without timeout\n            second.release()\n        else:\n            stuck.append(True)\n        bar2.wait()                      # keep holding until both have timed out\n\nts = [threading.Thread(target=bad, args=(A, B)), threading.Thread(target=bad, args=(B, A))]\n[t.start() for t in ts]; [t.join() for t in ts]\nprint("deadlocked:", len(stuck) == 2)   # True\n\ndef good(x, y):\n    first, second = sorted((x, y), key=id)   # one global order\n    with first:\n        with second:\n            return True\n\nprint(good(A, B), good(B, A))   # True True' },
      check: 'assert len(stuck) == 2\nassert good(A, B) and good(B, A)',
      see: ['#/cs']
    },
    {
      id: 'cs-thread-safety-append-vs-increment',
      title: 'Is list.append thread safe? What about x += 1?',
      q: ['is list append thread safe in python', 'is x += 1 atomic in python', 'which python operations are atomic', 'thread safe operations python gil', 'is dict thread safe python'],
      tags: 'thread safe atomic list append dict increment gil bytecode dis python',
      a: '`list.append`, `dict[key] = v` and `queue.Queue` operations are atomic in CPython (a single C call under the GIL). `x += 1` is **not**: it is several bytecodes (load, add, store) and a thread switch can land in the middle. Any check-then-act or read-modify-write sequence needs a lock, even if each step is atomic.',
      code: { py: 'import dis, io, contextlib\n\ndef inc():\n    global x\n    x += 1\n\nbuf = io.StringIO()\nwith contextlib.redirect_stdout(buf):\n    dis.dis(inc)\nops = buf.getvalue()\nprint("BINARY_OP" in ops, "STORE_GLOBAL" in ops)   # True True: read, add, write are separate steps' },
      check: 'assert "LOAD_GLOBAL" in ops and "STORE_GLOBAL" in ops',
      more: 'Do not rely on this for correctness across Python implementations or the free-threaded build; prefer locks or `queue.Queue`.',
      see: ['#/cs']
    },
    {
      id: 'cs-processpool-multiprocessing',
      title: 'multiprocessing / ProcessPoolExecutor for CPU-bound work',
      q: ['python multiprocessing example', 'how to use multiple cores in python', 'processpoolexecutor example', 'multiprocessing pool map', 'speed up cpu bound python'],
      tags: 'multiprocessing processpoolexecutor pool map cpu bound parallel cores pickle main guard',
      a: 'Use `ProcessPoolExecutor` (or `multiprocessing.Pool`) to run CPU-bound functions on separate cores, each process with its own GIL. The function must be defined at module top level (picklable), and the launching code must sit under `if __name__ == "__main__":` because child processes re-import the module on Windows/macOS.',
      code: { py: 'from concurrent.futures import ProcessPoolExecutor\n\ndef count_primes(n):\n    return sum(all(i % d for d in range(2, int(i ** 0.5) + 1)) for i in range(2, n))\n\nif __name__ == "__main__":\n    with ProcessPoolExecutor(max_workers=2) as ex:\n        res = list(ex.map(count_primes, [1000, 2000]))\n    print(res)   # [168, 303]' },
      check: 'assert count_primes(1000) == 168\nassert count_primes(2) == 0',
      more: 'Arguments and results are pickled, so passing huge objects between processes is slow. Parallelism pays off only when each task does enough work.',
      see: ['#/cs']
    },
    {
      id: 'cs-async-blocking-call',
      title: 'Run blocking code inside asyncio',
      q: ['asyncio blocking call', 'asyncio to_thread', 'time.sleep in async function', 'run blocking function in asyncio', 'why is my async code slow'],
      tags: 'asyncio to_thread blocking run_in_executor event loop time sleep block async',
      a: 'A blocking call inside a coroutine freezes the whole event loop. Replace it with an async equivalent (`await asyncio.sleep`), or push it to a worker thread with `await asyncio.to_thread(fn, *args)` (Python 3.9+) so other tasks keep running.',
      code: { py: 'import asyncio, time\n\ndef blocking(n):\n    time.sleep(0.1)\n    return n + 1\n\nasync def main():\n    return await asyncio.gather(*(asyncio.to_thread(blocking, i) for i in range(5)))\n\nstart = time.perf_counter()\nout = asyncio.run(main())\nelapsed = time.perf_counter() - start\nprint(out, elapsed < 0.4)   # [1, 2, 3, 4, 5] True' },
      check: 'assert out == [1, 2, 3, 4, 5]\nassert elapsed < 0.45',
      see: ['#/cs']
    },
    {
      id: 'cs-thread-event-semaphore-condition',
      title: 'Event, Condition and Semaphore in Python threading',
      q: ['python threading event', 'threading condition variable python', 'wait and notify python', 'how to stop a thread in python', 'signal between threads python'],
      tags: 'python threading event condition wait notify stop thread flag signal',
      a: 'Use `threading.Event` for a simple flag: one thread calls `set()`, others `wait()` or poll `is_set()` (the clean way to ask a thread to stop). Use `threading.Condition` when waiting for a state to become true: `with cond: cond.wait_for(predicate)`, and the other side changes the state then `notify_all()`.',
      code: { py: 'import threading, time\n\nstop = threading.Event()\nticks = []\n\ndef worker():\n    while not stop.is_set():\n        ticks.append(1)\n        stop.wait(0.01)       # sleeps, but wakes at once on set()\n\nt = threading.Thread(target=worker)\nt.start(); time.sleep(0.05); stop.set(); t.join()\nprint(len(ticks) > 0, t.is_alive())   # True False' },
      check: 'assert ticks and not t.is_alive()',
      more: 'Python threads cannot be killed from outside; they must cooperate by checking a flag.',
      see: ['#/cs']
    },
    /* ---------- Networking ---------- */
    {
      id: 'cs-tcp-vs-udp',
      title: 'TCP vs UDP',
      q: ['tcp vs udp', 'difference between tcp and udp', 'when to use udp', 'is tcp reliable', 'why does dns use udp', 'tcp or udp for video'],
      tags: 'tcp udp reliable connection datagram transport layer ordering congestion latency',
      a: 'Use **TCP** when you need every byte, in order: it is connection-oriented, retransmits lost data, orders it, and does flow and congestion control (web, email, databases). Use **UDP** when speed or low latency matters more than completeness: no handshake, no retransmission, no ordering, just datagrams (DNS queries, live video/voice, games, QUIC builds on it).',
      code: { py: 'import socket\n\n# UDP: no connection, just send a datagram\nrecv = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\nrecv.bind(("127.0.0.1", 0))\nport = recv.getsockname()[1]\nsend = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\nsend.sendto(b"ping", ("127.0.0.1", port))\ndata, _ = recv.recvfrom(1024)\nprint(data)   # b\'ping\'\nrecv.close(); send.close()' },
      check: 'assert data == b"ping"',
      more: '- TCP is a byte stream (no message boundaries); UDP preserves datagram boundaries.\n- Head-of-line blocking: one lost TCP segment delays everything behind it.\n- Apps over UDP must handle loss themselves if they care.',
      see: ['#/cs']
    },
    {
      id: 'cs-tcp-handshake',
      title: 'TCP three-way handshake',
      q: ['tcp three way handshake', 'what is syn ack', 'how does tcp establish a connection', 'tcp connection termination', 'what is a syn flood', 'why three way handshake'],
      tags: 'tcp three way handshake syn syn-ack ack fin time_wait sequence numbers connection',
      a: 'The client sends **SYN** (with its initial sequence number), the server replies **SYN-ACK** (its own sequence number plus acknowledgement), and the client sends **ACK**. Both sides have now confirmed they can send and receive and agreed on sequence numbers. Closing uses FIN/ACK in each direction (four steps), and the side that closes first lingers in TIME_WAIT.',
      more: '- One round trip passes before the client can send data, which is why connection reuse (keep-alive) matters.\n- SYN flood: attacker sends SYNs and never ACKs to fill the half-open queue; mitigated by SYN cookies.\n- TLS adds more round trips on top (see the TLS entry).',
      see: ['#/cs']
    },
    {
      id: 'cs-flow-vs-congestion-control',
      title: 'Flow control vs congestion control',
      q: ['flow control vs congestion control', 'what is tcp congestion control', 'tcp sliding window', 'slow start tcp', 'what is the receive window', 'tcp congestion window'],
      tags: 'flow control congestion control sliding window rwnd cwnd slow start aimd tcp',
      a: '**Flow control** protects the *receiver*: it advertises a receive window (rwnd) so the sender never overruns its buffer. **Congestion control** protects the *network*: the sender keeps a congestion window (cwnd) that grows (slow start, then additive increase) and shrinks sharply on packet loss (multiplicative decrease, AIMD). The sender may have at most min(rwnd, cwnd) unacknowledged bytes in flight.',
      more: '- Slow start doubles cwnd each round trip until a threshold.\n- Loss is read as a congestion signal; modern algorithms (CUBIC, BBR) refine this.\n- Throughput is bounded by window / round-trip time.',
      see: ['#/cs']
    },
    {
      id: 'cs-http-methods-idempotent',
      title: 'HTTP methods and idempotency',
      q: ['http methods', 'get vs post', 'put vs patch', 'which http methods are idempotent', 'what does idempotent mean', 'safe vs idempotent http', 'put vs post'],
      tags: 'http methods get post put patch delete idempotent safe head options rest',
      a: '**GET** reads (safe), **POST** creates or triggers an action, **PUT** replaces a resource, **PATCH** partially updates, **DELETE** removes. **Idempotent** means repeating the request leaves the same server state: GET, PUT, DELETE, HEAD, OPTIONS are; POST and (in general) PATCH are not. **Safe** means no state change at all (GET, HEAD, OPTIONS).',
      more: '- Retrying a POST can create duplicates; use an **idempotency key** header.\n- PUT to the same URL twice gives the same result; POST twice usually makes two records.\n- DELETE is idempotent even though the second call may return 404.\n- GET must not change state (crawlers and prefetchers call it).',
      see: ['#/cs']
    },
    {
      id: 'cs-http-status-codes',
      title: 'HTTP status codes cheat sheet',
      q: ['http status codes', '401 vs 403', '200 vs 201 vs 204', '301 vs 302', '502 vs 503 vs 504', 'what does 404 mean', 'http status code meanings'],
      tags: 'http status codes 200 201 204 301 302 304 400 401 403 404 409 429 500 502 503 504',
      a: '2xx success: **200** OK, **201** Created, **204** No Content. 3xx redirect: **301** permanent, **302/307** temporary, **304** Not Modified (use your cache). 4xx client error: **400** bad request, **401** not authenticated, **403** authenticated but forbidden, **404** not found, **409** conflict, **429** too many requests. 5xx server error: **500** generic, **502** bad gateway, **503** unavailable, **504** gateway timeout.',
      more: '- 401 means "who are you?", 403 means "I know you, but no".\n- 502/504: a proxy got a bad response / no response from the upstream.\n- 307/308 keep the method; 301/302 historically let clients change POST to GET.',
      see: ['#/cs']
    },
    {
      id: 'cs-http1-http2-http3',
      title: 'HTTP/1.1 vs HTTP/2 vs HTTP/3',
      q: ['http 1.1 vs http 2', 'what is http/3', 'difference between http2 and http3', 'what is multiplexing in http', 'what is quic', 'head of line blocking http'],
      tags: 'http1 http2 http3 quic multiplexing head of line blocking hpack tcp udp keep alive',
      a: '**HTTP/1.1** is text-based; one request at a time per connection (browsers open ~6 connections), with keep-alive. **HTTP/2** uses a binary format, **multiplexes** many requests over one TCP connection and compresses headers (HPACK), but one lost TCP packet still stalls all streams. **HTTP/3** runs over **QUIC (UDP)**: independent streams (no TCP head-of-line blocking), TLS 1.3 built in, faster connection setup.',
      more: '- Semantics (methods, status codes, headers) are the same across versions; only the transport framing changes.\n- HTTP/2 server push is deprecated.\n- QUIC connections survive IP changes (e.g. wifi to mobile).',
      see: ['#/cs']
    },
    {
      id: 'cs-https-tls-handshake',
      title: 'HTTPS and the TLS handshake',
      q: ['how does https work', 'tls handshake steps', 'what is ssl tls', 'what is a certificate authority', 'how does tls encrypt traffic', 'https vs http'],
      tags: 'https tls ssl handshake certificate ca public key session key diffie hellman symmetric',
      a: 'HTTPS is HTTP inside TLS. In the handshake the server proves its identity with a certificate signed by a trusted CA, client and server agree on a cipher and run an ephemeral key exchange (Diffie-Hellman) to derive a shared **session key**, and then all data is encrypted with fast symmetric crypto. You get confidentiality, integrity and server authentication.',
      more: '- Asymmetric crypto is used only for authentication and key agreement; bulk data uses symmetric ciphers (AES, ChaCha20).\n- TLS 1.3 needs 1 round trip (0-RTT on resumption); TLS 1.2 needs 2.\n- The client verifies the certificate chain, expiry and that the hostname matches.\n- Ephemeral keys give **forward secrecy**.',
      see: ['#/cs']
    },
    {
      id: 'cs-dns-resolution',
      title: 'How DNS resolution works',
      q: ['how does dns work', 'dns resolution steps', 'recursive vs iterative dns', 'what is a dns record a cname', 'dns ttl caching', 'what is dns'],
      tags: 'dns resolver root tld authoritative nameserver a record aaaa cname mx ttl cache recursive',
      a: 'DNS turns a name into an IP. The app asks the OS cache, then a **recursive resolver** (ISP or 8.8.8.8). On a miss the resolver asks a **root** server (who handles `.com`?), then the **TLD** server (who handles `example.com`?), then the domain\'s **authoritative** server, which returns the record. Every answer is cached for its **TTL**.',
      code: { py: 'import socket\n\n# The OS resolver does the whole chain for you:\ninfo = socket.getaddrinfo("localhost", 80, proto=socket.IPPROTO_TCP)\nprint(sorted({i[4][0] for i in info}))   # e.g. [\'127.0.0.1\']' },
      check: 'assert any(i[4][0] in ("127.0.0.1", "::1") for i in info)',
      more: '- Records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT, NS.\n- Low TTL = fast failover, more lookups; high TTL = fewer lookups, slow changes.\n- DNS mostly uses UDP port 53, TCP for large answers.',
      see: ['#/cs']
    },
    {
      id: 'cs-what-happens-typing-url',
      title: 'What happens when you type a URL and press Enter?',
      q: ['what happens when you type a url in the browser', 'what happens when you type google.com', 'url to render browser steps', 'how does a browser load a web page', 'life of a web request', 'how does a browser render a page'],
      tags: 'browser url dns tcp tls http request response render dom cssom javascript paint critical rendering path',
      a: '1) Parse the URL; check cache/HSTS. 2) **DNS** lookup. 3) **TCP** handshake (or QUIC). 4) **TLS** handshake for https. 5) Send the **HTTP request**; the server (via CDN/load balancer) returns HTML. 6) The browser parses HTML into the **DOM** and CSS into the **CSSOM**, fetching more resources; JS may block parsing. 7) Combine into a render tree, **layout**, **paint**, composite. Later requests reuse the connection.',
      more: '- Scripts without `async`/`defer` block HTML parsing; CSS blocks rendering.\n- The same chain explains many performance tips: CDNs, keep-alive, caching, preconnect, compression.\n- Redirects add whole extra round trips.',
      see: ['#/cs']
    },
    {
      id: 'cs-cors',
      title: 'What is CORS?',
      q: ['what is cors', 'cors error fix', 'same origin policy', 'cors preflight request', 'access-control-allow-origin', 'why do i get a cors error'],
      tags: 'cors cross origin resource sharing same origin policy preflight options access-control-allow-origin browser',
      a: 'Browsers enforce the **same-origin policy**: a page may not read responses from a different origin (scheme + host + port). **CORS** is how a server opts in, by sending headers like `Access-Control-Allow-Origin: https://app.example`. For non-simple requests (custom headers, PUT/DELETE, JSON content type) the browser first sends an **OPTIONS preflight**. Fix a CORS error on the *server*, not in the client.',
      more: '- CORS is enforced by the browser; curl or server-to-server calls ignore it.\n- It protects users\' data, not your server (the request is still sent).\n- With cookies you need `Access-Control-Allow-Credentials: true` and a specific origin, never `*`.\n- Cache preflights with `Access-Control-Max-Age`.',
      see: ['#/cs']
    },
    {
      id: 'cs-cookies-sessions-jwt',
      title: 'Cookies vs sessions vs JWT',
      q: ['cookies vs sessions', 'session vs jwt', 'what is a jwt', 'how does jwt work', 'where to store jwt', 'stateless authentication'],
      tags: 'cookie session jwt json web token authentication stateless httponly secure samesite bearer',
      a: 'A **cookie** is a small value the browser sends with every request to a site. A **session** keeps data on the server and gives the browser only a random id in a cookie (easy to revoke). A **JWT** is a signed token (header.payload.signature) that carries claims itself, so the server verifies the signature without a lookup (stateless, but hard to revoke before expiry).',
      code: { py: 'import base64, hmac, hashlib, json\n\ndef b64(b):\n    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()\n\ndef make_jwt(payload, secret):\n    head = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())\n    body = b64(json.dumps(payload).encode())\n    sig = b64(hmac.new(secret, f"{head}.{body}".encode(), hashlib.sha256).digest())\n    return f"{head}.{body}.{sig}"\n\ndef verify(token, secret):\n    head, body, sig = token.split(".")\n    good = b64(hmac.new(secret, f"{head}.{body}".encode(), hashlib.sha256).digest())\n    return hmac.compare_digest(sig, good)\n\ntok = make_jwt({"sub": "42"}, b"s3cret")\nprint(verify(tok, b"s3cret"), verify(tok, b"wrong"))   # True False' },
      check: 'assert verify(tok, b"s3cret") and not verify(tok, b"wrong")\nh, b, s = tok.split(".")\nassert not verify(h + "." + b64(b\'{"sub": "1"}\') + "." + s, b"s3cret")',
      more: '- The JWT payload is only base64-encoded, **not encrypted**: never put secrets in it.\n- Cookie flags: `HttpOnly` (hidden from JS), `Secure` (https only), `SameSite` (CSRF defence).\n- Short-lived access token plus a refresh token is the usual compromise.',
      see: ['#/cs']
    },
    {
      id: 'cs-rest-principles',
      title: 'REST principles',
      q: ['what is rest', 'rest api principles', 'restful api design', 'rest vs graphql', 'what makes an api restful', 'rest api best practices'],
      tags: 'rest restful api stateless resources uniform interface hateoas http verbs nouns graphql',
      a: 'REST models an API as **resources** identified by URLs (nouns: `/users/42`) acted on with standard HTTP verbs. Core constraints: client-server, **stateless** requests (each carries what the server needs), cacheable responses, a uniform interface, and a layered system (proxies, CDNs). Return proper status codes and representations (usually JSON).',
      more: '- `GET /orders`, `POST /orders`, `GET /orders/7`, `PUT /orders/7`, `DELETE /orders/7`.\n- Paginate lists (cursor or page params); version the API (`/v1`).\n- Statelessness is what lets you scale horizontally behind a load balancer.\n- GraphQL lets the client choose fields in one request; REST is simpler to cache.',
      see: ['#/cs']
    },
    {
      id: 'cs-websockets',
      title: 'WebSockets vs HTTP polling vs SSE',
      q: ['what are websockets', 'websocket vs http', 'websocket vs server sent events', 'long polling vs websockets', 'how do websockets work', 'real time communication web'],
      tags: 'websocket polling long polling sse server sent events real time full duplex upgrade chat',
      a: 'A **WebSocket** is a persistent, full-duplex TCP connection: the client sends an HTTP request with `Upgrade: websocket`, the server answers 101, and from then on either side can push messages at any time with little overhead. Use it for chat, games, live collaboration. For one-way server push, **SSE** is simpler; **polling** is the fallback.',
      more: '- Polling: repeated requests, wasteful and laggy. Long polling: server holds the request until data exists.\n- SSE: one-way over plain HTTP with automatic reconnect.\n- Stateful connections complicate scaling: you need sticky routing or a pub/sub backplane (Redis) to fan out messages.',
      see: ['#/cs']
    },
    {
      id: 'cs-ip-subnet-cidr',
      title: 'IP addresses, subnets and CIDR',
      q: ['what is cidr notation', 'how to calculate subnet', 'what does /24 mean', 'python ipaddress module', 'is ip in subnet python', 'how many hosts in a /26', 'subnet mask explained'],
      tags: 'ip subnet cidr netmask ipaddress python network prefix hosts private ip ipv4 ipv6',
      a: 'CIDR `a.b.c.d/N` means the first N bits are the network and the rest are host bits, so a /N IPv4 block has 2^(32-N) addresses (minus 2 usable on classic subnets: network and broadcast). `/24` = 256 addresses, mask 255.255.255.0. Python\'s `ipaddress` module does the arithmetic.',
      code: { py: 'import ipaddress\n\nnet = ipaddress.ip_network("192.168.1.0/24")\nprint(net.num_addresses, net.netmask)                      # 256 255.255.255.0\nprint(ipaddress.ip_address("192.168.1.77") in net)         # True\nprint(ipaddress.ip_address("10.0.0.1").is_private)         # True\nprint(list(ipaddress.ip_network("10.0.0.0/30").hosts()))   # 2 usable hosts\nprint([str(s) for s in net.subnets(new_prefix=25)])        # two /25 blocks' },
      check: 'assert net.num_addresses == 256\nassert ipaddress.ip_address("192.168.2.1") not in net\nassert len(list(ipaddress.ip_network("10.0.0.0/30").hosts())) == 2\nassert ipaddress.ip_network("10.0.0.0/26").num_addresses == 64',
      more: '- Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.\n- Smaller prefix number = bigger network.\n- Routers pick the **longest matching prefix**.',
      see: ['#/cs']
    },
    {
      id: 'cs-nat',
      title: 'What is NAT?',
      q: ['what is nat', 'network address translation explained', 'how does nat work', 'why do we need nat', 'private ip to public ip', 'nat port forwarding'],
      tags: 'nat network address translation private ip public ip router port forwarding pat ipv4',
      a: 'NAT lets many devices with private IPs share one public IP. The router rewrites each outgoing packet\'s source address and port to its own public address and a unique port, remembers the mapping in a table, and reverses it for the reply. It slowed IPv4 exhaustion, but inbound connections need port forwarding because the router has no mapping for them.',
      more: '- Usually PAT (port address translation): the port number distinguishes the devices.\n- NAT is not a firewall, though it blocks unsolicited inbound traffic by default.\n- Peer-to-peer apps need NAT traversal (STUN/TURN).\n- IPv6 has enough addresses to avoid NAT.',
      see: ['#/cs']
    },
    {
      id: 'cs-load-balancer-layers',
      title: 'Layer 4 vs Layer 7 load balancer',
      q: ['l4 vs l7 load balancer', 'layer 4 vs layer 7 load balancing', 'load balancing algorithms', 'what is a load balancer', 'round robin vs least connections', 'nginx vs haproxy load balancing'],
      tags: 'load balancer layer 4 layer 7 round robin least connections ip hash health check reverse proxy',
      a: 'A load balancer spreads requests over servers and removes unhealthy ones. **L4** balances TCP/UDP connections by IP and port: fast and protocol-agnostic. **L7** reads HTTP, so it can route by path, host or header, terminate TLS, cache and rewrite, at higher CPU cost. Algorithms: round robin, least connections, weighted, IP hash / consistent hash for stickiness.',
      more: '- Health checks pull dead servers out of rotation.\n- The load balancer itself must not be a single point of failure (run a pair, or use DNS / anycast).\n- Sticky sessions pin a user to one server; stateless services avoid needing them.',
      see: ['#/cs']
    },
    {
      id: 'cs-latency-numbers',
      title: 'Latency numbers every programmer should know',
      q: ['latency numbers every programmer should know', 'how long does a disk read take', 'ram vs ssd vs network latency', 'order of magnitude latency', 'back of envelope latency numbers'],
      tags: 'latency numbers memory ssd disk network round trip cache l1 ram cross datacenter',
      a: 'Rough orders of magnitude: L1 cache ~1 ns, main memory ~100 ns, SSD random read ~100 microseconds, same-datacenter round trip ~0.5 ms, spinning-disk seek ~10 ms, cross-continent round trip ~100-150 ms. Each tier is about 10-1000x slower than the one above, so cache and batch to avoid the slow ones.',
      code: { py: 'ns = {"L1": 1, "RAM": 100, "SSD read": 100_000, "datacenter RTT": 500_000, "disk seek": 10_000_000, "intercontinental RTT": 150_000_000}\nfor name, t in ns.items():\n    print(f"{name:22s}{t / ns[\'RAM\']:>12,.0f} x RAM")' },
      check: 'assert ns["RAM"] // ns["L1"] == 100\nassert ns["SSD read"] > ns["RAM"] * 100',
      more: 'These are approximate and vary by hardware and year; use them for ratios and back-of-the-envelope design, not exact figures.',
      see: ['#/cs']
    },

    /* ---------- Databases ---------- */
    {
      id: 'cs-acid',
      title: 'ACID properties',
      q: ['what is acid in databases', 'acid properties explained', 'atomicity consistency isolation durability', 'what is a transaction', 'acid vs base'],
      tags: 'acid atomicity consistency isolation durability transaction database wal commit',
      a: '**Atomicity**: all statements in a transaction happen or none do. **Consistency**: a transaction moves the database from one valid state to another (constraints hold). **Isolation**: concurrent transactions do not see each other\'s partial work (to the degree of the isolation level). **Durability**: once committed, data survives a crash (via a write-ahead log).',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.execute("CREATE TABLE acct(id INTEGER PRIMARY KEY, bal INTEGER CHECK(bal >= 0))")\ndb.executemany("INSERT INTO acct VALUES (?, ?)", [(1, 100), (2, 50)])\ndb.commit()\ntry:\n    with db:   # one transaction: commit on success, rollback on error\n        db.execute("UPDATE acct SET bal = bal + 500 WHERE id = 2")\n        db.execute("UPDATE acct SET bal = bal - 500 WHERE id = 1")   # violates CHECK\nexcept sqlite3.IntegrityError:\n    pass\nprint(db.execute("SELECT id, bal FROM acct ORDER BY id").fetchall())   # [(1, 100), (2, 50)] unchanged' },
      check: 'assert db.execute("SELECT id, bal FROM acct ORDER BY id").fetchall() == [(1, 100), (2, 50)]',
      more: 'The CHECK failure rolled back the first UPDATE too: that is atomicity protecting consistency.',
      see: ['#/cs']
    },
    {
      id: 'cs-isolation-levels-anomalies',
      title: 'Isolation levels and anomalies',
      q: ['transaction isolation levels', 'dirty read vs non repeatable read vs phantom read', 'read committed vs repeatable read', 'what is serializable isolation', 'sql isolation levels explained', 'what is a phantom read'],
      tags: 'isolation levels read uncommitted read committed repeatable read serializable dirty read non-repeatable phantom anomaly mvcc',
      a: '**Dirty read**: you read another transaction\'s uncommitted data. **Non-repeatable read**: re-reading a row gives a different value because someone committed an update. **Phantom**: re-running a query returns new rows that match. Levels fix more as they go up: READ UNCOMMITTED (none fixed), READ COMMITTED (no dirty reads), REPEATABLE READ (also no non-repeatable reads), SERIALIZABLE (no phantoms either; as if run one at a time).',
      more: '- Higher isolation means more blocking or more aborted retries.\n- PostgreSQL default: READ COMMITTED; MySQL InnoDB default: REPEATABLE READ.\n- Most engines use **MVCC** (readers see a snapshot, do not block writers).\n- Snapshot isolation still allows **write skew**; see that entry.',
      see: ['#/cs']
    },
    {
      id: 'cs-write-skew',
      title: 'What is write skew?',
      q: ['what is write skew', 'write skew anomaly example', 'snapshot isolation anomaly', 'on call doctors problem', 'lost update vs write skew'],
      tags: 'write skew snapshot isolation anomaly serializable lost update on call doctors constraint',
      a: 'Write skew: two transactions each read an overlapping set of rows, then each write *different* rows, and together they break an invariant that each alone preserved. Example: two on-call doctors each check "at least 2 are on call" and both go off call, leaving zero. Snapshot isolation allows it; fix with SERIALIZABLE, locking the rows read (`SELECT ... FOR UPDATE`), or a constraint.',
      more: '- Lost update is different: both write the *same* row.\n- Because the writes touch different rows, row-level conflict detection does not notice.\n- Serializable snapshot isolation (PostgreSQL) detects these dependencies and aborts one transaction; the app must retry.',
      see: ['#/cs']
    },
    {
      id: 'cs-index-btree',
      title: 'How database indexes and B-trees work',
      q: ['how does a database index work', 'what is a b tree index', 'b tree vs b+ tree', 'why are indexes fast', 'when not to use an index', 'composite index column order', 'what is a covering index'],
      tags: 'index b-tree b+ tree database lookup composite covering leftmost prefix write overhead selectivity',
      a: 'An index is a separate sorted structure (usually a **B+ tree**) mapping column values to row locations, so a lookup is O(log n) page reads instead of a full table scan. Cost: extra disk, and every INSERT/UPDATE/DELETE must also update the index. A **composite** index (a, b) helps queries on `a` or `a,b` (leftmost prefix) but not on `b` alone.',
      more: '- B+ tree: wide nodes (hundreds of keys) keep it 3-4 levels deep for millions of rows; leaves are linked for range scans and ORDER BY.\n- Index low-selectivity columns (e.g. boolean) rarely helps.\n- A **covering** index contains every column the query needs, so the table is never touched.\n- Functions on the column (`WHERE lower(name)=...`) can prevent index use.',
      see: ['#/cs']
    },
    {
      id: 'cs-clustered-vs-nonclustered',
      title: 'Clustered vs non-clustered index',
      q: ['clustered vs non clustered index', 'what is a clustered index', 'secondary index', 'primary key index vs secondary index', 'difference clustered nonclustered'],
      tags: 'clustered non-clustered secondary index primary key table order leaf pages heap rowid',
      a: 'A **clustered** index defines how the table rows themselves are physically ordered: the table *is* the B-tree, with row data in the leaves, so there is only one per table (InnoDB and SQL Server use the primary key). A **non-clustered (secondary)** index is a separate structure whose leaves hold the key plus a pointer (row id or primary key) to the row, and you can have many.',
      more: '- Range scans on the clustered key are fast and sequential.\n- A secondary-index lookup may need a second lookup into the table (a bookmark lookup) unless it is covering.\n- Large clustered keys bloat every secondary index in InnoDB.\n- PostgreSQL tables are heaps; its indexes are all secondary.',
      see: ['#/cs']
    },
    {
      id: 'cs-explain-query-plan',
      title: 'Query plans and EXPLAIN',
      q: ['what is explain in sql', 'how to read a query plan', 'full table scan vs index scan', 'how to optimize a slow sql query', 'explain query plan sqlite', 'why is my query slow'],
      tags: 'explain query plan optimizer index scan table scan seq scan slow query performance sqlite postgres',
      a: '`EXPLAIN` shows how the database will execute a query: which tables are read in which order, whether it uses an index or scans the full table, and how joins are done. Look for full scans on big tables, missing indexes on filter/join columns, and big row-estimate mismatches. `EXPLAIN ANALYZE` (Postgres/MySQL) also runs it and reports real timings.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.execute("CREATE TABLE users(id INTEGER PRIMARY KEY, email TEXT)")\nq = "EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = \'a@x.com\'"\nbefore = " ".join(r[3] for r in db.execute(q))\ndb.execute("CREATE INDEX idx_email ON users(email)")\nafter = " ".join(r[3] for r in db.execute(q))\nprint(before)   # SCAN users\nprint(after)    # SEARCH users USING INDEX idx_email (email=?)' },
      check: 'assert "SCAN" in before and "SEARCH" in after and "idx_email" in after',
      see: ['#/cs']
    },
    {
      id: 'cs-normalization',
      title: 'Normalization: 1NF, 2NF, 3NF',
      q: ['database normalization', '1nf 2nf 3nf explained', 'what is third normal form', 'when to denormalize', 'what is normalization in dbms', 'normal forms examples'],
      tags: 'normalization 1nf 2nf 3nf bcnf denormalization functional dependency redundancy anomaly',
      a: '**1NF**: every column holds one atomic value, no repeating groups. **2NF**: 1NF and every non-key column depends on the *whole* key (no partial dependency on part of a composite key). **3NF**: 2NF and non-key columns depend only on the key, not on other non-key columns (no transitive dependency). Mnemonic: each fact depends on "the key, the whole key, and nothing but the key".',
      more: '- Example 3NF violation: `orders(id, customer_id, customer_city)`: city depends on customer, so move it to `customers`.\n- Goal: avoid update, insert and delete anomalies caused by duplicated facts.\n- **Denormalize** deliberately for read speed (reporting, caches), accepting duplicate data to keep in sync.',
      see: ['#/cs']
    },
    {
      id: 'cs-sql-joins',
      title: 'SQL joins: inner, left, right, full',
      q: ['sql joins explained', 'inner join vs left join', 'left join vs right join', 'full outer join', 'what is a self join', 'cross join', 'join types sql'],
      tags: 'sql join inner left right full outer cross self join on null unmatched sqlite',
      a: '**INNER** keeps only rows that match on both sides. **LEFT** keeps all left rows, filling right columns with NULL when unmatched. **RIGHT** is the mirror. **FULL OUTER** keeps unmatched rows from both. **CROSS** pairs every row with every row. A **self join** joins a table to itself with aliases (employee to manager).',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.executescript("""\nCREATE TABLE a(id INT, x TEXT); CREATE TABLE b(id INT, y TEXT);\nINSERT INTO a VALUES (1,\'a1\'),(2,\'a2\'); INSERT INTO b VALUES (2,\'b2\'),(3,\'b3\');\n""")\nq = lambda s: db.execute(s).fetchall()\nprint(q("SELECT a.x, b.y FROM a JOIN b ON a.id=b.id"))              # [(\'a2\', \'b2\')]\nprint(q("SELECT a.x, b.y FROM a LEFT JOIN b ON a.id=b.id"))         # [(\'a1\', None), (\'a2\', \'b2\')]\nprint(q("SELECT a.x, b.y FROM a RIGHT JOIN b ON a.id=b.id"))        # [(\'a2\', \'b2\'), (None, \'b3\')]\nprint(len(q("SELECT * FROM a FULL JOIN b ON a.id=b.id")))           # 3' },
      check: 'assert q("SELECT a.x, b.y FROM a JOIN b ON a.id=b.id") == [("a2", "b2")]\nassert q("SELECT a.x, b.y FROM a LEFT JOIN b ON a.id=b.id") == [("a1", None), ("a2", "b2")]\nassert len(q("SELECT * FROM a FULL JOIN b ON a.id=b.id")) == 3\nassert len(q("SELECT * FROM a CROSS JOIN b")) == 4',
      more: 'Needs SQLite 3.39+ for RIGHT and FULL (older SQLite: swap tables and use LEFT). A filter on the right table in `WHERE` turns a LEFT JOIN into an inner join; put it in `ON` instead.',
      see: ['#/cs']
    },
    {
      id: 'cs-group-by-having',
      title: 'GROUP BY and HAVING',
      q: ['group by vs having', 'sql group by example', 'where vs having', 'count per group sql', 'aggregate functions sql', 'sql having clause'],
      tags: 'sql group by having where aggregate count sum avg order of execution',
      a: '`GROUP BY` collapses rows into groups so aggregates (`COUNT`, `SUM`, `AVG`, `MAX`) compute per group. `WHERE` filters rows *before* grouping; `HAVING` filters groups *after* aggregation, so it can use aggregates. Logical order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.executescript("""\nCREATE TABLE sales(dept TEXT, amt INT);\nINSERT INTO sales VALUES (\'a\',10),(\'a\',20),(\'b\',5),(\'c\',50),(\'c\',1);\n""")\nrows = db.execute("""\n  SELECT dept, COUNT(*), SUM(amt) FROM sales\n  WHERE amt > 1            -- row filter\n  GROUP BY dept\n  HAVING SUM(amt) >= 30    -- group filter\n  ORDER BY dept\n""").fetchall()\nprint(rows)   # [(\'a\', 2, 30), (\'c\', 1, 50)]' },
      check: 'assert rows == [("a", 2, 30), ("c", 1, 50)]',
      more: 'Every selected column must be either in GROUP BY or inside an aggregate (strict engines reject otherwise).',
      see: ['#/cs']
    },
    {
      id: 'cs-window-functions',
      title: 'SQL window functions',
      q: ['sql window functions', 'row_number vs rank vs dense_rank', 'top n per group sql', 'running total in sql', 'partition by over sql', 'lag and lead sql'],
      tags: 'sql window function over partition by row_number rank dense_rank lag lead running total sum top n per group',
      a: 'A window function computes a value for each row over a related set of rows **without collapsing them** (unlike GROUP BY): `func() OVER (PARTITION BY g ORDER BY x)`. `ROW_NUMBER` numbers rows, `RANK` leaves gaps after ties, `DENSE_RANK` does not, `LAG/LEAD` read neighbours, and `SUM() OVER (ORDER BY ...)` gives a running total. Wrap in a subquery/CTE to filter on the result (top N per group).',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.executescript("""\nCREATE TABLE emp(name TEXT, dept TEXT, sal INT);\nINSERT INTO emp VALUES (\'a\',\'x\',300),(\'b\',\'x\',200),(\'c\',\'x\',200),(\'d\',\'y\',100);\n""")\ntop = db.execute("""\n  SELECT dept, name, rnk FROM (\n    SELECT dept, name, RANK() OVER (PARTITION BY dept ORDER BY sal DESC) AS rnk FROM emp\n  ) WHERE rnk <= 2 ORDER BY dept, rnk, name\n""").fetchall()\nprint(top)   # [(\'x\', \'a\', 1), (\'x\', \'b\', 2), (\'x\', \'c\', 2), (\'y\', \'d\', 1)]\nrun = db.execute("SELECT name, SUM(sal) OVER (ORDER BY name) FROM emp").fetchall()\nprint(run)   # running total' },
      check: 'assert top == [("x", "a", 1), ("x", "b", 2), ("x", "c", 2), ("y", "d", 1)]\nassert run[-1][1] == 800',
      see: ['#/cs']
    },
    {
      id: 'cs-subquery-vs-cte',
      title: 'Subquery vs CTE',
      q: ['subquery vs cte', 'what is a cte in sql', 'with clause sql', 'recursive cte example', 'correlated subquery', 'cte vs temp table'],
      tags: 'sql cte with clause subquery correlated recursive common table expression',
      a: 'A subquery is a query nested inside another; a **CTE** (`WITH name AS (...)`) names a subquery up front so you can read it top-to-bottom and reuse it in the main query. They usually perform the same; pick the CTE for readability and for **recursive** queries (hierarchies, sequences). A *correlated* subquery references the outer row and runs conceptually once per row.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\nnums = db.execute("""\n  WITH RECURSIVE n(i) AS (\n    SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 5\n  )\n  SELECT i FROM n\n""").fetchall()\nprint([r[0] for r in nums])   # [1, 2, 3, 4, 5]\n\ndb.executescript("CREATE TABLE e(id INT, mgr INT); INSERT INTO e VALUES (1,NULL),(2,1),(3,2);")\nchain = db.execute("""\n  WITH RECURSIVE up(id) AS (SELECT 3 UNION ALL SELECT e.mgr FROM e JOIN up ON e.id = up.id WHERE e.mgr IS NOT NULL)\n  SELECT id FROM up\n""").fetchall()\nprint([r[0] for r in chain])   # [3, 2, 1]' },
      check: 'assert [r[0] for r in nums] == [1, 2, 3, 4, 5]\nassert [r[0] for r in chain] == [3, 2, 1]',
      see: ['#/cs']
    },
    {
      id: 'cs-sql-null',
      title: 'NULL semantics in SQL',
      q: ['sql null comparison', 'why is null = null false', 'is null vs = null', 'three valued logic sql', 'null in not in', 'coalesce sql', 'count(*) vs count(column)'],
      tags: 'sql null three valued logic unknown is null coalesce not in count distinct',
      a: 'NULL means "unknown", so any comparison with it (`= NULL`, `<> NULL`, even `NULL = NULL`) yields UNKNOWN, which `WHERE` treats as false. Test with `IS NULL` / `IS NOT NULL`. Aggregates skip NULLs (`COUNT(col)` ignores them, `COUNT(*)` does not), and `NOT IN` with a NULL in the list returns no rows. Use `COALESCE(x, default)` to substitute.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\nq = lambda s: db.execute(s).fetchall()\nprint(q("SELECT NULL = NULL, NULL IS NULL"))             # [(None, 1)]\nprint(q("SELECT 1 NOT IN (2, NULL)"))                    # [(None,)] -> row filtered out\ndb.executescript("CREATE TABLE t(v INT); INSERT INTO t VALUES (1),(NULL),(3);")\nprint(q("SELECT COUNT(*), COUNT(v), AVG(v) FROM t"))      # [(3, 2, 2.0)]\nprint(q("SELECT COALESCE(v, 0) FROM t"))                 # [(1,), (0,), (3,)]' },
      check: 'assert q("SELECT NULL = NULL") == [(None,)]\nassert q("SELECT COUNT(*), COUNT(v) FROM t") == [(3, 2)]\nassert q("SELECT * FROM t WHERE v = NULL") == []',
      more: 'NULLs also sort first or last depending on the engine, and are treated as equal by DISTINCT and GROUP BY.',
      see: ['#/cs']
    },
    {
      id: 'cs-transactions-rollback',
      title: 'Transactions: BEGIN, COMMIT, ROLLBACK',
      q: ['how do sql transactions work', 'commit and rollback example', 'transaction in python sqlite3', 'what is a savepoint', 'bank transfer transaction'],
      tags: 'transaction begin commit rollback savepoint sqlite3 python atomic transfer context manager',
      a: 'A transaction groups statements so they succeed or fail together: `BEGIN`, run the statements, then `COMMIT` to make them permanent or `ROLLBACK` to undo them all. In Python\'s sqlite3, `with conn:` commits if the block succeeds and rolls back if it raises. Keep transactions short so locks are held briefly.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.execute("CREATE TABLE acct(id INT PRIMARY KEY, bal INT)")\ndb.executemany("INSERT INTO acct VALUES (?,?)", [(1, 100), (2, 0)]); db.commit()\n\ndef transfer(src, dst, amt):\n    with db:\n        db.execute("UPDATE acct SET bal = bal - ? WHERE id = ?", (amt, src))\n        if db.execute("SELECT bal FROM acct WHERE id = ?", (src,)).fetchone()[0] < 0:\n            raise ValueError("insufficient funds")   # triggers rollback\n        db.execute("UPDATE acct SET bal = bal + ? WHERE id = ?", (amt, dst))\n\ntransfer(1, 2, 40)\ntry:\n    transfer(1, 2, 500)\nexcept ValueError:\n    pass\nprint(db.execute("SELECT * FROM acct ORDER BY id").fetchall())   # [(1, 60), (2, 40)]' },
      check: 'assert db.execute("SELECT * FROM acct ORDER BY id").fetchall() == [(1, 60), (2, 40)]',
      see: ['#/cs']
    },
    {
      id: 'cs-db-deadlocks',
      title: 'Deadlocks in databases',
      q: ['database deadlock', 'how to avoid deadlocks in sql', 'mysql deadlock found when trying to get lock', 'how does a database detect deadlock', 'sql deadlock example'],
      tags: 'database deadlock row lock transaction wait for graph victim retry lock ordering select for update',
      a: 'Two transactions deadlock when each holds a row lock the other needs (T1 updates row A then B; T2 updates B then A). The database detects the cycle in its wait-for graph and aborts one transaction (the victim) with a deadlock error. Prevent them by updating rows in a consistent order, keeping transactions short, indexing so fewer rows are locked, and **retrying** the aborted transaction.',
      more: '- Your code must be ready to catch the deadlock/serialization error and retry.\n- Lock the rows you will need up front with `SELECT ... FOR UPDATE` in a fixed order.\n- Lower isolation levels and good indexes reduce the locks taken.',
      see: ['#/cs']
    },
    {
      id: 'cs-sql-injection',
      title: 'SQL injection and parameterised queries',
      q: ['what is sql injection', 'how to prevent sql injection', 'parameterized queries python', 'sqlite3 placeholders', 'is string formatting in sql safe', 'prepared statements'],
      tags: 'sql injection parameterized query prepared statement placeholder sqlite3 security escape orm',
      a: 'SQL injection happens when user input is pasted into the SQL text, so input like `\' OR \'1\'=\'1` changes the query\'s meaning. Prevent it with **parameterised queries** (placeholders `?` / `%s`): the SQL text and the values travel separately, so values are never parsed as SQL. Never build queries with f-strings or `+`.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.executescript("CREATE TABLE users(name TEXT, pw TEXT); INSERT INTO users VALUES (\'ann\', \'x1\'), (\'bob\', \'y2\');")\nevil = "nobody\' OR \'1\'=\'1"\n\nbad = db.execute(f"SELECT name FROM users WHERE name = \'{evil}\'").fetchall()\ngood = db.execute("SELECT name FROM users WHERE name = ?", (evil,)).fetchall()\nprint(bad)    # [(\'ann\',), (\'bob\',)]  <- injected, leaks every row\nprint(good)   # []' },
      check: 'assert len(bad) == 2 and good == []',
      more: '- Placeholders cannot parametrise table or column names; whitelist those.\n- ORMs parameterise for you, but raw-SQL escape hatches do not.\n- Also apply least-privilege database accounts.',
      see: ['#/cs']
    },
    {
      id: 'cs-replication',
      title: 'Database replication',
      q: ['what is database replication', 'leader follower replication', 'master slave replication', 'sync vs async replication', 'what is replication lag', 'read replicas'],
      tags: 'replication leader follower primary replica master slave synchronous asynchronous lag failover read replica',
      a: 'Replication copies data to several servers. In **leader-follower** replication all writes go to the leader, which streams its log to followers; reads can be served from followers to scale reads and survive failures. **Asynchronous** replication is fast but followers lag (stale reads, possible loss on failover); **synchronous** waits for followers (safer, slower).',
      more: '- Replication scales reads and availability, **not** write capacity (that needs sharding).\n- Read-your-own-writes: route a user\'s reads to the leader right after they write.\n- Failover needs leader election and avoiding split brain.\n- Multi-leader and leaderless (Dynamo-style) designs allow writes in many places but must resolve conflicts.',
      see: ['#/cs']
    },
    {
      id: 'cs-sharding',
      title: 'Database sharding (partitioning)',
      q: ['what is sharding', 'sharding vs partitioning', 'how to choose a shard key', 'horizontal vs vertical partitioning', 'hash sharding vs range sharding'],
      tags: 'sharding partitioning shard key horizontal scaling hash range hot spot resharding consistent hashing',
      a: 'Sharding splits one big table across several databases (shards), each holding a subset of rows chosen by a **shard key**, so writes and storage scale out. **Hash** sharding spreads load evenly; **range** sharding keeps ranges together for scans but risks hot spots. Costs: cross-shard joins and transactions are hard, and resharding is painful (consistent hashing helps).',
      more: '- Pick a key with high cardinality and even access (user id, not country).\n- Vertical partitioning splits columns/tables by feature instead of rows.\n- Try indexes, caching, and read replicas first; shard when one node cannot hold the writes.',
      see: ['#/cs']
    },
    {
      id: 'cs-nosql-types',
      title: 'Types of NoSQL databases',
      q: ['types of nosql databases', 'sql vs nosql', 'when to use mongodb vs postgres', 'key value vs document vs column family vs graph', 'what is nosql', 'redis vs mongodb'],
      tags: 'nosql key value document column family graph redis mongodb cassandra neo4j dynamodb sql vs nosql',
      a: 'Four main kinds: **key-value** (Redis, DynamoDB: fast lookup by key), **document** (MongoDB: JSON-like records with flexible schema), **wide-column** (Cassandra, HBase: huge write-heavy data partitioned by key), **graph** (Neo4j: relationships first). Choose SQL when you need joins, constraints and transactions; NoSQL when the access pattern is simple and scale or schema flexibility dominates.',
      more: '- "NoSQL" is about data model and scaling trade-offs, not "no consistency": many now offer transactions.\n- Design NoSQL schemas around the queries you will run, not around entities.\n- Many teams start with PostgreSQL, which also handles JSON.',
      see: ['#/cs']
    },
    {
      id: 'cs-primary-vs-foreign-key',
      title: 'Primary key vs foreign key',
      q: ['primary key vs foreign key', 'what is a foreign key', 'what is a primary key', 'unique key vs primary key', 'referential integrity', 'on delete cascade'],
      tags: 'primary key foreign key unique referential integrity cascade constraint relation candidate key',
      a: 'A **primary key** uniquely identifies each row: unique and never NULL, one per table. A **foreign key** is a column that references another table\'s key and forces the value to exist there (referential integrity), expressing a relationship. `ON DELETE CASCADE` deletes child rows with the parent; the default rejects deleting a referenced parent.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.execute("PRAGMA foreign_keys = ON")   # SQLite needs this per connection\ndb.executescript("""\nCREATE TABLE dept(id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE emp(id INTEGER PRIMARY KEY, dept_id INT REFERENCES dept(id));\nINSERT INTO dept VALUES (1, \'eng\');\n""")\ndb.execute("INSERT INTO emp VALUES (1, 1)")        # ok\ntry:\n    db.execute("INSERT INTO emp VALUES (2, 99)")   # no dept 99\nexcept sqlite3.IntegrityError as e:\n    print(e)   # FOREIGN KEY constraint failed' },
      check: 'assert db.execute("SELECT COUNT(*) FROM emp").fetchone()[0] == 1',
      more: 'A UNIQUE key also prevents duplicates but allows NULL (and you can have several). Index foreign key columns you join on.',
      see: ['#/cs']
    },
    {
      id: 'cs-union-vs-union-all',
      title: 'UNION vs UNION ALL',
      q: ['union vs union all', 'sql union example', 'difference between union and union all', 'combine two queries sql', 'intersect and except sql'],
      tags: 'sql union union all intersect except distinct duplicates combine result sets',
      a: '`UNION` stacks two result sets and **removes duplicate rows**; `UNION ALL` keeps every row and is faster because it skips the de-duplication step. Use `UNION ALL` unless you need distinct rows. Both queries need the same number of compatible columns. `INTERSECT` keeps rows in both; `EXCEPT` keeps rows only in the first.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\nq = lambda s: db.execute(s).fetchall()\nprint(q("SELECT 1 UNION SELECT 1 UNION SELECT 2"))        # [(1,), (2,)]\nprint(q("SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 2")) # [(1,), (1,), (2,)]\nprint(q("SELECT 1 UNION SELECT 2 EXCEPT SELECT 2"))        # [(1,)]' },
      check: 'assert q("SELECT 1 UNION SELECT 1") == [(1,)]\nassert len(q("SELECT 1 UNION ALL SELECT 1")) == 2',
      see: ['#/cs']
    },
    {
      id: 'cs-delete-truncate-drop',
      title: 'DELETE vs TRUNCATE vs DROP',
      q: ['delete vs truncate vs drop', 'difference between truncate and delete', 'can you rollback truncate', 'drop table vs delete from', 'truncate table sql'],
      tags: 'sql delete truncate drop table ddl dml rollback where identity reset',
      a: '`DELETE` (DML) removes the rows you select with `WHERE`, logs each row, fires triggers and can be rolled back. `TRUNCATE` (DDL) quickly removes **all** rows, usually resets auto-increment, has no `WHERE`, and in many engines is not row-logged. `DROP TABLE` removes the table itself (structure, indexes, data). Rollback support for TRUNCATE/DROP depends on the engine (PostgreSQL yes, MySQL/Oracle no).',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.executescript("CREATE TABLE t(v INT); INSERT INTO t VALUES (1),(2),(3);")\ndb.execute("DELETE FROM t WHERE v > 1")        # selective\nprint(db.execute("SELECT COUNT(*) FROM t").fetchone())   # (1,)\ndb.execute("DELETE FROM t")                    # SQLite has no TRUNCATE; this is its equivalent\ndb.execute("DROP TABLE t")                     # table is gone\nprint(db.execute("SELECT name FROM sqlite_master WHERE name=\'t\'").fetchall())   # []' },
      check: 'assert db.execute("SELECT name FROM sqlite_master WHERE name=\'t\'").fetchall() == []',
      see: ['#/cs']
    },
    {
      id: 'cs-sql-second-highest-duplicates',
      title: 'Classic SQL interview queries: second highest, duplicates',
      q: ['second highest salary sql', 'find duplicate rows sql', 'nth highest salary', 'delete duplicate rows sql', 'employees earning more than their manager'],
      tags: 'sql second highest salary duplicates nth highest limit offset group by having self join dense_rank interview',
      a: 'Second highest: `SELECT MAX(sal) FROM emp WHERE sal < (SELECT MAX(sal) FROM emp)`, or `DENSE_RANK()` for the Nth. Duplicates: `GROUP BY col HAVING COUNT(*) > 1`. Earning more than manager: self join `emp e JOIN emp m ON e.mgr = m.id WHERE e.sal > m.sal`.',
      code: { py: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.executescript("""\nCREATE TABLE emp(id INT, name TEXT, sal INT, mgr INT);\nINSERT INTO emp VALUES (1,\'ann\',300,NULL),(2,\'bob\',200,1),(3,\'cy\',200,1),(4,\'di\',350,1);\n""")\nq = lambda s: db.execute(s).fetchall()\nsecond = q("SELECT MAX(sal) FROM emp WHERE sal < (SELECT MAX(sal) FROM emp)")\ndups = q("SELECT sal, COUNT(*) FROM emp GROUP BY sal HAVING COUNT(*) > 1")\nrich = q("SELECT e.name FROM emp e JOIN emp m ON e.mgr = m.id WHERE e.sal > m.sal")\nprint(second, dups, rich)   # [(300,)] [(200, 2)] [(\'di\',)]' },
      check: 'assert second == [(300,)] and dups == [(200, 2)] and rich == [("di",)]',
      more: 'If there is no second value, the first query returns NULL (one row), which is usually what interviewers want.',
      see: ['#/cs']
    },
    {
      id: 'cs-cap-theorem',
      title: 'CAP theorem in one minute',
      q: ['what is the cap theorem', 'cap theorem explained', 'consistency vs availability', 'cp vs ap database', 'what is partition tolerance'],
      tags: 'cap theorem consistency availability partition tolerance cp ap pacelc distributed database',
      a: 'During a network **partition**, a distributed store must choose: stay **consistent** (refuse or delay some requests so everyone sees the latest write) or stay **available** (answer every request, possibly with stale data). You cannot have both, and partitions happen, so the real choice is CP vs AP. Without a partition you can have both; PACELC adds the latency vs consistency trade-off in normal operation.',
      more: '- CP examples: systems that use consensus for writes (etcd, ZooKeeper, HBase). AP: Dynamo-style stores like Cassandra (tunable).\n- "Consistency" in CAP means linearizability, not the C in ACID.\n- Pick per operation: money transfers want CP, a like-counter can be AP.',
      see: ['#/cs']
    },
    /* ---------- Misc ---------- */
    {
      id: 'cs-git-rebase-vs-merge',
      title: 'git rebase vs merge',
      q: ['git rebase vs merge', 'when to use rebase', 'what does git rebase do', 'merge commit vs fast forward', 'why not rebase shared branches', 'squash merge'],
      tags: 'git rebase merge fast-forward history linear squash conflict golden rule',
      a: '`git merge feature` joins histories with a **merge commit** (history is preserved exactly, a bit noisy). `git rebase main` replays your commits on top of main, giving a **linear history** but *rewriting* your commits (new hashes). Rule: rebase your own local/unpushed branch to tidy it; merge (or squash-merge) for shared branches, and never rebase commits others have pulled.',
      more: '- Update a feature branch: `git fetch && git rebase origin/main`.\n- After rebasing a pushed branch you need `git push --force-with-lease`.\n- Conflicts: merge resolves once; rebase may ask you per replayed commit.\n- `git rebase -i` lets you squash, reorder and edit commits.',
      see: ['#/cs']
    },
    {
      id: 'cs-git-reset-vs-revert',
      title: 'git reset vs revert (and checkout/restore)',
      q: ['git reset vs revert', 'how to undo a commit in git', 'git reset hard vs soft', 'undo last commit but keep changes', 'git revert example', 'git restore vs checkout'],
      tags: 'git reset revert soft mixed hard undo commit restore checkout reflog amend',
      a: '`git revert <commit>` adds a **new commit** that undoes an old one: safe for shared history. `git reset <commit>` **moves the branch pointer** back: `--soft` keeps changes staged, `--mixed` (default) keeps them unstaged, `--hard` discards them. Use revert on pushed commits and reset only on local, unpushed work.',
      more: '- Undo last commit, keep the work: `git reset --soft HEAD~1`.\n- Discard unstaged changes in a file: `git restore <file>`; unstage: `git restore --staged <file>`.\n- Lost something after a hard reset? `git reflog` shows where HEAD used to be.\n- Fix the last commit message or add a forgotten file: `git commit --amend`.',
      see: ['#/cs']
    },
    {
      id: 'cs-git-basics-commands',
      title: 'Everyday git commands and concepts',
      q: ['git basics for interviews', 'git fetch vs pull', 'git stash', 'git cherry pick', 'what is the staging area', 'git pull vs fetch'],
      tags: 'git fetch pull stash cherry-pick staging area index head branch commit clone remote',
      a: 'Flow: working tree, `git add` (staging area/index), `git commit` (local repo), `git push` (remote). `git fetch` downloads remote commits without changing your branch; `git pull` = fetch + merge (or rebase). `git stash` shelves uncommitted work; `git cherry-pick <hash>` copies one commit onto the current branch; `git switch -c name` makes a branch; `git log --oneline --graph` shows history.',
      more: '- A branch is just a movable pointer to a commit; HEAD points at the current branch.\n- `git diff` (unstaged), `git diff --staged`, `git status` are your daily checks.\n- `git bisect` binary-searches history for the commit that introduced a bug.',
      see: ['#/cs']
    },
    {
      id: 'cs-unix-commands',
      title: 'Unix commands interviewers ask: grep, awk, sed, ps, kill, chmod',
      q: ['grep awk sed difference', 'what does chmod 755 mean', 'how to kill a process in linux', 'ps aux meaning', 'common linux commands interview', 'find large files linux', 'what is a pipe in unix'],
      tags: 'unix linux grep awk sed ps kill chmod chown find xargs pipe top tail wc sort uniq cut',
      a: '`grep PATTERN file` finds matching lines; `sed \'s/old/new/g\'` edits streams; `awk \'{print $2}\'` processes columns. `ps aux` lists processes; `kill PID` sends SIGTERM (polite), `kill -9 PID` sends SIGKILL (cannot be caught). `chmod 755 f` sets rwx for owner and r-x for group and others. Pipe `|` feeds one command\'s output into the next.',
      code: { py: 'import stat\n\nprint(stat.filemode(0o755 | stat.S_IFREG))   # -rwxr-xr-x\nprint(stat.filemode(0o644 | stat.S_IFREG))   # -rw-r--r--\nprint(oct(0b111_101_101))                     # 0o755: r=4 w=2 x=1 per digit' },
      check: 'assert stat.filemode(0o755 | stat.S_IFREG) == "-rwxr-xr-x"\nassert oct(0b111101101) == "0o755"',
      more: '- Top words in a log: `sort file | uniq -c | sort -rn | head`.\n- `find . -name "*.py" | xargs grep TODO`; `tail -f log` follows a file; `wc -l` counts lines.\n- `cmd > out` redirects stdout, `2>&1` merges stderr, `>>` appends.\n- Each chmod digit = r(4) + w(2) + x(1) for owner, group, other.',
      see: ['#/cs']
    },
    {
      id: 'cs-endianness',
      title: 'Big-endian vs little-endian',
      q: ['big endian vs little endian', 'what is endianness', 'byte order python', 'int to bytes python', 'network byte order', 'what is the byte order of my machine'],
      tags: 'endianness big endian little endian byte order network order struct to_bytes from_bytes sys.byteorder',
      a: 'Endianness is the order a multi-byte number is stored in memory. **Big-endian** stores the most significant byte first (0x12345678 as 12 34 56 78); **little-endian** stores the least significant byte first (78 56 34 12), which x86 and ARM use. Network protocols use big-endian ("network byte order"), so convert when crossing the boundary.',
      code: { py: 'import sys, struct\n\nn = 0x12345678\nprint(n.to_bytes(4, "big").hex())      # 12345678\nprint(n.to_bytes(4, "little").hex())   # 78563412\nprint(int.from_bytes(bytes.fromhex("78563412"), "little") == n)   # True\nprint(struct.pack("!I", n).hex())      # ! = network order (big): 12345678\nprint(sys.byteorder)                   # \'little\' on x86/ARM' },
      check: 'assert n.to_bytes(4, "big").hex() == "12345678"\nassert n.to_bytes(4, "little").hex() == "78563412"\nassert struct.pack("!I", n) == n.to_bytes(4, "big")',
      see: ['#/cs']
    },
    {
      id: 'cs-floating-point-precision',
      title: 'Why 0.1 + 0.2 != 0.3',
      q: ['why is 0.1 + 0.2 not 0.3', 'floating point precision python', 'how are floats stored', 'compare floats python', 'ieee 754 explained', 'use decimal for money'],
      tags: 'floating point ieee 754 0.1 0.2 precision isclose decimal fraction rounding binary mantissa',
      a: 'Floats are stored in binary (IEEE 754: sign, exponent, mantissa), and 0.1 and 0.2 have no exact binary representation, like 1/3 in decimal. Each is stored slightly off, and the sum is 0.30000000000000004. Never compare floats with `==`: use `math.isclose`. For money use `decimal.Decimal` (or integer cents).',
      code: { py: 'import math\nfrom decimal import Decimal\nfrom fractions import Fraction\n\nprint(0.1 + 0.2)                        # 0.30000000000000004\nprint(0.1 + 0.2 == 0.3)                 # False\nprint(math.isclose(0.1 + 0.2, 0.3))     # True\nprint(Decimal("0.1") + Decimal("0.2"))  # 0.3\nprint(Fraction(1, 10) + Fraction(2, 10) == Fraction(3, 10))   # True\nprint(f"{0.1:.20f}")                    # 0.10000000000000000555' },
      check: 'assert 0.1 + 0.2 != 0.3\nassert math.isclose(0.1 + 0.2, 0.3)\nassert Decimal("0.1") + Decimal("0.2") == Decimal("0.3")',
      more: '- A 64-bit double has 53 bits of precision (about 15-16 decimal digits).\n- Integers are exact in Python (arbitrary size); floats lose exactness above 2**53.\n- Floating-point addition is not associative, so summing in a different order can change results (`math.fsum` is exact-ish).',
      see: ['#/cs']
    },
    {
      id: 'cs-hash-encrypt-encode',
      title: 'Hashing vs encryption vs encoding',
      q: ['hashing vs encryption vs encoding', 'is base64 encryption', 'difference between hashing and encryption', 'what is a hash function', 'sha256 python', 'what is a checksum'],
      tags: 'hash encryption encoding base64 sha256 md5 hmac checksum one way reversible hashlib',
      a: '**Encoding** (base64, URL, UTF-8) just changes representation, is reversible by anyone, and gives no secrecy. **Encryption** is reversible only with a key (confidentiality). **Hashing** is one-way: fixed-size digest, same input gives same output, cannot be reversed, used for integrity and fingerprints. Use **HMAC** for a keyed hash that proves integrity and authenticity.',
      code: { py: 'import base64, hashlib, hmac\n\nenc = base64.b64encode(b"hello")\nprint(enc, base64.b64decode(enc))                 # reversible, no key\nh = hashlib.sha256(b"hello").hexdigest()\nprint(h[:16], len(h))                              # 2cf24dba5fb0a30e 64\ntag = hmac.new(b"key", b"hello", hashlib.sha256).hexdigest()\nprint(tag != h)                                    # keyed: differs from plain hash' },
      check: 'assert base64.b64decode(enc) == b"hello"\nassert h.startswith("2cf24dba5fb0a30e") and len(h) == 64\nassert hashlib.sha256(b"hello").hexdigest() == h',
      more: 'MD5 and SHA-1 are broken for security (collisions); use SHA-256 or better. Plain fast hashes are the wrong tool for passwords (see the password entry).',
      see: ['#/cs']
    },
    {
      id: 'cs-symmetric-vs-asymmetric',
      title: 'Symmetric vs asymmetric cryptography',
      q: ['symmetric vs asymmetric encryption', 'how does public key cryptography work', 'what is rsa', 'what is a digital signature', 'aes vs rsa', 'public key vs private key'],
      tags: 'symmetric asymmetric aes rsa public key private key digital signature diffie hellman key exchange ecdsa',
      a: '**Symmetric** (AES, ChaCha20): one shared secret key encrypts and decrypts; very fast, but both sides must share the key safely. **Asymmetric** (RSA, ECC): a key pair; encrypt with the public key and only the private key decrypts, or **sign** with the private key and anyone verifies with the public key; slower. Real systems combine them: asymmetric to agree on a key, symmetric for the data (TLS).',
      more: '- Digital signature = hash of the message signed with the private key; proves who sent it and that it was not changed.\n- Key exchange (Diffie-Hellman) lets two parties derive a shared secret over a public channel.\n- Never invent your own crypto; use vetted libraries and modes (AES-GCM).',
      see: ['#/cs']
    },
    {
      id: 'cs-password-hashing',
      title: 'How to store passwords (salt, bcrypt, argon2)',
      q: ['how to hash passwords', 'what is a salt in hashing', 'bcrypt vs argon2', 'why not store passwords with sha256', 'password hashing python', 'what is a rainbow table'],
      tags: 'password hashing salt bcrypt argon2 scrypt pbkdf2 rainbow table slow hash stretching pepper',
      a: 'Store only a **slow, salted hash**, never the password. A **salt** is a random per-user value mixed in so identical passwords hash differently and rainbow tables fail. Use a deliberately slow, memory-hard function: **argon2**, **bcrypt** or **scrypt** (PBKDF2 acceptable), not plain SHA-256 which attackers compute billions of times per second. Compare with a constant-time check.',
      code: { py: 'import hashlib, hmac, os\n\ndef hash_pw(pw, salt=None):\n    salt = salt or os.urandom(16)\n    key = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1)\n    return salt, key\n\ndef check_pw(pw, salt, key):\n    return hmac.compare_digest(hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1), key)\n\nsalt, key = hash_pw("hunter2")\nprint(check_pw("hunter2", salt, key), check_pw("wrong", salt, key))   # True False\nprint(hash_pw("hunter2")[1] != key)   # new salt -> different hash' },
      check: 'assert check_pw("hunter2", salt, key) and not check_pw("wrong", salt, key)\nassert hash_pw("hunter2")[1] != key',
      more: 'In production use a maintained library (`argon2-cffi`, `bcrypt`) which stores salt and cost parameters in one string. Raise the cost over time.',
      see: ['#/cs']
    },
    {
      id: 'cs-unicode-utf8',
      title: 'Unicode and UTF-8',
      q: ['what is utf-8', 'unicode vs utf-8', 'python str vs bytes', 'why does len of a string differ from bytes', 'encode decode python', 'what is a code point', 'ascii vs unicode'],
      tags: 'unicode utf-8 utf8 ascii code point encode decode bytes str emoji grapheme surrogate',
      a: '**Unicode** assigns every character a number (code point, e.g. U+1F600). **UTF-8** is an encoding that stores a code point in 1 to 4 bytes (ASCII stays 1 byte) and is the web default. In Python a `str` is a sequence of code points and `bytes` is raw data: `s.encode("utf-8")` converts one way, `b.decode("utf-8")` the other. Always encode/decode explicitly at I/O boundaries.',
      code: { py: 'for s in ["a", "e\\u0301", "\\u00e9", "\\u4e2d", "\\U0001F600"]:\n    print(ascii(s), len(s), len(s.encode("utf-8")))\n# \'a\' 1 1 | combining e 2 3 | \'\\u00e9\' 1 2 | CJK 1 3 | emoji 1 4\n\nimport unicodedata\nprint(unicodedata.normalize("NFC", "e\\u0301") == "\\u00e9")   # True' },
      check: 'import unicodedata\nassert len("\\U0001F600".encode("utf-8")) == 4\nassert len("\\u00e9") == 1 and len("e\\u0301") == 2\nassert unicodedata.normalize("NFC", "e\\u0301") == "\\u00e9"\nassert b"\\xc3\\xa9".decode("utf-8") == "\\u00e9"',
      more: '- `len(str)` counts code points, not bytes and not what users see as characters.\n- The same visible character can have several encodings; normalize (NFC) before comparing.\n- Decoding with the wrong encoding gives mojibake or `UnicodeDecodeError`.',
      see: ['#/cs']
    },
    {
      id: 'cs-browser-rendering',
      title: 'How a browser renders a page (critical rendering path)',
      q: ['critical rendering path', 'dom vs cssom vs render tree', 'reflow vs repaint', 'async vs defer script', 'why is my page render blocked', 'how does a browser turn html into pixels'],
      tags: 'browser render dom cssom render tree layout paint reflow repaint async defer critical rendering path compositing',
      a: 'The browser parses HTML into the **DOM** and CSS into the **CSSOM**, combines them into a **render tree** (visible nodes with styles), runs **layout** (sizes and positions), **paint** (draw pixels), then **composites** layers. CSS blocks rendering; a plain `<script>` blocks HTML parsing. Use `defer` (run after parsing, in order) or `async` (run as soon as downloaded) to avoid blocking.',
      more: '- **Reflow** (layout) is costly: changing size/position re-runs layout. **Repaint** only redraws.\n- `transform` and `opacity` changes can be composited on the GPU without layout.\n- Batch DOM reads and writes to avoid layout thrashing.\n- Preload critical assets; lazy-load images below the fold.',
      see: ['#/cs']
    },
    {
      id: 'cs-cache-http-caching',
      title: 'HTTP caching: Cache-Control, ETag, 304',
      q: ['http caching headers', 'cache-control max-age', 'what is an etag', 'how does browser caching work', '304 not modified', 'cdn caching'],
      tags: 'http cache cache-control max-age etag if-none-match 304 not modified cdn no-store immutable',
      a: '`Cache-Control: max-age=3600` lets the browser reuse a response for an hour without asking. After it expires the browser revalidates with `If-None-Match: <ETag>` and the server answers **304 Not Modified** (no body) if unchanged. `no-store` forbids caching, `no-cache` means "revalidate first", `private` vs `public` says whether shared caches (CDNs) may store it.',
      more: '- Cache-bust static assets by putting a content hash in the file name (`app.3f9a1c.js`) and serving them `immutable` with a long max-age.\n- HTML is usually short-lived or revalidated.\n- `Vary` tells caches which request headers change the response.',
      see: ['#/cs']
    },
    {
      id: 'cs-concurrency-vs-parallelism',
      title: 'Concurrency vs parallelism',
      q: ['concurrency vs parallelism', 'difference between concurrent and parallel', 'what is concurrency', 'is asyncio parallel', 'synchronous vs asynchronous', 'blocking vs non blocking'],
      tags: 'concurrency parallelism asynchronous synchronous blocking non-blocking cores event loop multitasking',
      a: '**Concurrency** is managing many tasks whose lifetimes overlap (structure: they take turns, possibly on one core). **Parallelism** is running tasks literally at the same instant on several cores (execution). Concurrency is about dealing with lots of things at once; parallelism is about doing lots of things at once. asyncio and Python threads are concurrent; multiprocessing is parallel.',
      more: '- **Blocking** call: the thread waits. **Non-blocking/async**: it returns immediately and you are notified later.\n- Concurrent design can run on one core (an event loop) and speed up I/O-bound work.\n- Parallelism speeds up CPU-bound work.',
      see: ['#/cs']
    },
    {
      id: 'cs-memory-leak-gc',
      title: 'Memory leak vs memory fragmentation vs garbage collection',
      q: ['what is a memory leak', 'how does garbage collection work', 'reference counting vs tracing gc', 'python garbage collector', 'memory leak in python', 'what is memory fragmentation'],
      tags: 'memory leak garbage collection gc reference counting tracing cycle fragmentation python weakref',
      a: 'A **memory leak** is memory kept alive that the program will never use again. Garbage collectors free unreachable objects: **reference counting** (CPython) frees an object the moment its count hits 0 but cannot free reference **cycles**, so CPython also runs a cyclic GC; **tracing** GCs (Java, Go) mark everything reachable from roots. Leaks in GC languages are usually forgotten references (caches, globals, listeners).',
      code: { py: 'import gc, weakref\n\nclass Node:\n    pass\n\na, b = Node(), Node()\na.other, b.other = b, a          # reference cycle\nref = weakref.ref(a)\ndel a, b                          # counts never reach 0 ...\nprint(ref() is not None)          # True: still alive\ngc.collect()                      # ... the cycle collector frees them\nprint(ref() is None)              # True' },
      check: 'gc.collect()\nassert ref() is None',
      more: 'Fragmentation: free memory exists but only in small scattered pieces, so a big allocation fails. Fix leaks with a profiler (`tracemalloc` in Python), bounded caches (`lru_cache(maxsize=...)`) and weak references.',
      see: ['#/cs']
    },
    {
      id: 'cs-twos-complement',
      title: 'Two\'s complement: how negative numbers are stored',
      q: ['what is twos complement', 'how are negative numbers stored', 'signed vs unsigned integers', 'integer overflow', 'why does int range go from -128 to 127'],
      tags: 'twos complement signed unsigned integer overflow negative bits int8 sign bit wraparound',
      a: 'Two\'s complement stores a negative number as the bit pattern of 2^n minus its magnitude: invert the bits and add 1. With n bits the range is -2^(n-1) to 2^(n-1)-1 (8 bits: -128 to 127), the top bit is the sign, and the same hardware adds signed and unsigned numbers. Overflow wraps around in C/Java; Python integers never overflow.',
      code: { py: 'def to_bits(x, n=8):\n    return format(x & ((1 << n) - 1), f"0{n}b")\n\nprint(to_bits(5), to_bits(-5))     # 00000101 11111011\nprint((~5 + 1) == -5)              # True: invert and add one\n\ndef wrap8(x):                      # simulate an int8 overflow\n    return (x + 128) % 256 - 128\nprint(wrap8(127 + 1))              # -128' },
      check: 'assert to_bits(-5) == "11111011"\nassert to_bits(-1) == "11111111"\nassert wrap8(127 + 1) == -128 and wrap8(-129) == 127',
      see: ['#/cs']
    }
  );
})();
