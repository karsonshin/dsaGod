/* Offer Ready: Cheat sheets (#/cheatsheets, #/cheatsheets/:id).
   Seven one-page printable sheets. Content lives in data/cheatsheets/*.js, each pushing
   { n, id, title, blurb, render(h) } onto OR.cheatsheets; h is the helper kit built here. */
(function () {
  'use strict';
  var OR = window.OR, esc = OR.esc;

  /* ---------- Helper kit ----------
     m(s): tiny inline markup over plain strings. `code`, **bold**, [[topic-id]] or [[topic-id|text]]
     (links to a lesson), {{lc}} (links to a problem). Everything else is escaped. */
  function topicLink(id, text) {
    var meta = OR.topicMeta && OR.topicMeta(id);
    if (!meta) { console.warn('cheatsheets: unknown topic ' + id); return esc(text || id); }
    return '<a href="#/topic/' + id + '">' + esc(text || meta.title) + '</a>';
  }
  function probLink(lc) {
    var p = null;
    OR.problems.some(function (q) { if (q.lc === +lc) { p = q; return true; } });
    if (!p) { console.warn('cheatsheets: unknown problem ' + lc); return esc(lc); }
    return '<a class="cs-p" href="#/problem/' + p.lc + '" title="' + esc(p.title) + '">' + p.lc + '</a>';
  }
  function plain(s) {
    return esc(s)
      .replace(/&lt;br&gt;/g, '<br>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, function (_, id, t) { return topicLink(id, t && t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')); })
      .replace(/\{\{(\d+)\}\}/g, function (_, n) { return probLink(n); });
  }
  function m(s) {
    return String(s == null ? '' : s).split('`').map(function (seg, i) { return i % 2 ? '<code>' + esc(seg) + '</code>' : plain(seg); }).join('');
  }
  // T(head, rows, { cls, label }): a scrolling table; every cell goes through m(). A row cell may be [text, attrs].
  function T(head, rows, o) {
    o = o || {};
    function cell(tag, c, scope) {
      var attrs = '';
      if (Array.isArray(c)) { attrs = ' ' + c[1]; c = c[0]; }
      return '<' + tag + attrs + (scope ? ' scope="' + scope + '"' : '') + '>' + m(c) + '</' + tag + '>';
    }
    return '<div class="table-wrap cs-tw" tabindex="0" role="region" aria-label="' + esc(o.label || 'Table') + '">' +
      '<table class="table cs-table ' + (o.cls || '') + '"><thead><tr>' + head.map(function (c) { return cell('th', c, 'col'); }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return (i === 0 && !o.noRowHead) ? cell('th', c, 'row') : cell('td', c); }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>';
  }
  function list(items, cls) { return '<ul class="cs-list ' + (cls || '') + '">' + items.map(function (x) { return '<li>' + m(x) + '</li>'; }).join('') + '</ul>'; }
  function sec(title, body, cls) { return '<section class="cs-sec ' + (cls || '') + '"><h3>' + m(title) + '</h3>' + body + '</section>'; }

  var H = { m: m, T: T, list: list, sec: sec, esc: esc, topicLink: topicLink, probLink: probLink };
  OR.csh = H;

  function sheets() { return OR.cheatsheets.slice().sort(function (a, b) { return a.n - b.n; }); }
  function byId(id) { var r = null; sheets().some(function (s) { if (s.id === id) { r = s; return true; } }); return r; }

  var oneLang = null; // language sheet: false = four side by side, true = only the toggle's language

  OR.views.cheatsheets = {
    title: function (ctx) { var s = ctx.params && ctx.params.id && byId(ctx.params.id); return s ? s.title : 'Cheat sheets'; },
    render: function (main, ctx) {
      var id = ctx.params && ctx.params.id;
      if (!id) return renderIndex(main);
      var s = byId(id);
      if (!s) {
        main.innerHTML = '<div class="page empty"><h1 class="empty-title display">No cheat sheet called “' + esc(id) + '”</h1><a class="btn btn-primary" href="#/cheatsheets">All cheat sheets</a></div>';
        return;
      }
      return renderSheet(main, s);
    }
  };

  function renderIndex(main) {
    main.innerHTML = '<div class="page cs-index"><div class="page-head"><div><h1 class="page-title display">Cheat sheets</h1>' +
      '<p class="page-lede">Seven one-page references. Each one prints on a single sheet of A4 or Letter, black on white. Open one, press Print, or use Ctrl P.</p></div></div>' +
      '<ol class="cs-cards">' + sheets().map(function (s) {
        return '<li><a class="cs-card" href="#/cheatsheets/' + s.id + '"><span class="bib-tag">' + String(s.n).padStart(2, '0') + '</span>' +
          '<span class="cs-card-main"><span class="cs-card-title display">' + esc(s.title) + '</span><span class="cs-card-blurb">' + esc(s.blurb) + '</span></span>' +
          '<span class="cs-card-go">' + OR.icon('arrow-right', 'icon-sm') + '</span></a></li>';
      }).join('') + '</ol></div>';
  }

  function renderSheet(main, s) {
    var all = sheets(), i = all.indexOf(s), prev = all[i - 1], next = all[i + 1], isLang = s.id === 'languages';
    if (isLang && oneLang === null) oneLang = matchMedia('(max-width: 760px)').matches;
    var body;
    try { body = s.render(H); } catch (e) { console.error(e); body = '<p class="banner">' + OR.icon('warning') + '<span>This sheet hit an error: ' + esc(e.message) + '</span></p>'; }

    main.innerHTML = '<div class="page cs-page">' +
      '<nav class="cs-crumb no-print" aria-label="Breadcrumb"><a href="#/cheatsheets">' + OR.icon('chevron-left', 'icon-sm') + 'All cheat sheets</a></nav>' +
      '<div class="page-head no-print"><div><h1 class="page-title display">' + esc(s.title) + '</h1><p class="page-lede">' + esc(s.blurb) + '</p></div>' +
      '<div class="btn-row cs-tools">' +
      (isLang ? '<div class="seg" role="group" aria-label="Columns"><button type="button" data-cs="all" aria-pressed="' + !oneLang + '">All four</button><button type="button" data-cs="one" aria-pressed="' + oneLang + '">' + esc(OR.langName(OR.lang())) + '</button></div>' : '') +
      '<button class="btn btn-primary" type="button" data-cs="print">' + OR.icon('file', 'icon-sm') + 'Print this sheet</button></div></div>' +
      '<article class="cs-sheet cs-' + s.id + (isLang && oneLang ? ' cs-one' : '') + '" aria-label="' + esc(s.title) + '">' +
      '<header class="cs-ph"><span class="cs-ph-n">' + String(s.n).padStart(2, '0') + '</span><h2>' + esc(s.title) + '</h2><span class="cs-ph-brand">Offer Ready cheat sheet</span></header>' +
      body + '</article>' +
      '<nav class="cs-pager no-print" aria-label="Other sheets">' +
      (prev ? '<a href="#/cheatsheets/' + prev.id + '">' + OR.icon('chevron-left', 'icon-sm') + esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a href="#/cheatsheets/' + next.id + '">' + esc(next.title) + OR.icon('chevron-right', 'icon-sm') + '</a>' : '<span></span>') + '</nav></div>';

    main.onclick = function (e) {
      var b = e.target.closest('[data-cs]'); if (!b) return;
      if (b.dataset.cs === 'print') { window.print(); return; }
      oneLang = b.dataset.cs === 'one';
      OR.$$('[data-cs="all"],[data-cs="one"]', main).forEach(function (x) { x.setAttribute('aria-pressed', String((x.dataset.cs === 'one') === oneLang)); });
      OR.$('.cs-sheet', main).classList.toggle('cs-one', oneLang);
    };
    return function () { main.onclick = null; };
  }

  OR.addSearch(function () {
    return sheets().map(function (s) {
      return { group: 'Cheat sheets', title: s.title, sub: s.blurb, icon: 'sheet', href: '#/cheatsheets/' + s.id, keywords: 'cheat sheet printable one page ' + (s.keywords || '') };
    });
  });
})();
