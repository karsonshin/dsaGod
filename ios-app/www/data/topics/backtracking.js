/* Offer Ready: Backtracking lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'backtracking',

    hook: 'Backtracking is how you **list every valid answer** (every subset, every ordering, every placement) without writing a loop per item. You build one answer a choice at a time, and the moment a choice leads nowhere you undo it and try the next. It is a staple of interviews because it tests three things at once: recursion, careful state handling, and whether you can cut off hopeless branches early.',

    cues: [
      'The problem says **“all”, “every” or “list”**: all subsets, all orderings, all ways to split, all valid placements. You need the answers themselves, not a count.',
      'The answer is **built one decision at a time**: take or skip an item, pick the next letter, put a piece in the next row.',
      'The input is **small** (n ≤ about 10 to 20), because the number of answers is exponential. A limit of n ≤ 8 is a strong hint.',
      'Some partial answers are **already invalid**, so you can stop early: a sum over the target, two queens in one column, a letter that doesn’t match.',
      'You are searching a **grid or board** where a path may not reuse a cell, or filling a puzzle (Sudoku, N-Queens) under rules.',
      'Duplicates are in the input and the answer must not repeat. That is the **“skip the repeat at the same depth”** rule.',
      'The trap: if the question only asks for a **count** or an optimum and subproblems repeat, backtracking is too slow. Reach for [dynamic programming](#/topic/dp-1d) instead.'
    ],

    intuition: [
      'Think of a maze with a ball of string. At every fork you pick a corridor and walk down it, unspooling string. At a dead end you don’t start over: you rewind to the last fork and take the next corridor. The string always shows exactly the path from the entrance to where you stand.',
      'That is the algorithm. The **path** is the partial answer. Each step is three moves, in this order:',
      '1. **Choose**: add one option to the path.\n2. **Explore**: recurse to extend the path further.\n3. **Unchoose**: remove that option again, so the path is exactly what it was before and the next option starts clean.',
      'The calls form a **decision tree**. A node is a path, an edge is a choice, and a leaf is either a finished answer or a dead end. Backtracking is a depth-first walk of that tree. The unchoose step is what lets one shared `path` list serve every branch, so you never copy it until you record an answer.',
      '**Pruning** is where the speed comes from. If a path can’t possibly become a valid answer, don’t explore below it: a whole subtree vanishes. Checking a rule *before* you choose (is this column free? is the sum still under the target?) is cheaper than building the answer and rejecting it later. Run the visualizer, then switch **Skip repeats** on with the input `122` and watch a branch get cut.'
    ].join('\n\n'),

    viz: 'backtracking-tree',

    template: {
      title: 'Subsets with choose / explore / unchoose (skipping repeats)',
      note: 'The `start` index is what makes the answers subsets instead of orderings: from position `start` you may only take items at or after it, so each set is built once. To reuse it, change **what counts as an answer** (the `record` line, often guarded by an `if`), **which candidates are allowed** (the `prune` line, plus any early `break`), and **what the next call receives** (`i + 1` to use an item once, `i` to allow reuse). The `prune` line is the same-depth rule: after sorting, a value equal to the one just tried at this depth would repeat a whole branch. Copy the path with `path[:]` when you record it, because the list keeps changing.',
      code: {
        py: `def subsets_unique(nums):
    nums.sort()                                          #> Sort so equal values sit side by side
    res, path = [], []
    def dfs(start):
        res.append(path[:])                              #@record > Every node of the tree is an answer: save a copy
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:     #@prune > Same value already tried at this depth: skip it
                continue
            path.append(nums[i])                         #@choose > Choose: add the item to the path
            dfs(i + 1)                                   #@explore > Explore: everything that extends this path
            path.pop()                                   #@unchoose > Unchoose: undo it so the next item starts clean
    dfs(0)
    return res`,
        js: `function subsetsUnique(nums) {
  nums.sort((a, b) => a - b);                            //> Sort so equal values sit side by side
  const res = [], path = [];
  function dfs(start) {
    res.push([...path]);                                 //@record > Every node of the tree is an answer: save a copy
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue; //@prune > Same value already tried at this depth: skip it
      path.push(nums[i]);                                //@choose > Choose: add the item to the path
      dfs(i + 1);                                        //@explore > Explore: everything that extends this path
      path.pop();                                        //@unchoose > Unchoose: undo it so the next item starts clean
    }
  }
  dfs(0);
  return res;
}`,
        java: `class Solution {
    public List<List<Integer>> subsetsUnique(int[] nums) {
        Arrays.sort(nums);                                       // Sort so equal values sit side by side
        List<List<Integer>> res = new ArrayList<>();
        dfs(nums, 0, new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
        res.add(new ArrayList<>(path));                          //@record > Every node of the tree is an answer: save a copy
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;   //@prune > Same value already tried at this depth: skip it
            path.add(nums[i]);                                   //@choose > Choose: add the item to the path
            dfs(nums, i + 1, path, res);                         //@explore > Explore: everything that extends this path
            path.remove(path.size() - 1);                        //@unchoose > Unchoose: undo it so the next item starts clean
        }
    }
}`,
        cpp: `class Solution {
public:
    vector<vector<int>> subsetsUnique(vector<int>& nums) {
        sort(nums.begin(), nums.end());                          // Sort so equal values sit side by side
        vector<vector<int>> res;
        vector<int> path;
        dfs(nums, 0, path, res);
        return res;
    }

private:
    void dfs(vector<int>& nums, int start, vector<int>& path, vector<vector<int>>& res) {
        res.push_back(path);                                     //@record > Every node of the tree is an answer: save a copy
        for (int i = start; i < (int)nums.size(); i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;   //@prune > Same value already tried at this depth: skip it
            path.push_back(nums[i]);                             //@choose > Choose: add the item to the path
            dfs(nums, i + 1, path, res);                         //@explore > Explore: everything that extends this path
            path.pop_back();                                     //@unchoose > Unchoose: undo it so the next item starts clean
        }
    }
};`
      },
      tests: { fn: { py: 'subsets_unique', default: 'subsetsUnique' }, sig: { args: ['int[]'] }, compare: 'unordered', cases: [
        { args: [[1, 2, 2]], out: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] },
        { args: [[0]], out: [[], [0]] },
        { args: [[]], out: [[]] },
        { args: [[3, 1, 2]], out: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]] },
        { args: [[4, 4, 4, 1, 4]], out: [[], [1], [1, 4], [1, 4, 4], [1, 4, 4, 4], [1, 4, 4, 4, 4], [4], [4, 4], [4, 4, 4], [4, 4, 4, 4]] }] }
    },

    complexity: {
      time: 'O(n · 2ⁿ) for subsets, O(n · n!) for permutations; pruning cuts the real work, not the worst case',
      space: 'O(n) for the path and the call stack, plus the output',
      why: 'Count the nodes of the decision tree, then multiply by the work per node. Subsets: each of n items is in or out, so 2ⁿ answers, and copying one into the result costs up to n. Permutations: n choices, then n − 1, then n − 2, so n! leaves. Combinations of k from n: C(n, k) leaves. Sudoku and N-Queens have a far smaller *searched* tree than the raw n^n, because each placement removes options. The recursion itself is only as deep as the path is long, so the stack is O(n); the answer list is extra and usually not counted.',
      trap: 'Backtracking is **exponential by nature**: you can only tighten the constant with pruning. Quote the size of the *output* (“there are 2ⁿ subsets, so any solution is at least that big”) to show why no polynomial algorithm exists for listing them. And if the question asks only for a **count** or a best value, say so out loud: that is usually a job for memoization or DP, which is polynomial.'
    },

    variations: [
      {
        name: 'Permutations: swap in place instead of a used array',
        body: 'The worked solution below keeps a `used` array and a path. This variant needs neither: the first `k` positions are fixed, and each remaining item is swapped into position `k`, explored, then swapped back. The choose / explore / unchoose beat is the same (the swap is the choose, and swapping again is the unchoose). The answers come out in a different order, and it is harder to adapt to duplicates, so know both.',
        code: {
          py: `def permute_swap(nums):
    res = []
    def dfs(k):                                  # nums[:k] is fixed, nums[k:] is still free
        if k == len(nums):
            res.append(nums[:])                  #> All positions filled: record a copy
            return
        for i in range(k, len(nums)):
            nums[k], nums[i] = nums[i], nums[k]  #> Choose: put item i in position k
            dfs(k + 1)
            nums[k], nums[i] = nums[i], nums[k]  #> Unchoose: swap back
    dfs(0)
    return res`,
          js: `function permuteSwap(nums) {
  const res = [];
  function dfs(k) {                              // nums[0..k) is fixed, the rest is free
    if (k === nums.length) { res.push([...nums]); return; }   //> All positions filled: record a copy
    for (let i = k; i < nums.length; i++) {
      [nums[k], nums[i]] = [nums[i], nums[k]];   //> Choose: put item i in position k
      dfs(k + 1);
      [nums[k], nums[i]] = [nums[i], nums[k]];   //> Unchoose: swap back
    }
  }
  dfs(0);
  return res;
}`
        },
        tests: { fn: { py: 'permute_swap', default: 'permuteSwap' }, compare: 'unordered', cases: [
          { args: [[1, 2, 3]], out: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] }, { args: [[0, 1]], out: [[0, 1], [1, 0]] }, { args: [[7]], out: [[7]] }] }
      },
      {
        name: 'Combinations: choose k of 1 to n, with an early stop',
        body: 'When the answer has a fixed size k, the path length is a built-in prune. If you still need `k − len(path)` more items, the loop must stop while that many remain after `i`: running past that point can never finish. That one bound removes the dead branches near the right edge of the tree.',
        code: {
          py: `def combine(n, k):
    res, path = [], []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])                  #> The path has k items: record and stop
            return
        need = k - len(path)
        for i in range(start, n - need + 2):     #> Prune: stop when too few numbers remain to fill the path
            path.append(i)
            dfs(i + 1)
            path.pop()
    dfs(1)
    return res`,
          js: `function combine(n, k) {
  const res = [], path = [];
  function dfs(start) {
    if (path.length === k) { res.push([...path]); return; }   //> The path has k items: record and stop
    const need = k - path.length;
    for (let i = start; i <= n - need + 1; i++) {             //> Prune: stop when too few numbers remain to fill the path
      path.push(i);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(1);
  return res;
}`
        },
        tests: { fn: 'combine', compare: 'unordered', cases: [
          { args: [4, 2], out: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]] }, { args: [1, 1], out: [[1]] }, { args: [4, 3], out: [[1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4]] }, { args: [3, 3], out: [[1, 2, 3]] }] }
      },
      {
        name: 'Dedupe at the same depth',
        body: 'With duplicates in the input, two different choices can look identical: in `[1, 2, 2]` choosing the first 2 or the second 2 leads to the same subsets. The rule is: **sort first, then at a given depth never try a value that equals the one you just tried**. In the start-index loop that is `if i > start and nums[i] == nums[i-1]: continue`. Note it is `i > start`, not `i > 0`: the second 2 is allowed to join the path *below* the first (that gives `[2, 2]`), only not as a sibling of it. For permutations with a `used` array the same rule reads `nums[i] == nums[i-1] and not used[i-1]`: take the equal twins in left-to-right order only.'
      },
      {
        name: 'Pruning: cut it before you build it',
        body: 'A prune is a check that proves *no answer can lie below this node*. The earlier it fires, the more it saves. Three common shapes:\n\n- **Sorted bound**: in a sum problem, sort the candidates; once `candidate > remaining`, `break`, because every later candidate is larger too. This is a break, not a continue.\n- **Feasibility check**: before placing a queen, test the column and both diagonals in O(1) with sets or boolean arrays. Don’t place, then scan the board.\n- **Counting bound**: if fewer items remain than the path still needs (the `n - need + 1` above), stop the loop.\n\nPruning never changes the answer, only the work. If a prune makes an answer disappear, the rule is wrong.'
      },
      {
        name: 'Constraint puzzles: Sudoku',
        body: 'Sudoku is the same loop with a different tree: the **decision is a cell** and the **candidates are the digits** 1 to 9. Collect the empty cells once, keep a set per row, column and 3×3 box, and for each empty cell try every digit that none of the three sets contains (that is the prune). Put the digit in, recurse to the next empty cell, and if the recursion fails, remove the digit. `True` bubbles up the moment the last cell is filled, so the board stays solved in place. Real solvers pick the empty cell with the fewest options first; that ordering turns a long search into a short one.',
        code: {
          py: `def solve_sudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    empties = []
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == '.':
                empties.append((r, c))
            else:
                rows[r].add(v); cols[c].add(v); boxes[r // 3 * 3 + c // 3].add(v)
    def dfs(k):
        if k == len(empties):
            return True                              #> Every empty cell is filled
        r, c = empties[k]
        b = r // 3 * 3 + c // 3
        for d in '123456789':
            if d in rows[r] or d in cols[c] or d in boxes[b]:
                continue                             #> Prune: this digit already appears in the row, column or box
            board[r][c] = d                          #> Choose
            rows[r].add(d); cols[c].add(d); boxes[b].add(d)
            if dfs(k + 1):                           #> Explore
                return True
            board[r][c] = '.'                        #> Unchoose
            rows[r].discard(d); cols[c].discard(d); boxes[b].discard(d)
        return False
    dfs(0)`,
          js: `function solveSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());
  const empties = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === '.') empties.push([r, c]);
      else { rows[r].add(v); cols[c].add(v); boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)].add(v); }
    }
  }
  function dfs(k) {
    if (k === empties.length) return true;           //> Every empty cell is filled
    const [r, c] = empties[k];
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    for (const d of '123456789') {
      if (rows[r].has(d) || cols[c].has(d) || boxes[b].has(d)) continue;   //> Prune: the digit is already in the row, column or box
      board[r][c] = d;                               //> Choose
      rows[r].add(d); cols[c].add(d); boxes[b].add(d);
      if (dfs(k + 1)) return true;                   //> Explore
      board[r][c] = '.';                             //> Unchoose
      rows[r].delete(d); cols[c].delete(d); boxes[b].delete(d);
    }
    return false;
  }
  dfs(0);
}`
        },
        tests: { fn: { py: 'solve_sudoku', default: 'solveSudoku' }, inPlace: 0, cases: [
          { args: [[['.', '3', '4', '6', '7', '8', '9', '1', '2'], ['6', '7', '2', '1', '9', '.', '3', '4', '8'], ['1', '9', '8', '3', '4', '2', '5', '6', '7'], ['8', '5', '9', '7', '.', '1', '4', '2', '3'], ['4', '2', '6', '8', '5', '3', '7', '9', '1'], ['7', '1', '3', '.', '2', '4', '8', '5', '6'], ['9', '6', '1', '5', '3', '7', '2', '8', '.'], ['2', '8', '.', '4', '1', '9', '6', '3', '5'], ['3', '4', '5', '2', '8', '6', '1', '.', '9']]],
            out: [['5', '3', '4', '6', '7', '8', '9', '1', '2'], ['6', '7', '2', '1', '9', '5', '3', '4', '8'], ['1', '9', '8', '3', '4', '2', '5', '6', '7'], ['8', '5', '9', '7', '6', '1', '4', '2', '3'], ['4', '2', '6', '8', '5', '3', '7', '9', '1'], ['7', '1', '3', '9', '2', '4', '8', '5', '6'], ['9', '6', '1', '5', '3', '7', '2', '8', '4'], ['2', '8', '7', '4', '1', '9', '6', '3', '5'], ['3', '4', '5', '2', '8', '6', '1', '7', '9']] }] }
      },
      {
        name: 'Grid backtracking: word search',
        body: 'On a grid the “path” is a trail of cells and the candidates are the four neighbours. The twist is the **visited set**: a cell may not be reused within one trail but must be free again for the next. Instead of a separate set, write a marker (like `#`) into the cell when you choose it and restore the letter when you unchoose it. That single swap is choose / unchoose in miniature. Prune hard: stop at once if the cell is off the board or its letter doesn’t match the next letter of the word. Try every cell as a starting point, and return as soon as one trail completes. The worst case is O(cells × 3^L) for a word of length L (three ways to continue, since you can’t go back), and early mismatches make it far smaller in practice.'
      },
      {
        name: 'Backtracking or dynamic programming?',
        body: 'Ask what the question wants. **Every answer listed** (all subsets, all valid boards): backtracking, because the output itself is exponential. **A count or a best value** where the *same state* shows up from many paths (ways to make change, longest anything): memoize or tabulate, see [1-D dynamic programming](#/topic/dp-1d). A telling sign: if your decision tree has identical subtrees, you are paying for repeated work. If every subtree is different, as in N-Queens or Sudoku, there is nothing to cache.'
      }
    ],

    worked: [
      {
        lc: 78,
        restate: 'Given a list of distinct integers, return every subset, including the empty one and the whole list, in any order.',
        examples: '- `[1, 2, 3]` → `[]`, `[1]`, `[2]`, `[3]`, `[1,2]`, `[1,3]`, `[2,3]`, `[1,2,3]`.\n- `[0]` → `[]` and `[0]`.\n- Edge case: an empty list has exactly one subset, the empty one.',
        brute: 'Count from 0 to 2ⁿ − 1 and read each number’s bits as “item in or out”. That works and is a fine alternative, but it hides the pattern you need for harder problems. The recursive version generalizes: add a prune or a rule and the same skeleton solves them.',
        insight: 'Each item has exactly two fates: **in** or **out**. Walk the items left to right and, for item `i`, branch twice. After the last item the path is one finished subset, so record a copy. The tree is a perfect binary tree of depth n with 2ⁿ leaves. The shared `path` is edited on the way down (choose) and restored on the way back (unchoose), so no copies are made except when you record. Record at the leaves only; every subset is a leaf here.',
        code: {
          py: `class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        res, path = [], []
        def dfs(i):
            if i == len(nums):
                res.append(path[:])          # a full set of decisions: record a copy
                return
            dfs(i + 1)                       # leave nums[i] out
            path.append(nums[i])             # choose nums[i]
            dfs(i + 1)                       # explore with it in
            path.pop()                       # unchoose
        dfs(0)
        return res`,
          js: `function subsets(nums) {
  const res = [], path = [];
  function dfs(i) {
    if (i === nums.length) { res.push([...path]); return; }   // a full set of decisions: record a copy
    dfs(i + 1);                              // leave nums[i] out
    path.push(nums[i]);                      // choose nums[i]
    dfs(i + 1);                              // explore with it in
    path.pop();                              // unchoose
  }
  dfs(0);
  return res;
}`,
          java: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(nums, 0, new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] nums, int i, List<Integer> path, List<List<Integer>> res) {
        if (i == nums.length) {
            res.add(new ArrayList<>(path));          // a full set of decisions: record a copy
            return;
        }
        dfs(nums, i + 1, path, res);                 // leave nums[i] out
        path.add(nums[i]);                           // choose nums[i]
        dfs(nums, i + 1, path, res);                 // explore with it in
        path.remove(path.size() - 1);                // unchoose
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        dfs(nums, 0, path, res);
        return res;
    }

private:
    void dfs(vector<int>& nums, int i, vector<int>& path, vector<vector<int>>& res) {
        if (i == (int)nums.size()) {
            res.push_back(path);                     // a full set of decisions: record a copy
            return;
        }
        dfs(nums, i + 1, path, res);                 // leave nums[i] out
        path.push_back(nums[i]);                     // choose nums[i]
        dfs(nums, i + 1, path, res);                 // explore with it in
        path.pop_back();                             // unchoose
    }
};`
        },
        complexity: 'O(n · 2ⁿ) time: 2ⁿ leaves, and copying a path costs up to n. O(n) extra space for the path and stack, not counting the output. Nothing can beat the output size.',
        say: '“Each element is either in or out, so I recurse over the index with two branches: skip it, or add it, recurse, and remove it again. At the end of the list I save a copy of the path. That’s 2ⁿ subsets, each copied in O(n), so O(n · 2ⁿ), and the output alone is that large. The same skeleton handles duplicates or a target sum with one extra rule.”',
        followups: [
          { q: 'Why copy the path with `path[:]` when recording?', a: 'The list is edited in place for the rest of the search. If you store the list itself, every entry in the result points to the same list, which ends up empty after the final unchoose. Copy at the moment of recording.' },
          { q: 'What changes if the input has duplicates?', a: 'Sort, switch to the start-index loop, and skip a value equal to the previous one at the same depth: `if i > start and nums[i] == nums[i-1]: continue`. That is the template on this page.' },
          { q: 'Can you do it without recursion?', a: 'Yes. Start with `[[]]` and, for each number, append a copy of every existing subset with that number added. That doubles the list each step: the same 2ⁿ answers, built layer by layer.' }
        ]
      },
      {
        lc: 46,
        restate: 'Given a list of distinct integers, return every ordering (permutation) of them, in any order.',
        examples: '- `[1, 2, 3]` → six orderings, from `[1,2,3]` to `[3,2,1]`.\n- `[0, 1]` → `[0,1]` and `[1,0]`.\n- `[1]` → `[1]`.\n- n items always give n! orderings.',
        brute: 'Generate all n^n sequences of indices and keep those with no repeats. For n = 6 that’s 46,656 sequences to discard 46,000 of. Better: never build a sequence that repeats an item in the first place.',
        insight: 'This is the same walk with a different candidate rule. At each position you may place **any item that isn’t on the path yet**, so the loop starts at 0 every time and a `used` array answers “is it free?” in O(1). The path is full when its length equals n, and that is the only time you record: internal nodes aren’t answers here. The tree has n choices at the root, n − 1 below, and so on: n! leaves. You must set `used[i]` back to false when you unchoose, or the next branch finds everything taken.',
        code: {
          py: `class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        res, path = [], []
        used = [False] * len(nums)
        def dfs():
            if len(path) == len(nums):
                res.append(path[:])          # every position is filled: record a copy
                return
            for i in range(len(nums)):
                if used[i]:
                    continue                 # already on the path
                used[i] = True               # choose nums[i]
                path.append(nums[i])
                dfs()                        # explore
                path.pop()                   # unchoose
                used[i] = False
        dfs()
        return res`,
          js: `function permute(nums) {
  const res = [], path = [], used = new Array(nums.length).fill(false);
  function dfs() {
    if (path.length === nums.length) { res.push([...path]); return; }   // every position is filled: record a copy
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;                 // already on the path
      used[i] = true;                        // choose nums[i]
      path.push(nums[i]);
      dfs();                                 // explore
      path.pop();                            // unchoose
      used[i] = false;
    }
  }
  dfs();
  return res;
}`,
          java: `class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(nums, new boolean[nums.length], new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
        if (path.size() == nums.length) {
            res.add(new ArrayList<>(path));          // every position is filled: record a copy
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;                   // already on the path
            used[i] = true;                          // choose nums[i]
            path.add(nums[i]);
            dfs(nums, used, path, res);              // explore
            path.remove(path.size() - 1);            // unchoose
            used[i] = false;
        }
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        dfs(nums, used, path, res);
        return res;
    }

private:
    void dfs(vector<int>& nums, vector<bool>& used, vector<int>& path, vector<vector<int>>& res) {
        if (path.size() == nums.size()) {
            res.push_back(path);                     // every position is filled: record a copy
            return;
        }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;                   // already on the path
            used[i] = true;                          // choose nums[i]
            path.push_back(nums[i]);
            dfs(nums, used, path, res);              // explore
            path.pop_back();                         // unchoose
            used[i] = false;
        }
    }
};`
        },
        complexity: 'O(n · n!) time: n! leaves, each copied in O(n), and the loop scans n items at each node. O(n) space for the path, `used` flags and stack, plus the output.',
        say: '“I build the permutation one position at a time. At each step I try every item that isn’t used yet: mark it used, append it, recurse, then pop it and clear the flag. When the path is as long as the input I record a copy. There are n! answers, so O(n · n!) is optimal. If the input had duplicates I’d sort and skip an item equal to its left neighbour when that neighbour isn’t on the path.”',
        followups: [
          { q: 'How does the swap version differ?', a: 'It keeps the first k positions fixed and swaps each remaining item into position k, then swaps back. No `used` array and no path list, O(1) extra besides the stack, but the order of the answers differs and it is harder to adapt to duplicates.' },
          { q: 'What if the input has duplicates?', a: 'Sort, then skip index i when `nums[i] == nums[i-1]` and `used[i-1]` is false. That makes equal values appear in left-to-right order only, so each distinct ordering is built once.' },
          { q: 'What would the answer be if you only needed the k-th permutation?', a: 'Don’t enumerate. Use the factorial number system: the first digit is `(k-1) // (n-1)!`, and so on. That is O(n²), and a counting problem rather than a search.' }
        ]
      },
      {
        lc: 39,
        restate: 'Given distinct positive integers and a target, return every unique combination that adds up to the target. A number may be used any number of times. Two combinations are the same if they use the same numbers the same number of times.',
        examples: '- `[2, 3, 6, 7]`, target 7 → `[2,2,3]` and `[7]`.\n- `[2, 3, 5]`, target 8 → `[2,2,2,2]`, `[2,3,3]` and `[3,5]`.\n- `[2]`, target 1 → no combinations: the answer is an empty list.',
        brute: 'Try every multiset of candidates up to the target size and keep those that sum to it, deduplicating at the end. That wastes work on sums that already overshoot, and the dedupe step is easy to get wrong.',
        insight: 'Use the start-index loop, so `[2,3]` and `[3,2]` can’t both appear: from `start` on you only pick the same or a later candidate. **Reuse** means the recursive call passes `i`, not `i + 1`. Track the **remaining** amount: at 0, record; below 0 there is nothing to do. Now prune: **sort the candidates**, and as soon as one is bigger than the remaining amount, `break`, because every later one is bigger still. That single line removes every overshooting branch before it’s built. The depth is at most target / smallest candidate.',
        code: {
          py: `class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        candidates.sort()                    # sorted, so one too-big value ends the loop
        res, path = [], []
        def dfs(start, remain):
            if remain == 0:
                res.append(path[:])          # the path adds up to the target: record a copy
                return
            for i in range(start, len(candidates)):
                if candidates[i] > remain:
                    break                    # prune: this and every later candidate overshoots
                path.append(candidates[i])   # choose
                dfs(i, remain - candidates[i])   # explore: i, not i + 1, so it can be reused
                path.pop()                   # unchoose
        dfs(0, target)
        return res`,
          js: `function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);          // sorted, so one too-big value ends the loop
  const res = [], path = [];
  function dfs(start, remain) {
    if (remain === 0) { res.push([...path]); return; }   // the path adds up to the target: record a copy
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) break;     // prune: this and every later candidate overshoots
      path.push(candidates[i]);              // choose
      dfs(i, remain - candidates[i]);        // explore: i, not i + 1, so it can be reused
      path.pop();                            // unchoose
    }
  }
  dfs(0, target);
  return res;
}`,
          java: `class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);                     // sorted, so one too-big value ends the loop
        List<List<Integer>> res = new ArrayList<>();
        dfs(candidates, 0, target, new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> res) {
        if (remain == 0) {
            res.add(new ArrayList<>(path));          // the path adds up to the target: record a copy
            return;
        }
        for (int i = start; i < c.length; i++) {
            if (c[i] > remain) break;                // prune: this and every later candidate overshoots
            path.add(c[i]);                          // choose
            dfs(c, i, remain - c[i], path, res);     // explore: i, not i + 1, so it can be reused
            path.remove(path.size() - 1);            // unchoose
        }
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());  // sorted, so one too-big value ends the loop
        vector<vector<int>> res;
        vector<int> path;
        dfs(candidates, 0, target, path, res);
        return res;
    }

private:
    void dfs(vector<int>& c, int start, int remain, vector<int>& path, vector<vector<int>>& res) {
        if (remain == 0) {
            res.push_back(path);                     // the path adds up to the target: record a copy
            return;
        }
        for (int i = start; i < (int)c.size(); i++) {
            if (c[i] > remain) break;                // prune: this and every later candidate overshoots
            path.push_back(c[i]);                    // choose
            dfs(c, i, remain - c[i], path, res);     // explore: i, not i + 1, so it can be reused
            path.pop_back();                         // unchoose
        }
    }
};`
        },
        complexity: 'Exponential in the worst case, bounded by the number of nodes in the tree: with t = target / smallest candidate as the depth and n candidates, at most about n^t. Sorting and the break make it far smaller in practice. O(t) stack, plus the output.',
        say: '“I sort the candidates and recurse with a start index so each combination is built in one order only. Passing `i` instead of `i + 1` allows reuse. I carry the remaining sum: at zero I record a copy, and because the list is sorted, the first candidate that exceeds the remainder lets me break out of the loop, since all later ones are larger too. The depth is at most target over the smallest number.”',
        followups: [
          { q: 'What changes if each number can be used only once and the input has duplicates?', a: 'Pass `i + 1` to the recursive call, and add the same-depth skip: `if i > start and c[i] == c[i-1]: continue`. That is Combination Sum II, also in this topic.' },
          { q: 'Why `break` and not `continue` on the overshoot check?', a: 'The list is sorted, so once one candidate is too big, all the rest are too. `break` ends the loop; `continue` would test each of them for nothing.' },
          { q: 'What if you only had to count the combinations?', a: 'Then it is dynamic programming, the coin-change count: `ways[s] += ways[s - coin]`, O(target × n). Backtracking is for when you need the combinations themselves.' }
        ]
      },
      {
        lc: 51,
        restate: 'Place n queens on an n × n chessboard so that no two attack each other: no two share a row, a column or a diagonal. Return every valid board, each as a list of n strings with `Q` for a queen and `.` for an empty square.',
        examples: '- `n = 4` → two boards: `[".Q..","...Q","Q...","..Q."]` and `["..Q.","Q...","...Q",".Q.."]`.\n- `n = 1` → `[["Q"]]`.\n- `n = 2` and `n = 3` → no solution: return an empty list.',
        brute: 'Choose any n of the n² squares and check each arrangement: C(n², n) boards, which is about 4.4 billion for n = 8. Even placing one queen per row and checking at the end means n^n = 16.7 million boards for n = 8. Check the rules as you place instead.',
        insight: 'Rows give you the structure for free: with exactly one queen per row, the decision at depth `r` is **which column** holds row `r`’s queen. That alone drops the search to n^n at worst. The three sets make it fast: a column is taken if `c` is in `cols`; squares on one **“\\” diagonal** share `r − c`; squares on one **“/” diagonal** share `r + c`. So a placement is safe if all three lookups miss, in O(1). That check is the prune: unsafe squares are never explored, which cuts the tree to a few thousand nodes for n = 8 (the 8-queens search visits about 2,000 placements). Choose by adding to all three sets and the queen list; unchoose by removing from them.',
        code: {
          py: `class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        res = []
        cols, d1, d2 = set(), set(), set()   # taken columns, and the two diagonal kinds
        queens = []                          # queens[r] is the column of row r's queen
        def dfs(r):
            if r == n:
                res.append(['.' * c + 'Q' + '.' * (n - c - 1) for c in queens])   # every row has a queen: draw the board
                return
            for c in range(n):
                if c in cols or r - c in d1 or r + c in d2:
                    continue                 # prune: attacked by an earlier queen
                cols.add(c); d1.add(r - c); d2.add(r + c)   # choose
                queens.append(c)
                dfs(r + 1)                   # explore the next row
                queens.pop()                 # unchoose
                cols.remove(c); d1.remove(r - c); d2.remove(r + c)
        dfs(0)
        return res`,
          js: `function solveNQueens(n) {
  const res = [], cols = new Set(), d1 = new Set(), d2 = new Set();   // taken columns, and the two diagonal kinds
  const queens = [];                         // queens[r] is the column of row r's queen
  function dfs(r) {
    if (r === n) {
      res.push(queens.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));   // every row has a queen: draw the board
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;   // prune: attacked by an earlier queen
      cols.add(c); d1.add(r - c); d2.add(r + c);   // choose
      queens.push(c);
      dfs(r + 1);                            // explore the next row
      queens.pop();                          // unchoose
      cols.delete(c); d1.delete(r - c); d2.delete(r + c);
    }
  }
  dfs(0);
  return res;
}`,
          java: `class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> res = new ArrayList<>();
        dfs(0, n, new int[n], new boolean[n], new boolean[2 * n], new boolean[2 * n], res);
        return res;
    }

    // queen[r] is the column of row r's queen; d1 is indexed by r - c + n, d2 by r + c
    private void dfs(int r, int n, int[] queen, boolean[] cols, boolean[] d1, boolean[] d2, List<List<String>> res) {
        if (r == n) {                                // every row has a queen: draw the board
            List<String> board = new ArrayList<>();
            for (int c : queen) {
                char[] row = new char[n];
                Arrays.fill(row, '.');
                row[c] = 'Q';
                board.add(new String(row));
            }
            res.add(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (cols[c] || d1[r - c + n] || d2[r + c]) continue;   // prune: attacked by an earlier queen
            cols[c] = d1[r - c + n] = d2[r + c] = true;            // choose
            queen[r] = c;
            dfs(r + 1, n, queen, cols, d1, d2, res);               // explore the next row
            cols[c] = d1[r - c + n] = d2[r + c] = false;           // unchoose
        }
    }
}`,
          cpp: `class Solution {
public:
    vector<vector<string>> solveNQueens(int n) {
        vector<vector<string>> res;
        vector<int> queen(n);
        vector<bool> cols(n, false), d1(2 * n, false), d2(2 * n, false);
        dfs(0, n, queen, cols, d1, d2, res);
        return res;
    }

private:
    // queen[r] is the column of row r's queen; d1 is indexed by r - c + n, d2 by r + c
    void dfs(int r, int n, vector<int>& queen, vector<bool>& cols, vector<bool>& d1, vector<bool>& d2, vector<vector<string>>& res) {
        if (r == n) {                                // every row has a queen: draw the board
            vector<string> board;
            for (int c : queen) {
                string row(n, '.');
                row[c] = 'Q';
                board.push_back(row);
            }
            res.push_back(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (cols[c] || d1[r - c + n] || d2[r + c]) continue;   // prune: attacked by an earlier queen
            cols[c] = d1[r - c + n] = d2[r + c] = true;            // choose
            queen[r] = c;
            dfs(r + 1, n, queen, cols, d1, d2, res);               // explore the next row
            cols[c] = d1[r - c + n] = d2[r + c] = false;           // unchoose
        }
    }
};`
        },
        complexity: 'No tight bound; the search tree is at most n! (one queen per row and column) and far smaller after pruning. Each placement check is O(1). O(n) space for the path, the three sets and the stack, plus the boards.',
        say: '“One queen per row, so the choice at row r is its column. I keep three sets: used columns, r − c for one diagonal direction and r + c for the other. A square is safe if all three lookups miss, so I skip unsafe squares without building anything. I add to the sets, recurse to the next row, then remove from them. When r reaches n I draw the board from the column list. It’s exponential, but the pruning keeps it small enough for n up to about 12.”',
        followups: [
          { q: 'Why are `r - c` and `r + c` the diagonal ids?', a: 'Moving one step along the “\\” diagonal adds 1 to both row and column, so `r - c` doesn’t change. Along the “/” diagonal the row goes up as the column goes down, so `r + c` stays fixed. Two squares are on one diagonal exactly when they share one of those values.' },
          { q: 'How would you only count the solutions?', a: 'Return a number instead of building boards: add up the counts from each recursive call. Using bitmasks for the three sets makes it very fast; that is the classic n = 14 benchmark.' },
          { q: 'Can you use symmetry?', a: 'Yes. A board and its mirror image are both solutions, so for a count you can place the first row’s queen in the left half only and double the result (adding the middle column separately when n is odd).' }
        ]
      }
    ],

    practice: [
      { lc: 22,
        hints: ['You are placing 2n characters, one at a time, and each is `(` or `)`. Which choices must you refuse?', 'You may add `(` while fewer than n have been opened. You may add `)` only while there are more opened than closed.', 'Those two checks prune every invalid prefix, so every full-length string you reach is already valid. Record when the length is 2n.'],
        solution: { explain: 'Backtrack on the string with two counters. Opening is allowed until n are used; closing only while it wouldn’t go below zero. Nothing invalid is ever built, so the work is proportional to the output, the Catalan number of answers, times n.', code: {
          py: `class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        res, cur = [], []
        def dfs(opened, closed):
            if len(cur) == 2 * n:
                res.append(''.join(cur))
                return
            if opened < n:
                cur.append('(')
                dfs(opened + 1, closed)
                cur.pop()
            if closed < opened:
                cur.append(')')
                dfs(opened, closed + 1)
                cur.pop()
        dfs(0, 0)
        return res`,
          js: `function generateParenthesis(n) {
  const res = [], cur = [];
  function dfs(opened, closed) {
    if (cur.length === 2 * n) { res.push(cur.join('')); return; }
    if (opened < n) {
      cur.push('(');
      dfs(opened + 1, closed);
      cur.pop();
    }
    if (closed < opened) {
      cur.push(')');
      dfs(opened, closed + 1);
      cur.pop();
    }
  }
  dfs(0, 0);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def generateParenthesis(self, n: int) -> List[str]:\n        ', js: 'function generateParenthesis(n) {\n  \n}' },
        tests: { fn: 'generateParenthesis', compare: 'unordered', cases: [
          { args: [3], out: ['((()))', '(()())', '(())()', '()(())', '()()()'] }, { args: [1], out: ['()'] }, { args: [2], out: ['(())', '()()'] },
          { args: [4], out: ['(((())))', '((()()))', '((())())', '((()))()', '(()(()))', '(()()())', '(()())()', '(())(())', '(())()()', '()((()))', '()(()())', '()(())()', '()()(())', '()()()()'] }] } },

      { lc: 78,
        hints: ['Every item has two fates: in the subset, or out of it. Walk the items left to right.', 'A recursive function of the index `i`: when `i` reaches the end, the path is one finished subset, so record a copy of it.', 'Branch twice: skip `nums[i]`, then add it, recurse, and pop it off again (the unchoose step).'],
        solution: { explain: 'Include-or-exclude recursion over the index, with one shared path that is restored after each branch. 2ⁿ leaves, each copied in O(n).', code: {
          py: `class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        res, path = [], []
        def dfs(i):
            if i == len(nums):
                res.append(path[:])
                return
            dfs(i + 1)
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
        dfs(0)
        return res`,
          js: `function subsets(nums) {
  const res = [], path = [];
  function dfs(i) {
    if (i === nums.length) { res.push([...path]); return; }
    dfs(i + 1);
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
  dfs(0);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        ', js: 'function subsets(nums) {\n  \n}' },
        tests: { fn: 'subsets', sig: { args: ['int[]'] }, compare: 'unordered', cases: [
          { args: [[1, 2, 3]], out: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]] }, { args: [[0]], out: [[], [0]] }, { args: [[]], out: [[]] }, { args: [[5, 9]], out: [[], [5], [9], [5, 9]] }] } },

      { lc: 39,
        hints: ['Carry the amount still needed. When it hits exactly 0, the path is an answer; if it would go negative, stop.', 'To avoid `[2,3]` and `[3,2]` both appearing, recurse with a start index and only pick the same or a later candidate. Reuse means passing `i`, not `i + 1`.', 'Sort the candidates first: once one is larger than the remaining amount, `break`, because all later ones are too.'],
        solution: { explain: 'Start-index backtracking over sorted candidates, passing `i` to allow reuse, with a break on overshoot. Exponential worst case, heavily pruned.', code: {
          py: `class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        candidates.sort()
        res, path = [], []
        def dfs(start, remain):
            if remain == 0:
                res.append(path[:])
                return
            for i in range(start, len(candidates)):
                if candidates[i] > remain:
                    break
                path.append(candidates[i])
                dfs(i, remain - candidates[i])
                path.pop()
        dfs(0, target)
        return res`,
          js: `function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [], path = [];
  function dfs(start, remain) {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) break;
      path.push(candidates[i]);
      dfs(i, remain - candidates[i]);
      path.pop();
    }
  }
  dfs(0, target);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:\n        ', js: 'function combinationSum(candidates, target) {\n  \n}' },
        tests: { fn: 'combinationSum', sig: { args: ['int[]', 'int'] }, compare: 'unordered', cases: [
          { args: [[2, 3, 6, 7], 7], out: [[2, 2, 3], [7]] }, { args: [[2, 3, 5], 8], out: [[2, 2, 2, 2], [2, 3, 3], [3, 5]] }, { args: [[2], 1], out: [] },
          { args: [[7, 3, 2, 6], 7], out: [[2, 2, 3], [7]] }, { args: [[3, 5, 8], 11], out: [[3, 3, 5], [3, 8]] }] } },

      { lc: 46,
        hints: ['Every item may go in any position, so unlike subsets the loop restarts from index 0 at each level.', 'Keep a `used` flag per item so you only pick items not already on the path. Record a copy when the path has all n items.', 'On the way back, pop the item and clear its used flag. If you forget the flag, later branches find everything taken.'],
        solution: { explain: 'Backtracking with a used array: n choices, then n − 1, and so on. n! answers, each copied in O(n).', code: {
          py: `class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        res, path = [], []
        used = [False] * len(nums)
        def dfs():
            if len(path) == len(nums):
                res.append(path[:])
                return
            for i in range(len(nums)):
                if used[i]:
                    continue
                used[i] = True
                path.append(nums[i])
                dfs()
                path.pop()
                used[i] = False
        dfs()
        return res`,
          js: `function permute(nums) {
  const res = [], path = [], used = new Array(nums.length).fill(false);
  function dfs() {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      dfs();
      path.pop();
      used[i] = false;
    }
  }
  dfs();
  return res;
}` } },
        starter: { py: 'class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        ', js: 'function permute(nums) {\n  \n}' },
        tests: { fn: 'permute', sig: { args: ['int[]'] }, compare: 'unordered', cases: [
          { args: [[1, 2, 3]], out: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] }, { args: [[0, 1]], out: [[0, 1], [1, 0]] }, { args: [[1]], out: [[1]] },
          { args: [[-1, 0, 1]], out: [[-1, 0, 1], [-1, 1, 0], [0, -1, 1], [0, 1, -1], [1, -1, 0], [1, 0, -1]] }] } },

      { lc: 90,
        hints: ['It is Subsets, but equal values would produce the same subset twice. Sort first so equal values are neighbours.', 'Use the start-index loop and record at every node. At one depth, never try a value equal to the one you just tried.', 'The test is `i > start and nums[i] == nums[i - 1]`. It must be `start`, not `0`, or you also block `[2, 2]`.'],
        solution: { explain: 'Sort, then the start-index loop with the same-depth skip. Each distinct subset is generated once, so there’s no set of tuples to dedupe afterwards. O(n · 2ⁿ).', code: {
          py: `class Solution:
    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res, path = [], []
        def dfs(start):
            res.append(path[:])
            for i in range(start, len(nums)):
                if i > start and nums[i] == nums[i - 1]:
                    continue
                path.append(nums[i])
                dfs(i + 1)
                path.pop()
        dfs(0)
        return res`,
          js: `function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b);
  const res = [], path = [];
  function dfs(start) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(0);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:\n        ', js: 'function subsetsWithDup(nums) {\n  \n}' },
        tests: { fn: 'subsetsWithDup', compare: 'unordered', cases: [
          { args: [[1, 2, 2]], out: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] }, { args: [[0]], out: [[], [0]] }, { args: [[2, 1, 2]], out: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] },
          { args: [[4, 4, 4, 1, 4]], out: [[], [1], [1, 4], [1, 4, 4], [1, 4, 4, 4], [1, 4, 4, 4, 4], [4], [4, 4], [4, 4, 4], [4, 4, 4, 4]] }] } },

      { lc: 40,
        hints: ['Each number can be used once, so recurse with `i + 1`. The input has duplicates, so the same combination could appear twice.', 'Sort. Then at one depth skip a value equal to the previous one: `i > start and c[i] == c[i - 1]`.', 'Also prune with the sorted order: when `c[i] > remain`, `break`.'],
        solution: { explain: 'Combination Sum with `i + 1` for single use and the same-depth skip for duplicates. The sorted break cuts overshooting branches. Exponential worst case, small in practice.', code: {
          py: `class Solution:
    def combinationSum2(self, candidates: List[int], target: int) -> List[List[int]]:
        candidates.sort()
        res, path = [], []
        def dfs(start, remain):
            if remain == 0:
                res.append(path[:])
                return
            for i in range(start, len(candidates)):
                if i > start and candidates[i] == candidates[i - 1]:
                    continue
                if candidates[i] > remain:
                    break
                path.append(candidates[i])
                dfs(i + 1, remain - candidates[i])
                path.pop()
        dfs(0, target)
        return res`,
          js: `function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [], path = [];
  function dfs(start, remain) {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      if (candidates[i] > remain) break;
      path.push(candidates[i]);
      dfs(i + 1, remain - candidates[i]);
      path.pop();
    }
  }
  dfs(0, target);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def combinationSum2(self, candidates: List[int], target: int) -> List[List[int]]:\n        ', js: 'function combinationSum2(candidates, target) {\n  \n}' },
        tests: { fn: 'combinationSum2', compare: 'unordered', cases: [
          { args: [[10, 1, 2, 7, 6, 1, 5], 8], out: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]] }, { args: [[2, 5, 2, 1, 2], 5], out: [[1, 2, 2], [5]] }, { args: [[1], 2], out: [] }, { args: [[1, 1, 1], 2], out: [[1, 1]] }] } },

      { lc: 79,
        hints: ['Try every cell as the start. From a cell that matches the first letter, you need the rest of the word from one of its four neighbours.', 'A cell can’t be reused in one trail. Instead of a visited set, overwrite the cell with a marker when you step on it and restore it when you leave.', 'Stop immediately when you leave the board or the letter doesn’t match. Return true as soon as the index passes the last letter.'],
        solution: { explain: 'DFS from each cell with the board itself as the visited marker (choose = overwrite, unchoose = restore). Worst case O(cells × 3^L) for a word of length L; mismatches prune most of it.', code: {
          py: `class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        rows, cols = len(board), len(board[0])
        def dfs(r, c, k):
            if k == len(word):
                return True
            if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[k]:
                return False
            saved = board[r][c]
            board[r][c] = '#'
            found = dfs(r + 1, c, k + 1) or dfs(r - 1, c, k + 1) or dfs(r, c + 1, k + 1) or dfs(r, c - 1, k + 1)
            board[r][c] = saved
            return found
        return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))`,
          js: `function exist(board, word) {
  const rows = board.length, cols = board[0].length;
  function dfs(r, c, k) {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) return false;
    const saved = board[r][c];
    board[r][c] = '#';
    const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = saved;
    return found;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  }
  return false;
}` } },
        starter: { py: 'class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        ', js: 'function exist(board, word) {\n  \n}' },
        tests: { fn: 'exist', cases: [
          { args: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCCED'], out: true },
          { args: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'SEE'], out: true },
          { args: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCB'], out: false },
          { args: [[['a']], 'a'], out: true }, { args: [[['a', 'b']], 'ba'], out: true }, { args: [[['a', 'a']], 'aaa'], out: false }] } },

      { lc: 131,
        hints: ['A partition is a series of cut points. At position `start`, you choose where the next piece ends.', 'Try each end position; keep the piece `s[start:end]` only if it is a palindrome, then recurse from `end`.', 'When `start` reaches the end of the string, the pieces on the path are a complete partition: record a copy.'],
        solution: { explain: 'Choose the next piece (only palindromes), recurse on the rest, pop it. Rejecting non-palindromes at the moment of choosing is the prune. O(n · 2ⁿ) worst case (a string of one repeated letter).', code: {
          py: `class Solution:
    def partition(self, s: str) -> List[List[str]]:
        res, path = [], []
        def dfs(start):
            if start == len(s):
                res.append(path[:])
                return
            for end in range(start + 1, len(s) + 1):
                piece = s[start:end]
                if piece != piece[::-1]:
                    continue
                path.append(piece)
                dfs(end)
                path.pop()
        dfs(0)
        return res`,
          js: `function partition(s) {
  const res = [], path = [];
  const isPal = (t) => t === [...t].reverse().join('');
  function dfs(start) {
    if (start === s.length) { res.push([...path]); return; }
    for (let end = start + 1; end <= s.length; end++) {
      const piece = s.slice(start, end);
      if (!isPal(piece)) continue;
      path.push(piece);
      dfs(end);
      path.pop();
    }
  }
  dfs(0);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def partition(self, s: str) -> List[List[str]]:\n        ', js: 'function partition(s) {\n  \n}' },
        tests: { fn: 'partition', compare: 'unordered', cases: [
          { args: ['aab'], out: [['a', 'a', 'b'], ['aa', 'b']] }, { args: ['a'], out: [['a']] }, { args: ['aba'], out: [['a', 'b', 'a'], ['aba']] },
          { args: ['aaa'], out: [['a', 'a', 'a'], ['a', 'aa'], ['aa', 'a'], ['aaa']] }] } },

      { lc: 17,
        hints: ['Each digit stands for a few letters. Choose one letter per digit, in order.', 'A recursive function of the digit position: pick each of that digit’s letters, append, recurse, pop.', 'When the position reaches the end, the path is one full string. An empty input must return an empty list, not `[""]`.'],
        solution: { explain: 'Backtrack over the digit positions, trying each mapped letter. The number of answers is the product of the letter counts (3 or 4 per digit), so it’s optimal for listing: O(4ⁿ · n).', code: {
          py: `class Solution:
    def letterCombinations(self, digits: str) -> List[str]:
        if not digits:
            return []
        keys = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}
        res, path = [], []
        def dfs(i):
            if i == len(digits):
                res.append(''.join(path))
                return
            for ch in keys[digits[i]]:
                path.append(ch)
                dfs(i + 1)
                path.pop()
        dfs(0)
        return res`,
          js: `function letterCombinations(digits) {
  if (!digits) return [];
  const keys = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  const res = [], path = [];
  function dfs(i) {
    if (i === digits.length) { res.push(path.join('')); return; }
    for (const ch of keys[digits[i]]) {
      path.push(ch);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(0);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def letterCombinations(self, digits: str) -> List[str]:\n        ', js: 'function letterCombinations(digits) {\n  \n}' },
        tests: { fn: 'letterCombinations', compare: 'unordered', cases: [
          { args: ['23'], out: ['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf'] }, { args: [''], out: [] }, { args: ['2'], out: ['a', 'b', 'c'] },
          { args: ['79'], out: ['pw', 'px', 'py', 'pz', 'qw', 'qx', 'qy', 'qz', 'rw', 'rx', 'ry', 'rz', 'sw', 'sx', 'sy', 'sz'] }] } },

      { lc: 51,
        hints: ['Put exactly one queen in each row, so the only decision at row `r` is which column.', 'A square is unsafe if its column is taken, or if an earlier queen shares its `r - c` or its `r + c` (the two diagonal directions). Keep three sets for O(1) checks.', 'Choose by adding to the sets and queen list, recurse to row `r + 1`, then remove them. At `r == n`, turn the column list into strings.'],
        solution: { explain: 'Row-by-row search with three sets, which makes each safety check O(1) and prunes attacked squares before exploring them. Exponential, but only a few thousand nodes for n = 8.', code: {
          py: `class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        res = []
        cols, d1, d2 = set(), set(), set()
        queens = []
        def dfs(r):
            if r == n:
                res.append(['.' * c + 'Q' + '.' * (n - c - 1) for c in queens])
                return
            for c in range(n):
                if c in cols or r - c in d1 or r + c in d2:
                    continue
                cols.add(c); d1.add(r - c); d2.add(r + c)
                queens.append(c)
                dfs(r + 1)
                queens.pop()
                cols.remove(c); d1.remove(r - c); d2.remove(r + c)
        dfs(0)
        return res`,
          js: `function solveNQueens(n) {
  const res = [], cols = new Set(), d1 = new Set(), d2 = new Set(), queens = [];
  function dfs(r) {
    if (r === n) {
      res.push(queens.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
      cols.add(c); d1.add(r - c); d2.add(r + c);
      queens.push(c);
      dfs(r + 1);
      queens.pop();
      cols.delete(c); d1.delete(r - c); d2.delete(r + c);
    }
  }
  dfs(0);
  return res;
}` } },
        starter: { py: 'class Solution:\n    def solveNQueens(self, n: int) -> List[List[str]]:\n        ', js: 'function solveNQueens(n) {\n  \n}' },
        tests: { fn: 'solveNQueens', sig: { args: ['int'] }, compare: 'unordered', cases: [
          { args: [4], out: [['.Q..', '...Q', 'Q...', '..Q.'], ['..Q.', 'Q...', '...Q', '.Q..']] }, { args: [1], out: [['Q']] }, { args: [2], out: [] }, { args: [3], out: [] }] } }
    ],

    mistakes: [
      '**Recording the path itself, not a copy.** `res.append(path)` stores a reference, and since the same list is edited for the rest of the search, every answer ends up empty (or identical). Use `path[:]`, `[...path]`, `new ArrayList<>(path)` or a plain copy in C++, at the moment you record.',
      '**Forgetting to unchoose.** If you push but never pop (or set `used[i] = True` but never reset it), the state leaks into the next branch and answers go missing. Put the undo directly under the recursive call, mirroring the choose line.',
      '**Unchoosing the wrong thing.** The undo must reverse *exactly* what choose did: every set you added to, every counter you bumped, the marker you wrote into the grid. With three sets in N-Queens, all three need their removal.',
      '**`i > 0` where `i > start` is needed (and the reverse).** The same-depth skip must compare against the previous sibling, so the guard is `i > start`. With `i > 0` you also forbid using the second 2 below the first and lose `[2, 2]`.',
      '**Deduping without sorting.** The skip rule only works when equal values are neighbours. If you forget to sort first, you still get duplicates, and only some of the time.',
      '**Pruning too late, or wrongly.** Testing the rule after you recurse (or after the answer is complete) gives the right output but throws away the speed. And a prune that’s too eager silently deletes valid answers: check it against a tiny case where you can list every answer by hand.',
      '**Using `break` where `continue` belongs (or the opposite).** `break` is correct only when every later candidate is also invalid, which needs a sorted list. On unsorted input it drops answers. For the dedupe skip use `continue`.',
      '**Language gotchas.** *Python:* a recursive helper that rebinds a counter needs `nonlocal`; mutating a list needs nothing. *JavaScript:* arrays are references, so `res.push(path)` has the copy bug. `.sort()` with no comparator orders numbers as text (`10` before `2`). *Java:* `path.remove(i)` on a `List<Integer>` removes by **index**; to remove the last item write `path.remove(path.size() - 1)`. *C++:* `vector<bool>` is a packed special type, so pass it by reference and don’t take the address of an element.'
    ],

    quiz: [
      { kind: 'concept', q: 'What are the three beats of every backtracking step, in order?',
        choices: ['Choose, explore, unchoose', 'Sort, search, return', 'Split, solve, merge', 'Push, pop, peek'], answer: 0,
        explain: 'Add one option to the path, recurse to extend it, then undo the option so the next one starts from the same state. Without the undo, one shared path can’t serve every branch.' },
      { kind: 'bug', q: 'This function returns `[[], [], [], …]` (every subset is empty). What is the bug?',
        code: `def subsets(nums):
    res, path = [], []
    def dfs(i):
        if i == len(nums):
            res.append(path)
            return
        dfs(i + 1)
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
    dfs(0)
    return res`,
        choices: ['`res.append(path)` stores the shared list, not a copy; use `path[:]`', 'The base case should be `i == len(nums) - 1`', 'There should be no `path.pop()`', 'The recursion needs a memo'], answer: 0,
        explain: 'Every entry points at the same list, which is empty again once all the unchoose steps have run. Copy the path at the moment you record it.' },
      { kind: 'complexity', q: 'How many answers does the full set of permutations of n distinct items contain?',
        choices: ['n!', '2ⁿ', 'n²', 'nⁿ'], answer: 0,
        explain: 'n choices for the first position, n − 1 for the second, and so on: n!. Subsets are 2ⁿ, because each item is in or out.' },
      { kind: 'complexity', q: 'What is the time complexity of listing all subsets of n items, counting the cost of copying each one?',
        choices: ['O(n · 2ⁿ)', 'O(2ⁿ)', 'O(n²)', 'O(n!)'], answer: 0,
        explain: 'There are 2ⁿ subsets, and building each result list costs up to n. The stack is only O(n) deep, but the output is exponential, so no algorithm can be polynomial.' },
      { kind: 'concept', q: 'In Subsets II (the input has duplicates), the skip condition inside the loop is…',
        choices: ['`i > start and nums[i] == nums[i - 1]`, after sorting', '`i > 0 and nums[i] == nums[i - 1]`, after sorting', '`nums[i] in path`, without sorting', '`i == start`, after sorting'], answer: 0,
        explain: 'Skip a value equal to the previous sibling at this depth. With `i > 0`, the second 2 could never extend a path that holds the first 2, and `[2, 2]` would be lost. Sorting is needed so equal values are adjacent.' },
      { kind: 'concept', q: 'In N-Queens, which pair identifies the two diagonals a square (r, c) sits on?',
        choices: ['`r - c` and `r + c`', '`r` and `c`', '`r * c` and `r / c`', '`r + 1` and `c + 1`'], answer: 0,
        explain: 'Squares on one diagonal share `r - c`; squares on the other share `r + c`. Together with the column set, three O(1) lookups say whether a placement is safe.' },
      { kind: 'bug', q: 'This permutation generator returns far too few answers. What is missing?',
        code: `def dfs():
    if len(path) == len(nums):
        res.append(path[:]); return
    for i in range(len(nums)):
        if used[i]: continue
        used[i] = True
        path.append(nums[i])
        dfs()
        path.pop()`,
        choices: ['`used[i] = False` after the `pop()`', 'A sort of `nums`', 'A start index in the loop', 'A second base case'], answer: 0,
        explain: 'The used flag was set but never cleared, so after the first branch every item looks taken. The undo must mirror the choose step exactly.' },
      { kind: 'pattern', q: 'Which question calls for backtracking rather than dynamic programming?',
        choices: ['Return every way to split a string into palindromes', 'Count the ways to climb n stairs', 'Find the fewest coins that make an amount', 'Find the length of the longest increasing subsequence'], answer: 0,
        explain: 'You need the partitions themselves, which are exponentially many. The other three ask for a count or an optimum over repeated subproblems, which memoization or DP does in polynomial time.' },
      { kind: 'concept', q: 'Why does Combination Sum (reuse allowed) recurse with `i` but Combination Sum II (single use) with `i + 1`?',
        choices: ['`i` lets the same candidate be picked again at the next level; `i + 1` forces a later one', '`i` is faster', '`i + 1` allows reuse', 'They behave the same'], answer: 0,
        explain: 'The next call may start at the index it receives. Passing `i` keeps the current candidate available; `i + 1` moves past it, so each element is used at most once.' },
      { kind: 'concept', q: 'Which of these are real **pruning** checks? Pick every one that applies.',
        choices: ['In a sorted sum problem, `break` once a candidate exceeds the remaining amount', 'Skip a queen placement whose column is already taken', 'Build the whole answer, then discard it if it is invalid', 'Stop a word-search trail when the cell’s letter doesn’t match the next letter'], answer: [0, 1, 3],
        explain: 'A prune stops exploring a node that cannot lead to an answer, before any more work is done below it. Building the full answer and checking at the end throws the saving away.' }
    ],

    flashcards: [
      { id: 'three-beats', front: 'The three beats of backtracking?', back: '**Choose** (add an option to the path), **explore** (recurse), **unchoose** (undo it). The undo restores the state so the next option starts clean.' },
      { id: 'decision-tree', front: 'What is the decision tree?', back: 'A node is a partial answer (the path), an edge is one choice, a leaf is a finished answer or a dead end. Backtracking is a depth-first walk of it, with one shared path edited as you go.' },
      { id: 'copy-path', front: 'Why copy the path when you record an answer?', back: 'The same list is edited for the rest of the search. Recording the list itself leaves every answer pointing to one list that ends up empty. Use `path[:]` (or the language’s copy).' },
      { id: 'subsets-size', front: 'How many subsets of n items? How many permutations?', back: 'Subsets: **2ⁿ** (each item in or out), so O(n · 2ⁿ) with copying. Permutations: **n!**, so O(n · n!).' },
      { id: 'start-index', front: 'What does the start index do?', back: 'It makes the answers combinations or subsets instead of orderings: from `start` you may only pick items at or after it, so `[2,3]` is built but `[3,2]` isn’t. Pass `i + 1` for use-once, `i` to allow reuse.' },
      { id: 'dedupe-rule', front: 'The dedupe-at-the-same-depth rule?', back: 'Sort first, then `if i > start and nums[i] == nums[i-1]: continue`. It must be `i > start` (not `i > 0`) so an equal value can still join the path below its twin. For permutations: skip when the twin isn’t `used`.' },
      { id: 'perm-used', front: 'How do permutations differ from subsets in code?', back: 'The loop restarts at 0 each level with a **used** array (or swaps in place), and you record only when the path has all n items. The choose / explore / unchoose beat is the same.' },
      { id: 'prune-def', front: 'What is a prune, and what makes a good one?', back: 'A check that proves no answer lies below the current node, so you skip the whole subtree. The earlier and cheaper (O(1)) the check, the better. It must never remove a valid answer.' },
      { id: 'sorted-break', front: 'Sorted-candidates prune in a sum problem?', back: 'After sorting, `if candidates[i] > remain: break`. Every later candidate is larger too, so ending the loop (not just skipping) is safe.' },
      { id: 'queens-diag', front: 'N-Queens: how do you test safety in O(1)?', back: 'One queen per row, so choose a column. Keep sets for columns, `r - c` (one diagonal direction) and `r + c` (the other). Safe if all three miss. Add to all three to choose, remove from all three to unchoose.' },
      { id: 'grid-visited', front: 'Visited tracking in a grid backtrack (word search)?', back: 'Overwrite the cell with a marker (like `#`) when you choose it and restore the letter on unchoose, so the board is its own visited set. Check bounds and the letter match first: that is the prune.' },
      { id: 'bt-vs-dp', front: 'Backtracking or DP?', back: 'Backtracking when you must **list** the answers. DP or memoization when you only need a count or a best value and the same states repeat. Identical subtrees in your decision tree are the sign you want a cache.' }
    ],

    deeper: [
      { title: 'NeetCode: Backtracking course', url: 'https://neetcode.io/roadmap', time: 'about 90 min', note: 'The standard problem order for this topic (subsets, combinations, permutations, grids, N-Queens). Use it after you can write the template from memory.' },
      { title: 'Backtracking (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Backtracking', time: 'about 10 min', note: 'The general idea, the vocabulary (partial candidate, pruning) and the classic puzzles, with pseudocode.' },
      { title: 'Eight queens puzzle (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Eight_queens_puzzle', time: 'about 15 min', note: 'Solution counts for each board size and the history of the problem. Good for checking your N-Queens output.' },
      { title: 'itertools: permutations and combinations (Python docs)', url: 'https://docs.python.org/3/library/itertools.html', time: 'about 10 min', note: 'The library versions of what you write by hand here. Handy for testing your own implementation, but expect to write the recursion in an interview.' },
      { title: 'Dancing Links (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Dancing_Links', time: 'about 15 min', note: 'Knuth’s technique for exact-cover search (Sudoku and friends): backtracking with an extremely cheap undo. For curiosity after this page.' }
    ],

    detective: [
      { id: 'dial-lock', decoys: ['recursion', 'math', 'sorting'],
        statement: 'A puzzle-room designer is building a safe with five buttons labelled with five different symbols. Opening it requires pressing every button exactly once, in the right order. A new staff member must write down every possible press order so the designer can pick one at random, and the list has to be complete, with no order missing and none repeated. Given the five symbols, how does the staff member produce that list without sitting down and writing 120 sequences by hand?',
        why: 'The answer is built one position at a time, and every finished sequence is wanted, not a count. Pick an unused button, press on, and when the line is stuck or finished take the last button back and try another. The “every order, none repeated” phrasing plus a tiny input (five) is the cue for a choose, explore, undo search.' },
      { id: 'talk-lineups', decoys: ['knapsack', 'greedy', 'dp-1d'],
        statement: 'A conference has talks of different lengths in minutes, and the organizer is willing to book a morning slot of exactly 180 minutes. A talk may only be given once, and the order within the morning does not matter. The organizer wants to see every different set of talks that fills the slot exactly, to choose their favourite. Given the list of talk lengths, which could include several talks of the same length, how should the planning script produce those sets so that no set appears twice?',
        why: 'The organizer needs the sets themselves, not just whether one exists or how many there are, so a table won’t do. Build a set talk by talk, abandon it as soon as the minutes overshoot, and undo the last talk to try another. The repeated lengths demand a rule so identical-looking sets aren’t listed twice.' },
      { id: 'ranger-towers', decoys: ['matrix', 'graphs', 'recursion'],
        statement: 'A national park is laid out as a square grid of n by n plots. The rangers want to build exactly n watchtowers, one per plot. A tower sees along its entire row, its entire column and both diagonals, and no tower may stand where another can see it. For a given n, they want every possible layout that works, or the news that none does. How should the planner search for the layouts?',
        why: 'There is one tower per row, so the decision at each row is a column. A tower is only placed if no earlier one can see that plot, and if a row has no safe plot the planner removes the previous tower and shifts it. Listing all valid layouts under conflict rules, with early rejection, is a search that builds, tests and undoes.' }
    ]
  });
})();
