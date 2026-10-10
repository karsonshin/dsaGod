/* Offer Ready: planning engine.
   Season generator (timeline + weekly hours -> weekly blocks), mastery, pace, streaks,
   weekly hours and tonight's three items. Shared by Today, Plan, Roadmap and Progress. */
(function () {
  'use strict';
  var OR = window.OR;
  var P = (OR.plan = {});

  P.LEVELS = [
    { id: 'new', label: 'New to DS&A', note: 'Arrays and loops are fine; data structures are new.', mult: 1.35 },
    { id: 'ds-half', label: 'Half comfortable with data structures', note: 'You know the structures; algorithms and LeetCode feel shaky.', mult: 1.1 },
    { id: 'ds-solid', label: 'Solid on data structures', note: 'Comfortable with structures, new to algorithm patterns.', mult: 0.95 },
    { id: 'polish', label: 'Ready to polish', note: 'You solve mediums; you need speed, breadth and mocks.', mult: 0.75 }
  ];
  function levelMult(id) { for (var i = 0; i < P.LEVELS.length; i++) if (P.LEVELS[i].id === id) return P.LEVELS[i].mult; return 1.1; }

  // Share of a week's hours that goes to new topic study, by phase (the rest: review, system design, behavioral, applications).
  var TOPIC_SHARE = { 1: 0.7, 2: 0.66, 3: 0.56, 4: 0.54, 5: 0.25 };
  var APPS_START_WEEK = 3; // interview loops take 4-8 weeks to schedule, so applications start early

  function topicsInOrder() { return OR.curriculum.slice(); }

  /* ---------- Generation ---------- */
  // Builds weeks starting at `fromWeek` (1-based). Earlier weeks of `prev` are kept as they were.
  P.generate = function (settings, opts) {
    opts = opts || {};
    var start = settings.startDate || OR.today();
    var target = settings.targetDate;
    var W = Math.max(2, Math.floor(OR.daysBetween(start, target) / 7));
    var hours = settings.weeklyHours || 12;
    var mult = levelMult(settings.level);
    var prev = opts.prev;
    var fromWeek = prev ? OR.clamp(opts.fromWeek || 1, 1, W) : 1;
    var done = opts.done || {};

    var keep = prev ? prev.weeks.filter(function (w) { return w.n < fromWeek; }) : [];
    var already = {};
    keep.forEach(function (w) { w.topics.forEach(function (t) { already[t.id] = (already[t.id] || 0) + t.hours; }); });

    var all = topicsInOrder();
    var mockWeeks = Math.max(1, Math.round(W * 0.2));
    var learnWeeks = Math.max(1, W - mockWeeks);
    // Required = everything except the competitive bonus group. Remaining hours per topic account for weeks already kept.
    var queue = all.filter(function (t) { return !done[t.id]; }).map(function (t) {
      var h = Math.max(0.5, Math.round(t.hours * mult * 2) / 2);
      return { id: t.id, phase: t.phase, group: t.group, roi: t.roi, left: Math.max(0, h - (already[t.id] || 0)), total: h };
    }).filter(function (q) { return q.left > 0; });

    var required = queue.filter(function (q) { return q.group !== 'advanced'; });
    var bonus = queue.filter(function (q) { return q.group === 'advanced'; });

    // Capacity check: if required topics overflow the learning weeks, demote low-ROI topics to optional.
    var weeksLeft = Math.max(1, learnWeeks - (fromWeek - 1));
    var capacity = 0;
    for (var wi = fromWeek; wi <= Math.max(fromWeek, learnWeeks); wi++) capacity += hours * TOPIC_SHARE[Math.min(4, 1 + Math.floor((wi - 1) / Math.max(1, learnWeeks / 4)))];
    var needed = required.reduce(function (s, q) { return s + q.left; }, 0);
    var trimmed = [];
    if (needed > capacity) {
      ['low', 'medium'].forEach(function (roi) {
        if (needed <= capacity) return;
        required = required.filter(function (q) {
          if (needed > capacity && q.roi === roi && q.group !== 'foundations') { needed -= q.left; trimmed.push(q.id); return false; }
          return true;
        });
      });
    }

    var weeks = keep.slice();
    var qi = 0, pool = required.concat(bonus);
    for (var n = fromWeek; n <= W; n++) {
      var wStart = OR.addDays(start, (n - 1) * 7);
      var inMock = n > learnWeeks;
      var guessPhase = inMock ? 5 : (pool[qi] ? pool[qi].phase : 4);
      if (!inMock && guessPhase === 5) guessPhase = 4;
      var share = TOPIC_SHARE[guessPhase];
      var cap = hours * share;
      var wk = { n: n, start: wStart, end: OR.addDays(wStart, 6), phase: guessPhase, hours: hours, topics: [], tracks: {} };
      // Mock weeks still take leftover topics (design questions, bonus) at the reduced share.
      while (cap > 0.25 && qi < pool.length) {
        var q = pool[qi];
        if (!inMock && q.group === 'advanced') break; // bonus waits for interview mode
        if (cap < 1 && q.left > cap + 1) break;      // never schedule a sliver; leave the slack
        // Absorb a remainder of up to an hour rather than spilling a fragment into next week.
        var take = q.left - cap <= 1 ? q.left : Math.min(q.left, cap);
        wk.topics.push({ id: q.id, hours: Math.max(0.5, Math.round(take * 2) / 2) });
        q.left -= take; cap -= take;
        if (q.left <= 0.25) qi++;
        else break;
      }
      if (wk.topics.length) wk.phase = inMock ? 5 : Math.min(4, OR.topicMeta(wk.topics[0].id).phase);
      var ph = wk.phase;
      wk.tracks = {
        practice: Math.max(3, Math.round((hours * (ph === 5 ? 0.35 : 0.3) * 60) / 40)),
        review: true,
        systemDesign: ph >= 3 ? (ph === 3 ? 'fundamentals' : ph === 4 ? 'case studies' : 'mock designs') : null,
        behavioral: ph >= 4 ? (ph === 5 ? 'stories + practice' : 'draft stories') : (n === Math.max(2, learnWeeks - 1) ? 'draft stories' : null),
        cs: ph === 3 || ph === 4 ? 'refresher' : null,
        mocks: ph === 5 ? 2 : ph === 4 && n % 2 === 0 ? 1 : 0,
        applications: n >= Math.min(APPS_START_WEEK, W) ? (ph === 5 ? 'follow up, negotiate' : 'send 5–10, ask for referrals') : null
      };
      wk.rest = settings.restDay;
      weeks.push(wk);
    }
    // Phases must be non-decreasing across the season.
    var maxPh = 1;
    weeks.forEach(function (w) { if (w.phase < maxPh) w.phase = maxPh; maxPh = w.phase; });
    return {
      version: 1, generatedAt: Date.now(), start: start, target: target, weeksTotal: W,
      learnWeeks: learnWeeks, appsStartWeek: Math.min(APPS_START_WEEK, W), weeklyHours: hours,
      level: settings.level, trimmed: trimmed,
      skippedBonus: pool.slice(qi).filter(function (q) { return q.group === 'advanced'; }).map(function (q) { return q.id; }),
      weeks: weeks
    };
  };

  P.ensure = function () {
    var st = OR.store.get();
    if (!st.plan && st.settings.onboarded) {
      var plan = P.generate(st.settings);
      OR.store.update(function (s) { s.plan = plan; });
    }
    return OR.store.get().plan;
  };
  P.rebalance = function () {
    var st = OR.store.get();
    var cur = P.weekIndex();
    var done = {};
    OR.curriculum.forEach(function (t) { if (P.topicDone(t.id)) done[t.id] = true; });
    var plan = P.generate(st.settings, { prev: st.plan, fromWeek: cur, done: done });
    OR.store.update(function (s) { s.plan = plan; });
    return plan;
  };

  /* ---------- Calendar ---------- */
  // 1-based week of the season for a date (clamped to the plan).
  P.weekIndex = function (date) {
    var plan = OR.store.get().plan; if (!plan) return 1;
    var d = OR.daysBetween(plan.start, date || OR.today());
    return OR.clamp(Math.floor(d / 7) + 1, 1, plan.weeks.length);
  };
  P.week = function (n) { var plan = OR.store.get().plan; return plan ? plan.weeks[(n || P.weekIndex()) - 1] : null; };
  P.daysLeft = function () { return Math.max(0, OR.daysBetween(OR.today(), OR.store.get().settings.targetDate)); };
  P.dayOfSeason = function () { var plan = OR.store.get().plan; return plan ? Math.max(1, OR.daysBetween(plan.start, OR.today()) + 1) : 1; };
  P.phase = function (id) { for (var i = 0; i < OR.phases.length; i++) if (OR.phases[i].id === id) return OR.phases[i]; return OR.phases[0]; };

  P.minutesBetween = function (from, to) {
    var a = OR.store.get().activity, m = 0;
    Object.keys(a).forEach(function (d) { if (d >= from && d <= to) m += a[d].min || 0; });
    return m;
  };
  P.weekMinutes = function (n) { var w = P.week(n); return w ? P.minutesBetween(w.start, w.end) : 0; };

  /* ---------- Streak ---------- */
  function active(a) { return a && ((a.min || 0) >= 5 || a.solved > 0 || (a.cards || 0) >= 5 || a.lessons > 0 || a.quiz > 0); }
  P.isRestDay = function (date) { return OR.parseDate(date).getDay() === OR.store.get().settings.restDay; };
  P.streak = function () {
    var acts = OR.store.get().activity, today = OR.today();
    var day = active(acts[today]) ? today : OR.addDays(today, -1), n = 0, guard = 0;
    while (guard++ < 2000) {
      if (active(acts[day])) n++;
      else if (!P.isRestDay(day)) break;
      day = OR.addDays(day, -1);
    }
    // Best streak across history.
    var days = Object.keys(acts).filter(function (d) { return active(acts[d]); }).sort();
    var best = 0, run = 0, prev = null;
    days.forEach(function (d) {
      if (prev) {
        var gap = OR.daysBetween(prev, d), ok = gap === 1;
        if (gap === 2 && P.isRestDay(OR.addDays(prev, 1))) ok = true;
        run = ok ? run + 1 : 1;
      } else run = 1;
      best = Math.max(best, run); prev = d;
    });
    return { days: n, today: active(acts[today]), best: Math.max(best, n) };
  };

  /* ---------- Topic content helpers ---------- */
  P.topic = function (id) { for (var i = 0; i < OR.topics.length; i++) if (OR.topics[i].id === id) return OR.topics[i]; return null; };
  P.cardIds = function (id) {
    var t = P.topic(id); if (!t || !t.flashcards) return [];
    return t.flashcards.map(function (c, i) { return id + ':' + (c.id || i); });
  };
  P.practiceNums = function (id) { var t = P.topic(id); return t && t.practice ? t.practice.map(function (p) { return p.lc; }) : []; };

  /* ---------- Mastery: practice solved + quiz score + flashcard retention ---------- */
  P.mastery = function (id) {
    var st = OR.store.get(), rec = st.topics[id] || {};
    var nums = P.practiceNums(id);
    var solved = nums.filter(function (n) { var p = st.problems[n]; return p && (p.status === 'solved' || p.status === 'clean'); }).length;
    var practice = nums.length ? Math.min(1, solved / Math.max(1, Math.ceil(nums.length * 0.7))) : 0;
    var quiz = rec.quiz && rec.quiz.best != null ? rec.quiz.best : 0;
    var retention = OR.store.retention(P.cardIds(id));
    var score = 0.4 * practice + 0.3 * quiz + 0.3 * retention;
    if (rec.done) score = Math.max(score, 0.5);
    return { score: score, practice: practice, quiz: quiz, retention: retention, solved: solved, total: nums.length };
  };
  P.masteryLevel = function (score) {
    if (score >= 0.7) return { id: 'mastered', label: 'Mastered' };
    if (score >= 0.35) return { id: 'practicing', label: 'Practicing' };
    if (score > 0) return { id: 'learning', label: 'Learning' };
    return { id: 'new', label: 'Not started' };
  };
  P.topicDone = function (id) { var rec = OR.store.get().topics[id] || {}; return !!rec.done || P.mastery(id).score >= 0.7; };

  /* ---------- Pace ---------- */
  P.pace = function () {
    var plan = OR.store.get().plan; if (!plan) return { state: 'on', behind: 0, ahead: 0, label: 'On pace' };
    var cur = P.weekIndex(), lastWeekOf = {};
    plan.weeks.forEach(function (w) { w.topics.forEach(function (t) { lastWeekOf[t.id] = w.n; }); });
    var behind = 0, ahead = 0;
    Object.keys(lastWeekOf).forEach(function (id) {
      var done = P.topicDone(id);
      if (lastWeekOf[id] < cur && !done) behind++;
      if (lastWeekOf[id] > cur && done) ahead++;
    });
    if (behind > 0) return { state: 'behind', behind: behind, ahead: ahead, label: OR.plural(behind, 'topic') + ' behind' };
    if (ahead > 0) return { state: 'ahead', behind: 0, ahead: ahead, label: OR.plural(ahead, 'topic') + ' ahead' };
    return { state: 'on', behind: 0, ahead: 0, label: 'On pace' };
  };
  // Cumulative share of planned topics finished, planned vs real, per week (for the Season Chart pace lines).
  P.paceSeries = function () {
    var plan = OR.store.get().plan; if (!plan) return { planned: [], real: [] };
    var lastWeekOf = {}, total = 0;
    plan.weeks.forEach(function (w) { w.topics.forEach(function (t) { if (!lastWeekOf[t.id]) total++; lastWeekOf[t.id] = w.n; }); });
    var planned = [], real = [], cur = P.weekIndex(), st = OR.store.get();
    plan.weeks.forEach(function (w) {
      var p = 0, r = 0;
      Object.keys(lastWeekOf).forEach(function (id) {
        if (lastWeekOf[id] <= w.n) p++;
        var rec = st.topics[id];
        if (rec && rec.doneAt && rec.doneAt <= w.end) r++;
      });
      planned.push(total ? p / total : 0);
      if (w.n <= cur) real.push(total ? r / total : 0);
    });
    return { planned: planned, real: real };
  };

  P.markTopicDone = function (id, done) {
    OR.store.update(function (s) {
      var rec = s.topics[id] = s.topics[id] || {};
      rec.done = !!done;
      rec.doneAt = done ? OR.today() : null;
    });
    if (done) OR.store.logActivity('lessons', 1);
  };

  /* ---------- Tonight's three items ---------- */
  var MIN_BY_DIFF = { Easy: 20, Medium: 35, Hard: 50 };
  P.problemByNum = function (n) { for (var i = 0; i < OR.problems.length; i++) if (OR.problems[i].lc === +n) return OR.problems[i]; return null; };

  P.dueCardCount = function () {
    var ids = P.allCardIds(), st = OR.store.get(), today = OR.today(), due = 0, fresh = 0, limit = st.settings.newCardsPerDay;
    var newToday = (st.activity[today] && st.activity[today].newCards) || 0;
    ids.forEach(function (id) { var c = st.cards[id]; if (!c) fresh++; else if (c.due && c.due <= today) due++; });
    return { due: due, fresh: Math.max(0, Math.min(fresh, limit - newToday)), total: ids.length };
  };
  P.allCardIds = function () {
    var ids = [];
    OR.topics.forEach(function (t) { (t.flashcards || []).forEach(function (c, i) { ids.push(t.id + ':' + (c.id || i)); }); });
    OR.flashcards.forEach(function (c) { ids.push(c.id); });
    return ids;
  };

  // The topic to study next: the first unfinished topic of this week, else the next unfinished one in the plan.
  P.currentTopic = function () {
    var plan = OR.store.get().plan; if (!plan) return null;
    var cur = P.weekIndex();
    for (var n = 1; n <= plan.weeks.length; n++) {
      var w = plan.weeks[n - 1];
      if (n < cur - 1) continue;
      for (var i = 0; i < w.topics.length; i++) if (!P.topicDone(w.topics[i].id)) return w.topics[i].id;
    }
    return null;
  };

  P.todayItems = function () {
    var items = [], st = OR.store.get(), today = OR.today(), act = st.activity[today] || {};
    // 1. Warm up: due flashcards, else a cold re-solve from the review queue.
    var cards = P.dueCardCount(), dueReviews = OR.store.reviewDue();
    if (cards.due + cards.fresh > 0) {
      var n = cards.due + Math.min(cards.fresh, 10);
      items.push({ kind: 'cards', title: 'Review ' + OR.plural(n, 'flashcard'), sub: cards.due ? cards.due + ' due, ' + Math.min(cards.fresh, 10) + ' new' : 'New cards from your topics', minutes: Math.max(5, Math.ceil(n * 0.4)), href: '#/flashcards' });
    } else if (dueReviews.length) {
      var rp = P.problemByNum(dueReviews[0]);
      items.push({ kind: 'review', title: 'Re-solve ' + (rp ? rp.lc + '. ' + rp.title : 'LC ' + dueReviews[0]) + ' cold', sub: OR.plural(dueReviews.length, 'problem') + ' due for review', minutes: 25, href: '#/review', diff: rp && rp.difficulty });
    } else if ((act.cards || 0) > 0) {
      items.push({ kind: 'cards', title: 'Flashcards done for today', sub: OR.plural(act.cards, 'card') + ' reviewed', minutes: 0, href: '#/flashcards', done: true });
    }
    // 2. Learn: the current topic, or interview-mode work late in the season.
    var tid = P.currentTopic(), meta = tid && OR.topicMeta(tid), week = P.week();
    if (meta) {
      var rec = st.topics[tid] || {}, read = rec.sections ? Object.keys(rec.sections).length : 0;
      var place = st.place && st.place.hash && st.place.hash.indexOf('#/topic/' + tid) === 0 ? st.place : null;
      items.push({ kind: 'lesson', title: (read ? 'Continue: ' : 'Learn: ') + meta.title, sub: place && place.section ? 'Pick up at “' + place.section + '”' : meta.blurb, minutes: read ? 30 : 40, href: place ? place.hash : '#/topic/' + tid, intent: place ? 'restore' : 'top', topic: tid });
    } else if (week && week.phase === 5) {
      items.push({ kind: 'mock', title: 'Run a 45-minute mock interview', sub: 'A medium problem from your weakest pattern', minutes: 45, href: '#/mock' });
    }
    // 3. Practice: the easiest unsolved problem from the current topic's set.
    var pick = null;
    if (tid) {
      var nums = P.practiceNums(tid);
      var cands = nums.map(P.problemByNum).filter(Boolean).filter(function (p) { var r = st.problems[p.lc]; return !r || (r.status !== 'solved' && r.status !== 'clean'); });
      var order = { Easy: 0, Medium: 1, Hard: 2 };
      cands.sort(function (a, b) { return order[a.difficulty] - order[b.difficulty]; });
      pick = cands[0];
    }
    if (!pick && OR.problems.length) {
      var p2 = OR.problems.filter(function (p) { var r = st.problems[p.lc]; return !r || (r.status !== 'solved' && r.status !== 'clean'); });
      pick = p2.find(function (p) { return p.topic === tid; }) || p2.find(function (p) { return p.difficulty === 'Easy'; }) || p2[0];
    }
    if (pick) items.push({ kind: 'practice', title: 'Solve ' + pick.lc + '. ' + pick.title, sub: (OR.topicMeta(pick.topic) || {}).title || 'Practice', minutes: MIN_BY_DIFF[pick.difficulty] || 30, href: '#/problem/' + pick.lc, diff: pick.difficulty, num: pick.lc });
    else if (week && week.tracks.systemDesign) items.push({ kind: 'sd', title: 'System design: ' + week.tracks.systemDesign, sub: 'One concept or case study tonight', minutes: 30, href: '#/system-design' });
    // Always end with exactly three things when the season allows.
    if (items.length < 3 && week && week.tracks.behavioral) items.push({ kind: 'behavioral', title: 'Write one STAR story', sub: 'Your story bank feeds the behavioral round', minutes: 20, href: '#/behavioral/stories' });
    if (items.length < 3 && week && week.tracks.applications) items.push({ kind: 'apply', title: 'Send one tailored application', sub: 'Track it in the pipeline', minutes: 25, href: '#/pipeline' });
    if (items.length < 3) items.push({ kind: 'cards', title: 'Skim a cheat sheet', sub: 'Patterns to templates, in one page', minutes: 10, href: '#/cheatsheets' });
    return items.slice(0, 3);
  };

  OR.counts.flashcards = function () { var c = P.dueCardCount(); return c.due; };
  OR.counts.review = function () { return OR.store.reviewDue().length; };

  // Topics are searchable before their lesson files exist.
  OR.addSearch(function () {
    return OR.curriculum.map(function (t) { return { group: 'Topics', title: t.title, sub: t.blurb, icon: 'topics', href: '#/topic/' + t.id, keywords: t.id.replace(/-/g, ' ') }; });
  });
})();
