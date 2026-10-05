/* Offer Ready: Stacks lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py in each language it's written in. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'stacks',

    hook: 'A stack gives you one thing: the most recent item, instantly. That sounds small, but it’s exactly what nested structure needs: brackets, undo history, expressions, and the call stack that runs every recursive function. Matching brackets (LeetCode 20) is one of the most-asked warm-ups in phone screens, and NeetCode 150 gives stacks their own section. It’s also the doorway to the monotonic stack, one of the highest-value tricks after this.',

    cues: [
      'Things must be undone, closed or resolved in the **reverse** of the order they were opened: brackets, tags, nested calls, “go back”.',
      'The newest unresolved item is the one that matters next: the latest opener, the latest number, the latest direction.',
      'The input is an **expression** or a nested string to evaluate or decode: postfix, `3[a2[c]]`, a file path with `..`.',
      'A rule like “a new item can cancel the previous one”: adjacent duplicates, backspace, colliding asteroids.',
      'You need the minimum or maximum of “everything so far” while pushing and popping: carry it along with each entry.',
      'You’re asked to do DFS or recursion **without** recursion: the explicit stack is the call stack.'
    ],

    intuition: [
      'Picture a stack of plates in a canteen. You put a plate on top and you take a plate from the top. You never reach into the middle. The plate you added last is the first one out: **last in, first out**, or LIFO.',
      'That restriction is the point. Whenever the problem is “resolve the most recent thing before anything older”, the stack hands you exactly that thing in O(1), with no searching. Take `([]{})`. Each closer must pair with the **latest unclosed opener**, which is the one on top. When it matches, pop it and the next-latest opener is exposed. A stack is a way to remember, in order, what is still waiting.',
      'The whole toolkit is three operations, each O(1): `push` (add on top), `pop` (remove and return the top), and `peek` (read the top without removing). In Python use a `list` (`append`, `pop`, `[-1]`); in JavaScript an array (`push`, `pop`, `at(-1)`); in Java prefer `ArrayDeque` (`push`, `pop`, `peek`) over the legacy `Stack` class; in C++ use `std::stack` (`push`, `top`, `pop`; note that `pop` returns nothing).',
      'The recipe for most stack problems:\n\n1. Walk the input once, left to right.\n2. Push what is **waiting** for something to come later.\n3. When a new item can resolve the top (match it, cancel it, combine with it), pop and handle it.\n4. At the end, whatever is left on the stack is unresolved. That is often the answer, or the reason it’s invalid.',
      'One idea repays the time: **the call stack is a stack**. Every recursive function you’ve written pushes a frame (arguments, local variables, where to resume) and pops it on return. So any recursion can become a loop with your own stack, which matters when the depth would overflow, and when you need control over the order of work.'
    ].join('\n\n'),

    viz: 'stack-queue',

    template: {
      title: 'Matching brackets: push what waits, pop when something resolves it',
      note: 'To reuse it, change three things and keep the skeleton: **what you push** (here the opener itself), **what resolves the top** (here a closer of the matching kind), and **what a leftover means** (here an invalid string). Evaluating postfix, cancelling duplicates and decoding nested strings all share this shape. The template assumes the string holds only brackets; for other characters, skip them before the checks.',
      code: {
        py: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}   #> Each closer and the opener it needs
    stack = []                               #> Openers still waiting for their closer, newest on top
    for ch in s:                             #@read > 1. Read the next character
        if ch not in pairs:
            stack.append(ch)                 #@push > 2. An opener: push it and wait
        else:
            if not stack or stack[-1] != pairs[ch]:   #@check > 3. A closer must match the top of the stack
                return False                 #@fail > 4a. Wrong opener on top, or nothing waiting: invalid
            stack.pop()                      #@match > 4b. They pair up: pop the opener
    return not stack                         #@end > 5. Openers left over are never closed`,
        js: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };   //> Each closer and the opener it needs
  const stack = [];                                  //> Openers still waiting for their closer, newest on top
  for (const ch of s) {                              //@read > 1. Read the next character
    if (!(ch in pairs)) {
      stack.push(ch);                                //@push > 2. An opener: push it and wait
    } else {
      if (stack.length === 0 || stack[stack.length - 1] !== pairs[ch]) {   //@check > 3. A closer must match the top of the stack
        return false;                                //@fail > 4a. Wrong opener on top, or nothing waiting: invalid
      }
      stack.pop();                                   //@match > 4b. They pair up: pop the opener
    }
  }
  return stack.length === 0;                         //@end > 5. Openers left over are never closed
}`,
        java: `class Solution {
    public boolean isValid(String s) {
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');   //> Each closer and the opener it needs
        Deque<Character> stack = new ArrayDeque<>();            //> Openers still waiting for their closer, newest on top
        for (char ch : s.toCharArray()) {                       //@read > 1. Read the next character
            if (!pairs.containsKey(ch)) {
                stack.push(ch);                                 //@push > 2. An opener: push it and wait
            } else {
                if (stack.isEmpty() || stack.peek() != pairs.get(ch).charValue()) {   //@check > 3. A closer must match the top of the stack
                    return false;                               //@fail > 4a. Wrong opener on top, or nothing waiting: invalid
                }
                stack.pop();                                    //@match > 4b. They pair up: pop the opener
            }
        }
        return stack.isEmpty();                                 //@end > 5. Openers left over are never closed
    }
}`,
        cpp: `class Solution {
public:
    bool isValid(string s) {
        unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};   //> Each closer and the opener it needs
        stack<char> st;                                         //> Openers still waiting for their closer, newest on top
        for (char ch : s) {                                     //@read > 1. Read the next character
            if (!pairs.count(ch)) {
                st.push(ch);                                    //@push > 2. An opener: push it and wait
            } else {
                if (st.empty() || st.top() != pairs[ch]) {      //@check > 3. A closer must match the top of the stack
                    return false;                               //@fail > 4a. Wrong opener on top, or nothing waiting: invalid
                }
                st.pop();                                       //@match > 4b. They pair up: pop the opener
            }
        }
        return st.empty();                                      //@end > 5. Openers left over are never closed
    }
};`
      },
      tests: { fn: { py: 'is_valid', default: 'isValid' }, sig: { args: ['str'] }, cases: [
        { args: ['()'], out: true }, { args: ['()[]{}'], out: true }, { args: ['(]'], out: false }, { args: [''], out: true },
        { args: ['([{}])'], out: true }, { args: ['([)]'], out: false }, { args: ['(('], out: false }, { args: ['))'], out: false }, { args: ['{[]}'], out: true }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(n)',
      why: 'Every character is read once, and every push or pop is O(1). An item can be popped only after it was pushed, so across the whole run there are at most n pushes and n pops: O(n) time. In the worst case nothing gets popped until the end (a string of only openers), so the stack holds up to n items: O(n) space. A stack that only ever holds one kind of thing can sometimes shrink to a counter, as in the variation below.',
      trap: 'Don’t call a stack operation “O(n)” because you’re inside a loop with a `while` that pops. Count total pops: each item is popped at most once, so the loop and the pops together are O(n). Also be careful with **empty** stacks: `pop` or `peek` on nothing is a crash in most languages (`IndexError`, a thrown exception, undefined behavior in C++), so check emptiness before you look at the top.'
    },

    variations: [
      {
        name: 'Stack of (value, state) pairs',
        body: 'Sometimes the item alone isn’t enough, so push a small record: the value **and** whatever you’d otherwise have to rescan to find. Min Stack stores each value with the minimum at or below it (worked below). Here the extra field is a run length. In Remove All Adjacent Duplicates II (1209), delete any group of `k` equal neighbours, repeatedly. Keep `[char, count]` on the stack: a matching character bumps the top’s count, and when the count reaches `k` the whole entry pops. Each character is handled once, so it’s O(n).',
        code: {
          py: `def remove_duplicates_k(s, k):
    stack = []                              # [character, how many in a row]
    for ch in s:
        if stack and stack[-1][0] == ch:
            stack[-1][1] += 1               #> Same as the top: extend its run
            if stack[-1][1] == k:
                stack.pop()                 #> A full run of k vanishes
        else:
            stack.append([ch, 1])
    return ''.join(c * n for c, n in stack)`,
          js: `function removeDuplicatesK(s, k) {
  const stack = [];                         // [character, how many in a row]
  for (const ch of s) {
    const top = stack[stack.length - 1];
    if (top && top[0] === ch) {
      top[1]++;                             //> Same as the top: extend its run
      if (top[1] === k) stack.pop();        //> A full run of k vanishes
    } else {
      stack.push([ch, 1]);
    }
  }
  return stack.map(([c, n]) => c.repeat(n)).join('');
}`
        },
        tests: { fn: { py: 'remove_duplicates_k', default: 'removeDuplicatesK' }, cases: [
          { args: ['deeedbbcccbdaa', 3], out: 'aa' }, { args: ['abcd', 2], out: 'abcd' }, { args: ['pbbcggttciiippooaais', 2], out: 'ps' }, { args: ['aaa', 3], out: '' }, { args: ['', 2], out: '' }] }
      },
      {
        name: 'Expressions: numbers on the stack, a pending operator',
        body: 'Postfix (worked below) is the cleanest case: operands wait, an operator takes the top two. For ordinary infix with `+ - * /` and no brackets (Basic Calculator II, 227), remember the **previous operator** and apply it when the next one arrives. `+` and `-` just push the number (negated for `-`), because they can wait. `*` and `/` fire immediately against the top, because they bind tighter. At the end, the answer is the sum of the stack. Brackets (Basic Calculator, 224) add a second idea: push the running state when `(` opens and restore it at `)`.',
        code: {
          py: `def calculate(s):
    stack, num, op = [], 0, '+'
    for i, ch in enumerate(s):
        if ch.isdigit():
            num = num * 10 + int(ch)
        if (not ch.isdigit() and ch != ' ') or i == len(s) - 1:
            if op == '+':
                stack.append(num)              #> Low precedence: park it, sum at the end
            elif op == '-':
                stack.append(-num)
            elif op == '*':
                stack.append(stack.pop() * num)   #> High precedence: settle it now
            else:
                stack.append(int(stack.pop() / num))   # division truncates toward zero
            op, num = ch, 0
    return sum(stack)`,
          js: `function calculate(s) {
  const stack = [];
  let num = 0, op = '+';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch >= '0' && ch <= '9') num = num * 10 + (ch.charCodeAt(0) - 48);
    if ((!(ch >= '0' && ch <= '9') && ch !== ' ') || i === s.length - 1) {
      if (op === '+') stack.push(num);            //> Low precedence: park it, sum at the end
      else if (op === '-') stack.push(-num);
      else if (op === '*') stack.push(stack.pop() * num);   //> High precedence: settle it now
      else stack.push(Math.trunc(stack.pop() / num));       // division truncates toward zero
      op = ch; num = 0;
    }
  }
  return stack.reduce((a, b) => a + b, 0);
}`
        },
        tests: { fn: 'calculate', cases: [
          { args: ['3+2*2'], out: 7 }, { args: [' 3/2 '], out: 1 }, { args: [' 3+5 / 2 '], out: 5 }, { args: ['42'], out: 42 }, { args: ['14-3/2'], out: 13 }, { args: ['2*3*4-10'], out: 14 }] }
      },
      {
        name: 'Recursion without recursion: an explicit stack',
        body: 'Iterative DFS is the call stack made visible: push the start, then repeatedly pop a node, mark it, and push its unvisited neighbours. Mark a node **when you push it** (as below) so it’s never pushed twice. When you need to do work *after* a node’s children finish (post-order), push `(node, state)` entries, where the state says whether you’re entering or leaving. That’s the same “stack of pairs” idea. Use this when recursion could run too deep (for Python’s default limit, roughly 1,000 frames) or when you want to control the order of work.',
        code: {
          py: `def reachable(graph, start):
    seen, stack = {start}, [start]
    while stack:
        node = stack.pop()                  #> The most recently discovered node goes next
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)               #> Mark on push, so nothing is pushed twice
                stack.append(nxt)
    return sorted(seen)`,
          js: `function reachable(graph, start) {
  const seen = new Set([start]), stack = [start];
  while (stack.length) {
    const node = stack.pop();               //> The most recently discovered node goes next
    for (const nxt of graph[node]) {
      if (!seen.has(nxt)) {
        seen.add(nxt);                      //> Mark on push, so nothing is pushed twice
        stack.push(nxt);
      }
    }
  }
  return [...seen].sort((a, b) => a - b);
}`
        },
        tests: { fn: 'reachable', cases: [
          { args: [[[1, 2], [3], [3], [], [0]], 0], out: [0, 1, 2, 3] }, { args: [[[1], [0], [3], [2]], 2], out: [2, 3] }, { args: [[[]], 0], out: [0] }, { args: [[[1], [2], [0], [0]], 3], out: [0, 1, 2, 3] }] }
      },
      {
        name: 'Undo and redo: two stacks',
        body: 'An editor’s history is a stack: each action goes on top, and undo pops the latest. To support redo, keep a second stack. Undo moves an action from the first to the second, redo moves it back, and any **new** action clears the redo stack, because that branch of history is gone. A browser’s back and forward buttons work the same way. The shape is worth remembering: “move items between two stacks” also implements a queue (Implement Queue using Stacks, 232), which you’ll meet in [Queues and deques](#/topic/queues).'
      },
      {
        name: 'When a plain stack is the wrong tool',
        body: 'If the question is “for each element, find the **next greater** (or smaller) one”, a plain stack isn’t enough. You need the stack kept in sorted order by popping everything the new element beats. That’s the [monotonic stack](#/topic/monotonic), the next topic, and it turns O(n²) scans into O(n). If you need the oldest item rather than the newest, you want a queue. If you need arbitrary access by position, you want an array.'
      }
    ],

    worked: [
      {
        lc: 20,
        restate: 'Given a string made only of `(`, `)`, `[`, `]`, `{` and `}`, return whether it’s valid: every opener is closed by the same kind of bracket, in the right order, and every closer has an opener.',
        examples: '- `"()[]{}"` → true.\n- `"(]"` → false: the kinds don’t match.\n- `"([)]"` → false: each pair is fine alone, but they cross instead of nesting.\n- Edge cases: the empty string → true; a lone closer `")"` → false (nothing to pop); a lone opener `"("` → false (left over at the end); odd length can never be valid.',
        brute: 'Repeatedly delete adjacent `()`, `[]` and `{}` pairs from the string until nothing changes; the string is valid exactly when it ends up empty. Each sweep is O(n) and a string like `((((....))))` needs n/2 sweeps, so O(n²).',
        insight: 'That repeated deletion always removes the **innermost** pair, the most recently opened one. So instead of rescanning, keep the openers in a stack as you go. A closer can only pair with the top. And a small trick makes the check shorter: when you see an opener, push the **closer you expect** for it. Then a closer is valid exactly when it equals the popped value.',
        code: {
          py: `class Solution:
    def isValid(self, s: str) -> bool:
        expect = {'(': ')', '[': ']', '{': '}'}
        stack = []                       # closers we still owe, most recent on top
        for ch in s:
            if ch in expect:
                stack.append(expect[ch])
            elif not stack or stack.pop() != ch:
                return False             # nothing owed, or the wrong closer
        return not stack`,
          js: `function isValid(s) {
  const expect = { '(': ')', '[': ']', '{': '}' };
  const stack = [];                      // closers we still owe, most recent on top
  for (const ch of s) {
    if (ch in expect) stack.push(expect[ch]);
    else if (stack.length === 0 || stack.pop() !== ch) return false;   // nothing owed, or the wrong closer
  }
  return stack.length === 0;
}`,
          java: `class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();   // closers we still owe, most recent on top
        for (char ch : s.toCharArray()) {
            if (ch == '(') stack.push(')');
            else if (ch == '[') stack.push(']');
            else if (ch == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != ch) return false;   // nothing owed, or the wrong closer
        }
        return stack.isEmpty();
    }
}`,
          cpp: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;                  // closers we still owe, most recent on top
        for (char ch : s) {
            if (ch == '(') st.push(')');
            else if (ch == '[') st.push(']');
            else if (ch == '{') st.push('}');
            else {
                if (st.empty() || st.top() != ch) return false;   // nothing owed, or the wrong closer
                st.pop();
            }
        }
        return st.empty();
    }
};`
        },
        complexity: 'O(n) time: one pass, O(1) per character. O(n) space for the stack in the worst case (all openers).',
        say: '“Brackets must close in the reverse of the order they opened, so I’ll use a stack. For each opener I push the closer I expect. For each closer, the stack must be non-empty and its top must be exactly this closer; otherwise it’s invalid. At the end the stack must be empty, or some opener was never closed. One pass, O(n) time and space.”',
        followups: [
          { q: 'Can you do it with O(1) extra space?', a: 'With only one kind of bracket, yes: a counter that never goes below zero and ends at zero. With several kinds, the order matters, so you need to remember which kind is open at each depth. A stack is needed in general.' },
          { q: 'What if the string also has letters and digits?', a: 'Skip any character that is neither an opener nor a closer. The logic doesn’t change.' },
          { q: 'How would you return the longest valid substring (32)?', a: 'Push **indices** instead of characters, with a sentinel index at the bottom. On a match, the length is the current index minus the new top. On a mismatch, reset the sentinel to the current index.' },
          { q: 'What if the string is a stream and you can’t store it?', a: 'The stack is the only state you keep. Its size is the current nesting depth, so memory is the maximum depth, not the length.' }
        ]
      },
      {
        lc: 155,
        restate: 'Design a stack that supports `push`, `pop`, `top` and `getMin`, where `getMin` returns the smallest value currently in the stack. Every operation must run in O(1).',
        examples: '- push −2, push 0, push −3 → `getMin()` is −3.\n- pop → `top()` is 0, and `getMin()` is −2.\n- Edge cases: duplicate minimums (push 1, push 1, pop: the min is still 1); a single element; negative values.',
        brute: 'On `getMin`, scan the whole stack for the smallest value: O(n) per call. A second variable holding “the minimum” fails the first time you pop it, because you’d have to rescan to find the next smallest.',
        insight: 'The minimum **at a given depth** never changes while that entry is in the stack. So store, with every entry, the minimum of everything at or below it. Then `getMin` just reads the top’s stored minimum, and popping automatically restores the previous one. It’s a stack of (value, minimum so far) pairs.',
        code: {
          py: `class MinStack:
    def __init__(self):
        self.stack = []                 # (value, smallest value at or below this entry)

    def push(self, val: int) -> None:
        low = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, low))

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0]

    def getMin(self) -> int:
        return self.stack[-1][1]`,
          js: `class MinStack {
  constructor() {
    this.stack = [];                    // [value, smallest value at or below this entry]
  }
  push(val) {
    const low = this.stack.length ? Math.min(val, this.stack[this.stack.length - 1][1]) : val;
    this.stack.push([val, low]);
  }
  pop() {
    this.stack.pop();
  }
  top() {
    return this.stack[this.stack.length - 1][0];
  }
  getMin() {
    return this.stack[this.stack.length - 1][1];
  }
}`,
          java: `class MinStack {
    private final Deque<int[]> stack = new ArrayDeque<>();   // {value, smallest value at or below this entry}

    public void push(int val) {
        int low = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, low});
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1];
    }
}`,
          cpp: `class MinStack {
    vector<pair<int, int>> stack;       // {value, smallest value at or below this entry}
public:
    void push(int val) {
        int low = stack.empty() ? val : min(val, stack.back().second);
        stack.push_back({val, low});
    }
    void pop() {
        stack.pop_back();
    }
    int top() {
        return stack.back().first;
    }
    int getMin() {
        return stack.back().second;
    }
};`
        },
        complexity: 'O(1) time for every operation. O(n) space: each entry carries one extra integer.',
        say: '“The minimum can change every time I pop, so one variable isn’t enough. But the minimum of everything at or below an entry is fixed when that entry is pushed. So each entry stores its value plus the running minimum, and `getMin` is just a read of the top. Pushing computes the new minimum from the old top. Every operation is O(1).”',
        followups: [
          { q: 'Could you use less space than a pair per entry?', a: 'Yes: keep a second stack of minimums and push to it only when a value is less than or equal to the current minimum (equal matters, or duplicates break it). Pop from it when the popped value equals its top. Worst case it’s the same space, but it’s often smaller.' },
          { q: 'Why “less than or equal” and not just “less than” for the second stack?', a: 'With duplicates (push 1, push 1, pop), skipping the equal value would pop the minimum too early and leave the stack with a wrong answer.' },
          { q: 'How would you add `getMax`?', a: 'Store a third field, the running maximum, in each entry. Same idea, same O(1).' },
          { q: 'What do the problem’s calls on an empty stack mean?', a: 'LeetCode guarantees `pop`, `top` and `getMin` are only called on a non-empty stack. In a real design, say what you’d do: throw, or return a sentinel.' }
        ]
      },
      {
        lc: 150,
        restate: 'You get an arithmetic expression in **reverse Polish notation** (postfix) as a list of tokens: numbers and the operators `+ - * /`. Evaluate it. Division truncates toward zero, and the expression is always valid.',
        examples: '- `["2","1","+","3","*"]` → 9, because `(2 + 1) * 3`.\n- `["4","13","5","/","+"]` → 6, because `4 + (13 / 5)` and `13 / 5` truncates to 2.\n- `["4","-2","/"]` → −2: negative numbers are tokens too, and `4 / −2` is −2.\n- Edge cases: a single number; division of a negative result must truncate toward zero (`7 / −3` is −2), not floor.',
        brute: 'Repeatedly scan for the first operator, apply it to the two tokens before it, and replace the three tokens with the result. Each scan and rewrite is O(n), and there are about n/2 operators: O(n²).',
        insight: 'In postfix, an operator always applies to the **two most recent results**, and its result then becomes the most recent one. That’s exactly pop, pop, push. Numbers push, operators pop two. The right operand is popped first, so for `a - b` the first pop is `b`.',
        code: {
          py: `class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []
        for tok in tokens:
            if tok in ('+', '-', '*', '/'):
                b = stack.pop()          # right operand comes off first
                a = stack.pop()
                if tok == '+': stack.append(a + b)
                elif tok == '-': stack.append(a - b)
                elif tok == '*': stack.append(a * b)
                else: stack.append(int(a / b))   # truncate toward zero, not floor
            else:
                stack.append(int(tok))
        return stack[0]`,
          js: `function evalRPN(tokens) {
  const stack = [];
  for (const tok of tokens) {
    if (tok === '+' || tok === '-' || tok === '*' || tok === '/') {
      const b = stack.pop();             // right operand comes off first
      const a = stack.pop();
      if (tok === '+') stack.push(a + b);
      else if (tok === '-') stack.push(a - b);
      else if (tok === '*') stack.push(a * b);
      else stack.push(Math.trunc(a / b));   // truncate toward zero, not floor
    } else {
      stack.push(Number(tok));
    }
  }
  return stack[0];
}`,
          java: `class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String tok : tokens) {
            if (tok.equals("+") || tok.equals("-") || tok.equals("*") || tok.equals("/")) {
                int b = stack.pop();         // right operand comes off first
                int a = stack.pop();
                if (tok.equals("+")) stack.push(a + b);
                else if (tok.equals("-")) stack.push(a - b);
                else if (tok.equals("*")) stack.push(a * b);
                else stack.push(a / b);      // Java's integer division truncates toward zero
            } else {
                stack.push(Integer.parseInt(tok));
            }
        }
        return stack.pop();
    }
}`,
          cpp: `class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        vector<int> stack;
        for (const string& tok : tokens) {
            if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
                int b = stack.back(); stack.pop_back();   // right operand comes off first
                int a = stack.back(); stack.pop_back();
                if (tok == "+") stack.push_back(a + b);
                else if (tok == "-") stack.push_back(a - b);
                else if (tok == "*") stack.push_back(a * b);
                else stack.push_back(a / b);              // C++ integer division truncates toward zero
            } else {
                stack.push_back(stoi(tok));
            }
        }
        return stack.back();
    }
};`
        },
        complexity: 'O(n) time: each token is handled once with O(1) work. O(n) space: the stack holds at most about n/2 numbers.',
        say: '“In postfix an operator works on the two most recent values, so I’ll keep a stack of values. A number gets pushed. An operator pops the right operand, then the left, applies itself, and pushes the result. The order of the pops matters for minus and divide. Division truncates toward zero, which is `int(a / b)` in Python, not `//`. When tokens run out, the one value left is the answer. O(n).”',
        followups: [
          { q: 'Why not use `//` in Python?', a: '`//` floors, so `-7 // 2` is −4. The problem truncates toward zero, which gives −3. `int(a / b)` truncates, though float division can lose precision for huge integers; a safe form is `abs(a) // abs(b)` with the sign applied.' },
          { q: 'How would you convert a normal (infix) expression to postfix?', a: 'The shunting-yard algorithm: a stack of operators, popping operators of higher or equal precedence before pushing a new one. It’s another stack problem.' },
          { q: 'What if the input could be invalid?', a: 'Check that the stack has two values before an operator, and exactly one value at the end. Say how you’d report the error.' }
        ]
      },
      {
        lc: 853,
        restate: 'Cars drive toward a target mile on a one-lane road. Each car has a starting position and a constant speed, and a car can never pass the one ahead: it catches up and then travels at that car’s speed, forming a fleet. Return how many fleets arrive at the target.',
        examples: '- `target = 12`, `position = [10,8,0,5,3]`, `speed = [2,4,1,1,3]` → 3 fleets.\n- `target = 10`, one car → 1.\n- `target = 10`, `position = [6,8]`, `speed = [3,2]` → 2: the rear car would need 4/3 hours, the front one 1 hour, so it never catches up.\n- Edge cases: a car that would catch the one ahead exactly at the target still joins its fleet.',
        brute: 'Simulate time in small steps, merging cars as they meet. Precision and speed are both problems: it’s slow, and “meet exactly at the target” is easy to miss.',
        insight: 'Ignore the road and compare **arrival times**. A car’s time alone is `(target − position) / speed`. Process cars from the one nearest the target backwards. If a car’s own time is greater than the fleet ahead of it, it never catches up and starts a new fleet. If its time is less than or equal, it catches up and merges: it arrives with that fleet. The stack of fleet times only ever needs its top, and its length is the answer.',
        code: {
          py: `class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        stack = []                                      # arrival time of each fleet, nearest the target first
        for pos, sp in sorted(zip(position, speed), reverse=True):
            t = (target - pos) / sp
            if not stack or t > stack[-1]:
                stack.append(t)                         # slower than the fleet ahead: a new fleet
        return len(stack)`,
          js: `function carFleet(target, position, speed) {
  const cars = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);
  const stack = [];                                     // arrival time of each fleet, nearest the target first
  for (const [pos, sp] of cars) {
    const t = (target - pos) / sp;
    if (stack.length === 0 || t > stack[stack.length - 1]) stack.push(t);   // slower than the fleet ahead: a new fleet
  }
  return stack.length;
}`,
          java: `class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        int[][] cars = new int[n][];
        for (int i = 0; i < n; i++) cars[i] = new int[]{position[i], speed[i]};
        Arrays.sort(cars, (a, b) -> b[0] - a[0]);       // nearest the target first
        Deque<Double> stack = new ArrayDeque<>();       // arrival time of each fleet
        for (int[] car : cars) {
            double t = (double) (target - car[0]) / car[1];
            if (stack.isEmpty() || t > stack.peek()) stack.push(t);   // slower than the fleet ahead: a new fleet
        }
        return stack.size();
    }
}`,
          cpp: `class Solution {
public:
    int carFleet(int target, vector<int>& position, vector<int>& speed) {
        vector<pair<int, int>> cars;
        for (int i = 0; i < (int)position.size(); i++) cars.push_back({position[i], speed[i]});
        sort(cars.rbegin(), cars.rend());               // nearest the target first
        vector<double> stack;                           // arrival time of each fleet
        for (auto& car : cars) {
            double t = (double)(target - car.first) / car.second;
            if (stack.empty() || t > stack.back()) stack.push_back(t);   // slower than the fleet ahead: a new fleet
        }
        return stack.size();
    }
};`
        },
        complexity: 'O(n log n) time, dominated by the sort; the pass itself is O(n). O(n) space.',
        say: '“A car can’t pass the one ahead, so what matters is arrival time. I sort by position, nearest the target first, and compute each car’s time to the target alone. If a car’s time is larger than the fleet ahead, it never catches it, so it’s a new fleet. If it’s smaller or equal, it merges and arrives with that fleet. I keep a stack of fleet times, and its size is the answer. O(n log n) for the sort.”',
        followups: [
          { q: 'Do you actually need the stack?', a: 'No, only the top is ever used, so one variable for the latest fleet’s time and a counter does the same job. The stack is the clearest way to see why. Say that, then offer the simplification.' },
          { q: 'Why is “equal times” a merge?', a: 'If the rear car reaches the target at the same moment, it caught up exactly at or before the finish, and the problem counts that as one fleet.' },
          { q: 'Is floating point a risk here?', a: 'It can be for equality, since a tie like 4/3 versus 8/6 is rarely exact in doubles. You can compare by cross-multiplication in integers: `(target − p1) * s2` against `(target − p2) * s1`.' }
        ]
      }
    ],

    practice: [
      { lc: 682,
        hints: ['Each record either adds a score or edits the most recent scores: undo one, double one, or sum two.', 'Keep a stack of valid scores. A number pushes. `C` pops. `D` pushes twice the top. `+` pushes the sum of the top two.', 'The answer is the sum of whatever is left on the stack.'],
        solution: { explain: 'A stack of valid scores: every operation only touches the last one or two. O(n) time, O(n) space.', code: {
          py: `class Solution:
    def calPoints(self, operations: List[str]) -> int:
        scores = []
        for op in operations:
            if op == 'C':
                scores.pop()
            elif op == 'D':
                scores.append(2 * scores[-1])
            elif op == '+':
                scores.append(scores[-1] + scores[-2])
            else:
                scores.append(int(op))
        return sum(scores)`,
          js: `function calPoints(operations) {
  const scores = [];
  for (const op of operations) {
    if (op === 'C') scores.pop();
    else if (op === 'D') scores.push(2 * scores[scores.length - 1]);
    else if (op === '+') scores.push(scores[scores.length - 1] + scores[scores.length - 2]);
    else scores.push(Number(op));
  }
  return scores.reduce((a, b) => a + b, 0);
}` } },
        starter: { py: 'class Solution:\n    def calPoints(self, operations: List[str]) -> int:\n        ', js: 'function calPoints(operations) {\n  \n}' },
        tests: { fn: 'calPoints', cases: [
          { args: [['5', '2', 'C', 'D', '+']], out: 30 }, { args: [['5', '-2', '4', 'C', 'D', '9', '+', '+']], out: 27 }, { args: [['1']], out: 1 }, { args: [['1', 'C']], out: 0 }] } },

      { lc: 1047,
        hints: ['Two equal neighbours cancel, and cancelling can create a new pair of equal neighbours.', 'The latest surviving character is the only one a new character can cancel against.', 'Keep a stack of survivors. If the new character equals the top, pop; otherwise push.'],
        solution: { explain: 'The stack holds the surviving characters so far. A new character either cancels the top or joins it. O(n) time and space.', code: {
          py: `class Solution:
    def removeDuplicates(self, s: str) -> str:
        stack = []
        for ch in s:
            if stack and stack[-1] == ch:
                stack.pop()
            else:
                stack.append(ch)
        return ''.join(stack)`,
          js: `function removeDuplicates(s) {
  const stack = [];
  for (const ch of s) {
    if (stack.length && stack[stack.length - 1] === ch) stack.pop();
    else stack.push(ch);
  }
  return stack.join('');
}` } },
        starter: { py: 'class Solution:\n    def removeDuplicates(self, s: str) -> str:\n        ', js: 'function removeDuplicates(s) {\n  \n}' },
        tests: { fn: 'removeDuplicates', cases: [
          { args: ['abbaca'], out: 'ca' }, { args: ['azxxzy'], out: 'ay' }, { args: ['aa'], out: '' }, { args: ['a'], out: 'a' }, { args: ['abccba'], out: '' }] } },

      { lc: 844,
        hints: ['A `#` deletes the character just before it, if there is one.', 'Build each string’s final text with a stack: a letter pushes, a `#` pops (but only if the stack isn’t empty).', 'Compare the two final stacks.'],
        solution: { explain: 'Simulate the typing for each string with a stack, then compare. O(n + m) time and space. (A two-pointer scan from the right gets O(1) space.)', code: {
          py: `class Solution:
    def backspaceCompare(self, s: str, t: str) -> bool:
        def build(text):
            stack = []
            for ch in text:
                if ch != '#':
                    stack.append(ch)
                elif stack:
                    stack.pop()
            return stack
        return build(s) == build(t)`,
          js: `function backspaceCompare(s, t) {
  const build = (text) => {
    const stack = [];
    for (const ch of text) {
      if (ch !== '#') stack.push(ch);
      else if (stack.length) stack.pop();
    }
    return stack.join('');
  };
  return build(s) === build(t);
}` } },
        starter: { py: 'class Solution:\n    def backspaceCompare(self, s: str, t: str) -> bool:\n        ', js: 'function backspaceCompare(s, t) {\n  \n}' },
        tests: { fn: 'backspaceCompare', cases: [
          { args: ['ab#c', 'ad#c'], out: true }, { args: ['ab##', 'c#d#'], out: true }, { args: ['a#c', 'b'], out: false }, { args: ['a##c', '#a#c'], out: true }, { args: ['###', ''], out: true }] } },

      { lc: 20,
        hints: ['Each closer must match the **most recent** unclosed opener.', 'Push openers onto a stack. On a closer, the stack must be non-empty and its top must be the matching opener.', 'After the last character the stack must be empty, or an opener was never closed.'],
        starter: { py: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        ', js: 'function isValid(s) {\n  \n}' },
        tests: { fn: 'isValid', sig: { args: ['str'] }, cases: [
          { args: ['()'], out: true }, { args: ['()[]{}'], out: true }, { args: ['(]'], out: false }, { args: ['([)]'], out: false }, { args: ['{[]}'], out: true },
          { args: ['('], out: false }, { args: [')'], out: false }, { args: ['(('], out: false }] } },

      { lc: 155,
        hints: ['Every entry could remember the minimum of everything at or below it.', 'Push pairs `(value, minimum so far)`, where the new minimum is `min(value, previous top’s minimum)`.', '`getMin` reads the top’s second field, and `pop` restores the previous minimum for free.'],
        starter: { py: 'class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, val: int) -> None:\n        pass\n\n    def pop(self) -> None:\n        pass\n\n    def top(self) -> int:\n        pass\n\n    def getMin(self) -> int:\n        pass', js: 'class MinStack {\n  constructor() {\n  }\n  push(val) {\n  }\n  pop() {\n  }\n  top() {\n  }\n  getMin() {\n  }\n}' },
        tests: { design: true, cases: [
          { ops: ['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'top', 'getMin'], args: [[], [-2], [0], [-3], [], [], [], []], out: [null, null, null, null, -3, null, 0, -2] },
          { ops: ['MinStack', 'push', 'push', 'getMin', 'pop', 'getMin'], args: [[], [1], [1], [], [], []], out: [null, null, null, 1, null, 1] },
          { ops: ['MinStack', 'push', 'getMin', 'top', 'pop', 'push', 'getMin'], args: [[], [5], [], [], [], [7], []], out: [null, null, 5, 5, null, null, 7] }] } },

      { lc: 150,
        hints: ['In postfix, an operator applies to the two most recent values.', 'Push numbers. On an operator, pop the right operand, then the left, apply it, and push the result.', 'Division truncates toward zero: `int(a / b)` in Python, `Math.trunc(a / b)` in JavaScript.'],
        starter: { py: 'class Solution:\n    def evalRPN(self, tokens: List[str]) -> int:\n        ', js: 'function evalRPN(tokens) {\n  \n}' },
        tests: { fn: 'evalRPN', sig: { args: ['str[]'] }, cases: [
          { args: [['2', '1', '+', '3', '*']], out: 9 }, { args: [['4', '13', '5', '/', '+']], out: 6 },
          { args: [['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']], out: 22 }, { args: [['3']], out: 3 }, { args: [['4', '-2', '/']], out: -2 }, { args: [['7', '-3', '/']], out: -2 }] } },

      { lc: 71,
        hints: ['Split the path on `/`. Empty pieces and `.` do nothing.', 'A `..` goes up one directory: pop, unless you’re already at the root.', 'Join what’s left with `/` and put a `/` in front. An empty result is just `/`.'],
        solution: { explain: 'A stack of directory names: names push, `..` pops. O(n) time and space.', code: {
          py: `class Solution:
    def simplifyPath(self, path: str) -> str:
        stack = []
        for part in path.split('/'):
            if part == '..':
                if stack:
                    stack.pop()
            elif part and part != '.':
                stack.append(part)
        return '/' + '/'.join(stack)`,
          js: `function simplifyPath(path) {
  const stack = [];
  for (const part of path.split('/')) {
    if (part === '..') stack.pop();
    else if (part && part !== '.') stack.push(part);
  }
  return '/' + stack.join('/');
}` } },
        starter: { py: 'class Solution:\n    def simplifyPath(self, path: str) -> str:\n        ', js: 'function simplifyPath(path) {\n  \n}' },
        tests: { fn: 'simplifyPath', cases: [
          { args: ['/home/'], out: '/home' }, { args: ['/../'], out: '/' }, { args: ['/home//foo/'], out: '/home/foo' }, { args: ['/a/./b/../../c/'], out: '/c' },
          { args: ['/a//b////c/d//././/..'], out: '/a/b/c' }, { args: ['/...'], out: '/...' }] } },

      { lc: 394,
        hints: ['Brackets nest, so when a `[` opens you’ll need to come back to what you were building before it.', 'On `[`, push the text built so far and the repeat count, then start fresh. On `]`, pop them and combine.', 'Digits can be several characters long (`10[a]`): build the number as you read.'],
        solution: { explain: 'A stack of frames, each holding the text built before a `[` and its repeat count. On `]`, the current text repeats and attaches to the saved text. O(n + output) time.', code: {
          py: `class Solution:
    def decodeString(self, s: str) -> str:
        stack = []                      # (text before the bracket, repeat count)
        cur, num = '', 0
        for ch in s:
            if ch.isdigit():
                num = num * 10 + int(ch)
            elif ch == '[':
                stack.append((cur, num))
                cur, num = '', 0
            elif ch == ']':
                prev, times = stack.pop()
                cur = prev + cur * times
            else:
                cur += ch
        return cur`,
          js: `function decodeString(s) {
  const stack = [];                     // [text before the bracket, repeat count]
  let cur = '', num = 0;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') num = num * 10 + Number(ch);
    else if (ch === '[') { stack.push([cur, num]); cur = ''; num = 0; }
    else if (ch === ']') { const [prev, times] = stack.pop(); cur = prev + cur.repeat(times); }
    else cur += ch;
  }
  return cur;
}` } },
        starter: { py: 'class Solution:\n    def decodeString(self, s: str) -> str:\n        ', js: 'function decodeString(s) {\n  \n}' },
        tests: { fn: 'decodeString', cases: [
          { args: ['3[a]2[bc]'], out: 'aaabcbc' }, { args: ['3[a2[c]]'], out: 'accaccacc' }, { args: ['2[abc]3[cd]ef'], out: 'abcabccdcdcdef' }, { args: ['abc3[cd]xyz'], out: 'abccdcdcdxyz' }, { args: ['10[a]'], out: 'aaaaaaaaaa' }] } },

      { lc: 735,
        hints: ['Asteroids only collide when a right-mover is followed by a left-mover: the top of the stack moves right and the new one moves left.', 'Keep a stack of survivors. While the newcomer moves left and the top moves right, compare sizes: the smaller one dies, and equal sizes both die.', 'If the newcomer survives every fight (or never fought), push it.'],
        solution: { explain: 'A stack of survivors: the newcomer fights the top while they’re moving toward each other. Each asteroid is pushed once and popped at most once, so O(n).', code: {
          py: `class Solution:
    def asteroidCollision(self, asteroids: List[int]) -> List[int]:
        stack = []
        for a in asteroids:
            alive = True
            while alive and a < 0 and stack and stack[-1] > 0:
                if stack[-1] < -a:
                    stack.pop()          # the top is smaller: it dies, keep fighting
                    continue
                if stack[-1] == -a:
                    stack.pop()          # equal: both die
                alive = False            # the top is bigger or equal: the newcomer is gone
            if alive:
                stack.append(a)
        return stack`,
          js: `function asteroidCollision(asteroids) {
  const stack = [];
  for (const a of asteroids) {
    let alive = true;
    while (alive && a < 0 && stack.length && stack[stack.length - 1] > 0) {
      const top = stack[stack.length - 1];
      if (top < -a) { stack.pop(); continue; }   // the top is smaller: it dies, keep fighting
      if (top === -a) stack.pop();               // equal: both die
      alive = false;                             // the top is bigger or equal: the newcomer is gone
    }
    if (alive) stack.push(a);
  }
  return stack;
}` } },
        starter: { py: 'class Solution:\n    def asteroidCollision(self, asteroids: List[int]) -> List[int]:\n        ', js: 'function asteroidCollision(asteroids) {\n  \n}' },
        tests: { fn: 'asteroidCollision', cases: [
          { args: [[5, 10, -5]], out: [5, 10] }, { args: [[8, -8]], out: [] }, { args: [[10, 2, -5]], out: [10] }, { args: [[-2, -1, 1, 2]], out: [-2, -1, 1, 2] }, { args: [[1, -2, -2, -2]], out: [-2, -2, -2] }] } },

      { lc: 227,
        hints: ['`*` and `/` bind tighter than `+` and `-`, so settle them immediately; `+` and `-` can wait.', 'Remember the **previous** operator. When you reach the next operator (or the end), apply the previous one to the number you just read.', '`+` pushes the number, `-` pushes its negative, `*` and `/` combine with the top. Return the sum of the stack.'],
        solution: { explain: 'Numbers go on a stack with their sign, multiplication and division fold into the top immediately, and the answer is the sum. O(n) time and space.', code: {
          py: `class Solution:
    def calculate(self, s: str) -> int:
        stack, num, op = [], 0, '+'
        for i, ch in enumerate(s):
            if ch.isdigit():
                num = num * 10 + int(ch)
            if (not ch.isdigit() and ch != ' ') or i == len(s) - 1:
                if op == '+':
                    stack.append(num)
                elif op == '-':
                    stack.append(-num)
                elif op == '*':
                    stack.append(stack.pop() * num)
                else:
                    stack.append(int(stack.pop() / num))
                op, num = ch, 0
        return sum(stack)`,
          js: `function calculate(s) {
  const stack = [];
  let num = 0, op = '+';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch >= '0' && ch <= '9') num = num * 10 + (ch.charCodeAt(0) - 48);
    if ((!(ch >= '0' && ch <= '9') && ch !== ' ') || i === s.length - 1) {
      if (op === '+') stack.push(num);
      else if (op === '-') stack.push(-num);
      else if (op === '*') stack.push(stack.pop() * num);
      else stack.push(Math.trunc(stack.pop() / num));
      op = ch; num = 0;
    }
  }
  return stack.reduce((a, b) => a + b, 0);
}` } },
        starter: { py: 'class Solution:\n    def calculate(self, s: str) -> int:\n        ', js: 'function calculate(s) {\n  \n}' },
        tests: { fn: 'calculate', cases: [
          { args: ['3+2*2'], out: 7 }, { args: [' 3/2 '], out: 1 }, { args: [' 3+5 / 2 '], out: 5 }, { args: ['1-1+1'], out: 1 }, { args: ['100'], out: 100 }, { args: ['0-2147483647'], out: -2147483647 }] } },

      { lc: 1249,
        hints: ['Two things make a bracket invalid: a `)` with no `(` before it, and a `(` that’s never closed.', 'Walk the string with a stack of **indices** of `(`. A `)` with an empty stack is removed; otherwise it pops a partner.', 'When the walk ends, the indices still on the stack are unmatched openers. Remove those too, and build the result.'],
        solution: { explain: 'Track indices, not characters, so you know exactly what to delete: unmatched closers are found on the way, unmatched openers are what’s left on the stack. O(n) time and space.', code: {
          py: `class Solution:
    def minRemoveToMakeValid(self, s: str) -> str:
        drop = set()
        stack = []                       # indices of '(' still waiting
        for i, ch in enumerate(s):
            if ch == '(':
                stack.append(i)
            elif ch == ')':
                if stack:
                    stack.pop()
                else:
                    drop.add(i)          # a closer with no opener
        drop.update(stack)               # openers never closed
        return ''.join(ch for i, ch in enumerate(s) if i not in drop)`,
          js: `function minRemoveToMakeValid(s) {
  const drop = new Set(), stack = [];    // stack: indices of '(' still waiting
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') stack.push(i);
    else if (s[i] === ')') {
      if (stack.length) stack.pop();
      else drop.add(i);                  // a closer with no opener
    }
  }
  for (const i of stack) drop.add(i);    // openers never closed
  return [...s].filter((_, i) => !drop.has(i)).join('');
}` } },
        starter: { py: 'class Solution:\n    def minRemoveToMakeValid(self, s: str) -> str:\n        ', js: 'function minRemoveToMakeValid(s) {\n  \n}' },
        tests: { fn: 'minRemoveToMakeValid', cases: [
          { args: ['lee(t(c)o)de)'], out: ['lee(t(co)de)', 'lee(t(c)ode)', 'lee(t(c)o)de'], any: true }, { args: ['a)b(c)d'], out: 'ab(c)d' }, { args: ['))(('], out: '' }, { args: ['abc'], out: 'abc' }, { args: ['(a'], out: 'a' }] } },

      { lc: 853,
        hints: ['A car can’t pass the one ahead, so think in arrival times instead of positions.', 'Sort cars by position, nearest the target first, and compute each car’s time `(target - position) / speed`.', 'If a car’s time is larger than the fleet ahead’s, it starts a new fleet. Otherwise it merges. Count the fleets.'],
        starter: { py: 'class Solution:\n    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:\n        ', js: 'function carFleet(target, position, speed) {\n  \n}' },
        tests: { fn: 'carFleet', sig: { args: ['int', 'int[]', 'int[]'] }, cases: [
          { args: [12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]], out: 3 }, { args: [10, [3], [3]], out: 1 }, { args: [100, [0, 2, 4], [4, 2, 1]], out: 1 }, { args: [10, [6, 8], [3, 2]], out: 2 }] } }
    ],

    mistakes: [
      '**Popping or peeking an empty stack.** The classic crash is `")"` as the whole input: there’s nothing to pop. Test emptiness first (`if not stack or ...`), and keep the two conditions in that order so the check short-circuits before `stack[-1]` runs.',
      '**Forgetting the leftover check.** Returning `true` when the loop finishes passes `"(("` and `"([]"`. After the loop, a valid string needs an **empty** stack.',
      '**Checking only the count of brackets.** Equal numbers of openers and closers isn’t enough: `"([)]"` has two of each kind but crosses. The stack enforces **order**; counters only work when there’s a single kind.',
      '**Operand order in postfix.** The first value popped is the **right** operand. Computing `b - a` instead of `a - b` gives a sign error on every subtraction and a wrong answer on every division.',
      '**Floor versus truncate for division.** Python’s `//` rounds toward negative infinity (`-7 // 2` is −4), while many problems want truncation toward zero (−3). JavaScript needs `Math.trunc`, because `/` gives a float. Java and C++ integer division already truncates toward zero.',
      '**Stack-of-pairs drift.** When each entry carries extra state (a minimum, a count), update it **at push time** from the current top, and pop both together. Forgetting the empty case on the first push is the usual bug.',
      '**Language gotchas.** *Python:* `list.pop(0)` is O(n), so a stack at the *end* is fast but a “stack” at the front isn’t. *JavaScript:* `shift` and `unshift` work at the front and are slower than `push` and `pop`; and an empty-array `pop()` returns `undefined` silently instead of throwing. *Java:* use `ArrayDeque`, not the legacy synchronized `Stack` class; `stack.pop()` on an empty `ArrayDeque` throws `NoSuchElementException`, and comparing two `Character` or `Integer` objects with `==` compares references, so unbox first. *C++:* `std::stack::pop()` returns **void**, so read `top()` first; calling `top()` or `pop()` on an empty stack is undefined behavior, not an exception.'
    ],

    quiz: [
      { kind: 'concept', q: 'You push 1, 2, 3 onto a stack, then pop twice and push 4. What is the stack, from bottom to top?',
        choices: ['1, 4', '1, 2, 4', '3, 4', '4, 3, 2'], answer: 0,
        explain: 'The two pops remove 3 and then 2 (last in, first out), leaving 1. Pushing 4 puts it on top: 1, 4.' },
      { kind: 'pattern', q: 'Which problem is most naturally a stack problem?',
        choices: ['Check that every opening tag in a document is closed in the right order', 'Find the shortest path in an unweighted grid', 'Find the k-th smallest element in an unsorted array', 'Find two numbers in a sorted array that add up to a target'], answer: 0,
        explain: 'Nested structure that must close in reverse order is the classic stack signal. The shortest path in a grid is breadth-first search, which uses a queue. The k-th smallest is sorting or a heap, and the sorted pair is two pointers.' },
      { kind: 'pattern', q: 'Which signals point to a stack? Pick every one that applies.',
        choices: ['Things must close in the reverse of the order they opened', 'The newest unresolved item is the one that matters next', 'You always need the oldest item first', 'You want to run depth-first search without recursion'], answer: [0, 1, 3],
        explain: 'Reverse-order closing, “the latest item matters next”, and DFS (whose natural data structure is the call stack) are the stack signals. Needing the oldest item first is a queue.' },
      { kind: 'bug', q: 'This returns true for `"(("`, which is invalid. What’s the bug?',
        code: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return True`,
        choices: ['It never checks that the stack is empty after the loop', 'It should push the closers instead of the openers', 'The `not stack` check should come after the `pop`', 'The dictionary should map openers to closers'], answer: 0,
        explain: 'Both `(` characters are pushed and never popped, and the loop ends without complaint. After the loop, openers left on the stack mean the string is invalid, so the last line must be `return not stack`.' },
      { kind: 'complexity', q: 'The matching-brackets solution has a `for` loop and pops inside it. What is its time complexity?',
        choices: ['O(n)', 'O(n²)', 'O(n log n)', 'O(2ⁿ)'], answer: 0,
        explain: 'Each character is read once, and each item is pushed at most once and popped at most once. The pops are spread across the loop, not an extra loop per character, so the total is O(n).' },
      { kind: 'concept', q: 'Evaluating the postfix expression `["6","2","-"]`: which value is popped first when the `-` arrives, and what is the result?',
        choices: ['2 is popped first, and the result is 6 − 2 = 4', '6 is popped first, and the result is 2 − 6 = −4', '2 is popped first, and the result is 2 − 6 = −4', '6 is popped first, and the result is 6 − 2 = 4'], answer: 0,
        explain: 'The stack holds 6 then 2, so 2 is on top and comes off first as the right operand. The left operand is 6, and the result is left minus right: 4.' },
      { kind: 'concept', q: 'In Min Stack, why does each entry store the minimum at or below it, instead of one global “minimum so far” variable?',
        choices: ['After a pop, the previous minimum is already sitting in the new top', 'A global variable uses more memory', 'It makes `push` faster than O(1)', 'A global variable can’t hold negative numbers'], answer: 0,
        explain: 'If the popped value was the minimum, a single variable has forgotten the second-smallest and would need a rescan. Per-entry minimums make popping restore the old minimum automatically.' },
      { kind: 'concept', q: 'Why can any recursive algorithm be rewritten with an explicit stack?',
        choices: ['The call stack is itself a stack of frames holding arguments and where to resume', 'Recursion is always slower, so it must be replaced', 'Stacks are faster than function calls in every language', 'Every recursion is tail recursion'], answer: 0,
        explain: 'Each call pushes a frame (arguments, locals, return point) and each return pops it. Pushing and popping equivalent records yourself reproduces the same order of work, which is useful when depth could overflow.' }
    ],

    flashcards: [
      { id: 'lifo', front: 'Stack: what does LIFO mean, and which three operations do you get?', back: 'Last in, first out. `push` adds on top, `pop` removes and returns the top, `peek` reads the top. Each is O(1).' },
      { id: 'reverse-order', front: 'When is a stack the right tool?', back: 'When things must be resolved in the **reverse** of the order they appeared (brackets, tags, nested calls, undo), so the newest unresolved item is always the next one you need.' },
      { id: 'bracket-steps', front: 'Matching brackets: the algorithm in four lines.', back: 'Opener: push. Closer: the stack must be non-empty and its top must be the matching opener; pop it, or return false. At the end, the stack must be empty.' },
      { id: 'empty-check', front: 'Matching brackets: which two checks are easy to forget?', back: 'Emptiness **before** looking at the top (a lone closer), and an empty stack **after** the loop (leftover openers).' },
      { id: 'min-stack', front: 'Min Stack: how do you get `getMin` in O(1)?', back: 'Store, with each entry, the minimum of everything at or below it. `getMin` reads the top’s minimum, and `pop` restores the previous one automatically.' },
      { id: 'rpn', front: 'Postfix evaluation: what do numbers and operators do?', back: 'A number pushes. An operator pops the **right** operand, then the left, applies itself, and pushes the result. One value is left at the end.' },
      { id: 'trunc', front: 'Division in postfix problems: floor or truncate?', back: 'Truncate toward zero. Python needs `int(a / b)` (not `//`), JavaScript `Math.trunc`. Java and C++ integer division already truncates.' },
      { id: 'cancel', front: 'Adjacent duplicates or backspace: how does a stack help?', back: 'Keep the surviving characters. A new character that cancels the top pops it; otherwise it pushes. The stack is the final answer.' },
      { id: 'call-stack', front: 'How do you do DFS without recursion?', back: 'Push the start, then repeatedly pop a node and push its unvisited neighbours (mark on push). For post-order work, push `(node, state)` entries.' },
      { id: 'two-stacks', front: 'Undo and redo: what are the rules?', back: 'Two stacks. Undo moves an action from the history to the redo stack, redo moves it back, and any **new** action clears the redo stack.' },
      { id: 'next-greater', front: 'When is a plain stack not enough?', back: 'For “next greater element” questions. Keep the stack sorted by popping everything the new item beats: a monotonic stack.' }
    ],

    deeper: [
      { title: 'Stack problems (LeetCode tag)', url: 'https://leetcode.com/tag/stack/', time: 'reference', note: 'LeetCode’s own list of problems tagged stack. Sort by acceptance rate, and do the easy ones before the pattern feels automatic.' },
      { title: 'Stacks & Queues (William Fiset, YouTube)', url: 'https://www.youtube.com/watch?v=L3ud3rXpIxA', time: 'about 20 min', note: 'A video on how stacks and queues work and how they’re implemented, as linked from DSA-Kit. Good if you want the data structure itself, not only the interview patterns.' },
      { title: 'Stack (VisuAlgo)', url: 'https://visualgo.net/en/list', time: 'about 10 min', note: 'An interactive visualization of list-like structures, linked from DSA-Kit; use it to push and pop and watch what happens. The page covers several structures, so look for the stack mode.' },
      { title: 'Monotonic stack (LeetCode tag)', url: 'https://leetcode.com/tag/monotonic-stack/', time: 'reference', note: 'The follow-up pattern. Come back to it after this page feels easy: it’s the [next topic](#/topic/monotonic).' }
    ],

    detective: [
      { id: 'undo-draw', decoys: ['queues', 'linked-lists', 'arrays-hashing'],
        statement: 'A drawing app logs a sequence of commands: “draw a stroke”, “undo”, and “redo”. “Undo” reverses the most recent stroke that is still on the canvas, and “redo” brings back the stroke that was most recently undone, but drawing anything new makes redo impossible until another undo. Given the commands in order, report which strokes are visible at the end.',
        why: 'Every undo reaches for the most recent surviving action, and redo for the most recently undone one. That “newest first” access on two sets of actions is a pair of stacks, with the redo stack cleared by a new action.' },
      { id: 'tag-nesting', decoys: ['recursion', 'two-pointers', 'arrays-hashing'],
        statement: 'A template engine reads a page that uses tags like `<b>`, `<i>` and `<u>`, closed with `</b>`, `</i>`, `</u>`. A page is well formed when every tag is closed, by the same kind of tag, and a tag opened later is always closed before one opened earlier. Given the list of tags in page order, say whether the page is well formed.',
        why: '“Closed before one opened earlier” means each closing tag must pair with the **most recent** still-open tag. That’s the matching-brackets stack, with tag names in place of bracket characters.' },
      { id: 'till-tape', decoys: ['recursion', 'arrays-hashing', 'heaps'],
        statement: 'A shop’s old cash register takes its calculation as a tape of tokens, where each operation comes **after** the numbers it uses: for example 8, 3, 2, minus, times means 8 times (3 minus 2). Given a valid tape, compute the result. Integer division discards the fractional part.',
        why: 'Each operation applies to the two most recent values and its result becomes the newest value. That’s pop two, push one on a stack of numbers: the postfix evaluation shape.' },
      { id: 'path-tidy', decoys: ['two-pointers', 'arrays-hashing', 'linked-lists'],
        statement: 'A file sync tool receives paths such as `/docs/./notes/../photos//` where a single dot means “this folder”, two dots mean “go up one folder” (and do nothing at the very top), and repeated slashes mean nothing. It needs the shortest equivalent path for each input. Write that clean-up.',
        why: 'Each folder name is “entered”, and a two-dot step undoes the most recent entry. That’s push on a name and pop on `..`, then join what remains.' },
      { id: 'emoji-fizz', decoys: ['two-pointers', 'sliding-window', 'arrays-hashing'],
        statement: 'A chat app tidies a message by cancelling any two identical emoji sitting right next to each other, and keeps doing it until no such neighbours remain. Cancelling can bring two new emoji together, such as in ABBA, where removing the middle pair leaves AA, which also cancels. Return what’s left of the message.',
        why: 'The only thing a new emoji can cancel against is the latest survivor. Keeping the survivors in order and popping on a match is a stack, and one pass handles all the chain reactions.' }
    ]
  });
})();
