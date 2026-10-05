/* Offer Ready: resource library (#/resources).
   Every link from the owner's DSA-Kit README (data/resources.js, generated), searchable and
   filterable, with a persisted "done" tick. Done state lives in store.resources[url] = true, so
   a link listed under two headings is one tick. Filters live in the query string. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  var TYPES = [['', 'Any type'], ['video', 'Video'], ['book', 'Book'], ['course', 'Course'], ['sheet', 'Sheet or list'], ['tool', 'Tool'], ['community', 'Community'], ['article', 'Article'], ['repo', 'Repo'], ['other', 'Other']];
  var COSTS = [['', 'Any cost'], ['free', 'Free'], ['paid', 'Paid'], ['unknown', 'Cost unknown']];
  var LEVELS = [['', 'Any level'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced'], ['all', 'All levels']];
  var LABEL = {};
  [TYPES, COSTS, LEVELS].forEach(function (l) { l.forEach(function (o) { LABEL[o[0]] = o[1]; }); });
  LABEL.sheet = 'Sheet'; LABEL.all = 'All levels'; LABEL.unknown = 'Cost unknown';

  function categories() {
    var seen = [];
    OR.resources.forEach(function (r) { if (seen.indexOf(r.category) < 0) seen.push(r.category); });
    return seen;
  }
  function isDone(st, r) { return !!(st.resources || {})[r.url]; }
  // Distinct URLs: [done, total] for a list of entries.
  function tally(list, st) {
    var seen = {}, d = 0, n = 0;
    list.forEach(function (r) { if (seen[r.url]) return; seen[r.url] = 1; n++; if (isDone(st, r)) d++; });
    return [d, n];
  }
  function matches(r, f) {
    if (f.cat && r.category !== f.cat) return false;
    if (f.type && r.type !== f.type) return false;
    if (f.cost && r.cost !== f.cost) return false;
    if (f.level && r.level !== f.level) return false;
    if (f.start && !r.start) return false;
    if (f.q) {
      var hay = (r.title + ' ' + r.note + ' ' + r.category + ' ' + r.group + ' ' + r.type + ' ' + r.url).toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; })) return false;
    }
    return true;
  }
  function options(list, cur) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === (cur || '') ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }

  function rowHTML(r, st) {
    var done = isDone(st, r), id = 'rs-' + r.id;
    return '<li class="rs-row' + (r.start ? ' is-start' : '') + '" data-url="' + esc(r.url) + '">' +
      '<input class="rs-check" type="checkbox" id="' + id + '" data-url="' + esc(r.url) + '"' + (done ? ' checked' : '') + ' aria-label="Done: ' + esc(r.title) + '">' +
      '<div class="rs-main">' +
        '<div class="rs-line"><a class="rs-link" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) + OR.icon('external', 'icon-sm') + '<span class="sr-only"> (opens in a new tab)</span></a>' +
          (r.start ? '<span class="chip chip-accent rs-start">' + OR.icon('star', 'icon-sm') + 'Start here</span>' : '') + '</div>' +
        '<p class="rs-note">' + esc(r.note) + '</p>' +
        (r.flag ? '<p class="rs-flag">' + OR.icon('flag', 'icon-sm') + '<span>' + esc(r.flag) + '</span></p>' : '') +
      '</div>' +
      '<div class="rs-tags"><span class="chip">' + esc(LABEL[r.type]) + '</span><span class="chip rs-cost" data-cost="' + r.cost + '">' + esc(LABEL[r.cost]) + '</span><span class="chip">' + esc(LABEL[r.level]) + '</span></div>' +
    '</li>';
  }

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function sectionHTML(cat, list, st) {
    var t = tally(list, st), html = '', g = null;
    list.forEach(function (r) {
      if (r.group !== g) { g = r.group; if (g) html += '</ul><h3 class="rs-group">' + esc(g) + '</h3><ul class="rs-list">'; }
      html += rowHTML(r, st);
    });
    return '<section class="rs-cat" aria-labelledby="rc-' + slug(cat) + '"><div class="rs-cat-head"><h2 class="rs-cat-title" id="rc-' + slug(cat) + '">' + esc(cat) + '</h2>' +
      '<span class="rs-cat-count num" data-cat-count="' + esc(cat) + '">' + t[0] + '<span class="faint">/' + t[1] + ' done</span></span></div><ul class="rs-list">' + html + '</ul></section>';
  }

  OR.views.resources = {
    title: function () { return 'Resources'; },
    render: function (main, ctx) {
      var all = OR.resources, cats = categories();
      var f = { q: ctx.query.q || '', cat: ctx.query.cat || '', type: ctx.query.type || '', cost: ctx.query.cost || '', level: ctx.query.level || '', start: ctx.query.start ? '1' : '' };
      var st0 = OR.store.get(), t0 = tally(all, st0);
      main.innerHTML = '<div class="page rs-page">' +
        '<div class="page-head"><div><h1 class="page-title display">Resources</h1><p class="page-lede">Every link from your DSA Kit README, tagged by type, cost and level. Links open in a new tab and are not checked offline; tick one when you have used it.</p></div>' +
          '<dl class="pb-tally"><div><dt>Done</dt><dd class="num" id="rs-total">' + t0[0] + '<span class="faint">/' + t0[1] + '</span></dd></div></dl></div>' +
        '<form class="pb-filters rs-filters" role="search" onsubmit="return false">' +
          '<label class="pb-search"><span class="sr-only">Search resources</span>' + OR.icon('search', 'icon-sm') + '<input class="input" type="search" name="q" placeholder="Search title, note or topic" value="' + esc(f.q) + '" autocomplete="off"></label>' +
          '<label><span class="sr-only">Category</span><select class="select" name="cat"><option value="">All categories</option>' + cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === f.cat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
          '<label><span class="sr-only">Type</span><select class="select" name="type">' + options(TYPES, f.type) + '</select></label>' +
          '<label><span class="sr-only">Cost</span><select class="select" name="cost">' + options(COSTS, f.cost) + '</select></label>' +
          '<label><span class="sr-only">Level</span><select class="select" name="level">' + options(LEVELS, f.level) + '</select></label>' +
          '<label class="rs-only"><input type="checkbox" name="start"' + (f.start ? ' checked' : '') + '> Start here only</label>' +
        '</form>' +
        '<div class="pb-count row-between"><p aria-live="polite" id="rs-count"></p><button class="btn btn-sm btn-ghost" type="button" id="rs-clear">Clear filters</button></div>' +
        '<div id="rs-body"></div>' +
        '<p class="empty" id="rs-empty" hidden><span class="empty-title">Nothing matches.</span><span>Try fewer words or clear a filter.</span><button class="btn btn-sm" type="button" data-clear>Clear filters</button></p></div>';

      var form = OR.$('.rs-filters', main), body = OR.$('#rs-body', main);
      function apply() {
        var st = OR.store.get(), rows = all.filter(function (r) { return matches(r, f); });
        body.innerHTML = cats.map(function (c) {
          var l = rows.filter(function (r) { return r.category === c; });
          return l.length ? sectionHTML(c, l, st) : '';
        }).join('').replace(/<ul class="rs-list"><\/ul>/g, '');
        var t = tally(rows, st), nCats = new Set(rows.map(function (r) { return r.category; })).size;
        OR.$('#rs-count', main).textContent = rows.length === all.length
          ? 'Showing all ' + rows.length + ' links in ' + nCats + ' categories, ' + t[0] + ' of ' + t[1] + ' distinct done.'
          : 'Showing ' + rows.length + ' of ' + all.length + ' links, ' + t[0] + ' of ' + t[1] + ' distinct done.';
        OR.$('#rs-empty', main).hidden = rows.length > 0;
        OR.$('#rs-clear', main).hidden = !Object.keys(f).some(function (k) { return f[k]; });
        OR.setQuery(f);
      }
      // Refresh counts and duplicate ticks in place, so the focused checkbox keeps focus.
      function counts() {
        var st = OR.store.get(), t = tally(all, st);
        OR.$('#rs-total', main).innerHTML = t[0] + '<span class="faint">/' + t[1] + '</span>';
        OR.$$('[data-cat-count]', main).forEach(function (el) {
          var c = el.dataset.catCount, tt = tally(all.filter(function (r) { return r.category === c && matches(r, f); }), st);
          el.innerHTML = tt[0] + '<span class="faint">/' + tt[1] + ' done</span>';
        });
      }
      var applySoon = OR.debounce(apply, 120);
      form.addEventListener('input', function (e) {
        var n = e.target.name; if (!n) return;
        f[n] = n === 'start' ? (e.target.checked ? '1' : '') : e.target.value;
        n === 'q' ? applySoon() : apply();
      });
      function clear() { OR.go('#/resources', 'top'); }
      OR.$('#rs-clear', main).addEventListener('click', clear);
      OR.$('#rs-empty [data-clear]', main).addEventListener('click', clear);
      body.addEventListener('change', function (e) {
        var cb = e.target.closest('.rs-check'); if (!cb) return;
        var url = cb.dataset.url, on = cb.checked;
        OR.store.update(function (s) { if (on) s.resources[url] = true; else delete s.resources[url]; });
        OR.$$('.rs-check', body).forEach(function (x) { if (x.dataset.url === url) x.checked = on; });
        counts();
        var r = all.filter(function (x) { return x.url === url; })[0];
        OR.announce(r.title + (on ? ' marked done.' : ' marked not done.'));
      });
      apply();
    }
  };

  OR.addSearch(function () {
    return (OR.resources || []).map(function (r) {
      return { group: 'Resources', title: r.title, sub: r.category + ' · ' + LABEL[r.type] + ' · ' + LABEL[r.cost] + ' (opens in a new tab)', icon: 'library',
        run: function () { window.open(r.url, '_blank', 'noopener,noreferrer'); }, keywords: r.note + ' ' + r.group + ' ' + r.url, boost: r.start ? 3 : 0 };
    });
  });
})();
