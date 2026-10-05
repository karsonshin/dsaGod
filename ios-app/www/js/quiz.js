/* Offer Ready: quiz engine.
   question: { kind: 'concept' | 'complexity' | 'pattern' | 'bug', q: md, code?: string, lang?: 'py',
               choices: [md], answer: index | [indices] (several right answers), explain: md }
   Answers autosave as you go (state.quizzes[key]); finishing records the topic's best score,
   which feeds mastery (practice 40%, quiz 30%, flashcard retention 30%). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var KIND = { concept: 'Concept', complexity: 'Complexity', pattern: 'Which pattern?', bug: 'Spot the bug' };

  function isMulti(q) { return Array.isArray(q.answer); }
  function rightSet(q) { return (isMulti(q) ? q.answer : [q.answer]).slice().sort(); }
  function isRight(q, picked) {
    var a = rightSet(q), p = (picked || []).slice().sort();
    return p.length === a.length && p.every(function (x, i) { return x === a[i]; });
  }

  // o: { key, questions, topic? }
  OR.quiz = function (host, o) {
    var qs = o.questions || [], key = o.key;
    function rec() { return OR.store.get().quizzes[key] || { answers: {}, checked: {} }; }
    function save(fn) { OR.store.update(function (s) { var r = s.quizzes[key] = s.quizzes[key] || { answers: {}, checked: {} }; fn(r); }); }

    function qHTML(i) {
      var q = qs[i], r = rec(), picked = r.answers[i] || [], checked = !!r.checked[i], right = rightSet(q), ok = checked && isRight(q, picked);
      var type = isMulti(q) ? 'checkbox' : 'radio';
      return '<fieldset class="q quiz-q" data-i="' + i + '"' + (checked ? ' data-state="' + (ok ? 'right' : 'wrong') + '"' : '') + '>' +
        '<legend><span class="q-n">' + (i + 1) + '/' + qs.length + '</span>' + (q.kind ? '<span class="quiz-kind">' + esc(KIND[q.kind] || q.kind) + '</span>' : '') + '</legend>' +
        '<div class="quiz-prompt">' + OR.md(q.q) + '</div>' +
        (q.code ? OR.codeBlock(q.code, { lang: q.lang || 'py' }) : '') +
        (isMulti(q) ? '<p class="faint quiz-multi">Pick every answer that applies.</p>' : '') +
        '<div class="quiz-choices">' + q.choices.map(function (c, k) {
          var on = picked.indexOf(k) >= 0, mark = checked ? (right.indexOf(k) >= 0 ? 'right' : on ? 'wrong' : '') : '';
          return '<label class="quiz-choice"' + (mark ? ' data-mark="' + mark + '"' : '') + '><input type="' + type + '" name="qz-' + esc(key) + '-' + i + '" value="' + k + '"' + (on ? ' checked' : '') + (checked ? ' disabled' : '') + '>' +
            '<span>' + OR.inline(c) + '</span>' + (mark === 'right' ? '<span class="quiz-tag">' + OR.icon('check', 'icon-sm') + 'Correct answer</span>' : mark === 'wrong' ? '<span class="quiz-tag">' + OR.icon('x', 'icon-sm') + 'Your pick</span>' : '') + '</label>';
        }).join('') + '</div>' +
        (checked
          ? '<div class="quiz-feedback" tabindex="-1"><p class="quiz-verdict">' + OR.icon(ok ? 'check' : 'x', 'icon-sm') + (ok ? 'Right.' : 'Not quite.') + '</p>' + OR.md(q.explain || '') + '</div>'
          : '<button class="btn btn-sm" type="button" data-qz="check"' + (picked.length ? '' : ' disabled') + '>Check answer</button>') +
        '</fieldset>';
    }
    function footHTML() {
      var r = rec(), done = qs.filter(function (q, i) { return r.checked[i]; }).length;
      var right = qs.filter(function (q, i) { return r.checked[i] && isRight(q, r.answers[i]); }).length;
      var best = o.topic && (OR.store.get().topics[o.topic] || {}).quiz;
      if (done < qs.length) return '<p class="quiz-progress"><span class="num">' + done + ' of ' + qs.length + '</span> checked' + (done ? ', ' + right + ' right' : '') + '.' + (best && best.best != null ? ' Best so far: ' + Math.round(best.best * 100) + '%.' : '') + '</p>';
      return '<div class="quiz-score"><p><span class="bib">' + right + '/' + qs.length + '</span><span>' + scoreLine(right / qs.length) + '</span></p>' +
        (best && best.best != null ? '<p class="faint">Best: ' + Math.round(best.best * 100) + '% over ' + OR.plural(best.attempts || 1, 'attempt') + '.</p>' : '') +
        '<button class="btn" type="button" data-qz="retake">' + OR.icon('reset', 'icon-sm') + 'Retake the quiz</button></div>';
    }
    function scoreLine(f) {
      if (f === 1) return 'Clean sweep. This topic counts as quiz-solid toward mastery.';
      if (f >= 0.7) return 'Solid. Reread the explanations you missed, then retake it in a few days.';
      return 'Worth another pass: reread the lesson sections behind the misses, then retake it.';
    }
    function render() {
      host.innerHTML = '<div class="quiz">' + qs.map(function (q, i) { return qHTML(i); }).join('') + '<div class="quiz-foot" aria-live="polite">' + footHTML() + '</div></div>';
    }
    function refresh(i, focusFeedback) {
      var old = OR.$('.quiz-q[data-i="' + i + '"]', host);
      old.outerHTML = qHTML(i);
      OR.$('.quiz-foot', host).innerHTML = footHTML();
      var fb = focusFeedback && OR.$('.quiz-q[data-i="' + i + '"] .quiz-feedback', host);
      if (fb) fb.focus({ preventScroll: true });
    }
    function finishIfDone() {
      var r = rec();
      if (!qs.every(function (q, i) { return r.checked[i]; }) || r.recorded) return;
      var score = qs.filter(function (q, i) { return isRight(q, r.answers[i]); }).length / qs.length;
      save(function (x) { x.recorded = true; });
      if (o.topic) OR.store.update(function (s) {
        var t = s.topics[o.topic] = s.topics[o.topic] || {}, prev = t.quiz || {};
        t.quiz = { best: Math.max(prev.best || 0, score), last: score, at: OR.today(), attempts: (prev.attempts || 0) + 1 };
      });
      OR.store.logActivity('quiz', 1);
      OR.$('.quiz-foot', host).innerHTML = footHTML();
    }

    host.addEventListener('change', function (e) {
      var inp = e.target, fs = inp.closest('.quiz-q'); if (!fs) return;
      var i = +fs.dataset.i, picked = OR.$$('input:checked', fs).map(function (x) { return +x.value; });
      save(function (r) { r.answers[i] = picked; });
      var btn = OR.$('[data-qz="check"]', fs); if (btn) btn.disabled = !picked.length;
    });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-qz]'); if (!b) return;
      if (b.dataset.qz === 'check') {
        var i = +b.closest('.quiz-q').dataset.i;
        save(function (r) { r.checked[i] = true; });
        refresh(i, true);
        finishIfDone();
      } else if (b.dataset.qz === 'retake') {
        save(function (r) { r.answers = {}; r.checked = {}; r.recorded = false; });
        render();
        var first = OR.$('.quiz-q input', host); if (first) first.focus();
      }
    });
    render();
  };
})();
