/* Offer Ready: CS fundamentals, track. Generated from lesson text; edit freely. */
OR.cs = OR.cs || [];
OR.cs.push({
  id: "os",
  order: 1,
  title: "Operating systems",
  blurb: "Processes and threads, scheduling, memory and paging, deadlocks, syscalls and IPC.",
  minutes: 40,
  sections: [
    {
      id: "proc-thread",
      title: "Processes versus threads",
      body: `
A **process** is a running program with its own virtual address space, open file table and credentials. A **thread** is a unit of execution inside a process: it has its own stack, registers and program counter, but shares the process's heap, globals, code and open files.

| | Process | Thread |
|---|---|---|
| Address space | Private | Shared with sibling threads |
| Creation cost | Higher (new address space, tables) | Lower |
| Communication | IPC (pipes, sockets, shared memory) | Plain memory, so you need locks |
| A crash | Usually contained to that process | Can take down every thread in the process |
| Switch cost | Higher (address space change, TLB effects) | Lower (same address space) |

The interview answer is the trade-off: threads are cheap and share data easily, which is exactly why they cause **races**; processes isolate faults and memory, at the price of explicit communication.

- A **kernel thread** is scheduled by the OS. A **user-level thread** (or green thread, goroutine, coroutine) is scheduled by a runtime on top of kernel threads. Many-to-many models are common today.
- \`fork()\` on Unix clones the calling process (copy-on-write pages make this cheap); \`exec()\` replaces its program image. Windows has \`CreateProcess\` instead.
- A **zombie** is a child that has exited but whose parent has not yet called \`wait()\` to collect its status. An **orphan** is a child whose parent died; \`init\` (PID 1) adopts it.
`
    },
    {
      id: "ctx-switch",
      title: "Context switch",
      body: `
A **context switch** saves the running thread's CPU state (registers, program counter, stack pointer) into its control block and loads another's. The OS does this when a timer interrupt ends a time slice, when a thread blocks on I/O or a lock, or when a higher-priority thread becomes runnable.

Direct cost: saving and restoring state, plus scheduler bookkeeping, typically on the order of microseconds. The bigger cost is often **indirect**: the next thread finds cold CPU caches, and a switch between *processes* also changes the address space, which on many CPUs flushes or partially invalidates the **TLB** (tagged TLBs with address-space IDs soften this).

Why it matters in interviews:

- Thousands of runnable threads mean lots of switching overhead; that is a reason for thread pools and event loops.
- A thread-per-connection server hits memory (each stack reserves space, typically 1 to 8 MB of virtual address space by default, depending on language and platform) and scheduling limits long before an event-driven one.
- A switch is not a **mode switch**: a system call moves one thread from user to kernel mode without necessarily changing which thread runs.
`
    },
    {
      id: "scheduling",
      title: "CPU scheduling",
      body: `
The scheduler picks which ready thread runs next. Goals conflict: throughput, low **turnaround** time, low **response** time, fairness, and not starving anyone.

- **FCFS**: run in arrival order. Simple, but a long job delays everyone behind it (the convoy effect).
- **SJF** (shortest job first): provably minimizes average waiting time when all jobs are known, but needs burst-length predictions (usually an exponential average of past bursts) and can starve long jobs. The preemptive version is **SRTF**.
- **Round robin**: each thread gets a time **quantum**, then goes to the back of the queue. Good response time; the quantum is the tuning knob. Too large degenerates into FCFS, too small wastes time on context switches.
- **Priority scheduling**: highest priority first; fix starvation with **aging** (raise priority as a thread waits). **Priority inversion** (a high-priority thread waits on a lock held by a low-priority one that a medium-priority thread keeps preempting) is fixed by priority inheritance.
- **MLFQ** (multi-level feedback queue): several queues with different priorities. New jobs start at the top; a job that uses its whole quantum is demoted, one that blocks for I/O stays high, and a periodic **priority boost** moves everything back up to prevent starvation. It approximates SJF without knowing burst lengths: short and interactive jobs finish at high priority.

Worked example, four processes (arrival, burst): P1 (0, 7), P2 (2, 4), P3 (4, 1), P4 (5, 4).

| Algorithm | Waiting P1, P2, P3, P4 | Average wait |
|---|---|---|
| FCFS | 0, 5, 7, 7 | 4.75 |
| SJF (non-preemptive) | 0, 6, 3, 7 | 4.00 |
| Round robin, quantum 2 | 9, 3, 2, 6 | 5.00 |

Waiting time is turnaround time (finish minus arrival) minus burst. For round robin the numbers depend on a convention: here a newly arrived process enters the queue ahead of the process that was just preempted. A different tie convention can change the table, so state yours in an interview. The code below checks the round robin row.
`,
      code: [
        {
          title: "Round robin simulator",
          code: {
            py: `from collections import deque

def round_robin(procs, quantum):
    """procs: {name: (arrival, burst)}. Returns each process's waiting time."""
    rem = {n: b for n, (a, b) in procs.items()}
    order = sorted(procs, key=lambda n: procs[n][0])
    queue, finish, t, i = deque(), {}, 0, 0

    def admit(now):                                    # arrivals join the queue before a preempted process
        nonlocal i
        while i < len(order) and procs[order[i]][0] <= now:
            queue.append(order[i]); i += 1

    admit(0)
    while queue or i < len(order):
        if not queue:                                  # CPU idle until the next arrival
            t = procs[order[i]][0]; admit(t)
        n = queue.popleft()
        run = min(quantum, rem[n])
        t += run; rem[n] -= run
        admit(t)
        if rem[n]: queue.append(n)                     # back of the line
        else: finish[n] = t
    return {n: finish[n] - a - b for n, (a, b) in procs.items()}

procs = {"P1": (0, 7), "P2": (2, 4), "P3": (4, 1), "P4": (5, 4)}
waits = round_robin(procs, quantum=2)
print(waits, sum(waits.values()) / len(waits))   # {'P1': 9, 'P2': 3, 'P3': 2, 'P4': 6} 5.0
assert waits == {"P1": 9, "P2": 3, "P3": 2, "P4": 6}`
          }
        }
      ]
    },
    {
      id: "memory",
      title: "Memory: stack versus heap",
      body: `
Each process sees a virtual layout, roughly from low to high addresses: code (text), initialized data, uninitialized data (BSS), the **heap** growing up, and the **stack** growing down.

| | Stack | Heap |
|---|---|---|
| Holds | Call frames: locals, return addresses, saved registers | Dynamically allocated objects |
| Lifetime | Automatic, ends when the function returns | Until freed (or garbage collected) |
| Allocation | Move a pointer: extremely fast | Allocator searches free lists: slower, can fragment |
| Per thread? | One per thread | Shared by all threads |
| Failure | **Stack overflow** (deep or unbounded recursion, huge locals) | Out of memory, leaks, fragmentation, use-after-free in unmanaged languages |

Details people get wrong:

- In Java and Python the objects live on the heap; local *references* live on the stack. C++ can put whole objects on the stack.
- Heap allocation is not a "system call per object". \`malloc\` carves from memory it obtained in bulk (via \`brk\` or \`mmap\`).
- Stack locality is excellent (hot cache lines); that is one reason stack allocation is fast.
- Garbage collection (Java, Go, JS, Python's cycle collector) reclaims unreachable heap objects; reference counting alone cannot free cycles.
`
    },
    {
      id: "vmem",
      title: "Virtual memory, paging, TLB, page faults",
      body: `
**Virtual memory** gives every process its own address space, mapped by the OS and the MMU onto physical RAM (and disk). It provides isolation, lets programs be larger than RAM, allows sharing (shared libraries, copy-on-write), and lets the OS place pages anywhere.

**Paging.** Memory is split into fixed-size **pages** (commonly 4 KiB) in virtual space and **frames** in physical memory. A virtual address is a **page number** plus an **offset**. The **page table** maps page number to frame number plus flags (present, writable, user, dirty, accessed). Fixed-size units eliminate external fragmentation; the cost is some internal fragmentation in the last page of an allocation.

Worked example: 32-bit addresses, 4 KiB pages. The offset is 12 bits, the page number is the remaining 20 bits, so a flat page table has 2^20 (about a million) entries. That is why real systems use **multi-level page tables** (x86-64 uses four or five levels): unused regions need no table at all.

**TLB.** Translating every access with a page table walk would multiply memory accesses. The **translation lookaside buffer** is a small, fast cache of recent page-to-frame translations. A hit costs about a cache access; a miss triggers a walk (done by hardware on x86, sometimes by software on other architectures). Effective access time is roughly \`hit_rate * t_tlb + (1 - hit_rate) * (t_tlb + walk)\`.

**Page fault.** The CPU raises it when a page is not mapped or not allowed. The OS then does one of:

1. **Minor fault**: the page is already in memory (or is zero-fill or copy-on-write); just fix the mapping.
2. **Major fault**: the page must be read from disk. The thread blocks and another runs.
3. **Invalid access**: a segmentation fault; the process usually gets a signal and dies.

**Page replacement** picks a victim when no frame is free: FIFO (can show Belady's anomaly: more frames, more faults), **LRU** (good but costly to track exactly), and **clock** (second chance), an approximation of LRU using the accessed bit.

**Thrashing.** If the combined working sets of running processes exceed physical memory, pages are evicted just before they are needed again. Page faults dominate, the CPU idles waiting for disk, and throughput collapses. Fixes: fewer concurrent processes, more RAM, or working-set based admission control. Adding more processes in response to low CPU use makes it worse.
`
    },
    {
      id: "deadlock",
      title: "Deadlock: conditions, avoidance, detection",
      body: `
A set of threads is **deadlocked** when each waits for a resource held by another in the set, so none can proceed.

**The four Coffman conditions** (all must hold):

1. **Mutual exclusion**: a resource can be held by only one thread at a time.
2. **Hold and wait**: a thread holds a resource while waiting for another.
3. **No preemption**: resources cannot be forcibly taken away.
4. **Circular wait**: a cycle of threads, each waiting on the next.

**Prevention** breaks one condition permanently. The practical one is circular wait: impose a **global lock order** and always acquire in that order. Others: acquire everything at once (breaks hold and wait, but hurts concurrency), or use \`tryLock\` with timeout and back off (allows preemption-like behavior).

**Avoidance** grants a request only if the system stays in a **safe state**, where some order exists in which every process can finish. The **banker's algorithm** keeps, per process, the maximum claim, current allocation and need; it grants a request only if, after granting, a safe sequence still exists. It needs advance knowledge of maximum demands, so it is rare in real systems.

Tiny banker's example: 12 units of one resource; P1 holds 5 and may need up to 10, P2 holds 2 and may need up to 4, P3 holds 2 and may need up to 9. Free = 12 - 9 = 3. P2 needs 2 more, so it can finish; then free = 5 and P1 (needs 5) can finish; free = 10, and P3 (needs 7) can finish. Safe sequence: P2, P1, P3. If P3 were granted one more unit first (free = 2), P2 could still finish, but then free = 4 and neither P1 (needs 5) nor P3 (needs 6) can finish: no safe sequence, so that grant must be refused.

**Detection and recovery** let deadlock happen, then look for it: build a **wait-for graph** (an edge from each waiting thread to the thread it waits on); a **cycle** means deadlock (for single-instance resources). Recover by killing a participant, rolling back, or preempting a resource. Databases do exactly this: they detect cycles among transactions and abort a victim.

**The ostrich approach** (ignore it) is what most general-purpose operating systems do for application-level locks: deadlocks are rare and prevention is costly, so the burden falls on programmers via lock ordering.

Related but different: **livelock** (threads keep reacting to each other and make no progress) and **starvation** (one thread never gets the resource). More on those in the Concurrency track.
`
    },
    {
      id: "syscalls",
      title: "System calls and kernel mode",
      body: `
User code runs in **user mode** and cannot touch hardware or other processes' memory directly. To ask the kernel for something (read a file, create a thread, allocate pages, send a packet) it makes a **system call**: it puts the call number and arguments in registers, executes a trap instruction (\`syscall\` or \`int\`), the CPU switches to **kernel mode** at a fixed entry point, the kernel validates arguments, does the work, and returns.

- The kernel must **validate** every pointer and argument: user input is untrusted.
- A syscall is far more expensive than a function call (a mode switch plus effects on caches and speculation mitigations), so libraries **batch and buffer**: \`printf\` and \`fwrite\` collect data and call \`write\` once. This is also why \`fsync\` matters for durability: a \`write\` only reaches the OS page cache.
- Familiar ones: \`open\`, \`read\`, \`write\`, \`close\`, \`fork\`, \`execve\`, \`wait\`, \`mmap\`, \`brk\`, \`pipe\`, \`socket\`, \`epoll_wait\`.
- **Interrupts** come from hardware (timer, disk, NIC); **exceptions** come from the running instruction (page fault, divide by zero); a syscall is a deliberate software-triggered trap. All three enter the kernel through the same kind of mechanism.
- \`read\` on a socket or file can **block** the thread. Non-blocking I/O plus \`select\`/\`poll\`/\`epoll\` lets one thread watch many descriptors, which is the basis of event loops.
`
    },
    {
      id: "ipc",
      title: "Inter-process communication",
      body: `
Processes do not share memory by default, so the OS offers channels:

| Mechanism | Idea | Notes |
|---|---|---|
| **Pipe** | One-way byte stream between related processes | Kernel buffer; writer blocks if full, reader blocks if empty |
| **Named pipe (FIFO)** | A pipe with a filesystem name | Unrelated processes can connect |
| **Message queue** | Discrete messages, often prioritized | Message boundaries preserved |
| **Shared memory** | Map the same physical pages into several processes | Fastest, but you must synchronize yourself |
| **Socket** | Two-way; local (Unix domain) or across machines (TCP/UDP) | The general answer; also works over a network |
| **Signal** | Small asynchronous notification (\`SIGTERM\`, \`SIGINT\`) | Carries almost no data |
| **Files** | Write, then read | Simple, slow, needs locking |

Choosing: shared memory for throughput, sockets or message passing for simplicity and for crossing machines. Message passing avoids shared mutable state, which is why it is easier to reason about (the idea behind Go channels and actors).

The sample passes a message from a child process; the data is serialized through a pipe, not shared.
`,
      code: [
        {
          title: "Message passing between processes",
          code: {
            py: `from multiprocessing import Process, Queue

def child(q):
    q.put("hello from pid-separate memory")     # data is serialized (pickled) through a pipe

if __name__ == "__main__":                       # required where processes are spawned, e.g. Windows and macOS
    q = Queue()
    p = Process(target=child, args=(q,))
    p.start()
    print(q.get())                               # blocks until the child sends
    p.join()`
          }
        }
      ]
    }
  ],
  quiz: [
    {
      kind: "concept",
      q: "Two threads of the same process run on different cores. Which of these do they **share**?",
      choices: [
        "Their stacks",
        "Their heap and global variables",
        "Their register contents",
        "Their program counters"
      ],
      answer: 1,
      explain: "Threads share the heap, globals, code and open files. Each has its own stack, registers and program counter."
    },
    {
      kind: "concept",
      q: "What is the main reason a context switch between two *processes* is costlier than between two threads of one process?",
      choices: [
        "Processes have more threads",
        "The address space changes, which affects the TLB and caches",
        "Threads never save registers",
        "The kernel is not involved for threads"
      ],
      answer: 1,
      explain: "Both switches save and restore registers. A process switch also changes the page tables, which can flush or partly invalidate the TLB and leaves caches cold."
    },
    {
      kind: "concept",
      q: "Which approach to the round robin quantum best serves interactive jobs without wasting the CPU?",
      choices: [
        "Make the quantum much larger",
        "Use FCFS",
        "Keep the quantum small enough that every job gets the CPU soon, but not so small that switching dominates",
        "Always run the longest job first"
      ],
      answer: 2,
      explain: "A huge quantum turns round robin into FCFS. A tiny one wastes time switching. The art is in between."
    },
    {
      kind: "concept",
      q: "In MLFQ, why is there a periodic priority boost?",
      choices: [
        "To make long jobs run faster",
        "To prevent starvation of low-priority jobs and to let a job that became interactive recover",
        "To reduce context switches",
        "To implement SJF exactly"
      ],
      answer: 1,
      explain: "Without a boost, a stream of short jobs could starve long ones forever, and a job that turns interactive after a long compute phase would stay stuck at low priority."
    },
    {
      kind: "concept",
      q: "Which statement about the **stack and heap** is correct?",
      choices: [
        "The heap is per thread, the stack is shared",
        "Stack allocation is typically a pointer adjustment, heap allocation involves an allocator",
        "Every object in C++ is on the heap",
        "Stack memory must be freed manually"
      ],
      answer: 1,
      explain: "Each thread has its own stack, the heap is shared. Stack allocation is just moving the stack pointer; heap allocation needs an allocator and cleanup (manual or by a garbage collector). C++ can create objects on the stack."
    },
    {
      kind: "concept",
      q: "A system with 4 KiB pages and 32-bit virtual addresses. How many bits are the page number?",
      choices: ["10", "12", "20", "32"],
      answer: 2,
      explain: "4 KiB = 2^12, so the offset is 12 bits and the page number is 32 - 12 = 20 bits (about a million pages)."
    },
    {
      kind: "concept",
      q: "CPU utilization is low, disk activity is very high, and the OS responds by starting more processes. What is likely happening, and is that response wise?",
      choices: ["Healthy load; yes", "Thrashing; no, it makes it worse", "A deadlock; yes", "Memory leak; yes"],
      answer: 1,
      explain: "Low CPU with heavy paging is the signature of thrashing. More processes mean smaller working sets in memory per process and even more page faults. Reduce concurrency instead."
    },
    {
      kind: "concept",
      q: "Pick **all** Coffman conditions that must hold for a deadlock.",
      choices: ["Mutual exclusion", "Circular wait", "Preemption", "Hold and wait", "No preemption"],
      answer: [0, 1, 3, 4],
      explain: "The four conditions are mutual exclusion, hold and wait, no preemption and circular wait. Preemption being *possible* breaks a condition."
    },
    {
      kind: "concept",
      q: "A global lock acquisition order is a deadlock **prevention** technique because it removes which condition?",
      choices: ["Mutual exclusion", "Hold and wait", "No preemption", "Circular wait"],
      answer: 3,
      explain: "If every thread takes locks in the same global order, a cycle in the wait-for graph is impossible."
    }
  ],
  cards: [
    {
      id: "proc-vs-thread",
      front: "Process vs thread, in one breath?",
      back: "A process has its own address space; threads inside a process share heap and globals but have their own stack and registers. Threads are cheaper but need synchronization; processes isolate faults."
    },
    {
      id: "ctx-switch",
      front: "What does a context switch cost, directly and indirectly?",
      back: "Directly: save and restore registers and scheduler bookkeeping. Indirectly: cold caches and, across processes, TLB effects from changing the address space."
    },
    {
      id: "rr-quantum",
      front: "Round robin: what happens as the quantum goes to infinity, and to zero?",
      back: "Infinity: it becomes FCFS. Zero: nearly all time is spent context switching. Pick it larger than a typical interactive burst but small enough for responsiveness."
    },
    {
      id: "mlfq",
      front: "How does MLFQ work, and why is it clever?",
      back: "Several priority queues. Jobs start high, drop a level when they use a full quantum, stay high if they block on I/O, and a periodic boost prevents starvation. It approximates shortest-job-first without knowing burst lengths."
    },
    {
      id: "stack-heap",
      front: "Stack vs heap?",
      back: "Stack: per-thread call frames, automatic lifetime, pointer-bump fast. Heap: shared, dynamic lifetime, allocator or GC, can fragment or leak."
    },
    {
      id: "paging",
      front: "How does paging translate an address?",
      back: "Split the virtual address into page number and offset. The page table maps the page number to a frame; the offset is unchanged. The TLB caches recent translations."
    },
    {
      id: "page-fault",
      front: "What are the three outcomes of a page fault?",
      back: "Minor (page in memory, fix mapping), major (read from disk, the thread blocks), invalid (segmentation fault, signal)."
    },
    {
      id: "thrashing",
      front: "What is thrashing, and the fix?",
      back: "Combined working sets exceed RAM so pages are evicted just before reuse; paging dominates and throughput collapses. Reduce multiprogramming, add RAM, or use working-set admission control."
    },
    {
      id: "coffman",
      front: "The four conditions for deadlock?",
      back: "Mutual exclusion, hold and wait, no preemption, circular wait. Break any one to prevent it; in practice, impose a global lock order."
    },
    {
      id: "banker",
      front: "What is a safe state in the banker's algorithm?",
      back: "A state where some order of finishing exists in which every process can obtain its remaining maximum need. Grant a request only if the state after granting stays safe."
    },
    {
      id: "syscall",
      front: "What happens on a system call?",
      back: "A trap switches the CPU to kernel mode at a fixed entry point; the kernel validates arguments, does the work, then returns to user mode. Costlier than a function call, so libraries buffer."
    },
    {
      id: "ipc-choose",
      front: "Which IPC mechanism for which job?",
      back: "Shared memory for raw throughput (needs your own locking), pipes for simple one-way streams, sockets for general two-way and cross-machine, signals for tiny notifications."
    },
    {
      id: "zombie",
      front: "Zombie vs orphan process?",
      back: "Zombie: exited, but the parent has not called wait() to collect its status. Orphan: the parent died first; init adopts it."
    },
    {
      id: "tlb",
      front: "Why does the TLB exist?",
      back: "Without it every memory access would need extra accesses to walk the page table. The TLB caches translations so most accesses pay almost nothing extra."
    }
  ]
});
