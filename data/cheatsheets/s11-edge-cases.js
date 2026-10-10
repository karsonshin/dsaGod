/* Cheat sheet 11: edge cases and the bug checklist. */
(function () {
  var OR = (window.OR = window.OR || {});
  OR.cheatsheets.push({
    n: 11, id: 'edge-cases', title: 'Edge cases and bug checklist',
    blurb: 'Inputs to try for every input type, boundary patterns per technique, the 12 Python bugs that sink most solutions, and a dry-run and debugging ritual.',
    keywords: 'edge cases bugs off by one boundary debug checklist dry run python pitfalls empty duplicates null overflow',
    render: function (h) {
      return h.cols(
          h.sec('Inputs to try, by type', h.T(['Type', 'Try these'], [
            ['Array / string', 'empty, 1 element, 2 elements, all equal, sorted, reverse sorted, duplicates, negatives, zero, min and max values, unicode or mixed case, spaces'],
            ['Numbers', '0, 1, -1, INT_MAX / INT_MIN (overflow in Java and C++, never in Python), negative divide or modulo, n = 10⁵ or more'],
            ['Linked list', 'null head, 1 node, 2 nodes, cycle, tail pointing to head'],
            ['Tree', 'null root, single node, only left or only right child (a chain), duplicates, negative values, height n'],
            ['Graph', 'no edges, one node, disconnected, cycle, self-loop, parallel edges, directed vs undirected'],
            ['Grid', '1×1, 1×N, N×1, all walls, start equals goal, start blocked'],
            ['Intervals', 'empty, one, identical, nested, touching ends ([1,2] and [2,3]), unsorted'],
            ['Target / k', 'k = 0, k = 1, k = n, k > n, target absent, target at either end']
          ], { cls: 'cs-edge1', label: 'Inputs to try' })) +
          h.sec('Boundary patterns by technique', h.T(['Technique', 'Check'], [
            ['[[binary-search|Binary search]]', 'Pick one invariant. `lo <= hi` with `hi = n-1` and `mid±1`, or `lo < hi` with `hi = n` and `hi = mid`. Never mix. `mid = lo + (hi-lo)//2`. Left-biased mid with `lo = mid` loops forever.'],
            ['[[sliding-window|Sliding window]]', 'Expand right, then shrink left `while` invalid, then record. Update counts before the validity test. Length is `r-l+1`.'],
            ['[[two-pointers|Two pointers]]', 'Stop at `l < r` for pairs, `l <= r` if one middle element counts. Skip duplicates after a match, not before.'],
            ['[[prefix-sums|Prefix sums]]', 'Size n+1, `P[0]=0`, sum(i..j) = `P[j+1]-P[i]`. Seed a hash map with `{0: 1}` or `{0: -1}`.'],
            ['[[intervals|Intervals]]', 'Decide if touching ends overlap (`<` vs `<=`). Sort by start. Merge uses `max` of ends.'],
            ['DP ([[dp-1d]], [[dp-2d]])', 'Table n+1 (or m+1 by n+1). Base cases first (0, 1, empty). Loop order matches dependencies. Return the right cell, not `dp[n-1]` by habit.'],
            ['[[recursion|Recursion]]', 'Base case before recursing, and it must be reachable. Shrink the input each call. Depth n risks the limit.']
          ], { cls: 'cs-edge2', label: 'Boundary patterns' })),
          
          h.sec('The 12 bugs that fail most Python solutions', h.T(['#', 'Bug', 'Fix'], [
            ['1', 'Mutating a list or dict while looping over it', 'Iterate over a copy, or build a new list'],
            ['2', '`[[0]*m]*n` shares one row n times', '`[[0]*m for _ in range(n)]`'],
            ['3', 'Default `def f(x=[])` is shared by all calls', '`x=None`, then `x = x or []`'],
            ['4', '`/` returns float; `//` floors toward -inf: `-7//2 == -4`', '`int(a/b)` truncates toward 0; keep ints exact'],
            ['5', 'No visited set: infinite loop on cycles and grids', 'Mark when you enqueue, not when you pop'],
            ['6', '`heapq` is a min-heap; ties compare the next tuple item', 'Push `-x`; add a counter `(d, i, node)`'],
            ['7', 'Assuming sort order of ties, or sorting by one key when two matter', '`sorted` is stable; use `key=lambda p: (a, -b)`'],
            ['8', '`return` inside the loop that should finish first', 'Return after the loop; check indentation'],
            ['9', '`res.append(path)` stores the same list you keep editing', '`res.append(path[:])` or `list(path)`'],
            ['10', 'Strings are immutable: `s[i] = c` fails; `s += c` in a loop is O(n²)', 'List of chars, then `"".join(...)`'],
            ['11', 'Recursion limit is about 1000 by default', 'Iterate with a stack, or `sys.setrecursionlimit` if allowed'],
            ['12', 'Slices exclude the end: `s[a:b]` has `b-a` items; slicing copies in O(k); `s[-0:]` is everything', 'Use indices, not slices, in loops']
          ], { cls: 'cs-edge3', label: 'Twelve Python bugs' })) +
          h.sec('Dry run before you say done (6 steps)', '<ol class="cs-steps">' +
            ['Pick the smallest input that exercises every branch.', 'Write variables as a table and update each row by hand.', 'Run the empty or one-element case.', 'Run one case where the answer sits at a boundary (first or last index).', 'Run a duplicates or negatives case.', 'State time and space, then name one input you did not test.'].map(function (x) { return '<li>' + h.m(x) + '</li>'; }).join('') + '</ol>') +
          h.sec('My answer is wrong, now what? (5 steps)', '<ol class="cs-steps">' +
            ['Reproduce on the smallest failing input. Do not guess yet.', 'Print the state each iteration and find the first step where it differs from your hand trace.', 'Ask which assumption failed: input range, duplicates, ties, empty, ordering.', 'Fix one thing, rerun everything, including passing cases.', 'Write the missed cue in your error log so it comes back as a flashcard.'].map(function (x) { return '<li>' + h.m(x) + '</li>'; }).join('') + '</ol>')
        );
    }
  });
})();
