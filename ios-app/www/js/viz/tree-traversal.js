/* Offer Ready: tree traversal visualizer.
   Type a tree in level order (`1 2 3 null 4`) and watch preorder, inorder, postorder (the recursion's call stack) or
   level order (the BFS queue). Frames are precomputed snapshots, so stepping back paints an earlier one. Frame steps match the
   lesson template's #@null/#@left/#@right/#@pre/#@in/#@post (DFS) and #@level/#@deq/#@visit/#@enq (BFS) marks.
   Styles: css/viz/tree-traversal.css (.tt-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_NODES = 10, MAX_TOKENS = 31;
  var PRESETS = ['1 2 3 null 4', '4 2 6 1 3 5 7', '1 null 2 null 3', '3 9 20 null null 15 7'];
  var MODES = { pre: 'Preorder', 'in': 'Inorder', post: 'Postorder', level: 'Level order' };
  var ALL = {
    start: { label: 'Start' }, left: { label: 'Go left', tone: 'accent' }, right: { label: 'Go right', tone: 'accent' }, 'null': { label: 'Empty, return', tone: 'hard' },
    pre: { label: 'Record (pre)', tone: 'ok' }, 'in': { label: 'Record (in)', tone: 'ok' }, post: { label: 'Record (post)', tone: 'ok' },
    level: { label: 'Level begins' }, deq: { label: 'Dequeue' }, visit: { label: 'Record', tone: 'ok' }, enq: { label: 'Enqueue', tone: 'accent' }, done: { label: 'Done', tone: 'ok' }
  };
  function stepsFor(mode) {
    var keys = mode === 'level' ? ['start', 'level', 'deq', 'visit', 'enq', 'done'] : ['start', 'left', 'right', 'null', mode, 'done'], o = {};
    keys.forEach(function (k) { o[k] = ALL[k]; });
    return o;
  }

  /* "1 2 3 null 4" (level order, null for a gap) -> { root, nodes }; each node: id, v, l, r, depth, rank (inorder position) */
  function parse(text) {
    var tok = String(text).split(/[\s,\[\]]+/).filter(Boolean).slice(0, MAX_TOKENS), nodes = [], root, q = [], i = 1, a;
    a = tok.map(function (t) { var x = Number(t); return /^(null|none|n|#)$/i.test(t) || !isFinite(x) || x !== Math.floor(x) ? null : Math.max(-99, Math.min(99, x)); });
    function make(v) { var n = { id: nodes.length, v: v, l: null, r: null, depth: 0, rank: 0 }; nodes.push(n); return n; }
    if (!a.length || a[0] === null) return { root: null, nodes: nodes };
    root = make(a[0]); q.push(root);
    while (q.length && i < a.length) {
      var n = q.shift();
      if (a[i] !== null && nodes.length < MAX_NODES) { n.l = make(a[i]); q.push(n.l); } i++;
      if (i < a.length && a[i] !== null && nodes.length < MAX_NODES) { n.r = make(a[i]); q.push(n.r); } i++;
    }
    var rank = 0;
    (function walk(n, d) { if (!n) return; walk(n.l, d + 1); n.depth = d; n.rank = rank++; walk(n.r, d + 1); })(root, 0);
    return { root: root, nodes: nodes };
  }

  function frames(tree, mode) {
    var root = tree.root, F = [], rows = [[]], seen = [], stack = [], queue = [];
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, stack: stack.slice(), queue: queue.slice(), seen: seen.slice(), rows: rows.map(function (r) { return r.slice(); }) }, x));
    }
    if (!root) { snap('done', 'An empty tree: there is nothing to visit, so every traversal returns an empty list.'); return F; }

    if (mode === 'level') {
      var lvl = 0;
      queue.push(root.id);
      snap('start', 'Breadth-first search. The queue starts with just the root. Nodes leave from the front and their children join the back, so the tree comes out one level at a time.', { cur: root.id });
      while (queue.length) {
        var k = queue.length;
        if (lvl > 0) rows.push([]);
        snap('level', 'Level ' + lvl + ': the queue holds ' + k + ' node' + (k > 1 ? 's' : '') + '. Process exactly ' + k + ' before starting the next level, so the levels never mix.', {});
        for (var s = 0; s < k; s++) {
          var n = tree.nodes[queue.shift()];
          snap('deq', 'Take ' + n.v + ' off the front of the queue.', { cur: n.id });
          rows[rows.length - 1].push(n.v); seen.push(n.id);
          snap('visit', 'Record ' + n.v + ' in this level’s list.', { cur: n.id });
          [n.l, n.r].forEach(function (c, side) {
            if (!c) return;
            queue.push(c.id);
            snap('enq', 'Its ' + (side ? 'right' : 'left') + ' child ' + c.v + ' joins the back of the queue: it belongs to the next level.', { cur: n.id });
          });
        }
        lvl++;
      }
      snap('done', 'The queue is empty. Levels: ' + rows.map(function (r) { return '[' + r.join(', ') + ']'; }).join(' ') + '. Each node entered and left the queue once: O(n) time. The queue held at most one level, so O(w) space for width w.', {});
      return F;
    }

    var why = {
      pre: 'Preorder records a node the moment the call reaches it, before either child.',
      'in': 'Inorder records a node between its two children: left subtree done, this node, then the right. On a search tree that is sorted order.',
      post: 'Postorder records a node last, after both children are finished, so children always come before their parent.'
    };
    function go(n) { // n is already on the stack
      if (mode === 'pre') rec(n);
      kid(n, 0);
      if (mode === 'in') rec(n);
      kid(n, 1);
      if (mode === 'post') rec(n);
      stack.pop();
    }
    function rec(n) { rows[0].push(n.v); seen.push(n.id); snap(mode, why[mode] + ' Record ' + n.v + '.', { cur: n.id }); }
    function kid(n, side) {
      var c = side ? n.r : n.l, nm = side ? 'right' : 'left';
      if (!c) { snap('null', n.v + ' has no ' + nm + ' child. That call gets an empty spot, returns at once, and we carry on in ' + n.v + '.', { cur: n.id, nil: { id: n.id, side: side } }); return; }
      stack.push(c.id);
      snap(nm, 'Call the function on the ' + nm + ' child of ' + n.v + ': ' + c.v + ' goes on the stack.', { cur: c.id });
      go(c);
    }
    stack.push(root.id);
    snap('start', 'Depth-first search, ' + MODES[mode].toLowerCase() + '. The call stack holds the nodes whose calls are still open. All three depth-first orders are this same walk: they differ only in where the record line sits.', { cur: root.id });
    go(root);
    snap('done', 'The stack is empty again. ' + MODES[mode] + ': ' + rows[0].join(', ') + '. Every node was visited once: O(n) time. The stack never grew deeper than the tree is tall: O(h) space.', {});
    return F;
  }

  var ROW = 46, NODE = 34;
  function stageHTML(tree) {
    var nodes = tree.nodes, n = nodes.length, depth = 0, html;
    nodes.forEach(function (x) { depth = Math.max(depth, x.depth); });
    function px(x) { return (x.rank + 0.5) / n * 100; }
    html = '<div class="va tt"><div class="tt-tree" style="height:' + (depth * ROW + NODE + 22) + 'px"><svg class="tt-edges" aria-hidden="true">';
    nodes.forEach(function (x) {
      [x.l, x.r].forEach(function (c) {
        if (c) html += '<line x1="' + px(x) + '%" y1="' + (x.depth * ROW + NODE / 2) + '" x2="' + px(c) + '%" y2="' + (c.depth * ROW + NODE / 2) + '"/>';
      });
    });
    html += '</svg>';
    nodes.forEach(function (x) {
      [0, 1].forEach(function (side) {
        html += '<span class="tt-nil" data-nil="' + x.id + '-' + side + '" aria-hidden="true" style="left:' + (px(x) + (side ? 3.4 : -3.4)) + '%;top:' + (x.depth * ROW + NODE + 2) + 'px">∅</span>';
      });
    });
    nodes.forEach(function (x) { html += '<span class="tt-n" data-n="' + x.id + '" style="left:' + px(x) + '%;top:' + (x.depth * ROW) + 'px">' + esc(x.v) + '</span>'; });
    return html + '</div><dl class="va-read"><div><dt class="tt-lbl"></dt><dd class="tt-hold"></dd></div><div><dt>Out</dt><dd class="tt-out"></dd></div></dl></div>';
  }

  function paint(tree, mode, stage, f) {
    var held = mode === 'level' ? f.queue : f.stack;
    if (!stage.firstChild) stage.innerHTML = stageHTML(tree);
    OR.$$('.tt-n', stage).forEach(function (el) {
      var id = +el.dataset.n;
      el.className = 'tt-n' + (f.seen.indexOf(id) >= 0 ? ' ok' : held.indexOf(id) >= 0 ? ' in' : '') + (f.cur === id ? ' cur' : '');
    });
    OR.$$('.tt-nil', stage).forEach(function (el) { el.classList.toggle('on', !!f.nil && el.dataset.nil === f.nil.id + '-' + f.nil.side); });
    OR.$('.tt-lbl', stage).textContent = mode === 'level' ? 'Queue (front first)' : 'Call stack (top last)';
    OR.$('.tt-hold', stage).innerHTML = held.length ? held.map(function (id, k) {
      return '<span class="va-kv' + (mode !== 'level' && k === held.length - 1 ? ' cv-hit' : '') + '">' + esc(tree.nodes[id].v) + '</span>';
    }).join('') : '<span class="faint">empty</span>';
    var rows = f.rows.filter(function (r) { return r.length; });
    OR.$('.tt-out', stage).innerHTML = rows.length ? rows.map(function (r, k) {
      var last = k === rows.length - 1 && (f.step === mode || f.step === 'visit');
      return '<span class="va-kv' + (last ? ' cv-take' : '') + '">' + r.map(esc).join(', ') + '</span>';
    }).join('') : '<span class="faint">nothing yet</span>';
  }

  OR.viz['tree-traversal'] = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'pre';
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="tt-in">Your tree, level by level (up to ' + MAX_NODES + ' nodes)</label>' +
        '<div class="va-input-row"><input class="input mono" id="tt-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p.replace(/ /g, ', ') + '</button>'; }).join('') +
        '<span class="faint">Write <b>null</b> for a missing child, as in 1 2 3 null 4.</span></p>' +
        '<div class="tt-modes" role="group" aria-label="Traversal">' + Object.keys(MODES).map(function (k) {
          return '<button class="chip" type="button" data-m="' + k + '" aria-pressed="' + (k === mode) + '">' + MODES[k] + '</button>';
        }).join('') + '</div></form><div class="va-player"></div>';
      var input = OR.$('#tt-in', host), slot = OR.$('.va-player', host);

      function run(text) {
        var tree = parse(text);
        if (!tree.root) tree = parse(PRESETS[0]);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(tree, mode), steps: stepsFor(mode), label: MODES[mode] + ' on a tree with values ' + tree.nodes.map(function (x) { return x.v; }).join(', '),
          paint: function (stage, f) { paint(tree, mode, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]'), m = e.target.closest('[data-m]');
        if (b) { input.value = b.dataset.s; run(b.dataset.s); }
        if (m) {
          mode = m.dataset.m;
          OR.$$('[data-m]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === m)); });
          run(input.value);
        }
      });
      run(PRESETS[0]);
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
