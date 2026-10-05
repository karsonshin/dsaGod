/* Offer Ready: Career & offers. Index (#/career) and pages (#/career/:id). Content in data/career.js.
   Persists inside the existing `drafts` namespace: career:offers, career:fields, career:checks. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc, C = OR.career;
  var MAX_OFFERS = 4;

  /* ---------- drafts ---------- */
  function draft(key, def) { var d = OR.store.get().drafts; return d && d[key] !== undefined ? d[key] : def; }
  function save(key, val) { OR.store.update(function (s) { s.drafts = s.drafts || {}; s.drafts[key] = val; }); }
  function blankOffer(i) { return { name: 'Offer ' + String.fromCharCode(65 + i), base: '', bonusPct: '', signOn: '', equity: '', schedule: 'even', refreshPct: '', growthPct: '0', note: '' }; }
  function loadOffers() {
    var o = draft('career:offers', null);
    if (!Array.isArray(o) || !o.length) return [blankOffer(0), blankOffer(1)];
    return o.slice(0, MAX_OFFERS).map(function (x, i) { return Object.assign(blankOffer(i), x); });
  }
  function money(v) { return Math.round(v).toLocaleString(undefined, { maximumFractionDigits: 0 }); }

  /* ---------- fill-in templates ---------- */
  function tplKeys(text) { var k = [], re = /\{\{([^}]+)\}\}/g, m; while ((m = re.exec(text))) if (k.indexOf(m[1]) < 0) k.push(m[1]); return k; }
  function tplFill(text, vals, html) {
    return text.replace(/\{\{([^}]+)\}\}/g, function (_, k) {
      var v = (vals[k] || '').trim();
      if (html) return v ? '<mark class="cr-fill">' + esc(v) + '</mark>' : '<span class="cr-blank">[' + esc(k) + ']</span>';
      return v || '[' + k + ']';
    });
  }
  function scriptHTML(it, vals) {
    var keys = tplKeys(it.text);
    return '<article class="cr-script" data-script="' + esc(it.id) + '"><header><div><h3>' + esc(it.title) + '</h3>' + (it.note ? '<p class="field-hint">' + esc(it.note) + '</p>' : '') + '</div>' +
      '<button class="btn btn-sm" type="button" data-act="career-copy" data-id="' + esc(it.id) + '">' + OR.icon('copy', 'icon-sm') + 'Copy</button></header>' +
      (keys.length ? '<div class="cr-fields">' + keys.map(function (k) {
        return '<label class="field"><span class="field-label">' + esc(k) + '</span><input class="input" type="text" data-field="' + esc(k) + '" value="' + esc(vals[k] || '') + '" autocomplete="off"></label>';
      }).join('') + '</div>' : '') +
      '<pre class="cr-text" data-text="' + esc(it.id) + '" tabindex="0">' + tplFill(esc(it.text).replace(/&#39;/g, "'"), vals, true) + '</pre></article>';
  }
  function findScript(id) {
    var hit = null;
    C.pages.forEach(function (p) { p.blocks.forEach(function (b) { if (b.t === 'scripts') b.items.forEach(function (s) { if (s.id === id) hit = s; }); }); });
    return hit;
  }
  OR.actions['career-copy'] = function (el) {
    var s = findScript(el.dataset.id); if (!s) return;
    OR.copyText(tplFill(s.text, draft('career:fields', {}), false)).then(
      function () { OR.toast('Copied.', { tone: 'ok' }); },
      function () { OR.toast('Copy was blocked by the browser. Select the text and copy it by hand.', { tone: 'error' }); });
  };

  /* ---------- checklist ---------- */
  function checkHTML(b) {
    var done = draft('career:checks', {})[b.id] || [];
    return '<ul class="cr-check" data-check="' + esc(b.id) + '">' + b.items.map(function (t, i) {
      return '<li><label><input type="checkbox" data-i="' + i + '"' + (done.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + esc(t) + '</span></label></li>';
    }).join('') + '</ul>';
  }

  /* ---------- links ---------- */
  function linksHTML(b) {
    return '<ul class="cr-links">' + b.items.map(function (l) {
      return '<li><a class="btn" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + OR.icon('external', 'icon-sm') + '</a>' + (l.note ? '<span class="field-hint">' + esc(l.note) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- the calculator ---------- */
  function offerCard(o, i, count) {
    var id = 'of' + i;
    function num(key, label, hint, extra) {
      return '<div class="field"><label class="field-label" for="' + id + key + '">' + label + '</label><input class="input" type="number" inputmode="decimal" step="any" id="' + id + key + '" data-k="' + key + '" value="' + esc(o[key]) + '"' + (extra || '') + '>' + (hint ? '<span class="field-hint">' + hint + '</span>' : '') + '</div>';
    }
    return '<fieldset class="cr-offer" data-i="' + i + '"><legend class="sr-only">' + esc(o.name || 'Offer') + '</legend>' +
      '<div class="cr-offer-head"><input class="input cr-name" type="text" data-k="name" value="' + esc(o.name) + '" aria-label="Offer ' + (i + 1) + ' name" maxlength="40">' +
      (count > 1 ? '<button class="icon-btn" type="button" data-act="career-del" data-i="' + i + '" aria-label="Remove ' + esc(o.name || 'offer') + '">' + OR.icon('trash', 'icon-sm') + '</button>' : '') + '</div>' +
      num('base', 'Base (per year)', '', ' min="0"') + num('bonusPct', 'Target bonus, % of base', '', ' min="0"') + num('signOn', 'Sign-on (year 1)', '', ' min="0"') +
      num('equity', 'Equity grant, total value', 'Over its whole vesting period.', ' min="0"') +
      '<div class="field"><label class="field-label" for="' + id + 'schedule">Vesting schedule</label><select class="select" id="' + id + 'schedule" data-k="schedule">' +
        Object.keys(C.SCHEDULES).map(function (k) { return '<option value="' + k + '"' + (k === o.schedule ? ' selected' : '') + '>' + esc(C.SCHEDULES[k].label) + '</option>'; }).join('') + '</select></div>' +
      num('refreshPct', 'Refresher, % of grant per year', 'From year 2. Rarely promised.', ' min="0"') + num('growthPct', 'Stock growth, % per year', 'Default 0 values shares at today’s price.') +
      '<div class="field"><label class="field-label" for="' + id + 'note">Location and tax note</label><textarea class="textarea cr-note" id="' + id + 'note" data-k="note" rows="2" maxlength="400" placeholder="e.g. city, state tax, cost of living, relocation"></textarea></div></fieldset>';
  }
  function resultsHTML(offers) {
    var res = offers.map(function (o) { return C.comp(o); });
    var any = res.some(function (r) { return r.total > 0; });
    if (!any) return '<p class="cr-empty">Enter a base salary and an equity grant to see the four years side by side.</p>';
    var best = Math.max.apply(null, res.map(function (r) { return r.total; }));
    var head = '<tr><th scope="col">Pre-tax</th>' + offers.map(function (o, i) {
      return '<th scope="col" class="num">' + esc(o.name || 'Offer') + (res[i].total === best && offers.length > 1 ? ' <span class="chip chip-accent">Highest</span>' : '') + '</th>'; }).join('') + '</tr>';
    var rows = [0, 1, 2, 3].map(function (y) {
      return '<tr><th scope="row">Year ' + (y + 1) + '</th>' + res.map(function (r) { return '<td class="num">' + money(r.years[y].total) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var foot = '<tr class="cr-total"><th scope="row">4-year total</th>' + res.map(function (r) { return '<td class="num">' + money(r.total) + '</td>'; }).join('') + '</tr>' +
      '<tr><th scope="row">Average per year</th>' + res.map(function (r) { return '<td class="num">' + money(r.avg) + '</td>'; }).join('') + '</tr>';
    var detail = offers.map(function (o, i) {
      var r = res[i];
      return '<details class="cr-detail"><summary>' + esc(o.name || 'Offer') + ': breakdown by year</summary><div class="table-wrap"><table class="table"><thead><tr><th scope="col">Year</th><th scope="col" class="num">Base</th><th scope="col" class="num">Bonus</th><th scope="col" class="num">Sign-on</th><th scope="col" class="num">Equity</th><th scope="col" class="num">Total</th></tr></thead><tbody>' +
        r.years.map(function (y) { return '<tr><th scope="row">' + y.year + '</th><td class="num">' + money(y.base) + '</td><td class="num">' + money(y.bonus) + '</td><td class="num">' + money(y.sign) + '</td><td class="num">' + money(y.equity) + '</td><td class="num">' + money(y.total) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' + (o.note ? '<p class="field-hint">Note: ' + esc(o.note) + '</p>' : '') + '</details>';
    }).join('');
    return '<div class="table-wrap"><table class="table cr-compare"><thead>' + head + '</thead><tbody>' + rows + foot + '</tbody></table></div>' +
      '<p class="field-hint">Any currency, as long as it is the same for every offer. Before tax, no raises assumed.</p>' + detail;
  }
  function calcHTML(offers) {
    return '<section class="cr-calc" aria-label="Total compensation calculator"><div class="cr-offers">' + offers.map(function (o, i) { return offerCard(o, i, offers.length); }).join('') + '</div>' +
      '<div class="btn-row">' + (offers.length < MAX_OFFERS ? '<button class="btn" type="button" data-act="career-add">' + OR.icon('plus', 'icon-sm') + 'Add an offer</button>' : '<span class="field-hint">Four offers is the limit.</span>') + '</div>' +
      '<h3 class="cr-h">Four years, side by side</h3><div id="cr-out" aria-live="polite">' + resultsHTML(offers) + '</div></section>';
  }

  /* ---------- pages ---------- */
  function pageNav(cur) {
    return '<nav class="cr-tabs" aria-label="Career pages">' + C.pages.map(function (p) {
      return '<a class="chip' + (p.id === cur ? ' chip-accent' : '') + '" href="#/career/' + p.id + '"' + (p.id === cur ? ' aria-current="page"' : '') + '>' + esc(p.title) + '</a>';
    }).join('') + '</nav>';
  }
  function blockHTML(b, state) {
    if (b.t === 'md') return '<div class="prose cr-prose">' + OR.md(b.v) + '</div>';
    if (b.t === 'scripts') return '<div class="cr-scripts">' + b.items.map(function (it) { return scriptHTML(it, state.fields); }).join('') + '</div>';
    if (b.t === 'check') return checkHTML(b);
    if (b.t === 'links') return linksHTML(b);
    if (b.t === 'calc') return calcHTML(state.offers);
    return '';
  }

  function bindPage(root, state) {
    function paintTexts() {
      OR.$$('.cr-text', root).forEach(function (pre) {
        var s = findScript(pre.dataset.text); if (s) pre.innerHTML = tplFill(esc(s.text).replace(/&#39;/g, "'"), state.fields, true);
      });
    }
    function paintOut() { var out = OR.$('#cr-out', root); if (out) out.innerHTML = resultsHTML(state.offers); }
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.field) { state.fields[t.dataset.field] = t.value; save('career:fields', state.fields); paintTexts(); return; }
      var card = t.closest('.cr-offer');
      if (card && t.dataset.k) { state.offers[+card.dataset.i][t.dataset.k] = t.value; save('career:offers', state.offers); paintOut(); }
    });
    root.addEventListener('change', function (e) {
      var t = e.target, ul = t.closest('.cr-check');
      if (ul) {
        var all = draft('career:checks', {}), id = ul.dataset.check, cur = (all[id] || []).slice(), i = +t.dataset.i, at = cur.indexOf(i);
        if (t.checked && at < 0) cur.push(i); if (!t.checked && at >= 0) cur.splice(at, 1);
        all = Object.assign({}, all); all[id] = cur; save('career:checks', all);
      } else if (t.matches('select[data-k]')) { /* the input handler already covers select via 'input' */ }
    });
    OR.$$('.cr-note', root).forEach(function (ta, i) { ta.value = state.offers[i].note || ''; });
  }
  OR.actions['career-add'] = function () {
    var offers = loadOffers(); if (offers.length >= MAX_OFFERS) return;
    offers.push(blankOffer(offers.length)); save('career:offers', offers); OR.rerender();
  };
  OR.actions['career-del'] = function (el) {
    var offers = loadOffers(); offers.splice(+el.dataset.i, 1); save('career:offers', offers); OR.rerender();
  };

  function renderIndex(main) {
    main.innerHTML = '<div class="page-narrow"><div class="page-head"><div><h1 class="page-title display">Career &amp; offers</h1>' +
      '<p class="page-lede">From first outreach to a signed offer. Read in any order; the calculator and the scripts save what you type on this computer.</p></div></div>' +
      '<ul class="cr-index">' + C.pages.map(function (p, i) {
        return '<li><a class="cr-card" href="#/career/' + p.id + '"><span class="bib">' + (i + 1) + '</span><span><strong>' + esc(p.title) + '</strong><span class="muted">' + esc(p.lede) + '</span></span>' + OR.icon('chevron-right') + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="cr-h">Also in this section</h2><ul class="cr-index">' +
      '<li><a class="cr-card" href="#/resume"><span class="bib">R</span><span><strong>Resume studio</strong><span class="muted">Build, version and store resumes and cover letters.</span></span>' + OR.icon('chevron-right') + '</a></li>' +
      '<li><a class="cr-card" href="#/pipeline"><span class="bib">P</span><span><strong>Pipeline tracker</strong><span class="muted">Every application, stage and deadline in one place.</span></span>' + OR.icon('chevron-right') + '</a></li></ul></div>';
  }

  OR.views.career = {
    title: function (ctx) { var p = ctx && ctx.params && C.pages.filter(function (x) { return x.id === ctx.params.id; })[0]; return p ? p.title : 'Career & offers'; },
    render: function (main, ctx) {
      var id = ctx.params.id;
      if (!id) { renderIndex(main); return; }
      var idx = -1; C.pages.forEach(function (p, i) { if (p.id === id) idx = i; });
      if (idx < 0) {
        main.innerHTML = '<div class="page empty"><h1 class="empty-title display" tabindex="-1">No such career page</h1><p>That page does not exist.</p><a class="btn" href="#/career">Back to Career &amp; offers</a></div>'; return;
      }
      var p = C.pages[idx], prev = C.pages[idx - 1], next = C.pages[idx + 1];
      var state = { fields: Object.assign({}, draft('career:fields', {})), offers: loadOffers() };
      main.innerHTML = '<div class="page-narrow cr-page"><div class="page-head"><div><p class="field-hint"><a href="#/career">Career &amp; offers</a></p><h1 class="page-title display">' + esc(p.title) + '</h1><p class="page-lede">' + esc(p.lede) + '</p></div></div>' +
        pageNav(p.id) + p.blocks.map(function (b) { return blockHTML(b, state); }).join('') +
        '<nav class="cr-pager" aria-label="Next and previous">' + (prev ? '<a class="btn" href="#/career/' + prev.id + '">' + OR.icon('chevron-left', 'icon-sm') + esc(prev.title) + '</a>' : '<span></span>') +
        (next ? '<a class="btn" href="#/career/' + next.id + '">' + esc(next.title) + OR.icon('chevron-right', 'icon-sm') + '</a>' : '') + '</nav></div>';
      bindPage(OR.$('.cr-page', main), state);
    }
  };

  OR.addSearch(function () {
    var items = [{ group: 'Career', title: 'Career & offers', icon: 'briefcase', href: '#/career', keywords: 'job search offers' }];
    C.pages.forEach(function (p) { items.push({ group: 'Career', title: p.title, sub: p.lede, icon: p.icon || 'briefcase', href: '#/career/' + p.id, keywords: 'career job offer ' + p.id }); });
    items.push({ group: 'Career', title: 'Compare offers calculator', sub: 'Total compensation, four years', icon: 'star', href: '#/career/compensation', keywords: 'total comp rsu vesting salary equity calculator' });
    items.push({ group: 'Career', title: 'Negotiation scripts', sub: 'Salary expectations, counter-offer, more time', icon: 'edit', href: '#/career/negotiation', keywords: 'counter offer salary expectations exploding' });
    return items;
  });
})();
