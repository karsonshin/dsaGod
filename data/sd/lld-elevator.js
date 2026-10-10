/* Low-level design: elevator system. The code under "Code" was compiled and run (Python, Node, javac, g++ -std=c++17) before it was pasted here. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.lld = SD.lld || [];
  SD.lld.push({
    id: 'elevator',
    title: 'Design an elevator system',
    short: 'Several cars, hall calls versus in-car buttons, a LOOK-style sweep, a state machine per car, and graceful maintenance.',
    difficulty: 'Medium',
    time: '50 min',
    tags: ['State machine', 'Strategy', 'Scheduling', 'Concurrency'],
    prompt: 'Design the control software for a building with several elevators. People press a button in the hall to call a car, then press a floor inside.',

    requirements: {
      functional: [
        'A building has **N floors** and **M cars**. Each car is always in one state: idle, moving, doors open, or in maintenance.',
        '**External request** (hall call): a floor and a direction (up or down). A scheduler decides which car answers it.',
        '**Internal request** (inside a car): a destination floor. It goes to that car with no scheduling decision.',
        'Each car sweeps like the **LOOK** algorithm: keep going in the current direction while there are stops ahead, then reverse; do not travel to the end of the shaft for nothing.',
        'A car stops at every requested floor on its way and opens its doors for one tick.',
        '**Maintenance mode**: a car taken out of service stops getting new work, and its unserved hall calls are handed to the other cars.'
      ],
      nonFunctional: [
        'No two cars are sent to the same hall call, and no request is lost when a car goes out of service.',
        'The controller state is safe under concurrent button presses and a ticking clock.',
        'The scheduling policy is replaceable without touching the car logic.',
        'Simulation is deterministic: the system advances in explicit ticks, so tests need no sleeping.'
      ],
      assumptions: [
        'One floor takes one tick; doors take one tick.',
        'A car out of service has been emptied by staff before it is flagged.',
        'A car stops for a hall call whichever way the caller wanted to go (the limit is covered in the extension questions).'
      ],
      outOfScope: [
        'Weight sensors, door obstruction, fire mode and the physical motor.',
        'Destination-dispatch panels where you key in the floor in the hall.'
      ],
      clarify: [
        { q: 'Are hall calls directional, or a single button?', a: 'Assume up and down buttons. Direction matters for scheduling: a car heading up is a good match for an up call above it and a bad one for a down call.' },
        { q: 'How many cars, and do they serve all floors?', a: 'Assume a bank of identical cars that serve every floor. Express and zoned cars are a scheduling-strategy change.' },
        { q: 'What is the goal: shortest wait, shortest ride, or fewest stops?', a: 'Optimize average wait for hall calls and avoid starvation. That drives a cost-based nearest-car scheduler and a LOOK sweep inside each car.' },
        { q: 'Real time or simulated ticks?', a: 'Ticks. The design is the same, and it makes behavior assertable.' },
        { q: 'What happens to a rider in a car that goes into maintenance?', a: 'Assume maintenance is only entered when the car is empty. The follow-up (an emergency stop at the next floor) is a transition on the state machine.' }
      ]
    },

    classDiagram: {
      title: 'Elevator system class diagram',
      intro: 'The **controller** is the only object the buttons talk to. Each **car** runs its own small state machine, and a **scheduler** picks which car takes a hall call. Click a class for the reasoning.',
      classes: [
        { id: 'ctl', name: 'ElevatorController', fields: ['- floors: int', '- cars: Elevator[]', '- scheduler: Scheduler', '- lock'], methods: ['+ requestPickup(floor, dir): carId', '+ selectFloor(carId, floor)', '+ step()', '+ setMaintenance(carId, on)'],
          detail: { why: 'The facade and the single writer: every button press and every tick takes the same lock, so cars never see half-updated state.', tradeoffs: ['One lock serializes everything, which is fine for a bank of a few cars.'], alternatives: ['A lock per car plus a lock for scheduling; faster, but scheduling needs a consistent view of all cars anyway.'], scale: 'A tall building splits into banks of cars, each with its own controller.' } },
        { id: 'car', name: 'Elevator', fields: ['+ id: int', '+ floor: int', '+ state: State', '+ direction: Direction', '- stops: Set<int>', '- pickups: Set<int>'], methods: ['+ addStop(floor, external)', '+ step()', '+ cost(floor, dir): int'],
          detail: { why: 'Owns its position, stops and the LOOK rule. step() advances exactly one tick, so behavior is easy to assert.', tradeoffs: ['Keeping `pickups` (hall calls) separate from `stops` costs a set but makes reassignment on failure trivial.'], alternatives: ['A priority queue of requests per direction; same behavior, more machinery.'], scale: 'Stops are a set: O(1) add, O(k) to find the next ahead.' } },
        { id: 'state', name: 'State', kind: 'enum', fields: ['IDLE', 'MOVING', 'DOORS_OPEN', 'MAINTENANCE'], methods: [],
          detail: { why: 'Makes the car a state machine: idle goes to moving when a stop appears, moving goes to doors open on arrival, doors open goes to idle or moving, and maintenance is entered and left only by the controller.', tradeoffs: ['Transitions live in one `step()` method with if-statements.'], alternatives: ['The State pattern: one class per state with its own step(). Worth it when states grow behavior (door timers, emergency stop).'], scale: 'n/a' } },
        { id: 'dir', name: 'Direction', kind: 'enum', fields: ['UP', 'DOWN', 'IDLE'], methods: [],
          detail: { why: 'The sweep direction is part of the car state because LOOK is defined by it.', tradeoffs: ['Idle is a third value so an empty car has no bias.'], alternatives: ['A signed int.'], scale: 'n/a' } },
        { id: 'sched', name: 'Scheduler', kind: 'interface', fields: [], methods: ['+ choose(cars, floor, dir): Elevator'],
          detail: { why: 'Strategy for which car answers a hall call. It must skip cars in maintenance and fail loudly when none are left.', tradeoffs: ['The strategy reads every car, so it must run under the controller lock.'], alternatives: ['Hard-wiring "nearest car" in the controller.'], scale: 'O(M) per call for M cars.' } },
        { id: 'nearest', name: 'NearestCar', fields: [], methods: ['+ choose(cars, floor, dir)'],
          detail: { why: 'Picks the car with the smallest cost: the distance for an idle car, the distance on the way for a car sweeping the same direction, or the length of the full sweep plus the trip back otherwise.', tradeoffs: ['A heuristic, not optimal; it ignores how many stops are already queued.'], alternatives: ['Round robin or random; fair but ignores position.'], scale: 'Cheap enough to run on every call.' } },
        { id: 'first', name: 'FirstAvailable', fields: [], methods: ['+ choose(cars, floor, dir)'],
          detail: { why: 'The simplest possible policy, kept as a test double and as proof that the strategy can be swapped.', tradeoffs: ['Piles work on car 0.'], alternatives: ['Nearest car.'], scale: 'n/a' } }
      ],
      relations: [
        { from: 'ctl', to: 'car', type: 'composes', fromMult: '1', toMult: '1..*' },
        { from: 'ctl', to: 'sched', type: 'aggregates', label: 'uses' },
        { from: 'nearest', to: 'sched', type: 'implements' },
        { from: 'first', to: 'sched', type: 'implements' },
        { from: 'car', to: 'state', type: 'depends' },
        { from: 'car', to: 'dir', type: 'depends' },
        { from: 'sched', to: 'car', type: 'depends', label: 'reads' }
      ]
    },

    decisions: [
      { title: 'Each car is a small state machine ticked by the controller', pattern: 'State',
        body: 'A car is always idle, moving, doors open, or in maintenance, and every transition happens in one place (`step`). The controller advances all cars in one tick under one lock, which makes the system deterministic: you can push buttons, step N times, and assert the visit order.\n\n**Alternative:** one thread per car with sleeps. It looks realistic and makes every test flaky.\n\nI used an enum with a single `step()` here; promote it to the full State pattern (a class per state) when each state grows its own behavior, such as door timers or an emergency stop.',
        tradeoffs: ['Enum and branches are compact, but a fifth and sixth state would make `step` sprawl.', 'Ticks model time coarsely; real motors need a finer event loop.'] },
      { title: 'LOOK inside the car, nearest-car outside it', pattern: 'Strategy',
        body: 'Two separate questions: which car takes a call (the scheduler), and in what order a car serves its stops (the sweep). Keep them apart. The car keeps its direction while anything lies ahead and only then turns to the nearer side, which is LOOK.\n\n**Alternative:** SCAN, which travels to the end of the shaft before reversing. It wastes trips. FCFS (serve stops in arrival order) is simple but makes a car zigzag.\n\nThe scheduler computes a **cost** per car and the controller picks the minimum; ties go to the lower id so the result is deterministic.',
        tradeoffs: ['LOOK can delay a request just behind the car until the sweep ends; bounded, so no starvation.', 'Cost is a heuristic and ignores queued stop counts.'] },
      { title: 'Internal and external requests take different paths',
        body: 'A hall call is a request for service that needs a decision (which car). A button inside a car is a destination for a car that is already chosen. So `requestPickup` goes through the scheduler and records the floor as a pickup; `selectFloor` goes straight to the car.\n\nKeeping pickups separately lets maintenance mode **reassign** them: riders inside are gone, but a person waiting in the hall is still waiting.',
        tradeoffs: ['Two sets per car instead of one.', 'A request object (Command pattern, with direction and timestamp) would add priority and starvation handling; skipped here to keep the code small.'] },
      { title: 'One lock around the controller, not one per car',
        body: 'Choosing a car reads every car, and a tick writes every car, so a coarse lock is the correct granularity. A hall call and a tick cannot interleave, which removes a class of "request lands on a car that just went to maintenance" bugs.\n\n**Alternative:** per-car locks. Faster in theory, but the scheduler would then need to lock several cars in a fixed order to avoid deadlock, for a system that handles a few presses per second.',
        tradeoffs: ['Throughput ceiling; in a skyscraper, shard by bank.'] },
      { title: 'Maintenance is a controlled transition that hands the work back', pattern: 'State',
        body: '`setMaintenance(car, true)` clears the car, flags it out of service, and re-runs the scheduler over the other cars for each hall call it still owed. Scheduling skips cars in maintenance, and if none are left it raises `NoElevatorAvailable` instead of swallowing the request.\n\n**Alternative:** let the car finish its stops first (a draining state). Friendlier, one more state; mention it as an extension.',
        tradeoffs: ['Riders are assumed out; a real system also needs an emergency-stop path.'] }
    ],

    code: [
      { title: 'Elevator system: four languages, one driver each',
        note: 'Each file is complete and runs on its own. The driver covers the nearest car winning a call, a car stopping at its floor and going idle, LOOK reversing only after the upward stops are served, direction-aware cost (a car sweeping up loses a down call), maintenance reassigning calls, no car available, and an invalid floor.',
        code: { py: String.raw`import threading
from abc import ABC, abstractmethod
from enum import Enum


class Direction(Enum):
    UP = 1
    DOWN = -1
    IDLE = 0


class State(Enum):
    IDLE = "idle"
    MOVING = "moving"
    DOORS_OPEN = "doors_open"
    MAINTENANCE = "maintenance"


class NoElevatorAvailable(Exception):
    pass


class Elevator:
    """One car. step() is one tick: open doors, or move one floor, or go idle."""

    def __init__(self, car_id, floor=0):
        self.id, self.floor = car_id, floor
        self.state, self.direction = State.IDLE, Direction.IDLE
        self.stops = set()       # every floor this car will stop at (internal and external)
        self.pickups = set()     # the subset assigned by the dispatcher, so it can be reassigned
        self.visited = []        # floors where doors opened, handy for tests

    def add_stop(self, floor, external=False):
        if self.state == State.MAINTENANCE:
            raise NoElevatorAvailable(self.id)
        self.stops.add(floor)
        if external:
            self.pickups.add(floor)

    def _next_direction(self):
        up = any(s > self.floor for s in self.stops)
        down = any(s < self.floor for s in self.stops)
        if self.direction == Direction.UP and up:       # LOOK: keep going while anything is ahead
            return Direction.UP
        if self.direction == Direction.DOWN and down:
            return Direction.DOWN
        if up and down:                                  # nothing ahead: turn to the nearer side
            nearest_up = min(s for s in self.stops if s > self.floor) - self.floor
            nearest_down = self.floor - max(s for s in self.stops if s < self.floor)
            return Direction.UP if nearest_up <= nearest_down else Direction.DOWN
        return Direction.UP if up else Direction.DOWN

    def step(self):
        if self.state == State.MAINTENANCE:
            return
        if self.floor in self.stops:                     # arrive: open doors for one tick
            self.stops.discard(self.floor)
            self.pickups.discard(self.floor)
            self.visited.append(self.floor)
            self.state = State.DOORS_OPEN
            return
        if not self.stops:
            self.state, self.direction = State.IDLE, Direction.IDLE
            return
        self.direction = self._next_direction()
        self.floor += self.direction.value
        self.state = State.MOVING

    def cost(self, floor, direction):
        """Ticks until this car could reach the floor for a pickup heading the given direction."""
        if not self.stops:
            return abs(self.floor - floor)
        d = self.direction if self.direction != Direction.IDLE else self._next_direction()
        if d == Direction.UP and direction == Direction.UP and floor >= self.floor:
            return floor - self.floor
        if d == Direction.DOWN and direction == Direction.DOWN and floor <= self.floor:
            return self.floor - floor
        far = max(self.stops) if d == Direction.UP else min(self.stops)   # finish the sweep, then come back
        return abs(far - self.floor) + abs(far - floor)


class Scheduler(ABC):                                    # Strategy: which car answers a hall call
    @abstractmethod
    def choose(self, cars, floor, direction): ...


class NearestCar(Scheduler):
    def choose(self, cars, floor, direction):
        live = [c for c in cars if c.state != State.MAINTENANCE]
        if not live:
            raise NoElevatorAvailable("every car is out of service")
        return min(live, key=lambda c: (c.cost(floor, direction), c.id))


class FirstAvailable(Scheduler):
    def choose(self, cars, floor, direction):
        for c in cars:
            if c.state != State.MAINTENANCE:
                return c
        raise NoElevatorAvailable("every car is out of service")


class ElevatorController:
    def __init__(self, floors, cars, scheduler):
        self.floors, self.cars, self.scheduler = floors, cars, scheduler
        self.lock = threading.Lock()                     # ponytail: one lock; shard per bank of cars in a big building

    def _check(self, floor):
        if not 0 <= floor < self.floors:
            raise ValueError("no such floor")

    def request_pickup(self, floor, direction):          # external: hall button with a direction
        self._check(floor)
        with self.lock:
            car = self.scheduler.choose(self.cars, floor, direction)
            car.add_stop(floor, external=True)
            return car.id

    def select_floor(self, car_id, floor):               # internal: button inside a car, no scheduling
        self._check(floor)
        with self.lock:
            self.cars[car_id].add_stop(floor)

    def step(self):
        with self.lock:
            for c in self.cars:
                c.step()

    def set_maintenance(self, car_id, on):
        with self.lock:
            car = self.cars[car_id]
            if not on:
                car.state = State.IDLE
                return
            orphaned = list(car.pickups)                 # hall calls go back to the other cars; riders are assumed evacuated
            others = [c for c in self.cars if c is not car]
            car.stops.clear(); car.pickups.clear()
            car.state, car.direction = State.MAINTENANCE, Direction.IDLE
            for f in orphaned:                           # raises if nobody is left, after the car is already out of service
                self.scheduler.choose(others, f, Direction.UP).add_stop(f, external=True)


def run(ctl, ticks):
    for _ in range(ticks):
        ctl.step()


def demo():
    cars = [Elevator(0, 0), Elevator(1, 9)]
    ctl = ElevatorController(10, cars, NearestCar())
    assert ctl.request_pickup(2, Direction.UP) == 0              # car 0 is 2 floors away, car 1 is 7
    run(ctl, 3)
    assert cars[0].floor == 2 and cars[0].state == State.DOORS_OPEN
    ctl.select_floor(0, 5)                                       # rider presses 5
    run(ctl, 5)
    assert cars[0].floor == 5 and cars[0].visited == [2, 5]
    run(ctl, 1)
    assert cars[0].state == State.IDLE and cars[1].state == State.IDLE

    c = Elevator(0, 5)                                           # LOOK: finish upward before reversing
    k = ElevatorController(10, [c], NearestCar())
    k.select_floor(0, 2); k.select_floor(0, 7)
    c.direction = Direction.UP
    run(k, 20)
    assert c.visited == [7, 2]

    a, b = Elevator(0, 4), Elevator(1, 9)                        # car a is busy heading up to 8
    k = ElevatorController(10, [a, b], NearestCar())
    k.select_floor(0, 8); a.direction = Direction.UP
    assert k.request_pickup(6, Direction.UP) == 0                # on the way, same direction
    assert k.request_pickup(3, Direction.DOWN) == 1              # a would need 9 ticks, b needs 6

    k.set_maintenance(1, True)                                   # b leaves service, its hall call goes to a
    assert b.state == State.MAINTENANCE and 3 in a.stops
    run(k, 30)
    assert a.visited == [6, 8, 3]                                # served the picked-up calls in sweep order
    k.set_maintenance(0, True)                                   # now nobody is left for a new call
    try:
        k.request_pickup(1, Direction.UP)
        assert False
    except NoElevatorAvailable:
        pass
    try:
        k.request_pickup(99, Direction.UP)
        assert False
    except ValueError:
        pass
    k.set_maintenance(1, False)
    assert k.request_pickup(1, Direction.UP) == 1
    print("elevator ok")


if __name__ == "__main__":
    demo()`, js: String.raw`const assert = require('assert');

const Direction = { UP: 1, DOWN: -1, IDLE: 0 };
const State = { IDLE: 'idle', MOVING: 'moving', DOORS_OPEN: 'doors_open', MAINTENANCE: 'maintenance' };

class NoElevatorAvailable extends Error {}

// One car. step() is one tick: open doors, or move one floor, or go idle.
class Elevator {
  constructor(id, floor = 0) {
    this.id = id; this.floor = floor;
    this.state = State.IDLE; this.direction = Direction.IDLE;
    this.stops = new Set();     // every floor this car will stop at (internal and external)
    this.pickups = new Set();   // the subset assigned by the dispatcher, so it can be reassigned
    this.visited = [];          // floors where doors opened, handy for tests
  }
  addStop(floor, external = false) {
    if (this.state === State.MAINTENANCE) throw new NoElevatorAvailable(this.id);
    this.stops.add(floor);
    if (external) this.pickups.add(floor);
  }
  _nextDirection() {
    const above = [...this.stops].filter((s) => s > this.floor), below = [...this.stops].filter((s) => s < this.floor);
    if (this.direction === Direction.UP && above.length) return Direction.UP;     // LOOK: keep going while anything is ahead
    if (this.direction === Direction.DOWN && below.length) return Direction.DOWN;
    if (above.length && below.length) {                                           // nothing ahead: turn to the nearer side
      return Math.min(...above) - this.floor <= this.floor - Math.max(...below) ? Direction.UP : Direction.DOWN;
    }
    return above.length ? Direction.UP : Direction.DOWN;
  }
  step() {
    if (this.state === State.MAINTENANCE) return;
    if (this.stops.has(this.floor)) {                 // arrive: open doors for one tick
      this.stops.delete(this.floor); this.pickups.delete(this.floor);
      this.visited.push(this.floor);
      this.state = State.DOORS_OPEN;
      return;
    }
    if (this.stops.size === 0) { this.state = State.IDLE; this.direction = Direction.IDLE; return; }
    this.direction = this._nextDirection();
    this.floor += this.direction;
    this.state = State.MOVING;
  }
  // Ticks until this car could reach the floor for a pickup heading the given direction.
  cost(floor, direction) {
    if (this.stops.size === 0) return Math.abs(this.floor - floor);
    const d = this.direction !== Direction.IDLE ? this.direction : this._nextDirection();
    if (d === Direction.UP && direction === Direction.UP && floor >= this.floor) return floor - this.floor;
    if (d === Direction.DOWN && direction === Direction.DOWN && floor <= this.floor) return this.floor - floor;
    const far = d === Direction.UP ? Math.max(...this.stops) : Math.min(...this.stops);   // finish the sweep, then come back
    return Math.abs(far - this.floor) + Math.abs(far - floor);
  }
}

// Strategy: which car answers a hall call
class NearestCar {
  choose(cars, floor, direction) {
    const live = cars.filter((c) => c.state !== State.MAINTENANCE);
    if (!live.length) throw new NoElevatorAvailable('every car is out of service');
    return live.reduce((a, b) => (b.cost(floor, direction) < a.cost(floor, direction) ? b : a));   // ties keep the lower id
  }
}
class FirstAvailable {
  choose(cars) {
    const c = cars.find((x) => x.state !== State.MAINTENANCE);
    if (!c) throw new NoElevatorAvailable('every car is out of service');
    return c;
  }
}

// ponytail: JS is single-threaded so no lock; with worker threads, funnel every call through one queue or mutex.
class ElevatorController {
  constructor(floors, cars, scheduler) { this.floors = floors; this.cars = cars; this.scheduler = scheduler; }
  _check(floor) { if (!Number.isInteger(floor) || floor < 0 || floor >= this.floors) throw new RangeError('no such floor'); }
  requestPickup(floor, direction) {                  // external: hall button with a direction
    this._check(floor);
    const car = this.scheduler.choose(this.cars, floor, direction);
    car.addStop(floor, true);
    return car.id;
  }
  selectFloor(carId, floor) {                        // internal: button inside a car, no scheduling
    this._check(floor);
    this.cars[carId].addStop(floor);
  }
  step() { this.cars.forEach((c) => c.step()); }
  setMaintenance(carId, on) {
    const car = this.cars[carId];
    if (!on) { car.state = State.IDLE; return; }
    const orphaned = [...car.pickups];               // hall calls go back to the other cars; riders are assumed evacuated
    const others = this.cars.filter((c) => c !== car);
    car.stops.clear(); car.pickups.clear();
    car.state = State.MAINTENANCE; car.direction = Direction.IDLE;
    for (const f of orphaned) this.scheduler.choose(others, f, Direction.UP).addStop(f, true);   // throws if nobody is left
  }
}

const run = (ctl, ticks) => { for (let i = 0; i < ticks; i++) ctl.step(); };

function demo() {
  const cars = [new Elevator(0, 0), new Elevator(1, 9)];
  const ctl = new ElevatorController(10, cars, new NearestCar());
  assert.strictEqual(ctl.requestPickup(2, Direction.UP), 0);             // car 0 is 2 floors away, car 1 is 7
  run(ctl, 3);
  assert.ok(cars[0].floor === 2 && cars[0].state === State.DOORS_OPEN);
  ctl.selectFloor(0, 5);                                                 // rider presses 5
  run(ctl, 5);
  assert.ok(cars[0].floor === 5 && cars[0].visited.join() === '2,5');
  run(ctl, 1);
  assert.ok(cars[0].state === State.IDLE && cars[1].state === State.IDLE);

  const c = new Elevator(0, 5);                                          // LOOK: finish upward before reversing
  let k = new ElevatorController(10, [c], new NearestCar());
  k.selectFloor(0, 2); k.selectFloor(0, 7);
  c.direction = Direction.UP;
  run(k, 20);
  assert.strictEqual(c.visited.join(), '7,2');

  const a = new Elevator(0, 4), b = new Elevator(1, 9);                  // car a is busy heading up to 8
  k = new ElevatorController(10, [a, b], new NearestCar());
  k.selectFloor(0, 8); a.direction = Direction.UP;
  assert.strictEqual(k.requestPickup(6, Direction.UP), 0);               // on the way, same direction
  assert.strictEqual(k.requestPickup(3, Direction.DOWN), 1);             // a would need 9 ticks, b needs 6

  k.setMaintenance(1, true);                                             // b leaves service, its hall call goes to a
  assert.ok(b.state === State.MAINTENANCE && a.stops.has(3));
  run(k, 30);
  assert.strictEqual(a.visited.join(), '6,8,3');                         // served the picked-up calls in sweep order
  k.setMaintenance(0, true);                                             // now nobody is left for a new call
  assert.throws(() => k.requestPickup(1, Direction.UP), NoElevatorAvailable);
  assert.throws(() => k.requestPickup(99, Direction.UP), RangeError);
  k.setMaintenance(1, false);
  assert.strictEqual(k.requestPickup(1, Direction.UP), 1);
  console.log('elevator ok');
}
demo();`, java: String.raw`import java.util.*;

public class Elevator {
    enum Direction { UP, DOWN, IDLE }
    enum State { IDLE, MOVING, DOORS_OPEN, MAINTENANCE }

    static class NoElevatorAvailable extends RuntimeException {
        NoElevatorAvailable(String m) { super(m); }
    }

    /** One car. step() is one tick: open doors, or move one floor, or go idle. */
    static class Car {
        final int id; int floor; State state = State.IDLE; Direction direction = Direction.IDLE;
        final TreeSet<Integer> stops = new TreeSet<>();     // every floor this car will stop at (internal and external)
        final Set<Integer> pickups = new HashSet<>();       // the subset assigned by the dispatcher, so it can be reassigned
        final List<Integer> visited = new ArrayList<>();    // floors where doors opened, handy for tests
        Car(int id, int floor) { this.id = id; this.floor = floor; }

        void addStop(int f, boolean external) {
            if (state == State.MAINTENANCE) throw new NoElevatorAvailable("car " + id);
            stops.add(f);
            if (external) pickups.add(f);
        }

        Direction nextDirection() {
            Integer up = stops.higher(floor), down = stops.lower(floor);
            if (direction == Direction.UP && up != null) return Direction.UP;       // LOOK: keep going while anything is ahead
            if (direction == Direction.DOWN && down != null) return Direction.DOWN;
            if (up != null && down != null) return up - floor <= floor - down ? Direction.UP : Direction.DOWN;   // turn to the nearer side
            return up != null ? Direction.UP : Direction.DOWN;
        }

        void step() {
            if (state == State.MAINTENANCE) return;
            if (stops.remove(floor)) {                       // arrive: open doors for one tick
                pickups.remove(floor);
                visited.add(floor);
                state = State.DOORS_OPEN;
                return;
            }
            if (stops.isEmpty()) { state = State.IDLE; direction = Direction.IDLE; return; }
            direction = nextDirection();
            floor += direction == Direction.UP ? 1 : -1;
            state = State.MOVING;
        }

        /** Ticks until this car could reach floor f for a pickup heading dir. */
        int cost(int f, Direction dir) {
            if (stops.isEmpty()) return Math.abs(floor - f);
            Direction d = direction != Direction.IDLE ? direction : nextDirection();
            if (d == Direction.UP && dir == Direction.UP && f >= floor) return f - floor;
            if (d == Direction.DOWN && dir == Direction.DOWN && f <= floor) return floor - f;
            int far = d == Direction.UP ? stops.last() : stops.first();               // finish the sweep, then come back
            return Math.abs(far - floor) + Math.abs(far - f);
        }
    }

    interface Scheduler { Car choose(List<Car> cars, int floor, Direction dir); }      // Strategy: which car answers a hall call

    static class NearestCar implements Scheduler {
        public Car choose(List<Car> cars, int floor, Direction dir) {
            Car best = null;
            for (Car c : cars) {
                if (c.state == State.MAINTENANCE) continue;
                if (best == null || c.cost(floor, dir) < best.cost(floor, dir)) best = c;   // ties keep the lower id
            }
            if (best == null) throw new NoElevatorAvailable("every car is out of service");
            return best;
        }
    }

    static class FirstAvailable implements Scheduler {
        public Car choose(List<Car> cars, int floor, Direction dir) {
            for (Car c : cars) if (c.state != State.MAINTENANCE) return c;
            throw new NoElevatorAvailable("every car is out of service");
        }
    }

    static class Controller {
        final int floors; final List<Car> cars; final Scheduler scheduler;
        Controller(int floors, List<Car> cars, Scheduler scheduler) { this.floors = floors; this.cars = cars; this.scheduler = scheduler; }

        void check(int f) { if (f < 0 || f >= floors) throw new IllegalArgumentException("no such floor"); }

        // ponytail: one monitor lock; shard per bank of cars in a big building
        synchronized int requestPickup(int floor, Direction dir) {   // external: hall button with a direction
            check(floor);
            Car c = scheduler.choose(cars, floor, dir);
            c.addStop(floor, true);
            return c.id;
        }
        synchronized void selectFloor(int carId, int floor) {        // internal: button inside a car, no scheduling
            check(floor);
            cars.get(carId).addStop(floor, false);
        }
        synchronized void step() { for (Car c : cars) c.step(); }

        synchronized void setMaintenance(int carId, boolean on) {
            Car car = cars.get(carId);
            if (!on) { car.state = State.IDLE; return; }
            List<Integer> orphaned = new ArrayList<>(car.pickups);   // hall calls go back to the other cars; riders are assumed evacuated
            List<Car> others = new ArrayList<>(cars);
            others.remove(car);
            car.stops.clear(); car.pickups.clear();
            car.state = State.MAINTENANCE; car.direction = Direction.IDLE;
            for (int f : orphaned) scheduler.choose(others, f, Direction.UP).addStop(f, true);   // throws if nobody is left
        }
    }

    static void run(Controller ctl, int ticks) { for (int i = 0; i < ticks; i++) ctl.step(); }
    static void check(boolean ok) { if (!ok) throw new AssertionError(); }

    static <T extends Throwable> void expect(Class<T> type, Runnable r) {
        try { r.run(); } catch (Throwable e) { if (type.isInstance(e)) return; throw new AssertionError("wrong exception " + e); }
        throw new AssertionError("expected " + type.getSimpleName());
    }

    public static void main(String[] args) {
        Car c0 = new Car(0, 0), c1 = new Car(1, 9);
        Controller ctl = new Controller(10, List.of(c0, c1), new NearestCar());
        check(ctl.requestPickup(2, Direction.UP) == 0);                  // car 0 is 2 floors away, car 1 is 7
        run(ctl, 3);
        check(c0.floor == 2 && c0.state == State.DOORS_OPEN);
        ctl.selectFloor(0, 5);                                           // rider presses 5
        run(ctl, 5);
        check(c0.floor == 5 && c0.visited.equals(List.of(2, 5)));
        run(ctl, 1);
        check(c0.state == State.IDLE && c1.state == State.IDLE);

        Car c = new Car(0, 5);                                           // LOOK: finish upward before reversing
        Controller k = new Controller(10, List.of(c), new NearestCar());
        k.selectFloor(0, 2); k.selectFloor(0, 7);
        c.direction = Direction.UP;
        run(k, 20);
        check(c.visited.equals(List.of(7, 2)));

        Car a = new Car(0, 4), b = new Car(1, 9);                        // car a is busy heading up to 8
        Controller k2 = new Controller(10, List.of(a, b), new NearestCar());
        k2.selectFloor(0, 8); a.direction = Direction.UP;
        check(k2.requestPickup(6, Direction.UP) == 0);                   // on the way, same direction
        check(k2.requestPickup(3, Direction.DOWN) == 1);                 // a would need 9 ticks, b needs 6

        k2.setMaintenance(1, true);                                      // b leaves service, its hall call goes to a
        check(b.state == State.MAINTENANCE && a.stops.contains(3));
        run(k2, 30);
        check(a.visited.equals(List.of(6, 8, 3)));                       // served the picked-up calls in sweep order
        k2.setMaintenance(0, true);                                      // now nobody is left for a new call
        expect(NoElevatorAvailable.class, () -> k2.requestPickup(1, Direction.UP));
        expect(IllegalArgumentException.class, () -> k2.requestPickup(99, Direction.UP));
        k2.setMaintenance(1, false);
        check(k2.requestPickup(1, Direction.UP) == 1);
        System.out.println("elevator ok");
    }
}`, cpp: String.raw`#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <mutex>
#include <set>
#include <stdexcept>
#include <vector>

enum class Direction { UP, DOWN, IDLE };
enum class State { IDLE, MOVING, DOORS_OPEN, MAINTENANCE };

struct NoElevatorAvailable : std::runtime_error { using std::runtime_error::runtime_error; };

// One car. step() is one tick: open doors, or move one floor, or go idle.
struct Car {
    int id, floor; State state = State::IDLE; Direction direction = Direction::IDLE;
    std::set<int> stops;       // every floor this car will stop at (internal and external)
    std::set<int> pickups;     // the subset assigned by the dispatcher, so it can be reassigned
    std::vector<int> visited;  // floors where doors opened, handy for tests
    Car(int i, int f) : id(i), floor(f) {}

    void addStop(int f, bool external) {
        if (state == State::MAINTENANCE) throw NoElevatorAvailable("car " + std::to_string(id));
        stops.insert(f);
        if (external) pickups.insert(f);
    }

    Direction nextDirection() const {
        auto up = stops.upper_bound(floor);                  // first stop above
        auto lo = stops.lower_bound(floor);                  // first stop at or above; the one before it is below
        bool hasUp = up != stops.end(), hasDown = lo != stops.begin();
        if (direction == Direction::UP && hasUp) return Direction::UP;       // LOOK: keep going while anything is ahead
        if (direction == Direction::DOWN && hasDown) return Direction::DOWN;
        if (hasUp && hasDown) return *up - floor <= floor - *std::prev(lo) ? Direction::UP : Direction::DOWN;   // nearer side
        return hasUp ? Direction::UP : Direction::DOWN;
    }

    void step() {
        if (state == State::MAINTENANCE) return;
        if (stops.erase(floor)) {                            // arrive: open doors for one tick
            pickups.erase(floor);
            visited.push_back(floor);
            state = State::DOORS_OPEN;
            return;
        }
        if (stops.empty()) { state = State::IDLE; direction = Direction::IDLE; return; }
        direction = nextDirection();
        floor += direction == Direction::UP ? 1 : -1;
        state = State::MOVING;
    }

    // Ticks until this car could reach f for a pickup heading dir.
    int cost(int f, Direction dir) const {
        if (stops.empty()) return std::abs(floor - f);
        Direction d = direction != Direction::IDLE ? direction : nextDirection();
        if (d == Direction::UP && dir == Direction::UP && f >= floor) return f - floor;
        if (d == Direction::DOWN && dir == Direction::DOWN && f <= floor) return floor - f;
        int far = d == Direction::UP ? *stops.rbegin() : *stops.begin();     // finish the sweep, then come back
        return std::abs(far - floor) + std::abs(far - f);
    }
};

struct Scheduler {                                           // Strategy: which car answers a hall call
    virtual ~Scheduler() = default;
    virtual Car* choose(std::vector<Car*>& cars, int floor, Direction dir) = 0;
};
struct NearestCar : Scheduler {
    Car* choose(std::vector<Car*>& cars, int floor, Direction dir) override {
        Car* best = nullptr;
        for (Car* c : cars) {
            if (c->state == State::MAINTENANCE) continue;
            if (!best || c->cost(floor, dir) < best->cost(floor, dir)) best = c;    // ties keep the lower id
        }
        if (!best) throw NoElevatorAvailable("every car is out of service");
        return best;
    }
};
struct FirstAvailable : Scheduler {
    Car* choose(std::vector<Car*>& cars, int, Direction) override {
        for (Car* c : cars) if (c->state != State::MAINTENANCE) return c;
        throw NoElevatorAvailable("every car is out of service");
    }
};

class Controller {
    int floors; std::vector<Car*> cars; std::unique_ptr<Scheduler> scheduler;
    std::mutex mu;                                           // ponytail: one lock; shard per bank of cars in a big building
    void check(int f) const { if (f < 0 || f >= floors) throw std::invalid_argument("no such floor"); }
public:
    Controller(int n, std::vector<Car*> c, std::unique_ptr<Scheduler> s) : floors(n), cars(std::move(c)), scheduler(std::move(s)) {}

    int requestPickup(int floor, Direction dir) {            // external: hall button with a direction
        check(floor);
        std::lock_guard<std::mutex> g(mu);
        Car* c = scheduler->choose(cars, floor, dir);
        c->addStop(floor, true);
        return c->id;
    }
    void selectFloor(int carId, int floor) {                 // internal: button inside a car, no scheduling
        check(floor);
        std::lock_guard<std::mutex> g(mu);
        cars[carId]->addStop(floor, false);
    }
    void step() { std::lock_guard<std::mutex> g(mu); for (Car* c : cars) c->step(); }
    void run(int ticks) { while (ticks-- > 0) step(); }

    void setMaintenance(int carId, bool on) {
        std::lock_guard<std::mutex> g(mu);
        Car* car = cars[carId];
        if (!on) { car->state = State::IDLE; return; }
        std::vector<int> orphaned(car->pickups.begin(), car->pickups.end());   // hall calls go back to the other cars
        std::vector<Car*> others;
        for (Car* c : cars) if (c != car) others.push_back(c);
        car->stops.clear(); car->pickups.clear();
        car->state = State::MAINTENANCE; car->direction = Direction::IDLE;
        for (int f : orphaned) scheduler->choose(others, f, Direction::UP)->addStop(f, true);   // throws if nobody is left
    }
};

template <class E, class F> void expect(F f) {
    try { f(); } catch (const E&) { return; }
    std::cerr << "expected exception\n";
    std::abort();
}

#define CHECK(c) do { if (!(c)) { std::cerr << "FAILED: " #c "\n"; std::abort(); } } while (0)
using Visits = std::vector<int>;

int main() {
    Car c0(0, 0), c1(1, 9);
    Controller ctl(10, {&c0, &c1}, std::make_unique<NearestCar>());
    CHECK(ctl.requestPickup(2, Direction::UP) == 0);         // car 0 is 2 floors away, car 1 is 7
    ctl.run(3);
    CHECK(c0.floor == 2 && c0.state == State::DOORS_OPEN);
    ctl.selectFloor(0, 5);                                   // rider presses 5
    ctl.run(5);
    CHECK(c0.floor == 5 && c0.visited == (Visits{2, 5}));
    ctl.run(1);
    CHECK(c0.state == State::IDLE && c1.state == State::IDLE);

    Car c(0, 5);                                             // LOOK: finish upward before reversing
    Controller k1(10, {&c}, std::make_unique<NearestCar>());
    k1.selectFloor(0, 2); k1.selectFloor(0, 7);
    c.direction = Direction::UP;
    k1.run(20);
    CHECK(c.visited == (Visits{7, 2}));

    Car a(0, 4), b(1, 9);                                    // car a is busy heading up to 8
    Controller k(10, {&a, &b}, std::make_unique<NearestCar>());
    k.selectFloor(0, 8); a.direction = Direction::UP;
    CHECK(k.requestPickup(6, Direction::UP) == 0);           // on the way, same direction
    CHECK(k.requestPickup(3, Direction::DOWN) == 1);         // a would need 9 ticks, b needs 6

    k.setMaintenance(1, true);                               // b leaves service, its hall call goes to a
    CHECK(b.state == State::MAINTENANCE && a.stops.count(3));
    k.run(30);
    CHECK(a.visited == (Visits{6, 8, 3}));                   // served the picked-up calls in sweep order
    k.setMaintenance(0, true);                               // now nobody is left for a new call
    expect<NoElevatorAvailable>([&] { k.requestPickup(1, Direction::UP); });
    expect<std::invalid_argument>([&] { k.requestPickup(99, Direction::UP); });
    k.setMaintenance(1, false);
    CHECK(k.requestPickup(1, Direction::UP) == 1);
    std::cout << "elevator ok\n";
}` } }
    ],

    extensions: [
      { q: 'Add **priority** requests (fire-service key, VIP, accessibility).', a: 'Put a priority on the request and keep the stops in an ordered structure. A priority stop is served before the sweep order, and the scheduler can bias to the nearest car regardless of direction. Guard against starvation of normal calls by aging: raise a request priority the longer it waits.\n\nStructurally that means promoting the floor in `stops` to a small `Request` object (floor, direction, priority, created at), a small Command object, as the third decision notes.' },
      { q: 'Add **maintenance mode with draining** instead of an abrupt stop.', a: 'Add a state `DRAINING`: the car accepts no new hall calls (the scheduler skips it), serves its remaining internal stops, then moves to `MAINTENANCE` when stops is empty. Only the transition changes; in the State pattern this is one new class.' },
      { q: 'A car heading up stops for a hall call that wants to go **down**. How do you fix it?', a: 'Store the direction with the stop: key stops by (floor, direction). A car sweeping up stops at a floor if there is an up request there, or if it is the turning floor (the highest stop). It then serves the down requests on the way back. The cost function already respects direction; the car has to as well.' },
      { q: 'How would you handle a **very tall building** with many cars?', a: 'Zone the cars: low, mid and express banks, each with its own controller and scheduler (the same classes, different configuration). Express cars skip floors by only accepting stops in their zone. A destination-dispatch panel (passenger keys in the floor in the hall) lets the scheduler group riders by destination and cuts stops dramatically.' },
      { q: 'How do you prove it never loses a request?', a: 'Property test: generate random hall calls and button presses, step until all cars are idle, and assert every requested floor appears in some car visit list. Include random maintenance toggles. The `pickups` set is what makes that assertion hold when a car goes out of service.' }
    ],

    quiz: [
      { kind: 'concept', q: 'What distinguishes LOOK from SCAN?', choices: ['LOOK reverses at the last requested stop; SCAN goes to the end of the shaft first', 'LOOK serves requests in arrival order', 'SCAN only serves downward requests', 'LOOK never reverses'], answer: 0, explain: 'Both sweep in one direction. LOOK turns around at the furthest pending request, so it wastes no trips to empty floors.' },
      { kind: 'pattern', q: 'Which pattern lets you swap "nearest car" for "least busy car" without changing the controller?', choices: ['Strategy', 'State', 'Observer', 'Singleton'], answer: 0, explain: 'The scheduler is a family of interchangeable algorithms behind one interface: Strategy.' },
      { kind: 'concept', q: 'A car is at floor 4 sweeping up with a stop at 8. A hall call arrives at floor 3 going down, and an idle car sits at floor 9. Which car should win under the cost model in this design, and why?', choices: ['The idle car: 6 ticks versus 4 + 5 = 9 ticks for the sweeping car', 'The sweeping car: it is already moving', 'Either; the cost is identical', 'Neither; wait for the next tick'], answer: 0, explain: 'The sweeping car must finish up to 8 (4 ticks) and then come back to 3 (5 ticks): 9. The idle car needs 6.' },
      { kind: 'bug', q: 'A car is put into maintenance and the controller simply drops its hall calls. What goes wrong?', choices: ['People waiting in the hall are never picked up', 'The other cars deadlock', 'The scheduler throws on every call', 'Nothing; riders will press again'], answer: 0, explain: 'Hall calls are promises to people who are still waiting. Reassign them to the remaining cars, or fail loudly if there are none.' },
      { kind: 'concept', q: 'Pick every reason the controller advances all cars with explicit ticks instead of one thread per car.', choices: ['Tests become deterministic', 'Scheduling sees a consistent view of every car', 'Threads cannot read a floor number', 'It removes the need for a lock'], answer: [0, 1], explain: 'Ticks give repeatable behavior and a consistent snapshot. You still need a lock, because buttons arrive from other threads.' }
    ],

    flashcards: [
      { id: 'el-states', front: 'Elevator car states and who may change them?', back: 'IDLE, MOVING, DOORS_OPEN, MAINTENANCE. The car moves between the first three in step(); only the controller enters or leaves MAINTENANCE.' },
      { id: 'el-look', front: 'LOOK in one sentence?', back: 'Keep moving in the current direction while any stop lies ahead, then reverse; unlike SCAN it never goes on to the end of the shaft for nothing.' },
      { id: 'el-int-ext', front: 'Internal versus external request?', back: 'External is a hall call (floor and direction) that needs a scheduling decision. Internal is a destination pressed inside a car already chosen, so no scheduling.' },
      { id: 'el-cost', front: 'How does the nearest-car cost account for direction?', back: 'Idle: distance. Same direction and on the way: distance. Otherwise: finish the sweep to its far stop, then travel back to the call.' },
      { id: 'el-maint', front: 'What happens to hall calls when a car enters maintenance?', back: 'They are reassigned to other cars by the scheduler. If no car is left, raise NoElevatorAvailable rather than losing them.' },
      { id: 'el-ticks', front: 'Why simulate with ticks?', back: 'Deterministic tests and a consistent snapshot for scheduling. The controller advances every car once per tick under one lock.' }
    ]
  });
})();
