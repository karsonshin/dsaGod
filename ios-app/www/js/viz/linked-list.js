/* Offer Ready: linked-list visualizer (iterative reversal with prev / cur / next).
   Each frame is a snapshot, so stepping back just paints an earlier frame. Frame steps match the template's
   #@save/#@link/#@advance/#@done marks. A "skip the save" switch replays the classic bug. Node positions stay fixed;
   only the arrows between them change, which is the point: reversal is pointer surgery, not moving nodes.
   Styles: css/viz/linked-list.css (.ll-*). Index convention: -1 is the null on the left, n is the null on the right. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var MAX = 7, PRESETS = ['1 2 3 4 5', '4 7', '9', '8 6 2 5 1 3'];
  var STEPS = {
    start: { label: 'Start' }, save: { label: 'Save next', tone: 'accent' }, link: { label: 'Flip pointer', tone: 'hard' },
    advance: { label: 'Advance' }, lost: { label: 'List lost', tone: 'hard' }, done: { label: 'Done', tone: 'ok' }
  };

  function chain(nxt, from, n) { // indices reachable from `from`, stopping at either null or a repeat
    var out = [], seen = {};
    while (from >= 0 && from < n && !seen[from]) { seen[from] = 1; out.push(from); from = nxt[from]; }
    return out;
  }
  function name(i, n) { return i < 0 || i >= n ? 'null' : 'node ' + (i + 1); }

  function frames(vals, bug) {
    var n = vals.length, nxt = vals.map(function (_, i) { return i + 1; }), prev = -1, cur = 0, nx, out = [];
    bug = bug && n > 1;
    function snap(step, note, x) {
      out.push(Object.assign({ step: step, note: note, nxt: nxt.slice(), prev: prev, cur: cur, nx: nx,
        rev: chain(nxt, prev, n), rest: chain(nxt, cur, n) }, x));
    }
    snap('start', n ? 'Two pointers: prev = null (nothing reversed yet) and cur = head, the first node. The arrows will flip one at a time; the nodes never move.'
      : 'An empty list has no nodes: cur is already null, so the loop never runs and we return prev, which is null.');
    while (cur < n) {
      var v = vals[cur];
      if (bug) {
        nxt[cur] = prev;
        var reach = chain(nxt, cur, n), lost = [];
        for (var k = 0; k < n; k++) if (reach.indexOf(k) < 0 && chain(nxt, prev, n).indexOf(k) < 0) lost.push(k);
        snap('lost', 'cur.next = prev ran before next was saved, so the only pointer to the rest of the list is gone. ' + lost.length + ' node' + (lost.length === 1 ? ' is' : 's are') + ' now unreachable. Nothing points to them and no variable holds them.', { lost: lost, final: true });
        return out;
      }
      nx = nxt[cur];
      snap('save', 'next = cur.next: remember ' + name(nx, n) + ' (' + (nx < n ? vals[nx] : 'null') + ') before touching the arrow. After the next line, cur.next no longer leads there.');
      nxt[cur] = prev;
      snap('link', 'cur.next = prev: node ' + (cur + 1) + ' (' + v + ') now points back at ' + name(prev, n) + '. The old arrow forward is gone, but next still holds the rest.', { rest: chain(nxt, nx, n) });
      prev = cur; cur = nx; nx = undefined;
      snap('advance', 'prev = cur, cur = next: both step one node to the right. Everything from prev leftwards is reversed.');
    }
    snap('done', n ? 'cur is null: every node has been visited. prev is the old tail, which is the new head. Return it. One pass, O(n) time, O(1) extra space.' : 'Return prev (null).', { final: true });
    return out;
  }

  function stageHTML(vals) {
    var n = vals.length, h = '<div class="ll"><div class="ll-row" aria-hidden="true">';
    for (var p = 0; p <= n + 1; p++) {
      var isNull = p === 0 || p === n + 1;
      h += (p ? '<div class="ll-gap" data-g="' + (p - 2) + '"></div>' : '') + '<div class="ll-col" data-p="' + p + '"><div class="ll-tile' + (isNull ? ' null' : '') + '">' +
        (isNull ? 'null' : '<b>' + esc(String(vals[p - 1])) + '</b><small>' + p + '</small>') + '</div><div class="ll-ptrs"></div></div>';
    }
    return h + '</div><dl class="va-read"><div><dt>prev</dt><dd class="ll-prev"></dd></div><div><dt>cur</dt><dd class="ll-cur"></dd></div><div><dt>next</dt><dd class="ll-next"></dd></div></dl>' +
      '<dl class="va-read"><div><dt>Reversed so far</dt><dd class="ll-rev"></dd></div><div><dt>Still to do</dt><dd class="ll-rest"></dd></div></dl></div>';
  }

  function paint(vals, stage, f) {
    var n = vals.length;
    if (!stage.firstChild) stage.innerHTML = stageHTML(vals);
    function col(idx) { return OR.$('.ll-col[data-p="' + (idx + 1) + '"]', stage); } // idx -1..n -> column 0..n+1
    OR.$$('.ll-col', stage).forEach(function (c, p) {
      var i = p - 1, t = OR.$('.ll-tile', c), badges = '';
      if (p > 0 && p <= n) {
        t.className = 'll-tile' + (f.rev.indexOf(i) >= 0 ? ' rev' : '') + (f.lost && f.lost.indexOf(i) >= 0 ? ' lost' : '') + (!f.final && i === f.cur ? ' cur' : '');
      }
      [['prev', f.prev], ['cur', f.cur], ['next', f.nx]].forEach(function (b) { if (b[1] === i) badges += '<span class="ll-b" data-b="' + b[0] + '">' + b[0] + '</span>'; });
      OR.$('.ll-ptrs', c).innerHTML = badges;
    });
    OR.$$('.ll-gap', stage).forEach(function (g) {
      var i = +g.dataset.g; // the gap between index i and i+1; -1 and n are the nulls
      var rn = i >= 0 && f.nxt[i] === i + 1, ln = i + 1 < n && f.nxt[i + 1] === i;
      g.textContent = rn ? '→' : ln ? '←' : '';
      g.className = 'll-gap' + (rn || ln ? '' : ' cut');
    });
    function nm(i) { return i === undefined ? '<span class="faint">not set yet</span>' : i < 0 || i >= n ? '<span class="mono">null</span>' : '<span class="mono">node ' + (i + 1) + '</span> <span class="faint">(' + esc(String(vals[i])) + ')</span>'; }
    function ch(a) { return a.length ? a.map(function (i) { return '<span class="va-kv">' + esc(String(vals[i])) + '</span>'; }).join('<span class="faint">→</span>') + '<span class="faint">→ null</span>' : '<span class="faint mono">null</span>'; }
    OR.$('.ll-prev', stage).innerHTML = nm(f.prev);
    OR.$('.ll-cur', stage).innerHTML = nm(f.cur);
    OR.$('.ll-next', stage).innerHTML = nm(f.nx);
    OR.$('.ll-rev', stage).innerHTML = ch(f.rev);
    OR.$('.ll-rest', stage).innerHTML = ch(f.rest);
  }

  function parse(text) {
    var out = [];
    String(text).split(/[\s,]+/).forEach(function (t) { if (/^-?\d{1,2}$/.test(t) && out.length < MAX) out.push(parseInt(t, 10)); });
    return out;
  }

  OR.viz['linked-list'] = {
    frames: frames, parse: parse, // exposed for tools/check_engine.py
    mount: function (host, ctx) {
      var player = null, mark = ctx.mark || function () {};
      host.innerHTML = '<form class="va-input" novalidate><label class="field-label" for="ll-in">Your list (up to ' + MAX + ' whole numbers)</label>' +
        '<div class="va-input-row"><input class="input mono" id="ll-in" maxlength="24" spellcheck="false" autocomplete="off" value="' + PRESETS[0] + '">' +
        '<button class="btn" type="submit">Run it</button></div>' +
        '<p class="va-presets"><span class="faint">Try</span> ' + PRESETS.map(function (p) { return '<button class="chip" type="button" data-s="' + p + '">' + p.split(' ').join(', ') + '</button>'; }).join('') + '</p>' +
        '<label class="ll-bug"><input type="checkbox" id="ll-bug"> Skip the save: rewire before remembering next (the classic bug, needs 2 or more nodes)</label></form><div class="va-player"></div>';
      var input = OR.$('#ll-in', host), bug = OR.$('#ll-bug', host), slot = OR.$('.va-player', host);

      function run() {
        var vals = parse(input.value);
        if (player) player.destroy();
        slot.innerHTML = '';
        player = OR.player(slot, {
          frames: frames(vals, bug.checked), steps: STEPS, label: 'Reversing the list ' + (vals.join(', ') || '(empty)'),
          paint: function (stage, f) { paint(vals, stage, f); mark(f.step === 'start' || f.step === 'lost' ? null : f.step); }
        });
      }
      OR.$('form', host).addEventListener('submit', function (e) { e.preventDefault(); run(); });
      bug.addEventListener('change', run);
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-s]'); if (!b) return;
        input.value = b.dataset.s; run();
      });
      run();
      return { destroy: function () { if (player) player.destroy(); mark(null); } };
    }
  };
})();
