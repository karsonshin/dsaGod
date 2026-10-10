/* Low-level design fundamentals: the SOLID principles. Schema: data/sd/schema.md. Code samples live in data/sd/lld-code-solid.js (generated from tested sources). */
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
      var n = q.choices.length, k = (i * 3 + 1) % n, c = new Array(n);
      q.choices.forEach(function (x, j) { c[(j + k) % n] = x; });
      q.choices = c; q.answer = (q.answer + k) % n; return q;
    });
  }
  var G = 'Low-level design';

  SD.fundamentals.push({
    id: 'lld-solid', title: 'SOLID principles', group: G,
    hook: 'Five design heuristics that keep classes easy to change, each shown as a violation, the fix, and a before-and-after class diagram.',
    keywords: 'solid srp ocp lsp isp dip single responsibility open closed liskov substitution interface segregation dependency inversion injection object oriented design lld',
    sections: [
      { title: 'What SOLID is for',
        md: 'SOLID is a set of five heuristics for deciding where behavior should live in an object-oriented design. They are not laws and no tool enforces them. Their shared goal is that **a change request touches as little code as possible and cannot break unrelated code**.\n\n| Letter | Principle | One-line test |\n|---|---|---|\n| S | Single Responsibility | Does this class have more than one reason to change? |\n| O | Open/Closed | Can I add a new case without editing code that already works? |\n| L | Liskov Substitution | Can a subtype stand in for its parent without callers noticing? |\n| I | Interface Segregation | Does any implementer have to fake methods it cannot support? |\n| D | Dependency Inversion | Does my business logic construct or import its own infrastructure? |\n\nEach section below shows a small, realistic **violation**, then the **fix**, with the same example in four languages and a class diagram of each state. The code is the point: run it, then try adding a requirement and see which version resists.\n\nIn an interview, name the principle only when it explains a decision you are already making ("I split printing from the invoice because they change for different reasons"). Reciting the acronym without a concrete consequence earns nothing.' },

      { id: 'srp-bad', title: 'Single Responsibility: the violation',
        md: 'A class should have **one reason to change**, meaning one stakeholder or one axis of change. The `Invoice` below does three jobs: it holds the data and totals (finance rules), it formats text (a layout decision), and it saves itself (a storage decision).\n\nNone of these is wrong alone. The trouble is that they share one class, so a change to the layout means re-testing the totals, and two people editing "invoice" for unrelated reasons collide in the same file.',
        diagram: { title: 'Before: Invoice formats and persists itself',
          classes: [
            C('inv', 'Invoice', 'class', ['- customer: str', '- items: list'], ['+ total(): int', '+ render(): str', '+ save(db)'], 'Three reasons to change in one class: pricing rules, text layout, and storage.', ['Easy to write first, expensive to change later.', 'Testing totals drags in formatting and storage.']),
            C('db', 'Database', 'class', ['- rows: map'], ['+ put(key, text)'], 'The storage detail Invoice reaches into directly.')
          ],
          relations: [{ from: 'inv', to: 'db', type: 'depends', label: 'save' }] },
        viz: codeViz('srp-bad', 'Invoice doing three jobs'),
        caption: 'Select a class to see why it is a problem. Switch the code language with the buttons in the code header.' },
      { id: 'srp-good', title: 'Single Responsibility: the fix',
        md: 'Split by reason to change. `Invoice` keeps the data and the total. `InvoicePrinter` owns presentation. `InvoiceStore` owns persistence. A new output format, such as PDF or HTML, becomes a new printer; moving to a real database touches only the store.\n\nThe cost is more classes and one more line at the call site that wires them together. That is the usual trade: a little ceremony now for local changes later. Do not split a class that has only one axis of change, even if it is long.',
        diagram: { title: 'After: three classes, three reasons to change',
          classes: [
            C('inv', 'Invoice', 'class', ['- customer: str', '- items: list'], ['+ total(): int'], 'Pure business data and rules. It knows nothing about text or storage.'),
            C('printer', 'InvoicePrinter', 'class', [], ['+ render(invoice): str'], 'Changes when the layout changes, and only then.', ['Add PdfPrinter or HtmlPrinter without touching Invoice.']),
            C('store', 'InvoiceStore', 'class', ['- rows: map'], ['+ save(customer, text)'], 'Changes when the storage changes, and only then.'),
            C('db', 'Database', 'class', [], ['+ put(key, text)'], 'Now hidden behind the store.')
          ],
          relations: [{ from: 'printer', to: 'inv', type: 'depends', label: 'reads' }, { from: 'store', to: 'db', type: 'depends', label: 'writes' }] },
        viz: codeViz('srp-good', 'Invoice, printer and store') },

      { id: 'ocp-bad', title: 'Open/Closed: the violation',
        md: 'Software entities should be **open for extension and closed for modification**: adding behavior should mean adding code, not editing code that already works and is already tested.\n\nHere `area` branches on a type tag. Each new shape means opening this function, adding a branch, and re-running every test of every other shape. In a real system that function is called from many places, and the same `if/else` chain on the same tag tends to be copied into rendering, serialization and validation too.',
        diagram: { title: 'Before: one calculator that knows every shape',
          classes: [
            C('calc', 'AreaCalculator', 'class', [], ['+ area(shape): float'], 'Contains the type switch. It must change for every new shape.', ['Missing a branch is a runtime error, not a compile error.']),
            C('circle', 'Circle', 'class', ['+ r: float'], [], 'Plain data. No behavior of its own.'),
            C('rect', 'Rect', 'class', ['+ w: float', '+ h: float'], [], 'Plain data. No behavior of its own.')
          ],
          relations: [{ from: 'calc', to: 'circle', type: 'depends' }, { from: 'calc', to: 'rect', type: 'depends' }] },
        viz: codeViz('ocp-bad', 'A type switch in area()') },
      { id: 'ocp-good', title: 'Open/Closed: the fix',
        md: 'Move the varying behavior behind an abstraction. Each shape knows how to compute its own area, and the calculator only talks to `Shape`. A `Triangle` is added as a new class (see the demo in the runnable source) and `totalArea` is untouched.\n\nThis is the **Strategy** idea applied to a family of types. A caution: you cannot close a design against every future change. Pick the axis you expect to vary (here, shape kinds) and be honest that a new operation, such as `perimeter`, would now touch every shape. Closing too early is just speculative generality.',
        diagram: { title: 'After: new shapes plug in behind Shape',
          classes: [
            C('shape', 'Shape', 'interface', [], ['+ area(): float'], 'The stable abstraction the rest of the code depends on.'),
            C('circle', 'Circle', 'class', ['- r: float'], ['+ area(): float'], 'Owns its own formula.'),
            C('rect', 'Rect', 'class', ['- w: float', '- h: float'], ['+ area(): float'], 'Owns its own formula.'),
            C('tri', 'Triangle', 'class', ['- b: float', '- h: float'], ['+ area(): float'], 'The extension: a new file, no edits elsewhere.'),
            C('calc', 'AreaCalculator', 'class', [], ['+ total(shapes): float'], 'Closed for modification: it only calls area().')
          ],
          relations: [{ from: 'circle', to: 'shape', type: 'implements' }, { from: 'rect', to: 'shape', type: 'implements' }, { from: 'tri', to: 'shape', type: 'implements' }, { from: 'calc', to: 'shape', type: 'depends' }] },
        viz: codeViz('ocp-good', 'Shapes behind an interface') },

      { id: 'lsp-bad', title: 'Liskov Substitution: the violation',
        md: 'If `S` is a subtype of `T`, code written for `T` must keep working when handed an `S`. Inheritance is a **behavioral** promise, not just a "is a" sentence from geometry class.\n\nA mutable `Square` that keeps its sides equal breaks the promise `Rectangle` makes: that setting the width leaves the height alone. `stretch` sets 5 by 2 and expects an area of 10; with a square it gets 4. Nothing failed to compile. The type system cannot see the broken contract.\n\nOther common breaks: a subclass that throws where the parent did not, strengthens preconditions, or returns values the parent promised never to return.',
        diagram: { title: 'Before: Square inherits Rectangle\'s mutators',
          classes: [
            C('rect', 'Rectangle', 'class', ['# w: int', '# h: int'], ['+ setWidth(w)', '+ setHeight(h)', '+ area(): int'], 'Promises that width and height vary independently.'),
            C('sq', 'Square', 'class', [], ['+ setWidth(w)', '+ setHeight(h)'], 'Overrides both setters to change both sides, which violates that promise.', ['Callers must now check "is it a Square?", defeating polymorphism.']),
            C('res', 'Resizer', 'class', [], ['+ stretch(r): int'], 'Written against Rectangle\'s contract and surprised by Square.')
          ],
          relations: [{ from: 'sq', to: 'rect', type: 'inherits' }, { from: 'res', to: 'rect', type: 'depends' }] },
        viz: codeViz('lsp-bad', 'Square breaks Rectangle\'s contract') },
      { id: 'lsp-good', title: 'Liskov Substitution: the fix',
        md: 'Stop forcing the inheritance. Both shapes share what is **truly common**, the `area()` contract, through an interface, and neither pretends to share the setters. With immutable shapes (width and height fixed at construction) the original hierarchy would also have been safe, because there is no mutator to break.\n\nA practical check: write the parent\'s tests once and run them against every subclass. If a subclass needs to skip or special-case a test, the hierarchy is wrong. "Prefer composition over inheritance" often falls out of LSP problems.',
        diagram: { title: 'After: siblings behind a narrow interface',
          classes: [
            C('shape', 'Shape', 'interface', [], ['+ area(): int'], 'The only promise both types really share.'),
            C('rect', 'Rectangle', 'class', ['- w: int', '- h: int'], ['+ area(): int'], 'Independent width and height.'),
            C('sq', 'Square', 'class', ['- side: int'], ['+ area(): int'], 'One side. No setters to contradict.')
          ],
          relations: [{ from: 'rect', to: 'shape', type: 'implements' }, { from: 'sq', to: 'shape', type: 'implements' }] },
        viz: codeViz('lsp-good', 'Rectangle and Square as siblings') },

      { id: 'isp-bad', title: 'Interface Segregation: the violation',
        md: 'No client should be forced to depend on methods it does not use. A "fat" interface couples every implementer to every capability.\n\n`Machine` bundles print, scan and fax. `BasicPrinter` can only print, so it implements the other two by throwing. Every caller now has to wonder whether a given `Machine` really supports `scan`, and adding a fourth method (say `staple`) forces edits and recompiles in every implementer, including ones that can never staple.',
        diagram: { title: 'Before: one interface for every device',
          classes: [
            C('m', 'Machine', 'interface', [], ['+ print(doc)', '+ scan()', '+ fax(doc)'], 'Fat interface: three capabilities in one contract.', ['Every new capability changes every implementer.']),
            C('bp', 'BasicPrinter', 'class', [], ['+ print(doc)', '+ scan()', '+ fax(doc)'], 'Can only print, but must provide scan and fax, so it throws.'),
            C('aio', 'AllInOne', 'class', [], ['+ print(doc)', '+ scan()', '+ fax(doc)'], 'The one device that does everything.')
          ],
          relations: [{ from: 'bp', to: 'm', type: 'implements' }, { from: 'aio', to: 'm', type: 'implements' }] },
        viz: codeViz('isp-bad', 'A fat Machine interface') },
      { id: 'isp-good', title: 'Interface Segregation: the fix',
        md: 'Split the interface by role. Clients depend on the smallest role they need: `print_report` takes a `Printer` and works with both devices; a scanning feature takes a `Scanner`. `BasicPrinter` simply does not claim to scan, and the compiler (in Java and C++) stops anyone passing it where a scanner is required.\n\nSmall interfaces also make test doubles trivial. The limit: do not go to one method per interface everywhere. Group methods that always change and get used together.',
        diagram: { title: 'After: role interfaces',
          classes: [
            C('p', 'Printer', 'interface', [], ['+ print(doc)'], 'The print role.'),
            C('s', 'Scanner', 'interface', [], ['+ scan()'], 'The scan role.'),
            C('bp', 'BasicPrinter', 'class', [], ['+ print(doc)'], 'Implements only what it can do.'),
            C('aio', 'AllInOne', 'class', [], ['+ print(doc)', '+ scan()'], 'Implements both roles.')
          ],
          relations: [{ from: 'bp', to: 'p', type: 'implements' }, { from: 'aio', to: 'p', type: 'implements' }, { from: 'aio', to: 's', type: 'implements' }] },
        viz: codeViz('isp-good', 'Printer and Scanner roles') },

      { id: 'dip-bad', title: 'Dependency Inversion: the violation',
        md: 'High-level policy should not depend on low-level detail; **both should depend on an abstraction**, and the abstraction should be owned by the high-level side.\n\n`OrderService` is the business rule ("an order must have a positive amount, then it is stored"). It builds its own `MySqlOrderRepo`, so it cannot be constructed without a database, cannot be unit-tested without one, and switching storage means editing the service. The arrow of dependency points from policy to detail.\n\nNote the difference between this and *dependency injection*: DIP is the design rule, injection (passing the dependency in) is the usual technique that satisfies it.',
        diagram: { title: 'Before: the service builds its own database client',
          classes: [
            C('svc', 'OrderService', 'class', [], ['+ place(id, amount)'], 'Business rules, tied to one storage technology.', ['Needs a live database to test.']),
            C('mysql', 'MySqlOrderRepo', 'class', ['- connection'], ['+ save(id, amount)'], 'A low-level detail created inside the high-level class.')
          ],
          relations: [{ from: 'svc', to: 'mysql', type: 'composes' }] },
        viz: codeViz('dip-bad', 'OrderService builds MySqlOrderRepo') },
      { id: 'dip-good', title: 'Dependency Inversion: the fix',
        md: 'Define `OrderRepository` as an interface that the service needs, and pass an implementation in through the constructor. Production wires `MySqlOrderRepo`; tests wire `InMemoryOrderRepo`. The source-code dependency now points from the detail **up** to the abstraction, which is the "inversion".\n\nThe wiring happens at the edge of the program (a `main`, a framework container, or a factory). You do not need a DI framework to do this: a constructor parameter is enough. Be careful with the opposite mistake of putting an interface in front of every class; add one where there is a real second implementation, a test seam, or a module boundary.',
        diagram: { title: 'After: both sides depend on the interface',
          classes: [
            C('repo', 'OrderRepository', 'interface', [], ['+ save(id, amount)'], 'The abstraction, defined by what the service needs.'),
            C('svc', 'OrderService', 'class', ['- repo: OrderRepository'], ['+ place(id, amount)'], 'Policy only. Receives its repository from outside.', ['Constructor injection makes the dependency explicit and immutable.']),
            C('mysql', 'MySqlOrderRepo', 'class', [], ['+ save(id, amount)'], 'Production implementation.'),
            C('mem', 'InMemoryOrderRepo', 'class', ['- rows: map'], ['+ save(id, amount)'], 'Test implementation: fast, no setup.')
          ],
          relations: [{ from: 'svc', to: 'repo', type: 'associates' }, { from: 'mysql', to: 'repo', type: 'implements' }, { from: 'mem', to: 'repo', type: 'implements' }] },
        viz: codeViz('dip-good', 'OrderService depends on an interface') },

      { id: 'using', title: 'Using SOLID without overdoing it',
        md: '- **Start from a change, not a principle.** Ask what is likely to change (new shape kinds, a new storage, a new notification channel) and shape the design around that. Principles explain a design you have already reasoned toward.\n- **Rule of three.** A second case is a coincidence; the third justifies the abstraction. One `if` is cheaper than a hierarchy.\n- **The principles pull against each other.** More classes (SRP, ISP) cost readability; more abstractions (OCP, DIP) cost indirection. Judge by whether the next likely change gets easier.\n- **They fit best at module boundaries.** A script, a data class or a one-off job rarely needs them.\n- **In an LLD interview**, the safest sequence is: list entities, give each one clear responsibility (SRP), hide the thing that varies behind an interface (OCP, DIP), and keep interfaces small (ISP). Mention LSP when you use inheritance, and justify why the subtype really is substitutable.' }
    ],
    takeaways: [
      'SRP: group code by reason to change, not by noun.',
      'OCP: put the varying behavior behind an interface so new cases are new classes, not edits.',
      'LSP: a subtype must honor the parent\'s behavioral contract, not only its method signatures.',
      'ISP: many small role interfaces beat one fat one; no implementer should fake a method.',
      'DIP: policy depends on an abstraction it owns; inject the detail from outside.',
      'Apply them where change is likely, and skip them where it is not.'
    ],
    quiz: mix([
      { kind: 'concept', q: 'A `Report` class computes figures, formats them as HTML, and emails the result. Which principle does this most directly violate?', choices: ['Single Responsibility', 'Liskov Substitution', 'Interface Segregation', 'Open/Closed'], answer: 0, explain: 'Calculation rules, presentation and delivery change for different reasons and for different people, so they should live in separate classes.' },
      { kind: 'concept', q: 'Adding a new payment method forces you to edit a `switch` inside `PaymentService.pay()`. What is the usual fix?', choices: ['Put each method behind a `PaymentMethod` interface and let the service call it', 'Make `pay()` private', 'Move the switch into a base class', 'Use a global variable for the method name'], answer: 0, explain: 'That is Open/Closed: the varying behavior moves into implementations of an abstraction, so a new method is a new class and the service stays unchanged.' },
      { kind: 'concept', q: 'Which statement best captures the Liskov Substitution Principle?', choices: ['Code written against the parent type keeps working correctly when given any subtype', 'A subclass may add as many methods as it likes', 'Every class should have a parent', 'Subclasses must not override methods'], answer: 0, explain: 'LSP is about behavior: preconditions cannot be strengthened, postconditions cannot be weakened, and invariants must hold. Compiling is not enough.' },
      { kind: 'concept', q: 'A subclass overrides `save()` to throw `UnsupportedOperationException`. Callers of the parent type now crash. What is the best reading?', choices: ['It violates LSP and the hierarchy probably needs reshaping', 'It is fine because the method is still declared', 'It is an Open/Closed violation only', 'It proves the parent should be final'], answer: 0, explain: 'The subtype refuses a behavior the parent promised. Either split the interface (ISP) or stop inheriting.' },
      { kind: 'concept', q: 'What is the key symptom of an Interface Segregation violation?', choices: ['Implementers must provide methods they cannot meaningfully support', 'The interface has more than one implementer', 'The interface has no methods', 'Two classes share a method name'], answer: 0, explain: 'Stub methods that throw or do nothing show the interface bundles roles that not every client or implementer needs.' },
      { kind: 'concept', q: 'What is the relationship between Dependency Inversion and dependency injection?', choices: ['DIP is the design rule, injection is a common technique for following it', 'They are two names for the same thing', 'Injection requires a framework, DIP does not', 'DIP only applies to databases'], answer: 0, explain: 'DIP says policy and detail should both depend on an abstraction. Passing the dependency in (a constructor argument is enough) is how you usually realize it.' },
      { kind: 'concept', q: 'Why is `OrderService(OrderRepository repo)` easier to unit-test than a service that calls `new MySqlOrderRepo()` internally?', choices: ['A test can pass an in-memory fake, so no database is needed', 'Constructors run faster than field initializers', 'Interfaces make code compile faster', 'It removes the need for assertions'], answer: 0, explain: 'The seam lets the test substitute a fast, deterministic implementation. The hard-wired version forces every test to reach the real database.' },
      { kind: 'concept', q: 'A mutable `Square extends Rectangle` overrides `setWidth` to also change the height. Which is the best repair?', choices: ['Stop inheriting: make both implement a `Shape` with `area()`, ideally immutable', 'Make `setHeight` throw in Square', 'Add a type check for Square inside the callers', 'Make Rectangle final'], answer: 0, explain: 'Throwing or special-casing callers keeps the broken contract. Separating the types removes the false substitution.' },
      { kind: 'concept', q: 'When is applying Open/Closed most likely to be over-engineering?', choices: ['When there is one implementation and no sign of a second axis of change', 'When two teams edit the same file', 'When a switch has five branches that keep growing', 'When you already have an interface'], answer: 0, explain: 'An interface with a single implementation and no expected variation adds indirection and no benefit. Wait for the second or third case.' },
      { kind: 'concept', q: 'Which pair of principles most often pushes you toward many small classes and interfaces, and what is the main risk?', choices: ['SRP and ISP; too much indirection and boilerplate', 'LSP and OCP; slower compilation', 'DIP and LSP; memory use', 'OCP and DIP; unreadable names'], answer: 0, explain: 'Splitting by responsibility and by role gives small, focused types. Overdone, readers must jump across many files to follow one flow.' }
    ]),
    flashcards: [
      { id: 'solid-letters', front: 'What do the letters in SOLID stand for?', back: 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.' },
      { id: 'srp-test', front: 'Practical test for the Single Responsibility Principle?', back: 'Does the class have more than one reason to change (more than one stakeholder or axis of change)? If so, split it.' },
      { id: 'ocp-how', front: 'How do you make code open for extension but closed for modification?', back: 'Hide the part that varies behind an interface or abstract type. New behavior is a new implementation; the existing, tested code is not edited.' },
      { id: 'ocp-warning', front: 'What is the risk of applying Open/Closed too early?', back: 'You guess the wrong axis of change and add abstractions with a single implementation. Wait until a second or third real case shows how things vary.' },
      { id: 'lsp-rule', front: 'State the Liskov Substitution Principle in practical terms.', back: 'Anything that works with the parent type must still work correctly with any subtype. Subtypes may not strengthen preconditions, weaken postconditions, or break invariants.' },
      { id: 'lsp-square', front: 'Why does a mutable Square break a Rectangle hierarchy?', back: 'Rectangle promises setting the width leaves the height alone. Square must change both, so code that sets 5 by 2 and expects area 10 gets 4. Use sibling types behind a Shape interface.' },
      { id: 'isp-smell', front: 'Smell that signals an Interface Segregation violation?', back: 'Implementers with methods that throw "unsupported" or do nothing. Split the interface into role-based interfaces.' },
      { id: 'dip-def', front: 'What does the Dependency Inversion Principle say?', back: 'High-level modules should not depend on low-level modules; both should depend on abstractions, and the abstraction is owned by the high-level side.' },
      { id: 'dip-vs-di', front: 'Dependency inversion versus dependency injection?', back: 'Inversion is the design principle (depend on abstractions). Injection is the technique of passing dependencies in, for example through a constructor.' },
      { id: 'solid-interview', front: 'How should you use SOLID in an LLD interview?', back: 'Cite a principle only to justify a concrete decision (for example, hiding a varying rule behind an interface), and say what change it makes easy. Do not recite the acronym.' }
    ]
  });
})();
