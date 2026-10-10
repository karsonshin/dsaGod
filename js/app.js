/* Offer Ready: core runtime.
   Namespace + utilities, mini-markdown, hash router, shell (nav, theme, language, stopwatch),
   command palette, toasts and dialogs. Classic script: everything hangs off window.OR. */
(function () {
  'use strict';
  var OR = (window.OR = window.OR || {});

  // Content collections that data/*.js files push into (load order does not matter).
  ['topics', 'problems', 'resources', 'flashcards', 'cheatsheets', 'curriculum'].forEach(function (k) { OR[k] = OR[k] || []; });
  OR.views = OR.views || {};
  OR.viz = OR.viz || {};

  /* ---------- Utilities ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = (OR.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); });
  OR.icon = function (name, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; };
  OR.$ = function (sel, root) { return (root || document).querySelector(sel); };
  OR.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  OR.debounce = function (fn, ms) { var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); }; };
  OR.throttle = function (fn, ms) {
    var last = 0, t;
    return function () {
      var a = arguments, self = this, now = Date.now();
      clearTimeout(t);
      if (now - last >= ms) { last = now; fn.apply(self, a); }
      else t = setTimeout(function () { last = Date.now(); fn.apply(self, a); }, ms - (now - last));
    };
  };
  OR.uid = function () { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5); };
  OR.clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  OR.plural = function (n, w, pl) { return n + ' ' + (n === 1 ? w : (pl || w + 's')); };

  // Dates are local calendar days as 'YYYY-MM-DD' strings.
  function z(n) { return String(n).padStart(2, '0'); }
  OR.dateStr = function (d) { d = d || new Date(); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };
  OR.parseDate = function (s) { var p = String(s).split('-').map(Number); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1); };
  OR.addDays = function (s, n) { var d = OR.parseDate(s); d.setDate(d.getDate() + n); return OR.dateStr(d); };
  OR.daysBetween = function (a, b) { return Math.round((OR.parseDate(b) - OR.parseDate(a)) / 86400000); };
  OR.today = function () { return OR.dateStr(new Date()); };
  OR.fmtDate = function (s, opts) {
    try { return OR.parseDate(s).toLocaleDateString(undefined, opts || { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch (e) { return s; }
  };
  OR.fmtMin = function (m) {
    m = Math.round(m || 0);
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + 'h' + (r ? ' ' + r + 'm' : '');
  };
  OR.fmtHours = function (m) { var h = (m || 0) / 60; return h >= 10 ? Math.round(h) + '' : (Math.round(h * 10) / 10) + ''; };
  OR.ago = function (ts) {
    if (!ts) return '';
    var s = Math.round((Date.now() - ts) / 1000);
    if (s < 45) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    var d = Math.round(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  };

  /* ---------- Event bus ---------- */
  var subs = {};
  OR.on = function (evt, fn) { (subs[evt] = subs[evt] || []).push(fn); return function () { subs[evt] = (subs[evt] || []).filter(function (f) { return f !== fn; }); }; };
  OR.emit = function (evt, data) { (subs[evt] || []).slice().forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- Mini markdown ----------
     Paragraphs, ## / ### / #### headings, - and 1. lists, > quotes, ``` fences, | tables |,
     `code`, **bold**, *italic*, [text](url). HTML in the source is always escaped. */
  function mdLink(text, url) {
    var u = url.replace(/&amp;/g, '&');
    if (/^#\//.test(u)) return '<a href="' + esc(u) + '">' + text + '</a>';
    if (/^https?:\/\//.test(u)) return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
    return text;
  }
  function inline(s) {
    var codes = [];
    s = String(s).replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) { return mdLink(t, u); });
    return s.replace(/\u0000(\d+)\u0000/g, function (_, n) { return '<code>' + esc(codes[+n]) + '</code>'; });
  }
  OR.inline = inline;
  var BLOCK = /^(```|#{2,4}\s|>\s?|\s*[-*]\s+|\s*\d+[.)]\s+|\|.*\|\s*$|---+\s*$)/;
  function splitRow(line) { return line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }
  OR.md = function md(src) {
    if (Array.isArray(src)) src = src.join('\n\n');
    var lines = String(src == null ? '' : src).replace(/\r\n?/g, '\n').split('\n');
    var out = '', i = 0, m, buf, items;
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }
      if ((m = line.match(/^```\s*([\w+#-]*)\s*$/))) {
        buf = []; i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out += '<pre class="md-code"><code>' + esc(buf.join('\n')) + '</code></pre>';
        continue;
      }
      if ((m = line.match(/^(#{2,4})\s+(.*)$/))) { out += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'; i++; continue; }
      if (/^---+\s*$/.test(line)) { out += '<hr>'; i++; continue; }
      if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        var head = splitRow(line); i += 2; var rows = [];
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(splitRow(lines[i++]));
        out += '<div class="table-wrap"><table><thead><tr>' + head.map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
        continue;
      }
      if (/^>\s?/.test(line)) {
        buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        out += '<blockquote>' + md(buf.join('\n')) + '</blockquote>';
        continue;
      }
      var ul = /^\s*[-*]\s+/, ol = /^\s*\d+[.)]\s+/;
      if (ul.test(line) || ol.test(line)) {
        var re = ul.test(line) ? ul : ol, tag = re === ul ? 'ul' : 'ol';
        items = [];
        while (i < lines.length && re.test(lines[i])) {
          var item = lines[i++].replace(re, '');
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !ul.test(lines[i]) && !ol.test(lines[i])) item += ' ' + lines[i++].trim();
          items.push(item);
        }
        out += '<' + tag + '>' + items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</' + tag + '>';
        continue;
      }
      buf = [];
      while (i < lines.length && lines[i].trim() && !(buf.length && BLOCK.test(lines[i]))) buf.push(lines[i++].trim());
      out += '<p>' + inline(buf.join(' ')) + '</p>';
    }
    return out;
  };

  /* ---------- Announcer, toasts, dialogs ---------- */
  OR.announce = function (msg) { var el = OR.$('#announcer'); if (!el) return; el.textContent = ''; setTimeout(function () { el.textContent = msg; }, 30); };

  OR.toast = function (msg, opts) {
    opts = opts || {};
    var host = OR.$('#toasts'); if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast';
    if (opts.tone) el.dataset.tone = opts.tone;
    el.innerHTML = OR.icon(opts.tone === 'error' ? 'warning' : opts.tone === 'ok' ? 'check' : 'info') + '<span>' + esc(msg) + '</span>' +
      (opts.action ? '<button type="button">' + esc(opts.action.label) + '</button>' : '');
    if (opts.action) el.querySelector('button').addEventListener('click', function () { opts.action.run(); el.remove(); });
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, opts.timeout || (opts.action ? 7000 : 3600));
  };

  // Modal built on <dialog>: resolves with the clicked button's value ('' when dismissed).
  OR.dialog = function (o) {
    var dlg = OR.$('#modal');
    return new Promise(function (resolve) {
      var btns = (o.buttons || [{ label: 'OK', value: 'ok', primary: true }]).map(function (b) {
        return '<button type="button" class="btn ' + (b.primary ? 'btn-primary' : b.danger ? 'btn-danger' : '') + '" value="' + esc(b.value) + '">' + esc(b.label) + '</button>';
      }).join('');
      dlg.innerHTML = '<h2 id="modal-title">' + esc(o.title) + '</h2>' + (o.html || (o.body ? '<p>' + esc(o.body) + '</p>' : '')) +
        '<div class="modal-actions">' + btns + '</div>';
      dlg.setAttribute('aria-labelledby', 'modal-title');
      var done = function (v) { dlg.removeEventListener('close', onClose); if (dlg.open) dlg.close(); resolve(v); };
      var onClose = function () { resolve(dlg.returnValue || ''); };
      dlg.addEventListener('close', onClose, { once: true });
      OR.$$('.modal-actions button', dlg).forEach(function (b) {
        b.addEventListener('click', function () { done(b.value); });
      });
      dlg.returnValue = '';
      dlg.showModal();
      var focusTarget = OR.$('[autofocus]', dlg) || OR.$('.modal-actions .btn-primary', dlg) || OR.$('.modal-actions button', dlg);
      if (focusTarget) focusTarget.focus();
    });
  };
  OR.confirm = function (o) {
    return OR.dialog({
      title: o.title, body: o.body, html: o.html,
      buttons: [{ label: o.cancel || 'Cancel', value: 'cancel' }, { label: o.ok || 'Continue', value: 'ok', primary: !o.danger, danger: !!o.danger }]
    }).then(function (v) { return v === 'ok'; });
  };

  /* ---------- Navigation model ---------- */
  var NAV = [
    { items: [['today', 'Today', '#/', 'today'], ['plan', 'Plan', '#/plan', 'plan'], ['progress', 'Progress', '#/progress', 'progress']] },
    { label: 'Learn', items: [['roadmap', 'Roadmap', '#/roadmap', 'roadmap'], ['topics', 'Topics', '#/topics', 'topics'], ['viz', 'Visualizers', '#/viz', 'viz'], ['cheatsheets', 'Cheat sheets', '#/cheatsheets', 'sheet']] },
    { label: 'Practice', items: [['problems', 'Problems', '#/problems', 'problems'], ['detective', 'Pattern Detective', '#/detective', 'detective'], ['review', 'Review queue', '#/review', 'review'], ['flashcards', 'Flashcards', '#/flashcards', 'cards'], ['playground', 'Playground', '#/playground', 'code'], ['mock', 'Mock interview', '#/mock', 'mock']] },
    { label: 'Beyond code', items: [['systemDesign', 'System design', '#/system-design', 'system'], ['behavioral', 'Behavioral', '#/behavioral', 'behavioral'], ['cs', 'CS fundamentals', '#/cs', 'cpu']] },
    { label: 'Get hired', items: [['resume', 'Resume studio', '#/resume', 'resume'], ['pipeline', 'Pipeline', '#/pipeline', 'columns'], ['career', 'Career & offers', '#/career', 'briefcase'], ['resources', 'Resources', '#/resources', 'library']] }
  ];
  var FOOT = [['wellbeing', 'Wellbeing', '#/wellbeing', 'leaf'], ['settings', 'Settings', '#/settings', 'settings']];
  var TABS = [['today', 'Today', '#/', 'today'], ['topics', 'Topics', '#/topics', 'topics'], ['problems', 'Problems', '#/problems', 'problems'], ['flashcards', 'Cards', '#/flashcards', 'cards'], ['more', 'More', '', 'menu']];
  // Which nav item lights up for a view.
  var NAV_FOR = { topic: 'topics', problem: 'problems', onboarding: 'today' };
  OR.navItems = function () { var all = []; NAV.concat([{ items: FOOT }]).forEach(function (g) { all = all.concat(g.items); }); return all; };
  OR.counts = OR.counts || {}; // name -> function returning a number badge

  function navLink(it) {
    var n = OR.counts[it[0]] ? OR.counts[it[0]]() : 0;
    return '<li><a class="nav-link" href="' + it[2] + '" data-nav="' + it[0] + '" title="' + esc(it[1]) + '">' + OR.icon(it[3]) +
      '<span class="label">' + esc(it[1]) + '</span>' + (n ? '<span class="nav-count" aria-label="' + n + ' due">' + n + '</span>' : '') + '</a></li>';
  }
  // The daily spine (Today, Plan, Progress) stays visible; each labelled group folds away unless it holds the current page.
  // Only on the wide rail: the compact rail and the phone sheet show every icon.
  function navHTML(fold) {
    var key = current ? (NAV_FOR[current.view] || current.view) : '';
    return NAV.map(function (g) {
      var list = '<ul>' + g.items.map(navLink).join('') + '</ul>';
      if (!g.label) return list;
      if (!fold) return '<h2 class="rail-group">' + esc(g.label) + '</h2>' + list;
      var open = g.items.some(function (it) { return it[0] === key; });
      return '<details class="rail-fold"' + (open ? ' open' : '') + '><summary class="rail-group">' + esc(g.label) + '</summary>' + list + '</details>';
    }).join('');
  }
  OR.refreshNav = function () {
    var nav = OR.$('#rail-nav'); if (!nav) return;
    nav.innerHTML = navHTML(window.matchMedia('(min-width: 1180px)').matches);
    OR.$('#rail-foot').innerHTML = '<ul>' + FOOT.map(navLink).join('') + '</ul>';
    OR.$('#tabbar').innerHTML = TABS.map(function (t) {
      if (t[0] === 'more') return '<button class="tab" type="button" data-act="more" aria-haspopup="dialog">' + OR.icon(t[3]) + '<span>' + t[1] + '</span></button>';
      return '<a class="tab" href="' + t[2] + '" data-nav="' + t[0] + '">' + OR.icon(t[3]) + '<span>' + t[1] + '</span></a>';
    }).join('');
    OR.$('#sheet-nav').innerHTML = navHTML() + '<h2 class="rail-group">More</h2><ul>' + FOOT.map(navLink).join('') + '</ul>';
    if (current) setActiveNav(current);
  };
  // Refresh only the due-count badges, so focus inside the nav is never lost.
  OR.updateCounts = function () {
    OR.$$('.nav-link[data-nav]').forEach(function (a) {
      var fn = OR.counts[a.dataset.nav]; if (!fn) return;
      var n = fn(), b = a.querySelector('.nav-count');
      if (!n) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('span'); b.className = 'nav-count'; a.appendChild(b); }
      b.textContent = n; b.setAttribute('aria-label', n + ' due');
    });
  };
  function setActiveNav(ctx) {
    var key = NAV_FOR[ctx.view] || ctx.view;
    document.body.dataset.view = key;
    OR.$$('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === key) { a.setAttribute('aria-current', 'page'); var d = a.closest('details'); if (d) d.open = true; }
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------- Router ---------- */
  var ROUTES = [
    ['/', 'today'], ['/today', 'today'], ['/onboarding', 'onboarding'], ['/plan', 'plan'], ['/progress', 'progress'],
    ['/roadmap', 'roadmap'], ['/topics', 'topics'], ['/topic/:id', 'topic'], ['/topic/:id/:section', 'topic'],
    ['/problems', 'problems'], ['/problem/:num', 'problem'], ['/detective', 'detective'], ['/review', 'review'],
    ['/flashcards', 'flashcards'], ['/flashcards/:deck', 'flashcards'], ['/playground', 'playground'], ['/playground/:key', 'playground'],
    ['/viz', 'viz'], ['/viz/:id', 'viz'], ['/cheatsheets', 'cheatsheets'], ['/cheatsheets/:id', 'cheatsheets'],
    ['/mock', 'mock'], ['/mock/:mode', 'mock'],
    ['/system-design', 'systemDesign'], ['/system-design/:id', 'systemDesign'], ['/system-design/:id/:section', 'systemDesign'],
    ['/behavioral', 'behavioral'], ['/behavioral/:tab', 'behavioral'],
    ['/cs', 'cs'], ['/cs/:id', 'cs'],
    ['/career', 'career'], ['/career/:id', 'career'],
    ['/resume', 'resume'], ['/resume/:tab', 'resume'], ['/resume/:tab/:id', 'resume'],
    ['/pipeline', 'pipeline'], ['/resources', 'resources'], ['/settings', 'settings'], ['/wellbeing', 'wellbeing'],
    ['/selftest', 'selftest']
  ];
  // Routes that never become the "pick up where you left off" place.
  var NO_PLACE = { today: 1, onboarding: 1, settings: 1, selftest: 1, notFound: 1 };
  // 'restore' on first load: reopening the app lands where the owner was on that page.
  var current = null, cleanup = null, navIntent = 'restore';

  OR.parseHash = function (hash) {
    var h = String(hash != null ? hash : location.hash).replace(/^#/, '') || '/';
    if (h.charAt(0) !== '/') h = '/' + h;
    var parts = h.split('?'), path = parts[0], query = {};
    new URLSearchParams(parts[1] || '').forEach(function (v, k) { query[k] = v; });
    var segs = path.split('/').filter(Boolean);
    for (var r = 0; r < ROUTES.length; r++) {
      var ps = ROUTES[r][0].split('/').filter(Boolean);
      if (ps.length !== segs.length) continue;
      var params = {}, ok = true;
      for (var i = 0; i < ps.length; i++) {
        if (ps[i].charAt(0) === ':') { try { params[ps[i].slice(1)] = decodeURIComponent(segs[i]); } catch (e) { params[ps[i].slice(1)] = segs[i]; } }
        else if (ps[i] !== segs[i]) { ok = false; break; }
      }
      if (ok) return { view: ROUTES[r][1], params: params, query: query, path: path, hash: '#' + h };
    }
    return { view: 'notFound', params: {}, query: query, path: path, hash: '#' + h };
  };
  OR.current = function () { return current; };

  OR.go = function (hash, intent) { navIntent = intent || 'top'; if (location.hash === hash) render(); else location.hash = hash; };
  // Update the query string without a re-render (filters that should survive reloads).
  OR.setQuery = function (q) {
    var ctx = current; if (!ctx) return;
    var qs = new URLSearchParams();
    Object.keys(q).forEach(function (k) { if (q[k] !== '' && q[k] != null && q[k] !== false) qs.set(k, q[k]); });
    var h = ctx.path + (qs.toString() ? '?' + qs.toString() : '');
    history.replaceState(null, '', '#' + h);
    current = OR.parseHash('#' + h);
  };

  function saveScroll() {
    if (!current || !OR.store) return;
    var max = document.documentElement.scrollHeight - innerHeight;
    OR.store.setScroll(current.hash, scrollY, max > 0 ? scrollY / max : 0);
  }
  function restoreScroll(ctx) {
    var saved = OR.store && OR.store.getScroll(ctx.hash);
    if (!saved) { scrollTo(0, 0); return; }
    var apply = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, saved.y <= max ? saved.y : Math.round(saved.frac * max));
    };
    apply(); requestAnimationFrame(function () { requestAnimationFrame(apply); });
    setTimeout(apply, 250);
  }

  // keep=true: re-render in place after an action (no scroll jump, no focus move).
  function render(keep) {
    keep = keep === true;
    var ctx = OR.parseHash();
    var st = OR.store.get();
    if (!st.settings.onboarded && ['onboarding', 'settings', 'selftest'].indexOf(ctx.view) < 0) {
      location.replace('#/onboarding');
      return;
    }
    var view = OR.views[ctx.view] || OR.views.notFound;
    if (!keep) saveScroll();
    if (!keep && current && current.view === ctx.view && view.same && view.same(ctx, current)) {
      var prev = current; current = ctx;
      view.update(ctx, prev);
      OR.trackPlace();
      return;
    }
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
    cleanup = null;
    document.body.classList.toggle('is-bare', !!view.bare);
    var main = OR.$('#main');
    var y = scrollY, focusId = keep && document.activeElement && document.activeElement.id;
    current = ctx;
    if (!keep) OR.placeMeta = null;
    try { cleanup = view.render(main, ctx) || null; }
    catch (err) {
      console.error(err);
      main.innerHTML = '<div class="page empty"><h1 class="empty-title display" tabindex="-1">This page hit an error</h1><p>' + esc(err && err.message) +
        '</p><p>Your progress is safe. Try another page, or reload.</p><a class="btn" href="#/">Back to Today</a></div>';
    }
    var t = view.title ? view.title(ctx) : '';
    document.title = t ? t + ' · Offer Ready' : 'Offer Ready';
    setActiveNav(ctx);
    if (keep) {
      scrollTo(0, y);
      var f = focusId && document.getElementById(focusId);
      if (f) f.focus({ preventScroll: true });
      return;
    }
    if (OR.$('#more-sheet').open) OR.$('#more-sheet').close();
    if (navIntent === 'restore' || navIntent === 'back') restoreScroll(ctx);
    else if (!(view.scrollsItself && view.scrollsItself(ctx))) scrollTo(0, 0);
    navIntent = 'back'; // the next hashchange without a click is browser back/forward
    var h1 = OR.$('#main h1');
    if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    OR.trackPlace();
  }
  // Re-render the current page in place (after an action changed state).
  OR.rerender = function () { if (current) render(true); };

  /* ---------- Resume: track the current place ---------- */
  // Views may call OR.setPlace({ title, section }) after render to label where the owner is.
  OR.setPlace = function (meta) { OR.placeMeta = meta; OR.trackPlace(); };
  OR.trackPlace = function () {
    if (!current || NO_PLACE[current.view] || !OR.store) return;
    var view = OR.views[current.view] || {};
    var meta = OR.placeMeta || {};
    var title = meta.title || (view.title ? view.title(current) : '') || 'Offer Ready';
    var max = document.documentElement.scrollHeight - innerHeight;
    OR.store.setPlace({ hash: current.hash, title: title, section: meta.section || '', frac: max > 0 ? OR.clamp(scrollY / max, 0, 1) : 0 });
  };
  var onScroll = OR.throttle(function () { saveScroll(); OR.trackPlace(); }, 600);

  /* ---------- Theme + language ---------- */
  var THEMES = { system: ['monitor', 'System'], light: ['sun', 'Light'], dark: ['moon', 'Dark'] };
  var NEXT_THEME = { system: 'light', light: 'dark', dark: 'system' };
  var applyTheme = (OR.applyTheme = function () {
    var t = OR.store.get().settings.theme || 'system';
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    var btn = OR.$('#theme-btn');
    btn.innerHTML = OR.icon(THEMES[t][0]);
    btn.setAttribute('aria-label', 'Theme: ' + THEMES[t][1] + '. Switch to ' + THEMES[NEXT_THEME[t]][1]);
    btn.title = 'Theme: ' + THEMES[t][1];
  });
  OR.applyMotion = function () {
    var m = OR.store.get().settings.motion || 'system';
    if (m === 'system') document.documentElement.removeAttribute('data-motion');
    else document.documentElement.setAttribute('data-motion', m);
  };
  OR.reducedMotion = function () {
    var m = OR.store.get().settings.motion;
    if (m === 'reduce') return true;
    if (m === 'full') return false;
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  OR.LANGS = [['py', 'Py', 'Python'], ['js', 'JS', 'JavaScript'], ['java', 'Java', 'Java'], ['cpp', 'C++', 'C++']];
  OR.lang = function () { return OR.store.get().settings.lang || 'py'; };
  OR.langName = function (k) { for (var i = 0; i < OR.LANGS.length; i++) if (OR.LANGS[i][0] === k) return OR.LANGS[i][2]; return k; };
  OR.setLang = function (k) {
    if (k === OR.lang()) return;
    OR.store.update(function (s) { s.settings.lang = k; });
    renderLang();
    OR.emit('lang', k);
  };
  function renderLang() {
    var cur = OR.lang();
    document.documentElement.dataset.lang = cur; // code blocks show the matching pane in CSS
    OR.$('#lang-seg').innerHTML = OR.LANGS.map(function (l) {
      var on = l[0] === cur;
      return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-act="lang" data-lang="' + l[0] + '" title="' + l[2] + '">' + l[1] + '</button>';
    }).join('');
  }
  // Arrow keys move through any role=radiogroup made of buttons (roving tabindex).
  document.addEventListener('keydown', function (e) {
    var b = e.target;
    if (!b.matches || !b.matches('[role="radiogroup"] [role="radio"]')) return;
    var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!keys[e.key]) return;
    e.preventDefault();
    var all = OR.$$('[role="radio"]', b.closest('[role="radiogroup"]'));
    var next = all[(all.indexOf(b) + keys[e.key] + all.length) % all.length];
    next.focus(); next.click();
  });

  /* ---------- Session stopwatch ---------- */
  var swTimer = null;
  function swElapsed() {
    var s = OR.store.get().session || {};
    return (s.accumulated || 0) + (s.running ? Date.now() - s.startedAt : 0);
  }
  OR.sessionElapsed = swElapsed;
  function fmtClock(ms) {
    var t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' + z(m) : z(m)) + ':' + z(s);
  }
  OR.fmtClock = fmtClock;
  function renderStopwatch() {
    var s = OR.store.get().session || {}, el = OR.$('#stopwatch');
    var state = s.running ? 'running' : s.accumulated ? 'paused' : 'idle';
    el.dataset.state = state;
    if (state === 'idle') {
      el.innerHTML = '<button class="btn btn-sm" type="button" data-act="session-start">' + OR.icon('stopwatch', 'icon-sm') + '<span class="sw-label">Start session</span></button>';
    } else {
      el.innerHTML = (state === 'running' ? '<span class="pulse" aria-hidden="true"></span>' : '') +
        '<span class="stopwatch-time" role="timer" aria-label="Session time">' + fmtClock(swElapsed()) + '</span>' +
        (state === 'running'
          ? '<button class="icon-btn" type="button" data-act="session-pause" aria-label="Pause session">' + OR.icon('pause', 'icon-sm') + '</button>'
          : '<button class="icon-btn" type="button" data-act="session-start" aria-label="Resume session">' + OR.icon('play', 'icon-sm') + '</button>') +
        '<button class="icon-btn" type="button" data-act="session-stop" aria-label="Stop and log session">' + OR.icon('stop', 'icon-sm') + '</button>';
    }
    clearInterval(swTimer);
    if (state === 'running') swTimer = setInterval(function () {
      var t = OR.$('#stopwatch .stopwatch-time'); if (t) t.textContent = fmtClock(swElapsed());
    }, 1000);
  }
  OR.renderStopwatch = renderStopwatch;
  OR.sessionStart = function () {
    OR.store.update(function (s) {
      s.session = s.session || {};
      if (!s.session.running) { s.session.running = true; s.session.startedAt = Date.now(); s.session.date = s.session.date || OR.today(); }
    });
    renderStopwatch(); OR.emit('session');
    OR.announce('Session started');
  };
  OR.sessionPause = function () {
    OR.store.update(function (s) {
      if (s.session && s.session.running) { s.session.accumulated = (s.session.accumulated || 0) + Date.now() - s.session.startedAt; s.session.running = false; }
    });
    renderStopwatch(); OR.emit('session');
  };
  OR.sessionStop = function () {
    var ms = swElapsed(), minutes = Math.round(ms / 60000), date = (OR.store.get().session || {}).date || OR.today();
    OR.store.update(function (s) { s.session = {}; });
    if (minutes > 0) OR.store.logMinutes(date, minutes);
    renderStopwatch(); OR.emit('session'); OR.emit('activity');
    OR.toast(minutes > 0 ? 'Logged ' + OR.fmtMin(minutes) + ' to ' + (date === OR.today() ? 'today' : OR.fmtDate(date)) + '.' : 'Session under a minute, so nothing was logged.', { tone: minutes > 0 ? 'ok' : '' });
  };

  /* ---------- Command palette ---------- */
  var providers = [];
  // provider(): [{ group, title, sub, icon, href | run, keywords }]
  OR.addSearch = function (fn) { providers.push(fn); };
  var palIndex = null, palSel = 0, palItems = [];
  function buildIndex() {
    var all = [];
    providers.forEach(function (p) { try { all = all.concat(p() || []); } catch (e) { console.error(e); } });
    all.forEach(function (it) { it._hay = (it.title + ' ' + (it.sub || '') + ' ' + (it.keywords || '')).toLowerCase(); it._t = it.title.toLowerCase(); });
    return all;
  }
  OR.invalidateSearch = function () { palIndex = null; };
  function score(it, terms, q) {
    var s = 0;
    for (var i = 0; i < terms.length; i++) { if (it._hay.indexOf(terms[i]) < 0) return 0; }
    if (it._t === q) s += 120;
    if (it._t.indexOf(q) === 0) s += 80;
    else if (it._t.indexOf(q) > 0) s += 40;
    terms.forEach(function (t) { if (new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(it._t)) s += 20; });
    return s + (it.boost || 0) + 1;
  }
  function highlight(title, terms) {
    var h = esc(title);
    terms.forEach(function (t) { if (t.length > 1) h = h.replace(new RegExp('(' + esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
    return h;
  }
  function palRender() {
    var q = OR.$('#palette-input').value.trim().toLowerCase();
    if (!palIndex) palIndex = buildIndex();
    var terms = q.split(/\s+/).filter(Boolean);
    if (!q) palItems = palIndex.filter(function (it) { return it.pinned; }).slice(0, 14);
    else palItems = palIndex.map(function (it) { return [score(it, terms, q), it]; })
      .filter(function (p) { return p[0] > 0; })
      .sort(function (a, b) { return b[0] - a[0]; })
      .slice(0, 50).map(function (p) { return p[1]; });
    palSel = 0;
    var host = OR.$('#palette-results');
    if (!palItems.length) { host.innerHTML = '<div class="palette-empty">No matches for “' + esc(q) + '”. Try a problem number, a topic, or a pattern name.</div>'; return; }
    var groups = [], byGroup = {};
    palItems.forEach(function (it) { if (!byGroup[it.group]) { byGroup[it.group] = []; groups.push(it.group); } byGroup[it.group].push(it); });
    palItems = []; var html = '';
    groups.forEach(function (g) {
      html += '<div class="palette-group" role="presentation">' + esc(g) + '</div>';
      byGroup[g].forEach(function (it) {
        var idx = palItems.length; palItems.push(it);
        html += '<div class="palette-item" role="option" id="pi-' + idx + '" data-idx="' + idx + '" aria-selected="' + (idx === 0) + '">' + OR.icon(it.icon || 'arrow-right') +
          '<span class="pi-main"><span class="pi-title">' + highlight(it.title, terms) + '</span>' + (it.sub ? '<span class="pi-sub">' + esc(it.sub) + '</span>' : '') + '</span></div>';
      });
    });
    host.innerHTML = html;
    OR.$('#palette-input').setAttribute('aria-activedescendant', 'pi-0');
  }
  function palMove(d) {
    if (!palItems.length) return;
    palSel = (palSel + d + palItems.length) % palItems.length;
    OR.$$('.palette-item').forEach(function (el) { el.setAttribute('aria-selected', String(+el.dataset.idx === palSel)); });
    var el = OR.$('#pi-' + palSel); if (el) el.scrollIntoView({ block: 'nearest' });
    OR.$('#palette-input').setAttribute('aria-activedescendant', 'pi-' + palSel);
  }
  function palPick(idx) {
    var it = palItems[idx]; if (!it) return;
    OR.$('#palette').close();
    if (it.run) it.run(); else if (it.href) OR.go(it.href, it.intent);
  }
  OR.openPalette = function (q) {
    var dlg = OR.$('#palette');
    if (dlg.open) return;
    palIndex = null;
    OR.$('#palette-input').value = q || '';
    dlg.showModal();
    palRender();
    OR.$('#palette-input').focus();
  };

  /* ---------- Actions (delegated) ---------- */
  OR.actions = OR.actions || {};
  var A = OR.actions;
  A.skip = function () { var h = OR.$('#main h1') || OR.$('#main'); h.setAttribute('tabindex', '-1'); h.focus(); };
  A.palette = function () { OR.openPalette(); };
  A.theme = function () {
    OR.store.update(function (s) { s.settings.theme = NEXT_THEME[s.settings.theme || 'system']; });
    applyTheme(); OR.emit('theme');
    OR.announce('Theme ' + THEMES[OR.store.get().settings.theme][1]);
  };
  A.lang = function (el) { OR.setLang(el.dataset.lang); };
  A.more = function () { OR.$('#more-sheet').showModal(); };
  A['close-sheet'] = function () { OR.$('#more-sheet').close(); };
  A['session-start'] = function () { OR.sessionStart(); };
  A['session-pause'] = function () { OR.sessionPause(); };
  A['session-stop'] = function () { OR.sessionStop(); };
  A['resume-place'] = function (el) { OR.go(el.dataset.hash, 'restore'); };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (el && A[el.dataset.act]) {
      if (el.tagName === 'A') e.preventDefault();
      A[el.dataset.act](el, e);
      return;
    }
    var a = e.target.closest('a[href^="#/"]');
    if (a && !e.defaultPrevented && !a.target) {
      navIntent = a.dataset.intent || 'top';
      if (a.getAttribute('href') === location.hash) { e.preventDefault(); render(); }
    }
  });

  document.addEventListener('keydown', function (e) {
    var dlg = OR.$('#palette');
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (dlg.open) dlg.close(); else OR.openPalette(); return; }
    if (dlg.open && e.target.id === 'palette-input') {
      if (e.key === 'ArrowDown') { e.preventDefault(); palMove(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palMove(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); palPick(palSel); }
      return;
    }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (!typing && e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); OR.openPalette(); }
  });

  /* ---------- Boot ---------- */
  OR.boot = function () {
    OR.store.init();
    applyTheme(); OR.applyMotion(); renderLang(); renderStopwatch(); OR.refreshNav();
    OR.$('#palette-input').addEventListener('input', palRender);
    OR.$('#palette-results').addEventListener('click', function (e) { var it = e.target.closest('.palette-item'); if (it) palPick(+it.dataset.idx); });
    OR.$('#palette').addEventListener('click', function (e) { if (e.target.id === 'palette') e.target.close(); });
    OR.$('#more-sheet').addEventListener('click', function (e) { if (e.target.id === 'more-sheet') e.target.close(); });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { OR.emit('theme'); });
    history.scrollRestoration = 'manual';
    addEventListener('hashchange', render);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('pagehide', function () { saveScroll(); OR.trackPlace(); OR.store.flush(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { saveScroll(); OR.store.flush(); } });
    OR.on('state', OR.debounce(function () { OR.updateCounts(); }, 200));
    // Today, Plan, Progress, the study calendar, Roadmap and Topics repaint by themselves when the data under them changes
    // (a session logged, a card graded, a backup imported, another device's progress arriving) and when the date rolls over.
    var LIVE = { today: 1, plan: 1, progress: 1, roadmap: 1, topics: 1 }, lastDay = OR.today();
    function liveRefresh() {
      var a = document.activeElement;
      if (!current || !LIVE[current.view] || document.hidden || OR.$('dialog[open]') || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
      OR.rerender();
    }
    OR.on('state', OR.debounce(liveRefresh, 500));
    setInterval(function () { var d = OR.today(); if (d !== lastDay) { lastDay = d; liveRefresh(); } }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastDay = OR.today(); liveRefresh(); } });
    OR.on('lang', renderLang);
    OR.on('restored', function () { applyTheme(); OR.applyMotion(); renderLang(); renderStopwatch(); OR.refreshNav(); OR.go('#/', 'top'); });
    render();
  };

  // Navigation and actions available from the palette.
  OR.addSearch(function () {
    var items = OR.navItems().map(function (it) { return { group: 'Go to', title: it[1], icon: it[3], href: it[2], pinned: true, boost: 5 }; });
    var place = OR.store.get().place;
    if (place && place.hash) items.unshift({ group: 'Pick up', title: 'Resume: ' + place.title, sub: place.section || 'Where you left off', icon: 'history', href: place.hash, intent: 'restore', pinned: true, boost: 30 });
    var s = OR.store.get().session || {};
    items.push({ group: 'Actions', title: s.running ? 'Pause session' : 'Start session', icon: 'stopwatch', run: s.running ? OR.sessionPause : OR.sessionStart, pinned: true, keywords: 'timer stopwatch study' });
    items.push({ group: 'Actions', title: 'Switch theme', icon: 'moon', run: A.theme, keywords: 'dark light mode', pinned: true });
    items.push({ group: 'Actions', title: 'Export progress backup', icon: 'download', run: function () { OR.store.exportFile(); }, keywords: 'save backup json' });
    OR.LANGS.forEach(function (l) { items.push({ group: 'Actions', title: 'Code language: ' + l[2], icon: 'code', run: function () { OR.setLang(l[0]); OR.toast('Code now shows in ' + l[2] + '.'); } }); });
    return items;
  });

  document.addEventListener('DOMContentLoaded', function () { OR.boot(); });
})();
