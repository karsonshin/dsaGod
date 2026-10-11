(function () {
  var OR = (window.OR = window.OR || {}); OR.qa = OR.qa || [];
  OR.qa.push(
    {
      "id": "ds-dynamic-array-costs",
      "title": "Dynamic array (Python list): operations and costs",
      "q": [
        "what is a dynamic array",
        "how does a python list work",
        "dynamic array time complexity",
        "why is list append o(1) amortized",
        "array vs list costs",
        "cost of insert at the beginning of a list"
      ],
      "tags": "dynamic array list vector arraylist amortized resize append insert pop complexity",
      "a": "A dynamic array is a contiguous array that over-allocates and grows (CPython lists, Java ArrayList, C++ vector). Index and append-at-end are O(1) (append amortized); insert/delete in the middle or front are O(n) because elements shift.",
      "code": {
        "py": "a = []\nfor i in range(5): a.append(i)   # amortized O(1)\na.insert(0, 99)                  # O(n): shifts everything right\nx = a.pop()                      # O(1) from the end\ny = a.pop(0)                     # O(n) from the front\nprint(a[2], len(a))              # index O(1)\nprint(2 in a)                    # membership O(n)"
      },
      "more": "- Growth is geometric (about 1.125x in CPython, 2x in many others), so n appends cost O(n) total.\n- Use `collections.deque` if you pop from the front often.\n- Slicing `a[i:j]` copies: O(j-i).",
      "cx": "index O(1); append amortized O(1); insert/delete middle O(n); search O(n)",
      "see": [
        "#/topic/arrays-hashing",
        "#/cheatsheets/python"
      ],
      "check": "assert a == [0,1,2,3] and x == 4 and y == 99\nassert a[2] == 2 and 3 in a"
    },
    {
      "id": "ds-python-list-ops",
      "title": "Python list operations cheat list",
      "q": [
        "python list methods",
        "how to add and remove items from a list in python",
        "list append extend insert remove pop",
        "remove an element from a list python",
        "python list slicing"
      ],
      "tags": "list append extend insert remove pop index slice del copy count python",
      "a": "Use `append(x)` to add at the end, `extend(it)` to add many, `insert(i,x)` to add at a position, `pop()` / `pop(i)` to remove by position, `remove(x)` to remove the first match, and slices to copy parts.",
      "code": {
        "py": "a = [1, 2, 3]\na.append(4); a.extend([5, 6]); a.insert(0, 0)\na.remove(3)          # first value 3\nlast = a.pop()\ndel a[0]\nb = a[:]             # shallow copy\nrev = a[::-1]\nprint(a, b, rev)"
      },
      "more": "- `remove` raises ValueError if missing; `pop` raises IndexError on empty.\n- `a[:]` is shallow: nested lists are shared.\n- `a += b` mutates in place, `a = a + b` builds a new list.",
      "cx": "append O(1) amortized; pop() O(1); pop(i), insert, remove O(n)",
      "see": [
        "#/topic/arrays-hashing",
        "#/cheatsheets/python"
      ],
      "check": "assert a == [1,2,4,5] and last == 6 and rev == [5,4,2,1] and b == a and b is not a"
    },
    {
      "id": "ds-ll-singly",
      "title": "Singly linked list: node class and build",
      "q": [
        "what is a linked list",
        "how to implement a singly linked list in python",
        "linked list node class",
        "build a linked list from a list",
        "create linked list python"
      ],
      "tags": "linked list singly node next head build traverse dummy",
      "a": "A singly linked list is a chain of nodes, each holding a value and a `next` pointer; you keep the `head`. Access by index is O(n), insert/delete at a known node is O(1). Build with a dummy head to avoid special cases.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\nhead = build([1, 2, 3])\nprint(to_list(head))   # [1, 2, 3]"
      },
      "more": "- Dummy (sentinel) head removes the \"empty list\" special case.\n- Traversal: `while node: node = node.next`.\n- Beats arrays only when you already hold the node to splice at.",
      "cx": "access/search O(n); insert/delete after a known node O(1)",
      "see": [
        "#/topic/linked-lists"
      ],
      "check": "assert to_list(build([1,2,3])) == [1,2,3]\nassert build([]) is None"
    },
    {
      "id": "ds-ll-doubly",
      "title": "Doubly linked list: implement with sentinels",
      "q": [
        "doubly linked list implementation python",
        "how does a doubly linked list work",
        "prev and next pointers",
        "insert and remove in a doubly linked list",
        "doubly linked list vs singly"
      ],
      "tags": "doubly linked list prev next sentinel head tail remove O(1) deque",
      "a": "A doubly linked list keeps `prev` and `next` pointers so any node can unlink itself in O(1) without knowing its predecessor. Use two sentinel nodes (head and tail) so inserts and removes never touch None.",
      "code": {
        "py": "class DNode:\n    def __init__(self, val=0):\n        self.val, self.prev, self.next = val, None, None\n\nclass DList:\n    def __init__(self):\n        self.head, self.tail = DNode(), DNode()\n        self.head.next, self.tail.prev = self.tail, self.head\n        self.size = 0\n    def add_front(self, val):\n        n = DNode(val); n.prev, n.next = self.head, self.head.next\n        self.head.next.prev = n; self.head.next = n; self.size += 1\n        return n\n    def remove(self, n):               # O(1) given the node\n        n.prev.next, n.next.prev = n.next, n.prev; self.size -= 1\n    def items(self):\n        out, n = [], self.head.next\n        while n is not self.tail:\n            out.append(n.val); n = n.next\n        return out\n\nd = DList(); a = d.add_front(1); b = d.add_front(2); d.add_front(3)\nd.remove(b)\nprint(d.items())   # [3, 1]"
      },
      "more": "- Costs one extra pointer per node.\n- It is the backbone of LRU caches and deques.",
      "cx": "insert/remove at a known node O(1); search O(n)",
      "see": [
        "#/topic/linked-lists",
        "#/topic/design-ds"
      ],
      "check": "assert d.items() == [3,1] and d.size == 2\nd.remove(a); assert d.items() == [3]"
    },
    {
      "id": "ds-ll-insert-delete",
      "title": "Insert and delete in a singly linked list",
      "q": [
        "how to insert a node in a linked list",
        "delete a node from a linked list",
        "remove node with given value linked list",
        "delete node by value python",
        "insert at head and tail of linked list"
      ],
      "tags": "linked list insert delete remove node value head tail dummy",
      "a": "To insert after node `p`: `n.next = p.next; p.next = n`. To delete a value, walk with a dummy head and a `prev` pointer and skip the node: `prev.next = prev.next.next`.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef push_front(head, v):\n    return ListNode(v, head)\n\ndef delete_value(head, target):\n    dummy = ListNode(0, head); prev = dummy\n    while prev.next:\n        if prev.next.val == target:\n            prev.next = prev.next.next      # unlink (removes all matches)\n        else:\n            prev = prev.next\n    return dummy.next\n\nh = push_front(build([2, 3, 3, 4]), 1)\nh = delete_value(h, 3)\nprint(to_list(h))   # [1, 2, 4]"
      },
      "more": "- Deleting the head needs the dummy; do not special-case it.\n- Only advance `prev` when you did not delete.",
      "cx": "O(n) to find, O(1) to splice",
      "see": [
        "#/topic/linked-lists",
        "#/problem/203"
      ],
      "check": "assert to_list(h) == [1,2,4]\nassert to_list(delete_value(build([5]),5)) == []\nassert to_list(delete_value(build([1,1,2]),1)) == [2]"
    },
    {
      "id": "ds-ll-reverse-iter",
      "title": "Reverse a linked list iteratively",
      "q": [
        "how to reverse a linked list",
        "reverse linked list python",
        "reverse a singly linked list iterative",
        "flip linked list pointers",
        "reverse linked list in place"
      ],
      "tags": "reverse linked list iterative prev curr next pointers in place",
      "a": "Walk the list keeping `prev` (starts None); at each node save `next`, point the node back at `prev`, then advance both. When `cur` is None, `prev` is the new head.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef reverse(head):\n    prev, cur = None, head\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev, cur = cur, nxt\n    return prev\n\nprint(to_list(reverse(build([1, 2, 3, 4]))))   # [4, 3, 2, 1]"
      },
      "more": "- Save `cur.next` BEFORE overwriting it.\n- Same trick reverses a sublist (LeetCode 92).",
      "cx": "O(n) time, O(1) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/206"
      ],
      "check": "assert to_list(reverse(build([1,2,3,4]))) == [4,3,2,1]\nassert reverse(None) is None\nassert to_list(reverse(build([7]))) == [7]"
    },
    {
      "id": "ds-ll-reverse-rec",
      "title": "Reverse a linked list recursively",
      "q": [
        "reverse linked list recursion",
        "recursive reverse of a linked list",
        "reverse linked list recursively python",
        "how does recursive linked list reversal work"
      ],
      "tags": "reverse linked list recursive recursion base case head.next.next",
      "a": "Reverse the rest (`head.next` onward) recursively, then make the next node point back at `head` and cut `head.next`. The base case is an empty or one-node list.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef reverse(head):\n    if not head or not head.next:\n        return head\n    new_head = reverse(head.next)\n    head.next.next = head     # the node after head now points back\n    head.next = None\n    return new_head\n\nprint(to_list(reverse(build([1, 2, 3]))))   # [3, 2, 1]"
      },
      "more": "- Uses O(n) call stack, so a very long list can hit Python recursion limit (about 1000); prefer the iterative version.",
      "cx": "O(n) time, O(n) stack",
      "see": [
        "#/topic/linked-lists",
        "#/topic/recursion"
      ],
      "check": "assert to_list(reverse(build([1,2,3]))) == [3,2,1]\nassert reverse(None) is None"
    },
    {
      "id": "ds-ll-middle",
      "title": "Find the middle of a linked list",
      "q": [
        "how to find the middle node of a linked list",
        "fast and slow pointer middle",
        "middle of linked list python",
        "find middle of linked list in one pass"
      ],
      "tags": "middle linked list slow fast pointer tortoise hare one pass",
      "a": "Move `slow` one step and `fast` two steps; when `fast` reaches the end, `slow` is at the middle. For even length this returns the second middle.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef middle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    return slow\n\nprint(middle(build([1, 2, 3, 4, 5])).val)   # 3"
      },
      "more": "- For the first middle of an even list use `while fast.next and fast.next.next`.",
      "cx": "O(n) time, O(1) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/876"
      ],
      "check": "assert middle(build([1,2,3,4,5])).val == 3\nassert middle(build([1,2,3,4])).val == 3\nassert middle(build([9])).val == 9"
    },
    {
      "id": "ds-ll-cycle",
      "title": "Detect a cycle in a linked list",
      "q": [
        "how to detect a cycle in a linked list",
        "linked list has cycle",
        "floyd cycle detection",
        "tortoise and hare algorithm",
        "detect loop in linked list python"
      ],
      "tags": "cycle loop detect linked list floyd tortoise hare slow fast visited set",
      "a": "Floyd's algorithm: move `slow` by 1 and `fast` by 2. If they ever meet there is a cycle; if `fast` hits None there is not. It needs O(1) space (a visited set also works in O(n) space).",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n        if slow is fast:\n            return True\n    return False\n\nh = build([1, 2, 3, 4]); h.next.next.next.next = h.next   # 4 -> 2\nprint(has_cycle(h), has_cycle(build([1, 2])))   # True False"
      },
      "more": "- Compare nodes with `is`, not values.\n- Fast pointer gains one node per step so it must catch slow inside the loop.",
      "cx": "O(n) time, O(1) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/141"
      ],
      "check": "assert has_cycle(h) and not has_cycle(build([1,2])) and not has_cycle(None)"
    },
    {
      "id": "ds-ll-cycle-start",
      "title": "Find where a linked list cycle begins",
      "q": [
        "find the start of a cycle in a linked list",
        "linked list cycle ii",
        "node where the cycle begins",
        "floyd phase 2 reset pointer"
      ],
      "tags": "cycle start entry node linked list floyd phase two reset head",
      "a": "After slow and fast meet, restart one pointer at `head` and move both one step at a time; they meet exactly at the cycle entry. This works because distance head-to-entry equals distance meeting-point-to-entry (mod cycle length).",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef cycle_start(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n        if slow is fast:\n            slow = head\n            while slow is not fast:\n                slow, fast = slow.next, fast.next\n            return slow\n    return None\n\nh = build([1, 2, 3, 4, 5]); h.next.next.next.next.next = h.next.next   # 5 -> 3\nprint(cycle_start(h).val)   # 3"
      },
      "more": "Let a = head to entry, b = entry to meeting point, c = cycle length. Slow walked a+b, fast 2(a+b), so a+b is a multiple of c, giving a = (k*c - b).",
      "cx": "O(n) time, O(1) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/142"
      ],
      "check": "assert cycle_start(h).val == 3 and cycle_start(build([1,2,3])) is None"
    },
    {
      "id": "ds-ll-merge-sorted",
      "title": "Merge two sorted linked lists",
      "q": [
        "merge two sorted linked lists",
        "merge sorted lists python",
        "combine two sorted lists into one",
        "merge two sorted linked lists iteratively"
      ],
      "tags": "merge sorted linked list two lists dummy tail splice",
      "a": "Use a dummy head and a `tail` pointer; repeatedly attach the smaller of the two front nodes, then attach whatever remains. No new nodes are needed.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef merge(a, b):\n    dummy = tail = ListNode()\n    while a and b:\n        if a.val <= b.val:\n            tail.next, a = a, a.next\n        else:\n            tail.next, b = b, b.next\n        tail = tail.next\n    tail.next = a or b\n    return dummy.next\n\nprint(to_list(merge(build([1, 3, 5]), build([2, 4, 6]))))   # [1, 2, 3, 4, 5, 6]"
      },
      "more": "- `<=` keeps the merge stable.\n- Merging k lists: use a heap of heads (O(N log k)).",
      "cx": "O(n + m) time, O(1) extra space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/21"
      ],
      "check": "assert to_list(merge(build([1,3,5]),build([2,4,6]))) == [1,2,3,4,5,6]\nassert to_list(merge(None,build([1]))) == [1]\nassert merge(None,None) is None"
    },
    {
      "id": "ds-ll-remove-nth",
      "title": "Remove the nth node from the end of a linked list",
      "q": [
        "remove nth node from end of list",
        "delete kth node from the end",
        "two pointers gap n linked list",
        "remove nth from end python"
      ],
      "tags": "remove nth node from end linked list two pointers gap dummy one pass",
      "a": "Advance `fast` n steps ahead of `slow` (both starting at a dummy), then move both until `fast` is at the last node. `slow` is now just before the target; unlink it.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef remove_nth(head, n):\n    dummy = ListNode(0, head)\n    fast = slow = dummy\n    for _ in range(n):\n        fast = fast.next\n    while fast.next:\n        fast, slow = fast.next, slow.next\n    slow.next = slow.next.next\n    return dummy.next\n\nprint(to_list(remove_nth(build([1, 2, 3, 4, 5]), 2)))   # [1, 2, 3, 5]"
      },
      "more": "- The dummy handles removing the head.",
      "cx": "O(n) time, O(1) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/19"
      ],
      "check": "assert to_list(remove_nth(build([1,2,3,4,5]),2)) == [1,2,3,5]\nassert remove_nth(build([1]),1) is None\nassert to_list(remove_nth(build([1,2]),2)) == [2]"
    },
    {
      "id": "ds-ll-palindrome",
      "title": "Check if a linked list is a palindrome",
      "q": [
        "palindrome linked list",
        "is a linked list a palindrome",
        "check palindrome linked list in o(1) space",
        "palindrome list reverse second half"
      ],
      "tags": "palindrome linked list reverse second half middle slow fast compare",
      "a": "Find the middle, reverse the second half in place, then compare it with the first half node by node. That is O(n) time and O(1) space; copying values into an array is the simpler O(n)-space option.",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef is_palindrome(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    prev = None\n    while slow:                      # reverse second half\n        nxt = slow.next\n        slow.next = prev\n        prev, slow = slow, nxt\n    a, b = head, prev\n    while b:\n        if a.val != b.val:\n            return False\n        a, b = a.next, b.next\n    return True\n\nprint(is_palindrome(build([1, 2, 2, 1])))   # True"
      },
      "more": "- It mutates the list; reverse the half back if the caller needs it intact.",
      "cx": "O(n) time, O(1) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/234"
      ],
      "check": "assert is_palindrome(build([1,2,2,1])) and is_palindrome(build([1,2,1]))\nassert not is_palindrome(build([1,2])) and is_palindrome(None)"
    },
    {
      "id": "ds-ll-intersection",
      "title": "Find the intersection node of two linked lists",
      "q": [
        "intersection of two linked lists",
        "where two linked lists merge",
        "get intersection node",
        "two pointers switch heads"
      ],
      "tags": "intersection linked list two lists common node switch heads pointers",
      "a": "Walk pointers `a` and `b` one step at a time; when one reaches the end, restart it on the other list's head. Both then travel the same total length and meet at the intersection (or both become None).",
      "code": {
        "py": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef build(vals):\n    dummy = cur = ListNode()\n    for v in vals:\n        cur.next = ListNode(v); cur = cur.next\n    return dummy.next\n\ndef to_list(head):\n    out = []\n    while head:\n        out.append(head.val); head = head.next\n    return out\ndef intersection(ha, hb):\n    a, b = ha, hb\n    while a is not b:\n        a = a.next if a else hb\n        b = b.next if b else ha\n    return a\n\ncommon = build([8, 9])\nx = build([1, 2]); x.next.next = common\ny = build([5]); y.next = common\nprint(intersection(x, y).val)   # 8"
      },
      "more": "- Compares node identity (`is`), not values.",
      "cx": "O(n + m) time, O(1) space",
      "see": [
        "#/topic/linked-lists"
      ],
      "check": "assert intersection(x, y) is common\nassert intersection(build([1]), build([2])) is None"
    },
    {
      "id": "ds-ll-copy-random",
      "title": "Copy a linked list with random pointers",
      "q": [
        "copy list with random pointer",
        "deep copy a linked list with random pointers",
        "clone linked list random pointer python",
        "copy random list hash map"
      ],
      "tags": "deep copy random pointer linked list clone hash map old to new",
      "a": "Two passes with a dict mapping old node to new node: first create all copies, then wire `next` and `random` through the dict. That is O(n) time and O(n) space.",
      "code": {
        "py": "class Node:\n    def __init__(self, val, next=None, random=None):\n        self.val, self.next, self.random = val, next, random\n\ndef copy_random_list(head):\n    m = {None: None}\n    cur = head\n    while cur:\n        m[cur] = Node(cur.val); cur = cur.next\n    cur = head\n    while cur:\n        m[cur].next = m[cur.next]\n        m[cur].random = m[cur.random]\n        cur = cur.next\n    return m[head]\n\na, b = Node(1), Node(2); a.next = b; a.random = b; b.random = b\nc = copy_random_list(a)\nprint(c.val, c.random.val, c.next.random is c.next)   # 1 2 True"
      },
      "more": "- O(1)-space variant: weave copies between originals, set randoms, then split.",
      "cx": "O(n) time, O(n) space",
      "see": [
        "#/topic/linked-lists",
        "#/problem/138"
      ],
      "check": "assert c is not a and c.next is not b and c.random is c.next and c.next.random is c.next\nassert copy_random_list(None) is None"
    },
    {
      "id": "ds-stack-what",
      "title": "Stack in Python (LIFO)",
      "q": [
        "what is a stack",
        "how to implement a stack in python",
        "stack push pop peek",
        "python stack using list",
        "lifo data structure"
      ],
      "tags": "stack lifo push pop peek list append top",
      "a": "A stack is last-in-first-out: only the top is accessible. In Python use a list: `append` to push, `pop()` to pop, `[-1]` to peek; all O(1). Check emptiness before popping.",
      "code": {
        "py": "class Stack:\n    def __init__(self): self.a = []\n    def push(self, x): self.a.append(x)\n    def pop(self): return self.a.pop()\n    def peek(self): return self.a[-1]\n    def __len__(self): return len(self.a)\n\ns = Stack(); s.push(1); s.push(2)\nprint(s.pop(), s.peek(), len(s))   # 2 1 1"
      },
      "more": "- Truthiness: `if stack:` means non-empty.\n- Typical uses: matching brackets, undo, DFS, expression parsing, monotonic stacks.",
      "cx": "push/pop/peek O(1)",
      "see": [
        "#/topic/stacks",
        "#/cheatsheets/python"
      ],
      "check": "s2 = Stack(); s2.push(5); assert s2.pop() == 5 and len(s2) == 0\ntry:\n    s2.pop(); assert False\nexcept IndexError:\n    pass"
    },
    {
      "id": "ds-stack-min",
      "title": "Stack with O(1) get-min",
      "q": [
        "min stack",
        "implement a stack that returns the minimum in constant time",
        "stack with getmin o(1)",
        "track minimum in a stack"
      ],
      "tags": "min stack getmin constant time auxiliary stack minimum",
      "a": "Push a pair (value, minimum so far) on each push. The current min is the second item of the top pair, so `get_min` is O(1) and pop needs no recomputation.",
      "code": {
        "py": "class MinStack:\n    def __init__(self): self.s = []\n    def push(self, x):\n        self.s.append((x, min(x, self.s[-1][1]) if self.s else x))\n    def pop(self): return self.s.pop()[0]\n    def top(self): return self.s[-1][0]\n    def get_min(self): return self.s[-1][1]\n\nm = MinStack()\nfor x in (5, 3, 7, 3): m.push(x)\nprint(m.get_min()); m.pop(); m.pop(); print(m.get_min())   # 3 3"
      },
      "more": "- Alternative: a second stack of minimums, pushed only when x <= current min.",
      "cx": "all operations O(1), O(n) space",
      "see": [
        "#/topic/stacks",
        "#/problem/155"
      ],
      "check": "assert m.get_min() == 3\nm.pop(); assert m.get_min() == 5 and m.top() == 5"
    },
    {
      "id": "ds-stack-parens",
      "title": "Valid parentheses with a stack",
      "q": [
        "valid parentheses",
        "check balanced brackets",
        "balanced parentheses python",
        "bracket matching stack",
        "are brackets matched"
      ],
      "tags": "valid parentheses balanced brackets stack matching ( ) [ ] { }",
      "a": "Push each opening bracket; on a closing bracket the stack must be non-empty and its top must be the matching opener. The string is valid only if the stack is empty at the end.",
      "code": {
        "py": "def is_valid(s):\n    pair = {')': '(', ']': '[', '}': '{'}\n    st = []\n    for ch in s:\n        if ch in pair:\n            if not st or st.pop() != pair[ch]:\n                return False\n        else:\n            st.append(ch)\n    return not st\n\nprint(is_valid(\"([]{})\"), is_valid(\"(]\"))   # True False"
      },
      "more": "- Early exit: odd length can never be valid.",
      "cx": "O(n) time, O(n) space",
      "see": [
        "#/topic/stacks",
        "#/problem/20"
      ],
      "check": "assert is_valid(\"([]{})\") and not is_valid(\"(]\") and not is_valid(\"(\") and not is_valid(\")\") and is_valid(\"\")"
    },
    {
      "id": "ds-stack-postfix",
      "title": "Evaluate a postfix (RPN) expression",
      "q": [
        "evaluate reverse polish notation",
        "postfix expression evaluation stack",
        "rpn calculator python",
        "evaluate postfix"
      ],
      "tags": "postfix rpn reverse polish notation evaluate stack operators operands",
      "a": "Scan tokens left to right: push numbers; on an operator pop the right operand then the left, apply it, push the result. The answer is the last item left. Mind the operand order for - and /.",
      "code": {
        "py": "def eval_rpn(tokens):\n    st = []\n    for t in tokens:\n        if t in (\"+\", \"-\", \"*\", \"/\"):\n            b, a = st.pop(), st.pop()\n            st.append(a + b if t == \"+\" else a - b if t == \"-\" else a * b if t == \"*\" else int(a / b))\n        else:\n            st.append(int(t))\n    return st[0]\n\nprint(eval_rpn([\"2\", \"1\", \"+\", \"3\", \"*\"]))   # 9"
      },
      "more": "- `int(a / b)` truncates toward zero (matches C/Java); `a // b` floors and differs for negatives.",
      "cx": "O(n) time, O(n) space",
      "see": [
        "#/topic/stacks",
        "#/problem/150"
      ],
      "check": "assert eval_rpn([\"2\",\"1\",\"+\",\"3\",\"*\"]) == 9\nassert eval_rpn([\"4\",\"13\",\"5\",\"/\",\"+\"]) == 6\nassert eval_rpn([\"3\",\"-4\",\"/\"]) == 0"
    },
    {
      "id": "ds-stack-next-greater",
      "title": "Next greater element with a stack",
      "q": [
        "next greater element",
        "find next larger element to the right",
        "next greater element python monotonic stack",
        "for each element find the next bigger one"
      ],
      "tags": "next greater element monotonic stack decreasing indices right larger",
      "a": "Scan once keeping a stack of indices whose next-greater is still unknown (values decreasing). When the current value beats the top, pop and record the current value as its answer.",
      "code": {
        "py": "def next_greater(nums):\n    res, st = [-1] * len(nums), []\n    for i, x in enumerate(nums):\n        while st and nums[st[-1]] < x:\n            res[st.pop()] = x\n        st.append(i)\n    return res\n\nprint(next_greater([2, 1, 2, 4, 3]))   # [4, 2, 4, -1, -1]"
      },
      "more": "- Each index is pushed and popped once: O(n).\n- For circular arrays loop 2n and use `i % n`.",
      "cx": "O(n) time, O(n) space",
      "see": [
        "#/topic/monotonic",
        "#/topic/stacks"
      ],
      "check": "assert next_greater([2,1,2,4,3]) == [4,2,4,-1,-1]\nassert next_greater([]) == [] and next_greater([3,2,1]) == [-1,-1,-1]"
    },
    {
      "id": "ds-queue-two-stacks",
      "title": "Implement a queue using two stacks",
      "q": [
        "queue using two stacks",
        "implement queue with stacks",
        "two stack queue amortized",
        "how to make a queue from stacks"
      ],
      "tags": "queue two stacks in out amortized enqueue dequeue implement",
      "a": "Push onto an `inbox` stack. To dequeue, if `outbox` is empty move everything from inbox to outbox (reversing the order), then pop outbox. Each element moves at most once, so operations are amortized O(1).",
      "code": {
        "py": "class MyQueue:\n    def __init__(self): self.inb, self.out = [], []\n    def push(self, x): self.inb.append(x)\n    def _shift(self):\n        if not self.out:\n            while self.inb: self.out.append(self.inb.pop())\n    def pop(self): self._shift(); return self.out.pop()\n    def peek(self): self._shift(); return self.out[-1]\n    def empty(self): return not self.inb and not self.out\n\nq = MyQueue(); q.push(1); q.push(2)\nprint(q.pop(), q.peek())   # 1 2"
      },
      "more": "- Only refill outbox when it is empty, otherwise order breaks.",
      "cx": "amortized O(1) per op",
      "see": [
        "#/topic/queues",
        "#/problem/232"
      ],
      "check": "assert q.pop() == 2 and q.empty()\nq.push(7); q.push(8); assert q.pop() == 7"
    },
    {
      "id": "ds-queue-deque",
      "title": "Queue in Python with collections.deque",
      "q": [
        "how to implement a queue in python",
        "python queue deque",
        "fifo queue python",
        "why not use list.pop(0) for a queue",
        "enqueue dequeue python"
      ],
      "tags": "queue deque fifo popleft append enqueue dequeue collections",
      "a": "Use `collections.deque`: `append(x)` to enqueue and `popleft()` to dequeue, both O(1). `list.pop(0)` is O(n) because it shifts all items.",
      "code": {
        "py": "from collections import deque\nq = deque()\nq.append(1); q.append(2); q.append(3)\nfront = q.popleft()\nprint(front, q[0], len(q))   # 1 2 2"
      },
      "more": "- `queue.Queue` is the thread-safe version (slower).\n- A deque also supports `appendleft` / `pop` at O(1), so it is a double-ended queue.\n- Indexing in the middle is O(n).",
      "cx": "append/popleft O(1)",
      "see": [
        "#/topic/queues",
        "#/cheatsheets/python"
      ],
      "check": "assert front == 1 and list(q) == [2,3]\nassert not deque()"
    },
    {
      "id": "ds-queue-circular",
      "title": "Circular buffer (ring queue) with fixed capacity",
      "q": [
        "circular queue implementation",
        "ring buffer",
        "design circular queue",
        "fixed size queue using array",
        "circular buffer python"
      ],
      "tags": "circular queue ring buffer fixed capacity head size modulo array",
      "a": "Keep a fixed array, a `head` index and a `size`. Enqueue writes at `(head + size) % cap`; dequeue reads at `head` then advances it with modulo. Tracking `size` avoids the full-versus-empty ambiguity.",
      "code": {
        "py": "class RingQueue:\n    def __init__(self, cap):\n        self.a, self.cap, self.head, self.size = [None] * cap, cap, 0, 0\n    def enqueue(self, x):\n        if self.size == self.cap: return False\n        self.a[(self.head + self.size) % self.cap] = x\n        self.size += 1; return True\n    def dequeue(self):\n        if not self.size: raise IndexError(\"empty\")\n        x = self.a[self.head]\n        self.head = (self.head + 1) % self.cap; self.size -= 1\n        return x\n\nr = RingQueue(2); r.enqueue(1); r.enqueue(2); print(r.enqueue(3))   # False\nprint(r.dequeue()); r.enqueue(3); print(r.dequeue(), r.dequeue())   # 1 2 3"
      },
      "more": "- All operations O(1), no shifting; used for bounded streams and buffers.",
      "cx": "O(1) per op, O(capacity) space",
      "see": [
        "#/topic/queues",
        "#/problem/622"
      ],
      "check": "assert r.size == 0 and r.enqueue(9) and r.dequeue() == 9"
    },
    {
      "id": "ds-stack-two-queues",
      "title": "Implement a stack using queues",
      "q": [
        "stack using queues",
        "implement stack with two queues",
        "stack with one queue rotate",
        "lifo from fifo"
      ],
      "tags": "stack two queues one queue rotate deque implement push pop",
      "a": "Simplest: use one queue; after appending x, rotate the previous items behind it (`len-1` times `popleft` then `append`) so the newest item sits at the front. Push is O(n), pop and top are O(1).",
      "code": {
        "py": "from collections import deque\n\nclass MyStack:\n    def __init__(self): self.q = deque()\n    def push(self, x):\n        self.q.append(x)\n        for _ in range(len(self.q) - 1):\n            self.q.append(self.q.popleft())\n    def pop(self): return self.q.popleft()\n    def top(self): return self.q[0]\n    def empty(self): return not self.q\n\ns = MyStack(); s.push(1); s.push(2); s.push(3)\nprint(s.pop(), s.top())   # 3 2"
      },
      "more": "- A true two-queue version moves items between queues on every push or pop; same O(n) on one side.",
      "cx": "push O(n), pop/top O(1)",
      "see": [
        "#/topic/queues",
        "#/problem/225"
      ],
      "check": "assert s.pop() == 2 and s.pop() == 1 and s.empty()"
    },
    {
      "id": "ds-sliding-window-max",
      "title": "Sliding window maximum with a monotonic deque",
      "q": [
        "sliding window maximum",
        "max of every window of size k",
        "monotonic deque sliding window",
        "window maximum in o(n)"
      ],
      "tags": "sliding window maximum monotonic deque decreasing indices k window max",
      "a": "Keep a deque of indices whose values are decreasing. For each new element pop smaller values from the back, push its index, drop the front index if it left the window, and the front is the window maximum.",
      "code": {
        "py": "from collections import deque\n\ndef max_sliding_window(nums, k):\n    dq, out = deque(), []          # indices, values decreasing\n    for i, x in enumerate(nums):\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()\n        dq.append(i)\n        if dq[0] <= i - k:\n            dq.popleft()\n        if i >= k - 1:\n            out.append(nums[dq[0]])\n    return out\n\nprint(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))   # [3, 3, 5, 5, 6, 7]"
      },
      "more": "- Each index enters and leaves once: O(n) total.",
      "cx": "O(n) time, O(k) space",
      "see": [
        "#/topic/monotonic",
        "#/topic/sliding-window",
        "#/problem/239"
      ],
      "check": "assert max_sliding_window([1,3,-1,-3,5,3,6,7],3) == [3,3,5,5,6,7]\nassert max_sliding_window([1],1) == [1] and max_sliding_window([4,3,2],1) == [4,3,2]"
    },
    {
      "id": "ds-heap-what",
      "title": "What is a heap / priority queue (and heapq basics)",
      "q": [
        "what is a heap",
        "what is a priority queue",
        "how does heapq work in python",
        "min heap python",
        "binary heap explained"
      ],
      "tags": "heap priority queue binary heap heapq min heap push pop peek heapify",
      "a": "A binary heap is a complete binary tree stored in an array where each parent is <= its children (min-heap). It gives O(1) peek-min and O(log n) push and pop. Python's `heapq` is a min-heap on a plain list.",
      "code": {
        "py": "import heapq\nh = []\nfor x in [5, 2, 8, 1]:\n    heapq.heappush(h, x)\nprint(h[0])                 # 1  (peek the min)\nprint(heapq.heappop(h))     # 1\nprint(heapq.heappop(h))     # 2"
      },
      "more": "- `heapq.heapify(list)` turns a list into a heap in O(n).\n- Only `h[0]` is guaranteed to be the smallest; the rest of the list is not sorted.\n- Use tuples `(priority, item)` for priorities.",
      "cx": "peek O(1); push, pop O(log n); heapify O(n)",
      "see": [
        "#/topic/heaps",
        "#/cheatsheets/python"
      ],
      "check": "assert h == [5, 8] or sorted(h) == [5, 8]\nassert heapq.heappop(h) == 5"
    },
    {
      "id": "ds-heapq-maxheap",
      "title": "Max heap in Python",
      "q": [
        "how to make a max heap in python",
        "heapq max heap",
        "python priority queue largest first",
        "heap with negative numbers",
        "max heap with tuples"
      ],
      "tags": "max heap heapq negate negative largest python priority",
      "a": "heapq only has a min-heap, so store negated values (or `(-priority, item)` tuples) and negate again when you pop.",
      "code": {
        "py": "import heapq\nh = []\nfor x in [3, 9, 4]:\n    heapq.heappush(h, -x)\nprint(-heapq.heappop(h))        # 9\nprint(-h[0])                    # 4  (peek max)\n\njobs = []\nheapq.heappush(jobs, (-5, \"email\")); heapq.heappush(jobs, (-9, \"deploy\"))\nprint(heapq.heappop(jobs)[1])   # deploy"
      },
      "more": "- Tuple ties compare the next field, so a non-comparable item can raise TypeError; add a counter as a tiebreaker: `(-p, count, item)`.",
      "cx": "push/pop O(log n)",
      "see": [
        "#/topic/heaps",
        "#/cheatsheets/python"
      ],
      "check": "assert -h[0] == 4 and heapq.heappop(jobs)[1] == \"email\""
    },
    {
      "id": "ds-heap-scratch",
      "title": "Implement a min heap from scratch",
      "q": [
        "implement a heap from scratch",
        "how to build a binary heap in python",
        "min heap class push pop",
        "sift up sift down implementation",
        "write your own priority queue"
      ],
      "tags": "heap from scratch implement min heap class push pop sift up sift down array",
      "a": "Store the tree in a list. `push` appends and sifts the new item up while it is smaller than its parent. `pop` swaps the root with the last item, removes it, then sifts the new root down toward its smaller child.",
      "code": {
        "py": "class MinHeap:\n    def __init__(self): self.a = []\n    def push(self, x):\n        a = self.a; a.append(x); i = len(a) - 1\n        while i and a[i] < a[(i - 1) // 2]:\n            a[i], a[(i - 1) // 2] = a[(i - 1) // 2], a[i]; i = (i - 1) // 2\n    def pop(self):\n        a = self.a; a[0], a[-1] = a[-1], a[0]; top = a.pop()\n        i, n = 0, len(a)\n        while True:\n            l, r, m = 2 * i + 1, 2 * i + 2, i\n            if l < n and a[l] < a[m]: m = l\n            if r < n and a[r] < a[m]: m = r\n            if m == i: break\n            a[i], a[m] = a[m], a[i]; i = m\n        return top\n    def peek(self): return self.a[0]\n    def __len__(self): return len(self.a)\n\nh = MinHeap()\nfor x in [5, 3, 8, 1, 9]: h.push(x)\nprint([h.pop() for _ in range(len(h))])   # [1, 3, 5, 8, 9]"
      },
      "more": "- Pop from an empty heap raises IndexError here.\n- For a max heap flip the comparisons.",
      "cx": "push, pop O(log n); peek O(1)",
      "see": [
        "#/topic/heaps"
      ],
      "check": "h2 = MinHeap(); h2.push(2); assert h2.pop() == 2 and len(h2) == 0\nimport random\nxs = [random.randint(0,50) for _ in range(100)]\nh3 = MinHeap()\nfor x in xs: h3.push(x)\nassert [h3.pop() for _ in xs] == sorted(xs)"
    },
    {
      "id": "ds-heap-index-math",
      "title": "Heap array index formulas",
      "q": [
        "heap parent and child index",
        "binary heap array index math",
        "left child 2i+1",
        "how is a heap stored in an array",
        "parent of node i in heap"
      ],
      "tags": "heap index parent child left right 2i+1 2i+2 array complete tree",
      "a": "For a 0-indexed array heap: parent(i) = (i-1)//2, left(i) = 2i+1, right(i) = 2i+2. A complete tree has no gaps, so it packs into an array with no pointers. For a 1-indexed heap: parent i//2, children 2i and 2i+1.",
      "code": {
        "py": "def parent(i): return (i - 1) // 2\ndef left(i): return 2 * i + 1\ndef right(i): return 2 * i + 2\n\na = [1, 3, 2, 7, 4]\nprint(a[left(0)], a[right(0)], a[parent(4)])   # 3 2 3"
      },
      "more": "- The last internal node is at index n//2 - 1; heapify sifts down from there to 0.\n- Tree height is floor(log2 n).",
      "see": [
        "#/topic/heaps"
      ],
      "check": "assert parent(left(5)) == 5 and parent(right(5)) == 5 and a[parent(3)] == 3"
    },
    {
      "id": "ds-heapify",
      "title": "Heapify: build a heap in O(n)",
      "q": [
        "what is heapify",
        "build heap in linear time",
        "why is heapify o(n)",
        "bottom up heap construction",
        "heapify an array"
      ],
      "tags": "heapify build heap linear time bottom up sift down O(n)",
      "a": "Heapify turns an arbitrary array into a heap by sifting down every internal node from the last one (`n//2 - 1`) back to the root. It is O(n), not O(n log n), because most nodes sit near the bottom and sift only a few levels.",
      "code": {
        "py": "def sift_down(a, i, n):\n    while True:\n        l, r, m = 2 * i + 1, 2 * i + 2, i\n        if l < n and a[l] < a[m]: m = l\n        if r < n and a[r] < a[m]: m = r\n        if m == i: return\n        a[i], a[m] = a[m], a[i]; i = m\n\ndef heapify(a):\n    for i in range(len(a) // 2 - 1, -1, -1):\n        sift_down(a, i, len(a))\n\nxs = [9, 4, 7, 1, 2, 6]\nheapify(xs)\nprint(xs[0])   # 1"
      },
      "more": "- Work is sum over levels: n/2 nodes sift 0, n/4 sift 1, ... total about 2n.\n- Pushing n items one at a time is O(n log n).",
      "cx": "O(n)",
      "see": [
        "#/topic/heaps"
      ],
      "check": "import heapq\nassert xs[0] == 1\nys = [5,4,3,2,1]; heapify(ys)\nassert all(ys[(i-1)//2] <= ys[i] for i in range(1,5))\nheapq.heapify(ys)"
    },
    {
      "id": "ds-heap-sort",
      "title": "Heap sort implementation",
      "q": [
        "heap sort",
        "how does heapsort work",
        "implement heap sort in python",
        "heapsort time complexity",
        "sort using a heap"
      ],
      "tags": "heap sort heapsort in place max heap sift down O(n log n)",
      "a": "Build a max-heap in place, then repeatedly swap the root (largest) with the last unsorted slot, shrink the heap by one and sift the new root down. It is O(n log n) in every case, in place, but not stable.",
      "code": {
        "py": "def heap_sort(a):\n    n = len(a)\n    def sift(i, size):\n        while True:\n            l, r, m = 2 * i + 1, 2 * i + 2, i\n            if l < size and a[l] > a[m]: m = l\n            if r < size and a[r] > a[m]: m = r\n            if m == i: return\n            a[i], a[m] = a[m], a[i]; i = m\n    for i in range(n // 2 - 1, -1, -1):\n        sift(i, n)\n    for end in range(n - 1, 0, -1):\n        a[0], a[end] = a[end], a[0]\n        sift(0, end)\n    return a\n\nprint(heap_sort([4, 10, 3, 5, 1]))   # [1, 3, 4, 5, 10]"
      },
      "more": "- Poor cache behaviour, so quicksort is usually faster in practice.",
      "cx": "O(n log n) time, O(1) extra space",
      "see": [
        "#/topic/heaps",
        "#/topic/sorting"
      ],
      "check": "assert heap_sort([4,10,3,5,1]) == [1,3,4,5,10]\nassert heap_sort([]) == [] and heap_sort([2,2,1]) == [1,2,2]"
    },
    {
      "id": "ds-running-median",
      "title": "Running median with two heaps",
      "q": [
        "find median from data stream",
        "running median",
        "two heaps median",
        "streaming median python",
        "median of a stream"
      ],
      "tags": "median data stream two heaps max heap min heap running median balance",
      "a": "Keep a max-heap for the lower half and a min-heap for the upper half, sizes differing by at most one (lower may have one extra). The median is the top of the lower heap, or the average of both tops when sizes are equal.",
      "code": {
        "py": "import heapq\n\nclass MedianFinder:\n    def __init__(self): self.lo, self.hi = [], []   # lo: max-heap (negated), hi: min-heap\n    def add(self, x):\n        heapq.heappush(self.lo, -x)\n        heapq.heappush(self.hi, -heapq.heappop(self.lo))\n        if len(self.hi) > len(self.lo):\n            heapq.heappush(self.lo, -heapq.heappop(self.hi))\n    def median(self):\n        if len(self.lo) > len(self.hi): return -self.lo[0]\n        return (-self.lo[0] + self.hi[0]) / 2\n\nm = MedianFinder()\nfor x in [5, 2, 8]: m.add(x)\nprint(m.median()); m.add(1); print(m.median())   # 5 3.5"
      },
      "more": "- Insert O(log n), median O(1).\n- Alternative for bounded ranges: counting array or a balanced tree.",
      "cx": "add O(log n), median O(1), space O(n)",
      "see": [
        "#/topic/heaps",
        "#/problem/295"
      ],
      "check": "assert m.median() == 3.5\nm.add(9); assert m.median() == 5"
    },
    {
      "id": "ds-top-k",
      "title": "Top k elements with a heap",
      "q": [
        "top k frequent elements",
        "k largest elements",
        "find the kth largest element",
        "top k with heap python",
        "heapq nlargest"
      ],
      "tags": "top k largest frequent kth largest min heap size k heapq nlargest",
      "a": "For the k largest, keep a min-heap of size k: push each item and pop when the size exceeds k; what remains is the answer and the heap top is the kth largest. Or call `heapq.nlargest(k, items)`.",
      "code": {
        "py": "import heapq\nfrom collections import Counter\n\ndef kth_largest(nums, k):\n    h = []\n    for x in nums:\n        heapq.heappush(h, x)\n        if len(h) > k: heapq.heappop(h)\n    return h[0]\n\ndef top_k_frequent(nums, k):\n    return [x for x, _ in Counter(nums).most_common(k)]\n\nprint(kth_largest([3, 2, 1, 5, 6, 4], 2))        # 5\nprint(top_k_frequent([1, 1, 1, 2, 2, 3], 2))     # [1, 2]"
      },
      "more": "- Time O(n log k) and O(k) space, better than sorting when k is small.\n- Counter.most_common uses a heap internally when k is given.",
      "cx": "O(n log k) time, O(k) space",
      "see": [
        "#/topic/heaps",
        "#/problem/215",
        "#/problem/347"
      ],
      "check": "assert kth_largest([3,2,1,5,6,4],2) == 5 and kth_largest([1],1) == 1\nassert top_k_frequent([1,1,1,2,2,3],2) == [1,2]\nassert heapq.nlargest(2,[3,2,1,5]) == [5,3]"
    },
    {
      "id": "ds-hashmap-chaining",
      "title": "Hash map from scratch (separate chaining)",
      "q": [
        "implement a hash map",
        "design hashmap",
        "hash table from scratch python",
        "how does a hash map work internally",
        "hash table with chaining"
      ],
      "tags": "hash map hash table from scratch chaining buckets implement put get remove",
      "a": "A hash map hashes the key to a bucket index (`hash(k) % size`) and stores key/value pairs in a list per bucket (separate chaining). Lookups scan one short bucket, so average O(1); resizing keeps buckets short.",
      "code": {
        "py": "class HashMap:\n    def __init__(self, cap=8):\n        self.b = [[] for _ in range(cap)]; self.n = 0\n    def _bucket(self, k): return self.b[hash(k) % len(self.b)]\n    def put(self, k, v):\n        bucket = self._bucket(k)\n        for pair in bucket:\n            if pair[0] == k: pair[1] = v; return\n        bucket.append([k, v]); self.n += 1\n        if self.n > 0.75 * len(self.b): self._grow()\n    def get(self, k, default=None):\n        for kk, v in self._bucket(k):\n            if kk == k: return v\n        return default\n    def remove(self, k):\n        bucket = self._bucket(k)\n        for i, (kk, _) in enumerate(bucket):\n            if kk == k: bucket.pop(i); self.n -= 1; return True\n        return False\n    def _grow(self):\n        old = [p for bucket in self.b for p in bucket]\n        self.b = [[] for _ in range(2 * len(self.b))]\n        for k, v in old: self._bucket(k).append([k, v])\n\nm = HashMap()\nfor i in range(20): m.put(i, i * i)\nm.put(\"a\", 1); m.put(\"a\", 2)\nprint(m.get(7), m.get(\"a\"), m.get(\"zz\"))   # 49 2 None"
      },
      "more": "- Average O(1); worst case O(n) if everything collides.\n- Grow at a load factor around 0.75 and rehash every key.\n- Keys must be hashable and equal keys must hash equally.",
      "cx": "get/put/remove average O(1), worst O(n)",
      "see": [
        "#/topic/hashing-internals",
        "#/topic/arrays-hashing"
      ],
      "check": "assert m.get(7) == 49 and m.get(\"a\") == 2 and m.n == 21\nassert m.remove(7) and m.get(7) is None and not m.remove(7)"
    },
    {
      "id": "ds-hashmap-open-addressing",
      "title": "Hash map with open addressing (linear probing)",
      "q": [
        "open addressing hash table",
        "linear probing implementation",
        "hash table without chaining",
        "tombstone deletion hash",
        "probing collision resolution"
      ],
      "tags": "open addressing linear probing tombstone hash table collision probe",
      "a": "With open addressing every entry lives in the table itself. On a collision probe the next slot (`(i+1) % cap`) until a free slot is found. Deleting must leave a tombstone marker, otherwise later lookups stop early.",
      "code": {
        "py": "EMPTY, DEL = object(), object()\n\nclass ProbeMap:\n    def __init__(self, cap=8):\n        self.k = [EMPTY] * cap; self.v = [None] * cap; self.n = 0\n    def _find(self, key):\n        cap, i, first_del = len(self.k), hash(key) % len(self.k), None\n        for _ in range(cap):\n            if self.k[i] is EMPTY: return (first_del if first_del is not None else i), False\n            if self.k[i] is DEL:\n                if first_del is None: first_del = i\n            elif self.k[i] == key: return i, True\n            i = (i + 1) % cap\n        return first_del, False\n    def put(self, key, val):\n        if (self.n + 1) > 0.5 * len(self.k): self._grow()\n        i, found = self._find(key)\n        if not found: self.n += 1\n        self.k[i], self.v[i] = key, val\n    def get(self, key, default=None):\n        i, found = self._find(key)\n        return self.v[i] if found else default\n    def remove(self, key):\n        i, found = self._find(key)\n        if found: self.k[i] = DEL; self.v[i] = None; self.n -= 1\n        return found\n    def _grow(self):\n        items = [(a, b) for a, b in zip(self.k, self.v) if a is not EMPTY and a is not DEL]\n        self.k = [EMPTY] * (2 * len(self.k)); self.v = [None] * len(self.k); self.n = 0\n        for a, b in items: self.put(a, b)\n\nm = ProbeMap()\nfor i in range(10): m.put(i, i + 100)\nm.remove(3)\nprint(m.get(4), m.get(3))   # 104 None"
      },
      "more": "- Keep load factor low (about 0.5 to 0.7); performance collapses as the table fills.\n- Linear probing causes clustering; double hashing or quadratic probing reduce it.\n- CPython dict uses open addressing with a perturbed probe.",
      "cx": "average O(1) at low load factor",
      "see": [
        "#/topic/hashing-internals"
      ],
      "check": "assert m.get(4) == 104 and m.get(3) is None and m.n == 9\nm.put(3, 7); assert m.get(3) == 7"
    },
    {
      "id": "ds-hash-load-resize",
      "title": "Load factor and resizing in hash tables",
      "q": [
        "what is load factor",
        "why do hash tables resize",
        "hash table rehash",
        "when does a hash map grow",
        "load factor of hash map"
      ],
      "tags": "load factor resize rehash hash table grow capacity amortized",
      "a": "Load factor = entries / buckets. When it passes a threshold (often 0.75 for chaining) the table doubles its bucket array and re-inserts every key, because bucket index depends on table size. That O(n) rehash is amortized to O(1) per insert.",
      "code": {
        "py": "def load_factor(entries, buckets):\n    return entries / buckets\n\ncap, n = 8, 0\nresizes = 0\nfor _ in range(100):\n    n += 1\n    if load_factor(n, cap) > 0.75:\n        cap *= 2; resizes += 1\nprint(cap, resizes)   # 256 5"
      },
      "more": "- Higher load factor = less memory, more collisions.\n- Capacity is often a power of two (cheap mask) or a prime.",
      "cx": "rehash O(n), amortized O(1) per insert",
      "see": [
        "#/topic/hashing-internals"
      ],
      "check": "assert cap == 256 and resizes == 5 and load_factor(6, 8) == 0.75"
    },
    {
      "id": "ds-hash-set",
      "title": "Hash set from scratch",
      "q": [
        "implement a hash set",
        "design hashset",
        "set data structure implementation python",
        "how does a set work internally"
      ],
      "tags": "hash set from scratch design hashset add contains remove buckets",
      "a": "A hash set is a hash map with only keys: hash into a bucket, store each distinct key once. `add`, `contains` and `remove` are average O(1).",
      "code": {
        "py": "class HashSet:\n    def __init__(self, cap=16):\n        self.b = [[] for _ in range(cap)]; self.n = 0\n    def _bk(self, x): return self.b[hash(x) % len(self.b)]\n    def add(self, x):\n        bk = self._bk(x)\n        if x not in bk:\n            bk.append(x); self.n += 1\n            if self.n > 0.75 * len(self.b):\n                old = [y for bk in self.b for y in bk]\n                self.b = [[] for _ in range(2 * len(self.b))]\n                for y in old: self._bk(y).append(y)\n    def contains(self, x): return x in self._bk(x)\n    def remove(self, x):\n        bk = self._bk(x)\n        if x in bk: bk.remove(x); self.n -= 1\n\ns = HashSet()\nfor x in [1, 2, 2, 3]: s.add(x)\ns.remove(2)\nprint(s.contains(1), s.contains(2), s.n)   # True False 2"
      },
      "more": "- Python: `set()` gives this for free; `x in s` is O(1) average, `x in list` is O(n).",
      "cx": "average O(1) per op",
      "see": [
        "#/topic/hashing-internals",
        "#/topic/arrays-hashing"
      ],
      "check": "assert s.contains(3) and not s.contains(2) and s.n == 2\nfor i in range(100): s.add(i)\nassert s.contains(99) and s.n == 100"
    },
    {
      "id": "ds-hash-collisions",
      "title": "What is a hash collision and how is it handled?",
      "q": [
        "what is a hash collision",
        "how do hash tables handle collisions",
        "chaining vs open addressing",
        "collision resolution hash table",
        "why is hash map worst case o(n)"
      ],
      "tags": "hash collision chaining open addressing probing resolution worst case",
      "a": "A collision is two different keys landing in the same bucket. Chaining keeps a list per bucket; open addressing probes for another free slot. With many collisions operations degrade toward O(n), which is why good hashes and resizing matter.",
      "code": {
        "py": "# Two keys, same bucket (cap 4)\ncap = 4\nkeys = [1, 5, 9]\nprint([k % cap for k in keys])   # [1, 1, 1]  all collide\nbuckets = {}\nfor k in keys:\n    buckets.setdefault(k % cap, []).append(k)   # chaining\nprint(buckets)   # {1: [1, 5, 9]}"
      },
      "more": "- Chaining: simple deletes, extra memory. Open addressing: cache-friendly, needs tombstones, low load factor.\n- Java 8 HashMap turns long chains into balanced trees.\n- Python dicts and sets use open addressing.",
      "cx": "average O(1), worst O(n)",
      "see": [
        "#/topic/hashing-internals"
      ],
      "check": "assert buckets == {1: [1,5,9]} and len(set(k % cap for k in keys)) == 1"
    },
    {
      "id": "ds-bt-node",
      "title": "Binary tree node class and building a tree",
      "q": [
        "what is a binary tree",
        "binary tree node python",
        "how to create a binary tree",
        "build a tree from a list",
        "treenode class"
      ],
      "tags": "binary tree node left right root leaf height depth treenode build",
      "a": "A binary tree node holds a value and up to two children, `left` and `right`. You hold the root; a leaf has no children; depth counts edges down from the root. Most tree algorithms are a recursion on `left` and `right`.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\nroot = make([1, 2, 3, None, 4])\nprint(root.val, root.left.val, root.left.right.val, root.right.left)   # 1 2 4 None"
      },
      "more": "- Level-order list with None holes is the LeetCode input format.\n- A tree with n nodes has n-1 edges.",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert root.left.right.val == 4 and root.right.left is None and make([]) is None"
    },
    {
      "id": "ds-bt-dfs-recursive",
      "title": "Preorder, inorder, postorder traversal (recursive)",
      "q": [
        "tree traversals",
        "preorder inorder postorder",
        "binary tree dfs recursive",
        "inorder traversal python",
        "difference between preorder inorder and postorder"
      ],
      "tags": "preorder inorder postorder traversal dfs recursive binary tree root left right",
      "a": "Preorder visits root, left, right. Inorder visits left, root, right (sorted order for a BST). Postorder visits left, right, root (children before parent). All are O(n).",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef preorder(n, out):\n    if n: out.append(n.val); preorder(n.left, out); preorder(n.right, out)\ndef inorder(n, out):\n    if n: inorder(n.left, out); out.append(n.val); inorder(n.right, out)\ndef postorder(n, out):\n    if n: postorder(n.left, out); postorder(n.right, out); out.append(n.val)\n\nroot = make([1, 2, 3, 4, 5])\na, b, c = [], [], []\npreorder(root, a); inorder(root, b); postorder(root, c)\nprint(a, b, c)   # [1,2,4,5,3] [4,2,5,1,3] [4,5,2,3,1]"
      },
      "more": "- Preorder: copy/serialize a tree. Postorder: delete tree, compute heights. Inorder: BST sorted order.\n- Recursion depth equals tree height (O(n) for a skewed tree).",
      "cx": "O(n) time, O(h) stack",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert a == [1,2,4,5,3] and b == [4,2,5,1,3] and c == [4,5,2,3,1]"
    },
    {
      "id": "ds-bt-inorder-iter",
      "title": "Iterative inorder traversal",
      "q": [
        "inorder traversal without recursion",
        "iterative inorder python",
        "binary tree inorder using a stack",
        "inorder traversal iterative"
      ],
      "tags": "inorder iterative stack traversal without recursion binary tree",
      "a": "Go left as far as possible pushing nodes on a stack; pop to visit a node, then move to its right child and repeat.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef inorder(root):\n    out, st, cur = [], [], root\n    while cur or st:\n        while cur:\n            st.append(cur); cur = cur.left\n        cur = st.pop()\n        out.append(cur.val)\n        cur = cur.right\n    return out\n\nprint(inorder(make([1, None, 2, 3])))   # [1, 3, 2]"
      },
      "cx": "O(n) time, O(h) space",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert inorder(make([1,None,2,3])) == [1,3,2] and inorder(None) == []\nassert inorder(make([4,2,5,1,3])) == [1,2,3,4,5]"
    },
    {
      "id": "ds-bt-preorder-iter",
      "title": "Iterative preorder traversal",
      "q": [
        "preorder traversal without recursion",
        "iterative preorder python",
        "binary tree preorder using a stack",
        "preorder traversal iterative"
      ],
      "tags": "preorder iterative stack traversal without recursion binary tree dfs",
      "a": "Push the root. Pop a node, visit it, then push its right child and then its left child so the left is popped first.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef preorder(root):\n    out, st = [], [root] if root else []\n    while st:\n        n = st.pop()\n        out.append(n.val)\n        if n.right: st.append(n.right)\n        if n.left: st.append(n.left)\n    return out\n\nprint(preorder(make([1, 2, 3, 4, 5])))   # [1, 2, 4, 5, 3]"
      },
      "more": "- This is also the shape of iterative DFS on a graph.",
      "cx": "O(n) time, O(h) space",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert preorder(make([1,2,3,4,5])) == [1,2,4,5,3] and preorder(None) == []"
    },
    {
      "id": "ds-bt-postorder-iter",
      "title": "Iterative postorder traversal",
      "q": [
        "postorder traversal without recursion",
        "iterative postorder python",
        "postorder with one stack",
        "postorder traversal iterative"
      ],
      "tags": "postorder iterative stack traversal without recursion reverse preorder",
      "a": "Easiest way: do a preorder variant (root, right, left) with a stack and reverse the result, which gives left, right, root.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef postorder(root):\n    out, st = [], [root] if root else []\n    while st:\n        n = st.pop()\n        out.append(n.val)\n        if n.left: st.append(n.left)\n        if n.right: st.append(n.right)\n    return out[::-1]\n\nprint(postorder(make([1, 2, 3, 4, 5])))   # [4, 5, 2, 3, 1]"
      },
      "more": "- A true single-pass version tracks the last visited node; the reversal trick is shorter and usually fine.",
      "cx": "O(n) time, O(n) space",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert postorder(make([1,2,3,4,5])) == [4,5,2,3,1] and postorder(None) == []"
    },
    {
      "id": "ds-bt-level-order",
      "title": "Level order traversal (BFS) of a binary tree",
      "q": [
        "level order traversal",
        "bfs on a binary tree",
        "binary tree level by level python",
        "breadth first traversal of tree",
        "print tree by levels"
      ],
      "tags": "level order bfs queue breadth first binary tree levels deque",
      "a": "Use a queue. For each level take `len(queue)` nodes, collect their values, and enqueue their children. The result is a list of levels.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\nfrom collections import deque\n\ndef level_order(root):\n    res, q = [], deque([root] if root else [])\n    while q:\n        res.append([])\n        for _ in range(len(q)):\n            n = q.popleft()\n            res[-1].append(n.val)\n            if n.left: q.append(n.left)\n            if n.right: q.append(n.right)\n    return res\n\nprint(level_order(make([3, 9, 20, None, None, 15, 7])))   # [[3], [9, 20], [15, 7]]"
      },
      "more": "- Reverse the list for bottom-up order; take the last of each level for the right-side view.",
      "cx": "O(n) time, O(w) space (w = max width)",
      "see": [
        "#/topic/trees",
        "#/problem/102"
      ],
      "check": "assert level_order(make([3,9,20,None,None,15,7])) == [[3],[9,20],[15,7]] and level_order(None) == []"
    },
    {
      "id": "ds-bt-height",
      "title": "Height (max depth) of a binary tree",
      "q": [
        "height of a binary tree",
        "maximum depth of binary tree",
        "tree depth recursion",
        "how to find the depth of a tree"
      ],
      "tags": "height depth maximum depth binary tree recursion",
      "a": "Height is 1 + the larger height of the two subtrees, with an empty tree at 0 (counting nodes).",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef height(n):\n    return 0 if not n else 1 + max(height(n.left), height(n.right))\n\nprint(height(make([3, 9, 20, None, None, 15, 7])))   # 3"
      },
      "more": "- Count edges instead by returning -1 for an empty tree.",
      "cx": "O(n) time, O(h) stack",
      "see": [
        "#/topic/trees",
        "#/problem/104"
      ],
      "check": "assert height(make([3,9,20,None,None,15,7])) == 3 and height(None) == 0 and height(make([1])) == 1"
    },
    {
      "id": "ds-bt-diameter",
      "title": "Diameter of a binary tree",
      "q": [
        "diameter of binary tree",
        "longest path between two nodes in a tree",
        "tree diameter python",
        "binary tree diameter recursion"
      ],
      "tags": "diameter binary tree longest path height recursion two nodes",
      "a": "At each node the longest path through it is left height + right height. Compute heights bottom-up and track the maximum of that sum as you go (in edges).",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef diameter(root):\n    best = 0\n    def h(n):\n        nonlocal best\n        if not n: return 0\n        l, r = h(n.left), h(n.right)\n        best = max(best, l + r)\n        return 1 + max(l, r)\n    h(root)\n    return best\n\nprint(diameter(make([1, 2, 3, 4, 5])))   # 3"
      },
      "more": "- The diameter may not pass through the root, so the global max is needed.",
      "cx": "O(n) time",
      "see": [
        "#/topic/trees",
        "#/problem/543"
      ],
      "check": "assert diameter(make([1,2,3,4,5])) == 3 and diameter(None) == 0 and diameter(make([1,2])) == 1"
    },
    {
      "id": "ds-bt-balanced",
      "title": "Check if a binary tree is height-balanced",
      "q": [
        "balanced binary tree",
        "is a tree balanced",
        "check height balanced tree",
        "balanced tree o(n) solution"
      ],
      "tags": "balanced binary tree height difference at most one recursion -1 sentinel",
      "a": "A tree is balanced if at every node the subtree heights differ by at most 1. Return the height from each call, or -1 as soon as any subtree is unbalanced, so the whole check is O(n).",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef is_balanced(root):\n    def h(n):\n        if not n: return 0\n        l = h(n.left)\n        if l < 0: return -1\n        r = h(n.right)\n        if r < 0 or abs(l - r) > 1: return -1\n        return 1 + max(l, r)\n    return h(root) >= 0\n\nprint(is_balanced(make([3, 9, 20, None, None, 15, 7])))   # True"
      },
      "more": "- Calling height() at every node is O(n^2) in a skewed tree.",
      "cx": "O(n) time",
      "see": [
        "#/topic/trees",
        "#/problem/110"
      ],
      "check": "assert is_balanced(make([3,9,20,None,None,15,7])) and is_balanced(None)\nassert not is_balanced(make([1,2,2,3,3,None,None,4,4]))"
    },
    {
      "id": "ds-bt-same",
      "title": "Check if two binary trees are the same",
      "q": [
        "same tree",
        "compare two binary trees",
        "are two trees identical",
        "tree equality recursion"
      ],
      "tags": "same tree identical equal compare two binary trees recursion subtree",
      "a": "Two trees are the same if both are empty, or both roots have equal values and the left and right subtrees match. If exactly one is empty they differ.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef same(a, b):\n    if not a and not b: return True\n    if not a or not b or a.val != b.val: return False\n    return same(a.left, b.left) and same(a.right, b.right)\n\nprint(same(make([1, 2, 3]), make([1, 2, 3])), same(make([1, 2]), make([1, None, 2])))   # True False"
      },
      "more": "- Subtree-of-another-tree calls this at every node of the big tree.",
      "cx": "O(n) time",
      "see": [
        "#/topic/trees",
        "#/problem/100"
      ],
      "check": "assert same(make([1,2,3]),make([1,2,3])) and same(None,None)\nassert not same(make([1,2]),make([1,None,2])) and not same(make([1]),None)"
    },
    {
      "id": "ds-bt-invert",
      "title": "Invert (mirror) a binary tree",
      "q": [
        "invert binary tree",
        "mirror a binary tree",
        "flip a tree left right",
        "swap children of every node"
      ],
      "tags": "invert mirror flip binary tree swap left right children",
      "a": "Swap the left and right children at every node, recursively. The order does not matter as long as each node is swapped once.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef invert(n):\n    if n:\n        n.left, n.right = invert(n.right), invert(n.left)\n    return n\n\ndef level(n):\n    return [] if not n else [n.val] + level(n.left) + level(n.right)\n\nprint(level(invert(make([4, 2, 7, 1, 3, 6, 9]))))   # [4, 7, 9, 6, 2, 3, 1]"
      },
      "cx": "O(n) time, O(h) stack",
      "see": [
        "#/topic/trees",
        "#/problem/226"
      ],
      "check": "assert level(invert(make([4,2,7,1,3,6,9]))) == [4,7,9,6,2,3,1] and invert(None) is None"
    },
    {
      "id": "ds-bt-lca",
      "title": "Lowest common ancestor of a binary tree",
      "q": [
        "lowest common ancestor",
        "lca binary tree",
        "common ancestor of two nodes",
        "lca recursion python"
      ],
      "tags": "lowest common ancestor lca binary tree recursion two nodes p q",
      "a": "Recurse; if the current node is None, p or q return it. If both subtrees return a node, the current node is the LCA; otherwise return whichever side is non-null.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef lca(root, p, q):\n    if not root or root is p or root is q:\n        return root\n    l, r = lca(root.left, p, q), lca(root.right, p, q)\n    return root if l and r else l or r\n\nroot = make([3, 5, 1, 6, 2, 0, 8])\np, q = root.left, root.right\nprint(lca(root, p, q).val, lca(root, p, p.right).val)   # 3 5"
      },
      "more": "- For a BST use ordering: walk down while both values are on the same side.\n- Assumes both nodes exist in the tree.",
      "cx": "O(n) time, O(h) stack",
      "see": [
        "#/topic/trees",
        "#/problem/236"
      ],
      "check": "assert lca(root, p, q) is root and lca(root, p, p.right) is p"
    },
    {
      "id": "ds-bt-serialize",
      "title": "Serialize and deserialize a binary tree",
      "q": [
        "serialize and deserialize binary tree",
        "convert tree to string and back",
        "encode tree preorder with null markers",
        "tree to string python"
      ],
      "tags": "serialize deserialize binary tree string preorder null marker encode decode",
      "a": "Serialize with a preorder walk writing a marker like `#` for each None; deserialize by consuming the tokens in the same order. The null markers make the structure unambiguous.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef serialize(root):\n    out = []\n    def go(n):\n        if not n: out.append(\"#\"); return\n        out.append(str(n.val)); go(n.left); go(n.right)\n    go(root)\n    return \",\".join(out)\n\ndef deserialize(s):\n    it = iter(s.split(\",\"))\n    def go():\n        t = next(it)\n        if t == \"#\": return None\n        n = TreeNode(int(t)); n.left = go(); n.right = go()\n        return n\n    return go()\n\ns = serialize(make([1, 2, 3, None, None, 4, 5]))\nprint(s)   # 1,2,#,#,3,4,#,#,5,#,#"
      },
      "cx": "O(n) time and space",
      "see": [
        "#/topic/trees",
        "#/problem/297"
      ],
      "check": "s == \"1,2,#,#,3,4,#,#,5,#,#\" and serialize(deserialize(s)) == s\nassert serialize(None) == \"#\" and deserialize(\"#\") is None"
    },
    {
      "id": "ds-bt-path-sum",
      "title": "Path sum in a binary tree",
      "q": [
        "path sum root to leaf",
        "does a tree have a root to leaf path with sum",
        "has path sum python",
        "binary tree path sum recursion"
      ],
      "tags": "path sum root to leaf target sum binary tree recursion",
      "a": "Subtract the node value from the target while going down; at a leaf, check whether the remaining target is 0.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef has_path_sum(n, target):\n    if not n: return False\n    target -= n.val\n    if not n.left and not n.right: return target == 0\n    return has_path_sum(n.left, target) or has_path_sum(n.right, target)\n\nt = make([5, 4, 8, 11, None, 13, 4, 7, 2])\nprint(has_path_sum(t, 22), has_path_sum(t, 5))   # True False"
      },
      "more": "- It must end at a LEAF; internal nodes do not count (note the Python-safe empty-tree case).",
      "cx": "O(n) time",
      "see": [
        "#/topic/trees",
        "#/problem/112"
      ],
      "check": "assert has_path_sum(t,22) and not has_path_sum(t,5) and not has_path_sum(None,0)"
    },
    {
      "id": "ds-bt-max-path-sum",
      "title": "Binary tree maximum path sum",
      "q": [
        "binary tree maximum path sum",
        "max path sum any node to any node",
        "max path sum python",
        "tree path with largest sum"
      ],
      "tags": "maximum path sum binary tree any node negative gain recursion",
      "a": "For each node compute the best downward gain: `val + max(0, left gain, right gain)` (ignore negative branches). The best path bending at that node is `val + max(0,left) + max(0,right)`; track the global maximum.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef max_path_sum(root):\n    best = float(\"-inf\")\n    def gain(n):\n        nonlocal best\n        if not n: return 0\n        l, r = max(0, gain(n.left)), max(0, gain(n.right))\n        best = max(best, n.val + l + r)\n        return n.val + max(l, r)\n    gain(root)\n    return best\n\nprint(max_path_sum(make([-10, 9, 20, None, None, 15, 7])))   # 42"
      },
      "more": "- Same shape as diameter, but with values and clamping at 0.",
      "cx": "O(n) time",
      "see": [
        "#/topic/trees",
        "#/topic/tree-dp",
        "#/problem/124"
      ],
      "check": "assert max_path_sum(make([-10,9,20,None,None,15,7])) == 42 and max_path_sum(make([-3])) == -3"
    },
    {
      "id": "ds-bt-build-pre-in",
      "title": "Build a binary tree from preorder and inorder",
      "q": [
        "construct binary tree from preorder and inorder",
        "rebuild tree from traversals",
        "build tree from inorder and postorder",
        "tree from two traversals python"
      ],
      "tags": "build tree preorder inorder construct from traversals index map recursion",
      "a": "The first preorder item is the root. Find it in inorder: everything left of it is the left subtree. Use a dict of value to inorder index and a preorder iterator so each node is placed in O(1); values must be unique.",
      "code": {
        "py": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef make(vals):   # level-order list with None holes -> tree\n    if not vals or vals[0] is None: return None\n    root = TreeNode(vals[0]); q = [root]; i = 1\n    for node in q:\n        if i < len(vals):\n            if vals[i] is not None: node.left = TreeNode(vals[i]); q.append(node.left)\n            i += 1\n        if i < len(vals):\n            if vals[i] is not None: node.right = TreeNode(vals[i]); q.append(node.right)\n            i += 1\n    return root\ndef build_tree(preorder, inorder):\n    idx = {v: i for i, v in enumerate(inorder)}\n    it = iter(preorder)\n    def go(lo, hi):\n        if lo > hi: return None\n        v = next(it); n = TreeNode(v); m = idx[v]\n        n.left = go(lo, m - 1)\n        n.right = go(m + 1, hi)\n        return n\n    return go(0, len(inorder) - 1)\n\ndef level(n):\n    return [] if not n else [n.val] + level(n.left) + level(n.right)\n\nt = build_tree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7])\nprint(level(t))   # [3, 9, 20, 15, 7]"
      },
      "more": "- Build left before right (preorder consumes left subtree first).\n- Postorder + inorder works the same, reading postorder from the end and building right first.",
      "cx": "O(n) time and space",
      "see": [
        "#/topic/trees",
        "#/problem/105"
      ],
      "check": "assert t.val == 3 and t.left.val == 9 and t.right.left.val == 15 and build_tree([], []) is None"
    },
    {
      "id": "ds-bst-insert-search",
      "title": "Binary search tree: insert and search",
      "q": [
        "what is a binary search tree",
        "bst insert and search python",
        "how to implement a bst",
        "binary search tree implementation",
        "bst search iterative"
      ],
      "tags": "binary search tree bst insert search lookup left smaller right larger ordered",
      "a": "In a BST every node's left subtree holds smaller keys and its right subtree larger keys. Search and insert walk down comparing at each node: O(h), which is O(log n) when balanced and O(n) when skewed (e.g. sorted inserts).",
      "code": {
        "py": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef insert(root, v):\n    if not root: return Node(v)\n    if v < root.val: root.left = insert(root.left, v)\n    elif v > root.val: root.right = insert(root.right, v)\n    return root\n\ndef from_list(vals):\n    root = None\n    for v in vals: root = insert(root, v)\n    return root\n\ndef inorder(n):\n    return inorder(n.left) + [n.val] + inorder(n.right) if n else []\ndef search(root, v):\n    while root and root.val != v:\n        root = root.left if v < root.val else root.right\n    return root\n\nt = from_list([5, 3, 8, 1, 4, 9])\nprint(inorder(t))              # [1, 3, 4, 5, 8, 9]\nprint(bool(search(t, 4)), bool(search(t, 7)))   # True False"
      },
      "more": "- Inorder traversal of a BST is sorted.\n- Duplicates: decide a policy (here ignored).\n- Self-balancing trees (AVL, red-black) guarantee O(log n).",
      "cx": "O(h): O(log n) balanced, O(n) worst",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert inorder(t) == [1,3,4,5,8,9] and search(t,8).val == 8 and search(t,7) is None and search(None,1) is None"
    },
    {
      "id": "ds-bst-delete",
      "title": "Delete a node from a BST",
      "q": [
        "delete node in a bst",
        "bst deletion cases",
        "remove a node from binary search tree",
        "delete from binary search tree python"
      ],
      "tags": "bst delete remove node two children inorder successor min of right subtree",
      "a": "Find the node, then: no child, return None; one child, return that child; two children, copy in the smallest value of the right subtree (inorder successor) and delete that value from the right subtree.",
      "code": {
        "py": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef insert(root, v):\n    if not root: return Node(v)\n    if v < root.val: root.left = insert(root.left, v)\n    elif v > root.val: root.right = insert(root.right, v)\n    return root\n\ndef from_list(vals):\n    root = None\n    for v in vals: root = insert(root, v)\n    return root\n\ndef inorder(n):\n    return inorder(n.left) + [n.val] + inorder(n.right) if n else []\ndef delete(root, v):\n    if not root: return None\n    if v < root.val: root.left = delete(root.left, v)\n    elif v > root.val: root.right = delete(root.right, v)\n    else:\n        if not root.left: return root.right\n        if not root.right: return root.left\n        s = root.right\n        while s.left: s = s.left\n        root.val = s.val\n        root.right = delete(root.right, s.val)\n    return root\n\nt = from_list([5, 3, 8, 1, 4, 7, 9])\nfor v in (1, 8, 5): t = delete(t, v)\nprint(inorder(t))   # [3, 4, 7, 9]"
      },
      "more": "- Predecessor (max of left subtree) works equally well.",
      "cx": "O(h)",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert inorder(t) == [3,4,7,9] and delete(None,1) is None\nassert inorder(delete(from_list([2]),2)) == []"
    },
    {
      "id": "ds-bst-validate",
      "title": "Validate a binary search tree",
      "q": [
        "validate binary search tree",
        "is this tree a valid bst",
        "check bst python",
        "bst validation min max bounds",
        "valid bst inorder"
      ],
      "tags": "validate bst valid binary search tree bounds min max inorder strictly increasing",
      "a": "Pass an allowed open interval (lo, hi) down the recursion: every node must satisfy lo < val < hi, tightening hi going left and lo going right. Checking only a node against its direct children is wrong.",
      "code": {
        "py": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef insert(root, v):\n    if not root: return Node(v)\n    if v < root.val: root.left = insert(root.left, v)\n    elif v > root.val: root.right = insert(root.right, v)\n    return root\n\ndef from_list(vals):\n    root = None\n    for v in vals: root = insert(root, v)\n    return root\n\ndef inorder(n):\n    return inorder(n.left) + [n.val] + inorder(n.right) if n else []\ndef is_bst(n, lo=float(\"-inf\"), hi=float(\"inf\")):\n    if not n: return True\n    if not lo < n.val < hi: return False\n    return is_bst(n.left, lo, n.val) and is_bst(n.right, n.val, hi)\n\ngood = from_list([5, 3, 8])\nbad = Node(5, Node(3), Node(8, Node(4), None))   # 4 is in the right subtree of 5\nprint(is_bst(good), is_bst(bad))   # True False"
      },
      "more": "- Alternative: inorder traversal must be strictly increasing.",
      "cx": "O(n) time, O(h) stack",
      "see": [
        "#/topic/trees",
        "#/problem/98"
      ],
      "check": "assert is_bst(good) and not is_bst(bad) and is_bst(None)"
    },
    {
      "id": "ds-bst-kth",
      "title": "k-th smallest element in a BST",
      "q": [
        "kth smallest element in a bst",
        "find kth smallest in binary search tree",
        "inorder kth element",
        "bst kth smallest iterative"
      ],
      "tags": "kth smallest bst inorder iterative stack count order statistic",
      "a": "Inorder traversal visits a BST in sorted order, so stop at the k-th visited node. Do it iteratively with a stack to stop early.",
      "code": {
        "py": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef insert(root, v):\n    if not root: return Node(v)\n    if v < root.val: root.left = insert(root.left, v)\n    elif v > root.val: root.right = insert(root.right, v)\n    return root\n\ndef from_list(vals):\n    root = None\n    for v in vals: root = insert(root, v)\n    return root\n\ndef inorder(n):\n    return inorder(n.left) + [n.val] + inorder(n.right) if n else []\ndef kth_smallest(root, k):\n    st, cur = [], root\n    while cur or st:\n        while cur:\n            st.append(cur); cur = cur.left\n        cur = st.pop(); k -= 1\n        if k == 0: return cur.val\n        cur = cur.right\n\nt = from_list([5, 3, 6, 2, 4, 1])\nprint(kth_smallest(t, 3))   # 3"
      },
      "more": "- If you must answer many queries with updates, store subtree sizes at each node for O(h) per query.",
      "cx": "O(h + k)",
      "see": [
        "#/topic/trees",
        "#/problem/230"
      ],
      "check": "assert kth_smallest(t,3) == 3 and kth_smallest(t,1) == 1 and kth_smallest(t,6) == 6"
    },
    {
      "id": "ds-bst-floor-ceil",
      "title": "Floor and ceiling in a BST",
      "q": [
        "floor and ceil in bst",
        "largest value less than or equal to x in bst",
        "closest value in a binary search tree",
        "bst ceiling"
      ],
      "tags": "floor ceil bst closest value predecessor successor search",
      "a": "Walk down from the root keeping the best candidate. For floor (largest <= x): if node <= x record it and go right, else go left. Ceiling is symmetric.",
      "code": {
        "py": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef insert(root, v):\n    if not root: return Node(v)\n    if v < root.val: root.left = insert(root.left, v)\n    elif v > root.val: root.right = insert(root.right, v)\n    return root\n\ndef from_list(vals):\n    root = None\n    for v in vals: root = insert(root, v)\n    return root\n\ndef inorder(n):\n    return inorder(n.left) + [n.val] + inorder(n.right) if n else []\ndef floor(root, x):\n    best = None\n    while root:\n        if root.val == x: return x\n        if root.val < x: best, root = root.val, root.right\n        else: root = root.left\n    return best\n\ndef ceil(root, x):\n    best = None\n    while root:\n        if root.val == x: return x\n        if root.val > x: best, root = root.val, root.left\n        else: root = root.right\n    return best\n\nt = from_list([8, 4, 12, 2, 6, 10])\nprint(floor(t, 7), ceil(t, 7), floor(t, 1))   # 6 8 None"
      },
      "more": "- In Python a sorted list with `bisect` gives the same answers.",
      "cx": "O(h)",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert floor(t,7) == 6 and ceil(t,7) == 8 and floor(t,1) is None and ceil(t,13) is None and floor(t,10) == 10"
    },
    {
      "id": "ds-bst-successor",
      "title": "Inorder successor in a BST",
      "q": [
        "inorder successor",
        "next larger node in bst",
        "find successor of a node in binary search tree",
        "bst successor without parent pointer"
      ],
      "tags": "inorder successor bst next larger node without parent pointer",
      "a": "Walk from the root toward the target value. Each time you go left, remember the current node as a candidate; the last candidate is the successor (the smallest key greater than the target). This needs no parent pointers.",
      "code": {
        "py": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\ndef insert(root, v):\n    if not root: return Node(v)\n    if v < root.val: root.left = insert(root.left, v)\n    elif v > root.val: root.right = insert(root.right, v)\n    return root\n\ndef from_list(vals):\n    root = None\n    for v in vals: root = insert(root, v)\n    return root\n\ndef inorder(n):\n    return inorder(n.left) + [n.val] + inorder(n.right) if n else []\ndef successor(root, v):\n    succ = None\n    while root:\n        if v < root.val: succ, root = root, root.left\n        else: root = root.right\n    return succ.val if succ else None\n\nt = from_list([5, 3, 8, 1, 4, 7, 9])\nprint(successor(t, 4), successor(t, 9), successor(t, 5))   # 5 None 7"
      },
      "more": "- With a parent pointer: if the node has a right child, take its leftmost; otherwise climb until you come from a left child.",
      "cx": "O(h)",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert successor(t,4) == 5 and successor(t,9) is None and successor(t,5) == 7 and successor(t,0) == 1"
    },
    {
      "id": "ds-avl-redblack",
      "title": "AVL and red-black trees: what they are",
      "q": [
        "what is an avl tree",
        "what is a red black tree",
        "self balancing binary search tree",
        "avl vs red black tree",
        "why do we need balanced trees"
      ],
      "tags": "avl red black tree self balancing rotation height balanced bst",
      "a": "Self-balancing BSTs keep height O(log n) with rotations after inserts and deletes. AVL trees keep subtree heights within 1 (stricter balance, faster lookups). Red-black trees use colour rules (looser balance, fewer rotations on updates). Both give O(log n) search, insert and delete.",
      "code": {
        "py": "# You rarely write these in interviews. In practice:\n#   Java TreeMap / C++ std::map are red-black trees.\n#   Python has no built-in balanced tree (see sortedcontainers / bisect).\ndef left_rotate(x):             # x.right becomes the new subtree root\n    y = x.right\n    x.right, y.left = y.left, x\n    return y\n\nclass N:\n    def __init__(self, v, l=None, r=None): self.v, self.left, self.right = v, l, r\nroot = N(1, None, N(2, None, N(3)))      # a right-skewed chain\nroot = left_rotate(root)\nprint(root.v, root.left.v, root.right.v)   # 2 1 3"
      },
      "more": "- A rotation changes shape but preserves inorder order.\n- AVL: heights differ by at most 1 at every node, rebalance with 4 rotation cases (LL, RR, LR, RL).\n- Red-black: root black, no red node has a red child, equal black count on every path; height at most 2 log2(n+1).\n- Use when you need ordered operations (floor/ceiling, range queries) with guaranteed O(log n).",
      "cx": "search/insert/delete O(log n) worst case",
      "see": [
        "#/topic/trees"
      ],
      "check": "assert (root.v, root.left.v, root.right.v) == (2, 1, 3)"
    },
    {
      "id": "ds-sortedcontainers",
      "title": "Sorted list in Python (bisect and sortedcontainers)",
      "q": [
        "python sorted list data structure",
        "treemap in python",
        "sortedcontainers sortedlist",
        "is there a balanced bst in python",
        "keep a list sorted as you insert"
      ],
      "tags": "sortedcontainers sortedlist sorteddict bisect insort treemap ordered set python",
      "a": "The standard library has no balanced tree. Use `bisect.insort` to keep a plain list sorted (search O(log n), insert O(n) from shifting). The third-party `sortedcontainers` package (SortedList) is faster but is NOT in the standard library, so it is usually unavailable in interviews.",
      "code": {
        "py": "import bisect\na = []\nfor x in [5, 1, 4, 2]:\n    bisect.insort(a, x)           # keeps a sorted\ni = bisect.bisect_left(a, 4)      # index of first >= 4\nprint(a, i, a[i])                 # [1, 2, 4, 5] 2 4\nj = bisect.bisect_right(a, 4)     # first > 4\nprint(a[j] if j < len(a) else None)   # 5\n# pip install sortedcontainers:\n#   from sortedcontainers import SortedList; s = SortedList([5, 1]); s.add(3)"
      },
      "more": "- `bisect_left` gives lower bound, `bisect_right` upper bound.\n- insort is O(n) per insert, fine up to roughly 10^5 items.\n- In Java use TreeMap, in C++ std::set / std::map.",
      "cx": "bisect O(log n); insort O(n)",
      "see": [
        "#/cheatsheets/python",
        "#/topic/binary-search"
      ],
      "check": "assert a == [1,2,4,5] and i == 2 and j == 3"
    },
    {
      "id": "ds-trie",
      "title": "Trie: insert, search, startsWith",
      "q": [
        "what is a trie",
        "implement a trie in python",
        "prefix tree implementation",
        "trie insert search startswith",
        "how does a trie work"
      ],
      "tags": "trie prefix tree insert search startswith dictionary nested dict",
      "a": "A trie (prefix tree) stores words character by character along root-to-node paths, with an end marker per word. Insert, search and prefix-check each cost O(L) for a word of length L, independent of how many words are stored.",
      "code": {
        "py": "class Trie:\n    def __init__(self):\n        self.root = {}\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            node = node.setdefault(ch, {})\n        node[\"$\"] = True\n    def _walk(self, s):\n        node = self.root\n        for ch in s:\n            if ch not in node: return None\n            node = node[ch]\n        return node\n    def search(self, word):\n        n = self._walk(word)\n        return bool(n and \"$\" in n)\n    def starts_with(self, prefix):\n        return self._walk(prefix) is not None\nt = Trie()\nfor w in [\"apple\", \"app\", \"bat\"]: t.insert(w)\nprint(t.search(\"app\"), t.search(\"appl\"), t.starts_with(\"appl\"), t.starts_with(\"c\"))\n# True False True False"
      },
      "more": "- Nested dict is the shortest Python version; a class with a 26-slot array or `children` dict per node is the classic form.\n- Memory can be large; compress with a radix/patricia tree.",
      "cx": "O(L) per op; space O(total characters)",
      "see": [
        "#/topic/tries",
        "#/problem/208"
      ],
      "check": "assert t.search(\"app\") and not t.search(\"appl\") and t.starts_with(\"appl\") and not t.starts_with(\"c\") and t.starts_with(\"\")"
    },
    {
      "id": "ds-trie-delete",
      "title": "Delete a word from a trie",
      "q": [
        "trie delete word",
        "remove a word from a prefix tree",
        "trie deletion python",
        "delete from trie and prune nodes"
      ],
      "tags": "trie delete remove word prune unmark end of word recursion",
      "a": "Walk to the word's end and remove its end marker; then, backing out, delete child nodes that are now empty (no children and not the end of another word). If the word is only a prefix of others, just unmark it.",
      "code": {
        "py": "class Trie:\n    def __init__(self):\n        self.root = {}\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            node = node.setdefault(ch, {})\n        node[\"$\"] = True\n    def _walk(self, s):\n        node = self.root\n        for ch in s:\n            if ch not in node: return None\n            node = node[ch]\n        return node\n    def search(self, word):\n        n = self._walk(word)\n        return bool(n and \"$\" in n)\n    def starts_with(self, prefix):\n        return self._walk(prefix) is not None\ndef delete(trie, word):\n    def go(node, i):\n        if i == len(word):\n            if \"$\" not in node: return False\n            del node[\"$\"]\n            return not node            # prune if empty\n        ch = word[i]\n        if ch not in node: return False\n        if go(node[ch], i + 1):\n            del node[ch]\n            return not node and \"$\" not in node\n        return False\n    go(trie.root, 0)\n\nt = Trie()\nfor w in [\"app\", \"apple\"]: t.insert(w)\ndelete(t, \"apple\")\nprint(t.search(\"apple\"), t.search(\"app\"))   # False True"
      },
      "more": "- Deleting \"app\" while \"apple\" exists only unmarks the end flag; nothing is pruned.",
      "cx": "O(L)",
      "see": [
        "#/topic/tries"
      ],
      "check": "assert not t.search(\"apple\") and t.search(\"app\")\ndelete(t, \"app\"); assert t.root == {} \ndelete(t, \"zzz\")"
    },
    {
      "id": "ds-trie-autocomplete",
      "title": "Autocomplete with a trie",
      "q": [
        "autocomplete using a trie",
        "find all words with a given prefix",
        "trie prefix search list words",
        "search suggestions system",
        "type ahead trie"
      ],
      "tags": "autocomplete trie prefix words suggestions typeahead dfs collect",
      "a": "Walk to the node for the prefix, then DFS below it collecting every word whose end marker is set. Cost is O(L + size of the output subtree).",
      "code": {
        "py": "class Trie:\n    def __init__(self):\n        self.root = {}\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            node = node.setdefault(ch, {})\n        node[\"$\"] = True\n    def _walk(self, s):\n        node = self.root\n        for ch in s:\n            if ch not in node: return None\n            node = node[ch]\n        return node\n    def search(self, word):\n        n = self._walk(word)\n        return bool(n and \"$\" in n)\n    def starts_with(self, prefix):\n        return self._walk(prefix) is not None\ndef autocomplete(trie, prefix, limit=10):\n    node = trie._walk(prefix)\n    out = []\n    def dfs(n, path):\n        if len(out) >= limit: return\n        if \"$\" in n: out.append(prefix + path)\n        for ch in sorted(k for k in n if k != \"$\"):\n            dfs(n[ch], path + ch)\n    if node: dfs(node, \"\")\n    return out\n\nt = Trie()\nfor w in [\"car\", \"card\", \"care\", \"cat\", \"dog\"]: t.insert(w)\nprint(autocomplete(t, \"car\"))   # ['car', 'card', 'care']"
      },
      "more": "- Visiting children alphabetically gives sorted results.\n- To rank by popularity, store counts and keep the top k per node.",
      "cx": "O(L + output)",
      "see": [
        "#/topic/tries"
      ],
      "check": "assert autocomplete(t,\"car\") == [\"car\",\"card\",\"care\"] and autocomplete(t,\"x\") == [] and len(autocomplete(t,\"\",2)) == 2"
    },
    {
      "id": "ds-word-search-ii",
      "title": "Word Search II idea (trie + backtracking)",
      "q": [
        "word search ii",
        "find all words in a grid",
        "trie plus dfs on a board",
        "boggle solver",
        "why use a trie for word search"
      ],
      "tags": "word search ii trie backtracking grid board dfs boggle prune",
      "a": "Build a trie of the words, then DFS from every cell, walking the trie in step with the path. Stop a branch as soon as the current letters are not a prefix of any word. One search finds every word instead of one search per word.",
      "code": {
        "py": "def find_words(board, words):\n    root = {}\n    for w in words:\n        n = root\n        for c in w: n = n.setdefault(c, {})\n        n[\"$\"] = w\n    R, C, found = len(board), len(board[0]), []\n    def dfs(r, c, node):\n        ch = board[r][c]\n        nxt = node.get(ch)\n        if not nxt: return\n        if \"$\" in nxt: found.append(nxt.pop(\"$\"))     # pop avoids duplicates\n        board[r][c] = \"#\"\n        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < R and 0 <= nc < C and board[nr][nc] != \"#\":\n                dfs(nr, nc, nxt)\n        board[r][c] = ch\n    for r in range(R):\n        for c in range(C): dfs(r, c, root)\n    return found\n\nb = [list(\"oaan\"), list(\"etae\"), list(\"ihkr\"), list(\"iflv\")]\nprint(sorted(find_words(b, [\"oath\", \"pea\", \"eat\", \"rain\"])))   # ['eat', 'oath']"
      },
      "more": "- Optimization: delete empty trie leaves after a match.",
      "cx": "roughly O(cells x 4 x 3^(L-1)) worst case",
      "see": [
        "#/topic/tries",
        "#/topic/backtracking",
        "#/problem/212"
      ],
      "check": "assert sorted(find_words([list(\"oaan\"),list(\"etae\"),list(\"ihkr\"),list(\"iflv\")],[\"oath\",\"pea\",\"eat\",\"rain\"])) == [\"eat\",\"oath\"]\nassert find_words([list(\"ab\")],[\"c\"]) == []"
    },
    {
      "id": "ds-graph-adj-list",
      "title": "Graph as an adjacency list",
      "q": [
        "how to represent a graph",
        "adjacency list python",
        "graph data structure",
        "build adjacency list from edges",
        "graph using dict of lists"
      ],
      "tags": "graph adjacency list representation dict defaultdict neighbors edges",
      "a": "An adjacency list maps each vertex to its neighbours: `graph[u]` is the list of vertices reachable by one edge. It uses O(V + E) space and iterates neighbours fast, so it is the default for BFS/DFS and sparse graphs.",
      "code": {
        "py": "from collections import defaultdict\n\ngraph = defaultdict(list)\nfor u, v in [(0, 1), (0, 2), (1, 2), (2, 3)]:\n    graph[u].append(v)\n    graph[v].append(u)          # undirected: add both directions\nprint(dict(graph))              # {0: [1, 2], 1: [0, 2], 2: [0, 1, 3], 3: [2]}\nprint(len(graph[2]))            # degree of 2 -> 3"
      },
      "more": "- Nodes numbered 0..n-1: use `[[] for _ in range(n)]` instead of a dict.\n- Edge check u-v costs O(deg u); use sets of neighbours for O(1).",
      "cx": "space O(V + E)",
      "see": [
        "#/topic/graphs",
        "#/cheatsheets/graphs"
      ],
      "check": "assert graph[0] == [1,2] and len(graph[3]) == 1 and 3 in graph[2] and graph[9] == []"
    },
    {
      "id": "ds-graph-matrix",
      "title": "Graph as an adjacency matrix and edge list",
      "q": [
        "adjacency matrix python",
        "adjacency matrix vs adjacency list",
        "edge list representation",
        "graph as 2d array",
        "dense graph representation"
      ],
      "tags": "adjacency matrix edge list representation dense graph 2d array v squared",
      "a": "An adjacency matrix is a V x V grid where `m[u][v]` is 1 (or the weight) if an edge exists: O(1) edge check, O(V^2) space. An edge list is just a list of (u, v[, w]) pairs, ideal for Kruskal and Bellman-Ford. Use a list for sparse graphs, a matrix for dense graphs or Floyd-Warshall.",
      "code": {
        "py": "n = 4\nedges = [(0, 1, 5), (1, 2, 3), (2, 3, 1)]\nmatrix = [[0] * n for _ in range(n)]\nfor u, v, w in edges:\n    matrix[u][v] = matrix[v][u] = w          # undirected weighted\nprint(matrix[1][2], matrix[0][3])            # 3 0\nprint([v for v in range(n) if matrix[2][v]]) # neighbours of 2: [1, 3]"
      },
      "more": "- Neighbour scan is O(V) per vertex in a matrix, O(deg) in a list.\n- Weight 0 or \"no edge\": use None or inf if 0 is a valid weight.",
      "cx": "matrix space O(V^2); edge list O(E)",
      "see": [
        "#/topic/graphs",
        "#/cheatsheets/graphs"
      ],
      "check": "assert matrix[1][2] == 3 and matrix[2][1] == 3 and matrix[0][3] == 0 and sum(map(sum, matrix)) == 18"
    },
    {
      "id": "ds-graph-from-edges",
      "title": "Build weighted and directed graphs from an edge list",
      "q": [
        "build a graph from an edge list",
        "weighted graph adjacency list python",
        "directed vs undirected graph",
        "directed graph from edges",
        "how to store edge weights"
      ],
      "tags": "build graph edge list weighted directed undirected adjacency list tuple weight",
      "a": "For a directed graph add only `u -> v`; for undirected add both directions. For weights store `(neighbour, weight)` pairs in each list.",
      "code": {
        "py": "from collections import defaultdict\n\ndef build(n, edges, directed=False, weighted=False):\n    g = [[] for _ in range(n)]\n    for e in edges:\n        u, v = e[0], e[1]\n        w = e[2] if weighted else 1\n        g[u].append((v, w))\n        if not directed:\n            g[v].append((u, w))\n    return g\n\ng = build(3, [(0, 1, 4), (1, 2, 2)], directed=True, weighted=True)\nprint(g)   # [[(1, 4)], [(2, 2)], []]\nu = build(3, [(0, 1), (1, 2)])\nprint(u[1])   # [(0, 1), (2, 1)]"
      },
      "more": "- Directed: edges have a direction (follows, one-way roads). Undirected: symmetric (friendship).\n- Watch out for 1-indexed input; subtract 1 or size the list n+1.",
      "cx": "O(V + E)",
      "see": [
        "#/topic/graphs",
        "#/cheatsheets/graphs"
      ],
      "check": "assert g == [[(1,4)],[(2,2)],[]] and u[1] == [(0,1),(2,1)] and build(0, []) == []"
    },
    {
      "id": "ds-union-find",
      "title": "Union-Find (disjoint set) with path compression and union by size",
      "q": [
        "union find implementation",
        "disjoint set union python",
        "dsu path compression",
        "union by rank",
        "how to implement union find"
      ],
      "tags": "union find disjoint set dsu path compression union by size rank connected components find union",
      "a": "Union-Find tracks which items are in the same group. `find` returns the group's root (compressing paths as it goes); `union` attaches the smaller tree under the larger. Together each op is nearly O(1) (inverse Ackermann).",
      "code": {
        "py": "class DSU:\n    def __init__(self, n):\n        self.p = list(range(n)); self.size = [1] * n; self.count = n\n    def find(self, x):\n        while self.p[x] != x:\n            self.p[x] = self.p[self.p[x]]      # path halving\n            x = self.p[x]\n        return x\n    def union(self, a, b):\n        ra, rb = self.find(a), self.find(b)\n        if ra == rb: return False\n        if self.size[ra] < self.size[rb]: ra, rb = rb, ra\n        self.p[rb] = ra; self.size[ra] += self.size[rb]; self.count -= 1\n        return True\n\nd = DSU(5)\nd.union(0, 1); d.union(1, 2)\nprint(d.find(0) == d.find(2), d.find(3) == d.find(4), d.count)   # True False 3"
      },
      "more": "- Returns False if already connected: that is cycle detection in Kruskal.\n- Use for connected components, grouping, Kruskal MST.\n- No efficient split/delete.",
      "cx": "near O(1) amortized per op",
      "see": [
        "#/topic/union-find",
        "#/problem/684"
      ],
      "check": "assert d.find(0) == d.find(2) and d.find(3) != d.find(4) and d.count == 3\nassert not d.union(0, 2) and d.union(3, 4) and d.count == 2 and d.size[d.find(4)] == 2"
    },
    {
      "id": "ds-segment-tree",
      "title": "Segment tree: build, point update, range sum",
      "q": [
        "segment tree implementation",
        "range sum query with updates",
        "segment tree python",
        "how to build a segment tree",
        "range minimum query segment tree"
      ],
      "tags": "segment tree range sum range min point update build query iterative bottom up",
      "a": "A segment tree stores aggregates of array ranges so a range query and a point update each take O(log n). The compact iterative version keeps leaves at `n..2n-1` and internal nodes at `1..n-1`, node i combining 2i and 2i+1. Change the combine function (sum, min, max, gcd) for other queries.",
      "code": {
        "py": "class SegTree:\n    def __init__(self, nums):\n        self.n = n = len(nums)\n        self.t = [0] * n + list(nums)\n        for i in range(n - 1, 0, -1):\n            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]\n    def update(self, i, v):\n        i += self.n; self.t[i] = v\n        while i > 1:\n            i //= 2\n            self.t[i] = self.t[2 * i] + self.t[2 * i + 1]\n    def query(self, l, r):           # sum of nums[l:r], half-open\n        res, l, r = 0, l + self.n, r + self.n\n        while l < r:\n            if l & 1: res += self.t[l]; l += 1\n            if r & 1: r -= 1; res += self.t[r]\n            l //= 2; r //= 2\n        return res\n\nst = SegTree([1, 3, 5, 7, 9])\nprint(st.query(1, 4))         # 15\nst.update(2, 10)\nprint(st.query(1, 4))         # 20"
      },
      "more": "- For min: use `min` with an identity of infinity.\n- Build O(n); query and update O(log n); space 2n.\n- Non-commutative combines need extra care in the iterative form.",
      "cx": "build O(n); query/update O(log n)",
      "see": [
        "#/topic/segment-tree"
      ],
      "check": "assert st.query(0,5) == 30 and st.query(2,3) == 10 and st.query(1,1) == 0"
    },
    {
      "id": "ds-segment-lazy",
      "title": "Segment tree lazy propagation (range update)",
      "q": [
        "lazy propagation segment tree",
        "range update range query",
        "segment tree add to a range",
        "what is lazy propagation"
      ],
      "tags": "segment tree lazy propagation range update range add range sum push down",
      "a": "Lazy propagation lets a segment tree add a value to a whole range in O(log n): store a pending \"lazy\" tag on a node covering a fully updated range, and push it to its children only when a later operation needs to descend through it.",
      "code": {
        "py": "class LazySeg:\n    def __init__(self, nums):\n        self.n = len(nums); self.s = [0] * (4 * self.n); self.z = [0] * (4 * self.n)\n        self._build(1, 0, self.n - 1, nums)\n    def _build(self, o, l, r, a):\n        if l == r: self.s[o] = a[l]; return\n        m = (l + r) // 2\n        self._build(2*o, l, m, a); self._build(2*o+1, m+1, r, a)\n        self.s[o] = self.s[2*o] + self.s[2*o+1]\n    def _apply(self, o, l, r, v):\n        self.s[o] += v * (r - l + 1); self.z[o] += v\n    def _push(self, o, l, r):\n        if self.z[o]:\n            m = (l + r) // 2\n            self._apply(2*o, l, m, self.z[o]); self._apply(2*o+1, m+1, r, self.z[o])\n            self.z[o] = 0\n    def add(self, ql, qr, v, o=1, l=0, r=None):\n        r = self.n - 1 if r is None else r\n        if qr < l or r < ql: return\n        if ql <= l and r <= qr: self._apply(o, l, r, v); return\n        self._push(o, l, r); m = (l + r) // 2\n        self.add(ql, qr, v, 2*o, l, m); self.add(ql, qr, v, 2*o+1, m+1, r)\n        self.s[o] = self.s[2*o] + self.s[2*o+1]\n    def sum(self, ql, qr, o=1, l=0, r=None):\n        r = self.n - 1 if r is None else r\n        if qr < l or r < ql: return 0\n        if ql <= l and r <= qr: return self.s[o]\n        self._push(o, l, r); m = (l + r) // 2\n        return self.sum(ql, qr, 2*o, l, m) + self.sum(ql, qr, 2*o+1, m+1, r)\n\nt = LazySeg([1, 2, 3, 4, 5])\nt.add(1, 3, 10)                 # inclusive range\nprint(t.sum(0, 4), t.sum(2, 2))   # 45 13"
      },
      "more": "- Use it when you need range update AND range query; point updates alone do not need laziness.\n- Alternative for range add + point query: a Fenwick tree over differences.",
      "cx": "O(log n) per op",
      "see": [
        "#/topic/segment-tree"
      ],
      "check": "assert t.sum(0,4) == 45 and t.sum(2,2) == 13\nt.add(0,4,1); assert t.sum(0,4) == 50 and t.sum(0,0) == 2"
    },
    {
      "id": "ds-fenwick",
      "title": "Fenwick tree (Binary Indexed Tree)",
      "q": [
        "fenwick tree implementation",
        "binary indexed tree python",
        "bit prefix sum with updates",
        "fenwick tree range sum",
        "what is a fenwick tree"
      ],
      "tags": "fenwick tree binary indexed tree bit prefix sum point update lowbit",
      "a": "A Fenwick tree gives prefix sums and point updates in O(log n) with just an array. It is 1-indexed; index i stores the sum of the last `i & -i` elements. Range sum = prefix(r) - prefix(l-1).",
      "code": {
        "py": "class Fenwick:\n    def __init__(self, n):\n        self.n, self.t = n, [0] * (n + 1)\n    def add(self, i, delta):             # 1-indexed\n        while i <= self.n:\n            self.t[i] += delta\n            i += i & -i\n    def prefix(self, i):                 # sum of 1..i\n        s = 0\n        while i > 0:\n            s += self.t[i]\n            i -= i & -i\n        return s\n    def range_sum(self, l, r): return self.prefix(r) - self.prefix(l - 1)\n\nf = Fenwick(5)\nfor i, v in enumerate([3, 2, 1, 4, 5], start=1): f.add(i, v)\nprint(f.prefix(3), f.range_sum(2, 4))   # 6 7\nf.add(2, 10); print(f.range_sum(2, 4))  # 17"
      },
      "more": "- Simpler and faster than a segment tree for sums, but less flexible (min/max need extra tricks).\n- Use for counting inversions and order statistics.",
      "cx": "O(log n) per op, O(n) space",
      "see": [
        "#/topic/fenwick"
      ],
      "check": "assert f.prefix(5) == 25 and f.range_sum(1,1) == 3 and f.prefix(0) == 0"
    },
    {
      "id": "ds-lru-ordereddict",
      "title": "LRU cache with OrderedDict",
      "q": [
        "lru cache python",
        "implement lru cache",
        "least recently used cache ordereddict",
        "lru cache get and put o(1)",
        "design lru cache"
      ],
      "tags": "lru cache least recently used ordereddict move_to_end popitem get put capacity",
      "a": "Use `collections.OrderedDict`: `move_to_end(key)` on every get/put marks it most recent, and `popitem(last=False)` evicts the least recent when over capacity. Both are O(1).",
      "code": {
        "py": "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap, self.d = capacity, OrderedDict()\n    def get(self, key):\n        if key not in self.d: return -1\n        self.d.move_to_end(key)\n        return self.d[key]\n    def put(self, key, value):\n        self.d[key] = value\n        self.d.move_to_end(key)\n        if len(self.d) > self.cap:\n            self.d.popitem(last=False)\n\nc = LRUCache(2)\nc.put(1, 1); c.put(2, 2); c.get(1); c.put(3, 3)   # evicts key 2\nprint(c.get(2), c.get(1), c.get(3))   # -1 1 3"
      },
      "more": "- For memoizing function calls, `functools.lru_cache(maxsize=...)` does this already.",
      "cx": "get/put O(1)",
      "see": [
        "#/topic/design-ds",
        "#/problem/146"
      ],
      "check": "assert c.get(2) == -1 and c.get(1) == 1 and c.get(3) == 3\nc.put(4,4); assert c.get(1) == -1"
    },
    {
      "id": "ds-lru-dll",
      "title": "LRU cache with hash map and doubly linked list",
      "q": [
        "lru cache without ordereddict",
        "implement lru cache from scratch",
        "lru cache doubly linked list hash map",
        "design lru cache interview",
        "how does an lru cache work internally"
      ],
      "tags": "lru cache doubly linked list hash map from scratch sentinel node eviction",
      "a": "Keep a dict from key to node and a doubly linked list ordered by recency (most recent next to the head). Get moves the node to the front; put inserts at the front and, if full, removes the node before the tail sentinel and deletes its key. All O(1).",
      "code": {
        "py": "class Node:\n    def __init__(self, k=0, v=0):\n        self.k, self.v, self.prev, self.next = k, v, None, None\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap, self.m = capacity, {}\n        self.head, self.tail = Node(), Node()\n        self.head.next, self.tail.prev = self.tail, self.head\n    def _remove(self, n):\n        n.prev.next, n.next.prev = n.next, n.prev\n    def _add_front(self, n):\n        n.prev, n.next = self.head, self.head.next\n        self.head.next.prev = n; self.head.next = n\n    def get(self, key):\n        if key not in self.m: return -1\n        n = self.m[key]; self._remove(n); self._add_front(n)\n        return n.v\n    def put(self, key, value):\n        if key in self.m:\n            n = self.m[key]; n.v = value\n            self._remove(n); self._add_front(n)\n            return\n        if len(self.m) == self.cap:\n            lru = self.tail.prev\n            self._remove(lru); del self.m[lru.k]\n        n = Node(key, value); self.m[key] = n; self._add_front(n)\n\nc = LRUCache(2)\nc.put(1, 1); c.put(2, 2); c.get(1); c.put(3, 3)\nprint(c.get(2), c.get(1), c.get(3))   # -1 1 3"
      },
      "more": "- The node stores its key so eviction can delete the dict entry.\n- Sentinels remove all None checks.",
      "cx": "get/put O(1), O(capacity) space",
      "see": [
        "#/topic/design-ds",
        "#/problem/146"
      ],
      "check": "assert c.get(2) == -1 and c.get(1) == 1 and c.get(3) == 3\nc.put(1, 9); assert c.get(1) == 9 and len(c.m) == 2"
    },
    {
      "id": "ds-lfu",
      "title": "LFU cache idea (and a working version)",
      "q": [
        "lfu cache",
        "least frequently used cache",
        "design lfu cache",
        "lfu vs lru",
        "implement lfu cache o(1)"
      ],
      "tags": "lfu cache least frequently used frequency buckets min freq ordereddict design",
      "a": "LFU evicts the key with the lowest access count (ties broken by least recent). O(1) design: a dict of key to (value, freq), a dict of freq to an OrderedDict of keys, and a `min_freq` counter that resets to 1 on every new insert.",
      "code": {
        "py": "from collections import defaultdict, OrderedDict\n\nclass LFUCache:\n    def __init__(self, capacity):\n        self.cap, self.kv, self.freq = capacity, {}, {}\n        self.buckets, self.min_f = defaultdict(OrderedDict), 0\n    def _touch(self, key):\n        f = self.freq[key]; del self.buckets[f][key]\n        if not self.buckets[f] and self.min_f == f: self.min_f += 1\n        self.freq[key] = f + 1; self.buckets[f + 1][key] = None\n    def get(self, key):\n        if key not in self.kv: return -1\n        self._touch(key); return self.kv[key]\n    def put(self, key, value):\n        if self.cap == 0: return\n        if key in self.kv:\n            self.kv[key] = value; self._touch(key); return\n        if len(self.kv) == self.cap:\n            old, _ = self.buckets[self.min_f].popitem(last=False)\n            del self.kv[old], self.freq[old]\n        self.kv[key], self.freq[key] = value, 1\n        self.buckets[1][key] = None; self.min_f = 1\n\nc = LFUCache(2)\nc.put(1, 1); c.put(2, 2); c.get(1); c.put(3, 3)   # evicts 2 (freq 1)\nprint(c.get(2), c.get(3), c.get(1))   # -1 3 1"
      },
      "more": "- LRU only tracks recency; LFU tracks frequency and can keep stale popular keys forever.",
      "cx": "get/put O(1)",
      "see": [
        "#/topic/design-ds",
        "#/problem/460"
      ],
      "check": "assert c.get(2) == -1 and c.get(3) == 3 and c.get(1) == 1\nc.put(4, 4); assert c.get(3) == -1 or c.get(1) == -1"
    },
    {
      "id": "ds-monotonic-stack",
      "title": "Monotonic stack: what it is and the template",
      "q": [
        "what is a monotonic stack",
        "monotonic stack template",
        "daily temperatures monotonic stack",
        "monotonic increasing stack python",
        "when to use a monotonic stack"
      ],
      "tags": "monotonic stack template next greater smaller previous daily temperatures histogram",
      "a": "A monotonic stack keeps its items in sorted order (increasing or decreasing) by popping any item that breaks the order before pushing the new one. It answers \"next/previous greater or smaller element\" for every index in O(n) total, because each index is pushed and popped once.",
      "code": {
        "py": "def daily_temperatures(t):\n    ans, st = [0] * len(t), []          # st holds indices with decreasing temps\n    for i, x in enumerate(t):\n        while st and t[st[-1]] < x:\n            j = st.pop()\n            ans[j] = i - j              # days until a warmer day\n        st.append(i)\n    return ans\n\nprint(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))\n# [1, 1, 4, 2, 1, 1, 0, 0]"
      },
      "more": "- Decreasing stack finds next GREATER; increasing stack finds next SMALLER.\n- Classic uses: histogram largest rectangle, trapping rain water, stock span.",
      "cx": "O(n) time, O(n) space",
      "see": [
        "#/topic/monotonic",
        "#/problem/739"
      ],
      "check": "assert daily_temperatures([73,74,75,71,69,72,76,73]) == [1,1,4,2,1,1,0,0] and daily_temperatures([]) == []"
    },
    {
      "id": "ds-monotonic-deque",
      "title": "Monotonic deque: what it is",
      "q": [
        "what is a monotonic deque",
        "monotonic queue",
        "when to use monotonic deque",
        "sliding window min with deque",
        "deque for window minimum"
      ],
      "tags": "monotonic deque monotonic queue sliding window minimum maximum front expire",
      "a": "A monotonic deque is a deque kept in sorted order from the back (like a monotonic stack) that also drops items from the front when they leave a window. The front is always the window's max (or min). Use it for sliding-window extremes and DP optimizations in O(n).",
      "code": {
        "py": "from collections import deque\n\ndef sliding_min(nums, k):\n    dq, out = deque(), []                # indices, values increasing\n    for i, x in enumerate(nums):\n        while dq and nums[dq[-1]] >= x: dq.pop()\n        dq.append(i)\n        if dq[0] <= i - k: dq.popleft()\n        if i >= k - 1: out.append(nums[dq[0]])\n    return out\n\nprint(sliding_min([4, 2, 12, 3, 8], 3))   # [2, 2, 3]"
      },
      "more": "- Store indices, not values, so you can tell when an item expired.",
      "cx": "O(n)",
      "see": [
        "#/topic/monotonic",
        "#/topic/sliding-window"
      ],
      "check": "assert sliding_min([4,2,12,3,8],3) == [2,2,3] and sliding_min([5],1) == [5]"
    },
    {
      "id": "ds-sparse-table",
      "title": "Sparse table for range minimum queries",
      "q": [
        "sparse table",
        "range minimum query o(1)",
        "rmq sparse table python",
        "static range min query",
        "sparse table build"
      ],
      "tags": "sparse table range minimum query rmq static idempotent log table doubling",
      "a": "A sparse table precomputes min over every range of length 2^j in O(n log n). Any range min is then the min of two overlapping power-of-two blocks, answered in O(1). It supports no updates and works for idempotent operations (min, max, gcd), not sum.",
      "code": {
        "py": "class SparseTable:\n    def __init__(self, a):\n        self.t = [list(a)]\n        j = 1\n        while (1 << j) <= len(a):\n            prev = self.t[-1]\n            self.t.append([min(prev[i], prev[i + (1 << (j - 1))])\n                           for i in range(len(a) - (1 << j) + 1)])\n            j += 1\n    def query(self, l, r):               # min of a[l..r], inclusive\n        k = (r - l + 1).bit_length() - 1\n        return min(self.t[k][l], self.t[k][r - (1 << k) + 1])\n\ns = SparseTable([5, 2, 4, 7, 6, 3, 1, 2])\nprint(s.query(0, 3), s.query(3, 5), s.query(4, 4))   # 2 3 6"
      },
      "more": "- Overlap is fine because min(x, x) = x.\n- For updates use a segment tree.",
      "cx": "build O(n log n); query O(1)",
      "see": [
        "#/topic/segment-tree"
      ],
      "check": "assert s.query(0,7) == 1 and s.query(1,1) == 2 and s.query(3,5) == 3"
    },
    {
      "id": "ds-interval-tree",
      "title": "Interval tree idea",
      "q": [
        "what is an interval tree",
        "find all intervals overlapping a point",
        "interval tree vs segment tree",
        "stabbing query intervals",
        "overlapping interval queries data structure"
      ],
      "tags": "interval tree overlapping intervals stabbing query augmented bst max end",
      "a": "An interval tree is a balanced BST keyed by interval start, where each node also stores the maximum end in its subtree. That lets it find an interval overlapping a query in O(log n) by skipping subtrees whose max end is too small. Use it for dynamic sets of intervals; for a static list a sort plus sweep is simpler.",
      "code": {
        "py": "# Overlap test for [a, b] and [c, d] closed intervals:\ndef overlaps(a, b, c, d):\n    return a <= d and c <= b\n\nprint(overlaps(1, 5, 4, 8), overlaps(1, 2, 3, 4))   # True False"
      },
      "more": "- Search rule at a node: if left child exists and left.max_end >= query start, go left; else go right.\n- Python has no built-in one; the `intervaltree` package exists but is third-party.\n- Interview tasks (merge intervals, meeting rooms) are usually solved by sorting instead.",
      "cx": "insert/query O(log n) on a balanced tree",
      "see": [
        "#/topic/intervals"
      ],
      "check": "assert overlaps(1,5,4,8) and not overlaps(1,2,3,4) and overlaps(1,2,2,3)"
    },
    {
      "id": "ds-bloom-filter",
      "title": "Bloom filter",
      "q": [
        "what is a bloom filter",
        "implement a bloom filter python",
        "probabilistic set membership",
        "bloom filter false positives",
        "bloom filter vs hash set"
      ],
      "tags": "bloom filter probabilistic membership false positive bit array hash functions",
      "a": "A Bloom filter is a bit array plus k hash functions. Add sets k bits; a lookup says \"possibly present\" if all k bits are set, or \"definitely absent\" if any is clear. It has false positives but no false negatives, and cannot delete.",
      "code": {
        "py": "import hashlib\n\nclass Bloom:\n    def __init__(self, m=1024, k=3):\n        self.m, self.k, self.bits = m, k, bytearray(m)\n    def _hashes(self, item):\n        for i in range(self.k):\n            h = hashlib.sha256(f\"{i}:{item}\".encode()).digest()\n            yield int.from_bytes(h[:8], \"big\") % self.m\n    def add(self, item):\n        for h in self._hashes(item): self.bits[h] = 1\n    def might_contain(self, item):\n        return all(self.bits[h] for h in self._hashes(item))\n\nb = Bloom()\nfor w in [\"cat\", \"dog\"]: b.add(w)\nprint(b.might_contain(\"cat\"), b.might_contain(\"zebra\"))   # True False (almost surely)"
      },
      "more": "- False positive rate is about (1 - e^(-kn/m))^k; size m and k from expected n.\n- Use for cheap \"not in cache/DB\" checks (CDNs, databases, crawlers).\n- Counting Bloom filters allow deletes.",
      "cx": "add/lookup O(k); space O(m) bits",
      "see": [
        "#/topic/hashing-internals"
      ],
      "check": "assert b.might_contain(\"cat\") and b.might_contain(\"dog\")\nassert not any(b.might_contain(f\"nope{i}\") for i in range(3))"
    },
    {
      "id": "ds-skip-list",
      "title": "Skip list idea",
      "q": [
        "what is a skip list",
        "skip list implementation",
        "skip list vs balanced tree",
        "how does a skip list work",
        "probabilistic data structure ordered set"
      ],
      "tags": "skip list probabilistic levels ordered linked list express lanes redis",
      "a": "A skip list is a sorted linked list with extra \"express lane\" levels; each node is promoted to the next level with probability 1/2. Search drops down levels, giving expected O(log n) search, insert and delete with simpler code than a balanced tree. Redis sorted sets use one.",
      "code": {
        "py": "import random\n\nclass SNode:\n    def __init__(self, key, level):\n        self.key, self.next = key, [None] * level\n\nclass SkipList:\n    MAX = 16\n    def __init__(self):\n        self.head, self.level = SNode(None, self.MAX), 1\n    def _rand_level(self):\n        lv = 1\n        while lv < self.MAX and random.random() < 0.5: lv += 1\n        return lv\n    def search(self, key):\n        n = self.head\n        for i in range(self.level - 1, -1, -1):\n            while n.next[i] and n.next[i].key < key: n = n.next[i]\n        n = n.next[0]\n        return bool(n and n.key == key)\n    def insert(self, key):\n        update, n = [self.head] * self.MAX, self.head\n        for i in range(self.level - 1, -1, -1):\n            while n.next[i] and n.next[i].key < key: n = n.next[i]\n            update[i] = n\n        lv = self._rand_level()\n        self.level = max(self.level, lv)\n        new = SNode(key, lv)\n        for i in range(lv):\n            new.next[i] = update[i].next[i]; update[i].next[i] = new\n\ns = SkipList()\nfor x in [5, 1, 9, 3]: s.insert(x)\nprint(s.search(3), s.search(4))   # True False"
      },
      "more": "- Expected, not worst-case, bounds: bad luck can degrade it.\n- Easier than a red-black tree to make lock-free, so it shows up in concurrent maps.",
      "cx": "expected O(log n) search/insert/delete",
      "see": [
        "#/topic/design-ds"
      ],
      "check": "assert s.search(9) and s.search(1) and not s.search(4) and not SkipList().search(1)"
    },
    {
      "id": "ds-grid-neighbors",
      "title": "Traverse neighbors in a 2D grid",
      "q": [
        "grid neighbors python",
        "iterate 4 directions in a matrix",
        "dfs on a grid",
        "how to visit adjacent cells",
        "matrix 8 directions"
      ],
      "tags": "grid matrix neighbors directions up down left right bounds dr dc 4-directional 8-directional",
      "a": "Keep a list of direction offsets and, for each, compute the new row/column and check bounds before using it. Use 4 directions for up/down/left/right, add the diagonals for 8.",
      "code": {
        "py": "DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1)]            # 4-way\nDIRS8 = DIRS + [(1, 1), (1, -1), (-1, 1), (-1, -1)]\n\ndef neighbors(grid, r, c, dirs=DIRS):\n    R, C = len(grid), len(grid[0])\n    for dr, dc in dirs:\n        nr, nc = r + dr, c + dc\n        if 0 <= nr < R and 0 <= nc < C:\n            yield nr, nc\n\ng = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nprint([g[r][c] for r, c in neighbors(g, 0, 0)])   # [4, 2]\nprint(len(list(neighbors(g, 1, 1, DIRS8))))       # 8"
      },
      "more": "- Grid is `grid[row][col]`; rows = `len(grid)`, cols = `len(grid[0])`.\n- Mark visited by mutating the cell or with a set of (r, c).\n- Create a grid with `[[0]*C for _ in range(R)]`, never `[[0]*C]*R` (shared rows).",
      "cx": "O(1) per cell",
      "see": [
        "#/topic/matrix"
      ],
      "check": "assert sorted(g[r][c] for r,c in neighbors(g,0,0)) == [2,4] and len(list(neighbors(g,1,1))) == 4 and len(list(neighbors(g,0,0,DIRS8))) == 3"
    },
    {
      "id": "ds-grid-rotate",
      "title": "Rotate a matrix 90 degrees",
      "q": [
        "rotate image",
        "rotate a matrix 90 degrees clockwise",
        "rotate matrix in place python",
        "rotate 2d array",
        "rotate square matrix"
      ],
      "tags": "rotate matrix image 90 degrees clockwise counterclockwise in place transpose reverse zip",
      "a": "Clockwise rotation = transpose then reverse each row. In one line: `[list(r) for r in zip(*m[::-1])]`. In place for an n x n matrix: transpose by swapping across the diagonal, then reverse each row. Counterclockwise: reverse rows first or reverse each row then transpose.",
      "code": {
        "py": "def rotate(m):                       # in place, clockwise, square matrix\n    n = len(m)\n    for i in range(n):\n        for j in range(i + 1, n):\n            m[i][j], m[j][i] = m[j][i], m[i][j]\n    for row in m: row.reverse()\n\nm = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nprint([list(r) for r in zip(*m[::-1])])   # [[7, 4, 1], [8, 5, 2], [9, 6, 3]]\nrotate(m)\nprint(m)                                   # [[7, 4, 1], [8, 5, 2], [9, 6, 3]]"
      },
      "more": "- Non-square matrices cannot be rotated in place; use the zip form.",
      "cx": "O(n^2) time, O(1) extra (in place)",
      "see": [
        "#/topic/matrix",
        "#/problem/48"
      ],
      "check": "assert m == [[7,4,1],[8,5,2],[9,6,3]]\nz = [[1]]; rotate(z); assert z == [[1]]"
    },
    {
      "id": "ds-grid-spiral",
      "title": "Spiral order of a matrix",
      "q": [
        "spiral matrix",
        "print matrix in spiral order",
        "traverse matrix in a spiral python",
        "spiral traversal 2d array"
      ],
      "tags": "spiral matrix traversal boundaries top bottom left right layer",
      "a": "Keep four boundaries (top, bottom, left, right) and walk the top row, right column, bottom row and left column, shrinking the boundary after each side. Check that rows or columns remain before the last two sides.",
      "code": {
        "py": "def spiral(m):\n    out = []\n    top, bot, left, right = 0, len(m) - 1, 0, len(m[0]) - 1\n    while top <= bot and left <= right:\n        out += m[top][left:right + 1]; top += 1\n        for r in range(top, bot + 1): out.append(m[r][right])\n        right -= 1\n        if top <= bot:\n            out += m[bot][left:right + 1][::-1]; bot -= 1\n        if left <= right:\n            for r in range(bot, top - 1, -1): out.append(m[r][left])\n            left += 1\n    return out\n\nprint(spiral([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))   # [1, 2, 3, 6, 9, 8, 7, 4, 5]"
      },
      "cx": "O(R x C)",
      "see": [
        "#/topic/matrix",
        "#/problem/54"
      ],
      "check": "assert spiral([[1,2,3],[4,5,6],[7,8,9]]) == [1,2,3,6,9,8,7,4,5]\nassert spiral([[1,2,3,4]]) == [1,2,3,4] and spiral([[1],[2],[3]]) == [1,2,3]\nassert spiral([[1,2],[3,4],[5,6]]) == [1,2,4,6,5,3]"
    },
    {
      "id": "ds-grid-transpose",
      "title": "Transpose a matrix",
      "q": [
        "transpose a matrix python",
        "swap rows and columns",
        "matrix transpose zip",
        "transpose non square matrix"
      ],
      "tags": "transpose matrix rows columns zip star swap diagonal",
      "a": "The transpose swaps rows and columns: `m[i][j]` becomes `t[j][i]`. In Python use `list(zip(*m))` (tuples) or `[list(r) for r in zip(*m)]` (lists); it works for non-square matrices.",
      "code": {
        "py": "m = [[1, 2, 3], [4, 5, 6]]\nt = [list(r) for r in zip(*m)]\nprint(t)   # [[1, 4], [2, 5], [3, 6]]\n\ndef transpose_in_place(a):          # square only\n    for i in range(len(a)):\n        for j in range(i + 1, len(a)):\n            a[i][j], a[j][i] = a[j][i], a[i][j]\n\nsq = [[1, 2], [3, 4]]; transpose_in_place(sq)\nprint(sq)   # [[1, 3], [2, 4]]"
      },
      "more": "- In place only works for square matrices.",
      "cx": "O(R x C)",
      "see": [
        "#/topic/matrix"
      ],
      "check": "assert t == [[1,4],[2,5],[3,6]] and sq == [[1,3],[2,4]] and [list(r) for r in zip(*t)] == m"
    },
    {
      "id": "ds-string-as-array",
      "title": "Strings as arrays (immutable in Python)",
      "q": [
        "are strings arrays",
        "python strings immutable",
        "how to modify a string character in python",
        "string to list of characters and back",
        "build a string efficiently"
      ],
      "tags": "string array characters immutable join list index slice build concatenation",
      "a": "A string is a sequence of characters you can index and slice like an array, but in Python (and Java, JS) it is immutable: you cannot assign `s[0] = \"x\"`. To edit, convert to a list, change it, and `\"\".join` back. Build large strings with a list and join, not repeated `+=`.",
      "code": {
        "py": "s = \"hello\"\nprint(s[0], s[-1], s[1:3], len(s))   # h o el 5\nchars = list(s)\nchars[0] = \"J\"\nt = \"\".join(chars)\nprint(t)                              # Jello\nparts = []\nfor i in range(5): parts.append(str(i))\nprint(\"\".join(parts))                 # 01234"
      },
      "more": "- Each s[i:j] slice copies, O(j-i).\n- Repeated `s += c` in a loop can be O(n^2) in the worst case; join is O(n).\n- In C++, std::string is mutable.",
      "cx": "index O(1); slice O(k); join O(total)",
      "see": [
        "#/cheatsheets/python",
        "#/topic/arrays-hashing"
      ],
      "check": "assert t == \"Jello\" and s == \"hello\"\ntry:\n    s[0] = \"x\"; assert False\nexcept TypeError:\n    pass"
    }
  );
})();
