/* Offer Ready: first run. Four questions, a live season preview, then the plan. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  var LANG_NOTES = {
    py: 'Shortest code under pressure; accepted almost everywhere.',
    js: 'Fine for most interviews; you write your own heap.',
    java: 'Verbose but explicit; great collections library.',
    cpp: 'Fastest and most control; easy to slip on details.'
  };

  function readForm(form) {
    var f = new FormData(form);
    return {
      lang: f.get('lang') || 'py',
      level: f.get('level') || 'ds-half',
      targetDate: f.get('target') || OR.store.get().settings.targetDate,
      weeklyHours: +f.get('hours') || 12
    };
  }

  function previewHTML(plan, answers) {
    var phases = {};
    plan.weeks.forEach(function (w) { var p = phases[w.phase] = phases[w.phase] || { a: w.n, b: w.n }; p.b = w.n; });
    var topics = {};
    plan.weeks.forEach(function (w) { w.topics.forEach(function (t) { topics[t.id] = 1; }); });
    var nTopics = Object.keys(topics).length, total = plan.weeks.length * answers.weeklyHours;
    var perDay = answers.weeklyHours / 6;
    var notes = [];
    if (plan.trimmed.length) notes.push('At ' + answers.weeklyHours + ' h a week, ' + OR.plural(plan.trimmed.length, 'lower-priority topic') + ' move to optional. Add hours to bring them back.');
    if (plan.skippedBonus.length && !plan.trimmed.length) notes.push('Competitive bonus topics stay optional; they rarely decide interviews.');
    return '<h2>Your season</h2>' +
      '<dl class="preview-facts"><div><dt>Weeks</dt><dd>' + plan.weeks.length + '</dd></div><div><dt>Study hours</dt><dd>' + total + '</dd></div><div><dt>Topics</dt><dd>' + nTopics + '</dd></div></dl>' +
      '<div id="ob-chart"></div>' +
      '<ol class="phase-list">' + Object.keys(phases).sort().map(function (id) {
        var p = phases[id], ph = OR.plan.phase(+id);
        return '<li><span class="wks">W' + p.a + (p.b !== p.a ? '–' + p.b : '') + '</span><span><strong>' + esc(ph.name) + '.</strong> ' + esc(ph.short) + '</span></li>';
      }).join('') + '</ol>' +
      '<p class="field-hint">About ' + (Math.round(perDay * 10) / 10) + ' h a day across six days, with one rest day a week. Applications start in week ' + plan.appsStartWeek + ', because interview loops take 4–8 weeks to schedule.</p>' +
      (notes.length ? '<p class="field-hint">' + esc(notes.join(' ')) + '</p>' : '');
  }

  OR.views.onboarding = {
    bare: true,
    title: function () { return 'Set up your season'; },
    render: function (main) {
      var s = OR.store.get().settings;
      var minDate = OR.addDays(OR.today(), 14);
      var choice = function (name, value, label, note, checked) {
        return '<label class="choice"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + '><b>' + esc(label) + '</b><small>' + esc(note) + '</small></label>';
      };
      main.innerHTML = '<div class="onboard">' +
        '<div class="onboard-intro">' +
          '<span class="brand"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="5" width="28" height="22" rx="3" fill="var(--accent)"/><circle cx="7" cy="10" r="1.6" fill="var(--bg)"/><circle cx="25" cy="10" r="1.6" fill="var(--bg)"/><rect x="8" y="15" width="16" height="3" rx="1" fill="var(--accent-ink)"/><rect x="8" y="20" width="10" height="2.5" rx="1" fill="var(--accent-ink)" opacity=".7"/></svg><span class="brand-word">Offer Ready</span></span>' +
          '<h1 class="onboard-title display">Let’s plan your season.</h1>' +
          '<p class="page-lede">Four answers, about a minute. Everything stays on this computer, and you can change any of it later in Settings.</p>' +
          '<form class="onboard-form" id="ob-form" novalidate>' +
            '<fieldset class="q"><legend><span class="q-n">1</span>Which language will you interview in?</legend><div class="choice-grid">' +
              OR.LANGS.map(function (l) { return choice('lang', l[0], l[2], LANG_NOTES[l[0]], s.lang === l[0]); }).join('') + '</div></fieldset>' +
            '<fieldset class="q"><legend><span class="q-n">2</span>Where are you starting from?</legend><div class="choice-grid">' +
              OR.plan.LEVELS.map(function (l) { return choice('level', l.id, l.label, l.note, s.level === l.id); }).join('') + '</div></fieldset>' +
            '<fieldset class="q"><legend><span class="q-n">3</span>When do you want an offer by?</legend>' +
              '<div class="field"><input class="input" type="date" name="target" id="ob-target" value="' + esc(s.targetDate) + '" min="' + minDate + '" required aria-describedby="ob-target-hint">' +
              '<span class="field-hint" id="ob-target-hint">Pick the date you want a signed offer in hand. The plan counts backwards from it.</span></div></fieldset>' +
            '<fieldset class="q"><legend><span class="q-n">4</span>How many hours a week can you study?</legend>' +
              '<div class="hours-row"><input type="range" name="hours" id="ob-hours" min="3" max="30" step="1" value="' + s.weeklyHours + '" aria-describedby="ob-hours-hint"><output class="hours-val" for="ob-hours" id="ob-hours-val">' + s.weeklyHours + ' h</output></div>' +
              '<span class="field-hint" id="ob-hours-hint">Be honest rather than heroic. A plan you can keep beats one you abandon in week three.</span></fieldset>' +
            '<div><button class="btn btn-primary btn-lg" type="submit">Build my plan' + OR.icon('arrow-right', 'icon-sm') + '</button></div>' +
          '</form>' +
        '</div>' +
        '<aside class="preview" id="ob-preview" aria-live="polite" aria-label="Plan preview"></aside>' +
        '</div>';

      var form = OR.$('#ob-form'), chart = null;
      function update() {
        var a = readForm(form);
        OR.$('#ob-hours-val').textContent = a.weeklyHours + ' h';
        if (!a.targetDate || a.targetDate < minDate) a.targetDate = minDate;
        var plan = OR.plan.generate({ startDate: OR.today(), targetDate: a.targetDate, weeklyHours: a.weeklyHours, level: a.level, restDay: s.restDay });
        OR.$('#ob-preview').innerHTML = previewHTML(plan, a);
        if (chart) chart.destroy();
        chart = OR.seasonChart(OR.$('#ob-chart'), { plan: plan, preview: true, compact: true, detail: false });
      }
      form.addEventListener('input', update);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var a = readForm(form);
        if (!a.targetDate || a.targetDate < minDate) {
          OR.toast('Pick an offer date at least two weeks from today.', { tone: 'error' });
          OR.$('#ob-target').focus();
          return;
        }
        OR.store.update(function (st) {
          st.settings.lang = a.lang; st.settings.level = a.level; st.settings.targetDate = a.targetDate;
          st.settings.weeklyHours = a.weeklyHours; st.settings.startDate = OR.today(); st.settings.onboarded = true;
          st.plan = OR.plan.generate(st.settings);
        });
        OR.store.flush();
        OR.emit('lang', a.lang);
        OR.refreshNav();
        OR.go('#/', 'top');
        var first = OR.plan.todayItems()[0];
        OR.toast('Your ' + OR.store.get().plan.weeks.length + '-week plan is ready.' + (first ? ' First up: ' + first.title.toLowerCase() + '.' : ''), { tone: 'ok' });
      });
      update();
      return function () { if (chart) chart.destroy(); };
    }
  };
})();
