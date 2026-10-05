/* Low-level design fundamentals: design patterns, part 2 (Decorator, Adapter, State, Command) and when not to use patterns. Schema: data/sd/schema.md.
   Code samples live in data/sd/lld-code-patterns.js (generated from sources that were compiled and run in all four languages). */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.fundamentals = SD.fundamentals || [];
  SD.viz = SD.viz || {};
  // The fundamentals renderer has no code field, so a section's code is a tiny visualizer that renders OR.codeBlock (language toggle included).
  function codeViz(key, title) {
    var id = 'lld-' + key;
    SD.viz[id] = { mount: function (host) { host.innerHTML = OR.codeBlock((SD.lldCode || {})[key], { title: title }); return { destroy: function () {} }; } };
    return id;
  }
  function C(id, name, kind, fields, methods, why, tradeoffs) {
    return { id: id, name: name, kind: kind || 'class', fields: fields || [], methods: methods || [], detail: { why: why, tradeoffs: tradeoffs || [] } };
  }
  // Authored with the right answer first; rotate each question's choices so the answer position varies (deterministic).
  function mix(qs) {
    return qs.map(function (q, i) {
      var n = q.choices.length, k = (i * 3 + 3) % n, c = new Array(n);
      q.choices.forEach(function (x, j) { c[(j + k) % n] = x; });
      q.choices = c; q.answer = (q.answer + k) % n; return q;
    });
  }
  var G = 'Low-level design';

  SD.fundamentals.push(
  {
    id: 'lld-decorator', title: 'Decorator pattern', group: G,
    hook: 'Add behavior to an object by wrapping it in another object with the same interface, instead of subclassing every combination.',
    keywords: 'decorator pattern structural wrapper coffee milk stream buffered middleware composition extend behavior dynamically',
    sections: [
      { title: 'The problem and the idea',
        md: 'A coffee shop sells coffee with optional milk and extra shots, in any combination. Subclassing gives `CoffeeWithMilk`, `CoffeeWithShot`, `CoffeeWithMilkAndShot`, and the number of classes doubles with each add-on.\n\n**Decorator** wraps an object in another that implements the **same interface**, forwards calls to it, and adds behavior before or after. `Milk(Shot(Coffee()))` is itself a `Beverage`, so a caller cannot tell how many layers there are, and layers can be stacked in any order and any number of times, chosen at runtime.\n\nThe structure: a **component interface** (`Beverage`), a **concrete component** (`Coffee`), a **decorator base** that holds a component, and **concrete decorators** (`Milk`, `Shot`). It appears all over real systems: Java\'s `BufferedInputStream(new FileInputStream(...))`, Python\'s `@decorator` functions (same idea applied to functions), web middleware chains, and logging or caching wrappers around a service.',
        diagram: { title: 'Decorator: add-ons wrap a Beverage and are Beverages',
          classes: [
            C('bev', 'Beverage', 'interface', [], ['+ cost(): int', '+ describe(): str'], 'The shared interface. Callers use it for plain and decorated drinks alike.'),
            C('cof', 'Coffee', 'class', [], ['+ cost(): int', '+ describe(): str'], 'The concrete component: the base price, no wrapping.'),
            C('add', 'Addon', 'abstract', ['# inner: Beverage'], ['+ cost(): int', '+ describe(): str'], 'Decorator base. It is a Beverage and also holds one, which is what makes the layers stack.'),
            C('milk', 'Milk', 'class', [], ['+ cost(): int', '+ describe(): str'], 'Adds its own price and text to whatever it wraps.'),
            C('shot', 'Shot', 'class', [], ['+ cost(): int', '+ describe(): str'], 'Another independent add-on; Shot(Shot(...)) works.')
          ],
          relations: [{ from: 'cof', to: 'bev', type: 'implements' }, { from: 'add', to: 'bev', type: 'implements' }, { from: 'add', to: 'bev', type: 'aggregates', label: 'wraps' }, { from: 'milk', to: 'add', type: 'inherits' }, { from: 'shot', to: 'add', type: 'inherits' }] } },
      { title: 'Code',
        md: 'Each add-on calls `inner.cost()` and adds its own amount, so the total is computed by the chain. In C++ the decorators own the wrapped object through `unique_ptr`; in the other languages the garbage collector handles lifetime.',
        viz: codeViz('decorator', 'Stackable beverage add-ons') },
      { title: 'Trade-offs and pitfalls',
        md: '- **Use it when** you need optional, combinable behavior at runtime and subclassing would multiply classes, or when you cannot modify the original class.\n- **Cost:** many small objects, and a stack trace through several layers. Debugging "which layer did that" takes effort.\n- **Order can matter.** Compress-then-encrypt is not encrypt-then-compress. Document or enforce ordering.\n- **Identity breaks:** a decorated object is not the same object as the original, so `==` checks and type checks (`instanceof Coffee`) fail on the wrapper.\n- **Keep the interface small.** Every method on the component must be forwarded by every decorator; a wide interface makes decorators tedious and error-prone.\n- **Decorator versus Adapter versus Proxy:** a decorator keeps the same interface and adds behavior; an adapter changes the interface; a proxy keeps the interface and controls access, with the same shape as a decorator but a different purpose.\n- **Decorator versus Strategy:** Strategy swaps the algorithm inside an object; Decorator wraps from the outside and can stack.' }
    ],
    takeaways: ['A decorator implements the component interface and wraps a component, adding behavior.', 'Layers stack in any order at runtime, avoiding a subclass per combination.', 'Order of layers can change results, and wrappers lose object identity.', 'Same interface plus new behavior: Decorator. Different interface: Adapter. Controlled access: Proxy.'],
    quiz: mix([
      { kind: 'concept', q: 'What defines a Decorator?', choices: ['It implements the same interface as the object it wraps and adds behavior around the calls', 'It converts one interface into a different one', 'It ensures a single instance', 'It records undo history'], answer: 0, explain: 'Same interface lets callers treat wrapped and unwrapped objects alike, and lets decorators stack.' },
      { kind: 'concept', q: 'A drink may have any mix of milk, syrup and extra shots. Why is Decorator better than subclassing here?', choices: ['The number of subclasses would grow exponentially with each option, while decorators combine freely at runtime', 'Subclasses cannot override cost()', 'Decorators run faster', 'Subclassing is not allowed for beverages'], answer: 0, explain: 'N optional add-ons need up to 2^N subclasses. N decorators cover every combination.' },
      { kind: 'concept', q: 'Which is a real-world Decorator?', choices: ['Wrapping a stream in a buffered or compressing stream', 'A logger that exists once per process', 'A function that picks a payment class from a string', 'A class that exposes legacy SOAP calls as REST methods'], answer: 0, explain: 'Streams wrap other streams with the same read/write interface and add buffering or compression.' },
      { kind: 'concept', q: 'What is a notable pitfall of Decorator?', choices: ['The order of wrapping may change behavior, and the wrapper is not the same object as the original', 'It prevents the use of interfaces', 'It requires a global instance', 'It can only wrap one layer'], answer: 0, explain: 'Encrypt-then-compress differs from compress-then-encrypt, and `instanceof` or equality checks on the original type fail on a wrapper.' },
      { kind: 'concept', q: 'How does Decorator differ from Adapter?', choices: ['Decorator keeps the interface and adds behavior; Adapter changes the interface', 'Adapter keeps the interface and adds behavior', 'They are the same pattern', 'Decorator only works with abstract classes'], answer: 0, explain: 'Adapter translates between incompatible interfaces. Decorator extends behavior behind the same interface.' },
      { kind: 'concept', q: 'What do Python\'s `@decorator` functions have in common with the Decorator pattern?', choices: ['They wrap a callable with another that has the same call signature and adds behavior', 'They create subclasses', 'They are singletons', 'They convert types'], answer: 0, explain: 'The idea, wrapping with the same interface, is the same, applied to functions instead of objects. The syntax is a language feature.' },
      { kind: 'concept', q: 'Why is a wide component interface a problem for Decorator?', choices: ['Every decorator must forward every method, which is tedious and easy to get wrong', 'Wide interfaces cannot be implemented', 'It makes decorators immutable', 'It disables stacking'], answer: 0, explain: 'A forgotten forwarding method silently bypasses the inner object. Keep the interface narrow or generate the forwarding code.' }
    ]),
    flashcards: [
      { id: 'decorator-def', front: 'Define the Decorator pattern.', back: 'Wrap an object in another with the same interface that delegates to it and adds behavior. Wrappers stack in any order at runtime.' },
      { id: 'decorator-why', front: 'Problem that Decorator avoids?', back: 'A class explosion from subclassing every combination of optional features (2^N subclasses for N features).' },
      { id: 'decorator-vs-adapter', front: 'Decorator versus Adapter versus Proxy?', back: 'Decorator: same interface, added behavior. Adapter: different interface, translated. Proxy: same interface, controlled access (lazy load, auth, remote).' },
      { id: 'decorator-order', front: 'Why does decorator order matter?', back: 'Each layer sees the output of the one inside it, so compress-then-encrypt differs from encrypt-then-compress. Document or enforce the order.' }
    ]
  },
  {
    id: 'lld-adapter', title: 'Adapter pattern', group: G,
    hook: 'Wrap code you cannot change so that it fits the interface your code expects.',
    keywords: 'adapter pattern structural wrapper legacy third party api integration interface translate anti corruption layer',
    sections: [
      { title: 'The problem and the idea',
        md: 'Your checkout code expects a `PaymentProcessor` with `pay(amountCents)` that returns true or false. The payment vendor\'s library offers `submit(dollars)` with a float amount and a numeric status code. You cannot edit the vendor\'s code, and you do not want its units and codes spread through your business logic.\n\nAn **Adapter** is a small class that implements your interface and **translates** each call to the incompatible class it wraps: convert cents to dollars, call `submit`, turn status `0` into `true`. The rest of your code never learns the vendor API exists. Replacing the vendor means writing a second adapter.\n\nThere are two forms. An **object adapter** (shown) holds the adaptee by composition and works in every language. A **class adapter** inherits from the adaptee and implements the target interface, which needs multiple inheritance or an interface plus subclass, and ties you to one concrete adaptee class. Prefer the object adapter.\n\nThe larger idea, an **anti-corruption layer**, is the same move at module scale: translate at the boundary so foreign models do not leak into yours.',
        diagram: { title: 'Adapter: translate the vendor API into PaymentProcessor',
          classes: [
            C('pp', 'PaymentProcessor', 'interface', [], ['+ pay(amountCents): bool'], 'The target interface your code is written against.'),
            C('ad', 'LegacyGatewayAdapter', 'class', ['- gateway: LegacyGateway'], ['+ pay(amountCents): bool'], 'Implements the target and delegates to the adaptee, converting units and result codes.', ['One translation point: change it when the vendor changes.']),
            C('lg', 'LegacyGateway', 'class', [], ['+ submit(dollars): int'], 'The adaptee: third-party code, different units and a status code, which you cannot modify.'),
            C('co', 'Checkout', 'class', [], ['+ checkout(p, cents)'], 'Client code. It knows only PaymentProcessor.')
          ],
          relations: [{ from: 'ad', to: 'pp', type: 'implements' }, { from: 'ad', to: 'lg', type: 'aggregates', label: 'wraps' }, { from: 'co', to: 'pp', type: 'depends' }] } },
      { title: 'Code',
        md: 'The adapter converts cents to dollars with `/ 100` and maps the vendor\'s status code to a boolean. Note that production money code should avoid floats; the float appears only because the vendor\'s API demands it, which is precisely the sort of quirk an adapter contains.',
        viz: codeViz('adapter', 'A payment gateway adapter') },
      { title: 'Trade-offs and pitfalls',
        md: '- **Use it when** integrating a library, legacy module or external service whose interface does not match yours, or when you want to be able to swap vendors.\n- **Cost:** an extra class and a layer of indirection. For a one-off call to a library you will never replace, calling it directly is fine.\n- **Keep it thin.** An adapter translates; it should not hold business rules. If it grows logic, that logic belongs in your domain code.\n- **Translate errors too.** Map vendor exceptions and codes to your own types so callers handle only your vocabulary.\n- **Test it with the real adaptee or a recorded fake** to confirm the translation (units, rounding, edge values).\n- **Adapter versus Facade:** a facade offers a simpler interface over a whole subsystem; an adapter makes one existing interface match another.\n- **Adapter versus Decorator:** different interface in, same interface out for Decorator.' }
    ],
    takeaways: ['An adapter implements the interface you need and translates calls to an incompatible class.', 'Prefer object adapters (composition) over class adapters (inheritance).', 'Keep adapters thin, and translate errors as well as data.', 'It is the seam that lets you swap vendors or isolate a legacy model.'],
    quiz: mix([
      { kind: 'concept', q: 'What does an Adapter do?', choices: ['Makes an existing class usable through the interface a client expects', 'Ensures only one instance exists', 'Adds optional behavior around an object', 'Records commands for undo'], answer: 0, explain: 'It implements the target interface and translates calls to the incompatible adaptee.' },
      { kind: 'concept', q: 'Why prefer an object adapter over a class adapter in most designs?', choices: ['It uses composition, so it works in every language and can wrap any adaptee subclass', 'It is shorter', 'It avoids interfaces', 'Class adapters do not exist'], answer: 0, explain: 'A class adapter ties you to inheritance from one concrete class and needs multiple inheritance to also implement the target.' },
      { kind: 'concept', q: 'The vendor API takes dollars as a float; your interface uses integer cents. Where should the conversion live?', choices: ['Inside the adapter', 'In every caller', 'In the business logic', 'In the vendor library'], answer: 0, explain: 'The adapter is the one place that knows both vocabularies. Callers stay clean and only one spot changes if the vendor does.' },
      { kind: 'concept', q: 'How does Adapter differ from Facade?', choices: ['Adapter reconciles two existing interfaces; Facade offers a simplified interface to a subsystem', 'They are identical', 'Facade adds undo support', 'Adapter always uses inheritance'], answer: 0, explain: 'Adapter is about compatibility with a specific expected interface. Facade is about reducing complexity of many classes.' },
      { kind: 'concept', q: 'What should an Adapter avoid?', choices: ['Containing business rules beyond translation', 'Implementing the target interface', 'Holding a reference to the adaptee', 'Converting exceptions'], answer: 0, explain: 'Business logic hidden in an adapter is hard to find and test. Keep it as a translator.' },
      { kind: 'concept', q: 'What benefit does an adapter give when you may switch payment vendors later?', choices: ['Only a new adapter is needed; the rest of the code is unchanged', 'The old vendor keeps working automatically', 'No testing is needed', 'The interface becomes a singleton'], answer: 0, explain: 'Clients depend on your interface, so replacing the implementation behind it is a local change.' }
    ]),
    flashcards: [
      { id: 'adapter-def', front: 'Define the Adapter pattern.', back: 'A class that implements the interface a client expects and translates calls to an existing incompatible class (the adaptee) it wraps.' },
      { id: 'adapter-forms', front: 'Object adapter versus class adapter?', back: 'Object adapter holds the adaptee (composition) and works everywhere. Class adapter inherits from the adaptee, tying you to it and needing multiple inheritance.' },
      { id: 'adapter-use', front: 'Typical uses of Adapter?', back: 'Integrating third-party libraries or legacy code, swapping vendors, and isolating a foreign model at a boundary (anti-corruption layer).' },
      { id: 'adapter-vs-facade', front: 'Adapter versus Facade?', back: 'Adapter makes one interface match another. Facade gives a simpler interface over many classes in a subsystem.' }
    ]
  },
  {
    id: 'lld-state', title: 'State pattern', group: G,
    hook: 'Let an object change its behavior when its internal state changes by delegating to a state object, not branching on flags.',
    keywords: 'state pattern behavioral state machine transitions workflow vending machine order status document lifecycle fsm',
    sections: [
      { title: 'The problem and the idea',
        md: 'A document moves through **draft**, **in review** and **published**. `submit`, `approve` and `reject` are legal only in some states. The naive version stores a `status` string and every method begins with `if status == "draft" ... elif status == "in review" ...`. Add a state such as "archived" and you edit every method; forget a case and an illegal transition slips through.\n\n**State** makes each state a class. The context (`Document`) holds a current state object and delegates every action to it. Each state implements only the actions legal for it and **returns the next state**; everything else falls through to a default that rejects the action. The transition table lives in the state classes, one place per state, instead of being smeared across `if` chains.\n\nThis is an object-oriented finite state machine. Use it for order lifecycles (placed, paid, shipped, delivered, cancelled), vending machines, connection handling (connecting, open, closing, closed), media players, and anything where "what is allowed now" depends on history.',
        diagram: { title: 'State: Document delegates to its current State',
          classes: [
            C('doc', 'Document', 'class', ['- state: State'], ['+ submit()', '+ approve()', '+ reject()'], 'The context. Each method calls the current state and stores the state it returns.', ['The context stays small and does not know the rules.']),
            C('st', 'State', 'abstract', [], ['+ submit(): State', '+ approve(): State', '+ reject(): State'], 'Default behavior: every action is illegal. Concrete states override only what they allow.'),
            C('draft', 'Draft', 'class', [], ['+ submit(): State'], 'submit moves to InReview. Approve and reject are illegal.'),
            C('rev', 'InReview', 'class', [], ['+ approve(): State', '+ reject(): State'], 'approve moves to Published; reject returns to Draft.'),
            C('pub', 'Published', 'class', [], [], 'Terminal state: it overrides nothing, so every action is rejected.')
          ],
          relations: [{ from: 'doc', to: 'st', type: 'aggregates' }, { from: 'draft', to: 'st', type: 'inherits' }, { from: 'rev', to: 'st', type: 'inherits' }, { from: 'pub', to: 'st', type: 'inherits' }] } },
      { title: 'Code',
        md: 'States here are stateless and return the next state, which keeps them free of a back-reference to the context (and avoids circular declarations in C++). The alternative passes the context into each action and lets the state call `context.setState(...)`; use that when states need to read or change the context\'s data.',
        viz: codeViz('state', 'A document lifecycle') },
      { title: 'Trade-offs and pitfalls',
        md: '- **Use it when** behavior differs by state, there are many states or transitions, and the `if/elif` forest on a status keeps growing or going wrong.\n- **Cost:** a class per state and indirection. For two or three states and one or two actions, a simple `enum` and a `switch` is clearer.\n- **Where does the transition logic live?** In the states (as here, decentralized and easy to extend with new states) or in the context with a table. A table `{(state, event): next}` is compact and good for pure state machines; State objects win when states carry behavior or data.\n- **State versus Strategy:** the structure matches. In State, the object moves between states by itself and states often know each other; strategies are chosen from outside and are independent.\n- **Shareable states:** stateless states can be singletons (flyweights) shared across contexts.\n- **Persistence:** store a stable name or enum, not the object, and rebuild the state object on load.\n- **Concurrency:** a transition reads the current state and writes the next one; guard it with a lock or compare-and-set if several threads can trigger events.' }
    ],
    takeaways: ['State = one class per state; the context delegates actions to its current state object.', 'Each state defines which actions are legal and returns the next state; unlisted actions are rejected by default.', 'It replaces repeated if/switch on a status field, which gets harder to extend with each state.', 'For tiny machines a transition table or enum with a switch is simpler.'],
    quiz: mix([
      { kind: 'concept', q: 'What does the State pattern replace?', choices: ['Repeated conditionals on a status field inside every method', 'A single global instance', 'A builder with many setters', 'A legacy API wrapper'], answer: 0, explain: 'Behavior per state moves into state classes, so adding a state is a new class instead of edits to every method.' },
      { kind: 'concept', q: 'In the document example, what happens when `approve()` is called on a Draft?', choices: ['The default State behavior rejects it as an illegal transition', 'It publishes the document', 'It moves to InReview', 'It silently does nothing'], answer: 0, explain: 'Draft overrides only submit. Approve falls through to the base implementation, which throws.' },
      { kind: 'concept', q: 'How does State differ from Strategy?', choices: ['In State the object transitions between states itself; strategies are alternatives chosen from outside', 'State has no interface', 'Strategy keeps history', 'There is no structural difference and no difference in intent'], answer: 0, explain: 'They share a shape (delegate to an interchangeable object), but State models a lifecycle.' },
      { kind: 'concept', q: 'When is a simple enum plus switch better than the State pattern?', choices: ['A few states with little behavior difference', 'Dozens of states with rich behavior', 'When states carry their own data', 'When new states are added often'], answer: 0, explain: 'The pattern costs a class per state. With a handful of trivial states the plain enum is easier to read.' },
      { kind: 'concept', q: 'Which design choice makes stateless State objects easy to share across many contexts?', choices: ['States return the next state instead of holding a reference to one context', 'Every state stores its context', 'States are mutable', 'Each state creates its own thread'], answer: 0, explain: 'With no per-context fields, one instance per state can serve every document (the Flyweight idea).' },
      { kind: 'concept', q: 'How should a State-based object be persisted in a database?', choices: ['Store a stable name or enum and rebuild the state object when loading', 'Serialize the class definition', 'Store the memory address', 'Do not persist it'], answer: 0, explain: 'State objects are behavior, not data. A stable identifier survives code changes and refactors.' },
      { kind: 'concept', q: 'Two threads call `approve()` and `reject()` on the same InReview document at once. What is needed?', choices: ['Synchronization or compare-and-set around the transition', 'Nothing, transitions are atomic by default', 'A second context object', 'To make states singletons'], answer: 0, explain: 'A transition is read-modify-write on the current state. Without a lock, both could succeed and leave an inconsistent result.' }
    ]),
    flashcards: [
      { id: 'state-def', front: 'Define the State pattern.', back: 'An object delegates its behavior to a current state object; each state class implements the actions legal in that state and decides the next state.' },
      { id: 'state-smell', front: 'Smell that suggests the State pattern?', back: 'Many methods each starting with if/switch on a status or mode field, with growing combinations and missed illegal transitions.' },
      { id: 'state-vs-strategy', front: 'State versus Strategy?', back: 'State: the context changes its own state over a lifecycle. Strategy: the caller selects an interchangeable algorithm that does not change by itself.' },
      { id: 'state-table', front: 'Alternative to State objects for a simple machine?', back: 'A transition table mapping (state, event) to the next state, or an enum with a switch. Good when states carry no behavior of their own.' }
    ]
  },
  {
    id: 'lld-command', title: 'Command pattern', group: G,
    hook: 'Turn a request into an object so it can be queued, logged, undone and replayed.',
    keywords: 'command pattern behavioral undo redo queue macro history editor invoker receiver job task transaction',
    sections: [
      { title: 'The problem and the idea',
        md: 'A text editor has buttons, menu items and key bindings that all trigger actions such as "append text" or "delete the last five characters", and the user expects **undo**. If each button calls editor methods directly, the UI is welded to the editor and no one remembers what was done or how to reverse it.\n\n**Command** wraps one action and its parameters in an object with `execute()` (and often `undo()`). Roles:\n\n- **Command**: the interface with `execute` and `undo`.\n- **Receiver**: the object that does the real work (`Editor`).\n- **Concrete commands**: `Append`, `DeleteLast`. Each stores what it needs, including **what it needs to reverse itself**: `DeleteLast` remembers the text it removed.\n- **Invoker**: runs commands and keeps the history (`History`). It knows only the `Command` interface.\n\nBecause an action is now a value, you can put it in a queue (job systems), log it (audit, event sourcing), send it elsewhere (RPC), batch several into a macro, retry it, or pop the history for undo. A thread pool\'s `Runnable` tasks are commands without `undo`.',
        diagram: { title: 'Command: History runs commands that act on an Editor',
          classes: [
            C('hist', 'History', 'class', ['- done: stack'], ['+ run(cmd)', '+ undo(): bool'], 'The invoker. Runs a command and pushes it on a stack; undo pops and reverses. It never learns what a command does.', ['Add a second stack for redo.', 'Cap the stack size for long sessions.']),
            C('cmd', 'Command', 'interface', [], ['+ execute()', '+ undo()'], 'The uniform contract that lets anything be queued, logged or undone.'),
            C('app', 'Append', 'class', ['- editor: Editor', '- text: str'], ['+ execute()', '+ undo()'], 'Adds text; undo removes the same number of characters.'),
            C('del', 'DeleteLast', 'class', ['- editor: Editor', '- n: int', '- removed: str'], ['+ execute()', '+ undo()'], 'Saves the removed text during execute, since undo cannot work without it.'),
            C('ed', 'Editor', 'class', ['+ text: str'], [], 'The receiver: does the real work when a command calls it.')
          ],
          relations: [{ from: 'hist', to: 'cmd', type: 'aggregates', fromMult: '1', toMult: '*' }, { from: 'app', to: 'cmd', type: 'implements' }, { from: 'del', to: 'cmd', type: 'implements' }, { from: 'app', to: 'ed', type: 'associates' }, { from: 'del', to: 'ed', type: 'associates' }] } },
      { title: 'Code',
        md: 'Run two appends and a delete, then undo three times and the text returns to empty; a fourth undo reports that nothing is left. The demo in the source asserts exactly that sequence.',
        viz: codeViz('command', 'Commands with undo') },
      { title: 'Trade-offs and pitfalls',
        md: '- **Use it when** you need undo or redo, queuing or scheduling, logging or replay of actions, macros, or to decouple the trigger of an action from its execution (UI to logic).\n- **Cost:** a class per action, which is heavy for simple callbacks. Where a lambda is enough (single-method, no undo), use it.\n- **Undo needs enough information.** Store the previous value or the inverse operation. For big state, snapshot (Memento) may be cheaper than inverting every command.\n- **Commands must be repeatable and ordered.** If `execute` depends on state that changed since creation, replaying or redoing can produce a different result. Capture parameters at creation.\n- **Redo and branching:** after an undo, a new command usually clears the redo stack.\n- **Persistence and distribution:** serializable commands are the basis of job queues, write-ahead logs and event sourcing, but they must be idempotent or deduplicated if delivery can repeat.\n- **Command versus Strategy:** a strategy is *how* to do something and is usually long-lived; a command is *one specific request*, often short-lived, with its parameters baked in.' }
    ],
    takeaways: ['Command = a request as an object with execute() and usually undo().', 'The invoker handles history and queuing without knowing what commands do.', 'Undo needs the command to remember what it changed.', 'It is the basis of undo stacks, job queues, macros and audit logs.'],
    quiz: mix([
      { kind: 'concept', q: 'What is the central idea of Command?', choices: ['Represent a request as an object so it can be queued, logged or undone', 'Share one instance globally', 'Wrap an incompatible API', 'Notify listeners of changes'], answer: 0, explain: 'Making the action a value is what enables history, queuing and replay.' },
      { kind: 'concept', q: 'Why does `DeleteLast` store the removed text during `execute()`?', choices: ['Without it, undo cannot restore what was deleted', 'To make execute faster', 'To log to the console', 'Because strings are immutable'], answer: 0, explain: 'Undo needs the information that execute destroys. Capture it at execution time.' },
      { kind: 'concept', q: 'In Command, which class knows how to do the real work?', choices: ['The receiver (for example the editor)', 'The invoker', 'The client', 'The Command interface'], answer: 0, explain: 'Concrete commands call the receiver; the invoker only runs commands and keeps history.' },
      { kind: 'concept', q: 'How do you implement redo on top of an undo stack?', choices: ['Move undone commands onto a second stack and clear it when a new command runs', 'Run undo twice', 'Store the whole application state', 'You cannot'], answer: 0, explain: 'Redo replays what was undone. A new action invalidates the redo branch, so the redo stack is cleared.' },
      { kind: 'concept', q: 'When is a plain function or lambda better than a Command class?', choices: ['A simple callback with no undo, history or serialization needs', 'When you need undo support', 'When commands must be saved to disk', 'When you need to batch commands into macros'], answer: 0, explain: 'The pattern is the idea; a closure can play the command role when there are no extra requirements.' },
      { kind: 'concept', q: 'A command queue may deliver the same command twice after a crash. What property helps?', choices: ['Idempotence, or deduplication by command id', 'Making the command a singleton', 'Using inheritance', 'Disabling undo'], answer: 0, explain: 'Repeated delivery is normal in distributed queues. Commands that can be applied twice safely, or are deduplicated, avoid double effects.' },
      { kind: 'concept', q: 'How does Command differ from Strategy?', choices: ['A command is one specific request with its parameters, often short-lived; a strategy is a reusable algorithm', 'Command has no interface', 'Strategy supports undo', 'They are the same'], answer: 0, explain: 'Both are objects wrapping behavior, but a command captures a particular action to be executed, stored or reversed later.' }
    ]),
    flashcards: [
      { id: 'command-def', front: 'Define the Command pattern.', back: 'Encapsulate a request as an object (execute, usually undo) so it can be parameterized, queued, logged, replayed or undone.' },
      { id: 'command-roles', front: 'Roles in Command?', back: 'Command interface, concrete commands, receiver (does the work), invoker (runs commands and keeps history), and the client that creates commands.' },
      { id: 'command-undo', front: 'What must a command store to support undo?', back: 'Whatever execute destroys or changes, such as the removed text or the previous value, or the inverse operation.' },
      { id: 'command-uses', front: 'Where is Command used in real systems?', back: 'Undo/redo stacks, job and task queues, macros, transaction and audit logs, event sourcing, and thread pool tasks.' }
    ]
  },
  {
    id: 'lld-when-not-patterns', title: 'When not to use design patterns', group: G,
    hook: 'Patterns are solutions to specific recurring problems. Here is how to tell when you have the problem, and when you are just decorating.',
    keywords: 'over engineering pattern abuse yagni premature abstraction simplicity rule of three golden hammer anti pattern interview',
    sections: [
      { title: 'Patterns are named solutions, not goals',
        md: 'A design pattern is a **named, reusable solution to a recurring design problem in a particular context**. The name is a shared vocabulary ("use a Strategy here"), and the solution comes with known trade-offs. The value is in recognizing the problem, not in using the pattern.\n\nBeginners often reverse this: they learn the catalog, then look for places to apply it. The result is code with an `AbstractSingletonProxyFactoryBean` where a function would do: more files, more indirection, no extra flexibility, and readers who must learn your invented architecture before they can fix a bug.\n\nThe test for any pattern: **name the concrete change it makes cheap.** "A new shipping rule is one new class" is a reason. "It is good practice" is not.' },
      { title: 'Signs you are over-applying',
        md: '- **One implementation behind an interface**, with no test need and no second one in sight.\n- **A factory, builder or strategy for something with two cases** that never change.\n- **Pattern names in class names** (`UserManagerFactoryImpl`) that tell you the structure but not the purpose.\n- **Flexibility nobody asked for**: configuration for a value that never varies, plugin hooks nobody plugs into.\n- **Reading cost**: to follow one request you must open seven files.\n- **Singleton for convenience** because passing the object around felt tedious (see the Singleton page).\n- **Inheritance hierarchies** built to share three lines, where a function call would do.\n\nThese all pay the cost of indirection up front for a benefit that may never arrive. Speculative generality is a recognized code smell, and the principle that counters it is **YAGNI** ("you aren\'t gonna need it").' },
      { title: 'A simpler default',
        md: 'Use this order when a design question comes up:\n\n1. **Write the plain version.** A function, a data class, a switch. Make it correct and tested.\n2. **Wait for the second and third case.** When the third variation appears, the shape of the abstraction is visible (rule of three). Refactor then: tests make it safe.\n3. **Pick the lightest tool that fits.** A function parameter often replaces Strategy or Command; a dictionary of functions often replaces a Factory; keyword arguments often replace Builder; a module-level object often replaces Singleton; a closure is a tiny Command.\n4. **Apply a pattern when you can name its payoff** and the cost of adding it later is high, for example at a public API or a module boundary that many callers depend on.\n\nLanguage features absorb many patterns. First-class functions, lambdas, enums with exhaustive matching, records and data classes, decorators and context managers make heavyweight versions unnecessary. Know the idea; use the local idiom.' },
      { title: 'What to say in an interview',
        md: 'Interviewers prefer a coherent model with **two or three well-justified patterns** over a catalog tour. A good habit is to say both the choice and the non-choice:\n\n- "Pricing varies by vehicle type and may gain weekend rates, so I will hide it behind a `PricingStrategy`."\n- "I considered a factory for vehicles, but there are three types and a constructor call is clear, so I will not add one yet."\n- "I would normally inject the clock instead of using a singleton, so tests control time."\n\nAsk "what changes?" before naming any pattern. If the interviewer asks for extensibility, show where a pattern would go and what it would cost. Being able to explain why you did **not** use one is a strong signal.' }
    ],
    takeaways: ['A pattern is justified by a concrete change it makes cheap, not by being in the catalog.', 'Signs of overuse: single-implementation interfaces, factories for two cases, pattern names in class names.', 'Write the plain version, refactor at the third case, and prefer language features like functions and enums.', 'In interviews, justify a few patterns and say what you chose not to abstract.'],
    quiz: mix([
      { kind: 'concept', q: 'What is the best justification for adding a design pattern?', choices: ['It makes a specific, likely change cheap or a recurring problem simple', 'It is in the Gang of Four book', 'It makes the code look professional', 'It adds more classes for future flexibility'], answer: 0, explain: 'A pattern is a solution to a problem. If you cannot name the change it makes cheap, you are probably speculating.' },
      { kind: 'concept', q: 'Which is a sign of over-engineering?', choices: ['An interface with a single implementation, no test seam and no planned second one', 'A function with a clear name', 'A class that does one thing', 'A test that uses a fake'], answer: 0, explain: 'The indirection costs reading time and brings no benefit until a second implementation or a test need appears.' },
      { kind: 'concept', q: 'What does the "rule of three" suggest?', choices: ['Wait for the third similar case before extracting an abstraction', 'Every class needs three methods', 'Use three patterns per design', 'Three layers of inheritance are ideal'], answer: 0, explain: 'One case is specific, two may be a coincidence, three shows the real shape of what varies.' },
      { kind: 'concept', q: 'In a language with first-class functions, what often replaces a Strategy class?', choices: ['A function passed as an argument', 'A singleton', 'A deeper inheritance tree', 'A global variable'], answer: 0, explain: 'When the interface is one method, a function carries the same behavior with less ceremony.' },
      { kind: 'concept', q: 'What does YAGNI stand for and mean?', choices: ['You aren\'t gonna need it: do not build features or flexibility before they are needed', 'Yet another generic naming idea', 'Your abstractions get nested infinitely', 'You always generate new interfaces'], answer: 0, explain: 'YAGNI counters speculative generality. Add structure when real requirements demand it.' },
      { kind: 'concept', q: 'In an LLD interview, which approach is strongest?', choices: ['Use a few patterns, justify each by what changes, and say what you chose not to abstract', 'Apply as many patterns as you can name', 'Avoid patterns entirely', 'Memorize class names from the catalog'], answer: 0, explain: 'Interviewers look for judgment. Explaining a deliberate non-choice shows you understand the trade-off.' },
      { kind: 'concept', q: 'A colleague wraps a three-line helper in a Factory, a Builder and an interface. What is the likely cost?', choices: ['More files and indirection to read, with no extra flexibility actually used', 'Faster execution', 'Better testing for free', 'Lower memory usage'], answer: 0, explain: 'Each layer adds something to learn and navigate. Without a real variation, it is pure overhead.' }
    ]),
    flashcards: [
      { id: 'notpat-test', front: 'Test for whether to use a design pattern?', back: 'Can you name the concrete change it makes cheap or the recurring problem it solves here? If not, skip it.' },
      { id: 'notpat-rule3', front: 'What is the rule of three?', back: 'Do not abstract on the first or second similar case. At the third, the real axis of variation is visible, and tests make the refactor safe.' },
      { id: 'notpat-smells', front: 'Signs you are over-applying patterns?', back: 'Single-implementation interfaces, a factory or strategy for two stable cases, pattern names in class names, and many files to follow one request.' },
      { id: 'notpat-lang', front: 'Which patterns do language features often replace?', back: 'Strategy and Command by functions and lambdas, Factory by a map of constructors, Builder by keyword or option arguments, Singleton by a module-level object or injection.' }
    ]
  }
);
})();
