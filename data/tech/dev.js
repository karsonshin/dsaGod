(function () {
  var OR = (window.OR = window.OR || {}); OR.tech = OR.tech || { items: [] };
  OR.tech.items.push(
    {
      id: 'dev-2026-10-python-3-15',
      area: 'Languages and tools',
      date: '2026-10-09',
      title: 'Python 3.15.0 final ships with lazy imports, frozendict and UTF-8 default',
      source: 'Python Insider blog',
      url: 'https://blog.python.org/2026/10/python-3150-final-is-here',
      summary: 'Python 3.15.0 was released on 9 October 2026 (5,643 commits, 1,012 contributors). Headline changes: explicit lazy imports for faster startup, a built-in frozendict, a sentinel type, UTF-8 as the default encoding, and a Tachyon sampling profiler. The experimental JIT is reported 7-8% faster on x86-64 Linux and 11-12% on AArch64 macOS. Caveat: on macOS 27.0, tkinter apps such as IDLE may hang.',
      why: 'Lazy imports and the default encoding change affect startup time and file handling in real Python projects, and the JIT shows where CPython performance is heading.',
      terms: [['Lazy import', 'An import that is only executed when the imported name is first used, which cuts startup time.'], ['frozendict', 'An immutable dictionary that can be hashed and used as a key or set member.'], ['JIT compiler', 'Compiles hot code to machine code while the program runs; here it is still experimental.']],
      interview: 'Immutability and hashability (why a mutable dict cannot be a hash-map key) are standard hash-table interview material.'
    },
    {
      id: 'dev-2026-09-python-boc-concurrency',
      area: 'Languages and tools',
      date: '2026-09-30',
      title: 'Language Summit: a proposal for safer concurrency in free-threaded Python',
      source: 'Python Insider blog',
      url: 'https://blog.python.org/2026/09/language-summit-2026-free-threading-post-era',
      summary: 'At the 2026 Python Language Summit, speakers proposed Behavior-Oriented Concurrency: tasks declared with a @when decorator access data through "cowns", mutexes that know what they protect. The authors claim this rules out deadlocks and data races. A proof of concept, bocpy, runs on subinterpreters and only implements isolation so far; ownership would need runtime changes. This is a proposal, not a decided direction.',
      why: 'Free-threaded Python makes data races a real concern for Python developers, so how the language might help prevent them matters.',
      terms: [['Free-threaded Python', 'A CPython build without the global interpreter lock, so threads can run Python code in parallel.'], ['Data race', 'Two threads access the same memory at once, at least one writing, with no synchronization.'], ['Subinterpreter', 'A separate, isolated Python interpreter inside one process.']],
      interview: 'Deadlocks, data races and mutex-protected shared state are core concurrency interview topics.'
    },
    {
      id: 'dev-2026-09-python-pep-827-types',
      area: 'Languages and tools',
      date: '2026-09-30',
      title: 'PEP 827 draft would let Python types be computed from other types',
      source: 'Python Insider blog',
      url: 'https://blog.python.org/2026/09/language-summit-2026-pep-827-type-manipulation',
      summary: 'A Language Summit talk covered draft PEP 827, which adds conditional types, comprehension types and member types so one class can generate related types, for example create and update models from a single Hero class. It is inspired by TypeScript but not modeled on it. Participants raised concerns about complexity, readability and how annotations are stored at runtime. The article treats it as a draft with a mypy-based prototype.',
      why: 'Type hints are now routine in Python codebases, and this shows where the type system could grow for frameworks like ORMs.',
      terms: [['PEP', 'Python Enhancement Proposal, the document used to propose and decide changes to Python.'], ['Conditional type', 'A type that resolves to one of two types depending on a condition.'], ['Annotation', 'A type hint attached to a variable, parameter or return value.']],
      interview: 'Static vs dynamic typing trade-offs, and what a type checker can prove before runtime, come up in language-design questions.'
    },
    {
      id: 'dev-2026-10-rust-1-99',
      area: 'Languages and tools',
      date: '2026-10-01',
      title: 'Rust 1.99 stabilizes C-style variadic functions',
      source: 'Rust Blog (rust-lang.org)',
      url: 'https://blog.rust-lang.org/2026/10/01/Rust-1.99.0/',
      summary: 'Rust 1.99.0 was released on 1 October 2026. It stabilizes defining variadic functions with the "C" and "C-unwind" ABIs, where the ... argument is a VaList, plus naked variadic functions written in inline assembly. Seventeen APIs became stable, including Box::into_non_null and Vec::into_parts. There are no language semantic changes, and the docs now warn against freeing memory obtained from leak functions.',
      why: 'It shows how Rust keeps a six-week release cadence with small, incremental stabilizations, and it improves interop with C code.',
      terms: [['Variadic function', 'A function that accepts a variable number of arguments, like C printf.'], ['ABI', 'Application binary interface: the calling convention and data layout that compiled code agrees on.'], ['Naked function', 'A function with no compiler-generated prologue or epilogue; its body is raw assembly.']],
      interview: 'Memory ownership and manual deallocation (leaks, double frees) are the same ideas Rust ownership is built to manage.'
    },
    {
      id: 'dev-2026-08-go-1-27',
      area: 'Languages and tools',
      date: '2026-08-19',
      title: 'Go 1.27 adds generic methods and a new JSON package',
      source: 'The Go Blog (go.dev)',
      url: 'https://go.dev/blog/go1.27',
      summary: 'Go 1.27 was announced on 19 August 2026. Methods may now declare their own type parameters, and function type inference works in more assignment contexts. The standard library gains encoding/json/v2, ML-DSA post-quantum signatures, and a uuid package, with experimental SIMD support. Size-specialized allocation reduces small-object allocation cost by up to 30%, and the goroutineleak profile is generally available.',
      why: 'Go is common in backend and cloud work, and generics plus faster JSON handling change how typical services are written.',
      terms: [['Generic method', 'A method that has its own type parameters in addition to those of its receiver type.'], ['Goroutine leak', 'A goroutine that is blocked forever and never gets cleaned up, wasting memory.'], ['ML-DSA', 'A post-quantum digital signature scheme standardized as FIPS 204.']],
      interview: 'Goroutines, channels and leaked blocked threads are the standard concurrency discussion for Go roles.'
    },
    {
      id: 'dev-2026-09-jdk-27',
      area: 'Languages and tools',
      date: '2026-09-15',
      title: 'JDK 27 is out: G1 becomes the default collector everywhere',
      source: 'OpenJDK project page',
      url: 'https://openjdk.org/projects/jdk/27/',
      summary: 'The OpenJDK schedule lists general availability of JDK 27 for 15 September 2026, and the download site now offers it as a GA release. Its JEPs include making G1 the default garbage collector in all environments, hybrid post-quantum key exchange for TLS 1.3, and compact object headers on by default. Structured Concurrency and primitive patterns remain in preview, and the Vector API remains an incubator.',
      why: 'Java remains widespread in enterprise jobs, and GC defaults affect latency and memory behavior of services.',
      terms: [['G1', 'Garbage-First: a JVM garbage collector that works on regions of the heap to keep pauses short.'], ['JEP', 'JDK Enhancement Proposal, a numbered description of a JDK feature.'], ['Preview feature', 'A feature that is complete enough to try but may still change.']],
      interview: 'Garbage collection and stack vs heap memory management are common Java interview questions.'
    },
    {
      id: 'dev-2026-10-copilot-local-sandboxing',
      area: 'Languages and tools',
      date: '2026-10-07',
      title: 'GitHub Copilot local sandboxing reaches general availability',
      source: 'GitHub Changelog',
      url: 'https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available',
      summary: 'GitHub announced on 7 October 2026 that local sandboxing for Copilot is generally available in the Copilot CLI, the Copilot app and VS Code Agent Host sessions on Windows, macOS and Linux. Commands the agent runs can be restricted in file access, network access and Git credentials, using policies set by the developer or organization. Enterprises can enforce settings developers cannot weaken. The sandbox covers tool execution, not the model itself.',
      why: 'AI agents now run commands on your machine, so limiting what they can touch is becoming a normal part of developer setup.',
      terms: [['Sandbox', 'A restricted environment that limits what a program can read, write or reach.'], ['MCP', 'Model Context Protocol, a standard for connecting AI tools to external tools and data.'], ['Agent', 'An AI system that takes actions such as running commands, not just answering questions.']],
      interview: 'Least privilege and process isolation are standard security design principles you may be asked about.'
    },
    {
      id: 'dev-2026-10-copilot-computer-use',
      area: 'Languages and tools',
      date: '2026-10-01',
      title: 'Copilot can now operate desktop apps in public preview',
      source: 'GitHub Changelog',
      url: 'https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps',
      summary: 'On 1 October 2026 GitHub released computer use for Copilot in public preview, in the Copilot CLI and Copilot app on macOS and Windows. Copilot can read app content, click, type, scroll and drag, which lets it work with software that has no API or command-line interface. It asks for approval before controlling an app, and organizations can switch the feature off. Behavior may change during the preview.',
      why: 'It shows AI tools moving from writing code to driving whole GUI workflows, such as testing or legacy tools.',
      terms: [['Computer use', 'An AI agent controlling a graphical interface by viewing the screen and sending clicks and keystrokes.'], ['Public preview', 'An early release open to users, with no stability guarantee.'], ['GUI automation', 'Scripting interactions with a program through its visual interface.']],
      interview: 'Why APIs are preferred over UI scraping (stability, speed, error handling) is a good integration-design talking point.'
    },
    {
      id: 'dev-2026-10-npm-trusted-publishing',
      area: 'Languages and tools',
      date: '2026-10-02',
      title: 'npm trusted publishing setups now expire if never used',
      source: 'GitHub Changelog',
      url: 'https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire',
      summary: 'GitHub announced on 2 October 2026 that an npm trusted publishing configuration expires 48 hours after creation unless a first successful publish validates it. Changing the linked repository requires a new trust relationship with a fresh window. npm also rejects trusted publishing tokens from GitHub Actions issue_comment events, in addition to the existing pull_request_target restriction. Workflows using issue_comment must publish from an event like push or release.',
      why: 'Package registry attacks are frequent, and these rules show how registries reduce risk from long-lived tokens and abused CI triggers.',
      terms: [['Trusted publishing', 'Publishing a package from CI using short-lived identity tokens instead of stored secrets.'], ['Supply chain attack', 'Compromising a dependency or build step so malicious code reaches downstream users.'], ['CI workflow', 'An automated pipeline that builds, tests and releases code when events occur.']],
      interview: 'Secrets management and short-lived credentials vs long-lived tokens are common security discussion points.'
    }
  );
})();
