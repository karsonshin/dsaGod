/* Offer Ready: Pattern Detective (#/detective).
   Shows an original problem statement and asks which pattern solves it, before any hint. Cases come from
   each lesson's `detective` entries; unseen cases come first, then ones you last got wrong. Accuracy is
   kept per pattern in store.detective. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var cur = null; // { c: case, choices: [topic ids], pick }

  function pool() {
    var out = [];
    OR.topics.forEach(function (t) {
      (t.detective || []).forEach(function (d) { if (OR.topicMeta(t.id)) out.push(Object.assign({ key: t.id + ':' + d.id, topic: t.id }, d)); });
    });
    return out;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  function nextCase(all) {
    var last = {}, avoid = cur && cur.c.key;
    OR.store.get().detective.log.forEach(function (e) { last[e.key] = e.ok; });
    var fresh = all.filter(function (c) { return !(c.key in last) && c.key !== avoid; });
    var missed = all.filter(function (c) { return last[c.key] === false && c.key !== avoid; });
    var from = fresh.length ? fresh : missed.length ? missed : all.filter(function (c) { return c.key !== avoid; });
    var c = from.length ? from[Math.floor(Math.random() * from.length)] : all[0];
    // The answer, its written decoys, then other patterns that have cases, to make four.
    var choices = [c.topic].concat((c.decoys || []).filter(function (id) { return id !== c.topic && OR.topicMeta(id); }).slice(0, 3));
    shuffle(OR.topics.map(function (t) { return t.id; })).forEach(function (id) {
      if (choices.length < 4 && choices.indexOf(id) < 0 && OR.topicMeta(id)) choices.push(id);
    });
    return { c: c, choices: shuffle(choices), pick: null };
  }

  function statsHTML() {
    var by = OR.store.get().detective.byPattern, ids = Object.keys(by).filter(function (id) { return OR.topicMeta(id) && by[id].total; });
    if (!ids.length) return '';
    ids.sort(function (a, b) { return by[a].right / by[a].total - by[b].right / by[b].total || by[b].total - by[a].total; });
    return '<section class="section" aria-labelledby="dt-acc"><h2 id="dt-acc" class="section-title">Accuracy by pattern</h2><p class="faint">Weakest first. A miss counts against the pattern that was right, since that’s the one you didn’t recognize.</p>' +
      '<div class="table-wrap"><table class="table dt-table"><thead><tr><th>Pattern</th><th>Right</th><th>Accuracy</th></tr></thead><tbody>' + ids.map(function (id) {
        var s = by[id], pct = Math.round(100 * s.right / s.total);
        return '<tr><td><a href="#/topic/' + id + '">' + esc(OR.topicMeta(id).title) + '</a></td><td class="num">' + s.right + ' / ' + s.total + '</td>' +
          '<td><span class="mbar" data-level="' + (pct >= 80 ? 'mastered' : pct >= 50 ? 'practicing' : 'learning') + '"><span style="width:' + pct + '%"></span></span> <span class="num">' + pct + '%</span></td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function caseHTML(n) {
    var c = cur.c, done = cur.pick !== null, ok = cur.pick === c.topic;
    return '<article class="dt-case"' + (done ? ' data-state="' + (ok ? 'right' : 'wrong') + '"' : '') + ' aria-labelledby="dt-q">' +
      '<p class="dt-kicker"><span class="bib-tag">Case</span> <span class="faint">' + OR.plural(n, 'case') + ' in the file</span></p>' +
      '<div class="dt-statement prose">' + OR.md(c.statement) + '</div>' +
      '<h2 id="dt-q" class="sub-title">Which pattern cracks it?</h2>' +
      '<div class="dt-choices" role="group" aria-labelledby="dt-q">' + cur.choices.map(function (id, i) {
        var cls = done ? (id === c.topic ? ' is-right' : id === cur.pick ? ' is-wrong' : '') : '';
        return '<button class="dt-choice' + cls + '" type="button" data-pick="' + id + '"' + (done ? ' disabled' : '') + '><kbd>' + (i + 1) + '</kbd><span>' + esc(OR.topicMeta(id).title) + '</span>' +
          (done && id === c.topic ? OR.icon('check', 'icon-sm') : done && id === cur.pick ? OR.icon('x', 'icon-sm') : '') + '</button>';
      }).join('') + '</div>' +
      (done ? '<div class="dt-verdict" role="status"><p class="dt-result">' + (ok ? 'Right: it’s ' : 'Not quite. It’s ') + '<a href="#/topic/' + c.topic + '">' + esc(OR.topicMeta(c.topic).title) + '</a>.</p>' +
        '<div class="prose">' + OR.md(c.why || '') + '</div>' +
        '<button class="btn btn-primary" type="button" data-dt="next">Next case <kbd>N</kbd></button></div>' : '') +
      '</article>';
  }

  OR.views.detective = {
    title: function () { return 'Pattern Detective'; },
    render: function (main) {
      var all = pool();
      if (!all.length) {
        main.innerHTML = '<div class="page empty"><h1 class="empty-title display">No cases yet</h1><p>Cases arrive with each topic lesson.</p><a class="btn" href="#/topics">Topics</a></div>';
        return;
      }
      if (!cur || !all.some(function (c) { return c.key === cur.c.key; })) cur = nextCase(all);
      main.innerHTML = '<div class="page page-narrow dt">' +
        '<div class="page-head"><div><h1 class="page-title display">Pattern Detective</h1><p class="page-lede">Read the case and name the pattern before you think about code. Spotting the pattern is the skill an interview tests first. Keys <kbd>1</kbd>–<kbd>4</kbd> answer.</p></div></div>' +
        caseHTML(all.length) + statsHTML() + '</div>';
      var root = main.firstChild;

      function pick(id) {
        if (cur.pick !== null) return;
        cur.pick = id;
        OR.store.detectiveAnswer(cur.c.key, cur.c.topic, id);
        OR.rerender();
        var next = OR.$('[data-dt="next"]', main); if (next) next.focus({ preventScroll: true });
      }
      function next() { cur = nextCase(all); OR.rerender(); var b = OR.$('.dt-choice', main); if (b) b.focus({ preventScroll: true }); }
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick],[data-dt]'); if (!b) return;
        if (b.dataset.pick) pick(b.dataset.pick); else next();
      });
      function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        var k = +e.key;
        if (k >= 1 && k <= cur.choices.length && cur.pick === null) { e.preventDefault(); pick(cur.choices[k - 1]); }
        else if ((e.key === 'n' || e.key === 'N') && cur.pick !== null) { e.preventDefault(); next(); }
      }
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('keydown', onKey); };
    }
  };
})();
