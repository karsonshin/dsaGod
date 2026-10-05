/* Offer Ready: trie visualizer (tries lesson).
   Input: a word list to insert, then queries. "cat" searches for the whole word, "ca*" asks startsWith.
   Nodes are named by their prefix ('' is the root), so the final trie is laid out once and nodes appear as they are created.
   Frames are snapshots; frame steps match the template's #@check/#@make/#@walk/#@flag/#@miss/#@end/#@prefix marks.
   Styles: css/viz/trie.css (.tr-*; cells reuse .va-* from app.css). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAXW = 6, MAXLEN = 6, MAXQ = 7, PX = 46, ROW = 58, PAD = 24;
  var PRESETS = [
    { w: 'car cart cat dog', q: 'car ca ca* cow', label: 'Shared prefix, prefix-only' },
    { w: 'tea ten team to', q: 'te* tea team tec', label: 'A word inside a word' },
    { w: 'a an ant', q: 'an and a an*', label: 'Words that nest' }
  ];
  var STEPS = {
    start: { label: 'Start' }, check: { label: 'Look for the edge' }, make: { label: 'Create node', tone: 'accent' }, walk: { label: 'Step down' },
    flag: { label: 'Mark word end', tone: 'accent' }, miss: { label: 'No edge', tone: 'hard' }, end: { label: 'Check the flag', tone: 'ok' },
    prefix: { label: 'Prefix found', tone: 'ok' }, done: { label: 'Result' }
  };
  function q(t) { return '“' + t + '”'; }
  function nm(id) { return id ? 'node ' + q(id) : 'the root'; }

  function parseWords(t) {
    return String(t).toLowerCase().split(/[^a-z]+/).filter(Boolean).map(function (w) { return w.slice(0, MAXLEN); }).slice(0, MAXW);
  }
  function parseQueries(t) {
    return String(t).toLowerCase().split(/\s+/).map(function (s) {
      var pre = /\*$/.test(s), w = s.replace(/[^a-z]/g, '').slice(0, MAXLEN);
      return w ? { w: w, pre: pre } : null;
    }).filter(Boolean).slice(0, MAXQ);
  }

  // The final trie of every inserted word: node id = its prefix; x counts leaves left to right, parents sit over their children.
  function layout(words) {
    var T = { '': { id: '', kids: [], d: 0 } }, leaf = 0, maxd = 0;
    words.forEach(function (w) {
      for (var i = 0; i < w.length; i++) {
        var p = w.slice(0, i), id = w.slice(0, i + 1);
        if (!T[id]) { T[id] = { id: id, ch: w[i], par: p, kids: [], d: i + 1 }; T[p].kids.push(id); }
      }
    });
    (function place(id) {
      var n = T[id]; maxd = Math.max(maxd, n.d); n.kids.sort();
      if (!n.kids.length) { n.x = leaf++; return; }
      n.kids.forEach(place);
      n.x = (T[n.kids[0]].x + T[n.kids[n.kids.length - 1]].x) / 2;
    })('');
    return { T: T, W: Math.max(leaf, 1), D: maxd };
  }

  function frames(words, queries) {
    var lay = layout(words), made = { '': 1 }, ends = {}, path = [''], res = [], F = [], oi = -1;
    var ops = words.map(function (w) { return '+' + w; }).concat(queries.map(function (x) { return x.w + (x.pre ? '*' : '?'); }));
    function snap(step, note, x) {
      F.push(Object.assign({ step: step, note: note, lay: lay, ops: ops, oi: oi, made: Object.assign({}, made), ends: Object.assign({}, ends),
        path: path.slice(), res: res.slice(), cur: '' }, x));
    }
    snap('start', 'An empty trie: just the root. Insert ' + (words.length ? words.map(q).join(', ') : 'nothing') + ', then run ' + (queries.length ? queries.length + ' quer' + (queries.length > 1 ? 'ies' : 'y') : 'no queries') + '. Each letter of a word is one edge.');

    words.forEach(function (w) {
      var node = '', i, nx;
      oi++; path = [''];
      for (i = 0; i < w.length; i++) {
        nx = node + w[i];
        if (made[nx]) {
          snap('check', 'Insert ' + q(w) + ': ' + nm(node) + ' already has an edge “' + w[i] + '”. Reuse it; shared prefixes cost nothing.', { cur: node });
        } else {
          snap('check', 'Insert ' + q(w) + ': ' + nm(node) + ' has no edge “' + w[i] + '” yet.', { cur: node, bad: 1 });
          made[nx] = 1;
          snap('make', 'Create ' + nm(nx) + ' and the edge “' + w[i] + '” that leads to it.', { cur: node, hit: nx });
        }
        node = nx; path.push(node);
        snap('walk', 'Step down the “' + w[i] + '” edge to ' + nm(node) + '.', { cur: node });
      }
      ends[node] = 1;
      snap('flag', 'Out of letters: flag ' + nm(node) + ' as the end of a word. Without this flag, ' + q(w) + ' could not be told apart from a prefix of a longer word.', { cur: node, hit: node });
    });

    queries.forEach(function (x) {
      var node = '', i, nx, w = x.w, label = (x.pre ? 'startsWith ' : 'search ') + q(w), ok;
      oi++; path = [''];
      for (i = 0; i < w.length; i++) {
        nx = node + w[i];
        if (!made[nx]) {
          snap('check', label + ': ' + nm(node) + ' has no edge “' + w[i] + '”.', { cur: node, bad: 1 });
          res.push({ t: x.pre ? w + '*' : w, ok: false });
          snap('miss', 'The path breaks after ' + (node ? q(node) : 'the root') + '. Nothing stored starts with ' + q(node + w[i]) + ': answer false. No need to read the rest of the word.', { cur: node, bad: 1 });
          return;
        }
        snap('check', label + ': ' + nm(node) + ' has the edge “' + w[i] + '”.', { cur: node });
        node = nx; path.push(node);
        snap('walk', 'Step down the “' + w[i] + '” edge to ' + nm(node) + '.', { cur: node });
      }
      if (x.pre) {
        res.push({ t: w + '*', ok: true });
        snap('prefix', 'Every letter of ' + q(w) + ' was walked, so some stored word starts with it: true. The word-end flag does not matter for a prefix.', { cur: node, good: 1 });
      } else {
        ok = !!ends[node];
        res.push({ t: w, ok: ok });
        snap('end', ok ? 'The whole word was walked and ' + nm(node) + ' is flagged as a word end: true.' : 'The whole word was walked, but ' + nm(node) + ' has no end flag: it is only a prefix of a longer word, so search is false.', { cur: node, good: ok ? 1 : 0, bad: ok ? 0 : 1 });
      }
    });

    path = []; oi = ops.length;
    snap('done', 'Words stored: ' + (Object.keys(ends).length ? Object.keys(ends).sort().join(', ') : 'none') + '. Every operation cost one step per letter, never more than the word’s length, however many words are stored.', { final: 1, cur: null });
    return F;
  }

  function stageHTML(f) {
    var lay = f.lay, T = lay.T, W = lay.W * PX, H = PAD * 2 + lay.D * ROW + 14, id, n, h = '';
    function X(n) { return (n.x + 0.5) * PX; }
    function Y(n) { return PAD + n.d * ROW; }
    h += '<div class="va tr"><div class="tr-ops" aria-hidden="true"></div>' +
      '<svg class="tr-svg" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + Math.round(W * 1.6) + 'px" aria-hidden="true"><g>';
    for (id in T) if (id) {
      n = T[id];
      var p = T[n.par], x1 = X(p), y1 = Y(p), x2 = X(n), y2 = Y(n);
      h += '<g class="tr-e off" data-id="' + id + '"><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
        '<text x="' + (x1 + (x2 - x1) * 0.7 + (x2 < x1 ? -7 : 7)) + '" y="' + (y1 + (y2 - y1) * 0.7 + 4) + '" text-anchor="middle">' + n.ch + '</text></g>';
    }
    h += '</g><g>';
    for (id in T) {
      n = T[id];
      h += '<g class="tr-n off" data-id="' + id + '"><circle class="ring" cx="' + X(n) + '" cy="' + Y(n) + '" r="16"/><circle class="c" cx="' + X(n) + '" cy="' + Y(n) + '" r="11"/>' +
        (id ? '<text class="w" x="' + X(n) + '" y="' + (Y(n) + 27) + '" text-anchor="middle">' + id + '</text>' : '<text class="r" x="' + X(n) + '" y="' + (Y(n) - 17) + '" text-anchor="middle">root</text>') + '</g>';
    }
    return h + '</g></svg><dl class="va-read"><div><dt>doing</dt><dd class="tr-doing"></dd></div><div><dt>answers</dt><dd class="tr-res"></dd></div><div><dt>stored</dt><dd class="tr-words"></dd></div></dl></div>';
  }

  function paint(stage, f) {
    if (!stage.firstChild) stage.innerHTML = stageHTML(f);
    var inPath = {}, k;
    f.path.forEach(function (id) { inPath[id] = 1; });
    OR.$$('.tr-n', stage).forEach(function (el) {
      var id = el.dataset.id, c = 'tr-n';
      if (!f.made[id]) c += ' off';
      else {
        if (inPath[id]) c += ' in';
        if (f.hit === id && f.step === 'make') c += ' ok';
        if (id === f.cur) c += f.bad ? ' dup cur' : f.good ? ' ok cur' : ' cur';
        if (f.ends[id]) c += ' end';
      }
      el.setAttribute('class', c);
    });
    OR.$$('.tr-e', stage).forEach(function (el) {
      var id = el.dataset.id;
      el.setAttribute('class', 'tr-e' + (f.made[id] ? '' : ' off') + (inPath[id] ? ' in' : ''));
    });
    OR.$('.tr-ops', stage).innerHTML = f.ops.map(function (t, i) {
      return '<span class="tr-op' + (i === f.oi && !f.final ? ' cur' : i < f.oi ? ' gone' : '') + '">' + esc(t) + '</span>';
    }).join('');
    k = f.final ? 'finished' : f.oi >= 0 && f.ops[f.oi] ? f.ops[f.oi] : 'nothing yet';
    OR.$('.tr-doing', stage).innerHTML = '<span class="mono">' + esc(k) + '</span>';
    OR.$('.tr-res', stage).innerHTML = f.res.length ? f.res.map(function (r) {
      return '<span class="va-kv' + (r.ok ? ' cv-take' : ' bad') + '">' + esc(r.t) + ' ' + (r.ok ? 'true' : 'false') + '</span>';
    }).join('') : '<span class="faint">none yet</span>';
    var ws = Object.keys(f.ends).sort();
    OR.$('.tr-words', stage).innerHTML = ws.length ? '<span class="mono">' + esc(ws.join(' ')) + '</span>' : '<span class="faint">empty</span>';
  }

  OR.viz.trie = {
    frames: frames, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = (ctx && ctx.mark) || function () {};
      host.innerHTML = '<form class="va-input" novalidate>' +
        '<label class="field-label" for="tr-w">Words to insert (up to ' + MAXW + ', ' + MAXLEN + ' letters each)</label>' +
        '<div class="va-input-row"><input class="input mono" id="tr-w" maxlength="48" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0].w) + '"></div>' +
        '<label class="field-label" for="tr-q">Queries: “cat” searches, “ca*” asks startsWith</label>' +
        '<div class="va-input-row"><input class="input mono" id="tr-q" maxlength="48" spellcheck="false" autocomplete="off" value="' + esc(PRESETS[0].q) + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p, i) {
          return '<button class="chip" type="button" data-p="' + i + '">' + esc(p.label) + '</button>';
        }).join('') + '</p></form><div class="va-player"></div>';
      var win = OR.$('#tr-w', host), qin = OR.$('#tr-q', host), slot = OR.$('.va-player', host);

      function run() {
        var words = parseWords(win.value), qs = parseQueries(qin.value);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(words, qs), steps: STEPS, label: 'Trie of ' + (words.join(', ') || 'no words'),
          paint: function (stage, f) { paint(stage, f); mark(f.step === 'start' || f.step === 'done' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var p = PRESETS[+b.dataset.p]; win.value = p.w; qin.value = p.q; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
