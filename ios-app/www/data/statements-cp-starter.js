/* Offer Ready: problem statements for the competitive programming starter extras. Original wording, not LeetCode's text.
   S(lc, question, examples, approach), all markdown. */
(function () {
  var OR = (window.OR = window.OR || {}), T = (OR.statements = OR.statements || {});
  function S(lc, q, ex, a) { T[lc] = { q: q, ex: ex, a: a }; }

  S(1235, 'You are given three equal-length lists: when each job starts, when it ends and what it pays. You can only do one job at a time, though a job may begin at the exact moment another one ends. Return the largest total pay you can collect. There can be tens of thousands of jobs.',
    '- starts `[1,2,3,3]`, ends `[3,4,5,6]`, pays `[50,10,40,70]` → `120` (the first and the last)\n- starts `[1,1,1]`, ends `[2,3,4]`, pays `[5,6,4]` → `6`\n- one job → its pay',
    'Sort the jobs by end time and keep two parallel sorted lists: finishing times and the best total so far at each. For a job, either skip it or add its pay to the best total among jobs that finish by its start, found by **binary search**. Record the new total only if it improves the best. **O(n log n) time, O(n) space.**');
  S(2104, 'The range of a list of numbers is its biggest value minus its smallest. Given a list of at most 1,000 integers, return the sum of the ranges of every contiguous, non-empty stretch of it. The answer can be large, so keep it in a 64-bit integer.',
    '- `[1,2,3]` → `4`\n- `[1,3,3]` → `4`\n- `[4,-2,-3,4,1]` → `59`',
    'The limit is small, so a double loop is fine: for each start, extend the end one step at a time while tracking the running min and max, and add `max - min` each step. **O(n²) time, O(1) space.** For a large `n`, count each element\'s contribution as a maximum and as a minimum with monotonic stacks: O(n).');
  S(1015, 'Consider the numbers 1, 11, 111, 1111 and so on, made only of the digit 1. Given a positive integer `k`, return the length of the shortest such number that `k` divides evenly, or `-1` if none exists. The number itself may be far too big to store.',
    '- `k = 1` → `1`\n- `k = 2` → `-1` (every such number is odd)\n- `k = 3` → `3` (111 = 3 × 37)',
    'Never build the digits. Appending a `1` turns `x` into `10x + 1`, so track only the remainder: `r = (r * 10 + 1) % k`. Return the length when `r` hits 0. Only `k` remainders exist, so if you reach length `k` without a 0, return `-1`. **O(k) time, O(1) space.**');
})();
