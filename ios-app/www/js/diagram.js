/* Offer Ready: architecture and class diagrams (SVG, interactive, accessible).
   OR.diagram(host, spec)      layered architecture diagram with a detail panel and optional request-path scenarios.
   OR.classDiagram(host, spec) UML-style class boxes with inheritance, composition and association.
   Spec formats are documented in README.md ("System design content schema") and data/sd/schema.md.
   Keys: arrows move between nodes (roving focus), Enter or Space opens the detail panel, Escape closes it.
   Scenarios play through OR.player (Space plays, arrows step). Colors come from css/tokens.css via css/diagram.css. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var KINDS = { client: 'Client', lb: 'Load balancer', service: 'Service', cache: 'Cache', db: 'Database', queue: 'Queue', cdn: 'CDN', storage: 'Blob store', search: 'Search index', external: 'External' };
  var NW = 120, NH = 58, GX = 66, GY = 34, PAD = 12;

  function wrap(label, max) {
    var words = String(label).split(/\s+/), lines = [''];
    words.forEach(function (w) {
      var cur = lines[lines.length - 1];
      if (cur && (cur + ' ' + w).length > max) lines.push(w); else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
    });
    if (lines.length > 2) { lines = [lines[0], lines.slice(1).join(' ')]; }
    if (lines[1] && lines[1].length > max + 2) lines[1] = lines[1].slice(0, max) + '…';
    return lines;
  }

  /* ---------- Layout ---------- */
  // Assign each node a layer: spec layer, else longest path from the sources (replication edges stay in the same layer).
  function layers(spec) {
    var rank = {}, n = spec.nodes.length;
    spec.nodes.forEach(function (nd) { rank[nd.id] = typeof nd.layer === 'number' ? nd.layer : 0; });
    for (var pass = 0; pass < n; pass++) {
      var changed = false;
      spec.edges.forEach(function (e) {
        if (!(e.from in rank) || !(e.to in rank)) return;
        var t = spec.nodes.filter(function (x) { return x.id === e.to; })[0];
        if (typeof t.layer === 'number') return;
        var want = rank[e.from] + (e.style === 'replication' ? 0 : 1);
        if (want > rank[e.to] && want < n) { rank[e.to] = want; changed = true; }
      });
      if (!changed) break;
    }
    return rank;
  }

  function layout(spec, width) {
    var pos = {}, W, H, mode;
    var manual = spec.nodes.every(function (nd) { return typeof nd.x === 'number' && typeof nd.y === 'number'; });
    if (manual) {
      spec.nodes.forEach(function (nd) { pos[nd.id] = { x: nd.x + PAD, y: nd.y + PAD }; });
      W = Math.max.apply(null, spec.nodes.map(function (nd) { return nd.x; })) + NW + PAD * 2;
      H = Math.max.apply(null, spec.nodes.map(function (nd) { return nd.y; })) + NH + PAD * 2;
      return { pos: pos, W: W, H: H, mode: 'manual', key: 'manual' };
    }
    var rank = layers(spec), maxL = 0, cols = [];
    spec.nodes.forEach(function (nd) { maxL = Math.max(maxL, rank[nd.id]); });
    for (var k = 0; k <= maxL; k++) cols.push(spec.nodes.filter(function (nd) { return rank[nd.id] === k; }));
    cols = cols.filter(function (c) { return c.length; });
    mode = width >= 640 ? 'lr' : 'tb';
    if (mode === 'lr') {
      var tall = Math.max.apply(null, cols.map(function (c) { return c.length; }));
      var colH = tall * NH + (tall - 1) * GY;
      cols.forEach(function (c, ci) {
        var h = c.length * NH + (c.length - 1) * GY;
        c.forEach(function (nd, ri) { pos[nd.id] = { x: PAD + ci * (NW + GX), y: PAD + (colH - h) / 2 + ri * (NH + GY) }; });
      });
      W = PAD * 2 + cols.length * NW + (cols.length - 1) * GX; H = PAD * 2 + colH;
      return { pos: pos, W: W, H: H, mode: mode, key: 'lr' };
    }
    var per = Math.max(1, Math.floor((width - PAD * 2 + GX) / (NW + GX))), rows = [];
    cols.forEach(function (c) { for (var i = 0; i < c.length; i += per) rows.push(c.slice(i, i + per)); });
    var widest = Math.max.apply(null, rows.map(function (r) { return r.length; })), full = widest * NW + (widest - 1) * GX;
    rows.forEach(function (r, ri) {
      var w = r.length * NW + (r.length - 1) * GX;
      r.forEach(function (nd, i) { pos[nd.id] = { x: PAD + (full - w) / 2 + i * (NW + GX), y: PAD + ri * (NH + GY) }; });
    });
    return { pos: pos, W: PAD * 2 + full, H: PAD * 2 + rows.length * NH + (rows.length - 1) * GY, mode: mode, key: 'tb' + per };
  }

  /* ---------- Shared helpers ---------- */
  // Nearest focusable item in an arrow direction. items: [{ id, cx, cy }]
  function nearest(items, from, key) {
    var best = null, bs = Infinity;
    items.forEach(function (it) {
      if (it === from) return;
      var dx = it.cx - from.cx, dy = it.cy - from.cy, along, across;
      if (key === 'ArrowRight') { along = dx; across = dy; } else if (key === 'ArrowLeft') { along = -dx; across = dy; }
      else if (key === 'ArrowDown') { along = dy; across = dx; } else { along = -dy; across = dx; }
      if (along <= 4) return;
      var s = along + 2.2 * Math.abs(across);
      if (s < bs) { bs = s; best = it; }
    });
    return best;
  }
  function list(arr, cls) { return arr && arr.length ? '<ul class="' + cls + '">' + arr.map(function (t) { return '<li>' + OR.inline(t) + '</li>'; }).join('') + '</ul>' : ''; }
  function panelHTML(title, kind, d) {
    d = d || {};
    return '<h3 class="dg-p-title">' + esc(title) + (kind ? ' <span class="dg-kind">' + esc(kind) + '</span>' : '') + '</h3>' +
      (d.why ? '<div class="dg-p-why prose">' + OR.md(d.why) + '</div>' : '') +
      '<div class="dg-p-cols">' +
        (d.tradeoffs && d.tradeoffs.length ? '<div><h4>Trade-offs</h4>' + list(d.tradeoffs, 'dg-p-list') + '</div>' : '') +
        (d.alternatives && d.alternatives.length ? '<div><h4>Alternatives</h4>' + list(d.alternatives, 'dg-p-list') + '</div>' : '') +
        (d.scale ? '<div><h4>What breaks first</h4><p>' + OR.inline(d.scale) + '</p></div>' : '') +
      '</div>' + (!d.why && !d.tradeoffs && !d.scale ? '<p class="faint">No notes on this one.</p>' : '');
  }
  var HINT = '<p class="dg-hint">' + 'Select a box (click, tap, or arrow keys then Enter) to see why it is there, what it costs, and what breaks first.' + '</p>';

  /* ---------- OR.diagram ---------- */
  // spec: { title, nodes: [{ id, label, kind, layer?, x?, y?, detail: { why, tradeoffs[], alternatives[], scale } }],
  //         edges: [{ from, to, label?, style: 'sync' | 'async' | 'replication' }],
  //         scenarios: [{ id, label, steps: [{ title?, path: [nodeIds] | nodes: [ids], edges?: ['a>b'], note, tone? }] }] }
  OR.diagram = function (host, spec) {
    spec = { title: spec.title || 'Architecture diagram', nodes: spec.nodes || [], edges: spec.edges || [], scenarios: spec.scenarios || [] };
    var uid = 'dg' + OR.uid(), byId = {}, sel = null, hi = null, player = null, scen = '', L = null, focusId = spec.nodes.length ? spec.nodes[0].id : null;
    spec.nodes.forEach(function (n) { byId[n.id] = n; });

    host.innerHTML = '<div class="dg">' +
      (spec.scenarios.length ? '<div class="dg-scen" role="radiogroup" aria-label="Request path to trace"><span class="dg-scen-label">Trace a request</span>' +
        '<button type="button" role="radio" aria-checked="true" tabindex="0" data-sc="">Explore</button>' +
        spec.scenarios.map(function (s) { return '<button type="button" role="radio" aria-checked="false" tabindex="-1" data-sc="' + esc(s.id) + '">' + esc(s.label) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="dg-main"><div class="dg-canvas"></div>' +
      '<aside class="dg-panel" aria-live="polite" aria-label="Component details" tabindex="-1">' + HINT + '</aside></div>' +
      '<div class="dg-play"></div>' +
      '<p class="sr-only dg-sr"></p></div>';
    var root = host.firstChild, canvas = OR.$('.dg-canvas', root), panel = OR.$('.dg-panel', root), playHost = OR.$('.dg-play', root);
    OR.$('.dg-sr', root).textContent = spec.title + '. Components: ' + spec.nodes.map(function (n) { return n.label + ' (' + (KINDS[n.kind] || 'service') + ')'; }).join(', ') + '. Connections: ' +
      spec.edges.map(function (e) { return (byId[e.from] || {}).label + ' to ' + (byId[e.to] || {}).label + (e.label ? ' (' + e.label + ')' : ''); }).join('; ') + '.';

    function edgePath(a, b, off, mode) {
      var ax = a.x + NW / 2, ay = a.y + NH / 2, bx = b.x + NW / 2, by = b.y + NH / 2, dx = bx - ax, dy = by - ay;
      var horiz = mode === 'tb' ? Math.abs(dy) < 8 : mode === 'lr' ? Math.abs(dx) >= 8 : Math.abs(dx) / NW >= Math.abs(dy) / NH;
      var x1, y1, x2, y2, c1, c2;
      if (horiz) {
        var s = dx >= 0 ? 1 : -1; x1 = ax + s * NW / 2; y1 = ay + off; x2 = bx - s * NW / 2; y2 = by + off;
        var c = Math.max(24, Math.abs(x2 - x1) / 2); c1 = [x1 + s * c, y1]; c2 = [x2 - s * c, y2];
      } else {
        var t = dy >= 0 ? 1 : -1; x1 = ax + off; y1 = ay + t * NH / 2; x2 = bx + off; y2 = by - t * NH / 2;
        var d = Math.max(20, Math.abs(y2 - y1) / 2); c1 = [x1, y1 + t * d]; c2 = [x2, y2 - t * d];
      }
      return { d: 'M' + x1 + ' ' + y1 + ' C' + c1[0] + ' ' + c1[1] + ' ' + c2[0] + ' ' + c2[1] + ' ' + x2 + ' ' + y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
    }
    function marker(style) {
      return '<marker id="' + uid + '-' + style + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="dg-ah dg-ah-' + style + '" d="M1 1.5L9 5L1 8.5z"/></marker>';
    }
    function svgHTML() {
      var pos = L.pos, pairs = {};
      spec.edges.forEach(function (e) { pairs[e.from + '>' + e.to] = 1; });
      var edges = spec.edges.filter(function (e) { return pos[e.from] && pos[e.to]; }).map(function (e) {
        var st = e.style || 'sync', off = pairs[e.to + '>' + e.from] ? 7 : 0, p = edgePath(pos[e.from], pos[e.to], off, L.mode);
        return '<g class="dg-edge dg-e-' + st + '" data-key="' + esc(e.from + '>' + e.to) + '"><path class="dg-line" d="' + p.d + '" marker-end="url(#' + uid + '-' + st + ')"/>' +
          (e.label && L.mode !== 'tb' ? '<text class="dg-elabel" x="' + p.mx + '" y="' + (p.my - 5) + '" text-anchor="middle">' + esc(e.label) + '</text>' : '') + '</g>';
      }).join('');
      var nodes = spec.nodes.map(function (n) {
        var p = pos[n.id], lines = wrap(n.label, 16), kind = KINDS[n.kind] || 'Service', y0 = lines.length === 1 ? 37 : 31;
        return '<g class="dg-node dg-k-' + esc(n.kind || 'service') + '" data-id="' + esc(n.id) + '" role="button" tabindex="' + (n.id === focusId ? 0 : -1) + '" aria-pressed="false" aria-label="' +
          esc(n.label + ', ' + kind) + '. Press Enter for details." transform="translate(' + p.x + ' ' + p.y + ')">' +
          '<rect class="dg-ring" x="-4" y="-4" width="' + (NW + 8) + '" height="' + (NH + 8) + '" rx="8"/>' +
          '<rect class="dg-box" width="' + NW + '" height="' + NH + '" rx="5"/>' +
          '<path class="dg-stripe" d="M5 0H6V' + NH + 'H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z"/>' +
          '<text class="dg-tag" x="15" y="15">' + esc(kind.toUpperCase()) + '</text>' +
          '<text class="dg-lbl" x="15" y="' + y0 + '">' + lines.map(function (l, i) { return '<tspan x="15" dy="' + (i ? 14 : 0) + '">' + esc(l) + '</tspan>'; }).join('') + '</text></g>';
      }).join('');
      return '<svg class="dg-svg" viewBox="0 0 ' + L.W + ' ' + L.H + '" role="group" aria-label="' + esc(spec.title) + '" style="max-width:' + Math.round(L.W * 1.25) + 'px">' +
        '<defs>' + marker('sync') + marker('async') + marker('replication') + '</defs><g class="dg-nodes">' + nodes + '</g><g class="dg-edges" aria-hidden="true">' + edges + '</g></svg>';
    }

    function paintState() {
      var anyHi = !!hi;
      OR.$$('.dg-node', canvas).forEach(function (g) {
        var id = g.dataset.id;
        g.classList.toggle('is-sel', id === sel);
        g.setAttribute('aria-pressed', String(id === sel));
        g.classList.toggle('is-active', !!hi && hi.nodes.active.indexOf(id) >= 0);
        g.classList.toggle('is-done', !!hi && hi.nodes.done.indexOf(id) >= 0 && hi.nodes.active.indexOf(id) < 0);
        g.classList.toggle('is-dim', anyHi && hi.nodes.active.indexOf(id) < 0 && hi.nodes.done.indexOf(id) < 0);
      });
      OR.$$('.dg-edge', canvas).forEach(function (g) {
        var k = g.dataset.key, rk = k.split('>').reverse().join('>');
        var act = !!hi && (hi.edges.active.indexOf(k) >= 0 || hi.edges.active.indexOf(rk) >= 0);
        var done = !!hi && (hi.edges.done.indexOf(k) >= 0 || hi.edges.done.indexOf(rk) >= 0);
        g.classList.toggle('is-active', act);
        g.classList.toggle('is-done', done && !act);
        g.classList.toggle('is-dim', anyHi && !act && !done);
      });
    }
    function draw() {
      var hadFocus = canvas.contains(document.activeElement);
      L = layout(spec, canvas.clientWidth || 700);
      canvas.innerHTML = svgHTML();
      canvas.dataset.mode = L.mode;
      paintState();
      if (hadFocus) { var f = OR.$('.dg-node[data-id="' + focusId + '"]', canvas); if (f) f.focus({ preventScroll: true }); }
    }

    function showPanel() {
      var n = sel && byId[sel];
      panel.innerHTML = n ? panelHTML(n.label, KINDS[n.kind] || 'Service', n.detail) : HINT;
    }
    function select(id, scroll) {
      sel = id; focusId = id || focusId;
      OR.$$('.dg-node', canvas).forEach(function (g) { g.tabIndex = g.dataset.id === focusId ? 0 : -1; });
      showPanel(); paintState();
      if (id && scroll !== false) { var r = panel.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) panel.scrollIntoView({ block: 'nearest', behavior: OR.reducedMotion() ? 'auto' : 'smooth' }); }
    }

    canvas.addEventListener('click', function (e) {
      var g = e.target.closest('.dg-node'); if (!g) return;
      select(g.dataset.id === sel ? null : g.dataset.id);
      g.focus({ preventScroll: true });
    });
    canvas.addEventListener('keydown', function (e) {
      var g = e.target.closest('.dg-node'); if (!g) return;
      var k = e.key, gs = OR.$$('.dg-node', canvas);
      if (k === 'Enter' || k === ' ') { e.preventDefault(); select(g.dataset.id === sel ? null : g.dataset.id); return; }
      if (k === 'Escape' && sel) { e.preventDefault(); select(null); return; }
      var target = null;
      if (k === 'Home') target = gs[0]; else if (k === 'End') target = gs[gs.length - 1];
      else if (/^Arrow/.test(k)) {
        var items = gs.map(function (x) { var p = L.pos[x.dataset.id]; return { el: x, cx: p.x + NW / 2, cy: p.y + NH / 2 }; });
        var me = items.filter(function (it) { return it.el === g; })[0], nx = nearest(items, me, k);
        target = nx && nx.el;
        if (!target) { var order = gs.indexOf(g) + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1); target = gs[OR.clamp(order, 0, gs.length - 1)]; }
      }
      if (!target) return;
      e.preventDefault(); focusId = target.dataset.id;
      gs.forEach(function (x) { x.tabIndex = x === target ? 0 : -1; });
      target.focus();
    });

    /* ---------- Scenarios ---------- */
    function frames(s) {
      return s.steps.map(function (st, i) {
        var ns = st.path || st.nodes || [], es = (st.edges || []).slice();
        if (st.path) for (var k = 0; k + 1 < st.path.length; k++) es.push(st.path[k] + '>' + st.path[k + 1]);
        return { step: 's' + i, note: st.note || '', nodes: ns, edges: es, title: st.title || ('Step ' + (i + 1)), tone: st.tone };
      });
    }
    function setScenario(id) {
      if (player) { player.destroy(); player = null; }
      scen = id; hi = null; playHost.innerHTML = '';
      OR.$$('.dg-scen [role="radio"]', root).forEach(function (b) { var on = b.dataset.sc === id; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      var s = spec.scenarios.filter(function (x) { return x.id === id; })[0];
      if (!s) { paintState(); return; }
      var F = frames(s), steps = {};
      F.forEach(function (f) { steps[f.step] = { label: f.title + '.', tone: f.tone }; });
      player = OR.player(playHost, { frames: F, steps: steps, label: s.label + ' trace',
        paint: function (stage, f, i) {
          var done = { nodes: [], edges: [] };
          for (var k = 0; k < i; k++) { done.nodes = done.nodes.concat(F[k].nodes); done.edges = done.edges.concat(F[k].edges); }
          hi = { nodes: { active: f.nodes, done: done.nodes }, edges: { active: f.edges, done: done.edges } };
          paintState();
        } });
    }
    root.addEventListener('click', function (e) { var b = e.target.closest('.dg-scen [data-sc]'); if (b) setScenario(b.dataset.sc); });

    draw();
    var ro = null, lastKey = L.key;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(OR.debounce(function () {
        if (!canvas.isConnected) return;
        var next = layout(spec, canvas.clientWidth || 700);
        if (next.key !== lastKey) { lastKey = next.key; draw(); }
      }, 80));
      ro.observe(canvas);
    }
    return { select: select, scenario: setScenario, destroy: function () { if (ro) ro.disconnect(); if (player) player.destroy(); } };
  };
  OR.diagram._h = { nearest: nearest, panelHTML: panelHTML, HINT: HINT, wrap: wrap };
  /* ---------- OR.classDiagram ---------- */
  // spec: { title, classes: [{ id, name, kind?: 'class'|'interface'|'abstract'|'enum', fields: ['- id: int'], methods: ['+ book(slot): bool'],
  //           detail?: { why, tradeoffs[], alternatives[], scale } }],
  //         relations: [{ from, to, type: 'inherits'|'implements'|'composes'|'aggregates'|'associates'|'depends', label?, fromMult?, toMult? }] }
  // Reading a relation: "from inherits to" (child -> parent); "from composes to" (whole -> part, diamond at the whole).
  var CH = 16, CW = 6.9;
  OR.classDiagram = function (host, spec) {
    spec = { title: spec.title || 'Class diagram', classes: spec.classes || [], relations: spec.relations || [] };
    var uid = 'cd' + OR.uid(), byId = {}, sel = null, L = null, focusId = spec.classes.length ? spec.classes[0].id : null;
    spec.classes.forEach(function (c) {
      c.fields = c.fields || []; c.methods = c.methods || [];
      var chars = Math.max(c.name.length + (c.kind && c.kind !== 'class' ? 2 : 0), Math.max.apply(null, c.fields.concat(c.methods).concat(['']).map(function (s) { return s.length; })));
      c.w = OR.clamp(Math.round(chars * CW + 24), 130, 300);
      c.h = (c.kind && c.kind !== 'class' ? 40 : 30) + (c.fields.length ? c.fields.length * CH + 8 : 8) + (c.methods.length ? c.methods.length * CH + 8 : 8);
      byId[c.id] = c;
    });
    var STAR = { interface: '«interface»', abstract: '«abstract»', enum: '«enum»' };

    host.innerHTML = '<div class="dg dg-class"><div class="dg-main"><div class="dg-canvas"></div>' +
      '<aside class="dg-panel" aria-live="polite" aria-label="Class details" tabindex="-1"><p class="dg-hint">Select a class (click, tap, or arrow keys then Enter) to see why it exists and what the design gives up.</p></aside></div>' +
      '<p class="sr-only dg-sr"></p></div>';
    var root = host.firstChild, canvas = OR.$('.dg-canvas', root), panel = OR.$('.dg-panel', root), hint = panel.innerHTML;
    var REL = { inherits: 'inherits from', implements: 'implements', composes: 'is composed of', aggregates: 'aggregates', associates: 'is associated with', depends: 'depends on' };
    OR.$('.dg-sr', root).textContent = spec.title + '. Classes: ' + spec.classes.map(function (c) { return c.name + (c.fields.length ? ' with fields ' + c.fields.join(', ') : '') + (c.methods.length ? ' and methods ' + c.methods.join(', ') : ''); }).join('. ') + '. Relationships: ' +
      spec.relations.map(function (r) { return (byId[r.from] || {}).name + ' ' + (REL[r.type] || r.type) + ' ' + (byId[r.to] || {}).name; }).join('; ') + '.';

    function rankOf() {
      var rank = {}, n = spec.classes.length;
      spec.classes.forEach(function (c) { rank[c.id] = 0; });
      for (var pass = 0; pass < n; pass++) {
        var ch = false;
        spec.relations.forEach(function (r) {
          if (!byId[r.from] || !byId[r.to]) return;
          if (r.type === 'inherits' || r.type === 'implements') { if (rank[r.from] < rank[r.to] + 1 && rank[r.to] + 1 < n) { rank[r.from] = rank[r.to] + 1; ch = true; } }
          else if (r.type === 'composes' || r.type === 'aggregates') { if (rank[r.to] < rank[r.from] + 1 && rank[r.from] + 1 < n) { rank[r.to] = rank[r.from] + 1; ch = true; } }
        });
        if (!ch) break;
      }
      return rank;
    }
    function place(width) {
      var rank = rankOf(), levels = [], pos = {}, GAP = 28, VG = 54;
      spec.classes.forEach(function (c) { (levels[rank[c.id]] = levels[rank[c.id]] || []).push(c); });
      var rows = [];
      levels.filter(Boolean).forEach(function (lv) {
        var row = [], w = 0;
        lv.forEach(function (c) {
          if (row.length && w + GAP + c.w > width - PAD * 2) { rows.push(row); row = []; w = 0; }
          row.push(c); w += (row.length > 1 ? GAP : 0) + c.w;
        });
        rows.push(row);
      });
      var rw = rows.map(function (r) { return r.reduce(function (s, c) { return s + c.w; }, 0) + (r.length - 1) * GAP; }), full = Math.max.apply(null, rw), y = PAD;
      rows.forEach(function (r, ri) {
        var x = PAD + (full - rw[ri]) / 2, hmax = Math.max.apply(null, r.map(function (c) { return c.h; }));
        r.forEach(function (c) { pos[c.id] = { x: x, y: y }; x += c.w + GAP; });
        y += hmax + VG;
      });
      return { pos: pos, W: full + PAD * 2, H: y - VG + PAD, key: rows.map(function (r) { return r.length; }).join('-') };
    }
    function clip(c, p, dx, dy) { // distance from the center of box c to its border along (dx, dy)
      var tx = dx ? (c.w / 2) / Math.abs(dx) : Infinity, ty = dy ? (c.h / 2) / Math.abs(dy) : Infinity;
      return Math.min(tx, ty);
    }
    function markerDefs() {
      var ah = function (id, d, cls, ref) { return '<marker id="' + uid + '-' + id + '" viewBox="0 0 12 10" refX="' + ref + '" refY="5" markerWidth="11" markerHeight="9" orient="auto-start-reverse"><path class="dg-cm ' + cls + '" d="' + d + '"/></marker>'; };
      return ah('tri', 'M1 1L11 5L1 9z', 'dg-cm-hollow', 11) + ah('dia', 'M1 5L6 1.5L11 5L6 8.5z', 'dg-cm-fill', 11) + ah('diah', 'M1 5L6 1.5L11 5L6 8.5z', 'dg-cm-hollow', 11) + ah('open', 'M1.5 1.5L10 5L1.5 8.5', 'dg-cm-open', 10);
    }
    function svgHTML() {
      var pos = L.pos;
      var rels = spec.relations.filter(function (r) { return pos[r.from] && pos[r.to]; }).map(function (r) {
        var a = byId[r.from], b = byId[r.to], pa = pos[r.from], pb = pos[r.to];
        var ax = pa.x + a.w / 2, ay = pa.y + a.h / 2, bx = pb.x + b.w / 2, by = pb.y + b.h / 2, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
        var ta = clip(a, pa, dx, dy), tb = clip(b, pb, dx, dy), x1 = ax + dx * ta + 0, y1 = ay + dy * ta, x2 = bx - dx * tb, y2 = by - dy * tb;
        var mk = { inherits: ['', 'tri'], implements: ['', 'tri'], composes: ['dia', ''], aggregates: ['diah', ''], associates: ['', 'open'], depends: ['', 'open'] }[r.type] || ['', 'open'];
        var dash = r.type === 'implements' || r.type === 'depends', nx = -dy / len, ny = dx / len;
        return '<g class="dg-rel dg-r-' + esc(r.type) + '"><path class="dg-line' + (dash ? ' is-dash' : '') + '" d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"' +
          (mk[0] ? ' marker-start="url(#' + uid + '-' + mk[0] + ')"' : '') + (mk[1] ? ' marker-end="url(#' + uid + '-' + mk[1] + ')"' : '') + '/>' +
          (r.label ? '<text class="dg-elabel" x="' + ((x1 + x2) / 2 + nx * 9) + '" y="' + ((y1 + y2) / 2 + ny * 9) + '" text-anchor="middle">' + esc(r.label) + '</text>' : '') +
          (r.fromMult ? '<text class="dg-elabel" x="' + (x1 + dx / len * 14 + nx * 10) + '" y="' + (y1 + dy / len * 14 + ny * 10) + '" text-anchor="middle">' + esc(r.fromMult) + '</text>' : '') +
          (r.toMult ? '<text class="dg-elabel" x="' + (x2 - dx / len * 14 + nx * 10) + '" y="' + (y2 - dy / len * 14 + ny * 10) + '" text-anchor="middle">' + esc(r.toMult) + '</text>' : '') + '</g>';
      }).join('');
      var boxes = spec.classes.map(function (c) {
        var p = pos[c.id], star = STAR[c.kind], hh = star ? 40 : 30, fy = hh + 4, fh = c.fields.length ? c.fields.length * CH + 8 : 8, my = hh + fh;
        return '<g class="dg-node dg-c-' + esc(c.kind || 'class') + '" data-id="' + esc(c.id) + '" role="button" tabindex="' + (c.id === focusId ? 0 : -1) + '" aria-pressed="false" aria-label="' + esc((star ? c.kind + ' ' : 'class ') + c.name) + '. Press Enter for details." transform="translate(' + p.x + ' ' + p.y + ')">' +
          '<rect class="dg-ring" x="-4" y="-4" width="' + (c.w + 8) + '" height="' + (c.h + 8) + '" rx="6"/><rect class="dg-box" width="' + c.w + '" height="' + c.h + '" rx="3"/>' +
          '<path class="dg-sep" d="M0 ' + hh + 'H' + c.w + 'M0 ' + my + 'H' + c.w + '"/>' +
          (star ? '<text class="dg-cstar" x="' + c.w / 2 + '" y="14" text-anchor="middle">' + esc(star) + '</text>' : '') +
          '<text class="dg-cname' + (c.kind === 'abstract' || c.kind === 'interface' ? ' is-ital' : '') + '" x="' + c.w / 2 + '" y="' + (star ? 31 : 20) + '" text-anchor="middle">' + esc(c.name) + '</text>' +
          c.fields.map(function (f, i) { return '<text class="dg-cmem" x="10" y="' + (fy + 10 + i * CH) + '">' + esc(f) + '</text>'; }).join('') +
          c.methods.map(function (m, i) { return '<text class="dg-cmem" x="10" y="' + (my + 14 + i * CH) + '">' + esc(m) + '</text>'; }).join('') + '</g>';
      }).join('');
      return '<svg class="dg-svg" viewBox="0 0 ' + L.W + ' ' + L.H + '" role="group" aria-label="' + esc(spec.title) + '" style="max-width:' + Math.round(L.W * 1.25) + 'px"><defs>' + markerDefs() + '</defs>' +
        '<g class="dg-edges" aria-hidden="true">' + rels + '</g><g class="dg-nodes">' + boxes + '</g></svg>';
    }
    function paintState() {
      OR.$$('.dg-node', canvas).forEach(function (g) { g.classList.toggle('is-sel', g.dataset.id === sel); g.setAttribute('aria-pressed', String(g.dataset.id === sel)); });
    }
    function draw() {
      var had = canvas.contains(document.activeElement);
      L = place(canvas.clientWidth || 700); canvas.innerHTML = svgHTML(); paintState();
      if (had) { var f = OR.$('.dg-node[data-id="' + focusId + '"]', canvas); if (f) f.focus({ preventScroll: true }); }
    }
    function select(id) {
      sel = id; var c = id && byId[id];
      panel.innerHTML = c ? panelHTML(c.name, c.kind && c.kind !== 'class' ? c.kind : 'class', c.detail) : hint;
      paintState();
      if (c) { var r = panel.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) panel.scrollIntoView({ block: 'nearest', behavior: OR.reducedMotion() ? 'auto' : 'smooth' }); }
    }
    canvas.addEventListener('click', function (e) { var g = e.target.closest('.dg-node'); if (!g) return; select(g.dataset.id === sel ? null : g.dataset.id); g.focus({ preventScroll: true }); });
    canvas.addEventListener('keydown', function (e) {
      var g = e.target.closest('.dg-node'); if (!g) return;
      var k = e.key, gs = OR.$$('.dg-node', canvas);
      if (k === 'Enter' || k === ' ') { e.preventDefault(); select(g.dataset.id === sel ? null : g.dataset.id); return; }
      if (k === 'Escape' && sel) { e.preventDefault(); select(null); return; }
      var target = null;
      if (k === 'Home') target = gs[0]; else if (k === 'End') target = gs[gs.length - 1];
      else if (/^Arrow/.test(k)) {
        var items = gs.map(function (x) { var c = byId[x.dataset.id], p = L.pos[c.id]; return { el: x, cx: p.x + c.w / 2, cy: p.y + c.h / 2 }; });
        var nx = nearest(items, items.filter(function (it) { return it.el === g; })[0], k);
        target = nx ? nx.el : gs[OR.clamp(gs.indexOf(g) + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1), 0, gs.length - 1)];
      }
      if (!target) return;
      e.preventDefault(); focusId = target.dataset.id; gs.forEach(function (x) { x.tabIndex = x === target ? 0 : -1; }); target.focus();
    });
    draw();
    var lastKey = L.key, ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(OR.debounce(function () { if (canvas.isConnected && place(canvas.clientWidth || 700).key !== lastKey) { lastKey = place(canvas.clientWidth || 700).key; draw(); } }, 80));
      ro.observe(canvas);
    }
    return { select: select, destroy: function () { if (ro) ro.disconnect(); } };
  };
})();
