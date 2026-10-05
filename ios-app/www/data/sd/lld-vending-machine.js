/* Low-level design: vending machine. The code under "Code" was compiled and run (Python, Node, javac, g++ -std=c++17 -Wall -Wextra) before it was pasted here. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.lld = SD.lld || [];
  SD.lld.push({
    id: 'vending-machine',
    title: 'Design a vending machine',
    short: 'Slots, coins and change, and a machine whose behavior depends on its state: the textbook State pattern with a change-making twist.',
    difficulty: 'Medium',
    time: '45 min',
    tags: ['State', 'Strategy', 'Change-making', 'Concurrency', 'Extensibility'],
    prompt: 'Design a vending machine. A customer inserts money, picks a product, and gets the product and any change back. An operator can restock it and take it out of service.',

    requirements: {
      functional: [
        'The machine has **slots**, each with a code (A1, B2), a product name, a price and a quantity.',
        '**Insert** accepts coins and bills from a fixed set of denominations. Inserted money builds up a credit.',
        '**Select** a slot: if the product is in stock and the credit covers the price, drop the product and return **change**. Otherwise refuse with a specific reason and keep the credit.',
        '**Cancel** returns exactly the money that was inserted for the current sale.',
        'Change comes from a **coin bank** with limited counts. If the machine cannot pay the exact change, it refuses the sale instead of shorting the customer.',
        '**Admin** actions: restock a slot, load coins into the bank, and set the machine in or out of service.'
      ],
      nonFunctional: [
        'The machine is always in one well-defined state, and every action is either valid in that state or refused with a reason. No hidden combination of flags.',
        'Money is never lost or created: every cent inserted ends up in the bank, in a refund, or in change.',
        'Safe if an operator action overlaps a customer action: state changes happen under one lock.',
        'Money is stored in integer cents, never floats.'
      ],
      assumptions: [
        'One customer at a time and one item per sale.',
        'Denominations are 5, 10, 25 cent coins, and 1 and 5 dollar bills (500, 100, 25, 10, 5 cents).',
        'Inserted money is held in escrow and joins the bank only when the sale completes.',
        'The bank may use the customer\'s own coins to give change.'
      ],
      outOfScope: [
        'Hardware: coin validators, motors, sensors and jams.',
        'Card, phone and other payments: covered as an extension (Strategy).',
        'Pricing promotions, loyalty and telemetry.'
      ],
      clarify: [
        { q: 'Which payments does it take, and does it give change?', a: 'Assume cash only (coins and bills) with change. Say out loud that payment will vary later, so insertion is an input to the machine and not baked into every method. A card reader is a second payment method, discussed in the extensions.' },
        { q: 'What if the machine cannot make the exact change?', a: 'Two real answers: refuse the sale and let the customer cancel for a refund, or accept it and keep the overpayment. Assume **refuse**, because short-changing is a bug a user would report. Real machines also show an "exact change only" light.' },
        { q: 'Can the customer insert more money after an error, or after choosing?', a: 'After an error (sold out, not enough credit, no change) the credit is kept and the customer can insert more, pick another slot, or cancel. There is no state where the machine silently eats money.' },
        { q: 'One item per sale, or can they buy several?', a: 'One. Multi-buy is a cart on top of the same credit: select repeatedly while credit remains. Confirm before building it.' },
        { q: 'Who calls the machine, and how many threads?', a: 'Assume a controller thread for the keypad and coin slot, plus an admin thread. Few callers, tiny critical sections: one lock around every public method is the right size.' },
        { q: 'Do I model the dispensing motor and coin hardware?', a: 'No. The machine calls a dispense callback and treats coin validation as already done. Hardware is a thin adapter around the same operations.' }
      ]
    },

    classDiagram: {
      title: 'Vending machine class diagram',
      intro: 'The machine delegates every customer action to its **current state object**. Each state decides what is allowed and which state comes next, so there is no `if (state == ...)` ladder. The one varying algorithm that is not about state, **making change**, sits behind its own interface. States call back into the machine (not drawn, to keep the picture acyclic). Click a class to see why it exists.',
      classes: [
        { id: 'machine', name: 'VendingMachine', fields: ['- state: State', '- inventory: Inventory', '- maker: ChangeMaker', '- bank: Map<denom, count>', '- escrow: Map<denom, count>', '- credit: cents', '- lock'], methods: ['+ insert(denom)', '+ select(code): (item, change)', '+ cancel(): coins', '+ restock(code, name, price, qty)', '+ loadCoins(denom, n)', '+ setService(up): coins'],
          detail: { why: 'The context of the State pattern and the only class with a lock. It owns the money (bank, escrow, credit) and forwards each customer action to the current state.', tradeoffs: ['States read and write machine fields, so the machine exposes a few package-level helpers (add a coin, take the escrow).', 'One lock for everything: simple, correct, and plenty for one customer at a time.'], alternatives: ['A single class with an enum and a switch in every method: shorter at first, hard to extend when a fifth state arrives.'], scale: 'n/a for one machine. A fleet adds a server that tracks machines; each machine stays this design.' } },
        { id: 'state', name: 'State', kind: 'interface', fields: [], methods: ['+ insert(m, denom)', '+ select(m, code): Result', '+ cancel(m): coins'],
          detail: { why: 'One method per customer action. A concrete state implements what it allows and refuses the rest with a reason.', tradeoffs: ['Every new action touches every state; a default that refuses keeps that to a few lines.'], alternatives: ['A state table (state x event -> next state), which is data-driven and good when states are many and behavior is thin.'], scale: 'n/a' } },
        { id: 'maker', name: 'ChangeMaker', kind: 'interface', fields: [], methods: ['+ make(amount, bank): Map?'],
          detail: { why: 'Strategy for paying an amount out of a limited coin bank. Returns the coins to dispense, or nothing when it is impossible.', tradeoffs: ['The caller must treat "nothing" as a refusal, not an exception.'], alternatives: ['A hard-coded greedy loop inside the state, which cannot be swapped or tested alone.'], scale: 'n/a' } },
        { id: 'inventory', name: 'Inventory', fields: ['- slots: Map<code, Slot>'], methods: ['+ get(code): Slot', '+ restock(code, ...)'],
          detail: { why: 'Owns the catalog of slots, so lookup and the unknown-code error live in one place and restocking is a single method.', tradeoffs: ['A thin class today; it earns its keep when stock must be persisted or audited.'], alternatives: ['A bare map inside the machine.'], scale: 'n/a' } },
        { id: 'idle', name: 'IdleState', fields: [], methods: ['+ insert: start a sale', '+ select: refuse'],
          detail: { why: 'Nothing inserted. The first coin starts a sale. A selection here is refused because there is nothing to spend.', tradeoffs: ['None.'], alternatives: ['Merge Idle and HasMoney with a credit == 0 check; it hides a real difference in allowed actions.'], scale: 'n/a' } },
        { id: 'hasmoney', name: 'HasMoneyState', fields: [], methods: ['+ insert: add credit', '+ select: sell or refuse', '+ cancel: refund'],
          detail: { why: 'The interesting state. A selection is validated (known slot, in stock, enough credit, change possible) with no side effects, and only then committed.', tradeoffs: ['Validate-then-commit keeps every error path clean: nothing to roll back.'], alternatives: ['Mutate as you go and undo on failure: more code and a window where money is in an odd place.'], scale: 'n/a' } },
        { id: 'dispensing', name: 'DispensingState', fields: [], methods: ['+ every action: refuse'],
          detail: { why: 'Models the moment the item is dropping. It exists so that a coin inserted mid-drop is refused instead of corrupting the sale, and it is where a real motor timeout would live.', tradeoffs: ['In this synchronous model it is transient: entered and left inside one call.'], alternatives: ['Skip the state and rely on the lock. Fine here, but loses a place to hang jam and timeout handling.'], scale: 'n/a' } },
        { id: 'outofservice', name: 'OutOfServiceState', fields: [], methods: ['+ customer actions: refuse'],
          detail: { why: 'Operator or fault mode. Customer actions are refused with a clear reason; admin actions still work.', tradeoffs: ['Going out of service refunds anything already inserted, so no customer loses money.'], alternatives: ['A boolean enabled flag checked everywhere; easy to forget in one method.'], scale: 'n/a' } },
        { id: 'greedy', name: 'GreedyChange', fields: [], methods: ['+ make(amount, bank)'],
          detail: { why: 'Largest coin first. With standard denominations and unlimited coins it is optimal and never fails.', tradeoffs: ['With limited counts it can fail when an answer exists (30 cents from one quarter and three dimes takes the quarter, then cannot pay 5).'], alternatives: ['SearchChange.'], scale: 'O(denominations).' } },
        { id: 'search', name: 'SearchChange', fields: [], methods: ['+ make(amount, bank)'],
          detail: { why: 'Tries counts of each coin from most to fewest and backtracks, so it finds an answer whenever one exists.', tradeoffs: ['Worst case exponential in the number of denominations; with five denominations and small amounts it is instant.', 'Prefers big coins first, but is not guaranteed to use the fewest coins.'], alternatives: ['Dynamic programming over (amount, denomination), which also minimizes the coin count.'], scale: 'Use DP if denominations or amounts grow.' } },
        { id: 'slot', name: 'Slot', fields: ['+ name: string', '+ price: cents', '+ qty: int'], methods: [],
          detail: { why: 'The physical row: what is in it, what it costs, how many are left. Data only.', tradeoffs: ['Price lives on the slot; if prices change often, move them to a catalog keyed by product.'], alternatives: ['A Product class with the slot holding a reference; add it when two slots can hold the same product.'], scale: 'n/a' } }
      ],
      relations: [
        { from: 'machine', to: 'inventory', type: 'composes', fromMult: '1', toMult: '1' },
        { from: 'inventory', to: 'slot', type: 'composes', fromMult: '1', toMult: '*' },
        { from: 'machine', to: 'state', type: 'aggregates', label: 'current', toMult: '1' },
        { from: 'machine', to: 'maker', type: 'aggregates', label: 'uses' },
        { from: 'idle', to: 'state', type: 'implements' },
        { from: 'hasmoney', to: 'state', type: 'implements' },
        { from: 'dispensing', to: 'state', type: 'implements' },
        { from: 'outofservice', to: 'state', type: 'implements' },
        { from: 'greedy', to: 'maker', type: 'implements' },
        { from: 'search', to: 'maker', type: 'implements' }
      ]
    },

    decisions: [
      { title: 'Behavior depends on state, so use the State pattern', pattern: 'State',
        body: 'Insert, select and cancel mean different things in Idle, HasMoney, Dispensing and OutOfService. The naive version is a `switch (state)` inside each of three methods, and every new state edits all of them. With State objects, each class answers one question ("what do I do when a coin arrives?") and picks the next state itself.\n\nThe machine keeps only a pointer to the current state and forwards calls. The states are stateless (the money lives on the machine), so one shared instance of each is enough.\n\n**Alternative:** an enum plus a transition table. Good when behavior is thin and states are many, less good when each state has real logic like HasMoney does.',
        tradeoffs: ['Four small classes instead of one big one: more files, much easier to read each rule.', 'States and the machine know each other, so keep the machine\'s surface for states small (add a coin, take the escrow).', 'Base-class defaults that refuse with a reason mean a new state only writes what it allows.'] },
      { title: 'Validate everything first, then commit in one step', pattern: 'Validate, then commit',
        body: 'A selection can fail four ways: unknown slot, sold out, not enough credit, change impossible. All four checks run before anything changes. The change is computed against a **copy** of the bank that already includes the customer\'s coins. Only when every check passes does the machine decrement stock, swap in the new bank, clear the escrow and drop the item.\n\nThat makes every error path free of rollback, and the customer\'s credit stays intact so they can insert more, choose again, or cancel.\n\n**Alternative:** take the money, then discover there is no change and try to undo. That is where machines lose cents.',
        tradeoffs: ['Copying a five-entry bank per sale costs nothing.', 'Refusing on "no change" is a business choice; say so and offer the alternative.'] },
      { title: 'Making change is a Strategy, and greedy is only sometimes right', pattern: 'Strategy',
        body: 'Greedy (largest coin first) is **optimal and never fails** when the coin system is canonical, which 5, 10, 25, 100, 500 is, **and** the bank has plenty of every coin. Two things break it: a coin system like 1, 3, 4 (greedy pays 6 as 4+1+1, three coins, while 3+3 is two), and **limited counts**: to pay 30 from one quarter and three dimes, greedy takes the quarter and then cannot pay the last 5, although three dimes work.\n\nA real machine has limited counts, so the interface takes the bank. `GreedyChange` is the fast default. `SearchChange` backtracks and finds an answer whenever one exists. The machine does not care which it holds.\n\n**Alternative:** dynamic programming over amount and denomination, which also minimizes the coin count. Reach for it when denominations or amounts get large.',
        tradeoffs: ['Search is exponential in the worst case, harmless for five denominations.', 'Neither strategy is told which coins the operator wants to keep; that is another input if it matters.'] },
      { title: 'Escrow the inserted coins until the sale commits', pattern: 'Escrow',
        body: 'Coins inserted for a sale sit in an **escrow** map, not in the bank. Cancel returns exactly that map, so a refund is always possible and always the same coins the customer put in (no change-making needed). On commit the escrow joins the bank, which is why change can use the coins the customer just inserted.\n\n**Alternative:** drop coins straight into the bank and compute the refund as an amount. Then a cancel might be impossible with the bank\'s current coins.',
        tradeoffs: ['Two maps to keep consistent; the invariant is that bank plus escrow plus dispensed change never changes in total.', 'Going out of service while escrow is non-empty must refund it.'] },
      { title: 'One lock, taken by every public method', pattern: 'Monitor',
        body: 'The danger is a check-then-act race: a customer thread checks stock is 1 while the operator changes it, or an admin takes the machine out of service between the credit check and the dispense. Every public method takes one lock, so a sale and an admin action never interleave.\n\nThe lock is **reentrant** here only because the test hook calls back into the machine while a sale runs; real hardware callbacks should not do that.\n\n**Alternative:** a lock per slot or per bank denomination. More concurrency and many more ways to deadlock, for a machine that serves one person at a time.',
        tradeoffs: ['Total serialization is fine here and wrong for a service handling thousands of requests.', 'Callbacks invoked under a lock are a hazard; keep them short or call them after releasing.'] }
    ],

    code: [
      { title: 'Vending machine: four languages, one driver each',
        note: 'Each file is complete and runs on its own. The driver covers a normal sale with change, sold out, unknown slot, insufficient credit and cancel, a bad coin, exact change impossible, exact payment, greedy failing where search succeeds, going out of service with a refund, restocking, and a coin inserted while an item is dropping. Money is a map of denomination to count.',
        code: { py: String.raw`import threading
from abc import ABC

DENOMS = (500, 100, 25, 10, 5)          # cents, largest first; 100 and 500 are bills


class VendingError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


class Slot:
    def __init__(self, name, price, qty):
        self.name, self.price, self.qty = name, price, qty


class Inventory:
    def __init__(self):
        self.slots = {}

    def restock(self, code, name, price, qty):
        s = self.slots.get(code)
        if s is None:
            self.slots[code] = Slot(name, price, qty)
        else:
            s.name, s.price, s.qty = name, price, s.qty + qty

    def get(self, code):
        if code not in self.slots:
            raise VendingError("unknown-slot")
        return self.slots[code]


class ChangeMaker(ABC):                 # Strategy: pay 'amount' out of the coins in 'bank'
    def make(self, amount, bank):       # returns {denom: count} or None when impossible
        raise NotImplementedError


class GreedyChange(ChangeMaker):        # optimal and always succeeds with unlimited canonical coins
    def make(self, amount, bank):
        out = {}
        for d in DENOMS:
            n = min(amount // d, bank.get(d, 0))
            if n:
                out[d] = n
                amount -= n * d
        return out if amount == 0 else None


class SearchChange(ChangeMaker):        # limited coins: backtracks, so it finds an answer whenever one exists
    def make(self, amount, bank):
        def go(i, rem):
            if rem == 0:
                return {}
            if i == len(DENOMS):
                return None
            d = DENOMS[i]
            for n in range(min(rem // d, bank.get(d, 0)), -1, -1):
                rest = go(i + 1, rem - n * d)
                if rest is not None:
                    if n:
                        rest[d] = n
                    return rest
            return None
        return go(0, amount)


class State(ABC):                       # default: every action is refused with this reason
    reason = "busy"

    def insert(self, m, denom):
        raise VendingError(self.reason)

    def select(self, m, code):
        raise VendingError(self.reason)

    def cancel(self, m):
        raise VendingError(self.reason)


class IdleState(State):
    reason = "no-money"

    def insert(self, m, denom):
        m.add_coin(denom)
        m.state = HAS_MONEY

    def cancel(self, m):
        return {}


class HasMoneyState(State):
    def insert(self, m, denom):
        m.add_coin(denom)

    def cancel(self, m):
        refund = m.take_escrow()
        m.state = IDLE
        return refund

    def select(self, m, code):
        slot = m.inventory.get(code)
        if slot.qty == 0:
            raise VendingError("sold-out")
        if m.credit < slot.price:
            raise VendingError("insufficient")
        pool = dict(m.bank)             # change may use the coins just inserted
        for d, n in m.escrow.items():
            pool[d] += n
        change = m.maker.make(m.credit - slot.price, pool)
        if change is None:
            raise VendingError("no-change")     # nothing was touched: the customer can cancel
        m.state = DISPENSING
        try:
            slot.qty -= 1
            for d, n in change.items():
                pool[d] -= n
            m.bank, m.escrow, m.credit = pool, {}, 0
            if m.on_dispense:
                m.on_dispense(slot.name)
        finally:
            m.state = IDLE
        return slot.name, change


class DispensingState(State):           # transient: refuses everything until the item has dropped
    reason = "busy"


class OutOfServiceState(State):
    reason = "out-of-service"

    def cancel(self, m):
        return {}


IDLE, HAS_MONEY = IdleState(), HasMoneyState()
DISPENSING, OUT_OF_SERVICE = DispensingState(), OutOfServiceState()


class VendingMachine:
    def __init__(self, inventory, maker, coins=None, on_dispense=None):
        self.inventory, self.maker, self.on_dispense = inventory, maker, on_dispense
        self.bank = {d: 0 for d in DENOMS}
        self.escrow, self.credit, self.state = {}, 0, IDLE
        self.lock = threading.RLock()   # ponytail: one lock, a machine serves one customer at a time
        for d, n in (coins or {}).items():
            self.load_coins(d, n)

    def add_coin(self, denom):          # called by states, lock already held
        if denom not in self.bank:
            raise VendingError("bad-coin")
        self.escrow[denom] = self.escrow.get(denom, 0) + 1
        self.credit += denom

    def take_escrow(self):
        out, self.escrow, self.credit = self.escrow, {}, 0
        return out

    def insert(self, denom):
        with self.lock:
            self.state.insert(self, denom)

    def select(self, code):
        with self.lock:
            return self.state.select(self, code)

    def cancel(self):
        with self.lock:
            return self.state.cancel(self)

    def restock(self, code, name, price, qty):      # admin
        with self.lock:
            self.inventory.restock(code, name, price, qty)

    def load_coins(self, denom, n):                 # admin
        with self.lock:
            if denom not in self.bank:
                raise VendingError("bad-coin")
            self.bank[denom] += n

    def set_service(self, up):                      # admin: going down refunds whatever was inserted
        with self.lock:
            if self.state is DISPENSING:
                raise VendingError("busy")
            if up:
                if self.state is OUT_OF_SERVICE:
                    self.state = IDLE
                return {}
            refund = self.take_escrow()
            self.state = OUT_OF_SERVICE
            return refund


def expect(code, fn):
    try:
        fn()
    except VendingError as e:
        assert e.code == code, (code, e.code)
        return
    raise AssertionError("expected " + code)


def demo():
    inv = Inventory()
    vm = VendingMachine(inv, GreedyChange(), {25: 4, 10: 4, 5: 4})
    vm.restock("A1", "Cola", 125, 2)
    vm.restock("A2", "Chips", 75, 1)
    vm.restock("B1", "Gum", 35, 0)
    expect("no-money", lambda: vm.select("A1"))             # nothing inserted yet
    vm.insert(100)
    vm.insert(100)
    expect("sold-out", lambda: vm.select("B1"))             # an error leaves the credit alone
    expect("unknown-slot", lambda: vm.select("Z9"))
    assert vm.credit == 200 and vm.state is HAS_MONEY
    assert vm.select("A1") == ("Cola", {25: 3})             # 200 - 125 = 75 as three quarters
    assert inv.get("A1").qty == 1 and vm.state is IDLE and vm.bank[100] == 2
    vm.insert(25)
    expect("insufficient", lambda: vm.select("A1"))
    assert vm.cancel() == {25: 1} and vm.state is IDLE and vm.bank[25] == 1   # refund, bank untouched
    expect("bad-coin", lambda: vm.insert(7))
    # exact change impossible: empty bank, 100 inserted for a 75 item
    poor = VendingMachine(Inventory(), GreedyChange())
    poor.restock("A2", "Chips", 75, 1)
    poor.insert(100)
    expect("no-change", lambda: poor.select("A2"))
    assert poor.cancel() == {100: 1}
    for _ in range(3):
        poor.insert(25)                                     # exact money needs no change
    assert poor.select("A2") == ("Chips", {})
    poor.insert(25)
    expect("sold-out", lambda: poor.select("A2"))
    # greedy fails where a feasible answer exists; the search strategy finds it
    bank = {25: 1, 10: 3}
    assert GreedyChange().make(30, bank) is None
    assert SearchChange().make(30, bank) == {10: 3}
    smart = VendingMachine(Inventory(), SearchChange(), bank)
    smart.restock("C1", "Water", 70, 1)
    smart.insert(100)
    assert smart.select("C1") == ("Water", {10: 3})
    # out of service: refund on the way down, refuse everything, come back
    vm.insert(100)
    assert vm.set_service(False) == {100: 1}
    expect("out-of-service", lambda: vm.insert(25))
    expect("out-of-service", lambda: vm.select("A1"))
    vm.set_service(True)
    assert vm.state is IDLE
    # dispensing is a real state: inserts during the drop are refused
    seen = []

    def hook(name):
        seen.append(vm.state)
        expect("busy", lambda: vm.insert(5))
    vm.on_dispense = hook
    vm.restock("B1", "Gum", 35, 3)                          # restocking adds to the quantity
    vm.insert(25)
    vm.insert(10)
    assert vm.select("B1") == ("Gum", {}) and seen == [DISPENSING] and vm.state is IDLE
    print("vending ok")


if __name__ == "__main__":
    demo()`, js: String.raw`const assert = require('assert');

const DENOMS = [500, 100, 25, 10, 5];          // cents, largest first; 100 and 500 are bills

class VendingError extends Error {
  constructor(code) { super(code); this.code = code; }
}

class Slot {
  constructor(name, price, qty) { this.name = name; this.price = price; this.qty = qty; }
}

class Inventory {
  constructor() { this.slots = new Map(); }
  restock(code, name, price, qty) {
    const s = this.slots.get(code);
    if (!s) this.slots.set(code, new Slot(name, price, qty));
    else { s.name = name; s.price = price; s.qty += qty; }
  }
  get(code) {
    if (!this.slots.has(code)) throw new VendingError('unknown-slot');
    return this.slots.get(code);
  }
}

class GreedyChange {                           // optimal and always succeeds with unlimited canonical coins
  make(amount, bank) {
    const out = new Map();
    for (const d of DENOMS) {
      const n = Math.min(Math.floor(amount / d), bank.get(d) || 0);
      if (n) { out.set(d, n); amount -= n * d; }
    }
    return amount === 0 ? out : null;
  }
}

class SearchChange {                           // limited coins: backtracks, so it finds an answer whenever one exists
  make(amount, bank) {
    const go = (i, rem) => {
      if (rem === 0) return new Map();
      if (i === DENOMS.length) return null;
      const d = DENOMS[i];
      for (let n = Math.min(Math.floor(rem / d), bank.get(d) || 0); n >= 0; n--) {
        const rest = go(i + 1, rem - n * d);
        if (rest) { if (n) rest.set(d, n); return rest; }
      }
      return null;
    };
    return go(0, amount);
  }
}

class State {                                  // default: every action is refused with this reason
  constructor(reason) { this.reason = reason; }
  insert() { throw new VendingError(this.reason); }
  select() { throw new VendingError(this.reason); }
  cancel() { throw new VendingError(this.reason); }
}

class IdleState extends State {
  constructor() { super('no-money'); }
  insert(m, denom) { m.addCoin(denom); m.state = HAS_MONEY; }
  cancel() { return new Map(); }
}

class HasMoneyState extends State {
  constructor() { super('busy'); }
  insert(m, denom) { m.addCoin(denom); }
  cancel(m) { const refund = m.takeEscrow(); m.state = IDLE; return refund; }
  select(m, code) {
    const slot = m.inventory.get(code);
    if (slot.qty === 0) throw new VendingError('sold-out');
    if (m.credit < slot.price) throw new VendingError('insufficient');
    const pool = new Map(m.bank);              // change may use the coins just inserted
    for (const [d, n] of m.escrow) pool.set(d, pool.get(d) + n);
    const change = m.maker.make(m.credit - slot.price, pool);
    if (!change) throw new VendingError('no-change');   // nothing was touched: the customer can cancel
    m.state = DISPENSING;
    try {
      slot.qty -= 1;
      for (const [d, n] of change) pool.set(d, pool.get(d) - n);
      m.bank = pool; m.escrow = new Map(); m.credit = 0;
      if (m.onDispense) m.onDispense(slot.name);
    } finally {
      m.state = IDLE;
    }
    return [slot.name, change];
  }
}

class DispensingState extends State {          // transient: refuses everything until the item has dropped
  constructor() { super('busy'); }
}

class OutOfServiceState extends State {
  constructor() { super('out-of-service'); }
  cancel() { return new Map(); }
}

const IDLE = new IdleState(), HAS_MONEY = new HasMoneyState();
const DISPENSING = new DispensingState(), OUT_OF_SERVICE = new OutOfServiceState();

class VendingMachine {                         // JS runs one task at a time, so no lock is needed here
  constructor(inventory, maker, coins = {}, onDispense = null) {
    this.inventory = inventory; this.maker = maker; this.onDispense = onDispense;
    this.bank = new Map(DENOMS.map(d => [d, 0]));
    this.escrow = new Map(); this.credit = 0; this.state = IDLE;
    for (const [d, n] of Object.entries(coins)) this.loadCoins(Number(d), n);
  }
  addCoin(denom) {                             // called by states
    if (!this.bank.has(denom)) throw new VendingError('bad-coin');
    this.escrow.set(denom, (this.escrow.get(denom) || 0) + 1);
    this.credit += denom;
  }
  takeEscrow() {
    const out = this.escrow;
    this.escrow = new Map(); this.credit = 0;
    return out;
  }
  insert(denom) { this.state.insert(this, denom); }
  select(code) { return this.state.select(this, code); }
  cancel() { return this.state.cancel(this); }
  restock(code, name, price, qty) { this.inventory.restock(code, name, price, qty); }   // admin
  loadCoins(denom, n) {                        // admin
    if (!this.bank.has(denom)) throw new VendingError('bad-coin');
    this.bank.set(denom, this.bank.get(denom) + n);
  }
  setService(up) {                             // admin: going down refunds whatever was inserted
    if (this.state === DISPENSING) throw new VendingError('busy');
    if (up) {
      if (this.state === OUT_OF_SERVICE) this.state = IDLE;
      return new Map();
    }
    const refund = this.takeEscrow();
    this.state = OUT_OF_SERVICE;
    return refund;
  }
}

function expectCode(code, fn) {
  try { fn(); } catch (e) {
    assert(e instanceof VendingError && e.code === code, 'wanted ' + code + ', got ' + e.message);
    return;
  }
  assert.fail('expected ' + code);
}
const M = (obj) => new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));

function demo() {
  const inv = new Inventory();
  const vm = new VendingMachine(inv, new GreedyChange(), { 25: 4, 10: 4, 5: 4 });
  vm.restock('A1', 'Cola', 125, 2);
  vm.restock('A2', 'Chips', 75, 1);
  vm.restock('B1', 'Gum', 35, 0);
  expectCode('no-money', () => vm.select('A1'));            // nothing inserted yet
  vm.insert(100);
  vm.insert(100);
  expectCode('sold-out', () => vm.select('B1'));            // an error leaves the credit alone
  expectCode('unknown-slot', () => vm.select('Z9'));
  assert(vm.credit === 200 && vm.state === HAS_MONEY);
  assert.deepStrictEqual(vm.select('A1'), ['Cola', M({ 25: 3 })]);   // 200 - 125 = 75 as three quarters
  assert(inv.get('A1').qty === 1 && vm.state === IDLE && vm.bank.get(100) === 2);
  vm.insert(25);
  expectCode('insufficient', () => vm.select('A1'));
  assert.deepStrictEqual(vm.cancel(), M({ 25: 1 }));        // refund, bank untouched
  assert(vm.state === IDLE && vm.bank.get(25) === 1);
  expectCode('bad-coin', () => vm.insert(7));
  // exact change impossible: empty bank, 100 inserted for a 75 item
  const poor = new VendingMachine(new Inventory(), new GreedyChange());
  poor.restock('A2', 'Chips', 75, 1);
  poor.insert(100);
  expectCode('no-change', () => poor.select('A2'));
  assert.deepStrictEqual(poor.cancel(), M({ 100: 1 }));
  for (let i = 0; i < 3; i++) poor.insert(25);              // exact money needs no change
  assert.deepStrictEqual(poor.select('A2'), ['Chips', new Map()]);
  poor.insert(25);
  expectCode('sold-out', () => poor.select('A2'));
  // greedy fails where a feasible answer exists; the search strategy finds it
  const bank = M({ 25: 1, 10: 3 });
  assert.strictEqual(new GreedyChange().make(30, bank), null);
  assert.deepStrictEqual(new SearchChange().make(30, bank), M({ 10: 3 }));
  const smart = new VendingMachine(new Inventory(), new SearchChange(), { 25: 1, 10: 3 });
  smart.restock('C1', 'Water', 70, 1);
  smart.insert(100);
  assert.deepStrictEqual(smart.select('C1'), ['Water', M({ 10: 3 })]);
  // out of service: refund on the way down, refuse everything, come back
  vm.insert(100);
  assert.deepStrictEqual(vm.setService(false), M({ 100: 1 }));
  expectCode('out-of-service', () => vm.insert(25));
  expectCode('out-of-service', () => vm.select('A1'));
  vm.setService(true);
  assert(vm.state === IDLE);
  // dispensing is a real state: inserts during the drop are refused
  const seen = [];
  vm.onDispense = () => { seen.push(vm.state); expectCode('busy', () => vm.insert(5)); };
  vm.restock('B1', 'Gum', 35, 3);                           // restocking adds to the quantity
  vm.insert(25);
  vm.insert(10);
  assert.deepStrictEqual(vm.select('B1'), ['Gum', new Map()]);
  assert(seen.length === 1 && seen[0] === DISPENSING && vm.state === IDLE);
  console.log('vending ok');
}

demo();`, java: String.raw`import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Consumer;

public class Vending {
    static final int[] DENOMS = {500, 100, 25, 10, 5};      // cents, largest first; 100 and 500 are bills

    static class VendingError extends RuntimeException {
        final String code;
        VendingError(String code) { super(code); this.code = code; }
    }

    static class Slot {
        String name; int price, qty;
        Slot(String name, int price, int qty) { this.name = name; this.price = price; this.qty = qty; }
    }

    static class Inventory {
        final Map<String, Slot> slots = new HashMap<>();
        void restock(String code, String name, int price, int qty) {
            Slot s = slots.get(code);
            if (s == null) slots.put(code, new Slot(name, price, qty));
            else { s.name = name; s.price = price; s.qty += qty; }
        }
        Slot get(String code) {
            Slot s = slots.get(code);
            if (s == null) throw new VendingError("unknown-slot");
            return s;
        }
    }

    interface ChangeMaker {                                  // Strategy: pay 'amount' out of the coins in 'bank'
        Map<Integer, Integer> make(int amount, Map<Integer, Integer> bank);   // null when impossible
    }

    static class GreedyChange implements ChangeMaker {       // optimal and always succeeds with unlimited canonical coins
        public Map<Integer, Integer> make(int amount, Map<Integer, Integer> bank) {
            Map<Integer, Integer> out = new HashMap<>();
            for (int d : DENOMS) {
                int n = Math.min(amount / d, bank.getOrDefault(d, 0));
                if (n > 0) { out.put(d, n); amount -= n * d; }
            }
            return amount == 0 ? out : null;
        }
    }

    static class SearchChange implements ChangeMaker {       // limited coins: backtracks, finds an answer whenever one exists
        public Map<Integer, Integer> make(int amount, Map<Integer, Integer> bank) {
            return go(0, amount, bank);
        }
        private Map<Integer, Integer> go(int i, int rem, Map<Integer, Integer> bank) {
            if (rem == 0) return new HashMap<>();
            if (i == DENOMS.length) return null;
            int d = DENOMS[i];
            for (int n = Math.min(rem / d, bank.getOrDefault(d, 0)); n >= 0; n--) {
                Map<Integer, Integer> rest = go(i + 1, rem - n * d, bank);
                if (rest != null) { if (n > 0) rest.put(d, n); return rest; }
            }
            return null;
        }
    }

    static class Result {
        final String item; final Map<Integer, Integer> change;
        Result(String item, Map<Integer, Integer> change) { this.item = item; this.change = change; }
    }

    static abstract class State {                            // default: every action is refused with this reason
        final String reason;
        State(String reason) { this.reason = reason; }
        void insert(Machine m, int denom) { throw new VendingError(reason); }
        Result select(Machine m, String code) { throw new VendingError(reason); }
        Map<Integer, Integer> cancel(Machine m) { throw new VendingError(reason); }
    }

    static class IdleState extends State {
        IdleState() { super("no-money"); }
        void insert(Machine m, int denom) { m.addCoin(denom); m.state = HAS_MONEY; }
        Map<Integer, Integer> cancel(Machine m) { return new HashMap<>(); }
    }

    static class HasMoneyState extends State {
        HasMoneyState() { super("busy"); }
        void insert(Machine m, int denom) { m.addCoin(denom); }
        Map<Integer, Integer> cancel(Machine m) { Map<Integer, Integer> r = m.takeEscrow(); m.state = IDLE; return r; }
        Result select(Machine m, String code) {
            Slot slot = m.inventory.get(code);
            if (slot.qty == 0) throw new VendingError("sold-out");
            if (m.credit < slot.price) throw new VendingError("insufficient");
            Map<Integer, Integer> pool = new HashMap<>(m.bank);   // change may use the coins just inserted
            m.escrow.forEach((d, n) -> pool.merge(d, n, Integer::sum));
            Map<Integer, Integer> change = m.maker.make(m.credit - slot.price, pool);
            if (change == null) throw new VendingError("no-change");   // nothing was touched: the customer can cancel
            m.state = DISPENSING;
            try {
                slot.qty--;
                change.forEach((d, n) -> pool.merge(d, -n, Integer::sum));
                m.bank = pool; m.escrow = new HashMap<>(); m.credit = 0;
                if (m.onDispense != null) m.onDispense.accept(slot.name);
            } finally {
                m.state = IDLE;
            }
            return new Result(slot.name, change);
        }
    }

    static class DispensingState extends State {             // transient: refuses everything until the item has dropped
        DispensingState() { super("busy"); }
    }

    static class OutOfServiceState extends State {
        OutOfServiceState() { super("out-of-service"); }
        Map<Integer, Integer> cancel(Machine m) { return new HashMap<>(); }
    }

    static final State IDLE = new IdleState(), HAS_MONEY = new HasMoneyState();
    static final State DISPENSING = new DispensingState(), OUT_OF_SERVICE = new OutOfServiceState();

    static class Machine {
        final Inventory inventory; final ChangeMaker maker;
        Consumer<String> onDispense;
        Map<Integer, Integer> bank = new HashMap<>(), escrow = new HashMap<>();
        int credit = 0;
        State state = IDLE;
        private final ReentrantLock lock = new ReentrantLock();   // ponytail: one lock, a machine serves one customer at a time

        Machine(Inventory inventory, ChangeMaker maker, Map<Integer, Integer> coins) {
            this.inventory = inventory; this.maker = maker;
            for (int d : DENOMS) bank.put(d, 0);
            coins.forEach(this::loadCoins);
        }

        void addCoin(int denom) {                            // called by states, lock already held
            if (!bank.containsKey(denom)) throw new VendingError("bad-coin");
            escrow.merge(denom, 1, Integer::sum);
            credit += denom;
        }
        Map<Integer, Integer> takeEscrow() {
            Map<Integer, Integer> out = escrow;
            escrow = new HashMap<>(); credit = 0;
            return out;
        }
        void insert(int denom) { lock.lock(); try { state.insert(this, denom); } finally { lock.unlock(); } }
        Result select(String code) { lock.lock(); try { return state.select(this, code); } finally { lock.unlock(); } }
        Map<Integer, Integer> cancel() { lock.lock(); try { return state.cancel(this); } finally { lock.unlock(); } }

        void restock(String code, String name, int price, int qty) {       // admin
            lock.lock();
            try { inventory.restock(code, name, price, qty); } finally { lock.unlock(); }
        }
        void loadCoins(int denom, int n) {                   // admin
            lock.lock();
            try {
                if (!bank.containsKey(denom)) throw new VendingError("bad-coin");
                bank.merge(denom, n, Integer::sum);
            } finally { lock.unlock(); }
        }
        Map<Integer, Integer> setService(boolean up) {       // admin: going down refunds whatever was inserted
            lock.lock();
            try {
                if (state == DISPENSING) throw new VendingError("busy");
                if (up) {
                    if (state == OUT_OF_SERVICE) state = IDLE;
                    return new HashMap<>();
                }
                Map<Integer, Integer> refund = takeEscrow();
                state = OUT_OF_SERVICE;
                return refund;
            } finally { lock.unlock(); }
        }
    }

    static void check(boolean c, String what) {
        if (!c) { System.err.println("FAILED: " + what); System.exit(1); }
    }

    static void expect(String code, Runnable r) {
        try { r.run(); } catch (VendingError e) { check(e.code.equals(code), "wanted " + code + " got " + e.code); return; }
        check(false, "expected " + code);
    }

    public static void main(String[] args) {
        Inventory inv = new Inventory();
        Machine vm = new Machine(inv, new GreedyChange(), Map.of(25, 4, 10, 4, 5, 4));
        vm.restock("A1", "Cola", 125, 2);
        vm.restock("A2", "Chips", 75, 1);
        vm.restock("B1", "Gum", 35, 0);
        expect("no-money", () -> vm.select("A1"));                 // nothing inserted yet
        vm.insert(100);
        vm.insert(100);
        expect("sold-out", () -> vm.select("B1"));                 // an error leaves the credit alone
        expect("unknown-slot", () -> vm.select("Z9"));
        check(vm.credit == 200 && vm.state == HAS_MONEY, "credit kept");
        Result r = vm.select("A1");
        check(r.item.equals("Cola") && r.change.equals(Map.of(25, 3)), "change 75");   // 200 - 125 as three quarters
        check(inv.get("A1").qty == 1 && vm.state == IDLE && vm.bank.get(100) == 2, "stock and bank");
        vm.insert(25);
        expect("insufficient", () -> vm.select("A1"));
        check(vm.cancel().equals(Map.of(25, 1)) && vm.state == IDLE && vm.bank.get(25) == 1, "refund");
        expect("bad-coin", () -> vm.insert(7));
        // exact change impossible: empty bank, 100 inserted for a 75 item
        Machine poor = new Machine(new Inventory(), new GreedyChange(), Map.of());
        poor.restock("A2", "Chips", 75, 1);
        poor.insert(100);
        expect("no-change", () -> poor.select("A2"));
        check(poor.cancel().equals(Map.of(100, 1)), "refund 100");
        for (int i = 0; i < 3; i++) poor.insert(25);               // exact money needs no change
        check(poor.select("A2").change.isEmpty(), "exact payment");
        poor.insert(25);
        expect("sold-out", () -> poor.select("A2"));
        // greedy fails where a feasible answer exists; the search strategy finds it
        Map<Integer, Integer> bank = Map.of(25, 1, 10, 3);
        check(new GreedyChange().make(30, bank) == null, "greedy misses");
        check(new SearchChange().make(30, bank).equals(Map.of(10, 3)), "search finds");
        Machine smart = new Machine(new Inventory(), new SearchChange(), bank);
        smart.restock("C1", "Water", 70, 1);
        smart.insert(100);
        check(smart.select("C1").change.equals(Map.of(10, 3)), "machine uses search");
        // out of service: refund on the way down, refuse everything, come back
        vm.insert(100);
        check(vm.setService(false).equals(Map.of(100, 1)), "refund on shutdown");
        expect("out-of-service", () -> vm.insert(25));
        expect("out-of-service", () -> vm.select("A1"));
        vm.setService(true);
        check(vm.state == IDLE, "back in service");
        // dispensing is a real state: inserts during the drop are refused
        List<State> seen = new ArrayList<>();
        vm.onDispense = name -> { seen.add(vm.state); expect("busy", () -> vm.insert(5)); };
        vm.restock("B1", "Gum", 35, 3);                            // restocking adds to the quantity
        vm.insert(25);
        vm.insert(10);
        check(vm.select("B1").change.isEmpty(), "gum");
        check(seen.size() == 1 && seen.get(0) == DISPENSING && vm.state == IDLE, "dispensing state seen");
        System.out.println("vending ok");
    }
}`, cpp: String.raw`#include <algorithm>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <map>
#include <memory>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>

using Coins = std::map<int, int>;                          // denomination in cents -> count
static const int DENOMS[] = {500, 100, 25, 10, 5};         // largest first; 100 and 500 are bills

struct VendingError : std::runtime_error {
    std::string code;
    explicit VendingError(const std::string& c) : std::runtime_error(c), code(c) {}
};

struct Slot { std::string name; int price, qty; };

class Inventory {
public:
    void restock(const std::string& code, const std::string& name, int price, int qty) {
        auto it = slots.find(code);
        if (it == slots.end()) slots[code] = {name, price, qty};
        else { it->second.name = name; it->second.price = price; it->second.qty += qty; }
    }
    Slot& get(const std::string& code) {
        auto it = slots.find(code);
        if (it == slots.end()) throw VendingError("unknown-slot");
        return it->second;
    }
private:
    std::map<std::string, Slot> slots;
};

struct ChangeMaker {                                       // Strategy: pay 'amount' out of the coins in 'bank'
    virtual ~ChangeMaker() = default;
    virtual std::optional<Coins> make(int amount, const Coins& bank) = 0;   // nullopt when impossible
};

static int have(const Coins& bank, int d) { auto it = bank.find(d); return it == bank.end() ? 0 : it->second; }

struct GreedyChange : ChangeMaker {                        // optimal and always succeeds with unlimited canonical coins
    std::optional<Coins> make(int amount, const Coins& bank) override {
        Coins out;
        for (int d : DENOMS) {
            int n = std::min(amount / d, have(bank, d));
            if (n > 0) { out[d] = n; amount -= n * d; }
        }
        if (amount != 0) return std::nullopt;
        return out;
    }
};

struct SearchChange : ChangeMaker {                        // limited coins: backtracks, finds an answer whenever one exists
    std::optional<Coins> make(int amount, const Coins& bank) override { return go(0, amount, bank); }
private:
    std::optional<Coins> go(size_t i, int rem, const Coins& bank) {
        if (rem == 0) return Coins{};
        if (i == std::size(DENOMS)) return std::nullopt;
        int d = DENOMS[i];
        for (int n = std::min(rem / d, have(bank, d)); n >= 0; n--) {
            auto rest = go(i + 1, rem - n * d, bank);
            if (rest) { if (n > 0) (*rest)[d] = n; return rest; }
        }
        return std::nullopt;
    }
};

struct Machine;
struct Result { std::string item; Coins change; };

struct State {                                             // default: every action is refused with this reason
    explicit State(std::string r) : reason(std::move(r)) {}
    virtual ~State() = default;
    virtual void insert(Machine&, int) { throw VendingError(reason); }
    virtual Result select(Machine&, const std::string&) { throw VendingError(reason); }
    virtual Coins cancel(Machine&) { throw VendingError(reason); }
    std::string reason;
};
struct IdleState : State {
    IdleState() : State("no-money") {}
    void insert(Machine& m, int denom) override;
    Coins cancel(Machine&) override { return {}; }
};
struct HasMoneyState : State {
    HasMoneyState() : State("busy") {}
    void insert(Machine& m, int denom) override;
    Coins cancel(Machine& m) override;
    Result select(Machine& m, const std::string& code) override;
};
struct DispensingState : State {                           // transient: refuses everything until the item has dropped
    DispensingState() : State("busy") {}
};
struct OutOfServiceState : State {
    OutOfServiceState() : State("out-of-service") {}
    Coins cancel(Machine&) override { return {}; }
};
static IdleState IDLE;
static HasMoneyState HAS_MONEY;
static DispensingState DISPENSING;
static OutOfServiceState OUT_OF_SERVICE;

struct Machine {
    Inventory& inventory;
    std::unique_ptr<ChangeMaker> maker;
    std::function<void(const std::string&)> onDispense;
    Coins bank, escrow;
    int credit = 0;
    State* state = &IDLE;
    std::recursive_mutex mu;                               // ponytail: one lock, a machine serves one customer at a time

    Machine(Inventory& inv, std::unique_ptr<ChangeMaker> mk, const Coins& coins = {})
        : inventory(inv), maker(std::move(mk)) {
        for (int d : DENOMS) bank[d] = 0;
        for (auto& [d, n] : coins) loadCoins(d, n);
    }
    void addCoin(int denom) {                              // called by states, lock already held
        if (!bank.count(denom)) throw VendingError("bad-coin");
        escrow[denom]++;
        credit += denom;
    }
    Coins takeEscrow() { Coins out = std::move(escrow); escrow.clear(); credit = 0; return out; }

    void insert(int denom) { std::lock_guard<std::recursive_mutex> g(mu); state->insert(*this, denom); }
    Result select(const std::string& code) { std::lock_guard<std::recursive_mutex> g(mu); return state->select(*this, code); }
    Coins cancel() { std::lock_guard<std::recursive_mutex> g(mu); return state->cancel(*this); }
    void restock(const std::string& code, const std::string& name, int price, int qty) {        // admin
        std::lock_guard<std::recursive_mutex> g(mu);
        inventory.restock(code, name, price, qty);
    }
    void loadCoins(int denom, int n) {                     // admin
        std::lock_guard<std::recursive_mutex> g(mu);
        if (!bank.count(denom)) throw VendingError("bad-coin");
        bank[denom] += n;
    }
    Coins setService(bool up) {                            // admin: going down refunds whatever was inserted
        std::lock_guard<std::recursive_mutex> g(mu);
        if (state == &DISPENSING) throw VendingError("busy");
        if (up) {
            if (state == &OUT_OF_SERVICE) state = &IDLE;
            return {};
        }
        Coins refund = takeEscrow();
        state = &OUT_OF_SERVICE;
        return refund;
    }
};

void IdleState::insert(Machine& m, int denom) { m.addCoin(denom); m.state = &HAS_MONEY; }
void HasMoneyState::insert(Machine& m, int denom) { m.addCoin(denom); }
Coins HasMoneyState::cancel(Machine& m) { Coins r = m.takeEscrow(); m.state = &IDLE; return r; }
Result HasMoneyState::select(Machine& m, const std::string& code) {
    Slot& slot = m.inventory.get(code);
    if (slot.qty == 0) throw VendingError("sold-out");
    if (m.credit < slot.price) throw VendingError("insufficient");
    Coins pool = m.bank;                                   // change may use the coins just inserted
    for (auto& [d, n] : m.escrow) pool[d] += n;
    auto change = m.maker->make(m.credit - slot.price, pool);
    if (!change) throw VendingError("no-change");          // nothing was touched: the customer can cancel
    m.state = &DISPENSING;
    try {
        slot.qty--;
        for (auto& [d, n] : *change) pool[d] -= n;
        m.bank = pool; m.escrow.clear(); m.credit = 0;
        if (m.onDispense) m.onDispense(slot.name);
    } catch (...) {
        m.state = &IDLE;
        throw;
    }
    m.state = &IDLE;
    return {slot.name, *change};
}

#define CHECK(c) do { if (!(c)) { std::cerr << "FAILED: " #c "\n"; std::exit(1); } } while (0)

static void expect(const std::string& code, const std::function<void()>& f) {
    try { f(); } catch (const VendingError& e) { CHECK(e.code == code); return; }
    std::cerr << "expected " << code << "\n";
    std::exit(1);
}

int main() {
    Inventory inv;
    Machine vm(inv, std::make_unique<GreedyChange>(), {{25, 4}, {10, 4}, {5, 4}});
    vm.restock("A1", "Cola", 125, 2);
    vm.restock("A2", "Chips", 75, 1);
    vm.restock("B1", "Gum", 35, 0);
    expect("no-money", [&] { vm.select("A1"); });          // nothing inserted yet
    vm.insert(100);
    vm.insert(100);
    expect("sold-out", [&] { vm.select("B1"); });          // an error leaves the credit alone
    expect("unknown-slot", [&] { vm.select("Z9"); });
    CHECK(vm.credit == 200 && vm.state == &HAS_MONEY);
    Result r = vm.select("A1");
    CHECK(r.item == "Cola" && r.change == (Coins{{25, 3}}));   // 200 - 125 = 75 as three quarters
    CHECK(inv.get("A1").qty == 1 && vm.state == &IDLE && vm.bank[100] == 2);
    vm.insert(25);
    expect("insufficient", [&] { vm.select("A1"); });
    CHECK(vm.cancel() == (Coins{{25, 1}}) && vm.state == &IDLE && vm.bank[25] == 1);   // refund, bank untouched
    expect("bad-coin", [&] { vm.insert(7); });
    // exact change impossible: empty bank, 100 inserted for a 75 item
    Inventory poorInv;
    Machine poor(poorInv, std::make_unique<GreedyChange>());
    poor.restock("A2", "Chips", 75, 1);
    poor.insert(100);
    expect("no-change", [&] { poor.select("A2"); });
    CHECK(poor.cancel() == (Coins{{100, 1}}));
    for (int i = 0; i < 3; i++) poor.insert(25);           // exact money needs no change
    CHECK(poor.select("A2").change.empty());
    poor.insert(25);
    expect("sold-out", [&] { poor.select("A2"); });
    // greedy fails where a feasible answer exists; the search strategy finds it
    Coins bank{{25, 1}, {10, 3}};
    CHECK(!GreedyChange().make(30, bank));
    CHECK(SearchChange().make(30, bank).value() == (Coins{{10, 3}}));
    Inventory smartInv;
    Machine smart(smartInv, std::make_unique<SearchChange>(), bank);
    smart.restock("C1", "Water", 70, 1);
    smart.insert(100);
    CHECK(smart.select("C1").change == (Coins{{10, 3}}));
    // out of service: refund on the way down, refuse everything, come back
    vm.insert(100);
    CHECK(vm.setService(false) == (Coins{{100, 1}}));
    expect("out-of-service", [&] { vm.insert(25); });
    expect("out-of-service", [&] { vm.select("A1"); });
    vm.setService(true);
    CHECK(vm.state == &IDLE);
    // dispensing is a real state: inserts during the drop are refused
    int seen = 0;
    vm.onDispense = [&](const std::string&) {
        seen += vm.state == &DISPENSING;
        expect("busy", [&] { vm.insert(5); });
    };
    vm.restock("B1", "Gum", 35, 3);                        // restocking adds to the quantity
    vm.insert(25);
    vm.insert(10);
    CHECK(vm.select("B1").change.empty());
    CHECK(seen == 1 && vm.state == &IDLE);
    std::cout << "vending ok\n";
}` } }
    ],

    extensions: [
      { q: 'Add **card and mobile payments**. What changes?', a: 'Introduce a `PaymentMethod` Strategy with `authorize(amount)`, `capture()` and `release()`. Cash becomes one implementation, where "authorize" means credit is already in escrow and "release" is a coin refund. A card implementation authorizes the exact price at selection time, so there is **no change** and no coin bank involved.\n\nThe State machine barely moves: HasMoney becomes "payment in progress", and the selection path asks the method to authorize instead of comparing credit to price. Add a `Pending` state if authorization is asynchronous, with a timeout that releases the hold.' },
      { q: 'How do you **restock**, and what should happen to a sale in progress?', a: 'Restock is an admin method that adds to a slot\'s quantity (and may change its price), taken under the same lock. A sale in progress either sees the old or the new quantity, never half of each. Putting the machine out of service first is the careful path: it refunds any inserted money, then the operator restocks and sets it back in service.\n\nFor a fleet, log each restock as an event (slot, delta, time, operator), so inventory can be audited and demand predicted.' },
      { q: 'Add an **admin mode** with a PIN. Where does it live?', a: 'Not as a customer state. Make admin operations a separate facade or interface (`AdminPanel`) that holds a reference to the machine and checks a credential, then calls the same locked methods (`restock`, `loadCoins`, `setService`). Customers never see those methods.\n\nIf admin entry should lock out customers, the panel calls `setService(false)` first, which refunds the credit and moves to OutOfService. That keeps one rule: customer actions are only valid when the machine is Idle or HasMoney.' },
      { q: 'The machine runs out of coins often. How do you **reduce failed sales**?', a: 'Three levers. (1) Use `SearchChange` so a feasible answer is never missed. (2) Prefer paying change with coins the machine has plenty of, which means a different objective than "fewest coins" (a DP with costs). (3) Refuse early: if the bank is low, show **exact change only** and reject bills that would need change, instead of letting the customer discover the problem after selecting.\n\nAlso report low coins to the operator so a refill is scheduled before the machine degrades.' },
      { q: 'How would you test the **state machine** thoroughly?', a: 'Build a table of (state, action) pairs and assert both the result and the next state. That is 4 states x 3 customer actions plus the admin calls, small enough to enumerate. Add property checks for the money invariant: after any random sequence of valid actions, bank plus escrow plus everything handed out equals everything ever inserted plus the initial bank.\n\nInject the dispense callback to prove the Dispensing state refuses input, and use a fake `ChangeMaker` to force the no-change path without engineering a coin bank.' }
    ],

    quiz: [
      { kind: 'pattern', q: 'A customer inserts a coin while the item is still dropping. Behavior must differ from the idle machine without a growing `switch (state)` in every method. Which pattern is this?', choices: ['State', 'Observer', 'Factory', 'Flyweight'], answer: 0, explain: 'The machine delegates each action to its current state object. Each state decides what is allowed and which state is next.' },
      { kind: 'bug', q: 'A customer selects a 75-cent item with a 1-dollar bill. The machine has no coins, takes the bill, then discovers it cannot give 25 cents back. What is the design mistake?', choices: ['It committed money before validating that change was possible', 'The bill should have been rejected at insertion', 'Greedy change is always wrong', 'The item should be free'], answer: 0, explain: 'Validate everything (stock, credit, change) before changing anything. If change is impossible, refuse the sale and keep the credit so the customer can cancel.' },
      { kind: 'concept', q: 'The bank holds one 25-cent coin and three 10-cent coins. A sale needs 30 cents of change. What do a greedy change maker and a backtracking one return?', choices: ['Greedy fails, backtracking returns three dimes', 'Both return one quarter and one nickel', 'Both return three dimes', 'Greedy returns three dimes, backtracking fails'], answer: 0, explain: 'Greedy takes the quarter and then cannot pay the remaining 5 cents. Backtracking undoes the quarter and finds three dimes. Greedy is only guaranteed when coins are not limited.' },
      { kind: 'complexity', q: 'Which statement about greedy change-making is correct?', choices: ['It is optimal for canonical systems like 1, 5, 10, 25 with unlimited coins, but can be suboptimal for others like 1, 3, 4', 'It is optimal for every coin system', 'It is exponential in the amount', 'It is never correct with more than three denominations'], answer: 0, explain: 'With 1, 3, 4 and amount 6, greedy picks 4+1+1 (three coins) while 3+3 uses two. The standard US-style denominations are canonical, so greedy is fine there, if the bank is unlimited.' },
      { kind: 'concept', q: 'Why are inserted coins kept in an escrow map until the sale commits?', choices: ['A cancel can return exactly those coins, and change can still use them', 'It makes the machine faster', 'It avoids needing a lock', 'Coins must be sorted'], answer: 0, explain: 'A refund of the same coins is always possible. On commit the escrow joins the bank, so change can use the coins the customer just inserted.' },
      { kind: 'pattern', q: 'Which two designs let you add card payments without editing the states that handle selection?', choices: ['A PaymentMethod Strategy that authorizes the amount', 'Treating cash as one implementation of that interface', 'Adding an if (card) branch to every state', 'Copying the machine class per payment type'], answer: [0, 1], explain: 'Putting payment behind an interface makes cash and card two implementations. The if-branch and copy approaches spread the change across the code.' }
    ],

    flashcards: [
      { id: 'vm-state', front: 'Vending machine: why the State pattern?', back: 'Insert, select and cancel behave differently in Idle, HasMoney, Dispensing and OutOfService. Each state class implements what it allows and picks the next state, so the machine has no switch ladder and a new state adds one class.' },
      { id: 'vm-validate', front: 'Vending machine: how do you keep a failed selection from losing money?', back: 'Validate first (slot exists, in stock, credit enough, change possible) with no side effects, then commit in one step. Errors leave the credit untouched so the customer can add money, pick again or cancel.' },
      { id: 'vm-greedy', front: 'When does greedy change-making work, and when not?', back: 'It is optimal for canonical coin systems (5, 10, 25, 100) with unlimited coins. It fails on systems like 1, 3, 4 (6 = 4+1+1 vs 3+3) and with limited coins (30 from one quarter and three dimes: greedy gets stuck, three dimes work).' },
      { id: 'vm-escrow', front: 'Why escrow inserted coins?', back: 'Cancel can return exactly the coins inserted, which is always possible. They join the bank only on a completed sale, so change can use them.' },
      { id: 'vm-nochange', front: 'What if the machine cannot make exact change?', back: 'Refuse the sale before touching anything and keep the credit, so the customer can cancel or insert exact money. Optionally show exact change only and reject large bills when the bank is low.' },
      { id: 'vm-payment', front: 'How do you add card payments to the vending machine?', back: 'Put payment behind a PaymentMethod Strategy (authorize, capture, release). Cash is one implementation using escrow; a card authorizes the exact price, so there is no change. States change very little.' },
      { id: 'vm-lock', front: 'Concurrency in a vending machine?', back: 'One lock around every public method so a sale and an admin action (restock, out of service) never interleave. Beware callbacks under the lock, and prefer refunding on the way into out-of-service.' }
    ]
  });
})();
