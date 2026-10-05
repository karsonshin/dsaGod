/* Low-level design: library management system. The code under "Code" was compiled and run (Python, Node, javac, g++ -std=c++17) before it was pasted here. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.lld = SD.lld || [];
  SD.lld.push({
    id: 'library-system',
    title: 'Design a library management system',
    short: 'Books versus copies, loans, a hold queue, late fines and notifications: good practice for modeling real-world state.',
    difficulty: 'Medium',
    time: '50 min',
    tags: ['Observer', 'Strategy', 'Domain modeling', 'Queues'],
    prompt: 'Design a library system where members borrow books, queue for books that are out, pay late fines, and are told when a held book is ready.',

    requirements: {
      functional: [
        'Model a **book** (the title: ISBN, title, author) separately from a **copy** (one physical item that can be lent). A library owns many copies of one book.',
        'Members **check out** a copy for 14 days. At most 3 loans per member at a time.',
        'When no copy is free, a member can **place a hold**. Holds on a title are served first come, first served.',
        'On **return**, a late return creates a **fine** (a per-day rate with a cap). If a hold is waiting, the copy is shelved for the first member in the queue and that member is **notified**.',
        'A member with unpaid fines cannot borrow. Paying a fine clears the block.',
        '**Search** by title, author or ISBN (case-insensitive).'
      ],
      nonFunctional: [
        'Fairness: a held copy cannot be taken by anyone but the member it is reserved for.',
        'No double loans: one copy is lent to at most one member, even with concurrent checkouts.',
        'The fine rule and the notification channel are replaceable without touching the loan flow.',
        'Day numbers are passed in, so lateness is testable.'
      ],
      assumptions: [
        'One branch, one catalogue.',
        'A member holds a title at most once at a time.',
        'A hold stays reserved until the member collects it; expiry is covered as an extension.'
      ],
      outOfScope: [
        'Renewals, inter-library loans, e-books, and payment handling.',
        'Real email or push delivery: the notifier is an interface with an in-memory implementation.'
      ],
      clarify: [
        { q: 'Is a book different from a copy?', a: 'Yes, and this is the key modeling question. A hold is on a title (any copy will do); a loan is on one specific copy. Modeling them as one thing makes holds impossible to express cleanly.' },
        { q: 'How are fines computed, and are they capped?', a: 'A per-day rate with a cap, as a strategy. Real libraries vary: some are fine-free, some vary by item type, and the interface absorbs that.' },
        { q: 'What does a hold do when a copy is returned?', a: 'The copy goes to the head of the queue and is reserved for that member; they are notified. Others cannot borrow it even if they are standing at the desk.' },
        { q: 'What if a member with fines tries to borrow?', a: 'Block the checkout until the fine is paid. State this rule explicitly because it is a policy choice and the interviewer may want a threshold.' },
        { q: 'Who needs to be told about events?', a: 'Members (hold ready, overdue). Say it is an Observer so adding SMS or a librarian dashboard is a new subscriber, not a change to the loan code.' }
      ]
    },

    classDiagram: {
      title: 'Library system class diagram',
      intro: 'The big idea is the split between **Book** (a title) and **BookCopy** (a physical item). Loans point at copies; holds point at titles. A **fine policy** and **observers** are the two plug-in points. Click a class for details.',
      classes: [
        { id: 'lib', name: 'Library', fields: ['- books: Map<isbn, Book>', '- copies: Map<id, BookCopy>', '- members: Map<id, Member>', '- holds: Map<isbn, Queue<Member>>', '- policy: FinePolicy', '- observers: Observer[]'], methods: ['+ checkout(member, isbn, day): Loan', '+ returnCopy(copyId, day): fine', '+ placeHold(member, isbn): position', '+ payFine(member, cents)', '+ search(query): Book[]'],
          detail: { why: 'The facade that enforces every rule: loan limit, fine block, hold priority. It is also the only place with a lock.', tradeoffs: ['A fat facade class; split into LoanService and HoldService if it grows.'], alternatives: ['Put the rules on Member and BookCopy; they would then need to know about each other.'], scale: 'Index copies by isbn to avoid scanning every copy on checkout.' } },
        { id: 'book', name: 'Book', fields: ['+ isbn: string', '+ title: string', '+ author: string'], methods: [],
          detail: { why: 'The title: shared catalogue data. Holds and search work at this level.', tradeoffs: ['Edition and format would need a second level (Work and Edition).'], alternatives: ['Copying title data onto every copy; wasteful and goes stale.'], scale: 'Search at scale needs an inverted index or a search service.' } },
        { id: 'copy', name: 'BookCopy', fields: ['+ id: string', '- status: CopyStatus', '- reservedFor: Member?'], methods: [],
          detail: { why: 'One physical item. Its status says whether it can be lent, and `reservedFor` implements fairness for holds.', tradeoffs: ['Status plus reservedFor is a tiny state machine kept as data.'], alternatives: ['A State class per status; overkill for three states.'], scale: 'n/a' } },
        { id: 'status', name: 'CopyStatus', kind: 'enum', fields: ['AVAILABLE', 'ON_LOAN', 'ON_HOLD'], methods: [],
          detail: { why: 'Available goes to on loan on checkout; on loan goes to available or on hold on return; on hold goes to on loan when the right member collects.', tradeoffs: ['Illegal transitions are guarded in the facade, not the type.'], alternatives: ['Lost and damaged statuses are natural additions.'], scale: 'n/a' } },
        { id: 'member', name: 'Member', fields: ['+ id: int', '+ name: string', '- loans: Loan[]', '- fines: cents'], methods: [],
          detail: { why: 'Who is borrowing, with their current loans and unpaid fines. Both drive checkout rules.', tradeoffs: ['Fines live on the member as a balance, not as individual records, which loses an audit trail.'], alternatives: ['A Fine entity per late return.'], scale: 'n/a' } },
        { id: 'loan', name: 'Loan', fields: ['+ copy: BookCopy', '+ member: Member', '+ due: day'], methods: [],
          detail: { why: 'Links a member to one copy with a due date. Lateness is computed from it at return.', tradeoffs: ['Closed loans are discarded; keep them in history if the library needs reports.'], alternatives: ['Store dueDate on the copy.'], scale: 'n/a' } },
        { id: 'fine', name: 'FinePolicy', kind: 'interface', fields: [], methods: ['+ fine(daysLate): cents'],
          detail: { why: 'Strategy for what lateness costs.', tradeoffs: ['Policies that depend on the item or the member need a richer argument.'], alternatives: ['A constant in Library.'], scale: 'n/a' } },
        { id: 'perday', name: 'PerDayFine', fields: ['- centsPerDay: int', '- cap: int'], methods: ['+ fine(daysLate)'],
          detail: { why: 'Rate times days late, capped, never negative.', tradeoffs: ['The cap protects members; some libraries remove it.'], alternatives: ['Flat fee, or fine-free.'], scale: 'n/a' } },
        { id: 'obs', name: 'Observer', kind: 'interface', fields: [], methods: ['+ notify(member, message)'],
          detail: { why: 'Observer: anything that wants to hear about library events (a hold is ready) subscribes without the library knowing who it is.', tradeoffs: ['Synchronous notify blocks the return call if a subscriber is slow; use a queue in production.'], alternatives: ['Calling an email service directly from `returnCopy`.'], scale: 'Fan-out to a queue and let workers send.' } },
        { id: 'inbox', name: 'InboxNotifier', fields: ['+ sent: Message[]'], methods: ['+ notify(member, message)'],
          detail: { why: 'An in-memory subscriber that records what it would send. A real one wraps email or push.', tradeoffs: ['Not durable.'], alternatives: ['An Email and an SMS subscriber.'], scale: 'n/a' } }
      ],
      relations: [
        { from: 'lib', to: 'book', type: 'composes', fromMult: '1', toMult: '*' },
        { from: 'book', to: 'copy', type: 'composes', fromMult: '1', toMult: '1..*' },
        { from: 'lib', to: 'member', type: 'aggregates', toMult: '*' },
        { from: 'member', to: 'loan', type: 'composes', fromMult: '1', toMult: '0..3' },
        { from: 'loan', to: 'copy', type: 'associates', toMult: '1' },
        { from: 'copy', to: 'status', type: 'depends' },
        { from: 'lib', to: 'fine', type: 'aggregates', label: 'uses' },
        { from: 'perday', to: 'fine', type: 'implements' },
        { from: 'lib', to: 'obs', type: 'aggregates', label: 'notifies' },
        { from: 'inbox', to: 'obs', type: 'implements' }
      ]
    },

    decisions: [
      { title: 'Book and BookCopy are different things',
        body: 'A **Book** is a title; a **BookCopy** is one physical item. Search and holds are about titles ("any copy of this book"); a loan and a return are about a specific copy. If you only model books, "3 copies, 2 out" has nowhere to live and a hold has no meaning.\n\n**Alternative:** one `Book` class with a `copiesAvailable` counter. It works for a toy and breaks the moment someone asks "which copy is overdue?" or "which one was damaged?".',
        tradeoffs: ['Two classes and an extra lookup.', 'Editions (hardcover, paperback) would add another level above the copy.'] },
      { title: 'Notifications use Observer', pattern: 'Observer',
        body: 'When a returned copy is handed to the next member, the library publishes "ready for you" to its subscribers. Email, SMS, a push service and the librarian dashboard are subscribers; the library never imports any of them. The in-memory `InboxNotifier` in the code is the test double that records messages.\n\n**Alternative:** call an email client inside `returnCopy`. That couples the loan flow to one channel and makes a failure to send abort the return.',
        tradeoffs: ['Synchronous callbacks mean a slow subscriber slows the return; put a queue behind real channels.', 'Observers see only what the event carries; keep messages small and explicit.'] },
      { title: 'Fines are computed by a Strategy', pattern: 'Strategy',
        body: '`FinePolicy.fine(daysLate)` isolates the rule that policy makers will keep changing (rates, caps, grace periods, fine-free youth cards). The library only asks "what do I charge" at return.\n\n**Alternative:** a constant in the loan code. Fine until the board votes for a grace period.',
        tradeoffs: ['The signature only sees days late; item-specific rates need the loan or copy passed in.'] },
      { title: 'Holds are handed over at return time, as a reservation on the copy',
        body: 'When a copy comes back and the title has a queue, the copy is not put on the shelf: it is marked `ON_HOLD` with `reservedFor = firstInQueue`, and that member is notified. `checkout` accepts a copy only if it is available, or on hold for *this* member. That makes the queue strictly fair and removes a race in which a walk-in grabs the copy before the member arrives.\n\n**Alternative:** put the copy back as available and rely on the notified member to be quick. Simple, and unfair.',
        tradeoffs: ['A reserved copy sits idle until collected; add an expiry that passes it to the next member.'] },
      { title: 'A facade enforces the rules; one lock keeps them true',
        body: 'The limit of 3 loans, the fine block, hold priority and "no double loan" are checked in `Library` under one lock, so two checkouts for the last copy cannot both succeed. Rules live in one place instead of being spread across Member and BookCopy.\n\n**Alternative:** let Member decide if it can borrow. It then needs to know about fines and the catalogue, which is how classes end up knowing everything.',
        tradeoffs: ['A coarse lock is fine for one branch; per-title locks if checkouts contend.'] }
    ],

    code: [
      { title: 'Library system: four languages, one driver each',
        note: 'Each file is complete and runs on its own. The driver covers a normal loan, the only copy being out, a two-person hold queue, an overdue fine (6 days at 25 cents), the notification to the first holder, the reserved copy refusing the second holder, the unpaid-fine block, the loan limit, the fine cap, search, and invalid returns and holds.',
        code: { py: String.raw`import threading
from abc import ABC, abstractmethod
from collections import deque
from enum import Enum

LOAN_DAYS, MAX_LOANS = 14, 3


class LibraryError(Exception):
    pass


class NoCopyAvailable(LibraryError):
    pass


class Status(Enum):
    AVAILABLE = 1
    ON_LOAN = 2
    ON_HOLD = 3          # shelved for the first member in the hold queue


class Book:                                  # the title: shared by every physical copy
    def __init__(self, isbn, title, author):
        self.isbn, self.title, self.author = isbn, title, author


class BookCopy:                              # one physical item that can be lent
    def __init__(self, copy_id, book):
        self.id, self.book, self.status, self.reserved_for = copy_id, book, Status.AVAILABLE, None


class Member:
    def __init__(self, member_id, name):
        self.id, self.name, self.loans, self.fines = member_id, name, [], 0   # fines in cents


class Loan:
    def __init__(self, copy, member, due):
        self.copy, self.member, self.due = copy, member, due


class Observer(ABC):                         # Observer: anything that wants to hear about library events
    @abstractmethod
    def notify(self, member, message): ...


class InboxNotifier(Observer):               # stand-in for email or push; records what it would send
    def __init__(self):
        self.sent = []

    def notify(self, member, message):
        self.sent.append((member.id, message))


class FinePolicy(ABC):                       # Strategy: what a late return costs
    @abstractmethod
    def fine(self, days_late): ...


class PerDayFine(FinePolicy):
    def __init__(self, cents_per_day, cap):
        self.rate, self.cap = cents_per_day, cap

    def fine(self, days_late):
        return min(self.cap, max(0, days_late) * self.rate)


class Library:
    def __init__(self, policy, observers=()):
        self.policy, self.observers = policy, list(observers)
        self.books, self.copies, self.members = {}, {}, {}
        self.holds = {}                      # isbn -> deque of members waiting, first come first served
        self.lock = threading.Lock()         # ponytail: one lock; lock per isbn if checkouts contend

    def add_book(self, book, n_copies):
        self.books[book.isbn] = book
        for i in range(n_copies):
            cid = f"{book.isbn}#{i + 1}"
            self.copies[cid] = BookCopy(cid, book)

    def join(self, member):
        self.members[member.id] = member

    def search(self, query):                 # ponytail: linear scan; inverted index when the catalogue is large
        q = query.lower()
        return [b for b in self.books.values() if q in b.title.lower() or q in b.author.lower() or q == b.isbn]

    def checkout(self, member, isbn, day):
        with self.lock:
            if member.fines > 0:
                raise LibraryError("pay outstanding fines first")
            if len(member.loans) >= MAX_LOANS:
                raise LibraryError("loan limit reached")
            copy = next((c for c in self.copies.values() if c.book.isbn == isbn and
                         (c.status == Status.AVAILABLE or (c.status == Status.ON_HOLD and c.reserved_for is member))), None)
            if copy is None:
                raise NoCopyAvailable(isbn)
            copy.status, copy.reserved_for = Status.ON_LOAN, None
            loan = Loan(copy, member, day + LOAN_DAYS)
            member.loans.append(loan)
            return loan

    def place_hold(self, member, isbn):
        with self.lock:
            if any(c.book.isbn == isbn and c.status == Status.AVAILABLE for c in self.copies.values()):
                raise LibraryError("a copy is available, borrow it instead")
            q = self.holds.setdefault(isbn, deque())
            if member in q:
                raise LibraryError("already in the queue")
            q.append(member)
            return len(q)                    # position in the queue

    def return_copy(self, copy_id, day):
        with self.lock:
            copy = self.copies.get(copy_id)
            if copy is None or copy.status != Status.ON_LOAN:
                raise LibraryError("copy is not on loan")
            loan = next(l for m in self.members.values() for l in m.loans if l.copy is copy)
            loan.member.loans.remove(loan)
            fine = self.policy.fine(day - loan.due)
            loan.member.fines += fine
            q = self.holds.get(copy.book.isbn)
            if q:                            # hand the copy straight to the first waiting member
                nxt = q.popleft()
                copy.status, copy.reserved_for = Status.ON_HOLD, nxt
                for o in self.observers:
                    o.notify(nxt, f"'{copy.book.title}' is ready for you")
            else:
                copy.status = Status.AVAILABLE
            return fine

    def pay_fine(self, member, cents):
        with self.lock:
            member.fines = max(0, member.fines - cents)


def demo():
    inbox = InboxNotifier()
    lib = Library(PerDayFine(25, 2000), [inbox])
    book = Book("978-1", "The Pragmatic Programmer", "Hunt and Thomas")
    lib.add_book(book, 1)
    alice, bob, carol, dan = (Member(i, n) for i, n in enumerate(["Alice", "Bob", "Carol", "Dan"]))
    for m in (alice, bob, carol, dan):
        lib.join(m)
    loan = lib.checkout(alice, "978-1", 0)
    assert loan.due == 14 and loan.copy.status == Status.ON_LOAN
    try:
        lib.checkout(bob, "978-1", 1)                    # only copy is out
        assert False
    except NoCopyAvailable:
        pass
    assert lib.place_hold(bob, "978-1") == 1 and lib.place_hold(carol, "978-1") == 2
    try:
        lib.place_hold(bob, "978-1")                     # already queued
        assert False
    except LibraryError:
        pass
    assert lib.return_copy(loan.copy.id, 20) == 150      # 6 days late at 25 cents
    assert inbox.sent == [(bob.id, "'The Pragmatic Programmer' is ready for you")]
    try:
        lib.checkout(carol, "978-1", 20)                 # copy is reserved for bob, carol is second
        assert False
    except NoCopyAvailable:
        pass
    try:
        lib.checkout(alice, "978-1", 21)                 # unpaid fine blocks borrowing
        assert False
    except LibraryError:
        pass
    bob_loan = lib.checkout(bob, "978-1", 21)            # bob collects his held copy
    assert bob_loan.copy.status == Status.ON_LOAN
    lib.pay_fine(alice, 150)
    assert alice.fines == 0
    assert lib.return_copy(bob_loan.copy.id, 30) == 0    # on time, carol is next in line
    assert inbox.sent[-1][0] == carol.id and len(inbox.sent) == 2
    assert lib.checkout(carol, "978-1", 31).copy.id == "978-1#1"

    assert lib.policy.fine(1000) == 2000                 # fine is capped
    assert [b.isbn for b in lib.search("PRAGMATIC")] == ["978-1"] and lib.search("hunt") and not lib.search("zzz")
    for i in range(4):
        lib.add_book(Book(f"x{i}", f"Book {i}", "Someone"), 1)
    for i in range(3):
        lib.checkout(dan, f"x{i}", 0)
    try:
        lib.checkout(dan, "x3", 0)                       # fourth loan
        assert False
    except LibraryError:
        pass
    try:
        lib.return_copy("x3#1", 5)                       # never lent
        assert False
    except LibraryError:
        pass
    try:
        lib.place_hold(dan, "x3")                        # available copy, no need to queue
        assert False
    except LibraryError:
        pass
    print("library ok")


if __name__ == "__main__":
    demo()`, js: String.raw`const assert = require('assert');

const LOAN_DAYS = 14, MAX_LOANS = 3;

class LibraryError extends Error {}
class NoCopyAvailable extends LibraryError {}

const Status = { AVAILABLE: 'available', ON_LOAN: 'on_loan', ON_HOLD: 'on_hold' };   // ON_HOLD: shelved for the first member in the queue

class Book {                                  // the title: shared by every physical copy
  constructor(isbn, title, author) { this.isbn = isbn; this.title = title; this.author = author; }
}
class BookCopy {                              // one physical item that can be lent
  constructor(id, book) { this.id = id; this.book = book; this.status = Status.AVAILABLE; this.reservedFor = null; }
}
class Member {
  constructor(id, name) { this.id = id; this.name = name; this.loans = []; this.fines = 0; }   // fines in cents
}
class Loan {
  constructor(copy, member, due) { this.copy = copy; this.member = member; this.due = due; }
}

// Observer: anything that wants to hear about library events
class InboxNotifier {                         // stand-in for email or push; records what it would send
  constructor() { this.sent = []; }
  notify(member, message) { this.sent.push([member.id, message]); }
}

// Strategy: what a late return costs
class PerDayFine {
  constructor(centsPerDay, cap) { this.rate = centsPerDay; this.cap = cap; }
  fine(daysLate) { return Math.min(this.cap, Math.max(0, daysLate) * this.rate); }
}

// ponytail: JS runs one event at a time so no lock; with worker threads, serialize calls per isbn.
class Library {
  constructor(policy, observers = []) {
    this.policy = policy; this.observers = observers;
    this.books = new Map(); this.copies = new Map(); this.members = new Map();
    this.holds = new Map();                   // isbn -> array of members waiting, first come first served
  }
  addBook(book, nCopies) {
    this.books.set(book.isbn, book);
    for (let i = 1; i <= nCopies; i++) this.copies.set(book.isbn + '#' + i, new BookCopy(book.isbn + '#' + i, book));
  }
  join(member) { this.members.set(member.id, member); }

  search(query) {                             // ponytail: linear scan; inverted index when the catalogue is large
    const q = query.toLowerCase();
    return [...this.books.values()].filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || q === b.isbn);
  }

  checkout(member, isbn, day) {
    if (member.fines > 0) throw new LibraryError('pay outstanding fines first');
    if (member.loans.length >= MAX_LOANS) throw new LibraryError('loan limit reached');
    const copy = [...this.copies.values()].find((c) => c.book.isbn === isbn &&
      (c.status === Status.AVAILABLE || (c.status === Status.ON_HOLD && c.reservedFor === member)));
    if (!copy) throw new NoCopyAvailable(isbn);
    copy.status = Status.ON_LOAN; copy.reservedFor = null;
    const loan = new Loan(copy, member, day + LOAN_DAYS);
    member.loans.push(loan);
    return loan;
  }

  placeHold(member, isbn) {
    if ([...this.copies.values()].some((c) => c.book.isbn === isbn && c.status === Status.AVAILABLE)) {
      throw new LibraryError('a copy is available, borrow it instead');
    }
    if (!this.holds.has(isbn)) this.holds.set(isbn, []);
    const q = this.holds.get(isbn);
    if (q.includes(member)) throw new LibraryError('already in the queue');
    q.push(member);
    return q.length;                          // position in the queue
  }

  returnCopy(copyId, day) {
    const copy = this.copies.get(copyId);
    if (!copy || copy.status !== Status.ON_LOAN) throw new LibraryError('copy is not on loan');
    let loan;
    for (const m of this.members.values()) { loan = m.loans.find((l) => l.copy === copy); if (loan) break; }
    loan.member.loans.splice(loan.member.loans.indexOf(loan), 1);
    const fine = this.policy.fine(day - loan.due);
    loan.member.fines += fine;
    const q = this.holds.get(copy.book.isbn);
    if (q && q.length) {                      // hand the copy straight to the first waiting member
      const next = q.shift();
      copy.status = Status.ON_HOLD; copy.reservedFor = next;
      this.observers.forEach((o) => o.notify(next, "'" + copy.book.title + "' is ready for you"));
    } else {
      copy.status = Status.AVAILABLE;
    }
    return fine;
  }

  payFine(member, cents) { member.fines = Math.max(0, member.fines - cents); }
}

function demo() {
  const inbox = new InboxNotifier();
  const lib = new Library(new PerDayFine(25, 2000), [inbox]);
  const book = new Book('978-1', 'The Pragmatic Programmer', 'Hunt and Thomas');
  lib.addBook(book, 1);
  const [alice, bob, carol, dan] = ['Alice', 'Bob', 'Carol', 'Dan'].map((n, i) => new Member(i, n));
  [alice, bob, carol, dan].forEach((m) => lib.join(m));

  const loan = lib.checkout(alice, '978-1', 0);
  assert.ok(loan.due === 14 && loan.copy.status === Status.ON_LOAN);
  assert.throws(() => lib.checkout(bob, '978-1', 1), NoCopyAvailable);        // only copy is out
  assert.ok(lib.placeHold(bob, '978-1') === 1 && lib.placeHold(carol, '978-1') === 2);
  assert.throws(() => lib.placeHold(bob, '978-1'), /already/);                // already queued
  assert.strictEqual(lib.returnCopy(loan.copy.id, 20), 150);                  // 6 days late at 25 cents
  assert.deepStrictEqual(inbox.sent, [[bob.id, "'The Pragmatic Programmer' is ready for you"]]);
  assert.throws(() => lib.checkout(carol, '978-1', 20), NoCopyAvailable);     // reserved for bob, carol is second
  assert.throws(() => lib.checkout(alice, '978-1', 21), /fines/);             // unpaid fine blocks borrowing
  const bobLoan = lib.checkout(bob, '978-1', 21);                             // bob collects his held copy
  assert.strictEqual(bobLoan.copy.status, Status.ON_LOAN);
  lib.payFine(alice, 150);
  assert.strictEqual(alice.fines, 0);
  assert.strictEqual(lib.returnCopy(bobLoan.copy.id, 30), 0);                 // on time, carol is next in line
  assert.ok(inbox.sent.length === 2 && inbox.sent[1][0] === carol.id);
  assert.strictEqual(lib.checkout(carol, '978-1', 31).copy.id, '978-1#1');

  assert.strictEqual(lib.policy.fine(1000), 2000);                            // fine is capped
  assert.deepStrictEqual(lib.search('PRAGMATIC').map((b) => b.isbn), ['978-1']);
  assert.ok(lib.search('hunt').length === 1 && lib.search('zzz').length === 0);
  for (let i = 0; i < 4; i++) lib.addBook(new Book('x' + i, 'Book ' + i, 'Someone'), 1);
  for (let i = 0; i < 3; i++) lib.checkout(dan, 'x' + i, 0);
  assert.throws(() => lib.checkout(dan, 'x3', 0), /limit/);                   // fourth loan
  assert.throws(() => lib.returnCopy('x3#1', 5), /not on loan/);              // never lent
  assert.throws(() => lib.placeHold(dan, 'x3'), /available/);                 // available copy, no need to queue
  console.log('library ok');
}
demo();`, java: String.raw`import java.util.*;

public class Library {
    static final int LOAN_DAYS = 14, MAX_LOANS = 3;

    static class LibraryException extends RuntimeException {
        LibraryException(String m) { super(m); }
    }
    static class NoCopyAvailable extends LibraryException {
        NoCopyAvailable(String m) { super(m); }
    }

    enum Status { AVAILABLE, ON_LOAN, ON_HOLD }              // ON_HOLD: shelved for the first member in the queue

    record Book(String isbn, String title, String author) {}  // the title: shared by every physical copy

    static class BookCopy {                                  // one physical item that can be lent
        final String id; final Book book; Status status = Status.AVAILABLE; Member reservedFor;
        BookCopy(String id, Book book) { this.id = id; this.book = book; }
    }

    static class Member {
        final int id; final String name; final List<Loan> loans = new ArrayList<>(); long fines;   // fines in cents
        Member(int id, String name) { this.id = id; this.name = name; }
    }

    record Loan(BookCopy copy, Member member, int due) {}

    interface Observer { void notify(Member m, String message); }   // Observer: anyone who wants library events

    static class InboxNotifier implements Observer {         // stand-in for email or push; records what it would send
        final List<String> sent = new ArrayList<>();
        public void notify(Member m, String message) { sent.add(m.id + ":" + message); }
    }

    interface FinePolicy { long fine(int daysLate); }        // Strategy: what a late return costs

    static class PerDayFine implements FinePolicy {
        final long rate, cap;
        PerDayFine(long centsPerDay, long cap) { this.rate = centsPerDay; this.cap = cap; }
        public long fine(int daysLate) { return Math.min(cap, Math.max(0, daysLate) * rate); }
    }

    final FinePolicy policy; final List<Observer> observers;
    final Map<String, Book> books = new LinkedHashMap<>();
    final Map<String, BookCopy> copies = new LinkedHashMap<>();
    final Map<Integer, Member> members = new HashMap<>();
    final Map<String, Deque<Member>> holds = new HashMap<>(); // isbn -> members waiting, first come first served

    Library(FinePolicy policy, List<Observer> observers) { this.policy = policy; this.observers = observers; }

    // ponytail: one monitor lock on every public method; lock per isbn if checkouts contend
    synchronized void addBook(Book b, int n) {
        books.put(b.isbn(), b);
        for (int i = 1; i <= n; i++) copies.put(b.isbn() + "#" + i, new BookCopy(b.isbn() + "#" + i, b));
    }
    synchronized void join(Member m) { members.put(m.id, m); }

    synchronized List<Book> search(String query) {           // ponytail: linear scan; inverted index when the catalogue is large
        String q = query.toLowerCase();
        List<Book> out = new ArrayList<>();
        for (Book b : books.values())
            if (b.title().toLowerCase().contains(q) || b.author().toLowerCase().contains(q) || q.equals(b.isbn())) out.add(b);
        return out;
    }

    synchronized Loan checkout(Member m, String isbn, int day) {
        if (m.fines > 0) throw new LibraryException("pay outstanding fines first");
        if (m.loans.size() >= MAX_LOANS) throw new LibraryException("loan limit reached");
        BookCopy copy = null;
        for (BookCopy c : copies.values())
            if (c.book.isbn().equals(isbn) && (c.status == Status.AVAILABLE || (c.status == Status.ON_HOLD && c.reservedFor == m))) { copy = c; break; }
        if (copy == null) throw new NoCopyAvailable(isbn);
        copy.status = Status.ON_LOAN; copy.reservedFor = null;
        Loan loan = new Loan(copy, m, day + LOAN_DAYS);
        m.loans.add(loan);
        return loan;
    }

    synchronized int placeHold(Member m, String isbn) {
        for (BookCopy c : copies.values())
            if (c.book.isbn().equals(isbn) && c.status == Status.AVAILABLE) throw new LibraryException("a copy is available, borrow it instead");
        Deque<Member> q = holds.computeIfAbsent(isbn, k -> new ArrayDeque<>());
        if (q.contains(m)) throw new LibraryException("already in the queue");
        q.add(m);
        return q.size();                                     // position in the queue
    }

    synchronized long returnCopy(String copyId, int day) {
        BookCopy copy = copies.get(copyId);
        if (copy == null || copy.status != Status.ON_LOAN) throw new LibraryException("copy is not on loan");
        Loan loan = null;
        for (Member m : members.values()) for (Loan l : m.loans) if (l.copy() == copy) loan = l;
        loan.member().loans.remove(loan);
        long fine = policy.fine(day - loan.due());
        loan.member().fines += fine;
        Deque<Member> q = holds.get(copy.book.isbn());
        if (q != null && !q.isEmpty()) {                     // hand the copy straight to the first waiting member
            Member next = q.poll();
            copy.status = Status.ON_HOLD; copy.reservedFor = next;
            for (Observer o : observers) o.notify(next, "'" + copy.book.title() + "' is ready for you");
        } else {
            copy.status = Status.AVAILABLE;
        }
        return fine;
    }

    synchronized void payFine(Member m, long cents) { m.fines = Math.max(0, m.fines - cents); }

    static void check(boolean ok) { if (!ok) throw new AssertionError(); }

    static <T extends Throwable> void expect(Class<T> type, Runnable r) {
        try { r.run(); } catch (Throwable e) { if (type.isInstance(e)) return; throw new AssertionError("wrong exception " + e); }
        throw new AssertionError("expected " + type.getSimpleName());
    }

    public static void main(String[] args) {
        InboxNotifier inbox = new InboxNotifier();
        Library lib = new Library(new PerDayFine(25, 2000), List.of(inbox));
        lib.addBook(new Book("978-1", "The Pragmatic Programmer", "Hunt and Thomas"), 1);
        Member alice = new Member(0, "Alice"), bob = new Member(1, "Bob"), carol = new Member(2, "Carol"), dan = new Member(3, "Dan");
        for (Member m : List.of(alice, bob, carol, dan)) lib.join(m);

        Loan loan = lib.checkout(alice, "978-1", 0);
        check(loan.due() == 14 && loan.copy().status == Status.ON_LOAN);
        expect(NoCopyAvailable.class, () -> lib.checkout(bob, "978-1", 1));     // only copy is out
        check(lib.placeHold(bob, "978-1") == 1 && lib.placeHold(carol, "978-1") == 2);
        expect(LibraryException.class, () -> lib.placeHold(bob, "978-1"));      // already queued
        check(lib.returnCopy(loan.copy().id, 20) == 150);                       // 6 days late at 25 cents
        check(inbox.sent.equals(List.of("1:'The Pragmatic Programmer' is ready for you")));
        expect(NoCopyAvailable.class, () -> lib.checkout(carol, "978-1", 20));  // reserved for bob, carol is second
        expect(LibraryException.class, () -> lib.checkout(alice, "978-1", 21)); // unpaid fine blocks borrowing
        Loan bobLoan = lib.checkout(bob, "978-1", 21);                          // bob collects his held copy
        check(bobLoan.copy().status == Status.ON_LOAN);
        lib.payFine(alice, 150);
        check(alice.fines == 0);
        check(lib.returnCopy(bobLoan.copy().id, 30) == 0);                      // on time, carol is next in line
        check(inbox.sent.size() == 2 && inbox.sent.get(1).startsWith("2:"));
        check(lib.checkout(carol, "978-1", 31).copy().id.equals("978-1#1"));

        check(lib.policy.fine(1000) == 2000);                                   // fine is capped
        check(lib.search("PRAGMATIC").size() == 1 && lib.search("hunt").size() == 1 && lib.search("zzz").isEmpty());
        for (int i = 0; i < 4; i++) lib.addBook(new Book("x" + i, "Book " + i, "Someone"), 1);
        for (int i = 0; i < 3; i++) lib.checkout(dan, "x" + i, 0);
        expect(LibraryException.class, () -> lib.checkout(dan, "x3", 0));       // fourth loan
        expect(LibraryException.class, () -> lib.returnCopy("x3#1", 5));        // never lent
        expect(LibraryException.class, () -> lib.placeHold(dan, "x3"));         // available copy, no need to queue
        System.out.println("library ok");
    }
}`, cpp: String.raw`#include <algorithm>
#include <cstdlib>
#include <deque>
#include <iostream>
#include <map>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <vector>

const int LOAN_DAYS = 14, MAX_LOANS = 3;

struct LibraryError : std::runtime_error { using std::runtime_error::runtime_error; };
struct NoCopyAvailable : LibraryError { using LibraryError::LibraryError; };

enum class Status { AVAILABLE, ON_LOAN, ON_HOLD };           // ON_HOLD: shelved for the first member in the queue

struct Book { std::string isbn, title, author; };            // the title: shared by every physical copy

struct Member;
struct BookCopy {                                            // one physical item that can be lent
    std::string id; const Book* book; Status status = Status::AVAILABLE; Member* reservedFor = nullptr;
};
struct Loan { BookCopy* copy; int due; };
struct Member {
    int id; std::string name; std::vector<Loan> loans; long fines = 0;    // fines in cents
};

struct Observer {                                            // Observer: anything that wants to hear about library events
    virtual ~Observer() = default;
    virtual void notify(const Member& m, const std::string& message) = 0;
};
struct InboxNotifier : Observer {                            // stand-in for email or push; records what it would send
    std::vector<std::string> sent;
    void notify(const Member& m, const std::string& message) override { sent.push_back(std::to_string(m.id) + ":" + message); }
};

struct FinePolicy {                                          // Strategy: what a late return costs
    virtual ~FinePolicy() = default;
    virtual long fine(int daysLate) const = 0;
};
struct PerDayFine : FinePolicy {
    long rate, cap;
    PerDayFine(long r, long c) : rate(r), cap(c) {}
    long fine(int daysLate) const override { return std::min(cap, std::max(0, daysLate) * rate); }
};

class Library {
    std::unique_ptr<FinePolicy> policy_; std::vector<Observer*> observers_;
    std::map<std::string, Book> books_;
    std::map<std::string, BookCopy> copies_;
    std::map<int, Member*> members_;
    std::map<std::string, std::deque<Member*>> holds_;       // isbn -> members waiting, first come first served
    std::mutex mu_;                                          // ponytail: one lock; lock per isbn if checkouts contend
public:
    Library(std::unique_ptr<FinePolicy> p, std::vector<Observer*> o) : policy_(std::move(p)), observers_(std::move(o)) {}
    const FinePolicy& policy() const { return *policy_; }

    void addBook(const Book& b, int n) {
        std::lock_guard<std::mutex> g(mu_);
        books_[b.isbn] = b;
        for (int i = 1; i <= n; i++) {
            std::string id = b.isbn + "#" + std::to_string(i);
            copies_[id] = BookCopy{id, &books_[b.isbn]};     // std::map nodes keep their address
        }
    }
    void join(Member* m) { std::lock_guard<std::mutex> g(mu_); members_[m->id] = m; }

    std::vector<std::string> search(std::string q) {         // ponytail: linear scan; inverted index when the catalogue is large
        std::lock_guard<std::mutex> g(mu_);
        auto lower = [](std::string s) { std::transform(s.begin(), s.end(), s.begin(), ::tolower); return s; };
        q = lower(q);
        std::vector<std::string> out;
        for (auto& kv : books_) {
            const Book& b = kv.second;
            if (lower(b.title).find(q) != std::string::npos || lower(b.author).find(q) != std::string::npos || q == b.isbn) out.push_back(b.isbn);
        }
        return out;
    }

    Loan checkout(Member& m, const std::string& isbn, int day) {
        std::lock_guard<std::mutex> g(mu_);
        if (m.fines > 0) throw LibraryError("pay outstanding fines first");
        if ((int)m.loans.size() >= MAX_LOANS) throw LibraryError("loan limit reached");
        BookCopy* copy = nullptr;
        for (auto& kv : copies_) {
            BookCopy& c = kv.second;
            if (c.book->isbn == isbn && (c.status == Status::AVAILABLE || (c.status == Status::ON_HOLD && c.reservedFor == &m))) { copy = &c; break; }
        }
        if (!copy) throw NoCopyAvailable(isbn);
        copy->status = Status::ON_LOAN; copy->reservedFor = nullptr;
        Loan loan{copy, day + LOAN_DAYS};
        m.loans.push_back(loan);
        return loan;
    }

    int placeHold(Member& m, const std::string& isbn) {
        std::lock_guard<std::mutex> g(mu_);
        for (auto& kv : copies_)
            if (kv.second.book->isbn == isbn && kv.second.status == Status::AVAILABLE) throw LibraryError("a copy is available, borrow it instead");
        auto& q = holds_[isbn];
        if (std::find(q.begin(), q.end(), &m) != q.end()) throw LibraryError("already in the queue");
        q.push_back(&m);
        return (int)q.size();                                // position in the queue
    }

    long returnCopy(const std::string& copyId, int day) {
        std::lock_guard<std::mutex> g(mu_);
        auto it = copies_.find(copyId);
        if (it == copies_.end() || it->second.status != Status::ON_LOAN) throw LibraryError("copy is not on loan");
        BookCopy& copy = it->second;
        Member* who = nullptr; int due = 0;
        for (auto& kv : members_) {
            auto& ls = kv.second->loans;
            auto l = std::find_if(ls.begin(), ls.end(), [&](const Loan& x) { return x.copy == &copy; });
            if (l != ls.end()) { who = kv.second; due = l->due; ls.erase(l); break; }
        }
        long fine = policy_->fine(day - due);
        who->fines += fine;
        auto& q = holds_[copy.book->isbn];
        if (!q.empty()) {                                    // hand the copy straight to the first waiting member
            Member* next = q.front(); q.pop_front();
            copy.status = Status::ON_HOLD; copy.reservedFor = next;
            for (Observer* o : observers_) o->notify(*next, "'" + copy.book->title + "' is ready for you");
        } else {
            copy.status = Status::AVAILABLE;
        }
        return fine;
    }

    void payFine(Member& m, long cents) { std::lock_guard<std::mutex> g(mu_); m.fines = std::max(0L, m.fines - cents); }
};

template <class E, class F> void expect(F f) {
    try { f(); } catch (const E&) { return; }
    std::cerr << "expected exception\n";
    std::abort();
}

#define CHECK(c) do { if (!(c)) { std::cerr << "FAILED: " #c "\n"; std::abort(); } } while (0)

int main() {
    InboxNotifier inbox;
    Library lib(std::make_unique<PerDayFine>(25, 2000), {&inbox});
    lib.addBook({"978-1", "The Pragmatic Programmer", "Hunt and Thomas"}, 1);
    Member alice{0, "Alice", {}}, bob{1, "Bob", {}}, carol{2, "Carol", {}}, dan{3, "Dan", {}};
    for (Member* m : {&alice, &bob, &carol, &dan}) lib.join(m);

    Loan loan = lib.checkout(alice, "978-1", 0);
    CHECK(loan.due == 14 && loan.copy->status == Status::ON_LOAN);
    expect<NoCopyAvailable>([&] { lib.checkout(bob, "978-1", 1); });          // only copy is out
    CHECK(lib.placeHold(bob, "978-1") == 1 && lib.placeHold(carol, "978-1") == 2);
    expect<LibraryError>([&] { lib.placeHold(bob, "978-1"); });               // already queued
    CHECK(lib.returnCopy(loan.copy->id, 20) == 150);                          // 6 days late at 25 cents
    CHECK(inbox.sent.size() == 1 && inbox.sent[0] == "1:'The Pragmatic Programmer' is ready for you");
    expect<NoCopyAvailable>([&] { lib.checkout(carol, "978-1", 20); });       // reserved for bob, carol is second
    expect<LibraryError>([&] { lib.checkout(alice, "978-1", 21); });          // unpaid fine blocks borrowing
    Loan bobLoan = lib.checkout(bob, "978-1", 21);                            // bob collects his held copy
    CHECK(bobLoan.copy->status == Status::ON_LOAN);
    lib.payFine(alice, 150);
    CHECK(alice.fines == 0);
    CHECK(lib.returnCopy(bobLoan.copy->id, 30) == 0);                         // on time, carol is next in line
    CHECK(inbox.sent.size() == 2 && inbox.sent[1].rfind("2:", 0) == 0);
    CHECK(lib.checkout(carol, "978-1", 31).copy->id == "978-1#1");

    CHECK(lib.policy().fine(1000) == 2000);                                   // fine is capped
    CHECK(lib.search("PRAGMATIC") == std::vector<std::string>{"978-1"});
    CHECK(lib.search("hunt").size() == 1 && lib.search("zzz").empty());
    for (int i = 0; i < 4; i++) lib.addBook({"x" + std::to_string(i), "Book " + std::to_string(i), "Someone"}, 1);
    for (int i = 0; i < 3; i++) lib.checkout(dan, "x" + std::to_string(i), 0);
    expect<LibraryError>([&] { lib.checkout(dan, "x3", 0); });                // fourth loan
    expect<LibraryError>([&] { lib.returnCopy("x3#1", 5); });                 // never lent
    expect<LibraryError>([&] { lib.placeHold(dan, "x3"); });                  // available copy, no need to queue
    std::cout << "library ok\n";
}` } }
    ],

    extensions: [
      { q: 'A held book is **not collected for 3 days**. What should happen?', a: 'Give a hold a `readySince` day and expire it. On any library event (or a daily sweep), if `day - readySince > 3` the reservation passes to the next member in the queue, or the copy goes back to available when the queue is empty; notify both the expired and the new member. Keep the clock injected so a test can jump forward.' },
      { q: 'Add **renewals**.', a: 'A renewal extends `due` by a period, with rules: not if someone is waiting on that title, a maximum count per loan, and not while the member has fines. Store `renewals` on `Loan`. The "someone is waiting" check is a lookup in the hold queue, which is why holds are keyed by ISBN.' },
      { q: 'Different **item types** have different loan periods and fines (DVD 7 days, book 14).', a: 'Make the period and the fine rule depend on the item. A `LoanPolicy` (Strategy) keyed by item type returns the period and the `FinePolicy` to use. Add `ItemType` to `Book`. The facade asks the policy instead of using the constants.' },
      { q: 'Notify members **before** a book is overdue.', a: 'A scheduled job (daily) scans loans due tomorrow and publishes a "due soon" event to the same observers. The loan code stays untouched because the job lives outside it and only reads loans and publishes events. That is the payoff of Observer.' },
      { q: 'Make **search** fast on a million titles.', a: 'Build an inverted index from lower-cased tokens in title and author to ISBNs, updated when books are added. A query intersects posting lists. Beyond that, delegate to a search engine and keep the library as the source of truth.' }
    ],

    quiz: [
      { kind: 'concept', q: 'Why model Book and BookCopy separately?', choices: ['Holds and search are about titles; loans and returns are about one physical copy', 'It makes the code shorter', 'Copies cannot have an ISBN', 'To avoid using inheritance'], answer: 0, explain: 'Without the split you cannot say "any copy of this title" for a hold, or "this specific copy is overdue" for a loan.' },
      { kind: 'pattern', q: 'The library must tell a member by email, and later by SMS, when a held book is ready, without the loan code knowing about either. Which pattern?', choices: ['Observer', 'Strategy', 'Factory', 'Adapter only'], answer: 0, explain: 'Subscribers register with the library and are notified of events; adding SMS is a new subscriber.' },
      { kind: 'bug', q: 'A returned copy with a waiting hold is put back as AVAILABLE and the member is notified. What can go wrong?', choices: ['A walk-in can borrow it before the member arrives, breaking the queue order', 'The fine is charged twice', 'The copy disappears from the catalogue', 'Nothing; availability is first come first served'], answer: 0, explain: 'Mark the copy ON_HOLD with a reservedFor member, and let only that member check it out.' },
      { kind: 'complexity', q: 'A member returns a book 6 days late. The rate is 25 cents a day with a 2000 cent cap. What is the fine?', choices: ['150 cents', '25 cents', '2000 cents', '6 cents'], answer: 0, explain: '6 x 25 = 150, below the cap.' },
      { kind: 'concept', q: 'Which two checks must happen under the same lock in `checkout`?', choices: ['Finding a lendable copy and marking it on loan', 'The member loan-limit and fine checks, before the copy is taken', 'Formatting the due date', 'Sending the confirmation email'], answer: [0, 1], explain: 'Both are check-then-act: without atomicity two threads can lend the last copy, or one member can exceed the limit.' }
    ],

    flashcards: [
      { id: 'lib-split', front: 'Library: Book versus BookCopy?', back: 'Book is the title (isbn, author): search and holds target it. BookCopy is one physical item: loans and returns target it.' },
      { id: 'lib-hold', front: 'How does a hold hand over a returned copy fairly?', back: 'Mark the copy ON_HOLD with reservedFor = first in the queue and notify them; only that member can check it out.' },
      { id: 'lib-observer', front: 'Why Observer for notifications?', back: 'The library publishes "hold ready" and does not know whether subscribers send email, SMS or push. New channel, new subscriber, no change to loan code.' },
      { id: 'lib-fine', front: 'Why is the fine a Strategy?', back: 'Rates, caps, grace periods and fine-free cards change by policy. FinePolicy.fine(daysLate) isolates that.' },
      { id: 'lib-rules', front: 'What rules does checkout enforce?', back: 'No unpaid fines, at most 3 loans, and a lendable copy: available, or on hold for this very member.' },
      { id: 'lib-expiry', front: 'How would you expire an uncollected hold?', back: 'Store when it became ready; after 3 days pass the reservation to the next member (or release it) and notify both. Inject the clock to test it.' }
    ]
  });
})();
