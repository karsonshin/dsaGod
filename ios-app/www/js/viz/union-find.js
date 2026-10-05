/* Offer Ready: union-find visualizer (the lesson's DSU template, with each optimization switchable).
   Marks: find / climb / compress / same / link / merge. Each frame is a snapshot of the parent array,
   so stepping back repaints an earlier one. frames(ops, n, opt) is the pure builder; paint/mount only draw it. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX_OPS = 12, MAX_ID = 9;
  var PRESETS = ['0-1 2-3 1-3', '0-1 1-2 2-3 3-4 4-5 0-5 1-4', '0-1 2-3 4-5 0-2 4-0 1-5', '0-1 1-2 2-0'];
  var STEPS = {
    start: { label: 'Start' }, find: { label: 'Find both roots', tone: 'accent' }, climb: { label: 'Climb', tone: 'accent' },
    compress: { label: 'Compress path', tone: 'ok' }, same: { label: 'Same root', tone: 'hard' },
    link: { label: 'Pick the root', tone: 'accent' }, merge: { label: 'Link', tone: 'ok' }, done: { label: 'Done' }
  };

  function parse(text) {
    var ops = [], re = /(\d+)\s*-\s*(\d+)/g, m;
    while ((m = re.exec(String(text))) && ops.length < MAX_OPS) {
      var a = +m[1], b = +m[2];
      if (a <= MAX_ID && b <= MAX_ID) ops.push([a, b]);
    }
    return ops;
  }
  function depthOf(p, x) { var d = 0; while (p[x] !== x) { x = p[x]; d++; } return d; }
  function height(p) { var h = 0; for (var i = 0; i < p.length; i++) h = Math.max(h, depthOf(p, i)); return h; }

  // opt: { compress: bool, bySize: bool }
  function frames(ops, n0, opt) {
    var n = n0, i, parent = [], size = [], count, out = [], cycles = 0, hops = 0;
    for (i = 0; i < n; i++) { parent.push(i); size.push(1); }
    count = n;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, n: n, parent: parent.slice(), size: size.slice(), count: count, h: height(parent),
        hops: hops, cycles: cycles, hot: [], changed: [], op: null }, x));
    }
    snap('start', ops.length ? n + ' nodes, each its own root (its parent is itself), so there are ' + n + ' components. Compression is ' + (opt.compress ? 'on' : 'off') + ' and union by size is ' + (opt.bySize ? 'on' : 'off') + '.' : 'Type some unions like 0-1 2-3 1-3 and press Run it.');
    ops.forEach(function (op, k) {
      var a = op[0], b = op[1], roots = [], tag = 'union(' + a + ', ' + b + '): ', x = { op: k };
      snap('find', tag + 'find the root of ' + a + ' and of ' + b + '. The root is the node whose parent is itself.', Object.assign({ hot: [a, b] }, x));
      [a, b].forEach(function (s) {
        var path = [s], r = s;
        while (parent[r] !== r) { r = parent[r]; path.push(r); }
        hops = path.length - 1;
        snap('climb', 'find(' + s + '): ' + (path.length > 1 ? path.join(' → ') + ' is ' + hops + ' hop' + (hops === 1 ? '' : 's') + ' to the root ' + r + '.' : s + ' is its own root, 0 hops.'), Object.assign({ hot: path }, x));
        if (opt.compress) {
          var moved = path.filter(function (v) { return v !== r && parent[v] !== r; });
          if (moved.length) {
            moved.forEach(function (v) { parent[v] = r; });
            snap('compress', 'Path compression: point ' + moved.join(', ') + ' straight at ' + r + '. The next find on any of them is one hop.', Object.assign({ hot: path, changed: moved }, x));
          }
        } else if (path.length > 2) {
          snap('climb', 'Compression is off, so the path stays ' + hops + ' hops long. Every future find from ' + s + ' pays that again.', Object.assign({ hot: path }, x));
        }
        roots.push(r);
      });
      var ra = roots[0], rb = roots[1];
      if (ra === rb) {
        cycles++;
        snap('same', 'Both ends have root ' + ra + ': ' + a + ' and ' + b + ' are already connected. Nothing to link. As an edge, ' + a + '-' + b + ' would close a cycle.', Object.assign({ hot: [a, b, ra], cycle: true }, x));
        return;
      }
      var note;
      if (opt.bySize) {
        note = 'size[' + ra + '] = ' + size[ra] + ', size[' + rb + '] = ' + size[rb] + '. ';
        if (size[ra] < size[rb]) { var t = ra; ra = rb; rb = t; note += 'The tree under ' + rb + ' is smaller, so it will hang under ' + ra + '.'; }
        else note += 'The tree under ' + rb + ' is no bigger, so it will hang under ' + ra + '.';
      } else note = 'Union by size is off: root ' + ra + ' always hangs under root ' + rb + ', whatever the sizes (' + size[ra] + ' and ' + size[rb] + ').';
      if (!opt.bySize) { var u = ra; ra = rb; rb = u; }   // naive: first root goes under the second, so a chain can grow
      snap('link', note, Object.assign({ hot: [ra, rb] }, x));
      parent[rb] = ra; size[ra] += size[rb]; count--;
      snap('merge', 'parent[' + rb + '] = ' + ra + '. ' + count + ' component' + (count === 1 ? '' : 's') + ' left. The tallest tree is now ' + height(parent) + ' edge' + (height(parent) === 1 ? '' : 's') + ' tall.', Object.assign({ hot: [ra, rb], changed: [rb] }, x));
    });
    snap('done', ops.length ? count + ' component' + (count === 1 ? '' : 's') + ', ' + cycles + ' redundant union' + (cycles === 1 ? '' : 's') + ' (cycle edge' + (cycles === 1 ? '' : 's') + '). Tallest tree: ' + height(parent) + ' edge' + (height(parent) === 1 ? '' : 's') + '.' + (height(parent) >= 4 ? ' That is a chain, so finds are walking, not jumping. Turn on union by size and run it again.' : '') : 'Nothing to run.');
    return out;
  }

  /* Forest layout: leaves take consecutive slots, a parent sits above the mean of its children. */
  function layout(parent) {
    var n = parent.length, kids = [], x = [], y = [], slot = 0, i;
    for (i = 0; i < n; i++) kids.push([]);
    for (i = 0; i < n; i++) if (parent[i] !== i) kids[parent[i]].push(i);
    function go(v, d) {
      y[v] = d;
      if (!kids[v].length) { x[v] = slot++; return; }
      kids[v].forEach(function (c) { go(c, d + 1); });
      x[v] = (x[kids[v][0]] + x[kids[v][kids[v].length - 1]]) / 2;
    }
    for (i = 0; i < n; i++) if (parent[i] === i) { go(i, 0); slot += 0.4; }
    return { x: x, y: y, w: Math.max(slot - 0.4, 1) };
  }

  function paint(stage, f) {
    var L = layout(f.parent), DX = 46, DY = 48, R = 15, pad = 22;
    var maxY = Math.max.apply(null, L.y), W = Math.round(L.w * DX + pad), H = (maxY + 1) * DY + 6;
    function cx(v) { return pad / 2 + L.x[v] * DX + DX / 2 - 4; }
    function cy(v) { return 4 + L.y[v] * DY + R + 2; }
    var edges = '', nodes = '', v;
    for (v = 0; v < f.n; v++) {
      if (f.parent[v] === v) continue;
      var p = f.parent[v], ch = f.changed.indexOf(v) >= 0;
      edges += '<line class="uf-edge' + (ch ? ' new' : '') + '" x1="' + cx(v) + '" y1="' + cy(v) + '" x2="' + cx(p) + '" y2="' + cy(p) + '"/>';
    }
    for (v = 0; v < f.n; v++) {
      var cls = 'uf-node' + (f.parent[v] === v ? ' root' : '') + (f.hot.indexOf(v) >= 0 ? ' hot' : '') + (f.changed.indexOf(v) >= 0 ? ' chg' : '') + (f.cycle && f.hot.indexOf(v) >= 0 ? ' bad' : '');
      nodes += '<g class="' + cls + '" transform="translate(' + cx(v) + ' ' + cy(v) + ')"><circle r="' + R + '"/><text y="4.5">' + v + '</text></g>';
    }
    var cells = f.parent.map(function (pv, i) {
      var c = 'va-cell' + (f.changed.indexOf(i) >= 0 ? ' ok' : f.hot.indexOf(i) >= 0 ? ' cur' : pv === i ? ' in' : '');
      return '<div class="' + c + '"><b>' + pv + '</b><small>' + i + '</small></div>';
    }).join('');
    stage.innerHTML = '<div class="va uf"><div class="uf-lab faint">parent array (a cell holds the parent of the node numbered below it; shaded cells are roots)</div>' +
      '<div class="va-row uf-arr" aria-hidden="true">' + cells + '</div>' +
      '<svg class="uf-forest" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px" role="img" aria-label="The forest: ' + esc(f.parent.map(function (pv, i) { return i + (pv === i ? ' is a root' : ' under ' + pv); }).join(', ')) + '">' + edges + nodes + '</svg>' +
      '<dl class="va-read"><div><dt>components</dt><dd><b class="num">' + f.count + '</b></dd></div>' +
      '<div><dt>tallest tree</dt><dd><b class="num"' + (f.h >= 4 ? ' style="color:var(--hard)"' : '') + '>' + f.h + '</b><span class="faint">edges</span></dd></div>' +
      '<div><dt>last find</dt><dd><b class="num">' + f.hops + '</b><span class="faint">hop' + (f.hops === 1 ? '' : 's') + '</span></dd></div>' +
      '<div><dt>cycle edges</dt><dd><b class="num">' + f.cycles + '</b></dd></div></dl></div>';
  }

  OR.viz['union-find'] = {
    frames: frames, // exposed for tools/check_engine.py
    parse: parse,
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="uf-in">Unions (up to ' + MAX_OPS + ', written a-b, nodes 0 to ' + MAX_ID + ')</label>' +
        '<div class="va-input-row"><input class="input mono" id="uf-in" spellcheck="false" autocomplete="off" aria-label="Unions, such as 0-1 2-3 1-3" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<div class="uf-toggles"><label class="uf-sw"><input type="checkbox" id="uf-pc" checked> Path compression</label>' +
        '<label class="uf-sw"><input type="checkbox" id="uf-sz" checked> Union by size</label></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, k) { return '<button class="chip" type="button" data-k="' + k + '">' + esc(p) + '</button>'; }).join('') +
        '<span class="faint">Run the second one with union by size off, then on: the chain 0-1-2-3-4-5 appears only without it.</span></p></form><div class="va-player"></div>';
      var input = OR.$('#uf-in', host), pc = OR.$('#uf-pc', host), sz = OR.$('#uf-sz', host), slot = OR.$('.va-player', host);

      function run() {
        var ops = parse(input.value), n = Math.max(2, ops.reduce(function (m, o) { return Math.max(m, o[0] + 1, o[1] + 1); }, 0));
        var opt = { compress: pc.checked, bySize: sz.checked };
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(ops, n, opt), steps: STEPS, label: 'Union-find: ' + ops.map(function (o) { return o[0] + '-' + o[1]; }).join(' '),
          paint: function (stg, f) { paint(stg, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      pc.addEventListener('change', run); sz.addEventListener('change', run);
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-k]'); if (!b) return;
        input.value = PRESETS[b.dataset.k]; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
