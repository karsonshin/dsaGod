/* Offer Ready: Tech pulse (#/tech).
   Two parts. (1) The digest: short summaries of current tech articles, each written from the cited article (data/tech/*.js, OR.tech.items),
   with why it matters, the terms a new grad may not know, and how it connects to interview topics. It is as fresh as the last time
   it was written, and says so. (2) Live headlines from the Hacker News front page, fetched in the browser when online (one
   request, cached for an hour, shown from the cache offline). Headlines only: they are not summaries and nothing here is rewritten. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, HN = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30', CACHE = 'offer-ready:hn', HOUR = 3600000;

  function items() { return ((OR.tech && OR.tech.items) || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }); }
  function domain(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function safeUrl(u, fallback) { return /^https?:\/\//i.test(u || '') ? u : fallback; }
  function ago(ms) { var m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }
  function cached() { try { return JSON.parse(localStorage.getItem(CACHE)); } catch (e) { return null; } }

  function cardHTML(e) {
    return '<article class="tp-news" id="n-' + esc(e.id) + '" data-area="' + esc(e.area) + '">' +
      '<p class="tn-meta"><span class="chip">' + esc(e.area) + '</span><span class="faint">' + esc(e.source) + ' · ' + esc(OR.fmtDate(e.date, { month: 'short', day: 'numeric', year: 'numeric' })) + '</span></p>' +
      '<h3 class="tn-title">' + esc(e.title) + '</h3><p class="tn-sum">' + OR.inline(e.summary) + '</p>' +
      '<p class="tn-why"><strong>Why it matters.</strong> ' + OR.inline(e.why) + '</p>' +
      (e.terms && e.terms.length ? '<dl class="tn-terms">' + e.terms.map(function (t) { return '<div><dt>' + esc(t[0]) + '</dt><dd>' + OR.inline(t[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      '<p class="tn-int"><strong>Interview angle.</strong> ' + OR.inline(e.interview) + '</p>' +
      '<p class="tn-link"><a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">Read the original at ' + esc(domain(e.url)) + OR.icon('external', 'icon-sm') + '</a></p></article>';
  }

  OR.views.tech = {
    title: function () { return 'Tech pulse'; },
    render: function (main) {
      var all = items(), areas = {}, state = { area: '', q: '' };
      all.forEach(function (e) { areas[e.area] = (areas[e.area] || 0) + 1; });
      var asOf = all.length ? all[0].date : '';
      main.innerHTML = '<div class="page tn"><div class="page-head"><div><h1 class="page-title display">Tech pulse</h1>' +
        '<p class="page-lede">What is happening in tech right now, in short summaries of real articles, plus live headlines. Use it to hold a conversation about the industry in an interview, not to memorize news.</p></div></div>' +
        '<section aria-labelledby="tn-d"><h2 class="section-title" id="tn-d">Digest' + (all.length ? ' <span class="faint num">' + all.length + ' articles, newest ' + esc(OR.fmtDate(asOf, { month: 'short', day: 'numeric' })) + '</span>' : '') + '</h2>' +
        '<p class="muted">Each summary was written from the article it links to, and the date is the article’s. A summary can only be as current as the day it was written, so open the original for the latest. Ask your coding assistant to refresh this page when you want a new digest.</p>' +
        '<div class="tn-controls"><label class="al-search"><span class="sr-only">Search the digest</span>' + OR.icon('search', 'icon-sm') + '<input class="input" type="search" id="tn-q" placeholder="Search: postgres, agents, quantization…"></label><div class="al-cats" id="tn-areas" role="group" aria-label="Area"></div></div>' +
        '<div id="tn-list"></div></section>' +
        '<section class="section" aria-labelledby="tn-l"><h2 class="section-title" id="tn-l">Live headlines <span class="faint">Hacker News front page</span></h2>' +
        '<p class="muted">Headlines only, fetched from the Hacker News search service when you are online. These are not summaries; open a story to read it. <button class="btn btn-sm btn-ghost" type="button" id="tn-refresh">Refresh</button> <span class="faint" id="tn-when"></span></p><ol class="tn-hn" id="tn-hn"></ol></section></div>';
      var list = OR.$('#tn-list', main), areasEl = OR.$('#tn-areas', main);

      function paintAreas() {
        areasEl.innerHTML = ['<button class="chip" type="button" data-a="" aria-pressed="' + (!state.area) + '">All (' + all.length + ')</button>'].concat(Object.keys(areas).sort().map(function (a) {
          return '<button class="chip" type="button" data-a="' + esc(a) + '" aria-pressed="' + (state.area === a) + '">' + esc(a) + ' (' + areas[a] + ')</button>'; })).join('');
      }
      function paint() {
        var q = state.q.toLowerCase().split(/\s+/).filter(Boolean);
        var shown = all.filter(function (e) {
          if (state.area && e.area !== state.area) return false;
          var hay = (e.title + ' ' + e.summary + ' ' + e.why + ' ' + e.source + ' ' + (e.terms || []).map(function (t) { return t[0]; }).join(' ')).toLowerCase();
          return q.every(function (w) { return hay.indexOf(w) >= 0; });
        });
        list.innerHTML = shown.length ? shown.map(cardHTML).join('') : '<p class="empty">' + (all.length ? 'Nothing matches that.' : 'No articles are loaded yet.') + '</p>';
      }
      areasEl.addEventListener('click', function (ev) { var b = ev.target.closest('[data-a]'); if (!b) return; state.area = b.dataset.a; paintAreas(); paint(); });
      OR.$('#tn-q', main).addEventListener('input', OR.debounce(function (ev) { state.q = ev.target.value.trim(); paint(); }, 120));
      paintAreas(); paint();

      /* Live headlines */
      var hn = OR.$('#tn-hn', main), when = OR.$('#tn-when', main), btn = OR.$('#tn-refresh', main), alive = true;
      function showHits(c, note) {
        hn.innerHTML = c.hits.map(function (h) {
          var u = safeUrl(h.url, 'https://news.ycombinator.com/item?id=' + encodeURIComponent(h.objectID));
          return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(h.title) + '</a> <span class="faint">' + esc(domain(safeUrl(h.url, ''))) + '</span>' +
            '<span class="faint num"> · ' + (h.points || 0) + ' points · <a href="https://news.ycombinator.com/item?id=' + esc(h.objectID) + '" target="_blank" rel="noopener noreferrer">' + (h.num_comments || 0) + ' comments</a></span></li>';
        }).join('');
        when.textContent = (note || '') + 'Updated ' + ago(c.at) + '.';
      }
      function fetchHn(force) {
        var c = cached();
        if (c && !force && Date.now() - c.at < HOUR) { showHits(c); return; }
        if (c) showHits(c, 'Showing saved headlines while loading. ');
        when.textContent = c ? when.textContent : 'Loading…'; btn.disabled = true;
        fetch(HN, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
          var fresh = { at: Date.now(), hits: (j.hits || []).filter(function (h) { return h.title; }).slice(0, 30).map(function (h) { return { title: h.title, url: h.url, points: h.points, num_comments: h.num_comments, objectID: h.objectID }; }) };
          try { localStorage.setItem(CACHE, JSON.stringify(fresh)); } catch (e) { /* storage blocked */ }
          if (alive) showHits(fresh);
        }).catch(function () {
          if (!alive) return;
          if (c) showHits(c, 'Could not reach the service, so these are saved headlines. '); else { hn.innerHTML = ''; when.textContent = 'Could not load live headlines (offline, or the service is down).'; }
        }).then(function () { if (alive) btn.disabled = false; });
      }
      btn.addEventListener('click', function () { fetchHn(true); });
      fetchHn(false);
      return function () { alive = false; };
    }
  };

  OR.addSearch(function () {
    return items().map(function (e) { return { group: 'Tech pulse', title: e.title, sub: e.area + ' · ' + e.source, icon: 'flag', href: '#/tech', keywords: (e.terms || []).map(function (t) { return t[0]; }).join(' ') }; });
  });
})();
