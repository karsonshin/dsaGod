/* Offer Ready: topic lesson (#/topic/:id, #/topic/:id/:section).
   Renders a data/topics/<id>.js file (schema in README.md) in the fixed teaching order: cues,
   intuition, visualizer, template, complexity, variations, worked problems, practice, mistakes,
   quiz, flashcards, go deeper, prerequisites. Sections without content are skipped. Topics with no
   lesson file yet show their metadata and practice problems from the bank. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var SECTIONS = [
    ['cues', 'Recognition cues'], ['intuition', 'Intuition'], ['visual', 'See it run'], ['template', 'Template'],
    ['complexity', 'Complexity'], ['variations', 'Variations'], ['worked', 'Worked problems'], ['practice', 'Practice set'],
    ['mistakes', 'Common mistakes'], ['quiz', 'Quiz'], ['cards', 'Flashcards'], ['deeper', 'Go deeper'], ['next', 'Before and after']
  ];
  var ROI = { high: [3, 'High'], medium: [2, 'Medium'], low: [1, 'Low'] };

  function roiHTML(r) {
    var n = (ROI[r] || [0, ''])[0];
    return '<span class="roi" aria-hidden="true">' + [1, 2, 3].map(function (k) { return '<i' + (k <= n ? ' class="on"' : '') + '></i>'; }).join('') + '</span>' + esc((ROI[r] || [0, r])[1]);
  }
  function practiceRows(id, t) {
    var list = t && t.practice ? t.practice.map(function (e) { return OR.problem(e.lc); }).filter(Boolean)
      : OR.problems.filter(function (p) { return p.topic === id; }).sort(function (a, b) { return { Easy: 0, Medium: 1, Hard: 2 }[a.difficulty] - { Easy: 0, Medium: 1, Hard: 2 }[b.difficulty]; });
    if (!list.length) return '';
    var st = OR.store.get();
    return '<div class="table-wrap"><table class="table tp-practice"><thead><tr><th>#</th><th>Problem</th><th>Difficulty</th><th>Status</th><th><span class="sr-only">LeetCode</span></th></tr></thead><tbody>' +
      list.map(function (p) {
        return '<tr><td><span class="bib-tag">' + p.lc + '</span></td><td><a href="#/problem/' + p.lc + '">' + esc(p.title) + '</a>' + (p.premium ? '<span class="chip pb-prem">' + OR.icon('lock', 'icon-sm') + 'Premium</span>' : '') + '</td>' +
          '<td><span class="diff diff-' + p.difficulty + '">' + p.difficulty + '</span></td><td>' + OR.statusMark((st.problems[p.lc] || {}).status) + '</td>' +
          '<td><a class="icon-btn" href="' + OR.lcUrl(p) + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + esc(p.title) + ' on LeetCode">' + OR.icon('external', 'icon-sm') + '</a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function linksHTML(ids) {
    return ids.map(function (i) { var m = OR.topicMeta(i); return m ? '<a class="chip" href="#/topic/' + i + '">' + esc(m.title) + '</a>' : ''; }).join(' ');
  }
  function nextHTML(id, meta) {
    var after = OR.curriculum.filter(function (t) { return (t.prereqs || []).indexOf(id) >= 0; }).map(function (t) { return t.id; });
    var done = (OR.store.get().topics[id] || {}).done;
    return '<div class="tp-next"><div><h3 class="sub-title">Learn first</h3><p>' + ((meta.prereqs || []).length ? linksHTML(meta.prereqs) : '<span class="muted">Nothing; this is a starting point.</span>') + '</p></div>' +
      '<div><h3 class="sub-title">Unlocks</h3><p>' + (after.length ? linksHTML(after) : '<span class="muted">Nothing directly; it feeds mixed practice.</span>') + '</p></div></div>' +
      '<div class="tp-complete">' + (done
        ? '<p>' + OR.icon('check', 'icon-sm') + 'Marked complete' + ((OR.store.get().topics[id] || {}).doneAt ? ' on ' + OR.fmtDate(OR.store.get().topics[id].doneAt) : '') + '.</p><button class="btn btn-sm btn-ghost" type="button" data-tp="undone">Mark not complete</button>'
        : '<button class="btn btn-primary" type="button" data-tp="done">' + OR.icon('check', 'icon-sm') + 'Mark this topic complete</button><p class="faint">Do it once you can solve a new problem in this pattern without the template open.</p>') + '</div>';
  }
  function workedHTML(w, i) {
    var p = w.lc && OR.problem(w.lc), title = w.title || (p ? p.title : 'Problem ' + (i + 1));
    var part = function (label, body) { return body ? '<h4>' + label + '</h4>' + OR.md(body) : ''; };
    return '<details class="worked"' + (i === 0 ? ' open' : '') + '><summary><span class="worked-n num">' + (i + 1) + '</span><span class="worked-title">' + esc(title) + '</span>' +
      (p ? '<span class="diff diff-' + p.difficulty + '">' + p.difficulty + '</span><span class="faint num">LC ' + p.lc + '</span>' : '') + '</summary><div class="worked-body prose">' +
      part('The problem', w.restate) + part('Examples and edge cases', w.examples) + part('Brute force', w.brute) + part('The key insight', w.insight) +
      (w.code ? '<h4>Solution</h4></div>' + OR.codeBlock(w.code, { title: title }) + '<div class="worked-body prose">' : '') +
      part('Complexity', w.complexity) + (w.say ? '<h4>Say it out loud</h4><blockquote>' + OR.md(w.say) + '</blockquote>' : '') +
      ((w.followups || []).length ? '<h4>Follow-ups they might ask</h4><dl class="followups">' + w.followups.map(function (f) { return '<dt>' + OR.inline(f.q) + '</dt><dd>' + OR.md(f.a) + '</dd>'; }).join('') + '</dl>' : '') +
      (p ? '<p><a href="#/problem/' + p.lc + '">Track it, take notes and run it on its problem page</a>.</p>' : '') + '</div></details>';
  }

  function sectionsFor(t, id, meta) {
    var cards = (t.flashcards || []), out = [];
    function add(key, html) { if (html) out.push([key, html]); }
    add('cues', (t.cues || []).length && '<ul class="cues">' + t.cues.map(function (c) { return '<li>' + OR.icon('arrow-right', 'icon-sm') + '<span>' + OR.inline(c) + '</span></li>'; }).join('') + '</ul>');
    add('intuition', t.intuition && '<div class="prose">' + OR.md(t.intuition) + '</div>');
    add('visual', t.viz && OR.viz[t.viz] && '<div class="tp-viz" data-viz="' + esc(t.viz) + '"></div>' +
      (t.template ? '<div class="tp-viz-code">' + OR.codeBlock(t.template.code, { title: 'The template, in step with the run' }) + '</div>' : ''));
    add('template', t.template && (OR.codeBlock(t.template.code, { title: t.template.title || meta.title + ' template' }) + (t.template.note ? '<div class="prose tp-after">' + OR.md(t.template.note) + '</div>' : '')));
    add('complexity', t.complexity && '<dl class="tp-cx"><div><dt>Time</dt><dd class="mono">' + esc(t.complexity.time) + '</dd></div><div><dt>Space</dt><dd class="mono">' + esc(t.complexity.space) + '</dd></div></dl>' +
      '<div class="prose">' + OR.md(t.complexity.why || '') + (t.complexity.trap ? '<blockquote><p><strong>The trap.</strong> ' + OR.inline(t.complexity.trap) + '</p></blockquote>' : '') + '</div>');
    add('variations', (t.variations || []).length && t.variations.map(function (v) {
      return '<div class="tp-var"><h3 class="sub-title">' + esc(v.name) + '</h3><div class="prose">' + OR.md(v.body) + '</div>' + (v.code ? OR.codeBlock(v.code, { title: v.name }) : '') + '</div>';
    }).join(''));
    add('worked', (t.worked || []).length && t.worked.map(workedHTML).join(''));
    add('practice', practiceRows(id, t));
    add('mistakes', (t.mistakes || []).length && '<ul class="tp-mistakes prose">' + t.mistakes.map(function (m) { return '<li>' + OR.inline(m) + '</li>'; }).join('') + '</ul>');
    add('quiz', (t.quiz || []).length && '<div class="tp-quiz"></div>');
    add('cards', cards.length && '<p class="muted">' + OR.plural(cards.length, 'card') + ' from this topic join your spaced-repetition deck.</p><div class="tp-cards">' +
      cards.map(function (c) { return '<details class="tp-card"><summary>' + OR.inline(c.front) + '</summary><div class="prose">' + OR.md(c.back) + '</div></details>'; }).join('') +
      '</div><a class="btn" href="#/flashcards/' + id + '">' + OR.icon('cards', 'icon-sm') + 'Study these ' + cards.length + ' cards</a>');
    add('deeper', (t.deeper || []).length && '<ul class="deeper">' + t.deeper.filter(function (d) { return /^https?:\/\//.test(d.url); }).map(function (d) {
      return '<li><a href="' + esc(d.url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.title) + OR.icon('external', 'icon-sm') + '</a>' + (d.time ? '<span class="faint">' + esc(d.time) + '</span>' : '') + (d.note ? '<p>' + OR.inline(d.note) + '</p>' : '') + '</li>';
    }).join('') + '</ul>');
    add('next', nextHTML(id, meta));
    return out;
  }

  function scrollToSection(sec) {
    var el = sec && OR.$('#tp-' + sec);
    if (el) el.scrollIntoView({ block: 'start', behavior: OR.reducedMotion() ? 'auto' : 'smooth' });
  }

  OR.views.topic = {
    title: function (ctx) { var m = OR.topicMeta(ctx.params.id); return m ? m.title : 'Topic'; },
    same: function (ctx, prev) { return ctx.params.id === prev.params.id; },
    update: function (ctx) { scrollToSection(ctx.params.section); },
    scrollsItself: function (ctx) { return !!ctx.params.section; },
    render: function (main, ctx) {
      var id = ctx.params.id, meta = OR.topicMeta(id);
      if (!meta) {
        main.innerHTML = '<div class="page empty"><h1 class="empty-title display">No topic called “' + esc(id) + '”</h1><a class="btn btn-primary" href="#/topics">All topics</a></div>';
        return;
      }
      var t = OR.plan.topic(id), n = OR.curriculum.indexOf(meta) + 1, m = OR.plan.mastery(id), lv = OR.plan.masteryLevel(m.score);
      var phase = OR.plan.phase(meta.phase), read = (OR.store.get().topics[id] || {}).sections || {};
      var secs = t ? sectionsFor(t, id, meta) : [['practice', practiceRows(id, null)], ['next', nextHTML(id, meta)]].filter(function (s) { return s[1]; });
      var label = function (k) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i][0] === k) return SECTIONS[i][1]; return k; };

      main.innerHTML = '<div class="page tp">' +
        '<header class="tp-head"><span class="bib-tag tp-bib">' + String(n).padStart(2, '0') + '</span><div class="tp-headline"><h1 class="page-title display">' + esc(meta.title) + '</h1>' +
          '<p class="tp-hook">' + OR.inline(t && t.hook ? t.hook : meta.blurb) + '</p></div>' +
          '<dl class="tp-meta"><div><dt>Phase</dt><dd><a href="#/topics">' + esc(phase.name) + '</a></dd></div><div><dt>Study time</dt><dd class="num">about ' + meta.hours + ' h</dd></div>' +
          '<div><dt>Interview frequency</dt><dd>' + roiHTML(meta.roi) + '</dd></div><div><dt>Mastery</dt><dd><span class="mbar" data-level="' + lv.id + '"><span style="width:' + Math.round(m.score * 100) + '%"></span></span> ' + lv.label + '</dd></div></dl></header>' +
        (t ? '' : '<p class="banner">' + OR.icon('info') + '<span>The lesson for this topic isn’t written yet. Its practice problems and where it sits in the order are below.</span></p>') +
        '<div class="tp-layout">' +
          (secs.length > 2 ? '<nav class="tp-toc" aria-label="On this page"><ol>' + secs.map(function (s) {
            return '<li><a href="#/topic/' + id + '/' + s[0] + '" data-sec="' + s[0] + '"' + (read[s[0]] ? ' data-read="true"' : '') + '>' + label(s[0]) + '</a></li>';
          }).join('') + '</ol></nav>' : '') +
          '<div class="tp-body">' + secs.map(function (s) {
            return '<section class="tp-sec" id="tp-' + s[0] + '" data-sec="' + s[0] + '" aria-labelledby="tp-h-' + s[0] + '"><h2 class="tp-h" id="tp-h-' + s[0] + '">' + label(s[0]) + '</h2>' + s[1] + '</section>';
          }).join('') + '</div></div></div>';
      var root = main.firstChild, cleanups = [];

      if (t && (t.quiz || []).length) OR.quiz(OR.$('.tp-quiz', root), { key: 'topic:' + id, questions: t.quiz, topic: id });
      var vizHost = OR.$('.tp-viz', root);
      if (vizHost) {
        var marked = OR.$$('#tp-visual, #tp-template', root);
        try { var v = OR.viz[t.viz].mount(vizHost, { topic: id, mark: function (name) { marked.forEach(function (el) { OR.markLine(el, name); }); } }); if (v && v.destroy) cleanups.push(v.destroy); }
        catch (e) { console.error(e); vizHost.innerHTML = '<p class="muted">The visualizer hit an error: ' + esc(e.message) + '</p>'; }
      }
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tp]'); if (!b) return;
        OR.plan.markTopicDone(id, b.dataset.tp === 'done');
        if (b.dataset.tp === 'done') OR.toast(meta.title + ' marked complete.', { tone: 'ok' });
        OR.rerender();
      });

      // The section in the upper part of the viewport is "where you are": it lights up in the
      // contents, labels the resume point, and counts as read.
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var sec = en.target.dataset.sec;
            OR.$$('.tp-toc a', root).forEach(function (a) { if (a.dataset.sec === sec) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
            OR.setPlace({ title: meta.title, section: label(sec) });
            if (!read[sec]) {
              read[sec] = OR.today();
              OR.store.update(function (s) { var r = s.topics[id] = s.topics[id] || {}; r.sections = r.sections || {}; r.sections[sec] = read[sec]; });
              var a = OR.$('.tp-toc a[data-sec="' + sec + '"]', root); if (a) a.dataset.read = 'true';
            }
          });
        }, { rootMargin: '-25% 0px -65% 0px' });
        OR.$$('.tp-sec', root).forEach(function (s) { io.observe(s); });
        cleanups.push(function () { io.disconnect(); });
      }
      if (ctx.params.section) requestAnimationFrame(function () { scrollToSection(ctx.params.section); });
      return function () { cleanups.forEach(function (f) { f(); }); };
    }
  };
})();
