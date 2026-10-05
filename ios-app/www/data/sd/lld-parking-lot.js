/* Low-level design: parking lot. The code under "Code" was compiled and run (Python, Node, javac, g++ -std=c++17) before it was pasted here. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.lld = SD.lld || [];
  SD.lld.push({
    id: 'parking-lot',
    title: 'Design a parking lot',
    short: 'Vehicles, spots by size, floors, tickets and fees: the classic first LLD, and a clean tour of Strategy.',
    difficulty: 'Easy',
    time: '45 min',
    tags: ['Strategy', 'Concurrency', 'Enums and sizes', 'Extensibility'],
    prompt: 'Design a multi-floor parking lot. Vehicles enter, get a ticket and a spot that fits, and pay when they leave.',

    requirements: {
      functional: [
        'Three vehicle types: **motorcycle**, **car**, **truck**. Spots come in three sizes: small, medium, large.',
        'A vehicle may use any spot at least as big as it needs (a motorcycle can take a large spot if nothing smaller is free).',
        '**Park**: find a fitting free spot, mark it taken, and issue a **ticket** with the entry time. If nothing fits, say the lot is full.',
        '**Exit**: take the ticket, free the spot, compute the **fee** from the stay, and invalidate the ticket.',
        'Fee rules are pluggable: hourly by vehicle type (partial hours round up, one hour minimum) and a flat fee.',
        'Which spot to hand out is pluggable too: first fit (closest to the entrance) or best fit (smallest that fits).'
      ],
      nonFunctional: [
        'Correct under concurrency: two cars arriving at the same moment must never get the same spot, and one ticket can be redeemed only once.',
        'Park and exit are fast: a scan over a few hundred spots is fine; no network call on the hot path.',
        'Time is injected, not read from the clock inside the logic, so fees are testable.',
        'Money is stored in integer cents, never floats.'
      ],
      assumptions: [
        'One entrance and one exit; a single lot, not a chain.',
        'A vehicle takes exactly one spot (no truck spanning two spots).',
        'Plates are unique among vehicles currently inside.'
      ],
      outOfScope: [
        'Payment processing, license-plate recognition, and gate hardware.',
        'EV charging and reserved spots: covered as extension questions.'
      ],
      clarify: [
        { q: 'Can a small vehicle take a bigger spot?', a: 'Assume yes, because it keeps the lot useful when small spots run out. It is also why spot selection is a strategy: best fit saves large spots for trucks, first fit favors walking distance.' },
        { q: 'How is the fee computed: by type, by time, flat?', a: 'Assume hourly with a per-type rate, rounded up to whole hours. Say the fee is a strategy so weekends, flat rates, or first-hour-free are new classes, not edits.' },
        { q: 'What happens when the lot is full?', a: 'Reject at the entrance with a clear error. A waitlist is a different product, so confirm it is out of scope.' },
        { q: 'Is the system single-process or distributed?', a: 'Assume one process with many entrance threads. A multi-site system moves the spot state into a database with row-level locking, which I would name but not design.' },
        { q: 'Do I need to model the entrance and exit gates?', a: 'No, I will expose park and exit as the operations the gates call. Gates are a thin adapter on top.' }
      ]
    },

    classDiagram: {
      title: 'Parking lot class diagram',
      intro: 'The lot owns floors, floors own spots. **Selecting a spot** and **pricing a stay** are the two things that change between customers, so each is behind its own interface. Click a class to see why it exists.',
      classes: [
        { id: 'lot', name: 'ParkingLot', fields: ['- floors: Floor[]', '- active: Map<int, Ticket>', '- selector: SpotSelector', '- policy: FeePolicy', '- lock'], methods: ['+ park(vehicle, now): Ticket', '+ exit(ticketId, now): cents', '+ freeSpots(): int'],
          detail: { why: 'The facade and the only place with a lock. Every state change (occupy a spot, redeem a ticket) happens inside one critical section.', tradeoffs: ['One lock keeps correctness obvious; throughput is plenty for one lot.'], alternatives: ['A lock per floor, or a database transaction when the state is shared across servers.'], scale: 'The lock is the first thing to shard if thousands of cars arrive per second.' } },
        { id: 'floor', name: 'Floor', fields: ['+ number: int', '+ spots: ParkingSpot[]'], methods: [],
          detail: { why: 'Groups spots so "closest to the entrance" has meaning and so floors can be closed for maintenance.', tradeoffs: ['An extra level of nesting for a single-floor lot.'], alternatives: ['A flat list of spots with a floor field.'], scale: 'Per-floor free counters make "is anything free here" O(1).' } },
        { id: 'spot', name: 'ParkingSpot', fields: ['+ id: string', '+ floor: int', '+ size: Size (S, M, L)', '- vehicle: Vehicle?'], methods: ['+ fits(vehicle): bool'],
          detail: { why: 'Owns the one rule that decides compatibility: free and size at least the vehicle size.', tradeoffs: ['Sizes as ordered values make fits a single comparison.'], alternatives: ['A subclass per spot type (CompactSpot, LargeSpot); more classes for no new behavior.'], scale: 'Fine at any size; the scan is in the selector.' } },
        { id: 'vehicle', name: 'Vehicle', fields: ['+ plate: string', '+ type: VehicleType (bike, car, truck)'], methods: [],
          detail: { why: 'Just data: a plate and a type. Behavior that varies by type lives in the fee policy, not in Car and Truck subclasses.', tradeoffs: ['No polymorphism means no subclass-per-vehicle explosion.'], alternatives: ['Car, Truck, Motorcycle subclasses of Vehicle; only worth it if they behave differently.'], scale: 'n/a' } },
        { id: 'ticket', name: 'Ticket', fields: ['+ id: int', '+ spot: ParkingSpot', '+ vehicle: Vehicle', '+ entry: minute'], methods: [],
          detail: { why: 'An immutable receipt. It remembers the spot, so exit does not search, and the entry time, so the fee is a pure function.', tradeoffs: ['Holds a spot reference; in a distributed system it would hold a spot id.'], alternatives: ['Look up the car by plate at exit; slower and ambiguous.'], scale: 'Active tickets live in a hash map: O(1) redeem.' } },
        { id: 'selector', name: 'SpotSelector', kind: 'interface', fields: [], methods: ['+ pick(floors, vehicle): ParkingSpot?'],
          detail: { why: 'Strategy for "which free spot". Returning nothing means the lot is full for that vehicle.', tradeoffs: ['An indirection call per park.'], alternatives: ['A flag or an if-chain in ParkingLot.'], scale: 'Best fit scans every spot, O(n); an index of free spots per size makes it O(1).' } },
        { id: 'first', name: 'FirstFit', fields: [], methods: ['+ pick(floors, vehicle)'],
          detail: { why: 'Lowest floor, first spot that fits: short walks, fills from the bottom.', tradeoffs: ['Small vehicles can eat large spots and strand trucks.'], alternatives: ['Best fit.'], scale: 'O(n) worst case.' } },
        { id: 'best', name: 'BestFit', fields: [], methods: ['+ pick(floors, vehicle)'],
          detail: { why: 'Smallest spot that fits, lowest floor on ties: keeps large spots free for trucks.', tradeoffs: ['Slightly longer walks; always scans everything.'], alternatives: ['First fit.'], scale: 'O(n); keep free spots in a heap per size to speed up.' } },
        { id: 'policy', name: 'FeePolicy', kind: 'interface', fields: [], methods: ['+ fee(ticket, minutes): cents'],
          detail: { why: 'Strategy for pricing. A pure function of the ticket and the stay length.', tradeoffs: ['New pricing rules need a class.'], alternatives: ['A big switch on vehicle type and day of week.'], scale: 'n/a' } },
        { id: 'hourly', name: 'HourlyFee', fields: ['- rates: Map<VehicleType, cents>'], methods: ['+ fee(ticket, minutes)'],
          detail: { why: 'Per-type hourly rate, partial hours round up, one hour minimum.', tradeoffs: ['Rounds in the customer-unfriendly direction; that is the business rule, not a bug.'], alternatives: ['Per-minute billing with a daily cap.'], scale: 'n/a' } },
        { id: 'flat', name: 'FlatFee', fields: ['- cents: int'], methods: ['+ fee(ticket, minutes)'],
          detail: { why: 'The one-line second policy that proves the interface is real.', tradeoffs: ['None.'], alternatives: ['n/a'], scale: 'n/a' } }
      ],
      relations: [
        { from: 'lot', to: 'floor', type: 'composes', fromMult: '1', toMult: '1..*' },
        { from: 'floor', to: 'spot', type: 'composes', fromMult: '1', toMult: '*' },
        { from: 'lot', to: 'ticket', type: 'associates', label: 'active', toMult: '*' },
        { from: 'ticket', to: 'spot', type: 'associates', toMult: '1' },
        { from: 'ticket', to: 'vehicle', type: 'associates', toMult: '1' },
        { from: 'lot', to: 'selector', type: 'aggregates', label: 'uses' },
        { from: 'lot', to: 'policy', type: 'aggregates', label: 'uses' },
        { from: 'first', to: 'selector', type: 'implements' },
        { from: 'best', to: 'selector', type: 'implements' },
        { from: 'hourly', to: 'policy', type: 'implements' },
        { from: 'flat', to: 'policy', type: 'implements' }
      ]
    },

    decisions: [
      { title: 'Spot selection is a Strategy', pattern: 'Strategy',
        body: 'Where a car goes is the most opinionated rule in the system. Operators will change it (closest to the exit, fill the cheap floor first, keep spots near the elevator for disabled drivers). Put it behind `SpotSelector` so `ParkingLot` only says "give me a spot for this vehicle".\n\n**Alternative:** a flag on the lot and an if-chain inside `park`. It works until the third rule, then every change risks the other two.',
        tradeoffs: ['One more interface and class per rule.', 'The strategy sees every floor, so a smart one can be O(n) per car; add an index when that shows up in a profile.'] },
      { title: 'Fee calculation is a Strategy, fed an explicit stay length', pattern: 'Strategy',
        body: '`FeePolicy.fee(ticket, minutes)` is a pure function. The lot computes `now - entry` and hands it over, so tests never touch a clock and a policy never holds mutable state.\n\n**Alternative:** each vehicle subclass knows its own price. That ties pricing to a class hierarchy and makes weekend or promo rules hard to add.',
        tradeoffs: ['Policies that need more than the ticket (a loyalty tier) need a richer input; add a context object then.'] },
      { title: 'One Vehicle class and a size ordering, not a subclass per vehicle type',
        body: 'Cars, trucks and motorcycles do not behave differently in this problem; they differ only in a size and a price key. An enum plus `spot.size >= vehicle.type` states the fit rule once.\n\n**Alternative:** `Car extends Vehicle`, `Truck extends Vehicle`, and a `canFitIn(spot)` override each. It looks object-oriented, and it spreads one rule across three files.',
        tradeoffs: ['If trucks later need two spots, or vehicles gain real behavior, introduce subclasses then (YAGNI until it hurts).'] },
      { title: 'One critical section for pick-and-occupy, and tickets that can only be redeemed once',
        body: 'The danger is a check-then-act race: two threads both see spot F0-1 free, both take it. So `park` does the plate check, the selection and the occupation under one lock, and `exit` removes the ticket from the active map atomically, so a second redeem finds nothing.\n\n**Alternative:** a lock per spot with compare-and-set. Faster under heavy contention, but you then have to handle "lost the race, pick again", which is more code for a lot with a few hundred spots.',
        tradeoffs: ['The single lock serializes arrivals; fine for a lot, wrong for a city-wide service.', 'The plate check also stops the same car parking twice.'] },
      { title: 'Time and money are plain values',
        body: 'Minutes come in as an argument and money is integer cents. That removes floating-point rounding from fees and removes the clock from every test.\n\n**Alternative:** read `now()` inside `park` and use `double`. Both are classic interview bugs.',
        tradeoffs: ['Callers must pass the time; a thin wrapper at the gate supplies the real clock.'] }
    ],

    code: [
      { title: 'Parking lot: four languages, one driver each',
        note: 'Each file is complete and runs on its own. The driver covers best fit, a full lot, the one-hour minimum, partial-hour rounding, ticket reuse, the same plate entering twice, and a second pricing policy.',
        code: { py: String.raw`import math
import threading
from abc import ABC, abstractmethod
from enum import IntEnum


class Size(IntEnum):          # a vehicle fits a spot when spot.size >= vehicle.size
    SMALL = 1
    MEDIUM = 2
    LARGE = 3


class VehicleType(IntEnum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3


class LotFullError(Exception):
    pass


class Vehicle:
    def __init__(self, plate, vtype):
        self.plate, self.type = plate, vtype


class ParkingSpot:
    def __init__(self, spot_id, floor, size):
        self.id, self.floor, self.size, self.vehicle = spot_id, floor, size, None

    def fits(self, v):
        return self.vehicle is None and int(self.size) >= int(v.type)


class Floor:
    def __init__(self, number, sizes):          # sizes: e.g. [Size.SMALL, Size.MEDIUM, ...]
        self.number = number
        self.spots = [ParkingSpot(f"F{number}-{i}", number, s) for i, s in enumerate(sizes)]


class Ticket:
    def __init__(self, tid, spot, vehicle, entry):
        self.id, self.spot, self.vehicle, self.entry = tid, spot, vehicle, entry


class SpotSelector(ABC):                        # Strategy: which free spot to hand out
    @abstractmethod
    def pick(self, floors, v): ...


class FirstFit(SpotSelector):                   # lowest floor, first spot that fits
    def pick(self, floors, v):
        return next((s for f in floors for s in f.spots if s.fits(v)), None)


class BestFit(SpotSelector):                    # smallest spot that fits, then lowest floor
    def pick(self, floors, v):
        fits = [s for f in floors for s in f.spots if s.fits(v)]
        return min(fits, key=lambda s: (s.size, s.floor), default=None)


class FeePolicy(ABC):                           # Strategy: how to price a stay
    @abstractmethod
    def fee(self, ticket, minutes): ...


class HourlyFee(FeePolicy):                     # per-type hourly rate in cents, partial hours round up, minimum 1 hour
    def __init__(self, rates):
        self.rates = rates

    def fee(self, ticket, minutes):
        return max(1, math.ceil(minutes / 60)) * self.rates[ticket.vehicle.type]


class FlatFee(FeePolicy):
    def __init__(self, cents):
        self.cents = cents

    def fee(self, ticket, minutes):
        return self.cents


class ParkingLot:
    def __init__(self, floors, selector, policy):
        self.floors, self.selector, self.policy = floors, selector, policy
        self.active, self.next_id = {}, 1
        self.lock = threading.Lock()            # ponytail: one lock; per-floor locks if contention shows up

    def park(self, vehicle, now):
        with self.lock:                         # pick + occupy must be atomic or two cars get one spot
            if any(t.vehicle.plate == vehicle.plate for t in self.active.values()):
                raise ValueError("vehicle already parked")
            spot = self.selector.pick(self.floors, vehicle)
            if spot is None:
                raise LotFullError(vehicle.plate)
            spot.vehicle = vehicle
            t = Ticket(self.next_id, spot, vehicle, now)
            self.next_id += 1
            self.active[t.id] = t
            return t

    def exit(self, ticket_id, now):
        with self.lock:
            t = self.active.pop(ticket_id, None)   # a second exit with the same ticket fails here
            if t is None:
                raise KeyError("unknown or already used ticket")
            t.spot.vehicle = None
            return self.policy.fee(t, now - t.entry)

    def free_spots(self):
        return sum(1 for f in self.floors for s in f.spots if s.vehicle is None)


def demo():
    lot = ParkingLot([Floor(0, [Size.SMALL, Size.MEDIUM]), Floor(1, [Size.LARGE])], BestFit(),
                     HourlyFee({VehicleType.MOTORCYCLE: 100, VehicleType.CAR: 300, VehicleType.TRUCK: 800}))
    bike = lot.park(Vehicle("B1", VehicleType.MOTORCYCLE), 0)
    assert bike.spot.size == Size.SMALL               # best fit keeps big spots free
    car = lot.park(Vehicle("C1", VehicleType.CAR), 0)
    assert car.spot.size == Size.MEDIUM
    truck = lot.park(Vehicle("T1", VehicleType.TRUCK), 10)
    assert truck.spot.floor == 1 and lot.free_spots() == 0
    try:
        lot.park(Vehicle("C2", VehicleType.CAR), 20)  # full lot
        assert False
    except LotFullError:
        pass
    assert lot.exit(car.id, 61) == 600                # 61 minutes bills 2 hours
    assert lot.exit(bike.id, 5) == 100                # minimum one hour
    try:
        lot.exit(car.id, 70)                          # ticket reuse
        assert False
    except KeyError:
        pass
    try:
        lot.park(Vehicle("T1", VehicleType.TRUCK), 80)  # same plate already inside
        assert False
    except ValueError:
        pass
    c2 = lot.park(Vehicle("C2", VehicleType.CAR), 90)   # spot freed, car fits again
    assert c2.spot.size == Size.MEDIUM
    big = ParkingLot([Floor(0, [Size.LARGE])], FirstFit(), FlatFee(500))
    assert big.exit(big.park(Vehicle("X", VehicleType.CAR), 0).id, 300) == 500
    print("parking ok")


if __name__ == "__main__":
    demo()`, js: String.raw`const assert = require('assert');

const Size = { SMALL: 1, MEDIUM: 2, LARGE: 3 };            // a vehicle fits a spot when spot.size >= vehicle.type
const VehicleType = { MOTORCYCLE: 1, CAR: 2, TRUCK: 3 };

class LotFullError extends Error {}

class Vehicle {
  constructor(plate, type) { this.plate = plate; this.type = type; }
}

class ParkingSpot {
  constructor(id, floor, size) { this.id = id; this.floor = floor; this.size = size; this.vehicle = null; }
  fits(v) { return this.vehicle === null && this.size >= v.type; }
}

class Floor {
  constructor(number, sizes) {
    this.number = number;
    this.spots = sizes.map((s, i) => new ParkingSpot('F' + number + '-' + i, number, s));
  }
}

class Ticket {
  constructor(id, spot, vehicle, entry) { this.id = id; this.spot = spot; this.vehicle = vehicle; this.entry = entry; }
}

// Strategy: which free spot to hand out
class FirstFit {                                           // lowest floor, first spot that fits
  pick(floors, v) {
    for (const f of floors) for (const s of f.spots) if (s.fits(v)) return s;
    return null;
  }
}
class BestFit {                                            // smallest spot that fits, then lowest floor
  pick(floors, v) {
    let best = null;
    for (const f of floors) for (const s of f.spots) {
      if (s.fits(v) && (best === null || s.size < best.size)) best = s;   // floors scan in order, so ties keep the lowest floor
    }
    return best;
  }
}

// Strategy: how to price a stay
class HourlyFee {                                          // per-type hourly rate in cents, partial hours round up, minimum 1 hour
  constructor(rates) { this.rates = rates; }
  fee(ticket, minutes) { return Math.max(1, Math.ceil(minutes / 60)) * this.rates[ticket.vehicle.type]; }
}
class FlatFee {
  constructor(cents) { this.cents = cents; }
  fee() { return this.cents; }
}

class ParkingLot {
  constructor(floors, selector, policy) {
    this.floors = floors; this.selector = selector; this.policy = policy;
    this.active = new Map(); this.nextId = 1;
  }
  // ponytail: JS runs one event at a time, so park/exit are already atomic here; use a mutex in worker threads or a DB.
  park(vehicle, now) {
    for (const t of this.active.values()) if (t.vehicle.plate === vehicle.plate) throw new Error('vehicle already parked');
    const spot = this.selector.pick(this.floors, vehicle);
    if (spot === null) throw new LotFullError(vehicle.plate);
    spot.vehicle = vehicle;
    const t = new Ticket(this.nextId++, spot, vehicle, now);
    this.active.set(t.id, t);
    return t;
  }
  exit(ticketId, now) {
    const t = this.active.get(ticketId);
    if (!t) throw new Error('unknown or already used ticket');   // a second exit with the same ticket fails here
    this.active.delete(ticketId);
    t.spot.vehicle = null;
    return this.policy.fee(t, now - t.entry);
  }
  freeSpots() {
    return this.floors.reduce((n, f) => n + f.spots.filter((s) => s.vehicle === null).length, 0);
  }
}

function demo() {
  const lot = new ParkingLot([new Floor(0, [Size.SMALL, Size.MEDIUM]), new Floor(1, [Size.LARGE])], new BestFit(),
    new HourlyFee({ [VehicleType.MOTORCYCLE]: 100, [VehicleType.CAR]: 300, [VehicleType.TRUCK]: 800 }));
  const bike = lot.park(new Vehicle('B1', VehicleType.MOTORCYCLE), 0);
  assert.strictEqual(bike.spot.size, Size.SMALL);          // best fit keeps big spots free
  const car = lot.park(new Vehicle('C1', VehicleType.CAR), 0);
  assert.strictEqual(car.spot.size, Size.MEDIUM);
  const truck = lot.park(new Vehicle('T1', VehicleType.TRUCK), 10);
  assert.ok(truck.spot.floor === 1 && lot.freeSpots() === 0);
  assert.throws(() => lot.park(new Vehicle('C2', VehicleType.CAR), 20), LotFullError);   // full lot
  assert.strictEqual(lot.exit(car.id, 61), 600);           // 61 minutes bills 2 hours
  assert.strictEqual(lot.exit(bike.id, 5), 100);           // minimum one hour
  assert.throws(() => lot.exit(car.id, 70), /already used/);   // ticket reuse
  assert.throws(() => lot.park(new Vehicle('T1', VehicleType.TRUCK), 80), /already parked/);  // same plate inside
  const c2 = lot.park(new Vehicle('C2', VehicleType.CAR), 90); // spot freed, car fits again
  assert.strictEqual(c2.spot.size, Size.MEDIUM);
  const flat = new ParkingLot([new Floor(0, [Size.LARGE])], new FirstFit(), new FlatFee(500));
  assert.strictEqual(flat.exit(flat.park(new Vehicle('X', VehicleType.CAR), 0).id, 300), 500);
  console.log('parking ok');
}
demo();`, java: String.raw`import java.util.*;

public class Parking {
    enum Size { SMALL, MEDIUM, LARGE }                       // a vehicle fits a spot when spot.size >= vehicle.type
    enum VehicleType { MOTORCYCLE, CAR, TRUCK }

    static class LotFullException extends RuntimeException {
        LotFullException(String m) { super(m); }
    }

    record Vehicle(String plate, VehicleType type) {}

    static class ParkingSpot {
        final String id; final int floor; final Size size; Vehicle vehicle;
        ParkingSpot(String id, int floor, Size size) { this.id = id; this.floor = floor; this.size = size; }
        boolean fits(Vehicle v) { return vehicle == null && size.ordinal() >= v.type().ordinal(); }
    }

    static class Floor {
        final int number; final List<ParkingSpot> spots = new ArrayList<>();
        Floor(int number, Size... sizes) {
            this.number = number;
            for (int i = 0; i < sizes.length; i++) spots.add(new ParkingSpot("F" + number + "-" + i, number, sizes[i]));
        }
    }

    record Ticket(int id, ParkingSpot spot, Vehicle vehicle, long entry) {}

    interface SpotSelector { ParkingSpot pick(List<Floor> floors, Vehicle v); }   // Strategy: which spot

    static class FirstFit implements SpotSelector {          // lowest floor, first spot that fits
        public ParkingSpot pick(List<Floor> floors, Vehicle v) {
            for (Floor f : floors) for (ParkingSpot s : f.spots) if (s.fits(v)) return s;
            return null;
        }
    }

    static class BestFit implements SpotSelector {           // smallest spot that fits, then lowest floor
        public ParkingSpot pick(List<Floor> floors, Vehicle v) {
            ParkingSpot best = null;
            for (Floor f : floors) for (ParkingSpot s : f.spots)
                if (s.fits(v) && (best == null || s.size.ordinal() < best.size.ordinal())) best = s;
            return best;
        }
    }

    interface FeePolicy { long fee(Ticket t, long minutes); }                     // Strategy: how to price

    static class HourlyFee implements FeePolicy {            // per-type hourly rate in cents, partial hours round up, minimum 1 hour
        final Map<VehicleType, Long> rates;
        HourlyFee(Map<VehicleType, Long> rates) { this.rates = rates; }
        public long fee(Ticket t, long minutes) {
            return Math.max(1, (minutes + 59) / 60) * rates.get(t.vehicle().type());
        }
    }

    static class FlatFee implements FeePolicy {
        final long cents;
        FlatFee(long cents) { this.cents = cents; }
        public long fee(Ticket t, long minutes) { return cents; }
    }

    static class ParkingLot {
        final List<Floor> floors; final SpotSelector selector; final FeePolicy policy;
        final Map<Integer, Ticket> active = new HashMap<>(); int nextId = 1;
        ParkingLot(List<Floor> floors, SpotSelector selector, FeePolicy policy) {
            this.floors = floors; this.selector = selector; this.policy = policy;
        }
        // ponytail: one monitor lock; per-floor locks if contention shows up
        synchronized Ticket park(Vehicle v, long now) {      // pick + occupy must be atomic or two cars get one spot
            for (Ticket t : active.values())
                if (t.vehicle().plate().equals(v.plate())) throw new IllegalStateException("vehicle already parked");
            ParkingSpot spot = selector.pick(floors, v);
            if (spot == null) throw new LotFullException(v.plate());
            spot.vehicle = v;
            Ticket t = new Ticket(nextId++, spot, v, now);
            active.put(t.id(), t);
            return t;
        }
        synchronized long exit(int ticketId, long now) {
            Ticket t = active.remove(ticketId);               // a second exit with the same ticket fails here
            if (t == null) throw new NoSuchElementException("unknown or already used ticket");
            t.spot().vehicle = null;
            return policy.fee(t, now - t.entry());
        }
        synchronized int freeSpots() {
            int n = 0;
            for (Floor f : floors) for (ParkingSpot s : f.spots) if (s.vehicle == null) n++;
            return n;
        }
    }

    static void check(boolean ok) { if (!ok) throw new AssertionError(); }

    static <T extends Throwable> void expect(Class<T> type, Runnable r) {
        try { r.run(); } catch (Throwable e) { if (type.isInstance(e)) return; throw new AssertionError("wrong exception " + e); }
        throw new AssertionError("expected " + type.getSimpleName());
    }

    public static void main(String[] args) {
        ParkingLot lot = new ParkingLot(List.of(new Floor(0, Size.SMALL, Size.MEDIUM), new Floor(1, Size.LARGE)), new BestFit(),
            new HourlyFee(Map.of(VehicleType.MOTORCYCLE, 100L, VehicleType.CAR, 300L, VehicleType.TRUCK, 800L)));
        Ticket bike = lot.park(new Vehicle("B1", VehicleType.MOTORCYCLE), 0);
        check(bike.spot().size == Size.SMALL);                // best fit keeps big spots free
        Ticket car = lot.park(new Vehicle("C1", VehicleType.CAR), 0);
        check(car.spot().size == Size.MEDIUM);
        Ticket truck = lot.park(new Vehicle("T1", VehicleType.TRUCK), 10);
        check(truck.spot().floor == 1 && lot.freeSpots() == 0);
        expect(LotFullException.class, () -> lot.park(new Vehicle("C2", VehicleType.CAR), 20));   // full lot
        check(lot.exit(car.id(), 61) == 600);                 // 61 minutes bills 2 hours
        check(lot.exit(bike.id(), 5) == 100);                 // minimum one hour
        expect(NoSuchElementException.class, () -> lot.exit(car.id(), 70));                      // ticket reuse
        expect(IllegalStateException.class, () -> lot.park(new Vehicle("T1", VehicleType.TRUCK), 80)); // same plate inside
        Ticket c2 = lot.park(new Vehicle("C2", VehicleType.CAR), 90);                            // spot freed, car fits again
        check(c2.spot().size == Size.MEDIUM);
        ParkingLot flat = new ParkingLot(List.of(new Floor(0, Size.LARGE)), new FirstFit(), new FlatFee(500));
        check(flat.exit(flat.park(new Vehicle("X", VehicleType.CAR), 0).id(), 300) == 500);
        System.out.println("parking ok");
    }
}`, cpp: String.raw`#include <algorithm>
#include <cassert>
#include <iostream>
#include <map>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <vector>

enum class Size { SMALL = 1, MEDIUM, LARGE };              // a vehicle fits a spot when spot.size >= vehicle.type
enum class VehicleType { MOTORCYCLE = 1, CAR, TRUCK };

struct LotFullError : std::runtime_error { using std::runtime_error::runtime_error; };

struct Vehicle { std::string plate; VehicleType type; };

struct ParkingSpot {
    std::string id; int floor; Size size; bool taken = false;
    bool fits(const Vehicle& v) const { return !taken && (int)size >= (int)v.type; }
};

struct Floor {
    int number; std::vector<ParkingSpot> spots;
    Floor(int n, std::vector<Size> sizes) : number(n) {
        for (size_t i = 0; i < sizes.size(); i++) spots.push_back({"F" + std::to_string(n) + "-" + std::to_string(i), n, sizes[i]});
    }
};

struct Ticket { int id; ParkingSpot* spot; Vehicle vehicle; long entry; };

struct SpotSelector {                                      // Strategy: which free spot to hand out
    virtual ~SpotSelector() = default;
    virtual ParkingSpot* pick(std::vector<Floor>& floors, const Vehicle& v) = 0;
};
struct FirstFit : SpotSelector {                           // lowest floor, first spot that fits
    ParkingSpot* pick(std::vector<Floor>& floors, const Vehicle& v) override {
        for (auto& f : floors) for (auto& s : f.spots) if (s.fits(v)) return &s;
        return nullptr;
    }
};
struct BestFit : SpotSelector {                            // smallest spot that fits, then lowest floor
    ParkingSpot* pick(std::vector<Floor>& floors, const Vehicle& v) override {
        ParkingSpot* best = nullptr;
        for (auto& f : floors) for (auto& s : f.spots)
            if (s.fits(v) && (!best || (int)s.size < (int)best->size)) best = &s;
        return best;
    }
};

struct FeePolicy {                                         // Strategy: how to price a stay
    virtual ~FeePolicy() = default;
    virtual long fee(const Ticket& t, long minutes) = 0;
};
struct HourlyFee : FeePolicy {                             // per-type hourly rate in cents, partial hours round up, minimum 1 hour
    std::map<VehicleType, long> rates;
    explicit HourlyFee(std::map<VehicleType, long> r) : rates(std::move(r)) {}
    long fee(const Ticket& t, long minutes) override { return std::max(1L, (minutes + 59) / 60) * rates.at(t.vehicle.type); }
};
struct FlatFee : FeePolicy {
    long cents;
    explicit FlatFee(long c) : cents(c) {}
    long fee(const Ticket&, long) override { return cents; }
};

class ParkingLot {
    std::vector<Floor> floors;
    std::unique_ptr<SpotSelector> selector;
    std::unique_ptr<FeePolicy> policy;
    std::map<int, Ticket> active; int nextId = 1;
    std::mutex mu;                                         // ponytail: one lock; per-floor locks if contention shows up
public:
    ParkingLot(std::vector<Floor> f, std::unique_ptr<SpotSelector> s, std::unique_ptr<FeePolicy> p)
        : floors(std::move(f)), selector(std::move(s)), policy(std::move(p)) {}

    Ticket park(const Vehicle& v, long now) {
        std::lock_guard<std::mutex> g(mu);                 // pick + occupy must be atomic or two cars get one spot
        for (auto& kv : active) if (kv.second.vehicle.plate == v.plate) throw std::logic_error("vehicle already parked");
        ParkingSpot* spot = selector->pick(floors, v);
        if (!spot) throw LotFullError(v.plate);
        spot->taken = true;
        Ticket t{nextId++, spot, v, now};
        active.emplace(t.id, t);
        return t;
    }
    long exit(int ticketId, long now) {
        std::lock_guard<std::mutex> g(mu);
        auto it = active.find(ticketId);                   // a second exit with the same ticket fails here
        if (it == active.end()) throw std::out_of_range("unknown or already used ticket");
        Ticket t = it->second;
        t.spot->taken = false;
        active.erase(it);
        return policy->fee(t, now - t.entry);
    }
    int freeSpots() {
        std::lock_guard<std::mutex> g(mu);
        int n = 0;
        for (auto& f : floors) for (auto& s : f.spots) n += !s.taken;
        return n;
    }
};

template <class E, class F> void expect(F f) {
    try { f(); } catch (const E&) { return; }
    std::cerr << "expected exception\n";
    std::abort();
}

#define CHECK(c) do { if (!(c)) { std::cerr << "FAILED: " #c "\n"; std::abort(); } } while (0)

int main() {
    ParkingLot lot({Floor(0, {Size::SMALL, Size::MEDIUM}), Floor(1, {Size::LARGE})}, std::make_unique<BestFit>(),
        std::make_unique<HourlyFee>(std::map<VehicleType, long>{{VehicleType::MOTORCYCLE, 100}, {VehicleType::CAR, 300}, {VehicleType::TRUCK, 800}}));
    Ticket bike = lot.park({"B1", VehicleType::MOTORCYCLE}, 0);
    CHECK(bike.spot->size == Size::SMALL);                 // best fit keeps big spots free
    Ticket car = lot.park({"C1", VehicleType::CAR}, 0);
    CHECK(car.spot->size == Size::MEDIUM);
    Ticket truck = lot.park({"T1", VehicleType::TRUCK}, 10);
    CHECK(truck.spot->floor == 1 && lot.freeSpots() == 0);
    expect<LotFullError>([&] { lot.park({"C2", VehicleType::CAR}, 20); });         // full lot
    CHECK(lot.exit(car.id, 61) == 600);                    // 61 minutes bills 2 hours
    CHECK(lot.exit(bike.id, 5) == 100);                    // minimum one hour
    expect<std::out_of_range>([&] { lot.exit(car.id, 70); });                      // ticket reuse
    expect<std::logic_error>([&] { lot.park({"T1", VehicleType::TRUCK}, 80); });   // same plate inside
    Ticket c2 = lot.park({"C2", VehicleType::CAR}, 90);    // spot freed, car fits again
    CHECK(c2.spot->size == Size::MEDIUM);
    ParkingLot flat({Floor(0, {Size::LARGE})}, std::make_unique<FirstFit>(), std::make_unique<FlatFee>(500));
    CHECK(flat.exit(flat.park({"X", VehicleType::CAR}, 0).id, 300) == 500);
    std::cout << "parking ok\n";
}` } }
    ],

    extensions: [
      { q: 'Add **EV charging spots**. What changes?', a: 'A spot gains a capability, not a new size. Add a `charger: bool` (or a set of features) to `ParkingSpot`, and let `Vehicle` carry `needsCharging`. `fits` becomes "free, big enough, and has a charger if needed". `SpotSelector` implementations do not change because they only call `fits`.\n\nBilling: charging is a second line item, so `FeePolicy` returns a total built from parking plus a `ChargingFee` (Decorator, or a list of fee components). Keep the kWh meter outside the lot and pass energy used into the exit call.' },
      { q: 'Add **reserved spots** that only certain people can use (disabled permits, monthly passes).', a: 'Give a spot an optional `reservedFor` permit class, and let `fits(vehicle)` also check that the vehicle holds the permit. Normal drivers never get reserved spots, permit holders may still take normal ones.\n\nFor prebooked spots, add a `Reservation` (spot, plate, window) and let `park` check the reservation list first. That introduces time into spot state, so the free check becomes "free now and not reserved for this window".' },
      { q: 'How would you make this correct across **several servers**?', a: 'Move spot occupancy and active tickets into a database. Occupy a spot with one conditional write (`UPDATE spot SET plate = ? WHERE id = ? AND plate IS NULL`) and retry the next candidate when it affects zero rows. Redeem a ticket with `DELETE ... WHERE id = ?` and trust the row count. The in-process lock disappears; the database is the arbiter.' },
      { q: 'Make "find a spot" fast for a **10,000-spot garage**.', a: 'Keep free spots indexed: a min-heap or sorted set per size ordered by floor and position, and update it on park and exit. Best fit becomes "take the first entry of the smallest size that is at least the vehicle size": O(log n). Rebuild the index on startup from persistent state.' },
      { q: 'How would you add **dynamic pricing** (surge when the lot is 90% full)?', a: 'It is another `FeePolicy`: it wraps a base policy and multiplies by a factor read from occupancy at exit (or, fairer, at entry and stored on the ticket so the price cannot change mid-stay). Keep the multiplier decision outside the policy, as an input, so the policy stays a pure function.' }
    ],

    quiz: [
      { kind: 'pattern', q: 'The operator wants to switch from "closest to the entrance" to "smallest spot that fits" without touching `ParkingLot`. Which pattern makes that a one-class change?', choices: ['Strategy', 'Singleton', 'Observer', 'Decorator'], answer: 0, explain: 'Spot selection is a family of interchangeable algorithms behind one interface, which is exactly Strategy.' },
      { kind: 'bug', q: 'Two entrance threads call `park` at the same instant and both receive spot F0-1. What is the root cause?', choices: ['The check that the spot is free and the act of occupying it are not atomic', 'The ticket id counter overflowed', 'The fee policy returned a negative value', 'Spots should be sorted by size'], answer: 0, explain: 'A check-then-act race. Do the pick and the occupy in one critical section, or make the occupy a compare-and-set.' },
      { kind: 'concept', q: 'Why does `FeePolicy.fee` take the stay length as an argument instead of reading the clock?', choices: ['The policy stays a pure function, so tests are deterministic', 'The clock is not available in Java', 'It makes fees cheaper', 'It avoids needing a Ticket'], answer: 0, explain: 'Injecting time removes hidden state and lets a test say "61 minutes" directly.' },
      { kind: 'concept', q: 'Which two reasons justify one `Vehicle` class with a type field instead of `Car`, `Truck` and `Motorcycle` subclasses here?', choices: ['They differ only in size and price, not in behavior', 'The fit rule is stated once as a size comparison', 'Subclasses cannot have a plate field', 'Inheritance is not allowed in an interview'], answer: [0, 1], explain: 'Subclasses without distinct behavior only duplicate the fit rule. Add them when the types start to behave differently.' },
      { kind: 'concept', q: 'A customer stays 61 minutes. With hourly billing that rounds partial hours up, how many hours are billed?', choices: ['2', '1', '1.02', '3'], answer: 0, explain: 'ceil(61 / 60) = 2. The one-hour minimum only matters for stays under an hour.' }
    ],

    flashcards: [
      { id: 'pl-fit', front: 'Parking lot: how do you model "a vehicle fits a spot"?', back: 'Ordered sizes. A spot fits when it is free and spot.size >= vehicle size, so a motorcycle fits anywhere and a truck only fits LARGE.' },
      { id: 'pl-strategies', front: 'Which two things in the parking lot are Strategies?', back: 'Spot selection (first fit, best fit) and fee calculation (hourly, flat). Both vary by operator and are pure decisions.' },
      { id: 'pl-race', front: 'Where is the concurrency bug in a naive parking lot?', back: 'Check-then-act: two threads see the same spot free and both take it. Pick and occupy must be one atomic step; redeeming a ticket must remove it atomically.' },
      { id: 'pl-bestfit', front: 'Best fit versus first fit for spot selection?', back: 'Best fit takes the smallest spot that fits, keeping large spots free for trucks. First fit takes the nearest, so walks are short but small cars can strand trucks.' },
      { id: 'pl-fee', front: 'Why integer cents and an injected clock in the fee code?', back: 'Floats round wrongly on money; an injected time makes every fee test deterministic.' },
      { id: 'pl-ev', front: 'How do EV charging spots fit the design?', back: 'Add a capability flag on the spot and a need flag on the vehicle, extend `fits`, and add a charging line to the fee. Selectors are untouched.' }
    ]
  });
})();
