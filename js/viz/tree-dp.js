/* Offer Ready: DP on trees visualizer.
   Type a tree in level order (`3 2 3 null 3 null 1`). A post-order DFS fills in a pair for every node, built only from its children's pairs:
   house robber III gives (rob, skip); max path sum gives (best through the node, best going down from it). Frames are precomputed
   snapshots. Frame steps are the lesson template's #@marks: rnull/rleft/rright/take/skip/rret (robber), gnull/gleft/gright/through/down (path).
   Parsing is shared with the traversal visualizer. Styles: css/viz/tree-dp.css (.tdp-*). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var PRESETS = ['3 2 3 null 3 null 1', '3 4 5 1 3 null 1', '-10 9 20 null null 15 7', '2 -1 -2'];
  var MODES = { rob: 'House robber III', path: 'Max path sum' };
  var KEY = { rob: ['rob it', 'skip it'], path: ['through', 'down'] };
  var STEPS = {
    rob: { start: { label: 'Start' }, rleft: { label: 'Ask left', tone: 'accent' }, rright: { label: 'Ask right', tone: 'accent' }, rnull: { label: 'Empty: (0, 0)', tone: 'hard' },
      take: { label: 'Rob this node', tone: 'ok' }, skip: { label: 'Skip this node', tone: 'ok' }, rret: { label: 'Return the pair', tone: 'accent' }, done: { label: 'Done', tone: 'ok' } },
    path: { start: { label: 'Start' }, gleft: { label: 'Ask left', tone: 'accent' }, gright: { label: 'Ask right', tone: 'accent' }, gnull: { label: 'Empty: gain 0', tone: 'hard' },
      through: { label: 'Path through', tone: 'ok' }, down: { label: 'Path down', tone: 'ok' }, done: { label: 'Done', tone: 'ok' } }
  };

  function parse(text) { return OR.viz['tree-traversal'].parse(text); }
  function pairText(p) { return p ? (p[0] == null ? '?' : p[0]) + ' | ' + (p[1] == null ? '?' : p[1]) : ''; }

  function frames(tree, mode) {
    var root = tree.root, nodes = tree.nodes, F = [], stack = [], vals = nodes.map(function () { return [null, null]; }), best = null, bestNode = null, ans = '';
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, stack: stack.slice(), vals: vals.map(function (p) { return p.slice(); }), best: best, bestNode: bestNode, work: '' }, x));
    }
    if (!root) { snap('done', 'An empty tree: nothing to rob, no path to take.'); return F; }
    var P = mode === 'rob' ? { n: 'rnull', l: 'rleft', r: 'rright' } : { n: 'gnull', l: 'gleft', r: 'gright' };
    function pr(c) { return c ? vals[c.id] : mode === 'rob' ? [0, 0] : [0, 0]; }

    function kid(n, side) {
      var c = side ? n.r : n.l, nm = side ? 'right' : 'left';
      if (!c) {
        snap(P.n, n.v + ' has no ' + nm + ' child. The empty tree answers at once: ' + (mode === 'rob' ? '(0, 0), nothing to rob either way.' : 'a gain of 0.'), { cur: n.id, nil: { id: n.id, side: side } });
        return;
      }
      stack.push(c.id);
      snap(side ? P.r : P.l, 'Ask the ' + nm + ' child of ' + n.v + ' for its pair. ' + c.v + ' goes on the stack and must finish first (post-order).', { cur: c.id });
      go(c);
    }
    function go(n) {
      kid(n, 0); kid(n, 1);
      var l = pr(n.l), r = pr(n.r), a, b, w;
      if (mode === 'rob') {
        a = n.v + l[1] + r[1];
        vals[n.id][0] = a;
        snap('take', 'Rob ' + n.v + ': its children are now off limits, so add their skip values.', { cur: n.id, work: 'rob = ' + n.v + ' + ' + l[1] + ' + ' + r[1] + ' = ' + a });
        b = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);
        vals[n.id][1] = b;
        snap('skip', 'Skip ' + n.v + ': each child is free to do whatever is better for it.', { cur: n.id, work: 'skip = max(' + l[0] + ', ' + l[1] + ') + max(' + r[0] + ', ' + r[1] + ') = ' + b });
        snap('rret', 'Return (' + a + ', ' + b + ') to the parent. That is everything the parent needs to know about this subtree.', { cur: n.id, work: 'return (' + a + ', ' + b + ')' });
      } else {
        var gl = Math.max(0, l[1]), gr = Math.max(0, r[1]);
        a = n.v + gl + gr;
        vals[n.id][0] = a;
        if (best === null || a > best) { best = a; bestNode = n.id; }
        snap('through', 'A path may bend at ' + n.v + ': take it plus the better-than-nothing gain from each side. It cannot be extended upward. Best so far: ' + best + '.',
          { cur: n.id, work: 'through = ' + n.v + ' + ' + gl + ' + ' + gr + ' = ' + a + ' · best = ' + best });
        b = n.v + Math.max(gl, gr);
        vals[n.id][1] = b;
        snap('down', 'Only one branch can continue up to the parent, so return ' + n.v + ' plus the larger side.', { cur: n.id, work: 'down = ' + n.v + ' + max(' + gl + ', ' + gr + ') = ' + b });
      }
      stack.pop();
    }
    stack.push(root.id);
    snap('start', mode === 'rob'
      ? 'House robber III. No two directly linked houses can both be robbed. Each node returns (rob, skip): the best total for its subtree if it is robbed, and if it is not.'
      : 'Max path sum. Each node returns two numbers: the best path that bends through it (counts toward the answer, cannot go up) and the best path that goes down from it (what a parent may extend).', { cur: root.id });
    go(root);
    var v = vals[root.id];
    ans = mode === 'rob' ? 'max(' + v[0] + ', ' + v[1] + ') = ' + Math.max(v[0], v[1]) : 'best through any node = ' + best;
    snap('done', 'The root is done. Answer: ' + ans + '. Every node did constant work from two pairs: O(n) time, O(h) space.', { answer: mode === 'rob' ? Math.max(v[0], v[1]) : best });
    return F;
  }

  var ROW = 58, NODE = 34;
  function stageHTML(tree) {
    var nodes = tree.nodes, n = nodes.length, depth = 0, html;
    nodes.forEach(function (x) { depth = Math.max(depth, x.depth); });
    function px(x) { return (x.rank + 0.5) / n * 100; }
    html = '<div class="va tdp"><div class="tdp-tree" style="height:' + (depth * ROW + NODE + 24) + 'px"><svg class="tdp-edges" aria-hidden="true">';
    nodes.forEach(function (x) {
      [x.l, x.r].forEach(function (c) {
        if (c) html += '<line x1="' + px(x) + '%" y1="' + (x.depth * ROW + NODE / 2) + '" x2="' + px(c) + '%" y2="' + (c.depth * ROW + NODE / 2) + '"/>';
      });
    });
    html += '</svg>';
    nodes.forEach(function (x) {
      [0, 1].forEach(function (side) {
        html += '<span class="tdp-nil" data-nil="' + x.id + '-' + side + '" aria-hidden="true" style="left:' + (px(x) + (side ? 3 : -3)) + '%;top:' + (x.depth * ROW + NODE + 2) + 'px">∅</span>';
      });
      html += '<span class="tdp-n" data-n="' + x.id + '" style="left:' + px(x) + '%;top:' + (x.depth * ROW) + 'px">' + esc(x.v) + '</span>';
      html += '<span class="tdp-pair" data-p="' + x.id + '" style="left:' + px(x) + '%;top:' + (x.depth * ROW + NODE + 3) + 'px"></span>';
    });
    return html + '</div><p class="tdp-key"></p><dl class="va-read"><div><dt>Stack</dt><dd class="tdp-stack"></dd></div><div><dt>Working</dt><dd class="tdp-work"></dd></div></dl></div>';
  }

  function paint(tree, mode, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(tree);
    OR.$$('.tdp-n', stage).forEach(function (el) {
      var id = +el.dataset.n, done = f.vals[id][1] != null;
      el.className = 'tdp-n' + (done ? ' ok' : f.stack.indexOf(id) >= 0 ? ' in' : '') + (f.cur === id ? ' cur' : '') + (mode === 'path' && f.bestNode === id ? ' best' : '');
    });
    OR.$$('.tdp-pair', stage).forEach(function (el) {
      var id = +el.dataset.p, p = f.vals[id], t = p[0] == null ? '' : pairText(p);
      el.textContent = t; el.classList.toggle('on', !!t); el.classList.toggle('cur', f.cur === id && !!t);
    });
    OR.$$('.tdp-nil', stage).forEach(function (el) { el.classList.toggle('on', !!f.nil && el.dataset.nil === f.nil.id + '-' + f.nil.side); });
    OR.$('.tdp-key', stage).innerHTML = 'Under each node: <b>' + KEY[mode][0] + '</b> | <b>' + KEY[mode][1] + '</b>' + (mode === 'path' ? '. Best so far: <b>' + (f.best == null ? 'none' : esc(f.best)) + '</b>' : '');
    OR.$('.tdp-stack', stage).innerHTML = f.stack.length ? f.stack.map(function (id, k) {
      return '<span class="va-kv' + (k === f.stack.length - 1 ? ' cv-hit' : '') + '">' + esc(tree.nodes[id].v) + '</span>';
    }).join('') : '<span class="faint">empty</span>';
    OR.$('.tdp-work', stage).innerHTML = f.work ? '<span class="va-kv cv-take">' + esc(f.work) + '</span>' : '<span class="faint">waiting for the children</span>';
  }

  OR.viz['tree-dp'] = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'rob';
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="tdp-in">Your tree, level by level (up to 10 nodes, negatives allowed)</label>' +
        '<div class="va-input-row"><input class="input mono" id="tdp-in" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p.replace(/ /g, ', ') + '</button>'; }).join('') +
        '<span class="faint">Write <b>null</b> for a missing child.</span></p>' +
        '<div class="tdp-modes" role="group" aria-label="Problem">' + Object.keys(MODES).map(function (k) {
          return '<button class="chip" type="button" data-m="' + k + '" aria-pressed="' + (k === mode) + '">' + MODES[k] + '</button>';
        }).join('') + '</div></form><div class="va-player"></div>';
      var input = OR.$('#tdp-in', host), slot = OR.$('.va-player', host);

      function run(text) {
        var tree = parse(text);
        if (!tree.root) tree = parse(PRESETS[0]);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(tree, mode), steps: STEPS[mode], label: MODES[mode] + ' on a tree with values ' + tree.nodes.map(function (x) { return x.v; }).join(', '),
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
