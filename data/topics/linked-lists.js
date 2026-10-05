/* Offer Ready: Linked lists lesson. Schema: README.md, "Adding content".
   Every runnable snippet here is checked by tools/verify_content.py (py and js; Java and C++ list code is checked
   with the same cases through a ListNode harness, because the tool's Java/C++ harness has no list type).
   Cycle code can't be given array test cases (the runner can't build a loop), so it is checked separately. */
(function () {
  var OR = (window.OR = window.OR || {});
  (OR.topics = OR.topics || []).push({
    id: 'linked-lists',

    hook: 'Linked-list questions rarely test a clever algorithm. They test whether you can **rewire pointers without losing the rest of the list**, and whether you reach for a dummy node and two runners instead of special cases and extra memory. The pointer moves are short, the failure modes are brutal (a lost tail, an accidental loop, a null dereference), and the problems are common enough that NeetCode 150 gives them a section of their own. The reps pay off twice: LRU caches and several design questions are linked lists underneath.',

    cues: [
      'The input is a **ListNode** chain (`val`, `next`), and you can only walk it forward from the head.',
      'You’re asked to **reverse** all of it, a part of it, or it in groups, ideally **in place**.',
      'You want the **middle**, the **nth from the end**, or to **split** the list in halves, and you can’t index into it or ask for its length.',
      'The question asks whether the list **loops back on itself**, or where the loop starts, ideally with no extra memory.',
      'The head itself might be deleted, or you’re building a result list from nothing (merging, adding digit lists): the first node is a special case.',
      'The trap: the question says “O(1) extra space”. Copying into an array and working there is the answer interviewers want you to avoid.'
    ],

    intuition: [
      'A linked list is a scavenger hunt. Each clue (node) holds a prize (`val`) and tells you where the next clue is (`next`). You can’t jump to clue 5; you can only follow the chain from clue 1. And if you tear up a clue before you’ve written down where it points, the rest of the hunt is gone for good.',
      'That last sentence is the whole topic. Rewiring one `next` always **overwrites the only pointer** to something. Before any rewire, ask: “If I overwrite this, will I still be able to reach everything I need?” If not, save it in a variable first.',
      'Three tools cover almost every problem:',
      '1. **Pointer rewiring in place.** Hold two or three pointers (`prev`, `cur`, `nxt`) and flip arrows one node at a time. Reversing a list is the model: save `nxt = cur.next`, point `cur.next` at `prev`, then step all three forward. No node moves; only arrows change.\n2. **A dummy head** (also called a sentinel). Put a fake node in front of the real head so the head is no longer special. Deleting the first node, or appending to an empty result, becomes the same operation as everywhere else. Return `dummy.next` at the end.\n3. **Fast and slow runners.** Walk one pointer one step at a time and another two steps at a time. When the fast one reaches the end, the slow one is at the middle. If the list is a ring, the fast one eventually laps the slow one and they meet. Keep the two pointers a fixed gap apart instead, and when the front one hits the end, the back one sits exactly where you need it (the nth node from the end).',
      'Why does the lapping argument work? Inside a cycle, the gap between the two runners shrinks by exactly 1 each step (fast gains one node per step), so it must reach 0: they can’t jump over each other. On a list that ends in `null`, the fast runner just falls off the end, which is your “no cycle” answer.',
      'Draw it before you code. Three or four boxes, arrows between them, and your pointers as labels underneath. Interviewers watch you do this, and it’s the quickest way to catch an order-of-operations bug.'
    ].join('\n\n'),

    viz: 'linked-list',

    template: {
      title: 'Reverse in place: save next, flip, advance',
      note: 'The skeleton for **every** in-place pointer routine: decide what must survive the rewire (`nxt`), do the rewire, then advance. Reversing a sublist, reversing in groups, swapping pairs and “reverse the second half” all reuse these three lines. The order is the rule: **save, then flip, then advance**. Swap the first two lines and the rest of the list is lost (try the “skip the save” switch above).',
      code: {
        py: `def reverse_list(head):
    prev, cur = None, head                #> prev is the head of the reversed part; cur is the next node to flip
    while cur:                            #> One node per pass; stop when cur falls off the end
        nxt = cur.next                    #@save > 1. Save the rest of the list BEFORE rewiring
        cur.next = prev                   #@link > 2. Flip this node's arrow backwards
        prev, cur = cur, nxt              #@advance > 3. Step both pointers forward
    return prev                           #@done > cur is null, so prev is the old tail: the new head`,
        js: `function reverseList(head) {
  let prev = null, cur = head;            //> prev is the head of the reversed part; cur is the next node to flip
  while (cur) {                           //> One node per pass; stop when cur falls off the end
    const nxt = cur.next;                 //@save > 1. Save the rest of the list BEFORE rewiring
    cur.next = prev;                      //@link > 2. Flip this node's arrow backwards
    prev = cur; cur = nxt;                //@advance > 3. Step both pointers forward
  }
  return prev;                            //@done > cur is null, so prev is the old tail: the new head
}`,
        java: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;     //> prev is the head of the reversed part; cur is the next node to flip
        while (cur != null) {                 //> One node per pass; stop when cur falls off the end
            ListNode nxt = cur.next;          //@save > 1. Save the rest of the list BEFORE rewiring
            cur.next = prev;                  //@link > 2. Flip this node's arrow backwards
            prev = cur; cur = nxt;            //@advance > 3. Step both pointers forward
        }
        return prev;                          //@done > cur is null, so prev is the old tail: the new head
    }
}`,
        cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *prev = nullptr, *cur = head;  //> prev is the head of the reversed part; cur is the next node to flip
        while (cur) {                           //> One node per pass; stop when cur falls off the end
            ListNode* nxt = cur->next;          //@save > 1. Save the rest of the list BEFORE rewiring
            cur->next = prev;                   //@link > 2. Flip this node's arrow backwards
            prev = cur; cur = nxt;              //@advance > 3. Step both pointers forward
        }
        return prev;                            //@done > cur is null, so prev is the old tail: the new head
    }
};`
      },
      tests: { fn: { py: 'reverse_list', default: 'reverseList' }, argTypes: ['list'], cases: [
        { args: [[1, 2, 3, 4, 5]], out: [5, 4, 3, 2, 1] }, { args: [[1, 2]], out: [2, 1] }, { args: [[7]], out: [7] }, { args: [[]], out: null }, { args: [[3, 3, 1]], out: [1, 3, 3] }] }
    },

    complexity: {
      time: 'O(n)',
      space: 'O(1)',
      why: 'Each pattern walks the list a constant number of times, and every step does O(1) pointer work, so the time is O(n). The in-place routines (reverse, swap pairs, remove duplicates, the runners) use a handful of pointer variables and never allocate nodes: O(1) extra space. Merge sort on a list is the exception: O(n log n) time, with O(log n) stack for the recursion.',
      trap: 'Two traps. First, a **recursive** reversal looks O(1) but uses O(n) call-stack space (and in Python, the default recursion limit of about 1,000 frames crashes on long lists). If the interviewer says “O(1) space”, write the iterative version. Second, “is there a cycle?” with a visited set is O(n) space; the fast and slow runners get the same answer in O(1). Say the trade-off out loud, then give the one they asked for.'
    },

    variations: [
      {
        name: 'Dummy head: when the head might change',
        body: 'Anything that can delete the first node (removing every node with a value), or builds a result from nothing (merging, adding two numbers), has an awkward first step: “is there a head yet?” A **dummy node** in front removes the question. Keep `prev` pointing at the node *before* the one you’re examining; deleting is `prev.next = prev.next.next`, and you only advance `prev` when you **didn’t** delete (the new neighbor may need deleting too). Return `dummy.next`.',
        code: {
          py: `def remove_all(head, val):
    dummy = ListNode(0, head)               #> A fake node before the head: the head needs no special case
    prev = dummy
    while prev.next:
        if prev.next.val == val:
            prev.next = prev.next.next      #> Skip the node. Don't advance prev: the new next may match too
        else:
            prev = prev.next
    return dummy.next                       #> The real head, which may have changed`,
          js: `function removeAll(head, val) {
  const dummy = new ListNode(0, head);         //> A fake node before the head: the head needs no special case
  let prev = dummy;
  while (prev.next) {
    if (prev.next.val === val) prev.next = prev.next.next;   //> Skip the node. Don't advance prev: the new next may match too
    else prev = prev.next;
  }
  return dummy.next;                           //> The real head, which may have changed
}`,
          java: `class Solution {
    public ListNode removeAll(ListNode head, int val) {
        ListNode dummy = new ListNode(0, head);   //> A fake node before the head: the head needs no special case
        ListNode prev = dummy;
        while (prev.next != null) {
            if (prev.next.val == val) prev.next = prev.next.next;   //> Skip the node. Don't advance prev: the new next may match too
            else prev = prev.next;
        }
        return dummy.next;                        //> The real head, which may have changed
    }
}`,
          cpp: `class Solution {
public:
    ListNode* removeAll(ListNode* head, int val) {
        ListNode dummy(0, head);                  //> A fake node before the head: the head needs no special case
        ListNode* prev = &dummy;
        while (prev->next) {
            if (prev->next->val == val) prev->next = prev->next->next;   //> Skip the node. Don't advance prev: the new next may match too
            else prev = prev->next;
        }
        return dummy.next;                        //> The real head, which may have changed
    }
};`
        },
        tests: { fn: { py: 'remove_all', default: 'removeAll' }, argTypes: ['list'], cases: [
          { args: [[1, 2, 6, 3, 4, 5, 6], 6], out: [1, 2, 3, 4, 5] }, { args: [[7, 7, 7, 7], 7], out: null }, { args: [[], 1], out: null }, { args: [[1, 2, 2, 1], 2], out: [1, 1] }, { args: [[5, 1, 5], 5], out: [1] }] }
      },
      {
        name: 'Fast and slow: the middle',
        body: 'Slow takes one step, fast takes two. When fast runs off the end, slow is at the middle. For an odd length that’s the exact middle; for an even length this version returns the **second** of the two middle nodes. To get the first one instead (you need it to split a list into two halves), start `fast` one node ahead: `fast = head.next`. The loop condition is `fast and fast.next`, in that order: fast can be `null` after an even-length run, and `null.next` crashes.',
        code: {
          py: `def middle(head):
    slow = fast = head
    while fast and fast.next:         #> Check fast first: after an even-length run it can be None
        slow = slow.next              #> slow takes one step
        fast = fast.next.next         #> fast takes two
    return slow                       #> Even length: the second of the two middle nodes`,
          js: `function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {         //> Check fast first: after an even-length run it can be null
    slow = slow.next;                 //> slow takes one step
    fast = fast.next.next;            //> fast takes two
  }
  return slow;                        //> Even length: the second of the two middle nodes
}`,
          java: `class Solution {
    public ListNode middle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {   //> Check fast first: after an even-length run it can be null
            slow = slow.next;                         //> slow takes one step
            fast = fast.next.next;                    //> fast takes two
        }
        return slow;                                  //> Even length: the second of the two middle nodes
    }
}`,
          cpp: `class Solution {
public:
    ListNode* middle(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {                  //> Check fast first: after an even-length run it can be null
            slow = slow->next;                        //> slow takes one step
            fast = fast->next->next;                  //> fast takes two
        }
        return slow;                                  //> Even length: the second of the two middle nodes
    }
};`
        },
        tests: { fn: 'middle', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: [3, 4, 5] }, { args: [[1, 2, 3, 4, 5, 6]], out: [4, 5, 6] }, { args: [[1]], out: [1] }, { args: [[1, 2]], out: [2] }] }
      },
      {
        name: 'Fast and slow: does the list loop?',
        body: 'Same two runners, a different question. If the list ends, `fast` reaches `null` and you return false. If it’s a ring, `fast` can never reach `null`; inside the ring the gap between the runners closes by one each step, so they land on the same node. Compare nodes by **identity** (`is`, `===`, `==` on references, pointer equality), never by `val`: two different nodes can hold the same value.',
        code: {
          py: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:               #> Same node, not just the same value
            return True
    return False                       #> fast fell off the end: the list ends`,
          js: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;    //> Same node, not just the same value
  }
  return false;                        //> fast fell off the end: the list ends
}`,
          java: `class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;    //> Same node (reference equality), not just the same value
        }
        return false;                         //> fast fell off the end: the list ends
    }
}`,
          cpp: `class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;    //> Same node (pointer equality), not just the same value
        }
        return false;                         //> fast fell off the end: the list ends
    }
};`
        }
      },
      {
        name: 'Combining the tools: palindrome and reorder',
        body: 'Many “medium” list questions are two or three tools in a row. **Palindrome list (234):** find the middle with the runners, reverse the second half with the template, then walk both halves comparing values. **Reorder list (143):** find the middle, cut the list there (`slow.next = None`, or you’ve built a loop), reverse the second half, then interleave the halves. **Sort list (148):** split at the middle, sort each half recursively, merge. Name each tool as you use it: it shows the interviewer you’re composing known pieces, not guessing.'
      },
      {
        name: 'When a linked list is the wrong tool',
        body: 'Linked lists give O(1) insert and delete **once you hold the node**, and O(n) to reach the k-th node. If you need random access or binary search, use an array. If you need O(1) removal from the middle by key, pair the list with a hash map: that’s the LRU cache (a doubly linked list plus a map, in [Design questions](#/topic/design-ds)). In real code, arrays and dynamic arrays win on cache locality almost every time; in interviews, the point is the pointer discipline.'
      }
    ],

    worked: [
      {
        lc: 206,
        restate: 'Given the head of a singly linked list, reverse the list and return the new head.',
        examples: '- `1→2→3→4→5` gives `5→4→3→2→1`.\n- `1→2` gives `2→1`.\n- Edge cases: an empty list (return null) and a single node (return it unchanged).',
        brute: 'Copy the values into an array, reverse it, and write them back (or build new nodes). That works, but it spends O(n) extra space and, if the interviewer asked for in-place, it misses the point.',
        insight: 'Don’t move nodes: flip each arrow. Walk the list with `cur`, keeping `prev` as the head of the already reversed part. For each node, **save** `cur.next`, **point** it at `prev`, then **advance** both pointers. When `cur` runs off the end, `prev` is the new head.',
        code: {
          py: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, cur = None, head
        while cur:
            nxt = cur.next      # save the rest before rewiring
            cur.next = prev     # flip the arrow
            prev, cur = cur, nxt
        return prev`,
          js: `function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const nxt = cur.next;   // save the rest before rewiring
    cur.next = prev;        // flip the arrow
    prev = cur; cur = nxt;
  }
  return prev;
}`,
          java: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;
        while (cur != null) {
            ListNode nxt = cur.next;   // save the rest before rewiring
            cur.next = prev;           // flip the arrow
            prev = cur; cur = nxt;
        }
        return prev;
    }
}`,
          cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *prev = nullptr, *cur = head;
        while (cur) {
            ListNode* nxt = cur->next;   // save the rest before rewiring
            cur->next = prev;            // flip the arrow
            prev = cur; cur = nxt;
        }
        return prev;
    }
};`
        },
        complexity: 'O(n) time: one pass, O(1) work per node. O(1) space: three pointers.',
        say: '“I’ll reverse it in place by flipping each node’s next pointer. I keep prev, the head of the reversed part, and cur, the node I’m about to flip. For each node I first save cur.next, because rewiring overwrites it. Then I set cur.next to prev and move both forward. When cur is null, prev is the new head. One pass, constant space.”',
        followups: [
          { q: 'Can you do it recursively?', a: 'Yes: reverse everything after the head, then make `head.next.next = head` and `head.next = None`, and return the new head the recursion handed back. It’s O(n) time but O(n) stack, so on long lists in Python it hits the recursion limit. Write the iterative version first and mention this.' },
          { q: 'What happens if you write `cur.next = prev` before saving `nxt`?', a: 'The only pointer to the rest of the list is overwritten, so the loop reads `cur.next` (now `prev`) as the next node. You end with just the first node reversed and everything after it unreachable.' },
          { q: 'How would you reverse only part of the list?', a: 'Walk to the node before the sublist, then repeat the same flip for exactly `right - left` nodes, reconnecting both ends. That’s Reverse Linked List II (92), in the practice set.' },
          { q: 'Does it handle an empty list?', a: 'Yes. `cur` starts as null, the loop never runs, and it returns `prev`, which is null.' }
        ]
      },
      {
        lc: 21,
        restate: 'You get the heads of two sorted linked lists. Splice their nodes together into one sorted list and return its head.',
        examples: '- `1→2→4` and `1→3→4` give `1→1→2→3→4→4`.\n- One list empty: return the other.\n- Edge cases: both empty (null); lists of very different lengths; equal values (keep the first list’s node first, so the merge is stable).',
        brute: 'Dump both lists into an array, sort, and rebuild: O(n log n) time and O(n) space, and it ignores that both inputs are already sorted.',
        insight: 'Walk both lists with one pointer each, always attaching the smaller front node to the result. A **dummy head** means you never ask “is the result empty yet?”: `tail` starts at the dummy and every attach is the same line. When one list runs out, the other is already sorted, so hang the whole remainder on `tail.next` in one step.',
        code: {
          py: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = tail = ListNode()
        while list1 and list2:
            if list2.val < list1.val:
                tail.next, list2 = list2, list2.next
            else:
                tail.next, list1 = list1, list1.next
            tail = tail.next
        tail.next = list1 or list2     # attach whatever is left, in one step
        return dummy.next`,
          js: `function mergeTwoLists(list1, list2) {
  const dummy = new ListNode();
  let tail = dummy;
  while (list1 && list2) {
    if (list2.val < list1.val) { tail.next = list2; list2 = list2.next; }
    else { tail.next = list1; list1 = list1.next; }
    tail = tail.next;
  }
  tail.next = list1 || list2;     // attach whatever is left, in one step
  return dummy.next;
}`,
          java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(), tail = dummy;
        while (list1 != null && list2 != null) {
            if (list2.val < list1.val) { tail.next = list2; list2 = list2.next; }
            else { tail.next = list1; list1 = list1.next; }
            tail = tail.next;
        }
        tail.next = list1 != null ? list1 : list2;     // attach whatever is left, in one step
        return dummy.next;
    }
}`,
          cpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy, *tail = &dummy;
        while (list1 && list2) {
            if (list2->val < list1->val) { tail->next = list2; list2 = list2->next; }
            else { tail->next = list1; list1 = list1->next; }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;     // attach whatever is left, in one step
        return dummy.next;
    }
};`
        },
        complexity: 'O(n + m) time: every node is attached once. O(1) extra space: nodes are re-linked, not copied.',
        say: '“I’ll merge in place with a dummy head and a tail pointer. While both lists have nodes, I attach the smaller front node to the tail and advance that list and the tail. When one list is empty, I attach the other, which is already sorted. The dummy means I never special-case the head, and I return dummy.next. O(n + m) time, O(1) space.”',
        followups: [
          { q: 'Why `list2.val < list1.val` and not `<=` the other way?', a: 'With ties, the else branch takes `list1`’s node first, so equal values keep their original relative order across the merge. That’s a stable merge, and it’s what merge sort on a list relies on.' },
          { q: 'How would you do it recursively?', a: 'Pick the smaller head, set its `next` to the merge of the rest, and return it. It’s elegant but uses O(n + m) stack, so the iterative version is safer on long lists.' },
          { q: 'What about merging k sorted lists?', a: 'Keep the k current heads in a min-heap, pop the smallest, push its successor: O(N log k). Or merge pairs repeatedly, divide and conquer. See [Heaps](#/topic/heaps).' }
        ]
      },
      {
        lc: 19,
        restate: 'Given the head of a linked list and an integer n, remove the nth node from the **end** of the list and return the head.',
        examples: '- `1→2→3→4→5`, n = 2 gives `1→2→3→5`.\n- `1`, n = 1 gives an empty list.\n- Edge cases: n equals the length (the **head** is removed); n = 1 (the tail is removed).',
        brute: 'Walk once to count the length L, then walk again to the node at position L − n and unlink it. Two passes, O(n) time, O(1) space. It’s correct, and a fine first answer.',
        insight: 'Do it in one pass with two pointers a fixed **gap** apart. Start both at a dummy head. Move `fast` n nodes ahead, then move both together until `fast` is on the last node. Now `slow` sits on the node **before** the one to remove, because the gap between them is n. Unlink with `slow.next = slow.next.next`. The dummy head covers the case where the head itself is removed.',
        code: {
          py: `class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        slow = fast = dummy
        for _ in range(n):             # open a gap of n between the pointers
            fast = fast.next
        while fast.next:               # move together until fast is on the last node
            slow = slow.next
            fast = fast.next
        slow.next = slow.next.next     # slow is the node before the target
        return dummy.next`,
          js: `function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let slow = dummy, fast = dummy;
  for (let i = 0; i < n; i++) fast = fast.next;   // open a gap of n between the pointers
  while (fast.next) {                             // move together until fast is on the last node
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next;                     // slow is the node before the target
  return dummy.next;
}`,
          java: `class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode slow = dummy, fast = dummy;
        for (int i = 0; i < n; i++) fast = fast.next;   // open a gap of n between the pointers
        while (fast.next != null) {                     // move together until fast is on the last node
            slow = slow.next;
            fast = fast.next;
        }
        slow.next = slow.next.next;                     // slow is the node before the target
        return dummy.next;
    }
}`,
          cpp: `class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0, head);
        ListNode *slow = &dummy, *fast = &dummy;
        for (int i = 0; i < n; i++) fast = fast->next;   // open a gap of n between the pointers
        while (fast->next) {                             // move together until fast is on the last node
            slow = slow->next;
            fast = fast->next;
        }
        slow->next = slow->next->next;                   // slow is the node before the target
        return dummy.next;
    }
};`
        },
        complexity: 'O(L) time for a list of length L: one pass. O(1) space.',
        say: '“The simple way is two passes: count the length, then unlink position L minus n. To do it in one pass I use a dummy head and two pointers n nodes apart. I advance fast n steps, then move both until fast is on the last node. At that moment slow is the node before the one to delete, so I set slow.next to slow.next.next. The dummy handles removing the head. O(L) time, O(1) space.”',
        followups: [
          { q: 'Why start at the dummy rather than the head?', a: 'You need the node **before** the target to unlink it. If the target is the head, there is no such real node, so the dummy plays that role. It also keeps `slow.next.next` safe when n equals the length.' },
          { q: 'Is the one-pass version really faster than two passes?', a: 'Both are O(L). The one-pass version touches each node once instead of walking about 1.5 times, which matters little in practice. Interviewers like it because it shows you can hold a gap between pointers.' },
          { q: 'What if n is larger than the length?', a: 'LeetCode guarantees 1 ≤ n ≤ length. In a real system, `fast` would hit null while opening the gap; check for that and return the list unchanged (or raise an error).' }
        ]
      },
      {
        lc: 142,
        restate: 'Given the head of a linked list, return the node where a cycle begins, or null if there is no cycle. Don’t modify the list.',
        examples: '- `3→2→0→-4`, where `-4` points back to `2`: return the node holding 2.\n- `1→2`, where `2` points back to `1`: return the node holding 1.\n- `1` with no loop: return null.\n- Edge cases: a single node pointing to itself (it is its own entry); a loop that includes the head.',
        brute: 'Walk the list, putting each node in a hash set. The first node you reach that’s already in the set is the cycle’s entry; reaching null means no cycle. O(n) time, but O(n) space.',
        insight: 'Phase 1: run slow (one step) and fast (two steps). If they ever meet, there’s a cycle; if fast hits null, there isn’t. Phase 2: let `a` be the distance from the head to the entry, and `c` the cycle length. When they meet, slow has walked `a + b` for some `b` steps into the cycle, and fast has walked twice that, which is `a + b` plus some whole number of laps: `2(a + b) = a + b + kc`, so `a + b = kc`. That means walking `a` more steps from the meeting point lands exactly on the entry (mod the cycle). So reset one pointer to the head and move both one step at a time: they meet at the entry.',
        code: {
          py: `class Solution:
    def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:              # phase 1: they met, so there is a cycle
                slow = head               # phase 2: restart one pointer at the head
                while slow is not fast:
                    slow = slow.next
                    fast = fast.next
                return slow               # both land on the entry together
        return None`,
          js: `function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {             // phase 1: they met, so there is a cycle
      slow = head;                   // phase 2: restart one pointer at the head
      while (slow !== fast) {
        slow = slow.next;
        fast = fast.next;
      }
      return slow;                   // both land on the entry together
    }
  }
  return null;
}`,
          java: `class Solution {
    public ListNode detectCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {            // phase 1: they met, so there is a cycle
                slow = head;               // phase 2: restart one pointer at the head
                while (slow != fast) {
                    slow = slow.next;
                    fast = fast.next;
                }
                return slow;               // both land on the entry together
            }
        }
        return null;
    }
}`,
          cpp: `class Solution {
public:
    ListNode* detectCycle(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) {            // phase 1: they met, so there is a cycle
                slow = head;               // phase 2: restart one pointer at the head
                while (slow != fast) {
                    slow = slow->next;
                    fast = fast->next;
                }
                return slow;               // both land on the entry together
            }
        }
        return nullptr;
    }
};`
        },
        complexity: 'O(n) time: slow enters the cycle after at most n steps and fast catches it within one more lap, then phase 2 walks at most n steps. O(1) space.',
        say: '“The easy answer is a hash set of visited nodes: O(n) space. For O(1) space I use two phases. First, slow moves one step and fast moves two. If fast reaches null there’s no cycle; if they meet, there is one. Second, I put one pointer back at the head and move both one step at a time. The distance from the head to the entry equals the distance from the meeting point to the entry, going around the cycle, so they meet at the entry. O(n) time, O(1) space.”',
        followups: [
          { q: 'Why does fast catch slow instead of jumping over it?', a: 'Inside the cycle, the gap from fast back to slow shrinks by exactly 1 per step (fast moves 2, slow moves 1). A gap that shrinks by 1 hits 0; it can’t skip it.' },
          { q: 'Would moving fast three steps at a time also work?', a: 'The detection still works, but the gap can shrink by 2 and step over 0 for some cycle lengths, so the meeting may take more laps. The phase-2 argument also changes. Stick with 1 and 2.' },
          { q: 'How do you get the cycle’s length?', a: 'After they meet, keep one pointer fixed and walk the other around until it returns to it, counting the steps.' },
          { q: 'Where does the same idea show up in an array?', a: 'Find the Duplicate Number (287): treat `i → nums[i]` as a `next` pointer. A duplicate means two indices point to the same place, so there’s a cycle, and its entry is the duplicate. It’s in the practice set.' }
        ]
      }
    ],

    practice: [
      { lc: 206,
        hints: ['Don’t move any nodes. Only the `next` arrows change direction.', 'Keep `prev` (the reversed part so far) and `cur` (the node to flip). Before changing `cur.next`, save it in a variable.', 'Order per node: save next, point `cur.next` at `prev`, move `prev` and `cur` forward. Return `prev`.'],
        starter: { py: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function reverseList(head) {\n  \n}' },
        tests: { fn: 'reverseList', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: [5, 4, 3, 2, 1] }, { args: [[1, 2]], out: [2, 1] }, { args: [[]], out: null }, { args: [[9]], out: [9] }, { args: [[1, 1, 2]], out: [2, 1, 1] }] } },

      { lc: 876,
        hints: ['You can’t index into a linked list, and counting first costs a second pass. Think about two runners.', 'Move one pointer a step at a time and another two steps at a time.', 'When the fast pointer runs out (it is null, or its `next` is null), the slow pointer is at the middle. For an even length, the answer is the second middle node.'],
        solution: { explain: 'Fast and slow runners. Fast covers two nodes per step, so when it reaches the end, slow has covered half. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow`,
          js: `function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}` } },
        starter: { py: 'class Solution:\n    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function middleNode(head) {\n  \n}' },
        tests: { fn: 'middleNode', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: [3, 4, 5] }, { args: [[1, 2, 3, 4, 5, 6]], out: [4, 5, 6] }, { args: [[1]], out: [1] }, { args: [[1, 2]], out: [2] }] } },

      { lc: 83,
        hints: ['The list is sorted, so equal values sit next to each other.', 'Compare each node with the one after it. If they match, skip the next node by pointing past it.', 'After a skip, don’t advance: the node after the skipped one may match too. Advance only when the neighbor differs.'],
        solution: { explain: 'One pointer. Skip the next node while it equals the current one; advance otherwise. No dummy is needed because the head is never removed, only its duplicates. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:
        cur = head
        while cur and cur.next:
            if cur.next.val == cur.val:
                cur.next = cur.next.next
            else:
                cur = cur.next
        return head`,
          js: `function deleteDuplicates(head) {
  let cur = head;
  while (cur && cur.next) {
    if (cur.next.val === cur.val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
}` } },
        starter: { py: 'class Solution:\n    def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function deleteDuplicates(head) {\n  \n}' },
        tests: { fn: 'deleteDuplicates', argTypes: ['list'], cases: [
          { args: [[1, 1, 2]], out: [1, 2] }, { args: [[1, 1, 2, 3, 3]], out: [1, 2, 3] }, { args: [[2, 2, 2]], out: [2] }, { args: [[1, 2, 3]], out: [1, 2, 3] }, { args: [[]], out: null }] } },

      { lc: 203,
        hints: ['The head itself might need to go, and that makes it a special case.', 'Put a dummy node in front of the head so every node, the head included, has a node before it.', 'Keep `prev` on the node before the one you’re checking. When you delete, don’t move `prev`; otherwise move it.'],
        solution: { explain: 'A dummy head plus a `prev` pointer. Deleting is `prev.next = prev.next.next`; advance `prev` only when nothing was deleted. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def removeElements(self, head: Optional[ListNode], val: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next:
            if prev.next.val == val:
                prev.next = prev.next.next
            else:
                prev = prev.next
        return dummy.next`,
          js: `function removeElements(head, val) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next) {
    if (prev.next.val === val) prev.next = prev.next.next;
    else prev = prev.next;
  }
  return dummy.next;
}` } },
        starter: { py: 'class Solution:\n    def removeElements(self, head: Optional[ListNode], val: int) -> Optional[ListNode]:\n        ', js: 'function removeElements(head, val) {\n  \n}' },
        tests: { fn: 'removeElements', argTypes: ['list'], cases: [
          { args: [[1, 2, 6, 3, 4, 5, 6], 6], out: [1, 2, 3, 4, 5] }, { args: [[], 1], out: null }, { args: [[7, 7, 7, 7], 7], out: null }, { args: [[1, 2, 2, 1], 2], out: [1, 1] }, { args: [[3, 1, 2], 3], out: [1, 2] }] } },

      { lc: 21,
        hints: ['Both lists are already sorted, so the smallest remaining node is always one of the two fronts.', 'Use a dummy head and a `tail` pointer, and attach the smaller front node each time.', 'When one list runs out, point `tail.next` at the other list. It’s already sorted and needs no copying.'],
        starter: { py: 'class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function mergeTwoLists(list1, list2) {\n  \n}' },
        tests: { fn: 'mergeTwoLists', argTypes: ['list', 'list'], cases: [
          { args: [[1, 2, 4], [1, 3, 4]], out: [1, 1, 2, 3, 4, 4] }, { args: [[], []], out: null }, { args: [[], [0]], out: [0] }, { args: [[5], [1, 2, 3]], out: [1, 2, 3, 5] }, { args: [[1, 1], [1]], out: [1, 1, 1] }] } },

      { lc: 19,
        hints: ['A two-pass solution (count, then walk) is fine as a first answer. For one pass, think about two pointers a fixed distance apart.', 'Start both at a dummy head. Move `fast` n steps ahead, then move both until `fast.next` is null.', '`slow` is now the node before the target. Set `slow.next = slow.next.next` and return `dummy.next`.'],
        starter: { py: 'class Solution:\n    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:\n        ', js: 'function removeNthFromEnd(head, n) {\n  \n}' },
        tests: { fn: 'removeNthFromEnd', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5], 2], out: [1, 2, 3, 5] }, { args: [[1], 1], out: null }, { args: [[1, 2], 1], out: [1] }, { args: [[1, 2], 2], out: [2] }, { args: [[1, 2, 3], 3], out: [2, 3] }] } },

      { lc: 234,
        hints: ['Comparing front to back is hard in a singly linked list. Can you make the second half walkable backwards?', 'Find the middle with fast and slow pointers, then reverse the second half in place.', 'Walk the first half and the reversed second half together, comparing values. Stop when the reversed half ends.'],
        solution: { explain: 'Middle, then reverse the second half, then compare. It uses three tools from this page and O(1) space; copying values to an array is O(n) space. (It leaves the list half-reversed; say so, and restore it if the interviewer cares.) O(n) time.', code: {
          py: `class Solution:
    def isPalindrome(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        prev = None
        while slow:                     # reverse the second half
            nxt = slow.next
            slow.next = prev
            prev, slow = slow, nxt
        left, right = head, prev
        while right:
            if left.val != right.val:
                return False
            left, right = left.next, right.next
        return True`,
          js: `function isPalindrome(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null;
  while (slow) {                        // reverse the second half
    const nxt = slow.next;
    slow.next = prev;
    prev = slow; slow = nxt;
  }
  let left = head, right = prev;
  while (right) {
    if (left.val !== right.val) return false;
    left = left.next; right = right.next;
  }
  return true;
}` } },
        starter: { py: 'class Solution:\n    def isPalindrome(self, head: Optional[ListNode]) -> bool:\n        ', js: 'function isPalindrome(head) {\n  \n}' },
        tests: { fn: 'isPalindrome', argTypes: ['list'], cases: [
          { args: [[1, 2, 2, 1]], out: true }, { args: [[1, 2]], out: false }, { args: [[1]], out: true }, { args: [[1, 2, 3, 2, 1]], out: true }, { args: [[1, 0, 0]], out: false }] } },

      { lc: 24,
        hints: ['Swapping the first pair changes the head, so use a dummy head.', 'For each pair, keep `prev` on the node before it. Call the pair `a` and `b`. You need three arrows rewired: `prev → b`, `b → a`, `a → (the node after b)`.', 'Order matters: do `a.next = b.next` first, then `b.next = a`, then `prev.next = b`. Then set `prev = a` and repeat.'],
        solution: { explain: 'Dummy head and a `prev` pointer before each pair. The three rewires must happen in an order that never overwrites a pointer you still need. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next and prev.next.next:
            a = prev.next
            b = a.next
            a.next = b.next      # a now skips over b
            b.next = a           # b points back at a
            prev.next = b        # the pair is spliced in, swapped
            prev = a             # a is now the node before the next pair
        return dummy.next`,
          js: `function swapPairs(head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next && prev.next.next) {
    const a = prev.next, b = a.next;
    a.next = b.next;      // a now skips over b
    b.next = a;           // b points back at a
    prev.next = b;        // the pair is spliced in, swapped
    prev = a;             // a is now the node before the next pair
  }
  return dummy.next;
}` } },
        starter: { py: 'class Solution:\n    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function swapPairs(head) {\n  \n}' },
        tests: { fn: 'swapPairs', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4]], out: [2, 1, 4, 3] }, { args: [[1]], out: [1] }, { args: [[1, 2, 3]], out: [2, 1, 3] }, { args: [[1, 2]], out: [2, 1] }, { args: [[]], out: null }] } },

      { lc: 328,
        hints: ['You’re grouping by position, not by value: nodes 1, 3, 5, … first, then nodes 2, 4, 6, …', 'Build two chains in one pass with two pointers, `odd` and `even`, each skipping a node: `odd.next = even.next`, then `even.next = odd.next`.', 'Remember where the even chain starts before you begin, and attach it after the last odd node.'],
        solution: { explain: 'Two chains built in place, then joined. Save the even head first; it’s the only pointer to that chain once the odd chain starts skipping. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def oddEvenList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head:
            return head
        odd, even = head, head.next
        even_head = even                 # the only handle on the even chain
        while even and even.next:
            odd.next = even.next
            odd = odd.next
            even.next = odd.next
            even = even.next
        odd.next = even_head
        return head`,
          js: `function oddEvenList(head) {
  if (!head) return head;
  let odd = head, even = head.next;
  const evenHead = even;                 // the only handle on the even chain
  while (even && even.next) {
    odd.next = even.next;
    odd = odd.next;
    even.next = odd.next;
    even = even.next;
  }
  odd.next = evenHead;
  return head;
}` } },
        starter: { py: 'class Solution:\n    def oddEvenList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function oddEvenList(head) {\n  \n}' },
        tests: { fn: 'oddEvenList', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5]], out: [1, 3, 5, 2, 4] }, { args: [[2, 1, 3, 5, 6, 4, 7]], out: [2, 3, 6, 7, 1, 5, 4] }, { args: [[1]], out: [1] }, { args: [[1, 2]], out: [1, 2] }, { args: [[1, 2, 3, 4]], out: [1, 3, 2, 4] }] } },

      { lc: 2,
        hints: ['The digits are stored least significant first, which is the order you’d add them in anyway.', 'Walk both lists together, adding the two digits and the carry. Don’t stop while either list has nodes **or** a carry remains.', 'Use a dummy head, append a node for `sum % 10`, and carry `sum // 10`.'],
        solution: { explain: 'Column addition on two lists, with a dummy head for the result. The loop runs while either list or the carry is non-empty, so a final carry becomes a last node. O(max(n, m)) time and space for the result.', code: {
          py: `class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = tail = ListNode()
        carry = 0
        while l1 or l2 or carry:
            total = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
            carry, digit = divmod(total, 10)
            tail.next = ListNode(digit)
            tail = tail.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummy.next`,
          js: `function addTwoNumbers(l1, l2) {
  const dummy = new ListNode();
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const total = carry + (l1 ? l1.val : 0) + (l2 ? l2.val : 0);
    carry = Math.floor(total / 10);
    tail.next = new ListNode(total % 10);
    tail = tail.next;
    l1 = l1 ? l1.next : null;
    l2 = l2 ? l2.next : null;
  }
  return dummy.next;
}` } },
        starter: { py: 'class Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function addTwoNumbers(l1, l2) {\n  \n}' },
        tests: { fn: 'addTwoNumbers', argTypes: ['list', 'list'], cases: [
          { args: [[2, 4, 3], [5, 6, 4]], out: [7, 0, 8] }, { args: [[0], [0]], out: [0] }, { args: [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], out: [8, 9, 9, 9, 0, 0, 0, 1] }, { args: [[5], [5]], out: [0, 1] }, { args: [[1, 8], [0]], out: [1, 8] }] } },

      { lc: 92,
        hints: ['A dummy head helps when `left` is 1. Walk to the node just before position `left`.', 'Then repeat `right - left` times: take the node after `cur` and move it to the front of the sublist (right after `prev`).', 'Each move is four pointer lines in a safe order: `nxt = cur.next`, `cur.next = nxt.next`, `nxt.next = prev.next`, `prev.next = nxt`.'],
        solution: { explain: '“Head insertion”: `cur` stays on the sublist’s first node, which drifts to the end as the later nodes are pulled to the front, one at a time. One pass, O(n) time, O(1) space.', code: {
          py: `class Solution:
    def reverseBetween(self, head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        prev = dummy
        for _ in range(left - 1):        # stop on the node before position left
            prev = prev.next
        cur = prev.next
        for _ in range(right - left):
            nxt = cur.next               # the node to pull to the front
            cur.next = nxt.next          # cur skips over it
            nxt.next = prev.next         # it points at the current front
            prev.next = nxt              # and becomes the new front
        return dummy.next`,
          js: `function reverseBetween(head, left, right) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  for (let i = 0; i < left - 1; i++) prev = prev.next;   // stop on the node before position left
  const cur = prev.next;
  for (let i = 0; i < right - left; i++) {
    const nxt = cur.next;          // the node to pull to the front
    cur.next = nxt.next;           // cur skips over it
    nxt.next = prev.next;          // it points at the current front
    prev.next = nxt;               // and becomes the new front
  }
  return dummy.next;
}` } },
        starter: { py: 'class Solution:\n    def reverseBetween(self, head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:\n        ', js: 'function reverseBetween(head, left, right) {\n  \n}' },
        tests: { fn: 'reverseBetween', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5], 2, 4], out: [1, 4, 3, 2, 5] }, { args: [[5], 1, 1], out: [5] }, { args: [[1, 2], 1, 2], out: [2, 1] }, { args: [[1, 2, 3], 1, 2], out: [2, 1, 3] }, { args: [[1, 2, 3, 4, 5], 1, 5], out: [5, 4, 3, 2, 1] }, { args: [[3, 5], 1, 1], out: [3, 5] }] } },

      { lc: 143,
        hints: ['The result alternates front, back, front, back. You can’t walk backwards, so make the back half reversed.', 'Find the middle, cut the list there (`slow.next = None`), and reverse the second half.', 'Then interleave: take one node from the first half, one from the reversed half, and save each `next` before you rewire.'],
        solution: { explain: 'Three tools in a row: middle, reverse the second half, merge the halves alternately. Cutting the list at the middle is essential; without it the first half’s last node still points into the second half and you build a loop. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        if not head or not head.next:
            return
        slow, fast = head, head
        while fast.next and fast.next.next:
            slow = slow.next
            fast = fast.next.next
        second, slow.next = slow.next, None    # cut: the first half now ends here
        prev = None
        while second:                          # reverse the second half
            nxt = second.next
            second.next = prev
            prev, second = second, nxt
        first, second = head, prev
        while second:                          # interleave
            a, b = first.next, second.next
            first.next = second
            second.next = a
            first, second = a, b`,
          js: `function reorderList(head) {
  if (!head || !head.next) return;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next; fast = fast.next.next; }
  let second = slow.next;
  slow.next = null;                            // cut: the first half now ends here
  let prev = null;
  while (second) {                             // reverse the second half
    const nxt = second.next;
    second.next = prev;
    prev = second; second = nxt;
  }
  let first = head;
  second = prev;
  while (second) {                             // interleave
    const a = first.next, b = second.next;
    first.next = second;
    second.next = a;
    first = a; second = b;
  }
}` } },
        starter: { py: 'class Solution:\n    def reorderList(self, head: Optional[ListNode]) -> None:\n        """Do not return anything, modify head in-place instead."""\n        ', js: 'function reorderList(head) {\n  \n}' },
        tests: { fn: 'reorderList', argTypes: ['list'], inPlace: 0, cases: [
          { args: [[1, 2, 3, 4]], out: [1, 4, 2, 3] }, { args: [[1, 2, 3, 4, 5]], out: [1, 5, 2, 4, 3] }, { args: [[1]], out: [1] }, { args: [[1, 2]], out: [1, 2] }, { args: [[1, 2, 3]], out: [1, 3, 2] }] } },

      { lc: 148,
        hints: ['An array would use a sort call. On a list, merge sort is the natural fit: no random access needed.', 'Split at the middle (cut the list into two separate lists), sort each half recursively, and merge the sorted halves.', 'Use the fast/slow pointers with `fast = head.next` so `slow` lands on the **end of the first half**. Cut with `slow.next = None`. Merge with a dummy head.'],
        solution: { explain: 'Top-down merge sort: split with fast and slow, recurse, merge with a dummy head. O(n log n) time and O(log n) recursion stack. (A bottom-up version reaches O(1) space; mention it, don’t write it unless asked.)', code: {
          py: `class Solution:
    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        slow, fast = head, head.next       # fast starts one ahead: slow ends on the first half's last node
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        second, slow.next = slow.next, None
        a, b = self.sortList(head), self.sortList(second)
        dummy = tail = ListNode()
        while a and b:
            if b.val < a.val:
                tail.next, b = b, b.next
            else:
                tail.next, a = a, a.next
            tail = tail.next
        tail.next = a or b
        return dummy.next`,
          js: `function sortList(head) {
  if (!head || !head.next) return head;
  let slow = head, fast = head.next;      // fast starts one ahead: slow ends on the first half's last node
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  const second = slow.next;
  slow.next = null;
  let a = sortList(head), b = sortList(second);
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (b.val < a.val) { tail.next = b; b = b.next; }
    else { tail.next = a; a = a.next; }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
}` } },
        starter: { py: 'class Solution:\n    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ', js: 'function sortList(head) {\n  \n}' },
        tests: { fn: 'sortList', argTypes: ['list'], cases: [
          { args: [[4, 2, 1, 3]], out: [1, 2, 3, 4] }, { args: [[-1, 5, 3, 4, 0]], out: [-1, 0, 3, 4, 5] }, { args: [[]], out: null }, { args: [[2, 1]], out: [1, 2] }, { args: [[3, 3, 1, 1]], out: [1, 1, 3, 3] }, { args: [[1]], out: [1] }] } },

      { lc: 25,
        hints: ['It’s the reverse template applied to each block of k nodes. First check that k nodes remain; if fewer, leave them alone.', 'Keep `group_prev`, the node before the block. Find the block’s last node `kth` by walking k steps. Save `group_next = kth.next`.', 'Reverse the block with `prev` initialized to `group_next` (so the block’s old head ends up pointing at the rest), then link `group_prev.next = kth` and move `group_prev` to the block’s old head.'],
        solution: { explain: 'For each block: confirm k nodes exist, reverse the block with the template but starting `prev` at the node after the block, then reconnect the previous block. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        group_prev = dummy
        while True:
            kth = group_prev
            for _ in range(k):                 # is there a full block?
                kth = kth.next
                if not kth:
                    return dummy.next
            group_next = kth.next
            prev, cur = group_next, group_prev.next
            while cur is not group_next:       # the reverse template, one block
                nxt = cur.next
                cur.next = prev
                prev, cur = cur, nxt
            old_first = group_prev.next        # the block's old head is now its tail
            group_prev.next = kth
            group_prev = old_first`,
          js: `function reverseKGroup(head, k) {
  const dummy = new ListNode(0, head);
  let groupPrev = dummy;
  while (true) {
    let kth = groupPrev;
    for (let i = 0; i < k; i++) {              // is there a full block?
      kth = kth.next;
      if (!kth) return dummy.next;
    }
    const groupNext = kth.next;
    let prev = groupNext, cur = groupPrev.next;
    while (cur !== groupNext) {                // the reverse template, one block
      const nxt = cur.next;
      cur.next = prev;
      prev = cur; cur = nxt;
    }
    const oldFirst = groupPrev.next;           // the block's old head is now its tail
    groupPrev.next = kth;
    groupPrev = oldFirst;
  }
}` } },
        starter: { py: 'class Solution:\n    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:\n        ', js: 'function reverseKGroup(head, k) {\n  \n}' },
        tests: { fn: 'reverseKGroup', argTypes: ['list'], cases: [
          { args: [[1, 2, 3, 4, 5], 2], out: [2, 1, 4, 3, 5] }, { args: [[1, 2, 3, 4, 5], 3], out: [3, 2, 1, 4, 5] }, { args: [[1], 1], out: [1] }, { args: [[1, 2, 3, 4], 4], out: [4, 3, 2, 1] }, { args: [[1, 2, 3], 5], out: [1, 2, 3] }, { args: [[1, 2, 3, 4, 5, 6], 3], out: [3, 2, 1, 6, 5, 4] }] } },

      { lc: 287,
        hints: ['No array may be modified and only O(1) extra space is allowed, so sorting and a hash set are out. Values are in `1..n` and the array has `n + 1` slots.', 'Treat each index as a node whose `next` is `nums[index]`. A repeated value means two nodes share a successor, which makes a cycle.', 'Run the two-phase cycle detection starting from index 0 (it can’t be part of the cycle: no value is 0). The cycle’s entry node is the duplicate.'],
        solution: { explain: 'Floyd’s cycle detection on the implicit list `i → nums[i]`. Phase 1 finds a meeting point inside the cycle; phase 2 walks from the start and the meeting point in lockstep to the entry. O(n) time, O(1) space.', code: {
          py: `class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        slow = fast = 0
        while True:
            slow = nums[slow]
            fast = nums[nums[fast]]
            if slow == fast:
                break
        slow = 0
        while slow != fast:
            slow = nums[slow]
            fast = nums[fast]
        return slow`,
          js: `function findDuplicate(nums) {
  let slow = 0, fast = 0;
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  slow = 0;
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}` } },
        starter: { py: 'class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        ', js: 'function findDuplicate(nums) {\n  \n}' },
        tests: { fn: 'findDuplicate', cases: [
          { args: [[1, 3, 4, 2, 2]], out: 2 }, { args: [[3, 1, 3, 4, 2]], out: 3 }, { args: [[3, 3, 3, 3, 3]], out: 3 }, { args: [[1, 1]], out: 1 }, { args: [[2, 2, 2, 2, 2]], out: 2 }] } }
    ],

    mistakes: [
      '**Rewiring before saving.** `cur.next = prev` without first keeping `cur.next` throws away the rest of the list. Whenever a line overwrites a `next`, ask what that pointer was the only way to reach.',
      '**Forgetting the dummy head.** Deleting or inserting at the front, and building a list from nothing, all need a special case unless a dummy node sits in front. If you find yourself writing `if head is None` twice, add a dummy.',
      '**Dereferencing null.** `fast.next.next` crashes when `fast.next` is null. Test `fast` first, then `fast.next`, then step (`while fast and fast.next`). In removing the nth node, check the length assumption before you open the gap.',
      '**Leaving a stale tail pointer.** When you split a list (middle, reorder, sort), cut it with `slow.next = None`. If the first half’s last node still points into the second half, you’ve built a cycle and the next traversal never ends.',
      '**Advancing after a delete.** When you remove `prev.next`, the new `prev.next` may match too (`[7, 7, 7]`). Only move `prev` when nothing was removed.',
      '**Returning the wrong head.** After a reverse, the answer is `prev`, not `head` (`head` is now the tail). After dummy-based edits, it’s `dummy.next`. Returning the original `head` silently drops everything before it.',
      '**Comparing values when you mean nodes.** Cycle detection compares node **identity** (`is`, `===`, `==` on references). Two different nodes can hold the same value.',
      '**Language gotchas.** *Python:* in a swap like `cur, cur.next = cur.next, prev`, the targets are assigned left to right, so `cur` changes **before** `cur.next` is assigned and you write to the wrong node. Write `cur.next, cur = prev, cur.next` or use a temp variable. *JavaScript:* `while (node.val)` stops at a node holding `0`; loop on the node itself (`while (node)`), not on its value. *Java:* an unset `next` is `null`, so `node.next.next` throws `NullPointerException` (guard it); and don’t compare `Integer` objects with `==`. *C++:* if you free a removed node, save its `next` first, because reading it after the delete is undefined behavior; and a `ListNode dummy` on the stack is fine as long as you return `dummy.next`, never `&dummy`.'
    ],

    quiz: [
      { kind: 'complexity', q: 'What are the time and extra-space costs of reversing a singly linked list iteratively, in place?',
        choices: ['O(n) time, O(1) space', 'O(n) time, O(n) space', 'O(n²) time, O(1) space', 'O(n log n) time, O(1) space'], answer: 0,
        explain: 'One pass, O(1) work per node: O(n) time. Only `prev`, `cur` and `nxt` are held, so no extra space grows with n. (A recursive version is O(n) stack.)' },
      { kind: 'bug', q: 'This reversal returns a one-node list for `1→2→3`. What went wrong?',
        code: `def reverse(head):
    prev, cur = None, head
    while cur:
        cur.next = prev
        prev, cur = cur, cur.next
    return prev`,
        choices: ['`cur.next = prev` overwrote the only pointer to the rest of the list before it was saved, so `cur.next` read back as `prev`', '`prev` should start as `head`', 'The loop should be `while cur.next`', 'It should return `cur`'], answer: 0,
        explain: 'After `cur.next = prev`, `cur.next` *is* `prev`. The tuple assignment then sets `cur` to that (null on the first pass), so the loop ends after one node and nodes 2 and 3 are unreachable. Save `nxt = cur.next` first.' },
      { kind: 'concept', q: 'What does a dummy head buy you?',
        choices: ['The first node is no longer a special case, because every real node has a node before it', 'It makes the list doubly linked', 'It speeds up traversal', 'It lets you avoid saving `next` before rewiring'], answer: 0,
        explain: 'With a node in front of the head, “delete the first node” and “append to an empty result” are the same operations as for any other node. You return `dummy.next` at the end.' },
      { kind: 'bug', q: 'This finds the middle of a list. For which input does it crash?',
        code: `def middle(head):
    slow = fast = head
    while fast.next and fast:
        slow = slow.next
        fast = fast.next.next
    return slow`,
        choices: ['An even-length list, because `fast` becomes None and `fast.next` is evaluated first', 'A one-node list', 'An odd-length list', 'It never crashes'], answer: 0,
        explain: 'On an even-length list, `fast` ends as None, and the next check evaluates `None.next` before `and fast` can stop it. Always test `fast` before `fast.next`. (A one-node list is fine: `fast.next` is None, which is falsy.)' },
      { kind: 'concept', q: 'With `slow = fast = head` and the loop `while fast and fast.next`, which node does `slow` stop on for the list `1→2→3→4`?',
        choices: ['3', '2', '4', 'null'], answer: 0,
        explain: 'Step 1: slow = 2, fast = 3. Step 2: slow = 3, fast = null. Fast ran out, so slow is on the second of the two middle nodes. Start `fast` at `head.next` to get the first middle, 2.' },
      { kind: 'concept', q: 'In Floyd’s cycle-start algorithm, why does restarting one pointer at the head and moving both pointers one step at a time make them meet at the cycle’s entry?',
        choices: ['The distance from the head to the entry equals the distance from the meeting point onward to the entry, modulo the cycle length', 'Because both pointers have walked the same number of steps by then', 'Because the cycle has odd length', 'It only works if the head is on the cycle'], answer: 0,
        explain: 'If a is the head-to-entry distance and the pointers met b steps into the cycle, fast walked twice as far as slow, so a + b is a whole number of laps. Walking a more steps from the meeting point therefore lands back on the entry.' },
      { kind: 'pattern', q: 'Which of these problems is easiest with a dummy head? Pick every one that applies.',
        choices: ['Remove every node with a given value', 'Merge two sorted lists into one', 'Return the middle node', 'Reverse the whole list'], answer: [0, 1],
        explain: 'Removing by value can delete the head, and merging builds a result from nothing, so both have a special first step that a dummy removes. Finding the middle never changes the list, and reversing returns `prev` rather than editing the front.' },
      { kind: 'complexity', q: 'You detect a cycle with a hash set of visited nodes. What do the two runners (slow and fast) improve?',
        choices: ['Space: from O(n) to O(1)', 'Time: from O(n²) to O(n)', 'Nothing; they are the same cost', 'Both time and space: from O(n²) to O(1)'], answer: 0,
        explain: 'Both approaches are O(n) time. The set stores up to n nodes; the runners store two pointers.' },
      { kind: 'concept', q: 'You hold a pointer to a node X in a singly linked list. Which operation is O(1)?',
        choices: ['Inserting a new node right after X', 'Removing X itself', 'Finding the node before X', 'Reading the node 10 places after X, for any 10'], answer: 0,
        explain: 'Inserting after X rewires two pointers. Removing X needs the node *before* it (a walk from the head), and reading ahead takes one step per place.' }
    ],

    flashcards: [
      { id: 'save-first', front: 'Linked-list rewiring: what is the one rule that prevents losing nodes?', back: 'Before overwriting a `next`, save whatever it points to. In reversal: `nxt = cur.next`, then `cur.next = prev`, then advance.' },
      { id: 'reverse-three', front: 'Iterative reverse: the three lines in the loop, in order.', back: '`nxt = cur.next`, `cur.next = prev`, `prev, cur = cur, nxt`. Return `prev`.' },
      { id: 'dummy-why', front: 'Why use a dummy head?', back: 'It puts a node in front of the real head, so deleting or inserting at the front is no different from anywhere else. Return `dummy.next`.' },
      { id: 'dummy-when', front: 'Which list problems usually want a dummy head?', back: 'Ones that can delete the head (remove by value, remove nth from end), ones that build a result from nothing (merge, add two numbers), and ones that rewire pairs or blocks (swap pairs, reverse k-group).' },
      { id: 'middle-loop', front: 'Finding the middle: the loop and the odd/even rule.', back: '`while fast and fast.next: slow = slow.next; fast = fast.next.next`. Even length returns the second middle; start `fast = head.next` for the first.' },
      { id: 'loop-order', front: 'Why `while fast and fast.next`, never the other way around?', back: '`fast` can be null after an even-length run, and `null.next` crashes. Test `fast` first.' },
      { id: 'cycle-detect', front: 'How do two runners detect a cycle, and why do they meet?', back: 'Slow moves 1, fast moves 2. Inside a cycle the gap shrinks by 1 each step, so it hits 0. If fast reaches null, there is no cycle.' },
      { id: 'cycle-entry', front: 'Finding where the cycle starts: phase 2.', back: 'After the runners meet, put one pointer back at the head and move both one step at a time. They meet at the entry, because head-to-entry equals meeting-point-to-entry (mod the cycle length).' },
      { id: 'nth-end', front: 'Remove the nth node from the end in one pass.', back: 'Dummy head; advance `fast` n steps; move `slow` and `fast` together until `fast.next` is null. `slow` is the node before the target: `slow.next = slow.next.next`.' },
      { id: 'cut-list', front: 'When you split a list at the middle, what must you do before working on the halves?', back: 'Cut it: `slow.next = None`. Otherwise the first half’s tail still points into the second half, and you create a cycle.' },
      { id: 'merge-tail', front: 'Merging two sorted lists: what happens when one runs out?', back: 'Attach the other one whole: `tail.next = list1 or list2`. It’s already sorted and needs no copying.' },
      { id: 'recursion-stack', front: 'Why prefer the iterative reversal when asked for O(1) space?', back: 'The recursive version uses O(n) call stack, and in Python it hits the recursion limit (about 1,000) on long lists.' }
    ],

    deeper: [
      { title: 'Linked List: mycodeschool (YouTube playlist)', url: 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P', time: 'a few hours, pick videos', note: 'A patient, diagram-heavy series on singly and doubly linked lists: pointers, insertion, deletion and reversal drawn out step by step. Watch the reversal videos if the pointer order still feels slippery.' },
      { title: 'Detect a loop in a linked list (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/detect-loop-in-a-linked-list/', time: 'about 15 min', note: 'The fast and slow pointer idea with several approaches side by side. Compare the hash-set version with Floyd’s to see the space trade-off.' },
      { title: 'Linked List problems (LeetCode tag)', url: 'https://leetcode.com/tag/linked-list/', time: 'reference', note: 'Every linked-list problem on LeetCode, for extra reps once this page feels easy. Start with the Easy ones.' },
      { title: 'Reverse a Linked List: all methods (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/reverse-a-linked-list/', time: 'about 15 min', note: 'Iterative, recursive and stack-based reversal. Useful for seeing the recursive form you may be asked about as a follow-up.' }
    ],

    detective: [
      { id: 'rail-yard', decoys: ['stacks', 'recursion', 'arrays-hashing'],
        statement: 'A rail yard keeps a train as a chain of cars. Each car is coupled only to the car behind it, and the yard can’t lift cars off the track or add spare track. The inspector wants the **order of the whole train flipped end to end**, using only the couplings. How do you do it, one car at a time, without losing the rest of the train?',
        why: '“Each car knows only the one behind it” is a singly linked chain, and “flip the order using only the couplings” is in-place reversal. The giveaway is the no-spare-space constraint: you re-point each coupling backwards while holding the next car in a variable so the rest isn’t lost.' },
      { id: 'halfway-track', decoys: ['two-pointers', 'binary-search', 'queues'],
        statement: 'A radio station’s playlist is a chain of track entries, each pointing to the one that plays next. Nobody stored the number of tracks. The producer wants the entry at the **halfway point**, and the board will only let you walk the chain once, front to back.',
        why: 'There’s no index and no length, so you can’t jump to the middle. Two walkers moving at different speeds, one entry and two entries per step, put the slow one at the halfway point exactly when the fast one reaches the end.' },
      { id: 'looping-route', decoys: ['hashing-internals', 'two-pointers', 'recursion'],
        statement: 'A delivery route is a chain of stops, each saying which stop comes next. A data-entry error may have made one stop point back to an earlier stop, so the driver would circle forever. Report whether that happened and, if so, the **first stop of the loop**, without keeping a log of the stops you’ve visited.',
        why: '“Points back to an earlier stop” is a cycle in a linked structure, and “no log of visited stops” rules out a hash set. That points to runners at different speeds: if they meet, there’s a loop, and a second pass from the start finds where it begins.' },
      { id: 'two-ledgers', decoys: ['sorting', 'two-pointers', 'heaps'],
        statement: 'Two branch offices each keep their ledger entries as a chain, already in date order, with each entry pointing to the next. Head office wants **one chain in date order** built by re-pointing the existing entries. No entry may be copied or recreated, and no extra array is allowed.',
        why: 'Two sorted chains and a result built out of the same nodes is a merge. Compare the two front entries, attach the earlier one, and advance. A placeholder entry at the front means the first attach needs no special case.' },
      { id: 'ticket-line', decoys: ['two-pointers', 'sliding-window', 'arrays-hashing'],
        statement: 'A help desk issues tickets in a chain, each pointing to the next one to be served. A customer asks for the ticket that is the **3rd from the end** to be cancelled. The desk doesn’t know how many tickets there are and wants to walk the chain only once. The chain’s first ticket might itself be the one cancelled.',
        why: '“From the end” with an unknown length and one pass means two markers kept a fixed gap apart: when the front one reaches the end, the back one is right at the ticket before the target. “The first ticket might be cancelled” is the cue for a placeholder entry at the front.' }
    ]
  });
})();
