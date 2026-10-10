/* Offer Ready: flashcards (#/flashcards, #/flashcards/:deck).
   One spaced-repetition deck built from every topic's cards plus the global decks (OR.flashcards,
   grouped by card.deck). Due cards first, then new ones up to the daily new-card limit.
   Keys: Space or Enter flips, 1 to 4 grades (Again, Hard, Good, Easy). */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;
  var GRADES = [[1, 'Again'], [2, 'Hard'], [3, 'Good'], [4, 'Easy']];
  var DECK_NAMES = { 'system-design': 'System design', behavioral: 'Behavioral', cs: 'CS fundamentals', career: 'Career' };

  // Every card as { id, deck, deckName, front, back }.
  OR.allCards = function () {
    var out = [];
    OR.topics.forEach(function (t) {
      var name = (OR.topicMeta(t.id) || {}).title || t.id;
      (t.flashcards || []).forEach(function (c, i) { out.push({ id: t.id + ':' + (c.id || i), deck: t.id, deckName: name, front: c.front, back: c.back }); });
    });
    OR.flashcards.forEach(function (c) { out.push({ id: c.id, deck: c.deck || 'general', deckName: DECK_NAMES[c.deck] || c.deck || 'General', front: c.front, back: c.back }); });
    return out;
  };
  // Review order: overdue cards first (most overdue, then weakest last grade), then new cards. New cards you haven't been
  // shown yet come before ones you flipped and skipped, and are spread across decks instead of walking one deck from the top.
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shownMap() { var m = OR.store.get().drafts['fc:shown']; return m && typeof m === 'object' ? m : {}; }
  function markShown(id) {
    var today = OR.today(), m = shownMap();
    if (m[id] === today) return;
    OR.store.update(function (s) { var x = s.drafts['fc:shown'] = s.drafts['fc:shown'] && typeof s.drafts['fc:shown'] === 'object' ? s.drafts['fc:shown'] : {}; x[id] = today; });
  }
  function orderDue(list, cards, today) {
    return list.slice().sort(function (a, b) {
      var ca = cards[a.id], cb = cards[b.id];
      return (ca.due < cb.due ? -1 : ca.due > cb.due ? 1 : 0) || ((ca.lastGrade || 0) - (cb.lastGrade || 0)) || (hash(a.id + today) - hash(b.id + today));
    });
  }
  function orderFresh(list, today) {
    var seen = shownMap(), byDeck = {}, decks = [];
    list.slice().sort(function (a, b) { return ((seen[a.id] ? 1 : 0) - (seen[b.id] ? 1 : 0)) || (hash(a.id + today) - hash(b.id + today)); }).forEach(function (c) {
      if (!byDeck[c.deck]) { byDeck[c.deck] = []; decks.push(c.deck); }
      byDeck[c.deck].push(c);
    });
    decks.sort(function (a, b) { return hash(a + today) - hash(b + today); });
    var out = [], more = true;
    for (var r = 0; more; r++) { more = false; decks.forEach(function (d) { if (byDeck[d][r]) { out.push(byDeck[d][r]); more = true; } }); }
    return out;
  }
  function ago(days) { return days <= 0 ? 'again today' : days === 1 ? '1 day' : days < 30 ? days + ' days' : Math.round(days / 30) + ' mo'; }

  OR.views.flashcards = {
    title: function () { return 'Flashcards'; },
    render: function (main, ctx) {
      var deck = ctx.params.deck || '', cards = OR.allCards(), st = OR.store.get(), today = OR.today();
      var decks = []; cards.forEach(function (c) { if (!decks.some(function (d) { return d.id === c.deck; })) decks.push({ id: c.deck, name: c.deckName }); });
      var pool = deck ? cards.filter(function (c) { return c.deck === deck; }) : cards;
      var newLeft = Math.max(0, st.settings.newCardsPerDay - ((st.activity[today] || {}).newCards || 0));
      var due = orderDue(pool.filter(function (c) { return OR.store.cardIsDue(c.id, today); }), st.cards, today);
      var fresh = orderFresh(pool.filter(function (c) { return OR.store.cardIsNew(c.id); }), today).slice(0, newLeft);
      var queue = due.concat(fresh), done = 0, flipped = false;

      main.innerHTML = '<div class="page fc">' +
        '<div class="page-head"><div><h1 class="page-title display">Flashcards</h1><p class="page-lede" id="fc-sum"></p></div>' +
          (decks.length ? '<label class="fc-deck"><span class="field-label">Deck</span><select class="select" id="fc-deck"><option value="">All decks (' + cards.length + ')</option>' + decks.map(function (d) {
            return '<option value="' + esc(d.id) + '"' + (d.id === deck ? ' selected' : '') + '>' + esc(d.name) + ' (' + cards.filter(function (c) { return c.deck === d.id; }).length + ')</option>';
          }).join('') + '</select></label>' : '') + '</div>' +
        '<div id="fc-stage"></div></div>';
      var stage = OR.$('#fc-stage');

      function summary() {
        var left = queue.length - done;
        OR.$('#fc-sum').textContent = !cards.length ? 'Cards arrive with each topic lesson and feed one spaced-repetition deck.'
          : left ? left + ' to go today: ' + Math.max(0, due.length - done) + ' due' + (fresh.length ? ', ' + Math.max(0, Math.min(fresh.length, queue.length - done)) + ' new at most' : '') + '. Space flips; 1 to 4 grades.'
          : 'Done for today.';
      }
      function paint(focus) {
        summary();
        var c = queue[done];
        if (!cards.length) { stage.innerHTML = '<div class="empty"><h2 class="empty-title">No cards yet</h2><p>Every topic lesson ends with 5 to 15 cards. They land here as lessons are added, and the deck schedules each one so you see it just before you’d forget it.</p><a class="btn" href="#/topics">Browse topics</a></div>'; return; }
        if (!c) {
          var next = pool.map(function (x) { return st.cards[x.id] && st.cards[x.id].due; }).filter(function (d) { return d && d > today; }).sort()[0];
          stage.innerHTML = '<div class="empty fc-done"><h2 class="empty-title">' + (done ? 'That’s the deck for today' : 'Nothing due') + '</h2><p>' + (done ? OR.plural(done, 'card') + ' reviewed. ' : '') +
            (next ? 'The next card is due ' + (next === OR.addDays(today, 1) ? 'tomorrow' : OR.fmtDate(next, { weekday: 'long', month: 'short', day: 'numeric' })) + '.' : 'Every card here has been seen; new ones arrive with new lessons.') +
            (newLeft === 0 && pool.some(function (x) { return OR.store.cardIsNew(x.id); }) ? ' You’ve hit today’s new-card limit (' + st.settings.newCardsPerDay + '); change it in Settings.' : '') + '</p></div>';
          return;
        }
        var isNew = OR.store.cardIsNew(c.id);
        stage.innerHTML = '<article class="fc-card" data-flipped="' + flipped + '" aria-roledescription="flashcard">' +
          '<p class="fc-meta"><span>' + esc(c.deckName) + '</span><span>' + (isNew ? 'New' : 'Review') + '</span><span class="num">' + (done + 1) + ' / ' + queue.length + '</span></p>' +
          '<div class="fc-face prose" id="fc-front">' + OR.md(c.front) + '</div>' +
          (flipped ? '<div class="fc-face fc-back prose" id="fc-back" tabindex="-1">' + OR.md(c.back) + '</div>' : '') +
          '</article>' +
          (flipped
            ? '<div class="fc-grades" role="group" aria-label="How well did you know it?">' + GRADES.map(function (g) {
                return '<button class="btn fc-grade" type="button" data-grade="' + g[0] + '"><kbd>' + g[0] + '</kbd><span>' + g[1] + '</span><span class="faint num">' + ago(OR.store.previewCard(c.id, g[0])) + '</span></button>';
              }).join('') + '</div>'
            : '<div class="fc-grades"><button class="btn btn-primary btn-lg fc-flip" type="button" data-flip><kbd>Space</kbd>Show answer</button></div>');
        if (focus) { var t = flipped ? OR.$('#fc-back') : OR.$('[data-flip]'); if (t) t.focus({ preventScroll: true }); }
      }
      function flip() { if (!queue[done] || flipped) return; flipped = true; markShown(queue[done].id); paint(true); }
      function grade(g) {
        var c = queue[done]; if (!c || !flipped) return;
        var r = OR.store.gradeCard(c.id, g);
        if (g === 1) queue.push(c); // relearn it before the session ends
        done++; flipped = false; st = OR.store.get();
        OR.announce(GRADES[g - 1][1] + '. ' + (g === 1 ? 'It comes back this session.' : 'Next review in ' + ago(r.interval) + '.'));
        paint(true);
      }
      stage.addEventListener('click', function (e) {
        if (e.target.closest('[data-flip]')) flip();
        var g = e.target.closest('[data-grade]'); if (g) grade(+g.dataset.grade);
      });
      function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || OR.$('dialog[open]')) return;
        if ((e.key === ' ' || e.key === 'Enter') && !flipped && !(e.target.tagName === 'BUTTON' && !e.target.hasAttribute('data-flip'))) { e.preventDefault(); flip(); }
        else if (flipped && /^[1-4]$/.test(e.key)) { e.preventDefault(); grade(+e.key); }
      }
      document.addEventListener('keydown', onKey);
      var sel = OR.$('#fc-deck');
      if (sel) sel.addEventListener('change', function () { OR.go(sel.value ? '#/flashcards/' + encodeURIComponent(sel.value) : '#/flashcards'); });
      paint(false);
      return function () { document.removeEventListener('keydown', onKey); };
    }
  };

  OR.addSearch(function () {
    return OR.allCards().slice(0, 600).map(function (c) {
      return { group: 'Flashcards', title: String(c.front).replace(/[`*_#>]/g, '').slice(0, 90), sub: c.deckName, icon: 'cards', href: '#/flashcards/' + encodeURIComponent(c.deck) };
    });
  });
})();
