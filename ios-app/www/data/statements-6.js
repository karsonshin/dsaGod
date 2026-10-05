/* Offer Ready: problem statements, part 6 (queues and deques).
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* queues */
  S(232, 'Build a first-in-first-out queue out of two stacks. It must support push (to the back), pop (remove and return the front), peek (read the front) and empty.',
    '- push 1, push 2, `peek()` → `1`, `pop()` → `1`, `empty()` → `false`',
    'Keep an inbox stack and an outbox stack. Pour the whole inbox into the outbox only when the outbox is empty, so the oldest item ends up on top. **Amortized O(1) per operation.**');
  S(225, 'Build a last-in-first-out stack out of queues. It must support push, pop (remove and return the top), top and empty.',
    '- push 1, push 2, `top()` → `2`, `pop()` → `2`, `empty()` → `false`',
    'Use one queue. After each push, rotate the older items behind the new one so the newest is at the front. **push O(n), the rest O(1).**');
  S(933, 'Design a counter for incoming requests. `ping(t)` records a request at time `t` (milliseconds, always larger than any earlier `t`) and returns how many requests, including this one, fall in the closed window `[t - 3000, t]`.',
    '- pings at `1, 100, 3001, 3002` → `1, 2, 3, 3`',
    'Keep a queue of timestamps. Enqueue `t`, then dequeue while the front is older than `t - 3000`; the queue size is the answer. **Amortized O(1) per ping.**');
  S(622, 'Design a queue with a fixed capacity `k` that reuses freed space. Support enQueue, deQueue (each returning whether it worked), Front and Rear (−1 if empty), isEmpty and isFull.',
    '- capacity 3: enQueue 1, 2, 3 succeed, enQueue 4 fails, `isFull()` → `true`; after a deQueue, enQueue 4 succeeds and `Rear()` → `4`',
    'Use a ring buffer with `head` and `size`. The next free slot is `(head + size) % k`; dequeue advances `head` with wrap-around. **O(1) per operation, O(k) space.**');
  S(641, 'Design a double-ended queue with a fixed capacity `k`. Support inserting and deleting at either end, reading either end (−1 if empty), isEmpty and isFull.',
    '- capacity 3: insertLast 1, insertLast 2, insertFront 3 succeed, insertFront 4 fails; `getRear()` → `2`',
    'A ring buffer with `head` and `size`. A front insert first steps `head` back by one with wrap-around; a back insert writes at `(head + size) % k`. **O(1) per operation.**');
  S(1700, 'Students stand in a line, each wanting sandwich type 0 or 1. A stack of sandwiches is offered one at a time from the top: the student at the front takes it if it is their type, otherwise moves to the back of the line. This repeats until nobody at all wants the top sandwich. Return how many students end up without a sandwich.',
    '- students `[1,1,0,0]`, sandwiches `[0,1,0,1]` → `0`\n- students `[1,1,1,0,0,1]`, sandwiches `[1,0,0,0,1,1]` → `3`',
    'Rotation means order never blocks anyone, only counts do. Count each preference, walk the sandwiches, and stop at the first type nobody left wants. **O(n) time.**');
  S(649, 'Two parties, `R` and `D`, sit in a row of senators. Going round in order, each senator who is still active bans one opposing senator from acting again. This repeats over the remaining senators until one party has none left. Return the winning party, assuming everyone bans the nearest opponent who has not yet acted.',
    '- `"RD"` → `"Radiant"`\n- `"RDD"` → `"Dire"`',
    'Keep two queues of indices. Compare the fronts: the smaller index acts first, bans the other, and rejoins its queue at `index + n`. The party with an empty queue loses. **O(n).**');
  S(950, 'Reorder a deck of distinct numbers so that this procedure reveals them in increasing order: reveal the top card and remove it, then move the new top card to the bottom, and repeat until no cards are left. Return the starting order.',
    '- `[17,13,11,2,3,5,7]` → `[2,13,3,11,5,17,7]`',
    'Sort the deck and simulate the procedure on positions with a deque: the first position revealed gets the smallest card, and the next position moves to the back. **O(n log n) time.**');
})();
