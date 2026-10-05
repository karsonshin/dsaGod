/* Offer Ready: problem statements for the design-ds topic's added problems.
   Original wording, not LeetCode's text. S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  /* design-ds */
  S(380, 'Design a bag of distinct numbers with three operations: `insert(x)` adds x if absent (returns whether it was added), `remove(x)` deletes x if present (returns whether it was removed), and `getRandom()` returns one stored number, every stored number equally likely. Each operation must be O(1) on average.',
    '- insert(4) → true, insert(4) → false, insert(7) → true, remove(4) → true, getRandom() → `7`',
    'Keep the numbers in an array (for random picking by index) and a map from number to its index. To remove, copy the **last** element over the removed slot, update that element’s index in the map, then pop the end. **O(1) average each.**');
  S(460, 'Design a cache with a fixed capacity. `get(key)` returns the value or -1; `put(key, value)` inserts or updates. When it is full, evict the key that has been used the **fewest** times; if several tie, evict the one used least recently. A use is any get or put on the key. Both operations should be O(1).',
    '- capacity 2: put(1,1), put(2,2), get(1) → `1`, put(3,3) evicts key 2 (used once, versus twice for key 1), get(2) → `-1`, get(3) → `3`',
    'Keep a map key → (value, count), a map count → recency-ordered keys, and the smallest count in use. A use moves the key from its count bucket to the next one and bumps the minimum if its old bucket empties. Evict the oldest key of the minimum bucket. A new key resets the minimum to 1. **O(1) per operation.**');
  S(284, 'Wrap an existing iterator so it can also **peek**. `next()` returns the next value and advances, `hasNext()` says whether any value remains, and `peek()` returns the next value without advancing.',
    '- over `[1, 2, 3]`: next() → `1`, peek() → `2`, next() → `2`, next() → `3`, hasNext() → false',
    'Hold one value of look-ahead. Fill it from the wrapped iterator at construction and each time it is consumed; `peek` returns it, `next` returns it and refills. **O(1) per call, O(1) extra space.**');
})();
