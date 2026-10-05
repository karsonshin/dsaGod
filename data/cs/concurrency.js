/* Offer Ready: CS fundamentals, track. Code samples were compiled and run before being pasted here. */
OR.cs = OR.cs || [];
OR.cs.push({
  id: "concurrency",
  order: 2,
  title: "Concurrency",
  blurb: "Races, locks, condition variables, memory visibility, the classic problems with runnable code, pools, and async versus threads.",
  minutes: 60,
  sections: [
    {
      id: "races",
      title: "Race conditions and critical sections",
      body: `
A **race condition** is a bug where the result depends on the timing of operations on shared mutable state. The classic case is a **lost update**: \`count += 1\` is really three steps (read, add, write). Two threads can both read 5, both write 6, and one increment vanishes.

A **data race** is the precise, language-level version: two threads access the same memory location, at least one writes, and nothing orders them (no lock, atomic or other synchronization). In C++ a data race is undefined behavior; in Java the memory model limits what you may observe, but the result is still not what you meant.

The fix is to make the read-modify-write one indivisible step:

- a **mutex** around the **critical section**, or
- an **atomic** operation (hardware compare-and-swap, fetch-and-add), or
- no sharing at all (confinement to one thread, immutability, message passing).

Keep critical sections short, and guard *the invariant*, not the individual variable: if \`a\` and \`b\` must change together, one lock covers both.

Python note: in CPython the GIL serializes bytecode, but \`count += 1\` still spans several bytecodes, so the race is real; it is just rarer to observe (and free-threaded builds make it more visible). Do not rely on it. Never assume that "it passed when I ran it" proves the absence of a race: they are timing dependent.
`,
      code: [
        {
          title: "Counter: Python with a lock",
          code: {
            py: `import threading

count = 0
lock = threading.Lock()

def work(n):
    global count
    for _ in range(n):
        with lock:          # the read-modify-write is now one critical section
            count += 1

threads = [threading.Thread(target=work, args=(100_000,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(count)  # always 400000
assert count == 400_000`
          }
        },
        {
          title: "Counter: unsafe, atomic and synchronized in Java",
          code: {
            java: `import java.util.concurrent.atomic.AtomicInteger;

public class Counter {
    static int unsafe = 0;                       // racy: ++ is read, add, write
    static final AtomicInteger safe = new AtomicInteger();
    static int guarded = 0;
    static final Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        Thread[] ts = new Thread[4];
        for (int i = 0; i < ts.length; i++) {
            ts[i] = new Thread(() -> {
                for (int k = 0; k < 100_000; k++) {
                    unsafe++;                    // lost updates
                    safe.incrementAndGet();      // one atomic CAS-based step
                    synchronized (lock) { guarded++; }  // mutual exclusion
                }
            });
            ts[i].start();
        }
        for (Thread t : ts) t.join();
        System.out.println("unsafe  = " + unsafe + " (usually less than 400000)");
        System.out.println("atomic  = " + safe.get());
        System.out.println("guarded = " + guarded);
        if (safe.get() != 400_000 || guarded != 400_000) throw new AssertionError();
    }
}`
          }
        }
      ]
    },
    {
      id: "primitives",
      title: "Mutex, semaphore, condition variable, monitor",
      body: `
- **Mutex** (lock): mutual exclusion; only the thread that locked it should unlock it. Use it to protect an invariant. Get **reentrant** locks (Java \`ReentrantLock\`, \`synchronized\`) when the same thread may re-enter.
- **Semaphore**: a counter with \`acquire\` (wait until positive, then decrement) and \`release\` (increment). A *binary* semaphore looks like a mutex but has no owner. A *counting* semaphore limits access to N things: connection slots, a bounded buffer's free and filled counts.
- **Condition variable**: lets a thread sleep until some **predicate** about shared state is true. It is always used with a mutex: \`wait\` atomically releases the mutex and sleeps, and re-acquires it on wake. Always re-check the predicate in a \`while\` loop, because of **spurious wakeups** and because another thread may have changed the state between the signal and your wakeup (Mesa semantics, which Java, Python, C++ and POSIX all use).
- **Monitor**: a language-level bundle of a mutex plus condition variables plus the data they guard, where methods run under the lock. Java's \`synchronized\` with \`wait\`/\`notifyAll\` is a monitor; Python's \`Condition\` and C++'s \`std::condition_variable\` give you the pieces to build one.
- **Reader-writer lock**: many readers or one writer. Wins when reads dominate and the critical section is long enough to matter.
- **Spinlock**: busy-wait instead of sleeping; only sensible for very short critical sections on multiple cores in kernel or low-level code.

\`notify\` versus \`notifyAll\`: \`notify\` wakes one waiter, which may be the wrong kind (a consumer waking a consumer). Use separate conditions per predicate, or \`notifyAll\` and let each loop re-check.
`,
      code: [
        {
          title: "Semaphore limiting concurrency to 3",
          code: {
            py: `import threading, time

slots = threading.Semaphore(3)          # at most 3 threads inside at once
active, peak = 0, 0
meter = threading.Lock()                # the counters themselves still need a mutex

def use_connection():
    global active, peak
    with slots:                         # acquire() on entry, release() on exit
        with meter:
            active += 1; peak = max(peak, active)
        time.sleep(0.02)                # pretend to use a scarce resource
        with meter:
            active -= 1

ts = [threading.Thread(target=use_connection) for _ in range(10)]
for t in ts: t.start()
for t in ts: t.join()
print("peak concurrency:", peak)        # never more than 3
assert peak <= 3`
          }
        }
      ]
    },
    {
      id: "atomics",
      title: "Atomic operations and memory visibility",
      body: `
Two separate problems hide behind "thread safety":

1. **Atomicity**: is the operation indivisible? \`i++\` is not; an atomic increment is. Hardware provides **compare-and-swap** (CAS): set the value to \`new\` only if it is still \`expected\`, otherwise retry. Lock-free structures are built on loops of CAS. Watch for the **ABA problem**: the value changes A to B and back to A, so CAS succeeds although the state changed in between.
2. **Visibility and ordering**: when does one thread see another's write? Compilers and CPUs reorder instructions and keep values in registers and per-core caches. Without synchronization, a thread may never see a write, or see writes in a different order than they were made.

The cure is a **happens-before** relationship. In Java: unlocking a monitor happens-before the next lock of it; a write to a \`volatile\` field happens-before every later read of it; \`Thread.start\` and \`join\` also order things. \`volatile\` gives visibility and ordering but not atomicity: \`volatile int i; i++\` is still racy. C++ has \`std::atomic\` with memory orders (default sequentially consistent). JavaScript has \`Atomics\` on \`SharedArrayBuffer\`. A mutex gives both atomicity of the critical section and visibility of everything done inside it.

**Double-checked locking** is only correct in Java if the field is \`volatile\` (since Java 5), and in C++ with proper atomics; otherwise another thread can see a half-constructed object.

The sample is a stop flag. Remove \`volatile\` and it may spin forever, depending on the JIT; with \`volatile\` it always terminates.
`,
      code: [
        {
          title: "A volatile stop flag",
          code: {
            java: `public class Visibility {
    // Without volatile, the worker may never see the write (hoisted read, cached register).
    static volatile boolean stop = false;

    public static void main(String[] args) throws Exception {
        Thread worker = new Thread(() -> {
            long spins = 0;
            while (!stop) spins++;           // volatile read: sees the main thread's write
            System.out.println("stopped after spinning");
        });
        worker.start();
        Thread.sleep(100);
        stop = true;                         // volatile write: happens-before the worker's next read
        worker.join(2000);
        if (worker.isAlive()) throw new AssertionError("worker never saw the flag");
    }
}`
          }
        }
      ]
    },
    {
      id: "hazards",
      title: "Deadlock, livelock, starvation",
      body: `
- **Deadlock**: threads wait on each other in a cycle; nobody moves (conditions in the OS track). The usual cause is taking two locks in opposite orders.
- **Livelock**: threads are active but make no progress, like two people repeatedly stepping aside in a corridor. It often comes from "polite" retry logic without randomness or backoff.
- **Starvation**: a thread never gets the resource, because others keep winning (unfair locks, priority scheduling, reader preference).

How to avoid them: a global lock order; hold as few locks as possible and never call unknown code (callbacks, \`alien\` methods) while holding one; \`tryLock\` with timeout and backoff plus **jitter**; fair locks where starvation matters; and detect with a thread dump (\`jstack\`, \`py-spy dump\`) which shows who holds and who waits.

The Python sample forces the bad interleaving with a barrier and uses timeouts so it terminates and prints that neither thread got its second lock. The last function shows the fix: order the locks by a stable key, then lock.
`,
      code: [
        {
          title: "Opposite lock order, then the fix",
          code: {
            py: `import threading

a, b = threading.Lock(), threading.Lock()
both_hold_one = threading.Barrier(2)

def worker(first, second, name, results):
    with first:
        both_hold_one.wait()                    # force the bad interleaving
        got = second.acquire(timeout=0.5)       # a real program would block here forever
        results[name] = got
        if got: second.release()

results = {}
t1 = threading.Thread(target=worker, args=(a, b, "t1", results))
t2 = threading.Thread(target=worker, args=(b, a, "t2", results))   # opposite order: circular wait
t1.start(); t2.start(); t1.join(); t2.join()
print(sorted(results.items()))   # [('t1', False), ('t2', False)]: neither got its second lock

# Fix: agree on one global order (here, by id()), whoever asks.
def lock_both(x, y):
    first, second = sorted((x, y), key=id)
    first.acquire(); second.acquire()
    return first, second`
          }
        }
      ]
    },
    {
      id: "producer-consumer",
      title: "Classic: producer-consumer",
      body: `
Producers add items to a **bounded buffer**; consumers remove them. Rules: a producer waits when the buffer is full, a consumer waits when it is empty, and access to the buffer is mutually exclusive. Two predicates, two condition variables, one lock.

The three samples all follow the same shape: lock, \`while (predicate not true) wait\`, change state, signal the *other* condition, unlock. In production code, prefer a ready-made blocking queue (\`queue.Queue\`, \`BlockingQueue\`) and write this by hand only when asked.

Common bugs interviewers look for: \`if\` instead of \`while\` around \`wait\`; signalling while the state is not yet updated; using one condition for both sides with \`notify\` (wakes the wrong kind); forgetting to unlock on an exception path.
`,
      code: [
        {
          title: "Bounded buffer",
          code: {
            py: `import threading
from collections import deque

class BoundedBuffer:
    def __init__(self, capacity):
        self.items = deque()
        self.capacity = capacity
        lock = threading.Lock()
        self.not_full = threading.Condition(lock)    # two conditions, one lock
        self.not_empty = threading.Condition(lock)

    def put(self, x):
        with self.not_full:
            while len(self.items) == self.capacity:  # while, never if
                self.not_full.wait()
            self.items.append(x)
            self.not_empty.notify()

    def get(self):
        with self.not_empty:
            while not self.items:
                self.not_empty.wait()
            x = self.items.popleft()
            self.not_full.notify()
            return x

if __name__ == "__main__":
    buf, got = BoundedBuffer(3), []
    def producer(start):
        for i in range(start, start + 100): buf.put(i)
    def consumer(n):
        for _ in range(n): got.append(buf.get())
    ts = [threading.Thread(target=producer, args=(0,)), threading.Thread(target=producer, args=(1000,)),
          threading.Thread(target=consumer, args=(100,)), threading.Thread(target=consumer, args=(100,))]
    for t in ts: t.start()
    for t in ts: t.join()
    assert sorted(got) == list(range(100)) + list(range(1000, 1100))
    print("ok", len(got))`,
            java: `import java.util.ArrayDeque;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class BoundedBuffer<T> {
    private final Queue<T> items = new ArrayDeque<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedBuffer(int capacity) { this.capacity = capacity; }

    public void put(T x) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity) notFull.await();   // loop: wakeups can be spurious
            items.add(x);
            notEmpty.signal();
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty()) notEmpty.await();
            T x = items.remove();
            notFull.signal();
            return x;
        } finally { lock.unlock(); }
    }

    public static void main(String[] args) throws Exception {
        BoundedBuffer<Integer> buf = new BoundedBuffer<>(3);
        java.util.concurrent.atomic.AtomicLong sum = new java.util.concurrent.atomic.AtomicLong();
        Thread[] ts = new Thread[4];
        for (int p = 0; p < 2; p++) {
            final int base = p * 1000;
            ts[p] = new Thread(() -> { try { for (int i = 0; i < 100; i++) buf.put(base + i); } catch (InterruptedException e) {} });
        }
        for (int c = 2; c < 4; c++)
            ts[c] = new Thread(() -> { try { for (int i = 0; i < 100; i++) sum.addAndGet(buf.take()); } catch (InterruptedException e) {} });
        for (Thread t : ts) t.start();
        for (Thread t : ts) t.join();
        long expect = 2L * (99 * 100 / 2) + 100 * 1000;
        System.out.println(sum.get() + " " + expect);
        if (sum.get() != expect) throw new AssertionError();
    }
}`,
            cpp: `#include <condition_variable>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

template <typename T>
class BoundedBuffer {
    std::queue<T> items;
    const size_t capacity;
    std::mutex m;
    std::condition_variable not_full, not_empty;
public:
    explicit BoundedBuffer(size_t cap) : capacity(cap) {}
    void put(T x) {
        std::unique_lock<std::mutex> lk(m);
        not_full.wait(lk, [&] { return items.size() < capacity; });   // predicate form loops for you
        items.push(std::move(x));
        not_empty.notify_one();
    }
    T take() {
        std::unique_lock<std::mutex> lk(m);
        not_empty.wait(lk, [&] { return !items.empty(); });
        T x = std::move(items.front());
        items.pop();
        not_full.notify_one();
        return x;
    }
};

int main() {
    BoundedBuffer<int> buf(3);
    long long sum = 0;
    std::mutex sm;
    std::vector<std::thread> ts;
    for (int p = 0; p < 2; p++)
        ts.emplace_back([&, p] { for (int i = 0; i < 100; i++) buf.put(p * 1000 + i); });
    for (int c = 0; c < 2; c++)
        ts.emplace_back([&] { for (int i = 0; i < 100; i++) { int v = buf.take(); std::lock_guard<std::mutex> g(sm); sum += v; } });
    for (auto& t : ts) t.join();
    std::cout << sum << " " << (2 * 4950 + 100 * 1000) << "\\n";
    return sum == 2 * 4950 + 100 * 1000 ? 0 : 1;
}`
          }
        }
      ]
    },
    {
      id: "readers-writers",
      title: "Classic: readers-writers",
      body: `
Many threads read shared data; some write. Readers may overlap with each other, but a writer needs exclusive access. Three policies:

1. **Reader preference**: readers never wait unless a writer is *active*. Simple, but a steady stream of readers can starve writers (the Python sample).
2. **Writer preference**: once a writer is waiting, new readers queue behind it. Prevents writer starvation, can starve readers.
3. **Fair**: serve in arrival order (Java's \`ReentrantReadWriteLock(true)\`).

The Python version is the textbook reader-preference solution: the first reader locks the room against writers and the last reader unlocks it, with a small mutex protecting the reader count. The Java version just uses the library. A reader-writer lock only pays off when reads dominate and the protected work is long enough to outweigh its bookkeeping; otherwise a plain mutex is faster.
`,
      code: [
        {
          title: "Readers-writers",
          code: {
            py: `import threading

class ReadWriteLock:
    """Readers share, a writer is alone. Reader preference: writers can starve."""
    def __init__(self):
        self._count_lock = threading.Lock()   # guards _readers
        self._room = threading.Lock()         # held by the writer, or by the group of readers
        self._readers = 0

    def acquire_read(self):
        with self._count_lock:
            self._readers += 1
            if self._readers == 1:            # first reader locks the writers out
                self._room.acquire()

    def release_read(self):
        with self._count_lock:
            self._readers -= 1
            if self._readers == 0:            # last reader lets writers in
                self._room.release()

    def acquire_write(self): self._room.acquire()
    def release_write(self): self._room.release()

if __name__ == "__main__":
    rw, data, bad = ReadWriteLock(), {"a": 0, "b": 0}, []
    def writer():
        for i in range(1, 300):
            rw.acquire_write()
            data["a"] = i; data["b"] = i      # the pair must change together
            rw.release_write()
    def reader():
        for _ in range(300):
            rw.acquire_read()
            if data["a"] != data["b"]: bad.append(dict(data))
            rw.release_read()
    ts = [threading.Thread(target=writer)] + [threading.Thread(target=reader) for _ in range(3)]
    for t in ts: t.start()
    for t in ts: t.join()
    assert not bad
    print("ok, final", data)`,
            java: `import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ReadersWriters {
    private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock(true); // fair: no writer starvation
    private int a = 0, b = 0;

    void write(int v) {
        rw.writeLock().lock();
        try { a = v; b = v; } finally { rw.writeLock().unlock(); }
    }

    boolean consistent() {
        rw.readLock().lock();                    // many readers at once
        try { return a == b; } finally { rw.readLock().unlock(); }
    }

    public static void main(String[] args) throws Exception {
        ReadersWriters d = new ReadersWriters();
        java.util.concurrent.atomic.AtomicInteger bad = new java.util.concurrent.atomic.AtomicInteger();
        Thread w = new Thread(() -> { for (int i = 1; i < 300; i++) d.write(i); });
        Thread[] rs = new Thread[3];
        for (int i = 0; i < rs.length; i++)
            rs[i] = new Thread(() -> { for (int k = 0; k < 300; k++) if (!d.consistent()) bad.incrementAndGet(); });
        w.start(); for (Thread r : rs) r.start();
        w.join(); for (Thread r : rs) r.join();
        System.out.println("inconsistent reads: " + bad.get());
        if (bad.get() != 0) throw new AssertionError();
    }
}`
          }
        }
      ]
    },
    {
      id: "philosophers",
      title: "Classic: dining philosophers",
      body: `
Five philosophers sit around a table with one fork between each pair. To eat, a philosopher needs both adjacent forks. The naive "pick up left, then right" deadlocks if all five pick up their left fork at once: each holds one and waits forever for the next.

Standard fixes, each breaking a Coffman condition:

- **Resource ordering** (breaks circular wait): number the forks and always take the lower-numbered one first. The last philosopher then picks up fork 0 before fork 4, so a cycle is impossible. Used in both samples.
- **Limit the diners** (breaks the cycle indirectly): a semaphore allowing at most 4 philosophers to try at once guarantees someone can finish.
- **Pick up both or neither** (breaks hold and wait): \`tryLock\` the second fork, and if it fails release the first and back off (add jitter, or you risk livelock).
- **Asymmetry**: odd philosophers go left first, even philosophers right first.

The test the samples run is that everyone finishes all their meals, which would hang under a deadlock.
`,
      code: [
        {
          title: "Dining philosophers with resource ordering",
          code: {
            py: `import threading

N = 5
forks = [threading.Lock() for _ in range(N)]
meals = [0] * N

def philosopher(i):
    left, right = i, (i + 1) % N
    first, second = sorted((left, right))    # global order: always take the lower-numbered fork first
    for _ in range(200):
        with forks[first]:
            with forks[second]:
                meals[i] += 1                # eat

ts = [threading.Thread(target=philosopher, args=(i,)) for i in range(N)]
for t in ts: t.start()
for t in ts: t.join()
print(meals)
assert meals == [200] * N`,
            java: `import java.util.concurrent.locks.ReentrantLock;

public class Philosophers {
    public static void main(String[] args) throws Exception {
        final int n = 5;
        ReentrantLock[] forks = new ReentrantLock[n];
        for (int i = 0; i < n; i++) forks[i] = new ReentrantLock();
        int[] meals = new int[n];

        Thread[] ts = new Thread[n];
        for (int i = 0; i < n; i++) {
            final int id = i;
            ts[i] = new Thread(() -> {
                int first = Math.min(id, (id + 1) % n);    // resource ordering breaks the circular wait
                int second = Math.max(id, (id + 1) % n);
                for (int k = 0; k < 200; k++) {
                    forks[first].lock();
                    try {
                        forks[second].lock();
                        try { meals[id]++; } finally { forks[second].unlock(); }
                    } finally { forks[first].unlock(); }
                }
            });
            ts[i].start();
        }
        for (Thread t : ts) t.join();
        System.out.println(java.util.Arrays.toString(meals));
        for (int m : meals) if (m != 200) throw new AssertionError();
    }
}`
          }
        }
      ]
    },
    {
      id: "pools",
      title: "Thread pools",
      body: `
Creating a thread per task is expensive and unbounded. A **thread pool** keeps a fixed set of worker threads that pull tasks from a queue. Benefits: reuse of threads, a ceiling on concurrency (so you do not exhaust memory or thrash), and a place to apply back pressure.

Sizing rule of thumb: **CPU-bound** work wants about one thread per core. **I/O-bound** work can use many more, roughly \`cores * (1 + wait_time / compute_time)\`. Measure, and do not guess.

Design questions: Is the task queue bounded? What happens when it is full (block the submitter, reject, run in the caller)? Unbounded queues hide overload until memory runs out. How are exceptions reported (a \`Future\` stores them; a bare \`Thread\` may just print)? How does shutdown work (finish queued tasks, or interrupt)? Never block a pool thread on the result of a task queued behind it in the same pool, which can deadlock a small pool.

Python's CPython threads suit I/O-bound work; for CPU-bound work use \`ProcessPoolExecutor\` (or native extensions that release the GIL).
`,
      code: [
        {
          title: "A fixed pool of 4 workers",
          code: {
            py: `from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def fetch(n):
    time.sleep(0.05)          # stands in for blocking I/O
    return n * n

start = time.perf_counter()
with ThreadPoolExecutor(max_workers=4) as pool:          # 4 workers reused for all 20 tasks
    futures = {pool.submit(fetch, n): n for n in range(20)}
    results = {futures[f]: f.result() for f in as_completed(futures)}
elapsed = time.perf_counter() - start
print(sorted(results.items())[:3], round(elapsed, 2), "s")  # about 0.25 s, not 1.0 s
assert results[7] == 49 and elapsed < 0.9`,
            java: `import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

public class Pool {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(4);   // 4 workers, unbounded task queue
        try {
            List<Future<Integer>> fs = new ArrayList<>();
            for (int n = 0; n < 20; n++) {
                final int x = n;
                fs.add(pool.submit(() -> { Thread.sleep(50); return x * x; }));
            }
            int sum = 0;
            for (Future<Integer> f : fs) sum += f.get();           // get() blocks until that task is done
            System.out.println(sum);
            if (sum != 2470) throw new AssertionError();
        } finally {
            pool.shutdown();                                       // forget this and the JVM may never exit
        }
    }
}`
          }
        }
      ]
    },
    {
      id: "async-threads",
      title: "Async versus threads",
      body: `
**Threads** give you preemptive concurrency: the OS interleaves them, so blocking calls are fine, and CPU-bound work can use several cores. You pay with memory per thread, context switches and the whole race-and-lock problem.

**Async** (event loop, \`async\`/\`await\`) gives you cooperative concurrency on one thread: tasks run until they \`await\`, then yield. One thread can juggle thousands of idle connections cheaply, and because only one task runs at a time and switches happen only at \`await\`, many races disappear. The costs: a CPU-heavy or blocking call **stalls everything** on the loop; the "colored function" problem splits your code into async and sync worlds; and stack traces are harder to read.

Rule of thumb: many concurrent I/O waits (web servers, crawlers, chat) suit async; CPU-bound parallelism needs threads or processes (JavaScript uses worker threads, Python uses processes). Mixing is normal: an event loop for I/O with a thread pool for blocking or CPU work (\`run_in_executor\`, \`asyncio.to_thread\`, a \`Worker\`).

Async is not parallelism: 100 concurrent sleeps finish in about the time of one because they overlap while *waiting*, not because 100 things compute at once. Both samples start 100 simulated 100 ms calls and finish in roughly 100 ms.
`,
      code: [
        {
          title: "100 concurrent waits, one thread",
          code: {
            py: `import asyncio, time

async def fetch(n):
    await asyncio.sleep(0.1)       # yields to the event loop: other tasks run meanwhile
    return n * n

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(*(fetch(n) for n in range(100)))   # 100 waits, one thread
    print(sum(results), round(time.perf_counter() - start, 2), "s")  # about 0.1 s, not 10 s
    assert sum(results) == 328350

asyncio.run(main())`,
            js: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchSquare(n) {
  await sleep(100);                 // yields to the event loop; other tasks run meanwhile
  return n * n;
}

(async () => {
  const start = Date.now();
  const results = await Promise.all(Array.from({ length: 100 }, (_, n) => fetchSquare(n)));
  const sum = results.reduce((a, b) => a + b, 0);
  console.log(sum, Date.now() - start, 'ms');   // about 100 ms, not 10 s
  if (sum !== 328350) throw new Error('wrong');
})();`
          }
        }
      ]
    }
  ],
  quiz: [
    {
      kind: "concept",
      q: "Four threads each run `count += 1` 100,000 times on a shared integer with no synchronization. What is the best description of the outcome?",
      choices: [
        "Always exactly 400,000",
        "Possibly less than 400,000, because read-modify-write steps interleave and updates are lost",
        "Always more than 400,000",
        "The program is guaranteed to crash"
      ],
      answer: 1,
      explain: "`count += 1` is read, add, write. Two threads can read the same value and both write the same result, losing one update. The outcome is timing dependent."
    },
    {
      kind: "concept",
      q: "Why must `wait()` on a condition variable be inside a `while` loop that re-checks the predicate?",
      choices: [
        "Because wait() can only return after one second",
        "Because of spurious wakeups and because the state may change between the signal and the wake-up",
        "Because the loop releases the lock",
        "It is only a style convention"
      ],
      answer: 1,
      explain: "Wake-ups can be spurious, and another thread can consume the item you were signaled about before you re-acquire the lock. Re-check the predicate every time."
    },
    {
      kind: "concept",
      q: "A Java field `volatile int hits;` is incremented with `hits++` from many threads. Is it safe?",
      choices: [
        "Yes, volatile makes it atomic",
        "No, volatile guarantees visibility, not atomicity of read-modify-write",
        "Yes, but only on 64-bit JVMs",
        "No, volatile fields cannot be incremented"
      ],
      answer: 1,
      explain: "volatile gives visibility and ordering. `hits++` is still three steps; use AtomicInteger or a lock."
    },
    {
      kind: "concept",
      q: "What is the difference between a mutex and a binary semaphore?",
      choices: [
        "No difference at all",
        "A mutex has an owner (the locker should unlock it); a semaphore can be released by any thread",
        "A semaphore cannot be used across threads",
        "A mutex can count to N"
      ],
      answer: 1,
      explain: "Ownership is the distinction. Semaphores are signaling mechanisms (any thread may release); mutexes protect critical sections and are owned."
    },
    {
      kind: "concept",
      q: "Dining philosophers: which change breaks the circular wait?",
      choices: [
        "Number the forks and always take the lower-numbered one first",
        "Let every philosopher pick up the left fork first",
        "Make philosophers wait a random time before eating, with no other change",
        "Use a larger table"
      ],
      answer: 0,
      explain: "A global ordering on the forks makes a cycle of waiting impossible, so deadlock is prevented. Randomized delays alone only make deadlock less likely."
    },
    {
      kind: "concept",
      q: "Reader-preference readers-writers has which main risk?",
      choices: [
        "Readers block each other",
        "Writer starvation under a steady stream of readers",
        "Deadlock between two readers",
        "Lost updates for readers"
      ],
      answer: 1,
      explain: "As long as there is always at least one active reader, a writer never gets in. Fair or writer-preference locks fix this at the price of reader latency."
    },
    {
      kind: "concept",
      q: "Your service has 5,000 mostly idle network connections and little CPU work per message. Which is usually the better fit?",
      choices: [
        "One OS thread per connection",
        "An event loop (async I/O) on a few threads",
        "One process per connection",
        "A busy-wait loop"
      ],
      answer: 1,
      explain: "Idle connections cost nearly nothing in an event loop, while thousands of threads cost memory and scheduling overhead."
    },
    {
      kind: "concept",
      q: "Pick **all** statements that are true about a thread pool.",
      choices: [
        "It caps concurrency and reuses threads",
        "An unbounded task queue can hide overload until memory runs out",
        "Blocking a worker on a task queued behind it in the same pool can deadlock it",
        "It makes shared data thread safe automatically"
      ],
      answer: [0, 1, 2],
      explain: "A pool is about resource management, not data safety. Shared data still needs synchronization."
    },
    {
      kind: "concept",
      q: "Two threads keep retrying `tryLock` on two locks, release both on failure, and retry in lockstep forever. This is a:",
      choices: ["Deadlock", "Livelock", "Race condition", "Priority inversion"],
      answer: 1,
      explain: "They are running but making no progress. Random backoff (jitter) or a lock order breaks the symmetry."
    }
  ],
  cards: [
    {
      id: "race",
      front: "What is a data race?",
      back: "Two threads access the same memory location, at least one writes, and there is no ordering between them (no lock, atomic or happens-before). Result: lost updates, torn or stale reads, and undefined behavior in C++."
    },
    {
      id: "cond-while",
      front: "Why `while`, not `if`, around condition wait?",
      back: "Spurious wakeups, and another thread may change the state between the signal and your wake-up. Re-check the predicate each time."
    },
    {
      id: "mutex-sem",
      front: "Mutex vs semaphore?",
      back: "Mutex: mutual exclusion with an owner. Semaphore: a counter for signaling or limiting N resources; any thread can release it."
    },
    {
      id: "volatile",
      front: "What does Java volatile give you, and not give you?",
      back: "Gives visibility and ordering (a write happens-before later reads). Does not make compound actions like i++ atomic."
    },
    {
      id: "cas",
      front: "How does compare-and-swap work, and what is ABA?",
      back: "CAS sets a value to new only if it still equals expected, otherwise retry. ABA: the value went A to B to A, so CAS succeeds although state changed in between."
    },
    {
      id: "pc",
      front: "Bounded buffer recipe?",
      back: "One lock, two conditions (not full, not empty). Producer: while full wait, add, signal not-empty. Consumer: while empty wait, remove, signal not-full."
    },
    {
      id: "rw",
      front: "Readers-writers policies?",
      back: "Reader preference (simple, starves writers), writer preference (starves readers), fair (arrival order). Use a reader-writer lock only when reads dominate."
    },
    {
      id: "philo",
      front: "Dining philosophers fixes?",
      back: "Global fork ordering, limit diners to N-1, pick up both or neither with backoff, or asymmetric pickup order. Each breaks a Coffman condition."
    },
    {
      id: "pool-size",
      front: "How to size a thread pool?",
      back: "CPU-bound: about one thread per core. I/O-bound: more, roughly cores * (1 + wait/compute). Measure; keep the queue bounded."
    },
    {
      id: "async-vs-threads",
      front: "Async vs threads in one line?",
      back: "Async is cooperative single-thread concurrency good for many I/O waits; threads are preemptive and can use many cores but need locks. Async is not parallelism."
    },
    {
      id: "livelock",
      front: "Deadlock vs livelock vs starvation?",
      back: "Deadlock: all blocked in a cycle. Livelock: active but no progress. Starvation: one thread never gets the resource."
    },
    {
      id: "gil",
      front: "What does the Python GIL mean for threads?",
      back: "In standard CPython only one thread runs Python bytecode at a time, so threads help I/O-bound work but not CPU-bound work, and compound operations like += still race. Use processes or native code for CPU parallelism."
    }
  ]
});
