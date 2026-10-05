/* Offer Ready: recursion-tree visualizer (fib(n), plain vs memoized).
   Frames are precomputed snapshots (node states, call stack, cache), so stepping back just paints an earlier frame.
   Frame steps match the template's #@call/#@hit/#@base/#@split/#@ret marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 7, PRESETS = [5, 6, 7, 3];
  var STEPS = {
    start: { label: 'Start' }, call: { label: 'Call' }, split: { label: 'Recurse' }, base: { label: 'Base case', tone: 'hard' },
    hit: { label: 'Cache hit', tone: 'ok' }, ret: { label: 'Return', tone: 'accent' }, done: { label: 'Done' }
  };
  var PX = 40, PY = 58, PAD = 22;

  // Run fib(n) for real, recording a snapshot after each step of the template.
  function build(n, memo) {
    var nodes = [], frames = [], stack = [], cache = {}, order = [], calls = 0, hits = 0;
    function snap(step, note, cur, extra) {
      frames.push(Object.assign({ step: step, note: note, cur: cur, stack: stack.slice(), calls: calls, hits: hits,
        st: nodes.map(function (x) { return x.st; }), val: nodes.map(function (x) { return x.val; }),
        cache: order.map(function (k) { return [k, cache[k]]; }) }, extra));
    }
    function go(k, parent) {
      var nd = { id: nodes.length, k: k, kids: [], st: 'active', val: null, parent: parent };
      nodes.push(nd); if (parent) parent.kids.push(nd);
      calls++; stack.push(nd.id);
      snap('call', 'fib(' + k + ') is called, so a new frame goes on the stack. Depth ' + stack.length + '.', nd.id);
      if (memo && k in cache) {
        hits++; nd.st = 'hit'; nd.val = cache[k];
        snap('hit', 'fib(' + k + ') is already in the cache: return ' + nd.val + ' at once. This whole subtree never runs.', nd.id);
        stack.pop(); return nd.val;
      }
      if (k < 2) {
        nd.st = 'base'; nd.val = k;
        snap('base', 'Base case: fib(' + k + ') = ' + k + '. No further calls, so the frame is popped.', nd.id);
        stack.pop(); return k;
      }
      snap('split', 'fib(' + k + ') = fib(' + (k - 1) + ') + fib(' + (k - 2) + '). Trust each smaller call to return its answer.', nd.id);
      var v = go(k - 1, nd) + go(k - 2, nd);
      nd.st = 'done'; nd.val = v;
      if (memo) { cache[k] = v; order.push(k); }
      snap('ret', 'Both children returned: fib(' + k + ') = ' + v + (memo ? ', stored in the cache' : '') + '. Pop the frame.', nd.id);
      stack.pop(); return v;
    }
    snap('start', 'fib(' + n + ') ' + (memo ? 'with a cache' : 'with no cache') + '. Each call adds a frame to the stack and a node to the tree.', -1);
    var result = go(n, null);
    snap('done', 'fib(' + n + ') = ' + result + ' took ' + calls + ' call' + (calls === 1 ? '' : 's') + (memo ? ' and ' + hits + ' cache hit' + (hits === 1 ? '' : 's') : '') +
      '. The deepest the stack got was the longest path in the tree.', -1, { final: true });
    var root = nodes[0], leaf = 0, depth = 0;
    (function pos(nd, d) {
      nd.y = d; depth = Math.max(depth, d);
      if (!nd.kids.length) nd.x = leaf++;
      else { nd.kids.forEach(function (c) { pos(c, d + 1); }); nd.x = (nd.kids[0].x + nd.kids[nd.kids.length - 1].x) / 2; }
    })(root, 0);
    return { frames: frames, nodes: nodes, calls: calls, result: result, leaves: leaf, depth: depth };
  }

  function stageHTML(R, n, memo) {
    var w = Math.max(R.leaves, 1) * PX + PAD * 2, h = (R.depth + 1) * PY + PAD;
    function X(nd) { return PAD + nd.x * PX + PX / 2; }
    function Y(nd) { return PAD / 2 + nd.y * PY + 18; }
    var edges = R.nodes.map(function (nd) {
      return nd.parent ? '<line class="rt-edge" x1="' + X(nd.parent) + '" y1="' + (Y(nd.parent) + 17) + '" x2="' + X(nd) + '" y2="' + (Y(nd) - 17) + '"/>' : '';
    }).join('');
    var circles = R.nodes.map(function (nd) {
      return '<g class="rt-node" transform="translate(' + X(nd) + ',' + Y(nd) + ')"><circle r="17"/><text class="rt-k" y="1">' + nd.k + '</text><text class="rt-v" y="32"></text></g>';
    }).join('');
    return '<div class="rt"><div class="rt-tree" role="img" aria-label="Call tree of fib(' + n + ')' + (memo ? ' with a cache' : '') + '. Each step is described below the picture."><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      edges + circles + '</svg></div>' +
      '<div class="rt-side"><div class="rt-stack-wrap"><span class="rt-cap">Call stack</span><ol class="rt-stack" style="--rows:' + (R.depth + 1) + '" aria-label="Call stack, top frame first"></ol></div>' +
      '<dl class="va-read"><div><dt>calls</dt><dd class="rt-calls"></dd></div>' + (memo ? '<div><dt>hits</dt><dd class="rt-hits"></dd></div>' : '') +
      '<div><dt>depth</dt><dd class="rt-depth"></dd></div></dl>' +
      (memo ? '<dl class="va-read"><div><dt>cache</dt><dd class="rt-cache"></dd></div></dl>' : '') + '</div></div>';
  }

  function paint(R, memo, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(R, R.nodes[0].k, memo);
    var nodes = OR.$$('.rt-node', stage), edges = OR.$$('.rt-edge', stage);
    R.nodes.forEach(function (nd, i) {
      var st = f.st[i], el = nodes[i];
      el.setAttribute('class', 'rt-node' + (st ? ' ' + st : ' new') + (i === f.cur ? ' cur' : ''));
      OR.$('.rt-v', el).textContent = f.val[i] == null ? '' : '= ' + f.val[i];
      if (nd.parent) edges[i - 1].setAttribute('class', 'rt-edge' + (st ? '' : ' new'));
    });
    OR.$('.rt-stack', stage).innerHTML = f.stack.slice().reverse().map(function (id, j) {
      return '<li class="rt-frame' + (j === 0 ? ' top' : '') + '">fib(' + R.nodes[id].k + ')</li>';
    }).join('');
    OR.$('.rt-calls', stage).innerHTML = '<b class="num">' + f.calls + '</b>';
    OR.$('.rt-depth', stage).innerHTML = '<b class="num">' + f.stack.length + '</b>';
    if (memo) {
      OR.$('.rt-hits', stage).innerHTML = '<b class="num">' + f.hits + '</b>';
      OR.$('.rt-cache', stage).innerHTML = f.cache.length ? f.cache.map(function (e) {
        return '<span class="va-kv' + (f.step === 'hit' && e[0] === R.nodes[f.cur].k ? ' cv-hit' : '') + '">' + e[0] + ' <b>' + e[1] + '</b></span>';
      }).join('') : '<span class="faint">{}</span>';
    }
  }

  function clampN(v) { v = parseInt(v, 10); return isNaN(v) ? 5 : Math.max(0, Math.min(MAX, v)); }

  OR.viz['recursion-tree'] = {
    build: build, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, memo = false;
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="rt-in">Your n (0 to ' + MAX + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="rt-in" type="number" inputmode="numeric" min="0" max="' + MAX + '" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Cache</span> <button class="chip" type="button" data-m="0" aria-pressed="true">Off</button><button class="chip" type="button" data-m="1" aria-pressed="false">On</button>' +
        '<span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-n="' + p + '">n = ' + p + '</button>'; }).join('') +
        '<span class="faint">Turn the cache on and compare the call counts.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#rt-in', host), slot = OR.$('.va-player', host);

      function run() {
        var n = clampN(input.value); input.value = n;
        if (player) player.destroy();
        slot.innerHTML = '';
        var R = build(n, memo), other = build(n, !memo).calls;
        R.frames[R.frames.length - 1].note += ' ' + (memo ? 'Without the cache it would take ' : 'With a cache it would take only ') + other + ' calls.';
        player = OR.player(slot, {
          frames: R.frames, steps: STEPS, label: 'Recursion tree of fib(' + n + ')' + (memo ? ' with a cache' : ''),
          paint: function (stage, f) { paint(R, memo, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-n],[data-m]'); if (!b) return;
        if (b.dataset.n) input.value = b.dataset.n;
        else { memo = b.dataset.m === '1'; OR.$$('[data-m]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
        run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
