/* Cheat sheet 2: sorting comparison and each language's default sort. */
(function () {
  var OR = (window.OR = window.OR || {});
  OR.cheatsheets.push({
    n: 2, id: 'sorting', title: 'Sorting comparison',
    blurb: 'Time, space and stability of every sort worth knowing, when to reach for each, and what your language really runs.',
    keywords: 'sort merge quick heap counting radix bucket timsort introsort stable comparator',
    render: function (h) {
      return h.sec('Algorithms (n items; k = value range; d = digits)', h.T(
        ['Sort', 'Best', 'Average', 'Worst', 'Extra space', 'Stable?', 'Use it when'],
        [
          ['Bubble', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'yes', 'Never in production. Early exit makes it O(n) on sorted input.'],
          ['Selection', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'no', 'Writes are minimal (n swaps). Otherwise avoid.'],
          ['Insertion', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'yes', 'Tiny or nearly sorted input. Fast libraries use it for small runs.'],
          ['Merge', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'yes', 'Need stability, linked lists, or data too big for memory (external sort). Counts inversions.'],
          ['Quick', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n) stack, expected', 'no', 'Fastest in practice on arrays. Random or median-of-three pivot avoids the worst case. Basis of quickselect.'],
          ['Heap', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', 'no', 'Guaranteed n log n with no extra memory. Slower than quick in practice.'],
          ['Counting', 'O(n+k)', 'O(n+k)', 'O(n+k)', 'O(n+k)', 'yes', 'Integers in a small known range (k near n or smaller), e.g. letters or ages.'],
          ['Radix (LSD)', 'O(d(n+k))', 'O(d(n+k))', 'O(d(n+k))', 'O(n+k)', 'yes', 'Fixed-width integers or equal-length strings; needs a stable inner sort.'],
          ['Bucket', 'O(n+k)', 'O(n+k)', 'O(n²)', 'O(n+k)', 'yes if inner sort is', 'Inputs spread evenly over a range, such as floats in [0, 1). Skewed data lands in one bucket.'],
          ['Timsort (merge + insertion)', 'O(n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'yes', 'Exploits runs already in the data. What Python, JS and Java objects use.']
        ], { cls: 'cs-sorts', label: 'Sorting algorithms compared' })) +
        h.sec('What each language runs by default', h.T(
          ['Language', 'Call', 'Algorithm', 'Stable?', 'Watch out for'],
          [
            ['Python', '`a.sort()`, `sorted(a)`', 'Timsort', 'yes', 'In place vs new list. Use `key=`; for an old-style comparator wrap it with `functools.cmp_to_key`. Sorting tuples compares element by element.'],
            ['JavaScript', '`a.sort(cmp)`', 'V8: TimSort (stable since ES2019, V8 7.0)', 'yes', '**Default order is by string**: `[10, 9, 1].sort()` gives `[1, 10, 9]`. Always pass `(x, y) => x - y`. It sorts in place and returns the same array.'],
            ['Java', '`Arrays.sort(int[])`', 'Dual-pivot quicksort for primitives', 'no (irrelevant for primitives)', 'Comparators like `a - b` overflow; use `Integer.compare(a, b)`. `Arrays.sort(Integer[])` needs a boxed array to take a comparator.'],
            ['Java', '`Arrays.sort(T[])`, `Collections.sort`, `List.sort`', 'TimSort for objects', 'yes', 'Comparator that breaks the contract (not transitive) can throw `IllegalArgumentException: Comparison method violates its general contract`.'],
            ['C++', '`std::sort`', 'Introsort in the common implementations (quicksort, heapsort fallback, insertion for small ranges); the standard requires O(n log n) worst case', 'no', 'Comparator must be a strict weak ordering: use `<`, never `<=`, or you get undefined behavior. `std::stable_sort` is the stable one; `nth_element` is quickselect.']
          ], { cls: 'cs-langsort', label: 'Default sort per language' })) +
        '<div class="cs-cols">' +
        h.sec('Decision rules', h.list([
          'Just need it sorted: call the library sort. It is faster and more correct than yours.',
          'Asked to write one: **merge sort** (clean, stable, n log n) or **quicksort** (say the pivot choice). Say the complexity and stability unprompted.',
          'Integers in a small range: counting sort, O(n+k).',
          'Only the top K or the K-th: heap O(n log k) or quickselect average O(n); do not sort everything.',
          'Nearly sorted or small: insertion sort, or trust Timsort.',
          'Sorting by two keys: sort by the secondary key first with a stable sort, or sort once with a tuple or comparator.'
        ])) +
        h.sec('Facts to say out loud', h.list([
          'Any comparison sort needs Ω(n log n) comparisons in the worst case.',
          'Stable: equal keys keep their input order. It matters when sorting records by one field.',
          'Quicksort worst case O(n²) happens on already sorted input with a bad pivot, not on random input.',
          'Merge sort on arrays needs O(n) extra space; on linked lists it needs only O(log n) stack.',
          'See [[sorting|the Sorting lesson]], [[heaps]] for top-K, [[binary-search]] once data is sorted.'
        ])) +
        '</div>';
    }
  });
})();
