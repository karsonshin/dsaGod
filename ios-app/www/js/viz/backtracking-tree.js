/* Offer Ready: backtracking-tree visualizer (choose / explore / unchoose on subsets or permutations).
   Frames are precomputed snapshots (tree node states, path, recorded answers), so stepping back just paints an earlier frame.
   Frame steps match the template's #@record/#@prune/#@choose/#@explore/#@unchoose marks, which light up in sync. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXN = { subsets: 5, perms: 4 }, PRESETS = ['abc', '122', 'abcd'];
  var STEPS = {
    start: { label: 'Start' }, record: { label: 'Record', tone: 'ok' }, prune: { label: 'Prune', tone: 'hard' },
    choose: { label: 'Choose', tone: 'accent' }, explore: { label: 'Explore' }, unchoose: { label: 'Unchoose' }, done: { label: 'Done' }
  };
  var PX = 38, PY = 56, PAD = 22;

  function parse(text) { return text.replace(/[\s,]+/g, '').split(''); }

  // Run the search for real, recording a snapshot after each step of the template.
  function build(items, mode, dedupe) {
    items = items.slice().sort();
    var n = items.length, perms = mode === 'perms';
    var nodes = [], frames = [], idx = [], stk = [], used = [], res = [], calls = 1, pruned = 0, i0;
    for (i0 = 0; i0 < n; i0++) used.push(false);
    function fmt() { var s = idx.map(function (i) { return items[i]; }).join(', '); return perms ? '[' + s + ']' : '{' + s + '}'; }
    function snap(step, note, cur, cand) {
      frames.push({ step: step, note: note, cur: cur, cand: cand == null ? -1 : cand, stack: stk.slice(), idx: idx.slice(), res: res.slice(),
        calls: calls, pruned: pruned, st: nodes.map(function (x) { return x.st; }) });
    }
    function mk(label, parent, st) {
      var nd = { id: nodes.length, label: label, kids: [], st: st, parent: parent };
      nodes.push(nd); if (parent) parent.kids.push(nd); return nd;
    }
    function dupSkip(i, lo) { return dedupe && i > lo && items[i] === items[i - 1] && (!perms || !used[i - 1]); }
    function dfs(nd, start) {
      var i, ch;
      if (perms ? idx.length === n : true) {
        res.push(fmt()); nd.st = 'rec';
        snap('record', perms ? 'The path uses every item, so ' + fmt() + ' is a complete permutation. Record a copy.'
          : fmt() + ' is a valid subset: every node of the tree is one. Record a copy of the path.', nd.id);
        if (perms) return;
      }
      for (i = perms ? 0 : start; i < n; i++) {
        if (perms && used[i]) continue;
        if (dupSkip(i, perms ? 0 : start)) {
          ch = mk(items[i], nd, 'prune'); pruned++;
          snap('prune', 'Item ' + (i + 1) + ' (' + items[i] + ') equals the one just tried at this same depth. Choosing it would repeat a whole branch, so skip it.', ch.id, i);
          continue;
        }
        ch = mk(items[i], nd, 'active'); idx.push(i); stk.push(ch.id); used[i] = true; calls++;
        snap('choose', 'Choose ' + items[i] + ': append it to the path, which is now ' + fmt() + '.', ch.id, i);
        snap('explore', 'Explore: recurse with the new path. Everything below this node extends ' + fmt() + '.', ch.id, i);
        dfs(ch, i + 1);
        idx.pop(); stk.pop(); used[i] = false; if (ch.st === 'active') ch.st = 'done';
        snap('unchoose', 'Unchoose ' + items[i] + ': pop it off, so the path is back to ' + fmt() + ' and the next candidate starts clean.', nd.id, -1);
      }
    }
    var root = mk('', null, 'active'); stk.push(0);
    snap('start', (perms ? 'All orderings of ' : 'All subsets of ') + '[' + items.join(', ') + ']' + (dedupe ? ', skipping repeats at the same depth' : '') + '. Each node is a path; each edge is one choice.', 0);
    dfs(root, 0);
    root.st = perms ? 'done' : 'rec';
    stk.pop();
    snap('done', 'Search finished: ' + res.length + ' answer' + (res.length === 1 ? '' : 's') + ', ' + calls + ' call' + (calls === 1 ? '' : 's') + (pruned ? ', ' + pruned + ' pruned' : '') +
      '. The path is empty again: backtracking undid every choice.', -1);
    var leaf = 0, depth = 0;
    (function pos(nd, d) {
      nd.y = d; depth = Math.max(depth, d);
      if (!nd.kids.length) nd.x = leaf++;
      else { nd.kids.forEach(function (c) { pos(c, d + 1); }); nd.x = (nd.kids[0].x + nd.kids[nd.kids.length - 1].x) / 2; }
    })(root, 0);
    return { frames: frames, nodes: nodes, items: items, mode: mode, results: res, calls: calls, pruned: pruned, leaves: leaf, depth: depth };
  }

  function stageHTML(R) {
    var w = Math.max(R.leaves, 1) * PX + PAD * 2, h = (R.depth + 1) * PY + PAD - 10;
    function X(nd) { return PAD + nd.x * PX + PX / 2; }
    function Y(nd) { return PAD / 2 + nd.y * PY + 16; }
    var edges = R.nodes.map(function (nd) {
      return nd.parent ? '<line class="bt-edge" x1="' + X(nd.parent) + '" y1="' + (Y(nd.parent) + 15) + '" x2="' + X(nd) + '" y2="' + (Y(nd) - 15) + '"/>' : '';
    }).join('');
    var circles = R.nodes.map(function (nd) {
      return '<g class="bt-node" transform="translate(' + X(nd) + ',' + Y(nd) + ')"><circle r="15"/><text class="bt-k" y="1">' + esc(nd.label || '·') + '</text></g>';
    }).join('');
    return '<div class="bt"><div class="bt-tree" role="img" aria-label="Choice tree for ' + (R.mode === 'perms' ? 'permutations' : 'subsets') + ' of ' + esc(R.items.join(' ')) + '. Each step is described below the picture."><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      edges + circles + '</svg></div>' +
      '<div class="bt-side"><div class="bt-block"><span class="bt-cap">Items</span><div class="va-row bt-items"></div></div>' +
      '<div class="bt-block"><span class="bt-cap">Path</span><div class="bt-path"></div></div>' +
      '<dl class="va-read"><div><dt>calls</dt><dd class="bt-calls"></dd></div><div><dt>pruned</dt><dd class="bt-pruned"></dd></div><div><dt>depth</dt><dd class="bt-depth"></dd></div></dl>' +
      '<div class="bt-block"><span class="bt-cap">Recorded</span><div class="bt-res"></div></div></div></div>';
  }

  function paint(R, stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(R);
    var nodes = OR.$$('.bt-node', stage), edges = OR.$$('.bt-edge', stage), perms = R.mode === 'perms';
    R.nodes.forEach(function (nd, i) {
      var st = f.st[i], el = nodes[i];
      el.setAttribute('class', 'bt-node' + (st ? ' ' + st : ' new') + (f.stack.indexOf(i) >= 0 ? ' path' : '') + (i === f.cur ? ' cur' : ''));
      if (nd.parent) edges[i - 1].setAttribute('class', 'bt-edge' + (st ? '' : ' new') + (st === 'prune' ? ' prune' : ''));
    });
    OR.$('.bt-items', stage).innerHTML = R.items.map(function (c, i) {
      var cls = f.idx.indexOf(i) >= 0 ? ' in' : '';
      if (i === f.cand) cls = f.step === 'prune' ? ' dup cur' : ' in cur';
      return '<div class="va-cell' + cls + '"><b>' + esc(c) + '</b><small>' + i + '</small></div>';
    }).join('');
    OR.$('.bt-path', stage).innerHTML = f.idx.length ? f.idx.map(function (i) { return '<span class="va-kv cv-take">' + esc(R.items[i]) + '</span>'; }).join('') : '<span class="faint">empty</span>';
    OR.$('.bt-calls', stage).innerHTML = '<b class="num">' + f.calls + '</b>';
    OR.$('.bt-pruned', stage).innerHTML = '<b class="num">' + f.pruned + '</b>';
    OR.$('.bt-depth', stage).innerHTML = '<b class="num">' + f.idx.length + '</b>';
    OR.$('.bt-res', stage).innerHTML = f.res.length ? f.res.map(function (s, j) {
      return '<span class="va-kv' + (j === f.res.length - 1 && f.step === 'record' ? ' cv-take' : '') + '">' + esc(s) + '</span>';
    }).join('') : '<span class="faint">nothing yet</span>';
    void perms;
  }

  OR.viz['backtracking-tree'] = {
    build: build, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {}, mode = 'subsets', dedupe = false;
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="bt-in">Your items (subsets: up to ' + MAXN.subsets + ', permutations: up to ' + MAXN.perms + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="bt-in" type="text" maxlength="12" autocomplete="off" spellcheck="false" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Build</span> <button class="chip" type="button" data-m="subsets" aria-pressed="true">Subsets</button><button class="chip" type="button" data-m="perms" aria-pressed="false">Permutations</button>' +
        '<span class="faint">Skip repeats</span> <button class="chip" type="button" data-d="0" aria-pressed="true">Off</button><button class="chip" type="button" data-d="1" aria-pressed="false">On</button>' +
        '<span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-n="' + p + '">' + p + '</button>'; }).join('') +
        '<span class="faint">Use 122 and turn Skip repeats on to see pruning.</span></p>' +
        '<p class="va-presets bt-hint faint"></p></form><div class="va-player"></div>';
      var input = OR.$('#bt-in', host), slot = OR.$('.va-player', host), hint = OR.$('.bt-hint', host);

      function run() {
        var items = parse(input.value), cap = MAXN[mode];
        if (!items.length || !items[0]) items = parse(PRESETS[0]);
        items = items.slice(0, cap); input.value = items.join(' ');
        hint.textContent = (items.length === cap ? 'Capped at ' + cap + ' items so the tree stays readable. ' : '') + 'Items are sorted first, so equal values sit side by side.' +
          (mode === 'perms' ? ' Permutations loop over every unused item instead of only those after the start index; the marked lines are the same idea.' : '');
        if (player) player.destroy();
        slot.innerHTML = '';
        var R = build(items, mode, dedupe);
        player = OR.player(slot, {
          frames: R.frames, steps: STEPS, label: (mode === 'perms' ? 'Permutations' : 'Subsets') + ' of ' + R.items.join(' ') + (dedupe ? ', repeats skipped' : ''),
          paint: function (stage, f) { paint(R, stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-n],[data-m],[data-d]'); if (!b) return;
        if (b.dataset.n) input.value = b.dataset.n;
        else if (b.dataset.m) { mode = b.dataset.m; OR.$$('[data-m]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
        else { dedupe = b.dataset.d === '1'; OR.$$('[data-d]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
        run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
